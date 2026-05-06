---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - تريد أن ينشئ وكيل OpenClaw مكالمة Google Meet جديدة
    - أنت تُهيِّئ Chrome أو عقدة Chrome أو Twilio كناقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL المحددة صراحةً في Meet عبر Chrome أو Twilio مع الإعدادات الافتراضية لردّ الوكيل صوتيًا'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-06T18:01:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b154e9cbce560dbc8327a140b27c17d2614d13d7011032a48b110314772ab0c
    source_path: plugins/google-meet.md
    workflow: 16
---

دعم المشاركين في Google Meet لـ OpenClaw — يكون Plugin صريحًا حسب التصميم:

- ينضم فقط إلى عنوان URL صريح بالشكل `https://meet.google.com/...`.
- يمكنه إنشاء مساحة Meet جديدة من خلال Google Meet API، ثم الانضمام إلى عنوان URL
  المُعاد.
- `agent` هو وضع الردّ الصوتي الافتراضي: يستمع النسخ الفوري، ويجيب
  وكيل OpenClaw المكوَّن، ويتحدث OpenClaw TTS العادي داخل Meet.
- يبقى `bidi` متاحًا كوضع احتياطي مباشر لنموذج الصوت الفوري.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `agent` للاستماع/الردّ
  المباشر، أو `bidi` كاحتياطي مباشر للصوت الفوري، أو `transcribe`
  للانضمام/التحكم في المتصفح من دون جسر الردّ الصوتي.
- يبدأ التفويض بوصول Google OAuth شخصي أو ملف Chrome شخصي مسجّل دخوله مسبقًا.
- لا يوجد إعلان موافقة تلقائي.
- واجهة الصوت الخلفية الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف عقدة مقترنة.
- تقبل Twilio رقم اتصال هاتفيًا مع رقم PIN أو تسلسل DTMF اختياري؛ ولا
  يمكنها طلب عنوان URL لاجتماع Meet مباشرة.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لسير عمل المؤتمرات
  الهاتفية الأوسع للوكلاء.

## البدء السريع

ثبّت تبعيات الصوت المحلية وفعّل مزود نسخ فوريًا مع OpenClaw TTS العادي.
OpenAI هو مزود النسخ الافتراضي؛ كما يعمل Google Gemini Live أيضًا كاحتياطي
صوت `bidi` منفصل مع `realtime.voiceProvider: "google"`:

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

مخرجات الإعداد مصممة لتكون قابلة للقراءة من الوكيل ومراعية للوضع. وهي تعرض
ملف Chrome الشخصي، وتثبيت العقدة، وبالنسبة إلى انضمامات Chrome الفورية، جسر
صوت BlackHole/SoX وفحوص المقدمة الفورية المؤجلة. بالنسبة إلى انضمامات
المراقبة فقط، تحقق من النقل نفسه باستخدام `--mode transcribe`؛ يتجاوز هذا
الوضع متطلبات الصوت الفوري لأنه لا يستمع عبر الجسر ولا يتحدث عبره:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

عند تكوين تفويض Twilio، تعرض الإعدادات أيضًا ما إذا كان Plugin
`voice-call`، وبيانات اعتماد Twilio، وتعريض Webhook العام جاهزة. تعامل مع أي
فحص `ok: false` كمانع للنقل والوضع قيد الفحص قبل أن تطلب من وكيل الانضمام.
استخدم `openclaw googlemeet setup --json` للسكربتات أو المخرجات القابلة
للقراءة آليًا. استخدم `--transport chrome`، أو `--transport chrome-node`،
أو `--transport twilio` لإجراء فحص مسبق لنقل محدد قبل أن يجربه وكيل.

بالنسبة إلى Twilio، أجرِ دائمًا فحصًا مسبقًا للنقل صراحة عندما يكون النقل
الافتراضي هو Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

يلتقط ذلك نقص توصيل `voice-call`، أو بيانات اعتماد Twilio، أو تعريض
Webhook غير قابل للوصول قبل أن يحاول الوكيل الاتصال بالاجتماع.

انضم إلى اجتماع:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو دع وكيلًا ينضم من خلال أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

تبقى أداة `google_meet` الموجهة للوكلاء متاحة على المضيفات غير macOS
لتدفقات الأثر، والتقويم، والإعداد، والنسخ، وTwilio، و`chrome-node`. تُحظر
إجراءات الردّ الصوتي عبر Chrome المحلي هناك لأن مسار صوت Chrome المضمّن يعتمد
حاليًا على `BlackHole 2ch` في macOS. على Linux، استخدم `mode: "transcribe"`،
أو الاتصال الهاتفي عبر Twilio، أو مضيف `chrome-node` يعمل على macOS للمشاركة
في الردّ الصوتي عبر Chrome.

أنشئ اجتماعًا جديدًا وانضم إليه:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

للغرف المنشأة عبر API، استخدم Google Meet `SpaceConfig.accessType` عندما
تريد أن تكون سياسة الغرفة بشأن عدم الطرق صريحة بدلًا من وراثتها من إعدادات
حساب Google الافتراضية:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

يتيح `OPEN` لأي شخص لديه عنوان URL الخاص بـ Meet الانضمام من دون طلب إذن.
يتيح `TRUSTED` لمستخدمي مؤسسة المضيف الموثوقين، والمستخدمين الخارجيين
المدعوين، ومستخدمي الاتصال الهاتفي الانضمام من دون طلب إذن. يحدّ `RESTRICTED`
الدخول من دون طلب إذن على المدعوين. لا تنطبق هذه الإعدادات إلا على مسار
الإنشاء الرسمي عبر Google Meet API، لذلك يجب تكوين بيانات اعتماد OAuth.

إذا صادقت على Google Meet قبل توفر هذا الخيار، فأعد تشغيل
`openclaw googlemeet auth login --json` بعد إضافة نطاق
`meetings.space.settings` إلى شاشة موافقة Google OAuth.

أنشئ عنوان URL فقط من دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

لدى `googlemeet create` مساران:

- إنشاء عبر API: يُستخدم عندما تكون بيانات اعتماد Google Meet OAuth مكوَّنة.
  هذا هو المسار الأكثر حتمية ولا يعتمد على حالة واجهة المتصفح.
- احتياطي المتصفح: يُستخدم عند غياب بيانات اعتماد OAuth. يستخدم OpenClaw
  عقدة Chrome المثبتة، ويفتح `https://meet.google.com/new`، وينتظر من Google
  إعادة التوجيه إلى عنوان URL حقيقي برمز اجتماع، ثم يعيد ذلك العنوان. يتطلب
  هذا المسار أن يكون ملف Chrome الشخصي الخاص بـ OpenClaw على العقدة مسجّل
  الدخول مسبقًا إلى Google. تتولى أتمتة المتصفح مطالبة الميكروفون الأولية
  الخاصة بـ Meet؛ ولا تُعامل تلك المطالبة كفشل في تسجيل الدخول إلى Google.
  كما تحاول تدفقات الانضمام والإنشاء إعادة استخدام تبويب Meet موجود قبل فتح
  تبويب جديد. تتجاهل المطابقة سلاسل استعلام URL غير الضارة مثل `authuser`،
  لذلك ينبغي أن تؤدي إعادة محاولة الوكيل إلى التركيز على الاجتماع المفتوح
  مسبقًا بدلًا من إنشاء تبويب Chrome ثانٍ.

تتضمن مخرجات الأمر/الأداة حقل `source` (`api` أو `browser`) حتى تستطيع
الوكلاء شرح المسار المستخدم. ينضم `create` إلى الاجتماع الجديد افتراضيًا
ويعيد `joined: true` بالإضافة إلى جلسة الانضمام. لإنشاء عنوان URL فقط، استخدم
`create --no-join` في CLI أو مرّر `"join": false` إلى الأداة.

أو أخبر وكيلًا: "أنشئ Google Meet، وانضم إليه بوضع الردّ الصوتي للوكيل، وأرسل
لي الرابط." ينبغي أن يستدعي الوكيل `google_meet` مع `action: "create"` ثم
يشارك `meetingUri` المُعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

لانضمام مراقبة فقط/تحكم في المتصفح، اضبط `"mode": "transcribe"`. لا يبدأ ذلك
جسر الصوت الفوري ثنائي الاتجاه، ولا يتطلب BlackHole أو SoX، ولن يردّ صوتيًا
داخل الاجتماع. كما تتجنب انضمامات Chrome في هذا الوضع منح إذن الميكروفون/الكاميرا
في OpenClaw وتتجنب مسار **Use microphone** في Meet. إذا عرض Meet شاشة فاصلة
لاختيار الصوت، تحاول الأتمتة مسار عدم استخدام الميكروفون، وإلا فتبلغ عن إجراء
يدوي بدلًا من فتح الميكروفون المحلي. في وضع النسخ، تثبّت نُقل Chrome المُدارة
أيضًا مراقب تسميات توضيحية في Meet بأفضل جهد. يعرض `googlemeet status --json`
و`googlemeet doctor` الحقول `captioning`، و`captionsEnabledAttempted`،
و`transcriptLines`، و`lastCaptionAt`، و`lastCaptionSpeaker`،
و`lastCaptionText`، وذيلًا قصيرًا من `recentTranscript` حتى يستطيع المشغلون
معرفة ما إذا كان المتصفح قد انضم إلى المكالمة وما إذا كانت تسميات Meet
التوضيحية تنتج نصًا.
استخدم `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
عندما تحتاج إلى اختبار نعم/لا: ينضم في وضع النسخ، وينتظر تسمية توضيحية جديدة
أو حركة في النص المنسوخ، ويعيد `listenVerified`، و`listenTimedOut`، وحقول
الإجراء اليدوي، وآخر حالة لصحة التسميات التوضيحية.

أثناء الجلسات الفورية، تتضمن حالة `google_meet` صحة المتصفح وجسر الصوت مثل
`inCall`، و`manualActionRequired`، و`providerConnected`، و`realtimeReady`،
و`audioInputActive`، و`audioOutputActive`، وآخر طوابع زمنية للإدخال/الإخراج،
وعدادات البايت، وحالة إغلاق الجسر. إذا ظهرت مطالبة آمنة في صفحة Meet، تتعامل
معها أتمتة المتصفح عندما تستطيع. تُبلَّغ مطالبات تسجيل الدخول، وقبول المضيف،
وأذونات المتصفح/نظام التشغيل كإجراء يدوي مع سبب ورسالة ليعيدها الوكيل. لا
تصدر جلسات Chrome المُدارة المقدمة أو عبارة الاختبار إلا بعد أن تعرض صحة
المتصفح `inCall: true`؛ وإلا فتبلغ الحالة `speechReady: false` وتُحظر محاولة
النطق بدلًا من الادعاء بأن الوكيل تحدث داخل الاجتماع.

تنضم جلسات Chrome المحلية عبر ملف متصفح OpenClaw الشخصي المسجّل الدخول. يتطلب
الوضع الفوري `BlackHole 2ch` لمسار الميكروفون/السماعة الذي يستخدمه OpenClaw.
للحصول على صوت ثنائي الاتجاه نظيف، استخدم أجهزة افتراضية منفصلة أو رسمًا
بيانيًا بأسلوب Loopback؛ جهاز BlackHole واحد كافٍ لاختبار دخان أولي لكنه قد
ينتج صدى.

### Gateway محلي + Chrome في Parallels

لا تحتاج إلى OpenClaw Gateway كامل أو مفتاح API لنموذج داخل جهاز macOS VM فقط
لجعل VM يملك Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل مضيف عقدة في VM.
فعّل Plugin المضمّن على VM مرة واحدة حتى تعلن العقدة أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API،
  ومزود فوري، وتكوين Plugin الخاص بـ Google Meet.
- جهاز Parallels macOS VM: OpenClaw CLI/مضيف العقدة، وGoogle Chrome، وSoX،
  وBlackHole 2ch، وملف Chrome شخصي مسجّل الدخول إلى Google.
- غير مطلوب في VM: خدمة Gateway، أو تكوين الوكيل، أو مفتاح OpenAI/GPT، أو
  إعداد مزود النموذج.

ثبّت تبعيات VM:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل VM بعد تثبيت BlackHole حتى يعرض macOS الجهاز `BlackHole 2ch`:

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

ابدأ مضيف العقدة في VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان LAN IP ولا تستخدم TLS، فسترفض العقدة WebSocket
النصي غير المشفر ما لم تقبل صراحة ذلك للشبكة الخاصة الموثوقة:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو بيئة العملية، وليس إعداد
`openclaw.json`. يخزّنه `openclaw node install` في بيئة LaunchAgent عندما
يكون موجودًا في أمر التثبيت.

وافق على العقدة من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأكد من أن Gateway يرى العقدة وأنها تعلن كلًا من `googlemeet.chrome` وإمكانية
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

انضم الآن بشكل عادي من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اطلب من الوكيل استخدام أداة `google_meet` مع `transport: "chrome-node"`.

لاختبار دخان بأمر واحد ينشئ جلسة أو يعيد استخدامها، وينطق عبارة معروفة،
ويطبع صحة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام في الوقت الفعلي، تملأ أتمتة متصفح OpenClaw اسم الضيف، وتنقر
Join/Ask to join، وتقبل خيار "Use microphone" الأولي في Meet عندما تظهر تلك
المطالبة. أثناء الانضمام للمراقبة فقط أو إنشاء اجتماع عبر المتصفح فقط، تتابع
بعد المطالبة نفسها دون ميكروفون عندما يكون ذلك الخيار متاحا. إذا لم يكن ملف
تعريف المتصفح مسجلا للدخول، أو كان Meet ينتظر قبول المضيف، أو كان Chrome يحتاج
إلى إذن الميكروفون/الكاميرا لانضمام في الوقت الفعلي، أو كان Meet عالقا عند
مطالبة لم تستطع الأتمتة حلها، فإن نتيجة الانضمام/اختبار الكلام تبلغ
`manualActionRequired: true` مع `manualActionReason` و
`manualActionMessage`. يجب على الوكلاء إيقاف إعادة محاولة الانضمام، والإبلاغ عن
تلك الرسالة بالضبط مع `browserUrl`/`browserTitle` الحاليين، ثم إعادة المحاولة
فقط بعد اكتمال إجراء المتصفح اليدوي.

إذا حُذف `chromeNode.node`، يختار OpenClaw تلقائيا فقط عندما يعلن Node واحد
متصل بالضبط عن كل من `googlemeet.chrome` والتحكم في المتصفح. إذا كانت عدة
Nodes قادرة متصلة، فاضبط `chromeNode.node` على معرف Node أو اسم العرض أو عنوان
IP البعيد.

فحوصات الفشل الشائعة:

- `Configured Google Meet node ... is not usable: offline`: إن Node المثبت
  معروف لدى Gateway لكنه غير متاح. يجب على الوكلاء التعامل مع ذلك Node كحالة
  تشخيصية، لا كمضيف Chrome قابل للاستخدام، والإبلاغ عن عائق الإعداد بدلا من
  الرجوع إلى نقل آخر ما لم يطلب المستخدم ذلك.
- `No connected Google Meet-capable node`: شغّل `openclaw node run` في VM،
  وافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` في VM. وتأكد أيضا من أن مضيف
  Gateway يسمح بأمري Node كليهما عبر
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: ثبّت `blackhole-2ch` على المضيف
  الذي يجري فحصه وأعد التشغيل قبل استخدام صوت Chrome المحلي.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  داخل VM وأعد تشغيل VM.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف تعريف المتصفح داخل
  VM، أو أبق `chrome.guestName` مضبوطا لانضمام الضيف. يستخدم انضمام الضيف
  التلقائي أتمتة متصفح OpenClaw عبر وكيل متصفح Node؛ تأكد من أن إعدادات متصفح
  Node تشير إلى ملف التعريف الذي تريده، مثل
  `browser.defaultProfile: "user"` أو ملف تعريف جلسة موجود مسمى.
- تبويبات Meet مكررة: اترك `chrome.reuseExistingTab: true` مفعلا. يفعّل
  OpenClaw تبويبا موجودا لعنوان Meet نفسه قبل فتح تبويب جديد، ويعيد إنشاء
  الاجتماع في المتصفح استخدام تبويب `https://meet.google.com/new` قيد التقدم
  أو تبويب مطالبة حساب Google قبل فتح تبويب آخر.
- لا يوجد صوت: في Meet، وجّه الميكروفون/مكبر الصوت عبر مسار جهاز الصوت
  الافتراضي الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيها
  بأسلوب Loopback للحصول على صوت مزدوج نظيف.

## ملاحظات التثبيت

يستخدم الإعداد الافتراضي للرد الصوتي في Chrome أداتين خارجيتين:

- `sox`: أداة صوت من سطر الأوامر. يستخدم Plugin أوامر جهاز CoreAudio صريحة
  لجسر صوت PCM16 الافتراضي بتردد 24 كيلوهرتز.
- `blackhole-2ch`: برنامج تشغيل صوت افتراضي لنظام macOS. ينشئ جهاز الصوت
  `BlackHole 2ch` الذي يمكن لـ Chrome/Meet التوجيه عبره.

لا يضمّن OpenClaw أيا من الحزمتين ولا يعيد توزيعهما. تطلب الوثائق من
المستخدمين تثبيتهما كاعتماديات مضيف عبر Homebrew. SoX مرخص بموجب
`LGPL-2.0-only AND GPL-2.0-only`؛ وBlackHole مرخص بموجب GPL-3.0. إذا بنيت
مثبتا أو جهازا يضمّن BlackHole مع OpenClaw، فراجع شروط ترخيص BlackHole
الأصلية أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

يفتح نقل Chrome عنوان Meet عبر تحكم متصفح OpenClaw وينضم باستخدام ملف تعريف
متصفح OpenClaw المسجل للدخول. على macOS، يفحص Plugin وجود `BlackHole 2ch`
قبل التشغيل. وإذا كان مهيأ، فإنه يشغّل أيضا أمر صحة جسر الصوت وأمر بدء
التشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت على مضيف
Gateway؛ واستخدم `chrome-node` عندما يكون Chrome/الصوت على Node مقترن مثل VM
بنظام macOS في Parallels. بالنسبة إلى Chrome المحلي، اختر ملف التعريف باستخدام
`browser.defaultProfile`؛ ويتم تمرير `chrome.browserProfile` إلى مضيفي
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون ومكبر صوت Chrome عبر جسر صوت OpenClaw المحلي. إذا لم يكن
`BlackHole 2ch` مثبتا، يفشل الانضمام بخطأ إعداد بدلا من الانضمام بصمت دون
مسار صوتي.

### Twilio

نقل Twilio هو خطة اتصال صارمة مفوضة إلى Plugin مكالمات الصوت. ولا يحلل صفحات
Meet لاستخراج أرقام الهاتف.

استخدم هذا عندما لا تتوفر مشاركة Chrome أو عندما تريد بديلا للاتصال الهاتفي.
يجب أن يعرض Google Meet رقم اتصال هاتفي ورقم PIN للاجتماع؛ لا يكتشف OpenClaw
هذه المعلومات من صفحة Meet.

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

قدّم بيانات اعتماد Twilio عبر البيئة أو الإعدادات. تبقي البيئة الأسرار خارج
`openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

استخدم `realtime.provider: "openai"` مع Plugin موفر OpenAI و
`OPENAI_API_KEY` بدلا من ذلك إذا كان ذلك هو موفر الصوت في الوقت الفعلي لديك.

أعد تشغيل Gateway أو أعد تحميله بعد تفعيل `voice-call`؛ لا تظهر تغييرات إعدادات
Plugin في عملية Gateway قيد التشغيل بالفعل حتى يعاد تحميلها.

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

OAuth اختياري لإنشاء رابط Meet لأن `googlemeet create` يمكن أن يرجع إلى
أتمتة المتصفح. هيئ OAuth عندما تريد الإنشاء عبر API الرسمي، أو حل المساحة، أو
فحوصات Meet Media API التمهيدية.

يستخدم الوصول إلى Google Meet API ‏OAuth المستخدم: أنشئ عميل Google Cloud
OAuth، واطلب النطاقات المطلوبة، وفوّض حساب Google، ثم خزّن رمز التحديث الناتج
في إعدادات Plugin Google Meet أو قدّم متغيرات البيئة
`OPENCLAW_GOOGLE_MEET_*`.

لا يحل OAuth محل مسار الانضمام عبر Chrome. لا تزال وسائل نقل Chrome و
Chrome-node تنضم عبر ملف تعريف Chrome مسجل للدخول، وBlackHole/SoX، وNode
متصل عند استخدام مشاركة المتصفح. OAuth مخصص فقط لمسار Google Meet API الرسمي:
إنشاء مساحات اجتماعات، وحل المساحات، وتشغيل فحوصات Meet Media API التمهيدية.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو اختر واحدا.
2. فعّل **Google Meet REST API** لذلك المشروع.
3. هيئ شاشة موافقة OAuth.
   - **Internal** هو الأبسط لمؤسسة Google Workspace.
   - **External** يعمل للإعدادات الشخصية/الاختبارية؛ أثناء وجود التطبيق في
     Testing، أضف كل حساب Google سيخوّل التطبيق كمستخدم اختبار.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرف عميل OAuth.
   - نوع التطبيق: **Web application**.
   - URI إعادة التوجيه المعتمد:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرف العميل وسر العميل.

`meetings.space.created` مطلوب بواسطة Google Meet `spaces.create`.
يسمح `meetings.space.readonly` لـ OpenClaw بحل عناوين/رموز Meet إلى مساحات.
يسمح `meetings.space.settings` لـ OpenClaw بتمرير إعدادات `SpaceConfig` مثل
`accessType` أثناء إنشاء غرفة عبر API.
`meetings.conference.media.readonly` مخصص لفحص Meet Media API التمهيدي وعمل
الوسائط؛ قد تطلب Google التسجيل في Developer Preview للاستخدام الفعلي لـ
Media API. إذا كنت تحتاج فقط إلى انضمامات Chrome المستندة إلى المتصفح، فتجاوز
OAuth بالكامل.

### إصدار رمز التحديث

هيئ `oauth.clientId` واختياريا `oauth.clientSecret`، أو مررهما كمتغيرات بيئة،
ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعدادات `oauth` مع رمز تحديث. يستخدم PKCE، واستدعاء localhost
على `http://localhost:8085/oauth2callback`، وتدفق نسخ/لصق يدوي مع `--manual`.

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

فضّل متغيرات البيئة عندما لا تريد وجود رمز التحديث في الإعدادات. إذا كانت قيم
الإعدادات والبيئة موجودة معا، يحل Plugin الإعدادات أولا ثم يرجع إلى البيئة.

تتضمن موافقة OAuth إنشاء مساحة Meet، ووصول قراءة إلى مساحة Meet، ووصول قراءة
إلى وسائط مؤتمر Meet. إذا صادقت قبل وجود دعم إنشاء الاجتماعات، فأعد تشغيل
`openclaw googlemeet auth login --json` حتى يحصل رمز التحديث على نطاق
`meetings.space.created`.

### التحقق من OAuth باستخدام الطبيب

شغّل طبيب OAuth عندما تريد فحص صحة سريع لا يكشف الأسرار:

```bash
openclaw googlemeet doctor --oauth --json
```

