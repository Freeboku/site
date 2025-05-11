
import { supabase } from '@/lib/supabaseClient';
import { getPublicUrl, uploadChapterPage, deleteChapterFolder, uploadFile, deleteFile, listFiles } from './storageService';
import { getUserAccessLevelForChapter } from './permissionService';

const WEBTOON_IMAGES_BUCKET = 'webtoon-images';
const MAX_CONCURRENT_PAGE_UPLOADS = 3; 

const mapChapterData = (chapterData) => {
  if (!chapterData) return null;

  const requiredRoles = chapterData.required_roles || [];
  
  const pages = (chapterData.pages || [])
    .sort((a, b) => a.page_number - b.page_number)
    .map(page => ({
      id: page.id,
      page_number: page.page_number,
      image_url: page.image_url,
      publicUrl: page.image_url ? getPublicUrl(WEBTOON_IMAGES_BUCKET, page.image_url) : null,
      file: null 
    }));
  
  const thumbnailUrl = chapterData.thumbnail_url ? getPublicUrl(WEBTOON_IMAGES_BUCKET, chapterData.thumbnail_url) : null;

  return {
    id: chapterData.id,
    number: chapterData.number,
    webtoonId: chapterData.webtoon_id,
    webtoonSlug: chapterData.webtoons?.slug || '',
    webtoonTitle: chapterData.webtoons?.title || '',
    webtoonShowPublicViews: chapterData.webtoons?.show_public_views || false,
    thumbnailUrl: thumbnailUrl,
    existingThumbnailPath: chapterData.thumbnail_url, 
    pages: pages,
    views: chapterData.views || 0,
    createdAt: chapterData.created_at,
    required_roles: requiredRoles,
  };
};

export const getChapterWithPages = async (chapterId, currentUserId, currentUserRole) => {
  const { data: chapterData, error: chapterError } = await supabase
    .from('chapters')
    .select(`
      id, number, webtoon_id, thumbnail_url, views, created_at, required_roles,
      webtoons (title, id, show_public_views, slug),
      pages (id, page_number, image_url)
    `)
    .eq('id', chapterId)
    .single();

  if (chapterError) {
    console.error('Error fetching chapter:', chapterError.message);
    if (chapterError.code === 'PGRST116') return null; 
    throw chapterError;
  }
  if (!chapterData) return null;

  const canAccess = await getUserAccessLevelForChapter(currentUserId, currentUserRole, chapterData.required_roles || []);
  
  if (!canAccess) {
    console.warn(`User ${currentUserId} (role: ${currentUserRole}) denied access to chapter ${chapterId} requiring roles: ${chapterData.required_roles?.join(', ')}`);
    return { 
      id: chapterData.id, 
      webtoonId: chapterData.webtoon_id, 
      webtoonSlug: chapterData.webtoons?.slug || '',
      number: chapterData.number, 
      accessDenied: true, 
      required_roles: chapterData.required_roles || [], 
      webtoonTitle: chapterData.webtoons?.title || '',
      pages: [] 
    };
  }

  return mapChapterData(chapterData);
};


const processChapterThumbnail = async (thumbnailFile, webtoonId, chapterId, existingThumbnailPath, removeThumbnailFlag = false) => {
  let newThumbnailPath = existingThumbnailPath;
  let oldThumbnailPathToDelete = null;

  if (thumbnailFile) {
    if (existingThumbnailPath) oldThumbnailPathToDelete = existingThumbnailPath;
    const thumbExt = thumbnailFile.name.split('.').pop();
    newThumbnailPath = `public/${webtoonId}/${chapterId}/thumbnail.${thumbExt}`;
    await uploadFile(WEBTOON_IMAGES_BUCKET, thumbnailFile, newThumbnailPath);
  } else if (removeThumbnailFlag && existingThumbnailPath) { 
    oldThumbnailPathToDelete = existingThumbnailPath;
    newThumbnailPath = null;
  }
  
  return { newThumbnailPath, oldThumbnailPathToDelete };
};

