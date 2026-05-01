---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - تريد من وكيل OpenClaw إنشاء مكالمة Google Meet جديدة.
    - أنت تُهيئ Chrome أو Chrome node أو Twilio كوسيلة نقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL المحددة صراحةً لـ Meet عبر Chrome أو Twilio مع إعدادات الصوت الافتراضية في الوقت الفعلي'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-01T07:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a52bdd2fe7d080797241471e632d38a4f6aac9f0ca6d855547e364540ff2fd3
    source_path: plugins/google-meet.md
    workflow: 16
---

دعم المشاركين في Google Meet لـ OpenClaw — صُمّم الـ Plugin ليكون صريحًا:

- لا ينضم إلا إلى عنوان URL صريح بصيغة `https://meet.google.com/...`.
- يمكنه إنشاء مساحة Meet جديدة عبر واجهة Google Meet API، ثم الانضمام إلى عنوان URL
  المُعاد.
- وضع الصوت `realtime` هو الوضع الافتراضي.
- يمكن للصوت الفوري استدعاء وكيل OpenClaw الكامل عند الحاجة إلى استدلال
  أعمق أو أدوات.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `realtime` للاستماع
  المباشر والرد الصوتي، أو `transcribe` للانضمام/التحكم في المتصفح من دون
  جسر الصوت الفوري.
- يبدأ التفويض كمصادقة Google OAuth شخصية أو ملف Chrome شخصي مسجّل الدخول مسبقًا.
- لا يوجد إعلان موافقة تلقائي.
- واجهة الصوت الخلفية الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف عقدة مقترن.
- يقبل Twilio رقم اتصال وارد مع رقم PIN اختياري أو تسلسل DTMF.
- أمر CLI هو `googlemeet`؛ أما `meet` فمحجوز لتدفقات المؤتمرات الهاتفية
  الأوسع الخاصة بالوكلاء.

## البدء السريع

ثبّت تبعيات الصوت المحلية واضبط مزود صوت فوري خلفي. OpenAI هو الافتراضي؛ ويعمل
Google Gemini Live أيضًا مع
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

مخرجات الإعداد مصممة لتكون قابلة للقراءة من الوكيل ومدركة للوضع. فهي تعرض ملف
Chrome الشخصي، وتثبيت العقدة، وبالنسبة لانضمامات Chrome الفورية، جسر صوت
BlackHole/SoX وفحوصات المقدمة الفورية المتأخرة. وللانضمامات الخاصة بالمراقبة
فقط، تحقق من النقل نفسه باستخدام `--mode transcribe`؛ فهذا الوضع يتجاوز
متطلبات الصوت الفوري لأنه لا يستمع عبر الجسر ولا يتحدث عبره:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

عند ضبط تفويض Twilio، يوضح الإعداد أيضًا ما إذا كان Plugin
`voice-call`، وبيانات اعتماد Twilio، وإتاحة Webhook العامة جاهزة. تعامل مع أي
فحص `ok: false` كحاجز أمام النقل والوضع المفحوصين قبل أن تطلب من وكيل الانضمام.
استخدم `openclaw googlemeet setup --json` للنصوص البرمجية أو المخرجات القابلة
للقراءة آليًا. استخدم `--transport chrome`، أو `--transport chrome-node`، أو
`--transport twilio` لإجراء فحص تمهيدي لنقل محدد قبل أن يحاول الوكيل استخدامه.

بالنسبة إلى Twilio، أجرِ دائمًا فحصًا تمهيديًا صريحًا للنقل عندما يكون النقل
الافتراضي هو Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

يلتقط ذلك نقص ربط `voice-call`، أو بيانات اعتماد Twilio، أو إتاحة Webhook غير
القابلة للوصول قبل أن يحاول الوكيل الاتصال بالاجتماع.

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

أنشئ اجتماعًا جديدًا وانضم إليه:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

أنشئ عنوان URL فقط من دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

يحتوي `googlemeet create` على مسارين:

- إنشاء عبر API: يُستخدم عند ضبط بيانات اعتماد Google Meet OAuth. هذا هو
  المسار الأكثر حتمية ولا يعتمد على حالة واجهة المتصفح.
- بديل المتصفح: يُستخدم عند غياب بيانات اعتماد OAuth. يستخدم OpenClaw عقدة
  Chrome المثبتة، ويفتح `https://meet.google.com/new`، وينتظر أن يعيد Google
  التوجيه إلى عنوان URL حقيقي يحمل رمز اجتماع، ثم يعيد ذلك العنوان. يتطلب هذا
  المسار أن يكون ملف Chrome الشخصي الخاص بـ OpenClaw على العقدة مسجّل الدخول
  مسبقًا إلى Google.
  تتعامل أتمتة المتصفح مع مطالبة Meet الأولى الخاصة بالميكروفون؛ ولا تُعامل
  تلك المطالبة كفشل في تسجيل الدخول إلى Google.
  تحاول تدفقات الانضمام والإنشاء أيضًا إعادة استخدام تبويب Meet موجود قبل فتح
  تبويب جديد. تتجاهل المطابقة سلاسل استعلام URL غير المؤثرة مثل `authuser`، لذا
  ينبغي أن يركز تكرار محاولة الوكيل على الاجتماع المفتوح مسبقًا بدل إنشاء
  تبويب Chrome ثانٍ.

تتضمن مخرجات الأمر/الأداة حقل `source` (`api` أو `browser`) حتى تتمكن الوكلاء
من شرح المسار المستخدم. ينضم `create` إلى الاجتماع الجديد افتراضيًا ويعيد
`joined: true` مع جلسة الانضمام. لسكّ عنوان URL فقط، استخدم
`create --no-join` في CLI أو مرّر `"join": false` إلى الأداة.

أو أخبر الوكيل: "أنشئ Google Meet، وانضم إليه بصوت فوري، وأرسل إليّ الرابط."
ينبغي أن يستدعي الوكيل `google_meet` مع `action: "create"` ثم يشارك
`meetingUri` المُعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

