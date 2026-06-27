---
read_when:
    - إعداد دعم Signal
    - تصحيح أخطاء إرسال/استقبال Signal
summary: دعم Signal عبر signal-cli (الخادم الأصلي أو حاوية bbernhard)، ومسارات الإعداد، ونموذج الرقم
title: Signal
x-i18n:
    generated_at: "2026-06-27T17:13:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

الحالة: تكامل CLI خارجي. يتواصل Gateway مع `signal-cli` عبر HTTP — إما daemon أصلي (JSON-RPC + SSE) أو حاوية bbernhard/signal-cli-rest-api (REST + WebSocket).

## المتطلبات الأساسية

- تثبيت OpenClaw على خادمك (تدفق Linux أدناه اختُبر على Ubuntu 24).
- أحد الخيارين:
  - توفر `signal-cli` على المضيف (الوضع الأصلي)، **أو**
  - حاوية Docker من `bbernhard/signal-cli-rest-api` (وضع الحاوية).
- رقم هاتف يمكنه تلقي رسالة SMS واحدة للتحقق (لمسار التسجيل عبر SMS).
- وصول عبر المتصفح إلى captcha الخاصة بـ Signal (`signalcaptchas.org`) أثناء التسجيل.

## الإعداد السريع (للمبتدئين)

1. استخدم **رقم Signal منفصلًا** للبوت (موصى به).
2. ثبّت Plugin الخاص بـ OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. ثبّت `signal-cli` (يتطلب Java إذا كنت تستخدم بناء JVM).
4. اختر مسار إعداد واحدًا:
   - **المسار A (ربط QR):** `signal-cli link -n "OpenClaw"` ثم امسح الرمز باستخدام Signal.
   - **المسار B (تسجيل SMS):** سجّل رقمًا مخصصًا باستخدام captcha + تحقق SMS.
5. اضبط إعدادات OpenClaw وأعد تشغيل Gateway.
6. أرسل أول رسالة مباشرة ووافق على الاقتران (`openclaw pairing approve signal <CODE>`).

أدنى إعداد:

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

مرجع الحقول:

| الحقل        | الوصف                                       |
| ------------ | ------------------------------------------------- |
| `account`    | رقم هاتف البوت بتنسيق E.164 (`+15551234567`) |
| `cliPath`    | المسار إلى `signal-cli` (`signal-cli` إذا كان على `PATH`)  |
| `configPath` | دليل إعدادات signal-cli الممرر كـ `--config`        |
| `dmPolicy`   | سياسة وصول الرسائل المباشرة (`pairing` موصى بها)          |
| `allowFrom`  | أرقام الهواتف أو قيم `uuid:<id>` المسموح لها بإرسال رسائل مباشرة |

## ما هو

- قناة Signal عبر `signal-cli` (وليست libsignal مضمّنة).
- توجيه حتمي: تعود الردود دائمًا إلى Signal.
- تشارك الرسائل المباشرة الجلسة الرئيسية للوكيل؛ أما المجموعات فهي معزولة (`agent:<agentId>:signal:group:<groupId>`).

## عمليات كتابة الإعدادات

افتراضيًا، يُسمح لـ Signal بكتابة تحديثات الإعدادات التي يطلقها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## نموذج الرقم (مهم)

- يتصل Gateway بـ **جهاز Signal** (حساب `signal-cli`).
- إذا شغّلت البوت على **حساب Signal الشخصي الخاص بك**، فسيتجاهل رسائلك أنت (حماية من الحلقة).
- لكي تتمكن من "إرسال رسالة إلى البوت فيرد"، استخدم **رقم بوت منفصلًا**.

## مسار الإعداد A: ربط حساب Signal موجود (QR)

1. ثبّت `signal-cli` (بناء JVM أو البناء الأصلي).
2. اربط حساب بوت:
   - `signal-cli link -n "OpenClaw"` ثم امسح رمز QR في Signal.
3. اضبط Signal وشغّل Gateway.

مثال:

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

