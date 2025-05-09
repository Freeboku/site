
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import CommentForm from './CommentForm'; // For replies

const Comment = ({ comment, currentUserId, isAdmin, onDelete }) => {
   const [showReplyForm, setShowReplyForm] = useState(false);
   
   const getInitials = (name) => {
      if (!name) return '?';
      const names = name.split(' ');
      if (names.length === 1) return name.substring(0, 2).toUpperCase();
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
   }
   
   const canDelete = isAdmin || comment.user?.id === currentUserId;
   
   const handleReplyAdded = (newReply) => {
      // TODO: Add logic to display replies, potentially nested
      console.log("Reply added:", newReply); 
      setShowReplyForm(false); // Close form after successful reply
   };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex space-x-4"
    >
      <Avatar className="h-10 w-10 border">
         <AvatarImage src={comment.user?.avatarUrl} alt={comment.user?.username} />
         <AvatarFallback>{getInitials(comment.user?.username)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-sm">{comment.user?.username || 'Utilisateur Anonyme'}</span>
          <span className="text-xs text-muted-foreground">
            {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr }) : ''}
          </span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
        
        {/* Actions: Reply and Delete */}
        <div className="flex items-center space-x-2 mt-2">
           {currentUserId && ( // Only show reply if user is logged in
              <Button variant="ghost" size="xs" className="text-xs text-muted-foreground hover:text-primary" onClick={() => setShowReplyForm(!showReplyForm)}>
                 <Reply className="h-3 w-3 mr-1"/> Répondre
              </Button>
           )}
            {canDelete && (
              <Button variant="ghost" size="xs" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => onDelete(comment.id)}>
                <Trash2 className="h-3 w-3 mr-1" /> Supprimer
              </Button>
            )}
        </div>
        
        {/* Reply Form */}
        {showReplyForm && currentUserId && (
           <div className="mt-4 pl-4 border-l-2 border-muted/50">
             <CommentForm 
                webtoonId={comment.webtoon_id} 
                chapterId={comment.chapter_id}
                parentCommentId={comment.id}
                onCommentAdded={handleReplyAdded} 
                onCancelReply={() => setShowReplyForm(false)}
             />
           </div>
        )}
        
        {/* TODO: Add logic here to render replies (children comments) */}
        
      </div>
    </motion.div>
  );
};

export default Comment;
