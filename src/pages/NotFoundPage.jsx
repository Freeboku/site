
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

const NotFoundPage = ({ message = "La page que vous cherchez n'existe pas." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/10 to-background text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="bg-card p-8 rounded-lg shadow-xl max-w-md w-full border border-border/50"
      >
        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 100 }}
          className="mb-6"
        >
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
        </motion.div>
        <h1 className="text-3xl font-bold text-destructive mb-3">Oops! Erreur 404</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
