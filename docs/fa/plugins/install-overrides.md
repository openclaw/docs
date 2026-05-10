---
read_when:
    - آزمایش جریان‌های راه‌اندازی اولیه یا پیکربندی در برابر یک Plugin بسته‌بندی‌شدهٔ محلی
    - اعتبارسنجی بسته Plugin پیش از انتشار آن
    - جایگزین کردن نصب خودکار Plugin با یک آرتیفکت آزمایشی
sidebarTitle: Install overrides
summary: بازنویسی‌های Plugin بسته‌بندی‌شده را با جریان‌های نصب در زمان راه‌اندازی آزمایش کنید
title: بازنویسی‌های نصب Plugin
x-i18n:
    generated_at: "2026-05-10T19:55:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

بازنویسی‌های نصب Plugin به نگه‌دارندگان اجازه می‌دهد نصب‌های Plugin در زمان راه‌اندازی را در برابر یک بسته npm مشخص یا tarball محلی ساخته‌شده با npm-pack آزمایش کنند. آن‌ها فقط برای اعتبارسنجی E2E و بسته هستند. کاربران عادی باید Pluginها را با
[`openclaw plugins install`](/fa/cli/plugins) نصب کنند.

<Warning>
بازنویسی‌ها کد Plugin را از منبعی که ارائه می‌کنید اجرا می‌کنند. آن‌ها را فقط در یک پوشهٔ وضعیت ایزوله یا ماشین آزمایشی دورریختنی استفاده کنید.
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

نقشهٔ بازنویسی JSON است که با شناسهٔ Plugin کلیدگذاری می‌شود. مقدارها از این موارد پشتیبانی می‌کنند:

- `npm:<registry-spec>` برای بسته‌های رجیستری و نسخه‌ها یا تگ‌های دقیق
- `npm-pack:<path.tgz>` برای tarballهای محلی تولیدشده با `npm pack`

مسیرهای نسبی `npm-pack:` از پوشهٔ کاری فعلی resolve می‌شوند.

## رفتار

وقتی یک جریان زمان راه‌اندازی درخواست نصب Pluginی را می‌دهد که شناسهٔ آن در نقشه وجود دارد، OpenClaw به‌جای منبع کاتالوگ، bundled، یا منبع پیش‌فرض npm، از منبع بازنویسی استفاده می‌کند. این موضوع برای onboarding و جریان‌های دیگری که از نصب‌کنندهٔ مشترک Plugin در زمان راه‌اندازی استفاده می‌کنند اعمال می‌شود.

بازنویسی‌ها همچنان شناسهٔ مورد انتظار Plugin را enforce می‌کنند. tarballای که به `codex` نگاشت شده است باید Pluginی را نصب کند که شناسهٔ manifest آن `codex` باشد.

بازنویسی‌ها وضعیت رسمی منبع مورد اعتماد را به ارث نمی‌برند. حتی وقتی ورودی کاتالوگ معمولاً نمایندهٔ یک بستهٔ متعلق به OpenClaw باشد، بازنویسی به‌عنوان ورودی آزمایشی ارائه‌شده توسط operator در نظر گرفته می‌شود.

فایل‌های `.env` فضای کاری نمی‌توانند بازنویسی‌های نصب را فعال کنند. این متغیرها را در shell مورد اعتماد، job مربوط به CI، یا فرمان آزمایش از راه دوری که OpenClaw را اجرا می‌کند تنظیم کنید.

## E2E بسته

از یک پوشهٔ وضعیت ایزوله استفاده کنید تا نصب‌های بسته و رکوردهای نصب به وضعیت عادی OpenClaw شما دست نزنند:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

بستهٔ نصب‌شده را زیر پوشهٔ وضعیت verify کنید:

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

برای E2E ارائه‌دهندهٔ زنده، کلید واقعی API را پیش از اجرای فرمان آزمایش از یک shell مورد اعتماد یا secret مربوط به CI source کنید. کلیدها را چاپ نکنید؛ فقط منبع و اینکه کلید وجود داشته است یا نه را گزارش کنید.
