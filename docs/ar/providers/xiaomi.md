---
read_when:
    - تريد نماذج Xiaomi MiMo في OpenClaw
    - تحتاج إلى إعداد مصادقة Xiaomi MiMo أو خطة Token
summary: استخدم نماذج الدفع حسب الاستخدام وخطة الرموز من Xiaomi MiMo مع OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T06:30:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo هي منصة API لنماذج **MiMo**. تسجّل إضافة `xiaomi`
المضمّنة (`enabledByDefault: true`، من دون خطوة تثبيت) موفّرَي نص
بالإضافة إلى موفّر تحويل النص إلى كلام (TTS):

- `xiaomi` - مفاتيح الدفع حسب الاستخدام (`sk-...`)
- `xiaomi-token-plan` - مفاتيح خطة الرموز (`tp-...`) مع إعدادات مسبقة لنقاط النهاية الإقليمية

| الخاصية         | القيمة                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| معرّفات الموفّرين     | `xiaomi` (الدفع حسب الاستخدام)، `xiaomi-token-plan` (خطة الرموز)                                                                                         |
| متغيرات بيئة المصادقة    | `XIAOMI_API_KEY`، `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| علامات الإعداد الأولي | `--auth-choice xiaomi-api-key`، `--auth-choice xiaomi-token-plan-cn`، `--auth-choice xiaomi-token-plan-sgp`، `--auth-choice xiaomi-token-plan-ams` |
| علامات CLI المباشرة | `--xiaomi-api-key <key>`، `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API              | إكمالات محادثة متوافقة مع OpenAI (`openai-completions`)                                                                                          |
| عقد الكلام  | `speechProviders: ["xiaomi"]`                                                                                                                      |
| عناوين URL الأساسية        | الدفع حسب الاستخدام: `https://api.xiaomimimo.com/v1`؛ خطة الرموز: `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                                            |
| النماذج الافتراضية   | `xiaomi/mimo-v2-flash`، `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| إعداد TTS الافتراضي      | `mimo-v2.5-tts`، والصوت `mimo_default`؛ نموذج تصميم الصوت `mimo-v2.5-tts-voicedesign`                                                               |

## البدء

<Steps>
  <Step title="الحصول على المفتاح الصحيح">
    أنشئ مفتاح دفع حسب الاستخدام في [وحدة تحكم Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys)، أو افتح صفحة اشتراك خطة الرموز وانسخ عنوان URL الأساسي الإقليمي المتوافق مع OpenAI مع مفتاح `tp-...` المطابق.
  </Step>

  <Step title="تشغيل الإعداد الأولي">
    الدفع حسب الاستخدام:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    خطة الرموز:

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    أو مرّر المفاتيح مباشرةً:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
يتحقق الإعداد الأولي من صيغة المفتاح ويحذّر عند إدخال مفتاح `tp-...` في مسار الدفع حسب الاستخدام، أو إدخال مفتاح `sk-...` في مسار خطة الرموز.
</Tip>

## كتالوج الدفع حسب الاستخدام

| مرجع النموذج              | الإدخال       | السياق   | الحد الأقصى للإخراج | الاستدلال | ملاحظات         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | نص        | 262,144   | 8,192      | لا        | النموذج الافتراضي |
| `xiaomi/mimo-v2-pro`   | نص        | 1,048,576 | 32,000     | نعم       | سياق كبير |
| `xiaomi/mimo-v2-omni`  | نص، صورة | 262,144   | 32,000     | نعم       | متعدد الوسائط    |

## كتالوج خطة الرموز

اختر خيار مصادقة خطة الرموز المطابق لعنوان URL الأساسي الإقليمي الظاهر في واجهة اشتراك Xiaomi:

| خيار المصادقة             | عنوان URL الأساسي                                   |
| ----------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`  | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp` | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams` | `https://token-plan-ams.xiaomimimo.com/v1` |

| مرجع النموذج                         | الإدخال       | السياق   | الحد الأقصى للإخراج | الاستدلال | ملاحظات         |
| --------------------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | نص        | 1,048,576 | 131,072    | نعم       | النموذج الافتراضي |
| `xiaomi-token-plan/mimo-v2.5`     | نص، صورة | 1,048,576 | 131,072    | نعم       | متعدد الوسائط    |

يحتاج `xiaomi-token-plan` إلى عنوان URL أساسي إقليمي ليتمكّن من التحليل. المسار
المدعوم هو خيار إعداد أولي مضمن لخطة الرموز أو كتلة إعداد
`models.providers.xiaomi-token-plan` صريحة مع ضبط `baseUrl`؛ ولا يُعرض
الموفّر من دون أحد هذين الخيارين.

## نماذج الاستدلال

تدعم `mimo-v2-pro` و`mimo-v2-omni` و`mimo-v2.5` و`mimo-v2.5-pro`
[توجيه `/think`](/ar/tools/thinking) في OpenClaw بالمستويات `off`
و`minimal` و`low` و`medium` و`high` و`xhigh` و`max` (الافتراضي `high`).
لا يدعم `mimo-v2-flash` الاستدلال.

