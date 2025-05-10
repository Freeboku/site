
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldAlert, Lock, Coffee } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getChapterWithPages, getPreviousAndNextChapter, incrementChapterView } from '@/services/chapterService';
import { markChapterAsRead } from '@/services/webtoonService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import NotFoundPage from './NotFoundPage';
import ReaderHeader from '@/components/reader/ReaderHeader';
import ReaderPageContent from '@/components/reader/ReaderPageContent';
import ReaderControls from '@/components/reader/ReaderControls';
import ReaderFooter from '@/components/reader/ReaderFooter';
import ReaderCommentsPanel from '@/components/reader/ReaderCommentsPanel';

const NAV_BAR_HEIGHT = 64; 
const KOFI_URL = "https://ko-fi.com/VOTRE_PAGE_KOFI";

const ReaderPage = () => {
  const { webtoonId, chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth(); 
  const { toast } = useToast();

  const [chapterData, setChapterData] = useState({
    webtoonInfo: null,
    currentChapter: null,
    allChaptersInWebtoon: [],
    navChapters: { previous: null, next: null },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [readingMode, setReadingMode] = useState(localStorage.getItem('readingMode') || 'webtoon');
  const [zoomLevel, setZoomLevel] = useState(parseFloat(localStorage.getItem('zoomLevel')) || 100);
  const [showComments, setShowComments] = useState(false);
  
  const controlsTimeoutRef = useRef(null);
  const preloadedImagesRef = useRef(new Set());
  const readerContentRef = useRef(null);
  const pageRefs = useRef([]);

  const fetchChapterDetails = useCallback(async (currentChapterId, currentWebtoonId, currentUserId, currentUserRoleName) => {
    setLoading(true);
    setError(null);
    preloadedImagesRef.current.clear();
    pageRefs.current = [];
    setCurrentPageIndex(0); 
    if (readerContentRef.current) readerContentRef.current.scrollTop = 0;

    try {
      const fetchedChapter = await getChapterWithPages(currentChapterId, currentUserId, currentUserRoleName);

      if (!fetchedChapter) {
        setError("Chapitre non trouvé ou impossible à charger.");
        setChapterData(prev => ({ ...prev, currentChapter: null, webtoonInfo: null }));
        return;
      }
      
      if (fetchedChapter.accessDenied) {
        setChapterData(prev => ({ ...prev, currentChapter: fetchedChapter, webtoonInfo: { id: fetchedChapter.webtoonId, title: fetchedChapter.webtoonTitle } }));
        toast({
            title: "Accès Restreint",
            description: `Ce chapitre est réservé aux membres avec les rôles: ${fetchedChapter.required_roles.join(', ')}.`,
            variant: "destructive",
            duration: 7000,
        });
        return;
      }
      
      await incrementChapterView(currentChapterId);
      
      const { data: allChaptersData, error: allChaptersError } = await supabase
        .from('chapters')
        .select('id, number')
        .eq('webtoon_id', currentWebtoonId)
        .order('number', { ascending: true });

      if (allChaptersError) throw allChaptersError;

      const navData = await getPreviousAndNextChapter(currentWebtoonId, fetchedChapter.number, currentUserId, currentUserRoleName);
      
      setChapterData({
        webtoonInfo: { 
          id: fetchedChapter.webtoonId, 
          title: fetchedChapter.webtoonTitle, 
          showPublicViews: fetchedChapter.webtoonShowPublicViews 
        },
        currentChapter: fetchedChapter,
        allChaptersInWebtoon: allChaptersData || [],
        navChapters: { previous: navData.previousChapter, next: navData.nextChapter },
      });
      
      if (currentUserId) {
        await markChapterAsRead(currentUserId, currentChapterId);
      }

      fetchedChapter.pages?.slice(0, 3).forEach(page => {
        if (page.publicUrl && !preloadedImagesRef.current.has(page.publicUrl)) {
          const img = new Image(); img.src = page.publicUrl;
          preloadedImagesRef.current.add(page.publicUrl);
        }
      });

    } catch (err) {
      console.error("Failed to fetch chapter:", err);
      setError(`Impossible de charger le chapitre: ${err.message}`);
      toast({ title: "Erreur de chargement", description: `Impossible de charger le chapitre: ${err.message}`, variant: "destructive" });
      setChapterData(prev => ({ ...prev, currentChapter: null, webtoonInfo: null }));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchChapterDetails(chapterId, webtoonId, user?.id, userRole);
  }, [chapterId, webtoonId, user?.id, userRole, fetchChapterDetails, location.key]);

  useEffect(() => { 
    localStorage.setItem('readingMode', readingMode); 
  }, [readingMode]);

  useEffect(() => { 
    localStorage.setItem('zoomLevel', zoomLevel.toString()); 
  }, [zoomLevel]);


  useEffect(() => {
    if (!loading && chapterData.currentChapter && !chapterData.currentChapter.accessDenied && chapterData.currentChapter.pages.length > 0) {
      const imagesToPreload = [];
      const preloadCount = readingMode === 'horizontal' ? 2 : 3; 
      for (let i = 1; i <= preloadCount; i++) {
        if (currentPageIndex + i < chapterData.currentChapter.pages.length) imagesToPreload.push(chapterData.currentChapter.pages[currentPageIndex + i].publicUrl);
        if (readingMode === 'horizontal' && currentPageIndex - i >= 0) imagesToPreload.push(chapterData.currentChapter.pages[currentPageIndex - i].publicUrl);
      }
      imagesToPreload.forEach(url => {
        if (url && !preloadedImagesRef.current.has(url)) {
          const img = new Image(); img.src = url;
          preloadedImagesRef.current.add(url);
        }
      });
    }
  }, [currentPageIndex, chapterData.currentChapter, loading, readingMode]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showComments) setShowControls(false);
    }, 5000);
  }, [showComments]);

  useEffect(() => {
    if (showControls) resetControlsTimeout();
    else if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [showControls, resetControlsTimeout]);

  const handleInteraction = () => { if (!showControls) setShowControls(true); resetControlsTimeout(); };
  const toggleComments = () => { setShowComments(!showComments); if (!showControls) setShowControls(true); };
  const navigateToChapterById = (targetChapterId) => { if (targetChapterId) navigate(`/webtoon/${webtoonId}/chapter/${targetChapterId}`); };
  
  const handlePageNavigation = (direction) => {
    const numPages = chapterData.currentChapter?.pages?.length || 0;
    if (direction === 'next') {
      if (currentPageIndex < numPages - 1) {
        setCurrentPageIndex(prev => prev + 1);
      } else if (chapterData.navChapters.next) {
        navigateToChapterById(chapterData.navChapters.next.id);
      }
    } else if (direction === 'prev') {
      if (currentPageIndex > 0) {
        setCurrentPageIndex(prev => prev - 1);
      } else if (chapterData.navChapters.previous) {
        navigateToChapterById(chapterData.navChapters.previous.id);
      }
    }
  };

  const handleMainClick = (e) => {
    const targetIsInteractive = ['reader-controls-menu', 'reader-header', 'reader-comments-panel', 'reader-footer'].some(id => document.getElementById(id)?.contains(e.target)) || e.target.closest('button, a, input, select, [role="slider"], [role="menuitemradio"]');
    
    if (targetIsInteractive) {
      resetControlsTimeout();
      return;
    }

    if (readerContentRef.current?.contains(e.target)) { 
      if (readingMode === 'horizontal' && chapterData.currentChapter?.pages?.length > 0) {
        const clickX = e.clientX;
        const screenWidth = window.innerWidth;
        if (clickX < screenWidth / 3) handlePageNavigation('prev');
        else if (clickX > (screenWidth * 2) / 3) handlePageNavigation('next');
        else setShowControls(s => !s);
      } else {
        setShowControls(s => !s);
      }
    } else if (showControls) { 
      setShowControls(false);
    } else { 
      setShowControls(true);
    }
    resetControlsTimeout();
  };
  
  const handleZoomChange = (newZoomValue) => {
    setZoomLevel(newZoomValue);
  };

  useEffect(() => {
    if (readingMode === 'horizontal' && pageRefs.current[currentPageIndex]) {
      pageRefs.current[currentPageIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentPageIndex, readingMode]);

  if (error) return <NotFoundPage message={error} />;
  if (loading || !chapterData.webtoonInfo) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[999]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const { webtoonInfo, currentChapter, allChaptersInWebtoon, navChapters } = chapterData;

  if (currentChapter?.accessDenied) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex flex-col items-center justify-center p-6 text-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="bg-neutral-800/50 p-8 md:p-12 rounded-xl shadow-2xl max-w-lg backdrop-blur-sm border border-neutral-700"
            >
                <Lock className="h-20 w-20 md:h-24 md:w-24 text-amber-400 mx-auto mb-6" />
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-amber-300">Chapitre Verrouillé</h1>
                <p className="text-neutral-300 mb-3">
                    L'accès au chapitre <strong className="text-white">{currentChapter.number}</strong> de <strong className="text-white">{webtoonInfo.title}</strong> est restreint.
                </p>
                <p className="text-sm text-neutral-400 mb-6">
                    Ce contenu est réservé aux utilisateurs ayant les rôles suivants : <strong className="text-amber-400">{currentChapter.required_roles.join(', ')}</strong>.
                </p>
                <p className="text-neutral-300 mb-6">
                    Pour débloquer ce chapitre et soutenir notre travail, envisagez de nous soutenir sur Ko-fi !
                </p>
                <div className="space-y-3">
                    <Button 
                        onClick={() => window.open(KOFI_URL, '_blank')} 
                        variant="default" 
                        size="lg"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-base"
                    >
                        <Coffee className="mr-2 h-5 w-5" /> Soutenir sur Ko-fi
                    </Button>
                    <Button 
                        onClick={() => navigate(`/webtoon/${webtoonId}`)} 
                        variant="outline"
                        size="lg"
                        className="w-full border-neutral-600 hover:bg-neutral-700/50 text-neutral-300 hover:text-white"
                    >
                        Retour au Webtoon
                    </Button>
                </div>
            </motion.div>
        </div>
    );
  }
  
  if (!currentChapter) {
     return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[999]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Chargement du chapitre...</p>
      </div>
    );
  }


  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black flex flex-col isolate"
      onClick={handleMainClick} onTouchStart={handleInteraction} onMouseMove={handleInteraction}
    >
      <ReaderHeader
        webtoonTitle={webtoonInfo.title}
        chapterNumber={currentChapter.number}
        webtoonId={webtoonId}
        currentChapterId={chapterId}
        allChapters={allChaptersInWebtoon}
        onChapterChange={navigateToChapterById}
        onToggleComments={toggleComments}
        showComments={showComments}
        isVisible={showControls}
        mainNavHeight={NAV_BAR_HEIGHT} 
        onPrevChapter={() => navChapters.previous && navigateToChapterById(navChapters.previous.id)}
        onNextChapter={() => navChapters.next && navigateToChapterById(navChapters.next.id)}
        hasPrevChapter={!!navChapters.previous}
        hasNextChapter={!!navChapters.next}
      />

      <div 
        ref={readerContentRef} 
        className={`flex-grow overflow-hidden ${readingMode === 'horizontal' ? 'flex flex-row items-center' : 'overflow-y-auto'}`}
        style={readingMode === 'horizontal' ? { scrollSnapType: 'x mandatory' } : { paddingTop: `${NAV_BAR_HEIGHT}px` }}
      >
        {currentChapter.pages.map((page, index) => (
            <ReaderPageContent
                key={page.id || `page-${index}`}
                ref={el => pageRefs.current[index] = el}
                page={page}
                pageIndex={index}
                webtoonTitle={webtoonInfo.title}
                chapterNumber={currentChapter.number}
                onPageClick={() => {}} 
                zoomLevel={zoomLevel}
                readingMode={readingMode}
                isCurrentPage={index === currentPageIndex}
                mainNavHeight={NAV_BAR_HEIGHT}
                shouldPreload={Math.abs(index - currentPageIndex) <= (readingMode === 'horizontal' ? 1 : 2) || index < 2}
            />
        ))}
        {(readingMode === 'webtoon' || readingMode === 'vertical') && currentChapter.pages.length > 0 && (
            <div className="h-20 md:h-32"></div> 
        )}
      </div>

      <ReaderFooter
        currentPageIndex={currentPageIndex}
        totalPages={currentChapter.pages.length}
        onPrevPage={() => handlePageNavigation('prev')}
        onNextPage={() => handlePageNavigation('next')}
        prevChapterNumber={navChapters.previous?.number}
        nextChapterNumber={navChapters.next?.number}
        isVisible={showControls && readingMode === 'horizontal'}
        showComments={showComments}
      />
      
      <ReaderControls
        zoomLevel={zoomLevel} 
        onZoomChange={handleZoomChange}
        readingMode={readingMode} 
        onReadingModeChange={setReadingMode}
        isVisible={showControls && !showComments}
      />
      
      <ReaderCommentsPanel
        isVisible={showComments}
        onClose={toggleComments}
        webtoonId={webtoonId}
        chapterId={chapterId}
        chapterNumber={currentChapter.number}
      />
    </motion.div>
  );
};

export default ReaderPage;
