
import { supabase } from '@/lib/supabaseClient';

const WEBTOON_IMAGES_BUCKET = 'webtoon-images';
const AVATARS_BUCKET = 'avatars';

export const getPublicUrl = (bucketName, filePath) => {
  if (!filePath || !bucketName) return null;
  try {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data?.publicUrl || null;
    
  } catch (error) {
     console.error(`Error getting public URL from ${bucketName} for path ${filePath}:`, error);
     return null;
  }
};

export const uploadFile = async (bucketName, file, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, 
      });

    if (error) {
      console.error(`Error uploading file to ${bucketName} path ${path}:`, error);
      throw error;
    }
    return data.path; 
  } catch (error) {
     console.error(`Exception during file upload to ${bucketName} path ${path}:`, error);
     throw error;
  }
};

export const deleteFile = async (bucketName, path) => {
   if (!path || !bucketName) return;
   try {
     const { error } = await supabase.storage
       .from(bucketName)
       .remove([path]);
     if (error) {
       if (error.message && !error.message.includes('Not Found') && !error.message.includes('Bucket not found')) {
          console.error(`Error deleting file from ${bucketName} path ${path}:`, error);
          throw error; 
       } else {
          console.warn(`File not found during deletion attempt (or bucket issue): ${bucketName}/${path}`);
       }
     }
   } catch (error) {
      console.error(`Exception during file deletion from ${bucketName} path ${path}:`, error);
      throw error; 
   }
 };

export const listFiles = async (bucketName, pathPrefix) => {
   try {
     const { data, error } = await supabase.storage
       .from(bucketName)
       .list(pathPrefix, { limit: 1000 }); 
     if (error) {
       console.error(`Error listing files in ${bucketName} prefix ${pathPrefix}:`, error);
       throw error;
     }
     return data || [];
   } catch (error) {
      console.error(`Exception during file listing in ${bucketName} prefix ${pathPrefix}:`, error);
      throw error;
   }
 };
 
export const uploadWebtoonImage = (file, path) => uploadFile(WEBTOON_IMAGES_BUCKET, file, path);
export const uploadAvatar = (file, path) => uploadFile(AVATARS_BUCKET, file, path);

export const uploadChapterPage = (webtoonId, chapterId, pageNumber, file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `page_${String(pageNumber).padStart(3, '0')}.${fileExt}`; 
  const path = `public/${webtoonId}/${chapterId}/pages/${fileName}`;
  return uploadFile(WEBTOON_IMAGES_BUCKET, file, path);
};

const deleteFolderContents = async (bucketName, folderPath) => {
  const { data: filesToList, error: listError } = await supabase.storage
    .from(bucketName)
    .list(folderPath);

  if (listError) {
    console.error(`Error listing files in folder ${folderPath} for deletion:`, listError);
    return; 
  }

  if (filesToList && filesToList.length > 0) {
    const filesToRemove = filesToList.map(file => `${folderPath}/${file.name}`);
    const { error: removeError } = await supabase.storage
      .from(bucketName)
      .remove(filesToRemove);
    if (removeError) {
      console.error(`Error removing files from folder ${folderPath}:`, removeError);
      throw removeError; 
    }
  }
};


export const deleteWebtoonFolder = async (webtoonId) => {
   const folderPath = `public/${webtoonId}`;
   try {
      await deleteFolderContents(WEBTOON_IMAGES_BUCKET, folderPath);
   } catch (error) {
      console.error(`Error deleting webtoon folder contents (${webtoonId}):`, error);
   }
};

export const deleteChapterFolder = async (webtoonId, chapterId) => {
    const folderPath = `public/${webtoonId}/${chapterId}`;
   try {
      await deleteFolderContents(WEBTOON_IMAGES_BUCKET, folderPath);
   } catch (error) {
      console.error(`Error deleting chapter folder contents (${chapterId}):`, error);
   }
};

export const deleteAvatar = (path) => deleteFile(AVATARS_BUCKET, path);
