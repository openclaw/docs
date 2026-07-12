---
read_when:
    - می‌خواهید از Kimi برای web_search استفاده کنید
    - به یک `KIMI_API_KEY` یا `MOONSHOT_API_KEY` نیاز دارید
summary: جست‌وجوی وب Kimi از طریق جست‌وجوی وب Moonshot
title: جست‌وجوی Kimi
x-i18n:
    generated_at: "2026-07-12T11:02:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi یک ارائه‌دهندهٔ `web_search` است که از جست‌وجوی وب بومی Moonshot پشتیبانی می‌کند. Moonshot به‌جای بازگرداندن فهرستی رتبه‌بندی‌شده از نتایج، مشابه ارائه‌دهندگان پاسخ مبتنی بر منابع Gemini و Grok، یک پاسخ واحد همراه با ارجاعات درون‌متنی تولید می‌کند.

## راه‌اندازی

<Steps>
  <Step title="ایجاد کلید">
    یک کلید API از [Moonshot AI](https://platform.moonshot.cn/) دریافت کنید.
  </Step>
  <Step title="ذخیره کلید">
    `KIMI_API_KEY` یا `MOONSHOT_API_KEY` را در محیط Gateway تنظیم کنید (برای نصب
    Gateway، آن را به `~/.openclaw/.env` اضافه کنید)، یا از طریق دستور زیر پیکربندی کنید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

انتخاب **Kimi** هنگام اجرای `openclaw onboard` یا `openclaw configure --section web`
همچنین موارد زیر را درخواست می‌کند:

- منطقهٔ API مربوط به Moonshot: `https://api.moonshot.ai/v1` یا `https://api.moonshot.cn/v1`
- مدل جست‌وجوی وب (مقدار پیش‌فرض `kimi-k2.6` است)

## پیکربندی

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // در صورت تنظیم بودن KIMI_API_KEY یا MOONSHOT_API_KEY اختیاری است
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

اگر `tools.web.search.provider` حذف شده باشد، مقدار آن به‌طور خودکار بر اساس کلیدهای API موجود تشخیص داده می‌شود؛
اگر چند اعتبارنامهٔ جست‌وجو پیکربندی شده‌اند، آن را صراحتاً روی `kimi` تنظیم کنید.

شکل محدوده‌بندی‌شدهٔ معادل در `tools.web.search.kimi` شامل (`apiKey`، `baseUrl`، `model`)
نیز کار می‌کند؛ هر دو ساختار در یک پیکربندی نهایی یکسان ادغام می‌شوند.

مقادیر پیش‌فرض: اگر `baseUrl` حذف شود، مقدار پیش‌فرض آن `https://api.moonshot.ai/v1` است و مقدار
پیش‌فرض `model` برابر با `kimi-k2.6` است.

اگر ترافیک گفت‌وگو از میزبان چین (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`) استفاده کند، وقتی `baseUrl` اختصاصی Kimi تنظیم نشده باشد،
`web_search` مربوط به Kimi به‌طور خودکار از همان میزبان استفاده می‌کند تا کلیدهای `.cn`
به‌اشتباه به نقطهٔ پایانی بین‌المللی ارسال نشوند (که برای آن کلیدها HTTP 401 برمی‌گرداند).
برای نادیده گرفتن این وراثت، یک `baseUrl` صریح برای Kimi تنظیم کنید.

## الزام استناد به منابع

OpenClaw تنها زمانی نتیجهٔ `web_search` مربوط به Kimi را بازمی‌گرداند که پاسخ Moonshot
شامل شواهد بومی جست‌وجوی وب، مانند بازپخش فراخوانی ابزار `$web_search`،
`search_results` یا نشانی‌های استناد باشد. اگر Kimi مستقیماً و بدون استناد به منابع پاسخ دهد
(برای مثال «نمی‌توانم اینترنت را مرور کنم»)، OpenClaw به‌جای در نظر گرفتن آن متن به‌عنوان نتیجهٔ
جست‌وجو، خطای `kimi_web_search_ungrounded` را بازمی‌گرداند. پرس‌وجو را دوباره امتحان کنید،
به یک ارائه‌دهندهٔ ساخت‌یافته مانند Brave تغییر دهید، یا اگر از قبل نشانی مقصد را دارید،
از `web_fetch` یا ابزار مرورگر استفاده کنید.

## پارامترهای ابزار

| پارامتر                                                       | پشتیبانی                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | بله                                                                                                                      |
| `count`                                                         | برای سازگاری میان ارائه‌دهندگان پذیرفته می‌شود، اما نادیده گرفته می‌شود: Kimi همیشه یک پاسخ ترکیبی بازمی‌گرداند، نه فهرستی شامل N نتیجه |
| `country`، `language`، `freshness`، `date_after`، `date_before` | خیر                                                                                                                       |

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) - همهٔ ارائه‌دهندگان و تشخیص خودکار
- [Moonshot AI](/fa/providers/moonshot) - مستندات مدل Moonshot و ارائه‌دهندهٔ Kimi Coding
- [جست‌وجوی Gemini](/fa/tools/gemini-search) - پاسخ‌های تولیدشده با هوش مصنوعی از طریق استناد به منابع Google
- [جست‌وجوی Grok](/fa/tools/grok-search) - پاسخ‌های تولیدشده با هوش مصنوعی از طریق استناد به منابع xAI
