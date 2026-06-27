---
read_when:
    - تريد استخدام Fireworks مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح Fireworks API أو معرّف النموذج الافتراضي
    - أنت تصحّح سلوك Kimi عند إيقاف التفكير على Fireworks
summary: إعداد Fireworks (المصادقة + اختيار النموذج)
title: الألعاب النارية
x-i18n:
    generated_at: "2026-06-27T18:24:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) يتيح نماذج ذات أوزان مفتوحة ونماذج موجّهة عبر API متوافقة مع OpenAI. ثبّت Plugin موفّر Fireworks الرسمي لاستخدام نموذجي Kimi مفهرسين مسبقًا وأي نموذج Fireworks أو معرّف موجّه أثناء وقت التشغيل.

| الخاصية        | القيمة                                                  |
| --------------- | ------------------------------------------------------ |
| معرّف الموفّر     | `fireworks` (الاسم المستعار: `fireworks-ai`)                    |
| الحزمة         | `@openclaw/fireworks-provider`                         |
| متغير بيئة المصادقة    | `FIREWORKS_API_KEY`                                    |
| علم الإعداد الأولي | `--auth-choice fireworks-api-key`                      |
| علم CLI المباشر | `--fireworks-api-key <key>`                            |
| API             | متوافقة مع OpenAI (`openai-completions`)               |
| عنوان URL الأساسي        | `https://api.fireworks.ai/inference/v1`                |
| النموذج الافتراضي   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| الاسم المستعار الافتراضي   | `Kimi K2.5 Turbo`                                      |

## البدء

<Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="اضبط مفتاح Fireworks API">
    <CodeGroup>

```bash الإعداد الأولي
openclaw onboard --auth-choice fireworks-api-key
```

```bash العلم المباشر
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash البيئة فقط
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    يخزّن الإعداد الأولي المفتاح مقابل موفّر `fireworks` في ملفات تعريف المصادقة لديك، ويعيّن موجّه **Fire Pass** Kimi K2.5 Turbo كنموذج افتراضي.

  </Step>
  <Step title="تحقّق من أن النموذج متاح">
    ```bash
    openclaw models list --provider fireworks
    ```

    يجب أن تتضمن القائمة `Kimi K2.6` و`Kimi K2.5 Turbo (Fire Pass)`. إذا لم يتم حل `FIREWORKS_API_KEY`، فسيُبلغ `openclaw models status --json` عن بيانات الاعتماد المفقودة ضمن `auth.unusableProfiles`.

  </Step>
</Steps>

## إعداد غير تفاعلي

للتثبيتات النصية أو تثبيتات CI، مرّر كل شيء عبر سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## الفهرس المضمّن

| مرجع النموذج                                              | الاسم                        | الإدخال        | السياق | الحد الأقصى للإخراج | التفكير             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | نص + صورة | 262,144 | 262,144    | متوقف إجباريًا           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | نص + صورة | 256,000 | 256,000    | متوقف إجباريًا (افتراضي) |

<Note>
  يثبّت OpenClaw جميع نماذج Fireworks Kimi على `thinking: off` لأن Fireworks يرفض معاملات تفكير Kimi في الإنتاج. يتيح توجيه النموذج نفسه عبر [Moonshot](/ar/providers/moonshot) مباشرةً الحفاظ على مخرجات استدلال Kimi. راجع [أوضاع التفكير](/ar/tools/thinking) للتبديل بين الموفّرين.
</Note>

## معرّفات نماذج Fireworks المخصصة

يقبل OpenClaw أي نموذج Fireworks أو معرّف موجّه أثناء وقت التشغيل. استخدم المعرّف الدقيق الذي تعرضه Fireworks وأضف إليه البادئة `fireworks/`. ينسخ الحل الديناميكي قالب Fire Pass (إدخال نص + صورة، وAPI متوافقة مع OpenAI، وتكلفة افتراضية صفر)، ويعطّل التفكير تلقائيًا عندما يطابق المعرّف نمط Kimi. تُعلَّم معرّفات GLM الديناميكية كنص فقط ما لم تكوّن إدخال نموذج مخصصًا مع إدخال صور.

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
  <Accordion title="كيف تعمل بادئة معرّف النموذج">
    يبدأ كل مرجع نموذج Fireworks في OpenClaw بـ `fireworks/` متبوعًا بالمعرّف الدقيق أو مسار الموجّه من منصة Fireworks. على سبيل المثال:

    - نموذج موجّه: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - نموذج مباشر: `fireworks/accounts/fireworks/models/<model-name>`

    يزيل OpenClaw البادئة `fireworks/` عند إنشاء طلب API ويرسل المسار المتبقي إلى نقطة نهاية Fireworks كحقل `model` المتوافق مع OpenAI.

  </Accordion>

  <Accordion title="لماذا يُفرض إيقاف التفكير لـ Kimi">
    يعيد Fireworks K2.6 رمز 400 إذا حمل الطلب معاملات `reasoning_*` رغم أن Kimi يدعم التفكير عبر API الخاصة بـ Moonshot. تعلن سياسة الموفّر (`extensions/fireworks/thinking-policy.ts`) مستوى التفكير `off` فقط لمعرّفات نماذج Kimi، لذلك تبقى مفاتيح `/think` اليدوية وأسطح سياسة الموفّر متوافقة مع عقد وقت التشغيل.

    لاستخدام استدلال Kimi من البداية إلى النهاية، كوّن [موفّر Moonshot](/ar/providers/moonshot) ووجّه النموذج نفسه عبره.

  </Accordion>

  <Accordion title="توفر البيئة للبرنامج الخفي">
    إذا كان Gateway يعمل كخدمة مُدارة (launchd أو systemd أو Docker)، فيجب أن يكون مفتاح Fireworks مرئيًا لتلك العملية، وليس فقط للصدفة التفاعلية لديك.

    <Warning>
      لن يساعد مفتاح مُصدَّر في صدفة تفاعلية فقط برنامجًا خفيًا يعمل عبر launchd أو systemd ما لم تُستورد تلك البيئة هناك أيضًا. اضبط المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لجعله قابلاً للقراءة من عملية Gateway.
    </Warning>

    على macOS، يقوم `openclaw gateway install` بالفعل بتوصيل `~/.openclaw/.env` بملف بيئة LaunchAgent. أعد تشغيل التثبيت (أو `openclaw doctor --fix`) بعد تدوير المفتاح.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="موفّرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="أوضاع التفكير" href="/ar/tools/thinking" icon="brain">
    مستويات `/think`، وسياسات الموفّر، وتوجيه النماذج القادرة على الاستدلال.
  </Card>
  <Card title="Moonshot" href="/ar/providers/moonshot" icon="moon">
    شغّل Kimi مع مخرجات التفكير الأصلية عبر API الخاصة بـ Moonshot.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء وإصلاحها بشكل عام والأسئلة الشائعة.
  </Card>
</CardGroup>
