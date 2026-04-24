---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم روبوت Microsoft Teams وإمكاناته وتهيئته
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T07:31:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

النص والمرفقات في الرسائل المباشرة مدعومان؛ ويتطلب إرسال الملفات في القنوات والمجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في الدردشات الجماعية](#sending-files-in-group-chats)). تُرسل الاستطلاعات عبر Adaptive Cards. وتعرض إجراءات الرسائل أمر `upload-file` صريحًا لعمليات الإرسال التي تبدأ بالملف.

## Plugin مضمّن

يأتي Microsoft Teams كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا
يلزم أي تثبيت منفصل في الإصدار المعبأ العادي.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد Teams المضمّن،
فقم بتثبيته يدويًا:

```bash
openclaw plugins install @openclaw/msteams
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع (للمبتدئين)

1. تأكد من أن Plugin الخاص بـ Microsoft Teams متاح.
   - تأتي إصدارات OpenClaw المعبأة الحالية معه مضمّنًا بالفعل.
   - يمكن للإصدارات الأقدم/المخصصة إضافته يدويًا بالأوامر أعلاه.
2. أنشئ **Azure Bot** ‏(App ID + client secret + tenant ID).
3. هيّئ OpenClaw باستخدام بيانات الاعتماد هذه.
4. اعرض `/api/messages` ‏(المنفذ 3978 افتراضيًا) عبر عنوان URL عام أو نفق.
5. ثبّت حزمة تطبيق Teams وابدأ Gateway.

الحد الأدنى من التهيئة (client secret):

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

بالنسبة إلى بيئات الإنتاج، فكّر في استخدام [المصادقة الاتحادية](#federated-authentication) (شهادة أو managed identity) بدلًا من client secrets.

ملاحظة: تُحظر الدردشات الجماعية افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). وللسماح بالردود الجماعية، اضبط `channels.msteams.groupAllowFrom` (أو استخدم `groupPolicy: "open"` للسماح لأي عضو، مع تقييد الإشارة افتراضيًا).

## عمليات كتابة التهيئة

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات التهيئة التي تُحفَّز عبر `/config set|unset` (يتطلب `commands.config: true`).

للتعطيل:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**الوصول إلى الرسائل المباشرة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يتم تجاهل المرسلين غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائنات AAD الثابتة.
- لا تعتمد على مطابقة UPN/اسم العرض لقوائم السماح — إذ يمكن أن تتغير. يعطّل OpenClaw مطابقة الأسماء المباشرة افتراضيًا؛ واشترك فيها صراحةً فقط عبر `channels.msteams.dangerouslyAllowNameMatching: true`.
- يمكن للمعالج resolve الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**وصول المجموعات**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` ‏(محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز القيمة الافتراضية عند عدم تعيينها.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين الذين يمكنهم التحفيز في الدردشات/القنوات الجماعية (ويعود إلى `channels.msteams.allowFrom`).
- اضبط `groupPolicy: "open"` للسماح لأي عضو (مع استمرار تقييد الإشارة افتراضيًا).
- لمنع **كل القنوات**، اضبط `channels.msteams.groupPolicy: "disabled"`.

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

**Teams + قائمة السماح للقنوات**

- حدّد نطاق الردود في المجموعات/القنوات بإدراج الفرق والقنوات تحت `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات الفرق الثابتة ومعرّفات محادثات القنوات.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، لا تُقبل إلا الفرق/القنوات المدرجة (مع تقييد الإشارة).
- يقبل معالج التهيئة إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يقوم OpenClaw بعمل resolve لأسماء الفرق/القنوات وأسماء المستخدمين في قوائم السماح إلى معرّفات (عندما تسمح أذونات Graph بذلك)
  ويسجل الربط؛ وتُحتفَظ بأسماء الفرق/القنوات غير المحلولة كما كُتبت ولكن تُتجاهل للتوجيه افتراضيًا ما لم يتم تفعيل `channels.msteams.dangerouslyAllowNameMatching: true`.

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

## إعداد Azure Bot

قبل تهيئة OpenClaw، أنشئ مورد Azure Bot والتقط بيانات اعتماده.

<Steps>
  <Step title="إنشاء Azure Bot">
    انتقل إلى [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) واملأ علامة تبويب **Basics**:

    | الحقل              | القيمة                                                     |
    | ------------------ | ---------------------------------------------------------- |
    | **Bot handle**     | اسم الروبوت الخاص بك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
    | **Subscription**   | اشتراك Azure الخاص بك                                      |
    | **Resource group** | أنشئ مجموعة جديدة أو استخدم مجموعة موجودة                 |
    | **Pricing tier**   | **Free** للتطوير/الاختبار                                  |
    | **Type of App**    | **Single Tenant** (موصى به)                                |
    | **Creation type**  | **Create new Microsoft App ID**                            |

    <Note>
    تم إيقاف الروبوتات الجديدة متعددة المستأجرين بعد 2025-07-31. استخدم **Single Tenant** للروبوتات الجديدة.
    </Note>

    انقر **Review + create** → **Create** (انتظر نحو 1-2 دقيقة).

  </Step>

  <Step title="التقاط بيانات الاعتماد">
    من مورد Azure Bot → **Configuration**:

    - انسخ **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → انسخ القيمة → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="تهيئة نقطة نهاية المراسلة">
    Azure Bot → **Configuration** → اضبط **Messaging endpoint**:

    - الإنتاج: `https://your-domain.com/api/messages`
    - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling))

  </Step>

  <Step title="تفعيل قناة Teams">
    Azure Bot → **Channels** → انقر **Microsoft Teams** → Configure → Save. واقبل شروط الخدمة.
  </Step>
