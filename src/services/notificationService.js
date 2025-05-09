
import { supabase } from '@/lib/supabaseClient';

export const getUnreadNotifications = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('id, message, created_at, webtoon_id, chapter_id, webtoons (title, cover_image_url)')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10); 

  if (error) {
    console.error('Error fetching unread notifications:', error.message);
    throw error;
  }
  return data || [];
};

export const markNotificationAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error.message);
    throw error;
  }
  return true;
};

export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return false;
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error.message);
    throw error;
  }
  return true;
};

export const getNotificationCount = async (userId) => {
  if (!userId) return { count: 0 };
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching notification count:', error.message);
    return { count: 0 };
  }
  return { count: count || 0 };
};
