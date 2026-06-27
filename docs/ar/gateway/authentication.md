---
read_when:
    - استكشاف أخطاء مصادقة النموذج أو انتهاء صلاحية OAuth وإصلاحها
    - توثيق المصادقة أو تخزين بيانات الاعتماد
summary: 'مصادقة النماذج: OAuth ومفاتيح API وإعادة استخدام Claude CLI ورمز إعداد Anthropic'
title: المصادقة
x-i18n:
    generated_at: "2026-06-27T17:34:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
هذه الصفحة هي مرجع مصادقة **مزود النماذج** (مفاتيح API، وOAuth، وإعادة استخدام Claude CLI، ورمز إعداد Anthropic). لمصادقة **اتصال Gateway** (رمز، كلمة مرور، وكيل موثوق)، راجع [الإعدادات](/ar/gateway/configuration) و[مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth).
</Note>

يدعم OpenClaw OAuth ومفاتيح API لمزودي النماذج. بالنسبة إلى مضيفي Gateway
الدائمين، تكون مفاتيح API عادة الخيار الأكثر قابلية للتنبؤ. كما تُدعم تدفقات
الاشتراك/OAuth عندما تطابق نموذج حسابك لدى المزود.

راجع [/concepts/oauth](/ar/concepts/oauth) للاطلاع على تدفق OAuth الكامل وتخطيط
التخزين.
للمصادقة المستندة إلى SecretRef (مزودو `env`/`file`/`exec`)، راجع [إدارة الأسرار](/ar/gateway/secrets).
لقواعد أهلية بيانات الاعتماد/رموز السبب التي يستخدمها `models status --probe`، راجع
[دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics).

## الإعداد الموصى به (مفتاح API، أي مزود)

إذا كنت تشغّل Gateway طويل العمر، فابدأ بمفتاح API للمزود الذي اخترته.
وبالنسبة إلى Anthropic تحديدًا، لا تزال مصادقة مفتاح API هي إعداد الخادم الأكثر
قابلية للتنبؤ، لكن OpenClaw يدعم أيضًا إعادة استخدام تسجيل دخول Claude CLI محلي.

