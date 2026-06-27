---
read_when:
    - شما سریع‌ترین چرخه توسعه محلی را می‌خواهید (`bun` + watch)
    - با مشکلات اسکریپت‌های نصب/وصله/چرخهٔ حیات Bun روبه‌رو شدید
summary: 'گردش‌کار Bun (آزمایشی): نصب‌ها و نکات مهم در مقایسه با pnpm'
title: Bun (آزمایشی)
x-i18n:
    generated_at: "2026-06-27T17:57:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun برای **زمان اجرای Gateway توصیه نمی‌شود** (مشکلات شناخته‌شده با WhatsApp و Telegram). برای محیط تولید از Node استفاده کنید.
</Warning>

Bun یک زمان اجرای محلی اختیاری برای اجرای مستقیم TypeScript است (`bun run ...`، `bun --watch ...`). مدیر بستهٔ پیش‌فرض همچنان `pnpm` است که به‌طور کامل پشتیبانی می‌شود و ابزارهای مستندات از آن استفاده می‌کنند. Bun نمی‌تواند از `pnpm-lock.yaml` استفاده کند و آن را نادیده می‌گیرد.

## نصب

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` در gitignore نادیده گرفته شده‌اند، بنابراین تغییری در مخزن ایجاد نمی‌شود. برای رد کردن کامل نوشتن lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## اسکریپت‌های چرخهٔ عمر

Bun اسکریپت‌های چرخهٔ عمر وابستگی‌ها را مسدود می‌کند، مگر اینکه صراحتاً مورد اعتماد قرار گرفته باشند. برای این مخزن، اسکریپت‌هایی که معمولاً مسدود می‌شوند لازم نیستند:

- `baileys` `preinstall` -- بررسی می‌کند که نسخهٔ اصلی Node >= 20 باشد (OpenClaw به‌صورت پیش‌فرض از Node 24 استفاده می‌کند و همچنان از Node 22 LTS، در حال حاضر `22.19+`، پشتیبانی می‌کند)
- `protobufjs` `postinstall` -- هشدارهایی دربارهٔ طرح‌های نسخه‌بندی ناسازگار صادر می‌کند (بدون خروجی ساخت)

اگر با مشکلی در زمان اجرا روبه‌رو شدید که به این اسکریپت‌ها نیاز داشت، صراحتاً به آن‌ها اعتماد کنید:

```sh
bun pm trust baileys protobufjs
```

## نکات احتیاطی

برخی اسکریپت‌ها هنوز pnpm را به‌صورت ثابت در خود دارند (برای مثال `check:docs`، `ui:*`، `protocol:check`). فعلاً آن‌ها را از طریق pnpm اجرا کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Node.js](/fa/install/node)
- [به‌روزرسانی](/fa/install/updating)
