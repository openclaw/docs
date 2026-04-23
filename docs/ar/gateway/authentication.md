---
read_when:
    - تصحيح أخطاء مصادقة النموذج أو انتهاء صلاحية OAuth
    - توثيق المصادقة أو تخزين بيانات الاعتماد
summary: 'مصادقة النموذج: OAuth، ومفاتيح API، وإعادة استخدام Claude CLI، وsetup-token الخاص بـ Anthropic'
title: المصادقة
x-i18n:
    generated_at: "2026-04-23T14:55:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a7c20872b915d1d079f0578c933e43cbdb97eca1c60d8c4e6e5137ca83f8b2
    source_path: gateway/authentication.md
    workflow: 15
---

# المصادقة (موفرو النماذج)

<Note>
تغطي هذه الصفحة مصادقة **موفر النموذج** (مفاتيح API، وOAuth، وإعادة استخدام Claude CLI، وsetup-token الخاص بـ Anthropic). أما **مصادقة اتصال Gateway** (الرمز المميز، وكلمة المرور، وtrusted-proxy)، فراجع [الإعدادات](/ar/gateway/configuration) و[مصادقة Trusted Proxy](/ar/gateway/trusted-proxy-auth).
</Note>

يدعم OpenClaw كلاً من OAuth ومفاتيح API لموفري النماذج. بالنسبة إلى
مضيفي Gateway الذين يعملون باستمرار، تكون مفاتيح API عادةً الخيار الأكثر
قابلية للتنبؤ. كما أن تدفقات الاشتراك/OAuth مدعومة أيضًا عندما تتوافق مع
نموذج حساب موفر الخدمة لديك.

راجع [/concepts/oauth](/ar/concepts/oauth) للاطلاع على تدفق OAuth الكامل وبنية
التخزين.
وبالنسبة إلى المصادقة المعتمدة على SecretRef (موفرو `env`/`file`/`exec`)، راجع [إدارة الأسرار](/ar/gateway/secrets).
أما بالنسبة إلى قواعد أهلية بيانات الاعتماد/رموز الأسباب المستخدمة بواسطة `models status --probe`، فراجع
[دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics).

## الإعداد الموصى به (مفتاح API، أي موفر)

إذا كنت تشغّل Gateway طويل الأمد، فابدأ بمفتاح API لموفر الخدمة
الذي اخترته.
وبالنسبة إلى Anthropic على وجه التحديد، تظل مصادقة مفتاح API هي إعداد الخادم
الأكثر قابلية للتنبؤ، لكن OpenClaw يدعم أيضًا إعادة استخدام تسجيل دخول Claude CLI المحلي.

