---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر Kilo Gateway في OpenClaw
summary: استخدم واجهة برمجة التطبيقات الموحّدة الخاصة بـ Kilo Gateway للوصول إلى العديد من النماذج في OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-10T19:58:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

يوفّر Kilo Gateway **واجهة API موحّدة** تُوجّه الطلبات إلى العديد من النماذج خلف
نقطة نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذلك تعمل معظم حِزم SDK الخاصة بـ OpenAI بمجرد تبديل عنوان URL الأساسي.

| الخاصية | القيمة                              |
| -------- | ---------------------------------- |
| المزوّد | `kilocode`                         |
| المصادقة     | `KILOCODE_API_KEY`                 |
| واجهة API      | متوافقة مع OpenAI                  |
| عنوان URL الأساسي | `https://api.kilo.ai/api/gateway/` |

## البدء

<Steps>
  <Step title="أنشئ حسابًا">
    انتقل إلى [app.kilo.ai](https://app.kilo.ai)، وسجّل الدخول أو أنشئ حسابًا، ثم انتقل إلى مفاتيح API وأنشئ مفتاحًا جديدًا.
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    أو عيّن متغير البيئة مباشرةً:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="تحقّق من أن النموذج متاح">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## النموذج الافتراضي

النموذج الافتراضي هو `kilocode/kilo/auto`، وهو نموذج توجيه ذكي مملوك للمزوّد
وتتم إدارته بواسطة Kilo Gateway.

<Note>
يتعامل OpenClaw مع `kilocode/kilo/auto` باعتباره المرجع الافتراضي المستقر، لكنه لا
ينشر تعيينًا، مدعومًا بالمصادر، من المهام إلى النماذج العلوية لذلك المسار. التوجيه
العلوي الدقيق خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway، وليس
مضمّنًا بصورة ثابتة في OpenClaw.
</Note>

## الفهرس المضمّن

يكتشف OpenClaw النماذج المتاحة ديناميكيًا من Kilo Gateway عند بدء التشغيل. استخدم
`/models kilocode` للاطلاع على القائمة الكاملة للنماذج المتاحة في حسابك.

يمكن استخدام أي نموذج متاح على Gateway مع البادئة `kilocode/`:

| مرجع النموذج                                | الملاحظات                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | الافتراضي — توجيه ذكي            |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic عبر Kilo                 |
| `kilocode/openai/gpt-5.5`                | OpenAI عبر Kilo                    |
| `kilocode/google/gemini-3.1-pro-preview` | Google عبر Kilo                    |
| ...وغيرها الكثير                         | استخدم `/models kilocode` لسردها جميعًا |

<Tip>
عند بدء التشغيل، يستعلم OpenClaw عن `GET https://api.kilo.ai/api/gateway/models` ويدمج
النماذج المكتشفة قبل فهرس الرجوع الثابت. يتضمن الرجوع المضمّن دائمًا
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
    Kilo Gateway موثّق في المصدر على أنه متوافق مع OpenRouter، لذلك يبقى على
    مسار الوكيل المتوافق مع OpenAI بدلًا من تشكيل طلبات OpenAI الأصلية.

    - تبقى مراجع Kilo المدعومة بـ Gemini على مسار وكيل Gemini، لذلك يحتفظ OpenClaw
      بتنقية توقيعات التفكير الخاصة بـ Gemini هناك من دون تمكين تحقق إعادة التشغيل الأصلي لـ Gemini
      أو إعادة كتابة التهيئة.
    - يستخدم Kilo Gateway رمز Bearer مع مفتاح API الخاص بك داخليًا.

  </Accordion>

  <Accordion title="مغلّف البث والاستدلال">
    يضيف مغلّف البث المشترك في Kilo ترويسة تطبيق المزوّد ويوحّد
    حمولات استدلال الوكيل لمراجع النماذج الفعلية المدعومة.

    <Warning>
    يتجاوز `kilocode/kilo/auto` وتلميحات الوكيل الأخرى غير المدعومة للاستدلال
    حقن الاستدلال. إذا كنت تحتاج إلى دعم الاستدلال، فاستخدم مرجع نموذج فعليًا مثل
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - إذا فشل اكتشاف النماذج عند بدء التشغيل، يرجع OpenClaw إلى الفهرس الثابت المضمّن الذي يحتوي على `kilocode/kilo/auto`.
    - تأكّد من أن مفتاح API الخاص بك صالح وأن حساب Kilo الخاص بك لديه النماذج المطلوبة مفعّلة.
    - عندما يعمل Gateway كخدمة خفية، تأكّد من أن `KILOCODE_API_KEY` متاح لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع إعدادات OpenClaw الكامل.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    لوحة تحكم Kilo Gateway ومفاتيح API وإدارة الحساب.
  </Card>
</CardGroup>
