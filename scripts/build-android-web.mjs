import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const project = process.cwd();
const work = mkdtempSync(join(tmpdir(), 'sd-android-web-'));
for (const path of ['components/ui', 'hooks', 'public']) cpSync(join(project, path), join(work, path), { recursive: true });
// Android build uses only tariff defaults bundled into the APK.
writeFileSync(join(work, 'hooks/use-tariffs.ts'), "\"use client\";\nimport {DEFAULT_TARIFFS,type TariffSnapshot} from '@/lib/tariffs';\nexport const TARIFF_ORIGIN='';\nexport function useTariffs(){ return {tariffs: DEFAULT_TARIFFS as TariffSnapshot, status: 'Встроенные условия'}; }\n");
for (const path of ['app/page.tsx', 'app/globals.css', 'lib/tariffs.ts', 'lib/calculator.ts', 'lib/discounts.ts', 'lib/mortgage.ts', 'lib/loan.ts', 'components/legal-footer.tsx', 'components/commission-calculator.tsx', 'components/loan-calculator.tsx', 'components/mortgage-calculators.tsx', 'lib/utils.ts', 'postcss.config.mjs', 'tsconfig.json', 'package.json']) {
  mkdirSync(resolve(work, path, '..'), { recursive: true });
  cpSync(join(project, path), join(work, path));
}
// Android ships only the local calculator, without preview reporters or analytics.
let layout = readFileSync(join(project, 'app/layout.tsx'), 'utf8');
layout = layout.replace(/^import .*from "@\/components\/error-reporter"\n/gm, '')
  .replace(/^import .*from "@\/components\/app-analytics"\n/gm, '')
  .replace(/\s*<AppAnalytics \/>/g, '')
  .replace(/\s*<ReactErrorBoundary>/g, '').replace(/\s*<\/ReactErrorBoundary>/g, '')
  .replace(/\s*<ErrorReporter \/>/g, '').replace(/\s*<ConsoleReporter \/>/g, '');
writeFileSync(join(work, 'app/layout.tsx'), layout);
writeFileSync(join(work, 'next.config.mjs'), 'export default { output: "export", trailingSlash: true, images: { unoptimized: true }, devIndicators: false };\n');
symlinkSync(join(project, 'node_modules'), join(work, 'node_modules'), 'dir');
execFileSync(process.execPath, [join(project, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], {
  cwd: work, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});
const output = join(project, 'android/build/assets/web');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(join(work, 'out'), output, { recursive: true });
const index = join(output, 'index.html');
const clipboard = '<script>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:function(text){return new Promise(function(resolve,reject){try{if(!window.AndroidClipboard)throw new Error("Буфер обмена недоступен");window.AndroidClipboard.copy(String(text));resolve();}catch(error){reject(error);}});}}});</script>';
writeFileSync(index, readFileSync(index, 'utf8').replace('<head>', '<head>' + clipboard));
console.log('Автономный интерфейс Android готов.');
