---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج NovitaAI
    - تحتاج إلى معرّف موفّر Novita أو المفتاح أو نقطة النهاية
summary: استخدم واجهة API المتوافقة مع OpenAI من NovitaAI مع OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T18:25:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI هو مزوّد بنية تحتية مستضافة للذكاء الاصطناعي مع واجهة API للنماذج
متوافقة مع OpenAI. في OpenClaw، هو مزوّد نماذج مضمّن، لذلك يكون معرّف المزوّد هو
`novita`، وتمر بيانات الاعتماد عبر مسار مصادقة النماذج المعتاد، وتبدو مراجع النماذج
مثل `novita/deepseek/deepseek-v3-0324`.

استخدم Novita عندما تريد وصولًا مستضافًا إلى مسارات نماذج مفتوحة الأوزان ونماذج
جهات خارجية من دون تشغيل خادم استدلال خاص بك. يركّز الكتالوج المضمّن على نماذج
المحادثة العملية لدورات الوكيل، بما في ذلك مسارات DeepSeek وMoonshot وMiniMax
وGLM وQwen التي يوفّرها Novita.

يستخدم هذا المزوّد نقطة نهاية Novita المتوافقة مع OpenAI. يتولى OpenClaw
تسجيل المزوّد، والمصادقة، والأسماء المستعارة، وتطبيع مراجع النماذج، واختيار عنوان URL
الأساسي؛ بينما يتحكم Novita في توفّر النماذج المباشر، وأذونات الحساب، والتسعير،
وحدود المعدّل.

## الإعداد

أنشئ مفتاح API في [novita.ai/settings/key-management](https://novita.ai/settings/key-management)، ثم شغّل:

```bash
openclaw onboard --auth-choice novita-api-key
```

أو اضبط:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## الإعدادات الافتراضية

- المزوّد: `novita`
- الأسماء المستعارة: `novita-ai`, `novitaai`
- عنوان URL الأساسي: `https://api.novita.ai/openai/v1`
- متغير البيئة: `NOVITA_API_KEY`
- النموذج الافتراضي: `novita/deepseek/deepseek-v3-0324`

## متى تختار Novita

- تريد وصولًا مستضافًا إلى نماذج مفتوحة الأوزان عبر واجهة API متوافقة مع OpenAI.
- تريد مسارات DeepSeek أو Kimi أو MiniMax أو GLM أو عائلة Qwen عبر حساب مزوّد
  واحد.
- تريد مسارًا احتياطيًا مستضافًا آخر بجانب OpenRouter أو GMI أو DeepInfra أو
  واجهات API المباشرة للمورّدين.
- تفضّل استضافة النماذج من جهة المزوّد بدلًا من صيانة بنية vLLM أو SGLang أو LM
  Studio أو Ollama.

اختر مزوّدًا مباشرًا من المورّد عندما تحتاج إلى معلمات طلب أصلية للمورّد
أو عقود دعم. اختر مزوّدًا محليًا عندما يجب أن يعمل النموذج على عتادك
الخاص أو خلف حدود شبكتك الخاصة.

## النماذج

يزرع الكتالوج المضمّن معرّفات مسارات NovitaAI المتاحة عادةً، بما في ذلك:

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

الكتالوج نقطة بداية لاختيار النماذج في OpenClaw. قد يضيف حسابك أو منطقتك
أو كتالوج Novita الحالي مسارات أو يزيلها أو يقيّدها. تحقّق من المزوّد عبر CLI
قبل تعيين إعداد افتراضي طويل الأمد:

```bash
openclaw models list --provider novita
```

## استكشاف الأخطاء وإصلاحها

- `401` أو `403`: تحقّق من المفتاح في صفحة إدارة مفاتيح Novita وأعد تشغيل
  `openclaw onboard --auth-choice novita-api-key` إذا كان الملف الشخصي المخزّن
  قديمًا.
- أخطاء النموذج غير المعروف: استخدم صيغة `novita/<route-id>` الدقيقة التي يعيدها
  `openclaw models list --provider novita`.
- المسارات البطيئة أو الفاشلة: جرّب مسار نموذج Novita آخر أو عيّن Novita
  كمزوّد احتياطي لأحمال العمل التي يمكنها تحمّل التباين الخاص بالمزوّد.

## ذو صلة

- [مزوّدو النماذج](/ar/concepts/model-providers)
- [كل المزوّدين](/ar/providers/index)
