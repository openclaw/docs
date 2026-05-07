---
read_when:
    - شما در حال مدیریت گره‌های جفت‌شده هستید (دوربین‌ها، صفحه‌نمایش، بوم)
    - باید درخواست‌ها را تأیید کنید یا دستورهای Node را فراخوانی کنید
summary: مرجع CLI برای `openclaw nodes` (وضعیت، جفت‌سازی، فراخوانی، دوربین/بوم/صفحه‌نمایش)
title: Nodeها
x-i18n:
    generated_at: "2026-05-07T13:14:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

گره‌های (دستگاه‌های) جفت‌شده را مدیریت کنید و قابلیت‌های گره را فراخوانی کنید.

مرتبط:

- نمای کلی گره‌ها: [گره‌ها](/fa/nodes)
- دوربین: [گره‌های دوربین](/fa/nodes/camera)
- تصاویر: [گره‌های تصویر](/fa/nodes/images)

گزینه‌های رایج:

- `--url`، `--token`، `--timeout`، `--json`

## دستورهای رایج

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

`nodes list` جدول‌های در انتظار/جفت‌شده را چاپ می‌کند. ردیف‌های جفت‌شده شامل سن جدیدترین اتصال (آخرین اتصال) هستند.
از `--connected` برای نمایش فقط گره‌های در حال حاضر متصل استفاده کنید. از `--last-connected <duration>` برای
فیلتر کردن گره‌هایی استفاده کنید که در یک بازه زمانی متصل شده‌اند (مثلاً `24h`، `7d`).
از `nodes remove --node <id|name|ip>` برای حذف رکورد قدیمی جفت‌سازی گره متعلق به Gateway استفاده کنید.

نکته تأیید:

- `openclaw nodes pending` فقط به دامنه جفت‌سازی نیاز دارد.
- `gateway.nodes.pairing.autoApproveCidrs` می‌تواند مرحله در انتظار را فقط برای
  جفت‌سازی دستگاه `role: node` که صراحتاً مورد اعتماد و برای نخستین بار است، رد کند. این گزینه به‌طور
  پیش‌فرض خاموش است و ارتقاها را تأیید نمی‌کند.
- `openclaw nodes approve <requestId>` نیازمندی‌های دامنه اضافی را از درخواست
  در انتظار به ارث می‌برد:
  - درخواست بدون دستور: فقط جفت‌سازی
  - دستورهای node غیر exec: جفت‌سازی + نوشتن
  - `system.run` / `system.run.prepare` / `system.which`: جفت‌سازی + مدیر

## فراخوانی

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

پرچم‌های فراخوانی:

- `--params <json>`: رشته شیء JSON (پیش‌فرض `{}`).
- `--invoke-timeout <ms>`: مهلت زمانی فراخوانی گره (پیش‌فرض `15000`).
- `--idempotency-key <key>`: کلید اختیاری ایدمپوتنسی.
- `system.run` و `system.run.prepare` اینجا مسدود شده‌اند؛ برای اجرای شل از ابزار `exec` با `host=node` استفاده کنید.

برای اجرای شل روی یک گره، به‌جای `openclaw nodes run` از ابزار `exec` با `host=node` استفاده کنید.
CLI گره‌ها اکنون بر قابلیت‌ها متمرکز است: RPC مستقیم از طریق `nodes invoke`، به‌علاوه جفت‌سازی، دوربین،
صفحه، مکان، Canvas، و اعلان‌ها. دستورهای Canvas توسط Plugin آزمایشی Canvas همراه پیاده‌سازی شده‌اند؛ هسته یک قلاب سازگاری نگه می‌دارد تا همچنان زیر `openclaw nodes canvas` باقی بمانند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [گره‌ها](/fa/nodes)
