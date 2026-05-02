---
read_when:
    - می‌خواهید web_search را فعال یا پیکربندی کنید
    - می‌خواهید x_search را فعال یا پیکربندی کنید
    - باید یک ارائه‌دهندهٔ جست‌وجو انتخاب کنید
    - می‌خواهید تشخیص خودکار و بازگشت به ارائه‌دهندهٔ جایگزین را درک کنید
sidebarTitle: Web Search
summary: web_search، x_search، و web_fetch -- جست‌وجوی وب، جست‌وجوی پست‌های X، یا واکشی محتوای صفحه
title: جست‌وجوی وب
x-i18n:
    generated_at: "2026-05-02T12:07:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: faa333a522a6690e92e8bd00c6096c84b386a97cbfeb508654929a409b39b8ef
    source_path: tools/web.md
    workflow: 16
---

ابزار `web_search` با استفاده از ارائه‌دهندهٔ پیکربندی‌شدهٔ شما وب را جست‌وجو می‌کند و
نتایج را برمی‌گرداند. نتایج بر اساس پرس‌وجو به مدت ۱۵ دقیقه کش می‌شوند (قابل پیکربندی).

OpenClaw همچنین شامل `x_search` برای پست‌های X (که قبلاً Twitter بود) و
`web_fetch` برای دریافت سبک URL است. در این مرحله، `web_fetch` محلی می‌ماند
در حالی که `web_search` و `x_search` می‌توانند در پشت صحنه از xAI Responses استفاده کنند.

<Info>
  `web_search` یک ابزار سبک HTTP است، نه خودکارسازی مرورگر. برای
  سایت‌های وابسته به JS یا ورود به حساب، از [مرورگر وب](/fa/tools/browser) استفاده کنید. برای
  دریافت یک URL مشخص، از [Web Fetch](/fa/tools/web-fetch) استفاده کنید.
</Info>

## شروع سریع

<Steps>
  <Step title="انتخاب ارائه‌دهنده">
    یک ارائه‌دهنده انتخاب کنید و هر راه‌اندازی لازم را کامل کنید. برخی ارائه‌دهنده‌ها
    بدون کلید هستند، در حالی که برخی دیگر از کلیدهای API استفاده می‌کنند. برای
    جزئیات، صفحه‌های ارائه‌دهنده در پایین را ببینید.
  </Step>
  <Step title="پیکربندی">
    ```bash
    openclaw configure --section web
    ```
    این کار ارائه‌دهنده و هر اعتبارنامهٔ لازم را ذخیره می‌کند. همچنین می‌توانید یک متغیر env
    (برای نمونه `BRAVE_API_KEY`) تنظیم کنید و برای ارائه‌دهنده‌های متکی بر API
    این مرحله را رد کنید.
  </Step>
  <Step title="استفاده از آن">
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
    نتایج ساخت‌یافته همراه با قطعه‌ها. از حالت `llm-context` و فیلترهای کشور/زبان پشتیبانی می‌کند. سطح رایگان در دسترس است.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fa/tools/duckduckgo-search">
    جایگزین بدون کلید. به کلید API نیاز ندارد. یکپارچه‌سازی غیررسمی مبتنی بر HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fa/tools/exa-search">
    جست‌وجوی عصبی + کلیدواژه‌ای همراه با استخراج محتوا (برجسته‌سازی‌ها، متن، خلاصه‌ها).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fa/tools/firecrawl">
    نتایج ساخت‌یافته. برای استخراج عمیق، بهترین همراهی را با `firecrawl_search` و `firecrawl_scrape` دارد.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fa/tools/gemini-search">
    پاسخ‌های ترکیب‌شده با AI همراه با ارجاع‌ها از طریق اتکای Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fa/tools/grok-search">
    پاسخ‌های ترکیب‌شده با AI همراه با ارجاع‌ها از طریق اتکای وب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fa/tools/kimi-search">
    پاسخ‌های ترکیب‌شده با AI همراه با ارجاع‌ها از طریق جست‌وجوی وب Moonshot؛ جایگزین‌های گفت‌وگوی بدون اتکا صریحاً شکست می‌خورند.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fa/tools/minimax-search">
    نتایج ساخت‌یافته از طریق API جست‌وجوی MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fa/tools/ollama-search">
    جست‌وجو از طریق یک میزبان محلی Ollama که به آن وارد شده‌اید یا API میزبانی‌شدهٔ Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/fa/tools/perplexity-search">
    نتایج ساخت‌یافته همراه با کنترل‌های استخراج محتوا و فیلتر کردن دامنه.
  </Card>
  <Card title="SearXNG" icon="server" href="/fa/tools/searxng-search">
    متاجست‌وجوی خودمیزبان. به کلید API نیاز ندارد. Google، Bing، DuckDuckGo و موارد بیشتر را تجمیع می‌کند.
  </Card>
  <Card title="Tavily" icon="globe" href="/fa/tools/tavily">
    نتایج ساخت‌یافته همراه با عمق جست‌وجو، فیلتر کردن موضوع، و `tavily_extract` برای استخراج URL.
  </Card>
