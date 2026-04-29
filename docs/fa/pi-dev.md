---
read_when:
    - کار روی کد یا آزمون‌های یکپارچه‌سازی Pi
    - اجرای جریان‌های lint، بررسی نوع و آزمون زندهٔ مخصوص Pi
summary: 'گردش‌کار توسعه‌دهنده برای یکپارچه‌سازی Pi: ساخت، آزمون، و اعتبارسنجی زنده'
title: گردش‌کار توسعه Pi
x-i18n:
    generated_at: "2026-04-29T23:09:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

یک روند کاری معقول برای کار روی یکپارچه‌سازی Pi در OpenClaw.

## بررسی نوع و لینت‌کردن

- گیت محلی پیش‌فرض: `pnpm check`
- گیت ساخت: `pnpm build` وقتی تغییر می‌تواند بر خروجی ساخت، بسته‌بندی، یا مرزهای بارگذاری تنبل/ماژول اثر بگذارد
- گیت کامل ادغام برای تغییرات سنگین Pi: `pnpm check && pnpm test`

## اجرای آزمون‌های Pi

مجموعه آزمون متمرکز بر Pi را مستقیما با Vitest اجرا کنید:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

برای شامل‌کردن تمرین ارائه‌دهنده زنده:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

این مجموعه‌های اصلی آزمون واحد Pi را پوشش می‌دهد:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## آزمون دستی

روند پیشنهادی:

- Gateway را در حالت توسعه اجرا کنید:
  - `pnpm gateway:dev`
- عامل را مستقیما فعال کنید:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- برای اشکال‌زدایی تعاملی از TUI استفاده کنید:
  - `pnpm tui`

برای رفتار فراخوانی ابزار، یک کنش `read` یا `exec` را درخواست کنید تا بتوانید جریان ابزار و مدیریت بار داده را ببینید.

## بازنشانی از ابتدا

وضعیت زیر پوشه وضعیت OpenClaw قرار دارد. پیش‌فرض `~/.openclaw` است. اگر `OPENCLAW_STATE_DIR` تنظیم شده باشد، به‌جای آن از همان پوشه استفاده کنید.

برای بازنشانی همه‌چیز:

- `openclaw.json` برای پیکربندی
- `agents/<agentId>/agent/auth-profiles.json` برای پروفایل‌های احراز هویت مدل (کلیدهای API + OAuth)
- `credentials/` برای وضعیت ارائه‌دهنده/کانال که هنوز بیرون از مخزن پروفایل احراز هویت قرار دارد
- `agents/<agentId>/sessions/` برای تاریخچه نشست‌های عامل
- `agents/<agentId>/sessions/sessions.json` برای نمایه نشست‌ها
- `sessions/` اگر مسیرهای قدیمی وجود دارند
- `workspace/` اگر یک فضای کاری خالی می‌خواهید

اگر فقط می‌خواهید نشست‌ها را بازنشانی کنید، `agents/<agentId>/sessions/` را برای آن عامل حذف کنید. اگر می‌خواهید احراز هویت را نگه دارید، `agents/<agentId>/agent/auth-profiles.json` و هر وضعیت ارائه‌دهنده زیر `credentials/` را همان‌جا باقی بگذارید.

## منابع

- [آزمون](/fa/help/testing)
- [شروع به کار](/fa/start/getting-started)

## مرتبط

- [معماری یکپارچه‌سازی Pi](/fa/pi)
