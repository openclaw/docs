---
read_when:
    - باید خروجی خام مدل را برای نشت استدلال بررسی کنید
    - می‌خواهید هنگام تکرار و اصلاح، Gateway را در حالت پایش اجرا کنید
    - به یک گردش‌کار اشکال‌زدایی تکرارپذیر نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل، و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-05-03T21:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

کمک‌کننده‌های اشکال‌زدایی برای خروجی جریان، به‌ویژه وقتی یک ارائه‌دهنده استدلال را با متن عادی مخلوط می‌کند.

## بازنویسی‌های اشکال‌زدایی زمان اجرا

از `/debug` در چت استفاده کنید تا بازنویسی‌های پیکربندی **فقط در زمان اجرا** را تنظیم کنید (حافظه، نه دیسک).
`/debug` به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعالش کنید.
این زمانی مفید است که لازم دارید تنظیمات کمتر شناخته‌شده را بدون ویرایش `openclaw.json` تغییر دهید.

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
بدون اینکه حالت کامل پرجزئیات را روشن کنید، از `/trace` استفاده کنید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

از `/trace` برای عیب‌یابی‌های Plugin مانند خلاصه‌های اشکال‌زدایی Active Memory استفاده کنید.
برای خروجی معمول وضعیت/ابزار پرجزئیات همچنان از `/verbose` استفاده کنید، و برای
بازنویسی‌های پیکربندی فقط در زمان اجرا همچنان از `/debug` استفاده کنید.

## ردگیری چرخه عمر Plugin

وقتی فرمان‌های چرخه عمر Plugin کند به نظر می‌رسند و به یک تفکیک مرحله‌ای داخلی برای
فراداده Plugin، کشف، رجیستری، آینه زمان اجرا، تغییر پیکربندی، و کارهای نوسازی نیاز دارید،
از `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` استفاده کنید. این ردگیری اختیاری است و در stderr
نوشته می‌شود، بنابراین خروجی فرمان JSON همچنان قابل تجزیه می‌ماند.

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

پیش از رفتن سراغ پروفایلر CPU، از این برای بررسی چرخه عمر Plugin استفاده کنید.
اگر فرمان از یک checkout منبع اجرا می‌شود، بهتر است زمان اجرای ساخته‌شده را با
`node dist/entry.js ...` پس از `pnpm build` اندازه‌گیری کنید؛ `pnpm openclaw ...`
سربار اجراکننده منبع را نیز اندازه‌گیری می‌کند.

## راه‌اندازی CLI و پروفایل‌گیری فرمان

وقتی یک فرمان کند به نظر می‌رسد، از بنچمارک راه‌اندازی ثبت‌شده در مخزن استفاده کنید:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

برای پروفایل‌گیری یک‌باره از مسیر اجراکننده معمول منبع، `OPENCLAW_RUN_NODE_CPU_PROF_DIR`
را تنظیم کنید:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

اجراکننده منبع پرچم‌های پروفایل CPU در Node را اضافه می‌کند و برای فرمان یک
`.cpuprofile` می‌نویسد. پیش از افزودن ابزارگذاری موقت به کد فرمان از این استفاده کنید.

## حالت پایش Gateway

برای تکرار سریع، Gateway را زیر file watcher اجرا کنید:

```bash
pnpm gateway:watch
```

به‌صورت پیش‌فرض، این کار یک نشست tmux با نام `openclaw-gateway-watch-main`
(یا یک گونه مخصوص پروفایل/پورت مانند `openclaw-gateway-watch-dev-19001`) را
شروع یا بازراه‌اندازی می‌کند و از ترمینال‌های تعاملی به‌صورت خودکار attach می‌شود.
پوسته‌های غیرتعاملی، CI، و فراخوانی‌های exec عامل جدا می‌مانند و به‌جای آن دستورهای
attach را چاپ می‌کنند. هر زمان لازم بود دستی attach کنید:

```bash
tmux attach -t openclaw-gateway-watch-main
```

پنل tmux اجراکننده watcher خام را اجرا می‌کند:

```bash
node scripts/watch-node.mjs gateway --force
```

وقتی tmux را نمی‌خواهید، از حالت foreground استفاده کنید:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

غیرفعال کردن auto-attach در حالی که مدیریت tmux حفظ می‌شود:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

هنگام اشکال‌زدایی گلوگاه‌های راه‌اندازی/زمان اجرا، زمان CPU مربوط به Gateway تحت پایش را پروفایل کنید:

```bash
pnpm gateway:watch --benchmark
```

پوشش watch قبل از فراخوانی Gateway، `--benchmark` را مصرف می‌کند و برای هر خروج
فرزند Gateway یک `.cpuprofile` متعلق به V8 را زیر `.artifacts/gateway-watch-profiles/`
می‌نویسد. Gateway تحت پایش را متوقف یا بازراه‌اندازی کنید تا پروفایل فعلی flush شود،
سپس آن را با Chrome DevTools یا Speedscope باز کنید:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

وقتی پروفایل‌ها را در جای دیگری می‌خواهید، از `--benchmark-dir <path>` استفاده کنید.
وقتی می‌خواهید فرزند بنچمارک‌شده پاک‌سازی پیش‌فرض پورت با `--force` را رد کند و اگر
پورت Gateway از قبل در حال استفاده است سریع شکست بخورد، از `--benchmark-no-force`
استفاده کنید.

پوشش tmux انتخابگرهای رایج غیرمحرمانه زمان اجرا مانند
`OPENCLAW_PROFILE`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`،
`OPENCLAW_GATEWAY_PORT`، و `OPENCLAW_SKIP_CHANNELS` را به پنل منتقل می‌کند. اعتبارنامه‌های
ارائه‌دهنده را در پروفایل/پیکربندی معمول خود بگذارید، یا برای محرمانه‌های موقتی یک‌باره
از حالت foreground خام استفاده کنید.
اگر Gateway تحت پایش هنگام راه‌اندازی خارج شود، watcher یک‌بار
`openclaw doctor --fix --non-interactive` را اجرا می‌کند و فرزند Gateway را بازراه‌اندازی
می‌کند. وقتی شکست اصلی راه‌اندازی را بدون گذر تعمیر فقط مخصوص توسعه می‌خواهید، از
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` استفاده کنید.
پنل tmux مدیریت‌شده همچنین برای خوانایی، به‌صورت پیش‌فرض لاگ‌های رنگی Gateway را فعال
می‌کند؛ برای غیرفعال کردن خروجی ANSI هنگام شروع `pnpm gateway:watch` مقدار `FORCE_COLOR=0`
را تنظیم کنید.

watcher با تغییر فایل‌های مرتبط با build زیر `src/`، فایل‌های منبع افزونه،
فراداده‌های `package.json` و `openclaw.plugin.json` افزونه، `tsconfig.json`،
`package.json`، و `tsdown.config.ts` بازراه‌اندازی می‌شود. تغییرات فراداده افزونه
Gateway را بدون اجبار به rebuild با `tsdown` بازراه‌اندازی می‌کند؛ تغییرات منبع و
پیکربندی همچنان ابتدا `dist` را rebuild می‌کنند.

هر پرچم CLI مربوط به Gateway را بعد از `gateway:watch` اضافه کنید تا در هر بازراه‌اندازی
عبور داده شود. اجرای دوباره همان فرمان watch پنل tmux نام‌گذاری‌شده را دوباره spawn
می‌کند، و watcher خام همچنان قفل تک-watcher خودش را نگه می‌دارد تا والدهای watcher
تکراری به‌جای انباشته شدن جایگزین شوند.

## پروفایل توسعه + Gateway توسعه (`--dev`)

از پروفایل توسعه استفاده کنید تا وضعیت را ایزوله کنید و یک تنظیمات امن و دورریختنی
برای اشکال‌زدایی بالا بیاورید. **دو** پرچم `--dev` وجود دارد:

- **`--dev` سراسری (پروفایل):** وضعیت را زیر `~/.openclaw-dev` ایزوله می‌کند و
  پورت Gateway را به‌صورت پیش‌فرض `19001` قرار می‌دهد (پورت‌های مشتق‌شده همراه آن جابه‌جا می‌شوند).
- **`gateway --dev`: به Gateway می‌گوید هنگام نبودن پیکربندی + workspace پیش‌فرض را به‌صورت خودکار بسازد**
  (و `BOOTSTRAP.md` را رد کند).

جریان پیشنهادی (پروفایل توسعه + bootstrap توسعه):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

اگر هنوز نصب سراسری ندارید، CLI را از طریق `pnpm openclaw ...` اجرا کنید.

این کار چه می‌کند:

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
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - هویت پیش‌فرض: **C3‑PO** (دروید پروتکل).
   - ارائه‌دهندگان کانال را در حالت توسعه رد می‌کند (`OPENCLAW_SKIP_CHANNELS=1`).

جریان reset (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک پرچم پروفایل **سراسری** است و توسط بعضی اجراکننده‌ها مصرف می‌شود. اگر لازم دارید آن را صریح بنویسید، از شکل env var استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` پیکربندی، اعتبارنامه‌ها، نشست‌ها، و workspace توسعه را پاک می‌کند (با
`trash`، نه `rm`)، سپس تنظیمات پیش‌فرض توسعه را دوباره می‌سازد.

<Tip>
اگر یک Gateway غیرتوسعه از قبل در حال اجراست (launchd یا systemd)، ابتدا آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## لاگ‌گیری جریان خام (OpenClaw)

OpenClaw می‌تواند **جریان خام دستیار** را پیش از هر نوع فیلتر/قالب‌بندی لاگ کند.
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

> توجه: این فقط توسط فرایندهایی منتشر می‌شود که از ارائه‌دهنده
> `openai-completions` متعلق به pi-mono استفاده می‌کنند.

## نکات ایمنی

- لاگ‌های جریان خام می‌توانند شامل promptهای کامل، خروجی ابزار، و داده‌های کاربر باشند.
- لاگ‌ها را محلی نگه دارید و پس از اشکال‌زدایی حذفشان کنید.
- اگر لاگ‌ها را به اشتراک می‌گذارید، ابتدا محرمانه‌ها و PII را پاک‌سازی کنید.

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
