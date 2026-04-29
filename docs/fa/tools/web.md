---
read_when:
    - می‌خواهید web_search را فعال یا پیکربندی کنید
    - می‌خواهید x_search را فعال یا پیکربندی کنید
    - باید یک ارائه‌دهندهٔ جست‌وجو انتخاب کنید
    - می‌خواهید تشخیص خودکار و جایگزینی ارائه‌دهنده را بفهمید
sidebarTitle: Web Search
summary: web_search، x_search، و web_fetch -- جست‌وجوی وب، جست‌وجوی پست‌های X، یا دریافت محتوای صفحه
title: جست‌وجوی وب
x-i18n:
    generated_at: "2026-04-29T23:48:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

ابزار `web_search` وب را با استفاده از ارائه‌دهنده پیکربندی‌شده شما جست‌وجو می‌کند و
نتایج را برمی‌گرداند. نتایج بر اساس پرس‌وجو به‌مدت ۱۵ دقیقه کش می‌شوند (قابل پیکربندی).

OpenClaw همچنین شامل `x_search` برای پست‌های X (قبلاً Twitter) و
`web_fetch` برای دریافت سبک URL است. در این مرحله، `web_fetch` محلی می‌ماند
در حالی که `web_search` و `x_search` می‌توانند در پشت‌صحنه از xAI Responses استفاده کنند.

<Info>
  `web_search` یک ابزار HTTP سبک است، نه خودکارسازی مرورگر. برای
  سایت‌های سنگین از نظر JS یا ورود به حساب، از [مرورگر وب](/fa/tools/browser) استفاده کنید. برای
  دریافت یک URL مشخص، از [Web Fetch](/fa/tools/web-fetch) استفاده کنید.
</Info>

## شروع سریع

<Steps>
  <Step title="یک ارائه‌دهنده انتخاب کنید">
    یک ارائه‌دهنده انتخاب کنید و هرگونه راه‌اندازی لازم را تکمیل کنید. بعضی ارائه‌دهنده‌ها
    بدون کلید هستند، در حالی که بعضی دیگر از کلیدهای API استفاده می‌کنند. برای
    جزئیات، صفحه‌های ارائه‌دهنده‌ها را در ادامه ببینید.
  </Step>
  <Step title="پیکربندی">
    ```bash
    openclaw configure --section web
    ```
    این کار ارائه‌دهنده و هر اعتبارنامه لازم را ذخیره می‌کند. همچنین می‌توانید یک متغیر محیطی
    تنظیم کنید (برای مثال `BRAVE_API_KEY`) و برای ارائه‌دهنده‌های مبتنی بر API
    از این مرحله صرف‌نظر کنید.
  </Step>
  <Step title="استفاده از آن">
    اکنون عامل می‌تواند `web_search` را فراخوانی کند:

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
    نتایج ساخت‌یافته همراه با قطعه‌متن‌ها. از حالت `llm-context` و فیلترهای کشور/زبان پشتیبانی می‌کند. سطح رایگان در دسترس است.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fa/tools/duckduckgo-search">
    جایگزین بدون کلید. به کلید API نیاز ندارد. یکپارچه‌سازی غیررسمی مبتنی بر HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fa/tools/exa-search">
    جست‌وجوی عصبی + کلیدواژه‌ای همراه با استخراج محتوا (برجسته‌سازی‌ها، متن، خلاصه‌ها).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fa/tools/firecrawl">
    نتایج ساخت‌یافته. برای استخراج عمیق، بهترین حالت در کنار `firecrawl_search` و `firecrawl_scrape` است.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fa/tools/gemini-search">
    پاسخ‌های سنتزشده با هوش مصنوعی همراه با استنادها از طریق اتصال به Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fa/tools/grok-search">
    پاسخ‌های سنتزشده با هوش مصنوعی همراه با استنادها از طریق اتصال وب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fa/tools/kimi-search">
    پاسخ‌های سنتزشده با هوش مصنوعی همراه با استنادها از طریق جست‌وجوی وب Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fa/tools/minimax-search">
    نتایج ساخت‌یافته از طریق API جست‌وجوی MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fa/tools/ollama-search">
    جست‌وجو از طریق میزبان محلی Ollama که به آن وارد شده‌اید یا API میزبانی‌شده Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/fa/tools/perplexity-search">
    نتایج ساخت‌یافته همراه با کنترل‌های استخراج محتوا و فیلتر دامنه.
  </Card>
  <Card title="SearXNG" icon="server" href="/fa/tools/searxng-search">
    فرا-جست‌وجوی خودمیزبان. به کلید API نیاز ندارد. Google، Bing، DuckDuckGo و موارد بیشتر را تجمیع می‌کند.
  </Card>
  <Card title="Tavily" icon="globe" href="/fa/tools/tavily">
    نتایج ساخت‌یافته همراه با عمق جست‌وجو، فیلتر موضوع، و `tavily_extract` برای استخراج URL.
  </Card>