لا يحمّل هذا وقت تشغيل Chrome ولا يتطلب Chrome Node متصلا. إنه يتحقق من وجود
إعدادات OAuth ومن قدرة رمز التحديث على إصدار رمز وصول. يتضمن تقرير JSON حقول
الحالة فقط مثل `ok` و`configured` و`tokenSource` و`expiresAt` ورسائل الفحص؛
ولا يطبع رمز الوصول أو رمز التحديث أو سر العميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | يوجد `oauth.clientId` مع `oauth.refreshToken`، أو رمز وصول مخزن مؤقتا.       |
| `oauth-token`        | لا يزال رمز الوصول المخزن مؤقتا صالحا، أو أنشأ رمز التحديث رمز وصول جديدا. |
| `meet-spaces-get`    | نجح فحص `--meeting` الاختياري في حل مساحة Meet موجودة.                             |
| `meet-spaces-create` | أنشأ فحص `--create-space` الاختياري مساحة Meet جديدة.                               |

لإثبات تفعيل Google Meet API ونطاق `spaces.create` أيضا، شغل فحص الإنشاء ذي الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

ينشئ `--create-space` عنوان URL مؤقتا لاستخدام Meet. استخدمه عندما تحتاج إلى التأكد من أن مشروع Google Cloud فعّل Meet API وأن الحساب المفوض لديه نطاق `meetings.space.created`.

لإثبات صلاحية القراءة لمساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` صلاحية القراءة لمساحة موجودة يمكن لحساب Google المفوض الوصول إليها. عادة يعني ظهور `403` من هذه الفحوصات أن Google Meet REST API معطل، أو أن رمز التحديث الذي تمت الموافقة عليه يفتقد النطاق المطلوب، أو أن حساب Google لا يمكنه الوصول إلى مساحة Meet تلك. يعني خطأ رمز التحديث إعادة تشغيل `openclaw googlemeet auth login
--json` وتخزين كتلة `oauth` الجديدة.

لا يلزم وجود بيانات اعتماد OAuth لمسار الرجوع إلى المتصفح. في هذا الوضع، تأتي مصادقة Google من ملف Chrome الشخصي المسجل دخوله على Node المحددة، وليس من إعداد OpenClaw.

تقبل متغيرات البيئة هذه كمسارات رجوع:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

حل عنوان URL لاجتماع Meet، أو رمز، أو `spaces/{id}` عبر `spaces.get`:

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

مع `--meeting`، يستخدم `artifacts` و`attendance` أحدث سجل مؤتمر افتراضيا. مرر `--all-conference-records` عندما تريد كل السجلات المحتفظ بها لذلك الاجتماع.

يمكن للبحث في التقويم حل عنوان URL للاجتماع من Google Calendar قبل قراءة عناصر Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` الخاص باليوم عن حدث Calendar يحتوي على رابط Google Meet. استخدم `--event <query>` للبحث في نص الحدث المطابق، و`--calendar <id>` لتقويم غير أساسي. يتطلب بحث التقويم تسجيل دخول OAuth جديدا يتضمن نطاق القراءة فقط لأحداث Calendar. يعاين `calendar-events` أحداث Meet المطابقة ويضع علامة على الحدث الذي سيختاره `latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف بالفعل معرف سجل المؤتمر، فخاطبه مباشرة:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

أنه مؤتمرا نشطا لمساحة أنشئت عبر API عندما تريد إغلاق الغرفة بعد المكالمة:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

يستدعي هذا Google Meet `spaces.endActiveConference` ويتطلب OAuth مع نطاق `meetings.space.created` لمساحة يمكن للحساب المفوض إدارتها. يقبل OpenClaw عنوان URL لاجتماع Meet، أو رمز اجتماع، أو إدخال `spaces/{id}` ويحلّه إلى مورد مساحة API قبل إنهاء المؤتمر النشط. وهو منفصل عن `googlemeet leave`: يوقف `leave` مشاركة OpenClaw المحلية/الخاصة بالجلسة، بينما يطلب `end-active-conference` من Google Meet إنهاء المؤتمر النشط للمساحة.

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

يعيد `artifacts` بيانات تعريف سجل المؤتمر إضافة إلى بيانات تعريف موارد المشاركين والتسجيل والنص المنسوخ وإدخالات النص المنسوخ المنظمة والملاحظات الذكية عندما تكشفها Google للاجتماع. استخدم `--no-transcript-entries` لتخطي بحث الإدخالات في الاجتماعات الكبيرة. يوسع `attendance` المشاركين إلى صفوف جلسات المشاركين مع أوقات أول/آخر ظهور، وإجمالي مدة الجلسة، وعلامات التأخر/المغادرة المبكرة، وموارد المشاركين المكررة مدمجة حسب المستخدم المسجل دخوله أو اسم العرض. مرر `--no-merge-duplicates` لإبقاء موارد المشاركين الخام منفصلة، و`--late-after-minutes` لضبط اكتشاف التأخر، و`--early-before-minutes` لضبط اكتشاف المغادرة المبكرة.

يكتب `export` مجلدا يحتوي على `summary.md` و`attendance.csv` و`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`. يسجل `manifest.json` الإدخال المختار وخيارات التصدير وسجلات المؤتمر وملفات الإخراج والأعداد ومصدر الرمز وحدث Calendar عند استخدامه وأي تحذيرات استرجاع جزئي. مرر `--zip` لكتابة أرشيف قابل للنقل بجانب المجلد أيضا. مرر `--include-doc-bodies` لتصدير نص Google Docs المرتبط بالنص المنسوخ والملاحظات الذكية عبر Google Drive `files.export`؛ يتطلب هذا تسجيل دخول OAuth جديدا يتضمن نطاق القراءة فقط لـ Drive Meet. بدون `--include-doc-bodies`، تتضمن عمليات التصدير بيانات تعريف Meet وإدخالات النص المنسوخ المنظمة فقط. إذا أعادت Google فشلا جزئيا في العناصر، مثل خطأ في سرد الملاحظات الذكية أو إدخال النص المنسوخ أو متن مستند Drive، يحتفظ الملخص والبيان بالتحذير بدلا من إفشال التصدير بالكامل. استخدم `--dry-run` لجلب بيانات العناصر/الحضور نفسها وطباعة JSON الخاص بالبيان دون إنشاء المجلد أو ملف ZIP. يفيد ذلك قبل كتابة تصدير كبير أو عندما يحتاج وكيل إلى الأعداد والسجلات المحددة والتحذيرات فقط.

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

يمكن للوكلاء أيضا إنشاء غرفة مدعومة بـ API مع سياسة وصول صريحة:

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

لتحقق الاستماع أولا، ينبغي للوكلاء استخدام `test_listen` قبل الادعاء بأن الاجتماع مفيد:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

شغل اختبار الدخان الحي المحمي مقابل اجتماع حقيقي محتفظ به:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

شغل مسبار المتصفح الحي للاستماع أولا مقابل اجتماع سيتحدث فيه شخص ما مع توفر تسميات Meet التوضيحية:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

بيئة اختبار الدخان الحي:

- يفعل `OPENCLAW_LIVE_TEST=1` الاختبارات الحية المحمية.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL لاجتماع Meet محتفظ به، أو رمز، أو
  `spaces/{id}`.
- يوفر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرف عميل OAuth.
- يوفر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN` رمز التحديث.
- اختياري: يستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء الرجوع نفسها
  بدون بادئة `OPENCLAW_`.

