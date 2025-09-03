import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		appDir: 'app', // Required as the default is _app
        adapter: adapter({base:process.argv.includes('dev') ? '' : "pvc-playground"}),
    }
};

export default config;
