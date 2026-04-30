---
read_when:
    - تريد استخدام DeepSeek مع OpenClaw
    - تحتاج إلى متغير بيئة مفتاح API أو اختيار مصادقة CLI
summary: إعداد DeepSeek (المصادقة + اختيار النموذج)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T16:29:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) يوفّر نماذج ذكاء اصطناعي قوية بواجهة API متوافقة مع OpenAI.

| الخاصية | القيمة                    |
| -------- | -------------------------- |
| المزوّد | `deepseek`                 |
| المصادقة | `DEEPSEEK_API_KEY`         |
| API      | متوافق مع OpenAI          |
| عنوان URL الأساسي | `https://api.deepseek.com` |

## بدء الاستخدام

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API على [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    سيطلب هذا مفتاح API الخاص بك ويعيّن `deepseek/deepseek-v4-flash` كنموذج افتراضي.

  </Step>
  <Step title="تحقّق من توفر النماذج">
    ```bash
    openclaw models list --provider deepseek
    ```

    لفحص الكتالوج الثابت المضمّن بدون الحاجة إلى Gateway قيد التشغيل،
    استخدم:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="إعداد غير تفاعلي">
    للتثبيتات النصية أو التي تعمل بلا واجهة، مرّر كل العلامات مباشرة:

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
إذا كان Gateway يعمل كخدمة خلفية (launchd/systemd)، فتأكد من أن `DEEPSEEK_API_KEY`
متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
`env.shellEnv`).
</Warning>

## الكتالوج المضمّن

| مرجع النموذج                 | الاسم             | الإدخال | السياق   | الحد الأقصى للإخراج | ملاحظات                                   |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | النموذج الافتراضي؛ سطح V4 يدعم التفكير |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | سطح V4 يدعم التفكير                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | سطح DeepSeek V3.2 غير مخصص للتفكير         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | سطح V3.2 مفعّل للاستدلال             |

<Tip>
تدعم نماذج V4 عنصر التحكم `thinking` في DeepSeek. يعيد OpenClaw أيضًا تشغيل
`reasoning_content` من DeepSeek في الجولات اللاحقة حتى تتمكن جلسات التفكير التي تتضمن
استدعاءات أدوات من المتابعة.
استخدم `/think xhigh` أو `/think max` مع نماذج DeepSeek V4 لطلب
الحد الأقصى من `reasoning_effort` لدى DeepSeek.
</Tip>

## التفكير والأدوات

لجلسات التفكير في DeepSeek V4 عقد إعادة تشغيل أكثر صرامة من معظم
المزوّدين المتوافقين مع OpenAI: بعد أن تستخدم جولة مفعّلة للتفكير الأدوات، يتوقع DeepSeek
أن تتضمن رسائل المساعد المعاد تشغيلها من تلك الجولة
`reasoning_content` في الطلبات اللاحقة. يتعامل OpenClaw مع هذا داخل
Plugin الخاص بـ DeepSeek، لذلك يعمل استخدام الأدوات الطبيعي متعدد الجولات مع
`deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`.

إذا بدّلت جلسة حالية من مزوّد آخر متوافق مع OpenAI إلى
نموذج DeepSeek V4، فقد لا تحتوي جولات استدعاء أدوات المساعد الأقدم على
`reasoning_content` أصلي من DeepSeek. يملأ OpenClaw ذلك الحقل المفقود عند إعادة تشغيل
رسائل المساعد لطلبات التفكير في DeepSeek V4 حتى يتمكن المزوّد من قبول
السجل بدون الحاجة إلى `/new`.

عند تعطيل التفكير في OpenClaw (بما في ذلك اختيار **None** في الواجهة)،
يرسل OpenClaw إلى DeepSeek `thinking: { type: "disabled" }` ويزيل
`reasoning_content` المعاد تشغيله من السجل الصادر. هذا يُبقي جلسات التفكير المعطّل
على مسار DeepSeek غير المخصص للتفكير.

استخدم `deepseek/deepseek-v4-flash` للمسار السريع الافتراضي. استخدم
`deepseek/deepseek-v4-pro` عندما تريد نموذج V4 الأقوى ويمكنك قبول
تكلفة أو زمن استجابة أعلى.

## الاختبار المباشر

تتضمن مجموعة النماذج المباشرة الحية نموذج DeepSeek V4 ضمن مجموعة النماذج الحديثة. لتشغيل
فحوصات النماذج المباشرة الخاصة بـ DeepSeek V4 فقط:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

يتحقق ذلك الفحص المباشر من أن كلا نموذجي V4 يمكنهما الإكمال، وأن جولات المتابعة الخاصة بالتفكير/الأدوات
تحافظ على حمولة إعادة التشغيل التي يتطلبها DeepSeek.

## مثال إعداد

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

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل للوكلاء والنماذج والمزوّدين.
  </Card>
</CardGroup>
