---
read_when:
    - أنت تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - أنت تريد أن ينشئ وكيل OpenClaw مكالمة Google Meet جديدة
    - أنت تقوم بتكوين Chrome أو Node الخاص بـ Chrome أو Twilio كوسيلة نقل لـ Google Meet
summary: 'إضافة Google Meet: الانضمام إلى عناوين URL الخاصة بـ Meet المحددة عبر Chrome أو Twilio مع الإعدادات الافتراضية للصوت في الوقت الفعلي'
title: إضافة Google Meet
x-i18n:
    generated_at: "2026-04-26T11:36:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

دعم المشاركين في Google Meet لـ OpenClaw — الإضافة صريحة في تصميمها:

- تنضم فقط إلى عنوان URL صريح من نوع `https://meet.google.com/...`.
- يمكنها إنشاء مساحة Meet جديدة عبر Google Meet API، ثم الانضمام إلى عنوان URL المُعاد.
- الصوت `realtime` هو الوضع الافتراضي.
- يمكن للصوت في الوقت الفعلي الرجوع إلى وكيل OpenClaw الكامل عند الحاجة إلى استدلال أعمق أو أدوات إضافية.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `realtime` للاستماع المباشر/الرد الصوتي، أو `transcribe` للانضمام/التحكم في المتصفح من دون جسر الصوت في الوقت الفعلي.
- تبدأ المصادقة كـ Google OAuth شخصي أو عبر ملف تعريف Chrome مسجّل الدخول مسبقًا.
- لا يوجد إعلان موافقة تلقائي.
- الواجهة الخلفية الصوتية الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف Node مقترن.
- يقبل Twilio رقم اتصال هاتفي مع PIN اختياري أو تسلسل DTMF.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لسير عمل المؤتمرات الهاتفية الأوسع الخاصة بالوكلاء.

## البدء السريع

ثبّت تبعيات الصوت المحلية واضبط موفّر صوت في الوقت الفعلي في الواجهة الخلفية. OpenAI هو الافتراضي؛ كما يعمل Google Gemini Live أيضًا مع
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

يقوم `blackhole-2ch` بتثبيت جهاز الصوت الافتراضي `BlackHole 2ch`. ويتطلب مثبّت Homebrew
إعادة تشغيل قبل أن يكشف macOS عن الجهاز:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من الجزأين معًا:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

فعّل الإضافة:

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

صُمّم خرج الإعداد ليكون قابلًا للقراءة من قبل الوكيل. فهو يعرض ملف تعريف Chrome،
وجسر الصوت، وتثبيت Node، والمقدمة المتأخرة للصوت في الوقت الفعلي، وعند تكوين تفويض Twilio،
ما إذا كانت إضافة `voice-call` وبيانات اعتماد Twilio جاهزة.
تعامل مع أي فحص `ok: false` على أنه عائق يجب حله قبل أن تطلب من وكيل الانضمام.
استخدم `openclaw googlemeet setup --json` للنصوص البرمجية أو للخرج القابل للقراءة آليًا.
استخدم `--transport chrome` أو `--transport chrome-node` أو `--transport twilio`
لفحص وسيلة نقل محددة مسبقًا قبل أن يحاولها الوكيل.

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

أنشئ عنوان URL فقط من دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

لدى `googlemeet create` مساران:

- إنشاء عبر API: يُستخدم عند تكوين بيانات اعتماد Google Meet OAuth. وهذا
  هو المسار الأكثر حتمية ولا يعتمد على حالة واجهة مستخدم المتصفح.
- رجوع احتياطي عبر المتصفح: يُستخدم عند غياب بيانات اعتماد OAuth. يستخدم OpenClaw
  Chrome node المثبّت، ويفتح `https://meet.google.com/new`، وينتظر حتى تعيد Google
  التوجيه إلى عنوان URL فعلي لرمز الاجتماع، ثم يعيد ذلك العنوان. يتطلب هذا المسار
  أن يكون ملف تعريف OpenClaw Chrome على الـ node قد سجّل الدخول بالفعل إلى Google.
  تتعامل أتمتة المتصفح مع مطالبة الميكروفون الخاصة بـ Meet في أول تشغيل؛ ولا تُعتبر
  تلك المطالبة فشلًا في تسجيل الدخول إلى Google.
  تحاول أيضًا تدفقات الانضمام والإنشاء إعادة استخدام علامة تبويب Meet موجودة قبل فتح
  واحدة جديدة. وتتجاهل المطابقة سلاسل استعلام URL غير المؤثرة مثل `authuser`، لذلك
  يجب أن يركّز إعادة محاولة الوكيل على الاجتماع المفتوح بالفعل بدلًا من إنشاء علامة تبويب Chrome ثانية.

يتضمن خرج الأمر/الأداة حقل `source` (`api` أو `browser`) حتى يتمكن الوكلاء
من توضيح المسار الذي استُخدم. ينضم `create` إلى الاجتماع الجديد افتراضيًا ويعيد
`joined: true` بالإضافة إلى جلسة الانضمام. لإنشاء عنوان URL فقط، استخدم
`create --no-join` في CLI أو مرّر `"join": false` إلى الأداة.

أو أخبر وكيلًا: "أنشئ Google Meet، وانضم إليه بالصوت في الوقت الفعلي، وأرسل
لي الرابط." يجب أن يستدعي الوكيل `google_meet` مع `action: "create"` ثم
يشارك `meetingUri` المُعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

للانضمام بغرض المراقبة فقط/التحكم بالمتصفح، اضبط `"mode": "transcribe"`. فهذا
لا يبدأ جسر النموذج الثنائي الاتجاه في الوقت الفعلي، لذلك لن يرد صوتيًا داخل
الاجتماع.

