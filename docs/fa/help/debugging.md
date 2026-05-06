---
read_when:
    - باید خروجی خام مدل را برای نشت استدلال بررسی کنید
    - می‌خواهید هنگام تکرار تغییرات، Gateway را در حالت watch اجرا کنید
    - به یک گردش‌کار اشکال‌زدایی تکرارپذیر نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-05-06T09:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

کمک‌کننده‌های اشکال‌زدایی برای خروجی جریانی، به‌ویژه زمانی که یک ارائه‌دهنده استدلال را با متن عادی مخلوط می‌کند.

## بازنویسی‌های اشکال‌زدایی زمان اجرا

از `/debug` در گفتگو استفاده کنید تا بازنویسی‌های پیکربندی **فقط در زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک).
`/debug` به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعالش کنید.
این زمانی مفید است که لازم دارید تنظیمات کمترشناخته‌شده را بدون ویرایش `openclaw.json` روشن یا خاموش کنید.

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
بدون اینکه حالت verbose کامل را روشن کنید، از `/trace` استفاده کنید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

از `/trace` برای عیب‌یابی‌های Plugin مانند خلاصه‌های اشکال‌زدایی Active Memory استفاده کنید.
برای خروجی عادی وضعیت/ابزار در حالت verbose همچنان از `/verbose` استفاده کنید، و برای بازنویسی‌های پیکربندی فقط در زمان اجرا همچنان از
`/debug` استفاده کنید.

## ردگیری چرخه عمر Plugin

وقتی فرمان‌های چرخه عمر Plugin کند به نظر می‌رسند و به یک تفکیک مرحله‌ای داخلی برای فراداده Plugin، کشف، رجیستری،
آینه زمان اجرا، تغییر پیکربندی، و کارهای تازه‌سازی نیاز دارید، از `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` استفاده کنید. ردگیری opt-in است و در stderr نوشته می‌شود، بنابراین خروجی فرمان JSON همچنان قابل parse می‌ماند.

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

پیش از رفتن سراغ profiler پردازنده، از این برای بررسی چرخه عمر Plugin استفاده کنید.
اگر فرمان از یک checkout منبع اجرا می‌شود، بهتر است پس از `pnpm build` زمان اجرای ساخته‌شده را با `node dist/entry.js ...` اندازه‌گیری کنید؛ `pnpm openclaw ...`
سربار source-runner را هم اندازه می‌گیرد.

## پروفایل‌گیری شروع CLI و فرمان‌ها

وقتی یک فرمان کند به نظر می‌رسد، از بنچمارک شروع ثبت‌شده در مخزن استفاده کنید:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

برای پروفایل‌گیری موردی از مسیر source runner عادی،
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` را تنظیم کنید:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner پرچم‌های پروفایل CPU مربوط به Node را اضافه می‌کند و برای فرمان یک `.cpuprofile` می‌نویسد. پیش از افزودن instrument موقت به کد فرمان، از این استفاده کنید.

برای توقف‌های شروع که شبیه کار همگام filesystem یا module-loader هستند،
پرچم ردگیری I/O همگام Node را از طریق source runner اضافه کنید:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` این پرچم را به‌صورت پیش‌فرض برای فرزند Gateway تحت watch فعال می‌کند.
برای خاموش کردن خروجی ردگیری I/O همگام Node در حالت watch،
`OPENCLAW_TRACE_SYNC_IO=0` را تنظیم کنید.

## حالت watch برای Gateway

برای تکرار سریع، Gateway را زیر file watcher اجرا کنید:

```bash
pnpm gateway:watch
```

به‌صورت پیش‌فرض، این کار یک نشست tmux به نام
`openclaw-gateway-watch-main` (یا یک گونه وابسته به profile/port مثل
`openclaw-gateway-watch-dev-19001`) را شروع یا بازشروع می‌کند و از ترمینال‌های تعاملی به‌طور خودکار attach می‌شود.
shellهای غیرتعاملی، CI، و فراخوانی‌های exec عامل detached می‌مانند و به‌جایش دستورهای attach را چاپ می‌کنند. هر وقت لازم بود دستی attach کنید:

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

برای غیرفعال کردن auto-attach در حالی که مدیریت tmux حفظ می‌شود:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

هنگام اشکال‌زدایی نقاط داغ شروع/زمان اجرا، زمان CPU مربوط به Gateway تحت watch را profile کنید:

```bash
pnpm gateway:watch --benchmark
```

wrapper مربوط به watch پیش از فراخوانی Gateway، `--benchmark` را مصرف می‌کند و زیر
`.artifacts/gateway-watch-profiles/` برای هر خروج فرزند Gateway یک `.cpuprofile` مربوط به V8 می‌نویسد. Gateway تحت watch را متوقف یا بازشروع کنید تا profile فعلی flush شود، سپس آن را با Chrome DevTools یا Speedscope باز کنید:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

