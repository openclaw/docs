---
read_when:
    - می‌خواهید web_search را فعال یا پیکربندی کنید
    - می‌خواهید x_search را فعال یا پیکربندی کنید
    - باید یک ارائه‌دهندهٔ جستجو انتخاب کنید
    - می‌خواهید تشخیص خودکار و جایگزینی ارائه‌دهنده را درک کنید
sidebarTitle: Web Search
summary: web_search، x_search، و web_fetch -- جست‌وجوی وب، جست‌وجوی پست‌های X، یا واکشی محتوای صفحه
title: جستجوی وب
x-i18n:
    generated_at: "2026-05-07T01:56:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 806b614fe3103439ea0a1acaaaa9f4071e22440cc2091ff814834e75b2079529
    source_path: tools/web.md
    workflow: 16
---

ابزار `web_search` با استفاده از ارائه‌دهنده پیکربندی‌شده شما در وب جست‌وجو می‌کند و
نتایج را برمی‌گرداند. نتایج بر اساس پرس‌وجو به مدت ۱۵ دقیقه (قابل پیکربندی) کش می‌شوند.

OpenClaw همچنین شامل `x_search` برای پست‌های X (که پیش‌تر Twitter نام داشت) و
`web_fetch` برای واکشی سبک URL است. در این مرحله، `web_fetch` محلی می‌ماند
در حالی که `web_search` و `x_search` می‌توانند در پشت صحنه از xAI Responses استفاده کنند.

<Info>
  `web_search` یک ابزار HTTP سبک است، نه اتوماسیون مرورگر. برای
  سایت‌های سنگین از نظر JS یا ورود به حساب، از [مرورگر وب](/fa/tools/browser) استفاده کنید. برای
  واکشی یک URL مشخص، از [واکشی وب](/fa/tools/web-fetch) استفاده کنید.
</Info>

## شروع سریع

<Steps>
  <Step title="انتخاب یک ارائه‌دهنده">
    یک ارائه‌دهنده انتخاب کنید و هرگونه راه‌اندازی لازم را تکمیل کنید. برخی ارائه‌دهندگان
    بدون کلید هستند، در حالی که برخی دیگر از کلیدهای API استفاده می‌کنند. برای
    جزئیات، صفحه‌های ارائه‌دهندگان زیر را ببینید.
  </Step>
  <Step title="پیکربندی">
    ```bash
    openclaw configure --section web
    ```
    این کار ارائه‌دهنده و هر اعتبارنامه لازم را ذخیره می‌کند. همچنین می‌توانید یک متغیر env
    (برای مثال `BRAVE_API_KEY`) تنظیم کنید و برای ارائه‌دهندگان مبتنی بر API
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

## انتخاب یک ارائه‌دهنده

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/fa/tools/brave-search">
    نتایج ساختاریافته همراه با قطعه‌متن‌ها. از حالت `llm-context` و فیلترهای کشور/زبان پشتیبانی می‌کند. پلن رایگان در دسترس است.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/fa/tools/duckduckgo-search">
    جایگزین بدون کلید. به کلید API نیاز ندارد. ادغام غیررسمی مبتنی بر HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/fa/tools/exa-search">
    جست‌وجوی عصبی + کلیدواژه‌ای همراه با استخراج محتوا (برجسته‌سازی‌ها، متن، خلاصه‌ها).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/fa/tools/firecrawl">
    نتایج ساختاریافته. برای استخراج عمیق، بهتر است همراه با `firecrawl_search` و `firecrawl_scrape` استفاده شود.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/fa/tools/gemini-search">
    پاسخ‌های تولیدشده با هوش مصنوعی همراه با استنادها از طریق grounding در Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/fa/tools/grok-search">
    پاسخ‌های تولیدشده با هوش مصنوعی همراه با استنادها از طریق grounding وب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/fa/tools/kimi-search">
    پاسخ‌های تولیدشده با هوش مصنوعی همراه با استنادها از طریق جست‌وجوی وب Moonshot؛ جایگزین‌های چت بدون grounding صریحا شکست می‌خورند.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/fa/tools/minimax-search">
    نتایج ساختاریافته از طریق API جست‌وجوی MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/fa/tools/ollama-search">
    جست‌وجو از طریق میزبان محلی Ollama که وارد آن شده‌اید یا API میزبانی‌شده Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/fa/tools/perplexity-search">
    نتایج ساختاریافته همراه با کنترل‌های استخراج محتوا و فیلتر دامنه.
  </Card>
  <Card title="SearXNG" icon="server" href="/fa/tools/searxng-search">
    متاجست‌وجوی خودمیزبان. به کلید API نیاز ندارد. Google، Bing، DuckDuckGo و موارد دیگر را تجمیع می‌کند.
  </Card>
  <Card title="Tavily" icon="globe" href="/fa/tools/tavily">
    نتایج ساختاریافته همراه با عمق جست‌وجو، فیلتر موضوع، و `tavily_extract` برای استخراج URL.
  </Card>
