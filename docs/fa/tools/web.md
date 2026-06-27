---
read_when:
    - می‌خواهید web_search را فعال یا پیکربندی کنید
    - می‌خواهید x_search را فعال یا پیکربندی کنید
    - باید یک ارائه‌دهندهٔ جستجو انتخاب کنید
    - می‌خواهید شناسایی خودکار و انتخاب ارائه‌دهنده را درک کنید
sidebarTitle: Web Search
summary: web_search، x_search، و web_fetch -- جست‌وجوی وب، جست‌وجوی پست‌های X، یا واکشی محتوای صفحه
title: جستجوی وب
x-i18n:
    generated_at: "2026-06-27T19:07:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

ابزار `web_search` با استفاده از ارائه‌دهنده پیکربندی‌شده شما وب را جست‌وجو می‌کند و
نتایج را برمی‌گرداند. نتایج بر اساس پرس‌وجو به‌مدت ۱۵ دقیقه در کش نگه داشته می‌شوند (قابل پیکربندی).

OpenClaw همچنین شامل `x_search` برای پست‌های X (که قبلا Twitter بود) و
`web_fetch` برای واکشی سبک URL است. در این مرحله، `web_fetch` محلی می‌ماند
در حالی که `web_search` و `x_search` می‌توانند در پشت صحنه از xAI Responses استفاده کنند.

<Info>
  `web_search` یک ابزار سبک HTTP است، نه اتوماسیون مرورگر. برای
  سایت‌های سنگین از نظر JS یا ورود به حساب، از [مرورگر وب](/fa/tools/browser) استفاده کنید. برای
  واکشی یک URL مشخص، از [واکشی وب](/fa/tools/web-fetch) استفاده کنید.
</Info>

## شروع سریع

<Steps>
  <Step title="Choose a provider">
    یک ارائه‌دهنده انتخاب کنید و هر راه‌اندازی لازم را کامل کنید. برخی ارائه‌دهنده‌ها
    بدون کلید هستند، در حالی که برخی دیگر از کلیدهای API استفاده می‌کنند. برای
    جزئیات، صفحه‌های ارائه‌دهنده زیر را ببینید.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    این کار ارائه‌دهنده و هر اعتبارنامه لازم را ذخیره می‌کند. همچنین می‌توانید یک متغیر محیطی
    (برای مثال `BRAVE_API_KEY`) تنظیم کنید و برای ارائه‌دهنده‌های مبتنی بر API
    از این مرحله صرف‌نظر کنید.
  </Step>
  <Step title="Use it">
    اکنون عامل می‌تواند `web_search` را فراخوانی کند:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    برای پست‌های X، از این استفاده کنید:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## انتخاب ارائه‌دهنده

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/fa/tools/brave-search">
    نتایج ساخت‌یافته با قطعه‌متن‌ها. از حالت `llm-context` و فیلترهای کشور/زبان پشتیبانی می‌کند. سطح رایگان در دسترس است.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/fa/plugins/codex-harness">
    پاسخ‌های مبتنی بر AI و متکی بر منابع از طریق حساب app-server مربوط به Codex شما.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fa/tools/duckduckgo-search">
    ارائه‌دهنده بدون کلید. نیازی به کلید API نیست. یکپارچه‌سازی غیررسمی مبتنی بر HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fa/tools/exa-search">
    جست‌وجوی عصبی + کلیدواژه‌ای همراه با استخراج محتوا (برجسته‌سازی‌ها، متن، خلاصه‌ها).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fa/tools/firecrawl">
    نتایج ساخت‌یافته. برای استخراج عمیق، بهترین حالت استفاده همراه با `firecrawl_search` و `firecrawl_scrape` است.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fa/tools/gemini-search">
    پاسخ‌های مبتنی بر AI همراه با استنادها از طریق اتکای Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fa/tools/grok-search">
    پاسخ‌های مبتنی بر AI همراه با استنادها از طریق اتکای وب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fa/tools/kimi-search">
    پاسخ‌های مبتنی بر AI همراه با استنادها از طریق جست‌وجوی وب Moonshot؛ جایگزین‌های گفت‌وگوی بدون اتکا صریحا شکست می‌خورند.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fa/tools/minimax-search">
    نتایج ساخت‌یافته از طریق API جست‌وجوی MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fa/tools/ollama-search">
    جست‌وجو از طریق میزبان محلی Ollama که وارد آن شده‌اید یا API میزبانی‌شده Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/fa/tools/parallel-search">
    API پولی Parallel Search (`PARALLEL_API_KEY`)؛ محدودیت نرخ بالاتر و تنظیم هدف.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/fa/tools/parallel-search">
    انتخاب اختیاری بدون کلید. Search MCP رایگان Parallel، با گزیده‌های متراکم بهینه‌شده برای LLM و بدون کلید API.
  </Card>
  <Card title="Perplexity" icon="search" href="/fa/tools/perplexity-search">
    نتایج ساخت‌یافته با کنترل‌های استخراج محتوا و فیلتر دامنه.
  </Card>
  <Card title="SearXNG" icon="server" href="/fa/tools/searxng-search">
    فراجست‌وجوی خودمیزبان. نیازی به کلید API نیست. Google، Bing، DuckDuckGo و موارد بیشتر را تجمیع می‌کند.
  </Card>
  <Card title="Tavily" icon="globe" href="/fa/tools/tavily">
    نتایج ساخت‌یافته با عمق جست‌وجو، فیلتر موضوع، و `tavily_extract` برای استخراج URL.
  </Card>
