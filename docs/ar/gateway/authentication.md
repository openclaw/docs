---
read_when:
    - تصحيح أخطاء مصادقة النموذج أو انتهاء صلاحية OAuth
    - توثيق المصادقة أو تخزين بيانات الاعتماد
summary: 'مصادقة النماذج: OAuth، ومفاتيح API، وإعادة استخدام Claude CLI، وsetup-token من Anthropic'
title: المصادقة
x-i18n:
    generated_at: "2026-05-07T13:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
هذه الصفحة هي مرجع مصادقة **موفّر النماذج** (مفاتيح API، وOAuth، وإعادة استخدام Claude CLI، ورمز setup-token من Anthropic). لمصادقة **اتصال Gateway** (الرمز، كلمة المرور، trusted-proxy)، راجع [التكوين](/ar/gateway/configuration) و[مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth).
</Note>

يدعم OpenClaw مفاتيح OAuth وAPI لموفّري النماذج. بالنسبة إلى مضيفات Gateway
الدائمة التشغيل، تكون مفاتيح API عادة الخيار الأكثر قابلية للتنبؤ. كما تُدعم
تدفقات الاشتراك/OAuth عندما تطابق نموذج حسابك لدى الموفّر.

راجع [/concepts/oauth](/ar/concepts/oauth) للاطلاع على تدفق OAuth الكامل وتخطيط
التخزين.
للمصادقة المعتمدة على SecretRef (موفّرو `env`/`file`/`exec`)، راجع [إدارة الأسرار](/ar/gateway/secrets).
لقواعد أهلية بيانات الاعتماد/أكواد السبب التي يستخدمها `models status --probe`، راجع
[دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics).

## الإعداد الموصى به (مفتاح API، أي موفّر)

إذا كنت تشغّل Gateway طويل العمر، فابدأ بمفتاح API للموفّر الذي اخترته.
بالنسبة إلى Anthropic تحديدًا، لا تزال مصادقة مفتاح API هي إعداد الخادم الأكثر
قابلية للتنبؤ، لكن OpenClaw يدعم أيضًا إعادة استخدام تسجيل دخول Claude CLI محلي.

1. أنشئ مفتاح API في وحدة تحكم الموفّر لديك.
2. ضعه على **مضيف Gateway** (الجهاز الذي يشغّل `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. إذا كان Gateway يعمل تحت systemd/launchd، فالأفضل وضع المفتاح في
   `~/.openclaw/.env` حتى يتمكن الخادم الخفي من قراءته:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

ثم أعد تشغيل الخادم الخفي (أو أعد تشغيل عملية Gateway لديك) وتحقق مجددًا:

```bash
openclaw models status
openclaw doctor
```

إذا كنت لا تفضّل إدارة متغيرات البيئة بنفسك، فيمكن لعملية التهيئة تخزين
مفاتيح API لاستخدام الخادم الخفي: `openclaw onboard`.

راجع [المساعدة](/ar/help) للحصول على تفاصيل حول وراثة البيئة (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: توافق Claude CLI والرموز

لا تزال مصادقة setup-token الخاصة بـ Anthropic متاحة في OpenClaw كمسار رمز
مدعوم. أخبرنا فريق Anthropic منذ ذلك الحين أن استخدام Claude CLI بأسلوب
OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI
واستخدام `claude -p` على أنهما مصرّح بهما لهذا التكامل ما لم تنشر Anthropic
سياسة جديدة. عندما تكون إعادة استخدام Claude CLI متاحة على المضيف، فهذا هو
المسار المفضّل الآن.

بالنسبة إلى مضيفات Gateway طويلة العمر، لا يزال مفتاح API من Anthropic هو
الإعداد الأكثر قابلية للتنبؤ. إذا أردت إعادة استخدام تسجيل دخول Claude موجود
على المضيف نفسه، فاستخدم مسار Anthropic Claude CLI في التهيئة/التكوين.

إعداد المضيف الموصى به لإعادة استخدام Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

هذا إعداد من خطوتين:

1. سجّل دخول Claude Code نفسه إلى Anthropic على مضيف Gateway.
2. أخبر OpenClaw بالتبديل في اختيار نماذج Anthropic إلى الواجهة الخلفية المحلية `claude-cli`
   وتخزين ملف تعريف مصادقة OpenClaw المطابق.

إذا لم يكن `claude` على `PATH`، فثبّت Claude Code أولًا أو اضبط
`agents.defaults.cliBackends.claude-cli.command` على مسار الملف التنفيذي الحقيقي.

إدخال الرمز يدويًا (أي موفّر؛ يكتب `auth-profiles.json` + يحدّث التكوين):

```bash
openclaw models auth paste-token --provider openrouter
```

يخزّن `auth-profiles.json` بيانات الاعتماد فقط. الشكل القانوني هو:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

يتوقع OpenClaw شكل `version` + `profiles` القانوني في وقت التشغيل. إذا كان تثبيت أقدم لا يزال يحتوي على ملف مسطّح مثل `{ "openrouter": { "apiKey": "..." } }`، فشغّل `openclaw doctor --fix` لإعادة كتابته كملف تعريف مفتاح API باسم `openrouter:default`؛ يحتفظ doctor بنسخة `.legacy-flat.*.bak` بجانب الأصل. تفاصيل نقطة النهاية مثل `baseUrl` و`api` ومعرّفات النماذج والرؤوس والمهلات تنتمي تحت `models.providers.<id>` في `openclaw.json` أو `models.json`، وليس في `auth-profiles.json`.

مسارات المصادقة الخارجية مثل Bedrock `auth: "aws-sdk"` ليست بيانات اعتماد أيضًا. إذا أردت مسار Bedrock مسمّى، فضع `auth.profiles.<id>.mode: "aws-sdk"` في `openclaw.json`؛ لا تكتب `type: "aws-sdk"` في `auth-profiles.json`. ينقل `openclaw doctor --fix` علامات AWS SDK القديمة من مخزن بيانات الاعتماد إلى بيانات تعريف التكوين.

مراجع ملفات تعريف المصادقة مدعومة أيضًا لبيانات الاعتماد الثابتة:

- يمكن لبيانات اعتماد `api_key` استخدام `keyRef: { source, provider, id }`
- يمكن لبيانات اعتماد `token` استخدام `tokenRef: { source, provider, id }`
- لا تدعم ملفات التعريف بوضع OAuth بيانات اعتماد SecretRef؛ إذا ضُبط `auth.profiles.<id>.mode` على `"oauth"`، فسيُرفض إدخال `keyRef`/`tokenRef` المدعوم بـ SecretRef لذلك الملف الشخصي.

فحص مناسب للأتمتة (الخروج بـ `1` عند الانتهاء/الفقدان، و`2` عند قرب الانتهاء):

```bash
openclaw models status --check
```

فحوصات المصادقة الحية:

```bash
openclaw models status --probe
```

ملاحظات:

- يمكن أن تأتي صفوف الفحص من ملفات تعريف المصادقة أو بيانات اعتماد البيئة أو `models.json`.
- إذا حذف `auth.order.<provider>` الصريح ملف تعريف مخزّنًا، يبلّغ الفحص عن
  `excluded_by_auth_order` لذلك الملف الشخصي بدلًا من تجربته.
- إذا كانت المصادقة موجودة لكن OpenClaw لا يستطيع حل مرشح نموذج قابل للفحص
  لذلك الموفّر، يبلّغ الفحص عن `status: no_model`.
- يمكن أن تكون فترات تهدئة حدود المعدل مقيّدة بالنموذج. يمكن أن يكون ملف تعريف في فترة تهدئة لنموذج واحد
  صالحًا للاستخدام لنموذج شقيق لدى الموفّر نفسه.

تُوثّق نصوص العمليات الاختيارية (systemd/Termux) هنا:
[نصوص مراقبة المصادقة](/ar/help/scripts#auth-monitoring-scripts)

## ملاحظة Anthropic

الواجهة الخلفية `claude-cli` من Anthropic مدعومة مرة أخرى.

- أخبرنا فريق Anthropic أن مسار تكامل OpenClaw هذا مسموح به مرة أخرى.
- لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مصرّح بهما
  للتشغيلات المدعومة من Anthropic ما لم تنشر Anthropic سياسة جديدة.
- تبقى مفاتيح API من Anthropic الخيار الأكثر قابلية للتنبؤ لمضيفات Gateway
  طويلة العمر والتحكم الصريح في الفوترة من جانب الخادم.

## التحقق من حالة مصادقة النماذج

```bash
openclaw models status
openclaw doctor
```

## سلوك تدوير مفاتيح API (Gateway)

يدعم بعض الموفّرين إعادة محاولة الطلب بمفاتيح بديلة عندما تصطدم مكالمة API
بحد معدل لدى الموفّر.

- ترتيب الأولوية:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز واحد)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- يتضمن موفّرو Google أيضًا `GOOGLE_API_KEY` كخيار احتياطي إضافي.
- تُزال التكرارات من قائمة المفاتيح نفسها قبل الاستخدام.
- يعيد OpenClaw المحاولة بالمفتاح التالي فقط لأخطاء حدود المعدل (مثل
  `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent
requests` أو `ThrottlingException` أو `concurrency limit reached` أو
  `workers_ai ... quota limit exceeded`).
- لا تُعاد محاولة الأخطاء غير المتعلقة بحدود المعدل باستخدام مفاتيح بديلة.
- إذا فشلت كل المفاتيح، يُعاد الخطأ النهائي من المحاولة الأخيرة.

## التحكم في بيانات الاعتماد المستخدمة

### لكل جلسة (أمر محادثة)

استخدم `/model <alias-or-id>@<profileId>` لتثبيت بيانات اعتماد موفّر محددة للجلسة الحالية (أمثلة لمعرّفات ملفات التعريف: `anthropic:default`, `anthropic:work`).

استخدم `/model` (أو `/model list`) لمنتقي مضغوط؛ واستخدم `/model status` للعرض الكامل (المرشحون + ملف تعريف المصادقة التالي، إضافة إلى تفاصيل نقطة نهاية الموفّر عند تكوينها).

### لكل وكيل (تجاوز CLI)

اضبط تجاوزًا صريحًا لترتيب ملفات تعريف المصادقة لوكيل (مخزّن في `auth-state.json` لذلك الوكيل):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

استخدم `--agent <id>` لاستهداف وكيل محدد؛ احذفه لاستخدام الوكيل الافتراضي المكوّن.
عند تصحيح مشكلات الترتيب، يعرض `openclaw models status --probe` ملفات التعريف
المخزّنة المحذوفة على أنها `excluded_by_auth_order` بدلًا من تخطيها بصمت.
عند تصحيح مشكلات التهدئة، تذكّر أن فترات تهدئة حدود المعدل يمكن أن ترتبط
بمعرّف نموذج واحد لا بملف تعريف الموفّر بأكمله.

## استكشاف الأخطاء وإصلاحها

### "No credentials found"

إذا كان ملف تعريف Anthropic مفقودًا، فكوّن مفتاح API من Anthropic على
**مضيف Gateway** أو أعد إعداد مسار setup-token الخاص بـ Anthropic، ثم تحقق مجددًا:

```bash
openclaw models status
```

### الرمز يقترب من الانتهاء/انتهى

شغّل `openclaw models status` لتأكيد ملف التعريف الذي يقترب من الانتهاء. إذا كان
ملف تعريف رمز Anthropic مفقودًا أو منتهيًا، فحدّث ذلك الإعداد عبر
setup-token أو انتقل إلى مفتاح API من Anthropic.

## ذات صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [الوصول عن بُعد](/ar/gateway/remote)
- [تخزين المصادقة](/ar/concepts/oauth)
