
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Heart, Loader2, Eye, Sparkles, ThumbsUp, ArrowUpNarrowWide, ArrowDownNarrowWide, Lock } from 'lucide-react';
import { 
  getWebtoonBySlug, 
  isFavorite, 
  addFavorite, 
  removeFavorite, 
  getReadChapters,
  incrementWebtoonView,
  getSimilarWebtoons
} from '@/services/webtoonService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import NotFoundPage from './NotFoundPage';
import CommentSection from '@/components/comments/CommentSection';
import WebtoonCard from '@/components/WebtoonCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from '@/lib/supabaseClient';



const ChapterListItem = React.memo(({ chapter, webtoonId, isRead, isNew, showPublicViews }) => {
  const isRestricted = chapter.required_roles && chapter.required_roles.length > 0;
  return (
    <li>
      <Button 
        variant="ghost" 
        asChild 
        className={`w-full justify-start text-left h-auto py-2 px-3 hover:bg-muted/50 ${isRead ? 'opacity-60' : ''}`}
      >
        <Link to={`/webtoon/${webtoonId}/chapter/${chapter.id}`} className="flex items-center w-full">
          {isRead && <Eye className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />}
          <span className="truncate">Chapitre {chapter.number}</span>
          {isNew && !isRead && <Sparkles className="ml-2 h-4 w-4 text-yellow-400 flex-shrink-0" />}
          {isRestricted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center ml-2 flex-shrink-0">
                    <Lock className="h-4 w-4 text-amber-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Accès restreint aux rôles : {chapter.required_roles.join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {showPublicViews && (
              <span className="ml-auto text-xs text-muted-foreground flex-shrink-0 pl-2 items-center flex">
                <Eye className="mr-1 h-3 w-3" /> {(chapter.views || 0).toLocaleString()}
              </span>
          )}
          <span className="ml-2 text-xs text-muted-foreground flex-shrink-0 pl-2 border-l border-muted-foreground/20">
              {chapter.created_at ? new Date(chapter.created_at).toLocaleDateString('fr-FR') : ''}
          </span>
        </Link>
      </Button>
    </li>
  );
});


