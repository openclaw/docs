---
read_when:
    - باید خروجی خام مدل را برای نشت فرایند استدلال بررسی کنید
    - می‌خواهید هنگام توسعهٔ تکرارشونده، Gateway را در حالت نظارت اجرا کنید
    - به یک گردش‌کار تکرارپذیر برای اشکال‌زدایی نیاز دارید
summary: 'ابزارهای اشکال‌زدایی: حالت پایش، جریان‌های خام مدل و ردیابی نشت استدلال'
title: اشکال‌زدایی
x-i18n:
    generated_at: "2026-07-12T10:08:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

ابزارهای کمکی اشکال‌زدایی برای خروجی جریانی، تکرارهای Gateway و پروفایل‌گیری راه‌اندازی.

## بازنویسی‌های اشکال‌زدایی زمان اجرا

`/debug` بازنویسی‌های پیکربندی **فقط برای زمان اجرا** را تنظیم می‌کند (در حافظه، نه روی دیسک). به‌طور پیش‌فرض غیرفعال است؛ با `commands.debug: true` آن را فعال کنید.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` همهٔ بازنویسی‌ها را پاک می‌کند و به پیکربندی روی دیسک بازمی‌گردد.

## خروجی ردیابی نشست

`/trace` خطوط ردیابی/اشکال‌زدایی متعلق به Plugin را برای یک نشست، بدون فعال‌کردن حالت کاملاً پرجزئیات، نمایش می‌دهد. از آن برای عیب‌یابی Plugin، مانند خلاصه‌های اشکال‌زدایی Active Memory، استفاده کنید؛ برای خروجی عادی وضعیت/ابزار از `/verbose` استفاده کنید.

```text
/trace
/trace on
/trace off
```

## ردیابی چرخهٔ حیات Plugin

برای مشاهدهٔ تفکیک مرحله‌به‌مرحلهٔ فرادادهٔ Plugin، کشف، رجیستری، آینهٔ زمان اجرا، تغییر پیکربندی و عملیات نوسازی، `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` را تنظیم کنید. خروجی در stderr نوشته می‌شود تا خروجی JSON فرمان همچنان قابل تجزیه باقی بماند.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

پیش از استفاده از پروفایلر CPU، از این قابلیت استفاده کنید. در یک نسخهٔ دریافت‌شده از منبع، پس از `pnpm build` زمان اجرای ساخته‌شده را با `node dist/entry.js ...` اندازه‌گیری کنید؛ `pnpm openclaw ...` سربار اجراکنندهٔ کد منبع را نیز اندازه‌گیری می‌کند.

## پروفایل‌گیری راه‌اندازی و فرمان CLI

بنچمارک‌های راه‌اندازی ثبت‌شده در مخزن:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

برای پروفایل‌گیری موردی از طریق اجراکنندهٔ عادی کد منبع، `OPENCLAW_RUN_NODE_CPU_PROF_DIR` را تنظیم کنید:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

اجراکنندهٔ کد منبع پرچم‌های پروفایل CPU متعلق به Node را اضافه می‌کند و برای فرمان یک فایل `.cpuprofile` می‌نویسد. پیش از افزودن ابزارگذاری موقت به کد فرمان، از این روش استفاده کنید.

برای توقف‌های راه‌اندازی که شبیه عملیات همگام سامانهٔ فایل یا بارگذار ماژول هستند، پرچم ردیابی ورودی/خروجی همگام Node را از طریق اجراکنندهٔ کد منبع اضافه کنید:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` این پرچم را به‌طور پیش‌فرض برای فرایند فرزند Gateway تحت نظارت غیرفعال نگه می‌دارد؛ اگر در حالت نظارت نیز خروجی ردیابی ورودی/خروجی همگام را می‌خواهید، `OPENCLAW_TRACE_SYNC_IO=1` را تنظیم کنید.

## حالت نظارت Gateway

```bash
pnpm gateway:watch
```

این فرمان به‌طور پیش‌فرض یک نشست tmux با نام `openclaw-gateway-watch-<profile>` (برای مثال `openclaw-gateway-watch-main`) را راه‌اندازی یا بازراه‌اندازی می‌کند. پسوند پورتی مانند `openclaw-gateway-watch-dev-19001` تنها زمانی اضافه می‌شود که `OPENCLAW_GATEWAY_PORT` با پورت پیش‌فرض `18789` تفاوت داشته باشد. از ترمینال‌های تعاملی به‌طور خودکار متصل می‌شود؛ پوسته‌های غیرتعاملی، CI و فراخوانی‌های اجرای عامل جدا باقی می‌مانند و به‌جای آن دستورالعمل اتصال را چاپ می‌کنند:

```bash
tmux attach -t openclaw-gateway-watch-main
```

پنجرهٔ tmux ناظر خام را اجرا می‌کند:

```bash
node scripts/watch-node.mjs gateway --force
```

پیش از نظارت بر همان پورت، سرویس نصب‌شدهٔ Gateway را متوقف کنید:

```bash
pnpm openclaw gateway stop
```

گزینهٔ `--force` ناظر، شنوندهٔ فعلی را پاک می‌کند، اما یک سرویس تحت سرپرستی را غیرفعال نمی‌کند. در غیر این صورت، یک سرویس launchd،‏ systemd یا Scheduled Task می‌تواند دوباره راه‌اندازی شود و جای Gateway تحت نظارت را بگیرد.

حالت پیش‌زمینه بدون tmux:

```bash
pnpm gateway:watch:raw
# یا
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

مدیریت tmux را حفظ کنید، اما اتصال خودکار را غیرفعال کنید:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

هنگام اشکال‌زدایی نقاط داغ راه‌اندازی/زمان اجرا، زمان CPU مربوط به Gateway تحت نظارت را پروفایل‌گیری کنید:

```bash
pnpm gateway:watch --benchmark
```

پوشش نظارت، پیش از فراخوانی Gateway گزینهٔ `--benchmark` را مصرف می‌کند و به‌ازای هر خروج فرایند فرزند Gateway، یک فایل V8 با پسوند `.cpuprofile` در `.artifacts/gateway-watch-profiles/` می‌نویسد. برای ثبت پروفایل فعلی، Gateway تحت نظارت را متوقف یا بازراه‌اندازی کنید، سپس آن را با Chrome DevTools یا Speedscope باز کنید:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: پروفایل‌ها را در محل دیگری بنویسید.
- `--benchmark-no-force`: پاک‌سازی پیش‌فرض پورت با `--force` را نادیده بگیرید و اگر پورت Gateway از قبل در حال استفاده است، سریعاً با خطا متوقف شوید.

حالت بنچمارک به‌طور پیش‌فرض ازدحام خروجی ردیابی ورودی/خروجی همگام را سرکوب می‌کند. برای دریافت هم‌زمان پروفایل‌های CPU و رد پشته‌های ورودی/خروجی همگام، `OPENCLAW_TRACE_SYNC_IO=1` را همراه `--benchmark` تنظیم کنید؛ در حالت بنچمارک، این بلوک‌های ردیابی در فایل `gateway-watch-output.log` داخل پوشهٔ بنچمارک نوشته می‌شوند (و از پنجرهٔ ترمینال فیلتر می‌شوند)، درحالی‌که گزارش‌های عادی Gateway قابل مشاهده باقی می‌مانند.

پوشش tmux انتخابگرهای رایج و غیرمحرمانهٔ زمان اجرا، از جمله `OPENCLAW_PROFILE`،‏ `OPENCLAW_CONFIG_PATH`،‏ `OPENCLAW_STATE_DIR`،‏ `OPENCLAW_GATEWAY_PORT` و `OPENCLAW_SKIP_CHANNELS` را به پنجره منتقل می‌کند. اطلاعات احراز هویت ارائه‌دهنده را در نمایه/پیکربندی عادی خود قرار دهید، یا برای اسرار موقت و موردی از حالت خام پیش‌زمینه استفاده کنید.

اگر Gateway تحت نظارت هنگام راه‌اندازی خارج شود، ناظر یک‌بار `openclaw doctor --fix --non-interactive` را اجرا می‌کند و فرایند فرزند Gateway را بازراه‌اندازی می‌کند. برای مشاهدهٔ خطای اصلی راه‌اندازی بدون اجرای مرحلهٔ ترمیم ویژهٔ توسعه، `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` را تنظیم کنید.

پنجرهٔ مدیریت‌شدهٔ tmux به‌طور پیش‌فرض گزارش‌های رنگی Gateway را نمایش می‌دهد؛ برای غیرفعال‌کردن خروجی ANSI، هنگام اجرای `pnpm gateway:watch` مقدار `FORCE_COLOR=0` را تنظیم کنید.

ناظر با تغییر فایل‌های مرتبط با ساخت در `src/`، فایل‌های منبع افزونه‌ها، فرادادهٔ `package.json` و `openclaw.plugin.json` افزونه‌ها، `tsconfig.json`،‏ `package.json` و `tsdown.config.ts` بازراه‌اندازی می‌شود. تغییرات فرادادهٔ افزونه، Gateway را بدون اجبار به ساخت مجدد بازراه‌اندازی می‌کند؛ تغییرات منبع و پیکربندی همچنان ابتدا `dist` را دوباره می‌سازند.

پرچم‌های CLI مربوط به Gateway را پس از `gateway:watch` اضافه کنید تا در هر بازراه‌اندازی منتقل شوند. اجرای دوبارهٔ همان فرمان نظارت، پنجرهٔ نام‌گذاری‌شدهٔ tmux را دوباره ایجاد می‌کند؛ ناظر خام با قفل تک‌ناظری، ناظرهای والد تکراری را به‌جای انباشته‌شدن جایگزین می‌کند.

## نمایهٔ توسعه + Gateway توسعه (`--dev`)

دو پرچم `--dev` **مجزا** وجود دارد:

- **`--dev` سراسری (نمایه):** وضعیت را در `~/.openclaw-dev` ایزوله می‌کند و پورت Gateway را به‌طور پیش‌فرض روی `19001` قرار می‌دهد (پورت‌های مشتق‌شده نیز همراه آن تغییر می‌کنند).
- **`gateway --dev`:** به Gateway اعلام می‌کند که در صورت نبودن پیکربندی و فضای کاری پیش‌فرض، آن‌ها را به‌طور خودکار ایجاد کند (و راه‌اندازی اولیه را نادیده بگیرد).

روند پیشنهادی (نمایهٔ توسعه + راه‌اندازی اولیهٔ توسعه):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

بدون نصب سراسری، CLI را از طریق `pnpm openclaw ...` اجرا کنید.

این فرایند کارهای زیر را انجام می‌دهد:

1. **ایزوله‌سازی نمایه** (`--dev` سراسری)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (پورت‌های مرورگر/بوم نیز متناسب با آن تغییر می‌کنند)

2. **راه‌اندازی اولیهٔ توسعه** (`gateway --dev`)
   - در صورت نبودن پیکربندی، یک پیکربندی حداقلی می‌نویسد (`gateway.mode=local`، اتصال به local loopback).
   - `agents.defaults.workspace` را روی فضای کاری توسعه و `agents.defaults.skipBootstrap=true` را تنظیم می‌کند.
   - در صورت نبودن فایل‌های فضای کاری، آن‌ها را ایجاد می‌کند: `AGENTS.md`،‏ `SOUL.md`،‏ `TOOLS.md`،‏ `IDENTITY.md`،‏ `USER.md`.
   - هویت پیش‌فرض: **C3-PO** (دروید پروتکل).
   - `pnpm gateway:dev` همچنین برای نادیده‌گرفتن ارائه‌دهندگان کانال، `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کند.

روند بازنشانی (شروع تازه):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` یک پرچم **سراسری** نمایه است و برخی اجراکننده‌ها آن را مصرف می‌کنند. اگر لازم است آن را صریحاً مشخص کنید، از شکل متغیر محیطی استفاده کنید:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` پیکربندی، اطلاعات احراز هویت، نشست‌ها و فضای کاری توسعه را پاک می‌کند (به سطل زباله منتقل می‌شوند، نه اینکه حذف شوند)، سپس تنظیمات پیش‌فرض توسعه را دوباره ایجاد می‌کند.

<Tip>
اگر یک Gateway غیرتوسعه‌ای از قبل در حال اجرا است (launchd یا systemd)، ابتدا آن را متوقف کنید:

```bash
openclaw gateway stop
```

</Tip>

## ثبت جریان خام

OpenClaw می‌تواند **جریان خام دستیار** را پیش از هرگونه فیلترکردن/قالب‌بندی ثبت کند. این بهترین راه برای بررسی این موضوع است که آیا استدلال به‌شکل قطعه‌های متن ساده دریافت می‌شود یا به‌صورت بلوک‌های فکری جداگانه.

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

فایل پیش‌فرض: `~/.openclaw/logs/raw-stream.jsonl`

## نکات ایمنی

- گزارش‌های جریان خام می‌توانند شامل اعلان‌های کامل، خروجی ابزار و داده‌های کاربر باشند.
- گزارش‌ها را محلی نگه دارید و پس از اشکال‌زدایی حذف کنید.
- اگر گزارش‌ها را به اشتراک می‌گذارید، ابتدا اسرار و اطلاعات قابل شناسایی شخصی را پاک‌سازی کنید.

## اشکال‌زدایی در VSCode

نقشه‌های منبع ضروری هستند، زیرا فرایند ساخت نام فایل‌های تولیدشده را هش می‌کند. فایل `launch.json` موجود، سرویس Gateway را هدف قرار می‌دهد:

1. **Rebuild and Debug Gateway** - پیش از راه‌اندازی Gateway، پوشهٔ `/dist` را حذف می‌کند و با فعال‌بودن اشکال‌زدایی دوباره می‌سازد.
2. **Debug Gateway** - یک ساخت موجود را بدون تغییر `/dist` اشکال‌زدایی می‌کند.

### راه‌اندازی

1. **Run and Debug** را باز کنید (از Activity Bar یا با `Ctrl`+`Shift`+`D`).
2. **Rebuild and Debug Gateway** را انتخاب کنید و **Start Debugging** را فشار دهید.

برای مدیریت دستی چرخهٔ ساخت/اشکال‌زدایی:

1. نقشه‌های منبع را در یک ترمینال فعال کنید:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. دوباره بسازید: `pnpm clean:dist && pnpm build`
3. **Debug Gateway** را انتخاب کنید و **Start Debugging** را فشار دهید.

در فایل‌های TypeScript داخل `src/` نقطهٔ توقف تنظیم کنید؛ اشکال‌زدا با استفاده از نقشه‌های منبع، آن‌ها را به JavaScript کامپایل‌شده نگاشت می‌کند.

### نکات

- **Rebuild and Debug Gateway** در هر اجرا `/dist` را حذف می‌کند و یک `pnpm build` کامل را با نقشه‌های منبع اجرا می‌کند.
- **Debug Gateway** می‌تواند بدون تأثیر بر `/dist` شروع یا متوقف شود، اما چرخهٔ ساخت را در یک ترمینال جداگانه مدیریت می‌کنید.
- برای اشکال‌زدایی زیرفرمان‌های دیگر CLI، مقدار `args` در `launch.json` را ویرایش کنید.
- برای استفاده از CLI ساخته‌شده در کارهای دیگر (برای مثال `dashboard --no-open`، اگر نشست اشکال‌زدایی شما یک توکن احراز هویت جدید ایجاد می‌کند)، آن را از ترمینالی دیگر اجرا کنید: `node ./openclaw.mjs` یا نام مستعاری مانند `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## مرتبط

- [عیب‌یابی](/fa/help/troubleshooting)
- [پرسش‌های متداول](/fa/help/faq)
