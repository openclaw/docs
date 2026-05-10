---
read_when:
    - تريد تمكين web_search أو تكوينه
    - تريد تمكين x_search أو تكوينه
    - تحتاج إلى اختيار موفّر بحث
    - تريد فهم الاكتشاف التلقائي والرجوع الاحتياطي إلى المزوّد
sidebarTitle: Web Search
summary: web_search و x_search و web_fetch -- البحث في الويب، أو البحث في منشورات X، أو جلب محتوى الصفحة
title: البحث في الويب
x-i18n:
    generated_at: "2026-05-10T20:07:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c2806730f8c9cb33a3c142d5283de0f1231502e052c6da796c31125834a94e6
    source_path: tools/web.md
    workflow: 16
---

تبحث أداة `web_search` في الويب باستخدام المزوّد الذي قمت بتكوينه وتُرجع النتائج. تُخزَّن النتائج مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للتكوين).

يتضمن OpenClaw أيضًا `x_search` لمنشورات X (المعروفة سابقًا باسم Twitter) و`web_fetch` لجلب عناوين URL بصورة خفيفة. في هذه المرحلة، يبقى `web_fetch` محليًا، بينما يمكن لـ `web_search` و`x_search` استخدام xAI Responses ضمنيًا.

<Info>
  `web_search` أداة HTTP خفيفة، وليست أتمتة متصفح. للمواقع كثيفة
  الاعتماد على JS أو عمليات تسجيل الدخول، استخدم [متصفح الويب](/ar/tools/browser). ولجلب
  عنوان URL محدد، استخدم [جلب الويب](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="اختر مزوّدًا">
    اختر مزوّدًا وأكمل أي إعداد مطلوب. بعض المزوّدين لا يحتاجون إلى مفاتيح،
    بينما يستخدم آخرون مفاتيح API. راجع صفحات المزوّدين أدناه للتفاصيل.
  </Step>
  <Step title="التكوين">
    ```bash
    openclaw configure --section web
    ```
    يخزّن هذا المزوّد وأي بيانات اعتماد مطلوبة. يمكنك أيضًا تعيين متغير بيئة
    (مثل `BRAVE_API_KEY`) وتجاوز هذه الخطوة للمزوّدين المدعومين عبر API.
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
    نتائج منظمة مع مقتطفات. يدعم وضع `llm-context` وفلاتر البلد/اللغة. تتوفر طبقة مجانية.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    خيار احتياطي بلا مفتاح. لا حاجة إلى مفتاح API. تكامل غير رسمي قائم على HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي + بحث بالكلمات المفتاحية مع استخراج المحتوى (إبرازات، نص، ملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظمة. يفضّل استخدامه مع `firecrawl_search` و`firecrawl_scrape` للاستخراج العميق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مركبة بالذكاء الاصطناعي مع استشهادات عبر إسناد Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مركبة بالذكاء الاصطناعي مع استشهادات عبر إسناد ويب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مركبة بالذكاء الاصطناعي مع استشهادات عبر بحث الويب من Moonshot؛ تفشل بدائل الدردشة غير المسندة صراحة.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظمة عبر API البحث في MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    بحث عبر مضيف Ollama محلي مسجل الدخول أو API Ollama المستضاف.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظمة مع عناصر تحكم في استخراج المحتوى وتصفية النطاقات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    بحث وصفي مستضاف ذاتيًا. لا حاجة إلى مفتاح API. يجمع Google وBing وDuckDuckGo والمزيد.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظمة مع عمق البحث، وتصفية الموضوعات، و`tavily_extract` لاستخراج عناوين URL.
  </Card>
</CardGroup>

### مقارنة المزوّدين

| المزوّد                                   | نمط النتائج                                                    | الفلاتر                                          | مفتاح API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)              | مقتطفات منظمة                                                  | البلد، اللغة، الوقت، وضع `llm-context`          | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/ar/tools/duckduckgo-search)    | مقتطفات منظمة                                                  | --                                               | لا شيء (بلا مفتاح)                                                                      |
| [Exa](/ar/tools/exa-search)                  | منظمة + مستخرجة                                                | وضع عصبي/كلمات مفتاحية، التاريخ، استخراج المحتوى | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ar/tools/firecrawl)             | مقتطفات منظمة                                                  | عبر أداة `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ar/tools/gemini-search)            | مركبة بالذكاء الاصطناعي + استشهادات                            | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ar/tools/grok-search)                | مركبة بالذكاء الاصطناعي + استشهادات                            | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/ar/tools/kimi-search)                | مركبة بالذكاء الاصطناعي + استشهادات؛ تفشل عند بدائل الدردشة غير المسندة | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ar/tools/minimax-search)   | مقتطفات منظمة                                                  | المنطقة (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ar/tools/ollama-search) | مقتطفات منظمة                                                  | --                                               | لا شيء للمضيفين المحليين المسجلين الدخول؛ `OLLAMA_API_KEY` للبحث المباشر عبر `https://ollama.com` |
| [Perplexity](/ar/tools/perplexity-search)    | مقتطفات منظمة                                                  | البلد، اللغة، الوقت، النطاقات، حدود المحتوى      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ar/tools/searxng-search)          | مقتطفات منظمة                                                  | الفئات، اللغة                                    | لا شيء (مستضاف ذاتيًا)                                                                  |
| [Tavily](/ar/tools/tavily)                   | مقتطفات منظمة                                                  | عبر أداة `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## الاكتشاف التلقائي

## بحث الويب الأصلي من OpenAI

تستخدم نماذج OpenAI Responses المباشرة أداة `web_search` المستضافة من OpenAI تلقائيًا عند تمكين بحث الويب في OpenClaw وعدم تثبيت مزوّد مُدار. هذا سلوك يملكه المزوّد في Plugin OpenAI المضمّن، وينطبق فقط على حركة API الأصلية لـ OpenAI، وليس على عناوين URL الأساسية للوكلاء المتوافقين مع OpenAI أو مسارات Azure. عيّن `tools.web.search.provider` إلى مزوّد آخر مثل `brave` للإبقاء على أداة `web_search` المُدارة لنماذج OpenAI، أو عيّن `tools.web.search.enabled: false` لتعطيل كل من البحث المُدار وبحث OpenAI الأصلي.

## بحث الويب الأصلي من Codex

يمكن للنماذج القادرة على Codex اختياريًا استخدام أداة Responses الأصلية لدى المزوّد `web_search` بدلًا من دالة `web_search` المُدارة في OpenClaw.

- كوّنها ضمن `tools.web.search.openaiCodex`
- لا تُفعّل إلا للنماذج القادرة على Codex (`openai-codex/*` أو المزوّدين الذين يستخدمون `api: "openai-codex-responses"`)
- يظل `web_search` المُدار مطبقًا على النماذج غير التابعة لـ Codex
- `mode: "cached"` هو الإعداد الافتراضي والموصى به
- يعطّل `tools.web.search.enabled: false` كلًا من البحث المُدار والأصلي

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

إذا تم تمكين بحث Codex الأصلي لكن النموذج الحالي غير قادر على Codex، يحافظ OpenClaw على سلوك `web_search` المُدار العادي.

## أمان الشبكة

تستخدم استدعاءات مزوّد `web_search` المُدارة مسار الجلب المحمي في OpenClaw. بالنسبة
إلى مضيفي API الموثوقين للمزوّدين، يسمح OpenClaw بإجابات DNS المزيفة من Surge وClash وsing-box
ضمن `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف ذلك المزوّد.
وتبقى الوجهات الخاصة الأخرى، وlocal loopback، والمحلية للرابط، ووجهات البيانات الوصفية محظورة.

لا ينطبق هذا السماح التلقائي على عناوين URL عشوائية في `web_fetch`. بالنسبة
إلى `web_fetch`، فعّل `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` صراحةً فقط عندما يملك
وكيلك الموثوق تلك النطاقات الاصطناعية.

## إعداد بحث الويب

تكون قوائم المزوّدين في التوثيق وتدفقات الإعداد مرتبة أبجديًا. يحتفظ الاكتشاف التلقائي
بترتيب أسبقية منفصل.

إذا لم يتم تعيين `provider`، يفحص OpenClaw المزوّدين بهذا الترتيب ويستخدم
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

الخيارات الاحتياطية بلا مفتاح بعد ذلك:

10. **DuckDuckGo** -- خيار HTML احتياطي بلا مفتاح ولا يحتاج إلى حساب أو مفتاح API (الترتيب 100)
11. **Ollama Web Search** -- خيار احتياطي بلا مفتاح عبر مضيف Ollama المحلي المكوّن لديك عندما يكون قابلًا للوصول ومسجل الدخول باستخدام `ollama signin`؛ يمكنه إعادة استخدام مصادقة bearer لمزوّد Ollama عندما يحتاجها المضيف، ويمكنه استدعاء البحث المباشر عبر `https://ollama.com` عند تكوينه باستخدام `OLLAMA_API_KEY` (الترتيب 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (الترتيب 200)

إذا لم يتم اكتشاف أي مزوّد، فسيعود إلى Brave (ستحصل على خطأ مفتاح مفقود
يطالبك بتكوين واحد).

<Note>
  تدعم جميع حقول مفاتيح المزوّدين كائنات SecretRef. تُحل SecretRefs ذات النطاق الخاص بـ Plugin
  ضمن `plugins.entries.<plugin>.config.webSearch.apiKey` لمزوّدي بحث الويب المدعومين عبر API
  والمضمّنين، بما في ذلك Brave وExa وFirecrawl
  وGemini وGrok وKimi وMiniMax وPerplexity وTavily،
  سواء تم اختيار المزوّد صراحةً عبر `tools.web.search.provider` أو
  تحديده من خلال الاكتشاف التلقائي. في وضع الاكتشاف التلقائي، يحل OpenClaw مفتاح
  المزوّد المحدد فقط -- وتبقى SecretRefs غير المحددة غير نشطة، لذا يمكنك
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

يوجد الإعداد الخاص بكل موفّر، مثل مفاتيح API وعناوين URL الأساسية والأوضاع، ضمن
`plugins.entries.<plugin>.config.webSearch.*`. يستطيع Gemini أيضًا إعادة استخدام
`models.providers.google.apiKey` و`models.providers.google.baseUrl` كبدائل ذات أولوية أدنى
بعد إعداد بحث الويب المخصص له و`GEMINI_API_KEY`. راجع صفحات
الموفّرين للاطلاع على أمثلة.

يتم التحقق من `tools.web.search.provider` مقابل معرّفات موفّري بحث الويب
المعلنة في بيانات Plugin المضمنة والمثبتة. خطأ مطبعي مثل `"brvae"`
يفشل تحقق الإعداد بدلًا من الرجوع بصمت إلى الاكتشاف التلقائي. إذا كان
الموفّر المكوّن لا يملك إلا دليل Plugin قديمًا، مثل كتلة
`plugins.entries.<plugin>` متبقية بعد إلغاء تثبيت Plugin تابع لجهة خارجية،
يحافظ OpenClaw على مرونة بدء التشغيل ويبلغ عن تحذير لتتمكن من إعادة تثبيت
Plugin أو تشغيل `openclaw doctor --fix` لتنظيف الإعداد القديم.

اختيار موفّر الرجوع الاحتياطي لـ `web_fetch` منفصل:

- اختره باستخدام `tools.web.fetch.provider`
- أو احذف هذا الحقل ودع OpenClaw يكتشف تلقائيًا أول موفّر web-fetch
  جاهز من بيانات الاعتماد المتاحة
- يمكن لـ `web_fetch` غير المعزول استخدام موفّري Plugin المثبتين الذين يعلنون
  `contracts.webFetchProviders`؛ تبقى عمليات الجلب المعزولة مقتصرة على المضمنة فقط
- اليوم موفّر web-fetch المضمن هو Firecrawl، ويُعدّ ضمن
  `plugins.entries.firecrawl.config.webFetch.*`

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا طلب:

- منطقة Moonshot API (`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج بحث الويب الافتراضي لـ Kimi (الافتراضي هو `kimi-k2.6`)

بالنسبة إلى `x_search`، اضبط `plugins.entries.xai.config.xSearch.*`. يستخدم
ملف تعريف مصادقة xAI نفسه المستخدم للدردشة، أو بيانات اعتماد `XAI_API_KEY` / بحث الويب
الخاصة بـ Plugin والمستخدمة بواسطة بحث الويب في Grok.
يتم ترحيل إعداد `tools.web.x_search.*` القديم تلقائيًا بواسطة `openclaw doctor --fix`.
عندما تختار Grok أثناء `openclaw onboard` أو `openclaw configure --section web`،
يمكن لـ OpenClaw أيضًا تقديم إعداد اختياري لـ `x_search` بالمفتاح نفسه.
هذه خطوة متابعة منفصلة داخل مسار Grok، وليست اختيارًا منفصلًا على المستوى الأعلى
لموفّر بحث الويب. إذا اخترت موفّرًا آخر، فلن يعرض OpenClaw
مطالبة `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="ملف الإعداد">
    شغّل `openclaw configure --section web` أو اضبط المفتاح مباشرة:

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
    اضبط متغير بيئة الموفّر في بيئة عملية Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    لتثبيت gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معاملات الأداة

| المعامل               | الوصف                                                  |
| --------------------- | ------------------------------------------------------ |
| `query`               | استعلام البحث (مطلوب)                                  |
| `count`               | النتائج المراد إرجاعها (1-10، الافتراضي: 5)           |
| `country`             | رمز البلد ISO المكوّن من حرفين (مثل "US"، "DE")        |
| `language`            | رمز اللغة ISO 639-1 (مثل "en"، "de")                  |
| `search_lang`         | رمز لغة البحث (Brave فقط)                              |
| `freshness`           | عامل تصفية الوقت: `day` أو `week` أو `month` أو `year` |
| `date_after`          | النتائج بعد هذا التاريخ (YYYY-MM-DD)                  |
| `date_before`         | النتائج قبل هذا التاريخ (YYYY-MM-DD)                  |
| `ui_lang`             | رمز لغة واجهة المستخدم (Brave فقط)                     |
| `domain_filter`       | مصفوفة قائمة السماح/الحظر للنطاقات (Perplexity فقط)   |
| `max_tokens`          | إجمالي ميزانية المحتوى، الافتراضي 25000 (Perplexity فقط) |
| `max_tokens_per_page` | حد الرموز لكل صفحة، الافتراضي 2048 (Perplexity فقط)   |

<Warning>
  لا تعمل كل المعاملات مع كل الموفّرين. يرفض وضع Brave `llm-context`
  `ui_lang`؛ ويحتاج `date_before` أيضًا إلى `date_after` لأن نطاقات
  الحداثة المخصصة في Brave تتطلب تاريخي بداية ونهاية معًا.
  يعيد Gemini وGrok وKimi إجابة مركبة واحدة مع استشهادات. تقبل
  `count` للتوافق مع الأداة المشتركة، لكنها لا تغيّر شكل الإجابة
  المؤسّسة على المصادر. يدعم Gemini `freshness` و`date_after` و
  `date_before` عن طريق تحويلها إلى نطاقات زمنية لتأصيل Google Search.
  يتصرف Perplexity بالطريقة نفسها عند استخدام مسار توافق Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`).
  يقبل SearXNG `http://` فقط لمضيفي الشبكات الخاصة الموثوقة أو مضيفي local loopback؛
  يجب أن تستخدم نقاط نهاية SearXNG العامة `https://`.
  يدعم Firecrawl وTavily فقط `query` و`count` عبر `web_search`
  -- استخدم أدواتهما المخصصة للخيارات المتقدمة.
</Warning>

## x_search

يستعلم `x_search` منشورات X (تويتر سابقًا) باستخدام xAI ويعيد
إجابات مركبة بالذكاء الاصطناعي مع استشهادات. يقبل استعلامات باللغة الطبيعية ومرشحات
مهيكلة اختيارية. يفعّل OpenClaw أداة xAI `x_search` المضمنة
فقط في الطلب الذي يخدم استدعاء هذه الأداة.

<Note>
  يوثق xAI أن `x_search` يدعم البحث بالكلمات المفتاحية والبحث الدلالي وبحث المستخدم
  وجلب السلاسل. لإحصاءات التفاعل لكل منشور مثل إعادة النشر
  والردود والإشارات المرجعية أو المشاهدات، يفضّل استخدام بحث موجّه لعنوان URL الدقيق للمنشور
  أو معرّف الحالة. قد تجد عمليات البحث العامة بالكلمات المفتاحية المنشور الصحيح لكنها تعيد
  بيانات وصفية أقل اكتمالًا لكل منشور. النمط الجيد هو: حدّد المنشور أولًا، ثم
  شغّل استعلام `x_search` ثانيًا مركّزًا على ذلك المنشور تحديدًا.
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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
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
فإنه يرجع إلى `plugins.entries.xai.config.webSearch.baseUrl`، ثم
`tools.web.search.grok.baseUrl` القديم، وأخيرًا نقطة نهاية xAI العامة.

### معاملات x_search

| المعامل                     | الوصف                                                   |
| --------------------------- | ------------------------------------------------------- |
| `query`                     | استعلام البحث (مطلوب)                                   |
| `allowed_x_handles`         | حصر النتائج في أسماء حسابات X محددة                     |
| `excluded_x_handles`        | استبعاد أسماء حسابات X محددة                            |
| `from_date`                 | تضمين المنشورات في هذا التاريخ أو بعده فقط (YYYY-MM-DD) |
| `to_date`                   | تضمين المنشورات في هذا التاريخ أو قبله فقط (YYYY-MM-DD) |
| `enable_image_understanding` | السماح لـ xAI بفحص الصور المرفقة بالمنشورات المطابقة   |
| `enable_video_understanding` | السماح لـ xAI بفحص الفيديوهات المرفقة بالمنشورات المطابقة |

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
- [Ollama Web Search](/ar/tools/ollama-search) -- بحث ويب بلا مفتاح عبر مضيف Ollama الخاص بك
