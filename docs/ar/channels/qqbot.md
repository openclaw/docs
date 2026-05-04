---
read_when:
    - تريد ربط OpenClaw بـ QQ
    - تحتاج إلى إعداد بيانات اعتماد QQ Bot
    - تريد دعم روبوت QQ لدردشة المجموعات أو الدردشة الخاصة
summary: إعداد QQ Bot وتهيئته واستخدامه
title: بوت QQ
x-i18n:
    generated_at: "2026-05-04T02:22:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot يتصل بـ OpenClaw عبر واجهة QQ Bot API الرسمية (Gateway WebSocket). يدعم
Plugin الدردشة الخاصة C2C، و@messages في المجموعات، ورسائل قنوات النقابات مع
وسائط غنية (صور، صوت، فيديو، ملفات).

الحالة: Plugin قابل للتنزيل. الرسائل المباشرة، ودردشات المجموعات، وقنوات النقابات،
والوسائط مدعومة. التفاعلات وسلاسل النقاش غير مدعومة.

## التثبيت

ثبّت QQ Bot قبل الإعداد:

```bash
openclaw plugins install @openclaw/qqbot
```

## الإعداد

1. انتقل إلى [QQ Open Platform](https://q.qq.com/) وامسح رمز QR باستخدام
   QQ على هاتفك للتسجيل / تسجيل الدخول.
2. انقر على **Create Bot** لإنشاء بوت QQ جديد.
3. ابحث عن **AppID** و**AppSecret** في صفحة إعدادات البوت وانسخهما.

> لا يُخزَّن AppSecret بنص صريح — إذا غادرت الصفحة دون حفظه،
> فسيتعين عليك إعادة إنشاء واحد جديد.

4. أضف القناة:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. أعد تشغيل Gateway.

مسارات الإعداد التفاعلي:

```bash
openclaw channels add
openclaw configure --section channels
```

## التكوين

أدنى تكوين:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

متغيرات البيئة للحساب الافتراضي:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret مدعوم بملف:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

AppSecret عبر Env SecretRef:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

ملاحظات:

- ينطبق الرجوع إلى البيئة على حساب QQ Bot الافتراضي فقط.
- يوفر `openclaw channels add --channel qqbot --token-file ...`
  AppSecret فقط؛ يجب أن يكون AppID مضبوطًا مسبقًا في التكوين أو `QQBOT_APP_ID`.
- يقبل `clientSecret` أيضًا إدخال SecretRef، وليس سلسلة نصية صريحة فقط.
- سلاسل العلامات القديمة `secretref:/...` ليست قيم `clientSecret` صالحة؛
  استخدم كائنات SecretRef مهيكلة مثل المثال أعلاه.

### إعداد حسابات متعددة

شغّل عدة بوتات QQ ضمن نسخة OpenClaw واحدة:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

يطلق كل حساب اتصال WebSocket خاصًا به ويحافظ على ذاكرة تخزين مؤقت مستقلة
للرمز المميز (معزولة حسب `appId`).

أضف بوتًا ثانيًا عبر CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### دردشات المجموعات

يستخدم دعم دردشة المجموعات في QQ Bot معرّفات OpenID لمجموعات QQ، وليس أسماء العرض. أضف البوت
إلى مجموعة، ثم اذكره أو اضبط المجموعة للتشغيل دون ذكر.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

يضبط `groups["*"]` القيم الافتراضية لكل مجموعة، ويتجاوز إدخال
`groups.GROUP_OPENID` محدد هذه القيم الافتراضية لمجموعة واحدة. تشمل إعدادات
المجموعة:

- `requireMention`: يتطلب @mention قبل أن يرد البوت. الافتراضي: `true`.
- `ignoreOtherMentions`: يتجاهل الرسائل التي تذكر شخصًا آخر وليس البوت.
- `historyLimit`: يحتفظ برسائل المجموعة الحديثة غير المتضمنة لذكر كسياق للدور المذكور التالي. اضبط `0` للتعطيل.
- `toolPolicy`: `full` أو `restricted` أو `none` للأدوات ضمن نطاق المجموعة.
- `name`: تسمية سهلة القراءة تُستخدم في السجلات وسياق المجموعة.
- `prompt`: موجّه سلوك لكل مجموعة يُلحَق بسياق الوكيل.

أوضاع التفعيل هي `mention` و`always`. يقابل `requireMention: true`
`mention`؛ ويقابل `requireMention: false` `always`. يتقدم تجاوز التفعيل
على مستوى الجلسة، عند وجوده، على التكوين.

قائمة الانتظار الواردة تكون لكل نظير. تحصل نظراء المجموعات على حد قائمة انتظار أكبر، وتُبقي رسائل البشر
قبل أحاديث البوت عند الامتلاء، وتدمج دفعات رسائل المجموعة العادية
في دور واحد منسوب. تستمر أوامر Slash في العمل واحدًا تلو الآخر.

### الصوت (STT / TTS)

يدعم STT وTTS تكوينًا من مستويين مع رجوع حسب الأولوية:

| الإعداد | خاص بـ Plugin                                            | رجوع إطار العمل              |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

اضبط `enabled: false` على أي منهما للتعطيل.
تستخدم تجاوزات TTS على مستوى الحساب الشكل نفسه مثل `messages.tts` وتُدمج بعمق
فوق تكوين TTS للقناة/العام.

تُعرَض مرفقات الصوت الواردة من QQ للوكلاء كبيانات تعريف وسائط صوتية مع
إبقاء ملفات الصوت الخام خارج `MediaPaths` العامة. تؤدي الردود النصية الصريحة
`[[audio_as_voice]]` إلى إنشاء TTS وإرسال رسالة صوت QQ أصلية عند تكوين TTS.

يمكن أيضًا ضبط سلوك رفع/تحويل ترميز الصوت الصادر باستخدام
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## تنسيقات الهدف

| التنسيق                   | الوصف              |
| ------------------------- | ------------------ |
| `qqbot:c2c:OPENID`        | دردشة خاصة (C2C)   |
| `qqbot:group:GROUP_OPENID` | دردشة مجموعة       |
| `qqbot:channel:CHANNEL_ID` | قناة نقابة         |

> لكل بوت مجموعته الخاصة من معرّفات OpenID للمستخدمين. لا يمكن استخدام OpenID
> مستلم بواسطة البوت A **لإرسال** رسائل عبر البوت B.

## أوامر Slash

الأوامر المدمجة التي تُعترض قبل قائمة انتظار الذكاء الاصطناعي:

| الأمر          | الوصف                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | اختبار زمن الاستجابة                                                                                       |
| `/bot-version` | عرض إصدار إطار عمل OpenClaw                                                                                |
| `/bot-help`    | سرد كل الأوامر                                                                                             |
| `/bot-me`      | عرض معرّف مستخدم QQ الخاص بالمرسل (openid) لإعداد `allowFrom`/`groupAllowFrom`                             |
| `/bot-upgrade` | عرض رابط دليل ترقية QQBot                                                                                  |
| `/bot-logs`    | تصدير سجلات Gateway الحديثة كملف                                                                           |
| `/bot-approve` | الموافقة على إجراء QQ Bot معلّق (على سبيل المثال، تأكيد رفع C2C أو مجموعة) عبر التدفق الأصلي. |

ألحق `?` بأي أمر للحصول على مساعدة الاستخدام (على سبيل المثال `/bot-upgrade ?`).

أوامر الإدارة (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) مخصصة للرسائل المباشرة فقط وتتطلب أن يكون openid الخاص بالمرسل في قائمة `allowFrom` صريحة غير شاملة. تسمح صيغة شاملة `allowFrom: ["*"]` بالدردشة لكنها لا تمنح صلاحية الوصول إلى أوامر الإدارة. تُطابق رسائل المجموعات `groupAllowFrom` أولًا ثم تعود إلى `allowFrom`. يؤدي تشغيل أمر إدارة في مجموعة إلى إرجاع تلميح بدل إسقاطه بصمت.

## بنية المحرك

يأتي QQ Bot كمحرك مستقل داخل Plugin:

- يمتلك كل حساب مكدس موارد معزولًا (اتصال WebSocket، عميل API، ذاكرة تخزين مؤقت للرمز المميز، جذر تخزين الوسائط) مرتبطًا بـ `appId`. لا تشترك الحسابات أبدًا في الحالة الواردة/الصادرة.
- يوسم المسجل متعدد الحسابات أسطر السجل بالحساب المالك حتى تبقى التشخيصات قابلة للفصل عند تشغيل عدة بوتات ضمن Gateway واحد.
- تشترك مسارات الوارد والصادر وجسر Gateway في جذر حمولة وسائط واحد ضمن `~/.openclaw/media`، بحيث تستقر عمليات الرفع والتنزيل وذاكرات تحويل الترميز المؤقتة ضمن دليل محمي واحد بدل شجرة لكل نظام فرعي.
- يمر تسليم الوسائط الغنية عبر مسار `sendMedia` واحد لأهداف C2C والمجموعات. تستخدم الملفات المحلية والمخازن المؤقتة الأكبر من حد الملفات الكبيرة نقاط نهاية الرفع المجزأ في QQ، بينما تستخدم الحمولات الأصغر واجهة API الوسائط ذات العملية الواحدة.
- يمكن نسخ بيانات الاعتماد احتياطيًا واستعادتها كجزء من لقطات بيانات اعتماد OpenClaw القياسية؛ يعيد المحرك إرفاق مكدس موارد كل حساب عند الاستعادة دون الحاجة إلى اقتران جديد برمز QR.

## الإعداد عبر رمز QR

كبديل للصق `AppID:AppSecret` يدويًا، يدعم المحرك تدفق إعداد عبر رمز QR لربط QQ Bot بـ OpenClaw:

1. شغّل مسار إعداد QQ Bot (على سبيل المثال `openclaw channels add --channel qqbot`) واختر تدفق رمز QR عند المطالبة.
2. امسح رمز QR المُنشأ باستخدام تطبيق الهاتف المرتبط بـ QQ Bot الهدف.
3. وافق على الاقتران على الهاتف. يحفظ OpenClaw بيانات الاعتماد المُعادة في `credentials/` ضمن نطاق الحساب الصحيح.

تظهر مطالبات الموافقة التي ينشئها البوت نفسه (على سبيل المثال، تدفقات "السماح بهذا الإجراء؟" التي تعرضها QQ Bot API) كمطالبات OpenClaw أصلية يمكنك قبولها باستخدام `/bot-approve` بدل الرد عبر عميل QQ الخام.

## استكشاف الأخطاء وإصلاحها

- **يرد البوت "gone to Mars":** بيانات الاعتماد غير مكوّنة أو Gateway غير مشغّل.
- **لا توجد رسائل واردة:** تحقق من صحة `appId` و`clientSecret`، وأن
  البوت مفعّل على QQ Open Platform.
- **ردود ذاتية متكررة:** يسجل OpenClaw فهارس مراجع الصادر في QQ على أنها
  من تأليف البوت ويتجاهل الأحداث الواردة التي يطابق `msgIdx` الحالي فيها
  حساب البوت نفسه. يمنع هذا حلقات صدى المنصة مع السماح للمستخدمين
  باقتباس رسائل البوت السابقة أو الرد عليها.
- **الإعداد باستخدام `--token-file` لا يزال يظهر غير مكوّن:** يضبط `--token-file`
  AppSecret فقط. ما زلت بحاجة إلى `appId` في التكوين أو `QQBOT_APP_ID`.
- **الرسائل الاستباقية لا تصل:** قد يعترض QQ الرسائل التي يبدأها البوت إذا
  لم يتفاعل المستخدم مؤخرًا.
- **الصوت لا يُنسخ:** تأكد من تكوين STT وأن المزود قابل للوصول.

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
