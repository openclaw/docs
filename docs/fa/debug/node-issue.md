---
read_when:
    - اشکال‌زدایی اسکریپت‌های توسعه مختص Node یا خرابی‌های حالت پایش
    - بررسی خرابی‌های بارگذار tsx/esbuild در OpenClaw
summary: یادداشت‌ها و راهکارهای موقت برای خرابی Node + tsx با خطای "__name is not a function"
title: خرابی Node + tsx
x-i18n:
    generated_at: "2026-04-29T22:48:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 16
---

# کرش Node + tsx با "\_\_name is not a function"

## خلاصه

اجرای OpenClaw از طریق Node با `tsx` هنگام راه‌اندازی با خطای زیر شکست می‌خورد:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

این مشکل پس از تغییر اسکریپت‌های توسعه از Bun به `tsx` آغاز شد (کامیت `2871657e`، 2026-01-06). همان مسیر زمان اجرا با Bun کار می‌کرد.

## محیط

- Node: v25.x (روی v25.3.0 مشاهده شده)
- tsx: 4.21.0
- سیستم‌عامل: macOS (احتمالاً روی پلتفرم‌های دیگری که Node 25 را اجرا می‌کنند نیز بازتولید می‌شود)

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

- `tsx` از esbuild برای تبدیل TS/ESM استفاده می‌کند. `keepNames` در esbuild یک کمک‌کننده `__name` تولید می‌کند و تعریف‌های تابع را با `__name(...)` می‌پیچد.
- کرش نشان می‌دهد که `__name` وجود دارد اما در زمان اجرا تابع نیست، که یعنی این کمک‌کننده برای این ماژول در مسیر loader مربوط به Node 25 یا وجود ندارد یا بازنویسی شده است.
- مشکلات مشابه مربوط به کمک‌کننده `__name` در مصرف‌کنندگان دیگر esbuild گزارش شده‌اند، وقتی این کمک‌کننده وجود نداشته یا بازنویسی شده است.

## تاریخچه رگرسیون

- `2871657e` (2026-01-06): اسکریپت‌ها از Bun به tsx تغییر کردند تا Bun اختیاری شود.
- قبل از آن (مسیر Bun)، `openclaw status` و `gateway:watch` کار می‌کردند.

## راهکارهای موقت

- استفاده از Bun برای اسکریپت‌های توسعه (بازگردانی موقت فعلی).
- استفاده از `tsgo` برای بررسی نوع مخزن، سپس اجرای خروجی ساخته‌شده:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- یادداشت تاریخی: هنگام اشکال‌زدایی این مشکل Node/tsx از `tsc` استفاده شد، اما مسیرهای بررسی نوع مخزن اکنون از `tsgo` استفاده می‌کنند.
- غیرفعال کردن keepNames در esbuild در loader مربوط به TS در صورت امکان (از درج کمک‌کننده `__name` جلوگیری می‌کند)؛ tsx در حال حاضر این گزینه را ارائه نمی‌دهد.
- آزمایش Node LTS (22/24) با `tsx` برای اینکه مشخص شود آیا مشکل مختص Node 25 است یا نه.

## منابع

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## گام‌های بعدی

- بازتولید روی Node 22/24 برای تأیید رگرسیون Node 25.
- آزمایش نسخه nightly از `tsx` یا قفل کردن به نسخه‌ای قدیمی‌تر، اگر رگرسیون شناخته‌شده‌ای وجود دارد.
- اگر روی Node LTS بازتولید شد، یک بازتولید حداقلی به upstream همراه با stack trace مربوط به `__name` ارسال شود.

## مرتبط

- [نصب Node.js](/fa/install/node)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
