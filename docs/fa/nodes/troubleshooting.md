---
read_when:
    - Node متصل است، اما ابزارهای دوربین/بوم/صفحه‌نمایش/اجرا کار نمی‌کنند
    - باید مدل ذهنی تفاوت میان جفت‌سازی Node و تأییدها را درک کنید
summary: عیب‌یابی جفت‌سازی Node، الزامات اجرای پیش‌زمینه، مجوزها و خرابی‌های ابزارها
title: عیب‌یابی Node
x-i18n:
    generated_at: "2026-07-12T10:20:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

از این صفحه زمانی استفاده کنید که یک Node در وضعیت قابل مشاهده است، اما ابزارهای Node کار نمی‌کنند.

## توالی فرمان‌ها

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

سپس بررسی‌های مخصوص Node را اجرا کنید:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

نشانه‌های وضعیت سالم:

- Node متصل است و برای نقش `node` جفت‌سازی شده است.
- خروجی `nodes describe` قابلیت مورد استفاده شما را شامل می‌شود.
- تأییدهای اجرا، حالت و فهرست مجاز مورد انتظار را نشان می‌دهند.

## الزامات پیش‌زمینه

`canvas.*`، `camera.*` و `screen.*` در Nodeهای iOS/Android فقط در پیش‌زمینه قابل استفاده‌اند.

بررسی و رفع سریع:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

اگر `NODE_BACKGROUND_UNAVAILABLE` را مشاهده کردید، برنامه Node را به پیش‌زمینه بیاورید و دوباره تلاش کنید.

## ماتریس مجوزها

