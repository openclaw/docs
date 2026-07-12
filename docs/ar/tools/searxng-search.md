---
read_when:
    - تريد موفّر بحث ويب مستضافًا ذاتيًا
    - تريد استخدام SearXNG لإجراء البحث على الويب
    - تحتاج إلى خيار بحث يركز على الخصوصية أو يعمل ضمن شبكة معزولة تمامًا
summary: بحث الويب عبر SearXNG — موفّر بحث تجميعي مستضاف ذاتيًا ولا يتطلب مفتاحًا
title: بحث SearXNG
x-i18n:
    generated_at: "2026-07-12T06:42:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

يدعم OpenClaw ‏[SearXNG](https://docs.searxng.org/) بوصفه مزوّدًا لأداة `web_search` **مستضافًا ذاتيًا
ولا يتطلب مفتاحًا**. ‏SearXNG هو محرك بحث تجميعي مفتوح المصدر
يجمع النتائج من Google وBing وDuckDuckGo ومصادر أخرى.

المزايا:

- **مجاني وغير محدود** -- لا يتطلب مفتاح API أو اشتراكًا تجاريًا
- **الخصوصية / العزل الشبكي** -- لا تغادر الاستعلامات شبكتك مطلقًا
- **يعمل في أي مكان** -- لا توجد قيود إقليمية لواجهات API التجارية للبحث

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

    أو استخدم أي نشر حالي لـ SearXNG يمكنك الوصول إليه. راجع
    [توثيق SearXNG](https://docs.searxng.org/) لإعداد بيئة الإنتاج.

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

## الإعدادات

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

إعدادات مثيل SearXNG على مستوى Plugin:

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

يقبل `baseUrl` أيضًا كائن SecretRef (مثل `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## متغير البيئة

عيّن `SEARXNG_BASE_URL` بديلًا للإعدادات:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

ترتيب الحل: سلسلة `baseUrl` المضبوطة، ثم SecretRef مضمن للبيئة في
`baseUrl`، ثم `SEARXNG_BASE_URL`. عندما لا يكون أي من مسارات الإعدادات معيّنًا
ويكون `SEARXNG_BASE_URL` موجودًا دون اختيار مزوّد صراحةً، يختار الاكتشاف التلقائي
SearXNG.

## مرجع إعدادات Plugin

| الحقل        | الوصف                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | عنوان URL الأساسي لمثيل SearXNG لديك (مطلوب)                       |
| `categories` | فئات مفصولة بفواصل مثل `general` أو `news` أو `science` |
| `language`   | رمز لغة النتائج مثل `en` أو `de` أو `fr`              |

يقبل استدعاء أداة `web_search` أيضًا `count` (من نتيجة واحدة إلى 10 نتائج)، و`categories`،
و`language` كتجاوزات خاصة بكل استدعاء.

## ملاحظات

- **واجهة API بتنسيق JSON** -- تستخدم نقطة النهاية الأصلية `format=json` في SearXNG، وليس استخراج البيانات من HTML
- **عناوين URL لنتائج الصور** -- تتضمن نتائج فئة الصور `img_src` عندما يعيد SearXNG
  عنوان URL مباشرًا للصورة
- **لا يلزم مفتاح API** -- يعمل مباشرةً مع أي مثيل SearXNG
- **التحقق من عنوان URL الأساسي** -- يجب أن يكون `baseUrl` عنوان URL صالحًا يبدأ بـ `http://` أو `https://`
- **حارس الشبكة** -- يجب أن تستهدف عناوين URL الأساسية التي تبدأ بـ `http://` مضيفًا خاصًا موثوقًا أو
  مضيف local loopback (يجب أن تستخدم المضيفات العامة `https://`)؛ وتحصل عناوين URL الأساسية التي تبدأ بـ `https://`
  وتُحل إلى عنوان خاص/داخلي على السماح نفسه الخاص بالاستضافة الذاتية،
  بينما تحتفظ عناوين URL الأساسية التي تبدأ بـ `https://` وتُحل علنًا بحماية صارمة من SSRF
- **ترتيب الاكتشاف التلقائي** -- يتطلب SearXNG قيمة `baseUrl` مضبوطة (الترتيب
  200 بين المزوّدين الذين تتوفر لديهم بيانات الاعتماد المطلوبة بالفعل). المزوّدون الذين لا يتطلبون مفتاحًا
  مثل DuckDuckGo أو Ollama Web Search لا يفوزون بالاكتشاف التلقائي ضمنيًا مطلقًا؛ ولا يُفعّلون
  إلا عند اختيار `provider` صراحةً
- **مستضاف ذاتيًا** -- تتحكم في المثيل والاستعلامات ومحركات البحث المصدرية
- **الفئات** تكون `general` افتراضيًا عند عدم ضبطها
- **الرجوع إلى الفئة الافتراضية** -- إذا نجح طلب فئة غير `general` لكنه
  أعاد صفرًا من النتائج، يعيد OpenClaw محاولة الاستعلام نفسه مرة واحدة باستخدام `general`
  قبل إعادة مجموعة نتائج فارغة
- **التخزين المؤقت للنتائج** -- تُخزّن الاستعلامات المتطابقة (الاستعلام نفسه، والعدد، والفئات،
  واللغة، وعنوان URL الأساسي) مؤقتًا داخل العملية لمدة TTL قصيرة
- **متطلب الإصدار** -- يعلن Plugin عن `minHostVersion: >=2026.6.9`

<Tip>
  لكي تعمل واجهة JSON API الخاصة بـ SearXNG، تأكد من تمكين تنسيق `json`
  في ملف `settings.yml` الخاص بمثيل SearXNG ضمن `search.formats`.
</Tip>

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [بحث DuckDuckGo](/ar/tools/duckduckgo-search) -- مزوّد آخر لا يتطلب مفتاحًا
- [بحث Brave](/ar/tools/brave-search) -- نتائج منظّمة مع فئة مجانية
