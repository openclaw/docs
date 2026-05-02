---
read_when:
    - باید خروجی خام مدل را از نظر نشت استدلال بررسی کنید
    - می‌خواهید Gateway را هنگام تکرار روی تغییرات در حالت پایش اجرا کنید
    - به یک گردش کار تکرارپذیر برای اشکال‌زدایی نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل، و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-05-02T20:46:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

راهنماهای اشکال‌زدایی برای خروجی جریانی، به‌ویژه زمانی که یک ارائه‌دهنده استدلال را با متن عادی مخلوط می‌کند.

## بازنویسی‌های اشکال‌زدایی زمان اجرا

از `/debug` در چت استفاده کنید تا بازنویسی‌های پیکربندی **فقط زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک).
`/debug` به‌صورت پیش‌فرض غیرفعال است؛ آن را با `commands.debug: true` فعال کنید.
این زمانی کاربردی است که لازم دارید تنظیمات کم‌کاربرد را بدون ویرایش `openclaw.json` تغییر دهید.

مثال‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` همه بازنویسی‌ها را پاک می‌کند و به پیکربندی روی دیسک برمی‌گردد.

## خروجی ردیابی نشست

وقتی می‌خواهید خط‌های ردیابی/اشکال‌زدایی متعلق به Plugin را در یک نشست ببینید،
بدون اینکه حالت کاملاً پرجزئیات را روشن کنید، از `/trace` استفاده کنید.

مثال‌ها:

```text
/trace
/trace on
/trace off
```

از `/trace` برای عیب‌یابی‌های Plugin مانند خلاصه‌های اشکال‌زدایی Active Memory استفاده کنید.
برای خروجی عادی و پرجزئیات وضعیت/ابزار همچنان از `/verbose` استفاده کنید، و برای
بازنویسی‌های پیکربندی فقط زمان اجرا همچنان از `/debug` استفاده کنید.

## ردیابی چرخه عمر Plugin

وقتی فرمان‌های چرخه عمر Plugin کند به نظر می‌رسند و به یک شکست مرحله‌ای داخلی برای
فراداده Plugin، کشف، رجیستری، آینه زمان اجرا، جهش پیکربندی، و کار تازه‌سازی نیاز دارید،
از `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` استفاده کنید. این ردیابی اختیاری است و در
stderr می‌نویسد، بنابراین خروجی فرمان JSON همچنان قابل تجزیه می‌ماند.

مثال:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

خروجی نمونه:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

پیش از سراغ گرفتن یک پروفایلر CPU، از این برای بررسی چرخه عمر Plugin استفاده کنید.
اگر فرمان از یک checkout منبع اجرا می‌شود، ترجیح دهید پس از `pnpm build` زمان اجرای
ساخته‌شده را با `node dist/entry.js ...` اندازه‌گیری کنید؛ `pnpm openclaw ...`
سربار اجراکننده منبع را هم اندازه‌گیری می‌کند.

## زمان‌سنجی موقت اشکال‌زدایی CLI

OpenClaw فایل `src/cli/debug-timing.ts` را به‌عنوان یک راهنمای کوچک برای بررسی
محلی نگه می‌دارد. این عمداً به شروع CLI، مسیریابی فرمان، یا هیچ فرمانی به‌صورت
پیش‌فرض وصل نشده است. فقط هنگام اشکال‌زدایی یک فرمان کند از آن استفاده کنید، سپس
پیش از وارد کردن تغییر رفتاری، import و spanها را حذف کنید.

وقتی یک فرمان کند است و پیش از تصمیم‌گیری درباره استفاده از پروفایلر CPU یا رفع
یک زیرسامانه خاص به یک شکست مرحله‌ای سریع نیاز دارید، از این استفاده کنید.

### افزودن spanهای موقت

راهنما را نزدیک کدی که بررسی می‌کنید اضافه کنید. برای مثال، هنگام اشکال‌زدایی
`openclaw models list`، یک وصله موقت در
`src/commands/models/list.list-command.ts` ممکن است شبیه این باشد:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

راهنماها:

- نام مرحله‌های موقت را با `debug:` آغاز کنید.
- فقط چند span دور بخش‌های کندِ مشکوک اضافه کنید.
- مرحله‌های گسترده مانند `registry`، `auth_store`، یا `rows` را به نام‌های راهنما ترجیح دهید.
- برای کار همگام از `time()` و برای promiseها از `timeAsync()` استفاده کنید.
- stdout را تمیز نگه دارید. راهنما در stderr می‌نویسد، بنابراین خروجی JSON فرمان قابل تجزیه می‌ماند.
- پیش از باز کردن PR رفع نهایی، importها و spanهای موقت را حذف کنید.
- خروجی زمان‌سنجی یا یک خلاصه کوتاه را در issue یا PR بگنجانید که بهینه‌سازی را توضیح می‌دهد.

### اجرا با خروجی خوانا

حالت خوانا برای اشکال‌زدایی زنده بهترین گزینه است:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

خروجی نمونه از یک بررسی موقت `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

یافته‌ها از این خروجی:

| مرحله                                    |       زمان | معنای آن                                                                                           |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | بارگذاری مخزن پروفایل احراز هویت بزرگ‌ترین هزینه است و باید ابتدا بررسی شود.                       |
| `debug:models:list:ensure_models_json`   |       5.0s | همگام‌سازی `models.json` آن‌قدر پرهزینه است که برای cache کردن یا شرط‌های رد شدن بررسی شود.                    |
| `debug:models:list:load_model_registry`  |       5.9s | ساخت رجیستری و کار دسترسی‌پذیری ارائه‌دهنده نیز هزینه‌های معناداری هستند.                         |
| `debug:models:list:read_registry_models` |       2.4s | خواندن همه مدل‌های رجیستری رایگان نیست و ممکن است برای `--all` مهم باشد.                                     |
| مرحله‌های افزودن ردیف                    | در مجموع 3.2s | ساخت پنج ردیف نمایش‌داده‌شده هنوز چند ثانیه طول می‌کشد، پس مسیر فیلتر کردن سزاوار بررسی دقیق‌تر است. |
| `debug:models:list:print_model_table`    |        0ms | رندر کردن گلوگاه نیست.                                                                        |

این یافته‌ها برای هدایت وصله بعدی کافی هستند، بدون اینکه کد زمان‌سنجی در مسیرهای
تولید باقی بماند.

### اجرا با خروجی JSON

وقتی می‌خواهید داده زمان‌سنجی را ذخیره یا مقایسه کنید، از حالت JSON استفاده کنید:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

هر خط stderr یک شیء JSON است:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### پاک‌سازی پیش از وارد کردن تغییر

پیش از باز کردن PR نهایی:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

این فرمان نباید هیچ محل فراخوانی instrument موقت برگرداند، مگر اینکه PR صراحتاً
در حال افزودن یک سطح عیب‌یابی دائمی باشد. برای رفع‌های معمول عملکرد، فقط تغییر
رفتاری، آزمون‌ها، و یک یادداشت کوتاه با شواهد زمان‌سنجی را نگه دارید.

برای hotspotهای عمیق‌تر CPU، به‌جای افزودن پوشش‌های زمان‌سنجی بیشتر، از پروفایلینگ
Node (`--cpu-prof`) یا یک پروفایلر خارجی استفاده کنید.

## حالت watch برای Gateway

برای تکرار سریع، Gateway را زیر file watcher اجرا کنید:

```bash
pnpm gateway:watch
```

به‌صورت پیش‌فرض، این یک نشست tmux با نام
`openclaw-gateway-watch-main` (یا یک گونه وابسته به پروفایل/پورت مانند
`openclaw-gateway-watch-dev-19001`) را شروع یا بازشروع می‌کند و از ترمینال‌های
تعاملی به‌صورت خودکار متصل می‌شود. shellهای غیرتعاملی، CI، و فراخوانی‌های exec
عامل detached می‌مانند و به‌جای آن دستورالعمل اتصال را چاپ می‌کنند. در صورت نیاز
دستی متصل شوید:

```bash
tmux attach -t openclaw-gateway-watch-main
```

pane مربوط به tmux watcher خام را اجرا می‌کند:

```bash
node scripts/watch-node.mjs gateway --force
```

وقتی tmux مطلوب نیست، از حالت foreground استفاده کنید:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

اتصال خودکار را در حالی که مدیریت tmux را نگه می‌دارید غیرفعال کنید:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

زمان CPU مربوط به Gateway تحت watch را هنگام اشکال‌زدایی hotspotهای شروع/زمان اجرا پروفایل کنید:

```bash
pnpm gateway:watch --benchmark
```

wrapper مربوط به watch، پیش از فراخوانی Gateway، گزینه `--benchmark` را مصرف می‌کند و
برای هر خروج فرزند Gateway یک فایل V8 با پسوند `.cpuprofile` زیر
`.artifacts/gateway-watch-profiles/` می‌نویسد. Gateway تحت watch را متوقف یا بازشروع کنید
تا پروفایل فعلی flush شود، سپس آن را با Chrome DevTools یا Speedscope باز کنید:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

وقتی می‌خواهید پروفایل‌ها جای دیگری باشند، از `--benchmark-dir <path>` استفاده کنید.

