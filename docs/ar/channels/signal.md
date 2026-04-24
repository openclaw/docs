---
read_when:
    - إعداد دعم Signal
    - تصحيح أخطاء الإرسال/الاستقبال في Signal
summary: دعم Signal عبر signal-cli ‏(JSON-RPC + SSE)، ومسارات الإعداد، ونموذج الأرقام
title: Signal
x-i18n:
    generated_at: "2026-04-24T07:31:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8fb4f08f8607dbe923fdc24d9599623165e1f1268c7fc48ecb457ce3d61172d2
    source_path: channels/signal.md
    workflow: 15
---

# Signal (`signal-cli`)

الحالة: تكامل CLI خارجي. يتواصل Gateway مع `signal-cli` عبر HTTP JSON-RPC + SSE.

## المتطلبات المسبقة

- تثبيت OpenClaw على خادمك (تم اختبار تدفق Linux أدناه على Ubuntu 24).
- توفر `signal-cli` على المضيف الذي يعمل عليه gateway.
- رقم هاتف يمكنه استقبال رسالة SMS واحدة للتحقق (لمسار التسجيل عبر SMS).
- وصول إلى المتصفح من أجل captcha الخاصة بـ Signal (`signalcaptchas.org`) أثناء التسجيل.

## الإعداد السريع (للمبتدئين)

1. استخدم **رقم Signal منفصلًا** للبوت (موصى به).
2. ثبّت `signal-cli` (يتطلب Java إذا كنت تستخدم إصدار JVM).
3. اختر أحد مساري الإعداد:
   - **المسار A (ربط QR):** `signal-cli link -n "OpenClaw"` ثم امسح الرمز باستخدام Signal.
   - **المسار B (تسجيل SMS):** سجّل رقمًا مخصصًا باستخدام captcha + التحقق عبر SMS.
4. اضبط OpenClaw وأعد تشغيل gateway.
5. أرسل أول رسالة مباشرة ووافق على الاقتران (`openclaw pairing approve signal <CODE>`).

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

| الحقل       | الوصف                                              |
| ----------- | -------------------------------------------------- |
| `account`   | رقم هاتف البوت بصيغة E.164 (`+15551234567`)        |
| `cliPath`   | المسار إلى `signal-cli` (`signal-cli` إذا كان على `PATH`) |
| `dmPolicy`  | سياسة الوصول إلى الرسائل المباشرة (`pairing` موصى بها) |
| `allowFrom` | أرقام هواتف أو قيم `uuid:<id>` مسموح لها بإرسال رسائل مباشرة |

## ما هو

- قناة Signal عبر `signal-cli` (وليس libsignal مضمّنًا).
- توجيه حتمي: تعود الردود دائمًا إلى Signal.
- تشارك الرسائل المباشرة الجلسة الرئيسية للوكيل؛ أما المجموعات فمعزولة (`agent:<agentId>:signal:group:<groupId>`).

## عمليات كتابة الإعدادات

افتراضيًا، يُسمح لـ Signal بكتابة تحديثات الإعدادات التي يتم تشغيلها بواسطة `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك عبر:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## نموذج الأرقام (مهم)

- يتصل gateway بـ **جهاز** Signal (حساب `signal-cli`).
- إذا شغّلت البوت على **حساب Signal الشخصي** الخاص بك، فسيتجاهل رسائلك أنت نفسك (حماية من الحلقات).
- للحصول على سلوك "أرسل رسالة إلى البوت فيرد عليّ"، استخدم **رقم بوت منفصلًا**.

## مسار الإعداد A: ربط حساب Signal موجود (QR)

1. ثبّت `signal-cli` (إصدار JVM أو الإصدار الأصلي).
2. اربط حساب بوت:
   - `signal-cli link -n "OpenClaw"` ثم امسح QR داخل Signal.
3. اضبط Signal وابدأ gateway.

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

دعم الحسابات المتعددة: استخدم `channels.signal.accounts` مع إعدادات لكل حساب و`name` اختياري. راجع [`gateway/configuration`](/ar/gateway/config-channels#multi-account-all-channels) لمعرفة النمط المشترك.

## مسار الإعداد B: تسجيل رقم بوت مخصص (SMS، Linux)

استخدم هذا عندما تريد رقم بوت مخصصًا بدلًا من ربط حساب تطبيق Signal موجود.

1. احصل على رقم يمكنه استقبال SMS (أو تحقق صوتي للخطوط الأرضية).
   - استخدم رقم بوت مخصصًا لتجنب تعارضات الحساب/الجلسة.
2. ثبّت `signal-cli` على مضيف gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

إذا كنت تستخدم إصدار JVM (`signal-cli-${VERSION}.tar.gz`)، فثبّت JRE 25+ أولًا.
احرص على تحديث `signal-cli`؛ إذ تشير ملاحظات المنبع إلى أن الإصدارات القديمة قد تتعطل مع تغير واجهات Signal server البرمجية.

3. سجّل الرقم وتحقق منه:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

إذا كانت captcha مطلوبة:

1. افتح `https://signalcaptchas.org/registration/generate.html`.
2. أكمل captcha، ثم انسخ هدف الرابط `signalcaptcha://...` من "Open Signal".
3. شغّل من عنوان IP خارجي نفسه الخاص بجلسة المتصفح عندما يكون ذلك ممكنًا.
4. شغّل التسجيل مرة أخرى فورًا (تنتهي صلاحية رموز captcha بسرعة):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. اضبط OpenClaw، وأعد تشغيل gateway، وتحقق من القناة:

```bash
# إذا كنت تشغّل gateway كخدمة systemd للمستخدم:
systemctl --user restart openclaw-gateway.service

# ثم تحقّق:
openclaw doctor
openclaw channels status --probe
```

5. اقترن مع مرسل الرسائل المباشرة الخاص بك:
   - أرسل أي رسالة إلى رقم البوت.
   - وافق على الرمز على الخادم: `openclaw pairing approve signal <PAIRING_CODE>`.
   - احفظ رقم البوت كجهة اتصال على هاتفك لتجنب ظهور "Unknown contact".

مهم: قد يؤدي تسجيل حساب رقم هاتف باستخدام `signal-cli` إلى إلغاء مصادقة جلسة تطبيق Signal الرئيسية لذلك الرقم. فضّل استخدام رقم بوت مخصص، أو استخدم وضع الربط عبر QR إذا كنت تحتاج إلى الاحتفاظ بإعداد تطبيق الهاتف الحالي.

مراجع المنبع:

- README الخاص بـ `signal-cli`: `https://github.com/AsamK/signal-cli`
- تدفق captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- تدفق الربط: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## وضع daemon الخارجي (`httpUrl`)

إذا كنت تريد إدارة `signal-cli` بنفسك (برود JVM البطيء عند البدء، أو تهيئة الحاوية، أو مشاركة CPU)، فشغّل daemon بشكل منفصل ووجّه OpenClaw إليه:

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

هذا يتجاوز التشغيل التلقائي ومدة انتظار البدء داخل OpenClaw. وعند بطء البدء مع التشغيل التلقائي، اضبط `channels.signal.startupTimeoutMs`.

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

الرسائل المباشرة:

- الافتراضي: `channels.signal.dmPolicy = "pairing"`.
- يحصل المرسلون غير المعروفين على رمز اقتران؛ ويتم تجاهل الرسائل حتى تتم الموافقة عليها (تنتهي صلاحية الرموز بعد ساعة واحدة).
- الموافقة عبر:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- الاقتران هو تبادل الرمز الافتراضي للرسائل المباشرة في Signal. التفاصيل: [الاقتران](/ar/channels/pairing)
- يُخزَّن المرسلون الذين لديهم UUID فقط (من `sourceUuid`) على شكل `uuid:<id>` في `channels.signal.allowFrom`.

