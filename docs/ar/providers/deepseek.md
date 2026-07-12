---
read_when:
    - تريد استخدام DeepSeek مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح API أو خيار المصادقة عبر CLI
summary: إعداد DeepSeek (المصادقة + اختيار النموذج)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T06:21:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) يوفّر نماذج ذكاء اصطناعي قوية عبر API متوافق مع OpenAI.

| الخاصية | القيمة                     |
| -------- | -------------------------- |
| المزوّد | `deepseek`                 |
| المصادقة | `DEEPSEEK_API_KEY`         |
| API      | متوافق مع OpenAI           |
| عنوان URL الأساسي | `https://api.deepseek.com` |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## البدء

<Steps>
  <Step title="الحصول على مفتاح API">
    أنشئ مفتاح API على [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    يطلب مفتاح API الخاص بك ويضبط `deepseek/deepseek-v4-flash` بوصفه النموذج الافتراضي.

  </Step>
  <Step title="التحقق من توفر النماذج">
    ```bash
    openclaw models list --provider deepseek
    ```

    لفحص الكتالوج الثابت الخاص بـ Plugin دون تشغيل Gateway:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="الإعداد غير التفاعلي">
    لعمليات التثبيت البرمجية أو دون واجهة، مرّر جميع العلامات مباشرةً:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
إذا كان Gateway يعمل كخدمة في الخلفية (launchd/systemd)، فتأكد من إتاحة `DEEPSEEK_API_KEY`
لهذه العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
`env.shellEnv`).
</Warning>

## الكتالوج المضمّن

| مرجع النموذج                  | الاسم              | الإدخال | السياق    | الحد الأقصى للإخراج | ملاحظات                                             |
| ---------------------------- | ----------------- | ------- | --------- | ------------------ | --------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | نص      | 1,000,000 | 384,000            | النموذج الافتراضي؛ واجهة V4 تدعم التفكير            |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | نص      | 1,000,000 | 384,000            | واجهة V4 تدعم التفكير                               |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | نص      | 1,000,000 | 384,000            | اسم توافق مهمل لـ V4 Flash دون تفكير                |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | نص      | 1,000,000 | 384,000            | اسم توافق مهمل لـ V4 Flash مع التفكير               |

<Warning>
ستوقف DeepSeek النموذجين `deepseek-chat` و`deepseek-reasoner` في 24 يوليو 2026
الساعة 15:59 بالتوقيت العالمي المنسق. وهما يوجّهان الطلبات حاليًا إلى DeepSeek V4 Flash في وضعي عدم التفكير
والتفكير، على التوالي. انقل مراجع النماذج المضبوطة إلى
`deepseek/deepseek-v4-flash` أو `deepseek/deepseek-v4-pro` قبل الموعد النهائي.
</Warning>

تتبع تقديرات التكلفة المحلية في OpenClaw أسعار إصابة ذاكرة التخزين المؤقت
وعدم إصابتها والإخراج التي تنشرها DeepSeek. قد تغيّر DeepSeek هذه الأسعار؛ وتُعد صفحة
[النماذج والأسعار](https://api-docs.deepseek.com/quick_start/pricing/) المرجع المعتمد
للفوترة.

<Tip>
تدعم نماذج V4 عنصر التحكم `thinking` في DeepSeek. ويعيد OpenClaw أيضًا إرسال
`reasoning_content` الخاص بـ DeepSeek في الأدوار اللاحقة حتى تتمكن جلسات التفكير التي تتضمن
استدعاءات الأدوات من الاستمرار.
استخدم `/think xhigh` أو `/think max` مع نماذج DeepSeek V4 لطلب أقصى قيمة
لـ `reasoning_effort` في DeepSeek؛ إذ يُعيَّن كلاهما إلى `"max"`.
</Tip>

## التفكير والأدوات

تتطلب جلسات التفكير في DeepSeek V4 أن تتضمن رسائل المساعد المعاد إرسالها من دور
مفعّل فيه التفكير الحقل `reasoning_content` في الطلبات اللاحقة.
يملأ Plugin الخاص بـ DeepSeek في OpenClaw هذا الحقل تلقائيًا، لذا يعمل
استخدام الأدوات المعتاد متعدد الأدوار على `deepseek/deepseek-v4-flash` و
`deepseek/deepseek-v4-pro` حتى عندما يأتي السجل من مزوّد آخر
متوافق مع OpenAI (لا يوفّر `reasoning_content` أصليًا) أو من رسالة
مساعد عادية. لا حاجة إلى `/new` بعد تبديل المزوّدين في منتصف الجلسة.

عند تعطيل التفكير (بما في ذلك تحديد **None** في واجهة المستخدم)، يرسل OpenClaw
`thinking: { type: "disabled" }` ويزيل `reasoning_content` المعاد إرساله
من السجل الصادر، مما يُبقي الجلسة على مسار DeepSeek غير المفعّل فيه التفكير.

استخدم `deepseek/deepseek-v4-flash` للمسار السريع الافتراضي. واستخدم
`deepseek/deepseek-v4-pro` للحصول على النموذج الأقوى عندما يمكنك قبول تكلفة
أو زمن استجابة أعلى.

## الاختبار المباشر

لتشغيل فحوصات النماذج المباشرة الخاصة بـ DeepSeek V4 فقط من حزمة الاختبارات المباشرة الحديثة للنماذج:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

يتحقق من اكتمال كلا نموذجي V4 ومن أن أدوار المتابعة الخاصة بالتفكير والأدوات
تحافظ على حمولة إعادة الإرسال التي تتطلبها DeepSeek.

## مثال على الإعداد

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعداد الكامل للوكلاء والنماذج والمزوّدين.
  </Card>
</CardGroup>
