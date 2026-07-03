---
read_when:
    - إعداد دعم Signal
    - تصحيح أخطاء إرسال/استقبال Signal
summary: دعم Signal عبر signal-cli (الخادم الأصلي أو حاوية bbernhard)، ومسارات الإعداد، ونموذج الرقم
title: Signal
x-i18n:
    generated_at: "2026-07-03T15:29:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

الحالة: تكامل CLI خارجي. يتواصل Gateway مع `signal-cli` عبر HTTP — إما عفريت أصلي (JSON-RPC + SSE) أو حاوية bbernhard/signal-cli-rest-api (REST + WebSocket).

## المتطلبات الأساسية

- تثبيت OpenClaw على خادمك (تم اختبار مسار Linux أدناه على Ubuntu 24).
- واحد مما يلي:
  - توفر `signal-cli` على المضيف (الوضع الأصلي)، **أو**
  - حاوية Docker باسم `bbernhard/signal-cli-rest-api` (وضع الحاوية).
- رقم هاتف يمكنه تلقي رسالة SMS واحدة للتحقق (لمسار التسجيل عبر SMS).
- وصول عبر المتصفح لكابتشا Signal (`signalcaptchas.org`) أثناء التسجيل.

## الإعداد السريع (للمبتدئين)

1. استخدم **رقم Signal منفصلا** للبوت (موصى به).
2. ثبّت Plugin الخاص بـ OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. ثبّت `signal-cli` (يتطلب Java إذا استخدمت بناء JVM).
4. اختر مسار إعداد واحدا:
   - **المسار أ (ربط QR):** `signal-cli link -n "OpenClaw"` ثم امسح الرمز باستخدام Signal.
   - **المسار ب (تسجيل SMS):** سجّل رقما مخصصا باستخدام كابتشا + تحقق SMS.
5. اضبط OpenClaw وأعد تشغيل Gateway.
6. أرسل رسالة خاصة أولى ووافق على الاقتران (`openclaw pairing approve signal <CODE>`).

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

| الحقل        | الوصف                                                    |
| ------------ | -------------------------------------------------------- |
| `account`    | رقم هاتف البوت بتنسيق E.164 (`+15551234567`)             |
| `cliPath`    | المسار إلى `signal-cli` (`signal-cli` إذا كان على `PATH`) |
| `configPath` | دليل إعدادات signal-cli الممرر كـ `--config`             |
| `dmPolicy`   | سياسة الوصول للرسائل الخاصة (يوصى بـ `pairing`)          |
| `allowFrom`  | أرقام الهاتف أو قيم `uuid:<id>` المسموح لها بإرسال رسائل خاصة |

## ما هو

- قناة Signal عبر `signal-cli` (وليس libsignal مضمن).
- توجيه حتمي: تعود الردود دائما إلى Signal.
- تشارك الرسائل الخاصة جلسة الوكيل الرئيسية؛ المجموعات معزولة (`agent:<agentId>:signal:group:<groupId>`).

## عمليات كتابة الإعدادات

