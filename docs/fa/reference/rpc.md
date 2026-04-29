---
read_when:
    - افزودن یا تغییر یکپارچه‌سازی‌های CLI خارجی
    - اشکال‌زدایی آداپتورهای RPC (signal-cli, imsg)
summary: آداپتورهای RPC برای CLIهای خارجی (signal-cli، imsg قدیمی) و الگوهای Gateway
title: آداپتورهای RPC
x-i18n:
    generated_at: "2026-04-29T23:32:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw ابزارهای CLI خارجی را از طریق JSON-RPC یکپارچه می‌کند. امروز از دو الگو استفاده می‌شود.

## الگوی A: دیمون HTTP (signal-cli)

- `signal-cli` به‌صورت یک دیمون با JSON-RPC روی HTTP اجرا می‌شود.
- جریان رویداد SSE است (`/api/v1/events`).
- بررسی سلامت: `/api/v1/check`.
- وقتی `channels.signal.autoStart=true` باشد، OpenClaw مالک چرخه عمر است.

برای راه‌اندازی و endpointها، [Signal](/fa/channels/signal) را ببینید.

## الگوی B: فرآیند فرزند stdio (قدیمی: imsg)

> **نکته:** برای راه‌اندازی‌های جدید iMessage، به‌جای آن از [BlueBubbles](/fa/channels/bluebubbles) استفاده کنید.

- OpenClaw، `imsg rpc` را به‌عنوان یک فرآیند فرزند ایجاد می‌کند (یکپارچه‌سازی قدیمی iMessage).
- JSON-RPC به‌صورت خط‌به‌خط روی stdin/stdout ارسال می‌شود (یک شیء JSON در هر خط).
- هیچ پورت TCP و هیچ دیمونی لازم نیست.

متدهای اصلی مورد استفاده:

- `watch.subscribe` → اعلان‌ها (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (کاوش/عیب‌یابی)

برای راه‌اندازی قدیمی و آدرس‌دهی (`chat_id` ترجیح داده می‌شود)، [iMessage](/fa/channels/imessage) را ببینید.

## دستورالعمل‌های آداپتور

- Gateway مالک فرآیند است (شروع/توقف به چرخه عمر provider گره خورده است).
- کلاینت‌های RPC را تاب‌آور نگه دارید: timeoutها، راه‌اندازی مجدد هنگام خروج.
- شناسه‌های پایدار (مثلاً `chat_id`) را به رشته‌های نمایشی ترجیح دهید.

## مرتبط

- [پروتکل Gateway](/fa/gateway/protocol)
