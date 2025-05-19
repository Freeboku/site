
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, Shuffle, Search, User, LogIn, LogOut, MessageCircle, Coffee, Menu, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { getRandomWebtoonSlug } from '@/services/webtoonService';
import { useToast } from '@/components/ui/use-toast';
import PopupDisplay from '@/components/PopupDisplay';
import NotificationBell from '@/components/NotificationBell';

const NAV_ITEMS_MAIN = [
  { name: 'Accueil', path: '/', icon: Home },
  { name: 'Webtoons', path: '/webtoons', icon: BookOpen },
];

const NAV_ITEMS_SOCIAL = [
  { name: 'Discord', url: 'https://discord.gg/tyBjB9SrVJ', icon: MessageCircle, isExternal: true },
  { name: 'Ko-fi', url: 'https://ko-fi.com/starboundcomics', icon: Coffee, isExternal: true },
];

const SITE_LOGO_URL = "https://storage.googleapis.com/hostinger-horizons-assets-prod/7c53267e-a375-4cf5-96cf-45c7d7384c1a/8b4541beebec8757ad7aca949281835f.png";
const SITE_NAME = "Starbound Scans";

const Layout = () => {
  const { user, profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  const isReaderPage = location.pathname.includes('/chapter/');

  useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Déconnexion réussie', description: 'À bientôt !' });
      navigate('/');
    } catch (error) {
      toast({ title: 'Erreur de déconnexion', description: error.message, variant: 'destructive' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleSearchClick = () => {
    if (searchTerm.trim()) {
      navigate(`/webtoons?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };
  
  const handleRandomWebtoon = async () => {
    try {
      const webtoonId = await getRandomWebtoonSlug();
      if (webtoonId) {
        navigate(`/webtoon/${webtoonId}`);
      } else {
        toast({ title: 'Oups !', description: "Aucun webtoon n'a été trouvé pour une lecture aléatoire.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: "Impossible de charger un webtoon aléatoire.", variant: "destructive" });
    }
    setIsMobileMenuOpen(false);
  };

  const renderNavLinks = (items, isMobile = false) => items.map(item => (
    item.isExternal ? (
      <a
        key={item.name}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isMobile ? 'hover:bg-muted/50 w-full text-left' : 'hover:bg-primary/10 hover:text-primary'}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.name}</span>
      </a>
    ) : (
      <Link
        key={item.name}
        to={item.path}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${isMobile ? 'hover:bg-muted/50 w-full text-left' : 'hover:bg-primary/10 hover:text-primary'} ${location.pathname === item.path ? (isMobile ? 'bg-primary text-primary-foreground' : 'text-primary font-semibold') : ''}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.name}</span>
      </Link>
    )
  ));

  if (isReaderPage) {
    return <Outlet />;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PopupDisplay />
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0 mr-4">
              <img src={SITE_LOGO_URL} alt={`${SITE_NAME} Logo`} className="h-10 w-10 object-contain" />
              <span className="font-bold text-lg sm:text-xl text-primary whitespace-nowrap">{SITE_NAME}</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-grow justify-end">
              {renderNavLinks(NAV_ITEMS_MAIN)}
              <Button variant="ghost" onClick={handleRandomWebtoon} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/10 hover:text-primary whitespace-nowrap">
                <Shuffle className="h-5 w-5 flex-shrink-0" />
                <span>Aléatoire</span>
              </Button>
              {renderNavLinks(NAV_ITEMS_SOCIAL)}
              <form onSubmit={handleSearch} className="relative ml-2">
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 text-sm w-36 lg:w-48 bg-muted border-border focus:bg-background focus:border-primary transition-all h-9"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </form>
              {user && <NotificationBell />}
              {user ? (
                 <div className="relative group ml-1">
                    <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/10 hover:text-primary whitespace-nowrap">
                        <User className="h-5 w-5 flex-shrink-0" />
                        <span>{profile?.username || 'Profil'}</span>
                    </Link>
                 </div>
              ) : (
                <Link to="/auth" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/10 hover:text-primary whitespace-nowrap ml-1">
                  <LogIn className="h-5 w-5 flex-shrink-0" />
                  <span>Connexion</span>
                </Link>
              )}
               {user && isAdmin && (
                <Link to="/admin" className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-400 whitespace-nowrap ml-1">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                  <span>Admin</span>
                </Link>
              )}
              {user && (
                <Button variant="ghost" size="icon" onClick={handleLogout} className="flex items-center space-x-2 px-2 py-2 rounded-md text-sm font-medium hover:bg-destructive/10 hover:text-destructive ml-1">
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                </Button>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-1">
              {user && <NotificationBell />}
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md p-4 flex flex-col items-center"
          >
            <div className="w-full max-w-md">
              <div className="flex justify-end mb-4">
                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  className="flex-grow text-lg p-3 bg-muted border-border focus:bg-background"
                />
                <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">Rechercher</Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-[70] bg-background p-4 flex flex-col md:hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3">
                 <img src={SITE_LOGO_URL} alt={`${SITE_NAME} Logo`} className="h-8 w-8 object-contain" />
                 <span className="font-bold text-lg text-primary">{SITE_NAME}</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex flex-col space-y-2 flex-grow">
              {renderNavLinks(NAV_ITEMS_MAIN, true)}
              <Button variant="ghost" onClick={handleRandomWebtoon} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted/50 w-full text-left whitespace-nowrap">
                <Shuffle className="h-5 w-5 flex-shrink-0" />
                <span>Aléatoire</span>
              </Button>
              {renderNavLinks(NAV_ITEMS_SOCIAL, true)}
              <hr className="my-2 border-border/50"/>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted/50 w-full text-left whitespace-nowrap">
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span>{profile?.username || 'Profil'}</span>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/20 w-full text-left whitespace-nowrap">
                      <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <Button variant="ghost" onClick={handleLogout} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-destructive/20 hover:text-destructive w-full text-left text-red-400 whitespace-nowrap">
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span>Déconnexion</span>
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted/50 w-full text-left whitespace-nowrap">
                  <LogIn className="h-5 w-5 flex-shrink-0" />
                  <span>Connexion / Inscription</span>
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
    </div>
  );
};

export default Layout;
