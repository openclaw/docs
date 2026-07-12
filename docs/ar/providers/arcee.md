---
read_when:
    - تريد استخدام Arcee AI مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح API أو خيار المصادقة عبر CLI
summary: إعداد Arcee AI (المصادقة + اختيار النموذج)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T06:25:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) توفّر عائلة Trinity من نماذج مزيج الخبراء عبر واجهة API متوافقة مع OpenAI. جميع نماذج Trinity مرخّصة بموجب Apache 2.0. ‏Arcee هي Plugin رسمية لـ OpenClaw، وليست مضمّنة مع النواة، لذا تتطلب خطوة تثبيت قبل الإعداد الأولي.

يمكنك الوصول إلى نماذج Arcee مباشرةً عبر منصة Arcee أو من خلال [OpenRouter](/ar/providers/openrouter).

| الخاصية | القيمة                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| المزوّد | `arcee`                                                                               |
| المصادقة     | `ARCEEAI_API_KEY` (مباشر) أو `OPENROUTER_API_KEY` (عبر OpenRouter)                   |
| API      | متوافقة مع OpenAI                                                                     |
| عنوان URL الأساسي | `https://api.arcee.ai/api/v1` (مباشر) أو `https://openrouter.ai/api/v1` (OpenRouter) |

## تثبيت Plugin

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## البدء

<Tabs>
  <Tab title="مباشر (منصة Arcee)">
    <Steps>
      <Step title="الحصول على مفتاح API">
        أنشئ مفتاح API في [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="تعيين نموذج افتراضي">
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
      <Step title="الحصول على مفتاح API">
        أنشئ مفتاح API في [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="تعيين نموذج افتراضي">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        تعمل مراجع النماذج نفسها مع كلٍ من الإعداد المباشر وإعداد OpenRouter.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الإعداد غير التفاعلي

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

| مرجع النموذج                      | الاسم                   | الإدخال | السياق | الحد الأقصى للإخراج | التكلفة (الإدخال/الإخراج لكل مليون) | الأدوات | ملاحظات                                     |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | نص  | 256K    | 80K        | $0.25 / $0.90        | لا    | النموذج الافتراضي؛ تفكير موسّع          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | نص  | 128K    | 16K        | $0.25 / $1.00        | نعم   | للأغراض العامة؛ 400 مليار مُعامل، منها 13 مليار نشط  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | نص  | 128K    | 80K        | $0.045 / $0.15       | نعم   | سريع وفعّال من حيث التكلفة؛ استدعاء الدوال |

<Tip>
يضبط الإعداد المسبق للإعداد الأولي `arcee/trinity-large-thinking` بوصفه النموذج الافتراضي.
</Tip>

## الميزات المدعومة

| الميزة                                       | الدعم                                    |
| --------------------------------------------- | -------------------------------------------- |
| البث                                     | نعم                                          |
| استخدام الأدوات / استدعاء الدوال                   | نعم (Trinity Mini وTrinity Large Preview)    |
| الإخراج المنظّم (وضع JSON ومخطط JSON) | نعم                                          |
| التفكير الموسّع                             | نعم (Trinity Large Thinking؛ الأدوات معطّلة) |

<AccordionGroup>
  <Accordion title="ملاحظة حول البيئة">
    إذا كان Gateway يعمل كخدمة خلفية (launchd/systemd)، فتأكد من إتاحة `ARCEEAI_API_KEY`
    (أو `OPENROUTER_API_KEY`) لتلك العملية، على سبيل المثال في
    `~/.openclaw/.env` أو عبر `env.shellEnv`.
  </Accordion>

  <Accordion title="التوجيه عبر OpenRouter">
    عند استخدام نماذج Arcee عبر OpenRouter، تنطبق مراجع النماذج `arcee/*` نفسها.
    يوجّه OpenClaw الطلبات بشفافية استنادًا إلى خيار المصادقة لديك. راجع
    [وثائق مزوّد OpenRouter](/ar/providers/openrouter) للاطلاع على تفاصيل
    الإعداد الخاصة بـ OpenRouter.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ar/providers/openrouter" icon="shuffle">
    يمكنك الوصول إلى نماذج Arcee والعديد من النماذج الأخرى من خلال مفتاح API واحد.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
</CardGroup>
