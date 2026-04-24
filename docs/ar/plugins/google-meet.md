---
read_when:
    - تريد من وكيل OpenClaw الانضمام إلى مكالمة Google Meet
    - أنت تقوم بتكوين Chrome أو عقدة Chrome أو Twilio كوسيلة نقل لـ Google Meet
summary: 'Plugin ‏Google Meet: الانضمام إلى عناوين URL الخاصة بـ Meet المحددة صراحةً عبر Chrome أو Twilio مع الإعدادات الافتراضية للصوت في الوقت الفعلي'
title: Plugin ‏Google Meet
x-i18n:
    generated_at: "2026-04-24T09:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

دعم المشاركين في Google Meet لـ OpenClaw.

تم تصميم الـ Plugin ليكون صريحًا عمدًا:

- لا ينضم إلا إلى عنوان URL صريح من نوع `https://meet.google.com/...`.
- يكون صوت `realtime` هو الوضع الافتراضي.
- يمكن لصوت الوقت الفعلي الرجوع إلى وكيل OpenClaw الكامل عندما تكون هناك حاجة إلى
  استدلال أعمق أو أدوات.
- تبدأ المصادقة باستخدام Google OAuth شخصي أو ملف تعريف Chrome مسجّل الدخول بالفعل.
- لا يوجد إعلان موافقة تلقائي.
- تكون الواجهة الخلفية الصوتية الافتراضية لـ Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف Node مقترن.
- يقبل Twilio رقم اتصال هاتفي بالإضافة إلى رقم PIN اختياري أو تسلسل DTMF.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لسير عمل
  مؤتمرات الوكيل الأوسع.

## البدء السريع

ثبّت تبعيات الصوت المحلية وتأكد من أن موفّر الوقت الفعلي يمكنه استخدام
OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

يقوم `blackhole-2ch` بتثبيت جهاز الصوت الافتراضي `BlackHole 2ch`. يتطلب
مثبّت Homebrew إعادة تشغيل قبل أن يوفّر macOS الجهاز:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من الجزأين كليهما:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

انضم إلى اجتماع:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو دع وكيلاً ينضم عبر أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

ينضم Chrome باستخدام ملف تعريف Chrome المسجّل الدخول. في Meet، اختر `BlackHole 2ch`
لمسار الميكروفون/مكبر الصوت الذي يستخدمه OpenClaw. للحصول على صوت ثنائي الاتجاه
نظيف، استخدم أجهزة افتراضية منفصلة أو مخططًا على نمط Loopback؛ يكفي جهاز
BlackHole واحد لاختبار أولي سريع لكنه قد يسبب صدى.

### Gateway محلي + Chrome على Parallels

أنت **لا** تحتاج إلى Gateway كامل من OpenClaw أو مفتاح API للنموذج داخل جهاز macOS افتراضي
فقط لكي يمتلك الجهاز الافتراضي Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل
مضيف Node في الجهاز الافتراضي. فعّل الـ Plugin المضمّن على الجهاز الافتراضي مرة واحدة حتى
يعلن الـ Node عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway، مساحة عمل الوكيل، مفاتيح النموذج/API، موفّر
  الوقت الفعلي، وإعداد Google Meet Plugin.
- جهاز macOS افتراضي على Parallels: OpenClaw CLI/مضيف Node، وGoogle Chrome، وSoX، وBlackHole 2ch،
  وملف تعريف Chrome مسجّل الدخول إلى Google.
- غير مطلوب داخل الجهاز الافتراضي: خدمة Gateway، أو إعداد الوكيل، أو مفتاح OpenAI/GPT، أو إعداد
  موفّر النموذج.

ثبّت تبعيات الجهاز الافتراضي:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل الجهاز الافتراضي بعد تثبيت BlackHole حتى يوفّر macOS ‏`BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من أن الجهاز الافتراضي يمكنه رؤية جهاز الصوت وأوامر SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

ثبّت OpenClaw أو حدّثه في الجهاز الافتراضي، ثم فعّل الـ Plugin المضمّن هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ تشغيل مضيف Node في الجهاز الافتراضي:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على الشبكة المحلية وأنت لا تستخدم TLS، فسيرفض الـ Node
اتصال WebSocket النصي الصريح ما لم توافق صراحةً على هذه الشبكة الخاصة الموثوقة:

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

إن `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو متغير بيئة للعملية، وليس
إعدادًا في `openclaw.json`. يقوم `openclaw node install` بتخزينه في بيئة LaunchAgent
عندما يكون موجودًا في أمر التثبيت.

وافق على الـ Node من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

أكد أن Gateway يرى الـ Node وأنه يعلن عن `googlemeet.chrome`:

```bash
openclaw nodes status
```

وجّه Meet عبر ذلك الـ Node على مضيف Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
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

إذا تم حذف `chromeNode.node`، فسيقوم OpenClaw بالاختيار التلقائي فقط عندما
يعلن Node واحد متصل بالضبط عن `googlemeet.chrome`. إذا كانت هناك عدة
Nodes قادرة ومتّصلة، فاضبط `chromeNode.node` على معرّف الـ Node أو اسم العرض أو عنوان IP البعيد.

فحوصات الأعطال الشائعة:

- `No connected Google Meet-capable node`: ابدأ تشغيل `openclaw node run` في الجهاز الافتراضي،
  ووافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet`
  في الجهاز الافتراضي. أكّد أيضًا أن مضيف Gateway يسمح بأمر الـ Node باستخدام
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في الجهاز الافتراضي وأعد تشغيله.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى Chrome داخل الجهاز الافتراضي وتأكد من أن
  ملف التعريف هذا يمكنه الانضمام إلى عنوان URL الخاص بـ Meet يدويًا.
- لا يوجد صوت: في Meet، وجّه الميكروفون/مكبر الصوت عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيهًا على نمط Loopback
  للحصول على صوت ثنائي الاتجاه نظيف.

## ملاحظات التثبيت

يستخدم وضع Chrome الافتراضي للوقت الفعلي أداتين خارجيتين:

- `sox`: أداة صوت عبر سطر الأوامر. يستخدم الـ Plugin أمريها `rec` و`play`
  لجسر الصوت الافتراضي 8 كيلوهرتز G.711 mu-law.
- `blackhole-2ch`: برنامج تشغيل صوت افتراضي لـ macOS. ينشئ جهاز الصوت
  `BlackHole 2ch` الذي يمكن لـ Chrome/Meet التوجيه من خلاله.

لا يقوم OpenClaw بتضمين أي من الحزمتين أو إعادة توزيعهما. تطلب الوثائق من المستخدمين
تثبيتهما كتبعيات على المضيف عبر Homebrew. تُرخّص SoX بموجب
`LGPL-2.0-only AND GPL-2.0-only`؛ أما BlackHole فمرخّص بموجب GPL-3.0. إذا أنشأت
برنامج تثبيت أو جهازًا يضمّن BlackHole مع OpenClaw، فراجع شروط الترخيص
الأصلية لـ BlackHole أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

تفتح وسيلة نقل Chrome عنوان URL الخاص بـ Meet في Google Chrome وتنضم باستخدام
ملف تعريف Chrome المسجّل الدخول. على macOS، يتحقق الـ Plugin من وجود `BlackHole 2ch` قبل التشغيل.
إذا تم تكوين ذلك، فإنه يشغّل أيضًا أمر فحص سلامة جسر الصوت وأمر بدء التشغيل
قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت موجودين على مضيف Gateway؛
واستخدم `chrome-node` عندما يكون Chrome/الصوت موجودين على Node مقترن مثل جهاز macOS افتراضي على Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون Chrome ومكبر الصوت عبر جسر الصوت المحلي لـ OpenClaw.
إذا لم يكن `BlackHole 2ch` مثبتًا، فسيفشل الانضمام مع خطأ إعداد
بدلاً من الانضمام بصمت دون مسار صوت.

### Twilio

وسيلة نقل Twilio هي خطة اتصال صارمة مفوضة إلى Voice Call Plugin. وهي
لا تحلل صفحات Meet بحثًا عن أرقام الهاتف.

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

يستخدم الوصول إلى Google Meet Media API عميل OAuth شخصيًا في البداية. قم بتكوين
`oauth.clientId` واختياريًا `oauth.clientSecret`، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعداد `oauth` تحتوي على رمز تحديث. وهو يستخدم PKCE،
واستدعاء localhost على `http://localhost:8085/oauth2callback`، وتدفق
نسخ/لصق يدوي مع `--manual`.

تُقبل متغيرات البيئة التالية كبدائل احتياطية:

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

شغّل الفحص المسبق قبل العمل على الوسائط:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اضبط `preview.enrollmentAcknowledged: true` فقط بعد التأكد من أن مشروع Cloud الخاص بك،
وكيان OAuth، والمشاركين في الاجتماع مسجّلون في Google
Workspace Developer Preview Program لواجهات Meet media APIs.

## الإعداد

