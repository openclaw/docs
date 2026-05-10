---
read_when:
    - شما سریع‌ترین چرخهٔ توسعهٔ محلی را می‌خواهید (bun + watch)
    - با مشکلات نصب، وصله، یا اسکریپت‌های چرخهٔ عمر Bun مواجه شدید
summary: 'گردش کار Bun (آزمایشی): نصب‌ها و نکات احتیاطی در مقایسه با pnpm'
title: Bun (آزمایشی)
x-i18n:
    generated_at: "2026-05-10T19:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun برای **زمان اجرای Gateway توصیه نمی‌شود** (مشکلات شناخته‌شده با WhatsApp و Telegram). برای تولید از Node استفاده کنید.
</Warning>

Bun یک زمان اجرای محلی اختیاری برای اجرای مستقیم TypeScript است (`bun run ...`، `bun --watch ...`). مدیر بستهٔ پیش‌فرض همچنان `pnpm` است، که کاملاً پشتیبانی می‌شود و ابزارهای مستندات از آن استفاده می‌کنند. Bun نمی‌تواند از `pnpm-lock.yaml` استفاده کند و آن را نادیده می‌گیرد.

## نصب

<Steps>
  <Step title="نصب وابستگی‌ها">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` در gitignore هستند، بنابراین تغییری در repo ایجاد نمی‌شود. برای رد کردن کامل نوشتن lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="ساخت و آزمون">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## اسکریپت‌های چرخهٔ حیات

Bun اسکریپت‌های چرخهٔ حیات وابستگی‌ها را مسدود می‌کند مگر اینکه صریحاً قابل اعتماد اعلام شوند. برای این repo، اسکریپت‌هایی که معمولاً مسدود می‌شوند لازم نیستند:

- `baileys` `preinstall` -- بررسی می‌کند که نسخهٔ اصلی Node >= 20 باشد (OpenClaw به‌صورت پیش‌فرض از Node 24 استفاده می‌کند و همچنان از Node 22 LTS، در حال حاضر `22.16+`، پشتیبانی می‌کند)
- `protobufjs` `postinstall` -- هشدارهایی دربارهٔ طرح‌های نسخه‌گذاری ناسازگار صادر می‌کند (بدون artifactهای ساخت)

اگر با مشکلی در زمان اجرا روبه‌رو شدید که به این اسکریپت‌ها نیاز دارد، آن‌ها را صریحاً قابل اعتماد اعلام کنید:

```sh
bun pm trust baileys protobufjs
```

## نکات احتیاطی

برخی اسکریپت‌ها هنوز pnpm را به‌صورت hardcode دارند (برای مثال `docs:build`، `ui:*`، `protocol:check`). فعلاً آن‌ها را از طریق pnpm اجرا کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Node.js](/fa/install/node)
- [به‌روزرسانی](/fa/install/updating)
