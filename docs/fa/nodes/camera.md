---
read_when:
    - افزودن یا تغییر ضبط دوربین در گره‌های iOS/Android یا macOS
    - گسترش گردش‌کارهای فایل موقت MEDIA قابل‌دسترسی برای عامل
summary: 'ضبط با دوربین (نودهای iOS/Android + برنامه macOS) برای استفاده عامل: عکس‌ها (jpg) و کلیپ‌های ویدیویی کوتاه (mp4)'
title: ثبت تصویر با دوربین
x-i18n:
    generated_at: "2026-05-06T09:28:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw از **ثبت تصویر با دوربین** برای گردش‌کارهای عامل پشتیبانی می‌کند:

- **Node iOS** (جفت‌شده از طریق Gateway): ثبت یک **عکس** (`jpg`) یا **کلیپ ویدیویی کوتاه** (`mp4`، با صدای اختیاری) از طریق `node.invoke`.
- **Node Android** (جفت‌شده از طریق Gateway): ثبت یک **عکس** (`jpg`) یا **کلیپ ویدیویی کوتاه** (`mp4`، با صدای اختیاری) از طریق `node.invoke`.
- **برنامه macOS** (Node از طریق Gateway): ثبت یک **عکس** (`jpg`) یا **کلیپ ویدیویی کوتاه** (`mp4`، با صدای اختیاری) از طریق `node.invoke`.

تمام دسترسی‌های دوربین پشت **تنظیمات تحت کنترل کاربر** قرار دارند.

## Node iOS

### تنظیم کاربر (به‌طور پیش‌فرض روشن)

- زبانه Settings در iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - پیش‌فرض: **روشن** (کلید ناموجود به‌عنوان فعال در نظر گرفته می‌شود).
  - وقتی خاموش باشد: فرمان‌های `camera.*` مقدار `CAMERA_DISABLED` را برمی‌گردانند.

### فرمان‌ها (از طریق Gateway `node.invoke`)

- `camera.list`
  - بار پاسخ:
    - `devices`: آرایه‌ای از `{ id, name, position, deviceType }`

- `camera.snap`
  - پارامترها:
    - `facing`: `front|back` (پیش‌فرض: `front`)
    - `maxWidth`: عدد (اختیاری؛ پیش‌فرض `1600` روی Node iOS)
    - `quality`: `0..1` (اختیاری؛ پیش‌فرض `0.9`)
    - `format`: در حال حاضر `jpg`
    - `delayMs`: عدد (اختیاری؛ پیش‌فرض `0`)
    - `deviceId`: رشته (اختیاری؛ از `camera.list`)
  - بار پاسخ:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - محافظ بار: عکس‌ها دوباره فشرده می‌شوند تا بار base64 کمتر از ۵ مگابایت بماند.

- `camera.clip`
  - پارامترها:
    - `facing`: `front|back` (پیش‌فرض: `front`)
    - `durationMs`: عدد (پیش‌فرض `3000`، با سقف حداکثر `60000` محدود می‌شود)
    - `includeAudio`: بولی (پیش‌فرض `true`)
    - `format`: در حال حاضر `mp4`
    - `deviceId`: رشته (اختیاری؛ از `camera.list`)
  - بار پاسخ:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### الزام پیش‌زمینه

مانند `canvas.*`، Node iOS فقط فرمان‌های `camera.*` را در **پیش‌زمینه** مجاز می‌داند. فراخوانی‌های پس‌زمینه `NODE_BACKGROUND_UNAVAILABLE` را برمی‌گردانند.

### کمک‌کننده CLI (فایل‌های موقت + MEDIA)

آسان‌ترین راه برای دریافت پیوست‌ها استفاده از کمک‌کننده CLI است که رسانه رمزگشایی‌شده را در یک فایل موقت می‌نویسد و `MEDIA:<path>` را چاپ می‌کند.

نمونه‌ها:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

نکته‌ها:

- `nodes camera snap` به‌طور پیش‌فرض از **هر دو** جهت استفاده می‌کند تا هر دو نما را به عامل بدهد.
- فایل‌های خروجی موقت هستند (در پوشه موقت سیستم‌عامل)، مگر اینکه پوشش اختصاصی خودتان را بسازید.

## Node Android

### تنظیم کاربر Android (به‌طور پیش‌فرض روشن)

- برگه Settings در Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - پیش‌فرض: **روشن** (کلید ناموجود به‌عنوان فعال در نظر گرفته می‌شود).
  - وقتی خاموش باشد: فرمان‌های `camera.*` مقدار `CAMERA_DISABLED` را برمی‌گردانند.

### مجوزها

- Android به مجوزهای زمان اجرا نیاز دارد:
  - `CAMERA` برای هر دو `camera.snap` و `camera.clip`.
  - `RECORD_AUDIO` برای `camera.clip` وقتی `includeAudio=true`.

اگر مجوزها موجود نباشند، برنامه در صورت امکان درخواست می‌دهد؛ اگر رد شوند، درخواست‌های `camera.*` با خطای
`*_PERMISSION_REQUIRED` شکست می‌خورند.

### الزام پیش‌زمینه Android

مانند `canvas.*`، Node Android فقط فرمان‌های `camera.*` را در **پیش‌زمینه** مجاز می‌داند. فراخوانی‌های پس‌زمینه `NODE_BACKGROUND_UNAVAILABLE` را برمی‌گردانند.

### فرمان‌های Android (از طریق Gateway `node.invoke`)

- `camera.list`
  - بار پاسخ:
    - `devices`: آرایه‌ای از `{ id, name, position, deviceType }`

### محافظ بار

عکس‌ها دوباره فشرده می‌شوند تا بار base64 کمتر از ۵ مگابایت بماند.

## برنامه macOS

### تنظیم کاربر (به‌طور پیش‌فرض خاموش)

برنامه همراه macOS یک چک‌باکس ارائه می‌دهد:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - پیش‌فرض: **خاموش**
  - وقتی خاموش باشد: درخواست‌های دوربین "Camera disabled by user" را برمی‌گردانند.

### کمک‌کننده CLI (فراخوانی Node)

از CLI اصلی `openclaw` برای فراخوانی فرمان‌های دوربین روی Node macOS استفاده کنید.

نمونه‌ها:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

نکته‌ها:

- `openclaw nodes camera snap` به‌طور پیش‌فرض از `maxWidth=1600` استفاده می‌کند، مگر اینکه بازنویسی شود.
- در macOS، `camera.snap` پس از گرم‌شدن/پایدار شدن نوردهی، به‌اندازه `delayMs` (پیش‌فرض 2000ms) صبر می‌کند و سپس ثبت می‌کند.
- بارهای عکس دوباره فشرده می‌شوند تا base64 کمتر از ۵ مگابایت بماند.

## ایمنی + محدودیت‌های عملی

- دسترسی به دوربین و میکروفون اعلان‌های معمول مجوز سیستم‌عامل را فعال می‌کند (و به رشته‌های استفاده در Info.plist نیاز دارد).
- کلیپ‌های ویدیویی محدود شده‌اند (در حال حاضر `<= 60s`) تا از بارهای بیش‌ازحد بزرگ Node جلوگیری شود (سربار base64 + محدودیت‌های پیام).

## ویدیوی صفحه macOS (در سطح سیستم‌عامل)

برای ویدیوی _صفحه_ (نه دوربین)، از همراه macOS استفاده کنید:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

نکته‌ها:

- به مجوز **Screen Recording** در macOS نیاز دارد (TCC).

## مرتبط

- [پشتیبانی از تصویر و رسانه](/fa/nodes/images)
- [درک رسانه](/fa/nodes/media-understanding)
- [فرمان مکان](/fa/nodes/location-command)