</CardGroup>

### مقایسه ارائه‌دهنده‌ها

| ارائه‌دهنده                                  | سبک نتیجه                                                   | فیلترها                                          | کلید API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/fa/tools/brave-search)              | قطعه‌متن‌های ساختاریافته                                            | کشور، زبان، زمان، حالت `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/fa/tools/duckduckgo-search)    | قطعه‌متن‌های ساختاریافته                                            | --                                               | هیچ‌کدام (بدون کلید)                                                                         |
| [Exa](/fa/tools/exa-search)                  | ساختاریافته + استخراج‌شده                                         | حالت عصبی/کلیدواژه‌ای، تاریخ، استخراج محتوا    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/fa/tools/firecrawl)             | قطعه‌متن‌های ساختاریافته                                            | از طریق ابزار `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/fa/tools/gemini-search)            | تولیدشده با هوش مصنوعی + استنادها                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/fa/tools/grok-search)                | تولیدشده با هوش مصنوعی + استنادها                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/fa/tools/kimi-search)                | تولیدشده با هوش مصنوعی + استنادها؛ در جایگزین‌های چت بدون grounding شکست می‌خورد | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/fa/tools/minimax-search)   | قطعه‌متن‌های ساختاریافته                                            | منطقه (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/fa/tools/ollama-search) | قطعه‌متن‌های ساختاریافته                                            | --                                               | برای میزبان‌های محلی واردشده هیچ‌کدام؛ `OLLAMA_API_KEY` برای جست‌وجوی مستقیم `https://ollama.com` |
| [Perplexity](/fa/tools/perplexity-search)    | قطعه‌متن‌های ساختاریافته                                            | کشور، زبان، زمان، دامنه‌ها، محدودیت‌های محتوا | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/fa/tools/searxng-search)          | قطعه‌متن‌های ساختاریافته                                            | دسته‌ها، زبان                             | هیچ‌کدام (خودمیزبان)                                                                      |
| [Tavily](/fa/tools/tavily)                   | قطعه‌متن‌های ساختاریافته                                            | از طریق ابزار `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## تشخیص خودکار

## جست‌وجوی وب بومی OpenAI

مدل‌های مستقیم OpenAI Responses وقتی جست‌وجوی وب OpenClaw فعال باشد و هیچ ارائه‌دهنده مدیریت‌شده‌ای سنجاق نشده باشد، به‌طور خودکار از ابزار میزبانی‌شده `web_search` متعلق به OpenAI استفاده می‌کنند. این رفتار متعلق به ارائه‌دهنده در Plugin بسته‌بندی‌شده OpenAI است و فقط برای ترافیک API بومی OpenAI اعمال می‌شود، نه URLهای پایه پروکسی سازگار با OpenAI یا مسیرهای Azure. برای حفظ ابزار مدیریت‌شده `web_search` برای مدل‌های OpenAI، `tools.web.search.provider` را روی ارائه‌دهنده دیگری مانند `brave` تنظیم کنید، یا برای غیرفعال کردن هم جست‌وجوی مدیریت‌شده و هم جست‌وجوی بومی OpenAI، `tools.web.search.enabled: false` را تنظیم کنید.

## جست‌وجوی وب بومی Codex

مدل‌های سازگار با Codex می‌توانند به‌صورت اختیاری به‌جای تابع مدیریت‌شده `web_search` متعلق به OpenClaw، از ابزار `web_search` بومی ارائه‌دهنده در Responses استفاده کنند.

- آن را زیر `tools.web.search.openaiCodex` پیکربندی کنید
- فقط برای مدل‌های سازگار با Codex فعال می‌شود (`openai-codex/*` یا ارائه‌دهندگانی که از `api: "openai-codex-responses"` استفاده می‌کنند)
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

اگر جست‌وجوی بومی Codex فعال باشد اما مدل فعلی سازگار با Codex نباشد، OpenClaw رفتار عادی `web_search` مدیریت‌شده را حفظ می‌کند.

## ایمنی شبکه

فراخوانی‌های ارائه‌دهنده `web_search` مدیریت‌شده از مسیر واکشی محافظت‌شده OpenClaw استفاده می‌کنند. برای
میزبان‌های API مورداعتماد ارائه‌دهنده، OpenClaw پاسخ‌های DNS جعلی-IP مربوط به Surge، Clash و sing-box را
در `198.18.0.0/15` و `fc00::/7` فقط برای نام میزبان همان ارائه‌دهنده مجاز می‌کند.
مقصدهای خصوصی، loopback، link-local و metadata دیگر همچنان مسدود می‌مانند.

این مجوزدهی خودکار برای URLهای دلخواه `web_fetch` اعمال نمی‌شود. برای
`web_fetch`، `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` را فقط زمانی صریحا فعال کنید که
پروکسی مورداعتماد شما مالک آن بازه‌های مصنوعی باشد.

## راه‌اندازی جست‌وجوی وب

فهرست‌های ارائه‌دهندگان در مستندات و جریان‌های راه‌اندازی به‌ترتیب الفبایی هستند. تشخیص خودکار
یک ترتیب اولویت جداگانه را حفظ می‌کند.

اگر هیچ `provider` تنظیم نشده باشد، OpenClaw ارائه‌دهندگان را به این ترتیب بررسی می‌کند و از
اولین مورد آماده استفاده می‌کند:

ابتدا ارائه‌دهندگان مبتنی بر API:

1. **Brave** -- `BRAVE_API_KEY` یا `plugins.entries.brave.config.webSearch.apiKey` (ترتیب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` یا `plugins.entries.minimax.config.webSearch.apiKey` (ترتیب 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`، `GEMINI_API_KEY`، یا `models.providers.google.apiKey` (ترتیب 20)
4. **Grok** -- `XAI_API_KEY` یا `plugins.entries.xai.config.webSearch.apiKey` (ترتیب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` یا `plugins.entries.moonshot.config.webSearch.apiKey` (ترتیب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` یا `plugins.entries.perplexity.config.webSearch.apiKey` (ترتیب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` یا `plugins.entries.firecrawl.config.webSearch.apiKey` (ترتیب 60)
8. **Exa** -- `EXA_API_KEY` یا `plugins.entries.exa.config.webSearch.apiKey`؛ `plugins.entries.exa.config.webSearch.baseUrl` اختیاری نقطه پایانی Exa را بازنویسی می‌کند (ترتیب 65)
9. **Tavily** -- `TAVILY_API_KEY` یا `plugins.entries.tavily.config.webSearch.apiKey` (ترتیب 70)

پس از آن جایگزین‌های بدون کلید:

10. **DuckDuckGo** -- جایگزین HTML بدون کلید، بدون نیاز به حساب یا کلید API (ترتیب 100)
11. **Ollama Web Search** -- جایگزین بدون کلید از طریق میزبان محلی Ollama پیکربندی‌شده شما، زمانی که قابل دسترسی باشد و با `ollama signin` وارد آن شده باشید؛ وقتی میزبان به آن نیاز دارد می‌تواند از احراز هویت bearer ارائه‌دهنده Ollama دوباره استفاده کند، و وقتی با `OLLAMA_API_KEY` پیکربندی شده باشد می‌تواند جست‌وجوی مستقیم `https://ollama.com` را فراخوانی کند (ترتیب 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` یا `plugins.entries.searxng.config.webSearch.baseUrl` (ترتیب 200)

اگر هیچ ارائه‌دهنده‌ای تشخیص داده نشود، به Brave برمی‌گردد (خطای نبود کلید
دریافت می‌کنید که از شما می‌خواهد یکی را پیکربندی کنید).

<Note>
  همه فیلدهای کلید ارائه‌دهنده از اشیای SecretRef پشتیبانی می‌کنند. SecretRefهای با دامنه Plugin
  زیر `plugins.entries.<plugin>.config.webSearch.apiKey` برای
  ارائه‌دهندگان جست‌وجوی وب مبتنی بر API بسته‌بندی‌شده resolve می‌شوند، از جمله Brave، Exa، Firecrawl،
  Gemini، Grok، Kimi، MiniMax، Perplexity و Tavily،
  چه ارائه‌دهنده به‌صورت صریح از طریق `tools.web.search.provider` انتخاب شده باشد و چه
  از طریق تشخیص خودکار انتخاب شده باشد. در حالت تشخیص خودکار، OpenClaw فقط کلید
  ارائه‌دهنده انتخاب‌شده را resolve می‌کند -- SecretRefهای انتخاب‌نشده غیرفعال می‌مانند، بنابراین می‌توانید
  چند ارائه‌دهنده را بدون پرداخت هزینه resolve برای مواردی که استفاده نمی‌کنید
  پیکربندی‌شده نگه دارید.
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

پیکربندی مختص هر ارائه‌دهنده (کلیدهای API، URLهای پایه، حالت‌ها) در
`plugins.entries.<plugin>.config.webSearch.*` قرار می‌گیرد. Gemini همچنین می‌تواند از
`models.providers.google.apiKey` و `models.providers.google.baseUrl` به‌عنوان گزینه‌های
بازگشت با اولویت پایین‌تر، پس از پیکربندی اختصاصی جست‌وجوی وب خود و `GEMINI_API_KEY`، استفاده کند. برای نمونه‌ها، صفحه‌های ارائه‌دهنده را ببینید.

`tools.web.search.provider` با شناسه‌های ارائه‌دهنده جست‌وجوی وب که توسط مانیفست‌های Pluginهای همراه و نصب‌شده اعلام شده‌اند، به‌علاوه Pluginهای ارائه‌دهنده نصب‌پذیر شناخته‌شده، اعتبارسنجی می‌شود. یک غلط تایپی مانند `"brvae"` به‌جای بازگشت بی‌صدا به تشخیص خودکار، باعث شکست اعتبارسنجی پیکربندی می‌شود. اگر ارائه‌دهنده پیکربندی‌شده شناخته‌شده باشد اما Plugin مالک آن در دسترس نباشد، OpenClaw راه‌اندازی را تاب‌آور نگه می‌دارد و یک هشدار گزارش می‌کند تا بتوانید `openclaw doctor --fix` را برای نصب یا فعال‌سازی Plugin اجرا کنید. همین رفتار هشدار برای شواهد کهنه Plugin نیز اعمال می‌شود، مانند یک بلوک باقی‌مانده `plugins.entries.<plugin>` پس از حذف نصب یک Plugin شخص ثالث.

انتخاب ارائه‌دهنده بازگشتی `web_fetch` جداست:

- آن را با `tools.web.fetch.provider` انتخاب کنید
- یا آن فیلد را حذف کنید و اجازه دهید OpenClaw نخستین ارائه‌دهنده آماده web-fetch را از میان اعتبارنامه‌های موجود به‌صورت خودکار تشخیص دهد
- `web_fetch` بدون سندباکس می‌تواند از ارائه‌دهنده‌های Plugin نصب‌شده‌ای استفاده کند که `contracts.webFetchProviders` را اعلام می‌کنند؛ دریافت‌های سندباکس‌شده فقط همراه‌داخلی می‌مانند
- در حال حاضر ارائه‌دهنده همراه web-fetch، Firecrawl است که زیر
  `plugins.entries.firecrawl.config.webFetch.*` پیکربندی می‌شود

وقتی در طول `openclaw onboard` یا
`openclaw configure --section web` **Kimi** را انتخاب می‌کنید، OpenClaw همچنین می‌تواند این موارد را بپرسد:

- منطقه API مربوط به Moonshot (`https://api.moonshot.ai/v1` یا `https://api.moonshot.cn/v1`)
- مدل پیش‌فرض جست‌وجوی وب Kimi (پیش‌فرض `kimi-k2.6`)

برای `x_search`، `plugins.entries.xai.config.xSearch.*` را پیکربندی کنید. از همان بازگشت `XAI_API_KEY` مانند جست‌وجوی وب Grok استفاده می‌کند.
پیکربندی قدیمی `tools.web.x_search.*` به‌صورت خودکار توسط `openclaw doctor --fix` مهاجرت داده می‌شود.
وقتی در طول `openclaw onboard` یا `openclaw configure --section web`، Grok را انتخاب می‌کنید، OpenClaw همچنین می‌تواند راه‌اندازی اختیاری `x_search` را با همان کلید پیشنهاد کند.
این یک مرحله پیگیری جداگانه داخل مسیر Grok است، نه یک انتخاب جداگانه در سطح بالای ارائه‌دهنده جست‌وجوی وب. اگر ارائه‌دهنده دیگری را انتخاب کنید، OpenClaw اعلان `x_search` را نشان نمی‌دهد.

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
| `query`               | پرس‌وجوی جست‌وجو (الزامی)                            |
| `count`               | تعداد نتایج برای بازگرداندن (۱ تا ۱۰، پیش‌فرض: ۵)    |
| `country`             | کد کشور ISO دوحرفی (مثلاً "US"، "DE")                |
| `language`            | کد زبان ISO 639-1 (مثلاً "en"، "de")                 |
| `search_lang`         | کد زبان جست‌وجو (فقط Brave)                          |
| `freshness`           | فیلتر زمانی: `day`، `week`، `month` یا `year`        |
| `date_after`          | نتایج پس از این تاریخ (YYYY-MM-DD)                   |
| `date_before`         | نتایج پیش از این تاریخ (YYYY-MM-DD)                  |
| `ui_lang`             | کد زبان UI (فقط Brave)                               |
| `domain_filter`       | آرایه فهرست مجاز/فهرست ممنوع دامنه‌ها (فقط Perplexity) |
| `max_tokens`          | بودجه کل محتوا، پیش‌فرض ۲۵۰۰۰ (فقط Perplexity)       |
| `max_tokens_per_page` | محدودیت توکن به‌ازای هر صفحه، پیش‌فرض ۲۰۴۸ (فقط Perplexity) |

<Warning>
  همه پارامترها با همه ارائه‌دهنده‌ها کار نمی‌کنند. حالت `llm-context` در Brave
  `ui_lang` را رد می‌کند؛ `date_before` نیز به `date_after` نیاز دارد، زیرا بازه‌های تازگی سفارشی Brave هم به تاریخ شروع و هم به تاریخ پایان نیاز دارند.
  Gemini، Grok و Kimi یک پاسخ ترکیب‌شده همراه با ارجاع‌ها برمی‌گردانند. آن‌ها
  `count` را برای سازگاری ابزار مشترک می‌پذیرند، اما شکل پاسخ مبتنی بر منابع را تغییر نمی‌دهد. Gemini از `freshness`، `date_after` و
  `date_before` با تبدیل آن‌ها به بازه‌های زمانی زمینه‌سازی Google Search پشتیبانی می‌کند.
  Perplexity وقتی از مسیر سازگاری Sonar/OpenRouter استفاده می‌کنید نیز همین رفتار را دارد (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` یا `OPENROUTER_API_KEY`).
  SearXNG فقط برای میزبان‌های شبکه خصوصی قابل‌اعتماد یا loopback، `http://` را می‌پذیرد؛
  endpointهای عمومی SearXNG باید از `https://` استفاده کنند.
  Firecrawl و Tavily فقط از `query` و `count` از طریق `web_search`
  پشتیبانی می‌کنند؛ برای گزینه‌های پیشرفته از ابزارهای اختصاصی آن‌ها استفاده کنید.
</Warning>

## x_search

`x_search` پست‌های X (قبلاً Twitter) را با استفاده از xAI پرس‌وجو می‌کند و پاسخ‌های ساخته‌شده توسط AI را همراه با ارجاع‌ها برمی‌گرداند. پرس‌وجوهای زبان طبیعی و فیلترهای ساختاریافته اختیاری را می‌پذیرد. OpenClaw ابزار داخلی `x_search` مربوط به xAI را فقط روی درخواستی فعال می‌کند که این فراخوانی ابزار را سرویس می‌دهد.

<Note>
  xAI مستند کرده است که `x_search` از جست‌وجوی کلیدواژه‌ای، جست‌وجوی معنایی، جست‌وجوی کاربر و دریافت رشته گفتگو پشتیبانی می‌کند. برای آمار درگیری هر پست مانند بازنشرها،
  پاسخ‌ها، نشانک‌ها یا بازدیدها، یک جست‌وجوی هدفمند برای URL دقیق پست
  یا شناسه وضعیت را ترجیح دهید. جست‌وجوهای کلیدواژه‌ای گسترده ممکن است پست درست را پیدا کنند اما فراداده هر پست را با کامل‌بودن کمتر برگردانند. یک الگوی خوب این است: ابتدا پست را پیدا کنید، سپس
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` وقتی
`plugins.entries.xai.config.xSearch.baseUrl` تنظیم شده باشد، به `<baseUrl>/responses` پست می‌کند. اگر آن فیلد حذف شده باشد،
به `plugins.entries.xai.config.webSearch.baseUrl`، سپس
`tools.web.search.grok.baseUrl` قدیمی، و در نهایت endpoint عمومی xAI بازمی‌گردد.

### پارامترهای x_search

| پارامتر                     | توضیح                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | پرس‌وجوی جست‌وجو (الزامی)                              |
| `allowed_x_handles`          | محدود کردن نتایج به handleهای مشخص X                  |
| `excluded_x_handles`         | حذف handleهای مشخص X                                  |
| `from_date`                  | فقط شامل پست‌ها در این تاریخ یا پس از آن (YYYY-MM-DD) |
| `to_date`                    | فقط شامل پست‌ها در این تاریخ یا پیش از آن (YYYY-MM-DD) |
| `enable_image_understanding` | اجازه دادن به xAI برای بررسی تصاویر پیوست‌شده به پست‌های مطابق |
| `enable_video_understanding` | اجازه دادن به xAI برای بررسی ویدئوهای پیوست‌شده به پست‌های مطابق |

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

اگر از پروفایل‌های ابزار یا فهرست‌های مجاز استفاده می‌کنید، `web_search`، `x_search` یا `group:web` را اضافه کنید:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## مرتبط

- [Web Fetch](/fa/tools/web-fetch) -- دریافت یک URL و استخراج محتوای خوانا
- [Web Browser](/fa/tools/browser) -- خودکارسازی کامل مرورگر برای سایت‌های سنگین از نظر JS
- [Grok Search](/fa/tools/grok-search) -- Grok به‌عنوان ارائه‌دهنده `web_search`
- [Ollama Web Search](/fa/tools/ollama-search) -- جست‌وجوی وب بدون کلید از طریق میزبان Ollama شما
