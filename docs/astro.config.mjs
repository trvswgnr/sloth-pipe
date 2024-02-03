import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

/* https://vercel.com/docs/projects/environment-variables/system-environment-variables#system-environment-variables */
const VERCEL_PREVIEW_SITE =
	process.env.VERCEL_ENV !== 'production' &&
	process.env.VERCEL_URL &&
	`https://${process.env.VERCEL_URL}`;

const site = VERCEL_PREVIEW_SITE || 'https://sloth-pipe.vercel.app/';


// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: 'Sloth Pipe',
            social: {
                github: 'https://github.com/trvswgnr/sloth-pipe',
                "x.com": "https://twitter.com/techsavvytravvy",
            },
            favicon: '/favicon.ico',
            head: [
				{
					tag: 'meta',
					attrs: { property: 'og:image', content: site + 'og.jpg?v=1' },
				},
				{
					tag: 'meta',
					attrs: { property: 'twitter:image', content: site + 'og.jpg?v=1' },
				},
			],
            customCss: [
                // Relative path to your custom CSS file
                './src/styles/custom.css',
            ],
            editLink: {
				baseUrl:
					"https://github.com/trvswgnr/sloth-pipe/edit/main/docs/",
			},
            lastUpdated: true,
            sidebar: [
                {
                    label: 'Getting started',
                    items: [
                        { label: 'Why Sloth Pipe?', link: '/getting-started/why/' },
                        { label: 'Installation', link: '/getting-started/installation/' },
                        { label: 'Usage', link: '/getting-started/usage/' },
                    ],
                },
                {
                    label: 'Reference',
                    items: [
                        { label: 'Pipe Function', link: '/reference/pipe-function/' },
                        { label: 'Methods', link: '/reference/methods/' },
                        { label: 'Error Handling', link: '/reference/error-handling/' },
                        { label: 'Async Await Support', link: '/reference/async-await-support/' },
                    ],
                },
            ],
        }),
    ],
});
