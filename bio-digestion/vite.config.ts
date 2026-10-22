import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`          -> dist/          (GitHub Pages, rutas relativas)
// `npm run build:offline`  -> dist-offline/  (un solo index.html que abre con doble clic, sin internet)
export default defineConfig(({ mode }) => {
  const offline = mode === 'offline';
  return {
    base: './',
    plugins: offline ? [viteSingleFile({ removeViteModuleLoader: true })] : [],
    build: {
      outDir: offline ? 'dist-offline' : 'dist',
      assetsInlineLimit: offline ? 100_000_000 : 4096,
      chunkSizeWarningLimit: 1200,
    },
  };
});
