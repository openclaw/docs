---
read_when:
    - نصب برنامه macOS
    - تصمیم‌گیری بین حالت Gateway محلی و راه‌دور در macOS
    - در حال جست‌وجوی دانلودهای نسخهٔ منتشرشدهٔ برنامهٔ macOS
summary: برنامه نوار منوی OpenClaw برای macOS را نصب و استفاده کنید
title: برنامه macOS
x-i18n:
    generated_at: "2026-06-28T00:14:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

برنامه macOS، **همراه نوار منو**ی OpenClaw است. وقتی به یک
رابط کاربری tray بومی، اعلان‌های مجوز macOS، اعلان‌ها، WebChat، ورودی صوتی،
Canvas، یا ابزارهای node میزبانی‌شده روی Mac مانند `system.run` نیاز دارید، از آن استفاده کنید.

اگر فقط به CLI و Gateway نیاز دارید، از [شروع کار](/fa/start/getting-started) شروع کنید.

## دانلود

ساخت‌های برنامه macOS را از
[انتشارهای GitHub مربوط به OpenClaw](https://github.com/openclaw/openclaw/releases) دانلود کنید.
وقتی یک انتشار شامل دارایی‌های برنامه macOS باشد، به دنبال این‌ها بگردید:

- `OpenClaw-<version>.dmg` (ترجیحی)
- `OpenClaw-<version>.zip`

برخی انتشارها فقط شامل CLI، شواهد، یا دارایی‌های Windows هستند. اگر جدیدترین
انتشار دارایی برنامه macOS ندارد، از جدیدترین انتشاری که دارد استفاده کنید، یا برنامه را
از منبع با [راه‌اندازی توسعه macOS](/fa/platforms/mac/dev-setup) بسازید.

## اجرای نخست

1. **OpenClaw.app** را نصب و اجرا کنید.
2. چک‌لیست مجوزهای macOS را کامل کنید.
3. حالت **محلی** یا **راه‌دور** را انتخاب کنید.
4. اگر برنامه درخواست کرد، CLI مربوط به `openclaw` را نصب کنید.
5. WebChat را از نوار منو باز کنید و یک پیام آزمایشی بفرستید.

برای مسیر راه‌اندازی CLI/Gateway، از [شروع کار](/fa/start/getting-started) استفاده کنید.
برای بازیابی مجوزها، از [مجوزهای macOS](/fa/platforms/mac/permissions) استفاده کنید.

## انتخاب حالت Gateway

| حالت   | چه زمانی از آن استفاده کنید                                                                  | صفحه جزئیات                                        |
| ------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| محلی  | این Mac باید Gateway را اجرا کند و آن را با launchd زنده نگه دارد.                         | [Gateway روی macOS](/fa/platforms/mac/bundled-gateway) |
| راه‌دور | میزبان دیگری Gateway را اجرا می‌کند و این Mac باید آن را از طریق SSH، LAN، یا Tailnet کنترل کند. | [کنترل راه‌دور](/fa/platforms/mac/remote)            |

حالت محلی به CLI نصب‌شده `openclaw` نیاز دارد. برنامه می‌تواند آن را نصب کند، یا می‌توانید
[Gateway روی macOS](/fa/platforms/mac/bundled-gateway) را دنبال کنید.

## مالکیت‌های برنامه

- وضعیت نوار منو، اعلان‌ها، سلامت، و WebChat.
- اعلان‌های مجوز macOS برای صفحه‌نمایش، میکروفون، گفتار، خودکارسازی، و دسترس‌پذیری.
- ابزارهای node محلی مانند Canvas، ضبط دوربین/صفحه‌نمایش، اعلان‌ها، و `system.run`.
- اعلان‌های تأیید اجرا برای فرمان‌های میزبانی‌شده روی Mac.
- تونل‌های SSH در حالت راه‌دور یا اتصال‌های مستقیم Gateway.

این برنامه جایگزین Gateway مربوط به OpenClaw یا مستندات عمومی CLI **نمی‌شود**. پیکربندی
اصلی Gateway، ارائه‌دهندگان، plugins، کانال‌ها، ابزارها، و امنیت در
مستندات خودشان قرار دارند.

## صفحات جزئیات macOS

| کار                                     | بخوانید                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| نصب یا اشکال‌زدایی سرویس CLI/Gateway | [Gateway روی macOS](/fa/platforms/mac/bundled-gateway)                                          |
| دور نگه داشتن وضعیت از پوشه‌های همگام‌سازی‌شده با ابر   | [Gateway روی macOS](/fa/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| اشکال‌زدایی کشف برنامه و اتصال‌پذیری     | [Gateway روی macOS](/fa/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| درک رفتار launchd              | [چرخه عمر Gateway](/fa/platforms/mac/child-process)                                           |
| رفع مشکلات مجوزها یا signing/TCC    | [مجوزهای macOS](/fa/platforms/mac/permissions)                                             |
| اتصال به یک Gateway راه‌دور              | [کنترل راه‌دور](/fa/platforms/mac/remote)                                                     |
| خواندن وضعیت نوار منو و بررسی‌های سلامت   | [نوار منو](/fa/platforms/mac/menu-bar), [بررسی‌های سلامت](/fa/platforms/mac/health)                 |
| استفاده از رابط کاربری گفت‌وگوی تعبیه‌شده                 | [WebChat](/fa/platforms/mac/webchat)                                                           |
| استفاده از بیدارباش صوتی یا push-to-talk           | [بیدارباش صوتی](/fa/platforms/mac/voicewake)                                                      |
| استفاده از Canvas و پیوندهای عمیق Canvas         | [Canvas](/fa/platforms/mac/canvas)                                                             |
| میزبانی PeekabooBridge برای خودکارسازی رابط کاربری    | [پل Peekaboo](/fa/platforms/mac/peekaboo)                                                  |
| پیکربندی تأییدهای فرمان              | [تأییدهای اجرا](/fa/tools/exec-approvals), [جزئیات پیشرفته](/fa/tools/exec-approvals-advanced) |
| بررسی فرمان‌های node روی Mac و IPC برنامه    | [IPC در macOS](/fa/platforms/mac/xpc)                                                             |
| ضبط گزارش‌ها                             | [گزارش‌گیری macOS](/fa/platforms/mac/logging)                                                     |
| ساخت از منبع                        | [راه‌اندازی توسعه macOS](/fa/platforms/mac/dev-setup)                                                 |

## مرتبط

- [پلتفرم‌ها](/fa/platforms)
- [شروع کار](/fa/start/getting-started)
- [Gateway](/fa/gateway)
- [تأییدهای اجرا](/fa/tools/exec-approvals)