أثناء جلسات الوقت الفعلي، تتضمن حالة `google_meet` صحة المتصفح وجسر الصوت
مثل `inCall` و`manualActionRequired` و`providerConnected`،
و`realtimeReady` و`audioInputActive` و`audioOutputActive` وطوابع
زمن آخر إدخال/إخراج، وعدادات البايتات، وحالة إغلاق الجسر. إذا ظهرت مطالبة
آمنة من صفحة Meet، تتعامل معها أتمتة المتصفح عندما تستطيع. يتم الإبلاغ عن
مطالبات تسجيل الدخول، أو قبول المضيف، أو أذونات المتصفح/نظام التشغيل كإجراء
يدوي مطلوب مع سبب ورسالة ليقوم الوكيل بنقلها.

ينضم Chrome باستخدام ملف تعريف Chrome المسجّل الدخول. في Meet، اختر `BlackHole 2ch` لمسار
الميكروفون/مكبر الصوت الذي يستخدمه OpenClaw. للحصول على صوت ثنائي الاتجاه نظيف،
استخدم أجهزة افتراضية منفصلة أو مخططًا بأسلوب Loopback؛ فالجهاز الواحد BlackHole
يكفي لأول اختبار دخاني لكنه قد يسبب صدى.

### Gateway محلي + Chrome على Parallels

أنت **لا** تحتاج إلى OpenClaw Gateway كامل أو مفتاح API للنموذج داخل جهاز macOS افتراضي
فقط لكي يمتلك الجهاز الافتراضي Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل
مضيف node داخل الجهاز الافتراضي. فعّل الإضافة المضمّنة على الجهاز الافتراضي مرة واحدة
حتى يعلن الـ node عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API، وموفّر
  الوقت الفعلي، وتكوين إضافة Google Meet.
- جهاز Parallels macOS الافتراضي: OpenClaw CLI/مضيف node، وGoogle Chrome، وSoX، وBlackHole 2ch،
  وملف تعريف Chrome مسجّل الدخول إلى Google.
- غير مطلوب داخل الجهاز الافتراضي: خدمة Gateway، أو تكوين الوكيل، أو مفتاح OpenAI/GPT،
  أو إعداد موفّر النماذج.

ثبّت تبعيات الجهاز الافتراضي:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل الجهاز الافتراضي بعد تثبيت BlackHole حتى يكشف macOS عن `BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من أن الجهاز الافتراضي يستطيع رؤية جهاز الصوت وأوامر SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

ثبّت OpenClaw أو حدّثه في الجهاز الافتراضي، ثم فعّل الإضافة المضمّنة هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ مضيف node في الجهاز الافتراضي:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على شبكة LAN وكنت لا تستخدم TLS، فسيرفض الـ node
اتصال WebSocket النصي غير المشفّر ما لم تسمح بذلك صراحةً لهذه الشبكة الخاصة الموثوقة:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

استخدم متغير البيئة نفسه عند تثبيت الـ node كـ LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

إن `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو متغير بيئة للعملية، وليس
إعدادًا في `openclaw.json`. يخزّن `openclaw node install` هذا المتغير في بيئة
LaunchAgent عندما يكون موجودًا في أمر التثبيت.

وافق على الـ node من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

أكّد أن Gateway يرى الـ node وأنه يعلن عن كل من `googlemeet.chrome`
وإمكانات المتصفح/`browser.proxy`:

```bash
openclaw nodes status
```

وجّه Meet عبر ذلك الـ node على مضيف Gateway:

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

لإجراء اختبار دخاني بأمر واحد ينشئ جلسة أو يعيد استخدامها، وينطق عبارة
معروفة، ويطبع صحة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام، تقوم أتمتة متصفح OpenClaw بملء اسم الضيف، والنقر على Join/Ask
to join، وتقبّل خيار "Use microphone" الخاص بـ Meet في أول تشغيل عندما تظهر
هذه المطالبة. وأثناء إنشاء اجتماع عبر المتصفح فقط، يمكنها أيضًا المتابعة بعد
المطالبة نفسها من دون ميكروفون إذا لم يعرض Meet زر استخدام الميكروفون.
إذا لم يكن ملف تعريف المتصفح مسجّل الدخول، أو كان Meet ينتظر
موافقة المضيف، أو كان Chrome يحتاج إلى إذن الميكروفون/الكاميرا، أو كان Meet عالقًا
عند مطالبة لم تتمكن الأتمتة من حلها، فإن نتيجة join/test-speech تُبلغ عن
`manualActionRequired: true` مع `manualActionReason` و
`manualActionMessage`. يجب على الوكلاء التوقف عن إعادة محاولة الانضمام،
وإبلاغ الرسالة الدقيقة تلك بالإضافة إلى `browserUrl`/`browserTitle` الحاليين،
وإعادة المحاولة فقط بعد اكتمال الإجراء اليدوي في المتصفح.

إذا تم حذف `chromeNode.node`، فسيختار OpenClaw تلقائيًا فقط عندما يعلن
node واحد متصل بالضبط عن كل من `googlemeet.chrome` والتحكم بالمتصفح. إذا
كانت هناك عدة عقد قادرة متصلة، فاضبط `chromeNode.node` على معرّف الـ node
أو اسم العرض أو عنوان IP البعيد.

فحوصات الإخفاق الشائعة:

- `Configured Google Meet node ... is not usable: offline`: الـ node المثبّت
  معروف لدى Gateway لكنه غير متاح. يجب على الوكلاء التعامل مع ذلك الـ node
  كحالة تشخيصية، لا كمضيف Chrome قابل للاستخدام، والإبلاغ عن عائق الإعداد
  بدلًا من الرجوع إلى وسيلة نقل أخرى ما لم يطلب المستخدم ذلك.
