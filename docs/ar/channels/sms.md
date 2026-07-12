---
read_when:
    - تريد ربط OpenClaw بالرسائل النصية القصيرة عبر Twilio
    - تحتاج إلى إعداد Webhook للرسائل النصية القصيرة أو قائمة السماح
summary: إعداد قناة الرسائل النصية القصيرة عبر Twilio، وضوابط الوصول، وتهيئة Webhook
title: الرسائل النصية القصيرة
x-i18n:
    generated_at: "2026-07-12T05:35:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

يتلقى OpenClaw رسائل SMS ويرسلها عبر رقم هاتف Twilio أو Messaging Service. يسجّل Gateway مسار Webhook واردًا (الافتراضي `/webhooks/sms`)، ويتحقق افتراضيًا من توقيعات طلبات Twilio، ويرسل الردود عبر واجهة Messages API الخاصة بـ Twilio.

الحالة: Plugin رسمي، يُثبّت بشكل منفصل. نص فقط: لا يدعم MMS أو الوسائط، والرسائل المباشرة فقط.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية لرسائل SMS هي الاقتران.
  </Card>
  <Card title="أمان Gateway" icon="shield" href="/ar/gateway/security">
    راجع تعريض Webhook وضوابط وصول المرسلين.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    إجراءات التشخيص وأدلة الإصلاح المشتركة بين القنوات.
  </Card>
</CardGroup>

## قبل البدء

تحتاج إلى:

- تثبيت Plugin الرسمي لرسائل SMS باستخدام `openclaw plugins install @openclaw/sms`.
- حساب Twilio يتضمن رقم هاتف يدعم SMS، أو Twilio Messaging Service.
- معرّف حساب Twilio ‏SID ورمز المصادقة.
- عنوان URL عام يستخدم HTTPS ويصل إلى Gateway الخاص بـ OpenClaw.
- اختيار سياسة للمرسل: `pairing` (الافتراضية) للاستخدام الخاص، أو `allowlist` لأرقام الهواتف المعتمدة مسبقًا، أو `open` فقط لإتاحة وصول عام مقصود عبر SMS.

يمكن لرقم Twilio واحد خدمة كل من SMS و[المكالمات الصوتية](/ar/plugins/voice-call) إذا كان يدعم كلتا الإمكانيتين. يُضبط Webhook الخاص برسائل SMS وWebhook الخاص بالمكالمات الصوتية بصورة منفصلة في Twilio، ويستخدمان مسارين منفصلين في Gateway؛ تغطي هذه الصفحة Webhook الخاص برسائل SMS فقط.

## الإعداد السريع

<Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="أنشئ مرسلًا في Twilio أو اختر واحدًا">
    في Twilio، افتح **Phone Numbers > Manage > Active numbers** واختر رقمًا يدعم SMS. احفظ:

    - معرّف الحساب SID، مثل `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - رمز المصادقة
    - رقم هاتف المرسل، مثل `+15551234567`

    إذا كنت تستخدم Messaging Service بدلًا من رقم مرسل ثابت، فاحفظ معرّف Messaging Service ‏SID، مثل `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="اضبط قناة SMS">

احفظ هذا باسم `sms.patch.json5` وغيّر العناصر النائبة:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

طبّقه:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="وجّه Twilio إلى Webhook الخاص بـ Gateway">
    في إعدادات رقم الهاتف في Twilio، افتح **Messaging** واضبط **A message comes in** على:

```text
https://gateway.example.com/webhooks/sms
```

    استخدم طلب HTTP من النوع `POST`. المسار المحلي الافتراضي هو `/webhooks/sms`؛ غيّر `channels.sms.webhookPath` إذا كنت تحتاج إلى مسار مختلف.

  </Step>

  <Step title="اعرض مسار Webhook الخاص برسائل SMS بدقة">
    يجب أن يوجّه عنوان URL العام مسار SMS إلى عملية Gateway (المنفذ الافتراضي `18789`). إذا كنت تستخدم Tailscale Funnel للاختبار المحلي، فاعرض `/webhooks/sms` صراحةً:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    تستخدم المكالمات الصوتية ورسائل SMS مسارات Webhook منفصلة. إذا كان رقم Twilio نفسه يتولى كليهما، فاحتفظ بكلا المسارين مضبوطين في Twilio وفي النفق.

  </Step>

  <Step title="ابدأ Gateway ووافق على المرسل الأول">

```bash
openclaw gateway
```

أرسل رسالة نصية إلى رقم Twilio. تنشئ الرسالة الأولى طلب اقتران. وافق عليه:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>
</Steps>

## أمثلة الضبط

توجد جميع المفاتيح ضمن `channels.sms` (ولكل حساب ضمن `channels.sms.accounts.<id>`):

| المفتاح                                 | القيمة الافتراضية | الغرض                                                               |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`            | تمكين القناة/الحساب أو تعطيلهما.                                    |
| `accountSid`                            | —                 | معرّف حساب Twilio ‏SID ‏(`AC...`).                                  |
| `authToken`                             | —                 | رمز مصادقة Twilio؛ سلسلة نصية صريحة أو SecretRef.                   |
| `fromNumber`                            | —                 | رقم المرسل بتنسيق E.164.                                            |
| `messagingServiceSid`                   | —                 | معرّف Messaging Service ‏SID ‏(`MG...`) المستخدم عند تعذر تحديد `fromNumber`. |
| `defaultTo`                             | —                 | الوجهة الافتراضية عندما لا يتضمن تدفق الإرسال هدفًا صريحًا.         |
| `webhookPath`                           | `/webhooks/sms`   | مسار HTTP في Gateway لطلبات Webhook الواردة من Twilio.              |
| `publicWebhookUrl`                      | —                 | عنوان URL العام المضبوط في Twilio؛ مطلوب للتحقق من التوقيع.         |
| `dangerouslyDisableSignatureValidation` | `false`           | تخطي عمليات التحقق من `X-Twilio-Signature`؛ لاختبار النفق المحلي فقط. |
| `dmPolicy`                              | `"pairing"`       | `pairing` أو `allowlist` أو `open` أو `disabled`.                    |
| `allowFrom`                             | `[]`              | أرقام المرسلين المسموح بها بتنسيق E.164، أو `"*"` مع `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`            | الحد الأقصى لعدد الأحرف في كل جزء صادر من SMS.                       |
| `accounts`, `defaultAccount`            | —                 | خريطة الحسابات المتعددة ومعرّف الحساب الافتراضي.                    |

### ملف الضبط

استخدم الإعداد عبر ملف الضبط عندما تريد أن ينتقل تعريف القناة مع ضبط Gateway:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### متغيرات البيئة

تنطبق متغيرات البيئة على الحساب الافتراضي فقط؛ وتتقدم قيم الضبط على قيم متغيرات البيئة.

| المتغير                                         | يقابل                                              |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (الاسم البديل `TWILIO_SMS_FROM`) | `fromNumber`                                |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (مفصولة بفواصل)                        |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

ثم مكّن القناة في الضبط:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### رمز مصادقة SecretRef

يمكن أن يكون `authToken` من نوع SecretRef ‏(`source: "env" | "file" | "exec"`). استخدم هذا عندما يجب على Gateway جلب رمز مصادقة Twilio من وقت تشغيل أسرار OpenClaw بدلًا من تخزين ضبط بنص صريح:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

يجب أن يكون متغير البيئة أو موفّر الأسرار المشار إليه مرئيًا لوقت تشغيل Gateway. أعد تشغيل عمليات Gateway المُدارة بعد تغيير متغيرات بيئة المضيف.

### مرسل Messaging Service

استخدم `messagingServiceSid` بدلًا من `fromNumber` عندما ينبغي لـ Twilio اختيار المرسل عبر Messaging Service:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

إذا وُجد كل من `fromNumber` و`messagingServiceSid` بعد تحديد قيم الضبط ومتغيرات البيئة، فسيُستخدم `fromNumber`.

### الهدف الصادر الافتراضي

اضبط `defaultTo` عندما ينبغي لعمليات الأتمتة أو التسليم الذي يبدأه الوكيل استخدام وجهة افتراضية إذا لم يتضمن تدفق الإرسال هدفًا صريحًا:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## التحكم في الوصول

يتحكم `channels.sms.dmPolicy` في الوصول المباشر عبر SMS:

- `pairing` (الافتراضي): يحصل المرسلون غير المعروفين على رمز اقتران؛ وافق باستخدام `openclaw pairing approve sms <CODE>`.
- `allowlist`: لا تُعالج إلا رسائل المرسلين الموجودين في `allowFrom`. تؤدي قائمة `allowFrom` الفارغة إلى رفض كل مرسل (يسجّل Gateway تحذيرًا عند بدء التشغيل).
- `open`: يتطلب التحقق من صحة الضبط أن يتضمن `allowFrom` القيمة `"*"`. بدون حرف البدل، لا يمكن إلا للأرقام المدرجة بدء محادثة.
- `disabled`: تُسقط جميع الرسائل المباشرة الواردة.

يجب أن تكون إدخالات `allowFrom` أرقام هاتف بتنسيق E.164 مثل `+15551234567`. تُقبل البادئتان `sms:` و`twilio-sms:` وتُطبّعان. للمساعد الخاص، يُفضّل استخدام `dmPolicy: "allowlist"` مع أرقام هاتف صريحة:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## إرسال رسائل SMS

عند تحديد قناة SMS، تقبل الأهداف أرقام E.164 مجردة أو البادئة `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

عندما يكون اختيار القناة ضمنيًا، تحدد البادئة `twilio-sms:` هذه القناة دون الاستحواذ على بادئة الخدمة `sms:`، التي يستخدمها iMessage لاختيار تسليم SMS عبر شركة الاتصالات لأهدافه الخاصة:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

يتطلب CLI تحديد `--target` صراحةً. يُستخدم `defaultTo` لمسارات الأتمتة والتسليم الذي يبدأه الوكيل، حيث يمكن تحديد الهدف من ضبط القناة.

تعود ردود الوكيل على محادثات SMS الواردة تلقائيًا إلى المرسل عبر مرسل Twilio المضبوط.

يكون إخراج SMS نصًا عاديًا. يزيل OpenClaw تنسيق Markdown، ويسطّح كتل التعليمات البرمجية المسيّجة، ويعيد كتابة الروابط بالصيغة `label (url)`، ويقسّم الردود الطويلة إلى أجزاء لا يزيد كل منها على `textChunkLimit` حرفًا (الافتراضي 1500) قبل إرسالها عبر Twilio.

## التحقق من الإعداد

بعد بدء Gateway:

1. تأكد من أن سجل Gateway يعرض مسار Webhook الخاص بالرسائل النصية القصيرة.
2. نفّذ فحصًا من جانب Twilio (يتحقق من عنوان URL/طريقة Webhook المهيأة في Twilio ومن أخطاء الرسائل الواردة الحديثة):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. أرسل رسالة نصية قصيرة إلى رقم Twilio من هاتفك.
4. نفّذ `openclaw pairing list sms`.
5. وافق على رمز الاقتران باستخدام `openclaw pairing approve sms <CODE>`.
6. أرسل رسالة نصية قصيرة أخرى وتأكد من أن الوكيل يرد.

لاختبار الإرسال الصادر فقط، استخدم:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### اختبار شامل من طرف إلى طرف عبر iMessage/SMS على macOS

على جهاز Mac يمكنه إرسال رسائل SMS عبر شركة الاتصالات باستخدام Messages، يمكنك استخدام `imsg` للتحكم في جانب المرسل من دون لمس هاتفك:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

ينبغي أن تُنشئ الرسالة الأولى طلب اقتران. وينبغي أن تتلقى الرسالة الثانية رد الوكيل عبر Twilio.

## أمان Webhook

يتحقق OpenClaw افتراضيًا من `X-Twilio-Signature` باستخدام `publicWebhookUrl` و`authToken`. حافظ على تطابق جزء نقطة النهاية من `publicWebhookUrl` حرفيًا مع عنوان URL المهيأ في Twilio، بما في ذلك المخطط والمضيف والمسار وسلسلة الاستعلام. يستبعد OpenClaw أجزاء [تجاوز الاتصال](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) في Twilio‏ (`#...`) من حساب التوقيع، وفقًا لما يتطلبه Twilio.

يفرض مسار Webhook أيضًا ما يلي، بشكل مستقل عن التحقق من التوقيع:

- استخدام `POST` فقط.
- حدًا أقصى قدره 30 طلبًا في الدقيقة لكل عنوان IP مصدر (ويُرجع HTTP 429 عند تجاوزه).
- يجب أن تتطابق قيمة `AccountSid` في الحمولة مع `accountSid` المهيأ (وإلا يُرجع HTTP 403).
- تُزال القيم المكررة من `MessageSid` المُعاد تشغيلها لمدة 10 دقائق.
- تحتفظ ذاكرة التخزين المؤقت لمنع إعادة التشغيل الخاصة بكل حساب SMS بما يصل إلى 10,000 معرّف SID حي للرسائل. عندما تكون جميع الخانات حية، تُرفض Webhooks الجديدة لذلك الحساب بشكل مغلق مع HTTP 429 وترويسة `Retry-After` حتى تنتهي صلاحية أقدم خانة.
- تُرفض أجسام الطلبات التي تتجاوز 32 كيلوبايت.

