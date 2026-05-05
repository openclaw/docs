---
read_when:
    - باید خروجی خام مدل را برای نشت استدلال بررسی کنید
    - می‌خواهید هنگام تکرار و اصلاح، Gateway را در حالت watch اجرا کنید
    - به یک گردش‌کار تکرارپذیر برای اشکال‌زدایی نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل، و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-05-05T01:48:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

راهنماهای اشکال‌زدایی برای خروجی جریانی، به‌ویژه وقتی یک ارائه‌دهنده استدلال را با متن عادی مخلوط می‌کند.

## بازنویسی‌های اشکال‌زدایی در زمان اجرا

از `/debug` در چت برای تنظیم بازنویسی‌های پیکربندی **فقط در زمان اجرا** استفاده کنید (در حافظه، نه روی دیسک).
`/debug` به‌طور پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعالش کنید.
این زمانی مفید است که لازم دارید تنظیمات مبهم را بدون ویرایش `openclaw.json` تغییر دهید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` همه بازنویسی‌ها را پاک می‌کند و به پیکربندی روی دیسک برمی‌گردد.

## خروجی ردیابی نشست

وقتی می‌خواهید خطوط ردیابی/اشکال‌زدایی متعلق به Plugin را در یک نشست ببینید،
بدون اینکه حالت کامل پرجزئیات را روشن کنید، از `/trace` استفاده کنید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

از `/trace` برای عیب‌یابی‌های Plugin مانند خلاصه‌های اشکال‌زدایی Active Memory استفاده کنید.
برای خروجی عادی وضعیت/ابزار پرجزئیات همچنان از `/verbose` استفاده کنید، و برای
بازنویسی‌های پیکربندی فقط در زمان اجرا همچنان از `/debug` استفاده کنید.

## ردیابی چرخه عمر Plugin

وقتی فرمان‌های چرخه عمر Plugin کند به نظر می‌رسند و به یک تفکیک مرحله‌ای داخلی برای
فراداده Plugin، کشف، رجیستری، آینه زمان اجرا، جهش پیکربندی، و کارهای تازه‌سازی نیاز دارید، از `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` استفاده کنید. ردیابی اختیاری است و
روی stderr می‌نویسد، بنابراین خروجی فرمان JSON همچنان قابل تجزیه می‌ماند.

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

قبل از رفتن سراغ پروفایلر CPU، از این برای بررسی چرخه عمر Plugin استفاده کنید.
اگر فرمان از یک checkout منبع اجرا می‌شود، ترجیح دهید زمان اجرای ساخته‌شده را
با `node dist/entry.js ...` پس از `pnpm build` اندازه‌گیری کنید؛ `pnpm openclaw ...`
هم سربار اجراکننده منبع را اندازه‌گیری می‌کند.

## پروفایلینگ راه‌اندازی CLI و فرمان‌ها

وقتی یک فرمان کند به نظر می‌رسد، از بنچمارک راه‌اندازی ثبت‌شده در مخزن استفاده کنید:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

برای پروفایلینگ موردی از مسیر اجراکننده عادی منبع، `OPENCLAW_RUN_NODE_CPU_PROF_DIR` را تنظیم کنید:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

اجراکننده منبع پرچم‌های پروفایل CPU مربوط به Node را اضافه می‌کند و برای فرمان
یک `.cpuprofile` می‌نویسد. پیش از افزودن ابزارگذاری موقت به کد فرمان، از این استفاده کنید.

برای توقف‌های راه‌اندازی که شبیه کار همزمان فایل‌سیستم یا بارگذار ماژول هستند،
پرچم ردیابی I/O همزمان Node را از طریق اجراکننده منبع اضافه کنید:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` این پرچم را به‌طور پیش‌فرض برای فرزند Gateway تحت مشاهده فعال می‌کند.
برای سرکوب خروجی ردیابی I/O همزمان Node در حالت watch،
`OPENCLAW_TRACE_SYNC_IO=0` را تنظیم کنید.

## حالت watch برای Gateway

برای تکرار سریع، Gateway را زیر file watcher اجرا کنید:

```bash
pnpm gateway:watch
```

به‌طور پیش‌فرض، این کار یک نشست tmux با نام
`openclaw-gateway-watch-main` (یا یک گونه ویژه پروفایل/پورت مانند
`openclaw-gateway-watch-dev-19001`) را شروع یا بازراه‌اندازی می‌کند و از ترمینال‌های تعاملی به‌طور خودکار متصل می‌شود.
پوسته‌های غیرتعاملی، CI، و فراخوانی‌های exec عامل جدا می‌مانند و به‌جای آن
دستورالعمل اتصال را چاپ می‌کنند. هر وقت لازم بود دستی متصل شوید:

```bash
tmux attach -t openclaw-gateway-watch-main
```

پنجره tmux watcher خام را اجرا می‌کند:

```bash
node scripts/watch-node.mjs gateway --force
```

وقتی tmux مطلوب نیست، از حالت foreground استفاده کنید:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

اتصال خودکار را با حفظ مدیریت tmux غیرفعال کنید:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

هنگام اشکال‌زدایی نقاط داغ راه‌اندازی/زمان اجرا، زمان CPU Gateway تحت مشاهده را پروفایل کنید:

```bash
pnpm gateway:watch --benchmark
```

پوشش watch پیش از فراخوانی Gateway، `--benchmark` را مصرف می‌کند و
به‌ازای هر خروج فرزند Gateway، یک `.cpuprofile` مربوط به V8 زیر
`.artifacts/gateway-watch-profiles/` می‌نویسد. برای flush کردن پروفایل فعلی،
Gateway تحت مشاهده را متوقف یا بازراه‌اندازی کنید، سپس آن را با Chrome DevTools یا Speedscope باز کنید:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

وقتی پروفایل‌ها را در جای دیگری می‌خواهید، از `--benchmark-dir <path>` استفاده کنید.
وقتی می‌خواهید فرزند بنچمارک‌شده از پاک‌سازی پورت پیش‌فرض `--force` بگذرد و اگر پورت Gateway از قبل در حال استفاده است سریع شکست بخورد، از `--benchmark-no-force` استفاده کنید.
حالت بنچمارک به‌طور پیش‌فرض هرزخروجی ردیابی sync-I/O را سرکوب می‌کند. وقتی صراحتا هم پروفایل‌های CPU و هم stack traceهای sync-I/O مربوط به Node را می‌خواهید، `OPENCLAW_TRACE_SYNC_IO=1` را همراه `--benchmark` تنظیم کنید. در حالت بنچمارک این بلوک‌های ردیابی
در `gateway-watch-output.log` زیر دایرکتوری بنچمارک نوشته می‌شوند و
از پنجره ترمینال فیلتر می‌شوند؛ لاگ‌های عادی Gateway همچنان قابل مشاهده می‌مانند.