دعم الحسابات المتعددة: استخدم `channels.signal.accounts` مع إعدادات لكل حساب و`name` اختياري. راجع [`gateway/configuration`](/ar/gateway/config-channels#multi-account-all-channels) للنمط المشترك.

## مسار الإعداد B: تسجيل رقم بوت مخصص (SMS، Linux)

استخدم هذا عندما تريد رقم بوت مخصصًا بدلًا من ربط حساب تطبيق Signal موجود.

1. احصل على رقم يمكنه تلقي SMS (أو تحقق صوتي للخطوط الأرضية).
   - استخدم رقم بوت مخصصًا لتجنب تعارضات الحساب/الجلسة.
2. ثبّت `signal-cli` على مضيف Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

إذا كنت تستخدم بناء JVM (`signal-cli-${VERSION}.tar.gz`)، فثبّت JRE 25+ أولًا.
حافظ على تحديث `signal-cli`؛ تشير ملاحظات المشروع الأصلي إلى أن الإصدارات القديمة قد تتعطل مع تغيّر واجهات API لخادم Signal.

3. سجّل الرقم وتحقق منه:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

إذا كانت captcha مطلوبة:

1. افتح `https://signalcaptchas.org/registration/generate.html`.
2. أكمل captcha، وانسخ هدف رابط `signalcaptcha://...` من "Open Signal".
3. شغّل من نفس عنوان IP الخارجي لجلسة المتصفح عندما يكون ذلك ممكنًا.
4. شغّل التسجيل مرة أخرى فورًا (تنتهي صلاحية رموز captcha سريعًا):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. اضبط OpenClaw، وأعد تشغيل Gateway، وتحقق من القناة:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. اقرن مرسل الرسائل المباشرة الخاص بك:
   - أرسل أي رسالة إلى رقم البوت.
   - وافق على الرمز على الخادم: `openclaw pairing approve signal <PAIRING_CODE>`.
   - احفظ رقم البوت كجهة اتصال على هاتفك لتجنب "Unknown contact".

<Warning>
قد يؤدي تسجيل حساب رقم هاتف باستخدام `signal-cli` إلى إلغاء مصادقة جلسة تطبيق Signal الرئيسية لذلك الرقم. فضّل رقم بوت مخصصًا، أو استخدم وضع ربط QR إذا كنت بحاجة إلى الاحتفاظ بإعداد تطبيق الهاتف الحالي.
</Warning>

مراجع المشروع الأصلي:

- README الخاص بـ `signal-cli`: `https://github.com/AsamK/signal-cli`
- تدفق captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- تدفق الربط: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## وضع daemon الخارجي (httpUrl)

إذا كنت تريد إدارة `signal-cli` بنفسك (بدء JVM البارد البطيء، أو تهيئة الحاوية، أو وحدات CPU المشتركة)، فشغّل daemon منفصلًا ووجّه OpenClaw إليه:

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

يتجاوز هذا التشغيل التلقائي والانتظار عند بدء التشغيل داخل OpenClaw. لعمليات البدء البطيئة عند التشغيل التلقائي، اضبط `channels.signal.startupTimeoutMs`.

## وضع الحاوية (bbernhard/signal-cli-rest-api)

بدلًا من تشغيل `signal-cli` أصليًا، يمكنك استخدام حاوية Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). تغلّف هذه الحاوية `signal-cli` خلف REST API وواجهة WebSocket.

المتطلبات:

- يجب تشغيل الحاوية **إلزاميًا** باستخدام `MODE=json-rpc` لاستقبال الرسائل في الوقت الفعلي.
- سجّل أو اربط حساب Signal الخاص بك داخل الحاوية قبل توصيل OpenClaw.

مثال خدمة `docker-compose.yml`:

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

إعدادات OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

يتحكم حقل `apiMode` في البروتوكول الذي يستخدمه OpenClaw:

| القيمة         | السلوك                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (الافتراضي) يفحص كلا وسيلتي النقل؛ يتحقق البث من استقبال WebSocket في الحاوية    |
| `"native"`    | يفرض signal-cli الأصلي (JSON-RPC عند `/api/v1/rpc`، وSSE عند `/api/v1/events`)         |
| `"container"` | يفرض حاوية bbernhard (REST عند `/v2/send`، وWebSocket عند `/v1/receive/{account}`) |