يحتاج اختبار الدخان الحي الأساسي للعناصر/الحضور إلى `https://www.googleapis.com/auth/meetings.space.readonly` و`https://www.googleapis.com/auth/meetings.conference.media.readonly`. يحتاج بحث Calendar إلى `https://www.googleapis.com/auth/calendar.events.readonly`. يحتاج تصدير متن مستند Drive إلى `https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد والمصدر وجلسة الانضمام. مع بيانات اعتماد OAuth يستخدم Google Meet API الرسمي. وبدون بيانات اعتماد OAuth يستخدم ملف المتصفح الشخصي المسجل دخوله في Node الخاصة بـ Chrome المثبتة كمسار رجوع. يمكن للوكلاء استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في خطوة واحدة. للإنشاء بعنوان URL فقط، مرر `"join": false`.

مثال على مخرجات JSON من مسار الرجوع إلى المتصفح:

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

إذا واجه مسار الرجوع إلى المتصفح تسجيل دخول Google أو مانع أذونات Meet قبل أن يتمكن من إنشاء عنوان URL، فتعيد طريقة Gateway استجابة فاشلة وتعيد أداة `google_meet` تفاصيل منظمة بدلا من سلسلة نصية عادية:

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

عندما يرى وكيل `manualActionRequired: true`، ينبغي له الإبلاغ عن `manualActionMessage` مع سياق Node/علامة تبويب المتصفح والتوقف عن فتح علامات تبويب Meet جديدة حتى يكمل المشغل خطوة المتصفح.

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

يؤدي إنشاء Meet إلى الانضمام افتراضيًا. لا يزال نقل Chrome أو Chrome-node
يتطلب ملفًا شخصيًا مسجل الدخول في Google Chrome للانضمام عبر المتصفح. إذا كان
الملف الشخصي مسجل الخروج، يبلّغ OpenClaw عن `manualActionRequired: true` أو خطأ
رجوع احتياطي في المتصفح، ويطلب من المشغّل إكمال تسجيل الدخول إلى Google قبل
إعادة المحاولة.

عيّن `preview.enrollmentAcknowledged: true` فقط بعد تأكيد أن مشروع Cloud
ورئيس OAuth والمشاركين في الاجتماع مسجلون في Google Workspace Developer Preview Program
لواجهات Meet media APIs.

## التكوين

لا يحتاج مسار وكيل Chrome الشائع إلا إلى تفعيل Plugin وBlackHole وSoX ومفتاح
موفر نسخ فوري وموفر TTS مهيأ في OpenClaw. OpenAI هو موفر النسخ الافتراضي؛ عيّن
`realtime.voiceProvider` إلى `"google"` و`realtime.model` لاستخدام Google Gemini Live
في وضع `bidi` من دون تغيير موفر النسخ الافتراضي لوضع الوكيل:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

عيّن تكوين Plugin ضمن `plugins.entries.google-meet.config`:

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
- `defaultMode: "agent"` (يُقبل `"realtime"` فقط كاسم بديل قديم للتوافق مع
  `"agent"`؛ ينبغي لاستدعاءات الأدوات الجديدة أن تستخدم `"agent"`)
- `chromeNode.node`: معرّف/اسم/IP اختياري للعقدة لـ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم على شاشة ضيف Meet عند
  عدم تسجيل الدخول
- `chrome.autoJoin: true`: محاولة بأفضل جهد لملء اسم الضيف والنقر على Join Now
  عبر أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تنشيط تبويب Meet موجود بدلًا من فتح نسخ مكررة
- `chrome.waitForInCallMs: 20000`: انتظار تبويب Meet حتى يبلّغ أنه داخل المكالمة
  قبل تشغيل مقدمة الرد الصوتي
- `chrome.audioFormat: "pcm16-24khz"`: تنسيق صوت زوج الأوامر. استخدم
  `"g711-ulaw-8khz"` فقط لأزواج الأوامر القديمة/المخصصة التي لا تزال تصدر
  صوتًا هاتفيًا.
- `chrome.audioBufferBytes: 4096`: مخزن معالجة SoX المؤقت لأوامر صوت زوج أوامر
  Chrome المولدة. هذا نصف المخزن الافتراضي في SoX والبالغ 8192 بايت، ما يقلل
  زمن انتقال الأنبوب الافتراضي مع ترك مساحة لرفعه على المضيفات المشغولة.
  تُثبت القيم الأدنى من حد SoX الأدنى إلى 17 بايت.
- `chrome.audioInputCommand`: أمر SoX يقرأ من CoreAudio `BlackHole 2ch`
  ويكتب الصوت بتنسيق `chrome.audioFormat`
- `chrome.audioOutputCommand`: أمر SoX يقرأ الصوت بتنسيق `chrome.audioFormat`
  ويكتب إلى CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: أمر ميكروفون محلي اختياري يكتب PCM أحادي القناة
  little-endian موقّعًا 16-بت لاكتشاف مقاطعة الإنسان أثناء تشغيل صوت المساعد.
  ينطبق هذا حاليًا على جسر زوج أوامر `chrome` المستضاف على Gateway.
- `chrome.bargeInRmsThreshold: 650`: مستوى RMS الذي يُعد مقاطعة بشرية على
  `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: مستوى الذروة الذي يُعد مقاطعة بشرية على
  `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: الحد الأدنى للتأخير بين عمليات مسح المقاطعة
  البشرية المتكررة
- `mode: "agent"`: وضع الرد الصوتي الافتراضي. يُنسخ كلام المشاركين بواسطة موفر
  النسخ الفوري المهيأ، ويُرسل إلى وكيل OpenClaw المهيأ في جلسة وكيل فرعي لكل
  اجتماع، ثم يُنطق عبر وقت تشغيل OpenClaw TTS العادي.
- `mode: "bidi"`: وضع رجوع احتياطي لنموذج فوري ثنائي الاتجاه مباشر. يجيب موفر
  الصوت الفوري على كلام المشاركين مباشرة وقد يستدعي `openclaw_agent_consult`
  للحصول على إجابات أعمق/مدعومة بالأدوات.
- `mode: "transcribe"`: وضع مراقبة فقط من دون جسر الرد الصوتي.
- `realtime.provider: "openai"`: رجوع احتياطي للتوافق يُستخدم عندما لا تكون حقول
  الموفر محددة النطاق أدناه مضبوطة.
- `realtime.transcriptionProvider: "openai"`: معرّف الموفر الذي يستخدمه وضع `agent`
  للنسخ الفوري.
- `realtime.voiceProvider`: معرّف الموفر الذي يستخدمه وضع `bidi` للصوت الفوري
  المباشر. عيّن هذا إلى `"google"` لاستخدام Gemini Live مع إبقاء نسخ وضع
  الوكيل على OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة موجزة، مع
  `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية منطوق قصير عند اتصال الجسر الفوري؛ عيّنه
  إلى `""` للانضمام بصمت
- `realtime.agentId`: معرّف وكيل OpenClaw اختياري لـ
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

يأتي صوت Meet الدائم من
`messages.tts.providers.elevenlabs.voiceId`. يمكن لردود الوكيل أيضًا استخدام
توجيهات `[[tts:voiceId=... model=eleven_v3]]` لكل رد عند تفعيل تجاوزات نموذج TTS،
لكن التكوين هو الإعداد الافتراضي الحتمي للاجتماعات. عند الانضمام، ينبغي أن
تعرض السجلات `transcriptionProvider=elevenlabs` وأن يسجل كل رد منطوق
`provider=elevenlabs model=eleven_v3 voice=<voiceId>`.

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

