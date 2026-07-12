---
read_when:
    - تريد مفتاح API واحدًا للعديد من نماذج اللغة الكبيرة
    - تريد تشغيل النماذج عبر Kilo Gateway في OpenClaw
summary: استخدم واجهة API الموحّدة في Kilo Gateway للوصول إلى العديد من النماذج في OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-12T06:22:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

يوجّه Kilo Gateway الطلبات إلى العديد من النماذج من خلال نقطة نهاية واحدة متوافقة مع OpenAI ومفتاح API واحد.

| الخاصية | القيمة                             |
| -------- | ---------------------------------- |
| المزوّد  | `kilocode`                         |
| المصادقة | `KILOCODE_API_KEY`                 |
| API      | متوافقة مع OpenAI                  |
| عنوان URL الأساسي | `https://api.kilo.ai/api/gateway/` |

## تثبيت Plugin

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## الإعداد

<Steps>
  <Step title="إنشاء حساب">
    انتقل إلى [app.kilo.ai](https://app.kilo.ai)، وسجّل الدخول أو أنشئ حسابًا، ثم أنشئ مفتاح API.
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

## النموذج الافتراضي والكتالوج

النموذج الافتراضي هو `kilocode/kilo/auto`، وهو نموذج توجيه ذكي يملكه المزوّد. لا تنشر OpenClaw
تعيينًا يربط المهام بالنماذج المصدرية له؛ إذ يمتلك Kilo Gateway التوجيه خلف `kilo/auto`.

عند بدء التشغيل، تستعلم OpenClaw من `GET https://api.kilo.ai/api/gateway/models` وتدمج النماذج المكتشفة
قبل كتالوج احتياطي ثابت. لا يحتوي الكتالوج الاحتياطي الثابت إلا على `kilocode/kilo/auto` ‏(`Kilo Auto`،
`input: ["text", "image"]`، و`reasoning: true`، و`contextWindow: 1000000`، و`maxTokens: 128000`).

يمكن الوصول إلى أي نموذج على Gateway بالصيغة `kilocode/<upstream-id>` (على سبيل المثال
`kilocode/anthropic/claude-sonnet-4` و`kilocode/openai/gpt-5.5`). شغّل `/models kilocode` أو
`openclaw models list --provider kilocode` للاطلاع على القائمة الكاملة المكتشفة.

## مثال على الإعداد

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

## ملاحظات السلوك

<AccordionGroup>
  <Accordion title="النقل والتوافق">
    يتوافق Kilo Gateway مع OpenRouter، لذا يستخدم مسار الطلب المتوافق مع OpenAI بأسلوب الوكيل
    بدلًا من تشكيل طلبات OpenAI الأصلي (من دون `store`، ومن دون حمولة جهد الاستدلال الخاصة بـ OpenAI).

    - تظل مراجع Kilo المدعومة من Gemini على مسار Gemini عبر الوكيل: تنظّف OpenClaw تواقيع أفكار Gemini
      هناك، لكنها لا تفعّل التحقق الأصلي من إعادة تشغيل Gemini أو عمليات إعادة كتابة التمهيد.
    - تستخدم الطلبات رمز Bearer مميزًا مبنيًا من مفتاح API الخاص بك.

  </Accordion>

  <Accordion title="غلاف التدفق والاستدلال">
    يضيف غلاف تدفق Kilo ترويسة طلب `X-KILOCODE-FEATURE` (القيمة الافتراضية `openclaw`،
    ويمكن تجاوزها باستخدام متغير البيئة `KILOCODE_FEATURE`) ويوحّد حمولات جهد الاستدلال
    للنماذج التي تدعمه.

    <Warning>
    تتجاوز مراجع `kilocode/kilo/auto` و`x-ai/*` حقن جهد الاستدلال. استخدم مرجع نموذج محددًا
    مثل `kilocode/anthropic/claude-sonnet-4` إذا كنت تحتاج إلى دعم الاستدلال.
    </Warning>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - إذا فشل اكتشاف النماذج عند بدء التشغيل، تعود OpenClaw إلى الكتالوج الاحتياطي الثابت الذي يحتوي على `kilocode/kilo/auto`.
    - تأكد من صلاحية مفتاح API ومن تمكين النماذج المطلوبة في حساب Kilo الخاص بك.
    - عند تشغيل Gateway كخدمة خفية، تأكد من إتاحة `KILOCODE_API_KEY` لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لإعداد OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    لوحة معلومات Kilo Gateway ومفاتيح API وإدارة الحساب.
  </Card>
</CardGroup>
