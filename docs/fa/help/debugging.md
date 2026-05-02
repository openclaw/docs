---
read_when:
    - باید خروجی خام مدل را برای نشت استدلال بررسی کنید
    - می‌خواهید هنگام تکرار و اصلاح، Gateway را در حالت پایش اجرا کنید
    - به یک گردش‌کار اشکال‌زدایی تکرارپذیر نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل، و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-05-02T11:48:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7e28dd5f352abd8d751def61bb56acb6f22663600effdada14bf4a40214f62b
    source_path: help/debugging.md
    workflow: 16
---

ابزارهای کمکی اشکال‌زدایی برای خروجی جریانی، به‌ویژه وقتی یک ارائه‌دهنده استدلال را با متن معمولی ترکیب می‌کند.

## بازنویسی‌های اشکال‌زدایی زمان اجرا

از `/debug` در چت برای تنظیم بازنویسی‌های پیکربندی **فقط در زمان اجرا** استفاده کنید (در حافظه، نه روی دیسک).
`/debug` به‌طور پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعالش کنید.
این وقتی مفید است که لازم باشد تنظیمات کم‌کاربرد را بدون ویرایش `openclaw.json` تغییر دهید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` همه بازنویسی‌ها را پاک می‌کند و به پیکربندی روی دیسک برمی‌گردد.

## خروجی ردگیری نشست

وقتی می‌خواهید خطوط ردگیری/اشکال‌زدایی متعلق به Plugin را در یک نشست ببینید
بدون اینکه حالت کاملا پرجزئیات را فعال کنید، از `/trace` استفاده کنید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

از `/trace` برای عیب‌یابی‌های Plugin مانند خلاصه‌های اشکال‌زدایی Active Memory استفاده کنید.
برای خروجی معمول وضعیت/ابزار پرجزئیات همچنان از `/verbose` استفاده کنید، و برای بازنویسی‌های پیکربندی فقط در زمان اجرا همچنان از
`/debug` استفاده کنید.

## ردگیری چرخه عمر Plugin

وقتی فرمان‌های چرخه عمر Plugin کند به نظر می‌رسند و به یک تفکیک مرحله‌ای داخلی برای فراداده Plugin، کشف، رجیستری،
آینه زمان اجرا، جهش پیکربندی، و کار بازخوانی نیاز دارید، از `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` استفاده کنید. ردگیری اختیاری است و
در stderr می‌نویسد، بنابراین خروجی JSON فرمان همچنان قابل تجزیه می‌ماند.

نمونه:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

خروجی نمونه:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

پیش از سراغ گرفتن از پروفایلر CPU، از این برای بررسی چرخه عمر Plugin استفاده کنید.
اگر فرمان از یک checkout منبع اجرا می‌شود، ترجیحا پس از `pnpm build` زمان اجرای ساخته‌شده را با
`node dist/entry.js ...` اندازه‌گیری کنید؛ `pnpm openclaw ...`
سربار اجراکننده منبع را هم اندازه‌گیری می‌کند.

## زمان‌سنجی موقت اشکال‌زدایی CLI

OpenClaw فایل `src/cli/debug-timing.ts` را به‌عنوان یک ابزار کمکی کوچک برای بررسی محلی نگه می‌دارد.
این عمدا به‌طور پیش‌فرض به راه‌اندازی CLI، مسیریابی فرمان، یا هیچ فرمانی وصل نشده است. فقط هنگام اشکال‌زدایی یک فرمان کند از آن استفاده کنید، سپس
پیش از نهایی کردن تغییر رفتاری، import و spanها را حذف کنید.

وقتی یک فرمان کند است و پیش از تصمیم‌گیری درباره استفاده از پروفایلر CPU یا اصلاح یک زیرسامانه خاص به یک تفکیک مرحله‌ای سریع نیاز دارید، از این استفاده کنید.

### افزودن spanهای موقت

ابزار کمکی را نزدیک کدی که بررسی می‌کنید اضافه کنید. برای مثال، هنگام اشکال‌زدایی
`openclaw models list`، یک وصله موقت در
`src/commands/models/list.list-command.ts` ممکن است چنین باشد:

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

- نام مرحله‌های موقت را با `debug:` شروع کنید.
- فقط چند span پیرامون بخش‌های مشکوک به کندی اضافه کنید.
- مرحله‌های گسترده مانند `registry`، `auth_store`، یا `rows` را به نام‌های ابزار کمکی ترجیح دهید.
- برای کار همگام از `time()` و برای promiseها از `timeAsync()` استفاده کنید.
- stdout را تمیز نگه دارید. ابزار کمکی در stderr می‌نویسد، بنابراین خروجی JSON فرمان قابل تجزیه می‌ماند.
- پیش از باز کردن PR اصلاح نهایی، importها و spanهای موقت را حذف کنید.
- خروجی زمان‌سنجی یا یک خلاصه کوتاه را در issue یا PR بیاورید که بهینه‌سازی را توضیح می‌دهد.

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

یافته‌های این خروجی:

| مرحله                                    |       زمان | معنایش چیست                                                                                           |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | بارگذاری مخزن نمایه احراز هویت بزرگ‌ترین هزینه است و باید اول بررسی شود.                       |
| `debug:models:list:ensure_models_json`   |       5.0s | همگام‌سازی `models.json` آن‌قدر پرهزینه است که برای cache یا شرایط پرش بررسی شود.                    |
| `debug:models:list:load_model_registry`  |       5.9s | ساخت رجیستری و کار دسترس‌پذیری ارائه‌دهنده نیز هزینه‌های معناداری هستند.                         |
| `debug:models:list:read_registry_models` |       2.4s | خواندن همه مدل‌های رجیستری رایگان نیست و ممکن است برای `--all` مهم باشد.                                     |
| مرحله‌های افزودن ردیف                        | مجموعا 3.2s | ساخت پنج ردیف نمایش‌داده‌شده همچنان چند ثانیه طول می‌کشد، بنابراین مسیر فیلترکردن سزاوار بررسی دقیق‌تر است. |
| `debug:models:list:print_model_table`    |        0ms | رندر کردن گلوگاه نیست.                                                                        |

این یافته‌ها برای هدایت وصله بعدی کافی‌اند، بدون اینکه کد زمان‌سنجی در
مسیرهای production نگه داشته شود.

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

### پاک‌سازی پیش از نهایی کردن

پیش از باز کردن PR نهایی:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

فرمان نباید هیچ محل فراخوانی ابزارگذاری موقتی برگرداند، مگر اینکه PR
صراحتا در حال افزودن یک سطح عیب‌یابی دائمی باشد. برای اصلاحات عملکردی معمول،
فقط تغییر رفتاری، آزمون‌ها، و یک یادداشت کوتاه با شواهد زمان‌سنجی را نگه دارید.

برای گلوگاه‌های عمیق‌تر CPU، به‌جای افزودن wrapperهای زمان‌سنجی بیشتر، از پروفایلینگ Node (`--cpu-prof`) یا یک
پروفایلر خارجی استفاده کنید.

## حالت watch برای Gateway

برای تکرار سریع، Gateway را زیر نظر watcher فایل اجرا کنید:

```bash
pnpm gateway:watch
```

به‌طور پیش‌فرض، این یک نشست tmux با نام
`openclaw-gateway-watch-main` (یا یک گونه وابسته به نمایه/درگاه مانند
`openclaw-gateway-watch-dev-19001`) را شروع یا بازشروع می‌کند و از ترمینال‌های تعاملی به‌طور خودکار متصل می‌شود.
shellهای غیرتعاملی، CI، و فراخوانی‌های اجرای agent جدا می‌مانند و به‌جای آن دستورهای اتصال را چاپ می‌کنند. هر وقت لازم بود دستی متصل شوید:

```bash
tmux attach -t openclaw-gateway-watch-main
```

پنجره tmux watcher خام را اجرا می‌کند:

```bash
node scripts/watch-node.mjs gateway --force
```

وقتی tmux را نمی‌خواهید، از حالت foreground استفاده کنید:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

ضمن حفظ مدیریت tmux، اتصال خودکار را غیرفعال کنید:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

wrapper مربوط به tmux گزینشگرهای رایج زمان اجرا و غیرمحرمانه مانند
`OPENCLAW_PROFILE`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`،
`OPENCLAW_GATEWAY_PORT`، و `OPENCLAW_SKIP_CHANNELS` را به پنجره منتقل می‌کند. اعتبارنامه‌های
ارائه‌دهنده را در نمایه/پیکربندی معمول خود بگذارید، یا برای secretهای زودگذر یک‌باره از حالت foreground خام استفاده کنید.
پنجره مدیریت‌شده tmux همچنین به‌طور پیش‌فرض برای خوانایی، لاگ‌های رنگی Gateway دارد؛
برای غیرفعال کردن خروجی ANSI هنگام شروع `pnpm gateway:watch` مقدار `FORCE_COLOR=0` را تنظیم کنید.

