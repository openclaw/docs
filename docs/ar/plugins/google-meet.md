---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - تريد أن ينشئ وكيل OpenClaw مكالمة Google Meet جديدة
    - أنت تهيئ Chrome أو عقدة Chrome أو Twilio كناقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL المحددة صراحةً لـ Meet عبر Chrome أو Twilio مع إعدادات ردّ الوكيل الافتراضية'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T07:08:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

دعم مشارك Google Meet في OpenClaw — إن Plugin صريح بالتصميم:

- لا ينضم إلا إلى عنوان URL صريح بالشكل `https://meet.google.com/...`.
- يمكنه إنشاء مساحة Meet جديدة عبر Google Meet API، ثم الانضمام إلى عنوان URL
  المُعاد.
- `agent` هو وضع الرد الصوتي الافتراضي: يستمع النسخ الفوري، ويجيب وكيل
  OpenClaw المُكوَّن، ويتحدث OpenClaw TTS العادي داخل Meet.
- يظل `bidi` متاحًا كوضع احتياطي لنموذج الصوت الفوري المباشر.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `agent` للاستماع/الرد
  الصوتي المباشر، أو `bidi` للاحتياطي الصوتي الفوري المباشر، أو `transcribe`
  للانضمام/التحكم بالمتصفح دون جسر الرد الصوتي.
- يبدأ التفويض بوصول Google OAuth شخصي أو ملف Chrome شخصي مسجل الدخول مسبقًا.
- لا يوجد إعلان موافقة تلقائي.
- واجهة الصوت الخلفية الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف Node مقترن.
- يقبل Twilio رقم اتصال هاتفيًا بالإضافة إلى رقم PIN اختياري أو تسلسل DTMF؛ ولا
  يمكنه طلب عنوان URL لـ Meet مباشرة.
- أمر CLI هو `googlemeet`؛ و`meet` محجوز لتدفقات الاجتماعات عن بُعد الأوسع
  الخاصة بالوكلاء.

## البدء السريع

ثبّت تبعيات الصوت المحلية وهيّئ مزود نسخ فوريًا بالإضافة إلى OpenClaw TTS عادي.
OpenAI هو مزود النسخ الافتراضي؛ ويعمل Google Gemini Live أيضًا كاحتياطي صوتي
منفصل بنمط `bidi` مع `realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

يثبّت `blackhole-2ch` جهاز الصوت الافتراضي `BlackHole 2ch`. يتطلب مثبّت
Homebrew إعادة تشغيل قبل أن يعرض macOS الجهاز:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقق من الجزأين:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

فعّل Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

تحقق من الإعداد:

```bash
openclaw googlemeet setup
```

مخرجات الإعداد مصممة لتكون قابلة للقراءة من الوكيل ومدركة للوضع. وهي تبلّغ عن
ملف Chrome الشخصي، وتثبيت Node، وبالنسبة لانضمامات Chrome الفورية، جسر صوت
BlackHole/SoX وفحوصات المقدمة الفورية المؤجلة. بالنسبة لانضمامات المراقبة فقط،
تحقق من النقل نفسه باستخدام `--mode transcribe`؛ يتجاوز هذا الوضع متطلبات
الصوت الفوري المسبقة لأنه لا يستمع أو يتحدث عبر الجسر:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

عند تكوين تفويض Twilio، يبلّغ الإعداد أيضًا عمّا إذا كان Plugin
`voice-call`، وبيانات اعتماد Twilio، وتعريض Webhook العام جاهزة. تعامل مع أي
فحص `ok: false` كحاجز للنقل والوضع اللذين تم فحصهما قبل أن تطلب من وكيل
الانضمام. استخدم `openclaw googlemeet setup --json` للسكربتات أو المخرجات
القابلة للقراءة آليًا. استخدم `--transport chrome` أو
`--transport chrome-node` أو `--transport twilio` لإجراء فحص مسبق لنقل محدد
قبل أن يحاول الوكيل استخدامه.

بالنسبة إلى Twilio، أجرِ دائمًا فحصًا مسبقًا صريحًا للنقل عندما يكون النقل
الافتراضي هو Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

يلتقط ذلك نقص توصيل `voice-call`، أو بيانات اعتماد Twilio، أو تعريض Webhook
غير القابل للوصول قبل أن يحاول الوكيل طلب الاجتماع.

انضم إلى اجتماع:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اسمح لوكيل بالانضمام عبر أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

تظل أداة `google_meet` الموجهة للوكيل متاحة على مضيفات غير macOS لتدفقات
الأثر، والتقويم، والإعداد، والنسخ، وTwilio، و`chrome-node`. تُحظر إجراءات
الرد الصوتي عبر Chrome المحلي هناك لأن مسار صوت Chrome المضمّن يعتمد حاليًا على
`BlackHole 2ch` في macOS. على Linux، استخدم `mode: "transcribe"`، أو الاتصال
الهاتفي عبر Twilio، أو مضيف `chrome-node` على macOS للمشاركة بالرد الصوتي عبر
Chrome.

أنشئ اجتماعًا جديدًا وانضم إليه:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

بالنسبة إلى الغرف المُنشأة عبر API، استخدم Google Meet
`SpaceConfig.accessType` عندما تريد أن تكون سياسة الغرفة دون طلب إذن صريحة
بدلًا من أن تكون موروثة من افتراضيات حساب Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

يسمح `OPEN` لأي شخص لديه عنوان URL لـ Meet بالانضمام دون طلب إذن. يسمح
`TRUSTED` للمستخدمين الموثوقين في مؤسسة المضيف، والمستخدمين الخارجيين المدعوين،
ومستخدمي الاتصال الهاتفي بالانضمام دون طلب إذن. يحد `RESTRICTED` الدخول دون
طلب إذن بالمدعوين. لا تنطبق هذه الإعدادات إلا على مسار الإنشاء الرسمي عبر
Google Meet API، لذلك يجب تكوين بيانات اعتماد OAuth.

إذا كنت قد صادقت Google Meet قبل إتاحة هذا الخيار، فأعد تشغيل
`openclaw googlemeet auth login --json` بعد إضافة نطاق
`meetings.space.settings` إلى شاشة موافقة Google OAuth لديك.

أنشئ عنوان URL فقط دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

يحتوي `googlemeet create` على مسارين:

- إنشاء عبر API: يُستخدم عند تكوين بيانات اعتماد Google Meet OAuth. هذا هو
  المسار الأكثر حتمية ولا يعتمد على حالة واجهة المتصفح.
- احتياطي المتصفح: يُستخدم عند غياب بيانات اعتماد OAuth. يستخدم OpenClaw
  Node Chrome المثبتة، ويفتح `https://meet.google.com/new`، وينتظر Google حتى
  يعيد التوجيه إلى عنوان URL حقيقي برمز اجتماع، ثم يعيد ذلك العنوان. يتطلب هذا
  المسار أن يكون ملف Chrome الشخصي الخاص بـ OpenClaw على Node مسجل الدخول إلى
  Google مسبقًا. تتعامل أتمتة المتصفح مع مطالبة الميكروفون الأولى الخاصة بـ
  Meet؛ ولا تُعامل تلك المطالبة كفشل في تسجيل الدخول إلى Google.
  تحاول تدفقات الانضمام والإنشاء أيضًا إعادة استخدام تبويب Meet موجود قبل فتح
  تبويب جديد. تتجاهل المطابقة سلاسل استعلام URL غير الضارة مثل `authuser`، لذا
  ينبغي أن تركز إعادة محاولة الوكيل على الاجتماع المفتوح مسبقًا بدلًا من إنشاء
  تبويب Chrome ثانٍ.

يتضمن مخرج الأمر/الأداة حقل `source` (`api` أو `browser`) حتى تتمكن الوكلاء من
شرح المسار المستخدم. ينضم `create` إلى الاجتماع الجديد افتراضيًا ويعيد
`joined: true` بالإضافة إلى جلسة الانضمام. لصك عنوان URL فقط، استخدم
`create --no-join` في CLI أو مرّر `"join": false` إلى الأداة.

أو أخبر وكيلًا: "أنشئ Google Meet، وانضم إليه بوضع الرد الصوتي الخاص بالوكيل،
وأرسل لي الرابط." ينبغي أن يستدعي الوكيل `google_meet` مع
`action: "create"` ثم يشارك `meetingUri` المُعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

