---
read_when:
    - می‌خواهید web_search را فعال یا پیکربندی کنید
    - می‌خواهید x_search را فعال یا پیکربندی کنید
    - باید یک ارائه‌دهندهٔ جست‌وجو انتخاب کنید
    - می‌خواهید تشخیص خودکار و انتخاب ارائه‌دهنده را درک کنید
sidebarTitle: Web Search
summary: web_search، x_search و web_fetch — جست‌وجو در وب، جست‌وجوی پست‌های X یا دریافت محتوای صفحه
title: جست‌وجوی وب
x-i18n:
    generated_at: "2026-07-12T11:00:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` با ارائه‌دهنده پیکربندی‌شده شما وب را جست‌وجو می‌کند و نتایج
عادی‌سازی‌شده را برمی‌گرداند که بر اساس پرس‌وجو به‌مدت ۱۵ دقیقه (قابل پیکربندی)
در حافظه نهان نگه‌داری می‌شوند. OpenClaw همچنین `x_search` را برای پست‌های X
(توییتر سابق) و `web_fetch` را برای واکشی سبک URL ارائه می‌کند. `web_fetch`
همیشه به‌صورت محلی اجرا می‌شود؛ وقتی Grok ارائه‌دهنده باشد، `web_search` از
طریق xAI Responses مسیریابی می‌شود و `x_search` همیشه از xAI Responses
استفاده می‌کند.

<Info>
  `web_search` یک ابزار سبک HTTP است، نه خودکارسازی مرورگر. برای سایت‌های
  متکی به JS یا ورود به حساب، از [مرورگر وب](/fa/tools/browser) استفاده کنید.
  برای واکشی یک URL مشخص، از [واکشی وب](/fa/tools/web-fetch) استفاده کنید.
</Info>

## شروع سریع

<Steps>
  <Step title="انتخاب ارائه‌دهنده">
    یک ارائه‌دهنده انتخاب کنید و هرگونه راه‌اندازی لازم را تکمیل کنید. برخی
    ارائه‌دهندگان بدون کلید کار می‌کنند و برخی دیگر به کلید API نیاز دارند.
    برای جزئیات، صفحه‌های ارائه‌دهندگان را در ادامه ببینید.
  </Step>
  <Step title="پیکربندی">
    ```bash
    openclaw configure --section web
    ```
    این دستور ارائه‌دهنده و هر اعتبارنامه لازم را ذخیره می‌کند. برای
    ارائه‌دهندگان مبتنی بر API، می‌توانید در عوض متغیر محیطی ارائه‌دهنده
    (برای مثال `BRAVE_API_KEY`) را تنظیم و از این مرحله صرف‌نظر کنید.
  </Step>
  <Step title="استفاده">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    برای پست‌های X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## انتخاب ارائه‌دهنده

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/fa/tools/brave-search">
    نتایج ساختاریافته همراه با گزیده‌ها. از حالت `llm-context` و فیلترهای کشور/زبان پشتیبانی می‌کند. سطح رایگان در دسترس است.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/fa/plugins/codex-harness">
    پاسخ‌های مستند و ترکیب‌شده با هوش مصنوعی از طریق حساب app-server در Codex شما.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fa/tools/duckduckgo-search">
    ارائه‌دهنده بدون کلید. به کلید API نیاز ندارد. یکپارچه‌سازی غیررسمی مبتنی بر HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fa/tools/exa-search">
    جست‌وجوی عصبی + کلیدواژه‌ای همراه با استخراج محتوا (برجسته‌سازی‌ها، متن و خلاصه‌ها).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fa/tools/firecrawl">
    نتایج ساختاریافته. برای استخراج عمیق، بهترین عملکرد را در کنار `firecrawl_search` و `firecrawl_scrape` دارد.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fa/tools/gemini-search">
    پاسخ‌های ترکیب‌شده با هوش مصنوعی همراه با ارجاع‌ها از طریق اتصال به Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fa/tools/grok-search">
    پاسخ‌های ترکیب‌شده با هوش مصنوعی همراه با ارجاع‌ها از طریق اتصال وب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fa/tools/kimi-search">
    پاسخ‌های ترکیب‌شده با هوش مصنوعی همراه با ارجاع‌ها از طریق جست‌وجوی وب Moonshot؛ جایگزین‌های گفت‌وگوی بدون پشتوانه صریحاً ناموفق می‌شوند.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fa/tools/minimax-search">
    نتایج ساختاریافته از طریق API جست‌وجوی طرح توکن MiniMax.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fa/tools/ollama-search">
    جست‌وجو از طریق میزبان محلی Ollama که به آن وارد شده‌اید، یا API میزبانی‌شده Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/fa/tools/parallel-search">
    API پولی Parallel Search ‏(`PARALLEL_API_KEY`)؛ محدودیت نرخ بالاتر و تنظیم هدف.
  </Card>
  <Card title="Parallel Search (رایگان)" icon="layer-group" href="/fa/tools/parallel-search">
    انتخاب اختیاری بدون کلید. Search MCP رایگان Parallel، با گزیده‌های متراکم بهینه‌شده برای LLM و بدون کلید API.
  </Card>
  <Card title="Perplexity" icon="search" href="/fa/tools/perplexity-search">
    نتایج ساختاریافته همراه با کنترل‌های استخراج محتوا و فیلتر دامنه.
  </Card>
  <Card title="SearXNG" icon="server" href="/fa/tools/searxng-search">
    فرا‌جست‌وجوی خودمیزبان. به کلید API نیاز ندارد. نتایج Google، Bing، DuckDuckGo و موارد دیگر را تجمیع می‌کند.
  </Card>
  <Card title="Tavily" icon="globe" href="/fa/tools/tavily">
    نتایج ساختاریافته همراه با عمق جست‌وجو، فیلتر موضوع و `tavily_extract` برای استخراج URL.
  </Card>
