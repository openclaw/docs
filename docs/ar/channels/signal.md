---
read_when:
    - إعداد دعم Signal
    - تصحيح أخطاء إرسال واستقبال Signal
summary: دعم Signal عبر signal-cli (برنامج خفي أصلي أو حاوية bbernhard)، ومسارات الإعداد، ونموذج الأرقام
title: Signal
x-i18n:
    generated_at: "2026-07-16T13:44:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal هو Plugin قناة قابل للتنزيل (`@openclaw/signal`). يتواصل Gateway مع `signal-cli` عبر HTTP: إما البرنامج الخفي الأصلي (JSON-RPC + SSE) أو حاوية [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) ‏(REST + WebSocket). لا يضمّن OpenClaw مكتبة libsignal.

## نموذج الرقم (اقرأ هذا أولًا)

- يتصل Gateway **بجهاز Signal**: حساب `signal-cli`.
- يؤدي تشغيل الروبوت على **حساب Signal الشخصي** إلى تجاهله رسائلك الخاصة (حماية من الحلقات).
- للحصول على نمط «أرسل رسالة إلى الروبوت فيرد»، استخدم **رقمًا منفصلًا للروبوت**.

## التثبيت

```bash
openclaw plugins install @openclaw/signal
```

تحاول مواصفات Plugin المجردة استخدام ClawHub أولًا، ثم تلجأ إلى npm. افرض مصدرًا باستخدام `openclaw plugins install clawhub:@openclaw/signal` أو `npm:@openclaw/signal`. يسجّل `plugins install` الـPlugin ويفعّله؛ ولا حاجة إلى خطوة `enable` منفصلة. راجع [الـPlugins](/ar/tools/plugin) للاطلاع على قواعد التثبيت العامة.

## الإعداد السريع

