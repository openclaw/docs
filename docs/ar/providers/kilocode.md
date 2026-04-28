---
read_when:
    - تريد مفتاح API واحدًا لعدد كبير من LLMs
    - تريد تشغيل النماذج عبر Kilo Gateway في OpenClaw
summary: استخدم واجهة Kilo Gateway الموحدة للوصول إلى نماذج كثيرة في OpenClaw
title: Kilocode
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:59:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

يوفّر Kilo Gateway **واجهة API موحدة** توجّه الطلبات إلى نماذج كثيرة خلف نقطة
نهاية واحدة ومفتاح API واحد. وهو متوافق مع OpenAI، لذلك تعمل معظم OpenAI SDKs بمجرد تبديل base URL.

| الخاصية | القيمة                             |
| -------- | ---------------------------------- |
| المزوّد  | `kilocode`                         |
| المصادقة | `KILOCODE_API_KEY`                 |
| API      | متوافق مع OpenAI                   |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## البدء

<Steps>
  <Step title="أنشئ حسابًا">
    انتقل إلى [app.kilo.ai](https://app.kilo.ai)، وسجّل الدخول أو أنشئ حسابًا، ثم انتقل إلى API Keys وأنشئ مفتاحًا جديدًا.
  </Step>
  <Step title="شغّل onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    أو اضبط متغير البيئة مباشرةً:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="تحقّق من توفر النموذج">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## النموذج الافتراضي

النموذج الافتراضي هو `kilocode/kilo/auto`، وهو نموذج توجيه ذكي مملوك للمزوّد
وتديره Kilo Gateway.

<Note>
يتعامل OpenClaw مع `kilocode/kilo/auto` على أنه مرجع افتراضي ثابت، لكنه لا
ينشر ربطًا مدعومًا بالمصدر بين المهام والنماذج upstream لذلك المسار. إن
التوجيه الدقيق upstream خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway، وليس
مشفّرًا بشكل ثابت داخل OpenClaw.
</Note>

## الفهرس المدمج

يكتشف OpenClaw النماذج المتاحة ديناميكيًا من Kilo Gateway عند بدء التشغيل. استخدم
`/models kilocode` لرؤية القائمة الكاملة للنماذج المتاحة مع حسابك.

يمكن استخدام أي نموذج متاح على Gateway مع البادئة `kilocode/`:

| مرجع النموذج                             | ملاحظات                         |
| --------------------------------------- | ------------------------------- |
| `kilocode/kilo/auto`                    | الافتراضي — توجيه ذكي          |
| `kilocode/anthropic/claude-sonnet-4`    | Anthropic عبر Kilo              |
| `kilocode/openai/gpt-5.5`               | OpenAI عبر Kilo                 |
| `kilocode/google/gemini-3-pro-preview`  | Google عبر Kilo                 |
| ...and many more                        | استخدم `/models kilocode` لعرض الكل |

<Tip>
عند بدء التشغيل، يستعلم OpenClaw من `GET https://api.kilo.ai/api/gateway/models` ويقوم بدمج
النماذج المكتشفة قبل الفهرس الاحتياطي الثابت. ويتضمن الفهرس الاحتياطي المضمّن دائمًا
`kilocode/kilo/auto` ‏(`Kilo Auto`) مع `input: ["text", "image"]`،
و`reasoning: true`، و`contextWindow: 1000000`، و`maxTokens: 128000`.
</Tip>

## مثال على التكوين

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
    تم توثيق Kilo Gateway في المصدر على أنها متوافقة مع OpenRouter، لذا فهي تبقى على
    المسار بأسلوب الوكيل المتوافق مع OpenAI بدلًا من تشكيل طلبات OpenAI الأصلية.

    - تبقى مراجع Kilo المدعومة بـ Gemini على مسار proxy-Gemini، لذلك يحتفظ OpenClaw
      هناك بتنقية تواقيع أفكار Gemini من دون تفعيل تحقق replay الأصلي لـ Gemini
      أو إعادة كتابة bootstrap.
    - تستخدم Kilo Gateway رمز Bearer مع مفتاح API الخاص بك في الخلفية.

  </Accordion>

  <Accordion title="مغلف البث وreasoning">
    يضيف مغلف البث المشترك في Kilo ترويسة تطبيق المزوّد ويطبّع
    حمولات reasoning الخاصة بالوكيل لمراجع النماذج الصريحة المدعومة.

    <Warning>
    يتجاوز `kilocode/kilo/auto` والتلميحات الأخرى غير المدعومة لـ proxy-reasoning حقن reasoning.
    وإذا كنت تحتاج إلى دعم reasoning، فاستخدم مرجع نموذج صريحًا مثل
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - إذا فشل اكتشاف النموذج عند بدء التشغيل، يعود OpenClaw إلى الفهرس الثابت المضمّن الذي يحتوي على `kilocode/kilo/auto`.
    - تأكد من أن مفتاح API الخاص بك صالح وأن حساب Kilo لديك يحتوي على النماذج المطلوبة مفعلة.
    - عندما يعمل Gateway كـ daemon، تأكد من أن `KILOCODE_API_KEY` متاح لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الاحتياط.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع تكوين OpenClaw الكامل.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    لوحة Kilo Gateway، ومفاتيح API، وإدارة الحساب.
  </Card>
</CardGroup>
