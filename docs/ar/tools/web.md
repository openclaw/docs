---
read_when:
    - تريد تفعيل `web_search` أو إعداده
    - تريد تفعيل `x_search` أو إعداده
    - تحتاج إلى اختيار مزوّد بحث
    - تريد فهم الاكتشاف التلقائي والرجوع الاحتياطي بين المزوّدين
sidebarTitle: Web Search
summary: '`web_search` و`x_search` و`web_fetch` — ابحث في الويب، أو ابحث في منشورات X، أو اجلب محتوى الصفحة'
title: بحث الويب
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T08:12:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2713e8b13cf0f3c6bba38bee50c24771b914a5cd235ca521bed434a6ddbe2305
    source_path: tools/web.md
    workflow: 15
---

تقوم أداة `web_search` بالبحث في الويب باستخدام المزوّد الذي أعددته
وتعيد النتائج. ويتم تخزين النتائج مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للإعداد).

ويتضمن OpenClaw أيضًا `x_search` لمنشورات X ‏(المعروفة سابقًا باسم Twitter) و
`web_fetch` لجلب عناوين URL بشكل خفيف. وفي هذه المرحلة، يبقى `web_fetch`
محليًا بينما يمكن لكل من `web_search` و`x_search` استخدام xAI Responses في الخلفية.

