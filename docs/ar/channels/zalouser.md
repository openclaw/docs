---
read_when:
    - إعداد Zalo Personal لـ OpenClaw
    - تصحيح أخطاء تسجيل الدخول أو تدفّق الرسائل في Zalo Personal
summary: دعم الحساب الشخصي في Zalo عبر zca-js الأصلي (تسجيل الدخول برمز QR)، والإمكانات، والتكوين
title: Zalo الشخصي
x-i18n:
    generated_at: "2026-05-06T17:52:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

الحالة: تجريبية. يتيح هذا التكامل أتمتة **حساب Zalo شخصي** عبر `zca-js` الأصلي داخل OpenClaw.

<Warning>
هذا تكامل غير رسمي وقد يؤدي إلى تعليق الحساب أو حظره. استخدمه على مسؤوليتك الخاصة.
</Warning>

## Plugin مضمن

يُشحن Zalo Personal كـ Plugin مضمن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البُنى المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Zalo Personal،
فثبّت حزمة npm مباشرةً:

- التثبيت عبر CLI: `openclaw plugins install @openclaw/zalouser`
- إصدار مثبت: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- أو من نسخة مصدر: `openclaw plugins install ./path/to/local/zalouser-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

لا يلزم وجود ملف CLI ثنائي خارجي لـ `zca`/`openzca`.

## إعداد سريع (للمبتدئين)

1. تأكد من توفر Plugin الخاص بـ Zalo Personal.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. سجّل الدخول (QR، على جهاز Gateway):
   - `openclaw channels login --channel zalouser`
   - امسح رمز QR ضوئيًا باستخدام تطبيق Zalo للهاتف المحمول.
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
5. يكون وصول الرسائل المباشرة افتراضيًا عبر الاقتران؛ وافق على رمز الاقتران عند أول تواصل.

## ما هو

- يعمل بالكامل داخل العملية عبر `zca-js`.
- يستخدم مستمعات أحداث أصلية لاستقبال الرسائل الواردة.
- يرسل الردود مباشرة عبر JS API (نص/وسائط/رابط).
- مصمم لحالات استخدام "الحساب الشخصي" حيث لا تتوفر Zalo Bot API.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصي** (غير رسمي). نُبقي `zalo` محجوزًا لتكامل رسمي محتمل مع Zalo API في المستقبل.

## العثور على المعرّفات (الدليل)

استخدم CLI الدليل لاكتشاف الأقران/المجموعات ومعرّفاتهم:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## الحدود

- يُجزّأ النص الصادر إلى نحو 2000 حرف (حدود عميل Zalo).
- يكون البث محظورًا افتراضيًا.

## التحكم في الوصول (الرسائل المباشرة)

يدعم `channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).

ينبغي أن يستخدم `channels.zalouser.allowFrom` معرّفات مستخدمي Zalo المستقرة. أثناء الإعداد التفاعلي، يمكن حل الأسماء المدخلة إلى معرّفات باستخدام بحث جهات الاتصال داخل العملية الخاص بـ Plugin.

إذا بقي اسم خام في الإعداد، فسيحلّه بدء التشغيل فقط عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`. دون هذا الاشتراك الصريح، تكون فحوصات المرسل وقت التشغيل بالمعرّف فقط ويتم تجاهل الأسماء الخام للتفويض.

وافِق عبر:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## وصول المجموعات (اختياري)

- الافتراضي: `channels.zalouser.groupPolicy = "open"` (المجموعات مسموحة). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عند عدم تعيينه.
- قيّد الوصول إلى قائمة سماح باستخدام:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ينبغي أن تكون المفاتيح معرّفات مجموعات مستقرة؛ تُحل الأسماء إلى معرّفات عند بدء التشغيل فقط عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (يتحكم في المرسلين داخل المجموعات المسموح بها الذين يمكنهم تشغيل البوت)
- احظر كل المجموعات: `channels.zalouser.groupPolicy = "disabled"`.
- يمكن لمعالج التهيئة طلب قوائم سماح المجموعات.
- عند بدء التشغيل، يحل OpenClaw أسماء المجموعات/المستخدمين في قوائم السماح إلى معرّفات ويسجل الربط فقط عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`.
- تكون مطابقة قائمة سماح المجموعات بالمعرّف فقط افتراضيًا. تُتجاهل الأسماء غير المحلولة للمصادقة ما لم يكن `channels.zalouser.dangerouslyAllowNameMatching: true` مفعّلًا.
- `channels.zalouser.dangerouslyAllowNameMatching: true` هو وضع توافق للحالات الطارئة يعيد تفعيل حل الأسماء القابلة للتغيير عند بدء التشغيل ومطابقة أسماء المجموعات وقت التشغيل.
- إذا لم يُعيّن `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` لفحوصات مرسل المجموعة.
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

### بوابة الإشارة في المجموعة

- يتحكم `channels.zalouser.groups.<group>.requireMention` فيما إذا كانت ردود المجموعة تتطلب إشارة.
- ترتيب الحل: معرّف/اسم المجموعة المطابق تمامًا -> الاسم المختصر المطبّع للمجموعة -> `*` -> الافتراضي (`true`).
- ينطبق هذا على المجموعات الموجودة في قائمة السماح وعلى وضع المجموعة المفتوحة.
- يُعد اقتباس رسالة البوت إشارة ضمنية لتفعيل المجموعة.
- يمكن لأوامر التحكم المصرح بها (مثل `/new`) تجاوز بوابة الإشارة.
- عندما تُتخطى رسالة مجموعة لأن الإشارة مطلوبة، يخزنها OpenClaw كسجل مجموعة معلّق ويضمّنها في رسالة المجموعة التالية التي تُعالج.
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

- يرسل OpenClaw حدث كتابة قبل إرسال الرد (بأفضل جهد).
- إجراء تفاعل الرسالة `react` مدعوم لـ `zalouser` في إجراءات القناة.
  - استخدم `remove: true` لإزالة رمز تعبيري لتفاعل محدد من رسالة.
  - دلالات التفاعل: [التفاعلات](/ar/tools/reactions)
- بالنسبة إلى الرسائل الواردة التي تتضمن بيانات تعريف الحدث، يرسل OpenClaw إقرارات تسليم + مشاهدة (بأفضل جهد).

## استكشاف الأخطاء وإصلاحها

**تسجيل الدخول لا يستمر:**

- `openclaw channels status --probe`
- إعادة تسجيل الدخول: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**لم يتم حل اسم قائمة السماح/المجموعة:**

- استخدم المعرّفات الرقمية في `allowFrom`/`groupAllowFrom` ومعرّفات المجموعات المستقرة في `groups`. إذا كنت تحتاج عمدًا إلى أسماء الأصدقاء/المجموعات المطابقة تمامًا، فعّل `channels.zalouser.dangerouslyAllowNameMatching: true`.

**تمت الترقية من إعداد قديم قائم على CLI:**

- أزل أي افتراضات قديمة حول عملية `zca` خارجية.
- تعمل القناة الآن بالكامل داخل OpenClaw دون ملفات CLI ثنائية خارجية.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك محادثة المجموعة وبوابة الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
