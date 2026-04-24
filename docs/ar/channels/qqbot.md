---
read_when:
    - تريد ربط OpenClaw بـ QQ
    - تحتاج إلى إعداد بيانات اعتماد QQ Bot
    - تريد دعم المجموعات أو المحادثات الخاصة في QQ Bot
summary: إعداد QQ Bot وتكوينه واستخدامه
title: بوت QQ
x-i18n:
    generated_at: "2026-04-24T07:31:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8127ec59d3a17222e7fe883e77aa1c7d384b231b7d479385421df51c995f7dc2
    source_path: channels/qqbot.md
    workflow: 15
---

يتصل QQ Bot بـ OpenClaw عبر QQ Bot API الرسمي (بوابة WebSocket). يدعم
الـ Plugin المحادثات الخاصة C2C، ورسائل @ في المجموعات، ورسائل قنوات guild مع
وسائط غنية (صور، وصوت، وفيديو، وملفات).

الحالة: Plugin مضمّن. الرسائل المباشرة، ودردشات المجموعات، وقنوات guild،
والوسائط مدعومة. التفاعلات وسلاسل الرسائل غير مدعومة.

## Plugin مضمّن

تتضمن إصدارات OpenClaw الحالية QQ Bot، لذا لا تحتاج الإصدارات المعبأة العادية
إلى خطوة `openclaw plugins install` منفصلة.

## الإعداد

