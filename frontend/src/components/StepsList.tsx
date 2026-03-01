import { CheckCircle, Circle, Clock, ListChecks } from "lucide-react";
import { Step } from "../types";

interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function StepsList({ steps, currentStep, onStepClick }: StepsListProps) {
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "completed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <ListChecks
            className="w-4 h-4"
            style={{ color: "var(--color-accent)" }}
          />
          Build Steps
        </h2>
        {totalSteps > 0 && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: "var(--color-accent-glow)",
              color: "var(--color-accent)",
            }}
          >
            {completedSteps}/{totalSteps}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalSteps > 0 && (
        <div
          className="w-full h-1 rounded-full mb-4 overflow-hidden"
          style={{ background: "var(--color-bg-glass)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(completedSteps / totalSteps) * 100}%`,
              background: "var(--gradient-accent)",
            }}
          />
        </div>
      )}

      <div className="space-y-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className="p-2.5 rounded-xl cursor-pointer transition-all duration-200"
            style={{
              background:
                currentStep === step.id
                  ? "var(--color-bg-glass)"
                  : "transparent",
              border:
                currentStep === step.id
                  ? "1px solid var(--color-border)"
                  : "1px solid transparent",
            }}
            onClick={() => onStepClick(step.id)}
            onMouseEnter={(e) => {
              if (currentStep !== step.id) {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255, 255, 255, 0.02)";
              }
            }}
            onMouseLeave={(e) => {
              if (currentStep !== step.id) {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }
            }}
          >
            <div className="flex items-center gap-2.5">
              {step.status === "completed" ? (
                <CheckCircle
                  className="w-4 h-4 shrink-0"
                  style={{ color: "var(--color-accent)" }}
                />
              ) : step.status === "in-progress" ? (
                <Clock
                  className="w-4 h-4 shrink-0 animate-pulse"
                  style={{ color: "var(--color-accent-secondary)" }}
                />
              ) : (
                <Circle
                  className="w-4 h-4 shrink-0"
                  style={{ color: "var(--color-text-muted)" }}
                />
              )}
              <span
                className="text-sm font-medium truncate"
                style={{
                  color:
                    step.status === "completed"
                      ? "var(--color-text-secondary)"
                      : "var(--color-text-primary)",
                }}
              >
                {step.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
