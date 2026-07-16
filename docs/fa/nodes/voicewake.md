---
read_when:
    - تغییر رفتار یا مقادیر پیش‌فرض واژه‌های بیدارباش صوتی
    - افزودن پلتفرم‌های جدید Node که به همگام‌سازی واژهٔ بیدارباش نیاز دارند
summary: واژه‌های بیدارباش صوتی سراسری (تحت مالکیت Gateway) و نحوه همگام‌سازی آن‌ها میان Nodeها
title: بیدارباش صوتی
x-i18n:
    generated_at: "2026-07-16T16:42:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

واژه‌های بیدارباش **یک فهرست سراسری تحت مالکیت Gateway** هستند — هیچ فهرست سفارشی جداگانه‌ای برای هر Node وجود ندارد. رابط کاربری هر Node یا برنامه‌ای می‌تواند این فهرست را ویرایش کند؛ Gateway تغییر را ماندگار می‌کند و آن را برای همه کلاینت‌های متصل پخش می‌کند.

- **macOS**: کلید محلی فعال/غیرفعال‌کردن بیدارباش صوتی. به macOS 26+ نیاز دارد؛ برای جزئیات زمان اجرا/PTT به [بیدارباش صوتی (macOS)](/fa/platforms/mac/voicewake) مراجعه کنید.
- **iOS**: کلید محلی فعال/غیرفعال‌کردن بیدارباش صوتی در تنظیمات.
- **Android**: کلید محلی فعال/غیرفعال‌کردن بیدارباش صوتی و ویرایشگر واژه‌های بیدارباش در Settings → Voice. به تشخیص گفتار روی دستگاه در Android نیاز دارد.

## ذخیره‌سازی

واژه‌های بیدارباش و قواعد مسیریابی در پایگاه داده وضعیت Gateway قرار دارند؛ به‌طور پیش‌فرض `~/.openclaw/state/openclaw.sqlite` (قابل بازنویسی با `OPENCLAW_STATE_DIR`) و در جدول‌های `voicewake_triggers`، `voicewake_routing_config` و `voicewake_routing_routes`. موارد قدیمی `settings/voicewake.json` و `settings/voicewake-routing.json` فقط ورودی‌های مهاجرت `openclaw doctor --fix` هستند — زمان اجرا هرگز آن‌ها را نمی‌خواند.

## پروتکل

### فهرست محرک‌ها

| متد          | پارامترها                   | نتیجه                   |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | هیچ‌کدام                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` ورودی را نرمال‌سازی می‌کند: فاصله‌های سفید ابتدا و انتها را حذف می‌کند، ورودی‌های خالی را کنار می‌گذارد، حداکثر 32 محرک را نگه می‌دارد و هرکدام را بدون شکستن جفت‌های جانشین به 64 واحد کد UTF-16 کوتاه می‌کند. اگر نتیجه خالی باشد، از مقادیر پیش‌فرض داخلی (`openclaw`، `claude`، `computer`) استفاده می‌شود.

### مسیریابی (محرک به مقصد)

| متد                  | پارامترها                               | نتیجه                               |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | هیچ‌کدام                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

هر `target` مسیر دقیقاً یکی از موارد زیر را پشتیبانی می‌کند:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

محدودیت‌ها: حداکثر 32 مسیر و متن محرک با حداکثر 64 نویسه. محرک‌های مسیر برای تطبیق و تشخیص موارد تکراری با تبدیل به حروف کوچک، حذف علائم نگارشی ابتدا/انتهای هر واژه و ادغام فاصله‌های سفید نرمال‌سازی می‌شوند (`"Hey, Bot!!"` و `"hey bot"` با هم مطابقت دارند و تکراری محسوب می‌شوند) — این نرمال‌سازی از حذف ساده فاصله‌های ابتدا و انتها که برای فهرست سراسری محرک‌های بالا استفاده می‌شود، سخت‌گیرانه‌تر است.

### رویدادها

| رویداد                       | بار داده                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

هر دو برای همه کلاینت‌های WebSocket دارای دامنه خواندن (برنامه macOS، WebChat و موارد مشابه) و همه Nodeهای متصل پخش می‌شوند. هر Node بلافاصله پس از اتصال، هر دو را نیز در قالب ارسال اولیه تصویر لحظه‌ای دریافت می‌کند.

## رفتار کلاینت

- **macOS**: `voicewake.set`/`voicewake.get` را فراخوانی می‌کند و برای همگام‌ماندن با سایر کلاینت‌ها به `voicewake.changed` گوش می‌دهد.
- **iOS**: `voicewake.set`/`voicewake.get` را فراخوانی می‌کند و برای پاسخ‌گو نگه‌داشتن تشخیص محلی واژه بیدارباش به `voicewake.changed` گوش می‌دهد.
- **Android**: `voicewake.set`/`voicewake.get` را فراخوانی می‌کند، به `voicewake.changed` گوش می‌دهد و هنگام فعال‌بودن `voiceWake` را اعلام می‌کند. تشخیص فقط روی دستگاه و در پیش‌زمینه انجام می‌شود؛ هنگامی که Talk، دیکته دستی، ضبط یادداشت صوتی یا گفتار پیام کنترل صدا را در اختیار داشته باشد، تشخیص متوقف می‌شود.

## مرتبط

- [حالت Talk](/fa/nodes/talk)
- [صدا و یادداشت‌های صوتی](/fa/nodes/audio)
- [درک رسانه](/fa/nodes/media-understanding)
