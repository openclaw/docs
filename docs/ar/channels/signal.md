---
read_when:
    - إعداد دعم Signal
    - تصحيح أخطاء إرسال/استقبال Signal
summary: دعم Signal عبر signal-cli (JSON-RPC + SSE)، ومسارات الإعداد، ونموذج الأرقام
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

الحالة: تكامل CLI خارجي. يتواصل Gateway مع `signal-cli` عبر HTTP JSON-RPC + SSE.

## المتطلبات الأساسية

- تثبيت OpenClaw على خادمك (مسار Linux أدناه مُختبر على Ubuntu 24).
- توفر `signal-cli` على المضيف الذي يعمل عليه Gateway.
- رقم هاتف يمكنه استقبال رسالة تحقق نصية واحدة (لمسار التسجيل عبر الرسائل النصية).
- وصول إلى المتصفح لكابتشا Signal (`signalcaptchas.org`) أثناء التسجيل.

## الإعداد السريع (للمبتدئين)

1. استخدم **رقم Signal منفصلًا** للبوت (موصى به).
2. ثبّت `signal-cli` (Java مطلوبة إذا كنت تستخدم بنية JVM).
3. اختر أحد مساري الإعداد:
   - **المسار أ (ربط QR):** `signal-cli link -n "OpenClaw"` ثم امسح الرمز باستخدام Signal.
   - **المسار ب (تسجيل عبر الرسائل النصية):** سجّل رقمًا مخصصًا مع الكابتشا + التحقق عبر الرسائل النصية.
4. اضبط OpenClaw وأعد تشغيل Gateway.
5. أرسل رسالة مباشرة أولى ووافق على الاقتران (`openclaw pairing approve signal <CODE>`).

الحد الأدنى للإعداد:

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

- قناة Signal عبر `signal-cli` (وليست libsignal مضمنة).
- توجيه حتمي: تعود الردود دائمًا إلى Signal.
- تشارك الرسائل المباشرة جلسة الوكيل الرئيسية؛ أما المجموعات فمعزولة (`agent:<agentId>:signal:group:<groupId>`).

## كتابة الإعدادات

افتراضيًا، يُسمح لـ Signal بكتابة تحديثات الإعدادات التي تُشغّلها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## نموذج الرقم (مهم)

- يتصل Gateway بـ **جهاز Signal** (حساب `signal-cli`).
- إذا شغّلت البوت على **حساب Signal الشخصي الخاص بك**، فسيتجاهل رسائلك أنت (حماية من الحلقة).
- من أجل "أراسل البوت فيرد"، استخدم **رقم بوت منفصلًا**.

## مسار الإعداد أ: ربط حساب Signal موجود (QR)

1. ثبّت `signal-cli` (بنية JVM أو البنية الأصلية).
2. اربط حساب بوت:
   - `signal-cli link -n "OpenClaw"` ثم امسح QR في Signal.
3. اضبط Signal وابدأ تشغيل Gateway.

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

## مسار الإعداد ب: تسجيل رقم بوت مخصص (رسائل نصية، Linux)

استخدم هذا عندما تريد رقم بوت مخصصًا بدلًا من ربط حساب تطبيق Signal موجود.

1. احصل على رقم يمكنه استقبال الرسائل النصية (أو التحقق الصوتي للخطوط الأرضية).
   - استخدم رقم بوت مخصصًا لتجنب تعارضات الحساب/الجلسة.
2. ثبّت `signal-cli` على مضيف Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

إذا كنت تستخدم بنية JVM (`signal-cli-${VERSION}.tar.gz`)، فثبّت JRE 25+ أولًا.
حافظ على تحديث `signal-cli`؛ تشير ملاحظات المنبع إلى أن الإصدارات القديمة قد تتعطل مع تغير واجهات برمجة تطبيقات خادم Signal.

3. سجّل الرقم وتحقق منه:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

إذا كانت الكابتشا مطلوبة:

1. افتح `https://signalcaptchas.org/registration/generate.html`.
2. أكمل الكابتشا، وانسخ هدف رابط `signalcaptcha://...` من "Open Signal".
3. شغّل من عنوان IP الخارجي نفسه لجلسة المتصفح عندما يكون ذلك ممكنًا.
4. شغّل التسجيل مرة أخرى فورًا (تنتهي صلاحية رموز الكابتشا سريعًا):

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

5. أقرن مرسل رسالتك المباشرة:
   - أرسل أي رسالة إلى رقم البوت.
   - وافق على الرمز على الخادم: `openclaw pairing approve signal <PAIRING_CODE>`.
   - احفظ رقم البوت كجهة اتصال على هاتفك لتجنب "جهة اتصال غير معروفة".

