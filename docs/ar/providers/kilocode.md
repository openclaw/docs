---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج LLM
    - تريد تشغيل النماذج عبر Kilo Gateway في OpenClaw
summary: استخدم واجهة API الموحّدة الخاصة بـ Kilo Gateway للوصول إلى العديد من النماذج في OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-30T08:21:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

يوفر Kilo Gateway **واجهة API موحدة** توجه الطلبات إلى عدة نماذج خلف نقطة
نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذلك تعمل معظم حزم OpenAI SDK بمجرد تغيير عنوان URL الأساسي.

| الخاصية | القيمة                              |
| -------- | ---------------------------------- |
| المزوّد | `kilocode`                         |
| المصادقة     | `KILOCODE_API_KEY`                 |
| API      | متوافق مع OpenAI                  |
| عنوان URL الأساسي | `https://api.kilo.ai/api/gateway/` |

## بدء الاستخدام

<Steps>
  <Step title="إنشاء حساب">
    انتقل إلى [app.kilo.ai](https://app.kilo.ai)، وسجّل الدخول أو أنشئ حسابًا، ثم انتقل إلى مفاتيح API وأنشئ مفتاحًا جديدًا.
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    أو عيّن متغير البيئة مباشرة:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## النموذج الافتراضي

النموذج الافتراضي هو `kilocode/kilo/auto`، وهو نموذج توجيه ذكي مملوك للمزوّد
وتديره Kilo Gateway.

<Note>
يتعامل OpenClaw مع `kilocode/kilo/auto` باعتباره مرجعًا افتراضيًا مستقرًا، لكنه لا
ينشر تعيينًا مدعومًا بالمصدر من المهمة إلى النموذج العلوي لذلك المسار. التوجيه
العلوي الدقيق خلف `kilocode/kilo/auto` تملكه Kilo Gateway، وليس
مضمّنًا بشكل ثابت في OpenClaw.
</Note>

## الكتالوج المدمج

يكتشف OpenClaw النماذج المتاحة ديناميكيًا من Kilo Gateway عند بدء التشغيل. استخدم
`/models kilocode` للاطلاع على القائمة الكاملة للنماذج المتاحة مع حسابك.

يمكن استخدام أي نموذج متاح على Gateway مع البادئة `kilocode/`:

| مرجع النموذج                              | الملاحظات                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | الافتراضي — توجيه ذكي            |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic عبر Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI عبر Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google عبر Kilo                    |
| ...وغير ذلك الكثير                       | استخدم `/models kilocode` لسرد الكل |

<Tip>
عند بدء التشغيل، يستعلم OpenClaw عن `GET https://api.kilo.ai/api/gateway/models` ويدمج
النماذج المكتشفة قبل كتالوج الرجوع الثابت. يتضمن الرجوع المضمّن دائمًا
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
  <Accordion title="النقل والتوافق">
    Kilo Gateway موثق في المصدر باعتباره متوافقًا مع OpenRouter، لذلك يبقى على
    مسار النمط الوكيلي المتوافق مع OpenAI بدلًا من تشكيل طلبات OpenAI الأصلية.

    - تبقى مراجع Kilo المدعومة من Gemini على مسار proxy-Gemini، لذلك يحتفظ OpenClaw
      بتنقية تواقيع التفكير الخاصة بـ Gemini هناك دون تمكين تحقق إعادة التشغيل الأصلي لـ Gemini
      أو إعادة كتابة التمهيد.
    - يستخدم Kilo Gateway رمز Bearer مع مفتاح API الخاص بك ضمنيًا.

  </Accordion>

  <Accordion title="غلاف البث والاستدلال">
    يضيف غلاف البث المشترك في Kilo ترويسة تطبيق المزوّد ويطبع
    حمولات استدلال الوكيل لمراجع النماذج المحددة المدعومة.

    <Warning>
    يتخطى `kilocode/kilo/auto` وتلميحات أخرى غير مدعومة لاستدلال الوكيل حقن الاستدلال.
    إذا كنت تحتاج إلى دعم الاستدلال، فاستخدم مرجع نموذج محددًا مثل
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - إذا فشل اكتشاف النموذج عند بدء التشغيل، يعود OpenClaw إلى الكتالوج الثابت المضمّن الذي يحتوي على `kilocode/kilo/auto`.
    - تأكد من أن مفتاح API الخاص بك صالح وأن حساب Kilo لديك فعّل النماذج المطلوبة.
    - عندما يعمل Gateway كخدمة daemon، تأكد من أن `KILOCODE_API_KEY` متاح لتلك العملية (مثلًا في `~/.openclaw/.env` أو عبر `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع إعداد OpenClaw الكامل.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    لوحة تحكم Kilo Gateway، ومفاتيح API، وإدارة الحساب.
  </Card>
</CardGroup>
