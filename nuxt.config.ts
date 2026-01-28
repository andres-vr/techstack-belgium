export default defineNuxtConfig({
    ssr: true,
    app: {
      head: {
        link: [
          {
            rel: 'icon',
            type: 'image/svg+xml',
            href: `data:image/svg+xml;utf8,
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
                stroke='%233B82F6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                <path d='M12 2 2 7l10 5 10-5-10-5Z'/>
                <path d='m2 17 10 5 10-5'/>
                <path d='m2 12 10 5 10-5'/>
              </svg>`
          }
        ]
      }
    },
    compatibilityDate: '2025-07-15',
    devtools: { enabled: false},
    css: ['~/main.css'],
    postcss: {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    },
    imports: {
      dirs: [
        'app/stores',
        'app/utils/**',
      ],
    },
    modules: ['@nuxtjs/i18n', '@nuxt/image', '@pinia/nuxt'],
    image: {
      provider: 'vercel',
      screens: {
        icon14: 14,
        icon16: 16,
        icon20: 20,
        icon24: 24,
        logo37: 37,
        logo40: 40,
      },
      presets: {
        logo: {
          modifiers: ({
            format: 'webp',
            quality: 5,
            width: 37,
            height: 37
          } as any)
        }
      }
    },
    vite: {
      build: {
        minify: 'esbuild',
      }
    },
    i18n: {
      defaultLocale: 'en',
      langDir: 'locales',
      locales: [
        { code: 'en', name: 'English', file: 'en.json' },
        { code: 'nl', name: 'Nederlands', file: 'nl.json' },
        { code: 'fr', name: 'Français', file: 'fr.json' },
        { code: 'de', name: 'Deutsch', file: 'de.json' }
      ]
    }
  }
);