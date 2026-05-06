---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر Kilo Gateway في OpenClaw
summary: استخدم واجهة برمجة التطبيقات الموحّدة في Kilo Gateway للوصول إلى العديد من النماذج في OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T18:02:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

توفر Kilo Gateway **واجهة API موحدة** توجه الطلبات إلى العديد من النماذج خلف
نقطة نهاية واحدة ومفتاح API واحد. وهي متوافقة مع OpenAI، لذا تعمل معظم حزم OpenAI SDK عبر تبديل عنوان URL الأساسي.

| الخاصية | القيمة                              |
| -------- | ---------------------------------- |
| المزوّد | `kilocode`                         |
| المصادقة     | `KILOCODE_API_KEY`                 |
| API      | متوافقة مع OpenAI                  |
| عنوان URL الأساسي | `https://api.kilo.ai/api/gateway/` |

## البدء

<Steps>
  <Step title="إنشاء حساب">
    انتقل إلى [app.kilo.ai](https://app.kilo.ai)، وسجّل الدخول أو أنشئ حسابًا، ثم انتقل إلى مفاتيح API وأنشئ مفتاحًا جديدًا.
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    أو عيّن متغير البيئة مباشرةً:

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

النموذج الافتراضي هو `kilocode/kilo/auto`، وهو نموذج توجيه ذكي
تملكه الجهة المزوّدة وتديره Kilo Gateway.

<Note>
يتعامل OpenClaw مع `kilocode/kilo/auto` باعتباره مرجعًا افتراضيًا مستقرًا، لكنه لا
ينشر تخطيطًا مدعومًا بالمصدر من المهمة إلى النموذج العلوي لذلك المسار. التوجيه العلوي الدقيق
خلف `kilocode/kilo/auto` تملكه Kilo Gateway، وليس مضمّنًا بشكل ثابت في OpenClaw.
</Note>

## الكتالوج المدمج

يكتشف OpenClaw النماذج المتاحة ديناميكيًا من Kilo Gateway عند بدء التشغيل. استخدم
`/models kilocode` للاطلاع على القائمة الكاملة للنماذج المتاحة مع حسابك.

يمكن استخدام أي نموذج متاح على Gateway مع البادئة `kilocode/`:

| مرجع النموذج                              | الملاحظات                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | افتراضي — توجيه ذكي            |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic عبر Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI عبر Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google عبر Kilo                    |
| ...وغير ذلك الكثير                       | استخدم `/models kilocode` لسردها كلها |

<Tip>
عند بدء التشغيل، يستعلم OpenClaw عن `GET https://api.kilo.ai/api/gateway/models` ويدمج
النماذج المكتشفة قبل كتالوج الرجوع الثابت. يتضمن الرجوع المدمج دائمًا
`kilocode/kilo/auto` (`Kilo Auto`) مع `input: ["text", "image"]`،
و`reasoning: true`، و`contextWindow: 1000000`، و`maxTokens: 128000`.
</Tip>

## مثال على الإعدادات

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
    Kilo Gateway موثقة في المصدر على أنها متوافقة مع OpenRouter، لذلك تبقى على
    مسار التوافق مع OpenAI بنمط الوكيل بدلًا من تشكيل طلبات OpenAI الأصلية.

    - تبقى مراجع Kilo المدعومة من Gemini على مسار proxy-Gemini، لذلك يحافظ OpenClaw على
      تنقية توقيع أفكار Gemini هناك دون تفعيل التحقق الأصلي من إعادة تشغيل Gemini
      أو إعادة كتابة التمهيد.
    - تستخدم Kilo Gateway رمز Bearer مع مفتاح API الخاص بك في الخلفية.

  </Accordion>

  <Accordion title="غلاف البث والاستدلال">
    يضيف غلاف البث المشترك في Kilo ترويسة تطبيق الجهة المزوّدة ويوحّد
    حمولات استدلال الوكيل لمراجع النماذج الملموسة المدعومة.

    <Warning>
    يتخطى `kilocode/kilo/auto` والتلميحات الأخرى غير المدعومة لاستدلال الوكيل
    حقن الاستدلال. إذا كنت تحتاج إلى دعم الاستدلال، فاستخدم مرجع نموذج ملموسًا مثل
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - إذا فشل اكتشاف النماذج عند بدء التشغيل، يعود OpenClaw إلى الكتالوج الثابت المدمج الذي يحتوي على `kilocode/kilo/auto`.
    - تأكد من أن مفتاح API الخاص بك صالح وأن حساب Kilo لديك مفعّل عليه النماذج المطلوبة.
    - عندما تعمل Gateway كخدمة خلفية، تأكد من أن `KILOCODE_API_KEY` متاح لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع إعدادات OpenClaw الكامل.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    لوحة تحكم Kilo Gateway، ومفاتيح API، وإدارة الحساب.
  </Card>
</CardGroup>
