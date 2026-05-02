---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - تريد من وكيل OpenClaw إنشاء مكالمة Google Meet جديدة
    - تقوم بتكوين Chrome أو عقدة Chrome أو Twilio كوسيلة نقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL الصريحة لـ Meet عبر Chrome أو Twilio مع الإعدادات الافتراضية للصوت في الوقت الفعلي'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T20:50:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

دعم المشاركين في Google Meet لـ OpenClaw — يكون Plugin صريحًا حسب التصميم:

- ينضم فقط إلى عنوان URL صريح من نوع `https://meet.google.com/...`.
- يمكنه إنشاء مساحة Meet جديدة عبر Google Meet API، ثم الانضمام إلى عنوان URL
  المُعاد.
- صوت `realtime` هو الوضع الافتراضي.
- يمكن لصوت Realtime استدعاء وكيل OpenClaw الكامل عند الحاجة إلى تفكير أعمق
  أو أدوات.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `realtime` للاستماع
  المباشر/الرد الصوتي، أو `transcribe` للانضمام إلى المتصفح/التحكم به دون
  جسر الصوت الفوري.
- يبدأ التوثيق كـ Google OAuth شخصي أو ملف تعريف Chrome مُسجّل الدخول مسبقًا.
- لا يوجد إعلان موافقة تلقائي.
- واجهة الصوت الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف عقدة مقترن.
- يقبل Twilio رقم اتصال وارد مع رقم PIN أو تسلسل DTMF اختياري؛ ولا يمكنه
  الاتصال بعنوان URL لاجتماع Meet مباشرة.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لتدفقات عمل المؤتمرات
  الهاتفية الأوسع للوكيل.

## البدء السريع

ثبّت تبعيات الصوت المحلية واضبط مزود صوت فوري خلفي. OpenAI هو الافتراضي؛ كما
يعمل Google Gemini Live أيضًا مع `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

يثبّت `blackhole-2ch` جهاز الصوت الافتراضي `BlackHole 2ch`. يتطلب مثبت Homebrew
إعادة تشغيل قبل أن يعرض macOS الجهاز:

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

صُمم خرج الإعداد ليكون قابلاً للقراءة من الوكيل ومدركًا للوضع. يبلّغ عن ملف
تعريف Chrome، وتثبيت العقدة، وبالنسبة لانضمامات Chrome الفورية، عن جسر صوت
BlackHole/SoX وفحوصات المقدمة الفورية المؤجلة. بالنسبة لانضمامات المراقبة فقط،
تحقق من النقل نفسه باستخدام `--mode transcribe`؛ يتجاوز ذلك الوضع متطلبات
الصوت الفوري لأنه لا يستمع عبر الجسر ولا يتحدث عبره:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

عند ضبط تفويض Twilio، يبلّغ الإعداد أيضًا عما إذا كان Plugin `voice-call`
وبيانات اعتماد Twilio وتعريض Webhook العام جاهزة. تعامل مع أي فحص `ok: false`
كمانع للنقل والوضع اللذين تم فحصهما قبل طلب انضمام وكيل. استخدم
`openclaw googlemeet setup --json` للسكربتات أو الخرج القابل للقراءة آليًا.
استخدم `--transport chrome` أو `--transport chrome-node` أو
`--transport twilio` لإجراء فحص مسبق لنقل محدد قبل أن يجربه الوكيل.

بالنسبة إلى Twilio، أجرِ دائمًا فحصًا مسبقًا صريحًا للنقل عندما يكون النقل
الافتراضي هو Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

يلتقط ذلك نقص توصيل `voice-call` أو بيانات اعتماد Twilio أو تعريض Webhook غير
القابل للوصول قبل أن يحاول الوكيل الاتصال بالاجتماع.

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
  "mode": "realtime"
}
```

تظل أداة `google_meet` الموجهة للوكيل متاحة على المضيفات غير macOS لتدفقات
الأثر، والتقويم، والإعداد، والنسخ، وTwilio، و`chrome-node`. تُحظر إجراءات
Chrome الفورية المحلية هناك لأن مسار صوت Chrome الفوري المضمن يعتمد حاليًا على
`BlackHole 2ch` في macOS. على Linux، استخدم `mode: "transcribe"`، أو الاتصال
الوارد عبر Twilio، أو مضيف `chrome-node` يعمل على macOS للمشاركة الفورية عبر
Chrome.

أنشئ اجتماعًا جديدًا وانضم إليه:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

للغرف المنشأة عبر API، استخدم Google Meet `SpaceConfig.accessType` عندما تريد
أن تكون سياسة الغرفة التي لا تتطلب طلب دخول صريحة بدلًا من أن تكون موروثة من
إعدادات حساب Google الافتراضية:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

يسمح `OPEN` لأي شخص لديه عنوان URL الخاص بـ Meet بالانضمام دون طلب دخول. يسمح
`TRUSTED` للمستخدمين الموثوقين في مؤسسة المضيف، والمستخدمين الخارجيين المدعوين،
ومستخدمي الاتصال الهاتفي بالانضمام دون طلب دخول. يقيّد `RESTRICTED` الدخول دون
طلب دخول على المدعوين. لا تنطبق هذه الإعدادات إلا على مسار الإنشاء الرسمي عبر
Google Meet API، لذلك يجب ضبط بيانات اعتماد OAuth.

إذا وثّقت Google Meet قبل أن يصبح هذا الخيار متاحًا، فأعد تشغيل
`openclaw googlemeet auth login --json` بعد إضافة نطاق
`meetings.space.settings` إلى شاشة موافقة Google OAuth الخاصة بك.

أنشئ عنوان URL فقط دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

يملك `googlemeet create` مسارين:

- الإنشاء عبر API: يُستخدم عند ضبط بيانات اعتماد Google Meet OAuth. هذا هو
  المسار الأكثر حتمية ولا يعتمد على حالة واجهة المتصفح.
- الرجوع إلى المتصفح: يُستخدم عند غياب بيانات اعتماد OAuth. يستخدم OpenClaw
  عقدة Chrome المثبتة، ويفتح `https://meet.google.com/new`، وينتظر أن يعيد
  Google التوجيه إلى عنوان URL حقيقي برمز اجتماع، ثم يعيد ذلك العنوان. يتطلب
  هذا المسار أن يكون ملف تعريف OpenClaw Chrome على العقدة مسجّل الدخول مسبقًا
  إلى Google. تتعامل أتمتة المتصفح مع مطالبة الميكروفون الأولى الخاصة بـ Meet؛
  ولا تُعامل تلك المطالبة كفشل تسجيل دخول إلى Google.
  تحاول تدفقات الانضمام والإنشاء أيضًا إعادة استخدام تبويب Meet موجود قبل فتح
  تبويب جديد. تتجاهل المطابقة سلاسل استعلام URL غير الضارة مثل `authuser`، لذا
  ينبغي لمحاولة الوكيل اللاحقة التركيز على الاجتماع المفتوح بالفعل بدلًا من
  إنشاء تبويب Chrome ثانٍ.

