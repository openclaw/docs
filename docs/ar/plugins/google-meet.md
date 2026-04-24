---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet【อ่านข้อความเต็มanalysis to=functions.read  天天中彩票买json 21 0 2000 {"path":"/home/runner/work/docs/docs/source/.i18n/glossary.ar.json"}
    - أنت تقوم بإعداد Chrome أو Chrome node أو Twilio كوسيلة نقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL صريحة لاجتماعات Meet عبر Chrome أو Twilio مع إعدادات صوت فوري افتراضية'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T07:54:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0bf06b7ab585bf2dc9dbf6d890e1954e89e4deea148380e350d2d7f4d954f5e
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

دعم المشارك في Google Meet لـ OpenClaw.

تم تصميم Plugin لتكون صريحة عمدًا:

- لا تنضم إلا إلى عنوان URL صريح من نوع `https://meet.google.com/...`.
- يكون الصوت `realtime` هو الوضع الافتراضي.
- يمكن للصوت الفوري الرجوع إلى وكيل OpenClaw الكامل عندما تكون هناك حاجة إلى
  تفكير أعمق أو أدوات.
- تبدأ المصادقة إما عبر Google OAuth شخصية أو عبر profile ‏Chrome مسجّل الدخول مسبقًا.
- لا يوجد إعلان موافقة تلقائي.
- تكون الواجهة الخلفية الصوتية الافتراضية لـ Chrome هي `BlackHole 2ch`.
- يمكن تشغيل Chrome محليًا أو على مضيف node مقترن.
- يقبل Twilio رقم اتصال هاتفيًا مع PIN اختياري أو تسلسل DTMF.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لسير عمل
  المؤتمرات الهاتفية الأوسع للوكلاء.

## بدء سريع

ثبّت تبعيات الصوت المحلية وتأكد من أن موفر realtime يمكنه استخدام
OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

يقوم `blackhole-2ch` بتثبيت جهاز الصوت الافتراضي `BlackHole 2ch`. ويتطلب
مثبّت Homebrew إعادة تشغيل قبل أن يكشف macOS الجهاز:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقق من الجزأين:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

انضم إلى اجتماع:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو دع وكيلًا ينضم عبر أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

ينضم Chrome باستخدام profile ‏Chrome المسجّل الدخول بها. وفي Meet، اختر `BlackHole 2ch` لمسار
الميكروفون/السماعة الذي يستخدمه OpenClaw. وللحصول على صوت مزدوج نظيف، استخدم
أجهزة افتراضية منفصلة أو مخططًا على نمط Loopback؛ يكفي جهاز BlackHole واحد
لاختبار smoke أولي لكنه قد يسبب صدى.

### Gateway محلية + Chrome على Parallels

أنت **لا** تحتاج إلى OpenClaw Gateway كاملة أو مفتاح API للنموذج داخل آلة macOS
افتراضية فقط لكي تمتلك الآلة Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل
مضيف node في الآلة الافتراضية. فعّل Plugin المضمنة على الآلة الافتراضية مرة واحدة حتى
تعلن node عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: ‏OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API، وموفر
  realtime، وإعداد Plugin Google Meet.
- آلة Parallels macOS الافتراضية: ‏OpenClaw CLI/node host، وGoogle Chrome، وSoX، وBlackHole 2ch،
  وprofile ‏Chrome مسجّل الدخول بها إلى Google.
- غير مطلوب في الآلة الافتراضية: خدمة Gateway، أو إعدادات الوكيل، أو مفتاح OpenAI/GPT، أو إعداد موفر
  النموذج.

