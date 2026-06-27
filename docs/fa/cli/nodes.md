---
read_when:
    - شما گره‌های جفت‌شده را مدیریت می‌کنید (دوربین‌ها، صفحه‌نمایش، بوم)
    - باید درخواست‌ها را تأیید کنید یا فرمان‌های node را فراخوانی کنید
summary: مرجع CLI برای `openclaw nodes` (وضعیت، جفت‌سازی، فراخوانی، دوربین/بوم/صفحه‌نمایش)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:26:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
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

`nodes list` جدول‌های در انتظار/جفت‌شده را چاپ می‌کند. ردیف‌های جفت‌شده شامل سن جدیدترین اتصال (Last Connect) هستند.
از `--connected` برای نمایش فقط گره‌های در حال حاضر متصل استفاده کنید. از `--last-connected <duration>` برای
فیلتر کردن به گره‌هایی استفاده کنید که در یک بازه زمانی متصل شده‌اند (برای مثال `24h`، `7d`).
از `nodes remove --node <id|name|ip>` برای حذف جفت‌سازی یک گره استفاده کنید. برای یک
گره مبتنی بر دستگاه، این کار نقش `node` دستگاه را در `devices/paired.json` لغو می‌کند
و نشست‌های دارای نقش گره آن را قطع می‌کند (یک دستگاه با نقش ترکیبی ردیف خود را نگه می‌دارد و
فقط نقش `node` را از دست می‌دهد؛ یک دستگاه فقط-گره حذف می‌شود)؛ همچنین هر
رکورد جفت‌سازی گره منطبق و قدیمی متعلق به Gateway را پاک می‌کند. `operator.pairing` می‌تواند
ردیف‌های گره غیر-اپراتور را حذف کند؛ فراخواننده با توکن دستگاه که نقش گره خودش را روی یک
دستگاه با نقش ترکیبی لغو می‌کند، علاوه بر این به `operator.admin` نیاز دارد.

نکته تأیید:

- `openclaw nodes pending` فقط به دامنه جفت‌سازی نیاز دارد.
- `gateway.nodes.pairing.autoApproveCidrs` می‌تواند مرحله در انتظار را فقط برای
  جفت‌سازی دستگاه `role: node` بار اول و صریحاً مورد اعتماد رد کند. به‌طور
  پیش‌فرض خاموش است و ارتقاها را تأیید نمی‌کند.
- `openclaw nodes approve <requestId>` نیازمندی‌های دامنه اضافی را از
  درخواست در انتظار به ارث می‌برد:
  - درخواست بدون فرمان: فقط جفت‌سازی
  - فرمان‌های گره غیر exec: جفت‌سازی + نوشتن
  - `system.run` / `system.run.prepare` / `system.which`: جفت‌سازی + ادمین

## فراخوانی

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

پرچم‌های فراخوانی:

- `--params <json>`: رشته شیء JSON (پیش‌فرض `{}`).
- `--invoke-timeout <ms>`: مهلت زمانی فراخوانی گره (پیش‌فرض `15000`).
- `--idempotency-key <key>`: کلید idempotency اختیاری.
- `system.run` و `system.run.prepare` اینجا مسدود هستند؛ برای اجرای shell از ابزار `exec` با `host=node` استفاده کنید.

برای اجرای shell روی یک گره، به‌جای `openclaw nodes run` از ابزار `exec` با `host=node` استفاده کنید.
CLI مربوط به `nodes` اکنون بر قابلیت‌ها تمرکز دارد: RPC مستقیم از طریق `nodes invoke`، به‌علاوه جفت‌سازی، دوربین،
صفحه، مکان، Canvas و اعلان‌ها. فرمان‌های Canvas توسط Plugin آزمایشی Canvas بسته‌بندی‌شده پیاده‌سازی می‌شوند؛ هسته یک قلاب سازگاری نگه می‌دارد تا آن‌ها همچنان زیر `openclaw nodes canvas` باقی بمانند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [گره‌ها](/fa/nodes)