افتراضيا، يسمح لـ Signal بكتابة تحديثات الإعدادات التي تشغّلها `/config set|unset` (تتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## نموذج الرقم (مهم)

- يتصل Gateway بـ **جهاز Signal** (حساب `signal-cli`).
- إذا شغّلت البوت على **حساب Signal الشخصي الخاص بك**، فسيتجاهل رسائلك أنت (حماية من الحلقة).
- من أجل "أراسل البوت فيرد"، استخدم **رقم بوت منفصلا**.

## مسار الإعداد أ: ربط حساب Signal موجود (QR)

1. ثبّت `signal-cli` (بناء JVM أو البناء الأصلي).
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

دعم الحسابات المتعددة: استخدم `channels.signal.accounts` مع إعداد لكل حساب و`name` اختياري. راجع [`gateway/configuration`](/ar/gateway/config-channels#multi-account-all-channels) للنمط المشترك.

## مسار الإعداد ب: تسجيل رقم بوت مخصص (SMS، Linux)

استخدم هذا عندما تريد رقم بوت مخصصا بدلا من ربط حساب تطبيق Signal موجود.

1. احصل على رقم يمكنه تلقي SMS (أو تحقق صوتي للخطوط الأرضية).
   - استخدم رقم بوت مخصصا لتجنب تعارضات الحساب/الجلسة.
2. ثبّت `signal-cli` على مضيف Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

إذا استخدمت بناء JVM (`signal-cli-${VERSION}.tar.gz`)، فثبّت JRE 25+ أولا.
حافظ على تحديث `signal-cli`؛ تشير ملاحظات المنبع إلى أن الإصدارات القديمة قد تتعطل مع تغير واجهات API الخاصة بخادم Signal.

3. سجّل الرقم وتحقق منه:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

إذا كانت الكابتشا مطلوبة:

1. افتح `https://signalcaptchas.org/registration/generate.html`.
2. أكمل الكابتشا، وانسخ هدف الرابط `signalcaptcha://...` من "Open Signal".
3. شغّل الأمر من عنوان IP الخارجي نفسه لجلسة المتصفح عندما يكون ذلك ممكنا.
4. شغّل التسجيل مرة أخرى فورا (تنتهي صلاحية رموز الكابتشا بسرعة):

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

5. اقرن مرسل الرسائل الخاصة لديك:
   - أرسل أي رسالة إلى رقم البوت.
   - وافق على الرمز على الخادم: `openclaw pairing approve signal <PAIRING_CODE>`.
   - احفظ رقم البوت كجهة اتصال على هاتفك لتجنب "Unknown contact".

<Warning>
قد يؤدي تسجيل حساب رقم هاتف باستخدام `signal-cli` إلى إلغاء مصادقة جلسة تطبيق Signal الرئيسية لذلك الرقم. فضّل استخدام رقم بوت مخصص، أو استخدم وضع ربط QR إذا كنت بحاجة إلى الاحتفاظ بإعداد تطبيق الهاتف الحالي.
</Warning>

مراجع المنبع:

- README الخاص بـ `signal-cli`: `https://github.com/AsamK/signal-cli`
- تدفق الكابتشا: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- تدفق الربط: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## وضع العفريت الخارجي (httpUrl)

إذا أردت إدارة `signal-cli` بنفسك (بدايات JVM الباردة البطيئة، أو تهيئة الحاوية، أو وحدات CPU المشتركة)، فشغّل العفريت بشكل منفصل ووجّه OpenClaw إليه:

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

يتجاوز هذا التشغيل التلقائي والانتظار عند بدء التشغيل داخل OpenClaw. للبدايات البطيئة عند التشغيل التلقائي، اضبط `channels.signal.startupTimeoutMs`.

## وضع الحاوية (bbernhard/signal-cli-rest-api)

بدلا من تشغيل `signal-cli` محليا، يمكنك استخدام حاوية Docker المسماة [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). يغلّف هذا `signal-cli` خلف واجهة REST API وواجهة WebSocket.

المتطلبات:

- **يجب** تشغيل الحاوية باستخدام `MODE=json-rpc` لتلقي الرسائل في الوقت الفعلي.
- سجّل حساب Signal الخاص بك أو اربطه داخل الحاوية قبل توصيل OpenClaw.

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

| القيمة        | السلوك                                                                                |
| ------------- | ------------------------------------------------------------------------------------- |
| `"auto"`      | (افتراضي) يفحص كلا النقلين؛ يتحقق البث من تلقي WebSocket للحاوية                      |
| `"native"`    | يفرض signal-cli الأصلي (JSON-RPC عند `/api/v1/rpc`، وSSE عند `/api/v1/events`)        |
| `"container"` | يفرض حاوية bbernhard (REST عند `/v2/send`، وWebSocket عند `/v1/receive/{account}`)    |

عندما يكون `apiMode` هو `"auto"`، يخزّن OpenClaw الوضع المكتشف مؤقتا لمدة 30 ثانية لتجنب الفحوصات المتكررة. لا يتم اختيار تلقي الحاوية للبث إلا بعد ترقية `/v1/receive/{account}` إلى WebSocket، وهذا يتطلب `MODE=json-rpc`.

يدعم وضع الحاوية عمليات قناة Signal نفسها مثل الوضع الأصلي حيث تعرض الحاوية واجهات API مطابقة: الإرسال، والتلقي، والمرفقات، ومؤشرات الكتابة، وإيصالات القراءة/العرض، والتفاعلات، والمجموعات، والنص المنسق. يترجم OpenClaw استدعاءات RPC الأصلية الخاصة بـ Signal إلى حمولات REST الخاصة بالحاوية، بما في ذلك معرفات المجموعات `group.{base64(internal_id)}` و`text_mode: "styled"` للنص المنسق.

ملاحظات تشغيلية:

- استخدم `autoStart: false` مع وضع الحاوية. يجب ألا يشغّل OpenClaw عفريتا أصليا عند اختيار `apiMode: "container"`.
- استخدم `MODE=json-rpc` للتلقي. قد يجعل `MODE=normal` المسار `/v1/about` يبدو سليما، لكن `/v1/receive/{account}` لا يترقى إلى WebSocket، لذلك لن يختار OpenClaw بث تلقي الحاوية في وضع `auto`.
- اضبط `apiMode: "container"` عندما تعلم أن `httpUrl` يشير إلى REST API الخاص بـ bbernhard. اضبط `apiMode: "native"` عندما تعلم أنه يشير إلى JSON-RPC/SSE الأصلي لـ `signal-cli`. استخدم `"auto"` عندما قد يختلف النشر.
- تلتزم تنزيلات مرفقات الحاوية بحدود بايتات الوسائط نفسها في الوضع الأصلي. يتم رفض الاستجابات الأكبر من الحد قبل تخزينها مؤقتا بالكامل عندما يرسل الخادم `Content-Length`، وإلا أثناء البث.

## التحكم في الوصول (الرسائل الخاصة + المجموعات)

الرسائل الخاصة:

- الافتراضي: `channels.signal.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ يتم تجاهل الرسائل حتى تتم الموافقة عليها (تنتهي صلاحية الرموز بعد ساعة واحدة).
- الموافقة عبر:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- الاقتران هو تبادل الرمز الافتراضي لرسائل Signal الخاصة. التفاصيل: [الاقتران](/ar/channels/pairing)
- يتم تخزين المرسلين ذوي UUID فقط (من `sourceUuid`) كـ `uuid:<id>` في `channels.signal.allowFrom`.

المجموعات:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- يتحكم `channels.signal.groupAllowFrom` في المجموعات أو المرسلين الذين يمكنهم تشغيل ردود المجموعات عند تعيين `allowlist`؛ يمكن أن تكون الإدخالات معرفات مجموعات Signal (خام، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام هواتف المرسلين، أو قيم `uuid:<id>`، أو `*`.
- يمكن لـ `channels.signal.groups["<group-id>" | "*"]` تجاوز سلوك المجموعة باستخدام `requireMention` و`tools` و`toolsBySender`.
- استخدم `channels.signal.accounts.<id>.groups` لتجاوزات كل حساب في إعدادات الحسابات المتعددة.
- لا يؤدي السماح لمجموعة Signal عبر `groupAllowFrom` إلى تعطيل بوابة الإشارة إليها بحد ذاته. يعالج إدخال `channels.signal.groups["<group-id>"]` المكوّن تحديدا كل رسالة مجموعة ما لم يتم تعيين `requireMention=true`.
- ملاحظة وقت التشغيل: إذا كان `channels.signal` مفقودا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعة (حتى إذا تم تعيين `channels.defaults.groupPolicy`).

## كيف يعمل (السلوك)

- الوضع الأصلي: يعمل `signal-cli` كعفريت؛ يقرأ Gateway الأحداث عبر SSE.
- وضع الحاوية: يرسل Gateway عبر REST API ويتلقى عبر WebSocket.
- يتم تطبيع الرسائل الواردة إلى غلاف القناة المشترك.
- تعود الردود دائما إلى الرقم أو المجموعة نفسها.

## الوسائط + الحدود

- يتم تقسيم النص الصادر إلى `channels.signal.textChunkLimit` (الافتراضي 4000).
- تقسيم اختياري حسب الأسطر الجديدة: اضبط `channels.signal.chunkMode="newline"` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- المرفقات مدعومة (يتم جلب base64 من `signal-cli`).
- تستخدم مرفقات الملاحظات الصوتية اسم ملف `signal-cli` كبديل MIME عند فقدان `contentType`، بحيث يظل بإمكان نسخ الصوت تصنيف مذكرات AAC الصوتية.
- حد الوسائط الافتراضي: `channels.signal.mediaMaxMb` (الافتراضي 8).
- استخدم `channels.signal.ignoreAttachments` لتخطي تنزيل الوسائط.
- يستخدم سياق سجل المجموعة `channels.signal.historyLimit` (أو `channels.signal.accounts.*.historyLimit`)، مع الرجوع إلى `messages.groupChat.historyLimit`. عيّن `0` للتعطيل (الافتراضي 50).

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: يرسل OpenClaw إشارات الكتابة عبر `signal-cli sendTyping` ويحدّثها أثناء تشغيل الرد.
- **إيصالات القراءة**: عندما تكون `channels.signal.sendReadReceipts` مفعّلة، يمرّر OpenClaw إيصالات القراءة للرسائل المباشرة المسموح بها.
- لا يوفّر Signal-cli إيصالات قراءة للمجموعات.

## تفاعلات حالة دورة الحياة

اضبط `messages.statusReactions.enabled: true` للسماح لـ Signal بإظهار دورة حياة التفاعل المشتركة
للوضع في قائمة الانتظار/التفكير/الأداة/Compaction/الإنهاء/الخطأ على الأدوار الواردة.
يستخدم Signal الطابع الزمني للرسالة الواردة كهدف للتفاعل؛ وترسل تفاعلات
المجموعات باستخدام معرّف مجموعة Signal بالإضافة إلى المرسل الأصلي باعتباره
المؤلف الهدف.

تتطلب تفاعلات الحالة أيضا تفاعل إقرار ونطاقا مطابقا
`messages.ackReactionScope` (`direct` أو `group-all` أو `group-mentions` أو `all`).
اضبط `channels.signal.reactionLevel: "off"` لتعطيل تفاعلات حالة Signal.
يبقى إجراء أداة الرسائل `react` أكثر صرامة: إذ يتطلب
`reactionLevel: "minimal"` أو `"extensive"`.

يمسح `messages.removeAckAfterReply: true` تفاعل الحالة النهائي بعد
مدة الاحتفاظ المضبوطة. وإلا يستعيد Signal تفاعل الإقرار الأولي بعد
حالة الإنهاء/الخطأ النهائية.

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=signal`.
- الأهداف: المرسل بصيغة E.164 أو UUID (استخدم `uuid:<id>` من مخرجات الاقتران؛ يعمل UUID العاري أيضا).
- `messageId` هو الطابع الزمني في Signal للرسالة التي تتفاعل معها.
- تتطلب تفاعلات المجموعات `targetAuthor` أو `targetAuthorUuid`.

أمثلة:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

الإعدادات:

- `channels.signal.actions.reactions`: تفعيل/تعطيل إجراءات التفاعل (القيمة الافتراضية true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - يعطل `off`/`ack` تفاعلات الوكيل (ستفشل أداة الرسائل `react` بخطأ).
  - يفعّل `minimal`/`extensive` تفاعلات الوكيل ويضبط مستوى الإرشاد.
- تجاوزات لكل حساب: `channels.signal.accounts.<id>.actions.reactions`، `channels.signal.accounts.<id>.reactionLevel`.

## تفاعلات الموافقة

تستخدم مطالبات موافقة التنفيذ وPlugin في Signal كتل التوجيه العليا `approvals.exec` و
`approvals.plugin`. لا يحتوي Signal على كتلة
`channels.signal.execApprovals`.

- `👍` يوافق مرة واحدة.
- `👎` يرفض.
- استخدم `/approve <id> allow-always` عندما يقدّم الطلب موافقة دائمة.

يتطلب حل تفاعل الموافقة موافقين صريحين من Signal من
`channels.signal.allowFrom` أو `channels.signal.defaultTo` أو الحقول المطابقة على مستوى الحساب.
لا تزال مطالبات موافقة التنفيذ المباشرة في المحادثة نفسها قادرة على منع بديل `/approve` المحلي المكرر
دون موافقين صريحين؛ بينما تبقي موافقات المجموعات بلا موافقين البديل المحلي مرئيا.

## أهداف التسليم (CLI/Cron)

- الرسائل المباشرة: `signal:+15551234567` (أو E.164 عادي).
- رسائل UUID المباشرة: `uuid:<id>` (أو UUID عار).
- المجموعات: `signal:group:<groupId>`.
- أسماء المستخدمين: `username:<name>` (إذا كان حساب Signal لديك يدعم ذلك).

## الأسماء المستعارة

اضبط الأسماء المستعارة عندما تريد أسماء ثابتة لأهداف Signal المتكررة.
الأسماء المستعارة هي إعدادات من جهة OpenClaw فقط؛ ولا تنشئ جهات اتصال Signal ولا تعدّلها.

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

استخدم الأسماء المستعارة في أي مكان تقبل فيه أهداف تسليم Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

ترث الأسماء المستعارة لكل حساب الأسماء المستعارة العليا ويمكنها إضافة الأسماء أو تجاوزها:

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

يعرض `openclaw directory peers list --channel signal` و
`openclaw directory groups list --channel signal` الأسماء المستعارة المضبوطة. دليل
Signal مستند إلى الإعدادات؛ ولا يستعلم مباشرة عن جهات اتصال Signal أو
يعدّل حساب Signal.

## استكشاف الأخطاء وإصلاحها

شغّل هذا التسلسل أولا:

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

الإخفاقات الشائعة:

- يمكن الوصول إلى الخدمة الخفية لكن لا توجد ردود: تحقق من إعدادات الحساب/الخدمة الخفية (`httpUrl`، `account`) ووضع الاستلام.
- تم تجاهل الرسائل المباشرة: المرسل ينتظر موافقة الاقتران.
- تم تجاهل رسائل المجموعة: تمنع بوابات مرسل المجموعة/الإشارة التسليم.
- أخطاء التحقق من الإعدادات بعد التعديلات: شغّل `openclaw doctor --fix`.
- Signal غير موجود في التشخيصات: تأكد من `channels.signal.enabled: true`.

فحوصات إضافية:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

لتدفق الفرز: [/channels/troubleshooting](/ar/channels/troubleshooting).

## ملاحظات الأمان

- يخزن `signal-cli` مفاتيح الحساب محليا (عادة في `~/.local/share/signal-cli/data/`).
- انسخ حالة حساب Signal احتياطيا قبل ترحيل الخادم أو إعادة بنائه.
- أبق `channels.signal.dmPolicy: "pairing"` ما لم تكن تريد صراحة وصولا أوسع للرسائل المباشرة.
- لا يلزم التحقق عبر SMS إلا لتدفقات التسجيل أو الاسترداد، لكن فقدان التحكم في الرقم/الحساب قد يعقّد إعادة التسجيل.

## مرجع الإعدادات (Signal)

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.signal.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.signal.apiMode`: `auto | native | container` (الافتراضي: auto). راجع [وضع الحاوية](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 لحساب الروبوت.
- `channels.signal.cliPath`: المسار إلى `signal-cli`.
- `channels.signal.configPath`: دليل `signal-cli --config` اختياري.
- `channels.signal.httpUrl`: عنوان URL كامل للخدمة الخفية (يتجاوز المضيف/المنفذ).
- `channels.signal.httpHost`، `channels.signal.httpPort`: ربط الخدمة الخفية (الافتراضي 127.0.0.1:8080).
- `channels.signal.autoStart`: تشغيل الخدمة الخفية تلقائيا (الافتراضي true إذا لم يتم ضبط `httpUrl`).
- `channels.signal.startupTimeoutMs`: مهلة انتظار بدء التشغيل بالمللي ثانية (الحد الأقصى 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: تخطي تنزيلات المرفقات.
- `channels.signal.ignoreStories`: تجاهل القصص من الخدمة الخفية.
- `channels.signal.sendReadReceipts`: تمرير إيصالات القراءة.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.signal.allowFrom`: قائمة سماح للرسائل المباشرة (E.164 أو `uuid:<id>`). يتطلب `open` القيمة `"*"`. لا يملك Signal أسماء مستخدمين؛ استخدم معرّفات الهاتف/UUID.
- `channels.signal.aliases`: أسماء مستعارة من جهة OpenClaw لأهداف تسليم الرسائل المباشرة أو المجموعات.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.signal.groupAllowFrom`: قائمة سماح للمجموعات؛ تقبل معرّفات مجموعات Signal (خام، أو `group:<id>`، أو `signal:group:<id>`)، أو أرقام المرسل بصيغة E.164، أو قيم `uuid:<id>`.
- `channels.signal.groups`: تجاوزات لكل مجموعة مفهرسة بمعرّف مجموعة Signal (أو `"*"`). الحقول المدعومة: `requireMention`، `tools`، `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: نسخة لكل حساب من `channels.signal.groups` لإعدادات متعددة الحسابات.
- `channels.signal.accounts.<id>.aliases`: أسماء مستعارة لكل حساب، مدمجة مع الأسماء المستعارة العليا.
- `channels.signal.historyLimit`: الحد الأقصى لرسائل المجموعة التي ستضمّن كسياق (0 يعطّلها).
- `channels.signal.dmHistoryLimit`: حد محفوظات الرسائل المباشرة بأدوار المستخدم. تجاوزات لكل مستخدم: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: حجم الجزء الصادر (بالحروف).
- `channels.signal.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.signal.mediaMaxMb`: حد الوسائط الواردة/الصادرة (MB).

خيارات عامة ذات صلة:

- `agents.list[].groupChat.mentionPatterns` (لا يدعم Signal الإشارات الأصلية).
- `messages.groupChat.mentionPatterns` (بديل عام).
- `messages.responsePrefix`.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك محادثة المجموعة وبوابات الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
