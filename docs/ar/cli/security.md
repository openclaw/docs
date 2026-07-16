---
read_when:
    - تريد إجراء تدقيق أمني سريع على الإعدادات/الحالة
    - تريد تطبيق اقتراحات «الإصلاح» الآمنة (الأذونات، وتشديد الإعدادات الافتراضية)
summary: مرجع CLI لـ `openclaw security` (تدقيق الأخطاء الأمنية الشائعة وإصلاحها)
title: الأمان
x-i18n:
    generated_at: "2026-07-16T13:39:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

أدوات الأمان: التدقيق مع إصلاحات آمنة اختيارية. ذو صلة: [الأمان](/ar/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## أوضاع التدقيق

يبقى `security audit` العادي ضمن مسار الإعدادات/نظام الملفات البارد والمخصص للقراءة فقط: فهو لا يكتشف مجمّعات أمان وقت تشغيل Plugin، ولذلك لا تحمّل عمليات التدقيق الروتينية وقت تشغيل كل Plugin مثبّت. يضيف `--deep` فحوصات مباشرة بأفضل جهد لـ Gateway ومجمّعات تدقيق الأمان التي تملكها Plugins (كما يمكن للجهات الداخلية المستدعية الصريحة الاشتراك في تلك المجمّعات عندما يكون لديها بالفعل نطاق وقت تشغيل مناسب).

إذا لم تُوفَّر مصادقة كلمة مرور Gateway إلا عند بدء التشغيل، فمرّر القيمة نفسها باستخدام `--auth password --password <password>` كي يتمكن التدقيق من فحصها مقابل `hooks.token`.

## ما الذي يفحصه

**نموذج الرسائل المباشرة/الثقة**

- يحذّر عندما يتشارك عدة مرسلين للرسائل المباشرة الجلسة الرئيسية، ويوصي بوضع الرسائل المباشرة الآمن: `session.dmScope="per-channel-peer"` (أو `per-account-channel-peer` للقنوات متعددة الحسابات) لصناديق الوارد المشتركة. هذا تعزيز أمان تعاوني/لصندوق وارد مشترك، وليس عزلاً للمشغّلين الذين لا يثق بعضهم ببعض؛ افصل حدود الثقة باستخدام بوابات منفصلة (أو مستخدمي نظام تشغيل/مضيفين منفصلين) لهذا الغرض.
- يصدر `security.trust_model.multi_user_heuristic` عندما تشير الإعدادات إلى احتمال وجود دخول من مستخدمين مشتركين (مثل سياسة مفتوحة للرسائل المباشرة/المجموعات، أو أهداف مجموعات مضبوطة، أو قواعد مرسلين بأحرف بدل) — نموذج الثقة الافتراضي في OpenClaw هو المساعد الشخصي (مشغّل واحد)، وليس عزلاً عدائياً متعدد المستأجرين. في الإعدادات المقصودة للمستخدمين المشتركين: اعزل جميع الجلسات، واقصر الوصول إلى نظام الملفات على نطاق مساحة العمل، وأبقِ الهويات أو بيانات الاعتماد الشخصية/الخاصة خارج وقت التشغيل ذاك.
- يحذّر عند استخدام نماذج صغيرة (`<=300B` من المعلمات) دون عزل مع تمكين أدوات الويب/المتصفح.

**Webhook/الخطافات**

يسجّل بدء التشغيل تحذيراً أمنياً غير فادح، ويشير التدقيق إلى إعادة استخدام `hooks.token` لقيم مصادقة السر المشترك النشطة في Gateway ‏(`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`، و`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). ويحذّر أيضاً عندما:

- يكون `hooks.token` قصيراً
- `hooks.path="/"`
- تكون قيمة `hooks.defaultSessionKey` غير مضبوطة
- تكون قيمة `hooks.allowedAgentIds` غير مقيّدة
- تكون تجاوزات `sessionKey` الخاصة بالطلب مفعّلة
- تكون التجاوزات مفعّلة دون `hooks.allowedSessionKeyPrefixes`

شغّل `openclaw doctor --fix` لتدوير `hooks.token` دائم أُعيد استخدامه، ثم حدّث مرسلي الخطافات الخارجيين لاستخدام الرمز المميز الجديد.

**العزل/الأدوات**

- يحذّر عند ضبط إعدادات Docker الخاصة بالعزل بينما يكون وضع العزل متوقفاً.
- يحذّر عندما يستخدم `gateway.nodes.denyCommands` إدخالات غير فعالة تشبه الأنماط/غير معروفة (المطابقة تكون لاسم أمر Node بدقة فقط، وليست تصفية لنص الصدفة).
- يحذّر عندما يمكّن `gateway.nodes.allowCommands` أوامر Node خطرة صراحةً.
- يحذّر عندما تتجاوز ملفات تعريف أدوات الوكيل قيمة `tools.profile="minimal"` العامة.
- يحذّر عندما تكون أدوات الكتابة/التحرير معطّلة، لكن `exec` لا يزال متاحاً دون حدود مقيّدة لنظام ملفات العزل.
- يحذّر عندما تكشف الرسائل المباشرة أو المجموعات المفتوحة أدوات وقت التشغيل/نظام الملفات دون وسائل حماية للعزل/مساحة العمل.
- يحذّر عندما يمكن الوصول إلى أدوات Plugins المثبّتة بموجب سياسة أدوات متساهلة.

**متصفح العزل**

- يحذّر عندما يستخدم متصفح العزل شبكة Docker ‏`bridge` دون `sandbox.browser.cdpSourceRange`.
- يشير إلى أوضاع شبكة Docker الخطرة للعزل، بما فيها عمليات الانضمام إلى نطاقَي الأسماء `host` و`container:*`.
- يحذّر عندما تكون حاويات Docker الحالية لمتصفح العزل بلا تسميات تجزئة أو ذات تسميات قديمة (مثل حاويات ما قبل الترحيل التي تفتقد `openclaw.browserConfigEpoch`) ويوصي باستخدام `openclaw sandbox recreate --browser --all`.

**الشبكة/الاكتشاف**

- يشير إلى `gateway.allowRealIpFallback=true` (خطر انتحال الترويسات إذا أسيء ضبط الوكلاء).
- يشير إلى `discovery.mdns.mode="full"` (تسرّب البيانات الوصفية عبر سجلات mDNS TXT).
- يحذّر عندما يترك `gateway.auth.mode="none"` واجهات HTTP API الخاصة بـ Gateway قابلة للوصول دون سر مشترك (`/tools/invoke` بالإضافة إلى أي نقطة نهاية `/v1/*` مفعّلة).

**Plugins/القنوات**

- يحذّر عندما تكون سجلات تثبيت Plugins/الخطافات المستندة إلى npm غير مثبّتة على إصدار محدد، أو تفتقد بيانات تعريف التكامل، أو تنحرف عن إصدارات الحزم المثبّتة حالياً.
- يحذّر عندما تعتمد قوائم السماح للقنوات على أسماء/عناوين بريد إلكتروني/وسوم قابلة للتغيير بدلاً من معرّفات ثابتة (ضمن نطاقات Discord وSlack وGoogle Chat وMicrosoft Teams وMattermost وIRC حيثما ينطبق).

الإعدادات التي تبدأ بـ `dangerous`/`dangerously` هي تجاوزات صريحة للمشغّل للاستخدام في حالات الطوارئ؛ ولا يُعد تمكين أحدها، بحد ذاته، تقريراً عن ثغرة أمنية. للاطلاع على القائمة الكاملة للمعلمات الخطرة، راجع «ملخص العلامات غير الآمنة أو الخطرة» في [الأمان](/ar/gateway/security).

## سلوك SecretRef

يحل `security audit` مراجع SecretRef المدعومة في وضع القراءة فقط للمسارات المستهدفة. إذا لم يتوفر SecretRef في مسار الأمر الحالي، يتابع التدقيق ويبلغ عن `secretDiagnostics` بدلاً من التعطل. لا يتجاوز `--token` و`--password` إلا مصادقة الفحص العميق لاستدعاء الأمر ذاك؛ ولا يعيدان كتابة الإعدادات أو تعيينات SecretRef.

## عمليات الكبت

اقبل النتائج الدائمة المقصودة باستخدام `security.audit.suppressions`. تطابق كل عملية كبت قيمة `checkId` بدقة، ويمكن تضييقها باستخدام السلاسل الفرعية `titleIncludes` و/أو `detailIncludes` غير الحساسة لحالة الأحرف:

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

تُزال النتائج المكبوتة من قائمتي `summary` و`findings` النشطتين. يحتفظ إخراج JSON بها ضمن `suppressedFindings` لأغراض قابلية التدقيق. عند ضبط عمليات الكبت، يحتفظ الإخراج النشط أيضاً بنتيجة معلومات `security.audit.suppressions.active` غير قابلة للكبت حتى يتمكن القراء من معرفة أن التدقيق قد جرت تصفيته. تُصدر علامات الإعدادات الخطرة بواقع علامة واحدة لكل نتيجة، لذا فإن قبول علامة خطرة واحدة لا يخفي العلامات المفعّلة الأخرى التي تشترك في checkId ‏`config.insecure_or_dangerous_flags` نفسه.

نظراً إلى أن عمليات الكبت قد تخفي مخاطر دائمة، تتطلب إضافتها أو إزالتها عبر أوامر الصدفة التي يشغّلها الوكيل موافقة exec، ما لم يكن exec يعمل بالفعل باستخدام `security="full"` و`ask="off"` للأتمتة المحلية الموثوقة.

## إخراج JSON

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

مع `--fix --json`، يتضمن الإخراج إجراءات الإصلاح والتقرير النهائي معاً:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## ما الذي يغيّره `--fix`

يطبّق معالجات آمنة وحتمية:

- يحوّل قيم `groupPolicy="open"` الشائعة إلى `groupPolicy="allowlist"` (بما في ذلك متغيرات الحسابات في القنوات المدعومة)
- عندما تتحول سياسة مجموعات WhatsApp إلى `allowlist`، يملأ `groupAllowFrom` من ملف `allowFrom` المخزّن عندما تكون تلك القائمة موجودة ولا تعرّف الإعدادات `allowFrom` بالفعل
- يضبط `logging.redactSensitive` من `"off"` إلى `"tools"`
- يشدّد أذونات الحالة/الإعدادات والملفات الحساسة الشائعة (`credentials/*.json` و`auth-profiles.json` و`openclaw-agent.sqlite` وآثار الجلسات القديمة)
- يشدّد أيضاً أذونات ملفات تضمين الإعدادات المشار إليها من `openclaw.json`
- يستخدم `chmod` على مضيفي POSIX وعمليات إعادة ضبط `icacls` على Windows

لا يقوم `--fix` بما يلي:

- تدوير الرموز المميزة/كلمات المرور/مفاتيح API
- تعطيل الأدوات (`gateway` و`cron` و`exec` وغيرها)
- تغيير خيارات ربط Gateway أو مصادقته أو تعريضه للشبكة
- إزالة Plugins/Skills أو إعادة كتابتها

## ذو صلة

- [مرجع CLI](/ar/cli)
- [تدقيق الأمان](/ar/gateway/security)
