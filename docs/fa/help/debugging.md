---
read_when:
    - باید خروجی خام مدل را برای نشت استدلال بررسی کنید
    - می‌خواهید هنگام تکرار و اعمال تغییرات، Gateway را در حالت پایش اجرا کنید
    - به یک گردش کار تکرارپذیر برای اشکال‌زدایی نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل، و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-05-10T19:46:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

راهنماهای اشکال‌زدایی برای خروجی جریانی، به‌ویژه وقتی یک ارائه‌دهنده استدلال را با متن عادی ترکیب می‌کند.

## بازنویسی‌های اشکال‌زدایی زمان اجرا

از `/debug` در چت استفاده کنید تا بازنویسی‌های پیکربندی **فقط زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک).
`/debug` به‌طور پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعالش کنید.
این زمانی کاربردی است که لازم است تنظیمات کم‌استفاده را بدون ویرایش `openclaw.json` تغییر دهید.

مثال‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` همه بازنویسی‌ها را پاک می‌کند و به پیکربندی روی دیسک برمی‌گردد.

## خروجی ردگیری نشست

وقتی می‌خواهید خط‌های ردگیری/اشکال‌زدایی متعلق به Plugin را در یک نشست ببینید،
بدون اینکه حالت پرجزئیات کامل را روشن کنید، از `/trace` استفاده کنید.

مثال‌ها:

```text
/trace
/trace on
/trace off
```

از `/trace` برای عیب‌یابی‌های Plugin مانند خلاصه‌های اشکال‌زدایی Active Memory استفاده کنید.
برای خروجی معمول وضعیت/ابزار پرجزئیات همچنان از `/verbose` استفاده کنید، و برای بازنویسی‌های پیکربندی فقط زمان اجرا همچنان از
`/debug` استفاده کنید.

## ردگیری چرخهٔ حیات Plugin

وقتی فرمان‌های چرخهٔ حیات Plugin کند به نظر می‌رسند و به یک تفکیک مرحله‌ای داخلی برای فرادادهٔ Plugin، کشف، رجیستری،
آینهٔ زمان اجرا، تغییر پیکربندی، و کارهای تازه‌سازی نیاز دارید، از `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` استفاده کنید. ردگیری اختیاری است و در stderr نوشته می‌شود، بنابراین خروجی JSON فرمان همچنان قابل تجزیه می‌ماند.

مثال:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

نمونه خروجی:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

پیش از رفتن سراغ پروفایلر CPU، از این برای بررسی چرخهٔ حیات Plugin استفاده کنید.
اگر فرمان از یک checkout منبع اجرا می‌شود، ترجیحاً پس از `pnpm build` زمان اجرای ساخته‌شده را با
`node dist/entry.js ...` اندازه‌گیری کنید؛ `pnpm openclaw ...`
سربار اجراکنندهٔ منبع را نیز اندازه‌گیری می‌کند.

## پروفایل‌گیری راه‌اندازی CLI و فرمان‌ها

وقتی یک فرمان کند به نظر می‌رسد، از بنچمارک راه‌اندازی ثبت‌شده در مخزن استفاده کنید:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

برای پروفایل‌گیری موردی از مسیر اجراکنندهٔ منبع معمول، `OPENCLAW_RUN_NODE_CPU_PROF_DIR` را تنظیم کنید:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

اجراکنندهٔ منبع پرچم‌های پروفایل CPU مربوط به Node را اضافه می‌کند و برای فرمان یک `.cpuprofile` می‌نویسد.
پیش از افزودن ابزارگذاری موقت به کد فرمان، از این استفاده کنید.

برای توقف‌های راه‌اندازی که شبیه کار همگام فایل‌سیستم یا بارگذار ماژول هستند،
پرچم ردگیری I/O همگام Node را از طریق اجراکنندهٔ منبع اضافه کنید:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` این پرچم را به‌طور پیش‌فرض برای فرزند تحت‌نظر Gateway غیرفعال می‌گذارد.
وقتی صراحتاً خروجی ردگیری I/O همگام Node را در حالت watch می‌خواهید، `OPENCLAW_TRACE_SYNC_IO=1` را تنظیم کنید.

## حالت watch برای Gateway

برای تکرار سریع، Gateway را زیر نظر watcher فایل اجرا کنید:

```bash
pnpm gateway:watch
```

به‌طور پیش‌فرض، این کار یک نشست tmux با نام
`openclaw-gateway-watch-main` (یا گونه‌ای وابسته به پروفایل/درگاه مانند
`openclaw-gateway-watch-dev-19001`) را شروع یا بازراه‌اندازی می‌کند و از ترمینال‌های تعاملی به‌صورت خودکار متصل می‌شود.
پوسته‌های غیرتعاملی، CI، و فراخوانی‌های exec عامل جدا می‌مانند و به‌جای آن دستورالعمل اتصال را چاپ می‌کنند.
در صورت نیاز دستی متصل شوید:

```bash
tmux attach -t openclaw-gateway-watch-main
```

پنجرهٔ tmux watcher خام را اجرا می‌کند:

```bash
node scripts/watch-node.mjs gateway --force
```

وقتی tmux مطلوب نیست، از حالت پیش‌زمینه استفاده کنید:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

اتصال خودکار را غیرفعال کنید و مدیریت tmux را حفظ کنید:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

هنگام اشکال‌زدایی نقاط داغ راه‌اندازی/زمان اجرا، زمان CPU مربوط به Gateway تحت‌نظر را پروفایل کنید:

```bash
pnpm gateway:watch --benchmark
```

wrapper مربوط به watch، `--benchmark` را پیش از فراخوانی Gateway مصرف می‌کند و
به‌ازای هر خروج فرزند Gateway، یک `.cpuprofile` مربوط به V8 را زیر
`.artifacts/gateway-watch-profiles/` می‌نویسد. Gateway تحت‌نظر را متوقف یا بازراه‌اندازی کنید تا پروفایل فعلی flush شود، سپس آن را با Chrome DevTools یا Speedscope باز کنید:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

وقتی پروفایل‌ها را در جای دیگری می‌خواهید، از `--benchmark-dir <path>` استفاده کنید.
وقتی می‌خواهید فرزند بنچمارک‌شده پاک‌سازی پیش‌فرض درگاه با `--force` را رد کند و اگر درگاه Gateway از قبل در حال استفاده است سریع شکست بخورد، از `--benchmark-no-force` استفاده کنید.
حالت بنچمارک به‌طور پیش‌فرض هرزنامهٔ ردگیری sync-I/O را سرکوب می‌کند. وقتی صراحتاً هم پروفایل‌های CPU و هم stack traceهای sync-I/O در Node را می‌خواهید، `OPENCLAW_TRACE_SYNC_IO=1` را همراه با `--benchmark` تنظیم کنید. در حالت بنچمارک، آن بلوک‌های ردگیری در `gateway-watch-output.log` زیر دایرکتوری بنچمارک نوشته می‌شوند و از پنجرهٔ ترمینال فیلتر می‌شوند؛ لاگ‌های عادی Gateway همچنان دیده می‌شوند.

wrapper مربوط به tmux انتخاب‌گرهای رایج غیرمحرمانهٔ زمان اجرا مانند
`OPENCLAW_PROFILE`، `OPENCLAW_CONFIG_PATH`، `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`، و `OPENCLAW_SKIP_CHANNELS` را به پنجره منتقل می‌کند. اعتبارنامه‌های ارائه‌دهنده را در پروفایل/پیکربندی معمول خود قرار دهید، یا برای رازهای موقت موردی از حالت خام پیش‌زمینه استفاده کنید.
اگر Gateway تحت‌نظر هنگام راه‌اندازی خارج شود، watcher یک‌بار
`openclaw doctor --fix --non-interactive` را اجرا می‌کند و فرزند Gateway را بازراه‌اندازی می‌کند.
وقتی شکست راه‌اندازی اولیه را بدون گذر تعمیر فقط توسعه می‌خواهید، از `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` استفاده کنید.
پنجرهٔ مدیریت‌شدهٔ tmux نیز برای خوانایی به‌طور پیش‌فرض لاگ‌های رنگی Gateway را فعال می‌کند؛
برای غیرفعال‌کردن خروجی ANSI، هنگام شروع `pnpm gateway:watch` مقدار `FORCE_COLOR=0` را تنظیم کنید.