القيمة الافتراضية لـ `voiceCall.enabled` هي `true`؛ ومع نقل Twilio يفوض مكالمة
PSTN الفعلية وDTMF وتحية المقدمة إلى Voice Call Plugin. يشغّل Voice Call تسلسل
DTMF قبل فتح دفق الوسائط الفوري، ثم يستخدم نص المقدمة المحفوظ كتحية فورية
أولية. إذا لم يكن `voice-call` مفعّلًا، فلا يزال بإمكان Google Meet التحقق من
خطة الاتصال وتسجيلها، لكنه لا يستطيع إجراء مكالمة Twilio.

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
`transport: "chrome-node"` عندما يعمل Chrome على عقدة مقترنة مثل آلة افتراضية
Parallels. في الحالتين، تعمل موفرو النماذج و`openclaw_agent_consult` على مضيف
Gateway، لذلك تبقى بيانات اعتماد النماذج هناك. مع `mode: "agent"` الافتراضي،
يتولى موفر النسخ الفوري الاستماع، وينتج وكيل OpenClaw المهيأ الإجابة، وينطقها
OpenClaw TTS العادي داخل Meet. استخدم `mode: "bidi"` عندما تريد أن يجيب نموذج
الصوت الفوري مباشرة. لا يزال `mode: "realtime"` الخام مقبولًا كاسم بديل قديم
للتوافق مع `mode: "agent"`، لكنه لم يعد معلنًا في مخطط أداة الوكيل. تتضمن سجلات
وضع الوكيل موفر/نموذج النسخ المحلول عند بدء الجسر، وموفر TTS والنموذج والصوت
وتنسيق الإخراج ومعدل العينة بعد كل رد مركب.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. استخدم
`action: "speak"` مع `sessionId` و`message` لجعل الوكيل الفوري يتحدث فورًا.
استخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها، وتشغيل عبارة
معروفة، وإرجاع صحة `inCall` عندما يستطيع مضيف Chrome الإبلاغ عنها. يفرض
`test_speech` دائمًا `mode: "agent"` ويفشل إذا طُلب منه التشغيل في
`mode: "transcribe"` لأن جلسات المراقبة فقط لا يمكنها عمدًا إصدار كلام. تستند
نتيجة `speechOutputVerified` إلى زيادة بايتات إخراج الصوت الفوري أثناء استدعاء
الاختبار هذا، لذلك لا تُحتسب الجلسة المعاد استخدامها مع صوت أقدم كفحص كلام
ناجح جديد. استخدم `action: "leave"` لوضع علامة على انتهاء الجلسة.

يتضمن `status` صحة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج
  ملف تعريف المتصفح إلى تسجيل دخول يدوي، أو قبول مضيف Meet، أو أذونات، أو إصلاح
  تحكم المتصفح قبل أن يعمل الكلام
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ما إذا كان
  الكلام المدار عبر Chrome مسموحًا الآن. تعني `speechReady: false` أن OpenClaw
  لم يرسل عبارة المقدمة/الاختبار إلى جسر الصوت.
- `providerConnected` / `realtimeReady`: حالة جسر الصوت الفوري
- `lastInputAt` / `lastOutputAt`: آخر صوت شوهد من الجسر أو أُرسل إليه
- `audioOutputRouted` / `audioOutputDeviceLabel`: ما إذا كان إخراج وسائط تبويب
  Meet قد وُجّه بنشاط إلى جهاز BlackHole الذي يستخدمه الجسر
- `lastSuppressedInputAt` / `suppressedInputBytes`: إدخال local loopback تم
  تجاهله أثناء نشاط تشغيل المساعد

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## أوضاع agent و bidi

وضع Chrome `agent` محسّن لسلوك "وكيلي موجود في الاجتماع". يسمع موفر النسخ
الفوري صوت الاجتماع، وتُوجّه نصوص المشاركين النهائية عبر وكيل OpenClaw المهيأ،
وتُنطق الإجابة عبر وقت تشغيل OpenClaw TTS العادي. عيّن `mode: "bidi"` عندما
تريد أن يجيب نموذج الصوت الفوري مباشرة.
تُدمج أجزاء النص النهائي القريبة قبل الاستشارة حتى لا ينتج دور منطوق واحد عدة
إجابات جزئية قديمة. ويُكبت الإدخال الفوري أيضًا أثناء استمرار تشغيل صوت المساعد
الموضوع في قائمة الانتظار،
وتُتجاهل أصداء النصوص الحديثة الشبيهة بالمساعد قبل استشارة الوكيل حتى لا يجعل
local loopback في BlackHole الوكيل يجيب على كلامه هو.

| الوضع    | من يقرر الإجابة        | مسار إخراج الكلام                     | استخدمه عندما                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | وكيل OpenClaw المهيأ | وقت تشغيل OpenClaw TTS العادي            | تريد سلوك "وكيلي موجود في الاجتماع"        |
| `bidi`  | نموذج الصوت الفوري      | استجابة صوتية من موفر الصوت الفوري | تريد حلقة صوت محادثة بأقل زمن انتقال |

في وضع `bidi`، عندما يحتاج النموذج الفوري إلى استدلال أعمق أو معلومات حديثة أو
أدوات OpenClaw العادية، يمكنه استدعاء `openclaw_agent_consult`.

تعمل أداة الاستشارة على تشغيل وكيل OpenClaw العادي في الخلفية مع سياق
نص اجتماع حديث، وتُرجع إجابة منطوقة موجزة. في وضع `agent`،
يرسل OpenClaw تلك الإجابة مباشرة إلى وقت تشغيل TTS؛ وفي وضع `bidi`، يمكن
لنموذج الصوت الفوري نطق نتيجة الاستشارة مرة أخرى داخل الاجتماع. وهي تستخدم
آلية الاستشارة المشتركة نفسها المستخدمة في المكالمة الصوتية.

افتراضيًا، تعمل الاستشارات عبر الوكيل `main`. عيّن `realtime.agentId` عندما
ينبغي لمسار Meet استشارة مساحة عمل وكيل OpenClaw مخصصة، وإعدادات النموذج
الافتراضية، وسياسة الأدوات، والذاكرة، وسجل الجلسات.

تستخدم استشارات وضع الوكيل مفتاح جلسة لكل اجتماع
`agent:<id>:subagent:google-meet:<session>` حتى تحتفظ أسئلة المتابعة بسياق
الاجتماع مع توريث سياسة الوكيل العادية من الوكيل المكوّن.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: إظهار أداة الاستشارة وحصر الوكيل العادي في
  `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و
  `memory_get`.
- `owner`: إظهار أداة الاستشارة والسماح للوكيل العادي باستخدام سياسة أدوات
  الوكيل العادية.
- `none`: عدم إظهار أداة الاستشارة لنموذج الصوت الفوري.

يكون مفتاح جلسة الاستشارة محدود النطاق لكل جلسة Meet، لذلك يمكن لاستدعاءات
استشارة المتابعة إعادة استخدام سياق الاستشارة السابق خلال الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد انضمام Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

لاختبار الانضمام والنطق الكامل:

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
  هو النقل الافتراضي أو تكون عقدة مثبتة.
- يعرض `nodes status` أن العقدة المحددة متصلة.
- تعلن العقدة المحددة عن كل من `googlemeet.chrome` و`browser.proxy`.
- تنضم علامة تبويب Meet إلى المكالمة، ويُرجع `test-speech` حالة سلامة Chrome مع
  `inCall: true`.

بالنسبة إلى مضيف Chrome بعيد مثل آلة Parallels macOS الافتراضية، فهذا هو أقصر
فحص آمن بعد تحديث Gateway أو الآلة الافتراضية:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن Plugin الخاص بـ Gateway محمّل، وأن عقدة الآلة الافتراضية متصلة
بالرمز الحالي، وأن جسر صوت Meet متاح قبل أن يفتح وكيل علامة تبويب اجتماع حقيقية.

لاختبار Twilio، استخدم اجتماعًا يعرض تفاصيل الاتصال الهاتفي:

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
- تحتوي الجلسة المُرجعة على `transport: "twilio"` و`twilio.voiceCallId`.
- يعرض `openclaw logs --follow` تقديم DTMF TwiML قبل TwiML الفوري، ثم جسرًا
  فوريًا مع التحية الأولية في قائمة الانتظار.
- يؤدي `googlemeet leave <sessionId>` إلى إنهاء المكالمة الصوتية المفوضة.

## استكشاف الأخطاء وإصلاحها

### لا يستطيع الوكيل رؤية أداة Google Meet

تأكد من تمكين Plugin في إعداد Gateway، ثم أعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد عدّلت للتو `plugins.entries.google-meet`، فأعد تشغيل Gateway أو
أعد تحميله. لا يرى الوكيل الجاري إلا أدوات Plugin المسجلة بواسطة عملية Gateway
الحالية.

على مضيفي Gateway غير macOS، تظل أداة `google_meet` المواجهة للوكيل مرئية،
لكن إجراءات رد الصوت عبر Chrome المحلي تُحظر قبل أن تصل إلى جسر الصوت.
يعتمد صوت رد Chrome المحلي حاليًا على `BlackHole 2ch` في macOS، لذلك ينبغي
لوكلاء Linux استخدام `mode: "transcribe"` أو اتصال Twilio الهاتفي أو مضيف
`chrome-node` يعمل على macOS بدلًا من مسار وكيل Chrome المحلي الافتراضي.

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

يجب أن تكون العقدة متصلة وأن تسرد `googlemeet.chrome` بالإضافة إلى
`browser.proxy`. يجب أن يسمح إعداد Gateway بأوامر العقدة هذه:

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
`gateway token mismatch`، فأعد تثبيت العقدة أو أعد تشغيلها باستخدام رمز Gateway
الحالي. بالنسبة إلى Gateway على شبكة LAN، يعني ذلك عادةً:

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

شغّل `googlemeet test-listen` لعمليات الانضمام للمراقبة فقط أو
`googlemeet test-speech` لعمليات الانضمام الفورية، ثم افحص حالة سلامة Chrome
المُرجعة. إذا أبلغ أي من الفحصين عن `manualActionRequired: true`، فاعرض
`manualActionMessage` للمشغّل وتوقف عن إعادة المحاولة حتى يكتمل إجراء المتصفح.

الإجراءات اليدوية الشائعة:

- سجّل الدخول إلى ملف Chrome الشخصي.
- اقبل الضيف من حساب مضيف Meet.
- امنح أذونات ميكروفون/كاميرا Chrome عند ظهور مطالبة الأذونات الأصلية في Chrome.
- أغلق مربع حوار أذونات Meet العالق أو أصلحه.

لا تبلغ عن "not signed in" لمجرد أن Meet يعرض "Do you want people to
hear you in the meeting?" فهذا هو حاجز اختيار الصوت في Meet؛ ينقر OpenClaw على
**Use microphone** عبر أتمتة المتصفح عندما يكون ذلك متاحًا ويواصل انتظار حالة
الاجتماع الحقيقية. وبالنسبة إلى احتياطي المتصفح الخاص بالإنشاء فقط، قد ينقر
OpenClaw على **Continue without microphone** لأن إنشاء عنوان URL لا يحتاج إلى
مسار الصوت الفوري.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` أولًا نقطة نهاية Google Meet API `spaces.create`
عندما تكون بيانات اعتماد OAuth مكوّنة. ومن دون بيانات اعتماد OAuth، ينتقل إلى
احتياطي متصفح عقدة Chrome المثبتة. تأكد مما يلي:

