---
read_when:
    - افزودن یا تغییر ضبط دوربین در پلتفرم‌های Node
    - گسترش گردش‌کارهای فایل موقت MEDIA قابل‌دسترسی برای عامل‌ها
summary: ثبت با دوربین در Nodeهای iOS، Android، macOS و Linux برای عکس‌ها و کلیپ‌های ویدیویی کوتاه
title: ثبت تصویر دوربین
x-i18n:
    generated_at: "2026-07-16T17:09:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw از ثبت تصویر دوربین برای گردش‌کارهای عامل در Nodeهای جفت‌شدهٔ **iOS**، **Android**، **macOS** و **Linux** پشتیبانی می‌کند: از طریق Gateway `node.invoke` یک عکس (`jpg`) یا یک کلیپ ویدیویی کوتاه (`mp4`، با صدای اختیاری) ثبت کنید.

تمام دسترسی‌های دوربین در هر پلتفرم پشت یک تنظیم تحت کنترل کاربر قرار دارند.

## Node در iOS

### تنظیم کاربر در iOS

- زبانهٔ تنظیمات iOS → **Camera** → **Allow Camera** (`camera.enabled`).
  - پیش‌فرض: **روشن** (نبودن کلید به‌معنای فعال‌بودن در نظر گرفته می‌شود).
  - در حالت خاموش: فرمان‌های `camera.*` مقدار `CAMERA_DISABLED` را برمی‌گردانند.

### فرمان‌های iOS (از طریق Gateway `node.invoke`)

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
  - محافظ اندازهٔ بار: عکس‌ها دوباره فشرده می‌شوند تا بار کدگذاری‌شده با base64 زیر 5MB بماند.

- `camera.clip`
  - پارامترها:
    - `facing`: `front|back` (پیش‌فرض: `front`)
    - `durationMs`: عدد (پیش‌فرض `3000`، محدودشده به `[250, 60000]`)
    - `includeAudio`: بولی (پیش‌فرض `true`)
    - `format`: در حال حاضر `mp4`
    - `deviceId`: رشته (اختیاری؛ از `camera.list`)
  - بار پاسخ: `format: "mp4"`، `base64`، `durationMs`، `hasAudio`.

### الزام پیش‌زمینه در iOS

مانند `canvas.*`، Node در iOS فقط فرمان‌های `camera.*` را در **پیش‌زمینه** مجاز می‌داند. فراخوانی‌های پس‌زمینه `NODE_BACKGROUND_UNAVAILABLE` را برمی‌گردانند.

### ابزار کمکی CLI

ساده‌ترین راه برای دریافت فایل‌های رسانه‌ای استفاده از ابزار کمکی CLI است که رسانهٔ رمزگشایی‌شده را در یک فایل موقت می‌نویسد و مسیر ذخیره‌شده را چاپ می‌کند.

```bash
openclaw nodes camera snap --node <id>                 # پیش‌فرض: هم جلو و هم پشت (2 خط MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` به‌طور پیش‌فرض `--facing both` است و برای ارائهٔ هر دو نما به عامل، هم دوربین جلو و هم دوربین پشت را ثبت می‌کند؛ برای یک جهت صریح واحد، `--device-id` را ارسال کنید (وقتی `--device-id` تنظیم شده باشد، `both` رد می‌شود). فایل‌های خروجی موقت‌اند (در پوشهٔ موقت سیستم‌عامل)، مگر اینکه پوشش سفارشی خود را بسازید.

## Node در Android

### تنظیم کاربر در Android

- صفحهٔ تنظیمات Android → **Camera** → **Allow Camera** (`camera.enabled`).
  - **پیش‌فرض نصب‌های تازه خاموش است.** نصب‌های موجودی که به قبل از این تنظیم مربوط‌اند به حالت **روشن** مهاجرت داده می‌شوند تا ارتقاها دسترسی دوربینی را که قبلاً کار می‌کرد، بی‌سروصدا از دست ندهند.
  - در حالت خاموش: فرمان‌های `camera.*` مقدار `CAMERA_DISABLED: enable Camera in Settings` را برمی‌گردانند.

### مجوزها

- `CAMERA` برای هر دو `camera.snap` و `camera.clip` الزامی است؛ نبودن یا ردشدن مجوز، `CAMERA_PERMISSION_REQUIRED` را برمی‌گرداند.
- `RECORD_AUDIO` برای `camera.clip`، هنگامی که `includeAudio` برابر با `true` باشد، الزامی است؛ نبودن یا ردشدن مجوز، `MIC_PERMISSION_REQUIRED` را برمی‌گرداند.

برنامه در صورت امکان، مجوزهای زمان اجرا را درخواست می‌کند.

### الزام پیش‌زمینه در Android

مانند `canvas.*`، Node در Android فقط فرمان‌های `camera.*` را در **پیش‌زمینه** مجاز می‌داند. فراخوانی‌های پس‌زمینه `NODE_BACKGROUND_UNAVAILABLE: command requires foreground` را برمی‌گردانند.

### فرمان‌های Android (از طریق Gateway `node.invoke`)

- `camera.list`
  - بار پاسخ: `devices` — آرایه‌ای از `{ id, name, position, deviceType }`.

- `camera.snap`
  - پارامترها: `facing` (`front|back`، پیش‌فرض `front`)، `quality` (پیش‌فرض `0.95`، محدودشده به `[0.1, 1.0]`)، `maxWidth` (پیش‌فرض `1600`)، `deviceId` (اختیاری؛ شناسهٔ ناشناخته با `INVALID_REQUEST` ناموفق می‌شود).
  - بار پاسخ: `format: "jpg"`، `base64`، `width`، `height`.
  - محافظ اندازهٔ بار: دوباره فشرده می‌شود تا base64 زیر 5MB بماند (همان بودجهٔ iOS).

