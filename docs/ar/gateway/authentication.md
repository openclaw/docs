---
read_when:
    - تصحيح أخطاء مصادقة النموذج أو انتهاء صلاحية OAuth
    - توثيق المصادقة أو تخزين بيانات الاعتماد
summary: 'مصادقة النموذج: OAuth ومفاتيح API وإعادة استخدام Claude CLI ورمز إعداد Anthropic'
title: المصادقة
x-i18n:
    generated_at: "2026-07-12T05:53:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
تغطي هذه الصفحة مصادقة **موفّر النموذج** (مفاتيح API، وOAuth، وإعادة استخدام Claude CLI، ورمز إعداد Anthropic). للاطلاع على مصادقة **اتصال Gateway** (الرمز المميز، وكلمة المرور، والوكيل الموثوق)، راجع [الإعدادات](/ar/gateway/configuration) و[مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth).
</Note>

يدعم OpenClaw كلاً من OAuth ومفاتيح API لموفّري النماذج. بالنسبة إلى مضيف Gateway دائم التشغيل، يُعد مفتاح API الخيار الأكثر قابلية للتوقع؛ كما تعمل تدفقات الاشتراك/OAuth عندما تتوافق مع نموذج حسابك لدى الموفّر.

- تدفق OAuth الكامل وتخطيط التخزين: [/concepts/oauth](/ar/concepts/oauth)
- المصادقة المستندة إلى SecretRef (موفّرو `env`/`file`/`exec`): [إدارة الأسرار](/ar/gateway/secrets)
- أهلية بيانات الاعتماد ورموز الأسباب التي يستخدمها `models status --probe`: [دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics)

## الإعداد الموصى به: مفتاح API (لأي موفّر)

1. أنشئ مفتاح API في وحدة تحكم الموفّر.
2. ضعه على **مضيف Gateway** (الجهاز الذي يشغّل `openclaw gateway`):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. إذا كان Gateway يعمل تحت systemd/launchd، فضع المفتاح في `~/.openclaw/.env` كي تتمكن الخدمة الخفية من قراءته:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. أعد تشغيل عملية Gateway (أو الخدمة الخفية)، ثم تحقّق مجددًا:

```bash
openclaw models status
openclaw doctor
```

يمكن لـ`openclaw onboard` أيضًا تخزين مفاتيح API لاستخدام الخدمة الخفية إذا لم ترغب في إدارة متغيرات البيئة بنفسك. راجع [متغيرات البيئة](/ar/help/environment) للاطلاع على أسبقية تحميل البيئة كاملةً (`env.shellEnv`، و`~/.openclaw/.env`، وsystemd/launchd).

## Anthropic: إعادة استخدام Claude CLI

تظل المصادقة عبر رمز إعداد Anthropic مسارًا مدعومًا. كما أن إعادة استخدام Claude CLI (الاستخدام بأسلوب `claude -p`) معتمدة لهذا التكامل؛ وعند توفر تسجيل دخول إلى Claude CLI على المضيف، يكون ذلك هو المسار المفضّل للاستخدام المحلي/المكتبي. أما بالنسبة إلى مضيفات Gateway طويلة الأمد، فيظل مفتاح Anthropic API الخيار الأكثر قابلية للتوقع، مع تحكم صريح في الفوترة من جانب الخادم.

إعداد المضيف لإعادة استخدام Claude CLI:

