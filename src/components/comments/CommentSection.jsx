
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getComments, deleteComment } from '@/services/commentService';
import CommentForm from './CommentForm';
import Comment from './Comment'; // Renamed from CommentItem for clarity
import { useToast } from '@/components/ui/use-toast';

const CommentSection = ({ webtoonId, chapterId = null }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedComments = await getComments(webtoonId, chapterId);
      setComments(fetchedComments);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setError("Impossible de charger les commentaires.");
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [webtoonId, chapterId]); // Refetch when ID changes

  const handleCommentAdded = (newComment) => {
     // Add the new comment optimistically or after refetching
     // Simple version: add to the top (if sorted newest first) or bottom
     setComments(prev => [newComment, ...prev]); // Assuming newest first sort order
     // Or refetch: fetchComments();
  };
  
  const handleDeleteComment = async (commentId) => {
     // Optimistic deletion (optional)
     const originalComments = [...comments];
     setComments(prev => prev.filter(c => c.id !== commentId));
     
     try {
        await deleteComment(commentId, user?.id); // Pass user ID for potential checks if RLS isn't enough
        toast({ title: "Succès", description: "Commentaire supprimé." });
        // No need to refetch if optimistic update is sufficient
     } catch (err) {
        console.error("Failed to delete comment:", err);
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
        setComments(originalComments); // Revert on error
     }
  };

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-12"
    >
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <MessageSquare className="mr-3 h-6 w-6 text-primary"/> Commentaires ({comments.length})
      </h2>

      {user && (
         <CommentForm 
           webtoonId={webtoonId} 
           chapterId={chapterId} 
           onCommentAdded={handleCommentAdded} 
         />
      )}

      <div className="mt-8 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive bg-destructive/10 p-4 rounded-md">{error}</div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <Comment 
               key={comment.id} 
               comment={comment} 
               currentUserId={user?.id}
               isAdmin={isAdmin}
               onDelete={handleDeleteComment} 
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-6">Aucun commentaire pour le moment. Soyez le premier !</p>
        )}
      </div>
    </motion.section>
  );
};

export default CommentSection;
