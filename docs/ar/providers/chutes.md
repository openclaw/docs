---
read_when:
    - تريد استخدام Chutes مع OpenClaw
    - تحتاج إلى مسار إعداد OAuth أو مفتاح API
    - تريد النموذج الافتراضي أو الأسماء المستعارة أو سلوك الاكتشاف
summary: إعداد Chutes (OAuth أو مفتاح API، اكتشاف النماذج، الأسماء المستعارة)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T06:28:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) تتيح كتالوجات نماذج مفتوحة المصدر عبر واجهة API متوافقة مع OpenAI. يدعم OpenClaw كلاً من OAuth عبر المتصفح والمصادقة باستخدام مفتاح API.

| الخاصية          | القيمة                                                  |
| ---------------- | ------------------------------------------------------- |
| المزوّد          | `chutes`                                                |
| Plugin           | حزمة خارجية رسمية (`@openclaw/chutes-provider`)         |
| API              | متوافقة مع OpenAI                                       |
| عنوان URL الأساسي | `https://llm.chutes.ai/v1`                              |
| المصادقة         | OAuth أو مفتاح API (انظر أدناه)                         |
| متغيرات بيئة وقت التشغيل | `CHUTES_API_KEY`، `CHUTES_OAUTH_TOKEN`           |

يوفّر `CHUTES_OAUTH_TOKEN` رمز وصول OAuth تم الحصول عليه مسبقًا مباشرةً
(على سبيل المثال في CI)، متجاوزًا التدفق التفاعلي عبر المتصفح أدناه.

## تثبيت Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## البدء

يضبط كلا المسارين النموذج الافتراضي على `chutes/zai-org/GLM-4.7-TEE` ويسجّلان
كتالوج Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="تشغيل تدفق الإعداد الأولي لـ OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        يشغّل OpenClaw تدفق المتصفح محليًا، أو يعرض عنوان URL وتدفقًا للصق إعادة التوجيه
        على المضيفات البعيدة أو التي تعمل دون واجهة رسومية. تُحدَّث رموز OAuth تلقائيًا عبر
        ملفات تعريف المصادقة في OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="مفتاح API">
    <Steps>
      <Step title="الحصول على مفتاح API">
        أنشئ مفتاحًا في
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="تشغيل تدفق الإعداد الأولي لمفتاح API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## سلوك الاكتشاف

عند توفر مصادقة Chutes، يستعلم OpenClaw عن `GET /v1/models` باستخدام بيانات
الاعتماد تلك ويستخدم النماذج المكتشفة، مع تخزينها مؤقتًا لمدة 5 دقائق لكل بيانات
اعتماد. عند انتهاء صلاحية المفتاح أو عدم تخويله (HTTP 401)، يعيد OpenClaw المحاولة مرة واحدة
دون بيانات اعتماد. إذا ظل الاكتشاف لا يعيد أي صفوف، أو فشل، أو أعاد أي
حالة أخرى غير 2xx، فإنه يعود إلى الكتالوج الثابت المضمّن (يستخدم اكتشاف
مفتاح API وOAuth هذا المسار نفسه). إذا فشل الاكتشاف عند بدء التشغيل، يُستخدم
الكتالوج الثابت تلقائيًا.

## الأسماء المستعارة الافتراضية

يسجّل OpenClaw ثلاثة أسماء مستعارة ملائمة لكتالوج Chutes:

| الاسم المستعار  | النموذج المستهدف                                      |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## كتالوج البدء المضمّن

يحتوي كتالوج الرجوع المضمّن على 47 نموذجًا. فيما يلي عينة تمثيلية من المراجع الحالية:

| مرجع النموذج                                          |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

شغّل `openclaw models list --all --provider chutes` للحصول على القائمة الكاملة.

## مثال على الإعداد

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="تجاوزات OAuth">
    خصّص تدفق OAuth باستخدام متغيرات البيئة الاختيارية:

    | المتغير | الغرض |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | معرّف عميل OAuth (تظهر مطالبة به إذا لم يُضبط) |
    | `CHUTES_CLIENT_SECRET` | سر عميل OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | معرّف URI لإعادة التوجيه (الافتراضي `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | النطاقات مفصولة بمسافات (الافتراضي `openid profile chutes:invoke`) |

    راجع [وثائق Chutes لـ OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview)
    للاطلاع على متطلبات تطبيق إعادة التوجيه والحصول على المساعدة.

  </Accordion>

  <Accordion title="ملاحظات">
    - تُسجَّل نماذج Chutes بصيغة `chutes/<model-id>`.
    - لا تُبلغ Chutes عن استخدام الرموز أثناء البث (`supportsUsageInStreaming: false`)؛ ومع ذلك تظهر إجماليات الاستخدام بعد اكتمال البث.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    قواعد المزوّد ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعداد الكامل، بما في ذلك إعدادات المزوّد.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    لوحة معلومات Chutes ووثائق API.
  </Card>
  <Card title="مفاتيح API لـ Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    أنشئ مفاتيح API لـ Chutes وأدِرها.
  </Card>
</CardGroup>