</Steps>

## المصادقة الاتحادية

> أضيفت في 2026.3.24

بالنسبة إلى بيئات الإنتاج، يدعم OpenClaw **المصادقة الاتحادية** كبديل أكثر أمانًا من client secrets. وهناك طريقتان متاحتان:

### الخيار A: المصادقة المستندة إلى الشهادة

استخدم شهادة PEM مسجلة مع تسجيل تطبيق Entra ID الخاص بك.

**الإعداد:**

1. أنشئ شهادة أو احصل عليها (بتنسيق PEM مع المفتاح الخاص).
2. في Entra ID → App Registration → **Certificates & secrets** → **Certificates** → ارفع الشهادة العامة.

**التهيئة:**

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

### الخيار B: Azure Managed Identity

استخدم Azure Managed Identity لمصادقة بلا كلمات مرور. وهذا مثالي لعمليات النشر على بنية Azure التحتية (AKS وApp Service وAzure VMs) حيث تتوفر managed identity.

**كيف تعمل:**

1. يحتوي pod/VM الخاص بالروبوت على managed identity (مُعيَّنة من النظام أو مُعيَّنة من المستخدم).
2. يربط **federated identity credential** بين managed identity وتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على الرموز المميزة من نقطة نهاية Azure IMDS ‏(`169.254.169.254`).
4. يُمرَّر الرمز المميز إلى Teams SDK لمصادقة الروبوت.

**المتطلبات المسبقة:**

- بنية Azure تحتية مع تفعيل managed identity ‏(AKS workload identity أو App Service أو VM)
- إنشاء federated identity credential في تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS ‏(`169.254.169.254:80`) من pod/VM

**التهيئة (managed identity مُعيَّنة من النظام):**

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

**التهيئة (managed identity مُعيَّنة من المستخدم):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (للمُعيَّنة من المستخدم فقط)

### إعداد AKS workload identity

لعمليات نشر AKS التي تستخدم workload identity:

1. **فعّل workload identity** على عنقود AKS الخاص بك.
2. **أنشئ federated identity credential** في تسجيل تطبيق Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **أضف annotation إلى Kubernetes service account** باستخدام معرّف عميل التطبيق:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **أضف label إلى pod** لحقن workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكد من الوصول الشبكي** إلى IMDS ‏(`169.254.169.254`) — إذا كنت تستخدم NetworkPolicy، فأضف قاعدة egress تسمح بالمرور إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة              | التهيئة                                         | المزايا                              | العيوب                                 |
| -------------------- | ----------------------------------------------- | ------------------------------------ | -------------------------------------- |
| **Client secret**    | `appPassword`                                   | إعداد بسيط                           | يتطلب تدوير السر، وأقل أمانًا          |
| **Certificate**      | `authType: "federated"` + `certificatePath`     | لا يوجد سر مشترك عبر الشبكة          | عبء إدارة الشهادات                     |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity`  | بلا كلمات مرور، ولا أسرار لإدارتها   | يتطلب بنية Azure التحتية               |

**السلوك الافتراضي:** عندما لا يكون `authType` مضبوطًا، يستخدم OpenClaw افتراضيًا المصادقة عبر client secret. وتستمر التهيئات الحالية في العمل دون تغييرات.

## التطوير المحلي (الأنفاق)

لا يستطيع Teams الوصول إلى `localhost`. استخدم نفقًا للتطوير المحلي:

**الخيار A: ngrok**

```bash
ngrok http 3978
# انسخ عنوان https URL، مثل https://abc123.ngrok.io
# اضبط messaging endpoint على: https://abc123.ngrok.io/api/messages
```

**الخيار B: Tailscale Funnel**

```bash
tailscale funnel 3978
# استخدم عنوان Tailscale funnel URL الخاص بك كنقطة نهاية للمراسلة
```

## Teams Developer Portal (بديل)

بدلًا من إنشاء ملف manifest ZIP يدويًا، يمكنك استخدام [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. انقر **+ New app**
2. املأ المعلومات الأساسية (الاسم والوصف ومعلومات المطور)
3. انتقل إلى **App features** → **Bot**
4. اختر **Enter a bot ID manually** والصق Azure Bot App ID الخاص بك
5. حدّد النطاقات: **Personal** و**Team** و**Group Chat**
6. انقر **Distribute** → **Download app package**
7. في Teams: **Apps** → **Manage your apps** → **Upload a custom app** → اختر ملف ZIP

وغالبًا ما يكون هذا أسهل من تحرير ملفات manifest JSON يدويًا.

## اختبار الروبوت

**الخيار A: Azure Web Chat (تحقق من Webhook أولًا)**

1. في Azure Portal → مورد Azure Bot الخاص بك → **Test in Web Chat**
2. أرسل رسالة — يجب أن ترى ردًا
3. وهذا يؤكد أن نقطة نهاية Webhook الخاصة بك تعمل قبل إعداد Teams

**الخيار B: Teams (بعد تثبيت التطبيق)**

1. ثبّت تطبيق Teams ‏(تحميل جانبي أو كتالوج المؤسسة)
2. اعثر على الروبوت في Teams وأرسل رسالة مباشرة
3. تحقّق من سجلات Gateway للنشاط الوارد

<Accordion title="تجاوزات متغيرات البيئة">

يمكن أيضًا تعيين أي من مفاتيح تهيئة الروبوت/المصادقة عبر متغيرات البيئة:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` ‏(`"secret"` أو `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` ‏(federated + certificate)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` ‏(federated + managed identity؛ معرّف العميل للمُعيَّنة من المستخدم فقط)

</Accordion>

## إجراء معلومات العضو

يقدّم OpenClaw إجراء `member-info` مدعومًا بـ Graph لـ Microsoft Teams حتى يتمكن الوكلاء وعمليات الأتمتة من resolve تفاصيل أعضاء القناة (اسم العرض والبريد الإلكتروني والدور) مباشرةً من Microsoft Graph.

المتطلبات:

- إذن RSC ‏`Member.Read.Group` ‏(موجود بالفعل في manifest الموصى به)
- لعمليات البحث عبر الفرق: إذن Graph Application ‏`User.Read.All` مع موافقة المسؤول

يخضع هذا الإجراء إلى `channels.msteams.actions.memberInfo` ‏(الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد الرسائل الحديثة من القناة/المجموعة التي تُضمَّن في prompt.
- يعود إلى `messages.groupChat.historyLimit`. اضبطه إلى `0` لتعطيله (الافتراضي 50).
- يُرشَّح سجل الخيط الذي تم جلبه بواسطة قوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذلك لا يتضمن تزويد سياق الخيط إلا رسائل من مرسلين مسموح لهم.
- يُمرَّر سياق المرفقات المقتبسة (`ReplyTo*` المشتق من HTML الرد في Teams) حاليًا كما تم استلامه.
- وبعبارة أخرى، تتحكم قوائم السماح في من يمكنه تحفيز الوكيل؛ ولا تُرشَّح اليوم إلا بعض مسارات السياق التكميلية المحددة.
- يمكن تقييد سجل الرسائل المباشرة عبر `channels.msteams.dmHistoryLimit` ‏(دورات المستخدم). تجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات Teams RSC الحالية

هذه هي **resourceSpecific permissions** **الحالية** في manifest تطبيق Teams الخاص بنا. وهي لا تنطبق إلا داخل الفريق/الدردشة حيث ثُبِّت التطبيق.

**بالنسبة إلى القنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` ‏(Application) - استلام جميع رسائل القنوات من دون @mention
- `ChannelMessage.Send.Group` ‏(Application)
- `Member.Read.Group` ‏(Application)
- `Owner.Read.Group` ‏(Application)
- `ChannelSettings.Read.Group` ‏(Application)
- `TeamMember.Read.Group` ‏(Application)
- `TeamSettings.Read.Group` ‏(Application)

**بالنسبة إلى الدردشات الجماعية:**

- `ChatMessage.Read.Chat` ‏(Application) - استلام جميع رسائل الدردشات الجماعية من دون @mention

## مثال على Teams manifest

مثال أدنى صالح مع الحقول المطلوبة. استبدل المعرّفات وعناوين URL.

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

### ملاحظات مهمة حول manifest (حقول لا بد منها)

- يجب أن يطابق `bots[].botId` **بالضرورة** Azure Bot App ID.
- يجب أن يطابق `webApplicationInfo.id` **بالضرورة** Azure Bot App ID.
- يجب أن يتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal` و`team` و`groupChat`).
- يُعد `bots[].supportsFiles: true` مطلوبًا لمعالجة الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` أذونات قراءة/إرسال القنوات إذا كنت تريد حركة مرور القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مُثبَّت بالفعل (مثلًا لإضافة أذونات RSC):

1. حدّث `manifest.json` بالإعدادات الجديدة
2. **زِد الحقل `version`** ‏(مثلًا `1.0.0` → `1.1.0`)
3. **أعد ضغط** manifest مع الأيقونات (`manifest.json`, `outline.png`, `color.png`)
4. ارفع ملف zip الجديد:
   - **الخيار A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → اعثر على تطبيقك → Upload new version
   - **الخيار B (التحميل الجانبي):** في Teams → Apps → Manage your apps → Upload a custom app
5. **بالنسبة إلى قنوات الفرق:** أعد تثبيت التطبيق في كل فريق حتى تصبح الأذونات الجديدة سارية
6. **أغلق Teams بالكامل ثم أعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح البيانات الوصفية المخزنة مؤقتًا للتطبيق

## الإمكانات: RSC فقط مقابل Graph

### Teams RSC فقط (من دون أذونات Graph API)

يعمل:

- قراءة محتوى **النص** لرسائل القنوات.
- إرسال محتوى **النص** لرسائل القنوات.
- استلام مرفقات الملفات **الشخصية (DM)**.

لا يعمل:

- **محتويات** الصور أو الملفات في القنوات/المجموعات (تتضمن الحمولة stub HTML فقط).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (إلى ما بعد حدث Webhook الحي).

### Teams RSC مع أذونات Microsoft Graph application

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة داخل الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القنوات/الدردشات عبر Graph.

### ‏RSC مقابل Graph API

| الإمكانية               | أذونات RSC            | Graph API                           |
| ----------------------- | --------------------- | ----------------------------------- |
| **الرسائل في الوقت الحقيقي** | نعم (عبر Webhook)     | لا (استطلاع فقط)                    |
| **الرسائل التاريخية**   | لا                    | نعم (يمكن الاستعلام عن السجل)       |
| **تعقيد الإعداد**       | manifest التطبيق فقط  | يتطلب موافقة المسؤول + تدفق الرموز  |
| **يعمل دون اتصال**      | لا (يجب أن يكون قيد التشغيل) | نعم (يمكن الاستعلام في أي وقت) |

**الخلاصة:** يُستخدم RSC للاستماع في الوقت الحقيقي؛ ويُستخدم Graph API للوصول التاريخي. ولتعويض الرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` ‏(يتطلب موافقة المسؤول).

## وسائط + سجل مع تمكين Graph (مطلوب للقنوات)

إذا كنت بحاجة إلى صور/ملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب عليك تفعيل أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **App Registration** الخاص بـ Entra ID ‏(Azure AD)، أضف Microsoft Graph **Application permissions**:
   - `ChannelMessage.Read.All` ‏(مرفقات القنوات + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` ‏(للدردشات الجماعية)
2. **امنح موافقة المسؤول** للمستأجر.
3. زِد **إصدار manifest** لتطبيق Teams، ثم أعد رفعه، ثم **أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams بالكامل ثم أعد تشغيله** لمسح البيانات الوصفية المخزنة مؤقتًا للتطبيق.

**إذن إضافي لإشارات المستخدمين:** تعمل إشارات @users مباشرةً للمستخدمين الموجودين في المحادثة. ولكن إذا كنت تريد البحث ديناميكيًا عن مستخدمين والإشارة إليهم وهم **ليسوا في المحادثة الحالية**، فأضف إذن `User.Read.All` ‏(Application) وامنح موافقة المسؤول.

## القيود المعروفة

### مهلات Webhook

يسلّم Teams الرسائل عبر HTTP webhook. وإذا استغرقت المعالجة وقتًا طويلًا جدًا (مثل بطء استجابات LLM)، فقد ترى:

- مهلات Gateway
- إعادة Teams محاولة إرسال الرسالة (مما يسبب تكرارات)
- ردودًا مفقودة

يتعامل OpenClaw مع ذلك عبر الرد سريعًا وإرسال الردود بشكل استباقي، لكن الاستجابات البطيئة جدًا قد تظل تسبب مشكلات.

### التنسيق

تكون Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق** و_مائل_ و`code` والروابط
- قد لا تُعرَض Markdown المعقدة (الجداول والقوائم المتداخلة) بشكل صحيح
- تُدعَم Adaptive Cards للاستطلاعات وعمليات الإرسال ذات العرض الدلالي (راجع أدناه)

## التهيئة

إعدادات مجمّعة (راجع `/gateway/configuration` لأنماط القنوات المشتركة).

<AccordionGroup>
  <Accordion title="الأساس وWebhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: بيانات اعتماد الروبوت
    - `channels.msteams.webhook.port` (الافتراضي `3978`)
    - `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
  </Accordion>

  <Accordion title="المصادقة">
    - `authType`: ‏`"secret"` (الافتراضي) أو `"federated"`
    - `certificatePath`, `certificateThumbprint`: مصادقة federated + certificate ‏(البصمة اختيارية)
    - `useManagedIdentity`, `managedIdentityClientId`: مصادقة federated + managed identity
  </Accordion>

  <Accordion title="التحكم في الوصول">
    - `dmPolicy`: ‏`pairing | allowlist | open | disabled` ‏(الافتراضي: pairing)
    - `allowFrom`: قائمة السماح للرسائل المباشرة، ويفضل معرّفات كائنات AAD؛ ويقوم المعالج بعمل resolve للأسماء عندما يكون وصول Graph متاحًا
    - `dangerouslyAllowNameMatching`: خيار طوارئ لتوجيه UPN/اسم العرض القابل للتغيير وتوجيه أسماء الفرق/القنوات
    - `requireMention`: يتطلب @mention في القنوات/المجموعات (الافتراضي `true`)
  </Accordion>

  <Accordion title="تجاوزات الفريق والقناة">
    كل هذه الإعدادات تتجاوز القيم الافتراضية ذات المستوى الأعلى:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: القيم الافتراضية لسياسة الأدوات لكل فريق
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    تقبل مفاتيح `toolsBySender` البوادئ `id:` و`e164:` و`username:` و`name:` (وتُربط المفاتيح من دون بادئة إلى `id:`). وتمثل `"*"` حرفًا بديلًا.

  </Accordion>

  <Accordion title="التسليم والوسائط والإجراءات">
    - `textChunkLimit`: حجم أجزاء النص الصادر
    - `chunkMode`: ‏`length` (الافتراضي) أو `newline` (تقسيم على حدود الفقرات قبل الطول)
    - `mediaAllowHosts`: قائمة سماح مضيفي المرفقات الواردة (افتراضيًا نطاقات Microsoft/Teams)
    - `mediaAuthAllowHosts`: المضيفون الذين يمكن أن يتلقوا ترويسات Authorization عند إعادة المحاولة (الافتراضي Graph + Bot Framework)
    - `replyStyle`: ‏`thread | top-level` (راجع [نمط الرد](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: تبديل إجراء معلومات العضو المدعوم بـ Graph (مفعّل افتراضيًا عند توفر Graph)
    - `sharePointSiteId`: مطلوب لرفع الملفات في الدردشات/القنوات الجماعية (راجع [إرسال الملفات في الدردشات الجماعية](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (راجع [/concepts/session](/ar/concepts/session)):
  - تشترك الرسائل المباشرة في الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: الخيوط مقابل المنشورات

قدّم Teams مؤخرًا نمطي واجهة لقنواته فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                                    | `replyStyle` الموصى به |
| ------------------------ | -------------------------------------------------------- | ---------------------- |
| **Posts** (الكلاسيكي)    | تظهر الرسائل كبطاقات مع ردود مترابطة أسفلها            | `thread` (الافتراضي)   |
| **Threads** (شبيه Slack) | تتدفق الرسائل خطيًا، بشكل أقرب إلى Slack                | `top-level`            |

**المشكلة:** لا يوفّر Teams API النمط الذي تستخدمه واجهة القناة. وإذا استخدمت `replyStyle` غير الصحيح:

- `thread` في قناة بنمط Threads → تظهر الردود متداخلة بشكل غير مريح
- `top-level` في قناة بنمط Posts → تظهر الردود كمنشورات مستقلة في المستوى الأعلى بدلًا من ظهورها داخل الخيط

**الحل:** هيّئ `replyStyle` لكل قناة بحسب كيفية إعداد القناة:

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

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر Teams bot file APIs.
- **القنوات/المجموعات:** تعيش المرفقات في تخزين M365 ‏(SharePoint/OneDrive). ولا تتضمن حمولة Webhook إلا stub من HTML، وليس بايتات الملف الفعلية. **تكون أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- لعمليات الإرسال الصريحة التي تبدأ بالملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ وتصبح قيمة `message` الاختيارية هي النص/التعليق المصاحب، بينما تتجاوز `filename` الاسم المرفوع.

من دون أذونات Graph، ستُستقبل رسائل القنوات التي تحتوي على صور كنص فقط (ولا يمكن للروبوت الوصول إلى محتوى الصورة).
افتراضيًا، لا ينزّل OpenClaw الوسائط إلا من أسماء مضيفي Microsoft/Teams. ويمكنك تجاوز ذلك عبر `channels.msteams.mediaAllowHosts` ‏(استخدم `["*"]` للسماح بأي مضيف).
ولا تُرفق ترويسات Authorization إلا للمضيفين المدرجين في `channels.msteams.mediaAuthAllowHosts` ‏(الافتراضي: مضيفو Graph + Bot Framework). اجعل هذه القائمة صارمة (وتجنب لاحقات multi-tenant).

## إرسال الملفات في الدردشات الجماعية

يمكن للروبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard ‏(مدمج). لكن **إرسال الملفات في الدردشات/القنوات الجماعية** يتطلب إعدادًا إضافيًا:

| السياق                   | كيفية إرسال الملفات                       | الإعداد المطلوب                                  |
| ------------------------ | ----------------------------------------- | ------------------------------------------------ |
| **الرسائل المباشرة**     | FileConsentCard → يقبل المستخدم → يرفع الروبوت | يعمل مباشرةً                                    |
| **الدردشات/القنوات الجماعية** | الرفع إلى SharePoint → مشاركة الرابط       | يتطلب `sharePointSiteId` + أذونات Graph         |
| **الصور (أي سياق)**      | تضمين Base64 داخل السطر                   | يعمل مباشرةً                                    |

### لماذا تحتاج الدردشات الجماعية إلى SharePoint

لا تملك الروبوتات محرك OneDrive شخصيًا (فنقطة نهاية Graph API ‏`/me/drive` لا تعمل مع هويات التطبيق). ولإرسال الملفات في الدردشات/القنوات الجماعية، يرفع الروبوت الملف إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID ‏(Azure AD) → App Registration:
   - `Sites.ReadWrite.All` ‏(Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` ‏(Application) - اختياري، يفعّل روابط مشاركة لكل مستخدم

2. **امنح موافقة المسؤول** للمستأجر.

3. **احصل على معرّف موقع SharePoint الخاص بك:**

   ```bash
   # عبر Graph Explorer أو curl باستخدام رمز مميز صالح:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # مثال: لموقع في "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # تتضمن الاستجابة: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **هيّئ OpenClaw:**

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

| الإذن                                     | سلوك المشاركة                                               |
| ----------------------------------------- | ----------------------------------------------------------- |
| `Sites.ReadWrite.All` فقط                 | رابط مشاركة على مستوى المؤسسة (يمكن لأي شخص في المؤسسة الوصول) |
| `Sites.ReadWrite.All` + `Chat.Read.All`   | رابط مشاركة لكل مستخدم (يمكن فقط لأعضاء الدردشة الوصول)        |

تكون المشاركة لكل مستخدم أكثر أمانًا لأن المشاركين في الدردشة فقط يمكنهم الوصول إلى الملف. وإذا كان إذن `Chat.Read.All` مفقودًا، يعود الروبوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع الاحتياطي

| السيناريو                                          | النتيجة                                              |
| -------------------------------------------------- | ---------------------------------------------------- |
| دردشة جماعية + ملف + تهيئة `sharePointSiteId`      | الرفع إلى SharePoint، وإرسال رابط مشاركة            |
| دردشة جماعية + ملف + بدون `sharePointSiteId`       | محاولة الرفع إلى OneDrive ‏(قد تفشل)، وإرسال نص فقط |
| دردشة شخصية + ملف                                  | تدفق FileConsentCard ‏(يعمل من دون SharePoint)      |
| أي سياق + صورة                                     | تضمين Base64 داخل السطر (يعمل من دون SharePoint)    |

### مكان تخزين الملفات

تُخزَّن الملفات المرفوعة في مجلد `/OpenClawShared/` داخل مكتبة المستندات الافتراضية لموقع SharePoint المُهيأ.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams كـ Adaptive Cards ‏(لا توجد Teams poll API أصلية).

- CLI: ‏`openclaw message poll --channel msteams --target conversation:<id> ...`
- تُسجَّل الأصوات بواسطة Gateway في `~/.openclaw/msteams-polls.json`.
- يجب أن يبقى Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا بعدُ (افحص ملف التخزين إذا لزم الأمر).

## بطاقات العرض

أرسل حمولات عرض دلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. يعرضها OpenClaw كبطاقات Teams Adaptive Cards انطلاقًا من عقد العرض العام.

تقبل المعلمة `presentation` كتلًا دلالية. وعند توفير `presentation`، يصبح نص الرسالة اختياريًا.

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

لتفاصيل تنسيق الهدف، راجع [تنسيقات الهدف](#target-formats) أدناه.

## تنسيقات الهدف

تستخدم أهداف MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الهدف              | التنسيق                          | المثال                                              |
| ---------------------- | -------------------------------- | --------------------------------------------------- |
| مستخدم (حسب المعرّف)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| مستخدم (حسب الاسم)     | `user:<display-name>`            | `user:John Smith` ‏(يتطلب Graph API)               |
| مجموعة/قناة            | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| مجموعة/قناة (خام)      | `<conversation-id>`              | `19:abc123...@thread.tacv2` ‏(إذا احتوى على `@thread`) |

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

**أمثلة أداة الوكيل:**

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

ملاحظة: من دون البادئة `user:`، تتحول الأسماء افتراضيًا إلى resolve للمجموعة/الفريق. استخدم دائمًا `user:` عند استهداف الأشخاص حسب اسم العرض.

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** تفاعل المستخدم، لأننا نخزن مراجع المحادثة عند تلك النقطة.
- راجع `/gateway/configuration` بخصوص `dmPolicy` وتقييد قائمة السماح.

## معرّفات الفريق والقناة

ليست معلمة الاستعلام `groupId` في عناوين URL الخاصة بـ Teams هي معرّف الفريق المستخدم للتهيئة. استخرج المعرّفات من مسار عنوان URL بدلًا من ذلك:

**عنوان URL للفريق:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    معرّف الفريق (قم بفك ترميز URL لهذا)
```

**عنوان URL للقناة:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      معرّف القناة (قم بفك ترميز URL لهذا)
```

**لأغراض التهيئة:**

- معرّف الفريق = مقطع المسار بعد `/team/` ‏(بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`)
- معرّف القناة = مقطع المسار بعد `/channel/` ‏(بعد فك ترميز URL)
- **تجاهل** معلمة الاستعلام `groupId`

