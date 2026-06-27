---
read_when:
    - تريد استخدام DeepSeek مع OpenClaw
    - تحتاج إلى متغير بيئة مفتاح API أو خيار مصادقة CLI
summary: إعداد DeepSeek (المصادقة + اختيار النموذج)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:24:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

توفر [DeepSeek](https://www.deepseek.com) نماذج ذكاء اصطناعي قوية مع API متوافقة مع OpenAI.

| الخاصية | القيمة                     |
| -------- | -------------------------- |
| المزوّد | `deepseek`                 |
| المصادقة | `DEEPSEEK_API_KEY`         |
| API      | متوافقة مع OpenAI          |
| عنوان URL الأساسي | `https://api.deepseek.com` |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## بدء الاستخدام

<Steps>
  <Step title="Get your API key">
    أنشئ مفتاح API في [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    سيطلب هذا مفتاح API الخاص بك ويضبط `deepseek/deepseek-v4-flash` كنموذج افتراضي.

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    لفحص الكتالوج الثابت الخاص بـ Plugin من دون الحاجة إلى Gateway قيد التشغيل،
    استخدم:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    للتثبيتات النصية أو التي لا تحتوي على واجهة، مرّر كل الأعلام مباشرة:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من أن `DEEPSEEK_API_KEY`
متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
`env.shellEnv`).
</Warning>

## الكتالوج المدمج

| مرجع النموذج                 | الاسم             | الإدخال | السياق   | أقصى إخراج | ملاحظات                                   |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | النموذج الافتراضي؛ سطح V4 يدعم التفكير |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | سطح V4 يدعم التفكير                       |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | سطح DeepSeek V3.2 غير مخصص للتفكير       |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | سطح V3.2 مفعّل للاستدلال                 |

<Tip>
تدعم نماذج V4 عنصر تحكم `thinking` في DeepSeek. يعيد OpenClaw أيضًا تشغيل
`reasoning_content` الخاص بـ DeepSeek في الجولات اللاحقة كي تتمكن جلسات التفكير مع
استدعاءات الأدوات من المتابعة.
استخدم `/think xhigh` أو `/think max` مع نماذج DeepSeek V4 لطلب الحد الأقصى من
`reasoning_effort` في DeepSeek.
</Tip>

## التفكير والأدوات

تتضمن جلسات التفكير في DeepSeek V4 عقد إعادة تشغيل أكثر صرامة من معظم
المزوّدين المتوافقين مع OpenAI: بعد أن تستخدم جولة مفعّلة للتفكير أدوات، يتوقع
DeepSeek أن تتضمن رسائل المساعد المعاد تشغيلها من تلك الجولة
`reasoning_content` في الطلبات اللاحقة. يتعامل OpenClaw مع ذلك داخل
DeepSeek Plugin، لذلك يعمل استخدام الأدوات متعدد الجولات بشكل طبيعي مع
`deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`.

إذا بدّلت جلسة حالية من مزوّد آخر متوافق مع OpenAI إلى نموذج
DeepSeek V4، فقد لا تحتوي جولات استدعاء أدوات المساعد الأقدم على
`reasoning_content` الأصلي الخاص بـ DeepSeek. يملأ OpenClaw ذلك الحقل المفقود عند إعادة تشغيل
رسائل المساعد لطلبات التفكير في DeepSeek V4 حتى يتمكن المزوّد من قبول
السجل من دون الحاجة إلى `/new`.

عند تعطيل التفكير في OpenClaw (بما في ذلك تحديد **بلا** في واجهة المستخدم)،
يرسل OpenClaw إلى DeepSeek القيمة `thinking: { type: "disabled" }` ويزيل
`reasoning_content` المعاد تشغيله من السجل الصادر. هذا يبقي جلسات التفكير المعطّل
على مسار DeepSeek غير المخصص للتفكير.

استخدم `deepseek/deepseek-v4-flash` للمسار السريع الافتراضي. استخدم
`deepseek/deepseek-v4-pro` عندما تريد نموذج V4 الأقوى ويمكنك قبول
تكلفة أو زمن استجابة أعلى.

## الاختبار المباشر

تتضمن مجموعة النماذج المباشرة المباشرة DeepSeek V4 في مجموعة النماذج الحديثة. لتشغيل
فحوصات نموذج DeepSeek V4 المباشرة فقط:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

يتحقق هذا الفحص المباشر من أن كلا نموذجي V4 يمكنهما الإكمال، وأن جولات المتابعة
الخاصة بالتفكير/الأدوات تحفظ حمولة إعادة التشغيل التي تتطلبها DeepSeek.

## مثال التكوين

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع التكوين الكامل للوكلاء والنماذج والمزوّدين.
  </Card>
</CardGroup>
