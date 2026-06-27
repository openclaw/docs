---
read_when:
    - باید خروجی خام مدل را برای نشت استدلال بررسی کنید
    - می‌خواهید هنگام تکرار و اصلاح، Gateway را در حالت پایش اجرا کنید
    - به یک گردش کار تکرارپذیر برای اشکال‌زدایی نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل، و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-06-27T17:52:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

کمک‌کننده‌های عیب‌یابی برای خروجی جریانی، به‌ویژه وقتی یک ارائه‌دهنده reasoning را با متن عادی مخلوط می‌کند.

## بازنویسی‌های عیب‌یابی زمان اجرا

از `/debug` در چت استفاده کنید تا بازنویسی‌های پیکربندی **فقط در زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک).
`/debug` به‌صورت پیش‌فرض غیرفعال است؛ آن را با `commands.debug: true` فعال کنید.
این زمانی کاربردی است که لازم است تنظیمات کمترشناخته‌شده را بدون ویرایش `openclaw.json` روشن یا خاموش کنید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` همه بازنویسی‌ها را پاک می‌کند و به پیکربندی روی دیسک برمی‌گردد.

## خروجی ردگیری نشست

وقتی می‌خواهید خط‌های ردگیری/عیب‌یابی متعلق به Plugin را در یک نشست ببینید،
بدون اینکه حالت کاملا پرجزئیات را فعال کنید، از `/trace` استفاده کنید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

از `/trace` برای تشخیص‌های Plugin مانند خلاصه‌های عیب‌یابی Active Memory استفاده کنید.
برای خروجی معمول وضعیت/ابزار با جزئیات، همچنان از `/verbose` استفاده کنید، و برای
بازنویسی‌های پیکربندی فقط در زمان اجرا، همچنان از `/debug` استفاده کنید.

## ردگیری چرخه عمر Plugin

وقتی فرمان‌های چرخه عمر Plugin کند به نظر می‌رسند و به یک تفکیک مرحله‌ای داخلی برای
فراداده Plugin، کشف، رجیستری، آینه زمان اجرا، جهش پیکربندی، و کارهای تازه‌سازی نیاز دارید،
از `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` استفاده کنید. این ردگیری اختیاری است و در
stderr نوشته می‌شود، بنابراین خروجی JSON فرمان همچنان قابل parse باقی می‌ماند.

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

پیش از رفتن سراغ یک پروفایلر CPU، از این برای بررسی چرخه عمر Plugin استفاده کنید.
اگر فرمان از یک checkout منبع اجرا می‌شود، ترجیحا پس از `pnpm build` زمان اجرای ساخته‌شده
را با `node dist/entry.js ...` اندازه بگیرید؛ `pnpm openclaw ...` سربار اجراکننده منبع
را نیز اندازه می‌گیرد.

## راه‌اندازی CLI و پروفایل‌گیری فرمان

وقتی یک فرمان کند به نظر می‌رسد، از benchmark راه‌اندازی ثبت‌شده در مخزن استفاده کنید:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

برای پروفایل‌گیری موردی از طریق اجراکننده معمول منبع،
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` را تنظیم کنید:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

اجراکننده منبع فلگ‌های پروفایل CPU در Node را اضافه می‌کند و برای فرمان یک
`.cpuprofile` می‌نویسد. پیش از افزودن instrument کردن موقت به کد فرمان، از این استفاده کنید.

