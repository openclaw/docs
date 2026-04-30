---
read_when:
    - إعداد Zalo Personal لـ OpenClaw
    - تصحيح أخطاء تسجيل الدخول أو تدفق الرسائل في Zalo Personal
summary: دعم الحساب الشخصي في Zalo عبر zca-js الأصلي (تسجيل الدخول عبر رمز QR)، والقدرات، والتكوين
title: Zalo الشخصي
x-i18n:
    generated_at: "2026-04-30T07:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

الحالة: تجريبية. يتيح هذا التكامل أتمتة **حساب Zalo شخصي** عبر `zca-js` الأصلي داخل OpenClaw.

<Warning>
هذا تكامل غير رسمي وقد يؤدي إلى تعليق الحساب أو حظره. استخدمه على مسؤوليتك الخاصة.
</Warning>

## Plugin مضمن

يأتي Zalo Personal كـ Plugin مضمن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البُنى المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Zalo Personal،
فثبّت حزمة npm حديثة عند نشرها:

- التثبيت عبر CLI: `openclaw plugins install @openclaw/zalouser`
- أو من نسخة مصدرية محلية: `openclaw plugins install ./path/to/local/zalouser-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

إذا أفاد npm بأن الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم بنية OpenClaw
معبأة حديثة أو مسار النسخة المحلية إلى أن تُنشر حزمة npm أحدث.

لا يلزم وجود ملف CLI تنفيذي خارجي باسم `zca`/`openzca`.

## الإعداد السريع (للمبتدئين)

1. تأكد من توفر Plugin ‏Zalo Personal.
   - تتضمن إصدارات OpenClaw المعبأة الحالية هذا Plugin بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. سجّل الدخول (QR، على جهاز Gateway):
   - `openclaw channels login --channel zalouser`
   - امسح رمز QR بتطبيق Zalo للجوال.
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
5. يكون وصول الرسائل المباشرة افتراضيًا عبر الاقتران؛ وافق على رمز الاقتران عند أول تواصل.

## ما هو

- يعمل بالكامل داخل العملية عبر `zca-js`.
- يستخدم مستمعي أحداث أصليين لتلقي الرسائل الواردة.
- يرسل الردود مباشرة عبر JS API (نص/وسائط/رابط).
- مصمم لحالات استخدام "الحساب الشخصي" حيث لا تتوفر Zalo Bot API.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصيًا** (غير رسمي). نحتفظ بـ `zalo` لتكامل رسمي محتمل مع Zalo API في المستقبل.

## العثور على المعرّفات (الدليل)

استخدم CLI الدليل لاكتشاف النظراء/المجموعات ومعرّفاتهم:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## الحدود

- يُجزّأ النص الصادر إلى نحو 2000 حرف (حدود عميل Zalo).
- يكون البث محظورًا افتراضيًا.

## التحكم في الوصول (الرسائل المباشرة)

يدعم `channels.zalouser.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: `pairing`).

يقبل `channels.zalouser.allowFrom` معرّفات المستخدمين أو الأسماء. أثناء الإعداد، تُحل الأسماء إلى معرّفات باستخدام بحث جهات الاتصال داخل العملية الخاص بالـ Plugin.

الموافقة عبر:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## وصول المجموعات (اختياري)

- الافتراضي: `channels.zalouser.groupPolicy = "open"` (المجموعات مسموح بها). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عند عدم ضبطه.
- التقييد إلى قائمة سماح باستخدام:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ينبغي أن تكون المفاتيح معرّفات مجموعات مستقرة؛ تُحل الأسماء إلى معرّفات عند بدء التشغيل متى أمكن)
  - `channels.zalouser.groupAllowFrom` (يتحكم في المرسلين داخل المجموعات المسموح بها الذين يمكنهم تشغيل الروبوت)
- حظر كل المجموعات: `channels.zalouser.groupPolicy = "disabled"`.
- يمكن لمعالج الضبط طلب قوائم سماح للمجموعات.
- عند بدء التشغيل، يحل OpenClaw أسماء المجموعات/المستخدمين في قوائم السماح إلى معرّفات ويسجل الربط.
- تكون مطابقة قائمة سماح المجموعات بحسب المعرّف فقط افتراضيًا. تُتجاهل الأسماء غير المحلولة لأغراض المصادقة ما لم يُفعّل `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` هو وضع توافق لكسر الطوارئ يعيد تفعيل مطابقة أسماء المجموعات القابلة للتغيير.
- إذا لم يُضبط `groupAllowFrom`، يرجع وقت التشغيل إلى `allowFrom` لفحوص مرسل المجموعة.
- تنطبق فحوص المرسل على رسائل المجموعة العادية وأوامر التحكم على حد سواء (مثلًا `/new` و`/reset`).

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
- ينطبق هذا على المجموعات المدرجة في قائمة السماح ووضع المجموعة المفتوح.
- يُعد اقتباس رسالة من الروبوت إشارة ضمنية لتفعيل المجموعة.
- يمكن لأوامر التحكم المصرح بها (مثلًا `/new`) تجاوز بوابة الإشارة.
- عندما تُتجاوز رسالة مجموعة لأن الإشارة مطلوبة، يخزنها OpenClaw كسجل مجموعة معلّق ويدرجه في رسالة المجموعة التالية التي تتم معالجتها.
- يكون حد سجل المجموعة افتراضيًا `messages.groupChat.historyLimit` (القيمة الاحتياطية `50`). يمكنك تجاوزه لكل حساب باستخدام `channels.zalouser.historyLimit`.

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

- يرسل OpenClaw حدث كتابة قبل إرسال الرد (حسب أفضل جهد).
- إجراء تفاعل الرسائل `react` مدعوم لـ `zalouser` في إجراءات القناة.
  - استخدم `remove: true` لإزالة رمز تعبيري لتفاعل محدد من رسالة.
  - دلالات التفاعلات: [التفاعلات](/ar/tools/reactions)
- بالنسبة إلى الرسائل الواردة التي تتضمن بيانات تعريف الحدث، يرسل OpenClaw إقرارات التسليم + المشاهدة (حسب أفضل جهد).

## استكشاف الأخطاء وإصلاحها

**تسجيل الدخول لا يثبت:**

- `openclaw channels status --probe`
- إعادة تسجيل الدخول: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**لم يُحل اسم قائمة السماح/المجموعة:**

- استخدم المعرّفات الرقمية في `allowFrom`/`groupAllowFrom`/`groups`، أو أسماء الأصدقاء/المجموعات المطابقة تمامًا.

**الترقية من إعداد قديم قائم على CLI:**

- أزل أي افتراضات قديمة بشأن عملية `zca` خارجية.
- تعمل القناة الآن بالكامل داخل OpenClaw دون ملفات CLI تنفيذية خارجية.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعة وبوابة الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
