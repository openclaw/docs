---
read_when:
    - کار روی کد یا آزمون‌های زمان اجرای عامل OpenClaw
    - اجرای جریان‌های lint، typecheck و live test برای agent-runtime
summary: 'جریان کاری توسعه‌دهنده برای زمان اجرای عامل OpenClaw: ساخت، آزمون، و اعتبارسنجی زنده'
title: گردش‌کار زمان اجرای عامل OpenClaw
x-i18n:
    generated_at: "2026-06-27T18:05:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

یک گردش‌کار معقول برای کار روی محیط اجرای عامل OpenClaw در OpenClaw.

## بررسی نوع و linting

- گیت محلی پیش‌فرض: `pnpm check`
- گیت ساخت: `pnpm build` وقتی تغییر می‌تواند روی خروجی ساخت، بسته‌بندی، یا مرزهای بارگذاری تنبل/ماژول اثر بگذارد
- گیت کامل برای فرود تغییرات محیط اجرای عامل: `pnpm check && pnpm test`

## اجرای تست‌های محیط اجرای عامل

مجموعه تست محیط اجرای عامل را مستقیماً با Vitest اجرا کنید:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

برای شامل کردن تمرین ارائه‌دهنده زنده:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

این مجموعه‌های اصلی تست واحد محیط اجرای عامل را پوشش می‌دهد:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## تست دستی

جریان پیشنهادی:

- دروازه را در حالت توسعه اجرا کنید:
  - `pnpm gateway:dev`
- عامل را مستقیماً تحریک کنید:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- از TUI برای اشکال‌زدایی تعاملی استفاده کنید:
  - `pnpm tui`

برای رفتار فراخوانی ابزار، برای یک کنش `read` یا `exec` پرامپت بدهید تا بتوانید جریان ابزار و مدیریت payload را ببینید.

## بازنشانی از ابتدا

وضعیت زیر دایرکتوری وضعیت OpenClaw نگهداری می‌شود. مقدار پیش‌فرض `~/.openclaw` است. اگر `OPENCLAW_STATE_DIR` تنظیم شده باشد، به‌جای آن از همان دایرکتوری استفاده کنید.

برای بازنشانی همه‌چیز:

- `openclaw.json` برای پیکربندی
- `agents/<agentId>/agent/auth-profiles.json` برای پروفایل‌های احراز هویت مدل (کلیدهای API + OAuth)
- `credentials/` برای وضعیت ارائه‌دهنده/کانال که هنوز بیرون از مخزن پروفایل احراز هویت نگهداری می‌شود
- `agents/<agentId>/sessions/` برای تاریخچه نشست عامل
- `agents/<agentId>/sessions/sessions.json` برای نمایه نشست
- `sessions/` اگر مسیرهای legacy وجود دارند
- `workspace/` اگر یک workspace خالی می‌خواهید

اگر فقط می‌خواهید نشست‌ها را بازنشانی کنید، `agents/<agentId>/sessions/` را برای آن عامل حذف کنید. اگر می‌خواهید احراز هویت را نگه دارید، `agents/<agentId>/agent/auth-profiles.json` و هر وضعیت ارائه‌دهنده زیر `credentials/` را در جای خود باقی بگذارید.

## منابع

- [تست](/fa/help/testing)
- [شروع به کار](/fa/start/getting-started)

## مرتبط

- [معماری محیط اجرای عامل OpenClaw](/fa/agent-runtime-architecture)
