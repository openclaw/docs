---
read_when:
    - تريد استخدام Chutes مع OpenClaw
    - تحتاج إلى مسار إعداد OAuth أو مفتاح API
    - تريد النموذج الافتراضي أو الأسماء المستعارة أو سلوك الاكتشاف
summary: إعداد Chutes (OAuth أو مفتاح API، اكتشاف النماذج، الأسماء المستعارة)
title: Chutes
x-i18n:
    generated_at: "2026-06-27T18:23:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

تعرض [Chutes](https://chutes.ai) كتالوجات نماذج مفتوحة المصدر عبر API متوافقة مع
OpenAI. يدعم OpenClaw كلاً من مصادقة OAuth عبر المتصفح ومصادقة مفتاح API
المباشرة لمزوّد `chutes`.

| الخاصية | القيمة                       |
| -------- | ---------------------------- |
| المزوّد | `chutes`                     |
| API      | متوافقة مع OpenAI            |
| عنوان URL الأساسي | `https://llm.chutes.ai/v1`   |
| المصادقة | OAuth أو مفتاح API (انظر أدناه) |

## تثبيت Plugin

ثبّت Plugin الرسمية، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## بدء الاستخدام

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        يشغّل OpenClaw تدفق المتصفح محلياً، أو يعرض تدفق URL + لصق إعادة التوجيه
        على المضيفات البعيدة/بلا واجهة. تُحدّث رموز OAuth تلقائياً عبر ملفات تعريف
        مصادقة OpenClaw.
      </Step>
      <Step title="Verify the default model">
        بعد الإعداد الأولي، يُضبط النموذج الافتراضي على
        `chutes/zai-org/GLM-4.7-TEE` ويُسجّل كتالوج Chutes الثابت.
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
        بعد الإعداد الأولي، يُضبط النموذج الافتراضي على
        `chutes/zai-org/GLM-4.7-TEE` ويُسجّل كتالوج Chutes الثابت.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
يسجّل مسارا المصادقة كلاهما كتالوج Chutes الثابت ويضبطان النموذج الافتراضي على
`chutes/zai-org/GLM-4.7-TEE`. متغيرات بيئة وقت التشغيل: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## سلوك الاكتشاف

عندما تكون مصادقة Chutes متاحة، يستعلم OpenClaw عن كتالوج Chutes باستخدام بيانات
الاعتماد تلك ويستخدم النماذج المكتشفة. إذا فشل الاكتشاف، يعود OpenClaw إلى
كتالوج ثابت لكي يظل الإعداد الأولي وبدء التشغيل يعملان.

## الأسماء المستعارة الافتراضية

يسجّل OpenClaw ثلاثة أسماء مستعارة ملائمة لكتالوج Chutes الثابت:

| الاسم المستعار | النموذج الهدف                                        |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## كتالوج البدء المضمّن

يتضمن كتالوج الرجوع الثابت مراجع Chutes الحالية:

| مرجع النموذج                                         |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## مثال إعدادات

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
    لمعرفة متطلبات تطبيق إعادة التوجيه والمساعدة.

  </Accordion>

  <Accordion title="Notes">
    - يستخدم كل من اكتشاف مفتاح API وOAuth معرّف المزوّد `chutes` نفسه.
    - تُسجّل نماذج Chutes بصيغة `chutes/<model-id>`.
    - إذا فشل الاكتشاف عند بدء التشغيل، يُستخدم الكتالوج الثابت تلقائياً.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    قواعد المزوّد، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعدادات الكامل بما في ذلك إعدادات المزوّد.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    لوحة تحكم Chutes ووثائق API.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    أنشئ مفاتيح Chutes API وأدرها.
  </Card>
</CardGroup>
