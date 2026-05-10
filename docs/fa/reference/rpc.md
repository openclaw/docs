---
read_when:
    - افزودن یا تغییر یکپارچه‌سازی‌های خارجی CLI
    - اشکال‌زدایی آداپتورهای RPC (signal-cli، imsg)
summary: آداپتورهای RPC برای CLIهای خارجی (signal-cli, imsg) و الگوهای Gateway
title: آداپتورهای RPC
x-i18n:
    generated_at: "2026-05-10T20:05:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63556f140bee55821fa0a09ff9808e163728049f8db4c58f7bb4ceca6e1cac1a
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw از طریق JSON-RPC با CLIهای خارجی یکپارچه می‌شود. امروز از دو الگو استفاده می‌شود.

## الگوی A: دیمون HTTP (signal-cli)

- `signal-cli` به‌صورت دیمون با JSON-RPC روی HTTP اجرا می‌شود.
- جریان رویداد SSE است (`/api/v1/events`).
- پروب سلامت: `/api/v1/check`.
- وقتی `channels.signal.autoStart=true` باشد، OpenClaw مالک چرخهٔ حیات است.

برای راه‌اندازی و endpointها به [Signal](/fa/channels/signal) مراجعه کنید.

## الگوی B: فرایند فرزند stdio (imsg)

- OpenClaw، `imsg rpc` را به‌عنوان فرایند فرزند برای [iMessage](/fa/channels/imessage) اجرا می‌کند.
- JSON-RPC به‌صورت خط‌به‌خط روی stdin/stdout جدا می‌شود (هر خط یک شیء JSON).
- هیچ پورت TCP و هیچ دیمونی لازم نیست.

روش‌های اصلی استفاده‌شده:

- `watch.subscribe` → اعلان‌ها (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (پروب/عیب‌یابی)

برای راه‌اندازی قدیمی و آدرس‌دهی (`chat_id` ترجیح داده می‌شود) به [iMessage](/fa/channels/imessage) مراجعه کنید.

## رهنمودهای آداپتور

- Gateway مالک فرایند است (شروع/توقف به چرخهٔ حیات provider گره خورده است).
- کلاینت‌های RPC را تاب‌آور نگه دارید: timeoutها، راه‌اندازی دوباره هنگام خروج.
- شناسه‌های پایدار (مثلاً `chat_id`) را به رشته‌های نمایشی ترجیح دهید.

## مرتبط

- [پروتکل Gateway](/fa/gateway/protocol)
