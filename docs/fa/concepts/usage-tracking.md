---
read_when:
    - در حال اتصال سطوح استفاده/سهمیهٔ ارائه‌دهنده هستید
    - باید رفتار ردیابی مصرف یا الزامات احراز هویت را توضیح دهید
summary: سطوح ردیابی استفاده و الزامات اعتبارنامه‌ها
title: ردیابی استفاده
x-i18n:
    generated_at: "2026-05-06T09:14:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## چیستی

- استفاده/سهمیهٔ provider را مستقیماً از endpointهای usage همان‌ها می‌گیرد.
- هزینهٔ تخمینی ندارد؛ فقط windowهایی که provider گزارش می‌کند.
- خروجی وضعیت خوانا برای انسان به `X% left` نرمال‌سازی می‌شود، حتی وقتی یک API بالادستی سهمیهٔ مصرف‌شده، سهمیهٔ باقی‌مانده، یا فقط شمارش‌های خام را گزارش کند.
- `/status` در سطح session و `session_status` وقتی snapshot زندهٔ session کم‌جزئیات باشد، می‌توانند به آخرین ورودی usage در transcript برگردند. این fallback شمارنده‌های token/cache جاافتاده را پر می‌کند، می‌تواند برچسب model زمان اجرای فعال را بازیابی کند، و وقتی metadata مربوط به session وجود ندارد یا کوچک‌تر است، total بزرگ‌تر و prompt-محور را ترجیح می‌دهد. مقدارهای زندهٔ غیرصفر موجود همچنان برنده‌اند.

## کجا نمایش داده می‌شود

- `/status` در chatها: کارت وضعیت دارای emoji با tokenهای session + هزینهٔ تخمینی (فقط API key). usage مربوط به provider برای **provider مدل فعلی**، وقتی در دسترس باشد، به‌صورت window نرمال‌شدهٔ `X% left` نمایش داده می‌شود.
- `/usage off|tokens|full` در chatها: footer usage برای هر پاسخ (OAuth فقط tokenها را نشان می‌دهد).
- `/usage cost` در chatها: خلاصهٔ هزینهٔ محلی که از logهای session در OpenClaw تجمیع شده است.
- CLI: `openclaw status --usage` تفکیک کامل به‌ازای هر provider را چاپ می‌کند.
- CLI: `openclaw channels list` همان snapshot استفاده را کنار پیکربندی provider چاپ می‌کند (برای رد شدن از آن از `--no-usage` استفاده کنید).
- نوار منوی macOS: بخش «استفاده» زیر «زمینه» (فقط اگر در دسترس باشد).

## Providerها + credentialها

- **Anthropic (Claude)**: tokenهای OAuth در auth profileها.
- **GitHub Copilot**: tokenهای OAuth در auth profileها.
- **Gemini CLI**: tokenهای OAuth در auth profileها.
  - usage در JSON به `stats` برمی‌گردد؛ `stats.cached` به `cacheRead` نرمال‌سازی می‌شود.
- **OpenAI Codex**: tokenهای OAuth در auth profileها (وقتی وجود داشته باشد از accountId استفاده می‌شود).
- **MiniMax**: API key یا auth profile مربوط به MiniMax OAuth. OpenClaw سطح سهمیهٔ `minimax`، `minimax-cn`، و `minimax-portal` را یکسان در نظر می‌گیرد، وقتی MiniMax OAuth ذخیره‌شده وجود داشته باشد آن را ترجیح می‌دهد، و در غیر این صورت به `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`، یا `MINIMAX_API_KEY` برمی‌گردد. polling استفاده، host مربوط به Coding Plan را وقتی پیکربندی شده باشد از `models.providers.minimax-portal.baseUrl` یا `models.providers.minimax.baseUrl` استخراج می‌کند، و در غیر این صورت از host مربوط به MiniMax CN استفاده می‌کند. فیلدهای خام `usage_percent` / `usagePercent` در MiniMax به معنی سهمیهٔ **باقی‌مانده** هستند، بنابراین OpenClaw پیش از نمایش آن‌ها را معکوس می‌کند؛ فیلدهای مبتنی بر شمارش وقتی وجود داشته باشند برنده‌اند.
  - برچسب‌های window مربوط به coding-plan وقتی فیلدهای ساعت/دقیقهٔ provider وجود داشته باشند از آن‌ها می‌آیند، سپس به بازهٔ `start_time` / `end_time` برمی‌گردند.
  - اگر endpoint مربوط به coding-plan مقدار `model_remains` برگرداند، OpenClaw ورودی chat-model را ترجیح می‌دهد، وقتی فیلدهای صریح `window_hours` / `window_minutes` وجود نداشته باشند برچسب window را از timestampها استخراج می‌کند، و نام model را در برچسب plan قرار می‌دهد.
- **Xiaomi MiMo**: API key از طریق env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: API key از طریق env/config/auth store.

وقتی هیچ auth قابل‌استفاده‌ای برای usage مربوط به provider قابل resolve نباشد، usage پنهان می‌شود. Providerها می‌توانند منطق auth usage اختصاصی Plugin ارائه کنند؛ در غیر این صورت OpenClaw به credentialهای OAuth/API-key مطابق از auth profileها، متغیرهای محیطی، یا config برمی‌گردد.

## مرتبط

- [استفاده از token و هزینه‌ها](/fa/reference/token-use)
- [استفاده و هزینه‌های API](/fa/reference/api-usage-costs)
- [cache کردن prompt](/fa/reference/prompt-caching)
