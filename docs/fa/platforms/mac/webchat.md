---
read_when:
    - اشکال‌زدایی نمای WebChat مک یا درگاه بازگشت حلقوی
summary: نحوهٔ تعبیهٔ WebChatِ Gateway در برنامهٔ مک و اشکال‌زدایی آن
title: وب‌چت (macOS)
x-i18n:
    generated_at: "2026-04-29T23:12:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 16
---

برنامه نوار منوی macOS رابط کاربری WebChat را به‌عنوان یک نمای بومی SwiftUI در خود جای می‌دهد. این برنامه
به Gateway متصل می‌شود و برای agent انتخاب‌شده به‌طور پیش‌فرض از **جلسه اصلی** استفاده می‌کند
(همراه با یک تعویض‌گر جلسه برای جلسه‌های دیگر).

- **حالت محلی**: مستقیماً به WebSocket محلی Gateway متصل می‌شود.
- **حالت راه دور**: پورت کنترل Gateway را از طریق SSH فوروارد می‌کند و از آن
  تونل به‌عنوان سطح داده استفاده می‌کند.

## راه‌اندازی و اشکال‌زدایی

- دستی: منوی Lobster → «باز کردن چت».
- باز شدن خودکار برای آزمایش:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- لاگ‌ها: `./scripts/clawlog.sh` (زیرسیستم `ai.openclaw`، دسته `WebChatSwiftUI`).

## نحوه اتصال آن

- سطح داده: روش‌های WS در Gateway یعنی `chat.history`، `chat.send`، `chat.abort`،
  `chat.inject` و رویدادهای `chat`، `agent`، `presence`، `tick`، `health`.
- `chat.history` ردیف‌های رونوشت نرمال‌سازی‌شده برای نمایش را برمی‌گرداند: تگ‌های دستورالعمل درون‌خطی
  از متن قابل مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار به‌صورت متن ساده
  (از جمله `<tool_call>...</tool_call>`،
  `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`،
  `<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شده فراخوانی ابزار) و
  توکن‌های کنترلی مدل به‌صورت ASCII/تمام‌عرض که نشت کرده‌اند حذف می‌شوند، ردیف‌های assistant که فقط شامل
  توکن خاموش هستند مانند دقیقاً `NO_REPLY` / `no_reply` حذف می‌شوند،
  و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.
- جلسه: به‌طور پیش‌فرض روی جلسه اصلی (`main`، یا زمانی که دامنه
  سراسری است `global`) قرار دارد. رابط کاربری می‌تواند بین جلسه‌ها جابه‌جا شود.
- onboarding از یک جلسه اختصاصی استفاده می‌کند تا راه‌اندازی اجرای اول را جدا نگه دارد.

## سطح امنیتی

- حالت راه دور فقط پورت کنترل WebSocket مربوط به Gateway را از طریق SSH فوروارد می‌کند.

## محدودیت‌های شناخته‌شده

- رابط کاربری برای جلسه‌های چت بهینه شده است (نه یک سندباکس کامل مرورگر).

## مرتبط

- [WebChat](/fa/web/webchat)
- [برنامه macOS](/fa/platforms/macos)
