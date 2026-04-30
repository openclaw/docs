---
read_when:
    - إعداد دعم Signal
    - تصحيح أخطاء الإرسال/الاستقبال في Signal
summary: دعم Signal عبر signal-cli (JSON-RPC + SSE)، ومسارات الإعداد، ونموذج الرقم
title: Signal
x-i18n:
    generated_at: "2026-04-30T07:43:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d450454550a86cbf0e2b7231bb149f78275a756517db1f20d7a07e3d298febee
    source_path: channels/signal.md
    workflow: 16
---

الحالة: تكامل CLI خارجي. يتواصل Gateway مع `signal-cli` عبر HTTP JSON-RPC + SSE.

## المتطلبات الأساسية

- تثبيت OpenClaw على خادمك (تدفق Linux أدناه اختُبر على Ubuntu 24).
- توفر `signal-cli` على المضيف الذي يعمل عليه Gateway.
- رقم هاتف يمكنه تلقي رسالة تحقق SMS واحدة (لمسار التسجيل عبر SMS).
- وصول إلى المتصفح من أجل كابتشا Signal (`signalcaptchas.org`) أثناء التسجيل.

## الإعداد السريع (للمبتدئين)

1. استخدم **رقم Signal منفصلاً** للبوت (موصى به).
2. ثبّت `signal-cli` (يتطلب Java إذا كنت تستخدم بناء JVM).
3. اختر مسار إعداد واحداً:
   - **المسار أ (ربط QR):** `signal-cli link -n "OpenClaw"` ثم امسح الرمز باستخدام Signal.
   - **المسار ب (تسجيل SMS):** سجّل رقماً مخصصاً مع كابتشا + تحقق SMS.
4. اضبط OpenClaw وأعد تشغيل Gateway.
5. أرسل أول رسالة مباشرة ووافق على الاقتران (`openclaw pairing approve signal <CODE>`).

التكوين الأدنى:

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
| `account`   | رقم هاتف البوت بتنسيق E.164 (`+15551234567`) |
| `cliPath`   | المسار إلى `signal-cli` (`signal-cli` إذا كان ضمن `PATH`)  |
| `dmPolicy`  | سياسة وصول الرسائل المباشرة (`pairing` موصى به)          |
| `allowFrom` | أرقام الهاتف أو قيم `uuid:<id>` المسموح لها بإرسال رسائل مباشرة |

## ما هو

- قناة Signal عبر `signal-cli` (وليست libsignal مضمّنة).
- توجيه حتمي: تعود الردود دائماً إلى Signal.
- تشارك الرسائل المباشرة الجلسة الرئيسية للوكيل؛ أما المجموعات فهي معزولة (`agent:<agentId>:signal:group:<groupId>`).

## عمليات كتابة التكوين

افتراضياً، يُسمح لـ Signal بكتابة تحديثات التكوين التي تُشغّلها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## نموذج الرقم (مهم)

- يتصل Gateway بـ **جهاز Signal** (حساب `signal-cli`).
- إذا شغّلت البوت على **حساب Signal الشخصي الخاص بك**، فسيتجاهل رسائلك أنت (حماية من الحلقة).
- من أجل "أرسل رسالة نصية إلى البوت فيرد"، استخدم **رقم بوت منفصلاً**.

## مسار الإعداد أ: ربط حساب Signal قائم (QR)

1. ثبّت `signal-cli` (بناء JVM أو البناء الأصلي).
2. اربط حساب بوت:
   - `signal-cli link -n "OpenClaw"` ثم امسح QR في Signal.
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

