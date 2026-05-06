---
read_when:
    - تغییر رفتار یا پیش‌فرض‌های کلمات بیدارباش صوتی
    - افزودن پلتفرم‌های جدید Node که به همگام‌سازی کلمهٔ بیدارباش نیاز دارند
summary: واژه‌های بیدارکنندهٔ صوتی سراسری (متعلق به Gateway) و نحوهٔ همگام‌سازی آن‌ها در میان گره‌ها
title: بیدارسازی صوتی
x-i18n:
    generated_at: "2026-05-06T09:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw با **واژه‌های بیدارباش به‌عنوان یک فهرست سراسری واحد** برخورد می‌کند که مالک آن **Gateway** است.

- **هیچ واژه بیدارباش سفارشی مختص هر node وجود ندارد**.
- **هر رابط کاربری node/app می‌تواند** فهرست را ویرایش کند؛ تغییرات توسط Gateway پایدار می‌شوند و برای همه پخش می‌شوند.
- macOS و iOS کلیدهای محلی **فعال/غیرفعال‌سازی بیدارباش صوتی** را نگه می‌دارند (تجربه کاربری محلی + مجوزها متفاوت‌اند).
- Android در حال حاضر بیدارباش صوتی را خاموش نگه می‌دارد و در زبانه Voice از جریان دستی میکروفن استفاده می‌کند.

## ذخیره‌سازی (میزبان Gateway)

واژه‌های بیدارباش روی دستگاه Gateway در این مسیر ذخیره می‌شوند:

- `~/.openclaw/settings/voicewake.json`

شکل:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## پروتکل

### متدها

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` با پارامترهای `{ triggers: string[] }` → `{ triggers: string[] }`

نکات:

- محرک‌ها نرمال‌سازی می‌شوند (فاصله‌های ابتدا و انتها حذف می‌شوند، موارد خالی حذف می‌شوند). فهرست‌های خالی به مقادیر پیش‌فرض برمی‌گردند.
- محدودیت‌ها برای ایمنی اعمال می‌شوند (سقف تعداد/طول).

### متدهای مسیریابی (محرک → هدف)

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

اهداف مسیر دقیقاً از یکی از این‌ها پشتیبانی می‌کنند:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### رویدادها

- محتوای `voicewake.changed` به‌شکل `{ triggers: string[] }`
- محتوای `voicewake.routing.changed` به‌شکل `{ config: VoiceWakeRoutingConfig }`

چه کسانی آن را دریافت می‌کنند:

- همه کلاینت‌های WebSocket (اپ macOS، WebChat و غیره)
- همه nodeهای متصل (iOS/Android)، و همچنین هنگام اتصال node به‌عنوان ارسال اولیه «وضعیت فعلی».

## رفتار کلاینت

### اپ macOS

- از فهرست سراسری برای کنترل محرک‌های `VoiceWakeRuntime` استفاده می‌کند.
- ویرایش «واژه‌های محرک» در تنظیمات بیدارباش صوتی، `voicewake.set` را فراخوانی می‌کند و سپس برای همگام نگه داشتن سایر کلاینت‌ها به پخش تکیه می‌کند.

### node در iOS

- از فهرست سراسری برای تشخیص محرک در `VoiceWakeManager` استفاده می‌کند.
- ویرایش واژه‌های بیدارباش در تنظیمات، `voicewake.set` را فراخوانی می‌کند (از طریق Gateway WS) و همچنین تشخیص محلی واژه بیدارباش را پاسخ‌گو نگه می‌دارد.

### node در Android

- بیدارباش صوتی در حال حاضر در زمان‌اجرای Android/تنظیمات غیرفعال است.
- صدای Android به‌جای محرک‌های واژه بیدارباش، از ضبط دستی میکروفن در زبانه Voice استفاده می‌کند.

## مرتبط

- [حالت گفت‌وگو](/fa/nodes/talk)
- [یادداشت‌های صوتی و صدا](/fa/nodes/audio)
- [درک رسانه](/fa/nodes/media-understanding)