برای توقف‌های راه‌اندازی که شبیه کارهای همگام سیستم فایل یا بارگذار ماژول هستند،
فلگ ردگیری I/O همگام Node را از طریق اجراکننده منبع اضافه کنید:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` این فلگ را به‌صورت پیش‌فرض برای فرزند Gateway تحت watch غیرفعال
می‌گذارد. وقتی صراحتا خروجی ردگیری I/O همگام Node را در حالت watch می‌خواهید،
`OPENCLAW_TRACE_SYNC_IO=1` را تنظیم کنید.

## حالت watch در Gateway

برای تکرار سریع، gateway را زیر file watcher اجرا کنید:

```bash
pnpm gateway:watch
```

به‌صورت پیش‌فرض، این کار یک نشست tmux با نام `openclaw-gateway-watch-main`
(یا یک گونه ویژه profile/port مانند `openclaw-gateway-watch-dev-19001`) را شروع
یا بازراه‌اندازی می‌کند و از ترمینال‌های تعاملی به‌صورت خودکار به آن متصل می‌شود.
پوسته‌های غیرتعاملی، CI، و فراخوانی‌های exec عامل جدا باقی می‌مانند و به‌جایش
دستورالعمل اتصال را چاپ می‌کنند. هر وقت لازم بود دستی متصل شوید:

```bash
tmux attach -t openclaw-gateway-watch-main
```

pane مربوط به tmux، watcher خام را اجرا می‌کند:

```bash
node scripts/watch-node.mjs gateway --force
```

وقتی tmux مطلوب نیست، از حالت foreground استفاده کنید:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

برای غیرفعال کردن اتصال خودکار در حالی که مدیریت tmux حفظ می‌شود:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

هنگام عیب‌یابی hotspotهای راه‌اندازی/زمان اجرا، زمان CPU مربوط به Gateway تحت watch را پروفایل کنید:

```bash
pnpm gateway:watch --benchmark
```

wrapper مربوط به watch پیش از فراخوانی Gateway، `--benchmark` را مصرف می‌کند و زیر
`.artifacts/gateway-watch-profiles/` به‌ازای هر خروج فرزند Gateway یک فایل V8
`.cpuprofile` می‌نویسد. برای flush کردن پروفایل فعلی، gateway تحت watch را متوقف یا
بازراه‌اندازی کنید، سپس آن را با Chrome DevTools یا Speedscope باز کنید:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

وقتی پروفایل‌ها را در جای دیگری می‌خواهید، از `--benchmark-dir <path>` استفاده کنید.
وقتی می‌خواهید فرزند benchmark شده پاک‌سازی پیش‌فرض پورت با `--force` را رد کند و
اگر پورت Gateway از قبل در حال استفاده است سریع fail شود، از `--benchmark-no-force`
استفاده کنید.
حالت benchmark به‌صورت پیش‌فرض spam ردگیری sync-I/O را suppress می‌کند. وقتی صراحتا
هم پروفایل‌های CPU و هم stack traceهای sync-I/O در Node را می‌خواهید،
`OPENCLAW_TRACE_SYNC_IO=1` را همراه با `--benchmark` تنظیم کنید. در حالت benchmark،
آن بلوک‌های ردگیری در `gateway-watch-output.log` زیر پوشه benchmark نوشته می‌شوند و
از pane ترمینال فیلتر می‌شوند؛ logهای عادی Gateway همچنان قابل مشاهده می‌مانند.

wrapper مربوط به tmux selectorهای رایج و غیرمحرمانه زمان اجرا مانند
`OPENCLAW_PROFILE`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`، و `OPENCLAW_SKIP_CHANNELS` را به pane منتقل می‌کند.
credentialهای provider را در profile/config عادی خود قرار دهید، یا برای secretهای
موقت و موردی از حالت raw foreground استفاده کنید.
اگر Gateway تحت watch هنگام راه‌اندازی خارج شود، watcher یک بار
`openclaw doctor --fix --non-interactive` را اجرا می‌کند و فرزند Gateway را
بازراه‌اندازی می‌کند. وقتی failure اصلی راه‌اندازی را بدون گذر تعمیر فقط مخصوص توسعه
می‌خواهید، از `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` استفاده کنید.
pane مدیریت‌شده tmux همچنین برای خوانایی به‌صورت پیش‌فرض logهای رنگی Gateway دارد؛
برای غیرفعال کردن خروجی ANSI، هنگام شروع `pnpm gateway:watch` مقدار `FORCE_COLOR=0`
را تنظیم کنید.

watcher با تغییر فایل‌های مرتبط با build زیر `src/`، فایل‌های منبع extension،
فراداده `package.json` و `openclaw.plugin.json` مربوط به extension، `tsconfig.json`,
`package.json`، و `tsdown.config.ts` بازراه‌اندازی می‌شود. تغییرات فراداده extension
بدون اجبار به rebuild با `tsdown`، gateway را بازراه‌اندازی می‌کند؛ تغییرات منبع و
پیکربندی همچنان ابتدا `dist` را rebuild می‌کنند.

هر فلگ CLI مربوط به gateway را پس از `gateway:watch` اضافه کنید تا در هر بازراه‌اندازی
عبور داده شود. اجرای دوباره همان فرمان watch، pane نام‌گذاری‌شده tmux را دوباره spawn
می‌کند، و watcher خام همچنان lock تک-watcher خود را نگه می‌دارد تا parentهای watcher
تکراری به‌جای انباشته شدن، جایگزین شوند.

## profile توسعه + gateway توسعه (`--dev`)

از profile توسعه برای جدا کردن state و بالا آوردن یک setup امن و دورریختنی برای
عیب‌یابی استفاده کنید. **دو** فلگ `--dev` وجود دارد:

- **`--dev` سراسری (profile):** state را زیر `~/.openclaw-dev` جدا می‌کند و
  پورت پیش‌فرض gateway را روی `19001` می‌گذارد (پورت‌های مشتق‌شده نیز همراه آن جابه‌جا می‌شوند).
- **`gateway --dev`: به Gateway می‌گوید در صورت نبودن، config + workspace پیش‌فرض
  را خودکار ایجاد کند** (و BOOTSTRAP.md را رد کند).

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

2. **bootstrap توسعه** (`gateway --dev`)
   - اگر config وجود نداشته باشد، یک config حداقلی می‌نویسد (`gateway.mode=local`، اتصال به loopback).
   - `agent.workspace` را روی workspace توسعه تنظیم می‌کند.
   - `agent.skipBootstrap=true` را تنظیم می‌کند (بدون BOOTSTRAP.md).
   - اگر فایل‌های workspace وجود نداشته باشند، آن‌ها را seed می‌کند:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - identity پیش‌فرض: **C3-PO** (protocol droid).
   - providerهای channel را در حالت توسعه رد می‌کند (`OPENCLAW_SKIP_CHANNELS=1`).

