import type { MicroCMSImage, MicroCMSQueries } from "microcms-js-sdk";
import { createClient } from "microcms-js-sdk";
import { MICROCMS_SERVICE_DOMAIN, MICROCMS_API_KEY } from '$env/static/private';

const client = createClient({
  serviceDomain: MICROCMS_SERVICE_DOMAIN,
  apiKey: MICROCMS_API_KEY,
});

// 型定義
export type Work = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  description: string;
  scope: string[];
  body: string;
  contents: string;
  body_en: string;
  category: string | null;
  thumbnail?: MicroCMSImage;  // Made optional since some works don't have it
  repeat: Array<{
    fieldId: string;
    pj_images?: MicroCMSImage;
    pj_videos?: string;
    pj_images_title: string;
  }>;
  repeatImg?: Array<{
    fieldId: string;
    images?: MicroCMSImage;
  }> | {
    fieldId?: string;
    images?: MicroCMSImage;
  } | MicroCMSImage;  // 配列、オブジェクト、または単一画像の可能性
};

export type WorkResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: Work[];
};

// API呼び出し
export const getList = async (queries?: MicroCMSQueries) => {
  return await client.get<WorkResponse>({ endpoint: "works", queries });
};

export const getDetail = async (
  contentId: string,
  queries?: MicroCMSQueries
) => {
  return await client.getListDetail<Work>({
    endpoint: "works",
    contentId,
    queries,
  });
};