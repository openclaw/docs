---
read_when:
    - افزودن یا تغییر یکپارچه‌سازی‌های CLI خارجی
    - اشکال‌زدایی آداپتورهای RPC ‏(signal-cli، imsg)
summary: آداپتورهای RPC برای CLIهای خارجی (signal-cli، imsg) و الگوهای Gateway
title: آداپتورهای RPC
x-i18n:
    generated_at: "2026-07-12T10:48:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ddb3fb741c90fe7b01ba35376b71865584b1e507cf610705392452790fb76f5
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw، CLIهای خارجی را از طریق JSON-RPC یکپارچه می‌کند. در حال حاضر از دو الگو استفاده می‌شود.

## الگوی A: دیمن HTTP (`signal-cli`)

- `signal-cli` به‌صورت دیمن با JSON-RPC روی HTTP اجرا می‌شود.
- جریان رویداد SSE است (`/api/v1/events`).
- کاوشگر سلامت: `/api/v1/check`.
- وقتی `channels.signal.autoStart=true` باشد، OpenClaw چرخهٔ عمر را مدیریت می‌کند.

برای راه‌اندازی و نقاط پایانی، به [Signal](/fa/channels/signal) مراجعه کنید.

## الگوی B: فرایند فرزند stdio (`imsg`)

- OpenClaw، دستور `imsg rpc` را به‌عنوان فرایند فرزند برای [iMessage](/fa/channels/imessage) اجرا می‌کند.
- JSON-RPC روی stdin/stdout به‌صورت سطرجداسازی‌شده است (در هر سطر یک شیء JSON).
- هیچ درگاه TCP و هیچ دیمنی لازم نیست.

متدهای اصلی مورد استفاده:

- `watch.subscribe` ← اعلان‌ها (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (کاوش/عیب‌یابی)

برای راه‌اندازی و آدرس‌دهی (ترجیح `chat_id` بر رشته‌های نمایشی)، به [iMessage](/fa/channels/imessage) مراجعه کنید.

## رهنمودهای آداپتور

- Gateway مالک فرایند است (شروع/توقف به چرخهٔ عمر ارائه‌دهنده وابسته است).
- کلاینت‌های RPC را تاب‌آور نگه دارید: مهلت‌های زمانی و راه‌اندازی مجدد هنگام خروج.
- شناسه‌های پایدار (برای مثال، `chat_id`) را به رشته‌های نمایشی ترجیح دهید.

## مرتبط

- [پروتکل Gateway](/fa/gateway/protocol)
