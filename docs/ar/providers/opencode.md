---
read_when:
    - تريد وصولًا إلى النماذج المستضافة على OpenCode
    - تريد الاختيار بين كتالوجَي Zen وGo
summary: استخدم كتالوجات OpenCode Zen وGo مع OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:46:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

يعرض OpenCode كتالوجين مستضافين في OpenClaw:

| الكتالوج | البادئة            | موفر وقت التشغيل |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

يستخدم كلا الكتالوجين مفتاح OpenCode API نفسه. يبقي OpenClaw معرّفات موفر وقت التشغيل
منفصلة حتى يظل التوجيه الصاعد لكل نموذج صحيحا، لكن الإعداد الأولي والوثائق يتعاملان معها
كإعداد OpenCode واحد.

## البدء

<Tabs>
  <Tab title="Zen catalog">
    **الأفضل لـ:** وكيل OpenCode متعدد النماذج المنسق (Claude، GPT، Gemini، GLM).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        أو مرر المفتاح مباشرة:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **الأفضل لـ:** تشكيلة Kimi وGLM وMiniMax المستضافة عبر OpenCode.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        أو مرر المفتاح مباشرة:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## مثال الإعداد

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## الكتالوجات المدمجة

### Zen

| الخاصية         | القيمة                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| موفر وقت التشغيل | `opencode`                                                                                    |
| نماذج أمثلة   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| الخاصية         | القيمة                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| موفر وقت التشغيل | `opencode-go`                                                            |
| نماذج أمثلة   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` مدعوم أيضا كاسم بديل لـ `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Shared credentials">
    يؤدي إدخال مفتاح OpenCode واحد أثناء الإعداد إلى تخزين بيانات الاعتماد لكلا موفري
    وقت التشغيل. لا تحتاج إلى إعداد كل كتالوج على حدة.
  </Accordion>

  <Accordion title="Billing and dashboard">
    تسجل الدخول إلى OpenCode، وتضيف تفاصيل الفوترة، وتنسخ مفتاح API الخاص بك. تتم إدارة الفوترة
    وتوفر الكتالوج من لوحة تحكم OpenCode.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    تبقى مراجع OpenCode المدعومة من Gemini على مسار proxy-Gemini، لذلك يحتفظ OpenClaw
    بتنظيف توقيع أفكار Gemini هناك دون تمكين تحقق إعادة التشغيل الأصلي من Gemini
    أو إعادة كتابة bootstrap.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    تحتفظ مراجع OpenCode غير Gemini بسياسة إعادة التشغيل الدنيا المتوافقة مع OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
يؤدي إدخال مفتاح OpenCode واحد أثناء الإعداد إلى تخزين بيانات الاعتماد لكل من موفري وقت تشغيل Zen و
Go، لذلك لا تحتاج إلى الإعداد إلا مرة واحدة.
</Tip>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعداد الكامل للوكلاء والنماذج والموفرين.
  </Card>
</CardGroup>
