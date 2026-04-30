---
read_when:
    - تصحيح أخطاء مصادقة النموذج أو انتهاء صلاحية OAuth
    - توثيق المصادقة أو تخزين بيانات الاعتماد
summary: 'مصادقة النماذج: OAuth، مفاتيح API، إعادة استخدام Claude CLI، وsetup-token من Anthropic'
title: المصادقة
x-i18n:
    generated_at: "2026-04-30T07:56:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
هذه الصفحة هي مرجع مصادقة **موفر النموذج** (مفاتيح API، وOAuth، وإعادة استخدام Claude CLI، ورمز إعداد Anthropic). لمصادقة **اتصال Gateway** (الرمز، كلمة المرور، الوكيل الموثوق)، راجع [التكوين](/ar/gateway/configuration) و[مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth).
</Note>

يدعم OpenClaw مصادقة OAuth ومفاتيح API لموفري النماذج. بالنسبة إلى مضيفي Gateway
الذين يعملون دائمًا، تكون مفاتيح API عادةً الخيار الأكثر قابلية للتنبؤ. كما تُدعم
تدفقات الاشتراك/OAuth عندما تطابق نموذج حسابك لدى الموفر.

راجع [/concepts/oauth](/ar/concepts/oauth) للاطلاع على تدفق OAuth الكامل وتخطيط
التخزين.
بالنسبة إلى المصادقة المستندة إلى SecretRef (موفرو `env`/`file`/`exec`)، راجع [إدارة الأسرار](/ar/gateway/secrets).
بالنسبة إلى قواعد أهلية بيانات الاعتماد/رموز السبب المستخدمة بواسطة `models status --probe`، راجع
[دلالات بيانات اعتماد المصادقة](/ar/auth-credential-semantics).

## الإعداد الموصى به (مفتاح API، أي موفر)

إذا كنت تشغّل Gateway طويل العمر، فابدأ بمفتاح API للموفر الذي اخترته.
بالنسبة إلى Anthropic تحديدًا، لا تزال مصادقة مفتاح API هي إعداد الخادم الأكثر
قابلية للتنبؤ، لكن OpenClaw يدعم أيضًا إعادة استخدام تسجيل دخول Claude CLI محلي.

1. أنشئ مفتاح API في وحدة تحكم الموفر لديك.
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

ثم أعد تشغيل الخادم الخفي (أو أعد تشغيل عملية Gateway) وأعد الفحص:

```bash
openclaw models status
openclaw doctor
```

إذا كنت تفضّل عدم إدارة متغيرات البيئة بنفسك، يمكن لمرحلة التهيئة تخزين
مفاتيح API لاستخدام الخادم الخفي: `openclaw onboard`.

