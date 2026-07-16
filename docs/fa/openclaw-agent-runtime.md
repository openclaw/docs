---
read_when:
    - کار روی کد یا آزمون‌های زمان اجرای عامل OpenClaw
    - اجرای فرایندهای lint، بررسی نوع و آزمون زندهٔ زمان‌اجرای عامل
summary: 'گردش‌کار توسعه‌دهنده برای زمان اجرای عامل OpenClaw: ساخت، آزمون و اعتبارسنجی زنده'
title: گردش کار زمان اجرای عامل OpenClaw
x-i18n:
    generated_at: "2026-07-16T16:37:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

گردش‌کار توسعه‌دهنده برای زمان‌اجرای عامل (`src/agents/`) در مخزن OpenClaw.

## بررسی نوع و لینت

- دروازه پیش‌فرض محلی: `pnpm check` (بررسی نوع، لینت، محافظ‌های خط‌مشی)
- دروازه ساخت: `pnpm build` هنگامی که تغییر می‌تواند بر خروجی ساخت، بسته‌بندی یا مرزهای بارگذاری تنبل/ماژول اثر بگذارد
- دروازه کامل پیش از پوش‌کردن: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## اجرای آزمون‌های زمان‌اجرای عامل

مجموعه‌آزمون‌های واحد زمان‌اجرای عامل را اجرا کنید:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

الگوی glob نخست، مجموعه‌آزمون‌های `agent-tools*`، `agent-settings` و
`agent-tool-definition-adapter*` را نیز پوشش می‌دهد.

آزمون‌های زنده از پیکربندی آزمون واحد مستثنا هستند؛ آن‌ها را از طریق
پوشش‌دهنده زنده اجرا کنید (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند و به اعتبارنامه‌های ارائه‌دهنده نیاز دارد):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## آزمون دستی

- Gateway را در حالت توسعه اجرا کنید (اتصال‌های کانال از طریق `OPENCLAW_SKIP_CHANNELS=1` نادیده گرفته می‌شوند): `pnpm gateway:dev`
- یک نوبت عامل را از طریق Gateway فعال کنید: `pnpm openclaw agent --message "Hello" --thinking low`
- برای اشکال‌زدایی تعاملی از TUI استفاده کنید: `pnpm tui`

برای بررسی رفتار فراخوانی ابزار، درخواست یک کنش `read` یا `exec` را مطرح کنید تا بتوانید
جریان ابزار و مدیریت بار داده را مشاهده کنید.

## بازنشانی به وضعیت پاک

وضعیت در دایرکتوری وضعیت OpenClaw قرار دارد: به‌طور پیش‌فرض `~/.openclaw`، یا
در صورت تنظیم، `$OPENCLAW_STATE_DIR`. مسیرهای نسبی به آن دایرکتوری:

| مسیر                                           | محتوا                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | پیکربندی                                                             |
| `state/openclaw.sqlite`                        | پایگاه داده وضعیت مشترک زمان‌اجرا                                      |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | پروفایل‌های احراز هویت مدل برای هر عامل (کلیدهای API و OAuth) و وضعیت زمان‌اجرا |
| `credentials/`                                 | اعتبارنامه‌های ارائه‌دهنده/کانال خارج از مخزن پروفایل احراز هویت        |
| `agents/<agentId>/sessions/`                   | تاریخچه رونوشت و منابع مهاجرت نشست قدیمی            |
| `sessions/`                                    | مخزن نشست قدیمی تک‌عاملی (فقط نصب‌های قدیمی)              |
| `workspace/`                                   | فضای کاری عامل پیش‌فرض (عامل‌های اضافی از `workspace-<agentId>` استفاده می‌کنند)   |

برای بازنشانی کامل، آن مسیرها را حذف کنید. بازنشانی‌های محدودتر:

- فقط نشست‌ها: `agents/<agentId>/agent/openclaw-agent.sqlite` را حذف نکنید؛ ردیف‌های نشست در کنار سایر وضعیت‌های هر عامل در آنجا قرار دارند. برای آغاز نشستی تازه برای یک گفت‌وگو از `/new` یا `/reset`، و برای نگه‌داری نشست از `openclaw sessions cleanup` استفاده کنید.
- حفظ احراز هویت: `agents/<agentId>/agent/openclaw-agent.sqlite` و `credentials/` را در جای خود نگه دارید.

فایل‌های قدیمی `auth-profiles.json` دیگر هنگام اجرا خوانده نمی‌شوند؛
`openclaw doctor --fix` آن‌ها را به مخزن SQLite وارد می‌کند.

## منابع

- [آزمون](/fa/help/testing)
- [شروع به کار](/fa/start/getting-started)

## مرتبط

- [معماری زمان‌اجرای عامل OpenClaw](/fa/agent-runtime-architecture)
