---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - تريد أن ينشئ وكيل OpenClaw مكالمة Google Meet جديدة
    - أنت تُهيّئ Chrome أو عقدة Chrome أو Twilio كناقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL صريحة لـ Meet عبر Chrome أو Twilio مع إعدادات الردّ الافتراضية للوكيل'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-06T09:02:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c1de7528ddabe6411598eea362d4a21c6f95f374700046c18294b215a1333d3
    source_path: plugins/google-meet.md
    workflow: 16
---

دعم مشاركي Google Meet لـ OpenClaw — يكون Plugin صريحًا حسب التصميم:

- لا ينضم إلا إلى عنوان URL صريح بالشكل `https://meet.google.com/...`.
- يمكنه إنشاء مساحة Meet جديدة عبر Google Meet API، ثم الانضمام إلى عنوان URL
  المُعاد.
- `agent` هو وضع الرد الصوتي الافتراضي: يستمع النسخ الفوري، ويرد وكيل
  OpenClaw المُكوَّن، ويتحدث OpenClaw TTS العادي داخل Meet.
- يظل `bidi` متاحًا كوضع احتياطي مباشر لنموذج الصوت الفوري.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `agent` للاستماع/الرد
  الصوتي المباشر، أو `bidi` للاحتياطي الصوتي الفوري المباشر، أو `transcribe`
  للانضمام/التحكم في المتصفح دون جسر الرد الصوتي.
- يبدأ المصادقة عبر Google OAuth شخصي أو ملف Chrome شخصي مسجل الدخول مسبقًا.
- لا يوجد إعلان موافقة تلقائي.
- واجهة الصوت الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف node مقترن.
- يقبل Twilio رقم اتصال هاتفيًا مع رقم PIN اختياري أو تسلسل DTMF؛ ولا يمكنه
  طلب عنوان URL لـ Meet مباشرة.
- أمر CLI هو `googlemeet`؛ و`meet` محجوز لتدفقات مؤتمرات الوكلاء الهاتفية
  الأوسع.

## البدء السريع

ثبّت اعتماديات الصوت المحلية وهيّئ موفر نسخ فوريًا بالإضافة إلى OpenClaw TTS
العادي. OpenAI هو موفر النسخ الافتراضي؛ ويعمل Google Gemini Live أيضًا
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

صُمم خرج الإعداد ليكون قابلاً للقراءة من قبل الوكيل ومدركًا للوضع. يبلّغ عن
ملف Chrome الشخصي، وتثبيت node، وبالنسبة لانضمامات Chrome الفورية، عن جسر صوت
BlackHole/SoX وفحوصات مقدمة الوقت الفعلي المؤجلة. للانضمامات المخصصة
للمراقبة فقط، تحقق من النقل نفسه باستخدام `--mode transcribe`؛ يتجاوز ذلك
الوضع متطلبات الصوت الفوري لأنه لا يستمع عبر الجسر ولا يتحدث عبره:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

عند تكوين تفويض Twilio، يبلّغ الإعداد أيضًا عمّا إذا كان Plugin
`voice-call`، وبيانات اعتماد Twilio، وإتاحة Webhook العامة جاهزة. تعامل مع أي
فحص `ok: false` كمانع للنقل والوضع المفحوصين قبل طلب الانضمام من الوكيل.
استخدم `openclaw googlemeet setup --json` للسكربتات أو للخرج القابل للقراءة
آليًا. استخدم `--transport chrome` أو `--transport chrome-node` أو
`--transport twilio` لفحص نقل محدد مسبقًا قبل أن يجربه الوكيل.

بالنسبة إلى Twilio، افحص النقل مسبقًا بشكل صريح دائمًا عندما يكون النقل
الافتراضي هو Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

يلتقط ذلك غياب ربط `voice-call` أو بيانات اعتماد Twilio أو تعذر الوصول إلى
إتاحة Webhook قبل أن يحاول الوكيل طلب الاجتماع.

انضم إلى اجتماع:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو دع وكيلاً ينضم عبر أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

تظل أداة `google_meet` الموجهة للوكلاء متاحة على مضيفات غير macOS لتدفقات
الأثر، والتقويم، والإعداد، والنسخ، وTwilio، و`chrome-node`. تُحظر إجراءات
الرد الصوتي عبر Chrome المحلي هناك لأن مسار صوت Chrome المضمن يعتمد حاليًا
على `BlackHole 2ch` في macOS. على Linux، استخدم `mode: "transcribe"`، أو
الاتصال الهاتفي عبر Twilio، أو مضيف `chrome-node` على macOS للمشاركة برد صوتي
عبر Chrome.

أنشئ اجتماعًا جديدًا وانضم إليه:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

للغرف المنشأة عبر API، استخدم Google Meet `SpaceConfig.accessType` عندما تريد
أن تكون سياسة عدم الطرق الخاصة بالغرفة صريحة بدلاً من وراثتها من افتراضيات
حساب Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

يسمح `OPEN` لأي شخص لديه عنوان URL لـ Meet بالانضمام دون طرق. يسمح `TRUSTED`
للمستخدمين الموثوقين في مؤسسة المضيف، والمستخدمين الخارجيين المدعوين،
ومستخدمي الاتصال الهاتفي بالانضمام دون طرق. يقيّد `RESTRICTED` الدخول دون
طرق بالمدعوين فقط. تنطبق هذه الإعدادات فقط على مسار الإنشاء الرسمي عبر
Google Meet API، لذلك يجب تكوين بيانات اعتماد OAuth.

إذا صادقت Google Meet قبل توفر هذا الخيار، فأعد تشغيل
`openclaw googlemeet auth login --json` بعد إضافة نطاق
`meetings.space.settings` إلى شاشة موافقة Google OAuth لديك.

أنشئ عنوان URL فقط دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

لدى `googlemeet create` مساران:

- إنشاء API: يُستخدم عند تكوين بيانات اعتماد Google Meet OAuth. هذا هو المسار
  الأكثر حتمية ولا يعتمد على حالة واجهة المتصفح.
- احتياطي المتصفح: يُستخدم عند غياب بيانات اعتماد OAuth. يستخدم OpenClaw
  node Chrome المثبت، ويفتح `https://meet.google.com/new`، وينتظر Google حتى
  تعيد التوجيه إلى عنوان URL حقيقي برمز اجتماع، ثم يعيد ذلك العنوان. يتطلب
  هذا المسار أن يكون ملف Chrome الشخصي الخاص بـ OpenClaw على node مسجل الدخول
  مسبقًا إلى Google.
  تتعامل أتمتة المتصفح مع مطالبة الميكروفون الخاصة بالتشغيل الأول في Meet؛
  ولا تُعامل تلك المطالبة كفشل تسجيل دخول إلى Google.
  تحاول تدفقات الانضمام والإنشاء أيضًا إعادة استخدام تبويب Meet موجود قبل فتح
  تبويب جديد. يتجاهل التطابق سلاسل استعلام URL غير الضارة مثل `authuser`، لذا
  يجب أن تركز إعادة محاولة الوكيل على الاجتماع المفتوح مسبقًا بدلاً من إنشاء
  تبويب Chrome ثانٍ.

يتضمن خرج الأمر/الأداة حقلاً باسم `source` (`api` أو `browser`) حتى تتمكن
الوكلاء من شرح المسار الذي استُخدم. ينضم `create` إلى الاجتماع الجديد
افتراضيًا ويعيد `joined: true` بالإضافة إلى جلسة الانضمام. لإنشاء عنوان URL
فقط، استخدم `create --no-join` في CLI أو مرر `"join": false` إلى الأداة.

أو أخبر وكيلاً: "أنشئ Google Meet، وانضم إليه بوضع الرد الصوتي للوكيل، وأرسل
لي الرابط." يجب أن يستدعي الوكيل `google_meet` مع `action: "create"` ثم يشارك
`meetingUri` المُعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

