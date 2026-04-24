---
read_when:
    - تريد الوصول إلى النماذج المستضافة عبر OpenCode
    - تريد الاختيار بين فهرسي Zen وGo
summary: استخدم فهارس OpenCode Zen وGo مع OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T08:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

يكشف OpenCode عن فهرسين مستضافين في OpenClaw:

| الفهرس | البادئة           | موفّر بيئة التشغيل |
| ------ | ----------------- | ------------------ |
| **Zen** | `opencode/...`    | `opencode`         |
| **Go**  | `opencode-go/...` | `opencode-go`      |

يستخدم كلا الفهرسين مفتاح API نفسه الخاص بـ OpenCode. ويحافظ OpenClaw على فصل معرّفات
موفّري بيئة التشغيل حتى يبقى التوجيه الصاعد لكل نموذج صحيحًا، لكن الإعداد الأولي والمستندات
يتعاملان معهما بوصفهما إعداد OpenCode واحدًا.

## البدء

<Tabs>
  <Tab title="فهرس Zen">
    **الأفضل من أجل:** الوكيل المتعدد النماذج المنسق من OpenCode ‏(Claude وGPT وGemini).

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
      <Step title="اضبط نموذج Zen بوصفه الافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="تحقق من توفر النماذج">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="فهرس Go">
    **الأفضل من أجل:** تشكيلة Kimi وGLM وMiniMax المستضافة عبر OpenCode.

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
      <Step title="اضبط نموذج Go بوصفه الافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="تحقق من توفر النماذج">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## مثال على التهيئة

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## الفهارس المضمنة

### Zen

| الخاصية         | القيمة                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| موفّر بيئة التشغيل | `opencode`                                                            |
| أمثلة على النماذج | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| الخاصية         | القيمة                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| موفّر بيئة التشغيل | `opencode-go`                                                          |
| أمثلة على النماذج | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="الأسماء البديلة لمفتاح API">
    `OPENCODE_ZEN_API_KEY` مدعوم أيضًا بوصفه اسمًا بديلًا لـ `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="بيانات اعتماد مشتركة">
    يؤدي إدخال مفتاح OpenCode واحد أثناء الإعداد إلى تخزين بيانات الاعتماد لكلا موفّري
    بيئة التشغيل. ولا تحتاج إلى تنفيذ الإعداد الأولي لكل فهرس على حدة.
  </Accordion>

  <Accordion title="الفوترة ولوحة التحكم">
    تسجّل الدخول إلى OpenCode، وتضيف تفاصيل الفوترة، وتنسخ مفتاح API الخاص بك. وتُدار الفوترة
    وتوفر الفهارس من لوحة تحكم OpenCode.
  </Accordion>

  <Accordion title="سلوك إعادة تشغيل Gemini">
    تظل مراجع OpenCode المعتمدة على Gemini على مسار proxy-Gemini، لذا يحافظ OpenClaw
    هناك على تنقية thought-signature الخاصة بـ Gemini من دون تمكين التحقق الأصلي من
    إعادة تشغيل Gemini أو عمليات إعادة كتابة bootstrap.
  </Accordion>

  <Accordion title="سلوك إعادة التشغيل لغير Gemini">
    تحتفظ مراجع OpenCode غير المعتمدة على Gemini بسياسة إعادة التشغيل الدنيا المتوافقة مع OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
يؤدي إدخال مفتاح OpenCode واحد أثناء الإعداد إلى تخزين بيانات الاعتماد لكل من موفّري
بيئة التشغيل Zen وGo، لذلك تحتاج إلى تنفيذ الإعداد الأولي مرة واحدة فقط.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لتهيئة الوكلاء والنماذج والموفّرين.
  </Card>
</CardGroup>
