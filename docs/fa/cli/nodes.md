---
read_when:
    - شما گره‌های جفت‌شده را مدیریت می‌کنید (دوربین‌ها، صفحه‌نمایش، بوم)
    - باید درخواست‌ها را تأیید کنید یا فرمان‌های node را فراخوانی کنید
summary: مرجع CLI برای `openclaw nodes` (وضعیت، جفت‌سازی، فراخوانی، دوربین/بوم/صفحه‌نمایش)
title: Nodeها
x-i18n:
    generated_at: "2026-05-06T17:54:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Nodeهای جفت‌شده (دستگاه‌ها) را مدیریت کنید و قابلیت‌های Node را فراخوانی کنید.

مرتبط:

- نمای کلی Nodeها: [Nodeها](/fa/nodes)
- دوربین: [Nodeهای دوربین](/fa/nodes/camera)
- تصاویر: [Nodeهای تصویر](/fa/nodes/images)

گزینه‌های رایج:

- `--url`, `--token`, `--timeout`, `--json`

## فرمان‌های رایج

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` جدول‌های در انتظار/جفت‌شده را چاپ می‌کند. ردیف‌های جفت‌شده شامل سن جدیدترین اتصال هستند (Last Connect).
از `--connected` برای نمایش فقط Nodeهایی که در حال حاضر متصل هستند استفاده کنید. از `--last-connected <duration>` برای
فیلتر کردن به Nodeهایی استفاده کنید که در یک بازه زمانی متصل شده‌اند (مثلاً `24h`، `7d`).
از `nodes remove --node <id|name|ip>` برای حذف رکورد جفت‌سازی Node قدیمی متعلق به Gateway استفاده کنید.

نکته تأیید:

- `openclaw nodes pending` فقط به دامنه جفت‌سازی نیاز دارد.
- `gateway.nodes.pairing.autoApproveCidrs` می‌تواند مرحله در انتظار را فقط برای
  جفت‌سازی دستگاه `role: node` برای نخستین بار، به‌صورت صریح مورد اعتماد، رد کند. این گزینه به‌صورت
  پیش‌فرض خاموش است و ارتقاها را تأیید نمی‌کند.
- `openclaw nodes approve <requestId>` الزامات دامنه اضافی را از درخواست
  در انتظار به ارث می‌برد:
  - درخواست بدون فرمان: فقط جفت‌سازی
  - فرمان‌های Node غیر exec: جفت‌سازی + نوشتن
  - `system.run` / `system.run.prepare` / `system.which`: جفت‌سازی + مدیر

## فراخوانی

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

پرچم‌های فراخوانی:

- `--params <json>`: رشته شیء JSON (پیش‌فرض `{}`).
- `--invoke-timeout <ms>`: مهلت زمانی فراخوانی Node (پیش‌فرض `15000`).
- `--idempotency-key <key>`: کلید idempotency اختیاری.
- `system.run` و `system.run.prepare` اینجا مسدود هستند؛ برای اجرای shell از ابزار `exec` با `host=node` استفاده کنید.

برای اجرای shell روی یک Node، به‌جای `openclaw nodes run` از ابزار `exec` با `host=node` استفاده کنید.
CLI مربوط به `nodes` اکنون بر قابلیت‌ها متمرکز است: RPC مستقیم از طریق `nodes invoke`، به‌علاوه جفت‌سازی، دوربین،
صفحه‌نمایش، مکان، canvas و اعلان‌ها.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Nodeها](/fa/nodes)