لانضمام مراقبة فقط/تحكم بالمتصفح، اضبط `"mode": "transcribe"`. لا يبدأ ذلك
جسر الصوت الفوري ثنائي الاتجاه، ولا يتطلب BlackHole أو SoX، ولن يرد صوتيًا داخل
الاجتماع. تتجنب انضمامات Chrome في هذا الوضع أيضًا منح إذن الميكروفون/الكاميرا
في OpenClaw وتتجنب مسار **Use microphone** في Meet. إذا عرض Meet شاشة بينية
لاختيار الصوت، تحاول الأتمتة مسار عدم استخدام الميكروفون، وإلا تبلّغ عن إجراء
يدوي بدلًا من فتح الميكروفون المحلي. في وضع النسخ، تثبّت عمليات نقل Chrome
المُدارة أيضًا مراقب تسميات Meet توضيحية بأفضل جهد. يعرض
`googlemeet status --json` و`googlemeet doctor` القيم `captioning` و
`captionsEnabledAttempted` و`transcriptLines` و`lastCaptionAt` و
`lastCaptionSpeaker` و`lastCaptionText` وذيل `recentTranscript` قصيرًا حتى
يتمكن المشغلون من معرفة ما إذا كان المتصفح قد انضم إلى المكالمة وما إذا كانت
تسميات Meet التوضيحية تنتج نصًا.
استخدم `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
عندما تحتاج إلى مسبار نعم/لا: ينضم في وضع النسخ، وينتظر تسمية توضيحية حديثة أو
حركة في النص، ويعيد `listenVerified` و`listenTimedOut` وحقول الإجراء اليدوي
وأحدث حالة صحة للتسميات التوضيحية.

أثناء الجلسات الفورية، تتضمن حالة `google_meet` صحة المتصفح وجسر الصوت مثل
`inCall` و`manualActionRequired` و`providerConnected` و`realtimeReady` و
`audioInputActive` و`audioOutputActive`، والطوابع الزمنية لآخر إدخال/إخراج،
وعدادات البايت، وحالة إغلاق الجسر. إذا ظهرت مطالبة آمنة في صفحة Meet، تتعامل
أتمتة المتصفح معها عندما تستطيع. تُبلّغ مطالبات تسجيل الدخول، وقبول المضيف،
وأذونات المتصفح/نظام التشغيل كإجراء يدوي مع سبب ورسالة لينقلها الوكيل. لا تصدر
جلسات Chrome المُدارة عبارة المقدمة أو الاختبار إلا بعد أن تبلّغ صحة المتصفح
`inCall: true`؛ وإلا تبلّغ الحالة `speechReady: false` وتُحظر محاولة الكلام
بدلًا من الادعاء بأن الوكيل تحدث داخل الاجتماع.

تنضم عمليات Chrome المحلية عبر ملف متصفح OpenClaw الشخصي المسجل الدخول. يتطلب
الوضع الفوري `BlackHole 2ch` لمسار الميكروفون/السماعة الذي يستخدمه OpenClaw.
للحصول على صوت ثنائي الاتجاه نظيف، استخدم أجهزة افتراضية منفصلة أو مخططًا
بأسلوب Loopback؛ جهاز BlackHole واحد يكفي لاختبار دخان أولي لكنه قد يسبب صدى.

### Gateway محلي + Chrome عبر Parallels

لا تحتاج إلى Gateway كامل لـ OpenClaw أو مفتاح API لنموذج داخل VM بنظام macOS
فقط لجعل VM يمتلك Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل مضيف Node في
VM. فعّل Plugin المضمّن على VM مرة واحدة حتى تعلن Node عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API،
  ومزود الوقت الفوري، وتكوين Google Meet Plugin.
- VM بنظام Parallels macOS: OpenClaw CLI/مضيف Node، وGoogle Chrome، وSoX،
  وBlackHole 2ch، وملف Chrome شخصي مسجل الدخول إلى Google.
- غير مطلوب في VM: خدمة Gateway، أو تكوين الوكيل، أو مفتاح OpenAI/GPT، أو
  إعداد مزود النموذج.

ثبّت تبعيات VM:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل VM بعد تثبيت BlackHole حتى يعرض macOS `BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقق من أن VM يمكنه رؤية جهاز الصوت وأوامر SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ثبّت OpenClaw أو حدّثه في VM، ثم فعّل Plugin المضمّن هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ مضيف Node في VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على LAN ولا تستخدم TLS، فسيرفض Node
WebSocket بالنص الصريح ما لم تشترك صراحةً لتلك الشبكة الخاصة الموثوقة:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

استخدم متغير البيئة نفسه عند تثبيت Node كـ LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو بيئة العملية، وليس إعداد
`openclaw.json`. يخزّنه `openclaw node install` في بيئة LaunchAgent عندما يكون
موجودًا في أمر التثبيت.

وافق على Node من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأكد من أن Gateway يرى Node وأنها تعلن عن كل من `googlemeet.chrome` وإمكانية
المتصفح/`browser.proxy`:

```bash
openclaw nodes status
```

وجّه Meet عبر تلك Node على مضيف Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

الآن انضم بشكل طبيعي من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اطلب من الوكيل استخدام أداة `google_meet` مع `transport: "chrome-node"`.

لاختبار دخان بأمر واحد ينشئ جلسة أو يعيد استخدامها، ويتحدث بعبارة معروفة،
ويطبع صحة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام في الوقت الفعلي، تملأ أتمتة متصفح OpenClaw اسم الضيف، وتنقر
على Join/Ask to join، وتقبل خيار "Use microphone" عند التشغيل الأول في Meet عندما
تظهر تلك المطالبة. أثناء الانضمام للمراقبة فقط أو إنشاء اجتماع عبر المتصفح فقط، فإنها
تتابع تجاوز المطالبة نفسها من دون ميكروفون عندما يكون ذلك الخيار متاحا.
إذا لم يكن ملف تعريف المتصفح مسجلا دخوله، أو كان Meet ينتظر قبول المضيف،
أو كان Chrome يحتاج إلى إذن الميكروفون/الكاميرا لانضمام في الوقت الفعلي، أو كان Meet عالقا
على مطالبة تعذر على الأتمتة حلها، فإن نتيجة الانضمام/اختبار الكلام تبلغ عن
`manualActionRequired: true` مع `manualActionReason` و
`manualActionMessage`. يجب على الوكلاء إيقاف إعادة محاولة الانضمام، والإبلاغ عن تلك
الرسالة نفسها إضافة إلى `browserUrl`/`browserTitle` الحاليين، وإعادة المحاولة فقط بعد
اكتمال الإجراء اليدوي في المتصفح.

إذا حذفت `chromeNode.node`، فإن OpenClaw يختار تلقائيا فقط عندما تعلن عقدة واحدة
متصلة بالضبط عن كل من `googlemeet.chrome` والتحكم في المتصفح. إذا كانت عدة
عقد قادرة متصلة، فعيّن `chromeNode.node` إلى معرف العقدة أو اسم العرض أو IP البعيد.

فحوصات الفشل الشائعة:

- `Configured Google Meet node ... is not usable: offline`: العقدة المثبتة
  معروفة لدى Gateway لكنها غير متاحة. يجب على الوكلاء التعامل مع تلك العقدة كحالة
  تشخيصية، لا كمضيف Chrome صالح للاستخدام، والإبلاغ عن عائق الإعداد
  بدلا من الرجوع إلى نقل آخر ما لم يطلب المستخدم ذلك.
- `No connected Google Meet-capable node`: شغّل `openclaw node run` في VM،
  وافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` في VM. أكّد أيضا أن مضيف
  Gateway يسمح بكلا أمري العقدة عبر
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: ثبّت `blackhole-2ch` على المضيف
  الذي يجري فحصه وأعد التشغيل قبل استخدام صوت Chrome المحلي.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في VM وأعد تشغيل VM.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف تعريف المتصفح داخل VM، أو
  أبق `chrome.guestName` مضبوطا لانضمام الضيف. يستخدم الانضمام التلقائي للضيف
  أتمتة متصفح OpenClaw عبر وكيل متصفح العقدة؛ تأكد من أن إعداد متصفح العقدة
  يشير إلى ملف التعريف الذي تريده، على سبيل المثال
  `browser.defaultProfile: "user"` أو ملف تعريف جلسة موجود مسمى.
- تبويبات Meet مكررة: اترك `chrome.reuseExistingTab: true` مفعلا. يفعّل OpenClaw
  تبويبا موجودا لعنوان Meet نفسه قبل فتح تبويب جديد، كما أن إنشاء الاجتماع عبر المتصفح
  يعيد استخدام تبويب `https://meet.google.com/new` قيد التقدم
  أو تبويب مطالبة حساب Google قبل فتح تبويب آخر.
