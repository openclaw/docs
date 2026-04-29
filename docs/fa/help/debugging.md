---
read_when:
    - باید خروجی خام مدل را برای نشت استدلال بررسی کنید
    - می‌خواهید هنگام تکرار و اصلاح، Gateway را در حالت پایش اجرا کنید
    - به یک گردش‌کار تکرارپذیر برای اشکال‌زدایی نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل، و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-04-29T22:58:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

راهنماهای اشکال‌زدایی برای خروجی جریانی، به‌ویژه وقتی یک ارائه‌دهنده استدلال را با متن عادی ترکیب می‌کند.

## بازنویسی‌های اشکال‌زدایی زمان اجرا

در چت از `/debug` برای تنظیم بازنویسی‌های پیکربندی **فقط زمان اجرا** استفاده کنید (در حافظه، نه روی دیسک).
`/debug` به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعالش کنید.
این وقتی مفید است که لازم دارید تنظیمات کمترشناخته‌شده را بدون ویرایش `openclaw.json` تغییر دهید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` همهٔ بازنویسی‌ها را پاک می‌کند و به پیکربندی روی دیسک برمی‌گردد.

## خروجی ردیابی نشست

وقتی می‌خواهید خطوط ردیابی/اشکال‌زدایی متعلق به Plugin را در یک نشست ببینید،
بدون اینکه حالت کاملاً مفصل را روشن کنید، از `/trace` استفاده کنید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

از `/trace` برای عیب‌یابی Plugin مانند خلاصه‌های اشکال‌زدایی Active Memory استفاده کنید.
برای خروجی وضعیت/ابزار مفصل عادی همچنان از `/verbose` استفاده کنید، و برای
بازنویسی‌های پیکربندی فقط زمان اجرا همچنان از `/debug` استفاده کنید.

## ردیابی چرخهٔ عمر Plugin

وقتی دستورهای چرخهٔ عمر Plugin کند به نظر می‌رسند و به تفکیک مرحله‌ای داخلی برای
فرادادهٔ Plugin، کشف، رجیستری، آینهٔ زمان اجرا، جهش پیکربندی و کارهای نوسازی نیاز دارید،
از `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` استفاده کنید. این ردیابی اختیاری است و در
stderr می‌نویسد، بنابراین خروجی JSON دستور همچنان قابل تجزیه می‌ماند.

نمونه:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

نمونه خروجی:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

پیش از سراغ گرفتن از پروفایلر CPU، از این برای بررسی چرخهٔ عمر Plugin استفاده کنید.
اگر دستور از یک checkout سورس اجرا می‌شود، ترجیحاً پس از `pnpm build` زمان اجرای
ساخته‌شده را با `node dist/entry.js ...` اندازه‌گیری کنید؛ `pnpm openclaw ...`
سربار اجراکنندهٔ سورس را هم اندازه می‌گیرد.

## زمان‌سنجی موقت اشکال‌زدایی CLI

OpenClaw فایل `src/cli/debug-timing.ts` را به‌عنوان یک راهنمای کوچک برای بررسی
محلی نگه می‌دارد. این ابزار عمداً به راه‌اندازی CLI، مسیریابی دستورها، یا هیچ
دستوری به‌صورت پیش‌فرض وصل نشده است. فقط هنگام اشکال‌زدایی یک دستور کند از آن
استفاده کنید، سپس پیش از فرود دادن تغییر رفتاری، import و بازه‌ها را حذف کنید.

وقتی یک دستور کند است و پیش از تصمیم‌گیری دربارهٔ استفاده از پروفایلر CPU یا
رفع یک زیرسیستم مشخص به تفکیک سریع مرحله‌ها نیاز دارید، از این استفاده کنید.

### افزودن بازه‌های موقت

راهنما را نزدیک کدی که بررسی می‌کنید اضافه کنید. برای نمونه، هنگام اشکال‌زدایی
`openclaw models list`، یک وصلهٔ موقت در
`src/commands/models/list.list-command.ts` می‌تواند شبیه این باشد:

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

رهنمودها:

- نام مرحله‌های موقت را با `debug:` شروع کنید.
- فقط چند بازه دور بخش‌های مشکوک به کندی اضافه کنید.
- مرحله‌های گسترده مانند `registry`، `auth_store`، یا `rows` را به نام‌های
  راهنما ترجیح دهید.
- برای کار همگام از `time()` و برای promiseها از `timeAsync()` استفاده کنید.
- stdout را تمیز نگه دارید. راهنما در stderr می‌نویسد، بنابراین خروجی JSON دستور
  قابل تجزیه می‌ماند.
- پیش از باز کردن PR نهایی رفع مشکل، importها و بازه‌های موقت را حذف کنید.
- خروجی زمان‌سنجی یا خلاصه‌ای کوتاه را در issue یا PR بیاورید که بهینه‌سازی را
  توضیح می‌دهد.

### اجرا با خروجی خوانا

حالت خوانا برای اشکال‌زدایی زنده بهترین است:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

نمونه خروجی از بررسی موقت `models list`:

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

| مرحله | زمان | معنی آن |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store` | 20.3s | بارگذاری مخزن پروفایل احراز هویت بزرگ‌ترین هزینه است و باید اول بررسی شود. |
| `debug:models:list:ensure_models_json` | 5.0s | همگام‌سازی `models.json` به‌اندازه‌ای پرهزینه است که برای caching یا شرایط skip بررسی شود. |
| `debug:models:list:load_model_registry` | 5.9s | ساخت رجیستری و کار دسترس‌پذیری ارائه‌دهنده‌ها نیز هزینه‌های معناداری هستند. |
| `debug:models:list:read_registry_models` | 2.4s | خواندن همهٔ مدل‌های رجیستری رایگان نیست و ممکن است برای `--all` مهم باشد. |
| مرحله‌های افزودن ردیف | مجموعاً 3.2s | ساخت پنج ردیف نمایش‌داده‌شده هنوز چندین ثانیه طول می‌کشد، بنابراین مسیر فیلتر کردن شایستهٔ بررسی دقیق‌تر است. |
| `debug:models:list:print_model_table` | 0ms | رندر کردن گلوگاه نیست. |

