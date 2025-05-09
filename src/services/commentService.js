
import { supabase } from '@/lib/supabaseClient';
import { getPublicUrl } from './storageService';

const AVATARS_BUCKET = 'avatars';

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return input.replace(reg, (match)=>(map[match]));
};

export const getComments = async (webtoonId, chapterId = null) => {
  if (!webtoonId) throw new Error("Webtoon ID is required to fetch comments.");

  let query = supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      parent_comment_id,
      webtoon_id, 
      chapter_id,
      profiles ( id, username, avatar_url )
    `)
    .eq('webtoon_id', webtoonId);

  if (chapterId) {
    query = query.eq('chapter_id', chapterId);
  } else {
     query = query.is('chapter_id', null);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return (data || []).map(comment => ({
    ...comment,
    content: comment.content, 
    user: {
      id: comment.profiles?.id,
      username: comment.profiles?.username || 'Utilisateur supprimé',
      avatarUrl: getPublicUrl(AVATARS_BUCKET, comment.profiles?.avatar_url)
    },
    profiles: undefined 
  }));
};

export const getAllComments = async (page = 1, perPage = 20) => {
   const { data, error, count } = await supabase
     .from('comments')
     .select(`
       id,
       content,
       created_at,
       webtoon_id,
       chapter_id,
       profiles ( id, username ),
       webtoons ( id, title ),
       chapters ( id, number ) 
     `, { count: 'exact' })
     .order('created_at', { ascending: false })
     .range((page - 1) * perPage, page * perPage - 1);

   if (error) {
     console.error('Error fetching all comments:', error);
     throw error;
   }

   return { 
      comments: (data || []).map(c => ({...c, content: c.content})), 
      totalCount: count || 0 
   };
};


export const addComment = async ({ webtoonId, chapterId = null, userId, content, parentCommentId = null }) => {
  if (!userId) throw new Error("User must be logged in to comment.");
  
  const sanitizedContent = sanitizeInput(content);
  if (!sanitizedContent || !sanitizedContent.trim()) throw new Error("Le commentaire ne peut pas être vide.");
  if (sanitizedContent.length > 2000) throw new Error("Le commentaire ne doit pas dépasser 2000 caractères.");


  const { data, error } = await supabase
    .from('comments')
    .insert({
      webtoon_id: webtoonId,
      chapter_id: chapterId,
      user_id: userId,
      content: sanitizedContent.trim(),
      parent_comment_id: parentCommentId,
    })
    .select(`
       id, 
       content, 
       created_at, 
       parent_comment_id, 
       webtoon_id,
       chapter_id,
       profiles ( id, username, avatar_url )
     `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
  
  if (data?.profiles) {
     data.user = {
        id: data.profiles.id,
        username: data.profiles.username,
        avatarUrl: getPublicUrl(AVATARS_BUCKET, data.profiles.avatar_url)
     };
     delete data.profiles;
  }
  
  return data;
};

export const deleteComment = async (commentId) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const deleteCommentAsAdmin = async (commentId) => {
   const { error } = await supabase
     .from('comments')
     .delete()
     .eq('id', commentId);

   if (error) {
     console.error('Error deleting comment as admin:', error);
     throw error;
   }
};