</CardGroup>

### مقایسه ارائه‌دهنده‌ها

| ارائه‌دهنده                                      | سبک نتیجه                                                     | فیلترها                                         | کلید API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fa/tools/brave-search)                     | قطعه‌متن‌های ساخت‌یافته                                       | کشور، زبان، زمان، حالت `llm-context`            | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/fa/plugins/codex-harness)    | مبتنی بر AI + URLهای منبع                                     | دامنه‌ها، اندازه زمینه، مکان کاربر              | هیچ‌کدام؛ از ورود Codex/OpenAI استفاده می‌کند                                           |
| [DuckDuckGo](/fa/tools/duckduckgo-search)           | قطعه‌متن‌های ساخت‌یافته                                       | --                                               | هیچ‌کدام (بدون کلید)                                                                    |
| [Exa](/fa/tools/exa-search)                         | ساخت‌یافته + استخراج‌شده                                      | حالت عصبی/کلیدواژه‌ای، تاریخ، استخراج محتوا     | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fa/tools/firecrawl)                    | قطعه‌متن‌های ساخت‌یافته                                       | از طریق ابزار `firecrawl_search`                | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fa/tools/gemini-search)                   | مبتنی بر AI + استنادها                                        | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/fa/tools/grok-search)                       | مبتنی بر AI + استنادها                                        | --                                               | xAI OAuth، `XAI_API_KEY`، یا `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/fa/tools/kimi-search)                       | مبتنی بر AI + استنادها؛ روی جایگزین‌های گفت‌وگوی بدون اتکا شکست می‌خورد | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fa/tools/minimax-search)          | قطعه‌متن‌های ساخت‌یافته                                       | منطقه (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/fa/tools/ollama-search)        | قطعه‌متن‌های ساخت‌یافته                                       | --                                               | برای میزبان‌های محلی واردشده هیچ‌کدام؛ `OLLAMA_API_KEY` برای جست‌وجوی مستقیم `https://ollama.com` |
| [Parallel](/fa/tools/parallel-search)               | گزیده‌های متراکم رتبه‌بندی‌شده برای زمینه LLM                 | --                                               | `PARALLEL_API_KEY` (پولی)                                                               |
| [Parallel Search (Free)](/fa/tools/parallel-search) | گزیده‌های متراکم رتبه‌بندی‌شده برای زمینه LLM                 | --                                               | هیچ‌کدام (Search MCP رایگان)                                                           |
| [Perplexity](/fa/tools/perplexity-search)           | قطعه‌متن‌های ساخت‌یافته                                       | کشور، زبان، زمان، دامنه‌ها، محدودیت‌های محتوا   | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fa/tools/searxng-search)                 | قطعه‌متن‌های ساخت‌یافته                                       | دسته‌ها، زبان                                   | هیچ‌کدام (خودمیزبان)                                                                    |
| [Tavily](/fa/tools/tavily)                          | قطعه‌متن‌های ساخت‌یافته                                       | از طریق ابزار `tavily_search`                   | `TAVILY_API_KEY`                                                                        |

