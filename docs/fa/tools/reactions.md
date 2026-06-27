---
read_when:
    - کار با واکنش‌ها در هر کانال
    - درک تفاوت واکنش‌های ایموجی در پلتفرم‌های مختلف
summary: معناشناسی ابزار واکنش در همه کانال‌های پشتیبانی‌شده
title: واکنش‌ها
x-i18n:
    generated_at: "2026-06-27T19:03:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

عامل می‌تواند با استفاده از ابزار `message` و کنش `react`، واکنش‌های ایموجی را روی پیام‌ها اضافه و حذف کند. رفتار واکنش بسته به کانال و روش انتقال متفاوت است.

## نحوه کارکرد

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- هنگام افزودن واکنش، `emoji` الزامی است.
- برای حذف واکنش(های) ربات، `emoji` را روی رشته خالی (`""`) تنظیم کنید.
- برای حذف یک ایموجی مشخص، `remove: true` را تنظیم کنید (به `emoji` غیرخالی نیاز دارد).
- در کانال‌هایی که از واکنش‌های وضعیت پشتیبانی می‌کنند، `trackToolCalls: true` روی یک واکنش به زمان اجرا اجازه می‌دهد در همان نوبت، از آن پیام واکنش‌داده‌شده برای واکنش‌های پیشرفت ابزار بعدی استفاده کند.

## رفتار کانال

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` خالی همه واکنش‌های ربات روی پیام را حذف می‌کند.
    - `remove: true` فقط ایموجی مشخص‌شده را حذف می‌کند.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` خالی واکنش‌های برنامه روی پیام را حذف می‌کند.
    - `remove: true` فقط ایموجی مشخص‌شده را حذف می‌کند.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - فقط افزودن واکنش‌ها: `emoji` الزامی است و باید غیرخالی باشد.
    - حذف واکنش هنوز پشتیبانی نمی‌شود؛ فراخوانی‌های دارای `remove: true` (یا `emoji` خالی) به‌جای اینکه بی‌سروصدا بدون اثر بمانند، با خطایی روشن رد می‌شوند.
    - لازم است ربات Talk با قابلیت `reaction` ثبت شده باشد (به [مستندات کانال Nextcloud Talk](/fa/channels/nextcloud-talk) مراجعه کنید).

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` خالی واکنش‌های ربات را حذف می‌کند.
    - `remove: true` نیز واکنش‌ها را حذف می‌کند، اما همچنان برای اعتبارسنجی ابزار به `emoji` غیرخالی نیاز دارد.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` خالی واکنش ربات را حذف می‌کند.
    - `remove: true` به‌صورت داخلی به ایموجی خالی نگاشت می‌شود (هنوز به `emoji` در فراخوانی ابزار نیاز دارد).
    - WhatsApp برای هر پیام یک جایگاه واکنش ربات دارد؛ به‌روزرسانی‌های واکنش وضعیت، به‌جای انباشتن چندین ایموجی، همان جایگاه را جایگزین می‌کنند.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - به `emoji` غیرخالی نیاز دارد.
    - `remove: true` همان واکنش ایموجی مشخص را حذف می‌کند.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - از ابزار `feishu_reaction` با کنش‌های `add`، `remove` و `list` استفاده کنید.
    - افزودن/حذف به `emoji_type` نیاز دارد؛ حذف همچنین به `reaction_id` نیاز دارد.

  </Accordion>

  <Accordion title="Signal">
    - اعلان‌های واکنش ورودی با `channels.signal.reactionNotifications` کنترل می‌شوند: `"off"` آن‌ها را غیرفعال می‌کند، `"own"` (پیش‌فرض) وقتی کاربران به پیام‌های ربات واکنش نشان می‌دهند رویداد منتشر می‌کند، و `"all"` برای همه واکنش‌ها رویداد منتشر می‌کند.

  </Accordion>

  <Accordion title="iMessage">
    - واکنش‌های خروجی tapbackهای iMessage هستند (`love`، `like`، `dislike`، `laugh`، `emphasize` و `question`).
    - اعلان‌های tapback ورودی با `channels.imessage.reactionNotifications` کنترل می‌شوند: `"off"` آن‌ها را غیرفعال می‌کند، `"own"` (پیش‌فرض) وقتی کاربران به پیام‌های نوشته‌شده توسط ربات واکنش نشان می‌دهند رویداد منتشر می‌کند، و `"all"` برای همه tapbackها از فرستندگان مجاز رویداد منتشر می‌کند.

  </Accordion>
</AccordionGroup>

## سطح واکنش

پیکربندی `reactionLevel` برای هر کانال کنترل می‌کند که عامل تا چه اندازه گسترده از واکنش‌ها استفاده کند. مقدارها معمولا `off`، `ack`، `minimal` یا `extensive` هستند.

- [reactionLevel در Telegram](/fa/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel در WhatsApp](/fa/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

برای تنظیم اینکه عامل در هر پلتفرم با چه میزان فعالیت به پیام‌ها واکنش نشان دهد، `reactionLevel` را روی کانال‌های جداگانه تنظیم کنید.

## مرتبط

- [ارسال عامل](/fa/tools/agent-send) — ابزار `message` که شامل `react` است
- [کانال‌ها](/fa/channels) — پیکربندی ویژه هر کانال
