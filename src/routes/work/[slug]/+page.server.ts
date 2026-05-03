import type { PageServerLoad } from './$types';
import { getDetail, getList, isPublicWork, type Work } from '$lib/js/microcms';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  try {
    // 現在の作品を取得（draft / closed / unlisted も直接 URL なら見える）
    const work = await getDetail(params.slug);

    // 関連 / 前後作品取得時に必ず取る公開判定用フィールド。
    const PUBLIC_FIELDS = [
      'id',
      'title',
      'thumbnail',
      'category',
      'publishedAt',
      'closedAt',
      'is_unlisted'
    ];

    // 関連作品を取得（同じカテゴリーまたは最新の作品3件）
    let relatedWorks: Work[] = [];
    try {
      if (work.category) {
        // 同じカテゴリーの作品を取得（現在の作品を除く）
        const relatedResponse = await getList({
          limit: 10, // フィルタ後でも 3 件残るよう多めに取る
          filters: `category[equals]${work.category}[and]id[not_equals]${work.id}`,
          orders: '-publishedAt',
          fields: PUBLIC_FIELDS
        });
        relatedWorks = relatedResponse.contents.filter(isPublicWork).slice(0, 3);
      }

      // 関連作品が3件未満の場合、最新の作品で補完
      if (relatedWorks.length < 3) {
        const additionalResponse = await getList({
          limit: 10,
          filters: `id[not_equals]${work.id}`,
          orders: '-publishedAt',
          fields: PUBLIC_FIELDS
        });
        const need = 3 - relatedWorks.length;
        const usedIds = new Set(relatedWorks.map((w) => w.id));
        const extras = additionalResponse.contents
          .filter(isPublicWork)
          .filter((w) => !usedIds.has(w.id))
          .slice(0, need);
        relatedWorks = [...relatedWorks, ...extras];
      }
    } catch (err) {
      console.error('Failed to fetch related works:', err);
      // 関連作品の取得に失敗しても続行
    }

    // 前後の作品を取得（ナビゲーション用）— draft / closed / unlisted は除外
    let prevWork: Work | null = null;
    let nextWork: Work | null = null;
    try {
      // 現在の作品より新しい作品（次の作品）— filter 後の最初の 1 件
      const newerResponse = await getList({
        limit: 10,
        filters: `publishedAt[greater_than]${work.publishedAt}`,
        orders: 'publishedAt',
        fields: PUBLIC_FIELDS
      });
      const nextCandidate = newerResponse.contents.filter(isPublicWork);
      if (nextCandidate.length > 0) nextWork = nextCandidate[0];

      // 現在の作品より古い作品（前の作品）
      const olderResponse = await getList({
        limit: 10,
        filters: `publishedAt[less_than]${work.publishedAt}`,
        orders: '-publishedAt',
        fields: PUBLIC_FIELDS
      });
      const prevCandidate = olderResponse.contents.filter(isPublicWork);
      if (prevCandidate.length > 0) prevWork = prevCandidate[0];
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