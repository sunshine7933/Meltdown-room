import { defineConfig } from 'vite';
import { iwsdkDev } from '@iwsdk/vite-plugin-dev';
export default defineConfig({ base: './', plugins: [iwsdkDev()] });
