---
read_when:
    - آزمایش فرایندهای آغاز به کار یا راه‌اندازی با یک Plugin بسته‌بندی‌شده به‌صورت محلی
    - اعتبارسنجی یک بستهٔ Plugin پیش از انتشار آن
    - جایگزینی نصب خودکار Plugin با یک مصنوع آزمایشی
sidebarTitle: Install overrides
summary: لغوهای بسته‌بندی‌شدهٔ Plugin را با جریان‌های نصب در زمان راه‌اندازی آزمایش کنید
title: بازنویسی‌های نصب Plugin
x-i18n:
    generated_at: "2026-07-12T10:27:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

لغوهای نصب Plugin به نگه‌دارندگان اجازه می‌دهند نصب Plugin در زمان راه‌اندازی را به‌جای کاتالوگ، بستهٔ همراه، یا منبع پیش‌فرض npm، به یک بستهٔ مشخص npm یا فایل tarball محلی ساخته‌شده با npm pack هدایت کنند. این لغوها فقط برای E2E و اعتبارسنجی بسته‌ها وجود دارند؛ کاربران عادی Pluginها را با [`openclaw plugins install`](/fa/cli/plugins) نصب می‌کنند.

<Warning>
لغوها کد Plugin را از منبعی که ارائه می‌کنید اجرا می‌کنند. از آن‌ها فقط در یک دایرکتوری وضعیت ایزوله یا دستگاه آزمایشی یک‌بارمصرف استفاده کنید.
</Warning>

## محیط

لغوها غیرفعال هستند، مگر اینکه هر دو متغیر تنظیم شده باشند:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

نگاشت لغوها یک JSON با کلید شناسهٔ Plugin است. مقادیر از موارد زیر پشتیبانی می‌کنند:

| پیشوند                | منبع                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | بسته‌های رجیستری، نسخه‌های دقیق، یا برچسب‌ها                                                       |
| `npm-pack:<path.tgz>` | فایل‌های tarball محلی تولیدشده توسط `npm pack`؛ مسیرهای نسبی از دایرکتوری کاری فعلی تفکیک می‌شوند |

## رفتار

هنگامی که یک جریان زمان راه‌اندازی Pluginی را نصب می‌کند که شناسه‌اش در نگاشت وجود دارد، OpenClaw به‌جای کاتالوگ، بستهٔ همراه، یا منبع پیش‌فرض npm از منبع لغو استفاده می‌کند. این رفتار برای پذیرش اولیه و هر جریان دیگری که از نصب‌کنندهٔ مشترک Plugin در زمان راه‌اندازی استفاده می‌کند، اعمال می‌شود.

- لغوها همچنان شناسهٔ مورد انتظار Plugin را اعمال می‌کنند: فایل tarball نگاشت‌شده به `codex` باید Pluginی را نصب کند که شناسهٔ مانیفست آن `codex` است.
- لغوها وضعیت رسمی منبع مورد اعتماد را به ارث نمی‌برند. حتی وقتی ورودی کاتالوگ معمولاً نمایانگر بسته‌ای متعلق به OpenClaw است، لغو به‌عنوان ورودی آزمایشی ارائه‌شده توسط اپراتور در نظر گرفته می‌شود.
- فایل‌های `.env` فضای کاری نمی‌توانند لغوهای نصب را فعال کنند؛ هر دو متغیر محیطی در فهرست مسدودشدهٔ dotenv فضای کاری قرار دارند. آن‌ها را در پوستهٔ مورد اعتماد، کار CI، یا فرمان آزمایش راه‌دوری که OpenClaw را اجرا می‌کند، تنظیم کنید.

## E2E بسته

از یک دایرکتوری وضعیت ایزوله استفاده کنید تا نصب بسته‌ها و رکوردهای نصب به وضعیت عادی OpenClaw شما دست نزنند:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

بستهٔ نصب‌شده را در دایرکتوری وضعیت تأیید کنید:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

برای E2E زندهٔ ارائه‌دهنده، کلید واقعی API را پیش از اجرای فرمان آزمایش از یک پوستهٔ مورد اعتماد یا راز CI بارگذاری کنید. کلیدها را چاپ نکنید؛ فقط منبع و موجود بودن کلید را گزارش دهید.