| قابلیت                       | iOS                                              | Android                                           | برنامه Node در macOS                   | کد خطای معمول                                  |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------- | -------------------------------------- | ---------------------------------------------- |
| `camera.snap`, `camera.clip` | دوربین (+ میکروفون برای صدای کلیپ)               | دوربین (+ میکروفون برای صدای کلیپ)                | دوربین (+ میکروفون برای صدای کلیپ)     | `*_PERMISSION_REQUIRED`                        |
| `screen.record`              | ضبط صفحه (+ میکروفون اختیاری)                    | اعلان درخواست ضبط صفحه (+ میکروفون اختیاری)      | ضبط صفحه                               | `*_PERMISSION_REQUIRED`                        |
| `computer.act`               | نامرتبط                                          | نامرتبط                                           | دسترس‌پذیری + ضبط صفحه                 | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED`  |
| `location.get`               | هنگام استفاده یا همیشه (بسته به حالت)            | موقعیت مکانی پیش‌زمینه/پس‌زمینه بر اساس حالت     | مجوز موقعیت مکانی                      | `LOCATION_PERMISSION_REQUIRED`                 |
| `system.run`                 | نامرتبط (مسیر میزبان Node)                       | نامرتبط (مسیر میزبان Node)                        | تأییدهای اجرا الزامی است               | `SYSTEM_RUN_DENIED`                            |

## جفت‌سازی در برابر تأییدها

سه دروازه جداگانه موفقیت یک فرمان Node را کنترل می‌کنند:

1. **جفت‌سازی دستگاه**: آیا این Node می‌تواند به Gateway متصل شود؟
2. **سیاست فرمان Node در Gateway**: آیا شناسه فرمان RPC طبق `gateway.nodes.allowCommands` / `denyCommands` و پیش‌فرض‌های پلتفرم مجاز است؟
3. **تأییدهای اجرا**: آیا این Node می‌تواند یک فرمان پوسته مشخص را به‌صورت محلی اجرا کند؟

جفت‌سازی Node یک دروازه هویت/اعتماد است، نه بستری برای تأیید هر فرمان. برای `system.run`، سیاست هر Node در فایل تأییدهای اجرای همان Node (`openclaw approvals get --node ...`) قرار دارد، نه در رکورد جفت‌سازی Gateway.

بررسی‌های سریع:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- جفت‌سازی وجود ندارد: ابتدا دستگاه Node را تأیید کنید.
- فرمانی در `nodes describe` وجود ندارد: سیاست فرمان Node در Gateway و اینکه آیا Node واقعاً هنگام اتصال آن فرمان را اعلام کرده است بررسی کنید.
- جفت‌سازی درست است، اما `system.run` ناموفق است: تأییدهای اجرا/فهرست مجاز را در آن Node اصلاح کنید.

برای اجراهای `host=node` مبتنی بر تأیید، Gateway همچنین اجرا را به `systemRunPlan` متعارف و آماده‌شده مقید می‌کند. اگر فراخوان بعدی، پیش از ارسال اجرای تأییدشده، فرمان، cwd یا فراداده نشست را تغییر دهد، Gateway به‌جای اعتماد به بار داده ویرایش‌شده، اجرا را به‌دلیل عدم تطابق تأیید رد می‌کند.

## کدهای خطای رایج Node

| کد                                     | معنا                                                                                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | برنامه در پس‌زمینه است؛ آن را به پیش‌زمینه بیاورید.                                                                                                                                                  |
| `CAMERA_DISABLED`                      | کلید دوربین در تنظیمات Node غیرفعال است.                                                                                                                                                             |
| `*_PERMISSION_REQUIRED`                | مجوز سیستم‌عامل وجود ندارد یا رد شده است.                                                                                                                                                            |
| `LOCATION_DISABLED`                    | حالت موقعیت مکانی خاموش است.                                                                                                                                                                        |
| `LOCATION_PERMISSION_REQUIRED`         | حالت موقعیت مکانی درخواست‌شده اعطا نشده است.                                                                                                                                                         |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | برنامه در پس‌زمینه است، اما فقط مجوز «هنگام استفاده» وجود دارد.                                                                                                                                      |
| `COMPUTER_DISABLED`                    | گزینه **Allow Computer Control** را در برنامه macOS فعال کنید، سپس به‌روزرسانی جفت‌سازی را تأیید کنید.                                                                                                |
| `ACCESSIBILITY_REQUIRED`               | در تنظیمات سیستم macOS، مجوز دسترس‌پذیری را به بسته فعلی برنامه OpenClaw اعطا کنید.                                                                                                                   |
| `SYSTEM_RUN_DENIED: approval required` | درخواست اجرا به تأیید صریح نیاز دارد.                                                                                                                                                                |
| `SYSTEM_RUN_DENIED: allowlist miss`    | فرمان در حالت فهرست مجاز مسدود شده است. در میزبان‌های Node ویندوز، شکل‌های پوشش‌دهنده پوسته مانند `cmd.exe /c ...` در حالت فهرست مجاز خارج از فهرست تلقی می‌شوند، مگر اینکه از طریق جریان درخواست تأیید شوند. |

## چرخه بازیابی سریع

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

اگر همچنان مشکل باقی است:

- جفت‌سازی دستگاه را دوباره تأیید کنید.
- برنامه Node را دوباره باز کنید (در پیش‌زمینه).
- مجوزهای سیستم‌عامل را دوباره اعطا کنید.
- سیاست تأیید اجرا را از نو ایجاد یا تنظیم کنید.

برای کنترل رایانه، همچنین بررسی کنید که یک عامل دارای قابلیت بینایی ابزار `computer` را ارائه می‌کند، `screen.snapshot` با مجوز ضبط صفحه موفق می‌شود و `/phone status` مجوز موقت یا دائمی Gateway مورد نظر شما را نشان می‌دهد. یک ورودی در `gateway.nodes.denyCommands` همیشه بر `allowCommands` اولویت دارد.

## مطالب مرتبط

- [نمای کلی Nodeها](/fa/nodes)
- [Nodeهای دوربین](/fa/nodes/camera)
- [فرمان موقعیت مکانی](/fa/nodes/location-command)
- [استفاده از رایانه](/fa/nodes/computer-use)
- [تأییدهای اجرا](/fa/tools/exec-approvals)
- [جفت‌سازی Gateway](/fa/gateway/pairing)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
- [عیب‌یابی کانال](/fa/channels/troubleshooting)
