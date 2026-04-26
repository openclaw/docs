---
read_when:
    - تريد تغيير Models الافتراضية أو عرض حالة مصادقة provider
    - تريد فحص Models وproviders المتاحة وتصحيح أخطاء ملفات تعريف المصادقة
summary: مرجع CLI لـ `openclaw models` ‏(status/list/set/scan، والأسماء المستعارة، وعمليات fallback، والمصادقة)
title: Models
x-i18n:
    generated_at: "2026-04-26T11:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

اكتشاف Models وفحصها وتهيئتها (Model الافتراضي، وعمليات fallback، وملفات تعريف المصادقة).

ذو صلة:

- providers + Models: [Models](/ar/providers/models)
- مفاهيم اختيار Model وأمر الشرطة المائلة `/models`: [مفهوم Models](/ar/concepts/models)
- إعداد مصادقة provider: [البدء](/ar/start/getting-started)

## الأوامر الشائعة

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

يعرض `openclaw models status` القيم الافتراضية/عمليات fallback المحلولة بالإضافة إلى نظرة عامة على المصادقة.
وعندما تتوفر لقطات استخدام provider، يتضمن قسم حالة OAuth/API key
نوافذ استخدام provider ولقطات الحصة.
موفرو نوافذ الاستخدام الحاليون: Anthropic وGitHub Copilot وGemini CLI وOpenAI
Codex وMiniMax وXiaomi وz.ai. تأتي مصادقة الاستخدام من خطافات خاصة بكل provider
عند توفرها؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/API key
من ملفات تعريف المصادقة، أو env، أو الإعدادات.
في خرج `--json`، يكون `auth.providers` هو العرض العام للـ provider
الواعي بـ env/config/store، بينما يكون `auth.oauth` لصحة ملفات تعريف auth-store فقط.
أضف `--probe` لتشغيل probes حية للمصادقة على كل ملف تعريف provider مهيأ.
الـ probes هي طلبات حقيقية (وقد تستهلك tokens وتؤدي إلى تفعيل حدود المعدل).
استخدم `--agent <id>` لفحص حالة model/auth الخاصة بوكيل مهيأ. وعند عدم تحديده،
يستخدم الأمر `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` إذا كان مضبوطًا، وإلا
يستخدم الوكيل الافتراضي المهيأ.
يمكن أن تأتي صفوف probe من ملفات تعريف المصادقة، أو بيانات اعتماد env، أو `models.json`.

ملاحظات:

- يقبل `models set <model-or-alias>` الصيغة `provider/model` أو اسمًا مستعارًا.
- `models list` للقراءة فقط: فهو يقرأ الإعدادات، وملفات تعريف المصادقة، وحالة
  الفهرس الحالية، وصفوف الفهرس المملوكة للـ provider، لكنه لا يعيد كتابة
  `models.json`.
- يمكن أن يتضمن `models list --all --provider <id>` صفوف فهرس ثابتة مملوكة للـ provider
  من manifest الخاصة بالـ Plugin أو من بيانات فهرس provider المضمّنة حتى إذا
  لم تكن قد صادقت مع ذلك provider بعد. وتظهر هذه الصفوف مع ذلك على أنها
  غير متاحة حتى تتم تهيئة مصادقة مطابقة.
- يحتفظ `models list` ببيانات model الوصفية الأصلية والحدود القصوى لوقت التشغيل منفصلة. في خرج
  الجدول، يعرض `Ctx` القيمة `contextTokens/contextWindow` عندما يختلف الحد
  الأقصى الفعال لوقت التشغيل عن نافذة السياق الأصلية؛ وتتضمن صفوف JSON الحقل `contextTokens`
  عندما يعرّض provider هذا الحد الأقصى.
- يقوم `models list --provider <id>` بالتصفية حسب معرّف provider، مثل `moonshot` أو
  `openai-codex`. وهو لا يقبل تسميات العرض من أدوات اختيار providers التفاعلية،
  مثل `Moonshot AI`.
- يتم تحليل مراجع Models بالتقسيم عند **أول** `/`. إذا كان معرّف model يتضمن `/` (بنمط OpenRouter)، فأدرج بادئة provider (مثال: `openrouter/moonshotai/kimi-k2`).
- إذا حذفت provider، فإن OpenClaw يحل الإدخال أولًا باعتباره اسمًا مستعارًا، ثم
  باعتباره تطابق provider مهيأ وفريدًا لذلك المعرّف الدقيق لـ model، وبعد ذلك فقط
  يعود إلى provider الافتراضي المهيأ مع تحذير إهمال.
  وإذا لم يعد ذلك provider يعرّض model الافتراضي المهيأ، فإن OpenClaw
  يعود إلى أول provider/model مهيأ بدلًا من إظهار
  قيمة افتراضية قديمة تخص provider تمت إزالته.