</CardGroup>

### مقایسه ارائه‌دهندگان

| ارائه‌دهنده                                     | سبک نتیجه                                                       | فیلترها                                              | کلید API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fa/tools/brave-search)                     | گزیده‌های ساختاریافته                                           | کشور، زبان، زمان، حالت `llm-context`                  | `BRAVE_API_KEY`                                                                         |
| [جست‌وجوی میزبانی‌شده Codex](/fa/plugins/codex-harness)    | ترکیب‌شده با هوش مصنوعی + URLهای منبع                           | دامنه‌ها، اندازه زمینه، موقعیت کاربر                   | ندارد؛ از ورود به Codex/OpenAI استفاده می‌کند                                            |
| [DuckDuckGo](/fa/tools/duckduckgo-search)           | گزیده‌های ساختاریافته                                           | --                                                   | ندارد (بدون کلید)                                                                        |
| [Exa](/fa/tools/exa-search)                         | ساختاریافته + استخراج‌شده                                      | حالت عصبی/کلیدواژه‌ای، تاریخ، استخراج محتوا           | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fa/tools/firecrawl)                    | گزیده‌های ساختاریافته                                           | از طریق ابزار `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fa/tools/gemini-search)                   | ترکیب‌شده با هوش مصنوعی + ارجاع‌ها                              | --                                                   | `GEMINI_API_KEY`                                                                        |
| [Grok](/fa/tools/grok-search)                       | ترکیب‌شده با هوش مصنوعی + ارجاع‌ها                              | --                                                   | OAuth ‏xAI،‏ `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/fa/tools/kimi-search)                       | ترکیب‌شده با هوش مصنوعی + ارجاع‌ها؛ در جایگزین‌های گفت‌وگوی بدون پشتوانه ناموفق می‌شود | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [جست‌وجوی MiniMax](/fa/tools/minimax-search)          | گزیده‌های ساختاریافته                                           | منطقه (`global` / `cn`)                               | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [جست‌وجوی وب Ollama](/fa/tools/ollama-search)        | گزیده‌های ساختاریافته                                           | --                                                   | برای میزبان‌های محلی واردشده ندارد؛ برای جست‌وجوی مستقیم `https://ollama.com` از `OLLAMA_API_KEY` استفاده می‌شود |
| [Parallel](/fa/tools/parallel-search)               | گزیده‌های متراکم رتبه‌بندی‌شده برای زمینه LLM                   | --                                                   | `PARALLEL_API_KEY` (پولی)                                                               |
| [جست‌وجوی Parallel (رایگان)](/fa/tools/parallel-search) | گزیده‌های متراکم رتبه‌بندی‌شده برای زمینه LLM                | --                                                   | ندارد (Search MCP رایگان)                                                               |
| [Perplexity](/fa/tools/perplexity-search)           | گزیده‌های ساختاریافته                                           | کشور، زبان، زمان، دامنه‌ها، محدودیت‌های محتوا          | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fa/tools/searxng-search)                 | گزیده‌های ساختاریافته                                           | دسته‌ها، زبان                                         | ندارد (خودمیزبان)                                                                       |
| [Tavily](/fa/tools/tavily)                          | گزیده‌های ساختاریافته                                           | از طریق ابزار `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## تشخیص خودکار

فهرست ارائه‌دهندگان در مستندات و جریان‌های راه‌اندازی به‌ترتیب الفبایی است.
تشخیص خودکار از ترتیب تقدم ثابت و جداگانه‌ای استفاده می‌کند و فقط زمانی
ارائه‌دهنده‌ای را که به اعتبارنامه نیاز دارد (`requiresCredential !== false`)
انتخاب می‌کند که پیکربندی آن را بیابد. اگر `provider` تنظیم نشده باشد،
OpenClaw ارائه‌دهندگان را به‌ترتیب زیر بررسی می‌کند و از نخستین مورد آماده
استفاده می‌کند:

ابتدا ارائه‌دهندگان مبتنی بر API:

1. **Brave** -- `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey` (ترتیب ۱۰)
2. **جست‌وجوی MiniMax** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` یا `plugins.entries.minimax.config.webSearch.apiKey` (ترتیب ۱۵)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`،‏ `GEMINI_API_KEY` یا `models.providers.google.apiKey` (ترتیب ۲۰)
4. **Grok** -- OAuth ‏xAI،‏ `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey` (ترتیب ۳۰)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` یا `plugins.entries.moonshot.config.webSearch.apiKey` (ترتیب ۴۰)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` یا `plugins.entries.perplexity.config.webSearch.apiKey` (ترتیب ۵۰)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey` (ترتیب ۶۰)
8. **Exa** -- `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey`؛ مقدار اختیاری `plugins.entries.exa.config.webSearch.baseUrl` نقطه پایانی Exa را بازنویسی می‌کند (ترتیب ۶۵)
9. **Tavily** -- `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey` (ترتیب ۷۰)
10. **Parallel** -- API پولی Parallel Search از طریق `PARALLEL_API_KEY` یا `plugins.entries.parallel.config.webSearch.apiKey`؛ مقدار اختیاری `plugins.entries.parallel.config.webSearch.baseUrl` نقطه پایانی را بازنویسی می‌کند (ترتیب ۷۵)

