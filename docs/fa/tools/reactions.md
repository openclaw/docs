---
read_when:
    - کار با واکنش‌ها در هر کانال
    - درک تفاوت واکنش‌های ایموجی در پلتفرم‌های مختلف
summary: معناشناسی ابزار واکنش در همهٔ کانال‌های پشتیبانی‌شده
title: واکنش‌ها
x-i18n:
    generated_at: "2026-04-29T23:45:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

عامل می‌تواند با استفاده از ابزار `message` و کنش `react`، واکنش‌های ایموجی را روی پیام‌ها اضافه و حذف کند. رفتار واکنش بسته به کانال و سازوکار انتقال متفاوت است.

## نحوه کار

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- هنگام افزودن واکنش، `emoji` الزامی است.
- برای حذف واکنش(های) بات، `emoji` را روی یک رشته خالی (`""`) تنظیم کنید.
- برای حذف یک ایموجی مشخص، `remove: true` را تنظیم کنید (به `emoji` غیرخالی نیاز دارد).

## رفتار کانال

<AccordionGroup>
  <Accordion title="Discord و Slack">
    - `emoji` خالی همه واکنش‌های بات روی پیام را حذف می‌کند.
    - `remove: true` فقط ایموجی مشخص‌شده را حذف می‌کند.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` خالی واکنش‌های برنامه روی پیام را حذف می‌کند.
    - `remove: true` فقط ایموجی مشخص‌شده را حذف می‌کند.

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` خالی واکنش‌های بات را حذف می‌کند.
    - `remove: true` نیز واکنش‌ها را حذف می‌کند، اما همچنان برای اعتبارسنجی ابزار به `emoji` غیرخالی نیاز دارد.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` خالی واکنش بات را حذف می‌کند.
    - `remove: true` در داخل به ایموجی خالی نگاشت می‌شود (همچنان در فراخوانی ابزار به `emoji` نیاز دارد).

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
    - اعلان‌های واکنش ورودی با `channels.signal.reactionNotifications` کنترل می‌شوند: `"off"` آن‌ها را غیرفعال می‌کند، `"own"` (پیش‌فرض) وقتی کاربران به پیام‌های بات واکنش نشان می‌دهند رویداد صادر می‌کند، و `"all"` برای همه واکنش‌ها رویداد صادر می‌کند.

  </Accordion>
</AccordionGroup>

## سطح واکنش

پیکربندی `reactionLevel` برای هر کانال کنترل می‌کند که عامل تا چه حد گسترده از واکنش‌ها استفاده کند. مقدارها معمولاً `off`، `ack`، `minimal` یا `extensive` هستند.

- [reactionLevel در Telegram](/fa/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel در WhatsApp](/fa/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

برای تنظیم میزان فعال بودن واکنش عامل به پیام‌ها در هر پلتفرم، `reactionLevel` را روی کانال‌های جداگانه تنظیم کنید.

## مرتبط

- [ارسال عامل](/fa/tools/agent-send) — ابزار `message` که شامل `react` است
- [کانال‌ها](/fa/channels) — پیکربندی ویژه هر کانال