- `No connected Google Meet-capable node`: ابدأ `openclaw node run` في الجهاز الافتراضي،
  ووافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` في الجهاز الافتراضي. وتأكد أيضًا من أن
  مضيف Gateway يسمح بأمري الـ node كليهما باستخدام
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: ثبّت `blackhole-2ch` على المضيف
  الذي يجري فحصه وأعد تشغيله قبل استخدام صوت Chrome المحلي.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في الجهاز الافتراضي وأعد تشغيله.
- يتم فتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف تعريف المتصفح داخل الجهاز الافتراضي، أو
  أبقِ `chrome.guestName` مضبوطًا للانضمام كضيف. يستخدم الانضمام التلقائي كضيف
  أتمتة متصفح OpenClaw عبر وكيل متصفح الـ node؛ تأكد من أن إعداد متصفح الـ node
  يشير إلى ملف التعريف الذي تريده، على سبيل المثال
  `browser.defaultProfile: "user"` أو ملف تعريف موجود ذي جلسة مسماة.
- علامات تبويب Meet مكررة: اترك `chrome.reuseExistingTab: true` مفعّلًا. يقوم OpenClaw
  بتنشيط علامة تبويب موجودة لعنوان URL نفسه الخاص بـ Meet قبل فتح واحدة جديدة،
  كما أن إنشاء الاجتماع عبر المتصفح يعيد استخدام علامة تبويب `https://meet.google.com/new`
  الجارية أو علامة تبويب مطالبة حساب Google قبل فتح أخرى.
- لا يوجد صوت: في Meet، وجّه الميكروفون/مكبر الصوت عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيهًا بأسلوب Loopback
  للحصول على صوت ثنائي الاتجاه نظيف.

## ملاحظات التثبيت

يستخدم الوضع الافتراضي لـ Chrome في الوقت الفعلي أداتين خارجيتين:

- `sox`: أداة صوتية عبر سطر الأوامر. تستخدم الإضافة أمريها `rec` و`play`
  لجسر الصوت الافتراضي بسرعة 8 kHz بصيغة G.711 mu-law.
- `blackhole-2ch`: برنامج تشغيل صوت افتراضي لنظام macOS. ينشئ جهاز الصوت
  `BlackHole 2ch` الذي يمكن لـ Chrome/Meet التوجيه عبره.

لا يضمّن OpenClaw أيًا من الحزمتين ولا يعيد توزيعهما. تطلب الوثائق من المستخدمين
تثبيتهما كتبعيات على المضيف عبر Homebrew. يُرخّص SoX بموجب
`LGPL-2.0-only AND GPL-2.0-only`؛ أما BlackHole فمرخّص بموجب GPL-3.0. إذا
أنشأت مُثبّتًا أو جهازًا مدمجًا يضمّن BlackHole مع OpenClaw، فراجع شروط الترخيص
المصدرية لـ BlackHole أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

تفتح وسيلة نقل Chrome عنوان URL الخاص بـ Meet في Google Chrome وتنضم باستخدام
ملف تعريف Chrome المسجّل الدخول. على macOS، تتحقق الإضافة من وجود `BlackHole 2ch` قبل التشغيل.
وإذا كان ذلك مُكوَّنًا، فإنها تشغّل أيضًا أمر فحص صحة جسر الصوت وأمر بدء التشغيل
قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت موجودين على مضيف Gateway؛
واستخدم `chrome-node` عندما يكون Chrome/الصوت موجودين على Node مقترن مثل جهاز Parallels
macOS افتراضي.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت الميكروفون ومكبر الصوت في Chrome عبر جسر الصوت المحلي الخاص بـ OpenClaw.
إذا لم يكن `BlackHole 2ch` مثبتًا، يفشل الانضمام بخطأ إعداد
بدلًا من الانضمام بصمت من دون مسار صوتي.

### Twilio

وسيلة نقل Twilio هي خطة اتصال صارمة مفوّضة إلى إضافة Voice Call. وهي
لا تحلل صفحات Meet لاستخراج أرقام الهاتف.

استخدم هذا عندما لا تكون المشاركة عبر Chrome متاحة أو عندما تريد بديلًا
للاتصال الهاتفي. يجب أن يوفّر Google Meet رقم اتصال هاتفي وPIN
للاجتماع؛ ولا يكتشف OpenClaw هذه المعلومات من صفحة Meet.

فعّل إضافة Voice Call على مضيف Gateway، وليس على Chrome node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // أو اضبط "twilio" إذا كان ينبغي أن يكون Twilio هو الافتراضي
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

وفّر بيانات اعتماد Twilio عبر البيئة أو التكوين. تبقي متغيرات البيئة
الأسرار خارج `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

أعد تشغيل Gateway أو أعد تحميله بعد تفعيل `voice-call`؛ فلا تظهر تغييرات تكوين الإضافة
في عملية Gateway قيد التشغيل بالفعل حتى تُعاد تحميلها.

ثم تحقّق:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

عندما يكون تفويض Twilio موصولًا، يتضمن `googlemeet setup` عمليات تحقق ناجحة
لكل من `twilio-voice-call-plugin` و`twilio-voice-call-credentials`.

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

يُعد OAuth اختياريًا لإنشاء رابط Meet لأن `googlemeet create` يمكنه
الرجوع إلى أتمتة المتصفح. اضبط OAuth عندما تريد الإنشاء الرسمي عبر API،
أو حل المساحات، أو فحوصات الفحص المسبق عبر Meet Media API.

يستخدم الوصول إلى Google Meet API OAuth للمستخدم: أنشئ عميل Google Cloud OAuth،
واطلب النطاقات المطلوبة، وامنح حساب Google الإذن، ثم خزّن
رمز التحديث الناتج في تكوين إضافة Google Meet أو وفّر
متغيرات البيئة `OPENCLAW_GOOGLE_MEET_*`.

لا يحل OAuth محل مسار الانضمام عبر Chrome. فما تزال وسيلتا النقل Chrome وChrome-node
تنضمان عبر ملف تعريف Chrome مسجّل الدخول، وBlackHole/SoX، وNode متصل
عند استخدام المشاركة عبر المتصفح. يُستخدم OAuth فقط لمسار Google Meet API الرسمي:
إنشاء مساحات الاجتماعات، وحل المساحات، وتشغيل فحوصات الفحص المسبق عبر Meet Media API.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو حدده.
2. فعّل **Google Meet REST API** لهذا المشروع.
3. اضبط شاشة الموافقة الخاصة بـ OAuth.
   - يكون **Internal** هو الأبسط لمؤسسة Google Workspace.
   - يعمل **External** لإعدادات الاستخدام الشخصي/الاختبار؛ وبينما يكون التطبيق في وضع الاختبار،
     أضف كل حساب Google سيمنح التطبيق إذنًا كمستخدم اختبار.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرّف عميل OAuth.
   - نوع التطبيق: **Web application**.
   - عنوان URI المعتمد لإعادة التوجيه:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرّف العميل والسر الخاص بالعميل.

إن `meetings.space.created` مطلوب لـ Google Meet `spaces.create`.
ويتيح `meetings.space.readonly` لـ OpenClaw حل عناوين URL/رموز Meet إلى مساحات.
أما `meetings.conference.media.readonly` فهو للفحص المسبق والعمل الإعلامي عبر Meet Media API؛
وقد تطلب Google التسجيل في Developer Preview لاستخدام Media API الفعلي.
إذا كنت تحتاج فقط إلى الانضمام عبر Chrome المعتمد على المتصفح، فتجاوز OAuth بالكامل.

### إنشاء رمز التحديث

اضبط `oauth.clientId` و`oauth.clientSecret` اختياريًا، أو مرّرهما كـ
متغيرات بيئة، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة تكوين `oauth` تحتوي على رمز تحديث. ويستخدم PKCE،
ورد نداء localhost على `http://localhost:8085/oauth2callback`، وتدفقًا يدويًا
لنسخ/لصق مع `--manual`.

أمثلة:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

استخدم الوضع اليدوي عندما يتعذر على المتصفح الوصول إلى رد النداء المحلي:

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

خزّن كائن `oauth` تحت تكوين إضافة Google Meet:

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

فضّل متغيرات البيئة عندما لا تريد وجود رمز التحديث في التكوين.
إذا وُجدت قيم في كل من التكوين والبيئة، فستحل الإضافة قيم التكوين
أولًا ثم تستخدم البيئة كرجوع احتياطي.

تتضمن موافقة OAuth إنشاء مساحة Meet، وحق القراءة لمساحة Meet، وحق
قراءة وسائط مؤتمر Meet. إذا كنت قد أجريت المصادقة قبل توفر
دعم إنشاء الاجتماعات، فأعد تشغيل `openclaw googlemeet auth login --json` حتى يحتوي
رمز التحديث على النطاق `meetings.space.created`.

### التحقق من OAuth باستخدام doctor

شغّل فحص OAuth عبر doctor عندما تريد فحص صحة سريعًا وغير سري:

```bash
openclaw googlemeet doctor --oauth --json
```

لا يحمّل هذا وقت تشغيل Chrome ولا يتطلب Chrome node متصلًا. بل
يتحقق من وجود تكوين OAuth ومن أن رمز التحديث يمكنه إنشاء رمز وصول.
يتضمن تقرير JSON حقول الحالة فقط مثل `ok` و`configured` و
`tokenSource` و`expiresAt` ورسائل الفحص؛ ولا يطبع رمز الوصول،
أو رمز التحديث، أو السر الخاص بالعميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` مع `oauth.refreshToken`، أو رمز وصول مخزّن مؤقتًا، موجود.            |
| `oauth-token`        | رمز الوصول المخزّن مؤقتًا ما يزال صالحًا، أو أنشأ رمز التحديث رمز وصول جديدًا.        |
| `meet-spaces-get`    | قام الفحص الاختياري `--meeting` بحل مساحة Meet موجودة.                                |
| `meet-spaces-create` | أنشأ الفحص الاختياري `--create-space` مساحة Meet جديدة.                               |

ولإثبات تفعيل Google Meet API ونطاق `spaces.create` أيضًا، شغّل
فحص الإنشاء ذي الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

ينشئ `--create-space` عنوان URL مؤقتًا لـ Meet. استخدمه عندما تحتاج إلى تأكيد
أن مشروع Google Cloud قد فُعّل فيه Meet API وأن الحساب المخوّل
يملك النطاق `meetings.space.created`.

ولإثبات حق القراءة لمساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` حق القراءة لمساحة
موجودة يمكن لحساب Google المخوّل الوصول إليها. يشير الخطأ `403` من هذه الفحوصات
عادةً إلى أن Google Meet REST API معطّل، أو أن رمز التحديث الموافق عليه
يفتقد النطاق المطلوب، أو أن حساب Google لا يمكنه الوصول إلى تلك المساحة.
أما خطأ رمز التحديث فيعني أنه يجب إعادة تشغيل `openclaw googlemeet auth login
--json` وتخزين كتلة `oauth` الجديدة.

لا حاجة إلى أي بيانات اعتماد OAuth للرجوع الاحتياطي عبر المتصفح. ففي هذا الوضع،
تأتي مصادقة Google من ملف تعريف Chrome المسجّل الدخول على الـ node المحدد، لا من
تكوين OpenClaw.

تُقبل متغيرات البيئة التالية كقيم رجوع احتياطي:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

