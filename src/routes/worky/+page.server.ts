import type { PageServerLoad } from './$types';
import { getList } from '$lib/js/microcms';
import { error } from '@sveltejs/kit';
import type { MicroCMSImage } from 'microcms-js-sdk';

// シンプルなハッシュ関数（文字列から数値を生成）
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// パターンA~Eで固定された並び順を生成（thumbnailを上側に多く配置）
function shuffleWithPattern<T extends { url: string; workId: string; isThumbnail?: boolean }>(
  items: T[],
  pattern: 'A' | 'B' | 'C' | 'D' | 'E'
): T[] {
  // パターンごとのシード値（異なる値で異なる並び順を生成）
  const patternSeeds: Record<string, number> = {
    A: 12345,
    B: 23456,
    C: 34567,
    D: 45678,
    E: 56789
  };
  
  const seed = patternSeeds[pattern];
  const totalItems = items.length;
  
  // 各アイテムにスコアを付与してソート
  return [...items].sort((a, b) => {
    // パターンに基づいたハッシュ値（固定順序のため）
    const hashA = (hashString(a.url + a.workId) + seed) % 1000000;
    const hashB = (hashString(b.url + b.workId) + seed) % 1000000;
    
    // thumbnail優先度スコア（上側に多く配置しつつ散らばる）
    let priorityA = 0;
    let priorityB = 0;
    
    if (a.isThumbnail) {
      // 上側50%の範囲に多く配置（優先度を高く）
      // ハッシュ値に基づいて位置を決定し、上側ほど優先度が高い
      const positionRatio = (hashA % 100) / 100; // 0-1の範囲
      // 上側50%の範囲に多く配置（優先度を段階的に減らす）
      if (positionRatio < 0.5) {
        // 上側50%の範囲：高い優先度
        priorityA = (0.5 - positionRatio) * 2000000;
      } else {
        // 下側50%の範囲：低い優先度（でも配置される）
        priorityA = (1.0 - positionRatio) * 500000;
      }
    }
    
    if (b.isThumbnail) {
      const positionRatio = (hashB % 100) / 100;
      if (positionRatio < 0.5) {
        priorityB = (0.5 - positionRatio) * 2000000;
      } else {
        priorityB = (1.0 - positionRatio) * 500000;
      }
    }
    
    // 優先度が高い順、同じ優先度ならハッシュ値でソート
    const scoreA = priorityA + hashA;
    const scoreB = priorityB + hashB;
    
    return scoreB - scoreA; // 降順（優先度が高い順）
  });
}

export const load: PageServerLoad = async ({ url }) => {
  try {
    // URLパラメータからページネーション情報とパターンを取得
    // パターンBで固定（将来の変更に備えてパターン選択ロジックは残す）
    const page = parseInt(url.searchParams.get('page') || '1');
    const pattern = (url.searchParams.get('pattern') || 'B').toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
    const limit = 100; // 全件取得してランダムに並べるため、大きな値を設定
    const offset = (page - 1) * limit;

    // microCMSからworksを取得（thumbnail、repeat、repeatImgを含む）
    const response = await getList({
      limit,
      offset,
      orders: '-publishedAt',
      fields: ['id', 'title', 'thumbnail', 'repeat', 'repeatImg', 'category']
    });

    // 全ての画像を1つの配列に収集（isThumbnailフラグ付き）
    const allImages: Array<{ 
      url: string; 
      width: number; 
      height: number; 
      workId: string; 
      workTitle: string;
      isThumbnail: boolean;
    }> = [];
    
    response.contents.forEach(work => {
      // thumbnailを追加（isThumbnail: true）
      if (work.thumbnail) {
        allImages.push({
          url: work.thumbnail.url,
          width: work.thumbnail.width,
          height: work.thumbnail.height,
          workId: work.id,
          workTitle: work.title,
          isThumbnail: true
        });
      }
      
      // repeat内のpj_imagesを追加（isThumbnail: false）
      if (work.repeat) {
        work.repeat.forEach(item => {
          if (item.pj_images) {
            allImages.push({
              url: item.pj_images.url,
              width: item.pj_images.width,
              height: item.pj_images.height,
              workId: work.id,
              workTitle: work.title,
              isThumbnail: false
            });
          }
        });
      }
      
      // repeatImgを追加（isThumbnail: false）
      if (work.repeatImg) {
        // repeatImgが配列の場合
        if (Array.isArray(work.repeatImg)) {
          work.repeatImg.forEach((item) => {
            // repeatImgの構造: { fieldId: 'repeatImg', images: { url, width, height } }
            if (item && item.images && item.images.url) {
              allImages.push({
                url: item.images.url,
                width: item.images.width || 0,
                height: item.images.height || 0,
                workId: work.id,
                workTitle: work.title,
                isThumbnail: false
              });
            }
          });
        } 
        // repeatImgが単一画像の場合（念のため）
        else if (work.repeatImg && typeof work.repeatImg === 'object') {
          // 単一オブジェクトの場合も同じ構造の可能性
          if ('images' in work.repeatImg && work.repeatImg.images && work.repeatImg.images.url) {
            allImages.push({
              url: work.repeatImg.images.url,
              width: work.repeatImg.images.width || 0,
              height: work.repeatImg.images.height || 0,
              workId: work.id,
              workTitle: work.title,
              isThumbnail: false
            });
          }
          // 直接urlプロパティがある場合（念のため）
          else if ('url' in work.repeatImg && work.repeatImg.url) {
            allImages.push({
              url: work.repeatImg.url,
              width: work.repeatImg.width || 0,
              height: work.repeatImg.height || 0,
              workId: work.id,
              workTitle: work.title,
              isThumbnail: false
            });
          }
        }
      }
    });

    // パターンに基づいて固定された順序でシャッフル（thumbnailを上側に多く配置）
    const shuffledImages = shuffleWithPattern(allImages, pattern);

    // 総ページ数を計算
    const totalPages = Math.ceil(response.totalCount / limit);

    return {
      images: shuffledImages,
      works: response.contents,
      pattern, // 現在のパターンも返す（必要に応じて）
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: response.totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (err) {
    console.error('Failed to fetch works:', err);
    throw error(500, 'Failed to load works');
  }
};