
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"; // Added DialogClose import

// This component might not be needed anymore if the ReaderPage handles viewing directly.
// Keeping it for now in case it's used for single-image previews elsewhere.
// If ReaderPage is the sole viewer, this file can be removed later.

const ChapterViewer = ({ chapter, isOpen, onClose }) => {
  if (!chapter || !chapter.preview) return null; // Ensure chapter and preview exist

  // Determine if preview is an object or string
  const imageUrl = typeof chapter.preview === 'object' ? chapter.preview.preview : chapter.preview;
  const imageName = typeof chapter.preview === 'object' ? chapter.preview.name : chapter.name || 'Image';


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 border-b flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold truncate">{imageName}</DialogTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.open(imageUrl, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
             <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
             </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 bg-black/50 flex justify-center items-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={chapter.id || imageName} // Use chapter ID or image name as key
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={imageUrl}
                alt={imageName}
                className="max-h-full max-w-full object-contain rounded-md shadow-xl"
              />
            </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChapterViewer;
