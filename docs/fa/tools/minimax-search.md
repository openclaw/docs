---
read_when:
    - می‌خواهید از MiniMax برای web_search استفاده کنید
    - به یک کلید MiniMax Token Plan یا توکن OAuth نیاز دارید
    - شما راهنمایی دربارهٔ میزبان جست‌وجوی CN/جهانی MiniMax می‌خواهید
summary: MiniMax Search از طریق API جست‌وجوی Token Plan
title: جست‌وجوی MiniMax
x-i18n:
    generated_at: "2026-05-11T20:46:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw از MiniMax به‌عنوان ارائه‌دهنده `web_search` از طریق API جست‌وجوی MiniMax
Token Plan پشتیبانی می‌کند. این API نتایج جست‌وجوی ساختاریافته‌ای شامل عنوان‌ها، URLها،
قطعه‌متن‌ها و پرس‌وجوهای مرتبط برمی‌گرداند.

## دریافت اعتبارنامه Token Plan

<Steps>
  <Step title="ساخت یک کلید">
    یک کلید MiniMax Token Plan از
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    بسازید یا کپی کنید.
    راه‌اندازی‌های OAuth می‌توانند به‌جای آن از `MINIMAX_OAUTH_TOKEN` استفاده کنند.
  </Step>
  <Step title="ذخیره کلید">
    `MINIMAX_CODE_PLAN_KEY` را در محیط Gateway تنظیم کنید، یا از طریق مورد زیر پیکربندی کنید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw همچنین `MINIMAX_CODING_API_KEY`، `MINIMAX_OAUTH_TOKEN` و
`MINIMAX_API_KEY` را به‌عنوان نام‌های مستعار محیطی می‌پذیرد. `MINIMAX_API_KEY` باید به یک
اعتبارنامه Token Plan با قابلیت جست‌وجو اشاره کند؛ کلیدهای معمول API مدل MiniMax ممکن است
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

- جهانی: `https://api.minimax.io/v1/coding_plan/search`
- چین: `https://api.minimaxi.com/v1/coding_plan/search`

اگر `plugins.entries.minimax.config.webSearch.region` تنظیم نشده باشد، OpenClaw
منطقه را به این ترتیب تعیین می‌کند:

1. `tools.web.search.minimax.region` / `webSearch.region` متعلق به Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

این یعنی راه‌اندازی چین یا `MINIMAX_API_HOST=https://api.minimaxi.com/...`
به‌طور خودکار MiniMax Search را نیز روی میزبان چین نگه می‌دارد.

حتی وقتی MiniMax را از طریق مسیر OAuth `minimax-portal` احراز هویت کرده باشید،
جست‌وجوی وب همچنان با شناسه ارائه‌دهنده `minimax` ثبت می‌شود؛ URL پایه ارائه‌دهنده OAuth
به‌عنوان راهنمای منطقه برای انتخاب میزبان چین/جهانی استفاده می‌شود، و `MINIMAX_OAUTH_TOKEN`
می‌تواند اعتبارنامه bearer جست‌وجوی MiniMax را تأمین کند.

## پارامترهای پشتیبانی‌شده

| پارامتر | نوع    | محدودیت‌ها | توضیح                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | required    | رشته پرس‌وجوی جست‌وجو.                                                        |
| `count`   | integer | 1-10        | تعداد نتایجی که باید برگردانده شود. OpenClaw فهرست برگشتی را به این اندازه کوتاه می‌کند. |

فیلترهای مختص ارائه‌دهنده در حال حاضر پشتیبانی نمی‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه ارائه‌دهنده‌ها و تشخیص خودکار
- [MiniMax](/fa/providers/minimax) -- راه‌اندازی مدل، تصویر، گفتار و احراز هویت