يتضمن خرج الأمر/الأداة حقل `source` (`api` أو `browser`) حتى تتمكن الوكلاء من
شرح المسار المستخدم. ينضم `create` إلى الاجتماع الجديد افتراضيًا ويعيد
`joined: true` بالإضافة إلى جلسة الانضمام. لإنشاء عنوان URL فقط، استخدم
`create --no-join` في CLI أو مرّر `"join": false` إلى الأداة.

أو أخبر وكيلًا: "أنشئ Google Meet، وانضم إليه بصوت فوري، وأرسل لي الرابط."
ينبغي للوكيل استدعاء `google_meet` مع `action: "create"` ثم مشاركة
`meetingUri` المُعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

لانضمام مراقبة فقط/تحكم بالمتصفح، اضبط `"mode": "transcribe"`. لا يبدأ ذلك
جسر نموذج الصوت الفوري ثنائي الاتجاه، ولا يتطلب BlackHole أو SoX، ولن يرد
صوتيًا داخل الاجتماع. كما تتجنب انضمامات Chrome في هذا الوضع منح إذن
الميكروفون/الكاميرا من OpenClaw وتتجنب مسار Meet **استخدام الميكروفون**. إذا
عرض Meet شاشة وسيطة لاختيار الصوت، تحاول الأتمتة مسار عدم استخدام الميكروفون
وإلا فستبلّغ عن إجراء يدوي بدلًا من فتح الميكروفون المحلي. في وضع النسخ، تثبت
عمليات نقل Chrome المُدارة أيضًا مراقب تسميات توضيحية لـ Meet على أساس أفضل
جهد. يعرض `googlemeet status --json` و`googlemeet doctor` حقول `captioning`،
و`captionsEnabledAttempted`، و`transcriptLines`، و`lastCaptionAt`،
و`lastCaptionSpeaker`، و`lastCaptionText`، وذيل `recentTranscript` قصيرًا حتى
يستطيع المشغلون معرفة ما إذا كان المتصفح قد انضم إلى المكالمة وما إذا كانت
تسميات Meet التوضيحية تنتج نصًا.
استخدم `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
عندما تحتاج إلى فحص نعم/لا: ينضم في وضع النسخ، وينتظر حركة جديدة في التسمية
التوضيحية أو النص المنسوخ، ويعيد `listenVerified`، و`listenTimedOut`، وحقول
الإجراء اليدوي، وأحدث حالة لصحة التسمية التوضيحية.

أثناء الجلسات الفورية، تتضمن حالة `google_meet` صحة المتصفح وجسر الصوت مثل
`inCall`، و`manualActionRequired`، و`providerConnected`، و`realtimeReady`،
و`audioInputActive`، و`audioOutputActive`، والطوابع الزمنية لآخر إدخال/إخراج،
وعدادات البايت، وحالة إغلاق الجسر. إذا ظهرت مطالبة آمنة في صفحة Meet، تتعامل
أتمتة المتصفح معها عندما تستطيع. يتم الإبلاغ عن تسجيل الدخول، وقبول المضيف،
ومطالبات أذونات المتصفح/نظام التشغيل كإجراء يدوي مع سبب ورسالة لكي ينقلها
الوكيل. لا تصدر جلسات Chrome المُدارة عبارة المقدمة أو الاختبار إلا بعد أن
تبلّغ صحة المتصفح `inCall: true`؛ وإلا فتبلّغ الحالة `speechReady: false` ويتم
حظر محاولة الكلام بدلًا من التظاهر بأن الوكيل تحدث داخل الاجتماع.

تنضم عمليات Chrome المحلية عبر ملف تعريف متصفح OpenClaw المُسجّل الدخول. يتطلب
وضع Realtime وجود `BlackHole 2ch` لمسار الميكروفون/السماعة الذي يستخدمه
OpenClaw. للحصول على صوت ثنائي الاتجاه نظيف، استخدم أجهزة افتراضية منفصلة أو
رسمًا بيانيًا بنمط Loopback؛ جهاز BlackHole واحد يكفي لاختبار دخان أولي لكنه
قد يسبب صدى.

### Gateway المحلي + Chrome عبر Parallels

لا تحتاج إلى OpenClaw Gateway كامل أو مفتاح API للنموذج داخل VM يعمل بنظام
macOS لمجرد جعل VM يملك Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل مضيف عقدة
داخل VM. فعّل Plugin المضمن على VM مرة واحدة حتى تعلن العقدة عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API،
  ومزود الوقت الفوري، وإعدادات Plugin الخاص بـ Google Meet.
- Parallels macOS VM: OpenClaw CLI/مضيف العقدة، وGoogle Chrome، وSoX،
  وBlackHole 2ch، وملف تعريف Chrome مسجّل الدخول إلى Google.
- غير مطلوب في VM: خدمة Gateway، أو إعدادات الوكيل، أو مفتاح OpenAI/GPT، أو
  إعداد مزود النموذج.

ثبّت تبعيات VM:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل VM بعد تثبيت BlackHole حتى يعرض macOS جهاز `BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقق من أن VM يمكنه رؤية جهاز الصوت وأوامر SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ثبّت OpenClaw أو حدّثه في VM، ثم فعّل Plugin المضمن هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ مضيف العقدة في VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على LAN ولا تستخدم TLS، فسترفض العقدة
WebSocket غير المشفر ما لم تختَر الاشتراك لتلك الشبكة الخاصة الموثوقة:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

استخدم متغير البيئة نفسه عند تثبيت العقدة كـ LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو بيئة عملية، وليس إعدادًا في
`openclaw.json`. يخزّنه `openclaw node install` في بيئة LaunchAgent عندما يكون
موجودًا في أمر التثبيت.

وافق على العقدة من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأكد من أن Gateway يرى العقدة وأنها تعلن عن كل من `googlemeet.chrome` وقدرة
المتصفح/`browser.proxy`:

```bash
openclaw nodes status
```

وجّه Meet عبر تلك العقدة على مضيف Gateway:

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

الآن انضم بالطريقة المعتادة من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اطلب من الوكيل استخدام أداة `google_meet` مع `transport: "chrome-node"`.

لاختبار دخان بأمر واحد ينشئ جلسة أو يعيد استخدامها، وينطق عبارة معروفة، ويطبع
صحة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام في الوقت الفعلي، تملأ أتمتة المتصفح في OpenClaw اسم الضيف، وتنقر على
Join/Ask to join، وتقبل خيار "Use microphone" في التشغيل الأول من Meet عند ظهور
ذلك الموجه. أثناء الانضمام للمشاهدة فقط أو إنشاء اجتماع عبر المتصفح فقط، تتابع
بعد الموجه نفسه دون ميكروفون عندما يكون ذلك الخيار متاحا.
إذا لم يكن ملف تعريف المتصفح مسجل الدخول، أو كان Meet ينتظر قبول المضيف،
أو كان Chrome يحتاج إلى إذن الميكروفون/الكاميرا للانضمام في الوقت الفعلي، أو كان Meet عالقا
عند موجه لم تتمكن الأتمتة من حله، فإن نتيجة الانضمام/اختبار الكلام تبلغ عن
`manualActionRequired: true` مع `manualActionReason` و
`manualActionMessage`. يجب على الوكلاء إيقاف إعادة محاولة الانضمام، والإبلاغ عن تلك
الرسالة الدقيقة مع `browserUrl`/`browserTitle` الحاليين، وإعادة المحاولة فقط بعد
اكتمال إجراء المتصفح اليدوي.

