---
read_when:
    - إعداد Zalo Personal لاستخدامه مع OpenClaw
    - تصحيح أخطاء تسجيل الدخول إلى Zalo Personal أو تدفق الرسائل
summary: دعم حساب Zalo الشخصي عبر zca-js الأصلي (تسجيل الدخول برمز QR)، والإمكانات، والتكوين
title: Zalo الشخصي
x-i18n:
    generated_at: "2026-06-27T17:16:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

الحالة: تجريبي. تؤتمت هذه التكاملة **حساب Zalo شخصيًا** عبر `zca-js` الأصلي داخل OpenClaw.

<Warning>
هذه تكاملة غير رسمية وقد تؤدي إلى تعليق الحساب أو حظره. استخدمها على مسؤوليتك الخاصة.
</Warning>

## Plugin مضمّن

يُشحن Zalo Personal بصفته Plugin مضمّنًا في إصدارات OpenClaw الحالية، لذلك لا تحتاج الإصدارات
المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد Zalo Personal،
فثبّت حزمة npm مباشرة:

- التثبيت عبر CLI: `openclaw plugins install @openclaw/zalouser`
- إصدار مثبت: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- أو من نسخة مصدرية محلية: `openclaw plugins install ./path/to/local/zalouser-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

لا يلزم أي ملف CLI ثنائي خارجي لـ `zca`/`openzca`.

## الإعداد السريع (للمبتدئين)

1. تأكد من توفر Plugin الخاص بـ Zalo Personal.
   - إصدارات OpenClaw المعبأة الحالية تضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
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

4. أعد تشغيل Gateway (أو أنهِ الإعداد).
5. يكون وصول الرسائل المباشرة مضبوطًا افتراضيًا على الإقران؛ وافق على رمز الإقران عند أول تواصل.

## ما هي

- تعمل بالكامل داخل العملية عبر `zca-js`.
- تستخدم مستمعي أحداث أصليين لتلقي الرسائل الواردة.
- ترسل الردود مباشرة عبر JS API (نص/وسائط/رابط).
- مصممة لحالات استخدام "الحساب الشخصي" حيث لا تكون Zalo Bot API متاحة.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصيًا** (غير رسمي). نُبقي `zalo` محجوزًا لتكاملة Zalo API رسمية محتملة في المستقبل.

## العثور على المعرّفات (الدليل)

استخدم CLI الخاص بالدليل لاكتشاف النظراء/المجموعات ومعرّفاتهم:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## الحدود

- يُقسّم النص الصادر إلى نحو 2000 حرف (حدود عميل Zalo).
- البث محظور افتراضيًا.

## التحكم في الوصول (الرسائل المباشرة)

يدعم `channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).

يجب أن يستخدم `channels.zalouser.allowFrom` معرّفات مستخدمي Zalo ثابتة. ويمكنه أيضًا الإشارة إلى مجموعات وصول مرسلين ثابتة (`accessGroup:<name>`). أثناء الإعداد التفاعلي، يمكن حل الأسماء المُدخلة إلى معرّفات باستخدام بحث جهات الاتصال داخل العملية الخاص بـ Plugin.

إذا بقي اسم خام في الإعداد، فسيحلّه بدء التشغيل فقط عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`. من دون هذا الاشتراك الصريح، تكون فحوصات المرسل وقت التشغيل بالمعرّف فقط ويتم تجاهل الأسماء الخام للتخويل.

وافِق عبر:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## وصول المجموعات (اختياري)

- الافتراضي: `channels.zalouser.groupPolicy = "open"` (المجموعات مسموحة). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عندما لا يكون مضبوطًا.
- قيّد الوصول إلى قائمة سماح عبر:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (ينبغي أن تكون المفاتيح معرّفات مجموعات ثابتة؛ تُحلّ الأسماء إلى معرّفات عند بدء التشغيل فقط عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (يتحكم في المرسلين داخل المجموعات المسموح بها الذين يمكنهم تشغيل البوت؛ يمكن الإشارة إلى مجموعات وصول المرسلين الثابتة باستخدام `accessGroup:<name>`)
- احظر كل المجموعات: `channels.zalouser.groupPolicy = "disabled"`.
- يمكن لمعالج التهيئة المطالبة بقوائم سماح للمجموعات.
- عند بدء التشغيل، يحل OpenClaw أسماء المجموعات/المستخدمين في قوائم السماح إلى معرّفات ولا يسجل التعيين إلا عند تفعيل `channels.zalouser.dangerouslyAllowNameMatching: true`.
- تكون مطابقة قائمة سماح المجموعات بالمعرّف فقط افتراضيًا. تُتجاهل الأسماء غير المحلولة للمصادقة إلا إذا فُعّل `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` هو وضع توافق لكسر الحاجز يعيد تفعيل حل الأسماء القابلة للتغيير عند بدء التشغيل ومطابقة أسماء المجموعات وقت التشغيل.
- إذا لم يكن `groupAllowFrom` مضبوطًا، يعود وقت التشغيل إلى `allowFrom` لفحوصات مرسلي المجموعات.
- تنطبق فحوصات المرسل على رسائل المجموعات العادية وأوامر التحكم على حد سواء (مثل `/new` و`/reset`).

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

### بوابة إشارات المجموعة

- يتحكم `channels.zalouser.groups.<group>.requireMention` في ما إذا كانت ردود المجموعة تتطلب إشارة.
- ترتيب الحل: معرّف/اسم المجموعة المطابق تمامًا -> اسم slug موحّد للمجموعة -> `*` -> الافتراضي (`true`).
- ينطبق هذا على المجموعات المدرجة في قائمة السماح ووضع المجموعات المفتوحة.
- يُحسب اقتباس رسالة بوت كإشارة ضمنية لتنشيط المجموعة.
- يمكن لأوامر التحكم المخوّلة (مثل `/new`) تجاوز بوابة الإشارات.
- عندما تُتخطى رسالة مجموعة لأن الإشارة مطلوبة، يخزنها OpenClaw كسجل مجموعة معلّق ويضمّنها في رسالة المجموعة التالية التي تتم معالجتها.
- حد سجل المجموعة الافتراضي هو `messages.groupChat.historyLimit` (الاحتياطي `50`). يمكنك تجاوزه لكل حساب باستخدام `channels.zalouser.historyLimit`.

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

## الحسابات المتعددة

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

## متغيرات البيئة

يمكن لـ Plugin الخاص بـ Zalo Personal أيضًا قراءة اختيار ملف التعريف من متغيرات البيئة:

- `ZALOUSER_PROFILE`: اسم ملف التعريف المطلوب استخدامه عند عدم ضبط `profile` في إعداد القناة أو الحساب.
- `ZCA_PROFILE`: اسم ملف التعريف الاحتياطي القديم، ويُستخدم فقط عندما لا يكون `ZALOUSER_PROFILE` مضبوطًا.

تحدد أسماء ملفات التعريف بيانات اعتماد تسجيل دخول Zalo المحفوظة في حالة OpenClaw. ترتيب الحل هو:

1. `profile` الصريح في الإعداد.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. معرّف الحساب للحسابات غير الافتراضية، أو `default` للحساب الافتراضي.

في إعدادات الحسابات المتعددة، يُفضّل ضبط `profile` لكل حساب في الإعداد حتى
لا يجعل متغير بيئة واحد عدة حسابات تشارك جلسة تسجيل الدخول نفسها.

## الكتابة والتفاعلات وإشعارات التسليم

- يرسل OpenClaw حدث كتابة قبل إرسال الرد (بأفضل جهد).
- إجراء تفاعل الرسالة `react` مدعوم لـ `zalouser` في إجراءات القناة.
  - استخدم `remove: true` لإزالة رمز تعبيري لتفاعل محدد من رسالة.
  - دلالات التفاعل: [التفاعلات](/ar/tools/reactions)
- بالنسبة إلى الرسائل الواردة التي تتضمن بيانات وصفية للحدث، يرسل OpenClaw إشعارات تسليم + قراءة (بأفضل جهد).

## استكشاف الأخطاء وإصلاحها

**تسجيل الدخول لا يبقى محفوظًا:**

- `openclaw channels status --probe`
- إعادة تسجيل الدخول: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**لم يُحل اسم قائمة السماح/المجموعة:**

- استخدم معرّفات رقمية في `allowFrom`/`groupAllowFrom` ومعرّفات مجموعات ثابتة في `groups`. إذا كنت تحتاج عمدًا إلى أسماء الأصدقاء/المجموعات الدقيقة، ففعّل `channels.zalouser.dangerouslyAllowNameMatching: true`.

**تمت الترقية من إعداد قديم قائم على CLI:**

- أزل أي افتراضات قديمة حول عملية `zca` خارجية.
- تعمل القناة الآن بالكامل داخل OpenClaw من دون ملفات CLI ثنائية خارجية.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
