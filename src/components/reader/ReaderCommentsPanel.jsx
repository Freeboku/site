
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, X } from 'lucide-react';
import CommentSection from '@/components/comments/CommentSection';

const ReaderCommentsPanel = ({
  isVisible,
  onClose,
  webtoonId,
  chapterId,
  chapterNumber
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        id="reader-comments-panel"
        className="fixed top-0 right-0 h-full w-full md:w-[380px] bg-neutral-900 border-l border-neutral-700 shadow-lg z-30 flex flex-col text-white"
      >
        <div className="p-3 md:p-4 border-b border-neutral-700 flex justify-between items-center">
          <h3 className="text-base md:text-lg font-semibold">Commentaires (Ch. {chapterNumber})</h3>
          <Button variant="ghost" size="icon" onClick={onClose} title="Fermer les commentaires" className="text-neutral-300 hover:bg-neutral-700 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-grow overflow-y-auto p-3 md:p-4">
          <CommentSection webtoonId={webtoonId} chapterId={chapterId} />
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

export default ReaderCommentsPanel;
