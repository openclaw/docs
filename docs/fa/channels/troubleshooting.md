---
read_when:
    - انتقال کانال وضعیت متصل را نشان می‌دهد اما پاسخ‌ها ناموفق‌اند
    - پیش از ورود به مستندات تفصیلی ارائه‌دهنده، به بررسی‌های مخصوص کانال نیاز دارید
summary: عیب‌یابی سریع در سطح کانال با نشانه‌های خرابی و راه‌حل‌های ویژهٔ هر کانال
title: عیب‌یابی کانال
x-i18n:
    generated_at: "2026-05-10T19:25:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

از این صفحه زمانی استفاده کنید که یک کانال وصل می‌شود اما رفتار آن نادرست است.

## ترتیب فرمان‌ها

ابتدا این‌ها را به‌ترتیب اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

مبنای سالم:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`، `write-capable`، یا `admin-capable`
- بررسی کانال نشان می‌دهد ترابری وصل است و، در صورت پشتیبانی، `works` یا `audit ok`

## WhatsApp

### نشانه‌های خرابی WhatsApp

| نشانه                               | سریع‌ترین بررسی                                      | رفع مشکل                                                                                                                        |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| وصل است اما پاسخ DM نمی‌دهد         | `openclaw pairing list whatsapp`                    | فرستنده را تأیید کنید یا سیاست/فهرست مجاز DM را تغییر دهید.                                                                    |
| پیام‌های گروهی نادیده گرفته می‌شوند | پیکربندی `requireMention` و الگوهای اشاره را بررسی کنید | بات را mention کنید یا سیاست mention را برای آن گروه آسان‌تر کنید.                                                             |
| ورود با QR با 408 منقضی می‌شود      | متغیر محیطی `HTTPS_PROXY` / `HTTP_PROXY` مربوط به Gateway را بررسی کنید | یک پراکسی قابل دسترس تنظیم کنید؛ از `NO_PROXY` فقط برای bypassها استفاده کنید.                                                  |
| قطع اتصال/ورود دوباره تصادفی        | `openclaw channels status --probe` + لاگ‌ها          | reconnectهای اخیر حتی وقتی اکنون وصل است هم علامت‌گذاری می‌شوند؛ لاگ‌ها را زیر نظر بگیرید، Gateway را بازراه‌اندازی کنید، سپس اگر نوسان ادامه داشت دوباره لینک کنید. |
| پاسخ‌ها با چند ثانیه/دقیقه تأخیر می‌رسند | `openclaw doctor --fix`                             | Doctor کلاینت‌های TUI محلی stale و تأییدشده را، وقتی چرخه رویداد Gateway را تضعیف می‌کنند، متوقف می‌کند.                    |

عیب‌یابی کامل: [عیب‌یابی WhatsApp](/fa/channels/whatsapp#troubleshooting)

## Telegram

### نشانه‌های خرابی Telegram

| نشانه                               | سریع‌ترین بررسی                                   | رفع مشکل                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` اما جریان پاسخ قابل استفاده ندارد | `openclaw pairing list telegram`                 | pairing را تأیید کنید یا سیاست DM را تغییر دهید.                                                                            |
| بات آنلاین است اما گروه ساکت می‌ماند | الزام mention و حالت privacy بات را بررسی کنید    | برای دیده‌شدن در گروه، حالت privacy را غیرفعال کنید یا بات را mention کنید.                                                 |
| خطاهای ارسال با خطاهای شبکه          | لاگ‌ها را برای خطاهای فراخوانی API Telegram بررسی کنید | مسیریابی DNS/IPv6/پراکسی به `api.telegram.org` را اصلاح کنید.                                                               |
| راه‌اندازی گزارش می‌دهد `getMe returned 401` | منبع token پیکربندی‌شده را بررسی کنید             | token مربوط به BotFather را دوباره کپی یا بازتولید کنید و `botToken`، `tokenFile`، یا `TELEGRAM_BOT_TOKEN` حساب پیش‌فرض را به‌روزرسانی کنید. |
| polling متوقف می‌شود یا کند دوباره وصل می‌شود | `openclaw logs --follow` برای تشخیص‌های polling   | ارتقا دهید؛ اگر restarts مثبت کاذب هستند، `pollingStallThresholdMs` را تنظیم کنید. توقف‌های پایدار همچنان به پراکسی/DNS/IPv6 اشاره دارند. |
| `setMyCommands` هنگام راه‌اندازی رد می‌شود | لاگ‌ها را برای `BOT_COMMANDS_TOO_MUCH` بررسی کنید | فرمان‌های Telegram مربوط به plugin/skill/سفارشی را کاهش دهید یا منوهای native را غیرفعال کنید.                            |
| پس از ارتقا، allowlist شما را مسدود می‌کند | `openclaw security audit` و allowlistهای پیکربندی | `openclaw doctor --fix` را اجرا کنید یا `@username` را با شناسه‌های عددی فرستنده جایگزین کنید.                              |

