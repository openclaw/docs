---
read_when:
    - تريد مزود بحث ويب مستضافًا ذاتيًا
    - تريد استخدام SearXNG من أجل web_search
    - تحتاج إلى خيار بحث يركز على الخصوصية أو معزول عن الشبكة
summary: بحث الويب عبر SearXNG -- موفّر بحث تلوي مستضاف ذاتيًا ولا يتطلب مفتاحًا
title: بحث SearXNG
x-i18n:
    generated_at: "2026-05-02T07:46:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8743325d4d4fdccad04956154bb87b1bd7f7155fb063a09cee3733a73e8d0c30
    source_path: tools/searxng-search.md
    workflow: 16
---

يدعم OpenClaw [SearXNG](https://docs.searxng.org/) كمزوّد `web_search` **ذاتي الاستضافة
ومن دون مفتاح**. SearXNG هو محرك بحث تجميعي مفتوح المصدر
يجمع النتائج من Google وBing وDuckDuckGo ومصادر أخرى.

المزايا:

- **مجاني وغير محدود** -- لا يلزم مفتاح API أو اشتراك تجاري
- **الخصوصية / العزل الشبكي** -- لا تغادر الاستعلامات شبكتك أبدًا
- **يعمل في أي مكان** -- لا توجد قيود مناطقية على واجهات API للبحث التجارية

## الإعداد

<Steps>
  <Step title="تشغيل نسخة SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    أو استخدم أي نشر SearXNG موجود يمكنك الوصول إليه. راجع
    [وثائق SearXNG](https://docs.searxng.org/) لإعداد الإنتاج.

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

إعدادات على مستوى Plugin لنسخة SearXNG:

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

يقبل حقل `baseUrl` أيضًا كائنات SecretRef.

قواعد النقل:

- يعمل `https://` مع مضيفي SearXNG العامين أو الخاصين
- لا يُقبل `http://` إلا لمضيفي الشبكات الخاصة الموثوقة أو مضيفي loopback
- يجب أن يستخدم مضيفو SearXNG العامون `https://`
- يستخدم المضيفون الخاصون/الداخليون حارس الشبكة ذاتية الاستضافة؛ أما مضيفو `https://`
  العامون فيبقون على حارس بحث الويب الصارم ولا يمكنهم إعادة التوجيه إلى عناوين
  خاصة

## متغير البيئة

عيّن `SEARXNG_BASE_URL` كبديل للتكوين:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

عند تعيين `SEARXNG_BASE_URL` وعدم تكوين مزوّد صريح، يختار الاكتشاف التلقائي
SearXNG تلقائيًا (بأدنى أولوية -- أي مزوّد مدعوم بواجهة API ولديه
مفتاح يفوز أولًا).

## مرجع تكوين Plugin

| الحقل        | الوصف                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | عنوان URL الأساسي لنسخة SearXNG الخاصة بك (مطلوب)                       |
| `categories` | فئات مفصولة بفواصل مثل `general` أو `news` أو `science` |
| `language`   | رمز اللغة للنتائج مثل `en` أو `de` أو `fr`              |

## ملاحظات

- **واجهة API بصيغة JSON** -- تستخدم نقطة نهاية SearXNG الأصلية `format=json`، وليس استخراج HTML
- **عناوين URL لنتائج الصور** -- تتضمن نتائج فئة الصور `img_src` عندما يُرجع SearXNG
  عنوان URL مباشرًا للصورة
- **لا يوجد مفتاح API** -- يعمل مع أي نسخة SearXNG مباشرة دون إعداد إضافي
- **التحقق من عنوان URL الأساسي** -- يجب أن يكون `baseUrl` عنوان URL صالحًا من نوع `http://` أو `https://`؛
  ويجب أن يستخدم المضيفون العامون `https://`
- **حارس الشبكة** -- تختار نقاط نهاية SearXNG الخاصة/الداخلية السماح
  بالوصول إلى الشبكة الخاصة؛ وتحتفظ نقاط نهاية SearXNG العامة عبر `https://` بحماية SSRF
  الصارمة
- **ترتيب الاكتشاف التلقائي** -- يُفحص SearXNG أخيرًا (الترتيب 200) في
  الاكتشاف التلقائي. تعمل المزوّدات المدعومة بواجهة API والمفاتيح المكوّنة أولًا، ثم
  DuckDuckGo (الترتيب 100)، ثم Ollama Web Search (الترتيب 110)
- **ذاتي الاستضافة** -- أنت تتحكم في النسخة والاستعلامات ومحركات البحث العليا
- **الفئات** تكون افتراضيًا `general` عند عدم تكوينها

<Tip>
  لكي تعمل واجهة API بصيغة JSON الخاصة بـ SearXNG، تأكد من أن نسخة SearXNG لديك مفعّل فيها تنسيق `json`
  في `settings.yml` ضمن `search.formats`.
</Tip>

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [بحث DuckDuckGo](/ar/tools/duckduckgo-search) -- بديل آخر من دون مفتاح
- [بحث Brave](/ar/tools/brave-search) -- نتائج منظّمة مع فئة مجانية
