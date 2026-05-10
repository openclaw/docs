---
read_when:
    - إعداد دعم Signal
    - تصحيح أخطاء إرسال/استقبال Signal
summary: دعم Signal عبر signal-cli (عملية خدمية أصلية أو حاوية bbernhard)، ومسارات الإعداد، ونموذج الأرقام
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:24:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

الحالة: تكامل CLI خارجي. يتواصل Gateway مع `signal-cli` عبر HTTP — إما daemon أصلي (JSON-RPC + SSE) أو حاوية bbernhard/signal-cli-rest-api (REST + WebSocket).

## المتطلبات الأساسية

- تثبيت OpenClaw على خادمك (مسار Linux أدناه مختبر على Ubuntu 24).
- أحد الخيارين:
  - توفر `signal-cli` على المضيف (الوضع الأصلي)، **أو**
  - حاوية Docker باسم `bbernhard/signal-cli-rest-api` (وضع الحاوية).
- رقم هاتف يمكنه استقبال رسالة SMS واحدة للتحقق (لمسار التسجيل عبر SMS).
- وصول عبر المتصفح إلى اختبار captcha الخاص بـ Signal (`signalcaptchas.org`) أثناء التسجيل.

## الإعداد السريع (للمبتدئين)

1. استخدم **رقم Signal منفصلا** للبوت (موصى به).
2. ثبّت `signal-cli` (يتطلب Java إذا كنت تستخدم إصدار JVM).
3. اختر مسار إعداد واحدا:
   - **المسار A (ربط QR):** `signal-cli link -n "OpenClaw"` ثم امسح الرمز باستخدام Signal.
   - **المسار B (تسجيل SMS):** سجّل رقما مخصصا باستخدام captcha + تحقق SMS.
4. اضبط OpenClaw وأعد تشغيل Gateway.
5. أرسل رسالة مباشرة أولى ووافق على الاقتران (`openclaw pairing approve signal <CODE>`).

الحد الأدنى من الإعدادات:

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

| الحقل       | الوصف                                       |
| ----------- | ------------------------------------------------- |
| `account`   | رقم هاتف البوت بصيغة E.164 (`+15551234567`) |
| `cliPath`   | المسار إلى `signal-cli` (`signal-cli` إذا كان ضمن `PATH`)  |
| `dmPolicy`  | سياسة وصول الرسائل المباشرة (يوصى بـ `pairing`)          |
| `allowFrom` | أرقام الهاتف أو قيم `uuid:<id>` المسموح لها بإرسال رسائل مباشرة |

## ما هو

- قناة Signal عبر `signal-cli` (وليست libsignal مضمّنة).
- توجيه حتمي: تعود الردود دائما إلى Signal.
- تشارك الرسائل المباشرة الجلسة الرئيسية للوكيل؛ أما المجموعات فمعزولة (`agent:<agentId>:signal:group:<groupId>`).

## عمليات كتابة الإعدادات

افتراضيا، يُسمح لـ Signal بكتابة تحديثات الإعدادات التي يطلقها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## نموذج الرقم (مهم)

- يتصل Gateway بـ **جهاز Signal** (حساب `signal-cli`).
- إذا شغّلت البوت على **حساب Signal الشخصي لديك**، فسيتجاهل رسائلك أنت (حماية من الحلقات).
- من أجل "أراسل البوت فيرد"، استخدم **رقم بوت منفصلا**.

## مسار الإعداد A: ربط حساب Signal موجود (QR)

1. ثبّت `signal-cli` (إصدار JVM أو الإصدار الأصلي).
2. اربط حساب بوت:
   - `signal-cli link -n "OpenClaw"` ثم امسح رمز QR في Signal.
3. اضبط Signal وابدأ Gateway.

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

دعم تعدد الحسابات: استخدم `channels.signal.accounts` مع إعداد لكل حساب و`name` اختياري. راجع [`gateway/configuration`](/ar/gateway/config-channels#multi-account-all-channels) للنمط المشترك.

## مسار الإعداد B: تسجيل رقم بوت مخصص (SMS، Linux)

استخدم هذا عندما تريد رقم بوت مخصصا بدلا من ربط حساب تطبيق Signal موجود.

1. احصل على رقم يمكنه استقبال SMS (أو تحقق صوتي للخطوط الأرضية).
   - استخدم رقم بوت مخصصا لتجنب تعارضات الحساب/الجلسة.
2. ثبّت `signal-cli` على مضيف Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

إذا كنت تستخدم إصدار JVM (`signal-cli-${VERSION}.tar.gz`)، فثبّت JRE 25+ أولا.
حافظ على تحديث `signal-cli`؛ يذكر المنبع أن الإصدارات القديمة قد تتعطل مع تغير واجهات API لخادم Signal.

3. سجّل الرقم وتحقق منه:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

إذا كان captcha مطلوبا:

1. افتح `https://signalcaptchas.org/registration/generate.html`.
2. أكمل captcha، وانسخ هدف رابط `signalcaptcha://...` من "فتح Signal".
3. شغّل من عنوان IP الخارجي نفسه لجلسة المتصفح عندما يكون ذلك ممكنا.
4. شغّل التسجيل مرة أخرى فورا (تنتهي صلاحية رموز captcha بسرعة):

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

5. اقرن مرسل رسائلك المباشرة:
   - أرسل أي رسالة إلى رقم البوت.
   - وافق على الرمز على الخادم: `openclaw pairing approve signal <PAIRING_CODE>`.
   - احفظ رقم البوت كجهة اتصال على هاتفك لتجنب "جهة اتصال غير معروفة".

<Warning>
قد يؤدي تسجيل حساب رقم هاتف باستخدام `signal-cli` إلى إلغاء مصادقة جلسة تطبيق Signal الرئيسية لذلك الرقم. فضّل رقما مخصصا للبوت، أو استخدم وضع ربط QR إذا كنت تحتاج إلى إبقاء إعداد تطبيق الهاتف الحالي لديك.
</Warning>

مراجع المنبع:

- README لـ `signal-cli`: `https://github.com/AsamK/signal-cli`
- تدفق captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- تدفق الربط: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## وضع daemon الخارجي (httpUrl)

إذا كنت تريد إدارة `signal-cli` بنفسك (بدء JVM البارد البطيء، أو تهيئة الحاوية، أو وحدات CPU مشتركة)، فشغّل daemon بشكل منفصل ووجّه OpenClaw إليه:

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

يتجاوز هذا التشغيل التلقائي وانتظار بدء التشغيل داخل OpenClaw. لبدء التشغيل البطيء عند التشغيل التلقائي، اضبط `channels.signal.startupTimeoutMs`.

## وضع الحاوية (bbernhard/signal-cli-rest-api)

بدلا من تشغيل `signal-cli` محليا، يمكنك استخدام حاوية Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). تغلف هذه الحاوية `signal-cli` خلف واجهة REST API وواجهة WebSocket.

المتطلبات:

- **يجب** تشغيل الحاوية مع `MODE=json-rpc` لاستقبال الرسائل في الوقت الحقيقي.
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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

يتحكم الحقل `apiMode` في البروتوكول الذي يستخدمه OpenClaw:

| القيمة         | السلوك                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (الافتراضي) يفحص كلا النقلين؛ يتحقق البث من استقبال WebSocket في الحاوية    |
| `"native"`    | يفرض `signal-cli` الأصلي (JSON-RPC عند `/api/v1/rpc`، وSSE عند `/api/v1/events`)         |
| `"container"` | يفرض حاوية bbernhard (REST عند `/v2/send`، وWebSocket عند `/v1/receive/{account}`) |

عندما تكون قيمة `apiMode` هي `"auto"`، يخزن OpenClaw الوضع المكتشف مؤقتا لمدة 30 ثانية لتجنب الفحوصات المتكررة. لا يتم اختيار استقبال الحاوية للبث إلا بعد ترقية `/v1/receive/{account}` إلى WebSocket، وهذا يتطلب `MODE=json-rpc`.

يدعم وضع الحاوية عمليات قناة Signal نفسها مثل الوضع الأصلي حيث تعرض الحاوية واجهات API مطابقة: الإرسال، والاستقبال، والمرفقات، ومؤشرات الكتابة، وإيصالات القراءة/العرض، والتفاعلات، والمجموعات، والنص المنسق. يترجم OpenClaw استدعاءات Signal RPC الأصلية الخاصة به إلى حمولات REST الخاصة بالحاوية، بما في ذلك معرفات المجموعات `group.{base64(internal_id)}` و`text_mode: "styled"` للنص المنسق.

ملاحظات تشغيلية:

- استخدم `autoStart: false` مع وضع الحاوية. يجب ألا يشغّل OpenClaw daemon أصليا عند اختيار `apiMode: "container"`.
- استخدم `MODE=json-rpc` للاستقبال. قد يجعل `MODE=normal` المسار `/v1/about` يبدو سليما، لكن `/v1/receive/{account}` لا يترقى إلى WebSocket، لذلك لن يختار OpenClaw بث استقبال الحاوية في وضع `auto`.
- اضبط `apiMode: "container"` عندما تعرف أن `httpUrl` يشير إلى REST API الخاصة بـ bbernhard. اضبط `apiMode: "native"` عندما تعرف أنه يشير إلى JSON-RPC/SSE الأصلي لـ `signal-cli`. استخدم `"auto"` عندما قد يختلف النشر.
- تحترم تنزيلات مرفقات الحاوية حدود بايت الوسائط نفسها كما في الوضع الأصلي. تُرفض الاستجابات كبيرة الحجم قبل تخزينها بالكامل في الذاكرة عندما يرسل الخادم `Content-Length`، وإلا فسيتم رفضها أثناء البث.

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

الرسائل المباشرة:

- الافتراضي: `channels.signal.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ يتم تجاهل الرسائل حتى تتم الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
- وافق عبر:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- الاقتران هو تبادل الرمز الافتراضي لرسائل Signal المباشرة. التفاصيل: [الاقتران](/ar/channels/pairing)
- يتم تخزين المرسلين ذوي UUID فقط (من `sourceUuid`) بصيغة `uuid:<id>` في `channels.signal.allowFrom`.

المجموعات:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- يتحكم `channels.signal.groupAllowFrom` في المجموعات أو المرسلين الذين يمكنهم تشغيل ردود المجموعة عند تعيين `allowlist`؛ يمكن أن تكون الإدخالات معرفات مجموعات Signal (خام، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام هواتف المرسلين، أو قيم `uuid:<id>`، أو `*`.
- يمكن أن يتجاوز `channels.signal.groups["<group-id>" | "*"]` سلوك المجموعة باستخدام `requireMention` و`tools` و`toolsBySender`.
- استخدم `channels.signal.accounts.<id>.groups` للتجاوزات لكل حساب في إعدادات متعددة الحسابات.
- لا يؤدي إدراج مجموعة Signal في قائمة السماح عبر `groupAllowFrom` إلى تعطيل بوابة الإشارة بحد ذاته. يعالج إدخال `channels.signal.groups["<group-id>"]` المهيأ تحديدا كل رسالة مجموعة ما لم يتم تعيين `requireMention=true`.
- ملاحظة وقت التشغيل: إذا كان `channels.signal` مفقودا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا تم تعيين `channels.defaults.groupPolicy`).

## كيف يعمل (السلوك)

- الوضع الأصلي: يعمل `signal-cli` كـ daemon؛ يقرأ Gateway الأحداث عبر SSE.
- وضع الحاوية: يرسل Gateway عبر REST API ويستقبل عبر WebSocket.
- تتم تسوية الرسائل الواردة إلى غلاف القناة المشترك.
- تعود الردود دائما إلى الرقم أو المجموعة نفسها.

## الوسائط + الحدود

- يتم تقسيم النص الصادر إلى `channels.signal.textChunkLimit` (الافتراضي 4000).
- التقسيم الاختياري على الأسطر الجديدة: اضبط `channels.signal.chunkMode="newline"` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- المرفقات مدعومة (يتم جلب base64 من `signal-cli`).
- تستخدم مرفقات الملاحظات الصوتية اسم ملف `signal-cli` كبديل MIME عندما يكون `contentType` مفقودا، بحيث يظل بإمكان نسخ الصوت تصنيف مذكرات AAC الصوتية.
- حد الوسائط الافتراضي: `channels.signal.mediaMaxMb` (الافتراضي 8).
- استخدم `channels.signal.ignoreAttachments` لتخطي تنزيل الوسائط.
- يستخدم سياق سجل المجموعة `channels.signal.historyLimit` (أو `channels.signal.accounts.*.historyLimit`)، مع الرجوع إلى `messages.groupChat.historyLimit`. عيّن `0` للتعطيل (الافتراضي 50).

## مؤشرات الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: يرسل OpenClaw إشارات الكتابة عبر `signal-cli sendTyping` ويحدثها أثناء تشغيل الرد.
- **إيصالات القراءة**: عندما تكون `channels.signal.sendReadReceipts` صحيحة، يمرر OpenClaw إيصالات القراءة للرسائل المباشرة المسموح بها.
- لا يعرض signal-cli إيصالات القراءة للمجموعات.

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=signal`.
- الأهداف: رقم E.164 للمرسِل أو UUID (استخدم `uuid:<id>` من مخرجات الاقتران؛ يعمل UUID المجرد أيضًا).
- `messageId` هو طابع Signal الزمني للرسالة التي تتفاعل معها.
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
  - يعطّل `off`/`ack` تفاعلات الوكيل (ستُرجع أداة الرسائل `react` خطأ).
  - يفعّل `minimal`/`extensive` تفاعلات الوكيل ويضبط مستوى الإرشاد.
