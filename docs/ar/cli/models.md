---
read_when:
    - تريد تغيير النماذج الافتراضية أو عرض حالة مصادقة المزوّد
    - تريد فحص النماذج/المزوّدين المتاحين وتصحيح ملفات تعريف المصادقة debug
summary: مرجع CLI لـ `openclaw models` (status/list/set/scan، والأسماء المستعارة، والرجوع، والمصادقة)
title: النماذج
x-i18n:
    generated_at: "2026-04-24T07:35:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

اكتشاف النماذج وفحصها وإعدادها (النموذج الافتراضي، وعمليات الرجوع، وملفات تعريف المصادقة).

ذو صلة:

- المزوّدون + النماذج: [النماذج](/ar/providers/models)
- مفاهيم اختيار النموذج + أمر الشرطة المائلة `/models`: [مفهوم النماذج](/ar/concepts/models)
- إعداد مصادقة المزوّد: [البدء](/ar/start/getting-started)

## الأوامر الشائعة

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

يعرض `openclaw models status` القيم الافتراضية/عمليات الرجوع المحلَّلة بالإضافة إلى نظرة عامة على المصادقة.
وعندما تكون لقطات استخدام المزوّد متاحة، يتضمن قسم حالة OAuth/API-key
نوافذ استخدام المزوّد ولقطات الحصة.
مزوّدو نافذة الاستخدام الحالية: Anthropic وGitHub Copilot وGemini CLI وOpenAI
Codex وMiniMax وXiaomi وz.ai. تأتي مصادقة الاستخدام من خطافات خاصة بكل مزوّد
عند توفرها؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/API-key
من ملفات تعريف المصادقة أو البيئة أو الإعدادات.
في مخرجات `--json`، يكون `auth.providers` هو النظرة العامة على المزوّدين
الواعية بالبيئة/الإعدادات/المخزن، بينما يكون `auth.oauth` هو سلامة ملفات تعريف
مخزن المصادقة فقط.
أضف `--probe` لتشغيل مجسّات مصادقة مباشرة على كل ملف تعريف مزوّد مضبوط.
المجسّات هي طلبات حقيقية (وقد تستهلك رموزًا مميزة وتطلق حدود المعدل).
استخدم `--agent <id>` لفحص حالة النموذج/المصادقة لوكيل مضبوط. وعند عدم تمريره،
يستخدم الأمر `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` إذا كانا مضبوطين، وإلا
فيستخدم الوكيل الافتراضي المضبوط.
يمكن أن تأتي صفوف المجسّات من ملفات تعريف المصادقة أو بيانات اعتماد البيئة أو `models.json`.

ملاحظات:

- يقبل `models set <model-or-alias>` القيمة `provider/model` أو اسمًا مستعارًا.
- `models list` للقراءة فقط: فهو يقرأ الإعدادات وملفات تعريف المصادقة وحالة
  الكتالوج الحالية وصفوف الكتالوج المملوكة للمزوّد، لكنه لا يعيد كتابة
  `models.json`.
- يتضمن `models list --all` صفوف الكتالوج الثابتة المملوكة للمزوّد والمضمنة حتى
  عندما لا تكون قد صادقت مع ذلك المزوّد بعد. وما تزال هذه الصفوف تظهر
  على أنها غير متاحة حتى يتم ضبط مصادقة مطابقة.
- يقوم `models list --provider <id>` بالتصفية حسب معرّف المزوّد، مثل `moonshot` أو
  `openai-codex`. وهو لا يقبل تسميات العرض من أدوات اختيار المزوّد التفاعلية،
  مثل `Moonshot AI`.