- `camera.clip`
  - پارامترها: `facing` (پیش‌فرض `front`)، `durationMs` (پیش‌فرض `3000`، محدودشده به `[200, 60000]`)، `includeAudio` (پیش‌فرض `true`)، `deviceId` (اختیاری).
  - بار پاسخ: `format: "mp4"`، `base64`، `durationMs`، `hasAudio`.
  - محافظ اندازهٔ بار: MP4 خام پیش از کدگذاری base64 به 18MB محدود می‌شود؛ کلیپ‌های بزرگ‌تر با `PAYLOAD_TOO_LARGE` ناموفق می‌شوند (`durationMs` را کاهش دهید و دوباره تلاش کنید).

## برنامهٔ macOS

### تنظیم کاربر در macOS

برنامهٔ همراه macOS یک کادر انتخاب ارائه می‌کند:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - پیش‌فرض: **خاموش**.
  - در حالت خاموش: درخواست‌های دوربین `CAMERA_DISABLED: enable Camera in Settings` را برمی‌گردانند.

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

- `openclaw nodes camera snap` به‌طور پیش‌فرض `maxWidth=1600` است، مگر اینکه بازنویسی شود.
- `camera.snap` پس از گرم‌شدن و تثبیت نوردهی، پیش از ثبت به‌اندازهٔ `delayMs` (پیش‌فرض 2000ms، محدودشده به `[0, 10000]`) منتظر می‌ماند.
- بارهای عکس دوباره فشرده می‌شوند تا base64 زیر 5MB بماند.

## میزبان Node در Linux

Plugin همراه Node در Linux ثبت دوربین را به سرویس CLI با نام `openclaw node` اضافه می‌کند. این قابلیت روی میزبان بدون رابط گرافیکی کار می‌کند و به برنامهٔ دسکتاپ Linux نیاز ندارد.

دسترسی دوربین به‌طور پیش‌فرض خاموش است. آن را در ورودی Plugin فعال کنید، سپس سرویس Node را راه‌اندازی مجدد کنید تا آگهی Gateway آن از نو ساخته شود:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

الزامات:

- FFmpeg با ورودی V4L2، `libx264` و پشتیبانی از AAC
- یک دستگاه `/dev/video*` که برای کاربر سرویس Node خواندنی باشد؛ در توزیع‌های رایج، آن کاربر را به گروه `video` اضافه کنید
- برای کلیپ‌هایی با `includeAudio: true` پیش‌فرض، یک سرور PulseAudio فعال یا لایهٔ سازگاری PipeWire با PulseAudio که منبع پیش‌فرض داشته باشد

Linux مسیرهای دستگاه V4L2 خواندنی و دارای قابلیت ثبت را از `camera.list` برمی‌گرداند؛ FFmpeg هر گزینهٔ `/dev/video*` را بررسی می‌کند و Nodeهای بدون فراداده یا صرفاً خروجی را کنار می‌گذارد. مقدار `position` دستگاه `unknown` است؛ بنابراین درخواست جهت بدون `deviceId` به‌جای ادعای وجود دوربین جلو یا پشت، یک عکس یا کلیپ با موقعیت `unknown` تولید می‌کند. وقتی یک میزبان چند دوربین دارد، از `deviceId` استفاده کنید. `camera.snap` از گرم‌کردن ورودی FFmpeg برای `delayMs` استفاده می‌کند و هنگام محدودکردن عرض، نسبت تصویر را حفظ می‌کند. `camera.clip` صدای میکروفون را به‌عنوان ترک صوتی MP4 ضبط می‌کند؛ OpenClaw عمداً هیچ فرمان مستقلی برای میکروفون ارائه نمی‌دهد.

Plugin برای ویدیوی MP4 از `libx264` استفاده می‌کند و کدک‌ها را بی‌سروصدا تغییر نمی‌دهد. نسخهٔ FFmpeg فاقد ورودی یا رمزگذارهای لازم، `CAMERA_UNAVAILABLE` را برمی‌گرداند. عکس‌ها و کلیپ‌هایی که از بودجهٔ بار base64 معادل 25MB فراتر بروند، با `PAYLOAD_TOO_LARGE` ناموفق می‌شوند.

`camera.snap` و `camera.clip` همچنان فرمان‌های خطرناکی هستند. آن‌ها را فقط زمانی به `gateway.nodes.allowCommands` اضافه کنید که قصد فعال‌کردن ثبت را دارید؛ صرفاً فعال‌کردن Plugin، سیاست Gateway را دور نمی‌زند.

## ایمنی و محدودیت‌های عملی

- دسترسی دوربین و میکروفون اعلان‌های معمول مجوز سیستم‌عامل را فعال می‌کند (و به رشته‌های کاربرد در `Info.plist` نیاز دارد).
- برای جلوگیری از بزرگ‌شدن بیش‌ازحد بارهای Node (سربار base64 به‌علاوهٔ محدودیت‌های پیام)، کلیپ‌های ویدیویی به 60s محدود می‌شوند.

## ویدیوی صفحه در macOS (سطح سیستم‌عامل)

برای ویدیوی _صفحه_ (نه دوربین)، از برنامهٔ همراه macOS استفاده کنید:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # مسیر ذخیره‌شده را چاپ می‌کند
```

به مجوز **Screen Recording** در macOS (TCC) نیاز دارد.

## مرتبط

- [پشتیبانی از تصویر و رسانه](/fa/nodes/images)
- [درک رسانه](/fa/nodes/media-understanding)
- [فرمان موقعیت مکانی](/fa/nodes/location-command)