لانضمام خاص بالمراقبة فقط/التحكم في المتصفح، اضبط `"mode": "transcribe"`. هذا
لا يشغّل جسر النموذج الفوري ثنائي الاتجاه، ولا يتطلب BlackHole أو SoX، ولن يرد
صوتيًا داخل الاجتماع. كما تتجنب انضمامات Chrome في هذا الوضع منح إذن
الميكروفون/الكاميرا من OpenClaw وتتجنب مسار **استخدام الميكروفون** في Meet. إذا
عرض Meet شاشة فاصلة لاختيار الصوت، تحاول الأتمتة اختيار مسار بلا ميكروفون،
وإلا فتبلغ عن إجراء يدوي بدل فتح الميكروفون المحلي.

أثناء الجلسات الفورية، تتضمن حالة `google_meet` صحة المتصفح وجسر الصوت مثل
`inCall`، و`manualActionRequired`، و`providerConnected`، و`realtimeReady`،
و`audioInputActive`، و`audioOutputActive`، وآخر طوابع زمنية للإدخال/الإخراج،
وعدادات البايت، وحالة إغلاق الجسر. إذا ظهرت مطالبة آمنة في صفحة Meet، تتعامل
معها أتمتة المتصفح عندما تستطيع. يتم الإبلاغ عن مطالبات تسجيل الدخول، وقبول
المضيف، وأذونات المتصفح/نظام التشغيل كإجراء يدوي مع سبب ورسالة لينقلها الوكيل.
لا تصدر جلسات Chrome المُدارة المقدمة أو عبارة الاختبار إلا بعد أن تبلغ صحة
المتصفح `inCall: true`؛ وإلا فتبلغ الحالة `speechReady: false` ويتم حظر محاولة
الكلام بدل الادعاء بأن الوكيل تحدث داخل الاجتماع.

تنضم جلسات Chrome المحلية عبر ملف متصفح OpenClaw الشخصي المسجّل الدخول. يتطلب
وضع Realtime جهاز `BlackHole 2ch` لمسار الميكروفون/السماعة الذي يستخدمه
OpenClaw. للحصول على صوت ثنائي الاتجاه نظيف، استخدم أجهزة افتراضية منفصلة أو
رسمًا شبيهًا بـ Loopback؛ يكفي جهاز BlackHole واحد لاختبار smoke أولي لكنه قد
يسبب صدى.

### Gateway المحلي + Parallels Chrome

لا تحتاج إلى Gateway OpenClaw كامل أو مفتاح API للنموذج داخل جهاز macOS افتراضي
لمجرد جعل الجهاز الافتراضي يملك Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل
مضيف عقدة في الجهاز الافتراضي. فعّل الـ Plugin المضمّن على الجهاز الافتراضي مرة
واحدة حتى تعلن العقدة أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API،
  والمزود الفوري، وضبط Plugin Google Meet.
- جهاز Parallels macOS الافتراضي: OpenClaw CLI/مضيف العقدة، وGoogle Chrome،
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

بعد إعادة التشغيل، تحقق من أن الجهاز الافتراضي يمكنه رؤية جهاز الصوت وأوامر SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

ثبّت OpenClaw أو حدّثه في الجهاز الافتراضي، ثم فعّل الـ Plugin المضمّن هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ مضيف العقدة في الجهاز الافتراضي:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على LAN ولا تستخدم TLS، ترفض العقدة WebSocket
بنص عادي ما لم تقبل ذلك صراحة لتلك الشبكة الخاصة الموثوقة:

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

أكد أن Gateway يرى العقدة وأنها تعلن كلًا من `googlemeet.chrome` وقدرة
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

الآن انضم بشكل طبيعي من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اطلب من الوكيل استخدام أداة `google_meet` مع `transport: "chrome-node"`.

لاختبار smoke بأمر واحد ينشئ جلسة أو يعيد استخدامها، وينطق عبارة معروفة، ويطبع
صحة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام الفوري، تملأ أتمتة متصفح OpenClaw اسم الضيف، وتنقر على
الانضمام/طلب الانضمام، وتقبل خيار "استخدام الميكروفون" الأول في Meet عند ظهور
تلك المطالبة. أثناء الانضمام للمراقبة فقط أو إنشاء اجتماع من المتصفح فقط،
تتابع بعد المطالبة نفسها من دون ميكروفون عندما يتوفر ذلك الخيار. إذا لم يكن
ملف المتصفح الشخصي مسجّل الدخول، أو كان Meet ينتظر قبول المضيف، أو كان Chrome
بحاجة إلى إذن ميكروفون/كاميرا لانضمام فوري، أو كان Meet عالقًا على مطالبة لم
تستطع الأتمتة حلها، فستبلغ نتيجة الانضمام/اختبار الكلام
`manualActionRequired: true` مع `manualActionReason` و`manualActionMessage`.
ينبغي للوكلاء إيقاف إعادة محاولة الانضمام، والإبلاغ عن تلك الرسالة بالضبط مع
`browserUrl`/`browserTitle` الحاليين، وعدم إعادة المحاولة إلا بعد اكتمال إجراء
المتصفح اليدوي.

إذا حُذف `chromeNode.node`، يختار OpenClaw تلقائيًا فقط عندما تعلن عقدة متصلة
واحدة بالضبط كلًا من `googlemeet.chrome` والتحكم في المتصفح. إذا كانت هناك عدة
عقد قادرة متصلة، فاضبط `chromeNode.node` على معرّف العقدة، أو اسم العرض، أو
عنوان IP البعيد.

فحوصات الفشل الشائعة:

