import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: 'Sloth Pipe',
            social: {
                github: 'https://github.com/trvswgnr/sloth-pipe',
                "x.com": "https://twitter.com/techsavvytravvy",
            },
            customCss: [
                // Relative path to your custom CSS file
                './src/styles/custom.css',
            ],
            editLink: {
				baseUrl:
					"https://github.com/florian-lefebvre/astro-integration-kit/edit/main/docs/",
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
