---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - تريد أن ينشئ وكيل OpenClaw مكالمة Google Meet جديدة
    - أنت تهيّئ Chrome أو Chrome Node أو Twilio كوسيلة نقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL المحددة صراحةً لـ Meet عبر Chrome أو Twilio باستخدام الإعدادات الافتراضية للصوت في الوقت الفعلي'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-30T08:13:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

دعم مشاركة Google Meet في OpenClaw — تم تصميم Plugin ليكون صريحًا:

- لا ينضم إلا إلى عنوان URL صريح بصيغة `https://meet.google.com/...`.
- يمكنه إنشاء مساحة Meet جديدة عبر Google Meet API، ثم الانضمام إلى
  عنوان URL المُعاد.
- الصوت `realtime` هو الوضع الافتراضي.
- يمكن للصوت في الوقت الحقيقي استدعاء وكيل OpenClaw الكامل عند الحاجة إلى
  استدلال أعمق أو أدوات.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `realtime` للاستماع
  والرد الصوتي المباشرين، أو `transcribe` للانضمام إلى المتصفح والتحكم به دون
  جسر الصوت في الوقت الحقيقي.
- تبدأ المصادقة عبر Google OAuth شخصي أو ملف Chrome شخصي مسجّل دخوله مسبقًا.
- لا يوجد إعلان موافقة تلقائي.
- واجهة الصوت الخلفية الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف عقدة مقترن.
- يقبل Twilio رقم اتصال هاتفيًا مع PIN اختياري أو تسلسل DTMF.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لسير عمل الاجتماعات
  الهاتفية الأوسع للوكلاء.

## البدء السريع

ثبّت اعتماديات الصوت المحلية واضبط مزود صوت في الوقت الحقيقي كواجهة خلفية.
OpenAI هو الافتراضي؛ ويعمل Google Gemini Live أيضًا مع
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

يثبّت `blackhole-2ch` جهاز الصوت الافتراضي `BlackHole 2ch`. يتطلب مثبّت
Homebrew إعادة تشغيل قبل أن يعرض macOS الجهاز:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من الجزأين:

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

تحقّق من الإعداد:

```bash
openclaw googlemeet setup
```

الغرض من مخرجات الإعداد أن تكون قابلة للقراءة من الوكيل وواعية بالوضع. وهي
تبلغ عن ملف Chrome الشخصي، وتثبيت العقدة، وبالنسبة إلى انضمامات Chrome في
الوقت الحقيقي، جسر صوت BlackHole/SoX وفحوصات مقدمة الوقت الحقيقي المؤجلة.
للانضمامات المخصصة للمراقبة فقط، تحقّق من النقل نفسه باستخدام
`--mode transcribe`؛ فهذا الوضع يتجاوز متطلبات الصوت في الوقت الحقيقي لأنه لا
يستمع عبر الجسر ولا يتحدث عبره:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

عند ضبط تفويض Twilio، يبلغ الإعداد أيضًا عما إذا كان Plugin
`voice-call` واعتمادات Twilio جاهزة. تعامل مع أي فحص `ok: false` على أنه
مانع للنقل والوضع اللذين تم فحصهما قبل طلب انضمام وكيل. استخدم
`openclaw googlemeet setup --json` للسكربتات أو المخرجات القابلة للقراءة آليًا.
استخدم `--transport chrome` أو `--transport chrome-node` أو `--transport twilio`
للفحص المسبق لنقل محدد قبل أن يحاول الوكيل استخدامه.

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

أنشئ اجتماعًا جديدًا وانضم إليه:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

أنشئ عنوان URL فقط دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

لدى `googlemeet create` مساران:

- إنشاء عبر API: يُستخدم عند ضبط اعتمادات Google Meet OAuth. هذا هو المسار
  الأكثر حتمية ولا يعتمد على حالة واجهة المتصفح.
- الرجوع إلى المتصفح: يُستخدم عند غياب اعتمادات OAuth. يستخدم OpenClaw عقدة
  Chrome المثبّتة، ويفتح `https://meet.google.com/new`، وينتظر أن يعيد Google
  التوجيه إلى عنوان URL حقيقي برمز اجتماع، ثم يعيد ذلك العنوان. يتطلب هذا
  المسار أن يكون ملف Chrome الشخصي الخاص بـ OpenClaw على العقدة مسجّل الدخول
  مسبقًا إلى Google. تتعامل أتمتة المتصفح مع مطالبة الميكروفون الأولى الخاصة
  بـ Meet؛ ولا تُعامل تلك المطالبة كإخفاق في تسجيل الدخول إلى Google.
  تحاول تدفقات الانضمام والإنشاء أيضًا إعادة استخدام تبويب Meet موجود قبل فتح
  تبويب جديد. تتجاهل المطابقة سلاسل استعلام URL غير الضارة مثل `authuser`، لذا
  ينبغي لمحاولة الوكيل اللاحقة أن تركز على الاجتماع المفتوح مسبقًا بدل إنشاء
  تبويب Chrome ثانٍ.

تتضمن مخرجات الأمر/الأداة حقل `source` (`api` أو `browser`) حتى تتمكن
الوكلاء من شرح المسار المستخدم. ينضم `create` إلى الاجتماع الجديد افتراضيًا
ويعيد `joined: true` بالإضافة إلى جلسة الانضمام. لإنشاء عنوان URL فقط،
استخدم `create --no-join` في CLI أو مرّر `"join": false` إلى الأداة.

أو قل لوكيل: "أنشئ Google Meet، وانضم إليه بصوت في الوقت الحقيقي، وأرسل لي
الرابط." ينبغي للوكيل استدعاء `google_meet` مع `action: "create"` ثم مشاركة
`meetingUri` المُعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

