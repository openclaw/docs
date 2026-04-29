---
read_when:
    - تغییر رفتار یا پیش‌فرض‌های واژه‌های بیدارباش صوتی
    - افزودن پلتفرم‌های Node جدید که به همگام‌سازی واژهٔ بیدارباش نیاز دارند
summary: واژه‌های بیدارباش صوتی سراسری (متعلق به Gateway) و نحوهٔ همگام‌سازی آن‌ها در میان گره‌ها
title: بیدارسازی صوتی
x-i18n:
    generated_at: "2026-04-29T23:09:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw **واژه‌های بیدارساز را به‌عنوان یک فهرست سراسری واحد** در نظر می‌گیرد که مالک آن **Gateway** است.

- هیچ **واژه بیدارساز سفارشی برای هر Node** وجود ندارد.
- **هر رابط کاربری Node/برنامه می‌تواند** فهرست را ویرایش کند؛ تغییرات توسط Gateway پایدار می‌شوند و برای همه پخش می‌شوند.
- macOS و iOS کلیدهای محلی **فعال/غیرفعال کردن بیدارسازی صوتی** را نگه می‌دارند (تجربه کاربری محلی + مجوزها متفاوت‌اند).
- Android در حال حاضر بیدارسازی صوتی را خاموش نگه می‌دارد و در زبانه صدا از جریان میکروفون دستی استفاده می‌کند.

## ذخیره‌سازی (میزبان Gateway)

واژه‌های بیدارساز روی دستگاه gateway در این مسیر ذخیره می‌شوند:

- `~/.openclaw/settings/voicewake.json`

شکل:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## پروتکل

### روش‌ها

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` با پارامترهای `{ triggers: string[] }` → `{ triggers: string[] }`

نکات:

- محرک‌ها عادی‌سازی می‌شوند (فاصله‌های ابتدا و انتها حذف می‌شوند، موارد خالی کنار گذاشته می‌شوند). فهرست‌های خالی به پیش‌فرض‌ها برمی‌گردند.
- محدودیت‌ها برای ایمنی اعمال می‌شوند (سقف تعداد/طول).

### روش‌های مسیریابی (محرک → هدف)

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

هدف‌های مسیر دقیقاً از یکی از این موارد پشتیبانی می‌کنند:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### رویدادها

- بار داده `voicewake.changed` برابر با `{ triggers: string[] }`
- بار داده `voicewake.routing.changed` برابر با `{ config: VoiceWakeRoutingConfig }`

دریافت‌کنندگان آن:

- همه کلاینت‌های WebSocket (برنامه macOS، WebChat و غیره)
- همه Nodeهای متصل (iOS/Android)، و همچنین هنگام اتصال Node به‌عنوان ارسال اولیه «وضعیت فعلی».

## رفتار کلاینت

### برنامه macOS

- از فهرست سراسری برای دروازه‌بانی محرک‌های `VoiceWakeRuntime` استفاده می‌کند.
- ویرایش «واژه‌های محرک» در تنظیمات بیدارسازی صوتی، `voicewake.set` را فراخوانی می‌کند و سپس برای همگام نگه‌داشتن سایر کلاینت‌ها به پخش تکیه می‌کند.

### Node در iOS

- از فهرست سراسری برای تشخیص محرک در `VoiceWakeManager` استفاده می‌کند.
- ویرایش واژه‌های بیدارساز در تنظیمات، `voicewake.set` را (از طریق Gateway WS) فراخوانی می‌کند و همچنین تشخیص محلی واژه بیدارساز را پاسخ‌گو نگه می‌دارد.

### Node در Android

- بیدارسازی صوتی در حال حاضر در زمان اجرای Android/تنظیمات غیرفعال است.
- صدای Android به‌جای محرک‌های واژه بیدارساز، از ضبط دستی میکروفون در زبانه صدا استفاده می‌کند.

## مرتبط

- [حالت گفتگو](/fa/nodes/talk)
- [یادداشت‌های صوتی و صدا](/fa/nodes/audio)
- [درک رسانه](/fa/nodes/media-understanding)
