---
read_when:
    - تريد ربط OpenClaw بـ QQ
    - تحتاج إلى إعداد بيانات اعتماد QQ Bot
    - تريد دعم QQ Bot للمجموعات أو الدردشة الخاصة
summary: إعداد QQ Bot وتهيئته واستخدامه
title: QQ bot
x-i18n:
    generated_at: "2026-04-26T11:24:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

يتصل QQ Bot بـ OpenClaw عبر واجهة QQ Bot API الرسمية (بوابة WebSocket). يدعم
الـ Plugin الدردشة الخاصة C2C، ورسائل @ في المجموعات، ورسائل قنوات guild مع
وسائط غنية (الصور، والصوت، والفيديو، والملفات).

الحالة: Plugin مضمّن. الرسائل المباشرة، ودردشات المجموعات، وقنوات guild، والوسائط
مدعومة. أما التفاعلات والخيوط فغير مدعومة.

## Plugin مضمّن

تتضمن إصدارات OpenClaw الحالية QQ Bot، لذلك لا تحتاج البنيات المعبأة العادية
إلى خطوة `openclaw plugins install` منفصلة.

## الإعداد

1. انتقل إلى [QQ Open Platform](https://q.qq.com/) وامسح رمز QR باستخدام
   تطبيق QQ على هاتفك للتسجيل / تسجيل الدخول.
2. انقر على **Create Bot** لإنشاء QQ bot جديد.
3. اعثر على **AppID** و**AppSecret** في صفحة إعدادات البوت وانسخهما.

> لا يتم تخزين AppSecret كنص عادي — إذا غادرت الصفحة من دون حفظه،
> فسيتعين عليك إنشاء واحد جديد.

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

## التهيئة

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

AppSecret مدعوم عبر ملف:

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

### إعداد عدة حسابات

شغّل عدة QQ bots ضمن مثيل OpenClaw واحد:

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

يشغّل كل حساب اتصال WebSocket خاصًا به ويحافظ على ذاكرة تخزين مؤقت مستقلة
للرموز المميزة (ومعزولة بواسطة `appId`).

أضف بوتًا ثانيًا عبر CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### الصوت (STT / TTS)

يدعم STT وTTS إعدادًا على مستويين مع رجوع حسب الأولوية:

| الإعداد | خاص بالـ Plugin                                         | رجوع Framework              |
| ------- | ------------------------------------------------------- | --------------------------- |
| STT     | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`              |

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

اضبط `enabled: false` على أي منهما لتعطيله.
تستخدم تجاوزات TTS على مستوى الحساب نفس البنية المستخدمة في `messages.tts` وتُدمج
بشكل عميق فوق إعداد TTS الخاص بالقناة/العالمي.

تُعرَض مرفقات الصوت الواردة من QQ على الوكلاء كبيانات وصفية لوسائط صوتية مع
إبقاء ملفات الصوت الخام خارج `MediaPaths` العامة. تؤدي الردود النصية العادية
`[[audio_as_voice]]` إلى توليد TTS وإرسال رسالة صوتية أصلية في QQ عندما يكون TTS
مهيأً.

يمكن أيضًا ضبط سلوك رفع/تحويل الصوت الصادر عبر
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## تنسيقات الهدف

| التنسيق                   | الوصف              |
| ------------------------- | ------------------ |
| `qqbot:c2c:OPENID`        | دردشة خاصة (C2C)   |
| `qqbot:group:GROUP_OPENID` | دردشة مجموعة       |
| `qqbot:channel:CHANNEL_ID` | قناة guild         |

> لكل بوت مجموعة OpenID خاصة به للمستخدمين. لا يمكن استخدام OpenID تم استلامه
> بواسطة Bot A **لإرسال** الرسائل عبر Bot B.

## أوامر الشرطة المائلة

الأوامر المضمنة التي تُعترَض قبل قائمة انتظار الذكاء الاصطناعي:

| الأمر          | الوصف                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | اختبار زمن الاستجابة                                                                                  |
| `/bot-version` | عرض إصدار Framework الخاص بـ OpenClaw                                                                 |
| `/bot-help`    | سرد كل الأوامر                                                                                        |
| `/bot-upgrade` | عرض رابط دليل ترقية QQBot                                                                            |
| `/bot-logs`    | تصدير سجلات gateway الحديثة كملف                                                                     |
| `/bot-approve` | اعتماد إجراء QQ Bot معلّق (على سبيل المثال، تأكيد رفع C2C أو رفع مجموعة) عبر التدفق الأصلي.        |

أضف `?` إلى أي أمر للحصول على مساعدة الاستخدام (على سبيل المثال `/bot-upgrade ?`).

## بنية المحرك

يأتي QQ Bot كمحرك مستقل داخل الـ Plugin:

- يملك كل حساب حزمة موارد معزولة (اتصال WebSocket، وعميل API، وذاكرة تخزين مؤقت للرموز المميزة، وجذر تخزين الوسائط) ومفهرسة بواسطة `appId`. لا تشترك الحسابات أبدًا في حالة الإدخال/الإخراج.
- يضيف المسجل متعدد الحسابات وسمًا إلى أسطر السجل بالحساب المالك حتى تبقى التشخيصات قابلة للفصل عند تشغيل عدة bots تحت gateway واحد.
- تشترك مسارات الإدخال والإخراج وجسر gateway في جذر واحد لحمولات الوسائط تحت `~/.openclaw/media`، لذلك تهبط عمليات الرفع والتنزيل وذاكرات التخزين المؤقت للتحويل في دليل واحد محمي بدلًا من شجرة لكل نظام فرعي.
- يمكن نسخ بيانات الاعتماد احتياطيًا واستعادتها كجزء من لقطات بيانات الاعتماد القياسية في OpenClaw؛ ويعيد المحرك إرفاق حزمة الموارد الخاصة بكل حساب عند الاستعادة من دون الحاجة إلى اقتران جديد عبر رمز QR.

## الإلحاق عبر رمز QR

كبديل عن لصق `AppID:AppSecret` يدويًا، يدعم المحرك تدفق إلحاق عبر رمز QR لربط QQ Bot بـ OpenClaw:

1. شغّل مسار إعداد QQ Bot (على سبيل المثال `openclaw channels add --channel qqbot`) واختر تدفق رمز QR عند المطالبة.
2. امسح رمز QR الذي تم إنشاؤه باستخدام تطبيق الهاتف المرتبط بـ QQ Bot المستهدف.
3. وافق على الاقتران على الهاتف. يحتفظ OpenClaw ببيانات الاعتماد المعادة داخل `credentials/` ضمن نطاق الحساب الصحيح.

تظهر مطالبات الموافقة التي يولدها البوت نفسه (على سبيل المثال تدفقات "السماح بهذا الإجراء؟" التي تكشفها QQ Bot API) كمطالبات OpenClaw أصلية يمكنك قبولها باستخدام `/bot-approve` بدلًا من الرد عبر عميل QQ الخام.

## استكشاف الأخطاء وإصلاحها

- **يرد البوت "gone to Mars":** بيانات الاعتماد غير مهيأة أو أن Gateway لم يبدأ.
- **لا توجد رسائل واردة:** تحقّق من أن `appId` و`clientSecret` صحيحان، وأن
  البوت مفعّل على QQ Open Platform.
- **تكرار الرد على نفسه:** يسجّل OpenClaw فهارس المراجع الصادرة من QQ على أنها
  صادرة من البوت ويتجاهل أحداث الإدخال التي يطابق `msgIdx` الحالي فيها
  حساب البوت نفسه. يمنع هذا حلقات الصدى في المنصة مع السماح للمستخدمين
  باقتباس رسائل البوت السابقة أو الرد عليها.
- **لا يزال الإعداد باستخدام `--token-file` يظهر كغير مهيأ:** يقوم `--token-file` فقط
  بضبط AppSecret. وما زلت تحتاج إلى `appId` في الإعدادات أو `QQBOT_APP_ID`.
- **الرسائل الاستباقية لا تصل:** قد يعترض QQ الرسائل التي يبدأها البوت إذا
  لم يتفاعل المستخدم مؤخرًا.
- **لم يتم تفريغ الصوت إلى نص:** تأكد من تهيئة STT وأن provider يمكن الوصول إليه.

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