لانضمام مخصص للمراقبة فقط/التحكم بالمتصفح، اضبط `"mode": "transcribe"`. هذا
لا يبدأ جسر نموذج الوقت الحقيقي ثنائي الاتجاه، ولا يتطلب BlackHole أو SoX، ولن
يرد صوتيًا داخل الاجتماع. كما تتجنب انضمامات Chrome في هذا الوضع منح أذونات
الميكروفون/الكاميرا من OpenClaw وتتجنب مسار **استخدام الميكروفون** في Meet. إذا
عرض Meet شاشة اختيار صوت، تحاول الأتمتة مسار عدم استخدام الميكروفون، وإلا
تبلغ عن إجراء يدوي بدل فتح الميكروفون المحلي.

أثناء جلسات الوقت الحقيقي، تتضمن حالة `google_meet` صحة المتصفح وجسر الصوت مثل
`inCall` و`manualActionRequired` و`providerConnected` و`realtimeReady` و
`audioInputActive` و`audioOutputActive` وآخر طوابع زمنية للإدخال/الإخراج
وعدادات البايت وحالة إغلاق الجسر. إذا ظهرت مطالبة آمنة في صفحة Meet، تتعامل
معها أتمتة المتصفح عندما تستطيع. يتم الإبلاغ عن مطالبات تسجيل الدخول، وقبول
المضيف، وأذونات المتصفح/نظام التشغيل كإجراء يدوي مع سبب ورسالة لينقلها
الوكيل. لا تصدر جلسات Chrome المُدارة عبارة المقدمة أو الاختبار إلا بعد أن
تبلغ صحة المتصفح `inCall: true`؛ وإلا فتبلغ الحالة عن `speechReady: false`
وتُحظر محاولة الكلام بدل الادعاء بأن الوكيل تحدث داخل الاجتماع.

تنضم جلسات Chrome المحلية عبر ملف متصفح OpenClaw الشخصي المسجّل الدخول. يتطلب
وضع الوقت الحقيقي `BlackHole 2ch` لمسار الميكروفون/مكبر الصوت الذي يستخدمه
OpenClaw. للحصول على صوت ثنائي الاتجاه نظيف، استخدم أجهزة افتراضية منفصلة أو
رسمًا بيانيًا على نمط Loopback؛ يكفي جهاز BlackHole واحد لاختبار دخاني أولي
لكنه قد يسبب صدى.

### Gateway محلي + Chrome على Parallels

لا تحتاج إلى Gateway كامل من OpenClaw أو مفتاح API لنموذج داخل VM بنظام macOS
لمجرد جعل VM يملك Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل مضيف عقدة في
VM. فعّل Plugin المضمن على VM مرة واحدة حتى تعلن العقدة عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API،
  ومزود الوقت الحقيقي، وضبط Plugin الخاص بـ Google Meet.
- VM بنظام macOS على Parallels: OpenClaw CLI/مضيف العقدة، وGoogle Chrome، وSoX،
  وBlackHole 2ch، وملف Chrome شخصي مسجّل الدخول إلى Google.
- غير مطلوب في VM: خدمة Gateway، أو ضبط الوكيل، أو مفتاح OpenAI/GPT، أو إعداد
  مزود النموذج.

ثبّت اعتماديات VM:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل VM بعد تثبيت BlackHole حتى يعرض macOS جهاز `BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من أن VM يستطيع رؤية جهاز الصوت وأوامر SoX:

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

إذا كان `<gateway-host>` عنوان IP على LAN ولا تستخدم TLS، ترفض العقدة WebSocket
بنص صريح ما لم توافق صراحة على تلك الشبكة الخاصة الموثوقة:

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

تأكد من أن Gateway يرى العقدة وأنها تعلن كلًا من `googlemeet.chrome` وإمكانات
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

الآن انضم بشكل عادي من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اطلب من الوكيل استخدام أداة `google_meet` مع `transport: "chrome-node"`.

لاختبار دخاني بأمر واحد ينشئ جلسة أو يعيد استخدامها، وينطق عبارة معروفة، ويطبع
صحة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام في الوقت الحقيقي، تملأ أتمتة متصفح OpenClaw اسم الضيف، وتنقر
انضمام/طلب الانضمام، وتقبل خيار "استخدام الميكروفون" الأول في Meet عند ظهور
تلك المطالبة. أثناء الانضمام للمراقبة فقط أو إنشاء اجتماع بالمتصفح فقط، تتابع
بعد المطالبة نفسها دون ميكروفون عندما يكون ذلك الخيار متاحًا. إذا لم يكن ملف
المتصفح الشخصي مسجّل الدخول، أو كان Meet ينتظر قبول المضيف، أو كان Chrome
يحتاج إلى إذن ميكروفون/كاميرا لانضمام في الوقت الحقيقي، أو كان Meet عالقًا عند
مطالبة لم تستطع الأتمتة حلها، فإن نتيجة الانضمام/اختبار الكلام تبلغ عن
`manualActionRequired: true` مع `manualActionReason` و
`manualActionMessage`. ينبغي للوكلاء إيقاف إعادة محاولة الانضمام، والإبلاغ عن
تلك الرسالة بالضبط بالإضافة إلى `browserUrl`/`browserTitle` الحاليين، ثم إعادة
المحاولة فقط بعد اكتمال إجراء المتصفح اليدوي.

إذا حُذف `chromeNode.node`، فإن OpenClaw يختار تلقائيًا فقط عندما تعلن عقدة
واحدة متصلة بالضبط عن كل من `googlemeet.chrome` والتحكم بالمتصفح. إذا كانت
عدة عقد قادرة متصلة، فاضبط `chromeNode.node` على معرّف العقدة أو اسم العرض أو
عنوان IP البعيد.

فحوصات الإخفاق الشائعة:

- `Configured Google Meet node ... is not usable: offline`: العقدة المثبّتة
  معروفة لدى Gateway لكنها غير متاحة. يجب أن يتعامل الوكلاء مع تلك العقدة
  كحالة تشخيصية، لا كمضيف Chrome قابل للاستخدام، وأن يبلّغوا عن عائق الإعداد
  بدلاً من الرجوع إلى وسيلة نقل أخرى ما لم يطلب المستخدم ذلك.
- `No connected Google Meet-capable node`: شغّل `openclaw node run` في الجهاز الافتراضي،
  ووافق على الإقران، وتأكد من تشغيل `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` في الجهاز الافتراضي. أكّد أيضاً أن مضيف
  Gateway يسمح بكلا أمري العقدة عبر
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: ثبّت `blackhole-2ch` على المضيف
  الذي يتم فحصه وأعد التشغيل قبل استخدام صوت Chrome المحلي.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في الجهاز الافتراضي وأعد تشغيل الجهاز الافتراضي.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف تعريف المتصفح داخل الجهاز الافتراضي، أو
  أبقِ `chrome.guestName` مضبوطاً للانضمام كضيف. يستخدم الانضمام التلقائي كضيف أتمتة
  متصفح OpenClaw عبر وكيل متصفح العقدة؛ تأكد من أن إعدادات متصفح العقدة
  تشير إلى ملف التعريف الذي تريده، مثلاً
  `browser.defaultProfile: "user"` أو ملف تعريف جلسة موجودة مسمّى.
- علامات تبويب Meet مكررة: اترك `chrome.reuseExistingTab: true` مفعّلاً. يفعّل OpenClaw
  علامة تبويب موجودة لعنوان Meet نفسه قبل فتح علامة جديدة، كما أن إنشاء
  اجتماع عبر المتصفح يعيد استخدام علامة تبويب `https://meet.google.com/new`
  قيد التقدم أو علامة مطالبة حساب Google قبل فتح علامة أخرى.
