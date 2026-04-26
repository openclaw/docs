---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم روبوت Microsoft Teams وإمكاناته وتهيئته
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

**الحالة:** يتم دعم النص + مرفقات الرسائل المباشرة؛ ويتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في الدردشات الجماعية](#sending-files-in-group-chats)). يتم إرسال الاستطلاعات عبر Adaptive Cards. وتعرض إجراءات الرسائل أمر `upload-file` الصريح لعمليات الإرسال التي تبدأ بالملف.

## Plugin المضمّن

يأتي Microsoft Teams كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا يلزم تثبيت منفصل في البنية المجمّعة العادية.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد Teams المضمّن، فقم بتثبيته يدويًا:

```bash
openclaw plugins install @openclaw/msteams
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

تتعامل [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) مع تسجيل الروبوت وإنشاء البيان وتوليد بيانات الاعتماد بأمر واحد.

**1. التثبيت وتسجيل الدخول**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # تحقق من أنك سجلت الدخول وتعرّف على معلومات المستأجر الخاصة بك
```

> **ملاحظة:** لا يزال Teams CLI حاليًا في مرحلة المعاينة. قد تتغير الأوامر والأعلام بين الإصدارات.

**2. ابدأ نفقًا** (لا يمكن لـ Teams الوصول إلى localhost)

ثبّت وسجّل الدخول إلى devtunnel CLI إذا لم تكن قد فعلت ذلك بالفعل ([دليل البدء](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# إعداد لمرة واحدة (URL دائم عبر الجلسات):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# كل جلسة تطوير:
devtunnel host my-openclaw-bot
# نقطة النهاية الخاصة بك: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **ملاحظة:** إن `--allow-anonymous` مطلوب لأن Teams لا يمكنه المصادقة مع devtunnels. ولا يزال يتم التحقق من كل طلب روبوت وارد تلقائيًا بواسطة Teams SDK.

بدائل: `ngrok http 3978` أو `tailscale funnel 3978` (لكن قد تتغير عناوين URL هذه في كل جلسة).

**3. أنشئ التطبيق**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

يقوم هذا الأمر الواحد بما يلي:

- إنشاء تطبيق Entra ID ‏(Azure AD)
- إنشاء client secret
- بناء ورفع بيان تطبيق Teams (مع الأيقونات)
- تسجيل الروبوت (بإدارة Teams افتراضيًا — دون الحاجة إلى اشتراك Azure)

سيعرض الناتج `CLIENT_ID` و`CLIENT_SECRET` و`TENANT_ID` و**Teams App ID** — دوّن هذه القيم للخطوات التالية. كما سيوفر خيار تثبيت التطبيق في Teams مباشرة.

**4. هيّئ OpenClaw** باستخدام بيانات الاعتماد من الناتج:

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

سيطلب منك `teams app create` تثبيت التطبيق — اختر "Install in Teams". وإذا تخطيت ذلك، يمكنك الحصول على الرابط لاحقًا:

```bash
teams app get <teamsAppId> --install-link
```

**6. تحقق من أن كل شيء يعمل**

```bash
teams app doctor <teamsAppId>
```

يشغّل هذا تشخيصات عبر تسجيل الروبوت وتكوين تطبيق AAD وصلاحية البيان وإعداد SSO.

بالنسبة إلى عمليات النشر الإنتاجية، فكّر في استخدام [المصادقة الموحّدة](#federated-authentication-certificate--managed-identity) (شهادة أو هوية مُدارة) بدلًا من client secrets.

ملاحظة: يتم حظر الدردشات الجماعية افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). وللسماح بالردود الجماعية، عيّن `channels.msteams.groupAllowFrom` (أو استخدم `groupPolicy: "open"` للسماح لأي عضو، مع ضبط الإشارة بالذكر).

## الأهداف

- التحدث إلى OpenClaw عبر الرسائل المباشرة في Teams أو الدردشات الجماعية أو القنوات.
- الحفاظ على توجيه حتمي: تعود الردود دائمًا إلى القناة التي وصلت منها.
- اعتماد سلوك قناة آمن افتراضيًا (الإشارات مطلوبة ما لم يتم تكوين خلاف ذلك).

## عمليات كتابة التهيئة

بشكل افتراضي، يُسمح لـ Microsoft Teams بكتابة تحديثات التهيئة التي يتم تشغيلها بواسطة `/config set|unset` (يتطلب `commands.config: true`).

للتعطيل، استخدم:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**الوصول إلى الرسائل المباشرة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يتم تجاهل المرسلين غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائنات AAD مستقرة.
- لا تعتمد على مطابقة UPN/اسم العرض لقوائم السماح — يمكن أن تتغير. يعطّل OpenClaw مطابقة الأسماء المباشرة افتراضيًا؛ ويمكنك التمكين صراحة عبر `channels.msteams.dangerouslyAllowNameMatching: true`.
- يمكن للمعالج تحليل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**الوصول إلى المجموعات**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عندما يكون غير معيّن.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين الذين يمكنهم التشغيل في الدردشات الجماعية/القنوات (مع الرجوع إلى `channels.msteams.allowFrom`).
- عيّن `groupPolicy: "open"` للسماح لأي عضو (مع الاستمرار في ضبط الإشارة بالذكر افتراضيًا).
- لمنع **كل القنوات**، عيّن `channels.msteams.groupPolicy: "disabled"`.

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

**قائمة السماح للفرق + القنوات**

- حدّد نطاق الردود في المجموعات/القنوات عبر إدراج الفرق والقنوات تحت `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات فرق مستقرة ومعرّفات محادثات قنوات مستقرة.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، لا يتم قبول سوى الفرق/القنوات المدرجة (مع ضبط الإشارة بالذكر).
- يقبل معالج التهيئة إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يقوم OpenClaw بتحليل أسماء الفرق/القنوات وأسماء المستخدمين في قائمة السماح إلى معرّفات (عندما تسمح أذونات Graph بذلك)
  ويسجل هذا الربط؛ وتظل أسماء الفرق/القنوات غير المحللة كما كُتبت ولكن يتم تجاهلها في التوجيه افتراضيًا ما لم يتم تمكين `channels.msteams.dangerouslyAllowNameMatching: true`.

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
<summary><strong>إعداد يدوي (من دون Teams CLI)</strong></summary>

إذا لم تتمكن من استخدام Teams CLI، فيمكنك إعداد الروبوت يدويًا عبر Azure Portal.

### كيف يعمل

1. تأكد من توفر Plugin الخاص بـ Microsoft Teams (مضمّن في الإصدارات الحالية).
2. أنشئ **Azure Bot** ‏(App ID + secret + tenant ID).
3. أنشئ **حزمة تطبيق Teams** تشير إلى الروبوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams داخل فريق (أو ضمن النطاق الشخصي للرسائل المباشرة).
5. هيّئ `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway لحركة مرور Bot Framework webhook على `/api/messages` افتراضيًا.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ علامة التبويب **Basics**:

   | الحقل              | القيمة                                                    |
   | ------------------ | --------------------------------------------------------- |
   | **Bot handle**     | اسم الروبوت الخاص بك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **Subscription**   | اختر اشتراك Azure الخاص بك                                |
   | **Resource group** | أنشئ مجموعة جديدة أو استخدم مجموعة موجودة                 |
   | **Pricing tier**   | **Free** للتطوير/الاختبار                                 |
   | **Type of App**    | **Single Tenant** (موصى به - راجع الملاحظة أدناه)         |
   | **Creation type**  | **Create new Microsoft App ID**                           |

> **إشعار الإيقاف:** تم إيقاف إنشاء روبوتات متعددة المستأجرين الجديدة بعد 2025-07-31. استخدم **Single Tenant** للروبوتات الجديدة.

3. انقر على **Review + create** ← **Create** (انتظر نحو 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot الخاص بك ← **Configuration**
2. انسخ **Microsoft App ID** ← هذا هو `appId` الخاص بك
3. انقر على **Manage Password** ← انتقل إلى App Registration
4. ضمن **Certificates & secrets** ← **New client secret** ← انسخ **Value** ← هذا هو `appPassword` الخاص بك
5. انتقل إلى **Overview** ← انسخ **Directory (tenant) ID** ← هذا هو `tenantId` الخاص بك

### الخطوة 3: تهيئة نقطة نهاية المراسلة

1. في Azure Bot ← **Configuration**
2. عيّن **Messaging endpoint** إلى URL الـ webhook الخاص بك:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تمكين قناة Teams

1. في Azure Bot ← **Channels**
2. انقر على **Microsoft Teams** ← Configure ← Save
3. وافق على شروط الخدمة

### الخطوة 5: إنشاء بيان تطبيق Teams

- ضمّن إدخال `bot` مع `botId = <App ID>`.
- النطاقات: `personal` و`team` و`groupChat`.
- `supportsFiles: true` (مطلوب للتعامل مع الملفات ضمن النطاق الشخصي).
- أضف أذونات RSC (راجع [أذونات Teams RSC الحالية](#current-teams-rsc-permissions-manifest)).
- أنشئ الأيقونات: `outline.png` ‏(32x32) و`color.png` ‏(192x192).
- اضغط الملفات الثلاثة معًا: `manifest.json` و`outline.png` و`color.png`.

### الخطوة 6: تهيئة OpenClaw

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

تبدأ قناة Teams تلقائيًا عندما يكون Plugin متاحًا وتوجد تهيئة `msteams` مع بيانات الاعتماد.

</details>

## المصادقة الموحّدة (الشهادة + الهوية المُدارة)

> أُضيفت في 2026.3.24

بالنسبة إلى عمليات النشر الإنتاجية، يدعم OpenClaw **المصادقة الموحّدة** كبديل أكثر أمانًا من client secrets. تتوفر طريقتان:

### الخيار A: المصادقة المعتمدة على الشهادة

استخدم شهادة PEM مسجلة مع App Registration الخاص بك في Entra ID.

**الإعداد:**

1. أنشئ أو احصل على شهادة (بصيغة PEM مع مفتاح خاص).
2. في Entra ID ← App Registration ← **Certificates & secrets** ← **Certificates** ← ارفع الشهادة العامة.

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

استخدم Azure Managed Identity للمصادقة من دون كلمة مرور. وهذا مثالي لعمليات النشر على بنية Azure التحتية (AKS وApp Service وAzure VMs) حيث تتوفر هوية مُدارة.

**كيف يعمل:**

1. يحتوي pod/VM الخاص بالروبوت على هوية مُدارة (معيّنة من النظام أو من المستخدم).
2. يربط **بيان اعتماد هوية موحّدة** الهوية المُدارة مع App Registration في Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw الحزمة `@azure/identity` للحصول على الرموز من نقطة نهاية Azure IMDS ‏(`169.254.169.254`).
4. يتم تمرير الرمز إلى Teams SDK لمصادقة الروبوت.

**المتطلبات المسبقة:**

- بنية Azure التحتية مع تمكين الهوية المُدارة (AKS workload identity أو App Service أو VM)
- إنشاء بيان اعتماد هوية موحّدة على App Registration في Entra ID
- وصول شبكي إلى IMDS ‏(`169.254.169.254:80`) من الـ pod/VM

**التهيئة (هوية مُدارة معيّنة من النظام):**

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

**التهيئة (هوية مُدارة معيّنة من المستخدم):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (للهوية المُدارة المعيّنة من المستخدم فقط)

### إعداد AKS Workload Identity

لعمليات نشر AKS التي تستخدم workload identity:

1. **قم بتمكين workload identity** على عنقود AKS الخاص بك.
2. **أنشئ federated identity credential** على App Registration في Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **أضف تعليقًا توضيحيًا إلى Kubernetes service account** باستخدام معرّف عميل التطبيق:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **أضف تسمية إلى الـ pod** لحقن workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكد من وجود وصول شبكي** إلى IMDS ‏(`169.254.169.254`) — إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج تسمح بحركة المرور إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة               | التهيئة                                        | المزايا                             | العيوب                                 |
| --------------------- | ---------------------------------------------- | ---------------------------------- | -------------------------------------- |
| **Client secret**     | `appPassword`                                  | إعداد بسيط                         | يتطلب تدوير السر، وأقل أمانًا          |
| **Certificate**       | `authType: "federated"` + `certificatePath`    | لا يوجد سر مشترك عبر الشبكة        | عبء إداري لإدارة الشهادات              |
| **Managed Identity**  | `authType: "federated"` + `useManagedIdentity` | بدون كلمة مرور، ولا أسرار لإدارتها | يتطلب بنية Azure التحتية               |

**السلوك الافتراضي:** عندما لا يتم تعيين `authType`، يستخدم OpenClaw افتراضيًا مصادقة client secret. وتستمر التهيئات الحالية في العمل من دون تغييرات.

## التطوير المحلي (Tunneling)

لا يمكن لـ Teams الوصول إلى `localhost`. استخدم نفق تطوير دائمًا حتى يظل عنوان URL كما هو عبر الجلسات:

```bash
# إعداد لمرة واحدة:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# كل جلسة تطوير:
devtunnel host my-openclaw-bot
```

بدائل: `ngrok http 3978` أو `tailscale funnel 3978` (قد تتغير عناوين URL في كل جلسة).

إذا تغيّر عنوان URL للنفق، فحدّث نقطة النهاية:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## اختبار الروبوت

**تشغيل التشخيصات:**

```bash
teams app doctor <teamsAppId>
```

يتحقق من تسجيل الروبوت، وتطبيق AAD، والبيان، وتهيئة SSO في تمريرة واحدة.

**إرسال رسالة اختبار:**

1. ثبّت تطبيق Teams (استخدم رابط التثبيت من `teams app get <id> --install-link`)
2. اعثر على الروبوت في Teams وأرسل له رسالة مباشرة
3. تحقق من سجلات Gateway للنشاط الوارد

## متغيرات البيئة

يمكن تعيين جميع مفاتيح التهيئة عبر متغيرات البيئة بدلًا من ذلك:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (مصادقة موحّدة + شهادة)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
- `MSTEAMS_USE_MANAGED_IDENTITY` (مصادقة موحّدة + هوية مُدارة)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (للهوية المُدارة المعيّنة من المستخدم فقط)

## إجراء معلومات العضو

يوفر OpenClaw إجراء `member-info` مدعومًا من Graph لـ Microsoft Teams بحيث يمكن للوكلاء وعمليات الأتمتة تحليل تفاصيل أعضاء القناة (اسم العرض، البريد الإلكتروني، الدور) مباشرة من Microsoft Graph.

المتطلبات:

- إذن RSC باسم `Member.Read.Group` (موجود بالفعل في البيان الموصى به)
- لعمليات البحث عبر الفرق: إذن Microsoft Graph Application باسم `User.Read.All` مع موافقة المسؤول

يتم ضبط الإجراء بواسطة `channels.msteams.actions.memberInfo` (ممكّن افتراضيًا عندما تكون بيانات اعتماد Graph متاحة).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القناة/المجموعة الحديثة التي تُضمّن في المطالبة.
- يعود إلى `messages.groupChat.historyLimit`. عيّن القيمة `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل السلاسل الذي يتم جلبه بحسب قوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذا فإن تمهيد سياق السلسلة يتضمن فقط الرسائل الواردة من المرسلين المسموح لهم.
- يتم تمرير سياق المرفقات المقتبسة (`ReplyTo*` المشتق من HTML الخاص بردود Teams) حاليًا كما تم استلامه.
- بعبارة أخرى، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ ولا تتم تصفية سوى بعض مسارات السياق التكميلية المحددة اليوم.
- يمكن تقييد سجل الرسائل المباشرة عبر `channels.msteams.dmHistoryLimit` (أدوار المستخدم). وتوجد تجاوزات لكل مستخدم عبر: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات Teams RSC الحالية (البيان)

هذه هي **أذونات resourceSpecific الحالية** في بيان تطبيق Teams لدينا. وهي لا تنطبق إلا داخل الفريق/الدردشة حيث تم تثبيت التطبيق.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` ‏(Application) - استلام جميع رسائل القناة من دون @mention
- `ChannelMessage.Send.Group` ‏(Application)
- `Member.Read.Group` ‏(Application)
- `Owner.Read.Group` ‏(Application)
- `ChannelSettings.Read.Group` ‏(Application)
- `TeamMember.Read.Group` ‏(Application)
- `TeamSettings.Read.Group` ‏(Application)

**للدردشات الجماعية:**

- `ChatMessage.Read.Chat` ‏(Application) - استلام جميع رسائل الدردشة الجماعية من دون @mention

لإضافة أذونات RSC عبر Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## مثال على Teams Manifest (بعد التنقيح)

مثال أدنى وصالح يحتوي على الحقول المطلوبة. استبدل المعرّفات وعناوين URL.

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

### تحذيرات البيان (حقول لا بد منها)

- يجب أن يطابق `bots[].botId` **بالضبط** Azure Bot App ID.
- يجب أن يطابق `webApplicationInfo.id` **بالضبط** Azure Bot App ID.
- يجب أن يتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal` و`team` و`groupChat`).
- إن `bots[].supportsFiles: true` مطلوب للتعامل مع الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` إذني قراءة/إرسال القناة إذا كنت تريد حركة مرور القناة.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبت بالفعل (على سبيل المثال، لإضافة أذونات RSC):

```bash
# نزّل البيان وعدّله ثم أعد رفعه
teams app manifest download <teamsAppId> manifest.json
# عدّل manifest.json محليًا...
teams app manifest upload manifest.json <teamsAppId>
# تتم زيادة الإصدار تلقائيًا إذا تغيّر المحتوى
```

بعد التحديث، أعد تثبيت التطبيق في كل فريق حتى تصبح الأذونات الجديدة سارية، ثم **اخرج تمامًا من Teams وأعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح بيانات التطبيق الوصفية المخزنة مؤقتًا.

<details>
<summary>تحديث يدوي للبيان (من دون CLI)</summary>

1. حدّث `manifest.json` لديك بالإعدادات الجديدة
2. **زد الحقل `version`** (على سبيل المثال، `1.0.0` ← `1.1.0`)
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json` و`outline.png` و`color.png`)
4. ارفع ملف zip الجديد:
   - **Teams Admin Center:** تطبيقات Teams ← إدارة التطبيقات ← اعثر على تطبيقك ← ارفع إصدارًا جديدًا
   - **Sideload:** في Teams ← التطبيقات ← إدارة تطبيقاتك ← ارفع تطبيقًا مخصصًا

</details>

## الإمكانات: RSC فقط مقابل Graph

### مع **Teams RSC فقط** (التطبيق مثبت، من دون أذونات Graph API)

يعمل:

- قراءة محتوى **النص** في رسائل القناة.
- إرسال محتوى **نص** رسائل القناة.
- استلام مرفقات الملفات في **النطاق الشخصي (DM)**.

لا يعمل:

- **محتويات الصور أو الملفات** في القنوات/المجموعات (تتضمن الحمولة مجرد عنصر HTML بديل).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (خارج حدث webhook المباشر).

### مع **Teams RSC + أذونات Microsoft Graph Application**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة داخل الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القناة/الدردشة عبر Graph.

### RSC مقابل Graph API

| الإمكانية               | أذونات RSC           | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **الرسائل في الوقت الفعلي** | نعم (عبر webhook)    | لا (استطلاع فقط)                    |
| **الرسائل التاريخية**   | لا                   | نعم (يمكن الاستعلام عن السجل)       |
| **تعقيد الإعداد**       | البيان فقط           | يتطلب موافقة المسؤول + تدفق الرموز  |
| **يعمل دون اتصال**      | لا (يجب أن يكون قيد التشغيل) | نعم (يمكن الاستعلام في أي وقت) |

**الخلاصة:** إن RSC مخصص للاستماع في الوقت الفعلي؛ أما Graph API فمخصص للوصول التاريخي. وإذا كنت تريد اللحاق بالرسائل الفائتة أثناء عدم الاتصال، فأنت بحاجة إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## وسائط + سجل مع تمكين Graph (مطلوب للقنوات)

إذا كنت بحاجة إلى الصور/الملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب عليك تمكين أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **App Registration** ضمن Entra ID ‏(Azure AD)، أضف أذونات Microsoft Graph **Application**:
   - `ChannelMessage.Read.All` ‏(مرفقات القناة + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` ‏(للدردشات الجماعية)
2. **امنح موافقة المسؤول** للمستأجر.
3. زد قيمة **إصدار** بيان تطبيق Teams، وأعد رفعه، ثم **أعد تثبيت التطبيق في Teams**.
4. **اخرج تمامًا من Teams وأعد تشغيله** لمسح بيانات التطبيق الوصفية المخزنة مؤقتًا.

**إذن إضافي لإشارات المستخدمين:** تعمل إشارات @ للمستخدمين مباشرة للمستخدمين الموجودين في المحادثة. ولكن إذا كنت تريد البحث ديناميكيًا عن مستخدمين والإشارة إليهم وهم **ليسوا في المحادثة الحالية**، فأضف إذن `User.Read.All` ‏(Application) وامنح موافقة المسؤول.

## القيود المعروفة

### مهلات Webhook

يقدّم Teams الرسائل عبر HTTP webhook. وإذا استغرقت المعالجة وقتًا طويلًا جدًا (مثل بطء استجابات LLM)، فقد ترى:

- مهلات Gateway
- قيام Teams بإعادة محاولة الرسالة (مما يسبب التكرارات)
- ردودًا ساقطة

يتعامل OpenClaw مع هذا من خلال الإرجاع بسرعة وإرسال الردود بشكل استباقي، لكن قد تستمر المشكلات مع الاستجابات البطيئة جدًا.

### التنسيق

إن Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق** و_مائل_ و`code` والروابط
- قد لا يتم عرض Markdown المعقد (الجداول، القوائم المتداخلة) بشكل صحيح
- يتم دعم Adaptive Cards للاستطلاعات وعمليات الإرسال ذات العرض الدلالي (راجع أدناه)

## التهيئة

الإعدادات الأساسية (راجع `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تمكين/تعطيل القناة.
- `channels.msteams.appId` و`channels.msteams.appPassword` و`channels.msteams.tenantId`: بيانات اعتماد الروبوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة السماح للرسائل المباشرة (يُوصى بمعرّفات كائنات AAD). يقوم المعالج بتحليل الأسماء إلى معرّفات أثناء الإعداد عند توفر وصول Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تمكين مطابقة UPN/اسم العرض القابلة للتغيير والتوجيه المباشر بأسماء الفرق/القنوات.
- `channels.msteams.textChunkLimit`: حجم مقطع النص الصادر.
- `channels.msteams.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة السماح لمضيفي المرفقات الواردة (افتراضيًا نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة السماح بإرفاق ترويسات Authorization عند إعادة محاولة الوسائط (افتراضيًا مضيفو Graph + Bot Framework).
- `channels.msteams.requireMention`: اشتراط @mention في القنوات/المجموعات (الافتراضي true).
- `channels.msteams.replyStyle`: ‏`thread | top-level` (راجع [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) وتُستخدم عند غياب تجاوز القناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مرسل (مدعوم الرمز العام `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مرسل (مدعوم الرمز العام `"*"`).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:` و`e164:` و`username:` و`name:` (لا تزال المفاتيح القديمة بلا بادئة تُطابق `id:` فقط).
- `channels.msteams.actions.memberInfo`: تمكين أو تعطيل إجراء معلومات العضو المدعوم من Graph (ممكّن افتراضيًا عند توفر بيانات اعتماد Graph).
- `channels.msteams.authType`: نوع المصادقة — `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (مصادقة موحّدة + شهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختياري، غير مطلوب للمصادقة).
- `channels.msteams.useManagedIdentity`: تمكين مصادقة الهوية المُدارة (في وضع federated).
- `channels.msteams.managedIdentityClientId`: معرّف العميل للهوية المُدارة المعيّنة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرّف موقع SharePoint لرفع الملفات في الدردشات الجماعية/القنوات (راجع [إرسال الملفات في الدردشات الجماعية](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (راجع [/concepts/session](/ar/concepts/session)):
  - تشترك الرسائل المباشرة في الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: سلاسل المحادثات مقابل المنشورات

قدّم Teams مؤخرًا نمطَي واجهة مستخدم للقنوات فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                                  | `replyStyle` الموصى به |
| ------------------------ | ------------------------------------------------------ | ---------------------- |
| **Posts** (الكلاسيكي)    | تظهر الرسائل كبطاقات مع ردود مترابطة أسفلها           | `thread` (الافتراضي)   |
| **Threads** (شبيه Slack) | تتدفق الرسائل خطيًا، بشكل أقرب إلى Slack              | `top-level`            |

**المشكلة:** لا تكشف Teams API عن نمط واجهة المستخدم الذي تستخدمه القناة. وإذا استخدمت `replyStyle` غير الصحيح:

- `thread` في قناة بنمط Threads ← تظهر الردود متداخلة بشكل غير مريح
- `top-level` في قناة بنمط Posts ← تظهر الردود كمنشورات مستقلة على المستوى الأعلى بدلًا من أن تكون ضمن السلسلة

**الحل:** هيّئ `replyStyle` لكل قناة بحسب إعداد القناة:

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

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر واجهات API الخاصة بملفات روبوت Teams.
- **القنوات/المجموعات:** تعيش المرفقات في تخزين M365 ‏(SharePoint/OneDrive). تتضمن حمولة webhook عنصر HTML بديلًا فقط، وليس بايتات الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- لعمليات الإرسال الصريحة التي تبدأ بملف، استخدم `action=upload-file` مع `media` أو `filePath` أو `path`؛ وتصبح `message` الاختيارية النص/التعليق المرافق، ويتجاوز `filename` الاسم المرفوع.

من دون أذونات Graph، سيتم استلام رسائل القنوات التي تحتوي على صور كنص فقط (لا يمكن للروبوت الوصول إلى محتوى الصورة).
وبشكل افتراضي، لا ينزّل OpenClaw الوسائط إلا من أسماء مضيفي Microsoft/Teams. ويمكنك تجاوز ذلك عبر `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
ولا تُرفق ترويسات Authorization إلا للمضيفين المدرجين في `channels.msteams.mediaAuthAllowHosts` (الافتراضي: مضيفو Graph + Bot Framework). اجعل هذه القائمة صارمة (وتجنب لواحق متعددة المستأجرين).

## إرسال الملفات في الدردشات الجماعية

يمكن للروبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard ‏(مضمّن). لكن **إرسال الملفات في الدردشات الجماعية/القنوات** يتطلب إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                      | الإعداد المطلوب                                 |
| ----------------------- | ----------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة**    | FileConsentCard ← يقبل المستخدم ← يرفع الروبوت | يعمل مباشرة                                    |
| **الدردشات الجماعية/القنوات** | رفع إلى SharePoint ← مشاركة رابط            | يتطلب `sharePointSiteId` + أذونات Graph         |
| **الصور (أي سياق)**     | مضمنة داخل الرسالة بترميز Base64         | يعمل مباشرة                                    |

### لماذا تحتاج الدردشات الجماعية إلى SharePoint

لا تمتلك الروبوتات محرك OneDrive شخصيًا (نقطة النهاية `/me/drive` في Graph API لا تعمل مع هويات التطبيقات). لإرسال الملفات في الدردشات الجماعية/القنوات، يرفع الروبوت الملف إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID ‏(Azure AD) ← App Registration:
   - `Sites.ReadWrite.All` ‏(Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` ‏(Application) - اختياري، يتيح روابط مشاركة لكل مستخدم

2. **امنح موافقة المسؤول** للمستأجر.

3. **احصل على معرّف موقع SharePoint:**

   ```bash
   # عبر Graph Explorer أو curl باستخدام رمز صالح:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # مثال: لموقع على "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # تتضمن الاستجابة: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **هيّئ OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... تهيئة أخرى ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### سلوك المشاركة

| الإذن                                    | سلوك المشاركة                                         |
| ---------------------------------------- | ----------------------------------------------------- |
| `Sites.ReadWrite.All` فقط                | رابط مشاركة على مستوى المؤسسة (يمكن لأي شخص في المؤسسة الوصول) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | رابط مشاركة لكل مستخدم (يمكن فقط لأعضاء الدردشة الوصول)      |

المشاركة لكل مستخدم أكثر أمانًا لأن المشاركين في الدردشة فقط يمكنهم الوصول إلى الملف. وإذا كان إذن `Chat.Read.All` مفقودًا، يعود الروبوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع

| السيناريو                                         | النتيجة                                            |
| ------------------------------------------------- | -------------------------------------------------- |
| دردشة جماعية + ملف + تم ضبط `sharePointSiteId`   | رفع إلى SharePoint، ثم إرسال رابط مشاركة         |
| دردشة جماعية + ملف + لا يوجد `sharePointSiteId`  | محاولة رفع إلى OneDrive (قد تفشل)، ثم إرسال نص فقط |
| دردشة شخصية + ملف                                | تدفق FileConsentCard (يعمل دون SharePoint)         |
| أي سياق + صورة                                   | تضمين داخل الرسالة بترميز Base64 (يعمل دون SharePoint) |

### موقع تخزين الملفات

تُخزَّن الملفات المرفوعة في مجلد `/OpenClawShared/` ضمن مكتبة المستندات الافتراضية لموقع SharePoint المُهيّأ.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams كـ Adaptive Cards (لا توجد Teams poll API أصلية).

- CLI: ‏`openclaw message poll --channel msteams --target conversation:<id> ...`
- يتم تسجيل الأصوات بواسطة Gateway في `~/.openclaw/msteams-polls.json`.
- يجب أن يظل Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا حتى الآن (افحص ملف التخزين عند الحاجة).

## بطاقات العرض

أرسل حمولات عرض دلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. يعرضها OpenClaw على هيئة Teams Adaptive Cards انطلاقًا من عقد العرض العام.

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

للاطلاع على تفاصيل تنسيق الهدف، راجع [تنسيقات الهدف](#target-formats) أدناه.

## تنسيقات الهدف

تستخدم أهداف MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الهدف             | التنسيق                         | مثال                                                |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| مستخدم (حسب المعرّف)  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| مستخدم (حسب الاسم)    | `user:<display-name>`            | `user:John Smith` (يتطلب Graph API)                |
| مجموعة/قناة           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| مجموعة/قناة (خام)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (إذا احتوى على `@thread`) |

**أمثلة CLI:**

```bash
# الإرسال إلى مستخدم حسب المعرّف
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# الإرسال إلى مستخدم حسب اسم العرض (يؤدي إلى بحث عبر Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# الإرسال إلى دردشة جماعية أو قناة
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# إرسال بطاقة عرض إلى محادثة
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**أمثلة على أداة الوكيل:**

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

ملاحظة: من دون البادئة `user:`، تُفسَّر الأسماء افتراضيًا على أنها أهداف مجموعة/فريق. استخدم دائمًا `user:` عند استهداف الأشخاص حسب اسم العرض.

## المراسلة الاستباقية

- لا تصبح الرسائل الاستباقية ممكنة إلا **بعد** أن يتفاعل المستخدم، لأننا نخزّن مراجع المحادثات عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة `dmPolicy` وضبط قائمة السماح.

## معرّفات الفريق والقناة (خطأ شائع)

إن معلمة الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليست** معرّف الفريق المستخدم في التهيئة. استخرج المعرّفات من مسار URL بدلًا من ذلك:

**URL الفريق:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    معرّف الفريق (قم بفك ترميز URL لهذا الجزء)
```

**URL القناة:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      معرّف القناة (قم بفك ترميز URL لهذا الجزء)
```

**بالنسبة إلى التهيئة:**

- معرّف الفريق = جزء المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`)
- معرّف القناة = جزء المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معلمة الاستعلام `groupId`

## القنوات الخاصة

يدعم الروبوت القنوات الخاصة بشكل محدود:

| الميزة                       | القنوات القياسية | القنوات الخاصة          |
| --------------------------- | ---------------- | ----------------------- |
| تثبيت الروبوت               | نعم              | محدود                   |
| الرسائل في الوقت الفعلي (webhook) | نعم              | قد لا تعمل              |
| أذونات RSC                  | نعم              | قد تتصرف بشكل مختلف     |
| @mentions                   | نعم              | إذا كان الروبوت متاحًا  |
| السجل عبر Graph API         | نعم              | نعم (مع الأذونات)       |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات الروبوت
2. استخدم الرسائل المباشرة - يمكن للمستخدمين دائمًا مراسلة الروبوت مباشرة
3. استخدم Graph API للوصول التاريخي (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### المشكلات الشائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams واخرج تمامًا من Teams ثم افتحه من جديد.
- **لا توجد ردود في القناة:** الإشارات مطلوبة افتراضيًا؛ عيّن `channels.msteams.requireMention=false` أو هيّئ ذلك لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض البيان القديم):** أزل التطبيق ثم أعد إضافته واخرج تمامًا من Teams لتحديثه.
- **401 Unauthorized من webhook:** هذا متوقع عند الاختبار اليدوي من دون Azure JWT — ويعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع البيان

- **"Icon file cannot be empty":** يشير البيان إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (`outline.png` بحجم 32x32 و`color.png` بحجم 192x192).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتًا في فريق/دردشة أخرى. اعثر عليه وأزل تثبيته أولًا، أو انتظر 5-10 دقائق حتى يكتمل الانتشار.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح أدوات المطور في المتصفح (F12) ← علامة تبويب Network، ثم افحص نص الاستجابة لمعرفة الخطأ الفعلي.
- **فشل Sideload:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" — فهذا غالبًا ما يتجاوز قيود sideload.

### أذونات RSC لا تعمل

1. تحقق من أن `webApplicationInfo.id` يطابق App ID الخاص بالروبوت تمامًا
2. أعد رفع التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقق مما إذا كان مسؤول المؤسسة قد حظر أذونات RSC
4. تأكد من أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` للدردشات الجماعية

## المراجع

- [إنشاء Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [مخطط Teams app manifest](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [استلام رسائل القنوات باستخدام RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع أذونات RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [التعامل مع ملفات روبوت Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (القناة/المجموعة تتطلب Graph)
- [المراسلة الاستباقية](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI لإدارة الروبوتات

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وضبط الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
