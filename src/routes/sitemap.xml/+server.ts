/**
 * Dynamic sitemap.xml.
 *
 * Lists every static route plus every microCMS work-detail slug. Crawlers
 * fetch this on each visit, so the freshness guarantee is "as up-to-date as
 * the latest microCMS publish" without a redeploy.
 *
 * Cache-Control gives CDNs a 1-hour TTL — short enough that newly-published
 * works appear in search results within an hour, long enough to avoid hitting
 * microCMS for every crawler request.
 */

import type { RequestHandler } from './$types';
import { getList } from '$lib/js/microcms';

const SITE_ORIGIN = 'https://one.tokyo.jp';

// Static routes the user can reach directly. /works/[slug] entries are
// appended below from microCMS.
const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
	{ path: '/', changefreq: 'weekly', priority: '1.0' },
	{ path: '/works', changefreq: 'weekly', priority: '0.9' },
	{ path: '/works/list', changefreq: 'weekly', priority: '0.7' },
	{ path: '/office', changefreq: 'monthly', priority: '0.7' },
	{ path: '/jobs', changefreq: 'weekly', priority: '0.7' },
	{ path: '/contact', changefreq: 'monthly', priority: '0.6' }
];

export const GET: RequestHandler = async () => {
	// Fetch all work IDs + their last-update timestamps. limit=100 covers the
	// current archive with headroom; bump if the catalog grows past that.
	let workEntries: Array<{ id: string; updatedAt: string }> = [];
	try {
		const res = await getList({
			limit: 100,
			fields: 'id,updatedAt'
		});
		workEntries = (res.contents ?? []).map((w) => ({
			id: w.id,
			updatedAt: w.updatedAt
		}));
	} catch {
		// Fall through with an empty list — the sitemap still ships static
		// routes so crawlers aren't left with a 500.
	}

	const today = new Date().toISOString().slice(0, 10);

	const urls: string[] = [];

	for (const r of STATIC_ROUTES) {
		urls.push(
			`<url>` +
				`<loc>${SITE_ORIGIN}${r.path}</loc>` +
				`<lastmod>${today}</lastmod>` +
				`<changefreq>${r.changefreq}</changefreq>` +
				`<priority>${r.priority}</priority>` +
				`</url>`
		);
	}

	for (const w of workEntries) {
		const lastmod = (w.updatedAt ?? '').slice(0, 10) || today;
		urls.push(
			`<url>` +
				`<loc>${SITE_ORIGIN}/works/${w.id}</loc>` +
				`<lastmod>${lastmod}</lastmod>` +
				`<changefreq>monthly</changefreq>` +
				`<priority>0.8</priority>` +
				`</url>`
		);
	}

	const body =
		`<?xml version="1.0" encoding="UTF-8"?>` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
		urls.join('') +
		`</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
};