المجموعات:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- يتحكم `channels.signal.groupAllowFrom` في من يمكنه التفعيل داخل المجموعات عندما يكون `allowlist` مضبوطًا.
- يمكن لـ `channels.signal.groups["<group-id>" | "*"]` تجاوز سلوك المجموعة عبر `requireMention` و`tools` و`toolsBySender`.
- استخدم `channels.signal.accounts.<id>.groups` للتجاوزات الخاصة بكل حساب في إعدادات الحسابات المتعددة.
- ملاحظة وقت التشغيل: إذا كان `channels.signal` مفقودًا بالكامل، فإن وقت التشغيل يعود إلى `groupPolicy="allowlist"` لعمليات التحقق من المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

## كيف يعمل (السلوك)

- يعمل `signal-cli` كـ daemon؛ ويقرأ gateway الأحداث عبر SSE.
- تُطبَّع الرسائل الواردة داخل الغلاف المشترك للقنوات.
- تُوجَّه الردود دائمًا إلى الرقم أو المجموعة نفسها.

## الوسائط + الحدود

- يُجزَّأ النص الصادر إلى `channels.signal.textChunkLimit` (الافتراضي 4000).
- تجزئة اختيارية حسب الأسطر الجديدة: اضبط `channels.signal.chunkMode="newline"` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التجزئة حسب الطول.
- المرفقات مدعومة (base64 يتم جلبها من `signal-cli`).
- الحد الافتراضي للوسائط: `channels.signal.mediaMaxMb` (الافتراضي 8).
- استخدم `channels.signal.ignoreAttachments` لتخطي تنزيل الوسائط.
- يستخدم سياق سجل المجموعات `channels.signal.historyLimit` (أو `channels.signal.accounts.*.historyLimit`)، مع رجوع احتياطي إلى `messages.groupChat.historyLimit`. اضبطه إلى `0` للتعطيل (الافتراضي 50).

## مؤشرات الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: يرسل OpenClaw إشارات الكتابة عبر `signal-cli sendTyping` ويجدّدها أثناء تشغيل الرد.
- **إيصالات القراءة**: عندما يكون `channels.signal.sendReadReceipts` مضبوطًا على true، يمرر OpenClaw إيصالات القراءة للرسائل المباشرة المسموح بها.
- لا يكشف Signal-cli عن إيصالات القراءة للمجموعات.

## التفاعلات (أداة message)

- استخدم `message action=react` مع `channel=signal`.
- الأهداف: E.164 للمرسل أو UUID (استخدم `uuid:<id>` من مخرجات الاقتران؛ كما يعمل UUID العاري أيضًا).
- `messageId` هو الطابع الزمني في Signal للرسالة التي تتفاعل معها.
- تتطلب تفاعلات المجموعات `targetAuthor` أو `targetAuthorUuid`.

أمثلة:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

الإعدادات:

