---
read_when:
    - تريد ربط OpenClaw بـ QQ
    - تحتاج إلى إعداد بيانات اعتماد QQ Bot
    - تريد دعم QQ Bot للمجموعات أو الدردشات الخاصة
summary: إعداد QQ Bot وتكوينه واستخدامه
title: بوت QQ
x-i18n:
    generated_at: "2026-06-27T17:12:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

يتصل QQ Bot بـ OpenClaw عبر QQ Bot API الرسمي (Gateway WebSocket). يدعم
Plugin محادثات C2C الخاصة، و@messages في المجموعات، ورسائل قنوات النقابة مع
وسائط غنية (صور، صوت، فيديو، ملفات).

الحالة: Plugin قابل للتنزيل. الرسائل المباشرة، ومحادثات المجموعات، وقنوات النقابات،
والوسائط مدعومة. التفاعلات وسلاسل المحادثات غير مدعومة.

## التثبيت

ثبّت QQ Bot قبل الإعداد:

```bash
openclaw plugins install @openclaw/qqbot
```

## الإعداد

1. انتقل إلى [QQ Open Platform](https://q.qq.com/) وامسح رمز QR باستخدام
   QQ على هاتفك للتسجيل / تسجيل الدخول.
2. انقر على **Create Bot** لإنشاء QQ bot جديد.
3. ابحث عن **AppID** و**AppSecret** في صفحة إعدادات bot وانسخهما.

> لا يتم تخزين AppSecret كنص عادي — إذا غادرت الصفحة دون حفظه،
> فسيتعين عليك إنشاء واحد جديد.

4. أضف القناة:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. أعد تشغيل Gateway.

مسارات الإعداد التفاعلية:

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

متغيرات env للحساب الافتراضي:

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

AppSecret باستخدام SecretRef من env:

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

- ينطبق بديل env على حساب QQ Bot الافتراضي فقط.
- يوفر `openclaw channels add --channel qqbot --token-file ...`
  AppSecret فقط؛ يجب أن يكون AppID مضبوطا مسبقا في التكوين أو `QQBOT_APP_ID`.
- يقبل `clientSecret` أيضا إدخال SecretRef، وليس سلسلة نص عادي فقط.
- سلاسل العلامات القديمة `secretref:/...` ليست قيما صالحة لـ `clientSecret`؛
  استخدم كائنات SecretRef منظمة مثل المثال أعلاه.

### إعداد حسابات متعددة

شغّل عدة QQ bots ضمن نسخة OpenClaw واحدة:

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

يطلق كل حساب اتصال WebSocket خاصا به ويحافظ على ذاكرة تخزين مؤقت مستقلة
للرموز (معزولة بواسطة `appId`).

أضف bot ثانيا عبر CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### محادثات المجموعات

يستخدم دعم محادثات مجموعات QQ Bot قيم OpenID لمجموعات QQ، وليس أسماء العرض. أضف bot
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
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

يضبط `groups["*"]` القيم الافتراضية لكل مجموعة، ويتجاوز إدخال
`groups.GROUP_OPENID` الملموس تلك القيم الافتراضية لمجموعة واحدة. تتضمن إعدادات
المجموعة:

- `requireMention`: يتطلب @mention قبل أن يرد bot. الافتراضي: `true`.
- `commandLevel`: يتحكم في أوامر الشرطة المائلة المدمجة التي يمكن تشغيلها في المجموعات.
  الافتراضي: `all`، وهذا يحافظ على سلوك مجموعات QQBot السابق عند حذف
  الإعداد.
- `ignoreOtherMentions`: يتجاهل الرسائل التي تذكر شخصا آخر وليس bot.
- `historyLimit`: يحتفظ برسائل المجموعة الحديثة غير المتضمنة ذكرا كسياق للدور المذكور التالي. اضبطه على `0` للتعطيل.
- `tools`: السماح بالأدوات أو رفضها للمجموعة بأكملها.
- `toolsBySender`: تجاوزات أدوات المجموعة لكل مرسل؛ راجع [المجموعات](/ar/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: تسمية ودية مستخدمة في السجلات وسياق المجموعة.
- `prompt`: موجه سلوك لكل مجموعة يضاف إلى سياق الوكيل.

يقبل `commandLevel` ما يلي:

- `all`: يبقي الأوامر المدمجة المعروفة متاحة كما كانت. قد تبقى بعض الأوامر
  مخفية من القوائم، لكن يمكن للمستخدمين المصرح لهم تشغيلها في المجموعة.
- `safety`: يسمح بأوامر التعاون الشائعة مثل `/help` و`/btw` و
  `/stop`؛ ويطلب من المستخدمين تشغيل الأوامر الحساسة مثل `/config` و`/tools` و
  `/bash` في محادثة خاصة.
- `strict`: يسمح فقط بعناصر التحكم في جلسة المجموعة اللازمة لتشغيل المجموعة
  الصارم. يظل `/stop` عاجلا حتى يتمكن مرسل مصرح له من مقاطعة
  تشغيل نشط.

تم إيقاف إدخالات QQBot القديمة `toolPolicy`. شغّل `openclaw doctor --fix` لترحيلها إلى `tools`.

أوضاع التفعيل هي `mention` و`always`. يتم تعيين `requireMention: true` إلى
`mention`؛ ويتم تعيين `requireMention: false` إلى `always`. يتقدم تجاوز التفعيل
على مستوى الجلسة، عند وجوده، على التكوين.

تكون قائمة الانتظار الواردة لكل نظير. تحصل نظراء المجموعات على حد أكبر لقائمة الانتظار،
وتبقي رسائل البشر قبل الأحاديث المنشأة بواسطة bot عند الامتلاء، وتدمج دفعات
رسائل المجموعة العادية في دور واحد منسوب. ما زالت أوامر الشرطة المائلة تعمل واحدا تلو الآخر.

### الصوت (STT / TTS)

يدعم STT وTTS تكوينا من مستويين مع بديل ذي أولوية:

| الإعداد | خاص بالـ Plugin                                          | بديل إطار العمل              |
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
تستخدم تجاوزات TTS على مستوى الحساب الشكل نفسه مثل `messages.tts` وتندمج بعمق
فوق تكوين TTS للقناة/العام.

تُعرض مرفقات الصوت الواردة من QQ للوكلاء كبيانات تعريف وسائط صوتية مع
إبقاء ملفات الصوت الخام خارج `MediaPaths` العامة. تؤدي ردود النص العادي
`[[audio_as_voice]]` إلى توليد TTS وإرسال رسالة صوت QQ أصلية عندما يكون TTS
مكونا.

يمكن أيضا ضبط سلوك رفع/تحويل ترميز الصوت الصادر باستخدام
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## تنسيقات الهدف

| التنسيق                   | الوصف              |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | محادثة خاصة (C2C) |
| `qqbot:group:GROUP_OPENID` | محادثة مجموعة     |
| `qqbot:channel:CHANNEL_ID` | قناة نقابة        |

> لكل bot مجموعته الخاصة من OpenIDs المستخدمين. لا يمكن استخدام OpenID مستلم من Bot A
> لإرسال رسائل عبر Bot B.

## أوامر الشرطة المائلة

الأوامر المدمجة التي يتم اعتراضها قبل قائمة انتظار الذكاء الاصطناعي:

| الأمر          | الوصف                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `/bot-ping`    | اختبار زمن الاستجابة                                                                                  |
| `/bot-version` | عرض إصدار إطار عمل OpenClaw                                                                            |
| `/bot-help`    | سرد جميع الأوامر                                                                                       |
| `/bot-me`      | عرض معرف مستخدم QQ للمرسل (openid) لإعداد `allowFrom`/`groupAllowFrom`                                 |
| `/bot-upgrade` | عرض رابط دليل ترقية QQBot                                                                              |
| `/bot-logs`    | تصدير سجلات Gateway الحديثة كملف                                                                       |
| `/bot-approve` | الموافقة على إجراء QQ Bot معلق (على سبيل المثال، تأكيد رفع C2C أو مجموعة) عبر التدفق الأصلي. |

أضف `?` إلى أي أمر للحصول على مساعدة الاستخدام (على سبيل المثال `/bot-upgrade ?`).

أوامر المسؤول (`/bot-me`، `/bot-upgrade`، `/bot-logs`، `/bot-clear-storage`، `/bot-streaming`، `/bot-approve`) مخصصة للرسائل المباشرة فقط وتتطلب وجود openid للمرسل في قائمة `allowFrom` صريحة وغير شاملة. تسمح `allowFrom: ["*"]` الشاملة بالمحادثة لكنها لا تمنح وصولا إلى أوامر المسؤول. تطابق رسائل المجموعات `groupAllowFrom` أولا ثم تعود إلى `allowFrom`. يؤدي تشغيل أمر مسؤول في مجموعة إلى إرجاع تلميح بدلا من إسقاطه بصمت.

عندما تستخدم موافقات تنفيذ QQ Bot البديل الافتراضي للمحادثة نفسها، تتبع نقرات
أزرار الموافقة الأصلية قائمة السماح الصريحة غير الشاملة نفسها للأوامر. لمنح
وصول الموافقة فقط دون وصول أوسع إلى الأوامر، اضبط
`channels.qqbot.execApprovals.approvers`.

## بنية المحرك

يأتي QQ Bot كمحرك مستقل داخل Plugin:

- يملك كل حساب مكدس موارد معزولا (اتصال WebSocket، عميل API، ذاكرة تخزين مؤقت للرموز، جذر تخزين الوسائط) مفهرسا بواسطة `appId`. لا تشارك الحسابات أبدا الحالة الواردة/الصادرة.
- يوسم مسجل الحسابات المتعددة أسطر السجل بالحساب المالك حتى تبقى التشخيصات قابلة للفصل عند تشغيل عدة bots ضمن Gateway واحد.
- تشترك مسارات الوارد والصادر وجسر Gateway في جذر حمولة وسائط واحد تحت `~/.openclaw/media`، لذلك تصل الرفوعات والتنزيلات وذاكرات تحويل الترميز المؤقتة إلى دليل واحد محمي بدلا من شجرة لكل نظام فرعي.
- يمر تسليم الوسائط الغنية عبر مسار `sendMedia` واحد لأهداف C2C والمجموعات. تستخدم الملفات المحلية والمخازن المؤقتة التي تتجاوز حد الملفات الكبيرة نقاط نهاية الرفع المجزأ الخاصة بـ QQ، بينما تستخدم الحمولات الأصغر API الوسائط أحادية العملية.
- يمكن نسخ بيانات الاعتماد احتياطيا واستعادتها كجزء من لقطات بيانات اعتماد OpenClaw القياسية؛ يعيد المحرك إرفاق مكدس موارد كل حساب عند الاستعادة دون الحاجة إلى زوج رمز QR جديد.

## الإعداد عبر رمز QR

كبديل للصق `AppID:AppSecret` يدويا، يدعم المحرك تدفق إعداد عبر رمز QR لربط QQ Bot بـ OpenClaw:

1. شغّل مسار إعداد QQ Bot (على سبيل المثال `openclaw channels add --channel qqbot`) واختر تدفق رمز QR عند المطالبة.
2. امسح رمز QR الذي تم إنشاؤه باستخدام تطبيق الهاتف المرتبط بـ QQ Bot الهدف.
3. وافق على الاقتران على الهاتف. يحفظ OpenClaw بيانات الاعتماد التي تم إرجاعها في `credentials/` ضمن نطاق الحساب الصحيح.

تظهر مطالبات الموافقة التي ينشئها bot نفسه (على سبيل المثال، تدفقات "السماح بهذا الإجراء؟" التي تعرضها QQ Bot API) كمطالبات OpenClaw أصلية يمكنك قبولها باستخدام `/bot-approve` بدلا من الرد عبر عميل QQ الخام.

## استكشاف الأخطاء وإصلاحها

- **يردّ البوت "ذهب إلى المريخ":** لم يتم تكوين بيانات الاعتماد أو لم يتم تشغيل Gateway.
- **لا توجد رسائل واردة:** تحقّق من أن `appId` و`clientSecret` صحيحان، وأن
  البوت مفعّل على QQ Open Platform.
- **ردود ذاتية متكررة:** يسجّل OpenClaw فهارس مراجع QQ الصادرة على أنها
  صادرة عن البوت ويتجاهل الأحداث الواردة التي يطابق فيها `msgIdx` الحالي
  حساب البوت نفسه. يمنع هذا حلقات صدى المنصة مع السماح للمستخدمين في الوقت نفسه
  باقتباس رسائل البوت السابقة أو الرد عليها.
- **لا يزال الإعداد باستخدام `--token-file` يظهر كغير مكوّن:** يعيّن `--token-file`
  قيمة AppSecret فقط. ما زلت تحتاج إلى `appId` في الإعدادات أو `QQBOT_APP_ID`.
- **الرسائل الاستباقية لا تصل:** قد يعترض QQ الرسائل التي يبدأها البوت إذا
  لم يتفاعل المستخدم مؤخرًا.
- **لم يتم تفريغ الصوت نصيًا:** تأكّد من تكوين STT وأن المزوّد قابل للوصول.

## ذات صلة

- [الإقران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
