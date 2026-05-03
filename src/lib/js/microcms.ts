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
  // null on draft-only records (microCMS returns null when never published).
  publishedAt: string | null;
  revisedAt: string | null;
  // Set when an admin "公開停止" the record. Treated as not-public when present.
  closedAt?: string | null;
  // 26 site flag — when true the work is reachable via direct URL only,
  // hidden from /works grid, /works/list, sitemap and next-project nav.
  // Optional: schema field may not exist yet; treated as `false` if absent.
  is_unlisted?: boolean;
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

/**
 * True iff the work is publicly listable: published, not closed, not unlisted.
 *
 * Use this to filter `getList()` results before exposing them on /works,
 * /works/list, the home gallery, sitemap.xml, and next/prev navigation.
 *
 * Direct slug access (`/works/[slug]` via `getDetail`) bypasses this so an
 * unlisted work is still reachable by URL — that's the design intent for
 * the limited-share flag.
 */
export function isPublicWork(
  work: Pick<Work, 'publishedAt' | 'closedAt' | 'is_unlisted'>
): boolean {
  if (!work.publishedAt) return false; // never published / draft-only
  if (work.closedAt) return false; // 公開停止
  if (work.is_unlisted === true) return false; // 26 限定公開
  return true;
}

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