إذا تم حذف `chromeNode.node`، فإن OpenClaw يختار تلقائيا فقط عندما تعلن عقدة
واحدة متصلة بالضبط عن كل من `googlemeet.chrome` والتحكم في المتصفح. إذا
كانت عدة عقد قادرة متصلة، فعيّن `chromeNode.node` إلى معرف العقدة،
أو اسم العرض، أو عنوان IP البعيد.

فحوصات الفشل الشائعة:

- `Configured Google Meet node ... is not usable: offline`: العقدة المثبتة
  معروفة لدى Gateway لكنها غير متاحة. يجب أن يتعامل الوكلاء مع تلك العقدة كحالة
  تشخيصية، لا كمضيف Chrome قابل للاستخدام، وأن يبلغوا عن عائق الإعداد
  بدلا من الرجوع إلى نقل آخر ما لم يطلب المستخدم ذلك.
- `No connected Google Meet-capable node`: شغّل `openclaw node run` في VM،
  ووافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` في VM. تأكد أيضا من أن مضيف
  Gateway يسمح بأمري العقدة كليهما باستخدام
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: ثبّت `blackhole-2ch` على المضيف
  الذي يتم فحصه وأعد التشغيل قبل استخدام صوت Chrome المحلي.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في VM وأعد تشغيل VM.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف تعريف المتصفح داخل VM، أو
  أبق `chrome.guestName` مضبوطا لانضمام الضيف. يستخدم الانضمام التلقائي للضيف أتمتة
  متصفح OpenClaw عبر وكيل متصفح العقدة؛ تأكد من أن إعدادات متصفح العقدة
  تشير إلى ملف التعريف الذي تريده، على سبيل المثال
  `browser.defaultProfile: "user"` أو ملف تعريف جلسة موجودة مسمى.
- علامات تبويب Meet مكررة: اترك `chrome.reuseExistingTab: true` مفعلا. يفعّل OpenClaw
  علامة تبويب موجودة لعنوان URL نفسه في Meet قبل فتح علامة جديدة، كما أن
  إنشاء الاجتماع عبر المتصفح يعيد استخدام علامة تبويب `https://meet.google.com/new`
  قيد التقدم أو علامة موجه حساب Google قبل فتح أخرى.
- لا يوجد صوت: في Meet، وجّه صوت الميكروفون/السماعة عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيها بأسلوب Loopback
  للحصول على صوت مزدوج نظيف.

## ملاحظات التثبيت

يستخدم الإعداد الافتراضي للوقت الفعلي في Chrome أداتين خارجيتين:

- `sox`: أداة صوت عبر سطر الأوامر. يستخدم Plugin أوامر أجهزة CoreAudio
  صريحة لجسر الصوت الافتراضي 24 kHz PCM16.
- `blackhole-2ch`: مشغل صوت افتراضي لـ macOS. ينشئ جهاز الصوت `BlackHole 2ch`
  الذي يستطيع Chrome/Meet التوجيه عبره.

لا يضمّن OpenClaw أيا من الحزمتين ولا يعيد توزيعهما. تطلب الوثائق من المستخدمين
تثبيتهما كاعتماديات مضيف عبر Homebrew. SoX مرخص كـ
`LGPL-2.0-only AND GPL-2.0-only`؛ وBlackHole مرخص بـ GPL-3.0. إذا كنت تبني
مثبتا أو جهازا يضمّن BlackHole مع OpenClaw، فراجع شروط ترخيص BlackHole
الأصلية أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

يفتح نقل Chrome عنوان URL الخاص بـ Meet عبر تحكم متصفح OpenClaw وينضم
بصفته ملف تعريف متصفح OpenClaw المسجل الدخول. على macOS، يتحقق Plugin من وجود
`BlackHole 2ch` قبل التشغيل. إذا تم تكوينه، يشغّل أيضا أمر صحة جسر الصوت
وأمر بدء التشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت
على مضيف Gateway؛ واستخدم `chrome-node` عندما يكون Chrome/الصوت على عقدة
مقترنة مثل VM يعمل بنظام macOS عبر Parallels. بالنسبة إلى Chrome المحلي، اختر
ملف التعريف باستخدام `browser.defaultProfile`؛ ويتم تمرير `chrome.browserProfile`
إلى مضيفي `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون Chrome وسماعته عبر جسر صوت OpenClaw المحلي.
إذا لم يكن `BlackHole 2ch` مثبتا، يفشل الانضمام بخطأ إعداد
بدلا من الانضمام بصمت دون مسار صوت.

### Twilio

نقل Twilio هو خطة اتصال صارمة مفوضة إلى Plugin Voice Call. وهو
لا يحلل صفحات Meet لاستخراج أرقام الهاتف.

استخدم هذا عندما لا تكون مشاركة Chrome متاحة أو عندما تريد بديلا للاتصال الهاتفي.
يجب أن يعرض Google Meet رقم اتصال هاتفي ورمز PIN للاجتماع؛ ولا يكتشف OpenClaw
هذه من صفحة Meet.

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

قدّم بيانات اعتماد Twilio عبر البيئة أو الإعدادات. تبقي البيئة
الأسرار خارج `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

أعد تشغيل Gateway أو أعد تحميله بعد تفعيل `voice-call`؛ لا تظهر تغييرات إعدادات Plugin
في عملية Gateway قيد التشغيل بالفعل حتى يعيد التحميل.

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

## OAuth والفحص المسبق

OAuth اختياري لإنشاء رابط Meet لأن `googlemeet create` يمكنه الرجوع
إلى أتمتة المتصفح. كوّن OAuth عندما تريد الإنشاء عبر API الرسمية،
أو حل المساحات، أو فحوصات Meet Media API المسبقة.

يستخدم وصول Google Meet API OAuth للمستخدم: أنشئ عميلا لـ Google Cloud OAuth،
واطلب النطاقات المطلوبة، وفوض حساب Google، ثم خزّن
رمز التحديث الناتج في إعدادات Plugin Google Meet أو وفر
متغيرات البيئة `OPENCLAW_GOOGLE_MEET_*`.

لا يستبدل OAuth مسار انضمام Chrome. لا تزال وسائل نقل Chrome وChrome-node
تنضم عبر ملف تعريف Chrome مسجل الدخول، وBlackHole/SoX، وعقدة متصلة
عندما تستخدم مشاركة المتصفح. OAuth مخصص فقط لمسار Google Meet API الرسمي:
إنشاء مساحات الاجتماعات، وحل المساحات، وتشغيل فحوصات Meet Media API المسبقة.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو حدده.
2. فعّل **Google Meet REST API** لذلك المشروع.
3. كوّن شاشة موافقة OAuth.
   - **Internal** هو الأبسط لمؤسسة Google Workspace.
   - **External** يعمل للإعدادات الشخصية/الاختبارية؛ أثناء وجود التطبيق في Testing،
     أضف كل حساب Google سيفوض التطبيق كمستخدم اختبار.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرف عميل OAuth.
   - نوع التطبيق: **Web application**.
   - عنوان URI المعاد توجيهه المصرح به:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرف العميل وسر العميل.

