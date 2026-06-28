---
read_when:
    - تريد وصولًا إلى نماذج مستضافة عبر OpenCode
    - تريد الاختيار بين كتالوجَي Zen وGo
summary: استخدم كتالوجَي OpenCode Zen وGo مع OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:57:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
    postprocess_version: locale-links-v1
---

يعرض OpenCode كتالوجين مستضافين في OpenClaw:

| الكتالوج | البادئة            | مزوّد وقت التشغيل |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

يستخدم كلا الكتالوجين مفتاح OpenCode API نفسه. ويُبقي OpenClaw معرّفات مزوّدي وقت التشغيل
منفصلة حتى يظل التوجيه لكل نموذج من المصدر الأعلى صحيحًا، لكن الإعداد الأولي والمستندات يعاملانهما
كإعداد OpenCode واحد.

## البدء

<Tabs>
  <Tab title="كتالوج Zen">
    **الأفضل لـ:** proxy متعدد النماذج المنسّق من OpenCode (Claude، وGPT، وGemini).

    <Steps>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="اضبط نموذج Zen كنموذج افتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="تحقق من أن النماذج متاحة">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="كتالوج Go">
    **الأفضل لـ:** تشكيلة Kimi وGLM وMiniMax المستضافة عبر OpenCode.

    <Steps>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="اضبط نموذج Go كنموذج افتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="تحقق من أن النماذج متاحة">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## مثال على الإعدادات

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## الكتالوجات المضمّنة

### Zen

| الخاصية         | القيمة                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| مزوّد وقت التشغيل | `opencode`                                                              |
| نماذج مثال   | `opencode/claude-opus-4-6`، و`opencode/gpt-5.5`، و`opencode/gemini-3-pro` |

### Go

| الخاصية         | القيمة                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| مزوّد وقت التشغيل | `opencode-go`                                                            |
| نماذج مثال   | `opencode-go/kimi-k2.6`، و`opencode-go/glm-5`، و`opencode-go/minimax-m2.5` |

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="الأسماء المستعارة لمفتاح API">
    كما أن `OPENCODE_ZEN_API_KEY` مدعوم أيضًا كاسم مستعار لـ `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="بيانات الاعتماد المشتركة">
    يؤدي إدخال مفتاح OpenCode واحد أثناء الإعداد إلى تخزين بيانات الاعتماد لكلا
    مزوّدي وقت التشغيل. ولا تحتاج إلى إعداد كل كتالوج على حدة.
  </Accordion>

  <Accordion title="الفوترة ولوحة التحكم">
    تقوم بتسجيل الدخول إلى OpenCode، وإضافة تفاصيل الفوترة، ونسخ مفتاح API الخاص بك. وتتم إدارة
    الفوترة وتوفر الكتالوج من لوحة تحكم OpenCode.
  </Accordion>

  <Accordion title="سلوك replay في Gemini">
    تبقى مراجع OpenCode المدعومة من Gemini على مسار proxy-Gemini، ولذلك يحافظ OpenClaw
    على تنظيف thought-signature الخاص بـ Gemini هناك من دون تفعيل التحقق الأصلي من
    replay في Gemini أو إعادة كتابة التهيئة.
  </Accordion>

  <Accordion title="سلوك replay لغير Gemini">
    تبقي مراجع OpenCode غير المدعومة من Gemini على سياسة replay الدنيا المتوافقة مع OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
يؤدي إدخال مفتاح OpenCode واحد أثناء الإعداد إلى تخزين بيانات الاعتماد لكل من مزوّدي وقت التشغيل Zen و
Go، لذلك لا تحتاج إلى الإعداد إلا مرة واحدة.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لإعدادات الوكلاء، والنماذج، والمزوّدين.
  </Card>
</CardGroup>