- لا يوجد صوت: في Meet، وجّه صوت الميكروفون/السماعة عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيهاً بنمط Loopback
  للحصول على صوت مزدوج الاتجاه نظيف.

## ملاحظات التثبيت

يستخدم إعداد Chrome الفوري الافتراضي أداتين خارجيتين:

- `sox`: أداة صوتية لسطر الأوامر. يستخدم Plugin أوامر جهاز CoreAudio
  صريحة لجسر الصوت الافتراضي PCM16 بتردد 24 kHz.
- `blackhole-2ch`: مشغل صوت افتراضي لنظام macOS. ينشئ جهاز الصوت `BlackHole 2ch`
  الذي يمكن لـ Chrome/Meet التوجيه عبره.

لا يضمّن OpenClaw أياً من الحزمتين ولا يعيد توزيعهما. تطلب الوثائق من المستخدمين
تثبيتهما كاعتماديات مضيف عبر Homebrew. SoX مرخّص وفق
`LGPL-2.0-only AND GPL-2.0-only`؛ وBlackHole مرخّص وفق GPL-3.0. إذا أنشأت
مثبّتاً أو جهازاً يضمّن BlackHole مع OpenClaw، فراجع شروط ترخيص BlackHole
الأصلية أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

تفتح وسيلة نقل Chrome عنوان Meet عبر تحكم متصفح OpenClaw وتنضم
بملف تعريف متصفح OpenClaw المسجّل دخوله. على macOS، يتحقق Plugin من
`BlackHole 2ch` قبل التشغيل. وإذا كان مضبوطاً، فإنه يشغّل أيضاً أمر صحة جسر
الصوت وأمر بدء التشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت
على مضيف Gateway؛ واستخدم `chrome-node` عندما يكون Chrome/الصوت
على عقدة مقترنة مثل جهاز Parallels macOS افتراضي. بالنسبة إلى Chrome المحلي، اختر
ملف التعريف باستخدام `browser.defaultProfile`؛ ويتم تمرير `chrome.browserProfile` إلى
مضيفي `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون Chrome والسماعة عبر جسر صوت OpenClaw المحلي.
إذا لم يكن `BlackHole 2ch` مثبتاً، يفشل الانضمام مع خطأ إعداد
بدلاً من الانضمام بصمت من دون مسار صوت.

### Twilio

وسيلة نقل Twilio هي خطة اتصال صارمة مفوّضة إلى Plugin المكالمات الصوتية. وهي
لا تحلل صفحات Meet لاستخراج أرقام الهاتف.

استخدمها عندما لا تكون مشاركة Chrome متاحة أو عندما تريد بديلاً للاتصال الهاتفي.
يجب أن يوفّر Google Meet رقم اتصال هاتفي ورمز PIN للاجتماع؛ لا يكتشف OpenClaw
ذلك من صفحة Meet.

فعّل Plugin المكالمات الصوتية على مضيف Gateway، لا على عقدة Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // أو اضبط "twilio" إذا كان ينبغي أن تكون Twilio هي الافتراضية
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

وفّر بيانات اعتماد Twilio عبر البيئة أو الإعدادات. تُبقي البيئة
الأسرار خارج `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

أعد تشغيل Gateway أو أعد تحميله بعد تفعيل `voice-call`؛ لا تظهر تغييرات إعدادات
Plugin في عملية Gateway قيد التشغيل مسبقاً إلى أن يُعاد تحميلها.

ثم تحقّق:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

عند توصيل تفويض Twilio، يتضمن `googlemeet setup` فحوصات ناجحة لـ
`twilio-voice-call-plugin` و`twilio-voice-call-credentials`.

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
إلى أتمتة المتصفح. اضبط OAuth عندما تريد الإنشاء عبر API الرسمية،
أو حلّ المساحات، أو فحوصات Meet Media API المسبقة.

