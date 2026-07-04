---
read_when:
    - نصب برنامه macOS
    - تصمیم‌گیری بین حالت Gateway محلی و راه‌دور در macOS
    - در جست‌وجوی دانلودهای انتشار برنامه macOS
summary: نصب و استفاده از برنامه نوار منوی macOS در OpenClaw
title: برنامه macOS
x-i18n:
    generated_at: "2026-07-04T06:41:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

اپ macOS همراه **نوار منوی** OpenClaw است. وقتی به یک رابط کاربری بومی در tray، درخواست‌های مجوز macOS، اعلان‌ها، WebChat، ورودی صوتی، Canvas، یا ابزارهای Node میزبانی‌شده روی Mac مانند `system.run` نیاز دارید، از آن استفاده کنید.

اگر فقط به CLI و Gateway نیاز دارید، از [شروع به کار](/fa/start/getting-started) آغاز کنید.

## دانلود

بیلدهای اپ macOS را از
[انتشارهای GitHub OpenClaw](https://github.com/openclaw/openclaw/releases)
دانلود کنید. وقتی یک انتشار شامل دارایی‌های اپ macOS باشد، به دنبال این موارد بگردید:

- `OpenClaw-<version>.dmg` (ترجیحی)
- `OpenClaw-<version>.zip`

برخی انتشارها فقط شامل CLI، شواهد، یا دارایی‌های Windows هستند. اگر جدیدترین
انتشار دارایی اپ macOS ندارد، از جدیدترین انتشاری که دارد استفاده کنید، یا اپ را
با [راه‌اندازی توسعه macOS](/fa/platforms/mac/dev-setup) از سورس بسازید.

## اولین اجرا

1. **OpenClaw.app** را نصب و اجرا کنید.
2. برای یک Gateway محلی، **این Mac** را انتخاب کنید، یا به یک Gateway راه دور وصل شوید.
3. برای حالت محلی، صبر کنید تا اپ runtime فضای کاربر و Gateway خود را نصب کند.
4. راه‌اندازی provider و فهرست بررسی مجوزهای macOS را کامل کنید.
5. پیام آزمایشی onboarding را ارسال کنید.

برای مسیر راه‌اندازی CLI/Gateway، از [شروع به کار](/fa/start/getting-started) استفاده کنید.
برای بازیابی مجوزها، از [مجوزهای macOS](/fa/platforms/mac/permissions) استفاده کنید.

## انتخاب حالت Gateway

| حالت   | چه زمانی از آن استفاده کنید                                                                 | صفحه جزئیات                                      |
| ------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| محلی   | این Mac باید Gateway را اجرا کند و با launchd آن را زنده نگه دارد.                            | [Gateway روی macOS](/fa/platforms/mac/bundled-gateway) |
| راه دور | میزبان دیگری Gateway را اجرا می‌کند و این Mac باید آن را از طریق SSH، LAN، یا Tailnet کنترل کند. | [کنترل از راه دور](/fa/platforms/mac/remote)        |

حالت محلی به CLI نصب‌شده `openclaw` نیاز دارد. روی یک Mac تازه، اپ پیش از شروع
جادوگر Gateway، CLI و runtime منطبق را به‌صورت خودکار نصب می‌کند.
برای بازیابی دستی، [Gateway روی macOS](/fa/platforms/mac/bundled-gateway) را ببینید.

## مالکیت‌های اپ

- وضعیت نوار منو، اعلان‌ها، سلامت، و WebChat.
- درخواست‌های مجوز macOS برای صفحه‌نمایش، میکروفون، گفتار، automation، و accessibility.
- ابزارهای Node محلی مانند Canvas، ضبط دوربین/صفحه‌نمایش، اعلان‌ها، و `system.run`.
- درخواست‌های تأیید Exec برای فرمان‌های میزبانی‌شده روی Mac.
- تونل‌های SSH حالت راه دور یا اتصال‌های مستقیم Gateway.

اپ جایگزین Gateway یا مستندات عمومی CLI در OpenClaw **نمی‌شود**. پیکربندی اصلی
Gateway، providerها، Pluginها، کانال‌ها، ابزارها، و امنیت در مستندات
خودشان قرار دارند.

## صفحه‌های جزئیات macOS

| کار                                      | بخوانید                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| نصب یا اشکال‌زدایی سرویس CLI/Gateway     | [Gateway روی macOS](/fa/platforms/mac/bundled-gateway)                                         |
| خارج نگه داشتن state از پوشه‌های همگام‌سازی‌شده با ابر | [Gateway روی macOS](/fa/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| اشکال‌زدایی کشف اپ و اتصال‌پذیری         | [Gateway روی macOS](/fa/platforms/mac/bundled-gateway#debug-app-connectivity)                  |
| درک رفتار launchd                        | [چرخه عمر Gateway](/fa/platforms/mac/child-process)                                            |
| رفع مشکلات مجوزها یا signing/TCC         | [مجوزهای macOS](/fa/platforms/mac/permissions)                                                  |
| اتصال به یک Gateway راه دور              | [کنترل از راه دور](/fa/platforms/mac/remote)                                                    |
| خواندن وضعیت نوار منو و بررسی‌های سلامت  | [نوار منو](/fa/platforms/mac/menu-bar), [بررسی‌های سلامت](/fa/platforms/mac/health)               |
| استفاده از رابط گفت‌وگوی embedded        | [WebChat](/fa/platforms/mac/webchat)                                                            |
| استفاده از بیدارباش صوتی یا push-to-talk | [بیدارباش صوتی](/fa/platforms/mac/voicewake)                                                    |
| استفاده از Canvas و deep linkهای Canvas  | [Canvas](/fa/platforms/mac/canvas)                                                              |
| میزبانی PeekabooBridge برای automation رابط کاربری | [پل Peekaboo](/fa/platforms/mac/peekaboo)                                                       |
| پیکربندی تأییدهای فرمان                  | [تأییدهای Exec](/fa/tools/exec-approvals), [جزئیات پیشرفته](/fa/tools/exec-approvals-advanced)     |
| بررسی فرمان‌های Node در Mac و IPC اپ      | [IPC در macOS](/fa/platforms/mac/xpc)                                                           |
| ضبط لاگ‌ها                               | [لاگ‌گیری macOS](/fa/platforms/mac/logging)                                                      |
| ساخت از سورس                             | [راه‌اندازی توسعه macOS](/fa/platforms/mac/dev-setup)                                          |

## مرتبط

- [پلتفرم‌ها](/fa/platforms)
- [شروع به کار](/fa/start/getting-started)
- [Gateway](/fa/gateway)
- [تأییدهای Exec](/fa/tools/exec-approvals)
