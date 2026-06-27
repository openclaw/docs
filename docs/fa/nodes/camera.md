---
read_when:
    - افزودن یا تغییر ضبط دوربین روی گره‌های iOS/Android یا macOS
    - گسترش گردش‌کارهای فایل موقت MEDIA قابل‌دسترسی برای عامل
summary: 'ثبت با دوربین (گره‌های iOS/Android + برنامه macOS) برای استفاده عامل: عکس‌ها (jpg) و کلیپ‌های ویدیویی کوتاه (mp4)'
title: گرفتن تصویر با دوربین
x-i18n:
    generated_at: "2026-06-27T18:02:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw از **ثبت تصویر با دوربین** برای گردش‌کارهای عامل پشتیبانی می‌کند:

- **نود iOS** (جفت‌شده از طریق Gateway): ثبت یک **عکس** (`jpg`) یا **کلیپ ویدیویی کوتاه** (`mp4`، با صدای اختیاری) از طریق `node.invoke`.
- **نود Android** (جفت‌شده از طریق Gateway): ثبت یک **عکس** (`jpg`) یا **کلیپ ویدیویی کوتاه** (`mp4`، با صدای اختیاری) از طریق `node.invoke`.
- **برنامه macOS** (نود از طریق Gateway): ثبت یک **عکس** (`jpg`) یا **کلیپ ویدیویی کوتاه** (`mp4`، با صدای اختیاری) از طریق `node.invoke`.

تمام دسترسی‌های دوربین پشت **تنظیمات تحت کنترل کاربر** محدود شده‌اند.

## نود iOS

### تنظیم کاربر (به‌طور پیش‌فرض روشن)

- زبانه تنظیمات iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - پیش‌فرض: **روشن** (کلید ناموجود به‌عنوان فعال در نظر گرفته می‌شود).
  - هنگام خاموش بودن: فرمان‌های `camera.*` مقدار `CAMERA_DISABLED` را برمی‌گردانند.

### فرمان‌ها (از طریق Gateway `node.invoke`)

- `camera.list`
  - بار پاسخ:
    - `devices`: آرایه‌ای از `{ id, name, position, deviceType }`