1. أنشئ مفتاح API في لوحة تحكم موفر الخدمة.
2. ضعه على **مضيف Gateway** (الجهاز الذي يشغّل `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. إذا كان Gateway يعمل تحت systemd/launchd، فالأفضل وضع المفتاح في
   `~/.openclaw/.env` حتى يتمكن البرنامج الخدمي من قراءته:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

ثم أعد تشغيل البرنامج الخدمي (أو أعد تشغيل عملية Gateway لديك) وتحقق مجددًا:

```bash
openclaw models status
openclaw doctor
```

إذا كنت تفضّل عدم إدارة متغيرات البيئة بنفسك، فيمكن لعملية الإعداد الأولي تخزين
مفاتيح API لاستخدام البرنامج الخدمي: `openclaw onboard`.

راجع [المساعدة](/ar/help) للحصول على تفاصيل حول توريث البيئة (`env.shellEnv`,
`~/.openclaw/.env`، وsystemd/launchd).

## Anthropic: Claude CLI وتوافق الرمز المميز

لا تزال مصادقة setup-token الخاصة بـ Anthropic متاحة في OpenClaw بوصفها
مسار رمز مميز مدعومًا. وقد أخبرنا موظفو Anthropic منذ ذلك الحين أن استخدام
Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذا يتعامل OpenClaw مع إعادة استخدام Claude CLI
واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة. وعندما تكون إعادة استخدام Claude CLI متاحة على المضيف،
فإنها تصبح الآن المسار المفضل.

وبالنسبة إلى مضيفي Gateway طويلَي الأمد، يظل مفتاح API الخاص بـ Anthropic
هو الإعداد الأكثر قابلية للتنبؤ. وإذا كنت تريد إعادة استخدام تسجيل دخول Claude
حالي على المضيف نفسه، فاستخدم مسار Anthropic Claude CLI في onboarding/configure.

إعداد المضيف الموصى به لإعادة استخدام Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

هذا إعداد من خطوتين:

1. سجّل دخول Claude Code نفسه إلى Anthropic على مضيف Gateway.
2. أخبر OpenClaw بالتبديل إلى الواجهة الخلفية المحلية `claude-cli`
   لاختيار نموذج Anthropic وتخزين ملف تعريف مصادقة OpenClaw المطابق.

إذا لم يكن `claude` موجودًا على `PATH`، فإما أن تثبّت Claude Code أولاً أو أن تضبط
`agents.defaults.cliBackends.claude-cli.command` على المسار الفعلي للملف التنفيذي.

إدخال الرمز المميز يدويًا (أي موفر؛ يكتب إلى `auth-profiles.json` ويحدّث الإعدادات):

```bash
openclaw models auth paste-token --provider openrouter
```

مراجع ملف تعريف المصادقة مدعومة أيضًا لبيانات الاعتماد الثابتة:

- يمكن لبيانات الاعتماد `api_key` استخدام `keyRef: { source, provider, id }`
- يمكن لبيانات الاعتماد `token` استخدام `tokenRef: { source, provider, id }`
- لا تدعم ملفات التعريف في وضع OAuth بيانات اعتماد SecretRef؛ إذا كان `auth.profiles.<id>.mode` مضبوطًا على `"oauth"`، فسيتم رفض إدخال `keyRef`/`tokenRef` المعتمد على SecretRef لذلك الملف التعريفي.

فحص مناسب للأتمتة (الخروج بـ `1` عند الانتهاء/الغياب، و`2` عند قرب الانتهاء):

```bash
openclaw models status --check
```

تحققات المصادقة المباشرة:

```bash
openclaw models status --probe
```

ملاحظات:

- قد تأتي صفوف probe من ملفات تعريف المصادقة، أو بيانات اعتماد البيئة، أو `models.json`.
- إذا كان `auth.order.<provider>` الصريح يستبعد ملفًا تعريفيًا مخزنًا، فسيبلغ probe عن
  `excluded_by_auth_order` لذلك الملف التعريفي بدلًا من تجربته.
- إذا كانت المصادقة موجودة لكن OpenClaw لا يستطيع تحديد نموذج مرشح قابل للفحص لذلك
  الموفر، فسيبلغ probe عن `status: no_model`.
- يمكن أن تكون فترات التهدئة الخاصة بحد المعدل مرتبطة بنموذج معين. قد يظل الملف التعريفي
  الذي يمر بفترة تهدئة لنموذج واحد قابلًا للاستخدام مع نموذج شقيق لدى الموفر نفسه.

تم توثيق نصوص التشغيل الاختيارية (systemd/Termux) هنا:
[نصوص مراقبة المصادقة](/ar/help/scripts#auth-monitoring-scripts)

## ملاحظة حول Anthropic

أصبحت الواجهة الخلفية `claude-cli` الخاصة بـ Anthropic مدعومة مجددًا.

- أخبرنا موظفو Anthropic أن مسار تكامل OpenClaw هذا مسموح به مجددًا.
- ولذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان
  لعمليات التشغيل المدعومة من Anthropic ما لم تنشر Anthropic سياسة جديدة.
- تظل مفاتيح API الخاصة بـ Anthropic الخيار الأكثر قابلية للتنبؤ بالنسبة إلى مضيفي
  Gateway طويلَي الأمد والتحكم الواضح في الفوترة من جهة الخادم.

## التحقق من حالة مصادقة النموذج

```bash
openclaw models status
openclaw doctor
```

## سلوك تدوير مفتاح API (Gateway)

يدعم بعض الموفّرين إعادة محاولة الطلب باستخدام مفاتيح بديلة عندما تصطدم
استدعاءات API بحد معدل لدى الموفّر.

- ترتيب الأولوية:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز فردي)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- يتضمن موفرو Google أيضًا `GOOGLE_API_KEY` كخيار احتياطي إضافي.
- تُزال المفاتيح المكررة من القائمة نفسها قبل الاستخدام.
- يعيد OpenClaw المحاولة باستخدام المفتاح التالي فقط عند أخطاء حد المعدل (مثل
  `429`، أو `rate_limit`، أو `quota`، أو `resource exhausted`، أو `Too many concurrent
requests`، أو `ThrottlingException`، أو `concurrency limit reached`، أو
  `workers_ai ... quota limit exceeded`).
- لا تتم إعادة محاولة الأخطاء غير المتعلقة بحد المعدل باستخدام مفاتيح بديلة.
- إذا فشلت جميع المفاتيح، فسيُعاد الخطأ النهائي من آخر محاولة.

## التحكم في بيانات الاعتماد المستخدمة

### لكل جلسة (أمر الدردشة)

استخدم `/model <alias-or-id>@<profileId>` لتثبيت بيانات اعتماد موفر محددة للجلسة الحالية (أمثلة على معرّفات الملفات التعريفية: `anthropic:default`، و`anthropic:work`).

استخدم `/model` (أو `/model list`) لمنتقي مختصر؛ واستخدم `/model status` للحصول على العرض الكامل (المرشحون + ملف تعريف المصادقة التالي، بالإضافة إلى تفاصيل نقطة نهاية الموفّر عند ضبطها).

### لكل وكيل (تجاوز CLI)

اضبط تجاوزًا صريحًا لترتيب ملفات تعريف المصادقة لوكيل ما (يُخزَّن في `auth-state.json` الخاص بذلك الوكيل):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

استخدم `--agent <id>` لاستهداف وكيل محدد؛ واحذفه لاستخدام الوكيل الافتراضي المضبوط.
عند تصحيح مشكلات الترتيب، يعرض `openclaw models status --probe` ملفات التعريف
المخزنة المستبعَدة على أنها `excluded_by_auth_order` بدلًا من تخطيها بصمت.
وعند تصحيح مشكلات التهدئة، تذكّر أن فترات التهدئة الخاصة بحد المعدل قد تكون مرتبطة
بمعرّف نموذج واحد بدلًا من ملف تعريف الموفّر بالكامل.

## استكشاف الأخطاء وإصلاحها

### "لم يتم العثور على بيانات اعتماد"

إذا كان ملف تعريف Anthropic مفقودًا، فاضبط مفتاح API خاصًا بـ Anthropic على
**مضيف Gateway** أو أعد إعداد مسار setup-token الخاص بـ Anthropic، ثم تحقق مجددًا:

```bash
openclaw models status
```

### الرمز المميز على وشك الانتهاء/منتهي

شغّل `openclaw models status` للتأكد من الملف التعريفي الذي أوشك على الانتهاء. إذا كان
ملف تعريف رمز Anthropic المميز مفقودًا أو منتهي الصلاحية، فحدّث هذا الإعداد عبر
setup-token أو انتقل إلى مفتاح API خاص بـ Anthropic.