- قد يعرض `models status` القيمة `marker(<value>)` في خرج المصادقة للعناصر النائبة غير السرية (مثل `OPENAI_API_KEY` و`secretref-managed` و`minimax-oauth` و`oauth:chutes` و`ollama-local`) بدلًا من إخفائها كأسرار.

### `models scan`

يقرأ `models scan` فهرس `:free` العام من OpenRouter ويرتّب المرشحين
لاستخدامهم في fallback. والفهرس نفسه عام، لذا لا تحتاج عمليات الفحص المعتمدة على البيانات الوصفية فقط
إلى مفتاح OpenRouter.

يحاول OpenClaw افتراضيًا فحص دعم الأدوات والصور باستدعاءات model حية.
إذا لم يتم تهيئة مفتاح OpenRouter، يعود الأمر إلى خرج يعتمد على البيانات الوصفية فقط
ويشرح أن Models `:free` لا تزال تتطلب `OPENROUTER_API_KEY` لإجراء
probes والاستدلال.

الخيارات:

- `--no-probe` (بيانات وصفية فقط؛ بدون بحث في config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (مهلة طلب الفهرس والمهلة لكل probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

يتطلب `--set-default` و`--set-image` probes حية؛ أما نتائج الفحص المعتمدة على البيانات الوصفية فقط
فهي معلوماتية ولا تُطبَّق على الإعدادات.

### `models status`

الخيارات:

- `--json`
- `--plain`
- `--check` (رمز الخروج 1=منتهي/مفقود، 2=قارب على الانتهاء)
- `--probe` (probe حي لملفات تعريف المصادقة المهيأة)
- `--probe-provider <name>` (فحص provider واحد)
- `--probe-profile <id>` (يمكن التكرار أو استخدام معرّفات ملفات تعريف مفصولة بفواصل)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (معرّف وكيل مهيأ؛ يتجاوز `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

حالات probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

حالات detail/reason-code المتوقعة في probe:

- `excluded_by_auth_order`: يوجد ملف تعريف مخزَّن، لكن
  `auth.order.<provider>` الصريح استبعده، لذلك يبلغ probe عن الاستبعاد بدلًا
  من محاولة استخدامه.
- `missing_credential` و`invalid_expires` و`expired` و`unresolved_ref`:
  ملف التعريف موجود لكنه غير مؤهل/غير قابل للحل.
- `no_model`: توجد مصادقة provider، لكن OpenClaw لم يتمكن من حل
  مرشح model قابل للفحص لذلك provider.

## الأسماء المستعارة + عمليات fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## ملفات تعريف المصادقة

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` هو مساعد المصادقة التفاعلي. يمكنه تشغيل تدفق مصادقة provider
‏(OAuth/API key) أو إرشادك إلى لصق token يدويًا، بحسب
provider الذي تختاره.

يشغّل `models auth login` تدفق مصادقة Plugin خاص بـ provider
‏(OAuth/API key). استخدم
`openclaw plugins list` لمعرفة providers المثبتين.
استخدم `openclaw models auth --agent <id> <subcommand>` لكتابة نتائج المصادقة إلى
مخزن وكيل مهيأ محدد. وتحترم علامة `--agent` الأصلية الأمرَ
`add` و`login` و`setup-token` و`paste-token` و`login-github-copilot`.

أمثلة:

```bash
openclaw models auth login --provider openai-codex --set-default
```

ملاحظات:

- يظل `setup-token` و`paste-token` أمرين عامين للتعامل مع tokens للـ providers
  الذين يعرّضون أساليب مصادقة عبر token.
- يتطلب `setup-token` بيئة TTY تفاعلية ويشغّل أسلوب مصادقة token الخاص بالـ provider
  (ويستخدم افتراضيًا أسلوب `setup-token` لذلك provider عندما يعرّضه).
- يقبل `paste-token` سلسلة token تم إنشاؤها في مكان آخر أو من الأتمتة.
- يتطلب `paste-token` وجود `--provider`، ويطلب قيمة token، ويكتبها
  إلى معرّف ملف التعريف الافتراضي `<provider>:manual` ما لم تمرر
  `--profile-id`.
- يقوم `paste-token --expires-in <duration>` بتخزين انتهاء صلاحية token مطلق
  من مدة نسبية مثل `365d` أو `12h`.
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مرة أخرى، لذا يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- لا يزال `setup-token` / `paste-token` الخاصان بـ Anthropic متاحين كمسار token مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [اختيار Model](/ar/concepts/model-providers)
- [Model failover](/ar/concepts/model-failover)
