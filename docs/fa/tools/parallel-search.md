---
read_when:
    - می‌خواهید بدون کلید API از جست‌وجوی وب استفاده کنید
    - شما به API جست‌وجوی پولی Parallel نیاز دارید
    - شما گزیده‌های فشرده‌ای می‌خواهید که برای کارایی زمینهٔ LLM رتبه‌بندی شده باشند
summary: جست‌وجوی موازی -- گزیده‌های فشرده بهینه‌شده برای LLM از منابع وب
title: جستجوی موازی
x-i18n:
    generated_at: "2026-06-27T19:02:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin Parallel دو ارائه‌دهنده `web_search` برای [Parallel](https://parallel.ai/) فراهم می‌کند:

- **Parallel Search (Free)** (`parallel-free`) -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) رایگان Parallel. به
  حساب یا کلید API نیاز ندارد. وقتی مسیر جست‌وجوی میزبانی‌شده و بدون کلید
  Parallel را می‌خواهید، آن را صریح انتخاب کنید.
- **Parallel Search** (`parallel`) -- API پولی جست‌وجوی Parallel. به
  `PARALLEL_API_KEY` نیاز دارد و محدودیت نرخ بالاتر و تنظیم هدف را ارائه می‌دهد.

هر دو گزیده‌های رتبه‌بندی‌شده و بهینه‌شده برای LLM را از یک نمایه وب ساخته‌شده برای عامل‌های هوش مصنوعی برمی‌گردانند.
برای انتخاب صریح یکی از آن‌ها، `tools.web.search.provider` را روی `parallel-free` یا `parallel` تنظیم کنید.

<Note>
  مدل‌های OpenAI Responses وقتی `tools.web.search.provider` تنظیم نشده باشد، از جست‌وجوی وب بومی OpenAI استفاده می‌کنند، بنابراین ارائه‌دهنده‌های Parallel را دور می‌زنند.
  برای مسیریابی آن‌ها از طریق Parallel، `tools.web.search.provider` را روی `parallel-free` یا `parallel` تنظیم کنید.
</Note>

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را بازراه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## کلید API (ارائه‌دهنده پولی)

`parallel-free` به کلید API نیاز ندارد، اما همچنان باید به‌عنوان ارائه‌دهنده مدیریت‌شده انتخاب شود. ارائه‌دهنده پولی `parallel` به کلید API نیاز دارد:

