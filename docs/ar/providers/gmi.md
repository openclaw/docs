---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج GMI Cloud
    - تحتاج إلى معرّف موفّر GMI أو مفتاحه أو نقطة نهايته
summary: استخدم واجهة برمجة التطبيقات المتوافقة مع OpenAI من GMI Cloud مع OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:24:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud هي منصة استدلال مستضافة للنماذج الرائدة والنماذج مفتوحة الأوزان
خلف API متوافق مع OpenAI. في OpenClaw، تُعد Plugin موفرًا خارجيًا رسميًا،
ما يعني أنك تثبّتها مرة واحدة، وتحددها بمعرّف الموفر `gmi`،
وتخزن بيانات الاعتماد عبر مصادقة النماذج العادية، وتستخدم مراجع نماذج مثل
`gmi/google/gemini-3.1-flash-lite`.

استخدم GMI عندما تريد مفتاح API واحدًا لعدة عائلات نماذج مستضافة، بما في ذلك
مسارات Google وAnthropic وOpenAI وDeepSeek وMoonshot وZ.AI التي يعرضها
كتالوج GMI. وهي مفيدة كموفر ثانوي لاحتياطي النماذج، أو لمقارنة
المسارات المستضافة عبر الموردين، أو عندما يتوفر لدى GMI نموذج قبل أن يتوفر
لدى موفرك الأساسي.

يستخدم هذا الموفر دلالات دردشة متوافقة مع OpenAI. يملك OpenClaw
معرّف الموفر وملف المصادقة الشخصي والأسماء المستعارة وبذرة كتالوج النماذج
وعنوان URL الأساسي؛ بينما تملك GMI توفر النماذج الحي والفوترة وحدود المعدل
وأي سياسة توجيه من جهة الموفر.

## الإعداد

ثبّت Plugin، وأعد تشغيل Gateway، ثم أنشئ مفتاح API في GMI Cloud:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

ثم شغّل:

```bash
openclaw onboard --auth-choice gmi-api-key
```

أو عيّن:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## الإعدادات الافتراضية

- الموفر: `gmi`
- الأسماء المستعارة: `gmi-cloud`، `gmicloud`
- عنوان URL الأساسي: `https://api.gmi-serving.com/v1`
- متغير البيئة: `GMI_API_KEY`
- النموذج الافتراضي: `gmi/google/gemini-3.1-flash-lite`

## متى تختار GMI

- تريد نقطة نهاية مستضافة متوافقة مع OpenAI بدلًا من خادم نماذج محلي.
- تريد تجربة عدة عائلات نماذج تجارية ومفتوحة الأوزان عبر حساب موفر واحد.
- تريد موفرًا احتياطيًا بتوجيه upstream مختلف عن OpenRouter أو
  DeepInfra أو Together أو واجهات API المباشرة للموردين.
- تحتاج إلى معرّفات نماذج أو تسعير أو عناصر تحكم حساب خاصة بـ GMI.

اختر موفر المورد المباشر بدلًا من ذلك عندما تحتاج إلى ميزات أصلية من المورد
لا تعرضها GMI عبر مسارها المتوافق مع OpenAI. اختر موفرًا محليًا
مثل Ollama أو LM Studio أو vLLM أو SGLang عندما تكون موضعية البيانات أو التحكم
بوحدة GPU المحلية أهم من سهولة الاستضافة.

## النماذج

يبذر كتالوج Plugin معرّفات مسارات GMI Cloud المتاحة عادةً، بما في ذلك:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

الكتالوج بذرة، وليس وعدًا بأن كل حساب يمكنه استدعاء كل نموذج في
كل الأوقات. استخدم أمر OpenClaw لعرض النماذج لمعرفة ما يبلّغ عنه
الموفر المُكوّن في بيئتك:

```bash
openclaw models list --provider gmi
```

## استكشاف الأخطاء وإصلاحها

- `401` أو `403`: تحقق من ضبط `GMI_API_KEY` للعملية التي تشغّل
  OpenClaw، أو أعد تشغيل الإعداد الأولي لتخزين المفتاح في ملف مصادقة الموفر الشخصي.
- أخطاء النموذج غير المعروف: تأكد من وجود النموذج في حساب GMI لديك واستخدم
  مرجع `gmi/<route-id>` الكامل الذي يعرضه `openclaw models list --provider gmi`.
- أخطاء الموفر المتقطعة: جرّب مسار GMI مختلفًا أو اضبط GMI كموفر
  احتياطي بدلًا من أن يكون موفر النماذج الأساسي الوحيد.

## ذات صلة

- [موفرو النماذج](/ar/concepts/model-providers)
- [كل الموفرين](/ar/providers/index)
