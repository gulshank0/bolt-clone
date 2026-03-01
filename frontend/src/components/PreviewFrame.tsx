import { WebContainer } from "@webcontainer/api";
import { useEffect, useState } from "react";
import { Globe, RefreshCw } from "lucide-react";

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function main() {
    const installProcess = await webContainer.spawn("npm", ["install"]);

    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        },
      }),
    );

    await webContainer.spawn("npm", ["run", "dev"]);

    webContainer.on("server-ready", (_port, url) => {
      setUrl(url);
      setIsLoading(false);
    });
  }

  useEffect(() => {
    main();
  }, []);

  return (
    <div
      className="h-full flex flex-col rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)" }}
    >
      {/* URL bar */}
      <div
        className="px-3 py-2 flex items-center gap-2 shrink-0"
        style={{
          background: "var(--color-bg-secondary)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <Globe
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: "var(--color-accent)" }}
        />
        <div
          className="flex-1 px-3 py-1.5 rounded-lg text-xs truncate"
          style={{
            background: "var(--color-bg-glass)",
            color: url
              ? "var(--color-text-secondary)"
              : "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          {url || "Loading preview..."}
        </div>
        {url && (
          <button
            onClick={() => {
              const iframe = document.querySelector("iframe");
              if (iframe) iframe.src = url;
            }}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--color-text-muted)" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative" style={{ background: "#ffffff" }}>
        {isLoading && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: "var(--color-bg-primary)" }}
          >
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "var(--color-border)",
                  borderTopColor: "var(--color-accent)",
                }}
              />
            </div>
            <div className="text-center">
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--color-text-primary)" }}
              >
                Starting preview server...
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Installing dependencies & booting WebContainer
              </p>
            </div>
          </div>
        )}
        {url && (
          <iframe
            width="100%"
            height="100%"
            src={url}
            title="Preview"
            className="border-0"
          />
        )}
      </div>
    </div>
  );
}
