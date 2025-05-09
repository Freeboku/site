
import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsersWithRoles, updateUserRole as apiUpdateUserRole } from '@/services/userService';
import { getCustomRoles } from '@/services/roleService';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Shield, User, Edit3, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CORE_ROLES = [
  { id: 'core_user', name: 'user', description: 'Rôle utilisateur standard' },
  { id: 'core_admin', name: 'admin', description: 'Rôle administrateur système' },
];

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [allAvailableRoles, setAllAvailableRoles] = useState(CORE_ROLES);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedUsers, fetchedCustomRoles] = await Promise.all([
        getAllUsersWithRoles(),
        getCustomRoles()
      ]);
      
      setUsers(fetchedUsers.map(u => ({...u, roleName: u.role || 'user'})));
      
      const customRolesForSelect = fetchedCustomRoles.map(r => ({ id: r.id, name: r.name, description: r.description }));
      setAllAvailableRoles([...CORE_ROLES, ...customRolesForSelect].sort((a,b) => a.name.localeCompare(b.name)));

    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({ title: "Erreur", description: "Impossible de charger les données initiales.", variant: "destructive" });
      setUsers([]);
      setAllAvailableRoles(CORE_ROLES);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleRoleChange = (userId, currentRole) => {
    setEditingUserId(userId);
    setSelectedRole(currentRole || 'user');
  };

  const handleSaveRole = async (userId) => {
    if (!selectedRole) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un rôle.", variant: "destructive" });
      return;
    }
    if (adminUser && userId === adminUser.id && selectedRole !== 'admin') {
      toast({ title: "Action non autorisée", description: "Vous ne pouvez pas modifier votre propre rôle d'administrateur à autre chose qu'admin.", variant: "destructive" });
      setEditingUserId(null);
      setSelectedRole('');
      return;
    }
    try {
      await apiUpdateUserRole(userId, selectedRole);
      toast({ title: "Succès", description: "Le rôle de l'utilisateur a été mis à jour." });
      setUsers(users.map(u => u.id === userId ? { ...u, role: selectedRole, roleName: selectedRole } : u));
      setEditingUserId(null);
      setSelectedRole('');
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({ title: "Erreur", description: error.message || "Impossible de mettre à jour le rôle.", variant: "destructive" });
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return name.substring(0, 2).toUpperCase();
    return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
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
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <UsersIcon className="mr-3 h-8 w-8 text-primary" />
        Gestion des Utilisateurs
      </h1>
      
      <div className="bg-card border rounded-lg overflow-hidden shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Nom d'utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle Actuel</TableHead>
              <TableHead className="w-[250px]">Changer Rôle</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userProfile) => (
              <TableRow key={userProfile.id}>
                <TableCell>
                  <Avatar className="h-10 w-10 border-2 border-primary/30">
                    <AvatarImage src={userProfile.avatarUrl} alt={userProfile.username} />
                    <AvatarFallback>{getInitials(userProfile.username)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{userProfile.username || 'N/A'}</TableCell>
                <TableCell className="text-muted-foreground">{userProfile.email || 'N/A'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    userProfile.roleName === 'admin' ? 'bg-primary/20 text-primary' : 
                    userProfile.roleName === 'user' ? 'bg-muted text-muted-foreground' :
                    'bg-accent/20 text-accent-foreground' 
                  }`}>
                    {userProfile.roleName === 'admin' ? <Shield className="inline h-3 w-3 mr-1" /> : <User className="inline h-3 w-3 mr-1" />}
                    {userProfile.roleName || 'user'}
                  </span>
                </TableCell>
                <TableCell>
                  {editingUserId === userProfile.id ? (
                    <Select 
                        value={selectedRole} 
                        onValueChange={(value) => setSelectedRole(value)} 
                        disabled={adminUser && userProfile.id === adminUser.id && selectedRole !== 'admin'}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {allAvailableRoles.map(roleOption => (
                          <SelectItem key={roleOption.id} value={roleOption.name}>
                            {roleOption.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    userProfile.roleName || 'user'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingUserId === userProfile.id ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveRole(userProfile.id)} 
                        className="mr-2" 
                        disabled={adminUser && userProfile.id === adminUser.id && selectedRole !== 'admin'}
                      >
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingUserId(null); setSelectedRole(''); }}>Annuler</Button>
                    </>
                  ) : (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRoleChange(userProfile.id, userProfile.roleName)} 
                        disabled={adminUser && userProfile.id === adminUser.id && userProfile.roleName === 'admin'}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {users.length === 0 && !isLoading && (
         <div className="text-center py-10 bg-card border rounded-lg mt-6 shadow-md">
           <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
           <h3 className="mt-2 text-lg font-medium">Aucun utilisateur trouvé</h3>
           <p className="mt-1 text-sm text-muted-foreground">
             Il n'y a pas encore d'utilisateurs enregistrés sur le site.
           </p>
         </div>
       )}
    </div>
  );
};

export default AdminUserList;
