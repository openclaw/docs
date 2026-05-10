---
read_when:
    - إعداد Zalo Personal لـ OpenClaw
    - تصحيح أخطاء تسجيل الدخول إلى Zalo Personal أو تدفق الرسائل
summary: دعم الحساب الشخصي في Zalo عبر zca-js الأصلي (تسجيل الدخول عبر QR)، والإمكانات، والتهيئة
title: Zalo الشخصي
x-i18n:
    generated_at: "2026-05-10T19:25:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

الحالة: تجريبية. يتيح هذا التكامل أتمتة **حساب Zalo شخصي** عبر `zca-js` الأصلي داخل OpenClaw.

<Warning>
هذا تكامل غير رسمي وقد يؤدي إلى تعليق الحساب أو حظره. استخدمه على مسؤوليتك.
</Warning>

## Plugin المضمّن

يُشحن Zalo Personal كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
الحِزم المبنية العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستثني Zalo Personal،
فثبّت حزمة npm مباشرة:

- التثبيت عبر CLI: `openclaw plugins install @openclaw/zalouser`
- إصدار مثبّت: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- أو من نسخة مصدرية: `openclaw plugins install ./path/to/local/zalouser-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

لا يلزم وجود ملف تنفيذي خارجي لـ CLI باسم `zca`/`openzca`.

## إعداد سريع (للمبتدئين)

1. تأكد من توفر Plugin الخاص بـ Zalo Personal.
   - تتضمنه إصدارات OpenClaw المعبأة الحالية بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. سجّل الدخول (QR، على جهاز Gateway):
   - `openclaw channels login --channel zalouser`
   - امسح رمز QR باستخدام تطبيق Zalo للهاتف المحمول.
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
- يستخدم مستمعي أحداث أصليين لاستقبال الرسائل الواردة.
- يرسل الردود مباشرة عبر JS API (نص/وسائط/رابط).
- مصمم لحالات استخدام "الحساب الشخصي" حيث لا تتوفر Zalo Bot API.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصي** (غير رسمي). نُبقي `zalo` محجوزًا لاحتمال تكامل رسمي مستقبلي مع Zalo API.

## العثور على المعرّفات (الدليل)

استخدم CLI الخاص بالدليل لاكتشاف الأقران/المجموعات ومعرّفاتهم:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## الحدود

- يُجزّأ النص الصادر إلى نحو 2000 حرف (حدود عميل Zalo).
- البث محظور افتراضيًا.

## التحكم في الوصول (الرسائل المباشرة)

يدعم `channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).

يجب أن يستخدم `channels.zalouser.allowFrom` معرّفات مستخدمي Zalo مستقرة. ويمكنه أيضًا الإشارة إلى مجموعات وصول مرسلين ثابتة (`accessGroup:<name>`). أثناء الإعداد التفاعلي، يمكن حل الأسماء المُدخلة إلى معرّفات باستخدام بحث جهات الاتصال داخل العملية الخاص بالـ Plugin.

إذا بقي اسم خام في الإعدادات، فسيتم حله عند بدء التشغيل فقط عند تمكين `channels.zalouser.dangerouslyAllowNameMatching: true`. من دون هذا الاشتراك الصريح، تكون فحوصات المرسلين وقت التشغيل بالمعرّفات فقط، ويتم تجاهل الأسماء الخام للتخويل.

اعتمد عبر:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## وصول المجموعات (اختياري)

- الافتراضي: `channels.zalouser.groupPolicy = "open"` (المجموعات مسموحة). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عند عدم تعيينه.
- قيّد الوصول إلى قائمة سماح باستخدام:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (يجب أن تكون المفاتيح معرّفات مجموعات مستقرة؛ تُحل الأسماء إلى معرّفات عند بدء التشغيل فقط عند تمكين `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (يتحكم في المرسلين داخل المجموعات المسموح بها الذين يمكنهم تشغيل الروبوت؛ يمكن الإشارة إلى مجموعات وصول المرسلين الثابتة باستخدام `accessGroup:<name>`)
- احظر كل المجموعات: `channels.zalouser.groupPolicy = "disabled"`.
- يمكن لمعالج الإعداد المطالبة بقوائم سماح المجموعات.
- عند بدء التشغيل، يحل OpenClaw أسماء المجموعات/المستخدمين في قوائم السماح إلى معرّفات ويسجل الربط فقط عند تمكين `channels.zalouser.dangerouslyAllowNameMatching: true`.
- مطابقة قائمة سماح المجموعات تكون بالمعرّفات فقط افتراضيًا. تُتجاهل الأسماء غير المحلولة للمصادقة ما لم يتم تمكين `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` هو وضع توافق لكسر القيود يعيد تمكين حل الأسماء القابلة للتغيير عند بدء التشغيل ومطابقة أسماء المجموعات وقت التشغيل.
- إذا لم يتم تعيين `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` لفحوصات مرسلي المجموعات.
- تنطبق فحوصات المرسلين على رسائل المجموعات العادية وأوامر التحكم على حد سواء (مثل `/new` و`/reset`).

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

### بوابة الإشارات في المجموعات

- يتحكم `channels.zalouser.groups.<group>.requireMention` فيما إذا كانت ردود المجموعات تتطلب إشارة.
- ترتيب الحل: معرّف/اسم المجموعة المطابق تمامًا -> slug المجموعة المطبّع -> `*` -> الافتراضي (`true`).
- ينطبق هذا على المجموعات الموجودة في قائمة السماح وعلى وضع المجموعات المفتوحة.
- يُحسب اقتباس رسالة الروبوت كإشارة ضمنية لتفعيل المجموعة.
- يمكن لأوامر التحكم المصرح بها (مثل `/new`) تجاوز بوابة الإشارات.
- عندما يتم تخطي رسالة مجموعة لأن الإشارة مطلوبة، يخزنها OpenClaw كسجل مجموعة معلّق ويدرجها في رسالة المجموعة التالية التي تتم معالجتها.
- الحد الافتراضي لسجل المجموعات هو `messages.groupChat.historyLimit` (احتياطيًا `50`). يمكنك تجاوزه لكل حساب باستخدام `channels.zalouser.historyLimit`.

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

- يرسل OpenClaw حدث كتابة قبل إرسال الرد (بأفضل جهد).
- إجراء تفاعل الرسالة `react` مدعوم لـ `zalouser` في إجراءات القنوات.
  - استخدم `remove: true` لإزالة رمز تعبيري محدد للتفاعل من رسالة.
  - دلالات التفاعل: [التفاعلات](/ar/tools/reactions)
- للرسائل الواردة التي تتضمن بيانات وصفية للأحداث، يرسل OpenClaw إقرارات التسليم + المشاهدة (بأفضل جهد).

## استكشاف الأخطاء وإصلاحها

**تسجيل الدخول لا يثبت:**

- `openclaw channels status --probe`
- إعادة تسجيل الدخول: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**لم يتم حل اسم قائمة السماح/المجموعة:**

- استخدم المعرّفات الرقمية في `allowFrom`/`groupAllowFrom` ومعرّفات المجموعات المستقرة في `groups`. إذا كنت تحتاج عمدًا إلى أسماء الأصدقاء/المجموعات الدقيقة، فمكّن `channels.zalouser.dangerouslyAllowNameMatching: true`.

**الترقية من إعداد قديم قائم على CLI:**

- أزل أي افتراضات قديمة حول عملية `zca` خارجية.
- تعمل القناة الآن بالكامل داخل OpenClaw من دون ملفات CLI تنفيذية خارجية.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
