---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم روبوت Microsoft Teams وإمكاناته وتكوينه
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-02T22:16:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: f26d6403934a654ef847aff1563500649083598cfdcb3d463890706e31480525
    source_path: channels/msteams.md
    workflow: 16
---

الحالة: النص + مرفقات الرسائل المباشرة مدعومة؛ يتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في محادثات المجموعة](#sending-files-in-group-chats)). تُرسل الاستطلاعات عبر Adaptive Cards. تعرض إجراءات الرسائل `upload-file` صريحًا لعمليات الإرسال التي تبدأ بملف.

## Plugin المضمن

يأتي Microsoft Teams كـ Plugin مضمن في إصدارات OpenClaw الحالية، لذلك لا يلزم تثبيت
منفصل في البناء الحزمي العادي.

إذا كنت تستخدم بناءً أقدم أو تثبيتًا مخصصًا يستبعد Teams المضمن،
فثبّت حزمة npm مباشرةً:

```bash
openclaw plugins install @openclaw/msteams
```

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا
دقيقًا فقط عندما تحتاج إلى تثبيت قابل للتكرار.

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

يتولى [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) تسجيل الروبوت، وإنشاء البيان، وتوليد بيانات الاعتماد في أمر واحد.

**1. ثبّت وسجّل الدخول**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI حاليًا في مرحلة المعاينة. قد تتغير الأوامر والخيارات بين الإصدارات.
</Note>

**2. ابدأ نفقًا** (لا يستطيع Teams الوصول إلى localhost)

ثبّت وصادق على devtunnel CLI إذا لم تكن قد فعلت ذلك بالفعل ([دليل البدء](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` مطلوب لأن Teams لا يمكنه المصادقة مع devtunnels. لا يزال كل طلب روبوت وارد يُتحقق منه تلقائيًا بواسطة Teams SDK.
</Note>

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (لكن قد تغيّر هذه عناوين URL في كل جلسة).

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
- يسجّل الروبوت (تتم إدارته بواسطة Teams افتراضيًا — لا حاجة إلى اشتراك Azure)

سيعرض الإخراج `CLIENT_ID` و`CLIENT_SECRET` و`TENANT_ID` و**معرّف تطبيق Teams** — دوّنها للخطوات التالية. كما يعرض تثبيت التطبيق في Teams مباشرةً.

**4. اضبط OpenClaw** باستخدام بيانات الاعتماد من الإخراج:

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

سيطالبك `teams app create` بتثبيت التطبيق — اختر "Install in Teams". إذا تخطيت ذلك، يمكنك الحصول على الرابط لاحقًا:

```bash
teams app get <teamsAppId> --install-link
```

**6. تحقّق من أن كل شيء يعمل**

```bash
teams app doctor <teamsAppId>
```

يشغّل هذا تشخيصات عبر تسجيل الروبوت، وإعداد تطبيق AAD، وصحة البيان، وإعداد SSO.

لنشر الإنتاج، فكّر في استخدام [المصادقة الاتحادية](/ar/channels/msteams#federated-authentication-certificate-plus-managed-identity) (شهادة أو هوية مُدارة) بدلًا من أسرار العملاء.

<Note>
تُحظر محادثات المجموعة افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بردود المجموعة، عيّن `channels.msteams.groupAllowFrom`، أو استخدم `groupPolicy: "open"` للسماح لأي عضو (مع بوابة الإشارة).
</Note>

## الأهداف

- التحدث إلى OpenClaw عبر الرسائل المباشرة في Teams أو محادثات المجموعة أو القنوات.
- الحفاظ على توجيه حتمي: تعود الردود دائمًا إلى القناة التي وصلت منها.
- اعتماد سلوك آمن للقناة افتراضيًا (الإشارات مطلوبة ما لم يُضبط خلاف ذلك).

## كتابات الإعدادات

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات الإعدادات التي تُشغّلها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**الوصول إلى الرسائل المباشرة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يتم تجاهل المرسلين غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائن AAD مستقرة.
- لا تعتمد على مطابقة UPN/اسم العرض لقوائم السماح — فقد تتغير. يعطّل OpenClaw مطابقة الأسماء المباشرة افتراضيًا؛ فعّلها صراحةً باستخدام `channels.msteams.dangerouslyAllowNameMatching: true`.
- يستطيع المعالج حل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**الوصول إلى المجموعة**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تُضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عندما لا يكون مضبوطًا.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين الذين يمكنهم التشغيل في محادثات/قنوات المجموعة (يرجع إلى `channels.msteams.allowFrom`).
- عيّن `groupPolicy: "open"` للسماح لأي عضو (لا يزال مقيدًا بالإشارة افتراضيًا).
- للسماح بـ **عدم وجود قنوات**، عيّن `channels.msteams.groupPolicy: "disabled"`.

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

**قائمة سماح Teams + القناة**

- حدّد نطاق ردود المجموعة/القناة بإدراج الفرق والقنوات ضمن `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات محادثات Teams المستقرة من روابط Teams، وليس أسماء العرض القابلة للتغيير.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، لا تُقبل إلا الفرق/القنوات المدرجة (مع بوابة الإشارة).
- يقبل معالج الإعداد إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يحل OpenClaw أسماء قائمة سماح الفريق/القناة والمستخدمين إلى معرّفات (عندما تسمح أذونات Graph)
  ويسجل الربط؛ تُبقى أسماء الفريق/القناة غير المحلولة كما كُتبت، لكنها تُتجاهل للتوجيه افتراضيًا ما لم يُفعّل `channels.msteams.dangerouslyAllowNameMatching: true`.

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
<summary><strong>الإعداد اليدوي (من دون Teams CLI)</strong></summary>

إذا لم تتمكن من استخدام Teams CLI، يمكنك إعداد الروبوت يدويًا عبر Azure Portal.

### كيف يعمل

1. تأكد من توفر Microsoft Teams Plugin (مضمن في الإصدارات الحالية).
2. أنشئ **Azure Bot** (App ID + السر + معرّف المستأجر).
3. ابنِ **حزمة تطبيق Teams** تشير إلى الروبوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams في فريق (أو نطاق شخصي للرسائل المباشرة).
5. اضبط `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway لحركة Bot Framework Webhook على `/api/messages` افتراضيًا.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [إنشاء Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ تبويب **الأساسيات**:

   | الحقل              | القيمة                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **مقبض الروبوت**     | اسم الروبوت الخاص بك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **الاشتراك**   | اختر اشتراك Azure الخاص بك                           |
   | **مجموعة الموارد** | أنشئ جديدًا أو استخدم الموجود                               |
   | **مستوى التسعير**   | **مجاني** للتطوير/الاختبار                                 |
   | **نوع التطبيق**    | **مستأجر واحد** (موصى به - راجع الملاحظة أدناه)         |
   | **نوع الإنشاء**  | **إنشاء Microsoft App ID جديد**                          |

<Warning>
أُلغي استخدام إنشاء الروبوتات الجديدة متعددة المستأجرين بعد 2025-07-31. استخدم **مستأجرًا واحدًا** للروبوتات الجديدة.
</Warning>

3. انقر **Review + create** → **Create** (انتظر نحو 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot الخاص بك → **Configuration**
2. انسخ **Microsoft App ID** → هذا هو `appId`
3. انقر **Manage Password** → انتقل إلى App Registration
4. ضمن **Certificates & secrets** → **New client secret** → انسخ **Value** → هذا هو `appPassword`
5. انتقل إلى **Overview** → انسخ **Directory (tenant) ID** → هذا هو `tenantId`

### الخطوة 3: ضبط نقطة نهاية المراسلة

1. في Azure Bot → **Configuration**
2. عيّن **Messaging endpoint** إلى عنوان Webhook الخاص بك:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تمكين قناة Teams

1. في Azure Bot → **Channels**
2. انقر **Microsoft Teams** → Configure → Save
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

تبدأ قناة Teams تلقائيًا عندما يكون Plugin متاحًا وتوجد إعدادات `msteams` مع بيانات الاعتماد.

</details>

## المصادقة الاتحادية (شهادة بالإضافة إلى هوية مُدارة)

> أُضيفت في 2026.4.11

لنشر الإنتاج، يدعم OpenClaw **المصادقة الاتحادية** كبديل أكثر أمانًا لأسرار العملاء. تتوفر طريقتان:

### الخيار أ: المصادقة القائمة على الشهادة

استخدم شهادة PEM مسجلة مع تسجيل تطبيق Entra ID الخاص بك.

**الإعداد:**

1. ولّد أو احصل على شهادة (تنسيق PEM مع مفتاح خاص).
2. في Entra ID → App Registration → **Certificates & secrets** → **Certificates** → ارفع الشهادة العامة.

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

استخدم Azure Managed Identity للمصادقة دون كلمة مرور. هذا مثالي لعمليات النشر على بنية Azure التحتية (AKS وApp Service وأجهزة Azure VM) حيث تتوفر هوية مُدارة.

**كيف يعمل:**

1. تحتوي حاوية الروبوت/الجهاز الافتراضي على هوية مُدارة (مخصصة من النظام أو مخصصة من المستخدم).
2. تربط **بيانات اعتماد هوية اتحادية** الهوية المُدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على رموز من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يُمرر الرمز إلى Teams SDK لمصادقة الروبوت.

**المتطلبات المسبقة:**

- بنية Azure التحتية مع تمكين الهوية المُدارة (هوية عمل AKS، App Service، VM)
- بيانات اعتماد هوية اتحادية منشأة على تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من الحاوية/الجهاز الافتراضي

**الإعدادات (هوية مُدارة مخصصة من النظام):**

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

### إعداد هوية عبء العمل في AKS

لعمليات نشر AKS التي تستخدم هوية عبء العمل:

1. **فعّل هوية عبء العمل** على عنقود AKS لديك.
2. **أنشئ بيانات اعتماد هوية اتحادية** في تسجيل تطبيق Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **أضف تعليقات توضيحية إلى حساب خدمة Kubernetes** باستخدام معرّف عميل التطبيق:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **أضف تسمية إلى الحاوية** لحقن هوية عبء العمل:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكد من الوصول الشبكي** إلى IMDS (`169.254.169.254`) — إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج تسمح بمرور البيانات إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة | الإعداد | المزايا | العيوب |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **سر العميل** | `appPassword` | إعداد بسيط | يلزم تدوير السر، أقل أمانا |
| **الشهادة** | `authType: "federated"` + `certificatePath` | لا يوجد سر مشترك عبر الشبكة | عبء إضافي لإدارة الشهادات |
| **الهوية المُدارة** | `authType: "federated"` + `useManagedIdentity` | بلا كلمات مرور، ولا توجد أسرار لإدارتها | يلزم وجود بنية Azure التحتية |

**السلوك الافتراضي:** عندما لا يتم تعيين `authType`، يستخدم OpenClaw افتراضيا مصادقة سر العميل. تستمر الإعدادات الحالية في العمل دون تغييرات.

## التطوير المحلي (الأنفاق)

لا يستطيع Teams الوصول إلى `localhost`. استخدم نفق تطوير دائم حتى يبقى عنوان URL كما هو عبر الجلسات:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

بدائل: `ngrok http 3978` أو `tailscale funnel 3978` (قد تتغير عناوين URL في كل جلسة).

إذا تغيّر عنوان URL للنفق لديك، فحدّث نقطة النهاية:

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
3. تحقق من سجلات Gateway بحثا عن نشاط وارد

## متغيرات البيئة

يمكن تعيين جميع مفاتيح الإعداد عبر متغيرات البيئة بدلا من ذلك:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (اتحادي + شهادة)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
- `MSTEAMS_USE_MANAGED_IDENTITY` (اتحادي + هوية مُدارة)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (MI معيّنة من المستخدم فقط)

## إجراء معلومات العضو

يوفر OpenClaw إجراء `member-info` مدعوما بـ Graph لـ Microsoft Teams حتى يتمكن الوكلاء والأتمتة من حل تفاصيل أعضاء القناة (اسم العرض، البريد الإلكتروني، الدور) مباشرة من Microsoft Graph.

المتطلبات:

- إذن RSC ‏`Member.Read.Group` (موجود بالفعل في البيان الموصى به)
- لعمليات البحث عبر الفرق: إذن تطبيق Graph ‏`User.Read.All` مع موافقة المسؤول

يخضع الإجراء للحراسة بواسطة `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عند توفر بيانات اعتماد Graph).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القناة/المجموعة الحديثة التي تُضمّن في الموجّه.
- يعود إلى `messages.groupChat.historyLimit`. عيّن `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل سلسلة المحادثة الذي تم جلبه حسب قوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذلك لا تتضمن تهيئة سياق سلسلة المحادثة إلا الرسائل الواردة من المرسلين المسموح لهم.
- يتم حاليا تمرير سياق المرفقات المقتبسة (`ReplyTo*` المشتق من HTML ردود Teams) كما تم استلامه.
- بعبارة أخرى، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ ولا تتم تصفية إلا مسارات سياق تكميلية محددة اليوم.
- يمكن تقييد سجل الرسائل المباشرة باستخدام `channels.msteams.dmHistoryLimit` (دورات المستخدم). تجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات Teams RSC الحالية (البيان)

هذه هي **الأذونات resourceSpecific الحالية** في بيان تطبيق Teams لدينا. تنطبق فقط داخل الفريق/الدردشة حيث تم تثبيت التطبيق.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` (Application) - تلقي جميع رسائل القناة دون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**للدردشات الجماعية:**

- `ChatMessage.Read.Chat` (Application) - تلقي جميع رسائل الدردشة الجماعية دون @mention

لإضافة أذونات RSC عبر Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## مثال على بيان Teams (منقح)

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

### تنبيهات البيان (حقول لا بد منها)

- **يجب** أن يطابق `bots[].botId` معرّف تطبيق Azure Bot.
- **يجب** أن يطابق `webApplicationInfo.id` معرّف تطبيق Azure Bot.
- يجب أن تتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal`، `team`، `groupChat`).
- يلزم `bots[].supportsFiles: true` لمعالجة الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` قراءة/إرسال القناة إذا كنت تريد حركة مرور القناة.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبت بالفعل (مثلا لإضافة أذونات RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

بعد التحديث، أعد تثبيت التطبيق في كل فريق حتى تدخل الأذونات الجديدة حيز التنفيذ، و**اخرج من Teams بالكامل ثم أعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح بيانات تعريف التطبيق المخزنة مؤقتا.

<details>
<summary>تحديث البيان يدويا (دون CLI)</summary>

1. حدّث `manifest.json` بالإعدادات الجديدة
2. **زد حقل `version`** (مثلا، `1.0.0` → `1.1.0`)
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json`، `outline.png`، `color.png`)
4. حمّل ملف zip الجديد:
   - **Teams Admin Center:** تطبيقات Teams → إدارة التطبيقات → ابحث عن تطبيقك → تحميل إصدار جديد
   - **Sideload:** في Teams → التطبيقات → إدارة تطبيقاتك → تحميل تطبيق مخصص

</details>

## القدرات: RSC فقط مقابل Graph

### مع **Teams RSC فقط** (التطبيق مثبت، دون أذونات Graph API)

يعمل:

- قراءة محتوى **نص** رسالة القناة.
- إرسال محتوى **نص** رسالة القناة.
- تلقي مرفقات ملفات **شخصية (رسائل مباشرة)**.

لا يعمل:

- **محتويات الصور أو الملفات** في القناة/المجموعة (تتضمن الحمولة قالب HTML فقط).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (بعد حدث Webhook المباشر).

### مع **Teams RSC + أذونات تطبيق Microsoft Graph**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة في الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القناة/الدردشة عبر Graph.

### RSC مقابل Graph API

| القدرة | أذونات RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل في الوقت الحقيقي** | نعم (عبر Webhook) | لا (استطلاع فقط) |
| **الرسائل التاريخية** | لا | نعم (يمكن الاستعلام عن السجل) |
| **تعقيد الإعداد** | بيان التطبيق فقط | يتطلب موافقة المسؤول + تدفق الرمز المميز |
| **يعمل دون اتصال** | لا (يجب أن يكون قيد التشغيل) | نعم (الاستعلام في أي وقت) |

**الخلاصة:** RSC للاستماع في الوقت الحقيقي؛ Graph API للوصول التاريخي. للحاق بالرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط والسجل المفعّلان بـ Graph (مطلوب للقنوات)

إذا كنت تحتاج إلى الصور/الملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب تمكين أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **تسجيل التطبيق** في Entra ID (Azure AD)، أضف **أذونات تطبيق** Microsoft Graph:
   - `ChannelMessage.Read.All` (مرفقات القناة + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (الدردشات الجماعية)
2. **امنح موافقة المسؤول** للمستأجر.
3. ارفع **إصدار بيان** تطبيق Teams، وأعد تحميله، و**أعد تثبيت التطبيق في Teams**.
4. **اخرج من Teams بالكامل ثم أعد تشغيله** لمسح بيانات تعريف التطبيق المخزنة مؤقتا.

**إذن إضافي لإشارات المستخدمين:** تعمل @mentions للمستخدمين مباشرة للمستخدمين الموجودين في المحادثة. ومع ذلك، إذا كنت تريد البحث ديناميكيا عن المستخدمين الذين **ليسوا في المحادثة الحالية** والإشارة إليهم، فأضف إذن `User.Read.All` (Application) وامنح موافقة المسؤول.

## القيود المعروفة

### مهلات Webhook

يرسل Teams الرسائل عبر HTTP Webhook. إذا استغرقت المعالجة وقتا طويلا جدا (مثلا، استجابات LLM بطيئة)، فقد ترى:

- مهلات Gateway
- إعادة Teams محاولة إرسال الرسالة (مما يسبب تكرارات)
- ردودا مسقطة

OpenClaw يعالج ذلك عبر الإرجاع بسرعة وإرسال الردود بشكل استباقي، لكن الاستجابات البطيئة جدًا قد تظل تسبب مشكلات.

### التنسيق

تنسيق Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق**، _مائل_، `code`، الروابط
- قد لا تُعرض صيغ Markdown المعقدة (الجداول، القوائم المتداخلة) بشكل صحيح
- تُدعم Adaptive Cards للاستطلاعات وإرسالات العرض الدلالية (انظر أدناه)

## التكوين

الإعدادات الرئيسية (راجع `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تمكين/تعطيل القناة.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: بيانات اعتماد البوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة السماح للرسائل المباشرة (يوصى باستخدام معرفات كائنات AAD). يحل المعالج الأسماء إلى معرفات أثناء الإعداد عندما يكون الوصول إلى Graph متاحًا.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح كسر الطوارئ لإعادة تمكين مطابقة UPN/اسم العرض القابلة للتغيير والتوجيه المباشر باسم الفريق/القناة.
- `channels.msteams.textChunkLimit`: حجم جزء النص الصادر.
- `channels.msteams.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة السماح لمضيفي المرفقات الواردة (تكون افتراضيًا لنطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة السماح لإرفاق ترويسات Authorization عند إعادة محاولة الوسائط (تكون افتراضيًا لمضيفي Graph + Bot Framework).
- `channels.msteams.requireMention`: اشتراط @mention في القنوات/المجموعات (الافتراضي true).
- `channels.msteams.replyStyle`: `thread | top-level` (راجع [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) المستخدمة عند غياب تجاوز القناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مرسل (يدعم حرف البدل `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مرسل (يدعم حرف البدل `"*"`).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:`، `e164:`، `username:`، `name:` (المفاتيح القديمة غير المسبوقة لا تزال تُربط بـ `id:` فقط).
- `channels.msteams.actions.memberInfo`: تمكين أو تعطيل إجراء معلومات العضو المدعوم بـ Graph (الافتراضي: مُمكّن عند توفر بيانات اعتماد Graph).
- `channels.msteams.authType`: نوع المصادقة — `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (المصادقة الموحدة + مصادقة الشهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختيارية، غير مطلوبة للمصادقة).
- `channels.msteams.useManagedIdentity`: تمكين مصادقة الهوية المُدارة (وضع federated).
- `channels.msteams.managedIdentityClientId`: معرف العميل للهوية المُدارة المعيّنة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرف موقع SharePoint لرفع الملفات في محادثات/قنوات المجموعة (راجع [إرسال الملفات في محادثات المجموعة](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (راجع [/concepts/session](/ar/concepts/session)):
  - تشارك الرسائل المباشرة الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: السلاسل مقابل المنشورات

قدمت Teams مؤخرًا نمطين لواجهة القنوات فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                               | `replyStyle` الموصى به |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **المنشورات** (الكلاسيكي)      | تظهر الرسائل كبطاقات مع ردود مترابطة أسفلها | `thread` (الافتراضي)       |
| **السلاسل** (شبيه بـ Slack) | تتدفق الرسائل خطيًا، بشكل أقرب إلى Slack                   | `top-level`              |

**المشكلة:** لا تكشف واجهة Teams API نمط الواجهة الذي تستخدمه القناة. إذا استخدمت `replyStyle` الخطأ:

- `thread` في قناة بنمط السلاسل → تظهر الردود متداخلة بشكل غير ملائم
- `top-level` في قناة بنمط المنشورات → تظهر الردود كمنشورات علوية منفصلة بدلًا من أن تكون داخل السلسلة

**الحل:** كوّن `replyStyle` لكل قناة بناءً على طريقة إعداد القناة:

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

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر واجهات Teams bot file APIs.
- **القنوات/المجموعات:** تعيش المرفقات في تخزين M365 (SharePoint/OneDrive). لا تتضمن حمولة Webhook إلا قالب HTML، وليس بايتات الملف الفعلية. **تكون أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- للإرسالات الصريحة التي تبدأ بالملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ تصبح `message` الاختيارية النص/التعليق المصاحب، ويتجاوز `filename` الاسم المرفوع.

بدون أذونات Graph، ستُستلم رسائل القنوات التي تحتوي على صور كنص فقط (محتوى الصورة غير متاح للبوت).
افتراضيًا، ينزل OpenClaw الوسائط من أسماء مضيفي Microsoft/Teams فقط. تجاوز ذلك باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
لا تُرفق ترويسات Authorization إلا للمضيفين في `channels.msteams.mediaAuthAllowHosts` (تكون افتراضيًا لمضيفي Graph + Bot Framework). أبقِ هذه القائمة صارمة (تجنب لاحقات متعددة المستأجرين).

## إرسال الملفات في محادثات المجموعة

يمكن للبوتات إرسال ملفات في الرسائل المباشرة باستخدام مسار FileConsentCard (مدمج). ومع ذلك، يتطلب **إرسال الملفات في محادثات/قنوات المجموعة** إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                           | الإعداد المطلوب                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة**                  | FileConsentCard → يقبل المستخدم → يرفع البوت | يعمل مباشرة دون إعداد إضافي                            |
| **محادثات/قنوات المجموعة** | الرفع إلى SharePoint → مشاركة رابط            | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | مضمنة بترميز Base64                        | تعمل مباشرة دون إعداد إضافي                            |

### لماذا تحتاج محادثات المجموعة إلى SharePoint

لا تملك البوتات محرك OneDrive شخصيًا (لا تعمل نقطة نهاية Graph API ‏`/me/drive` لهويات التطبيقات). لإرسال الملفات في محادثات/قنوات المجموعة، يرفع البوت إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` (Application) - اختياري، يمكّن روابط المشاركة لكل مستخدم

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
| `Sites.ReadWrite.All` + `Chat.Read.All` | رابط مشاركة لكل مستخدم (يمكن لأعضاء المحادثة فقط الوصول)      |

المشاركة لكل مستخدم أكثر أمانًا لأن مشاركي المحادثة فقط يمكنهم الوصول إلى الملف. إذا كان إذن `Chat.Read.All` مفقودًا، يعود البوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع الاحتياطي

| السيناريو                                          | النتيجة                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| محادثة مجموعة + ملف + تكوين `sharePointSiteId` | الرفع إلى SharePoint، وإرسال رابط مشاركة            |
| محادثة مجموعة + ملف + بلا `sharePointSiteId`         | محاولة الرفع إلى OneDrive (قد تفشل)، وإرسال النص فقط |
| محادثة شخصية + ملف                              | مسار FileConsentCard (يعمل بدون SharePoint)    |
| أي سياق + صورة                               | مضمنة بترميز Base64 (تعمل بدون SharePoint)   |

### موقع تخزين الملفات

تُخزن الملفات المرفوعة في مجلد `/OpenClawShared/` داخل مكتبة المستندات الافتراضية لموقع SharePoint المكوّن.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams بصيغة Adaptive Cards (لا توجد واجهة Teams poll API أصلية).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- تُسجل الأصوات بواسطة Gateway في `~/.openclaw/msteams-polls.json`.
- يجب أن يبقى Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا بعد (افحص ملف التخزين إذا لزم الأمر).

## بطاقات العرض

أرسل حمولات عرض دلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. يعرضها OpenClaw كبطاقات Teams Adaptive Cards من عقد العرض العام.

يقبل المعامل `presentation` كتلًا دلالية. عند توفير `presentation`، يكون نص الرسالة اختياريًا.

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

للحصول على تفاصيل تنسيق الهدف، راجع [تنسيقات الأهداف](#target-formats) أدناه.

## تنسيقات الأهداف

تستخدم أهداف MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الهدف         | التنسيق                           | مثال                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| مستخدم (حسب المعرف)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| مستخدم (حسب الاسم)      | `user:<display-name>`            | `user:John Smith` (يتطلب Graph API)              |
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
من دون البادئة `user:`، تُعامَل الأسماء افتراضيًا على أنها مجموعة أو فريق عند الحل. استخدم دائمًا `user:` عند استهداف الأشخاص باسم العرض.
</Note>

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** تفاعل المستخدم، لأننا نخزن مراجع المحادثة عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة `dmPolicy` وبوابة قائمة السماح.

## معرّفات الفرق والقنوات (خطأ شائع)

معامل الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليس** معرّف الفريق المستخدم للإعداد. استخرج المعرّفات من مسار عنوان URL بدلًا من ذلك:

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

**للإعداد:**

- مفتاح الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`؛ قد تعرض المستأجرات الأقدم `@thread.skype`، وهذا صالح أيضًا)
- مفتاح القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معامل الاستعلام `groupId` لتوجيه OpenClaw. فهو معرّف مجموعة Microsoft Entra، وليس معرّف محادثة Bot Framework المستخدم في أنشطة Teams الواردة.

## القنوات الخاصة

تتمتع الروبوتات بدعم محدود في القنوات الخاصة:

| الميزة                       | القنوات القياسية | القنوات الخاصة         |
| ---------------------------- | ---------------- | ---------------------- |
| تثبيت الروبوت                | نعم              | محدود                  |
| الرسائل في الوقت الحقيقي (Webhook) | نعم              | قد لا يعمل             |
| أذونات RSC                   | نعم              | قد تتصرف بشكل مختلف    |
| @الإشارات                    | نعم              | إذا كان الروبوت قابلًا للوصول |
| سجل Graph API                | نعم              | نعم (مع الأذونات)      |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات الروبوت
2. استخدم الرسائل المباشرة - يمكن للمستخدمين دائمًا مراسلة الروبوت مباشرة
3. استخدم Graph API للوصول إلى السجل (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### مشكلات شائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams بالكامل ثم أعد فتحه.
- **لا توجد ردود في القناة:** الإشارات مطلوبة افتراضيًا؛ عيّن `channels.msteams.requireMention=false` أو اضبط الإعداد لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض البيان القديم):** أزل التطبيق ثم أعد إضافته، وأغلق Teams بالكامل لتحديثه.
- **401 Unauthorized من Webhook:** متوقع عند الاختبار يدويًا من دون Azure JWT - يعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء تحميل البيان

- **"Icon file cannot be empty":** يشير البيان إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (32x32 لـ `outline.png`، و192x192 لـ `color.png`).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتًا في فريق/دردشة أخرى. ابحث عنه وأزله أولًا، أو انتظر 5-10 دقائق حتى يكتمل الانتشار.
- **"Something went wrong" عند التحميل:** حمّل عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح أدوات مطوري المتصفح (F12) ← تبويب Network، وتحقق من نص الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" - فهذا غالبًا يتجاوز قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقق من أن `webApplicationInfo.id` يطابق App ID الخاص بالروبوت لديك تمامًا
2. أعد تحميل التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقق مما إذا كان مسؤول مؤسستك قد حظر أذونات RSC
4. تأكد من أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` لدردشات المجموعة

## المراجع

- [إنشاء Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [بوابة مطوري Teams](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [مخطط بيان تطبيق Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [تلقي رسائل القنوات باستخدام RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع أذونات RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [تعامل روبوت Teams مع الملفات](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (تتطلب القناة/المجموعة Graph)
- [المراسلة الاستباقية](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI لإدارة الروبوتات

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعة وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
