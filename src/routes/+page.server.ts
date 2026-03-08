import type { PageServerLoad } from './$types';
import { getList } from '$lib/js/microcms';

export const load: PageServerLoad = async () => {
  try {
    // microCMSから全作品を取得（thumbnail、repeat、repeatImgを含む）
    const response = await getList({
      limit: 100, // 全件取得
      fields: ['id', 'title', 'thumbnail', 'repeat', 'repeatImg', 'category']
    });

    // サムネイルがある作品のみフィルタリング
    const worksWithThumbnail = response.contents.filter(work => work.thumbnail);

    return {
      works: worksWithThumbnail
    };
  } catch (error) {
    console.error('Failed to fetch works from microCMS:', error);
    return {
      works: []
    };
  }
};