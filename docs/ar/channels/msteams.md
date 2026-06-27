---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم روبوت Microsoft Teams وإمكاناته وتكوينه
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T17:12:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Status: يتم دعم النص + مرفقات الرسائل المباشرة؛ يتطلب إرسال ملفات القناة/المجموعة `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في محادثات المجموعة](#sending-files-in-group-chats)). تُرسل الاستطلاعات عبر Adaptive Cards. تعرض إجراءات الرسائل `upload-file` صريحًا للإرسال الذي يبدأ بالملفات.

## Plugin المضمّن

يُشحن Microsoft Teams بصفته Plugin مضمّنًا في إصدارات OpenClaw الحالية، لذلك لا يلزم
تثبيت منفصل في البناء المعبأ العادي.

إذا كنت تستخدم بناءً أقدم أو تثبيتًا مخصصًا يستبعد Teams المضمّن،
فثبّت حزمة npm مباشرةً:

```bash
openclaw plugins install @openclaw/msteams
```

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا محددًا
فقط عندما تحتاج إلى تثبيت قابل للتكرار.

نسخة محلية من المستودع (عند التشغيل من مستودع git):

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
إن Teams CLI في وضع المعاينة حاليًا. قد تتغير الأوامر والرايات بين الإصدارات.
</Note>

**2. ابدأ نفقًا** (لا يستطيع Teams الوصول إلى localhost)

ثبّت CLI الخاص بـ devtunnel وصادقه إذا لم تكن قد فعلت ذلك بالفعل ([دليل البدء](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

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

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (لكن قد تغيّر هذه عناوين URL في كل جلسة).

**3. أنشئ التطبيق**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

ينفّذ هذا الأمر الواحد ما يلي:

- ينشئ تطبيق Entra ID (Azure AD)
- يولّد سر عميل
- يبني ويرفع بيان تطبيق Teams (مع الأيقونات)
- يسجّل البوت (تتم إدارته بواسطة Teams افتراضيًا - لا حاجة إلى اشتراك Azure)

سيعرض الناتج `CLIENT_ID` و`CLIENT_SECRET` و`TENANT_ID` و**معرّف تطبيق Teams** - دوّنها للخطوات التالية. كما يعرض خيار تثبيت التطبيق في Teams مباشرةً.

**4. اضبط OpenClaw** باستخدام بيانات الاعتماد من الناتج:

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

أو استخدم متغيرات البيئة مباشرةً: `MSTEAMS_APP_ID` و`MSTEAMS_APP_PASSWORD` و`MSTEAMS_TENANT_ID`.

**5. ثبّت التطبيق في Teams**

سيطالبك `teams app create` بتثبيت التطبيق - اختر "Install in Teams". إذا تخطيت ذلك، يمكنك الحصول على الرابط لاحقًا:

```bash
teams app get <teamsAppId> --install-link
```

**6. تحقق من أن كل شيء يعمل**

```bash
teams app doctor <teamsAppId>
```

يشغّل هذا تشخيصات عبر تسجيل البوت، وضبط تطبيق AAD، وصحة البيان، وإعداد SSO.

لعمليات النشر الإنتاجية، فكّر في استخدام [المصادقة الموحدة](/ar/channels/msteams#federated-authentication-certificate-plus-managed-identity) (شهادة أو هوية مُدارة) بدل أسرار العميل.

<Note>
تُحظر محادثات المجموعة افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بردود المجموعة، اضبط `channels.msteams.groupAllowFrom`، أو استخدم `groupPolicy: "open"` للسماح لأي عضو (مقيد بالإشارة).
</Note>

## الأهداف

- التحدث إلى OpenClaw عبر الرسائل المباشرة في Teams أو محادثات المجموعة أو القنوات.
- إبقاء التوجيه حتميًا: تعود الردود دائمًا إلى القناة التي وردت منها.
- اعتماد سلوك قناة آمن افتراضيًا (الإشارات مطلوبة ما لم يُضبط خلاف ذلك).

## عمليات كتابة الضبط

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات الضبط التي يشغّلها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**الوصول للرسائل المباشرة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يتم تجاهل المرسلين غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائن AAD مستقرة أو مجموعات وصول مرسل ثابتة مثل `accessGroup:core-team`.
- لا تعتمد على مطابقة UPN/اسم العرض لقوائم السماح - فقد تتغير. يعطّل OpenClaw مطابقة الأسماء المباشرة افتراضيًا؛ اشترك فيها صراحةً باستخدام `channels.msteams.dangerouslyAllowNameMatching: true`.
- يمكن للمعالج حل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد.

**وصول المجموعة**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عندما لا يكون مضبوطًا.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين أو مجموعات وصول المرسلين الثابتة التي يمكنها التشغيل في محادثات/قنوات المجموعة (يرجع إلى `channels.msteams.allowFrom`).
- اضبط `groupPolicy: "open"` للسماح لأي عضو (مع بقائه مقيدًا بالإشارة افتراضيًا).
- للسماح بـ **عدم وجود قنوات**، اضبط `channels.msteams.groupPolicy: "disabled"`.

مثال:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + قائمة سماح القنوات**

- حدّد نطاق ردود المجموعة/القناة عبر سرد الفرق والقنوات ضمن `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات محادثات Teams المستقرة من روابط Teams، لا أسماء العرض القابلة للتغيير.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، تُقبل الفرق/القنوات المدرجة فقط (مقيدة بالإشارة).
- يقبل معالج الضبط إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يحل OpenClaw أسماء قائمة سماح الفريق/القناة والمستخدم إلى معرّفات (عندما تسمح أذونات Graph)
  ويسجل الربط؛ تُحفظ أسماء الفريق/القناة غير المحلولة كما كُتبت، لكنها تُتجاهل للتوجيه افتراضيًا ما لم يُفعّل `channels.msteams.dangerouslyAllowNameMatching: true`.

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
<summary><strong>الإعداد اليدوي (بدون Teams CLI)</strong></summary>

