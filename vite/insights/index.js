"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qwikInsights = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const node_path_1 = require("node:path");
const logWarn = (message) => {
    console.warn('\x1b[33m%s\x1b[0m', `\n\nQWIK WARN: ${message}\n`);
};
async function qwikInsights(qwikInsightsOpts) {
    const { publicApiKey, baseUrl = 'https://qwik-insights.builder.io' } = qwikInsightsOpts;
    let isProd = false;
    const outDir = 'dist';
    const vitePlugin = {
        name: 'vite-plugin-qwik-insights',
        enforce: 'pre',
        async config(viteConfig) {
            isProd = viteConfig.mode !== 'ssr';
            if (isProd) {
                const qManifest = { type: 'smart' };
                try {
                    const response = await fetch(`${baseUrl}/api/v1/${publicApiKey}/bundles/`);
                    const bundles = await response.json();
                    qManifest.manual = bundles;
                }
                catch (e) {
                    logWarn('fail to fetch manifest from Insights DB');
                }
                console.log('qwikInsights 1', (0, node_path_1.join)(process.cwd(), outDir, 'q-insights.json'));
                if (!(0, fs_1.existsSync)((0, node_path_1.join)(process.cwd(), outDir))) {
                    (0, fs_1.mkdirSync)((0, node_path_1.join)(process.cwd(), outDir));
                }
                await (0, promises_1.writeFile)((0, node_path_1.join)(process.cwd(), outDir, 'q-insights.json'), JSON.stringify(qManifest));
                console.log('qwikInsights 2', (0, node_path_1.join)(process.cwd(), outDir, 'q-insights.json'));
                const read = await (0, promises_1.readFile)((0, node_path_1.join)(process.cwd(), outDir, 'q-insights.json'), 'utf-8');
                console.log('qwikInsights 3', read);
            }
        },
        closeBundle: async () => {
            const path = (0, node_path_1.join)(process.cwd(), outDir, 'q-manifest.json');
            if (isProd && (0, fs_1.existsSync)(path)) {
                const qManifest = await (0, promises_1.readFile)(path, 'utf-8');
                console.log('closeBundle 3', qManifest);
                try {
                    await fetch(`${baseUrl}/api/v1/${publicApiKey}/post/manifest`, {
                        method: 'post',
                        body: qManifest,
                    });
                }
                catch (e) {
                    logWarn('fail to post manifest to Insights DB');
                }
            }
        },
    };
    return vitePlugin;
}
exports.qwikInsights = qwikInsights;