watcher روی فایل‌های مرتبط با ساخت در `src/`، فایل‌های منبع extension،
فراداده‌های `package.json` و `openclaw.plugin.json` مربوط به extension، `tsconfig.json`،
`package.json`، و `tsdown.config.ts` بازشروع می‌شود. تغییرات فراداده extension، Gateway را
بدون اجبار به بازسازی `tsdown` بازشروع می‌کنند؛ تغییرات منبع و پیکربندی همچنان اول
`dist` را بازسازی می‌کنند.

هر flag مربوط به CLI Gateway را پس از `gateway:watch` اضافه کنید تا در هر
بازشروع عبور داده شود. اجرای دوباره همان فرمان watch پنجره tmux نام‌گذاری‌شده را دوباره ایجاد می‌کند، و
watcher خام همچنان قفل تک-watcher خود را نگه می‌دارد تا والدهای watcher تکراری
به‌جای انباشته شدن جایگزین شوند.

## نمایه dev و Gateway dev (`--dev`)

از نمایه dev برای جداسازی state و بالا آوردن یک setup امن و دورریختنی برای
اشکال‌زدایی استفاده کنید. **دو** flag به نام `--dev` وجود دارد:

- **`--dev` سراسری (نمایه):** state را زیر `~/.openclaw-dev` جدا می‌کند و
  درگاه Gateway را به‌طور پیش‌فرض روی `19001` می‌گذارد (درگاه‌های مشتق‌شده همراه آن جابه‌جا می‌شوند).
