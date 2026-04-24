---
read_when:
    - تريد مزوّد بحث ويب لا يتطلب مفتاح API
    - تريد استخدام DuckDuckGo مع `web_search`
    - تحتاج إلى حل بحث احتياطي بلا إعدادات
summary: بحث الويب DuckDuckGo -- مزوّد احتياطي بلا مفاتيح (تجريبي، قائم على HTML)
title: بحث DuckDuckGo
x-i18n:
    generated_at: "2026-04-24T08:08:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

يدعم OpenClaw محرك DuckDuckGo كمزوّد `web_search` **بلا مفاتيح**. لا حاجة إلى
مفتاح API أو حساب.

<Warning>
  يُعد تكامل DuckDuckGo تكاملًا **تجريبيًا وغير رسمي** يسحب النتائج
  من صفحات البحث غير المعتمدة على JavaScript في DuckDuckGo — وليس من API رسمية. توقّع
  حدوث أعطال متقطعة بسبب صفحات تحدي الروبوتات أو تغيّرات HTML.
</Warning>

## الإعداد

لا حاجة إلى مفتاح API — فقط اضبط DuckDuckGo كمزوّد لديك:

<Steps>
  <Step title="التهيئة">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## الإعداد

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

## معلمات الأداة

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
النتائج المطلوب إرجاعها (من 1 إلى 10).
</ParamField>

<ParamField path="region" type="string">
رمز المنطقة في DuckDuckGo (مثل `us-en`، و`uk-en`، و`de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
مستوى SafeSearch.
</ParamField>

يمكن أيضًا ضبط المنطقة وSafeSearch في إعداد Plugin (انظر أعلاه) — وتتجاوز
معلمات الأداة قيم الإعداد لكل استعلام.

## ملاحظات

- **من دون مفتاح API** — يعمل مباشرة، ومن دون أي إعداد
- **تجريبي** — يجمع النتائج من صفحات بحث DuckDuckGo HTML غير المعتمدة على JavaScript،
  وليس من API أو SDK رسميين
- **خطر تحدي الروبوتات** — قد تعرض DuckDuckGo اختبارات CAPTCHA أو تحظر الطلبات
  عند الاستخدام الكثيف أو المؤتمت
- **تحليل HTML** — تعتمد النتائج على بنية الصفحة، والتي قد تتغير
  من دون إشعار
- **ترتيب الاكتشاف التلقائي** — DuckDuckGo هي أول مزوّد احتياطي بلا مفاتيح
  (الترتيب 100) في الاكتشاف التلقائي. تعمل المزوّدات المعتمدة على API والمهيأة بمفاتيح
  أولًا، ثم Ollama Web Search (الترتيب 110)، ثم SearXNG (الترتيب 200)
- **تفترض SafeSearch القيمة moderate افتراضيًا** عند عدم التهيئة

<Tip>
  للاستخدام الإنتاجي، فكّر في [Brave Search](/ar/tools/brave-search) (تتوفر
  طبقة مجانية) أو مزود آخر مدعوم عبر API.
</Tip>

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [Brave Search](/ar/tools/brave-search) -- نتائج منظمة مع طبقة مجانية
- [Exa Search](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى
