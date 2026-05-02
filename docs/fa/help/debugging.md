---
read_when:
    - باید خروجی خام مدل را برای نشت استدلال بررسی کنید
    - می‌خواهید Gateway را هنگام تکرار و اصلاح در حالت پایش اجرا کنید
    - به یک گردش‌کار اشکال‌زدایی تکرارپذیر نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل، و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-05-02T22:20:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

راهنماهای اشکال‌زدایی برای خروجی جریانی، به‌ویژه وقتی یک ارائه‌دهنده استدلال را با متن عادی مخلوط می‌کند.

## بازنویسی‌های اشکال‌زدایی زمان اجرا

از `/debug` در چت برای تنظیم بازنویسی‌های پیکربندی **فقط زمان اجرا** استفاده کنید (در حافظه، نه روی دیسک).
`/debug` به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعالش کنید.
این کار وقتی مفید است که لازم باشد تنظیمات کم‌کاربرد را بدون ویرایش `openclaw.json` تغییر دهید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` همه بازنویسی‌ها را پاک می‌کند و به پیکربندی روی دیسک برمی‌گردد.

## خروجی ردگیری نشست

وقتی می‌خواهید خط‌های ردگیری/اشکال‌زدایی متعلق به Plugin را در یک نشست ببینید،
بدون اینکه حالت verbose کامل را روشن کنید، از `/trace` استفاده کنید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

از `/trace` برای عیب‌یابی‌های Plugin مانند خلاصه‌های اشکال‌زدایی Active Memory استفاده کنید.
برای خروجی عادی وضعیت/ابزار در حالت verbose همچنان از `/verbose` استفاده کنید، و برای بازنویسی‌های پیکربندی فقط زمان اجرا همچنان از
`/debug` استفاده کنید.

## ردگیری چرخه حیات Plugin

وقتی فرمان‌های چرخه حیات Plugin کند به نظر می‌رسند و به تفکیک مرحله‌ای داخلی برای فراداده Plugin، کشف، رجیستری،
آینه زمان اجرا، جهش پیکربندی، و کارهای تازه‌سازی نیاز دارید، از `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` استفاده کنید. این ردگیری اختیاری است و در
stderr نوشته می‌شود، بنابراین خروجی فرمان JSON همچنان قابل تجزیه می‌ماند.

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

پیش از رفتن سراغ پروفایلر CPU، از این برای بررسی چرخه حیات Plugin استفاده کنید.
اگر فرمان از یک checkout منبع اجرا می‌شود، ترجیح بدهید زمان اجرای ساخته‌شده را
با `node dist/entry.js ...` پس از `pnpm build` اندازه‌گیری کنید؛ `pnpm openclaw ...`
سربار source-runner را هم اندازه‌گیری می‌کند.

## راه‌اندازی CLI و پروفایل‌گیری فرمان

وقتی فرمانی کند به نظر می‌رسد، از بنچمارک راه‌اندازی موجود در مخزن استفاده کنید:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

برای پروفایل‌گیری موردی از مسیر runner عادی منبع،
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` را تنظیم کنید:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner پرچم‌های پروفایل CPU در Node را اضافه می‌کند و برای فرمان یک `.cpuprofile` می‌نویسد. پیش از افزودن instrumentation موقت به کد فرمان، از این استفاده کنید.

## حالت watch در Gateway

برای تکرار سریع، Gateway را زیر file watcher اجرا کنید:

```bash
pnpm gateway:watch
```

به‌صورت پیش‌فرض، این کار یک نشست tmux با نام
`openclaw-gateway-watch-main` (یا گونه‌ای وابسته به profile/port مانند
`openclaw-gateway-watch-dev-19001`) را شروع یا بازشروع می‌کند و از ترمینال‌های تعاملی به‌صورت خودکار attach می‌شود.
shellهای غیرتعاملی، CI، و فراخوانی‌های exec عامل detached می‌مانند و به‌جای آن
دستورالعمل‌های attach را چاپ می‌کنند. هر وقت لازم بود به‌صورت دستی attach کنید:

```bash
tmux attach -t openclaw-gateway-watch-main
```

pane در tmux، watcher خام را اجرا می‌کند:

```bash
node scripts/watch-node.mjs gateway --force
```

وقتی tmux لازم نیست، از حالت foreground استفاده کنید:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

برای غیرفعال کردن auto-attach در حالی که مدیریت tmux حفظ می‌شود:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

هنگام اشکال‌زدایی نقاط داغ راه‌اندازی/زمان اجرا، زمان CPU مربوط به Gateway تحت watch را پروفایل کنید:

```bash
pnpm gateway:watch --benchmark
```

wrapper مربوط به watch پیش از فراخوانی Gateway، `--benchmark` را مصرف می‌کند و
به ازای هر خروجی فرزند Gateway، یک `.cpuprofile` مربوط به V8 زیر
`.artifacts/gateway-watch-profiles/` می‌نویسد. Gateway تحت watch را متوقف یا بازشروع کنید تا
پروفایل فعلی flush شود، سپس آن را با Chrome DevTools یا Speedscope باز کنید:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

