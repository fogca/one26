import type { PageServerLoad } from './$types';
import { getList, getPage } from '$lib/js/microcms';

export const load: PageServerLoad = async () => {
  try {
    // works と pages を並列取得（home は両方使う）
    const [worksRes, page] = await Promise.all([
      getList({
        limit: 100,
        fields: ['id', 'title', 'thumbnail', 'repeat', 'repeatImg', 'category']
      }),
      getPage()
    ]);

    return {
      works: worksRes.contents.filter((work) => work.thumbnail),
      page
    };
  } catch (error) {
    console.error('Failed to fetch from microCMS:', error);
    return {
      works: [],
      page: null
    };
  }
};