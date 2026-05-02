---
read_when:
    - تريد جلب عنوان URL واستخراج محتوى قابلًا للقراءة
    - تحتاج إلى تكوين web_fetch أو الخيار الاحتياطي الخاص به Firecrawl.
    - تريد فهم حدود web_fetch والتخزين المؤقت
sidebarTitle: Web Fetch
summary: أداة web_fetch -- جلب HTTP مع استخراج محتوى قابل للقراءة
title: جلب الويب
x-i18n:
    generated_at: "2026-05-02T07:46:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

تُجري أداة `web_fetch` طلب HTTP GET عاديًا وتستخرج المحتوى القابل للقراءة
(من HTML إلى markdown أو نص). وهي **لا** تنفّذ JavaScript.

بالنسبة إلى المواقع المعتمدة بكثافة على JS أو الصفحات المحمية بتسجيل الدخول، استخدم
[متصفح الويب](/ar/tools/browser) بدلًا من ذلك.

## البدء السريع

`web_fetch` **مفعّلة افتراضيًا** -- لا حاجة إلى أي تهيئة. يمكن للوكيل
استدعاؤها مباشرة:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## معاملات الأداة

<ParamField path="url" type="string" required>
عنوان URL المطلوب جلبه. `http(s)` فقط.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
تنسيق الإخراج بعد استخراج المحتوى الرئيسي.
</ParamField>

<ParamField path="maxChars" type="number">
اقتطاع الإخراج إلى هذا العدد من الأحرف.
</ParamField>

## آلية العمل

<Steps>
  <Step title="Fetch">
    يرسل طلب HTTP GET باستخدام User-Agent شبيه بـ Chrome وترويسة
    `Accept-Language`. يحظر أسماء المضيفين الخاصة/الداخلية ويتحقق من عمليات إعادة التوجيه مرة أخرى.
  </Step>
  <Step title="Extract">
    يشغّل Readability (استخراج المحتوى الرئيسي) على استجابة HTML.
  </Step>
  <Step title="Fallback (optional)">
    إذا فشل Readability وكانت Firecrawl مهيأة، يعيد المحاولة عبر
    واجهة Firecrawl API مع وضع تجاوز الروبوتات.
  </Step>
  <Step title="Cache">
    تُخزّن النتائج مؤقتًا لمدة 15 دقيقة (قابلة للتهيئة) لتقليل عمليات
    الجلب المتكررة لعنوان URL نفسه.
  </Step>
</Steps>

## التهيئة

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## الرجوع الاحتياطي إلى Firecrawl

إذا فشل استخراج Readability، يمكن أن ترجع `web_fetch` احتياطيًا إلى
[Firecrawl](/ar/tools/firecrawl) لتجاوز الروبوتات وتحسين الاستخراج:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

يدعم `plugins.entries.firecrawl.config.webFetch.apiKey` كائنات SecretRef.
تُرحَّل تهيئة `tools.web.fetch.firecrawl.*` القديمة تلقائيًا بواسطة `openclaw doctor --fix`.

<Note>
  إذا كانت Firecrawl مفعّلة وكان SecretRef الخاص بها غير محلول من دون
  بديل env `FIRECRAWL_API_KEY`، يفشل بدء تشغيل Gateway بسرعة.
</Note>

<Note>
  تجاوزات `baseUrl` في Firecrawl مقيّدة بإحكام: تستخدم حركة المرور المستضافة
  `https://api.firecrawl.dev`؛ ويجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة أو
  داخلية، ولا يُقبل `http://` إلا لتلك الأهداف الخاصة.
</Note>

سلوك وقت التشغيل الحالي:

- يحدد `tools.web.fetch.provider` موفّر الرجوع الاحتياطي للجلب صراحةً.
- إذا حُذف `provider`، يكتشف OpenClaw تلقائيًا أول موفّر جاهز لجلب الويب
  من بيانات الاعتماد المتاحة. يمكن لـ `web_fetch` غير المعزولة استخدام
  Plugins المثبّتة التي تعلن `contracts.webFetchProviders` وتُسجّل
  موفّرًا مطابقًا في وقت التشغيل. حاليًا الموفّر المضمّن هو Firecrawl.
- تبقى استدعاءات `web_fetch` المعزولة محدودة بالموفّرين المضمّنين.
- إذا كان Readability معطّلًا، تتخطى `web_fetch` مباشرة إلى الرجوع الاحتياطي
  للموفّر المحدد. وإذا لم يتوفر أي موفّر، تفشل بإغلاق آمن.

## الحدود والسلامة

- يُقيّد `maxChars` إلى `tools.web.fetch.maxCharsCap`
- يُحدّ جسم الاستجابة عند `maxResponseBytes` قبل التحليل؛ وتُقتطع
  الاستجابات كبيرة الحجم مع تحذير
- تُحظر أسماء المضيفين الخاصة/الداخلية
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` هما خيارا تفعيل ضيّقان
  لمكدسات وكيل fake-IP الموثوقة؛ اتركهما غير مضبوطين ما لم يكن الوكيل لديك يملك
  تلك النطاقات الاصطناعية ويفرض سياسة وجهة خاصة به
- تُفحص عمليات إعادة التوجيه وتُحدّد بواسطة `maxRedirects`
- `web_fetch` تعمل بأفضل جهد -- تحتاج بعض المواقع إلى [متصفح الويب](/ar/tools/browser)

## ملفات تعريف الأدوات

إذا كنت تستخدم ملفات تعريف الأدوات أو قوائم السماح، فأضف `web_fetch` أو `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## ذو صلة

- [بحث الويب](/ar/tools/web) -- البحث في الويب باستخدام عدة موفّرين
- [متصفح الويب](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع المعتمدة بكثافة على JS
- [Firecrawl](/ar/tools/firecrawl) -- أدوات البحث والكشط من Firecrawl