يستخدم وصول Google Meet API OAuth للمستخدم: أنشئ عميل Google Cloud OAuth،
واطلب النطاقات المطلوبة، وفوّض حساب Google، ثم خزّن
رمز التحديث الناتج في إعدادات Plugin Google Meet أو وفّر
متغيرات البيئة `OPENCLAW_GOOGLE_MEET_*`.

لا يستبدل OAuth مسار الانضمام عبر Chrome. لا تزال وسائل نقل Chrome وChrome-node
تنضم عبر ملف تعريف Chrome مسجّل دخوله، وBlackHole/SoX، وعقدة متصلة
عند استخدام مشاركة المتصفح. OAuth مخصص فقط لمسار Google Meet API الرسمي:
إنشاء مساحات الاجتماعات، وحلّ المساحات، وتشغيل فحوصات Meet Media API المسبقة.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو حدده.
2. فعّل **Google Meet REST API** لذلك المشروع.
3. اضبط شاشة موافقة OAuth.
   - **Internal** هو الأبسط لمؤسسة Google Workspace.
   - **External** يعمل للإعدادات الشخصية/الاختبارية؛ أثناء كون التطبيق في Testing،
     أضف كل حساب Google سيفوّض التطبيق كمستخدم اختبار.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرّف عميل OAuth.
   - نوع التطبيق: **Web application**.
   - عنوان URI لإعادة التوجيه المصرّح به:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرّف العميل وسر العميل.

`meetings.space.created` مطلوب بواسطة Google Meet `spaces.create`.
يتيح `meetings.space.readonly` لـ OpenClaw حل عناوين/رموز Meet إلى مساحات.
`meetings.conference.media.readonly` مخصص للفحص المسبق لـ Meet Media API وعمل الوسائط؛
قد تطلب Google التسجيل في Developer Preview للاستخدام الفعلي لـ Media API.
إذا كنت تحتاج فقط إلى انضمامات Chrome المعتمدة على المتصفح، فتجاوز OAuth بالكامل.

### إصدار رمز التحديث

اضبط `oauth.clientId` واختيارياً `oauth.clientSecret`، أو مررهما كمتغيرات
بيئة، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعدادات `oauth` تتضمن رمز تحديث. يستخدم PKCE،
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
إذا كانت قيم الإعدادات والبيئة موجودة معاً، يحل Plugin الإعدادات
أولاً ثم يستخدم البيئة كبديل.

تتضمن موافقة OAuth إنشاء مساحة Meet، ووصول قراءة مساحة Meet، ووصول قراءة وسائط
مؤتمر Meet. إذا كنت قد صادقت قبل وجود دعم إنشاء الاجتماعات،
فأعد تشغيل `openclaw googlemeet auth login --json` كي يحتوي رمز التحديث على نطاق
`meetings.space.created`.

### التحقق من OAuth باستخدام الطبيب

شغّل طبيب OAuth عندما تريد فحص صحة سريعاً من دون أسرار:

```bash
openclaw googlemeet doctor --oauth --json
```

لا يحمّل هذا وقت تشغيل Chrome ولا يتطلب عقدة Chrome متصلة. إنه
يتحقق من وجود إعدادات OAuth ومن قدرة رمز التحديث على إصدار رمز
وصول. يتضمن تقرير JSON حقول حالة فقط مثل `ok`، و`configured`،
و`tokenSource`، و`expiresAt`، ورسائل الفحص؛ ولا يطبع رمز الوصول
أو رمز التحديث أو سر العميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | يوجد `oauth.clientId` مع `oauth.refreshToken`، أو رمز وصول مخزّن مؤقتاً.       |
| `oauth-token`        | لا يزال رمز الوصول المخزّن مؤقتاً صالحاً، أو أصدر رمز التحديث رمز وصول جديداً. |
| `meet-spaces-get`    | حلّ فحص `--meeting` الاختياري مساحة Meet موجودة.                             |
| `meet-spaces-create` | أنشأ فحص `--create-space` الاختياري مساحة Meet جديدة.                               |

لإثبات تفعيل Google Meet API ونطاق `spaces.create` أيضاً، شغّل
فحص الإنشاء ذي الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

ينشئ `--create-space` عنوان Meet مؤقتاً. استخدمه عندما تحتاج إلى تأكيد
أن مشروع Google Cloud فعّل Meet API وأن الحساب المصرّح له يملك نطاق
`meetings.space.created`.

لإثبات وصول القراءة لمساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` وصول القراءة إلى مساحة
موجودة يستطيع حساب Google المصرّح له الوصول إليها. تعني استجابة `403` من هذه الفحوصات
عادة أن Google Meet REST API معطّل، أو أن رمز التحديث الموافق عليه
يفتقد النطاق المطلوب، أو أن حساب Google لا يستطيع الوصول إلى مساحة Meet
تلك. يعني خطأ رمز التحديث إعادة تشغيل `openclaw googlemeet auth login
--json` وتخزين كتلة `oauth` الجديدة.

لا حاجة إلى بيانات اعتماد OAuth للرجوع إلى المتصفح. في ذلك الوضع، تأتي مصادقة Google
من ملف تعريف Chrome المسجّل دخوله على العقدة المحددة، لا من
إعدادات OpenClaw.

تُقبل متغيرات البيئة هذه كبدائل:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

حل عنوان URL لـ Meet أو الرمز أو `spaces/{id}` عبر `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

شغّل الفحص التمهيدي قبل عمل الوسائط:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اعرض عناصر الاجتماع وحضور الاجتماع بعد أن ينشئ Meet سجلات المؤتمر:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

مع `--meeting`، يستخدم `artifacts` و`attendance` أحدث سجل مؤتمر
افتراضيًا. مرّر `--all-conference-records` عندما تريد كل سجل محتفَظ به
لذلك الاجتماع.