## تحويل النص إلى كلام

تسجّل إضافة `xiaomi` المضمّنة أيضًا Xiaomi MiMo بوصفه موفّر كلام
لـ `messages.tts`. وهي تستدعي عقد TTS لإكمالات المحادثة في Xiaomi مع
النص كرسالة `assistant` وإرشادات أسلوب اختيارية كرسالة `user`.

| الخاصية | القيمة                                    |
| -------- | ---------------------------------------- |
| معرّف TTS   | `xiaomi` (الاسم المستعار `mimo`)                  |
| المصادقة     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` مع `audio` |
| الافتراضي  | `mimo-v2.5-tts`، والصوت `mimo_default`    |
| الإخراج   | MP3 افتراضيًا؛ وWAV عند ضبطه      |

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

الأصوات المضمّنة: `mimo_default` و`default_zh` و`default_en` و`Mia` و`Chloe`
و`Milo` و`Dean`. تستخدم نماذج الأصوات المحددة مسبقًا (`mimo-v2.5-tts` و`mimo-v2-tts`)
`audio.voice`، لذلك يرسل OpenClaw القيمة `speakerVoice` لهذه النماذج.

ينشئ نموذج تصميم الصوت `mimo-v2.5-tts-voicedesign` الصوت من مطالبة أسلوب
بلغة طبيعية بدلًا من معرّف صوت محدد مسبقًا. اضبط `style` على
وصف الصوت المطلوب؛ يرسله OpenClaw كرسالة `user`، ويرسل
النص المنطوق كرسالة `assistant`، ويحذف `audio.voice` لهذا
النموذج.

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

بالنسبة إلى القنوات التي تطلب هدف توليف ملاحظة صوتية (Discord وFeishu
وMatrix وTelegram وWhatsApp)، يحوّل OpenClaw ترميز مخرجات Xiaomi إلى Opus
أحادي القناة بتردد 48 كيلوهرتز باستخدام `ffmpeg` قبل التسليم.

## مثال على الإعداد

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

تأتي علامات التسعير والتوافق من بيان الإضافة المضمّنة، لذلك يحذف مثال الإعداد `cost` و`compat` لتجنّب الاختلاف عن سلوك وقت التشغيل.

خطة الرموز:

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

يأتي التسعير من البيان المضمّن (تتضمن نماذج خطة الرموز تسعيرًا متدرجًا لقراءة ذاكرة التخزين المؤقت)، لذلك يحذف مثال الإعداد `cost`.

<AccordionGroup>
  <Accordion title="سلوك الحقن التلقائي">
    يُفعّل موفّر `xiaomi` تلقائيًا عند ضبط `XIAOMI_API_KEY` في بيئتك أو عند وجود ملف تعريف مصادقة. يحتاج `xiaomi-token-plan` إلى عنوان URL أساسي إقليمي، لذلك يكون المسار المدعوم هو خيار الإعداد الأولي المضمّن لخطة الرموز أو كتلة إعداد `models.providers.xiaomi-token-plan` صريحة.
  </Accordion>

  <Accordion title="تفاصيل النماذج">
    - **mimo-v2-flash** - خفيف وسريع، ومثالي لمهام النصوص ذات الأغراض العامة. لا يدعم الاستدلال.
    - **mimo-v2-pro** - يدعم الاستدلال مع نافذة سياق بسعة مليون رمز لأعباء عمل المستندات الطويلة.
    - **mimo-v2-omni** - نموذج متعدد الوسائط يدعم الاستدلال ويقبل إدخالات النصوص والصور.
    - **mimo-v2.5-pro** - النموذج الافتراضي لخطة الرموز مع حزمة الاستدلال V2.5 الحالية من Xiaomi.
    - **mimo-v2.5** - مسار V2.5 متعدد الوسائط لخطة الرموز.

    <Note>
    تستخدم نماذج الدفع حسب الاستخدام البادئة `xiaomi/`. وتستخدم نماذج خطة الرموز البادئة `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - إذا لم تظهر النماذج، فتأكد من وجود متغير بيئة المفتاح ذي الصلة أو ملف تعريف المصادقة ومن صلاحيته.
    - بالنسبة إلى خطة الرموز، تأكد من تطابق منطقة الإعداد الأولي المختارة مع عنوان URL الأساسي في صفحة الاشتراك، ومن أن المفتاح يبدأ بـ `tp-`.
    - عندما يعمل Gateway كخدمة خفية، تأكد من توفر المفتاح لهذه العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Warning>
    المفاتيح المضبوطة في صدفة الأوامر التفاعلية فقط لا تكون مرئية لعمليات Gateway التي تديرها الخدمات الخفية. استخدم إعداد `~/.openclaw/.env` أو `env.shellEnv` لضمان التوفر الدائم.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مستويات التفكير" href="/ar/tools/thinking" icon="brain">
    صياغة توجيه `/think` وتعيين المستويات.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع إعداد OpenClaw الكامل.
  </Card>
  <Card title="وحدة تحكم Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    لوحة معلومات Xiaomi MiMo وإدارة مفاتيح API.
  </Card>
</CardGroup>
