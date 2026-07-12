---
read_when:
    - می‌خواهید از MiniMax برای `web_search` استفاده کنید
    - به یک کلید MiniMax Token Plan یا توکن OAuth نیاز دارید
    - برای میزبان جست‌وجوی MiniMax در چین/سراسر جهان راهنمایی می‌خواهید
summary: جست‌وجوی MiniMax از طریق API جست‌وجوی طرح Token
title: جست‌وجوی MiniMax
x-i18n:
    generated_at: "2026-07-12T10:58:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw از MiniMax به‌عنوان ارائه‌دهنده‌ی `web_search` از طریق API جست‌وجوی Token Plan در MiniMax پشتیبانی می‌کند. این API نتایج جست‌وجوی ساخت‌یافته‌ای شامل عنوان‌ها، نشانی‌های اینترنتی، گزیده‌ها و جست‌وجوهای مرتبط برمی‌گرداند.

## دریافت اعتبارنامه‌ی Token Plan

<Steps>
  <Step title="ایجاد کلید">
    یک کلید MiniMax Token Plan را در
    [پلتفرم MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key) ایجاد یا کپی کنید.
    در پیکربندی‌های OAuth می‌توانید به‌جای آن از `MINIMAX_OAUTH_TOKEN` استفاده کنید.
  </Step>
  <Step title="ذخیره‌سازی کلید">
    متغیر `MINIMAX_CODE_PLAN_KEY` را در محیط Gateway تنظیم کنید یا از طریق دستور زیر پیکربندی را انجام دهید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw همچنین `MINIMAX_CODING_API_KEY`، `MINIMAX_OAUTH_TOKEN` و
`MINIMAX_API_KEY` را به‌عنوان نام‌های مستعار متغیر محیطی می‌پذیرد که پس از
`MINIMAX_CODE_PLAN_KEY` به همین ترتیب بررسی می‌شوند. `MINIMAX_API_KEY` باید به
یک اعتبارنامه‌ی Token Plan دارای قابلیت جست‌وجو اشاره کند؛ کلیدهای معمول API مدل MiniMax
ممکن است در نقطه‌ی پایانی جست‌وجوی Token Plan پذیرفته نشوند.

## پیکربندی

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // اگر متغیر محیطی MiniMax Token Plan تنظیم شده باشد، اختیاری است
            region: "global", // یا "cn"
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

**روش جایگزین با متغیر محیطی:** `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`،
`MINIMAX_OAUTH_TOKEN` یا `MINIMAX_API_KEY` را در محیط Gateway تنظیم کنید.
برای نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید.

## انتخاب منطقه

جست‌وجوی MiniMax از نقاط پایانی زیر استفاده می‌کند:

- سراسری: `https://api.minimax.io/v1/coding_plan/search`
- چین: `https://api.minimaxi.com/v1/coding_plan/search`

اگر `plugins.entries.minimax.config.webSearch.region` تنظیم نشده باشد، OpenClaw
منطقه را به ترتیب زیر تعیین می‌کند:

1. `tools.web.search.minimax.region` / `webSearch.region` متعلق به Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

این یعنی راه‌اندازی اولیه‌ی چین یا `MINIMAX_API_HOST=https://api.minimaxi.com/...`
به‌طور خودکار جست‌وجوی MiniMax را نیز روی میزبان چین نگه می‌دارد.

حتی اگر احراز هویت MiniMax را از مسیر OAuth با نام `minimax-portal` انجام داده باشید،
جست‌وجوی وب همچنان با شناسه‌ی ارائه‌دهنده‌ی `minimax` ثبت می‌شود؛ نشانی پایه‌ی ارائه‌دهنده‌ی OAuth
به‌عنوان راهنمای منطقه برای انتخاب میزبان چین یا سراسری استفاده می‌شود و `MINIMAX_OAUTH_TOKEN`
می‌تواند اعتبارنامه‌ی حامل موردنیاز جست‌وجوی MiniMax را تأمین کند.

## پارامترهای پشتیبانی‌شده

| پارامتر | نوع      | محدودیت‌ها        | توضیحات                                                                    |
| ------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `query` | رشته     | الزامی             | رشته‌ی پرس‌وجوی جست‌وجو.                                                   |
| `count` | عدد صحیح | ۱ تا ۱۰، پیش‌فرض ۵ | تعداد نتایجی که باید برگردانده شوند. OpenClaw فهرست بازگشتی را به این اندازه محدود می‌کند. |

در حال حاضر، فیلترهای مختص ارائه‌دهنده پشتیبانی نمی‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [MiniMax](/fa/providers/minimax) -- راه‌اندازی مدل، تصویر، گفتار و احراز هویت
