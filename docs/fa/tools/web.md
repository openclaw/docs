---
read_when:
    - می‌خواهید web_search را فعال یا پیکربندی کنید
    - می‌خواهید x_search را فعال یا پیکربندی کنید
    - باید یک ارائه‌دهندهٔ جست‌وجو انتخاب کنید
    - می‌خواهید تشخیص خودکار و استفاده از ارائه‌دهنده جایگزین را درک کنید
sidebarTitle: Web Search
summary: web_search، x_search، و web_fetch -- جست‌وجوی وب، جست‌وجوی پست‌های X، یا واکشی محتوای صفحه
title: جست‌وجوی وب
x-i18n:
    generated_at: "2026-05-03T21:42:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84de67b51f02e3b901bfa55017ae8e88de49295dfe6ed1103a45f034e073c087
    source_path: tools/web.md
    workflow: 16
---

ابزار `web_search` با استفاده از ارائه‌دهنده پیکربندی‌شده شما وب را جست‌وجو می‌کند و
نتایج را برمی‌گرداند. نتایج بر اساس query به مدت ۱۵ دقیقه cache می‌شوند (قابل پیکربندی).

OpenClaw همچنین `x_search` را برای پست‌های X (که پیش‌تر Twitter بود) و
`web_fetch` را برای واکشی سبک URL شامل می‌شود. در این مرحله، `web_fetch`
محلی می‌ماند، در حالی که `web_search` و `x_search` می‌توانند در پشت صحنه از xAI Responses استفاده کنند.

<Info>
  `web_search` یک ابزار سبک HTTP است، نه اتوماسیون مرورگر. برای سایت‌های
  سنگین از نظر JS یا ورود به حساب، از [مرورگر وب](/fa/tools/browser) استفاده کنید. برای
  واکشی یک URL مشخص، از [واکشی وب](/fa/tools/web-fetch) استفاده کنید.
</Info>

## شروع سریع

<Steps>
  <Step title="انتخاب یک ارائه‌دهنده">
    یک ارائه‌دهنده انتخاب کنید و هر راه‌اندازی لازم را کامل کنید. برخی ارائه‌دهنده‌ها
    بدون کلید هستند، در حالی که برخی دیگر از کلیدهای API استفاده می‌کنند. برای
    جزئیات، صفحه‌های ارائه‌دهنده زیر را ببینید.
  </Step>
  <Step title="پیکربندی">
    ```bash
    openclaw configure --section web
    ```
    این کار ارائه‌دهنده و هر اعتبارنامه لازم را ذخیره می‌کند. همچنین می‌توانید یک env
    var (برای مثال `BRAVE_API_KEY`) تنظیم کنید و برای ارائه‌دهنده‌های مبتنی بر API
    از این مرحله بگذرید.
  </Step>
  <Step title="استفاده از آن">
    اکنون agent می‌تواند `web_search` را فراخوانی کند:

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
    نتایج ساختاریافته همراه با snippetها. از حالت `llm-context` و فیلترهای کشور/زبان پشتیبانی می‌کند. سطح رایگان موجود است.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fa/tools/duckduckgo-search">
    fallback بدون کلید. نیازی به کلید API نیست. یکپارچه‌سازی غیررسمی مبتنی بر HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fa/tools/exa-search">
    جست‌وجوی عصبی + کلیدواژه‌ای با استخراج محتوا (هایلایت‌ها، متن، خلاصه‌ها).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fa/tools/firecrawl">
    نتایج ساختاریافته. برای استخراج عمیق، بهترین حالت استفاده همراه با `firecrawl_search` و `firecrawl_scrape` است.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fa/tools/gemini-search">
    پاسخ‌های ساخته‌شده با AI همراه با citationها از طریق grounding با Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fa/tools/grok-search">
    پاسخ‌های ساخته‌شده با AI همراه با citationها از طریق grounding وب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fa/tools/kimi-search">
    پاسخ‌های ساخته‌شده با AI همراه با citationها از طریق جست‌وجوی وب Moonshot؛ fallbackهای chat بدون grounding صریحا شکست می‌خورند.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fa/tools/minimax-search">
    نتایج ساختاریافته از طریق API جست‌وجوی MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fa/tools/ollama-search">
    جست‌وجو از طریق میزبان محلی Ollama که به آن وارد شده‌اید یا API میزبانی‌شده Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/fa/tools/perplexity-search">
    نتایج ساختاریافته با کنترل‌های استخراج محتوا و فیلتر دامنه.
  </Card>
  <Card title="SearXNG" icon="server" href="/fa/tools/searxng-search">
    meta-search خودمیزبان. نیازی به کلید API نیست. Google، Bing، DuckDuckGo و موارد بیشتر را تجمیع می‌کند.
  </Card>
  <Card title="Tavily" icon="globe" href="/fa/tools/tavily">
    نتایج ساختاریافته با عمق جست‌وجو، فیلتر موضوع و `tavily_extract` برای استخراج URL.
  </Card>
