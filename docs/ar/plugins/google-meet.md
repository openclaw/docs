---
read_when:
    - تريد من وكيل OpenClaw الانضمام إلى مكالمة Google Meet
    - تريد من وكيل OpenClaw إنشاء مكالمة Google Meet جديدة
    - أنت تهيئ Chrome أو عقدة Chrome أو Twilio كناقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL صريحة لـ Meet عبر Chrome أو Twilio مع إعدادات agent talk-back الافتراضية'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-06-27T18:05:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

دعم المشاركين في Google Meet لـ OpenClaw — يكون الـ Plugin صريحًا حسب التصميم:

- لا ينضم إلا إلى عنوان URL صريح بصيغة `https://meet.google.com/...`.
- يمكنه إنشاء مساحة Meet جديدة عبر Google Meet API، ثم الانضمام إلى عنوان URL
  المُعاد.
- `agent` هو وضع الرد الصوتي الافتراضي: يستمع النسخ الفوري، ويجيب وكيل
  OpenClaw المُكوَّن، ويتحدث OpenClaw TTS العادي داخل Meet.
- يظل `bidi` متاحًا كوضع احتياطي لنموذج الصوت الفوري المباشر.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `agent` للاستماع/الرد
  الصوتي المباشر، أو `bidi` كاحتياطي صوت فوري مباشر، أو `transcribe`
  للانضمام/التحكم في المتصفح دون جسر الرد الصوتي.
- تبدأ المصادقة كـ Google OAuth شخصي أو كملف Chrome شخصي مسجّل دخوله مسبقًا.
- لا يوجد إعلان موافقة تلقائي.
- واجهة الصوت الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف Node مقترن.
- يقبل Twilio رقم اتصال هاتفي مع PIN اختياري أو تسلسل DTMF؛ ولا يمكنه
  الاتصال بعنوان URL لـ Meet مباشرة.
- أمر CLI هو `googlemeet`؛ و`meet` محجوز لتدفقات مؤتمرات الوكلاء الأوسع.

## البدء السريع

ثبّت تبعيات الصوت المحلية واضبط مزود نسخ فوريًا إضافةً إلى OpenClaw TTS
العادي. OpenAI هو مزود النسخ الافتراضي؛ ويعمل Google Gemini Live أيضًا
كاحتياطي صوت `bidi` منفصل مع `realtime.voiceProvider: "google"`:

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

فعّل الـ Plugin:

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

مخرجات الإعداد مصممة لتكون قابلة للقراءة من الوكيل ومراعية للوضع. تعرض ملف
Chrome الشخصي، وتثبيت Node، وبالنسبة لانضمامات Chrome الفورية، جسر الصوت
BlackHole/SoX وفحوصات المقدمة الفورية المؤجلة. بالنسبة لانضمامات المراقبة فقط،
تحقق من النقل نفسه باستخدام `--mode transcribe`؛ يتخطى هذا الوضع متطلبات
الصوت الفوري لأنه لا يستمع عبر الجسر ولا يتحدث عبره:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

عند ضبط تفويض Twilio، يعرض الإعداد أيضًا ما إذا كان Plugin `voice-call`
وبيانات اعتماد Twilio وتعرّض الـ Webhook العام جاهزة. تعامل مع أي فحص
`ok: false` كحاجز للنقل والوضع المفحوصين قبل أن تطلب من وكيل الانضمام.
استخدم `openclaw googlemeet setup --json` للسكربتات أو المخرجات القابلة
للقراءة آليًا. استخدم `--transport chrome` أو `--transport chrome-node` أو
`--transport twilio` لإجراء فحص مسبق لنقل محدد قبل أن يجربه وكيل.

بالنسبة إلى Twilio، أجرِ دائمًا فحصًا مسبقًا للنقل صراحةً عندما يكون النقل
الافتراضي هو Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

يلتقط ذلك نقص توصيل `voice-call`، أو بيانات اعتماد Twilio، أو تعرّض Webhook
غير القابل للوصول قبل أن يحاول الوكيل الاتصال بالاجتماع.

انضم إلى اجتماع:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو دع وكيلًا ينضم عبر أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

تظل أداة `google_meet` الموجهة للوكلاء متاحة على مضيفين غير macOS لتدفقات
الأثر، والتقويم، والإعداد، والنسخ، وTwilio، و`chrome-node`. تُحظر إجراءات
الرد الصوتي المحلية في Chrome هناك لأن مسار صوت Chrome المضمّن يعتمد حاليًا
على `BlackHole 2ch` في macOS. على Linux، استخدم `mode: "transcribe"`، أو
الاتصال الهاتفي عبر Twilio، أو مضيف `chrome-node` يعمل على macOS للمشاركة
بالرد الصوتي عبر Chrome.

أنشئ اجتماعًا جديدًا وانضم إليه:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

بالنسبة إلى الغرف المنشأة عبر API، استخدم Google Meet `SpaceConfig.accessType`
عندما تريد أن تكون سياسة عدم الطرق الخاصة بالغرفة صريحة بدلًا من وراثتها من
افتراضات حساب Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

يسمح `OPEN` لأي شخص لديه عنوان URL لـ Meet بالانضمام دون طرق. يسمح `TRUSTED`
للمستخدمين الموثوقين في مؤسسة المضيف، والمستخدمين الخارجيين المدعوين،
ومستخدمي الاتصال الهاتفي بالانضمام دون طرق. يقيّد `RESTRICTED` الدخول دون
طرق على المدعوين. تنطبق هذه الإعدادات فقط على مسار الإنشاء الرسمي عبر
Google Meet API، لذلك يجب ضبط بيانات اعتماد OAuth.

إذا صادقت Google Meet قبل إتاحة هذا الخيار، فأعد تشغيل
`openclaw googlemeet auth login --json` بعد إضافة نطاق
`meetings.space.settings` إلى شاشة موافقة Google OAuth لديك.

أنشئ عنوان URL فقط دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

لدى `googlemeet create` مساران:

- إنشاء API: يُستخدم عند ضبط بيانات اعتماد Google Meet OAuth. هذا هو المسار
  الأكثر حتمية ولا يعتمد على حالة واجهة المتصفح.
- احتياطي المتصفح: يُستخدم عند غياب بيانات اعتماد OAuth. يستخدم OpenClaw
  Chrome Node المثبت، ويفتح `https://meet.google.com/new`، وينتظر أن يعيد
  Google التوجيه إلى عنوان URL حقيقي برمز اجتماع، ثم يعيد ذلك العنوان. يتطلب
  هذا المسار أن يكون ملف Chrome الشخصي الخاص بـ OpenClaw على الـ Node مسجّل
  الدخول مسبقًا إلى Google. تتعامل أتمتة المتصفح مع مطالبة الميكروفون الأولى
  الخاصة بـ Meet؛ ولا تُعامل تلك المطالبة كفشل تسجيل دخول إلى Google.
  تحاول تدفقات الانضمام والإنشاء أيضًا إعادة استخدام تبويب Meet موجود قبل
  فتح تبويب جديد. تتجاهل المطابقة سلاسل استعلام URL غير الضارة مثل
  `authuser`، لذلك ينبغي أن يركز إعادة المحاولة من الوكيل على الاجتماع
  المفتوح مسبقًا بدلًا من إنشاء تبويب Chrome ثانٍ.

تتضمن مخرجات الأمر/الأداة حقل `source` (`api` أو `browser`) حتى تتمكن
الوكلاء من شرح المسار المستخدم. ينضم `create` إلى الاجتماع الجديد افتراضيًا
ويعيد `joined: true` إضافةً إلى جلسة الانضمام. لاستخراج عنوان URL فقط،
استخدم `create --no-join` في CLI أو مرر `"join": false` إلى الأداة.

أو قل لوكيل: "أنشئ Google Meet، وانضم إليه بوضع الرد الصوتي الخاص بالوكيل،
وأرسل لي الرابط." ينبغي للوكيل استدعاء `google_meet` مع
`action: "create"` ثم مشاركة `meetingUri` المُعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

لانضمام مراقبة فقط/تحكم بالمتصفح، اضبط `"mode": "transcribe"`. لا يبدأ ذلك
جسر الصوت الفوري ثنائي الاتجاه، ولا يتطلب BlackHole أو SoX، ولن يرد صوتيًا
داخل الاجتماع. تتجنب انضمامات Chrome في هذا الوضع أيضًا منح إذن
الميكروفون/الكاميرا من OpenClaw وتتجنب مسار Meet **Use microphone**. إذا عرض
Meet فاصلة اختيار الصوت، تحاول الأتمتة مسار عدم استخدام الميكروفون، وإلا
تبلغ عن إجراء يدوي بدلًا من فتح الميكروفون المحلي. في وضع النسخ، تثبّت
وسائل نقل Chrome المُدارة أيضًا مراقب تسميات توضيحية لـ Meet بأفضل جهد.
يعرض `googlemeet status --json` و`googlemeet doctor` قيم `captioning`،
و`captionsEnabledAttempted`، و`transcriptLines`، و`lastCaptionAt`،
و`lastCaptionSpeaker`، و`lastCaptionText`، وذيل `recentTranscript` قصيرًا
حتى يتمكن المشغّلون من معرفة ما إذا كان المتصفح قد انضم إلى المكالمة وما إذا
كانت تسميات Meet التوضيحية تنتج نصًا.
استخدم `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
عندما تحتاج إلى فحص نعم/لا: ينضم في وضع النسخ، وينتظر حركة جديدة في التسمية
التوضيحية أو النص المنسوخ، ويعيد `listenVerified`، و`listenTimedOut`، وحقول
الإجراء اليدوي، وآخر حالة لصحة التسميات التوضيحية.

أثناء الجلسات الفورية، تتضمن حالة `google_meet` صحة المتصفح وجسر الصوت مثل
`inCall`، و`manualActionRequired`، و`providerConnected`، و`realtimeReady`،
و`audioInputActive`، و`audioOutputActive`، والطوابع الزمنية لآخر إدخال/إخراج،
وعدادات البايت، وحالة إغلاق الجسر. إذا ظهرت مطالبة آمنة في صفحة Meet،
تتعامل معها أتمتة المتصفح عندما تستطيع. يُبلغ عن مطالبات تسجيل الدخول،
وقبول المضيف، وأذونات المتصفح/نظام التشغيل كإجراء يدوي مع سبب ورسالة لكي
ينقلها الوكيل. لا تصدر جلسات Chrome المُدارة عبارة المقدمة أو الاختبار إلا
بعد أن تبلغ صحة المتصفح `inCall: true`؛ وإلا تعرض الحالة `speechReady: false`
وتُحظر محاولة الكلام بدلًا من التظاهر بأن الوكيل تحدث داخل الاجتماع.

تنضم جلسات Chrome المحلية عبر ملف متصفح OpenClaw الشخصي مسجّل الدخول. يتطلب
الوضع الفوري `BlackHole 2ch` لمسار الميكروفون/مكبر الصوت الذي يستخدمه
OpenClaw. للحصول على صوت ثنائي الاتجاه نظيف، استخدم أجهزة افتراضية منفصلة
أو رسمًا بيانيًا بنمط Loopback؛ يكفي جهاز BlackHole واحد لاختبار دخان أولي
لكنه قد يسبب صدى.

### Gateway محلي + Chrome في Parallels

لا تحتاج إلى Gateway كامل من OpenClaw أو مفتاح model API داخل جهاز macOS
افتراضي لمجرد أن تجعل الجهاز الافتراضي يمتلك Chrome. شغّل Gateway والوكيل
محليًا، ثم شغّل مضيف Node داخل الجهاز الافتراضي. فعّل الـ Plugin المضمّن على
الجهاز الافتراضي مرة واحدة حتى يعلن الـ Node عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح model/API،
  ومزود الوقت الفوري، وضبط Plugin Google Meet.
- جهاز Parallels macOS الافتراضي: OpenClaw CLI/مضيف Node، وGoogle Chrome،
  وSoX، وBlackHole 2ch، وملف Chrome شخصي مسجّل الدخول إلى Google.
- غير مطلوب في الجهاز الافتراضي: خدمة Gateway، أو ضبط الوكيل، أو مفتاح
  OpenAI/GPT، أو إعداد مزود النموذج.

ثبّت تبعيات الجهاز الافتراضي:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل الجهاز الافتراضي بعد تثبيت BlackHole حتى يعرض macOS
`BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقق من أن الجهاز الافتراضي يمكنه رؤية جهاز الصوت وأوامر
SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ثبّت OpenClaw أو حدّثه في الجهاز الافتراضي، ثم فعّل الـ Plugin المضمّن هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ مضيف Node في الجهاز الافتراضي:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على LAN ولا تستخدم TLS، يرفض الـ Node
اتصال WebSocket غير المشفر ما لم تشترك صراحةً في تلك الشبكة الخاصة الموثوقة:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

استخدم متغير البيئة نفسه عند تثبيت الـ Node كـ LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو بيئة العملية، وليس إعدادًا في
`openclaw.json`. يخزّنه `openclaw node install` في بيئة LaunchAgent عندما
يكون موجودًا في أمر التثبيت.

وافق على الـ Node من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأكد من أن Gateway يرى الـ Node وأنه يعلن كلاً من `googlemeet.chrome` وقدرة
المتصفح/`browser.proxy`:

```bash
openclaw nodes status
```

وجّه Meet عبر ذلك الـ Node على مضيف Gateway:

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

أثناء الانضمام الفوري، تملأ أتمتة متصفح OpenClaw اسم الضيف، وتنقر
Join/Ask to join، وتقبل خيار "Use microphone" في التشغيل الأول لـ Meet عندما
تظهر تلك المطالبة. أثناء الانضمام للمراقبة فقط أو إنشاء اجتماع من المتصفح فقط، فإنها
تتجاوز المطالبة نفسها من دون ميكروفون عندما يكون ذلك الخيار متاحًا.
إذا لم يكن ملف تعريف المتصفح مسجل الدخول، أو كان Meet ينتظر قبول المضيف،
أو كان Chrome يحتاج إلى إذن الميكروفون/الكاميرا لانضمام فوري، أو كان Meet عالقًا
على مطالبة تعذرت على الأتمتة معالجتها، فإن نتيجة join/test-speech تعرض
`manualActionRequired: true` مع `manualActionReason` و
`manualActionMessage`. يجب على الوكلاء إيقاف إعادة محاولة الانضمام، والإبلاغ عن تلك
الرسالة بالضبط بالإضافة إلى `browserUrl`/`browserTitle` الحاليين، وإعادة المحاولة فقط بعد
اكتمال إجراء المتصفح اليدوي.

إذا حُذف `chromeNode.node`، فإن OpenClaw يحدد تلقائيًا فقط عندما تعلن عقدة
متصلة واحدة بالضبط عن كل من `googlemeet.chrome` والتحكم في المتصفح. إذا كانت
عدة عقد قادرة متصلة، فاضبط `chromeNode.node` على معرف العقدة،
أو اسم العرض، أو عنوان IP البعيد.

فحوصات الفشل الشائعة:

- `Configured Google Meet node ... is not usable: offline`: العقدة المثبتة
  معروفة لدى Gateway لكنها غير متاحة. يجب على الوكلاء التعامل مع تلك العقدة باعتبارها
  حالة تشخيصية، لا مضيف Chrome قابلًا للاستخدام، والإبلاغ عن عائق الإعداد
  بدلًا من الرجوع إلى نقل آخر ما لم يطلب المستخدم ذلك.
- `No connected Google Meet-capable node`: شغّل `openclaw node run` في VM،
  وافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` في VM. تأكد أيضًا من أن مضيف
  Gateway يسمح بأمري العقدة معًا عبر
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: ثبّت `blackhole-2ch` على المضيف
  الذي يجري فحصه وأعد التشغيل قبل استخدام صوت Chrome المحلي.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في VM وأعد تشغيل VM.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف تعريف المتصفح داخل VM، أو
  أبقِ `chrome.guestName` مضبوطًا لانضمام الضيف. يستخدم الانضمام التلقائي للضيف أتمتة
  متصفح OpenClaw عبر وكيل متصفح العقدة؛ تأكد من أن إعداد متصفح العقدة
  يشير إلى ملف التعريف الذي تريده، مثل
  `browser.defaultProfile: "user"` أو ملف تعريف جلسة قائمة مسمى.
- تبويبات Meet مكررة: اترك `chrome.reuseExistingTab: true` مفعّلًا. يفعّل OpenClaw
  تبويبًا قائمًا لعنوان Meet URL نفسه قبل فتح تبويب جديد، كما أن
  إنشاء الاجتماع عبر المتصفح يعيد استخدام تبويب `https://meet.google.com/new`
  قيد التقدم أو تبويب مطالبة حساب Google قبل فتح تبويب آخر.
- لا يوجد صوت: في Meet، وجّه صوت الميكروفون/السماعة عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيهًا بنمط Loopback
  للحصول على صوت ثنائي الاتجاه نظيف.

## ملاحظات التثبيت

يستخدم الإعداد الافتراضي لرد Chrome الصوتي أداتين خارجيتين:

- `sox`: أداة صوتية لسطر الأوامر. يستخدم Plugin أوامر جهاز CoreAudio
  صريحة لجسر الصوت الافتراضي PCM16 بتردد 24 كيلوهرتز.
- `blackhole-2ch`: مشغل صوت افتراضي لنظام macOS. ينشئ جهاز الصوت `BlackHole 2ch`
  الذي يمكن لـ Chrome/Meet التوجيه عبره.

لا يضمّن OpenClaw أيًا من الحزمتين ولا يعيد توزيعهما. تطلب الوثائق من المستخدمين
تثبيتهما كتبعيّات مضيف عبر Homebrew. SoX مرخص بموجب
`LGPL-2.0-only AND GPL-2.0-only`؛ وBlackHole مرخص بموجب GPL-3.0. إذا أنشأت
مثبّتًا أو جهازًا يضمّن BlackHole مع OpenClaw، فراجع شروط ترخيص BlackHole
من المصدر الأصلي أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

يفتح نقل Chrome عنوان Meet URL عبر تحكم متصفح OpenClaw وينضم
بملف تعريف متصفح OpenClaw المسجل الدخول. على macOS، يفحص Plugin وجود
`BlackHole 2ch` قبل التشغيل. وإذا كان مهيأً، فإنه يشغّل أيضًا أمر صحة جسر الصوت
وأمر بدء التشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت
على مضيف Gateway؛ واستخدم `chrome-node` عندما يكون Chrome/الصوت
على عقدة مقترنة مثل Parallels macOS VM. بالنسبة إلى Chrome المحلي، اختر
ملف التعريف باستخدام `browser.defaultProfile`؛ ويُمرر `chrome.browserProfile` إلى
مضيفي `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون Chrome وسماعته عبر جسر صوت OpenClaw المحلي.
إذا لم يكن `BlackHole 2ch` مثبتًا، يفشل الانضمام بخطأ إعداد
بدلًا من الانضمام بصمت من دون مسار صوتي.

### Twilio

نقل Twilio هو خطة اتصال صارمة مفوضة إلى Plugin المكالمات الصوتية. وهو
لا يحلل صفحات Meet لاستخراج أرقام الهاتف.

استخدم هذا عندما لا تكون مشاركة Chrome متاحة أو عندما تريد خيار رجوع
للاتصال الهاتفي. يجب أن يعرض Google Meet رقم اتصال هاتفي ورقم PIN
للاجتماع؛ لا يكتشف OpenClaw هذه المعلومات من صفحة Meet.

فعّل Plugin المكالمات الصوتية على مضيف Gateway، وليس على عقدة Chrome:

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

وفّر بيانات اعتماد Twilio عبر البيئة أو الإعداد. تُبقي البيئة
الأسرار خارج `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

استخدم `realtime.provider: "openai"` مع Plugin مزود OpenAI و
`OPENAI_API_KEY` بدلًا من ذلك إذا كان هذا هو مزود الصوت الفوري لديك.

أعد تشغيل Gateway أو أعد تحميله بعد تفعيل `voice-call`؛ لا تظهر تغييرات إعداد Plugin
في عملية Gateway قيد التشغيل بالفعل حتى يُعاد تحميلها.

ثم تحقق:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

عندما يكون تفويض Twilio موصلًا، يتضمن `googlemeet setup` فحوصات ناجحة
لـ `twilio-voice-call-plugin` و`twilio-voice-call-credentials` و
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
إلى أتمتة المتصفح. هيّئ OAuth عندما تريد الإنشاء عبر API الرسمي،
أو حل المساحات، أو فحوصات Meet Media API المسبقة.

يستخدم الوصول إلى Google Meet API OAuth الخاص بالمستخدم: أنشئ عميل Google Cloud OAuth،
واطلب النطاقات المطلوبة، وفوّض حساب Google، ثم خزّن
رمز التحديث الناتج في إعداد Plugin Google Meet أو وفّر
متغيرات البيئة `OPENCLAW_GOOGLE_MEET_*`.

لا يستبدل OAuth مسار انضمام Chrome. لا تزال وسائل نقل Chrome وChrome-node
تنضم عبر ملف تعريف Chrome مسجل الدخول، وBlackHole/SoX، وعقدة متصلة
عندما تستخدم مشاركة المتصفح. OAuth مخصص فقط لمسار Google Meet API
الرسمي: إنشاء مساحات الاجتماعات، وحل المساحات، وتشغيل فحوصات Meet Media API
المسبقة.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو حدده.
2. فعّل **Google Meet REST API** لذلك المشروع.
3. هيّئ شاشة موافقة OAuth.
   - **Internal** هو الأبسط لمؤسسة Google Workspace.
   - **External** يعمل لإعدادات الاختبار/الشخصية؛ ما دام التطبيق في Testing،
     أضف كل حساب Google سيفوّض التطبيق كمستخدم اختبار.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرف عميل OAuth.
   - نوع التطبيق: **Web application**.
   - عنوان URI لإعادة التوجيه المصرح به:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرف العميل وسر العميل.

`meetings.space.created` مطلوب من Google Meet `spaces.create`.
يتيح `meetings.space.readonly` لـ OpenClaw حل عناوين/رموز Meet URL إلى مساحات.
يتيح `meetings.space.settings` لـ OpenClaw تمرير إعدادات `SpaceConfig` مثل
`accessType` أثناء إنشاء الغرفة عبر API.
`meetings.conference.media.readonly` مخصص لفحص Meet Media API المسبق وعمل الوسائط؛
قد تتطلب Google التسجيل في Developer Preview لاستخدام Media API فعليًا.
إذا كنت تحتاج فقط إلى انضمامات Chrome المستندة إلى المتصفح، فتجاوز OAuth بالكامل.

### إصدار رمز التحديث

هيّئ `oauth.clientId` واختياريًا `oauth.clientSecret`، أو مررهما
كمتغيرات بيئة، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعداد `oauth` تحتوي على رمز تحديث. يستخدم PKCE،
واستدعاء localhost على `http://localhost:8085/oauth2callback`، وتدفق
نسخ/لصق يدويًا مع `--manual`.

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

فضّل متغيرات البيئة عندما لا تريد وضع رمز التحديث في الإعداد.
إذا كانت قيم الإعداد والبيئة موجودة معًا، فإن Plugin يحل الإعداد
أولًا ثم يستخدم البيئة كخيار رجوع.

تتضمن موافقة OAuth إنشاء مساحة Meet، ووصول قراءة مساحة Meet، ووصول قراءة
وسائط مؤتمر Meet. إذا صادقت قبل وجود دعم إنشاء الاجتماعات،
فأعد تشغيل `openclaw googlemeet auth login --json` حتى يحصل رمز التحديث
على نطاق `meetings.space.created`.

### التحقق من OAuth باستخدام doctor

شغّل doctor الخاص بـ OAuth عندما تريد فحص صحة سريعًا بلا أسرار:

```bash
openclaw googlemeet doctor --oauth --json
```

لا يحمّل هذا وقت تشغيل Chrome ولا يتطلب عقدة Chrome متصلة. إنه
يتحقق من وجود إعداد OAuth وأن رمز التحديث يمكنه إصدار رمز وصول.
يتضمن تقرير JSON حقول الحالة فقط مثل `ok` و`configured` و
`tokenSource` و`expiresAt` ورسائل الفحص؛ ولا يطبع رمز الوصول
أو رمز التحديث أو سر العميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | يوجد `oauth.clientId` مع `oauth.refreshToken`، أو رمز وصول مخزن مؤقتا.       |
| `oauth-token`        | لا يزال رمز الوصول المخزن مؤقتا صالحا، أو أصدر رمز التحديث رمز وصول جديدا. |
| `meet-spaces-get`    | نجح فحص `--meeting` الاختياري في حل مساحة Meet موجودة.                             |
| `meet-spaces-create` | أنشأ فحص `--create-space` الاختياري مساحة Meet جديدة.                               |

لإثبات تفعيل Google Meet API ونطاق `spaces.create` أيضا، شغل فحص الإنشاء ذي
الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

ينشئ `--create-space` عنوان URL مؤقتا لتطبيق Meet. استخدمه عندما تحتاج إلى تأكيد
أن مشروع Google Cloud فعّل Meet API وأن الحساب المصرح له يملك نطاق
`meetings.space.created`.

لإثبات صلاحية القراءة لمساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` صلاحية القراءة لمساحة موجودة
يمكن لحساب Google المصرح له الوصول إليها. تعني استجابة `403` من هذه الفحوص عادة
أن Google Meet REST API معطل، أو أن رمز التحديث الذي تمت الموافقة عليه يفتقد
النطاق المطلوب، أو أن حساب Google لا يستطيع الوصول إلى مساحة Meet تلك. يعني خطأ
رمز التحديث إعادة تشغيل `openclaw googlemeet auth login
--json` وتخزين كتلة `oauth` الجديدة.

لا حاجة إلى بيانات اعتماد OAuth للبديل عبر المتصفح. في هذا الوضع، تأتي مصادقة Google
من ملف Chrome الشخصي المسجل دخوله على العقدة المحددة، وليس من إعدادات
OpenClaw.

تقبل متغيرات البيئة هذه كبدائل:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

حل عنوان URL لتطبيق Meet، أو رمز، أو `spaces/{id}` عبر `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

شغل الفحص التمهيدي قبل عمل الوسائط:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اعرض عناصر الاجتماع وسجل الحضور بعد أن ينشئ Meet سجلات المؤتمر:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

مع `--meeting`، يستخدم `artifacts` و`attendance` أحدث سجل مؤتمر
افتراضيا. مرر `--all-conference-records` عندما تريد كل السجلات المحتفظ بها
لذلك الاجتماع.

يمكن لبحث التقويم حل عنوان URL للاجتماع من Google Calendar قبل قراءة
عناصر Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` لليوم عن حدث Calendar يحتوي على رابط
Google Meet. استخدم `--event <query>` للبحث في نص الحدث المطابق، و
`--calendar <id>` لتقويم غير أساسي. يتطلب بحث التقويم تسجيل دخول OAuth جديدا
يتضمن نطاق القراءة فقط لأحداث Calendar.
يعرض `calendar-events` معاينة أحداث Meet المطابقة ويميز الحدث الذي سيختاره
`latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف بالفعل معرف سجل المؤتمر، فخاطبه مباشرة:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

أنه مؤتمرا نشطا لمساحة منشأة عبر API عندما تريد إغلاق
الغرفة بعد المكالمة:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

يستدعي هذا Google Meet `spaces.endActiveConference` ويتطلب OAuth بنطاق
`meetings.space.created` لمساحة يمكن للحساب المصرح له إدارتها.
يقبل OpenClaw عنوان URL لتطبيق Meet، أو رمز اجتماع، أو إدخال `spaces/{id}` ويحله
إلى مورد مساحة API قبل إنهاء المؤتمر النشط.
وهو منفصل عن `googlemeet leave`: يوقف `leave` مشاركة OpenClaw المحلية/الجلسة،
بينما يطلب `end-active-conference` من Google Meet إنهاء المؤتمر النشط للمساحة.

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

يعيد `artifacts` بيانات تعريف سجل المؤتمر إضافة إلى بيانات تعريف موارد المشاركين،
والتسجيل، والنص المنسوخ، ومدخلات النص المنسوخ المنظمة، والملاحظات الذكية عندما
تكشفها Google للاجتماع. استخدم `--no-transcript-entries` لتخطي
البحث عن المدخلات للاجتماعات الكبيرة. يوسع `attendance` المشاركين إلى
صفوف جلسات مشارك مع أوقات أول/آخر ظهور، وإجمالي مدة الجلسة،
وعلامات التأخر/المغادرة المبكرة، ودمج موارد المشاركين المكررة بحسب المستخدم
المسجل دخوله أو اسم العرض. مرر `--no-merge-duplicates` لإبقاء موارد المشاركين
الأولية منفصلة، و`--late-after-minutes` لضبط اكتشاف التأخر، و
`--early-before-minutes` لضبط اكتشاف المغادرة المبكرة.

يكتب `export` مجلدا يحتوي على `summary.md` و`attendance.csv` و
`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`.
يسجل `manifest.json` الإدخال المختار، وخيارات التصدير، وسجلات المؤتمر،
وملفات الإخراج، والأعداد، ومصدر الرمز، وحدث Calendar عند استخدامه، وأي
تحذيرات استرجاع جزئية. مرر `--zip` لكتابة أرشيف قابل للنقل أيضا
بجوار المجلد. مرر `--include-doc-bodies` لتصدير نص Google Docs المرتبط بالنص
المنسوخ والملاحظات الذكية عبر Google Drive `files.export`؛ يتطلب ذلك
تسجيل دخول OAuth جديدا يتضمن نطاق القراءة فقط لـ Drive Meet. دون
`--include-doc-bodies`، تتضمن عمليات التصدير بيانات تعريف Meet ومدخلات النص
المنسوخ المنظمة فقط. إذا أعادت Google فشلا جزئيا في العناصر، مثل خطأ في
قائمة ملاحظات ذكية، أو مدخل نص منسوخ، أو جسم مستند Drive، يحتفظ الملخص و
البيان بالتحذير بدلا من إفشال التصدير كله.
استخدم `--dry-run` لجلب بيانات العناصر/الحضور نفسها وطباعة
JSON الخاص بالبيان دون إنشاء المجلد أو ZIP. يفيد ذلك قبل كتابة
تصدير كبير أو عندما يحتاج الوكيل فقط إلى الأعداد، والسجلات المختارة، و
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

عين `"dryRun": true` لإرجاع بيان التصدير فقط وتخطي كتابة الملفات.

يمكن للوكلاء أيضا إنشاء غرفة مدعومة بـ API بسياسة وصول صريحة:

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

للتحقق القائم على الاستماع أولا، ينبغي للوكلاء استخدام `test_listen` قبل الادعاء بأن
الاجتماع مفيد:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

شغل اختبار الدخان الحي المحروس على اجتماع حقيقي محتفظ به:

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

بيئة اختبار الدخان الحي:

- يفعّل `OPENCLAW_LIVE_TEST=1` الاختبارات الحية المحروسة.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL محتفظ به لتطبيق Meet، أو رمز، أو
  `spaces/{id}`.
- يوفر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرف عميل OAuth.
- يوفر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
  رمز التحديث.
- اختياري: تستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء البدائل نفسها
  دون بادئة `OPENCLAW_`.

يحتاج اختبار الدخان الحي الأساسي للعناصر/الحضور إلى
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. يحتاج بحث Calendar
إلى `https://www.googleapis.com/auth/calendar.events.readonly`. يحتاج تصدير
جسم مستند Drive إلى
`https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد، والمصدر، وجلسة الانضمام. باستخدام بيانات اعتماد OAuth
يستخدم Google Meet API الرسمي. ودون بيانات اعتماد OAuth يستخدم
ملف المتصفح الشخصي المسجل دخوله في عقدة Chrome المثبتة كبديل. يمكن للوكلاء
استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في خطوة
واحدة. للإنشاء المقتصر على عنوان URL، مرر `"join": false`.

مثال على مخرجات JSON من بديل المتصفح:

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

إذا واجه بديل المتصفح تسجيل دخول Google أو حاجب أذونات Meet قبل أن
يتمكن من إنشاء عنوان URL، تعيد طريقة Gateway استجابة فاشلة وتعيد
أداة `google_meet` تفاصيل منظمة بدلا من سلسلة نصية عادية:

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

عندما يرى الوكيل `manualActionRequired: true`، ينبغي له الإبلاغ عن
`manualActionMessage` مع سياق عقدة/تبويب المتصفح والتوقف عن فتح تبويبات
Meet جديدة حتى يكمل المشغل خطوة المتصفح.

مثال على مخرجات JSON من إنشاء API:

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

يؤدي إنشاء Meet إلى الانضمام افتراضيا. ما زال نقل Chrome أو Chrome-node
يحتاج إلى ملف شخصي في Google Chrome مسجل الدخول للانضمام عبر المتصفح. إذا كان
الملف الشخصي مسجل الخروج، فسيبلغ OpenClaw عن `manualActionRequired: true` أو
خطأ رجوع للمتصفح، ويطلب من المشغل إكمال تسجيل الدخول إلى Google قبل
إعادة المحاولة.

عيّن `preview.enrollmentAcknowledged: true` فقط بعد التأكد من أن مشروع Cloud
وكيان OAuth الأساسي ومشاركي الاجتماع مسجلون في Google Workspace Developer Preview Program
لواجهات Meet media APIs.

## الإعداد

لا يحتاج مسار وكيل Chrome الشائع إلا إلى تفعيل Plugin وBlackHole وSoX ومفتاح
مزود نسخ فوري، ومزود TTS مهيأ في OpenClaw. OpenAI هو مزود النسخ الافتراضي؛
عيّن `realtime.voiceProvider` إلى `"google"` و`realtime.model` لاستخدام
Google Gemini Live لوضع `bidi` من دون تغيير مزود النسخ الافتراضي لوضع الوكيل:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

عيّن إعدادات Plugin ضمن `plugins.entries.google-meet.config`:

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
  `"agent"`؛ يجب أن تستخدم استدعاءات الأدوات الجديدة `"agent"`)
- `chromeNode.node`: معرف/اسم/IP اختياري للعقدة من أجل `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم في شاشة ضيف Meet غير
  المسجل الدخول
- `chrome.autoJoin: true`: محاولة بأفضل جهد لملء اسم الضيف والنقر على Join Now
  عبر أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تفعيل تبويب Meet موجود بدلا من فتح نسخ مكررة
- `chrome.waitForInCallMs: 20000`: الانتظار حتى يبلغ تبويب Meet أنه داخل
  المكالمة قبل تشغيل مقدمة الرد الصوتي
- `chrome.audioFormat: "pcm16-24khz"`: تنسيق صوت زوج الأوامر. استخدم
  `"g711-ulaw-8khz"` فقط لأزواج الأوامر القديمة/المخصصة التي لا تزال تصدر
  صوتا هاتفيا.
- `chrome.audioBufferBytes: 4096`: مخزن معالجة SoX المؤقت لأوامر صوت زوج
  أوامر Chrome المولدة. هذا يساوي نصف مخزن SoX الافتراضي البالغ 8192 بايت،
  ما يقلل كمون الأنبوب الافتراضي مع ترك مجال لزيادته على المضيفات المزدحمة.
  تُثبت القيم الأقل من حد SoX الأدنى عند 17 بايت.
- `chrome.audioInputCommand`: أمر SoX يقرأ من CoreAudio `BlackHole 2ch`
  ويكتب الصوت بتنسيق `chrome.audioFormat`
- `chrome.audioOutputCommand`: أمر SoX يقرأ الصوت بتنسيق `chrome.audioFormat`
  ويكتب إلى CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: أمر ميكروفون محلي اختياري يكتب PCM أحادي
  القناة signed 16-bit little-endian لاكتشاف مقاطعة الإنسان أثناء تشغيل صوت
  المساعد. ينطبق هذا حاليا على جسر زوج أوامر `chrome` المستضاف على Gateway.
- `chrome.bargeInRmsThreshold: 650`: مستوى RMS الذي يُحتسب كمقاطعة بشرية على
  `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: مستوى الذروة الذي يُحتسب كمقاطعة بشرية
  على `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: أقل تأخير بين عمليات مسح المقاطعة البشرية
  المتكررة
- `mode: "agent"`: وضع الرد الصوتي الافتراضي. يتم نسخ كلام المشاركين بواسطة
  مزود النسخ الفوري المهيأ، وإرساله إلى وكيل OpenClaw المهيأ في جلسة وكيل
  فرعي لكل اجتماع، ثم نطقه مرة أخرى عبر وقت تشغيل TTS العادي في OpenClaw.
- `mode: "bidi"`: وضع رجوع لنموذج فوري ثنائي الاتجاه مباشر. يجيب مزود الصوت
  الفوري عن كلام المشاركين مباشرة وقد يستدعي `openclaw_agent_consult` للحصول
  على إجابات أعمق/مدعومة بالأدوات.
- `mode: "transcribe"`: وضع مراقبة فقط من دون جسر الرد الصوتي.
- `realtime.provider: "openai"`: رجوع توافق يُستخدم عندما تكون حقول المزود
  المحددة أدناه غير مضبوطة.
- `realtime.transcriptionProvider: "openai"`: معرف المزود الذي يستخدمه وضع
  `agent` للنسخ الفوري.
- `realtime.voiceProvider`: معرف المزود الذي يستخدمه وضع `bidi` للصوت الفوري
  المباشر. عيّن هذا إلى `"google"` لاستخدام Gemini Live مع إبقاء النسخ في وضع
  الوكيل على OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة موجزة، مع `openclaw_agent_consult`
  للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية منطوق قصير عند اتصال الجسر الفوري؛ عيّنه
  إلى `""` للانضمام بصمت
- `realtime.agentId`: معرف وكيل OpenClaw اختياري من أجل
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
        speakerVoice: "Kore",
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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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

يأتي صوت Meet الدائم من
`messages.tts.providers.elevenlabs.speakerVoiceId`. يمكن لردود الوكيل أيضا
استخدام توجيهات `[[tts:speakerVoiceId=... model=eleven_v3]]` لكل رد عند تفعيل
تجاوزات نموذج TTS، لكن الإعداد هو الافتراضي الحتمي للاجتماعات. عند الانضمام،
يجب أن تعرض السجلات `transcriptionProvider=elevenlabs`، ويجب أن يسجل كل رد
منطوق `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

إعداد Twilio فقط:

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

القيمة الافتراضية لـ `voiceCall.enabled` هي `true`؛ ومع نقل Twilio يفوض
مكالمة PSTN الفعلية وDTMF وتحية المقدمة إلى Voice Call plugin. يشغل Voice Call
تسلسل DTMF قبل فتح دفق الوسائط الفوري، ثم يستخدم نص المقدمة المحفوظ كتحية
فورية أولية. إذا لم يكن `voice-call` مفعلا، فلا يزال بإمكان Google Meet
التحقق من خطة الاتصال وتسجيلها، لكنه لا يستطيع إجراء مكالمة Twilio.

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
`transport: "chrome-node"` عندما يعمل Chrome على عقدة مقترنة مثل Parallels VM.
في الحالتين، تعمل مزودات النماذج و`openclaw_agent_consult` على مضيف Gateway،
لذلك تبقى بيانات اعتماد النماذج هناك. مع القيمة الافتراضية `mode: "agent"`،
يتولى مزود النسخ الفوري الاستماع، وينتج وكيل OpenClaw المهيأ الإجابة، ثم
ينطقها TTS العادي في OpenClaw داخل Meet. استخدم `mode: "bidi"` عندما تريد أن
يجيب نموذج الصوت الفوري مباشرة. يبقى `mode: "realtime"` الخام مقبولا كاسم
مستعار قديم للتوافق مع `mode: "agent"`، لكنه لم يعد معروضا في مخطط أداة
الوكيل. تتضمن سجلات وضع الوكيل مزود/نموذج النسخ المحلول عند بدء الجسر، ومزود
TTS والنموذج والصوت وتنسيق الإخراج ومعدل العينة بعد كل رد مولد.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرف جلسة. استخدم
`action: "speak"` مع `sessionId` و`message` لجعل الوكيل الفوري يتكلم فورا.
استخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها، وتشغيل عبارة
معروفة، وإرجاع صحة `inCall` عندما يستطيع مضيف Chrome الإبلاغ عنها. يفرض
`test_speech` دائما `mode: "agent"` ويفشل إذا طُلب منه العمل في
`mode: "transcribe"` لأن جلسات المراقبة فقط لا يمكنها عمدا إصدار الكلام.
تستند نتيجة `speechOutputVerified` إلى زيادة بايتات إخراج الصوت الفوري أثناء
استدعاء الاختبار هذا، لذلك لا تُحتسب جلسة معاد استخدامها ولديها صوت أقدم
كفحص كلام ناجح جديد. استخدم `action: "leave"` لوضع علامة على انتهاء الجلسة.

يتضمن `status` صحة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج
  ملف المتصفح الشخصي إلى تسجيل دخول يدوي، أو قبول مضيف Meet، أو أذونات، أو
  إصلاح تحكم المتصفح قبل أن يعمل الكلام
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ما إذا كان
  كلام Chrome المدار مسموحا الآن. تعني `speechReady: false` أن OpenClaw لم
  يرسل عبارة المقدمة/الاختبار إلى جسر الصوت.
- `providerConnected` / `realtimeReady`: حالة جسر الصوت الفوري
- `lastInputAt` / `lastOutputAt`: آخر صوت شوهد من الجسر أو أُرسل إليه
- `audioOutputRouted` / `audioOutputDeviceLabel`: ما إذا كان إخراج وسائط تبويب
  Meet موجها بنشاط إلى جهاز BlackHole الذي يستخدمه الجسر
- `lastSuppressedInputAt` / `suppressedInputBytes`: إدخال local loopback تم
  تجاهله أثناء نشاط تشغيل المساعد

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## أوضاع الوكيل وbidi

تم تحسين وضع Chrome `agent` لسلوك "وكيلي في الاجتماع". يسمع مزود النسخ الفوري
صوت الاجتماع، وتُوجه النصوص النهائية للمشاركين عبر وكيل OpenClaw المهيأ، وتُنطق
الإجابة عبر وقت تشغيل TTS العادي في OpenClaw. عيّن `mode: "bidi"` عندما تريد
أن يجيب نموذج الصوت الفوري مباشرة.
تُدمج أجزاء النص النهائي القريبة قبل الاستشارة حتى لا ينتج دور منطوق واحد عدة
إجابات جزئية قديمة. كما يُمنع الإدخال الفوري أثناء استمرار تشغيل صوت المساعد
الموجود في قائمة الانتظار،
وتُتجاهل أصداء النصوص الحديثة الشبيهة بالمساعد قبل استشارة الوكيل حتى لا يجعل
local loopback في BlackHole الوكيل يجيب عن كلامه هو.

| الوضع    | من يقرر الإجابة        | مسار إخراج الكلام                     | استخدمه عندما                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | وكيل OpenClaw المهيأ | وقت تشغيل TTS العادي في OpenClaw            | تريد سلوك "وكيلي في الاجتماع"        |
| `bidi`  | نموذج الصوت الفوري      | استجابة صوتية من مزود الصوت الفوري | تريد حلقة صوت محادثية بأقل كمون |

في وضع `bidi`، عندما يحتاج النموذج الفوري إلى استدلال أعمق أو معلومات حالية أو
أدوات OpenClaw العادية، يمكنه استدعاء `openclaw_agent_consult`.

تعمل أداة الاستشارة على تشغيل وكيل OpenClaw العادي في الخلفية مع سياق
نص محضر الاجتماع الأخير وتعيد إجابة منطوقة موجزة. في وضع `agent`،
يرسل OpenClaw تلك الإجابة مباشرة إلى وقت تشغيل TTS؛ وفي وضع `bidi`، يستطيع
نموذج الصوت الفوري نطق نتيجة الاستشارة مرة أخرى داخل الاجتماع. وهي تستخدم
آلية الاستشارة المشتركة نفسها مثل Voice Call.

افتراضيًا، تعمل الاستشارات ضد الوكيل `main`. عيّن `realtime.agentId` عندما
ينبغي أن يستشير مسار Meet مساحة عمل وكيل OpenClaw مخصصة، وافتراضات النموذج،
وسياسة الأدوات، والذاكرة، وسجل الجلسة.

تستخدم استشارات وضع الوكيل مفتاح جلسة لكل اجتماع
`agent:<id>:subagent:google-meet:<session>` بحيث تحتفظ أسئلة المتابعة بسياق
الاجتماع مع وراثة سياسة الوكيل العادية من الوكيل المكوّن.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: يكشف أداة الاستشارة ويقيّد الوكيل العادي على
  `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و
  `memory_get`.
- `owner`: يكشف أداة الاستشارة ويتيح للوكيل العادي استخدام سياسة أدوات
  الوكيل العادية.
- `none`: لا يكشف أداة الاستشارة لنموذج الصوت الفوري.

مفتاح جلسة الاستشارة مضبوط النطاق لكل جلسة Meet، لذلك يمكن لاستدعاءات
الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد انضمام Chrome إلى المكالمة بالكامل:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

لفحص الانضمام والنطق الكامل:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## قائمة فحص الاختبار المباشر

استخدم هذا التسلسل قبل تسليم اجتماع إلى وكيل غير مراقب:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

حالة Chrome-node المتوقعة:

- `googlemeet setup` كلها خضراء.
- يتضمن `googlemeet setup` الفحص `chrome-node-connected` عندما يكون Chrome-node
  هو النقل الافتراضي أو عندما تكون عقدة مثبتة.
- يعرض `nodes status` أن العقدة المحددة متصلة.
- تعلن العقدة المحددة عن كل من `googlemeet.chrome` و`browser.proxy`.
- تنضم علامة تبويب Meet إلى المكالمة ويعيد `test-speech` صحة Chrome مع
  `inCall: true`.

بالنسبة إلى مضيف Chrome بعيد مثل آلة macOS افتراضية على Parallels، فهذا هو
أقصر فحص آمن بعد تحديث Gateway أو الآلة الافتراضية:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن Plugin Gateway محمّل، وأن عقدة الآلة الافتراضية متصلة بالرمز
الحالي، وأن جسر صوت Meet متاح قبل أن يفتح وكيل علامة تبويب اجتماع حقيقية.

لفحص Twilio، استخدم اجتماعًا يعرض تفاصيل الاتصال الهاتفي:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

حالة Twilio المتوقعة:

- يتضمن `googlemeet setup` فحوصات خضراء لـ `twilio-voice-call-plugin` و
  `twilio-voice-call-credentials` و`twilio-voice-call-webhook`.
- يكون `voicecall` متاحًا في CLI بعد إعادة تحميل Gateway.
- تحتوي الجلسة المعادة على `transport: "twilio"` و`twilio.voiceCallId`.
- يعرض `openclaw logs --follow` تقديم DTMF TwiML قبل TwiML الفوري، ثم
  جسرًا فوريًا مع تحية أولية في الصف.
- ينهي `googlemeet leave <sessionId>` مكالمة الصوت المفوضة.

## استكشاف الأخطاء وإصلاحها

### لا يستطيع الوكيل رؤية أداة Google Meet

تأكد من تمكين Plugin في إعدادات Gateway وأعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد عدّلت للتو `plugins.entries.google-meet`، فأعد تشغيل Gateway أو
أعد تحميله. لا يرى الوكيل الجاري إلا أدوات Plugin المسجلة بواسطة عملية
Gateway الحالية.

على مضيفات Gateway غير macOS، تظل أداة `google_meet` المواجهة للوكيل مرئية،
لكن إجراءات ردّ الكلام عبر Chrome المحلي تُحظر قبل وصولها إلى جسر الصوت.
يعتمد صوت ردّ الكلام عبر Chrome المحلي حاليًا على `BlackHole 2ch` في macOS،
لذلك ينبغي لوكلاء Linux استخدام `mode: "transcribe"`، أو اتصال Twilio الهاتفي،
أو مضيف `chrome-node` على macOS بدلًا من مسار وكيل Chrome المحلي الافتراضي.

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

يجب أن تكون العقدة متصلة وأن تعرض `googlemeet.chrome` بالإضافة إلى
`browser.proxy`. يجب أن تسمح إعدادات Gateway بأوامر العقدة هذه:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

إذا فشل `googlemeet setup` في `chrome-node-connected` أو أبلغ سجل Gateway عن
`gateway token mismatch`، فأعد تثبيت العقدة أو أعد تشغيلها باستخدام رمز
Gateway الحالي. بالنسبة إلى Gateway على LAN، يعني ذلك عادةً:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

ثم أعد تحميل خدمة العقدة وأعد تشغيل:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### يفتح المتصفح لكن الوكيل لا يستطيع الانضمام

شغّل `googlemeet test-listen` للانضمامات بغرض المراقبة فقط أو
`googlemeet test-speech` للانضمامات الفورية، ثم افحص صحة Chrome المعادة. إذا
أبلغ أي من الفحصين عن `manualActionRequired: true`، فأظهر
`manualActionMessage` للمشغّل وتوقف عن إعادة المحاولة حتى يكتمل إجراء
المتصفح.

إجراءات يدوية شائعة:

- تسجيل الدخول إلى ملف تعريف Chrome.
- قبول الضيف من حساب مضيف Meet.
- منح أذونات الميكروفون/الكاميرا لـ Chrome عندما تظهر مطالبة الإذن الأصلية
  في Chrome.
- إغلاق مربع حوار إذن Meet عالق أو إصلاحه.

لا تُبلغ عن "not signed in" لمجرد أن Meet يعرض "Do you want people to
hear you in the meeting?" فهذه شاشة اختيار الصوت في Meet؛ ينقر OpenClaw على
**Use microphone** عبر أتمتة المتصفح عندما يكون ذلك متاحًا ويواصل انتظار
حالة الاجتماع الحقيقية. بالنسبة إلى احتياطي المتصفح الخاص بالإنشاء فقط، قد
ينقر OpenClaw على **Continue without microphone** لأن إنشاء URL لا يحتاج إلى
مسار الصوت الفوري.

### يفشل إنشاء الاجتماع

يستخدم `googlemeet create` أولًا نقطة نهاية Google Meet API `spaces.create`
عندما تكون بيانات اعتماد OAuth مكوّنة. وبدون بيانات اعتماد OAuth، يعود إلى
متصفح عقدة Chrome المثبتة. تأكد مما يلي:

- لإنشاء API: تم تكوين `oauth.clientId` و`oauth.refreshToken`، أو توجد
  متغيرات بيئة `OPENCLAW_GOOGLE_MEET_*` مطابقة.
- لإنشاء API: تم إصدار رمز التحديث بعد إضافة دعم الإنشاء. قد تفتقر الرموز
  الأقدم إلى نطاق `meetings.space.created`؛ أعد تشغيل
  `openclaw googlemeet auth login --json` وحدّث إعدادات Plugin.
- لاحتياطي المتصفح: يشير `defaultTransport: "chrome-node"` و
  `chromeNode.node` إلى عقدة متصلة تحتوي على `browser.proxy` و
  `googlemeet.chrome`.
- لاحتياطي المتصفح: يكون ملف تعريف Chrome الخاص بـ OpenClaw على تلك العقدة
  مسجل الدخول إلى Google وقادرًا على فتح `https://meet.google.com/new`.
- لاحتياطي المتصفح: تعيد المحاولات استخدام علامة تبويب
  `https://meet.google.com/new` أو مطالبة حساب Google موجودة قبل فتح علامة
  تبويب جديدة. إذا انتهت مهلة وكيل، فأعد محاولة استدعاء الأداة بدلًا من فتح
  علامة تبويب Meet أخرى يدويًا.
- لاحتياطي المتصفح: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم
  `browser.nodeId` و`browser.targetId` و`browserUrl` و
  `manualActionMessage` المعادة لإرشاد المشغّل. لا تعد المحاولة في حلقة حتى
  يكتمل ذلك الإجراء.
- لاحتياطي المتصفح: إذا عرض Meet "Do you want people to hear you in the
  meeting?"، فاترك علامة التبويب مفتوحة. ينبغي أن ينقر OpenClaw على
  **Use microphone** أو، للاحتياطي الخاص بالإنشاء فقط، على
  **Continue without microphone** عبر أتمتة المتصفح وأن يواصل انتظار URL
  Meet المُنشأ. إذا تعذّر عليه ذلك، ينبغي أن يذكر الخطأ
  `meet-audio-choice-required`، لا `google-login-required`.

### ينضم الوكيل لكنه لا يتكلم

تحقق من المسار الفوري:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "agent"` لمسار STT -> وكيل OpenClaw -> ردّ الكلام عبر TTS
العادي، أو `mode: "bidi"` للاحتياطي الصوتي الفوري المباشر. لا يبدأ
`mode: "transcribe"` جسر ردّ الكلام عمدًا. لتصحيح أخطاء المراقبة فقط، شغّل
`openclaw googlemeet status --json <session-id>` بعد أن يتحدث المشاركون وتحقق
من `captioning` و`transcriptLines` و`lastCaptionText`. إذا كان `inCall` هو
true لكن `transcriptLines` يبقى عند `0`، فقد تكون التسميات التوضيحية في Meet
معطلة، أو لم يتحدث أحد منذ تثبيت المراقب، أو تغيّرت واجهة Meet، أو أن
التسميات التوضيحية المباشرة غير متاحة للغة/حساب الاجتماع.

يتحقق `googlemeet test-speech` دائمًا من المسار الفوري ويبلغ عما إذا كانت
بايتات خرج الجسر قد رُصدت لهذا الاستدعاء. إذا كان `speechOutputVerified` هو false وكان
`speechOutputTimedOut` هو true، فقد يكون مزود الخدمة الفوري قد قبل
العبارة لكن OpenClaw لم يرَ بايتات خرج جديدة تصل إلى جسر صوت Chrome.

تحقق أيضًا مما يلي:

- يتوفر مفتاح مزود خدمة فوري على مضيف Gateway، مثل `OPENAI_API_KEY` أو
  `GEMINI_API_KEY`.
- يظهر `BlackHole 2ch` على مضيف Chrome.
- يوجد `sox` على مضيف Chrome.
- يتم توجيه ميكروفون Meet ومكبر الصوت عبر مسار الصوت الافتراضي الذي يستخدمه
  OpenClaw. ينبغي أن يعرض `doctor` القيمة `meet output routed: yes` لانضمامات
  Chrome المحلية الفورية.

يطبع `googlemeet doctor [session-id]` الجلسة، والعقدة، وحالة داخل المكالمة،
وسبب الإجراء اليدوي، واتصال مزود الخدمة الفوري، و`realtimeReady`، ونشاط
إدخال/إخراج الصوت، والطوابع الزمنية الصوتية الأخيرة، وعدادات البايت، وURL
المتصفح. استخدم `googlemeet status [session-id] --json` عندما تحتاج إلى JSON
الخام. استخدم `googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث
OAuth لـ Google Meet من دون كشف الرموز؛ أضف `--meeting` أو `--create-space`
عندما تحتاج أيضًا إلى إثبات Google Meet API.

إذا انتهت مهلة وكيل ويمكنك رؤية علامة تبويب Meet مفتوحة بالفعل، فافحص تلك
العلامة من دون فتح علامة أخرى:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. يركّز على علامة تبويب Meet
موجودة ويفحصها للنقل المحدد. مع `chrome`، يستخدم تحكم المتصفح المحلي عبر
Gateway؛ ومع `chrome-node`، يستخدم عقدة Chrome المكوّنة. لا يفتح علامة تبويب
جديدة ولا ينشئ جلسة جديدة؛ بل يبلّغ عن العائق الحالي، مثل تسجيل الدخول، أو
القبول، أو الأذونات، أو حالة اختيار الصوت. يتحدث أمر CLI إلى Gateway
المكوّن، لذلك يجب أن يكون Gateway قيد التشغيل؛ كما يتطلب `chrome-node` اتصال
عقدة Chrome.

### تفشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا به أو غير
مفعّل. أضفه إلى `plugins.allow`، وفعّل `plugins.entries.voice-call`، وأعد
تحميل Gateway.

يفشل `twilio-voice-call-credentials` عندما يفتقر طرف Twilio الخلفي إلى
معرّف SID للحساب، أو رمز المصادقة، أو رقم المتصل. عيّن هذه على مضيف
Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

يفشل `twilio-voice-call-webhook` عندما لا يمتلك `voice-call` تعرض Webhook
عامًا، أو عندما يشير `publicUrl` إلى loopback أو مساحة شبكة خاصة.
عيّن `plugins.entries.voice-call.config.publicUrl` إلى URL المزود العام أو
كوّن نفق `voice-call`/تعرض Tailscale.

عناوين URL الخاصة بـ loopback والعناوين الخاصة غير صالحة لاستدعاءات شركات
الاتصال. لا تستخدم `localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو
`172.16.x`-`172.31.x` أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو
`fd00::/8` كقيمة `publicUrl`.

للحصول على URL عام مستقر:

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

للتطوير المحلي، استخدم نفقًا أو إتاحة عبر Tailscale بدلًا من عنوان URL لمضيف خاص:

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

يكون `voicecall smoke` مخصصًا للتحقق من الجاهزية فقط افتراضيًا. لإجراء تشغيل تجريبي لرقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

أضف `--yes` فقط عندما تريد عمدًا إجراء مكالمة إشعار صادرة مباشرة:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### يبدأ اتصال Twilio لكنه لا يدخل الاجتماع أبدًا

تأكد من أن حدث Meet يعرض تفاصيل الاتصال الهاتفي. مرر رقم الاتصال الهاتفي ورمز PIN بالضبط أو تسلسل DTMF مخصصًا:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم `w` بادئة أو فواصل في `--dtmf-sequence` إذا كان المزود يحتاج إلى توقف مؤقت قبل إدخال رمز PIN.

إذا أُنشئت المكالمة الهاتفية لكن قائمة Meet لا تعرض أبدًا مشارك الاتصال الهاتفي:

- شغّل `openclaw googlemeet doctor <session-id>` لتأكيد معرف مكالمة Twilio المفوضة، وما إذا كان DTMF قد وُضع في الطابور، وما إذا طُلبت تحية المقدمة.
- شغّل `openclaw voicecall status --call-id <id>` وتأكد من أن المكالمة لا تزال نشطة.
- شغّل `openclaw voicecall tail` وتحقق من وصول Twilio webhooks إلى Gateway.
- شغّل `openclaw logs --follow` وابحث عن تسلسل Twilio Meet: يفوض Google Meet الانضمام، ويخزن Voice Call ويقدم TwiML الخاص بـ DTMF قبل الاتصال، ويقدم Voice Call TwiML الفوري لمكالمة Twilio، ثم يطلب Google Meet كلام المقدمة عبر `voicecall.speak`.
- أعد تشغيل `openclaw googlemeet setup --transport twilio`؛ يلزم نجاح فحص الإعداد، لكنه لا يثبت أن تسلسل رمز PIN للاجتماع صحيح.
- تأكد من أن رقم الاتصال الهاتفي ينتمي إلى دعوة Meet والمنطقة نفسهما مثل رمز PIN.
- زِد `voiceCall.dtmfDelayMs` عن القيمة الافتراضية البالغة 12 ثانية إذا كان Meet يجيب ببطء أو كان نص المكالمة لا يزال يعرض المطالبة بإدخال رمز PIN بعد إرسال DTMF قبل الاتصال.
- إذا انضم المشارك لكنك لا تسمع التحية، فتحقق من `openclaw logs --follow` لطلب `voicecall.speak` بعد DTMF ومن تشغيل TTS عبر دفق الوسائط أو آلية Twilio `<Say>` الاحتياطية. إذا كان نص المكالمة لا يزال يحتوي على "enter the meeting PIN"، فإن ساق الهاتف لم تنضم بعد إلى غرفة Meet، لذلك لن يسمع مشاركو الاجتماع الكلام.

إذا لم تصل webhooks، فصحح Plugin Voice Call أولًا: يجب أن يصل المزود إلى `plugins.entries.voice-call.config.publicUrl` أو النفق المكوّن. راجع [استكشاف أخطاء المكالمات الصوتية وإصلاحها](/ar/plugins/voice-call#troubleshooting).

## ملاحظات

واجهة API الرسمية للوسائط في Google Meet موجهة للاستقبال، لذلك لا يزال التحدث داخل مكالمة Meet يحتاج إلى مسار مشارك. يُبقي هذا Plugin ذلك الحد واضحًا: يتولى Chrome مشاركة المتصفح وتوجيه الصوت المحلي؛ وتتولى Twilio مشاركة الاتصال الهاتفي.

تحتاج أوضاع الرد الصوتي في Chrome إلى `BlackHole 2ch` بالإضافة إلى أحد الخيارين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يملك OpenClaw الجسر ويمرر الصوت بصيغة `chrome.audioFormat` بين تلك الأوامر والمزود المحدد. يستخدم وضع الوكيل النسخ الفوري مع TTS عادي؛ ويستخدم وضع bidi مزود الصوت الفوري. مسار Chrome الافتراضي هو PCM16 بتردد 24 كيلوهرتز مع `chrome.audioBufferBytes: 4096`؛ ويظل G.711 mu-law بتردد 8 كيلوهرتز متاحًا لأزواج الأوامر القديمة.
- `chrome.audioBridgeCommand`: يملك أمر جسر خارجي مسار الصوت المحلي بالكامل ويجب أن يخرج بعد بدء تشغيل برنامجه الخفي أو التحقق منه. هذا صالح فقط لـ `bidi` لأن وضع `agent` يحتاج إلى وصول مباشر إلى زوج الأوامر من أجل TTS.

عندما يستدعي وكيل أداة `google_meet` في وضع الوكيل، تُفرّع جلسة مستشار الاجتماع نص المتصل الحالي قبل الرد على كلام المشاركين. تظل جلسة Meet منفصلة (`agent:<agentId>:subagent:google-meet:<sessionId>`) كي لا تعدّل متابعات الاجتماع نص المتصل مباشرة.

للحصول على صوت ثنائي الاتجاه نظيف، وجّه إخراج Meet وميكروفون Meet عبر أجهزة افتراضية منفصلة أو مخطط جهاز افتراضي بنمط Loopback. يمكن لجهاز BlackHole واحد مشترك أن يعيد صدى المشاركين الآخرين إلى المكالمة.

مع جسر Chrome ذي زوج الأوامر، يمكن لـ `chrome.bargeInInputCommand` الاستماع إلى ميكروفون محلي منفصل ومسح تشغيل المساعد عندما يبدأ الإنسان بالكلام. يحافظ ذلك على أسبقية كلام الإنسان على إخراج المساعد حتى عندما يكون إدخال BlackHole loopback المشترك مكبوتًا مؤقتًا أثناء تشغيل المساعد. ومثل `chrome.audioInputCommand` و`chrome.audioOutputCommand`، فهو أمر محلي يكوّنه المشغل. استخدم مسار أمر موثوقًا وصريحًا أو قائمة وسائط، ولا توجهه إلى سكربتات من مواقع غير موثوقة.

يفعّل `googlemeet speak` جسر صوت الرد النشط لجلسة Chrome. يوقف `googlemeet leave` ذلك الجسر. بالنسبة إلى جلسات Twilio المفوضة عبر Plugin Voice Call، يؤدي `leave` أيضًا إلى إنهاء المكالمة الصوتية الأساسية. استخدم `googlemeet end-active-conference` عندما تريد أيضًا إغلاق مؤتمر Google Meet النشط لمساحة تديرها API.

## ذات صلة

- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