راجع [المساعدة](/ar/help) للحصول على تفاصيل حول وراثة البيئة (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: توافق Claude CLI والرموز

لا تزال مصادقة رمز إعداد Anthropic متاحة في OpenClaw كمسار رموز مدعوم. وقد أخبرنا موظفو Anthropic لاحقًا بأن استخدام Claude CLI بأسلوب OpenClaw
مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p`
على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. عندما تكون
إعادة استخدام Claude CLI متاحة على المضيف، فهذا هو المسار المفضّل الآن.

بالنسبة إلى مضيفي Gateway طويلي العمر، يظل مفتاح API من Anthropic هو الإعداد
الأكثر قابلية للتنبؤ. إذا أردت إعادة استخدام تسجيل دخول Claude موجود على المضيف نفسه، فاستخدم
مسار Anthropic Claude CLI في التهيئة/التكوين.

إعداد المضيف الموصى به لإعادة استخدام Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

هذا إعداد من خطوتين:

1. سجّل دخول Claude Code نفسه إلى Anthropic على مضيف Gateway.
2. أخبر OpenClaw بأن يبدّل اختيار نماذج Anthropic إلى الواجهة الخلفية المحلية `claude-cli`
   وأن يخزّن ملف مصادقة OpenClaw المطابق.

إذا لم يكن `claude` موجودًا في `PATH`، فثبّت Claude Code أولًا أو عيّن
`agents.defaults.cliBackends.claude-cli.command` إلى مسار الملف التنفيذي الفعلي.

إدخال الرمز يدويًا (أي موفر؛ يكتب `auth-profiles.json` + يحدّث التكوين):

```bash
openclaw models auth paste-token --provider openrouter
```

يخزّن `auth-profiles.json` بيانات الاعتماد فقط. الشكل المعتمد هو:

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

يتوقع OpenClaw الشكل المعتمد `version` + `profiles` في وقت التشغيل. إذا كان تثبيت أقدم لا يزال يحتوي على ملف مسطح مثل `{ "openrouter": { "apiKey": "..." } }`، فشغّل `openclaw doctor --fix` لإعادة كتابته كملف تعريف مفتاح API باسم `openrouter:default`؛ يحتفظ doctor بنسخة `.legacy-flat.*.bak` بجانب الأصل. تفاصيل نقاط النهاية مثل `baseUrl` و`api` ومعرّفات النماذج والرؤوس والمهلات الزمنية تنتمي إلى `models.providers.<id>` في `openclaw.json` أو `models.json`، وليس في `auth-profiles.json`.

كما تُدعم مراجع ملفات تعريف المصادقة لبيانات الاعتماد الثابتة:

- يمكن لبيانات اعتماد `api_key` استخدام `keyRef: { source, provider, id }`
- يمكن لبيانات اعتماد `token` استخدام `tokenRef: { source, provider, id }`
- ملفات تعريف وضع OAuth لا تدعم بيانات اعتماد SecretRef؛ إذا ضُبط `auth.profiles.<id>.mode` على `"oauth"`، فسيُرفض إدخال `keyRef`/`tokenRef` المدعوم بـSecretRef لذلك الملف التعريفي.

فحص ملائم للأتمتة (الخروج بالرمز `1` عند الانتهاء/الفقدان، و`2` عند اقتراب الانتهاء):

```bash
openclaw models status --check
```

اختبارات المصادقة الحية:

```bash
openclaw models status --probe
```

ملاحظات:

- يمكن أن تأتي صفوف الاختبار من ملفات تعريف المصادقة، أو بيانات اعتماد البيئة، أو `models.json`.
- إذا أغفل `auth.order.<provider>` الصريح ملفًا تعريفيًا مخزنًا، فسيعرض الاختبار
  `excluded_by_auth_order` لذلك الملف بدلًا من تجربته.
- إذا كانت المصادقة موجودة لكن OpenClaw لا يستطيع حل مرشح نموذج قابل للاختبار
  لذلك الموفر، فسيعرض الاختبار `status: no_model`.
- يمكن أن تكون فترات تهدئة حدود المعدل مخصصة للنموذج. قد يظل ملف تعريفي قيد التهدئة لنموذج واحد
  قابلًا للاستخدام مع نموذج شقيق لدى الموفر نفسه.

توثّق سكربتات التشغيل الاختيارية (systemd/Termux) هنا:
[سكربتات مراقبة المصادقة](/ar/help/scripts#auth-monitoring-scripts)

## ملاحظة Anthropic

الواجهة الخلفية `claude-cli` من Anthropic مدعومة مرة أخرى.

- أخبرنا موظفو Anthropic بأن مسار تكامل OpenClaw هذا مسموح به مرة أخرى.
- لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان
  للتشغيلات المدعومة بـAnthropic ما لم تنشر Anthropic سياسة جديدة.
- تظل مفاتيح API من Anthropic الخيار الأكثر قابلية للتنبؤ لمضيفي Gateway
  طويلي العمر وللتحكم الصريح في الفوترة من جهة الخادم.

## فحص حالة مصادقة النموذج

```bash
openclaw models status
openclaw doctor
```

## سلوك تدوير مفاتيح API (Gateway)

يدعم بعض الموفرين إعادة محاولة الطلب باستخدام مفاتيح بديلة عندما تصطدم استدعاءة API
بحد معدل لدى الموفر.

- ترتيب الأولوية:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز واحد)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- يتضمن موفرو Google أيضًا `GOOGLE_API_KEY` كخيار احتياطي إضافي.
- تُزال التكرارات من قائمة المفاتيح نفسها قبل الاستخدام.
- يعيد OpenClaw المحاولة بالمفتاح التالي فقط لأخطاء حدود المعدل (على سبيل المثال
  `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent
requests`، `ThrottlingException`، `concurrency limit reached`، أو
  `workers_ai ... quota limit exceeded`).
- لا تُعاد محاولة الأخطاء غير المتعلقة بحدود المعدل بمفاتيح بديلة.
- إذا فشلت جميع المفاتيح، يُرجع الخطأ النهائي من آخر محاولة.

## التحكم في بيانات الاعتماد المستخدمة

### لكل جلسة (أمر محادثة)

استخدم `/model <alias-or-id>@<profileId>` لتثبيت بيانات اعتماد موفر محددة للجلسة الحالية (أمثلة على معرّفات الملفات التعريفية: `anthropic:default`، `anthropic:work`).

استخدم `/model` (أو `/model list`) لمنتقي موجز؛ واستخدم `/model status` للعرض الكامل (المرشحون + ملف تعريف المصادقة التالي، مع تفاصيل نقطة نهاية الموفر عند تكوينها).

### لكل وكيل (تجاوز CLI)

عيّن تجاوزًا صريحًا لترتيب ملفات تعريف المصادقة لوكيل (مخزّن في `auth-state.json` لذلك الوكيل):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

استخدم `--agent <id>` لاستهداف وكيل محدد؛ واحذفه لاستخدام الوكيل الافتراضي المكوّن.
عند تصحيح مشكلات الترتيب، يعرض `openclaw models status --probe` الملفات التعريفية
المخزنة المحذوفة كـ`excluded_by_auth_order` بدلًا من تخطيها بصمت.
عند تصحيح مشكلات التهدئة، تذكّر أن فترات تهدئة حدود المعدل يمكن أن تكون مرتبطة
بمعرّف نموذج واحد بدلًا من ملف تعريف الموفر بالكامل.

## استكشاف الأخطاء وإصلاحها

### "لم يتم العثور على بيانات اعتماد"

إذا كان ملف تعريف Anthropic مفقودًا، فكوّن مفتاح API من Anthropic على
**مضيف Gateway** أو أعد إعداد مسار رمز إعداد Anthropic، ثم أعد الفحص:

```bash
openclaw models status
```

### الرمز يقترب من الانتهاء/منتهي

شغّل `openclaw models status` لتأكيد الملف التعريفي الذي يقترب من الانتهاء. إذا كان
ملف تعريف رمز Anthropic مفقودًا أو منتهيًا، فحدّث ذلك الإعداد عبر
رمز الإعداد أو انتقل إلى مفتاح API من Anthropic.

## ذات صلة

- [إدارة الأسرار](/ar/gateway/secrets)
- [الوصول البعيد](/ar/gateway/remote)
- [تخزين المصادقة](/ar/concepts/oauth)
