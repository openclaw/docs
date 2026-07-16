---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - تريد من وكيل OpenClaw إنشاء مكالمة Google Meet جديدة
    - أنت تهيئ Chrome أو عقدة Chrome أو Twilio كوسيلة نقل لـ Google Meet
summary: 'Plugin Google Meet: الانضمام إلى عناوين URL صريحة لـ Meet عبر Chrome أو Twilio مع الإعدادات الافتراضية لردّ الوكيل صوتيًا'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-07-16T14:38:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

ينضم Plugin ‏`google-meet` إلى عناوين URL صريحة لاجتماعات Meet نيابةً عن وكيل OpenClaw. وقد صُمم بنطاق محدود عمدًا:

- لا ينضم إلا إلى عناوين URL من نوع `https://meet.google.com/...`؛ ولا يتصل أبدًا باجتماع عبر رقم هاتف يكتشفه بنفسه.
- يمكن لـ `googlemeet create` إنشاء عنوان URL جديد لاجتماع Meet عبر Google Meet API (أو آلية احتياطية عبر المتصفح) والانضمام إليه افتراضيًا.
- تستخدم المشاركة عبر Chrome ملفًا شخصيًا مسجل الدخول في Chrome، ويمكن أن يكون ذلك اختياريًا على Node مقترنة. أما المشاركة عبر Twilio فتتصل برقم هاتف مع رمز PIN/نغمات DTMF من خلال [Plugin المكالمات الصوتية](/ar/plugins/voice-call)؛ ولا يمكنها الاتصال بعنوان URL لاجتماع Meet مباشرةً.
- يقوم `mode: "agent"` (الافتراضي) بنسخ كلام المشاركين باستخدام موفر آني، ويوجهه إلى وكيل OpenClaw المكوَّن، وينطق الإجابة باستخدام تحويل النص إلى كلام المعتاد في OpenClaw. يتيح `mode: "bidi"` لنموذج صوتي آني الإجابة مباشرةً. وينضم `mode: "transcribe"` للمراقبة فقط من دون رد صوتي.
- لا يوجد إعلان تلقائي عن الموافقة عندما ينضم Plugin إلى مكالمة.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لسير عمل المؤتمرات الهاتفية الأوسع للوكلاء.

## البدء السريع

ثبّت تبعيات الصوت المحلية، ثم عيّن مفتاح موفر آني. يُعد OpenAI موفر النسخ الافتراضي لوضع `agent`؛ ويتوفر Google Gemini Live بوصفه موفر الصوت لوضع `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# يلزم فقط عندما تكون realtime.voiceProvider هي "google" لوضع bidi
export GEMINI_API_KEY=...
```

يثبّت `blackhole-2ch` جهاز الصوت الافتراضي `BlackHole 2ch` الذي يوجّه Chrome الصوت عبره. يتطلب مُثبّت Homebrew إعادة التشغيل قبل أن يعرض macOS الجهاز:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من المكوّنين:

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

تحقّق من الإعداد، ثم انضم:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

مخرجات `setup` قابلة للقراءة بواسطة الوكيل ومراعية للوضع والنقل: فهي تعرض ملف Chrome الشخصي، وتثبيت Node، وبالنسبة إلى عمليات الانضمام الآنية عبر Chrome، جسر الصوت BlackHole/SoX وفحص المقدمة المؤجلة. تتخطى عمليات الانضمام للمراقبة فقط المتطلبات الآنية الأساسية:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

عند تكوين التفويض إلى Twilio، يعرض `setup` أيضًا ما إذا كانت `voice-call` وبيانات اعتماد Twilio وإتاحة Webhook للعامة جاهزة. تعامل مع أي فحص `ok: false` بوصفه مانعًا لذلك النقل/الوضع قبل أن ينضم الوكيل. استخدم `--json` للحصول على مخرجات قابلة للقراءة آليًا، و`--transport chrome|chrome-node|twilio` لإجراء فحص مسبق لنقل محدد:

```bash
openclaw googlemeet setup --transport twilio
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

على مضيفي Gateway الذين لا يستخدمون macOS، يظل `google_meet` ظاهرًا لإجراءات العناصر، والتقويم، والإعداد، والنسخ، وTwilio، و`chrome-node`، لكن الرد الصوتي المحلي عبر Chrome (`transport: "chrome"` مع `mode: "agent"` أو `"bidi"`) يُحظر قبل وصوله إلى جسر الصوت، لأن هذا المسار يعتمد حاليًا على `BlackHole 2ch` في macOS. استخدم `mode: "transcribe"`، أو الاتصال الهاتفي عبر Twilio، أو مضيف `chrome-node` يعمل بنظام macOS بدلًا من ذلك.

### إنشاء اجتماع

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

لدى `create` مساران، ويُبلّغ عنهما في حقل `source` بالنتيجة:

- **`api`**: يُستخدم عند تكوين بيانات اعتماد OAuth لـ Google Meet. وهو حتمي ولا يعتمد على حالة واجهة مستخدم المتصفح.
- **`browser`**: يُستخدم من دون بيانات اعتماد OAuth. يفتح OpenClaw ‏`https://meet.google.com/new` على Node المثبّتة لـ Chrome وينتظر Google لإعادة التوجيه إلى عنوان URL حقيقي يحتوي على رمز الاجتماع؛ ويجب أن يكون ملف Chrome الشخصي الخاص بـ OpenClaw على تلك Node مسجل الدخول إلى Google مسبقًا. يعيد كل من الانضمام والإنشاء استخدام علامة تبويب Meet موجودة (أو علامة تبويب مطالبة `.../new` / حساب Google قيد التنفيذ) قبل فتح علامة جديدة؛ وتتجاهل مطابقة علامات التبويب سلاسل الاستعلام غير المؤثرة مثل `authuser`.

ينضم `create` افتراضيًا ويعيد `joined: true` إلى جانب جلسة الانضمام. مرّر `--no-join` ‏(CLI) أو `"join": false` (الأداة) لإنشاء عنوان URL فقط.

بالنسبة إلى الغرف المنشأة عبر API، عيّن سياسة وصول صريحة بدلًا من توريث الإعداد الافتراضي لحساب Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | من يمكنه الانضمام من دون طلب السماح بالدخول                         |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | أي شخص لديه عنوان URL لاجتماع Meet                                  |
| `TRUSTED`       | المستخدمون الموثوقون في مؤسسة المضيف، والمستخدمون الخارجيون المدعوون، ومستخدمو الاتصال الهاتفي |
| `RESTRICTED`    | المدعوون فقط                                                         |

ينطبق هذا فقط على الغرف المنشأة عبر API، لذلك يجب تكوين OAuth. إذا أجريت المصادقة قبل توفر هذا الخيار، فأعد تشغيل `openclaw googlemeet auth login --json` بعد إضافة نطاق `meetings.space.settings` إلى شاشة موافقة OAuth.

إذا واجهت الآلية الاحتياطية للمتصفح عائقًا متعلقًا بتسجيل الدخول إلى Google أو أذونات Meet، فتعيد الأداة `manualActionRequired: true` مع `manualActionReason` و`manualActionMessage` و`browser.nodeId`/`browser.targetId`/`browserUrl`. أبلغ عن تلك الرسالة وتوقف عن فتح علامات تبويب Meet جديدة حتى يُكمل المشغّل الخطوة في المتصفح.

### الانضمام للمراقبة فقط

عيّن `"mode": "transcribe"` لتخطي الجسر الآني مزدوج الاتجاه (من دون متطلبات BlackHole/SoX ومن دون رد صوتي). تتخطى عمليات الانضمام عبر Chrome في وضع النسخ أيضًا منح OpenClaw إذن الميكروفون/الكاميرا ومسار Meet **Use microphone**؛ وإذا عرض Meet الشاشة الوسيطة لاختيار الصوت، فتحاول الأتمتة اختيار **Continue without microphone** أولًا. تثبّت عمليات نقل Chrome المُدارة في هذا الوضع مراقبًا لترجمات Meet بأفضل جهد ممكن. يعرض `googlemeet status --json` و`googlemeet doctor` القيم `captioning` و`captionsEnabledAttempted` و`transcriptLines` و`lastCaptionAt` و`lastCaptionSpeaker` و`lastCaptionText` وذيل `recentTranscript`.

لقراءة نص الجلسة المحدود، اقرأ علامة تبويب Meet الدقيقة التي يجري تتبعها:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

يحتفظ المراقب بما لا يزيد على 2,000 سطر مكتمل من الترجمات في صفحة Meet. يظل النص التدريجي المرئي في ذيل حالة السلامة حتى يكتمل صف الترجمة، ولذلك لا يمكن أن يؤدي حفظ `nextIndex` إلى تخطي توسع نص لاحق؛ ويؤدي المغادرة إلى إنهاء الصفوف المرئية قبل اللقطة. يعرض `droppedLines` عدد الأسطر المفقودة من البداية عند تجاوز الحد. تظل نصوص الجلسات الأربع الأحدث انتهاءً قابلة للقراءة حتى إعادة تشغيل Gateway. تعيد النصوص الأقدم للجلسات المنتهية `evicted: true`. هذه ذاكرة وقت تشغيل مقصودة، وليست تخزينًا دائمًا لسجل الاجتماعات: قد تؤدي إعادة تشغيل Gateway، أو إغلاق علامة التبويب قبل أخذ لقطة، أو تجاوز الحدود الموثقة إلى فقدان الترجمات.

لإجراء اختبار استماع بنعم/لا:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

ينضم في وضع النسخ، وينتظر حركة جديدة في الترجمات/النص، ويعيد `listenVerified` و`listenTimedOut` وحقول الإجراء اليدوي وحالة الترجمات الحالية.

### سلامة الجلسة الآنية

أثناء جلسات الرد الصوتي، تعرض حالة `google_meet` سلامة Chrome/جسر الصوت: `inCall` و`manualActionRequired` و`providerConnected` و`realtimeReady` و`audioInputActive` و`audioOutputActive`، والطوابع الزمنية لآخر إدخال/إخراج، وعدادات البايت، وحالة إغلاق الجسر. لا تنطق جلسات Chrome المُدارة عبارة المقدمة/الاختبار إلا بعد أن تعرض السلامة `inCall: true`؛ وإلا يُعرض `speechReady: false` وتُحظر محاولة النطق بدلًا من عدم تنفيذ أي إجراء بصمت.

تنضم عمليات Chrome المحلية عبر ملف متصفح OpenClaw الشخصي المسجل الدخول، وتحتاج إلى `BlackHole 2ch` لمسار الميكروفون/مكبر الصوت. يكفي جهاز BlackHole واحد لإجراء اختبار أولي، لكنه قد يسبب صدى؛ استخدم أجهزة افتراضية منفصلة أو مخططًا شبيهًا بـ Loopback للحصول على صوت نظيف مزدوج الاتجاه.

## Gateway محلي + Chrome عبر Parallels

لا يلزم وجود Gateway كامل أو مفتاح API للنموذج داخل جهاز macOS افتراضي لمجرد إتاحة Chrome له. شغّل Gateway والوكيل محليًا، وشغّل مضيف Node داخل الجهاز الافتراضي.

| مكان التشغيل          | ما يُشغَّل                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| مضيف Gateway         | ‏OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API، والموفر الآني، وتكوين Plugin ‏Google Meet |
| جهاز Parallels الافتراضي بنظام macOS | ‏OpenClaw CLI/مضيف Node، وChrome، وSoX، وBlackHole 2ch، وملف Chrome شخصي مسجل الدخول إلى Google |
| غير مطلوب في الجهاز الافتراضي | خدمة Gateway، وتكوين الوكيل، وإعداد موفر النموذج                                      |

ثبّت تبعيات الجهاز الافتراضي، ثم أعد التشغيل وتحقّق:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

فعّل Plugin في الجهاز الافتراضي وشغّل مضيف Node:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على شبكة LAN من دون TLS، فوافق صراحةً على استخدام تلك الشبكة الخاصة الموثوقة:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

