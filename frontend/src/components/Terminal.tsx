import { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";

interface TerminalProps {
  readonly webcontainer: WebContainer | null;
}

export default function Terminal({ webcontainer }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current || !webcontainer) return;

    const xterm = new XTerminal({
      cursorBlink: true,
      theme: {
        background: "transparent",
        foreground: "var(--color-text-secondary)",
        cursor: "var(--color-accent)",
        selectionBackground: "var(--color-bg-secondary)",
      },
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.2,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    let shellProcess: WebContainerProcess | undefined;

    async function initTerminal() {
      // Create a webcontainer process
      try {
        shellProcess = await webcontainer.spawn("jsh", {
          terminal: {
            cols: xterm.cols,
            rows: xterm.rows,
          },
        });

        // Write output from webcontainer to the terminal
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              xterm.write(data);
            },
          })
        );

        // Send input from terminal to the webcontainer process
        const input = shellProcess.input.getWriter();
        xterm.onData((data) => {
          input.write(data);
        });

      } catch (err) {
        console.error("Failed to start terminal process:", err);
        xterm.write("\r\n\x1b[31mFailed to start terminal.\x1b[0m\r\n");
      }
    }

    initTerminal();

    const handleResize = () => {
      fitAddon.fit();
      if (shellProcess) {
        shellProcess.resize({
          cols: xterm.cols,
          rows: xterm.rows,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    
    // Slight delay to ensure parent container layout is settled before fitting
    setTimeout(() => handleResize(), 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (shellProcess) {
        shellProcess.kill();
      }
      xterm.dispose();
    };
  }, [webcontainer]);

  return (
    <div
      className="w-full h-full rounded-lg border bg-black/50 overflow-hidden"
      style={{ borderColor: "var(--color-border)", minHeight: "200px" }}
    >
      <div className="w-full h-full" ref={terminalRef} />
    </div>
  );
}