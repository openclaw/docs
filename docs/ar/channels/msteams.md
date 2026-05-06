---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم روبوت Microsoft Teams وإمكاناته وتكوينه
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T07:43:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48e6cba4c5204726015758503e596fc02938d9de788c363190c3e6988e75ce8a
    source_path: channels/msteams.md
    workflow: 16
---

الحالة: النص + مرفقات الرسائل المباشرة مدعومة؛ يتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` + أذونات Graph (انظر [إرسال الملفات في دردشات المجموعات](#sending-files-in-group-chats)). تُرسل الاستطلاعات عبر Adaptive Cards. تعرض إجراءات الرسائل `upload-file` صريحًا للإرسال الذي يبدأ بملف.

## Plugin المضمّن

يُشحن Microsoft Teams بصفته Plugin مضمّنًا في إصدارات OpenClaw الحالية، لذا لا
يلزم تثبيت منفصل في بنية الحزمة العادية.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Teams المضمّن،
فثبّت حزمة npm مباشرة:

```bash
openclaw plugins install @openclaw/msteams
```

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا
دقيقًا فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

يتولى [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) تسجيل البوت، وإنشاء البيان، وتوليد بيانات الاعتماد في أمر واحد.

**1. ثبّت وسجّل الدخول**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI حاليًا في مرحلة المعاينة. قد تتغير الأوامر والرايات بين الإصدارات.
</Note>

**2. ابدأ نفقًا** (لا يستطيع Teams الوصول إلى localhost)

ثبّت وصادِق devtunnel CLI إذا لم تفعل ذلك بالفعل ([دليل البدء](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` مطلوب لأن Teams لا يستطيع المصادقة مع devtunnels. لا يزال كل طلب بوت وارد يُتحقق منه تلقائيًا بواسطة Teams SDK.
</Note>

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (لكن هذه قد تغيّر عناوين URL في كل جلسة).

**3. أنشئ التطبيق**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

هذا الأمر الواحد:

- ينشئ تطبيق Entra ID (Azure AD)
- يولّد سر عميل
- يبني ويرفع بيان تطبيق Teams (مع الأيقونات)
- يسجل البوت (مُدار بواسطة Teams افتراضيًا - لا حاجة إلى اشتراك Azure)

سيعرض المخرج `CLIENT_ID` و`CLIENT_SECRET` و`TENANT_ID` و**معرّف تطبيق Teams** - دوّن هذه للخطوات التالية. كما يعرض تثبيت التطبيق في Teams مباشرة.

**4. اضبط OpenClaw** باستخدام بيانات الاعتماد من المخرج:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

أو استخدم متغيرات البيئة مباشرة: `MSTEAMS_APP_ID` و`MSTEAMS_APP_PASSWORD` و`MSTEAMS_TENANT_ID`.

**5. ثبّت التطبيق في Teams**

سيطالبك `teams app create` بتثبيت التطبيق - اختر "التثبيت في Teams". إذا تخطيت ذلك، يمكنك الحصول على الرابط لاحقًا:

```bash
teams app get <teamsAppId> --install-link
```

**6. تحقق من أن كل شيء يعمل**

```bash
teams app doctor <teamsAppId>
```

يشغّل هذا تشخيصات عبر تسجيل البوت، وإعداد تطبيق AAD، وصلاحية البيان، وإعداد SSO.

