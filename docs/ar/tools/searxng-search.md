---
read_when:
    - تريد موفّر بحث ويب مستضافًا ذاتيًا
    - تريد استخدام SearXNG لـ web_search
    - تحتاج إلى خيار بحث يركز على الخصوصية أو معزول عن الشبكة
summary: بحث الويب عبر SearXNG -- مزوّد بحث تلوي مستضاف ذاتيًا ولا يتطلب مفاتيح
title: بحث SearXNG
x-i18n:
    generated_at: "2026-05-02T21:04:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

يدعم OpenClaw ‏[SearXNG](https://docs.searxng.org/) بصفته موفر `web_search` **مستضافًا ذاتيًا،
وبدون مفتاح**. SearXNG هو محرك بحث تلوي مفتوح المصدر
يجمع النتائج من Google وBing وDuckDuckGo ومصادر أخرى.

المزايا:

- **مجاني وغير محدود** -- لا يلزم مفتاح API أو اشتراك تجاري
- **الخصوصية / العزل الشبكي** -- لا تغادر الاستعلامات شبكتك أبدًا
- **يعمل في أي مكان** -- لا توجد قيود إقليمية على واجهات API البحث التجارية

## الإعداد

<Steps>
  <Step title="تشغيل مثيل SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    أو استخدم أي نشر SearXNG موجود لديك حق الوصول إليه. راجع
    [توثيق SearXNG](https://docs.searxng.org/) لإعداد الإنتاج.

  </Step>
  <Step title="التكوين">
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
- لا يُقبل `http://` إلا للمضيفين الموثوقين على الشبكة الخاصة أو مضيفي loopback
- يجب أن يستخدم مضيفو SearXNG العامون `https://`
- تستخدم المضيفات الخاصة/الداخلية حارس الشبكة المستضافة ذاتيًا؛ وتبقى مضيفات `https://`
  العامة على حارس بحث الويب الصارم ولا يمكنها إعادة التوجيه إلى عناوين
  خاصة

## متغير البيئة

عيّن `SEARXNG_BASE_URL` كبديل للتكوين:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

عند تعيين `SEARXNG_BASE_URL` وعدم تكوين موفر صراحةً، يختار الاكتشاف التلقائي
SearXNG تلقائيًا (بأدنى أولوية -- أي موفر مدعوم بواجهة API وله
مفتاح يفوز أولًا).

## مرجع تكوين Plugin

| الحقل        | الوصف                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | عنوان URL الأساسي لمثيل SearXNG الخاص بك (مطلوب)                       |
| `categories` | فئات مفصولة بفواصل مثل `general` أو `news` أو `science` |
| `language`   | رمز لغة للنتائج مثل `en` أو `de` أو `fr`              |

## ملاحظات

- **واجهة API بتنسيق JSON** -- تستخدم نقطة نهاية `format=json` الأصلية في SearXNG، وليس كشط HTML
- **عناوين URL لنتائج الصور** -- تتضمن نتائج فئة الصور `img_src` عندما يعيد SearXNG
  عنوان URL مباشرًا للصورة
- **لا يوجد مفتاح API** -- يعمل مع أي مثيل SearXNG مباشرةً
- **التحقق من عنوان URL الأساسي** -- يجب أن يكون `baseUrl` عنوان URL صالحًا يبدأ بـ `http://` أو `https://`؛
  ويجب أن تستخدم المضيفات العامة `https://`
- **حارس الشبكة** -- تختار نقاط نهاية SearXNG الخاصة/الداخلية الاشتراك في
  الوصول إلى الشبكة الخاصة؛ وتحتفظ نقاط نهاية SearXNG العامة عبر `https://` بحماية SSRF
  الصارمة
- **ترتيب الاكتشاف التلقائي** -- يُفحص SearXNG أخيرًا (الترتيب 200) في
  الاكتشاف التلقائي. تعمل الموفرات المدعومة بواجهة API والمكوّنة بمفاتيح أولًا، ثم
  DuckDuckGo (الترتيب 100)، ثم Ollama Web Search (الترتيب 110)
- **مستضاف ذاتيًا** -- أنت تتحكم في المثيل والاستعلامات ومحركات البحث upstream
- **الفئات** تكون افتراضيًا `general` عند عدم تكوينها
- **الرجوع الاحتياطي للفئة** -- إذا نجح طلب فئة غير `general` لكنه
  أعاد صفر نتائج، يعيد OpenClaw محاولة الاستعلام نفسه مرة واحدة باستخدام `general`
  قبل إرجاع مجموعة نتائج فارغة

<Tip>
  لكي تعمل واجهة SearXNG JSON API، تأكد من أن مثيل SearXNG لديك مفعّل فيه تنسيق `json`
  في ملف `settings.yml` تحت `search.formats`.
</Tip>

## ذات صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع الموفرين والاكتشاف التلقائي
- [بحث DuckDuckGo](/ar/tools/duckduckgo-search) -- بديل آخر بدون مفتاح
- [بحث Brave](/ar/tools/brave-search) -- نتائج منظمة مع طبقة مجانية
