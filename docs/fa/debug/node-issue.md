---
read_when:
    - اشکال‌زدایی اسکریپت‌های توسعهٔ مختص Node یا خرابی‌های حالت پایش
    - بررسی خرابی‌های بارگذار tsx/esbuild در OpenClaw
summary: یادداشت‌ها و راه‌حل‌های موقت برای از کار افتادن Node + tsx با خطای "__name is not a function"
title: خرابی Node + tsx
x-i18n:
    generated_at: "2026-05-06T17:56:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
---

# خرابی Node + tsx با خطای "\_\_name is not a function"

## خلاصه

اجرای OpenClaw از طریق Node با `tsx` هنگام راه‌اندازی با این خطا شکست می‌خورد:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

این مشکل پس از تغییر اسکریپت‌های توسعه از Bun به `tsx` آغاز شد (کامیت `2871657e`، 2026-01-06). همین مسیر زمان اجرا با Bun کار می‌کرد.

## محیط

- Node: v25.x (روی v25.3.0 مشاهده شده)
- tsx: 4.21.0
- سیستم‌عامل: macOS (احتمال بازتولید روی پلتفرم‌های دیگری که Node 25 را اجرا می‌کنند نیز وجود دارد)

## بازتولید (فقط Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## بازتولید حداقلی در مخزن

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## بررسی نسخه Node

- Node 25.3.0: شکست می‌خورد
- Node 22.22.0 (Homebrew `node@22`): شکست می‌خورد
- Node 24: هنوز اینجا نصب نشده است؛ نیاز به راستی‌آزمایی دارد

## یادداشت‌ها / فرضیه

- `tsx` از esbuild برای تبدیل TS/ESM استفاده می‌کند. گزینه `keepNames` در esbuild یک helper به نام `__name` تولید می‌کند و تعریف‌های تابع را با `__name(...)` می‌پوشاند.
- این خرابی نشان می‌دهد `__name` در زمان اجرا وجود دارد اما تابع نیست، که یعنی این helper برای این ماژول در مسیر loader مربوط به Node 25 وجود ندارد یا بازنویسی شده است.
- مشکلات مشابه مربوط به helper `__name` در مصرف‌کنندگان دیگر esbuild، زمانی که helper وجود نداشته یا بازنویسی شده، گزارش شده‌اند.

## تاریخچه رگرسیون

- `2871657e` (2026-01-06): اسکریپت‌ها از Bun به tsx تغییر کردند تا Bun اختیاری شود.
- پیش از آن (مسیر Bun)، `openclaw status` و `gateway:watch` کار می‌کردند.

## راهکارهای موقت

- از Bun برای اسکریپت‌های توسعه استفاده کنید (بازگردانی موقت فعلی).
- برای بررسی نوع در مخزن از `tsgo` استفاده کنید، سپس خروجی ساخته‌شده را اجرا کنید:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- یادداشت تاریخی: هنگام اشکال‌زدایی این مشکل Node/tsx، در اینجا از `tsc` استفاده شده بود، اما مسیرهای بررسی نوع مخزن اکنون از `tsgo` استفاده می‌کنند.
- در صورت امکان، `keepNames` مربوط به esbuild را در loader مربوط به TS غیرفعال کنید (از درج helper `__name` جلوگیری می‌کند)؛ در حال حاضر tsx این قابلیت را ارائه نمی‌کند.
- Node LTS (22/24) را با `tsx` آزمایش کنید تا مشخص شود آیا مشکل مختص Node 25 است یا نه.

## منابع

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## گام‌های بعدی

- روی Node 22/24 بازتولید کنید تا رگرسیون Node 25 تأیید شود.
- نسخه nightly از `tsx` را آزمایش کنید یا اگر رگرسیون شناخته‌شده‌ای وجود دارد، آن را به نسخه قبلی پین کنید.
- اگر روی Node LTS بازتولید شد، یک بازتولید حداقلی با ردپای پشته `__name` در upstream ثبت کنید.

## مرتبط

- [نصب Node.js](/fa/install/node)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
