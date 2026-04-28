---
read_when:
    - تريد جلب عنوان URL واستخراج محتوى قابل للقراءة
    - تحتاج إلى إعداد `web_fetch` أو بديله الاحتياطي Firecrawl
    - تريد فهم حدود `web_fetch` والتخزين المؤقت الخاص بها
sidebarTitle: Web Fetch
summary: أداة `web_fetch` -- جلب HTTP مع استخراج محتوى قابل للقراءة
title: جلب الويب
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T08:11:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

تقوم أداة `web_fetch` بتنفيذ HTTP GET عادي وتستخرج محتوى قابلاً للقراءة
(من HTML إلى markdown أو text). وهي **لا** تنفذ JavaScript.

بالنسبة إلى المواقع المعتمدة بكثافة على JS أو الصفحات المحمية بتسجيل الدخول، استخدم
[Web Browser](/ar/tools/browser) بدلًا من ذلك.

## بدء سريع

تكون `web_fetch` **مفعلة افتراضيًا** -- ولا حاجة إلى أي إعداد. ويمكن للوكيل
استدعاؤها فورًا:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## معلمات الأداة

<ParamField path="url" type="string" required>
عنوان URL المراد جلبه. `http(s)` فقط.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
تنسيق الإخراج بعد استخراج المحتوى الرئيسي.
</ParamField>

<ParamField path="maxChars" type="number">
اقتطاع الإخراج إلى هذا العدد من الأحرف.
</ParamField>

## كيف تعمل

<Steps>
  <Step title="الجلب">
    ترسل HTTP GET مع User-Agent شبيه بـ Chrome وترويسة `Accept-Language`.
    وتحظر أسماء المضيفين الخاصة/الداخلية وتعيد فحص عمليات إعادة التوجيه.
  </Step>
  <Step title="الاستخراج">
    تشغّل Readability ‏(استخراج المحتوى الرئيسي) على استجابة HTML.
  </Step>
  <Step title="البديل الاحتياطي (اختياري)">
    إذا فشل Readability وكانت Firecrawl مضبوطة، تعيد المحاولة عبر
    Firecrawl API مع وضع تجاوز الحماية من البوتات.
  </Step>
  <Step title="التخزين المؤقت">
    يتم تخزين النتائج مؤقتًا لمدة 15 دقيقة (قابلة للضبط) لتقليل
    عمليات الجلب المتكررة لعنوان URL نفسه.
  </Step>
</Steps>

## الإعداد

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
      },
    },
  },
}
```

## البديل الاحتياطي Firecrawl

إذا فشل استخراج Readability، يمكن لـ `web_fetch` الرجوع إلى
[Firecrawl](/ar/tools/firecrawl) لتجاوز حماية البوتات وتحسين الاستخراج:

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

تدعم `plugins.entries.firecrawl.config.webFetch.apiKey` كائنات SecretRef.
ويتم ترحيل إعدادات `tools.web.fetch.firecrawl.*` القديمة تلقائيًا بواسطة `openclaw doctor --fix`.

<Note>
  إذا كانت Firecrawl مفعلة وكان SecretRef الخاص بها غير محلول من دون
  بديل env باسم `FIRECRAWL_API_KEY`، فإن بدء Gateway يفشل بسرعة.
</Note>

<Note>
  تكون تجاوزات `baseUrl` الخاصة بـ Firecrawl مقيدة بإحكام: إذ يجب أن تستخدم `https://`
  ومضيف Firecrawl الرسمي (`api.firecrawl.dev`).
</Note>

السلوك الحالي أثناء التشغيل:

- تحدد `tools.web.fetch.provider` موفّر البديل الاحتياطي للجلب بشكل صريح.
- إذا تم حذف `provider`، فإن OpenClaw تكتشف تلقائيًا أول موفّر web-fetch
  جاهز من بيانات الاعتماد المتاحة. واليوم، الموفّر المضمن هو Firecrawl.
- إذا تم تعطيل Readability، فإن `web_fetch` تتجاوز مباشرة إلى
  البديل الاحتياطي المحدد. وإذا لم يتوفر أي موفّر، فإنها تفشل بشكل مغلق.

## الحدود والسلامة

- يتم تقييد `maxChars` إلى `tools.web.fetch.maxCharsCap`
- يتم تقييد جسم الاستجابة إلى `maxResponseBytes` قبل التحليل؛ ويتم اقتطاع
  الاستجابات كبيرة الحجم مع تحذير
- يتم حظر أسماء المضيفين الخاصة/الداخلية
- يتم فحص عمليات إعادة التوجيه وتقييدها بواسطة `maxRedirects`
- تعمل `web_fetch` بأفضل جهد -- بعض المواقع تحتاج إلى [Web Browser](/ar/tools/browser)

## Profiles الأدوات

إذا كنت تستخدم Profiles أدوات أو قوائم سماح، فأضف `web_fetch` أو `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## ذو صلة

- [Web Search](/ar/tools/web) -- البحث في الويب باستخدام عدة موفّرين
- [Web Browser](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع المعتمدة بكثافة على JS
- [Firecrawl](/ar/tools/firecrawl) -- أدوات البحث والكشط الخاصة بـ Firecrawl
