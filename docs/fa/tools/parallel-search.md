---
read_when:
    - می‌خواهید بدون کلید API در وب جست‌وجو کنید
    - شما API جست‌وجوی پولی Parallel را می‌خواهید
    - می‌خواهید گزیده‌های فشرده بر اساس کارایی در بافت LLM رتبه‌بندی شوند
summary: جست‌وجوی موازی -- گزیده‌های فشرده و بهینه‌شده برای LLM از منابع وب
title: جست‌وجوی موازی
x-i18n:
    generated_at: "2026-07-12T11:03:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin ‏Parallel دو ارائه‌دهندهٔ `web_search` از [Parallel](https://parallel.ai/) فراهم می‌کند که هر دو گزیده‌های رتبه‌بندی‌شده و بهینه‌شده برای LLM را از نمایه‌ای وب که برای عامل‌های هوش مصنوعی ساخته شده است، برمی‌گردانند:

| ارائه‌دهنده                | شناسه            | احراز هویت                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| جست‌وجوی Parallel (رایگان) | `parallel-free` | ندارد -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) رایگان Parallel |
| جست‌وجوی Parallel        | `parallel`      | `PARALLEL_API_KEY` -- API جست‌وجوی پولی، محدودیت نرخ بالاتر و تنظیم هدف             |

برای انتخاب صریح یکی از آن‌ها، `tools.web.search.provider` را روی `parallel-free` یا `parallel` تنظیم کنید؛ هیچ‌کدام به‌طور خودکار شناسایی نمی‌شوند.

<Note>
  مدل‌های مستقیم OpenAI Responses (`api: "openai-responses"`، ارائه‌دهندهٔ
  `openai`، نشانی پایهٔ رسمی API) هنگامی که `tools.web.search.provider` تنظیم نشده، خالی، `"auto"`،
  یا `"openai"` باشد، به‌طور خودکار از جست‌وجوی وب بومی میزبانی‌شدهٔ OpenAI استفاده می‌کنند
  -- بنابراین به‌طور پیش‌فرض Parallel را دور می‌زنند. برای هدایت آن‌ها
  از طریق Parallel، `tools.web.search.provider` را روی `parallel-free` یا `parallel` تنظیم کنید.
  به [نمای کلی جست‌وجوی وب](/fa/tools/web) مراجعه کنید.
</Note>

## نصب Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## کلید API (ارائه‌دهندهٔ پولی)

`parallel-free` به کلید نیاز ندارد، اما همچنان باید به‌طور صریح انتخاب شود. ارائه‌دهندهٔ پولی
`parallel` به یک کلید API نیاز دارد:

<Steps>
  <Step title="ایجاد حساب">
    در [platform.parallel.ai](https://platform.parallel.ai) ثبت‌نام کنید و
    از داشبورد خود یک کلید API بسازید.
  </Step>
  <Step title="ذخیره کلید">
    `PARALLEL_API_KEY` را در محیط Gateway تنظیم کنید یا از طریق دستور زیر پیکربندی کنید:

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
            apiKey: "par-...", // در صورت تنظیم بودن PARALLEL_API_KEY اختیاری است
            baseUrl: "https://api.parallel.ai", // اختیاری؛ OpenClaw مسیر /v1/search را می‌افزاید
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" برای Search MCP رایگان، یا "parallel" برای
        // ارائه‌دهندهٔ پولی مبتنی بر API که اینجا نمایش داده شده است.
        provider: "parallel",
      },
    },
  },
}
```

**روش جایگزین با متغیر محیطی:** `PARALLEL_API_KEY` را در محیط Gateway
تنظیم کنید. برای نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید.

## بازنویسی نشانی پایه

فقط برای ارائه‌دهندهٔ پولی `parallel` اعمال می‌شود؛ `parallel-free` همیشه از
`https://search.parallel.ai/mcp` استفاده می‌کند و این تنظیم را نادیده می‌گیرد.

برای هدایت درخواست‌های پولی از طریق یک پراکسی سازگار یا نقطهٔ پایانی جایگزین
(برای مثال Cloudflare AI Gateway)، `plugins.entries.parallel.config.webSearch.baseUrl`
را تنظیم کنید. OpenClaw میزبان‌های فاقد طرح‌واره را با افزودن
`https://` در ابتدا عادی‌سازی می‌کند و `/v1/search` را می‌افزاید، مگر اینکه مسیر از قبل
به آن ختم شود. نقطهٔ پایانی نهایی بخشی از کلید حافظهٔ نهان جست‌وجو است؛ بنابراین نتایج
نقاط پایانی مختلف هرگز با یکدیگر به اشتراک گذاشته نمی‌شوند.

## پارامترهای ابزار

