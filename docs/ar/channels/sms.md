---
read_when:
    - تريد ربط OpenClaw بالرسائل النصية القصيرة (SMS) عبر Twilio
    - تحتاج إلى إعداد Webhook للرسائل النصية القصيرة أو قائمة السماح
summary: إعداد قناة Twilio للرسائل النصية القصيرة، وضوابط الوصول، وتهيئة Webhook
title: الرسائل النصية القصيرة
x-i18n:
    generated_at: "2026-07-16T13:37:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

يستقبل OpenClaw رسائل SMS ويرسلها عبر رقم هاتف Twilio أو Messaging Service. يسجّل Gateway مسار Webhook واردًا (الافتراضي `/webhooks/sms`)، ويتحقق افتراضيًا من توقيعات طلبات Twilio، ويرسل الردود عبر Messages API الخاصة بـ Twilio.

الحالة: Plugin رسمي، يُثبَّت بشكل منفصل. نص فقط: لا يدعم MMS أو الوسائط، والرسائل المباشرة فقط.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية لرسائل SMS هي الاقتران.
  </Card>
  <Card title="أمان Gateway" icon="shield" href="/ar/gateway/security">
    راجع إتاحة Webhook وعناصر التحكم في وصول المرسلين.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    إجراءات تشخيص وإصلاح مشتركة بين القنوات.
  </Card>
</CardGroup>

## قبل البدء

تحتاج إلى:

- تثبيت Plugin الرسمي لرسائل SMS باستخدام `openclaw plugins install @openclaw/sms`.
- حساب Twilio يتضمن رقم هاتف يدعم SMS، أو Twilio Messaging Service.
- معرّف حساب Twilio ‏(Account SID) ورمز المصادقة (Auth Token).
- عنوان URL عام يستخدم HTTPS ويصل إلى Gateway الخاص بـ OpenClaw.
- اختيار سياسة للمرسل: `pairing` (الافتراضية) للاستخدام الخاص، أو `allowlist` لأرقام الهواتف المعتمدة مسبقًا، أو `open` فقط لإتاحة SMS للعامة عن قصد.

يمكن لرقم Twilio واحد خدمة كل من SMS و[المكالمات الصوتية](/ar/plugins/voice-call) إذا كان يدعم الإمكانيتين. يُضبط Webhook الخاص برسائل SMS وWebhook الخاص بالصوت بصورة منفصلة في Twilio، ويستخدمان مسارين منفصلين في Gateway؛ ولا تتناول هذه الصفحة سوى Webhook الخاص برسائل SMS.

## الإعداد السريع

<Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="أنشئ مرسلًا في Twilio أو اختره">
    في Twilio، افتح **Phone Numbers > Manage > Active numbers** واختر رقمًا يدعم SMS. احفظ ما يلي:

    - معرّف الحساب (Account SID)، مثل `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - رمز المصادقة (Auth Token)
    - رقم هاتف المرسل، مثل `+15551234567`

    إذا كنت تستخدم Messaging Service بدلًا من رقم مرسل ثابت، فاحفظ معرّف Messaging Service ‏(SID)، مثل `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

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

    استخدم HTTP ‏`POST`. المسار المحلي الافتراضي هو `/webhooks/sms`؛ غيّر `channels.sms.webhookPath` إذا كنت تحتاج إلى مسار مختلف.

  </Step>

  <Step title="أتِح مسار Webhook المحدد لرسائل SMS">
    يجب أن يوجّه عنوان URL العام مسار SMS إلى عملية Gateway (المنفذ الافتراضي `18789`). إذا كنت تستخدم Tailscale Funnel للاختبار المحلي، فأتِح `/webhooks/sms` صراحةً:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    تستخدم المكالمات الصوتية ورسائل SMS مسارين منفصلين لـ Webhook. إذا كان رقم Twilio نفسه يتولى كليهما، فأبقِ المسارين مضبوطين في Twilio وفي النفق.

  </Step>

  <Step title="شغّل Gateway واعتمد المرسل الأول">

```bash
openclaw gateway
```

أرسل رسالة نصية إلى رقم Twilio. تنشئ الرسالة الأولى طلب اقتران. اعتمده:

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
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | تمكين القناة/الحساب أو تعطيلهما.                                    |
| `accountSid`                            | —               | معرّف حساب Twilio ‏(SID) ‏(`AC...`).                               |
| `authToken`                             | —               | رمز مصادقة Twilio؛ سلسلة نصية صريحة أو SecretRef.                   |
| `fromNumber`                            | —               | رقم المرسل بتنسيق E.164.                                            |
| `messagingServiceSid`                   | —               | معرّف Messaging Service ‏(SID) ‏(`MG...`) المستخدم عند تعذّر تحديد `fromNumber`. |
| `defaultTo`                             | —               | الوجهة الافتراضية عندما لا يحدد مسار الإرسال هدفًا صريحًا.          |
| `webhookPath`                           | `/webhooks/sms` | مسار HTTP في Gateway لطلبات Webhook الواردة من Twilio.              |
| `publicWebhookUrl`                      | —               | عنوان URL العام المضبوط في Twilio؛ مطلوب للتحقق من التوقيع.         |
| `dangerouslyDisableSignatureValidation` | `false`         | تخطّي فحوصات `X-Twilio-Signature`؛ لاختبار النفق المحلي فقط.        |
| `dmPolicy`                              | `"pairing"`     | `pairing` أو `allowlist` أو `open` أو `disabled`.                      |
| `allowFrom`                             | `[]`            | أرقام المرسلين المسموح بها بتنسيق E.164، أو `"*"` مع `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | الحد الأقصى لعدد الأحرف في كل جزء من رسائل SMS الصادرة.             |
| `accounts`، `defaultAccount`            | —               | خريطة الحسابات المتعددة ومعرّف الحساب الافتراضي.                    |

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

تنطبق متغيرات البيئة على الحساب الافتراضي فقط؛ وتكون لقيم الضبط الأولوية على قيم البيئة.

| المتغير                                        | يقابله                                             |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (الاسم البديل `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (مفصولة بفواصل)                      |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` ‏(`"true"`) |

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

يمكن أن تكون `authToken` من النوع SecretRef ‏(`source: "env" | "file" | "exec"`). استخدم هذا عندما ينبغي أن يحل Gateway رمز مصادقة Twilio من وقت تشغيل أسرار OpenClaw بدلًا من تخزين ضبط بنص صريح:

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

يجب أن يكون متغير البيئة أو موفّر الأسرار المُشار إليه مرئيًا لوقت تشغيل Gateway. أعد تشغيل عمليات Gateway المُدارة بعد تغيير متغيرات بيئة المضيف.

### مرسل Messaging Service

استخدم `messagingServiceSid` بدلًا من `fromNumber` عندما ينبغي أن يختار Twilio المرسل عبر Messaging Service:

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

إذا وُجد كل من `fromNumber` و`messagingServiceSid` بعد تحديد قيم الضبط والبيئة، فسيُستخدم `fromNumber`.

### الهدف الافتراضي للإرسال الصادر

عيّن `defaultTo` عندما ينبغي أن تتوفر للأتمتة أو للتسليم الذي يبدأه الوكيل وجهة افتراضية إذا لم يحدد مسار الإرسال هدفًا صريحًا:

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

- `pairing` (الافتراضية): يحصل المرسلون غير المعروفين على رمز اقتران؛ اعتمدهم باستخدام `openclaw pairing approve sms <CODE>`.
- `allowlist`: لا تُعالج إلا رسائل المرسلين المدرجين في `allowFrom`. ترفض قائمة `allowFrom` الفارغة كل مرسل (يسجّل Gateway تحذيرًا عند بدء التشغيل).
- `open`: يتطلب التحقق من صحة الضبط أن تتضمن `allowFrom` القيمة `"*"`. بدون حرف البدل، لا يمكن إلا للأرقام المدرجة إجراء محادثة.
- `disabled`: تُسقط جميع الرسائل المباشرة الواردة.

يجب أن تكون إدخالات `allowFrom` أرقام هواتف بتنسيق E.164، مثل `+15551234567`. تُقبل بادئتا `sms:` و`twilio-sms:` وتُطبّعان. بالنسبة إلى مساعد خاص، يُفضّل استخدام `dmPolicy: "allowlist"` مع أرقام هواتف صريحة:

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

عندما يكون تحديد القناة ضمنيًا، تختار البادئة `twilio-sms:` هذه القناة دون الاستحواذ على بادئة الخدمة `sms:`، التي يستخدمها iMessage لاختيار تسليم SMS عبر شركة الاتصالات لأهدافه الخاصة:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

تتطلب CLI قيمة `--target` صريحة. أما `defaultTo` فهي لمسارات الأتمتة والتسليم الذي يبدأه الوكيل، حيث يمكن تحديد الهدف من ضبط القناة.

تعود ردود الوكيل على محادثات SMS الواردة تلقائيًا إلى المُرسِل عبر مُرسِل Twilio المُهيأ.

يكون إخراج SMS نصًا عاديًا. يزيل OpenClaw تنسيق Markdown، ويسطّح كتل التعليمات البرمجية المسيّجة، ويعيد كتابة الروابط بصيغة `label (url)`، ويقسّم الردود الطويلة إلى أجزاء لا يزيد كل منها على `textChunkLimit` حرفًا (الافتراضي 1500) قبل إرسالها عبر Twilio.

## التحقق من الإعداد

بعد بدء Gateway:

1. تأكد من أن سجل Gateway يعرض مسار Webhook الخاص بـ SMS.
2. شغّل فحصًا من جانب Twilio (يتحقق من عنوان URL وطريقة Webhook المهيأين في Twilio ومن أخطاء الوارد الحديثة):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. أرسل رسالة SMS إلى رقم Twilio من هاتفك.
4. شغّل `openclaw pairing list sms`.
5. وافق على رمز الاقتران باستخدام `openclaw pairing approve sms <CODE>`.
6. أرسل رسالة SMS أخرى وتأكد من أن الوكيل يرد.

للاختبار الصادر فقط، استخدم:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "اختبار OpenClaw SMS"
```

### اختبار شامل من macOS iMessage/SMS

على جهاز Mac يمكنه إرسال رسائل SMS عبر شركة الاتصالات باستخدام Messages، يمكنك استخدام `imsg` لتشغيل جانب المُرسِل دون لمس هاتفك:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

يجب أن تنشئ الرسالة الأولى طلب اقتران. ويجب أن تتلقى الرسالة الثانية رد الوكيل عبر Twilio.

## أمان Webhook

يتحقق OpenClaw افتراضيًا من `X-Twilio-Signature` باستخدام `publicWebhookUrl` و`authToken`. أبقِ جزء نقطة النهاية من `publicWebhookUrl` مطابقًا بايتًا ببايت لعنوان URL المهيأ في Twilio، بما في ذلك المخطط والمضيف والمسار وسلسلة الاستعلام. يستبعد OpenClaw أجزاء [تجاوز الاتصال](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) الخاصة بـ Twilio (`#...`) من حساب التوقيع، كما يتطلب Twilio.

يفرض مسار Webhook أيضًا، بصورة مستقلة عن التحقق من التوقيع، ما يلي:

- `POST` فقط.
- ميزانية للطلبات الفاشلة قدرها 300 طلب في الدقيقة لكل حساب SMS ومسار Webhook وعنوان عميل محلول. تُحتسب جميع الطلبات ضمن هذه الميزانية، لكن لا يُطبّق HTTP 429 إلا بعد فشل طلب في تحليل النص الأساسي أو التحقق من Twilio أو مطابقة AccountSid.
- حد لمعدل الاستدعاءات القابلة للإرسال قدره 30 استدعاءً مقبولًا في الدقيقة لكل حساب SMS ومسار Webhook وعنوان عميل محلول بعد اجتياز تلك الفحوصات (يُرجع HTTP 429 عند تجاوز ذلك). إذا كان التحقق من التوقيع معطّلًا، فإن حد 30/دقيقة هذا هو سقف الإرسال غير المصادق عليه.
- تُحل عناوين العملاء من خلال قواعد الوكيل الموثوق المشتركة في Gateway. إذا كان `gateway.trustedProxies` يتضمن الوكيل العكسي الذي يعيد توجيه استدعاءات Twilio، يستخدم OpenClaw عنوان العميل المُمرَّر لتحديد مفاتيح هذه الحدود؛ وإلا فيعود إلى عنوان المقبس المباشر.
- يجب أن يطابق `AccountSid` في الحمولة قيمة `accountSid` المهيأة (وإلا يُرجع HTTP 403).
- تُزال ازدواجية قيم `MessageSid` المعاد تشغيلها لمدة 10 دقائق.
- تحتفظ ذاكرة التخزين المؤقت لإعادة التشغيل في كل حساب SMS بما يصل إلى 10,000 من معرّفات SID الحية للرسائل. عندما تكون جميع الخانات حية، تفشل Webhooks الجديدة لذلك الحساب بصورة مغلقة مع HTTP 429 وترويسة `Retry-After` حتى انتهاء صلاحية أقدم خانة.
- تُرفض النصوص الأساسية للطلبات التي تتجاوز 32 KB.

