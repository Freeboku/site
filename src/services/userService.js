
import { supabase } from '@/lib/supabaseClient';
import { getPublicUrl, deleteFile, uploadFile as storageUploadFile } from './storageService';

const AVATAR_BUCKET = 'avatars';
const POPUP_IMAGES_BUCKET = 'popups';

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role, bio') 
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching user profile:', error.message);
    throw error;
  }
  if (data && data.avatar_url) {
    data.avatarUrl = getPublicUrl(AVATAR_BUCKET, data.avatar_url);
  }
  
  return data;
};

export const updateUserProfile = async (userId, updates) => {
  const { bio, username, role } = updates; 

  const dataToUpdate = {
    username: username,
    bio: bio,
    updated_at: new Date()
  };
  
  if(role) {
    dataToUpdate.role = role;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(dataToUpdate)
    .eq('id', userId)
    .select('id, username, avatar_url, role, bio')
    .single();

  if (error) {
    console.error('Error updating user profile in DB:', error.message);
    throw error;
  }
  
  const returnData = {...data};
  if (returnData.avatar_url) {
    returnData.avatarUrl = getPublicUrl(AVATAR_BUCKET, returnData.avatar_url);
  } else {
    returnData.avatarUrl = null;
  }
  return returnData;
};


export const getAllUsersWithRoles = async () => {
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, role, updated_at, avatar_url, bio');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError.message);
    throw profilesError;
  }

  if (!profilesData || profilesData.length === 0) {
    return [];
  }

  const userIds = profilesData.map(p => p.id);
  
  const { data: authUsersData, error: authUsersError } = await supabase.rpc('get_user_emails_by_ids', { user_ids: userIds });


  if (authUsersError) {
    console.error('Error fetching users from auth.users via RPC:', authUsersError.message);
    throw authUsersError;
  }

  const usersEmailMap = authUsersData.reduce((acc, user) => {
    acc[user.id] = user.email;
    return acc;
  }, {});

  return profilesData.map(profile => ({
    ...profile,
    email: usersEmailMap[profile.id] || 'N/A', 
    avatarUrl: profile.avatar_url ? getPublicUrl(AVATAR_BUCKET, profile.avatar_url) : null,
    roleName: profile.role || 'user' 
  }));
};

export const updateUserRole = async (userId, newRole) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user role:', error.message);
    throw error;
  }
  return data;
};


export const getAllPopups = async () => {
  const { data, error } = await supabase
    .from('popups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(p => ({
    ...p,
    imageUrl: p.image_url ? getPublicUrl(POPUP_IMAGES_BUCKET, p.image_url) : null
  }));
};

export const getActivePopups = async () => {
  const { data, error } = await supabase
    .from('popups')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active popups:', error.message);
    throw error;
  }
  return data.map(p => ({
    ...p,
    imageUrl: p.image_url ? getPublicUrl(POPUP_IMAGES_BUCKET, p.image_url) : null
  }));
};


export const addPopup = async (popupData) => {
  const { imageFile, ...restData } = popupData;
  let imagePath = null;
  const popupId = crypto.randomUUID();

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    imagePath = `public/${popupId}/image.${fileExt}`;
    try {
      await storageUploadFile(POPUP_IMAGES_BUCKET, imageFile, imagePath);
    } catch (uploadError) {
      console.error("Popup image upload failed:", uploadError.message);
      throw new Error("Failed to upload popup image.");
    }
  }

  const { data, error } = await supabase
    .from('popups')
    .insert({ 
      id: popupId,
      ...restData, 
      image_url: imagePath,
      created_at: new Date(),
      updated_at: new Date()
    })
    .select()
    .single();
  if (error) {
    if (imagePath) await deleteFile(POPUP_IMAGES_BUCKET, imagePath).catch(e => console.error("Popup image cleanup failed:", e.message));
    throw error;
  }
  return data;
};

export const updatePopup = async (id, popupData) => {
  const { imageFile, existingImageUrl, removeImage, ...restData } = popupData;
  
  let currentImagePathInDb = null;
  if (existingImageUrl && existingImageUrl.includes(POPUP_IMAGES_BUCKET + '/')) {
    currentImagePathInDb = existingImageUrl.substring(existingImageUrl.lastIndexOf(POPUP_IMAGES_BUCKET + '/') + POPUP_IMAGES_BUCKET.length + 1);
  } else if (existingImageUrl) {
    currentImagePathInDb = existingImageUrl;
  }
  
  let newImagePathForDb = currentImagePathInDb;
  let oldImagePathToDelete = null;

  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const generatedPath = `public/${id}/image_${Date.now()}.${fileExt}`;
    if (currentImagePathInDb && currentImagePathInDb !== generatedPath) oldImagePathToDelete = currentImagePathInDb;
    newImagePathForDb = generatedPath;
    try {
      await storageUploadFile(POPUP_IMAGES_BUCKET, imageFile, newImagePathForDb);
    } catch (uploadError) {
      console.error("Popup image update upload failed:", uploadError.message);
      throw new Error("Failed to upload updated popup image.");
    }
  } else if (removeImage && currentImagePathInDb) {
    oldImagePathToDelete = currentImagePathInDb;
    newImagePathForDb = null;
  }
  
  const { data, error } = await supabase
    .from('popups')
    .update({ 
      ...restData, 
      image_url: newImagePathForDb,
      updated_at: new Date() 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (oldImagePathToDelete) {
    await deleteFile(POPUP_IMAGES_BUCKET, oldImagePathToDelete).catch(e => console.error("Old popup image cleanup failed:", e.message));
  }
  
  const returnData = {...data};
  if(returnData.image_url) {
    returnData.imageUrl = getPublicUrl(POPUP_IMAGES_BUCKET, returnData.image_url);
  } else {
    returnData.imageUrl = null;
  }
  return returnData;
};

export const deletePopup = async (id) => {
  const { data: popup } = await supabase.from('popups').select('image_url').eq('id', id).single();
  if (popup && popup.image_url) {
    await deleteFile(POPUP_IMAGES_BUCKET, popup.image_url).catch(e => console.error("Popup image deletion failed:", e.message));
  }

  const { error } = await supabase.from('popups').delete().eq('id', id);
  if (error) throw error;
};

export const toggleFavorite = async (userId, webtoonId) => {
  const { data: existingFavorite, error: fetchError } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('webtoon_id', webtoonId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking favorite status:', fetchError.message);
    throw fetchError;
  }

  if (existingFavorite) {
    const { error: deleteError } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('webtoon_id', webtoonId);
    if (deleteError) {
      console.error('Error removing favorite:', deleteError.message);
      throw deleteError;
    }
    return false; 
  } else {
    const { error: insertError } = await supabase
      .from('user_favorites')
      .insert({ user_id: userId, webtoon_id: webtoonId });
    if (insertError) {
      console.error('Error adding favorite:', insertError.message);
      throw insertError;
    }
    return true; 
  }
};

export const isFavorite = async (userId, webtoonId) => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('webtoon_id')
    .eq('user_id', userId)
    .eq('webtoon_id', webtoonId)
    .maybeSingle();

  if (error) {
    console.error('Error checking if favorite:', error.message);
    throw error;
  }
  return !!data;
};

export const getUserFavorites = async (userId) => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      webtoon_id,
      created_at,
      webtoon:webtoons (id, title, cover_image_url, tags)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user favorites:', error.message);
    throw error;
  }
  return data.map(fav => ({
    webtoonId: fav.webtoon_id,
    favoritedAt: fav.created_at,
    title: fav.webtoon.title,
    coverImageUrl: fav.webtoon.cover_image_url ? getPublicUrl('webtoon-covers', fav.webtoon.cover_image_url) : null,
    tags: fav.webtoon.tags || []
  }));
};