يمكن أن يحل بحث التقويم عنوان URL للاجتماع من Google Calendar قبل قراءة
عناصر Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` لليوم عن حدث Calendar يتضمن رابط
Google Meet. استخدم `--event <query>` للبحث في نص الحدث المطابق، و
`--calendar <id>` لتقويم غير أساسي. يتطلب بحث التقويم تسجيل دخول OAuth حديثًا
يتضمن نطاق القراءة فقط لأحداث Calendar.
يعاين `calendar-events` أحداث Meet المطابقة ويميّز الحدث الذي سيختاره
`latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف معرّف سجل المؤتمر مسبقًا، فخاطبه مباشرة:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

يعيد `artifacts` بيانات تعريف سجل المؤتمر بالإضافة إلى بيانات تعريف موارد المشاركين
والتسجيلات والنصوص المنسوخة ومدخلات النص المنسوخ المنظمة والملاحظات الذكية عندما
تتيحها Google للاجتماع. استخدم `--no-transcript-entries` لتخطي
البحث عن المدخلات في الاجتماعات الكبيرة. يوسّع `attendance` المشاركين إلى
صفوف جلسات مشاركين مع أوقات أول/آخر ظهور، وإجمالي مدة الجلسة،
وعلامات التأخر/المغادرة المبكرة، ودمج موارد المشاركين المكررة حسب المستخدم
المسجّل دخوله أو اسم العرض. مرّر `--no-merge-duplicates` لإبقاء موارد
المشاركين الأولية منفصلة، و`--late-after-minutes` لضبط اكتشاف التأخر، و
`--early-before-minutes` لضبط اكتشاف المغادرة المبكرة.

يكتب `export` مجلدًا يحتوي على `summary.md` و`attendance.csv`
و`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`.
يسجل `manifest.json` الإدخال المختار وخيارات التصدير وسجلات المؤتمر
وملفات الإخراج والأعداد ومصدر الرمز المميز وحدث Calendar عند استخدامه وأي
تحذيرات استرجاع جزئي. مرّر `--zip` لكتابة أرشيف قابل للنقل أيضًا بجانب
المجلد. مرّر `--include-doc-bodies` لتصدير نصوص Google Docs للنصوص
المنسوخة والملاحظات الذكية المرتبطة عبر Google Drive `files.export`؛ يتطلب ذلك
تسجيل دخول OAuth حديثًا يتضمن نطاق القراءة فقط لـ Drive Meet. بدون
`--include-doc-bodies`، تتضمن التصديرات بيانات تعريف Meet ومدخلات النص
المنسوخ المنظمة فقط. إذا أعادت Google فشلًا جزئيًا في عنصر، مثل خطأ في
قائمة الملاحظات الذكية أو مدخل النص المنسوخ أو متن مستند Drive، يحتفظ الملخص
والبيان بالتحذير بدلًا من إفشال التصدير بأكمله.
استخدم `--dry-run` لجلب بيانات العناصر/الحضور نفسها وطباعة JSON البيان
دون إنشاء المجلد أو ملف ZIP. يفيد ذلك قبل كتابة تصدير كبير أو عندما يحتاج
وكيل فقط إلى الأعداد والسجلات المحددة والتحذيرات.

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

اضبط `"dryRun": true` لإرجاع بيان التصدير فقط وتخطي كتابة الملفات.

شغّل اختبار الدخان الحي المحروس على اجتماع حقيقي محتفَظ به:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

بيئة اختبار الدخان الحي:

- يفعّل `OPENCLAW_LIVE_TEST=1` الاختبارات الحية المحروسة.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL لـ Meet محتفَظ به أو رمز أو
  `spaces/{id}`.
- يوفر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرّف عميل OAuth.
- يوفر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
  رمز التحديث.
- اختياري: يستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء الرجوع نفسها
  بدون بادئة `OPENCLAW_`.

يحتاج اختبار الدخان الحي الأساسي للعناصر/الحضور إلى
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. يحتاج بحث Calendar
إلى `https://www.googleapis.com/auth/calendar.events.readonly`. يحتاج تصدير
متن مستند Drive إلى
`https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد والمصدر وجلسة الانضمام. مع بيانات اعتماد OAuth،
يستخدم Google Meet API الرسمي. بدون بيانات اعتماد OAuth، يستخدم ملف تعريف
المتصفح المسجّل دخوله الخاص بعقدة Chrome المثبتة كحل رجوع. يمكن للوكلاء
استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في
خطوة واحدة. للإنشاء بعنوان URL فقط، مرّر `"join": false`.

مثال على إخراج JSON من حل الرجوع عبر المتصفح:

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

إذا واجه حل الرجوع عبر المتصفح تسجيل دخول Google أو مانع أذونات Meet قبل أن
يتمكن من إنشاء عنوان URL، يعيد أسلوب Gateway استجابة فاشلة وتعيد أداة
`google_meet` تفاصيل منظمة بدلًا من سلسلة نصية عادية:

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

عندما يرى وكيل `manualActionRequired: true`، ينبغي أن يبلّغ
`manualActionMessage` مع سياق عقدة/علامة تبويب المتصفح وأن يتوقف عن فتح
علامات تبويب Meet جديدة إلى أن يكمل المشغّل خطوة المتصفح.

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

ينضم إنشاء Meet افتراضيًا. لا يزال نقل Chrome أو عقدة Chrome يحتاج إلى
ملف تعريف Google Chrome مسجّل دخوله للانضمام عبر المتصفح. إذا كان ملف
التعريف مسجّل الخروج، يبلّغ OpenClaw عن `manualActionRequired: true` أو
خطأ رجوع عبر المتصفح ويطلب من المشغّل إكمال تسجيل دخول Google قبل إعادة
المحاولة.

اضبط `preview.enrollmentAcknowledged: true` فقط بعد تأكيد أن مشروع Cloud
ومسؤول OAuth والمشاركين في الاجتماع مسجلون في Google Workspace Developer
Preview Program لواجهات Meet media APIs.

## التكوين

لا يحتاج مسار Chrome الفوري الشائع إلا إلى تفعيل Plugin، وBlackHole، وSoX،
ومفتاح مزود صوت فوري خلفي. OpenAI هو الافتراضي؛ اضبط
`realtime.provider: "google"` لاستخدام Google Gemini Live:

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

القيم الافتراضية:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: معرّف/اسم/IP اختياري للعقدة لـ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم في شاشة ضيف Meet
  غير المسجّل دخوله
- `chrome.autoJoin: true`: تعبئة اسم الضيف والنقر على Join Now بأفضل جهد
  عبر أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تنشيط علامة تبويب Meet موجودة بدلًا من
  فتح نسخ مكررة
- `chrome.waitForInCallMs: 20000`: الانتظار حتى تبلّغ علامة تبويب Meet أنها داخل المكالمة
  قبل تشغيل المقدمة الفورية
- `chrome.audioFormat: "pcm16-24khz"`: تنسيق الصوت لزوج الأوامر. استخدم
  `"g711-ulaw-8khz"` فقط لأزواج الأوامر القديمة/المخصصة التي لا تزال تصدر
  صوتًا هاتفيًا.
- `chrome.audioInputCommand`: أمر SoX يقرأ من CoreAudio `BlackHole 2ch`
  ويكتب الصوت بتنسيق `chrome.audioFormat`
- `chrome.audioOutputCommand`: أمر SoX يقرأ الصوت بتنسيق `chrome.audioFormat`
  ويكتب إلى CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود صوتية موجزة، مع
  `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية صوتي قصير عندما يتصل الجسر الفوري؛
  اضبطه على `""` للانضمام بصمت