قم بحل عنوان URL أو الرمز أو `spaces/{id}` الخاص بـ Meet عبر `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

شغّل الفحص المسبق قبل العمل الإعلامي:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اعرض عناصر الاجتماع وسجل الحضور بعد أن ينشئ Meet سجلات المؤتمر:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

مع `--meeting`، يستخدم كل من `artifacts` و`attendance` أحدث سجل مؤتمر
افتراضيًا. مرّر `--all-conference-records` عندما تريد كل سجل محفوظ
لهذا الاجتماع.

يمكن لبحث Calendar حل عنوان URL الخاص بالاجتماع من Google Calendar قبل قراءة
عناصر Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` الخاص باليوم الحالي عن حدث Calendar يحتوي على
رابط Google Meet. استخدم `--event <query>` للبحث في نص الحدث المطابق، و
`--calendar <id>` لتقويم غير أساسي. يتطلب بحث Calendar تسجيل دخول OAuth
حديثًا يتضمن نطاق القراءة فقط لأحداث Calendar.
يعرض `calendar-events` معاينة لأحداث Meet المطابقة ويضع علامة على الحدث الذي
سيختاره `latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف مسبقًا معرّف سجل المؤتمر، فاستهدفه مباشرةً:

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

يعيد `artifacts` البيانات الوصفية لسجل المؤتمر بالإضافة إلى البيانات الوصفية لموارد المشاركين،
والتسجيلات، والنصوص المفرغة، وإدخالات النص المفرغ المنظَّمة، والملاحظات الذكية عندما
تتيحها Google للاجتماع. استخدم `--no-transcript-entries` لتخطي
جلب الإدخالات للاجتماعات الكبيرة. يوسّع `attendance` المشاركين إلى
صفوف جلسات المشاركين مع أوقات أول/آخر ظهور، وإجمالي مدة الجلسة،
وعلامات التأخر/المغادرة المبكرة، ودمج موارد المشاركين المكررة بحسب
المستخدم المسجّل الدخول أو اسم العرض. مرّر `--no-merge-duplicates` للإبقاء على موارد
المشاركين الخام منفصلة، و`--late-after-minutes` لضبط اكتشاف التأخر، و
`--early-before-minutes` لضبط اكتشاف المغادرة المبكرة.

يكتب `export` مجلدًا يحتوي على `summary.md` و`attendance.csv`،
و`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`.
يسجل `manifest.json` الإدخال المختار، وخيارات التصدير، وسجلات المؤتمر،
وملفات الإخراج، والأعداد، ومصدر الرمز، وحدث Calendar عند استخدامه،
وأي تحذيرات استرجاع جزئي. مرّر `--zip` لكتابة أرشيف محمول أيضًا
بجوار المجلد. مرّر `--include-doc-bodies` لتصدير نصوص Google Docs المرتبطة
بالنص المفرغ والملاحظات الذكية عبر Google Drive `files.export`؛ وهذا يتطلب
تسجيل دخول OAuth حديثًا يتضمن نطاق القراءة فقط لـ Drive Meet. ومن دون
`--include-doc-bodies`، تتضمن الصادرات بيانات Meet الوصفية وإدخالات
النص المفرغ المنظَّمة فقط. إذا أعادت Google فشلًا جزئيًا في العناصر، مثل خطأ
في سرد الملاحظات الذكية، أو إدخال نص مفرغ، أو جسم مستند Drive، فإن
الملخص وملف manifest يحتفظان بالتحذير بدلًا من إفساد التصدير بالكامل.
استخدم `--dry-run` لجلب بيانات العناصر/الحضور نفسها وطباعة
JSON الخاص بـ manifest من دون إنشاء المجلد أو ملف ZIP. وهذا مفيد قبل كتابة
تصدير كبير أو عندما يحتاج الوكيل فقط إلى الأعداد، والسجلات المحددة،
والتحذيرات.

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

اضبط `"dryRun": true` لإرجاع manifest التصدير فقط وتخطي كتابة الملفات.

شغّل الاختبار الدخاني الحي المحمي على اجتماع محتفظ به حقيقي:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

بيئة الاختبار الدخاني الحي:

- `OPENCLAW_LIVE_TEST=1` يفعّل الاختبارات الحية المحمية.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL أو رمز أو
  `spaces/{id}` خاص بـ Meet محتفظ به.
- يوفّر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرّف عميل
  OAuth.
- يوفّر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
  رمز التحديث.
- اختياريًا: تستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  و`OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء الرجوع الاحتياطي نفسها
  من دون السابقة `OPENCLAW_`.

يحتاج الاختبار الدخاني الحي الأساسي للعناصر/الحضور إلى
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. ويحتاج بحث Calendar إلى
`https://www.googleapis.com/auth/calendar.events.readonly`. ويحتاج
تصدير أجسام مستندات Drive إلى
`https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد، والمصدر، وجلسة الانضمام. ومع وجود بيانات اعتماد OAuth
فإنه يستخدم Google Meet API الرسمي. ومن دون بيانات اعتماد OAuth فإنه
يستخدم ملف تعريف المتصفح المسجّل الدخول على Chrome node المثبّت كمسار احتياطي. يمكن للوكلاء
استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في
خطوة واحدة. ولإنشاء عنوان URL فقط، مرّر `"join": false`.

مثال على خرج JSON من الرجوع الاحتياطي عبر المتصفح:

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

إذا واجه الرجوع الاحتياطي عبر المتصفح تسجيل دخول Google أو عائق أذونات Meet قبل
أن يتمكن من إنشاء عنوان URL، فإن طريقة Gateway تعيد استجابة فاشلة وتعيد
أداة `google_meet` تفاصيل منظَّمة بدلًا من سلسلة نصية بسيطة:

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
`manualActionMessage` بالإضافة إلى سياق node/علامة تبويب المتصفح، وأن يتوقف عن فتح
علامات تبويب Meet جديدة حتى يُكمل المشغّل خطوة المتصفح.

مثال على خرج JSON من الإنشاء عبر API:

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

يؤدي إنشاء Meet إلى الانضمام افتراضيًا. وما تزال وسيلة النقل Chrome أو Chrome-node
تحتاج إلى ملف تعريف Google Chrome مسجّل الدخول للانضمام عبر المتصفح. وإذا كان
ملف التعريف مسجّل الخروج، فإن OpenClaw يبلّغ عن `manualActionRequired: true` أو
عن خطأ في الرجوع الاحتياطي عبر المتصفح ويطلب من المشغّل إكمال تسجيل الدخول إلى Google قبل
إعادة المحاولة.

اضبط `preview.enrollmentAcknowledged: true` فقط بعد تأكيد أن مشروع Cloud،
وكيان OAuth، والمشاركين في الاجتماع مسجّلون في Google
Workspace Developer Preview Program لواجهات Meet media API.

## الإعداد

يحتاج مسار Chrome الشائع في الوقت الفعلي فقط إلى تفعيل الإضافة، وBlackHole، وSoX،
ومفتاح موفّر صوت في الوقت الفعلي في الواجهة الخلفية. OpenAI هو الافتراضي؛ اضبط
`realtime.provider: "google"` لاستخدام Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

اضبط تكوين الإضافة تحت `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: معرّف/اسم/IP اختياري لـ node من أجل `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم على شاشة الضيف في Meet
  عند عدم تسجيل الدخول
- `chrome.autoJoin: true`: تعبئة اسم الضيف بأفضل جهد والنقر على Join Now
  عبر أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تنشيط علامة تبويب Meet موجودة بدلًا من
  فتح علامات مكررة
- `chrome.waitForInCallMs: 20000`: الانتظار حتى تعلن علامة تبويب Meet أنها داخل
  المكالمة قبل تشغيل المقدمة في الوقت الفعلي
- `chrome.audioInputCommand`: أمر SoX `rec` يكتب صوت
  8 kHz G.711 mu-law إلى stdout
- `chrome.audioOutputCommand`: أمر SoX `play` يقرأ صوت
  8 kHz G.711 mu-law من stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة قصيرة، مع
  `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية منطوق قصير عند اتصال جسر
  الوقت الفعلي؛ اضبطه على `""` للانضمام بصمت

