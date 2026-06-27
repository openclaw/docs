---
read_when:
    - تريد كتالوج OpenCode Go
    - تحتاج إلى مراجع نماذج وقت التشغيل للنماذج المستضافة عبر Go
summary: استخدم كتالوج Go الخاص بـ OpenCode مع إعداد OpenCode المشترك
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:26:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go هو كتالوج Go ضمن [OpenCode](/ar/providers/opencode).
يستخدم نفس `OPENCODE_API_KEY` مثل كتالوج Zen، لكنه يحتفظ بمعرّف مزوّد وقت التشغيل
`opencode-go` لكي يظل توجيه النماذج في المنبع صحيحًا.

| الخاصية         | القيمة                           |
| ---------------- | ------------------------------- |
| مزوّد وقت التشغيل | `opencode-go`                   |
| المصادقة             | `OPENCODE_API_KEY`              |
| إعداد الأصل     | [OpenCode](/ar/providers/opencode) |

## الكتالوج المضمّن

يستمد OpenClaw معظم صفوف كتالوج Go من سجل نماذج OpenClaw المضمّن، ويضيف
صفوف المنبع الحالية أثناء مواكبة السجل. شغّل
`openclaw models list --provider opencode-go` لقائمة النماذج الحالية.

يتضمن المزوّد:

| مرجع النموذج                       | الاسم                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (حدود 3x) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

يستخدم GLM-5.2 نافذة سياق بسعة مليون رمز مميز، ويدعم ما يصل إلى 131 ألف رمز مميز في المخرجات.

## البدء

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Set a Go model as default">
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

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Pass the key directly">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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

## مثال على الإعدادات

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="Routing behavior">
    يتولى OpenClaw توجيه النماذج تلقائيًا عندما يستخدم مرجع النموذج
    `opencode-go/...`. لا يلزم أي إعداد إضافي للمزوّد.
  </Accordion>

  <Accordion title="Runtime ref convention">
    تبقى مراجع وقت التشغيل صريحة: `opencode/...` لـ Zen، و`opencode-go/...` لـ Go.
    يحافظ ذلك على صحة توجيه النماذج في المنبع عبر كلا الكتالوجين.
  </Accordion>

  <Accordion title="Shared credentials">
    يُستخدم نفس `OPENCODE_API_KEY` بواسطة كتالوجي Zen وGo. يؤدي إدخال
    المفتاح أثناء الإعداد إلى تخزين بيانات الاعتماد لكلا مزوّدي وقت التشغيل.
  </Accordion>
</AccordionGroup>

<Tip>
راجع [OpenCode](/ar/providers/opencode) للاطلاع على نظرة عامة مشتركة حول الإعداد والمرجع الكامل
لكتالوجي Zen وGo.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/ar/providers/opencode" icon="server">
    إعداد مشترك، ونظرة عامة على الكتالوج، وملاحظات متقدمة.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
</CardGroup>