لا يعيد Twilio محاولة طلبات HTTP 429 افتراضيًا، ولا يوثّق دعم `Retry-After`. تفعّل تجاوزات الاتصال `#rp=4xx` و`#rp=all` إعادة محاولة أخطاء 4xx، لكن Twilio يحد معاملة إعادة المحاولة الكاملة بـ 15 ثانية، لذلك قد تنتهي عمليات إعادة المحاولة قبل انتهاء صلاحية خانة في ذاكرة التخزين المؤقت لإعادة التشغيل. هيّئ عنوان URL احتياطيًا عندما يلزم أن يتلقى معالج آخر عمليات التسليم الفاشلة؛ وتعامل مع 429 بوصفه رفضًا مغلقًا عند الفشل، لا ضغطًا عكسيًا موثوقًا.

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

لا تستخدم التحقق المعطّل من التوقيع على Gateway عام.

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

يجب أن يستخدم كل حساب `webhookPath` مميزًا؛ يرفض Gateway تسجيل مسار Webhook إذا كان مساره مملوكًا بالفعل لحساب آخر. لا تنطبق القيم الاحتياطية للبيئة `TWILIO_*`/`SMS_*` إلا على الحساب الافتراضي؛ عيّن `defaultAccount` لتغيير الحساب الافتراضي.

## استكشاف الأخطاء وإصلاحها

### يُرجع Twilio الخطأ 403 أو يرفض OpenClaw الـ Webhook

تحقق من أن `publicWebhookUrl` يطابق تمامًا عنوان URL المهيأ في Twilio، بما في ذلك المخطط والمضيف والمسار وسلسلة الاستعلام. يوقّع Twilio سلسلة عنوان URL العام، لذلك يمكن أن تؤدي عمليات إعادة الكتابة في الوكيل وأسماء المضيفين البديلة إلى تعطيل التحقق من التوقيع.

يعني الخطأ 403 المصحوب بـ `Invalid account` أن `AccountSid` في الحمولة الواردة لا يطابق `accountSid` المهيأ؛ تحقق من أن Webhook يشير إلى الحساب الذي يملك الرقم.

### لا يظهر طلب اقتران

تحقق من عنوان URL وطريقة Webhook ضمن **Messaging** لرقم Twilio. يجب أن يشير إلى عنوان URL الخاص بـ Webhook لـ SMS وأن يستخدم `POST`. وتأكد أيضًا من إمكانية الوصول إلى Gateway من الإنترنت العام أو عبر نفقك.

إذا أظهر سجل رسائل Twilio الخطأ `11200`، فهذا يعني أن Twilio قبل رسالة SMS الواردة لكنه لم يتمكن من الوصول إلى Webhook الخاص بك. تحقق مما يلي:

- يشير Twilio **Messaging > A message comes in** إلى `publicWebhookUrl`.
- الطريقة هي `POST`.
- يكشف النفق أو الوكيل العكسي `webhookPath` الدقيق؛ بالنسبة إلى Tailscale Funnel، شغّل `tailscale funnel status` وتأكد من إدراج `/webhooks/sms`.
- يستخدم `publicWebhookUrl` المخطط والمضيف والمسار وسلسلة الاستعلام نفسها التي يرسلها Twilio، بحيث يمكن للتحقق من التوقيع إعادة إنتاج عنوان URL الموقّع.

يعرض `openclaw channels status --channel sms --probe` كلًا من إعدادات Webhook غير المتطابقة في Twilio وأخطاء `11200` الحديثة.

### تفشل عمليات الإرسال الصادرة

تأكد من حل `accountSid` و`authToken` وأحد `fromNumber` أو `messagingServiceSid`. إذا كنت تستخدم حساب Twilio تجريبيًا، فقد يلزم التحقق من رقم الوجهة في Twilio قبل إرسال رسائل SMS الصادرة.

### تصل الرسائل لكن الوكيل لا يجيب

تحقق من `dmPolicy` و`allowFrom`. مع سياسة `pairing` الافتراضية، يجب الموافقة على المُرسِل قبل معالجة تفاعلات الوكيل العادية.
