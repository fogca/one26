import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		// Honor the harness-assigned port (PORT env) so multiple sessions can
		// run dev servers side by side; fall back to 3000 when run manually.
		port: Number(process.env.PORT) || 3000
	}
});