</CardGroup>

### مقایسهٔ ارائه‌دهنده‌ها

| ارائه‌دهنده                                  | سبک نتیجه                                                   | فیلترها                                          | کلید API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fa/tools/brave-search)              | قطعه‌های ساخت‌یافته                                            | کشور، زبان، زمان، حالت `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/fa/tools/duckduckgo-search)    | قطعه‌های ساخت‌یافته                                            | --                                               | ندارد (بدون کلید)                                                                         |
| [Exa](/fa/tools/exa-search)                  | ساخت‌یافته + استخراج‌شده                                         | حالت عصبی/کلیدواژه‌ای، تاریخ، استخراج محتوا    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fa/tools/firecrawl)             | قطعه‌های ساخت‌یافته                                            | از طریق ابزار `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fa/tools/gemini-search)            | ترکیب‌شده با AI + ارجاع‌ها                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/fa/tools/grok-search)                | ترکیب‌شده با AI + ارجاع‌ها                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/fa/tools/kimi-search)                | ترکیب‌شده با AI + ارجاع‌ها؛ در جایگزین‌های گفت‌وگوی بدون اتکا شکست می‌خورد | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fa/tools/minimax-search)   | قطعه‌های ساخت‌یافته                                            | منطقه (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/fa/tools/ollama-search) | قطعه‌های ساخت‌یافته                                            | --                                               | برای میزبان‌های محلی واردشده ندارد؛ `OLLAMA_API_KEY` برای جست‌وجوی مستقیم `https://ollama.com` |
| [Perplexity](/fa/tools/perplexity-search)    | قطعه‌های ساخت‌یافته                                            | کشور، زبان، زمان، دامنه‌ها، محدودیت‌های محتوا | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fa/tools/searxng-search)          | قطعه‌های ساخت‌یافته                                            | دسته‌ها، زبان                             | ندارد (خودمیزبان)                                                                      |
| [Tavily](/fa/tools/tavily)                   | قطعه‌های ساخت‌یافته                                            | از طریق ابزار `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## تشخیص خودکار

## جست‌وجوی وب بومی OpenAI

مدل‌های مستقیم OpenAI Responses وقتی جست‌وجوی وب OpenClaw فعال باشد و هیچ ارائه‌دهندهٔ مدیریت‌شده‌ای پین نشده باشد، به‌طور خودکار از ابزار میزبانی‌شدهٔ `web_search` متعلق به OpenAI استفاده می‌کنند. این رفتار متعلق به ارائه‌دهنده در Plugin بسته‌بندی‌شدهٔ OpenAI است و فقط برای ترافیک بومی OpenAI API اعمال می‌شود، نه URLهای پایهٔ پروکسی سازگار با OpenAI یا مسیرهای Azure. برای نگه داشتن ابزار مدیریت‌شدهٔ `web_search` برای مدل‌های OpenAI، `tools.web.search.provider` را روی ارائه‌دهندهٔ دیگری مانند `brave` تنظیم کنید، یا برای غیرفعال کردن هر دو جست‌وجوی مدیریت‌شده و جست‌وجوی بومی OpenAI، `tools.web.search.enabled: false` را تنظیم کنید.

## جست‌وجوی وب بومی Codex

مدل‌های سازگار با Codex می‌توانند به‌صورت اختیاری به جای تابع مدیریت‌شدهٔ `web_search` متعلق به OpenClaw، از ابزار `web_search` بومی ارائه‌دهنده در Responses استفاده کنند.

- آن را زیر `tools.web.search.openaiCodex` پیکربندی کنید
- فقط برای مدل‌های سازگار با Codex فعال می‌شود (`openai-codex/*` یا ارائه‌دهنده‌هایی که از `api: "openai-codex-responses"` استفاده می‌کنند)
- `web_search` مدیریت‌شده همچنان برای مدل‌های غیر Codex اعمال می‌شود
- `mode: "cached"` مقدار پیش‌فرض و تنظیم پیشنهادی است
- `tools.web.search.enabled: false` هر دو جست‌وجوی مدیریت‌شده و بومی را غیرفعال می‌کند

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
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

اگر جست‌وجوی بومی Codex فعال باشد اما مدل فعلی سازگار با Codex نباشد، OpenClaw رفتار عادی `web_search` مدیریت‌شده را حفظ می‌کند.

## راه‌اندازی جست‌وجوی وب

فهرست ارائه‌دهنده‌ها در مستندات و جریان‌های راه‌اندازی به‌ترتیب الفبایی هستند. تشخیص خودکار
یک ترتیب تقدم جداگانه را نگه می‌دارد.

اگر هیچ `provider` تنظیم نشده باشد، OpenClaw ارائه‌دهنده‌ها را به این ترتیب بررسی می‌کند و از
اولین مورد آماده استفاده می‌کند:

ابتدا ارائه‌دهنده‌های متکی بر API:

1. **Brave** -- `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey` (ترتیب ۱۰)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` یا `plugins.entries.minimax.config.webSearch.apiKey` (ترتیب ۱۵)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`، `GEMINI_API_KEY`، یا `models.providers.google.apiKey` (ترتیب ۲۰)
4. **Grok** -- `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey` (ترتیب ۳۰)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` یا `plugins.entries.moonshot.config.webSearch.apiKey` (ترتیب ۴۰)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` یا `plugins.entries.perplexity.config.webSearch.apiKey` (ترتیب ۵۰)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey` (ترتیب ۶۰)
8. **Exa** -- `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey`؛ `plugins.entries.exa.config.webSearch.baseUrl` اختیاری نقطهٔ پایانی Exa را بازنویسی می‌کند (ترتیب ۶۵)
9. **Tavily** -- `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey` (ترتیب ۷۰)

پس از آن جایگزین‌های بدون کلید:

10. **DuckDuckGo** -- جایگزین HTML بدون کلید، بدون نیاز به حساب یا کلید API (ترتیب ۱۰۰)
11. **Ollama Web Search** -- جایگزین بدون کلید از طریق میزبان محلی Ollama پیکربندی‌شدهٔ شما، وقتی قابل دسترسی باشد و با `ollama signin` به آن وارد شده باشید؛ وقتی میزبان به آن نیاز داشته باشد می‌تواند احراز هویت bearer ارائه‌دهندهٔ Ollama را دوباره استفاده کند، و وقتی با `OLLAMA_API_KEY` پیکربندی شده باشد می‌تواند جست‌وجوی مستقیم `https://ollama.com` را فراخوانی کند (ترتیب ۱۱۰)
12. **SearXNG** -- `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (ترتیب ۲۰۰)

اگر هیچ ارائه‌دهنده‌ای شناسایی نشود، به Brave برمی‌گردد (خطای نبود کلید
دریافت می‌کنید که از شما می‌خواهد یکی را پیکربندی کنید).

<Note>
  همهٔ فیلدهای کلید ارائه‌دهنده از اشیای SecretRef پشتیبانی می‌کنند. SecretRefهای محدودهٔ Plugin
  زیر `plugins.entries.<plugin>.config.webSearch.apiKey` برای
  ارائه‌دهنده‌های جست‌وجوی وب متکی بر API بسته‌بندی‌شده resolve می‌شوند، از جمله Brave، Exa، Firecrawl،
  Gemini، Grok، Kimi، MiniMax، Perplexity، و Tavily،
  چه ارائه‌دهنده صریحاً از طریق `tools.web.search.provider` انتخاب شده باشد و چه
  از طریق تشخیص خودکار انتخاب شده باشد. در حالت تشخیص خودکار، OpenClaw فقط کلید
  ارائه‌دهندهٔ انتخاب‌شده را resolve می‌کند -- SecretRefهای انتخاب‌نشده غیرفعال می‌مانند، بنابراین می‌توانید
  چندین ارائه‌دهنده را پیکربندی‌شده نگه دارید بدون اینکه برای مواردی که
  استفاده نمی‌کنید هزینهٔ resolve بپردازید.
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

پیکربندی مخصوص ارائه‌دهنده (کلیدهای API، URLهای پایه، حالت‌ها) زیر
`plugins.entries.<plugin>.config.webSearch.*` قرار دارد. Gemini همچنین می‌تواند
`models.providers.google.apiKey` و `models.providers.google.baseUrl` را به‌عنوان جایگزین‌های با اولویت پایین‌تر
پس از پیکربندی اختصاصی جست‌وجوی وب خودش و `GEMINI_API_KEY` دوباره استفاده کند. برای نمونه‌ها،
صفحه‌های ارائه‌دهنده را ببینید.

`tools.web.search.provider` در برابر شناسه‌های ارائه‌دهنده جست‌وجوی وب که در مانیفست‌های Pluginهای همراه و نصب‌شده اعلام شده‌اند اعتبارسنجی می‌شود. یک غلط املایی مانند `"brvae"` به‌جای بازگشت بی‌صدای به تشخیص خودکار، باعث شکست اعتبارسنجی پیکربندی می‌شود. اگر یک ارائه‌دهنده پیکربندی‌شده فقط شواهد Plugin کهنه داشته باشد، مانند بلوک باقی‌مانده `plugins.entries.<plugin>` پس از حذف یک Plugin شخص ثالث، OpenClaw راه‌اندازی را تاب‌آور نگه می‌دارد و هشداری گزارش می‌کند تا بتوانید Plugin را دوباره نصب کنید یا برای پاک‌سازی پیکربندی کهنه `openclaw doctor --fix` را اجرا کنید.

انتخاب ارائه‌دهنده پشتیبان `web_fetch` جداگانه است:

- آن را با `tools.web.fetch.provider` انتخاب کنید
- یا آن فیلد را حذف کنید و اجازه دهید OpenClaw نخستین ارائه‌دهنده آماده web-fetch را از اعتبارنامه‌های موجود به‌صورت خودکار تشخیص دهد
- `web_fetch` بدون sandbox می‌تواند از ارائه‌دهندگان Plugin نصب‌شده‌ای استفاده کند که `contracts.webFetchProviders` را اعلام می‌کنند؛ واکشی‌های sandboxشده فقط همراه باقی می‌مانند
- امروز ارائه‌دهنده web-fetch همراه Firecrawl است که زیر `plugins.entries.firecrawl.config.webFetch.*` پیکربندی می‌شود

وقتی در طول `openclaw onboard` یا
`openclaw configure --section web` **Kimi** را انتخاب می‌کنید، OpenClaw همچنین می‌تواند این موارد را بپرسد:

- منطقه Moonshot API (`https://api.moonshot.ai/v1` یا `https://api.moonshot.cn/v1`)
- مدل پیش‌فرض جست‌وجوی وب Kimi (پیش‌فرض `kimi-k2.6`)

برای `x_search`، `plugins.entries.xai.config.xSearch.*` را پیکربندی کنید. این از همان پشتیبان `XAI_API_KEY` مانند جست‌وجوی وب Grok استفاده می‌کند.
پیکربندی قدیمی `tools.web.x_search.*` با `openclaw doctor --fix` به‌صورت خودکار مهاجرت داده می‌شود.
وقتی در طول `openclaw onboard` یا `openclaw configure --section web`، Grok را انتخاب می‌کنید،
OpenClaw همچنین می‌تواند راه‌اندازی اختیاری `x_search` را با همان کلید پیشنهاد دهد.
این یک مرحله پیگیری جداگانه داخل مسیر Grok است، نه یک انتخاب ارائه‌دهنده جست‌وجوی وب سطح‌بالای جداگانه. اگر ارائه‌دهنده دیگری را انتخاب کنید، OpenClaw اعلان `x_search` را نشان نمی‌دهد.

### ذخیره‌سازی کلیدهای API

<Tabs>
  <Tab title="Config file">
    `openclaw configure --section web` را اجرا کنید یا کلید را مستقیما تنظیم کنید:

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
  <Tab title="Environment variable">
    متغیر محیطی ارائه‌دهنده را در محیط فرایند Gateway تنظیم کنید:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    برای نصب gateway، آن را در `~/.openclaw/.env` قرار دهید.
    [متغیرهای محیطی](/fa/help/faq#env-vars-and-env-loading) را ببینید.

  </Tab>
</Tabs>

## پارامترهای ابزار

| پارامتر             | توضیح                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | پرس‌وجوی جست‌وجو (الزامی)                               |
| `count`               | نتایج برای بازگرداندن (1-10، پیش‌فرض: 5)                  |
| `country`             | کد کشور ISO دوحرفی (مثلا "US"، "DE")           |
| `language`            | کد زبان ISO 639-1 (مثلا "en"، "de")             |
| `search_lang`         | کد زبان جست‌وجو (فقط Brave)                     |
| `freshness`           | فیلتر زمانی: `day`، `week`، `month` یا `year`        |
| `date_after`          | نتایج پس از این تاریخ (YYYY-MM-DD)                  |
| `date_before`         | نتایج پیش از این تاریخ (YYYY-MM-DD)                 |
| `ui_lang`             | کد زبان UI (فقط Brave)                         |
| `domain_filter`       | آرایه allowlist/denylist دامنه (فقط Perplexity)     |
| `max_tokens`          | بودجه کل محتوا، پیش‌فرض 25000 (فقط Perplexity) |
| `max_tokens_per_page` | سقف توکن به‌ازای هر صفحه، پیش‌فرض 2048 (فقط Perplexity)  |

<Warning>
  همه پارامترها با همه ارائه‌دهندگان کار نمی‌کنند. حالت `llm-context` در Brave
  `ui_lang` را رد می‌کند؛ `date_before` همچنین به `date_after` نیاز دارد، چون بازه‌های freshness سفارشی Brave به هر دو تاریخ شروع و پایان نیاز دارند.
  Gemini، Grok و Kimi یک پاسخ ترکیب‌شده با ارجاع‌ها برمی‌گردانند. آن‌ها
  `count` را برای سازگاری ابزار مشترک می‌پذیرند، اما شکل پاسخ grounded را تغییر نمی‌دهد.
  Gemini از `freshness`، `date_after` و
  `date_before` با تبدیل آن‌ها به بازه‌های زمانی grounding جست‌وجوی Google پشتیبانی می‌کند.
  Perplexity وقتی از مسیر سازگاری Sonar/OpenRouter استفاده می‌کنید
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` یا `OPENROUTER_API_KEY`) به همین شکل رفتار می‌کند.
  SearXNG فقط برای میزبان‌های شبکه خصوصی مورد اعتماد یا local loopback، `http://` را می‌پذیرد؛
  نقاط پایانی عمومی SearXNG باید از `https://` استفاده کنند.
  Firecrawl و Tavily فقط از `query` و `count` از طریق `web_search`
  پشتیبانی می‌کنند -- برای گزینه‌های پیشرفته از ابزارهای اختصاصی آن‌ها استفاده کنید.
</Warning>

## x_search

`x_search` با استفاده از xAI پست‌های X (قبلا Twitter) را پرس‌وجو می‌کند و
پاسخ‌های ترکیب‌شده با AI همراه با ارجاع‌ها برمی‌گرداند. این ابزار پرس‌وجوهای زبان طبیعی و
فیلترهای ساختاریافته اختیاری را می‌پذیرد. OpenClaw فقط در درخواستی که این فراخوانی ابزار را سرویس می‌دهد، ابزار داخلی `x_search` متعلق به xAI را فعال می‌کند.

<Note>
  xAI مستند کرده است که `x_search` از جست‌وجوی کلیدواژه، جست‌وجوی معنایی، جست‌وجوی کاربر
  و واکشی thread پشتیبانی می‌کند. برای آمار تعامل هر پست، مانند repostها،
  پاسخ‌ها، نشانک‌ها یا بازدیدها، یک lookup هدفمند برای URL دقیق پست
  یا status ID را ترجیح دهید. جست‌وجوهای گسترده کلیدواژه ممکن است پست درست را پیدا کنند، اما فراداده هر پست را با کامل‌بودن کمتر برگردانند. یک الگوی خوب این است: ابتدا پست را پیدا کنید، سپس
  یک پرس‌وجوی دوم `x_search` را متمرکز بر همان پست دقیق اجرا کنید.
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
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
به `plugins.entries.xai.config.webSearch.baseUrl`، سپس به
`tools.web.search.grok.baseUrl` قدیمی و در نهایت به نقطه پایانی عمومی xAI برمی‌گردد.

### پارامترهای x_search

| پارامتر                    | توضیح                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | پرس‌وجوی جست‌وجو (الزامی)                                |
| `allowed_x_handles`          | نتایج را به handleهای مشخص X محدود می‌کند                 |
| `excluded_x_handles`         | handleهای مشخص X را حذف می‌کند                             |
| `from_date`                  | فقط پست‌های این تاریخ یا پس از آن را شامل می‌شود (YYYY-MM-DD)  |
| `to_date`                    | فقط پست‌های این تاریخ یا پیش از آن را شامل می‌شود (YYYY-MM-DD) |
| `enable_image_understanding` | به xAI اجازه می‌دهد تصاویر پیوست‌شده به پست‌های منطبق را بررسی کند      |
| `enable_video_understanding` | به xAI اجازه می‌دهد ویدیوهای پیوست‌شده به پست‌های منطبق را بررسی کند      |

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

## پروفایل‌های ابزار

اگر از پروفایل‌های ابزار یا allowlistها استفاده می‌کنید، `web_search`، `x_search` یا `group:web` را اضافه کنید:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## مرتبط

- [Web Fetch](/fa/tools/web-fetch) -- واکشی یک URL و استخراج محتوای خواندنی
- [Web Browser](/fa/tools/browser) -- اتوماسیون کامل مرورگر برای سایت‌های سنگین از نظر JS
- [Grok Search](/fa/tools/grok-search) -- Grok به‌عنوان ارائه‌دهنده `web_search`
- [Ollama Web Search](/fa/tools/ollama-search) -- جست‌وجوی وب بدون کلید از طریق میزبان Ollama شما
