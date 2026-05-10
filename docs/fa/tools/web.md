---
read_when:
    - می‌خواهید web_search را فعال یا پیکربندی کنید
    - می‌خواهید x_search را فعال یا پیکربندی کنید
    - باید یک ارائه‌دهندهٔ جست‌وجو انتخاب کنید
    - می‌خواهید تشخیص خودکار و سازوکار جایگزینی ارائه‌دهنده را درک کنید
sidebarTitle: Web Search
summary: web_search، x_search، و web_fetch -- جست‌وجوی وب، جست‌وجوی پست‌های X، یا واکشی محتوای صفحه
title: جست‌وجوی وب
x-i18n:
    generated_at: "2026-05-10T20:14:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c2806730f8c9cb33a3c142d5283de0f1231502e052c6da796c31125834a94e6
    source_path: tools/web.md
    workflow: 16
---

ابزار `web_search` با استفاده از ارائه‌دهندهٔ پیکربندی‌شدهٔ شما وب را جست‌وجو می‌کند و
نتایج را برمی‌گرداند. نتایج بر اساس پرس‌وجو به‌مدت ۱۵ دقیقه کش می‌شوند (قابل پیکربندی).

OpenClaw همچنین شامل `x_search` برای پست‌های X (قبلاً Twitter) و
`web_fetch` برای دریافت سبک URL است. در این مرحله، `web_fetch`
محلی می‌ماند، درحالی‌که `web_search` و `x_search` می‌توانند در پشت‌صحنه از xAI Responses استفاده کنند.

<Info>
  `web_search` یک ابزار HTTP سبک است، نه خودکارسازی مرورگر. برای
  سایت‌های سنگین از نظر JS یا ورود به حساب، از [مرورگر وب](/fa/tools/browser) استفاده کنید. برای
  دریافت یک URL مشخص، از [Web Fetch](/fa/tools/web-fetch) استفاده کنید.
</Info>

## شروع سریع

<Steps>
  <Step title="Choose a provider">
    یک ارائه‌دهنده انتخاب کنید و هر راه‌اندازی لازم را کامل کنید. برخی ارائه‌دهنده‌ها
    بدون کلید هستند، درحالی‌که برخی دیگر از کلیدهای API استفاده می‌کنند. برای
    جزئیات، صفحه‌های ارائه‌دهنده‌ها را در پایین ببینید.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    این کار ارائه‌دهنده و هر اعتبارنامهٔ لازم را ذخیره می‌کند. همچنین می‌توانید یک متغیر env
    تنظیم کنید (برای مثال `BRAVE_API_KEY`) و برای ارائه‌دهنده‌های مبتنی بر API
    از این مرحله بگذرید.
  </Step>
  <Step title="Use it">
    عامل اکنون می‌تواند `web_search` را فراخوانی کند:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    برای پست‌های X، استفاده کنید از:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## انتخاب ارائه‌دهنده

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/fa/tools/brave-search">
    نتایج ساختاریافته با قطعه‌متن‌ها. از حالت `llm-context` و فیلترهای کشور/زبان پشتیبانی می‌کند. ردهٔ رایگان موجود است.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fa/tools/duckduckgo-search">
    جایگزین بدون کلید. به کلید API نیاز ندارد. یکپارچه‌سازی غیررسمی مبتنی بر HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fa/tools/exa-search">
    جست‌وجوی عصبی + کلیدواژه‌ای همراه با استخراج محتوا (برجسته‌سازی‌ها، متن، خلاصه‌ها).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fa/tools/firecrawl">
    نتایج ساختاریافته. برای استخراج عمیق، بهترین حالت در کنار `firecrawl_search` و `firecrawl_scrape` است.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fa/tools/gemini-search">
    پاسخ‌های ساخته‌شده با AI همراه با ارجاع‌ها از طریق grounding در Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fa/tools/grok-search">
    پاسخ‌های ساخته‌شده با AI همراه با ارجاع‌ها از طریق grounding وب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fa/tools/kimi-search">
    پاسخ‌های ساخته‌شده با AI همراه با ارجاع‌ها از طریق جست‌وجوی وب Moonshot؛ جایگزین‌های چت بدون grounding صریحاً شکست می‌خورند.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fa/tools/minimax-search">
    نتایج ساختاریافته از طریق API جست‌وجوی MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fa/tools/ollama-search">
    جست‌وجو از طریق میزبان محلی Ollama که وارد حساب شده است، یا API میزبانی‌شدهٔ Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/fa/tools/perplexity-search">
    نتایج ساختاریافته با کنترل‌های استخراج محتوا و فیلتر دامنه.
  </Card>
  <Card title="SearXNG" icon="server" href="/fa/tools/searxng-search">
    متاجست‌وجوی خودمیزبان. به کلید API نیاز ندارد. Google، Bing، DuckDuckGo و موارد دیگر را تجمیع می‌کند.
  </Card>
  <Card title="Tavily" icon="globe" href="/fa/tools/tavily">
    نتایج ساختاریافته با عمق جست‌وجو، فیلتر موضوع و `tavily_extract` برای استخراج URL.
  </Card>
