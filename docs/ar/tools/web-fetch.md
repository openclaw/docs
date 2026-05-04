---
read_when:
    - تريد جلب عنوان URL واستخراج محتوى قابل للقراءة
    - تحتاج إلى تكوين web_fetch أو خيار Firecrawl الاحتياطي الخاص به
    - تريد فهم قيود web_fetch والتخزين المؤقت
sidebarTitle: Web Fetch
summary: أداة web_fetch -- جلب HTTP مع استخراج المحتوى القابل للقراءة
title: جلب من الويب
x-i18n:
    generated_at: "2026-05-04T07:12:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

تقوم أداة `web_fetch` بتنفيذ HTTP GET عادي واستخراج محتوى قابل للقراءة
(من HTML إلى markdown أو نص). وهي **لا** تنفّذ JavaScript.

بالنسبة إلى المواقع المعتمدة بكثافة على JS أو الصفحات المحمية بتسجيل الدخول، استخدم
[متصفح الويب](/ar/tools/browser) بدلاً منها.

## البدء السريع

تكون `web_fetch` **مفعّلة افتراضيًا** -- ولا تحتاج إلى أي إعداد. يمكن للوكيل
استدعاؤها فورًا:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## معاملات الأداة

<ParamField path="url" type="string" required>
عنوان URL المراد جلبه. `http(s)` فقط.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
تنسيق المخرجات بعد استخراج المحتوى الرئيسي.
</ParamField>

<ParamField path="maxChars" type="number">
اقتطاع المخرجات إلى هذا العدد من الأحرف.
</ParamField>

## كيفية عملها

<Steps>
  <Step title="Fetch">
    ترسل HTTP GET مع رأس User-Agent شبيه بـ Chrome ورأس `Accept-Language`.
    تحظر أسماء المضيفين الخاصة/الداخلية وتعيد التحقق من عمليات إعادة التوجيه.
  </Step>
  <Step title="Extract">
    تشغّل Readability (استخراج المحتوى الرئيسي) على استجابة HTML.
  </Step>
  <Step title="Fallback (optional)">
    إذا فشل Readability وكان Firecrawl معدًّا، تعيد المحاولة عبر
    Firecrawl API باستخدام وضع تجاوز البوتات.
  </Step>
  <Step title="Cache">
    تُخزّن النتائج مؤقتًا لمدة 15 دقيقة (قابلة للإعداد) لتقليل عمليات
    الجلب المتكررة لنفس عنوان URL.
  </Step>
</Steps>

## الإعدادات

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

## بديل Firecrawl الاحتياطي

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
تتم ترحيل إعدادات `tools.web.fetch.firecrawl.*` القديمة تلقائيًا بواسطة `openclaw doctor --fix`.

<Note>
  إذا كان Firecrawl مفعّلًا وكان SecretRef الخاص به غير محلول من دون بديل بيئة
  `FIRECRAWL_API_KEY`، يفشل بدء تشغيل Gateway بسرعة.
</Note>

<Note>
  تكون تجاوزات `baseUrl` في Firecrawl مقيدة بإحكام: تستخدم حركة المرور المستضافة
  `https://api.firecrawl.dev`؛ ويجب أن تستهدف التجاوزات المستضافة ذاتيًا نقاط نهاية خاصة أو
  داخلية، ولا يُقبل `http://` إلا لتلك الأهداف الخاصة.
</Note>

سلوك وقت التشغيل الحالي:

- يحدد `tools.web.fetch.provider` موفّر بديل الجلب الاحتياطي صراحةً.
- إذا حُذف `provider`، يكتشف OpenClaw تلقائيًا أول موفّر web-fetch جاهز
  من بيانات الاعتماد المتاحة. يمكن لاستدعاءات `web_fetch` غير المعزولة استخدام
  Plugins المثبتة التي تعلن `contracts.webFetchProviders` وتسجل موفّرًا
  مطابقًا في وقت التشغيل. حاليًا الموفّر المضمّن هو Firecrawl.
- تظل استدعاءات `web_fetch` المعزولة محدودة بالموفّرين المضمّنين.
- إذا عُطّل Readability، تتجاوز `web_fetch` مباشرةً إلى بديل
  الموفّر المحدد. إذا لم يتوفر أي موفّر، تفشل بإغلاق آمن.

## وكيل البيئة الموثوق

إذا كان النشر لديك يتطلب مرور `web_fetch` عبر وكيل صادر موثوق
HTTP(S)، فعيّن `tools.web.fetch.useTrustedEnvProxy: true`.

في هذا الوضع، لا يزال OpenClaw يطبق فحوصات SSRF المستندة إلى اسم المضيف قبل إرسال
الطلب، لكنه يسمح للوكيل بحل DNS بدلاً من تنفيذ تثبيت DNS المحلي.
فعّل هذا فقط عندما يكون الوكيل خاضعًا لسيطرة المشغّل ويفرض
سياسة الخروج بعد حل DNS.

<Note>
  إذا لم يكن أي متغير بيئة لوكيل HTTP(S) معدًّا، أو كان المضيف الهدف مستبعدًا بواسطة
  `NO_PROXY`، تعود `web_fetch` إلى المسار الصارم العادي مع تثبيت DNS
  المحلي.
</Note>

## الحدود والسلامة

- يُقيّد `maxChars` إلى `tools.web.fetch.maxCharsCap`
- يُحدّد حجم نص الاستجابة عند `maxResponseBytes` قبل التحليل؛ وتُقتطع
  الاستجابات كبيرة الحجم مع تحذير
- تُحظر أسماء المضيفين الخاصة/الداخلية
- يُعد `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` خيارين ضيقين للاشتراك
  لمكدسات وكلاء fake-IP الموثوقة؛ اتركهما غير معيّنين ما لم يكن الوكيل لديك يملك
  تلك النطاقات الاصطناعية ويفرض سياسة وجهته الخاصة
- تُفحص عمليات إعادة التوجيه وتُحد بواسطة `maxRedirects`
- يُعد `useTrustedEnvProxy` اشتراكًا صريحًا ويجب تفعيله فقط للوكلاء
  الخاضعين لسيطرة المشغّل الذين لا يزالون يفرضون سياسة الخروج بعد حل DNS
- تعمل `web_fetch` بأفضل جهد -- بعض المواقع تحتاج إلى [متصفح الويب](/ar/tools/browser)

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

- [بحث الويب](/ar/tools/web) -- البحث في الويب باستخدام عدة موفّرين
- [متصفح الويب](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع المعتمدة بكثافة على JS
- [Firecrawl](/ar/tools/firecrawl) -- أدوات بحث وكشط Firecrawl
