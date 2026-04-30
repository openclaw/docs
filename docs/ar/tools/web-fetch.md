---
read_when:
    - تريد جلب عنوان URL واستخراج محتوى مقروء
    - تحتاج إلى تكوين web_fetch أو بديله الاحتياطي Firecrawl
    - تريد فهم حدود web_fetch والتخزين المؤقت
sidebarTitle: Web Fetch
summary: أداة web_fetch -- جلب HTTP مع استخراج محتوى قابل للقراءة
title: جلب من الويب
x-i18n:
    generated_at: "2026-04-30T08:33:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

تُجري أداة `web_fetch` طلب HTTP GET عاديًا وتستخرج المحتوى القابل للقراءة
(من HTML إلى markdown أو نص). وهي **لا** تنفّذ JavaScript.

للمواقع كثيفة الاعتماد على JS أو الصفحات المحمية بتسجيل الدخول، استخدم
[متصفّح الويب](/ar/tools/browser) بدلًا من ذلك.

## البدء السريع

تكون `web_fetch` **مفعّلة افتراضيًا** -- ولا يلزم أي ضبط. يمكن للوكيل
استدعاؤها فورًا:

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
  <Step title="الجلب">
    يرسل طلب HTTP GET باستخدام User-Agent شبيه بمتصفّح Chrome وترويسة
    `Accept-Language`. يحظر أسماء المضيف الخاصة/الداخلية ويعيد التحقق من عمليات إعادة التوجيه.
  </Step>
  <Step title="الاستخراج">
    يشغّل Readability (استخراج المحتوى الرئيسي) على استجابة HTML.
  </Step>
  <Step title="الرجوع الاحتياطي (اختياري)">
    إذا فشل Readability وكان Firecrawl مضبوطًا، يعيد المحاولة عبر
    Firecrawl API بوضع تجاوز البوتات.
  </Step>
  <Step title="التخزين المؤقت">
    تُخزّن النتائج مؤقتًا لمدة 15 دقيقة (قابلة للضبط) لتقليل عمليات
    الجلب المتكررة لنفس عنوان URL.
  </Step>
</Steps>

## الضبط

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

## رجوع Firecrawl الاحتياطي

إذا فشل استخراج Readability، يمكن لـ `web_fetch` الرجوع احتياطيًا إلى
[Firecrawl](/ar/tools/firecrawl) لتجاوز البوتات وتحسين الاستخراج:

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
يُرحَّل ضبط `tools.web.fetch.firecrawl.*` القديم تلقائيًا بواسطة `openclaw doctor --fix`.

<Note>
  إذا كان Firecrawl مفعّلًا وكانت SecretRef الخاصة به غير محلولة من دون رجوع احتياطي
  إلى متغير البيئة `FIRECRAWL_API_KEY`، يفشل بدء تشغيل Gateway بسرعة.
</Note>

<Note>
  تجاوزات Firecrawl `baseUrl` مقيّدة بإحكام: يجب أن تستخدم `https://` و
  مضيف Firecrawl الرسمي (`api.firecrawl.dev`).
</Note>

سلوك وقت التشغيل الحالي:

- يحدّد `tools.web.fetch.provider` مزوّد رجوع الجلب الاحتياطي صراحةً.
- إذا حُذف `provider`، يكتشف OpenClaw تلقائيًا أول مزوّد جاهز لجلب الويب
  من بيانات الاعتماد المتاحة. حاليًا، المزوّد المضمّن هو Firecrawl.
- إذا عُطّل Readability، تتجاوز `web_fetch` مباشرةً إلى رجوع المزوّد
  الاحتياطي المحدد. إذا لم يتوفر أي مزوّد، فإنها تفشل بإغلاق آمن.

## الحدود والسلامة

- يُقيّد `maxChars` إلى `tools.web.fetch.maxCharsCap`
- يُحدّد نص الاستجابة عند `maxResponseBytes` قبل التحليل؛ وتُقتطع
  الاستجابات كبيرة الحجم مع تحذير
- تُحظر أسماء المضيف الخاصة/الداخلية
- إن `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` هما اشتراكان ضيقان
  لمكدسات وكلاء IP المزيّفة الموثوقة؛ اتركهما غير مضبوطين ما لم يكن وكيلك يملك
  تلك النطاقات الاصطناعية ويفرض سياسة وجهته الخاصة
- تُفحص عمليات إعادة التوجيه وتُحدّد بواسطة `maxRedirects`
- `web_fetch` أداة تبذل أفضل جهد -- بعض المواقع تحتاج إلى [متصفّح الويب](/ar/tools/browser)

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

## ذات صلة

- [بحث الويب](/ar/tools/web) -- البحث في الويب باستخدام عدة مزوّدين
- [متصفّح الويب](/ar/tools/browser) -- أتمتة متصفّح كاملة للمواقع كثيفة الاعتماد على JS
- [Firecrawl](/ar/tools/firecrawl) -- أدوات البحث والكشط من Firecrawl
