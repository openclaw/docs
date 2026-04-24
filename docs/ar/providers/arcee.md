---
read_when:
    - تريد استخدام Arcee AI مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح API أو خيار مصادقة CLI
summary: إعداد Arcee AI ‏(المصادقة + اختيار النموذج)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-24T07:57:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

يوفر [Arcee AI](https://arcee.ai) وصولًا إلى عائلة Trinity من نماذج mixture-of-experts عبر واجهة API متوافقة مع OpenAI. جميع نماذج Trinity مرخّصة بموجب Apache 2.0.

يمكن الوصول إلى نماذج Arcee AI مباشرة عبر منصة Arcee أو عبر [OpenRouter](/ar/providers/openrouter).

| الخاصية | القيمة                                                                                   |
| -------- | ---------------------------------------------------------------------------------------- |
| المزوّد  | `arcee`                                                                                  |
| المصادقة | `ARCEEAI_API_KEY` (مباشر) أو `OPENROUTER_API_KEY` (عبر OpenRouter)                     |
| API      | متوافقة مع OpenAI                                                                        |
| Base URL | `https://api.arcee.ai/api/v1` (مباشر) أو `https://openrouter.ai/api/v1` (عبر OpenRouter) |

## البدء

<Tabs>
  <Tab title="مباشر (منصة Arcee)">
    <Steps>
      <Step title="احصل على مفتاح API">
        أنشئ مفتاح API على [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
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
        أنشئ مفتاح API على [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        تعمل مراجع النماذج نفسها مع الإعدادين المباشر وعبر OpenRouter (مثل `arcee/trinity-large-thinking`).
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

## الفهرس المدمج

يشحن OpenClaw حاليًا فهرس Arcee المضمّن التالي:

| مرجع النموذج                   | الاسم                  | الإدخال | السياق | التكلفة (دخول/خروج لكل 1M) | ملاحظات                                      |
| ----------------------------- | ---------------------- | ------- | ------ | -------------------------- | -------------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text    | 256K   | $0.25 / $0.90              | النموذج الافتراضي؛ reasoning مفعّل           |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text    | 128K   | $0.25 / $1.00              | للأغراض العامة؛ 400B معلمات، و13B نشطة       |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text    | 128K   | $0.045 / $0.15             | سريع وموفّر للتكلفة؛ function calling        |

<Tip>
يضبط إعداد onboarding المسبق `arcee/trinity-large-thinking` كنموذج افتراضي.
</Tip>

## الميزات المدعومة

| الميزة                                          | مدعومة                         |
| ----------------------------------------------- | ------------------------------ |
| البث                                             | نعم                            |
| استخدام الأدوات / function calling              | نعم                            |
| المخرجات المهيكلة (وضع JSON ومخطط JSON)         | نعم                            |
| التفكير الممتد                                   | نعم (Trinity Large Thinking)   |

<AccordionGroup>
  <Accordion title="ملاحظة حول البيئة">
    إذا كان Gateway يعمل كـ daemon ‏(launchd/systemd)، فتأكد من أن `ARCEEAI_API_KEY`
    (أو `OPENROUTER_API_KEY`) متاح لتلك العملية (على سبيل المثال في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).
  </Accordion>

  <Accordion title="توجيه OpenRouter">
    عند استخدام نماذج Arcee عبر OpenRouter، تُطبَّق مراجع النماذج نفسها من نوع `arcee/*`.
    ويتولى OpenClaw التوجيه بشفافية وفق اختيار المصادقة لديك. راجع
    [وثائق مزوّد OpenRouter](/ar/providers/openrouter) للحصول على تفاصيل التكوين
    الخاصة بـ OpenRouter.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ar/providers/openrouter" icon="shuffle">
    الوصول إلى نماذج Arcee ونماذج كثيرة أخرى عبر مفتاح API واحد.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الاحتياط.
  </Card>
</CardGroup>