const updateChapterPagesInDb = async (chapterId, webtoonId, pagesData) => {
  if (!pagesData) return;

  const existingPagesResult = await supabase.from('pages').select('id, image_url').eq('chapter_id', chapterId);
  const existingPageUrls = (existingPagesResult.data || []).map(p => p.image_url);

  const newPageFiles = pagesData.filter(p => p.file); 
  const keptExistingPages = pagesData.filter(p => !p.file && p.image_url); 

  const pagesToDeleteFromStorage = existingPageUrls.filter(url => !keptExistingPages.some(p => p.image_url === url));
  for (const pagePath of pagesToDeleteFromStorage) {
    await deleteFile(WEBTOON_IMAGES_BUCKET, pagePath).catch(e => console.warn(`Failed to delete old page image: ${e.message}`));
  }
  await supabase.from('pages').delete().eq('chapter_id', chapterId);

  const allPagesToInsert = [];
  let currentPageNumber = 1;

  for (const page of keptExistingPages) {
    allPagesToInsert.push({ chapter_id: chapterId, page_number: currentPageNumber++, image_url: page.image_url });
  }

  const pageUploadTasks = newPageFiles.map((pageData, index) => 
    () => uploadChapterPage(webtoonId, chapterId, currentPageNumber + index, pageData.file)
  );
  
  const uploadedPagePaths = await processTasksInBatches(pageUploadTasks, MAX_CONCURRENT_PAGE_UPLOADS);

  uploadedPagePaths.forEach((pagePath, index) => {
      if (pagePath) { 
          allPagesToInsert.push({ chapter_id: chapterId, page_number: currentPageNumber + index, image_url: pagePath });
      }
  });
  
  if (allPagesToInsert.length > 0) {
      const { error: pagesInsertError } = await supabase.from('pages').insert(allPagesToInsert);
      if (pagesInsertError) {
        console.error('Error inserting updated pages:', pagesInsertError.message);
        throw pagesInsertError;
      }
  } else if (pagesData.length === 0) { 
     const { error } = await supabase.from('pages').delete().eq('chapter_id', chapterId);
     if(error) console.error('Error deleting all pages from chapter:', error.message);
  }
};


export const updateChapter = async (chapterId, webtoonId, updatedData) => {
  const { newThumbnailPath, oldThumbnailPathToDelete } = await processChapterThumbnail(
    updatedData.thumbnailFile, 
    webtoonId, 
    chapterId, 
    updatedData.existingThumbnailPath,
    updatedData.removeThumbnail 
  );

  const chapterDetailsToUpdate = {
    number: parseFloat(updatedData.number),
    thumbnail_url: newThumbnailPath,
    required_roles: updatedData.required_roles || [],
  };

  const { error: chapterUpdateError } = await supabase
    .from('chapters')
    .update(chapterDetailsToUpdate)
    .eq('id', chapterId);

  if (chapterUpdateError) {
    console.error('Error updating chapter details in DB:', chapterUpdateError.message);
    throw chapterUpdateError;
  }

  if (oldThumbnailPathToDelete) {
    await deleteFile(WEBTOON_IMAGES_BUCKET, oldThumbnailPathToDelete).catch(e => console.warn(`Old thumbnail cleanup failed: ${e.message}`));
  }

  await updateChapterPagesInDb(chapterId, webtoonId, updatedData.pages);

  return { id: chapterId, ...updatedData };
};

async function processTasksInBatches(tasks, batchSize) {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize).map(task => task());
    const batchResults = await Promise.all(batch.map(p => p.catch(e => {
        console.error("Error in batch task:", e);
        return null; 
    })));
    results.push(...batchResults);
  }
  return results;
}

const manageChapterEntry = async (webtoonId, number, required_roles) => {
  const { data: existingChapter, error: fetchError } = await supabase
    .from('chapters').select('id, thumbnail_url, views').eq('webtoon_id', webtoonId).eq('number', number).single();
  
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

  const chapterPayload = { 
    webtoon_id: webtoonId, 
    number: number, 
    views: existingChapter?.views || 0,
    required_roles: required_roles || [] 
  };

  let chapterId;
  let oldThumbnailPath = null;

  if (existingChapter) {
    chapterId = existingChapter.id;
    oldThumbnailPath = existingChapter.thumbnail_url;
    
    const { error: updateError } = await supabase.from('chapters').update(chapterPayload).eq('id', chapterId);
    if (updateError) throw updateError;

    const chapterPageFolderPath = `public/${webtoonId}/${chapterId}/pages`;
    const existingPagesInStorage = await listFiles(WEBTOON_IMAGES_BUCKET, chapterPageFolderPath);
    if (existingPagesInStorage && existingPagesInStorage.length > 0) {
      const filesToDelete = existingPagesInStorage.map(file => `${chapterPageFolderPath}/${file.name}`);
      await deleteFile(WEBTOON_IMAGES_BUCKET, filesToDelete);
    }
    
    const { error: deletePagesError } = await supabase.from('pages').delete().eq('chapter_id', chapterId);
    if (deletePagesError) throw deletePagesError;
  } else {
    const { data: newChapter, error: insertError } = await supabase
      .from('chapters').insert(chapterPayload).select('id').single();
    if (insertError) throw insertError;
    chapterId = newChapter.id;
  }
  return { chapterId, oldThumbnailPath, existingThumbnailUrl: existingChapter?.thumbnail_url };
};

const uploadAndSavePages = async (webtoonId, chapterId, pageFiles, onProgressUpdate) => {
  if (!pageFiles || pageFiles.length === 0) return [];
  
  const totalPagesToUpload = pageFiles.length;
  let pagesUploadedCount = 0;
  const pageInserts = [];
        
  const pageUploadTasks = pageFiles.map((pageData, pageIndex) => {
    const pageNumberForDb = pageIndex + 1;
    return async () => {
      try {
        const pagePath = await uploadChapterPage(webtoonId, chapterId, pageNumberForDb, pageData.file);
        pagesUploadedCount++;
        onProgressUpdate(Math.round((pagesUploadedCount / totalPagesToUpload) * 70)); 
        return { chapter_id: chapterId, page_number: pageNumberForDb, image_url: pagePath };
      } catch (pageUploadError) {
        console.error(`Error uploading page ${pageNumberForDb} for chapter ${chapterId}:`, pageUploadError);
        onProgressUpdate(Math.round((pagesUploadedCount / totalPagesToUpload) * 70), `Page ${pageNumberForDb} échouée`);
        throw new Error(`Failed to upload page ${pageNumberForDb}: ${pageUploadError.message}`); 
      }
    };
  });

  const uploadedPageInsertData = await processTasksInBatches(pageUploadTasks, MAX_CONCURRENT_PAGE_UPLOADS);
  
  uploadedPageInsertData.forEach(insertData => {
      if(insertData) pageInserts.push(insertData);
  });

  if (pageInserts.length !== totalPagesToUpload) {
      const failedCount = totalPagesToUpload - pageInserts.length;
      throw new Error(`${failedCount} page(s) n'ont pas pu être uploadées pour le chapitre.`);
  }
  
  if (pageInserts.length > 0) {
      const { error: pagesInsertError } = await supabase.from('pages').insert(pageInserts);
      if (pagesInsertError) {
        throw new Error(`Failed to insert page records: ${pagesInsertError.message}`);
      }
  }
  return pageInserts;
};

