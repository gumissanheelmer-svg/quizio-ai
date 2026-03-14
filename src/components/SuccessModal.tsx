import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const SuccessModal = ({ open, onClose, title, message }: SuccessModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md"
          >
            <div className="rounded-2xl border border-primary/20 bg-background p-8 shadow-2xl text-center space-y-5">
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-primary" />
                </motion.div>
              </div>
              <h2 className="text-xl font-heading font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {message}
              </p>
              <Button onClick={onClose} variant="glow" className="w-full">
                Fechar
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;