- لا يوجد صوت: في Meet، وجّه صوت الميكروفون/السماعة عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيها بأسلوب Loopback
  للحصول على صوت مزدوج نظيف.

## ملاحظات التثبيت

يستخدم الإعداد الافتراضي للرد الصوتي في Chrome أداتين خارجيتين:

- `sox`: أداة صوتية لسطر الأوامر. يستخدم Plugin أوامر أجهزة CoreAudio
  صريحة لجسر الصوت الافتراضي 24 kHz PCM16.
- `blackhole-2ch`: مشغل صوت افتراضي لنظام macOS. ينشئ جهاز الصوت `BlackHole 2ch`
  الذي يمكن لـ Chrome/Meet التوجيه عبره.

لا يحزم OpenClaw أيا من الحزمتين ولا يعيد توزيعهما. تطلب الوثائق من المستخدمين
تثبيتهما كاعتماديات مضيف عبر Homebrew. SoX مرخص كـ
`LGPL-2.0-only AND GPL-2.0-only`؛ وBlackHole مرخص بموجب GPL-3.0. إذا بنيت
مثبتا أو جهازا يضم BlackHole مع OpenClaw، فراجع شروط ترخيص BlackHole
الأصلية أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

يفتح نقل Chrome عنوان Meet عبر التحكم في متصفح OpenClaw وينضم
بملف تعريف متصفح OpenClaw المسجل دخوله. على macOS، يتحقق Plugin من وجود
`BlackHole 2ch` قبل التشغيل. إذا كان مكوّنا، فإنه يشغّل أيضا أمر صحة جسر الصوت
وأمر بدء التشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت موجودين
على مضيف Gateway؛ واستخدم `chrome-node` عندما يكون Chrome/الصوت موجودين
على عقدة مقترنة مثل Parallels macOS VM. بالنسبة إلى Chrome المحلي، اختر
ملف التعريف باستخدام `browser.defaultProfile`؛ ويتم تمرير `chrome.browserProfile` إلى
مضيفي `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون Chrome والسماعة عبر جسر صوت OpenClaw المحلي.
إذا لم يكن `BlackHole 2ch` مثبتا، يفشل الانضمام بخطأ إعداد
بدلا من الانضمام بصمت من دون مسار صوتي.

### Twilio

نقل Twilio هو خطة اتصال صارمة مفوضة إلى Plugin مكالمات الصوت. وهو
لا يحلل صفحات Meet بحثا عن أرقام هواتف.

استخدم هذا عندما لا تكون مشاركة Chrome متاحة أو تريد بديلا للاتصال الهاتفي.
يجب أن يوفّر Google Meet رقم اتصال هاتفي وPIN للاجتماع؛
لا يكتشف OpenClaw ذلك من صفحة Meet.

فعّل Plugin مكالمات الصوت على مضيف Gateway، وليس على عقدة Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

وفّر بيانات اعتماد Twilio عبر البيئة أو الإعداد. تبقي البيئة
الأسرار خارج `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

استخدم `realtime.provider: "openai"` مع Plugin مزود OpenAI و
`OPENAI_API_KEY` بدلا من ذلك إذا كان هذا هو مزود الصوت في الوقت الفعلي لديك.

أعد تشغيل Gateway أو أعد تحميله بعد تفعيل `voice-call`؛ لا تظهر تغييرات إعداد Plugin
في عملية Gateway قيد التشغيل بالفعل حتى يعاد تحميلها.

ثم تحقق:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

عندما يكون تفويض Twilio موصولا، يتضمن `googlemeet setup` فحوصات ناجحة لـ
`twilio-voice-call-plugin` و`twilio-voice-call-credentials` و
`twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

استخدم `--dtmf-sequence` عندما يحتاج الاجتماع إلى تسلسل مخصص:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth والفحص المسبق

OAuth اختياري لإنشاء رابط Meet لأن `googlemeet create` يمكنه الرجوع
إلى أتمتة المتصفح. كوّن OAuth عندما تريد الإنشاء عبر API الرسمي،
أو حل المساحة، أو فحوصات Meet Media API المسبقة.

يستخدم الوصول إلى Google Meet API مصادقة OAuth للمستخدم: أنشئ عميل Google Cloud OAuth،
واطلب النطاقات المطلوبة، وافوض حساب Google، ثم خزّن
رمز التحديث الناتج في إعداد Plugin Google Meet أو وفّر
متغيرات البيئة `OPENCLAW_GOOGLE_MEET_*`.

لا يستبدل OAuth مسار الانضمام عبر Chrome. لا تزال عمليات نقل Chrome وChrome-node
تنضم عبر ملف تعريف Chrome مسجل دخوله، وBlackHole/SoX، وعقدة متصلة
عندما تستخدم مشاركة المتصفح. OAuth مخصص فقط لمسار Google Meet API الرسمي:
إنشاء مساحات الاجتماعات، وحل المساحات، وتشغيل فحوصات Meet Media API المسبقة.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو اختر مشروعا موجودا.
2. فعّل **Google Meet REST API** لذلك المشروع.
3. كوّن شاشة موافقة OAuth.
   - **Internal** هو الأبسط لمؤسسة Google Workspace.
   - **External** يعمل لإعدادات شخصية/اختبارية؛ أثناء وجود التطبيق في Testing،
     أضف كل حساب Google سيفوض التطبيق كمستخدم اختبار.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرف عميل OAuth.
   - نوع التطبيق: **Web application**.
   - عنوان URI المعتمد لإعادة التوجيه:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرف العميل وسر العميل.

`meetings.space.created` مطلوب بواسطة Google Meet `spaces.create`.
يتيح `meetings.space.readonly` لـ OpenClaw حل عناوين/رموز Meet إلى مساحات.
يتيح `meetings.space.settings` لـ OpenClaw تمرير إعدادات `SpaceConfig` مثل
`accessType` أثناء إنشاء غرفة عبر API.
`meetings.conference.media.readonly` مخصص للفحص المسبق لـ Meet Media API وعمل الوسائط؛
قد تطلب Google التسجيل في Developer Preview لاستخدام Media API فعليا.
إذا كنت تحتاج فقط إلى انضمامات Chrome المعتمدة على المتصفح، فتجاوز OAuth بالكامل.

### إصدار رمز التحديث

كوّن `oauth.clientId` و`oauth.clientSecret` اختياريا، أو مررهما كـ
متغيرات بيئة، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعداد `oauth` مع رمز تحديث. يستخدم PKCE،
واستدعاء localhost على `http://localhost:8085/oauth2callback`، وتدفق
نسخ/لصق يدوي مع `--manual`.

أمثلة:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

استخدم الوضع اليدوي عندما لا يستطيع المتصفح الوصول إلى الاستدعاء المحلي:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

يتضمن خرج JSON:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

خزّن كائن `oauth` ضمن إعداد Plugin Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

فضّل متغيرات البيئة عندما لا تريد وجود رمز التحديث في الإعداد.
إذا كانت قيم الإعداد والبيئة موجودة معا، فإن Plugin يحل الإعداد
أولا ثم يستخدم البيئة كخيار احتياطي.

تتضمن موافقة OAuth إنشاء مساحة Meet، ووصول قراءة مساحة Meet، ووصول قراءة
وسائط مؤتمر Meet. إذا صادقت قبل وجود دعم إنشاء الاجتماعات،
فأعد تشغيل `openclaw googlemeet auth login --json` حتى يمتلك رمز التحديث
نطاق `meetings.space.created`.

### التحقق من OAuth باستخدام doctor

شغّل doctor الخاص بـ OAuth عندما تريد فحص صحة سريع وغير سري:

```bash
openclaw googlemeet doctor --oauth --json
```