استخدم العلامة نفسها عند التثبيت بوصفه LaunchAgent (فهي متغير في بيئة العملية، وتُخزَّن في بيئة LaunchAgent عند وجودها في أمر التثبيت، وليست إعداد `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

وافق على Node من مضيف Gateway، ثم تأكد من أنها تعلن عن كل من `googlemeet.chrome` وقدرة المتصفح/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

وجّه Meet عبر تلك Node:

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

انضم الآن كالمعتاد من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

لإجراء اختبار أولي بأمر واحد يُنشئ جلسة أو يعيد استخدامها، وينطق عبارة معروفة، ويطبع سلامة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام الآني، تملأ أتمتة المتصفح اسم الضيف، وتنقر على Join/Ask to join، وتقبل مطالبة Meet الأولى "Use microphone" عند ظهورها (أو "Continue without microphone" أثناء الانضمام للمراقبة فقط وإنشاء اجتماع عبر المتصفح فقط). إذا كان الملف الشخصي مسجل الخروج، أو كان Meet ينتظر موافقة المضيف على الدخول، أو كان Chrome يحتاج إلى إذن الميكروفون/الكاميرا، أو كان Meet عالقًا عند مطالبة لم تُحل، فتعرض النتيجة `manualActionRequired: true` مع `manualActionReason` و`manualActionMessage`. توقف عن إعادة المحاولة، وأبلغ عن تلك الرسالة مع `browserUrl`/`browserTitle`، ولا تعد المحاولة إلا بعد اكتمال الإجراء اليدوي.

إذا حُذف `chromeNode.node`، فلن يختار OpenClaw تلقائيًا إلا عندما تعلن Node متصلة واحدة بالضبط عن كل من `googlemeet.chrome` والتحكم في المتصفح؛ ثبّت `chromeNode.node` (معرّف Node أو اسم العرض أو عنوان IP البعيد) عند اتصال عدة عُقد قادرة.

### فحوص الأعطال الشائعة

| العَرَض                                                  | الإصلاح                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Node المثبّتة معروفة لكنها غير متاحة. أبلغ عن عائق الإعداد؛ ولا تنتقل بصمت إلى وسيلة نقل أخرى ما لم يُطلب ذلك.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | شغّل `openclaw node run` داخل الجهاز الافتراضي، ووافق على الاقتران، ثم شغّل `openclaw plugins enable google-meet` و`openclaw plugins enable browser` فيه. تأكد من أن `gateway.nodes.allowCommands` يتضمن `googlemeet.chrome` و`browser.proxy`.                              |
| `BlackHole 2ch audio device not found`                   | ثبّت `blackhole-2ch` على المضيف الجاري فحصه وأعد تشغيله.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | ثبّت `blackhole-2ch` داخل الجهاز الافتراضي وأعد تشغيل الجهاز الافتراضي.                                                                                                                                                                                                                |
| يفتح Chrome لكنه لا يستطيع الانضمام                             | سجّل الدخول إلى ملف المتصفح الشخصي داخل الجهاز الافتراضي، أو أبقِ `chrome.guestName` مضبوطًا. يستخدم الانضمام التلقائي للضيف أتمتة متصفح OpenClaw عبر وكيل متصفح Node؛ وجّه `browser.defaultProfile` الخاص بـNode (أو ملف جلسة حالية مُسمّى) إلى الملف الشخصي المطلوب. |
| علامات تبويب Meet مكررة                                      | اترك `chrome.reuseExistingTab: true`. ينشّط OpenClaw علامة تبويب حالية لعنوان URL نفسه، وتعيد عملية الإنشاء استخدام `.../new` قيد التنفيذ أو علامة تبويب مطالبة حساب Google، قبل فتح علامة أخرى.                                                                      |
| لا يوجد صوت                                                 | وجّه ميكروفون/مكبر صوت Meet عبر مسار الصوت الافتراضي الذي يستخدمه OpenClaw؛ واستخدم أجهزة افتراضية منفصلة أو توجيهًا على غرار Loopback للحصول على صوت مزدوج الاتجاه واضح.                                                                                                              |

## ملاحظات التثبيت

يستخدم الإعداد الافتراضي للرد الصوتي في Chrome أداتين خارجيتين لا يضمّنهما OpenClaw ولا يعيد توزيعهما؛ ثبّتهما كتبعيّات على المضيف عبر Homebrew:

- `sox`: أداة صوت لسطر الأوامر. يصدر Plugin أوامر صريحة لأجهزة CoreAudio لجسر الصوت الافتراضي PCM16 بتردد 24 kHz.
- `blackhole-2ch`: برنامج تشغيل صوت افتراضي لنظام macOS يوفّر توجيه جهاز `BlackHole 2ch` عبر Chrome/Meet.

يُرخَّص SoX بموجب `LGPL-2.0-only AND GPL-2.0-only`؛ ويُرخَّص BlackHole بموجب GPL-3.0. إذا أنشأت مُثبّتًا أو جهازًا يضم BlackHole مع OpenClaw، فراجع ترخيص BlackHole لدى المنبع أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

| وسيلة النقل     | تُستخدم عندما                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | يعمل Chrome/الصوت على مضيف Gateway                                                        |
| `chrome-node` | يعمل Chrome/الصوت على Node مقترنة (مثل جهاز Parallels افتراضي يعمل بنظام macOS)                        |
| `twilio`      | استخدام الاتصال الهاتفي كخيار احتياطي عبر Plugin المكالمات الصوتية، عندما لا تكون المشاركة عبر Chrome متاحة |

### Chrome

يفتح عنوان URL الخاص بـMeet عبر التحكم في متصفح OpenClaw وينضم باستخدام ملف متصفح OpenClaw المسجّل دخوله. على macOS، يتحقق Plugin من `BlackHole 2ch` قبل التشغيل، وإذا كان مضبوطًا، يشغّل أمر فحص صحة/بدء تشغيل جسر الصوت قبل فتح Chrome. بالنسبة إلى Chrome المحلي، اختر الملف الشخصي باستخدام `browser.defaultProfile`؛ بينما يُمرَّر `chrome.browserProfile` إلى مضيفي `chrome-node` بدلًا من ذلك.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

يُوجَّه صوت ميكروفون/مكبر صوت Chrome عبر جسر صوت OpenClaw المحلي. إذا لم يكن `BlackHole 2ch` مثبّتًا، يفشل الانضمام برسالة خطأ في الإعداد بدلًا من الانضمام من دون مسار صوتي.

### Twilio

خطة اتصال صارمة مفوّضة إلى [Plugin المكالمات الصوتية](/ar/plugins/voice-call). لا تحلّل صفحات Meet بحثًا عن أرقام هاتف؛ يجب أن يوفّر Google Meet رقم اتصال هاتفي ورمز PIN للاجتماع.

فعّل المكالمات الصوتية على مضيف Gateway، وليس على Node الخاصة بـChrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // أو اضبط "twilio" إذا كان ينبغي أن يكون Twilio هو الخيار الافتراضي
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
            instructions: "انضم إلى Google Meet هذا بصفتك وكيلاً لـOpenClaw. كن موجزًا.",
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

وفّر بيانات اعتماد Twilio عبر البيئة لإبقاء الأسرار خارج `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

استخدم `realtime.provider: "openai"` مع `OPENAI_API_KEY` بدلًا من ذلك إذا كان OpenAI هو موفّر الصوت في الوقت الفعلي.

أعد تشغيل Gateway أو أعد تحميله بعد تمكين `voice-call`؛ لا تصبح تغييرات إعداد Plugin سارية حتى إعادة التحميل. تحقّق باستخدام:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

عند توصيل تفويض Twilio، يتضمن `googlemeet setup` فحوص `twilio-voice-call-plugin` و`twilio-voice-call-credentials` و`twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

استخدم `--dtmf-sequence` لتسلسل مخصّص، مع `w` بادئة أو فواصل لإضافة توقّف مؤقت قبل رمز PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth والفحص المسبق

OAuth اختياري لإنشاء رابط Meet، لأن `googlemeet create` يمكنه الرجوع إلى أتمتة المتصفح. اضبط OAuth للإنشاء عبر API الرسمي، أو تحليل المساحة، أو الفحص المسبق لـMeet Media API. لا تعتمد عمليات الانضمام عبر Chrome/Chrome-node على OAuth مطلقًا؛ فهي تستخدم ملف Chrome شخصيًا مسجّل الدخول، وBlackHole/SoX، وNode متصلة (بالنسبة إلى `chrome-node`) في كلتا الحالتين.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

<Steps>
<Step title="إنشاء مشروع أو تحديده">
</Step>
<Step title="تفعيل Google Meet REST API">
</Step>
<Step title="إعداد شاشة موافقة OAuth">
يُعد Internal الخيار الأبسط لمؤسسة Google Workspace. ويعمل External للإعدادات الشخصية/الاختبارية؛ وأثناء وجود التطبيق في Testing، أضف كل حساب Google سيمنحه الإذن كمستخدم اختباري.
</Step>
<Step title="إضافة النطاقات المطلوبة">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (البحث في التقويم)
- `https://www.googleapis.com/auth/drive.meet.readonly` (تصدير نص الاجتماع/محتوى مستند الملاحظات الذكية)

</Step>
<Step title="إنشاء معرّف عميل OAuth">
نوع التطبيق **Web application**. عنوان URI المعتمد لإعادة التوجيه:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="نسخ معرّف العميل وسر العميل">
</Step>
</Steps>

يتطلب `spaces.create` وجود `meetings.space.created`. يحوّل `meetings.space.readonly` عناوين URL/رموز Meet إلى مساحات. يتيح `meetings.space.settings` لـOpenClaw تمرير إعدادات `SpaceConfig` مثل `accessType` أثناء إنشاء الغرفة عبر API. يُستخدم `meetings.conference.media.readonly` للفحص المسبق لـMeet Media API والعمل على الوسائط؛ وقد تتطلب Google التسجيل في Developer Preview للاستخدام الفعلي لـMedia API. لا يلزم `calendar.events.readonly` إلا للبحث في تقويم `--today`/`--event`. ولا يلزم `drive.meet.readonly` إلا لتصدير `--include-doc-bodies`. إذا كنت تحتاج فقط إلى عمليات الانضمام عبر Chrome المستندة إلى المتصفح، فتجاوز OAuth بالكامل.

### إصدار رمز التحديث

اضبط `oauth.clientId` و`oauth.clientSecret` اختياريًا (أو مرّرهما كمتغيرات بيئة)، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يشغّل هذا تدفق PKCE مع رد اتصال على localhost عبر `http://localhost:8085/oauth2callback`، ويطبع كتلة إعداد `oauth` تحتوي على رمز تحديث. أضف `--manual` لتدفق النسخ/اللصق عندما يتعذر على المتصفح الوصول إلى رد الاتصال المحلي:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

مخرجات JSON:

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

خزّن كائن `oauth` ضمن إعداد Plugin:

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

فضّل متغيرات البيئة عندما لا تريد وضع رمز التحديث في الإعداد؛ يُحل الإعداد أولًا، ثم تُستخدم البيئة كخيار احتياطي. إذا أجريت المصادقة قبل توفر دعم إنشاء الاجتماعات أو البحث في التقويم أو تصدير محتوى المستند، فأعد تشغيل `openclaw googlemeet auth login --json` لكي يغطي رمز التحديث مجموعة النطاقات الحالية.

### التحقق من OAuth باستخدام doctor

```bash
openclaw googlemeet doctor --oauth --json
```

يتحقق هذا من وجود إعداد OAuth ومن قدرة رمز التحديث على إصدار رمز وصول، من دون تحميل وقت تشغيل Chrome أو اشتراط وجود Node متصلة. لا يتضمن التقرير سوى حقول الحالة (`ok` و`configured` و`tokenSource` و`expiresAt` ورسائل الفحص)، ولا يطبع أبدًا رمز الوصول أو رمز التحديث أو سر العميل.

| الفحص                | المعنى                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | يتوفر `oauth.clientId` بالإضافة إلى `oauth.refreshToken`، أو رمز وصول مخزّن مؤقتًا |
| `oauth-token`        | لا يزال رمز الوصول المخزّن مؤقتًا صالحًا، أو أصدر رمز التحديث رمزًا جديدًا    |
| `meet-spaces-get`    | نجح فحص `--meeting` الاختياري في تحليل مساحة Meet حالية                       |
| `meet-spaces-create` | أنشأ فحص `--create-space` الاختياري مساحة Meet جديدة                         |

أثبت تفعيل Meet API ونطاق `spaces.create` باستخدام فحص الإنشاء ذي الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

أثبت صلاحية قراءة مساحة موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

عادةً ما يعني ظهور `403` من هذه الفحوص أن Meet REST API معطّلة، أو أن رمز التحديث يفتقد النطاق المطلوب، أو أن حساب Google لا يمكنه الوصول إلى تلك المساحة. ويعني خطأ رمز التحديث أنه يجب إعادة تشغيل `openclaw googlemeet auth login --json` وتخزين كتلة `oauth` الجديدة.

لا يلزم OAuth لاستخدام البديل عبر المتصفح؛ إذ تأتي مصادقة Google هناك من ملف Chrome الشخصي المسجّل الدخول على Node المحددة، وليس من إعدادات OpenClaw.

تُقبل متغيرات البيئة هذه بوصفها بدائل:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

### حلّ المساحة، والفحص المسبق، وقراءة العناصر

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

بعد أن ينشئ Meet سجلات المؤتمر:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

مع `--meeting`، يستخدم `artifacts` و`attendance` أحدث سجل مؤتمر افتراضيًا؛ مرّر `--all-conference-records` لاستخدام كل سجل محتفَظ به.

يحلّ البحث في التقويم عنوان URL للاجتماع من Google Calendar قبل قراءة العناصر (ويتطلب رمز تحديث يتضمن نطاق القراءة فقط لأحداث Calendar):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` لليوم عن حدث يتضمن رابط Meet؛ ويبحث `--event <query>` في نص الحدث المطابق؛ ويستهدف `--calendar <id>` تقويمًا غير أساسي. يعاين `calendar-events` الأحداث المطابقة ويحدد الحدث الذي ستختاره `latest`/`artifacts`/`attendance`/`export`.

إذا كنت تعرف معرّف سجل المؤتمر مسبقًا، فاستهدفه مباشرةً:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

أغلق الغرفة لمساحة أُنشئت عبر API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

يستدعي `spaces.endActiveConference` ويتطلب OAuth بنطاق `meetings.space.created` لمساحة يستطيع الحساب المخوّل إدارتها. يقبل عنوان URL من Meet أو رمز اجتماع أو `spaces/{id}`، ويحلّه أولًا إلى مورد مساحة API. وهذا منفصل عن `googlemeet leave`: يوقف `leave` مشاركة OpenClaw المحلية/ضمن الجلسة؛ بينما يطلب `end-active-conference` من Google Meet إنهاء المؤتمر النشط للمساحة.

اكتب تقريرًا سهل القراءة:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

يعيد `artifacts` بيانات تعريف سجل المؤتمر، إضافةً إلى بيانات تعريف موارد المشاركين والتسجيل والنص المنسوخ وإدخالات النص المنسوخ المنظّمة والملاحظات الذكية عندما تتيحها Google. يتخطى `--no-transcript-entries` البحث عن الإدخالات للاجتماعات الكبيرة. يوسّع `attendance` المشاركين إلى صفوف جلسات المشاركين تتضمن أوقات أول وآخر ظهور، والمدة الإجمالية للجلسة، وعلامات التأخر/المغادرة المبكرة، مع دمج موارد المشاركين المكررة بحسب المستخدم المسجّل دخوله أو اسم العرض؛ ويبقي `--no-merge-duplicates` الموارد الأولية منفصلة، بينما يضبط `--late-after-minutes`/`--early-before-minutes` الحدود.

ينشئ `export` مجلدًا يحتوي على `summary.md` و`attendance.csv` و`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`. يسجّل `manifest.json` المُدخل المختار، وخيارات التصدير، وسجلات المؤتمر، وملفات الإخراج، والأعداد، ومصدر الرمز، وأي حدث Calendar مستخدم، وتحذيرات الاسترجاع الجزئي. ينشئ `--zip` أيضًا أرشيفًا قابلًا للنقل بجوار المجلد. يصدّر `--include-doc-bodies` نص Google Docs المرتبط بالنصوص المنسوخة/الملاحظات الذكية عبر Drive `files.export` (ويتطلب نطاق القراءة فقط لـ Drive Meet)؛ ومن دونه، لا تتضمن عمليات التصدير سوى بيانات تعريف Meet وإدخالات النص المنسوخ المنظّمة. يؤدي الفشل الجزئي لأحد العناصر (سرد الملاحظات الذكية، أو إدخالات النص المنسوخ، أو خطأ نص المستند) إلى الاحتفاظ بالتحذير في الملخص/ملف البيان بدلًا من إفشال عملية التصدير بالكامل. يجلب `--dry-run` البيانات نفسها ويطبع JSON الخاص بملف البيان من دون إنشاء المجلد أو ملف ZIP.

تستخدم الوكلاء الإجراءات نفسها من خلال أداة `google_meet` ‏(`export`، و`create` مع `accessType`، و`end_active_conference`، و`test_listen`)؛ راجع [الأداة](#tool).

### اختبار دخاني مباشر

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| المتغير                                                                                                                  | الغرض                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | يفعّل الاختبارات المباشرة المحمية                                             |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | عنوان URL محتفَظ به من Meet، أو رمز، أو `spaces/{id}`                              |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | معرّف عميل OAuth                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | رمز التحديث                                                          |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | اختياري؛ تعمل أيضًا أسماء البدائل نفسها من دون البادئة `OPENCLAW_` |

يحتاج الاختبار الدخاني الأساسي للعناصر/الحضور إلى `meetings.space.readonly` و`meetings.conference.media.readonly`. ويحتاج البحث في Calendar إلى `calendar.events.readonly`. ويحتاج تصدير نص المستند من Drive إلى `drive.meet.readonly`.

### أمثلة الإنشاء

```bash
openclaw googlemeet create
```

يطبع معرّف URI للاجتماع الجديد ومصدره وجلسة الانضمام. مع OAuth، يستخدم Meet API؛ ومن دونه، يستخدم الملف الشخصي المسجّل الدخول في Node Chrome المثبّتة. JSON للبديل عبر المتصفح:

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

إذا واجه البديل عبر المتصفح أولًا تسجيل الدخول إلى Google أو عائق أذونات Meet، فإن `google_meet` يعيد تفاصيل منظّمة بدلًا من سلسلة نصية عادية:

```json
{
  "source": "browser",
  "error": "google-login-required: سجّل الدخول إلى Google في ملف OpenClaw الشخصي للمتصفح، ثم أعد محاولة إنشاء الاجتماع.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "سجّل الدخول إلى Google في ملف OpenClaw الشخصي للمتصفح، ثم أعد محاولة إنشاء الاجتماع.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

JSON للإنشاء عبر API:

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

تنضم عملية الإنشاء افتراضيًا، لكن Chrome/Chrome-node لا يزال يتطلب ملف Google شخصيًا مسجّل الدخول للانضمام عبر المتصفح؛ وإذا كان مسجّلًا الخروج، فسيبلغ OpenClaw عن `manualActionRequired: true` أو خطأ في البديل عبر المتصفح، ويطلب من المشغّل إكمال تسجيل الدخول إلى Google قبل إعادة المحاولة.

لا تضبط `preview.enrollmentAcknowledged: true` إلا بعد التأكد من تسجيل مشروع Cloud، وكيان OAuth الرئيسي، والمشاركين في الاجتماع في Google Workspace Developer Preview Program لواجهات Meet media API.

## الإعدادات

لا يحتاج مسار وكيل Chrome الشائع إلا إلى تفعيل Plugin، وBlackHole، وSoX، ومفتاح موفّر للوقت الفعلي، وموفّر TTS مضبوط في OpenClaw:

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

### الإعدادات الافتراضية

| المفتاح                               | القيمة الافتراضية                                  | ملاحظات                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | يُقبل `"realtime"` كاسم بديل قديم لـ `"agent"`؛ وينبغي للجهات المستدعية الجديدة استخدام `"agent"`                                                                                                                        |
| `chromeNode.node`                 | غير معيّن                                    | معرّف/اسم/عنوان IP لعقدة Node الخاصة بـ `chrome-node`؛ مطلوب عندما يمكن اتصال أكثر من عقدة مؤهلة واحدة                                                                                                                      |
| `chrome.launch`                   | `true`                                   | يشغّل Chrome للانضمام؛ عيّن `false` فقط عند إعادة استخدام جلسة مفتوحة بالفعل                                                                                                                                 |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | يظهر على شاشة ضيف Meet عند تسجيل الخروج                                                                                                                                                                         |
| `chrome.autoJoin`                 | `true`                                   | محاولة بأفضل جهد لملء اسم الضيف والنقر على Join Now في `chrome-node`                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | ينشّط علامة تبويب Meet موجودة بدلاً من فتح علامات تبويب مكررة                                                                                                                                                      |
| `chrome.waitForInCallMs`          | `20000`                                  | ينتظر حتى تفيد علامة تبويب Meet بأن المكالمة جارية قبل تشغيل مقدمة الرد الصوتي                                                                                                                                          |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | تنسيق صوت زوج الأوامر؛ لا يُستخدم `"g711-ulaw-8khz"` إلا لأزواج الأوامر القديمة/المخصصة التي تُخرج صوت الاتصالات الهاتفية                                                                                                   |
| `chrome.audioBufferBytes`         | `4096`                                   | مخزن معالجة SoX المؤقت لأوامر صوت زوج الأوامر المُنشأة (نصف المخزن الافتراضي لـ SoX البالغ 8192 بايت، ما يقلل زمن استجابة الأنبوب)؛ تُقيّد القيم بحد أدنى قدره 17 بايت                                         |
| `chrome.audioInputCommand`        | أمر SoX مُنشأ                    | يقرأ من CoreAudio `BlackHole 2ch`، ويكتب الصوت بالتنسيق `chrome.audioFormat`                                                                                                                                        |
| `chrome.audioOutputCommand`       | أمر SoX مُنشأ                    | يقرأ الصوت بالتنسيق `chrome.audioFormat`، ويكتبه إلى CoreAudio `BlackHole 2ch`                                                                                                                                          |
| `chrome.bargeInInputCommand`      | غير معيّن                                    | أمر ميكروفون محلي اختياري يكتب PCM أحادي القناة، بإشارة 16 بت وبترتيب البايت الأقل أهمية أولاً، لاكتشاف مقاطعة المستخدم أثناء تشغيل رد المساعد؛ ينطبق على جسر زوج الأوامر المستضاف على Gateway                          |
| `chrome.bargeInRmsThreshold`      | `650`                                    | مستوى RMS الذي يُحتسب مقاطعة بشرية                                                                                                                                                                           |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | مستوى الذروة الذي يُحتسب مقاطعة بشرية                                                                                                                                                                          |
| `chrome.bargeInCooldownMs`        | `900`                                    | الحد الأدنى للتأخير بين عمليات مسح المقاطعة المتكررة                                                                                                                                                                |
| `mode` (لكل طلب)              | `"agent"`                                | وضع الرد الصوتي؛ راجع جدول [وضعي الوكيل والاتصال ثنائي الاتجاه](#agent-and-bidi-modes)                                                                                                                                       |
| `realtime.provider`               | `"openai"`                               | خيار احتياطي للتوافق يُستخدم عندما تكون الحقول محددة النطاق أدناه غير معيّنة                                                                                                                                                |
| `realtime.transcriptionProvider`  | `"openai"`                               | معرّف المزوّد الذي يستخدمه وضع `agent` للنسخ الفوري                                                                                                                                                       |
| `realtime.voiceProvider`          | غير معيّن                                    | معرّف المزوّد الذي يستخدمه وضع `bidi` للصوت الفوري المباشر؛ عيّنه إلى `"google"` لاستخدام Gemini Live مع إبقاء النسخ في وضع الوكيل على OpenAI. أقرنه بـ `realtime.model` لاختيار نموذج Gemini Live المحدد. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | راجع [وضعي الوكيل والاتصال ثنائي الاتجاه](#agent-and-bidi-modes)                                                                                                                                                                 |
| `realtime.instructions`           | تعليمات موجزة للرد المنطوق          | يوجّه النموذج إلى التحدث بإيجاز واستخدام `openclaw_agent_consult` للحصول على إجابات أعمق                                                                                                                              |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | يُنطق مرة واحدة عند اتصال الجسر الفوري؛ عيّنه إلى `""` للانضمام بصمت                                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | معرّف وكيل OpenClaw المستخدم لـ `openclaw_agent_consult`                                                                                                                                                               |
| `voiceCall.enabled`               | `true`                                   | يفوّض مكالمة Twilio عبر PSTN وإشارات DTMF والتحية الافتتاحية إلى Plugin المكالمات الصوتية                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | مهلة انتظار أولية قبل تشغيل تسلسل DTMF مشتق من PIN عبر Twilio                                                                                                                                               |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | التأخير قبل طلب التحية الافتتاحية الفورية بعد أن تبدأ المكالمات الصوتية مسار Twilio                                                                                                                        |

يتيح `chrome.audioBridgeCommand` و`chrome.audioBridgeHealthCommand` لجسر خارجي امتلاك مسار الصوت المحلي بالكامل بدلاً من `chrome.audioInputCommand`/`chrome.audioOutputCommand`؛ راجع [الملاحظات](#notes) لمعرفة القيد المتعلق بالوضع الذي يمكنه استخدامهما.

يتوفر ترحيل `openclaw doctor --fix` للبنية القديمة `realtime.provider: "google"`: ينقل هذا القصد إلى `realtime.voiceProvider: "google"` بالإضافة إلى `realtime.transcriptionProvider: "openai"` عندما لا تكون هذه الحقول معيّنة بالفعل.

### تجاوزات اختيارية

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
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "قل بالضبط: أنا هنا.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

استخدام ElevenLabs للاستماع والتحدث في وضع الوكيل كليهما:

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

يأتي صوت Meet الدائم من `messages.tts.providers.elevenlabs.speakerVoiceId`. ويمكن لردود الوكيل أيضًا استخدام توجيهات `[[tts:speakerVoiceId=... model=eleven_v3]]` لكل رد عند تمكين تجاوزات نموذج تحويل النص إلى كلام، لكن الإعداد هو القيمة الافتراضية الحتمية للاجتماعات. عند الانضمام، تعرض السجلات `transcriptionProvider=elevenlabs`، ويسجّل كل رد منطوق `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

مع `voiceCall.enabled: true` (القيمة الافتراضية) ونقل Twilio، تُجري المكالمات الصوتية تسلسل DTMF قبل فتح تدفق الوسائط الفوري، ثم تستخدم نص المقدمة المحفوظ بوصفه التحية الفورية الأولية. إذا لم يكن `voice-call` مُمكّنًا، فلا يزال بإمكان Google Meet التحقق من خطة الاتصال وتسجيلها، لكنه لا يستطيع إجراء مكالمة Twilio.

اترك `voiceCall.gatewayUrl` دون تعيين لاستخدام وقت تشغيل Gateway المحلي الموثوق، الذي يحافظ على
الوكيل المستدعي طوال المكالمة. يظل عنوان URL المُعدّ لـ Gateway هدف WebSocket صريحًا ولا
يمكنه مصادقة منشأ Plugin؛ تفشل عمليات انضمام الوكلاء غير الافتراضيين بإغلاق آمن بدلًا من استخدام
وكيل آخر بصمت. شغّل Google Meet وVoice Call ضمن عملية Gateway نفسها عندما يكون التوجيه
حسب الوكيل مطلوبًا.

## الأداة

يستخدم الوكلاء أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | الغرض                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | الانضمام إلى عنوان URL صريح لـ Meet                                                                         |
| `create`                | إنشاء مساحة (والانضمام إليها افتراضيًا)؛ يدعم `accessType`/`entryPointAccess`                    |
| `status`                | سرد الجلسات النشطة، أو فحص إحداها حسب `sessionId`                                               |
| `setup_status`          | تشغيل عمليات التحقق نفسها التي يشغّلها `googlemeet setup`                                                         |
| `resolve_space`         | تحليل عنوان URL/رمز/`spaces/{id}` عبر `spaces.get`                                                 |
| `preflight`             | التحقق من متطلبات OAuth الأساسية وتحليل الاجتماع                                                 |
| `latest`                | العثور على أحدث سجل مؤتمر لاجتماع                                                   |
| `calendar_events`       | معاينة أحداث Calendar التي تتضمن روابط Meet                                                           |
| `artifacts`             | سرد سجلات المؤتمرات والبيانات الوصفية للمشاركين/التسجيلات/النصوص المفرغة/الملاحظات الذكية                  |
| `attendance`            | سرد المشاركين وجلسات المشاركين                                                        |
| `export`                | كتابة حزمة الآثار/الحضور/النص المفرغ/البيان؛ عيّن `"dryRun": true` للبيان فقط |
| `recover_current_tab`   | التركيز على علامة تبويب Meet موجودة/فحصها دون فتح علامة جديدة                                      |
| `transcript`            | قراءة نص التسميات التوضيحية المفرغ والمحدود؛ يتابع `sinceIndex` من `nextIndex` السابق           |
| `leave`                 | إنهاء جلسة (ينقر Chrome زر مغادرة Meet؛ ولا يغلق إلا علامات التبويب التي فتحها؛ وينهي Twilio المكالمة)                  |
| `end_active_conference` | إنهاء مؤتمر Google Meet النشط لمساحة مُدارة عبر API                                    |
| `speak`                 | جعل الوكيل الآني يتحدث فورًا، عند تزويده بـ `sessionId` و`message`                        |
| `test_speech`           | إنشاء جلسة/إعادة استخدامها، وتشغيل عبارة معروفة، وإرجاع حالة Chrome                              |
| `test_listen`           | إنشاء جلسة للمراقبة فقط/إعادة استخدامها، وانتظار حركة التسميات التوضيحية/النص المفرغ                        |

يفرض `test_speech` دائمًا `mode: "agent"` أو `"bidi"` ويفشل إذا طُلب تشغيله في `mode: "transcribe"`، لأن جلسات المراقبة فقط لا يمكنها إصدار كلام. تستند نتيجة `speechOutputVerified` الخاصة به إلى زيادة بايتات خرج الصوت الآني أثناء تلك المكالمة، لذا لا تُعد الجلسة المُعاد استخدامها ذات الصوت الأقدم تحققًا جديدًا.

بالنسبة إلى وسائل نقل Chrome، يُبقي `leave` علامة تبويب يملكها المستخدم ومُعاد استخدامها مفتوحة بعد النقر على زر مغادرة المكالمة في Meet. تُغلق علامات التبويب التي فتحها OpenClaw بعد المغادرة.

استخدم `transport: "chrome"` عندما يعمل Chrome على مضيف Gateway، و`transport: "chrome-node"` عندما يعمل على Node مقترنة. في الحالتين، يعمل موفرو النماذج و`openclaw_agent_consult` على مضيف Gateway، لذا تبقى بيانات اعتماد النموذج هناك. تتضمن سجلات وضع الوكيل موفر/نموذج النسخ المحللين عند بدء الجسر، وموفر/نموذج/صوت/تنسيق خرج/معدل عينة TTS بعد كل رد مُركّب. ما زال `mode: "realtime"` الخام مقبولًا كاسم مستعار قديم للتوافق مع `mode: "agent"`، لكنه لم يعد معروضًا في تعداد `mode` الخاص بالأداة.

`create` مع غرفة مدعومة عبر API وسياسة وصول صريحة:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

إنهاء المؤتمر النشط لغرفة معروفة:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

التحقق بالاستماع أولًا قبل الادعاء بأن الاجتماع مفيد:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

التحدث عند الطلب:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "قل بالضبط: أنا هنا وأستمع."
}
```

يتضمن `status` حالة Chrome عند توفرها:

| الحقل                                                                 | المعنى                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | يبدو أن Chrome داخل مكالمة Meet                                                                              |
| `micMuted`                                                            | حالة ميكروفون Meet وفق أفضل تقدير                                                                                      |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | يحتاج ملف تعريف المتصفح إلى تسجيل دخول يدوي، أو قبول مضيف Meet، أو أذونات، أو إصلاح التحكم بالمتصفح قبل أن يعمل الكلام |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | ما إذا كان كلام Chrome المُدار مسموحًا الآن؛ يعني `speechReady: false` أن OpenClaw لم يرسل عبارة المقدمة/الاختبار   |
| `providerConnected` / `realtimeReady`                                 | حالة جسر الصوت الآني                                                                                            |
| `lastInputAt` / `lastOutputAt`                                        | آخر صوت شوهد من الجسر/أُرسل إليه                                                                                |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | ما إذا كان خرج وسائط علامة تبويب Meet موجّهًا بنشاط إلى جهاز BlackHole الخاص بالجسر                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | تجاهل إدخال الاسترجاع الحلقي أثناء نشاط تشغيل صوت المساعد                                                              |

## وضعا الوكيل وثنائي الاتجاه

| الوضع    | من يقرر الإجابة        | مسار إخراج الكلام                     | يُستخدم عندما                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | وكيل OpenClaw المُعدّ | وقت تشغيل TTS العادي في OpenClaw            | تريد سلوك «وكيلي موجود في الاجتماع»        |
| `bidi`  | نموذج الصوت الآني      | استجابة صوتية من موفر الصوت الآني | تريد حلقة صوتية حوارية بأقل زمن استجابة |

وضع `agent`: يسمع موفر النسخ الآني صوت الاجتماع، وتُوجّه النصوص النهائية المفرغة للمشاركين عبر وكيل OpenClaw المُعدّ، وتُقرأ الإجابة عبر TTS العادي في OpenClaw. تُدمج أجزاء النص النهائي المتقاربة قبل الاستشارة كي لا تنتج دورة كلام واحدة عدة إجابات جزئية قديمة؛ ويُحجب الإدخال الآني بينما يستمر تشغيل صوت المساعد في قائمة الانتظار، وتُتجاهل أصداء النصوص الحديثة الشبيهة بكلام المساعد قبل الاستشارة كي لا يجعل الاسترجاع الحلقي لـ BlackHole الوكيل يجيب عن كلامه.

وضع `bidi`: يجيب نموذج الصوت الآني مباشرةً ويمكنه استدعاء `openclaw_agent_consult` للحصول على استدلال أعمق أو معلومات حالية أو أدوات OpenClaw العادية. تشغّل أداة الاستشارة وكيل OpenClaw العادي خلف الكواليس مع سياق حديث من نص الاجتماع المفرغ، وتعيد إجابة منطوقة موجزة؛ في وضع `agent` يرسل OpenClaw تلك الإجابة مباشرةً إلى TTS، وفي وضع `bidi` يمكن لنموذج الصوت الآني نطقها. ويستخدم آلية الاستشارة المشتركة نفسها التي تستخدمها Voice Call.

تعمل الاستشارات افتراضيًا باستخدام وكيل `main`؛ عيّن `realtime.agentId` لتوجيه مسار Meet إلى مساحة عمل وكيل مخصصة، وإعدادات نموذج افتراضية، وسياسة أدوات، وذاكرة، وسجل جلسات. تستخدم استشارات وضع الوكيل مفتاح جلسة `agent:<id>:subagent:google-meet:<session>` لكل اجتماع، بحيث تحتفظ أسئلة المتابعة بسياق الاجتماع مع وراثة سياسة الوكيل العادية. عندما يستدعي وكيل `google_meet` في وضع الوكيل، تتفرع جلسة المستشار من النص المفرغ الحالي للمستدعي قبل الإجابة عن كلام المشارك؛ وتبقى جلسة Meet منفصلة كي لا تعدّل متابعات الاجتماع نص المستدعي مباشرةً.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة           | السلوك                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | إتاحة أداة الاستشارة؛ قصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get` |
| `owner`          | إتاحة أداة الاستشارة؛ السماح للوكيل العادي باستخدام سياسة أدواته المعتادة                                                        |
| `none`           | عدم إتاحة أداة الاستشارة لنموذج الصوت الآني                                                                       |

يُحدد نطاق مفتاح جلسة الاستشارة لكل جلسة Meet، لذا تعيد استدعاءات الاستشارة اللاحقة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

فرض تحقق منطوق من الجاهزية بعد انضمام Chrome بالكامل:

```bash
openclaw googlemeet speak meet_... "قل بالضبط: أنا هنا وأستمع."
```

اختبار دخاني كامل للانضمام والتحدث:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "قل بالضبط: أنا هنا وأستمع."
```

## قائمة التحقق للاختبار المباشر

قبل تسليم اجتماع إلى وكيل غير خاضع للإشراف:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "قل بالضبط: اكتمل اختبار الكلام في Google Meet."
```

حالة Chrome-node المتوقعة:

- `googlemeet setup` كلها خضراء، وتتضمن `chrome-node-connected` عندما تكون Chrome-node وسيلة النقل الافتراضية أو تكون Node مثبتة.
- يعرض `nodes status` الـ Node المحددة متصلة، وتعلن عن كل من `googlemeet.chrome` و`browser.proxy`.
- تنضم علامة تبويب Meet، ويعيد `test-speech` حالة Chrome مع `inCall: true`.

بالنسبة إلى مضيف Chrome بعيد مثل جهاز macOS افتراضي على Parallels، يكون أقصر تحقق آمن بعد تحديث Gateway أو الجهاز الافتراضي:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

يثبت ذلك أن Plugin الخاص بـ Gateway محمّل، وأن Node الجهاز الافتراضي متصلة بالرمز الحالي، وأن جسر صوت Meet متاح قبل أن يفتح الوكيل علامة تبويب اجتماع حقيقية.

لإجراء اختبار دخاني لـ Twilio، استخدم اجتماعًا يوفّر تفاصيل الاتصال الهاتفي:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

حالة Twilio المتوقعة:

- `googlemeet setup` يتضمن فحوصات `twilio-voice-call-plugin` و`twilio-voice-call-credentials` و`twilio-voice-call-webhook` خضراء.
- `voicecall` متاح في CLI بعد إعادة تحميل Gateway.
- تتضمن الجلسة المُعادة `transport: "twilio"` و`twilio.voiceCallId`.
- يعرض `openclaw logs --follow` تقديم TwiML الخاص بـ DTMF قبل TwiML الفوري، ثم جسرًا فوريًا مع وضع التحية الأولية في قائمة الانتظار.
- ينهي `googlemeet leave <sessionId>` المكالمة الصوتية المفوَّضة.

## استكشاف الأخطاء وإصلاحها

### يتعذر على الوكيل رؤية أداة Google Meet

تأكد من تمكين Plugin وأعد تحميل Gateway؛ فالوكيل قيد التشغيل لا يرى سوى أدوات Plugin التي سجلتها عملية Gateway الحالية:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

على مضيفي Gateway من غير macOS، يظل `google_meet` ظاهرًا، لكن إجراءات الرد الصوتي في Chrome المحلي تُحظر قبل وصولها إلى جسر الصوت. استخدم `mode: "transcribe"` أو الاتصال الهاتفي عبر Twilio أو مضيف `chrome-node` يعمل بنظام macOS بدلًا من مسار وكيل Chrome المحلي الافتراضي.

### لا توجد عقدة متصلة تدعم Google Meet

على مضيف العقدة:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

على مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

يجب أن تكون العقدة متصلة وأن تُدرج `googlemeet.chrome` بالإضافة إلى `browser.proxy`؛ ويجب أن يسمح إعداد Gateway بكليهما:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

إذا فشل `googlemeet setup` في `chrome-node-connected`، أو أبلغ سجل Gateway عن `gateway token mismatch`، فأعد تثبيت العقدة أو تشغيلها باستخدام رمز Gateway الحالي:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

ثم أعد تحميل خدمة العقدة وشغّل مجددًا:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### يفتح المتصفح لكن يتعذر على الوكيل الانضمام

شغّل `googlemeet test-listen` لعمليات الانضمام للمراقبة فقط أو `googlemeet test-speech` لعمليات الانضمام الفورية، ثم افحص حالة Chrome المُعادة. إذا أبلغ أي منهما عن `manualActionRequired: true`، فاعرض `manualActionMessage` للمشغّل وتوقف عن إعادة المحاولة حتى يكتمل إجراء المتصفح.

الإجراءات اليدوية الشائعة: تسجيل الدخول إلى ملف Chrome الشخصي؛ قبول الضيف من حساب مضيف Meet؛ منح Chrome أذونات الميكروفون/الكاميرا عند ظهور المطالبة الأصلية؛ إغلاق مربع حوار أذونات Meet العالق أو إصلاحه.

لا تُبلغ عن «عدم تسجيل الدخول» لمجرد أن Meet يسأل «Do you want people to hear you in the meeting?»؛ فهذه شاشة Meet البينية لاختيار الصوت. ينقر OpenClaw على **Use microphone** عبر أتمتة المتصفح عندما تكون متاحة، ويواصل انتظار حالة الاجتماع الفعلية؛ أما عند الرجوع إلى المتصفح للإنشاء فقط، فقد ينقر على **Continue without microphone** بدلًا من ذلك، لأن إنشاء عنوان URL لا يحتاج إلى مسار الصوت الفوري.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` واجهة Meet API المسماة `spaces.create` عند إعداد OAuth، وإلا فيستخدم متصفح عقدة Chrome المثبّتة. تأكد مما يلي:

- **الإنشاء عبر API**: وجود `oauth.clientId` و`oauth.refreshToken` (أو متغيرات البيئة `OPENCLAW_GOOGLE_MEET_*` المطابقة)، وأن رمز التحديث أُنشئ بعد إضافة دعم الإنشاء؛ قد تفتقر الرموز الأقدم إلى `meetings.space.created`، لذا أعد تشغيل `openclaw googlemeet auth login --json`.
- **الرجوع إلى المتصفح**: يشير `defaultTransport: "chrome-node"` و`chromeNode.node` إلى عقدة متصلة تحتوي على `browser.proxy` و`googlemeet.chrome`؛ ويكون ملف OpenClaw الشخصي في Chrome على تلك العقدة مسجل الدخول وقادرًا على فتح `https://meet.google.com/new`.
- **إعادات محاولة الرجوع إلى المتصفح**: أعد استخدام علامة تبويب موجودة لـ `.../new` أو مطالبة حساب Google قبل فتح علامة تبويب جديدة؛ أعد محاولة استدعاء الأداة بدلًا من فتح علامة تبويب أخرى يدويًا.
- **إجراء يدوي**: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم `browser.nodeId` و`browser.targetId` و`browserUrl` و`manualActionMessage` لإرشاد المشغّل؛ ولا تُعد المحاولة في حلقة.
- **شاشة اختيار الصوت البينية**: إذا عرض Meet السؤال «Do you want people to hear you in the meeting?»، فاترك علامة التبويب مفتوحة. ينبغي أن ينقر OpenClaw على **Use microphone** أو **Continue without microphone** (للإنشاء فقط)، وأن يواصل انتظار عنوان URL المُنشأ؛ وإذا تعذر عليه ذلك، فينبغي أن يذكر الخطأ `meet-audio-choice-required`، لا `google-login-required`.

### ينضم الوكيل لكنه لا يتحدث

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "agent"` لمسار STT -> وكيل OpenClaw -> TTS، و`mode: "bidi"` للرجوع المباشر إلى الصوت الفوري. لا يبدأ `mode: "transcribe"` أي جسر رد صوتي عن قصد. لتصحيح أخطاء المراقبة فقط، شغّل `openclaw googlemeet status --json <session-id>` بعد تحدث المشاركين وتحقق من `captioning` و`transcriptLines` و`lastCaptionText`. إذا كانت قيمة `inCall` صحيحة لكن ظل `transcriptLines` مساويًا لـ `0`، فقد تكون تسميات Meet التوضيحية معطلة، أو لم يتحدث أحد منذ تثبيت المراقب، أو تغيرت واجهة Meet، أو لا تتوفر التسميات التوضيحية المباشرة للغة الاجتماع/الحساب.

يتحقق `googlemeet test-speech` دائمًا من المسار الفوري ويُبلغ عما إذا لوحظت بايتات خرج الجسر لذلك الاستدعاء. إذا كانت قيمة `speechOutputVerified` خطأ وكانت `speechOutputTimedOut` صحيحة، فربما قبل موفر الخدمة الفورية الكلام، لكن OpenClaw لم يرَ بايتات خرج جديدة تصل إلى جسر صوت Chrome.

تحقق أيضًا مما يلي: توفر مفتاح لموفر خدمة فورية (`OPENAI_API_KEY` أو `GEMINI_API_KEY`) على مضيف Gateway؛ وظهور `BlackHole 2ch` على مضيف Chrome؛ ووجود `sox` هناك؛ وتوجيه ميكروفون/مكبر صوت Meet عبر مسار الصوت الافتراضي (ينبغي أن يعرض `doctor` القيمة `meet output routed: yes` لعمليات الانضمام الفورية عبر Chrome المحلي).

يطبع `googlemeet doctor [session-id]` الجلسة والعقدة وحالة المكالمة وسبب الإجراء اليدوي واتصال موفر الخدمة الفورية و`realtimeReady` ونشاط إدخال/إخراج الصوت والطوابع الزمنية لآخر صوت وعدادات البايتات وعنوان URL للمتصفح. استخدم `googlemeet status [session-id] --json` للحصول على JSON الخام، و`googlemeet doctor --oauth` (أضف `--meeting` أو `--create-space`) للتحقق من تحديث OAuth دون كشف الرموز.

إذا انتهت مهلة وكيل وكانت علامة تبويب Meet مفتوحة بالفعل، فافحصها دون فتح علامة أخرى:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`: فهو يركز على علامة تبويب Meet موجودة ويفحصها للنقل المحدد (التحكم المحلي في المتصفح لـ `chrome`، والعقدة المعدّة لـ `chrome-node`) دون فتح علامة تبويب أو جلسة جديدة، ويُبلغ عن العائق الحالي (تسجيل الدخول، القبول، الأذونات، حالة اختيار الصوت). يتواصل أمر CLI مع Gateway المعدّ، الذي يجب أن يكون قيد التشغيل؛ ويتطلب `chrome-node` أيضًا اتصال العقدة.

### فشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا أو مُمكّنًا: أضفه إلى `plugins.allow`، ومكّن `plugins.entries.voice-call`، ثم أعد تحميل Gateway.

يفشل `twilio-voice-call-credentials` عندما تفتقد الواجهة الخلفية لـ Twilio معرّف SID للحساب أو رمز المصادقة أو رقم المتصل:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

يفشل `twilio-voice-call-webhook` عندما لا يتوفر لـ `voice-call` كشف Webhook عام، أو عندما يشير `publicUrl` إلى مساحة شبكة استرجاعية/خاصة. لا تستخدم `localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x` أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` بوصفها `publicUrl`؛ فلا يمكن لاستدعاءات شركة الاتصالات الراجعة الوصول إليها. عيّن `plugins.entries.voice-call.config.publicUrl` إلى عنوان URL عام، أو أعد نفقًا/كشفًا عبر Tailscale:

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

للتطوير المحلي، استخدم نفقًا أو كشفًا عبر Tailscale بدلًا من عنوان URL لمضيف خاص:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // أو
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

أعد تشغيل Gateway أو تحميله، ثم:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

يقتصر `voicecall smoke` افتراضيًا على التحقق من الجاهزية. نفّذ تشغيلًا تجريبيًا لرقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

لا تضف `--yes` إلا لوضع مكالمة صادرة فعلية عن قصد:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تبدأ مكالمة Twilio لكنها لا تدخل الاجتماع أبدًا

تأكد من أن حدث Meet يعرض تفاصيل الاتصال الهاتفي، ومرّر رقم الاتصال الدقيق مع رقم PIN أو تسلسل DTMF مخصص:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم `w` في البداية أو فواصل في `--dtmf-sequence` لإضافة توقف مؤقت قبل رقم PIN.

إذا أُنشئت المكالمة لكن قائمة حضور Meet لا تعرض المشارك المتصل هاتفيًا:

- `openclaw googlemeet doctor <session-id>`: تأكد من معرّف مكالمة Twilio المفوَّضة، وما إذا وُضع DTMF في قائمة الانتظار، وما إذا طُلبت التحية التمهيدية.
- `openclaw voicecall status --call-id <id>`: تأكد من أن المكالمة لا تزال نشطة.
- `openclaw voicecall tail`: تأكد من وصول Webhook الخاصة بـ Twilio إلى Gateway.
- `openclaw logs --follow`: ابحث عن تسلسل Twilio الخاص بـ Meet: يفوّض Google Meet عملية الانضمام، ويخزن Voice Call ويقدم TwiML الخاص بـ DTMF قبل الاتصال، ثم يقدم Voice Call‏ TwiML الفوري لمكالمة Twilio، وبعد ذلك يطلب Google Meet الكلام التمهيدي باستخدام `voicecall.speak`.
- أعد تشغيل `openclaw googlemeet setup --transport twilio`؛ يلزم نجاح فحص الإعداد، لكنه لا يثبت صحة تسلسل رقم PIN للاجتماع.
- تأكد من أن رقم الاتصال الهاتفي ينتمي إلى دعوة Meet والمنطقة نفسيهما اللتين ينتمي إليهما رقم PIN.
- زِد `voiceCall.dtmfDelayMs` عن القيمة الافتراضية البالغة 12 ثانية إذا كان Meet يجيب ببطء أو إذا ظل نص المكالمة يعرض مطالبة رقم PIN بعد إرسال DTMF قبل الاتصال.
- إذا انضم المشارك لكنك لم تسمع التحية، فتحقق من `openclaw logs --follow` بحثًا عن طلب `voicecall.speak` اللاحق لـ DTMF، وعن تشغيل TTS عبر دفق الوسائط أو الرجوع إلى `<Say>` في Twilio. إذا ظل النص يعرض «enter the meeting PIN»، فهذا يعني أن الطرف الهاتفي لم ينضم إلى غرفة Meet بعد، ولذلك لن يسمع المشاركون الكلام.

إذا لم تصل Webhook، فصحح أخطاء Plugin ‏Voice Call أولًا: يجب أن يتمكن الموفر من الوصول إلى `plugins.entries.voice-call.config.publicUrl` أو النفق المعدّ. راجع [استكشاف أخطاء المكالمات الصوتية وإصلاحها](/ar/plugins/voice-call#troubleshooting).

## ملاحظات

واجهة الوسائط الرسمية لـ Google Meet موجهة نحو الاستقبال، لذا لا يزال التحدث داخل مكالمة يتطلب مسار مشارك. يُبقي هذا Plugin ذلك الحد واضحًا: يتولى Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ ويتولى Twilio المشاركة عبر الاتصال الهاتفي.

تحتاج أوضاع الرد الصوتي في Chrome إلى `BlackHole 2ch` بالإضافة إلى أحد الخيارين التاليين:

- `chrome.audioInputCommand` بالإضافة إلى `chrome.audioOutputCommand`: يتولى OpenClaw إدارة الجسر ويمرّر الصوت في `chrome.audioFormat` بين تلك الأوامر والمزوّد المحدد. يستخدم وضع `agent` النسخ الفوري بالإضافة إلى تحويل النص إلى كلام (TTS) المعتاد؛ بينما يستخدم وضع `bidi` مزوّد الصوت الفوري. المسار الافتراضي هو PCM16 بتردد 24 kHz مع `chrome.audioBufferBytes: 4096`؛ ويظل G.711 mu-law بتردد 8 kHz متاحًا لأزواج الأوامر القديمة.
- `chrome.audioBridgeCommand`: يتولى أمر جسر خارجي إدارة مسار الصوت المحلي بالكامل، ويجب أن ينتهي بعد تشغيل برنامجه الخفي أو التحقق منه. صالح فقط لـ `bidi`، لأن وضع `agent` يحتاج إلى وصول مباشر إلى زوج الأوامر لتحويل النص إلى كلام (TTS).

باستخدام جسر Chrome القائم على زوج الأوامر، يمكن لـ `chrome.bargeInInputCommand` الاستماع إلى ميكروفون محلي منفصل وإيقاف تشغيل صوت المساعد عندما يبدأ شخص في التحدث، ما يُبقي كلام الشخص متقدمًا على مخرجات المساعد حتى أثناء كبت إدخال الاسترجاع المشترك عبر BlackHole مؤقتًا خلال تشغيل صوت المساعد. ومثل `chrome.audioInputCommand`/`chrome.audioOutputCommand`، فهو أمر محلي يهيئه المشغّل: استخدم مسار أمر موثوقًا وصريحًا أو قائمة وسائط، ولا تستخدم مطلقًا برنامجًا نصيًا من موقع غير موثوق.

للحصول على صوت مزدوج الاتجاه واضح، وجّه مخرجات Meet وميكروفون Meet عبر جهازين افتراضيين منفصلين أو مخطط أجهزة افتراضية بأسلوب Loopback؛ إذ يمكن لجهاز BlackHole مشترك واحد أن يعيد صدى المشاركين الآخرين إلى المكالمة.

يشغّل `googlemeet speak` جسر الصوت النشط للتحدث العكسي في جلسة Chrome؛ ويوقفه `googlemeet leave` (وبالنسبة إلى جلسات Twilio المفوّضة عبر Voice Call، ينهي المكالمة الأساسية). استخدم `googlemeet end-active-conference` لإغلاق مؤتمر Google Meet النشط أيضًا لمساحة تُدار عبر API.

## ذو صلة

- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [إنشاء Plugins](/ar/plugins/building-plugins)