تجاوزات اختيارية:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
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

القيمة الافتراضية لـ `voiceCall.enabled` هي `true`؛ ومع وسيلة نقل Twilio فإنه
يفوّض مكالمة PSTN الفعلية وDTMF إلى إضافة Voice Call. وإذا لم تكن `voice-call`
مفعّلة، فسيظل Google Meet قادرًا على التحقق من خطة الاتصال وتسجيلها، لكنه لا
يستطيع إجراء مكالمة Twilio.

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

استخدم `transport: "chrome"` عندما يعمل Chrome على مضيف Gateway. واستخدم
`transport: "chrome-node"` عندما يعمل Chrome على Node مقترن مثل جهاز Parallels
افتراضي. وفي كلتا الحالتين يعمل النموذج في الوقت الفعلي و`openclaw_agent_consult` على
مضيف Gateway، لذلك تبقى بيانات اعتماد النموذج هناك.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. واستخدم
`action: "speak"` مع `sessionId` و`message` لجعل الوكيل في الوقت الفعلي
يتكلم فورًا. واستخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها،
وتشغيل عبارة معروفة، وإرجاع صحة `inCall` عندما يستطيع مضيف Chrome
الإبلاغ عنها. واستخدم `action: "leave"` لوضع علامة على انتهاء الجلسة.

يتضمن `status` صحة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج
  ملف تعريف المتصفح إلى تسجيل دخول يدوي، أو قبول مضيف Meet، أو أذونات،
  أو إصلاح التحكم بالمتصفح قبل أن يعمل الكلام
- `providerConnected` / `realtimeReady`: حالة جسر الصوت في الوقت الفعلي
- `lastInputAt` / `lastOutputAt`: آخر صوت شوهد من الجسر أو أُرسل إليه

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## استشارة الوكيل في الوقت الفعلي

وضع Chrome في الوقت الفعلي مُحسَّن لحلقة صوتية حية. يسمع موفّر الصوت في الوقت الفعلي
صوت الاجتماع ويتكلم عبر جسر الصوت المكوَّن.
وعندما يحتاج النموذج في الوقت الفعلي إلى استدلال أعمق، أو معلومات حالية، أو أدوات
OpenClaw العادية، يمكنه استدعاء `openclaw_agent_consult`.