- يتم تحليل مراجع النماذج بالتقسيم عند **أول** `/`. وإذا كان معرّف النموذج يتضمن `/` (على نمط OpenRouter)، فأدرج بادئة المزوّد (مثال: `openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، يحلّل OpenClaw الإدخال أولًا كاسم مستعار، ثم
  كمطابقة فريدة لمزوّد مضبوط لذلك المعرّف الدقيق للنموذج، وبعدها فقط
  يعود إلى المزوّد الافتراضي المضبوط مع تحذير تقادم.
  وإذا لم يعد ذلك المزوّد يكشف النموذج الافتراضي المضبوط، يعود OpenClaw
  إلى أول مزوّد/نموذج مضبوط بدلًا من إظهار قيمة افتراضية قديمة لمزوّد
  تمت إزالته.
- قد يعرض `models status` القيمة `marker(<value>)` في مخرجات المصادقة للعناصر النائبة غير السرية (على سبيل المثال `OPENAI_API_KEY` أو `secretref-managed` أو `minimax-oauth` أو `oauth:chutes` أو `ollama-local`) بدلًا من إخفائها كأسرار.

### `models status`

الخيارات:

- `--json`
- `--plain`
- `--check` (رمز الخروج 1=منتهي/مفقود، 2=على وشك الانتهاء)
- `--probe` (مجسّ مباشر لملفات تعريف المصادقة المضبوطة)
- `--probe-provider <name>` (فحص مزوّد واحد)
- `--probe-profile <id>` (متكرر أو معرّفات ملفات تعريف مفصولة بفواصل)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (معرّف وكيل مضبوط؛ يتجاوز `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

فئات حالة المجسّ:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

حالات التفاصيل/رموز الأسباب المتوقعة في المجسّ:

- `excluded_by_auth_order`: يوجد ملف تعريف مخزّن، لكن
  `auth.order.<provider>` الصريح حذفه، لذلك يبلغ المجسّ عن الاستبعاد بدلًا من
  تجربته.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  ملف التعريف موجود لكنه غير مؤهل/غير قابل للتحليل.
- `no_model`: توجد مصادقة للمزوّد، لكن OpenClaw لم يتمكن من تحليل
  مرشح نموذج قابل للفحص لذلك المزوّد.

## الأسماء المستعارة + عمليات الرجوع

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

إن `models auth add` هو مساعد المصادقة التفاعلي. ويمكنه تشغيل تدفق مصادقة مزوّد
(OAuth/API key) أو إرشادك إلى لصق رمز مميز يدويًا، وذلك بحسب
المزوّد الذي تختاره.

يشغّل `models auth login` تدفق مصادقة Plugin الخاص بمزوّد (OAuth/API key). استخدم
`openclaw plugins list` لمعرفة المزوّدين المثبتين.

أمثلة:

```bash
openclaw models auth login --provider openai-codex --set-default
```

ملاحظات:

- يظل `setup-token` و`paste-token` أوامر رموز مميزة عامة للمزوّدين
  الذين يكشفون طرق مصادقة تعتمد على الرموز المميزة.
- يتطلب `setup-token` واجهة TTY تفاعلية ويشغّل طريقة مصادقة الرمز المميز الخاصة بالمزوّد
  (مع استخدام طريقة `setup-token` الخاصة بذلك المزوّد افتراضيًا عندما يكشف
  عنها).
- يقبل `paste-token` سلسلة رمز مميز تم إنشاؤها في مكان آخر أو عبر الأتمتة.
- يتطلب `paste-token` الخيار `--provider`، ويطلب قيمة الرمز المميز، ويكتبها
  إلى معرّف ملف التعريف الافتراضي `<provider>:manual` ما لم تمرر
  `--profile-id`.
- يخزن `paste-token --expires-in <duration>` انتهاء صلاحية مطلقًا للرمز المميز من
  مدة نسبية مثل `365d` أو `12h`.
- ملاحظة Anthropic: أخبرنا فريق Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مسموحان لهذه التكاملات ما لم تنشر Anthropic سياسة جديدة.
- يظل `setup-token` / `paste-token` الخاصان بـ Anthropic متاحين كمسار رموز مميزة مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [اختيار النموذج](/ar/concepts/model-providers)
- [التحويل التلقائي للنموذج عند الفشل](/ar/concepts/model-failover)
