
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getAllPopups, addPopup, updatePopup, deletePopup } from '@/services/userService';
import PopupFormDialog from '@/components/admin/popups/PopupFormDialog';
import PopupTableRow from '@/components/admin/popups/PopupTableRow';

const AdminPopupManager = () => {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPopupForEdit, setCurrentPopupForEdit] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchPopups = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await getAllPopups();
      setPopups(data);
    } catch (err) {
      setError("Impossible de charger les pop-ups.");
      toast({ title: "Erreur de chargement", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchPopups(); }, [fetchPopups]);

  const openFormForNew = () => {
    setCurrentPopupForEdit(null);
    setIsFormOpen(true);
  };

  const openFormForEdit = (popup) => {
    setCurrentPopupForEdit(popup);
    setIsFormOpen(true);
  };
  
  const handleDialogStateChange = (open) => {
    setIsFormOpen(open);
    if (!open) {
      setCurrentPopupForEdit(null); // Reset when dialog is closed
    }
  };

  const handleFormSubmit = async (submittedFormData) => {
    setFormLoading(true);
    try {
      if (currentPopupForEdit) {
        await updatePopup(currentPopupForEdit.id, submittedFormData);
        toast({ title: "Succès", description: "Pop-up mis à jour." });
      } else {
        await addPopup(submittedFormData);
        toast({ title: "Succès", description: "Pop-up ajouté." });
      }
      setIsFormOpen(false);
      setCurrentPopupForEdit(null);
      fetchPopups();
    } catch (err) {
      toast({ title: "Erreur d'enregistrement", description: err.message, variant: "destructive" });
    } finally { setFormLoading(false); }
  };

  const handleDeletePopup = async (popupId, popupTitle) => {
    if (window.confirm(`Supprimer la pop-up "${popupTitle}" ?`)) {
      try {
        setLoading(true); // Indicate loading for delete operation
        await deletePopup(popupId);
        toast({ title: "Succès", description: `Pop-up "${popupTitle}" supprimée.` });
        fetchPopups(); // Refreshes list and sets loading to false
      } catch (err) {
        toast({ title: "Erreur de suppression", description: err.message, variant: "destructive" });
        setLoading(false); // Ensure loading is false on error
      }
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } }};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gérer les Pop-ups</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={fetchPopups} disabled={loading} title="Rafraîchir"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          <Button onClick={openFormForNew}><PlusCircle className="mr-2 h-4 w-4" /> Nouvelle Pop-up</Button>
        </div>
      </div>
      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <Card className="bg-card/80 backdrop-blur-sm shadow-md">
        <CardContent className="p-0">
          {loading && popups.length === 0 ? <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
           : popups.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Statut</TableHead><TableHead>Période</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                {popups.map(p => (
                  <PopupTableRow
                    key={p.id}
                    popup={p}
                    onEdit={openFormForEdit}
                    onDelete={handleDeletePopup}
                  />
                ))}
              </motion.tbody>
            </Table>
          ) : <div className="p-8 text-center text-muted-foreground">Aucune pop-up créée.</div>}
        </CardContent>
      </Card>

      <PopupFormDialog
        isOpen={isFormOpen}
        onOpenChange={handleDialogStateChange}
        onSubmit={handleFormSubmit}
        initialPopupData={currentPopupForEdit}
        formLoading={formLoading}
      />
    </motion.div>
  );
};

export default AdminPopupManager;
