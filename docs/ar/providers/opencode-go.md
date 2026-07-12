---
read_when:
    - تريد كتالوج OpenCode Go
    - تحتاج إلى مراجع نماذج وقت التشغيل للنماذج المستضافة على Go
summary: استخدم كتالوج OpenCode Go مع إعداد OpenCode المشترك
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T06:29:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go هو كتالوج Go ضمن [OpenCode](/ar/providers/opencode). وهو يشارك بيانات اعتماد `OPENCODE_API_KEY` مع كتالوج Zen، لكنه يحتفظ بمعرّف موفّر وقت تشغيل خاص به (`opencode-go`) لضمان بقاء التوجيه لكل نموذج في المنبع صحيحًا.

| الخاصية            | القيمة                                             |
| ------------------ | -------------------------------------------------- |
| موفّر وقت التشغيل | `opencode-go`                                      |
| المصادقة           | `OPENCODE_API_KEY` (الاسم البديل: `OPENCODE_ZEN_API_KEY`) |
| الإعداد الأساسي    | [OpenCode](/ar/providers/opencode)                    |

## بدء الاستخدام

<Tabs>
  <Tab title="تفاعلي">
    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice opencode-go
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

  <Tab title="غير تفاعلي">
    <Steps>
      <Step title="تمرير المفتاح مباشرةً">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## الكتالوج المضمّن

شغّل `openclaw models list --provider opencode-go` لعرض قائمة النماذج الحالية.
الصفوف المضمّنة:

| مرجع النموذج                    | الاسم              | السياق    | الحد الأقصى للمخرجات | إدخال الصور |
| ------------------------------- | ------------------ | --------- | -------------------- | ----------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro    | 1M        | 384K                 | لا          |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash  | 1M        | 384K                 | لا          |
| `opencode-go/glm-5`             | GLM-5              | 202,752   | 32,768               | لا          |
| `opencode-go/glm-5.1`           | GLM-5.1            | 202,752   | 32,768               | لا          |
| `opencode-go/glm-5.2`           | GLM-5.2            | 1M        | 131,072              | لا          |
| `opencode-go/hy3-preview`       | معاينة HY3         | 262,144   | 32,768               | لا          |
| `opencode-go/kimi-k2.5`         | Kimi K2.5          | 262,144   | 65,536               | نعم         |
| `opencode-go/kimi-k2.6`         | Kimi K2.6          | 262,144   | 65,536               | نعم         |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code     | 262,144   | 262,144              | نعم         |
| `opencode-go/mimo-v2.5`         | MiMo V2.5          | 1M        | 128,000              | نعم         |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro      | 1,048,576 | 128,000              | لا          |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5       | 204,800   | 65,536               | لا          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7       | 204,800   | 131,072              | لا          |
| `opencode-go/minimax-m3`        | MiniMax M3         | 204,800   | 131,072              | لا          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus       | 262,144   | 65,536               | نعم         |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus       | 262,144   | 65,536               | نعم         |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max        | 1M        | 65,536               | لا          |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus       | 1M        | 65,536               | نعم         |

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="سلوك التوجيه">
    يوجّه OpenClaw تلقائيًا أي مرجع نموذج من نوع `opencode-go/...`. ولا يلزم
    أي إعداد إضافي للموفّر.
  </Accordion>

  <Accordion title="اصطلاح مراجع وقت التشغيل">
    تظل مراجع وقت التشغيل صريحة: `opencode/...` لـ Zen و`opencode-go/...` لـ
    Go. وهذا يحافظ على صحة التوجيه لكل نموذج في المنبع عبر كلا الكتالوجين.
  </Accordion>

  <Accordion title="بيانات الاعتماد المشتركة">
    يغطي مفتاح `OPENCODE_API_KEY` واحد كتالوجي Zen وGo معًا. ويؤدي إدخال
    المفتاح أثناء الإعداد إلى تخزين بيانات الاعتماد لكلا موفّري وقت التشغيل.
  </Accordion>
</AccordionGroup>

<Tip>
راجع [OpenCode](/ar/providers/opencode) للاطلاع على النظرة العامة المشتركة للإعداد الأولي والمرجع الكامل لكتالوجي Zen وGo.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="OpenCode (الأساسي)" href="/ar/providers/opencode" icon="server">
    الإعداد الأولي المشترك، ونظرة عامة على الكتالوج، والملاحظات المتقدمة.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
</CardGroup>
