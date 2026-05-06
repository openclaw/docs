---
read_when:
    - تريد موفّر بحث على الويب لا يتطلب مفتاح API
    - تريد استخدام DuckDuckGo من أجل web_search
    - تحتاج إلى بديل احتياطي للبحث بلا إعدادات
summary: بحث الويب عبر DuckDuckGo -- مزوّد احتياطي لا يتطلب مفتاحاً (تجريبي، مستند إلى HTML)
title: بحث DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T08:16:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

يدعم OpenClaw DuckDuckGo بوصفه مزوّد `web_search` **بلا مفتاح**. لا يلزم
أي مفتاح API أو حساب.

<Warning>
  تكامل DuckDuckGo **تجريبي وغير رسمي** يجلب النتائج من صفحات البحث غير المعتمدة
  على JavaScript في DuckDuckGo - وليس من API رسمية. توقّع حدوث أعطال
  أحيانًا بسبب صفحات تحدّي البوتات أو تغييرات HTML.
</Warning>

## الإعداد

لا حاجة إلى مفتاح API - فقط اضبط DuckDuckGo كمزوّدك:

<Steps>
  <Step title="التكوين">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## التكوين

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
النتائج المطلوب إرجاعها (1-10).
</ParamField>

<ParamField path="region" type="string">
رمز منطقة DuckDuckGo (مثل `us-en`، `uk-en`، `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
مستوى SafeSearch.
</ParamField>

يمكن أيضًا ضبط المنطقة وSafeSearch في تكوين Plugin (انظر أعلاه) - معاملات
الأداة تتجاوز قيم التكوين لكل استعلام.

## ملاحظات

- **لا يوجد مفتاح API** - يعمل مباشرة، بدون أي تكوين
- **تجريبي** - يجمع النتائج من صفحات بحث HTML غير المعتمدة على JavaScript في
  DuckDuckGo، وليس من API أو SDK رسمي
- **خطر تحدّي البوتات** - قد يعرض DuckDuckGo اختبارات CAPTCHA أو يحظر الطلبات
  عند الاستخدام الكثيف أو الآلي
- **تحليل HTML** - تعتمد النتائج على بنية الصفحة، والتي يمكن أن تتغيّر بدون
  إشعار
- **ترتيب الاكتشاف التلقائي** - DuckDuckGo هو أول بديل بلا مفتاح
  (الترتيب 100) في الاكتشاف التلقائي. تعمل المزوّدات المدعومة بواجهة API
  ذات المفاتيح المكوّنة أولًا، ثم Ollama Web Search (الترتيب 110)، ثم SearXNG (الترتيب 200)
- **SafeSearch افتراضيًا moderate** عندما لا يكون مكوّنًا

<Tip>
  للاستخدام الإنتاجي، ضع في اعتبارك [Brave Search](/ar/tools/brave-search) (تتوفر
  طبقة مجانية) أو مزوّدًا آخر مدعومًا بواجهة API.
</Tip>

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدات والاكتشاف التلقائي
- [Brave Search](/ar/tools/brave-search) -- نتائج منظمة مع طبقة مجانية
- [Exa Search](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى
