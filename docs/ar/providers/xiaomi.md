---
read_when:
    - تريد نماذج Xiaomi MiMo في OpenClaw
    - يلزم إعداد XIAOMI_API_KEY
summary: استخدام نماذج Xiaomi MiMo مع OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T08:11:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo هي منصة API لنماذج **MiMo**. يتضمن OpenClaw ‏Plugin مضمنا باسم `xiaomi` يسجل موفر محادثة متوافقا مع OpenAI وموفر كلام (TTS) مقابل `XIAOMI_API_KEY` نفسه.

| الخاصية        | القيمة                                   |
| --------------- | ---------------------------------------- |
| معرف الموفر     | `xiaomi`                                 |
| Plugin          | مضمن، `enabledByDefault: true`           |
| متغير بيئة المصادقة | `XIAOMI_API_KEY`                         |
| علم الإعداد الأولي | `--auth-choice xiaomi-api-key`           |
| علم CLI المباشر | `--xiaomi-api-key <key>`                 |
| العقود          | إكمالات المحادثة + `speechProviders`     |
| API             | متوافق مع OpenAI (`openai-completions`) |
| عنوان URL الأساسي | `https://api.xiaomimimo.com/v1`          |
| النموذج الافتراضي | `xiaomi/mimo-v2-flash`                   |
| TTS الافتراضي   | `mimo-v2.5-tts`، الصوت `mimo_default`    |

## البدء

<Steps>
  <Step title="احصل على مفتاح API">
    أنشئ مفتاح API في [وحدة تحكم Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="شغل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    أو مرر المفتاح مباشرة:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="تحقق من توفر النموذج">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## الفهرس المدمج

| مرجع النموذج           | الإدخال     | السياق    | الحد الأقصى للإخراج | الاستدلال | ملاحظات            |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | نص          | 262,144   | 8,192      | لا        | النموذج الافتراضي |
| `xiaomi/mimo-v2-pro`   | نص          | 1,048,576 | 32,000     | نعم       | سياق كبير          |
| `xiaomi/mimo-v2-omni`  | نص، صورة    | 262,144   | 32,000     | نعم       | متعدد الوسائط      |

<Tip>
مرجع النموذج الافتراضي هو `xiaomi/mimo-v2-flash`. يتم حقن الموفر تلقائيا عند تعيين `XIAOMI_API_KEY` أو عند وجود ملف تعريف مصادقة.
</Tip>

## تحويل النص إلى كلام

يسجل Plugin المضمن `xiaomi` أيضا Xiaomi MiMo كموفر كلام لـ
`messages.tts`. يستدعي عقد TTS الخاص بإكمالات محادثة Xiaomi مع النص كرسالة
`assistant` وإرشادات النمط الاختيارية كرسالة `user`.

| الخاصية | القيمة                                   |
| -------- | ---------------------------------------- |
| معرف TTS | `xiaomi` (الاسم المستعار `mimo`)         |
| المصادقة | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` مع `audio`   |
| الافتراضي | `mimo-v2.5-tts`، الصوت `mimo_default`    |
| الإخراج  | MP3 افتراضيا؛ WAV عند تهيئته            |

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
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

تشمل الأصوات المدمجة المدعومة `mimo_default` و`default_zh` و`default_en`
و`Mia` و`Chloe` و`Milo` و`Dean`. يدعم `mimo-v2-tts` حسابات MiMo TTS
الأقدم؛ ويستخدم الافتراضي نموذج MiMo-V2.5 TTS الحالي. بالنسبة إلى أهداف
الملاحظات الصوتية مثل Feishu وTelegram، يحول OpenClaw مخرجات Xiaomi إلى Opus
بتردد 48kHz باستخدام `ffmpeg` قبل التسليم.

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
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="سلوك الحقن التلقائي">
    يتم حقن موفر `xiaomi` تلقائيا عند تعيين `XIAOMI_API_KEY` في بيئتك أو عند وجود ملف تعريف مصادقة. لا تحتاج إلى تهيئة الموفر يدويا إلا إذا أردت تجاوز بيانات تعريف النموذج أو عنوان URL الأساسي.
  </Accordion>

  <Accordion title="تفاصيل النموذج">
    - **mimo-v2-flash** — خفيف وسريع، ومثالي لمهام النص العامة. لا يدعم الاستدلال.
    - **mimo-v2-pro** — يدعم الاستدلال مع نافذة سياق بحجم 1M من الرموز لأعباء عمل المستندات الطويلة.
    - **mimo-v2-omni** — نموذج متعدد الوسائط ممكّن للاستدلال يقبل إدخالات النص والصورة معا.

    <Note>
    تستخدم جميع النماذج البادئة `xiaomi/` (على سبيل المثال `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - إذا لم تظهر النماذج، فتأكد من أن `XIAOMI_API_KEY` معين وصالح.
    - عندما يعمل Gateway كخادم خلفي، تأكد من توفر المفتاح لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Warning>
    المفاتيح المعينة فقط في الصدفة التفاعلية لديك لا تكون مرئية لعمليات gateway التي يديرها الخادم الخلفي. استخدم تهيئة `~/.openclaw/.env` أو `env.shellEnv` لضمان التوفر الدائم.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع تهيئة OpenClaw الكامل.
  </Card>
  <Card title="وحدة تحكم Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    لوحة معلومات Xiaomi MiMo وإدارة مفاتيح API.
  </Card>
</CardGroup>