لانضمام مخصص للمراقبة فقط/التحكم في المتصفح، عيّن `"mode": "transcribe"`.
لا يبدأ ذلك جسر الصوت الفوري المزدوج، ولا يتطلب BlackHole أو SoX، ولن يرد
صوتيًا داخل الاجتماع. تتجنب انضمامات Chrome في هذا الوضع أيضًا منح إذن
الميكروفون/الكاميرا في OpenClaw وتتجنب مسار Meet **استخدام الميكروفون**. إذا
عرض Meet شاشة اختيار صوت، تحاول الأتمتة مسار عدم استخدام الميكروفون، وإلا
تبلّغ عن إجراء يدوي بدلاً من فتح الميكروفون المحلي. في وضع النسخ، تثبّت
نقولات Chrome المُدارة أيضًا مراقب تسميات توضيحية لـ Meet بأفضل جهد. يعرض
`googlemeet status --json` و`googlemeet doctor` الحقول `captioning`،
و`captionsEnabledAttempted`، و`transcriptLines`، و`lastCaptionAt`،
و`lastCaptionSpeaker`، و`lastCaptionText`، وذيل `recentTranscript` قصيرًا حتى
يتمكن المشغّلون من معرفة ما إذا كان المتصفح قد انضم إلى المكالمة وما إذا كانت
تسميات Meet التوضيحية تنتج نصًا.
استخدم `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
عندما تحتاج إلى فحص بنعم/لا: ينضم في وضع النسخ، وينتظر تسمية توضيحية حديثة
أو حركة في النص المنسوخ، ويعيد `listenVerified` و`listenTimedOut` وحقول
الإجراء اليدوي وأحدث حالة لصحة التسميات التوضيحية.

أثناء الجلسات الفورية، تتضمن حالة `google_meet` صحة المتصفح وجسر الصوت مثل
`inCall`، و`manualActionRequired`، و`providerConnected`، و`realtimeReady`،
و`audioInputActive`، و`audioOutputActive`، وطوابع وقت آخر إدخال/إخراج، وعدادات
البايت، وحالة إغلاق الجسر. إذا ظهرت مطالبة صفحة Meet آمنة، تتعامل معها أتمتة
المتصفح عندما تستطيع. تُبلّغ مطالبات تسجيل الدخول، وقبول المضيف، وأذونات
المتصفح/نظام التشغيل كإجراء يدوي مع سبب ورسالة ليرسلها الوكيل. لا تُصدر
جلسات Chrome المُدارة المقدمة أو عبارة الاختبار إلا بعد أن تبلّغ صحة المتصفح
عن `inCall: true`؛ وإلا تبلّغ الحالة `speechReady: false` وتُحظر محاولة
الكلام بدلاً من الادعاء بأن الوكيل تحدث داخل الاجتماع.

تنضم عمليات Chrome المحلية عبر ملف متصفح OpenClaw الشخصي المسجل الدخول. يتطلب
الوضع الفوري `BlackHole 2ch` لمسار الميكروفون/السماعة الذي يستخدمه OpenClaw.
لصوت مزدوج نظيف، استخدم أجهزة افتراضية منفصلة أو رسمًا بيانيًا بأسلوب
Loopback؛ يكفي جهاز BlackHole واحد لاختبار دخان أولي لكنه قد يسبب صدى.

### Gateway المحلي + Parallels Chrome

لا تحتاج إلى OpenClaw Gateway كامل أو مفتاح API للنموذج داخل جهاز macOS
افتراضي لمجرد جعل الجهاز الافتراضي يمتلك Chrome. شغّل Gateway والوكيل محليًا،
ثم شغّل مضيف node في الجهاز الافتراضي. فعّل Plugin المضمن في الجهاز الافتراضي
مرة واحدة حتى يعلن node عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API،
  وموفر الوقت الفعلي، وتكوين Google Meet Plugin.
- جهاز macOS افتراضي عبر Parallels: OpenClaw CLI/مضيف node، وGoogle Chrome،
  وSoX، وBlackHole 2ch، وملف Chrome شخصي مسجل الدخول إلى Google.
- غير مطلوب في الجهاز الافتراضي: خدمة Gateway، أو تكوين الوكيل، أو مفتاح
  OpenAI/GPT، أو إعداد موفر النموذج.

ثبّت اعتماديات الجهاز الافتراضي:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل الجهاز الافتراضي بعد تثبيت BlackHole حتى يعرض macOS `BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقق من أن الجهاز الافتراضي يمكنه رؤية جهاز الصوت وأوامر
SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ثبّت OpenClaw أو حدّثه في الجهاز الافتراضي، ثم فعّل Plugin المضمن هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ مضيف node في الجهاز الافتراضي:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على LAN وكنت لا تستخدم TLS، فسيرفض node
WebSocket بالنص الصريح ما لم تقبل ذلك صراحة لتلك الشبكة الخاصة الموثوقة:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

استخدم متغير البيئة نفسه عند تثبيت node كـ LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو بيئة عملية، وليس إعدادًا في
`openclaw.json`. يخزّنه `openclaw node install` في بيئة LaunchAgent عندما يكون
موجودًا في أمر التثبيت.

وافق على node من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

أكد أن Gateway يرى node وأنه يعلن كلاً من `googlemeet.chrome` وإمكانات
المتصفح/`browser.proxy`:

```bash
openclaw nodes status
```

وجّه Meet عبر ذلك node على مضيف Gateway:

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

الآن انضم كالمعتاد من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اطلب من الوكيل استخدام أداة `google_meet` مع `transport: "chrome-node"`.

لاختبار دخان بأمر واحد ينشئ جلسة أو يعيد استخدامها، وينطق عبارة معروفة، ويطبع
صحة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام في الوقت الفعلي، تملأ أتمتة المتصفح في OpenClaw اسم الضيف، وتنقر
Join/Ask to join، وتقبل خيار "Use microphone" للتشغيل الأول في Meet عندما
تظهر تلك المطالبة. أثناء الانضمام بوضع المراقبة فقط أو إنشاء اجتماع من المتصفح فقط، فإنها
تتجاوز المطالبة نفسها بدون ميكروفون عندما يكون ذلك الخيار متاحًا.
إذا لم يكن ملف تعريف المتصفح مسجّل الدخول، أو كان Meet ينتظر قبول المضيف،
أو احتاج Chrome إلى إذن الميكروفون/الكاميرا للانضمام في الوقت الفعلي، أو علق Meet
على مطالبة لم تستطع الأتمتة حلها، فإن نتيجة الانضمام/اختبار الكلام تبلغ عن
`manualActionRequired: true` مع `manualActionReason` و
`manualActionMessage`. يجب على الوكلاء إيقاف إعادة محاولة الانضمام، والإبلاغ عن تلك
الرسالة الدقيقة بالإضافة إلى `browserUrl`/`browserTitle` الحاليين، وإعادة المحاولة فقط بعد
اكتمال إجراء المتصفح اليدوي.

إذا حُذف `chromeNode.node`، فإن OpenClaw يختار تلقائيًا فقط عندما يعلن Node واحد متصل
بالضبط عن كل من `googlemeet.chrome` والتحكم في المتصفح. إذا كانت عدة Nodes قادرة متصلة،
فعيّن `chromeNode.node` إلى معرّف Node، أو اسم العرض، أو عنوان IP البعيد.

فحوصات الفشل الشائعة:

- `Configured Google Meet node ... is not usable: offline`: يكون Node المثبّت
  معروفًا لدى Gateway لكنه غير متاح. يجب على الوكلاء التعامل مع ذلك Node على أنه
  حالة تشخيصية، لا كمضيف Chrome قابل للاستخدام، والإبلاغ عن عائق الإعداد
  بدلًا من الرجوع إلى نقل آخر ما لم يطلب المستخدم ذلك.
- `No connected Google Meet-capable node`: ابدأ `openclaw node run` في الـ VM،
  ووافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` في الـ VM. أكّد أيضًا أن مضيف
  Gateway يسمح بأمري Node كليهما باستخدام
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: ثبّت `blackhole-2ch` على المضيف
  الذي يجري فحصه وأعد التشغيل قبل استخدام صوت Chrome المحلي.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في الـ VM وأعد تشغيل الـ VM.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف تعريف المتصفح داخل الـ VM، أو
  أبقِ `chrome.guestName` معيّنًا للانضمام كضيف. يستخدم الانضمام التلقائي كضيف أتمتة
  متصفح OpenClaw عبر وكيل متصفح Node؛ تأكد من أن إعدادات متصفح Node
  تشير إلى ملف التعريف الذي تريده، مثل
  `browser.defaultProfile: "user"` أو ملف تعريف جلسة حالية مسمى.
- علامات تبويب Meet مكررة: اترك `chrome.reuseExistingTab: true` مفعّلًا. يفعّل OpenClaw
  علامة تبويب موجودة لعنوان URL نفسه في Meet قبل فتح علامة جديدة، كما أن
  إنشاء اجتماع المتصفح يعيد استخدام علامة تبويب `https://meet.google.com/new`
  قيد التقدم أو مطالبة حساب Google قبل فتح علامة أخرى.
- لا يوجد صوت: في Meet، وجّه صوت الميكروفون/السماعة عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيهًا بأسلوب Loopback
  للحصول على صوت مزدوج نظيف.

## ملاحظات التثبيت

يستخدم الإعداد الافتراضي للرد الصوتي في Chrome أداتين خارجيتين:

- `sox`: أداة صوتية لسطر الأوامر. يستخدم الـ Plugin أوامر جهاز CoreAudio
  صريحة لجسر الصوت الافتراضي 24 kHz PCM16.
- `blackhole-2ch`: مشغل صوت افتراضي لنظام macOS. ينشئ جهاز الصوت `BlackHole 2ch`
  الذي يستطيع Chrome/Meet التوجيه عبره.

لا يضمّن OpenClaw أيًا من الحزمتين أو يعيد توزيعهما. تطلب الوثائق من المستخدمين
تثبيتهما كاعتماديات مضيف عبر Homebrew. SoX مرخّص بموجب
`LGPL-2.0-only AND GPL-2.0-only`؛ وBlackHole مرخّص بموجب GPL-3.0. إذا بنيت
مثبّتًا أو جهازًا يضمّن BlackHole مع OpenClaw، فراجع شروط ترخيص BlackHole
الأصلية أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

يفتح نقل Chrome عنوان URL الخاص بـ Meet عبر تحكم متصفح OpenClaw وينضم
بصفته ملف تعريف متصفح OpenClaw المسجّل الدخول. على macOS، يتحقق الـ Plugin من وجود
`BlackHole 2ch` قبل التشغيل. وإذا ضُبط، فإنه يشغّل أيضًا أمر فحص صحة جسر الصوت
وأمر بدء التشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت على مضيف
Gateway؛ واستخدم `chrome-node` عندما يكون Chrome/الصوت على Node مقترن مثل Parallels macOS VM.
بالنسبة إلى Chrome المحلي، اختر ملف التعريف باستخدام `browser.defaultProfile`؛ ويتم تمرير
`chrome.browserProfile` إلى مضيفي `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون وسماعة Chrome عبر جسر صوت OpenClaw المحلي.
إذا لم يكن `BlackHole 2ch` مثبتًا، يفشل الانضمام بخطأ إعداد
بدلًا من الانضمام بصمت دون مسار صوت.

### Twilio

نقل Twilio هو خطة اتصال صارمة مفوضة إلى Plugin مكالمات الصوت. وهو
لا يحلل صفحات Meet لاستخراج أرقام الهاتف.

استخدم هذا عندما لا تكون مشاركة Chrome متاحة أو عندما تريد خيارًا احتياطيًا للاتصال الهاتفي.
يجب أن يعرض Google Meet رقم اتصال هاتفي ورمز PIN للاجتماع؛ لا يكتشف OpenClaw
ذلك من صفحة Meet.

فعّل Plugin مكالمات الصوت على مضيف Gateway، وليس على Chrome Node:

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

وفّر بيانات اعتماد Twilio عبر البيئة أو الإعدادات. تُبقي البيئة الأسرار خارج
`openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

استخدم `realtime.provider: "openai"` مع Plugin موفر OpenAI و
`OPENAI_API_KEY` بدلًا من ذلك إذا كان ذلك هو موفر الصوت في الوقت الفعلي لديك.

أعد تشغيل أو أعد تحميل Gateway بعد تفعيل `voice-call`؛ لا تظهر تغييرات إعدادات الـ Plugin
في عملية Gateway قيد التشغيل بالفعل حتى يُعاد تحميلها.

ثم تحقق:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

عندما يكون تفويض Twilio موصولًا، يتضمن `googlemeet setup` فحوصات ناجحة لـ
`twilio-voice-call-plugin`، و`twilio-voice-call-credentials`، و
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

## OAuth والفحص الأولي

OAuth اختياري لإنشاء رابط Meet لأن `googlemeet create` يمكنه الرجوع
إلى أتمتة المتصفح. اضبط OAuth عندما تريد الإنشاء عبر API الرسمي،
أو حل المساحات، أو فحوصات Meet Media API الأولية.

يستخدم وصول Google Meet API OAuth الخاص بالمستخدم: أنشئ عميل Google Cloud OAuth،
واطلب النطاقات المطلوبة، وفوّض حساب Google، ثم خزّن
رمز التحديث الناتج في إعدادات Plugin Google Meet أو وفّر
متغيرات البيئة `OPENCLAW_GOOGLE_MEET_*`.

لا يستبدل OAuth مسار الانضمام عبر Chrome. لا تزال وسائل نقل Chrome وChrome-node
تنضم عبر ملف تعريف Chrome مسجّل الدخول، وBlackHole/SoX، وNode متصل
عند استخدام مشاركة المتصفح. OAuth مخصص فقط لمسار Google Meet API الرسمي:
إنشاء مساحات الاجتماعات، وحل المساحات، وتشغيل فحوصات Meet Media API الأولية.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو حدده.
2. فعّل **Google Meet REST API** لذلك المشروع.
3. اضبط شاشة موافقة OAuth.
   - **Internal** هو الأبسط لمؤسسة Google Workspace.
   - **External** يعمل للإعدادات الشخصية/الاختبارية؛ ما دام التطبيق في Testing،
     أضف كل حساب Google سيفوّض التطبيق كمستخدم اختبار.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرّف عميل OAuth.
   - نوع التطبيق: **Web application**.
   - عنوان URI المعتمد لإعادة التوجيه:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرّف العميل وسر العميل.

`meetings.space.created` مطلوب بواسطة Google Meet `spaces.create`.
يسمح `meetings.space.readonly` لـ OpenClaw بحل عناوين/رموز Meet إلى مساحات.
يسمح `meetings.space.settings` لـ OpenClaw بتمرير إعدادات `SpaceConfig` مثل
`accessType` أثناء إنشاء غرفة عبر API.
`meetings.conference.media.readonly` مخصص لفحص Meet Media API الأولي وعمل الوسائط؛
قد تطلب Google التسجيل في Developer Preview لاستخدام Media API فعليًا.
إذا كنت تحتاج فقط إلى انضمامات Chrome المستندة إلى المتصفح، فتجاوز OAuth بالكامل.

### إصدار رمز التحديث

اضبط `oauth.clientId` و`oauth.clientSecret` اختياريًا، أو مررهما كـ
متغيرات بيئة، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعدادات `oauth` تحتوي على رمز تحديث. يستخدم PKCE،
واستدعاء localhost على `http://localhost:8085/oauth2callback`، وتدفق نسخ/لصق
يدويًا مع `--manual`.

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

يتضمن إخراج JSON:

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

خزّن كائن `oauth` تحت إعدادات Plugin Google Meet:

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

فضّل متغيرات البيئة عندما لا تريد رمز التحديث في الإعدادات.
إذا كانت قيم الإعدادات والبيئة موجودة معًا، يحل الـ Plugin الإعدادات
أولًا ثم يستخدم البيئة كخيار احتياطي.

تتضمن موافقة OAuth إنشاء مساحة Meet، ووصول قراءة مساحة Meet، ووصول قراءة وسائط
مؤتمر Meet. إذا أجريت المصادقة قبل وجود دعم إنشاء الاجتماعات،
فأعد تشغيل `openclaw googlemeet auth login --json` حتى يحصل رمز التحديث
على نطاق `meetings.space.created`.

### تحقق من OAuth باستخدام doctor

شغّل OAuth doctor عندما تريد فحص صحة سريعًا لا يكشف أسرارًا:

```bash
openclaw googlemeet doctor --oauth --json
```

لا يحمّل هذا وقت تشغيل Chrome ولا يتطلب Chrome Node متصلًا. إنه
يتحقق من وجود إعدادات OAuth ومن أن رمز التحديث يستطيع إصدار رمز وصول.
يتضمن تقرير JSON حقول الحالة فقط مثل `ok`، و`configured`،
و`tokenSource`، و`expiresAt`، ورسائل الفحص؛ ولا يطبع رمز الوصول،
أو رمز التحديث، أو سر العميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | يوجد `oauth.clientId` مع `oauth.refreshToken`، أو رمز وصول مخزّن مؤقتًا.       |
| `oauth-token`        | لا يزال رمز الوصول المخزّن مؤقتًا صالحًا، أو أن رمز التحديث أنشأ رمز وصول جديدًا. |
| `meet-spaces-get`    | نجح فحص `--meeting` الاختياري في حل مساحة Meet موجودة.                             |
| `meet-spaces-create` | أنشأ فحص `--create-space` الاختياري مساحة Meet جديدة.                               |

لإثبات تفعيل Google Meet API ونطاق `spaces.create` أيضًا، شغّل
فحص الإنشاء ذي الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

ينشئ `--create-space` عنوان URL مؤقتًا من Meet. استخدمه عندما تحتاج إلى تأكيد
أن مشروع Google Cloud فعّل Meet API وأن الحساب المفوّض لديه نطاق
`meetings.space.created`.

لإثبات صلاحية القراءة لمساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` صلاحية القراءة لمساحة موجودة
يمكن لحساب Google المفوّض الوصول إليها. عادةً ما تعني استجابة `403` من هذه الفحوص
أن Google Meet REST API معطّل، أو أن رمز التحديث الذي مُنحت له الموافقة يفتقد النطاق المطلوب، أو أن حساب Google لا يستطيع الوصول إلى مساحة Meet تلك. يعني خطأ رمز التحديث إعادة تشغيل `openclaw googlemeet auth login
--json` وتخزين كتلة `oauth` الجديدة.

لا حاجة إلى بيانات اعتماد OAuth لآلية الرجوع إلى المتصفح. في هذا الوضع، تأتي مصادقة Google
من ملف تعريف Chrome المسجّل دخوله على Node المحددة، وليس من
إعدادات OpenClaw.

تُقبل متغيرات البيئة هذه كبدائل رجوع:

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

شغّل الفحص التمهيدي قبل العمل على الوسائط:

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
افتراضيًا. مرّر `--all-conference-records` عندما تريد كل السجلات المحتفَظ بها
لذلك الاجتماع.

يمكن للبحث في التقويم حل عنوان URL للاجتماع من Google Calendar قبل قراءة
عناصر Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` لليوم عن حدث Calendar يتضمن
رابط Google Meet. استخدم `--event <query>` للبحث في نصوص الأحداث المطابقة، و
`--calendar <id>` لتقويم غير أساسي. يتطلب البحث في التقويم تسجيل دخول OAuth جديدًا
يتضمن نطاق القراءة فقط لأحداث Calendar.
يعرض `calendar-events` معاينة لأحداث Meet المطابقة ويضع علامة على الحدث الذي
سيختاره `latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف بالفعل معرّف سجل المؤتمر، فخاطبه مباشرةً:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

أنهِ مؤتمرًا نشطًا لمساحة منشأة عبر API عندما تريد إغلاق
الغرفة بعد المكالمة:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

يستدعي هذا Google Meet `spaces.endActiveConference` ويتطلب OAuth مع نطاق
`meetings.space.created` لمساحة يمكن للحساب المفوّض إدارتها.
يقبل OpenClaw عنوان URL من Meet، أو رمز اجتماع، أو إدخال `spaces/{id}` ويحلّه
إلى مورد مساحة API قبل إنهاء المؤتمر النشط.
وهو منفصل عن `googlemeet leave`: يوقف `leave` مشاركة OpenClaw المحلية/الجلسة،
بينما يطلب `end-active-conference` من Google Meet إنهاء المؤتمر النشط
للمساحة.

اكتب تقريرًا مقروءًا:

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

يعيد `artifacts` بيانات تعريف سجل المؤتمر إضافةً إلى بيانات تعريف موارد المشاركين والتسجيلات
والنصوص المكتوبة وإدخالات النصوص المكتوبة المنظمة والملاحظات الذكية عندما
تتيحها Google للاجتماع. استخدم `--no-transcript-entries` لتخطي
البحث عن الإدخالات في الاجتماعات الكبيرة. يوسّع `attendance` المشاركين إلى
صفوف جلسات مشاركين تتضمن أوقات أول/آخر ظهور، وإجمالي مدة الجلسة،
وأعلام التأخر/المغادرة المبكرة، ودمج موارد المشاركين المكررة حسب المستخدم
المسجّل دخوله أو اسم العرض. مرّر `--no-merge-duplicates` للإبقاء على موارد
المشاركين الخام منفصلة، و`--late-after-minutes` لضبط اكتشاف التأخر، و
`--early-before-minutes` لضبط اكتشاف المغادرة المبكرة.

يكتب `export` مجلدًا يحتوي على `summary.md` و`attendance.csv` و
`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`.
يسجّل `manifest.json` الإدخال المختار، وخيارات التصدير، وسجلات المؤتمر،
وملفات الإخراج، والأعداد، ومصدر الرمز، وحدث Calendar عند استخدامه، وأي
تحذيرات استرداد جزئية. مرّر `--zip` لكتابة أرشيف قابل للنقل أيضًا بجانب
المجلد. مرّر `--include-doc-bodies` لتصدير نصوص Google Docs المرتبطة للنصوص المكتوبة
والملاحظات الذكية عبر Google Drive `files.export`؛ ويتطلب هذا تسجيل دخول OAuth
جديدًا يتضمن نطاق القراءة فقط لـ Drive Meet. من دون
`--include-doc-bodies`، تتضمن عمليات التصدير بيانات تعريف Meet وإدخالات النصوص المكتوبة
المنظمة فقط. إذا أعادت Google فشلًا جزئيًا في عنصر، مثل خطأ في سرد الملاحظات الذكية
أو إدخال النص المكتوب أو نص مستند Drive، يحتفظ الملخص و
البيان بالتحذير بدلًا من إفشال التصدير كله.
استخدم `--dry-run` لجلب بيانات العناصر/الحضور نفسها وطباعة
JSON البيان من دون إنشاء المجلد أو ملف ZIP. يفيد ذلك قبل كتابة
تصدير كبير أو عندما يحتاج الوكيل فقط إلى الأعداد والسجلات المحددة و
التحذيرات.

يمكن للوكلاء أيضًا إنشاء الحزمة نفسها عبر أداة `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

اضبط `"dryRun": true` لإرجاع بيان التصدير فقط وتخطي عمليات كتابة الملفات.

يمكن للوكلاء أيضًا إنشاء غرفة مدعومة بواجهة API مع سياسة وصول صريحة:

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

للتحقق القائم على الاستماع أولًا، ينبغي للوكلاء استخدام `test_listen` قبل الادعاء بأن
الاجتماع مفيد:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

شغّل اختبار الدخان الحي المحمي مقابل اجتماع حقيقي محتفَظ به:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

شغّل مسبار المتصفح الحي القائم على الاستماع أولًا مقابل اجتماع سيتحدث فيه شخص ما
مع توفر تسميات Meet التوضيحية:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

بيئة اختبار الدخان الحي:

- يفعّل `OPENCLAW_LIVE_TEST=1` الاختبارات الحية المحمية.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL محتفَظ به من Meet، أو رمز، أو
  `spaces/{id}`.
- يوفّر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرّف عميل OAuth.
- يوفّر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
  رمز التحديث.
- اختياري: يستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء الرجوع نفسها
  من دون بادئة `OPENCLAW_`.

يحتاج اختبار الدخان الحي الأساسي للعناصر/الحضور إلى
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. يحتاج البحث في Calendar إلى `https://www.googleapis.com/auth/calendar.events.readonly`. يحتاج تصدير
نص مستند Drive إلى
`https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد، والمصدر، وجلسة الانضمام. مع بيانات اعتماد OAuth
يستخدم Google Meet API الرسمي. ومن دون بيانات اعتماد OAuth
يستخدم ملف تعريف المتصفح المسجّل دخوله في Chrome Node المثبّتة كآلية رجوع. يمكن للوكلاء
استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في خطوة
واحدة. للإنشاء الذي يقتصر على عنوان URL، مرّر `"join": false`.

مثال على مخرجات JSON من آلية الرجوع إلى المتصفح:

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

إذا واجهت آلية الرجوع إلى المتصفح تسجيل دخول Google أو مانع أذونات Meet قبل أن
تتمكن من إنشاء عنوان URL، فتعيد طريقة Gateway استجابة فاشلة وتعيد
أداة `google_meet` تفاصيل منظمة بدلًا من سلسلة نصية عادية:

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

عندما يرى الوكيل `manualActionRequired: true`، ينبغي أن يبلّغ عن
`manualActionMessage` إضافةً إلى سياق Node/علامة تبويب المتصفح، ويتوقف عن فتح
علامات تبويب Meet جديدة إلى أن يكمل المشغّل خطوة المتصفح.

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

ينضم إنشاء Meet افتراضيًا. لا يزال نقل Chrome أو Chrome-node يحتاج إلى ملف
تعريف Google Chrome مسجّل الدخول للانضمام عبر المتصفح. إذا كان ملف التعريف
مسجّل الخروج، فسيبلّغ OpenClaw عن `manualActionRequired: true` أو خطأ رجوع
للمتصفح، ويطلب من المشغّل إكمال تسجيل الدخول إلى Google قبل إعادة المحاولة.

اضبط `preview.enrollmentAcknowledged: true` فقط بعد تأكيد أن مشروع Cloud
ومبدأ OAuth والمشاركين في الاجتماع مسجّلون في برنامج Google Workspace Developer
Preview Program لواجهات Meet media APIs.

## التكوين

لا يحتاج مسار وكيل Chrome الشائع إلا إلى تفعيل Plugin وBlackHole وSoX ومفتاح
موفّر نسخ فوري وموفّر TTS مضبوط في OpenClaw. OpenAI هو موفّر النسخ الافتراضي؛
اضبط `realtime.voiceProvider` على `"google"` و`realtime.model` لاستخدام Google
Gemini Live في وضع `bidi` من دون تغيير موفّر النسخ الافتراضي لوضع الوكيل:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

اضبط تكوين Plugin ضمن `plugins.entries.google-meet.config`:

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

الإعدادات الافتراضية:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (لا يُقبل `"realtime"` إلا كاسم مستعار قديم للتوافق
  مع `"agent"`؛ يجب أن تذكر استدعاءات الأدوات الجديدة `"agent"`)
- `chromeNode.node`: معرّف/اسم/IP اختياري للعقدة من أجل `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم على شاشة ضيف Meet غير
  المسجّل الدخول
- `chrome.autoJoin: true`: ملء اسم الضيف والنقر على Join Now بأفضل جهد عبر
  أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تفعيل تبويب Meet موجود بدلًا من فتح نسخ
  مكررة
- `chrome.waitForInCallMs: 20000`: الانتظار حتى يبلّغ تبويب Meet أنه داخل
  المكالمة قبل تشغيل مقدمة الرد الصوتي
- `chrome.audioFormat: "pcm16-24khz"`: تنسيق صوت زوج الأوامر. استخدم
  `"g711-ulaw-8khz"` فقط لأزواج الأوامر القديمة/المخصصة التي لا تزال تُصدر
  صوتًا هاتفيًا.
- `chrome.audioBufferBytes: 4096`: مخزن معالجة SoX المؤقت لأوامر صوت زوج أوامر
  Chrome المولّدة. هذا نصف مخزن SoX الافتراضي ذي 8192 بايت، ما يقلل زمن
  انتقال الأنبوب الافتراضي مع ترك مجال لرفعه على المضيفين المزدحمين. تُقيّد
  القيم الأقل من الحد الأدنى لـ SoX إلى 17 بايت.
- `chrome.audioInputCommand`: أمر SoX يقرأ من CoreAudio `BlackHole 2ch` ويكتب
  الصوت بتنسيق `chrome.audioFormat`
- `chrome.audioOutputCommand`: أمر SoX يقرأ الصوت بتنسيق `chrome.audioFormat`
  ويكتب إلى CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: أمر ميكروفون محلي اختياري يكتب PCM أحادي القناة
  موقّع 16 بت بنمط little-endian لاكتشاف مقاطعة الإنسان أثناء تشغيل رد المساعد.
  ينطبق هذا حاليًا على جسر زوج أوامر `chrome` المستضاف على Gateway.
- `chrome.bargeInRmsThreshold: 650`: مستوى RMS الذي يُحتسب كمقاطعة بشرية على
  `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: مستوى الذروة الذي يُحتسب كمقاطعة بشرية
  على `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: الحد الأدنى للتأخير بين مسحات المقاطعة
  البشرية المتكررة
- `mode: "agent"`: وضع الرد الصوتي الافتراضي. يُنسخ كلام المشاركين بواسطة
  موفّر النسخ الفوري المضبوط، ويُرسل إلى وكيل OpenClaw المضبوط في جلسة وكيل
  فرعي لكل اجتماع، ثم يُنطق مرة أخرى عبر وقت تشغيل OpenClaw TTS العادي.
- `mode: "bidi"`: وضع نموذج فوري ثنائي الاتجاه مباشر احتياطي. يجيب موفّر الصوت
  الفوري عن كلام المشاركين مباشرة وقد يستدعي `openclaw_agent_consult` للحصول
  على إجابات أعمق/مدعومة بالأدوات.
- `mode: "transcribe"`: وضع مراقبة فقط من دون جسر الرد الصوتي.
- `realtime.provider: "openai"`: رجوع توافق يُستخدم عندما لا تكون حقول الموفّر
  المحددة النطاق أدناه معيّنة.
- `realtime.transcriptionProvider: "openai"`: معرّف الموفّر المستخدم بواسطة وضع
  `agent` للنسخ الفوري.
- `realtime.voiceProvider`: معرّف الموفّر المستخدم بواسطة وضع `bidi` للصوت
  الفوري المباشر. اضبطه على `"google"` لاستخدام Gemini Live مع إبقاء نسخ وضع
  الوكيل على OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة موجزة، مع
  `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية منطوق قصير عند اتصال الجسر الفوري؛ اضبطه
  على `""` للانضمام بصمت
- `realtime.agentId`: معرّف وكيل OpenClaw اختياري من أجل
  `openclaw_agent_consult`؛ الافتراضي هو `main`

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

ElevenLabs للاستماع والتحدث في وضع الوكيل معًا:

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
`messages.tts.providers.elevenlabs.voiceId`. يمكن لردود الوكيل أيضًا استخدام
توجيهات `[[tts:voiceId=... model=eleven_v3]]` لكل رد عندما تكون تجاوزات نموذج
TTS مفعّلة، لكن التكوين هو الإعداد الافتراضي الحتمي للاجتماعات. عند الانضمام،
يجب أن تعرض السجلات `transcriptionProvider=elevenlabs`، ويجب أن يسجل كل رد
منطوق `provider=elevenlabs model=eleven_v3 voice=<voiceId>`.

تكوين Twilio فقط:

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

يكون `voiceCall.enabled` افتراضيًا `true`؛ ومع نقل Twilio يفوّض مكالمة PSTN
الفعلية وDTMF وتحية المقدمة إلى Voice Call Plugin. يشغّل Voice Call تسلسل DTMF
قبل فتح دفق الوسائط الفوري، ثم يستخدم نص المقدمة المحفوظ كتحية فورية أولية.
إذا لم يكن `voice-call` مفعّلًا، فلا يزال بإمكان Google Meet التحقق من خطة
الاتصال وتسجيلها، لكنه لا يستطيع إجراء مكالمة Twilio.

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
`transport: "chrome-node"` عندما يعمل Chrome على عقدة مقترنة مثل جهاز افتراضي
Parallels. في كلتا الحالتين، تعمل موفّرات النماذج و`openclaw_agent_consult` على
مضيف Gateway، لذلك تبقى بيانات اعتماد النماذج هناك. مع `mode: "agent"`
الافتراضي، يتولى موفّر النسخ الفوري الاستماع، وينتج وكيل OpenClaw المضبوط
الإجابة، وينطقها OpenClaw TTS العادي داخل Meet. استخدم `mode: "bidi"` عندما
تريد أن يجيب نموذج الصوت الفوري مباشرة. لا يزال `mode: "realtime"` الخام
مقبولًا كاسم مستعار قديم للتوافق مع `mode: "agent"`، لكنه لم يعد معلنًا في
مخطط أداة الوكيل. تتضمن سجلات وضع الوكيل موفّر/نموذج النسخ المحلول عند بدء
الجسر، وموفّر TTS والنموذج والصوت وتنسيق الإخراج ومعدل العينة بعد كل رد
مركّب.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. استخدم
`action: "speak"` مع `sessionId` و`message` لجعل الوكيل الفوري يتحدث فورًا.
استخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها، وتشغيل عبارة
معروفة، وإرجاع حالة `inCall` الصحية عندما يستطيع مضيف Chrome الإبلاغ عنها.
يفرض `test_speech` دائمًا `mode: "agent"` ويفشل إذا طُلب تشغيله في
`mode: "transcribe"` لأن جلسات المراقبة فقط لا يمكنها عمدًا إصدار الكلام. تستند
نتيجة `speechOutputVerified` إلى ازدياد بايتات إخراج الصوت الفوري أثناء استدعاء
الاختبار هذا، لذلك لا تُحتسب الجلسة المعاد استخدامها ذات الصوت الأقدم كفحص
كلام ناجح جديد. استخدم `action: "leave"` لوضع علامة على انتهاء الجلسة.

يتضمن `status` صحة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج
  ملف تعريف المتصفح إلى تسجيل دخول يدوي أو قبول مضيف Meet أو أذونات أو إصلاح
  تحكم المتصفح قبل أن يعمل الكلام
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ما إذا كان
  كلام Chrome المُدار مسموحًا به الآن. يعني `speechReady: false` أن OpenClaw لم
  يرسل عبارة المقدمة/الاختبار إلى جسر الصوت.
- `providerConnected` / `realtimeReady`: حالة جسر الصوت الفوري
- `lastInputAt` / `lastOutputAt`: آخر صوت شوهد من الجسر أو أُرسل إليه
- `audioOutputRouted` / `audioOutputDeviceLabel`: ما إذا كان إخراج وسائط تبويب
  Meet قد وُجّه بنشاط إلى جهاز BlackHole الذي يستخدمه الجسر
- `lastSuppressedInputAt` / `suppressedInputBytes`: إدخال local loopback
  المتجاهل أثناء نشاط تشغيل المساعد

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## أوضاع الوكيل وBidi

تم تحسين وضع Chrome `agent` لسلوك "وكيلي موجود في الاجتماع". يسمع موفّر النسخ
الفوري صوت الاجتماع، وتُوجّه نصوص المشاركين النهائية عبر وكيل OpenClaw المضبوط،
وتُنطق الإجابة عبر وقت تشغيل OpenClaw TTS العادي. اضبط `mode: "bidi"` عندما
تريد أن يجيب نموذج الصوت الفوري مباشرة.
تُدمج أجزاء النص النهائي القريبة قبل الاستشارة حتى لا ينتج دور منطوق واحد عدة
إجابات جزئية قديمة. كما يُكبت الإدخال الفوري بينما لا يزال صوت المساعد في
الصف قيد التشغيل، وتُتجاهل أصداء النصوص الحديثة الشبيهة بالمساعد قبل استشارة
الوكيل حتى لا يجعل local loopback الخاص بـ BlackHole الوكيل يجيب عن كلامه.

| الوضع    | من يقرر الإجابة             | مسار إخراج الكلام                    | استخدمه عندما                                            |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | وكيل OpenClaw المضبوط | وقت تشغيل OpenClaw TTS العادي            | تريد سلوك "وكيلي موجود في الاجتماع"        |
| `bidi`  | نموذج الصوت الفوري      | استجابة صوت موفّر الصوت الفوري | تريد حلقة صوت محادثة بأقل زمن انتقال |

في وضع `bidi`، عندما يحتاج النموذج الفوري إلى تفكير أعمق أو معلومات حالية أو
أدوات OpenClaw العادية، يمكنه استدعاء `openclaw_agent_consult`.

تُشغّل أداة الاستشارة وكيل OpenClaw العادي في الخلفية باستخدام سياق نص اجتماع حديث، وتُرجع إجابة منطوقة موجزة. في وضع `agent`، يرسل OpenClaw تلك الإجابة مباشرة إلى وقت تشغيل TTS؛ وفي وضع `bidi`، يمكن لنموذج الصوت الفوري نطق نتيجة الاستشارة مرة أخرى داخل الاجتماع. وهي تستخدم آلية الاستشارة المشتركة نفسها التي تستخدمها Voice Call.

افتراضيًا، تعمل الاستشارات على الوكيل `main`. عيّن `realtime.agentId` عندما ينبغي لمسار Meet أن يستشير مساحة عمل مخصصة لوكيل OpenClaw، وإعدادات النموذج الافتراضية، وسياسة الأدوات، والذاكرة، وسجل الجلسات.

تستخدم استشارات وضع الوكيل مفتاح جلسة لكل اجتماع بصيغة `agent:<id>:subagent:google-meet:<session>` بحيث تحتفظ أسئلة المتابعة بسياق الاجتماع مع وراثة سياسة الوكيل العادية من الوكيل المُكوَّن.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: اعرض أداة الاستشارة واقصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`.
- `owner`: اعرض أداة الاستشارة واسمح للوكيل العادي باستخدام سياسة أدوات الوكيل العادية.
- `none`: لا تعرض أداة الاستشارة لنموذج الصوت الفوري.

يكون مفتاح جلسة الاستشارة محصورًا بكل جلسة Meet، لذلك يمكن لاستدعاءات الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد أن ينضم Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

لاختبار الانضمام والنطق الكامل:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## قائمة تحقق الاختبار الحي

استخدم هذا التسلسل قبل تسليم اجتماع إلى وكيل غير مراقَب:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

حالة Chrome-node المتوقعة:

- يكون `googlemeet setup` كله باللون الأخضر.
- يتضمن `googlemeet setup` الفحص `chrome-node-connected` عندما يكون Chrome-node هو وسيلة النقل الافتراضية أو عندما تكون عقدة مثبتة.
- يُظهر `nodes status` أن العقدة المحددة متصلة.
- تعلن العقدة المحددة عن كل من `googlemeet.chrome` و`browser.proxy`.
- ينضم تبويب Meet إلى المكالمة ويُرجع `test-speech` صحة Chrome مع `inCall: true`.

بالنسبة إلى مضيف Chrome بعيد مثل Parallels macOS VM، فهذا هو أقصر فحص آمن بعد تحديث Gateway أو VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن Plugin الخاص بـ Gateway محمّل، وأن عقدة VM متصلة بالرمز الحالي، وأن جسر صوت Meet متاح قبل أن يفتح وكيل تبويب اجتماع حقيقي.

لاختبار Twilio سريع، استخدم اجتماعًا يعرض تفاصيل الاتصال الهاتفي:

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
- تحتوي الجلسة المُرجعة على `transport: "twilio"` و`twilio.voiceCallId`.
- يُظهر `openclaw logs --follow` تقديم DTMF TwiML قبل TwiML الفوري، ثم جسرًا فوريًا مع تحية أولية في قائمة الانتظار.
- يؤدي `googlemeet leave <sessionId>` إلى إنهاء مكالمة الصوت المفوضة.

## استكشاف الأخطاء وإصلاحها

### الوكيل لا يمكنه رؤية أداة Google Meet

تأكد من أن Plugin ممكّن في إعدادات Gateway وأعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد حررت للتو `plugins.entries.google-meet`، فأعد تشغيل Gateway أو أعد تحميله. يرى الوكيل العامل فقط أدوات Plugin المسجلة بواسطة عملية Gateway الحالية.

على مضيفي Gateway غير macOS، تظل أداة `google_meet` الموجهة إلى الوكيل مرئية، لكن إجراءات الرد الصوتي المحلي عبر Chrome تُحظر قبل أن تصل إلى جسر الصوت. يعتمد صوت الرد المحلي عبر Chrome حاليًا على `BlackHole 2ch` في macOS، لذلك ينبغي لوكلاء Linux استخدام `mode: "transcribe"` أو اتصال Twilio الهاتفي أو مضيف `chrome-node` على macOS بدل مسار وكيل Chrome المحلي الافتراضي.

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

يجب أن تكون العقدة متصلة وأن تسرد `googlemeet.chrome` بالإضافة إلى `browser.proxy`.
يجب أن تسمح إعدادات Gateway بأوامر العقدة هذه:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

إذا فشل `googlemeet setup` في `chrome-node-connected` أو أبلغ سجل Gateway عن `gateway token mismatch`، فأعد تثبيت العقدة أو أعد تشغيلها باستخدام رمز Gateway الحالي. بالنسبة إلى Gateway على LAN، يعني ذلك عادةً:

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

شغّل `googlemeet test-listen` لانضمامات المراقبة فقط أو `googlemeet test-speech` للانضمامات الفورية، ثم افحص صحة Chrome المُرجعة. إذا أبلغ أي من الفحصين عن `manualActionRequired: true`، فاعرض `manualActionMessage` للمشغّل وتوقف عن إعادة المحاولة حتى يكتمل إجراء المتصفح.

إجراءات يدوية شائعة:

- سجّل الدخول إلى ملف Chrome الشخصي.
- اسمح للضيف من حساب مضيف Meet.
- امنح أذونات الميكروفون/الكاميرا في Chrome عندما تظهر مطالبة الأذونات الأصلية في Chrome.
- أغلق مربع حوار أذونات Meet العالق أو أصلحه.

لا تبلّغ عن "not signed in" لمجرد أن Meet يعرض "Do you want people to hear you in the meeting?" فهذا فاصل اختيار الصوت في Meet؛ ينقر OpenClaw على **Use microphone** عبر أتمتة المتصفح عند توفرها ويواصل انتظار حالة الاجتماع الحقيقية. بالنسبة إلى الرجوع الاحتياطي للمتصفح المخصص للإنشاء فقط، قد ينقر OpenClaw على **Continue without microphone** لأن إنشاء URL لا يحتاج إلى مسار الصوت الفوري.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` أولًا نقطة نهاية Google Meet API `spaces.create` عندما تكون بيانات اعتماد OAuth مكوّنة. من دون بيانات اعتماد OAuth، يعود إلى متصفح عقدة Chrome المثبتة. تأكد مما يلي:

- بالنسبة إلى الإنشاء عبر API: تكون `oauth.clientId` و`oauth.refreshToken` مكوّنتين، أو تكون متغيرات البيئة المطابقة `OPENCLAW_GOOGLE_MEET_*` موجودة.
- بالنسبة إلى الإنشاء عبر API: يكون رمز التحديث قد أُصدر بعد إضافة دعم الإنشاء. قد تفتقد الرموز الأقدم نطاق `meetings.space.created`؛ أعد تشغيل `openclaw googlemeet auth login --json` وحدّث إعدادات Plugin.
- بالنسبة إلى الرجوع الاحتياطي للمتصفح: يشير `defaultTransport: "chrome-node"` و`chromeNode.node` إلى عقدة متصلة تحتوي على `browser.proxy` و`googlemeet.chrome`.
- بالنسبة إلى الرجوع الاحتياطي للمتصفح: يكون ملف Chrome الشخصي الخاص بـ OpenClaw على تلك العقدة مسجّل الدخول إلى Google ويمكنه فتح `https://meet.google.com/new`.
- بالنسبة إلى الرجوع الاحتياطي للمتصفح: تعيد المحاولات استخدام تبويب `https://meet.google.com/new` موجود أو تبويب مطالبة حساب Google قبل فتح تبويب جديد. إذا انتهت مهلة وكيل، فأعد محاولة استدعاء الأداة بدل فتح تبويب Meet آخر يدويًا.
- بالنسبة إلى الرجوع الاحتياطي للمتصفح: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم `browser.nodeId` و`browser.targetId` و`browserUrl` و`manualActionMessage` المُرجعة لإرشاد المشغّل. لا تعاود المحاولة في حلقة حتى يكتمل ذلك الإجراء.
- بالنسبة إلى الرجوع الاحتياطي للمتصفح: إذا عرض Meet "Do you want people to hear you in the meeting?"، فاترك التبويب مفتوحًا. ينبغي أن ينقر OpenClaw على **Use microphone** أو، في الرجوع الاحتياطي المخصص للإنشاء فقط، **Continue without microphone** عبر أتمتة المتصفح وأن يواصل انتظار URL الذي ينشئه Meet. إذا تعذر ذلك، فينبغي أن يذكر الخطأ `meet-audio-choice-required`، وليس `google-login-required`.

### ينضم الوكيل لكنه لا يتحدث

تحقق من المسار الفوري:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "agent"` لمسار STT -> وكيل OpenClaw -> TTS العادي للرد الصوتي، أو `mode: "bidi"` للرجوع الاحتياطي الصوتي الفوري المباشر. لا يبدأ `mode: "transcribe"` جسر الرد الصوتي عمدًا. لتصحيح المراقبة فقط، شغّل `openclaw googlemeet status --json <session-id>` بعد أن يتحدث المشاركون وتحقق من `captioning` و`transcriptLines` و`lastCaptionText`. إذا كانت `inCall` تساوي true لكن `transcriptLines` تبقى عند `0`، فقد تكون تسميات Meet التوضيحية معطلة، أو لم يتحدث أحد منذ تثبيت المراقب، أو تغيّرت واجهة Meet، أو أن التسميات التوضيحية الحية غير متاحة للغة/حساب الاجتماع.

يتحقق `googlemeet test-speech` دائمًا من المسار الفوري ويبلغ عما إذا تمت ملاحظة بايتات إخراج الجسر لذلك الاستدعاء. إذا كانت `speechOutputVerified` تساوي false و`speechOutputTimedOut` تساوي true، فربما قبل مزود الخدمة الفورية النطق لكن OpenClaw لم ير بايتات إخراج جديدة تصل إلى جسر صوت Chrome.

تحقق أيضًا مما يلي:

- يتوفر مفتاح مزود خدمة فورية على مضيف Gateway، مثل `OPENAI_API_KEY` أو `GEMINI_API_KEY`.
- يظهر `BlackHole 2ch` على مضيف Chrome.
- يوجد `sox` على مضيف Chrome.
- يتم توجيه ميكروفون Meet ومكبر الصوت عبر مسار الصوت الافتراضي الذي يستخدمه OpenClaw. ينبغي أن يعرض `doctor` القيمة `meet output routed: yes` لانضمامات Chrome المحلية الفورية.

يطبع `googlemeet doctor [session-id]` الجلسة، والعقدة، وحالة داخل المكالمة، وسبب الإجراء اليدوي، واتصال مزود الخدمة الفورية، و`realtimeReady`، ونشاط إدخال/إخراج الصوت، وآخر طوابع زمنية للصوت، وعدادات البايت، وURL المتصفح. استخدم `googlemeet status [session-id] --json` عندما تحتاج إلى JSON الخام. استخدم `googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث OAuth الخاص بـ Google Meet من دون كشف الرموز؛ أضف `--meeting` أو `--create-space` عندما تحتاج أيضًا إلى إثبات Google Meet API.

إذا انتهت مهلة وكيل ويمكنك رؤية تبويب Meet مفتوح بالفعل، فافحص ذلك التبويب من دون فتح تبويب آخر:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. وهو يركز ويفحص تبويب Meet موجودًا لوسيلة النقل المحددة. مع `chrome`، يستخدم التحكم المحلي في المتصفح عبر Gateway؛ ومع `chrome-node`، يستخدم عقدة Chrome المكوّنة. لا يفتح تبويبًا جديدًا ولا ينشئ جلسة جديدة؛ بل يبلّغ عن العائق الحالي، مثل تسجيل الدخول أو القبول أو الأذونات أو حالة اختيار الصوت. يتحدث أمر CLI إلى Gateway المكوّن، لذلك يجب أن يكون Gateway قيد التشغيل؛ ويتطلب `chrome-node` أيضًا أن تكون عقدة Chrome متصلة.

### فشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا به أو ممكّنًا. أضفه إلى `plugins.allow`، ومكّن `plugins.entries.voice-call`، وأعد تحميل Gateway.

يفشل `twilio-voice-call-credentials` عندما تفتقد خلفية Twilio معرّف الحساب SID، أو رمز المصادقة، أو رقم المتصل. عيّن هذه على مضيف Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

يفشل `twilio-voice-call-webhook` عندما لا يملك `voice-call` تعرض Webhook عامًا، أو عندما يشير `publicUrl` إلى local loopback أو مساحة شبكة خاصة.
عيّن `plugins.entries.voice-call.config.publicUrl` إلى URL العام للمزود أو كوّن نفقًا/تعرض Tailscale لـ `voice-call`.

ليست عناوين URL الخاصة بـ local loopback والخاصة صالحة لاستدعاءات شركات الاتصالات. لا تستخدم `localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x` أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` باعتبارها `publicUrl`.

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

ثم أعد تشغيل أو إعادة تحميل Gateway وشغّل:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

يكون `voicecall smoke` للتحقق من الجاهزية فقط افتراضيًا. لإجراء تشغيل تجريبي لرقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

أضف `--yes` فقط عندما تريد عمدًا إجراء مكالمة إشعار صادرة حية:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تبدأ مكالمة Twilio لكنها لا تدخل الاجتماع أبدًا

تأكد من أن حدث Meet يعرض تفاصيل الاتصال الهاتفي. مرّر رقم الاتصال الهاتفي ورمز PIN الدقيقين أو تسلسل DTMF مخصصًا:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم `w` بادئة أو فواصل في `--dtmf-sequence` إذا كان المزوّد يحتاج إلى توقف مؤقت قبل إدخال رمز PIN.

إذا أُنشئت المكالمة الهاتفية لكن قائمة Meet لا تعرض مطلقًا مشارك الاتصال الهاتفي:

- شغّل `openclaw googlemeet doctor <session-id>` لتأكيد معرّف مكالمة Twilio المفوّضة، وما إذا وُضع DTMF في قائمة الانتظار، وما إذا طُلبت التحية الافتتاحية.
- شغّل `openclaw voicecall status --call-id <id>` وتأكد من أن المكالمة لا تزال نشطة.
- شغّل `openclaw voicecall tail` وتحقق من وصول Webhooks الخاصة بـ Twilio إلى Gateway.
- شغّل `openclaw logs --follow` وابحث عن تسلسل Twilio Meet: يفوّض Google Meet الانضمام، ويخزّن Voice Call ويقدّم TwiML الخاص بـ DTMF قبل الاتصال، ويقدّم Voice Call TwiML فوريًا لمكالمة Twilio، ثم يطلب Google Meet نطق المقدمة باستخدام `voicecall.speak`.
- أعد تشغيل `openclaw googlemeet setup --transport twilio`؛ يلزم اجتياز فحص الإعداد، لكنه لا يثبت أن تسلسل رمز PIN للاجتماع صحيح.
- تأكد من أن رقم الاتصال الهاتفي ينتمي إلى دعوة Meet نفسها والمنطقة نفسها مثل رمز PIN.
- زد `voiceCall.dtmfDelayMs` عن القيمة الافتراضية البالغة 12 ثانية إذا كان Meet يجيب ببطء أو كان نص المكالمة لا يزال يعرض مطالبة تطلب رمز PIN بعد إرسال DTMF قبل الاتصال.
- إذا انضم المشارك لكنك لا تسمع التحية، فتحقق من `openclaw logs --follow` بحثًا عن طلب `voicecall.speak` بعد DTMF، وعن تشغيل TTS عبر تدفق الوسائط أو بديل Twilio `<Say>`. إذا كان نص المكالمة لا يزال يحتوي على "enter the meeting PIN"، فهذا يعني أن ساق الهاتف لم تنضم بعد إلى غرفة Meet، لذلك لن يسمع مشاركو الاجتماع الكلام.

إذا لم تصل Webhooks، فاستكشف أخطاء Plugin Voice Call أولًا: يجب أن يتمكن المزوّد من الوصول إلى `plugins.entries.voice-call.config.publicUrl` أو النفق المكوّن. راجع [استكشاف أخطاء المكالمة الصوتية وإصلاحها](/ar/plugins/voice-call#troubleshooting).

## ملاحظات

واجهة API الرسمية للوسائط في Google Meet موجهة للاستقبال، لذلك لا يزال التحدث داخل مكالمة Meet يحتاج إلى مسار مشارك. يُبقي هذا Plugin ذلك الحد واضحًا: يتولى Chrome مشاركة المتصفح وتوجيه الصوت المحلي؛ وتتولى Twilio المشاركة عبر الاتصال الهاتفي.

تحتاج أوضاع الرد الصوتي في Chrome إلى `BlackHole 2ch` بالإضافة إلى أحد الخيارين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يمتلك OpenClaw الجسر ويوصل الصوت بتنسيق `chrome.audioFormat` بين هذين الأمرين والمزوّد المحدد. يستخدم وضع الوكيل النسخ الفوري مع TTS عادي؛ ويستخدم وضع bidi مزوّد الصوت الفوري. مسار Chrome الافتراضي هو PCM16 بتردد 24 kHz مع `chrome.audioBufferBytes: 4096`؛ ويظل G.711 mu-law بتردد 8 kHz متاحًا لأزواج الأوامر القديمة.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي بالكامل ويجب أن يخرج بعد بدء البرنامج الخفي أو التحقق منه. هذا صالح فقط لـ `bidi` لأن وضع `agent` يحتاج إلى وصول مباشر إلى زوج الأوامر من أجل TTS.

عندما يستدعي وكيل أداة `google_meet` في وضع الوكيل، تنسخ جلسة مستشار الاجتماع نص المتصل الحالي قبل الرد على كلام المشاركين. تبقى جلسة Meet منفصلة (`agent:<agentId>:subagent:google-meet:<sessionId>`) حتى لا تعدّل متابعات الاجتماع نص المتصل مباشرة.

للحصول على صوت مزدوج الاتجاه نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة افتراضية منفصلة أو مخطط أجهزة افتراضية بأسلوب Loopback. يمكن لجهاز BlackHole مشترك واحد أن يعيد صدى المشاركين الآخرين إلى المكالمة.

مع جسر Chrome ذي زوج الأوامر، يمكن لـ `chrome.bargeInInputCommand` الاستماع إلى ميكروفون محلي منفصل ومسح تشغيل المساعد عندما يبدأ الإنسان بالكلام. يُبقي هذا كلام الإنسان متقدمًا على خرج المساعد حتى عندما يكون إدخال local loopback المشترك من BlackHole مكبوتًا مؤقتًا أثناء تشغيل المساعد. مثل `chrome.audioInputCommand` و`chrome.audioOutputCommand`، فهو أمر محلي يكوّنه المشغّل. استخدم مسار أمر موثوقًا صريحًا أو قائمة وسائط، ولا توجهه إلى سكربتات من مواقع غير موثوقة.

يشغّل `googlemeet speak` جسر صوت الرد النشط لجلسة Chrome. يوقف `googlemeet leave` ذلك الجسر. بالنسبة إلى جلسات Twilio المفوّضة عبر Plugin Voice Call، يؤدي `leave` أيضًا إلى إنهاء المكالمة الصوتية الأساسية. استخدم `googlemeet end-active-conference` عندما تريد أيضًا إغلاق مؤتمر Google Meet النشط لمساحة مُدارة عبر API.

## ذات صلة

- [Plugin المكالمة الصوتية](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