const WebtoonDetailPage = () => {
  const { slug } = useParams();
  const [webtoon, setWebtoon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [readChapters, setReadChapters] = useState([]);
  const [similarWebtoons, setSimilarWebtoons] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc'); 
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const defaultCoverImage = useMemo(() => 'https://images.unsplash.com/photo-1703596066601-6dca5e7639ba', []);

  const fetchWebtoonData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {

const { data: webtoonData } = await supabase
  .from('webtoons')
  .select('*, chapters(*)') 
  .eq('slug', slug)
  .single();

if (webtoonData) {
  setWebtoon(webtoonData);
  if (user && webtoonData.id) {
    const readData = await getReadChapters(user.id, webtoonData.id);
    setReadChapters(readData);
  }
  const similarData = await getSimilarWebtoons(webtoonData.id);
  setSimilarWebtoons(similarData);
} else {
  setError("Webtoon non trouvé.");
}

    } catch (err) {
      console.error("Failed to fetch webtoon details:", err);
      setError("Impossible de charger les détails du webtoon.");
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    fetchWebtoonData();
  }, [fetchWebtoonData]); 

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && webtoon) {
        setFavLoading(true);
        try {
          const favStatus = await isFavorite(user.id, webtoon.id);
          setIsFav(favStatus);
        } catch (err) {
          console.error("Failed to check favorite status:", err);
        } finally {
          setFavLoading(false);
        }
      } else {
         setIsFav(false);
      }
    };
    if (!authLoading && user && webtoon) {
       checkFavoriteStatus();
    } else if (!user) {
       setIsFav(false);
    }
  }, [user, webtoon, authLoading]);

  const handleToggleFavorite = useCallback(async () => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Vous devez être connecté pour ajouter aux favoris.", variant: "destructive" });
      return;
    }
    setFavLoading(true);
    try {
      if (isFav) {
        await removeFavorite(user.id, webtoon.id);
        setIsFav(false);
        toast({ title: "Retiré des favoris" });
      } else {
        await addFavorite(user.id, webtoon.id);
        setIsFav(true);
        toast({ title: "Ajouté aux favoris" });
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      toast({ title: "Erreur", description: `Impossible de modifier les favoris: ${err.message}`, variant: "destructive" });
    } finally {
      setFavLoading(false);
    }
  }, [user, webtoon?.id, isFav, toast]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
  }, []);

  const sortedChapters = useMemo(() => {
    if (!webtoon?.chapters) return [];
    return [...webtoon.chapters].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.number - b.number;
      } else {
        return b.number - a.number;
      }
    });
  }, [webtoon?.chapters, sortOrder]);

  const isChapterNew = useCallback((chapterCreatedAt) => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return new Date(chapterCreatedAt) > threeDaysAgo;
  }, []);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <NotFoundPage message={error} />;
  }
  if (!webtoon) {
    return <NotFoundPage message="Webtoon non trouvé." />;
  }

  const firstChapterToRead = sortOrder === 'asc' ? sortedChapters[0] : sortedChapters[sortedChapters.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 md:space-y-8"
    >
      <Button variant="outline" size="sm" asChild className="mb-4 md:mb-6">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Link>
      </Button>

      <Card className="overflow-hidden bg-card/70 backdrop-blur-sm shadow-lg">
        <div className="md:flex">
          <div className="md:flex-shrink-0 w-full md:w-1/3 lg:w-1/4 xl:w-1/5">
            <img  
              loading="lazy"
              className="h-auto w-full object-cover md:h-full aspect-[3/4] md:aspect-auto"
              alt={`Couverture de ${webtoon.title}`}
              src={webtoon.coverImageUrl || defaultCoverImage}
              onError={(e) => { e.currentTarget.src = defaultCoverImage; e.currentTarget.onerror = null; }} />
          </div>
          <div className="p-4 md:p-6 lg:p-8 flex-grow">
            <CardHeader className="p-0 mb-3 md:mb-4">
              <CardTitle className="text-2xl md:text-3xl font-bold mb-2 text-primary">{webtoon.title}</CardTitle>
              {webtoon.tags && webtoon.tags.length > 0 && (
                 <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                    {webtoon.tags.map(tag => (
                       <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">{tag}</span>
                    ))}
                 </div>
              )}
              <CardDescription className="text-sm md:text-base text-muted-foreground">
                {webtoon.description || "Aucune description disponible."}
              </CardDescription>
              {webtoon.showPublicViews && (
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <Eye className="mr-1.5 h-4 w-4" /> {(webtoon.views || 0).toLocaleString()} vues
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                 {sortedChapters.length > 0 && firstChapterToRead ? (
                    <Button asChild className="w-full sm:w-auto">
                       <Link to={`/webtoon/${webtoon.slug}/chapter/${firstChapterToRead.id}`}>
                        <BookOpen className="mr-2 h-4 w-4" /> Lire Ch. {firstChapterToRead.number}
                      </Link>
                    </Button>
                 ) : (
                    <Button disabled className="w-full sm:w-auto">
                       <BookOpen className="mr-2 h-4 w-4" /> Aucun chapitre
                    </Button>
                 )}
                <Button 
                   variant={isFav ? "secondary" : "outline"} 
                   onClick={handleToggleFavorite} 
                   disabled={favLoading || authLoading}
                   className="flex items-center w-full sm:w-auto"
                >
                  {favLoading ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                     <Heart className={`mr-2 h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                  )}
                  {isFav ? 'Favori' : 'Ajouter favori'}
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>

      <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl md:text-2xl">Liste des Chapitres ({sortedChapters.length})</CardTitle>
          {webtoon?.chapters && webtoon.chapters.length > 1 && (
            <Button variant="ghost" size="icon" onClick={toggleSortOrder} aria-label="Trier les chapitres">
              {sortOrder === 'asc' ? <ArrowUpNarrowWide className="h-5 w-5" /> : <ArrowDownNarrowWide className="h-5 w-5" />}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sortedChapters.length > 0 ? (
            <ul className="space-y-1.5 md:space-y-2">
              {sortedChapters.map((chapter) => (
                <ChapterListItem 
                  key={chapter.id}
                  chapter={chapter}
                  webtoonId={webtoon.id}
                  isRead={readChapters.includes(chapter.id)}
                  isNew={isChapterNew(chapter.created_at)}
                  showPublicViews={webtoon.showPublicViews}
                />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">Aucun chapitre n'a encore été publié pour ce webtoon.</p>
          )}
        </CardContent>
      </Card>

      {similarWebtoons && similarWebtoons.length > 0 && (
        <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl flex items-center">
              <ThumbsUp className="mr-2 h-6 w-6 text-primary" />
              Vous pourriez aussi aimer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {similarWebtoons.map((similarWt) => (
                <WebtoonCard key={similarWt.id} webtoon={similarWt} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <CommentSection webtoonId={webtoon?.id} />
    </motion.div>
  );
};

export default WebtoonDetailPage;
