---
read_when:
    - تريد تمكين web_search أو تكوينه
    - تريد تمكين أو تكوين x_search
    - يجب عليك اختيار مزوّد بحث
    - تريد فهم الاكتشاف التلقائي والرجوع الاحتياطي للمزوّد
sidebarTitle: Web Search
summary: web_search، وx_search، وweb_fetch -- البحث في الويب، أو البحث في منشورات X، أو جلب محتوى الصفحة
title: بحث الويب
x-i18n:
    generated_at: "2026-04-30T08:34:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

تبحث أداة `web_search` في الويب باستخدام المزوّد الذي هيأته وتُرجع النتائج. تُخزّن النتائج مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للتهيئة).

يتضمن OpenClaw أيضًا `x_search` لمنشورات X (المعروف سابقًا باسم Twitter) و`web_fetch` لجلب عناوين URL بخفة. في هذه المرحلة، يظل `web_fetch` محليًا بينما يمكن أن يستخدم `web_search` و`x_search` ‏xAI Responses ضمنيًا.

<Info>
  `web_search` أداة HTTP خفيفة وليست أتمتة متصفح. للمواقع كثيفة
  JS أو عمليات تسجيل الدخول، استخدم [متصفح الويب](/ar/tools/browser). ولجلب
  عنوان URL محدد، استخدم [جلب الويب](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="Choose a provider">
    اختر مزوّدًا وأكمل أي إعداد مطلوب. بعض المزوّدين لا يحتاجون إلى
    مفاتيح، بينما يستخدم آخرون مفاتيح API. راجع صفحات المزوّدين أدناه
    للتفاصيل.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    يخزّن هذا المزوّد وأي بيانات اعتماد لازمة. يمكنك أيضًا تعيين متغير env
    (على سبيل المثال `BRAVE_API_KEY`) وتخطي هذه الخطوة للمزوّدين المدعومين
    بواجهة API.
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
    نتائج منظمة مع مقتطفات. يدعم وضع `llm-context` ومرشحات البلد/اللغة. تتوفر طبقة مجانية.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    خيار احتياطي بلا مفتاح. لا يلزم مفتاح API. تكامل غير رسمي مستند إلى HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي + كلمات مفتاحية مع استخراج المحتوى (تمييزات، نص، ملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظمة. يُفضّل إقرانه مع `firecrawl_search` و`firecrawl_scrape` للاستخراج العميق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مولّدة بالذكاء الاصطناعي مع استشهادات عبر تأصيل Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مولّدة بالذكاء الاصطناعي مع استشهادات عبر تأصيل الويب من xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مولّدة بالذكاء الاصطناعي مع استشهادات عبر بحث الويب من Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظمة عبر واجهة API للبحث في MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    البحث عبر مضيف Ollama محلي مسجل الدخول أو واجهة Ollama API المستضافة.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظمة مع عناصر تحكم في استخراج المحتوى وترشيح النطاقات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    بحث تلوي مستضاف ذاتيًا. لا يلزم مفتاح API. يجمّع Google وBing وDuckDuckGo وغير ذلك.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظمة مع عمق البحث، وترشيح الموضوعات، و`tavily_extract` لاستخراج عناوين URL.
  </Card>
</CardGroup>

### مقارنة المزوّدين

| المزوّد                                  | نمط النتائج               | المرشحات                                          | مفتاح API                                                                                 |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)              | مقتطفات منظمة        | البلد، اللغة، الوقت، وضع `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/ar/tools/duckduckgo-search)    | مقتطفات منظمة        | --                                               | لا شيء (بلا مفتاح)                                                                         |
| [Exa](/ar/tools/exa-search)                  | منظمة + مستخرجة     | وضع عصبي/كلمات مفتاحية، التاريخ، استخراج المحتوى    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ar/tools/firecrawl)             | مقتطفات منظمة        | عبر أداة `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ar/tools/gemini-search)            | مولّدة بالذكاء الاصطناعي + استشهادات | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ar/tools/grok-search)                | مولّدة بالذكاء الاصطناعي + استشهادات | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/ar/tools/kimi-search)                | مولّدة بالذكاء الاصطناعي + استشهادات | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ar/tools/minimax-search)   | مقتطفات منظمة        | المنطقة (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/ar/tools/ollama-search) | مقتطفات منظمة        | --                                               | لا شيء للمضيفين المحليين المسجلي الدخول؛ `OLLAMA_API_KEY` لبحث `https://ollama.com` المباشر |
| [Perplexity](/ar/tools/perplexity-search)    | مقتطفات منظمة        | البلد، اللغة، الوقت، النطاقات، حدود المحتوى | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ar/tools/searxng-search)          | مقتطفات منظمة        | الفئات، اللغة                             | لا شيء (مستضاف ذاتيًا)                                                                      |
| [Tavily](/ar/tools/tavily)                   | مقتطفات منظمة        | عبر أداة `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## الاكتشاف التلقائي

## بحث الويب الأصلي في OpenAI

تستخدم نماذج OpenAI Responses المباشرة أداة `web_search` المستضافة من OpenAI تلقائيًا عندما يكون بحث الويب في OpenClaw مفعّلًا ولا يكون أي مزوّد مُدار مثبتًا. هذا سلوك يملكه المزوّد في Plugin ‏OpenAI المضمّن، وينطبق فقط على حركة مرور OpenAI API الأصلية، وليس على عناوين URL الأساسية للوكلاء المتوافقين مع OpenAI أو مسارات Azure. اضبط `tools.web.search.provider` على مزوّد آخر مثل `brave` للاحتفاظ بأداة `web_search` المُدارة لنماذج OpenAI، أو اضبط `tools.web.search.enabled: false` لتعطيل كل من البحث المُدار وبحث OpenAI الأصلي.

## بحث الويب الأصلي في Codex

يمكن للنماذج القادرة على Codex اختياريًا استخدام أداة Responses الأصلية لدى المزوّد `web_search` بدلًا من دالة `web_search` المُدارة في OpenClaw.

- هيّئها ضمن `tools.web.search.openaiCodex`
- لا تُفعّل إلا للنماذج القادرة على Codex (`openai-codex/*` أو المزوّدين الذين يستخدمون `api: "openai-codex-responses"`)
- يظل `web_search` المُدار منطبقًا على النماذج غير Codex
- `mode: "cached"` هو الإعداد الافتراضي والموصى به
- `tools.web.search.enabled: false` يعطّل البحث المُدار والأصلي معًا

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

## إعداد بحث الويب

قوائم المزوّدين في الوثائق وتدفقات الإعداد أبجدية. يحافظ الاكتشاف التلقائي على
ترتيب أسبقية منفصل.

إذا لم يُعيّن `provider`، يتحقق OpenClaw من المزوّدين بهذا الترتيب ويستخدم
أول مزوّد جاهز:

المزوّدون المدعومون بواجهة API أولًا:

1. **Brave** -- `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey` (الترتيب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey` (الترتيب 15)
3. **Gemini** -- `GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey` (الترتيب 20)
4. **Grok** -- `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey` (الترتيب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey` (الترتيب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey` (الترتيب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey` (الترتيب 60)
8. **Exa** -- `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey` (الترتيب 65)
9. **Tavily** -- `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey` (الترتيب 70)

خيارات احتياطية بلا مفاتيح بعد ذلك:

10. **DuckDuckGo** -- خيار HTML احتياطي بلا مفتاح ولا حساب أو مفتاح API (الترتيب 100)
11. **Ollama Web Search** -- خيار احتياطي بلا مفتاح عبر مضيف Ollama المحلي المهيأ لديك عندما يكون قابلًا للوصول ومسجل الدخول باستخدام `ollama signin`؛ يمكنه إعادة استخدام مصادقة الحامل لمزوّد Ollama عندما يحتاجها المضيف، ويمكنه استدعاء بحث `https://ollama.com` المباشر عند تهيئته باستخدام `OLLAMA_API_KEY` (الترتيب 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (الترتيب 200)

إذا لم يُكتشف أي مزوّد، فسيعود إلى Brave (ستحصل على خطأ مفتاح مفقود
يطالبك بتهيئة مفتاح).

<Note>
  تدعم كل حقول مفاتيح المزوّدين كائنات SecretRef. تُحل SecretRefs ذات نطاق Plugin
  ضمن `plugins.entries.<plugin>.config.webSearch.apiKey` لمزوّدي بحث الويب المدعومين بواجهة API
  المضمّنين، بما في ذلك Brave وExa وFirecrawl
  وGemini وGrok وKimi وMiniMax وPerplexity وTavily،
  سواء اختير المزوّد صراحةً عبر `tools.web.search.provider` أو
  اختير من خلال الاكتشاف التلقائي. في وضع الاكتشاف التلقائي، يحل OpenClaw مفتاح
  المزوّد المحدد فقط -- تظل SecretRefs غير المحددة غير نشطة، لذا يمكنك
  إبقاء عدة مزوّدين مهيئين دون دفع تكلفة الحل للمزوّدين
  الذين لا تستخدمهم.
</Note>

## التهيئة

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

توجد التهيئة الخاصة بالمزوّد (مفاتيح API، عناوين URL الأساسية، الأوضاع) ضمن
`plugins.entries.<plugin>.config.webSearch.*`. راجع صفحات المزوّدين للاطلاع على
أمثلة.

اختيار مزوّد `web_fetch` الاحتياطي منفصل:

- اختره باستخدام `tools.web.fetch.provider`
- أو احذف ذلك الحقل ودع OpenClaw يكتشف تلقائيًا أول مزوّد web-fetch جاهز
  من بيانات الاعتماد المتاحة
- اليوم مزوّد web-fetch المضمّن هو Firecrawl، ومهيأ ضمن
  `plugins.entries.firecrawl.config.webFetch.*`

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن أن يطلب OpenClaw أيضًا:

- منطقة Moonshot API (`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج بحث الويب الافتراضي من Kimi (افتراضيًا `kimi-k2.6`)

بالنسبة إلى `x_search`، اضبط `plugins.entries.xai.config.xSearch.*`. يستخدم مفتاح الرجوع نفسه `XAI_API_KEY` الذي يستخدمه بحث الويب في Grok.
يتم ترحيل إعدادات `tools.web.x_search.*` القديمة تلقائيا بواسطة `openclaw doctor --fix`.
عند اختيار Grok أثناء `openclaw onboard` أو `openclaw configure --section web`،
يمكن لـ OpenClaw أيضا عرض إعداد `x_search` اختياري باستخدام المفتاح نفسه.
هذه خطوة متابعة منفصلة داخل مسار Grok، وليست خيار مزود بحث ويب منفصلا على المستوى الأعلى. إذا اخترت مزودا آخر، فلن يعرض OpenClaw مطالبة `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="Config file">
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
  <Tab title="Environment variable">
    عيّن متغير بيئة المزود في بيئة عملية Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    بالنسبة إلى تثبيت Gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معاملات الأداة

| المعامل              | الوصف                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | استعلام البحث (مطلوب)                                |
| `count`               | النتائج المطلوب إرجاعها (1-10، الافتراضي: 5)         |
| `country`             | رمز بلد ISO مكوّن من حرفين (مثل "US"، "DE")          |
| `language`            | رمز لغة ISO 639-1 (مثل "en"، "de")                   |
| `search_lang`         | رمز لغة البحث (Brave فقط)                            |
| `freshness`           | مرشح زمني: `day` أو `week` أو `month` أو `year`      |
| `date_after`          | النتائج بعد هذا التاريخ (YYYY-MM-DD)                 |
| `date_before`         | النتائج قبل هذا التاريخ (YYYY-MM-DD)                 |
| `ui_lang`             | رمز لغة الواجهة (Brave فقط)                          |
| `domain_filter`       | مصفوفة السماح/الحظر للنطاقات (Perplexity فقط)        |
| `max_tokens`          | ميزانية المحتوى الإجمالية، الافتراضي 25000 (Perplexity فقط) |
| `max_tokens_per_page` | حد الرموز لكل صفحة، الافتراضي 2048 (Perplexity فقط)  |

<Warning>
  لا تعمل كل المعاملات مع كل المزودين. يرفض وضع `llm-context` في Brave
  `ui_lang` و`freshness` و`date_after` و`date_before`.
  يعيد Gemini وGrok وKimi إجابة واحدة مركّبة مع استشهادات. تقبل هذه المزودات
  `count` للتوافق مع الأداة المشتركة، لكنه لا يغيّر شكل الإجابة المؤسّسة على المصادر.
  يتصرف Perplexity بالطريقة نفسها عند استخدام مسار توافق Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`).
  يقبل SearXNG `http://` فقط لمضيفي الشبكات الخاصة الموثوقة أو مضيفي local loopback؛
  ويجب أن تستخدم نقاط نهاية SearXNG العامة `https://`.
  يدعم Firecrawl وTavily فقط `query` و`count` عبر `web_search`
  -- استخدم أدواتهما المخصصة للخيارات المتقدمة.
</Warning>

## x_search

يستعلم `x_search` منشورات X (المعروف سابقا باسم Twitter) باستخدام xAI ويعيد
إجابات مركّبة بالذكاء الاصطناعي مع استشهادات. يقبل الاستعلامات باللغة الطبيعية
ومرشحات منظمة اختيارية. لا يفعّل OpenClaw أداة `x_search` المضمنة من xAI
إلا في الطلب الذي يخدم استدعاء هذه الأداة.

<Note>
  توثّق xAI أن `x_search` يدعم البحث بالكلمات المفتاحية، والبحث الدلالي، وبحث المستخدمين،
  وجلب السلاسل. بالنسبة إلى إحصاءات التفاعل لكل منشور مثل إعادة النشر،
  أو الردود، أو الإشارات المرجعية، أو المشاهدات، ففضّل بحثا موجها عن عنوان URL الدقيق
  للمنشور أو معرّف الحالة. قد تعثر عمليات البحث الواسعة بالكلمات المفتاحية على المنشور الصحيح
  لكنها تعيد بيانات وصفية أقل اكتمالا لكل منشور. النمط الجيد هو: حدّد موقع المنشور أولا، ثم
  شغّل استعلام `x_search` ثانيا يركّز على ذلك المنشور بالضبط.
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

### معاملات x_search

| المعامل                     | الوصف                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | استعلام البحث (مطلوب)                                 |
| `allowed_x_handles`          | حصر النتائج في معرّفات X محددة                         |
| `excluded_x_handles`         | استبعاد معرّفات X محددة                                |
| `from_date`                  | تضمين المنشورات في هذا التاريخ أو بعده فقط (YYYY-MM-DD) |
| `to_date`                    | تضمين المنشورات في هذا التاريخ أو قبله فقط (YYYY-MM-DD) |
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

- [جلب الويب](/ar/tools/web-fetch) -- جلب عنوان URL واستخراج محتوى مقروء
- [متصفح الويب](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع كثيفة JavaScript
- [بحث Grok](/ar/tools/grok-search) -- Grok باعتباره مزود `web_search`
- [بحث ويب Ollama](/ar/tools/ollama-search) -- بحث ويب بلا مفتاح عبر مضيف Ollama الخاص بك
