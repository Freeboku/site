
import { supabase } from '@/lib/supabaseClient';

export const getUserAccessLevelForChapter = async (userId, userRoleName, requiredRoleNames = []) => {
  if (userRoleName === 'admin') return true; 

  if (!requiredRoleNames || requiredRoleNames.length === 0) {
    return true; 
  }

  if (!userId) return false; 


  return requiredRoleNames.includes(userRoleName);
};


export const getPartnerAllowedWebtoonIds = async (partnerUserId) => {
    if (!partnerUserId) return [];
    const { data, error } = await supabase
        .from('partner_webtoon_permissions')
        .select('webtoon_id')
        .eq('user_id', partnerUserId);

    if (error) {
        console.error("Error fetching partner's allowed webtoon IDs:", error);
        return [];
    }
    return data.map(item => item.webtoon_id);
};


export const canUserViewChapterList = (userRole, chapterRequiredRoles) => {
  if (userRole === 'admin') return true;
  if (!chapterRequiredRoles || chapterRequiredRoles.length === 0) return true;
  return chapterRequiredRoles.includes(userRole);
};