لا يحمّل هذا وقت تشغيل Chrome ولا يتطلب عقدة Chrome متصلة. إنه
يتحقق من وجود إعداد OAuth وأن رمز التحديث يمكنه إصدار رمز وصول.
يتضمن تقرير JSON حقول حالة فقط مثل `ok` و`configured` و
`tokenSource` و`expiresAt` ورسائل الفحص؛ ولا يطبع رمز الوصول
أو رمز التحديث أو سر العميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | يوجد `oauth.clientId` مع `oauth.refreshToken`، أو رمز وصول مخزن مؤقتا.       |
| `oauth-token`        | ما زال رمز الوصول المخزن مؤقتا صالحا، أو أن رمز التحديث أنشأ رمز وصول جديدا. |
| `meet-spaces-get`    | نجح فحص `--meeting` الاختياري في حل مساحة Meet موجودة.                             |
| `meet-spaces-create` | أنشأ فحص `--create-space` الاختياري مساحة Meet جديدة.                               |

لإثبات تمكين Google Meet API ونطاق `spaces.create` أيضا، شغل فحص الإنشاء ذي
الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

ينشئ `--create-space` عنوان URL مؤقتا من Meet. استخدمه عندما تحتاج إلى تأكيد
أن مشروع Google Cloud لديه Meet API ممكنا وأن الحساب المفوض لديه نطاق
`meetings.space.created`.

لإثبات وصول القراءة لمساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` وصول القراءة إلى مساحة موجودة
يمكن لحساب Google المفوض الوصول إليها. تعني استجابة `403` من هذه الفحوصات
عادة أن Google Meet REST API معطلة، أو أن رمز التحديث الذي تمت الموافقة عليه
يفتقد النطاق المطلوب، أو أن حساب Google لا يمكنه الوصول إلى مساحة Meet تلك.
يعني خطأ رمز التحديث إعادة تشغيل `openclaw googlemeet auth login
--json` وتخزين كتلة `oauth` الجديدة.

لا حاجة إلى بيانات اعتماد OAuth للرجوع الاحتياطي عبر المتصفح. في ذلك الوضع، تأتي مصادقة Google
من ملف Chrome الشخصي المسجل الدخول على Node المحدد، وليس من
إعدادات OpenClaw.

تقبل متغيرات البيئة هذه كبدائل احتياطية:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

حل عنوان URL من Meet، أو رمز، أو `spaces/{id}` عبر `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

شغل فحص ما قبل التشغيل قبل عمل الوسائط:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اعرض عناصر الاجتماع والحضور بعد أن ينشئ Meet سجلات المؤتمر:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

مع `--meeting`، يستخدم `artifacts` و`attendance` أحدث سجل مؤتمر
افتراضيا. مرر `--all-conference-records` عندما تريد كل سجل محتفظ به
لذلك الاجتماع.

يمكن للبحث في التقويم حل عنوان URL للاجتماع من Google Calendar قبل قراءة
عناصر Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` الخاص باليوم عن حدث Calendar يحتوي على
رابط Google Meet. استخدم `--event <query>` للبحث في نص الحدث المطابق، و
`--calendar <id>` لتقويم غير أساسي. يتطلب البحث في التقويم تسجيل دخول OAuth جديدا
يتضمن نطاق قراءة أحداث Calendar فقط.
يعرض `calendar-events` معاينة لأحداث Meet المطابقة ويعلم الحدث الذي
سيختاره `latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف معرف سجل المؤتمر مسبقا، فخاطبه مباشرة:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

أنه مؤتمرا نشطا لمساحة أنشئت عبر API عندما تريد إغلاق
الغرفة بعد المكالمة:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

يستدعي هذا Google Meet `spaces.endActiveConference` ويتطلب OAuth مع نطاق
`meetings.space.created` لمساحة يمكن للحساب المفوض إدارتها.
يقبل OpenClaw إدخال عنوان URL من Meet، أو رمز اجتماع، أو `spaces/{id}` ويحلله
إلى مورد مساحة API قبل إنهاء المؤتمر النشط.
هذا منفصل عن `googlemeet leave`: يوقف `leave` مشاركة OpenClaw المحلية/الجلسة،
بينما يطلب `end-active-conference` من Google Meet إنهاء المؤتمر النشط
للمساحة.

اكتب تقريرا قابلا للقراءة:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

يرجع `artifacts` بيانات تعريف سجل المؤتمر إضافة إلى بيانات تعريف موارد المشاركين،
والتسجيل، والنص المكتوب، ومدخلات النص المكتوب المنظمة، والملاحظات الذكية عندما
يعرضها Google للاجتماع. استخدم `--no-transcript-entries` لتخطي
البحث عن المدخلات للاجتماعات الكبيرة. يوسع `attendance` المشاركين إلى
صفوف جلسات مشاركين مع أوقات أول/آخر ظهور، وإجمالي مدة الجلسة،
وعلامات التأخر/المغادرة المبكرة، وموارد المشاركين المكررة المدمجة حسب المستخدم
المسجل الدخول أو اسم العرض. مرر `--no-merge-duplicates` لإبقاء موارد المشاركين
الخام منفصلة، و`--late-after-minutes` لضبط اكتشاف التأخر، و
`--early-before-minutes` لضبط اكتشاف المغادرة المبكرة.

يكتب `export` مجلدا يحتوي على `summary.md` و`attendance.csv` و
`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`.
يسجل `manifest.json` الإدخال المختار، وخيارات التصدير، وسجلات المؤتمر،
وملفات الإخراج، والأعداد، ومصدر الرمز، وحدث Calendar عند استخدامه، وأي
تحذيرات استرجاع جزئي. مرر `--zip` لكتابة أرشيف قابل للنقل أيضا بجانب
المجلد. مرر `--include-doc-bodies` لتصدير نصوص Google Docs المرتبطة للنص المكتوب
والملاحظات الذكية عبر Google Drive `files.export`؛ يتطلب ذلك
تسجيل دخول OAuth جديدا يتضمن نطاق قراءة Drive Meet فقط. بدون
`--include-doc-bodies`، تتضمن الصادرات بيانات تعريف Meet ومدخلات النص المكتوب
المنظمة فقط. إذا أعاد Google فشل عنصر جزئيا، مثل خطأ في قائمة الملاحظات الذكية،
أو مدخلات النص المكتوب، أو جسم مستند Drive، يحتفظ الملخص و
البيان بالتحذير بدلا من إفشال التصدير كله.
استخدم `--dry-run` لجلب بيانات العناصر/الحضور نفسها وطباعة
JSON للبيان بدون إنشاء المجلد أو ZIP. يكون ذلك مفيدا قبل كتابة
تصدير كبير أو عندما يحتاج وكيل فقط إلى الأعداد، والسجلات المحددة، و
التحذيرات.

يمكن للوكلاء أيضا إنشاء الحزمة نفسها عبر أداة `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

اضبط `"dryRun": true` لإرجاع بيان التصدير فقط وتخطي كتابة الملفات.

يمكن للوكلاء أيضا إنشاء غرفة مدعومة بواجهة API مع سياسة وصول صريحة:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

ويمكنهم إنهاء المؤتمر النشط لغرفة معروفة:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

للتحقق بالاستماع أولا، يجب أن يستخدم الوكلاء `test_listen` قبل الادعاء بأن
الاجتماع مفيد:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

شغل فحص الدخان الحي المحروس على اجتماع حقيقي محتفظ به:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

شغل مسبار المتصفح الحي للاستماع أولا على اجتماع سيتحدث فيه شخص ما
مع توفر تسميات Meet التوضيحية:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

بيئة فحص الدخان الحي:

- يمكّن `OPENCLAW_LIVE_TEST=1` الاختبارات الحية المحروسة.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL محتفظ به من Meet، أو رمز، أو
  `spaces/{id}`.
- يوفر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرف عميل OAuth.
- يوفر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
  رمز التحديث.
- اختياري: يستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  و`OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء البدائل الاحتياطية نفسها
  بدون البادئة `OPENCLAW_`.

