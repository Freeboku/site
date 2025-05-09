
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getActivePopups } from '@/services/userService'; 
import { getPublicUrl } from '@/services/storageService';

const POPUP_STORAGE_BUCKET = 'popups';

const PopupDisplay = () => {
  const [activePopups, setActivePopups] = useState([]);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchAndFilterPopups = async () => {
      try {
        const popups = await getActivePopups();
        const now = new Date();
        const validPopups = popups.filter(p => {
          const startDate = p.start_date ? new Date(p.start_date) : null;
          const endDate = p.end_date ? new Date(p.end_date) : null;
          const isStarted = startDate ? now >= startDate : true;
          const isNotEnded = endDate ? now <= endDate : true;
          return isStarted && isNotEnded;
        }).map(p => ({
          ...p,
          imageUrl: p.image_url ? getPublicUrl(POPUP_STORAGE_BUCKET, p.image_url) : null
        }));

        const unshownPopups = validPopups.filter(p => {
          const shownPopups = JSON.parse(localStorage.getItem('shownPopups') || '[]');
          return !shownPopups.includes(p.id);
        });
        
        if (unshownPopups.length > 0) {
          setActivePopups(unshownPopups);
          setCurrentPopupIndex(0);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to fetch or filter popups:", error);
      }
    };

    fetchAndFilterPopups();
  }, []);

  const handleClose = () => {
    if (activePopups.length > 0) {
      const currentPopupId = activePopups[currentPopupIndex].id;
      const shownPopups = JSON.parse(localStorage.getItem('shownPopups') || '[]');
      if (!shownPopups.includes(currentPopupId)) {
        localStorage.setItem('shownPopups', JSON.stringify([...shownPopups, currentPopupId]));
      }
    }
    
    if (currentPopupIndex < activePopups.length - 1) {
      setCurrentPopupIndex(prevIndex => prevIndex + 1);
      // Keep isOpen true to show next popup
    } else {
      setIsOpen(false);
    }
  };

  if (!isOpen || activePopups.length === 0 || currentPopupIndex >= activePopups.length) {
    return null;
  }

  const popup = activePopups[currentPopupIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={(openState) => { if(!openState) handleClose(); }}>
          <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-lg border-border/70 shadow-2xl rounded-xl p-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {popup.imageUrl && (
                <div className="w-full aspect-video bg-muted overflow-hidden">
                  <img 
                    src={popup.imageUrl}
                    alt={popup.title || "Popup Image"}
                    className="w-full h-full object-cover"
                   />
                </div>
              )}
              <div className="p-6 space-y-4">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl font-bold text-foreground">{popup.title}</DialogTitle>
                  {popup.content && (
                    <DialogDescription className="text-muted-foreground mt-2 text-base leading-relaxed">
                      {popup.content}
                    </DialogDescription>
                  )}
                </DialogHeader>
                
                <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                  {popup.link_url && popup.link_text && (
                    <Button variant="default" size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none">
                      <a href={popup.link_url} target="_blank" rel="noopener noreferrer">
                        {popup.link_text}
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="lg" onClick={handleClose} className="border-border/70 hover:bg-muted/50 flex-1 sm:flex-none">
                    Fermer
                  </Button>
                </DialogFooter>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute top-3 right-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
                aria-label="Fermer la pop-up"
              >
                <X className="h-5 w-5" />
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default PopupDisplay;