لنشر الإنتاج، فكّر في استخدام [المصادقة المتحدة](/ar/channels/msteams#federated-authentication-certificate-plus-managed-identity) (شهادة أو هوية مُدارة) بدلًا من أسرار العملاء.

<Note>
تُحظر دردشات المجموعات افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بردود المجموعات، عيّن `channels.msteams.groupAllowFrom`، أو استخدم `groupPolicy: "open"` للسماح لأي عضو (مشروط بالإشارة).
</Note>

## الأهداف

- التحدث إلى OpenClaw عبر رسائل Teams المباشرة، أو دردشات المجموعات، أو القنوات.
- الحفاظ على توجيه حتمي: تعود الردود دائمًا إلى القناة التي وصلت منها.
- اعتماد سلوك قنوات آمن افتراضيًا (الإشارات مطلوبة ما لم يُضبط خلاف ذلك).

## عمليات كتابة الإعدادات

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات الإعدادات التي تُشغّلها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**وصول الرسائل المباشرة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يُتجاهل المرسلون غير المعروفين إلى أن تتم الموافقة عليهم.
- ينبغي أن يستخدم `channels.msteams.allowFrom` معرّفات كائنات AAD الثابتة.
- لا تعتمد على مطابقة UPN/اسم العرض لقوائم السماح - فقد تتغير. يعطّل OpenClaw مطابقة الأسماء المباشرة افتراضيًا؛ فعّلها صراحةً باستخدام `channels.msteams.dangerouslyAllowNameMatching: true`.
- يستطيع المعالج حل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**وصول المجموعات**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عندما لا يكون مضبوطًا.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين الذين يمكنهم التشغيل في دردشات المجموعات/القنوات (يرجع إلى `channels.msteams.allowFrom`).
- عيّن `groupPolicy: "open"` للسماح لأي عضو (لا يزال مشروطًا بالإشارة افتراضيًا).
- للسماح بـ **عدم وجود أي قنوات**، عيّن `channels.msteams.groupPolicy: "disabled"`.

مثال:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**قائمة سماح Teams + القنوات**

- حدّد نطاق ردود المجموعات/القنوات بإدراج الفرق والقنوات تحت `channels.msteams.teams`.
- ينبغي أن تستخدم المفاتيح معرّفات محادثات Teams الثابتة من روابط Teams، لا أسماء العرض القابلة للتغيير.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، لا تُقبل إلا الفرق/القنوات المدرجة (مشروطة بالإشارة).
- يقبل معالج الإعداد إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يحل OpenClaw أسماء قوائم سماح الفريق/القناة والمستخدم إلى معرّفات (عندما تسمح أذونات Graph)
  ويسجّل المطابقة؛ تُبقى أسماء الفريق/القناة غير المحلولة كما كُتبت لكنها تُتجاهل للتوجيه افتراضيًا ما لم يكن `channels.msteams.dangerouslyAllowNameMatching: true` مفعّلًا.

مثال:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

<details>
<summary><strong>الإعداد اليدوي (دون Teams CLI)</strong></summary>

إذا لم تتمكن من استخدام Teams CLI، يمكنك إعداد البوت يدويًا عبر Azure Portal.

### كيف يعمل

1. تأكد من توفر Microsoft Teams Plugin (مضمّن في الإصدارات الحالية).
2. أنشئ **Azure Bot** (معرّف التطبيق + السر + معرّف المستأجر).
3. ابنِ **حزمة تطبيق Teams** تشير إلى البوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams في فريق (أو نطاق شخصي للرسائل المباشرة).
5. اضبط `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway إلى حركة Webhook الخاصة بـ Bot Framework على `/api/messages` افتراضيًا.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [إنشاء Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ تبويب **الأساسيات**:

   | الحقل              | القيمة                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **معرّف البوت**     | اسم البوت لديك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **الاشتراك**   | حدد اشتراك Azure لديك                           |
   | **مجموعة الموارد** | أنشئ واحدة جديدة أو استخدم موجودة                               |
   | **فئة التسعير**   | **مجاني** للتطوير/الاختبار                                 |
   | **نوع التطبيق**    | **مستأجر واحد** (موصى به - انظر الملاحظة أدناه)         |
   | **نوع الإنشاء**  | **إنشاء Microsoft App ID جديد**                          |

<Warning>
أُلغي دعم إنشاء بوتات متعددة المستأجرين جديدة بعد 2025-07-31. استخدم **مستأجر واحد** للبوتات الجديدة.
</Warning>

3. انقر **مراجعة + إنشاء** → **إنشاء** (انتظر حوالي 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot لديك → **التكوين**
2. انسخ **Microsoft App ID** → هذا هو `appId` لديك
3. انقر **إدارة كلمة المرور** → انتقل إلى App Registration
4. ضمن **الشهادات والأسرار** → **سر عميل جديد** → انسخ **القيمة** → هذا هو `appPassword` لديك
5. انتقل إلى **نظرة عامة** → انسخ **معرّف الدليل (المستأجر)** → هذا هو `tenantId` لديك

### الخطوة 3: ضبط نقطة نهاية المراسلة

1. في Azure Bot → **التكوين**
2. عيّن **نقطة نهاية المراسلة** إلى عنوان URL الخاص بـ Webhook:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (انظر [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تفعيل قناة Teams

1. في Azure Bot → **القنوات**
2. انقر **Microsoft Teams** → تكوين → حفظ
3. اقبل شروط الخدمة

### الخطوة 5: بناء بيان تطبيق Teams

- ضمّن إدخال `bot` مع `botId = <App ID>`.
- النطاقات: `personal` و`team` و`groupChat`.
- `supportsFiles: true` (مطلوب لمعالجة الملفات في النطاق الشخصي).
- أضف أذونات RSC (انظر [أذونات RSC](#current-teams-rsc-permissions-manifest)).
- أنشئ الأيقونات: `outline.png` (32x32) و`color.png` (192x192).
- اضغط الملفات الثلاثة معًا: `manifest.json` و`outline.png` و`color.png`.

### الخطوة 6: ضبط OpenClaw

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

متغيرات البيئة: `MSTEAMS_APP_ID` و`MSTEAMS_APP_PASSWORD` و`MSTEAMS_TENANT_ID`.

### الخطوة 7: تشغيل Gateway

تبدأ قناة Teams تلقائيًا عندما يكون Plugin متاحًا وتوجد إعدادات `msteams` مع بيانات الاعتماد.

</details>

## المصادقة المتحدة (شهادة بالإضافة إلى هوية مُدارة)

> أُضيفت في 2026.4.11

لنشر الإنتاج، يدعم OpenClaw **المصادقة المتحدة** بصفتها بديلًا أكثر أمانًا لأسرار العملاء. تتوفر طريقتان:

### الخيار أ: المصادقة القائمة على الشهادة

استخدم شهادة PEM مسجلة مع تسجيل تطبيق Entra ID لديك.

**الإعداد:**

1. أنشئ شهادة أو احصل عليها (تنسيق PEM مع مفتاح خاص).
2. في Entra ID → App Registration → **الشهادات والأسرار** → **الشهادات** → ارفع الشهادة العامة.

**الإعدادات:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**متغيرات البيئة:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### الخيار ب: Azure Managed Identity

استخدم Azure Managed Identity للمصادقة بلا كلمة مرور. هذا مثالي لعمليات النشر على بنية Azure التحتية (AKS، App Service، أجهزة Azure VM) حيث تتوفر هوية مُدارة.

**كيف تعمل:**

1. يحتوي بود/VM البوت على هوية مُدارة (مُعيّنة من النظام أو مُعيّنة من المستخدم).
2. يربط **اعتماد هوية متحد** الهوية المُدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على الرموز من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يُمرّر الرمز إلى Teams SDK لمصادقة البوت.

**المتطلبات الأساسية:**

- بنية Azure تحتية مع تفعيل الهوية المُدارة (هوية حمل عمل AKS، App Service، VM)
- اعتماد هوية متحد مُنشأ على تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من البود/VM

**الإعدادات (هوية مُدارة مُعيّنة من النظام):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**التكوين (هوية مُدارة مخصّصة من المستخدم):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**متغيرات البيئة:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (للمخصّصة من المستخدم فقط)

### إعداد هوية حمل العمل في AKS

لعمليات نشر AKS التي تستخدم هوية حمل العمل:

1. **فعّل هوية حمل العمل** على عنقود AKS لديك.
2. **أنشئ اعتماد هوية موحّدة** على تسجيل تطبيق Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **أضف تعليقًا توضيحيًا إلى حساب خدمة Kubernetes** بمعرّف عميل التطبيق:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **أضف تسمية إلى الحاوية** لحقن هوية حمل العمل:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكد من توفر وصول الشبكة** إلى IMDS (`169.254.169.254`) - إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج تسمح بحركة المرور إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة               | التكوين                                         | المزايا                               | العيوب                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **سر العميل**    | `appPassword`                                  | إعداد بسيط                       | يتطلب تدوير السر، وأقل أمانًا |
| **الشهادة**      | `authType: "federated"` + `certificatePath`    | لا يوجد سر مشترك عبر الشبكة      | عبء إضافي لإدارة الشهادات       |
| **الهوية المُدارة** | `authType: "federated"` + `useManagedIdentity` | بلا كلمات مرور، ولا أسرار لإدارتها | تتطلب بنية Azure التحتية         |

**السلوك الافتراضي:** عندما لا يتم ضبط `authType`، يستخدم OpenClaw افتراضيًا مصادقة سر العميل. تستمر التكوينات الحالية في العمل من دون تغييرات.

## التطوير المحلي (الأنفاق)

لا يستطيع Teams الوصول إلى `localhost`. استخدم نفق تطوير ثابتًا حتى يبقى عنوان URL كما هو عبر الجلسات:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

بدائل: `ngrok http 3978` أو `tailscale funnel 3978` (قد تتغير عناوين URL في كل جلسة).

إذا تغيّر عنوان URL الخاص بالنفق، فحدّث نقطة النهاية:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## اختبار البوت

**شغّل التشخيصات:**

```bash
teams app doctor <teamsAppId>
```

يفحص تسجيل البوت، وتطبيق AAD، والبيان، وتكوين SSO في مرور واحد.

**أرسل رسالة اختبارية:**

1. ثبّت تطبيق Teams (استخدم رابط التثبيت من `teams app get <id> --install-link`)
2. ابحث عن البوت في Teams وأرسل رسالة مباشرة
3. تحقق من سجلات Gateway لرصد النشاط الوارد

## متغيرات البيئة

يمكن ضبط جميع مفاتيح التكوين عبر متغيرات البيئة بدلًا من ذلك:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (موحّد + شهادة)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
- `MSTEAMS_USE_MANAGED_IDENTITY` (موحّد + هوية مُدارة)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (MI مخصّصة من المستخدم فقط)

## إجراء معلومات العضو

يوفّر OpenClaw إجراء `member-info` مدعومًا من Graph لـ Microsoft Teams حتى تتمكن الوكلاء وعمليات الأتمتة من حل تفاصيل أعضاء القناة (اسم العرض، البريد الإلكتروني، الدور) مباشرةً من Microsoft Graph.

المتطلبات:

- إذن RSC باسم `Member.Read.Group` (موجود بالفعل في البيان الموصى به)
- لعمليات البحث عبر الفرق: إذن تطبيق Graph باسم `User.Read.All` مع موافقة المسؤول

يخضع الإجراء للحارس `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عند توفر بيانات اعتماد Graph).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القناة/المجموعة الحديثة التي تُغلّف داخل الموجّه.
- يعود احتياطيًا إلى `messages.groupChat.historyLimit`. اضبطه على `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل المحادثة الذي يتم جلبه حسب قوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذلك لا يتضمن تمهيد سياق المحادثة إلا الرسائل من المرسلين المسموح لهم.
- يتم حاليًا تمرير سياق المرفق المقتبس (`ReplyTo*` المشتق من HTML رد Teams) كما تم استلامه.
- بعبارة أخرى، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ ولا تتم تصفية سوى مسارات سياق تكميلية محددة اليوم.
- يمكن تقييد سجل الرسائل المباشرة باستخدام `channels.msteams.dmHistoryLimit` (أدوار المستخدم). التجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات Teams RSC الحالية (البيان)

هذه هي **أذونات resourceSpecific الحالية** في بيان تطبيق Teams لدينا. لا تنطبق إلا داخل الفريق/الدردشة حيث تم تثبيت التطبيق.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` (Application) - استلام جميع رسائل القنوات من دون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**لدردشات المجموعات:**

- `ChatMessage.Read.Chat` (Application) - استلام جميع رسائل دردشة المجموعة من دون @mention

لإضافة أذونات RSC عبر Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## مثال على بيان Teams (منقّح)

مثال صالح بالحد الأدنى مع الحقول المطلوبة. استبدل المعرّفات وعناوين URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### تنبيهات البيان (حقول ضرورية)

- يجب أن يطابق `bots[].botId` **بالضرورة** معرّف تطبيق Azure Bot.
- يجب أن يطابق `webApplicationInfo.id` **بالضرورة** معرّف تطبيق Azure Bot.
- يجب أن تتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` مطلوب للتعامل مع الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` قراءة/إرسال القناة إذا كنت تريد حركة مرور القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبّت بالفعل (مثلًا، لإضافة أذونات RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

بعد التحديث، أعد تثبيت التطبيق في كل فريق حتى تدخل الأذونات الجديدة حيز التنفيذ، و**أغلق Teams بالكامل ثم شغّله من جديد** (وليس مجرد إغلاق النافذة) لمسح بيانات تعريف التطبيق المخزّنة مؤقتًا.

<details>
<summary>تحديث البيان يدويًا (من دون CLI)</summary>

1. حدّث `manifest.json` بالإعدادات الجديدة
2. **زد قيمة حقل `version`** (مثلًا، `1.0.0` → `1.1.0`)
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json`، `outline.png`، `color.png`)
4. ارفع ملف zip الجديد:
   - **مركز إدارة Teams:** تطبيقات Teams → إدارة التطبيقات → ابحث عن تطبيقك → رفع إصدار جديد
   - **التحميل الجانبي:** في Teams → التطبيقات → إدارة تطبيقاتك → رفع تطبيق مخصص

</details>

## القدرات: RSC فقط مقابل Graph

### باستخدام **Teams RSC فقط** (التطبيق مثبت، من دون أذونات Graph API)

يعمل:

- قراءة محتوى **نص** رسالة القناة.
- إرسال محتوى **نص** رسالة القناة.
- استلام مرفقات ملفات **شخصية (رسائل مباشرة)**.

لا يعمل:

- **محتويات الصور أو الملفات** في القنوات/المجموعات (لا تتضمن الحمولة إلا قالب HTML).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (بعد حدث Webhook المباشر).

### باستخدام **Teams RSC + أذونات تطبيق Microsoft Graph**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة في الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القناة/الدردشة عبر Graph.

### RSC مقابل Graph API

| القدرة              | أذونات RSC      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل الفورية**  | نعم (عبر Webhook)    | لا (استطلاع فقط)                   |
| **الرسائل التاريخية** | لا                   | نعم (يمكن الاستعلام عن السجل)             |
| **تعقيد الإعداد**    | بيان التطبيق فقط    | يتطلب موافقة المسؤول + تدفق الرمز المميز |
| **يعمل دون اتصال**       | لا (يجب أن يكون قيد التشغيل) | نعم (استعلام في أي وقت)                 |

**الخلاصة:** RSC مخصص للاستماع الفوري؛ وGraph API مخصص للوصول التاريخي. للحاق بالرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط والسجل المفعّلان عبر Graph (مطلوبان للقنوات)

إذا كنت تحتاج إلى الصور/الملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب تمكين أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **تسجيل التطبيق** في Entra ID (Azure AD)، أضف **أذونات التطبيق** لـ Microsoft Graph:
   - `ChannelMessage.Read.All` (مرفقات القناة + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (دردشات المجموعات)
2. **امنح موافقة المسؤول** للمستأجر.
3. زد **إصدار البيان** لتطبيق Teams، وأعد رفعه، و**أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams بالكامل ثم شغّله من جديد** لمسح بيانات تعريف التطبيق المخزّنة مؤقتًا.

**إذن إضافي لإشارات المستخدمين:** تعمل @mentions للمستخدمين مباشرةً للمستخدمين في المحادثة. ومع ذلك، إذا كنت تريد البحث ديناميكيًا عن مستخدمين **غير موجودين في المحادثة الحالية** والإشارة إليهم، فأضف إذن `User.Read.All` (Application) وامنح موافقة المسؤول.

## القيود المعروفة

### مهلات Webhook

يرسل Teams الرسائل عبر Webhook من نوع HTTP. إذا استغرقت المعالجة وقتًا طويلًا جدًا (مثل استجابات LLM البطيئة)، فقد ترى:

- مهلات Gateway
- إعادة Teams محاولة إرسال الرسالة (مما يسبب تكرارات)
- ردودًا ساقطة

يتعامل OpenClaw مع ذلك بالرد بسرعة وإرسال الردود بشكل استباقي، لكن الاستجابات البطيئة جدًا قد تظل تسبب مشكلات.

### التنسيق

Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **العريض**، _المائل_، `code`، الروابط
- قد لا يتم عرض Markdown المعقدة (الجداول، القوائم المتداخلة) بشكل صحيح
- بطاقات Adaptive Cards مدعومة للاستطلاعات وإرسال العروض الدلالية (انظر أدناه)

## التكوين

الإعدادات الأساسية (انظر `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تفعيل/تعطيل القناة.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: بيانات اعتماد الروبوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة السماح للرسائل المباشرة (يوصى باستخدام معرفات كائنات AAD). يحل المعالج الأسماء إلى معرفات أثناء الإعداد عندما يكون وصول Graph متاحًا.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تفعيل مطابقة UPN/اسم العرض القابلة للتغيير والتوجيه المباشر باسم الفريق/القناة.
- `channels.msteams.textChunkLimit`: حجم جزء النص الصادر.
- `channels.msteams.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم بحسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة سماح لمضيفي المرفقات الواردة (تكون افتراضيًا نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة سماح لإرفاق ترويسات Authorization عند إعادة محاولة الوسائط (تكون افتراضيًا مضيفي Graph + Bot Framework).
- `channels.msteams.requireMention`: اشتراط @mention في القنوات/المجموعات (الافتراضي true).
- `channels.msteams.replyStyle`: `thread | top-level` (انظر [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) المستخدمة عند غياب تجاوز القناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مرسل (يدعم حرف البدل `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مرسل (يدعم حرف البدل `"*"`).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:`، `e164:`، `username:`، `name:` (لا تزال المفاتيح القديمة غير المسبوقة تُربط بـ `id:` فقط).
- `channels.msteams.actions.memberInfo`: تفعيل أو تعطيل إجراء معلومات العضو المدعوم بواسطة Graph (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).
- `channels.msteams.authType`: نوع المصادقة - `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: المسار إلى ملف شهادة PEM (مصادقة اتحادية + شهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختيارية، غير مطلوبة للمصادقة).
- `channels.msteams.useManagedIdentity`: تفعيل مصادقة الهوية المُدارة (وضع اتحادي).
- `channels.msteams.managedIdentityClientId`: معرف العميل للهوية المُدارة المعيّنة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرف موقع SharePoint لرفع الملفات في محادثات المجموعة/القنوات (انظر [إرسال الملفات في محادثات المجموعة](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (انظر [/concepts/session](/ar/concepts/session)):
  - تشارك الرسائل المباشرة الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القناة/المجموعة معرف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: السلاسل مقابل المنشورات

قدمت Teams مؤخرًا نمطي واجهة للقنوات فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                               | `replyStyle` الموصى به |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **المنشورات** (كلاسيكي)      | تظهر الرسائل كبطاقات مع ردود متسلسلة أسفلها | `thread` (الافتراضي)       |
| **السلاسل** (شبيهة بـ Slack) | تتدفق الرسائل خطيًا، بطريقة أقرب إلى Slack                   | `top-level`              |

**المشكلة:** لا تكشف Teams API عن نمط الواجهة الذي تستخدمه القناة. إذا استخدمت `replyStyle` الخاطئ:

- `thread` في قناة بنمط السلاسل → تظهر الردود متداخلة بشكل مربك
- `top-level` في قناة بنمط المنشورات → تظهر الردود كمنشورات مستقلة على المستوى الأعلى بدلًا من كونها داخل السلسلة

**الحل:** اضبط `replyStyle` لكل قناة بناءً على كيفية إعداد القناة:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## المرفقات والصور

**القيود الحالية:**

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر واجهات Teams bot للملفات.
- **القنوات/المجموعات:** تعيش المرفقات في تخزين M365 (SharePoint/OneDrive). تتضمن حمولة Webhook قالب HTML فقط، وليس بايتات الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- للإرسال الصريح الذي يبدأ بالملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ تصبح `message` الاختيارية النص/التعليق المرافق، ويتجاوز `filename` الاسم المرفوع.

بدون أذونات Graph، ستُستقبل رسائل القنوات التي تحتوي على صور كنص فقط (لا يمكن للروبوت الوصول إلى محتوى الصورة).
افتراضيًا، ينزل OpenClaw الوسائط فقط من أسماء مضيفي Microsoft/Teams. تجاوز ذلك باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
لا تُرفق ترويسات Authorization إلا للمضيفين في `channels.msteams.mediaAuthAllowHosts` (تكون افتراضيًا مضيفي Graph + Bot Framework). أبقِ هذه القائمة صارمة (تجنب لواحق المستأجرين المتعددين).

## إرسال الملفات في محادثات المجموعة

يمكن للروبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard (مضمّن). ومع ذلك، يتطلب **إرسال الملفات في محادثات المجموعة/القنوات** إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                           | الإعداد المطلوب                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة**                  | FileConsentCard → يقبل المستخدم → يرفع الروبوت | يعمل مباشرة دون إعداد إضافي                            |
| **محادثات المجموعة/القنوات** | الرفع إلى SharePoint → مشاركة الرابط            | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | مضمنة بترميز Base64                        | تعمل مباشرة دون إعداد إضافي                            |

### لماذا تحتاج محادثات المجموعة إلى SharePoint

لا تملك الروبوتات محرك OneDrive شخصيًا (لا تعمل نقطة نهاية Graph API `/me/drive` لهويات التطبيقات). لإرسال الملفات في محادثات المجموعة/القنوات، يرفع الروبوت إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID (Azure AD) → تسجيل التطبيق:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` (Application) - اختياري، يفعّل روابط المشاركة لكل مستخدم

2. **امنح موافقة المسؤول** للمستأجر.

3. **احصل على معرف موقع SharePoint الخاص بك:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **كوّن OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### سلوك المشاركة

| الإذن                              | سلوك المشاركة                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` فقط              | رابط مشاركة على مستوى المؤسسة (يمكن لأي شخص في المؤسسة الوصول) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | رابط مشاركة لكل مستخدم (لا يمكن الوصول إلا لأعضاء المحادثة)      |

المشاركة لكل مستخدم أكثر أمانًا لأن مشاركي المحادثة فقط يمكنهم الوصول إلى الملف. إذا كان إذن `Chat.Read.All` مفقودًا، يعود الروبوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع الاحتياطي

| السيناريو                                          | النتيجة                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| محادثة مجموعة + ملف + `sharePointSiteId` مكوّن | الرفع إلى SharePoint، إرسال رابط مشاركة            |
| محادثة مجموعة + ملف + لا يوجد `sharePointSiteId`         | محاولة رفع OneDrive (قد تفشل)، إرسال نص فقط |
| محادثة شخصية + ملف                              | تدفق FileConsentCard (يعمل بدون SharePoint)    |
| أي سياق + صورة                               | مضمنة بترميز Base64 (تعمل بدون SharePoint)   |

### موقع تخزين الملفات

تُخزن الملفات المرفوعة في مجلد `/OpenClawShared/` ضمن مكتبة المستندات الافتراضية لموقع SharePoint المكوّن.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams كـ Adaptive Cards (لا توجد Teams API أصلية للاستطلاعات).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- يسجل Gateway الأصوات في `~/.openclaw/msteams-polls.json`.
- يجب أن يبقى Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا بعد (افحص ملف التخزين عند الحاجة).

## بطاقات العرض

أرسل حمولات العروض الدلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. يعرضها OpenClaw كبطاقات Teams Adaptive Cards من عقد العرض العام.

تقبل معلمة `presentation` كتلًا دلالية. عند توفير `presentation`، يكون نص الرسالة اختياريًا.

**أداة الوكيل:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

لتفاصيل تنسيق الهدف، انظر [تنسيقات الهدف](#target-formats) أدناه.

## تنسيقات الهدف

تستخدم أهداف MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الهدف         | التنسيق                           | المثال                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| المستخدم (حسب المعرف)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| المستخدم (حسب الاسم)      | `user:<display-name>`            | `user:John Smith` (يتطلب Graph API)              |
| المجموعة/القناة       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| المجموعة/القناة (خام) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (إذا كان يحتوي على `@thread`) |

**أمثلة CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**أمثلة أدوات الوكيل:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

<Note>
من دون البادئة `user:`، تُوجَّه الأسماء افتراضيًا إلى حل المجموعة أو الفريق. استخدم دائمًا `user:` عند استهداف الأشخاص باسم العرض.
</Note>

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** أن يتفاعل المستخدم، لأننا نخزن مراجع المحادثة عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة `dmPolicy` وبوابة قائمة السماح.

## معرّفات الفريق والقناة (مشكلة شائعة)

معامل الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليس** معرّف الفريق المستخدم للتهيئة. استخرج المعرّفات من مسار URL بدلًا من ذلك:

**عنوان URL للفريق:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    معرّف محادثة الفريق (فك ترميز URL لهذا)
```

**عنوان URL للقناة:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      معرّف القناة (فك ترميز URL لهذا)
```

**للتهيئة:**

- مفتاح الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`؛ قد تعرض المستأجرات الأقدم `@thread.skype`، وهو صالح أيضًا)
- مفتاح القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معامل الاستعلام `groupId` لتوجيه OpenClaw. إنه معرّف مجموعة Microsoft Entra، وليس معرّف محادثة Bot Framework المستخدم في أنشطة Teams الواردة.

## القنوات الخاصة

لدى الروبوتات دعم محدود في القنوات الخاصة:

| الميزة                       | القنوات القياسية | القنوات الخاصة           |
| ---------------------------- | ----------------- | ------------------------ |
| تثبيت الروبوت                | نعم               | محدود                    |
| الرسائل الفورية (Webhook)    | نعم               | قد لا تعمل               |
| أذونات RSC                   | نعم               | قد تتصرف بشكل مختلف      |
| @mentions                    | نعم               | إذا كان الروبوت متاحًا   |
| سجل Graph API                | نعم               | نعم (مع الأذونات)        |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات الروبوت
2. استخدم رسائل DM - يمكن للمستخدمين دائمًا مراسلة الروبوت مباشرة
3. استخدم Graph API للوصول التاريخي (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### مشكلات شائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams واخرج من Teams تمامًا ثم أعد فتحه.
- **لا توجد ردود في القناة:** الإشارات مطلوبة افتراضيًا؛ اضبط `channels.msteams.requireMention=false` أو هيّئ ذلك لكل فريق/قناة.
- **عدم تطابق الإصدار (ما زال Teams يعرض ملف manifest القديم):** أزل التطبيق وأعد إضافته، واخرج من Teams تمامًا للتحديث.
- **401 Unauthorized من Webhook:** متوقع عند الاختبار يدويًا من دون Azure JWT - يعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع ملف manifest

- **"Icon file cannot be empty":** يشير ملف manifest إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (32x32 لـ `outline.png`، و192x192 لـ `color.png`).
- **"webApplicationInfo.Id already in use":** ما زال التطبيق مثبتًا في فريق/دردشة أخرى. ابحث عنه وأزله أولًا، أو انتظر 5-10 دقائق حتى يكتمل الانتشار.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح DevTools في المتصفح (F12) ← تبويب Network، وتحقق من جسم الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" - فهذا غالبًا يتجاوز قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقق من أن `webApplicationInfo.id` يطابق App ID الخاص بالروبوت لديك تمامًا
2. أعد رفع التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقق مما إذا كان مسؤول المؤسسة قد حظر أذونات RSC
4. تأكد من أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` للدردشات الجماعية

## المراجع

- [إنشاء Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [بوابة مطوري Teams](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [مخطط ملف manifest لتطبيق Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [استلام رسائل القناة باستخدام RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع أذونات RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [معالجة ملفات روبوت Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (تتطلب القناة/المجموعة Graph)
- [المراسلة الاستباقية](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI لإدارة الروبوتات

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة DM وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
