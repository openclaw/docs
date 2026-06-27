---
read_when:
    - تريد تفعيل أو تكوين web_search
    - تريد تمكين x_search أو تكوينه
    - تحتاج إلى اختيار مزوّد بحث
    - تريد فهم الاكتشاف التلقائي واختيار المزوّد
sidebarTitle: Web Search
summary: web_search وx_search وweb_fetch -- ابحث في الويب، أو ابحث في منشورات X، أو اجلب محتوى الصفحة
title: بحث الويب
x-i18n:
    generated_at: "2026-06-27T18:48:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

تبحث أداة `web_search` في الويب باستخدام المزوّد الذي قمت بتكوينه وتعيد
النتائج. تُخزَّن النتائج مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للتكوين).

يتضمن OpenClaw أيضًا `x_search` لمنشورات X (المعروف سابقًا باسم Twitter) و
`web_fetch` لجلب عناوين URL بشكل خفيف. في هذه المرحلة، يبقى `web_fetch`
محليًا بينما يمكن أن يستخدم `web_search` و `x_search` ‏xAI Responses داخليًا.

<Info>
  `web_search` أداة HTTP خفيفة، وليست أتمتة متصفح. للمواقع كثيفة
  JavaScript أو تسجيلات الدخول، استخدم [متصفح الويب](/ar/tools/browser). ولجلب
  عنوان URL محدد، استخدم [جلب الويب](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="Choose a provider">
    اختر مزوّدًا وأكمل أي إعداد مطلوب. بعض المزوّدين لا يحتاجون إلى مفاتيح،
    بينما يستخدم آخرون مفاتيح API. راجع صفحات المزوّدين أدناه للتفاصيل.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    يخزّن هذا المزوّد وأي بيانات اعتماد مطلوبة. يمكنك أيضًا ضبط متغير بيئة
    (مثل `BRAVE_API_KEY`) وتجاوز هذه الخطوة للمزوّدين المدعومين بواجهة API.
  </Step>
  <Step title="Use it">
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
  <Card title="Codex Hosted Search" icon="search" href="/ar/plugins/codex-harness">
    إجابات مؤلَّفة بالذكاء الاصطناعي ومستندة إلى مصادر عبر حساب خادم تطبيق Codex الخاص بك.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    مزوّد بلا مفتاح. لا حاجة إلى مفتاح API. تكامل غير رسمي قائم على HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي + بالكلمات المفتاحية مع استخراج المحتوى (تمييزات، نص، ملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظمة. يعمل بأفضل صورة مع `firecrawl_search` و `firecrawl_scrape` للاستخراج العميق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مؤلَّفة بالذكاء الاصطناعي مع اقتباسات عبر إسناد Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مؤلَّفة بالذكاء الاصطناعي مع اقتباسات عبر إسناد ويب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مؤلَّفة بالذكاء الاصطناعي مع اقتباسات عبر بحث الويب من Moonshot؛ تفشل احتياطيات الدردشة غير المستندة إلى مصادر صراحةً.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظمة عبر واجهة API للبحث في MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    بحث عبر مضيف Ollama محلي مسجّل الدخول أو واجهة API المستضافة من Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/ar/tools/parallel-search">
    واجهة API مدفوعة لـ Parallel Search ‏(`PARALLEL_API_KEY`)؛ حدود معدلات أعلى وضبط للأهداف.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/ar/tools/parallel-search">
    خيار بلا مفتاح. Search MCP المجاني من Parallel، مع مقتطفات كثيفة محسّنة للنماذج اللغوية الكبيرة وبدون مفتاح API.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظمة مع عناصر تحكم في استخراج المحتوى وتصفية النطاقات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    بحث ميتا مستضاف ذاتيًا. لا حاجة إلى مفتاح API. يجمع Google وBing وDuckDuckGo والمزيد.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظمة مع عمق البحث، وتصفية الموضوعات، و`tavily_extract` لاستخراج عناوين URL.
  </Card>
</CardGroup>

### مقارنة المزوّدين

| المزوّد                                         | نمط النتائج                                                   | الفلاتر                                          | مفتاح API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)                     | مقتطفات منظمة                                            | البلد، اللغة، الوقت، وضع `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/ar/plugins/codex-harness)    | مؤلَّفة بالذكاء الاصطناعي + عناوين URL للمصادر                                   | النطاقات، حجم السياق، موقع المستخدم             | لا يوجد؛ يستخدم تسجيل الدخول إلى Codex/OpenAI                                                         |
| [DuckDuckGo](/ar/tools/duckduckgo-search)           | مقتطفات منظمة                                            | --                                               | لا يوجد (بلا مفتاح)                                                                         |
| [Exa](/ar/tools/exa-search)                         | منظمة + مستخرجة                                         | الوضع العصبي/الكلمات المفتاحية، التاريخ، استخراج المحتوى    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ar/tools/firecrawl)                    | مقتطفات منظمة                                            | عبر أداة `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ar/tools/gemini-search)                   | مؤلَّفة بالذكاء الاصطناعي + اقتباسات                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ar/tools/grok-search)                       | مؤلَّفة بالذكاء الاصطناعي + اقتباسات                                     | --                                               | xAI OAuth، أو `XAI_API_KEY`، أو `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/ar/tools/kimi-search)                       | مؤلَّفة بالذكاء الاصطناعي + اقتباسات؛ تفشل عند احتياطيات الدردشة غير المستندة إلى مصادر | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ar/tools/minimax-search)          | مقتطفات منظمة                                            | المنطقة (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ar/tools/ollama-search)        | مقتطفات منظمة                                            | --                                               | لا يوجد للمضيفين المحليين المسجّل دخولهم؛ `OLLAMA_API_KEY` للبحث المباشر عبر `https://ollama.com` |
| [Parallel](/ar/tools/parallel-search)               | مقتطفات كثيفة مرتبة لسياق النماذج اللغوية الكبيرة                          | --                                               | `PARALLEL_API_KEY` (مدفوع)                                                               |
| [Parallel Search (Free)](/ar/tools/parallel-search) | مقتطفات كثيفة مرتبة لسياق النماذج اللغوية الكبيرة                          | --                                               | لا يوجد (Search MCP مجاني)                                                                  |
| [Perplexity](/ar/tools/perplexity-search)           | مقتطفات منظمة                                            | البلد، اللغة، الوقت، النطاقات، حدود المحتوى | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ar/tools/searxng-search)                 | مقتطفات منظمة                                            | الفئات، اللغة                             | لا يوجد (مستضاف ذاتيًا)                                                                      |
| [Tavily](/ar/tools/tavily)                          | مقتطفات منظمة                                            | عبر أداة `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## الاكتشاف التلقائي

## بحث الويب الأصلي في OpenAI

تستخدم نماذج OpenAI Responses المباشرة أداة `web_search` المستضافة من OpenAI تلقائيًا عند تمكين بحث الويب في OpenClaw وعدم تثبيت مزوّد مُدار. هذا سلوك مملوك للمزوّد في Plugin ‏OpenAI المضمّن ولا ينطبق إلا على حركة واجهة OpenAI API الأصلية، وليس عناوين URL الأساسية للوكلاء المتوافقين مع OpenAI أو مسارات Azure. اضبط `tools.web.search.provider` على مزوّد آخر مثل `brave` للإبقاء على أداة `web_search` المُدارة لنماذج OpenAI، أو اضبط `tools.web.search.enabled: false` لتعطيل كل من البحث المُدار وبحث OpenAI الأصلي.

## بحث الويب الأصلي في Codex

يستخدم وقت تشغيل خادم تطبيق Codex أداة `web_search` المستضافة من Codex تلقائيًا
عند تمكين بحث الويب وعدم تحديد مزوّد مُدار. البحث المستضاف الأصلي وأداة
`web_search` الديناميكية المُدارة من OpenClaw متنافيان، لذلك لا يمكن للبحث
المُدار تجاوز قيود النطاق الأصلية. يستخدم OpenClaw الأداة المُدارة عندما يكون
البحث المستضاف غير متاح، أو معطّلًا صراحةً، أو مستبدلًا بمزوّد مُدار محدد.
يبقي OpenClaw امتداد `web.run` المستقل في Codex معطّلًا لأن حركة خادم التطبيق
في الإنتاج ترفض مساحة الاسم `web` المعرّفة من المستخدم.

- قم بتكوين البحث الأصلي ضمن `tools.web.search.openaiCodex`
- اضبط `tools.web.search.provider: "codex"` لتوفير Codex Hosted Search بصفته
  مزوّد `web_search` المُدار لأي نموذج أصل. يشغّل كل استدعاء دورة مؤقتة محدودة
  لخادم تطبيق Codex ويفشل إذا لم يصدر Codex عنصر `webSearch` مستضافًا.
- `mode: "cached"` هو التفضيل الافتراضي، لكن Codex يحلّه إلى وصول خارجي مباشر
  لدورات خادم التطبيق غير المقيّدة؛ اضبط `"live"` لطلب الوصول المباشر صراحةً
- اضبط `tools.web.search.provider` على مزوّد مُدار مثل `brave` لاستخدام
  `web_search` المُدار من OpenClaw بدلًا من ذلك
- اضبط `tools.web.search.openaiCodex.enabled: false` لإلغاء الاشتراك في البحث
  المستضاف من Codex؛ تبقى المزوّدات المُدارة الأخرى متاحة
- تقييد سطح الأداة الأصلي في Codex يبقي أيضًا `web_search` المُدار متاحًا
- عند ضبط `allowedDomains`، يفشل الرجوع التلقائي المُدار بوضع مغلق إذا لم يكن
  البحث المستضاف متاحًا حتى لا يمكن تجاوز قائمة السماح الأصلية
- عمليات التشغيل المعطلة للأدوات والمقتصرة على النموذج اللغوي الكبير تعطل البحث
  الأصلي والمُدار معًا
- `tools.web.search.enabled: false` يعطل البحث المُدار والأصلي معًا

تبدأ تغييرات سياسة بحث Codex الفعالة والمستمرة سلسلة مرتبطة جديدة بحيث لا
يمكن لسلسلة خادم تطبيق محمّلة مسبقًا الاحتفاظ بوصول قديم إلى البحث المستضاف.
تستخدم القيود المؤقتة لكل دورة سلسلة مؤقتة مقيّدة وتحافظ على الربط الحالي
لاستئنافه لاحقًا.

يمكن لحركة OpenAI ChatGPT Responses المباشرة أيضًا استخدام أداة `web_search`
المستضافة من OpenAI. يبقى هذا المسار المنفصل اختياريًا عبر
`tools.web.search.openaiCodex.enabled: true` ولا ينطبق إلا على نماذج
`openai/*` المؤهلة التي تستخدم `api: "openai-chatgpt-responses"`.

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

بالنسبة إلى أوقات التشغيل والمزوّدين الذين لا يدعمون بحث Codex الأصلي، يمكن لـ Codex
استخدام رجوع `web_search` المُدار عبر مساحة أسماء الأدوات الديناميكية في OpenClaw.
استخدم مزوّدًا مُدارًا صريحًا عندما تحتاج إلى عناصر التحكم الشبكية الخاصة بمزوّد
OpenClaw بدلًا من البحث المستضاف من Codex.

يؤدي اختيار `provider: "codex"` إلى تفعيل Plugin `codex` المضمّن واستخدام قيود
`tools.web.search.openaiCodex` نفسها الموضّحة أعلاه. صادِق مع خادم تطبيق
Codex أولًا باستخدام `openclaw models auth login --provider openai`.
يمكن للوكيل الأب استخدام أي نموذج أو وقت تشغيل؛ ولا يعمل عبر Codex إلا عامل
البحث المحدود.

## سلامة الشبكة

تستخدم استدعاءات موفّر HTTP `web_search` المُدارة مسار الجلب المحروس في OpenClaw. بالنسبة
إلى مضيفي API الموثوقين للموفّر، يسمح OpenClaw بإجابات DNS الوهمية fake-IP الخاصة
بـ Surge وClash وsing-box ضمن `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف ذلك الموفّر.
وتظل الوجهات الخاصة الأخرى، وloopback، وlink-local، ووجهات metadata محجوبة.
يُعد Codex Hosted Search الاستثناء: إذ يفوّض عامله المحدود الوصول إلى الشبكة
إلى أداة `web_search` المستضافة في خادم تطبيق Codex.

لا ينطبق هذا السماح التلقائي على عناوين URL العشوائية في `web_fetch`. بالنسبة
إلى `web_fetch`، فعّل `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` صراحةً فقط عندما يكون
الوكيل الموثوق لديك مالكًا لتلك النطاقات الاصطناعية.

## إعداد بحث الويب

تكون قوائم الموفّرين في الوثائق وتدفقات الإعداد مرتبة أبجديًا. ويحتفظ الاكتشاف
التلقائي بترتيب أسبقية منفصل.

إذا لم يُعيَّن `provider`، يفحص OpenClaw الموفّرين بهذا الترتيب ويستخدم أول
موفّر جاهز:

الموفّرون المدعومون بـ API أولًا:

1. **Brave** -- `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey` (الترتيب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey` (الترتيب 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`، أو `GEMINI_API_KEY`، أو `models.providers.google.apiKey` (الترتيب 20)
4. **Grok** -- xAI OAuth، أو `XAI_API_KEY`، أو `plugins.entries.xai.config.webSearch.apiKey` (الترتيب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey` (الترتيب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey` (الترتيب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey` (الترتيب 60)
8. **Exa** -- `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey`؛ يتجاوز `plugins.entries.exa.config.webSearch.baseUrl` الاختياري نقطة نهاية Exa (الترتيب 65)
9. **Tavily** -- `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey` (الترتيب 70)
10. **Parallel** -- Parallel Search API المدفوع عبر `PARALLEL_API_KEY` أو `plugins.entries.parallel.config.webSearch.apiKey`؛ يتجاوز `plugins.entries.parallel.config.webSearch.baseUrl` الاختياري نقطة النهاية (الترتيب 75)

موفّرو نقاط النهاية المكوّنون بعد ذلك:

11. **SearXNG** -- `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (الترتيب 200)

الموفّرون الذين لا يحتاجون إلى مفتاح مثل **Parallel Search (Free)** و**DuckDuckGo** و
**Ollama Web Search** و**Codex Hosted Search** لا يتوفرون إلا عندما تختارهم
صراحةً باستخدام `tools.web.search.provider` أو عبر
`openclaw configure --section web`. لا يرسل OpenClaw استعلامات `web_search`
المُدارة إلى موفّر بلا مفتاح لمجرد عدم تكوين موفّر مدعوم بـ API.

نماذج OpenAI Responses هي استثناء: عندما لا يكون `tools.web.search.provider`
مُعيّنًا، تستخدم بحث الويب الأصلي في OpenAI بدلًا من الموفّرين المُدارين
أعلاه. عيّن `tools.web.search.provider` إلى `parallel-free` (أو موفّر آخر)
لتوجيهها عبر المسار المُدار.

<Note>
  تدعم كل حقول مفاتيح الموفّرين كائنات SecretRef. تُحل SecretRefs ذات النطاق
  الخاص بالـ Plugin تحت `plugins.entries.<plugin>.config.webSearch.apiKey` لموفّري
  بحث الويب المثبّتين والمدعومين بـ API، بما في ذلك Brave وExa وFirecrawl
  وGemini وGrok وKimi وMiniMax وParallel وPerplexity وTavily،
  سواء اختير الموفّر صراحةً عبر `tools.web.search.provider` أو اختير عبر
  الاكتشاف التلقائي. في وضع الاكتشاف التلقائي، لا يحل OpenClaw إلا مفتاح
  الموفّر المختار -- وتبقى SecretRefs غير المختارة غير نشطة، حتى تتمكن من
  إبقاء عدة موفّرين مكوّنين من دون دفع تكلفة الحل للموفّرين الذين لا تستخدمهم.
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

يوجد التكوين الخاص بالموفّر (مفاتيح API، وعناوين URL الأساسية، والأوضاع) تحت
`plugins.entries.<plugin>.config.webSearch.*`. ويمكن لـ Gemini أيضًا إعادة استخدام
`models.providers.google.apiKey` و`models.providers.google.baseUrl` كخيارات احتياطية
بأولوية أدنى بعد تكوين بحث الويب المخصص له و`GEMINI_API_KEY`. راجع
صفحات الموفّرين للاطلاع على أمثلة.
يمكن لـ Grok أيضًا إعادة استخدام ملف تعريف مصادقة xAI OAuth من `openclaw models auth login
--provider xai --method oauth`؛ ويبقى تكوين مفتاح API هو الخيار الاحتياطي.

يُتحقق من `tools.web.search.provider` مقابل معرّفات موفّري بحث الويب
المعلنة في بيانات manifest الخاصة بالـ Plugin المضمّنة والمثبّتة. يؤدي خطأ مطبعي مثل `"brvae"`
إلى فشل التحقق من التكوين بدلًا من الرجوع بصمت إلى الاكتشاف التلقائي. إذا كان
لموفّر مكوّن دليل Plugin قديم فقط، مثل كتلة
`plugins.entries.<plugin>` متبقية بعد إلغاء تثبيت Plugin تابع لجهة خارجية،
يحافظ OpenClaw على مرونة بدء التشغيل ويبلّغ عن تحذير حتى تتمكن من إعادة تثبيت
الـ Plugin أو تشغيل `openclaw doctor --fix` لتنظيف التكوين القديم.

اختيار موفّر `web_fetch` الاحتياطي منفصل:

- اختره باستخدام `tools.web.fetch.provider`
- أو احذف ذلك الحقل ودع OpenClaw يكتشف تلقائيًا أول موفّر web-fetch جاهز
  من بيانات الاعتماد المكوّنة
- يمكن لـ `web_fetch` غير المعزول استخدام موفّري Plugin المثبّتين الذين يعلنون
  `contracts.webFetchProviders`؛ وتسمح عمليات الجلب المعزولة بالموفّرين المضمّنين
  وتثبيتات Plugin الرسمية الموثّقة، لكنها تستبعد Plugins الخارجية التابعة لجهات خارجية
- يوفّر Plugin Firecrawl الرسمي خيار web-fetch الاحتياطي، ويُكوَّن تحت
  `plugins.entries.firecrawl.config.webFetch.*`

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا أن يطلب:

- منطقة Moonshot API (`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج بحث الويب الافتراضي لـ Kimi (الافتراضي هو `kimi-k2.6`)

بالنسبة إلى `x_search`، كوّن `plugins.entries.xai.config.xSearch.*`. يستخدم
ملف تعريف مصادقة xAI نفسه المستخدم للدردشة، أو اعتماد `XAI_API_KEY` / بحث الويب
الخاص بالـ Plugin المستخدم بواسطة بحث الويب في Grok.
يُرحَّل تكوين `tools.web.x_search.*` القديم تلقائيًا بواسطة `openclaw doctor --fix`.
عندما تختار Grok أثناء `openclaw onboard` أو `openclaw configure --section web`,
يمكن لـ OpenClaw أيضًا أن يعرض إعداد `x_search` اختياريًا باستخدام الاعتماد نفسه.
هذه خطوة متابعة منفصلة داخل مسار Grok، وليست خيار موفّر بحث ويب مستقلًا على
المستوى الأعلى. إذا اخترت موفّرًا آخر، فلن يعرض OpenClaw مطالبة `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="ملف التكوين">
    شغّل `openclaw configure --section web` أو عيّن المفتاح مباشرةً:

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

    بالنسبة إلى تثبيت Gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معاملات الأداة

| المعامل               | الوصف                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | استعلام البحث (مطلوب)                                 |
| `count`               | النتائج المطلوب إرجاعها (1-10، الافتراضي: 5)          |
| `country`             | رمز بلد ISO من حرفين (مثل "US"، "DE")                 |
| `language`            | رمز لغة ISO 639-1 (مثل "en"، "de")                    |
| `search_lang`         | رمز لغة البحث (Brave فقط)                             |
| `freshness`           | مرشح الوقت: `day`، أو `week`، أو `month`، أو `year`   |
| `date_after`          | النتائج بعد هذا التاريخ (YYYY-MM-DD)                  |
| `date_before`         | النتائج قبل هذا التاريخ (YYYY-MM-DD)                  |
| `ui_lang`             | رمز لغة واجهة المستخدم (Brave فقط)                    |
| `domain_filter`       | مصفوفة قائمة السماح/الحظر للنطاقات (Perplexity فقط)   |
| `max_tokens`          | إجمالي ميزانية المحتوى، الافتراضي 25000 (Perplexity فقط) |
| `max_tokens_per_page` | حد الرموز لكل صفحة، الافتراضي 2048 (Perplexity فقط)   |

<Warning>
  لا تعمل كل المعاملات مع كل الموفّرين. يرفض وضع Brave `llm-context`
  `ui_lang`؛ كما يحتاج `date_before` إلى `date_after` لأن نطاقات
  freshness المخصصة في Brave تتطلب تاريخي بداية ونهاية.
  تُرجع Gemini وGrok وKimi إجابة مركّبة واحدة مع اقتباسات. وهي
  تقبل `count` للتوافق مع الأداة المشتركة، لكنه لا يغيّر شكل الإجابة
  المؤسّسة على المصادر. تتعامل Gemini مع freshness بقيمة `day` كتلميح حداثة؛
  وتعيّن قيم freshness الأوسع والتواريخ الصريحة نطاقات زمنية لتأسيس Google Search.
  يتصرف Perplexity بالطريقة نفسها عند استخدام مسار توافق Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`).
  يقبل SearXNG `http://` فقط لمضيفي الشبكات الخاصة الموثوقة أو مضيفي loopback؛
  ويجب أن تستخدم نقاط نهاية SearXNG العامة `https://`.
  لا يدعم Firecrawl وTavily إلا `query` و`count` عبر `web_search`
  -- استخدم أدواتهما المخصصة للخيارات المتقدمة.
</Warning>

## x_search

تستعلم `x_search` منشورات X (Twitter سابقًا) باستخدام xAI وتُرجع
إجابات مركّبة بالذكاء الاصطناعي مع اقتباسات. تقبل استعلامات باللغة الطبيعية
ومرشحات منظمة اختيارية. لا يفعّل OpenClaw أداة xAI `x_search` المضمّنة
إلا في الطلب الذي يخدم استدعاء هذه الأداة.

<Note>
  توثّق xAI أن `x_search` تدعم البحث بالكلمات المفتاحية، والبحث الدلالي، وبحث المستخدمين،
  وجلب السلاسل. بالنسبة إلى إحصاءات التفاعل لكل منشور مثل إعادة النشر،
  والردود، والإشارات المرجعية، أو المشاهدات، فضّل بحثًا موجّهًا عن عنوان URL
  الدقيق للمنشور أو معرّف الحالة. قد تعثر عمليات البحث الواسعة بالكلمات
  المفتاحية على المنشور الصحيح لكنها تُرجع metadata أقل اكتمالًا لكل منشور.
  النمط الجيد هو: حدّد موقع المنشور أولًا، ثم شغّل استعلام `x_search` ثانيًا
  يركز على ذلك المنشور الدقيق.
</Note>

### تكوين x_search

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

تنشر `x_search` إلى `<baseUrl>/responses` عندما يكون
`plugins.entries.xai.config.xSearch.baseUrl` مُعيّنًا. إذا حُذف ذلك الحقل،
فإنها ترجع إلى `plugins.entries.xai.config.webSearch.baseUrl`، ثم
`tools.web.search.grok.baseUrl` القديم، وأخيرًا نقطة نهاية xAI العامة.

### معاملات x_search

| المعامل                     | الوصف                                                  |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | استعلام البحث (مطلوب)                                  |
| `allowed_x_handles`          | حصر النتائج في معرّفات X محددة                         |
| `excluded_x_handles`         | استبعاد معرّفات X محددة                                |
| `from_date`                  | تضمين المنشورات في هذا التاريخ أو بعده فقط (YYYY-MM-DD) |
| `to_date`                    | تضمين المنشورات في هذا التاريخ أو قبله فقط (YYYY-MM-DD) |
| `enable_image_understanding` | السماح لـ xAI بفحص الصور المرفقة بالمنشورات المطابقة   |
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
// إحصاءات لكل منشور: استخدم عنوان URL الدقيق للحالة أو معرّف الحالة عند الإمكان
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## أمثلة

```javascript
// بحث أساسي
await web_search({ query: "OpenClaw plugin SDK" });

// بحث مخصص لألمانيا
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// نتائج حديثة (الأسبوع الماضي)
await web_search({ query: "AI developments", freshness: "week" });

// نطاق زمني
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// ترشيح النطاقات (Perplexity فقط)
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
    // أو: allow: ["group:web"]  (يتضمن web_search وx_search وweb_fetch)
  },
}
```

## ذات صلة

- [Web Fetch](/ar/tools/web-fetch) -- جلب عنوان URL واستخراج محتوى قابل للقراءة
- [Web Browser](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع كثيفة استخدام JS
- [Grok Search](/ar/tools/grok-search) -- Grok بصفته موفّر `web_search`
- [Ollama Web Search](/ar/tools/ollama-search) -- بحث ويب دون مفتاح عبر مضيف Ollama لديك