<Steps>
  <Step title="Create an account">
    در [platform.parallel.ai](https://platform.parallel.ai) ثبت‌نام کنید و از داشبورد خود یک کلید API بسازید.
  </Step>
  <Step title="Store the key">
    `PARALLEL_API_KEY` را در محیط Gateway تنظیم کنید، یا از طریق این دستور پیکربندی کنید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## پیکربندی

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**جایگزین محیطی:** `PARALLEL_API_KEY` را در محیط Gateway تنظیم کنید.
برای نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید.

## بازنویسی URL پایه

بازنویسی URL پایه فقط برای ارائه‌دهنده پولی `parallel` اعمال می‌شود. ارائه‌دهنده رایگان
`parallel-free` همیشه از `https://search.parallel.ai/mcp` استفاده می‌کند.

وقتی درخواست‌های Parallel باید از طریق یک پروکسی سازگار یا نقطه پایانی جایگزین Parallel عبور کنند (برای
نمونه، Cloudflare AI Gateway)، `plugins.entries.parallel.config.webSearch.baseUrl` را تنظیم کنید. OpenClaw میزبان‌های خام را با
افزودن `https://` در ابتدا عادی‌سازی می‌کند و مگر اینکه مسیر از قبل همان‌جا پایان یافته باشد، `/v1/search` را به انتها اضافه می‌کند. نقطه پایانی حل‌شده در کلید کش جست‌وجو گنجانده می‌شود، بنابراین نتایج
از نقاط پایانی مختلف Parallel مشترک نیستند.

## پارامترهای ابزار

OpenClaw شکل جست‌وجوی بومی Parallel را در دسترس می‌گذارد تا مدل بتواند هم
هدف زبان طبیعی و هم چند پرس‌وجوی کوتاه کلیدواژه‌ای را پر کند — ترکیبی که
Parallel برای بهترین نتایج [توصیه می‌کند](https://docs.parallel.ai/search/best-practices).

<ParamField path="objective" type="string" required>
توصیف زبان طبیعی پرسش یا هدف زیربنایی (حداکثر ۵۰۰۰ نویسه). باید خودکفا باشد.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
پرس‌وجوهای جست‌وجوی کلیدواژه‌ای کوتاه، هرکدام ۳ تا ۶ واژه (۱ تا ۵ ورودی، حداکثر ۲۰۰ نویسه
برای هرکدام). برای بهترین نتایج، ۲ تا ۳ پرس‌وجوی متنوع ارائه کنید.
</ParamField>

<ParamField path="count" type="number">
تعداد نتایجی که برگردانده می‌شود (۱ تا ۴۰).
</ParamField>

<ParamField path="session_id" type="string">
شناسه اختیاری نشست Parallel (حداکثر ۱۰۰۰ نویسه در `parallel`؛ Search MCP رایگان
`parallel-free` آن را به ۱۰۰ محدود می‌کند). در جست‌وجوهای پیگیری که بخشی از همان وظیفه هستند، `sessionId` را از نتیجه قبلی
Parallel ارسال کنید تا Parallel بتواند فراخوانی‌های مرتبط را گروه‌بندی کند و نتایج بعدی را بهبود دهد. شناسه‌ای که از حد عبور کند
حذف می‌شود و شناسه تازه‌ای تولید می‌شود.
</ParamField>

<ParamField path="client_model" type="string">
شناسه اختیاری مدلی که فراخوانی را انجام می‌دهد (مثلاً `claude-opus-4-7`،
`gpt-5.5`). به Parallel امکان می‌دهد تنظیمات پیش‌فرض را برای قابلیت‌های مدل شما تنظیم کند.
اسلاگ دقیق مدل فعال را ارسال کنید؛ آن را به نام مستعار خانواده کوتاه نکنید.
</ParamField>

## نکات

- Parallel نتایج را بر اساس سودمندی برای استدلال LLM رتبه‌بندی و فشرده می‌کند، نه
  نرخ کلیک انسانی؛ به‌جای محتوای کامل صفحه، انتظار گزیده‌های فشرده در هر نتیجه را داشته باشید
- گزیده‌های نتیجه به‌صورت آرایه `excerpts` برمی‌گردند و همچنین برای سازگاری با قرارداد عمومی `web_search`
  در فیلد `description` به هم پیوسته می‌شوند
- Parallel در هر پاسخ یک `session_id` برمی‌گرداند؛ OpenClaw آن را در بار ابزار به‌صورت
  `sessionId` ارائه می‌کند تا فراخوان‌ها بتوانند جست‌وجوهای پیگیری را گروه‌بندی کنند
- وقتی `searchId`، `warnings` و `usage` از Parallel وجود داشته باشند، بدون تغییر عبور داده می‌شوند
- OpenClaw همیشه تعداد نتیجه حل‌شده را به‌صورت
  `advanced_settings.max_results` به Parallel ارسال می‌کند. آرگومان `count` فراخوان مقدم است، سپس تنظیم سطح بالای
  `tools.web.search.maxResults`، و در غیر این صورت مقدار پیش‌فرض عمومی `web_search` در OpenClaw
  (۵). این کار هنگام جابه‌جایی بین ارائه‌دهنده‌ها حجم نتایج را سازگار نگه می‌دارد؛ Parallel به‌تنهایی به‌صورت پیش‌فرض ۱۰ نتیجه برمی‌گرداند
- نتایج به‌صورت پیش‌فرض برای ۱۵ دقیقه کش می‌شوند (قابل پیکربندی از طریق
  `cacheTtlMinutes`)
- ارائه‌دهنده رایگان `parallel-free` همان پارامترها را می‌پذیرد. `count` را در سمت کلاینت اعمال می‌کند
  و وقتی شناسه‌ای ارائه نشده باشد، برای هر فراخوانی یک `session_id` تولید می‌کند.

## مرتبط

- [مرور کلی جست‌وجوی وب](/fa/tools/web) -- همه ارائه‌دهنده‌ها و تشخیص خودکار
- [جست‌وجوی Exa](/fa/tools/exa-search) -- جست‌وجوی عصبی با استخراج محتوا
- [جست‌وجوی Perplexity](/fa/tools/perplexity-search) -- نتایج ساختاریافته با فیلتر دامنه