جریان reset (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک فلگ profile **سراسری** است و بعضی runnerها آن را مصرف می‌کنند. اگر لازم است آن را صریح بنویسید، از فرم env var استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`، config، credentialها، sessionها، و workspace توسعه را پاک می‌کند (با استفاده از
`trash`، نه `rm`) و سپس setup پیش‌فرض توسعه را دوباره ایجاد می‌کند.

<Tip>
اگر یک gateway غیرتوسعه از قبل در حال اجراست (launchd یا systemd)، ابتدا آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## ثبت stream خام (OpenClaw)

OpenClaw می‌تواند **stream خام assistant** را پیش از هرگونه فیلتر/قالب‌بندی ثبت کند.
این بهترین راه برای دیدن این است که آیا reasoning به‌صورت deltaهای متن ساده می‌رسد
(یا به‌صورت بلوک‌های جداگانه thinking).

فعال‌سازی از طریق CLI:

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

## ثبت chunk خام سازگار با OpenAI

برای گرفتن **chunkهای خام سازگار با OpenAI** پیش از اینکه به blockها parse شوند،
logger transport را فعال کنید:

```bash
OPENCLAW_RAW_STREAM=1
```

مسیر اختیاری:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

فایل پیش‌فرض:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## نکات ایمنی

- logهای stream خام می‌توانند شامل promptهای کامل، خروجی ابزار، و داده‌های کاربر باشند.
- logها را محلی نگه دارید و پس از عیب‌یابی حذف کنید.
- اگر logها را به اشتراک می‌گذارید، ابتدا secretها و PII را scrub کنید.

## عیب‌یابی در VSCode

برای فعال کردن عیب‌یابی در IDEهای مبتنی بر VSCode، source mapها لازم هستند، چون بسیاری از فایل‌های تولیدشده در بخشی از فرایند build با نام‌های hash شده تمام می‌شوند. پیکربندی‌های `launch.json` موجود سرویس Gateway را هدف می‌گیرند، اما می‌توان آن‌ها را به‌سرعت برای اهداف دیگر سازگار کرد:

1. **Rebuild and Debug Gateway** - سرویس Gateway را پس از ایجاد build جدید عیب‌یابی می‌کند
2. **Debug Gateway** - سرویس Gateway مربوط به build از پیش موجود را عیب‌یابی می‌کند

### راه‌اندازی

پیکربندی پیش‌فرض **Rebuild and Debug Gateway** همه‌چیز را همراه دارد؛ این پیکربندی به‌صورت خودکار پوشه `/dist` را حذف می‌کند و پروژه را با عیب‌یابی فعال rebuild می‌کند:

1. پنل **Run and Debug** را از Activity Bar باز کنید یا `Ctrl`+`Shift`+`D` را فشار دهید
2. در IDE، مطمئن شوید **Rebuild and Debug Gateway** در فهرست کشویی پیکربندی انتخاب شده است و سپس دکمه **Start Debugging** را فشار دهید

در حالت جایگزین - اگر ترجیح می‌دهید فرایندهای build و عیب‌یابی را دستی مدیریت کنید:

1. یک ترمینال باز کنید و source mapها را فعال کنید:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. در همان ترمینال، پروژه را rebuild کنید: `pnpm clean:dist && pnpm build`
3. در IDE، گزینه **Debug Gateway** را در فهرست کشویی پیکربندی **Run and Debug** انتخاب کنید و سپس دکمه **Start Debugging** را فشار دهید

اکنون می‌توانید در فایل‌های منبع TypeScript خود (پوشه `src/`) breakpoint تنظیم کنید و debugger از طریق source mapها، breakpointها را به‌درستی به JavaScript کامپایل‌شده نگاشت می‌کند. می‌توانید متغیرها را inspect کنید، مرحله‌به‌مرحله از کد عبور کنید، و call stackها را مطابق انتظار بررسی کنید.

### نکات

- اگر از گزینه **"Rebuild and Debug Gateway"** استفاده می‌کنید - هر بار که debugger راه‌اندازی می‌شود، پوشه `/dist` را کامل حذف می‌کند و پیش از شروع Gateway یک `pnpm build` کامل با source mapهای فعال اجرا می‌کند
- اگر از گزینه **"Debug Gateway"** استفاده می‌کنید - نشست‌های عیب‌یابی را می‌توان هر زمان بدون اثر گذاشتن بر پوشه `/dist` شروع و متوقف کرد، اما باید برای فعال کردن عیب‌یابی و مدیریت چرخه build از یک فرایند ترمینال جداگانه استفاده کنید
- تنظیمات `launch.json` مربوط به `args` را برای عیب‌یابی بخش‌های دیگر پروژه تغییر دهید
- اگر لازم است برای کارهای دیگر از CLI ساخته‌شده OpenClaw استفاده کنید (مثلا `dashboard --no-open` اگر نشست عیب‌یابی شما یک auth token جدید spawn می‌کند)، می‌توانید آن را در ترمینال دیگری به‌صورت `node ./openclaw.mjs` اجرا کنید یا یک alias پوسته مانند `alias openclaw-build="node $(pwd)/openclaw.mjs"` بسازید

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
