---
read_when:
    - استكشاف أخطاء مصادقة النموذج أو انتهاء صلاحية OAuth وإصلاحها
    - توثيق المصادقة أو تخزين بيانات الاعتماد
summary: 'مصادقة النماذج: OAuth، ومفاتيح API، وإعادة استخدام Claude CLI، وsetup-token من Anthropic'
title: المصادقة
x-i18n:
    generated_at: "2026-05-06T07:52:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
هذه الصفحة هي مرجع مصادقة **مزوّد النماذج** (مفاتيح API، وOAuth، وإعادة استخدام Claude CLI، ورمز إعداد Anthropic). لمصادقة **اتصال Gateway** (الرمز، كلمة المرور، الوكيل الموثوق)، راجع [التكوين](/ar/gateway/configuration) و[مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth).
</Note>

يدعم OpenClaw OAuth ومفاتيح API لمزوّدي النماذج. بالنسبة إلى مضيفات Gateway
دائمة التشغيل، تكون مفاتيح API عادة الخيار الأكثر قابلية للتنبؤ. كما تُدعم
تدفقات الاشتراك/OAuth عندما تطابق نموذج حساب المزوّد لديك.

راجع [/concepts/oauth](/ar/concepts/oauth) لمعرفة تدفق OAuth الكامل وتخطيط
التخزين.
بالنسبة إلى المصادقة المستندة إلى SecretRef (مزوّدو `env`/`file`/`exec`)، راجع [إدارة الأسرار](/ar/gateway/secrets).
بالنسبة إلى قواعد أهلية بيانات الاعتماد/رموز السبب التي يستخدمها `models status --probe`، راجع
[دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics).

## الإعداد الموصى به (مفتاح API، أي مزوّد)

إذا كنت تشغّل Gateway طويل العمر، فابدأ بمفتاح API للمزوّد الذي اخترته.
وبالنسبة إلى Anthropic تحديدًا، لا تزال مصادقة مفتاح API هي إعداد الخادم
الأكثر قابلية للتنبؤ، لكن OpenClaw يدعم أيضًا إعادة استخدام تسجيل دخول Claude CLI محلي.