يحتاج فحص الدخان الحي الأساسي للعناصر/الحضور إلى
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. يحتاج
البحث في Calendar إلى `https://www.googleapis.com/auth/calendar.events.readonly`. يحتاج
تصدير جسم مستند Drive إلى
`https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد، والمصدر، وجلسة الانضمام. مع بيانات اعتماد OAuth
يستخدم Google Meet API الرسمية. بدون بيانات اعتماد OAuth، يستخدم
ملف المتصفح الشخصي المسجل الدخول في Chrome Node المثبت كبديل احتياطي. يمكن للوكلاء
استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في خطوة
واحدة. للإنشاء باستخدام عنوان URL فقط، مرر `"join": false`.

مثال على إخراج JSON من الرجوع الاحتياطي عبر المتصفح:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

إذا واجه الرجوع الاحتياطي عبر المتصفح تسجيل دخول Google أو مانع أذونات Meet قبل أن
يتمكن من إنشاء عنوان URL، فإن طريقة Gateway ترجع استجابة فاشلة وتعيد أداة
`google_meet` تفاصيل منظمة بدلا من سلسلة نصية بسيطة:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

عندما يرى وكيل `manualActionRequired: true`، يجب أن يبلّغ عن
`manualActionMessage` مع سياق Node/علامة تبويب المتصفح ويتوقف عن فتح علامات تبويب
Meet جديدة إلى أن يكمل المشغل خطوة المتصفح.

مثال على إخراج JSON من إنشاء API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

ينضم إنشاء اجتماع Meet افتراضيا. لا يزال نقل Chrome أو Chrome-node
يحتاج إلى ملف شخصي مسجل الدخول في Google Chrome للانضمام عبر المتصفح. إذا كان
الملف الشخصي مسجل الخروج، يبلغ OpenClaw عن `manualActionRequired: true` أو عن
خطأ رجوع احتياطي في المتصفح ويطلب من المشغل إكمال تسجيل الدخول إلى Google قبل
إعادة المحاولة.

اضبط `preview.enrollmentAcknowledged: true` فقط بعد تأكيد أن مشروع Cloud
ومسؤول OAuth والمشاركين في الاجتماع مسجلون في Google
Workspace Developer Preview Program لواجهات Meet media APIs.

## الإعدادات

لا يحتاج مسار وكيل Chrome الشائع إلا إلى تمكين Plugin، وBlackHole، وSoX، ومفتاح
مزود نسخ فوري، ومزود OpenClaw TTS مضبوط. OpenAI هو مزود النسخ الافتراضي؛ اضبط
`realtime.voiceProvider` على `"google"` و`realtime.model` لاستخدام Google Gemini Live
لوضع `bidi` من دون تغيير مزود النسخ الافتراضي لوضع الوكيل:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

اضبط إعدادات Plugin تحت `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

القيم الافتراضية:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (يُقبل `"realtime"` فقط كاسم مستعار قديم للتوافق مع
  `"agent"`؛ يجب أن تقول استدعاءات الأدوات الجديدة `"agent"`)
- `chromeNode.node`: معرف/اسم/IP اختياري للعقدة لـ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم على شاشة ضيف Meet غير
  المسجل الدخول
- `chrome.autoJoin: true`: ملء اسم الضيف والنقر على Join Now بأفضل جهد عبر
  أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تنشيط تبويب Meet موجود بدلا من فتح نسخ مكررة
- `chrome.waitForInCallMs: 20000`: الانتظار حتى يبلغ تبويب Meet بأنه داخل
  المكالمة قبل تشغيل مقدمة الرد الصوتي
- `chrome.audioFormat: "pcm16-24khz"`: تنسيق صوت زوج الأوامر. استخدم
  `"g711-ulaw-8khz"` فقط لأزواج الأوامر القديمة/المخصصة التي لا تزال تصدر صوت
  الهاتف.
- `chrome.audioBufferBytes: 4096`: مخزن معالجة SoX المؤقت لأوامر صوت زوج أوامر
  Chrome المولدة. هذا يساوي نصف مخزن SoX الافتراضي البالغ 8192 بايت، مما يقلل
  زمن انتقال الأنبوب الافتراضي مع ترك مجال لرفعه على الأجهزة المضيفة المزدحمة.
  تُقيد القيم الأقل من الحد الأدنى لـ SoX إلى 17 بايت.
- `chrome.audioInputCommand`: أمر SoX يقرأ من CoreAudio `BlackHole 2ch`
  ويكتب الصوت بتنسيق `chrome.audioFormat`
- `chrome.audioOutputCommand`: أمر SoX يقرأ الصوت بتنسيق `chrome.audioFormat`
  ويكتب إلى CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: أمر ميكروفون محلي اختياري يكتب PCM أحادي القناة
  موقّعا 16-بت بترتيب little-endian لاكتشاف مقاطعة البشر أثناء تشغيل صوت
  المساعد. ينطبق هذا حاليا على جسر زوج الأوامر `chrome` المستضاف على Gateway.
- `chrome.bargeInRmsThreshold: 650`: مستوى RMS الذي يُحسب كمقاطعة بشرية على
  `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: مستوى الذروة الذي يُحسب كمقاطعة بشرية على
  `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: الحد الأدنى للتأخير بين عمليات مسح المقاطعة
  البشرية المتكررة
- `mode: "agent"`: وضع الرد الصوتي الافتراضي. يُنسخ كلام المشاركين بواسطة مزود
  النسخ الفوري المضبوط، ويُرسل إلى وكيل OpenClaw المضبوط في جلسة وكيل فرعي لكل
  اجتماع، ويُعاد نطقه عبر وقت تشغيل OpenClaw TTS العادي.
- `mode: "bidi"`: وضع احتياطي لنموذج فوري ثنائي الاتجاه مباشر. يجيب مزود الصوت
  الفوري على كلام المشاركين مباشرة ويمكنه استدعاء `openclaw_agent_consult`
  للحصول على إجابات أعمق/مدعومة بالأدوات.
- `mode: "transcribe"`: وضع مراقبة فقط من دون جسر الرد الصوتي.
- `realtime.provider: "openai"`: رجوع احتياطي للتوافق يُستخدم عندما تكون حقول
  المزود المحددة النطاق أدناه غير مضبوطة.
- `realtime.transcriptionProvider: "openai"`: معرف المزود الذي يستخدمه وضع
  `agent` للنسخ الفوري.
- `realtime.voiceProvider`: معرف المزود الذي يستخدمه وضع `bidi` للصوت الفوري
  المباشر. اضبطه على `"google"` لاستخدام Gemini Live مع إبقاء نسخ وضع الوكيل
  على OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة موجزة، مع
  `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية منطوق قصير عند اتصال الجسر الفوري؛ اضبطه
  على `""` للانضمام بصمت
- `realtime.agentId`: معرف وكيل OpenClaw اختياري لـ
  `openclaw_agent_consult`؛ القيمة الافتراضية هي `main`

تجاوزات اختيارية:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
      },
    },
  },
}
```

ElevenLabs للاستماع والتحدث في وضع الوكيل معا:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

يأتي صوت Meet المستمر من
`messages.tts.providers.elevenlabs.voiceId`. يمكن لردود الوكيل أيضا استخدام
توجيهات لكل رد مثل `[[tts:voiceId=... model=eleven_v3]]` عندما تكون تجاوزات
نموذج TTS مفعلة، لكن الإعدادات هي الافتراضي الحتمي للاجتماعات. عند الانضمام،
يجب أن تعرض السجلات `transcriptionProvider=elevenlabs`، ويجب أن يسجل كل رد منطوق
`provider=elevenlabs model=eleven_v3 voice=<voiceId>`.

إعدادات Twilio فقط:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

القيمة الافتراضية لـ `voiceCall.enabled` هي `true`؛ مع نقل Twilio يفوض مكالمة
PSTN الفعلية، وDTMF، وتحية المقدمة إلى Plugin مكالمات الصوت. يشغل Voice Call
تسلسل DTMF قبل فتح تدفق الوسائط الفوري، ثم يستخدم نص المقدمة المحفوظ كتحية
فورية أولية. إذا لم يكن `voice-call` مفعلا، فلا يزال بإمكان Google Meet التحقق
من خطة الاتصال وتسجيلها، لكنه لا يمكنه إجراء مكالمة Twilio.

## الأداة

يمكن للوكلاء استخدام أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

