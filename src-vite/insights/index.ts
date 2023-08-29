import { type QwikVitePluginOptions } from '@builder.io/qwik/optimizer';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'node:path';
import { PluginOption } from 'vite';

const logWarn = (message?: any) => {
  console.warn('\x1b[33m%s\x1b[0m', `\n\nQWIK WARN: ${message}\n`);
};

export async function qwikInsights(qwikInsightsOpts: {
  publicApiKey: string;
  baseUrl?: string;
}): Promise<PluginOption> {
  const { publicApiKey, baseUrl = 'https://qwik-insights.builder.io' } = qwikInsightsOpts;
  let isProd = false;
  const outDir = 'dist';
  const vitePlugin: PluginOption = {
    name: 'vite-plugin-qwik-insights',
    enforce: 'pre',
    async config(viteConfig) {
      isProd = viteConfig.mode !== 'ssr';
      if (isProd) {
        const qManifest: QwikVitePluginOptions['entryStrategy'] = { type: 'smart' };
        try {
          const response = await fetch(`${baseUrl}/api/v1/${publicApiKey}/bundles/`);
          const bundles = await response.json();
          qManifest.manual = bundles;
        } catch (e) {
          logWarn('fail to fetch manifest from Insights DB');
        }
        console.log('qwikInsights 1', join(process.cwd(), outDir, 'q-insights.json'))
        if (!existsSync(join(process.cwd(), outDir))) {
          mkdirSync(join(process.cwd(), outDir));
        }
        await writeFile(join(process.cwd(), outDir, 'q-insights.json'), JSON.stringify(qManifest));
        console.log('qwikInsights 2', join(process.cwd(), outDir, 'q-insights.json'))
        const read = await readFile(join(process.cwd(), outDir, 'q-insights.json'), 'utf-8');
        console.log('qwikInsights 3', read)
      }
    },
    closeBundle: async () => {
      const path = join(process.cwd(), outDir, 'q-manifest.json');
      if (isProd && existsSync(path)) {
        const qManifest = await readFile(path, 'utf-8');
        console.log('closeBundle 3', qManifest)

        try {
          await fetch(`${baseUrl}/api/v1/${publicApiKey}/post/manifest`, {
            method: 'post',
            body: qManifest,
          });
        } catch (e) {
          logWarn('fail to post manifest to Insights DB');
        }
      }
    },
  };
  return vitePlugin;
}