`meetings.space.created` مطلوب من Google Meet `spaces.create`.
يسمح `meetings.space.readonly` لـ OpenClaw بحل عناوين URL/رموز Meet إلى مساحات.
يسمح `meetings.space.settings` لـ OpenClaw بتمرير إعدادات `SpaceConfig` مثل
`accessType` أثناء إنشاء غرفة عبر API.
`meetings.conference.media.readonly` مخصص لفحص Meet Media API المسبق والعمل
الإعلامي؛ وقد تطلب Google التسجيل في Developer Preview لاستخدام Media API الفعلي.
إذا كنت تحتاج فقط إلى انضمامات Chrome المستندة إلى المتصفح، فتجاوز OAuth بالكامل.

### إصدار رمز التحديث

كوّن `oauth.clientId` واختياريا `oauth.clientSecret`، أو مررهما كمتغيرات
بيئة، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعدادات `oauth` مع رمز تحديث. يستخدم PKCE،
واستدعاء localhost على `http://localhost:8085/oauth2callback`، وتدفق
نسخ/لصق يدوي باستخدام `--manual`.

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
إذا كانت قيم الإعدادات والبيئة موجودة معا، فإن Plugin يحل الإعدادات
أولا ثم يعود إلى البيئة كبديل.

تتضمن موافقة OAuth إنشاء مساحة Meet، ووصول قراءة مساحة Meet، ووصول قراءة
وسائط مؤتمر Meet. إذا قمت بالمصادقة قبل وجود دعم إنشاء الاجتماعات،
فأعد تشغيل `openclaw googlemeet auth login --json` بحيث يحتوي رمز التحديث
على نطاق `meetings.space.created`.

### التحقق من OAuth باستخدام doctor

شغّل doctor الخاص بـ OAuth عندما تريد فحص صحة سريع لا يتضمن أسرارا:

```bash
openclaw googlemeet doctor --oauth --json
```

هذا لا يحمّل وقت تشغيل Chrome ولا يتطلب عقدة Chrome متصلة. إنه
يتحقق من وجود إعدادات OAuth وأن رمز التحديث يستطيع إصدار رمز وصول.
يتضمن تقرير JSON حقول حالة فقط مثل `ok` و`configured` و
`tokenSource` و`expiresAt` ورسائل الفحص؛ ولا يطبع رمز الوصول
أو رمز التحديث أو سر العميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | يوجد `oauth.clientId` مع `oauth.refreshToken`، أو رمز وصول مخزن مؤقتا.       |
| `oauth-token`        | رمز الوصول المخزن مؤقتا لا يزال صالحا، أو أصدر رمز التحديث رمز وصول جديدا. |
| `meet-spaces-get`    | حل فحص `--meeting` الاختياري مساحة Meet موجودة.                             |
| `meet-spaces-create` | أنشأ فحص `--create-space` الاختياري مساحة Meet جديدة.                               |

لإثبات تفعيل Google Meet API ونطاق `spaces.create` أيضا، شغّل
فحص الإنشاء ذي الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

ينشئ `--create-space` عنوان URL مؤقتًا لـ Meet. استخدمه عندما تحتاج إلى التأكد
من أن مشروع Google Cloud فعّل Meet API وأن الحساب المصرح له لديه النطاق
`meetings.space.created`.

لإثبات صلاحية القراءة لمساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` صلاحية القراءة لمساحة موجودة
يمكن لحساب Google المصرح له الوصول إليها. تعني استجابة `403` من هذه الفحوصات
عادة أن Google Meet REST API معطلة، أو أن رمز التحديث الموافق عليه يفتقد النطاق
المطلوب، أو أن حساب Google لا يستطيع الوصول إلى مساحة Meet هذه. يعني خطأ رمز
التحديث إعادة تشغيل `openclaw googlemeet auth login --json` وتخزين كتلة
`oauth` الجديدة.

لا توجد حاجة إلى بيانات اعتماد OAuth للرجوع إلى المتصفح. في هذا الوضع، تأتي
مصادقة Google من ملف Chrome الشخصي المسجل الدخول على Node المحدد، وليس من
إعدادات OpenClaw.

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

شغّل الفحص التمهيدي قبل أعمال الوسائط:

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
مرر `--all-conference-records` عندما تريد كل سجل محتفظ به لذلك الاجتماع.

يمكن للبحث في التقويم حل عنوان URL للاجتماع من Google Calendar قبل قراءة عناصر
Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` لليوم عن حدث Calendar يحتوي على رابط
Google Meet. استخدم `--event <query>` للبحث في نص حدث مطابق، و`--calendar <id>`
لتقويم غير أساسي. يتطلب البحث في التقويم تسجيل دخول OAuth حديثًا يتضمن نطاق
القراءة فقط لأحداث Calendar. يعاين `calendar-events` أحداث Meet المطابقة ويحدد
الحدث الذي سيختاره `latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف بالفعل معرف سجل المؤتمر، فخاطبه مباشرة:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

أنهِ مؤتمرًا نشطًا لمساحة أُنشئت عبر API عندما تريد إغلاق الغرفة بعد المكالمة:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

يستدعي هذا Google Meet `spaces.endActiveConference` ويتطلب OAuth مع نطاق
`meetings.space.created` لمساحة يمكن للحساب المصرح له إدارتها. يقبل OpenClaw
إدخال عنوان URL لـ Meet أو رمز اجتماع أو `spaces/{id}` ويحلّه إلى مورد مساحة
API قبل إنهاء المؤتمر النشط. وهو منفصل عن `googlemeet leave`: يوقف `leave`
مشاركة OpenClaw المحلية/مشاركة الجلسة، بينما يطلب `end-active-conference` من
Google Meet إنهاء المؤتمر النشط للمساحة.

اكتب تقريرًا قابلًا للقراءة:

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

يعيد `artifacts` بيانات تعريف سجل المؤتمر بالإضافة إلى بيانات تعريف موارد
المشارك والتسجيل والنص المنسوخ وإدخال النص المنسوخ المهيكل والملاحظات الذكية
عندما تتيحها Google للاجتماع. استخدم `--no-transcript-entries` لتخطي البحث عن
الإدخالات للاجتماعات الكبيرة. يوسّع `attendance` المشاركين إلى صفوف جلسات
مشاركين مع أوقات أول/آخر ظهور، وإجمالي مدة الجلسة، وعلامات التأخر/المغادرة
المبكرة، وموارد المشاركين المكررة مدمجة حسب المستخدم المسجل الدخول أو اسم
العرض. مرر `--no-merge-duplicates` لإبقاء موارد المشاركين الخام منفصلة،
و`--late-after-minutes` لضبط اكتشاف التأخر، و`--early-before-minutes` لضبط
اكتشاف المغادرة المبكرة.

يكتب `export` مجلدًا يحتوي على `summary.md` و`attendance.csv` و`transcript.md`
و`artifacts.json` و`attendance.json` و`manifest.json`. يسجل `manifest.json`
الإدخال المختار، وخيارات التصدير، وسجلات المؤتمر، وملفات الإخراج، والأعداد،
ومصدر الرمز، وحدث Calendar عند استخدام واحد، وأي تحذيرات استرجاع جزئية. مرر
`--zip` لكتابة أرشيف محمول أيضًا بجانب المجلد. مرر `--include-doc-bodies`
لتصدير نص Google Docs المرتبط للنصوص المنسوخة والملاحظات الذكية عبر Google
Drive `files.export`؛ يتطلب هذا تسجيل دخول OAuth حديثًا يتضمن نطاق القراءة فقط
لـ Drive Meet. بدون `--include-doc-bodies`، تتضمن عمليات التصدير بيانات تعريف
Meet وإدخالات النص المنسوخ المهيكلة فقط. إذا أعادت Google فشلًا جزئيًا في عنصر،
مثل خطأ في سرد الملاحظات الذكية أو إدخال النص المنسوخ أو جسم مستند Drive، يحتفظ
الملخص والبيان بالتحذير بدلًا من إفشال التصدير كله. استخدم `--dry-run` لجلب
بيانات العناصر/الحضور نفسها وطباعة JSON الخاص بالبيان دون إنشاء المجلد أو ZIP.
هذا مفيد قبل كتابة تصدير كبير أو عندما يحتاج وكيل إلى الأعداد والسجلات المحددة
والتحذيرات فقط.

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

للتحقق بالاستماع أولًا، ينبغي للوكلاء استخدام `test_listen` قبل الادعاء بأن
الاجتماع مفيد:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

شغّل اختبار الدخان الحي المحروس على اجتماع حقيقي محتفظ به:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

شغّل فحص المتصفح الحي بالاستماع أولًا على اجتماع سيتحدث فيه شخص مع توفر تسميات
Meet التوضيحية:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

بيئة اختبار الدخان الحي:

- يمكّن `OPENCLAW_LIVE_TEST=1` الاختبارات الحية المحروسة.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL لـ Meet محتفظ به، أو
  رمز، أو `spaces/{id}`.
- يوفر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرف عميل
  OAuth.
- يوفر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN` رمز
  التحديث.
