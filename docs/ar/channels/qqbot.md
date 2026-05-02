---
read_when:
    - تريد ربط OpenClaw بـ QQ
    - تحتاج إلى إعداد بيانات اعتماد QQ Bot
    - تريد دعم QQ Bot للمحادثات الجماعية أو الخاصة
summary: إعداد بوت QQ وتكوينه واستخدامه
title: بوت QQ
x-i18n:
    generated_at: "2026-05-02T07:18:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d37dd5846ecf07b1e3e8729faa23877780abdd40577b8dab61ea1ac9399885a
    source_path: channels/qqbot.md
    workflow: 16
---

يتصل QQ Bot بـ OpenClaw عبر QQ Bot API الرسمي (Gateway WebSocket). يدعم
Plugin الدردشة الخاصة C2C، ورسائل @ في المجموعات، ورسائل قنوات المجتمعات مع
وسائط غنية (صور، صوت، فيديو، ملفات).

الحالة: Plugin قابل للتنزيل. الرسائل المباشرة، ومحادثات المجموعات، وقنوات المجتمعات،
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
3. ابحث عن **AppID** و **AppSecret** في صفحة إعدادات البوت وانسخهما.

> لا يُخزّن AppSecret كنص عادي — إذا غادرت الصفحة من دون حفظه،
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

ملاحظات:

- ينطبق بديل البيئة على حساب QQ Bot الافتراضي فقط.
- يوفّر `openclaw channels add --channel qqbot --token-file ...`
  AppSecret فقط؛ يجب أن يكون AppID مضبوطًا مسبقًا في التكوين أو `QQBOT_APP_ID`.
- يقبل `clientSecret` أيضًا إدخال SecretRef، وليس سلسلة نص عادي فقط.

### إعداد متعدد الحسابات

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
للرموز (معزولة حسب `appId`).

أضف بوتًا ثانيًا عبر CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### محادثات المجموعات

يستخدم دعم محادثات المجموعات في QQ Bot معرّفات OpenID الخاصة بمجموعات QQ، لا أسماء العرض. أضف البوت
إلى مجموعة، ثم اذكره أو اضبط المجموعة لتعمل من دون ذكر.

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

تضبط `groups["*"]` الإعدادات الافتراضية لكل مجموعة، ويتجاوز إدخال
`groups.GROUP_OPENID` محدد تلك الإعدادات الافتراضية لمجموعة واحدة. تتضمن
إعدادات المجموعة:

- `requireMention`: يتطلب @mention قبل أن يرد البوت. الافتراضي: `true`.
- `ignoreOtherMentions`: يسقط الرسائل التي تذكر شخصًا آخر ولا تذكر البوت.
- `historyLimit`: يحتفظ برسائل المجموعة الحديثة التي لا تتضمن ذكرًا كسياق للدور التالي الذي يتضمن ذكرًا. اضبطه على `0` للتعطيل.
- `toolPolicy`: `full` أو `restricted` أو `none` للأدوات ضمن نطاق المجموعة.
- `name`: تسمية ودية تُستخدم في السجلات وسياق المجموعة.
- `prompt`: موجّه سلوك خاص بكل مجموعة يُلحق بسياق الوكيل.

أوضاع التفعيل هي `mention` و `always`. يتطابق `requireMention: true` مع
`mention`؛ ويتطابق `requireMention: false` مع `always`. وعند وجود تجاوز تفعيل
على مستوى الجلسة، تكون له الأولوية على التكوين.

الطابور الوارد يكون لكل نظير. تحصل نظراء المجموعات على حد طابور أكبر، وتُبقي
رسائل البشر قبل المحادثات التي ألّفها البوت عند الامتلاء، وتدمج دفعات رسائل
المجموعة العادية في دور واحد منسوب. تظل أوامر الشرطة المائلة تعمل واحدًا تلو الآخر.

### الصوت (STT / TTS)

يدعم STT و TTS تكوينًا من مستويين مع بديل حسب الأولوية:

| الإعداد | خاص بـ Plugin                                            | بديل إطار العمل              |
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
تستخدم تجاوزات TTS على مستوى الحساب البنية نفسها مثل `messages.tts` وتُدمج بعمق
فوق تكوين TTS على مستوى القناة/العمومي.

تُعرض مرفقات الصوت الواردة من QQ للوكلاء كبيانات تعريف وسائط صوتية مع
إبقاء ملفات الصوت الخام خارج `MediaPaths` العامة. تقوم ردود النص العادي
`[[audio_as_voice]]` بتوليف TTS وإرسال رسالة صوتية أصلية في QQ عندما يكون TTS
مكوّنًا.

يمكن أيضًا ضبط سلوك رفع/تحويل ترميز الصوت الصادر باستخدام
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## تنسيقات الهدف

| التنسيق                   | الوصف                 |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | دردشة خاصة (C2C) |
| `qqbot:group:GROUP_OPENID` | دردشة مجموعة         |
| `qqbot:channel:CHANNEL_ID` | قناة مجتمع      |

> لكل بوت مجموعته الخاصة من OpenIDs للمستخدمين. لا يمكن استخدام OpenID استقبله Bot A **لإرسال**
> رسائل عبر Bot B.

## أوامر الشرطة المائلة

أوامر مضمّنة تُعترض قبل طابور الذكاء الاصطناعي:

