import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Code2, Zap, Globe } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "../config";

interface Model {
  id: string;
  name: string;
  description: string;
}

export function Home() {
  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate("/builder", { state: { prompt, model: selectedModel } });
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--gradient-bg)" }}
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(99, 235, 175, 0.15), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(91, 141, 239, 0.15), transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(99, 235, 175, 0.1), transparent 60%)",
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        className="relative z-10 px-6 py-4 flex justify-between items-center glass"
        style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}
      >
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => window.location.reload()}
        >
          <img 
            src="/logo.svg" 
            alt="TARS Logo" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-bold gradient-text tracking-tight">
            TARS
          </span>
        </div>
        <div className="flex items-center gap-1">
          {["Home", "About"].map((item) => (
            <button
              key={item}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-text-primary)";
                e.currentTarget.style.background = "var(--color-bg-glass)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-secondary)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 pb-16">
        {/* Badge */}
        <div className="animate-fade-in mb-8">
          <div
            className="glass px-4 py-2 rounded-full flex items-center gap-2"
            style={{ borderColor: "var(--color-border-active)" }}
          >
            <Zap
              className="w-3.5 h-3.5"
              style={{ color: "var(--color-accent)" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              AI-Powered Web Development
            </span>
          </div>
        </div>

        {/* Title */}
        <h1
          className="animate-fade-in-up text-center max-w-3xl mb-6"
          style={{ animationDelay: "0.1s", opacity: 0 }}
        >
          <span className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            Build websites with{" "}
            <span className="gradient-text">a single prompt</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-in-up text-center max-w-xl mb-12 text-lg"
          style={{
            color: "var(--color-text-secondary)",
            animationDelay: "0.2s",
            opacity: 0,
          }}
        >
          Describe your vision. TARS generates production-ready code, previews
          it live, and lets you iterate in real-time.
        </p>

        {/* Prompt Input */}
        <form
          onSubmit={handleSubmit}
          className="animate-fade-in-up w-full max-w-2xl"
          style={{ animationDelay: "0.3s", opacity: 0 }}
        >
          <div
            className="glass-card p-2 transition-all duration-300"
            style={{
              borderColor: isFocused
                ? "var(--color-border-active)"
                : "var(--color-border)",
              boxShadow: isFocused ? "var(--shadow-glow)" : "none",
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Describe the website you want to build..."
              className="w-full h-32 p-4 rounded-xl resize-none text-base focus:outline-none"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                color: "var(--color-text-primary)",
                border: "none",
              }}
            />
            <div className="flex justify-between items-center px-2 pb-2 pt-1 gap-4">
              <div className="flex-1 max-w-[200px]">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-black/40 text-xs py-2 px-3 rounded-lg border border-black text-gray-300 focus:outline-none focus:border-accent/40 cursor-pointer transition-colors"
                >
                  {models.map((m) => (
                    <option className="bg-black/80" key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                  {models.length === 0 && (
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  )}
                </select>
              </div>
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
              >
                Generate Web App
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Feature Cards */}
        <div
          className="animate-fade-in-up grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 w-full max-w-3xl"
          style={{ animationDelay: "0.5s", opacity: 0 }}
        >
          {[
            {
              icon: Code2,
              title: "Smart Code Gen",
              desc: "Full-stack React + Tailwind projects generated instantly",
            },
            {
              icon: Globe,
              title: "Live Preview",
              desc: "See your app running in a real browser sandbox",
            },
            {
              icon: Zap,
              title: "Iterate Fast",
              desc: "Refine with follow-up prompts — like chatting with a dev",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass-card p-6 group hover:border-opacity-20 transition-all duration-300 cursor-default"
              style={{ "--tw-border-opacity": 0.08 } as React.CSSProperties}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(99, 235, 175, 0.2)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-border)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "var(--color-accent-glow)" }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: "var(--color-accent)" }}
                />
              </div>
              <h3
                className="font-semibold mb-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                {title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