- `realtime.agentId`: معرّف وكيل OpenClaw اختياري لـ
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

القيمة الافتراضية لـ `voiceCall.enabled` هي `true`؛ مع نقل Twilio، يفوّض
مكالمة PSTN الفعلية وDTMF إلى Plugin المكالمات الصوتية. إذا لم يكن
`voice-call` مفعّلًا، فلا يزال Google Meet قادرًا على التحقق من خطة الاتصال
وتسجيلها، لكنه لا يستطيع إجراء مكالمة Twilio.

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

استخدم `transport: "chrome"` عندما يعمل Chrome على مضيف Gateway. استخدم
`transport: "chrome-node"` عندما يعمل Chrome على عقدة مقترنة مثل جهاز Parallels
VM. في كلتا الحالتين، يعمل نموذج الوقت الفعلي و`openclaw_agent_consult` على مضيف
Gateway، لذا تبقى بيانات اعتماد النموذج هناك.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. استخدم
`action: "speak"` مع `sessionId` و`message` لجعل وكيل الوقت الفعلي
يتحدث فورًا. استخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها،
وتشغيل عبارة معروفة، وإرجاع صحة `inCall` عندما يمكن لمضيف Chrome
الإبلاغ عنها. يفرض `test_speech` دائمًا `mode: "realtime"` ويفشل إذا طُلب منه
العمل في `mode: "transcribe"` لأن جلسات المراقبة فقط لا يمكنها عمدًا
إصدار كلام. تستند نتيجة `speechOutputVerified` الخاصة به إلى زيادة بايتات خرج
الصوت في الوقت الفعلي أثناء استدعاء الاختبار هذا، لذلك لا تُحتسب الجلسة المعاد
استخدامها ذات الصوت الأقدم كفحص كلام ناجح جديد. استخدم `action: "leave"` لتمييز
الجلسة على أنها منتهية.

يتضمن `status` صحة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج
  ملف تعريف المتصفح إلى تسجيل دخول يدوي، أو قبول من مضيف Meet، أو أذونات، أو
  إصلاح التحكم في المتصفح قبل أن يعمل الكلام
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ما إذا كان
  كلام Chrome المُدار مسموحًا به الآن. تعني `speechReady: false` أن OpenClaw لم
  يرسل عبارة المقدمة/الاختبار إلى جسر الصوت.
- `providerConnected` / `realtimeReady`: حالة جسر الصوت في الوقت الفعلي
- `lastInputAt` / `lastOutputAt`: آخر صوت شوهد من الجسر أو أُرسل إليه

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## استشارة وكيل الوقت الفعلي

وضع Chrome للوقت الفعلي محسّن لحلقة صوتية مباشرة. يسمع مزود الصوت في الوقت
الفعلي صوت الاجتماع ويتحدث عبر جسر الصوت المُهيأ. عندما يحتاج نموذج الوقت
الفعلي إلى تفكير أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية، يمكنه
استدعاء `openclaw_agent_consult`.

تشغّل أداة الاستشارة وكيل OpenClaw العادي في الخلفية مع سياق نص الاجتماع
الأخير وتعيد إجابة منطوقة موجزة إلى جلسة الصوت في الوقت الفعلي. يمكن لنموذج
الصوت بعد ذلك قول تلك الإجابة داخل الاجتماع. وهي تستخدم أداة استشارة الوقت
الفعلي المشتركة نفسها مثل Voice Call.

