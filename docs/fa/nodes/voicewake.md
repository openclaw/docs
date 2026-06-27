---
read_when:
    - تغییر رفتار یا پیش‌فرض‌های کلمات بیدارباش صوتی
    - افزودن پلتفرم‌های Node جدیدی که به همگام‌سازی واژهٔ بیدارباش نیاز دارند
summary: واژه‌های بیدارباش صوتی سراسری (تحت مالکیت Gateway) و نحوهٔ همگام‌سازی آن‌ها میان گره‌ها
title: بیدارسازی صوتی
x-i18n:
    generated_at: "2026-06-27T18:04:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw **واژه‌های بیدارباش را به‌عنوان یک فهرست سراسری واحد** در نظر می‌گیرد که مالک آن **Gateway** است.

- **هیچ واژه بیدارباش سفارشیِ مختص هر گره** وجود ندارد.
- **هر رابط کاربریِ گره/برنامه می‌تواند** این فهرست را ویرایش کند؛ تغییرات توسط Gateway پایدارسازی و برای همه پخش می‌شوند.
- macOS و iOS کلیدهای محلی **فعال/غیرفعال کردن Voice Wake** را نگه می‌دارند (تجربه کاربری محلی + مجوزها متفاوت‌اند).
- Android در حال حاضر Voice Wake را خاموش نگه می‌دارد و در زبانه Voice از جریان دستی میکروفون استفاده می‌کند.

## ذخیره‌سازی (میزبان Gateway)

واژه‌های بیدارباش و قواعد مسیریابی در پایگاه داده وضعیت Gateway ذخیره می‌شوند:

- `~/.openclaw/state/openclaw.sqlite`

جدول‌های فعال عبارت‌اند از:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

فایل‌های قدیمی `settings/voicewake.json` و `settings/voicewake-routing.json`
فقط ورودی‌های مهاجرت doctor هستند؛ زمان اجرا جدول‌های SQLite را می‌خواند و می‌نویسد.

## پروتکل

### روش‌ها

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` با پارامترهای `{ triggers: string[] }` → `{ triggers: string[] }`

نکته‌ها:

- محرک‌ها نرمال‌سازی می‌شوند (فاصله‌های ابتدا و انتها حذف می‌شود، مقدارهای خالی کنار گذاشته می‌شوند). فهرست‌های خالی به پیش‌فرض‌ها برمی‌گردند.
- محدودیت‌ها برای ایمنی اعمال می‌شوند (سقف تعداد/طول).

### روش‌های مسیریابی (محرک → مقصد)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` با پارامترهای `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

شکل `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

مقصدهای مسیر دقیقاً یکی از این‌ها را پشتیبانی می‌کنند:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### رویدادها

- بار داده `voicewake.changed` برابر با `{ triggers: string[] }`
- بار داده `voicewake.routing.changed` برابر با `{ config: VoiceWakeRoutingConfig }`

دریافت‌کنندگان:

- همه سرویس‌گیرنده‌های WebSocket (برنامه macOS، WebChat، و غیره)
- همه گره‌های متصل (iOS/Android)، و همچنین هنگام اتصال گره، به‌صورت ارسال اولیه «وضعیت فعلی».

## رفتار سرویس‌گیرنده

### برنامه macOS

- از فهرست سراسری برای کنترل محرک‌های `VoiceWakeRuntime` استفاده می‌کند.
- ویرایش «واژه‌های محرک» در تنظیمات Voice Wake، `voicewake.set` را فراخوانی می‌کند و سپس برای همگام نگه داشتن دیگر سرویس‌گیرنده‌ها به پخش تکیه می‌کند.

### گره iOS

- از فهرست سراسری برای تشخیص محرک در `VoiceWakeManager` استفاده می‌کند.
- ویرایش Wake Words در Settings، `voicewake.set` را (از طریق Gateway WS) فراخوانی می‌کند و همچنین تشخیص محلی واژه بیدارباش را پاسخ‌گو نگه می‌دارد.

### گره Android

- Voice Wake در حال حاضر در زمان اجرای Android/Settings غیرفعال است.
- صدای Android به‌جای محرک‌های واژه بیدارباش، از ضبط دستی میکروفون در زبانه Voice استفاده می‌کند.

## مرتبط

- [حالت گفت‌وگو](/fa/nodes/talk)
- [یادداشت‌های صوتی و صدا](/fa/nodes/audio)
- [درک رسانه](/fa/nodes/media-understanding)
