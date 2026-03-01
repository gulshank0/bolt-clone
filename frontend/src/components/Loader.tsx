import { Sparkles } from "lucide-react";

export function Loader() {
  return (
    <div className="flex items-center justify-center gap-3 w-full py-3">
      <div className="relative flex items-center gap-2">
        <Sparkles
          className="w-4 h-4 animate-pulse"
          style={{ color: "var(--color-accent)" }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Generating
        </span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                background: "var(--color-accent)",
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