watcher با تغییر فایل‌های مرتبط با build زیر `src/`، فایل‌های منبع extension،
فرادادهٔ `package.json` و `openclaw.plugin.json` مربوط به extension، `tsconfig.json`,
`package.json`، و `tsdown.config.ts` بازراه‌اندازی می‌شود. تغییرات فرادادهٔ extension، gateway را بدون اجبار به rebuild با `tsdown` بازراه‌اندازی می‌کند؛ تغییرات منبع و پیکربندی همچنان ابتدا `dist` را rebuild می‌کنند.

هر پرچم CLI مربوط به gateway را پس از `gateway:watch` اضافه کنید تا در هر بازراه‌اندازی منتقل شود.
اجرای دوبارهٔ همان فرمان watch، پنجرهٔ tmux نام‌گذاری‌شده را دوباره spawn می‌کند، و watcher خام همچنان قفل تک-watcher خود را حفظ می‌کند تا والدهای watcher تکراری به‌جای انباشته‌شدن جایگزین شوند.

## پروفایل dev + Gateway dev (--dev)

از پروفایل dev برای جداسازی state و بالا آوردن یک چیدمان ایمن و دورریختنی برای اشکال‌زدایی استفاده کنید.
دو پرچم `--dev` وجود دارد:

- **`--dev` سراسری (پروفایل):** state را زیر `~/.openclaw-dev` جدا می‌کند و
  درگاه پیش‌فرض gateway را `19001` می‌گذارد (درگاه‌های مشتق‌شده همراه آن جابه‌جا می‌شوند).
- **`gateway --dev`: به Gateway می‌گوید در صورت نبود، یک پیکربندی پیش‌فرض +
  workspace** را خودکار بسازد (و BOOTSTRAP.md را رد کند).

جریان پیشنهادی (پروفایل dev + bootstrap dev):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas متناسب با آن جابه‌جا می‌شوند)

2. **bootstrap توسعه** (`gateway --dev`)
   - اگر موجود نباشد، یک پیکربندی حداقلی می‌نویسد (`gateway.mode=local`، bind روی loopback).
   - `agent.workspace` را روی workspace توسعه تنظیم می‌کند.
   - `agent.skipBootstrap=true` را تنظیم می‌کند (بدون BOOTSTRAP.md).
   - اگر فایل‌های workspace موجود نباشند، آن‌ها را seed می‌کند:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - هویت پیش‌فرض: **C3-PO** (protocol droid).
   - در حالت dev ارائه‌دهندگان channel را رد می‌کند (`OPENCLAW_SKIP_CHANNELS=1`).

