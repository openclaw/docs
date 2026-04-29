---
read_when:
    - می‌خواهید از MiniMax برای web_search استفاده کنید
    - به یک کلید MiniMax Coding Plan نیاز دارید
    - شما راهنمای میزبان جست‌وجوی CN/جهانی MiniMax را می‌خواهید
summary: جست‌وجوی MiniMax از طریق API جست‌وجوی Coding Plan
title: جست‌وجوی MiniMax
x-i18n:
    generated_at: "2026-04-29T23:44:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw از MiniMax به‌عنوان ارائه‌دهنده‌ی `web_search` از طریق API جست‌وجوی MiniMax
Coding Plan پشتیبانی می‌کند. این API نتایج جست‌وجوی ساختاریافته شامل عنوان‌ها، URLها،
بخش‌های کوتاه متن، و پرس‌وجوهای مرتبط را برمی‌گرداند.

## دریافت کلید Coding Plan

<Steps>
  <Step title="ایجاد کلید">
    یک کلید MiniMax Coding Plan را از
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) ایجاد یا کپی کنید.
  </Step>
  <Step title="ذخیره کلید">
    `MINIMAX_CODE_PLAN_KEY` را در محیط Gateway تنظیم کنید، یا از طریق مورد زیر پیکربندی کنید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw همچنین `MINIMAX_CODING_API_KEY` را به‌عنوان نام مستعار محیطی می‌پذیرد. `MINIMAX_API_KEY`
همچنان به‌عنوان جایگزین سازگاری خوانده می‌شود، وقتی از قبل به یک توکن coding-plan اشاره کند.

## پیکربندی

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
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

**جایگزین محیطی:** `MINIMAX_CODE_PLAN_KEY` را در محیط Gateway تنظیم کنید.
برای نصب gateway، آن را در `~/.openclaw/.env` قرار دهید.

## انتخاب منطقه

جست‌وجوی MiniMax از این endpointها استفاده می‌کند:

- جهانی: `https://api.minimax.io/v1/coding_plan/search`
- چین: `https://api.minimaxi.com/v1/coding_plan/search`

اگر `plugins.entries.minimax.config.webSearch.region` تنظیم نشده باشد، OpenClaw
منطقه را به این ترتیب تعیین می‌کند:

1. `tools.web.search.minimax.region` / `webSearch.region` متعلق به plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

یعنی راه‌اندازی اولیه‌ی چین یا `MINIMAX_API_HOST=https://api.minimaxi.com/...`
به‌طور خودکار جست‌وجوی MiniMax را نیز روی میزبان چین نگه می‌دارد.

حتی وقتی MiniMax را از مسیر OAuth `minimax-portal` احراز هویت کرده باشید،
جست‌وجوی وب همچنان با شناسه‌ی ارائه‌دهنده‌ی `minimax` ثبت می‌شود؛ URL پایه‌ی ارائه‌دهنده‌ی OAuth
فقط به‌عنوان راهنمای منطقه برای انتخاب میزبان چین/جهانی استفاده می‌شود.

## پارامترهای پشتیبانی‌شده

جست‌وجوی MiniMax از موارد زیر پشتیبانی می‌کند:

- `query`
- `count` ‏(OpenClaw فهرست نتایج برگشتی را به تعداد درخواستی کوتاه می‌کند)

فیلترهای ویژه‌ی ارائه‌دهنده در حال حاضر پشتیبانی نمی‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [MiniMax](/fa/providers/minimax) -- تنظیم مدل، تصویر، گفتار، و احراز هویت
