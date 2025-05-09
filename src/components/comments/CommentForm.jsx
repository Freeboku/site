
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { addComment } from '@/services/commentService';

const CommentForm = ({ webtoonId, chapterId = null, parentCommentId = null, onCommentAdded, onCancelReply }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
   const getInitials = (name) => {
      if (!name) return '?';
      const names = name.split(' ');
      if (names.length === 1) return name.substring(0, 2).toUpperCase();
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
   }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({ title: "Erreur", description: "Le commentaire ne peut pas être vide.", variant: "destructive" });
      return;
    }
    if (content.length > 2000) {
      toast({ title: "Erreur", description: "Le commentaire ne doit pas dépasser 2000 caractères.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const newComment = await addComment({
        webtoonId,
        chapterId,
        userId: user.id,
        content,
        parentCommentId,
      });
      setContent(''); 
      toast({ title: "Succès", description: "Commentaire ajouté." });
      if (onCommentAdded) {
        onCommentAdded(newComment); 
      }
      if (onCancelReply) { 
         onCancelReply();
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast({ title: "Erreur", description: `Impossible d'ajouter le commentaire: ${err.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       onSubmit={handleSubmit} 
       className="flex items-start space-x-4"
    >
      <Avatar className="h-10 w-10 border">
         <AvatarImage src={profile?.avatarUrl} alt={profile?.username} />
         <AvatarFallback>{getInitials(profile?.username || user?.email)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow space-y-2">
        <Textarea
          placeholder={parentCommentId ? "Écrire une réponse..." : "Ajouter un commentaire public..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={parentCommentId ? 2 : 3} 
          disabled={loading}
          required
          maxLength={2000}
          className="bg-muted/30 focus:bg-background"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">{content.length}/2000</p>
          <div className="flex space-x-2">
            {onCancelReply && (
                <Button type="button" variant="ghost" size="sm" onClick={onCancelReply} disabled={loading}>
                  Annuler
                </Button>
            )}
            <Button type="submit" size="sm" disabled={loading || !content.trim() || content.length > 2000}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {loading ? 'Envoi...' : parentCommentId ? 'Répondre' : 'Commenter'}
            </Button>
          </div>
        </div>
      </div>
    </motion.form>
  );
};

export default CommentForm;
