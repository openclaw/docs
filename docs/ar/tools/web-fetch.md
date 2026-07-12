---
read_when:
    - تريد جلب عنوان URL واستخراج محتوى قابل للقراءة
    - تحتاج إلى تهيئة `web_fetch` أو البديل الاحتياطي له، Firecrawl
    - تريد فهم حدود web_fetch والتخزين المؤقت
sidebarTitle: Web Fetch
summary: أداة web_fetch — جلب عبر HTTP مع استخراج محتوى قابل للقراءة
title: جلب الويب
x-i18n:
    generated_at: "2026-07-12T06:44:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

تُجري `web_fetch` طلب HTTP GET عاديًا وتستخرج المحتوى المقروء (من HTML إلى
markdown أو نص). وهي **لا** تنفّذ JavaScript. للمواقع التي تعتمد بكثافة على JS أو
الصفحات المحمية بتسجيل الدخول، استخدم [متصفح الويب](/ar/tools/browser) بدلًا منها.

## البدء السريع

مفعّلة افتراضيًا، ولا تحتاج إلى إعداد:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## معاملات الأداة

<ParamField path="url" type="string" required>
عنوان URL المطلوب جلبه. بروتوكول `http(s)` فقط.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
تنسيق الإخراج بعد استخراج المحتوى الرئيسي.
</ParamField>

<ParamField path="maxChars" type="number">
اقتطاع الإخراج عند هذا العدد من المحارف. يُقيَّد وفق `tools.web.fetch.maxCharsCap`.
</ParamField>

## آلية العمل

<Steps>
  <Step title="الجلب">
    يرسل طلب HTTP GET مع وكيل مستخدم شبيه بمتصفح Chrome وترويسة
    `Accept-Language`. ويحظر أسماء المضيفين الخاصة/الداخلية ويعيد التحقق من عمليات إعادة التوجيه.
  </Step>
  <Step title="الاستخراج">
    يشغّل Readability (استخراج المحتوى الرئيسي) على استجابة HTML.
  </Step>
  <Step title="المسار الاحتياطي (اختياري)">
    إذا فشل Readability وكان موفّر الجلب متاحًا، يعيد المحاولة عبر
    ذلك الموفّر (مثل وضع تجاوز حماية الروبوتات في Firecrawl).
  </Step>
  <Step title="ذاكرة التخزين المؤقت">
    تُخزَّن النتائج مؤقتًا لمدة 15 دقيقة (قابلة للضبط) لتقليل عمليات
    الجلب المتكررة لعنوان URL نفسه.
  </Step>
</Steps>

## تحديثات التقدم

تُصدر `web_fetch` سطر تقدم عامًا فقط إذا ظل الجلب معلّقًا
بعد خمس ثوانٍ:

```text
جارٍ جلب محتوى الصفحة...
```

تكتمل إصابات ذاكرة التخزين المؤقت السريعة واستجابات الشبكة السريعة قبل تشغيل المؤقت، ولذلك
لا تعرض سطر تقدم مطلقًا. يؤدي إلغاء الاستدعاء إلى مسح المؤقت. سطر
التقدم هو حالة لواجهة مستخدم القناة فقط، ولا يتضمن أبدًا محتوى الصفحة المجلوب.

## الإعداد

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // الافتراضي: true
        provider: "firecrawl", // اختياري؛ احذفه للاكتشاف التلقائي
        maxChars: 20000, // محارف الإخراج الافتراضية؛ مقيّدة بواسطة maxCharsCap
        maxCharsCap: 20000, // الحد الأقصى الصارم لمعامل maxChars
        maxResponseBytes: 750000, // الحد الأقصى لحجم التنزيل قبل الاقتطاع (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // السماح لوكيل بيئة HTTP(S) موثوق بحل DNS
        readability: true, // استخدام استخراج Readability
        userAgent: "Mozilla/5.0 ...", // تجاوز وكيل المستخدم
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // اشتراك صريح لوكلاء عناوين IP الوهمية الموثوقين الذين يستخدمون 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // اشتراك صريح لوكلاء عناوين IP الوهمية الموثوقين الذين يستخدمون fc00::/7
        },
      },
    },
  },
}
```

## المسار الاحتياطي عبر Firecrawl

إذا فشل استخراج Readability، يمكن لـ `web_fetch` الرجوع إلى
[Firecrawl](/ar/tools/firecrawl) لتجاوز حماية الروبوتات وتحسين الاستخراج:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // اختياري؛ احذفه للاكتشاف التلقائي من بيانات الاعتماد المتاحة
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // اختياري؛ احذفه للوصول المبدئي دون مفتاح
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // مدة التخزين المؤقت (يومان)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

المفتاح `plugins.entries.firecrawl.config.webFetch.apiKey` اختياري ويدعم كائنات SecretRef.
يُنقل إعداد `tools.web.fetch.firecrawl.*` القديم تلقائيًا إلى
`plugins.entries.firecrawl.config.webFetch` عبر `openclaw doctor --fix`.

<Note>
  إذا أعددت SecretRef لمفتاح Firecrawl API وتعذّر حله دون وجود
  قيمة احتياطية في متغير البيئة `FIRECRAWL_API_KEY`، يفشل تشغيل Gateway فورًا.
</Note>

<Note>
  تخضع تجاوزات `baseUrl` في Firecrawl لقيود صارمة: تستخدم حركة البيانات المستضافة
  `https://api.firecrawl.dev`؛ ويجب أن تستهدف التجاوزات ذاتية الاستضافة نقاط نهاية خاصة أو
  داخلية، ولا يُقبل `http://` إلا لتلك الوجهات الخاصة.