## تشخیص خودکار

## جست‌وجوی وب بومی OpenAI

مدل‌های مستقیم OpenAI Responses وقتی جست‌وجوی وب OpenClaw فعال باشد و هیچ ارائه‌دهنده مدیریت‌شده‌ای سنجاق نشده باشد، به‌طور خودکار از ابزار میزبانی‌شده `web_search` متعلق به OpenAI استفاده می‌کنند. این رفتاری متعلق به ارائه‌دهنده در Plugin بسته‌بندی‌شده OpenAI است و فقط برای ترافیک بومی API OpenAI اعمال می‌شود، نه URLهای پایه پروکسی سازگار با OpenAI یا مسیرهای Azure. برای نگه داشتن ابزار مدیریت‌شده `web_search` برای مدل‌های OpenAI، `tools.web.search.provider` را روی ارائه‌دهنده دیگری مانند `brave` تنظیم کنید، یا برای غیرفعال کردن هم جست‌وجوی مدیریت‌شده و هم جست‌وجوی بومی OpenAI، `tools.web.search.enabled: false` را تنظیم کنید.

## جست‌وجوی وب بومی Codex

زمان اجرای app-server مربوط به Codex وقتی جست‌وجوی وب فعال باشد و هیچ ارائه‌دهنده مدیریت‌شده‌ای انتخاب نشده باشد، به‌طور خودکار از ابزار میزبانی‌شده `web_search` متعلق به Codex استفاده می‌کند. جست‌وجوی میزبانی‌شده بومی و ابزار پویای مدیریت‌شده `web_search` متعلق به OpenClaw متقابلا انحصاری هستند، بنابراین جست‌وجوی مدیریت‌شده نمی‌تواند محدودیت‌های دامنه بومی را دور بزند. OpenClaw وقتی جست‌وجوی میزبانی‌شده در دسترس نباشد، صریحا غیرفعال شده باشد، یا با یک ارائه‌دهنده مدیریت‌شده منتخب جایگزین شده باشد، از ابزار مدیریت‌شده استفاده می‌کند. OpenClaw افزونه مستقل `web.run` متعلق به Codex را غیرفعال نگه می‌دارد، چون ترافیک app-server تولید، فضای نام `web` تعریف‌شده توسط کاربر را رد می‌کند.

- جست‌وجوی بومی را زیر `tools.web.search.openaiCodex` پیکربندی کنید
- `tools.web.search.provider: "codex"` را تنظیم کنید تا Codex Hosted Search به‌عنوان
  ارائه‌دهنده مدیریت‌شده `web_search` برای هر مدل والد فراهم‌سازی شود. هر فراخوانی یک
  نوبت app-server موقت و محدود Codex اجرا می‌کند و اگر Codex یک آیتم
  میزبانی‌شده `webSearch` منتشر نکند، شکست می‌خورد.
- `mode: "cached"` ترجیح پیش‌فرض است، اما Codex آن را برای نوبت‌های نامحدود app-server
  به دسترسی خارجی زنده تبدیل می‌کند؛ برای درخواست صریح دسترسی زنده، `"live"` را تنظیم کنید