- **`gateway --dev`: به Gateway می‌گوید در صورت نبودن، یک پیکربندی پیش‌فرض +
  workspace بسازد** (و BOOTSTRAP.md را رد کند).

جریان پیشنهادی (نمایه dev + راه‌اندازی dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

اگر هنوز نصب سراسری ندارید، CLI را از طریق `pnpm openclaw ...` اجرا کنید.

این کار چه می‌کند:

1. **جداسازی نمایه** (`--dev` سراسری)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas هم متناسب با آن جابه‌جا می‌شوند)

2. **راه‌اندازی dev** (`gateway --dev`)
   - اگر پیکربندی وجود نداشته باشد، یک پیکربندی حداقلی می‌نویسد (`gateway.mode=local`، bind به loopback).
   - `agent.workspace` را روی workspace مربوط به dev تنظیم می‌کند.
   - `agent.skipBootstrap=true` را تنظیم می‌کند (بدون BOOTSTRAP.md).
   - اگر فایل‌های workspace وجود نداشته باشند، آن‌ها را seed می‌کند:
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - هویت پیش‌فرض: **C3‑PO** (دروید پروتکل).
   - در حالت dev ارائه‌دهنده‌های channel را رد می‌کند (`OPENCLAW_SKIP_CHANNELS=1`).

جریان reset (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک flag نمایه **سراسری** است و بعضی runnerها آن را مصرف می‌کنند. اگر لازم است آن را صریح بنویسید، از فرم متغیر محیطی استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` پیکربندی، اعتبارنامه‌ها، نشست‌ها، و workspace مربوط به dev را پاک می‌کند (با استفاده از
`trash`، نه `rm`)، سپس setup پیش‌فرض dev را دوباره می‌سازد.

<Tip>
اگر یک Gateway غیر-dev از قبل در حال اجراست (launchd یا systemd)، اول آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## ثبت خام جریان (OpenClaw)

OpenClaw می‌تواند **جریان خام دستیار** را پیش از هرگونه فیلترسازی/قالب‌بندی ثبت کند.
این بهترین راه برای دیدن این است که آیا استدلال به‌صورت دلتاهای متن ساده می‌رسد
یا به‌صورت بلوک‌های تفکر جداگانه.

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

## ثبت تکه‌های خام (pi-mono)

برای ثبت **تکه‌های خام سازگار با OpenAI** پیش از آنکه به بلوک‌ها تجزیه شوند،
pi-mono یک ثبت‌کننده‌ی جداگانه ارائه می‌کند:

```bash
PI_RAW_STREAM=1
```

مسیر اختیاری:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

فایل پیش‌فرض:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> نکته: این مورد فقط توسط فرایندهایی منتشر می‌شود که از ارائه‌دهنده‌ی
> `openai-completions` در pi-mono استفاده می‌کنند.

## نکته‌های ایمنی

- گزارش‌های جریان خام می‌توانند شامل پرامپت‌های کامل، خروجی ابزار، و داده‌های کاربر باشند.
- گزارش‌ها را محلی نگه دارید و پس از اشکال‌زدایی حذفشان کنید.
- اگر گزارش‌ها را به اشتراک می‌گذارید، ابتدا اسرار و اطلاعات شناسایی شخصی (PII) را پاک‌سازی کنید.

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
