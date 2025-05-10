
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Trash2, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getAllComments, deleteCommentAsAdmin } from '@/services/commentService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const AdminCommentList = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();
  const perPage = 15;

  const fetchComments = async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      const { comments: fetchedComments, totalCount: fetchedTotalCount } = await getAllComments(pageNum, perPage);
      setComments(fetchedComments);
      setTotalCount(fetchedTotalCount);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setError("Impossible de charger les commentaires.");
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(page);
  }, [page]);

  const handleDelete = async (commentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      setDeletingId(commentId);
      try {
        await deleteCommentAsAdmin(commentId);
        toast({ title: "Succès", description: "Commentaire supprimé." });
        // Refresh the current page
        fetchComments(page); 
      } catch (err) {
        console.error("Failed to delete comment:", err);
        toast({ title: "Erreur", description: `Impossible de supprimer le commentaire: ${err.message}`, variant: "destructive" });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold">Gestion des Commentaires</h1>

      {loading && comments.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center text-destructive bg-destructive/10 p-4 rounded-md">{error}</div>
      ) : comments.length === 0 ? (
         <p className="text-muted-foreground text-center py-6">Aucun commentaire trouvé.</p>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Commentaire</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Contexte</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell className="text-sm text-muted-foreground line-clamp-3">{comment.content}</TableCell>
                    <TableCell>{comment.profiles?.username || 'N/A'}</TableCell>
                    <TableCell className="text-xs">
                       {comment.webtoons ? (
                          <Link to={`/webtoon/${comment.webtoon_id}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center">
                             {comment.webtoons.title}
                             {comment.chapters && ` (Ch. ${comment.chapters.number})`}
                             <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                       ) : (
                          'Webtoon supprimé'
                       )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr }) : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        title="Supprimer ce commentaire"
                      >
                        {deletingId === comment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AdminCommentList;