استخدم `transport: "chrome"` عندما يعمل Chrome على مضيف Gateway. استخدم
`transport: "chrome-node"` عندما يعمل Chrome على عقدة مقترنة مثل جهاز Parallels
VM. في كلتا الحالتين، تعمل مزودات النماذج و`openclaw_agent_consult` على مضيف
Gateway، لذلك تبقى بيانات اعتماد النماذج هناك. مع `mode: "agent"` الافتراضي،
يتولى مزود النسخ الفوري الاستماع، وينتج وكيل OpenClaw المضبوط الإجابة، وينطقها
OpenClaw TTS العادي داخل Meet. استخدم `mode: "bidi"` عندما تريد أن يجيب نموذج
الصوت الفوري مباشرة. يظل `mode: "realtime"` الخام مقبولا كاسم مستعار قديم
للتوافق مع `mode: "agent"`، لكنه لم يعد معلنا في مخطط أداة الوكيل. تتضمن سجلات
وضع الوكيل مزود/نموذج النسخ المحلول عند بدء الجسر، ومزود TTS، والنموذج، والصوت،
وتنسيق الإخراج، ومعدل العينات بعد كل رد مركب.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرف جلسة. استخدم
`action: "speak"` مع `sessionId` و`message` لجعل الوكيل الفوري يتحدث فورا.
استخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها، وتشغيل عبارة
معروفة، وإرجاع صحة `inCall` عندما يستطيع مضيف Chrome الإبلاغ عنها. يفرض
`test_speech` دائما `mode: "agent"` ويفشل إذا طُلب منه العمل في
`mode: "transcribe"` لأن جلسات المراقبة فقط لا يمكنها إصدار كلام عمدا. تستند
نتيجة `speechOutputVerified` إلى زيادة بايتات إخراج الصوت الفوري أثناء استدعاء
الاختبار هذا، لذلك لا تُحسب الجلسة المعاد استخدامها ذات الصوت الأقدم كفحص كلام
ناجح جديد. استخدم `action: "leave"` لوضع علامة على الجلسة بأنها انتهت.

يتضمن `status` صحة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج
  ملف المتصفح الشخصي إلى تسجيل دخول يدوي، أو قبول مضيف Meet، أو أذونات، أو
  إصلاح التحكم في المتصفح قبل أن يعمل الكلام
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ما إذا كان
  كلام Chrome المُدار مسموحا الآن. تعني `speechReady: false` أن OpenClaw لم
  يرسل عبارة المقدمة/الاختبار إلى جسر الصوت.
- `providerConnected` / `realtimeReady`: حالة جسر الصوت الفوري
- `lastInputAt` / `lastOutputAt`: آخر صوت شوهد من الجسر أو أُرسل إليه
- `audioOutputRouted` / `audioOutputDeviceLabel`: ما إذا كان إخراج وسائط تبويب
  Meet قد وُجه بنشاط إلى جهاز BlackHole الذي يستخدمه الجسر
- `lastSuppressedInputAt` / `suppressedInputBytes`: إدخال local loopback تم
  تجاهله أثناء نشاط تشغيل المساعد

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## أوضاع الوكيل وBidi

وضع Chrome `agent` محسّن لسلوك "وكيلي موجود في الاجتماع". يسمع مزود النسخ
الفوري صوت الاجتماع، وتُوجه نصوص المشاركين النهائية عبر وكيل OpenClaw المضبوط،
وتُنطق الإجابة عبر وقت تشغيل OpenClaw TTS العادي. اضبط `mode: "bidi"` عندما تريد
أن يجيب نموذج الصوت الفوري مباشرة.
تُدمج أجزاء النص النهائي القريبة قبل الاستشارة حتى لا ينتج دور منطوق واحد عدة
إجابات جزئية قديمة. ويُكبت الإدخال الفوري أيضا بينما لا يزال صوت المساعد في
قائمة الانتظار قيد التشغيل،
وتُتجاهل أصداء النصوص الحديثة الشبيهة بالمساعد قبل استشارة الوكيل حتى لا يجعل
local loopback الخاص بـ BlackHole الوكيل يجيب على كلامه نفسه.

| الوضع    | من يقرر الإجابة        | مسار إخراج الكلام                     | استخدمه عندما                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | وكيل OpenClaw المضبوط | وقت تشغيل OpenClaw TTS العادي            | تريد سلوك "وكيلي موجود في الاجتماع"        |
| `bidi`  | نموذج الصوت الفوري      | استجابة صوت مزود الصوت الفوري | تريد حلقة صوت محادثية بأقل زمن انتقال |

في وضع `bidi`، عندما يحتاج النموذج الفوري إلى استدلال أعمق، أو معلومات حالية،
أو أدوات OpenClaw العادية، يمكنه استدعاء `openclaw_agent_consult`.

تعمل أداة الاستشارة على تشغيل وكيل OpenClaw المعتاد في الخلفية مع سياق نص الاجتماع الحديث وتعيد إجابة منطوقة موجزة. في وضع `agent`، يرسل OpenClaw تلك الإجابة مباشرة إلى وقت تشغيل TTS؛ وفي وضع `bidi`، يمكن لنموذج الصوت الآني نطق نتيجة الاستشارة مرة أخرى داخل الاجتماع. تستخدم الآلية المشتركة نفسها للاستشارة مثل Voice Call.

افتراضيًا، تعمل الاستشارات ضد الوكيل `main`. اضبط `realtime.agentId` عندما ينبغي لمسار Meet أن يستشير مساحة عمل وكيل OpenClaw مخصصة، وافتراضات النموذج، وسياسة الأدوات، والذاكرة، وسجل الجلسات.

تستخدم استشارات وضع الوكيل مفتاح جلسة لكل اجتماع `agent:<id>:subagent:google-meet:<session>` بحيث تحتفظ أسئلة المتابعة بسياق الاجتماع مع وراثة سياسة الوكيل المعتادة من الوكيل المكوَّن.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: يكشف أداة الاستشارة ويقصر الوكيل المعتاد على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`.
- `owner`: يكشف أداة الاستشارة ويتيح للوكيل المعتاد استخدام سياسة أدوات الوكيل العادية.
- `none`: لا يكشف أداة الاستشارة لنموذج الصوت الآني.

يكون مفتاح جلسة الاستشارة محدود النطاق لكل جلسة Meet، لذلك يمكن لاستدعاءات الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد أن ينضم Chrome إلى المكالمة بالكامل:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

لاختبار الدخان الكامل للانضمام والنطق:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## قائمة فحص الاختبار المباشر

استخدم هذا التسلسل قبل تسليم اجتماع إلى وكيل غير مراقَب:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

حالة Chrome-node المتوقعة:

- `googlemeet setup` كلها خضراء.
- يتضمن `googlemeet setup` الفحص `chrome-node-connected` عندما يكون Chrome-node هو وسيلة النقل الافتراضية أو عند تثبيت عقدة.
- يعرض `nodes status` العقدة المحددة متصلة.
- تعلن العقدة المحددة عن كلٍّ من `googlemeet.chrome` و`browser.proxy`.
- ينضم تبويب Meet إلى المكالمة ويعيد `test-speech` صحة Chrome مع `inCall: true`.

لمضيف Chrome بعيد مثل آلة macOS افتراضية على Parallels، فهذا هو أقصر فحص آمن بعد تحديث Gateway أو الآلة الافتراضية:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن Plugin الخاصة بـ Gateway محمّلة، وأن عقدة الآلة الافتراضية متصلة بالرمز الحالي، وأن جسر صوت Meet متاح قبل أن يفتح وكيل تبويب اجتماع حقيقيًا.

لاختبار دخان Twilio، استخدم اجتماعًا يعرض تفاصيل الاتصال الهاتفي:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

حالة Twilio المتوقعة:

- يتضمن `googlemeet setup` فحوصات خضراء لـ `twilio-voice-call-plugin` و`twilio-voice-call-credentials` و`twilio-voice-call-webhook`.
- يكون `voicecall` متاحًا في CLI بعد إعادة تحميل Gateway.
- تحتوي الجلسة المعادة على `transport: "twilio"` و`twilio.voiceCallId`.
- يعرض `openclaw logs --follow` تقديم DTMF TwiML قبل TwiML الآني، ثم جسرًا آنيًا مع وضع التحية الأولية في قائمة الانتظار.
- يؤدي `googlemeet leave <sessionId>` إلى إنهاء مكالمة الصوت المفوضة.

## استكشاف الأخطاء وإصلاحها

### لا يستطيع الوكيل رؤية أداة Google Meet

تأكد من تمكين Plugin في إعدادات Gateway وأعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد عدّلت للتو `plugins.entries.google-meet`، فأعد تشغيل Gateway أو أعد تحميله. يرى الوكيل قيد التشغيل فقط أدوات Plugin المسجلة بواسطة عملية Gateway الحالية.

على مضيفي Gateway غير macOS، تظل أداة `google_meet` الموجهة للوكيل مرئية، لكن إجراءات الرد الصوتي في Chrome المحلي تُحظر قبل وصولها إلى جسر الصوت. يعتمد صوت الرد في Chrome المحلي حاليًا على `BlackHole 2ch` في macOS، لذلك ينبغي لوكلاء Linux استخدام `mode: "transcribe"`، أو الاتصال الهاتفي عبر Twilio، أو مضيف `chrome-node` على macOS بدل مسار وكيل Chrome المحلي الافتراضي.

### لا توجد عقدة متصلة قادرة على Google Meet

على مضيف العقدة، شغّل:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

على مضيف Gateway، وافق على العقدة وتحقق من الأوامر:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

يجب أن تكون العقدة متصلة وأن تعرض `googlemeet.chrome` بالإضافة إلى `browser.proxy`. يجب أن تسمح إعدادات Gateway بأوامر العقد هذه:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

إذا فشل `googlemeet setup` في `chrome-node-connected` أو أبلغ سجل Gateway عن `gateway token mismatch`، فأعد تثبيت العقدة أو أعد تشغيلها باستخدام رمز Gateway الحالي. بالنسبة إلى Gateway على LAN، يعني هذا عادةً:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

ثم أعد تحميل خدمة العقدة وأعد التشغيل:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### يفتح المتصفح لكن الوكيل لا يستطيع الانضمام

شغّل `googlemeet test-listen` للانضمام بالمراقبة فقط أو `googlemeet test-speech` للانضمام الآني، ثم افحص صحة Chrome المعادة. إذا أبلغ أي من المجسين عن `manualActionRequired: true`، فأظهر `manualActionMessage` للمشغّل وتوقف عن إعادة المحاولة حتى يكتمل إجراء المتصفح.

الإجراءات اليدوية الشائعة:

- سجّل الدخول إلى ملف Chrome الشخصي.
- اقبل الضيف من حساب مضيف Meet.
- امنح Chrome أذونات الميكروفون/الكاميرا عندما تظهر مطالبة الأذونات الأصلية في Chrome.
- أغلق مربع حوار أذونات Meet العالق أو أصلحه.

لا تبلّغ عن "not signed in" لمجرد أن Meet يعرض "Do you want people to hear you in the meeting?" فهذا حاجز اختيار الصوت في Meet؛ ينقر OpenClaw على **Use microphone** عبر أتمتة المتصفح عندما يكون ذلك متاحًا ويستمر في انتظار حالة الاجتماع الحقيقية. بالنسبة إلى تراجع المتصفح للإنشاء فقط، قد ينقر OpenClaw على **Continue without microphone** لأن إنشاء عنوان URL لا يحتاج إلى مسار الصوت الآني.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` أولًا نقطة نهاية Google Meet API `spaces.create` عندما تكون بيانات اعتماد OAuth مكوّنة. ومن دون بيانات اعتماد OAuth، يتراجع إلى متصفح عقدة Chrome المثبتة. تأكد مما يلي:

- للإنشاء عبر API: تم تكوين `oauth.clientId` و`oauth.refreshToken`، أو توجد متغيرات البيئة المطابقة `OPENCLAW_GOOGLE_MEET_*`.
- للإنشاء عبر API: تم إصدار رمز التحديث بعد إضافة دعم الإنشاء. قد تفتقد الرموز الأقدم نطاق `meetings.space.created`؛ أعد تشغيل `openclaw googlemeet auth login --json` وحدّث إعدادات Plugin.
- لتراجع المتصفح: يشير `defaultTransport: "chrome-node"` و`chromeNode.node` إلى عقدة متصلة تحتوي على `browser.proxy` و`googlemeet.chrome`.
- لتراجع المتصفح: ملف OpenClaw الشخصي في Chrome على تلك العقدة مسجّل الدخول إلى Google ويمكنه فتح `https://meet.google.com/new`.
- لتراجع المتصفح: تعيد المحاولات استخدام تبويب `https://meet.google.com/new` موجود أو تبويب مطالبة حساب Google قبل فتح تبويب جديد. إذا انتهت مهلة وكيل، فأعد محاولة استدعاء الأداة بدل فتح تبويب Meet آخر يدويًا.
- لتراجع المتصفح: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم `browser.nodeId` و`browser.targetId` و`browserUrl` و`manualActionMessage` المعادة لتوجيه المشغّل. لا تعد المحاولة في حلقة حتى يكتمل ذلك الإجراء.
- لتراجع المتصفح: إذا عرض Meet "Do you want people to hear you in the meeting?"، فاترك التبويب مفتوحًا. ينبغي لـ OpenClaw النقر على **Use microphone** أو، في تراجع الإنشاء فقط، **Continue without microphone** عبر أتمتة المتصفح ومتابعة انتظار عنوان URL المنشأ لـ Meet. إذا تعذر ذلك، ينبغي أن يذكر الخطأ `meet-audio-choice-required`، وليس `google-login-required`.

### ينضم الوكيل لكنه لا يتحدث

تحقق من المسار الآني:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "agent"` لمسار الرد الصوتي العادي STT -> وكيل OpenClaw -> TTS، أو `mode: "bidi"` للتراجع الصوتي الآني المباشر. لا يبدأ `mode: "transcribe"` جسر الرد الصوتي عمدًا. لتصحيح الأخطاء بالمراقبة فقط، شغّل `openclaw googlemeet status --json <session-id>` بعد أن يتحدث المشاركون وتحقق من `captioning` و`transcriptLines` و`lastCaptionText`. إذا كانت `inCall` تساوي true لكن `transcriptLines` تبقى عند `0`، فقد تكون التسميات التوضيحية في Meet معطّلة، أو لم يتحدث أحد منذ تثبيت المراقب، أو تغيرت واجهة Meet، أو أن التسميات التوضيحية المباشرة غير متاحة للغة/حساب الاجتماع.

يتحقق `googlemeet test-speech` دائمًا من المسار الآني ويبلّغ عما إذا لوحظت بايتات خرج الجسر لذلك الاستدعاء. إذا كانت `speechOutputVerified` تساوي false و`speechOutputTimedOut` تساوي true، فقد يكون مزود الوقت الآني قد قبل النطق لكن OpenClaw لم يرَ بايتات خرج جديدة تصل إلى جسر صوت Chrome.

تحقق أيضًا مما يلي:

- يتوفر مفتاح مزود آني على مضيف Gateway، مثل `OPENAI_API_KEY` أو `GEMINI_API_KEY`.
- يظهر `BlackHole 2ch` على مضيف Chrome.
- يوجد `sox` على مضيف Chrome.
- يتم توجيه ميكروفون Meet ومكبر الصوت عبر مسار الصوت الافتراضي الذي يستخدمه OpenClaw. ينبغي أن يعرض `doctor` القيمة `meet output routed: yes` لانضمامات Chrome المحلية الآنية.

يطبع `googlemeet doctor [session-id]` الجلسة، والعقدة، وحالة داخل المكالمة، وسبب الإجراء اليدوي، واتصال مزود الوقت الآني، و`realtimeReady`، ونشاط إدخال/إخراج الصوت، وآخر طوابع زمنية للصوت، وعدادات البايت، وعنوان URL للمتصفح. استخدم `googlemeet status [session-id] --json` عندما تحتاج إلى JSON الخام. استخدم `googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث Google Meet OAuth من دون كشف الرموز؛ وأضف `--meeting` أو `--create-space` عندما تحتاج كذلك إلى إثبات Google Meet API.