يحتاج مسار Chrome الشائع للوقت الفعلي فقط إلى تفعيل الـ Plugin، وBlackHole، وSoX،
ومفتاح OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

اضبط إعداد الـ Plugin ضمن `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: معرّف/اسم/IP اختياري للـ Node من أجل `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: أمر SoX `rec` يكتب صوت
  8 كيلوهرتز G.711 mu-law إلى stdout
- `chrome.audioOutputCommand`: أمر SoX `play` يقرأ صوت
  8 كيلوهرتز G.711 mu-law من stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود صوتية موجزة، مع
  `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية صوتي قصير عندما يتصل جسر الوقت الفعلي؛
  اضبطه على `""` للانضمام بصمت

تجاوزات اختيارية:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
    introMessage: "قل حرفيًا: I'm here.",
  },
}
```

إعداد خاص بـ Twilio فقط:

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
`transport: "chrome-node"` عندما يعمل Chrome على Node مقترن مثل جهاز
افتراضي على Parallels. في كلتا الحالتين، يعمل نموذج الوقت الفعلي و`openclaw_agent_consult` على
مضيف Gateway، لذا تبقى بيانات اعتماد النموذج هناك.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. واستخدم
`action: "speak"` مع `sessionId` و`message` لجعل
وكيل الوقت الفعلي يتحدث فورًا. واستخدم `action: "leave"` لوضع علامة على انتهاء الجلسة.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "قل حرفيًا: I'm here and listening."
}
```

## استشارة وكيل الوقت الفعلي

تم تحسين وضع Chrome للوقت الفعلي من أجل حلقة صوتية مباشرة. يسمع
موفّر الصوت في الوقت الفعلي صوت الاجتماع ويتحدث عبر جسر الصوت المُكوَّن.
وعندما يحتاج نموذج الوقت الفعلي إلى استدلال أعمق، أو معلومات حالية، أو أدوات
OpenClaw العادية، يمكنه استدعاء `openclaw_agent_consult`.

تعمل أداة الاستشارة على تشغيل وكيل OpenClaw العادي في الخلفية مع سياق حديث
من نص الاجتماع، وتعيد إجابة صوتية موجزة إلى جلسة الصوت في `realtime`. ويمكن
لنموذج الصوت بعد ذلك نطق تلك الإجابة مرة أخرى داخل الاجتماع.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: يعرض أداة الاستشارة ويقيّد الوكيل العادي إلى
  `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و
  `memory_get`.
- `owner`: يعرض أداة الاستشارة ويتيح للوكيل العادي استخدام سياسة أدوات
  الوكيل العادية.
- `none`: لا يعرض أداة الاستشارة إلى نموذج الصوت في `realtime`.

يتم تحديد نطاق مفتاح جلسة الاستشارة لكل جلسة Meet، لذا يمكن لاستدعاءات
الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد أن ينضم Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## ملاحظات

إن Media API الرسمية في Google Meet موجّهة نحو الاستقبال، لذا فإن التحدث داخل
مكالمة Meet لا يزال يحتاج إلى مسار مشارك. يُبقي هذا الـ Plugin هذا الحد واضحًا:
يتولى Chrome مشاركة المتصفح وتوجيه الصوت المحلي؛ ويتولى Twilio مشاركة
الاتصال الهاتفي.

يتطلب وضع Chrome في `realtime` أحد الخيارين التاليين:

- `chrome.audioInputCommand` بالإضافة إلى `chrome.audioOutputCommand`: يمتلك OpenClaw
  جسر نموذج الوقت الفعلي ويمرر صوت 8 كيلوهرتز G.711 mu-law بين هذين
  الأمرين وموفّر الصوت المحدد في `realtime`.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي بالكامل
  ويجب أن يخرج بعد بدء خدمته الخلفية أو التحقق منها.

للحصول على صوت ثنائي الاتجاه نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة
افتراضية منفصلة أو مخطط أجهزة افتراضية على نمط Loopback. قد يتسبب جهاز
BlackHole مشترك واحد في إعادة صدى المشاركين الآخرين إلى داخل المكالمة.

يقوم `googlemeet speak` بتشغيل جسر الصوت النشط في `realtime` لجلسة
Chrome. ويقوم `googlemeet leave` بإيقاف ذلك الجسر. أما بالنسبة إلى جلسات Twilio
المفوّضة عبر Voice Call Plugin، فإن `leave` ينهي أيضًا مكالمة الصوت الأساسية.

## ذو صلة

- [Voice call plugin](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