## القنوات الخاصة

لدى الروبوتات دعم محدود في القنوات الخاصة:

| الميزة                       | القنوات القياسية | القنوات الخاصة         |
| --------------------------- | ---------------- | ---------------------- |
| تثبيت الروبوت               | نعم              | محدود                  |
| الرسائل في الوقت الحقيقي (Webhook) | نعم        | قد لا تعمل             |
| أذونات RSC                  | نعم              | قد تتصرف بشكل مختلف    |
| @mentions                   | نعم              | إذا كان الوصول إلى الروبوت ممكنًا |
| سجل Graph API               | نعم              | نعم (مع الأذونات)      |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات الروبوت
2. استخدم الرسائل المباشرة - يمكن للمستخدمين دائمًا مراسلة الروبوت مباشرة
3. استخدم Graph API للوصول التاريخي (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### المشكلات الشائعة

- **عدم ظهور الصور في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams بالكامل ثم أعد فتحه.
- **عدم وجود ردود في القناة:** الإشارات مطلوبة افتراضيًا؛ اضبط `channels.msteams.requireMention=false` أو هيّئ ذلك لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض manifest قديمًا):** أزل التطبيق ثم أضفه من جديد وأغلق Teams بالكامل لتحديثه.
- **401 Unauthorized من Webhook:** هذا متوقع عند الاختبار اليدوي من دون Azure JWT — ويعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع manifest

