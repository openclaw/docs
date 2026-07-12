---
read_when:
    - به‌روزرسانی نگاشت‌های شناسه مدل دستگاه یا فایل‌های NOTICE/مجوز
    - تغییر نحوه نمایش نام دستگاه‌ها در رابط کاربری نمونه‌ها
summary: نحوهٔ ارائهٔ شناسه‌های مدل دستگاه‌های Apple توسط OpenClaw برای نمایش نام‌های خوانا در برنامهٔ macOS.
title: پایگاه دادهٔ مدل‌های دستگاه
x-i18n:
    generated_at: "2026-07-12T10:43:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

رابط کاربری **نمونه‌ها** در برنامهٔ همراه macOS، شناسه‌های مدل Apple را به نام‌های خوانا نگاشت می‌کند (`iPad16,6` -> «iPad Pro ۱۳ اینچی (M4)»، `Mac16,6` -> «MacBook Pro (۱۴ اینچی، ۲۰۲۴)»). `DeviceModelCatalog` همچنین برای انتخاب یک SF Symbol برای هر دستگاه، از پیشوند شناسه استفاده می‌کند (و در صورت نبود آن، به خانوادهٔ دستگاه برمی‌گردد).

فایل‌های موجود در `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| فایل                                   | کاربرد                               |
| -------------------------------------- | ------------------------------------- |
| `ios-device-identifiers.json`          | نگاشت شناسهٔ iOS/iPadOS به نام |
| `mac-device-identifiers.json`          | نگاشت شناسهٔ Mac به نام        |
| `NOTICE.md`                            | SHAهای پین‌شدهٔ کامیت بالادستی           |
| `LICENSE.apple-device-identifiers.txt` | مجوز MIT بالادستی                  |

## منبع داده

از مخزن GitHub با مجوز MIT به نام `kyle-seongwoo-jun/apple-device-identifiers` درون‌سپاری شده است. فایل‌های JSON به SHAهای کامیت ثبت‌شده در `NOTICE.md` پین شده‌اند تا ساخت‌ها قطعی باقی بمانند.

## به‌روزرسانی پایگاه داده

1. SHAهای کامیت بالادستی را برای پین‌کردن انتخاب کنید (یکی برای iOS و دیگری برای macOS).
2. فایل `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` را با SHAهای جدید به‌روزرسانی کنید.
3. فایل‌های JSON پین‌شده به آن کامیت‌ها را دوباره بارگیری کنید:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. تأیید کنید که `LICENSE.apple-device-identifiers.txt` همچنان با نسخهٔ بالادستی مطابقت دارد؛ اگر مجوز بالادستی تغییر کرده است، آن را جایگزین کنید.
5. بررسی کنید که برنامهٔ macOS بدون خطا ساخته می‌شود:

```bash
swift build --package-path apps/macos
```

## مرتبط

- [Nodeها](/fa/nodes)
- [عیب‌یابی Node](/fa/nodes/troubleshooting)
