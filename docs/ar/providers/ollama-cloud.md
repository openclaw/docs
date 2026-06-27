---
read_when:
    - تريد استخدام نماذج Ollama المستضافة بدون خادم Ollama محلي
    - تحتاج إلى معرّف مزوّد ollama-cloud أو مفتاحه أو نقطة نهايته
summary: استخدم Ollama Cloud مباشرةً مع OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:26:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud هي واجهة API للنماذج المستضافة من Ollama. تتيح لـ OpenClaw استدعاء
النماذج المستضافة على Ollama مباشرة، دون تثبيت خادم Ollama محلي أو تسجيل دخول تطبيق
Ollama محلي في وضع السحابة. استخدم معرّف المزوّد `ollama-cloud` ومراجع النماذج مثل
`ollama-cloud/kimi-k2.6`.

هذه الصفحة مخصصة للتوجيه السحابي المباشر فقط. يستخدم المزوّد نمط Ollama الأصلي
`/api/chat`، وليس مسار `/v1` المتوافق مع OpenAI. يسجّله OpenClaw
كمعرّف مزوّد منفصل حتى لا تختلط بيانات اعتماد السحابة فقط، واكتشاف الفهرس الحي، و
اختيار النماذج مع مضيف `ollama` محلي.

استخدم هذه الصفحة عندما تريد توجيها سحابيا فقط. بالنسبة إلى Ollama المحلي، والتوجيه الهجين
بين السحابة والمحلي، والتضمينات، وتفاصيل المضيف المخصص، راجع
[Ollama](/ar/providers/ollama).

## الإعداد

أنشئ مفتاح API لـ Ollama Cloud في [ollama.com/settings/keys](https://ollama.com/settings/keys)، ثم شغّل:

```bash
openclaw onboard --auth-choice ollama-cloud
```

أو عيّن:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## الإعدادات الافتراضية

- المزوّد: `ollama-cloud`
- عنوان URL الأساسي: `https://ollama.com`
- متغير البيئة: `OLLAMA_API_KEY`
- نمط API: Ollama الأصلي `/api/chat`
- نموذج مثال: `ollama-cloud/kimi-k2.6`

## متى تختار Ollama Cloud

- تريد نماذج Ollama مستضافة دون تشغيل `ollama serve` محليا.
- تريد شكل واجهة API للدردشة الأصلي نفسه في Ollama الذي يستخدمه OpenClaw مع Ollama المحلي،
  لكن موجها إلى `https://ollama.com`.
- تريد مسارا سحابيا بسيطا للنماذج الموجودة بالفعل في الفهرس المستضاف لدى Ollama.
- لا تحتاج إلى سحب النماذج محليا، أو التحكم في GPU محلي، أو الاستدلال عبر LAN فقط.

استخدم [Ollama](/ar/providers/ollama) بدلا من ذلك عندما تريد توجيها محليا فقط أو
توجيها يجمع بين السحابة والمحلي عبر مضيف Ollama مسجّل الدخول. استخدم مزوّدا
متوافقا مع OpenAI بدلا من ذلك عندما تحتاج إلى دلالات `/v1/chat/completions`
أو ميزات خاصة بالمزوّد على نمط OpenAI.

## النماذج

يكتشف OpenClaw نماذج Ollama Cloud من الفهرس المستضاف الحي. تتضمن المعرّفات المستضافة
المتاحة عادة:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

استخدم معرّف نموذج من فهرسك المستضاف الحالي:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

معرّفات النماذج هي معرّفات فهرس سحابي، وليست أسماء سحب محلية. إذا كان اسم نموذج يعمل في
مضيف Ollama محلي لكنه غير موجود في الفهرس المستضاف، فاستخدم مزوّد `ollama`
مع ذلك المضيف المحلي بدلا من ذلك.

## اختبار حي

لاختبارات الدخان بمفتاح API لـ Ollama Cloud، وجّه اختبار Ollama الحي إلى نقطة النهاية
المستضافة واختر نموذجا من فهرسك الحالي:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

يشغّل اختبار الدخان السحابي النص، والبث الأصلي، وبحث الويب. ويتخطى التضمينات
افتراضيا لـ `https://ollama.com` لأن مفاتيح API لـ Ollama Cloud قد لا تخوّل
`/api/embed`.

## استكشاف الأخطاء وإصلاحها

- أخطاء `Set OLLAMA_API_KEY`: قدّم مفتاح API سحابيا حقيقيا. علامة
  `ollama-local` المحلية مخصصة فقط لمضيفي Ollama المحليين أو الخاصين.
- أخطاء النموذج غير المعروف: شغّل `openclaw models list --provider ollama-cloud` و
  انسخ معرّف النموذج المستضاف كما هو تماما.
- مشكلات استدعاء الأدوات أو JSON الخام على مضيفي Ollama المخصصين: تحقق مما إذا كنت
  تستخدم عن طريق الخطأ عنوان URL متوافقا مع OpenAI بنمط `/v1`. يجب أن تستخدم مسارات Ollama
  عنوان URL الأساسي الأصلي دون لاحقة `/v1`.

## ذو صلة

- [Ollama](/ar/providers/ollama)
- [مزوّدو النماذج](/ar/concepts/model-providers)
- [كل المزوّدين](/ar/providers/index)