- لإنشاء API: أن `oauth.clientId` و`oauth.refreshToken` مكوّنان، أو أن متغيرات
  البيئة المطابقة `OPENCLAW_GOOGLE_MEET_*` موجودة.
- لإنشاء API: أن رمز التحديث قد أُصدر بعد إضافة دعم الإنشاء. قد تفتقد الرموز
  الأقدم نطاق `meetings.space.created`؛ أعد تشغيل
  `openclaw googlemeet auth login --json` وحدّث إعداد Plugin.
- لاحتياطي المتصفح: أن `defaultTransport: "chrome-node"` و`chromeNode.node`
  يشيران إلى عقدة متصلة تحتوي على `browser.proxy` و`googlemeet.chrome`.
- لاحتياطي المتصفح: أن ملف OpenClaw الشخصي في Chrome على تلك العقدة مسجل دخوله
  إلى Google ويمكنه فتح `https://meet.google.com/new`.
- لاحتياطي المتصفح: تعيد المحاولات استخدام علامة تبويب موجودة لـ
  `https://meet.google.com/new` أو مطالبة حساب Google قبل فتح علامة تبويب
  جديدة. إذا انتهت مهلة وكيل، فأعد محاولة استدعاء الأداة بدلًا من فتح علامة
  تبويب Meet أخرى يدويًا.
- لاحتياطي المتصفح: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم
  `browser.nodeId` و`browser.targetId` و`browserUrl` و`manualActionMessage`
  المُرجعة لتوجيه المشغّل. لا تعِد المحاولة في حلقة حتى يكتمل ذلك الإجراء.
- لاحتياطي المتصفح: إذا عرض Meet "Do you want people to hear you in the
  meeting?"، فاترك علامة التبويب مفتوحة. ينبغي أن ينقر OpenClaw على
  **Use microphone** أو، للاحتياطي الخاص بالإنشاء فقط، على
  **Continue without microphone** عبر أتمتة المتصفح وأن يواصل انتظار عنوان URL
  المولّد لـ Meet. إذا لم يستطع ذلك، فينبغي أن يذكر الخطأ
  `meet-audio-choice-required` لا `google-login-required`.

### ينضم الوكيل لكنه لا يتحدث

تحقق من المسار الفوري:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "agent"` لمسار STT -> وكيل OpenClaw -> رد TTS العادي، أو
`mode: "bidi"` لاحتياطي الصوت الفوري المباشر. أما `mode: "transcribe"` فلا
يبدأ جسر رد الكلام عمدًا. ولتصحيح المراقبة فقط، شغّل
`openclaw googlemeet status --json <session-id>` بعد أن يتحدث المشاركون وتحقق
من `captioning` و`transcriptLines` و`lastCaptionText`. إذا كان `inCall` يساوي
true لكن `transcriptLines` يبقى عند `0`، فقد تكون تسميات Meet التوضيحية معطلة،
أو لم يتحدث أحد منذ تثبيت المراقب، أو تغيرت واجهة Meet، أو أن التسميات
التوضيحية المباشرة غير متاحة للغة/حساب الاجتماع.

يفحص `googlemeet test-speech` دائمًا المسار الفوري ويبلغ عما إذا كانت بايتات
خرج الجسر قد رُصدت لذلك الاستدعاء. إذا كان `speechOutputVerified` يساوي false و
`speechOutputTimedOut` يساوي true، فربما قبل مزود الخدمة الفورية العبارة لكن
OpenClaw لم يرَ بايتات خرج جديدة تصل إلى جسر صوت Chrome.

تحقق أيضًا مما يلي:

- توفر مفتاح مزود فوري على مضيف Gateway، مثل `OPENAI_API_KEY` أو
  `GEMINI_API_KEY`.
- ظهور `BlackHole 2ch` على مضيف Chrome.
- وجود `sox` على مضيف Chrome.
- توجيه ميكروفون Meet ومكبّر الصوت عبر مسار الصوت الافتراضي الذي يستخدمه
  OpenClaw. ينبغي أن يعرض `doctor` القيمة `meet output routed: yes` لانضمامات
  Chrome المحلية الفورية.

يطبع `googlemeet doctor [session-id]` الجلسة، والعقدة، وحالة داخل المكالمة،
وسبب الإجراء اليدوي، واتصال مزود الخدمة الفورية، و`realtimeReady`، ونشاط دخل/
خرج الصوت، وآخر طوابع زمنية للصوت، وعدادات البايتات، وعنوان URL للمتصفح.
استخدم `googlemeet status [session-id] --json` عندما تحتاج إلى JSON الخام.
استخدم `googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث OAuth في
Google Meet من دون كشف الرموز؛ أضف `--meeting` أو `--create-space` عندما تحتاج
إلى إثبات Google Meet API أيضًا.

إذا انتهت مهلة وكيل وكان بإمكانك رؤية علامة تبويب Meet مفتوحة بالفعل، فافحص
تلك العلامة من دون فتح أخرى:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. يركز على علامة تبويب Meet
موجودة ويفحصها للنقل المحدد. مع `chrome`، يستخدم تحكم المتصفح المحلي عبر
Gateway؛ ومع `chrome-node`، يستخدم عقدة Chrome المكوّنة. لا يفتح علامة تبويب
جديدة ولا ينشئ جلسة جديدة؛ بل يبلغ عن العائق الحالي، مثل تسجيل الدخول أو
القبول أو الأذونات أو حالة اختيار الصوت. يتحدث أمر CLI إلى Gateway المكوّن،
لذلك يجب أن يكون Gateway قيد التشغيل؛ ويتطلب `chrome-node` أيضًا أن تكون عقدة
Chrome متصلة.

### فشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا به أو
ممكّنًا. أضفه إلى `plugins.allow`، ومكّن `plugins.entries.voice-call`، ثم أعد
تحميل Gateway.

يفشل `twilio-voice-call-credentials` عندما تفتقد خلفية Twilio معرف SID للحساب
أو رمز المصادقة أو رقم المتصل. عيّن هذه على مضيف Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

يفشل `twilio-voice-call-webhook` عندما لا يحتوي `voice-call` على عرض Webhook
عام، أو عندما يشير `publicUrl` إلى local loopback أو مساحة شبكة خاصة.
عيّن `plugins.entries.voice-call.config.publicUrl` إلى عنوان URL العام للمزود
أو كوّن نفقًا/تعريضًا لـ `voice-call` عبر Tailscale.

عناوين local loopback والعناوين الخاصة غير صالحة لاستدعاءات شركات الاتصالات.
لا تستخدم `localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو
`172.16.x`-`172.31.x` أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو
`fd00::/8` كـ `publicUrl`.

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

للتطوير المحلي، استخدم نفقًا أو إتاحة عبر Tailscale بدلًا من عنوان URL لمضيف
خاص:

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

يكون `voicecall smoke` مخصصًا للتحقق من الجاهزية فقط افتراضيًا. لإجراء تشغيل تجريبي جاف لرقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

أضف `--yes` فقط عندما تريد عمدًا إجراء مكالمة إشعار صادرة حية:

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

استخدم `w` بادئة أو فواصل في `--dtmf-sequence` إذا كان المزوّد يحتاج إلى إيقاف مؤقت
قبل إدخال رقم PIN.

إذا أُنشئت المكالمة الهاتفية لكن قائمة Meet لا تعرض مشارك الاتصال الهاتفي أبدًا:

- شغّل `openclaw googlemeet doctor <session-id>` لتأكيد معرّف مكالمة Twilio
  المفوّضة، وما إذا كان DTMF قد وُضع في قائمة الانتظار، وما إذا كانت التحية التمهيدية قد طُلبت.
- شغّل `openclaw voicecall status --call-id <id>` وتأكد من أن المكالمة ما زالت
  نشطة.
- شغّل `openclaw voicecall tail` وتحقق من وصول Webhooks الخاصة بـ Twilio إلى
  Gateway.
- شغّل `openclaw logs --follow` وابحث عن تسلسل Twilio Meet: يفوّض Google
  Meet الانضمام، وتخزّن Voice Call وتقدّم TwiML الخاص بـ DTMF قبل الاتصال،
  وتقدّم Voice Call TwiML في الوقت الحقيقي لمكالمة Twilio، ثم يطلب Google Meet
  الكلام التمهيدي باستخدام `voicecall.speak`.
- أعد تشغيل `openclaw googlemeet setup --transport twilio`؛ يلزم فحص إعدادات
  ناجح، لكنه لا يثبت أن تسلسل رقم PIN للاجتماع صحيح.
- تأكد من أن رقم الاتصال الهاتفي ينتمي إلى دعوة Meet نفسها والمنطقة نفسها مثل
  رقم PIN.
- زد `voiceCall.dtmfDelayMs` عن القيمة الافتراضية البالغة 12 ثانية إذا كان Meet يجيب
  ببطء أو كان نص المكالمة ما يزال يعرض المطالبة بإدخال رقم PIN بعد إرسال
  DTMF قبل الاتصال.
- إذا انضم المشارك لكنك لا تسمع التحية، فتحقق من `openclaw logs --follow`
  بحثًا عن طلب `voicecall.speak` بعد DTMF وعن تشغيل TTS عبر دفق الوسائط أو
  احتياطي Twilio `<Say>`. إذا كان نص المكالمة ما يزال يحتوي على "enter the meeting PIN"،
  فهذا يعني أن طرف الهاتف لم ينضم بعد إلى غرفة Meet، ولذلك لن يسمع المشاركون في الاجتماع الكلام.

إذا لم تصل Webhooks، فابدأ بتصحيح Plugin المكالمات الصوتية: يجب أن يصل المزوّد إلى
`plugins.entries.voice-call.config.publicUrl` أو النفق المكوّن.
راجع [استكشاف أخطاء المكالمات الصوتية وإصلاحها](/ar/plugins/voice-call#troubleshooting).

## ملاحظات

واجهة API الرسمية للوسائط في Google Meet موجهة للاستقبال، لذا لا يزال التحدث داخل مكالمة Meet
يحتاج إلى مسار مشارك. يحافظ هذا Plugin على وضوح هذا الحد:
يتولى Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ وتتولى Twilio
المشاركة عبر الاتصال الهاتفي.

تحتاج أوضاع الرد الصوتي في Chrome إلى `BlackHole 2ch` بالإضافة إلى أحد الخيارين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يمتلك OpenClaw
  الجسر ويمرر الصوت بتنسيق `chrome.audioFormat` بين تلك الأوامر والمزوّد
  المحدد. يستخدم وضع الوكيل النسخ في الوقت الحقيقي مع TTS عادي؛
  ويستخدم وضع bidi مزوّد الصوت في الوقت الحقيقي. مسار Chrome الافتراضي هو PCM16 بتردد 24 كيلوهرتز
  مع `chrome.audioBufferBytes: 4096`؛ ويظل G.711 mu-law بتردد 8 كيلوهرتز
  متاحًا لأزواج الأوامر القديمة.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي بالكامل
  ويجب أن يخرج بعد بدء تشغيل العفريت الخاص به أو التحقق منه. هذا صالح فقط
  لـ `bidi` لأن وضع `agent` يحتاج إلى وصول مباشر لزوج الأوامر من أجل TTS.

عندما يستدعي وكيل أداة `google_meet` في وضع الوكيل، تتفرع جلسة مستشار الاجتماع
من نص المتصل الحالي قبل الإجابة على كلام المشاركين. تظل جلسة Meet منفصلة
(`agent:<agentId>:subagent:google-meet:<sessionId>`)
حتى لا تعدّل متابعات الاجتماع نص المتصل مباشرة.

للحصول على صوت مزدوج الاتجاه نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة
افتراضية منفصلة أو مخطط جهاز افتراضي بأسلوب Loopback. يمكن لجهاز
BlackHole مشترك واحد أن يعيد صدى المشاركين الآخرين إلى المكالمة.

مع جسر Chrome القائم على زوج الأوامر، يمكن لـ `chrome.bargeInInputCommand` الاستماع إلى
ميكروفون محلي منفصل ومسح تشغيل المساعد عندما يبدأ الإنسان
بالكلام. يحافظ هذا على أولوية كلام الإنسان على خرج المساعد حتى عندما يكون دخل
BlackHole loopback المشترك مثبطًا مؤقتًا أثناء تشغيل المساعد.
ومثل `chrome.audioInputCommand` و`chrome.audioOutputCommand`، فهو
أمر محلي يكوّنه المشغّل. استخدم مسار أمر موثوقًا صريحًا أو
قائمة وسائط، ولا توجهه إلى سكربتات من مواقع غير موثوقة.

يشغّل `googlemeet speak` جسر صوت الرد النشط لجلسة Chrome.
ويوقف `googlemeet leave` ذلك الجسر. بالنسبة إلى جلسات Twilio المفوّضة
عبر Plugin المكالمات الصوتية، يقوم `leave` أيضًا بإنهاء المكالمة الصوتية الأساسية.
استخدم `googlemeet end-active-conference` عندما تريد أيضًا إغلاق مؤتمر
Google Meet النشط لمساحة تُدار عبر API.

## ذات صلة

- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
