import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/** Home → login (sin pantalla de status). */
export const load: PageLoad = () => {
  redirect(302, '/login');
};
