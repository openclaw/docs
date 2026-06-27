---
read_when:
    - تريد نماذج Xiaomi MiMo في OpenClaw
    - تحتاج إلى مصادقة Xiaomi MiMo أو إعداد خطة الرمز المميز
summary: استخدم نماذج الدفع حسب الاستخدام وToken Plan من Xiaomi MiMo مع OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:29:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo هي منصة API لنماذج **MiMo**. يتضمن OpenClaw Plugin مضمّنًا من Xiaomi بإعدادين مسبقين لمزوّد النصوص:

- `xiaomi` لمفاتيح الدفع حسب الاستخدام (`sk-...`)
- `xiaomi-token-plan` لمفاتيح Token Plan (`tp-...`) مع إعدادات مسبقة لنقاط النهاية الإقليمية

يسجّل Plugin نفسه أيضًا مزوّد الكلام (TTS) `xiaomi`.

| الخاصية | القيمة |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| معرّفات المزوّد | `xiaomi` (الدفع حسب الاستخدام)، `xiaomi-token-plan` (Token Plan) |
| Plugin | مضمّن، `enabledByDefault: true` |
| متغيرات بيئة المصادقة | `XIAOMI_API_KEY`، `XIAOMI_TOKEN_PLAN_API_KEY` |
| أعلام الإعداد الأولي | `--auth-choice xiaomi-api-key`، `--auth-choice xiaomi-token-plan-cn`، `--auth-choice xiaomi-token-plan-sgp`، `--auth-choice xiaomi-token-plan-ams` |
| أعلام CLI المباشرة | `--xiaomi-api-key <key>`، `--xiaomi-token-plan-api-key <key>` |
| العقود | إكمالات الدردشة + `speechProviders` |
| API | متوافقة مع OpenAI (`openai-completions`) |
| عناوين URL الأساسية | الدفع حسب الاستخدام: `https://api.xiaomimimo.com/v1`؛ إعدادات Token Plan المسبقة: `token-plan-{cn,sgp,ams}...` |
| النماذج الافتراضية | `xiaomi/mimo-v2-flash`، `xiaomi-token-plan/mimo-v2.5-pro` |
| إعداد TTS الافتراضي | `mimo-v2.5-tts`، الصوت `mimo_default`؛ نموذج تصميم الصوت `mimo-v2.5-tts-voicedesign` |

## البدء

<Steps>
  <Step title="Get the right key">
    أنشئ مفتاح دفع حسب الاستخدام في [وحدة تحكم Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys)، أو افتح صفحة اشتراك Token Plan لديك وانسخ عنوان URL الأساسي الإقليمي المتوافق مع OpenAI مع مفتاح `tp-...` المطابق.
  </Step>

  <Step title="Run onboarding">
    الدفع حسب الاستخدام:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    أو مرّر المفاتيح مباشرة:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

## كتالوج الدفع حسب الاستخدام

| مرجع النموذج | الإدخال | السياق | الحد الأقصى للمخرجات | الاستدلال | ملاحظات |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | نص | 262,144 | 8,192 | لا | النموذج الافتراضي |
| `xiaomi/mimo-v2-pro` | نص | 1,048,576 | 32,000 | نعم | سياق كبير |
| `xiaomi/mimo-v2-omni` | نص، صورة | 262,144 | 32,000 | نعم | متعدد الوسائط |

<Tip>
مرجع النموذج الافتراضي هو `xiaomi/mimo-v2-flash`. يُحقن المزوّد تلقائيًا عند تعيين `XIAOMI_API_KEY` أو وجود ملف تعريف مصادقة.
</Tip>

## كتالوج Token Plan

اختر خيار مصادقة Token Plan الذي يطابق عنوان URL الأساسي الإقليمي المعروض في واجهة اشتراك Xiaomi:

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| مرجع النموذج | الإدخال | السياق | الحد الأقصى للمخرجات | الاستدلال | ملاحظات |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | نص | 1,048,576 | 131,072 | نعم | النموذج الافتراضي |
| `xiaomi-token-plan/mimo-v2.5` | نص، صورة | 1,048,576 | 131,072 | نعم | متعدد الوسائط |

<Tip>
يتحقق إعداد Token Plan الأولي من شكل المفتاح وينبّه عند إدخال مفتاح `tp-...` في مسار الدفع حسب الاستخدام، أو إدخال مفتاح `sk-...` في مسار Token Plan.
</Tip>

## تحويل النص إلى كلام

