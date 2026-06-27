---
read_when:
    - تريد مزود بحث ويب لا يتطلب مفتاح API
    - تريد استخدام DuckDuckGo من أجل web_search
    - تريد مزوّد بحث محددًا صراحةً لا يتطلب مفتاحًا
summary: بحث ويب DuckDuckGo -- موفّر بلا مفتاح (تجريبي، قائم على HTML)
title: بحث DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:40:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

يدعم OpenClaw DuckDuckGo كمزوّد `web_search` **بدون مفتاح**. لا يلزم مفتاح API
أو حساب.

<Warning>
  DuckDuckGo هو تكامل **تجريبي وغير رسمي** يجلب النتائج
  من صفحات بحث DuckDuckGo غير المعتمدة على JavaScript - وليس API رسمية. توقّع
  حدوث أعطال عرضية بسبب صفحات تحدّي الروبوتات أو تغييرات HTML.
</Warning>

## الإعداد

لا حاجة إلى مفتاح API - ما عليك سوى تعيين DuckDuckGo كمزوّدك:

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## الإعدادات

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
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
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
النتائج المراد إرجاعها (1-10).
</ParamField>

<ParamField path="region" type="string">
رمز منطقة DuckDuckGo (مثل `us-en` و`uk-en` و`de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
مستوى SafeSearch.
</ParamField>

يمكن أيضًا تعيين المنطقة وSafeSearch في إعدادات Plugin (انظر أعلاه) - تتجاوز
معاملات الأداة قيم الإعدادات لكل استعلام.

## ملاحظات

- **لا يوجد مفتاح API** - يعمل بعد اختيار DuckDuckGo كمزوّد `web_search`
  لديك
- **تجريبي** - يجمع النتائج من صفحات بحث HTML غير المعتمدة على JavaScript
  في DuckDuckGo، وليس من API أو SDK رسمية
- **خطر تحدّي الروبوتات** - قد يعرض DuckDuckGo اختبارات CAPTCHA أو يحظر الطلبات
  عند الاستخدام الكثيف أو المؤتمت
- **تحليل HTML** - تعتمد النتائج على بنية الصفحة، والتي يمكن أن تتغير دون
  إشعار
- **اختيار صريح** - لا يختار OpenClaw DuckDuckGo تلقائيًا
  عند عدم إعداد مزوّد مدعوم بـ API
- **يكون SafeSearch على مستوى moderate افتراضيًا** عند عدم إعداده

<Tip>
  للاستخدام في الإنتاج، فكّر في [Brave Search](/ar/tools/brave-search) (تتوفر طبقة
  مجانية) أو مزوّد آخر مدعوم بـ API.
</Tip>

## ذات صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [Brave Search](/ar/tools/brave-search) -- نتائج منظّمة مع طبقة مجانية
- [Exa Search](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى
