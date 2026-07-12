---
read_when:
    - افزودن یا تغییر قابلیت ثبت تصویر دوربین در Nodeهای iOS/Android یا macOS
    - گسترش گردش‌کارهای فایل موقت MEDIA قابل‌دسترسی برای عامل‌ها
summary: 'ثبت تصویر با دوربین (Nodeهای iOS/Android + برنامهٔ macOS) برای استفادهٔ عامل: عکس‌ها (jpg) و کلیپ‌های ویدیویی کوتاه (mp4)'
title: ثبت تصویر دوربین
x-i18n:
    generated_at: "2026-07-12T10:13:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw از ثبت تصویر با دوربین برای گردش‌کارهای عامل روی Nodeهای جفت‌شدهٔ **iOS**، **Android** و **macOS** پشتیبانی می‌کند: از طریق `node.invoke` در Gateway یک عکس (`jpg`) یا یک کلیپ ویدیویی کوتاه (`mp4`، با صدای اختیاری) ثبت کنید.

تمام دسترسی‌ها به دوربین در هر پلتفرم به یک تنظیم تحت کنترل کاربر وابسته است.

## Node در iOS

### تنظیم کاربر در iOS

- زبانهٔ Settings در iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - پیش‌فرض: **روشن** (نبودن کلید به‌معنای فعال‌بودن در نظر گرفته می‌شود).
  - در حالت خاموش: فرمان‌های `camera.*` مقدار `CAMERA_DISABLED` را برمی‌گردانند.

### فرمان‌های iOS (از طریق `node.invoke` در Gateway)

- `camera.list`
  - بار پاسخ: `devices` — آرایه‌ای از `{ id, name, position, deviceType }`.

- `camera.snap`
  - پارامترها:
    - `facing`: `front|back` (پیش‌فرض: `front`)
    - `maxWidth`: عدد (اختیاری؛ پیش‌فرض `1600`)
    - `quality`: `0..1` (اختیاری؛ پیش‌فرض `0.9`، محدودشده به `[0.05, 1.0]`)
    - `format`: در حال حاضر `jpg`
    - `delayMs`: عدد (اختیاری؛ پیش‌فرض `0`، با سقف داخلی `10000`)
    - `deviceId`: رشته (اختیاری؛ از `camera.list`)
  - بار پاسخ: `format: "jpg"`، `base64`، `width`، `height`.
  - محافظ بار: عکس‌ها دوباره فشرده می‌شوند تا حجم بار کدگذاری‌شده با base64 کمتر از ۵ مگابایت بماند.

- `camera.clip`
  - پارامترها:
    - `facing`: `front|back` (پیش‌فرض: `front`)
    - `durationMs`: عدد (پیش‌فرض `3000`، محدودشده به `[250, 60000]`)
    - `includeAudio`: بولی (پیش‌فرض `true`)
    - `format`: در حال حاضر `mp4`
    - `deviceId`: رشته (اختیاری؛ از `camera.list`)
  - بار پاسخ: `format: "mp4"`، `base64`، `durationMs`، `hasAudio`.

### الزام پیش‌زمینه در iOS

مانند `canvas.*`، Node در iOS فقط در **پیش‌زمینه** اجازهٔ اجرای فرمان‌های `camera.*` را می‌دهد. فراخوانی‌های پس‌زمینه مقدار `NODE_BACKGROUND_UNAVAILABLE` را برمی‌گردانند.

### ابزار کمکی CLI

ساده‌ترین راه برای دریافت فایل‌های رسانه‌ای، استفاده از ابزار کمکی CLI است که رسانهٔ رمزگشایی‌شده را در یک فایل موقت می‌نویسد و مسیر ذخیره‌شده را چاپ می‌کند.

```bash
openclaw nodes camera snap --node <id>                 # پیش‌فرض: هر دو دوربین جلو + عقب (۲ خط MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

مقدار پیش‌فرض `nodes camera snap` برای `--facing` برابر `both` است و برای ارائهٔ هر دو نما به عامل، از دوربین جلو و عقب تصویر ثبت می‌کند؛ هنگام استفاده از `--device-id` باید یک جهت مشخص انتخاب کنید (`both` در صورت تنظیم `--device-id` رد می‌شود). فایل‌های خروجی موقت هستند (در پوشهٔ موقت سیستم‌عامل)، مگر اینکه پوشش سفارشی خود را بسازید.

## Node در Android

### تنظیم کاربر در Android

- صفحهٔ Settings در Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **در نصب‌های جدید به‌طور پیش‌فرض خاموش است.** نصب‌های موجود که پیش از معرفی این تنظیم انجام شده‌اند، به حالت **روشن** مهاجرت داده می‌شوند تا ارتقا باعث ازدست‌رفتن بی‌سروصدای دسترسی قبلاً فعال دوربین نشود.
  - در حالت خاموش: فرمان‌های `camera.*` مقدار `CAMERA_DISABLED: enable Camera in Settings` را برمی‌گردانند.

### مجوزها

- مجوز `CAMERA` برای هر دو فرمان `camera.snap` و `camera.clip` الزامی است؛ نبودن یا ردشدن مجوز باعث بازگشت `CAMERA_PERMISSION_REQUIRED` می‌شود.
- وقتی `includeAudio` برابر `true` است، مجوز `RECORD_AUDIO` برای `camera.clip` الزامی است؛ نبودن یا ردشدن مجوز باعث بازگشت `MIC_PERMISSION_REQUIRED` می‌شود.

برنامه در صورت امکان، مجوزهای زمان اجرا را درخواست می‌کند.

### الزام پیش‌زمینه در Android

مانند `canvas.*`، Node در Android فقط در **پیش‌زمینه** اجازهٔ اجرای فرمان‌های `camera.*` را می‌دهد. فراخوانی‌های پس‌زمینه مقدار `NODE_BACKGROUND_UNAVAILABLE: command requires foreground` را برمی‌گردانند.

### فرمان‌های Android (از طریق `node.invoke` در Gateway)

- `camera.list`
  - بار پاسخ: `devices` — آرایه‌ای از `{ id, name, position, deviceType }`.

- `camera.snap`
  - پارامترها: `facing`‏ (`front|back`، پیش‌فرض `front`)، `quality` (پیش‌فرض `0.95`، محدودشده به `[0.1, 1.0]`)، `maxWidth` (پیش‌فرض `1600`)، `deviceId` (اختیاری؛ شناسهٔ ناشناخته با `INVALID_REQUEST` ناموفق می‌شود).
  - بار پاسخ: `format: "jpg"`، `base64`، `width`، `height`.
  - محافظ بار: داده دوباره فشرده می‌شود تا حجم base64 کمتر از ۵ مگابایت بماند (همان سقف iOS).

- `camera.clip`
  - پارامترها: `facing` (پیش‌فرض `front`)، `durationMs` (پیش‌فرض `3000`، محدودشده به `[200, 60000]`)، `includeAudio` (پیش‌فرض `true`)، `deviceId` (اختیاری).
  - بار پاسخ: `format: "mp4"`، `base64`، `durationMs`، `hasAudio`.
  - محافظ بار: حجم MP4 خام پیش از کدگذاری base64 به ۱۸ مگابایت محدود است؛ کلیپ‌های بزرگ‌تر با `PAYLOAD_TOO_LARGE` ناموفق می‌شوند (`durationMs` را کاهش دهید و دوباره تلاش کنید).

## برنامهٔ macOS

### تنظیم کاربر در macOS

برنامهٔ همراه macOS یک کادر انتخاب ارائه می‌کند:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - پیش‌فرض: **خاموش**.
  - در حالت خاموش: درخواست‌های دوربین مقدار `CAMERA_DISABLED: enable Camera in Settings` را برمی‌گردانند.

### ابزار کمکی CLI (فراخوانی Node)

برای فراخوانی فرمان‌های دوربین در Node مربوط به macOS، از CLI اصلی `openclaw` استفاده کنید.

```bash
openclaw nodes camera list --node <id>                     # فهرست شناسه‌های دوربین
openclaw nodes camera snap --node <id>                     # مسیر ذخیره‌شده را چاپ می‌کند
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # مسیر ذخیره‌شده را چاپ می‌کند
openclaw nodes camera clip --node <id> --duration-ms 3000   # مسیر ذخیره‌شده را چاپ می‌کند (پرچم قدیمی)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- مقدار پیش‌فرض `maxWidth` در `openclaw nodes camera snap` برابر `1600` است، مگر اینکه بازنویسی شود.
- `camera.snap` پس از گرم‌شدن و تثبیت نوردهی، به‌اندازهٔ `delayMs` (پیش‌فرض ۲۰۰۰ میلی‌ثانیه، محدودشده به `[0, 10000]`) منتظر می‌ماند و سپس تصویر را ثبت می‌کند.
- بارهای عکس دوباره فشرده می‌شوند تا حجم base64 کمتر از ۵ مگابایت بماند.

## ایمنی و محدودیت‌های عملی

- دسترسی به دوربین و میکروفون، درخواست‌های معمول مجوز سیستم‌عامل را فعال می‌کند (و به رشته‌های کاربرد در `Info.plist` نیاز دارد).
- کلیپ‌های ویدیویی برای جلوگیری از بارهای بیش‌ازحد بزرگ Node به ۶۰ ثانیه محدود هستند (سربار base64 به‌علاوهٔ محدودیت‌های پیام).

## ویدیوی صفحه‌نمایش در macOS (در سطح سیستم‌عامل)

برای ویدیوی _صفحه‌نمایش_ (نه دوربین)، از برنامهٔ همراه macOS استفاده کنید:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # مسیر ذخیره‌شده را چاپ می‌کند
```

به مجوز **Screen Recording** در macOS‏ (TCC) نیاز دارد.

## مرتبط

- [پشتیبانی از تصویر و رسانه](/fa/nodes/images)
- [درک رسانه](/fa/nodes/media-understanding)
- [فرمان مکان](/fa/nodes/location-command)
