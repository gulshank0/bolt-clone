import Editor from "@monaco-editor/react";
import { FileItem } from "../types";
import { FileCode2 } from "lucide-react";

interface CodeEditorProps {
  file: FileItem | null;
}

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
    svg: "xml",
    xml: "xml",
    py: "python",
    sh: "shell",
    yaml: "yaml",
    yml: "yaml",
  };
  return languageMap[ext || ""] || "plaintext";
}

export function CodeEditor({ file }: CodeEditorProps) {
  if (!file) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-3 rounded-xl"
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
        }}
      >
        <FileCode2
          className="w-10 h-10"
          style={{ color: "var(--color-text-muted)" }}
        />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Select a file to view its contents
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-full rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)" }}
    >
      {/* File name header */}
      <div
        className="px-4 py-2 flex items-center gap-2"
        style={{
          background: "var(--color-bg-secondary)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <FileCode2
          className="w-3.5 h-3.5"
          style={{ color: "var(--color-accent)" }}
        />
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {file.path}
        </span>
      </div>
      <Editor
        height="calc(100% - 36px)"
        language={getLanguage(file.name)}
        theme="vs-dark"
        value={file.content || ""}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          wordWrap: "on",
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          lineNumbersMinChars: 3,
          renderLineHighlight: "gutter",
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
    </div>
  );
}
