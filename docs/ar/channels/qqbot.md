---
read_when:
    - تريد ربط OpenClaw بـ QQ
    - تحتاج إلى إعداد بيانات اعتماد QQ Bot
    - تريد دعم QQ Bot للدردشات الجماعية أو الخاصة
summary: إعداد بوت QQ وتهيئته واستخدامه
title: روبوت QQ
x-i18n:
    generated_at: "2026-05-03T21:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 471c24110bf0ab8896d22f5bb5932ac4e03ff5169560c99ba6b9d1ca4025d9a8
    source_path: channels/qqbot.md
    workflow: 16
---

يربط QQ Bot بـ OpenClaw عبر QQ Bot API الرسمي (WebSocket gateway). يدعم الـ
Plugin المحادثات الخاصة C2C، ورسائل @ في المجموعات، ورسائل قنوات guild مع
وسائط غنية (صور، صوت، فيديو، ملفات).

الحالة: Plugin قابل للتنزيل. الرسائل المباشرة، ومحادثات المجموعات، وقنوات guild،
والوسائط مدعومة. التفاعلات وthreads غير مدعومة.

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

> لا يُخزّن AppSecret كنص عادي — إذا غادرت الصفحة دون حفظه،
> فسيتعين عليك إنشاء واحد جديد.

4. أضف القناة:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. أعد تشغيل الـ Gateway.

مسارات الإعداد التفاعلية:

```bash
openclaw channels add
openclaw configure --section channels
```

## التهيئة

الحد الأدنى من التهيئة:

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

AppSecret عبر SecretRef من البيئة:

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
- يوفّر `openclaw channels add --channel qqbot --token-file ...`
  AppSecret فقط؛ يجب أن يكون AppID معيّناً مسبقاً في التهيئة أو `QQBOT_APP_ID`.
- يقبل `clientSecret` أيضاً إدخال SecretRef، وليس سلسلة نصية عادية فقط.
- سلاسل علامات `secretref:/...` القديمة ليست قيماً صالحة لـ `clientSecret`؛
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

يطلق كل حساب اتصال WebSocket خاصاً به ويحافظ على ذاكرة تخزين مؤقت مستقلة
للرمز المميز (معزولة حسب `appId`).

أضف بوتاً ثانياً عبر CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### محادثات المجموعات

يستخدم دعم محادثات مجموعات QQ Bot معرّفات QQ group OpenIDs، وليس أسماء العرض. أضف البوت
إلى مجموعة، ثم اذكره أو هيّئ المجموعة للعمل دون ذكر.

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

يضبط `groups["*"]` الإعدادات الافتراضية لكل مجموعة، ويتجاوز إدخال
`groups.GROUP_OPENID` المحدد تلك الإعدادات الافتراضية لمجموعة واحدة. تتضمن
إعدادات المجموعة:

- `requireMention`: يتطلب @mention قبل أن يرد البوت. الافتراضي: `true`.
- `ignoreOtherMentions`: تجاهل الرسائل التي تذكر شخصاً آخر لكن لا تذكر البوت.
- `historyLimit`: الاحتفاظ برسائل المجموعة الحديثة غير المحتوية على ذكر كسياق للدور التالي الذي يتضمن ذكراً. اضبطه على `0` للتعطيل.
- `toolPolicy`: `full` أو `restricted` أو `none` للأدوات ضمن نطاق المجموعة.
- `name`: تسمية ودية تُستخدم في السجلات وسياق المجموعة.
- `prompt`: موجه سلوك خاص بكل مجموعة يُلحق بسياق الوكيل.

أوضاع التنشيط هي `mention` و`always`. يتم ربط `requireMention: true` بـ
`mention`؛ ويتم ربط `requireMention: false` بـ `always`. يتفوق تجاوز التنشيط
على مستوى الجلسة، عند وجوده، على التهيئة.

قائمة الانتظار الواردة تكون لكل نظير. تحصل نظراء المجموعات على حد أكبر لقائمة الانتظار، وتحافظ على رسائل البشر
قبل المحادثات الصادرة من البوت عند الامتلاء، وتدمج دفعات رسائل المجموعة العادية
في دور واحد منسوب. تظل أوامر الشرطة المائلة تُنفذ واحداً تلو الآخر.

### الصوت (STT / TTS)

يدعم STT وTTS تهيئة بمستويين مع رجوع حسب الأولوية:

| الإعداد | خاص بالـ Plugin                                           | رجوع Framework              |
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
        qq-main: {
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
فوق تهيئة TTS للقناة/العالمية.

تُعرض مرفقات صوت QQ الواردة للوكلاء كبيانات وصفية لوسائط صوتية مع
إبقاء ملفات الصوت الخام خارج `MediaPaths` العامة. تؤدي ردود النص العادي
`[[audio_as_voice]]` إلى توليف TTS وإرسال رسالة صوت QQ أصلية عند تهيئة TTS.

يمكن أيضاً ضبط سلوك رفع/تحويل ترميز الصوت الصادر باستخدام
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## التنسيقات المستهدفة

| التنسيق                   | الوصف              |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | محادثة خاصة (C2C) |
| `qqbot:group:GROUP_OPENID` | محادثة مجموعة     |
| `qqbot:channel:CHANNEL_ID` | قناة guild         |

> لكل بوت مجموعته الخاصة من OpenIDs للمستخدمين. لا يمكن استخدام OpenID مستلم بواسطة Bot A **لإرسال**
> الرسائل عبر Bot B.

## أوامر الشرطة المائلة

الأوامر المضمنة التي يتم اعتراضها قبل قائمة انتظار الذكاء الاصطناعي:

| الأمر          | الوصف                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | اختبار زمن الاستجابة                                                                                     |
| `/bot-version` | عرض إصدار OpenClaw framework                                                                             |
| `/bot-help`    | سرد جميع الأوامر                                                                                         |
| `/bot-me`      | عرض معرّف مستخدم QQ الخاص بالمرسل (openid) لإعداد `allowFrom`/`groupAllowFrom`                           |
| `/bot-upgrade` | عرض رابط دليل ترقية QQBot                                                                                |
| `/bot-logs`    | تصدير سجلات gateway الحديثة كملف                                                                         |
| `/bot-approve` | الموافقة على إجراء QQ Bot معلّق (على سبيل المثال، تأكيد رفع C2C أو مجموعة) عبر التدفق الأصلي. |

ألحق `?` بأي أمر للحصول على مساعدة الاستخدام (على سبيل المثال `/bot-upgrade ?`).

أوامر الإدارة (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) مخصصة للرسائل المباشرة فقط وتتطلب وجود openid الخاص بالمرسل في قائمة `allowFrom` صريحة لا تحتوي على wildcard. يسمح wildcard `allowFrom: ["*"]` بالمحادثة لكنه لا يمنح وصولاً إلى أوامر الإدارة. تطابق رسائل المجموعات `groupAllowFrom` أولاً ثم ترجع إلى `allowFrom`. يؤدي تشغيل أمر إدارة في مجموعة إلى إرجاع تلميح بدلاً من إسقاطه بصمت.

## بنية المحرك

يأتي QQ Bot كمحرك مكتفٍ ذاتياً داخل الـ Plugin:

- يمتلك كل حساب مجموعة موارد معزولة (اتصال WebSocket، عميل API، ذاكرة تخزين مؤقت للرمز المميز، جذر تخزين الوسائط) مرتبطة بـ `appId`. لا تشترك الحسابات أبداً في الحالة الواردة/الصادرة.
- يوسم المسجل متعدد الحسابات أسطر السجل بالحساب المالك حتى تبقى التشخيصات قابلة للفصل عند تشغيل عدة بوتات ضمن gateway واحد.
- تشترك مسارات الوارد والصادر وجسر gateway في جذر حمولة وسائط واحد ضمن `~/.openclaw/media`، بحيث تهبط عمليات الرفع والتنزيل وذاكرات التخزين المؤقت لتحويل الترميز ضمن دليل محمي واحد بدلاً من شجرة لكل نظام فرعي.
- يمر تسليم الوسائط الغنية عبر مسار `sendMedia` واحد لأهداف C2C والمجموعات. تستخدم الملفات المحلية والمخازن المؤقتة التي تتجاوز حد الملفات الكبيرة نقاط نهاية الرفع المجزأ الخاصة بـ QQ، بينما تستخدم الحمولات الأصغر واجهة media API ذات الطلب الواحد.
- يمكن نسخ بيانات الاعتماد احتياطياً واستعادتها كجزء من لقطات بيانات اعتماد OpenClaw القياسية؛ يعيد المحرك إرفاق مجموعة موارد كل حساب عند الاستعادة دون طلب اقتران جديد برمز QR.

## الإعداد عبر رمز QR

كبديل عن لصق `AppID:AppSecret` يدوياً، يدعم المحرك تدفق إعداد عبر رمز QR لربط QQ Bot بـ OpenClaw:

1. شغّل مسار إعداد QQ Bot (على سبيل المثال `openclaw channels add --channel qqbot`) واختر تدفق رمز QR عند المطالبة.
2. امسح رمز QR الذي تم إنشاؤه باستخدام تطبيق الهاتف المرتبط بـ QQ Bot المستهدف.
3. وافق على الاقتران على الهاتف. يحفظ OpenClaw بيانات الاعتماد المرجعة في `credentials/` ضمن نطاق الحساب الصحيح.

تظهر مطالبات الموافقة التي ينشئها البوت نفسه (على سبيل المثال، تدفقات "السماح بهذا الإجراء؟" التي يكشفها QQ Bot API) كمطالبات OpenClaw أصلية يمكنك قبولها باستخدام `/bot-approve` بدلاً من الرد عبر عميل QQ الخام.

## استكشاف الأخطاء وإصلاحها

- **يرد البوت "gone to Mars":** بيانات الاعتماد غير مهيأة أو Gateway غير مشغّل.
- **لا توجد رسائل واردة:** تحقق من صحة `appId` و`clientSecret`، ومن أن
  البوت مفعّل على QQ Open Platform.
- **ردود ذاتية متكررة:** يسجل OpenClaw فهارس مراجع QQ الصادرة باعتبارها
  صادرة من البوت ويتجاهل الأحداث الواردة التي يطابق `msgIdx` الحالي الخاص بها
  حساب البوت نفسه. يمنع ذلك حلقات صدى المنصة مع الاستمرار في السماح للمستخدمين
  باقتباس رسائل البوت السابقة أو الرد عليها.
- **الإعداد باستخدام `--token-file` لا يزال يظهر غير مهيأ:** يضبط `--token-file`
  AppSecret فقط. ما زلت بحاجة إلى `appId` في التهيئة أو `QQBOT_APP_ID`.
- **الرسائل الاستباقية لا تصل:** قد يعترض QQ الرسائل التي يبدأها البوت إذا
  لم يتفاعل المستخدم مؤخراً.
- **الصوت لا يُنسخ نصياً:** تأكد من تهيئة STT وأن المزوّد قابل للوصول.

## ذات صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
