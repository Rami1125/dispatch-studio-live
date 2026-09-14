import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useDispatchBoard } from "@/context/DispatchContext";
import { BroadcastControl } from "./BroadcastControl";
import { OrderEditor } from "./OrderEditor";
import { QuickTemplates } from "./QuickTemplates";
import { AITrainerStudio } from "./AITrainerStudio";

export function StudioDrawer() {
  const { isStudioOpen, closeStudio } = useDispatchBoard();

  return (
    <AnimatePresence>
      {isStudioOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeStudio}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[440px] max-w-[92vw] flex-col border-l border-border/80 bg-card/95 shadow-md backdrop-blur-md"
          >
            <header className="flex items-center justify-between border-b border-border/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <SlidersHorizontal className="size-5" />
                </span>
                <div>
                  <div className="text-base font-black text-foreground">סטודיו ניהול</div>
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    Ctrl + Shift + E · Esc
                  </div>
                </div>
              </div>
              <button
                onClick={closeStudio}
                aria-label="סגירה"
                className="grid size-9 place-items-center rounded-xl bg-secondary text-muted-foreground transition hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <AITrainerStudio />
              <BroadcastControl />
              <QuickTemplates />
              <OrderEditor />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
