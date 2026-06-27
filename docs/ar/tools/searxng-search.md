---
read_when:
    - تريد موفّر بحث ويب مستضافًا ذاتيًا
    - تريد استخدام SearXNG من أجل web_search
    - تحتاج إلى خيار بحث يركز على الخصوصية أو معزول عن الشبكة.
summary: بحث الويب SearXNG -- موفر بحث وصفي مستضاف ذاتيًا وبدون مفتاح
title: بحث SearXNG
x-i18n:
    generated_at: "2026-06-27T18:44:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

يدعم OpenClaw [SearXNG](https://docs.searxng.org/) بوصفه موفّر `web_search` **مستضافًا ذاتيًا
ومن دون مفاتيح**. SearXNG هو محرك بحث تلوي مفتوح المصدر
يجمع النتائج من Google وBing وDuckDuckGo ومصادر أخرى.

المزايا:

- **مجاني وغير محدود** -- لا يلزم مفتاح API أو اشتراك تجاري
- **الخصوصية / العزل الشبكي** -- لا تغادر الاستعلامات شبكتك أبدًا
- **يعمل في أي مكان** -- لا توجد قيود مناطق على واجهات API التجارية للبحث

## الإعداد

<Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="شغّل مثيل SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    أو استخدم أي نشر SearXNG قائم يمكنك الوصول إليه. راجع
    [توثيق SearXNG](https://docs.searxng.org/) لإعداد الإنتاج.

  </Step>
  <Step title="اضبط الإعدادات">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    أو عيّن متغير البيئة ودع الاكتشاف التلقائي يعثر عليه:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## التكوين

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

إعدادات مستوى Plugin لمثيل SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

يقبل الحقل `baseUrl` أيضًا كائنات SecretRef.

قواعد النقل:

- يعمل `https://` لمضيفي SearXNG العامين أو الخاصين
- لا يُقبل `http://` إلا لمضيفي الشبكات الخاصة الموثوقة أو مضيفي loopback
- يجب أن يستخدم مضيفو SearXNG العامون `https://`
- تستخدم المضيفات الخاصة/الداخلية حارس الشبكة المستضافة ذاتيًا؛ وتبقى مضيفات `https://`
  العامة على حارس بحث الويب الصارم ولا يمكنها إعادة التوجيه إلى عناوين خاصة

## متغير البيئة

عيّن `SEARXNG_BASE_URL` كبديل للتكوين:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

عند تعيين `SEARXNG_BASE_URL` وعدم تكوين موفّر صريح، يختار الاكتشاف التلقائي
SearXNG تلقائيًا (بأدنى أولوية -- أي موفّر مدعوم بواجهة API مع
مفتاح يفوز أولًا).

## مرجع تكوين Plugin

| الحقل        | الوصف                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | عنوان URL الأساسي لمثيل SearXNG لديك (مطلوب)                       |
| `categories` | فئات مفصولة بفواصل مثل `general` أو `news` أو `science` |
| `language`   | رمز اللغة للنتائج مثل `en` أو `de` أو `fr`              |

## ملاحظات

- **واجهة JSON API** -- تستخدم نقطة نهاية SearXNG الأصلية `format=json`، وليس استخلاص HTML
- **عناوين URL لنتائج الصور** -- تتضمن نتائج فئة الصور `img_src` عندما يعيد SearXNG
  عنوان URL مباشرًا للصورة
- **لا يوجد مفتاح API** -- يعمل مع أي مثيل SearXNG مباشرةً
- **التحقق من عنوان URL الأساسي** -- يجب أن يكون `baseUrl` عنوان URL صالحًا يبدأ بـ `http://` أو `https://`؛
  ويجب أن تستخدم المضيفات العامة `https://`
- **حارس الشبكة** -- تختار نقاط نهاية SearXNG الخاصة/الداخلية الاشتراك في
  الوصول إلى الشبكة الخاصة؛ وتحافظ نقاط نهاية SearXNG العامة عبر `https://` على حماية SSRF
  الصارمة
- **ترتيب الاكتشاف التلقائي** -- يتم فحص SearXNG بعد الموفّرين المدعومين بواجهات API
  الذين لديهم مفاتيح مكوّنة (الترتيب 200). لا يتم تحديد الموفّرين بلا مفاتيح مثل DuckDuckGo أو
  Ollama Web Search تلقائيًا من دون اختيار موفّر صريح
- **مستضاف ذاتيًا** -- أنت تتحكم في المثيل والاستعلامات ومحركات البحث العليا
- تضبط **الفئات** افتراضيًا على `general` عند عدم تكوينها
- **الرجوع الاحتياطي للفئة** -- إذا نجح طلب فئة غير `general` لكنه
  أعاد صفر نتائج، يعيد OpenClaw محاولة الاستعلام نفسه مرة واحدة باستخدام `general`
  قبل إرجاع مجموعة نتائج فارغة

<Tip>
  لكي تعمل واجهة SearXNG JSON API، تأكد من أن مثيل SearXNG لديك مفعّل فيه تنسيق `json`
  في ملف `settings.yml` ضمن `search.formats`.
</Tip>

## ذات صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [بحث DuckDuckGo](/ar/tools/duckduckgo-search) -- موفّر آخر بلا مفاتيح
- [بحث Brave](/ar/tools/brave-search) -- نتائج منظمة مع طبقة مجانية
