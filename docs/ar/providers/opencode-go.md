---
read_when:
    - تريد كتالوج OpenCode Go
    - تحتاج إلى مراجع نماذج وقت التشغيل للنماذج المستضافة على Go
summary: استخدم كتالوج OpenCode Go مع إعداد OpenCode المشترك
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-24T08:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go هو كتالوج Go داخل [OpenCode](/ar/providers/opencode).
ويستخدم مفتاح `OPENCODE_API_KEY` نفسه الخاص بكتالوج Zen، لكنه يحتفظ
بمعرّف مزوّد وقت التشغيل `opencode-go` بحيث يبقى التوجيه upstream لكل نموذج صحيحًا.

| الخاصية         | القيمة                          |
| --------------- | ------------------------------- |
| مزوّد وقت التشغيل | `opencode-go`                   |
| المصادقة        | `OPENCODE_API_KEY`              |
| الإعداد الأب    | [OpenCode](/ar/providers/opencode) |

## الكتالوج المضمن

يستمد OpenClaw كتالوج Go من سجل نماذج pi المضمن. شغّل
`openclaw models list --provider opencode-go` للحصول على قائمة النماذج الحالية.

اعتبارًا من كتالوج pi المضمن، يتضمن المزوّد ما يلي:

| مرجع النموذج               | الاسم                    |
| -------------------------- | ------------------------ |
| `opencode-go/glm-5`        | GLM-5                    |
| `opencode-go/glm-5.1`      | GLM-5.1                  |
| `opencode-go/kimi-k2.5`    | Kimi K2.5                |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (حدود 3x)      |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni             |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro              |
| `opencode-go/minimax-m2.5` | MiniMax M2.5             |
| `opencode-go/minimax-m2.7` | MiniMax M2.7             |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus             |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus             |

## البدء

<Tabs>
  <Tab title="تفاعلي">
    <Steps>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="اضبط نموذج Go كنموذج افتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="تحقق من أن النماذج متاحة">
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="سلوك التوجيه">
    يتولى OpenClaw التوجيه لكل نموذج تلقائيًا عندما يستخدم مرجع النموذج
    `opencode-go/...`. ولا حاجة إلى إعداد مزوّد إضافي.
  </Accordion>

  <Accordion title="اصطلاح مراجع وقت التشغيل">
    تبقى مراجع وقت التشغيل صريحة: `opencode/...` لكتالوج Zen، و`opencode-go/...` لكتالوج Go.
    ويحافظ هذا على صحة التوجيه upstream لكل نموذج عبر كلا الكتالوجين.
  </Accordion>

  <Accordion title="بيانات الاعتماد المشتركة">
    يُستخدم `OPENCODE_API_KEY` نفسه في كل من كتالوجي Zen وGo. وعند إدخال
    المفتاح أثناء الإعداد، يتم تخزين بيانات الاعتماد لكلا مزوّدي وقت التشغيل.
  </Accordion>
</AccordionGroup>

<Tip>
راجع [OpenCode](/ar/providers/opencode) للحصول على نظرة عامة مشتركة على الإعداد الأولي والمرجع الكامل
لكتالوجي Zen + Go.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="OpenCode (الأب)" href="/ar/providers/opencode" icon="server">
    الإعداد الأولي المشترك، ونظرة عامة على الكتالوج، والملاحظات المتقدمة.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع عند الفشل.
  </Card>
</CardGroup>
