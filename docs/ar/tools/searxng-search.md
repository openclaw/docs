---
read_when:
    - تريد مزوّد بحث ويب مستضافًا ذاتيًا
    - تريد استخدام SearXNG لـ `web_search`
    - تحتاج إلى خيار بحث يركّز على الخصوصية أو يعمل في بيئة معزولة عن الشبكة الخارجية
summary: بحث الويب SearXNG -- مزوّد meta-search مستضاف ذاتيًا ومن دون مفتاح
title: بحث SearXNG
x-i18n:
    generated_at: "2026-04-24T08:10:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

يدعم OpenClaw خدمة [SearXNG](https://docs.searxng.org/) كمزوّد `web_search` **مستضاف ذاتيًا ومن دون مفتاح**. SearXNG هو محرك meta-search مفتوح المصدر
يجمع النتائج من Google وBing وDuckDuckGo ومصادر أخرى.

المزايا:

- **مجاني وغير محدود** -- لا حاجة إلى مفتاح API أو اشتراك تجاري
- **الخصوصية / العزل الشبكي** -- لا تغادر الاستعلامات شبكتك أبدًا
- **يعمل في أي مكان** -- لا توجد قيود مناطقية على واجهات API التجارية للبحث

## الإعداد

<Steps>
  <Step title="تشغيل مثيل SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    أو استخدم أي نشر SearXNG موجود لديك صلاحية الوصول إليه. راجع
    [توثيق SearXNG](https://docs.searxng.org/) من أجل إعداد الإنتاج.

  </Step>
  <Step title="التهيئة">
    ```bash
    openclaw configure --section web
    # اختر "searxng" كمزوّد
    ```

    أو اضبط متغير البيئة ودع الاكتشاف التلقائي يعثر عليه:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## التهيئة

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

إعدادات على مستوى Plugin لمثيل SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // اختياري
            language: "en", // اختياري
          },
        },
      },
    },
  },
}
```

يقبل الحقل `baseUrl` أيضًا كائنات SecretRef.

قواعد النقل:

- يعمل `https://` مع مضيفات SearXNG العامة أو الخاصة
- لا يُقبل `http://` إلا لمضيفات الشبكات الخاصة الموثوقة أو loopback
- يجب أن تستخدم مضيفات SearXNG العامة `https://`

## متغير البيئة

اضبط `SEARXNG_BASE_URL` كبديل عن التهيئة:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

عند ضبط `SEARXNG_BASE_URL` وعدم تهيئة مزوّد صريح، يلتقط الاكتشاف التلقائي
SearXNG تلقائيًا (بأدنى أولوية -- أي مزوّد مدعوم بـ API مع
مفتاح يفوز أولًا).

## مرجع تهيئة Plugin

| الحقل        | الوصف                                                               |
| ------------ | ------------------------------------------------------------------- |
| `baseUrl`    | عنوان base URL لمثيل SearXNG لديك (مطلوب)                          |
| `categories` | فئات مفصولة بفواصل مثل `general` أو `news` أو `science`            |
| `language`   | رمز لغة للنتائج مثل `en` أو `de` أو `fr`                           |

## ملاحظات

- **JSON API** -- يستخدم نقطة النهاية الأصلية `format=json` الخاصة بـ SearXNG، وليس scrape لـ HTML
- **لا يوجد مفتاح API** -- يعمل مع أي مثيل SearXNG مباشرةً
- **التحقق من عنوان base URL** -- يجب أن يكون `baseUrl` عنوان URL صالحًا يبدأ بـ `http://` أو `https://`؛ ويجب أن تستخدم المضيفات العامة `https://`
- **ترتيب الاكتشاف التلقائي** -- يُفحص SearXNG أخيرًا (الترتيب 200) في
  الاكتشاف التلقائي. تعمل المزوّدات المدعومة بـ API ذات المفاتيح المهيأة أولًا، ثم
  DuckDuckGo (الترتيب 100)، ثم Ollama Web Search (الترتيب 110)
- **مستضاف ذاتيًا** -- أنت تتحكم في المثيل والاستعلامات ومحركات البحث upstream
- **الفئات** تكون افتراضيًا `general` عند عدم تهيئتها

<Tip>
  لكي تعمل JSON API الخاصة بـ SearXNG، تأكد من أن مثيل SearXNG لديك يحتوي على تنسيق `json`
  مفعّلًا في `settings.yml` تحت `search.formats`.
</Tip>

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [بحث DuckDuckGo](/ar/tools/duckduckgo-search) -- fallback آخر بلا مفتاح
- [Brave Search](/ar/tools/brave-search) -- نتائج منظّمة مع فئة مجانية
