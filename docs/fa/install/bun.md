---
read_when:
    - سریع‌ترین چرخهٔ توسعهٔ محلی را می‌خواهید (bun + watch)
    - با مشکلات نصب، وصله یا اسکریپت‌های چرخهٔ حیات Bun مواجه شده‌اید
summary: 'گردش‌کار Bun (آزمایشی): نصب‌ها و نکات دردسرساز در مقایسه با pnpm'
title: Bun (آزمایشی)
x-i18n:
    generated_at: "2026-05-07T13:24:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun برای **زمان اجرای Gateway توصیه نمی‌شود** (مشکلات شناخته‌شده با WhatsApp و Telegram). برای تولید از Node استفاده کنید.
</Warning>

Bun یک runtime محلی اختیاری برای اجرای مستقیم TypeScript است (`bun run ...`، `bun --watch ...`). مدیر بستهٔ پیش‌فرض همچنان `pnpm` است که به‌طور کامل پشتیبانی می‌شود و ابزارهای مستندات از آن استفاده می‌کنند. Bun نمی‌تواند از `pnpm-lock.yaml` استفاده کند و آن را نادیده می‌گیرد.

## نصب

<Steps>
  <Step title="نصب وابستگی‌ها">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` در git نادیده گرفته شده‌اند، بنابراین تغییری در repo ایجاد نمی‌شود. برای رد کردن کامل نوشتن lockfile:

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

Bun اسکریپت‌های چرخهٔ حیات وابستگی‌ها را مسدود می‌کند مگر اینکه صراحتاً مورد اعتماد قرار بگیرند. برای این repo، اسکریپت‌هایی که معمولاً مسدود می‌شوند لازم نیستند:

- `@whiskeysockets/baileys` `preinstall` -- بررسی می‌کند نسخهٔ اصلی Node >= 20 باشد (OpenClaw به‌صورت پیش‌فرض از Node 24 استفاده می‌کند و همچنان از Node 22 LTS، در حال حاضر `22.16+`، پشتیبانی می‌کند)
- `protobufjs` `postinstall` -- هشدارهایی دربارهٔ طرح‌های نسخه‌گذاری ناسازگار صادر می‌کند (بدون artifactهای ساخت)

اگر با مشکل runtime روبه‌رو شدید که به این اسکریپت‌ها نیاز دارد، صریحاً به آن‌ها اعتماد کنید:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## نکات احتیاطی

بعضی اسکریپت‌ها هنوز pnpm را به‌صورت hardcode دارند (برای مثال `docs:build`، `ui:*`، `protocol:check`). فعلاً آن‌ها را از طریق pnpm اجرا کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Node.js](/fa/install/node)
- [به‌روزرسانی](/fa/install/updating)
