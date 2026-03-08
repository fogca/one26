import type { PageServerLoad } from './$types';
import { getList } from '$lib/js/microcms';

export const load: PageServerLoad = async () => {
  try {
    // microCMSから作品を取得（8件、サムネイル付きのみ）
    const response = await getList({
      limit: 8,
      fields: ['id', 'title', 'thumbnail', 'category']
    });

    // サムネイルがある作品のみフィルタリング
    const worksWithThumbnail = response.contents.filter(work => work.thumbnail);

    // 8件に満たない場合は警告
    if (worksWithThumbnail.length < 8) {
      console.warn(`Warning: Only ${worksWithThumbnail.length} works with thumbnails found. Grid requires 8 works.`);
    }

    return {
      works: worksWithThumbnail.slice(0, 8)
    };
  } catch (error) {
    console.error('Failed to fetch works from microCMS:', error);
    return {
      works: []
    };
  }
};