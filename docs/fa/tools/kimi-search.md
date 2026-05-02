---
read_when:
    - می‌خواهید از Kimi برای web_search استفاده کنید
    - به KIMI_API_KEY یا MOONSHOT_API_KEY نیاز دارید
summary: جست‌وجوی وب Kimi از طریق جست‌وجوی وب Moonshot
title: جست‌وجوی Kimi
x-i18n:
    generated_at: "2026-05-02T12:05:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw از Kimi به‌عنوان provider `web_search` پشتیبانی می‌کند و از جست‌وجوی وب Moonshot برای تولید پاسخ‌های ترکیب‌شده با هوش مصنوعی همراه با استنادها استفاده می‌کند.

## دریافت کلید API

<Steps>
  <Step title="ایجاد کلید">
    یک کلید API از [Moonshot AI](https://platform.moonshot.cn/) دریافت کنید.
  </Step>
  <Step title="ذخیره کلید">
    `KIMI_API_KEY` یا `MOONSHOT_API_KEY` را در محیط Gateway تنظیم کنید، یا از طریق این فرمان پیکربندی کنید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

وقتی هنگام اجرای `openclaw onboard` یا `openclaw configure --section web` گزینه **Kimi** را انتخاب می‌کنید، OpenClaw همچنین می‌تواند این موارد را درخواست کند:

- منطقه API مربوط به Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- مدل پیش‌فرض جست‌وجوی وب Kimi (پیش‌فرض `kimi-k2.6` است)

## پیکربندی

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

اگر برای چت از میزبان API چین استفاده می‌کنید (`models.providers.moonshot.baseUrl`: `https://api.moonshot.cn/v1`)، وقتی `tools.web.search.kimi.baseUrl` حذف شده باشد، OpenClaw همان میزبان را برای `web_search` مربوط به Kimi دوباره استفاده می‌کند؛ بنابراین کلیدهای [platform.moonshot.cn](https://platform.moonshot.cn/) به‌اشتباه به endpoint بین‌المللی ارسال نمی‌شوند (که اغلب HTTP 401 برمی‌گرداند). وقتی به URL پایه جست‌وجوی متفاوتی نیاز دارید، با `tools.web.search.kimi.baseUrl` آن را override کنید.

**جایگزین محیطی:** `KIMI_API_KEY` یا `MOONSHOT_API_KEY` را در محیط Gateway تنظیم کنید. برای نصب gateway، آن را در `~/.openclaw/.env` قرار دهید.

اگر `baseUrl` را حذف کنید، OpenClaw به‌صورت پیش‌فرض از `https://api.moonshot.ai/v1` استفاده می‌کند. اگر `model` را حذف کنید، OpenClaw به‌صورت پیش‌فرض از `kimi-k2.6` استفاده می‌کند.

## نحوه کار

Kimi از جست‌وجوی وب Moonshot برای ترکیب پاسخ‌ها همراه با استنادهای درون‌خطی استفاده می‌کند، مشابه رویکرد پاسخ grounded در Gemini و Grok.

OpenClaw جست‌وجوی `web_search` در Kimi را فقط زمانی موفق در نظر می‌گیرد که Moonshot شواهد native مربوط به grounding جست‌وجوی وب را برگرداند، مانند payload ابزار `$web_search` قابل replay، `search_results`، یا URLهای استناد. اگر Kimi بلافاصله با یک پاسخ چت ساده مثل «نمی‌توانم اینترنت را مرور کنم» متوقف شود و هیچ شاهد grounding نداشته باشد، OpenClaw به‌جای اینکه آن متن را به‌عنوان نتیجه جست‌وجو wrap کند، یک خطای ساختاریافته `kimi_web_search_ungrounded` برمی‌گرداند. query را دوباره امتحان کنید، به یک provider ساختاریافته مثل Brave تغییر دهید، یا وقتی از قبل URL هدف دارید از `web_fetch` / ابزار مرورگر استفاده کنید.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Kimi از `query` پشتیبانی می‌کند.

`count` برای سازگاری مشترک با `web_search` پذیرفته می‌شود، اما Kimi همچنان به‌جای فهرست Nتایی نتایج، یک پاسخ ترکیب‌شده همراه با استنادها برمی‌گرداند.

فیلترهای ویژه provider در حال حاضر پشتیبانی نمی‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه providerها و تشخیص خودکار
- [Moonshot AI](/fa/providers/moonshot) -- مستندات مدل Moonshot و provider کدنویسی Kimi
- [جست‌وجوی Gemini](/fa/tools/gemini-search) -- پاسخ‌های ترکیب‌شده با هوش مصنوعی از طریق grounding گوگل
- [جست‌وجوی Grok](/fa/tools/grok-search) -- پاسخ‌های ترکیب‌شده با هوش مصنوعی از طریق grounding در xAI