const invokeNotificationFunction = async (chapterId, webtoonId, chapterNumber, webtoonTitle) => {
  if (!chapterId) {
    console.warn(`Skipping notification for chapter ${chapterNumber} due to missing chapterId.`);
    return;
  }
  console.log(`Attempting to invoke notification function for chapter ${chapterNumber} (ID: ${chapterId}) of webtoon ${webtoonId} (${webtoonTitle})`);
  try {
    const { data: funcData, error: funcError } = await supabase.functions.invoke('create-favorite-notifications', {
      body: JSON.stringify({ chapterId, webtoonId, chapterNumber, webtoonTitle }),
    });

    if (funcError) {
      console.error(`Error invoking notification function for chapter ${chapterNumber}:`, funcError.message, funcError.context || '');
    } else {
      console.log(`Notification function invoked successfully for chapter ${chapterNumber}. Response:`, funcData);
    }
  } catch (invokeError) {
    console.error(`Critical error invoking notification function for chapter ${chapterNumber}:`, invokeError);
  }
};


export const addMultipleChapters = async (webtoonId, chaptersData, onOverallProgress, onChapterProgress) => {
  const totalChapters = chaptersData.length;
  let chaptersProcessedCount = 0;
  const results = [];

  const { data: webtoonDetails, error: webtoonDetailsError } = await supabase
    .from('webtoons').select('title').eq('id', webtoonId).single();

  if (webtoonDetailsError || !webtoonDetails) {
    console.error('Failed to fetch webtoon details for notifications:', webtoonDetailsError?.message);
    throw new Error('Could not fetch webtoon details.');
  }
  const webtoonTitle = webtoonDetails.title;

  for (let i = 0; i < totalChapters; i++) {
    const chapterInputData = chaptersData[i];
    const { number, thumbnailFile, pages: pageFiles, required_roles } = chapterInputData;
    let chapterResult = { number: number, success: false, error: null, chapterId: null };
    
    const chapterProgressCallback = (percentage, status, message = null) => {
      onChapterProgress(i, number, percentage, status, message);
    };
    
    const pageUploadProgressCallback = (pagePercentage, pageMessage = null) => {
        chapterProgressCallback(20 + pagePercentage, 'processing', pageMessage);
    };

    try {
      chapterProgressCallback(0, 'processing'); 
      
      const { chapterId, oldThumbnailPath, existingThumbnailUrl } = await manageChapterEntry(webtoonId, number, required_roles);
      chapterResult.chapterId = chapterId;
      chapterProgressCallback(10, 'processing');

      const { newThumbnailPath: uploadedThumbnailPath } = await processChapterThumbnail(
        thumbnailFile, 
        webtoonId, 
        chapterId, 
        oldThumbnailPath || existingThumbnailUrl
      );
      
      if (uploadedThumbnailPath !== (existingThumbnailUrl || oldThumbnailPath) ) {
         const { error: updateThumbError } = await supabase.from('chapters').update({ thumbnail_url: uploadedThumbnailPath }).eq('id', chapterId);
        if (updateThumbError) console.error('Error updating chapter thumbnail URL:', updateThumbError.message);
      }
      chapterProgressCallback(20, 'processing');
      
      await uploadAndSavePages(webtoonId, chapterId, pageFiles, pageUploadProgressCallback);
      chapterProgressCallback(90, 'processing');
      
      chapterResult.success = true;
      await invokeNotificationFunction(chapterId, webtoonId, number, webtoonTitle);
      chapterProgressCallback(100, 'success');

    } catch (error) {
      console.error(`Error processing chapter ${number} (index ${i}):`, error.message, error.stack);
      chapterResult.error = error.message;
      chapterProgressCallback(chapterInputData.uploadProgress || 0, 'error', error.message);
    }
    
    results.push(chapterResult);
    chaptersProcessedCount++;
    if (onOverallProgress) onOverallProgress((chaptersProcessedCount / totalChapters) * 100);
  }
  return results;
};


export const deleteChapter = async (chapterId) => {
  const { data: chapter } = await supabase.from('chapters').select('webtoon_id, thumbnail_url').eq('id', chapterId).single();
  if (chapter) {
    await deleteChapterFolder(chapter.webtoon_id, chapterId);
    if (chapter.thumbnail_url) await deleteFile(WEBTOON_IMAGES_BUCKET, chapter.thumbnail_url).catch(e => console.warn(`Could not delete chapter thumbnail ${chapter.thumbnail_url}: ${e.message}`));
  }
  const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
  if (error) { console.error('Error deleting chapter:', error.message); throw error; }
};