<Warning>
قد يؤدي تسجيل حساب رقم هاتف باستخدام `signal-cli` إلى إلغاء مصادقة جلسة تطبيق Signal الرئيسية لذلك الرقم. يُفضّل استخدام رقم بوت مخصص، أو استخدام وضع الربط عبر QR إذا كنت بحاجة إلى الاحتفاظ بإعداد تطبيق الهاتف الحالي.
</Warning>

مراجع المنبع:

- ملف README الخاص بـ `signal-cli`: `https://github.com/AsamK/signal-cli`
- مسار الكابتشا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- مسار الربط: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## وضع البرنامج الخفي الخارجي (httpUrl)

إذا كنت تريد إدارة `signal-cli` بنفسك (بطء بدء JVM البارد، أو تهيئة الحاوية، أو وحدات المعالجة المركزية المشتركة)، فشغّل البرنامج الخفي بشكل منفصل ووجّه OpenClaw إليه:

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

يتجاوز هذا التشغيل التلقائي والانتظار عند بدء التشغيل داخل OpenClaw. للبدايات البطيئة عند التشغيل التلقائي، عيّن `channels.signal.startupTimeoutMs`.

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

الرسائل المباشرة:

- الافتراضي: `channels.signal.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ تُتجاهل الرسائل حتى تتم الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
- وافق عبر:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- الاقتران هو تبادل الرموز الافتراضي لرسائل Signal المباشرة. التفاصيل: [الاقتران](/ar/channels/pairing)
- يُخزّن المرسلون الذين لديهم UUID فقط (من `sourceUuid`) كـ `uuid:<id>` في `channels.signal.allowFrom`.

المجموعات:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- يتحكم `channels.signal.groupAllowFrom` في المجموعات أو المرسلين الذين يمكنهم تشغيل ردود المجموعة عند تعيين `allowlist`؛ يمكن أن تكون الإدخالات معرّفات مجموعات Signal (خام، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام هواتف المرسلين، أو قيم `uuid:<id>`، أو `*`.
- يمكن لـ `channels.signal.groups["<group-id>" | "*"]` تجاوز سلوك المجموعة باستخدام `requireMention` و`tools` و`toolsBySender`.
- استخدم `channels.signal.accounts.<id>.groups` للتجاوزات لكل حساب في إعدادات الحسابات المتعددة.
- لا يؤدي إدراج مجموعة Signal في قائمة السماح عبر `groupAllowFrom` إلى تعطيل بوابة الإشارة إليها بحد ذاته. يعالج إدخال `channels.signal.groups["<group-id>"]` المضبوط تحديدًا كل رسالة مجموعة ما لم يتم تعيين `requireMention=true`.
- ملاحظة وقت التشغيل: إذا كان `channels.signal` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعة (حتى إذا كان `channels.defaults.groupPolicy` معيّنًا).

## كيف يعمل (السلوك)

- يعمل `signal-cli` كبرنامج خفي؛ يقرأ Gateway الأحداث عبر SSE.
- تُوحّد الرسائل الواردة في غلاف القناة المشترك.
- تُوجّه الردود دائمًا إلى الرقم أو المجموعة نفسها.

## الوسائط + الحدود

- يُقسّم النص الصادر إلى `channels.signal.textChunkLimit` (الافتراضي 4000).
- تقسيم الأسطر الجديد اختياريًا: عيّن `channels.signal.chunkMode="newline"` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- المرفقات مدعومة (base64 يُجلب من `signal-cli`).
- تستخدم مرفقات الملاحظات الصوتية اسم ملف `signal-cli` كبديل MIME عند غياب `contentType`، بحيث يظل بإمكان نسخ الصوت تصنيف مذكرات AAC الصوتية.
- حد الوسائط الافتراضي: `channels.signal.mediaMaxMb` (الافتراضي 8).
- استخدم `channels.signal.ignoreAttachments` لتخطي تنزيل الوسائط.
- يستخدم سياق سجل المجموعة `channels.signal.historyLimit` (أو `channels.signal.accounts.*.historyLimit`)، مع الرجوع إلى `messages.groupChat.historyLimit`. عيّن `0` للتعطيل (الافتراضي 50).

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: يرسل OpenClaw إشارات الكتابة عبر `signal-cli sendTyping` ويحدّثها أثناء تشغيل الرد.
- **إيصالات القراءة**: عندما يكون `channels.signal.sendReadReceipts` صحيحًا، يمرر OpenClaw إيصالات القراءة للرسائل المباشرة المسموح بها.
- لا يعرض signal-cli إيصالات القراءة للمجموعات.

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=signal`.
- الأهداف: مرسل E.164 أو UUID (استخدم `uuid:<id>` من مخرجات الاقتران؛ يعمل UUID المجرد أيضًا).
- `messageId` هو طابع Signal الزمني للرسالة التي تتفاعل معها.
- تتطلب تفاعلات المجموعة `targetAuthor` أو `targetAuthorUuid`.