</CardGroup>

### مقایسه ارائه‌دهنده‌ها

| ارائه‌دهنده                                | سبک نتیجه                  | فیلترها                                          | کلید API                                                                                |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fa/tools/brave-search)              | قطعه‌متن‌های ساخت‌یافته    | کشور، زبان، زمان، حالت `llm-context`            | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/fa/tools/duckduckgo-search)    | قطعه‌متن‌های ساخت‌یافته    | --                                               | ندارد (بدون کلید)                                                                       |
| [Exa](/fa/tools/exa-search)                  | ساخت‌یافته + استخراج‌شده  | حالت عصبی/کلیدواژه‌ای، تاریخ، استخراج محتوا    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fa/tools/firecrawl)             | قطعه‌متن‌های ساخت‌یافته    | از طریق ابزار `firecrawl_search`                | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fa/tools/gemini-search)            | سنتزشده با هوش مصنوعی + استنادها | --                                         | `GEMINI_API_KEY`                                                                        |
| [Grok](/fa/tools/grok-search)                | سنتزشده با هوش مصنوعی + استنادها | --                                         | `XAI_API_KEY`                                                                           |
| [Kimi](/fa/tools/kimi-search)                | سنتزشده با هوش مصنوعی + استنادها | --                                         | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fa/tools/minimax-search)   | قطعه‌متن‌های ساخت‌یافته    | منطقه (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/fa/tools/ollama-search) | قطعه‌متن‌های ساخت‌یافته    | --                                               | برای میزبان‌های محلی واردشده ندارد؛ `OLLAMA_API_KEY` برای جست‌وجوی مستقیم `https://ollama.com` |
| [Perplexity](/fa/tools/perplexity-search)    | قطعه‌متن‌های ساخت‌یافته    | کشور، زبان، زمان، دامنه‌ها، محدودیت‌های محتوا  | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fa/tools/searxng-search)          | قطعه‌متن‌های ساخت‌یافته    | دسته‌ها، زبان                                   | ندارد (خودمیزبان)                                                                       |
| [Tavily](/fa/tools/tavily)                   | قطعه‌متن‌های ساخت‌یافته    | از طریق ابزار `tavily_search`                   | `TAVILY_API_KEY`                                                                        |

## تشخیص خودکار

## جست‌وجوی وب بومی OpenAI

مدل‌های مستقیم OpenAI Responses وقتی جست‌وجوی وب OpenClaw فعال باشد و هیچ ارائه‌دهنده مدیریت‌شده‌ای پین نشده باشد، به‌طور خودکار از ابزار میزبانی‌شده `web_search` متعلق به OpenAI استفاده می‌کنند. این رفتاری متعلق به ارائه‌دهنده در Plugin بسته‌بندی‌شده OpenAI است و فقط برای ترافیک بومی API OpenAI اعمال می‌شود، نه URLهای پایه پراکسی سازگار با OpenAI یا مسیرهای Azure. برای نگه داشتن ابزار مدیریت‌شده `web_search` برای مدل‌های OpenAI، `tools.web.search.provider` را روی ارائه‌دهنده دیگری مانند `brave` تنظیم کنید، یا برای غیرفعال‌کردن هر دو جست‌وجوی مدیریت‌شده و جست‌وجوی بومی OpenAI، `tools.web.search.enabled: false` را تنظیم کنید.

