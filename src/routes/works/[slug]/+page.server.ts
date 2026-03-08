import type { PageServerLoad } from './$types';
import { getDetail, getList } from '$lib/js/microcms';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  try {
    // 現在の作品を取得
    const work = await getDetail(params.slug);

    // 関連作品を取得（同じカテゴリーまたは最新の作品3件）
    let relatedWorks = [];
    try {
      if (work.category) {
        // 同じカテゴリーの作品を取得（現在の作品を除く）
        const relatedResponse = await getList({
          limit: 3,
          filters: `category[equals]${work.category}[and]id[not_equals]${work.id}`,
          orders: '-publishedAt'
        });
        relatedWorks = relatedResponse.contents;
      }

      // 関連作品が3件未満の場合、最新の作品で補完
      if (relatedWorks.length < 3) {
        const additionalResponse = await getList({
          limit: 3 - relatedWorks.length,
          filters: `id[not_equals]${work.id}`,
          orders: '-publishedAt'
        });
        relatedWorks = [...relatedWorks, ...additionalResponse.contents];
      }
    } catch (err) {
      console.error('Failed to fetch related works:', err);
      // 関連作品の取得に失敗しても続行
    }

    // 前後の作品を取得（ナビゲーション用）
    let prevWork = null;
    let nextWork = null;
    try {
      // 現在の作品より新しい作品（次の作品）
      const newerResponse = await getList({
        limit: 1,
        filters: `publishedAt[greater_than]${work.publishedAt}`,
        orders: 'publishedAt'
      });
      if (newerResponse.contents.length > 0) {
        nextWork = newerResponse.contents[0];
      }

      // 現在の作品より古い作品（前の作品）
      const olderResponse = await getList({
        limit: 1,
        filters: `publishedAt[less_than]${work.publishedAt}`,
        orders: '-publishedAt'
      });
      if (olderResponse.contents.length > 0) {
        prevWork = olderResponse.contents[0];
      }
    } catch (err) {
      console.error('Failed to fetch adjacent works:', err);
      // ナビゲーションの取得に失敗しても続行
    }

    return {
      work,
      relatedWorks,
      navigation: {
        prev: prevWork,
        next: nextWork
      }
    };
  } catch (err) {
    console.error(`Failed to fetch work: ${params.slug}`, err);
    throw error(404, 'Work not found');
  }
};