export const getLatestChapters = async (limit = 4, currentUserId, currentUserRole) => {
  const { data, error } = await supabase
    .from('chapters')
    .select(`id, number, created_at, thumbnail_url, views, required_roles, webtoon:webtoons (id, title, show_public_views)`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('Error fetching latest chapters:', error.message); throw error; }
  
  const accessibleChapters = await Promise.all(
    (data || []).map(async (chapter) => {
      const canAccess = await getUserAccessLevelForChapter(currentUserId, currentUserRole, chapter.required_roles || []);
      return canAccess ? chapter : { ...chapter, accessDenied: !canAccess }; 
    })
  );

  return accessibleChapters
    .map(chapter => ({
      id: chapter.id,
      number: chapter.number,
      createdAt: chapter.created_at,
      thumbnailUrl: chapter.thumbnail_url ? getPublicUrl(WEBTOON_IMAGES_BUCKET, chapter.thumbnail_url) : null,
      webtoonId: chapter.webtoon?.id,
      webtoonTitle: chapter.webtoon?.title,
      webtoonShowPublicViews: chapter.webtoon?.show_public_views || false,
      views: chapter.views || 0,
      required_roles: chapter.required_roles || [],
      accessDenied: chapter.accessDenied || false 
  }));
};

export const getPreviousAndNextChapter = async (webtoonId, currentChapterNumber, currentUserId, currentUserRole) => {
  const fetchChapterCandidates = async (comparisonOp, orderAsc) => {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, number, required_roles')
      .eq('webtoon_id', webtoonId)
      [comparisonOp]('number', currentChapterNumber)
      .order('number', { ascending: orderAsc })
      .limit(10); 

    if (error && error.code !== 'PGRST116') {
      console.error(`Error fetching ${orderAsc ? 'next' : 'previous'} chapter candidates:`, error.message);
      return null;
    }
    return data || [];
  };
  
  const findAccessibleChapter = async (candidates) => {
    if (!candidates || candidates.length === 0) return null;
    for (const chapter of candidates) {
        const canAccess = await getUserAccessLevelForChapter(currentUserId, currentUserRole, chapter.required_roles || []);
        if (canAccess) return { id: chapter.id, number: chapter.number };
    }
    return null;
  }

  const [prevCandidates, nextCandidates] = await Promise.all([
    fetchChapterCandidates('lt', false),
    fetchChapterCandidates('gt', true)
  ]);
  
  const previousChapter = await findAccessibleChapter(prevCandidates);
  const nextChapter = await findAccessibleChapter(nextCandidates);
  
  return { previousChapter, nextChapter };
};


export const getRandomChapterLink = async (currentUserId, currentUserRole) => {
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, webtoon_id, required_roles');

  if (chaptersError) { console.error('Error fetching chapters for random link:', chaptersError.message); throw chaptersError; }
  if (!chapters || chapters.length === 0) return null;

  const accessibleChapters = [];
  for (const chapter of chapters) {
    const canAccess = await getUserAccessLevelForChapter(currentUserId, currentUserRole, chapter.required_roles || []);
    if (canAccess) {
      accessibleChapters.push(chapter);
    }
  }

  if (accessibleChapters.length === 0) return null; 

  const randomIndex = Math.floor(Math.random() * accessibleChapters.length);
  const randomChapter = accessibleChapters[randomIndex];
  return `/webtoon/${randomChapter.webtoon_id}/chapter/${randomChapter.id}`;
};

export const incrementChapterView = async (chapterId) => {
  const { error } = await supabase.rpc('increment_chapter_view', { chapter_id_param: chapterId });
  if (error) console.error('Error incrementing chapter view:', error.message);
};