لا يعيد Twilio محاولة طلبات HTTP 429 افتراضيًا، كما أنه لا يوثق دعم `Retry-After`. تتيح تجاوزات الاتصال `#rp=4xx` و`#rp=all` إعادة محاولة أخطاء 4xx، لكن Twilio يحد معاملة إعادة المحاولة الكاملة بـ15 ثانية، لذلك قد تنتهي المحاولات قبل انتهاء صلاحية خانة في ذاكرة التخزين المؤقت لمنع إعادة التشغيل. هيئ عنوان URL احتياطيًا عندما يجب أن يستقبل معالج آخر عمليات التسليم الفاشلة؛ وتعامل مع 429 باعتباره رفضًا مغلقًا عند الفشل، لا كآلية ضغط عكسي موثوقة.

لاختبار النفق المحلي فقط، يمكنك تعيين:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

لا تستخدم تعطيل التحقق من التوقيع على Gateway عام.

## تهيئة حسابات متعددة

استخدم `accounts` عند تشغيل أكثر من رقم Twilio واحد:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

يجب أن يستخدم كل حساب قيمة `webhookPath` مميزة؛ يرفض Gateway تسجيل مسار Webhook إذا كان مساره مملوكًا بالفعل لحساب آخر. تنطبق قيم بيئة الرجوع الاحتياطي `TWILIO_*`/`SMS_*` على الحساب الافتراضي فقط؛ عيّن `defaultAccount` لتغيير الحساب الافتراضي.

## استكشاف الأخطاء وإصلاحها

### يُرجع Twilio الخطأ 403 أو يرفض OpenClaw‏ Webhook

تحقق من أن `publicWebhookUrl` يطابق تمامًا عنوان URL المهيأ في Twilio، بما في ذلك المخطط والمضيف والمسار وسلسلة الاستعلام. يوقّع Twilio سلسلة عنوان URL العامة، لذلك قد تؤدي عمليات إعادة الكتابة في الوكيل وأسماء المضيفين البديلة إلى فشل التحقق من التوقيع.

يعني الخطأ 403 المصحوب بالرسالة `Invalid account` أن قيمة `AccountSid` في الحمولة الواردة لا تطابق `accountSid` المهيأ؛ تحقق من أن Webhook يشير إلى الحساب الذي يملك الرقم.

### لا يظهر طلب اقتران

تحقق من عنوان URL وطريقة Webhook ضمن **Messaging** لرقم Twilio. يجب أن يشير إلى عنوان URL الخاص بـWebhook للرسائل النصية القصيرة وأن يستخدم `POST`. تأكد أيضًا من إمكانية الوصول إلى Gateway من الإنترنت العام أو عبر نفقك.

إذا أظهر سجل رسائل Twilio الخطأ `11200`، فهذا يعني أن Twilio قبل رسالة SMS الواردة لكنه لم يتمكن من الوصول إلى Webhook الخاص بك. تحقق مما يلي:

- يشير **Messaging > A message comes in** في Twilio إلى `publicWebhookUrl`.
- الطريقة هي `POST`.
- يعرض النفق أو الوكيل العكسي قيمة `webhookPath` نفسها تمامًا؛ بالنسبة إلى Tailscale Funnel، نفّذ `tailscale funnel status` وتأكد من ظهور `/webhooks/sms`.
- يستخدم `publicWebhookUrl` المخطط والمضيف والمسار وسلسلة الاستعلام نفسها التي يرسلها Twilio، بحيث يمكن للتحقق من التوقيع إعادة إنتاج عنوان URL الموقّع.

يعرض `openclaw channels status --channel sms --probe` كلًا من إعدادات Webhook غير المتطابقة في Twilio وأخطاء `11200` الحديثة.

### تفشل عمليات الإرسال الصادرة

تأكد من تحديد `accountSid` و`authToken` وأحد الخيارين `fromNumber` أو `messagingServiceSid`. إذا كنت تستخدم حساب Twilio تجريبيًا، فقد يلزم التحقق من رقم الوجهة في Twilio قبل أن تتمكن من إرسال رسائل SMS صادرة.

### تصل الرسائل لكن الوكيل لا يجيب

تحقق من `dmPolicy` و`allowFrom`. مع سياسة `pairing` الافتراضية، يجب الموافقة على المرسل قبل معالجة دورات الوكيل العادية.
