import { Code2, Eye } from "lucide-react";

interface TabViewProps {
  activeTab: "code" | "preview";
  onTabChange: (tab: "code" | "preview") => void;
}

export function TabView({ activeTab, onTabChange }: TabViewProps) {
  const tabs = [
    { id: "code" as const, label: "Code", icon: Code2 },
    { id: "preview" as const, label: "Preview", icon: Eye },
  ];

  return (
    <div
      className="flex gap-1 p-1 rounded-xl mb-3"
      style={{ background: "var(--color-bg-glass)" }}
    >
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background:
              activeTab === id ? "var(--color-bg-secondary)" : "transparent",
            color:
              activeTab === id
                ? "var(--color-text-primary)"
                : "var(--color-text-muted)",
            border:
              activeTab === id
                ? "1px solid var(--color-border)"
                : "1px solid transparent",
          }}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
