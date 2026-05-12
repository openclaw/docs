---
read_when:
    - کار با واکنش‌ها در هر کانال
    - درک تفاوت واکنش‌های ایموجی در پلتفرم‌های مختلف
summary: معناشناسی ابزار واکنش در همه کانال‌های پشتیبانی‌شده
title: واکنش‌ها
x-i18n:
    generated_at: "2026-05-12T01:01:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

عامل می‌تواند با استفاده از ابزار `message` و کنش `react`، واکنش‌های ایموجی را به پیام‌ها اضافه یا از آن‌ها حذف کند. رفتار واکنش بسته به کانال و ترابرد متفاوت است.

## نحوه کارکرد

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- هنگام افزودن واکنش، `emoji` الزامی است.
- برای حذف واکنش(های) ربات، `emoji` را روی یک رشته خالی (`""`) تنظیم کنید.
- برای حذف یک ایموجی مشخص، `remove: true` را تنظیم کنید (به `emoji` غیرخالی نیاز دارد).
- در کانال‌هایی که از واکنش‌های وضعیت پشتیبانی می‌کنند، تنظیم `trackToolCalls: true` روی یک
  واکنش به زمان اجرا اجازه می‌دهد از آن پیام واکنش‌داده‌شده برای واکنش‌های پیشرفت ابزار
  در ادامه همان نوبت استفاده کند.

## رفتار کانال

<AccordionGroup>
  <Accordion title="Discord و Slack">
    - `emoji` خالی همه واکنش‌های ربات روی پیام را حذف می‌کند.
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
    - `remove: true` آن واکنش ایموجی مشخص را حذف می‌کند.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - از ابزار `feishu_reaction` با کنش‌های `add`، `remove` و `list` استفاده کنید.
    - افزودن/حذف به `emoji_type` نیاز دارد؛ حذف همچنین به `reaction_id` نیاز دارد.

  </Accordion>

  <Accordion title="Signal">
    - اعلان‌های واکنش ورودی توسط `channels.signal.reactionNotifications` کنترل می‌شوند: `"off"` آن‌ها را غیرفعال می‌کند، `"own"` (پیش‌فرض) وقتی کاربران به پیام‌های ربات واکنش نشان می‌دهند رویداد منتشر می‌کند، و `"all"` برای همه واکنش‌ها رویداد منتشر می‌کند.

  </Accordion>

  <Accordion title="iMessage">
    - واکنش‌های خروجی همان tapbackهای iMessage هستند (`love`، `like`، `dislike`، `laugh`، `emphasize` و `question`).
    - اعلان‌های tapback ورودی توسط `channels.imessage.reactionNotifications` کنترل می‌شوند: `"off"` آن‌ها را غیرفعال می‌کند، `"own"` (پیش‌فرض) وقتی کاربران به پیام‌های نوشته‌شده توسط ربات واکنش نشان می‌دهند رویداد منتشر می‌کند، و `"all"` برای همه tapbackهای فرستندگان مجاز رویداد منتشر می‌کند.

  </Accordion>
</AccordionGroup>

## سطح واکنش

پیکربندی `reactionLevel` برای هر کانال کنترل می‌کند که عامل تا چه اندازه از واکنش‌ها استفاده کند. مقدارها معمولا `off`، `ack`، `minimal` یا `extensive` هستند.

- [Telegram reactionLevel](/fa/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/fa/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

برای تنظیم میزان فعال بودن واکنش عامل به پیام‌ها در هر پلتفرم، `reactionLevel` را روی کانال‌های جداگانه تنظیم کنید.

## مرتبط

- [ارسال عامل](/fa/tools/agent-send) — ابزار `message` که شامل `react` است
- [کانال‌ها](/fa/channels) — پیکربندی ویژه کانال‌ها
