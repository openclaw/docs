---
read_when:
    - تريد استخدام Tencent hy3 مع OpenClaw
    - تحتاج إلى إعداد مفتاح API لخدمة TokenHub أو TokenPlan
summary: إعداد Tencent Cloud TokenHub وTokenPlan لـ hy3
title: سحابة Tencent ‏(TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T06:25:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

ثبّت Plugin المزوّد الرسمي لـ Tencent Cloud للوصول إلى Tencent Hy3 عبر نقطتي نهاية — TokenHub (`tencent-tokenhub`) وTokenPlan (`tencent-tokenplan`) — باستخدام واجهة API متوافقة مع OpenAI.

| الخاصية                  | القيمة                                                 |
| ------------------------- | ----------------------------------------------------- |
| معرّفات المزوّد              | `tencent-tokenhub`، `tencent-tokenplan`               |
| الحزمة                   | `@openclaw/tencent-provider`                          |
| متغير بيئة المصادقة لـ TokenHub     | `TOKENHUB_API_KEY`                                    |
| متغير بيئة المصادقة لـ TokenPlan    | `TOKENPLAN_API_KEY`                                   |
| خيار الإعداد الأولي لـ TokenHub  | `--auth-choice tokenhub-api-key`                      |
| خيار الإعداد الأولي لـ TokenPlan | `--auth-choice tokenplan-api-key`                     |
| خيار CLI المباشر لـ TokenHub  | `--tokenhub-api-key <key>`                            |
| خيار CLI المباشر لـ TokenPlan | `--tokenplan-api-key <key>`                           |
| API                       | متوافقة مع OpenAI (`openai-completions`)              |
| عنوان URL الأساسي لـ TokenHub         | `https://tokenhub.tencentmaas.com/v1`                 |
| عنوان URL الأساسي العالمي لـ TokenHub  | `https://tokenhub-intl.tencentmaas.com/v1` (تجاوز) |
| عنوان URL الأساسي لـ TokenPlan        | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| النموذج الافتراضي             | `tencent-tokenhub/hy3`                                |

## البدء السريع

<Steps>
  <Step title="إنشاء مفتاح API لـ Tencent">
    أنشئ مفتاح API لخدمتي Tencent Cloud TokenHub وTokenPlan. إذا اخترت نطاق وصول محدودًا للمفتاح، فأدرج **hy3** (وكذلك **hy3 preview** إذا كنت تخطط لاستخدامه على TokenHub) ضمن النماذج المسموح بها.
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    <CodeGroup>

```bash الإعداد الأولي لـ TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash خيار TokenHub المباشر
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash الإعداد الأولي لـ TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash خيار TokenPlan المباشر
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash متغيرات البيئة فقط
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="التحقق من النموذج">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## الإعداد غير التفاعلي

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
يلزم استخدام `--accept-risk` مع `--non-interactive`.
</Note>

## الكتالوج المضمّن

| مرجع النموذج                      | الاسم                   | الإدخال | السياق | الحد الأقصى للإخراج | ملاحظات             |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | ----------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview ‏(TokenHub) | نص  | 256,000 | 64,000     | يدعم الاستدلال |
| `tencent-tokenhub/hy3`         | hy3 ‏(TokenHub)         | نص  | 256,000 | 64,000     | يدعم الاستدلال |
| `tencent-tokenplan/hy3`        | hy3 ‏(TokenPlan)        | نص  | 256,000 | 64,000     | يدعم الاستدلال |

يمثّل hy3 نموذج Tencent Hunyuan اللغوي الكبير القائم على بنية MoE، والمخصص للاستدلال واتباع التعليمات ذات السياق الطويل والبرمجة وسير عمل الوكلاء. تستخدم أمثلة Tencent المتوافقة مع OpenAI القيمة `hy3` كمعرّف للنموذج، وتدعم استدعاء الأدوات القياسي لإكمالات المحادثة، بالإضافة إلى `reasoning_effort`.

<Tip>
  معرّف النموذج هو `hy3`. لا تخلط بينه وبين نماذج Tencent المسماة `HY-3D-*`، فهي واجهات API لتوليد المحتوى ثلاثي الأبعاد وليست نموذج محادثة OpenClaw الذي يضبطه هذا المزوّد.
</Tip>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="تجاوز نقطة النهاية">
    يستخدم كتالوج OpenClaw المضمّن نقطة نهاية Tencent Cloud‏ `https://tokenhub.tencentmaas.com/v1`. لا تتجاوزها إلا إذا كان حساب TokenHub أو منطقتك يتطلبان نقطة نهاية مختلفة:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="إتاحة متغيرات البيئة للعملية الخفية">
    إذا كان Gateway يعمل كخدمة مُدارة (launchd أو systemd أو Docker)، فيجب أن يكون `TOKENHUB_API_KEY` و`TOKENPLAN_API_KEY` مرئيين لتلك العملية. اضبطهما في `~/.openclaw/.env` أو عبر `env.shellEnv` حتى تتمكن بيئات تنفيذ launchd أو systemd أو Docker من قراءتهما.

    <Warning>
      لا تكون المفاتيح التي تُصدَّر في صدفة تفاعلية فقط مرئية لعمليات Gateway المُدارة. استخدم ملف البيئة أو مسار الإعداد لضمان الإتاحة الدائمة.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعداد الكامل، بما في ذلك إعدادات المزوّد.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    صفحة منتج TokenHub من Tencent Cloud.
  </Card>
  <Card title="بطاقة نموذج Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    تفاصيل ومعايير أداء إصدار Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