</Note>

سلوك وقت التشغيل الحالي:

- يحدد `tools.web.fetch.provider` موفّر الجلب الاحتياطي صراحةً.
- إذا حُذف `provider`، يكتشف OpenClaw تلقائيًا أول موفّر جاهز لجلب الويب
  من بيانات الاعتماد المضبوطة. يمكن لاستدعاءات `web_fetch` غير المعزولة استخدام
  Plugins المثبّتة التي تعلن `contracts.webFetchProviders` وتسجّل
  موفّرًا مطابقًا في وقت التشغيل. يوفّر Plugin الرسمي لـ Firecrawl هذا
  المسار الاحتياطي حاليًا.
- تسمح استدعاءات `web_fetch` المعزولة بالموفّرين المضمّنين، إضافةً إلى الموفّرين المثبّتين
  الذين ثبت مصدرهم الرسمي من npm أو ClawHub. يتيح ذلك حاليًا
  Plugin الرسمي لـ Firecrawl؛ وتظل Plugins الخارجية التابعة لجهات خارجية مستبعدة.
- إذا عُطّل Readability، تنتقل `web_fetch` مباشرةً إلى مسار
  الموفّر الاحتياطي المحدد. وإذا لم يتوفر موفّر، تفشل بصورة مغلقة.

## وكيل البيئة الموثوق

إذا كان نشرك يتطلب مرور `web_fetch` عبر وكيل HTTP(S) صادر
موثوق، فاضبط `tools.web.fetch.useTrustedEnvProxy: true`.

في هذا الوضع، يواصل OpenClaw تطبيق فحوص SSRF المعتمدة على اسم المضيف قبل إرسال
الطلب، لكنه يسمح للوكيل بحل DNS بدلًا من إجراء تثبيت DNS
محلي. فعّل هذا فقط عندما يكون الوكيل تحت تحكم المشغّل ويفرض
سياسة الاتصالات الصادرة بعد حل DNS.

<Note>
  إذا لم يُضبط متغير بيئة لوكيل HTTP(S)، أو كان المضيف المستهدف مستبعدًا بواسطة
  `NO_PROXY`، تعود `web_fetch` إلى المسار الصارم العادي مع تثبيت DNS
  المحلي.
</Note>

## الحدود والسلامة

- يُقيَّد `maxChars` وفق `tools.web.fetch.maxCharsCap` (الافتراضي `20000`)
- يُقيَّد نص الاستجابة عند `maxResponseBytes` (الافتراضي `750000`، ومقيّد بالنطاق
  32000-10000000) قبل التحليل؛ وتُقتطع الاستجابات كبيرة الحجم مع تحذير
- تُحظر أسماء المضيفين الخاصة/الداخلية
- يُعد `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` و
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` خيارين ضيقين يتطلبان اشتراكًا صريحًا
  لحزم وكلاء عناوين IP الوهمية الموثوقة؛ اتركهما دون ضبط ما لم يكن وكيلك يملك
  تلك النطاقات الاصطناعية ويفرض سياسة الوجهات الخاصة به
- تُفحص عمليات إعادة التوجيه وتُحد وفق `maxRedirects` (الافتراضي `3`)
- يُعد `useTrustedEnvProxy` اشتراكًا صريحًا، وينبغي تفعيله فقط للوكلاء
  الخاضعين لتحكم المشغّل الذين يواصلون فرض سياسة الاتصالات الصادرة بعد حل DNS
- تعمل `web_fetch` وفق أفضل جهد ممكن — تحتاج بعض المواقع إلى [متصفح الويب](/ar/tools/browser)

## ملفات تعريف الأدوات

إذا كنت تستخدم ملفات تعريف الأدوات أو قوائم السماح، فأضف `web_fetch` أو `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // أو: allow: ["group:web"]  (يتضمن web_fetch وweb_search وx_search)
  },
}
```

## موضوعات ذات صلة

- [بحث الويب](/ar/tools/web) — البحث في الويب باستخدام عدة موفّرين
- [متصفح الويب](/ar/tools/browser) — أتمتة كاملة للمتصفح للمواقع التي تعتمد بكثافة على JS
- [Firecrawl](/ar/tools/firecrawl) — أدوات Firecrawl للبحث والاستخراج