1. أنشئ مفتاح API في لوحة تحكم المزود لديك.
2. ضعه على **مضيف Gateway** (الجهاز الذي يشغّل `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. إذا كان Gateway يعمل تحت systemd/launchd، فالأفضل وضع المفتاح في
   `~/.openclaw/.env` حتى يتمكن البرنامج الخفي من قراءته:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

ثم أعد تشغيل البرنامج الخفي (أو أعد تشغيل عملية Gateway) وأعد التحقق:

```bash
openclaw models status
openclaw doctor
```

إذا كنت تفضل عدم إدارة متغيرات البيئة بنفسك، يمكن لعملية التهيئة تخزين
مفاتيح API لاستخدام البرنامج الخفي: `openclaw onboard`.

راجع [المساعدة](/ar/help) للتفاصيل حول توريث البيئة (`env.shellEnv`،
`~/.openclaw/.env`، systemd/launchd).

## Anthropic: توافق Claude CLI والرموز

لا تزال مصادقة رمز إعداد Anthropic متاحة في OpenClaw كمسار رمز مدعوم.
وقد أخبرنا فريق Anthropic لاحقًا أن استخدام Claude CLI بأسلوب OpenClaw
مسموح به مجددًا، لذلك يعامل OpenClaw إعادة استخدام Claude CLI واستخدام
`claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
عندما تكون إعادة استخدام Claude CLI متاحة على المضيف، فهذا هو المسار المفضل الآن.

بالنسبة إلى مضيفي Gateway طويلي العمر، لا يزال مفتاح Anthropic API هو الإعداد
الأكثر قابلية للتنبؤ. إذا أردت إعادة استخدام تسجيل دخول Claude موجود على المضيف
نفسه، فاستخدم مسار Anthropic Claude CLI في التهيئة/الإعداد.

إعداد المضيف الموصى به لإعادة استخدام Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

هذا إعداد من خطوتين:

1. سجّل دخول Claude Code نفسه إلى Anthropic على مضيف Gateway.
2. أخبر OpenClaw بتبديل اختيار نماذج Anthropic إلى واجهة `claude-cli`
   المحلية وتخزين ملف مصادقة OpenClaw المطابق.

إذا لم يكن `claude` موجودًا في `PATH`، فثبّت Claude Code أولًا أو اضبط
`agents.defaults.cliBackends.claude-cli.command` على المسار الحقيقي للملف التنفيذي.

إدخال الرمز يدويًا (أي مزود؛ يكتب مخزن مصادقة SQLite الخاص بالوكيل ويحدّث الإعدادات):

```bash
openclaw models auth paste-token --provider openrouter
```

يحتفظ مخزن ملفات تعريف المصادقة ببيانات الاعتماد فقط. استخدمت ملفات `auth-profiles.json` القديمة هذا الشكل القياسي:

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

يقرأ OpenClaw الآن ملفات تعريف المصادقة من `openclaw-agent.sqlite` الخاص بكل وكيل. إذا كان تثبيت أقدم لا يزال يحتوي على `auth-profiles.json` أو `auth-state.json` أو ملف تعريف مصادقة مسطح مثل `{ "openrouter": { "apiKey": "..." } }`، فشغّل `openclaw doctor --fix` لاستيراده إلى SQLite؛ يحتفظ doctor بنسخ احتياطية ممهورة بالوقت بجانب ملفات JSON الأصلية. تفاصيل نقطة النهاية مثل `baseUrl` و`api` ومعرفات النماذج والرؤوس والمهلات يجب أن تكون ضمن `models.providers.<id>` في `openclaw.json` أو `models.json`، وليس في ملفات تعريف المصادقة.

مسارات المصادقة الخارجية مثل Bedrock `auth: "aws-sdk"` ليست أيضًا بيانات اعتماد. إذا أردت مسار Bedrock مسمى، فضع `auth.profiles.<id>.mode: "aws-sdk"` في `openclaw.json`؛ لا تكتب `type: "aws-sdk"` داخل مخزن ملفات تعريف المصادقة. ينقل `openclaw doctor --fix` علامات AWS SDK القديمة من مخزن بيانات الاعتماد إلى بيانات تعريف الإعدادات.

تُدعم مراجع ملفات تعريف المصادقة أيضًا لبيانات الاعتماد الثابتة:

- يمكن لبيانات اعتماد `api_key` استخدام `keyRef: { source, provider, id }`
- يمكن لبيانات اعتماد `token` استخدام `tokenRef: { source, provider, id }`
- لا تدعم ملفات التعريف في وضع OAuth بيانات اعتماد SecretRef؛ إذا كان `auth.profiles.<id>.mode` مضبوطًا على `"oauth"`، فسيُرفض إدخال `keyRef`/`tokenRef` المدعوم بـ SecretRef لذلك الملف الشخصي.

فحص مناسب للأتمتة (الخروج بـ `1` عند الانتهاء/الفقدان، و`2` عند اقتراب الانتهاء):

```bash
openclaw models status --check
```

مجسات المصادقة الحية:

```bash
openclaw models status --probe
```

ملاحظات:

- يمكن أن تأتي صفوف المجس من ملفات تعريف المصادقة، أو بيانات اعتماد البيئة، أو `models.json`.
- إذا أغفل `auth.order.<provider>` الصريح ملفًا شخصيًا مخزنًا، يبلغ المجس عن
  `excluded_by_auth_order` لذلك الملف الشخصي بدلًا من تجربته.
- إذا كانت المصادقة موجودة لكن OpenClaw لا يستطيع حل مرشح نموذج قابل للفحص
  لذلك المزود، يبلغ المجس عن `status: no_model`.
- يمكن أن تكون فترات تهدئة حدود المعدل مرتبطة بنموذج محدد. قد يظل الملف الشخصي
  الذي يهدأ لنموذج واحد قابلًا للاستخدام مع نموذج شقيق لدى المزود نفسه.

تُوثق سكربتات العمليات الاختيارية (systemd/Termux) هنا:
[سكربتات مراقبة المصادقة](/ar/help/scripts#auth-monitoring-scripts)

## ملاحظة Anthropic

واجهة Anthropic `claude-cli` مدعومة مجددًا.

- أخبرنا فريق Anthropic أن مسار تكامل OpenClaw هذا مسموح به مجددًا.
- لذلك يعامل OpenClaw إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان
  للتشغيلات المدعومة من Anthropic ما لم تنشر Anthropic سياسة جديدة.
- تظل مفاتيح Anthropic API الخيار الأكثر قابلية للتنبؤ لمضيفي Gateway طويلي
  العمر وللتحكم الصريح في الفوترة من جهة الخادم.

## التحقق من حالة مصادقة النموذج

```bash
openclaw models status
openclaw doctor
```

## سلوك تدوير مفاتيح API (Gateway)

يدعم بعض المزودين إعادة محاولة الطلب بمفاتيح بديلة عندما تصطدم استدعاءات API
بحد معدل لدى المزود.

- ترتيب الأولوية:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز واحد)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- يتضمن مزودو Google أيضًا `GOOGLE_API_KEY` كخيار احتياطي إضافي.
- تُزال التكرارات من قائمة المفاتيح نفسها قبل الاستخدام.
- يعيد OpenClaw المحاولة بالمفتاح التالي فقط لأخطاء حدود المعدل (مثل
  `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent
requests` أو `ThrottlingException` أو `concurrency limit reached` أو
  `workers_ai ... quota limit exceeded`).
- لا تُعاد محاولة الأخطاء غير المرتبطة بحدود المعدل باستخدام مفاتيح بديلة.
- إذا فشلت كل المفاتيح، يُعاد الخطأ النهائي من المحاولة الأخيرة.

## إزالة مصادقة المزود أثناء تشغيل Gateway

عند إزالة مصادقة المزود عبر مستوى تحكم Gateway، يحذف OpenClaw ملفات تعريف
المصادقة المحفوظة لذلك المزود ويجهض محادثات الدردشة أو تشغيلات الوكلاء النشطة
التي يطابق مزود النموذج المحدد فيها المزود المحذوف. تصدر التشغيلات المُجهضة
أحداث إلغاء الدردشة ودورة الحياة المعتادة مع
`stopReason: "auth-revoked"`، بحيث يمكن للعملاء المتصلين إظهار أن التشغيل
توقف لأن بيانات الاعتماد أُزيلت.

إزالة المصادقة المحفوظة لا تلغي المفاتيح لدى المزود. دوّر المفتاح أو ألغِه
في لوحة تحكم المزود عندما تحتاج إلى إبطال من جهة المزود.

## التحكم في بيانات الاعتماد المستخدمة

### OpenAI ومعرفات `openai-codex` القديمة

تستخدم ملفات تعريف مفاتيح OpenAI API وملفات تعريف ChatGPT/Codex OAuth كلاهما
معرف المزود القياسي `openai`. يجب أن تستخدم الإعدادات الجديدة معرفات ملفات
تعريف `openai:*` و`auth.order.openai`.

إذا رأيت `openai-codex` في إعدادات أقدم، أو معرفات ملفات تعريف المصادقة، أو
`auth.order.openai-codex`، فتعامل معه كمدخل ترحيل قديم. لا تنشئ ملفات تعريف
`openai-codex` جديدة. شغّل:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

يعيد Doctor كتابة معرفات ملفات تعريف `openai-codex:*` القديمة ومدخلات
`auth.order.openai-codex` إلى مسار مصادقة `openai` القياسي. للتوجيه الخاص
بنماذج/تشغيل OpenAI، راجع [OpenAI](/ar/providers/openai).

### أثناء تسجيل الدخول (CLI)

استخدم `openclaw models auth login --provider <id> --profile-id <profileId>` للمزودين
الذين يدعمون ملفات تعريف مصادقة مسماة أثناء تسجيل الدخول.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

هذه هي أسهل طريقة لإبقاء عدة تسجيلات دخول OAuth للمزود نفسه منفصلة داخل وكيل واحد.

استخدم `--force` عندما يكون ملف تعريف مزود محفوظ عالقًا، أو منتهي الصلاحية، أو مرتبطًا
بالحساب الخطأ ويستمر أمر تسجيل الدخول العادي في إعادة استخدامه. يحذف `--force`
ملفات تعريف المصادقة المحفوظة لذلك المزود في دليل الوكيل المحدد، ثم يشغّل تدفق
مصادقة المزود نفسه مرة أخرى. لا يلغي بيانات الاعتماد لدى المزود؛ دوّرها أو ألغِها
في لوحة تحكم المزود عندما تحتاج إلى إبطال من جهة المزود.

```bash
openclaw models auth login --provider anthropic --force
```

### لكل جلسة (أمر الدردشة)

استخدم `/model <alias-or-id>@<profileId>` لتثبيت بيانات اعتماد مزود محددة للجلسة الحالية (أمثلة معرفات الملفات الشخصية: `anthropic:default`، `anthropic:work`).

استخدم `/model` (أو `/model list`) لمنتقي موجز؛ واستخدم `/model status` للعرض الكامل (المرشحون + ملف تعريف المصادقة التالي، بالإضافة إلى تفاصيل نقطة نهاية المزود عند إعدادها).

### لكل وكيل (تجاوز CLI)

اضبط تجاوزًا صريحًا لترتيب ملفات تعريف المصادقة لوكيل (يُخزن في حالة مصادقة SQLite لذلك الوكيل):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

استخدم `--agent <id>` لاستهداف وكيل محدد؛ واحذفه لاستخدام الوكيل الافتراضي المُعد.
عند تصحيح مشكلات الترتيب، يعرض `openclaw models status --probe` الملفات الشخصية
المخزنة المحذوفة على أنها `excluded_by_auth_order` بدلًا من تخطيها بصمت.
وعند تصحيح مشكلات التهدئة، تذكر أن فترات تهدئة حدود المعدل يمكن أن تكون مرتبطة
بمعرف نموذج واحد بدلًا من ملف تعريف المزود كله.

إذا غيّرت ترتيب المصادقة أو تثبيت الملف الشخصي لمحادثة قيد التشغيل بالفعل،
فأرسل `/new` أو `/reset` في تلك المحادثة لبدء جلسة جديدة. يمكن للجلسات الحالية
الاحتفاظ باختيار النموذج/الملف الشخصي الحالي حتى إعادة الضبط.

## استكشاف الأخطاء وإصلاحها

### "No credentials found"

إذا كان ملف Anthropic الشخصي مفقودًا، فاضبط مفتاح Anthropic API على
**مضيف Gateway** أو أعد إعداد مسار رمز إعداد Anthropic، ثم أعد التحقق:

```bash
openclaw models status
```

### الرمز يقترب من الانتهاء/منتهي الصلاحية

شغّل `openclaw models status` لتأكيد الملف الشخصي الذي يقترب من الانتهاء. إذا كان
ملف رمز Anthropic الشخصي مفقودًا أو منتهي الصلاحية، فحدّث ذلك الإعداد عبر
رمز الإعداد أو انتقل إلى مفتاح Anthropic API.

## ذات صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [الوصول عن بُعد](/ar/gateway/remote)
- [تخزين المصادقة](/ar/concepts/oauth)
