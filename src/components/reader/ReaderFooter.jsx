import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';

const ReaderFooter = ({
  currentPageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  prevChapterNumber,
  nextChapterNumber,
  isVisible,
  showComments,
  navChapters,
  slug,
  navigateToChapterBySlugAndNumber
}) => {
  if (!isVisible || showComments) return null;

  return (
    <motion.footer
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      exit={{ y: 80 }}
      transition={{ type: 'tween', duration: 0.3 }}
      id="reader-footer"
      className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-2 md:p-3"
    >
      <div className="container mx-auto flex justify-between items-center h-10 md:h-12">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onPrevPage} 
          disabled={currentPageIndex === 0 && !prevChapterNumber}
          title={currentPageIndex === 0 && prevChapterNumber ? `Chapitre Précédent (${prevChapterNumber})` : "Page Précédente"}
          className="text-white hover:bg-white/10 hover:text-white w-10 h-10 md:w-12 md:h-12"
        >
          {currentPageIndex === 0 && prevChapterNumber ? <SkipBack className="h-5 w-5 md:h-6 md:w-6" /> : <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />}
        </Button>
        
        <span className="text-sm text-gray-300">
          Page {currentPageIndex + 1} / {totalPages}
        </span>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onNextPage} 
          disabled={currentPageIndex === totalPages - 1 && !nextChapterNumber}
          title={currentPageIndex === totalPages - 1 && nextChapterNumber ? `Chapitre Suivant (${nextChapterNumber})` : "Page Suivante"}
          className="text-white hover:bg-white/10 hover:text-white w-10 h-10 md:w-12 md:h-12"
        >
          {currentPageIndex === totalPages - 1 && nextChapterNumber ? <SkipForward className="h-5 w-5 md:h-6 md:w-6" /> : <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />}
        </Button>
      </div>
      <div className="container mx-auto flex justify-between items-center h-10 md:h-12">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navChapters.previous && navigateToChapterBySlugAndNumber(slug, navChapters.previous.number)}
          disabled={!navChapters.previous}
          title={navChapters.previous ? `Chapitre Précédent (${navChapters.previous.number})` : "Chapitre Précédent"}
          className="text-white hover:bg-white/10 hover:text-white w-10 h-10 md:w-12 md:h-12"
        >
          <SkipBack className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onNextChapter={() => navChapters.next && navigateToChapterBySlugAndNumber(slug, navChapters.next.number)}
          disabled={!navChapters.next}
          title={navChapters.next ? `Chapitre Suivant (${navChapters.next.number})` : "Chapitre Suivant"}
          className="text-white hover:bg-white/10 hover:text-white w-10 h-10 md:w-12 md:h-12"
        >
          <SkipForward className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </div>
    </motion.footer>
  );
};

export default ReaderFooter;