تشغّل أداة الاستشارة وكيل OpenClaw العادي في الخلفية مع سياق حديث
للنص المفرغ للاجتماع وتعيد إجابة منطوقة موجزة إلى جلسة
الصوت في الوقت الفعلي. ويمكن بعد ذلك للنموذج الصوتي أن ينطق هذه الإجابة داخل الاجتماع.
وهي تستخدم أداة الاستشارة المشتركة نفسها في الوقت الفعلي مثل Voice Call.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: يعرّض أداة الاستشارة ويقيّد الوكيل العادي إلى
  `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و
  `memory_get`.
- `owner`: يعرّض أداة الاستشارة ويسمح للوكيل العادي باستخدام سياسة أدوات
  الوكيل العادية.
- `none`: لا يعرّض أداة الاستشارة للنموذج الصوتي في الوقت الفعلي.

يكون مفتاح جلسة الاستشارة محصورًا بكل جلسة Meet، لذلك يمكن لاستدعاءات الاستشارة
اللاحقة إعادة استخدام سياق الاستشارة السابق خلال الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد أن ينضم Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

للاختبار الدخاني الكامل للانضمام والتحدث:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## قائمة التحقق للاختبار الحي

استخدم هذا التسلسل قبل تسليم اجتماع إلى وكيل غير مراقَب:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

الحالة المتوقعة لـ Chrome-node:

- يكون `googlemeet setup` أخضر بالكامل.
- يتضمن `googlemeet setup` الفحص `chrome-node-connected` عندما تكون وسيلة النقل الافتراضية هي Chrome-node
  أو عندما يكون هناك Node مثبّت.
- يعرض `nodes status` أن الـ Node المحدد متصل.
- يعلن الـ Node المحدد عن كل من `googlemeet.chrome` و`browser.proxy`.
- تنضم علامة تبويب Meet إلى المكالمة ويُرجع `test-speech` صحة Chrome مع
  `inCall: true`.

بالنسبة إلى مضيف Chrome بعيد مثل جهاز Parallels macOS افتراضي، فهذا هو
أقصر فحص آمن بعد تحديث Gateway أو الجهاز الافتراضي:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن إضافة Gateway محمّلة، وأن Node الجهاز الافتراضي متصل بالرمز
الحالي، وأن جسر صوت Meet متاح قبل أن يفتح الوكيل علامة تبويب اجتماع حقيقية.

لاختبار دخاني لـ Twilio، استخدم اجتماعًا يوفّر تفاصيل الاتصال الهاتفي:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

الحالة المتوقعة لـ Twilio:

- يتضمن `googlemeet setup` فحصين ناجحين باللون الأخضر لـ `twilio-voice-call-plugin` و
  `twilio-voice-call-credentials`.
- يكون `voicecall` متاحًا في CLI بعد إعادة تحميل Gateway.
- تحتوي الجلسة المُعادة على `transport: "twilio"` و`twilio.voiceCallId`.
- يقوم `googlemeet leave <sessionId>` بإنهاء مكالمة الصوت المفوّضة.

## استكشاف الأخطاء وإصلاحها

### لا يستطيع الوكيل رؤية أداة Google Meet

تأكد من أن الإضافة مفعّلة في تكوين Gateway وأعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد عدّلت للتو `plugins.entries.google-meet`، فأعد تشغيل Gateway أو أعد تحميله.
لا يرى الوكيل الجاري إلا أدوات الإضافة التي سجّلتها عملية Gateway الحالية.

### لا يوجد Node متصل قادر على Google Meet

على مضيف الـ Node، شغّل:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

على مضيف Gateway، وافق على الـ Node وتحقق من الأوامر:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

يجب أن يكون الـ Node متصلًا وأن يسرد `googlemeet.chrome` بالإضافة إلى `browser.proxy`.
ويجب أن يسمح تكوين Gateway بأوامر الـ Node هذه:

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
`gateway token mismatch`، فأعد تثبيت الـ Node أو أعد تشغيله باستخدام رمز Gateway
الحالي. بالنسبة إلى Gateway على شبكة LAN فهذا يعني عادةً:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

ثم أعد تحميل خدمة الـ Node وأعد تشغيل:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### يفتح المتصفح لكن الوكيل لا يستطيع الانضمام

شغّل `googlemeet test-speech` وافحص صحة Chrome المُعادة. إذا
أبلغت عن `manualActionRequired: true`، فاعرض `manualActionMessage` على المشغّل
وتوقف عن إعادة المحاولة حتى يكتمل إجراء المتصفح.

الإجراءات اليدوية الشائعة:

- تسجيل الدخول إلى ملف تعريف Chrome.
- قبول الضيف من حساب مضيف Meet.
- منح Chrome أذونات الميكروفون/الكاميرا عندما تظهر
  مطالبة الأذونات الأصلية الخاصة بـ Chrome.
- إغلاق مربع حوار أذونات Meet العالق أو إصلاحه.

لا تُبلغ عن "عدم تسجيل الدخول" لمجرد أن Meet يعرض "Do you want people to
hear you in the meeting?" فهذا هو التمهيد البيني لاختيار الصوت في Meet؛ يقوم OpenClaw
بالنقر على **Use microphone** عبر أتمتة المتصفح عندما يكون ذلك متاحًا ويواصل
الانتظار لحالة الاجتماع الحقيقية. أما في الرجوع الاحتياطي عبر المتصفح لإنشاء الرابط فقط، فقد
ينقر OpenClaw على **Continue without microphone** لأن إنشاء عنوان URL لا يحتاج
إلى مسار الصوت في الوقت الفعلي.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` أولًا نقطة النهاية `spaces.create` الخاصة بـ Google Meet API
عند تكوين بيانات اعتماد OAuth. ومن دون بيانات اعتماد OAuth فإنه يرجع
إلى متصفح Chrome node المثبّت. تأكد من الآتي:

- بالنسبة إلى الإنشاء عبر API: تم تكوين `oauth.clientId` و`oauth.refreshToken`،
  أو أن متغيرات البيئة المطابقة `OPENCLAW_GOOGLE_MEET_*` موجودة.
- بالنسبة إلى الإنشاء عبر API: تم إنشاء رمز التحديث بعد إضافة
  دعم الإنشاء. قد تكون الرموز الأقدم تفتقد النطاق `meetings.space.created`؛ أعد تشغيل
  `openclaw googlemeet auth login --json` وحدّث تكوين الإضافة.
- بالنسبة إلى الرجوع الاحتياطي عبر المتصفح: يشير `defaultTransport: "chrome-node"` و
  `chromeNode.node` إلى Node متصل يملك `browser.proxy` و
  `googlemeet.chrome`.
- بالنسبة إلى الرجوع الاحتياطي عبر المتصفح: ملف تعريف OpenClaw Chrome على ذلك الـ Node
  مسجّل الدخول إلى Google ويمكنه فتح `https://meet.google.com/new`.
- بالنسبة إلى الرجوع الاحتياطي عبر المتصفح: تعيد المحاولات استخدام علامة تبويب
  `https://meet.google.com/new` الموجودة أو علامة تبويب مطالبة حساب Google
  قبل فتح علامة تبويب جديدة. إذا انتهت مهلة الوكيل، فأعد محاولة استدعاء الأداة
  بدلًا من فتح علامة تبويب Meet أخرى يدويًا.
- بالنسبة إلى الرجوع الاحتياطي عبر المتصفح: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم
  `browser.nodeId` و`browser.targetId` و`browserUrl` و
  `manualActionMessage` المُعادة لإرشاد المشغّل. لا تُعد المحاولة في حلقة حتى
  يكتمل ذلك الإجراء.