وقتی می‌خواهید profileها جای دیگری باشند، از `--benchmark-dir <path>` استفاده کنید.
وقتی می‌خواهید فرزند benchmark شده پاک‌سازی پیش‌فرض پورت با `--force` را انجام ندهد و اگر پورت Gateway از قبل در حال استفاده است سریع fail شود، از `--benchmark-no-force` استفاده کنید.
حالت benchmark به‌صورت پیش‌فرض spam ردگیری sync-I/O را سرکوب می‌کند. وقتی صراحتا هم profileهای CPU و هم stack traceهای sync-I/O مربوط به Node را می‌خواهید، همراه `--benchmark` مقدار
`OPENCLAW_TRACE_SYNC_IO=1` را تنظیم کنید. در حالت benchmark، آن بلوک‌های ردگیری در `gateway-watch-output.log` زیر دایرکتوری benchmark نوشته می‌شوند و از پنجره ترمینال فیلتر می‌شوند؛ logهای عادی Gateway همچنان قابل مشاهده می‌مانند.

wrapper مربوط به tmux انتخابگرهای رایج و غیرمحرمانه زمان اجرا مانند
`OPENCLAW_PROFILE`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`،
`OPENCLAW_GATEWAY_PORT`، و `OPENCLAW_SKIP_CHANNELS` را به پنجره منتقل می‌کند. اعتبارنامه‌های ارائه‌دهنده را در profile/config عادی خود قرار دهید، یا برای رازهای موقتی یک‌باره از حالت foreground خام استفاده کنید.
اگر Gateway تحت watch هنگام شروع خارج شود، watcher یک بار
`openclaw doctor --fix --non-interactive` را اجرا می‌کند و فرزند Gateway را بازشروع می‌کند.
وقتی خطای شروع اصلی را بدون مرحله تعمیر مخصوص توسعه می‌خواهید، از `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` استفاده کنید.
پنجره tmux مدیریت‌شده همچنین برای خوانایی، logهای رنگی Gateway را به‌صورت پیش‌فرض فعال می‌کند؛
برای غیرفعال کردن خروجی ANSI، هنگام شروع `pnpm gateway:watch` مقدار `FORCE_COLOR=0` را تنظیم کنید.

watcher با تغییر فایل‌های مرتبط با build زیر `src/`، فایل‌های منبع extension،
فراداده‌های `package.json` و `openclaw.plugin.json` مربوط به extension، `tsconfig.json`،
`package.json`، و `tsdown.config.ts` بازشروع می‌شود. تغییرات فراداده extension بدون اجبار به rebuild با `tsdown` باعث بازشروع gateway می‌شوند؛ تغییرات منبع و پیکربندی همچنان ابتدا `dist` را rebuild می‌کنند.

هر پرچم CLI مربوط به gateway را پس از `gateway:watch` اضافه کنید تا در هر بازشروع عبور داده شود.
اجرای دوباره همان فرمان watch پنجره tmux نام‌گذاری‌شده را respawn می‌کند، و watcher خام همچنان قفل single-watcher خود را نگه می‌دارد تا parentهای watcher تکراری به‌جای انباشته شدن جایگزین شوند.

## profile توسعه + gateway توسعه (`--dev`)

از profile توسعه استفاده کنید تا state را جدا کنید و برای اشکال‌زدایی یک setup امن و دورریختنی بالا بیاورید. **دو** پرچم `--dev` وجود دارد:

- **`--dev` سراسری (profile):** state را زیر `~/.openclaw-dev` جدا می‌کند و پورت gateway را به‌صورت پیش‌فرض `19001` قرار می‌دهد (پورت‌های مشتق‌شده همراه آن جابه‌جا می‌شوند).
- **`gateway --dev`: به Gateway می‌گوید در صورت نبودن، یک پیکربندی پیش‌فرض + workspace را خودکار بسازد** (و BOOTSTRAP.md را رد کند).

جریان پیشنهادی (profile توسعه + bootstrap توسعه):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

اگر هنوز نصب سراسری ندارید، CLI را از طریق `pnpm openclaw ...` اجرا کنید.

این کار چه می‌کند:

1. **جداسازی profile** (`--dev` سراسری)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas متناسب با آن جابه‌جا می‌شوند)

2. **Bootstrap توسعه** (`gateway --dev`)
   - اگر پیکربندی وجود نداشته باشد، یک پیکربندی حداقلی می‌نویسد (`gateway.mode=local`، bind به loopback).
   - `agent.workspace` را روی workspace توسعه تنظیم می‌کند.
   - `agent.skipBootstrap=true` را تنظیم می‌کند (بدون BOOTSTRAP.md).
   - اگر فایل‌های workspace وجود نداشته باشند، آن‌ها را seed می‌کند:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - هویت پیش‌فرض: **C3-PO** (protocol droid).
   - ارائه‌دهنده‌های کانال را در حالت توسعه رد می‌کند (`OPENCLAW_SKIP_CHANNELS=1`).

جریان reset (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک پرچم profile **سراسری** است و برخی runnerها آن را مصرف می‌کنند. اگر لازم است آن را صریح بنویسید، از فرم متغیر محیطی استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` پیکربندی، اعتبارنامه‌ها، نشست‌ها، و workspace توسعه را پاک می‌کند (با
`trash`، نه `rm`)، سپس setup پیش‌فرض توسعه را دوباره می‌سازد.

