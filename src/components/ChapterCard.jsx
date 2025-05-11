
import React from "react";
import { motion } from "framer-motion";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const ChapterCard = ({ chapter, onDelete, onView, isAdmin = false, showPublicViews = false }) => {
  const { toast } = useToast();
  
  const handleDelete = (e) => {
    e.stopPropagation();
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le chapitre ${chapter.number} ?`)) {
      onDelete(chapter.id);
      toast({
        title: "Chapitre supprimé",
        description: `Le chapitre ${chapter.number} a été supprimé avec succès.`,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="chapter-card cursor-pointer"
      onClick={() => onView(chapter)}
    >
      <Card className="overflow-hidden h-full border-0 shadow-lg bg-gradient-to-br from-secondary/50 to-background">
        <div className="relative aspect-[3/4] overflow-hidden group">
           {chapter.thumbnailUrl || (chapter.pages && chapter.pages.length > 0) ? (
             <img 
               src={chapter.thumbnailUrl || (chapter.pages[0].preview || chapter.pages[0])}
               alt={`Aperçu Chapitre ${chapter.number}`}
               class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
               />
           ) : (
             <div className="w-full h-full bg-muted flex items-center justify-center">
               <Eye className="h-12 w-12 text-muted-foreground" />
             </div>
           )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <div className="flex justify-between items-center">
              <Button 
                variant="secondary" 
                size="sm" 
                className={`w-full ${isAdmin ? 'mr-2' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onView(chapter);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </Button>
              {isAdmin && (
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8 flex-shrink-0"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm truncate">Chapitre {chapter.number}</h3>
          <p className="text-xs text-muted-foreground">
            {chapter.createdAt ? new Date(chapter.createdAt).toLocaleDateString() : ''}
          </p>
           <p className="text-xs text-muted-foreground">
             {chapter.pages?.length || 0} Pages
           </p>
           {showPublicViews && (
              <p className="text-xs text-muted-foreground flex items-center">
                <Eye className="h-3 w-3 mr-1" /> {(chapter.views || 0).toLocaleString()}
              </p>
           )}
        </div>
      </Card>
    </motion.div>
  );
};

export default ChapterCard;