إذا لم تتمكن من استخدام Teams CLI، يمكنك إعداد البوت يدويًا عبر Azure Portal.

### كيف يعمل

1. تأكد من توفر Microsoft Teams plugin (مضمّن في الإصدارات الحالية).
2. أنشئ **Azure Bot** (معرّف التطبيق + السر + معرّف المستأجر).
3. ابنِ **حزمة تطبيق Teams** تشير إلى البوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams في فريق (أو نطاق شخصي للرسائل المباشرة).
5. اضبط `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway لحركة Bot Framework Webhook على `/api/messages` افتراضيًا.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [إنشاء Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ علامة تبويب **الأساسيات**:

   | الحقل              | القيمة                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **مقبض البوت**     | اسم البوت الخاص بك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **الاشتراك**   | اختر اشتراك Azure الخاص بك                           |
   | **مجموعة الموارد** | أنشئ جديدًا أو استخدم الموجود                               |
   | **فئة التسعير**   | **مجاني** للتطوير/الاختبار                                 |
   | **نوع التطبيق**    | **مستأجر واحد** (موصى به - راجع الملاحظة أدناه)         |
   | **نوع الإنشاء**  | **إنشاء معرّف تطبيق Microsoft جديد**                          |

<Warning>
أُلغي إنشاء بوتات متعددة المستأجرين جديدة بعد 2025-07-31. استخدم **مستأجر واحد** للبوتات الجديدة.
</Warning>

3. انقر **مراجعة + إنشاء** → **إنشاء** (انتظر نحو 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot الخاص بك → **التكوين**
2. انسخ **معرّف تطبيق Microsoft** → هذا هو `appId`
3. انقر **إدارة كلمة المرور** → انتقل إلى تسجيل التطبيق
4. ضمن **الشهادات والأسرار** → **سر عميل جديد** → انسخ **القيمة** → هذا هو `appPassword`
5. انتقل إلى **نظرة عامة** → انسخ **معرّف الدليل (المستأجر)** → هذا هو `tenantId`

### الخطوة 3: ضبط نقطة نهاية المراسلة

1. في Azure Bot → **التكوين**
2. اضبط **نقطة نهاية المراسلة** إلى عنوان URL الخاص بـ webhook:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تفعيل قناة Teams

1. في Azure Bot → **القنوات**
2. انقر **Microsoft Teams** → تكوين → حفظ
3. اقبل شروط الخدمة

### الخطوة 5: بناء بيان تطبيق Teams

- ضمّن إدخال `bot` مع `botId = <App ID>`.
- النطاقات: `personal` و`team` و`groupChat`.
- `supportsFiles: true` (مطلوب لمعالجة الملفات في النطاق الشخصي).
- أضف أذونات RSC (راجع [أذونات RSC](#current-teams-rsc-permissions-manifest)).
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

تبدأ قناة Teams تلقائيًا عندما يكون Plugin متاحًا ويكون ضبط `msteams` موجودًا مع بيانات الاعتماد.

</details>

## المصادقة الموحدة (شهادة بالإضافة إلى هوية مُدارة)

> أُضيفت في 2026.4.11

لعمليات النشر الإنتاجية، يدعم OpenClaw **المصادقة الموحدة** كبديل أكثر أمانًا لأسرار العميل. تتوفر طريقتان:

### الخيار أ: المصادقة القائمة على الشهادات

استخدم شهادة PEM مسجلة مع تسجيل تطبيق Entra ID الخاص بك.

**الإعداد:**

1. ولّد أو احصل على شهادة (تنسيق PEM مع مفتاح خاص).
2. في Entra ID → تسجيل التطبيق → **الشهادات والأسرار** → **الشهادات** → ارفع الشهادة العامة.

**الضبط:**

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

**كيف يعمل:**

1. لدى حاوية البوت/الجهاز الافتراضي هوية مُدارة (معينة من النظام أو معينة من المستخدم).
2. يربط **اعتماد هوية موحدة** الهوية المُدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على الرموز من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يُمرَّر الرمز إلى Teams SDK لمصادقة البوت.

**المتطلبات الأساسية:**

- بنية Azure التحتية مع تفعيل الهوية المُدارة (هوية حمل عمل AKS، App Service، VM)
- اعتماد هوية موحدة تم إنشاؤه على تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من الحاوية/الجهاز الافتراضي

**الضبط (هوية مُدارة معينة من النظام):**

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

**الإعدادات (هوية مُدارة معيّنة من المستخدم):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (للهوية المعيّنة من المستخدم فقط)

### إعداد هوية حمل العمل في AKS

لعمليات نشر AKS التي تستخدم هوية حمل العمل:

1. **فعّل هوية حمل العمل** على عنقود AKS.
2. **أنشئ بيانات اعتماد هوية اتحادية** في تسجيل تطبيق Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **أضف تعليقا توضيحيا إلى حساب خدمة Kubernetes** بمعرّف عميل التطبيق:

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

5. **تأكد من توفر وصول الشبكة** إلى IMDS (`169.254.169.254`) - إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج تسمح بمرور البيانات إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة | الإعداد | المزايا | العيوب |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **سر العميل** | `appPassword` | إعداد بسيط | يتطلب تدوير السر، أقل أمانا |
| **الشهادة** | `authType: "federated"` + `certificatePath` | لا يوجد سر مشترك عبر الشبكة | عبء إدارة الشهادات |
| **الهوية المُدارة** | `authType: "federated"` + `useManagedIdentity` | بلا كلمات مرور، لا أسرار لإدارتها | تتطلب بنية Azure التحتية |

**السلوك الافتراضي:** عند عدم ضبط `authType`، يستخدم OpenClaw افتراضيا مصادقة سر العميل. تستمر الإعدادات الحالية في العمل دون تغييرات.

## التطوير المحلي (الأنفاق)

لا يستطيع Teams الوصول إلى `localhost`. استخدم نفق تطوير دائم حتى يبقى عنوان URL الخاص بك ثابتا عبر الجلسات:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (قد تتغير عناوين URL في كل جلسة).

إذا تغيّر عنوان URL للنفق، فحدّث نقطة النهاية:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## اختبار البوت

**تشغيل التشخيصات:**

```bash
teams app doctor <teamsAppId>
```

يتحقق من تسجيل البوت، وتطبيق AAD، والبيان، وإعداد SSO في تمريرة واحدة.

**إرسال رسالة اختبار:**

1. ثبّت تطبيق Teams (استخدم رابط التثبيت من `teams app get <id> --install-link`)
2. ابحث عن البوت في Teams وأرسل رسالة مباشرة
3. تحقق من سجلات Gateway للنشاط الوارد

## متغيرات البيئة

يمكن ضبط جميع مفاتيح الإعداد عبر متغيرات البيئة بدلا من ذلك:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (اتحادي + شهادة)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
- `MSTEAMS_USE_MANAGED_IDENTITY` (اتحادي + هوية مُدارة)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (لهوية MI المعيّنة من المستخدم فقط)

## إجراء معلومات العضو

يوفّر OpenClaw إجراء `member-info` المدعوم من Graph لـ Microsoft Teams حتى تتمكن الوكلاء والأتمتات من حل تفاصيل أعضاء القناة (اسم العرض، البريد الإلكتروني، الدور) مباشرة من Microsoft Graph.

المتطلبات:

- إذن RSC `Member.Read.Group` (موجود بالفعل في البيان الموصى به)
- لعمليات البحث عبر الفرق: إذن تطبيق Graph `User.Read.All` مع موافقة المسؤول

يخضع الإجراء للتحكم بواسطة `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عند توفر بيانات اعتماد Graph).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القناة/المجموعة الحديثة التي تُغلّف داخل الموجّه.
- يعود إلى `messages.groupChat.historyLimit`. اضبطه على `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل السلسلة الذي تم جلبه حسب قوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذلك لا يتضمن تمهيد سياق السلسلة إلا رسائل من مرسلين مسموح لهم.
- يُمرّر سياق المرفقات المقتبسة (`ReplyTo*` المشتق من HTML رد Teams) حاليا كما تم استلامه.
- بعبارة أخرى، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ ولا تتم تصفية سوى مسارات سياق تكميلية محددة اليوم.
- يمكن تقييد سجل الرسائل المباشرة باستخدام `channels.msteams.dmHistoryLimit` (دورات المستخدم). التجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات RSC الحالية في Teams (البيان)

هذه هي **الأذونات resourceSpecific الحالية** في بيان تطبيق Teams لدينا. لا تنطبق إلا داخل الفريق/الدردشة حيث تم تثبيت التطبيق.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` (تطبيق) - استلام جميع رسائل القنوات دون @mention
- `ChannelMessage.Send.Group` (تطبيق)
- `Member.Read.Group` (تطبيق)
- `Owner.Read.Group` (تطبيق)
- `ChannelSettings.Read.Group` (تطبيق)
- `TeamMember.Read.Group` (تطبيق)
- `TeamSettings.Read.Group` (تطبيق)

