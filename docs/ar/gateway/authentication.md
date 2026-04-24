---
read_when:
    - تصحيح أخطاء مصادقة النموذج أو انتهاء صلاحية OAuth
    - توثيق المصادقة أو تخزين بيانات الاعتماد
summary: 'مصادقة النموذج: OAuth، ومفاتيح API، وإعادة استخدام Claude CLI، وsetup-token الخاص بـ Anthropic'
title: المصادقة
x-i18n:
    generated_at: "2026-04-24T07:40:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# المصادقة (موفرو النماذج)

<Note>
تغطي هذه الصفحة مصادقة **موفر النموذج** (مفاتيح API، وOAuth، وإعادة استخدام Claude CLI، وsetup-token الخاص بـ Anthropic). أما مصادقة **اتصال gateway** (الرمز، وكلمة المرور، وtrusted-proxy)، فراجع [الإعداد](/ar/gateway/configuration) و[Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth).
</Note>

يدعم OpenClaw كلًا من OAuth ومفاتيح API لموفري النماذج. بالنسبة إلى
مضيفي gateway الدائمين، تكون مفاتيح API عادةً الخيار الأكثر قابلية للتوقع. كما أن
تدفقات الاشتراك/OAuth مدعومة أيضًا عندما تتوافق مع نموذج حساب المزوّد لديك.

راجع [/concepts/oauth](/ar/concepts/oauth) للاطلاع على تدفق OAuth الكامل
وتخطيط التخزين.
وبالنسبة إلى المصادقة القائمة على SecretRef (موفرو `env`/`file`/`exec`)، راجع [إدارة الأسرار](/ar/gateway/secrets).
أما قواعد أهلية بيانات الاعتماد/رموز الأسباب التي يستخدمها `models status --probe`، فراجع
[دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics).

## الإعداد الموصى به (مفتاح API، أي مزوّد)

إذا كنت تشغّل gateway طويلة العمر، فابدأ بمفتاح API للمزوّد الذي
اخترته.
وبالنسبة إلى Anthropic تحديدًا، تظل مصادقة مفتاح API هي إعداد الخادم الأكثر
قابلية للتوقع، لكن OpenClaw يدعم أيضًا إعادة استخدام تسجيل دخول Claude CLI محلي.

