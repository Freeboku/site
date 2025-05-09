
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Image as ImageIcon, Loader2, X, CheckSquare, Square } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getWebtoonById, addWebtoon, updateWebtoon } from '@/services/webtoonService'; 

const AdminWebtoonForm = () => {
  const { webtoonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(webtoonId);

  const [webtoon, setWebtoon] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [existingCoverPath, setExistingCoverPath] = useState(null);
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [existingBannerPath, setExistingBannerPath] = useState(null);
  const [isBanner, setIsBanner] = useState(false);
  const [showPublicViews, setShowPublicViews] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const defaultCover = 'https://images.unsplash.com/photo-1637840616499-1349c96347fa';
  const defaultBanner = 'https://images.unsplash.com/photo-1647589307181-3681cd0cb2fb';

  useEffect(() => {
    const fetchWebtoonData = async () => {
      if (isEditing) {
        setLoading(true);
        setFormError(null);
        try {
          const fetchedWebtoon = await getWebtoonById(webtoonId);
          if (fetchedWebtoon) {
            setWebtoon(fetchedWebtoon);
            setTitle(fetchedWebtoon.title);
            setDescription(fetchedWebtoon.description || '');
            setTags(fetchedWebtoon.tags || []);
            setCoverPreview(fetchedWebtoon.coverImageUrl || '');
            setExistingCoverPath(fetchedWebtoon.cover_image_url || null);
            setBannerPreview(fetchedWebtoon.bannerImageUrl || '');
            setExistingBannerPath(fetchedWebtoon.banner_image_url || null);
            setIsBanner(fetchedWebtoon.is_banner || false);
            setShowPublicViews(fetchedWebtoon.show_public_views || false);
          } else {
             toast({ title: "Erreur", description: "Webtoon non trouvé.", variant: "destructive" });
             navigate('/admin/webtoons');
          }
        } catch (err) {
           console.error("Failed to fetch webtoon data:", err);
           setFormError("Impossible de charger les données du webtoon.");
           toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
        } finally {
           setLoading(false);
        }
      }
    };
    fetchWebtoonData();
  }, [webtoonId, isEditing, navigate, toast]);

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'cover') {
          setCoverImageFile(file);
          setCoverPreview(reader.result);
        } else if (type === 'banner') {
          setBannerImageFile(file);
          setBannerPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (type === 'cover') {
        setCoverImageFile(null);
        setCoverPreview(webtoon?.coverImageUrl || '');
      } else if (type === 'banner') {
        setBannerImageFile(null);
        setBannerPreview(webtoon?.bannerImageUrl || '');
      }
      if (file) {
        toast({ title: "Fichier invalide", description: "Veuillez sélectionner un fichier image.", variant: "destructive" });
      }
    }
  };

  const handleTagInputChange = (e) => setTagInput(e.target.value);

  const handleTagInputKeyDown = (e) => {
     if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const newTag = tagInput.trim().toLowerCase();
        if (newTag && !tags.includes(newTag)) {
           setTags([...tags, newTag]);
        }
        setTagInput('');
     }
  };

  const removeTag = (tagToRemove) => setTags(tags.filter(tag => tag !== tagToRemove));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      toast({ title: "Champ requis", description: "Le titre est obligatoire.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setFormError(null);

    const webtoonData = {
      title, description, tags,
      coverImageFile, existingCoverPath,
      bannerImageFile, existingBannerPath,
      is_banner: isBanner,
      show_public_views: showPublicViews,
    };

    try {
      if (isEditing) {
        await updateWebtoon(webtoonId, webtoonData);
        toast({ title: "Succès", description: "Webtoon mis à jour." });
      } else {
        await addWebtoon({ ...webtoonData, id: crypto.randomUUID() }); 
        toast({ title: "Succès", description: "Webtoon ajouté." });
      }
      navigate('/admin/webtoons');
    } catch (error) {
       console.error("Failed to save webtoon:", error);
       setFormError(`Échec: ${error.message}`);
       toast({ title: "Erreur", description: `Échec: ${error.message}`, variant: "destructive" });
    } finally {
       setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link to="/admin/webtoons"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link>
      </Button>
      <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle>{isEditing ? 'Modifier Webtoon' : 'Ajouter Webtoon'}</CardTitle>
          <CardDescription>Remplissez les informations. Chapitres ajoutés séparément.</CardDescription>
        </CardHeader>
        {loading && isEditing && !webtoon ? (
           <div className="flex justify-center items-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {formError && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{formError}</div>}
              
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du Webtoon" required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Synopsis..." rows={4} disabled={loading} />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="tags">Tags</Label>
                 <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md min-h-[40px] bg-background">
                    {tags.map(tag => (
                       <span key={tag} className="flex items-center px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-secondary-foreground/70 hover:text-secondary-foreground" disabled={loading} aria-label={`Supprimer tag ${tag}`}>
                             <X className="h-3 w-3" />
                          </button>
                       </span>
                    ))}
                    <Input id="tags" value={tagInput} onChange={handleTagInputChange} onKeyDown={handleTagInputKeyDown} placeholder={tags.length === 0 ? "Ajouter tags (action, romance)..." : ""} className="flex-grow border-none shadow-none focus-visible:ring-0 h-auto p-0 m-0 bg-transparent" disabled={loading} />
                 </div>
                 <p className="text-xs text-muted-foreground">Entrée ou virgule pour ajouter.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Image de Couverture</Label>
                  <img src={coverPreview || defaultCover} alt="Aperçu Couverture" className="h-32 w-auto object-cover rounded border border-border aspect-[3/4] bg-muted" onError={(e) => { e.target.onerror = null; e.target.src=defaultCover; }} />
                  <Input id="coverImage" type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} className="file-input" disabled={loading} />
                  <p className="text-xs text-muted-foreground">Laisser vide pour garder l'actuelle (si édition).</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerImage">Image de Bannière (Optionnel)</Label>
                  <img src={bannerPreview || defaultBanner} alt="Aperçu Bannière" className="h-32 w-auto object-cover rounded border border-border aspect-[16/9] bg-muted" onError={(e) => { e.target.onerror = null; e.target.src=defaultBanner; }} />
                  <Input id="bannerImage" type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} className="file-input" disabled={loading} />
                  <p className="text-xs text-muted-foreground">Si vide, la couverture sera utilisée pour la bannière.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="isBanner" checked={isBanner} onCheckedChange={setIsBanner} disabled={loading} />
                <Label htmlFor="isBanner" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Afficher dans la bannière de la page d'accueil ?
                </Label>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="showPublicViews" checked={showPublicViews} onCheckedChange={setShowPublicViews} disabled={loading} />
                <Label htmlFor="showPublicViews" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Afficher le nombre de vues publiquement ?
                </Label>
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" className="ml-auto" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {loading ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </motion.div>
  );
};

export default AdminWebtoonForm;
