---
read_when:
    - می‌خواهید سریع‌ترین چرخه توسعه محلی را داشته باشید (bun + watch)
    - با مشکلات نصب، وصله، یا اسکریپت‌های چرخهٔ حیات Bun مواجه شده‌اید
summary: 'روند کاری Bun (آزمایشی): نصب‌ها و نکات دردسرساز در مقایسه با pnpm'
title: Bun (آزمایشی)
x-i18n:
    generated_at: "2026-04-29T23:02:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun برای **زمان اجرای Gateway توصیه نمی‌شود** (مشکلات شناخته‌شده با WhatsApp و Telegram). برای محیط تولید از Node استفاده کنید.
</Warning>

Bun یک زمان اجرای محلی اختیاری برای اجرای مستقیم TypeScript است (`bun run ...`، `bun --watch ...`). مدیر بستهٔ پیش‌فرض همچنان `pnpm` است که کاملا پشتیبانی می‌شود و ابزارهای مستندسازی از آن استفاده می‌کنند. Bun نمی‌تواند از `pnpm-lock.yaml` استفاده کند و آن را نادیده می‌گیرد.

## نصب

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` در git نادیده گرفته شده‌اند، بنابراین تغییری در مخزن ایجاد نمی‌شود. برای صرف‌نظر کامل از نوشتن lockfile:

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

Bun اسکریپت‌های چرخهٔ عمر وابستگی‌ها را مسدود می‌کند، مگر اینکه صراحتا مورد اعتماد قرار گرفته باشند. برای این مخزن، اسکریپت‌هایی که معمولا مسدود می‌شوند لازم نیستند:

- `@whiskeysockets/baileys` `preinstall` -- نسخهٔ اصلی Node را بررسی می‌کند که >= 20 باشد (OpenClaw به‌صورت پیش‌فرض از Node 24 استفاده می‌کند و همچنان از Node 22 LTS که فعلا `22.14+` است پشتیبانی می‌کند)
- `protobufjs` `postinstall` -- هشدارهایی دربارهٔ طرح‌های نسخه‌گذاری ناسازگار صادر می‌کند (بدون آرتیفکت‌های ساخت)

اگر با مشکل زمان اجرا مواجه شدید که به این اسکریپت‌ها نیاز دارد، صراحتا به آن‌ها اعتماد کنید:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## نکات احتیاطی

برخی اسکریپت‌ها هنوز pnpm را به‌صورت ثابت در خود دارند (برای مثال `docs:build`، `ui:*`، `protocol:check`). فعلا آن‌ها را از طریق pnpm اجرا کنید.

## مرتبط

- [نمای کلی نصب](/fa/install)
- [Node.js](/fa/install/node)
- [به‌روزرسانی](/fa/install/updating)