پس از آن، ارائه‌دهندگان دارای نقطه پایانی پیکربندی‌شده:

11. **SearXNG** -- `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (ترتیب ۲۰۰)

ارائه‌دهندگان بدون کلید مانند **جست‌وجوی Parallel (رایگان)**، **DuckDuckGo**،
**جست‌وجوی وب Ollama** و **جست‌وجوی میزبانی‌شده Codex** هرگز در تشخیص خودکار
انتخاب نمی‌شوند، حتی اگر مقدار ترتیب داخلی داشته باشند. تنها زمانی از آن‌ها
استفاده می‌شود که آن‌ها را صریحاً با `tools.web.search.provider` یا از طریق
`openclaw configure --section web` انتخاب کنید. OpenClaw صرفاً به‌دلیل
پیکربندی‌نشدن هیچ ارائه‌دهنده مبتنی بر API، پرس‌وجوهای مدیریت‌شده
`web_search` را به یک ارائه‌دهنده بدون کلید ارسال نمی‌کند.

مدل‌های OpenAI Responses یک استثنا هستند: تا زمانی که
`tools.web.search.provider` تنظیم نشده باشد، آن‌ها به‌جای ارائه‌دهندگان
مدیریت‌شده بالا از جست‌وجوی وب بومی OpenAI استفاده می‌کنند (در ادامه ببینید).
برای مسیریابی آن‌ها از طریق مسیر مدیریت‌شده، `tools.web.search.provider` را
روی `parallel-free` (یا ارائه‌دهنده‌ای دیگر) تنظیم کنید.

<Note>
  همه فیلدهای کلید ارائه‌دهندگان از اشیای SecretRef پشتیبانی می‌کنند.
  SecretRefهای محدود به Plugin در
  `plugins.entries.<plugin>.config.webSearch.apiKey` برای ارائه‌دهندگان
  نصب‌شده و مبتنی بر API جست‌وجوی وب، از جمله Brave، Exa، Firecrawl،
  Gemini، Grok، Kimi، MiniMax، Parallel، Perplexity و Tavily رفع می‌شوند؛
  چه ارائه‌دهنده به‌صورت صریح از طریق `tools.web.search.provider` انتخاب
  شده باشد و چه از طریق تشخیص خودکار. در حالت تشخیص خودکار، OpenClaw فقط
  کلید ارائه‌دهنده انتخاب‌شده را رفع می‌کند؛ SecretRefهای انتخاب‌نشده
  غیرفعال باقی می‌مانند، بنابراین می‌توانید چند ارائه‌دهنده را بدون پرداخت
  هزینه رفع برای مواردی که استفاده نمی‌کنید پیکربندی نگه دارید.
</Note>

## جست‌وجوی وب بومی OpenAI

مدل‌های مستقیم OpenAI Responses (`api: "openai-responses"`، ارائه‌دهندهٔ `openai`،
بدون URL پایه یا با URL پایهٔ رسمی OpenAI API) هنگامی که جست‌وجوی وب OpenClaw
فعال باشد و هیچ ارائه‌دهندهٔ مدیریت‌شده‌ای تثبیت نشده باشد، به‌طور خودکار از
ابزار میزبانی‌شدهٔ `web_search` متعلق به OpenAI استفاده می‌کنند. این رفتار متعلق
به ارائه‌دهنده در Plugin همراه OpenAI است و برای URLهای پایهٔ پراکسی سازگار با
OpenAI یا مسیرهای Azure اعمال نمی‌شود. برای حفظ ابزار مدیریت‌شدهٔ `web_search`
برای مدل‌های OpenAI، `tools.web.search.provider` را روی ارائه‌دهندهٔ دیگری مانند
`brave` تنظیم کنید، یا برای غیرفعال‌کردن جست‌وجوی مدیریت‌شده و جست‌وجوی بومی
OpenAI، `tools.web.search.enabled: false` را تنظیم کنید.

## جست‌وجوی وب بومی Codex

زمان اجرای app-server در Codex، هنگامی که جست‌وجوی وب فعال باشد و هیچ
ارائه‌دهندهٔ مدیریت‌شده‌ای انتخاب نشده باشد، به‌طور خودکار از ابزار میزبانی‌شدهٔ
`web_search` متعلق به Codex استفاده می‌کند. جست‌وجوی میزبانی‌شدهٔ بومی و ابزار
پویای مدیریت‌شدهٔ `web_search` در OpenClaw مانعةالجمع هستند؛ بنابراین جست‌وجوی
مدیریت‌شده نمی‌تواند محدودیت‌های دامنهٔ بومی را دور بزند. هنگامی که جست‌وجوی
میزبانی‌شده در دسترس نباشد، صراحتاً غیرفعال شده باشد، یا با یک ارائه‌دهندهٔ
مدیریت‌شدهٔ انتخابی جایگزین شود، OpenClaw از ابزار مدیریت‌شده استفاده می‌کند.
OpenClaw افزونهٔ مستقل `web.run` در Codex را غیرفعال نگه می‌دارد
(`features.standalone_web_search: false`)، زیرا ترافیک app-server در محیط
عملیاتی فضای نام `web` تعریف‌شده توسط کاربر را رد می‌کند.

- جست‌وجوی بومی را در `tools.web.search.openaiCodex` پیکربندی کنید
- برای فراهم‌کردن جست‌وجوی میزبانی‌شدهٔ Codex به‌عنوان ارائه‌دهندهٔ مدیریت‌شدهٔ
  `web_search` برای هر مدل والد، `tools.web.search.provider: "codex"` را تنظیم
  کنید. هر فراخوانی یک نوبت موقتی و محدودشدهٔ app-server در Codex را اجرا می‌کند
  و اگر Codex مورد میزبانی‌شدهٔ `webSearch` تولید نکند، با شکست مواجه می‌شود.
- `mode: "cached"` ترجیح پیش‌فرض است، اما Codex آن را برای نوبت‌های نامحدود
  app-server به دسترسی زندهٔ خارجی تبدیل می‌کند؛ برای درخواست صریح دسترسی زنده،
  `"live"` را تنظیم کنید
- برای استفاده از `web_search` مدیریت‌شدهٔ OpenClaw، `tools.web.search.provider`
  را روی یک ارائه‌دهندهٔ مدیریت‌شده مانند `brave` تنظیم کنید
- برای انصراف از جست‌وجوی میزبانی‌شده توسط Codex،
  `tools.web.search.openaiCodex.enabled: false` را تنظیم کنید؛ سایر
  ارائه‌دهندگان مدیریت‌شده همچنان در دسترس می‌مانند
- محدودکردن سطح ابزار بومی Codex نیز `web_search` مدیریت‌شده را در دسترس نگه
  می‌دارد
- هنگامی که `allowedDomains` تنظیم شده باشد، اگر جست‌وجوی میزبانی‌شده در دسترس
  نباشد، بازگشت خودکار به ابزار مدیریت‌شده به‌صورت بسته شکست می‌خورد تا فهرست
  مجاز بومی قابل دورزدن نباشد
- اجراهای صرفاً LLM که ابزارها در آن‌ها غیرفعال‌اند، جست‌وجوی بومی و مدیریت‌شده
  را هر دو غیرفعال می‌کنند
- `tools.web.search.enabled: false` جست‌وجوی مدیریت‌شده و بومی را هر دو غیرفعال
  می‌کند

تغییرات پایدار در سیاست مؤثر جست‌وجوی Codex یک رشتهٔ مقید تازه آغاز می‌کنند تا
یک رشتهٔ app-server که از قبل بارگذاری شده است نتواند دسترسی قدیمی به جست‌وجوی
میزبانی‌شده را حفظ کند. محدودیت‌های موقتی هر نوبت از یک رشتهٔ محدودشدهٔ موقت
استفاده می‌کنند و قید موجود را برای ازسرگیری بعدی حفظ می‌کنند.

ترافیک مستقیم OpenAI ChatGPT Responses نیز می‌تواند از ابزار میزبانی‌شدهٔ
`web_search` متعلق به OpenAI استفاده کند. آن مسیر جداگانه از طریق
`tools.web.search.openaiCodex.enabled: true` اختیاری باقی می‌ماند و فقط برای
مدل‌های واجد شرایط `openai/*` که از `api: "openai-chatgpt-responses"` استفاده
می‌کنند اعمال می‌شود.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // اختیاری: استفاده از جست‌وجوی میزبانی‌شدهٔ Codex از مدل‌های والد غیر Codex نیز.
        provider: "codex",
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

برای زمان‌های اجرا و ارائه‌دهندگانی که از جست‌وجوی بومی Codex پشتیبانی نمی‌کنند،
Codex می‌تواند از بازگشت مدیریت‌شدهٔ `web_search` از طریق فضای نام ابزار پویای
OpenClaw استفاده کند. هنگامی که به‌جای جست‌وجوی میزبانی‌شده توسط Codex به
کنترل‌های شبکهٔ مختص ارائه‌دهنده در OpenClaw نیاز دارید، از یک ارائه‌دهندهٔ
مدیریت‌شدهٔ صریح استفاده کنید.

انتخاب `provider: "codex"`، Plugin همراه `codex` را فعال می‌کند و از همان
محدودیت‌های `tools.web.search.openaiCodex` که در بالا نشان داده شده‌اند استفاده
می‌کند. ابتدا app-server در Codex را با
`openclaw models auth login --provider openai` احراز هویت کنید. عامل والد
می‌تواند از هر مدل یا زمان اجرایی استفاده کند؛ فقط کارگر محدودشدهٔ جست‌وجو از
طریق Codex اجرا می‌شود.

## ایمنی شبکه

فراخوانی‌های ارائه‌دهندهٔ مدیریت‌شدهٔ HTTP برای `web_search` از مسیر واکشی
محافظت‌شدهٔ OpenClaw استفاده می‌کنند که دامنهٔ آن به نام میزبان خود ارائه‌دهندهٔ
فعلی محدود است. OpenClaw فقط برای آن نام میزبان، پاسخ‌های DNS مبتنی بر IP
مصنوعی متعلق به Surge، Clash و sing-box را در `198.18.0.0/15` و `fc00::/7`
مجاز می‌داند. سایر مقصدهای خصوصی، loopback، پیوند-محلی و فراداده همچنان مسدود
می‌مانند. جست‌وجوی میزبانی‌شدهٔ Codex استثنا است: کارگر محدودشدهٔ آن دسترسی شبکه
را به ابزار میزبانی‌شدهٔ `web_search` در app-server متعلق به Codex واگذار
می‌کند.

این مجوز خودکار برای URLهای دلخواه `web_fetch` اعمال نمی‌شود. برای `web_fetch`
فقط هنگامی که پراکسی مورد اعتماد شما مالک این محدوده‌های مصنوعی است،
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` را صراحتاً فعال کنید.

## پیکربندی

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // پیش‌فرض: true
        provider: "brave", // یا برای تشخیص خودکار حذف شود
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

پیکربندی مختص ارائه‌دهنده (کلیدهای API، URLهای پایه، حالت‌ها) در
`plugins.entries.<plugin>.config.webSearch.*` قرار می‌گیرد. Gemini همچنین
می‌تواند پس از پیکربندی اختصاصی جست‌وجوی وب و `GEMINI_API_KEY` خود، از
`models.providers.google.apiKey` و `models.providers.google.baseUrl` به‌عنوان
گزینه‌های بازگشت با اولویت پایین‌تر استفاده کند. برای نمونه‌ها به صفحات
ارائه‌دهندگان مراجعه کنید.
Grok همچنین می‌تواند از نمایهٔ احراز هویت OAuth متعلق به xAI که با
`openclaw models auth login --provider xai --method oauth` ایجاد شده است
استفاده کند؛ پیکربندی کلید API همچنان گزینهٔ بازگشت است.

مقدار `tools.web.search.provider` با شناسه‌های ارائه‌دهندگان جست‌وجوی وب اعلام‌شده
در مانیفست‌های Pluginهای همراه و نصب‌شده اعتبارسنجی می‌شود. خطای تایپی مانند
`"brvae"` به‌جای بازگشت بی‌سروصدا به تشخیص خودکار، باعث شکست اعتبارسنجی پیکربندی
می‌شود. اگر یک ارائه‌دهندهٔ پیکربندی‌شده فقط شواهد قدیمی Plugin را داشته باشد،
مانند بلوک باقی‌ماندهٔ `plugins.entries.<plugin>` پس از حذف نصب یک Plugin شخص
ثالث، OpenClaw راه‌اندازی را تاب‌آور نگه می‌دارد و هشداری گزارش می‌کند تا بتوانید
Plugin را دوباره نصب کنید یا برای پاک‌سازی پیکربندی قدیمی
`openclaw doctor --fix` را اجرا کنید.

انتخاب ارائه‌دهندهٔ بازگشت `web_fetch` جداگانه است:

- آن را با `tools.web.fetch.provider` انتخاب کنید
- یا آن فیلد را حذف کنید و اجازه دهید OpenClaw نخستین ارائه‌دهندهٔ آمادهٔ
  واکشی وب را از اعتبارنامه‌های پیکربندی‌شده به‌طور خودکار تشخیص دهد
- `web_fetch` خارج از سندباکس می‌تواند از ارائه‌دهندگان Pluginهای نصب‌شده که
  `contracts.webFetchProviders` را اعلام می‌کنند استفاده کند؛ واکشی‌های داخل
  سندباکس ارائه‌دهندگان همراه و نصب‌های تأییدشدهٔ Pluginهای رسمی را مجاز
  می‌دانند، اما Pluginهای خارجی شخص ثالث را مستثنا می‌کنند
- Plugin رسمی Firecrawl تنها مشارکت‌کنندهٔ همراه `webFetchProviders` در حال
  حاضر است و در `plugins.entries.firecrawl.config.webFetch.*` پیکربندی می‌شود

هنگامی که در جریان `openclaw onboard` یا
`openclaw configure --section web` گزینهٔ **Kimi** را انتخاب می‌کنید، OpenClaw
همچنین می‌تواند این موارد را درخواست کند:

- منطقهٔ Moonshot API (`https://api.moonshot.ai/v1` یا `https://api.moonshot.cn/v1`)
- مدل پیش‌فرض جست‌وجوی وب Kimi (پیش‌فرض `kimi-k2.6` است)

برای `x_search`، مقدار `plugins.entries.xai.config.xSearch.*` را پیکربندی کنید.
این ابزار از همان نمایهٔ احراز هویت xAI مورد استفاده در گفت‌وگو، یا از
اعتبارنامهٔ `XAI_API_KEY` / جست‌وجوی وب Plugin که جست‌وجوی وب Grok استفاده
می‌کند، بهره می‌برد.
پیکربندی قدیمی `tools.web.x_search.*` به‌طور خودکار با
`openclaw doctor --fix` مهاجرت داده می‌شود.
هنگامی که در جریان `openclaw onboard` یا
`openclaw configure --section web` گزینهٔ Grok را انتخاب می‌کنید، OpenClaw
بلافاصله پس از تکمیل راه‌اندازی Grok، راه‌اندازی اختیاری `x_search` را نیز با
همان اعتبارنامه ارائه می‌دهد. این یک مرحلهٔ پیگیری جداگانه درون مسیر Grok است،
نه یک انتخاب جداگانهٔ ارائه‌دهندهٔ سطح‌بالای جست‌وجوی وب. اگر ارائه‌دهندهٔ دیگری
را انتخاب کنید، OpenClaw اعلان `x_search` را نمایش نمی‌دهد.

### ذخیره‌سازی کلیدهای API

<Tabs>
  <Tab title="فایل پیکربندی">
    `openclaw configure --section web` را اجرا کنید یا کلید را مستقیماً تنظیم کنید:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="متغیر محیطی">
    متغیر محیطی ارائه‌دهنده را در محیط فرایند Gateway تنظیم کنید:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    برای نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید.
    [متغیرهای محیطی](/fa/help/faq#env-vars-and-env-loading) را ببینید.

  </Tab>
</Tabs>

## پارامترهای ابزار

| پارامتر               | توضیحات                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | عبارت جست‌وجو (الزامی)                                             |
| `count`               | تعداد نتایج بازگشتی (۱ تا ۱۰، پیش‌فرض: ۵)                          |
| `country`             | کد دوحرفی کشور بر اساس ISO (برای نمونه `"US"`، `"DE"`)             |
| `language`            | کد زبان ISO 639-1 (برای نمونه `"en"`، `"de"`)                       |
| `search_lang`         | کد زبان جست‌وجو (فقط Brave)                                        |
| `freshness`           | فیلتر زمانی: `day`، `week`، `month` یا `year`                      |
| `date_after`          | نتایج پس از این تاریخ (YYYY-MM-DD)                                 |
| `date_before`         | نتایج پیش از این تاریخ (YYYY-MM-DD)                                |
| `ui_lang`             | کد زبان رابط کاربری (فقط Brave)                                    |
| `domain_filter`       | آرایهٔ فهرست مجاز/مسدود دامنه‌ها (فقط Perplexity)                  |
| `max_tokens`          | بودجهٔ کل توکن محتوا، فقط API بومی Perplexity Search               |
| `max_tokens_per_page` | محدودیت توکن استخراج برای هر صفحه، فقط API بومی Perplexity Search |

<Warning>
  همهٔ پارامترها با همهٔ ارائه‌دهندگان کار نمی‌کنند. حالت `llm-context` در Brave
  مقدار `ui_lang` را رد می‌کند؛ `date_before` نیز به `date_after` نیاز دارد،
  زیرا محدوده‌های سفارشی تازگی Brave به هر دو تاریخ آغاز و پایان نیاز دارند.
  Gemini، Grok و Kimi یک پاسخ ترکیبی همراه با ارجاع‌ها بازمی‌گردانند. آن‌ها
  برای سازگاری با ابزار مشترک `count` را می‌پذیرند، اما این مقدار شکل پاسخ
  مبتنی بر منابع را تغییر نمی‌دهد. Gemini تازگی `day` را به‌عنوان راهنمای
  تازگی در نظر می‌گیرد؛ مقادیر گسترده‌تر تازگی و تاریخ‌های صریح، محدوده‌های
  زمانی اتکای Google Search را تعیین می‌کنند.
  هنگام استفاده از مسیر سازگاری Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` یا `OPENROUTER_API_KEY`)، Perplexity نیز به همین شکل رفتار می‌کند؛
  آن مسیر پشتیبانی از `max_tokens` و `max_tokens_per_page` را نیز حذف می‌کند.
  SearXNG فقط برای میزبان‌های قابل اعتماد شبکهٔ خصوصی یا loopback،
  `http://` را می‌پذیرد؛ نقاط پایانی عمومی SearXNG باید از `https://` استفاده
  کنند.
  Firecrawl و Tavily از طریق `web_search` فقط از `query` و `count` پشتیبانی
  می‌کنند -- برای گزینه‌های پیشرفته از ابزارهای اختصاصی آن‌ها استفاده کنید.
</Warning>

## x_search

`x_search` با استفاده از xAI پست‌های X (توییتر سابق) را جست‌وجو می‌کند و
پاسخ‌های ترکیب‌شده توسط هوش مصنوعی را همراه با ارجاع‌ها بازمی‌گرداند. این ابزار
پرس‌وجوهای زبان طبیعی و فیلترهای ساخت‌یافتهٔ اختیاری را می‌پذیرد. OpenClaw ابزار
داخلی `x_search` متعلق به xAI را به‌جای ثبت دائمی، برای هر درخواست ایجاد می‌کند؛
بنابراین فقط در نوبتی فعال است که واقعاً آن را فراخوانی می‌کند.

<Warning>
  `x_search` روی سرورهای xAI اجرا می‌شود. xAI به‌ازای هر ۱٬۰۰۰ فراخوانی ابزار،
  ۵ دلار، به‌علاوهٔ هزینهٔ توکن‌های ورودی و خروجی مدل، دریافت می‌کند.
</Warning>

<Note>
  مستندات xAI بیان می‌کنند که `x_search` از جست‌وجوی کلیدواژه‌ای، جست‌وجوی
  معنایی، جست‌وجوی کاربر و واکشی رشته پشتیبانی می‌کند. برای آمار تعامل هر پست،
  مانند بازنشرها، پاسخ‌ها، نشانک‌ها یا بازدیدها، جست‌وجوی هدفمند URL دقیق پست یا
  شناسهٔ وضعیت را ترجیح دهید. جست‌وجوهای گستردهٔ کلیدواژه‌ای ممکن است پست درست
  را پیدا کنند، اما فرادادهٔ هر پست را با جزئیات کمتری بازگردانند. الگوی مناسب
  این است: ابتدا پست را پیدا کنید، سپس پرس‌وجوی دوم `x_search` را با تمرکز بر
  همان پست دقیق اجرا کنید.
</Note>

### پیکربندی x_search

با حذف `enabled`، ابزار `x_search` فقط زمانی در دسترس قرار می‌گیرد که ارائه‌دهندهٔ مدل فعال `xai` باشد و اطلاعات احراز هویت xAI با موفقیت تعیین شوند. برای یک مدل فعال با ارائه‌دهندهٔ شناخته‌شدهٔ غیر xAI، مقدار `plugins.entries.xai.config.xSearch.enabled` را روی `true` تنظیم کنید تا استفادهٔ بین‌ارائه‌دهنده‌ای فعال شود. اگر ارائه‌دهندهٔ مدل فعال مشخص نباشد یا تعیین نشود، ابزار پنهان می‌ماند. برای غیرفعال‌کردن آن برای همهٔ ارائه‌دهندگان، `enabled` را روی `false` تنظیم کنید. اطلاعات احراز هویت xAI همیشه الزامی است.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // برای ارائه‌دهندهٔ مدل شناخته‌شدهٔ غیر xAI الزامی است
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // اختیاری؛ webSearch.baseUrl را بازنویسی می‌کند
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // اگر نمایهٔ احراز هویت xAI یا XAI_API_KEY تنظیم شده باشد، اختیاری است
            baseUrl: "https://api.x.ai/v1", // نشانی پایهٔ مشترک و اختیاری Responses در xAI
          },
        },
      },
    },
  },
}
```

وقتی `plugins.entries.xai.config.xSearch.baseUrl` تنظیم شده باشد، `x_search` درخواست را به `<baseUrl>/responses` ارسال می‌کند. اگر این فیلد حذف شده باشد، ابتدا از `plugins.entries.xai.config.webSearch.baseUrl`، سپس از مقدار قدیمی `tools.web.search.grok.baseUrl` و در نهایت از نقطهٔ پایانی عمومی xAI (`https://api.x.ai/v1`) استفاده می‌کند.

### پارامترهای x_search

| پارامتر                      | توضیحات                                                        |
| ---------------------------- | -------------------------------------------------------------- |
| `query`                      | عبارت جست‌وجو (الزامی)                                         |
| `allowed_x_handles`          | محدودکردن نتایج به حداکثر ۲۰ شناسهٔ X                          |
| `excluded_x_handles`         | حذف حداکثر ۲۰ شناسهٔ X                                         |
| `from_date`                  | فقط شامل پست‌های منتشرشده در این تاریخ یا پس از آن (YYYY-MM-DD) |
| `to_date`                    | فقط شامل پست‌های منتشرشده در این تاریخ یا پیش از آن (YYYY-MM-DD) |
| `enable_image_understanding` | اجازه به xAI برای بررسی تصاویر پیوست‌شده به پست‌های منطبق       |
| `enable_video_understanding` | اجازه به xAI برای بررسی ویدئوهای پیوست‌شده به پست‌های منطبق     |

`allowed_x_handles` و `excluded_x_handles` را نمی‌توان هم‌زمان استفاده کرد.

### نمونهٔ x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// آمار هر پست: در صورت امکان از نشانی دقیق وضعیت یا شناسهٔ وضعیت استفاده کنید
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## نمونه‌ها

```javascript
// جست‌وجوی پایه
await web_search({ query: "OpenClaw plugin SDK" });

// جست‌وجوی ویژهٔ زبان آلمانی
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// نتایج اخیر (هفتهٔ گذشته)
await web_search({ query: "AI developments", freshness: "week" });

// بازهٔ زمانی
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// پالایش بر اساس دامنه (فقط Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## نمایه‌های ابزار

اگر از نمایه‌های ابزار یا فهرست‌های مجاز استفاده می‌کنید، `web_search`، `x_search` یا `group:web` را اضافه کنید:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // یا: allow: ["group:web"]  (شامل web_search، x_search و web_fetch است)
  },
}
```

## مطالب مرتبط

- [واکشی وب](/fa/tools/web-fetch) -- واکشی یک نشانی وب و استخراج محتوای خوانا
- [مرورگر وب](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای وب‌سایت‌های متکی بر JS
- [جست‌وجوی Grok](/fa/tools/grok-search) -- استفاده از Grok به‌عنوان ارائه‌دهندهٔ `web_search`
- [جست‌وجوی وب Ollama](/fa/tools/ollama-search) -- جست‌وجوی وب بدون نیاز به کلید از طریق میزبان Ollama شما
