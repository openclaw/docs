---
read_when:
    - می‌خواهید از MiniMax برای web_search استفاده کنید
    - به یک کلید طرح توکن MiniMax یا توکن OAuth نیاز دارید
    - شما راهنمایی درباره میزبان جست‌وجوی CN/جهانی MiniMax می‌خواهید
summary: جستجوی MiniMax از طریق API جستجوی Token Plan
title: جست‌وجوی MiniMax
x-i18n:
    generated_at: "2026-05-02T12:06:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw از MiniMax به‌عنوان ارائه‌دهنده‌ی `web_search` از طریق API جست‌وجوی MiniMax
Token Plan پشتیبانی می‌کند. این سرویس نتایج جست‌وجوی ساختاریافته‌ای با عنوان‌ها، URLها،
گزیده‌ها و پرس‌وجوهای مرتبط برمی‌گرداند.

## دریافت اعتبارنامه Token Plan

<Steps>
  <Step title="ایجاد کلید">
    یک کلید MiniMax Token Plan را از
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    ایجاد یا کپی کنید.
    راه‌اندازی‌های OAuth می‌توانند به‌جای آن از `MINIMAX_OAUTH_TOKEN` استفاده‌ی مجدد کنند.
  </Step>
  <Step title="ذخیره کلید">
    `MINIMAX_CODE_PLAN_KEY` را در محیط Gateway تنظیم کنید، یا از طریق زیر پیکربندی کنید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw همچنین `MINIMAX_CODING_API_KEY`، `MINIMAX_OAUTH_TOKEN` و
`MINIMAX_API_KEY` را به‌عنوان نام‌های مستعار محیطی می‌پذیرد. `MINIMAX_API_KEY` باید به یک
اعتبارنامه Token Plan دارای قابلیت جست‌وجو اشاره کند؛ کلیدهای معمولی API مدل MiniMax ممکن است
توسط نقطه پایانی جست‌وجوی Token Plan پذیرفته نشوند.

## پیکربندی

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**جایگزین محیطی:** `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`،
`MINIMAX_OAUTH_TOKEN` یا `MINIMAX_API_KEY` را در محیط Gateway تنظیم کنید.
برای نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید.

## انتخاب منطقه

MiniMax Search از این نقاط پایانی استفاده می‌کند:

- سراسری: `https://api.minimax.io/v1/coding_plan/search`
- چین: `https://api.minimaxi.com/v1/coding_plan/search`

اگر `plugins.entries.minimax.config.webSearch.region` تنظیم نشده باشد، OpenClaw
منطقه را به این ترتیب تعیین می‌کند:

1. `tools.web.search.minimax.region` / `webSearch.region` متعلق به Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

یعنی راه‌اندازی چین یا `MINIMAX_API_HOST=https://api.minimaxi.com/...`
به‌طور خودکار MiniMax Search را نیز روی میزبان چین نگه می‌دارد.

حتی وقتی MiniMax را از مسیر OAuth با `minimax-portal` احراز هویت کرده‌اید،
جست‌وجوی وب همچنان با شناسه ارائه‌دهنده `minimax` ثبت می‌شود؛ URL پایه ارائه‌دهنده OAuth
به‌عنوان راهنمای منطقه برای انتخاب میزبان چین/سراسری استفاده می‌شود، و `MINIMAX_OAUTH_TOKEN`
می‌تواند اعتبارنامه bearer مربوط به MiniMax Search را تامین کند.

## پارامترهای پشتیبانی‌شده

MiniMax Search از موارد زیر پشتیبانی می‌کند:

- `query`
- `count` ‏(OpenClaw فهرست نتایج برگشتی را تا تعداد درخواست‌شده کوتاه می‌کند)

فیلترهای ویژه ارائه‌دهنده در حال حاضر پشتیبانی نمی‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه ارائه‌دهنده‌ها و تشخیص خودکار
- [MiniMax](/fa/providers/minimax) -- راه‌اندازی مدل، تصویر، گفتار و احراز هویت
