---
read_when:
    - Node متصل است، اما ابزارهای camera/canvas/screen/exec با شکست مواجه می‌شوند
    - به مدل ذهنی جفت‌سازی Node در برابر تأییدها نیاز دارید
summary: عیب‌یابی جفت‌سازی Node، الزامات پیش‌زمینه، مجوزها و خطاهای ابزار
title: عیب‌یابی Node
x-i18n:
    generated_at: "2026-04-29T23:09:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 16
---

از این صفحه زمانی استفاده کنید که یک Node در وضعیت دیده می‌شود، اما ابزارهای Node شکست می‌خورند.

## نردبان فرمان

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

نشانه‌های سالم:

- Node متصل و برای نقش `node` جفت شده است.
- `nodes describe` قابلیتی را که فراخوانی می‌کنید در بر دارد.
- تأییدهای Exec حالت/فهرست مجاز مورد انتظار را نشان می‌دهند.

## الزامات پیش‌زمینه

`canvas.*`، `camera.*`، و `screen.*` روی Nodeهای iOS/Android فقط در پیش‌زمینه هستند.

بررسی و رفع سریع:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

اگر `NODE_BACKGROUND_UNAVAILABLE` را می‌بینید، برنامه Node را به پیش‌زمینه بیاورید و دوباره تلاش کنید.

## ماتریس مجوزها

| قابلیت                       | iOS                                          | Android                                          | برنامه Node در macOS          | کد خطای معمول                  |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------ | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | دوربین (+ میکروفون برای صدای کلیپ)           | دوربین (+ میکروفون برای صدای کلیپ)               | دوربین (+ میکروفون برای صدای کلیپ) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | ضبط صفحه (+ میکروفون اختیاری)                | اعلان ضبط صفحه (+ میکروفون اختیاری)              | ضبط صفحه                      | `*_PERMISSION_REQUIRED`        |
| `location.get`               | هنگام استفاده یا همیشه (بسته به حالت)        | مکان پیش‌زمینه/پس‌زمینه بر اساس حالت             | مجوز مکان                     | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | ناموجود (مسیر میزبان Node)                   | ناموجود (مسیر میزبان Node)                       | تأییدهای Exec لازم است        | `SYSTEM_RUN_DENIED`            |

## جفت‌سازی در برابر تأییدها

این‌ها دروازه‌های متفاوتی هستند:

1. **جفت‌سازی دستگاه**: آیا این Node می‌تواند به Gateway وصل شود؟
2. **سیاست فرمان Node در Gateway**: آیا شناسه فرمان RPC با `gateway.nodes.allowCommands` / `denyCommands` و پیش‌فرض‌های پلتفرم مجاز است؟
3. **تأییدهای Exec**: آیا این Node می‌تواند یک فرمان shell مشخص را به‌صورت محلی اجرا کند؟

بررسی‌های سریع:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

اگر جفت‌سازی وجود ندارد، ابتدا دستگاه Node را تأیید کنید.
اگر `nodes describe` فرمانی را ندارد، سیاست فرمان Node در Gateway را بررسی کنید و ببینید آیا Node واقعاً هنگام اتصال آن فرمان را اعلام کرده است یا نه.
اگر جفت‌سازی درست است اما `system.run` شکست می‌خورد، تأییدهای Exec/فهرست مجاز را روی آن Node اصلاح کنید.

جفت‌سازی Node یک دروازه هویت/اعتماد است، نه سطح تأیید برای هر فرمان. برای `system.run`، سیاست هر Node در فایل تأییدهای Exec همان Node قرار دارد (`openclaw approvals get --node ...`)، نه در رکورد جفت‌سازی Gateway.

برای اجراهای `host=node` که با تأیید پشتیبانی می‌شوند، Gateway همچنین اجرا را به
`systemRunPlan` متعارف آماده‌شده متصل می‌کند. اگر فراخواننده‌ای بعدی فرمان/cwd یا
فراداده نشست را پیش از ارسال اجرای تأییدشده تغییر دهد، Gateway به‌جای اعتماد به payload ویرایش‌شده،
اجرا را به‌عنوان عدم تطابق تأیید رد می‌کند.

## کدهای خطای رایج Node

- `NODE_BACKGROUND_UNAVAILABLE` → برنامه در پس‌زمینه است؛ آن را به پیش‌زمینه بیاورید.
- `CAMERA_DISABLED` → کلید دوربین در تنظیمات Node غیرفعال است.
- `*_PERMISSION_REQUIRED` → مجوز سیستم‌عامل وجود ندارد/رد شده است.
- `LOCATION_DISABLED` → حالت مکان خاموش است.
- `LOCATION_PERMISSION_REQUIRED` → حالت مکان درخواستی اعطا نشده است.
- `LOCATION_BACKGROUND_UNAVAILABLE` → برنامه در پس‌زمینه است اما فقط مجوز هنگام استفاده وجود دارد.
- `SYSTEM_RUN_DENIED: approval required` → درخواست Exec به تأیید صریح نیاز دارد.
- `SYSTEM_RUN_DENIED: allowlist miss` → فرمان توسط حالت فهرست مجاز مسدود شده است.
  روی میزبان‌های Node ویندوز، شکل‌های shell-wrapper مانند `cmd.exe /c ...` در حالت فهرست مجاز
  به‌عنوان موارد خارج از فهرست مجاز در نظر گرفته می‌شوند، مگر این‌که از طریق جریان پرسش تأیید شده باشند.

## حلقه بازیابی سریع

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

اگر همچنان گیر کرده‌اید:

- جفت‌سازی دستگاه را دوباره تأیید کنید.
- برنامه Node را دوباره باز کنید (پیش‌زمینه).
- مجوزهای سیستم‌عامل را دوباره اعطا کنید.
- سیاست تأیید Exec را دوباره بسازید/تنظیم کنید.

مرتبط:

- [/nodes/index](/fa/nodes/index)
- [/nodes/camera](/fa/nodes/camera)
- [/nodes/location-command](/fa/nodes/location-command)
- [/tools/exec-approvals](/fa/tools/exec-approvals)
- [/gateway/pairing](/fa/gateway/pairing)

## مرتبط

- [نمای کلی Nodeها](/fa/nodes)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
- [عیب‌یابی کانال](/fa/channels/troubleshooting)