- اختياري: تستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء الخيارات الاحتياطية نفسها
  بدون بادئة `OPENCLAW_`.

يحتاج اختبار الدخان الحي الأساسي للعناصر/الحضور إلى
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. يحتاج البحث
في التقويم إلى `https://www.googleapis.com/auth/calendar.events.readonly`. يحتاج
تصدير جسم المستند عبر Drive إلى
`https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد والمصدر وجلسة الانضمام. مع بيانات اعتماد OAuth
يستخدم Google Meet API الرسمي. بدون بيانات اعتماد OAuth، يستخدم ملف المتصفح
الشخصي المسجل الدخول في Node المثبتة لـ Chrome كخيار احتياطي. يمكن للوكلاء
استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في خطوة
واحدة. للإنشاء بعنوان URL فقط، مرر `"join": false`.

مثال على إخراج JSON من خيار المتصفح الاحتياطي:

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

إذا واجه خيار المتصفح الاحتياطي تسجيل دخول Google أو مانع صلاحيات Meet قبل أن
يتمكن من إنشاء عنوان URL، فإن طريقة Gateway تعيد استجابة فاشلة وتعيد أداة
`google_meet` تفاصيل مهيكلة بدلًا من سلسلة نصية عادية:

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

عندما يرى الوكيل `manualActionRequired: true`، ينبغي أن يبلغ عن
`manualActionMessage` بالإضافة إلى سياق Node/علامة تبويب المتصفح ويتوقف عن فتح
علامات تبويب Meet جديدة حتى يكمل المشغل خطوة المتصفح.

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

ينضم إنشاء Meet افتراضيًا. ما يزال نقل Chrome أو Chrome-node يحتاج إلى ملف
Google Chrome الشخصي مسجل الدخول للانضمام عبر المتصفح. إذا كان الملف الشخصي
مسجل الخروج، يبلغ OpenClaw عن `manualActionRequired: true` أو خطأ في خيار
المتصفح الاحتياطي ويطلب من المشغل إكمال تسجيل دخول Google قبل إعادة المحاولة.

عيّن `preview.enrollmentAcknowledged: true` فقط بعد تأكيد أن مشروع Cloud الخاص
بك، وكيان OAuth الأساسي، والمشاركين في الاجتماع مسجلون في Google Workspace
Developer Preview Program لواجهات Meet media APIs.

## الإعدادات

لا يحتاج مسار Chrome الفوري الشائع إلا إلى تفعيل Plugin وBlackHole وSoX ومفتاح
مزود صوت فوري في الخلفية. OpenAI هو الافتراضي؛ عيّن
`realtime.provider: "google"` لاستخدام Google Gemini Live:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: معرّف/اسم/IP اختياري للعقدة من أجل `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم على شاشة ضيف Meet غير المسجّل دخوله
- `chrome.autoJoin: true`: محاولة بأفضل جهد لملء اسم الضيف والنقر على Join Now عبر أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تنشيط تبويب Meet موجود بدلاً من فتح نسخ مكررة
- `chrome.waitForInCallMs: 20000`: الانتظار حتى يبلّغ تبويب Meet أنه داخل المكالمة قبل تشغيل مقدمة الوقت الفعلي
- `chrome.audioFormat: "pcm16-24khz"`: تنسيق صوت زوج الأوامر. استخدم `"g711-ulaw-8khz"` فقط لأزواج الأوامر القديمة/المخصصة التي لا تزال تصدر صوت الهاتف.
- `chrome.audioInputCommand`: أمر SoX يقرأ من CoreAudio `BlackHole 2ch` ويكتب الصوت بتنسيق `chrome.audioFormat`
- `chrome.audioOutputCommand`: أمر SoX يقرأ الصوت بتنسيق `chrome.audioFormat` ويكتب إلى CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: أمر ميكروفون محلي اختياري يكتب PCM أحادي القناة موقّعًا 16-بت بنمط little-endian لاكتشاف مقاطعة الإنسان أثناء تفعيل تشغيل المساعد. ينطبق هذا حاليًا على جسر زوج الأوامر `chrome` المستضاف على Gateway.
- `chrome.bargeInRmsThreshold: 650`: مستوى RMS الذي يُعد مقاطعة بشرية على `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: مستوى الذروة الذي يُعد مقاطعة بشرية على `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: أقل تأخير بين عمليات مسح المقاطعات البشرية المتكررة
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة موجزة، مع `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية منطوق قصير عند اتصال جسر الوقت الفعلي؛ عيّنه إلى `""` للانضمام بصمت
- `realtime.agentId`: معرّف عميل OpenClaw اختياري لـ `openclaw_agent_consult`؛ القيمة الافتراضية هي `main`

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

القيمة الافتراضية لـ `voiceCall.enabled` هي `true`؛ ومع نقل Twilio، يفوض مكالمة PSTN الفعلية وDTMF وتحية المقدمة إلى Plugin Voice Call. يشغّل Voice Call تسلسل DTMF قبل فتح دفق وسائط الوقت الفعلي، ثم يستخدم نص المقدمة المحفوظ كتحية الوقت الفعلي الأولية. إذا لم يكن `voice-call` مفعّلًا، فيمكن لـ Google Meet مع ذلك التحقق من خطة الاتصال وتسجيلها، لكنه لا يستطيع إجراء مكالمة Twilio.

## الأداة

يمكن للعملاء استخدام أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

استخدم `transport: "chrome"` عندما يعمل Chrome على مضيف Gateway. استخدم `transport: "chrome-node"` عندما يعمل Chrome على عقدة مقترنة مثل VM من Parallels. في كلتا الحالتين، يعمل نموذج الوقت الفعلي و`openclaw_agent_consult` على مضيف Gateway، لذا تبقى بيانات اعتماد النموذج هناك.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. استخدم `action: "speak"` مع `sessionId` و`message` لجعل عميل الوقت الفعلي يتحدث فورًا. استخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها، وتشغيل عبارة معروفة، وإرجاع صحة `inCall` عندما يستطيع مضيف Chrome الإبلاغ عنها. يفرض `test_speech` دائمًا `mode: "realtime"` ويفشل إذا طُلب منه التشغيل في `mode: "transcribe"` لأن جلسات المراقبة فقط لا يمكنها عمدًا إصدار الكلام. تستند نتيجة `speechOutputVerified` إلى زيادة بايتات خرج صوت الوقت الفعلي أثناء استدعاء الاختبار هذا، لذلك لا تُحسب الجلسة المعاد استخدامها ذات الصوت الأقدم كفحص كلام ناجح جديد. استخدم `action: "leave"` لوضع علامة على انتهاء جلسة.

يتضمن `status` صحة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج ملف تعريف المتصفح إلى تسجيل دخول يدوي، أو قبول من مضيف Meet، أو أذونات، أو إصلاح للتحكم في المتصفح قبل أن يعمل الكلام
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ما إذا كان كلام Chrome المُدار مسموحًا به الآن. تعني `speechReady: false` أن OpenClaw لم يرسل عبارة المقدمة/الاختبار إلى جسر الصوت.
- `providerConnected` / `realtimeReady`: حالة جسر صوت الوقت الفعلي
- `lastInputAt` / `lastOutputAt`: آخر صوت شوهد من الجسر أو أُرسل إليه
- `lastSuppressedInputAt` / `suppressedInputBytes`: دخل local loopback تم تجاهله أثناء تفعيل تشغيل المساعد

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## استشارة عميل الوقت الفعلي

وضع الوقت الفعلي في Chrome محسّن لحلقة صوتية مباشرة. يسمع مزود صوت الوقت الفعلي صوت الاجتماع ويتحدث عبر جسر الصوت المكوّن. عندما يحتاج نموذج الوقت الفعلي إلى استدلال أعمق، أو معلومات حديثة، أو أدوات OpenClaw العادية، يمكنه استدعاء `openclaw_agent_consult`.

تعمل أداة الاستشارة على تشغيل عميل OpenClaw العادي خلف الكواليس مع سياق نص اجتماع حديث، وتعيد إجابة منطوقة موجزة إلى جلسة صوت الوقت الفعلي. يمكن لنموذج الصوت بعد ذلك نطق تلك الإجابة داخل الاجتماع. تستخدم أداة استشارة الوقت الفعلي المشتركة نفسها مثل Voice Call.

افتراضيًا، تعمل الاستشارات على العميل `main`. عيّن `realtime.agentId` عندما ينبغي لمسار Meet أن يستشير مساحة عمل مخصصة لعميل OpenClaw، وافتراضات النموذج، وسياسة الأدوات، والذاكرة، وسجل الجلسة.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: كشف أداة الاستشارة وقصر العميل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`.
- `owner`: كشف أداة الاستشارة والسماح للعميل العادي باستخدام سياسة أدوات العميل العادية.
- `none`: عدم كشف أداة الاستشارة لنموذج صوت الوقت الفعلي.