<Info>
  إن `web_search` أداة HTTP خفيفة، وليست أتمتة متصفح. وبالنسبة إلى
  المواقع الثقيلة على JavaScript أو التي تتطلب تسجيل الدخول، استخدم [Web Browser](/ar/tools/browser). ولجلب عنوان URL محدد، استخدم [Web Fetch](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="اختر مزوّدًا">
    اختر مزوّدًا وأكمل أي إعداد مطلوب. بعض المزوّدين
    لا يحتاجون إلى مفتاح، بينما يستخدم البعض الآخر مفاتيح API. راجع صفحات
    المزوّدين أدناه للحصول على التفاصيل.
  </Step>
  <Step title="الإعداد">
    ```bash
    openclaw configure --section web
    ```
    يؤدي هذا إلى تخزين المزوّد وأي بيانات اعتماد لازمة. ويمكنك أيضًا ضبط متغير بيئة
    (مثل `BRAVE_API_KEY`) وتخطي هذه الخطوة بالنسبة إلى
    المزوّدين المدعومين بـ API.
  </Step>
  <Step title="استخدمه">
    يمكن للوكيل الآن استدعاء `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    وبالنسبة إلى منشورات X، استخدم:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## اختيار مزوّد

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ar/tools/brave-search">
    نتائج منظمة مع مقتطفات. يدعم وضع `llm-context` ومرشحات البلد/اللغة. تتوفر فئة مجانية.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    بديل احتياطي لا يحتاج إلى مفتاح. لا حاجة إلى مفتاح API. تكامل غير رسمي قائم على HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي + بالكلمات المفتاحية مع استخراج المحتوى (تمييزات، نص، ملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظمة. يُفضّل إقرانه مع `firecrawl_search` و`firecrawl_scrape` للاستخراج العميق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مركّبة بالذكاء الاصطناعي مع استشهادات عبر Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مركّبة بالذكاء الاصطناعي مع استشهادات عبر xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مركّبة بالذكاء الاصطناعي مع استشهادات عبر Moonshot web search.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظمة عبر MiniMax Coding Plan search API.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    بحث لا يحتاج إلى مفتاح عبر مضيف Ollama الذي أعددته. يتطلب `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظمة مع عناصر تحكم لاستخراج المحتوى وتصفية النطاقات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    Meta-search مستضاف ذاتيًا. لا حاجة إلى مفتاح API. ويجمع Google وBing وDuckDuckGo والمزيد.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظمة مع عمق البحث، وتصفية الموضوعات، و`tavily_extract` لاستخراج عناوين URL.
  </Card>
</CardGroup>

### مقارنة المزوّدين

| المزوّد                                  | نمط النتائج                | عوامل التصفية                                   | مفتاح API                                                                        |
| ---------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)             | مقتطفات منظمة              | البلد، واللغة، والوقت، ووضع `llm-context`        | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/ar/tools/duckduckgo-search)   | مقتطفات منظمة              | --                                               | لا شيء (من دون مفتاح)                                                            |
| [Exa](/ar/tools/exa-search)                 | منظم + مستخرج              | وضع عصبي/كلمات مفتاحية، والتاريخ، واستخراج المحتوى | `EXA_API_KEY`                                                                    |
| [Firecrawl](/ar/tools/firecrawl)            | مقتطفات منظمة              | عبر أداة `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/ar/tools/gemini-search)           | مركّب بالذكاء الاصطناعي + استشهادات | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/ar/tools/grok-search)               | مركّب بالذكاء الاصطناعي + استشهادات | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/ar/tools/kimi-search)               | مركّب بالذكاء الاصطناعي + استشهادات | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/ar/tools/minimax-search)  | مقتطفات منظمة              | المنطقة (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/ar/tools/ollama-search) | مقتطفات منظمة             | --                                               | لا شيء افتراضيًا؛ يتطلب `ollama signin`، ويمكنه إعادة استخدام مصادقة bearer الخاصة بمزوّد Ollama |
| [Perplexity](/ar/tools/perplexity-search)   | مقتطفات منظمة              | البلد، واللغة، والوقت، والنطاقات، وحدود المحتوى   | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/ar/tools/searxng-search)         | مقتطفات منظمة              | الفئات، واللغة                                   | لا شيء (مستضاف ذاتيًا)                                                           |
| [Tavily](/ar/tools/tavily)                  | مقتطفات منظمة              | عبر أداة `tavily_search`                         | `TAVILY_API_KEY`                                                                 |

## الاكتشاف التلقائي

## البحث الأصلي في OpenAI على الويب

تستخدم نماذج OpenAI Responses المباشرة أداة `web_search` المستضافة من OpenAI تلقائيًا عندما يكون بحث الويب مفعّلًا في OpenClaw ولا يكون هناك مزوّد مُدار مثبت. وهذا سلوك يملكه المزوّد في Plugin المضمنة لـ OpenAI ولا ينطبق إلا على حركة OpenAI API الأصلية، وليس على عناوين URL الأساسية الخاصة بالوكلاء المتوافقين مع OpenAI أو مسارات Azure. اضبط `tools.web.search.provider` على مزوّد آخر مثل `brave` للإبقاء على أداة `web_search` المُدارة لنماذج OpenAI، أو اضبط `tools.web.search.enabled: false` لتعطيل كل من البحث المُدار والبحث الأصلي في OpenAI.

## البحث الأصلي في Codex على الويب

يمكن لنماذج Codex القادرة اختياريًا استخدام أداة `web_search` الأصلية الخاصة بالمزوّد في Responses بدلًا من دالة `web_search` المُدارة من OpenClaw.

- قم بإعداده تحت `tools.web.search.openaiCodex`
- لا يتفعّل إلا لنماذج Codex القادرة (`openai-codex/*` أو المزوّدين الذين يستخدمون `api: "openai-codex-responses"`)
- ما تزال `web_search` المُدارة تنطبق على النماذج غير التابعة لـ Codex
- يكون `mode: "cached"` هو الإعداد الافتراضي والموصى به
- يؤدي `tools.web.search.enabled: false` إلى تعطيل كل من البحث المُدار والأصلي

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

إذا كان البحث الأصلي في Codex مفعّلًا لكن النموذج الحالي غير قادر على Codex، فإن OpenClaw يحتفظ بسلوك `web_search` المُدار العادي.

## إعداد بحث الويب

تكون قوائم المزوّدين في الوثائق وتدفقات الإعداد مرتبة أبجديًا. أما الاكتشاف التلقائي فيحافظ على
ترتيب أولوية منفصل.

إذا لم يتم ضبط `provider`, فإن OpenClaw يتحقق من المزوّدين بهذا الترتيب ويستخدم
أول مزوّد جاهز:

المزوّدون المدعومون بـ API أولًا:

1. **Brave** -- ‏`BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey` ‏(الترتيب 10)
2. **MiniMax Search** -- ‏`MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey` ‏(الترتيب 15)
3. **Gemini** -- ‏`GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey` ‏(الترتيب 20)
4. **Grok** -- ‏`XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey` ‏(الترتيب 30)
5. **Kimi** -- ‏`KIMI_API_KEY` / `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey` ‏(الترتيب 40)
6. **Perplexity** -- ‏`PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey` ‏(الترتيب 50)
7. **Firecrawl** -- ‏`FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey` ‏(الترتيب 60)
8. **Exa** -- ‏`EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey` ‏(الترتيب 65)
9. **Tavily** -- ‏`TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey` ‏(الترتيب 70)

البدائل الاحتياطية التي لا تحتاج إلى مفتاح بعد ذلك:

10. **DuckDuckGo** -- بديل HTML لا يحتاج إلى مفتاح من دون حساب أو مفتاح API ‏(الترتيب 100)
11. **Ollama Web Search** -- بديل لا يحتاج إلى مفتاح عبر مضيف Ollama الذي أعددته؛ يتطلب أن يكون Ollama قابلًا للوصول وأن يتم تسجيل الدخول باستخدام `ollama signin`، ويمكنه إعادة استخدام مصادقة bearer الخاصة بمزوّد Ollama إذا كان المضيف يحتاج إليها (الترتيب 110)
12. **SearXNG** -- ‏`SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` ‏(الترتيب 200)

إذا لم يتم اكتشاف أي مزوّد، فإنه يعود إلى Brave (وستحصل على
خطأ مفتاح مفقود يطلب منك إعداد واحد).

<Note>
  تدعم جميع حقول مفاتيح المزوّدين كائنات SecretRef. ويتم تحليل SecretRefs
  على مستوى Plugin تحت `plugins.entries.<plugin>.config.webSearch.apiKey` بالنسبة إلى
  المزوّدين المضمنين Exa وFirecrawl وGemini وGrok وKimi وPerplexity وTavily
  سواء تم اختيار المزوّد صراحةً عبر `tools.web.search.provider` أو
  عبر الاكتشاف التلقائي. وفي وضع الاكتشاف التلقائي، لا يحلل OpenClaw إلا
  مفتاح المزوّد المحدد — وتبقى SecretRefs الخاصة بالمزوّدين غير المحددين غير نشطة، بحيث يمكنك
  إبقاء عدة مزوّدين مضبوطين من دون دفع تكلفة التحليل للمزوّدين
  الذين لا تستخدمهم.
</Note>

## الإعدادات

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // الافتراضي: true
        provider: "brave", // أو احذف هذا من أجل الاكتشاف التلقائي
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

توجد الإعدادات الخاصة بكل مزوّد (مفاتيح API، وعناوين URL الأساسية، والأوضاع) تحت
`plugins.entries.<plugin>.config.webSearch.*`. راجع صفحات المزوّدين
للاطلاع على أمثلة.

اختيار مزوّد الرجوع الاحتياطي لـ `web_fetch` منفصل:

- اختره عبر `tools.web.fetch.provider`
- أو احذف ذلك الحقل ودع OpenClaw يكتشف تلقائيًا أول مزوّد web-fetch
  جاهز من بين بيانات الاعتماد المتاحة
- اليوم، مزوّد web-fetch المضمن هو Firecrawl، ويتم إعداده تحت
  `plugins.entries.firecrawl.config.webFetch.*`

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`, يمكن لـ OpenClaw أيضًا أن يطلب:

- منطقة Moonshot API ‏(`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج Kimi الافتراضي للبحث على الويب (الافتراضي هو `kimi-k2.6`)

بالنسبة إلى `x_search`, قم بإعداد `plugins.entries.xai.config.xSearch.*`. وهو يستخدم
الرجوع الاحتياطي نفسه لـ `XAI_API_KEY` كما في بحث Grok على الويب.
ويتم ترحيل إعدادات `tools.web.x_search.*` القديمة تلقائيًا بواسطة `openclaw doctor --fix`.
وعندما تختار Grok أثناء `openclaw onboard` أو `openclaw configure --section web`,
يمكن لـ OpenClaw أيضًا أن يقدّم إعداد `x_search` الاختياري باستخدام المفتاح نفسه.
وهذه خطوة متابعة منفصلة داخل مسار Grok، وليست خيارًا علويًا منفصلًا
لمزوّد بحث الويب. وإذا اخترت مزوّدًا آخر، فلن يعرض OpenClaw
مطالبة `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="ملف الإعدادات">
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
    اضبط متغير بيئة المزوّد في بيئة عملية Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    وبالنسبة إلى تثبيت gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معلمات الأداة

| المعلمة              | الوصف                                                  |
| -------------------- | ------------------------------------------------------ |
| `query`              | استعلام البحث (مطلوب)                                  |
| `count`              | النتائج المطلوب إرجاعها (1-10، الافتراضي: 5)           |
| `country`            | رمز البلد ISO من حرفين (مثل `"US"` أو `"DE"`)          |
| `language`           | رمز اللغة ISO 639-1 (مثل `"en"` أو `"de"`)             |
| `search_lang`        | رمز لغة البحث (Brave فقط)                              |
| `freshness`          | مرشح الوقت: `day` أو `week` أو `month` أو `year`       |
| `date_after`         | النتائج بعد هذا التاريخ (YYYY-MM-DD)                   |
| `date_before`        | النتائج قبل هذا التاريخ (YYYY-MM-DD)                   |
| `ui_lang`            | رمز لغة واجهة المستخدم (Brave فقط)                     |
| `domain_filter`      | مصفوفة قائمة سماح/حظر للنطاقات (Perplexity فقط)        |
| `max_tokens`         | ميزانية المحتوى الإجمالية، الافتراضي 25000 (Perplexity فقط) |
| `max_tokens_per_page` | حد الرموز لكل صفحة، الافتراضي 2048 (Perplexity فقط)   |

<Warning>
  لا تعمل جميع المعلمات مع جميع المزوّدين. يرفض وضع `llm-context` في Brave
  المعلمات `ui_lang` و`freshness` و`date_after` و`date_before`.
  وتعيد Gemini وGrok وKimi إجابة مركّبة واحدة مع استشهادات. وهي
  تقبل `count` من أجل التوافق مع الأداة المشتركة، لكنه لا يغيّر
  شكل الإجابة المدعومة.
  ويتصرف Perplexity بالطريقة نفسها عندما تستخدم مسار
  التوافق Sonar/OpenRouter ‏(`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`).
  يقبل SearXNG بروتوكول `http://` فقط للمضيفين الموثوقين على الشبكات الخاصة أو loopback؛
  أما نقاط نهاية SearXNG العامة فيجب أن تستخدم `https://`.
  ولا يدعم Firecrawl وTavily إلا `query` و`count` عبر `web_search`
  -- استخدم أدواتهما المخصصة للخيارات المتقدمة.
</Warning>

## x_search

تقوم `x_search` بالاستعلام عن منشورات X ‏(المعروفة سابقًا باسم Twitter) باستخدام xAI وتعيد
إجابات مركّبة بالذكاء الاصطناعي مع استشهادات. وهي تقبل استعلامات باللغة الطبيعية و
مرشحات منظمة اختيارية. ولا يفعّل OpenClaw أداة `x_search` المضمنة الخاصة بـ xAI
إلا على الطلب الذي يخدم استدعاء هذه الأداة.

<Note>
  توثق xAI أداة `x_search` على أنها تدعم البحث بالكلمات المفتاحية، والبحث الدلالي، وبحث
  المستخدمين، وجلب الخيوط. وبالنسبة إلى إحصاءات التفاعل الخاصة بكل منشور مثل إعادة النشر،
  أو الردود، أو العلامات المرجعية، أو المشاهدات، ففضّل استعلامًا مستهدفًا لعنوان URL
  الخاص بالمنشور أو لمعرّف الحالة مباشرة. فقد تعثر عمليات البحث الواسعة بالكلمات المفتاحية
  على المنشور الصحيح لكنها تعيد بيانات وصفية أقل اكتمالًا لكل منشور. والنمط الجيد هو:
  حدّد المنشور أولًا، ثم شغّل استعلام `x_search` ثانيًا يركّز على ذلك المنشور بعينه.
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
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // اختياري إذا كان XAI_API_KEY مضبوطًا
          },
        },
      },
    },
  },
}
```

### معلمات x_search

| المعلمة                     | الوصف                                                   |
| --------------------------- | ------------------------------------------------------- |
| `query`                     | استعلام البحث (مطلوب)                                   |
| `allowed_x_handles`         | قصر النتائج على مقابض X محددة                            |
| `excluded_x_handles`        | استبعاد مقابض X محددة                                    |
| `from_date`                 | تضمين المنشورات في هذا التاريخ أو بعده فقط (YYYY-MM-DD) |
| `to_date`                   | تضمين المنشورات في هذا التاريخ أو قبله فقط (YYYY-MM-DD) |
| `enable_image_understanding` | السماح لـ xAI بفحص الصور المرفقة بالمنشورات المطابقة     |
| `enable_video_understanding` | السماح لـ xAI بفحص مقاطع الفيديو المرفقة بالمنشورات المطابقة |

### مثال على x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// إحصاءات كل منشور: استخدم عنوان URL الدقيق للحالة أو معرّف الحالة متى أمكن
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## أمثلة

```javascript
// بحث أساسي
await web_search({ query: "OpenClaw plugin SDK" });

// بحث خاص بالألمانية
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// نتائج حديثة (خلال الأسبوع الماضي)
await web_search({ query: "AI developments", freshness: "week" });

// نطاق تاريخ
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// تصفية النطاقات (Perplexity فقط)
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

## ذو صلة

- [Web Fetch](/ar/tools/web-fetch) -- اجلب عنوان URL واستخرج محتوى قابلًا للقراءة
- [Web Browser](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع الثقيلة على JavaScript
- [Grok Search](/ar/tools/grok-search) -- استخدام Grok كمزوّد `web_search`
- [Ollama Web Search](/ar/tools/ollama-search) -- بحث ويب من دون مفتاح عبر مضيف Ollama الخاص بك
