---
read_when:
    - می‌خواهید بدانید npm shrinkwrap در یک انتشار OpenClaw به چه معناست
    - شما در حال بررسی فایل‌های قفل بسته‌ها، تغییرات وابستگی‌ها یا ریسک زنجیرهٔ تأمین هستید
    - شما در حال اعتبارسنجی بسته‌های npm ریشه یا Plugin پیش از انتشار هستید
summary: توضیح ساده و فنی دربارهٔ shrinkwrap در npm برای انتشارهای OpenClaw
title: قفل وابستگی‌های npm
x-i18n:
    generated_at: "2026-07-12T10:08:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

نسخه‌های دریافت‌شده از کد منبع OpenClaw از `pnpm-lock.yaml` استفاده می‌کنند. بسته‌های npm منتشرشدهٔ OpenClaw از `npm-shrinkwrap.json`، یعنی فایل قفل وابستگی قابل‌انتشار npm، استفاده می‌کنند تا نصب بسته‌ها از همان گراف وابستگی بررسی‌شده هنگام انتشار بهره ببرد.

## چرا اهمیت دارد

Shrinkwrap رسیدی برای درخت وابستگی‌ای است که همراه یک بستهٔ npm عرضه می‌شود: این فایل به npm می‌گوید دقیقاً کدام نسخه‌های وابستگی‌های گذرا را نصب کند.

| فایل                  | محل اهمیت                | مفهوم آن                          |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | نسخهٔ کد منبع OpenClaw   | گراف وابستگی نگه‌دارندگان         |
| `npm-shrinkwrap.json` | بستهٔ npm منتشرشده       | گراف نصب npm برای کاربران         |
| `package-lock.json`   | برنامه‌های محلی npm      | قرارداد انتشار OpenClaw نیست      |

برای انتشارهای OpenClaw، این یعنی:

- بستهٔ منتشرشده از npm نمی‌خواهد هنگام نصب یک گراف وابستگی تازه ایجاد کند؛
- تغییرات وابستگی‌ها قابل‌بازبینی هستند، زیرا در تفاوت‌های یک فایل قفل ثبت می‌شوند؛
- اعتبارسنجی انتشار همان گرافی را آزمایش می‌کند که کاربران نصب خواهند کرد؛
- موارد غیرمنتظره در اندازهٔ بسته یا وابستگی‌های بومی پیش از انتشار آشکار می‌شوند.

Shrinkwrap محیط ایزوله نیست. این فایل به‌تنهایی یک وابستگی را ایمن نمی‌کند و جایگزین جداسازی میزبان، `openclaw security audit`، منشأ بسته یا آزمون‌های دود نصب نمی‌شود.

OpenClaw یک Gateway، میزبان Plugin، مسیریاب مدل و محیط اجرای عامل است؛ بنابراین نصب پیش‌فرض بر زمان راه‌اندازی، فضای دیسک مصرفی، دریافت بسته‌های بومی و میزان مواجهه با زنجیرهٔ تأمین اثر می‌گذارد. Shrinkwrap یک مرز پایدار برای بازبینی انتشار فراهم می‌کند: بازبین‌ها جابه‌جایی وابستگی‌های گذرا را می‌بینند، اعتبارسنج‌ها تغییرات غیرمنتظرهٔ فایل قفل را رد می‌کنند و بسته‌های Plugin به‌جای اتکا به بستهٔ ریشه، گراف وابستگی قفل‌شدهٔ خود را همراه دارند.

## تولید و بررسی

بستهٔ npm ریشهٔ `openclaw`، بسته‌های npm مربوط به Pluginهای تحت مالکیت OpenClaw (برای مثال `@openclaw/discord`) و بسته‌های قابل‌انتشار فضای کاری مانند [`@openclaw/ai`](/reference/openclaw-ai)، هنگام انتشار شامل `npm-shrinkwrap.json` هستند. وابستگی‌های فضای کاری از Shrinkwrap ریشه حذف می‌شوند، زیرا همراه بستهٔ ریشه منتشر می‌شوند؛ در عوض، هر بستهٔ قابل‌انتشار فضای کاری درخت وابستگی گذرای خود را تثبیت می‌کند. بسته‌های Plugin مناسب همچنین می‌توانند با `bundledDependencies` صریح منتشر شوند و فایل‌های وابستگی زمان اجرای خود را در فایل فشردهٔ Plugin حمل کنند، نه اینکه فقط به تفکیک وابستگی هنگام نصب متکی باشند.

```bash
# همهٔ بسته‌های مدیریت‌شده با Shrinkwrap (ریشه + Pluginهای قابل‌انتشار)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# فقط بستهٔ ریشه
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# فقط بسته‌های متأثر از مجموعه‌تغییرات فعلی
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

مولد، قالب قفل قابل‌انتشار npm را تفکیک می‌کند، اما نسخه‌های تولیدشدهٔ بسته را که از قبل در `pnpm-lock.yaml` وجود ندارند، رد می‌کند. این کار مرز بازبینی قدمت وابستگی‌ها، بازنویسی‌ها و وصله‌های pnpm را دست‌نخورده نگه می‌دارد.

این موارد را حساس از نظر امنیتی بازبینی کنید:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- محتوای وابستگی‌های همراه Plugin
- هرگونه تفاوت در `package-lock.json`

اعتبارسنج‌های بستهٔ OpenClaw وجود Shrinkwrap را در فایل‌های فشردهٔ جدید بستهٔ ریشه الزامی می‌دانند و `package-lock.json` را برای بسته‌های منتشرشده رد می‌کنند. مسیر انتشار npm برای Plugin، Shrinkwrap محلی Plugin را بررسی می‌کند، وابستگی‌های همراهِ محلی بسته را نصب می‌کند و سپس بسته‌بندی یا انتشار را انجام می‌دهد.

## بازرسی یک بستهٔ منتشرشده

بستهٔ ریشه:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

بستهٔ Plugin:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

اطلاعات زمینه‌ای: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