</CardGroup>

### مقایسه ارائه‌دهنده‌ها

| ارائه‌دهنده                                  | سبک نتیجه                                                   | فیلترها                                          | کلید API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fa/tools/brave-search)              | snippetهای ساختاریافته                                            | کشور، زبان، زمان، حالت `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/fa/tools/duckduckgo-search)    | snippetهای ساختاریافته                                            | --                                               | هیچ‌کدام (بدون کلید)                                                                         |
| [Exa](/fa/tools/exa-search)                  | ساختاریافته + استخراج‌شده                                         | حالت عصبی/کلیدواژه‌ای، تاریخ، استخراج محتوا    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fa/tools/firecrawl)             | snippetهای ساختاریافته                                            | از طریق ابزار `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fa/tools/gemini-search)            | ساخته‌شده با AI + citationها                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/fa/tools/grok-search)                | ساخته‌شده با AI + citationها                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/fa/tools/kimi-search)                | ساخته‌شده با AI + citationها؛ در fallbackهای chat بدون grounding شکست می‌خورد | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fa/tools/minimax-search)   | snippetهای ساختاریافته                                            | منطقه (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/fa/tools/ollama-search) | snippetهای ساختاریافته                                            | --                                               | برای میزبان‌های محلی واردشده هیچ‌کدام؛ `OLLAMA_API_KEY` برای جست‌وجوی مستقیم `https://ollama.com` |
| [Perplexity](/fa/tools/perplexity-search)    | snippetهای ساختاریافته                                            | کشور، زبان، زمان، دامنه‌ها، محدودیت‌های محتوا | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fa/tools/searxng-search)          | snippetهای ساختاریافته                                            | دسته‌ها، زبان                             | هیچ‌کدام (خودمیزبان)                                                                      |
| [Tavily](/fa/tools/tavily)                   | snippetهای ساختاریافته                                            | از طریق ابزار `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## شناسایی خودکار

## جست‌وجوی وب بومی OpenAI

مدل‌های مستقیم OpenAI Responses وقتی جست‌وجوی وب OpenClaw فعال باشد و هیچ ارائه‌دهنده مدیریت‌شده‌ای pin نشده باشد، به‌طور خودکار از ابزار میزبانی‌شده `web_search` متعلق به OpenAI استفاده می‌کنند. این رفتار متعلق به ارائه‌دهنده در Plugin بسته‌بندی‌شده OpenAI است و فقط برای ترافیک API بومی OpenAI اعمال می‌شود، نه URLهای پایه proxy سازگار با OpenAI یا مسیرهای Azure. برای نگه داشتن ابزار مدیریت‌شده `web_search` برای مدل‌های OpenAI، `tools.web.search.provider` را روی ارائه‌دهنده‌ای دیگر مانند `brave` تنظیم کنید، یا برای غیرفعال کردن هم جست‌وجوی مدیریت‌شده و هم جست‌وجوی بومی OpenAI، `tools.web.search.enabled: false` را تنظیم کنید.

## جست‌وجوی وب بومی Codex

مدل‌های دارای قابلیت Codex می‌توانند به‌صورت اختیاری به‌جای تابع مدیریت‌شده `web_search` متعلق به OpenClaw، از ابزار `web_search` بومی ارائه‌دهنده در Responses استفاده کنند.

- آن را زیر `tools.web.search.openaiCodex` پیکربندی کنید
- فقط برای مدل‌های دارای قابلیت Codex فعال می‌شود (`openai-codex/*` یا ارائه‌دهنده‌هایی که از `api: "openai-codex-responses"` استفاده می‌کنند)
- `web_search` مدیریت‌شده همچنان برای مدل‌های غیر Codex اعمال می‌شود
- `mode: "cached"` تنظیم پیش‌فرض و توصیه‌شده است
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

اگر جست‌وجوی بومی Codex فعال باشد اما مدل فعلی قابلیت Codex نداشته باشد، OpenClaw رفتار عادی `web_search` مدیریت‌شده را حفظ می‌کند.

## ایمنی شبکه

فراخوانی‌های ارائه‌دهنده مدیریت‌شده `web_search` از مسیر fetch محافظت‌شده OpenClaw استفاده می‌کنند. برای
میزبان‌های API ارائه‌دهنده مورد اعتماد، OpenClaw پاسخ‌های DNS جعلی-IP
Surge، Clash و sing-box را در `198.18.0.0/15` و `fc00::/7` فقط برای hostname همان ارائه‌دهنده مجاز می‌کند.
مقصدهای private، loopback، link-local و metadata دیگر همچنان مسدود می‌مانند.

این مجوز خودکار برای URLهای دلخواه `web_fetch` اعمال نمی‌شود. برای
`web_fetch`، `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` را فقط زمانی صریحا فعال کنید که
proxy مورد اعتماد شما مالک آن بازه‌های ساختگی باشد.

## راه‌اندازی جست‌وجوی وب

فهرست‌های ارائه‌دهنده در مستندات و جریان‌های راه‌اندازی به‌ترتیب الفبایی هستند. شناسایی خودکار یک
ترتیب تقدم جداگانه نگه می‌دارد.

اگر هیچ `provider` تنظیم نشده باشد، OpenClaw ارائه‌دهنده‌ها را به این ترتیب بررسی می‌کند و از
اولین مورد آماده استفاده می‌کند:

ابتدا ارائه‌دهنده‌های مبتنی بر API:

1. **Brave** -- `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey` (ترتیب ۱۰)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` یا `plugins.entries.minimax.config.webSearch.apiKey` (ترتیب ۱۵)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`، `GEMINI_API_KEY`، یا `models.providers.google.apiKey` (ترتیب ۲۰)
4. **Grok** -- `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey` (ترتیب ۳۰)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` یا `plugins.entries.moonshot.config.webSearch.apiKey` (ترتیب ۴۰)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` یا `plugins.entries.perplexity.config.webSearch.apiKey` (ترتیب ۵۰)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey` (ترتیب ۶۰)
8. **Exa** -- `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey`؛ `plugins.entries.exa.config.webSearch.baseUrl` اختیاری endpoint مربوط به Exa را override می‌کند (ترتیب ۶۵)
9. **Tavily** -- `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey` (ترتیب ۷۰)

fallbackهای بدون کلید پس از آن:

10. **DuckDuckGo** -- fallback مبتنی بر HTML و بدون کلید، بدون حساب یا کلید API (ترتیب ۱۰۰)
11. **Ollama Web Search** -- fallback بدون کلید از طریق میزبان محلی Ollama پیکربندی‌شده شما، وقتی در دسترس باشد و با `ollama signin` وارد شده باشید؛ وقتی میزبان به آن نیاز داشته باشد می‌تواند از احراز هویت bearer ارائه‌دهنده Ollama دوباره استفاده کند، و وقتی با `OLLAMA_API_KEY` پیکربندی شده باشد می‌تواند جست‌وجوی مستقیم `https://ollama.com` را فراخوانی کند (ترتیب ۱۱۰)
12. **SearXNG** -- `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (ترتیب ۲۰۰)

اگر هیچ ارائه‌دهنده‌ای شناسایی نشود، به Brave fallback می‌کند (خطای کلیدِ مفقود دریافت می‌کنید که
از شما می‌خواهد یکی را پیکربندی کنید).

<Note>
  همه فیلدهای کلید ارائه‌دهنده از اشیای SecretRef پشتیبانی می‌کنند. SecretRefهای scoped به Plugin
  زیر `plugins.entries.<plugin>.config.webSearch.apiKey` برای ارائه‌دهنده‌های
  جست‌وجوی وب مبتنی بر API بسته‌بندی‌شده، از جمله Brave، Exa، Firecrawl،
  Gemini، Grok، Kimi، MiniMax، Perplexity و Tavily resolve می‌شوند،
  چه ارائه‌دهنده به‌صورت صریح از طریق `tools.web.search.provider` انتخاب شده باشد و چه
  از طریق شناسایی خودکار انتخاب شده باشد. در حالت شناسایی خودکار، OpenClaw فقط کلید
  ارائه‌دهنده انتخاب‌شده را resolve می‌کند -- SecretRefهای انتخاب‌نشده غیرفعال می‌مانند، بنابراین می‌توانید
  چند ارائه‌دهنده را پیکربندی نگه دارید بدون اینکه برای مواردی که استفاده نمی‌کنید
  هزینه resolution بپردازید.
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

پیکربندی اختصاصی هر ارائه‌دهنده، مانند کلیدهای API، نشانی‌های پایه و حالت‌ها، زیر
`plugins.entries.<plugin>.config.webSearch.*` قرار می‌گیرد. Gemini همچنین می‌تواند
`models.providers.google.apiKey` و `models.providers.google.baseUrl` را به‌عنوان fallbackهایی با اولویت پایین‌تر
پس از پیکربندی اختصاصی جست‌وجوی وب و `GEMINI_API_KEY` خود دوباره استفاده کند. برای نمونه‌ها، صفحه‌های
ارائه‌دهندگان را ببینید.

`tools.web.search.provider` در برابر شناسه‌های ارائه‌دهنده جست‌وجوی وب که
در manifestهای Pluginهای همراه و نصب‌شده اعلام شده‌اند اعتبارسنجی می‌شود. غلط املایی‌ای مانند `"brvae"`
به‌جای fallback بی‌صدای به تشخیص خودکار، باعث شکست اعتبارسنجی پیکربندی می‌شود. اگر یک
ارائه‌دهنده پیکربندی‌شده فقط شواهد Plugin منسوخ داشته باشد، مانند بلوک باقی‌مانده
`plugins.entries.<plugin>` پس از حذف نصب یک Plugin شخص ثالث،
OpenClaw راه‌اندازی را تاب‌آور نگه می‌دارد و هشداری گزارش می‌کند تا بتوانید Plugin را دوباره نصب کنید
یا `openclaw doctor --fix` را برای پاک‌سازی پیکربندی منسوخ اجرا کنید.

انتخاب ارائه‌دهنده fallback برای `web_fetch` جداگانه است:

- آن را با `tools.web.fetch.provider` انتخاب کنید
- یا آن فیلد را حذف کنید و بگذارید OpenClaw نخستین ارائه‌دهنده آماده web-fetch
  را از credentialهای موجود به‌صورت خودکار تشخیص دهد
- `web_fetch` غیر sandbox شده می‌تواند از ارائه‌دهندگان Plugin نصب‌شده‌ای استفاده کند که
  `contracts.webFetchProviders` را اعلام می‌کنند؛ fetchهای sandbox شده فقط همراه‌مانده هستند
- امروز ارائه‌دهنده web-fetch همراه، Firecrawl است که زیر
  `plugins.entries.firecrawl.config.webFetch.*` پیکربندی می‌شود

وقتی در طول `openclaw onboard` یا
`openclaw configure --section web` گزینه **Kimi** را انتخاب می‌کنید، OpenClaw همچنین می‌تواند این‌ها را بپرسد:

- ناحیه API مربوط به Moonshot، یعنی `https://api.moonshot.ai/v1` یا `https://api.moonshot.cn/v1`
- مدل پیش‌فرض جست‌وجوی وب Kimi، که مقدار پیش‌فرض آن `kimi-k2.6` است

برای `x_search`، `plugins.entries.xai.config.xSearch.*` را پیکربندی کنید. این از همان
fallback `XAI_API_KEY` مانند جست‌وجوی وب Grok استفاده می‌کند.
پیکربندی قدیمی `tools.web.x_search.*` به‌صورت خودکار توسط `openclaw doctor --fix` مهاجرت داده می‌شود.
وقتی در طول `openclaw onboard` یا `openclaw configure --section web` گزینه Grok را انتخاب می‌کنید،
OpenClaw همچنین می‌تواند راه‌اندازی اختیاری `x_search` را با همان کلید ارائه دهد.
این یک گام پیگیری جداگانه داخل مسیر Grok است، نه یک انتخاب جداگانه سطح‌بالا
برای ارائه‌دهنده جست‌وجوی وب. اگر ارائه‌دهنده دیگری را انتخاب کنید، OpenClaw
درخواست `x_search` را نشان نمی‌دهد.

### ذخیره‌سازی کلیدهای API

<Tabs>
  <Tab title="Config file">
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
  <Tab title="Environment variable">
    متغیر محیطی ارائه‌دهنده را در محیط پردازش Gateway تنظیم کنید:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    برای نصب gateway، آن را در `~/.openclaw/.env` قرار دهید.
    [متغیرهای محیطی](/fa/help/faq#env-vars-and-env-loading) را ببینید.

  </Tab>
</Tabs>

## پارامترهای ابزار

| پارامتر              | توضیح                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | عبارت جست‌وجو، الزامی                                 |
| `count`               | نتایج برای بازگرداندن، ۱ تا ۱۰، پیش‌فرض: ۵             |
| `country`             | کد کشور دوحرفی ISO، مانند "US" یا "DE"                |
| `language`            | کد زبان ISO 639-1، مانند "en" یا "de"                 |
| `search_lang`         | کد زبان جست‌وجو، فقط Brave                            |
| `freshness`           | فیلتر زمانی: `day`، `week`، `month`، یا `year`         |
| `date_after`          | نتایج پس از این تاریخ، با قالب YYYY-MM-DD              |
| `date_before`         | نتایج پیش از این تاریخ، با قالب YYYY-MM-DD             |
| `ui_lang`             | کد زبان UI، فقط Brave                                 |
| `domain_filter`       | آرایه allowlist/denylist دامنه، فقط Perplexity         |
| `max_tokens`          | بودجه کل محتوا، پیش‌فرض ۲۵۰۰۰، فقط Perplexity          |
| `max_tokens_per_page` | محدودیت token برای هر صفحه، پیش‌فرض ۲۰۴۸، فقط Perplexity |

<Warning>
  همه پارامترها با همه ارائه‌دهندگان کار نمی‌کنند. حالت `llm-context` در Brave
  `ui_lang` را رد می‌کند؛ `date_before` همچنین به `date_after` نیاز دارد، چون بازه‌های freshness سفارشی Brave
  هم تاریخ شروع و هم تاریخ پایان را لازم دارند.
  Gemini، Grok و Kimi یک پاسخ ترکیب‌شده با citationها برمی‌گردانند. آن‌ها
  `count` را برای سازگاری با ابزار مشترک می‌پذیرند، اما این شکل پاسخ grounded
  را تغییر نمی‌دهد. Gemini از `freshness`، `date_after` و
  `date_before` با تبدیل آن‌ها به بازه‌های زمانی grounding جست‌وجوی Google پشتیبانی می‌کند.
  Perplexity وقتی از مسیر سازگاری Sonar/OpenRouter استفاده می‌کنید
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` یا `OPENROUTER_API_KEY`) همین رفتار را دارد.
  SearXNG فقط برای میزبان‌های private-network یا loopback معتمد، `http://` را می‌پذیرد؛
  endpointهای عمومی SearXNG باید از `https://` استفاده کنند.
  Firecrawl و Tavily از طریق `web_search` فقط از `query` و `count` پشتیبانی می‌کنند
  -- برای گزینه‌های پیشرفته از ابزارهای اختصاصی آن‌ها استفاده کنید.
</Warning>

## x_search

`x_search` با استفاده از xAI پست‌های X، که قبلا Twitter بود، را query می‌کند و
پاسخ‌های ترکیب‌شده با AI همراه با citationها برمی‌گرداند. این ابزار queryهای زبان طبیعی و
فیلترهای ساختاریافته اختیاری را می‌پذیرد. OpenClaw ابزار داخلی `x_search` مربوط به xAI را
فقط در درخواستی فعال می‌کند که این فراخوانی ابزار را سرویس می‌دهد.

<Note>
  xAI مستند کرده است که `x_search` از جست‌وجوی کلیدواژه‌ای، جست‌وجوی معنایی، جست‌وجوی کاربر
  و دریافت thread پشتیبانی می‌کند. برای آمار تعامل هر پست، مانند repostها،
  replyها، bookmarkها یا viewها، lookup هدفمند برای URL دقیق پست
  یا شناسه status را ترجیح دهید. جست‌وجوهای کلیدواژه‌ای گسترده ممکن است پست درست را پیدا کنند اما metadata هر پست را
  با کامل بودن کمتر برگردانند. یک الگوی خوب این است: ابتدا پست را پیدا کنید، سپس
  یک query دوم `x_search` متمرکز بر همان پست دقیق اجرا کنید.
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
به `plugins.entries.xai.config.webSearch.baseUrl`، سپس
`tools.web.search.grok.baseUrl` قدیمی، و در نهایت endpoint عمومی xAI fallback می‌کند.

### پارامترهای x_search

| پارامتر                     | توضیح                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | عبارت جست‌وجو، الزامی                                  |
| `allowed_x_handles`          | نتایج را به handleهای مشخص X محدود می‌کند              |
| `excluded_x_handles`         | handleهای مشخص X را حذف می‌کند                         |
| `from_date`                  | فقط پست‌های روی این تاریخ یا پس از آن را شامل می‌شود، با قالب YYYY-MM-DD |
| `to_date`                    | فقط پست‌های روی این تاریخ یا پیش از آن را شامل می‌شود، با قالب YYYY-MM-DD |
| `enable_image_understanding` | اجازه می‌دهد xAI تصاویر پیوست‌شده به پست‌های منطبق را بررسی کند |
| `enable_video_understanding` | اجازه می‌دهد xAI ویدئوهای پیوست‌شده به پست‌های منطبق را بررسی کند |

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

- [Web Fetch](/fa/tools/web-fetch) -- یک URL را fetch می‌کند و محتوای خوانا را استخراج می‌کند
- [Web Browser](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای سایت‌های سنگین از نظر JS
- [Grok Search](/fa/tools/grok-search) -- Grok به‌عنوان ارائه‌دهنده `web_search`
- [Ollama Web Search](/fa/tools/ollama-search) -- جست‌وجوی وب بدون کلید از طریق میزبان Ollama