1. أنشئ مفتاح API في وحدة تحكم المزوّد لديك.
2. ضعه على **مضيف Gateway** (الجهاز الذي يشغّل `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. إذا كان Gateway يعمل تحت systemd/launchd، ففضّل وضع المفتاح في
   `~/.openclaw/.env` حتى تتمكن الخدمة الخلفية من قراءته:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

ثم أعد تشغيل الخدمة الخلفية (أو أعد تشغيل عملية Gateway لديك) وتحقق مرة أخرى:

```bash
openclaw models status
openclaw doctor
```

إذا كنت تفضّل عدم إدارة متغيرات البيئة بنفسك، يمكن لعملية التهيئة تخزين
مفاتيح API لاستخدام الخدمة الخلفية: `openclaw onboard`.

راجع [المساعدة](/ar/help) للتفاصيل حول توريث البيئة (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: توافق Claude CLI والرموز

لا تزال مصادقة رمز إعداد Anthropic متاحة في OpenClaw كمسار رموز مدعوم.
وقد أخبرنا فريق Anthropic منذ ذلك الحين بأن استخدام Claude CLI بأسلوب OpenClaw
مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p`
على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. عندما تكون
إعادة استخدام Claude CLI متاحة على المضيف، فهذا هو المسار المفضّل الآن.

بالنسبة إلى مضيفات Gateway طويلة العمر، لا يزال مفتاح API من Anthropic هو
الإعداد الأكثر قابلية للتنبؤ. إذا أردت إعادة استخدام تسجيل دخول Claude قائم
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
2. أخبر OpenClaw بأن يبدّل اختيار نموذج Anthropic إلى الواجهة الخلفية المحلية `claude-cli`
   وأن يخزّن ملف تعريف مصادقة OpenClaw المطابق.

إذا لم يكن `claude` موجودًا في `PATH`، فإما أن تثبّت Claude Code أولًا أو تضبط
`agents.defaults.cliBackends.claude-cli.command` على مسار الملف التنفيذي الحقيقي.

إدخال الرمز يدويًا (أي مزوّد؛ يكتب `auth-profiles.json` ويحدّث التكوين):

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

يتوقع OpenClaw شكل `version` + `profiles` القانوني وقت التشغيل. إذا كان تثبيت أقدم لا يزال يحتوي على ملف مسطّح مثل `{ "openrouter": { "apiKey": "..." } }`، فشغّل `openclaw doctor --fix` لإعادة كتابته كملف تعريف مفتاح API باسم `openrouter:default`؛ يحتفظ doctor بنسخة `.legacy-flat.*.bak` بجانب الأصل. تفاصيل نقطة النهاية مثل `baseUrl` و`api` ومعرّفات النماذج والترويسات والمهلات تنتمي إلى `models.providers.<id>` في `openclaw.json` أو `models.json`، وليس في `auth-profiles.json`.

تُدعم مراجع ملفات تعريف المصادقة أيضًا لبيانات الاعتماد الثابتة:

- يمكن لبيانات اعتماد `api_key` استخدام `keyRef: { source, provider, id }`
- يمكن لبيانات اعتماد `token` استخدام `tokenRef: { source, provider, id }`
- لا تدعم ملفات التعريف بوضع OAuth بيانات اعتماد SecretRef؛ إذا كان `auth.profiles.<id>.mode` مضبوطًا على `"oauth"`، فسيُرفض إدخال `keyRef`/`tokenRef` المدعوم بـ SecretRef لذلك الملف التعريفي.

فحص مناسب للأتمتة (الخروج بـ `1` عند انتهاء الصلاحية/الفقدان، و`2` عند قرب انتهاء الصلاحية):

```bash
openclaw models status --check
```

اختبارات مصادقة حية:

```bash
openclaw models status --probe
```

ملاحظات:

- يمكن أن تأتي صفوف الاختبار من ملفات تعريف المصادقة، أو بيانات اعتماد البيئة، أو `models.json`.
- إذا حذف `auth.order.<provider>` الصريح ملفًا تعريفيًا مخزنًا، فسيبلغ الاختبار
  عن `excluded_by_auth_order` لذلك الملف التعريفي بدلًا من تجربته.
- إذا كانت المصادقة موجودة ولكن OpenClaw لا يستطيع حل مرشح نموذج قابل للاختبار
  لذلك المزوّد، فسيبلغ الاختبار عن `status: no_model`.
- يمكن أن تكون فترات تهدئة حدود المعدّل محددة بالنموذج. قد يظل ملف تعريف في فترة
  تهدئة لنموذج واحد قابلًا للاستخدام لنموذج شقيق لدى المزوّد نفسه.

سكربتات التشغيل الاختيارية (systemd/Termux) موثقة هنا:
[سكربتات مراقبة المصادقة](/ar/help/scripts#auth-monitoring-scripts)

## ملاحظة Anthropic

أصبحت الواجهة الخلفية `claude-cli` من Anthropic مدعومة مرة أخرى.

- أخبرنا فريق Anthropic بأن مسار تكامل OpenClaw هذا مسموح به مرة أخرى.
- لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان
  للتشغيلات المدعومة من Anthropic ما لم تنشر Anthropic سياسة جديدة.
- تظل مفاتيح API من Anthropic الخيار الأكثر قابلية للتنبؤ لمضيفات Gateway
  طويلة العمر وللتحكم الصريح في الفوترة من جانب الخادم.

## التحقق من حالة مصادقة النموذج

```bash
openclaw models status
openclaw doctor
```

## سلوك تدوير مفاتيح API (Gateway)

يدعم بعض المزوّدين إعادة محاولة الطلب بمفاتيح بديلة عندما تصطدم استدعاءات API
بحد معدّل لدى المزوّد.

- ترتيب الأولوية:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز واحد)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- يضم مزوّدو Google أيضًا `GOOGLE_API_KEY` كخيار احتياطي إضافي.
- تُزال التكرارات من قائمة المفاتيح نفسها قبل الاستخدام.
- يعيد OpenClaw المحاولة بالمفتاح التالي فقط لأخطاء حدود المعدّل (على سبيل المثال
  `429`، أو `rate_limit`، أو `quota`، أو `resource exhausted`، أو `Too many concurrent
requests`، أو `ThrottlingException`، أو `concurrency limit reached`، أو
  `workers_ai ... quota limit exceeded`).
- لا يُعاد تنفيذ الأخطاء غير المتعلقة بحدود المعدّل باستخدام مفاتيح بديلة.
- إذا فشلت كل المفاتيح، يُعاد الخطأ النهائي من آخر محاولة.

## التحكم في بيانات الاعتماد المستخدمة

### لكل جلسة (أمر دردشة)

استخدم `/model <alias-or-id>@<profileId>` لتثبيت بيانات اعتماد مزوّد محددة للجلسة الحالية (أمثلة لمعرّفات الملفات التعريفية: `anthropic:default`، `anthropic:work`).

استخدم `/model` (أو `/model list`) لمنتقٍ مختصر؛ واستخدم `/model status` للعرض الكامل (المرشحون + ملف تعريف المصادقة التالي، إضافة إلى تفاصيل نقطة نهاية المزوّد عند تكوينها).

### لكل وكيل (تجاوز CLI)

اضبط تجاوز ترتيب ملفات تعريف المصادقة الصريح لوكيل (يُخزّن في `auth-state.json` الخاص بذلك الوكيل):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

استخدم `--agent <id>` لاستهداف وكيل محدد؛ احذفه لاستخدام الوكيل الافتراضي المكوّن.
عند تصحيح مشكلات الترتيب، يعرض `openclaw models status --probe` الملفات التعريفية
المخزّنة المحذوفة على أنها `excluded_by_auth_order` بدلًا من تخطيها بصمت.
وعند تصحيح مشكلات التهدئة، تذكّر أن فترات تهدئة حدود المعدّل قد تكون مرتبطة
بمعرّف نموذج واحد بدلًا من ملف تعريف المزوّد بالكامل.

## استكشاف الأخطاء وإصلاحها

### "No credentials found"

إذا كان ملف تعريف Anthropic مفقودًا، فكوّن مفتاح API من Anthropic على
**مضيف Gateway** أو أعد إعداد مسار رمز إعداد Anthropic، ثم تحقق مرة أخرى:

```bash
openclaw models status
```

### الرمز يقترب من انتهاء الصلاحية/انتهت صلاحيته

شغّل `openclaw models status` للتأكد من الملف التعريفي الذي يقترب من انتهاء الصلاحية. إذا كان
ملف تعريف رمز Anthropic مفقودًا أو منتهي الصلاحية، فحدّث ذلك الإعداد عبر
رمز الإعداد أو انتقل إلى مفتاح API من Anthropic.

## ذات صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [الوصول عن بُعد](/ar/gateway/remote)
- [تخزين المصادقة](/ar/concepts/oauth)