پوشش tmux انتخابگرهای رایج و غیرمحرمانه زمان اجرا مانند
`OPENCLAW_PROFILE`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`،
`OPENCLAW_GATEWAY_PORT`، و `OPENCLAW_SKIP_CHANNELS` را به داخل پنجره منتقل می‌کند. اعتبارنامه‌های ارائه‌دهنده را در پروفایل/پیکربندی عادی خود قرار دهید، یا برای
رازهای موقتی موردی از حالت foreground خام استفاده کنید.
اگر Gateway تحت مشاهده هنگام راه‌اندازی خارج شود، watcher یک‌بار
`openclaw doctor --fix --non-interactive` را اجرا می‌کند و فرزند Gateway را بازراه‌اندازی می‌کند.
وقتی شکست راه‌اندازی اصلی را بدون گذر تعمیر فقط مخصوص توسعه می‌خواهید،
از `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` استفاده کنید.
پنجره tmux مدیریت‌شده همچنین برای خوانایی، به‌طور پیش‌فرض لاگ‌های رنگی Gateway دارد؛
برای غیرفعال کردن خروجی ANSI هنگام شروع `pnpm gateway:watch`، `FORCE_COLOR=0` را تنظیم کنید.

watcher روی فایل‌های مرتبط با build زیر `src/`، فایل‌های منبع افزونه‌ها،
فراداده `package.json` و `openclaw.plugin.json` افزونه‌ها، `tsconfig.json`،
`package.json`، و `tsdown.config.ts` بازراه‌اندازی می‌شود. تغییرات فراداده افزونه
Gateway را بدون اجبار به بازسازی `tsdown` بازراه‌اندازی می‌کند؛ تغییرات منبع و پیکربندی همچنان
ابتدا `dist` را بازسازی می‌کنند.

هر پرچم CLI مربوط به gateway را پس از `gateway:watch` اضافه کنید تا در هر
بازراه‌اندازی عبور داده شود. اجرای دوباره همان فرمان watch پنجره tmux نام‌گذاری‌شده را دوباره spawn می‌کند، و
watcher خام همچنان قفل تک-watcher خود را نگه می‌دارد تا والدهای watcher تکراری
به‌جای انباشته شدن جایگزین شوند.

## پروفایل dev + Gateway توسعه (`--dev`)

از پروفایل dev برای جداسازی state و بالا آوردن یک چیدمان امن و دورریختنی برای
اشکال‌زدایی استفاده کنید. **دو** پرچم `--dev` وجود دارد:

- **`--dev` سراسری (پروفایل):** state را زیر `~/.openclaw-dev` جدا می‌کند و
  پورت پیش‌فرض Gateway را روی `19001` می‌گذارد (پورت‌های مشتق‌شده همراه آن جابه‌جا می‌شوند).
- **`gateway --dev`: به Gateway می‌گوید هنگام نبودن، یک پیکربندی + workspace پیش‌فرض را خودکار بسازد** (و از BOOTSTRAP.md بگذرد).

روند پیشنهادی (پروفایل dev + راه‌اندازی dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

اگر هنوز نصب سراسری ندارید، CLI را از طریق `pnpm openclaw ...` اجرا کنید.

این کار چه می‌کند:

1. **جداسازی پروفایل** (`--dev` سراسری)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (مرورگر/canvas نیز متناسب با آن جابه‌جا می‌شوند)

2. **راه‌اندازی dev** (`gateway --dev`)
   - اگر پیکربندی وجود نداشته باشد، یک پیکربندی حداقلی می‌نویسد (`gateway.mode=local`، bind loopback).
   - `agent.workspace` را روی workspace توسعه تنظیم می‌کند.
   - `agent.skipBootstrap=true` را تنظیم می‌کند (بدون BOOTSTRAP.md).
   - اگر فایل‌های workspace وجود نداشته باشند، آن‌ها را seed می‌کند:
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - هویت پیش‌فرض: **C3‑PO** (دروید پروتکل).
   - ارائه‌دهنده‌های کانال را در حالت dev رد می‌کند (`OPENCLAW_SKIP_CHANNELS=1`).

روند بازنشانی (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک پرچم پروفایل **سراسری** است و بعضی اجراکننده‌ها آن را مصرف می‌کنند. اگر لازم دارید صریح بنویسیدش، از شکل env var استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` پیکربندی، اعتبارنامه‌ها، نشست‌ها، و workspace توسعه را پاک می‌کند (با
`trash`، نه `rm`)، سپس چیدمان پیش‌فرض dev را دوباره می‌سازد.

<Tip>
اگر یک gateway غیر-dev از قبل در حال اجراست (launchd یا systemd)، ابتدا آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## لاگ‌گیری جریان خام (OpenClaw)

OpenClaw می‌تواند **جریان خام assistant** را پیش از هرگونه فیلتر/قالب‌بندی لاگ کند.
این بهترین راه برای دیدن این است که آیا استدلال به‌صورت deltaهای متن ساده می‌رسد
(یا به‌صورت بلوک‌های thinking جداگانه).

آن را از طریق CLI فعال کنید:

```bash
pnpm gateway:watch --raw-stream
```

بازنویسی اختیاری مسیر:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

env varهای معادل:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

فایل پیش‌فرض:

`~/.openclaw/logs/raw-stream.jsonl`

## لاگ‌گیری chunk خام (pi-mono)

برای گرفتن **chunkهای خام سازگار با OpenAI** پیش از اینکه به بلوک‌ها تجزیه شوند،
pi-mono یک لاگر جداگانه ارائه می‌کند:

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
> `openai-completions` مربوط به pi-mono استفاده می‌کنند.

## نکات ایمنی

- لاگ‌های جریان خام می‌توانند شامل promptهای کامل، خروجی ابزار، و داده‌های کاربر باشند.
- لاگ‌ها را محلی نگه دارید و پس از اشکال‌زدایی حذفشان کنید.
- اگر لاگ‌ها را به اشتراک می‌گذارید، ابتدا رازها و PII را پاک‌سازی کنید.

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
