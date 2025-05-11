
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, BookOpen, MessageSquare, X, SkipBack, SkipForward } from 'lucide-react';

const ReaderHeader = ({
  webtoonTitle,
  chapterNumber,
  webtoonId,
  currentChapterId,
  allChapters,
  onChapterChange,
  onToggleComments,
  showComments,
  isVisible,
  mainNavHeight,
  onPrevChapter,
  onNextChapter,
  hasPrevChapter,
  hasNextChapter
}) => {
  if (!isVisible) return null;

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      exit={{ y: -80 }}
      transition={{ type: 'tween', duration: 0.3 }}
      id="reader-header"
      className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 via-black/50 to-transparent p-2 md:p-3"
      style={{ height: `${mainNavHeight}px` }} 
    >
      <div className="container mx-auto flex justify-between items-center h-full">
        <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
          <Button variant="ghost" size="icon" asChild className="w-8 h-8 md:w-10 md:h-10 text-white hover:bg-white/10 hover:text-white">
            <Link to={`/webtoon/${webtoonId}`} title="Retour au webtoon">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </Button>
           <Button variant="ghost" size="icon" onClick={onPrevChapter} disabled={!hasPrevChapter} title="Chapitre Précédent" className="w-8 h-8 md:w-10 md:h-10 text-white hover:bg-white/10 hover:text-white">
            <SkipBack className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div className="font-semibold truncate shrink text-sm md:text-base text-white" title={webtoonTitle}>
            <span className="hidden sm:inline">{webtoonTitle}</span>
            <span className="sm:hidden">WT</span>
          </div>
          <span className="text-xs md:text-sm text-gray-300 flex-shrink-0">- Ch. {chapterNumber}</span>
           <Button variant="ghost" size="icon" onClick={onNextChapter} disabled={!hasNextChapter} title="Chapitre Suivant" className="w-8 h-8 md:w-10 md:h-10 text-white hover:bg-white/10 hover:text-white">
            <SkipForward className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onToggleComments} title="Commentaires" className={`w-8 h-8 md:w-10 md:h-10 text-white hover:bg-white/10 hover:text-white ${showComments ? 'bg-white/20' : ''}`}>
            <MessageSquare className={`h-4 w-4 md:h-5 md:w-5 ${showComments ? 'text-primary-foreground' : ''}`} />
          </Button>
          <Select onValueChange={onChapterChange} value={currentChapterId}>
            <SelectTrigger className="w-[100px] sm:w-[130px] md:w-[150px] h-8 md:h-9 text-xs bg-black/40 border-gray-500 hover:bg-black/60 focus:ring-primary text-white">
              <SelectValue placeholder="Chapitre" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700 text-white max-h-60">
              {allChapters.length > 0 ? allChapters.map(ch => (
                <SelectItem key={ch.id} value={ch.id} className="text-xs md:text-sm hover:bg-neutral-700 focus:bg-neutral-600"> Chapitre {ch.number} </SelectItem>
              )) : (
                <SelectItem value={currentChapterId} disabled className="text-xs md:text-sm">Chapitre {chapterNumber}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" asChild className="w-8 h-8 md:w-10 md:h-10 text-white hover:bg-white/10 hover:text-white">
            <Link to="/" title="Accueil"> <Home className="h-4 w-4 md:h-5 md:w-5" /> </Link>
          </Button>
           <Button variant="ghost" size="icon" asChild className="w-8 h-8 md:w-10 md:h-10 text-red-400 hover:bg-red-500/20 hover:text-red-300">
            <Link to={`/webtoon/${webtoonId}`} title="Quitter le lecteur"> <X className="h-4 w-4 md:h-5 md:w-5" /> </Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default ReaderHeader;
