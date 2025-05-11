
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, X, Tag } from 'lucide-react';
import { getWebtoons, getAllTags } from '@/services/webtoonService';
import EmptyState from '@/components/EmptyState';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const AllWebtoonsPage = () => {
  const [allWebtoons, setAllWebtoons] = useState([]);
  const [filteredWebtoons, setFilteredWebtoons] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data (all webtoons and all available tags)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [webtoonsData, tagsData] = await Promise.all([
          getWebtoons(), // Fetch all initially
          getAllTags()
        ]);
        setAllWebtoons(webtoonsData);
        setFilteredWebtoons(webtoonsData); // Initially show all
        setAvailableTags(tagsData.sort()); // Sort tags alphabetically
      } catch (err) {
        console.error("Failed to fetch webtoons or tags:", err);
        setError("Impossible de charger les données. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter logic whenever search term or selected tags change
  useEffect(() => {
    let results = [...allWebtoons];

    // Filter by search term (case-insensitive)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(wt => 
        wt.title.toLowerCase().includes(lowerSearchTerm) || 
        (wt.description && wt.description.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Filter by selected tags (must include ALL selected tags)
    if (selectedTags.length > 0) {
      results = results.filter(wt => 
        selectedTags.every(tag => wt.tags?.includes(tag))
      );
    }

    setFilteredWebtoons(results);

  }, [searchTerm, selectedTags, allWebtoons]);

  const handleTagChange = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
     setSearchTerm('');
     setSelectedTags([]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Toutes les Séries</h1>

      {/* Filters Section */}
      <motion.div 
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.1 }}
         className="p-4 md:p-6 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 space-y-4"
      >
         <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-grow">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                  type="text"
                  placeholder="Rechercher par titre ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={loading}
               />
               {searchTerm && (
                  <Button 
                     variant="ghost" 
                     size="icon" 
                     className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                     onClick={() => setSearchTerm('')}
                  >
                     <X className="h-4 w-4" />
                  </Button>
               )}
            </div>
            {/* Clear Filters Button */}
            {(searchTerm || selectedTags.length > 0) && (
               <Button variant="outline" onClick={clearFilters} disabled={loading}>
                  <X className="mr-2 h-4 w-4" /> Effacer Filtres
               </Button>
            )}
         </div>
         
         {/* Tag Filters */}
         {availableTags.length > 0 && (
            <div className="space-y-2">
               <Label className="flex items-center text-sm font-medium"><Tag className="mr-2 h-4 w-4"/>Filtrer par Tags:</Label>
               <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {availableTags.map(tag => (
                     <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                           id={`tag-${tag}`}
                           checked={selectedTags.includes(tag)}
                           onCheckedChange={() => handleTagChange(tag)}
                           disabled={loading}
                        />
                        <Label 
                           htmlFor={`tag-${tag}`} 
                           className="text-sm font-normal cursor-pointer hover:text-primary"
                        >
                           {tag}
                        </Label>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </motion.div>

      {/* Results Section */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-destructive/10 text-destructive rounded-lg">
          <p className="text-xl font-semibold mb-2">Erreur</p>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Réessayer</Button>
        </div>
      ) : filteredWebtoons.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
        >
          {filteredWebtoons.map((webtoon) => (
            <motion.div key={webtoon.id} variants={itemVariants}>
              <Link to={`/webtoon/${webtoon.id}`}>
                <Card className="overflow-hidden h-full group manga-card bg-card/70 backdrop-blur-sm border-border/50 hover:shadow-md transition-shadow">
                  <div className="aspect-[3/4] overflow-hidden bg-muted">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      alt={`Couverture de ${webtoon.title}`}
                      src={webtoon.coverImageUrl || 'https://images.unsplash.com/photo-1637840616499-1349c96347fa'}
                      onError={(e) => { e.target.onerror = null; e.target.src='https://images.unsplash.com/photo-1637840616499-1349c96347fa'; }}
                     />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {webtoon.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {webtoon.chapterCount || 0} Chapitres
                    </p>
                     {webtoon.tags && webtoon.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                           {webtoon.tags.slice(0, 3).map(tag => ( // Show max 3 tags
                              <span key={tag} className="px-1.5 py-0.5 bg-secondary/50 text-secondary-foreground/80 text-[10px] font-medium rounded">
                                 {tag}
                              </span>
                           ))}
                        </div>
                     )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          title="Aucun Résultat"
          message="Aucun webtoon ne correspond à vos critères de recherche ou de filtrage."
        />
      )}
    </div>
  );
};

export default AllWebtoonsPage;