يسجّل Plugin `xiaomi` المضمّن أيضًا Xiaomi MiMo كمزوّد كلام لـ
`messages.tts`. يستدعي عقد TTS لإكمالات الدردشة من Xiaomi مع النص كرسالة
`assistant` وإرشادات الأسلوب الاختيارية كرسالة `user`.

| الخاصية | القيمة |
| -------- | ---------------------------------------- |
| معرّف TTS | `xiaomi` (الاسم المستعار `mimo`) |
| المصادقة | `XIAOMI_API_KEY` |
| API | `POST /v1/chat/completions` مع `audio` |
| الافتراضي | `mimo-v2.5-tts`، الصوت `mimo_default` |
| المخرجات | MP3 افتراضيًا؛ WAV عند التهيئة |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

تشمل الأصوات المدمجة المدعومة `mimo_default` و`default_zh` و`default_en`
و`Mia` و`Chloe` و`Milo` و`Dean`. تستخدم نماذج الأصوات المسبقة `audio.voice`، لذلك
يرسل OpenClaw `speakerVoice` لـ `mimo-v2.5-tts` و`mimo-v2-tts`.

ينشئ نموذج تصميم الصوت من Xiaomi، `mimo-v2.5-tts-voicedesign`، الصوت
من مطالبة أسلوب بلغة طبيعية بدلًا من معرّف صوت مسبق. هيّئ
`style` بوصف الصوت المطلوب؛ يرسله OpenClaw كرسالة `user`،
ويرسل النص المنطوق كرسالة `assistant`، ويحذف
`audio.voice` لهذا النموذج.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

بالنسبة إلى أهداف الملاحظات الصوتية مثل Feishu وTelegram، يحوّل OpenClaw
مخرجات Xiaomi إلى Opus بتردد 48 كيلوهرتز باستخدام `ffmpeg` قبل التسليم.

## مثال التهيئة

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

تأتي أعلام التسعير والتوافق من بيان Plugin المضمّن، لذلك يحذف مثال التهيئة `cost` و`compat` لتجنب الاختلاف عن سلوك وقت التشغيل.

Token Plan:

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

يأتي التسعير من البيان المضمّن (تتضمن نماذج Token Plan تسعير قراءة ذاكرة التخزين المؤقت متعدد المستويات)، لذلك يحذف مثال التهيئة `cost`.

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    يُحقن مزوّد `xiaomi` تلقائيًا عند تعيين `XIAOMI_API_KEY` في بيئتك أو وجود ملف تعريف مصادقة. يحتاج `xiaomi-token-plan` إلى عنوان URL أساسي إقليمي، لذلك المسار المدعوم هو خيار إعداد Token Plan الأولي المضمّن أو كتلة تهيئة `models.providers.xiaomi-token-plan` صريحة.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — خفيف وسريع، ومثالي لمهام النصوص العامة. لا يدعم الاستدلال.
    - **mimo-v2-pro** — يدعم الاستدلال مع نافذة سياق قدرها مليون رمز لأعباء عمل المستندات الطويلة.
    - **mimo-v2-omni** — نموذج متعدد الوسائط يدعم الاستدلال ويقبل إدخالات النص والصورة.
    - **mimo-v2.5-pro** — الافتراضي في Token Plan مع حزمة الاستدلال الحالية V2.5 من Xiaomi.
    - **mimo-v2.5** — مسار V2.5 متعدد الوسائط في Token Plan.

    <Note>
    تستخدم نماذج الدفع حسب الاستخدام البادئة `xiaomi/`. تستخدم نماذج Token Plan البادئة `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - إذا لم تظهر النماذج، فتأكد من وجود متغير بيئة المفتاح المعني أو ملف تعريف المصادقة وأنه صالح.
    - بالنسبة إلى Token Plan، تأكد من أن منطقة الإعداد الأولي المختارة تطابق عنوان URL الأساسي في صفحة الاشتراك وأن المفتاح يبدأ بـ `tp-`.
    - عند تشغيل Gateway كبرنامج خفي، تأكد من أن المفتاح متاح لتلك العملية (مثلًا في `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Warning>
    المفاتيح المعيّنة فقط في الصدفة التفاعلية لديك لا تكون مرئية لعمليات Gateway المُدارة كبرامج خفية. استخدم تهيئة `~/.openclaw/.env` أو `env.shellEnv` للتوافر المستمر.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع تهيئة OpenClaw الكامل.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    لوحة تحكم Xiaomi MiMo وإدارة مفاتيح API.
  </Card>
</CardGroup>
