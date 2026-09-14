import { AnimatePresence, motion } from "framer-motion";
import { Siren, Volume2 } from "lucide-react";
import { useDispatchBoard } from "@/context/DispatchContext";
import { cn } from "@/lib/utils";

export function NoaFlashOverlay() {
  const { flash, dismissFlash, isVoiceSpeaking } = useDispatchBoard();

  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismissFlash}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className={cn(
              "mx-6 flex max-w-5xl items-center gap-6 rounded-3xl border-4 bg-card p-10 shadow-md",
              flash.level === "critical"
                ? "border-destructive/60"
                : flash.level === "warning"
                  ? "border-accent/60"
                  : "border-primary/60",
            )}
          >
            <motion.span
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className={cn(
                "grid size-24 shrink-0 place-items-center rounded-3xl",
                flash.level === "critical"
                  ? "bg-destructive/15 text-destructive"
                  : flash.level === "warning"
                    ? "bg-accent/15 text-accent"
                    : "bg-primary/10 text-primary",
              )}
            >
              <Siren className="size-14" />
            </motion.span>
            <div>
              <div className="flex items-center gap-3">
                <div className="text-xl font-black text-muted-foreground">התראת נועה AI</div>
                {isVoiceSpeaking && (
                  <span className="flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-black text-purple-300 ring-1 ring-purple-400/50 animate-pulse">
                    <Volume2 className="size-3.5 animate-bounce text-purple-400" />
                    <span>קריינות קולית חיה בעברית...</span>
                  </span>
                )}
              </div>
              <p className="mt-2 text-5xl font-black leading-tight text-foreground">
                {flash.message}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
