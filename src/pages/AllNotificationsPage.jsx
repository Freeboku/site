import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BellRing, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getPublicUrl } from '@/services/storageService';
import EmptyState from '@/components/EmptyState';

const WEBTOON_IMAGES_BUCKET = 'webtoon-images';

const AllNotificationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const notificationsPerPage = 15;

  const fetchNotifications = useCallback(async (currentPage) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const from = (currentPage - 1) * notificationsPerPage;
      const to = from + notificationsPerPage - 1;

      const { data, error, count } = await supabase
        .from('notifications')
        .select('id, message, created_at, webtoon_id, chapter_id, is_read, webtoons (title, cover_image_url)', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const mappedData = data.map(n => ({
        ...n,
        webtoonCoverUrl: n.webtoons?.cover_image_url ? getPublicUrl(WEBTOON_IMAGES_BUCKET, n.webtoons.cover_image_url) : null
      }));
      
      setNotifications(prev => currentPage === 1 ? mappedData : [...prev, ...mappedData]);
      setHasMore(mappedData.length === notificationsPerPage);
      
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast({ title: "Erreur", description: "Impossible de charger les notifications.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de marquer comme lue.", variant: "destructive" });
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: "Succès", description: "Toutes les notifications non lues ont été marquées comme lues." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de marquer toutes les notifications comme lues.", variant: "destructive" });
    }
  };

  const handleDeleteNotification = async (notificationId) => {
     try {
      await supabase.from('notifications').delete().eq('id', notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({ title: "Succès", description: "Notification supprimée." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer la notification.", variant: "destructive" });
    }
  };


  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-8 px-4 max-w-3xl"
    >
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle className="text-2xl font-bold flex items-center mb-2 sm:mb-0">
              <BellRing className="mr-3 h-6 w-6 text-primary" />
              Toutes les Notifications
            </CardTitle>
            {notifications.some(n => !n.is_read) && (
              <Button onClick={handleMarkAllAsRead} size="sm" variant="outline">
                <CheckCheck className="mr-2 h-4 w-4" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && page === 1 ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
             <div className="p-6">
                <EmptyState 
                    title="Aucune notification"
                    message="Vous n'avez pas encore de notification."
                />
             </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notif) => (
                <li key={notif.id} className={`p-4 hover:bg-muted/30 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start space-x-4">
                    {notif.webtoonCoverUrl && (
                      <Link to={`/webtoon/${notif.webtoon_id}`}>
                        <img 
                          alt={notif.webtoons?.title || 'Couverture Webtoon'}
                          class="h-16 w-16 rounded-md object-cover flex-shrink-0 border"
                         src="https://images.unsplash.com/photo-1572452532638-6a919c846ea5" />
                      </Link>
                    )}
                     {!notif.webtoonCoverUrl && (
                       <div className="h-16 w-16 rounded-md bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground text-sm border">
                         {notif.webtoons?.title?.substring(0,3) || 'N/A'}
                       </div>
                    )}
                    <div className="flex-grow">
                      <Link to={`/webtoon/${notif.slug}/chapter/${notif.chapterNumber}`} className="hover:underline">
                        <p className={`text-md font-medium ${!notif.is_read ? 'text-primary' : ''}`}>{notif.message}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-1 items-end">
                      {!notif.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)} className="text-xs h-7 px-2">
                          <CheckCheck className="mr-1 h-3 w-3" /> Marquer lu
                        </Button>
                      )}
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteNotification(notif.id)} className="text-muted-foreground hover:text-destructive h-7 w-7">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {hasMore && !loading && notifications.length > 0 && (
            <div className="p-4 text-center border-t">
              <Button onClick={handleLoadMore} variant="outline">
                Charger plus
              </Button>
            </div>
          )}
          {loading && page > 1 && (
             <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AllNotificationsPage;
