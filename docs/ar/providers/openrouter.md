---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج LLM
    - تريد تشغيل النماذج عبر OpenRouter في OpenClaw
    - تريد استخدام OpenRouter لتوليد الصور
summary: استخدم واجهة OpenRouter الموحدة للوصول إلى العديد من النماذج في OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T08:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

يوفّر OpenRouter **واجهة API موحدة** توجّه الطلبات إلى العديد من النماذج خلف نقطة
نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذا تعمل معظم SDKs الخاصة بـ OpenAI بمجرد تبديل base URL.

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API من [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="شغّل onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(اختياري) بدّل إلى نموذج محدد">
    يستخدم onboarding افتراضيًا `openrouter/auto`. ويمكنك اختيار نموذج فعلي لاحقًا:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## مثال على الإعداد

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
تتبع مراجع النماذج النمط `openrouter/<provider>/<model>`. وللحصول على القائمة الكاملة لـ
providers والنماذج المتاحة، راجع [/concepts/model-providers](/ar/concepts/model-providers).
</Note>

أمثلة fallbacks المضمنة:

| مرجع النموذج | ملاحظات |
| ------------ | -------- |
| `openrouter/auto` | التوجيه التلقائي في OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | ‏Kimi K2.6 عبر MoonshotAI |
| `openrouter/openrouter/healer-alpha` | مسار OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | مسار OpenRouter Hunter Alpha |

## توليد الصور

يمكن لـ OpenRouter أيضًا دعم الأداة `image_generate`. استخدم نموذج صور من OpenRouter تحت `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

يرسل OpenClaw طلبات الصور إلى واجهة chat completions image الخاصة بـ OpenRouter مع `modalities: ["image", "text"]`. وتتلقى نماذج صور Gemini التلميحات المدعومة لـ `aspectRatio` و`resolution` عبر `image_config` الخاصة بـ OpenRouter.

## المصادقة والرؤوس

يستخدم OpenRouter رمز Bearer مع مفتاح API الخاص بك في الخلفية.

وعند طلبات OpenRouter الفعلية (`https://openrouter.ai/api/v1`)، يضيف OpenClaw أيضًا
رؤوس إسناد التطبيق الموثقة الخاصة بـ OpenRouter:

| الرأس | القيمة |
| ------ | ------ |
| `HTTP-Referer` | `https://openclaw.ai` |
| `X-OpenRouter-Title` | `OpenClaw` |
| `X-OpenRouter-Categories` | `cli-agent` |

<Warning>
إذا أعدت توجيه OpenRouter provider إلى وكيل آخر أو base URL آخر، فلن يحقن OpenClaw
تلك الرؤوس الخاصة بـ OpenRouter أو علامات Anthropic الخاصة بالذاكرة المؤقتة.
</Warning>

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="علامات الذاكرة المؤقتة الخاصة بـ Anthropic">
    في المسارات المتحقق منها في OpenRouter، تحتفظ مراجع نماذج Anthropic بعلامات
    `cache_control` الخاصة بـ Anthropic والمخصصة لـ OpenRouter والتي يستخدمها OpenClaw من أجل
    إعادة استخدام أفضل للذاكرة المؤقتة الخاصة بـ prompt في كتل system/developer prompt.
  </Accordion>

  <Accordion title="حقن التفكير / الاستدلال">
    في المسارات غير `auto` المدعومة، يقوم OpenClaw بربط مستوى التفكير المحدد إلى
    حمولات reasoning الوكيلة الخاصة بـ OpenRouter. أما تلميحات النماذج غير المدعومة و
    `openrouter/auto` فتتجاوز هذا الحقن الخاص بالاستدلال.
  </Accordion>

  <Accordion title="تشكيل الطلبات الخاص بـ OpenAI فقط">
    لا يزال OpenRouter يعمل عبر المسار الوكيل المتوافق مع OpenAI، لذلك
    لا يتم تمرير تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط مثل `serviceTier`، و`store` الخاصة بـ Responses،
    وحمولات توافق reasoning الخاصة بـ OpenAI، وتلميحات الذاكرة المؤقتة لـ prompt.
  </Accordion>

  <Accordion title="المسارات المدعومة بـ Gemini">
    تبقى مراجع OpenRouter المدعومة بـ Gemini على مسار proxy-Gemini: يحتفظ OpenClaw
    هناك بتنقية thought-signature الخاصة بـ Gemini، لكنه لا يفعّل التحقق الأصلي من replay في Gemini
    أو إعادة كتابة bootstrap.
  </Accordion>

  <Accordion title="بيانات تعريف توجيه provider">
    إذا مررت توجيه provider الخاص بـ OpenRouter ضمن معلمات النموذج، فسيقوم OpenClaw بتمريره
    كبيانات تعريف توجيه OpenRouter قبل تشغيل stream wrappers المشتركة.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار providers، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لإعدادات الوكلاء، والنماذج، وproviders.
  </Card>
</CardGroup>