إذا انتهت مهلة وكيل ويمكنك رؤية تبويب Meet مفتوحًا بالفعل، فافحص ذلك التبويب من دون فتح تبويب آخر:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. يركز ويفحص تبويب Meet موجودًا لوسيلة النقل المحددة. مع `chrome`، يستخدم تحكم المتصفح المحلي عبر Gateway؛ ومع `chrome-node`، يستخدم عقدة Chrome المكوّنة. لا يفتح تبويبًا جديدًا ولا ينشئ جلسة جديدة؛ بل يبلّغ عن العائق الحالي، مثل تسجيل الدخول أو القبول أو الأذونات أو حالة اختيار الصوت. يتواصل أمر CLI مع Gateway المكوّن، لذلك يجب أن يكون Gateway قيد التشغيل؛ ويتطلب `chrome-node` أيضًا أن تكون عقدة Chrome متصلة.

### فشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا به أو غير ممكّن. أضفه إلى `plugins.allow`، ومكّن `plugins.entries.voice-call`، وأعد تحميل Gateway.

يفشل `twilio-voice-call-credentials` عندما تفتقد واجهة Twilio الخلفية SID الحساب أو رمز المصادقة أو رقم المتصل. اضبط هذه على مضيف Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

يفشل `twilio-voice-call-webhook` عندما لا يمتلك `voice-call` تعريض Webhook عامًا، أو عندما يشير `publicUrl` إلى local loopback أو مساحة شبكة خاصة. اضبط `plugins.entries.voice-call.config.publicUrl` إلى عنوان URL العام للمزود أو كوّن تعريض نفق/‏Tailscale لـ `voice-call`.

عناوين URL الخاصة بـ loopback والشبكات الخاصة غير صالحة لاستدعاءات شركات الاتصالات. لا تستخدم `localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x` أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كـ `publicUrl`.

للحصول على عنوان URL عام مستقر:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

للتطوير المحلي، استخدم نفقًا أو تعريض Tailscale بدلًا من عنوان URL لمضيف خاص:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

ثم أعد تشغيل Gateway أو أعد تحميله وشغّل:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

يكون `voicecall smoke` مخصصًا لفحص الجاهزية فقط افتراضيًا. لإجراء تشغيل تجريبي لرقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

لا تُضِف `--yes` إلا عندما تريد عمدًا إجراء مكالمة إشعار صادرة مباشرة:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تبدأ مكالمة Twilio لكنها لا تدخل الاجتماع أبدًا

تأكد من أن حدث Meet يعرض تفاصيل الاتصال الهاتفي. مرّر رقم الاتصال الهاتفي ورقم PIN الدقيقين أو تسلسل DTMF مخصصًا:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم `w` بادئة أو فواصل في `--dtmf-sequence` إذا كان المزوّد يحتاج إلى توقف مؤقت قبل إدخال رقم PIN.

إذا تم إنشاء المكالمة الهاتفية لكن قائمة حضور Meet لا تُظهر مشارك الاتصال الهاتفي أبدًا:

- شغّل `openclaw googlemeet doctor <session-id>` للتأكد من معرّف مكالمة Twilio المفوّضة، وما إذا كان DTMF قد وُضع في قائمة الانتظار، وما إذا كانت تحية المقدمة قد طُلبت.
- شغّل `openclaw voicecall status --call-id <id>` وتأكد من أن المكالمة لا تزال نشطة.
- شغّل `openclaw voicecall tail` وتحقق من وصول Webhook الخاصة بـ Twilio إلى Gateway.
- شغّل `openclaw logs --follow` وابحث عن تسلسل Twilio Meet: يفوّض Google Meet الانضمام، وتبدأ Voice Call طرف الهاتف، وينتظر Google Meet مدة `voiceCall.dtmfDelayMs`، ويرسل DTMF باستخدام `voicecall.dtmf`، وينتظر مدة `voiceCall.postDtmfSpeechDelayMs`، ثم يطلب نطق المقدمة باستخدام `voicecall.speak`.
- أعد تشغيل `openclaw googlemeet setup --transport twilio`؛ يلزم نجاح فحص الإعداد، لكنه لا يثبت أن تسلسل رقم PIN للاجتماع صحيح.
- تأكد من أن رقم الاتصال الهاتفي ينتمي إلى دعوة Meet والمنطقة نفسهما مثل رقم PIN.
- زِد `voiceCall.dtmfDelayMs` إذا كان Meet يجيب ببطء أو كان نص المكالمة لا يزال يُظهر مطالبة تطلب رقم PIN بعد إرسال DTMF.
- إذا انضم المشارك لكنك لا تسمع التحية، فتحقق من `openclaw logs --follow` بحثًا عن طلب `voicecall.speak` بعد DTMF وعن تشغيل TTS عبر تدفق الوسائط أو بديل Twilio `<Say>`. إذا كان نص المكالمة لا يزال يحتوي على "enter the meeting PIN"، فهذا يعني أن طرف الهاتف لم ينضم بعد إلى غرفة Meet، لذلك لن يسمع المشاركون في الاجتماع الكلام.

إذا لم تصل Webhook، فابدأ بتصحيح Plugin Voice Call أولًا: يجب أن يتمكن المزوّد من الوصول إلى `plugins.entries.voice-call.config.publicUrl` أو النفق المكوّن. راجع [استكشاف أخطاء المكالمات الصوتية وإصلاحها](/ar/plugins/voice-call#troubleshooting).

## ملاحظات

واجهة API الرسمية للوسائط في Google Meet موجهة للاستقبال، لذلك لا يزال التحدث في مكالمة Meet يحتاج إلى مسار مشارك. يُبقي هذا Plugin ذلك الحد واضحًا: يتولى Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ وتتولى Twilio المشاركة عبر الاتصال الهاتفي.

تحتاج أوضاع الرد الصوتي في Chrome إلى `BlackHole 2ch` بالإضافة إلى أحد الخيارين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يمتلك OpenClaw الجسر ويمرر الصوت بصيغة `chrome.audioFormat` بين تلك الأوامر والمزوّد المحدد. يستخدم وضع الوكيل النسخ في الوقت الفعلي بالإضافة إلى TTS عادي؛ ويستخدم وضع bidi مزوّد الصوت في الوقت الفعلي. مسار Chrome الافتراضي هو PCM16 بتردد 24 كيلوهرتز مع `chrome.audioBufferBytes: 4096`؛ وتظل G.711 mu-law بتردد 8 كيلوهرتز متاحة لأزواج الأوامر القديمة.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي كاملًا ويجب أن يخرج بعد بدء أو التحقق من الخادم الخفي الخاص به. هذا صالح فقط لـ `bidi` لأن وضع `agent` يحتاج إلى وصول مباشر إلى زوج الأوامر من أجل TTS.

عندما يستدعي وكيل أداة `google_meet` في وضع الوكيل، تتفرع جلسة مستشار الاجتماع من نص المتصل الحالي قبل الرد على كلام المشاركين. تظل جلسة Meet منفصلة (`agent:<agentId>:subagent:google-meet:<sessionId>`) حتى لا تعدّل متابعات الاجتماع نص المتصل مباشرة.

للحصول على صوت مزدوج نظيف، وجّه مخرج Meet وميكروفون Meet عبر أجهزة افتراضية منفصلة أو مخطط جهاز افتراضي بنمط Loopback. يمكن لجهاز BlackHole مشترك واحد أن يعيد صدى المشاركين الآخرين إلى المكالمة.

مع جسر Chrome ذي زوج الأوامر، يمكن لـ `chrome.bargeInInputCommand` الاستماع إلى ميكروفون محلي منفصل ومسح تشغيل المساعد عندما يبدأ الإنسان بالكلام. هذا يُبقي كلام الإنسان متقدمًا على خرج المساعد حتى عندما يكون دخل BlackHole loopback المشترك مكبوتًا مؤقتًا أثناء تشغيل المساعد. ومثل `chrome.audioInputCommand` و`chrome.audioOutputCommand`، فهو أمر محلي يكوّنه المشغّل. استخدم مسار أمر موثوقًا صريحًا أو قائمة وسائط، ولا توجهه إلى نصوص برمجية من مواقع غير موثوقة.

يشغّل `googlemeet speak` جسر صوت الرد الصوتي النشط لجلسة Chrome. يوقف `googlemeet leave` ذلك الجسر. بالنسبة إلى جلسات Twilio المفوّضة عبر Plugin Voice Call، يؤدي `leave` أيضًا إلى إنهاء مكالمة الصوت الأساسية. استخدم `googlemeet end-active-conference` عندما تريد أيضًا إغلاق مؤتمر Google Meet النشط لمساحة مُدارة عبر API.

## ذو صلة

- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
