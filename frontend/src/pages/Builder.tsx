import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StepsList } from "../components/StepsList";
import { FileExplorer } from "../components/FileExplorer";
import { TabView } from "../components/TabView";
import { CodeEditor } from "../components/CodeEditor";
import { PreviewFrame } from "../components/PreviewFrame";
import Terminal from "../components/Terminal";
import { Step, FileItem, StepType } from "../types";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { parseXml } from "../steps";
import { useWebContainer } from "../hooks/useWebContainer";
import { FileSystemTree } from "@webcontainer/api";
import { Loader } from "../components/Loader";
import { Sparkles, ArrowLeft, Send, AlertTriangle } from "lucide-react";

interface Model {
  id: string;
  name: string;
  description: string;
}

export function Builder() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prompt, model: initialModel } = (location.state as {
    prompt: string;
    model?: string;
  }) || { prompt: "" };

  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState(
    initialModel || "gemini-2.5-flash",
  );

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/models`);
        setModels(response.data);
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps
      .filter(({ status }) => status === "pending")
      .map((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split("/") ?? [];
          let currentFileStructure = [...originalFiles];
          const finalAnswerRef = currentFileStructure;

          let currentFolder = "";
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            const currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              const file = currentFileStructure.find(
                (x) => x.path === currentFolder,
              );
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "file",
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              const folder = currentFileStructure.find(
                (x) => x.path === currentFolder,
              );
              if (!folder) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: "folder",
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder,
              )!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => ({
          ...s,
          status: "completed",
        })),
      );
    }
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): FileSystemTree => {
      const mountStructure: FileSystemTree = {};

      const processFile = (file: FileItem, isRootFolder: boolean) => {
        if (file.type === "folder") {
          mountStructure[file.name] = {
            directory: file.children
              ? Object.fromEntries(
                  file.children.map((child) => [
                    child.name,
                    processFile(child, false),
                  ]),
                )
              : {},
          };
        } else if (file.type === "file") {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || "",
              },
            };
          } else {
            return {
              file: {
                contents: file.content || "",
              },
            };
          }
        }

        return mountStructure[file.name];
      };

      files.forEach((file) => processFile(file, true));
      return mountStructure;
    };

    const mountStructure = createMountStructure(files);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    try {
      setError(null);
      const response = await axios.post(`${BACKEND_URL}/template`, {
        prompt: prompt.trim(),
        model: selectedModel,
      });
      setTemplateSet(true);

      const { prompts, uiPrompts } = response.data;

      setSteps(
        parseXml(uiPrompts[0]).map((x: Step) => ({
          ...x,
          status: "pending" as const,
        })),
      );

      setLoading(true);
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...prompts, prompt].map((content) => ({
          role: "user" as const,
          content,
        })),
        model: selectedModel,
      });

      setLoading(false);

      setSteps((s) => [
        ...s,
        ...parseXml(stepsResponse.data.response).map((x) => ({
          ...x,
          status: "pending" as const,
        })),
      ]);

      setLlmMessages(
        [...prompts, prompt].map((content) => ({
          role: "user" as const,
          content,
        })),
      );

      setLlmMessages((x) => [
        ...x,
        { role: "assistant", content: stepsResponse.data.response },
      ]);
    } catch (err: any) {
      console.error("Init error:", err);
      setLoading(false);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to connect to backend. Make sure the server is running.",
      );
    }
  }

  useEffect(() => {
    if (prompt) {
      init();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!userPrompt.trim()) return;

    const newMessage = {
      role: "user" as const,
      content: userPrompt,
    };

    setPrompt("");
    setLoading(true);
    setError(null);

    try {
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...llmMessages, newMessage],
        model: selectedModel,
      });

      setLoading(false);
      setLlmMessages((x) => [...x, newMessage]);
      setLlmMessages((x) => [
        ...x,
        {
          role: "assistant",
          content: stepsResponse.data.response,
        },
      ]);

      setSteps((s) => [
        ...s,
        ...parseXml(stepsResponse.data.response).map((x) => ({
          ...x,
          status: "pending" as const,
        })),
      ]);
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || "Failed to send message");
    }
  };

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Header */}
      <header
        className="glass px-5 py-3 flex items-center justify-between shrink-0"
        style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white/5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold gradient-text">TARS</span>
          </div>
          <div
            className="h-4 w-px"
            style={{ background: "var(--color-border)" }}
          />
          <p
            className="text-sm truncate max-w-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {prompt}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-white/5 text-[11px] py-1.5 px-3 rounded-lg border border-white/10 text-gray-400 focus:outline-none focus:border-accent/40 cursor-pointer transition-colors"
          >
            {models.map((m) => (
              <option className="bg-slate-950 text-gray-300" key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
            {models.length === 0 && (
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            )}
          </select>

          {loading && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "var(--color-accent-glow)" }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "var(--color-accent)" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-accent)" }}
              >
                Generating...
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div
        className="flex-1 overflow-hidden grid grid-cols-12 gap-0"
        style={{ minHeight: 0 }}
      >
        {/* Left Panel: Steps + Chat */}
        <div
          className="col-span-3 flex flex-col overflow-hidden"
          style={{ borderRight: "1px solid var(--color-border)" }}
        >
          <div className="flex-1 overflow-auto p-4">
            <StepsList
              steps={steps}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />
          </div>

          {/* Error display */}
          {error && (
            <div
              className="mx-4 mb-2 p-3 rounded-lg flex items-start gap-2 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: "#ef4444" }}
              />
              <span style={{ color: "#fca5a5" }}>{error}</span>
            </div>
          )}

          {/* Chat Input */}
          <div
            className="p-4 shrink-0"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            {loading || !templateSet ? (
              <Loader />
            ) : (
              <div className="flex gap-2">
                <textarea
                  value={userPrompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask TARS to make changes..."
                  className="flex-1 p-3 rounded-xl resize-none text-sm focus:outline-none transition-all duration-200"
                  style={{
                    background: "var(--color-bg-glass)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    minHeight: "44px",
                    maxHeight: "120px",
                  }}
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userPrompt.trim() || loading}
                  className="p-3 rounded-xl transition-all duration-200 disabled:opacity-30"
                  style={{
                    background: "var(--gradient-accent)",
                    color: "#0a0a0f",
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel: File Explorer */}
        <div
          className="col-span-2 flex flex-col overflow-hidden"
          style={{ borderRight: "1px solid var(--color-border)" }}
        >
          <div className="flex-1 overflow-auto">
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>
          <div className="h-64" style={{ borderTop: "1px solid var(--color-border)" }}>
            <Terminal webcontainer={webcontainer || null} />
          </div>
        </div>

        {/* Right Panel: Code/Preview */}
        <div className="col-span-7 flex flex-col overflow-hidden">
          <div className="px-4 pt-3">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          <div className="flex-1 overflow-hidden p-4 pt-0">
            {activeTab === "code" && <CodeEditor file={selectedFile} />}
            {activeTab === "preview" && webcontainer && <PreviewFrame webContainer={webcontainer} files={files} />}
          </div>
        </div>
      </div>
    </div>
  );
}
