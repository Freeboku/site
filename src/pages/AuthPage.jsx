
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || "/";

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
         if (!username || username.trim().length < 3) {
            throw new Error("Le pseudo doit contenir au moins 3 caractères.");
         }
         if (username.trim().length > 50) {
            throw new Error("Le pseudo ne doit pas dépasser 50 caractères.");
         }
         if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
            throw new Error("Le pseudo ne peut contenir que des lettres, des chiffres et des underscores (_).");
         }
         if (!email || !password) {
             throw new Error("Email et mot de passe sont requis.");
         }
         if (password.length < 6) {
            throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
         }
         const { data, error: signUpError } = await signUp({ email: email.trim(), password, username: username.trim() });
         if (signUpError) throw signUpError;
         
         if (data.user && !data.user.email_confirmed_at) {
            toast({ title: "Inscription réussie !", description: "Veuillez vérifier votre email pour confirmer votre compte." });
            setIsSignUp(false); 
         } else if (data.user) {
            toast({ title: "Inscription et connexion réussies !" });
            navigate(from, { replace: true });
         } else {
             toast({ title: "Inscription réussie !", description: "Vous pouvez maintenant vous connecter." });
             setIsSignUp(false);
         }

      } else {
         if (!email || !password) {
             throw new Error("Email et mot de passe sont requis.");
         }
        const { error: signInError } = await signIn({ email: email.trim(), password });
        if (signInError) throw signInError;
        toast({ title: "Connexion réussie !" });
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Une erreur s'est produite.");
      toast({ title: "Erreur d'authentification", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center py-12 px-4"
    >
      <Tabs defaultValue="login" className="w-[400px]" onValueChange={(value) => { setIsSignUp(value === 'signup'); setError(null); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Connexion</TabsTrigger>
          <TabsTrigger value="signup">Inscription</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>Connectez-vous à votre compte pour accéder à vos favoris et plus.</CardDescription>
            </CardHeader>
             <form onSubmit={handleAuth}>
               <CardContent className="space-y-4">
                  {error && !isSignUp && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}
                 <div className="space-y-1">
                   <Label htmlFor="login-email">Email</Label>
                   <Input 
                     id="login-email" 
                     type="email" 
                     placeholder="nom@exemple.com" 
                     value={email} 
                     onChange={(e) => setEmail(e.target.value)} 
                     required 
                     disabled={loading}
                   />
                 </div>
                 <div className="space-y-1">
                   <Label htmlFor="login-password">Mot de passe</Label>
                   <Input 
                     id="login-password" 
                     type="password" 
                     value={password} 
                     onChange={(e) => setPassword(e.target.value)} 
                     required 
                     disabled={loading}
                   />
                 </div>
               </CardContent>
               <CardFooter>
                 <Button type="submit" className="w-full" disabled={loading}>
                   {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                   {loading ? 'Connexion...' : 'Se connecter'}
                 </Button>
               </CardFooter>
             </form>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Inscription</CardTitle>
              <CardDescription>Créez un compte pour sauvegarder vos préférences.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAuth}>
              <CardContent className="space-y-4">
                 {error && isSignUp && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}
                <div className="space-y-1">
                  <Label htmlFor="signup-username">Pseudo</Label>
                  <Input 
                    id="signup-username" 
                    type="text" 
                    placeholder="Votre pseudo unique" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    minLength={3}
                    maxLength={50}
                    disabled={loading}
                  />
                   <p className="text-xs text-muted-foreground">3-50 caractères. Lettres, chiffres, underscores (_).</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="nom@exemple.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                    disabled={loading}
                  />
                   <p className="text-xs text-muted-foreground">Minimum 6 caractères.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                   {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                   {loading ? 'Inscription...' : "S'inscrire"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AuthPage;
