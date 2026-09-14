import { useState } from "react";
import { Send, Zap } from "lucide-react";
import { useDispatchBoard } from "@/context/DispatchContext";
import type { AlertLevel } from "@/types/dispatch";
import { cn } from "@/lib/utils";

const TEMPLATES: { label: string; message: string; level: AlertLevel }[] = [
  { label: "עיכוב במחסן", message: "עיכוב בהעמסה במחסן — נהגים להמתין להנחיה", level: "warning" },
  {
    label: "הזמנה דחופה",
    message: "הזמנה דחופה נכנסה ללוח — לתעדף העמסה מיידית",
    level: "critical",
  },
  { label: "סבב יוצא", message: "סבב יוצא לדרך — נהגים לגשת לשער היציאה", level: "info" },
  {
    label: "הפסקת צהריים",
    message: "הפסקת צהריים 13:00-13:30 — חידוש העמסות ב-13:30",
    level: "info",
  },
  { label: "בטיחות", message: "תזכורת בטיחות: קסדה ואפוד בכל שטח המחסן", level: "warning" },
  { label: "סיום יום", message: "כל ההזמנות סופקו — כל הכבוד לצוות ההפצה!", level: "success" },
];

const LEVELS: { value: AlertLevel; label: string }[] = [
  { value: "info", label: "מידע" },
  { value: "warning", label: "אזהרה" },
  { value: "critical", label: "קריטי" },
  { value: "success", label: "הצלחה" },
];

export function QuickTemplates() {
  const { pushAlert } = useDispatchBoard();
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState<AlertLevel>("info");

  const send = (text: string, lvl: AlertLevel) => {
    if (!text.trim()) return;
    pushAlert(text.trim(), lvl, true);
    setMessage("");
  };

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-black text-foreground">
        <Zap className="size-4 text-accent" /> התראות מהירות של נועה AI
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            onClick={() => send(t.message, t.level)}
            className="rounded-xl border border-border/80 bg-secondary/60 px-3 py-2 text-right text-sm font-bold text-foreground transition hover:border-primary/40 hover:bg-primary/10"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="הודעה מתפרצת מותאמת אישית..."
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
        />
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition",
                  level === l.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/70",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => send(message, level)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-black text-accent-foreground transition hover:bg-accent/90"
          >
            <Send className="size-4" /> שדר
          </button>
        </div>
      </div>
    </section>
  );
}