عندما يكون `apiMode` هو `"auto"`، يخزن OpenClaw الوضع المكتشف مؤقتًا لمدة 30 ثانية لتجنب الفحوصات المتكررة. لا يُختار استقبال الحاوية للبث إلا بعد ترقية `/v1/receive/{account}` إلى WebSocket، وهذا يتطلب `MODE=json-rpc`.

يدعم وضع الحاوية عمليات قناة Signal نفسها التي يدعمها الوضع الأصلي عندما تكشف الحاوية واجهات API مطابقة: الإرسال، والاستقبال، والمرفقات، ومؤشرات الكتابة، وإيصالات القراءة/العرض، والتفاعلات، والمجموعات، والنص المنسق. يترجم OpenClaw استدعاءات Signal RPC الأصلية الخاصة به إلى حمولات REST الخاصة بالحاوية، بما في ذلك معرّفات المجموعات `group.{base64(internal_id)}` و`text_mode: "styled"` للنص المنسق.

ملاحظات تشغيلية:

- استخدم `autoStart: false` مع وضع الحاوية. ينبغي ألا يشغّل OpenClaw daemon أصليًا عندما يكون `apiMode: "container"` محددًا.
- استخدم `MODE=json-rpc` للاستقبال. يمكن أن يجعل `MODE=normal` المسار `/v1/about` يبدو سليمًا، لكن `/v1/receive/{account}` لا يترقى إلى WebSocket، لذلك لن يختار OpenClaw بث استقبال الحاوية في وضع `auto`.
- اضبط `apiMode: "container"` عندما تعرف أن `httpUrl` يشير إلى REST API الخاص بـ bbernhard. واضبط `apiMode: "native"` عندما تعرف أنه يشير إلى JSON-RPC/SSE الأصلي لـ `signal-cli`. استخدم `"auto"` عندما قد يختلف النشر.
- تلتزم تنزيلات مرفقات الحاوية بحدود بايتات الوسائط نفسها كما في الوضع الأصلي. تُرفض الاستجابات كبيرة الحجم قبل تخزينها بالكامل في الذاكرة عندما يرسل الخادم `Content-Length`، وأثناء البث في غير ذلك.

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

الرسائل المباشرة:

- الافتراضي: `channels.signal.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ تُتجاهل الرسائل حتى تتم الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
- وافق عبر:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- الاقتران هو تبادل الرمز الافتراضي لرسائل Signal المباشرة. التفاصيل: [الاقتران](/ar/channels/pairing)
- يُخزّن المرسلون ذوو UUID فقط (من `sourceUuid`) كـ `uuid:<id>` في `channels.signal.allowFrom`.

المجموعات:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- يتحكم `channels.signal.groupAllowFrom` في المجموعات أو المرسلين الذين يمكنهم تشغيل ردود المجموعات عند ضبط `allowlist`؛ يمكن أن تكون الإدخالات معرّفات مجموعات Signal (خام، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام هواتف المرسلين، أو قيم `uuid:<id>`، أو `*`.
- يمكن لـ `channels.signal.groups["<group-id>" | "*"]` تجاوز سلوك المجموعة باستخدام `requireMention` و`tools` و`toolsBySender`.
- استخدم `channels.signal.accounts.<id>.groups` لتجاوزات كل حساب في إعدادات الحسابات المتعددة.
- لا يؤدي السماح بمجموعة Signal عبر `groupAllowFrom` إلى تعطيل بوابة الذكر بحد ذاته. يعالج إدخال `channels.signal.groups["<group-id>"]` مضبوط تحديدًا كل رسالة مجموعة ما لم يُضبط `requireMention=true`.
- ملاحظة وقت التشغيل: إذا كان `channels.signal` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

## كيف يعمل (السلوك)

- الوضع الأصلي: يعمل `signal-cli` كـ daemon؛ يقرأ Gateway الأحداث عبر SSE.
- وضع الحاوية: يرسل Gateway عبر REST API ويستقبل عبر WebSocket.
- تُطبّع الرسائل الواردة إلى مغلف القناة المشترك.
- تُوجّه الردود دائمًا إلى الرقم أو المجموعة نفسها.

## الوسائط + الحدود

- يُقسّم النص الصادر إلى `channels.signal.textChunkLimit` (الافتراضي 4000).
- تقسيم اختياري حسب السطر الجديد: اضبط `channels.signal.chunkMode="newline"` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- المرفقات مدعومة (base64 مجلوب من `signal-cli`).
- تستخدم مرفقات الملاحظات الصوتية اسم ملف `signal-cli` كبديل MIME عندما يكون `contentType` مفقودًا، بحيث يظل بإمكان نسخ الصوت تصنيف مذكرات AAC الصوتية.
- الحد الافتراضي للوسائط: `channels.signal.mediaMaxMb` (الافتراضي 8).
- استخدم `channels.signal.ignoreAttachments` لتخطي تنزيل الوسائط.
- يستخدم سياق سجل المجموعة `channels.signal.historyLimit` (أو `channels.signal.accounts.*.historyLimit`)، مع الرجوع إلى `messages.groupChat.historyLimit`. اضبطه على `0` للتعطيل (الافتراضي 50).

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: يرسل OpenClaw إشارات الكتابة عبر `signal-cli sendTyping` ويحدّثها أثناء تشغيل الرد.
- **إيصالات القراءة**: عندما تكون `channels.signal.sendReadReceipts` مضبوطة على true، يمرّر OpenClaw إيصالات القراءة للرسائل المباشرة المسموح بها.
- لا يوفّر signal-cli إيصالات القراءة للمجموعات.

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=signal`.
- الأهداف: مرسل بصيغة E.164 أو UUID (استخدم `uuid:<id>` من مخرجات الإقران؛ يعمل UUID المجرّد أيضًا).
- `messageId` هو الطابع الزمني في Signal للرسالة التي تتفاعل معها.
- تتطلب تفاعلات المجموعات `targetAuthor` أو `targetAuthorUuid`.

أمثلة:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

الإعدادات:

- `channels.signal.actions.reactions`: تفعيل/تعطيل إجراءات التفاعل (الافتراضي true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - يعطّل `off`/`ack` تفاعلات الوكيل (ستفشل أداة الرسائل `react` بخطأ).
  - يفعّل `minimal`/`extensive` تفاعلات الوكيل ويضبط مستوى الإرشاد.
- تجاوزات لكل حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## تفاعلات الموافقة

تستخدم مطالبات موافقة تنفيذ Signal وPlugin كتل التوجيه العليا `approvals.exec` و
`approvals.plugin`. لا يملك Signal كتلة
`channels.signal.execApprovals`.

- يوافق `👍` مرة واحدة.
- يرفض `👎`.
- استخدم `/approve <id> allow-always` عندما يوفّر الطلب موافقة مستمرة.

يتطلب حل تفاعل الموافقة موافقين صريحين من Signal عبر
`channels.signal.allowFrom` أو `channels.signal.defaultTo` أو الحقول المطابقة على مستوى الحساب.
لا تزال مطالبات موافقة التنفيذ المباشرة في المحادثة نفسها قادرة على منع بديل `/approve` المحلي المكرر
من دون موافقين صريحين؛ أما موافقات المجموعات بلا موافقين فتبقي البديل المحلي ظاهرًا.

## أهداف التسليم (CLI/cron)

- الرسائل المباشرة: `signal:+15551234567` (أو E.164 عادي).
- الرسائل المباشرة عبر UUID: `uuid:<id>` (أو UUID مجرّد).
- المجموعات: `signal:group:<groupId>`.
- أسماء المستخدمين: `username:<name>` (إذا كان حساب Signal لديك يدعم ذلك).

## استكشاف الأخطاء وإصلاحها

شغّل هذا التسلسل أولًا:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ثم أكّد حالة إقران الرسائل المباشرة عند الحاجة:

```bash
openclaw pairing list signal
```

الأعطال الشائعة:

- يمكن الوصول إلى الخادم الخفي لكن لا توجد ردود: تحقق من إعدادات الحساب/الخادم الخفي (`httpUrl`، `account`) ووضع الاستلام.
- يتم تجاهل الرسائل المباشرة: المرسل في انتظار موافقة الإقران.
- يتم تجاهل رسائل المجموعة: بوابات مرسل المجموعة/الإشارة تمنع التسليم.
- أخطاء تحقق الإعدادات بعد التعديلات: شغّل `openclaw doctor --fix`.
- Signal مفقود من التشخيصات: تأكد من `channels.signal.enabled: true`.

فحوصات إضافية:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

لتدفق الفرز: [/channels/troubleshooting](/ar/channels/troubleshooting).

## ملاحظات الأمان

- يخزّن `signal-cli` مفاتيح الحساب محليًا (عادةً في `~/.local/share/signal-cli/data/`).
- انسخ حالة حساب Signal احتياطيًا قبل ترحيل الخادم أو إعادة بنائه.
- أبقِ `channels.signal.dmPolicy: "pairing"` ما لم تكن تريد صراحةً وصولًا أوسع إلى الرسائل المباشرة.
- لا يلزم تحقق SMS إلا لتدفقات التسجيل أو الاسترداد، لكن فقدان التحكم في الرقم/الحساب قد يعقّد إعادة التسجيل.

## مرجع الإعدادات (Signal)

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.signal.enabled`: تفعيل/تعطيل بدء القناة.
- `channels.signal.apiMode`: `auto | native | container` (الافتراضي: auto). راجع [وضع الحاوية](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 لحساب البوت.
- `channels.signal.cliPath`: المسار إلى `signal-cli`.
- `channels.signal.configPath`: دليل `signal-cli --config` اختياري.
- `channels.signal.httpUrl`: عنوان URL الكامل للخادم الخفي (يتجاوز المضيف/المنفذ).
- `channels.signal.httpHost`، `channels.signal.httpPort`: ربط الخادم الخفي (الافتراضي 127.0.0.1:8080).
- `channels.signal.autoStart`: تشغيل الخادم الخفي تلقائيًا (الافتراضي true إذا لم تُضبط `httpUrl`).
- `channels.signal.startupTimeoutMs`: مهلة انتظار بدء التشغيل بالمللي ثانية (الحد الأقصى 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: تخطي تنزيلات المرفقات.
- `channels.signal.ignoreStories`: تجاهل القصص من الخادم الخفي.
- `channels.signal.sendReadReceipts`: تمرير إيصالات القراءة.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.signal.allowFrom`: قائمة سماح للرسائل المباشرة (E.164 أو `uuid:<id>`). يتطلب `open` القيمة `"*"`. لا يملك Signal أسماء مستخدمين؛ استخدم معرّفات الهاتف/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.signal.groupAllowFrom`: قائمة سماح للمجموعات؛ تقبل معرّفات مجموعات Signal (خام، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام مرسلين بصيغة E.164، أو قيم `uuid:<id>`.
- `channels.signal.groups`: تجاوزات لكل مجموعة مفهرسة بمعرّف مجموعة Signal (أو `"*"`). الحقول المدعومة: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخة لكل حساب من `channels.signal.groups` لإعدادات الحسابات المتعددة.
- `channels.signal.historyLimit`: الحد الأقصى لرسائل المجموعة التي تُضمّن كسياق (0 يعطّل ذلك).
- `channels.signal.dmHistoryLimit`: حد سجل الرسائل المباشرة في أدوار المستخدم. تجاوزات لكل مستخدم: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: حجم مقطع الإرسال الصادر (أحرف).
- `channels.signal.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.signal.mediaMaxMb`: حد الوسائط الواردة/الصادرة (MB).

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (لا يدعم Signal الإشارات الأصلية).
- `messages.groupChat.mentionPatterns` (بديل عام).
- `messages.responsePrefix`.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