- **"Icon file cannot be empty":** يشير manifest إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (32x32 لـ `outline.png` و192x192 لـ `color.png`).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتًا في فريق/دردشة أخرى. اعثر عليه وأزل تثبيته أولًا، أو انتظر 5-10 دقائق حتى الاكتمال.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح أدوات المطور في المتصفح (F12) → علامة تبويب Network، وتحقق من نص الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" — فهذا يتجاوز غالبًا قيود التحميل الجانبي.

### عدم عمل أذونات RSC

1. تحقّق من أن `webApplicationInfo.id` يطابق App ID الخاص بالروبوت لديك تمامًا
2. أعد رفع التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقّق مما إذا كان مسؤول مؤسستك قد حظر أذونات RSC
4. تأكد من أنك تستخدم النطاق الصحيح: ‏`ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` للدردشات الجماعية

## المراجع

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - إنشاء تطبيقات Teams وإدارتها
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (يتطلب channel/group استخدام Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## ذو صلة

<CardGroup cols={2}>
  <Card title="نظرة عامة على القنوات" icon="list" href="/ar/channels">
    جميع القنوات المدعومة.
  </Card>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    مصادقة الرسائل المباشرة وتدفق الاقتران.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك الدردشة الجماعية وتقييد الإشارات.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    توجيه الجلسات للرسائل.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج الوصول والتقوية.
  </Card>
</CardGroup>