هر دو ارائه‌دهنده ساختار جست‌وجوی بومی Parallel را ارائه می‌کنند تا مدل یک
هدف به زبان طبیعی را همراه با چند پرس‌وجوی کوتاه کلیدواژه‌ای تکمیل کند -- ترکیبی که
Parallel برای دستیابی به بهترین نتایج [توصیه می‌کند](https://docs.parallel.ai/search/best-practices).

<ParamField path="objective" type="string" required>
توصیف پرسش یا هدف زیربنایی به زبان طبیعی (حداکثر ۵۰۰۰ نویسه).
باید مستقل و کامل باشد.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
پرس‌وجوهای جست‌وجوی کلیدواژه‌ای مختصر، هرکدام ۳ تا ۶ واژه (۱ تا ۵ مورد، حداکثر
۲۰۰ نویسه برای هر مورد). برای بهترین نتایج، ۲ تا ۳ پرس‌وجوی متنوع ارائه کنید.
</ParamField>

<ParamField path="count" type="number">
تعداد نتایجی که باید برگردانده شوند (۱ تا ۴۰).
</ParamField>

<ParamField path="session_id" type="string">
شناسهٔ اختیاری نشست Parallel از `sessionId` نتیجه‌ای قبلی. آن را در
جست‌وجوهای بعدی همان وظیفه ارسال کنید تا Parallel فراخوانی‌های مرتبط را گروه‌بندی کند و
نتایج بعدی را بهبود دهد. حداکثر ۱۰۰۰ نویسه در `parallel`؛ ‏Search MCP رایگان
`parallel-free` آن را به ۱۰۰ نویسه محدود می‌کند. شناسه‌ای فراتر از حد مجاز حذف می‌شود
(پولی) یا شناسه‌ای تازه ساخته می‌شود (رایگان).
</ParamField>

<ParamField path="client_model" type="string">
شناسهٔ اختیاری مدلی که فراخوانی را انجام می‌دهد (برای مثال `claude-opus-4-7`
یا `gpt-5.6-sol`)، با حداکثر ۱۰۰ نویسه. به Parallel اجازه می‌دهد تنظیمات پیش‌فرض را با
قابلیت‌های مدل شما سازگار کند. نامک دقیق مدل فعال را ارسال کنید؛ آن را به
نام مستعار خانواده کوتاه نکنید.
</ParamField>

## نکات

- Parallel نتایج را بر اساس سودمندی برای استدلال LLM رتبه‌بندی و فشرده می‌کند، نه برای
  کلیک کاربر؛ بنابراین به‌جای محتوای کامل صفحه، انتظار گزیده‌های متراکم برای هر نتیجه را
  داشته باشید.
- گزیده‌های نتایج به‌صورت آرایهٔ `excerpts` برمی‌گردند و برای سازگاری با قرارداد عمومی
  `web_search` در `description` نیز به یکدیگر متصل می‌شوند.
- هر دو ارائه‌دهنده یک `session_id` برمی‌گردانند؛ OpenClaw آن را به‌صورت `sessionId` در
  بار ابزار ارائه می‌کند تا فراخواننده‌ها بتوانند جست‌وجوهای بعدی را گروه‌بندی کنند. شناسهٔ
  نشست تولیدشده توسط Parallel (شناسه‌ای که فراخواننده ارائه نکرده است) از ورودی حافظهٔ نهان
  کنار گذاشته می‌شود، زیرا وظایف نامرتبط با پرس‌وجوهای یکسان نباید آن را به ارث ببرند.
- مقادیر `searchId`، ‏`warnings` و `usage` از Parallel، در صورت وجود، بدون تغییر منتقل می‌شوند.
- OpenClaw همیشه تعداد نهایی نتایج را به‌صورت `advanced_settings.max_results`
  به Parallel ارسال می‌کند (`parallel`) یا پس از پاسخ با اندازهٔ ثابت Parallel، مقدار `count`
  را در سمت کارخواه اعمال می‌کند (`parallel-free`). ابتدا آرگومان `count` فراخواننده اولویت دارد،
  سپس `tools.web.search.maxResults` و در غیر این صورت مقدار پیش‌فرض عمومی `web_search`
  در OpenClaw (۵) استفاده می‌شود -- مقدار پیش‌فرض API خود Parallel برابر ۱۰ است.
- نتایج به‌طور پیش‌فرض برای ۱۵ دقیقه در حافظهٔ نهان نگهداری می‌شوند (`cacheTtlMinutes`).
- هنگامی که فراخواننده `session_id` ارائه نکند، `parallel-free` در هر فراخوانی و از طریق
  دست‌دهی MCP یک `session_id` تازه می‌سازد؛ `parallel` در این حالت آن را تنظیم‌نشده باقی می‌گذارد.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهندگان و شناسایی خودکار
- [جست‌وجوی Exa](/fa/tools/exa-search) -- جست‌وجوی عصبی همراه با استخراج محتوا
- [جست‌وجوی Perplexity](/fa/tools/perplexity-search) -- نتایج ساخت‌یافته همراه با پالایش دامنه
