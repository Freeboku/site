
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Loader2, Clock, TrendingUp, Lock } from 'lucide-react';
import { getWebtoons } from '@/services/webtoonService'; 
import { getLatestChapters } from '@/services/chapterService';
import EmptyState from '@/components/EmptyState';
import BannerCarousel from '@/components/BannerCarousel'; 
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const [allWebtoons, setAllWebtoons] = useState([]); 
  const [topWebtoons, setTopWebtoons] = useState([]);
  const [latestWebtoonsGrid, setLatestWebtoonsGrid] = useState([]);
  const [latestChapters, setLatestChapters] = useState([]);
  const [loadingWebtoons, setLoadingWebtoons] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [error, setError] = useState(null);
  const topWebtoonsRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const { user, userRole } = useAuth();


  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingWebtoons(true);
      setLoadingChapters(true);
      setError(null);
      try {
        const [webtoonsData, chaptersData] = await Promise.all([
          getWebtoons(), 
          getLatestChapters(16, user?.id, userRole) 
        ]);
        
        if (webtoonsData) {
          setAllWebtoons(webtoonsData);
          setTopWebtoons(webtoonsData.slice(0, 8)); 
          setLatestWebtoonsGrid(webtoonsData.slice(0, 12));
        } else {
          setAllWebtoons([]);
          setTopWebtoons([]);
          setLatestWebtoonsGrid([]);
        }
        setLoadingWebtoons(false);

        if (chaptersData) {
          setLatestChapters(chaptersData);
        } else {
          setLatestChapters([]);
        }
        setLoadingChapters(false);
        
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Impossible de charger le contenu. Veuillez réessayer plus tard.");
        setLoadingWebtoons(false);
        setLoadingChapters(false);
      } 
    };

    fetchAllData();
  }, [user, userRole]);

  const handleMouseDown = (e) => {
    if (!topWebtoonsRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - topWebtoonsRef.current.offsetLeft);
    setScrollLeft(topWebtoonsRef.current.scrollLeft);
    topWebtoonsRef.current.style.cursor = 'grabbing';
    topWebtoonsRef.current.style.userSelect = 'none';
  };

  const handleMouseLeaveOrUp = () => {
    if (!topWebtoonsRef.current) return;
    setIsDragging(false);
    topWebtoonsRef.current.style.cursor = 'grab';
    topWebtoonsRef.current.style.removeProperty('user-select');
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !topWebtoonsRef.current) return;
    e.preventDefault();
    const x = e.pageX - topWebtoonsRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    topWebtoonsRef.current.scrollLeft = scrollLeft - walk;
  };


  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 }}};
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 }};
  const defaultCover = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150' viewBox='0 0 100 150'%3E%3Crect width='100' height='150' fill='%23333'/%3E%3Ctext x='50' y='75' font-family='Arial' font-size='12' fill='%23888' text-anchor='middle' dominant-baseline='middle'%3ECover%3C/text%3E%3C/svg%3E";
  const defaultThumbnail = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23333'/%3E%3Ctext x='80' y='45' font-family='Arial' font-size='10' fill='%23888' text-anchor='middle' dominant-baseline='middle'%3EThumbnail%3C/text%3E%3C/svg%3E";

   if (loadingWebtoons && loadingChapters) {
     return (
       <div className="flex flex-col justify-center items-center py-20 space-y-4 min-h-screen">
         <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary" />
         <span className="text-muted-foreground text-sm md:text-base">Chargement du contenu...</span>
       </div>
     );
   }

   if (error) {
      return (
        <div className="text-center py-20 bg-destructive/10 text-destructive rounded-lg min-h-screen flex flex-col justify-center items-center px-4">
          <p className="text-lg md:text-xl font-semibold mb-2">Erreur</p>
          <p className="text-sm md:text-base">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Réessayer</Button>
        </div>
      );
   }

  return (
    <div className="space-y-10 md:space-y-16 pb-16">
      {!loadingWebtoons && <BannerCarousel />}

      {!loadingWebtoons && topWebtoons.length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 flex items-center">
            <Star className="mr-2 md:mr-3 h-6 w-6 md:h-7 md:w-7 text-yellow-400" /> Top Webtoons
          </h2>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-6 md:w-8 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none -ml-4"></div>
            <div className="absolute right-0 top-0 bottom-0 w-6 md:w-8 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none -mr-4"></div>
            <motion.div
              ref={topWebtoonsRef}
              variants={containerVariants} initial="hidden" animate="visible"
              className="flex space-x-4 md:space-x-6 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 cursor-grab"
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
            >
              {topWebtoons.map((webtoon) => (
                <motion.div key={webtoon.id} variants={itemVariants} className="flex-shrink-0 w-48 sm:w-56 md:w-64 lg:w-72">
                  <Card className="bg-card/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col rounded-lg overflow-hidden group border-border/30">
                    <Link to={`/webtoon/${webtoon.slug}`} className="block" draggable="false">
                      <CardHeader className="p-0">
                        <div className="aspect-[3/4] bg-muted overflow-hidden">
                          <img  
                            draggable="false"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={`Couverture de ${webtoon.title}`} 
                            src={webtoon.coverImageUrl || webtoon.bannerImageUrl || defaultCover} 
                            onError={(e) => { e.target.onerror = null; e.target.src=defaultCover; }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 md:p-4 flex-grow">
                        <CardTitle className="text-base md:text-lg mb-1 md:mb-2 line-clamp-2 group-hover:text-primary transition-colors">{webtoon.title}</CardTitle>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
                          {webtoon.description || "Aucune description disponible."}
                        </p>
                      </CardContent>
                    </Link>
                    <CardFooter className="p-3 md:p-4 border-t border-border/30 mt-auto">
                      <Button variant="outline" size="sm" className="w-full hover:bg-primary/10 hover:text-primary transition-colors text-xs md:text-sm" asChild>
                        <Link to={`/webtoon/${webtoon.slug}`} draggable="false">Voir Plus</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}
      
      {!loadingChapters && latestChapters.length > 0 && (
         <section id="latest-chapters">
           <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 flex items-center">
              <Clock className="mr-2 md:mr-3 h-6 w-6 md:h-7 md:w-7 text-primary/80" /> Derniers Chapitres
           </h2>
           <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
             {latestChapters.map((chapter) => (
               <motion.div key={chapter.id} variants={itemVariants}>
                 <Link to={`/webtoon/${chapter.webtoonId}/chapter/${chapter.id}`}>
                    <Card className="overflow-hidden group bg-card/70 backdrop-blur-sm border-border/30 hover:shadow-lg transition-all duration-300 rounded-lg h-full flex flex-col">
                      <div className="aspect-video overflow-hidden bg-muted relative">
                         <img  
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                           alt={`Miniature Chapitre ${chapter.number} de ${chapter.webtoonTitle}`} 
                           src={chapter.thumbnailUrl || defaultThumbnail}
                           onError={(e) => { e.target.onerror = null; e.target.src=defaultThumbnail; }}
                         />
                         {chapter.required_roles && chapter.required_roles.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                                    <Lock className="h-4 w-4 text-amber-400" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Accès restreint aux rôles : {chapter.required_roles.join(', ')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                      </div>
                      <CardContent className="p-2 md:p-3 flex-grow">
                         <h3 className="font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
                           {chapter.webtoonTitle}
                         </h3>
                         <h4 className="text-xs md:text-sm text-muted-foreground group-hover:text-primary/80 transition-colors">
                           Chapitre {chapter.number}
                         </h4>
                      </CardContent>
                       <CardFooter className="p-2 md:p-3 border-t border-border/30">
                         <p className="text-xs text-muted-foreground flex items-center">
                           <Clock className="h-3 w-3 mr-1 md:mr-1.5 flex-shrink-0" />
                           {chapter.createdAt ? formatDistanceToNow(new Date(chapter.createdAt), { addSuffix: true, locale: fr }) : 'Date inconnue'}
                         </p>
                       </CardFooter>
                    </Card>
                 </Link>
               </motion.div>
             ))}
           </motion.div>
         </section>
      )}

      {!loadingWebtoons && latestWebtoonsGrid.length > 0 && (
        <section id="latest-grid">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 flex items-center">
            <TrendingUp className="mr-2 md:mr-3 h-6 w-6 md:h-7 md:w-7 text-green-500" /> Mises à Jour
          </h2>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
              {latestWebtoonsGrid.map((webtoon) => (
                <motion.div key={webtoon.id} variants={itemVariants}>
                  <Link to={`/webtoon/${webtoon.slug}`}>
                    <Card className="overflow-hidden h-full group manga-card bg-card/70 backdrop-blur-sm border-border/30 hover:shadow-lg transition-all duration-300 rounded-lg">
                      <div className="aspect-[3/4] overflow-hidden bg-muted">
                        <img  
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          alt={`Couverture de ${webtoon.title}`} 
                          src={webtoon.coverImageUrl || defaultCover}
                          onError={(e) => { e.target.onerror = null; e.target.src=defaultCover; }}
                        />
                      </div>
                      <CardContent className="p-2 md:p-3">
                        <h3 className="font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
                          {webtoon.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {webtoon.chapterCount || 0} Chapitres
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
        </section>
       )}
       
      {(!loadingWebtoons && latestWebtoonsGrid.length === 0 && topWebtoons.length === 0) &&
       (!loadingChapters && latestChapters.length === 0) &&
       !error && (
        <EmptyState 
            containerClassName="min-h-[calc(100vh-20rem)]"
            title="Bienvenue sur ScanTrad Hub !" 
            message="Aucun contenu n'est disponible pour le moment. Les administrateurs travaillent à ajouter de nouvelles séries et chapitres. Revenez bientôt !" 
        />
      )}
    </div>
  );
};

export default HomePage;
