---
read_when:
    - تريد استخدام Volcano Engine أو نماذج Doubao مع OpenClaw
    - تحتاج إلى إعداد مفتاح API الخاص بـ Volcengine
    - تريد استخدام تحويل النص إلى كلام من Volcengine Speech
summary: إعداد Volcano Engine (نماذج Doubao، ونقاط نهاية البرمجة، وSeed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-26T11:39:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 15
---

يوفّر مزوّد Volcengine إمكانية الوصول إلى نماذج Doubao والنماذج التابعة لجهات خارجية
المستضافة على Volcano Engine، مع نقاط نهاية منفصلة لأعباء العمل العامة وأعباء
عمل البرمجة. ويمكن لـ Plugin المضمّن نفسه أيضًا تسجيل Volcengine Speech كمزوّد
TTS.

| التفاصيل   | القيمة                                                     |
| ---------- | ---------------------------------------------------------- |
| المزوّدات  | `volcengine` (عام + TTS) + `volcengine-plan` (للبرمجة)     |
| مصادقة النموذج | `VOLCANO_ENGINE_API_KEY`                                   |
| مصادقة TTS | `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | نماذج متوافقة مع OpenAI، وBytePlus Seed Speech TTS         |

## البدء

<Steps>
  <Step title="تعيين مفتاح API">
    شغّل الإعداد التفاعلي:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    يسجّل هذا كِلَا المزوّدين العام (`volcengine`) ومزوّد البرمجة (`volcengine-plan`) باستخدام مفتاح API واحد.

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
للإعداد غير التفاعلي (CI، والبرمجة النصية)، مرّر المفتاح مباشرةً:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## المزوّدات ونقاط النهاية

| المزوّد           | نقطة النهاية                              | حالة الاستخدام   |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | النماذج العامة   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | نماذج البرمجة    |

<Note>
يتم إعداد كلا المزوّدين باستخدام مفتاح API واحد. ويسجّل الإعداد كليهما تلقائيًا.
</Note>

## الفهرس المضمّن

<Tabs>
  <Tab title="عام (volcengine)">
    | مرجع النموذج                                 | الاسم                            | الإدخال      | السياق |
    | -------------------------------------------- | ------------------------------- | ----------- | ------ |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | نص، صورة    | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | نص، صورة    | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | نص، صورة    | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | نص، صورة    | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | نص، صورة    | 128,000 |
  </Tab>
  <Tab title="للبرمجة (volcengine-plan)">
    | مرجع النموذج                                      | الاسم                     | الإدخال | السياق |
    | ------------------------------------------------- | ------------------------ | ------ | ------ |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | نص     | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | نص     | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | نص     | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | نص     | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | نص     | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | نص     | 256,000 |
  </Tab>
</Tabs>

## تحويل النص إلى كلام

يستخدم Volcengine TTS واجهة BytePlus Seed Speech HTTP API، ويتم إعداده
بشكل منفصل عن مفتاح API الخاص بنماذج Doubao المتوافقة مع OpenAI. في وحدة تحكم BytePlus،
افتح Seed Speech > Settings > API Keys وانسخ مفتاح API، ثم عيّن:

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

بالنسبة إلى أهداف الملاحظات الصوتية، يطلب OpenClaw من Volcengine تنسيق
`ogg_opus` الأصلي الخاص بالمزوّد. وبالنسبة إلى مرفقات الصوت العادية، يطلب
تنسيق `mp3`. كما تُحل الأسماء البديلة للمزوّد `bytedance` و`doubao` إلى مزوّد
الكلام نفسه.

المعرّف الافتراضي للمورد هو `seed-tts-1.0` لأن هذا هو المورد الذي تمنحه BytePlus
لمفاتيح API الجديدة الخاصة بـ Seed Speech في المشروع الافتراضي. إذا كان مشروعك
يملك صلاحية TTS 2.0، فعيّن `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
إن `VOLCANO_ENGINE_API_KEY` مخصّص لنقاط نهاية نماذج ModelArk/Doubao، وليس
مفتاح API لـ Seed Speech. يحتاج TTS إلى مفتاح API لـ Seed Speech من وحدة تحكم
BytePlus Speech، أو إلى زوج AppID/رمز قديم من Speech Console.
</Warning>

لا يزال دعم المصادقة القديمة باستخدام AppID/الرمز متاحًا لتطبيقات Speech Console الأقدم:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="النموذج الافتراضي بعد الإعداد">
    يعيّن `openclaw onboard --auth-choice volcengine-api-key` حاليًا
    `volcengine-plan/ark-code-latest` كنموذج افتراضي، مع تسجيل
    الفهرس العام `volcengine` أيضًا.
  </Accordion>

  <Accordion title="سلوك الرجوع في منتقي النموذج">
    أثناء الإعداد أو اختيار النموذج في التهيئة، يفضّل خيار مصادقة Volcengine
    الصفوف `volcengine/*` و`volcengine-plan/*` معًا. وإذا لم تكن هذه النماذج
    محمّلة بعد، فسيرجع OpenClaw إلى الفهرس غير المصفّى بدلًا من عرض منتقي
    فارغ مقيّد بنطاق المزوّد.
  </Accordion>

  <Accordion title="متغيرات البيئة لعمليات daemon">
    إذا كانت Gateway تعمل كعملية daemon (‏launchd/systemd)، فتأكد من أن متغيرات
    البيئة الخاصة بالنموذج وTTS مثل `VOLCANO_ENGINE_API_KEY` و`VOLCENGINE_TTS_API_KEY`،
    و`BYTEPLUS_SEED_SPEECH_API_KEY`، و`VOLCENGINE_TTS_APPID`، و
    `VOLCENGINE_TTS_TOKEN` متاحة لتلك العملية (على سبيل المثال، في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
عند تشغيل OpenClaw كخدمة في الخلفية، لا يتم توريث متغيرات البيئة المضبوطة في
الصدفة التفاعلية تلقائيًا. راجع ملاحظة daemon أعلاه.
</Warning>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدات، ومراجع النماذج، وسلوك التجاوز عند الفشل.
  </Card>
  <Card title="الإعدادات" href="/ar/gateway/configuration" icon="gear">
    المرجع الكامل لإعدادات الوكلاء، والنماذج، والمزوّدات.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات التصحيح.
  </Card>
  <Card title="الأسئلة الشائعة" href="/ar/help/faq" icon="circle-question">
    الأسئلة الشائعة حول إعداد OpenClaw.
  </Card>
</CardGroup>
