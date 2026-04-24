---
read_when:
    - تريد استخدام نماذج Xiaomi MiMo في OpenClaw
    - تحتاج إلى إعداد `XIAOMI_API_KEY`
summary: استخدم نماذج Xiaomi MiMo مع OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-24T08:01:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae61547fa5864f0cd3e19465a8a7d6ff843f9534ab9c2dd39a86a3593cafaa8d
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo هي منصة API لنماذج **MiMo**. يستخدم OpenClaw نقطة النهاية المتوافقة مع OpenAI الخاصة بـ Xiaomi
مع المصادقة باستخدام مفتاح API.

| الخاصية | القيمة                          |
| -------- | ------------------------------- |
| الموفّر | `xiaomi`                        |
| المصادقة | `XIAOMI_API_KEY`                |
| API      | متوافق مع OpenAI               |
| Base URL | `https://api.xiaomimimo.com/v1` |

## البدء

<Steps>
  <Step title="احصل على مفتاح API">
    أنشئ مفتاح API في [وحدة تحكم Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    أو مرّر المفتاح مباشرة:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="تحقق من توفر النموذج">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## الفهرس المضمن

| مرجع النموذج           | الإدخال      | السياق     | الحد الأقصى للإخراج | الاستدلال | ملاحظات         |
| ---------------------- | ------------ | ---------- | ------------------- | --------- | --------------- |
| `xiaomi/mimo-v2-flash` | نص           | 262,144    | 8,192               | لا        | النموذج الافتراضي |
| `xiaomi/mimo-v2-pro`   | نص           | 1,048,576  | 32,000              | نعم       | سياق كبير        |
| `xiaomi/mimo-v2-omni`  | نص، صورة     | 262,144    | 32,000              | نعم       | متعدد الوسائط    |

<Tip>
مرجع النموذج الافتراضي هو `xiaomi/mimo-v2-flash`. ويُحقن الموفّر تلقائيًا عند ضبط `XIAOMI_API_KEY` أو عند وجود ملف تعريف مصادقة.
</Tip>

## مثال على التهيئة

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="سلوك الحقن التلقائي">
    يُحقن الموفّر `xiaomi` تلقائيًا عندما يكون `XIAOMI_API_KEY` مضبوطًا في البيئة لديك أو عندما يوجد ملف تعريف مصادقة. ولا تحتاج إلى تهيئة الموفّر يدويًا إلا إذا كنت تريد تجاوز البيانات الوصفية للنموذج أو Base URL.
  </Accordion>

  <Accordion title="تفاصيل النموذج">
    - **mimo-v2-flash** — خفيف وسريع، ومثالي لمهام النصوص العامة. لا يدعم الاستدلال.
    - **mimo-v2-pro** — يدعم الاستدلال مع نافذة سياق بحجم 1M رمز لأحمال العمل الخاصة بالمستندات الطويلة.
    - **mimo-v2-omni** — نموذج متعدد الوسائط مع تمكين الاستدلال ويقبل مدخلات النص والصورة معًا.

    <Note>
    تستخدم جميع النماذج البادئة `xiaomi/` (على سبيل المثال `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - إذا لم تظهر النماذج، فتأكد من أن `XIAOMI_API_KEY` مضبوط وصالح.
    - عندما يعمل Gateway كخدمة daemon، تأكد من أن المفتاح متاح لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Warning>
    لا تكون المفاتيح المضبوطة فقط في shell التفاعلي مرئية لعمليات gateway المُدارة بواسطة daemon. استخدم `~/.openclaw/.env` أو تهيئة `env.shellEnv` من أجل توفر دائم.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    المرجع الكامل لتهيئة OpenClaw.
  </Card>
  <Card title="وحدة تحكم Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    لوحة معلومات Xiaomi MiMo وإدارة مفاتيح API.
  </Card>
</CardGroup>
