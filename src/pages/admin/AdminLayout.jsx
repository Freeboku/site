
import React from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookCopy, Users, MessageSquare, Home, LogOut } from 'lucide-react'; // Added MessageSquare
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; 
import { useToast } from '@/components/ui/use-toast'; 

const AdminLayout = () => {
   const { signOut } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    }`;

   const handleSignOut = async () => {
     try {
       await signOut();
       toast({ title: "Déconnexion réussie" });
       navigate('/'); // Redirect to home after sign out
     } catch (error) {
       console.error("Admin sign out error:", error);
       toast({ title: "Erreur de déconnexion", description: error.message, variant: "destructive" });
     }
   };

  return (
    <div className="min-h-screen flex bg-muted/40">
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-64 bg-background border-r border-border flex flex-col fixed h-full"
      >
        <div className="p-4 border-b border-border">
          <Link to="/admin" className="flex items-center space-x-2 text-primary">
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-lg font-semibold">Admin Panel</span>
          </Link>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <NavLink to="/admin" end className={navLinkClass}>
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Tableau de bord
          </NavLink>
          <NavLink to="/admin/webtoons" className={navLinkClass}>
            <BookCopy className="mr-3 h-5 w-5" />
            Gérer Webtoons
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClass}> 
             <Users className="mr-3 h-5 w-5" />
             Gérer Utilisateurs
          </NavLink>
          <NavLink to="/admin/comments" className={navLinkClass}> 
             <MessageSquare className="mr-3 h-5 w-5" />
             Gérer Commentaires
          </NavLink>

          <div className="pt-4 mt-auto space-y-2 border-t border-border/50">
             <Button variant="outline" size="sm" asChild className="w-full justify-start">
               <Link to="/">
                 <Home className="h-4 w-4 mr-2" />
                 Retour au site public
               </Link>
             </Button>
             <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion Admin
             </Button>
          </div>
        </nav>
         <div className="p-4 border-t border-border text-center text-xs text-muted-foreground">
           ScanTrad Hub Admin
         </div>
      </motion.aside>

      <div className="flex-1 ml-64 flex flex-col">
         <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm h-16 flex items-center px-6">
           {/* Header content can be dynamic based on Outlet context if needed */}
           <h1 className="text-xl font-semibold">Administration</h1>
         </header>
         <main className="flex-grow p-6">
           <Outlet />
         </main>
      </div>
    </div>
  );
};

export default AdminLayout;
