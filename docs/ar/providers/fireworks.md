---
read_when:
    - تريد استخدام Fireworks مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح Fireworks API أو معرّف النموذج الافتراضي
summary: إعداد Fireworks ‏(المصادقة + اختيار النموذج)
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T07:58:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

يوفر [Fireworks](https://fireworks.ai) نماذج مفتوحة الأوزان ونماذج موجّهة عبر واجهة API متوافقة مع OpenAI. ويتضمن OpenClaw Plugin مضمّنة لمزوّد Fireworks.

| الخاصية         | القيمة                                                   |
| --------------- | -------------------------------------------------------- |
| المزوّد         | `fireworks`                                              |
| المصادقة        | `FIREWORKS_API_KEY`                                      |
| API             | chat/completions متوافقة مع OpenAI                       |
| Base URL        | `https://api.fireworks.ai/inference/v1`                  |
| النموذج الافتراضي | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`  |

## البدء

<Steps>
  <Step title="اضبط مصادقة Fireworks عبر onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    يخزّن ذلك مفتاح Fireworks الخاص بك في تكوين OpenClaw ويضبط نموذج Fire Pass الابتدائي كنموذج افتراضي.

  </Step>
  <Step title="تحقّق من توفر النموذج">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## مثال غير تفاعلي

بالنسبة إلى الإعدادات المكتوبة بسكربتات أو CI، مرر جميع القيم عبر سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## الفهرس المدمج

| مرجع النموذج                                            | الاسم                         | الإدخال      | السياق  | الحد الأقصى للإخراج | ملاحظات                                                                                                                                               |
| ------------------------------------------------------ | ----------------------------- | ------------ | ------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                     | text,image   | 262,144 | 262,144             | أحدث نموذج Kimi على Fireworks. يتم تعطيل thinking في طلبات Fireworks K2.6؛ وجّه عبر Moonshot مباشرة إذا كنت تحتاج إلى خرج Kimi thinking.           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo ‏(Fire Pass) | text,image   | 256,000 | 256,000             | النموذج الابتدائي الافتراضي المضمّن على Fireworks                                                                                                    |

<Tip>
إذا نشرت Fireworks نموذجًا أحدث مثل إصدار Qwen أو Gemma جديد، فيمكنك التبديل إليه مباشرةً باستخدام معرّف نموذج Fireworks الخاص به من دون انتظار تحديث الفهرس المضمّن.
</Tip>

## معرّفات نماذج Fireworks المخصصة

يقبل OpenClaw أيضًا معرّفات نماذج Fireworks الديناميكية. استخدم معرّف النموذج أو الموجّه الدقيق كما يظهر في Fireworks وأضف إليه البادئة `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="كيف تعمل بادئة معرّف النموذج">
    يبدأ كل مرجع نموذج Fireworks في OpenClaw بالبادئة `fireworks/` متبوعة بالمعرّف الدقيق أو مسار الموجّه من منصة Fireworks. على سبيل المثال:

    - نموذج موجّه: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - نموذج مباشر: `fireworks/accounts/fireworks/models/<model-name>`

    يزيل OpenClaw البادئة `fireworks/` عند بناء طلب API ويرسل المسار المتبقي إلى نقطة نهاية Fireworks.

  </Accordion>

  <Accordion title="ملاحظة حول البيئة">
    إذا كان Gateway يعمل خارج shell التفاعلية الخاصة بك، فتأكد من أن `FIREWORKS_API_KEY` متاح لتلك العملية أيضًا.

    <Warning>
    لن يفيد وجود مفتاح في `~/.profile` فقط daemon يعمل عبر launchd/systemd ما لم يتم استيراد تلك البيئة هناك أيضًا. اضبط المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن عملية gateway تستطيع قراءته.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الاحتياط.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها والأسئلة الشائعة العامة.
  </Card>
</CardGroup>
