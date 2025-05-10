
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead, getNotificationCount } from '@/services/notificationService';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getPublicUrl } from '@/services/storageService';

const WEBTOON_IMAGES_BUCKET = 'webtoon-images';

const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [notifsData, countData] = await Promise.all([
        getUnreadNotifications(user.id),
        getNotificationCount(user.id)
      ]);
      setNotifications(notifsData.map(n => ({
        ...n,
        webtoonCoverUrl: n.webtoons?.cover_image_url ? getPublicUrl(WEBTOON_IMAGES_BUCKET, n.webtoons.cover_image_url) : null
      })));
      setUnreadCount(countData.count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); 
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    try {
      await markNotificationAsRead(notification.id);
      fetchNotifications(); 
      navigate(`/webtoon/${notification.webtoon_id}/chapter/${notification.chapter_id}`);
      setIsOpen(false);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de marquer la notification comme lue.", variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || notifications.length === 0) return;
    try {
      await markAllNotificationsAsRead(user.id);
      fetchNotifications();
      toast({ title: "Succès", description: "Toutes les notifications ont été marquées comme lues." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de marquer toutes les notifications comme lues.", variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs text-primary hover:text-primary/80">
              <CheckCheck className="mr-1 h-3 w-3" /> Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled className="text-center text-muted-foreground py-4">
            Aucune nouvelle notification
          </DropdownMenuItem>
        ) : (
          notifications.map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className="cursor-pointer p-3 hover:bg-muted/50 focus:bg-muted/80"
            >
              <div className="flex items-start space-x-3">
                {notif.webtoonCoverUrl && (
                  <img 
                    alt={notif.webtoons?.title || 'Couverture Webtoon'}
                    class="h-12 w-12 rounded object-cover flex-shrink-0"
                   src="https://images.unsplash.com/photo-1572452532638-6a919c846ea5" />
                )}
                {!notif.webtoonCoverUrl && (
                   <div className="h-12 w-12 rounded bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs">
                     {notif.webtoons?.title?.substring(0,3) || 'N/A'}
                   </div>
                )}
                <div className="flex-grow">
                  <p className="text-sm font-medium leading-tight">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
           <Link to="/profile/notifications" className="w-full text-center text-sm text-primary hover:underline py-2">
             Voir toutes les notifications
           </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
