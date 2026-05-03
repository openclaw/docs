---
read_when:
    - کار با واکنش‌ها در هر کانال
    - درک تفاوت واکنش‌های ایموجی در پلتفرم‌های مختلف
summary: معناشناسی ابزار واکنش در تمام کانال‌های پشتیبانی‌شده
title: واکنش‌ها
x-i18n:
    generated_at: "2026-05-03T21:42:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

عامل می‌تواند با استفاده از ابزار `message` و کنش `react`، واکنش‌های ایموجی را روی پیام‌ها اضافه و حذف کند. رفتار واکنش بسته به کانال و انتقال متفاوت است.

## نحوهٔ کار

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- هنگام افزودن واکنش، `emoji` الزامی است.
- برای حذف واکنش(های) ربات، `emoji` را روی رشتهٔ خالی (`""`) تنظیم کنید.
- برای حذف یک ایموجی مشخص، `remove: true` را تنظیم کنید (به `emoji` غیرخالی نیاز دارد).
- در کانال‌هایی که از واکنش‌های وضعیت پشتیبانی می‌کنند، `trackToolCalls: true` روی یک واکنش به runtime اجازه می‌دهد از همان پیام واکنش‌داده‌شده برای واکنش‌های پیشرفت ابزار در ادامهٔ همان نوبت استفاده کند.

## رفتار کانال

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` خالی همهٔ واکنش‌های ربات روی پیام را حذف می‌کند.
    - `remove: true` فقط ایموجی مشخص‌شده را حذف می‌کند.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` خالی واکنش‌های برنامه روی پیام را حذف می‌کند.
    - `remove: true` فقط ایموجی مشخص‌شده را حذف می‌کند.

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` خالی واکنش‌های ربات را حذف می‌کند.
    - `remove: true` نیز واکنش‌ها را حذف می‌کند، اما همچنان برای اعتبارسنجی ابزار به `emoji` غیرخالی نیاز دارد.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` خالی واکنش ربات را حذف می‌کند.
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
    - اعلان‌های واکنش ورودی با `channels.signal.reactionNotifications` کنترل می‌شوند: `"off"` آن‌ها را غیرفعال می‌کند، `"own"` (پیش‌فرض) وقتی کاربران به پیام‌های ربات واکنش نشان می‌دهند رویداد منتشر می‌کند، و `"all"` برای همهٔ واکنش‌ها رویداد منتشر می‌کند.

  </Accordion>
</AccordionGroup>

## سطح واکنش

پیکربندی `reactionLevel` برای هر کانال کنترل می‌کند که عامل تا چه حد از واکنش‌ها استفاده کند. مقدارها معمولاً `off`، `ack`، `minimal` یا `extensive` هستند.

- [Telegram reactionLevel](/fa/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/fa/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

برای تنظیم میزان فعال بودن واکنش عامل به پیام‌ها در هر پلتفرم، `reactionLevel` را روی کانال‌های جداگانه تنظیم کنید.

## مرتبط

- [ارسال عامل](/fa/tools/agent-send) — ابزار `message` که شامل `react` است
- [کانال‌ها](/fa/channels) — پیکربندی ویژهٔ کانال
