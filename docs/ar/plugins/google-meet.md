---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - تريد من وكيل OpenClaw إنشاء مكالمة Google Meet جديدة
    - أنت تهيئ Chrome أو عقدة Chrome أو Twilio كوسيلة نقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL الصريحة الخاصة بـ Meet عبر Chrome أو Twilio مع افتراضيات الصوت في الوقت الفعلي'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-02T07:36:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef6945172fed00e5583f655789fab9734e5232c6820bd3fafe7d7c4a48e2f33a
    source_path: plugins/google-meet.md
    workflow: 16
---

يدعم OpenClaw المشاركين في Google Meet، ويكون الـ Plugin صريحًا في تصميمه:

- لا ينضم إلا إلى عنوان URL صريح بصيغة `https://meet.google.com/...`.
- يمكنه إنشاء مساحة Meet جديدة عبر Google Meet API، ثم الانضمام إلى عنوان URL
  المُعاد.
- وضع الصوت `realtime` هو الوضع الافتراضي.
- يمكن لصوت realtime استدعاء وكيل OpenClaw الكامل عند الحاجة إلى استدلال أعمق
  أو أدوات.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `realtime` للاستماع
  والرد الصوتي المباشرين، أو `transcribe` للانضمام إلى المتصفح والتحكم فيه من دون
  جسر صوت realtime.
- تبدأ المصادقة كـ Google OAuth شخصي أو ملف Chrome شخصي سبق تسجيل الدخول فيه.
- لا يوجد إعلان موافقة تلقائي.
- خلفية الصوت الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف node مقترن.
- يقبل Twilio رقم اتصال داخليًا إضافة إلى PIN اختياري أو تسلسل DTMF.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لسير عمل مؤتمرات الوكيل الأوسع.

## بدء سريع

ثبّت اعتماديات الصوت المحلية واضبط مزود صوت realtime خلفيًا. OpenAI هو الخيار
الافتراضي؛ ويعمل Google Gemini Live أيضًا مع
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

يثبّت `blackhole-2ch` جهاز الصوت الافتراضي `BlackHole 2ch`. يتطلب مثبّت Homebrew
إعادة تشغيل قبل أن يعرض macOS الجهاز:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقق من كلا الجزأين:

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

مخرجات الإعداد مخصصة لتكون قابلة للقراءة من الوكيل وواعية بالوضع. فهي تعرض ملف
Chrome الشخصي، وتثبيت node، وبالنسبة إلى انضمامات Chrome بنمط realtime، جسر
الصوت BlackHole/SoX وفحوصات مقدمة realtime المؤجلة. للانضمامات الخاصة بالمراقبة
فقط، تحقق من النقل نفسه باستخدام `--mode transcribe`؛ يتجاوز ذلك الوضع متطلبات
صوت realtime لأنه لا يستمع ولا يتحدث عبر الجسر:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

عند ضبط تفويض Twilio، تعرض عملية الإعداد أيضًا ما إذا كان Plugin
`voice-call`، واعتمادات Twilio، وتعريض Webhook العام جاهزة. تعامل مع أي فحص
`ok: false` كعائق أمام النقل والوضع المفحوصين قبل أن تطلب من وكيل الانضمام.
استخدم `openclaw googlemeet setup --json` للسكربتات أو المخرجات القابلة للقراءة
آليًا. استخدم `--transport chrome` أو `--transport chrome-node` أو
`--transport twilio` للفحص المسبق لنقل محدد قبل أن يحاول الوكيل استخدامه.

بالنسبة إلى Twilio، افحص النقل مسبقًا وبشكل صريح دائمًا عندما يكون النقل
الافتراضي هو Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

يلتقط ذلك نقص توصيل `voice-call`، أو اعتمادات Twilio، أو تعذر الوصول إلى تعريض
Webhook قبل أن يحاول الوكيل الاتصال بالاجتماع.

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
  "mode": "realtime"
}
```

تظل أداة `google_meet` الموجهة للوكلاء متاحة على مضيفات غير macOS لتدفقات
العناصر الأثرية، والتقويم، والإعداد، والنسخ، وTwilio، و`chrome-node`. تُحظر
إجراءات Chrome المحلية بنمط realtime هناك لأن مسار صوت Chrome realtime المضمّن
يعتمد حاليًا على `BlackHole 2ch` في macOS. على Linux، استخدم
`mode: "transcribe"`، أو الاتصال الداخلي عبر Twilio، أو مضيف `chrome-node` يعمل
بنظام macOS للمشاركة في Chrome بنمط realtime.

أنشئ اجتماعًا جديدًا وانضم إليه:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

بالنسبة إلى الغرف المنشأة عبر API، استخدم Google Meet
`SpaceConfig.accessType` عندما تريد أن تكون سياسة الغرفة التي لا تتطلب طلب دخول
صريحة بدلًا من أن تُورث من إعدادات حساب Google الافتراضية:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

يسمح `OPEN` لأي شخص لديه عنوان URL الخاص بـ Meet بالانضمام من دون طلب دخول.
يسمح `TRUSTED` للمستخدمين الموثوقين في مؤسسة المضيف، والمستخدمين الخارجيين
المدعوين، ومستخدمي الاتصال الداخلي بالانضمام من دون طلب دخول. يقيّد
`RESTRICTED` الدخول من دون طلب دخول على المدعوين. تنطبق هذه الإعدادات فقط على
مسار الإنشاء الرسمي عبر Google Meet API، لذا يجب ضبط اعتمادات OAuth.

إذا صادقت Google Meet قبل توفر هذا الخيار، فأعد تشغيل
`openclaw googlemeet auth login --json` بعد إضافة نطاق
`meetings.space.settings` إلى شاشة موافقة Google OAuth لديك.

أنشئ عنوان URL فقط من دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

يتضمن `googlemeet create` مسارين:

- إنشاء عبر API: يُستخدم عندما تكون اعتمادات Google Meet OAuth مضبوطة. هذا هو
  المسار الأكثر حتمية ولا يعتمد على حالة واجهة المتصفح.
- رجوع المتصفح: يُستخدم عندما لا تكون اعتمادات OAuth موجودة. يستخدم OpenClaw
  node Chrome المثبتة، ويفتح `https://meet.google.com/new`، وينتظر أن يعيد
  Google التوجيه إلى عنوان URL فعلي يحتوي على رمز اجتماع، ثم يعيد ذلك العنوان.
  يتطلب هذا المسار أن يكون ملف Chrome الشخصي الخاص بـ OpenClaw على node قد سجّل
  الدخول إلى Google مسبقًا. تتعامل أتمتة المتصفح مع مطالبة الميكروفون الأولى
  الخاصة بـ Meet؛ ولا تُعامل تلك المطالبة كفشل في تسجيل الدخول إلى Google.
  تحاول تدفقات الانضمام والإنشاء أيضًا إعادة استخدام تبويب Meet موجود قبل فتح
  تبويب جديد. تتجاهل المطابقة سلاسل استعلام URL غير الضارة مثل `authuser`، لذا
  ينبغي لمحاولة الوكيل اللاحقة أن تركز على الاجتماع المفتوح بالفعل بدلًا من
  إنشاء تبويب Chrome ثانٍ.

تتضمن مخرجات الأمر/الأداة حقل `source` (`api` أو `browser`) كي تتمكن الوكلاء
من شرح المسار المستخدم. ينضم `create` إلى الاجتماع الجديد افتراضيًا ويعيد
`joined: true` إضافة إلى جلسة الانضمام. لسك عنوان URL فقط، استخدم
`create --no-join` في CLI أو مرر `"join": false` إلى الأداة.

أو أخبر وكيلًا: "أنشئ Google Meet، وانضم إليه بصوت realtime، وأرسل إليّ
الرابط." ينبغي للوكيل استدعاء `google_meet` مع `action: "create"` ثم مشاركة
`meetingUri` المُعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

للانضمام الخاص بالمراقبة فقط/التحكم بالمتصفح، اضبط `"mode": "transcribe"`. لا
يشغّل ذلك جسر نموذج realtime ثنائي الاتجاه، ولا يتطلب BlackHole أو SoX، ولن
يرد صوتيًا داخل الاجتماع. تتجنب انضمامات Chrome في هذا الوضع أيضًا منح إذن
الميكروفون/الكاميرا في OpenClaw وتتجنب مسار **Use microphone** في Meet. إذا
عرض Meet شاشة اختيار الصوت، تحاول الأتمتة مسار عدم استخدام الميكروفون، وإلا
تبلغ عن إجراء يدوي بدلًا من فتح الميكروفون المحلي. في وضع transcribe، تثبّت
عمليات نقل Chrome المُدارة أيضًا مراقب تسميات توضيحية لـ Meet بأفضل جهد.
يعرض `googlemeet status --json` و`googlemeet doctor` الحقول `captioning`،
و`captionsEnabledAttempted`، و`transcriptLines`، و`lastCaptionAt`،
و`lastCaptionSpeaker`، و`lastCaptionText`، وذيلًا قصيرًا `recentTranscript` حتى
يتمكن المشغلون من معرفة ما إذا كان المتصفح قد انضم إلى المكالمة وما إذا كانت
تسميات Meet التوضيحية تنتج نصًا.
استخدم `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
عندما تحتاج إلى فحص بنعم/لا: فهو ينضم في وضع transcribe، وينتظر حركة جديدة في
التسمية التوضيحية أو النص المنسوخ، ويعيد `listenVerified` و`listenTimedOut`
وحقول الإجراء اليدوي وأحدث حالة لصحة التسميات التوضيحية.

أثناء جلسات realtime، تتضمن حالة `google_meet` صحة المتصفح وجسر الصوت مثل
`inCall` و`manualActionRequired` و`providerConnected` و`realtimeReady` و
`audioInputActive` و`audioOutputActive` والطوابع الزمنية لآخر إدخال/إخراج
وعدادات البايت وحالة إغلاق الجسر. إذا ظهرت مطالبة صفحة Meet آمنة، تتعامل معها
أتمتة المتصفح عندما تستطيع. تُعرض مطالبات تسجيل الدخول، وقبول المضيف، وأذونات
المتصفح/نظام التشغيل كإجراء يدوي مع سبب ورسالة كي ينقلها الوكيل. لا تصدر جلسات
Chrome المُدارة المقدمة أو عبارة الاختبار إلا بعد أن تبلغ صحة المتصفح
`inCall: true`؛ وإلا فستعرض الحالة `speechReady: false` وتُحظر محاولة الكلام
بدلًا من الادعاء بأن الوكيل تحدث داخل الاجتماع.

تنضم انضمامات Chrome المحلية عبر ملف متصفح OpenClaw الشخصي الذي سجّل الدخول.
يتطلب وضع realtime `BlackHole 2ch` لمسار الميكروفون/السماعة الذي يستخدمه
OpenClaw. للحصول على صوت ثنائي الاتجاه نظيف، استخدم أجهزة افتراضية منفصلة أو
رسمًا بيانيًا بأسلوب Loopback؛ يكفي جهاز BlackHole واحد لاختبار دخان أول، لكنه
قد يسبب صدى.

### Gateway محلي + Chrome على Parallels

لا تحتاج إلى Gateway كامل من OpenClaw أو مفتاح API لنموذج داخل VM يعمل بنظام
macOS لمجرد جعل VM يملك Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل مضيف node
في VM. فعّل الـ Plugin المضمّن على VM مرة واحدة كي تعلن node عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API،
  ومزود realtime، وضبط Plugin Google Meet.
- VM بنظام macOS في Parallels: OpenClaw CLI/مضيف node، وGoogle Chrome، وSoX،
  وBlackHole 2ch، وملف Chrome شخصي مسجل الدخول إلى Google.
- غير مطلوب داخل VM: خدمة Gateway، أو ضبط الوكيل، أو مفتاح OpenAI/GPT، أو
  إعداد مزود النموذج.

ثبّت اعتماديات VM:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل VM بعد تثبيت BlackHole كي يعرض macOS `BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقق من أن VM يمكنه رؤية جهاز الصوت وأوامر SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ثبّت OpenClaw أو حدّثه في VM، ثم فعّل الـ Plugin المضمّن هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ مضيف node في VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على LAN ولا تستخدم TLS، فإن node ترفض
WebSocket بنص صريح ما لم تشترك صراحةً في تلك الشبكة الخاصة الموثوقة:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو بيئة عملية، وليس إعداد
`openclaw.json`. يخزنه `openclaw node install` في بيئة LaunchAgent عندما يكون
موجودًا في أمر التثبيت.

وافق على node من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأكد من أن Gateway يرى node وأنها تعلن كلًا من `googlemeet.chrome` وقدرة
المتصفح/`browser.proxy`:

```bash
openclaw nodes status
```

وجّه Meet عبر تلك node على مضيف Gateway:

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

لاختبار دخان بأمر واحد ينشئ جلسة أو يعيد استخدامها، وينطق عبارة معروفة، ويطبع
صحة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام في الوقت الفعلي، تملأ أتمتة متصفح OpenClaw اسم الضيف، وتنقر
Join/Ask to join، وتقبل خيار "Use microphone" عند التشغيل الأول في Meet عندما
تظهر تلك المطالبة. أثناء الانضمام للمراقبة فقط أو إنشاء اجتماع عبر المتصفح فقط، فإنه
يتابع بعد المطالبة نفسها بدون الميكروفون عندما يكون ذلك الخيار متاحًا.
إذا لم يكن ملف تعريف المتصفح مسجل الدخول، أو كان Meet ينتظر قبول المضيف،
أو كان Chrome يحتاج إلى إذن الميكروفون/الكاميرا لانضمام في الوقت الفعلي، أو كان Meet عالقًا
عند مطالبة لم تستطع الأتمتة حلها، فإن نتيجة الانضمام/اختبار الكلام تعرض
`manualActionRequired: true` مع `manualActionReason` و
`manualActionMessage`. يجب على الوكلاء التوقف عن إعادة محاولة الانضمام، والإبلاغ عن تلك
الرسالة الدقيقة مع `browserUrl`/`browserTitle` الحاليين، وإعادة المحاولة فقط بعد اكتمال
الإجراء اليدوي في المتصفح.

إذا تم حذف `chromeNode.node`، فإن OpenClaw يختار تلقائيًا فقط عندما تعلن عقدة واحدة
متصلة بالضبط عن كل من `googlemeet.chrome` والتحكم في المتصفح. إذا كانت
عدة عقد قادرة متصلة، فاضبط `chromeNode.node` على معرّف العقدة،
أو اسم العرض، أو عنوان IP البعيد.

فحوصات الإخفاق الشائعة:

- `Configured Google Meet node ... is not usable: offline`: العقدة المثبتة
  معروفة لدى Gateway لكنها غير متاحة. يجب على الوكلاء التعامل مع تلك العقدة كحالة
  تشخيصية، لا كمضيف Chrome قابل للاستخدام، والإبلاغ عن عائق الإعداد
  بدلًا من الرجوع إلى وسيلة نقل أخرى ما لم يطلب المستخدم ذلك.
- `No connected Google Meet-capable node`: شغّل `openclaw node run` في VM،
  ووافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` في VM. أكّد أيضًا أن مضيف
  Gateway يسمح بأمري العقدة معًا عبر
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: ثبّت `blackhole-2ch` على المضيف
  الجاري فحصه وأعد التشغيل قبل استخدام صوت Chrome المحلي.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في VM وأعد تشغيل VM.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف تعريف المتصفح داخل VM، أو
  أبقِ `chrome.guestName` مضبوطًا لانضمام الضيف. يستخدم الانضمام التلقائي للضيف أتمتة
  متصفح OpenClaw عبر وكيل متصفح العقدة؛ تأكد من أن إعدادات متصفح العقدة
  تشير إلى ملف التعريف الذي تريده، مثلًا
  `browser.defaultProfile: "user"` أو ملف تعريف جلسة موجودة مسمى.
- تبويبات Meet مكررة: اترك `chrome.reuseExistingTab: true` مفعّلًا. يفعّل OpenClaw
  تبويبًا موجودًا لعنوان URL نفسه في Meet قبل فتح تبويب جديد، كما أن
  إنشاء الاجتماع عبر المتصفح يعيد استخدام تبويب `https://meet.google.com/new`
  الجاري أو تبويب مطالبة حساب Google قبل فتح تبويب آخر.
- لا يوجد صوت: في Meet، وجّه الميكروفون/السماعة عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيهًا على نمط Loopback
  للحصول على صوت مزدوج نظيف.

## ملاحظات التثبيت

يستخدم الإعداد الافتراضي للوقت الفعلي في Chrome أداتين خارجيتين:

- `sox`: أداة صوت من سطر الأوامر. يستخدم Plugin أوامر أجهزة CoreAudio
  صريحة لجسر الصوت الافتراضي 24 kHz PCM16.
- `blackhole-2ch`: مشغل صوت افتراضي لنظام macOS. ينشئ جهاز الصوت `BlackHole 2ch`
  الذي يمكن لـ Chrome/Meet التوجيه عبره.

لا يضمّن OpenClaw أيًا من الحزمتين أو يعيد توزيعهما. تطلب الوثائق من المستخدمين
تثبيتهما كتبعيّات مضيف عبر Homebrew. SoX مرخص بموجب
`LGPL-2.0-only AND GPL-2.0-only`؛ وBlackHole مرخص بموجب GPL-3.0. إذا بنيت
مثبّتًا أو جهازًا يضمّن BlackHole مع OpenClaw، فراجع شروط ترخيص BlackHole
الأصلية أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

يفتح نقل Chrome عنوان URL الخاص بـ Meet عبر تحكم متصفح OpenClaw وينضم
بصفته ملف تعريف متصفح OpenClaw المسجّل الدخول. على macOS، يتحقق Plugin من وجود
`BlackHole 2ch` قبل التشغيل. إذا تم تكوينه، فإنه يشغّل أيضًا أمر فحص صحة
جسر الصوت وأمر بدء التشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون
Chrome/الصوت على مضيف Gateway؛ واستخدم `chrome-node` عندما يكون Chrome/الصوت
على عقدة مقترنة مثل VM لنظام macOS عبر Parallels. بالنسبة إلى Chrome المحلي، اختر
ملف التعريف عبر `browser.defaultProfile`؛ ويتم تمرير `chrome.browserProfile` إلى
مضيفي `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون وسماعة Chrome عبر جسر صوت OpenClaw المحلي.
إذا لم يكن `BlackHole 2ch` مثبتًا، يفشل الانضمام بخطأ إعداد
بدلًا من الانضمام بصمت دون مسار صوت.

### Twilio

نقل Twilio هو خطة اتصال صارمة مفوضة إلى Plugin Voice Call. إنه
لا يحلل صفحات Meet لاستخراج أرقام الهاتف.

استخدم هذا عندما لا تكون مشاركة Chrome متاحة أو تريد احتياطي اتصال هاتفي.
يجب أن يعرض Google Meet رقم اتصال هاتفي ورقم PIN للاجتماع؛
لا يكتشف OpenClaw هذه القيم من صفحة Meet.

فعّل Plugin Voice Call على مضيف Gateway، وليس على عقدة Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
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
        },
      },
    },
  },
}
```

وفّر بيانات اعتماد Twilio عبر البيئة أو الإعدادات. تبقي البيئة
الأسرار خارج `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

أعد تشغيل Gateway أو أعد تحميله بعد تفعيل `voice-call`؛ لا تظهر تغييرات إعدادات Plugin
في عملية Gateway قيد التشغيل بالفعل حتى يُعاد تحميلها.

ثم تحقق:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

عند توصيل تفويض Twilio، يتضمن `googlemeet setup` فحوصات ناجحة لـ
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

## OAuth والفحص التمهيدي

OAuth اختياري لإنشاء رابط Meet لأن `googlemeet create` يمكنه الرجوع إلى
أتمتة المتصفح. كوّن OAuth عندما تريد إنشاءً عبر API الرسمي،
أو حل المساحات، أو فحوصات تمهيدية لـ Meet Media API.

يستخدم وصول Google Meet API OAuth للمستخدم: أنشئ عميل OAuth في Google Cloud،
واطلب النطاقات المطلوبة، وفوّض حساب Google، ثم خزّن
رمز التحديث الناتج في إعدادات Plugin Google Meet أو وفّر متغيرات البيئة
`OPENCLAW_GOOGLE_MEET_*`.

لا يستبدل OAuth مسار انضمام Chrome. لا تزال وسائل نقل Chrome وChrome-node
تنضم عبر ملف تعريف Chrome مسجّل الدخول، وBlackHole/SoX، وعقدة متصلة
عندما تستخدم مشاركة المتصفح. OAuth مخصص فقط لمسار Google Meet API الرسمي:
إنشاء مساحات الاجتماعات، وحل المساحات، وتشغيل فحوصات Meet Media API التمهيدية.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو حدده.
2. فعّل **Google Meet REST API** لذلك المشروع.
3. كوّن شاشة موافقة OAuth.
   - **Internal** هو الأبسط لمؤسسة Google Workspace.
   - **External** يعمل للإعدادات الشخصية/الاختبارية؛ أثناء وجود التطبيق في Testing،
     أضف كل حساب Google سيخوّل التطبيق كمستخدم اختبار.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرّف عميل OAuth.
   - نوع التطبيق: **Web application**.
   - عنوان URI لإعادة التوجيه المصرّح به:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرّف العميل وسر العميل.

`meetings.space.created` مطلوب بواسطة Google Meet `spaces.create`.
يسمح `meetings.space.readonly` لـ OpenClaw بحل عناوين URL/رموز Meet إلى مساحات.
يسمح `meetings.space.settings` لـ OpenClaw بتمرير إعدادات `SpaceConfig` مثل
`accessType` أثناء إنشاء الغرفة عبر API.
`meetings.conference.media.readonly` مخصص للفحص التمهيدي لـ Meet Media API وعمل الوسائط؛
قد تطلب Google التسجيل في Developer Preview لاستخدام Media API فعليًا.
إذا كنت تحتاج فقط إلى انضمامات Chrome المستندة إلى المتصفح، فتجاوز OAuth بالكامل.

### إصدار رمز التحديث

كوّن `oauth.clientId` و، اختياريًا، `oauth.clientSecret`، أو مررهما كمتغيرات
بيئة، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعدادات `oauth` مع رمز تحديث. يستخدم PKCE،
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

خزّن كائن `oauth` ضمن إعدادات Plugin Google Meet:

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
إذا كانت قيم الإعدادات والبيئة موجودة معًا، فإن Plugin يحل الإعدادات
أولًا ثم يستخدم البيئة كرجوع احتياطي.

تتضمن موافقة OAuth إنشاء مساحة Meet، ووصول قراءة مساحة Meet، ووصول قراءة
وسائط مؤتمر Meet. إذا كنت قد صادقت قبل وجود دعم إنشاء الاجتماعات،
فأعد تشغيل `openclaw googlemeet auth login --json` كي يحتوي رمز التحديث
على نطاق `meetings.space.created`.

### التحقق من OAuth باستخدام الطبيب

شغّل طبيب OAuth عندما تريد فحص صحة سريعًا بلا أسرار:

```bash
openclaw googlemeet doctor --oauth --json
```

لا يحمّل هذا وقت تشغيل Chrome ولا يتطلب عقدة Chrome متصلة. إنه
يتحقق من وجود إعدادات OAuth وأن رمز التحديث يمكنه إصدار رمز وصول.
يتضمن تقرير JSON حقول حالة فقط مثل `ok` و`configured` و
`tokenSource` و`expiresAt` ورسائل الفحص؛ ولا يطبع رمز الوصول
أو رمز التحديث أو سر العميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` مع `oauth.refreshToken`، أو رمز وصول مخزّن مؤقتًا، موجود.       |
| `oauth-token`        | رمز الوصول المخزّن مؤقتًا لا يزال صالحًا، أو أصدر رمز التحديث رمز وصول جديدًا. |
| `meet-spaces-get`    | حل فحص `--meeting` الاختياري مساحة Meet موجودة.                             |
| `meet-spaces-create` | أنشأ فحص `--create-space` الاختياري مساحة Meet جديدة.                               |

لإثبات تفعيل Google Meet API ونطاق `spaces.create` أيضًا، شغّل
فحص الإنشاء ذي الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` ينشئ عنوان URL مؤقتًا لـ Meet. استخدمه عندما تحتاج إلى التأكد
من أن مشروع Google Cloud قد فعّل Meet API وأن الحساب المصرح له لديه نطاق
`meetings.space.created`.

لإثبات وصول القراءة إلى مساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` وصول القراءة إلى مساحة موجودة
يمكن لحساب Google المصرح له الوصول إليها. عادةً ما يعني ظهور `403` من هذه الفحوصات
أن Google Meet REST API معطلة، أو أن رمز التحديث الموافق عليه يفتقد النطاق
المطلوب، أو أن حساب Google لا يمكنه الوصول إلى مساحة Meet تلك. يعني خطأ رمز
التحديث إعادة تشغيل `openclaw googlemeet auth login
--json` وتخزين كتلة `oauth` الجديدة.

لا توجد حاجة إلى بيانات اعتماد OAuth للخيار الاحتياطي للمتصفح. في هذا الوضع،
تأتي مصادقة Google من ملف Chrome الشخصي المسجل دخوله على العقدة المحددة، وليس
من إعدادات OpenClaw.

تُقبل متغيرات البيئة هذه كخيارات احتياطية:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

حلّ عنوان URL لـ Meet أو رمزًا أو `spaces/{id}` عبر `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

شغّل فحص ما قبل التشغيل قبل عمل الوسائط:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اسرد عناصر الاجتماع والحضور بعد أن ينشئ Meet سجلات المؤتمر:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

مع `--meeting`، يستخدم `artifacts` و`attendance` أحدث سجل مؤتمر افتراضيًا.
مرّر `--all-conference-records` عندما تريد كل سجل محتفظ به لذلك الاجتماع.

يمكن لبحث التقويم حل عنوان URL للاجتماع من Google Calendar قبل قراءة عناصر
Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` لهذا اليوم عن حدث Calendar يحتوي على رابط
Google Meet. استخدم `--event <query>` للبحث في نص الحدث المطابق، و
`--calendar <id>` لتقويم غير أساسي. يتطلب بحث التقويم تسجيل دخول OAuth جديدًا
يتضمن نطاق القراءة فقط لأحداث Calendar.
يعرض `calendar-events` معاينة لأحداث Meet المطابقة ويميّز الحدث الذي سيختاره
`latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف بالفعل معرّف سجل المؤتمر، فاختره مباشرة:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

أنهِ مؤتمرًا نشطًا لمساحة أنشأتها API عندما تريد إغلاق الغرفة بعد المكالمة:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

يستدعي هذا Google Meet `spaces.endActiveConference` ويتطلب OAuth مع نطاق
`meetings.space.created` لمساحة يمكن للحساب المصرح له إدارتها.
يقبل OpenClaw عنوان URL لـ Meet، أو رمز اجتماع، أو إدخال `spaces/{id}` ويحلّه
إلى مورد مساحة API قبل إنهاء المؤتمر النشط.
وهذا منفصل عن `googlemeet leave`: يوقف `leave` مشاركة OpenClaw المحلية/الخاصة
بالجلسة، بينما يطلب `end-active-conference` من Google Meet إنهاء المؤتمر النشط
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

يعيد `artifacts` بيانات وصفية لسجل المؤتمر بالإضافة إلى بيانات وصفية لموارد
المشارك، والتسجيل، والنص المنسوخ، وإدخال النص المنسوخ المنظّم، والملاحظات
الذكية عندما يتيحها Google للاجتماع. استخدم `--no-transcript-entries` لتخطي
البحث عن الإدخالات للاجتماعات الكبيرة. يوسّع `attendance` المشاركين إلى صفوف
جلسات مشاركة تتضمن أوقات أول/آخر ظهور، وإجمالي مدة الجلسة، وعلامات التأخر
والمغادرة المبكرة، ودمج موارد المشاركين المكررة حسب المستخدم المسجل دخوله أو
اسم العرض. مرّر `--no-merge-duplicates` لإبقاء موارد المشاركين الخام منفصلة،
و`--late-after-minutes` لضبط اكتشاف التأخر، و`--early-before-minutes` لضبط
اكتشاف المغادرة المبكرة.

يكتب `export` مجلدًا يحتوي على `summary.md` و`attendance.csv` و
`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`.
يسجل `manifest.json` الإدخال المختار، وخيارات التصدير، وسجلات المؤتمر، وملفات
الإخراج، والأعداد، ومصدر الرمز، وحدث Calendar عندما يُستخدم، وأي تحذيرات
استرجاع جزئية. مرّر `--zip` لكتابة أرشيف محمول أيضًا بجانب المجلد. مرّر
`--include-doc-bodies` لتصدير نص Google Docs المرتبط بالنص المنسوخ والملاحظات
الذكية عبر Google Drive `files.export`؛ يتطلب هذا تسجيل دخول OAuth جديدًا
يتضمن نطاق القراءة فقط لـ Drive Meet. بدون `--include-doc-bodies`، تتضمن
عمليات التصدير بيانات Meet الوصفية وإدخالات النص المنسوخ المنظّمة فقط. إذا
أعاد Google فشلًا جزئيًا في عنصر، مثل خطأ في سرد الملاحظات الذكية، أو إدخال
النص المنسوخ، أو نص مستند Drive، يحتفظ الملخص والبيان بالتحذير بدلًا من إفشال
التصدير كله.
استخدم `--dry-run` لجلب بيانات العناصر/الحضور نفسها وطباعة JSON الخاص بالبيان
دون إنشاء المجلد أو ZIP. يكون ذلك مفيدًا قبل كتابة تصدير كبير أو عندما يحتاج
الوكيل فقط إلى الأعداد، والسجلات المحددة، والتحذيرات.

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

عيّن `"dryRun": true` لإرجاع بيان التصدير فقط وتخطي كتابة الملفات.

يمكن للوكلاء أيضًا إنشاء غرفة مدعومة بـ API مع سياسة وصول صريحة:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
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

للتحقق القائم على الاستماع أولًا، يجب على الوكلاء استخدام `test_listen` قبل
الادعاء بأن الاجتماع مفيد:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

شغّل اختبار الدخان الحي المحمي على اجتماع حقيقي محتفظ به:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

شغّل اختبار المتصفح الحي القائم على الاستماع أولًا على اجتماع سيتحدث فيه شخص
ما مع توفر تسميات Meet التوضيحية:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

بيئة اختبار الدخان الحي:

- يفعّل `OPENCLAW_LIVE_TEST=1` الاختبارات الحية المحمية.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL لـ Meet محتفظ به، أو رمز، أو
  `spaces/{id}`.
- يوفّر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرّف عميل OAuth.
- يوفّر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
  رمز التحديث.
- اختياري: تستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء الخيارات الاحتياطية
  نفسها بدون بادئة `OPENCLAW_`.

يحتاج اختبار الدخان الحي الأساسي للعناصر/الحضور إلى
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. يحتاج بحث
التقويم إلى `https://www.googleapis.com/auth/calendar.events.readonly`. يحتاج
تصدير نص مستند Drive إلى
`https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد، والمصدر، وجلسة الانضمام. مع بيانات اعتماد
OAuth يستخدم Google Meet API الرسمي. بدون بيانات اعتماد OAuth يستخدم ملف
المتصفح الشخصي المسجل دخوله لعقدة Chrome المثبتة كخيار احتياطي. يمكن للوكلاء
استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في خطوة
واحدة. للإنشاء بعنوان URL فقط، مرّر `"join": false`.

مثال على إخراج JSON من الخيار الاحتياطي للمتصفح:

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

إذا واجه الخيار الاحتياطي للمتصفح تسجيل دخول Google أو مانع أذونات Meet قبل أن
يتمكن من إنشاء عنوان URL، تعيد طريقة Gateway استجابة فاشلة وتعيد أداة
`google_meet` تفاصيل منظمة بدلًا من سلسلة نصية بسيطة:

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

عندما يرى الوكيل `manualActionRequired: true`، يجب أن يبلّغ عن
`manualActionMessage` بالإضافة إلى سياق عقدة/علامة تبويب المتصفح ويتوقف عن فتح
علامات تبويب Meet جديدة حتى يكمل المشغّل خطوة المتصفح.

مثال على إخراج JSON من الإنشاء عبر API:

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
Google Chrome شخصي مسجل الدخول للانضمام عبر المتصفح. إذا كان ملف التعريف مسجلًا
خروجه، يبلّغ OpenClaw عن `manualActionRequired: true` أو خطأ في الخيار الاحتياطي
للمتصفح ويطلب من المشغّل إكمال تسجيل الدخول إلى Google قبل إعادة المحاولة.

عيّن `preview.enrollmentAcknowledged: true` فقط بعد تأكيد تسجيل مشروعك في Cloud،
ومبدأ OAuth، ومشاركي الاجتماع في Google Workspace Developer Preview Program
لـ Meet media APIs.

## الإعدادات

لا يحتاج مسار Chrome الشائع في الوقت الفعلي إلا إلى تفعيل Plugin، وBlackHole،
وSoX، ومفتاح مزود صوت في الوقت الفعلي من جهة خلفية. OpenAI هو الخيار الافتراضي؛
عيّن `realtime.provider: "google"` لاستخدام Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

عيّن إعدادات Plugin تحت `plugins.entries.google-meet.config`:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: معرّف/اسم/IP اختياري للعقدة لـ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم في شاشة ضيف Meet غير المسجّل دخوله
- `chrome.autoJoin: true`: ملء اسم الضيف والنقر على الانضمام الآن بأفضل جهد عبر أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تنشيط تبويب Meet موجود بدلًا من فتح تبويبات مكررة
- `chrome.waitForInCallMs: 20000`: انتظار تبويب Meet حتى يبلّغ أنه داخل المكالمة قبل تشغيل مقدمة الوقت الفعلي
- `chrome.audioFormat: "pcm16-24khz"`: تنسيق صوت زوج الأوامر. استخدم `"g711-ulaw-8khz"` فقط لأزواج الأوامر القديمة/المخصصة التي ما زالت تصدر صوتًا هاتفيًا.
- `chrome.audioInputCommand`: أمر SoX يقرأ من CoreAudio `BlackHole 2ch` ويكتب الصوت بتنسيق `chrome.audioFormat`
- `chrome.audioOutputCommand`: أمر SoX يقرأ الصوت بتنسيق `chrome.audioFormat` ويكتب إلى CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: أمر ميكروفون محلي اختياري يكتب PCM أحادي القناة بترميز signed 16-bit little-endian لاكتشاف مقاطعة الإنسان أثناء تشغيل صوت المساعد. ينطبق هذا حاليًا على جسر زوج أوامر `chrome` المستضاف على Gateway.
- `chrome.bargeInRmsThreshold: 650`: مستوى RMS الذي يُعد مقاطعة بشرية على `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: مستوى الذروة الذي يُعد مقاطعة بشرية على `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: الحد الأدنى للتأخير بين عمليات مسح المقاطعات البشرية المتكررة
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة موجزة، مع `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص استعداد منطوق قصير عند اتصال جسر الوقت الفعلي؛ اضبطه على `""` للانضمام بصمت
- `realtime.agentId`: معرّف وكيل OpenClaw اختياري لـ `openclaw_agent_consult`؛ الافتراضي هو `main`

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
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

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

القيمة الافتراضية لـ `voiceCall.enabled` هي `true`؛ ومع نقل Twilio يفوّض مكالمة PSTN الفعلية وDTMF وتحية المقدمة إلى Plugin Voice Call. يشغّل Voice Call تسلسل DTMF قبل فتح تدفق وسائط الوقت الفعلي، ثم يستخدم نص المقدمة المحفوظ كتحية وقت فعلي ابتدائية. إذا لم يكن `voice-call` مفعّلًا، فلا يزال بإمكان Google Meet التحقق من خطة الاتصال وتسجيلها، لكنه لا يستطيع إجراء مكالمة Twilio.

## الأداة

يمكن للوكلاء استخدام أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

استخدم `transport: "chrome"` عندما يعمل Chrome على مضيف Gateway. استخدم `transport: "chrome-node"` عندما يعمل Chrome على عقدة مقترنة مثل آلة Parallels افتراضية. في كلتا الحالتين يعمل نموذج الوقت الفعلي و`openclaw_agent_consult` على مضيف Gateway، لذلك تبقى بيانات اعتماد النموذج هناك.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. استخدم `action: "speak"` مع `sessionId` و`message` لجعل وكيل الوقت الفعلي يتحدث فورًا. استخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها، وتشغيل عبارة معروفة، وإرجاع صحة `inCall` عندما يستطيع مضيف Chrome الإبلاغ عنها. يفرض `test_speech` دائمًا `mode: "realtime"` ويفشل إذا طُلب منه العمل في `mode: "transcribe"` لأن جلسات المراقبة فقط لا يمكنها عمدًا إصدار كلام. تستند نتيجة `speechOutputVerified` إلى زيادة بايتات خرج صوت الوقت الفعلي أثناء استدعاء الاختبار هذا، لذلك لا تُحتسب الجلسة المعاد استخدامها ذات الصوت الأقدم كفحص كلام ناجح جديد. استخدم `action: "leave"` لوضع علامة على انتهاء الجلسة.

يتضمن `status` صحة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج ملف تعريف المتصفح إلى تسجيل دخول يدوي، أو قبول مضيف Meet، أو أذونات، أو إصلاح تحكم المتصفح قبل أن يعمل الكلام
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ما إذا كان كلام Chrome المُدار مسموحًا الآن. تعني `speechReady: false` أن OpenClaw لم يرسل عبارة المقدمة/الاختبار إلى جسر الصوت.
- `providerConnected` / `realtimeReady`: حالة جسر صوت الوقت الفعلي
- `lastInputAt` / `lastOutputAt`: آخر صوت شوهد من الجسر أو أُرسل إليه
- `lastSuppressedInputAt` / `suppressedInputBytes`: إدخال local loopback تم تجاهله أثناء نشاط تشغيل صوت المساعد

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## استشارة وكيل الوقت الفعلي

وضع الوقت الفعلي في Chrome محسّن لحلقة صوت مباشرة. يسمع مزود صوت الوقت الفعلي صوت الاجتماع ويتحدث عبر جسر الصوت المُعد. عندما يحتاج نموذج الوقت الفعلي إلى استدلال أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية، يمكنه استدعاء `openclaw_agent_consult`.

تشغّل أداة الاستشارة وكيل OpenClaw العادي خلف الكواليس مع سياق نص الاجتماع الحديث، وتعيد إجابة منطوقة موجزة إلى جلسة صوت الوقت الفعلي. يمكن لنموذج الصوت بعد ذلك نطق تلك الإجابة داخل الاجتماع. وهي تستخدم أداة استشارة الوقت الفعلي المشتركة نفسها مثل Voice Call.

افتراضيًا، تعمل الاستشارات على الوكيل `main`. اضبط `realtime.agentId` عندما ينبغي لمسار Meet أن يستشير مساحة عمل وكيل OpenClaw مخصصة، وإعدادات نموذج افتراضية، وسياسة أدوات، وذاكرة، وسجل جلسة.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: يعرض أداة الاستشارة ويقيّد الوكيل العادي بـ `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`.
- `owner`: يعرض أداة الاستشارة ويسمح للوكيل العادي باستخدام سياسة أدوات الوكيل العادية.
- `none`: لا يعرض أداة الاستشارة لنموذج صوت الوقت الفعلي.

مفتاح جلسة الاستشارة محدود النطاق لكل جلسة Meet، لذلك يمكن لاستدعاءات الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

لفرض فحص استعداد منطوق بعد انضمام Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

لفحص الدخان الكامل للانضمام والتحدث:

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
- يتضمن `googlemeet setup` الفحص `chrome-node-connected` عندما يكون Chrome-node هو النقل الافتراضي أو عند تثبيت عقدة.
- يعرض `nodes status` أن العقدة المحددة متصلة.
- تعلن العقدة المحددة عن كل من `googlemeet.chrome` و`browser.proxy`.
- ينضم تبويب Meet إلى المكالمة ويعيد `test-speech` صحة Chrome مع `inCall: true`.

لمضيف Chrome بعيد مثل آلة Parallels macOS افتراضية، هذا هو أقصر فحص آمن بعد تحديث Gateway أو الآلة الافتراضية:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن Plugin Gateway محمّل، وأن عقدة الآلة الافتراضية متصلة بالرمز الحالي، وأن جسر صوت Meet متاح قبل أن يفتح وكيل تبويب اجتماع حقيقيًا.

لفحص دخان Twilio، استخدم اجتماعًا يعرض تفاصيل الاتصال الهاتفي:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

حالة Twilio المتوقعة:

- يتضمن `googlemeet setup` فحوصات خضراء لـ `twilio-voice-call-plugin` و`twilio-voice-call-credentials` و`twilio-voice-call-webhook`.
- يتوفر `voicecall` في CLI بعد إعادة تحميل Gateway.
- تحتوي الجلسة المُعادة على `transport: "twilio"` و`twilio.voiceCallId`.
- يعرض `openclaw logs --follow` تقديم DTMF TwiML قبل TwiML الوقت الفعلي، ثم جسر وقت فعلي مع تحية ابتدائية في قائمة الانتظار.
- ينهي `googlemeet leave <sessionId>` مكالمة الصوت المفوّضة.

## استكشاف الأخطاء وإصلاحها

### لا يستطيع الوكيل رؤية أداة Google Meet

تأكد من تفعيل Plugin في إعدادات Gateway وأعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد عدّلت للتو `plugins.entries.google-meet`، فأعد تشغيل Gateway أو أعد تحميلها. لا يرى الوكيل الجاري إلا أدوات Plugin المسجلة بواسطة عملية Gateway الحالية.