```bash
# شغّل على مضيف Gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

تتكون هذه العملية من خطوتين: تسجيل دخول Claude Code إلى Anthropic على المضيف، ثم توجيه OpenClaw لاختيار نماذج Anthropic عبر الواجهة الخلفية المحلية `claude-cli` وتخزين ملف تعريف مصادقة OpenClaw المطابق.

إذا لم يكن `claude` موجودًا في `PATH`، فثبّت Claude Code أو اضبط `agents.defaults.cliBackends.claude-cli.command` على مسار الملف التنفيذي.

## إدخال الرمز المميز يدويًا

يعمل مع أي موفّر؛ ويكتب إلى مخزن مصادقة SQLite الخاص بكل وكيل ويحدّث الإعدادات:

```bash
openclaw models auth paste-token --provider openrouter
```

يقرأ OpenClaw ملفات تعريف المصادقة من ملف `openclaw-agent.sqlite` الخاص بكل وكيل. تنتمي تفاصيل نقطة النهاية (`baseUrl`، و`api`، ومعرّفات النماذج، والرؤوس، والمُهل الزمنية) إلى `models.providers.<id>` في `openclaw.json` أو `models.json`، وليس إلى ملفات تعريف المصادقة.

إذا كان تثبيت أقدم لا يزال يحتوي على `auth-profiles.json` أو `auth-state.json` أو بنية مسطحة مثل `{ "openrouter": { "apiKey": "..." } }`، فشغّل `openclaw doctor --fix` لاستيرادها إلى SQLite؛ يحتفظ doctor بنسخ احتياطية ذات طوابع زمنية بجانب ملفات JSON الأصلية.

مسارات المصادقة الخارجية مثل `auth: "aws-sdk"` في Bedrock ليست بيانات اعتماد. بالنسبة إلى مسار Bedrock مسمّى، اضبط `auth.profiles.<id>.mode: "aws-sdk"` في `openclaw.json` — ولا تكتب `type: "aws-sdk"` في مخزن ملفات تعريف المصادقة. ينقل `openclaw doctor --fix` علامات AWS SDK القديمة من مخزن بيانات الاعتماد إلى البيانات الوصفية للإعدادات.

### بيانات اعتماد مدعومة بـSecretRef

- يمكن لبيانات اعتماد `api_key` استخدام `keyRef: { source, provider, id }`
- يمكن لبيانات اعتماد `token` استخدام `tokenRef: { source, provider, id }`
- ترفض ملفات التعريف بوضع OAuth بيانات اعتماد SecretRef: إذا كانت قيمة `auth.profiles.<id>.mode` هي `"oauth"`، فسيُرفض `keyRef`/`tokenRef` المدعوم بـSecretRef لذلك الملف.

## التحقق من حالة مصادقة النموذج

```bash
openclaw models status
openclaw doctor
```

فحص مناسب للأتمتة، يُرجع رمز الخروج `1` عند انتهاء الصلاحية/الفقدان، و`2` عند اقتراب انتهاء الصلاحية:

```bash
openclaw models status --check
```

مسابر المصادقة الحية (أضف `--probe-provider` أو `--probe-profile` أو `--probe-timeout` أو `--probe-concurrency` أو `--probe-max-tokens` لتضييق النطاق):

```bash
openclaw models status --probe
```

ملاحظات:

- يمكن أن تأتي صفوف المسبر من ملفات تعريف المصادقة أو بيانات اعتماد البيئة أو `models.json`.
- إذا أغفل `auth.order.<provider>` ملف تعريف مخزنًا، فسيُبلغ المسبر عن `excluded_by_auth_order` لذلك الملف بدلًا من تجربته.
- إذا كانت المصادقة موجودة لكن OpenClaw لا يستطيع تحديد نموذج قابل للمسح لذلك الموفّر، فسيُبلغ المسبر عن `status: no_model`.
- يمكن أن تكون فترات التهدئة الناتجة عن حدود المعدل خاصة بالنموذج: إذ يمكن لملف تعريف في فترة تهدئة لنموذج واحد أن يواصل خدمة نموذج شقيق لدى الموفّر نفسه.

نصوص تشغيلية اختيارية (systemd/Termux): [نصوص مراقبة المصادقة](/ar/help/scripts#auth-monitoring-scripts).

## تدوير مفاتيح API ‏(Gateway)

يعيد بعض الموفّرين محاولة الطلب باستخدام مفتاح بديل مُعدّ عندما تصطدم المكالمة بحد معدل لدى الموفّر.

ترتيب أولوية المفاتيح لكل موفّر:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز واحد يثبّت مفتاحًا واحدًا)
2. `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو مسافات أو فواصل منقوطة)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (أي متغير بيئة بهذه البادئة)

يرجع موفّرا Google (`google` و`google-vertex`) أيضًا إلى `GOOGLE_API_KEY` كخيار احتياطي. تُزال التكرارات من القائمة المجمّعة قبل الاستخدام.

ينتقل OpenClaw إلى المفتاح التالي فقط عندما تطابق رسالة الخطأ إحدى العبارات التالية: `rate_limit` أو `rate limit` أو `429` أو `quota exceeded`/`quota_exceeded` أو `resource exhausted`/`resource_exhausted` أو `too many requests`. لا تُعاد محاولة الأخطاء الأخرى باستخدام مفاتيح بديلة. إذا فشلت جميع المفاتيح، يُعاد الخطأ النهائي من المحاولة الأخيرة.

<Note>
تؤدي العبارات الخاصة بالموفّر، مثل `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded`، إلى تحديد **تصنيف التحويل عند الفشل/إعادة المحاولة** (تبديل النماذج أو الموفّرين عند تكرار الفشل)، وهي آلية منفصلة عن تدوير مفاتيح API الموضح أعلاه.
</Note>

لا تؤدي إزالة المصادقة المحفوظة إلى إلغاء المفتاح لدى الموفّر — دوّره أو ألغِه من لوحة معلومات الموفّر عندما تحتاج إلى إبطاله من جانب الموفّر.

