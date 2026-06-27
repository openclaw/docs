---
read_when:
    - تريد جلب عنوان URL واستخراج محتوى قابل للقراءة
    - تحتاج إلى تكوين web_fetch أو البديل الاحتياطي Firecrawl الخاص به
    - تريد فهم حدود web_fetch والتخزين المؤقت
sidebarTitle: Web Fetch
summary: أداة web_fetch -- جلب HTTP مع استخراج محتوى قابل للقراءة
title: جلب الويب
x-i18n:
    generated_at: "2026-06-27T18:47:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

تُجري أداة `web_fetch` طلب HTTP GET عاديًا وتستخرج المحتوى القابل للقراءة
(من HTML إلى markdown أو نص). وهي **لا** تنفّذ JavaScript.

للمواقع كثيفة الاعتماد على JS أو الصفحات المحمية بتسجيل الدخول، استخدم
[متصفح الويب](/ar/tools/browser) بدلًا من ذلك.

## البدء السريع

`web_fetch` **مفعّلة افتراضيًا** -- لا يلزم أي إعداد. يستطيع الوكيل
استدعاءها فورًا:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## معاملات الأداة

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
  <Step title="Fetch">
    يرسل طلب HTTP GET باستخدام User-Agent مشابه لـ Chrome وترويسة
    `Accept-Language`. يحظر أسماء المضيفين الخاصة/الداخلية ويعيد فحص عمليات إعادة التوجيه.
  </Step>
  <Step title="Extract">
    يشغّل Readability (استخراج المحتوى الرئيسي) على استجابة HTML.
  </Step>
  <Step title="Fallback (optional)">
    إذا فشل Readability وكان Firecrawl محددًا، يعيد المحاولة عبر
    Firecrawl API بوضع تجاوز البوتات.
  </Step>
  <Step title="Cache">
    تُخزّن النتائج مؤقتًا لمدة 15 دقيقة (قابلة للإعداد) لتقليل عمليات
    الجلب المتكررة لنفس عنوان URL.
  </Step>
</Steps>

## تحديثات التقدم

تصدر `web_fetch` سطر تقدم عامًا فقط عندما يظل الجلب معلقًا
بعد خمس ثوانٍ:

```text
Fetching page content...
```

تنتهي إصابات التخزين المؤقت السريعة واستجابات الشبكة السريعة قبل تشغيل المؤقت، لذلك
لا تعرض سطر تقدم. إذا أُلغيت الاستدعاء، يُمسح المؤقت.
عندما يكتمل الجلب في النهاية، يتلقى الوكيل نتيجة الأداة العادية؛
سطر التقدم هو حالة واجهة قناة فقط ولا يحتوي أبدًا على محتوى الصفحة
المجلوب.

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

## احتياطي Firecrawl

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` اختياري ويدعم كائنات SecretRef.
تُرحّل إعدادات `tools.web.fetch.firecrawl.*` القديمة تلقائيًا بواسطة `openclaw doctor --fix`.

<Note>
  إذا أعددت Firecrawl API-key SecretRef ولم يُحلّ مع عدم وجود
  بديل env باسم `FIRECRAWL_API_KEY`، يفشل بدء تشغيل Gateway بسرعة.
</Note>

<Note>
  تجاوزات `baseUrl` في Firecrawl مقيّدة بإحكام: تستخدم الحركة المستضافة
  `https://api.firecrawl.dev`؛ ويجب أن تستهدف تجاوزات الاستضافة الذاتية نقاط نهاية خاصة أو
  داخلية، ولا يُقبل `http://` إلا لتلك الأهداف الخاصة.
</Note>

سلوك وقت التشغيل الحالي:

- يحدد `tools.web.fetch.provider` مزود احتياطي الجلب صراحةً.
- إذا حُذف `provider`، يكتشف OpenClaw تلقائيًا أول مزود web-fetch جاهز
  من بيانات الاعتماد المعدّة. يمكن لاستدعاء `web_fetch` غير المعزول استخدام
  Plugins المثبتة التي تعلن `contracts.webFetchProviders` وتسجل
  مزودًا مطابقًا في وقت التشغيل. يوفر Plugin الرسمي لـ Firecrawl هذا
  الاحتياطي.
- تسمح استدعاءات `web_fetch` المعزولة بالمزودين المضمّنين بالإضافة إلى المزودين المثبتين
  الذين جرى التحقق من مصدرهم الرسمي عبر npm أو ClawHub. حاليًا يسمح ذلك
  بـ Plugin الرسمي لـ Firecrawl؛ وتظل Plugins الجلب الخارجية التابعة لأطراف ثالثة مستبعدة.
- إذا عُطّل Readability، تتجاوز `web_fetch` مباشرة إلى احتياطي
  المزود المحدد. إذا لم يتوفر أي مزود، تفشل بإغلاق آمن.

## وكيل env موثوق

إذا كان نشرُك يتطلب أن تمر `web_fetch` عبر وكيل HTTP(S) صادر
موثوق، فاضبط `tools.web.fetch.useTrustedEnvProxy: true`.

في هذا الوضع، يظل OpenClaw يطبق فحوصات SSRF المستندة إلى اسم المضيف قبل إرسال
الطلب، لكنه يترك للوكيل حل DNS بدلًا من تثبيت DNS المحلي.
فعّل هذا فقط عندما يكون الوكيل خاضعًا لتحكم المشغّل ويفرض
سياسة الخروج بعد حل DNS.

<Note>
  إذا لم يكن أي متغير env لوكيل HTTP(S) معدًا، أو كان المضيف الهدف مستبعدًا بواسطة
  `NO_PROXY`، تعود `web_fetch` إلى المسار الصارم العادي مع تثبيت DNS
  المحلي.
</Note>

## الحدود والسلامة

- يُقيّد `maxChars` إلى `tools.web.fetch.maxCharsCap`
- يُحدّ جسم الاستجابة عند `maxResponseBytes` قبل التحليل؛ وتُقتطع
  الاستجابات كبيرة الحجم مع تحذير
- تُحظر أسماء المضيفين الخاصة/الداخلية
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` هما خيارا تفعيل ضيقان
  لمكدسات وكلاء fake-IP الموثوقة؛ اتركهما غير مضبوطين ما لم يكن وكيلك يملك
  تلك النطاقات الاصطناعية ويفرض سياسة الوجهة الخاصة به
- تُفحص عمليات إعادة التوجيه وتُحد بواسطة `maxRedirects`
- `useTrustedEnvProxy` خيار تفعيل صريح ويجب ألا يُفعّل إلا للوكلاء
  الخاضعين لتحكم المشغّل الذين ما زالوا يفرضون سياسة الخروج بعد حل DNS
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

## ذات صلة

- [بحث الويب](/ar/tools/web) -- ابحث في الويب باستخدام مزودين متعددين
- [متصفح الويب](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع كثيفة الاعتماد على JS
- [Firecrawl](/ar/tools/firecrawl) -- أدوات بحث وكشط Firecrawl
