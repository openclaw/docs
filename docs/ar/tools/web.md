---
read_when:
    - تريد تمكين `web_search` أو تهيئته
    - تريد تمكين `x_search` أو تهيئته
    - تحتاج إلى اختيار مزوّد بحث
    - تريد فهم الاكتشاف التلقائي واختيار المزوّد
sidebarTitle: Web Search
summary: web_search وx_search وweb_fetch -- البحث في الويب، أو البحث في منشورات X، أو جلب محتوى الصفحة
title: البحث على الويب
x-i18n:
    generated_at: "2026-07-12T06:39:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

تبحث `web_search` في الويب باستخدام المزوّد الذي أعددته، وتُرجع
نتائج موحّدة تُخزَّن مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للتهيئة). تتضمن OpenClaw
أيضًا `x_search` لمنشورات X (تويتر سابقًا)، و`web_fetch` لجلب
عناوين URL بشكل خفيف. تعمل `web_fetch` دائمًا محليًا؛ بينما تُوجِّه `web_search`
الطلبات عبر xAI Responses عندما يكون Grok هو المزوّد، وتستخدم `x_search`
دائمًا xAI Responses.

<Info>
  تُعد `web_search` أداة HTTP خفيفة وليست أتمتة للمتصفح. بالنسبة إلى
  المواقع التي تعتمد بكثافة على JavaScript أو تتطلب تسجيل الدخول، استخدم [متصفح الويب](/ar/tools/browser). ولجلب
  عنوان URL محدد، استخدم [جلب الويب](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="اختيار مزوّد">
    اختر مزوّدًا وأكمل أي إعداد مطلوب. لا يحتاج بعض المزوّدين
    إلى مفتاح، بينما يحتاج آخرون إلى مفتاح API. راجع صفحات المزوّدين أدناه للاطلاع على
    التفاصيل.
  </Step>
  <Step title="التهيئة">
    ```bash
    openclaw configure --section web
    ```
    يحفظ هذا المزوّد وأي بيانات اعتماد مطلوبة. بالنسبة إلى المزوّدين المدعومين
    بواجهة API، يمكنك بدلًا من ذلك ضبط متغير البيئة الخاص بالمزوّد (على سبيل المثال
    `BRAVE_API_KEY`) وتخطي هذه الخطوة.
  </Step>
  <Step title="الاستخدام">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    لمنشورات X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## اختيار مزوّد

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ar/tools/brave-search">
    نتائج منظّمة مع مقتطفات. يدعم وضع `llm-context` ومرشحات البلد واللغة. تتوفر فئة مجانية.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/ar/plugins/codex-harness">
    إجابات مركّبة بالذكاء الاصطناعي ومرتكزة إلى المصادر عبر حساب خادم تطبيق Codex الخاص بك.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    مزوّد لا يحتاج إلى مفتاح. لا يلزم مفتاح API. تكامل غير رسمي قائم على HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي وبالكلمات المفتاحية مع استخراج المحتوى (الأجزاء البارزة والنص والملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظّمة. يُفضّل إقرانه مع `firecrawl_search` و`firecrawl_scrape` للاستخراج المتعمق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مركّبة بالذكاء الاصطناعي مع استشهادات عبر الإسناد إلى بحث Google.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مركّبة بالذكاء الاصطناعي مع استشهادات عبر الإسناد إلى ويب xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مركّبة بالذكاء الاصطناعي مع استشهادات عبر بحث الويب من Moonshot؛ تفشل بدائل الدردشة غير المرتكزة إلى مصادر بشكل صريح.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظّمة عبر واجهة API للبحث في خطة رموز MiniMax.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    البحث عبر مضيف Ollama محلي مسجّل الدخول أو واجهة API المستضافة من Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/ar/tools/parallel-search">
    واجهة Parallel Search API مدفوعة (`PARALLEL_API_KEY`)؛ حدود معدلات أعلى وضبط للأهداف.
  </Card>
  <Card title="Parallel Search (مجاني)" icon="layer-group" href="/ar/tools/parallel-search">
    اشتراك اختياري بلا مفتاح. Search MCP المجاني من Parallel، مع مقتطفات كثيفة محسّنة للنماذج اللغوية الكبيرة ومن دون مفتاح API.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظّمة مع عناصر تحكم في استخراج المحتوى وتصفية النطاقات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    محرك بحث تجميعي مستضاف ذاتيًا. لا يلزم مفتاح API. يجمع نتائج Google وBing وDuckDuckGo وغيرها.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظّمة مع عمق البحث وتصفية الموضوعات و`tavily_extract` لاستخراج عناوين URL.
  </Card>
</CardGroup>

### مقارنة المزوّدين

| المزوّد                                         | نمط النتائج                                                   | المرشحات                                          | مفتاح API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)                     | مقتطفات منظّمة                                            | البلد واللغة والوقت ووضع `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/ar/plugins/codex-harness)    | مركّبة بالذكاء الاصطناعي + عناوين URL للمصادر                                   | النطاقات وحجم السياق وموقع المستخدم             | لا يوجد؛ يستخدم تسجيل الدخول إلى Codex/OpenAI                                                         |
| [DuckDuckGo](/ar/tools/duckduckgo-search)           | مقتطفات منظّمة                                            | --                                               | لا يوجد (بلا مفتاح)                                                                         |
| [Exa](/ar/tools/exa-search)                         | منظّمة + مستخرجة                                         | الوضع العصبي/وضع الكلمات المفتاحية والتاريخ واستخراج المحتوى    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ar/tools/firecrawl)                    | مقتطفات منظّمة                                            | عبر أداة `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ar/tools/gemini-search)                   | مركّبة بالذكاء الاصطناعي + استشهادات                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ar/tools/grok-search)                       | مركّبة بالذكاء الاصطناعي + استشهادات                                     | --                                               | xAI OAuth أو `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/ar/tools/kimi-search)                       | مركّبة بالذكاء الاصطناعي + استشهادات؛ تفشل عند استخدام بدائل دردشة غير مرتكزة إلى مصادر | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ar/tools/minimax-search)          | مقتطفات منظّمة                                            | المنطقة (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ar/tools/ollama-search)        | مقتطفات منظّمة                                            | --                                               | لا يوجد للمضيفين المحليين المسجّل دخولهم؛ `OLLAMA_API_KEY` للبحث المباشر عبر `https://ollama.com` |
| [Parallel](/ar/tools/parallel-search)               | مقتطفات كثيفة مرتبة لتناسب سياق النماذج اللغوية الكبيرة                          | --                                               | `PARALLEL_API_KEY` (مدفوع)                                                               |
| [Parallel Search (مجاني)](/ar/tools/parallel-search) | مقتطفات كثيفة مرتبة لتناسب سياق النماذج اللغوية الكبيرة                          | --                                               | لا يوجد (Search MCP مجاني)                                                                  |
| [Perplexity](/ar/tools/perplexity-search)           | مقتطفات منظّمة                                            | البلد واللغة والوقت والنطاقات وحدود المحتوى | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ar/tools/searxng-search)                 | مقتطفات منظّمة                                            | الفئات واللغة                             | لا يوجد (مستضاف ذاتيًا)                                                                      |
| [Tavily](/ar/tools/tavily)                          | مقتطفات منظّمة                                            | عبر أداة `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## الاكتشاف التلقائي

تُرتَّب قوائم المزوّدين في الوثائق ومسارات الإعداد أبجديًا. يستخدم الاكتشاف التلقائي
ترتيب أسبقية منفصلًا وثابتًا، ولا يختار إلا مزوّدًا يحتاج إلى
بيانات اعتماد (`requiresCredential !== false`) عند العثور على بيانات اعتماده مُهيأة. إذا
لم تُضبط قيمة `provider`، تتحقق OpenClaw من المزوّدين بهذا الترتيب وتستخدم
أول مزوّد جاهز:

المزوّدون المدعومون بواجهة API أولًا:

1. **Brave** -- `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey` (الترتيب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey` (الترتيب 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey` أو `GEMINI_API_KEY` أو `models.providers.google.apiKey` (الترتيب 20)
4. **Grok** -- xAI OAuth أو `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey` (الترتيب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey` (الترتيب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey` (الترتيب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey` (الترتيب 60)
8. **Exa** -- `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey`؛ تتجاوز القيمة الاختيارية `plugins.entries.exa.config.webSearch.baseUrl` نقطة نهاية Exa (الترتيب 65)
9. **Tavily** -- `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey` (الترتيب 70)
10. **Parallel** -- واجهة Parallel Search API المدفوعة عبر `PARALLEL_API_KEY` أو `plugins.entries.parallel.config.webSearch.apiKey`؛ تتجاوز القيمة الاختيارية `plugins.entries.parallel.config.webSearch.baseUrl` نقطة النهاية (الترتيب 75)

مزوّدو نقاط النهاية المُهيأة بعد ذلك:

11. **SearXNG** -- `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (الترتيب 200)

لا يفوز المزوّدون الذين لا يحتاجون إلى مفتاح، مثل **Parallel Search (مجاني)** و**DuckDuckGo**
و**Ollama Web Search** و**Codex Hosted Search**، بالاكتشاف التلقائي
مطلقًا، رغم امتلاكهم قيمة ترتيب داخلية. لا يُستخدمون إلا عندما
تختارهم صراحةً عبر `tools.web.search.provider` أو من خلال
`openclaw configure --section web`. لا ترسل OpenClaw استعلامات
`web_search` المُدارة إلى مزوّد بلا مفتاح لمجرد عدم تهيئة
مزوّد مدعوم بواجهة API.

تُعد نماذج OpenAI Responses استثناءً: عندما تكون
`tools.web.search.provider` غير مضبوطة، تستخدم بحث الويب الأصلي من OpenAI بدلًا من
المزوّدين المُدارين أعلاه (انظر أدناه). اضبط `tools.web.search.provider` على
`parallel-free` (أو مزوّد آخر) لتوجيهها عبر المسار المُدار
بدلًا من ذلك.

<Note>
  تدعم جميع حقول مفاتيح المزوّدين كائنات SecretRef. تُحل مراجع SecretRef
  الخاصة بنطاق Plugin ضمن `plugins.entries.<plugin>.config.webSearch.apiKey` لصالح
  مزوّدي بحث الويب المثبّتين والمدعومين بواجهة API، بما في ذلك Brave وExa وFirecrawl
  وGemini وGrok وKimi وMiniMax وParallel وPerplexity وTavily،
  سواء اختير المزوّد صراحةً عبر `tools.web.search.provider` أو
  عبر الاكتشاف التلقائي. في وضع الاكتشاف التلقائي، تحل OpenClaw مفتاح
  المزوّد المحدد فقط؛ وتظل مراجع SecretRef غير المحددة غير نشطة، لذا يمكنك
  إبقاء عدة مزوّدين مُهيئين من دون دفع تكلفة حلّ المراجع للمزوّدين
  الذين لا تستخدمهم.
</Note>

## بحث الويب الأصلي من OpenAI

تستخدم نماذج OpenAI Responses المباشرة (`api: "openai-responses"`، والموفّر `openai`،
من دون عنوان URL أساسي أو مع عنوان URL أساسي رسمي لـ OpenAI API) أداة
`web_search` المستضافة من OpenAI تلقائيًا عند تمكين بحث الويب في OpenClaw وعدم
تثبيت موفّر مُدار. هذا سلوك يملكه الموفّر في Plugin ‏OpenAI المضمّن، ولا ينطبق
على عناوين URL الأساسية للوكلاء المتوافقين مع OpenAI أو مسارات Azure. اضبط
`tools.web.search.provider` على موفّر آخر مثل `brave` للاحتفاظ بأداة
`web_search` المُدارة لنماذج OpenAI، أو اضبط
`tools.web.search.enabled: false` لتعطيل كلٍ من البحث المُدار والبحث الأصلي
من OpenAI.

## بحث الويب الأصلي في Codex

تستخدم بيئة تشغيل خادم تطبيق Codex أداة `web_search` المستضافة من Codex تلقائيًا
عند تمكين بحث الويب وعدم تحديد موفّر مُدار. البحث الأصلي المستضاف وأداة
`web_search` الديناميكية المُدارة من OpenClaw متنافيان، لذا لا يمكن للبحث
المُدار تجاوز قيود النطاقات الأصلية. يستخدم OpenClaw الأداة المُدارة عندما لا
يتوفر البحث المستضاف، أو يكون معطّلًا صراحةً، أو يُستبدل بموفّر مُدار محدد.
يبقي OpenClaw إضافة `web.run` المستقلة في Codex معطّلة
(`features.standalone_web_search: false`) لأن حركة مرور خادم التطبيق في
الإنتاج ترفض نطاق `web` المعرّف من المستخدم.

- اضبط البحث الأصلي ضمن `tools.web.search.openaiCodex`
- اضبط `tools.web.search.provider: "codex"` لتوفير البحث المستضاف من Codex
  بوصفه موفّر `web_search` المُدار لأي نموذج أصل. يشغّل كل استدعاء دورة مؤقتة
  محدودة لخادم تطبيق Codex ويفشل إذا لم يُصدر Codex عنصر `webSearch` مستضافًا.
- `mode: "cached"` هو التفضيل الافتراضي، لكن Codex يحوّله إلى وصول خارجي مباشر
  لدورات خادم التطبيق غير المقيّدة؛ اضبطه على `"live"` لطلب الوصول المباشر
  صراحةً
- اضبط `tools.web.search.provider` على موفّر مُدار مثل `brave` لاستخدام
  `web_search` المُدار من OpenClaw بدلًا منه
- اضبط `tools.web.search.openaiCodex.enabled: false` لإلغاء الاشتراك في البحث
  المستضاف من Codex؛ تظل الموفّرات المُدارة الأخرى متاحة
- يتيح تقييد سطح أدوات Codex الأصلي أيضًا استمرار توفر `web_search` المُدار
- عند ضبط `allowedDomains`، يفشل الرجوع التلقائي إلى البحث المُدار بحالة مغلقة
  إذا لم يتوفر البحث المستضاف، كي لا يمكن تجاوز قائمة السماح الأصلية
- تعطّل عمليات التشغيل المعتمدة على LLM فقط مع تعطيل الأدوات كلًا من البحث
  الأصلي والمُدار
- يعطّل `tools.web.search.enabled: false` كلًا من البحث المُدار والأصلي

تبدأ تغييرات سياسة بحث Codex الفعلية الدائمة سلسلة مرتبطة جديدة، بحيث لا يمكن
لسلسلة خادم تطبيق محمّلة مسبقًا الاحتفاظ بوصول قديم إلى البحث المستضاف.
تستخدم القيود المؤقتة لكل دورة سلسلة مقيّدة مؤقتة وتحافظ على الارتباط الحالي
لاستئنافه لاحقًا.

يمكن لحركة مرور OpenAI ChatGPT Responses المباشرة أيضًا استخدام أداة
`web_search` المستضافة من OpenAI. يظل هذا المسار المنفصل اختياريًا عبر
`tools.web.search.openaiCodex.enabled: true`، ولا ينطبق إلا على نماذج
`openai/*` المؤهلة التي تستخدم `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // اختياري: استخدم البحث المستضاف من Codex من نماذج أصل غير تابعة لـ Codex أيضًا.
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

بالنسبة إلى بيئات التشغيل والموفّرين الذين لا يدعمون بحث Codex الأصلي، يمكن
لـ Codex استخدام الرجوع إلى `web_search` المُدار عبر نطاق الأدوات الديناميكي
في OpenClaw. استخدم موفّرًا مُدارًا صريحًا عندما تحتاج إلى عناصر تحكم الشبكة
الخاصة بالموفّر في OpenClaw بدلًا من البحث المستضاف من Codex.

يؤدي تحديد `provider: "codex"` إلى تمكين Plugin ‏`codex` المضمّن واستخدام قيود
`tools.web.search.openaiCodex` نفسها الموضحة أعلاه. صادِق خادم تطبيق Codex
أولًا باستخدام `openclaw models auth login --provider openai`.
يمكن للوكيل الأصل استخدام أي نموذج أو بيئة تشغيل؛ ولا يعمل عبر Codex سوى عامل
البحث المحدود.

## أمان الشبكة

تستخدم استدعاءات موفّري `web_search` المُدارة عبر HTTP مسار الجلب المحمي في
OpenClaw، ويقتصر نطاقها على اسم المضيف الخاص بالموفّر الحالي. بالنسبة إلى اسم
المضيف هذا فقط، يسمح OpenClaw بإجابات DNS لعناوين IP الوهمية من Surge وClash
وsing-box ضمن `198.18.0.0/15` و`fc00::/7`. تظل الوجهات الخاصة الأخرى ووجهات
local loopback والوجهات المحلية للرابط ووجهات بيانات التعريف محظورة. يُعد
البحث المستضاف من Codex الاستثناء: إذ يفوّض عامله المحدود الوصول إلى الشبكة
إلى أداة `web_search` المستضافة في خادم تطبيق Codex.

لا ينطبق هذا السماح التلقائي على عناوين URL عشوائية في `web_fetch`. بالنسبة إلى
`web_fetch`، مكّن `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange`
و`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` صراحةً فقط عندما يكون
الوكيل الموثوق لديك مالكًا لتلك النطاقات الاصطناعية.

## الإعداد

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // الافتراضي: true
        provider: "brave", // أو احذفه للاكتشاف التلقائي
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

يوجد الإعداد الخاص بكل موفّر، بما في ذلك مفاتيح API وعناوين URL الأساسية
والأوضاع، ضمن `plugins.entries.<plugin>.config.webSearch.*`. يمكن لـ Gemini
أيضًا إعادة استخدام `models.providers.google.apiKey` و
`models.providers.google.baseUrl` كخيارات رجوع ذات أولوية أقل بعد إعداد بحث
الويب المخصص له و`GEMINI_API_KEY`. راجع صفحات الموفّرين للاطلاع على أمثلة.
يمكن لـ Grok أيضًا إعادة استخدام ملف تعريف مصادقة OAuth لـ xAI من
`openclaw models auth login --provider xai --method oauth`؛ ويظل إعداد مفتاح
API خيار الرجوع.

يُتحقق من `tools.web.search.provider` مقابل معرّفات موفّري بحث الويب المعلنة
في بيانات Plugins المضمّنة والمثبتة. يؤدي خطأ إملائي مثل `"brvae"` إلى فشل
التحقق من الإعداد بدلًا من الرجوع بصمت إلى الاكتشاف التلقائي. إذا لم يكن لدى
موفّر مضبوط سوى دليل قديم على Plugin، مثل كتلة
`plugins.entries.<plugin>` متبقية بعد إلغاء تثبيت Plugin تابع لجهة خارجية،
يحافظ OpenClaw على مرونة بدء التشغيل ويبلّغ عن تحذير حتى تتمكن من إعادة تثبيت
Plugin أو تشغيل `openclaw doctor --fix` لتنظيف الإعداد القديم.

يكون تحديد موفّر الرجوع لـ `web_fetch` منفصلًا:

- اختره باستخدام `tools.web.fetch.provider`
- أو احذف هذا الحقل ودع OpenClaw يكتشف تلقائيًا أول موفّر جاهز لجلب الويب من
  بيانات الاعتماد المضبوطة
- يمكن لـ `web_fetch` غير المعزول استخدام موفّري Plugins المثبتة الذين يعلنون
  `contracts.webFetchProviders`؛ وتسمح عمليات الجلب المعزولة بالموفّرين
  المضمّنين وعمليات تثبيت Plugins الرسمية المتحقق منها، لكنها تستبعد Plugins
  الخارجية التابعة لجهات خارجية
- يُعد Plugin ‏Firecrawl الرسمي المساهم المضمّن الوحيد في
  `webFetchProviders` حاليًا، ويُضبط ضمن
  `plugins.entries.firecrawl.config.webFetch.*`

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا أن يطلب:

- منطقة Moonshot API ‏(`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج بحث الويب الافتراضي لـ Kimi (افتراضيًا `kimi-k2.6`)

بالنسبة إلى `x_search`، اضبط `plugins.entries.xai.config.xSearch.*`. يستخدم
ملف تعريف مصادقة xAI نفسه المستخدم للدردشة، أو `XAI_API_KEY` / بيانات اعتماد
بحث الويب الخاصة بـ Plugin والمستخدمة في بحث الويب عبر Grok.
يُرحّل الإعداد القديم `tools.web.x_search.*` تلقائيًا بواسطة
`openclaw doctor --fix`.
عندما تختار Grok أثناء `openclaw onboard` أو
`openclaw configure --section web`، يقدّم OpenClaw أيضًا إعداد `x_search`
اختياريًا باستخدام بيانات الاعتماد نفسها فور اكتمال إعداد Grok. هذه خطوة
متابعة منفصلة داخل مسار Grok، وليست خيارًا منفصلًا لموفّر بحث الويب من المستوى
الأعلى. إذا اخترت موفّرًا آخر، فلن يعرض OpenClaw مطالبة `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="ملف الإعداد">
    شغّل `openclaw configure --section web` أو اضبط المفتاح مباشرةً:

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

    بالنسبة إلى تثبيت Gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معاملات الأداة

| المعامل               | الوصف                                                               |
| --------------------- | ------------------------------------------------------------------- |
| `query`               | استعلام البحث (مطلوب)                                               |
| `count`               | عدد النتائج المراد إرجاعها (1-10، الافتراضي: 5)                    |
| `country`             | رمز البلد وفق ISO المكوّن من حرفين (مثل "US" و"DE")                 |
| `language`            | رمز اللغة وفق ISO 639-1 (مثل "en" و"de")                            |
| `search_lang`         | رمز لغة البحث (Brave فقط)                                           |
| `freshness`           | مرشح زمني: `day` أو `week` أو `month` أو `year`                     |
| `date_after`          | النتائج اللاحقة لهذا التاريخ (YYYY-MM-DD)                           |
| `date_before`         | النتائج السابقة لهذا التاريخ (YYYY-MM-DD)                           |
| `ui_lang`             | رمز لغة واجهة المستخدم (Brave فقط)                                  |
| `domain_filter`       | مصفوفة السماح بالنطاقات/حظرها (Perplexity فقط)                      |
| `max_tokens`          | إجمالي ميزانية رموز المحتوى، لواجهة Perplexity Search API الأصلية فقط |
| `max_tokens_per_page` | حد رموز الاستخراج لكل صفحة، لواجهة Perplexity Search API الأصلية فقط |

<Warning>
  لا تعمل جميع المعاملات مع جميع الموفّرين. يرفض وضع `llm-context` في Brave
  المعامل `ui_lang`؛ ويتطلب `date_before` أيضًا `date_after` لأن نطاقات الحداثة
  المخصصة في Brave تتطلب تاريخي البدء والانتهاء.
  يعيد Gemini وGrok وKimi إجابة مركبة واحدة مع استشهادات. تقبل هذه الموفّرات
  `count` للتوافق مع الأداة المشتركة، لكنه لا يغيّر بنية الإجابة المستندة إلى
  المصادر. يعامل Gemini حداثة `day` كتلميح للأولوية الزمنية؛ بينما تضبط قيم
  الحداثة الأوسع والتواريخ الصريحة النطاقات الزمنية للاستناد إلى Google Search.
  يتصرف Perplexity بالطريقة نفسها عند استخدام مسار توافق Sonar/OpenRouter
  ‏(`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`)؛ كما يلغي ذلك المسار دعم `max_tokens`
  و`max_tokens_per_page`.
  يقبل SearXNG بروتوكول `http://` فقط لمضيفي الشبكات الخاصة الموثوقين أو مضيفي
  local loopback؛ ويجب أن تستخدم نقاط نهاية SearXNG العامة `https://`.
  لا يدعم Firecrawl وTavily سوى `query` و`count` عبر `web_search`
  -- استخدم أدواتهما المخصصة للخيارات المتقدمة.
</Warning>

## x_search

يستعلم `x_search` عن منشورات X ‏(Twitter سابقًا) باستخدام xAI ويعيد إجابات
مركبة بالذكاء الاصطناعي مع استشهادات. يقبل استعلامات باللغة الطبيعية ومرشحات
منظمة اختيارية. ينشئ OpenClaw أداة `x_search` المضمّنة في xAI لكل طلب بدلًا
من إبقائها مسجلة بصورة دائمة، ولذلك لا تكون نشطة إلا في الدورة التي تستدعيها
فعليًا.

<Warning>
  يعمل `x_search` على خوادم xAI. تفرض xAI رسومًا قدرها 5 دولارات لكل 1,000
  استدعاء للأداة، بالإضافة إلى رموز إدخال النموذج وإخراجه.
</Warning>

<Note>
  توثّق xAI أن `x_search` يدعم البحث بالكلمات المفتاحية والبحث الدلالي والبحث
  عن المستخدمين وجلب سلاسل المحادثات. للحصول على إحصاءات التفاعل لكل منشور،
  مثل إعادات النشر أو الردود أو الإشارات المرجعية أو المشاهدات، يُفضّل إجراء
  بحث موجّه عن عنوان URL الدقيق للمنشور أو معرّف الحالة. قد تعثر عمليات البحث
  الواسعة بالكلمات المفتاحية على المنشور الصحيح، لكنها تعيد بيانات وصفية أقل
  اكتمالًا لكل منشور. النمط الجيد هو: حدّد موقع المنشور أولًا، ثم شغّل استعلام
  `x_search` ثانيًا يركّز على ذلك المنشور بعينه.
</Note>

### إعداد x_search

عند حذف `enabled`، لا تُتاح `x_search` إلا عندما يكون موفّر النموذج النشط هو `xai` وتتوفر بيانات اعتماد xAI. بالنسبة إلى نموذج نشط له موفّر معروف غير xAI، اضبط `plugins.entries.xai.config.xSearch.enabled` على `true` للاشتراك في الاستخدام عبر الموفّرين. إذا كان موفّر النموذج النشط مفقودًا أو تعذّر تحديده، تظل الأداة مخفية. اضبط `enabled` على `false` لتعطيلها لدى جميع الموفّرين. بيانات اعتماد xAI مطلوبة دائمًا.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // required for a known non-xAI model provider
            model: "grok-4.3",
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

ترسل `x_search` طلبات إلى `<baseUrl>/responses` عند ضبط
`plugins.entries.xai.config.xSearch.baseUrl`. إذا حُذف هذا الحقل، فإنها ترجع
إلى `plugins.entries.xai.config.webSearch.baseUrl`، ثم إلى
`tools.web.search.grok.baseUrl` القديم، وأخيرًا إلى نقطة نهاية xAI العامة
(`https://api.x.ai/v1`).

### معاملات x_search

| المعامل                      | الوصف                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| `query`                      | استعلام البحث (مطلوب)                                       |
| `allowed_x_handles`          | قصر النتائج على 20 معرّفًا كحد أقصى في X                    |
| `excluded_x_handles`         | استبعاد 20 معرّفًا كحد أقصى في X                            |
| `from_date`                  | تضمين المنشورات في هذا التاريخ أو بعده فقط (YYYY-MM-DD)      |
| `to_date`                    | تضمين المنشورات في هذا التاريخ أو قبله فقط (YYYY-MM-DD)      |
| `enable_image_understanding` | السماح لـ xAI بفحص الصور المرفقة بالمنشورات المطابقة         |
| `enable_video_understanding` | السماح لـ xAI بفحص مقاطع الفيديو المرفقة بالمنشورات المطابقة |

لا يمكن استخدام `allowed_x_handles` و`excluded_x_handles` معًا.

### مثال على x_search

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

## ذو صلة

- [جلب محتوى الويب](/ar/tools/web-fetch) -- جلب عنوان URL واستخراج محتوى قابل للقراءة
- [متصفح الويب](/ar/tools/browser) -- أتمتة كاملة للمتصفح للمواقع التي تعتمد بكثافة على JavaScript
- [بحث Grok](/ar/tools/grok-search) -- استخدام Grok بوصفه موفّر `web_search`
- [بحث الويب عبر Ollama](/ar/tools/ollama-search) -- بحث ويب لا يتطلب مفتاحًا عبر مضيف Ollama الخاص بك