## إزالة مصادقة الموفّر أثناء تشغيل Gateway

عند إزالة مصادقة موفّر عبر مستوى تحكم Gateway، يحذف OpenClaw ملفات تعريف المصادقة المحفوظة لذلك الموفّر ويوقف عمليات الدردشة/الوكيل النشطة التي يطابق موفّر نموذجها المحدد الموفّر المُزال. تُصدر العمليات الموقوفة أحداث الإلغاء/دورة الحياة المعتادة مع `stopReason: "auth-revoked"`، كي تتمكن العملاء المتصلة من إظهار أن العملية توقفت بسبب إزالة بيانات الاعتماد.

## التحكم في بيانات الاعتماد المستخدمة

### معرّفات OpenAI و`openai-codex` القديمة

تستخدم ملفات تعريف مفاتيح OpenAI API وملفات تعريف OAuth الخاصة بـChatGPT/Codex معرّف الموفّر القياسي `openai`. استخدم معرّفات ملفات التعريف `openai:*` و`auth.order.openai` في الإعدادات الجديدة.

إذا رأيت `openai-codex` في إعدادات أقدم أو معرّفات ملفات تعريف المصادقة أو `auth.order.openai-codex`، فتعامل معه على أنه مُدخل ترحيل قديم — ولا تنشئ ملفات تعريف `openai-codex` جديدة. شغّل:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

يعيد doctor كتابة معرّفات ملفات التعريف القديمة `openai-codex:*` وإدخالات `auth.order.openai-codex` إلى مسار `openai` القياسي. للاطلاع على توجيه النماذج/وقت التشغيل الخاص بـOpenAI، راجع [OpenAI](/ar/providers/openai).

### أثناء تسجيل الدخول (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

يفصل `--profile-id` بين عمليات تسجيل دخول OAuth المتعددة للموفّر نفسه داخل وكيل واحد.

يحذف `--force` ملفات تعريف المصادقة المحفوظة لذلك الموفّر في دليل الوكيل المحدد، ثم يعيد تشغيل تدفق المصادقة نفسه. استخدمه عندما يكون ملف تعريف محفوظ عالقًا أو منتهي الصلاحية أو مرتبطًا بالحساب الخطأ. وهو لا يلغي بيانات الاعتماد لدى الموفّر.

```bash
openclaw models auth login --provider anthropic --force
```

### لكل جلسة (أمر دردشة)

- يثبّت `/model <alias-or-id>@<profileId>` بيانات اعتماد موفّر محددة للجلسة الحالية (أمثلة لمعرّفات ملفات التعريف: `anthropic:default` و`anthropic:work`).
- يعرض `/model` (أو `/model list`) أداة اختيار مدمجة؛ ويعرض `/model status` العرض الكامل (المرشحين + ملف تعريف المصادقة التالي، إضافة إلى تفاصيل نقطة نهاية الموفّر عند إعدادها).

إذا غيّرت ترتيب المصادقة أو تثبيت ملف التعريف لدردشة قيد التشغيل بالفعل، فأرسل `/new` أو `/reset` لبدء جلسة جديدة — تحتفظ الجلسات الحالية بتحديد النموذج/ملف التعريف الحالي حتى إعادة الضبط.

### لكل وكيل (تجاوز CLI)

تُخزّن تجاوزات ترتيب المصادقة في حالة مصادقة SQLite الخاصة بذلك الوكيل:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

استخدم `--agent <id>` لاستهداف وكيل محدد؛ واحذفه لاستخدام الوكيل الافتراضي المُعدّ. يعرض `openclaw models status --probe` ملفات التعريف المخزنة المُغفلة على أنها `excluded_by_auth_order` بدلًا من تخطيها بصمت.

## استكشاف الأخطاء وإصلاحها

### "لم يتم العثور على بيانات اعتماد"

أعدّ مفتاح Anthropic API على **مضيف Gateway**، أو أعدّ مسار رمز إعداد Anthropic، ثم تحقّق مجددًا:

```bash
openclaw models status
```

### الرمز المميز يوشك أن تنتهي صلاحيته/منتهي الصلاحية

شغّل `openclaw models status` لمعرفة ملف التعريف الذي توشك صلاحيته على الانتهاء. إذا كان ملف تعريف رمز Anthropic مفقودًا أو منتهي الصلاحية، فحدّثه عبر رمز الإعداد أو انتقل إلى مفتاح Anthropic API.

## ذو صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [الوصول عن بُعد](/ar/gateway/remote)
- [تخزين المصادقة](/ar/concepts/oauth)