جریان reset (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک پرچم پروفایل **سراسری** است و برخی runnerها آن را مصرف می‌کنند. اگر لازم است آن را صریح بنویسید، از شکل متغیر محیطی استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` پیکربندی، اعتبارنامه‌ها، نشست‌ها، و workspace توسعه را پاک می‌کند (با استفاده از
`trash`، نه `rm`) و سپس چیدمان پیش‌فرض dev را دوباره می‌سازد.

<Tip>
اگر یک gateway غیر-dev از قبل در حال اجراست (launchd یا systemd)، ابتدا آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## لاگ‌گیری stream خام (OpenClaw)

OpenClaw می‌تواند **stream خام assistant** را پیش از هرگونه فیلتر/قالب‌بندی لاگ کند.
این بهترین راه برای دیدن این است که آیا reasoning به‌صورت deltaهای متن ساده می‌رسد
(یا به‌صورت بلوک‌های thinking جداگانه).

از طریق CLI فعالش کنید:

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

> نکته: این فقط توسط فرایندهایی منتشر می‌شود که از ارائه‌دهندهٔ
> `openai-completions` متعلق به pi-mono استفاده می‌کنند.

## نکات ایمنی

- لاگ‌های stream خام می‌توانند شامل promptهای کامل، خروجی ابزار، و داده‌های کاربر باشند.
- لاگ‌ها را محلی نگه دارید و پس از اشکال‌زدایی حذفشان کنید.
- اگر لاگ‌ها را به اشتراک می‌گذارید، ابتدا رازها و PII را پاک‌سازی کنید.

## اشکال‌زدایی در VSCode

source mapها برای فعال‌کردن اشکال‌زدایی در IDEهای مبتنی بر VSCode لازم هستند، چون بسیاری از فایل‌های تولیدشده به‌عنوان بخشی از فرایند build در نهایت نام‌های hash‌شده می‌گیرند. پیکربندی‌های `launch.json` موجود سرویس Gateway را هدف می‌گیرند، اما می‌توان آن‌ها را سریعاً برای اهداف دیگر سازگار کرد:

1. **Rebuild and Debug Gateway** - سرویس Gateway را پس از ایجاد یک build جدید اشکال‌زدایی می‌کند
2. **Debug Gateway** - سرویس Gateway مربوط به یک build از پیش موجود را اشکال‌زدایی می‌کند

### راه‌اندازی

پیکربندی پیش‌فرض **Rebuild and Debug Gateway** همه‌چیز را همراه خود دارد؛ به‌طور خودکار پوشهٔ `/dist` را حذف می‌کند و پروژه را با اشکال‌زدایی فعال rebuild می‌کند:

1. پنل **Run and Debug** را از Activity Bar باز کنید یا `Ctrl`+`Shift`+`D` را فشار دهید
2. در IDE مطمئن شوید **Rebuild and Debug Gateway** در dropdown پیکربندی انتخاب شده است و سپس دکمهٔ **Start Debugging** را فشار دهید

یا اگر ترجیح می‌دهید فرایندهای build و اشکال‌زدایی را دستی مدیریت کنید:

1. یک ترمینال باز کنید و source mapها را فعال کنید:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. در همان ترمینال، پروژه را rebuild کنید: `pnpm clean:dist && pnpm build`
3. در IDE، گزینهٔ **Debug Gateway** را در dropdown پیکربندی **Run and Debug** انتخاب کنید و سپس دکمهٔ **Start Debugging** را فشار دهید

اکنون می‌توانید در فایل‌های منبع TypeScript خود (دایرکتوری `src/`) breakpoint تنظیم کنید و debugger، breakpointها را از طریق source mapها به‌درستی به JavaScript کامپایل‌شده نگاشت خواهد کرد. می‌توانید متغیرها را بررسی کنید، قدم‌به‌قدم از کد عبور کنید، و call stackها را همان‌طور که انتظار می‌رود بررسی کنید.

### یادداشت‌ها

- اگر از گزینهٔ **"Rebuild and Debug Gateway"** استفاده می‌کنید، هر بار که debugger اجرا شود، پوشهٔ `/dist` را کاملاً حذف می‌کند و پیش از شروع Gateway یک `pnpm build` کامل با source mapهای فعال اجرا می‌کند
- اگر از گزینهٔ **"Debug Gateway"** استفاده می‌کنید، نشست‌های اشکال‌زدایی را می‌توان هر زمان بدون اثر روی پوشهٔ `/dist` شروع و متوقف کرد، اما باید از یک فرایند ترمینال جداگانه هم برای فعال‌کردن اشکال‌زدایی و هم برای مدیریت چرخهٔ build استفاده کنید
- تنظیمات `launch.json` مربوط به `args` را تغییر دهید تا بخش‌های دیگر پروژه را اشکال‌زدایی کنید
- اگر لازم است از CLI ساخته‌شدهٔ OpenClaw برای کارهای دیگر استفاده کنید (مثلاً `dashboard --no-open` اگر نشست اشکال‌زدایی شما یک token احراز هویت جدید spawn می‌کند)، می‌توانید آن را در ترمینالی دیگر به‌صورت `node ./openclaw.mjs` اجرا کنید یا یک alias پوسته مانند `alias openclaw-build="node $(pwd)/openclaw.mjs"` بسازید

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