- بالنسبة إلى الرجوع الاحتياطي عبر المتصفح: إذا عرض Meet "Do you want people to hear you in the
  meeting?"، فاترك علامة التبويب مفتوحة. يجب أن ينقر OpenClaw على **Use microphone** أو،
  في الرجوع الاحتياطي للإنشاء فقط، **Continue without microphone** عبر
  أتمتة المتصفح وأن يواصل انتظار عنوان URL المولّد الخاص بـ Meet. وإذا تعذر عليه ذلك، فيجب أن
  يذكر الخطأ `meet-audio-choice-required`، وليس `google-login-required`.

### ينضم الوكيل لكنه لا يتحدث

تحقق من مسار الوقت الفعلي:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "realtime"` للاستماع/الرد الصوتي. أما `mode: "transcribe"` فهو
لا يبدأ عمدًا جسر الصوت الثنائي الاتجاه في الوقت الفعلي.

تحقق أيضًا من:

- وجود مفتاح موفّر وقت فعلي متاح على مضيف Gateway، مثل
  `OPENAI_API_KEY` أو `GEMINI_API_KEY`.
- ظهور `BlackHole 2ch` على مضيف Chrome.
- وجود `rec` و`play` على مضيف Chrome.
- توجيه ميكروفون ومكبر صوت Meet عبر مسار الصوت الافتراضي الذي
  يستخدمه OpenClaw.

يطبع `googlemeet doctor [session-id]` الجلسة، والـ Node، وحالة داخل المكالمة،
وسبب الإجراء اليدوي، واتصال موفّر الوقت الفعلي، و`realtimeReady`، ونشاط
إدخال/إخراج الصوت، وآخر طوابع الصوت الزمنية، وعدادات البايتات، وعنوان URL الخاص بالمتصفح.
استخدم `googlemeet status [session-id]` عندما تحتاج إلى JSON الخام. واستخدم
`googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث OAuth الخاص بـ Google Meet
من دون كشف الرموز؛ وأضف `--meeting` أو `--create-space` عندما تحتاج أيضًا إلى
إثبات عبر Google Meet API.

إذا انتهت مهلة الوكيل وكان بإمكانك رؤية علامة تبويب Meet مفتوحة بالفعل، فافحص تلك العلامة
من دون فتح أخرى:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. فهو يركّز ويفحص
علامة تبويب Meet موجودة لوسيلة النقل المحددة. مع `chrome`، يستخدم
التحكم المحلي بالمتصفح عبر Gateway؛ ومع `chrome-node`، يستخدم
Chrome node المكوَّن. وهو لا يفتح علامة تبويب جديدة ولا ينشئ جلسة جديدة؛ بل يبلّغ عن
العائق الحالي، مثل تسجيل الدخول، أو القبول، أو الأذونات، أو حالة اختيار الصوت.
يتحدث أمر CLI إلى Gateway المكوَّن، لذلك يجب أن يكون Gateway قيد التشغيل؛
كما يتطلب `chrome-node` أيضًا أن يكون Chrome node متصلًا.

### فشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا به أو غير مفعّل.
أضِفه إلى `plugins.allow`، وفعّل `plugins.entries.voice-call`، وأعد تحميل
Gateway.

يفشل `twilio-voice-call-credentials` عندما تكون الواجهة الخلفية لـ Twilio تفتقد معرّف الحساب
SID، أو رمز المصادقة، أو رقم المتصل. اضبط هذه القيم على مضيف Gateway:

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

يكون `voicecall smoke` للتحقق من الجاهزية فقط افتراضيًا. ولإجراء تشغيل تجريبي لرقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

أضف `--yes` فقط عندما تريد عمدًا إجراء
مكالمة إخطار صادرة حية:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تبدأ مكالمة Twilio لكنها لا تدخل الاجتماع أبدًا

تأكد من أن حدث Meet يوفّر تفاصيل الاتصال الهاتفي. مرّر رقم الاتصال
الدقيق وPIN أو تسلسل DTMF مخصصًا:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم بادئة `w` أو الفواصل في `--dtmf-sequence` إذا كان موفّر الخدمة يحتاج إلى توقف
قبل إدخال PIN.

## ملاحظات

إن واجهة الوسائط الرسمية الخاصة بـ Google Meet موجّهة للاستقبال، لذا فإن التحدث داخل مكالمة Meet
ما يزال يحتاج إلى مسار مشارك. وتُبقي هذه الإضافة هذا الحد ظاهرًا:
يتولى Chrome المشاركة عبر المتصفح والتوجيه الصوتي المحلي؛ ويتولى Twilio
المشاركة عبر الاتصال الهاتفي.

يحتاج وضع Chrome في الوقت الفعلي إلى أحد الخيارين التاليين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يمتلك OpenClaw
  جسر النموذج في الوقت الفعلي ويمرّر صوت 8 kHz G.711 mu-law بين
  هذين الأمرين وموفّر الصوت في الوقت الفعلي المحدد.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي كامل مسار
  الصوت المحلي ويجب أن يخرج بعد بدء البرنامج الخدمي الخاص به أو التحقق منه.

للحصول على صوت ثنائي الاتجاه نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة
افتراضية منفصلة أو مخطط أجهزة افتراضية بأسلوب Loopback. قد يؤدي جهاز
BlackHole واحد مشترك إلى إعادة صدى المشاركين الآخرين داخل المكالمة.

يقوم `googlemeet speak` بتشغيل جسر الصوت النشط في الوقت الفعلي لجلسة
Chrome. ويوقف `googlemeet leave` ذلك الجسر. أما بالنسبة إلى جلسات Twilio المفوّضة
عبر إضافة Voice Call، فإن `leave` ينهي أيضًا مكالمة الصوت الأساسية.

## ذو صلة

- [إضافة Voice Call](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء الإضافات](/ar/plugins/building-plugins)
