---
read_when:
    - تريد جلب عنوان URL واستخراج محتوى قابل للقراءة
    - تحتاج إلى تهيئة web_fetch أو بديله الاحتياطي Firecrawl
    - تريد فهم حدود web_fetch والتخزين المؤقت
sidebarTitle: Web Fetch
summary: أداة web_fetch -- جلب عبر HTTP مع استخراج المحتوى القابل للقراءة
title: جلب الويب
x-i18n:
    generated_at: "2026-05-06T18:03:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

تُجري أداة `web_fetch` طلب HTTP GET عاديًا وتستخرج المحتوى المقروء
(من HTML إلى Markdown أو نص). وهي **لا** تنفّذ JavaScript.

للمواقع المعتمدة بكثافة على JS أو الصفحات المحمية بتسجيل الدخول، استخدم
[متصفح الويب](/ar/tools/browser) بدلًا منها.

## البدء السريع

تكون `web_fetch` **مفعّلة افتراضيًا** -- لا حاجة إلى أي إعداد. يمكن للوكيل
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

## كيف تعمل

<Steps>
  <Step title="الجلب">
    ترسل طلب HTTP GET مع User-Agent شبيه بـ Chrome وترويسة `Accept-Language`.
    تحظر أسماء المضيفين الخاصة/الداخلية وتعيد فحص عمليات إعادة التوجيه.
  </Step>
  <Step title="الاستخراج">
    تشغّل Readability (استخراج المحتوى الرئيسي) على استجابة HTML.
  </Step>
  <Step title="الخيار الاحتياطي (اختياري)">
    إذا فشل Readability وكان Firecrawl مضبوطًا، تعيد المحاولة عبر
    Firecrawl API مع وضع تجاوز البوتات.
  </Step>
  <Step title="ذاكرة التخزين المؤقت">
    تُخزّن النتائج مؤقتًا لمدة 15 دقيقة (قابلة للضبط) لتقليل عمليات الجلب المتكررة
    لعنوان URL نفسه.
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

## الخيار الاحتياطي Firecrawl

إذا فشل استخراج Readability، يمكن لـ `web_fetch` الرجوع إلى
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
تُرحَّل إعدادات `tools.web.fetch.firecrawl.*` القديمة تلقائيًا بواسطة `openclaw doctor --fix`.

<Note>
  إذا كان Firecrawl مفعّلًا وكان SecretRef الخاص به غير محلول من دون خيار احتياطي
  عبر متغير البيئة `FIRECRAWL_API_KEY`، يفشل بدء تشغيل Gateway سريعًا.
</Note>

<Note>
  تكون تجاوزات `baseUrl` في Firecrawl مقيدة بإحكام: تستخدم الحركة المستضافة
  `https://api.firecrawl.dev`؛ ويجب أن تستهدف التجاوزات ذاتية الاستضافة نقاط نهاية خاصة أو
  داخلية، ولا يُقبل `http://` إلا لتلك الأهداف الخاصة.
</Note>

سلوك وقت التشغيل الحالي:

- يحدد `tools.web.fetch.provider` موفر خيار الجلب الاحتياطي صراحةً.
- إذا حُذف `provider`، يكتشف OpenClaw تلقائيًا أول موفر web-fetch جاهز
  من بيانات الاعتماد المتاحة. يمكن لـ `web_fetch` غير المعزول استخدام
  Plugins المثبتة التي تعلن `contracts.webFetchProviders` وتُسجّل
  موفرًا مطابقًا في وقت التشغيل. حاليًا الموفر المضمّن هو Firecrawl.
- تبقى استدعاءات `web_fetch` المعزولة مقتصرة على الموفرين المضمّنين.
- إذا كان Readability معطلًا، يتخطى `web_fetch` مباشرةً إلى الخيار الاحتياطي
  للموفر المحدد. إذا لم يتوفر أي موفر، فإنه يفشل بشكل مغلق.

## وكيل البيئة الموثوق

إذا كان النشر لديك يتطلب مرور `web_fetch` عبر وكيل HTTP(S) صادر
موثوق، فاضبط `tools.web.fetch.useTrustedEnvProxy: true`.

في هذا الوضع، يظل OpenClaw يطبّق فحوصات SSRF المستندة إلى اسم المضيف قبل إرسال
الطلب، لكنه يتيح للوكيل حل DNS بدلًا من إجراء تثبيت DNS محلي.
فعّل ذلك فقط عندما يكون الوكيل خاضعًا لتحكم المشغّل ويفرض
سياسة الصادر بعد حل DNS.

<Note>
  إذا لم يكن أي متغير بيئة لوكيل HTTP(S) مضبوطًا، أو كان المضيف الهدف مستثنى بواسطة
  `NO_PROXY`، يعود `web_fetch` إلى المسار الصارم العادي مع تثبيت DNS
  محلي.
</Note>

## الحدود والسلامة

- يُقيّد `maxChars` إلى `tools.web.fetch.maxCharsCap`
- يُحدّ جسم الاستجابة عند `maxResponseBytes` قبل التحليل؛ وتُقتطع
  الاستجابات كبيرة الحجم مع تحذير
- تُحظر أسماء المضيفين الخاصة/الداخلية
- يُعد `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` تفعيلين اختياريين ضيقين
  لمكدسات وكلاء fake-IP الموثوقة؛ اتركهما غير مضبوطين ما لم يكن وكيلك يمتلك
  تلك النطاقات الاصطناعية ويفرض سياسة وجهته الخاصة
- تُفحص عمليات إعادة التوجيه وتُحد بواسطة `maxRedirects`
- يُعد `useTrustedEnvProxy` تفعيلًا اختياريًا صريحًا ويجب ألا يُمكّن إلا للوكلاء
  الخاضعين لتحكم المشغّل الذين لا يزالون يفرضون سياسة الصادر بعد حل DNS
- `web_fetch` جهدها الأفضل -- بعض المواقع تحتاج إلى [متصفح الويب](/ar/tools/browser)

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

- [بحث الويب](/ar/tools/web) -- ابحث في الويب باستخدام موفرين متعددين
- [متصفح الويب](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع المعتمدة بكثافة على JS
- [Firecrawl](/ar/tools/firecrawl) -- أدوات البحث والكشط من Firecrawl