افتراضيًا، تعمل الاستشارات مقابل الوكيل `main`. عيّن `realtime.agentId` عندما
ينبغي لمسار Meet أن يستشير مساحة عمل مخصصة لوكيل OpenClaw، وافتراضات النموذج،
وسياسة الأدوات، والذاكرة، وسجل الجلسات.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: إظهار أداة الاستشارة وحصر الوكيل العادي في
  `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و
  `memory_get`.
- `owner`: إظهار أداة الاستشارة والسماح للوكيل العادي باستخدام سياسة أدوات
  الوكيل المعتادة.
- `none`: عدم إظهار أداة الاستشارة لنموذج الصوت في الوقت الفعلي.

يكون مفتاح جلسة الاستشارة محدود النطاق لكل جلسة Meet، لذلك يمكن لاستدعاءات
الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد أن ينضم Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

لاختبار الدخان الكامل للانضمام والتحدث:

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
  هو النقل الافتراضي أو تكون عقدة مثبّتة.
- يعرض `nodes status` العقدة المحددة متصلة.
- تعلن العقدة المحددة عن كل من `googlemeet.chrome` و`browser.proxy`.
- ينضم تبويب Meet إلى المكالمة ويعيد `test-speech` صحة Chrome مع
  `inCall: true`.

بالنسبة إلى مضيف Chrome بعيد مثل جهاز Parallels macOS VM، فهذا هو أقصر فحص آمن
بعد تحديث Gateway أو الجهاز الافتراضي:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن Gateway Plugin محمّل، وأن عقدة VM متصلة بالرمز الحالي، وأن جسر صوت
Meet متاح قبل أن يفتح وكيل تبويب اجتماع حقيقي.

لاختبار دخان Twilio، استخدم اجتماعًا يعرض تفاصيل الاتصال الهاتفي:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

حالة Twilio المتوقعة:

- يتضمن `googlemeet setup` فحصَي `twilio-voice-call-plugin` و
  `twilio-voice-call-credentials` باللون الأخضر.
- يكون `voicecall` متاحًا في CLI بعد إعادة تحميل Gateway.
- تحتوي الجلسة المُعادة على `transport: "twilio"` و`twilio.voiceCallId`.
- يؤدي `googlemeet leave <sessionId>` إلى إنهاء الاتصال الصوتي المفوّض.

## استكشاف الأخطاء وإصلاحها

### لا يستطيع الوكيل رؤية أداة Google Meet

تأكد من تمكين Plugin في إعدادات Gateway وأعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد عدّلت للتو `plugins.entries.google-meet`، فأعد تشغيل Gateway أو أعد
تحميله. لا يرى الوكيل العامل إلا أدوات Plugin المسجلة بواسطة عملية Gateway
الحالية.

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
`browser.proxy`. يجب أن تسمح إعدادات Gateway بأوامر العقدة تلك:

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
`gateway token mismatch`، فأعد تثبيت العقدة أو أعد تشغيلها برمز Gateway الحالي.
بالنسبة إلى Gateway على شبكة LAN، يعني هذا عادةً:

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

شغّل `googlemeet test-speech` وافحص صحة Chrome المُعادة. إذا أبلغت عن
`manualActionRequired: true`، فاعرض `manualActionMessage` على المشغّل وتوقف عن
إعادة المحاولة حتى يكتمل إجراء المتصفح.

الإجراءات اليدوية الشائعة:

- سجّل الدخول إلى ملف تعريف Chrome.
- اقبل الضيف من حساب مضيف Meet.
- امنح أذونات ميكروفون/كاميرا Chrome عند ظهور مطالبة الأذونات الأصلية في
  Chrome.
- أغلق أو أصلح مربع حوار أذونات Meet العالق.

لا تبلغ عن "not signed in" لمجرد أن Meet يعرض "Do you want people to
hear you in the meeting?" فهذا حاجز اختيار الصوت في Meet؛ ينقر OpenClaw على
**Use microphone** عبر أتمتة المتصفح عندما تكون متاحة ويستمر في انتظار حالة
الاجتماع الحقيقية. بالنسبة إلى بديل المتصفح الخاص بالإنشاء فقط، قد ينقر
OpenClaw على **Continue without microphone** لأن إنشاء عنوان URL لا يحتاج إلى
مسار صوت الوقت الفعلي.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` أولًا نقطة نهاية Google Meet API `spaces.create`
عندما تكون بيانات اعتماد OAuth مهيأة. من دون بيانات اعتماد OAuth، يعود إلى
متصفح عقدة Chrome المثبّتة. تأكد مما يلي:

- لإنشاء API: تم تكوين `oauth.clientId` و`oauth.refreshToken`، أو وجود متغيرات
  البيئة المطابقة `OPENCLAW_GOOGLE_MEET_*`.
- لإنشاء API: تم سك رمز التحديث بعد إضافة دعم الإنشاء. قد تفتقد الرموز الأقدم
  نطاق `meetings.space.created`؛ أعد تشغيل `openclaw googlemeet auth login --json`
  وحدّث إعدادات Plugin.
- لبديل المتصفح: يشير `defaultTransport: "chrome-node"` و`chromeNode.node` إلى
  عقدة متصلة تحتوي على `browser.proxy` و`googlemeet.chrome`.
- لبديل المتصفح: ملف تعريف OpenClaw Chrome على تلك العقدة مسجّل الدخول إلى
  Google ويمكنه فتح `https://meet.google.com/new`.
- لبديل المتصفح: تعيد المحاولات استخدام تبويب `https://meet.google.com/new` أو
  تبويب مطالبة حساب Google موجود قبل فتح تبويب جديد. إذا انتهت مهلة وكيل، فأعد
  محاولة استدعاء الأداة بدلًا من فتح تبويب Meet آخر يدويًا.
- لبديل المتصفح: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم
  `browser.nodeId` و`browser.targetId` و`browserUrl` و`manualActionMessage`
  المُعادة لإرشاد المشغّل. لا تعد المحاولة في حلقة حتى يكتمل ذلك الإجراء.
- لبديل المتصفح: إذا عرض Meet "Do you want people to hear you in the
  meeting?"، فاترك التبويب مفتوحًا. ينبغي أن ينقر OpenClaw على **Use microphone**
  أو، لبديل الإنشاء فقط، **Continue without microphone** عبر أتمتة المتصفح
  ويواصل انتظار عنوان URL المُنشأ لـ Meet. إذا لم يستطع، ينبغي أن يذكر الخطأ
  `meet-audio-choice-required`، وليس `google-login-required`.

