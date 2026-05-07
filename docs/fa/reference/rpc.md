---
read_when:
    - افزودن یا تغییر یکپارچه‌سازی‌های CLI خارجی
    - اشکال‌زدایی آداپتورهای RPC (signal-cli، imsg)
summary: آداپتورهای RPC برای CLIهای خارجی (signal-cli، imsg) و الگوهای Gateway
title: آداپتورهای RPC
x-i18n:
    generated_at: "2026-05-07T01:55:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 446e54d736352f45e6cc6988a1835233cace7f854b6e62c64bb1fae115ce76f6
    source_path: reference/rpc.md
    workflow: 16
---

OpenClaw، CLIهای خارجی را از طریق JSON-RPC یکپارچه می‌کند. امروزه دو الگو استفاده می‌شود.

## الگوی A: daemon مبتنی بر HTTP (signal-cli)

- `signal-cli` به‌صورت daemon با JSON-RPC روی HTTP اجرا می‌شود.
- جریان رویداد SSE است (`/api/v1/events`).
- بررسی سلامت: `/api/v1/check`.
- OpenClaw زمانی مالک چرخهٔ حیات است که `channels.signal.autoStart=true` باشد.

برای راه‌اندازی و endpointها، [Signal](/fa/channels/signal) را ببینید.

## الگوی B: فرایند فرزند stdio (قدیمی: imsg)

> **نکته:** برای راه‌اندازی‌های جدید iMessage، به‌جای آن از [BlueBubbles](/fa/channels/bluebubbles) استفاده کنید.

- OpenClaw، `imsg rpc` را به‌عنوان یک فرایند فرزند اجرا می‌کند (یکپارچه‌سازی قدیمی iMessage).
- JSON-RPC روی stdin/stdout به‌صورت خط‌به‌خط جدا می‌شود (یک شیء JSON در هر خط).
- هیچ پورت TCP و هیچ daemonی لازم نیست.

روش‌های اصلی استفاده‌شده:

- `watch.subscribe` ← اعلان‌ها (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (بررسی/عیب‌یابی)

برای راه‌اندازی قدیمی و آدرس‌دهی (`chat_id` ترجیح داده می‌شود)، [iMessage](/fa/channels/imessage) را ببینید.

## رهنمودهای adapter

- Gateway مالک فرایند است (شروع/توقف به چرخهٔ حیات provider گره خورده است).
- کلاینت‌های RPC را تاب‌آور نگه دارید: timeoutها، راه‌اندازی مجدد هنگام خروج.
- شناسه‌های پایدار (مانند `chat_id`) را به رشته‌های نمایشی ترجیح دهید.

## مرتبط

- [پروتکل Gateway](/fa/gateway/protocol)
