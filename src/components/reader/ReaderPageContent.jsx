
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ReaderPageContent = React.forwardRef(({ 
  page, 
  pageIndex, 
  webtoonTitle, 
  chapterNumber, 
  onPageClick,
  zoomLevel, 
  readingMode,
  isCurrentPage,
  mainNavHeight, 
  shouldPreload
}, ref) => {

  const actualScale = zoomLevel / 100;

  const imageContainerStyle = {
    width: (readingMode === 'webtoon' || readingMode === 'vertical') 
      ? `${Math.min(100, zoomLevel)}%` 
      : 'auto',
    maxWidth: (readingMode === 'webtoon' || readingMode === 'vertical') 
      ? `calc(900px * ${actualScale > 1 ? 1 : actualScale})` 
      : 'none', 
    margin: '0 auto',
    padding: 0,
  };

  const imageStyle = {
    width: '100%', 
    height: readingMode === 'horizontal' ? `calc(100vh - ${mainNavHeight}px - 40px)` : 'auto', 
    maxWidth: '100%', 
    maxHeight: readingMode === 'horizontal' ? `calc(100vh - ${mainNavHeight}px - 40px)` : 'none',
    objectFit: 'contain',
    display: 'block', 
    verticalAlign: 'top', 
    margin: 0, 
    padding: 0, 
  };

  const pageWrapperClasses = [
    "flex-shrink-0", 
    (readingMode === 'webtoon' || readingMode === 'vertical') 
      ? "w-full m-0 p-0" 
      : "h-full snap-center flex justify-center items-center px-0.5", 
    readingMode === 'horizontal' && !isCurrentPage ? "opacity-70 scale-95" : "",
    readingMode === 'horizontal' && isCurrentPage ? "opacity-100 scale-100" : "",
    "transition-all duration-300 ease-in-out"
  ].join(' ');
  
  const outerContainerStyle = readingMode === 'horizontal' 
    ? { width: '100vw', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' } 
    : { width: '100%', padding: 0, margin: 0 };

  return (
    <div 
      ref={ref} 
      className={pageWrapperClasses}
      data-page-index={pageIndex}
      style={outerContainerStyle}
      onClick={readingMode !== 'horizontal' ? onPageClick : undefined} 
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={page?.id || `page-motion-${pageIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex justify-center items-start" 
          style={{...imageContainerStyle}} 
        >
          {page?.publicUrl ? (
            <img
              src={page.publicUrl}
              alt={`Page ${pageIndex + 1} de ${webtoonTitle} Chapitre ${chapterNumber}`}
              style={imageStyle}
              loading={shouldPreload ? "eager" : "lazy"}
              decoding="async"
              onError={(e) => { 
                e.target.onerror = null; 
                e.target.alt = `Erreur de chargement - Page ${pageIndex + 1}`; 
                e.target.src="data:image/svg+xml;charset=utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20640%20960'%3E%3Crect%20width='640'%20height='960'%20fill='%232d2d2d'%20/%3E%3Ctext%20x='50%25'%20y='50%25'%20font-family='Arial'%20font-size='24'%20fill='%23ccc'%20text-anchor='middle'%20dominant-baseline='middle'%3EImage%20indisponible%3C/text%3E%3C/svg%3E";
              }}
            />
          ) : (
            <div 
              className="flex items-center justify-center text-muted-foreground bg-neutral-800" 
              style={{ 
                width: (readingMode === 'webtoon' || readingMode === 'vertical') ? '80%' : '300px', 
                height: (readingMode === 'horizontal') ? '80%' : '400px', 
                minHeight: '300px',
                margin: 'auto'
              }}
            >
              <p>Chargement page {pageIndex + 1}...</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

ReaderPageContent.displayName = 'ReaderPageContent';
export default ReaderPageContent;