- `camera.snap`
  - پارامترها:
    - `facing`: `front|back` (پیش‌فرض: `front`)
    - `maxWidth`: عدد (اختیاری؛ پیش‌فرض `1600` روی نود iOS)
    - `quality`: `0..1` (اختیاری؛ پیش‌فرض `0.9`)
    - `format`: در حال حاضر `jpg`
    - `delayMs`: عدد (اختیاری؛ پیش‌فرض `0`)
    - `deviceId`: رشته (اختیاری؛ از `camera.list`)
  - بار پاسخ:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`، `height`
  - محافظ بار: عکس‌ها دوباره فشرده می‌شوند تا بار base64 زیر ۵ مگابایت بماند.

- `camera.clip`
  - پارامترها:
    - `facing`: `front|back` (پیش‌فرض: `front`)
    - `durationMs`: عدد (پیش‌فرض `3000`، با سقف حداکثر `60000`)
    - `includeAudio`: بولی (پیش‌فرض `true`)
    - `format`: در حال حاضر `mp4`
    - `deviceId`: رشته (اختیاری؛ از `camera.list`)
  - بار پاسخ:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### الزام پیش‌زمینه

مانند `canvas.*`، نود iOS فقط فرمان‌های `camera.*` را در **پیش‌زمینه** مجاز می‌داند. فراخوانی‌های پس‌زمینه مقدار `NODE_BACKGROUND_UNAVAILABLE` را برمی‌گردانند.

### کمک‌کننده CLI

ساده‌ترین راه برای دریافت فایل‌های رسانه‌ای استفاده از کمک‌کننده CLI است که رسانه رمزگشایی‌شده را در یک فایل موقت می‌نویسد و مسیر ذخیره‌شده را چاپ می‌کند.

نمونه‌ها:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

نکته‌ها:

- `nodes camera snap` به‌طور پیش‌فرض از **هر دو** جهت استفاده می‌کند تا هر دو نما را به عامل بدهد.
- فایل‌های خروجی موقت هستند (در پوشه موقت سیستم‌عامل)، مگر اینکه پوشش خودتان را بسازید.

## نود Android

### تنظیم کاربر Android (به‌طور پیش‌فرض روشن)

- برگه تنظیمات Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - پیش‌فرض: **روشن** (کلید ناموجود به‌عنوان فعال در نظر گرفته می‌شود).
  - هنگام خاموش بودن: فرمان‌های `camera.*` مقدار `CAMERA_DISABLED` را برمی‌گردانند.

### مجوزها

- Android به مجوزهای زمان اجرا نیاز دارد:
  - `CAMERA` برای هر دو `camera.snap` و `camera.clip`.
  - `RECORD_AUDIO` برای `camera.clip` وقتی `includeAudio=true` باشد.

اگر مجوزها وجود نداشته باشند، برنامه در صورت امکان درخواست می‌دهد؛ اگر رد شوند، درخواست‌های `camera.*` با خطای
`*_PERMISSION_REQUIRED` ناموفق می‌شوند.

### الزام پیش‌زمینه Android

مانند `canvas.*`، نود Android فقط فرمان‌های `camera.*` را در **پیش‌زمینه** مجاز می‌داند. فراخوانی‌های پس‌زمینه مقدار `NODE_BACKGROUND_UNAVAILABLE` را برمی‌گردانند.

### فرمان‌های Android (از طریق Gateway `node.invoke`)

- `camera.list`
  - بار پاسخ:
    - `devices`: آرایه‌ای از `{ id, name, position, deviceType }`

### محافظ بار

عکس‌ها دوباره فشرده می‌شوند تا بار base64 زیر ۵ مگابایت بماند.

## برنامه macOS

### تنظیم کاربر (به‌طور پیش‌فرض خاموش)

برنامه همراه macOS یک چک‌باکس ارائه می‌کند:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - پیش‌فرض: **خاموش**
  - هنگام خاموش بودن: درخواست‌های دوربین "Camera disabled by user" را برمی‌گردانند.

### کمک‌کننده CLI (فراخوانی نود)

از CLI اصلی `openclaw` برای فراخوانی فرمان‌های دوربین روی نود macOS استفاده کنید.

نمونه‌ها:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

نکته‌ها:

- `openclaw nodes camera snap` به‌طور پیش‌فرض از `maxWidth=1600` استفاده می‌کند، مگر اینکه بازنویسی شود.
- در macOS، `camera.snap` پس از گرم‌شدن/پایدار شدن نوردهی، پیش از ثبت تصویر به‌اندازه `delayMs` (پیش‌فرض 2000ms) صبر می‌کند.
- بارهای عکس دوباره فشرده می‌شوند تا base64 زیر ۵ مگابایت بماند.

## ایمنی + محدودیت‌های عملی

- دسترسی دوربین و میکروفون درخواست‌های مجوز معمول سیستم‌عامل را فعال می‌کند (و به رشته‌های استفاده در Info.plist نیاز دارد).
- کلیپ‌های ویدیویی محدود شده‌اند (در حال حاضر `<= 60s`) تا از بارهای نود بیش‌ازحد بزرگ جلوگیری شود (سربار base64 + محدودیت‌های پیام).

## ویدیوی صفحه macOS (در سطح سیستم‌عامل)

برای ویدیوی _صفحه_ (نه دوربین)، از همراه macOS استفاده کنید:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

نکته‌ها:

- به مجوز **Screen Recording** در macOS نیاز دارد (TCC).

## مرتبط

- [پشتیبانی از تصویر و رسانه](/fa/nodes/images)
- [درک رسانه](/fa/nodes/media-understanding)
- [فرمان مکان](/fa/nodes/location-command)