1. أنشئ مفتاح API في لوحة تحكم المزوّد.
2. ضعه على **مضيف gateway** (الآلة التي تشغّل `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. إذا كانت Gateway تعمل تحت systemd/launchd، فالأفضل وضع المفتاح في
   `~/.openclaw/.env` حتى يتمكن الـ daemon من قراءته:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

ثم أعد تشغيل الـ daemon (أو أعد تشغيل عملية Gateway لديك) وأعد الفحص:

```bash
openclaw models status
openclaw doctor
```

إذا كنت تفضّل عدم إدارة متغيرات env بنفسك، فيمكن للإعداد الأولي تخزين
مفاتيح API لاستخدام الـ daemon: `openclaw onboard`.

راجع [المساعدة](/ar/help) لمعرفة تفاصيل وراثة env (`env.shellEnv`،
و`~/.openclaw/.env`، وsystemd/launchd).

## Anthropic: Claude CLI وتوافق الرموز

لا تزال مصادقة setup-token الخاصة بـ Anthropic متاحة في OpenClaw كمسار
رمز مدعوم. وقد أخبرنا موظفو Anthropic منذ ذلك الحين أن استخدام Claude CLI
على نمط OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI
واستخدام `claude -p` على أنهما مساران معتمدان لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة. وعندما تكون إعادة استخدام Claude CLI متاحة على المضيف، فإنها
تمثل الآن المسار المفضّل.

بالنسبة إلى مضيفي gateway طويلة العمر، يظل مفتاح Anthropic API هو الإعداد الأكثر
قابلية للتوقع. وإذا كنت تريد إعادة استخدام تسجيل دخول Claude موجود على
المضيف نفسه، فاستخدم مسار Anthropic Claude CLI في onboarding/configure.

إعداد المضيف الموصى به لإعادة استخدام Claude CLI:

```bash
# شغّل هذا على مضيف gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

هذا إعداد من خطوتين:

1. سجّل Claude Code نفسه في Anthropic على مضيف gateway.
2. أخبر OpenClaw أن يحوّل اختيار نموذج Anthropic إلى الواجهة الخلفية المحلية `claude-cli`
   وأن يخزّن ملف تعريف المصادقة المطابق لـ OpenClaw.

إذا لم يكن `claude` موجودًا على `PATH`، فإما أن تثبّت Claude Code أولًا أو تضبط
`agents.defaults.cliBackends.claude-cli.command` على مسار الملف التنفيذي الحقيقي.

إدخال الرمز يدويًا (أي مزوّد؛ يكتب `auth-profiles.json` ويحدّث الإعداد):

```bash
openclaw models auth paste-token --provider openrouter
```

مراجع ملف تعريف المصادقة مدعومة أيضًا لبيانات الاعتماد الثابتة:

- يمكن لبيانات اعتماد `api_key` استخدام `keyRef: { source, provider, id }`
- يمكن لبيانات اعتماد `token` استخدام `tokenRef: { source, provider, id }`
- لا تدعم ملفات التعريف في وضع OAuth بيانات الاعتماد من نوع SecretRef؛ فإذا كانت `auth.profiles.<id>.mode` مضبوطة على `"oauth"`، فسيتم رفض إدخال `keyRef`/`tokenRef` المدعوم بـ SecretRef لذلك الملف.

فحص مناسب للأتمتة (يعيد الخروج `1` عند الانتهاء/الغياب، و`2` عند قرب الانتهاء):

```bash
openclaw models status --check
```

فحوصات المصادقة الحية:

```bash
openclaw models status --probe
```

ملاحظات:

- قد تأتي صفوف probe من ملفات تعريف المصادقة، أو بيانات اعتماد env، أو `models.json`.
- إذا كانت `auth.order.<provider>` الصريحة تستبعد ملف تعريف مخزنًا، فسيعرض probe
  `excluded_by_auth_order` لذلك الملف بدلًا من تجربته.
- إذا كانت المصادقة موجودة لكن OpenClaw لا يستطيع تحديد نموذج مرشح قابل للفحص
  لذلك المزوّد، فسيعرض probe القيمة `status: no_model`.
- يمكن أن تكون فترات التهدئة لحدود المعدل مرتبطة بالنموذج. لذلك قد يبقى ملف تعريف
  في فترة تهدئة لنموذج واحد قابلًا للاستخدام مع نموذج شقيق على المزوّد نفسه.

توجد نصوص التشغيل الاختيارية (systemd/Termux) هنا:
[نصوص مراقبة المصادقة](/ar/help/scripts#auth-monitoring-scripts)

## ملاحظة Anthropic

أصبحت الواجهة الخلفية `claude-cli` الخاصة بـ Anthropic مدعومة مرة أخرى.

- أخبرنا موظفو Anthropic أن مسار تكامل OpenClaw هذا مسموح به مرة أخرى.
- لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما
  مساران معتمدان لتشغيلات Anthropic ما لم تنشر Anthropic سياسة جديدة.
- وتظل مفاتيح Anthropic API الخيار الأكثر قابلية للتوقع لمضيفي gateway
  طويلة العمر وللتحكم الصريح في الفوترة على جانب الخادم.

## فحص حالة مصادقة النموذج

```bash
openclaw models status
openclaw doctor
```

## سلوك تدوير مفاتيح API (gateway)

تدعم بعض المزوّدات إعادة محاولة الطلب باستخدام مفاتيح بديلة عندما تصل مكالمة API
إلى حد معدل لدى المزوّد.

- ترتيب الأولوية:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مفرد)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- تتضمن موفرو Google أيضًا `GOOGLE_API_KEY` كخيار احتياطي إضافي.
- تُزال التكرارات من قائمة المفاتيح نفسها قبل الاستخدام.
- يعيد OpenClaw المحاولة باستخدام المفتاح التالي فقط في حالة أخطاء حدود المعدل (مثل
  `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent
requests` أو `ThrottlingException` أو `concurrency limit reached` أو
  `workers_ai ... quota limit exceeded`).
- لا تتم إعادة المحاولة للأخطاء غير المرتبطة بحدود المعدل باستخدام مفاتيح بديلة.
- إذا فشلت جميع المفاتيح، فسيُعاد الخطأ النهائي من آخر محاولة.

## التحكم في بيانات الاعتماد المستخدمة

### لكل جلسة (أمر دردشة)

استخدم `/model <alias-or-id>@<profileId>` لتثبيت بيانات اعتماد مزوّد محددة للجلسة الحالية (أمثلة على معرّفات الملفات: `anthropic:default` و`anthropic:work`).

استخدم `/model` (أو `/model list`) من أجل محدد مضغوط؛ واستخدم `/model status` من أجل العرض الكامل (المرشحون + ملف تعريف المصادقة التالي، بالإضافة إلى تفاصيل نقطة نهاية المزوّد عند إعدادها).

### لكل وكيل (تجاوز CLI)

اضبط تجاوز ترتيب ملف تعريف مصادقة صريحًا لوكيل (يُخزّن في `auth-state.json` الخاص بذلك الوكيل):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

استخدم `--agent <id>` لاستهداف وكيل محدد؛ أو احذفه لاستخدام الوكيل الافتراضي المُعدّ.
وعند تصحيح مشكلات الترتيب، يعرض `openclaw models status --probe` ملفات التعريف
المخزنة المستبعدة على أنها `excluded_by_auth_order` بدلًا من تخطيها بصمت.
وعند تصحيح مشكلات التهدئة، تذكّر أن فترات التهدئة الخاصة بحدود المعدل قد تكون مرتبطة
بمعرّف نموذج واحد بدلًا من ملف تعريف المزوّد كله.

## استكشاف الأخطاء وإصلاحها

### "No credentials found"

إذا كان ملف تعريف Anthropic مفقودًا، فاضبط مفتاح Anthropic API على
**مضيف gateway** أو أعد إعداد مسار setup-token الخاص بـ Anthropic، ثم أعد الفحص:

```bash
openclaw models status
```

### الرمز على وشك الانتهاء/انتهى

شغّل `openclaw models status` لتأكيد الملف الذي أوشك على الانتهاء. إذا كان
ملف تعريف رمز Anthropic مفقودًا أو منتهيًا، فحدّث هذا الإعداد عبر
setup-token أو انتقل إلى مفتاح Anthropic API.

## ذو صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [الوصول البعيد](/ar/gateway/remote)
- [تخزين المصادقة](/ar/concepts/oauth)
