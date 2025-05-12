import { supabase } from '@/lib/supabaseClient';
import { getPublicUrl, uploadWebtoonImage, deleteWebtoonFolder, deleteFile } from './storageService'; 

const WEBTOON_IMAGES_BUCKET = 'webtoon-images';
const BASE_IMAGE_URL = "https://<ayomxspoosbrsldbbptc>.supabase.co/storage/v1/object/public/webtoon-images/";

const mapWebtoonData = (wt) => ({
  ...wt,
  coverImageUrl: getPublicUrl(BASE_IMAGE_URL, wt.cover_image_url),
  bannerImageUrl: getPublicUrl(WEBTOON_IMAGES_BUCKET, wt.banner_image_url),
  chapterCount: wt.chapters?.length || 0,
  tags: wt.tags || [],
  views: wt.views || 0,
  showPublicViews: wt.show_public_views || false,
});

export const getWebtoons = async (searchTerm = '', selectedTags = [], filterBanners = false) => {
  let query = supabase
    .from('webtoons')
    .select(`
      id, title, description, cover_image_url, banner_image_url, 
      is_banner, tags, views, show_public_views, chapters ( id ), slug
    `)
    .order('created_at', { ascending: false });

  if (searchTerm) {
     const searchPattern = `%${searchTerm}%`;
     query = query.or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`);
  }
  if (selectedTags.length > 0) query = query.contains('tags', selectedTags);
  if (filterBanners) query = query.eq('is_banner', true);
  
  const { data, error } = await query;
  if (error) { console.error('Error fetching webtoons:', error.message); throw error; }
  return (data || []).map(mapWebtoonData);
};

export const getWebtoonById = async (id) => {
   const { data: webtoonData, error: webtoonError } = await supabase
    .from('webtoons')
    .select(`*, chapters (id, number, created_at, views)`)
    .eq('id', id)
    .single();

  if (webtoonError) {
    console.error('Error fetching webtoon by ID:', webtoonError.message);
    if (webtoonError.code === 'PGRST116') return null; 
    throw webtoonError;
  }
  if (!webtoonData) return null;
  
  return {
    ...mapWebtoonData(webtoonData),
    chapters: (webtoonData.chapters || []).sort((a, b) => a.number - b.number).map(ch => ({ ...ch, views: ch.views || 0 })),
  };
};

export const getWebtoonBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('webtoons')
    .select(`*, chapters (id, number, created_at, views)`)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching webtoon by slug:', error.message);
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    ...mapWebtoonData(data),
    chapters: (data.chapters || []).sort((a, b) => a.number - b.number),
  };
};

export const addWebtoon = async (webtoonData) => {
  let coverPath = null;
  let bannerPath = null;
  const webtoonId = webtoonData.id || crypto.randomUUID();

  if (webtoonData.coverImageFile) {
    const file = webtoonData.coverImageFile;
    const fileExt = file.name.split('.').pop();
    coverPath = `public/${webtoonId}/cover.${fileExt}`;
    await uploadWebtoonImage(file, coverPath).catch(err => { console.error("Cover upload failed:", err.message); throw new Error("Failed to upload cover image."); });
  }
  
  if (webtoonData.bannerImageFile) {
    const file = webtoonData.bannerImageFile;
    const fileExt = file.name.split('.').pop();
    bannerPath = `public/${webtoonId}/banner.${fileExt}`;
    await uploadWebtoonImage(file, bannerPath).catch(err => console.error("Banner image upload failed:", err.message));
  }

  const { error: insertError } = await supabase
    .from('webtoons')
    .insert({
      id: webtoonId,
      title: webtoonData.title,
      description: webtoonData.description,
      cover_image_url: coverPath,
      tags: webtoonData.tags || [],
      is_banner: webtoonData.is_banner || false,
      banner_image_url: bannerPath,
      show_public_views: webtoonData.show_public_views || false,
      views: 0, 
    });

  if (insertError) {
    console.error('Error adding webtoon to DB:', insertError.message);
    if (coverPath) await deleteFile(WEBTOON_IMAGES_BUCKET, coverPath).catch(e => console.error("Cover cleanup failed:", e.message));
    if (bannerPath) await deleteFile(WEBTOON_IMAGES_BUCKET, bannerPath).catch(e => console.error("Banner cleanup failed:", e.message));
    throw insertError;
  }
  return { id: webtoonId, ...webtoonData }; 
};

export const updateWebtoon = async (id, updatedData) => {
   let coverPath = updatedData.existingCoverPath;
   let bannerPath = updatedData.existingBannerPath;
   let oldCoverPathToDelete = null;
   let oldBannerPathToDelete = null;

   if (updatedData.coverImageFile) {
     const file = updatedData.coverImageFile;
     const fileExt = file.name.split('.').pop();
     const newCoverPath = `public/${id}/cover.${fileExt}`;
     if (coverPath && newCoverPath !== coverPath) oldCoverPathToDelete = coverPath; 
     coverPath = newCoverPath;
     await uploadWebtoonImage(file, coverPath).catch(err => { console.error("Cover update upload failed:", err.message); throw new Error("Failed to upload updated cover image."); });
   } else if (updatedData.removeCover && coverPath) {
      oldCoverPathToDelete = coverPath;
      coverPath = null;
   }

   if (updatedData.bannerImageFile) {
     const file = updatedData.bannerImageFile;
     const fileExt = file.name.split('.').pop();
     const newBannerPath = `public/${id}/banner.${fileExt}`;
     if (bannerPath && newBannerPath !== bannerPath) oldBannerPathToDelete = bannerPath;
     bannerPath = newBannerPath;
     await uploadWebtoonImage(file, bannerPath).catch(err => console.error("Banner update upload failed:", err.message));
   } else if (updatedData.removeBanner && bannerPath) {
      oldBannerPathToDelete = bannerPath;
      bannerPath = null;
   }

   const dataToUpdate = {
      title: updatedData.title,
      description: updatedData.description,
      cover_image_url: coverPath,
      tags: updatedData.tags || [],
      is_banner: updatedData.is_banner || false,
      banner_image_url: bannerPath,
   };

   if (typeof updatedData.show_public_views === 'boolean') {
    dataToUpdate.show_public_views = updatedData.show_public_views;
   }

   const { error: updateError } = await supabase.from('webtoons').update(dataToUpdate).eq('id', id);
   if (updateError) { console.error('Error updating webtoon in DB:', updateError.message); throw updateError; }

   if (oldCoverPathToDelete) await deleteFile(WEBTOON_IMAGES_BUCKET, oldCoverPathToDelete).catch(e => console.error("Old cover cleanup failed:", e.message));
   if (oldBannerPathToDelete) await deleteFile(WEBTOON_IMAGES_BUCKET, oldBannerPathToDelete).catch(e => console.error("Old banner cleanup failed:", e.message));
};

export const deleteWebtoon = async (id) => {
  await deleteWebtoonFolder(id); 
  const { error } = await supabase.from('webtoons').delete().eq('id', id);
  if (error) { console.error('Error deleting webtoon from DB:', error.message); throw error; }
};

export const isFavorite = async (userId, webtoonId) => {
   if (!userId) return false;
   const { count, error } = await supabase.from('user_favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('webtoon_id', webtoonId);
   if (error) { console.error("Error checking favorite:", error.message); return false; }
   return count > 0;
 };

export const addFavorite = async (userId, webtoonId) => {
   if (!userId) throw new Error("User not logged in");
   const { error } = await supabase.from('user_favorites').insert({ user_id: userId, webtoon_id: webtoonId });
   if (error) { console.error("Error adding favorite:", error.message); throw error; }
 };

export const removeFavorite = async (userId, webtoonId) => {
   if (!userId) throw new Error("User not logged in");
   const { error } = await supabase.from('user_favorites').delete().eq('user_id', userId).eq('webtoon_id', webtoonId);
   if (error) { console.error("Error removing favorite:", error.message); throw error; }
};

export const getUserFavorites = async (userId) => {
   if (!userId) return [];
   const { data, error } = await supabase
     .from('user_favorites')
     .select(`webtoon:webtoons!inner (id, title, cover_image_url, banner_image_url, is_banner, tags, views, show_public_views, chapters ( id ))`)
     .eq('user_id', userId)
     .order('created_at', { ascending: false });
   if (error) { console.error("Error fetching user favorites:", error.message); throw error; }
   return (data || []).map(fav => mapWebtoonData(fav.webtoon || {}));
};

export const getAllTags = async () => {
   const { data, error } = await supabase.rpc('get_distinct_tags');
   if (error) { console.error('Error fetching distinct tags:', error.message); return []; }
   return data || [];
};

export const markChapterAsRead = async (userId, chapterId) => {
  if (!userId || !chapterId) return;
  const { error } = await supabase.from('user_chapter_reads').upsert({ user_id: userId, chapter_id: chapterId, read_at: new Date().toISOString() }, { onConflict: 'user_id, chapter_id'});
  if (error) console.error('Error marking chapter as read:', error.message);
};

export const getReadChapters = async (userId, webtoonId) => {
  if (!userId || !webtoonId) return [];
  const { data: chapterIdsData, error: chapterIdsError } = await supabase.from('chapters').select('id').eq('webtoon_id', webtoonId);
  if (chapterIdsError || !chapterIdsData || chapterIdsData.length === 0) {
    if(chapterIdsError) console.error('Error fetching chapter IDs for webtoon:', chapterIdsError.message);
    return [];
  }
  const chapterIds = chapterIdsData.map(c => c.id);
  const { data, error } = await supabase.from('user_chapter_reads').select('chapter_id').eq('user_id', userId).in('chapter_id', chapterIds); 
  if (error) { console.error('Error fetching read chapters:', error.message); return []; }
  return (data || []).map(r => r.chapter_id);
};

export const getRandomWebtoonId = async () => {
    const { count, error: countError } = await supabase.from('webtoons').select('id', { count: 'exact', head: true });
    if (countError) { console.error('Error fetching webtoon count:', countError.message); throw countError; }
    if (count === 0 || !count) return null;
    const randomOffset = Math.floor(Math.random() * count);
    const { data: randomWebtoon, error: randomError } = await supabase.from('webtoons').select('id').limit(1).range(randomOffset, randomOffset); 
    if (randomError) { console.error('Error fetching random webtoon ID:', randomError.message); throw randomError; }
    return randomWebtoon && randomWebtoon.length > 0 ? randomWebtoon[0].id : null;
};

export const getRandomWebtoonSlug = async () => {
  const { count, error: countError } = await supabase
    .from('webtoons')
    .select('slug', { count: 'exact', head: true });

  if (countError) {
    console.error('Error fetching webtoon count:', countError.message);
    throw countError;
  }

  if (!count || count === 0) return null;

  const randomOffset = Math.floor(Math.random() * count);

  const { data: randomWebtoon, error: randomError } = await supabase
    .from('webtoons')
    .select('slug')
    .limit(1)
    .range(randomOffset, randomOffset);

  if (randomError) {
    console.error('Error fetching random webtoon slug:', randomError.message);
    throw randomError;
  }

  return randomWebtoon && randomWebtoon.length > 0 ? randomWebtoon[0].slug : null;
};


export const incrementWebtoonView = async (webtoonSlug) => {
  const { error } = await supabase.rpc('increment_webtoon_view', { webtoon_id_param: webtoonSlug });
  if (error) console.error('Error incrementing webtoon view:', error.message);
  
};

export const getSimilarWebtoons = async (webtoonId, limit = 5) => {
  const { data: currentWebtoon, error: currentWebtoonError } = await supabase.from('webtoons').select('id, tags').eq('id', webtoonId).single();
  if (currentWebtoonError || !currentWebtoon) { console.error('Error fetching current webtoon for similarity:', currentWebtoonError?.message); return []; }
  if (!currentWebtoon.tags || currentWebtoon.tags.length === 0) return []; 
  
  const { data: similarWebtoons, error: similarWebtoonsError } = await supabase
    .from('webtoons')
    .select('id, title, cover_image_url, tags, views, show_public_views, chapters(id)')
    .neq('id', webtoonId) 
    .overlaps('tags', currentWebtoon.tags)
    .order('views', { ascending: false }) 
    .limit(limit);
  if (similarWebtoonsError) { console.error('Error fetching similar webtoons:', similarWebtoonsError.message); return []; }
  return (similarWebtoons || []).map(mapWebtoonData);
};

export const updateWebtoonShowPublicViews = async (webtoonId, showPublicViews) => {
  const { data, error } = await supabase.from('webtoons').update({ show_public_views: showPublicViews }).eq('id', webtoonId).select('id, show_public_views').single();
  if (error) { console.error('Error updating show_public_views:', error.message); throw error; }
  return data;
};