<Tip>
اگر یک gateway غیرتوسعه از قبل در حال اجراست (launchd یا systemd)، ابتدا آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## ثبت stream خام (OpenClaw)

OpenClaw می‌تواند **stream خام دستیار** را پیش از هرگونه فیلتر/قالب‌بندی log کند.
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

متغیرهای محیطی معادل:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

فایل پیش‌فرض:

`~/.openclaw/logs/raw-stream.jsonl`

## ثبت chunk خام (pi-mono)

برای capture کردن **chunkهای خام سازگار با OpenAI** پیش از آنکه به بلوک‌ها parse شوند،
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
> `openai-completions` متعلق به pi-mono استفاده می‌کنند.

## نکته‌های ایمنی

- logهای stream خام می‌توانند شامل promptهای کامل، خروجی ابزار، و داده‌های کاربر باشند.
- logها را محلی نگه دارید و پس از اشکال‌زدایی حذفشان کنید.
- اگر logها را به اشتراک می‌گذارید، ابتدا secrets و PII را پاک‌سازی کنید.

## اشکال‌زدایی در VSCode

Source mapها برای فعال کردن اشکال‌زدایی در IDEهای مبتنی بر VSCode لازم هستند، چون بسیاری از فایل‌های تولیدشده در فرایند build با نام‌های hash شده ساخته می‌شوند. پیکربندی‌های `launch.json` موجود سرویس Gateway را هدف می‌گیرند، اما می‌توانند به‌سرعت برای هدف‌های دیگر سازگار شوند:

1. **Rebuild and Debug Gateway** - سرویس Gateway را پس از ایجاد یک build جدید اشکال‌زدایی می‌کند
2. **Debug Gateway** - سرویس Gateway مربوط به یک build از پیش موجود را اشکال‌زدایی می‌کند

### راه‌اندازی

پیکربندی پیش‌فرض **Rebuild and Debug Gateway** همه‌چیز را همراه دارد؛ به‌طور خودکار پوشه `/dist` را حذف می‌کند و پروژه را با اشکال‌زدایی فعال rebuild می‌کند:

1. پنل **Run and Debug** را از Activity Bar باز کنید یا `Ctrl`+`Shift`+`D` را فشار دهید
2. در IDE، مطمئن شوید **Rebuild and Debug Gateway** در منوی کشویی پیکربندی انتخاب شده است و سپس دکمه **Start Debugging** را فشار دهید

روش جایگزین - اگر ترجیح می‌دهید فرایندهای build و debug را دستی مدیریت کنید:

1. یک ترمینال باز کنید و source mapها را فعال کنید:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. در همان ترمینال، پروژه را rebuild کنید: `pnpm clean:dist && pnpm build`
3. در IDE، گزینه **Debug Gateway** را در منوی کشویی پیکربندی **Run and Debug** انتخاب کنید و سپس دکمه **Start Debugging** را فشار دهید

اکنون می‌توانید در فایل‌های منبع TypeScript خود (دایرکتوری `src/`) breakpoint تنظیم کنید و debugger از طریق source mapها breakpointها را به‌درستی به JavaScript کامپایل‌شده map می‌کند. می‌توانید متغیرها را بررسی کنید، گام‌به‌گام در کد حرکت کنید، و call stackها را طبق انتظار بررسی کنید.

### نکته‌ها

- اگر از گزینه **"Rebuild and Debug Gateway"** استفاده می‌کنید - هر بار که debugger اجرا می‌شود، پوشه `/dist` را کامل حذف می‌کند و پیش از شروع Gateway یک `pnpm build` کامل با source mapهای فعال اجرا می‌کند
- اگر از گزینه **"Debug Gateway"** استفاده می‌کنید - نشست‌های debug می‌توانند هر زمان شروع و متوقف شوند بدون اینکه روی پوشه `/dist` اثر بگذارند، اما باید از یک فرایند ترمینال جداگانه هم برای فعال کردن اشکال‌زدایی و هم برای مدیریت چرخه build استفاده کنید
- تنظیمات `launch.json` مربوط به `args` را برای اشکال‌زدایی بخش‌های دیگر پروژه تغییر دهید
- اگر لازم است از CLI ساخته‌شده OpenClaw برای کارهای دیگر استفاده کنید (مثلا `dashboard --no-open` اگر نشست debug شما یک auth token جدید ایجاد می‌کند)، می‌توانید آن را در ترمینالی دیگر به‌صورت `node ./openclaw.mjs` اجرا کنید یا یک alias shell مانند `alias openclaw-build="node $(pwd)/openclaw.mjs"` بسازید

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
