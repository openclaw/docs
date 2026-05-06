---
read_when:
    - تريد نماذج GLM في OpenClaw
    - تحتاج إلى اصطلاح تسمية النموذج وإعداده
summary: نظرة عامة على عائلة نماذج GLM وكيفية استخدامها في OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T08:10:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM هي عائلة نماذج (وليست شركة) متاحة عبر منصة [Z.AI](https://z.ai). في OpenClaw، يتم الوصول إلى نماذج GLM عبر المزوّد المضمّن `zai` باستخدام مراجع مثل `zai/glm-5.1`.

| الخاصية             | القيمة                                                                      |
| ------------------- | --------------------------------------------------------------------------- |
| معرّف المزوّد        | `zai`                                                                       |
| Plugin              | مضمّن، `enabledByDefault: true`                                             |
| متغيرات بيئة المصادقة | `ZAI_API_KEY` أو `Z_AI_API_KEY`                                             |
| خيارات التهيئة الأولية | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | متوافق مع OpenAI                                                            |
| عنوان URL الأساسي الافتراضي | `https://api.z.ai/api/paas/v4`                                      |
| الافتراضي المقترح    | `zai/glm-5.1`                                                               |
| نموذج الصور الافتراضي | `zai/glm-4.6v`                                                              |

## البدء

<Steps>
  <Step title="اختر مسار مصادقة وشغّل التهيئة الأولية">
    اختر خيار التهيئة الأولية الذي يطابق خطة Z.AI ومنطقتك. يكتشف خيار `zai-api-key` العام نقطة النهاية المطابقة تلقائيًا من شكل المفتاح؛ استخدم الخيارات الإقليمية الصريحة عندما تريد فرض خطة برمجة محددة أو واجهة API عامة.

    | خيار المصادقة       | الأنسب لـ                                           |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | مفتاح API عام مع اكتشاف تلقائي لنقطة النهاية        |
    | `zai-coding-global` | مستخدمي خطة البرمجة (عالميًا)                       |
    | `zai-coding-cn`     | مستخدمي خطة البرمجة (منطقة الصين)                  |
    | `zai-global`        | API عام (عالميًا)                                   |
    | `zai-cn`            | API عام (منطقة الصين)                               |

    <CodeGroup>

```bash اكتشاف تلقائي
openclaw onboard --auth-choice zai-api-key
```

```bash خطة البرمجة (عالميًا)
openclaw onboard --auth-choice zai-coding-global
```

```bash خطة البرمجة (الصين)
openclaw onboard --auth-choice zai-coding-cn
```

```bash API عام (عالميًا)
openclaw onboard --auth-choice zai-global
```

```bash API عام (الصين)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="اضبط GLM كنموذج افتراضي">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="تحقق من توفر النماذج">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## مثال إعدادات

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  يتيح `zai-api-key` لـ OpenClaw اكتشاف نقطة نهاية Z.AI المطابقة من شكل المفتاح وتطبيق عنوان URL الأساسي الصحيح تلقائيًا. استخدم الخيارات الإقليمية الصريحة عندما تريد تثبيت خطة برمجة محددة أو واجهة API عامة.
</Tip>

## الكتالوج المضمّن

يبذُر المزوّد المضمّن `zai` 13 مرجعًا لنماذج GLM. تدعم كل الإدخالات الاستدلال ما لم يُذكر خلاف ذلك؛ يقبل `glm-5v-turbo` و`glm-4.6v` إدخال الصور بالإضافة إلى النص.

| مرجع النموذج         | ملاحظات                                           |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | النموذج الافتراضي. استدلال، نص فقط، سياق 202k.    |
| `zai/glm-5`          | استدلال، نص فقط، سياق 202k.                       |
| `zai/glm-5-turbo`    | استدلال، نص فقط، سياق 202k.                       |
| `zai/glm-5v-turbo`   | استدلال، نص + صورة، سياق 202k.                    |
| `zai/glm-4.7`        | استدلال، نص فقط، سياق 204k.                       |
| `zai/glm-4.7-flash`  | استدلال، نص فقط، سياق 200k.                       |
| `zai/glm-4.7-flashx` | استدلال، نص فقط.                                  |
| `zai/glm-4.6`        | استدلال، نص فقط.                                  |
| `zai/glm-4.6v`       | استدلال، نص + صورة. نموذج الصور الافتراضي.        |
| `zai/glm-4.5`        | استدلال، نص فقط.                                  |
| `zai/glm-4.5-air`    | استدلال، نص فقط.                                  |
| `zai/glm-4.5-flash`  | استدلال، نص فقط.                                  |
| `zai/glm-4.5v`       | استدلال، نص + صورة.                               |

<Note>
  يمكن أن تتغير إصدارات GLM وتوافرها. شغّل `openclaw models list --provider zai` لرؤية صفوف الكتالوج المعروفة لإصدارك المثبّت، وراجع وثائق Z.AI لمعرفة النماذج المضافة حديثًا أو المهملة.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="الاكتشاف التلقائي لنقطة النهاية">
    عند استخدام خيار مصادقة `zai-api-key`، يفحص OpenClaw شكل المفتاح لتحديد عنوان URL الأساسي الصحيح لـ Z.AI. تتجاوز الخيارات الإقليمية الصريحة (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) الاكتشاف التلقائي وتثبّت نقطة النهاية مباشرة.
  </Accordion>

  <Accordion title="تفاصيل المزوّد">
    تُقدَّم نماذج GLM بواسطة مزوّد وقت التشغيل `zai`. للاطلاع على إعدادات المزوّد الكاملة، ونقاط النهاية الإقليمية، والإمكانات الإضافية، راجع [صفحة مزوّد Z.AI](/ar/providers/zai).
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="مزوّد Z.AI" href="/ar/providers/zai" icon="server">
    إعدادات مزوّد Z.AI الكاملة ونقاط النهاية الإقليمية.
  </Card>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="أوضاع التفكير" href="/ar/tools/thinking" icon="brain">
    مستويات `/think` لعائلة GLM القادرة على الاستدلال.
  </Card>
  <Card title="الأسئلة الشائعة حول النماذج" href="/ar/help/faq-models" icon="circle-question">
    ملفات تعريف المصادقة، وتبديل النماذج، وحل أخطاء "no profile".
  </Card>
</CardGroup>
