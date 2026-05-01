import type { PageServerLoad } from './$types';
import { getJobs } from '$lib/js/microcms';

// Order is preserved by createdAt — records were inserted in display order
// (Graphic Designer → Assistant Designer → Project Manager → Internship).
export const load: PageServerLoad = async () => {
	const res = await getJobs({ limit: 100, orders: 'createdAt' });
	return { jobs: res.contents };
};