- برای استفاده از `web_search` مدیریت‌شده OpenClaw، `tools.web.search.provider` را روی
  یک ارائه‌دهنده مدیریت‌شده مانند `brave` تنظیم کنید
- برای انصراف از جست‌وجوی میزبانی‌شده Codex، `tools.web.search.openaiCodex.enabled: false`
  را تنظیم کنید؛ سایر ارائه‌دهنده‌های مدیریت‌شده همچنان در دسترس می‌مانند
- محدود کردن سطح ابزار بومی Codex همچنین `web_search` مدیریت‌شده را
  در دسترس نگه می‌دارد
- وقتی `allowedDomains` تنظیم شده باشد، اگر جست‌وجوی میزبانی‌شده در دسترس نباشد،
  جایگزینی خودکار مدیریت‌شده به‌صورت بسته شکست می‌خورد تا فهرست مجاز بومی دور زده نشود
- اجراهای فقط LLM با ابزار غیرفعال، هم جست‌وجوی بومی و هم مدیریت‌شده را غیرفعال می‌کنند
- `tools.web.search.enabled: false` هم جست‌وجوی مدیریت‌شده و هم بومی را غیرفعال می‌کند

تغییرات پایدار و مؤثر در سیاست جست‌وجوی Codex یک رشته مقید تازه شروع می‌کنند تا
یک رشته app-server که از قبل بارگذاری شده است نتواند دسترسی کهنه به جست‌وجوی میزبانی‌شده را حفظ کند.
محدودیت‌های گذرای هر نوبت از یک رشته محدود موقت استفاده می‌کنند و اتصال
موجود را برای ازسرگیری بعدی حفظ می‌کنند.

ترافیک مستقیم OpenAI ChatGPT Responses نیز می‌تواند از ابزار میزبانی‌شده
`web_search` متعلق به OpenAI استفاده کند. آن مسیر جداگانه از طریق
`tools.web.search.openaiCodex.enabled: true` همچنان اختیاری است و فقط برای مدل‌های واجد شرایط
`openai/*` که از `api: "openai-chatgpt-responses"` استفاده می‌کنند اعمال می‌شود.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
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

برای زمان‌های اجرا و ارائه‌دهنده‌هایی که از جست‌وجوی بومی Codex پشتیبانی نمی‌کنند، Codex می‌تواند
از جایگزین مدیریت‌شده `web_search` از طریق فضای نام ابزار پویای OpenClaw استفاده کند.
وقتی به کنترل‌های شبکه خاص ارائه‌دهنده در OpenClaw به‌جای جست‌وجوی میزبانی‌شده Codex نیاز دارید،
از یک ارائه‌دهنده مدیریت‌شده صریح استفاده کنید.

انتخاب `provider: "codex"`، Plugin همراه `codex` را فعال می‌کند و از همان محدودیت‌های
`tools.web.search.openaiCodex` که در بالا نشان داده شد استفاده می‌کند. ابتدا app-server
Codex را با `openclaw models auth login --provider openai` احراز هویت کنید.
عامل والد می‌تواند از هر مدل یا runtime استفاده کند؛ فقط کارگر جست‌وجوی محدودشده
از طریق Codex اجرا می‌شود.

## ایمنی شبکه

فراخوانی‌های ارائه‌دهنده HTTP مدیریت‌شده `web_search` از مسیر fetch محافظت‌شده OpenClaw استفاده می‌کنند. برای
میزبان‌های API ارائه‌دهنده مورد اعتماد، OpenClaw پاسخ‌های DNS fake-IP مربوط به Surge، Clash و sing-box
را در `198.18.0.0/15` و `fc00::/7` فقط برای همان نام میزبان ارائه‌دهنده مجاز می‌کند.
سایر مقصدهای خصوصی، loopback، link-local و metadata همچنان مسدود می‌مانند.
جست‌وجوی میزبانی‌شده Codex استثنا است: کارگر محدودشده آن دسترسی شبکه را
به ابزار میزبانی‌شده `web_search` در app-server Codex واگذار می‌کند.

