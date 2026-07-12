---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج NovitaAI
    - تحتاج إلى معرّف موفّر Novita أو مفتاحه أو نقطة النهاية الخاصة به
summary: استخدم واجهة API المتوافقة مع OpenAI من NovitaAI مع OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T06:23:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI هي موفّر مستضاف للبنية التحتية للذكاء الاصطناعي يقدّم واجهة API متوافقة مع OpenAI.
تأتي مضمّنةً كموفّر في OpenClaw (من دون تثبيت Plugin منفصل)، لذا
تمر بيانات الاعتماد عبر مسار مصادقة النماذج المعتاد، وتبدو مراجع النماذج مثل
`novita/deepseek/deepseek-v3-0324`.

## الإعداد

أنشئ مفتاح API في [novita.ai/settings/key-management](https://novita.ai/settings/key-management)، ثم شغّل:

```bash
openclaw onboard --auth-choice novita-api-key
```

أو عيّن:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## الإعدادات الافتراضية

| الإعداد               | القيمة                              |
| --------------------- | ---------------------------------- |
| معرّف الموفّر         | `novita`                           |
| الأسماء المستعارة     | `novita-ai`, `novitaai`            |
| عنوان URL الأساسي     | `https://api.novita.ai/openai/v1`  |
| متغير البيئة          | `NOVITA_API_KEY`                   |
| النموذج الافتراضي     | `novita/deepseek/deepseek-v3-0324` |

## دليل النماذج المضمّن

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

هذه نقطة بداية وليست دليلاً محدّثًا لحظيًا. قد يضيف حسابك أو منطقتك أو
العروض الحالية من Novita مساراتٍ أو يزيلها أو يقيّدها. تحقّق قبل
تعيين إعداد افتراضي طويل الأجل:

```bash
openclaw models list --provider novita
```

## متى تختار Novita

- الوصول المستضاف إلى النماذج مفتوحة الأوزان عبر واجهة API متوافقة مع OpenAI.
- مسارات عائلات DeepSeek أو Kimi أو MiniMax أو GLM أو Qwen من خلال حساب
  واحد لدى الموفّر.
- مسار احتياطي مستضاف آخر إلى جانب DeepInfra أو GMI أو OpenRouter أو واجهات API
  المباشرة للمورّدين.
- استضافة النماذج لدى الموفّر بدلاً من صيانة بنية تحتية لـ LM Studio أو Ollama
  أو SGLang أو vLLM.

اختر موفّرًا مباشرًا من المورّد عندما تحتاج إلى معلمات طلب أصلية خاصة
بالمورّد أو عقود دعم. واختر موفّرًا محليًا عندما يجب تشغيل النموذج
على أجهزتك أو ضمن حدود شبكتك.

## استكشاف الأخطاء وإصلاحها

- `401`/`403`: تحقّق من المفتاح في صفحة إدارة المفاتيح لدى Novita، وأعد تشغيل
  `openclaw onboard --auth-choice novita-api-key` إذا كان ملف التعريف المخزّن
  قديمًا.
- أخطاء النموذج غير المعروف: استخدم القيمة الدقيقة `novita/<route-id>` التي يعيدها
  `openclaw models list --provider novita`.
- المسارات البطيئة أو الفاشلة: جرّب مسار نموذج آخر في Novita، أو عيّن Novita
  كموفّر احتياطي لأحمال العمل التي يمكنها تحمّل التباين الخاص
  بالموفّر.

## ذو صلة

- [موفّرو النماذج](/ar/concepts/model-providers)
- [دليل الموفّرين](/ar/providers/index)
