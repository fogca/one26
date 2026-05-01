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

// ─── Jobs ──────────────────────────────────────────────────────────────────
// All textArea fields are stored as newline-separated plain text — the page
// component splits them into <li> or <br> on render.

export type Job = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  slug: string;
  title_en: string;
  duties: string;
  ideal_candidate: string;
  preferred_skills: string;
  conditions: string;
};

export type JobResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: Job[];
};

export const getJobs = async (queries?: MicroCMSQueries) => {
  return await client.get<JobResponse>({ endpoint: "jobs", queries });
};

// ─── Pages ─────────────────────────────────────────────────────────────────
// `pages` is an OBJECT-format API in microCMS — a single record, returned
// flat (no `{ contents: [...] }` wrapper). Holds site-wide content for the
// Top + About pages of one2026.

export type ServiceGroup = {
  fieldId: 'service_group';
  group_title: string;
  group_items: string; // newline-separated items
};

export type Page = {
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  // 2026 site fields (used by SvelteKit)
  hero_copy: string;
  hero_subtitle: string;
  about_intro_title: string;
  about_intro_body: string;
  about_intro_body_en: string;
  services_title: string;
  services_intro: string;
  service_groups: ServiceGroup[];
  // Legacy fields kept for old site compatibility — not used here
  top_tagline?: string;
  top_jap?: string;
  top_eng?: string;
  studio_jap?: string;
  studio_eng?: string;
  philosophy_title_eng?: string;
  philosophy?: string;
};

/**
 * Fetch the `pages` object. Returns null on any failure so callers can
 * gracefully fall back to hardcoded copy without crashing the page.
 */
export const getPage = async (): Promise<Page | null> => {
  try {
    return await client.get<Page>({ endpoint: 'pages' });
  } catch (e) {
    console.error('[getPage] failed:', e);
    return null;
  }
};