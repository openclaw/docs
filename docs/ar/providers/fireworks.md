---
read_when:
    - تريد استخدام Fireworks مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح API الخاص بـ Fireworks أو معرّف النموذج الافتراضي
    - أنت تصحح أخطاء سلوك إيقاف التفكير في Kimi على Fireworks
summary: إعداد Fireworks (المصادقة + اختيار النموذج)
title: Fireworks
x-i18n:
    generated_at: "2026-05-06T08:10:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) تتيح نماذج مفتوحة الأوزان ونماذج موجّهة عبر API متوافق مع OpenAI. يتضمن OpenClaw Plugin مزود Fireworks مضمّنا يأتي مع نموذجي Kimi مفهرسين مسبقا ويقبل أي معرّف نموذج أو موجّه من Fireworks في وقت التشغيل.

| الخاصية         | القيمة                                                 |
| --------------- | ------------------------------------------------------ |
| معرّف المزود    | `fireworks` (الاسم البديل: `fireworks-ai`)             |
| Plugin          | مضمّن، `enabledByDefault: true`                        |
| متغير بيئة المصادقة | `FIREWORKS_API_KEY`                                    |
| علم الإعداد الأولي | `--auth-choice fireworks-api-key`                      |
| علم CLI مباشر   | `--fireworks-api-key <key>`                            |
| API             | متوافق مع OpenAI (`openai-completions`)                |
| عنوان URL الأساسي | `https://api.fireworks.ai/inference/v1`                |
| النموذج الافتراضي | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| الاسم البديل الافتراضي | `Kimi K2.5 Turbo`                                      |

## البدء

<Steps>
  <Step title="Set the Fireworks API key">
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

    يخزن الإعداد الأولي المفتاح مقابل مزود `fireworks` في ملفات تعريف المصادقة لديك ويعيّن موجّه Kimi K2.5 Turbo **Fire Pass** كنموذج افتراضي.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    يجب أن تتضمن القائمة `Kimi K2.6` و`Kimi K2.5 Turbo (Fire Pass)`. إذا لم يتم حل `FIREWORKS_API_KEY`، فسيبلغ `openclaw models status --json` عن بيانات الاعتماد المفقودة ضمن `auth.unusableProfiles`.

  </Step>
</Steps>

## الإعداد غير التفاعلي

لعمليات التثبيت النصية أو تثبيت CI، مرّر كل شيء في سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## الفهرس المضمّن

| مرجع النموذج                                          | الاسم                       | الإدخال       | السياق | أقصى إخراج | التفكير             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | نص + صورة | 262,144 | 262,144    | مفروض إيقافه           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | نص + صورة | 256,000 | 256,000    | مفروض إيقافه (افتراضي) |

<Note>
  يثبّت OpenClaw كل نماذج Fireworks Kimi على `thinking: off` لأن Fireworks ترفض معاملات تفكير Kimi في الإنتاج. يتيح توجيه النموذج نفسه مباشرة عبر [Moonshot](/ar/providers/moonshot) الحفاظ على مخرجات استدلال Kimi. راجع [أوضاع التفكير](/ar/tools/thinking) للتبديل بين المزودين.
</Note>

## معرّفات نماذج Fireworks المخصصة

يقبل OpenClaw أي معرّف نموذج أو موجّه من Fireworks في وقت التشغيل. استخدم المعرّف الدقيق الذي تعرضه Fireworks وأضف إليه البادئة `fireworks/`. ينسخ الحل الديناميكي قالب Fire Pass (إدخال نص + صورة، API متوافق مع OpenAI، تكلفة افتراضية صفر) ويعطّل التفكير تلقائيا عندما يطابق المعرّف نمط Kimi.

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
  <Accordion title="How model id prefixing works">
    يبدأ كل مرجع نموذج Fireworks في OpenClaw بـ `fireworks/` متبوعا بالمعرّف الدقيق أو مسار الموجّه من منصة Fireworks. على سبيل المثال:

    - نموذج موجّه: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - نموذج مباشر: `fireworks/accounts/fireworks/models/<model-name>`

    يزيل OpenClaw بادئة `fireworks/` عند إنشاء طلب API ويرسل المسار المتبقي إلى نقطة نهاية Fireworks بوصفه حقل `model` المتوافق مع OpenAI.

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    يعيد Fireworks K2.6 الرمز 400 إذا حمل الطلب معاملات `reasoning_*` على الرغم من أن Kimi يدعم التفكير عبر API الخاص بـ Moonshot. لا تعلن السياسة المضمّنة (`extensions/fireworks/thinking-policy.ts`) إلا مستوى التفكير `off` لمعرّفات نماذج Kimi، لذلك تظل تبديلات `/think` اليدوية وأسطح سياسة المزود متوافقة مع عقد وقت التشغيل.

    لاستخدام استدلال Kimi من البداية إلى النهاية، اضبط [مزود Moonshot](/ar/providers/moonshot) ووجّه النموذج نفسه عبره.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    إذا كان Gateway يعمل كخدمة مدارة (launchd، systemd، Docker)، فيجب أن يكون مفتاح Fireworks مرئيا لتلك العملية، وليس فقط لصدفتك التفاعلية.

    <Warning>
      لن يفيد المفتاح الموجود فقط في `~/.profile` عفريت launchd أو systemd ما لم يتم استيراد تلك البيئة هناك أيضا. اضبط المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لجعله قابلا للقراءة من عملية Gateway.
    </Warning>

    على macOS، يقوم `openclaw gateway install` بالفعل بتوصيل `~/.openclaw/.env` بملف بيئة LaunchAgent. أعد تشغيل التثبيت (أو `openclaw doctor --fix`) بعد تدوير المفتاح.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model providers" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Thinking modes" href="/ar/tools/thinking" icon="brain">
    مستويات `/think` وسياسات المزودين وتوجيه النماذج القادرة على الاستدلال.
  </Card>
  <Card title="Moonshot" href="/ar/providers/moonshot" icon="moon">
    شغّل Kimi مع مخرجات التفكير الأصلية عبر API الخاص بـ Moonshot.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها العام والأسئلة الشائعة.
  </Card>
</CardGroup>
