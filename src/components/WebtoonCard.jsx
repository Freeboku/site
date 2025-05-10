
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Bookmark } from 'lucide-react';

const WebtoonCard = ({ webtoon, isFavorite = false }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.03, y: -5, transition: { type: 'spring', stiffness: 300 } }
  };

  const defaultImage = 'https://images.unsplash.com/photo-1593345216166-6a6cbf185ba0';

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="relative group"
    >
      <Link to={`/webtoon/${webtoon.id}`}>
        <Card className="overflow-hidden h-full border-0 shadow-lg bg-gradient-to-br from-secondary/50 to-background">
          <div className="relative aspect-[3/4] overflow-hidden">
            <img 
              src={webtoon.coverImageUrl || defaultImage}
              alt={`Couverture de ${webtoon.title}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
              {webtoon.tags && webtoon.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {webtoon.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-primary/80 text-primary-foreground text-[10px] font-medium rounded-full backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h3 className="font-semibold text-sm md:text-base text-primary-foreground line-clamp-2">{webtoon.title}</h3>
            </div>
            {isFavorite && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg">
                <Bookmark className="h-4 w-4" />
              </div>
            )}
          </div>
          <CardContent className="p-3">
            <h3 className="font-medium text-sm md:text-base truncate group-hover:text-primary transition-colors">{webtoon.title}</h3>
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
              <span>{webtoon.chapterCount || 0} Chapitres</span>
              {webtoon.showPublicViews && webtoon.views > 0 && (
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {webtoon.views.toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default WebtoonCard;
