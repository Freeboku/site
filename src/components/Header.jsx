
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Home, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => { // Removed props as it's now part of Layout
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm"
    >
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors">
          <BookOpen className="h-7 w-7" />
          <span className="text-xl font-bold tracking-tight">ScanTrad Hub</span>
        </Link>
        <div className="flex items-center space-x-2">
           <Button variant="ghost" size="sm" asChild>
             <Link to="/">
               <Home className="h-4 w-4 mr-2" />
               Accueil
             </Link>
           </Button>
           <Button variant="outline" size="sm" asChild>
             <Link to="/admin">
               <Shield className="h-4 w-4 mr-2" />
               Admin
             </Link>
           </Button>
        </div>
      </nav>
    </motion.header>
  );
};

export default Header; // Keep export if used elsewhere, but likely redundant now
