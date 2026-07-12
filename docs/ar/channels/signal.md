---
read_when:
    - إعداد دعم Signal
    - تصحيح أخطاء إرسال/استقبال Signal
summary: دعم Signal عبر signal-cli (خدمة أصلية أو حاوية bbernhard)، ومسارات الإعداد، ونموذج الأرقام
title: Signal
x-i18n:
    generated_at: "2026-07-12T05:35:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal هو Plugin قناة قابل للتنزيل (`@openclaw/signal`). يتواصل Gateway مع `signal-cli` عبر HTTP: إما الخدمة الخفية الأصلية (JSON-RPC + SSE) أو حاوية [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). لا يضمّن OpenClaw مكتبة libsignal.

## نموذج الأرقام (اقرأ هذا أولًا)

- يتصل Gateway **بجهاز Signal**: حساب `signal-cli`.
- يؤدي تشغيل الروبوت على **حساب Signal الشخصي الخاص بك** إلى تجاهله رسائلك (حماية من الحلقات).
- للحصول على سلوك «أرسل رسالة إلى الروبوت فيرد»، استخدم **رقمًا منفصلًا للروبوت**.

## التثبيت

```bash
openclaw plugins install @openclaw/signal
```

تحاول مواصفات Plugin المجرّدة استخدام ClawHub أولًا، ثم ترجع إلى npm. افرض مصدرًا باستخدام `openclaw plugins install clawhub:@openclaw/signal` أو `npm:@openclaw/signal`. يسجّل `plugins install` الـ Plugin ويفعّله؛ ولا حاجة إلى خطوة `enable` منفصلة. راجع [الإضافات](/ar/tools/plugin) للاطلاع على قواعد التثبيت العامة.

## الإعداد السريع

<Steps>
  <Step title="اختر رقمًا">
    استخدم **رقم Signal منفصلًا** للروبوت (موصى به).
  </Step>
  <Step title="ثبّت الـ Plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="شغّل الإعداد الإرشادي">
    ```bash
    openclaw channels add
    ```
    يكتشف المعالج ما إذا كان `signal-cli` موجودًا في `PATH`، ويعرض تثبيته عند عدم وجوده: إذ ينزّل بنية GraalVM الأصلية الرسمية على Linux x86-64، أو يثبّته عبر Homebrew على macOS والمعماريات الأخرى. ثم يطلب رقم الروبوت ومسار `signal-cli`.
  </Step>
  <Step title="اربط الحساب أو سجّله">
    - **الربط عبر رمز QR (الأسرع):** `signal-cli link -n "OpenClaw"`، ثم امسح الرمز باستخدام Signal. راجع [المسار أ](#setup-path-a-link-existing-signal-account-qr).
    - **التسجيل عبر SMS:** رقم مخصص مع اختبار captcha والتحقق عبر SMS. راجع [المسار ب](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="تحقّق وأجرِ الاقتران">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    أرسل أول رسالة خاصة ووافق على الاقتران: `openclaw pairing approve signal <CODE>`.
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

| الحقل         | الوصف                                                        |
| ------------- | ------------------------------------------------------------ |
| `account`     | رقم هاتف الروبوت بتنسيق E.164 (`+15551234567`)               |
| `cliPath`     | مسار `signal-cli` (`signal-cli` إذا كان موجودًا في `PATH`)    |
| `configPath`  | دليل إعداد `signal-cli` الممرّر عبر `--config`                |
| `dmPolicy`    | سياسة الوصول إلى الرسائل الخاصة (يُوصى بـ `pairing`)         |
| `allowFrom`   | أرقام الهواتف أو قيم `uuid:<id>` المسموح لها بإرسال رسائل خاصة |

دعم الحسابات المتعددة: استخدم `channels.signal.accounts` مع إعداد لكل حساب و`name` اختياري. راجع [القنوات متعددة الحسابات](/ar/gateway/config-channels#multi-account-all-channels) للاطلاع على النمط المشترك.

## ماهيته

- توجيه حتمي: تعود الردود دائمًا إلى Signal.
- تشترك الرسائل الخاصة في الجلسة الرئيسية للوكيل؛ وتكون المجموعات معزولة (`agent:<agentId>:signal:group:<groupId>`).
- افتراضيًا، قد يكتب Signal تحديثات الإعداد التي يشغّلها `/config set|unset` (يتطلب `commands.config: true`). عطّل ذلك باستخدام `channels.signal.configWrites: false`.

## مسار الإعداد أ: ربط حساب Signal حالي (QR)

1. ثبّت `signal-cli` (بنية JVM أو البنية الأصلية)، أو دع `openclaw channels add` يثبّته لك.
2. اربط حساب روبوت: `signal-cli link -n "OpenClaw"`، ثم امسح رمز QR في Signal.
3. اضبط Signal وشغّل Gateway.

## مسار الإعداد ب: تسجيل رقم روبوت مخصص (SMS، ‏Linux)

استخدم هذا لرقم روبوت مخصص بدلًا من ربط حساب تطبيق Signal حالي. اختُبر التدفق التالي على Ubuntu 24.

1. احصل على رقم يمكنه تلقي رسائل SMS (أو التحقق الصوتي للهواتف الأرضية). يتجنب رقم الروبوت المخصص تعارضات الحساب والجلسة.
2. ثبّت `signal-cli` على مضيف Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

إذا كنت تستخدم بنية JVM ‏(`signal-cli-${VERSION}.tar.gz`)، فثبّت JRE أولًا. حافظ على تحديث `signal-cli`؛ إذ تشير ملاحظات المنبع إلى أن الإصدارات القديمة قد تتعطل مع تغيّر واجهات API لخادم Signal.

3. سجّل الرقم وتحقق منه:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

إذا كان اختبار captcha مطلوبًا (يلزم الوصول إلى متصفح لإكمال هذه الخطوة):

1. افتح `https://signalcaptchas.org/registration/generate.html`.
2. أكمل اختبار captcha، وانسخ هدف الرابط `signalcaptcha://...` من "Open Signal".
3. شغّل الأمر من عنوان IP الخارجي نفسه لجلسة المتصفح متى أمكن (تنتهي صلاحية رموز captcha سريعًا).
4. سجّل وتحقق فورًا:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. اضبط OpenClaw، وأعد تشغيل Gateway، وتحقق من القناة:

```bash
# إذا كنت تشغّل Gateway كخدمة systemd للمستخدم:
systemctl --user restart openclaw-gateway.service

# ثم تحقّق:
openclaw doctor
openclaw channels status --probe
```

5. أقرن مرسل الرسائل الخاصة:
   - أرسل أي رسالة إلى رقم الروبوت.
   - وافق على الخادم: `openclaw pairing approve signal <PAIRING_CODE>`.
   - احفظ رقم الروبوت كجهة اتصال على هاتفك لتجنب "Unknown contact".

<Warning>
قد يؤدي تسجيل حساب رقم هاتف باستخدام `signal-cli` إلى إلغاء مصادقة جلسة تطبيق Signal الرئيسية لذلك الرقم. يُفضّل استخدام رقم روبوت مخصص، أو وضع الربط عبر QR للاحتفاظ بإعداد تطبيق الهاتف الحالي.
</Warning>

مراجع المنبع:

- ملف README الخاص بـ `signal-cli`: `https://github.com/AsamK/signal-cli`
- تدفق captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- تدفق الربط: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## وضع الخدمة الخفية الخارجية (httpUrl)

لإدارة `signal-cli` بنفسك (بطء بدء JVM البارد، وتهيئة الحاوية، ووحدات المعالجة المركزية المشتركة)، شغّل الخدمة الخفية بصورة منفصلة ووجّه OpenClaw إليها:

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

يتجاوز هذا التشغيل التلقائي وانتظار بدء OpenClaw. لعمليات البدء البطيئة ذات التشغيل التلقائي، اضبط `channels.signal.startupTimeoutMs`.

## وضع الحاوية (bbernhard/signal-cli-rest-api)

بدلًا من تشغيل `signal-cli` بصورة أصلية، استخدم حاوية Docker المسماة [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api)، التي تغلّف `signal-cli` خلف واجهة REST + WebSocket.

المتطلبات:

- **يجب** تشغيل الحاوية باستخدام `MODE=json-rpc` لتلقي الرسائل في الوقت الفعلي.
- سجّل حساب Signal أو اربطه داخل الحاوية قبل توصيل OpenClaw.

مثال لخدمة `docker-compose.yml`:

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

| القيمة          | السلوك                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------- |
| `"auto"`        | (الافتراضي) يفحص وسيلتي النقل؛ ويتحقق البث من استقبال WebSocket للحاوية                     |
| `"native"`      | يفرض `signal-cli` الأصلي (JSON-RPC عند `/api/v1/rpc`، وSSE عند `/api/v1/events`)              |
| `"container"`   | يفرض حاوية bbernhard ‏(REST عند `/v2/send`، وWebSocket عند `/v1/receive/{account}`)            |

عندما تكون قيمة `apiMode` هي `"auto"`، يخزّن OpenClaw الوضع المكتشف مؤقتًا لمدة 30 ثانية لكل عنوان URL للخدمة الخفية لتجنب تكرار الفحوصات (يفوز الوضع الأصلي عندما تكون وسيلتا النقل سليمتين). لا يُختار استقبال الحاوية للبث إلا بعد ترقية `/v1/receive/{account}` إلى WebSocket، الأمر الذي يتطلب `MODE=json-rpc`.

يدعم وضع الحاوية عمليات Signal نفسها التي يدعمها الوضع الأصلي عندما تعرض الحاوية واجهات API المطابقة: الإرسال، والاستقبال، والمرفقات، ومؤشرات الكتابة، وإيصالات القراءة/المشاهدة، والتفاعلات، والمجموعات، والنص المنسّق. يحوّل OpenClaw استدعاءات RPC الأصلية لـ Signal إلى حمولات REST الخاصة بالحاوية، بما في ذلك معرّفات المجموعات `group.{base64(internal_id)}` و`text_mode: "styled"` للنص المنسّق.

ملاحظات تشغيلية:

- استخدم `autoStart: false` مع وضع الحاوية؛ يجب ألا يشغّل OpenClaw خدمة خفية أصلية عند تحديد `apiMode: "container"`.
- استخدم `MODE=json-rpc` للاستقبال. قد يجعل `MODE=normal` المسار `/v1/about` يبدو سليمًا، لكن `/v1/receive/{account}` لن يترقّى إلى WebSocket، ولذلك لن يختار OpenClaw بث استقبال الحاوية في وضع `auto`.
- اضبط `apiMode: "container"` عندما يشير `httpUrl` إلى واجهة REST API الخاصة بـ bbernhard، و`"native"` عندما يشير إلى JSON-RPC/SSE الأصلي لـ `signal-cli`، و`"auto"` عندما قد يختلف النشر.
- تلتزم تنزيلات مرفقات الحاوية بحدود بايتات الوسائط نفسها في الوضع الأصلي. تُرفض الاستجابات كبيرة الحجم قبل تخزينها مؤقتًا بالكامل عندما يرسل الخادم `Content-Length`، وتُرفض أثناء البث في الحالات الأخرى.

## التحكم في الوصول (الرسائل الخاصة + المجموعات)

الرسائل الخاصة:

- الإعداد الافتراضي: `channels.signal.dmPolicy = "pairing"`.
- يحصل المرسلون المجهولون على رمز اقتران؛ وتُتجاهل الرسائل حتى الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
- وافق باستخدام `openclaw pairing list signal` و`openclaw pairing approve signal <CODE>`.
- الاقتران هو التبادل الافتراضي للرموز في رسائل Signal الخاصة. التفاصيل: [الاقتران](/ar/channels/pairing)
- يُخزّن المرسلون ذوو UUID فقط (من `sourceUuid`) بصيغة `uuid:<id>` في `channels.signal.allowFrom`.

المجموعات:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- يتحكم `channels.signal.groupAllowFrom` في المجموعات أو المرسلين الذين يمكنهم تشغيل ردود المجموعات عند ضبط `allowlist`؛ ويمكن أن تكون الإدخالات معرّفات مجموعات Signal (خامًا، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام هواتف المرسلين، أو قيم `uuid:<id>`، أو `*`.
- يمكن لـ `channels.signal.groups["<group-id>" | "*"]` تجاوز سلوك المجموعة باستخدام `requireMention` و`tools` و`toolsBySender`.
- استخدم `channels.signal.accounts.<id>.groups` للتجاوزات الخاصة بكل حساب في إعدادات الحسابات المتعددة.
- لا يؤدي إدراج مجموعة في قائمة السماح عبر `groupAllowFrom` إلى تعطيل اشتراط الإشارة بحد ذاته. يعالج إدخال `channels.signal.groups["<group-id>"]` المضبوط تحديدًا كل رسالة في المجموعة ما لم يُضبط `requireMention: true` صراحةً.
- ملاحظة وقت التشغيل: إذا كان `channels.signal` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

## كيفية عمله (السلوك)

- الوضع الأصلي: يعمل `signal-cli` كخدمة خفية؛ ويقرأ Gateway الأحداث عبر SSE.
- وضع الحاوية: يرسل Gateway عبر REST API ويستقبل عبر WebSocket.
- تُطبّع الرسائل الواردة في غلاف القناة المشترك.
- تعود الردود دائمًا إلى الرقم أو المجموعة نفسها.
- تتضمن الردود على الرسائل الواردة بيانات اقتباس Signal الأصلية عندما تقبل الواجهة الخلفية الطابع الزمني للرسالة الواردة ومؤلفها؛ وإذا كانت بيانات الاقتباس مفقودة أو مرفوضة، يرسل OpenClaw الرد كرسالة عادية.
- اضبط استخدام الاقتباسات الأصلية باستخدام `channels.signal.replyToMode = off | first | all | batched`، أو `channels.signal.replyToModeByChatType.direct/group` للتجاوزات الخاصة بكل نوع محادثة. تكون للقيم على مستوى الحساب ضمن `channels.signal.accounts.<id>` الأولوية.

## الوسائط + الحدود

- يُقسَّم النص الصادر إلى أجزاء وفق `channels.signal.textChunkLimit` (القيمة الافتراضية 4000).
- التقسيم الاختياري عند الأسطر الجديدة: اضبط `channels.signal.chunkMode="newline"` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- المرفقات مدعومة (تُجلب بترميز base64 من `signal-cli`).
- تستخدم مرفقات الملاحظات الصوتية اسم الملف من `signal-cli` كقيمة MIME احتياطية عند غياب `contentType`، بحيث يظل بإمكان نسخ الصوت تصنيف المذكرات الصوتية بتنسيق AAC.
- الحد الافتراضي للوسائط: `channels.signal.mediaMaxMb` (القيمة الافتراضية 8).
- استخدم `channels.signal.ignoreAttachments` لتخطي تنزيل الوسائط.
- يستخدم سياق سجل المجموعات `channels.signal.historyLimit` (أو `channels.signal.accounts.*.historyLimit`)، مع الرجوع إلى `messages.groupChat.historyLimit` عند عدم توفره. اضبطه على `0` للتعطيل (القيمة الافتراضية 50).

## مؤشرات الكتابة وإيصالات القراءة

- **مؤشرات الكتابة**: يرسل OpenClaw إشارات الكتابة عبر `signal-cli sendTyping` ويحدّثها أثناء إنشاء الرد.
- **إيصالات القراءة**: عندما تكون قيمة `channels.signal.sendReadReceipts` هي true، يعيد OpenClaw توجيه إيصالات القراءة للرسائل المباشرة المسموح بها.
- لا يوفّر `signal-cli` إيصالات القراءة للمجموعات.

## تفاعلات حالة دورة الحياة

اضبط `messages.statusReactions.enabled: true` للسماح لـ Signal بعرض دورة حياة التفاعلات المشتركة لحالات الانتظار/التفكير/الأداة/Compaction/الاكتمال/الخطأ عند الرسائل الواردة. يستخدم Signal الطابع الزمني للرسالة الواردة هدفًا للتفاعل؛ وتُرسل تفاعلات المجموعة باستخدام معرّف مجموعة Signal مع المرسل الأصلي بوصفه المؤلف المستهدف.

تتطلب تفاعلات الحالة أيضًا تفاعل إقرار وقيمة مطابقة في `messages.ackReactionScope` (`direct` أو `group-all` أو `group-mentions` أو `all`). اضبط `channels.signal.reactionLevel: "off"` لتعطيل تفاعلات حالة Signal.

يمسح `messages.removeAckAfterReply: true` تفاعل الحالة النهائي بعد مدة الاحتفاظ المضبوطة. بخلاف ذلك، يستعيد Signal تفاعل الإقرار الأولي بعد حالة الاكتمال/الخطأ النهائية.

## التفاعلات (أداة الرسائل)

استخدم `message action=react` مع `channel=signal`.

- الأهداف: رقم المرسل بتنسيق E.164 أو UUID (استخدم `uuid:<id>` من مخرجات الاقتران؛ ويعمل UUID المجرّد أيضًا).
- يمثّل `messageId` الطابع الزمني في Signal للرسالة التي تتفاعل معها.
- تتطلب تفاعلات المجموعة `targetAuthor` أو `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

الإعداد:

- `channels.signal.actions.reactions`: تمكين/تعطيل إجراءات التفاعل (القيمة الافتراضية true).
- `channels.signal.reactionLevel`: ‏`off | ack | minimal | extensive` (القيمة الافتراضية `minimal`).
  - يعطّل `off`/`ack` تفاعلات الوكيل (تعيد أداة الرسائل `react` أخطاء).
  - يمكّن `minimal`/`extensive` تفاعلات الوكيل ويضبط مستوى الإرشاد.
- تجاوزات كل حساب: `channels.signal.accounts.<id>.actions.reactions` و`channels.signal.accounts.<id>.reactionLevel`.

## تفاعلات الموافقة

تستخدم مطالبات الموافقة على التنفيذ وPlugin في Signal كتلتي التوجيه العامتين `approvals.exec` و`approvals.plugin`. لا يحتوي Signal على كتلة `channels.signal.execApprovals`.

- يوافق `👍` مرة واحدة.
- يرفض `👎`.
- استخدم `/approve <id> allow-always` عندما يتيح الطلب موافقة دائمة.

يتطلب حسم تفاعل الموافقة تحديد الموافقين في Signal صراحةً ضمن `channels.signal.allowFrom` أو `channels.signal.defaultTo` أو الحقول المطابقة على مستوى الحساب. يمكن لمطالبات الموافقة المباشرة على التنفيذ ضمن المحادثة نفسها الاستمرار في إخفاء الخيار المحلي الاحتياطي المكرر `/approve` دون موافقين محددين صراحةً؛ أما موافقات المجموعات التي لا تتضمن موافقين فتبقي الخيار المحلي الاحتياطي ظاهرًا.

## أهداف التسليم (CLI/Cron)

- الرسائل المباشرة: `signal:+15551234567` (أو رقم E.164 مجرد).
- الرسائل المباشرة عبر UUID: ‏`uuid:<id>` (أو UUID مجرد).
- المجموعات: `signal:group:<groupId>`.
- أسماء المستخدمين: `username:<name>` (إذا كان حساب Signal لديك يدعمها).

## الأسماء المستعارة

اضبط أسماء مستعارة ثابتة لأهداف Signal المتكررة. الأسماء المستعارة هي إعدادات داخل OpenClaw فقط؛ ولا تنشئ جهات اتصال في Signal ولا تعدّلها.

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

استخدم الأسماء المستعارة في أي موضع يقبل أهداف تسليم Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

ترث الأسماء المستعارة لكل حساب الأسماء المستعارة العامة، ويمكنها إضافة الأسماء أو تجاوزها:

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

يعرض `openclaw directory peers list --channel signal` و`openclaw directory groups list --channel signal` الأسماء المستعارة المضبوطة. يعتمد دليل Signal على الإعدادات؛ ولا يستعلم مباشرةً عن جهات اتصال Signal ولا يعدّل حساب Signal.

## استكشاف الأخطاء وإصلاحها

نفّذ تسلسل الفحص التالي أولًا:

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

- يمكن الوصول إلى العملية الخدمية لكن لا توجد ردود: تحقّق من إعدادات الحساب/العملية الخدمية (`httpUrl` و`account`) ووضع الاستقبال.
- تُتجاهل الرسائل المباشرة: المرسل بانتظار الموافقة على الاقتران.
- تُتجاهل رسائل المجموعة: ضوابط السماح لمرسل المجموعة/الإشارة تمنع التسليم.
- أخطاء التحقق من الإعدادات بعد التعديلات: نفّذ `openclaw doctor --fix`.
- Signal غير موجود في التشخيصات: تأكّد من ضبط `channels.signal.enabled: true`.

فحوصات إضافية:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

للتعرّف على مسار الفرز التشخيصي: [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

## ملاحظات الأمان

- يخزّن `signal-cli` مفاتيح الحساب محليًا (عادةً في `~/.local/share/signal-cli/data/`).
- أنشئ نسخة احتياطية من حالة حساب Signal قبل ترحيل الخادم أو إعادة بنائه.
- أبقِ `channels.signal.dmPolicy: "pairing"` ما لم تكن تريد صراحةً إتاحة وصول أوسع إلى الرسائل المباشرة.
- لا يلزم التحقق عبر SMS إلا في مسارات التسجيل أو الاسترداد، لكن فقدان التحكم في الرقم/الحساب قد يعقّد إعادة التسجيل.

## مرجع الإعداد (Signal)

الإعداد الكامل: [الإعداد](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.signal.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.signal.apiMode`: ‏`auto | native | container` (القيمة الافتراضية: auto). راجع [وضع الحاوية](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: رقم E.164 لحساب الروبوت.
- `channels.signal.cliPath`: مسار `signal-cli`.
- `channels.signal.configPath`: دليل `signal-cli --config` اختياري.
- `channels.signal.httpUrl`: عنوان URL الكامل للعملية الخدمية (يتجاوز المضيف/المنفذ).
- `channels.signal.httpHost` و`channels.signal.httpPort`: عنوان ربط العملية الخدمية (القيمة الافتراضية `127.0.0.1:8080`).
- `channels.signal.autoStart`: تشغيل العملية الخدمية تلقائيًا (القيمة الافتراضية true إذا لم يُضبط `httpUrl`).
- `channels.signal.startupTimeoutMs`: مهلة انتظار بدء التشغيل بالمللي ثانية (الحد الأدنى 1000، والحد الأقصى 120000؛ والقيمة الافتراضية 30000).
- `channels.signal.receiveMode`: ‏`on-start | manual`.
- `channels.signal.ignoreAttachments`: تخطي تنزيل المرفقات.
- `channels.signal.ignoreStories`: تجاهل القصص الواردة من العملية الخدمية.
- `channels.signal.sendReadReceipts`: إعادة توجيه إيصالات القراءة.
- `channels.signal.dmPolicy`: ‏`pairing | allowlist | open | disabled` (القيمة الافتراضية: pairing).
- `channels.signal.allowFrom`: قائمة السماح للرسائل المباشرة (E.164 أو `uuid:<id>`). يتطلب `open` القيمة `"*"`. لا يدعم Signal أسماء المستخدمين؛ استخدم معرّفات الهاتف/UUID.
- `channels.signal.aliases`: أسماء مستعارة داخل OpenClaw لأهداف تسليم الرسائل المباشرة أو المجموعات.
- `channels.signal.groupPolicy`: ‏`open | allowlist | disabled` (القيمة الافتراضية: allowlist).
- `channels.signal.groupAllowFrom`: قائمة السماح للمجموعات؛ تقبل معرّفات مجموعات Signal (مجرّدة أو `group:<id>` أو `signal:group:<id>`)، أو أرقام المرسلين بتنسيق E.164، أو قيم `uuid:<id>`.
- `channels.signal.groups`: تجاوزات لكل مجموعة، مفهرسة بمعرّف مجموعة Signal (أو `"*"`). الحقول المدعومة: `requireMention` و`tools` و`toolsBySender`.
- `channels.signal.accounts.<id>.groups`: إصدار `channels.signal.groups` الخاص بكل حساب لإعدادات الحسابات المتعددة.
- `channels.signal.accounts.<id>.aliases`: أسماء مستعارة لكل حساب، تُدمج مع الأسماء المستعارة العامة.
- `channels.signal.replyToMode`: وضع اقتباس الرد الأصلي، ‏`off | first | all | batched` (القيمة الافتراضية: `all`).
- `channels.signal.replyToModeByChatType.direct` و`channels.signal.replyToModeByChatType.group`: تجاوزات اقتباس الرد الأصلي لكل نوع محادثة.
- `channels.signal.accounts.<id>.replyToMode` و`channels.signal.accounts.<id>.replyToModeByChatType.direct` و`channels.signal.accounts.<id>.replyToModeByChatType.group`: تجاوزات اقتباس الرد لكل حساب.
- `channels.signal.historyLimit`: الحد الأقصى لرسائل المجموعة التي تُضمّن في السياق (تعطّله القيمة 0).
- `channels.signal.dmHistoryLimit`: حد سجل الرسائل المباشرة محسوبًا بتفاعلات المستخدم. تجاوزات كل مستخدم: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: حجم جزء النص الصادر بالأحرف (القيمة الافتراضية 4000).
- `channels.signal.chunkMode`: ‏`length` (القيمة الافتراضية) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.signal.mediaMaxMb`: الحد الأقصى للوسائط الواردة/الصادرة بالميغابايت (القيمة الافتراضية 8).
- `channels.signal.reactionLevel`: ‏`off | ack | minimal | extensive` (القيمة الافتراضية `minimal`). راجع [التفاعلات](#reactions-message-tool).
- `channels.signal.reactionNotifications`: ‏`off | own | all | allowlist` (القيمة الافتراضية `own`) - يحدد متى يُخطَر الوكيل بالتفاعلات الواردة من الآخرين.
- `channels.signal.reactionAllowlist`: المرسلون الذين تُخطر تفاعلاتهم الوكيل عندما تكون قيمة `reactionNotifications` هي `"allowlist"`.
- `channels.signal.blockStreaming` و`channels.signal.blockStreamingCoalesce`: عناصر التحكم في التدفق بوضع الكتل المشتركة بين القنوات. راجع [التدفق](/ar/concepts/streaming).

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (لا يدعم Signal الإشارات الأصلية).
- `messages.groupChat.mentionPatterns` (الخيار الاحتياطي العام).
- `messages.responsePrefix`.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة ومسار الاقتران
- [المجموعات](/ar/channels/groups) - سلوك محادثات المجموعة وضوابط الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