يكون مفتاح جلسة الاستشارة مقيّدًا بكل جلسة Meet، لذا يمكن لاستدعاءات الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد أن ينضم Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

لاختبار الانضمام والتحدث الكامل:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## قائمة فحص الاختبار المباشر

استخدم هذا التسلسل قبل تسليم اجتماع إلى عميل غير مراقب:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

حالة Chrome-node المتوقعة:

- `googlemeet setup` كله أخضر.
- يتضمن `googlemeet setup` قيمة `chrome-node-connected` عندما يكون Chrome-node هو النقل الافتراضي أو عندما تكون عقدة مثبتة.
- يعرض `nodes status` العقدة المحددة متصلة.
- تعلن العقدة المحددة عن كل من `googlemeet.chrome` و`browser.proxy`.
- ينضم تبويب Meet إلى المكالمة ويعيد `test-speech` صحة Chrome مع `inCall: true`.

بالنسبة إلى مضيف Chrome بعيد مثل VM بنظام macOS من Parallels، فهذا أقصر فحص آمن بعد تحديث Gateway أو VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن Plugin Gateway محمّل، وأن عقدة VM متصلة بالرمز الحالي، وأن جسر صوت Meet متاح قبل أن يفتح عميل تبويب اجتماع حقيقي.

لاختبار Twilio، استخدم اجتماعًا يعرض تفاصيل الاتصال الهاتفي:

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
- يعرض `openclaw logs --follow` تقديم DTMF TwiML قبل TwiML الوقت الفعلي، ثم جسر وقت فعلي مع تحية أولية في قائمة الانتظار.
- يؤدي `googlemeet leave <sessionId>` إلى إنهاء مكالمة الصوت المفوضة.

## استكشاف الأخطاء وإصلاحها

### لا يستطيع العميل رؤية أداة Google Meet

تأكد من أن Plugin مفعّل في إعدادات Gateway وأعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد حررت للتو `plugins.entries.google-meet`، فأعد تشغيل Gateway أو أعد تحميله. لا يرى العميل العامل إلا أدوات Plugin المسجلة بواسطة عملية Gateway الحالية.

على مضيفي Gateway غير macOS، تبقى أداة `google_meet` المواجهة للعميل مرئية، لكن إجراءات الوقت الفعلي لـ Chrome المحلي تُحظر قبل أن تصل إلى جسر الصوت. يعتمد صوت الوقت الفعلي لـ Chrome المحلي حاليًا على macOS `BlackHole 2ch`، لذا ينبغي لعملاء Linux استخدام `mode: "transcribe"`، أو الاتصال الهاتفي عبر Twilio، أو مضيف `chrome-node` بنظام macOS بدل مسار الوقت الفعلي الافتراضي لـ Chrome المحلي.

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

يجب أن تكون العقدة متصلة وأن تسرد `googlemeet.chrome` إضافة إلى `browser.proxy`. يجب أن تسمح إعدادات Gateway بأوامر العقدة تلك:

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

