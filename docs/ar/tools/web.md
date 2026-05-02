---
read_when:
    - تريد تمكين web_search أو تكوينه
    - تريد تمكين x_search أو تكوينه
    - تحتاج إلى اختيار موفّر بحث
    - تريد فهم الكشف التلقائي والرجوع الاحتياطي إلى المزوّد
sidebarTitle: Web Search
summary: web_search و x_search و web_fetch -- البحث في الويب، أو البحث في منشورات X، أو جلب محتوى الصفحة
title: بحث الويب
x-i18n:
    generated_at: "2026-05-02T07:46:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: faa333a522a6690e92e8bd00c6096c84b386a97cbfeb508654929a409b39b8ef
    source_path: tools/web.md
    workflow: 16
---

تبحث أداة `web_search` في الويب باستخدام المزوّد الذي أعددته وتعيد
النتائج. تُخزَّن النتائج مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للتكوين).

يتضمن OpenClaw أيضًا `x_search` لمنشورات X (المعروف سابقًا باسم Twitter) و
`web_fetch` لجلب عناوين URL خفيف الوزن. في هذه المرحلة، يبقى `web_fetch`
محليًا بينما يمكن لـ `web_search` و `x_search` استخدام xAI Responses في الخلفية.

<Info>
  `web_search` أداة HTTP خفيفة الوزن، وليست أتمتة متصفح. للمواقع
  كثيفة JavaScript أو عمليات تسجيل الدخول، استخدم [متصفح الويب](/ar/tools/browser). ولجلب
  عنوان URL محدد، استخدم [Web Fetch](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="اختر مزوّدًا">
    اختر مزوّدًا وأكمل أي إعداد مطلوب. بعض المزوّدين لا يحتاجون إلى مفاتيح،
    بينما يستخدم آخرون مفاتيح API. راجع صفحات المزوّدين أدناه للحصول على
    التفاصيل.
  </Step>
  <Step title="كوّن">
    ```bash
    openclaw configure --section web
    ```
    يخزّن هذا المزوّد وأي بيانات اعتماد مطلوبة. يمكنك أيضًا تعيين متغير بيئة
    (مثل `BRAVE_API_KEY`) وتجاوز هذه الخطوة للمزوّدين المدعومين بواجهة API.
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
    نتائج منظّمة مع مقتطفات. يدعم وضع `llm-context` ومرشحات البلد/اللغة. تتوفر طبقة مجانية.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    بديل احتياطي بلا مفتاح. لا حاجة إلى مفتاح API. تكامل غير رسمي قائم على HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي + بحث بالكلمات المفتاحية مع استخراج المحتوى (تمييزات، نص، ملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظّمة. يعمل بأفضل شكل مع `firecrawl_search` و `firecrawl_scrape` للاستخراج العميق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مصاغة بالذكاء الاصطناعي مع اقتباسات عبر إسناد Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مصاغة بالذكاء الاصطناعي مع اقتباسات عبر إسناد ويب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مصاغة بالذكاء الاصطناعي مع اقتباسات عبر بحث الويب من Moonshot؛ تفشل بدائل المحادثة غير المسندة صراحةً.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظّمة عبر واجهة API للبحث في MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    بحث عبر مضيف Ollama محلي سجّل الدخول إليه أو واجهة API المستضافة من Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظّمة مع عناصر تحكم في استخراج المحتوى وتصفية النطاقات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    بحث تلوي مستضاف ذاتيًا. لا حاجة إلى مفتاح API. يجمع Google وBing وDuckDuckGo والمزيد.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظّمة مع عمق بحث وتصفية موضوعات و `tavily_extract` لاستخراج عناوين URL.
  </Card>
</CardGroup>

### مقارنة المزوّدين

| المزوّد                                  | نمط النتيجة                                                   | المرشحات                                          | مفتاح API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)              | مقتطفات منظّمة                                            | البلد، اللغة، الوقت، وضع `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/ar/tools/duckduckgo-search)    | مقتطفات منظّمة                                            | --                                               | لا يوجد (بلا مفتاح)                                                                         |
| [Exa](/ar/tools/exa-search)                  | منظّمة + مستخرجة                                         | الوضع العصبي/الكلمات المفتاحية، التاريخ، استخراج المحتوى    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ar/tools/firecrawl)             | مقتطفات منظّمة                                            | عبر أداة `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ar/tools/gemini-search)            | مصاغة بالذكاء الاصطناعي + اقتباسات                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ar/tools/grok-search)                | مصاغة بالذكاء الاصطناعي + اقتباسات                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/ar/tools/kimi-search)                | مصاغة بالذكاء الاصطناعي + اقتباسات؛ تفشل عند بدائل المحادثة غير المسندة | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ar/tools/minimax-search)   | مقتطفات منظّمة                                            | المنطقة (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ar/tools/ollama-search) | مقتطفات منظّمة                                            | --                                               | لا يوجد للمضيفين المحليين المسجل دخولهم؛ `OLLAMA_API_KEY` للبحث المباشر عبر `https://ollama.com` |
| [Perplexity](/ar/tools/perplexity-search)    | مقتطفات منظّمة                                            | البلد، اللغة، الوقت، النطاقات، حدود المحتوى | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ar/tools/searxng-search)          | مقتطفات منظّمة                                            | الفئات، اللغة                             | لا يوجد (مستضاف ذاتيًا)                                                                      |
| [Tavily](/ar/tools/tavily)                   | مقتطفات منظّمة                                            | عبر أداة `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## الاكتشاف التلقائي

## بحث الويب الأصلي من OpenAI

تستخدم نماذج OpenAI Responses المباشرة أداة `web_search` المستضافة لدى OpenAI تلقائيًا عندما يكون بحث الويب في OpenClaw مفعّلًا ولا يكون هناك مزوّد مُدار مثبّت. هذا سلوك يملكه المزوّد في Plugin OpenAI المضمّن، وينطبق فقط على حركة واجهة API الأصلية من OpenAI، وليس على عناوين URL الأساسية للوكلاء المتوافقين مع OpenAI أو مسارات Azure. عيّن `tools.web.search.provider` إلى مزوّد آخر مثل `brave` للإبقاء على أداة `web_search` المُدارة لنماذج OpenAI، أو عيّن `tools.web.search.enabled: false` لتعطيل كل من البحث المُدار وبحث OpenAI الأصلي.

## بحث الويب الأصلي في Codex

يمكن للنماذج القادرة على Codex اختياريًا استخدام أداة Responses الأصلية لدى المزوّد `web_search` بدلًا من دالة `web_search` المُدارة في OpenClaw.

- كوّنها ضمن `tools.web.search.openaiCodex`
- لا تُفعّل إلا للنماذج القادرة على Codex (`openai-codex/*` أو المزوّدين الذين يستخدمون `api: "openai-codex-responses"`)
- يظل `web_search` المُدار منطبقًا على النماذج غير الخاصة بـ Codex
- `mode: "cached"` هو الإعداد الافتراضي والموصى به
- يعطّل `tools.web.search.enabled: false` كلًا من البحث المُدار والبحث الأصلي

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

إذا كان بحث Codex الأصلي مفعّلًا لكن النموذج الحالي ليس قادرًا على Codex، يحافظ OpenClaw على سلوك `web_search` المُدار العادي.

## إعداد بحث الويب

قوائم المزوّدين في الوثائق وتدفقات الإعداد مرتبة أبجديًا. يحتفظ الاكتشاف التلقائي
بترتيب أولوية منفصل.

إذا لم يتم تعيين `provider`، يتحقق OpenClaw من المزوّدين بهذا الترتيب ويستخدم
أول مزوّد جاهز:

المزوّدون المدعومون بواجهات API أولًا:

1. **Brave** -- `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey` (الترتيب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey` (الترتيب 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`، أو `GEMINI_API_KEY`، أو `models.providers.google.apiKey` (الترتيب 20)
4. **Grok** -- `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey` (الترتيب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey` (الترتيب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey` (الترتيب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey` (الترتيب 60)
8. **Exa** -- `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey`؛ يتجاوز `plugins.entries.exa.config.webSearch.baseUrl` الاختياري نقطة نهاية Exa (الترتيب 65)
9. **Tavily** -- `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey` (الترتيب 70)

البدائل الاحتياطية بلا مفاتيح بعد ذلك:

10. **DuckDuckGo** -- بديل HTML احتياطي بلا مفتاح، من دون حساب أو مفتاح API (الترتيب 100)
11. **Ollama Web Search** -- بديل احتياطي بلا مفتاح عبر مضيف Ollama المحلي الذي أعددته عندما يكون قابلًا للوصول ومسجل الدخول باستخدام `ollama signin`؛ يمكنه إعادة استخدام مصادقة حامل مزوّد Ollama عندما يحتاجها المضيف، ويمكنه استدعاء بحث `https://ollama.com` المباشر عند تكوينه باستخدام `OLLAMA_API_KEY` (الترتيب 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (الترتيب 200)

إذا لم يتم اكتشاف أي مزوّد، فسيعود إلى Brave (ستحصل على خطأ مفتاح مفقود
يطالبك بتكوين واحد).

<Note>
  تدعم جميع حقول مفاتيح المزوّد كائنات SecretRef. تُحل SecretRefs ذات نطاق Plugin
  ضمن `plugins.entries.<plugin>.config.webSearch.apiKey` لمزوّدي بحث الويب المدعومين
  بواجهات API المضمّنين، بما في ذلك Brave وExa وFirecrawl
  وGemini وGrok وKimi وMiniMax وPerplexity وTavily،
  سواء تم اختيار المزوّد صراحة عبر `tools.web.search.provider` أو
  اختير من خلال الاكتشاف التلقائي. في وضع الاكتشاف التلقائي، لا يحل OpenClaw إلا
  مفتاح المزوّد المحدد -- تبقى SecretRefs غير المحددة غير نشطة، بحيث يمكنك
  إبقاء عدة مزوّدين مكوّنين من دون دفع تكلفة الحل للمزوّدين
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

يعيش التكوين الخاص بالمزوّد (مفاتيح API، وعناوين URL الأساسية، والأوضاع) ضمن
`plugins.entries.<plugin>.config.webSearch.*`. يمكن لـ Gemini أيضًا إعادة استخدام
`models.providers.google.apiKey` و `models.providers.google.baseUrl` كبدائل ذات أولوية أقل
بعد تكوين بحث الويب المخصص له و `GEMINI_API_KEY`. راجع
صفحات المزوّدين للاطلاع على أمثلة.

`tools.web.search.provider` يتم التحقق منه مقابل معرّفات مزودي بحث الويب
المعلنة في بيانات Plugin المضمنة والمثبتة. خطأ مطبعي مثل `"brvae"`
يفشل في التحقق من صحة الإعدادات بدلا من الرجوع بصمت إلى الاكتشاف التلقائي. إذا كان لدى
مزود مهيأ دليل Plugin قديم فقط، مثل كتلة متبقية
`plugins.entries.<plugin>` بعد إلغاء تثبيت Plugin تابع لجهة خارجية،
يحافظ OpenClaw على مرونة بدء التشغيل ويبلغ عن تحذير حتى تتمكن من إعادة تثبيت
Plugin أو تشغيل `openclaw doctor --fix` لتنظيف الإعداد القديم.

اختيار مزود الرجوع الاحتياطي لـ `web_fetch` منفصل:

- اختره باستخدام `tools.web.fetch.provider`
- أو احذف ذلك الحقل واترك OpenClaw يكتشف تلقائيا أول مزود web-fetch
  جاهز من بيانات الاعتماد المتاحة
- يمكن لـ `web_fetch` غير المعزول استخدام مزودي Plugin المثبتين الذين يعلنون
  `contracts.webFetchProviders`؛ أما عمليات الجلب المعزولة فتبقى مقتصرة على المضمنة فقط
- اليوم مزود web-fetch المضمن هو Firecrawl، ومهيأ ضمن
  `plugins.entries.firecrawl.config.webFetch.*`

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضا أن يطلب:

- منطقة Moonshot API (`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج بحث الويب الافتراضي لـ Kimi (القيمة الافتراضية `kimi-k2.6`)

بالنسبة إلى `x_search`، هيئ `plugins.entries.xai.config.xSearch.*`. يستخدم
نفس رجوع `XAI_API_KEY` الاحتياطي مثل بحث ويب Grok.
تتم ترحيل إعدادات `tools.web.x_search.*` القديمة تلقائيا بواسطة `openclaw doctor --fix`.
عندما تختار Grok أثناء `openclaw onboard` أو `openclaw configure --section web`،
يمكن لـ OpenClaw أيضا عرض إعداد اختياري لـ `x_search` باستخدام المفتاح نفسه.
هذه خطوة متابعة منفصلة داخل مسار Grok، وليست خيار مزود بحث ويب
مستقلا على المستوى الأعلى. إذا اخترت مزودا آخر، فلن يعرض OpenClaw
مطالبة `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="ملف الإعدادات">
    شغل `openclaw configure --section web` أو عيّن المفتاح مباشرة:

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
    عيّن متغير بيئة المزود في بيئة عملية Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    لتثبيت gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معلمات الأداة

| المعلمة               | الوصف                                                 |
| --------------------- | ----------------------------------------------------- |
| `query`               | استعلام البحث (مطلوب)                                |
| `count`               | النتائج المطلوب إرجاعها (1-10، الافتراضي: 5)         |
| `country`             | رمز بلد ISO من حرفين (مثل "US"، "DE")                |
| `language`            | رمز لغة ISO 639-1 (مثل "en"، "de")                   |
| `search_lang`         | رمز لغة البحث (Brave فقط)                            |
| `freshness`           | مرشح الوقت: `day` أو `week` أو `month` أو `year`     |
| `date_after`          | النتائج بعد هذا التاريخ (YYYY-MM-DD)                 |
| `date_before`         | النتائج قبل هذا التاريخ (YYYY-MM-DD)                 |
| `ui_lang`             | رمز لغة واجهة المستخدم (Brave فقط)                   |
| `domain_filter`       | مصفوفة سماح/حظر للنطاقات (Perplexity فقط)            |
| `max_tokens`          | ميزانية المحتوى الإجمالية، الافتراضي 25000 (Perplexity فقط) |
| `max_tokens_per_page` | حد الرموز لكل صفحة، الافتراضي 2048 (Perplexity فقط)  |

<Warning>
  لا تعمل كل المعلمات مع كل المزودين. يرفض وضع Brave `llm-context`
  `ui_lang`؛ ويتطلب `date_before` أيضا `date_after` لأن نطاقات
  freshness المخصصة في Brave تتطلب تاريخي بداية ونهاية معا.
  يعيد Gemini وGrok وKimi إجابة واحدة مركبة مع استشهادات. وهي
  تقبل `count` للتوافق مع الأداة المشتركة، لكنه لا يغير شكل الإجابة
  المؤرضة. يدعم Gemini `freshness` و`date_after` و
  `date_before` عبر تحويلها إلى نطاقات زمنية لتأريض Google Search.
  يتصرف Perplexity بالطريقة نفسها عند استخدام مسار توافق Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`).
  يقبل SearXNG `http://` فقط لمضيفي الشبكة الخاصة الموثوقين أو local loopback؛
  يجب أن تستخدم نقاط نهاية SearXNG العامة `https://`.
  يدعم Firecrawl وTavily فقط `query` و`count` عبر `web_search`
  -- استخدم أدواتهما المخصصة للخيارات المتقدمة.
</Warning>

## x_search

يستعلم `x_search` منشورات X (تويتر سابقا) باستخدام xAI ويعيد
إجابات مولدة بالذكاء الاصطناعي مع استشهادات. يقبل استعلامات باللغة الطبيعية و
مرشحات منظمة اختيارية. يفعّل OpenClaw أداة xAI `x_search` المضمنة فقط
في الطلب الذي يخدم استدعاء هذه الأداة.

<Note>
  توثق xAI أن `x_search` يدعم البحث بالكلمات المفتاحية، والبحث الدلالي، وبحث المستخدم،
  وجلب السلاسل. لإحصاءات التفاعل لكل منشور مثل إعادة النشر،
  والردود، والإشارات المرجعية، أو المشاهدات، فضّل بحثا موجها عن رابط المنشور الدقيق
  أو معرّف الحالة. قد تعثر عمليات البحث الواسعة بالكلمات المفتاحية على المنشور الصحيح لكنها تعيد
  بيانات وصفية أقل اكتمالا لكل منشور. نمط جيد هو: حدد المنشور أولا، ثم
  شغل استعلام `x_search` ثانيا يركز على ذلك المنشور تحديدا.
</Note>

### إعدادات x_search

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

يرسل `x_search` إلى `<baseUrl>/responses` عندما يكون
`plugins.entries.xai.config.xSearch.baseUrl` معينا. إذا تم حذف ذلك الحقل،
فإنه يرجع إلى `plugins.entries.xai.config.webSearch.baseUrl`، ثم
`tools.web.search.grok.baseUrl` القديم، وأخيرا نقطة نهاية xAI العامة.

### معلمات x_search

| المعلمة                     | الوصف                                                 |
| ---------------------------- | ---------------------------------------------------- |
| `query`                      | استعلام البحث (مطلوب)                               |
| `allowed_x_handles`          | حصر النتائج في معرفات X محددة                       |
| `excluded_x_handles`         | استبعاد معرفات X محددة                              |
| `from_date`                  | تضمين المنشورات في هذا التاريخ أو بعده فقط (YYYY-MM-DD) |
| `to_date`                    | تضمين المنشورات في هذا التاريخ أو قبله فقط (YYYY-MM-DD) |
| `enable_image_understanding` | السماح لـ xAI بفحص الصور المرفقة بالمنشورات المطابقة |
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

- [Web Fetch](/ar/tools/web-fetch) -- جلب URL واستخراج محتوى قابل للقراءة
- [Web Browser](/ar/tools/browser) -- أتمتة كاملة للمتصفح للمواقع كثيفة JS
- [Grok Search](/ar/tools/grok-search) -- Grok بصفته مزود `web_search`
- [Ollama Web Search](/ar/tools/ollama-search) -- بحث ويب دون مفتاح عبر مضيف Ollama الخاص بك
