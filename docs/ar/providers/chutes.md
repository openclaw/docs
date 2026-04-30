---
read_when:
    - تريد استخدام Chutes مع OpenClaw
    - تحتاج إلى مسار إعداد OAuth أو مفتاح API
    - تريد النموذج الافتراضي أو الأسماء المستعارة أو سلوك الاكتشاف
summary: إعداد Chutes (OAuth أو مفتاح API، اكتشاف النماذج، الأسماء المستعارة)
title: Chutes
x-i18n:
    generated_at: "2026-04-30T08:20:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) تتيح كتالوجات النماذج مفتوحة المصدر عبر واجهة API متوافقة مع OpenAI. يدعم OpenClaw كلاً من OAuth عبر المتصفح والمصادقة المباشرة بمفتاح API لموفر `chutes` المضمن.

| الخاصية | القيمة                       |
| -------- | ---------------------------- |
| الموفر | `chutes`                     |
| API      | متوافقة مع OpenAI            |
| عنوان URL الأساسي | `https://llm.chutes.ai/v1`   |
| المصادقة | OAuth أو مفتاح API (انظر أدناه) |

## البدء

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        يشغّل OpenClaw تدفق المتصفح محلياً، أو يعرض عنوان URL + تدفق لصق إعادة التوجيه
        على المضيفات البعيدة/دون واجهة رسومية. تُحدَّث رموز OAuth تلقائياً عبر ملفات تعريف مصادقة OpenClaw.
      </Step>
      <Step title="Verify the default model">
        بعد الإعداد، يُضبط النموذج الافتراضي على
        `chutes/zai-org/GLM-4.7-TEE` ويُسجَّل كتالوج Chutes المضمن.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get an API key">
        أنشئ مفتاحاً في
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Run the API key onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verify the default model">
        بعد الإعداد، يُضبط النموذج الافتراضي على
        `chutes/zai-org/GLM-4.7-TEE` ويُسجَّل كتالوج Chutes المضمن.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
يسجّل مسارا المصادقة كلاهما كتالوج Chutes المضمن ويضبطان النموذج الافتراضي على
`chutes/zai-org/GLM-4.7-TEE`. متغيرات بيئة وقت التشغيل: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## سلوك الاكتشاف

عندما تكون مصادقة Chutes متاحة، يستعلم OpenClaw عن كتالوج Chutes باستخدام بيانات الاعتماد تلك
ويستخدم النماذج المكتشفة. إذا فشل الاكتشاف، يعود OpenClaw
إلى كتالوج ثابت مضمن كي يستمر الإعداد وبدء التشغيل في العمل.

## الأسماء المستعارة الافتراضية

يسجّل OpenClaw ثلاثة أسماء مستعارة ملائمة لكتالوج Chutes المضمن:

| الاسم المستعار | النموذج الهدف                                         |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## كتالوج البدء المدمج

يتضمن كتالوج الرجوع المضمن مراجع Chutes الحالية:

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

## مثال التكوين

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
  <Accordion title="OAuth overrides">
    يمكنك تخصيص تدفق OAuth باستخدام متغيرات بيئة اختيارية:

    | المتغير | الغرض |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | معرّف عميل OAuth مخصص |
    | `CHUTES_CLIENT_SECRET` | سر عميل OAuth مخصص |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI إعادة توجيه مخصص |
    | `CHUTES_OAUTH_SCOPES` | نطاقات OAuth مخصصة |

    راجع [وثائق Chutes OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview)
    لمعرفة متطلبات تطبيق إعادة التوجيه والحصول على المساعدة.

  </Accordion>

  <Accordion title="Notes">
    - يستخدم كل من اكتشاف مفتاح API وOAuth معرّف موفر `chutes` نفسه.
    - تُسجَّل نماذج Chutes بصيغة `chutes/<model-id>`.
    - إذا فشل الاكتشاف عند بدء التشغيل، يُستخدم الكتالوج الثابت المضمن تلقائياً.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    قواعد الموفرين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التكوين الكامل بما في ذلك إعدادات الموفر.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    لوحة تحكم Chutes ووثائق API.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    أنشئ مفاتيح API الخاصة بـ Chutes وأدرها.
  </Card>
</CardGroup>
