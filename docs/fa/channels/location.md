---
read_when:
    - افزودن یا تغییر تجزیهٔ مکان کانال
    - استفاده از فیلدهای زمینهٔ مکان در پرامپت‌ها یا ابزارهای عامل
summary: تجزیهٔ موقعیت مکانی کانال ورودی (Telegram/WhatsApp/Matrix) و فیلدهای زمینه
title: تجزیه مکان کانال
x-i18n:
    generated_at: "2026-04-29T22:26:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 16
---

OpenClaw مکان‌های اشتراکی از کانال‌های چت را به این موارد عادی‌سازی می‌کند:

- متن مختصر مختصات که به بدنه ورودی افزوده می‌شود، و
- فیلدهای ساختاریافته در بار زمینه پاسخ خودکار. برچسب‌ها، نشانی‌ها و شرح‌ها/نظرهای ارائه‌شده توسط کانال، نه به‌صورت درون‌خطی در بدنه کاربر، بلکه توسط بلوک JSON فراداده نامطمئن مشترک در پرامپت رندر می‌شوند.

در حال حاضر پشتیبانی می‌شود:

- **Telegram** (پین‌های مکان + مکان‌ها + مکان‌های زنده)
- **WhatsApp** (locationMessage + liveLocationMessage)
- **Matrix** (`m.location` با `geo_uri`)

## قالب‌بندی متن

مکان‌ها به‌صورت خط‌های خوانا و بدون براکت رندر می‌شوند:

- پین:
  - `📍 48.858844, 2.294351 ±12m`
- مکان نام‌دار:
  - `📍 48.858844, 2.294351 ±12m`
- اشتراک‌گذاری زنده:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

اگر کانال شامل برچسب، نشانی، یا شرح/نظر باشد، در بار زمینه حفظ می‌شود و در پرامپت به‌صورت JSON نامطمئن محصورشده ظاهر می‌شود:

````text
Location (untrusted metadata):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## فیلدهای زمینه

وقتی مکانی وجود داشته باشد، این فیلدها به `ctx` افزوده می‌شوند:

- `LocationLat` (عدد)
- `LocationLon` (عدد)
- `LocationAccuracy` (عدد، متر؛ اختیاری)
- `LocationName` (رشته؛ اختیاری)
- `LocationAddress` (رشته؛ اختیاری)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (بولی)
- `LocationCaption` (رشته؛ اختیاری)

رندرکننده پرامپت، `LocationName`، `LocationAddress` و `LocationCaption` را به‌عنوان فراداده نامطمئن در نظر می‌گیرد و آن‌ها را از طریق همان مسیر JSON محدودشده‌ای سریال‌سازی می‌کند که برای سایر زمینه‌های کانال استفاده می‌شود.

## یادداشت‌های کانال

- **Telegram**: مکان‌ها به `LocationName/LocationAddress` نگاشت می‌شوند؛ مکان‌های زنده از `live_period` استفاده می‌کنند.
- **WhatsApp**: `locationMessage.comment` و `liveLocationMessage.caption` مقدار `LocationCaption` را پر می‌کنند.
- **Matrix**: `geo_uri` به‌عنوان مکان پین‌شده تجزیه می‌شود؛ ارتفاع نادیده گرفته می‌شود و `LocationIsLive` همیشه false است.

## مرتبط

- [دستور مکان (گره‌ها)](/fa/nodes/location-command)
- [ثبت تصویر با دوربین](/fa/nodes/camera)
- [درک رسانه](/fa/nodes/media-understanding)
