---
read_when:
    - به‌روزرسانی نگاشت‌های شناسهٔ مدل دستگاه یا فایل‌های NOTICE/مجوز
    - تغییر نحوهٔ نمایش نام دستگاه‌ها در رابط کاربری نمونه‌ها
summary: نحوهٔ گنجاندن شناسه‌های مدل دستگاه‌های Apple توسط OpenClaw برای نام‌های کاربرپسند در برنامهٔ macOS.
title: پایگاه دادهٔ مدل دستگاه
x-i18n:
    generated_at: "2026-04-29T23:31:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 16
---

اپلیکیشن همراه macOS نام‌های خوانای مدل دستگاه‌های Apple را در رابط کاربری **نمونه‌ها** با نگاشت شناسه‌های مدل Apple (مانند `iPad16,6`، `Mac16,6`) به نام‌های قابل‌فهم برای انسان نمایش می‌دهد.

این نگاشت به‌صورت JSON در مسیر زیر وارد مخزن شده است:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## منبع داده

ما در حال حاضر این نگاشت را از مخزن دارای مجوز MIT زیر وارد مخزن می‌کنیم:

- `kyle-seongwoo-jun/apple-device-identifiers`

برای قطعی‌ماندن بیلدها، فایل‌های JSON به کامیت‌های مشخص بالادستی سنجاق شده‌اند (ثبت‌شده در `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## به‌روزرسانی پایگاه داده

1. کامیت‌های بالادستی‌ای را که می‌خواهید به آن‌ها سنجاق کنید انتخاب کنید (یکی برای iOS، یکی برای macOS).
2. هش‌های کامیت را در `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` به‌روزرسانی کنید.
3. فایل‌های JSON را دوباره دانلود کنید، در حالی که به همان کامیت‌ها سنجاق شده‌اند:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. مطمئن شوید `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` همچنان با بالادست مطابقت دارد (اگر مجوز بالادستی تغییر کرده است، آن را جایگزین کنید).
5. بررسی کنید اپلیکیشن macOS بدون مشکل بیلد می‌شود (بدون هشدار):

```bash
swift build --package-path apps/macos
```

## مرتبط

- [Nodeها](/fa/nodes)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
