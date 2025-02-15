require("dotenv").config();
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";
import cors from "cors";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const app = express();
app.use(cors())
app.use(express.json())

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const response = await model.generateContent(
      "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra\n\n" + prompt
    );

    const answer = (await response.response.text()).trim().toLowerCase();

    if (answer === "react") {
        res.json({
            prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [reactBasePrompt]
        })
        return;
    }

    if (answer === "node") {
        res.json({
            prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [nodeBasePrompt]
        })
        return;
    }

    res.status(403).json({message: "You cant access this"})
    return;
})

app.post("/chat", async (req, res) => {
    const messages = req.body.messages;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const response = await model.generateContent({
        contents: messages,
        generationConfig: {
            maxOutputTokens: 8000,
        }
    });

    console.log(response);

    res.json({
        response: await response.response.text()
    });
})

app.listen(3000);
