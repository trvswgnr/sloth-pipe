import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';


const locales = {
    root: { label: 'English', lang: 'en' },
    es: { label: 'Español', lang: 'es' },
};

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
            locales,
            editLink: {
                baseUrl:
                    "https://github.com/trvswgnr/sloth-pipe/edit/main/docs/",
            },
            lastUpdated: true,
            sidebar: [
                {
                    label: 'Getting started',
                    translations: {
                        es: "Comienza aqui"
                    },
                    items: [
                        { label: 'Why Sloth Pipe?', translations: { es: "¿Por qué Sloth Pipe?" }, link: '/getting-started/why/' },
                        { label: 'Installation', translations: { es: "Instalación" }, link: '/getting-started/installation/' },
                        { label: 'Usage', translations: { es: "Uso" }, link: '/getting-started/usage/' },
                    ],
                },
                {
                    label: 'Reference',
                    translations: {
                        es: "Referencia"
                    },
                    items: [
                        { label: 'Pipe Function', translations: { es: "Función Pipe" }, link: '/reference/pipe-function/' },
                        { label: 'Methods', translations: { es: "Métodos" }, link: '/reference/methods/' },
                        { label: 'Error Handling', translations: { es: "Manejo de Errores" }, link: '/reference/error-handling/' },
                        { label: 'Async Await Support', translations: { es: "Soporte para Async Await" }, link: '/reference/async-await-support/' },
                    ],
                },
            ],
        }),
    ],
});
