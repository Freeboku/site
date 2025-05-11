
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getWebtoons } from '@/services/webtoonService'; // Import service
import { Loader2 } from 'lucide-react';

const variants = {
  enter: (direction) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 })
};

const swipeConfidenceThreshold = 5000;
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

const BannerCarousel = () => {
  const [bannerWebtoons, setBannerWebtoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [[page, direction], setPage] = useState([0, 0]);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const banners = await getWebtoons('', [], true); // filterBanners = true
        setBannerWebtoons(banners);
      } catch (error) {
        console.error("Failed to fetch banner webtoons:", error);
        // Optionally set an error state to display
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const paginate = useCallback((newDirection) => {
    if (bannerWebtoons.length === 0) return;
    setPage(prevPage => {
      const currentPage = prevPage[0];
      const newPage = (currentPage + newDirection + bannerWebtoons.length) % bannerWebtoons.length;
      return [newPage, newDirection];
    });
  }, [bannerWebtoons.length]);

  useEffect(() => {
    let timer;
    if (!isHovering && bannerWebtoons.length > 1) {
      timer = setInterval(() => paginate(1), 5000);
    }
    return () => clearInterval(timer);
  }, [isHovering, paginate, bannerWebtoons.length]);

  if (loading) {
    return (
      <div className="relative w-full aspect-[16/6] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bannerWebtoons || bannerWebtoons.length === 0) {
    return (
       <div className="relative w-full aspect-[16/6] bg-gradient-to-br from-primary/30 to-secondary/30 rounded-lg overflow-hidden flex items-center justify-center text-primary/80">
           <span>Aucune bannière configurée.</span>
       </div>
     );
  }

  const webtoonIndex = page % bannerWebtoons.length;
  const currentWebtoon = bannerWebtoons[webtoonIndex];

  return (
    <div 
      className="relative w-full aspect-[16/6] rounded-lg overflow-hidden shadow-xl cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) paginate(1);
            else if (swipe > swipeConfidenceThreshold) paginate(-1);
          }}
          className="absolute inset-0 w-full h-full"
        >
           <Link to={`/webtoon/${currentWebtoon.slug}`} className="block w-full h-full">
              <img  
                 className="absolute inset-0 w-full h-full object-cover brightness-75" 
                 alt={`Bannière pour ${currentWebtoon.title}`}
                 src={currentWebtoon.bannerImageUrl || currentWebtoon.coverImageUrl || 'https://images.unsplash.com/photo-1647589307181-3681cd0cb2fb'} 
                 onError={(e) => { e.target.onerror = null; e.target.src='https://images.unsplash.com/photo-1647589307181-3681cd0cb2fb'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 md:p-10 flex flex-col justify-end">
                 <motion.h2 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-2xl md:text-4xl font-bold text-white mb-2 line-clamp-2"
                 >
                    {currentWebtoon.title}
                 </motion.h2>
                 <motion.p 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-sm md:text-base text-gray-200 line-clamp-2 md:line-clamp-3"
                 >
                    {currentWebtoon.description || 'Découvrez cette série passionnante !'}
                 </motion.p>
              </div>
           </Link>
        </motion.div>
      </AnimatePresence>

      {bannerWebtoons.length > 1 && (
          <>
            <div className="absolute z-10 top-1/2 left-4 transform -translate-y-1/2">
               <Button variant="outline" size="icon" onClick={() => paginate(-1)} className="bg-black/30 hover:bg-black/60 text-white border-none rounded-full transition-opacity" style={{ opacity: isHovering ? 1 : 0 }} aria-label="Précédente">
                 <ChevronLeft className="h-6 w-6" />
               </Button>
             </div>
             <div className="absolute z-10 top-1/2 right-4 transform -translate-y-1/2">
               <Button variant="outline" size="icon" onClick={() => paginate(1)} className="bg-black/30 hover:bg-black/60 text-white border-none rounded-full transition-opacity" style={{ opacity: isHovering ? 1 : 0 }} aria-label="Suivante">
                 <ChevronRight className="h-6 w-6" />
               </Button>
             </div>
          </>
      )}
    </div>
  );
};

export default BannerCarousel;
