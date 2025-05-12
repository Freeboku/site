
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/services/userService.js'; 
import { getUserFavorites } from '@/services/webtoonService.js'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, Edit2, Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import WebtoonCard from '@/components/WebtoonCard';

const ProfilePage = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true); 
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const resetFormFields = useCallback(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      resetFormFields();
      setLoadingProfile(false);
    } else if (!authLoading && user) {
       refreshProfile().finally(() => setLoadingProfile(false));
    }
  }, [profile, user, authLoading, resetFormFields, refreshProfile]); 
  
  useEffect(() => {
    const loadFavorites = async () => {
      if(user?.id) {
        setLoadingFavorites(true);
        try {
           const favData = await getUserFavorites(user.id); 
           setFavorites(favData);
        } catch(err) {
           console.error("Failed to load favorites:", err);
           toast({ title: "Erreur", description: "Impossible de charger les favoris.", variant: "destructive" });
        } finally {
           setLoadingFavorites(false);
        }
      } else {
         setFavorites([]);
         setLoadingFavorites(false);
      }
    };
    loadFavorites();
  }, [user, toast]); 

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.trim().length < 3) {
      toast({ title: "Erreur", description: "Pseudo invalide (min 3 caractères).", variant: "destructive" });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updateData = { 
        username: username.trim(),
        bio: bio.trim()
      };

      await updateUserProfile(user.id, updateData);
      await refreshProfile(); 
      toast({ title: "Succès", description: "Profil mis à jour." });
      setEditing(false); 
    } catch (err) {
      console.error("Profile update error:", err);
      setError(`Erreur: ${err.message}`);
      toast({ title: "Erreur", description: `Impossible de mettre à jour: ${err.message}`, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
     if (!name) return '?';
     const names = name.split(' ');
     if (names.length === 1) return name.substring(0, 2).toUpperCase();
     return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
  }

  if (authLoading || loadingProfile) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user || !profile) {
     return <div className="text-center py-10">Veuillez vous connecter pour voir votre profil. Rechargement des données...</div>;
  }
  
  const currentAvatarForDisplay = profile?.avatarUrl || '';
  const currentUsernameForDisplay = editing ? username : (profile?.username || 'Non défini');
  const currentBioForDisplay = editing ? bio : (profile?.bio || '');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
      className="container mx-auto py-8 px-4 max-w-4xl"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <Card className="overflow-hidden shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative group flex-shrink-0">
                 <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-primary/50 shadow-md">
                   <AvatarImage src={currentAvatarForDisplay} alt={currentUsernameForDisplay} />
                   <AvatarFallback className="text-3xl">{getInitials(currentUsernameForDisplay)}</AvatarFallback>
                 </Avatar>
              </div>
              
              <div className="flex-grow space-y-2 text-center sm:text-left">
                 {editing ? (
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      className="text-2xl font-bold"
                      disabled={saving}
                      maxLength={30}
                      placeholder="Nom d'utilisateur"
                    />
                 ) : (
                    <CardTitle className="text-3xl font-bold">{currentUsernameForDisplay}</CardTitle>
                 )}
                <CardDescription>{user.email}</CardDescription>
                <CardDescription>Rôle: <span className={`font-medium ${profile?.roleName === 'admin' ? 'text-destructive' : 'text-primary'}`}>{profile?.roleName || 'user'}</span></CardDescription>
              </div>
              
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => { setEditing(true); resetFormFields(); }} className="ml-auto flex-shrink-0">
                  <Edit2 className="mr-2 h-4 w-4" /> Modifier le Profil
                </Button>
              )}
            </div>
          </CardHeader>
          
          {editing && (
            <CardContent className="p-6 border-t">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bio">Bio (optionnel)</Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                    disabled={saving}
                    maxLength={200}
                    placeholder="Parlez un peu de vous..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">{bio.length}/200 caractères</p>
                </div>
              </div>
            </CardContent>
           )}
           {!editing && profile?.bio && (
             <CardContent className="p-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
             </CardContent>
           )}

          {editing && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 p-6 border-t">
               {error && <p className="text-sm text-destructive mr-auto">{error}</p>}
               <Button variant="ghost" onClick={() => { setEditing(false); resetFormFields(); setError(null);}} disabled={saving}>
                  Annuler
               </Button>
               <Button onClick={handleSaveProfile} disabled={saving || (!username.trim() || username.trim().length < 3)}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {saving ? 'Sauvegarde...' : 'Enregistrer'}
               </Button>
            </CardFooter>
           )}
        </Card>
      </motion.div>

       <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="mt-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center"><Heart className="mr-3 h-6 w-6 text-red-500"/> Mes Favoris</h2>
         {loadingFavorites ? (
            <div className="flex justify-center items-center py-10">
               <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
         ) : favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {favorites.map(webtoon => (
                 webtoon?.slug && ( 
                    <WebtoonCard key={webtoon.slug} webtoon={webtoon} isFavorite={true} />
                 )
               ))}
            </div>
         ) : (
            <EmptyState 
               title="Aucun favori" 
               message="Vous n'avez pas encore ajouté de webtoon à vos favoris. Explorez notre catalogue !" 
               actionElement={<Button asChild><Link to="/webtoons">Explorer les Webtoons</Link></Button>}
            />
         )}
       </motion.div>
       
    </motion.div>
  );
};

export default ProfilePage;