این یافته‌ها برای هدایت وصلهٔ بعدی کافی هستند، بدون اینکه کد زمان‌سنجی در مسیرهای
production باقی بماند.

### اجرا با خروجی JSON

وقتی می‌خواهید داده‌های زمان‌سنجی را ذخیره یا مقایسه کنید، از حالت JSON استفاده کنید:

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

### پاک‌سازی پیش از فرود

پیش از باز کردن PR نهایی:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

دستور نباید هیچ محل فراخوانی ابزارگذاری موقت برگرداند، مگر اینکه PR به‌طور
صریح در حال افزودن یک سطح عیب‌یابی دائمی باشد. برای رفع‌های عملکردی عادی، فقط
تغییر رفتاری، آزمون‌ها، و یادداشتی کوتاه با شواهد زمان‌سنجی را نگه دارید.

برای نقاط داغ عمیق‌تر CPU، به‌جای افزودن wrapperهای زمان‌سنجی بیشتر، از پروفایلینگ
Node (`--cpu-prof`) یا یک پروفایلر خارجی استفاده کنید.

## حالت watch Gateway

برای تکرار سریع، Gateway را زیر watcher فایل اجرا کنید:

```bash
pnpm gateway:watch
```

به‌صورت پیش‌فرض، این یک نشست tmux با نام `openclaw-gateway-watch-main`
(یا گونه‌ای مخصوص پروفایل/درگاه مانند `openclaw-gateway-watch-dev-19001`) را
شروع یا بازراه‌اندازی می‌کند و از ترمینال‌های تعاملی به‌صورت خودکار attach می‌شود.
شل‌های غیرتعاملی، CI، و فراخوانی‌های exec عامل detached می‌مانند و در عوض دستورهای
attach را چاپ می‌کنند. هر وقت لازم بود دستی attach کنید:

```bash
tmux attach -t openclaw-gateway-watch-main
```

پنجرهٔ tmux watcher خام را اجرا می‌کند:

```bash
node scripts/watch-node.mjs gateway --force
```

وقتی tmux را نمی‌خواهید، از حالت foreground استفاده کنید:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

در حالی که مدیریت tmux را حفظ می‌کنید، auto-attach را غیرفعال کنید:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