أمثلة:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

الإعدادات:

- `channels.signal.actions.reactions`: تمكين/تعطيل إجراءات التفاعل (الافتراضي true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - يعطّل `off`/`ack` تفاعلات الوكيل (ستُرجع أداة الرسائل `react` خطأ).
  - يمكّن `minimal`/`extensive` تفاعلات الوكيل ويضبط مستوى الإرشاد.
- تجاوزات لكل حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## أهداف التسليم (CLI/cron)

- الرسائل المباشرة: `signal:+15551234567` (أو E.164 عادي).
- رسائل UUID المباشرة: `uuid:<id>` (أو UUID مجرد).
- المجموعات: `signal:group:<groupId>`.
- أسماء المستخدمين: `username:<name>` (إذا كان حساب Signal الخاص بك يدعمها).

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

الإخفاقات الشائعة:

- البرنامج الخفي قابل للوصول لكن لا توجد ردود: تحقق من إعدادات الحساب/البرنامج الخفي (`httpUrl`، `account`) ووضع الاستقبال.
- الرسائل المباشرة متجاهلة: المرسل ينتظر موافقة الاقتران.
- رسائل المجموعة متجاهلة: بوابة مرسل المجموعة/الإشارة إليه تمنع التسليم.
- أخطاء التحقق من الإعدادات بعد التعديلات: شغّل `openclaw doctor --fix`.
- Signal مفقود من التشخيصات: تأكد من `channels.signal.enabled: true`.

فحوصات إضافية:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

لمسار الفرز: [/channels/troubleshooting](/ar/channels/troubleshooting).

## ملاحظات الأمان

- يخزن `signal-cli` مفاتيح الحساب محليًا (عادةً `~/.local/share/signal-cli/data/`).
- انسخ حالة حساب Signal احتياطيًا قبل ترحيل الخادم أو إعادة بنائه.
- أبقِ `channels.signal.dmPolicy: "pairing"` ما لم تكن تريد صراحةً وصولًا أوسع للرسائل المباشرة.
- لا يلزم التحقق عبر الرسائل النصية إلا لتدفقات التسجيل أو الاسترداد، لكن فقدان التحكم في الرقم/الحساب قد يعقّد إعادة التسجيل.

## مرجع الإعدادات (Signal)

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

خيارات الموفر:

- `channels.signal.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.signal.account`: صيغة E.164 لحساب الروبوت.
- `channels.signal.cliPath`: المسار إلى `signal-cli`.
- `channels.signal.httpUrl`: عنوان URL الكامل للعفريت (يتجاوز المضيف/المنفذ).
- `channels.signal.httpHost`, `channels.signal.httpPort`: ربط العفريت (الافتراضي 127.0.0.1:8080).
- `channels.signal.autoStart`: تشغيل العفريت تلقائيًا (الافتراضي true إذا لم يتم تعيين `httpUrl`).
- `channels.signal.startupTimeoutMs`: مهلة انتظار بدء التشغيل بالمللي ثانية (الحد الأقصى 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: تخطي تنزيلات المرفقات.
- `channels.signal.ignoreStories`: تجاهل القصص من العفريت.
- `channels.signal.sendReadReceipts`: تمرير إيصالات القراءة.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.signal.allowFrom`: قائمة السماح للرسائل المباشرة (E.164 أو `uuid:<id>`). يتطلب `open` القيمة `"*"`. لا يحتوي Signal على أسماء مستخدمين؛ استخدم معرفات الهاتف/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.signal.groupAllowFrom`: قائمة السماح للمجموعات؛ تقبل معرفات مجموعات Signal (الخام، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام المرسلين بصيغة E.164، أو قيم `uuid:<id>`.
- `channels.signal.groups`: تجاوزات لكل مجموعة مفهرسة بمعرف مجموعة Signal (أو `"*"`). الحقول المدعومة: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخة لكل حساب من `channels.signal.groups` لإعدادات الحسابات المتعددة.
- `channels.signal.historyLimit`: الحد الأقصى لرسائل المجموعة المراد تضمينها كسياق (0 يعطل ذلك).
- `channels.signal.dmHistoryLimit`: حد سجل الرسائل المباشرة بعدد أدوار المستخدم. تجاوزات لكل مستخدم: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: حجم الجزء الصادر (بالأحرف).
- `channels.signal.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.signal.mediaMaxMb`: حد الوسائط الواردة/الصادرة (MB).

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (لا يدعم Signal الإشارات الأصلية).
- `messages.groupChat.mentionPatterns` (البديل العام).
- `messages.responsePrefix`.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
