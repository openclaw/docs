---
read_when:
    - أنت تريد كتالوج OpenCode Go
    - أنت بحاجة إلى مراجع نماذج وقت التشغيل للنماذج المستضافة عبر Go
summary: استخدم كتالوج OpenCode Go مع إعداد OpenCode المشترك
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T18:22:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 15
---

يُعد OpenCode Go كتالوج Go ضمن [OpenCode](/ar/providers/opencode).
ويستخدم مفتاح `OPENCODE_API_KEY` نفسه الذي يستخدمه كتالوج Zen، لكنه يحتفظ بمعرّف موفّر وقت التشغيل `opencode-go` لكي يبقى التوجيه لكل نموذج من المنبع صحيحًا.

| الخاصية         | القيمة                          |
| ---------------- | ------------------------------- |
| موفّر وقت التشغيل | `opencode-go`                   |
| المصادقة         | `OPENCODE_API_KEY`              |
| الإعداد الأب     | [OpenCode](/ar/providers/opencode) |

## الكتالوج المدمج

يستمد OpenClaw معظم صفوف كتالوج Go من سجل نماذج pi المجمّع
ويستكمل الصفوف الحالية من المنبع إلى أن يلحق بها السجل. شغّل
`openclaw models list --provider opencode-go` للحصول على قائمة النماذج الحالية.

يتضمن الموفّر ما يلي:

| مرجع النموذج                    | الاسم                 |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (حدود 3x)   |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

## البدء

<Tabs>
  <Tab title="تفاعلي">
    <Steps>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="عيّن نموذج Go كافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="تحقق من توفر النماذج">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="غير تفاعلي">
    <Steps>
      <Step title="مرّر المفتاح مباشرة">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## تهيئة متقدمة

<AccordionGroup>
  <Accordion title="سلوك التوجيه">
    يتولى OpenClaw التوجيه لكل نموذج تلقائيًا عندما يستخدم مرجع النموذج
    `opencode-go/...`. ولا يلزم أي إعداد إضافي للموفّر.
  </Accordion>

  <Accordion title="اصطلاح مرجع وقت التشغيل">
    تبقى مراجع وقت التشغيل صريحة: `opencode/...` لـ Zen، و`opencode-go/...` لـ Go.
    وهذا يحافظ على صحة التوجيه من المنبع لكل نموذج عبر الكتالوجين.
  </Accordion>

  <Accordion title="بيانات اعتماد مشتركة">
    يُستخدم `OPENCODE_API_KEY` نفسه لكل من كتالوجي Zen وGo. ويؤدي إدخال
    المفتاح أثناء الإعداد إلى تخزين بيانات الاعتماد لكلا موفّري وقت التشغيل.
  </Accordion>
</AccordionGroup>

<Tip>
راجع [OpenCode](/ar/providers/opencode) للاطلاع على النظرة العامة المشتركة للإعداد والمرجع الكامل لكتالوجي
Zen وGo.
</Tip>

## ذي صلة

<CardGroup cols={2}>
  <Card title="OpenCode (الأب)" href="/ar/providers/opencode" icon="server">
    الإعداد المشترك، ونظرة عامة على الكتالوج، وملاحظات متقدمة.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
</CardGroup>
