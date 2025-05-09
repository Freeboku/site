
import React from "react";
import { motion } from "framer-motion";
import { FileWarning, Upload } from "lucide-react"; // Changed icon
import { Button } from "@/components/ui/button";

const EmptyState = ({ title = "Rien à afficher ici", message = "Il semble qu'il n'y ait pas encore de contenu.", actionText, onActionClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center p-8 text-center h-[50vh] bg-muted/30 rounded-lg border border-dashed border-border/50"
    >
      <div className="bg-primary/10 p-5 rounded-full mb-6">
        <FileWarning className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {message}
      </p>
      {onActionClick && actionText && (
        <Button onClick={onActionClick} size="lg">
          <Upload className="mr-2 h-5 w-5" />
          {actionText}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
