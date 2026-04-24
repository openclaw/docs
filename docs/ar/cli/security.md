---
read_when:
    - تريد إجراء تدقيق أمني سريع على الإعدادات/الحالة
    - تريد تطبيق اقتراحات "fix" الآمنة (الأذونات، وتشديد الإعدادات الافتراضية)
summary: مرجع CLI لـ `openclaw security` (تدقيق وإصلاح الثغرات الأمنية الشائعة)
title: الأمان
x-i18n:
    generated_at: "2026-04-24T07:36:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

أدوات الأمان (التدقيق + الإصلاحات الاختيارية).

ذو صلة:

- دليل الأمان: [الأمان](/ar/gateway/security)

## التدقيق

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

يحذر التدقيق عندما يشترك عدة مرسلين للرسائل الخاصة في الجلسة الرئيسية ويوصي بـ **وضع الرسائل الخاصة الآمن**: `session.dmScope="per-channel-peer"` (أو `per-account-channel-peer` للقنوات متعددة الحسابات) لصناديق الوارد المشتركة.
وهذا مخصص لتقوية صناديق الوارد التعاونية/المشتركة. ولا يُعد استخدام Gateway واحدة مشتركة بين مشغلين لا يثق بعضهم ببعض أو يتصرفون بعدائية إعدادًا موصى به؛ افصل حدود الثقة باستخدام Gateways منفصلة (أو مستخدمي نظام تشغيل/مضيفين منفصلين).
كما يصدر `security.trust_model.multi_user_heuristic` عندما توحي الإعدادات بوجود دخول مرجح لمستخدمين مشتركين (على سبيل المثال سياسة DM/group المفتوحة، أو أهداف مجموعات مضبوطة، أو قواعد مرسلين عامة)، ويذكرك بأن نموذج الثقة الافتراضي في OpenClaw هو نموذج المساعد الشخصي.
وبالنسبة إلى الإعدادات المقصودة متعددة المستخدمين، فإن إرشادات التدقيق توصي بعزل جميع الجلسات، والإبقاء على وصول نظام الملفات محصورًا في مساحة العمل، وإبعاد الهويات أو بيانات الاعتماد الشخصية/الخاصة عن ذلك وقت التشغيل.
كما يحذر عند استخدام نماذج صغيرة (`<=300B`) من دون عزل ومع تمكين أدوات الويب/المتصفح.
وبالنسبة إلى دخول Webhook، فإنه يحذر عندما يعيد `hooks.token` استخدام رمز Gateway، أو عندما تكون `hooks.token` قصيرة، أو عندما تكون `hooks.path="/"`، أو عندما تكون `hooks.defaultSessionKey` غير مضبوطة، أو عندما تكون `hooks.allowedAgentIds` غير مقيّدة، أو عندما تكون تجاوزات `sessionKey` في الطلبات مفعلة، أو عندما تكون التجاوزات مفعلة من دون `hooks.allowedSessionKeyPrefixes`.
كما يحذر عندما تكون إعدادات sandbox Docker مضبوطة بينما يكون وضع sandbox معطلًا، وعندما تستخدم `gateway.nodes.denyCommands` إدخالات غير فعالة تشبه الأنماط/غير معروفة (تتم فقط مطابقة أسماء أوامر Node الدقيقة، وليس تصفية نص shell)، وعندما تمكّن `gateway.nodes.allowCommands` صراحةً أوامر Node خطيرة، وعندما يتم تجاوز القيمة العامة `tools.profile="minimal"` عبر ملفات تعريف أدوات الوكيل، وعندما تكشف المجموعات المفتوحة أدوات وقت التشغيل/نظام الملفات من دون حواجز sandbox/workspace، وعندما قد تكون أدوات Plugin المثبتة قابلة للوصول تحت سياسة أدوات متساهلة.
كما يميز `gateway.allowRealIpFallback=true` (خطر انتحال الرؤوس إذا أُسيء ضبط proxies) و`discovery.mdns.mode="full"` (تسرب البيانات الوصفية عبر سجلات mDNS TXT).
كما يحذر عندما يستخدم متصفح sandbox شبكة Docker ‏`bridge` من دون `sandbox.browser.cdpSourceRange`.
كما يميز أوضاع شبكة Docker الخطيرة في sandbox (بما في ذلك `host` وعمليات الانضمام إلى مساحة الأسماء `container:*`).
كما يحذر عندما تحتوي حاويات Docker الحالية الخاصة بمتصفح sandbox على تسميات hash مفقودة/قديمة (على سبيل المثال الحاويات السابقة للترحيل التي تفتقد `openclaw.browserConfigEpoch`) ويوصي بـ `openclaw sandbox recreate --browser --all`.
كما يحذر عندما تكون سجلات تثبيت Plugin/hook المعتمدة على npm غير مثبتة بالإصدار، أو تفتقد بيانات integrity الوصفية، أو تنحرف عن إصدارات الحزم المثبتة حاليًا.
ويحذر عندما تعتمد قوائم السماح الخاصة بالقنوات على أسماء/بريد إلكتروني/وسوم قابلة للتغير بدلًا من معرّفات ثابتة (Discord وSlack وGoogle Chat وMicrosoft Teams وMattermost ونطاقات IRC حيثما ينطبق).
ويحذر عندما تترك `gateway.auth.mode="none"` واجهات HTTP API الخاصة بـ Gateway قابلة للوصول من دون سر مشترك (`/tools/invoke` بالإضافة إلى أي نقطة نهاية `/v1/*` مفعلة).
أما الإعدادات التي تبدأ بـ `dangerous`/`dangerously` فهي تجاوزات صريحة لكسر الزجاج من قبل المشغل؛ وتمكين أحدها لا يُعد، بحد ذاته، تقرير ثغرة أمنية.
للحصول على الجرد الكامل للمعلمات الخطرة، راجع قسم "ملخص العلامات غير الآمنة أو الخطرة" في [الأمان](/ar/gateway/security).

