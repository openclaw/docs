---
read_when:
    - می‌خواهید بدانید npm shrinkwrap در یک انتشار OpenClaw به چه معناست
    - شما در حال بازبینی lockfileهای پکیج، تغییرات وابستگی‌ها، یا ریسک زنجیره تأمین هستید.
    - در حال اعتبارسنجی بسته‌های npm ریشه یا Plugin پیش از انتشار هستید
summary: توضیح به زبان ساده و فنی دربارهٔ npm shrinkwrap در انتشارهای OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:50:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

پرداخت‌های سورس OpenClaw از `pnpm-lock.yaml` استفاده می‌کنند. بسته‌های منتشرشده‌ی npm برای OpenClaw از `npm-shrinkwrap.json`، فایل قفل وابستگی قابل انتشار npm، استفاده می‌کنند تا نصب بسته‌ها از گراف وابستگی‌ای استفاده کند که در زمان انتشار بازبینی شده است.

## نسخه‌ی ساده

شرینک‌رپ رسیدی برای درخت وابستگی‌ای است که همراه یک بسته‌ی npm منتشر می‌شود. به npm می‌گوید دقیقاً کدام نسخه‌های بسته‌های گذرای وابستگی را نصب کند.

برای انتشارهای OpenClaw، یعنی:

- بسته‌ی منتشرشده در زمان نصب از npm نمی‌خواهد یک گراف وابستگی تازه بسازد؛
- تغییرات وابستگی آسان‌تر بازبینی می‌شوند، چون در یک فایل قفل ظاهر می‌شوند؛
- اعتبارسنجی انتشار می‌تواند همان گرافی را آزمایش کند که کاربران نصب خواهند کرد؛
- غافلگیری‌های مربوط به اندازه‌ی بسته یا وابستگی‌های native پیش از انتشار آسان‌تر شناسایی می‌شوند.

شرینک‌رپ sandbox نیست. به‌تنهایی یک وابستگی را امن نمی‌کند و جایگزین جداسازی میزبان، `openclaw security audit`، منشأ بسته، یا آزمون‌های smoke نصب نمی‌شود.

مدل ذهنی کوتاه:

| فایل                  | کجا اهمیت دارد         | معنای آن                     |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | پرداخت سورس OpenClaw | گراف وابستگی نگه‌دارنده       |
| `npm-shrinkwrap.json` | بسته‌ی npm منتشرشده    | گراف نصب npm برای کاربران       |
| `package-lock.json`   | برنامه‌های محلی npm           | قرارداد انتشار OpenClaw نیست |

## چرا OpenClaw از آن استفاده می‌کند

OpenClaw یک Gateway، میزبان Plugin، مسیریاب مدل، و زمان‌اجرای عامل است. یک نصب پیش‌فرض می‌تواند بر زمان راه‌اندازی، مصرف دیسک، دانلود بسته‌های native، و مواجهه با زنجیره‌ی تأمین اثر بگذارد.

شرینک‌رپ به بازبینی انتشار یک مرز پایدار می‌دهد:

- بازبین‌ها می‌توانند جابه‌جایی وابستگی‌های گذرا را ببینند؛
- اعتبارسنج‌های بسته می‌توانند رانش غیرمنتظره‌ی فایل قفل را رد کنند؛
- پذیرش بسته می‌تواند نصب‌ها را با گرافی آزمایش کند که منتشر خواهد شد؛
- بسته‌های Plugin می‌توانند گراف وابستگی قفل‌شده‌ی خودشان را داشته باشند، به‌جای اینکه به بسته‌ی ریشه برای مالکیت وابستگی‌های مختص Plugin تکیه کنند.

هدف «فایل‌های قفل بیشتر» نیست. هدف نصب‌های انتشار بازتولیدپذیر با مالکیت روشن است.

## جزئیات فنی

بسته‌ی ریشه‌ی npm با نام `openclaw` و بسته‌های Plugin npm متعلق به OpenClaw هنگام انتشار شامل `npm-shrinkwrap.json` هستند. بسته‌های Plugin مناسب که متعلق به OpenClaw هستند نیز می‌توانند با `bundledDependencies` صریح منتشر شوند، تا فایل‌های وابستگی زمان‌اجرای آن‌ها در tarball Plugin حمل شوند، نه اینکه فقط به resolve شدن در زمان نصب وابسته باشند.

این مرز را این‌گونه نگه دارید:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

مولد، قالب قفل قابل انتشار npm را resolve می‌کند اما نسخه‌های بسته‌ی تولیدشده‌ای را که از قبل در `pnpm-lock.yaml` وجود ندارند رد می‌کند. این کار مرز سن وابستگی، override، و بازبینی patch در pnpm را دست‌نخورده نگه می‌دارد.

فقط وقتی عمداً بسته‌ی ریشه را بدون دست زدن به بسته‌های Plugin تازه‌سازی می‌کنید، از فرمان‌های فقط‌ریشه استفاده کنید:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

این فایل‌ها را از نظر امنیتی حساس بازبینی کنید:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- payloadهای وابستگی Plugin بسته‌بندی‌شده
- هر diff مربوط به `package-lock.json`

اعتبارسنج‌های بسته‌ی OpenClaw در tarballهای جدید بسته‌ی ریشه شرینک‌رپ را الزامی می‌کنند. مسیر انتشار npm برای Plugin، شرینک‌رپ محلی Plugin را بررسی می‌کند، وابستگی‌های بسته‌بندی‌شده‌ی محلی بسته را نصب می‌کند، و سپس بسته را pack یا منتشر می‌کند. اعتبارسنج‌های بسته، `package-lock.json` را برای بسته‌های منتشرشده‌ی OpenClaw رد می‌کنند.

برای بررسی یک بسته‌ی ریشه‌ی منتشرشده:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

برای بررسی یک بسته‌ی Plugin متعلق به OpenClaw:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

پیش‌زمینه: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
