
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, Save, Trash2, UploadCloud, PlusCircle, GripVertical, ShieldCheck } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getChapterWithPages, updateChapter } from '@/services/chapterService';
import { getWebtoonById } from '@/services/webtoonService';
import { getCustomRoles } from '@/services/roleService';
import FileUploader from '@/components/FileUploader';
import { useAuth } from '@/contexts/AuthContext';

const defaultThumb = 'https://images.unsplash.com/photo-1585776245991-a690541786ff';

const RoleSelectorEdit = ({ availableRoles, selectedRoles, onSelectionChange, disabled }) => {
  const handleRoleToggle = (roleName) => {
    const newSelectedRoles = selectedRoles.includes(roleName)
      ? selectedRoles.filter(name => name !== roleName)
      : [...selectedRoles, roleName];
    onSelectionChange(newSelectedRoles);
  };

  if (!availableRoles || availableRoles.length === 0) {
    return <p className="text-xs text-muted-foreground">Aucun rôle personnalisé disponible.</p>;
  }
  
  return (
    <div className="space-y-2">
      <Label className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary"/>Rôles requis pour l'accès</Label>
      <div className="max-h-32 overflow-y-auto p-2 border rounded-md bg-background space-y-1">
        {availableRoles.map(role => (
          <div key={role.id} className="flex items-center space-x-2">
            <Checkbox
              id={`edit-role-${role.id}-${crypto.randomUUID()}`}
              checked={selectedRoles.includes(role.name)}
              onCheckedChange={() => handleRoleToggle(role.name)}
              disabled={disabled}
            />
            <Label htmlFor={`edit-role-${role.id}-${crypto.randomUUID()}`} className="font-normal text-sm">
              {role.name}
            </Label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Si aucun rôle n'est sélectionné, le chapitre sera public.</p>
    </div>
  );
};


const AdminChapterEdit = () => {
  const { webtoonId, chapterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  const [webtoon, setWebtoon] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapterNumber, setChapterNumber] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [pages, setPages] = useState([]); 
  const [requiredRoles, setRequiredRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchChapterData = useCallback(async () => {
    setFetching(true);
    try {
      const [fetchedWebtoon, fetchedChapterData, fetchedRoles] = await Promise.all([
        getWebtoonById(webtoonId),
        getChapterWithPages(chapterId, user?.id, userRole),
        getCustomRoles()
      ]);
      
      setAvailableRoles(fetchedRoles || []);

      if (!fetchedWebtoon || !fetchedChapterData) {
        toast({ title: "Erreur", description: "Webtoon ou chapitre non trouvé.", variant: "destructive" });
        navigate(`/admin/webtoons/${webtoonId}/upload`);
        return;
      }
      if (fetchedChapterData.accessDenied) {
        toast({ title: "Accès refusé", description: "Vous n'avez pas les droits pour modifier ce chapitre.", variant: "destructive" });
        navigate(`/admin/webtoons/${webtoonId}/upload`);
        return;
      }

      setWebtoon(fetchedWebtoon);
      setChapter(fetchedChapterData);
      setChapterNumber(fetchedChapterData.number.toString());
      setThumbnailPreview(fetchedChapterData.thumbnailUrl || '');
      setPages(fetchedChapterData.pages.map(p => ({ ...p, id: p.id || crypto.randomUUID() })));
      setRequiredRoles(fetchedChapterData.required_roles || []);

    } catch (error) {
      console.error("Failed to fetch chapter data:", error);
      toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" });
      navigate(`/admin/webtoons/${webtoonId}/upload`);
    } finally {
      setFetching(false);
    }
  }, [webtoonId, chapterId, navigate, toast, user?.id, userRole]);

  useEffect(() => {
    fetchChapterData();
  }, [fetchChapterData]);
  
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(file);
      setRemoveThumbnail(false);
    } else {
      if(file) toast({ title: "Fichier invalide", description: "Veuillez sélectionner une image.", variant: "warning"});
    }
  };

  const handleRemoveThumbnailChange = (checked) => {
    setRemoveThumbnail(checked);
    if (checked) {
      setThumbnailFile(null);
      setThumbnailPreview('');
    } else if (chapter?.thumbnailUrl) {
       setThumbnailPreview(chapter.thumbnailUrl);
    }
  };

  const handlePageFileAdd = (newFiles) => {
    const newPageObjects = newFiles.map(fileObj => ({
      id: crypto.randomUUID(),
      file: fileObj.file,
      publicUrl: URL.createObjectURL(fileObj.file), 
      page_number: 0 
    }));
    setPages(prev => [...prev, ...newPageObjects]);
  };

  const handleRemovePage = (pageIdToRemove) => {
    setPages(prevPages => prevPages.filter(p => p.id !== pageIdToRemove));
  };
  
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("draggedPageIndex", index);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData("draggedPageIndex"));
    if (draggedIndex === dropIndex) return;

    const newPages = [...pages];
    const [draggedItem] = newPages.splice(draggedIndex, 1);
    newPages.splice(dropIndex, 0, draggedItem);
    setPages(newPages);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const num = parseFloat(chapterNumber);
    if (isNaN(num) || num <= 0) {
      toast({ title: "Erreur", description: "Numéro de chapitre invalide.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (pages.length === 0) {
      toast({ title: "Erreur", description: "Le chapitre doit contenir au moins une page.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const updatedChapterData = {
      number: num,
      thumbnailFile: thumbnailFile,
      removeThumbnail: removeThumbnail,
      existingThumbnailPath: chapter.existingThumbnailPath,
      pages: pages.map((page, index) => ({
        id: page.id,
        file: page.file, 
        image_url: page.image_url,
        page_number: index + 1, 
      })),
      required_roles: requiredRoles,
    };

    try {
      await updateChapter(chapterId, webtoonId, updatedChapterData);
      toast({ title: "Succès", description: "Chapitre mis à jour avec succès." });
      navigate(`/admin/webtoons/${webtoonId}/upload`);
    } catch (error) {
      console.error("Failed to update chapter:", error);
      toast({ title: "Erreur de mise à jour", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center items-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!webtoon || !chapter) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link to={`/admin/webtoons/${webtoonId}/upload`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'upload
        </Link>
      </Button>
      <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle>Modifier Chapitre {chapter.number} de "{webtoon.title}"</CardTitle>
          <CardDescription>Modifiez les détails, les pages et les restrictions d'accès du chapitre.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="space-y-1">
                <Label htmlFor="chapterNumber">Numéro Chapitre</Label>
                <Input id="chapterNumber" type="number" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)} placeholder="Ex: 1, 2.5" min="0.1" step="0.1" required disabled={loading} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="thumbnail">Miniature (Optionnel)</Label>
                <div className="flex items-center space-x-2">
                  <img src={thumbnailPreview || defaultThumb} alt="Miniature" className="h-20 w-auto object-cover rounded border aspect-[16/9] bg-background" />
                  <Input id="thumbnail" type="file" accept="image/*" onChange={handleThumbnailChange} className="file-input-sm" disabled={loading} />
                </div>
                {chapter.thumbnailUrl && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox id="removeThumbnail" checked={removeThumbnail} onCheckedChange={handleRemoveThumbnailChange} disabled={loading} />
                    <Label htmlFor="removeThumbnail">Supprimer la miniature actuelle</Label>
                  </div>
                )}
              </div>
               <div className="space-y-1">
                 <RoleSelectorEdit
                    availableRoles={availableRoles}
                    selectedRoles={requiredRoles}
                    onSelectionChange={setRequiredRoles}
                    disabled={loading}
                  />
              </div>
            </div>
            
            <div>
              <Label>Pages du Chapitre</Label>
              <div className="mt-2 p-4 border border-dashed rounded-md bg-muted/30 space-y-3 min-h-[200px]">
                {pages.map((page, index) => (
                  <motion.div 
                    key={page.id} 
                    className="flex items-center justify-between p-2 bg-background rounded shadow-sm hover:shadow-md"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    layout                                     
                  >
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                       <img src={page.publicUrl} alt={`Page ${index + 1}`} className="h-16 w-16 object-cover rounded border"/>
                       <span className="text-sm truncate max-w-xs">{page.file ? page.file.name : `Page ${index + 1} (existante)`}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemovePage(page.id)} disabled={loading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
                {pages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune page. Glissez-déposez ou ajoutez des fichiers ci-dessous.</p>}
              </div>
               <div className="mt-4">
                  <Label className="text-sm font-medium">Ajouter de nouvelles pages</Label>
                  <FileUploader onFilesUploaded={handlePageFileAdd} customMessage="Glissez-déposez des images ici, ou cliquez pour sélectionner" />
               </div>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading || fetching}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Sauvegarder Modifications
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default AdminChapterEdit;