- `channels.signal.actions.reactions`: تمكين/تعطيل إجراءات التفاعل (الافتراضي true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - يقوم `off`/`ack` بتعطيل تفاعلات الوكيل (ستُرجع أداة `react` في message خطأ).
  - يقوم `minimal`/`extensive` بتمكين تفاعلات الوكيل ويضبط مستوى الإرشاد.
- تجاوزات لكل حساب: `channels.signal.accounts.<id>.actions.reactions`، و`channels.signal.accounts.<id>.reactionLevel`.

## أهداف التسليم (CLI/Cron)

- الرسائل المباشرة: `signal:+15551234567` (أو E.164 عادي).
- الرسائل المباشرة عبر UUID: ‏`uuid:<id>` (أو UUID عارٍ).
- المجموعات: `signal:group:<groupId>`.
- أسماء المستخدمين: `username:<name>` (إذا كانت مدعومة من حساب Signal الخاص بك).

## استكشاف الأخطاء وإصلاحها

شغّل هذا التسلسل أولًا:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ثم أكد حالة اقتران الرسائل المباشرة إذا لزم الأمر:

```bash
openclaw pairing list signal
```

الأعطال الشائعة:

- يمكن الوصول إلى daemon ولكن لا توجد ردود: تحقّق من إعدادات الحساب/daemon (`httpUrl`، `account`) ووضع الاستقبال.
- يتم تجاهل الرسائل المباشرة: المرسل بانتظار الموافقة على الاقتران.
- يتم تجاهل رسائل المجموعات: تقييد مرسل المجموعة/الإشارات يمنع التسليم.
- أخطاء التحقق من الإعدادات بعد التعديلات: شغّل `openclaw doctor --fix`.
- Signal مفقود من التشخيصات: تأكد من `channels.signal.enabled: true`.

فحوصات إضافية:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

لتدفق الفرز: [/channels/troubleshooting](/ar/channels/troubleshooting).

## ملاحظات الأمان

- يخزن `signal-cli` مفاتيح الحساب محليًا (عادة في `~/.local/share/signal-cli/data/`).
- انسخ حالة حساب Signal احتياطيًا قبل ترحيل الخادم أو إعادة بنائه.
- أبقِ `channels.signal.dmPolicy: "pairing"` ما لم تكن تريد صراحة وصولًا أوسع للرسائل المباشرة.
- لا يلزم التحقق عبر SMS إلا لعمليات التسجيل أو الاسترداد، لكن فقدان التحكم في الرقم/الحساب قد يعقّد إعادة التسجيل.

## مرجع الإعدادات (Signal)

الإعداد الكامل: [الإعدادات](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.signal.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.signal.account`: صيغة E.164 لحساب البوت.
- `channels.signal.cliPath`: المسار إلى `signal-cli`.
- `channels.signal.httpUrl`: عنوان URL الكامل للـ daemon (يتجاوز host/port).
- `channels.signal.httpHost`، `channels.signal.httpPort`: ربط daemon (الافتراضي 127.0.0.1:8080).
- `channels.signal.autoStart`: تشغيل daemon تلقائيًا (الافتراضي true إذا لم يتم تعيين `httpUrl`).
- `channels.signal.startupTimeoutMs`: مهلة انتظار بدء التشغيل بالمللي ثانية (الحد الأقصى 120000).
- `channels.signal.receiveMode`: ‏`on-start | manual`.
- `channels.signal.ignoreAttachments`: تخطي تنزيلات المرفقات.
- `channels.signal.ignoreStories`: تجاهل القصص من الـ daemon.
- `channels.signal.sendReadReceipts`: تمرير إيصالات القراءة.
- `channels.signal.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.signal.allowFrom`: allowlist للرسائل المباشرة (E.164 أو `uuid:<id>`). يتطلب `open` القيمة `"*"`. لا يدعم Signal أسماء المستخدمين؛ استخدم معرّفات الهاتف/UUID.
- `channels.signal.groupPolicy`: ‏`open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.signal.groupAllowFrom`: allowlist مرسلي المجموعات.
- `channels.signal.groups`: تجاوزات لكل مجموعة مفاتيحها معرّف مجموعة Signal (أو `"*"`). الحقول المدعومة: `requireMention` و`tools` و`toolsBySender`.
- `channels.signal.accounts.<id>.groups`: النسخة الخاصة بكل حساب من `channels.signal.groups` لإعدادات الحسابات المتعددة.
- `channels.signal.historyLimit`: الحد الأقصى لرسائل المجموعات التي تُضمَّن كسياق (يعطّلها 0).
- `channels.signal.dmHistoryLimit`: حد سجل الرسائل المباشرة بوحدات أدوار المستخدم. التجاوزات لكل مستخدم: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: حجم تجزئة الرسائل الصادرة (أحرف).
- `channels.signal.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التجزئة حسب الطول.
- `channels.signal.mediaMaxMb`: الحد الأقصى للوسائط الواردة/الصادرة (MB).

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (لا يدعم Signal الإشارات الأصلية).
- `messages.groupChat.mentionPatterns` (الرجوع الاحتياطي العام).
- `messages.responsePrefix`.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