## جست‌وجوی وب بومی Codex

مدل‌های دارای قابلیت Codex می‌توانند به‌صورت اختیاری به‌جای تابع مدیریت‌شده `web_search` در OpenClaw، از ابزار بومی ارائه‌دهنده Responses یعنی `web_search` استفاده کنند.

- آن را زیر `tools.web.search.openaiCodex` پیکربندی کنید
- فقط برای مدل‌های دارای قابلیت Codex فعال می‌شود (`openai-codex/*` یا ارائه‌دهنده‌هایی که از `api: "openai-codex-responses"` استفاده می‌کنند)
- `web_search` مدیریت‌شده همچنان برای مدل‌های غیر Codex اعمال می‌شود
- `mode: "cached"` تنظیم پیش‌فرض و توصیه‌شده است
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

اگر جست‌وجوی بومی Codex فعال باشد اما مدل فعلی دارای قابلیت Codex نباشد، OpenClaw رفتار عادی `web_search` مدیریت‌شده را حفظ می‌کند.

## راه‌اندازی جست‌وجوی وب

فهرست ارائه‌دهنده‌ها در مستندات و جریان‌های راه‌اندازی به‌ترتیب الفبایی هستند. تشخیص خودکار
یک ترتیب اولویت جداگانه را حفظ می‌کند.

اگر هیچ `provider` تنظیم نشده باشد، OpenClaw ارائه‌دهنده‌ها را به این ترتیب بررسی می‌کند و از
اولین مورد آماده استفاده می‌کند:

ابتدا ارائه‌دهنده‌های مبتنی بر API:

1. **Brave** -- `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey` (ترتیب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` یا `plugins.entries.minimax.config.webSearch.apiKey` (ترتیب 15)
3. **Gemini** -- `GEMINI_API_KEY` یا `plugins.entries.google.config.webSearch.apiKey` (ترتیب 20)
4. **Grok** -- `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey` (ترتیب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` یا `plugins.entries.moonshot.config.webSearch.apiKey` (ترتیب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` یا `plugins.entries.perplexity.config.webSearch.apiKey` (ترتیب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey` (ترتیب 60)
8. **Exa** -- `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey` (ترتیب 65)
9. **Tavily** -- `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey` (ترتیب 70)

پس از آن جایگزین‌های بدون کلید:

10. **DuckDuckGo** -- جایگزین HTML بدون کلید، بدون نیاز به حساب یا کلید API (ترتیب 100)
11. **Ollama Web Search** -- جایگزین بدون کلید از طریق میزبان محلی Ollama پیکربندی‌شده شما، وقتی قابل دسترس باشد و با `ollama signin` به آن وارد شده باشید؛ وقتی میزبان به آن نیاز داشته باشد می‌تواند احراز هویت bearer ارائه‌دهنده Ollama را دوباره استفاده کند، و وقتی با `OLLAMA_API_KEY` پیکربندی شده باشد می‌تواند جست‌وجوی مستقیم `https://ollama.com` را فراخوانی کند (ترتیب 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (ترتیب 200)

اگر هیچ ارائه‌دهنده‌ای تشخیص داده نشود، به Brave برمی‌گردد (خطای نبود کلید
دریافت می‌کنید که از شما می‌خواهد یکی را پیکربندی کنید).

<Note>
  همه فیلدهای کلید ارائه‌دهنده از اشیای SecretRef پشتیبانی می‌کنند. SecretRefهای با دامنه Plugin
  زیر `plugins.entries.<plugin>.config.webSearch.apiKey` برای
  ارائه‌دهنده‌های بسته‌بندی‌شده جست‌وجوی وب مبتنی بر API حل می‌شوند، از جمله Brave، Exa، Firecrawl،
  Gemini، Grok، Kimi، MiniMax، Perplexity و Tavily،
  چه ارائه‌دهنده به‌صراحت از طریق `tools.web.search.provider` انتخاب شده باشد و چه
  از طریق تشخیص خودکار انتخاب شده باشد. در حالت تشخیص خودکار، OpenClaw فقط کلید
  ارائه‌دهنده انتخاب‌شده را حل می‌کند -- SecretRefهای انتخاب‌نشده غیرفعال می‌مانند، بنابراین می‌توانید
  چند ارائه‌دهنده را پیکربندی‌شده نگه دارید بدون اینکه برای مواردی که استفاده نمی‌کنید
  هزینه حل‌کردن بپردازید.
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

پیکربندی ویژه هر ارائه‌دهنده (کلیدهای API، URLهای پایه، حالت‌ها) زیر
`plugins.entries.<plugin>.config.webSearch.*` قرار دارد. برای
نمونه‌ها، صفحه‌های ارائه‌دهنده‌ها را ببینید.

انتخاب ارائه‌دهنده جایگزین `web_fetch` جداگانه است:

- آن را با `tools.web.fetch.provider` انتخاب کنید
- یا آن فیلد را حذف کنید و اجازه دهید OpenClaw نخستین ارائه‌دهنده web-fetch آماده را
  از اعتبارنامه‌های موجود به‌طور خودکار تشخیص دهد
- امروز ارائه‌دهنده بسته‌بندی‌شده web-fetch برابر Firecrawl است که زیر
  `plugins.entries.firecrawl.config.webFetch.*` پیکربندی می‌شود

وقتی در طول `openclaw onboard` یا
`openclaw configure --section web`، **Kimi** را انتخاب می‌کنید، OpenClaw همچنین می‌تواند این موارد را بپرسد:

- منطقه API Moonshot (`https://api.moonshot.ai/v1` یا `https://api.moonshot.cn/v1`)
- مدل پیش‌فرض جست‌وجوی وب Kimi (پیش‌فرض `kimi-k2.6` است)

برای `x_search`، `plugins.entries.xai.config.xSearch.*` را پیکربندی کنید. این ابزار از همان fallback مربوط به `XAI_API_KEY` استفاده می‌کند که جست‌وجوی وب Grok استفاده می‌کند.
پیکربندی قدیمی `tools.web.x_search.*` به‌طور خودکار با `openclaw doctor --fix` مهاجرت داده می‌شود.
وقتی در جریان `openclaw onboard` یا `openclaw configure --section web`، Grok را انتخاب می‌کنید،
OpenClaw همچنین می‌تواند راه‌اندازی اختیاری `x_search` را با همان کلید پیشنهاد دهد.
این یک گام پیگیری جداگانه داخل مسیر Grok است، نه یک انتخاب جداگانه در سطح بالای
ارائه‌دهنده جست‌وجوی وب. اگر ارائه‌دهنده دیگری را انتخاب کنید، OpenClaw اعلان `x_search` را
نشان نمی‌دهد.

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
| `query`               | پرس‌وجوی جست‌وجو (الزامی)                             |
| `count`               | تعداد نتایجی که برگردانده می‌شود (1-10، پیش‌فرض: 5)   |
| `country`             | کد کشور ISO دوحرفی (مثلاً "US"، "DE")                 |
| `language`            | کد زبان ISO 639-1 (مثلاً "en"، "de")                  |
| `search_lang`         | کد زبان جست‌وجو (فقط Brave)                           |
| `freshness`           | فیلتر زمانی: `day`، `week`، `month`، یا `year`         |
| `date_after`          | نتایج پس از این تاریخ (YYYY-MM-DD)                    |
| `date_before`         | نتایج پیش از این تاریخ (YYYY-MM-DD)                   |
| `ui_lang`             | کد زبان UI (فقط Brave)                                |
| `domain_filter`       | آرایه فهرست مجاز/مسدود دامنه‌ها (فقط Perplexity)      |
| `max_tokens`          | بودجه کل محتوا، پیش‌فرض 25000 (فقط Perplexity)        |
| `max_tokens_per_page` | سقف توکن برای هر صفحه، پیش‌فرض 2048 (فقط Perplexity)  |

<Warning>
  همه پارامترها با همه ارائه‌دهندگان کار نمی‌کنند. حالت `llm-context` در Brave
  `ui_lang`، `freshness`، `date_after` و `date_before` را رد می‌کند.
  Gemini، Grok و Kimi یک پاسخ ترکیب‌شده همراه با ارجاع‌ها برمی‌گردانند. آن‌ها
  برای سازگاری ابزار مشترک `count` را می‌پذیرند، اما شکل پاسخ مبتنی بر منبع را
  تغییر نمی‌دهد.
  Perplexity نیز وقتی از مسیر سازگاری Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` یا `OPENROUTER_API_KEY`) استفاده می‌کنید، همین رفتار را دارد.
  SearXNG فقط برای میزبان‌های قابل اعتماد در شبکه خصوصی یا loopback، `http://` را می‌پذیرد؛
  endpointهای عمومی SearXNG باید از `https://` استفاده کنند.
  Firecrawl و Tavily از طریق `web_search` فقط از `query` و `count` پشتیبانی می‌کنند
  -- برای گزینه‌های پیشرفته از ابزارهای اختصاصی آن‌ها استفاده کنید.
</Warning>

## x_search

`x_search` با استفاده از xAI پست‌های X (که پیش‌تر Twitter بود) را جست‌وجو می‌کند و
پاسخ‌های ترکیب‌شده با AI همراه با ارجاع‌ها برمی‌گرداند. این ابزار پرس‌وجوهای زبان طبیعی و
فیلترهای ساختاریافته اختیاری را می‌پذیرد. OpenClaw ابزار داخلی `x_search` مربوط به xAI را
فقط در درخواستی فعال می‌کند که این فراخوانی ابزار را سرویس می‌دهد.

<Note>
  xAI مستند کرده است که `x_search` از جست‌وجوی کلیدواژه‌ای، جست‌وجوی معنایی، جست‌وجوی کاربر
  و دریافت thread پشتیبانی می‌کند. برای آمار تعامل هر پست مانند repostها،
  پاسخ‌ها، bookmarkها یا بازدیدها، جست‌وجوی هدفمند برای URL دقیق پست
  یا status ID را ترجیح دهید. جست‌وجوهای گسترده کلیدواژه‌ای ممکن است پست درست را پیدا کنند اما metadata
  هر پست را با جزئیات کمتر برگردانند. یک الگوی خوب این است: ابتدا پست را پیدا کنید، سپس
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
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### پارامترهای x_search

| پارامتر                     | توضیح                                                  |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | پرس‌وجوی جست‌وجو (الزامی)                              |
| `allowed_x_handles`          | محدود کردن نتایج به handleهای مشخص X                  |
| `excluded_x_handles`         | کنار گذاشتن handleهای مشخص X                           |
| `from_date`                  | فقط پست‌های این تاریخ یا پس از آن را شامل شود (YYYY-MM-DD) |
| `to_date`                    | فقط پست‌های این تاریخ یا پیش از آن را شامل شود (YYYY-MM-DD) |
| `enable_image_understanding` | اجازه دادن به xAI برای بررسی تصاویر پیوست‌شده به پست‌های منطبق |
| `enable_video_understanding` | اجازه دادن به xAI برای بررسی ویدیوهای پیوست‌شده به پست‌های منطبق |

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

اگر از پروفایل‌های ابزار یا فهرست‌های مجاز استفاده می‌کنید، `web_search`، `x_search`، یا `group:web` را اضافه کنید:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## مرتبط

- [دریافت وب](/fa/tools/web-fetch) -- دریافت یک URL و استخراج محتوای خوانا
- [مرورگر وب](/fa/tools/browser) -- اتوماسیون کامل مرورگر برای سایت‌های سنگین از نظر JS
- [جست‌وجوی Grok](/fa/tools/grok-search) -- Grok به‌عنوان ارائه‌دهنده `web_search`
- [جست‌وجوی وب Ollama](/fa/tools/ollama-search) -- جست‌وجوی وب بدون کلید از طریق میزبان Ollama
