---
read_when:
    - تريد إجراء تدقيق أمني سريع على التكوين/الحالة
    - تريد تطبيق اقتراحات "الإصلاح" الآمنة (الأذونات، تشديد الإعدادات الافتراضية)
summary: مرجع CLI لـ `openclaw security` (تدقيق وإصلاح الثغرات الأمنية الشائعة الناتجة عن سوء الإعداد)
title: الأمان
x-i18n:
    generated_at: "2026-06-27T17:24:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

أدوات الأمان (تدقيق + إصلاحات اختيارية).

ذات صلة:

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

يبقى الأمر العادي `security audit` على مسار الإعدادات/نظام الملفات/للقراءة فقط البارد. ولا يكتشف مجمّعات أمان وقت تشغيل الـ Plugin افتراضيًا، لذلك لا تحمّل عمليات التدقيق الروتينية كل وقت تشغيل Plugin مثبّت. استخدم `--deep` لتضمين مجسّات Gateway الحية بأفضل جهد ومجمّعات تدقيق الأمان المملوكة للـ Plugin؛ ويمكن للمتصلين الداخليين الصريحين أيضًا اختيار تلك المجمّعات المملوكة للـ Plugin عندما يكون لديهم بالفعل نطاق وقت تشغيل مناسب.

يحذّر التدقيق عندما يتشارك عدة مرسلين في الرسائل الخاصة الجلسة الرئيسية ويوصي بـ **وضع الرسائل الخاصة الآمن**: `session.dmScope="per-channel-peer"` (أو `per-account-channel-peer` للقنوات متعددة الحسابات) لصناديق الوارد المشتركة.
هذا مخصص لتقوية صناديق الوارد التعاونية/المشتركة. لا يُنصح بإعداد Gateway واحد مشترك بين مشغّلين غير موثوقين/خصوم متبادلين؛ افصل حدود الثقة عبر Gateways منفصلة (أو مستخدمي/مضيفي نظام تشغيل منفصلين).
كما يصدر `security.trust_model.multi_user_heuristic` عندما تشير الإعدادات إلى احتمال ورود مستخدمين مشتركين (على سبيل المثال سياسة رسائل خاصة/مجموعات مفتوحة، أو أهداف مجموعات مكوّنة، أو قواعد مرسلين ذات أحرف بدل)، ويذكّرك بأن OpenClaw يستخدم نموذج ثقة مساعد شخصي افتراضيًا.
بالنسبة إلى إعدادات المستخدمين المشتركين المقصودة، توصي إرشادات التدقيق بعزل كل الجلسات في sandbox، وإبقاء الوصول إلى نظام الملفات محدودًا بنطاق مساحة العمل، وإبعاد الهويات أو بيانات الاعتماد الشخصية/الخاصة عن وقت التشغيل هذا.
كما يحذّر عندما تُستخدم النماذج الصغيرة (`<=300B`) من دون عزل sandbox ومع تمكين أدوات الويب/المتصفح.
بالنسبة إلى ورود Webhook، تسجل عملية بدء التشغيل تحذيرًا أمنيًا غير قاتل، ويعلّم التدقيق إعادة استخدام `hooks.token` لقيم مصادقة السرّ المشترك النشطة في Gateway، بما في ذلك `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` و `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. كما يحذّر عندما:

- يكون `hooks.token` قصيرًا
- يكون `hooks.path="/"`
- لا يكون `hooks.defaultSessionKey` معيّنًا
- يكون `hooks.allowedAgentIds` غير مقيّد
- تكون تجاوزات `sessionKey` في الطلبات مفعّلة
- تكون التجاوزات مفعّلة من دون `hooks.allowedSessionKeyPrefixes`

إذا كانت مصادقة كلمة مرور Gateway مقدمة عند بدء التشغيل فقط، فمرّر القيمة نفسها إلى `openclaw security audit --auth password --password <password>` حتى يتمكن التدقيق من فحصها مقابل `hooks.token`.
شغّل `openclaw doctor --fix` لتدوير `hooks.token` مستمر مُعاد استخدامه، ثم حدّث مرسلي الخطافات الخارجيين لاستخدام رمز الخطاف الجديد.

كما يحذّر عندما تكون إعدادات Docker الخاصة بالـ sandbox مكوّنة بينما يكون وضع sandbox متوقفًا، وعندما يستخدم `gateway.nodes.denyCommands` إدخالات غير فعالة تشبه الأنماط/مجهولة (مطابقة اسم أمر العقدة بدقة فقط، وليس ترشيح نص الصدفة)، وعندما يفعّل `gateway.nodes.allowCommands` أوامر عقدة خطرة صراحةً، وعندما تتجاوز ملفات تعريف أدوات الوكيل `tools.profile="minimal"` العالمية، وعندما تكون أدوات الكتابة/التحرير معطلة لكن `exec` لا يزال متاحًا من دون حد عزل مقيّد لنظام ملفات sandbox، وعندما تكشف الرسائل الخاصة أو المجموعات المفتوحة أدوات وقت التشغيل/نظام الملفات من دون حراس sandbox/مساحة العمل، وعندما قد تكون أدوات Plugin المثبتة قابلة للوصول ضمن سياسة أدوات متساهلة.
كما يعلّم `gateway.allowRealIpFallback=true` (خطر انتحال الرؤوس إذا أسيء تكوين الوسطاء) و `discovery.mdns.mode="full"` (تسرب بيانات وصفية عبر سجلات mDNS TXT).
كما يحذّر عندما يستخدم متصفح sandbox شبكة Docker `bridge` من دون `sandbox.browser.cdpSourceRange`.
كما يعلّم أوضاع شبكة Docker خطرة في sandbox (بما في ذلك `host` وضمّ مساحات أسماء `container:*`).
كما يحذّر عندما تكون حاويات Docker الحالية لمتصفح sandbox ذات تسميات تجزئة مفقودة/قديمة (على سبيل المثال حاويات ما قبل الترحيل التي تفتقد `openclaw.browserConfigEpoch`) ويوصي بـ `openclaw sandbox recreate --browser --all`.
كما يحذّر عندما تكون سجلات تثبيت Plugin/خطاف المستندة إلى npm غير مثبّتة بإصدار، أو تفتقد بيانات سلامة، أو تنحرف عن إصدارات الحزم المثبتة حاليًا.
يحذّر عندما تعتمد قوائم السماح للقنوات على أسماء/بريد إلكتروني/وسوم قابلة للتغيير بدلًا من المعرّفات المستقرة (Discord وSlack وGoogle Chat وMicrosoft Teams وMattermost ونطاقات IRC حيثما ينطبق ذلك).
يحذّر عندما يترك `gateway.auth.mode="none"` واجهات HTTP API الخاصة بـ Gateway قابلة للوصول من دون سر مشترك (`/tools/invoke` بالإضافة إلى أي نقطة نهاية `/v1/*` مفعّلة).
الإعدادات المسبوقة بـ `dangerous`/`dangerously` هي تجاوزات مشغّل صريحة لكسر الزجاج؛ وتمكين أحدها ليس، بحد ذاته، تقرير ثغرة أمنية.
للحصول على قائمة معلمات الخطر الكاملة، راجع قسم "ملخص الأعلام غير الآمنة أو الخطرة" في [الأمان](/ar/gateway/security).

يمكن قبول النتائج الدائمة المقصودة باستخدام `security.audit.suppressions`.
يطابق كل كبت `checkId` دقيقًا ويمكن تضييقه باستخدام
السلاسل الفرعية غير الحساسة لحالة الأحرف `titleIncludes` و/أو `detailIncludes`:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

تُزال النتائج المكبوتة من `summary` النشط وقائمة `findings`.
يبقي خرج JSON هذه النتائج ضمن `suppressedFindings` لقابلية التدقيق.
عند تكوين الكبت، يبقي الخرج النشط أيضًا نتيجة معلومات غير قابلة للكبت
`security.audit.suppressions.active` حتى يستطيع القراء معرفة أن التدقيق
تمت تصفيته. تُصدر أعلام الإعدادات الخطرة علمًا واحدًا لكل نتيجة، لذلك
لا يؤدي قبول علم خطر واحد إلى إخفاء الأعلام المفعّلة الأخرى التي تشارك
`checkId` نفسه `config.insecure_or_dangerous_flags`.
لأن الكبت يمكن أن يخفي خطرًا قائمًا، فإن إضافة الكبت أو إزالته عبر
أوامر صدفة يشغّلها الوكيل تتطلب موافقة exec ما لم يكن exec يعمل بالفعل
بـ `security="full"` و `ask="off"` للأتمتة المحلية الموثوقة.

سلوك SecretRef:

- يحل `security audit` مراجع SecretRef المدعومة في وضع القراءة فقط للمسارات المستهدفة.
- إذا كان SecretRef غير متاح في مسار الأمر الحالي، يواصل التدقيق ويبلغ عن `secretDiagnostics` (بدلًا من التعطل).
- لا تتجاوز `--token` و `--password` إلا مصادقة المجسّ العميق لاستدعاء الأمر ذلك؛ ولا تعيدان كتابة الإعدادات أو تعيينات SecretRef.

## خرج JSON

استخدم `--json` لفحوصات CI/السياسة:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

إذا جُمِع `--fix` و `--json`، يتضمن الخرج إجراءات الإصلاح والتقرير النهائي معًا:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## ما الذي يغيّره `--fix`

يطبّق `--fix` إصلاحات آمنة وحتمية:

- يبدّل `groupPolicy="open"` الشائع إلى `groupPolicy="allowlist"` (بما في ذلك متغيرات الحساب في القنوات المدعومة)
- عندما تتحول سياسة مجموعات WhatsApp إلى `allowlist`، يملأ `groupAllowFrom` من
  ملف `allowFrom` المخزّن عندما تكون تلك القائمة موجودة ولا تكون الإعدادات قد
  عرّفت `allowFrom` بالفعل
- يعيّن `logging.redactSensitive` من `"off"` إلى `"tools"`
- يشدّد الأذونات لملفات الحالة/الإعدادات والملفات الحساسة الشائعة
  (`credentials/*.json` و `auth-profiles.json` و `sessions.json` وجلسات
  `*.jsonl`)
- يشدّد أيضًا ملفات تضمين الإعدادات المشار إليها من `openclaw.json`
- يستخدم `chmod` على مضيفي POSIX وإعادات ضبط `icacls` على Windows

لا يقوم `--fix` بـ:

- تدوير الرموز/كلمات المرور/مفاتيح API
- تعطيل الأدوات (`gateway` و `cron` و `exec` وما إلى ذلك)
- تغيير اختيارات ربط/مصادقة/تعريض الشبكة الخاصة بالـ Gateway
- إزالة أو إعادة كتابة Plugins/Skills

## ذات صلة

- [مرجع CLI](/ar/cli)
- [تدقيق الأمان](/ar/gateway/security)