### يفتح المتصفح لكن العميل لا يستطيع الانضمام

شغّل `googlemeet test-listen` للانضمامات المخصصة للمراقبة فقط أو `googlemeet test-speech` للانضمامات في الوقت الفعلي، ثم افحص صحة Chrome المعادة. إذا أبلغ أي فحص عن `manualActionRequired: true`، فأظهر `manualActionMessage` للمشغّل وتوقف عن إعادة المحاولة حتى يكتمل إجراء المتصفح.

الإجراءات اليدوية الشائعة:

- تسجيل الدخول إلى ملف تعريف Chrome.
- قبول الضيف من حساب مضيف Meet.
- منح أذونات ميكروفون/كاميرا Chrome عندما تظهر مطالبة الأذونات الأصلية في Chrome.
- إغلاق مربع حوار أذونات Meet العالق أو إصلاحه.

لا تبلّغ عن "not signed in" لمجرد أن Meet يعرض "Do you want people to
hear you in the meeting?" فهذا فاصل اختيار الصوت الخاص بـ Meet؛ ينقر OpenClaw على
**Use microphone** عبر أتمتة المتصفح عندما يكون ذلك متاحًا، ويواصل الانتظار حتى
حالة الاجتماع الحقيقية. بالنسبة إلى التراجع عبر المتصفح لإنشاء الاجتماع فقط، قد
ينقر OpenClaw على **Continue without microphone** لأن إنشاء عنوان URL لا يحتاج
إلى مسار الصوت الفوري.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` أولًا نقطة نهاية Google Meet API `spaces.create`
عندما تكون بيانات اعتماد OAuth مهيأة. ومن دون بيانات اعتماد OAuth يتراجع إلى
متصفح عقدة Chrome المثبّت. تحقق مما يلي:

- لإنشاء الاجتماع عبر API: تم تكوين `oauth.clientId` و`oauth.refreshToken`،
  أو توجد متغيرات البيئة المطابقة `OPENCLAW_GOOGLE_MEET_*`.
- لإنشاء الاجتماع عبر API: تم إصدار رمز التحديث بعد إضافة دعم الإنشاء.
  قد تفتقد الرموز الأقدم نطاق `meetings.space.created`؛ أعد تشغيل
  `openclaw googlemeet auth login --json` وحدّث إعدادات Plugin.
- للتراجع عبر المتصفح: يشير `defaultTransport: "chrome-node"` و
  `chromeNode.node` إلى عقدة متصلة تحتوي على `browser.proxy` و
  `googlemeet.chrome`.
- للتراجع عبر المتصفح: يكون ملف Chrome الشخصي الخاص بـ OpenClaw على تلك العقدة
  مسجل الدخول إلى Google ويمكنه فتح `https://meet.google.com/new`.
- للتراجع عبر المتصفح: تعيد المحاولات استخدام تبويب `https://meet.google.com/new`
  موجود أو تبويب مطالبة حساب Google قبل فتح تبويب جديد. إذا انتهت مهلة وكيل،
  فأعد محاولة استدعاء الأداة بدلًا من فتح تبويب Meet آخر يدويًا.
- للتراجع عبر المتصفح: إذا أرجعت الأداة `manualActionRequired: true`، فاستخدم
  القيم المرجعة `browser.nodeId` و`browser.targetId` و`browserUrl` و
  `manualActionMessage` لإرشاد المشغّل. لا تعد المحاولة في حلقة إلى أن يكتمل
  ذلك الإجراء.
- للتراجع عبر المتصفح: إذا عرض Meet الرسالة "Do you want people to hear you in the
  meeting?"، فاترك التبويب مفتوحًا. ينبغي أن ينقر OpenClaw على **Use microphone**
  أو، في تراجع الإنشاء فقط، **Continue without microphone** عبر أتمتة المتصفح
  وأن يواصل انتظار عنوان Meet URL الذي تم إنشاؤه. إذا لم يتمكن من ذلك، فينبغي أن
  يذكر الخطأ `meet-audio-choice-required`، لا `google-login-required`.

### ينضم الوكيل لكنه لا يتحدث

تحقق من المسار الفوري:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "realtime"` للاستماع والرد بالكلام. أما `mode: "transcribe"` فلا
يشغّل عمدًا جسر الصوت الفوري ثنائي الاتجاه. لتصحيح أخطاء المراقبة فقط، شغّل
`openclaw googlemeet status --json <session-id>` بعد أن يتحدث المشاركون وتحقق من
`captioning` و`transcriptLines` و`lastCaptionText`. إذا كانت `inCall` تساوي
true لكن `transcriptLines` تبقى عند `0`، فقد تكون تسميات Meet التوضيحية معطّلة،
أو لم يتحدث أحد منذ تثبيت المراقب، أو تغيّرت واجهة Meet، أو لا تتوفر التسميات
التوضيحية المباشرة للغة الاجتماع/الحساب.

يفحص `googlemeet test-speech` دائمًا المسار الفوري ويبلّغ عما إذا تمت ملاحظة
بايتات خرج الجسر لذلك الاستدعاء. إذا كانت `speechOutputVerified` تساوي false و
`speechOutputTimedOut` تساوي true، فقد يكون مزود المسار الفوري قد قبل العبارة
لكن OpenClaw لم يرَ بايتات خرج جديدة تصل إلى جسر صوت Chrome.

تحقق أيضًا مما يلي:

- يتوفر مفتاح مزود فوري على مضيف Gateway، مثل `OPENAI_API_KEY` أو
  `GEMINI_API_KEY`.
- يظهر `BlackHole 2ch` على مضيف Chrome.
- يوجد `sox` على مضيف Chrome.
- يتم توجيه ميكروفون Meet ومكبر الصوت عبر مسار الصوت الافتراضي الذي يستخدمه
  OpenClaw.

يطبع `googlemeet doctor [session-id]` الجلسة، والعقدة، وحالة التواجد داخل
المكالمة، وسبب الإجراء اليدوي، واتصال مزود المسار الفوري، و`realtimeReady`،
ونشاط إدخال/إخراج الصوت، وآخر طوابع زمنية للصوت، وعدادات البايت، وعنوان URL
للمتصفح. استخدم `googlemeet status [session-id] --json` عندما تحتاج إلى JSON
الخام. استخدم `googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث OAuth
لـ Google Meet من دون كشف الرموز؛ أضف `--meeting` أو `--create-space` عندما
تحتاج أيضًا إلى إثبات Google Meet API.

إذا انتهت مهلة وكيل ويمكنك رؤية تبويب Meet مفتوح بالفعل، فافحص ذلك التبويب من
دون فتح تبويب آخر:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. يركز على تبويب Meet موجود ويفحصه
للنقل المحدد. مع `chrome`، يستخدم تحكم المتصفح المحلي عبر Gateway؛ ومع
`chrome-node`، يستخدم عقدة Chrome المهيأة. لا يفتح تبويبًا جديدًا ولا ينشئ جلسة
جديدة؛ بل يبلّغ عن العائق الحالي، مثل تسجيل الدخول أو القبول أو الأذونات أو
حالة اختيار الصوت. يتحدث أمر CLI إلى Gateway المهيأ، لذا يجب أن يكون Gateway
قيد التشغيل؛ ويتطلب `chrome-node` أيضًا أن تكون عقدة Chrome متصلة.