</CardGroup>

### مقایسهٔ ارائه‌دهنده‌ها

| ارائه‌دهنده                                  | سبک نتیجه                                                   | فیلترها                                          | کلید API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fa/tools/brave-search)              | قطعه‌متن‌های ساختاریافته                                            | کشور، زبان، زمان، حالت `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/fa/tools/duckduckgo-search)    | قطعه‌متن‌های ساختاریافته                                            | --                                               | هیچ‌کدام (بدون کلید)                                                                         |
| [Exa](/fa/tools/exa-search)                  | ساختاریافته + استخراج‌شده                                         | حالت عصبی/کلیدواژه‌ای، تاریخ، استخراج محتوا    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fa/tools/firecrawl)             | قطعه‌متن‌های ساختاریافته                                            | از طریق ابزار `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fa/tools/gemini-search)            | ساخته‌شده با AI + ارجاع‌ها                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/fa/tools/grok-search)                | ساخته‌شده با AI + ارجاع‌ها                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/fa/tools/kimi-search)                | ساخته‌شده با AI + ارجاع‌ها؛ در جایگزین‌های چت بدون grounding شکست می‌خورد | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fa/tools/minimax-search)   | قطعه‌متن‌های ساختاریافته                                            | منطقه (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/fa/tools/ollama-search) | قطعه‌متن‌های ساختاریافته                                            | --                                               | برای میزبان‌های محلی واردشده هیچ‌کدام؛ `OLLAMA_API_KEY` برای جست‌وجوی مستقیم `https://ollama.com` |
| [Perplexity](/fa/tools/perplexity-search)    | قطعه‌متن‌های ساختاریافته                                            | کشور، زبان، زمان، دامنه‌ها، محدودیت‌های محتوا | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fa/tools/searxng-search)          | قطعه‌متن‌های ساختاریافته                                            | دسته‌ها، زبان                             | هیچ‌کدام (خودمیزبان)                                                                      |
| [Tavily](/fa/tools/tavily)                   | قطعه‌متن‌های ساختاریافته                                            | از طریق ابزار `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## تشخیص خودکار

## جست‌وجوی وب بومی OpenAI

مدل‌های مستقیم OpenAI Responses وقتی جست‌وجوی وب OpenClaw فعال باشد و هیچ ارائه‌دهندهٔ مدیریت‌شده‌ای سنجاق نشده باشد، به‌طور خودکار از ابزار میزبانی‌شدهٔ `web_search` متعلق به OpenAI استفاده می‌کنند. این رفتار متعلق به ارائه‌دهنده در Plugin بسته‌بندی‌شدهٔ OpenAI است و فقط برای ترافیک بومی API OpenAI اعمال می‌شود، نه برای URLهای پایهٔ پراکسی سازگار با OpenAI یا مسیرهای Azure. برای نگه داشتن ابزار مدیریت‌شدهٔ `web_search` برای مدل‌های OpenAI، `tools.web.search.provider` را روی ارائه‌دهندهٔ دیگری مانند `brave` تنظیم کنید، یا برای غیرفعال کردن هم جست‌وجوی مدیریت‌شده و هم جست‌وجوی بومی OpenAI، `tools.web.search.enabled: false` را تنظیم کنید.

## جست‌وجوی وب بومی Codex

مدل‌های دارای قابلیت Codex می‌توانند به‌صورت اختیاری به‌جای تابع مدیریت‌شدهٔ `web_search` در OpenClaw، از ابزار بومی ارائه‌دهندهٔ Responses به نام `web_search` استفاده کنند.

- آن را زیر `tools.web.search.openaiCodex` پیکربندی کنید
- فقط برای مدل‌های دارای قابلیت Codex فعال می‌شود (`openai-codex/*` یا ارائه‌دهنده‌هایی که از `api: "openai-codex-responses"` استفاده می‌کنند)
- `web_search` مدیریت‌شده همچنان برای مدل‌های غیر Codex اعمال می‌شود
- `mode: "cached"` تنظیم پیش‌فرض و پیشنهادی است
- `tools.web.search.enabled: false` هم جست‌وجوی مدیریت‌شده و هم جست‌وجوی بومی را غیرفعال می‌کند

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

اگر جست‌وجوی بومی Codex فعال باشد اما مدل فعلی قابلیت Codex نداشته باشد، OpenClaw رفتار معمول `web_search` مدیریت‌شده را حفظ می‌کند.

## ایمنی شبکه

فراخوانی‌های ارائه‌دهندهٔ مدیریت‌شدهٔ `web_search` از مسیر fetch محافظت‌شدهٔ OpenClaw استفاده می‌کنند. برای
میزبان‌های API ارائه‌دهندهٔ مورد اعتماد، OpenClaw پاسخ‌های DNS از نوع fake-IP مربوط به Surge، Clash و sing-box
در `198.18.0.0/15` و `fc00::/7` را فقط برای همان نام میزبان ارائه‌دهنده مجاز می‌کند.
سایر مقصدهای خصوصی، loopback، link-local و فراداده همچنان مسدود می‌مانند.

این مجوز خودکار برای URLهای دلخواه `web_fetch` اعمال نمی‌شود. برای
`web_fetch`، فقط وقتی پراکسی مورد اعتماد شما مالک آن بازه‌های مصنوعی است،
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` را صریحاً فعال کنید.

## راه‌اندازی جست‌وجوی وب

فهرست‌های ارائه‌دهنده در مستندات و جریان‌های راه‌اندازی به‌ترتیب الفبایی هستند. تشخیص خودکار یک
ترتیب اولویت جداگانه را نگه می‌دارد.

اگر هیچ `provider`ای تنظیم نشده باشد، OpenClaw ارائه‌دهنده‌ها را به این ترتیب بررسی می‌کند و از
اولین مورد آماده استفاده می‌کند:

ابتدا ارائه‌دهنده‌های مبتنی بر API:

1. **Brave** -- `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey` (ترتیب ۱۰)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` یا `plugins.entries.minimax.config.webSearch.apiKey` (ترتیب ۱۵)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`، `GEMINI_API_KEY`، یا `models.providers.google.apiKey` (ترتیب ۲۰)
4. **Grok** -- `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey` (ترتیب ۳۰)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` یا `plugins.entries.moonshot.config.webSearch.apiKey` (ترتیب ۴۰)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` یا `plugins.entries.perplexity.config.webSearch.apiKey` (ترتیب ۵۰)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey` (ترتیب ۶۰)
8. **Exa** -- `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey`؛ مقدار اختیاری `plugins.entries.exa.config.webSearch.baseUrl` نقطهٔ پایانی Exa را بازنویسی می‌کند (ترتیب ۶۵)
9. **Tavily** -- `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey` (ترتیب ۷۰)

پس از آن جایگزین‌های بدون کلید:

10. **DuckDuckGo** -- جایگزین HTML بدون کلید و بدون نیاز به حساب یا کلید API (ترتیب ۱۰۰)
11. **Ollama Web Search** -- جایگزین بدون کلید از طریق میزبان محلی Ollama پیکربندی‌شدهٔ شما، وقتی قابل دسترسی باشد و با `ollama signin` وارد حساب شده باشد؛ وقتی میزبان به آن نیاز داشته باشد می‌تواند از احراز هویت bearer ارائه‌دهندهٔ Ollama دوباره استفاده کند، و وقتی با `OLLAMA_API_KEY` پیکربندی شده باشد می‌تواند جست‌وجوی مستقیم `https://ollama.com` را فراخوانی کند (ترتیب ۱۱۰)
12. **SearXNG** -- `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (ترتیب ۲۰۰)

اگر هیچ ارائه‌دهنده‌ای تشخیص داده نشود، به Brave برمی‌گردد (خطای کلیدِ موجود نیست
دریافت می‌کنید که از شما می‌خواهد یکی را پیکربندی کنید).

<Note>
  همهٔ فیلدهای کلید ارائه‌دهنده از اشیای SecretRef پشتیبانی می‌کنند. SecretRefهای در محدودهٔ Plugin
  زیر `plugins.entries.<plugin>.config.webSearch.apiKey` برای
  ارائه‌دهنده‌های جست‌وجوی وب مبتنی بر API و بسته‌بندی‌شده resolve می‌شوند، از جمله Brave، Exa، Firecrawl،
  Gemini، Grok، Kimi، MiniMax، Perplexity و Tavily،
  چه ارائه‌دهنده صریحاً از طریق `tools.web.search.provider` انتخاب شده باشد و چه
  از طریق تشخیص خودکار انتخاب شده باشد. در حالت تشخیص خودکار، OpenClaw فقط کلید
  ارائه‌دهندهٔ انتخاب‌شده را resolve می‌کند -- SecretRefهای انتخاب‌نشده غیرفعال می‌مانند، بنابراین می‌توانید
  چندین ارائه‌دهنده را بدون پرداخت هزینهٔ resolve برای مواردی که
  استفاده نمی‌کنید، پیکربندی‌شده نگه دارید.
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

پیکربندی مخصوص هر ارائه‌دهنده (کلیدهای API، نشانی‌های پایه، حالت‌ها) زیر
`plugins.entries.<plugin>.config.webSearch.*` قرار می‌گیرد. Gemini همچنین می‌تواند
`models.providers.google.apiKey` و `models.providers.google.baseUrl` را به‌عنوان جایگزین‌هایی
با اولویت پایین‌تر، پس از پیکربندی اختصاصی جست‌وجوی وب خودش و `GEMINI_API_KEY` دوباره استفاده کند. برای نمونه‌ها، صفحه‌های
ارائه‌دهنده‌ها را ببینید.

`tools.web.search.provider` بر اساس شناسه‌های ارائه‌دهنده جست‌وجوی وب
که در مانیفست‌های Pluginهای همراه و نصب‌شده اعلام شده‌اند اعتبارسنجی می‌شود. غلط املایی‌ای مانند `"brvae"`
به‌جای اینکه بی‌صدا به تشخیص خودکار برگردد، باعث شکست اعتبارسنجی پیکربندی می‌شود. اگر یک
ارائه‌دهنده پیکربندی‌شده فقط شواهد Plugin کهنه داشته باشد، مانند یک بلوک باقی‌مانده
`plugins.entries.<plugin>` پس از حذف نصب یک Plugin شخص ثالث،
OpenClaw راه‌اندازی را تاب‌آور نگه می‌دارد و هشداری گزارش می‌کند تا بتوانید
Plugin را دوباره نصب کنید یا برای پاک‌سازی پیکربندی کهنه `openclaw doctor --fix` را اجرا کنید.

انتخاب ارائه‌دهنده جایگزین `web_fetch` جداگانه است:

- آن را با `tools.web.fetch.provider` انتخاب کنید
- یا آن فیلد را حذف کنید و بگذارید OpenClaw نخستین ارائه‌دهنده آماده web-fetch را
  از اعتبارنامه‌های موجود به‌صورت خودکار تشخیص دهد
- `web_fetch` غیرسندباکس‌شده می‌تواند از ارائه‌دهنده‌های Plugin نصب‌شده‌ای استفاده کند که
  `contracts.webFetchProviders` را اعلام می‌کنند؛ دریافت‌های سندباکس‌شده فقط همراه‌ها را نگه می‌دارند
- امروز ارائه‌دهنده web-fetch همراه، Firecrawl است که زیر
  `plugins.entries.firecrawl.config.webFetch.*` پیکربندی می‌شود

وقتی هنگام `openclaw onboard` یا
`openclaw configure --section web` **Kimi** را انتخاب می‌کنید، OpenClaw همچنین می‌تواند این موارد را بپرسد:

- منطقه API مربوط به Moonshot (`https://api.moonshot.ai/v1` یا `https://api.moonshot.cn/v1`)
- مدل پیش‌فرض جست‌وجوی وب Kimi (پیش‌فرض `kimi-k2.6` است)

برای `x_search`، `plugins.entries.xai.config.xSearch.*` را پیکربندی کنید. این قابلیت از همان
نمایه احراز هویت xAI مانند چت، یا از اعتبارنامه `XAI_API_KEY` / جست‌وجوی وب Plugin
که توسط جست‌وجوی وب Grok استفاده می‌شود، بهره می‌برد.
پیکربندی قدیمی `tools.web.x_search.*` توسط `openclaw doctor --fix` به‌صورت خودکار مهاجرت می‌شود.
وقتی هنگام `openclaw onboard` یا `openclaw configure --section web`، Grok را انتخاب می‌کنید،
OpenClaw همچنین می‌تواند راه‌اندازی اختیاری `x_search` را با همان کلید پیشنهاد کند.
این یک گام پیگیری جداگانه داخل مسیر Grok است، نه یک گزینه جداگانه در سطح بالای
ارائه‌دهنده جست‌وجوی وب. اگر ارائه‌دهنده دیگری را انتخاب کنید، OpenClaw اعلان
`x_search` را نشان نمی‌دهد.

### ذخیره کلیدهای API

<Tabs>
  <Tab title="فایل پیکربندی">
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

| پارامتر              | توضیح                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | پرس‌وجوی جست‌وجو (الزامی)                            |
| `count`               | نتایجی که باید برگردانده شوند (1-10، پیش‌فرض: 5)     |
| `country`             | کد کشور دوحرفی ISO (مثلا "US"، "DE")                 |
| `language`            | کد زبان ISO 639-1 (مثلا "en"، "de")                  |
| `search_lang`         | کد زبان جست‌وجو (فقط Brave)                          |
| `freshness`           | فیلتر زمانی: `day`، `week`، `month`، یا `year`        |
| `date_after`          | نتایج پس از این تاریخ (YYYY-MM-DD)                   |
| `date_before`         | نتایج پیش از این تاریخ (YYYY-MM-DD)                  |
| `ui_lang`             | کد زبان رابط کاربری (فقط Brave)                      |
| `domain_filter`       | آرایه فهرست مجاز/فهرست مسدود دامنه‌ها (فقط Perplexity) |
| `max_tokens`          | بودجه کل محتوا، پیش‌فرض 25000 (فقط Perplexity)       |
| `max_tokens_per_page` | محدودیت توکن برای هر صفحه، پیش‌فرض 2048 (فقط Perplexity) |

<Warning>
  همه پارامترها با همه ارائه‌دهنده‌ها کار نمی‌کنند. حالت `llm-context` در Brave
  `ui_lang` را رد می‌کند؛ `date_before` همچنین به `date_after` نیاز دارد، زیرا بازه‌های
  سفارشی freshness در Brave هم به تاریخ شروع و هم به تاریخ پایان نیاز دارند.
  Gemini، Grok و Kimi یک پاسخ ترکیب‌شده همراه با ارجاع‌ها برمی‌گردانند. آن‌ها
  برای سازگاری با ابزار مشترک `count` را می‌پذیرند، اما این پارامتر شکل پاسخ
  مبتنی بر منابع را تغییر نمی‌دهد. Gemini از `freshness`، `date_after` و
  `date_before` با تبدیل آن‌ها به بازه‌های زمانی grounding جست‌وجوی Google پشتیبانی می‌کند.
  Perplexity هنگام استفاده از مسیر سازگاری Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` یا `OPENROUTER_API_KEY`) به همین شکل رفتار می‌کند.
  SearXNG فقط برای میزبان‌های قابل اعتماد شبکه خصوصی یا loopback، `http://` را می‌پذیرد؛
  نقطه‌های پایانی عمومی SearXNG باید از `https://` استفاده کنند.
  Firecrawl و Tavily از طریق `web_search` فقط از `query` و `count` پشتیبانی می‌کنند
  -- برای گزینه‌های پیشرفته از ابزارهای اختصاصی آن‌ها استفاده کنید.
</Warning>

## x_search

`x_search` با استفاده از xAI پست‌های X (که قبلا Twitter بود) را پرس‌وجو می‌کند و
پاسخ‌های ترکیب‌شده توسط AI همراه با ارجاع‌ها برمی‌گرداند. این ابزار پرس‌وجوهای زبان طبیعی و
فیلترهای ساخت‌یافته اختیاری را می‌پذیرد. OpenClaw ابزار داخلی `x_search`
متعلق به xAI را فقط در همان درخواستی فعال می‌کند که این فراخوانی ابزار را سرویس می‌دهد.

<Note>
  xAI مستند کرده است که `x_search` از جست‌وجوی کلیدواژه، جست‌وجوی معنایی، جست‌وجوی کاربر
  و واکشی رشته گفتگو پشتیبانی می‌کند. برای آمارهای تعامل هر پست مانند بازنشرها،
  پاسخ‌ها، نشانک‌ها یا بازدیدها، جست‌وجوی هدفمند برای URL دقیق پست
  یا شناسه وضعیت را ترجیح دهید. جست‌وجوهای گسترده کلیدواژه‌ای ممکن است پست درست را پیدا کنند اما فراداده
  هر پست را با کامل‌بودن کمتری برگردانند. یک الگوی خوب این است: ابتدا پست را پیدا کنید، سپس
  یک پرس‌وجوی دوم `x_search` اجرا کنید که روی همان پست دقیق متمرکز باشد.
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
به `plugins.entries.xai.config.webSearch.baseUrl`، سپس به
`tools.web.search.grok.baseUrl` قدیمی، و در نهایت به نقطه پایانی عمومی xAI برمی‌گردد.

### پارامترهای x_search

| پارامتر                     | توضیح                                                  |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | پرس‌وجوی جست‌وجو (الزامی)                             |
| `allowed_x_handles`          | محدود کردن نتایج به هندل‌های مشخص X                  |
| `excluded_x_handles`         | حذف هندل‌های مشخص X                                   |
| `from_date`                  | فقط پست‌های این تاریخ یا پس از آن را شامل شود (YYYY-MM-DD) |
| `to_date`                    | فقط پست‌های این تاریخ یا پیش از آن را شامل شود (YYYY-MM-DD) |
| `enable_image_understanding` | اجازه بده xAI تصاویر پیوست‌شده به پست‌های مطابق را بررسی کند |
| `enable_video_understanding` | اجازه بده xAI ویدیوهای پیوست‌شده به پست‌های مطابق را بررسی کند |

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

اگر از نمایه‌های ابزار یا فهرست‌های مجاز استفاده می‌کنید، `web_search`، `x_search`، یا `group:web` را اضافه کنید:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## مرتبط

- [واکشی وب](/fa/tools/web-fetch) -- واکشی یک URL و استخراج محتوای خوانا
- [مرورگر وب](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای سایت‌های سنگین از نظر JS
- [جست‌وجوی Grok](/fa/tools/grok-search) -- Grok به‌عنوان ارائه‌دهنده `web_search`
- [جست‌وجوی وب Ollama](/fa/tools/ollama-search) -- جست‌وجوی وب بدون کلید از طریق میزبان Ollama شما
