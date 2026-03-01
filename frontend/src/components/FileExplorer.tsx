import { useState } from "react";
import {
  FolderOpen,
  FileCode2,
  ChevronRight,
  ChevronDown,
  FolderTree,
} from "lucide-react";
import { FileItem } from "../types";

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
}

interface FileNodeProps {
  item: FileItem;
  depth: number;
  onFileClick: (file: FileItem) => void;
  selectedPath: string | null;
}

function FileNode({ item, depth, onFileClick, selectedPath }: FileNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const isSelected = item.path === selectedPath;

  const handleClick = () => {
    if (item.type === "folder") {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(item);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    const colorMap: Record<string, string> = {
      tsx: "#61dafb",
      ts: "#3178c6",
      jsx: "#61dafb",
      js: "#f7df1e",
      css: "#1572b6",
      html: "#e34f26",
      json: "#a8b1c2",
      md: "#ffffff",
      svg: "#ffb13b",
    };
    return colorMap[ext || ""] || "var(--color-text-muted)";
  };

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-150"
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          background: isSelected ? "var(--color-bg-glass)" : "transparent",
          borderLeft: isSelected
            ? "2px solid var(--color-accent)"
            : "2px solid transparent",
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(255, 255, 255, 0.02)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >
        {item.type === "folder" && (
          <span
            className="transition-transform duration-150"
            style={{ color: "var(--color-text-muted)" }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
        {item.type === "folder" ? (
          <FolderOpen
            className="w-4 h-4 shrink-0"
            style={{ color: isExpanded ? "#f7c948" : "#8888a0" }}
          />
        ) : (
          <FileCode2
            className="w-4 h-4 shrink-0"
            style={{ color: getFileIcon(item.name) }}
          />
        )}
        <span
          className="text-xs truncate"
          style={{
            color: isSelected
              ? "var(--color-text-primary)"
              : "var(--color-text-secondary)",
          }}
        >
          {item.name}
        </span>
      </div>
      {item.type === "folder" && isExpanded && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ files, onFileSelect }: FileExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const handleFileClick = (file: FileItem) => {
    setSelectedPath(file.path);
    onFileSelect(file);
  };

  return (
    <div className="p-3 h-full">
      <h2
        className="text-sm font-semibold mb-3 flex items-center gap-2 px-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <FolderTree
          className="w-4 h-4"
          style={{ color: "var(--color-accent)" }}
        />
        Explorer
      </h2>
      <div className="space-y-0.5">
        {files.map((file, index) => (
          <FileNode
            key={`${file.path}-${index}`}
            item={file}
            depth={0}
            onFileClick={handleFileClick}
            selectedPath={selectedPath}
          />
        ))}
        {files.length === 0 && (
          <p
            className="text-xs px-2 py-4 text-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            Files will appear here once generated
          </p>
        )}
      </div>
    </div>
  );
}