### ينضم الوكيل لكنه لا يتحدث

افحص مسار الوقت الفعلي:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "realtime"` للاستماع/الرد بالكلام. لا يبدأ `mode: "transcribe"`
عمدًا جسر الصوت المزدوج في الوقت الفعلي. يفحص `googlemeet test-speech` دائمًا
مسار الوقت الفعلي ويبلغ عما إذا كانت بايتات خرج الجسر قد لوحظت لذلك الاستدعاء.
إذا كان `speechOutputVerified` خطأ وكان `speechOutputTimedOut` صحيحًا، فربما
قبل مزود الوقت الفعلي العبارة لكن OpenClaw لم يرَ بايتات خرج جديدة تصل إلى جسر
صوت Chrome.

تحقق أيضًا من:

- توفر مفتاح مزود وقت فعلي على مضيف Gateway، مثل `OPENAI_API_KEY` أو
  `GEMINI_API_KEY`.
- ظهور `BlackHole 2ch` على مضيف Chrome.
- وجود `sox` على مضيف Chrome.
- توجيه ميكروفون Meet ومكبر الصوت عبر مسار الصوت الافتراضي الذي يستخدمه
  OpenClaw.

يطبع `googlemeet doctor [session-id]` الجلسة، والعقدة، وحالة التواجد داخل
المكالمة، وسبب الإجراء اليدوي، واتصال مزود الوقت الفعلي، و`realtimeReady`،
ونشاط إدخال/إخراج الصوت، وآخر طوابع زمنية للصوت، وعدادات البايت، وعنوان URL
للمتصفح. استخدم `googlemeet status [session-id]` عندما تحتاج إلى JSON الخام.
استخدم `googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث OAuth الخاص
بـ Google Meet من دون كشف الرموز؛ أضف `--meeting` أو `--create-space` عندما
تحتاج أيضًا إلى دليل Google Meet API.

إذا انتهت مهلة وكيل ويمكنك رؤية تبويب Meet مفتوحًا بالفعل، فافحص ذلك التبويب
من دون فتح تبويب آخر:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. يركز ويفحص تبويب Meet موجودًا
للنقل المحدد. مع `chrome`، يستخدم التحكم المحلي في المتصفح عبر Gateway؛ ومع
`chrome-node`، يستخدم عقدة Chrome المهيأة. لا يفتح تبويبًا جديدًا ولا ينشئ جلسة
جديدة؛ بل يبلغ عن العائق الحالي، مثل تسجيل الدخول، أو القبول، أو الأذونات، أو
حالة اختيار الصوت. يتحدث أمر CLI إلى Gateway المهيأ، لذا يجب أن يكون Gateway
قيد التشغيل؛ ويتطلب `chrome-node` أيضًا أن تكون عقدة Chrome متصلة.

### فشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا به أو غير مفعّل.
أضفه إلى `plugins.allow`، وفعّل `plugins.entries.voice-call`، ثم أعد تحميل
Gateway.

يفشل `twilio-voice-call-credentials` عندما تفتقد واجهة Twilio الخلفية إلى معرّف
الحساب SID أو رمز المصادقة أو رقم المتصل. عيّن هذه القيم على مضيف Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

ثم أعد تشغيل Gateway أو أعد تحميله وشغّل:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

يكون `voicecall smoke` للتحقق من الجاهزية فقط افتراضيًا. لإجراء تشغيل تجريبي لرقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

أضف `--yes` فقط عندما تريد عن قصد إجراء مكالمة إشعار صادرة مباشرة:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تبدأ مكالمة Twilio لكنها لا تدخل الاجتماع أبدًا

تأكد من أن حدث Meet يعرض تفاصيل الاتصال الهاتفي. مرّر رقم الاتصال الهاتفي
الدقيق ورقم PIN أو تسلسل DTMF مخصصًا:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم `w` بادئة أو فواصل في `--dtmf-sequence` إذا كان المزوّد يحتاج إلى توقف مؤقت
قبل إدخال رقم PIN.

## ملاحظات

واجهة API الرسمية للوسائط في Google Meet موجّهة للاستقبال، لذلك لا يزال التحدث في
مكالمة Meet يحتاج إلى مسار مشارك. يحافظ هذا Plugin على وضوح هذا الحد:
يتولى Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ ويتولى Twilio
المشاركة عبر الاتصال الهاتفي.

يحتاج وضع Chrome الفوري إلى `BlackHole 2ch` بالإضافة إلى أحد الخيارين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يمتلك OpenClaw جسر
  النموذج الفوري ويمرر الصوت بتنسيق `chrome.audioFormat` بين تلك الأوامر
  ومزوّد الصوت الفوري المحدد. مسار Chrome الافتراضي هو
  24 kHz PCM16؛ ويظل 8 kHz G.711 mu-law متاحًا لأزواج الأوامر القديمة.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي بالكامل
  ويجب أن يخرج بعد بدء عفريته أو التحقق منه.

للحصول على صوت مزدوج نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة افتراضية منفصلة
أو رسم بياني لجهاز افتراضي بنمط Loopback. يمكن لجهاز BlackHole مشترك واحد أن
يعيد صدى المشاركين الآخرين إلى المكالمة.

يشغّل `googlemeet speak` جسر الصوت الفوري النشط لجلسة Chrome. يوقف
`googlemeet leave` ذلك الجسر. بالنسبة إلى جلسات Twilio المفوّضة عبر Voice Call Plugin،
ينهي `leave` أيضًا المكالمة الصوتية الأساسية.

## ذو صلة

- [Voice call Plugin](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
