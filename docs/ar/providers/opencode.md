---
read_when:
    - تريد الوصول إلى النماذج المستضافة على OpenCode
    - تريد الاختيار بين كتالوجَي Zen وGo
summary: استخدام كتالوجَي OpenCode Zen وGo مع OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T06:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

يعرض OpenCode كتالوجين مستضافين في OpenClaw:

| الكتالوج | البادئة           | موفّر وقت التشغيل |
| -------- | ----------------- | ----------------- |
| **Zen**  | `opencode/...`    | `opencode`        |
| **Go**   | `opencode-go/...` | `opencode-go`     |

يشترك الكتالوجان في مفتاح OpenCode API واحد (`OPENCODE_API_KEY`، والاسم البديل
`OPENCODE_ZEN_API_KEY`). يُبقي OpenClaw معرّفات موفّري وقت التشغيل منفصلة لكي
يظل التوجيه لكل نموذج في المنبع صحيحًا، لكن الإعداد الأولي والوثائق يتعاملان معهما
كإعداد OpenCode واحد.

## البدء

<Tabs>
  <Tab title="كتالوج Zen">
    **الأنسب لـ:** وكيل OpenCode المنسّق متعدد النماذج (Claude وGPT وGemini وGLM
    وDeepSeek وKimi وMiniMax وQwen).

    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        أو مرّر المفتاح مباشرةً:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="تعيين نموذج Zen كنموذج افتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="التحقق من توفر النماذج">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="كتالوج Go">
    **الأنسب لـ:** مجموعة نماذج Kimi وGLM وMiniMax وQwen وDeepSeek المستضافة على OpenCode.

    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        أو مرّر المفتاح مباشرةً:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="تعيين نموذج Go كنموذج افتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="التحقق من توفر النماذج">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## مثال على الإعداد

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## الكتالوجات المضمّنة

### Zen

| الخاصية           | القيمة                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------- |
| موفّر وقت التشغيل | `opencode`                                                                                    |
| نماذج توضيحية     | `opencode/claude-opus-4-6`، `opencode/gpt-5.5`، `opencode/gemini-3.1-pro`، `opencode/glm-5.2` |

شغّل `openclaw models list --provider opencode` للاطلاع على القائمة الحالية الكاملة، التي
تتضمن أيضًا إدخالات الفئة المجانية مثل `opencode/big-pickle` و
`opencode/deepseek-v4-flash-free`.

### Go

| الخاصية           | القيمة                                                                   |
| ----------------- | ------------------------------------------------------------------------ |
| موفّر وقت التشغيل | `opencode-go`                                                            |
| نماذج توضيحية     | `opencode-go/kimi-k2.6`، `opencode-go/glm-5`، `opencode-go/minimax-m2.5` |

راجع [OpenCode Go](/ar/providers/opencode-go) للاطلاع على جدول نماذج Go الكامل.

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="الأسماء البديلة لمفتاح API">
    يُقبل `OPENCODE_ZEN_API_KEY` أيضًا كاسم بديل لـ `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="بيانات الاعتماد المشتركة">
    يؤدي إدخال مفتاح OpenCode واحد أثناء الإعداد إلى تخزين بيانات الاعتماد لكلا موفّري
    وقت التشغيل. ولا تحتاج إلى إجراء الإعداد الأولي لكل كتالوج على حدة.
  </Accordion>

  <Accordion title="الحصول على مفتاح API">
    أنشئ حساب OpenCode وأنشئ مفتاح API عبر
    [opencode.ai/auth](https://opencode.ai/auth). تُدار الفوترة وإتاحة الكتالوج
    من لوحة تحكم OpenCode.
  </Accordion>

  <Accordion title="سلوك إعادة التشغيل في Gemini">
    تظل مراجع OpenCode المستندة إلى Gemini على مسار وكيل Gemini، لذلك يحتفظ OpenClaw
    بتنقية توقيعات التفكير الخاصة بـ Gemini هناك من دون تمكين التحقق الأصلي من إعادة
    التشغيل في Gemini أو إعادة كتابة التمهيد.
  </Accordion>

  <Accordion title="سلوك إعادة التشغيل لغير Gemini">
    تحتفظ مراجع OpenCode غير المستندة إلى Gemini بالحد الأدنى من سياسة إعادة التشغيل
    المتوافقة مع OpenAI.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/ar/providers/opencode-go" icon="server">
    مرجع كتالوج Go الكامل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعداد الكامل للوكلاء والنماذج والموفّرين.
  </Card>
</CardGroup>