| الأمر        | الوصف                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | اختبار زمن الاستجابة                                                                                             |
| `/bot-version` | عرض إصدار إطار عمل OpenClaw                                                                      |
| `/bot-help`    | سرد كل الأوامر                                                                                        |
| `/bot-me`      | عرض معرّف مستخدم QQ للمرسل (openid) لإعداد `allowFrom`/`groupAllowFrom`                             |
| `/bot-upgrade` | عرض رابط دليل ترقية QQBot                                                                        |
| `/bot-logs`    | تصدير سجلات Gateway الحديثة كملف                                                                     |
| `/bot-approve` | الموافقة على إجراء QQ Bot معلّق (على سبيل المثال، تأكيد رفع C2C أو مجموعة) عبر التدفق الأصلي. |

ألحق `?` بأي أمر للحصول على مساعدة الاستخدام (مثلًا `/bot-upgrade ?`).

أوامر المسؤول (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) مخصصة للرسائل المباشرة فقط وتتطلب وجود openid الخاص بالمرسل في قائمة `allowFrom` صريحة وغير بدل عام. يسمح `allowFrom: ["*"]` بالمحادثة لكنه لا يمنح صلاحية الوصول إلى أوامر المسؤول. تُطابق رسائل المجموعات مع `groupAllowFrom` أولًا ثم تعود إلى `allowFrom`. يؤدي تشغيل أمر مسؤول في مجموعة إلى إرجاع تلميح بدل إسقاطه بصمت.

## بنية المحرك

يأتي QQ Bot كمحرك مستقل داخل Plugin:

- يملك كل حساب مكدس موارد معزولًا (اتصال WebSocket، عميل API، ذاكرة تخزين مؤقت للرموز، جذر تخزين الوسائط) مفهرسًا حسب `appId`. لا تشارك الحسابات أبدًا حالة الوارد/الصادر.
- يوسم المسجّل متعدد الحسابات أسطر السجل بالحساب المالك حتى تبقى التشخيصات قابلة للفصل عند تشغيل عدة بوتات تحت Gateway واحد.
- تشترك مسارات الوارد والصادر وجسر Gateway في جذر حمولة وسائط واحد تحت `~/.openclaw/media`، بحيث تهبط عمليات الرفع والتنزيل وذواكر التخزين المؤقت لتحويل الترميز تحت دليل واحد محمي بدل شجرة لكل نظام فرعي.
- يمر تسليم الوسائط الغنية عبر مسار `sendMedia` واحد لأهداف C2C والمجموعات. تستخدم الملفات المحلية والمخازن المؤقتة التي تتجاوز حد الملفات الكبيرة نقاط نهاية الرفع المجزأ في QQ، بينما تستخدم الحمولات الأصغر API الوسائط أحادي العملية.
- يمكن نسخ بيانات الاعتماد احتياطيًا واستعادتها كجزء من لقطات بيانات اعتماد OpenClaw القياسية؛ يعيد المحرك إرفاق مكدس موارد كل حساب عند الاستعادة من دون الحاجة إلى اقتران جديد برمز QR.

## الإلحاق عبر رمز QR

كبديل للصق `AppID:AppSecret` يدويًا، يدعم المحرك تدفق إلحاق عبر رمز QR لربط QQ Bot بـ OpenClaw:

1. شغّل مسار إعداد QQ Bot (على سبيل المثال `openclaw channels add --channel qqbot`) واختر تدفق رمز QR عند المطالبة.
2. امسح رمز QR المُنشأ باستخدام تطبيق الهاتف المرتبط بـ QQ Bot الهدف.
3. وافق على الاقتران على الهاتف. يحفظ OpenClaw بيانات الاعتماد المُعادة في `credentials/` ضمن نطاق الحساب الصحيح.

تظهر مطالبات الموافقة التي ينشئها البوت نفسه (على سبيل المثال، تدفقات "السماح بهذا الإجراء؟" التي يعرضها QQ Bot API) كمطالبات OpenClaw أصلية يمكنك قبولها باستخدام `/bot-approve` بدل الرد عبر عميل QQ الخام.

## استكشاف الأخطاء وإصلاحها

- **يرد البوت "gone to Mars":** بيانات الاعتماد غير مكوّنة أو Gateway غير مشغّل.
- **لا توجد رسائل واردة:** تحقق من صحة `appId` و `clientSecret`، وأن
  البوت مفعّل على QQ Open Platform.
- **ردود ذاتية متكررة:** يسجل OpenClaw فهارس مراجع الصادر في QQ على أنها
  مؤلفة بواسطة البوت ويتجاهل الأحداث الواردة التي يطابق `msgIdx` الحالي لها
  حساب البوت نفسه. يمنع هذا حلقات صدى المنصة مع السماح للمستخدمين
  باقتباس رسائل البوت السابقة أو الرد عليها.
- **الإعداد باستخدام `--token-file` ما زال يظهر كغير مكوّن:** يضبط `--token-file`
  AppSecret فقط. ما زلت تحتاج إلى `appId` في التكوين أو `QQBOT_APP_ID`.
- **الرسائل الاستباقية لا تصل:** قد يعترض QQ الرسائل التي يبدأها البوت إذا
  لم يتفاعل المستخدم مؤخرًا.
- **الصوت لا يُنسخ نصيًا:** تأكد من تكوين STT وأن المزوّد قابل للوصول.

## ذات صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
