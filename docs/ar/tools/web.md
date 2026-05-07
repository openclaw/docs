---
read_when:
    - تريد تفعيل أو تكوين web_search
    - تريد تمكين أو تكوين x_search
    - تحتاج إلى اختيار مزوّد بحث
    - تريد فهم الاكتشاف التلقائي وآلية الرجوع إلى المزوّد
sidebarTitle: Web Search
summary: web_search وx_search وweb_fetch -- البحث في الويب، والبحث في منشورات X، أو جلب محتوى الصفحة
title: بحث الويب
x-i18n:
    generated_at: "2026-05-07T01:56:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 806b614fe3103439ea0a1acaaaa9f4071e22440cc2091ff814834e75b2079529
    source_path: tools/web.md
    workflow: 16
---

تبحث أداة `web_search` في الويب باستخدام المزوّد الذي قمت بتكوينه وتُرجع النتائج. تُخزَّن النتائج مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للتكوين).

يتضمن OpenClaw أيضًا `x_search` لمنشورات X (تويتر سابقًا) و`web_fetch` لجلب عناوين URL بشكل خفيف. في هذه المرحلة، يبقى `web_fetch` محليًا بينما يمكن أن يستخدم `web_search` و`x_search` استجابات xAI داخليًا.

<Info>
  `web_search` أداة HTTP خفيفة، وليست أتمتة للمتصفح. للمواقع التي تعتمد بكثافة على
  JS أو عمليات تسجيل الدخول، استخدم [متصفح الويب](/ar/tools/browser). لجلب
  عنوان URL محدد، استخدم [Web Fetch](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="اختر مزوّدًا">
    اختر مزوّدًا وأكمل أي إعداد مطلوب. بعض المزوّدين لا يحتاجون إلى مفاتيح،
    بينما يستخدم آخرون مفاتيح API. راجع صفحات المزوّدين أدناه لمعرفة التفاصيل.
  </Step>
  <Step title="التكوين">
    ```bash
    openclaw configure --section web
    ```
    يخزّن هذا المزوّد وأي اعتماد مطلوب. يمكنك أيضًا تعيين متغير بيئة
    (على سبيل المثال `BRAVE_API_KEY`) وتجاوز هذه الخطوة للمزوّدين
    المدعومين عبر API.
  </Step>
  <Step title="استخدمها">
    يمكن للوكيل الآن استدعاء `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    لمنشورات X، استخدم:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## اختيار مزوّد

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ar/tools/brave-search">
    نتائج منظمة مع مقتطفات. يدعم وضع `llm-context` ومرشحات البلد/اللغة. تتوفر طبقة مجانية.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    خيار احتياطي بلا مفتاح. لا حاجة إلى مفتاح API. تكامل غير رسمي يعتمد على HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي + بحث بالكلمات المفتاحية مع استخراج المحتوى (تمييزات، نص، ملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظمة. يعمل بأفضل شكل عند إقرانه مع `firecrawl_search` و`firecrawl_scrape` للاستخراج العميق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مركبة بالذكاء الاصطناعي مع استشهادات عبر إسناد Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مركبة بالذكاء الاصطناعي مع استشهادات عبر إسناد الويب من xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مركبة بالذكاء الاصطناعي مع استشهادات عبر بحث الويب من Moonshot؛ تفشل بدائل الدردشة غير المسندة صراحةً.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظمة عبر API البحث في MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    البحث عبر مضيف Ollama محلي مسجّل الدخول أو API Ollama المستضاف.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظمة مع عناصر تحكم في استخراج المحتوى وترشيح النطاقات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    بحث تجميعي مستضاف ذاتيًا. لا حاجة إلى مفتاح API. يجمع Google وBing وDuckDuckGo والمزيد.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظمة مع عمق البحث وترشيح الموضوعات و`tavily_extract` لاستخراج عناوين URL.
  </Card>
</CardGroup>

### مقارنة المزوّدين

| المزوّد                                  | نمط النتائج                                                   | المرشحات                                          | مفتاح API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)              | مقتطفات منظمة                                            | البلد، اللغة، الوقت، وضع `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/ar/tools/duckduckgo-search)    | مقتطفات منظمة                                            | --                                               | لا شيء (بلا مفتاح)                                                                         |
| [Exa](/ar/tools/exa-search)                  | منظمة + مستخرجة                                         | وضع عصبي/كلمات مفتاحية، تاريخ، استخراج المحتوى    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ar/tools/firecrawl)             | مقتطفات منظمة                                            | عبر أداة `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ar/tools/gemini-search)            | مركبة بالذكاء الاصطناعي + استشهادات                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ar/tools/grok-search)                | مركبة بالذكاء الاصطناعي + استشهادات                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/ar/tools/kimi-search)                | مركبة بالذكاء الاصطناعي + استشهادات؛ تفشل عند بدائل الدردشة غير المسندة | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ar/tools/minimax-search)   | مقتطفات منظمة                                            | المنطقة (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ar/tools/ollama-search) | مقتطفات منظمة                                            | --                                               | لا شيء للمضيفين المحليين مسجّلي الدخول؛ `OLLAMA_API_KEY` للبحث المباشر عبر `https://ollama.com` |
| [Perplexity](/ar/tools/perplexity-search)    | مقتطفات منظمة                                            | البلد، اللغة، الوقت، النطاقات، حدود المحتوى | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ar/tools/searxng-search)          | مقتطفات منظمة                                            | الفئات، اللغة                             | لا شيء (مستضاف ذاتيًا)                                                                      |
| [Tavily](/ar/tools/tavily)                   | مقتطفات منظمة                                            | عبر أداة `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## الاكتشاف التلقائي

## بحث الويب الأصلي من OpenAI

تستخدم نماذج OpenAI Responses المباشرة أداة `web_search` المستضافة لدى OpenAI تلقائيًا عندما يكون بحث الويب في OpenClaw مفعّلًا ولا يكون هناك مزوّد مُدار مثبّت. هذا سلوك مملوك للمزوّد في Plugin OpenAI المضمّن ولا ينطبق إلا على حركة API الأصلية من OpenAI، وليس على عناوين URL الأساسية للوكلاء المتوافقين مع OpenAI أو مسارات Azure. عيّن `tools.web.search.provider` إلى مزوّد آخر مثل `brave` للاحتفاظ بأداة `web_search` المُدارة لنماذج OpenAI، أو عيّن `tools.web.search.enabled: false` لتعطيل كل من البحث المُدار وبحث OpenAI الأصلي.

## بحث الويب الأصلي من Codex

يمكن للنماذج القادرة على Codex اختياريًا استخدام أداة `web_search` الأصلية لدى المزوّد في Responses بدلًا من دالة `web_search` المُدارة في OpenClaw.

- كوّنها تحت `tools.web.search.openaiCodex`
- لا تُفعّل إلا للنماذج القادرة على Codex (`openai-codex/*` أو المزوّدين الذين يستخدمون `api: "openai-codex-responses"`)
- يستمر تطبيق `web_search` المُدار على النماذج غير التابعة لـ Codex
- `mode: "cached"` هو الإعداد الافتراضي والموصى به
- يعطّل `tools.web.search.enabled: false` البحث المُدار والأصلي معًا

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

إذا كان بحث Codex الأصلي مفعّلًا لكن النموذج الحالي غير قادر على Codex، يحافظ OpenClaw على سلوك `web_search` المُدار العادي.

## أمان الشبكة

تستخدم استدعاءات مزوّد `web_search` المُدارة مسار الجلب المحروس في OpenClaw. بالنسبة
لمضيفي API الموثوقين للمزوّدين، يسمح OpenClaw بإجابات DNS ذات fake-IP من Surge وClash وsing-box
في `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف ذلك المزوّد.
تبقى الوجهات الخاصة الأخرى وlocal loopback وlink-local وmetadata محظورة.

لا ينطبق هذا السماح التلقائي على عناوين URL عشوائية في `web_fetch`. بالنسبة
إلى `web_fetch`، فعّل `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` صراحةً فقط عندما يكون
الوكيل الموثوق لديك مالكًا لتلك النطاقات الاصطناعية.

## إعداد بحث الويب

قوائم المزوّدين في المستندات وتدفقات الإعداد مرتبة أبجديًا. يحتفظ الاكتشاف التلقائي
بترتيب أسبقية منفصل.

إذا لم يتم تعيين `provider`، يتحقق OpenClaw من المزوّدين بهذا الترتيب ويستخدم
أول مزوّد جاهز:

المزوّدون المدعومون عبر API أولًا:

1. **Brave** -- `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey` (الترتيب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey` (الترتيب 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey` أو `GEMINI_API_KEY` أو `models.providers.google.apiKey` (الترتيب 20)
4. **Grok** -- `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey` (الترتيب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey` (الترتيب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey` (الترتيب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey` (الترتيب 60)
8. **Exa** -- `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey`؛ يتجاوز `plugins.entries.exa.config.webSearch.baseUrl` الاختياري نقطة نهاية Exa (الترتيب 65)
9. **Tavily** -- `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey` (الترتيب 70)

البدائل بلا مفتاح بعد ذلك:

10. **DuckDuckGo** -- خيار HTML احتياطي بلا مفتاح ولا يحتاج إلى حساب أو مفتاح API (الترتيب 100)
11. **Ollama Web Search** -- خيار احتياطي بلا مفتاح عبر مضيف Ollama المحلي المكوّن لديك عندما يكون قابلًا للوصول ومسجّل الدخول باستخدام `ollama signin`؛ يمكنه إعادة استخدام مصادقة bearer لمزوّد Ollama عندما يحتاجها المضيف، ويمكنه استدعاء بحث مباشر عبر `https://ollama.com` عند تكوينه باستخدام `OLLAMA_API_KEY` (الترتيب 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (الترتيب 200)

إذا لم يتم اكتشاف أي مزوّد، فسيعود إلى Brave (ستحصل على خطأ مفتاح مفقود
يطالبك بتكوين مفتاح).

<Note>
  تدعم جميع حقول مفاتيح المزوّدين كائنات SecretRef. يتم حل SecretRefs ذات نطاق Plugin
  تحت `plugins.entries.<plugin>.config.webSearch.apiKey` لمزوّدي بحث الويب
  المدعومين عبر API والمضمّنين، بما في ذلك Brave وExa وFirecrawl
  وGemini وGrok وKimi وMiniMax وPerplexity وTavily،
  سواء تم اختيار المزوّد صراحةً عبر `tools.web.search.provider` أو
  تحديده من خلال الاكتشاف التلقائي. في وضع الاكتشاف التلقائي، يحل OpenClaw
  مفتاح المزوّد المحدد فقط -- تبقى SecretRefs غير المحددة غير نشطة، لذا يمكنك
  إبقاء عدة مزوّدين مكوّنين دون دفع تكلفة الحل للمزوّدين
  الذين لا تستخدمهم.
</Note>

## التكوين

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

يوجد إعداد خاص بكل موفّر (مفاتيح API، وعناوين URL الأساسية، والأوضاع) ضمن
`plugins.entries.<plugin>.config.webSearch.*`. يمكن لـ Gemini أيضًا إعادة استخدام
`models.providers.google.apiKey` و`models.providers.google.baseUrl` كبدائل ذات أولوية أدنى
بعد إعداد بحث الويب المخصص له و`GEMINI_API_KEY`. راجع صفحات الموفّرين للاطلاع على أمثلة.

يتم التحقق من `tools.web.search.provider` مقابل معرّفات موفّري بحث الويب
المعلنة في بيانات Plugin المضمّنة والمثبتة، إضافة إلى Plugins الموفّرين
القابلين للتثبيت والمعروفين. يؤدي خطأ مطبعي مثل `"brvae"` إلى فشل التحقق من
الإعداد بدل الرجوع بصمت إلى الاكتشاف التلقائي. إذا كان الموفّر المضبوط معروفًا
لكن Plugin المالك غير متاح، يحافظ OpenClaw على مرونة بدء التشغيل ويبلغ عن
تحذير حتى تتمكن من تشغيل `openclaw doctor --fix` لتثبيت Plugin أو تمكينه.
ينطبق سلوك التحذير نفسه على أدلة Plugin القديمة، مثل كتلة
`plugins.entries.<plugin>` متبقية بعد إلغاء تثبيت Plugin تابع لجهة خارجية.

اختيار موفّر fallback لـ `web_fetch` منفصل:

- اختره باستخدام `tools.web.fetch.provider`
- أو احذف ذلك الحقل واترك OpenClaw يكتشف تلقائيًا أول موفّر web-fetch جاهز
  من بيانات الاعتماد المتاحة
- يمكن لـ `web_fetch` غير المعزول استخدام موفّري Plugin المثبتين الذين يعلنون
  `contracts.webFetchProviders`؛ أما عمليات الجلب المعزولة فتبقى مضمّنة فقط
- اليوم موفّر web-fetch المضمّن هو Firecrawl، ويتم ضبطه ضمن
  `plugins.entries.firecrawl.config.webFetch.*`

عند اختيار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا طلب:

- منطقة Moonshot API (`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج بحث الويب الافتراضي لـ Kimi (القيمة الافتراضية `kimi-k2.6`)

بالنسبة إلى `x_search`، اضبط `plugins.entries.xai.config.xSearch.*`. يستخدم
fallback نفسه `XAI_API_KEY` مثل بحث الويب في Grok.
يتم ترحيل إعداد `tools.web.x_search.*` القديم تلقائيًا بواسطة `openclaw doctor --fix`.
عند اختيار Grok أثناء `openclaw onboard` أو `openclaw configure --section web`،
يمكن لـ OpenClaw أيضًا عرض إعداد `x_search` اختياريًا باستخدام المفتاح نفسه.
هذه خطوة متابعة منفصلة داخل مسار Grok، وليست اختيار موفّر بحث ويب علويًا
منفصلًا. إذا اخترت موفّرًا آخر، فلن يعرض OpenClaw مطالبة `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="ملف الإعداد">
    شغّل `openclaw configure --section web` أو عيّن المفتاح مباشرة:

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
  <Tab title="متغير البيئة">
    عيّن متغير بيئة الموفّر في بيئة عملية Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    لتثبيت gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معاملات الأداة

| المعامل               | الوصف                                                 |
| --------------------- | ----------------------------------------------------- |
| `query`               | استعلام البحث (مطلوب)                                |
| `count`               | النتائج المراد إرجاعها (1-10، الافتراضي: 5)          |
| `country`             | رمز بلد ISO المكون من حرفين (مثل "US"، "DE")         |
| `language`            | رمز لغة ISO 639-1 (مثل "en"، "de")                   |
| `search_lang`         | رمز لغة البحث (Brave فقط)                            |
| `freshness`           | عامل تصفية زمني: `day` أو `week` أو `month` أو `year` |
| `date_after`          | النتائج بعد هذا التاريخ (YYYY-MM-DD)                 |
| `date_before`         | النتائج قبل هذا التاريخ (YYYY-MM-DD)                 |
| `ui_lang`             | رمز لغة واجهة المستخدم (Brave فقط)                   |
| `domain_filter`       | مصفوفة السماح/الحظر للنطاقات (Perplexity فقط)        |
| `max_tokens`          | إجمالي ميزانية المحتوى، الافتراضي 25000 (Perplexity فقط) |
| `max_tokens_per_page` | حد الرموز لكل صفحة، الافتراضي 2048 (Perplexity فقط)  |

<Warning>
  لا تعمل كل المعاملات مع كل الموفّرين. يرفض وضع Brave `llm-context`
  `ui_lang`؛ كما يحتاج `date_before` أيضًا إلى `date_after` لأن نطاقات
  freshness المخصصة في Brave تتطلب تاريخَي بداية ونهاية.
  يعيد Gemini وGrok وKimi إجابة واحدة مركّبة مع استشهادات. تقبل هذه الموفّرات
  `count` للتوافق مع الأداة المشتركة، لكنه لا يغيّر شكل الإجابة المؤسّسة.
  يدعم Gemini `freshness` و`date_after` و`date_before` من خلال تحويلها إلى
  نطاقات زمنية لتأسيس Google Search.
  يتصرف Perplexity بالطريقة نفسها عند استخدام مسار توافق Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`).
  يقبل SearXNG `http://` فقط لمضيفي الشبكة الخاصة الموثوقين أو مضيفي local loopback؛
  يجب أن تستخدم نقاط نهاية SearXNG العامة `https://`.
  يدعم Firecrawl وTavily فقط `query` و`count` من خلال `web_search`
  -- استخدم أدواتهما المخصصة للخيارات المتقدمة.
</Warning>

## x_search

يستعلم `x_search` عن منشورات X (المعروف سابقًا باسم Twitter) باستخدام xAI ويعيد
إجابات مركّبة بالذكاء الاصطناعي مع استشهادات. يقبل استعلامات بلغة طبيعية
وعوامل تصفية منظمة اختيارية. لا يمكّن OpenClaw أداة xAI المدمجة `x_search`
إلا في الطلب الذي يخدم استدعاء الأداة هذا.

<Note>
  توثق xAI أن `x_search` يدعم البحث بالكلمات المفتاحية، والبحث الدلالي، وبحث
  المستخدمين، وجلب السلاسل. بالنسبة إلى إحصاءات التفاعل لكل منشور مثل إعادة
  النشر أو الردود أو العلامات المرجعية أو المشاهدات، فضّل بحثًا موجّهًا عن
  عنوان URL الدقيق للمنشور أو معرّف الحالة. قد تعثر عمليات البحث الواسعة
  بالكلمات المفتاحية على المنشور الصحيح لكنها تعيد بيانات وصفية أقل اكتمالًا
  لكل منشور. النمط الجيد هو: حدّد موقع المنشور أولًا، ثم شغّل استعلام
  `x_search` ثانيًا يركز على ذلك المنشور بالضبط.
</Note>

### إعداد x_search

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

ينشر `x_search` إلى `<baseUrl>/responses` عندما يكون
`plugins.entries.xai.config.xSearch.baseUrl` مضبوطًا. إذا حُذف ذلك الحقل،
فإنه يرجع إلى `plugins.entries.xai.config.webSearch.baseUrl`، ثم إلى
`tools.web.search.grok.baseUrl` القديم، وأخيرًا إلى نقطة نهاية xAI العامة.

### معاملات x_search

| المعامل                     | الوصف                                                   |
| ---------------------------- | ------------------------------------------------------- |
| `query`                      | استعلام البحث (مطلوب)                                  |
| `allowed_x_handles`          | تقييد النتائج بحسابات X محددة                          |
| `excluded_x_handles`         | استبعاد حسابات X محددة                                 |
| `from_date`                  | تضمين المنشورات في هذا التاريخ أو بعده فقط (YYYY-MM-DD) |
| `to_date`                    | تضمين المنشورات في هذا التاريخ أو قبله فقط (YYYY-MM-DD) |
| `enable_image_understanding` | السماح لـ xAI بفحص الصور المرفقة بالمنشورات المطابقة    |
| `enable_video_understanding` | السماح لـ xAI بفحص مقاطع الفيديو المرفقة بالمنشورات المطابقة |

### مثال x_search

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

## أمثلة

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

## ملفات تعريف الأدوات

إذا كنت تستخدم ملفات تعريف الأدوات أو قوائم السماح، فأضف `web_search` أو `x_search` أو `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## ذات صلة

- [Web Fetch](/ar/tools/web-fetch) -- جلب عنوان URL واستخراج محتوى قابل للقراءة
- [Web Browser](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع كثيفة JavaScript
- [Grok Search](/ar/tools/grok-search) -- Grok كموفّر `web_search`
- [Ollama Web Search](/ar/tools/ollama-search) -- بحث ويب بلا مفتاح من خلال مضيف Ollama الخاص بك