على مضيفات Gateway غير macOS، تبقى أداة `google_meet` المواجهة للوكيل مرئية، لكن إجراءات وقت Chrome الفعلي المحلية تُحظر قبل وصولها إلى جسر الصوت. يعتمد صوت وقت Chrome الفعلي المحلي حاليًا على macOS `BlackHole 2ch`، لذلك ينبغي لوكلاء Linux استخدام `mode: "transcribe"`، أو اتصال Twilio الهاتفي، أو مضيف `chrome-node` على macOS بدلًا من مسار وقت Chrome الفعلي المحلي الافتراضي.

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

يجب أن تكون العقدة متصلة وأن تسرد `googlemeet.chrome` بالإضافة إلى `browser.proxy`. يجب أن تسمح إعدادات Gateway بأوامر العقدة تلك:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

إذا فشل `googlemeet setup` في `chrome-node-connected` أو أبلغ سجل Gateway عن `gateway token mismatch`، فأعد تثبيت العقدة أو أعد تشغيلها باستخدام رمز Gateway الحالي. بالنسبة إلى Gateway على شبكة LAN يعني هذا عادةً:

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

شغّل `googlemeet test-listen` للانضمامات المخصصة للمراقبة فقط أو `googlemeet test-speech` للانضمامات في الوقت الفعلي، ثم افحص صحة Chrome المُعادة. إذا أبلغ أي من الفحصين عن `manualActionRequired: true`، فاعرض `manualActionMessage` على المشغّل وتوقف عن إعادة المحاولة حتى يكتمل إجراء المتصفح.

الإجراءات اليدوية الشائعة:

- سجّل الدخول إلى ملف تعريف Chrome.
- اقبل الضيف من حساب مضيف Meet.
- امنح أذونات ميكروفون/كاميرا Chrome عندما تظهر مطالبة الأذونات الأصلية في Chrome.
- أغلق مربع حوار أذونات Meet العالق أو أصلحه.

لا تبلغ عن "not signed in" لمجرد أن Meet يعرض "Do you want people to
hear you in the meeting?" هذه شاشة Meet البينية لاختيار الصوت؛ ينقر OpenClaw
على **Use microphone** عبر أتمتة المتصفح عندما يكون ذلك متاحًا ويواصل انتظار
حالة الاجتماع الحقيقية. بالنسبة إلى وضع الرجوع إلى المتصفح للإنشاء فقط، قد ينقر
OpenClaw على **Continue without microphone** لأن إنشاء عنوان URL لا يحتاج إلى
مسار الصوت الفوري.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` أولًا نقطة نهاية Google Meet API `spaces.create`
عندما تكون بيانات اعتماد OAuth مكوّنة. من دون بيانات اعتماد OAuth، يرجع إلى
متصفح Chrome node المثبّت. تحقق مما يلي:

- لإنشاء API: تم تكوين `oauth.clientId` و`oauth.refreshToken`،
  أو توجد متغيرات البيئة المطابقة `OPENCLAW_GOOGLE_MEET_*`.
- لإنشاء API: تم إصدار refresh token بعد إضافة دعم الإنشاء.
  قد تفتقد الرموز الأقدم نطاق `meetings.space.created`؛ أعد تشغيل
  `openclaw googlemeet auth login --json` وحدّث تكوين Plugin.
- للرجوع إلى المتصفح: يشير `defaultTransport: "chrome-node"` و
  `chromeNode.node` إلى node متصل يحتوي على `browser.proxy` و
  `googlemeet.chrome`.
- للرجوع إلى المتصفح: ملف تعريف OpenClaw Chrome على ذلك node مسجل الدخول
  إلى Google ويمكنه فتح `https://meet.google.com/new`.
- للرجوع إلى المتصفح: تعيد المحاولات استخدام تبويب موجود
  `https://meet.google.com/new` أو تبويب مطالبة حساب Google قبل فتح تبويب جديد.
  إذا انتهت مهلة وكيل، فأعد محاولة استدعاء الأداة بدلًا من فتح تبويب Meet آخر يدويًا.
- للرجوع إلى المتصفح: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم
  `browser.nodeId` و`browser.targetId` و`browserUrl` و
  `manualActionMessage` المعادة لتوجيه المشغّل. لا تعد المحاولة في حلقة إلى أن
  يكتمل ذلك الإجراء.
- للرجوع إلى المتصفح: إذا عرض Meet "Do you want people to hear you in the
  meeting?"، فاترك التبويب مفتوحًا. يجب أن ينقر OpenClaw على **Use microphone** أو،
  في رجوع الإنشاء فقط، على **Continue without microphone** عبر أتمتة المتصفح
  وأن يواصل انتظار عنوان URL المنشأ من Meet. إذا لم يستطع، فيجب أن يذكر الخطأ
  `meet-audio-choice-required`، وليس `google-login-required`.

### ينضم الوكيل لكنه لا يتحدث

تحقق من المسار الفوري:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "realtime"` للاستماع والرد بالكلام. أما `mode: "transcribe"` فلا
يبدأ جسر الصوت الفوري ثنائي الاتجاه عن قصد. لتصحيح الأخطاء بالمراقبة فقط،
شغّل `openclaw googlemeet status --json <session-id>` بعد أن يتحدث المشاركون
وتحقق من `captioning` و`transcriptLines` و`lastCaptionText`. إذا كانت `inCall`
تساوي true لكن `transcriptLines` تبقى عند `0`، فقد تكون تسميات Meet التوضيحية
معطلة، أو لم يتحدث أحد منذ تثبيت المراقب، أو تغيّرت واجهة Meet، أو أن التسميات
التوضيحية المباشرة غير متاحة للغة الاجتماع أو الحساب.

يفحص `googlemeet test-speech` دائمًا المسار الفوري ويبلغ عما إذا تمت ملاحظة
بايتات خرج الجسر لذلك الاستدعاء. إذا كانت `speechOutputVerified` تساوي false و
`speechOutputTimedOut` تساوي true، فربما قبل موفر الوقت الفوري العبارة لكن
OpenClaw لم يرَ بايتات خرج جديدة تصل إلى جسر صوت Chrome.

تحقق أيضًا مما يلي:

- يتوفر مفتاح موفر فوري على مضيف Gateway، مثل
  `OPENAI_API_KEY` أو `GEMINI_API_KEY`.
- يظهر `BlackHole 2ch` على مضيف Chrome.
- يوجد `sox` على مضيف Chrome.
- يتم توجيه ميكروفون ومكبر صوت Meet عبر مسار الصوت الافتراضي الذي يستخدمه
  OpenClaw.

يطبع `googlemeet doctor [session-id]` الجلسة، وnode، وحالة داخل المكالمة،
وسبب الإجراء اليدوي، واتصال موفر الوقت الفوري، و`realtimeReady`، ونشاط إدخال/إخراج
الصوت، وآخر طوابع زمنية للصوت، وعدادات البايت، وعنوان URL للمتصفح. استخدم
`googlemeet status [session-id] --json` عندما تحتاج إلى JSON الخام. استخدم
`googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث OAuth لـ Google Meet
من دون كشف الرموز؛ أضف `--meeting` أو `--create-space` عندما تحتاج أيضًا إلى
إثبات Google Meet API.

