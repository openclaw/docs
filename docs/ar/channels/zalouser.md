---
read_when:
    - إعداد Zalo الشخصي لـ OpenClaw
    - تصحيح تسجيل الدخول أو تدفق الرسائل في Zalo الشخصي
summary: دعم حساب Zalo الشخصي عبر zca-js الأصلي (تسجيل الدخول عبر QR)، والإمكانات، والتكوين
title: Zalo الشخصي
x-i18n:
    generated_at: "2026-04-24T07:32:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo الشخصي (غير رسمي)

الحالة: تجريبي. يقوم هذا التكامل بأتمتة **حساب Zalo شخصي** عبر `zca-js` الأصلي داخل OpenClaw.

> **تحذير:** هذا تكامل غير رسمي وقد يؤدي إلى تعليق الحساب/حظره. استخدمه على مسؤوليتك الخاصة.

## Plugin المضمّن

يأتي Zalo الشخصي كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج البنيات
المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Zalo الشخصي،
فقم بتثبيته يدويًا:

- التثبيت عبر CLI: `openclaw plugins install @openclaw/zalouser`
- أو من نسخة مصدر محلية: `openclaw plugins install ./path/to/local/zalouser-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

لا حاجة إلى ملف CLI تنفيذي خارجي باسم `zca`/`openzca`.

## الإعداد السريع (للمبتدئين)

1. تأكد من أن Plugin ‏Zalo الشخصي متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للإصدارات الأقدم/التثبيتات المخصصة إضافته يدويًا بالأوامر أعلاه.
2. سجّل الدخول (QR، على جهاز Gateway):
   - `openclaw channels login --channel zalouser`
   - امسح رمز QR باستخدام تطبيق Zalo على الهاتف المحمول.
3. فعّل القناة:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. أعد تشغيل Gateway (أو أكمل الإعداد).
5. يكون الوصول إلى الرسائل الخاصة مضبوطًا افتراضيًا على الاقتران؛ وافق على رمز الاقتران عند أول تواصل.

## ما هو

- يعمل بالكامل داخل العملية عبر `zca-js`.
- يستخدم مستمعي أحداث أصليين لتلقي الرسائل الواردة.
- يرسل الردود مباشرة عبر JavaScript API (نص/وسائط/رابط).
- مصمم لحالات استخدام “الحساب الشخصي” حيث لا تكون Zalo Bot API متاحة.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يقوم بأتمتة **حساب مستخدم Zalo شخصي** (غير رسمي). نحتفظ بالاسم `zalo` لتكامل رسمي محتمل مع Zalo API في المستقبل.

## العثور على المعرّفات (الدليل)

استخدم CLI الخاص بالدليل لاكتشاف النظراء/المجموعات ومعرّفاتهم:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## الحدود

- يتم تقسيم النص الصادر إلى أجزاء بحجم ~2000 حرف تقريبًا (قيود عميل Zalo).
- يكون البث معطّلًا افتراضيًا.

## التحكم في الوصول (الرسائل الخاصة)

يدعم `channels.zalouser.dmPolicy` القيم: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).

يقبل `channels.zalouser.allowFrom` معرّفات المستخدمين أو الأسماء. أثناء الإعداد، يتم تحليل الأسماء إلى معرّفات باستخدام بحث جهات الاتصال داخل العملية الخاص بالـ Plugin.

الموافقة عبر:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## الوصول إلى المجموعات (اختياري)

- الافتراضي: `channels.zalouser.groupPolicy = "open"` (المجموعات مسموح بها). استخدم `channels.defaults.groupPolicy` لتجاوز القيمة الافتراضية عند عدم ضبطها.
- للتقييد إلى قائمة سماح:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (يجب أن تكون المفاتيح معرّفات مجموعات ثابتة؛ وتُحلَّل الأسماء إلى معرّفات عند بدء التشغيل متى أمكن)
  - `channels.zalouser.groupAllowFrom` (يتحكم في المرسلين داخل المجموعات المسموح بها الذين يمكنهم تفعيل البوت)
- لحظر كل المجموعات: `channels.zalouser.groupPolicy = "disabled"`.
- يمكن لمعالج التكوين أن يطلب قوائم سماح للمجموعات.
- عند بدء التشغيل، يحلل OpenClaw أسماء المجموعات/المستخدمين في قوائم السماح إلى معرّفات ويسجل الربط.
- تكون مطابقة قائمة سماح المجموعات بحسب المعرّف فقط افتراضيًا. يتم تجاهل الأسماء غير المحللة في المصادقة ما لم يتم تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` هو وضع توافق طارئ يعيد تفعيل مطابقة أسماء المجموعات القابلة للتغيير.
- إذا لم يتم ضبط `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` لفحوصات مرسلي المجموعات.
- تنطبق فحوصات المرسل على كل من رسائل المجموعات العادية وأوامر التحكم (على سبيل المثال `/new` و`/reset`).

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### تقييد الإشارات في المجموعات

- يتحكم `channels.zalouser.groups.<group>.requireMention` في ما إذا كانت الردود في المجموعات تتطلب إشارة.
- ترتيب التحليل: معرّف/اسم المجموعة المطابق تمامًا -> slug المجموعة المُطبَّع -> `*` -> الافتراضي (`true`).
- ينطبق ذلك على كل من المجموعات الموجودة في قائمة السماح ووضع المجموعات المفتوحة.
- يُحتسب الاقتباس من رسالة البوت على أنه إشارة ضمنية لتفعيل المجموعة.
- يمكن لأوامر التحكم المصرح بها (على سبيل المثال `/new`) تجاوز تقييد الإشارات.
- عندما يتم تخطي رسالة مجموعة بسبب اشتراط الإشارة، يخزنها OpenClaw كسجل مجموعة معلّق ويضمّنها في رسالة المجموعة التالية التي تتم معالجتها.
- يكون الحد الافتراضي لسجل المجموعات هو `messages.groupChat.historyLimit` (والبديل `50`). يمكنك تجاوزه لكل حساب عبر `channels.zalouser.historyLimit`.

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## حسابات متعددة

ترتبط الحسابات بملفات تعريف `zalouser` في حالة OpenClaw. مثال:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## الكتابة، والتفاعلات، وإشعارات تأكيد التسليم

- يرسل OpenClaw حدث كتابة قبل إرسال الرد (على أساس أفضل جهد).
- إجراء تفاعل الرسائل `react` مدعوم لـ `zalouser` ضمن إجراءات القناة.
  - استخدم `remove: true` لإزالة emoji تفاعل محدد من رسالة.
  - دلالات التفاعلات: [التفاعلات](/ar/tools/reactions)
- بالنسبة إلى الرسائل الواردة التي تتضمن بيانات وصفية للأحداث، يرسل OpenClaw إشعارات تسليم + مشاهدة (على أساس أفضل جهد).

## استكشاف الأخطاء وإصلاحها

**تسجيل الدخول لا يستمر:**

- `openclaw channels status --probe`
- أعد تسجيل الدخول: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**لم يتم تحليل اسم قائمة السماح/المجموعة:**

- استخدم المعرّفات الرقمية في `allowFrom`/`groupAllowFrom`/`groups`، أو أسماء الأصدقاء/المجموعات المطابقة تمامًا.

**تمت الترقية من إعداد قديم قائم على CLI:**

- أزل أي افتراضات قديمة حول عملية `zca` خارجية.
- تعمل القناة الآن بالكامل داخل OpenClaw من دون ملفات CLI تنفيذية خارجية.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