دعم الحسابات المتعددة: استخدم `channels.signal.accounts` مع تكوين لكل حساب و`name` اختياري. راجع [`gateway/configuration`](/ar/gateway/config-channels#multi-account-all-channels) للنمط المشترك.

## مسار الإعداد ب: تسجيل رقم بوت مخصص (SMS، Linux)

استخدم هذا عندما تريد رقم بوت مخصصاً بدلاً من ربط حساب تطبيق Signal قائم.

1. احصل على رقم يمكنه تلقي SMS (أو تحقق صوتي للخطوط الأرضية).
   - استخدم رقم بوت مخصصاً لتجنب تعارضات الحساب/الجلسة.
2. ثبّت `signal-cli` على مضيف Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

إذا كنت تستخدم بناء JVM (`signal-cli-${VERSION}.tar.gz`)، فثبّت JRE 25+ أولاً.
حافظ على تحديث `signal-cli`؛ تشير المصادر الأصلية إلى أن الإصدارات القديمة قد تتعطل مع تغيّر واجهات Signal API على الخادم.

3. سجّل الرقم وتحقق منه:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

إذا كانت الكابتشا مطلوبة:

1. افتح `https://signalcaptchas.org/registration/generate.html`.
2. أكمل الكابتشا، وانسخ هدف رابط `signalcaptcha://...` من "Open Signal".
3. شغّل من عنوان IP الخارجي نفسه الخاص بجلسة المتصفح عندما يكون ذلك ممكناً.
4. شغّل التسجيل مرة أخرى فوراً (تنتهي صلاحية رموز الكابتشا بسرعة):

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

5. قم بإقران مرسل الرسائل المباشرة لديك:
   - أرسل أي رسالة إلى رقم البوت.
   - وافق على الرمز على الخادم: `openclaw pairing approve signal <PAIRING_CODE>`.
   - احفظ رقم البوت كجهة اتصال على هاتفك لتجنب "جهة اتصال غير معروفة".

<Warning>
قد يؤدي تسجيل حساب رقم هاتف باستخدام `signal-cli` إلى إلغاء مصادقة جلسة تطبيق Signal الرئيسية لذلك الرقم. فضّل استخدام رقم بوت مخصص، أو استخدم وضع ربط QR إذا كنت بحاجة إلى إبقاء إعداد تطبيق الهاتف الحالي لديك.
</Warning>

مراجع المصادر الأصلية:

- ملف README الخاص بـ `signal-cli`: `https://github.com/AsamK/signal-cli`
- تدفق الكابتشا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- تدفق الربط: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## وضع العفريت الخارجي (httpUrl)

إذا كنت تريد إدارة `signal-cli` بنفسك (بدء JVM البارد البطيء، أو تهيئة الحاوية، أو وحدات CPU المشتركة)، فشغّل العفريت منفصلاً ووجّه OpenClaw إليه:

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

يتجاوز هذا التشغيل التلقائي والانتظار أثناء بدء التشغيل داخل OpenClaw. للبدايات البطيئة عند التشغيل التلقائي، عيّن `channels.signal.startupTimeoutMs`.

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

الرسائل المباشرة:

- الافتراضي: `channels.signal.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ تُتجاهل الرسائل حتى تتم الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
- وافق عبر:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- الاقتران هو تبادل الرمز الافتراضي لرسائل Signal المباشرة. التفاصيل: [الاقتران](/ar/channels/pairing)
- يُخزّن مرسلو UUID فقط (من `sourceUuid`) بصيغة `uuid:<id>` في `channels.signal.allowFrom`.

المجموعات:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- يتحكم `channels.signal.groupAllowFrom` في من يمكنه التشغيل في المجموعات عند ضبط `allowlist`.
- يمكن لـ `channels.signal.groups["<group-id>" | "*"]` تجاوز سلوك المجموعة باستخدام `requireMention` و`tools` و`toolsBySender`.
- استخدم `channels.signal.accounts.<id>.groups` لتجاوزات لكل حساب في إعدادات الحسابات المتعددة.
- ملاحظة وقت التشغيل: إذا كان `channels.signal` مفقوداً بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعة (حتى إذا كان `channels.defaults.groupPolicy` مضبوطاً).

## كيف يعمل (السلوك)

- يعمل `signal-cli` كعفريت؛ يقرأ Gateway الأحداث عبر SSE.
- تُطبّع الرسائل الواردة إلى مغلف القناة المشترك.
- تعود الردود دائماً إلى الرقم أو المجموعة نفسها.

## الوسائط + الحدود

- يُقسّم النص الصادر إلى `channels.signal.textChunkLimit` (الافتراضي 4000).
- تقسيم اختياري حسب السطر الجديد: عيّن `channels.signal.chunkMode="newline"` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- المرفقات مدعومة (base64 يُجلب من `signal-cli`).
- تستخدم مرفقات الملاحظات الصوتية اسم ملف `signal-cli` كبديل MIME عندما يكون `contentType` مفقوداً، بحيث يظل بإمكان نسخ الصوت تصنيف مذكرات AAC الصوتية.
- حد الوسائط الافتراضي: `channels.signal.mediaMaxMb` (الافتراضي 8).
- استخدم `channels.signal.ignoreAttachments` لتخطي تنزيل الوسائط.
- يستخدم سياق سجل المجموعة `channels.signal.historyLimit` (أو `channels.signal.accounts.*.historyLimit`)، مع الرجوع إلى `messages.groupChat.historyLimit`. عيّن `0` للتعطيل (الافتراضي 50).

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: يرسل OpenClaw إشارات كتابة عبر `signal-cli sendTyping` ويحدّثها أثناء تشغيل الرد.
- **إيصالات القراءة**: عندما تكون `channels.signal.sendReadReceipts` مساوية لـ true، يمرر OpenClaw إيصالات القراءة للرسائل المباشرة المسموح بها.
- لا يكشف signal-cli إيصالات القراءة للمجموعات.

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=signal`.
- الأهداف: E.164 الخاص بالمرسل أو UUID (استخدم `uuid:<id>` من مخرجات الاقتران؛ يعمل UUID المجرد أيضاً).
- `messageId` هو الطابع الزمني في Signal للرسالة التي تتفاعل معها.
- تتطلب تفاعلات المجموعة `targetAuthor` أو `targetAuthorUuid`.

أمثلة:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

التكوين:

- `channels.signal.actions.reactions`: تفعيل/تعطيل إجراءات التفاعل (الافتراضي true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - يعطّل `off`/`ack` تفاعلات الوكيل (ستُرجع أداة الرسائل `react` خطأ).
  - يفعّل `minimal`/`extensive` تفاعلات الوكيل ويضبط مستوى الإرشاد.
- تجاوزات لكل حساب: `channels.signal.accounts.<id>.actions.reactions` و`channels.signal.accounts.<id>.reactionLevel`.

## أهداف التسليم (CLI/cron)

- الرسائل المباشرة: `signal:+15551234567` (أو E.164 عادي).
- رسائل UUID المباشرة: `uuid:<id>` (أو UUID مجرد).
- المجموعات: `signal:group:<groupId>`.
- أسماء المستخدمين: `username:<name>` (إذا كان حساب Signal الخاص بك يدعم ذلك).

## استكشاف الأخطاء وإصلاحها

شغّل هذا التسلسل أولاً:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ثم أكّد حالة اقتران الرسائل المباشرة عند الحاجة:

```bash
openclaw pairing list signal
```

الأعطال الشائعة:

- العفريت قابل للوصول لكن لا توجد ردود: تحقق من إعدادات الحساب/العفريت (`httpUrl` و`account`) ووضع الاستقبال.
- الرسائل المباشرة متجاهلة: المرسل بانتظار الموافقة على الاقتران.
- رسائل المجموعة متجاهلة: بوابات مرسل المجموعة/الإشارة إليه تمنع التسليم.
- أخطاء التحقق من التكوين بعد التعديلات: شغّل `openclaw doctor --fix`.
- Signal مفقود من التشخيصات: أكّد `channels.signal.enabled: true`.

فحوصات إضافية:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

لتدفق الفرز: [/channels/troubleshooting](/ar/channels/troubleshooting).

## ملاحظات الأمان

- يخزن `signal-cli` مفاتيح الحساب محلياً (عادةً في `~/.local/share/signal-cli/data/`).
- انسخ حالة حساب Signal احتياطياً قبل ترحيل الخادم أو إعادة بنائه.
- أبقِ `channels.signal.dmPolicy: "pairing"` إلا إذا كنت تريد صراحةً وصولاً أوسع للرسائل المباشرة.
- لا يلزم تحقق SMS إلا لتدفقات التسجيل أو الاسترداد، لكن فقدان التحكم في الرقم/الحساب قد يعقّد إعادة التسجيل.

## مرجع التكوين (Signal)

التكوين الكامل: [التكوين](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.signal.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.signal.account`: صيغة E.164 لحساب البوت.
- `channels.signal.cliPath`: مسار `signal-cli`.
- `channels.signal.httpUrl`: عنوان URL الكامل للبرنامج الخفي (يتجاوز المضيف/المنفذ).
- `channels.signal.httpHost`, `channels.signal.httpPort`: ربط البرنامج الخفي (الافتراضي 127.0.0.1:8080).
- `channels.signal.autoStart`: تشغيل البرنامج الخفي تلقائيًا (الافتراضي true إذا لم يُضبط `httpUrl`).
- `channels.signal.startupTimeoutMs`: مهلة انتظار بدء التشغيل بالملي ثانية (حد أقصى 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: تخطي تنزيلات المرفقات.
- `channels.signal.ignoreStories`: تجاهل القصص من البرنامج الخفي.
- `channels.signal.sendReadReceipts`: تمرير إيصالات القراءة.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.signal.allowFrom`: قائمة السماح للرسائل المباشرة (E.164 أو `uuid:<id>`). يتطلب `open` القيمة `"*"`. لا يدعم Signal أسماء المستخدمين؛ استخدم معرّفات الهاتف/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.signal.groupAllowFrom`: قائمة السماح لمرسلي المجموعات.
- `channels.signal.groups`: تجاوزات لكل مجموعة مفهرسة حسب معرّف مجموعة Signal (أو `"*"`). الحقول المدعومة: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخة لكل حساب من `channels.signal.groups` لإعدادات الحسابات المتعددة.
- `channels.signal.historyLimit`: الحد الأقصى لرسائل المجموعة المراد تضمينها كسياق (0 يعطّل ذلك).
- `channels.signal.dmHistoryLimit`: حد سجل الرسائل المباشرة بعدد أدوار المستخدم. تجاوزات لكل مستخدم: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: حجم المقطع الصادر (أحرف).
- `channels.signal.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.signal.mediaMaxMb`: حد الوسائط الواردة/الصادرة (MB).

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (لا يدعم Signal الإشارات الأصلية).
- `messages.groupChat.mentionPatterns` (احتياطي عام).
- `messages.responsePrefix`.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