- تجاوزات لكل حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## أهداف التسليم (CLI/Cron)

- الرسائل المباشرة: `signal:+15551234567` (أو E.164 عادي).
- الرسائل المباشرة عبر UUID: `uuid:<id>` (أو UUID مجرد).
- المجموعات: `signal:group:<groupId>`.
- أسماء المستخدمين: `username:<name>` (إذا كان حساب Signal الخاص بك يدعم ذلك).

## استكشاف الأخطاء وإصلاحها

شغّل هذا التسلسل أولًا:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ثم أكّد حالة اقتران الرسائل المباشرة إذا لزم الأمر:

```bash
openclaw pairing list signal
```

الإخفاقات الشائعة:

- يمكن الوصول إلى الخدمة الخفية لكن لا توجد ردود: تحقق من إعدادات الحساب/الخدمة الخفية (`httpUrl`، `account`) ووضع الاستلام.
- يتم تجاهل الرسائل المباشرة: المرسِل ينتظر موافقة الاقتران.
- يتم تجاهل رسائل المجموعات: بوابة مرسِل المجموعة/الإشارة تمنع التسليم.
- أخطاء التحقق من الإعدادات بعد التعديلات: شغّل `openclaw doctor --fix`.
- Signal غير موجود في التشخيصات: تأكد من `channels.signal.enabled: true`.

فحوص إضافية:

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
- التحقق عبر SMS مطلوب فقط لتدفقات التسجيل أو الاسترداد، لكن فقدان التحكم في الرقم/الحساب يمكن أن يعقّد إعادة التسجيل.

## مرجع الإعدادات (Signal)

الإعداد الكامل: [الإعدادات](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.signal.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.signal.apiMode`: `auto | native | container` (الافتراضي: auto). راجع [وضع الحاوية](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 لحساب الروبوت.
- `channels.signal.cliPath`: المسار إلى `signal-cli`.
- `channels.signal.httpUrl`: عنوان URL الكامل للخدمة الخفية (يتجاوز المضيف/المنفذ).
- `channels.signal.httpHost`، `channels.signal.httpPort`: ربط الخدمة الخفية (الافتراضي 127.0.0.1:8080).
- `channels.signal.autoStart`: تشغيل الخدمة الخفية تلقائيًا (الافتراضي true إذا لم تُضبط `httpUrl`).
- `channels.signal.startupTimeoutMs`: مهلة انتظار بدء التشغيل بالمللي ثانية (الحد الأقصى 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: تخطي تنزيلات المرفقات.
- `channels.signal.ignoreStories`: تجاهل القصص من الخدمة الخفية.
- `channels.signal.sendReadReceipts`: تمرير إيصالات القراءة.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.signal.allowFrom`: قائمة السماح للرسائل المباشرة (E.164 أو `uuid:<id>`). يتطلب `open` القيمة `"*"`. لا يحتوي Signal على أسماء مستخدمين؛ استخدم معرّفات الهاتف/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.signal.groupAllowFrom`: قائمة السماح للمجموعات؛ تقبل معرّفات مجموعات Signal (خام، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام E.164 للمرسلين، أو قيم `uuid:<id>`.
- `channels.signal.groups`: تجاوزات لكل مجموعة مفهرسة بمعرّف مجموعة Signal (أو `"*"`). الحقول المدعومة: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخة لكل حساب من `channels.signal.groups` لإعدادات متعددة الحسابات.
- `channels.signal.historyLimit`: الحد الأقصى لرسائل المجموعة التي تُضمَّن كسياق (0 يعطّل ذلك).
- `channels.signal.dmHistoryLimit`: حد سجل الرسائل المباشرة في أدوار المستخدم. تجاوزات لكل مستخدم: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: حجم الجزء الصادر (بالأحرف).
- `channels.signal.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.signal.mediaMaxMb`: حد الوسائط الواردة/الصادرة (MB).

خيارات عامة ذات صلة:

- `agents.list[].groupChat.mentionPatterns` (لا يدعم Signal الإشارات الأصلية).
- `messages.groupChat.mentionPatterns` (احتياطي عام).
- `messages.responsePrefix`.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
