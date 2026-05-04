---
read_when:
    - إعداد Zalo Personal لـ OpenClaw
    - تصحيح أخطاء تسجيل الدخول أو تدفق الرسائل في Zalo Personal
summary: دعم حساب Zalo الشخصي عبر zca-js الأصلي (تسجيل الدخول برمز QR)، والإمكانات، والتكوين
title: Zalo الشخصي
x-i18n:
    generated_at: "2026-05-04T18:23:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

Status: تجريبي. يقوم هذا التكامل بأتمتة **حساب Zalo شخصي** عبر `zca-js` الأصلي داخل OpenClaw.

<Warning>
هذا تكامل غير رسمي وقد يؤدي إلى تعليق الحساب أو حظره. استخدمه على مسؤوليتك الخاصة.
</Warning>

## Plugin المضمّن

يتوفر Zalo Personal بوصفه Plugin مضمّنًا في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البُنى المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Zalo Personal،
فثبّت حزمة npm مباشرة:

- التثبيت عبر CLI: `openclaw plugins install @openclaw/zalouser`
- إصدار مثبّت: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- أو من نسخة مصدر محلية: `openclaw plugins install ./path/to/local/zalouser-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

لا يلزم وجود ملف CLI ثنائي خارجي لـ `zca`/`openzca`.

## إعداد سريع (للمبتدئين)

1. تأكد من توفر Plugin الخاص بـ Zalo Personal.
   - تتضمن إصدارات OpenClaw المعبأة الحالية هذا المكوّن مسبقًا.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. سجّل الدخول (QR، على جهاز Gateway):
   - `openclaw channels login --channel zalouser`
   - امسح رمز QR باستخدام تطبيق Zalo للهواتف المحمولة.
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

4. أعد تشغيل Gateway (أو أنهِ الإعداد).
5. يكون الوصول عبر الرسائل المباشرة افتراضيًا بنمط الاقتران؛ وافق على رمز الاقتران عند أول تواصل.

## ما هو

- يعمل بالكامل داخل العملية عبر `zca-js`.
- يستخدم مستمعي أحداث أصليين لاستقبال الرسائل الواردة.
- يرسل الردود مباشرة عبر JS API (نص/وسائط/رابط).
- مصمم لحالات استخدام "الحساب الشخصي" عندما لا تكون Zalo Bot API متاحة.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصيًا** (غير رسمي). نحتفظ بـ `zalo` لتكامل رسمي محتمل مستقبلًا مع Zalo API.

## العثور على المعرّفات (الدليل)

استخدم CLI الخاص بالدليل لاكتشاف النظراء/المجموعات ومعرّفاتهم:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## القيود

- يتم تقسيم النص الصادر إلى أجزاء بحجم يقارب 2000 حرف (قيود عميل Zalo).
- يكون البث محظورًا افتراضيًا.

## التحكم في الوصول (الرسائل المباشرة)

يدعم `channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).

يجب أن يستخدم `channels.zalouser.allowFrom` معرّفات مستخدمي Zalo ثابتة. أثناء الإعداد التفاعلي، يمكن تحويل الأسماء المُدخلة إلى معرّفات باستخدام بحث جهات الاتصال داخل العملية الخاص بـ Plugin.

إذا بقي اسم خام في الإعدادات، فسيتم تحويله عند بدء التشغيل فقط عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`. بدون هذا الاشتراك الصريح، تكون فحوصات المرسل وقت التشغيل معتمدة على المعرّفات فقط ويتم تجاهل الأسماء الخام للتفويض.

وافق عبر:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## الوصول إلى المجموعات (اختياري)

- الافتراضي: `channels.zalouser.groupPolicy = "open"` (المجموعات مسموحة). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عندما يكون غير مضبوط.
- قيّد الوصول إلى قائمة سماح باستخدام:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (يجب أن تكون المفاتيح معرّفات مجموعات ثابتة؛ يتم تحويل الأسماء إلى معرّفات عند بدء التشغيل فقط عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (يتحكم في المرسلين داخل المجموعات المسموح بها الذين يمكنهم تشغيل الروبوت)
- حظر كل المجموعات: `channels.zalouser.groupPolicy = "disabled"`.
- يمكن لمعالج الإعداد أن يطلب قوائم سماح للمجموعات.
- عند بدء التشغيل، يحوّل OpenClaw أسماء المجموعات/المستخدمين في قوائم السماح إلى معرّفات ويسجل الربط فقط عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`.
- تكون مطابقة قائمة سماح المجموعات معتمدة على المعرّفات فقط افتراضيًا. يتم تجاهل الأسماء غير المحلولة للمصادقة ما لم يتم تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` هو وضع توافق للحالات الطارئة يعيد تفعيل حل الأسماء القابلة للتغيير عند بدء التشغيل ومطابقة أسماء المجموعات وقت التشغيل.
- إذا لم يتم ضبط `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` لفحوصات مرسل المجموعة.
- تنطبق فحوصات المرسل على رسائل المجموعة العادية وأوامر التحكم على حد سواء (مثل `/new` و`/reset`).

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
- ترتيب الحل: معرّف/اسم المجموعة المطابق تمامًا -> slug المجموعة المطبّع -> `*` -> الافتراضي (`true`).
- ينطبق هذا على المجموعات الموجودة في قائمة السماح ووضع المجموعات المفتوح.
- يُعد اقتباس رسالة الروبوت إشارة ضمنية لتفعيل المجموعة.
- يمكن لأوامر التحكم المصرح بها (مثل `/new`) تجاوز بوابة الإشارة.
- عندما يتم تخطي رسالة مجموعة لأن الإشارة مطلوبة، يخزنها OpenClaw كسجل مجموعة معلّق ويضمّنها في رسالة المجموعة التالية التي تتم معالجتها.
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

## الكتابة، والتفاعلات، وإقرارات التسليم

- يرسل OpenClaw حدث كتابة قبل إرسال الرد (وفق أفضل جهد).
- إجراء تفاعل الرسائل `react` مدعوم لـ `zalouser` في إجراءات القناة.
  - استخدم `remove: true` لإزالة رمز تعبيري محدد للتفاعل من رسالة.
  - دلالات التفاعل: [التفاعلات](/ar/tools/reactions)
- بالنسبة للرسائل الواردة التي تتضمن بيانات وصفية للأحداث، يرسل OpenClaw إقرارات تم التسليم + تمت المشاهدة (وفق أفضل جهد).

## استكشاف الأخطاء وإصلاحها

**تسجيل الدخول لا يستمر:**

- `openclaw channels status --probe`
- إعادة تسجيل الدخول: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**لم يتم حل اسم قائمة السماح/المجموعة:**

- استخدم المعرّفات الرقمية في `allowFrom`/`groupAllowFrom` ومعرّفات المجموعات الثابتة في `groups`. إذا كنت تحتاج عمدًا إلى أسماء الأصدقاء/المجموعات المطابقة تمامًا، ففعّل `channels.zalouser.dangerouslyAllowNameMatching: true`.

**تمت الترقية من إعداد قديم يعتمد على CLI:**

- أزل أي افتراضات قديمة حول عملية `zca` خارجية.
- تعمل القناة الآن بالكامل داخل OpenClaw دون ملفات CLI ثنائية خارجية.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
