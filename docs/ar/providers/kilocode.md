---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج LLM
    - تريد تشغيل النماذج عبر Kilo Gateway في OpenClaw
summary: استخدم واجهة API الموحّدة في Kilo Gateway للوصول إلى نماذج عديدة في OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:25:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

توفر Kilo Gateway **واجهة API موحدة** توجه الطلبات إلى نماذج كثيرة خلف نقطة نهاية واحدة ومفتاح API واحد. وهي متوافقة مع OpenAI، لذلك تعمل معظم حِزم OpenAI SDK عبر تغيير عنوان URL الأساسي.

| الخاصية | القيمة                              |
| -------- | ---------------------------------- |
| الموفر | `kilocode`                         |
| المصادقة     | `KILOCODE_API_KEY`                 |
| واجهة API      | متوافقة مع OpenAI                  |
| عنوان URL الأساسي | `https://api.kilo.ai/api/gateway/` |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## البدء

<Steps>
  <Step title="Create an account">
    انتقل إلى [app.kilo.ai](https://app.kilo.ai)، وسجّل الدخول أو أنشئ حسابًا، ثم انتقل إلى API Keys وأنشئ مفتاحًا جديدًا.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    أو اضبط متغير البيئة مباشرةً:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## النموذج الافتراضي

النموذج الافتراضي هو `kilocode/kilo/auto`، وهو نموذج توجيه ذكي مملوك للموفر
وتديره Kilo Gateway.

<Note>
يتعامل OpenClaw مع `kilocode/kilo/auto` على أنه مرجع افتراضي مستقر، لكنه لا
ينشر تعيينًا مدعومًا بالمصدر من المهمة إلى النموذج العلوي لذلك المسار. التوجيه
العلوي الدقيق خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway، وليس
مضمّنًا بشكل ثابت في OpenClaw.
</Note>

## الفهرس المدمج

يكتشف OpenClaw النماذج المتاحة ديناميكيًا من Kilo Gateway عند بدء التشغيل. استخدم
`/models kilocode` للاطلاع على القائمة الكاملة للنماذج المتاحة لحسابك.

يمكن استخدام أي نموذج متاح على Gateway مع بادئة `kilocode/`:

| مرجع النموذج                                | ملاحظات                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | الافتراضي — توجيه ذكي            |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic عبر Kilo                 |
| `kilocode/openai/gpt-5.5`                | OpenAI عبر Kilo                    |
| `kilocode/google/gemini-3.1-pro-preview` | Google عبر Kilo                    |
| ...وغير ذلك الكثير                         | استخدم `/models kilocode` لسرد الكل |

<Tip>
عند بدء التشغيل، يستعلم OpenClaw عن `GET https://api.kilo.ai/api/gateway/models` ويدمج
النماذج المكتشفة قبل فهرس الاحتياط الثابت. يتضمن الاحتياط الثابت دائمًا
`kilocode/kilo/auto` (`Kilo Auto`) مع `input: ["text", "image"]`،
و`reasoning: true`، و`contextWindow: 1000000`، و`maxTokens: 128000`.
</Tip>

## مثال إعداد

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway موثقة في المصدر على أنها متوافقة مع OpenRouter، لذلك تبقى على
    المسار المتوافق مع OpenAI بنمط الوكيل بدلًا من تشكيل طلبات OpenAI الأصلي.

    - تبقى مراجع Kilo المدعومة بـ Gemini على مسار Gemini عبر الوكيل، لذلك يحتفظ OpenClaw
      بتنقية توقيع التفكير الخاص بـ Gemini هناك دون تمكين تحقق إعادة التشغيل الأصلي لـ Gemini
      أو إعادة كتابة التمهيد.
    - تستخدم Kilo Gateway رمز Bearer مع مفتاح API الخاص بك داخليًا.

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    يضيف مغلف البث المشترك في Kilo ترويسة تطبيق الموفر ويطبع
    حمولات الاستدلال عبر الوكيل لمراجع النماذج المحددة المدعومة.

    <Warning>
    يتخطى `kilocode/kilo/auto` والتلميحات الأخرى غير المدعومة للاستدلال عبر الوكيل
    حقن الاستدلال. إذا كنت تحتاج إلى دعم الاستدلال، فاستخدم مرجع نموذج محددًا مثل
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - إذا فشل اكتشاف النماذج عند بدء التشغيل، يعود OpenClaw إلى الفهرس الثابت الذي يحتوي على `kilocode/kilo/auto`.
    - تأكد من أن مفتاح API صالح وأن حساب Kilo الخاص بك لديه النماذج المطلوبة مفعلة.
    - عندما يعمل Gateway كخدمة خلفية، تأكد من أن `KILOCODE_API_KEY` متاح لتلك العملية (مثلًا في `~/.openclaw/.env` أو عبر `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع إعداد OpenClaw الكامل.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    لوحة معلومات Kilo Gateway، ومفاتيح API، وإدارة الحساب.
  </Card>
</CardGroup>