<Steps>
  <Step title="اختر رقمًا">
    استخدم **رقم Signal منفصلًا** للروبوت (موصى به).
  </Step>
  <Step title="ثبّت الـPlugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="شغّل الإعداد الموجّه">
    ```bash
    openclaw channels add
    ```
    يكتشف المعالج ما إذا كان `signal-cli` موجودًا في `PATH`، وعند غيابه يعرض تثبيته: ينزّل إصدار GraalVM الأصلي الرسمي على Linux x86-64، أو يثبّته عبر Homebrew على macOS والمعماريات الأخرى. ثم يطلب رقم الروبوت ومسار `signal-cli`.

    للإعداد غير التفاعلي، يقبل `openclaw channels add --channel signal` أيضًا `--signal-number <e164>` لرقم هاتف الروبوت، بالإضافة إلى `--http-host <host>` و`--http-port <port>` لنقطة نهاية برنامج Signal الخفي (القيمة الافتراضية `127.0.0.1:8080`).

  </Step>
  <Step title="اربط الحساب أو سجّله">
    - **الربط عبر رمز QR (الأسرع):** `signal-cli link -n "OpenClaw"`، ثم امسحه ضوئيًا باستخدام Signal. راجع [المسار A](#setup-path-a-link-existing-signal-account-qr).
    - **التسجيل عبر SMS:** رقم مخصص مع اختبار captcha والتحقق عبر SMS. راجع [المسار B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="تحقق وأجرِ الاقتران">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    أرسل أول رسالة مباشرة ووافق على الاقتران: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

الحد الأدنى من الإعداد:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| الحقل        | الوصف                                       |
| ------------ | ------------------------------------------------- |
| `account`    | رقم هاتف الروبوت بتنسيق E.164 ‏(`+15551234567`) |
| `cliPath`    | مسار `signal-cli` ‏(`signal-cli` إذا كان في `PATH`)  |
| `configPath` | دليل إعداد signal-cli الذي يُمرَّر بوصفه `--config`        |
| `dmPolicy`   | سياسة الوصول إلى الرسائل المباشرة (`pairing` موصى بها)          |
| `allowFrom`  | أرقام الهواتف أو قيم `uuid:<id>` المسموح لها بإرسال رسائل مباشرة |

دعم الحسابات المتعددة: استخدم `channels.signal.accounts` مع إعداد خاص بكل حساب و`name` اختياري. راجع [قنوات الحسابات المتعددة](/ar/gateway/config-channels#multi-account-all-channels) للاطلاع على النمط المشترك.

## ماهيته

- توجيه حتمي: تعود الردود دائمًا إلى Signal.
- تشترك الرسائل المباشرة في الجلسة الرئيسية للوكيل؛ وتكون المجموعات معزولة (`agent:<agentId>:signal:group:<groupId>`).
- قد يكتب Signal افتراضيًا تحديثات الإعداد التي يشغّلها `/config set|unset` (يتطلب `commands.config: true`). عطّل ذلك باستخدام `channels.signal.configWrites: false`.

## مسار الإعداد A: ربط حساب Signal موجود (QR)

1. ثبّت `signal-cli` (إصدار JVM أو إصدار أصلي)، أو دع `openclaw channels add` يثبّته لك.
2. اربط حساب روبوت: `signal-cli link -n "OpenClaw"`، ثم امسح رمز QR ضوئيًا في Signal.
3. اضبط Signal وشغّل Gateway.

## مسار الإعداد B: تسجيل رقم روبوت مخصص (SMS، ‏Linux)

استخدم هذا لرقم روبوت مخصص بدلًا من ربط حساب موجود في تطبيق Signal. اختُبر التدفق أدناه على Ubuntu 24.

1. احصل على رقم يمكنه استقبال SMS (أو التحقق الصوتي للخطوط الأرضية). يتجنب رقم الروبوت المخصص تعارضات الحساب والجلسة.
2. ثبّت `signal-cli` على مضيف Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

إذا كنت تستخدم إصدار JVM ‏(`signal-cli-${VERSION}.tar.gz`)، فثبّت JRE أولًا. حافظ على تحديث `signal-cli`؛ إذ تشير الجهة الأصلية إلى أن الإصدارات القديمة قد تتعطل مع تغيّر واجهات API لخادم Signal.

3. سجّل الرقم وتحقق منه:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

إذا كان اختبار captcha مطلوبًا (يلزم الوصول إلى متصفح لإكمال هذه الخطوة):

1. افتح `https://signalcaptchas.org/registration/generate.html`.
2. أكمل اختبار captcha، وانسخ هدف رابط `signalcaptcha://...` من "Open Signal".
3. شغّل الأمر من عنوان IP الخارجي نفسه لجلسة المتصفح متى أمكن (تنتهي صلاحية رموز captcha بسرعة).
4. سجّل وتحقق فورًا:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. اضبط OpenClaw، وأعد تشغيل Gateway، وتحقق من القناة:

```bash
# إذا كنت تشغّل Gateway كخدمة systemd للمستخدم:
systemctl --user restart openclaw-gateway.service

# ثم تحقق:
openclaw doctor
openclaw channels status --probe
```

5. أقرن مرسل الرسائل المباشرة:
   - أرسل أي رسالة إلى رقم الروبوت.
   - وافق على الخادم: `openclaw pairing approve signal <PAIRING_CODE>`.
   - احفظ رقم الروبوت كجهة اتصال على هاتفك لتجنب ظهور "Unknown contact".

<Warning>
قد يؤدي تسجيل حساب رقم هاتف باستخدام `signal-cli` إلى إلغاء مصادقة جلسة تطبيق Signal الرئيسية لذلك الرقم. يُفضّل استخدام رقم روبوت مخصص، أو وضع الربط عبر QR للإبقاء على إعداد تطبيق الهاتف الحالي.
</Warning>

مراجع الجهة الأصلية:

- ملف README الخاص بـ`signal-cli`: ‏`https://github.com/AsamK/signal-cli`
- تدفق captcha: ‏`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- تدفق الربط: ‏`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## وضع البرنامج الخفي الخارجي (httpUrl)

لإدارة `signal-cli` بنفسك (بطء بدء JVM البارد، أو تهيئة الحاوية، أو وحدات المعالجة المركزية المشتركة)، شغّل البرنامج الخفي بصورة منفصلة ووجّه OpenClaw إليه:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

يتخطى ذلك التشغيل التلقائي وانتظار بدء OpenClaw. لحالات البدء البطيئة عند التشغيل التلقائي، عيّن `channels.signal.startupTimeoutMs`.

## وضع الحاوية (bbernhard/signal-cli-rest-api)

بدلًا من تشغيل `signal-cli` أصليًا، استخدم حاوية Docker ‏[bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api)، التي تغلّف `signal-cli` خلف واجهة REST + WebSocket.

المتطلبات:

- **يجب** تشغيل الحاوية باستخدام `MODE=json-rpc` لاستقبال الرسائل في الوقت الفعلي.
- سجّل حساب Signal أو اربطه داخل الحاوية قبل توصيل OpenClaw.

مثال على خدمة `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

إعداد OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // أو "auto" للاكتشاف تلقائيًا
    },
  },
}
```

يتحكم `apiMode` في البروتوكول الذي يستخدمه OpenClaw:

| القيمة         | السلوك                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (افتراضي) يفحص طريقتي النقل؛ ويتحقق البث من استقبال WebSocket في الحاوية    |
| `"native"`    | يفرض signal-cli الأصلي (JSON-RPC عند `/api/v1/rpc`، وSSE عند `/api/v1/events`)         |
| `"container"` | يفرض حاوية bbernhard ‏(REST عند `/v2/send`، وWebSocket عند `/v1/receive/{account}`) |

عندما تكون قيمة `apiMode` هي `"auto"`، يخزّن OpenClaw الوضع المكتشف مؤقتًا لمدة 30 ثانية لكل عنوان URL للبرنامج الخفي لتجنب تكرار الفحوصات (يفوز الوضع الأصلي عندما تكون طريقتا النقل سليمتين). لا يُختار استقبال الحاوية للبث إلا بعد ترقية `/v1/receive/{account}` إلى WebSocket، مما يتطلب `MODE=json-rpc`.

يدعم وضع الحاوية عمليات Signal نفسها التي يدعمها الوضع الأصلي عندما تعرض الحاوية واجهات API المطابقة: الإرسال، والاستقبال، والمرفقات، ومؤشرات الكتابة، وإيصالات القراءة/المشاهدة، والتفاعلات، والمجموعات، والنص المنسّق. يحوّل OpenClaw استدعاءات RPC الأصلية في Signal إلى حمولات REST الخاصة بالحاوية، بما في ذلك معرّفات المجموعات `group.{base64(internal_id)}` و`text_mode: "styled"` للنص المنسّق.

ملاحظات تشغيلية:

- استخدم `autoStart: false` مع وضع الحاوية؛ ينبغي ألا يشغّل OpenClaw برنامجًا خفيًا أصليًا عند تحديد `apiMode: "container"`.
- استخدم `MODE=json-rpc` للاستقبال. قد يجعل `MODE=normal` حالة `/v1/about` تبدو سليمة، لكن `/v1/receive/{account}` لن يرقّي الاتصال إلى WebSocket، ولذلك لن يحدد OpenClaw بث استقبال الحاوية في وضع `auto`.
- عيّن `apiMode: "container"` عندما يشير `httpUrl` إلى واجهة REST الخاصة بـbbernhard، و`"native"` عندما يشير إلى JSON-RPC/SSE الأصلي في `signal-cli`، و`"auto"` عندما قد يختلف النشر.
- تلتزم تنزيلات مرفقات الحاوية بحدود بايتات الوسائط نفسها المستخدمة في الوضع الأصلي. تُرفض الاستجابات المتجاوزة للحجم قبل تخزينها بالكامل في الذاكرة المؤقتة عندما يرسل الخادم `Content-Length`، وأثناء البث خلاف ذلك.

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

الرسائل المباشرة:

- القيمة الافتراضية: `channels.signal.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ وتُتجاهل الرسائل إلى أن تتم الموافقة (تنتهي صلاحية الرموز بعد 1 ساعة).
- وافق عبر `openclaw pairing list signal` و`openclaw pairing approve signal <CODE>`.
- الاقتران هو تبادل الرموز الافتراضي لرسائل Signal المباشرة. التفاصيل: [الاقتران](/ar/channels/pairing)
- يُخزّن المرسلون الذين لديهم UUID فقط (من `sourceUuid`) بوصفهم `uuid:<id>` في `channels.signal.allowFrom`.

المجموعات:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- يتحكم `channels.signal.groupAllowFrom` في المجموعات أو المرسلين الذين يمكنهم تشغيل ردود المجموعات عند تعيين `allowlist`؛ ويمكن أن تكون الإدخالات معرّفات مجموعات Signal (خام، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام هواتف المرسلين، أو قيم `uuid:<id>`، أو `*`.
- يمكن لـ`channels.signal.groups["<group-id>" | "*"]` تجاوز سلوك المجموعة باستخدام `requireMention` و`tools` و`toolsBySender`.
- استخدم `channels.signal.accounts.<id>.groups` للتجاوزات الخاصة بكل حساب في إعدادات الحسابات المتعددة.
- لا يؤدي إدراج مجموعة Signal في قائمة السماح عبر `groupAllowFrom` إلى تعطيل اشتراط الإشارة إليها تلقائيًا. يعالج إدخال `channels.signal.groups["<group-id>"]` مضبوط تحديدًا كل رسالة في المجموعة ما لم يُعيَّن `requireMention=true`.
- مع `requireMention=true`، تُطابق إشارات @ الأصلية في Signal من بيانات الإشارة الوصفية المنظّمة مع هاتف حساب الروبوت أو `accountUuid`. تظل قيم `mentionPatterns` المضبوطة بديلًا نصيًا عاديًا.
- ملاحظة وقت التشغيل: إذا كان `channels.signal` مفقودًا تمامًا، يلجأ وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعة (حتى إذا كان `channels.defaults.groupPolicy` معيّنًا).

مجموعة مشروطة بالإشارة ذات سياق محدود:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

تظل رسائل المجموعة المسموح بها التي لا تذكر الروبوت دون استجابة، ولا تُحفظ إلا ضمن نافذة السجل المعلّق المحدودة. وعندما يؤدي لاحقًا ذكر أصلي باستخدام @ أو ذكر نصي احتياطي إلى تشغيل الروبوت، يضمّن OpenClaw ذلك السياق الحديث ويرد على المجموعة نفسها. لا تُنزَّل محتويات المرفقات المتخطاة؛ وقد تظهر فقط كعناصر نائبة مختصرة للوسائط في السياق المعلّق.

## آلية العمل (السلوك)

- الوضع الأصلي: يعمل `signal-cli` كبرنامج خفي؛ ويقرأ Gateway الأحداث عبر SSE.
- وضع الحاوية: يرسل Gateway عبر REST API ويستقبل عبر WebSocket.
- تُطبَّع الرسائل الواردة إلى مغلف القناة المشترك.
- تُوجَّه الردود دائمًا إلى الرقم أو المجموعة نفسها.
- تتضمن الردود على الرسائل الواردة بيانات اقتباس Signal الأصلية الوصفية عندما تقبل الواجهة الخلفية الطابع الزمني ومؤلف الرسالة الواردة؛ وإذا كانت بيانات الاقتباس الوصفية مفقودة أو مرفوضة، يرسل OpenClaw الرد كرسالة عادية.
- اضبط استخدام الاقتباس الأصلي باستخدام `channels.signal.replyToMode = off | first | all | batched`، أو `channels.signal.replyToModeByChatType.direct/group` للتجاوزات بحسب نوع المحادثة. تكون للقيم على مستوى الحساب ضمن `channels.signal.accounts.<id>` الأولوية.

## الوسائط والحدود

- يُقسَّم النص الصادر وفق `channels.signal.textChunkLimit` (القيمة الافتراضية 4000).
- التقسيم الاختياري عند الأسطر الجديدة: اضبط `channels.signal.streaming.chunkMode="newline"` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم بحسب الطول.
- المرفقات مدعومة (يُجلب base64 من `signal-cli`).
- تستخدم مرفقات الملاحظات الصوتية اسم الملف `signal-cli` كقيمة MIME احتياطية عند غياب `contentType`، بحيث يظل بإمكان نسخ الصوت تصنيف المذكرات الصوتية بتنسيق AAC.
- الحد الافتراضي للوسائط: `channels.signal.mediaMaxMb` (القيمة الافتراضية 8).
- استخدم `channels.signal.ignoreAttachments` لتخطي تنزيل الوسائط.
- يستخدم سياق سجل المجموعة `channels.signal.historyLimit` (أو `channels.signal.accounts.*.historyLimit`)، مع الرجوع إلى `messages.groupChat.historyLimit`. اضبط `0` للتعطيل (القيمة الافتراضية 50).

## مؤشرات الكتابة وإيصالات القراءة

- **مؤشرات الكتابة**: يرسل OpenClaw إشارات الكتابة عبر `signal-cli sendTyping` ويحدّثها أثناء إنشاء الرد.
- **إيصالات القراءة**: عندما تكون `channels.signal.sendReadReceipts` بالقيمة true، يمرر OpenClaw إيصالات القراءة للرسائل المباشرة المسموح بها.
- لا يتيح `signal-cli` إيصالات القراءة للمجموعات.

## تفاعلات حالة دورة الحياة

اضبط `messages.statusReactions.enabled: true` للسماح لـ Signal بعرض دورة حياة التفاعلات المشتركة: في قائمة الانتظار/التفكير/الأداة/Compaction/الاكتمال/الخطأ، في التفاعلات الواردة. يستخدم Signal الطابع الزمني للرسالة الواردة هدفًا للتفاعل؛ وتُرسل تفاعلات المجموعة باستخدام معرّف مجموعة Signal بالإضافة إلى المرسل الأصلي بصفته المؤلف المستهدف.

تتطلب تفاعلات الحالة أيضًا تفاعل إقرار و`messages.ackReactionScope` مطابقًا (`direct` أو `group-all` أو `group-mentions` أو `all`). اضبط `channels.signal.reactionLevel: "off"` لتعطيل تفاعلات حالة Signal.

يمسح `messages.removeAckAfterReply: true` تفاعل الحالة النهائي بعد مدة الاحتفاظ المضبوطة. بخلاف ذلك، يستعيد Signal تفاعل الإقرار الأولي بعد حالة الاكتمال/الخطأ النهائية.

## التفاعلات (أداة الرسائل)

استخدم `message action=react` مع `channel=signal`.

- الأهداف: رقم المرسل بصيغة E.164 أو UUID (استخدم `uuid:<id>` من مخرجات الاقتران؛ ويعمل UUID مجرد أيضًا).
- `messageId` هو الطابع الزمني في Signal للرسالة التي تتفاعل معها.
- تتطلب تفاعلات المجموعة `targetAuthor` أو `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

الإعداد:

- `channels.signal.actions.reactions`: تمكين/تعطيل إجراءات التفاعل (القيمة الافتراضية true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (القيمة الافتراضية `minimal`).
  - `off`/`ack` يعطّل تفاعلات الوكيل (تُرجع أداة الرسائل `react` أخطاء).
  - `minimal`/`extensive` يمكّن تفاعلات الوكيل ويضبط مستوى الإرشاد.
- التجاوزات لكل حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## تفاعلات الموافقة

تستخدم مطالبات موافقة التنفيذ وPlugin في Signal كتلتي التوجيه `approvals.exec` و`approvals.plugin` على المستوى الأعلى. لا يحتوي Signal على كتلة `channels.signal.execApprovals`.

- `👍` يوافق لمرة واحدة.
- `👎` يرفض.
- استخدم `/approve <id> allow-always` عندما يتيح الطلب موافقة دائمة.

يتطلب حسم تفاعل الموافقة معتمِدين صريحين في Signal من `channels.signal.allowFrom` أو `channels.signal.defaultTo` أو الحقول المطابقة على مستوى الحساب. لا يزال بإمكان مطالبات الموافقة على التنفيذ المباشر ضمن المحادثة نفسها منع البديل المحلي المكرر `/approve` دون معتمِدين صريحين؛ وتُبقي موافقات المجموعة التي بلا معتمِدين البديل المحلي ظاهرًا.

## أهداف التسليم (CLI/Cron)

- الرسائل المباشرة: `signal:+15551234567` (أو E.164 مجرد).
- الرسائل المباشرة باستخدام UUID: `uuid:<id>` (أو UUID مجرد).
- المجموعات: `signal:group:<groupId>`.
- أسماء المستخدمين: `username:<name>` (إذا كان حساب Signal يدعمها).

## الأسماء المستعارة

اضبط أسماء مستعارة للحصول على أسماء ثابتة لأهداف Signal المتكررة. الأسماء المستعارة هي إعدادات في جانب OpenClaw فقط؛ ولا تنشئ جهات اتصال Signal أو تعدّلها.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

استخدم الأسماء المستعارة في أي موضع تُقبل فيه أهداف تسليم Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "اكتمل النشر"
```

ترث الأسماء المستعارة لكل حساب الأسماء المستعارة على المستوى الأعلى، ويمكنها إضافة أسماء أو تجاوزها:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

يسرد `openclaw directory peers list --channel signal` و`openclaw directory groups list --channel signal` الأسماء المستعارة المضبوطة. يستند دليل Signal إلى الإعدادات؛ ولا يستعلم مباشرةً عن جهات اتصال Signal أو يعدّل حساب Signal.

## استكشاف الأخطاء وإصلاحها

نفّذ تسلسل الفحص هذا أولًا:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ثم تحقّق من حالة اقتران الرسائل المباشرة عند الحاجة:

```bash
openclaw pairing list signal
```

الأعطال الشائعة:

- يمكن الوصول إلى البرنامج الخفي لكن لا توجد ردود: تحقّق من إعدادات الحساب/البرنامج الخفي (`httpUrl`، `account`) ووضع الاستقبال.
- تُتجاهل الرسائل المباشرة: المرسل في انتظار الموافقة على الاقتران.
- تُتجاهل رسائل المجموعة: قيود مرسل المجموعة/الذكر تمنع التسليم.
- أخطاء التحقق من صحة الإعدادات بعد التعديلات: شغّل `openclaw doctor --fix`.
- Signal مفقود من التشخيصات: تحقّق من `channels.signal.enabled: true`.

فحوصات إضافية:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

لمسار الفرز: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

## ملاحظات الأمان

- يخزّن `signal-cli` مفاتيح الحساب محليًا (عادةً في `~/.local/share/signal-cli/data/`).
- أنشئ نسخة احتياطية من حالة حساب Signal قبل ترحيل الخادم أو إعادة بنائه.
- احتفظ بـ `channels.signal.dmPolicy: "pairing"` ما لم تكن تريد صراحةً وصولًا أوسع إلى الرسائل المباشرة.
- لا يلزم التحقق عبر SMS إلا في مسارات التسجيل أو الاسترداد، لكن فقدان السيطرة على الرقم/الحساب قد يعقّد إعادة التسجيل.

## مرجع الإعدادات (Signal)

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.signal.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.signal.apiMode`: `auto | native | container` (القيمة الافتراضية: auto). راجع [وضع الحاوية](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: رقم حساب الروبوت بصيغة E.164.
- `channels.signal.accountUuid`: UUID اختياري لحساب الروبوت لاكتشاف الذكر الأصلي باستخدام @ والحماية من الحلقات.
- `channels.signal.cliPath`: المسار إلى `signal-cli`.
- `channels.signal.configPath`: دليل `signal-cli --config` اختياري.
- `channels.signal.httpUrl`: عنوان URL الكامل للبرنامج الخفي (يتجاوز المضيف/المنفذ).
- `channels.signal.httpHost`، `channels.signal.httpPort`: ربط البرنامج الخفي (القيمة الافتراضية `127.0.0.1:8080`).
- `channels.signal.autoStart`: تشغيل البرنامج الخفي تلقائيًا (القيمة الافتراضية true إذا لم يكن `httpUrl` مضبوطًا).
- `channels.signal.startupTimeoutMs`: مهلة انتظار بدء التشغيل بالمللي ثانية (الحد الأدنى 1000، والحد الأقصى 120000؛ والقيمة الافتراضية 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: تخطي تنزيل المرفقات.
- `channels.signal.ignoreStories`: تجاهل القصص الواردة من البرنامج الخفي.
- `channels.signal.sendReadReceipts`: تمرير إيصالات القراءة.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (القيمة الافتراضية: الاقتران).
- `channels.signal.allowFrom`: قائمة السماح للرسائل المباشرة (E.164 أو `uuid:<id>`). يتطلب `open` وجود `"*"`. لا يحتوي Signal على أسماء مستخدمين؛ استخدم معرّفات الهاتف/UUID.
- `channels.signal.aliases`: أسماء مستعارة في جانب OpenClaw لأهداف تسليم الرسائل المباشرة أو المجموعات.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (القيمة الافتراضية: قائمة السماح).
- `channels.signal.groupAllowFrom`: قائمة السماح للمجموعات؛ تقبل معرّفات مجموعات Signal (خامًا أو `group:<id>` أو `signal:group:<id>`) أو أرقام المرسلين بصيغة E.164 أو قيم `uuid:<id>`.
- `channels.signal.groups`: تجاوزات لكل مجموعة، مفاتيحها معرّفات مجموعات Signal (أو `"*"`). الحقول المدعومة: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: إصدار `channels.signal.groups` لكل حساب لإعدادات الحسابات المتعددة.
- `channels.signal.accounts.<id>.aliases`: أسماء مستعارة لكل حساب، تُدمج مع الأسماء المستعارة على المستوى الأعلى.
- `channels.signal.replyToMode`: وضع اقتباس الرد الأصلي، `off | first | all | batched` (القيمة الافتراضية: `all`).
- `channels.signal.replyToModeByChatType.direct`، `channels.signal.replyToModeByChatType.group`: تجاوزات اقتباس الرد الأصلي بحسب نوع المحادثة.
- `channels.signal.accounts.<id>.replyToMode`، `channels.signal.accounts.<id>.replyToModeByChatType.direct`، `channels.signal.accounts.<id>.replyToModeByChatType.group`: تجاوزات اقتباس الرد لكل حساب.
- `channels.signal.historyLimit`: الحد الأقصى لرسائل المجموعة المضمّنة كسياق (0 يعطّلها).
- `channels.signal.dmHistoryLimit`: حد سجل الرسائل المباشرة بوحدات أدوار المستخدم. التجاوزات لكل مستخدم: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: حجم الجزء الصادر بالأحرف (القيمة الافتراضية 4000).
- `channels.signal.streaming.chunkMode`: `length` (القيمة الافتراضية) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم بحسب الطول.
- `channels.signal.mediaMaxMb`: الحد الأقصى للوسائط الواردة/الصادرة بالميغابايت (القيمة الافتراضية 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (القيمة الافتراضية `minimal`). راجع [التفاعلات](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (القيمة الافتراضية `own`) - متى يُخطر الوكيل بالتفاعلات الواردة من الآخرين.
- `channels.signal.reactionAllowlist`: المرسلون الذين تُخطر تفاعلاتهم الوكيل عندما يكون `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`، `channels.signal.streaming.block.coalesce`: عناصر التحكم في البث بوضع الكتل، والمشتركة بين القنوات. راجع [البث](/ar/concepts/streaming).

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (خيار احتياطي بنص عادي؛ تُكتشف إشارات @ الأصلية في Signal من البيانات الوصفية المنظَّمة عند تهيئة هوية حساب الروبوت).
- `messages.groupChat.mentionPatterns` (خيار احتياطي عام).
- `messages.responsePrefix`.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك الدردشة الجماعية وتقييدها بالإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتحصين
