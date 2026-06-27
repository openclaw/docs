---
read_when:
    - آزمودن جریان‌های ورود اولیه یا راه‌اندازی در برابر یک Plugin بسته‌بندی‌شده به‌صورت محلی
    - تأیید یک بستهٔ Plugin پیش از انتشار آن
    - جایگزینی نصب خودکار Plugin با یک آرتیفکت آزمایشی
sidebarTitle: Install overrides
summary: آزمودن بازنویسی‌های Plugin بسته‌بندی‌شده با جریان‌های نصب در زمان راه‌اندازی
title: بازنویسی‌های نصب Plugin
x-i18n:
    generated_at: "2026-06-27T18:17:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

بازنویسی‌های نصب Plugin به نگه‌دارندگان امکان می‌دهد نصب‌های Plugin در زمان راه‌اندازی را در برابر
یک بسته npm مشخص یا تاربال محلی `npm-pack` آزمایش کنند. این‌ها فقط برای E2E و
اعتبارسنجی بسته هستند. کاربران عادی باید Pluginها را با
[`openclaw plugins install`](/fa/cli/plugins) نصب کنند.

<Warning>
بازنویسی‌ها کد Plugin را از منبعی که ارائه می‌کنید اجرا می‌کنند. آن‌ها را فقط در یک
دایرکتوری وضعیت ایزوله یا ماشین آزمایشی دورریختنی استفاده کنید.
</Warning>

## محیط

بازنویسی‌ها غیرفعال هستند مگر اینکه هر دو متغیر تنظیم شده باشند:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

نقشه بازنویسی، JSON با کلیدهای شناسه Plugin است. مقادیر پشتیبانی می‌کنند از:

- `npm:<registry-spec>` برای بسته‌های رجیستری و نسخه‌ها یا برچسب‌های دقیق
- `npm-pack:<path.tgz>` برای تاربال‌های محلی تولیدشده با `npm pack`

مسیرهای نسبی `npm-pack:` از دایرکتوری کاری فعلی resolve می‌شوند.

## رفتار

وقتی یک جریان زمان راه‌اندازی درخواست نصب Pluginی را می‌دهد که شناسه‌اش در نقشه وجود دارد،
OpenClaw به‌جای منبع npm کاتالوگ، همراه‌شده، یا پیش‌فرض، از منبع بازنویسی استفاده می‌کند.
این برای راه‌اندازی اولیه و جریان‌های دیگری اعمال می‌شود که از نصب‌کننده مشترک Plugin
در زمان راه‌اندازی استفاده می‌کنند.

بازنویسی‌ها همچنان شناسه Plugin مورد انتظار را اعمال می‌کنند. تاربال نگاشت‌شده به `codex`
باید Pluginی را نصب کند که شناسه manifest آن `codex` است.

بازنویسی‌ها وضعیت رسمی منبع مورد اعتماد را به ارث نمی‌برند. حتی وقتی ورودی کاتالوگ
معمولاً نماینده بسته‌ای متعلق به OpenClaw باشد، بازنویسی به‌عنوان ورودی آزمایشی
ارائه‌شده توسط اپراتور در نظر گرفته می‌شود.

فایل‌های `.env` فضای کاری نمی‌توانند بازنویسی‌های نصب را فعال کنند. این متغیرها را در
shell مورد اعتماد، کار CI، یا فرمان آزمایش راه‌دوری که OpenClaw را اجرا می‌کند تنظیم کنید.

## E2E بسته

از یک دایرکتوری وضعیت ایزوله استفاده کنید تا نصب‌های بسته و رکوردهای نصب به وضعیت عادی
OpenClaw شما دست نزنند:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

بسته نصب‌شده را زیر دایرکتوری وضعیت تأیید کنید:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

برای E2E ارائه‌دهنده زنده، پیش از اجرای فرمان آزمایش، کلید API واقعی را از یک shell مورد اعتماد
یا secret در CI بارگذاری کنید. کلیدها را چاپ نکنید؛ فقط منبع و اینکه کلید موجود بوده یا نه
را گزارش دهید.