1. انتقل إلى [QQ Open Platform](https://q.qq.com/) وامسح رمز QR باستخدام
   تطبيق QQ على هاتفك للتسجيل / تسجيل الدخول.
2. انقر على **Create Bot** لإنشاء بوت QQ جديد.
3. اعثر على **AppID** و**AppSecret** في صفحة إعدادات البوت وانسخهما.

> لا يتم تخزين AppSecret كنص عادي — إذا غادرت الصفحة من دون حفظه،
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

## الإعداد

الحد الأدنى من الإعدادات:

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

- ينطبق الرجوع إلى متغيرات البيئة على حساب QQ Bot الافتراضي فقط.
- يوفّر `openclaw channels add --channel qqbot --token-file ...`
  AppSecret فقط؛ ويجب أن يكون AppID مضبوطًا مسبقًا في الإعدادات أو في `QQBOT_APP_ID`.
- يقبل `clientSecret` أيضًا إدخال SecretRef، وليس مجرد سلسلة نصية عادية.

### إعداد حسابات متعددة

شغّل عدة بوتات QQ ضمن مثيل OpenClaw واحد:

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

يشغّل كل حساب اتصال WebSocket خاصًا به ويحافظ على ذاكرة تخزين مؤقت للرمز المميز مستقلة
(ومعزولة بواسطة `appId`).

أضف بوتًا ثانيًا عبر CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### الصوت (STT / TTS)

يدعم STT وTTS إعدادًا ذا مستويين مع رجوع حسب الأولوية:

| الإعداد | خاص بالـ Plugin       | رجوع إطار العمل              |
| ------- | --------------------- | ---------------------------- |
| STT     | `channels.qqbot.stt`  | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`  | `messages.tts`               |

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
    },
  },
}
```

اضبط `enabled: false` على أيٍّ منهما لتعطيله.

يمكن أيضًا ضبط سلوك رفع/تحويل الصوت الصادر باستخدام
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## التنسيقات المستهدفة

| التنسيق                   | الوصف               |
| ------------------------- | ------------------- |
| `qqbot:c2c:OPENID`        | محادثة خاصة (C2C)   |
| `qqbot:group:GROUP_OPENID` | دردشة مجموعة        |
| `qqbot:channel:CHANNEL_ID` | قناة Guild          |

> لكل بوت مجموعة OpenID خاصة به للمستخدمين. ولا **يمكن**
> استخدام OpenID تم استلامه بواسطة Bot A لإرسال رسائل عبر Bot B.

## أوامر الشرطة المائلة

أوامر مدمجة يتم اعتراضها قبل قائمة انتظار الذكاء الاصطناعي:

| الأمر          | الوصف                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | اختبار زمن الاستجابة                                                                                     |
| `/bot-version` | عرض إصدار إطار عمل OpenClaw                                                                             |
| `/bot-help`    | سرد جميع الأوامر                                                                                         |
| `/bot-upgrade` | عرض رابط دليل ترقية QQBot                                                                                |
| `/bot-logs`    | تصدير سجلات Gateway الحديثة كملف                                                                         |
| `/bot-approve` | الموافقة على إجراء QQ Bot معلّق (على سبيل المثال، تأكيد رفع C2C أو مجموعة) عبر التدفق الأصلي. |

أضف `?` إلى أي أمر للحصول على مساعدة الاستخدام (على سبيل المثال `/bot-upgrade ?`).

## بنية المحرك

يأتي QQ Bot كمحرك مستقل داخل الـ Plugin:

- يمتلك كل حساب مكدس موارد معزولًا (اتصال WebSocket، وعميل API، وذاكرة تخزين مؤقت للرمز المميز، وجذر تخزين الوسائط) مرتبطًا بـ `appId`. لا تشارك الحسابات حالة الإدخال/الإخراج أبدًا.
- يضيف مسجل الحسابات المتعددة وسمًا لأسطر السجل بالحساب المالك، بحيث تظل التشخيصات قابلة للفصل عند تشغيل عدة بوتات تحت Gateway واحد.
- تشترك مسارات الإدخال، والإخراج، وجسر Gateway في جذر حمولة وسائط واحد تحت `~/.openclaw/media`، بحيث تصل الرفعات والتنزيلات وذاكرات التخزين المؤقت للتحويل إلى دليل محمي واحد بدلًا من شجرة لكل نظام فرعي.
- يمكن نسخ بيانات الاعتماد احتياطيًا واستعادتها كجزء من لقطات بيانات اعتماد OpenClaw القياسية؛ ويعيد المحرك إرفاق مكدس موارد كل حساب عند الاستعادة من دون الحاجة إلى اقتران جديد عبر رمز QR.

## الإعداد عبر رمز QR

كبديل للصق `AppID:AppSecret` يدويًا، يدعم المحرك تدفق إعداد عبر رمز QR لربط QQ Bot بـ OpenClaw:

1. شغّل مسار إعداد QQ Bot (على سبيل المثال `openclaw channels add --channel qqbot`) واختر تدفق رمز QR عند المطالبة.
2. امسح رمز QR الذي تم إنشاؤه باستخدام تطبيق الهاتف المرتبط بـ QQ Bot المستهدف.
3. وافق على الاقتران على الهاتف. يحفظ OpenClaw بيانات الاعتماد المعادة داخل `credentials/` ضمن نطاق الحساب الصحيح.

تظهر مطالبات الموافقة التي ينشئها البوت نفسه (على سبيل المثال تدفقات "السماح بهذا الإجراء؟" التي تكشفها QQ Bot API) كمطالبات OpenClaw أصلية يمكنك قبولها باستخدام `/bot-approve` بدلًا من الرد عبر عميل QQ الخام.

## استكشاف الأخطاء وإصلاحها

- **يرد البوت بعبارة "gone to Mars":** بيانات الاعتماد غير مضبوطة أو أن Gateway لم يبدأ.
- **لا توجد رسائل واردة:** تحقق من أن `appId` و`clientSecret` صحيحان، وأن
  البوت مفعّل على QQ Open Platform.
- **ما زال الإعداد باستخدام `--token-file` يظهر على أنه غير مضبوط:** `--token-file` يضبط
  AppSecret فقط. وما زلت تحتاج إلى `appId` في الإعدادات أو `QQBOT_APP_ID`.
- **الرسائل الاستباقية لا تصل:** قد يعترض QQ الرسائل التي يبدأها البوت إذا
  لم يتفاعل المستخدم مؤخرًا.
- **الصوت لا يُفرَّغ نصيًا:** تأكد من إعداد STT وأن المزوّد قابل للوصول.

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
