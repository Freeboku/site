
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const defaultPopupImagePlaceholder = 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0';

const PopupFormDialog = ({ isOpen, onOpenChange, onSubmit, initialPopupData, formLoading }) => {
  const [formData, setFormData] = useState({
    title: '', content: '', is_active: false,
    start_date: '', end_date: '',
    imageFile: null, existingImageUrl: null, removeImage: false,
    link_url: '', link_text: ''
  });
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialPopupData) {
        setFormData({
          title: initialPopupData.title || '',
          content: initialPopupData.content || '',
          is_active: initialPopupData.is_active || false,
          start_date: initialPopupData.start_date ? new Date(initialPopupData.start_date).toISOString().slice(0, 16) : '',
          end_date: initialPopupData.end_date ? new Date(initialPopupData.end_date).toISOString().slice(0, 16) : '',
          imageFile: null,
          existingImageUrl: initialPopupData.image_url || null, // This is the DB path
          removeImage: false,
          link_url: initialPopupData.link_url || '',
          link_text: initialPopupData.link_text || ''
        });
        setImagePreview(initialPopupData.imageUrl || ''); // This is the displayable public URL
      } else {
        setFormData({
          title: '', content: '', is_active: false,
          start_date: '', end_date: '',
          imageFile: null, existingImageUrl: null, removeImage: false,
          link_url: '', link_text: ''
        });
        setImagePreview('');
      }
    }
  }, [initialPopupData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, imageFile: file, removeImage: false }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (file) {
      alert("Veuillez sélectionner un fichier image valide.");
    }
  };
  
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageFile: null, removeImage: true }));
    setImagePreview('');
  };

  const internalHandleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Titre et contenu sont obligatoires."); // Or use toast from parent
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialPopupData ? 'Modifier Pop-up' : 'Nouvelle Pop-up'}</DialogTitle>
          <DialogDescription>
            Remplissez les informations de la pop-up. Les dates sont optionnelles.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={internalHandleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="popup-title">Titre</Label>
            <Input id="popup-title" name="title" value={formData.title} onChange={handleInputChange} placeholder="Titre de la pop-up" required disabled={formLoading} />
          </div>
          <div>
            <Label htmlFor="popup-content">Contenu</Label>
            <Textarea id="popup-content" name="content" value={formData.content} onChange={handleInputChange} placeholder="Message de la pop-up..." rows={4} required disabled={formLoading} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="popup-start_date">Date de début (Optionnel)</Label>
              <Input id="popup-start_date" name="start_date" type="datetime-local" value={formData.start_date} onChange={handleInputChange} disabled={formLoading} />
            </div>
            <div>
              <Label htmlFor="popup-end_date">Date de fin (Optionnel)</Label>
              <Input id="popup-end_date" name="end_date" type="datetime-local" value={formData.end_date} onChange={handleInputChange} disabled={formLoading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="popup-imageFile">Image (Optionnel)</Label>
            {imagePreview && (
              <div className="my-2 relative w-full aspect-video bg-muted rounded overflow-hidden">
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src=defaultPopupImagePlaceholder; }}/>
              </div>
            )}
            <Input id="popup-imageFile" type="file" accept="image/*" onChange={handleImageFileChange} className="file-input" disabled={formLoading} />
            { (formData.existingImageUrl || imagePreview) && !formData.removeImage && (
              <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage} disabled={formLoading} className="text-xs">
                Supprimer l'image actuelle
              </Button>
            )}
            {formData.removeImage && <p className="text-xs text-muted-foreground">L'image sera supprimée à l'enregistrement.</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="popup-link_url">URL du lien (Optionnel)</Label>
              <Input id="popup-link_url" name="link_url" type="url" value={formData.link_url} onChange={handleInputChange} placeholder="https://example.com" disabled={formLoading} />
            </div>
            <div>
              <Label htmlFor="popup-link_text">Texte du lien (Optionnel)</Label>
              <Input id="popup-link_text" name="link_text" value={formData.link_text} onChange={handleInputChange} placeholder="En savoir plus" disabled={formLoading} />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="popup-is_active" name="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} disabled={formLoading} />
            <Label htmlFor="popup-is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Activer cette pop-up ?
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline" disabled={formLoading}>Annuler</Button></DialogClose>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (initialPopupData ? 'Enregistrer' : 'Ajouter')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PopupFormDialog;
