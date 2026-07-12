---
read_when:
    - تريد استخدام نماذج Volcano Engine أو Doubao مع OpenClaw
    - تحتاج إلى إعداد مفتاح API الخاص بـ Volcengine
    - تريد استخدام تحويل النص إلى كلام من Volcengine Speech
summary: إعداد Volcano Engine (نماذج Doubao، ونقاط نهاية البرمجة، وتحويل النص إلى كلام Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T06:30:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

يوفّر مزوّد Volcengine إمكانية الوصول إلى نماذج Doubao ونماذج الجهات الخارجية المستضافة على Volcano Engine، مع نقاط نهاية منفصلة لأعباء العمل العامة والبرمجية. ويسجّل Plugin المضمّن نفسه أيضًا Volcengine Speech كمزوّد لتحويل النص إلى كلام.

| التفصيل                 | القيمة                                                     |
| ----------------------- | ---------------------------------------------------------- |
| المزوّدون               | `volcengine` (عام + تحويل النص إلى كلام)، و`volcengine-plan` (برمجة) |
| مصادقة النموذج          | `VOLCANO_ENGINE_API_KEY`                                   |
| مصادقة تحويل النص إلى كلام | `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API                     | نماذج متوافقة مع OpenAI، وتحويل النص إلى كلام عبر BytePlus Seed Speech |

## بدء الاستخدام

<Steps>
  <Step title="تعيين مفتاح API">
    شغّل الإعداد التفاعلي:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    يسجّل هذا كلاً من المزوّد العام (`volcengine`) ومزوّد البرمجة (`volcengine-plan`) باستخدام مفتاح API واحد.

  </Step>
  <Step title="تعيين نموذج افتراضي">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
للإعداد غير التفاعلي (في CI أو البرمجة النصية)، مرّر المفتاح مباشرةً:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## المزوّدون ونقاط النهاية

| المزوّد           | نقطة النهاية                              | حالة الاستخدام |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | النماذج العامة |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | نماذج البرمجة  |

<Note>
يُضبط كلا المزوّدين باستخدام مفتاح API واحد. ويسجّل الإعداد كليهما تلقائيًا، كما يعيد منتقي النماذج الخاص بمزوّد البرمجة استخدام مصادقة المزوّد العام (`volcengine-plan` هو اسم مصادقة بديل لـ`volcengine`).
</Note>

## الكتالوج المضمّن

<Tabs>
  <Tab title="عام (volcengine)">
    | مرجع النموذج                                  | الاسم                            | الإدخال      | السياق  |
    | -------------------------------------------- | ------------------------------- | ------------ | ------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | نص، صورة     | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | نص، صورة     | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | نص، صورة     | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | نص، صورة     | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | نص، صورة     | 256,000 |
  </Tab>
  <Tab title="البرمجة (volcengine-plan)">
    | مرجع النموذج                                       | الاسم                     | الإدخال | السياق  |
    | ------------------------------------------------- | ------------------------ | ------- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | نص      | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | نص      | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | نص      | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | نص      | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | نص      | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | نص      | 256,000 |
  </Tab>
</Tabs>

كلا الكتالوجين ثابت (من دون استدعاء اكتشاف `/models`) ويدعمان احتساب الاستخدام المتدفق المتوافق مع OpenAI. وتحذف مخططات الأدوات لكلا المزوّدين تلقائيًا الكلمات المفتاحية `minLength` و`maxLength` و`minItems` و`maxItems` و`minContains` و`maxContains`، لأن API استدعاء الأدوات في Volcengine يرفضها.

## تحويل النص إلى كلام

يستخدم تحويل النص إلى كلام في Volcengine واجهة BytePlus Seed Speech HTTP API (`voice.ap-southeast-1.bytepluses.com`)، ويُضبط بشكل منفصل عن مفتاح API الخاص بنماذج Doubao المتوافقة مع OpenAI. في وحدة تحكم BytePlus، افتح Seed Speech > Settings > API Keys، وانسخ مفتاح API، ثم عيّن:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

ثم فعّله في `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

الحقول المتاحة ضمن `messages.tts.providers.volcengine` هي: `apiKey` و`voice` و`speedRatio` ‏(0.2-3.0) و`emotion` و`cluster` و`resourceId` و`appKey` و`baseUrl`. ويعمل `!emotion=<value>` أيضًا كتوجيه صوتي مضمّن عندما يُسمح بتجاوز إعدادات الصوت.

بالنسبة إلى وجهات الملاحظات الصوتية، يطلب OpenClaw التنسيق الأصلي للمزوّد `ogg_opus`. أما مرفقات الصوت العادية، فيطلب التنسيق `mp3`. كما يُحل الاسمان البديلان للمزوّد `bytedance` و`doubao` إلى مزوّد الكلام هذا.

معرّف المورد الافتراضي هو `seed-tts-1.0`، وهو الاستحقاق الذي تمنحه BytePlus افتراضيًا لمفاتيح Seed Speech API المنشأة حديثًا. إذا كان مشروعك يتمتع باستحقاق تحويل النص إلى كلام 2.0، فعيّن `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
المفتاح `VOLCANO_ENGINE_API_KEY` مخصّص لنقاط نهاية نماذج ModelArk/Doubao، وليس مفتاح Seed Speech API. يتطلب تحويل النص إلى كلام مفتاح Seed Speech API من وحدة تحكم BytePlus Speech، أو زوج AppID/رمز مميز قديمًا من وحدة تحكم Speech.
</Warning>

تظل مصادقة AppID/الرمز المميز القديمة مدعومة لتطبيقات وحدة تحكم Speech الأقدم:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

متغيرات البيئة الاختيارية الأخرى لتحويل النص إلى كلام هي: `VOLCENGINE_TTS_VOICE` و`VOLCENGINE_TTS_APP_KEY` و`VOLCENGINE_TTS_BASE_URL`، وهي تتجاوز حقول الضبط المقابلة في `messages.tts.providers.volcengine` عند تعيينها.

## الضبط المتقدم

<AccordionGroup>
  <Accordion title="النموذج الافتراضي بعد الإعداد">
    يعيّن `openclaw onboard --auth-choice volcengine-api-key` النموذج `volcengine-plan/ark-code-latest` كنموذج افتراضي، مع تسجيل كتالوج `volcengine` العام أيضًا.
  </Accordion>

  <Accordion title="سلوك التراجع في منتقي النماذج">
    أثناء اختيار النموذج في الإعداد أو الضبط، يفضّل خيار مصادقة Volcengine كلاً من صفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن تلك النماذج محمّلة بعد، يتراجع OpenClaw إلى الكتالوج غير المصفّى بدلاً من عرض منتقٍ فارغ مقيّد بالمزوّد.
  </Accordion>

  <Accordion title="متغيرات البيئة لعمليات البرنامج الخفي">
    إذا كان Gateway يعمل كبرنامج خفي (launchd/systemd)، فتأكد من إتاحة متغيرات بيئة النموذج وتحويل النص إلى كلام، مثل `VOLCANO_ENGINE_API_KEY` و`VOLCENGINE_TTS_API_KEY` و`BYTEPLUS_SEED_SPEECH_API_KEY` و`VOLCENGINE_TTS_APPID` و`VOLCENGINE_TTS_TOKEN`، لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
عند تشغيل OpenClaw كخدمة في الخلفية، لا تُورّث متغيرات البيئة المعيّنة في الصدفة التفاعلية تلقائيًا. راجع ملاحظة البرنامج الخفي أعلاه.
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="الضبط" href="/ar/gateway/configuration" icon="gear">
    مرجع الضبط الكامل للوكلاء والنماذج والمزوّدين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات تصحيح الأخطاء.
  </Card>
  <Card title="الأسئلة الشائعة" href="/ar/help/faq" icon="circle-question">
    الأسئلة الشائعة حول إعداد OpenClaw.
  </Card>
</CardGroup>
