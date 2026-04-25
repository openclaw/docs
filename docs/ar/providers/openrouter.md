---
read_when:
    - أنت تريد مفتاح API واحدًا للعديد من نماذج LLM
    - أنت تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - أنت تريد استخدام OpenRouter لتوليد الصور
summary: استخدم API الموحّدة الخاصة بـ OpenRouter للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T18:22:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

يوفّر OpenRouter **API موحّدة** توجّه الطلبات إلى العديد من النماذج خلف نقطة نهاية واحدة
ومفتاح API واحد. وهو متوافق مع OpenAI، لذا تعمل معظم حِزم OpenAI SDK بمجرد تغيير عنوان URL الأساسي.

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API من [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(اختياري) بدّل إلى نموذج محدد">
    يستخدم الإعداد الأولي افتراضيًا `openrouter/auto`. اختر نموذجًا محددًا لاحقًا:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## مثال على التهيئة

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## مراجع النماذج

<Note>
تتبع مراجع النماذج النمط `openrouter/<provider>/<model>`. للحصول على القائمة الكاملة
للموفّرين والنماذج المتاحة، راجع [/concepts/model-providers](/ar/concepts/model-providers).
</Note>

أمثلة احتياطية مدمجة:

| مرجع النموذج                         | ملاحظات                         |
| ------------------------------------ | ------------------------------- |
| `openrouter/auto`                    | التوجيه التلقائي في OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 عبر MoonshotAI        |
| `openrouter/openrouter/healer-alpha` | مسار OpenRouter Healer Alpha    |
| `openrouter/openrouter/hunter-alpha` | مسار OpenRouter Hunter Alpha    |

## توليد الصور

يمكن لـ OpenRouter أيضًا تشغيل أداة `image_generate`. استخدم نموذج صور من OpenRouter ضمن `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

يرسل OpenClaw طلبات الصور إلى API صور chat completions في OpenRouter مع `modalities: ["image", "text"]`. تتلقى نماذج صور Gemini تلميحات `aspectRatio` و`resolution` المدعومة عبر `image_config` في OpenRouter. استخدم `agents.defaults.imageGenerationModel.timeoutMs` لنماذج صور OpenRouter الأبطأ؛ وتبقى قيمة `timeoutMs` لكل استدعاء في أداة `image_generate` هي الأعلى أولوية.

## تحويل النص إلى كلام

يمكن أيضًا استخدام OpenRouter كموفّر TTS عبر
نقطة النهاية المتوافقة مع OpenAI ‏`/audio/speech`.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

إذا تم حذف `messages.tts.providers.openrouter.apiKey`، فسيعيد TTS استخدام
`models.providers.openrouter.apiKey`، ثم `OPENROUTER_API_KEY`.

## المصادقة والرؤوس

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك داخليًا.

في طلبات OpenRouter الفعلية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
رؤوس إسناد التطبيق الموثقة في OpenRouter:

| الرأس                     | القيمة                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
إذا أعدت توجيه موفّر OpenRouter إلى وكيل آخر أو عنوان URL أساسي آخر، فلن يقوم OpenClaw
**بحقن** هذه الرؤوس الخاصة بـ OpenRouter أو علامات التخزين المؤقت الخاصة بـ Anthropic.
</Warning>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="علامات التخزين المؤقت الخاصة بـ Anthropic">
    في مسارات OpenRouter المتحقق منها، تحتفظ مراجع نماذج Anthropic
    بعلامات `cache_control` الخاصة بـ Anthropic والمخصصة لـ OpenRouter والتي يستخدمها OpenClaw من أجل
    إعادة استخدام أفضل لذاكرة التخزين المؤقت للمطالبات في كتل مطالبات system/developer.
  </Accordion>

  <Accordion title="حقن التفكير / reasoning">
    في المسارات غير `auto` المدعومة، يربط OpenClaw مستوى التفكير المحدد إلى
    حمولات reasoning الوكيلة في OpenRouter. تتخطى تلميحات النماذج غير المدعومة
    و`openrouter/auto` هذا الحقن الخاص بـ reasoning.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاص بـ OpenAI فقط">
    ما يزال OpenRouter يعمل عبر المسار الوكيل المتوافق مع OpenAI، لذلك
    لا يتم تمرير تشكيل الطلبات الخاص بـ OpenAI الأصلي فقط مثل `serviceTier` و`store` الخاص بـ Responses،
    وحمولات OpenAI reasoning-compat، وتلميحات التخزين المؤقت للمطالبات.
  </Accordion>

  <Accordion title="المسارات المعتمدة على Gemini">
    تبقى مراجع OpenRouter المعتمدة على Gemini على مسار Gemini الوكيل: يحتفظ OpenClaw
    هناك بتنقية توقيع التفكير الخاصة بـ Gemini، لكنه لا يفعّل التحقق الأصلي لإعادة تشغيل Gemini
    أو إعادة الكتابة عند التمهيد.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه الموفّر">
    إذا مرّرت توجيه موفّر OpenRouter ضمن معلمات النموذج، فإن OpenClaw يمرّره
    كبيانات تعريف توجيه OpenRouter قبل تشغيل أغلفة البث المشتركة.
  </Accordion>
</AccordionGroup>

## ذي صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لتهيئة الوكلاء، والنماذج، والموفّرين.
  </Card>
</CardGroup>