عیب‌یابی کامل: [عیب‌یابی Telegram](/fa/channels/telegram#troubleshooting)

## Discord

### نشانه‌های خرابی Discord

| نشانه                                    | سریع‌ترین بررسی                                                        | رفع مشکل                                                                                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| بات آنلاین است اما در guild پاسخ نمی‌دهد  | `openclaw channels status --probe`                                     | guild/channel را مجاز کنید و message content intent را تأیید کنید.                                                                                                      |
| پیام‌های گروهی نادیده گرفته می‌شوند       | لاگ‌ها را برای حذف‌های ناشی از mention gating بررسی کنید              | بات را mention کنید یا `requireMention: false` را برای guild/channel تنظیم کنید.                                                                                        |
| استفاده از typing/token هست اما پیام Discord نیست | لاگ نشست متن دستیار را با `didSendViaMessagingTool: false` نشان می‌دهد | مدل به‌جای فراخوانی ابزار پیام‌رسانی، خصوصی پاسخ داده است. از مدلی با قابلیت اتکای بالا در tool-call استفاده کنید، یا `messages.groupChat.visibleReplies: "automatic"` را برای ارسال خودکار تنظیم کنید. |
| پاسخ‌های DM وجود ندارند                   | `openclaw pairing list discord`                                        | pairing مربوط به DM را تأیید کنید یا سیاست DM را تنظیم کنید.                                                                                                           |

عیب‌یابی کامل: [عیب‌یابی Discord](/fa/channels/discord#troubleshooting)

## Slack

### نشانه‌های خرابی Slack

| نشانه                                  | سریع‌ترین بررسی                            | رفع مشکل                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| socket mode وصل است اما پاسخی نیست     | `openclaw channels status --probe`        | app token + bot token و scopeهای لازم را تأیید کنید؛ در راه‌اندازی‌های مبتنی بر SecretRef مراقب `botTokenStatus` / `appTokenStatus = configured_unavailable` باشید. |
| DMها مسدود شده‌اند                     | `openclaw pairing list slack`             | pairing را تأیید کنید یا سیاست DM را آسان‌تر کنید.                                                                                                  |
| پیام کانال نادیده گرفته می‌شود         | `groupPolicy` و allowlist کانال را بررسی کنید | کانال را مجاز کنید یا سیاست را به `open` تغییر دهید.                                                                                                |

عیب‌یابی کامل: [عیب‌یابی Slack](/fa/channels/slack#troubleshooting)

## iMessage

### نشانه‌های خرابی iMessage

| نشانه                              | سریع‌ترین بررسی                                           | رفع مشکل                                                                   |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` وجود ندارد یا روی غیر macOS شکست می‌خورد | `openclaw channels status --probe --channel imessage`   | OpenClaw را روی Mac دارای Messages اجرا کنید یا از یک wrapper SSH برای `cliPath` استفاده کنید. |
| روی macOS می‌تواند ارسال کند اما دریافت ندارد | مجوزهای privacy macOS برای automation در Messages را بررسی کنید | مجوزهای TCC را دوباره اعطا کنید و فرایند کانال را بازراه‌اندازی کنید. |
| فرستنده DM مسدود شده است            | `openclaw pairing list imessage`                        | pairing را تأیید کنید یا allowlist را به‌روزرسانی کنید.              |

عیب‌یابی کامل:

- [عیب‌یابی iMessage](/fa/channels/imessage#troubleshooting)

## Signal

### نشانه‌های خرابی Signal

| نشانه                         | سریع‌ترین بررسی                              | رفع مشکل                                                      |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Daemon قابل دسترس است اما بات ساکت است | `openclaw channels status --probe`         | نشانی URL/حساب daemon مربوط به `signal-cli` و حالت دریافت را تأیید کنید. |
| DM مسدود شده است               | `openclaw pairing list signal`             | فرستنده را تأیید کنید یا سیاست DM را تنظیم کنید.          |
| پاسخ‌های گروهی فعال نمی‌شوند   | allowlist گروه و الگوهای mention را بررسی کنید | فرستنده/گروه را اضافه کنید یا gating را آسان‌تر کنید.     |

عیب‌یابی کامل: [عیب‌یابی Signal](/fa/channels/signal#troubleshooting)

## QQ Bot

### نشانه‌های خرابی QQ Bot

| نشانه                         | سریع‌ترین بررسی                               | رفع مشکل                                                             |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| بات پاسخ می‌دهد "gone to Mars" | `appId` و `clientSecret` را در پیکربندی تأیید کنید | credentials را تنظیم کنید یا Gateway را بازراه‌اندازی کنید.     |
| پیام‌های ورودی وجود ندارند     | `openclaw channels status --probe`          | credentials را در QQ Open Platform تأیید کنید.                   |
| voice رونویسی نمی‌شود          | پیکربندی ارائه‌دهنده STT را بررسی کنید      | `channels.qqbot.stt` یا `tools.media.audio` را پیکربندی کنید.    |
| پیام‌های proactive نمی‌رسند    | الزامات interaction پلتفرم QQ را بررسی کنید | QQ ممکن است پیام‌های آغازشده توسط بات را بدون interaction اخیر مسدود کند. |

عیب‌یابی کامل: [عیب‌یابی QQ Bot](/fa/channels/qqbot#troubleshooting)

## Matrix

### نشانه‌های خرابی Matrix

| نشانه                              | سریع‌ترین بررسی                         | رفع مشکل                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| وارد شده اما پیام‌های اتاق را نادیده می‌گیرد | `openclaw channels status --probe`     | `groupPolicy`، allowlist اتاق، و mention gating را بررسی کنید.          |
| DMها پردازش نمی‌شوند                | `openclaw pairing list matrix`         | فرستنده را تأیید کنید یا سیاست DM را تنظیم کنید.                         |
| اتاق‌های رمزگذاری‌شده شکست می‌خورند | `openclaw matrix verify status`        | دستگاه را دوباره تأیید کنید، سپس `openclaw matrix verify backup status` را بررسی کنید. |
| بازیابی backup در انتظار/خراب است   | `openclaw matrix verify backup status` | `openclaw matrix verify backup restore` را اجرا کنید یا با recovery key دوباره اجرا کنید. |
| cross-signing/bootstrap نادرست به نظر می‌رسد | `openclaw matrix verify bootstrap`     | secret storage، cross-signing، و وضعیت backup را در یک گذر ترمیم کنید.  |

راه‌اندازی و پیکربندی کامل: [Matrix](/fa/channels/matrix)

## مرتبط

- [Pairing](/fa/channels/pairing)
- [مسیر‌یابی کانال](/fa/channels/channel-routing)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