wrapper مربوط به tmux انتخابگرهای رایج زمان اجرا و غیرمحرمانه مانند
`OPENCLAW_PROFILE`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`،
`OPENCLAW_GATEWAY_PORT`، و `OPENCLAW_SKIP_CHANNELS` را به pane منتقل می‌کند. اعتبارنامه‌های
ارائه‌دهنده را در پروفایل/پیکربندی عادی خود قرار دهید، یا برای secretهای موقت یک‌باره
از حالت foreground خام استفاده کنید.
pane مدیریت‌شده tmux همچنین برای خوانایی، به‌صورت پیش‌فرض logهای رنگی Gateway را فعال می‌کند؛
برای غیرفعال کردن خروجی ANSI هنگام شروع `pnpm gateway:watch` مقدار `FORCE_COLOR=0` را تنظیم کنید.

watcher روی فایل‌های مرتبط با build زیر `src/`، فایل‌های منبع extension،
فراداده `package.json` و `openclaw.plugin.json` مربوط به extension، `tsconfig.json`,
`package.json`، و `tsdown.config.ts` بازشروع می‌شود. تغییرات فراداده extension،
Gateway را بدون اجبار به rebuild با `tsdown` بازشروع می‌کند؛ تغییرات منبع و
پیکربندی همچنان ابتدا `dist` را rebuild می‌کنند.

هر flag مربوط به CLI برای Gateway را پس از `gateway:watch` اضافه کنید تا در هر
بازشروع منتقل شود. اجرای دوباره همان فرمان watch، pane نام‌گذاری‌شده tmux را
دوباره spawn می‌کند، و watcher خام همچنان lock تک-watcher خود را نگه می‌دارد تا
والدهای watcher تکراری به‌جای انباشته شدن جایگزین شوند.

## پروفایل توسعه + Gateway توسعه (`--dev`)

از پروفایل توسعه استفاده کنید تا state را ایزوله کنید و یک راه‌اندازی امن و دورریختنی
برای اشکال‌زدایی بالا بیاورید. **دو** flag با نام `--dev` وجود دارد:

- **`--dev` سراسری (پروفایل):** state را زیر `~/.openclaw-dev` ایزوله می‌کند و
  پورت Gateway را به‌صورت پیش‌فرض روی `19001` می‌گذارد (پورت‌های مشتق‌شده هم با آن جابه‌جا می‌شوند).
- **`gateway --dev`: به Gateway می‌گوید در صورت نبودن، یک پیکربندی + workspace پیش‌فرض را خودکار ایجاد کند**
  (و `BOOTSTRAP.md` را رد کند).

جریان پیشنهادی (پروفایل توسعه + bootstrap توسعه):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

اگر هنوز نصب سراسری ندارید، CLI را از طریق `pnpm openclaw ...` اجرا کنید.

این کارها را انجام می‌دهد:

1. **ایزوله‌سازی پروفایل** (`--dev` سراسری)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (مرورگر/canvas متناسب با آن جابه‌جا می‌شوند)

2. **bootstrap توسعه** (`gateway --dev`)
   - اگر پیکربندی وجود نداشته باشد، یک پیکربندی حداقلی می‌نویسد (`gateway.mode=local`، bind روی loopback).
   - `agent.workspace` را روی workspace توسعه تنظیم می‌کند.
   - `agent.skipBootstrap=true` را تنظیم می‌کند (بدون `BOOTSTRAP.md`).
   - اگر فایل‌های workspace وجود نداشته باشند، آن‌ها را seed می‌کند:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - هویت پیش‌فرض: **C3‑PO** (droid پروتکل).
   - ارائه‌دهنده‌های کانال را در حالت توسعه رد می‌کند (`OPENCLAW_SKIP_CHANNELS=1`).

جریان reset (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک پرچم پروفایل **سراسری** است و بعضی اجراکننده‌ها آن را مصرف می‌کنند. اگر لازم است آن را صریح بنویسید، از شکل متغیر محیطی استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` پیکربندی، اعتبارنامه‌ها، نشست‌ها، و فضای کاری dev را پاک می‌کند (با استفاده از
`trash`، نه `rm`) و سپس راه‌اندازی پیش‌فرض dev را دوباره می‌سازد.

<Tip>
اگر یک Gateway غیر dev از قبل در حال اجراست (launchd یا systemd)، ابتدا آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## ثبت گزارش جریان خام (OpenClaw)

OpenClaw می‌تواند **جریان خام دستیار** را پیش از هرگونه فیلتر یا قالب‌بندی ثبت کند.
این بهترین راه برای دیدن این است که آیا استدلال به‌صورت دلتاهای متن ساده می‌رسد
(یا به‌صورت بلوک‌های فکر جداگانه).

آن را از طریق CLI فعال کنید:

```bash
pnpm gateway:watch --raw-stream
```

بازنویسی اختیاری مسیر:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

متغیرهای محیطی معادل:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

فایل پیش‌فرض:

`~/.openclaw/logs/raw-stream.jsonl`

## ثبت گزارش قطعهٔ خام (pi-mono)

برای ثبت **قطعه‌های خام سازگار با OpenAI** پیش از آنکه به بلوک‌ها تجزیه شوند،
pi-mono یک ثبت‌کنندهٔ گزارش جداگانه ارائه می‌کند:

```bash
PI_RAW_STREAM=1
```

مسیر اختیاری:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

فایل پیش‌فرض:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> توجه: این مورد فقط توسط فرایندهایی منتشر می‌شود که از ارائه‌دهندهٔ
> `openai-completions` در pi-mono استفاده می‌کنند.

## نکات ایمنی

- گزارش‌های جریان خام می‌توانند شامل پرامپت‌های کامل، خروجی ابزار، و داده‌های کاربر باشند.
- گزارش‌ها را محلی نگه دارید و پس از اشکال‌زدایی حذف کنید.
- اگر گزارش‌ها را به اشتراک می‌گذارید، ابتدا محرمانه‌ها و اطلاعات شناسایی شخصی را پاک‌سازی کنید.

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