این مجوز خودکار برای URLهای دلخواه `web_fetch` اعمال نمی‌شود. برای
`web_fetch`، فقط زمانی `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` را صراحتا فعال کنید که
پروکسی مورد اعتماد شما مالک آن بازه‌های مصنوعی باشد.

## راه‌اندازی جست‌وجوی وب

فهرست ارائه‌دهنده‌ها در مستندات و جریان‌های راه‌اندازی به ترتیب الفبا هستند. تشخیص خودکار
ترتیب تقدم جداگانه‌ای را نگه می‌دارد.

اگر هیچ `provider` تنظیم نشده باشد، OpenClaw ارائه‌دهنده‌ها را به این ترتیب بررسی می‌کند و از
اولین موردی که آماده باشد استفاده می‌کند:

ابتدا ارائه‌دهنده‌های مبتنی بر API:

1. **Brave** -- `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey` (ترتیب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` یا `plugins.entries.minimax.config.webSearch.apiKey` (ترتیب 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`، `GEMINI_API_KEY`، یا `models.providers.google.apiKey` (ترتیب 20)
4. **Grok** -- OAuth متعلق به xAI، `XAI_API_KEY`، یا `plugins.entries.xai.config.webSearch.apiKey` (ترتیب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` یا `plugins.entries.moonshot.config.webSearch.apiKey` (ترتیب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` یا `plugins.entries.perplexity.config.webSearch.apiKey` (ترتیب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey` (ترتیب 60)
8. **Exa** -- `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey`؛ مقدار اختیاری `plugins.entries.exa.config.webSearch.baseUrl`، endpoint مربوط به Exa را بازنویسی می‌کند (ترتیب 65)
9. **Tavily** -- `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey` (ترتیب 70)
10. **Parallel** -- API پولی Parallel Search از طریق `PARALLEL_API_KEY` یا `plugins.entries.parallel.config.webSearch.apiKey`؛ مقدار اختیاری `plugins.entries.parallel.config.webSearch.baseUrl`، endpoint را بازنویسی می‌کند (ترتیب 75)

پس از آن، ارائه‌دهنده‌های endpoint پیکربندی‌شده:

11. **SearXNG** -- `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (ترتیب 200)

ارائه‌دهنده‌های بدون کلید مانند **Parallel Search (Free)**، **DuckDuckGo**،
**Ollama Web Search** و **Codex Hosted Search** فقط زمانی در دسترس هستند که
آن‌ها را صراحتا با `tools.web.search.provider` یا از طریق
`openclaw configure --section web` انتخاب کنید. OpenClaw صرفا به این دلیل که هیچ ارائه‌دهنده
مبتنی بر API پیکربندی نشده است، پرس‌وجوهای مدیریت‌شده `web_search` را به یک ارائه‌دهنده بدون کلید
ارسال نمی‌کند.

مدل‌های OpenAI Responses یک استثنا هستند: تا زمانی که `tools.web.search.provider`
تنظیم نشده باشد، آن‌ها به جای ارائه‌دهنده‌های مدیریت‌شده بالا از جست‌وجوی وب بومی OpenAI استفاده می‌کنند.
برای هدایت آن‌ها از مسیر مدیریت‌شده، `tools.web.search.provider` را روی `parallel-free` (یا ارائه‌دهنده‌ای دیگر)
تنظیم کنید.

<Note>
  همه فیلدهای کلید ارائه‌دهنده از اشیای SecretRef پشتیبانی می‌کنند. SecretRefهای در محدوده Plugin
  زیر `plugins.entries.<plugin>.config.webSearch.apiKey` برای ارائه‌دهنده‌های جست‌وجوی وب مبتنی بر API
  نصب‌شده resolve می‌شوند، از جمله Brave، Exa، Firecrawl،
  Gemini، Grok، Kimi، MiniMax، Parallel، Perplexity و Tavily،
  چه ارائه‌دهنده صراحتا از طریق `tools.web.search.provider` انتخاب شده باشد و چه
  از طریق تشخیص خودکار انتخاب شود. در حالت تشخیص خودکار، OpenClaw فقط کلید
  ارائه‌دهنده انتخاب‌شده را resolve می‌کند؛ SecretRefهای انتخاب‌نشده غیرفعال می‌مانند، بنابراین می‌توانید
  چند ارائه‌دهنده را پیکربندی‌شده نگه دارید بدون اینکه برای مواردی که استفاده نمی‌کنید
  هزینه resolve بپردازید.
</Note>

## پیکربندی

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

پیکربندی مخصوص هر ارائه‌دهنده (کلیدهای API، URLهای پایه، حالت‌ها) زیر
`plugins.entries.<plugin>.config.webSearch.*` قرار می‌گیرد. Gemini همچنین می‌تواند
`models.providers.google.apiKey` و `models.providers.google.baseUrl` را پس از پیکربندی اختصاصی
جست‌وجوی وب و `GEMINI_API_KEY` خود، به‌عنوان fallback با اولویت پایین‌تر دوباره استفاده کند. برای نمونه‌ها، صفحه‌های
ارائه‌دهنده‌ها را ببینید.
Grok همچنین می‌تواند از پروفایل احراز هویت OAuth مربوط به xAI از `openclaw models auth login
--provider xai --method oauth` دوباره استفاده کند؛ پیکربندی کلید API همچنان fallback باقی می‌ماند.

`tools.web.search.provider` در برابر شناسه‌های ارائه‌دهنده جست‌وجوی وب که
توسط manifestهای Plugin همراه و نصب‌شده اعلام شده‌اند اعتبارسنجی می‌شود. یک غلط املایی مانند `"brvae"`
به جای fallback خاموش به تشخیص خودکار، باعث شکست اعتبارسنجی پیکربندی می‌شود. اگر یک
ارائه‌دهنده پیکربندی‌شده فقط شواهد Plugin کهنه داشته باشد، مانند بلوک باقی‌مانده
`plugins.entries.<plugin>` پس از حذف نصب یک Plugin شخص ثالث،
OpenClaw شروع به کار را مقاوم نگه می‌دارد و هشداری گزارش می‌کند تا بتوانید
Plugin را دوباره نصب کنید یا `openclaw doctor --fix` را برای پاک‌سازی پیکربندی کهنه اجرا کنید.

انتخاب ارائه‌دهنده fallback برای `web_fetch` جداگانه است:

- آن را با `tools.web.fetch.provider` انتخاب کنید
- یا آن فیلد را حذف کنید و بگذارید OpenClaw اولین ارائه‌دهنده web-fetch آماده را
  از credentialهای پیکربندی‌شده به‌صورت خودکار تشخیص دهد
- `web_fetch` غیر sandboxشده می‌تواند از ارائه‌دهنده‌های Plugin نصب‌شده‌ای استفاده کند که
  `contracts.webFetchProviders` را اعلام می‌کنند؛ fetchهای sandboxشده ارائه‌دهنده‌های همراه و
  نصب‌های تاییدشده Plugin رسمی را مجاز می‌کنند، اما Pluginهای خارجی شخص ثالث را کنار می‌گذارند
- Plugin رسمی Firecrawl، fallback مربوط به web-fetch را ارائه می‌کند که زیر
  `plugins.entries.firecrawl.config.webFetch.*` پیکربندی می‌شود

وقتی در طول `openclaw onboard` یا
`openclaw configure --section web`، **Kimi** را انتخاب می‌کنید، OpenClaw همچنین می‌تواند این موارد را بپرسد:

- منطقه API مربوط به Moonshot (`https://api.moonshot.ai/v1` یا `https://api.moonshot.cn/v1`)
- مدل پیش‌فرض جست‌وجوی وب Kimi (پیش‌فرض `kimi-k2.6` است)

برای `x_search`، `plugins.entries.xai.config.xSearch.*` را پیکربندی کنید. این مورد از همان
پروفایل احراز هویت xAI مانند chat، یا credential مربوط به `XAI_API_KEY` / جست‌وجوی وب Plugin
که توسط جست‌وجوی وب Grok استفاده می‌شود، بهره می‌برد.
پیکربندی قدیمی `tools.web.x_search.*` توسط `openclaw doctor --fix` به‌صورت خودکار migrate می‌شود.
وقتی در طول `openclaw onboard` یا `openclaw configure --section web`، Grok را انتخاب می‌کنید،
OpenClaw همچنین می‌تواند راه‌اندازی اختیاری `x_search` را با همان credential پیشنهاد کند.
این یک مرحله پیگیری جداگانه داخل مسیر Grok است، نه یک انتخاب جداگانه در سطح بالای
ارائه‌دهنده جست‌وجوی وب. اگر ارائه‌دهنده دیگری را انتخاب کنید، OpenClaw prompt مربوط به
`x_search` را نشان نمی‌دهد.

### ذخیره‌سازی کلیدهای API

<Tabs>
  <Tab title="فایل پیکربندی">
    `openclaw configure --section web` را اجرا کنید یا کلید را مستقیم تنظیم کنید:

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
    متغیر محیطی ارائه‌دهنده را در محیط پردازش Gateway تنظیم کنید:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    برای نصب gateway، آن را در `~/.openclaw/.env` قرار دهید.
    [متغیرهای محیطی](/fa/help/faq#env-vars-and-env-loading) را ببینید.

  </Tab>
</Tabs>

## پارامترهای ابزار

| پارامتر              | توضیح                                                   |
| --------------------- | ----------------------------------------------------- |
| `query`               | پرس‌وجوی جست‌وجو (الزامی)                              |
| `count`               | نتایج برای بازگرداندن (1-10، پیش‌فرض: 5)               |
| `country`             | کد کشور ISO دوحرفی (مثلا "US"، "DE")                  |
| `language`            | کد زبان ISO 639-1 (مثلا "en"، "de")                   |
| `search_lang`         | کد زبان جست‌وجو (فقط Brave)                           |
| `freshness`           | فیلتر زمانی: `day`، `week`، `month`، یا `year`        |
| `date_after`          | نتایج پس از این تاریخ (YYYY-MM-DD)                    |
| `date_before`         | نتایج پیش از این تاریخ (YYYY-MM-DD)                   |
| `ui_lang`             | کد زبان UI (فقط Brave)                                |
| `domain_filter`       | آرایه allowlist/denylist دامنه (فقط Perplexity)       |
| `max_tokens`          | بودجه کل محتوا، پیش‌فرض 25000 (فقط Perplexity)        |
| `max_tokens_per_page` | سقف token در هر صفحه، پیش‌فرض 2048 (فقط Perplexity)   |

<Warning>
  همه پارامترها با همه ارائه‌دهنده‌ها کار نمی‌کنند. حالت Brave `llm-context`
  مقدار `ui_lang` را رد می‌کند؛ `date_before` همچنین به `date_after` نیاز دارد، زیرا بازه‌های
  freshness سفارشی Brave به تاریخ شروع و پایان نیاز دارند.
  Gemini، Grok و Kimi یک پاسخ ترکیب‌شده با citationها بازمی‌گردانند. آن‌ها
  برای سازگاری ابزار مشترک، `count` را می‌پذیرند، اما شکل پاسخ grounded را تغییر نمی‌دهد.
  Gemini مقدار freshness برابر `day` را به‌عنوان اشاره تازگی در نظر می‌گیرد؛ مقادیر گسترده‌تر
  freshness و تاریخ‌های صریح، بازه‌های زمانی grounding جست‌وجوی Google را تنظیم می‌کنند.
  Perplexity نیز وقتی از مسیر سازگاری Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` یا `OPENROUTER_API_KEY`) استفاده می‌کنید، همین رفتار را دارد.
  SearXNG فقط برای میزبان‌های شبکه خصوصی مورد اعتماد یا loopback، `http://` را می‌پذیرد؛
  endpointهای عمومی SearXNG باید از `https://` استفاده کنند.
  Firecrawl و Tavily فقط از `query` و `count` از طریق `web_search`
  پشتیبانی می‌کنند؛ برای گزینه‌های پیشرفته از ابزارهای اختصاصی آن‌ها استفاده کنید.
</Warning>

## x_search

`x_search` با استفاده از xAI، پست‌های X (قبلا Twitter) را جست‌وجو می‌کند و
پاسخ‌های تولیدشده با AI همراه با citation بازمی‌گرداند. این ابزار پرس‌وجوهای زبان طبیعی و
فیلترهای ساختاریافته اختیاری را می‌پذیرد. OpenClaw ابزار داخلی `x_search` مربوط به xAI را
فقط روی درخواستی فعال می‌کند که این فراخوانی ابزار را سرویس می‌دهد.

<Note>
  xAI مستند کرده است که `x_search` از جست‌وجوی کلیدواژه، جست‌وجوی معنایی، جست‌وجوی کاربر
  و دریافت thread پشتیبانی می‌کند. برای آمار engagement هر پست، مانند repostها،
  replyها، bookmarkها یا viewها، جست‌وجوی هدفمند برای URL دقیق پست
  یا status ID را ترجیح دهید. جست‌وجوهای گسترده کلیدواژه‌ای ممکن است پست درست را پیدا کنند اما metadata
  هر پست را کمتر کامل بازگردانند. یک الگوی خوب این است: ابتدا پست را پیدا کنید، سپس
  یک پرس‌وجوی دوم `x_search` متمرکز بر همان پست دقیق اجرا کنید.
</Note>

### پیکربندی x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

وقتی `plugins.entries.xai.config.xSearch.baseUrl` تنظیم شده باشد،
`x_search` به `<baseUrl>/responses` پست می‌کند. اگر آن فیلد حذف شده باشد،
به `plugins.entries.xai.config.webSearch.baseUrl`، سپس
`tools.web.search.grok.baseUrl` قدیمی و در نهایت endpoint عمومی xAI
fallback می‌کند.

### پارامترهای x_search

| پارامتر                    | توضیح                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | عبارت جست‌وجو (ضروری)                                |
| `allowed_x_handles`          | نتایج را به شناسه‌های X مشخص محدود کنید                 |
| `excluded_x_handles`         | شناسه‌های X مشخص را حذف کنید                             |
| `from_date`                  | فقط پست‌های در این تاریخ یا پس از آن را شامل شود (YYYY-MM-DD)  |
| `to_date`                    | فقط پست‌های در این تاریخ یا پیش از آن را شامل شود (YYYY-MM-DD) |
| `enable_image_understanding` | به xAI اجازه دهید تصاویر پیوست‌شده به پست‌های منطبق را بررسی کند      |
| `enable_video_understanding` | به xAI اجازه دهید ویدیوهای پیوست‌شده به پست‌های منطبق را بررسی کند      |

### نمونه x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## نمونه‌ها

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
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
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## مرتبط

- [Web Fetch](/fa/tools/web-fetch) -- یک URL را واکشی کرده و محتوای خوانا را استخراج می‌کند
- [Web Browser](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای سایت‌های سنگین از نظر JS
- [Grok Search](/fa/tools/grok-search) -- Grok به‌عنوان ارائه‌دهنده `web_search`
- [Ollama Web Search](/fa/tools/ollama-search) -- جست‌وجوی وب بدون کلید از طریق میزبان Ollama شما
