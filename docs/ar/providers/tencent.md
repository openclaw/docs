---
read_when:
    - تريد استخدام معاينة Tencent Hy3 مع OpenClaw
    - تحتاج إلى إعداد مفتاح واجهة برمجة التطبيقات الخاص بـ TokenHub
summary: إعداد Tencent Cloud TokenHub لمعاينة Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T08:11:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud يأتي بوصفه Plugin موفّرًا مضمّنًا في OpenClaw. يوفّر الوصول إلى معاينة Tencent Hy3 عبر نقطة نهاية TokenHub (`tencent-tokenhub`) باستخدام API متوافقة مع OpenAI.

| الخاصية         | القيمة                                                 |
| ---------------- | ----------------------------------------------------- |
| معرّف الموفّر      | `tencent-tokenhub`                                    |
| Plugin           | مضمّن، `enabledByDefault: true`                     |
| متغيّر بيئة المصادقة     | `TOKENHUB_API_KEY`                                    |
| علم الإعداد الأولي  | `--auth-choice tokenhub-api-key`                      |
| علم CLI المباشر  | `--tokenhub-api-key <key>`                            |
| API              | متوافقة مع OpenAI (`openai-completions`)              |
| عنوان URL الأساسي الافتراضي | `https://tokenhub.tencentmaas.com/v1`                 |
| عنوان URL الأساسي العام  | `https://tokenhub-intl.tencentmaas.com/v1` (تجاوز) |
| النموذج الافتراضي    | `tencent-tokenhub/hy3-preview`                        |

## البدء السريع

<Steps>
  <Step title="أنشئ مفتاح API في TokenHub">
    أنشئ مفتاح API في Tencent Cloud TokenHub. إذا اخترت نطاق وصول محدودًا للمفتاح، فأدرج **معاينة Hy3** ضمن النماذج المسموح بها.
  </Step>
  <Step title="شغّل الإعداد الأولي">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="تحقّق من النموذج">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## إعداد غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## الكتالوج المضمّن

| مرجع النموذج                      | الاسم                   | الإدخال | السياق | الحد الأقصى للإخراج | ملاحظات                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | معاينة Hy3 (TokenHub) | نص  | 256,000 | 64,000     | افتراضي؛ مفعّل للاستدلال |

معاينة Hy3 هي نموذج اللغة الكبير MoE من Tencent Hunyuan للاستدلال، واتباع التعليمات ذات السياق الطويل، والبرمجة، وسير عمل الوكلاء. تستخدم أمثلة Tencent المتوافقة مع OpenAI القيمة `hy3-preview` كمعرّف النموذج وتدعم استدعاء الأدوات القياسي عبر إكمالات المحادثة بالإضافة إلى `reasoning_effort`.

<Tip>
  معرّف النموذج هو `hy3-preview`. لا تخلط بينه وبين نماذج Tencent ذات الصيغة `HY-3D-*`، فهي APIs لتوليد ثلاثي الأبعاد وليست نموذج محادثة OpenClaw الذي يكوّنه هذا الموفّر.
</Tip>

## تسعير متدرّج

يأتي الكتالوج المضمّن مع بيانات تكلفة وصفية متدرّجة تتوسّع بحسب طول نافذة الإدخال، لذلك تُملأ تقديرات التكلفة من دون تجاوزات يدوية.

| نطاق رموز الإدخال | معدل الإدخال | معدل الإخراج | قراءة ذاكرة التخزين المؤقت |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

المعدلات لكل مليون رمز بالدولار الأمريكي كما تعلنها Tencent. لا تتجاوز التسعير ضمن `models.providers.tencent-tokenhub` إلا عندما تحتاج إلى سطح مختلف.

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="تجاوز نقطة النهاية">
    يستخدم OpenClaw افتراضيًا نقطة نهاية Tencent Cloud: `https://tokenhub.tencentmaas.com/v1`. توثّق Tencent أيضًا نقطة نهاية دولية لـ TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    لا تتجاوز نقطة النهاية إلا عندما يتطلب حسابك أو منطقتك في TokenHub ذلك.

  </Accordion>

  <Accordion title="توفر البيئة للبرنامج الخفي">
    إذا كان Gateway يعمل كخدمة مُدارة (launchd أو systemd أو Docker)، فيجب أن يكون `TOKENHUB_API_KEY` مرئيًا لتلك العملية. عيّنه في `~/.openclaw/.env` أو عبر `env.shellEnv` حتى تتمكن بيئات launchd أو systemd أو Docker exec من قراءته.

    <Warning>
      المفاتيح التي تُعيَّن فقط في `~/.profile` لا تكون مرئية لعمليات Gateway المُدارة. استخدم ملف البيئة أو وصلة التكوين للتوفر المستمر.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="موفّرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration" icon="gear">
    مخطط التكوين الكامل، بما في ذلك إعدادات الموفّر.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    صفحة منتج TokenHub من Tencent Cloud.
  </Card>
  <Card title="بطاقة نموذج معاينة Hy3" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    تفاصيل ومعايير أداء معاينة Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
