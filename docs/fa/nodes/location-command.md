---
read_when:
    - افزودن پشتیبانی از Node مکان یا رابط کاربری مجوزها
    - طراحی مجوزهای مکان‌یابی یا رفتار پیش‌زمینه در Android
summary: فرمان موقعیت مکانی برای Nodeها (`location.get`)، حالت‌های مجوز و رفتار پیش‌زمینه در Android
title: فرمان موقعیت مکانی
x-i18n:
    generated_at: "2026-07-12T10:20:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## خلاصه

- `location.get` یک فرمان Node است که از طریق `node.invoke` یا `openclaw nodes location get` فراخوانی می‌شود.
- به‌طور پیش‌فرض غیرفعال است.
- ساخت‌های شخص ثالث Android از یک گزینشگر استفاده می‌کنند: خاموش / هنگام استفاده / همیشه. ساخت‌های Play همچنان گزینه‌های خاموش / هنگام استفاده را دارند.
- موقعیت مکانی دقیق یک کلید جداگانه است.

## چرا گزینشگر (و نه فقط یک کلید)

مجوزهای موقعیت مکانی سیستم‌عامل چندسطحی هستند. موقعیت مکانی دقیق نیز مجوز جداگانه‌ای در سیستم‌عامل است («Precise» در iOS 14 و بالاتر، و «fine» در برابر «coarse» در Android). گزینشگر درون برنامه حالت درخواستی را تعیین می‌کند، اما تصمیم نهایی درباره مجوز اعطاشده همچنان با سیستم‌عامل است.

## مدل تنظیمات

برای هر دستگاه Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

رفتار رابط کاربری:

- انتخاب `whileUsing` مجوز پیش‌زمینه را درخواست می‌کند.
- انتخاب `always` در ساخت شخص ثالث Android ابتدا مجوز پیش‌زمینه را درخواست می‌کند، دسترسی پس‌زمینه را توضیح می‌دهد و سپس تنظیمات برنامه در Android را برای اعطای مجوز جداگانه **Allow all the time** باز می‌کند.
- ساخت‌های Android Play مجوز موقعیت مکانی پس‌زمینه را اعلام نمی‌کنند و `always` را نمایش نمی‌دهند.
- اگر سیستم‌عامل سطح درخواستی را رد کند، برنامه به بالاترین سطح اعطاشده بازمی‌گردد و وضعیت را نمایش می‌دهد.

## نگاشت مجوزها (`node.permissions`)

اختیاری است. Node مربوط به macOS، `location` را از طریق نگاشت `permissions` در `node.list`/`node.describe` گزارش می‌کند؛ iOS/Android ممکن است آن را درج نکنند.

## فرمان: `location.get`

از طریق `node.invoke` یا ابزار کمکی CLI فراخوانی می‌شود:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

پارامترها:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

پرچم‌های CLI مستقیماً نگاشت می‌شوند: `--location-timeout` -> `timeoutMs`، `--max-age` -> `maxAgeMs`، `--accuracy` -> `desiredAccuracy`.

محتوای پاسخ:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

خطاها (کدهای پایدار):

- `LOCATION_DISABLED`: گزینشگر خاموش است.
- `LOCATION_PERMISSION_REQUIRED`: مجوز لازم برای حالت درخواستی وجود ندارد.
- `LOCATION_BACKGROUND_UNAVAILABLE`: برنامه در پس‌زمینه است، اما فقط مجوز هنگام استفاده اعطا شده است.
- `LOCATION_TIMEOUT`: موقعیت در زمان مقرر تثبیت نشد.
- `LOCATION_UNAVAILABLE`: خرابی سیستم یا نبود ارائه‌دهنده.

## رفتار در پس‌زمینه

- ساخت‌های شخص ثالث Android فقط زمانی `location.get` را در پس‌زمینه می‌پذیرند که کاربر `Always` را انتخاب کرده باشد و Android مجوز موقعیت مکانی پس‌زمینه را اعطا کرده باشد. سرویس پایدار فعلی Node نوع سرویس `location` را اضافه می‌کند و هنگام فعال بودن، `Location: Always` را اعلام می‌کند.
- ساخت‌های Android Play و حالت `While Using`، اجرای `location.get` را هنگام قرار داشتن در پس‌زمینه رد می‌کنند.
- ممکن است سایر پلتفرم‌های Node رفتار متفاوتی داشته باشند.

## یکپارچه‌سازی مدل/ابزارها

- ابزار عامل: کنش `location_get` در ابزار `nodes` که به Node نیاز دارد.
- CLI: `openclaw nodes location get --node <id>`.
- دستورالعمل‌های عامل: فقط زمانی فراخوانی شود که کاربر موقعیت مکانی را فعال کرده و دامنه دسترسی را درک می‌کند.

## متن پیشنهادی تجربه کاربری

- خاموش: «اشتراک‌گذاری موقعیت مکانی غیرفعال است.»
- هنگام استفاده: «فقط هنگامی که OpenClaw باز است.»
- همیشه: «بررسی‌های درخواستی موقعیت مکانی را هنگامی که OpenClaw در پس‌زمینه است، مجاز کن.»
- دقیق: «از موقعیت مکانی دقیق GPS استفاده کن. برای اشتراک‌گذاری موقعیت تقریبی، این گزینه را خاموش کن.»

## مرتبط

- [نمای کلی Nodeها](/fa/nodes)
- [تجزیه موقعیت مکانی کانال](/fa/channels/location)
- [ثبت تصویر دوربین](/fa/nodes/camera)
- [حالت مکالمه](/fa/nodes/talk)
