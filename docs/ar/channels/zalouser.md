---
read_when:
    - إعداد Zalo Personal لـ OpenClaw
    - استكشاف أخطاء تسجيل الدخول إلى Zalo Personal أو تدفق الرسائل وإصلاحها
summary: دعم الحساب الشخصي في Zalo عبر zca-js الأصلية (تسجيل الدخول باستخدام QR)، والقدرات، والتكوين
title: Zalo الشخصي
x-i18n:
    generated_at: "2026-05-02T22:17:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

الحالة: تجريبية. يتيح هذا التكامل أتمتة **حساب Zalo شخصي** عبر `zca-js` الأصلي داخل OpenClaw.

<Warning>
هذا تكامل غير رسمي وقد يؤدي إلى تعليق الحساب أو حظره. استخدمه على مسؤوليتك الخاصة.
</Warning>

## Plugin مضمّن

يتوفر Zalo Personal بوصفه Plugin مضمّنًا في إصدارات OpenClaw الحالية، لذلك لا تحتاج البُنى
المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستثني Zalo Personal،
فثبّت حزمة npm مباشرة:

- التثبيت عبر CLI: `openclaw plugins install @openclaw/zalouser`
- إصدار مثبت: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- أو من نسخة مصدر محلية: `openclaw plugins install ./path/to/local/zalouser-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

لا يلزم وجود ملف CLI ثنائي خارجي لـ `zca`/`openzca`.

## الإعداد السريع (للمبتدئين)

1. تأكد من توفر Plugin Zalo Personal.
   - إصدارات OpenClaw المعبأة الحالية تضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. سجّل الدخول (QR، على جهاز Gateway):
   - `openclaw channels login --channel zalouser`
   - امسح رمز QR باستخدام تطبيق Zalo للجوّال.
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
5. يكون الوصول عبر الرسائل المباشرة مضبوطًا افتراضيًا على الاقتران؛ وافق على رمز الاقتران عند أول تواصل.

## ما هو

- يعمل بالكامل داخل العملية عبر `zca-js`.
- يستخدم مستمعي أحداث أصليين لتلقي الرسائل الواردة.
- يرسل الردود مباشرة عبر JS API (نص/وسائط/رابط).
- مصمم لحالات استخدام “الحساب الشخصي” عندما لا تكون Zalo Bot API متاحة.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصيًا** (غير رسمي). نُبقي `zalo` محجوزًا لتكامل رسمي محتمل مع Zalo API في المستقبل.

## العثور على المعرّفات (الدليل)

استخدم CLI الخاص بالدليل لاكتشاف النظراء/المجموعات ومعرّفاتهم:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## الحدود

- يُقسّم النص الصادر إلى أجزاء بحجم يقارب 2000 حرف (حدود عميل Zalo).
- يكون البث محظورًا افتراضيًا.

## التحكم في الوصول (الرسائل المباشرة)

يدعم `channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).

يقبل `channels.zalouser.allowFrom` معرّفات المستخدمين أو الأسماء. أثناء الإعداد، تُحل الأسماء إلى معرّفات باستخدام بحث جهات الاتصال داخل عملية Plugin.

اعتمد عبر:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## وصول المجموعات (اختياري)

- الافتراضي: `channels.zalouser.groupPolicy = "open"` (المجموعات مسموحة). استخدم `channels.defaults.groupPolicy` لتجاوز القيمة الافتراضية عندما تكون غير مضبوطة.
- قيّد الوصول إلى قائمة سماح باستخدام:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ينبغي أن تكون المفاتيح معرّفات مجموعات مستقرة؛ تُحل الأسماء إلى معرّفات عند بدء التشغيل عندما يكون ذلك ممكنًا)
  - `channels.zalouser.groupAllowFrom` (يتحكم في أي مرسلين داخل المجموعات المسموح بها يمكنهم تشغيل البوت)
- احظر كل المجموعات: `channels.zalouser.groupPolicy = "disabled"`.
- يمكن لمعالج التكوين طلب قوائم سماح للمجموعات.
- عند بدء التشغيل، يحل OpenClaw أسماء المجموعات/المستخدمين في قوائم السماح إلى معرّفات ويسجل الربط.
- تكون مطابقة قائمة سماح المجموعات معتمدة على المعرّف فقط افتراضيًا. تُتجاهل الأسماء غير المحلولة للمصادقة ما لم يتم تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` هو وضع توافق لكسر الحاجز يعيد تفعيل المطابقة القابلة للتغيير بأسماء المجموعات.
- إذا لم يكن `groupAllowFrom` مضبوطًا، يعود وقت التشغيل إلى `allowFrom` لفحوص مرسل المجموعة.
- تنطبق فحوص المرسل على رسائل المجموعة العادية وأوامر التحكم معًا (مثل `/new` و`/reset`).

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

### بوابة الإشارة في المجموعات

- يتحكم `channels.zalouser.groups.<group>.requireMention` فيما إذا كانت ردود المجموعة تتطلب إشارة.
- ترتيب الحل: معرّف/اسم المجموعة المطابق تمامًا -> اسم المجموعة المختصر المُطبّع -> `*` -> الافتراضي (`true`).
- ينطبق هذا على المجموعات المدرجة في قائمة السماح ووضع المجموعات المفتوح معًا.
- يُعد اقتباس رسالة بوت إشارة ضمنية لتفعيل المجموعة.
- يمكن لأوامر التحكم المصرح بها (مثل `/new`) تجاوز بوابة الإشارة.
- عندما تُتخطى رسالة مجموعة لأن الإشارة مطلوبة، يخزنها OpenClaw كسجل مجموعة معلّق ويضمّنها في رسالة المجموعة التالية التي تتم معالجتها.
- يكون حد سجل المجموعة افتراضيًا `messages.groupChat.historyLimit` (الاحتياطي `50`). يمكنك تجاوزه لكل حساب باستخدام `channels.zalouser.historyLimit`.

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

## تعدد الحسابات

تُربط الحسابات بملفات تعريف `zalouser` في حالة OpenClaw. مثال:

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

## الكتابة، والتفاعلات، وإقرارات التسليم

- يرسل OpenClaw حدث كتابة قبل إرسال الرد (وفق أفضل جهد).
- إجراء تفاعل الرسالة `react` مدعوم لـ `zalouser` في إجراءات القناة.
  - استخدم `remove: true` لإزالة رمز تعبيري محدد لتفاعل من رسالة.
  - دلالات التفاعل: [التفاعلات](/ar/tools/reactions)
- بالنسبة للرسائل الواردة التي تتضمن بيانات تعريف للأحداث، يرسل OpenClaw إقرارات تم التسليم + تمت المشاهدة (وفق أفضل جهد).

## استكشاف الأخطاء وإصلاحها

**تسجيل الدخول لا يثبت:**

- `openclaw channels status --probe`
- أعد تسجيل الدخول: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**لم يُحل اسم قائمة السماح/المجموعة:**

- استخدم المعرّفات الرقمية في `allowFrom`/`groupAllowFrom`/`groups`، أو أسماء الأصدقاء/المجموعات المطابقة تمامًا.

**تمت الترقية من إعداد قديم قائم على CLI:**

- أزِل أي افتراضات قديمة حول عملية `zca` خارجية.
- تعمل القناة الآن بالكامل داخل OpenClaw دون ملفات CLI ثنائية خارجية.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتحصين
