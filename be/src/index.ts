import "dotenv/config";
import express from "express";
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";
import cors from "cors";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required. Add it to your .env file.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// All Free Tier Gemini Models (default: Gemini 2.5 Flash)
const MODEL_OPTIONS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Fast, thinking model — great for coding & multimodal",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Most capable 2.5 model — complex reasoning",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    description: "Lightweight & efficient for simpler tasks",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Fast and reliable previous-gen model",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash-Lite",
    description: "Smallest 2.0 model for high-volume tasks",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash (Preview)",
    description: "Next-gen Flash model — experimental",
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro (Preview)",
    description: "Next-gen Pro model — experimental",
  },
];

function getModel(
  modelName?: string,
  systemInstruction?: string,
): GenerativeModel {
  const modelId =
    MODEL_OPTIONS.find((m) => m.id === modelName)?.id || MODEL_OPTIONS[0].id;
  const options: any = {
    model: modelId,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  };
  if (systemInstruction) {
    options.systemInstruction = systemInstruction;
  }
  return genAI.getGenerativeModel(options);
}

// Retry with exponential backoff (only retries rate-limits & server errors)
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.httpStatusCode;
      const errMsg = error?.message || "";
      const isRateLimit = status === 429 || errMsg.includes("429");
      const isServerError = status >= 500;

      // Only retry on rate limits or server errors
      if (attempt === maxRetries || (!isRateLimit && !isServerError)) {
        throw error;
      }

      // Extract retry delay from error or use exponential backoff
      let delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      const retryMatch = error?.message?.match(/retry in (\d+)/i);
      if (retryMatch) {
        delay = Math.max(Number.parseInt(retryMatch[1]) * 1000, delay);
      }

      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries}, waiting ${delay / 1000}s...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

function formatError(error: any): { status: number; message: string } {
  const errMsg = error?.message || String(error);

  if (errMsg.includes("429") || errMsg.includes("quota")) {
    return {
      status: 429,
      message:
        "Rate limit exceeded. The Gemini API free tier quota has been reached. Please wait a few minutes and try again, or upgrade your API key at https://ai.google.dev",
    };
  }
  if (errMsg.includes("401") || errMsg.includes("API_KEY")) {
    return {
      status: 401,
      message:
        "Invalid API key. Please check your GEMINI_API_KEY in the .env file.",
    };
  }
  if (errMsg.includes("404")) {
    return {
      status: 404,
      message:
        "Model not found. The Gemini model may be unavailable. Please try again later.",
    };
  }
  return {
    status: 500,
    message: `AI generation failed: ${errMsg.substring(0, 200)}`,
  };
}

// Clean Gemini responses: strip thinking tags, markdown fences, etc.
function cleanGeminiResponse(text: string): string {
  let cleaned = text;

  // Remove <think>...</think> blocks (Gemini 2.5 thinking models)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "");

  // Remove markdown code fences that wrap artifact XML
  cleaned = cleaned.replace(
    /```(?:xml|html|tsx|jsx|typescript|javascript)?\s*\n?([\s\S]*?)```/g,
    "$1",
  );

  return cleaned.trim();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", model: MODEL_OPTIONS[0].id });
});

// Get available models
app.get("/models", (_req, res) => {
  res.json(MODEL_OPTIONS);
});

app.post("/template", async (req, res) => {
  try {
    const { prompt, model: selectedModel } = req.body;

    if (!prompt) {
      res.status(400).json({ message: "Prompt is required" });
      return;
    }

    const model = getModel(selectedModel);

    const response = await withRetry(async () => {
      return await model.generateContent(
        "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra. Do not use markdown formatting or code fences. Just the word.\n\n" +
          prompt,
      );
    });

    const answer = cleanGeminiResponse(response.response.text())
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    console.log(`[/template] Classified as: "${answer}" using ${model.model}`);

    if (answer.includes("react")) {
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
      return;
    }

    if (answer.includes("node")) {
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
      });
      return;
    }

    // Default to react
    console.log(
      `[/template] Unclear response "${answer}", defaulting to react`,
    );
    res.json({
      prompts: [
        BASE_PROMPT,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [reactBasePrompt],
    });
  } catch (error: any) {
    console.error("[/template] Error:", error?.message || error);
    const { status, message } = formatError(error);
    res.status(status).json({ message });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { messages, model: selectedModel } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ message: "Messages array is required" });
      return;
    }

    const model = getModel(selectedModel, getSystemPrompt());

    // Transform messages to Gemini format: { role, parts: [{ text }] }
    const geminiMessages = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }),
    );

    // Ensure first message is from user (Gemini requirement)
    if (geminiMessages[0]?.role !== "user") {
      geminiMessages.unshift({
        role: "user",
        parts: [{ text: "Hello" }],
      });
    }

    // Merge consecutive same-role messages (Gemini doesn't allow them)
    const mergedMessages = geminiMessages.reduce(
      (acc: typeof geminiMessages, msg: (typeof geminiMessages)[0]) => {
        const last = acc[acc.length - 1];
        if (last && last.role === msg.role) {
          last.parts[0].text += "\n\n" + msg.parts[0].text;
        } else {
          acc.push({ ...msg });
        }
        return acc;
      },
      [],
    );

    const history = mergedMessages.slice(0, -1);
    const lastMessage = mergedMessages[mergedMessages.length - 1];

    console.log(
      `[/chat] Sending ${mergedMessages.length} messages (history: ${history.length}) using ${model.model}`,
    );

    const result = await withRetry(async () => {
      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 32768,
        },
      });
      return await chat.sendMessage(lastMessage.parts[0].text);
    });

    const rawText = result.response.text();
    const responseText = cleanGeminiResponse(rawText);
    console.log(
      `[/chat] Response: ${rawText.length} chars raw, ${responseText.length} chars cleaned`,
    );

    if (!responseText) {
      res.status(500).json({
        message:
          "AI returned an empty response. This may be due to safety filters or rate limits. Please try again.",
      });
      return;
    }

    res.json({
      response: responseText,
    });
  } catch (error: any) {
    console.error("[/chat] Error:", error?.message || error);
    const { status, message } = formatError(error);
    res.status(status).json({ message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 TARS backend running on http://localhost:${PORT}`);
  console.log(`   Default Model: ${MODEL_OPTIONS[0].id}`);
  console.log(`   API Key: ${process.env.GEMINI_API_KEY?.substring(0, 10)}...`);
});
