---
read_when:
    - تريد استخدام Fireworks مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح Fireworks API أو معرّف النموذج الافتراضي
    - أنت تصحّح سلوك تعطيل التفكير في Kimi على Fireworks
summary: إعداد Fireworks (المصادقة + اختيار النموذج)
title: الألعاب النارية
x-i18n:
    generated_at: "2026-07-12T06:27:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

تتيح [Fireworks](https://fireworks.ai) نماذج مفتوحة الأوزان ونماذج موجّهة عبر واجهة API متوافقة مع OpenAI. ثبّت Plugin المزوّد الرسمي لـ Fireworks لاستخدام نموذجي Kimi مُدرجين مسبقًا في الكتالوج، وأي معرّف نموذج أو موجّه من Fireworks في وقت التشغيل.

| الخاصية             | القيمة                                                 |
| ------------------- | ------------------------------------------------------ |
| معرّف المزوّد       | `fireworks` (الاسم البديل: `fireworks-ai`)             |
| الحزمة               | `@openclaw/fireworks-provider`                         |
| متغير بيئة المصادقة | `FIREWORKS_API_KEY`                                    |
| علم الإعداد الأولي  | `--auth-choice fireworks-api-key`                      |
| علم CLI المباشر     | `--fireworks-api-key <key>`                            |
| واجهة API           | متوافقة مع OpenAI (`openai-completions`)               |
| عنوان URL الأساسي   | `https://api.fireworks.ai/inference/v1`                |
| النموذج الافتراضي   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| الاسم البديل الافتراضي | `Kimi K2.5 Turbo`                                   |

## بدء الاستخدام

<Steps>
  <Step title="تثبيت Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="تعيين مفتاح Fireworks API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    يحفظ الإعداد الأولي المفتاح للمزوّد `fireworks` في ملفات تعريف المصادقة لديك، ويعيّن موجّه Kimi K2.5 Turbo المسمى **Fire Pass** بوصفه النموذج الافتراضي.

  </Step>
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider fireworks
    ```

    ينبغي أن تتضمن القائمة `Kimi K2.6` و`Kimi K2.5 Turbo (Fire Pass)`. إذا تعذّر حل `FIREWORKS_API_KEY`، فسيُبلغ `openclaw models status --json` عن بيانات الاعتماد المفقودة ضمن `auth.unusableProfiles`.

  </Step>
</Steps>

## الإعداد غير التفاعلي

لعمليات التثبيت البرمجية أو عبر CI، مرّر كل شيء في سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## الكتالوج المدمج

| مرجع النموذج                                          | الاسم                        | الإدخال      | السياق   | الحد الأقصى للإخراج | التفكير                    |
| ------------------------------------------------------ | --------------------------- | ------------ | -------- | ------------------- | -------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | نص + صورة    | 262,144  | 262,144             | معطّل إجباريًا             |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | نص + صورة    | 256,000  | 256,000             | معطّل إجباريًا (افتراضيًا) |

<Note>
  يثبّت OpenClaw إعداد جميع نماذج Kimi على Fireworks على `thinking: off` لأن Kimi على Fireworks قد يسرّب تسلسل الأفكار إلى الرد الظاهر ما لم يعطّل الطلب التفكير صراحةً. يؤدي توجيه النموذج نفسه مباشرةً عبر [Moonshot](/ar/providers/moonshot) إلى الحفاظ على مخرجات الاستدلال من Kimi. راجع [أوضاع التفكير](/ar/tools/thinking) للتبديل بين المزوّدين.
</Note>

## معرّفات نماذج Fireworks المخصصة

يقبل OpenClaw أي معرّف نموذج أو موجّه من Fireworks في وقت التشغيل. استخدم المعرّف الدقيق الذي تعرضه Fireworks وأضف إليه البادئة `fireworks/`. ينسخ الحل الديناميكي قالب Fire Pass (إدخال نص + صورة، وواجهة API متوافقة مع OpenAI، وتكلفة افتراضية قدرها صفر)، ويعطّل التفكير تلقائيًا عندما يطابق المعرّف نمط Kimi. تُعلَّم معرّفات GLM الديناميكية بأنها للنص فقط ما لم تضبط إدخال نموذج مخصص يدعم إدخال الصور.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="كيفية عمل إضافة بادئة إلى معرّف النموذج">
    يبدأ كل مرجع لنموذج Fireworks في OpenClaw بالبادئة `fireworks/` متبوعة بالمعرّف الدقيق أو مسار الموجّه من منصة Fireworks. على سبيل المثال:

    - نموذج موجّه: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - نموذج مباشر: `fireworks/accounts/fireworks/models/<model-name>`

    يزيل OpenClaw البادئة `fireworks/` عند إنشاء طلب API، ويرسل المسار المتبقي إلى نقطة نهاية Fireworks بوصفه حقل `model` المتوافق مع OpenAI.

  </Accordion>

  <Accordion title="سبب تعطيل التفكير إجباريًا لنماذج Kimi">
    تقدّم Fireworks نموذج Kimi من دون قناة استدلال منفصلة، لذلك قد يظهر تسلسل الأفكار في تدفق `content` المرئي. يرسل OpenClaw في كل طلب Kimi عبر Fireworks القيمة `thinking: { type: "disabled" }`، ويزيل `reasoning` و`reasoning_effort` و`reasoningEffort` من الحمولة (`extensions/fireworks/stream.ts`). لا تعلن سياسة المزوّد (`extensions/fireworks/thinking-policy.ts`) سوى مستوى التفكير `off` لمعرّفات نماذج Kimi، كي تظل مفاتيح التبديل اليدوية `/think` وواجهات سياسة المزوّد متوافقة مع عقد وقت التشغيل.

    لاستخدام استدلال Kimi من البداية إلى النهاية، اضبط [مزوّد Moonshot](/ar/providers/moonshot) ووجّه النموذج نفسه عبره.

  </Accordion>

  <Accordion title="توفر البيئة للعملية الخفية">
    إذا كان Gateway يعمل بوصفه خدمة مُدارة (launchd أو systemd أو Docker)، فيجب أن يكون مفتاح Fireworks مرئيًا لتلك العملية، وليس فقط لصدفة الأوامر التفاعلية لديك.

    <Warning>
      لن يفيد المفتاح الذي جرى تصديره في صدفة أوامر تفاعلية فقط عمليةً خفيةً تابعة لـ launchd أو systemd ما لم تُستورد تلك البيئة فيها أيضًا. عيّن المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لجعله قابلًا للقراءة من عملية Gateway.
    </Warning>

    يحمّل OpenClaw الملف `~/.openclaw/.env` عند تحميل الإعداد، ولذلك تصل المفاتيح المخزّنة فيه إلى خدمات Gateway المُدارة على كل منصة. أعد تشغيل Gateway (أو شغّل `openclaw doctor --fix` مجددًا) بعد تدوير المفتاح.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="أوضاع التفكير" href="/ar/tools/thinking" icon="brain">
    مستويات `/think` وسياسات المزوّدين وتوجيه النماذج القادرة على الاستدلال.
  </Card>
  <Card title="Moonshot" href="/ar/providers/moonshot" icon="moon">
    شغّل Kimi مع مخرجات التفكير الأصلية عبر واجهة API الخاصة بـ Moonshot.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها عمومًا والأسئلة الشائعة.
  </Card>
</CardGroup>
