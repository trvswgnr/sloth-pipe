import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: 'Sloth Pipe',
            social: {
                github: 'https://github.com/trvswgnr/sloth-pipe',
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
                    autogenerate: { directory: 'reference' },
                },
            ],
        }),
    ],
});