سلوك SecretRef:

- يقوم `security audit` بحل SecretRefs المدعومة في وضع القراءة فقط لمساراته المستهدفة.
- إذا كانت SecretRef غير متاحة في مسار الأمر الحالي، يستمر التدقيق ويبلغ عن `secretDiagnostics` (بدلًا من التعطل).
- لا يتجاوز `--token` و`--password` سوى مصادقة الفحص العميق لاستدعاء هذا الأمر؛ ولا يعيدان كتابة config أو تعيينات SecretRef.

## إخراج JSON

استخدم `--json` لفحوصات CI/policy:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

إذا تم الجمع بين `--fix` و`--json`، فسيتضمن الإخراج إجراءات الإصلاح والتقرير النهائي:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## ما الذي يغيّره `--fix`

يطبق `--fix` معالجات آمنة وحتمية:

- يبدّل القيم الشائعة `groupPolicy="open"` إلى `groupPolicy="allowlist"` (بما في ذلك متغيرات الحسابات في القنوات المدعومة)
- عندما تُبدّل سياسة مجموعات WhatsApp إلى `allowlist`، فإنه يملأ `groupAllowFrom` من
  ملف `allowFrom` المخزن عندما تكون تلك القائمة موجودة ولا يكون config قد عرّف
  `allowFrom` بالفعل
- يضبط `logging.redactSensitive` من `"off"` إلى `"tools"`
- يشدّد الأذونات على ملفات الحالة/config والملفات الحساسة الشائعة
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, وملفات الجلسات
  `*.jsonl`)
- كما يشدّد ملفات include الخاصة بالإعدادات المشار إليها من `openclaw.json`
- يستخدم `chmod` على مضيفات POSIX وعمليات إعادة ضبط `icacls` على Windows

لا يقوم `--fix` بما يلي:

- تدوير الرموز المميزة/كلمات المرور/مفاتيح API
- تعطيل الأدوات (`gateway`, `cron`, `exec`، إلخ)
- تغيير خيارات ربط/مصادقة/تعرض الشبكة الخاصة بـ gateway
- إزالة أو إعادة كتابة Plugins/Skills

## ذو صلة

- [مرجع CLI](/ar/cli)
- [تدقيق الأمان](/ar/gateway/security)
