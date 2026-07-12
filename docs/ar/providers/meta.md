---
read_when:
    - تريد استخدام Meta مع OpenClaw
    - تحتاج إلى متغير البيئة MODEL_API_KEY أو خيار المصادقة عبر CLI
summary: إعداد Meta (المصادقة + اختيار نموذج muse-spark-1.1)
title: بيانات وصفية
x-i18n:
    generated_at: "2026-07-12T06:29:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

تستخدم **واجهة Meta API** واجهة **Responses API** المتوافقة مع OpenAI ‏(`POST /v1/responses`)
لنموذج الاستدلال `muse-spark-1.1`. يُشحن المزوّد في صورة Plugin مضمن في OpenClaw.

| الخاصية          | القيمة                              |
| ----------------- | ---------------------------------- |
| معرّف المزوّد       | `meta`                             |
| Plugin            | مزوّد مضمن                   |
| متغير بيئة المصادقة      | `MODEL_API_KEY`                    |
| علامة الإعداد الأولي   | `--auth-choice meta-api-key`       |
| علامة CLI المباشرة   | `--meta-api-key <key>`             |
| API               | Responses API (`openai-responses`) |
| عنوان URL الأساسي          | `https://api.meta.ai/v1`           |
| النموذج الافتراضي     | `meta/muse-spark-1.1`              |
| الاستدلال الافتراضي | `high` (`reasoning.effort`)        |

## بدء الاستخدام

<Steps>
  <Step title="تعيين مفتاح API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direct flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Env only
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="التحقق من توفر النماذج">
    ```bash
    openclaw models list --provider meta
    ```

    يسرد إدخال الكتالوج الثابت `muse-spark-1.1`. إذا تعذر تحديد قيمة `MODEL_API_KEY`،
    يُبلغ `openclaw models status --json` عن بيانات الاعتماد المفقودة ضمن
    `auth.unusableProfiles`.

  </Step>
</Steps>

## الإعداد غير التفاعلي

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## الكتالوج المدمج

| مرجع النموذج             | الاسم           | الاستدلال | نافذة السياق | الحد الأقصى للمخرجات |
| --------------------- | -------------- | --------- | -------------- | ---------- |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | نعم       | 1,048,576      | 131,072    |

الإمكانات:

- إدخال النصوص والصور
- استدعاء الأدوات والبث
- جهد الاستدلال: `minimal`، و`low`، و`medium`، و`high`، و`xhigh` (الافتراضي: `high`)
- إعادة تشغيل الاستدلال المشفر من دون حالة (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
لا يقبل `muse-spark-1.1` القيمة `reasoning.effort: "none"`. يربط OpenClaw
الخيار `--thinking off` بالقيمة `minimal` لهذا المزوّد.
</Warning>

## الضبط اليدوي

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
إذا كان Gateway يعمل كبرنامج خفي (launchd أو systemd أو Docker)، فتأكد من
إتاحة `MODEL_API_KEY` لهذه العملية — على سبيل المثال في
`~/.openclaw/.env` أو عبر `env.shellEnv`. لن يفيد المفتاح الذي جرى تصديره في
صدفة تفاعلية فقط خدمةً مُدارة ما لم تُستورد البيئة
بشكل منفصل.
</Note>

## اختبار التحقق السريع

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

تستخدم الاختبارات المباشرة `muse-spark-1.1` مع `POST /v1/responses`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="أوضاع التفكير" href="/ar/tools/thinking" icon="brain">
    مستويات جهد الاستدلال للنموذج muse-spark-1.1.
  </Card>
  <Card title="مرجع الضبط" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكيل وضبط النماذج.
  </Card>
</CardGroup>