### فشل فحوص إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا به أو غير
مفعّل. أضفه إلى `plugins.allow`، وفعّل `plugins.entries.voice-call`، وأعد تحميل
Gateway.

يفشل `twilio-voice-call-credentials` عندما تفتقد واجهة Twilio الخلفية معرف SID
للحساب، أو رمز المصادقة، أو رقم المتصل. عيّن هذه القيم على مضيف Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

يفشل `twilio-voice-call-webhook` عندما لا يكون لدى `voice-call` تعريض Webhook
عام، أو عندما يشير `publicUrl` إلى loopback أو مساحة شبكة خاصة. عيّن
`plugins.entries.voice-call.config.publicUrl` إلى عنوان URL العام للمزود أو هيئ
تعريض نفق/‏Tailscale لـ `voice-call`.

عناوين loopback والعناوين الخاصة غير صالحة لاستدعاءات شركات الاتصالات. لا
تستخدم `localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو
`172.16.x`-`172.31.x` أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو
`fd00::/8` كقيمة `publicUrl`.

للحصول على عنوان URL عام ثابت:

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

يكون `voicecall smoke` فحص جاهزية فقط افتراضيًا. لإجراء تجربة جافة لرقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

أضف `--yes` فقط عندما تريد عمدًا إجراء مكالمة إشعار صادرة مباشرة:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تبدأ مكالمة Twilio لكنها لا تدخل الاجتماع أبدًا

تأكد من أن حدث Meet يعرض تفاصيل الاتصال الهاتفي. مرّر رقم الاتصال الهاتفي
ورقم PIN الدقيقين أو تسلسل DTMF مخصصًا:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم `w` بادئة أو الفواصل في `--dtmf-sequence` إذا كان المزود يحتاج إلى توقف
قبل إدخال PIN.

إذا تم إنشاء المكالمة الهاتفية لكن قائمة Meet لا تعرض أبدًا مشارك الاتصال
الهاتفي:

- شغّل `openclaw googlemeet doctor <session-id>` للتأكد من معرف مكالمة Twilio
  المفوّضة، وما إذا تم وضع DTMF في قائمة الانتظار، وما إذا طُلبت التحية
  التمهيدية.
- شغّل `openclaw voicecall status --call-id <id>` وتأكد من أن المكالمة لا تزال
  نشطة.
- شغّل `openclaw voicecall tail` وتحقق من وصول Webhook من Twilio إلى Gateway.
- شغّل `openclaw logs --follow` وابحث عن تسلسل Twilio Meet: يفوّض Google
  Meet الانضمام، وتبدأ Voice Call الساق الهاتفية، وينتظر Google Meet
  `voiceCall.dtmfDelayMs`، ويرسل DTMF باستخدام `voicecall.dtmf`، وينتظر
  `voiceCall.postDtmfSpeechDelayMs`، ثم يطلب كلام المقدمة باستخدام
  `voicecall.speak`.
- أعد تشغيل `openclaw googlemeet setup --transport twilio`؛ يلزم فحص إعداد أخضر
  لكنه لا يثبت أن تسلسل PIN للاجتماع صحيح.
- تأكد من أن رقم الاتصال الهاتفي ينتمي إلى دعوة Meet نفسها والمنطقة نفسها مثل
  PIN.
- زد `voiceCall.dtmfDelayMs` إذا كان Meet يجيب ببطء أو كان نص المكالمة لا يزال
  يعرض المطالبة بطلب PIN بعد إرسال DTMF.
- إذا انضم المشارك لكنك لا تسمع التحية، فتحقق من `openclaw logs --follow` بحثًا
  عن طلب `voicecall.speak` بعد DTMF وعن تشغيل TTS عبر بث الوسائط أو تراجع
  Twilio `<Say>`. إذا كان نص المكالمة لا يزال يحتوي على "enter the meeting PIN"،
  فإن الساق الهاتفية لم تنضم بعد إلى غرفة Meet، لذلك لن يسمع المشاركون في
  الاجتماع الكلام.

إذا لم تصل Webhook، فصحح أخطاء Plugin المكالمات الصوتية أولًا: يجب أن يصل
المزود إلى `plugins.entries.voice-call.config.publicUrl` أو النفق المهيأ.
راجع [استكشاف أخطاء المكالمات الصوتية وإصلاحها](/ar/plugins/voice-call#troubleshooting).

## ملاحظات

واجهة الوسائط الرسمية لـ Google Meet موجهة للاستقبال، لذا ما زال التحدث داخل
مكالمة Meet يحتاج إلى مسار مشارك. يُبقي هذا Plugin ذلك الحد واضحًا: يتولى
Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ وتتولى Twilio المشاركة عبر
الاتصال الهاتفي.

يحتاج وضع Chrome الفوري إلى `BlackHole 2ch` بالإضافة إلى أحد الخيارين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يمتلك OpenClaw جسر
  نموذج المسار الفوري ويمرر الصوت بتنسيق `chrome.audioFormat` بين هذين الأمرين
  ومزود الصوت الفوري المحدد. مسار Chrome الافتراضي هو PCM16 بتردد 24 كيلوهرتز؛
  وتبقى G.711 mu-law بتردد 8 كيلوهرتز متاحة لأزواج الأوامر القديمة.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي بالكامل
  ويجب أن يخرج بعد بدء خادمه الخفي أو التحقق منه.

للحصول على صوت ثنائي الاتجاه نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة
افتراضية منفصلة أو مخطط جهاز افتراضي بنمط Loopback. يمكن لجهاز BlackHole مشترك
واحد أن يردّد صوت المشاركين الآخرين مرة أخرى إلى المكالمة.

مع جسر Chrome ذي زوج الأوامر، يمكن لـ `chrome.bargeInInputCommand` الاستماع إلى
ميكروفون محلي منفصل ومسح تشغيل المساعد عندما يبدأ الإنسان بالكلام. هذا يُبقي
كلام الإنسان سابقًا على خرج المساعد حتى عندما يتم كتم إدخال loopback المشترك
لـ BlackHole مؤقتًا أثناء تشغيل المساعد. ومثل `chrome.audioInputCommand` و
`chrome.audioOutputCommand`، فهو أمر محلي يهيئه المشغّل. استخدم مسار أمر موثوقًا
صريحًا أو قائمة وسائط، ولا توجهه إلى سكربتات من مواقع غير موثوقة.

يشغّل `googlemeet speak` جسر الصوت الفوري النشط لجلسة Chrome. ويوقف
`googlemeet leave` ذلك الجسر. بالنسبة إلى جلسات Twilio المفوّضة عبر Plugin
المكالمات الصوتية، يقوم `leave` أيضًا بإنهاء المكالمة الصوتية الأساسية. استخدم
`googlemeet end-active-conference` عندما تريد أيضًا إغلاق مؤتمر Google Meet
النشط لمساحة مُدارة عبر API.

## ذو صلة

- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
- [وضع الكلام](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
