
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, Upload, Loader2, Eye } from 'lucide-react';
import { getWebtoons } from '@/services/webtoonService'; 
import { deleteWebtoon as deleteWebtoonService, updateWebtoonShowPublicViews } from '@/services/webtoonService';
import { useToast } from "@/components/ui/use-toast";
import EmptyState from '@/components/EmptyState';

const AdminWebtoonList = () => {
  const [webtoons, setWebtoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchWebtoonsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getWebtoons();
        setWebtoons(data.map(wt => ({...wt, showPublicViews: wt.show_public_views || false })));
      } catch (err) {
        console.error("Failed to fetch webtoons:", err);
        setError("Impossible de charger la liste des webtoons.");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchWebtoonsData();
  }, []);

  const handleDelete = async (webtoonId, title) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le webtoon "${title}" et toutes ses données (chapitres, images) ? Cette action est irréversible.`)) {
      try {
        await deleteWebtoonService(webtoonId);
        toast({
          title: "Webtoon Supprimé",
          description: `Le webtoon "${title}" a été supprimé avec succès.`,
        });
        fetchWebtoonsData();
      } catch (err) {
         console.error("Failed to delete webtoon:", err);
         toast({
           title: "Erreur de suppression",
           description: `Impossible de supprimer le webtoon "${title}". ${err.message}`,
           variant: "destructive",
         });
      }
    }
  };

  const handleShowPublicViewsChange = async (webtoonId, newShowPublicViews) => {
    try {
      await updateWebtoonShowPublicViews(webtoonId, newShowPublicViews);
      setWebtoons(prevWebtoons => 
        prevWebtoons.map(wt => 
          wt.id === webtoonId ? { ...wt, showPublicViews: newShowPublicViews } : wt
        )
      );
      toast({
        title: "Mise à jour réussie",
        description: `Visibilité des vues mise à jour.`,
      });
    } catch (err) {
      console.error("Failed to update show_public_views:", err);
      toast({
        title: "Erreur de mise à jour",
        description: `Impossible de mettre à jour la visibilité des vues. ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gérer les Webtoons</h1>
        <Button asChild>
          <Link to="/admin/webtoons/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un Webtoon
          </Link>
        </Button>
      </div>

       {error && (
         <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
       )}

      <Card className="bg-card/80 backdrop-blur-sm shadow-md">
        <CardContent className="p-0">
          {loading ? (
             <div className="flex justify-center items-center p-12">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
               <span className="ml-3 text-muted-foreground">Chargement...</span>
             </div>
           ) : webtoons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Couverture</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Chapitres</TableHead>
                  <TableHead><Eye className="inline-block h-4 w-4 mr-1" /> Vues</TableHead>
                  <TableHead>Afficher Vues</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <motion.tbody
                 variants={containerVariants}
                 initial="hidden"
                 animate="visible"
              >
                {webtoons.map((webtoon) => (
                  <motion.tr key={webtoon.id} variants={itemVariants} className="hover:bg-muted/20">
                    <TableCell>
                      <img
                        className="h-16 w-auto object-cover rounded aspect-[3/4] bg-muted"
                        alt={`Couverture ${webtoon.title}`}
                        src={webtoon.coverImageUrl || 'https://images.unsplash.com/photo-1637840616499-1349c96347fa'}
                        onError={(e) => { e.target.onerror = null; e.target.src='https://images.unsplash.com/photo-1637840616499-1349c96347fa'; }}
                       />
                    </TableCell>
                    <TableCell className="font-medium">{webtoon.title}</TableCell>
                    <TableCell>{webtoon.chapterCount || 0}</TableCell>
                    <TableCell>{(webtoon.views || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`show-views-${webtoon.id}`} 
                          checked={webtoon.showPublicViews} 
                          onCheckedChange={(checked) => handleShowPublicViewsChange(webtoon.id, checked)}
                        />
                        <Label htmlFor={`show-views-${webtoon.id}`} className="sr-only">Afficher vues publiquement</Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                         <Link to={`/admin/webtoons/${webtoon.id}/upload`} title="Uploader Chapitres">
                           <Upload className="h-4 w-4" />
                         </Link>
                       </Button>
                       <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                         <Link to={`/admin/webtoons/edit/${webtoon.id}`} title="Modifier Webtoon">
                           <Edit className="h-4 w-4" />
                         </Link>
                       </Button>
                       <Button
                         variant="destructive"
                         size="icon"
                         className="h-8 w-8"
                         onClick={() => handleDelete(webtoon.id, webtoon.title)}
                         title="Supprimer Webtoon"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </motion.tbody>
            </Table>
          ) : !error ? ( 
             <EmptyState
               title="Aucun Webtoon Trouvé"
               message="Commencez par ajouter votre premier webtoon !"
               actionText="Ajouter un Webtoon"
               onActionClick={() => document.querySelector('a[href="/admin/webtoons/new"]')?.click()} 
             />
          ) : null }
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminWebtoonList;