- `Configured Google Meet node ... is not usable: offline`: العقدة المثبّتة معروفة لدى Gateway لكنها غير متاحة. ينبغي للوكلاء التعامل مع تلك العقدة كحالة تشخيصية، لا كمضيف Chrome قابل للاستخدام، والإبلاغ عن عائق الإعداد بدلاً من الرجوع إلى وسيلة نقل أخرى ما لم يطلب المستخدم ذلك.
- `No connected Google Meet-capable node`: ابدأ `openclaw node run` في الآلة الافتراضية، ووافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` و`openclaw plugins enable browser` في الآلة الافتراضية. تأكد أيضاً من أن مضيف Gateway يسمح بأمري العقدة عبر `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: ثبّت `blackhole-2ch` على المضيف الذي يجري فحصه، ثم أعد التشغيل قبل استخدام صوت Chrome المحلي.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch` في الآلة الافتراضية، ثم أعد تشغيل الآلة الافتراضية.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف تعريف المتصفح داخل الآلة الافتراضية، أو أبقِ `chrome.guestName` مضبوطاً للانضمام كضيف. يستخدم الانضمام التلقائي كضيف أتمتة متصفح OpenClaw عبر وكيل متصفح العقدة؛ تأكد من أن إعدادات متصفح العقدة تشير إلى ملف التعريف الذي تريده، مثلاً `browser.defaultProfile: "user"` أو ملف تعريف جلسة موجودة ومسمّى.
- علامات تبويب Meet مكررة: أبقِ `chrome.reuseExistingTab: true` مفعّلاً. يفعّل OpenClaw علامة تبويب موجودة لعنوان Meet نفسه قبل فتح واحدة جديدة، كما أن إنشاء اجتماع عبر المتصفح يعيد استخدام علامة تبويب قيد التقدم لـ `https://meet.google.com/new` أو مطالبة حساب Google قبل فتح علامة أخرى.
- لا يوجد صوت: في Meet، وجّه الميكروفون/السماعة عبر مسار جهاز الصوت الافتراضي الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيهاً بنمط Loopback للحصول على صوت مزدوج الاتجاه نظيف.

## ملاحظات التثبيت

يستخدم الإعداد الافتراضي الفوري لـ Chrome أداتين خارجيتين:

- `sox`: أداة صوتية لسطر الأوامر. يستخدم Plugin أوامر جهاز CoreAudio صريحة لجسر الصوت الافتراضي PCM16 بتردد 24 kHz.
- `blackhole-2ch`: برنامج تشغيل صوت افتراضي على macOS. ينشئ جهاز الصوت `BlackHole 2ch` الذي يمكن لـ Chrome/Meet التوجيه عبره.

لا يضمّن OpenClaw أياً من الحزمتين أو يعيد توزيعها. تطلب الوثائق من المستخدمين تثبيتهما كاعتماديات مضيف عبر Homebrew. SoX مرخّص بموجب `LGPL-2.0-only AND GPL-2.0-only`؛ وBlackHole بموجب GPL-3.0. إذا أنشأت مثبّتاً أو جهازاً يضمّن BlackHole مع OpenClaw، فراجع شروط ترخيص BlackHole من المصدر الأعلى أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

تفتح وسيلة نقل Chrome عنوان Meet عبر تحكم متصفح OpenClaw وتنضم باستخدام ملف تعريف متصفح OpenClaw المسجّل الدخول. على macOS، يتحقق Plugin من وجود `BlackHole 2ch` قبل التشغيل. وإذا كان مكوّناً، فإنه يشغّل أيضاً أمر صحة جسر الصوت وأمر بدء التشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت على مضيف Gateway؛ واستخدم `chrome-node` عندما يكون Chrome/الصوت على عقدة مقترنة مثل آلة Parallels macOS افتراضية. بالنسبة إلى Chrome المحلي، اختر ملف التعريف باستخدام `browser.defaultProfile`؛ ويتم تمرير `chrome.browserProfile` إلى مضيفي `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون وسماعة Chrome عبر جسر صوت OpenClaw المحلي. إذا لم يكن `BlackHole 2ch` مثبتاً، يفشل الانضمام بخطأ إعداد بدلاً من الانضمام بصمت من دون مسار صوت.

### Twilio

وسيلة نقل Twilio هي خطة اتصال صارمة مفوّضة إلى Plugin مكالمات الصوت. لا تحلل صفحات Meet بحثاً عن أرقام هاتف.

استخدم هذا عندما لا تكون المشاركة عبر Chrome متاحة أو عندما تريد خياراً احتياطياً للاتصال الهاتفي. يجب أن يوفّر Google Meet رقم اتصال هاتفي ورمز PIN للاجتماع؛ ولا يكتشف OpenClaw ذلك من صفحة Meet.

فعّل Plugin مكالمات الصوت على مضيف Gateway، وليس على عقدة Chrome:

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

وفّر بيانات اعتماد Twilio عبر البيئة أو الإعدادات. تبقي البيئة الأسرار خارج `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

أعد تشغيل Gateway أو أعد تحميله بعد تفعيل `voice-call`؛ لا تظهر تغييرات إعدادات Plugin في عملية Gateway قيد التشغيل بالفعل حتى تتم إعادة تحميلها.

ثم تحقق:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

عندما يكون تفويض Twilio موصولاً، يتضمن `googlemeet setup` فحوصات ناجحة لـ `twilio-voice-call-plugin` و`twilio-voice-call-credentials` و`twilio-voice-call-webhook`.

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

OAuth اختياري لإنشاء رابط Meet لأن `googlemeet create` يمكنه الرجوع إلى أتمتة المتصفح. كوّن OAuth عندما تريد الإنشاء عبر API الرسمي، أو حل المساحة، أو فحوصات تمهيدية لـ Meet Media API.

يستخدم وصول Google Meet API OAuth الخاص بالمستخدم: أنشئ عميل Google Cloud OAuth، واطلب النطاقات المطلوبة، وفوّض حساب Google، ثم خزّن رمز التحديث الناتج في إعدادات Google Meet Plugin أو وفّر متغيرات البيئة `OPENCLAW_GOOGLE_MEET_*`.

لا يحل OAuth محل مسار الانضمام عبر Chrome. لا تزال وسائل نقل Chrome وChrome-node تنضم عبر ملف تعريف Chrome مسجّل الدخول، وBlackHole/SoX، وعقدة متصلة عند استخدام المشاركة عبر المتصفح. OAuth مخصص فقط لمسار Google Meet API الرسمي: إنشاء مساحات الاجتماعات، وحل المساحات، وتشغيل فحوصات تمهيدية لـ Meet Media API.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو اختر واحداً.
2. فعّل **Google Meet REST API** لذلك المشروع.
3. كوّن شاشة موافقة OAuth.
   - **داخلي** هو الأبسط لمؤسسة Google Workspace.
   - **خارجي** يعمل للإعدادات الشخصية/الاختبارية؛ ما دام التطبيق في وضع الاختبار، أضف كل حساب Google سيخوّل التطبيق كمستخدم اختبار.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرّف عميل OAuth.
   - نوع التطبيق: **تطبيق ويب**.
   - عنوان URI لإعادة التوجيه المصرّح به:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرّف العميل وسر العميل.

`meetings.space.created` مطلوب بواسطة Google Meet `spaces.create`. يتيح `meetings.space.readonly` لـ OpenClaw حل عناوين/رموز Meet إلى مساحات. أما `meetings.conference.media.readonly` فهو للفحص التمهيدي لـ Meet Media API والعمل الإعلامي؛ وقد تطلب Google التسجيل في Developer Preview للاستخدام الفعلي لـ Media API. إذا كنت تحتاج فقط إلى انضمامات Chrome المستندة إلى المتصفح، فتجاوز OAuth بالكامل.

### إصدار رمز التحديث

كوّن `oauth.clientId` واختيارياً `oauth.clientSecret`، أو مررهما كمتغيرات بيئة، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعدادات `oauth` تتضمن رمز تحديث. يستخدم PKCE، واستدعاء localhost على `http://localhost:8085/oauth2callback`، وتدفق نسخ/لصق يدوي مع `--manual`.

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

خزّن كائن `oauth` ضمن إعدادات Google Meet Plugin:

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

فضّل متغيرات البيئة عندما لا تريد رمز التحديث في الإعدادات. إذا كانت قيم الإعدادات والبيئة موجودة معاً، يحل Plugin الإعدادات أولاً ثم يرجع إلى البيئة كخيار احتياطي.

تتضمن موافقة OAuth إنشاء مساحة Meet، ووصول قراءة لمساحة Meet، ووصول قراءة لوسائط مؤتمر Meet. إذا صادقت قبل وجود دعم إنشاء الاجتماعات، فأعد تشغيل `openclaw googlemeet auth login --json` كي يحتوي رمز التحديث على نطاق `meetings.space.created`.

### التحقق من OAuth باستخدام doctor

شغّل doctor الخاص بـ OAuth عندما تريد فحص صحة سريعاً لا يكشف أسراراً:

```bash
openclaw googlemeet doctor --oauth --json
```

لا يحمّل هذا وقت تشغيل Chrome ولا يتطلب عقدة Chrome متصلة. يتحقق من وجود إعدادات OAuth ومن قدرة رمز التحديث على إصدار رمز وصول. لا يتضمن تقرير JSON إلا حقول حالة مثل `ok` و`configured` و`tokenSource` و`expiresAt` ورسائل الفحص؛ ولا يطبع رمز الوصول أو رمز التحديث أو سر العميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | يوجد `oauth.clientId` مع `oauth.refreshToken`، أو رمز وصول مخزّن مؤقتاً.       |
| `oauth-token`        | رمز الوصول المخزّن مؤقتاً لا يزال صالحاً، أو أن رمز التحديث أصدر رمز وصول جديداً. |
| `meet-spaces-get`    | حلّ فحص `--meeting` الاختياري مساحة Meet موجودة.                             |
| `meet-spaces-create` | أنشأ فحص `--create-space` الاختياري مساحة Meet جديدة.                               |

لإثبات تفعيل Google Meet API ونطاق `spaces.create` أيضاً، شغّل فحص الإنشاء ذي الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

ينشئ `--create-space` عنوان Meet مؤقتاً. استخدمه عندما تحتاج إلى تأكيد أن مشروع Google Cloud فعّل Meet API وأن الحساب المخوّل يملك نطاق `meetings.space.created`.

لإثبات وصول القراءة لمساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` وصول القراءة إلى مساحة موجودة يستطيع حساب Google المخوّل الوصول إليها. يعني رد `403` من هذه الفحوصات عادةً أن Google Meet REST API معطل، أو أن رمز التحديث الموافق عليه يفتقد النطاق المطلوب، أو أن حساب Google لا يستطيع الوصول إلى مساحة Meet تلك. يعني خطأ رمز التحديث إعادة تشغيل `openclaw googlemeet auth login --json` وتخزين كتلة `oauth` الجديدة.

لا يلزم وجود بيانات اعتماد OAuth للرجوع الاحتياطي عبر المتصفح. في ذلك الوضع، تأتي مصادقة Google من ملف تعريف Chrome المسجّل الدخول على العقدة المحددة، وليس من إعدادات OpenClaw.

تُقبل متغيرات البيئة هذه كخيارات احتياطية:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

حلّ عنوان URL أو رمز Meet أو `spaces/{id}` عبر `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

شغّل فحص ما قبل التشغيل قبل العمل على الوسائط:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اسرد عناصر الاجتماع وسجل الحضور بعد أن ينشئ Meet سجلات المؤتمر:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

مع `--meeting`، يستخدم `artifacts` و`attendance` أحدث سجل مؤتمر
افتراضيًا. مرّر `--all-conference-records` عندما تريد كل سجل محتفَظ به
لذلك الاجتماع.

يمكن لبحث التقويم حلّ عنوان URL للاجتماع من Google Calendar قبل قراءة
عناصر Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` لليوم عن حدث Calendar يحتوي على رابط
Google Meet. استخدم `--event <query>` للبحث في نص الحدث المطابق، و
`--calendar <id>` لتقويم غير أساسي. يتطلب بحث التقويم تسجيل دخول OAuth حديثًا
يتضمن نطاق القراءة فقط لأحداث Calendar.
يعاين `calendar-events` أحداث Meet المطابقة ويميّز الحدث الذي سيختاره
`latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف معرّف سجل المؤتمر بالفعل، فخاطبه مباشرة:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

اكتب تقريرًا قابلاً للقراءة:

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
المشاركين والتسجيل والنص المنسوخ وإدخالات النص المنسوخ المنظّمة والملاحظات
الذكية عندما يتيحها Google للاجتماع. استخدم `--no-transcript-entries` لتجاوز
بحث الإدخالات في الاجتماعات الكبيرة. يوسّع `attendance` المشاركين إلى صفوف
جلسات مشاركين تتضمن أوقات أول/آخر ظهور، وإجمالي مدة الجلسة، وعلامات التأخر
والمغادرة المبكرة، وموارد المشاركين المكررة المدمجة حسب المستخدم المسجّل دخوله
أو اسم العرض. مرّر `--no-merge-duplicates` لإبقاء موارد المشاركين الخام
منفصلة، و`--late-after-minutes` لضبط اكتشاف التأخر، و
`--early-before-minutes` لضبط اكتشاف المغادرة المبكرة.

يكتب `export` مجلدًا يحتوي على `summary.md` و`attendance.csv` و
`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`.
يسجّل `manifest.json` الإدخال المختار، وخيارات التصدير، وسجلات المؤتمر،
وملفات الإخراج، والأعداد، ومصدر الرمز، وحدث Calendar عند استخدامه، وأي
تحذيرات استرجاع جزئي. مرّر `--zip` لكتابة أرشيف قابل للنقل أيضًا بجانب
المجلد. مرّر `--include-doc-bodies` لتصدير نص Google Docs المرتبط بالنص
المنسوخ والملاحظات الذكية عبر Google Drive `files.export`؛ يتطلب ذلك تسجيل
دخول OAuth حديثًا يتضمن نطاق القراءة فقط لـ Drive Meet. بدون
`--include-doc-bodies`، لا تتضمن التصديرات إلا بيانات Meet الوصفية وإدخالات
النص المنسوخ المنظّمة. إذا أعاد Google فشلًا جزئيًا في العناصر، مثل خطأ في
سرد الملاحظات الذكية، أو إدخالات النص المنسوخ، أو نص مستند Drive، يحتفظ
الملخص والملف التعريفي بالتحذير بدلًا من إفشال التصدير بالكامل.
استخدم `--dry-run` لجلب بيانات العناصر/الحضور نفسها وطباعة JSON الخاص بالملف
التعريفي دون إنشاء المجلد أو ملف ZIP. يكون ذلك مفيدًا قبل كتابة تصدير كبير
أو عندما يحتاج وكيل إلى الأعداد والسجلات المحددة والتحذيرات فقط.

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

اضبط `"dryRun": true` لإرجاع ملف التصدير التعريفي فقط وتجاوز عمليات كتابة الملفات.

شغّل اختبار الدخان الحي المحمي على اجتماع حقيقي محتفَظ به:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

بيئة اختبار الدخان الحي:

- يفعّل `OPENCLAW_LIVE_TEST=1` الاختبارات الحية المحمية.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL أو رمز Meet محتفَظ به أو
  `spaces/{id}`.
- يوفّر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرّف عميل OAuth.
- يوفّر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN` رمز التحديث.
- اختياري: يستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء الرجوع نفسها
  دون بادئة `OPENCLAW_`.

يحتاج اختبار الدخان الحي الأساسي للعناصر/الحضور إلى
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. يحتاج بحث
Calendar إلى `https://www.googleapis.com/auth/calendar.events.readonly`. يحتاج
تصدير نص مستند Drive إلى
`https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد والمصدر وجلسة الانضمام. مع بيانات اعتماد OAuth
يستخدم Google Meet API الرسمي. بدون بيانات اعتماد OAuth، يستخدم ملف تعريف
المتصفح المسجّل دخوله لعقدة Chrome المثبّتة كخيار احتياطي. يمكن للوكلاء
استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في خطوة
واحدة. للإنشاء باستخدام URL فقط، مرّر `"join": false`.

مثال إخراج JSON من خيار المتصفح الاحتياطي:

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

إذا واجه خيار المتصفح الاحتياطي عائق تسجيل دخول Google أو إذن Meet قبل أن
يتمكن من إنشاء عنوان URL، فإن طريقة Gateway تعيد استجابة فاشلة وتعيد أداة
`google_meet` تفاصيل منظّمة بدلًا من سلسلة نصية بسيطة:

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

عندما يرى وكيل `manualActionRequired: true`، يجب أن يبلّغ
`manualActionMessage` بالإضافة إلى سياق عقدة/تبويب المتصفح، وأن يتوقف عن فتح
تبويبات Meet جديدة حتى يكمل المشغّل خطوة المتصفح.

مثال إخراج JSON من إنشاء API:

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

ينضم إنشاء Meet افتراضيًا. ما زال نقل Chrome أو Chrome-node يحتاج إلى ملف
تعريف Google Chrome مسجّل دخوله للانضمام عبر المتصفح. إذا كان ملف التعريف
مسجّلًا خروجه، يبلّغ OpenClaw عن `manualActionRequired: true` أو خطأ خيار
متصفح احتياطي، ويطلب من المشغّل إكمال تسجيل دخول Google قبل إعادة المحاولة.

اضبط `preview.enrollmentAcknowledged: true` فقط بعد تأكيد أن مشروع Cloud
وكيان OAuth ومشاركي الاجتماع مسجّلون في Google Workspace Developer Preview
Program لواجهات Meet media APIs.

## الإعدادات

لا يحتاج مسار Chrome الفوري المشترك إلا إلى تفعيل Plugin وBlackHole وSoX
ومفتاح مزوّد صوت فوري خلفي. OpenAI هو الافتراضي؛ اضبط
`realtime.provider: "google"` لاستخدام Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

اضبط إعدادات Plugin ضمن `plugins.entries.google-meet.config`:

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
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم على شاشة ضيف Meet
  غير المسجّل دخوله
- `chrome.autoJoin: true`: ملء اسم الضيف والنقر على Join Now بأفضل جهد
  عبر أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تفعيل تبويب Meet موجود بدلًا من
  فتح نسخ مكررة
- `chrome.waitForInCallMs: 20000`: الانتظار حتى يبلّغ تبويب Meet أنه داخل المكالمة
  قبل تشغيل المقدمة الفورية
- `chrome.audioFormat: "pcm16-24khz"`: تنسيق صوت زوج الأوامر. استخدم
  `"g711-ulaw-8khz"` فقط لأزواج الأوامر القديمة/المخصصة التي ما زالت تصدر
  صوتًا هاتفيًا.
- `chrome.audioInputCommand`: أمر SoX يقرأ من CoreAudio `BlackHole 2ch`
  ويكتب الصوت في `chrome.audioFormat`
- `chrome.audioOutputCommand`: أمر SoX يقرأ الصوت في `chrome.audioFormat`
  ويكتب إلى CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة موجزة، مع
  `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية منطوق قصير عند اتصال الجسر الفوري؛ اضبطه على `""` للانضمام بصمت
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

`voiceCall.enabled` تكون قيمته الافتراضية `true`؛ ومع نقل Twilio يفوض
مكالمة PSTN الفعلية وDTMF وتحية المقدمة إلى Plugin Voice Call. يشغل Voice Call
تسلسل DTMF قبل فتح دفق الوسائط الفورية، ثم يستخدم نص المقدمة المحفوظ كتحية
فورية أولية. إذا لم يكن `voice-call` مفعلا، فسيظل بإمكان Google Meet التحقق من
خطة الاتصال وتسجيلها، لكنه لن يستطيع إجراء مكالمة Twilio.

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
VM. في كلتا الحالتين يعمل النموذج الفوري و`openclaw_agent_consult` على مضيف
Gateway، لذلك تبقى بيانات اعتماد النموذج هناك.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. استخدم
`action: "speak"` مع `sessionId` و`message` لجعل الوكيل الفوري يتحدث فورا.
استخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها، وتشغيل عبارة
معروفة، وإرجاع صحة `inCall` عندما يستطيع مضيف Chrome الإبلاغ عنها. يفرض
`test_speech` دائما `mode: "realtime"` ويفشل إذا طُلب منه العمل في
`mode: "transcribe"` لأن جلسات المراقبة فقط لا يمكنها إصدار الكلام عمدا. تستند
نتيجة `speechOutputVerified` الخاصة به إلى زيادة بايتات خرج الصوت الفوري أثناء
استدعاء الاختبار هذا، لذلك لا تُحتسب الجلسة المعاد استخدامها مع صوت أقدم كفحص
كلام ناجح جديد. استخدم `action: "leave"` لوضع علامة على انتهاء جلسة.

يتضمن `status` صحة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج
  ملف تعريف المتصفح إلى تسجيل دخول يدوي، أو قبول مضيف Meet، أو أذونات، أو
  إصلاح التحكم في المتصفح قبل أن يعمل الكلام
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ما إذا كان
  كلام Chrome المدار مسموحا به الآن. تعني `speechReady: false` أن OpenClaw لم
  يرسل عبارة المقدمة/الاختبار إلى جسر الصوت.
- `providerConnected` / `realtimeReady`: حالة جسر الصوت الفوري
- `lastInputAt` / `lastOutputAt`: آخر صوت تمت رؤيته من الجسر أو إرساله إليه

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## استشارة الوكيل الفوري

تم تحسين وضع Chrome الفوري لحلقة صوتية مباشرة. يسمع مزود الصوت الفوري صوت
الاجتماع ويتحدث عبر جسر الصوت المكوّن. عندما يحتاج النموذج الفوري إلى تفكير
أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية، يمكنه استدعاء
`openclaw_agent_consult`.

تشغل أداة الاستشارة وكيل OpenClaw العادي في الخلفية مع سياق نص الاجتماع الحديث
وتعيد إجابة منطوقة موجزة إلى جلسة الصوت الفورية. يمكن لنموذج الصوت بعد ذلك نطق
تلك الإجابة في الاجتماع. يستخدم أداة الاستشارة الفورية المشتركة نفسها التي
يستخدمها Voice Call.

افتراضيا، تعمل الاستشارات على الوكيل `main`. عيّن `realtime.agentId` عندما يجب
أن يستشير مسار Meet مساحة عمل وكيل OpenClaw مخصصة، وإعدادات النموذج الافتراضية،
وسياسة الأدوات، والذاكرة، وسجل الجلسة.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: كشف أداة الاستشارة وقصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`.
- `owner`: كشف أداة الاستشارة والسماح للوكيل العادي باستخدام سياسة أدوات
  الوكيل العادية.
- `none`: عدم كشف أداة الاستشارة لنموذج الصوت الفوري.

يتم تحديد نطاق مفتاح جلسة الاستشارة لكل جلسة Meet، لذلك يمكن لاستدعاءات
الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد انضمام Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

لاختبار الانضمام والكلام الكامل:

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
- يتضمن `googlemeet setup` قيمة `chrome-node-connected` عندما يكون Chrome-node
  هو النقل الافتراضي أو عندما تكون عقدة مثبتة.
- يعرض `nodes status` العقدة المحددة متصلة.
- تعلن العقدة المحددة كلا من `googlemeet.chrome` و`browser.proxy`.
- تنضم علامة تبويب Meet إلى المكالمة ويعيد `test-speech` صحة Chrome مع
  `inCall: true`.

بالنسبة إلى مضيف Chrome بعيد مثل Parallels macOS VM، هذا هو أقصر فحص آمن بعد
تحديث Gateway أو VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن Gateway Plugin محمّل، وأن عقدة VM متصلة بالرمز الحالي، وأن جسر صوت
Meet متاح قبل أن يفتح وكيل علامة تبويب اجتماع حقيقي.

لاختبار Twilio، استخدم اجتماعا يعرض تفاصيل الاتصال الهاتفي:

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
- يكون `voicecall` متاحا في CLI بعد إعادة تحميل Gateway.
- تحتوي الجلسة المعادة على `transport: "twilio"` و`twilio.voiceCallId`.
- يعرض `openclaw logs --follow` تقديم DTMF TwiML قبل TwiML الفوري، ثم جسرا
  فوريا مع تحية أولية في قائمة الانتظار.
- يقوم `googlemeet leave <sessionId>` بإنهاء مكالمة الصوت المفوضة.

## استكشاف الأخطاء وإصلاحها

### لا يستطيع الوكيل رؤية أداة Google Meet

تأكد من تمكين Plugin في إعداد Gateway وأعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد حررت `plugins.entries.google-meet` للتو، فأعد تشغيل Gateway أو أعد
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
الحالي. بالنسبة إلى Gateway على LAN، يعني هذا عادة:

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

شغّل `googlemeet test-speech` وافحص صحة Chrome المعادة. إذا أبلغ عن
`manualActionRequired: true`، فاعرض `manualActionMessage` على المشغل وتوقف عن
إعادة المحاولة حتى يكتمل إجراء المتصفح.

الإجراءات اليدوية الشائعة:

- سجل الدخول إلى ملف تعريف Chrome.
- اقبل الضيف من حساب مضيف Meet.
- امنح أذونات ميكروفون/كاميرا Chrome عندما تظهر مطالبة الأذونات الأصلية في
  Chrome.
- أغلق مربع حوار أذونات Meet العالق أو أصلحه.

لا تبلغ عن "not signed in" لمجرد أن Meet يعرض "Do you want people to hear you in
the meeting?" فذلك هو حاجز اختيار الصوت في Meet؛ ينقر OpenClaw على **Use
microphone** عبر أتمتة المتصفح عند توفرها ويواصل انتظار حالة الاجتماع الحقيقية.
بالنسبة إلى بديل المتصفح الخاص بالإنشاء فقط، قد ينقر OpenClaw على **Continue
without microphone** لأن إنشاء URL لا يحتاج إلى مسار الصوت الفوري.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` أولا نقطة نهاية Google Meet API `spaces.create`
عندما تكون بيانات اعتماد OAuth مكونة. وبدون بيانات اعتماد OAuth، يعود إلى
متصفح عقدة Chrome المثبتة. تأكد من الآتي:

- لإنشاء API: تم تكوين `oauth.clientId` و`oauth.refreshToken`، أو توجد متغيرات
  البيئة المطابقة `OPENCLAW_GOOGLE_MEET_*`.
- لإنشاء API: تم إصدار رمز التحديث بعد إضافة دعم الإنشاء. قد تفتقد الرموز
  الأقدم نطاق `meetings.space.created`؛ أعد تشغيل `openclaw googlemeet auth login --json` وحدث إعداد Plugin.
- لبديل المتصفح: يشير `defaultTransport: "chrome-node"` و`chromeNode.node` إلى
  عقدة متصلة تحتوي على `browser.proxy` و`googlemeet.chrome`.
- لبديل المتصفح: تم تسجيل دخول ملف تعريف OpenClaw Chrome على تلك العقدة إلى
  Google ويمكنه فتح `https://meet.google.com/new`.
- لبديل المتصفح: تعيد المحاولات استخدام علامة تبويب حالية لـ
  `https://meet.google.com/new` أو مطالبة حساب Google قبل فتح علامة تبويب
  جديدة. إذا انتهت مهلة وكيل، فأعد محاولة استدعاء الأداة بدلا من فتح علامة
  تبويب Meet أخرى يدويا.
- لبديل المتصفح: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم
  `browser.nodeId` و`browser.targetId` و`browserUrl` و`manualActionMessage`
  المعادة لتوجيه المشغل. لا تعد المحاولة في حلقة حتى يكتمل ذلك الإجراء.
- لبديل المتصفح: إذا عرض Meet "Do you want people to hear you in the
  meeting?"، فاترك علامة التبويب مفتوحة. يجب أن ينقر OpenClaw على **Use
  microphone** أو، بالنسبة إلى بديل الإنشاء فقط، **Continue without microphone**
  عبر أتمتة المتصفح ويواصل انتظار URL Meet المولّد. إذا لم يتمكن من ذلك، فيجب
  أن يذكر الخطأ `meet-audio-choice-required`، وليس `google-login-required`.

### ينضم الوكيل لكنه لا يتحدث

تحقق من المسار الفوري:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "realtime"` للاستماع والرد بالكلام. لا يبدأ
`mode: "transcribe"` جسر الصوت الفوري المزدوج عمدا. يتحقق
`googlemeet test-speech` دائما من المسار الفوري ويبلغ عما إذا تمت ملاحظة بايتات
خرج الجسر لذلك الاستدعاء. إذا كانت `speechOutputVerified` تساوي false وكانت
`speechOutputTimedOut` تساوي true، فقد يكون مزود الوقت الفعلي قد قبل النطق لكن
OpenClaw لم ير بايتات خرج جديدة تصل إلى جسر صوت Chrome.

تحقق أيضا من:

- يتوفر مفتاح مزود فوري على مضيف Gateway، مثل `OPENAI_API_KEY` أو
  `GEMINI_API_KEY`.
- يظهر `BlackHole 2ch` على مضيف Chrome.
- يوجد `sox` على مضيف Chrome.
- يتم توجيه ميكروفون Meet ومكبر الصوت عبر مسار الصوت الافتراضي الذي يستخدمه
  OpenClaw.

يطبع `googlemeet doctor [session-id]` الجلسة، والعقدة، وحالة داخل المكالمة،
وسبب الإجراء اليدوي، واتصال مزود الوقت الفعلي، و`realtimeReady`، ونشاط إدخال/خرج
الصوت، وآخر طوابع زمنية للصوت، وعدادات البايت، وURL المتصفح. استخدم
`googlemeet status [session-id] --json` عندما تحتاج إلى JSON الخام. استخدم
`googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث OAuth في Google
Meet دون كشف الرموز؛ أضف `--meeting` أو `--create-space` عندما تحتاج أيضا إلى
إثبات Google Meet API.

إذا انتهت مهلة وكيل ويمكنك رؤية علامة تبويب Meet مفتوحة بالفعل، فافحص تلك
العلامة دون فتح علامة أخرى:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. يركّز ويفحص تبويب Meet
موجودًا للنقل المحدد. مع `chrome`، يستخدم التحكم المحلي في المتصفح عبر
Gateway؛ ومع `chrome-node`، يستخدم عقدة Chrome المكوّنة. لا يفتح تبويبًا
جديدًا ولا ينشئ جلسة جديدة؛ بل يبلّغ عن العائق الحالي، مثل تسجيل الدخول أو
القبول أو الأذونات أو حالة اختيار الصوت. يتواصل أمر CLI مع Gateway المكوّن،
لذلك يجب أن يكون Gateway قيد التشغيل؛ ويتطلب `chrome-node` أيضًا أن تكون عقدة
Chrome متصلة.

### تفشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا به أو غير
مفعّل. أضفه إلى `plugins.allow`، وفعّل `plugins.entries.voice-call`، ثم أعد
تحميل Gateway.

يفشل `twilio-voice-call-credentials` عندما تفتقد خلفية Twilio معرّف الحساب
SID أو رمز المصادقة أو رقم المتصل. اضبط هذه القيم على مضيف Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

يفشل `twilio-voice-call-webhook` عندما لا يكون لدى `voice-call` تعريض Webhook
عام، أو عندما يشير `publicUrl` إلى local loopback أو مساحة شبكة خاصة.
اضبط `plugins.entries.voice-call.config.publicUrl` على عنوان URL العام للمزوّد
أو كوّن تعريض نفق/Tailscale لـ `voice-call`.

عناوين URL الخاصة بـ loopback والشبكات الخاصة غير صالحة لاستدعاءات شركات
الاتصالات. لا تستخدم `localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو
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

يكون `voicecall smoke` مخصصًا للتحقق من الجاهزية فقط افتراضيًا. لإجراء تجربة
جافة على رقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

لا تضف `--yes` إلا عندما تريد عمدًا إجراء مكالمة إشعار صادرة حية:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تبدأ مكالمة Twilio لكنها لا تدخل الاجتماع أبدًا

تحقق من أن حدث Meet يعرِض تفاصيل الاتصال الهاتفي. مرّر رقم الاتصال الهاتفي
والرمز PIN بالضبط أو تسلسل DTMF مخصصًا:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم `w` بادئة أو فواصل في `--dtmf-sequence` إذا كان المزوّد يحتاج إلى
إيقاف مؤقت قبل إدخال PIN.

إذا تم إنشاء المكالمة الهاتفية لكن قائمة Meet لا تعرض مشارك الاتصال الهاتفي
أبدًا:

- شغّل `openclaw voicecall status --call-id <id>` وتأكد من أن المكالمة لا تزال
  نشطة.
- شغّل `openclaw voicecall tail` وتحقق من أن Webhooks الخاصة بـ Twilio تصل إلى
  Gateway.
- شغّل `openclaw logs --follow` وابحث عن تسلسل Twilio Meet: يفوّض Google
  Meet الانضمام، ويخزّن Voice Call ‏TwiML الخاص بـ DTMF قبل الاتصال، ويقدّم
  TwiML الأولي هذا، ثم يقدّم TwiML الفوري ويبدأ الجسر الفوري مع
  `initialGreeting=queued`.
- أعد تشغيل `openclaw googlemeet setup --transport twilio`؛ يلزم فحص إعداد
  أخضر لكنه لا يثبت أن تسلسل PIN للاجتماع صحيح.
- تحقق من أن رقم الاتصال الهاتفي ينتمي إلى دعوة Meet والمنطقة نفسيهما مثل
  PIN.
- زِد الإيقافات المؤقتة البادئة في `--dtmf-sequence` إذا كان Meet يجيب ببطء،
  مثل `wwww123456#`.
- إذا انضم المشارك لكنك لا تسمع التحية، فافحص `openclaw logs --follow` بحثًا
  عن TwiML الفوري، وبدء تشغيل الجسر الفوري، و`initialGreeting=queued`. تُنشأ
  التحية من رسالة `voicecall.start` الأولية بعد اتصال الجسر الفوري.

إذا لم تصل Webhooks، فابدأ بتصحيح Plugin ‏Voice Call: يجب أن يتمكن المزوّد من
الوصول إلى `plugins.entries.voice-call.config.publicUrl` أو النفق المكوّن.
راجع [استكشاف أخطاء المكالمات الصوتية وإصلاحها](/ar/plugins/voice-call#troubleshooting).

## ملاحظات

واجهة API الرسمية للوسائط في Google Meet موجهة للاستقبال، لذلك لا يزال
التحدث داخل مكالمة Meet يحتاج إلى مسار مشارك. يبقي هذا Plugin ذلك الحد مرئيًا:
يتولى Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ ويتولى Twilio مشاركة
الاتصال الهاتفي.

يحتاج وضع Chrome الفوري إلى `BlackHole 2ch` بالإضافة إلى أحد الخيارين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يمتلك OpenClaw
  جسر نموذج الوقت الفعلي ويمرّر الصوت بصيغة `chrome.audioFormat` بين تلك
  الأوامر ومزوّد الصوت الفوري المحدد. مسار Chrome الافتراضي هو PCM16 بمعدل
  24 كيلوهرتز؛ ويظل G.711 mu-law بمعدل 8 كيلوهرتز متاحًا لأزواج الأوامر
  القديمة.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي بالكامل
  ويجب أن يخرج بعد بدء تشغيل الخادم الخفي الخاص به أو التحقق منه.

للحصول على صوت مزدوج نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة افتراضية
منفصلة أو مخطط أجهزة افتراضية بأسلوب Loopback. يمكن لجهاز BlackHole مشترك
واحد أن يعيد صدى المشاركين الآخرين إلى المكالمة.

يشغّل `googlemeet speak` جسر الصوت الفوري النشط لجلسة Chrome. يوقف
`googlemeet leave` ذلك الجسر. بالنسبة إلى جلسات Twilio المفوّضة عبر Plugin
‏Voice Call، فإن `leave` ينهي أيضًا مكالمة الصوت الأساسية.

## ذات صلة

- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
