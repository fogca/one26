import type { PageServerLoad } from './$types';
import { getList } from '$lib/js/microcms';
import { error } from '@sveltejs/kit';

type SortType = 'default' | 'new';

export const load: PageServerLoad = async ({ url }) => {
  const rawSort = url.searchParams.get('sort');
  const sort: SortType = rawSort === 'new' ? 'new' : 'default';

  try {
    const response = await getList({
      limit: 100,
      fields: ['id', 'title', 'thumbnail', 'category', 'publishedAt'],
      ...(sort === 'new' ? { orders: '-publishedAt' } : {})
    });

    return {
      works: response.contents,
      sort
    };
  } catch (err) {
    console.error('Failed to fetch works list:', err);
    throw error(500, 'Failed to load works list');
  }
};