---
read_when:
    - کار با واکنش‌ها در هر کانال
    - درک تفاوت واکنش‌های ایموجی در پلتفرم‌های مختلف
summary: معنای ابزار واکنش در همهٔ کانال‌های پشتیبانی‌شده
title: واکنش‌ها
x-i18n:
    generated_at: "2026-07-12T10:59:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

عامل با کنش `react` از ابزار `message`، واکنش‌های ایموجی را اضافه و حذف می‌کند. رفتار بسته به کانال متفاوت است.

## نحوهٔ کار

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- هنگام افزودن واکنش، `emoji` الزامی است.
- برای حذف واکنش(های) ربات در کانال‌هایی که از این قابلیت پشتیبانی می‌کنند، `emoji` را روی رشتهٔ خالی (`""`) تنظیم کنید.
- برای حذف یک ایموجی مشخص، `remove: true` را تنظیم کنید (`emoji` باید خالی نباشد).
- در کانال‌های دارای واکنش‌های وضعیت، تنظیم `trackToolCalls: true` روی یک واکنش به محیط اجرا اجازه می‌دهد در همان نوبت، از پیام واکنش‌داده‌شده برای واکنش‌های بعدیِ پیشرفت ابزار دوباره استفاده کند.

## رفتار کانال‌ها

<AccordionGroup>
  <Accordion title="Discord و Slack">
    - `emoji` خالی همهٔ واکنش‌های ربات روی پیام را حذف می‌کند.
    - `remove: true` فقط ایموجی مشخص‌شده را حذف می‌کند.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - فقط افزودن واکنش پشتیبانی می‌شود: `emoji` الزامی است و نباید خالی باشد.
    - حذف واکنش هنوز به فراخوانی حذف متصل نشده است؛ به‌جای آنکه `remove: true` بی‌سروصدا هیچ کاری نکند، با خطایی صریح رد می‌شود.
    - ربات Talk باید با قابلیت `reaction` ثبت شده باشد (به [مستندات کانال Nextcloud Talk](/fa/channels/nextcloud-talk) مراجعه کنید).

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` خالی واکنش‌های ربات را حذف می‌کند.
    - `remove: true` نیز واکنش‌ها را حذف می‌کند، اما برای اعتبارسنجی ابزار همچنان به `emoji` غیرخالی نیاز دارد.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` خالی واکنش ربات را حذف می‌کند.
    - `remove: true` در داخل به ایموجی خالی نگاشت می‌شود (در فراخوانی ابزار همچنان به `emoji` نیاز دارد).
    - WhatsApp برای هر پیام یک جایگاه واکنش ربات دارد؛ ارسال واکنشی جدید به‌جای انباشتن چند ایموجی، واکنش قبلی را جایگزین می‌کند.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - برای افزودن و حذف، `emoji` باید غیرخالی باشد.
    - `remove: true` همان واکنش ایموجی مشخص را حذف می‌کند.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - از همان کنش `react` سایر کانال‌ها استفاده می‌کند (افزودن/حذف/فهرست‌کردن از طریق شناسه‌های واکنش پیام)، نه ابزاری جداگانه.
    - افزودن به `emoji` غیرخالی نیاز دارد (به یک `emoji_type` در Feishu نگاشت می‌شود؛ برای مثال `SMILE`، `THUMBSUP` و `HEART`).
    - `remove: true` به `emoji` غیرخالی نیاز دارد و واکنش خود ربات را که با آن نوع ایموجی مطابقت دارد حذف می‌کند.
    - `emoji` خالی همراه با `clearAll: true` همهٔ واکنش‌های ربات روی پیام را حذف می‌کند.

  </Accordion>

  <Accordion title="Signal">
    - اعلان‌های واکنش ورودی با `channels.signal.reactionNotifications` کنترل می‌شوند: `"off"` آن‌ها را غیرفعال می‌کند، `"own"` (پیش‌فرض) هنگامی که کاربران به پیام‌های ربات واکنش نشان می‌دهند رویداد منتشر می‌کند، `"all"` برای همهٔ واکنش‌ها رویداد منتشر می‌کند و `"allowlist"` فقط برای فرستندگان موجود در `channels.signal.reactionAllowlist` رویداد منتشر می‌کند.

  </Accordion>

  <Accordion title="iMessage">
    - واکنش‌های خروجی، پاسخ‌های لمسی iMessage هستند (`love`، `like`، `dislike`، `laugh`، `emphasize` و `question`)؛ برای افزودن واکنش، `emoji` باید به یکی از این انواع نگاشت شود.
    - `remove: true` بدون یک نوع پاسخ لمسی شناخته‌شده، همهٔ انواع پاسخ لمسی را حذف می‌کند؛ همراه با یک نوع شناخته‌شده، فقط همان مورد را حذف می‌کند.

  </Accordion>
</AccordionGroup>

## سطح واکنش

تنظیم `reactionLevel` برای هر کانال، دفعات ارسال واکنش‌های خود عامل را محدود می‌کند. مقادیر: `off`، `ack`، `minimal` یا `extensive`.

- [اعلان‌های واکنش Telegram](/fa/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (پیش‌فرض `minimal`)
- [سطح واکنش WhatsApp](/fa/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (پیش‌فرض `minimal`)
- [واکنش‌های Signal](/fa/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (پیش‌فرض `minimal`)

## مرتبط

- [ارسال عامل](/fa/tools/agent-send) - ابزار `message` که شامل `react` است
- [کانال‌ها](/fa/channels) - پیکربندی ویژهٔ هر کانال
