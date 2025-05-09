
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Loader2, Trash2, PlusCircle, MinusCircle, Edit, FileArchive, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getWebtoonById } from '@/services/webtoonService'; 
import { addMultipleChapters, deleteChapter } from '@/services/chapterService'; 
import { getCustomRoles } from '@/services/roleService';
import FileUploader from '@/components/FileUploader'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const defaultThumb = 'https://images.unsplash.com/photo-1585776245991-a690541786ff';

const RoleSelector = ({ availableRoles, selectedRoles, onSelectionChange, disabled }) => {
  const handleRoleToggle = (roleId) => {
    const newSelectedRoles = selectedRoles.includes(roleId)
      ? selectedRoles.filter(id => id !== roleId)
      : [...selectedRoles, roleId];
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
              id={`role-${role.id}-${crypto.randomUUID()}`}
              checked={selectedRoles.includes(role.name)}
              onCheckedChange={() => handleRoleToggle(role.name)}
              disabled={disabled}
            />
            <Label htmlFor={`role-${role.id}-${crypto.randomUUID()}`} className="font-normal text-sm">
              {role.name}
            </Label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Si aucun rôle n'est sélectionné, le chapitre sera public.</p>
    </div>
  );
};


const ChapterInputGroup = ({ id, chapterData, onUpdate, onRemove, webtoonChapters, isOnlyChapter, loading, availableRoles }) => {
  const handleFileUpdate = (pages) => {
    onUpdate(id, { ...chapterData, pages });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(id, { ...chapterData, thumbnailFile: file, thumbnailPreview: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      onUpdate(id, { ...chapterData, thumbnailFile: null, thumbnailPreview: '' });
      if (file) alert("Fichier invalide. Veuillez sélectionner une image.");
    }
    e.target.value = null;
  };

  const handleNumberChange = (e) => {
    onUpdate(id, { ...chapterData, number: e.target.value });
  };
  
  const handleRequiredRolesChange = (newSelectedRoles) => {
    onUpdate(id, { ...chapterData, required_roles: newSelectedRoles });
  };
  
  const existingChapterWithSameNumber = webtoonChapters?.find(ch => parseFloat(ch.number) === parseFloat(chapterData.number));

  return (
    <Card className="bg-muted/30 p-4 space-y-4 relative border border-border/50">
      {!isOnlyChapter && (
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onRemove(id)} disabled={loading} title="Supprimer ce groupe">
          <MinusCircle className="h-4 w-4" />
        </Button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-1">
          <Label htmlFor={`chapterNumber-${id}`}>Numéro Chapitre</Label>
          <Input id={`chapterNumber-${id}`} type="number" value={chapterData.number} onChange={handleNumberChange} placeholder="Ex: 1, 2.5" min="0.1" step="0.1" required disabled={loading} />
          {existingChapterWithSameNumber && <p className="text-xs text-amber-600 flex items-center mt-1"><AlertTriangle className="h-3 w-3 mr-1"/>Numéro existant. Sera remplacé.</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`thumbnail-${id}`}>Miniature (Optionnel)</Label>
          <div className="flex items-center space-x-2">
            <img  src={chapterData.thumbnailPreview || defaultThumb} alt="Miniature" className="h-16 w-auto object-cover rounded border aspect-[16/9] bg-background" />
            <Input id={`thumbnail-${id}`} type="file" accept="image/*" onChange={handleThumbnailChange} className="file-input-sm" disabled={loading} />
          </div>
        </div>
        <div className="space-y-1">
          <RoleSelector 
            availableRoles={availableRoles}
            selectedRoles={chapterData.required_roles || []}
            onSelectionChange={handleRequiredRolesChange}
            disabled={loading}
          />
        </div>
      </div>
      <div>
        <Label>Pages ({chapterData.pages?.length || 0} sélectionnées)</Label>
        <FileUploader key={`pages-${id}`} onFilesUploaded={handleFileUpdate} acceptZip={false} />
      </div>
      {(chapterData.uploadProgress > 0 || chapterData.uploadStatus === 'processing') && chapterData.uploadProgress < 100 && <Progress value={chapterData.uploadProgress} className="w-full h-1.5 mt-1" />}
      {chapterData.uploadStatus && chapterData.uploadStatus !== 'processing' && <p className={`text-xs mt-1 ${chapterData.uploadStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>{chapterData.uploadStatus === 'success' ? 'Upload réussi!' : `Erreur: ${chapterData.uploadError || 'Inconnue'}`}</p>}
    </Card>
  );
};

const AdminChapterUpload = () => {
  const { webtoonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [webtoon, setWebtoon] = useState(null);
  const [chapterInputs, setChapterInputs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overallUploadProgress, setOverallUploadProgress] = useState(0);
  const [fetchingData, setFetchingData] = useState(true);
  const [formError, setFormError] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);

  const createNewChapterInput = (number = '') => ({
    id: crypto.randomUUID(), 
    number: number.toString(), 
    thumbnailFile: null, 
    thumbnailPreview: '', 
    pages: [], 
    required_roles: [],
    uploadProgress: 0, 
    uploadStatus: null, 
    uploadError: null 
  });

  const initializeChapterInputs = (fetchedWebtoon, keepExisting = false) => {
    if (keepExisting && chapterInputs.length > 0 && chapterInputs.some(ci => ci.pages.length > 0 || ci.number)) return;

    const chapters = fetchedWebtoon?.chapters || [];
    const lastChapterNum = chapters.length > 0 ? Math.max(0, ...chapters.map(ch => parseFloat(ch.number)).filter(n => !isNaN(n))) : 0;
    const nextNum = parseFloat(lastChapterNum) + 1;
    
    setChapterInputs([createNewChapterInput(isNaN(nextNum) ? '' : nextNum)]);
  };

  const fetchData = useCallback(async () => {
    setFetchingData(true);
    try {
      const [fetchedWebtoon, fetchedRoles] = await Promise.all([
        getWebtoonById(webtoonId),
        getCustomRoles()
      ]);

      setAvailableRoles(fetchedRoles || []);

      if (fetchedWebtoon) {
        setWebtoon(fetchedWebtoon);
        initializeChapterInputs(fetchedWebtoon, chapterInputs.some(ci => ci.pages.length > 0 || ci.number));
      } else {
        toast({ title: "Erreur", description: "Webtoon non trouvé.", variant: "destructive" });
        navigate('/admin/webtoons');
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      toast({ title: "Erreur", description: "Impossible de charger les données initiales.", variant: "destructive" });
      navigate('/admin/webtoons');
    } finally {
      setFetchingData(false);
    }
  }, [webtoonId, navigate, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); 

  const handleZipExtracted = (extractedChapters) => {
    if (extractedChapters.length > 0) {
        setChapterInputs(extractedChapters.map(ch => ({
            ...createNewChapterInput(ch.number),
            thumbnailPreview: ch.thumbnailPreview || '', 
            pages: ch.pages || [],
        })));
    } else {
        initializeChapterInputs(webtoon);
    }
  };

  const addChapterGroup = () => {
    const lastGroup = chapterInputs[chapterInputs.length - 1];
    const lastNum = parseFloat(lastGroup?.number);
    const nextNum = !isNaN(lastNum) ? (lastNum + 1) : (chapterInputs.length + 1);
    setChapterInputs([...chapterInputs, createNewChapterInput(nextNum)]);
  };

  const updateChapterGroup = (id, data) => setChapterInputs(prevInputs => prevInputs.map(group => group.id === id ? data : group));
  const removeChapterGroup = (id) => { if (chapterInputs.length > 1) setChapterInputs(prevInputs => prevInputs.filter(group => group.id !== id))};
  
  const handleChapterProgressUpdate = (chapterInputIndex, chapterNum, progress, status, error) => {
    setChapterInputs(prevInputs => {
      const newInputs = [...prevInputs];
      let targetIndex = chapterInputIndex;
      if (newInputs[targetIndex]?.number !== chapterNum.toString()) {
         targetIndex = newInputs.findIndex(input => input.number === chapterNum.toString() && input.uploadStatus !== 'success');
      }
      if (!(newInputs[targetIndex]?.id === prevInputs[targetIndex]?.id && newInputs[targetIndex]?.number === chapterNum.toString())){
          targetIndex = prevInputs.findIndex(input => input.number === chapterNum.toString() && input.uploadStatus !== 'success');
          if (targetIndex === -1) {
             targetIndex = chapterInputIndex;
          }
      }

      if (targetIndex !== -1 && newInputs[targetIndex]) {
        newInputs[targetIndex] = { ...newInputs[targetIndex], uploadProgress: progress, uploadStatus: status, uploadError: error };
      } else {
        console.warn(`Could not find chapter input for progress update: index ${chapterInputIndex}, num ${chapterNum}`);
      }
      return newInputs;
    });
  };

  const handleOverallProgressUpdate = (progress) => setOverallUploadProgress(progress);

  const handleSubmitChapters = async () => {
    let validChaptersToUpload = [];
    let hasInvalidNumber = false;
    let hasNoPages = false;

    chapterInputs.forEach((group, index) => {
      const num = parseFloat(group.number);
      const isValidNumber = !isNaN(num) && num >= 0; 
      const hasPages = group.pages.length > 0;

      if (!isValidNumber) {
        hasInvalidNumber = true;
        toast({ title: "Erreur de validation", description: `Numéro de chapitre invalide pour le groupe ${index + 1} ("${group.number || 'non défini'}").`, variant: "destructive" });
      }
      if (!hasPages) {
        hasNoPages = true;
        toast({ title: "Erreur de validation", description: `Aucune page pour le chapitre ${group.number || `groupe ${index + 1}`}.`, variant: "destructive" });
      }
      if (isValidNumber && hasPages) {
        validChaptersToUpload.push({...group, originalIndex: index});
      }
    });
    
    if (hasInvalidNumber || hasNoPages || validChaptersToUpload.length === 0) {
      if (validChaptersToUpload.length === 0 && !hasInvalidNumber && !hasNoPages) {
         toast({ title: "Erreur", description: "Aucun chapitre valide à uploader.", variant: "destructive" });
      }
      return;
    }
    
    setChapterInputs(prev => prev.map(ch => ({...ch, uploadStatus: null, uploadError: null, uploadProgress: 0})));
    setLoading(true); setFormError(null); setOverallUploadProgress(0);

    const formattedChaptersData = validChaptersToUpload.map(group => ({
      number: parseFloat(group.number),
      thumbnailFile: group.thumbnailFile,
      pages: group.pages.map(pf => ({ file: pf.file })),
      required_roles: group.required_roles || [],
    }));

    try {
      const results = await addMultipleChapters(webtoonId, formattedChaptersData, handleOverallProgressUpdate, 
        (originalChIdx, chapterNum, progress, status, error) => {
           const chapterInputGlobalIndex = validChaptersToUpload.findIndex(vc => parseFloat(vc.number) === parseFloat(chapterNum) && vc.originalIndex === originalChIdx);
           if (chapterInputGlobalIndex !== -1) {
             handleChapterProgressUpdate(validChaptersToUpload[chapterInputGlobalIndex].originalIndex, chapterNum, progress, status, error);
           } else {
             const fallbackIndex = chapterInputs.findIndex(ci => parseFloat(ci.number) === parseFloat(chapterNum));
             handleChapterProgressUpdate(fallbackIndex !== -1 ? fallbackIndex : originalChIdx, chapterNum, progress, status, error);
           }
        }
      );

      let allSuccess = true;
      results.forEach((result) => {
         const targetInputDef = validChaptersToUpload.find(vc => parseFloat(vc.number) === parseFloat(result.number));
         const targetInputIndex = targetInputDef ? targetInputDef.originalIndex : -1;

         handleChapterProgressUpdate(targetInputIndex, result.number, 100, result.success ? 'success' : 'error', result.error);
         if (!result.success) allSuccess = false;
      });

      if (allSuccess) {
         toast({ title: "Succès", description: `${results.length} chapitre(s) ajouté(s)/mis à jour.` });
         initializeChapterInputs(webtoon); 
      } else {
         toast({ title: "Partiellement réussi", description: "Certains chapitres ont échoué. Vérifiez les détails sur chaque groupe de chapitre.", variant: "warning" });
      }
      await fetchData(); 
    } catch (error) {
      setFormError(`Échec global: ${error.message}`);
      toast({ title: "Erreur Globale", description: `Échec: ${error.message}`, variant: "destructive" });
    } finally { setLoading(false); setOverallUploadProgress(100); }
  };

  const handleDeleteExistingChapter = async (chapterIdToDelete, chapterNum) => {
     if (window.confirm(`Supprimer le chapitre ${chapterNum} ? Irréversible.`)) {
       setLoading(true);
       try {
         await deleteChapter(chapterIdToDelete); 
         toast({ title: "Succès", description: `Chapitre ${chapterNum} supprimé.` });
         await fetchData();
       } catch (error) { toast({ title: "Erreur", description: `Impossible de supprimer: ${error.message}`, variant: "destructive" }) } 
       finally { setLoading(false) }
     }
   };

  if (fetchingData) return <div className="flex justify-center items-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!webtoon) return null;

  const sortedChapters = webtoon.chapters?.sort((a, b) => b.number - a.number) || []; 

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6 pb-12">
      <Button variant="outline" size="sm" asChild><Link to="/admin/webtoons"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste des webtoons</Link></Button>
      
      <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle>Uploader Chapitres pour "{webtoon.title}"</CardTitle>
          <CardDescription>
            Ajoutez un ou plusieurs groupes de chapitres manuellement, ou déposez un fichier .ZIP.
            Le .ZIP doit contenir des dossiers nommés "Chapitre XX" (ex: "Chapitre 01", "Chapitre 10.5") contenant les pages.
            Si un numéro de chapitre existe déjà, ses pages, sa miniature et ses restrictions de rôles seront remplacées.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border-dashed border-2 border-muted-foreground/30 rounded-lg bg-muted/10">
            <Label className="text-base font-semibold mb-2 block flex items-center"><FileArchive className="h-5 w-5 mr-2 text-primary"/>Uploader un fichier .ZIP</Label>
            <FileUploader onZipExtracted={handleZipExtracted} acceptZip={true} />
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
                <span className="bg-card px-2 text-sm text-muted-foreground">OU</span>
            </div>
          </div>
          
          <Label className="text-base font-semibold mb-2 block">Ajouter des chapitres manuellement</Label>
          {formError && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{formError}</div>}
          <AnimatePresence>
            {chapterInputs.map((group, index) => (
              <motion.div key={group.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <ChapterInputGroup id={group.id} chapterData={group} onUpdate={updateChapterGroup} onRemove={removeChapterGroup} webtoonChapters={webtoon.chapters} isOnlyChapter={chapterInputs.length === 1} loading={loading} availableRoles={availableRoles}/>
              </motion.div>
            ))}
          </AnimatePresence>
          <Button variant="outline" size="sm" onClick={addChapterGroup} disabled={loading} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Ajouter un autre groupe de chapitre</Button>
          {loading && <div className="space-y-1 mt-4"><Label className="text-sm text-muted-foreground">Progression globale de l'upload...</Label><Progress value={overallUploadProgress} className="w-full h-2" /></div>}
        </CardContent>
        <CardFooter><Button onClick={handleSubmitChapters} disabled={loading || chapterInputs.every(g => g.pages.length === 0 || !g.number)}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{`Envoi (${Math.round(overallUploadProgress)}%)...`}</> : <><Upload className="mr-2 h-4 w-4" />{`Uploader ${chapterInputs.filter(g => g.pages.length > 0 && g.number).length} Chapitre(s)`}</>}</Button></CardFooter>
      </Card>
      <Card className="bg-card/80 backdrop-blur-sm shadow-md mt-8">
         <CardHeader><CardTitle className="text-lg">Chapitres Existants ({sortedChapters.length})</CardTitle></CardHeader>
         <CardContent>{sortedChapters.length > 0 ? <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">{sortedChapters.map(ch => (<li key={ch.id} className="flex justify-between items-center p-3 bg-muted/10 hover:bg-muted/20 rounded-md transition-colors">
          <div className="flex items-center space-x-3">
            {ch.thumbnailUrl ? 
                <img src={ch.thumbnailUrl} alt={`Miniature Chap. ${ch.number}`} className="h-12 w-12 object-cover rounded"/> 
                : <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">Pas de min.</div>
            }
            <div>
                <span className="font-medium">Chapitre {ch.number}</span>
                {ch.required_roles && ch.required_roles.length > 0 && 
                    <div className="text-xs text-muted-foreground flex items-center">
                        <ShieldCheck className="h-3 w-3 mr-1 text-primary/70"/> 
                        Restreint à: {ch.required_roles.join(', ')}
                    </div>
                }
            </div>
          </div>
          <div className="space-x-2">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild title="Modifier Chapitre">
                <Link to={`/admin/webtoons/${webtoonId}/chapters/${ch.id}/edit`}>
                    <Edit className="h-4 w-4" />
                </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteExistingChapter(ch.id, ch.number)} disabled={loading} title="Supprimer Chapitre">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          </li>))}</ul> : <p className="text-sm text-muted-foreground text-center py-4">Aucun chapitre uploadé pour ce webtoon.</p>}</CardContent>
       </Card>
    </motion.div>
  );
};

export default AdminChapterUpload;