إذا انتهت مهلة وكيل ويمكنك رؤية تبويب Meet مفتوح بالفعل، فافحص ذلك التبويب
من دون فتح تبويب آخر:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. يركّز ويفحص تبويب Meet موجودًا
لوسيلة النقل المحددة. مع `chrome`، يستخدم التحكم المحلي في المتصفح عبر Gateway؛
ومع `chrome-node`، يستخدم Chrome node المكوّن. لا يفتح تبويبًا جديدًا ولا ينشئ
جلسة جديدة؛ بل يبلغ عن العائق الحالي، مثل تسجيل الدخول أو القبول أو الأذونات أو
حالة اختيار الصوت. يتحدث أمر CLI إلى Gateway المكوّن، لذلك يجب أن يكون Gateway
قيد التشغيل؛ ويتطلب `chrome-node` أيضًا أن يكون Chrome node متصلًا.

### فشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا أو غير مفعّل.
أضفه إلى `plugins.allow`، وفعّل `plugins.entries.voice-call`، ثم أعد تحميل Gateway.

يفشل `twilio-voice-call-credentials` عندما تفتقد واجهة Twilio الخلفية account
SID أو auth token أو رقم المتصل. اضبط هذه القيم على مضيف Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

يفشل `twilio-voice-call-webhook` عندما لا يملك `voice-call` تعرض Webhook عامًا،
أو عندما يشير `publicUrl` إلى local loopback أو نطاق شبكة خاصة.
اضبط `plugins.entries.voice-call.config.publicUrl` على عنوان URL العام للموفر أو
كوّن تعرض نفق/Tailscale لـ `voice-call`.

عناوين URL المحلية والخاصة غير صالحة لعمليات معاودة اتصال شركة الاتصالات. لا تستخدم
`localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x`
أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كـ `publicUrl`.

لعنوان URL عام مستقر:

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

للتطوير المحلي، استخدم نفقًا أو تعرض Tailscale بدلًا من عنوان URL لمضيف خاص:

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

يكون `voicecall smoke` مخصصًا للتحقق من الجاهزية فقط افتراضيًا. لتجربة جافة على
رقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

أضف `--yes` فقط عندما تريد عمدًا إجراء مكالمة إشعار صادرة مباشرة:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تبدأ مكالمة Twilio لكنها لا تدخل الاجتماع أبدًا

تأكد من أن حدث Meet يعرض تفاصيل الاتصال الهاتفي. مرّر رقم الاتصال الهاتفي وPIN
الدقيقين أو تسلسل DTMF مخصصًا:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم `w` بادئة أو فواصل في `--dtmf-sequence` إذا كان الموفر يحتاج إلى توقف
مؤقت قبل إدخال PIN.

إذا تم إنشاء المكالمة الهاتفية لكن قائمة Meet لا تعرض مشارك الاتصال الهاتفي أبدًا:

- شغّل `openclaw googlemeet doctor <session-id>` لتأكيد معرف مكالمة Twilio المفوضة،
  وما إذا تم وضع DTMF في قائمة الانتظار، وما إذا طُلبت التحية الافتتاحية.
- شغّل `openclaw voicecall status --call-id <id>` وتأكد من أن المكالمة لا تزال
  نشطة.
- شغّل `openclaw voicecall tail` وتحقق من وصول Twilio webhooks إلى Gateway.
- شغّل `openclaw logs --follow` وابحث عن تسلسل Twilio Meet: يفوض Google
  Meet الانضمام، ويخزن Voice Call DTMF TwiML قبل الاتصال، ويقدم TwiML الأولي،
  ثم يقدم TwiML الفوري ويبدأ الجسر الفوري مع `initialGreeting=queued`.
- أعد تشغيل `openclaw googlemeet setup --transport twilio`؛ فحص الإعداد الأخضر
  مطلوب لكنه لا يثبت أن تسلسل PIN للاجتماع صحيح.
- تأكد من أن رقم الاتصال الهاتفي ينتمي إلى دعوة Meet والمنطقة نفسيهما مثل PIN.
- زد فترات التوقف البادئة في `--dtmf-sequence` إذا كان Meet يجيب ببطء، مثل
  `wwww123456#`.
- إذا انضم المشارك لكنك لا تسمع التحية، فتحقق من `openclaw logs --follow` بحثًا
  عن TwiML الفوري، وبدء تشغيل الجسر الفوري، و`initialGreeting=queued`. تُنشأ
  التحية من رسالة `voicecall.start` الأولية بعد اتصال الجسر الفوري.

إذا لم تصل webhooks، فصحح أولًا أخطاء Voice Call Plugin: يجب أن يصل الموفر إلى
`plugins.entries.voice-call.config.publicUrl` أو النفق المكوّن.
راجع [استكشاف أخطاء المكالمات الصوتية وإصلاحها](/ar/plugins/voice-call#troubleshooting).

## ملاحظات

واجهة برمجة الوسائط الرسمية في Google Meet موجهة للاستقبال، لذلك لا يزال التحدث
داخل مكالمة Meet يحتاج إلى مسار مشارك. يحافظ هذا Plugin على وضوح ذلك الحد:
يتولى Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ وتتولى Twilio مشاركة
الاتصال الهاتفي.

يحتاج وضع Chrome الفوري إلى `BlackHole 2ch` بالإضافة إلى أحد الخيارين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يمتلك OpenClaw جسر
  النموذج الفوري ويوجه الصوت بصيغة `chrome.audioFormat` بين هذين الأمرين وموفر
  الصوت الفوري المحدد. مسار Chrome الافتراضي هو 24 kHz PCM16؛ ويظل 8 kHz G.711
  mu-law متاحًا لأزواج الأوامر القديمة.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي بالكامل
  ويجب أن يخرج بعد بدء daemon الخاص به أو التحقق منه.

للحصول على صوت ثنائي الاتجاه نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة
افتراضية منفصلة أو مخطط جهاز افتراضي بنمط Loopback. يمكن لجهاز BlackHole مشترك
واحد أن يعيد صدى المشاركين الآخرين إلى المكالمة.

مع جسر Chrome القائم على زوج الأوامر، يمكن لـ `chrome.bargeInInputCommand`
الاستماع إلى ميكروفون محلي منفصل ومسح تشغيل المساعد عندما يبدأ الإنسان بالكلام.
يبقي هذا كلام الإنسان متقدمًا على خرج المساعد حتى عندما يكون إدخال BlackHole
loopback المشترك مكبوتًا مؤقتًا أثناء تشغيل المساعد. مثل
`chrome.audioInputCommand` و`chrome.audioOutputCommand`، فهو أمر محلي يكوّنه
المشغّل. استخدم مسار أمر موثوقًا وصريحًا أو قائمة وسائط، ولا توجهه إلى سكربتات
من مواقع غير موثوقة.

يشغّل `googlemeet speak` جسر الصوت الفوري النشط لجلسة Chrome. يوقف
`googlemeet leave` ذلك الجسر. بالنسبة إلى جلسات Twilio المفوضة عبر Voice Call
Plugin، ينهي `leave` أيضًا المكالمة الصوتية الأساسية. استخدم
`googlemeet end-active-conference` عندما تريد أيضًا إغلاق مؤتمر Google Meet
النشط لمساحة مدارة عبر API.

## ذات صلة

- [Voice call Plugin](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
