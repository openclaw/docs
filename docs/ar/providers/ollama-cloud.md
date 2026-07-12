---
read_when:
    - تريد استخدام نماذج Ollama المستضافة دون خادم Ollama محلي
    - تحتاج إلى معرّف موفّر ollama-cloud أو مفتاحه أو نقطة نهايته
summary: استخدم Ollama Cloud مباشرةً مع OpenClaw
title: سحابة Ollama
x-i18n:
    generated_at: "2026-07-12T06:28:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud هي واجهة API مستضافة للنماذج من Ollama. يستدعيها المزوّد `ollama-cloud`
مباشرةً على `https://ollama.com` عبر واجهة API الأصلية `/api/chat` الخاصة بـ Ollama، من دون
خادم Ollama محلي ومن دون تطبيق Ollama محلي مسجّل الدخول في الوضع السحابي. استخدم مراجع
نماذج مثل `ollama-cloud/kimi-k2.6`.

يسجّل OpenClaw المعرّف `ollama-cloud` بوصفه معرّف مزوّد مستقلًا، كي لا تختلط
بيانات الاعتماد الخاصة بالسحابة فقط، والاكتشاف المباشر للكتالوج، واختيار النماذج
مع مضيف `ollama` محلي. لاستخدام Ollama محليًا، أو التوجيه الهجين بين السحابة والمحلي،
أو التضمينات، أو تفاصيل المضيف المخصّص، راجع [Ollama](/ar/providers/ollama).

## الإعداد

أنشئ مفتاح API لـ Ollama Cloud في [ollama.com/settings/keys](https://ollama.com/settings/keys)، ثم شغّل:

```bash
openclaw onboard --auth-choice ollama-cloud
```

أو عيّن:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

يقبل الإعداد الأولي غير التفاعلي المفتاح مباشرةً:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

يضبط الإعداد الأولي النموذج الافتراضي على `ollama-cloud/kimi-k2.5:cloud`.

## الإعدادات الافتراضية

- المزوّد: `ollama-cloud`
- عنوان URL الأساسي: `https://ollama.com`
- متغير البيئة: `OLLAMA_API_KEY`
- نمط API: واجهة Ollama الأصلية `/api/chat`
- نموذج الإعداد الأولي الافتراضي: `ollama-cloud/kimi-k2.5:cloud`

## متى تختار Ollama Cloud

- تريد نماذج Ollama مستضافة من دون تشغيل `ollama serve` محليًا.
- تريد بنية واجهة API الأصلية نفسها لمحادثة Ollama التي يستخدمها OpenClaw مع Ollama
  المحلي، ولكن موجّهة إلى `https://ollama.com`.
- تريد مسارًا سحابيًا بسيطًا للنماذج الموجودة بالفعل في كتالوج Ollama
  المستضاف.
- لا تحتاج إلى تنزيل النماذج محليًا، أو التحكم في وحدة معالجة الرسومات المحلية، أو الاستدلال المحصور في الشبكة المحلية.

استخدم [Ollama](/ar/providers/ollama) بدلًا من ذلك عندما تريد توجيهًا محليًا فقط أو
هجينًا بين السحابة والمحلي عبر مضيف Ollama مسجّل الدخول. استخدم مزوّدًا
متوافقًا مع OpenAI بدلًا من ذلك عندما تحتاج إلى دلالات `/v1/chat/completions`
أو ميزات خاصة بالمزوّد على نمط OpenAI.

## النماذج

يتطلب المزوّد مفتاح API؛ ومن دونه يظل غير نشط. عند توفر مفتاح،
يكتشف OpenClaw نماذج Ollama Cloud مباشرةً من الكتالوج المستضاف:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

تشمل المعرّفات المستضافة في الكتالوج المباشر `deepseek-v4-flash` و`glm-5`
و`gpt-oss:20b` و`kimi-k2.6` و`minimax-m2.7`. عندما لا يعيد الاكتشاف المباشر
أي نتائج، يعود OpenClaw إلى الصفوف المضمّنة `kimi-k2.5:cloud`
و`minimax-m2.7:cloud` و`glm-5.1:cloud` و`glm-5.2:cloud`.

معرّفات النماذج هي معرّفات الكتالوج السحابي، وليست أسماء التنزيل المحلي. إذا كان اسم نموذج يعمل في
مضيف Ollama محلي لكنه غير موجود في الكتالوج المستضاف، فاستخدم مزوّد `ollama`
مع ذلك المضيف المحلي بدلًا من ذلك.

## الاختبار المباشر

لاختبارات التحقق الأولية باستخدام مفتاح API لـ Ollama Cloud، وجّه اختبار Ollama المباشر إلى نقطة النهاية
المستضافة واختر نموذجًا من كتالوجك الحالي:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

يشغّل اختبار التحقق الأولي السحابي اختبارات النص، والتدفق الأصلي، والبحث على الويب؛ عيّن
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` لتخطي البحث على الويب. ويتخطى التضمينات
افتراضيًا مع `https://ollama.com` لأن مفاتيح API لـ Ollama Cloud قد لا
تخوّل الوصول إلى `/api/embed`؛ افرض تشغيلها باستخدام `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## استكشاف الأخطاء وإصلاحها

- أخطاء `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: وفّر
  مفتاح API سحابيًا حقيقيًا. العلامة المحلية `ollama-local` مخصّصة فقط لمضيفي Ollama
  المحليين أو الخاصين.
- أخطاء النموذج غير المعروف: شغّل `openclaw models list --provider ollama-cloud` ثم
  انسخ معرّف النموذج المستضاف كما هو تمامًا.
- مشكلات استدعاء الأدوات أو JSON الخام على مضيفي Ollama المخصّصين: تحقّق مما إذا كنت
  تستخدم عن طريق الخطأ عنوان URL متوافقًا مع OpenAI يتضمن `/v1`. يجب أن تستخدم مسارات Ollama
  عنوان URL الأساسي الأصلي من دون اللاحقة `/v1`.

## ذو صلة

- [Ollama](/ar/providers/ollama)
- [مزوّدو النماذج](/ar/concepts/model-providers)
- [جميع المزوّدين](/ar/providers/index)
