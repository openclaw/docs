---
read_when:
    - أنت تريد استخدام Chutes مع OpenClaw
    - أنت تحتاج إلى مسار الإعداد عبر OAuth أو مفتاح API
    - أنت تريد معرفة النموذج الافتراضي، أو الأسماء المستعارة، أو سلوك الاكتشاف
summary: إعداد Chutes (OAuth أو مفتاح API، واكتشاف النماذج، والأسماء المستعارة)
title: Chutes
x-i18n:
    generated_at: "2026-04-24T07:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4e5189cfe32affbd23cce6c626adacd90f435c0cfe4866e2c96ac8bd0312f23
    source_path: providers/chutes.md
    workflow: 15
---

يوفّر [Chutes](https://chutes.ai) كتالوجات نماذج مفتوحة المصدر عبر
واجهة API متوافقة مع OpenAI. يدعم OpenClaw كلاً من OAuth عبر المتصفح
ومصادقة مفتاح API المباشرة لمزوّد `chutes` المضمّن.

| الخاصية | القيمة                       |
| -------- | ---------------------------- |
| المزوّد  | `chutes`                     |
| API      | متوافقة مع OpenAI            |
| Base URL | `https://llm.chutes.ai/v1`   |
| المصادقة | OAuth أو مفتاح API (راجع أدناه) |

## البدء

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="شغّل تدفق الإعداد الأولي لـ OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        يطلق OpenClaw تدفق المتصفح محليًا، أو يعرض عنوان URL + تدفق لصق redirect
        على المضيفين البعيدين/من دون واجهة. ويتم تحديث رموز OAuth تلقائيًا عبر
        ملفات تعريف المصادقة في OpenClaw.
      </Step>
      <Step title="تحقق من النموذج الافتراضي">
        بعد الإعداد الأولي، يتم ضبط النموذج الافتراضي على
        `chutes/zai-org/GLM-4.7-TEE` ويتم تسجيل كتالوج Chutes
        المضمّن.
      </Step>
    </Steps>
  </Tab>
  <Tab title="مفتاح API">
    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ مفتاحًا في
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="شغّل تدفق الإعداد الأولي لمفتاح API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="تحقق من النموذج الافتراضي">
        بعد الإعداد الأولي، يتم ضبط النموذج الافتراضي على
        `chutes/zai-org/GLM-4.7-TEE` ويتم تسجيل كتالوج Chutes
        المضمّن.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
يسجل مسارا المصادقة كلاهما كتالوج Chutes المضمّن ويضبطان النموذج الافتراضي على
`chutes/zai-org/GLM-4.7-TEE`. متغيرات بيئة وقت التشغيل: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## سلوك الاكتشاف

عندما تكون مصادقة Chutes متاحة، يستعلم OpenClaw عن كتالوج Chutes باستخدام
بيانات الاعتماد تلك ويستخدم النماذج المكتشفة. وإذا فشل الاكتشاف، يعود OpenClaw
إلى كتالوج ثابت مضمّن بحيث يستمر onboarding وبدء التشغيل في العمل.

## الأسماء المستعارة الافتراضية

يسجل OpenClaw ثلاثة أسماء مستعارة مريحة من أجل كتالوج Chutes المضمّن:

| الاسم المستعار  | النموذج الهدف                                         |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## كتالوج البدء المضمّن

يتضمن كتالوج fallback المضمّن مراجع Chutes الحالية:

| مرجع النموذج                                           |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## مثال إعداد

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
    يمكنك تخصيص تدفق OAuth باستخدام متغيرات بيئة اختيارية:

    | المتغير | الغرض |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | معرّف عميل OAuth مخصص |
    | `CHUTES_CLIENT_SECRET` | سر عميل OAuth مخصص |
    | `CHUTES_OAUTH_REDIRECT_URI` | عنوان URI مخصص لإعادة التوجيه |
    | `CHUTES_OAUTH_SCOPES` | نطاقات OAuth مخصصة |

    راجع [وثائق Chutes الخاصة بـ OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview)
    لمعرفة متطلبات redirect-app والمساعدة.

  </Accordion>

  <Accordion title="ملاحظات">
    - يستخدم كل من اكتشاف مفتاح API وOAuth معرّف المزوّد نفسه `chutes`.
    - يتم تسجيل نماذج Chutes على شكل `chutes/<model-id>`.
    - إذا فشل الاكتشاف عند بدء التشغيل، يُستخدم الكتالوج الثابت المضمّن تلقائيًا.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    قواعد المزوّد، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعداد الكامل بما في ذلك إعدادات المزوّد.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    لوحة تحكم Chutes ووثائق API.
  </Card>
  <Card title="مفاتيح API الخاصة بـ Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    إنشاء وإدارة مفاتيح API الخاصة بـ Chutes.
  </Card>
</CardGroup>