ثبّت تبعيات الآلة الافتراضية:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل الآلة الافتراضية بعد تثبيت BlackHole حتى يكشف macOS ‏`BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقق من أن الآلة الافتراضية يمكنها رؤية جهاز الصوت وأوامر SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

ثبّت OpenClaw أو حدّثها في الآلة الافتراضية، ثم فعّل Plugin المضمنة هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ مضيف node في الآلة الافتراضية:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان LAN IP ولم تكن تستخدم TLS، فإن node ترفض
WebSocket النصية الصريحة ما لم تقم بالاشتراك في تلك الشبكة الخاصة الموثوقة:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

استخدم متغير البيئة نفسه عند تثبيت node بوصفها LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

تُعد `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` متغير بيئة للعملية، وليست
إعدادًا في `openclaw.json`. ويخزن `openclaw node install` هذا المتغير في بيئة LaunchAgent
عندما يكون موجودًا في أمر التثبيت.

وافق على node من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

أكد أن Gateway ترى node وأنها تعلن عن `googlemeet.chrome`:

```bash
openclaw nodes status
```

وجّه Meet عبر تلك node على مضيف Gateway:

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

الآن انضم كالمعتاد من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اطلب من الوكيل استخدام أداة `google_meet` مع `transport: "chrome-node"`.

إذا تم حذف `chromeNode.node`، فإن OpenClaw تختار تلقائيًا فقط عندما تعلن
node واحدة متصلة بالضبط عن `googlemeet.chrome`. وإذا كانت عدة nodes قادرة
متصلة، فاضبط `chromeNode.node` على معرّف node أو اسم العرض أو عنوان IP البعيد.

فحوصات الأعطال الشائعة:

- `No connected Google Meet-capable node`: ابدأ `openclaw node run` في الآلة الافتراضية،
  ووافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet`
  في الآلة الافتراضية. وتأكد أيضًا من أن مضيف Gateway يسمح بأمر node عبر
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في الآلة الافتراضية وأعد تشغيلها.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى Chrome داخل الآلة الافتراضية وتأكد من أن
  تلك profile تستطيع الانضمام إلى عنوان Meet يدويًا.
- لا يوجد صوت: في Meet، وجّه الميكروفون/السماعة عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ واستخدم أجهزة افتراضية منفصلة أو توجيهًا على نمط Loopback
  للحصول على صوت مزدوج نظيف.

## ملاحظات التثبيت

يستخدم الافتراضي realtime في Chrome أداتين خارجيتين:

- `sox`: أداة صوت عبر سطر الأوامر. تستخدم Plugin أمري `rec` و`play`
  منها من أجل جسر الصوت الافتراضي G.711 mu-law ‏8 كيلوهرتز.
- `blackhole-2ch`: مشغل صوت افتراضي لـ macOS. وهو ينشئ جهاز الصوت `BlackHole 2ch`
  الذي يمكن لـ Chrome/Meet التوجيه عبره.

لا تقوم OpenClaw بتضمين أي من الحزمتين أو إعادة توزيعهما. وتطلب الوثائق من المستخدمين
تثبيتهما كتبعيات على المضيف عبر Homebrew. تُرخّص SoX بموجب
`LGPL-2.0-only AND GPL-2.0-only`؛ أما BlackHole فبموجب GPL-3.0. وإذا قمت ببناء
مثبّت أو appliance يضمّن BlackHole مع OpenClaw، فراجع شروط الترخيص في المصدر العلوي لـ BlackHole
أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

تفتح وسيلة نقل Chrome عنوان Meet في Google Chrome وتنضم باستخدام
profile ‏Chrome المسجل الدخول بها. وعلى macOS، تتحقق Plugin من `BlackHole 2ch` قبل التشغيل.
وإذا تم الضبط، فإنها تشغّل أيضًا أمر فحص صحة جسر الصوت وأمر بدء التشغيل
قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت على مضيف Gateway؛
واستخدم `chrome-node` عندما يكون Chrome/الصوت على node مقترنة مثل آلة Parallels
macOS افتراضية.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت ميكروفون وسماعة Chrome عبر جسر الصوت المحلي الخاص بـ OpenClaw.
إذا لم يكن `BlackHole 2ch` مثبتًا، فإن الانضمام يفشل مع خطأ إعداد
بدلًا من الانضمام بصمت من دون مسار صوت.

### Twilio

تمثل وسيلة نقل Twilio خطة اتصال صارمة مفوضة إلى Plugin Voice Call. وهي
لا تحلل صفحات Meet لاستخراج أرقام الهواتف.

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

يستخدم الوصول إلى Google Meet Media API عميل OAuth شخصيًا أولًا. اضبط
`oauth.clientId` و`oauth.clientSecret` اختياريًا، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع الأمر كتلة إعداد `oauth` تحتوي على refresh token. وهو يستخدم PKCE،
واستدعاء localhost عند `http://localhost:8085/oauth2callback`، وتدفق
نسخ/لصق يدوي مع `--manual`.

تُقبل متغيرات البيئة التالية كقيم رجوع:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

قم بحل عنوان Meet أو رمزه أو `spaces/{id}` عبر `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

شغّل الفحص المسبق قبل العمل على الوسائط:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اضبط `preview.enrollmentAcknowledged: true` فقط بعد التأكد من أن مشروع Cloud وOAuth principal
والمشاركين في الاجتماع مسجلون في Google Workspace Developer Preview Program الخاصة بـ Meet media APIs.

## الإعداد

يحتاج المسار الشائع لـ Chrome realtime فقط إلى تمكين Plugin، وBlackHole، وSoX،
ومفتاح OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

اضبط إعداد Plugin تحت `plugins.entries.google-meet.config`:

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
- `chrome.audioInputCommand`: أمر SoX ‏`rec` يكتب صوت
  G.711 mu-law ‏8 كيلوهرتز إلى stdout
- `chrome.audioOutputCommand`: أمر SoX ‏`play` يقرأ صوت
  G.711 mu-law ‏8 كيلوهرتز من stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة موجزة، مع
  `openclaw_agent_consult` للإجابات الأعمق

التجاوزات الاختيارية:

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
`transport: "chrome-node"` عندما يعمل Chrome على node مقترنة مثل آلة Parallels
VM. وفي كلتا الحالتين، يعمل نموذج realtime و`openclaw_agent_consult` على
مضيف Gateway، لذلك تبقى بيانات اعتماد النموذج هناك.

استخدم `action: "status"` لإدراج الجلسات النشطة أو فحص معرّف جلسة. واستخدم
`action: "leave"` لتمييز جلسة على أنها منتهية.

## استشارة الوكيل في realtime

تم تحسين وضع Chrome realtime من أجل حلقة صوتية مباشرة. يسمع موفر الصوت
الفوري صوت الاجتماع ويتحدث عبر جسر الصوت المضبوط.
وعندما يحتاج نموذج realtime إلى تفكير أعمق، أو معلومات حالية، أو أدوات OpenClaw
العادية، يمكنه استدعاء `openclaw_agent_consult`.

تشغّل أداة الاستشارة وكيل OpenClaw العادي في الخلفية مع سياق حديث من نص
الاجتماع، وتعيد إجابة منطوقة موجزة إلى جلسة الصوت الفوري. ويمكن لنموذج الصوت
بعد ذلك أن ينطق تلك الإجابة مرة أخرى داخل الاجتماع.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: يعرض أداة الاستشارة ويقصر الوكيل العادي على
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, و
  `memory_get`.
- `owner`: يعرض أداة الاستشارة ويسمح للوكيل العادي باستخدام
  سياسة أدوات الوكيل العادية.
- `none`: لا يعرض أداة الاستشارة إلى نموذج الصوت الفوري.

يكون مفتاح جلسة الاستشارة ضمن نطاق كل جلسة Meet، بحيث يمكن لاستدعاءات
الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

## ملاحظات

تكون media API الرسمية لـ Google Meet موجهة للاستقبال، لذا فإن التحدث داخل
مكالمة Meet لا يزال يحتاج إلى مسار مشارك. وتُبقي هذه Plugin هذا الحد مرئيًا:
يتولى Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ ويتولى Twilio
المشاركة عبر الاتصال الهاتفي.

يتطلب وضع Chrome realtime أحد الخيارين التاليين:

- `chrome.audioInputCommand` بالإضافة إلى `chrome.audioOutputCommand`: تمتلك OpenClaw
  جسر نموذج realtime وتمرر صوت G.711 mu-law ‏8 كيلوهرتز بين هذه
  الأوامر وموفر الصوت الفوري المحدد.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي بالكامل
  ويجب أن يخرج بعد بدء daemon الخاصة به أو التحقق منها.

للحصول على صوت مزدوج نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة افتراضية
منفصلة أو عبر مخطط جهاز افتراضي على نمط Loopback. ويمكن لجهاز BlackHole مشترك واحد أن
يعيد صدى المشاركين الآخرين داخل المكالمة.

يقوم `googlemeet leave` بإيقاف جسر الصوت الفوري المكوّن من زوج أوامر في جلسات
Chrome. أما بالنسبة إلى جلسات Twilio المفوضة عبر Plugin Voice Call، فإنه ينهي أيضًا
المكالمة الصوتية الأساسية.

## ذو صلة

- [Plugin Voice Call](/ar/plugins/voice-call)
- [وضع Talk](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