wrapper مربوط به tmux انتخابگرهای رایج و غیرمحرمانهٔ زمان اجرا مانند
`OPENCLAW_PROFILE`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`،
`OPENCLAW_GATEWAY_PORT`، و `OPENCLAW_SKIP_CHANNELS` را به پنجره منتقل می‌کند.
اعتبارنامه‌های ارائه‌دهنده را در پروفایل/پیکربندی عادی خود قرار دهید، یا برای
رازهای موقتی یک‌باره از حالت foreground خام استفاده کنید.

watcher روی فایل‌های مرتبط با ساخت زیر `src/`، فایل‌های سورس extension،
فرادادهٔ `package.json` و `openclaw.plugin.json` مربوط به extension، `tsconfig.json`،
`package.json`، و `tsdown.config.ts` بازراه‌اندازی می‌شود. تغییرات فرادادهٔ extension،
Gateway را بدون اجبار به بازسازی `tsdown` بازراه‌اندازی می‌کنند؛ تغییرات سورس و
پیکربندی همچنان اول `dist` را بازسازی می‌کنند.

هر پرچم CLI مربوط به Gateway را بعد از `gateway:watch` اضافه کنید تا در هر
بازراه‌اندازی منتقل شود. اجرای دوبارهٔ همان دستور watch پنجرهٔ tmux نام‌گذاری‌شده
را دوباره spawn می‌کند، و watcher خام همچنان قفل تک-watcher خود را نگه می‌دارد تا
والدهای watcher تکراری به‌جای انباشته شدن جایگزین شوند.

## پروفایل توسعه + Gateway توسعه (`--dev`)

از پروفایل توسعه برای ایزوله کردن state و بالا آوردن یک تنظیم امن و دورریختنی
برای اشکال‌زدایی استفاده کنید. **دو** پرچم `--dev` وجود دارد:

- **`--dev` سراسری (پروفایل):** state را زیر `~/.openclaw-dev` ایزوله می‌کند و
  درگاه پیش‌فرض Gateway را `19001` می‌گذارد (درگاه‌های مشتق‌شده همراه آن جابه‌جا می‌شوند).
- **`gateway --dev`: به Gateway می‌گوید در صورت نبودن، یک پیکربندی پیش‌فرض +
  workspace را به‌صورت خودکار بسازد** (و از BOOTSTRAP.md بگذرد).

جریان پیشنهادی (پروفایل توسعه + bootstrap توسعه):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

اگر هنوز نصب سراسری ندارید، CLI را با `pnpm openclaw ...` اجرا کنید.

این کارها را انجام می‌دهد:

1. **ایزوله‌سازی پروفایل** (`--dev` سراسری)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas متناسب با آن جابه‌جا می‌شوند)

2. **Bootstrap توسعه** (`gateway --dev`)
   - اگر پیکربندی موجود نباشد، یک پیکربندی حداقلی می‌نویسد (`gateway.mode=local`، bind به loopback).
   - `agent.workspace` را روی workspace توسعه تنظیم می‌کند.
   - `agent.skipBootstrap=true` را تنظیم می‌کند (بدون BOOTSTRAP.md).
   - اگر فایل‌های workspace موجود نباشند، آن‌ها را seed می‌کند:
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - هویت پیش‌فرض: **C3‑PO** (دروید پروتکل).
   - ارائه‌دهنده‌های کانال را در حالت توسعه skip می‌کند (`OPENCLAW_SKIP_CHANNELS=1`).

جریان reset (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک پرچم پروفایل **سراسری** است و بعضی اجراکننده‌ها آن را مصرف می‌کنند. اگر لازم دارید آن را صریح بنویسید، از شکل متغیر محیطی استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` پیکربندی، اعتبارنامه‌ها، نشست‌ها، و workspace توسعه را پاک می‌کند (با
`trash`، نه `rm`) و سپس تنظیم پیش‌فرض توسعه را دوباره می‌سازد.

<Tip>
اگر یک Gateway غیرتوسعه از قبل در حال اجراست (launchd یا systemd)، اول آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## ثبت خام stream (OpenClaw)

OpenClaw می‌تواند **stream خام دستیار** را پیش از هرگونه فیلتر/قالب‌بندی ثبت کند.
این بهترین راه برای دیدن این است که آیا استدلال به‌صورت دلتاهای متن ساده می‌رسد
(یا به‌صورت بلوک‌های thinking جداگانه).

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

## ثبت قطعه‌های خام (pi-mono)

برای ثبت **قطعه‌های خام سازگار با OpenAI** پیش از اینکه به بلوک‌ها تجزیه شوند،
pi-mono یک ثبت‌کننده جداگانه ارائه می‌کند:

```bash
PI_RAW_STREAM=1
```

مسیر اختیاری:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

فایل پیش‌فرض:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> نکته: این فقط توسط فرایندهایی منتشر می‌شود که از ارائه‌دهنده
> `openai-completions` در pi-mono استفاده می‌کنند.

## نکات ایمنی

- لاگ‌های جریان خام می‌توانند شامل پرامپت‌های کامل، خروجی ابزار و داده‌های کاربر باشند.
- لاگ‌ها را محلی نگه دارید و پس از اشکال‌زدایی حذفشان کنید.
- اگر لاگ‌ها را به اشتراک می‌گذارید، ابتدا اسرار و اطلاعات شناسایی شخصی را پاک‌سازی کنید.

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
