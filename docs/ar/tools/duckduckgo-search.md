---
read_when:
    - تريد مزود بحث على الويب لا يتطلب مفتاح API
    - تريد استخدام DuckDuckGo مع web_search
    - تريد مزوّد بحث دون مفتاح محددًا صراحةً
summary: بحث الويب عبر DuckDuckGo — مزوّد بلا مفتاح (تجريبي، قائم على HTML)
title: بحث DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T06:40:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

يدعم OpenClaw استخدام DuckDuckGo كمزوّد `web_search` **لا يتطلب مفتاحًا**. لا يلزم مفتاح API ولا حساب.

<Warning>
  يُعد تكامل DuckDuckGo **تجريبيًا وغير رسمي**، إذ يستخرج البيانات من صفحات بحث HTML غير المعتمدة على JavaScript في DuckDuckGo، وليس من API رسمي. توقّع حدوث أعطال عرضية بسبب صفحات التحقق من الروبوتات أو تغييرات HTML.
</Warning>

## الإعداد

لا يُحدَّد DuckDuckGo تلقائيًا مطلقًا، لأن الاكتشاف التلقائي لا يأخذ في الحسبان سوى المزوّدين الذين لديهم بيانات اعتماد صالحة للاستخدام. حدّده صراحةً:

<Steps>
  <Step title="التهيئة">
    ```bash
    openclaw configure --section web
    # حدّد "duckduckgo" بوصفه المزوّد
    ```
  </Step>
</Steps>

## التهيئة

عيّن المزوّد مباشرةً في ملف التهيئة:

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

إعدادات اختيارية على مستوى Plugin للمنطقة وSafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // رمز منطقة DuckDuckGo
            safeSearch: "moderate", // "strict" أو "moderate" أو "off"
          },
        },
      },
    },
  },
}
```

## معاملات الأداة

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
عدد النتائج المراد إرجاعها (1-10).
</ParamField>

<ParamField path="region" type="string">
رمز منطقة DuckDuckGo (مثل `us-en` و`uk-en` و`de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
مستوى SafeSearch.
</ParamField>

تتجاوز معاملات الأداة `region` و`safeSearch` قيم تهيئة Plugin أعلاه لكل استعلام على حدة.

## ملاحظات

- **لا يلزم مفتاح API** -- يعمل بمجرد تحديد DuckDuckGo بوصفه مزوّد `web_search`.
- **تجريبي** -- يستخرج البيانات من صفحات بحث HTML غير المعتمدة على JavaScript في DuckDuckGo، وليس من API أو SDK رسمي. تعتمد النتائج على بنية الصفحة، التي قد تتغير دون إشعار.
- **خطر التحقق من الروبوتات** -- قد يعرض DuckDuckGo اختبارات CAPTCHA أو يحظر الطلبات عند الاستخدام المكثف أو المؤتمت.
- **التحديد الصريح فقط** -- لا يأخذ الاكتشاف التلقائي في OpenClaw في الحسبان سوى المزوّدين الذين لديهم بيانات اعتماد صالحة للاستخدام، ولذلك لا يُختار تلقائيًا مطلقًا مزوّد لا يتطلب مفتاحًا مثل DuckDuckGo؛ بل يجب عليك تعيين `provider: "duckduckgo"`.
- **القيمة الافتراضية لـ SafeSearch هي `moderate`** عند عدم تهيئته.

<Tip>
  للاستخدام في بيئات الإنتاج، يمكنك استخدام [Brave Search](/ar/tools/brave-search) (تتوفر فئة مجانية) أو مزوّد آخر مدعوم بـ API.
</Tip>

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [Brave Search](/ar/tools/brave-search) -- نتائج منظّمة مع فئة مجانية
- [Exa Search](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى
