---
read_when:
    - تريد استخدام Arcee AI مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح API أو خيار مصادقة CLI
summary: إعداد Arcee AI (المصادقة + اختيار النموذج)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

توفّر [Arcee AI](https://arcee.ai) إمكانية الوصول إلى عائلة Trinity من نماذج خليط الخبراء عبر API متوافقة مع OpenAI. جميع نماذج Trinity مرخّصة بموجب Apache 2.0.

يمكن الوصول إلى نماذج Arcee AI مباشرة عبر منصة Arcee أو من خلال [OpenRouter](/ar/providers/openrouter).

| الخاصية | القيمة                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| المزوّد | `arcee`                                                                               |
| المصادقة | `ARCEEAI_API_KEY` (مباشر) أو `OPENROUTER_API_KEY` (عبر OpenRouter)                   |
| API      | متوافقة مع OpenAI                                                                     |
| عنوان URL الأساسي | `https://api.arcee.ai/api/v1` (مباشر) أو `https://openrouter.ai/api/v1` (OpenRouter) |

## بدء الاستخدام

<Tabs>
  <Tab title="مباشر (منصة Arcee)">
    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ مفتاح API في [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="عبر OpenRouter">
    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ مفتاح API في [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        تعمل مراجع النموذج نفسها لكل من إعدادات الاتصال المباشر وOpenRouter (على سبيل المثال `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## إعداد غير تفاعلي

<Tabs>
  <Tab title="مباشر (منصة Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="عبر OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## الكتالوج المضمّن

يشحن OpenClaw حاليًا كتالوج Arcee المضمّن هذا:

| مرجع النموذج                      | الاسم                   | الإدخال | السياق | التكلفة (إدخال/إخراج لكل 1M) | ملاحظات                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | نص  | 256K    | $0.25 / $0.90        | النموذج الافتراضي؛ التفكير مفعّل          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | نص  | 128K    | $0.25 / $1.00        | متعدد الأغراض؛ 400B معلمة، و13B نشطة  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | نص  | 128K    | $0.045 / $0.15       | سريع وفعّال من حيث التكلفة؛ استدعاء الدوال |

<Tip>
يضبط الإعداد الأولي المسبق `arcee/trinity-large-thinking` كنموذج افتراضي.
</Tip>

## الميزات المدعومة

| الميزة                                       | مدعومة                                    |
| --------------------------------------------- | -------------------------------------------- |
| البث                                     | نعم                                          |
| استخدام الأدوات / استدعاء الدوال                   | نعم (Trinity Mini، Trinity Large Preview)    |
| الإخراج المنظّم (وضع JSON ومخطط JSON) | نعم                                          |
| التفكير الممتد                             | نعم (Trinity Large Thinking؛ الأدوات معطّلة) |

<AccordionGroup>
  <Accordion title="ملاحظة البيئة">
    إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من أن `ARCEEAI_API_KEY`
    (أو `OPENROUTER_API_KEY`) متاح لتلك العملية (على سبيل المثال، في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).
  </Accordion>

  <Accordion title="توجيه OpenRouter">
    عند استخدام نماذج Arcee عبر OpenRouter، تنطبق مراجع النموذج نفسها `arcee/*`.
    يتولى OpenClaw التوجيه بشفافية بناءً على اختيار المصادقة لديك. راجع
    [مستندات مزوّد OpenRouter](/ar/providers/openrouter) للحصول على تفاصيل التكوين
    الخاصة بـ OpenRouter.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ar/providers/openrouter" icon="shuffle">
    يمكنك الوصول إلى نماذج Arcee والعديد غيرها عبر مفتاح API واحد.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
</CardGroup>