**لدردشات المجموعات:**

- `ChatMessage.Read.Chat` (تطبيق) - استلام جميع رسائل دردشات المجموعات دون @mention

لإضافة أذونات RSC عبر Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## مثال على بيان Teams (منقّح)

مثال بسيط وصالح يحتوي على الحقول المطلوبة. استبدل المعرّفات وعناوين URL.

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

### محاذير البيان (حقول لا بد منها)

- يجب أن يطابق `bots[].botId` **معرّف تطبيق Azure Bot**.
- يجب أن يطابق `webApplicationInfo.id` **معرّف تطبيق Azure Bot**.
- يجب أن تتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal`، `team`، `groupChat`).
- يلزم `bots[].supportsFiles: true` لمعالجة الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` قراءة/إرسال القناة إذا كنت تريد حركة مرور القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبّت بالفعل (على سبيل المثال، لإضافة أذونات RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

بعد التحديث، أعد تثبيت التطبيق في كل فريق حتى تصبح الأذونات الجديدة نافذة، و**أغلق Teams بالكامل ثم أعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح بيانات تعريف التطبيق المخزنة مؤقتا.

<details>
<summary>تحديث البيان يدويا (دون CLI)</summary>

1. حدّث `manifest.json` بالإعدادات الجديدة
2. **زِد حقل `version`** (مثلا، `1.0.0` → `1.1.0`)
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json`، `outline.png`، `color.png`)
4. ارفع ملف zip الجديد:
   - **مركز إدارة Teams:** تطبيقات Teams → إدارة التطبيقات → اعثر على تطبيقك → رفع إصدار جديد
   - **التحميل الجانبي:** في Teams → التطبيقات → إدارة تطبيقاتك → رفع تطبيق مخصص

</details>

## القدرات: RSC فقط مقابل Graph

### باستخدام **Teams RSC فقط** (التطبيق مثبّت، بلا أذونات Graph API)

يعمل:

- قراءة محتوى **نص** رسالة القناة.
- إرسال محتوى **نص** رسالة القناة.
- استلام مرفقات ملفات **شخصية (DM)**.

لا يعمل:

- **محتويات الصور أو الملفات** في القنوات/المجموعات (لا تتضمن الحمولة إلا بنية HTML بديلة).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (بعد حدث Webhook المباشر).

### باستخدام **Teams RSC + أذونات تطبيق Microsoft Graph**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة في الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القناة/الدردشة عبر Graph.

### RSC مقابل Graph API

| القدرة | أذونات RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل في الوقت الحقيقي** | نعم (عبر Webhook) | لا (استطلاع فقط) |
| **الرسائل التاريخية** | لا | نعم (يمكن الاستعلام عن السجل) |
| **تعقيد الإعداد** | بيان التطبيق فقط | يتطلب موافقة مسؤول + تدفق رمز مميز |
| **يعمل دون اتصال** | لا (يجب أن يكون قيد التشغيل) | نعم (استعلم في أي وقت) |

**الخلاصة:** RSC مخصص للاستماع في الوقت الحقيقي؛ وGraph API مخصص للوصول التاريخي. للحاق بالرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط والسجل المفعّلان عبر Graph (مطلوبان للقنوات)

إذا كنت تحتاج إلى الصور/الملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب تمكين أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **تسجيل التطبيق** في Entra ID (Azure AD)، أضف **أذونات تطبيق** Microsoft Graph:
   - `ChannelMessage.Read.All` (مرفقات القناة + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (دردشات المجموعات)
2. **امنح موافقة المسؤول** للمستأجر.
3. ارفع **إصدار بيان** تطبيق Teams، وأعد رفعه، و**أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams بالكامل ثم أعد تشغيله** لمسح بيانات تعريف التطبيق المخزنة مؤقتا.

**إذن إضافي لإشارات المستخدمين:** تعمل إشارات @mention للمستخدمين مباشرة للمستخدمين الموجودين في المحادثة. ومع ذلك، إذا كنت تريد البحث ديناميكيا عن مستخدمين **غير موجودين في المحادثة الحالية** والإشارة إليهم، فأضف إذن `User.Read.All` (تطبيق) وامنح موافقة المسؤول.

## القيود المعروفة

### مهل Webhook

يرسل Teams الرسائل عبر Webhook HTTP. إذا استغرقت المعالجة وقتا طويلا جدا (مثل بطء استجابات LLM)، فقد ترى:

- انتهاء مهلات Gateway
- إعادة Teams محاولة إرسال الرسالة (ما يسبب تكرارات)
- إسقاط الردود

يتعامل OpenClaw مع ذلك عبر الرجوع بسرعة وإرسال الردود بشكل استباقي، لكن الردود البطيئة جدا قد تظل تسبب مشكلات.

### دعم سحابة Teams وعنوان URL للخدمة

مسار Teams المدعوم بحزمة SDK هذا موثق بالتحقق الحي لسحابة Microsoft Teams العامة.

تستخدم الردود الواردة سياق دورة Teams SDK الوارد. أما العمليات الاستباقية خارج السياق - الإرسال، والتعديلات، والحذف، والبطاقات، والاستطلاعات، ورسائل موافقة الملفات، والردود الطويلة قيد الانتظار - فتستخدم `serviceUrl` الخاص بمرجع المحادثة المخزن. تستخدم السحابة العامة افتراضيا بيئة السحابة العامة في Teams SDK وتسمح بالمراجع المخزنة على مضيف Teams Connector العام: `https://smba.trafficmanager.net/`.

السحابة العامة هي الإعداد الافتراضي. لا تحتاج إلى ضبط `channels.msteams.cloud` أو `channels.msteams.serviceUrl` للروبوتات العادية في السحابة العامة.

بالنسبة إلى سحابات Teams غير العامة، اضبط `cloud` والحد الاستباقي المطابق عندما تنشر Microsoft واحدا:

- يحدد `channels.msteams.cloud` إعداد السحابة المسبق في Teams SDK للمصادقة، والتحقق من JWT، وخدمات الرموز، ونطاق Graph.
- يحدد `channels.msteams.serviceUrl` حد نقطة نهاية Bot Connector المستخدم للتحقق من مراجع المحادثات المخزنة قبل عمليات الإرسال الاستباقية، والتعديلات، والحذف، والبطاقات، والاستطلاعات، ورسائل موافقة الملفات، والردود الطويلة قيد الانتظار. وهو مطلوب لسحابتي USGov وDoD في SDK. بالنسبة إلى China/21Vianet، يستخدم OpenClaw إعداد SDK المسبق `China` ويقبل عناوين URL للخدمة المخزنة/المهيأة فقط على مضيفي قناة Azure China Bot Framework.

تنشر Microsoft نقاط نهاية Bot Connector الاستباقية العامة في قسم [إنشاء المحادثة](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) من وثائق المراسلة الاستباقية في Teams. استخدم `serviceUrl` للنشاط الوارد عند توفره؛ وإذا كنت تحتاج إلى نقطة نهاية استباقية عامة، فاستخدم جدول Microsoft.

| بيئة Teams | تهيئة OpenClaw                                             | `serviceUrl` الاستباقي                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| العامة            | لا حاجة إلى تهيئة cloud/serviceUrl                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | اضبط `serviceUrl`؛ لا يوجد إعداد سحابة مسبق منفصل في Teams SDK | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | استخدم `serviceUrl` للنشاط الوارد           |

مثال لـ GCC، حيث توثق Microsoft عنوان URL منفصلا للخدمة الاستباقية لكن Teams SDK لا يتيح إعداد سحابة GCC مسبقا ومنفصلا:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

مثال لـ GCC High:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

يقتصر `channels.msteams.serviceUrl` على مضيفي Microsoft Teams Bot Connector المدعومين. عند تهيئة عنوان URL للخدمة، يتحقق OpenClaw من أن `serviceUrl` للمحادثة المخزنة يستخدم المضيف نفسه قبل تشغيل عمليات الإرسال الاستباقية، أو التعديلات، أو الحذف، أو البطاقات، أو الاستطلاعات، أو الردود الطويلة قيد الانتظار. مع تهيئة السحابة العامة الافتراضية، يفشل OpenClaw بشكل مغلق إذا كانت محادثة مخزنة تشير إلى خارج مضيف Teams Connector العام. استقبل رسالة جديدة من المحادثة بعد تغيير إعدادات السحابة/عنوان URL للخدمة حتى يكون مرجع المحادثة المخزن حديثا.

لا تملك China/21Vianet عنوان URL استباقيا عاما ومنفصلا بصيغة `smba` في جدول نقاط النهاية الاستباقية لـ Teams من Microsoft. هيئ `cloud: "China"` حتى يستخدم Teams SDK نقاط نهاية المصادقة والرموز وJWT الخاصة بـ Azure China. بعد ذلك تتطلب عمليات الإرسال الاستباقية مرجع محادثة مخزنا من نشاط Teams وارد في China، أو عنوان URL خدمة مهيأ صراحة، على حد قناة Azure China Bot Framework (`*.botframework.azure.cn`). مساعدات Teams المدعومة بـ Graph معطلة حاليا لـ `cloud: "China"` إلى أن يوجه OpenClaw طلبات Graph عبر نقطة نهاية Azure China Graph.

### التنسيق

Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق**، _مائل_، `code`، الروابط
- قد لا يعرض Markdown المعقد (الجداول، والقوائم المتداخلة) بشكل صحيح
- بطاقات Adaptive Cards مدعومة للاستطلاعات وعمليات إرسال العرض الدلالي (انظر أدناه)

## التهيئة

الإعدادات الرئيسية (انظر `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تمكين/تعطيل القناة.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: بيانات اعتماد الروبوت.
- `channels.msteams.cloud`: بيئة سحابة Teams SDK (`Public`، أو `USGov`، أو `USGovDoD`، أو `China`؛ الافتراضي `Public`). اضبط هذا مع `serviceUrl` لسحابتي USGov/DoD في SDK؛ تستخدم China إعداد SDK المسبق ومراجع محادثات Azure China Bot Framework المخزنة، مع تعطيل المساعدات المدعومة بـ Graph إلى أن ينفذ توجيه Azure China Graph.
- `channels.msteams.serviceUrl`: حد عنوان URL لخدمة Bot Connector للعمليات الاستباقية في SDK. تستخدم السحابة العامة الإعداد الافتراضي في SDK؛ اضبط هذا لـ GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`) أو GCC High أو DoD. تقبل China مضيفي قناة Azure China Bot Framework عندما يأتي مرجع المحادثة المخزن من Teams المشغل بواسطة 21Vianet.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة سماح للرسائل المباشرة (يوصى بمعرفات كائنات AAD). يحل المعالج الأسماء إلى معرفات أثناء الإعداد عندما يتوفر وصول Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تمكين مطابقة UPN/اسم العرض القابلة للتغيير والتوجيه المباشر باسم الفريق/القناة.
- `channels.msteams.textChunkLimit`: حجم مقطع النص الصادر.
- `channels.msteams.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة سماح لمضيفي المرفقات الواردة (تكون افتراضيا نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة سماح لإرفاق ترويسات Authorization عند إعادة محاولة الوسائط (تكون افتراضيا مضيفي Graph + Bot Framework).
- `channels.msteams.requireMention`: طلب @mention في القنوات/المجموعات (الافتراضي true).
- `channels.msteams.replyStyle`: `thread | top-level` (انظر [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) المستخدمة عند غياب تجاوز القناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مرسل (حرف البدل `"*"` مدعوم).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مرسل (حرف البدل `"*"` مدعوم).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `channel:`، `id:`، `e164:`، `username:`، `name:` (المفاتيح القديمة بلا بادئة لا تزال تعين إلى `id:` فقط).
- `channels.msteams.actions.memberInfo`: تمكين أو تعطيل إجراء معلومات العضو المدعوم بـ Graph (الافتراضي: مفعّل عند توفر بيانات اعتماد Graph).
- `channels.msteams.authType`: نوع المصادقة - `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (مصادقة اتحادية + مصادقة بالشهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختيارية، غير مطلوبة للمصادقة).
- `channels.msteams.useManagedIdentity`: تمكين مصادقة الهوية المدارة (الوضع الاتحادي).
- `channels.msteams.managedIdentityClientId`: معرف العميل للهوية المدارة المعينة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرف موقع SharePoint لرفع الملفات في محادثات/قنوات المجموعات (انظر [إرسال الملفات في محادثات المجموعات](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسة تنسيق الوكيل القياسي (انظر [/concepts/session](/ar/concepts/session)):
  - تشارك الرسائل المباشرة الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: السلاسل مقابل المنشورات

قدمت Teams مؤخرا نمطي واجهة مستخدم للقنوات فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                               | `replyStyle` الموصى به |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **المنشورات** (الكلاسيكي)      | تظهر الرسائل كبطاقات مع ردود مترابطة أسفلها | `thread` (الافتراضي)       |
| **السلاسل** (شبيهة بـ Slack) | تتدفق الرسائل خطيا، أشبه بـ Slack                   | `top-level`              |

**المشكلة:** لا تتيح Teams API معرفة نمط واجهة المستخدم الذي تستخدمه القناة. إذا استخدمت `replyStyle` غير الصحيح:

- `thread` في قناة بنمط السلاسل → تظهر الردود متداخلة بشكل مربك
- `top-level` في قناة بنمط المنشورات → تظهر الردود كمنشورات مستقلة في المستوى الأعلى بدلا من داخل السلسلة

**الحل:** هيئ `replyStyle` لكل قناة استنادا إلى كيفية إعداد القناة:

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

### أسبقية الحل

عندما يرسل الروبوت ردا إلى قناة، يتم حل `replyStyle` من التجاوز الأكثر تحديدا وصولا إلى الإعداد الافتراضي. تفوز أول قيمة غير `undefined`:

1. **لكل قناة** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **لكل فريق** — `channels.msteams.teams.<teamId>.replyStyle`
3. **عام** — `channels.msteams.replyStyle`
4. **افتراضي ضمني** — مشتق من `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

إذا ضبطت `requireMention: false` عالميا دون `replyStyle` صريح، فستظهر الإشارات في القنوات بنمط المنشورات كمنشورات في المستوى الأعلى حتى عندما كان الوارد ردا داخل سلسلة. ثبت `replyStyle: "thread"` على المستوى العام أو مستوى الفريق أو القناة لتجنب المفاجآت.

### الحفاظ على سياق السلسلة

عندما يكون `replyStyle: "thread"` ساريا ويكون الروبوت قد ذُكر عبر @mention من داخل سلسلة قناة، يعيد OpenClaw إرفاق جذر السلسلة الأصلي بمرجع المحادثة الصادر (`19:…@thread.tacv2;messageid=<root>`) حتى يصل الرد داخل السلسلة نفسها. ينطبق هذا على كل من عمليات الإرسال الحية (داخل الدورة) وعمليات الإرسال الاستباقية التي تتم بعد انتهاء صلاحية سياق دورة Bot Framework (مثل الوكلاء طويلي التشغيل، وردود استدعاءات الأدوات قيد الانتظار عبر `mcp__openclaw__message`).

يؤخذ جذر السلسلة من `threadId` المخزن على مرجع المحادثة. المراجع المخزنة الأقدم التي تسبق `threadId` تعود إلى `activityId` (أي نشاط وارد بذر المحادثة آخر مرة)، لذلك تواصل النشرات الحالية العمل دون إعادة بذر.

عندما يكون `replyStyle: "top-level"` مفعّلًا، تُجاب الواردات في خيوط القناة عمدًا كمنشورات جديدة على المستوى الأعلى — ولا تُرفق أي لاحقة خيط. هذا هو السلوك الصحيح للقنوات ذات نمط Threads؛ إذا رأيت منشورات على المستوى الأعلى بينما كنت تتوقع ردودًا ضمن خيط، فهذا يعني أن `replyStyle` مضبوط بشكل غير صحيح لتلك القناة.

## المرفقات والصور

**القيود الحالية:**

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر واجهات API لملفات بوت Teams.
- **القنوات/المجموعات:** توجد المرفقات في تخزين M365 ‏(SharePoint/OneDrive). تتضمن حمولة Webhook قالب HTML فقط، وليس بايتات الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- للإرسال الصريح الذي يبدأ بملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ يصبح `message` الاختياري النص/التعليق المصاحب، ويتجاوز `filename` الاسم المرفوع.

من دون أذونات Graph، ستُستقبل رسائل القنوات التي تحتوي على صور كنص فقط (لا يمكن للبوت الوصول إلى محتوى الصورة).
افتراضيًا، لا ينزّل OpenClaw الوسائط إلا من أسماء مضيفي Microsoft/Teams. تجاوز ذلك باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
لا تُرفق ترويسات التفويض إلا للمضيفين في `channels.msteams.mediaAuthAllowHosts` (القيمة الافتراضية هي مضيفو Graph + Bot Framework). أبقِ هذه القائمة صارمة (تجنب اللواحق متعددة المستأجرين).

## إرسال الملفات في دردشات المجموعات

يمكن للبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard (مدمج). ومع ذلك، فإن **إرسال الملفات في دردشات المجموعات/القنوات** يتطلب إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                           | الإعداد المطلوب                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة**                  | FileConsentCard → يقبل المستخدم → يرفع البوت | يعمل مباشرة                            |
| **دردشات المجموعات/القنوات** | الرفع إلى SharePoint → مشاركة رابط            | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | مضمنة بترميز Base64                        | يعمل مباشرة                            |

### لماذا تحتاج دردشات المجموعات إلى SharePoint

لا تمتلك البوتات محرك OneDrive شخصيًا (لا تعمل نقطة نهاية Graph API ‏`/me/drive` لهويات التطبيقات). لإرسال الملفات في دردشات المجموعات/القنوات، يرفع البوت إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID ‏(Azure AD) → تسجيل التطبيق:
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

| الإذن                              | سلوك المشاركة                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` فقط              | رابط مشاركة على مستوى المؤسسة (يمكن لأي شخص في المؤسسة الوصول) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | رابط مشاركة لكل مستخدم (يمكن لأعضاء الدردشة فقط الوصول)      |

المشاركة لكل مستخدم أكثر أمانًا لأن المشاركين في الدردشة وحدهم يمكنهم الوصول إلى الملف. إذا كان إذن `Chat.Read.All` مفقودًا، يعود البوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع الاحتياطي

| السيناريو                                          | النتيجة                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| دردشة مجموعة + ملف + `sharePointSiteId` مهيأ | الرفع إلى SharePoint، وإرسال رابط مشاركة            |
| دردشة مجموعة + ملف + بلا `sharePointSiteId`         | محاولة الرفع إلى OneDrive (قد تفشل)، وإرسال نص فقط |
| دردشة شخصية + ملف                              | تدفق FileConsentCard (يعمل من دون SharePoint)    |
| أي سياق + صورة                               | مضمنة بترميز Base64 (تعمل من دون SharePoint)   |

### موقع تخزين الملفات

تُخزن الملفات المرفوعة في مجلد `/OpenClawShared/` داخل مكتبة المستندات الافتراضية لموقع SharePoint المهيأ.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams كـ Adaptive Cards (لا توجد واجهة API أصلية لاستطلاعات Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- تُسجل الأصوات بواسطة Gateway في SQLite لحالة Plugin في OpenClaw ضمن `state/openclaw.sqlite`.
- تُستورد ملفات `msteams-polls.json` الموجودة بواسطة `openclaw doctor --fix`، وليس بواسطة Plugin الجاري تشغيله.
- يجب أن يبقى Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا بعد، ولا توجد CLI مدعومة لنتائج الاستطلاع بعد.

## بطاقات العرض التقديمي

أرسل حمولات عرض تقديمي دلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI أو تسليم الردود العادي. يعرضها OpenClaw كـ Adaptive Cards في Teams من عقد العرض التقديمي العام.

تقبل معلمة `presentation` كتلًا دلالية. عند توفير `presentation`، يكون نص الرسالة اختياريًا. تُعرض الأزرار كإجراءات إرسال في Adaptive Card أو إجراءات URL. قوائم الاختيار ليست أصلية بعد في عارض Teams، لذلك يحولها OpenClaw إلى نص مقروء قبل التسليم.

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

| نوع الهدف         | التنسيق                           | المثال                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| مستخدم (بالمعرف)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| مستخدم (بالاسم)      | `user:<display-name>`            | `user:John Smith` (يتطلب Graph API)              |
| مجموعة/قناة       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| مجموعة/قناة (خام) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (إذا كان يحتوي على `@thread`) |

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

<Note>
من دون بادئة `user:`، تُعامل الأسماء افتراضيًا كدقة مجموعة أو فريق. استخدم دائمًا `user:` عند استهداف الأشخاص باسم العرض.
</Note>

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** أن يتفاعل المستخدم، لأننا نخزن مراجع المحادثة عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة `dmPolicy` وحراسة قائمة السماح.

## معرفات الفريق والقناة (مشكلة شائعة)

معلمة الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليست** معرف الفريق المستخدم للتهيئة. استخرج المعرفات من مسار URL بدلًا من ذلك:

**عنوان URL للفريق:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**عنوان URL للقناة:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**للتهيئة:**

- مفتاح الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`؛ قد تعرض المستأجرات الأقدم `@thread.skype`، وهو صالح أيضًا)
- مفتاح القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معلمة الاستعلام `groupId` لتوجيه OpenClaw. إنها معرف مجموعة Microsoft Entra، وليست معرف محادثة Bot Framework المستخدم في أنشطة Teams الواردة.

## القنوات الخاصة

لدى البوتات دعم محدود في القنوات الخاصة:

| الميزة                      | القنوات القياسية | القنوات الخاصة       |
| ---------------------------- | ----------------- | ---------------------- |
| تثبيت البوت             | نعم               | محدود                |
| الرسائل الفورية (Webhook) | نعم               | قد لا تعمل           |
| أذونات RSC              | نعم               | قد تتصرف بشكل مختلف |
| @mentions                    | نعم               | إذا كان البوت قابلًا للوصول   |
| سجل Graph API            | نعم               | نعم (مع الأذونات) |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات البوت
2. استخدم الرسائل المباشرة - يمكن للمستخدمين دائمًا مراسلة البوت مباشرة
3. استخدم Graph API للوصول التاريخي (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### المشكلات الشائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams بالكامل ثم أعد فتحه.
- **لا توجد ردود في القناة:** الإشارات مطلوبة افتراضيًا؛ اضبط `channels.msteams.requireMention=false` أو هيّئ ذلك لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض البيان القديم):** أزل التطبيق وأعد إضافته، ثم أغلق Teams بالكامل لتحديثه.
- **401 Unauthorized من Webhook:** متوقع عند الاختبار يدويًا من دون Azure JWT - يعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع البيان

- **"Icon file cannot be empty":** يشير البيان إلى ملفات أيقونات بحجم 0 بايت. أنشئ أيقونات PNG صالحة (32x32 لـ `outline.png`، و192x192 لـ `color.png`).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتًا في فريق/دردشة أخرى. اعثر عليه وأزله أولًا، أو انتظر 5-10 دقائق حتى يكتمل الانتشار.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح أدوات مطور المتصفح (F12) → تبويب Network، وتحقق من نص الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" - غالبًا ما يتجاوز هذا قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقّق من أن `webApplicationInfo.id` يطابق App ID للبوت لديك تمامًا
2. أعد رفع التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقّق مما إذا كان مسؤول مؤسستك قد حظر أذونات RSC
4. أكّد أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` لدردشات المجموعات

## المراجع

- [إنشاء Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [بوابة مطوري Teams](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [مخطط بيان تطبيق Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [استلام رسائل القنوات باستخدام RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع أذونات RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [معالجة ملفات بوت Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (تتطلب القناة/المجموعة Graph)
- [المراسلة الاستباقية](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI لإدارة البوتات

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
