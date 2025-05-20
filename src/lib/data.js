
import { supabase } from './supabaseClient';

const WEBTOON_IMAGES_BUCKET = 'webtoon-images';

// --- Helper Functions ---

const getSignedUrl = async (filePath, expiresInSeconds = 60) => {
  if (!filePath) return null;

  const { data, error } = await supabase
    .storage
    .from(WEBTOON_IMAGES_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    console.error("Erreur lors de la génération de l'URL signée :", error.message);
    return null;
  }

  return data?.signedUrl || null;
};


const uploadFile = async (file, path) => {
  const { data, error } = await supabase.storage
    .from(WEBTOON_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if file exists
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
  return data.path; // Return the path for storing in DB
};

// --- Webtoon Functions ---

export const getWebtoons = async () => {
  const { data, error } = await supabase
    .from('webtoons')
    .select(`
      id,
      title,
      description,
      cover_image_url,
      chapters ( id ) 
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching webtoons:', error);
    return [];
  }
  
  // Add chapter count and resolve public URL for cover image
  return data.map(wt => ({
    ...wt,
    coverImageUrl: getPublicUrl(wt.cover_image_url), // Resolve public URL
    chapters: wt.chapters || [], // Ensure chapters array exists
    chapterCount: wt.chapters?.length || 0
  }));
};

export const getWebtoonById = async (id) => {
   const { data: webtoonData, error: webtoonError } = await supabase
    .from('webtoons')
    .select('*')
    .eq('id', id)
    .single();

  if (webtoonError || !webtoonData) {
    console.error('Error fetching webtoon by ID:', webtoonError);
    return null;
  }

  const { data: chaptersData, error: chaptersError } = await supabase
    .from('chapters')
    .select('*')
    .eq('webtoon_id', id)
    .order('number', { ascending: true });

  if (chaptersError) {
    console.error('Error fetching chapters for webtoon:', chaptersError);
    // Return webtoon data even if chapters fail to load
  }
  
  webtoonData.coverImageUrl = getPublicUrl(webtoonData.cover_image_url); // Resolve public URL

  return {
    ...webtoonData,
    chapters: chaptersData || []
  };
};

export const addWebtoon = async (webtoonData) => {
  // 1. Handle cover image upload if present
  let coverPath = null;
  if (webtoonData.coverImageFile) {
    const file = webtoonData.coverImageFile;
    const fileExt = file.name.split('.').pop();
    const newId = webtoonData.id || crypto.randomUUID(); // Use provided ID or generate new one
    coverPath = `public/${newId}/cover.${fileExt}`;
    await uploadFile(file, coverPath);
  }

  // 2. Insert webtoon data into the database
  const { error } = await supabase
    .from('webtoons')
    .insert({
      id: webtoonData.id || undefined, // Let Supabase generate if not provided
      title: webtoonData.title,
      description: webtoonData.description,
      cover_image_url: coverPath, // Store the path, not the public URL
    });

  if (error) {
    console.error('Error adding webtoon:', error);
    // Optionally, try to delete the uploaded image if DB insert fails
    if (coverPath) {
       await supabase.storage.from(WEBTOON_IMAGES_BUCKET).remove([coverPath]);
    }
    throw error;
  }
};

export const updateWebtoon = async (id, updatedData) => {
   // 1. Handle cover image upload if present
   let coverPath = updatedData.existingCoverPath; // Keep existing path by default
   if (updatedData.coverImageFile) {
     const file = updatedData.coverImageFile;
     const fileExt = file.name.split('.').pop();
     coverPath = `public/${id}/cover.${fileExt}`; // Use existing webtoon ID
     await uploadFile(file, coverPath);
     // Optionally delete the old cover image if the path changed (more complex logic needed)
   } else if (updatedData.removeCover) {
      // Handle explicit removal if needed
      coverPath = null;
      // Optionally delete the file from storage
      if (updatedData.existingCoverPath) {
         await supabase.storage.from(WEBTOON_IMAGES_BUCKET).remove([updatedData.existingCoverPath]);
      }
   }

   // 2. Update webtoon data in the database
   const { error } = await supabase
     .from('webtoons')
     .update({
       title: updatedData.title,
       description: updatedData.description,
       cover_image_url: coverPath, // Store the potentially updated path
     })
     .eq('id', id);

   if (error) {
     console.error('Error updating webtoon:', error);
     throw error;
   }
};

export const deleteWebtoon = async (id) => {
  // Consider deleting associated storage files (cover, chapter pages) first or use Supabase Edge Functions for cascading deletes.
  // Simple deletion for now:
  
  // 1. Delete associated images from storage (optional but recommended)
  const { data: storageData, error: storageError } = await supabase.storage
    .from(WEBTOON_IMAGES_BUCKET)
    .list(`public/${id}`, { limit: 1000 }); // List all files/folders for the webtoon

  if (storageData && storageData.length > 0) {
    const filesToRemove = storageData.map(file => `public/${id}/${file.name}`);
    // Also need to list files within chapter folders if they exist
    // This part needs more robust logic to find all chapter folders and their files
    // For simplicity, we'll just remove the top-level files for now (like the cover)
    const { error: removeError } = await supabase.storage
      .from(WEBTOON_IMAGES_BUCKET)
      .remove(filesToRemove);
    if (removeError) {
       console.error('Error removing storage files during webtoon delete:', removeError);
       // Decide if you want to proceed with DB deletion even if storage cleanup fails
    }
  } else if (storageError) {
     console.error('Error listing storage files during webtoon delete:', storageError);
  }


  // 2. Delete webtoon from the database (chapters and pages should cascade delete due to FK constraints)
  const { error } = await supabase
    .from('webtoons')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting webtoon:', error);
    throw error;
  }
};

// --- Chapter and Page Functions ---

export const getChapterWithPages = async (chapterId) => {
   const { data: chapterData, error: chapterError } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single();

  if (chapterError || !chapterData) {
    console.error('Error fetching chapter by ID:', chapterError);
    return null;
  }

  const { data: pagesData, error: pagesError } = await supabase
    .from('pages')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true });

  if (pagesError) {
    console.error('Error fetching pages for chapter:', pagesError);
    // Return chapter data even if pages fail
  }

  // Resolve public URLs for pages
const pagesWithUrls = await Promise.all(
  (pagesData || []).map(async (page) => ({
    ...page,
    imageUrl: await getSignedUrl(page.image_url, 60), // 60 secondes de validité (modifiable)
  }))
);

  return {
    ...chapterData,
    pages: pagesWithUrls
  };
}

export const addChapter = async (webtoonId, chapterData) => {
  // chapterData should include { number, pages: [ { file: File, page_number: int } ] }

  // 1. Insert the chapter metadata first to get its ID (or handle upsert)
  const { data: chapterInsertData, error: chapterInsertError } = await supabase
    .from('chapters')
    .upsert({
      webtoon_id: webtoonId,
      number: chapterData.number,
    }, { onConflict: 'webtoon_id, number' }) // Upsert based on unique constraint
    .select() // Select the inserted/updated chapter data
    .single();

  if (chapterInsertError || !chapterInsertData) {
    console.error('Error inserting/upserting chapter:', chapterInsertError);
    throw chapterInsertError || new Error('Failed to insert/upsert chapter');
  }

  const chapterId = chapterInsertData.id;

  // 2. Upload pages to storage and insert page metadata
  const pageUploadPromises = chapterData.pages.map(async (pageInfo, index) => {
    const file = pageInfo.file; // Assuming pageInfo contains the File object
    const pageNumber = index + 1; // Use index for page number for simplicity
    const fileExt = file.name.split('.').pop();
    const filePath = `public/${webtoonId}/${chapterId}/page_${String(pageNumber).padStart(3, '0')}.${fileExt}`;

    const uploadedPath = await uploadFile(file, filePath);

    return {
      chapter_id: chapterId,
      page_number: pageNumber,
      image_url: uploadedPath, // Store the path
    };
  });

  const pageInsertData = await Promise.all(pageUploadPromises);

  // 3. Delete existing pages for this chapter before inserting new ones (if upserting)
   const { error: deletePagesError } = await supabase
     .from('pages')
     .delete()
     .eq('chapter_id', chapterId);

   if (deletePagesError) {
     console.error('Error deleting existing pages for chapter update:', deletePagesError);
     // Decide how to handle this - maybe rollback chapter insert?
     throw deletePagesError;
   }

  // 4. Bulk insert page metadata
  const { error: pagesInsertError } = await supabase
    .from('pages')
    .insert(pageInsertData);

  if (pagesInsertError) {
    console.error('Error inserting pages:', pagesInsertError);
    // Consider cleanup: delete uploaded files and the chapter entry
    throw pagesInsertError;
  }
};


export const deleteChapter = async (chapterId) => {
   // Similar to webtoon delete, consider deleting storage files first.
   // Assuming chapterId is known. Need webtoonId to construct path.
   // This requires fetching the chapter first to get webtoonId, or passing it in.

   // Simple deletion for now (relies on CASCADE DELETE for pages):
   const { error } = await supabase
     .from('chapters')
     .delete()
     .eq('id', chapterId);

   if (error) {
     console.error('Error deleting chapter:', error);
     throw error;
   }
   // Add storage cleanup logic here if needed.
};

// --- Cleanup / Reset (Use with caution!) ---
export const clearAllData = async () => {
   console.warn("Attempting to clear all data from Supabase tables...");
   // Implement deletion logic for all tables if truly needed, respecting order or disabling triggers.
   // This is dangerous and usually not recommended for production.
   // Example:
   // await supabase.from('pages').delete().neq('id', crypto.randomUUID()); // Delete all
   // await supabase.from('chapters').delete().neq('id', crypto.randomUUID());
   // await supabase.from('webtoons').delete().neq('id', crypto.randomUUID());
   console.log("Data clearing function needs careful implementation based on RLS and triggers.");
}