وقتی می‌خواهید پروفایل‌ها جای دیگری باشند، از `--benchmark-dir <path>` استفاده کنید.

wrapper مربوط به tmux انتخابگرهای رایج زمان اجرا و غیرمحرمانه مانند
`OPENCLAW_PROFILE`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`،
`OPENCLAW_GATEWAY_PORT`، و `OPENCLAW_SKIP_CHANNELS` را به pane منتقل می‌کند. اعتبارنامه‌های ارائه‌دهنده را در profile/config عادی خود قرار دهید، یا برای secretهای موقتی و موردی از حالت foreground خام استفاده کنید.
pane مدیریت‌شده tmux همچنین برای خوانایی، لاگ‌های Gateway را به‌صورت پیش‌فرض رنگی می‌کند؛
برای غیرفعال کردن خروجی ANSI هنگام شروع `pnpm gateway:watch`، `FORCE_COLOR=0` را تنظیم کنید.

watcher روی فایل‌های مرتبط با build زیر `src/`، فایل‌های منبع extension،
فراداده `package.json` و `openclaw.plugin.json` مربوط به extension، `tsconfig.json`،
`package.json`، و `tsdown.config.ts` بازشروع می‌شود. تغییرات فراداده extension، gateway را بدون اجبار به rebuild با `tsdown` بازشروع می‌کند؛ تغییرات منبع و پیکربندی همچنان
ابتدا `dist` را rebuild می‌کنند.

هر پرچم CLI مربوط به gateway را پس از `gateway:watch` اضافه کنید تا در هر بازشروع منتقل شود. اجرای دوباره همان فرمان watch، pane نام‌گذاری‌شده tmux را دوباره spawn می‌کند، و
watcher خام همچنان قفل تک-watcher خود را حفظ می‌کند تا parentهای watcher تکراری به‌جای انباشته شدن، جایگزین شوند.

## profile توسعه + Gateway توسعه (`--dev`)

از profile توسعه برای جداسازی state و بالا آوردن یک تنظیمات امن و دورریختنی برای
اشکال‌زدایی استفاده کنید. **دو** پرچم `--dev` وجود دارد:

- **`--dev` سراسری (profile):** state را زیر `~/.openclaw-dev` جدا می‌کند و
  port پیش‌فرض gateway را روی `19001` می‌گذارد (portهای مشتق‌شده همراه با آن جابه‌جا می‌شوند).
- **`gateway --dev`: به Gateway می‌گوید در صورت نبودن، یک پیکربندی پیش‌فرض +
  workspace بسازد** (و `BOOTSTRAP.md` را رد کند).

جریان پیشنهادی (profile توسعه + bootstrap توسعه):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

اگر هنوز نصب سراسری ندارید، CLI را از مسیر `pnpm openclaw ...` اجرا کنید.

این کار چه می‌کند:

1. **جداسازی profile** (`--dev` سراسری)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas نیز متناسب با آن جابه‌جا می‌شوند)

2. **bootstrap توسعه** (`gateway --dev`)
   - اگر پیکربندی وجود نداشته باشد، یک پیکربندی حداقلی می‌نویسد (`gateway.mode=local`، bind loopback).
   - `agent.workspace` را روی workspace توسعه تنظیم می‌کند.
   - `agent.skipBootstrap=true` را تنظیم می‌کند (بدون `BOOTSTRAP.md`).
   - اگر فایل‌های workspace وجود نداشته باشند، آن‌ها را seed می‌کند:
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - هویت پیش‌فرض: **C3‑PO** (droid پروتکل).
   - ارائه‌دهندگان کانال را در حالت توسعه رد می‌کند (`OPENCLAW_SKIP_CHANNELS=1`).

جریان reset (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک پرچم profile **سراسری** است و بعضی runnerها آن را می‌بلعند. اگر لازم است آن را صریح بنویسید، از شکل env var استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` پیکربندی، اعتبارنامه‌ها، نشست‌ها، و workspace توسعه را پاک می‌کند (با استفاده از
`trash`، نه `rm`)، سپس تنظیمات توسعه پیش‌فرض را دوباره می‌سازد.

<Tip>
اگر یک gateway غیرتوسعه از قبل در حال اجرا است (launchd یا systemd)، اول آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## لاگ‌گیری جریان خام (OpenClaw)

OpenClaw می‌تواند **جریان خام assistant** را پیش از هر نوع فیلتر/قالب‌بندی لاگ کند.
این بهترین راه برای دیدن این است که آیا استدلال به‌صورت deltaهای متن ساده می‌رسد
(یا به‌صورت بلوک‌های thinking جداگانه).

از طریق CLI فعالش کنید:

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

برای ثبت **chunkهای خام سازگار با OpenAI** پیش از اینکه به بلوک‌ها تجزیه شوند،
pi-mono یک logger جداگانه ارائه می‌کند:

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

- لاگ‌های جریان خام می‌توانند promptهای کامل، خروجی ابزار، و داده‌های کاربر را شامل شوند.
- لاگ‌ها را محلی نگه دارید و پس از اشکال‌زدایی حذفشان کنید.
- اگر لاگ‌ها را به اشتراک می‌گذارید، ابتدا secretها و PII را پاک‌سازی کنید.

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
