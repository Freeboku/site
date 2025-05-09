
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Edit, Trash2, ShieldCheck, User as UserIcon, Loader2, Info } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getCustomRoles, createCustomRole, updateCustomRole, deleteCustomRole } from '@/services/roleService';

const CORE_ROLES = [
  { id: 'core_admin', name: 'admin', description: 'Accès complet à toutes les fonctionnalités d\'administration.', isCore: true },
  { id: 'core_user', name: 'user', description: 'Rôle par défaut pour les utilisateurs enregistrés.', isCore: true },
];

const AdminRoleList = () => {
  const [customRoles, setCustomRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const { toast } = useToast();

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCustomRoles = await getCustomRoles();
      setCustomRoles(fetchedCustomRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({ title: "Erreur", description: "Impossible de charger les rôles personnalisés.", variant: "destructive" });
      setCustomRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const allRoles = useMemo(() => {
    return [...CORE_ROLES, ...customRoles.map(cr => ({...cr, isCore: false}))].sort((a,b) => a.name.localeCompare(b.name));
  }, [customRoles]);


  const handleEdit = (role) => {
    if (role.isCore) {
      toast({ title: "Action non autorisée", description: `Le rôle "${role.name}" est un rôle système et ne peut pas être modifié.`, variant: "destructive" });
      return;
    }
    setCurrentRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (roleId, roleName) => {
    if (CORE_ROLES.find(r => r.name === roleName)) {
       toast({ title: "Action non autorisée", description: `Le rôle "${roleName}" est un rôle système et ne peut pas être supprimé.`, variant: "destructive" });
       return;
    }
    setIsSaving(true);
    try {
      await deleteCustomRole(roleId);
      toast({ title: "Succès", description: `Le rôle "${roleName}" a été supprimé.` });
      fetchRoles(); 
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({ title: "Erreur", description: error.message || "Impossible de supprimer le rôle.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast({ title: "Validation échouée", description: "Le nom du rôle est requis.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      if (currentRole) {
        await updateCustomRole(currentRole.id, roleName, roleDescription);
        toast({ title: "Succès", description: `Le rôle "${roleName}" a été mis à jour.` });
      } else {
        await createCustomRole(roleName, roleDescription);
        toast({ title: "Succès", description: `Le rôle "${roleName}" a été créé.` });
      }
      fetchRoles();
      setIsDialogOpen(false);
      setCurrentRole(null);
      setRoleName('');
      setRoleDescription('');
    } catch (error) {
      console.error("Error saving role:", error);
      toast({ title: "Erreur", description: error.message || "Impossible d'enregistrer le rôle.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openDialog = (role = null) => {
    if (role && role.isCore) {
      handleEdit(role); 
      return;
    }
    setCurrentRole(role);
    setRoleName(role ? role.name : '');
    setRoleDescription(role ? (role.description || '') : '');
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Rôles</h1>
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Ajouter un Rôle Personnalisé
        </Button>
      </div>
      
      <Card className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
        <div className="flex items-start">
          <Info className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
          <div>
            <p className="font-bold">Information sur les Rôles</p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-1">
              <li>Les rôles <span className="font-semibold">'admin'</span> et <span className="font-semibold">'user'</span> sont des rôles système et ne peuvent pas être modifiés ou supprimés.</li>
              <li>Vous pouvez créer des rôles personnalisés pour une gestion plus fine des accès (fonctionnalité d'assignation à venir).</li>
              <li>Actuellement, les rôles personnalisés ne sont pas automatiquement assignables aux utilisateurs via l'interface "Gérer Utilisateurs". Leur utilité principale sera pour des vérifications de permissions spécifiques dans le code.</li>
            </ul>
          </div>
        </div>
      </Card>

      {allRoles.length === 0 && !isLoading && (
        <div className="text-center py-10 bg-card border rounded-lg">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">Aucun rôle défini</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Commencez par ajouter des rôles personnalisés.
          </p>
        </div>
      )}

      {allRoles.length > 0 && (
        <Card className="overflow-hidden shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Nom du Rôle</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRoles.map((role) => (
                <TableRow key={role.id} className={role.isCore ? 'bg-muted/30' : ''}>
                  <TableCell>
                    {role.name === 'admin' ? <ShieldCheck className="h-5 w-5 text-primary" /> : <UserIcon className="h-5 w-5 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{role.description || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(role)} className="mr-2" disabled={role.isCore}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={role.isCore}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce rôle ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. La suppression du rôle "{role.name}" peut affecter les permissions des utilisateurs si ce rôle est utilisé quelque part.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(role.id, role.name)} className="bg-destructive hover:bg-destructive/90" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setCurrentRole(null);
          setRoleName('');
          setRoleDescription('');
        }
        setIsDialogOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentRole ? "Modifier le Rôle" : "Ajouter un Nouveau Rôle Personnalisé"}</DialogTitle>
            <DialogDescription>
              {currentRole ? "Modifiez les détails du rôle." : "Créez un nouveau rôle et définissez sa description."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="roleNameDialog" className="text-right">Nom</label>
              <Input id="roleNameDialog" value={roleName} onChange={(e) => setRoleName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="roleDescriptionDialog" className="text-right">Description</label>
              <Textarea id="roleDescriptionDialog" value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} className="col-span-3" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Annuler</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentRole ? "Sauvegarder" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRoleList;
