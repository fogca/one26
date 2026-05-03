import type { PageServerLoad } from './$types';
import { getPage } from '$lib/js/microcms';

export const load: PageServerLoad = async () => {
	const page = await getPage();
	return { page };
};
