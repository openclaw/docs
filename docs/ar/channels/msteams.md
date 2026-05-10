---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم بوت Microsoft Teams وإمكاناته وتكوينه
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-10T19:23:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f41c148e7ea0c2d0bde257d7af3ba0dc990f20110c08df3bb8c4d3f84e8563e0
    source_path: channels/msteams.md
    workflow: 16
---

الحالة: النص + مرفقات الرسائل المباشرة مدعومة؛ يتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في محادثات المجموعات](#sending-files-in-group-chats)). تُرسل الاستطلاعات عبر Adaptive Cards. تعرض إجراءات الرسائل `upload-file` صريحًا للإرسال الذي يبدأ بملف.

## Plugin المضمّن

يأتي Microsoft Teams كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا
يلزم تثبيت منفصل في البناء المعبأ العادي.

إذا كنت تستخدم بناءً أقدم أو تثبيتًا مخصصًا يستبعد Teams المضمّن،
فثبّت حزمة npm مباشرة:

```bash
openclaw plugins install @openclaw/msteams
```

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا
محددًا فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

النسخة المحلية (عند التشغيل من مستودع git):

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

ثبّت وصادِق على devtunnel CLI إذا لم تكن قد فعلت ذلك بالفعل ([دليل البدء](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` مطلوب لأن Teams لا يمكنه المصادقة مع devtunnels. يظل كل طلب بوت وارد مُتحققًا منه تلقائيًا بواسطة Teams SDK.
</Note>

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (لكن قد تغيّر هذه عناوين URL في كل جلسة).

**3. أنشئ التطبيق**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

ينفذ هذا الأمر الواحد ما يلي:

- ينشئ تطبيق Entra ID (Azure AD)
- يولّد سر عميل
- يبني ويرفع بيان تطبيق Teams (مع الأيقونات)
- يسجل البوت (بإدارة Teams افتراضيًا - لا يلزم اشتراك Azure)

سيعرض الإخراج `CLIENT_ID` و`CLIENT_SECRET` و`TENANT_ID` و**Teams App ID** - دوّن هذه للخطوات التالية. كما يعرض تثبيت التطبيق في Teams مباشرة.

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

أو استخدم متغيرات البيئة مباشرة: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

**5. ثبّت التطبيق في Teams**

سيطالبك `teams app create` بتثبيت التطبيق - اختر "Install in Teams". إذا تخطيت ذلك، يمكنك الحصول على الرابط لاحقًا:

```bash
teams app get <teamsAppId> --install-link
```

**6. تحقق من أن كل شيء يعمل**

```bash
teams app doctor <teamsAppId>
```

يشغّل هذا تشخيصات عبر تسجيل البوت، وإعداد تطبيق AAD، وصحة البيان، وإعداد SSO.

لعمليات النشر الإنتاجية، فكّر في استخدام [المصادقة الموحّدة](/ar/channels/msteams#federated-authentication-certificate-plus-managed-identity) (شهادة أو هوية مُدارة) بدلًا من أسرار العملاء.

<Note>
تُحظر محادثات المجموعات افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بالردود الجماعية، عيّن `channels.msteams.groupAllowFrom`، أو استخدم `groupPolicy: "open"` للسماح لأي عضو (مقيد بالإشارة).
</Note>

## الأهداف

- تحدّث إلى OpenClaw عبر رسائل Teams المباشرة، أو محادثات المجموعات، أو القنوات.
- أبقِ التوجيه حتميًا: تعود الردود دائمًا إلى القناة التي وصلت منها.
- استخدم سلوك قناة آمنًا افتراضيًا (الإشارات مطلوبة ما لم يُضبط خلاف ذلك).

## عمليات كتابة الإعدادات

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات الإعدادات التي يطلقها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**الوصول عبر الرسائل المباشرة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يتم تجاهل المرسلين غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائنات AAD مستقرة أو مجموعات وصول مرسلين ثابتة مثل `accessGroup:core-team`.
- لا تعتمد على مطابقة UPN/اسم العرض لقوائم السماح - فقد تتغير. يعطّل OpenClaw المطابقة المباشرة للأسماء افتراضيًا؛ فعّلها صراحة باستخدام `channels.msteams.dangerouslyAllowNameMatching: true`.
- يستطيع المعالج حل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد.

**وصول المجموعات**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عندما يكون غير معيّن.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين أو مجموعات وصول المرسلين الثابتة التي يمكنها التفعيل في محادثات/قنوات المجموعات (يرجع إلى `channels.msteams.allowFrom`).
- عيّن `groupPolicy: "open"` للسماح لأي عضو (مع البقاء مقيدًا بالإشارة افتراضيًا).
- للسماح بـ **عدم وجود قنوات**، عيّن `channels.msteams.groupPolicy: "disabled"`.

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

**قائمة سماح Teams + القناة**

- حدّد نطاق ردود المجموعة/القناة عبر إدراج الفرق والقنوات ضمن `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات محادثات Teams المستقرة من روابط Teams، وليس أسماء العرض القابلة للتغيير.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، تُقبل الفرق/القنوات المدرجة فقط (مقيدة بالإشارة).
- يقبل معالج الإعداد إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يحل OpenClaw أسماء قوائم السماح للفريق/القناة والمستخدم إلى معرّفات (عندما تسمح أذونات Graph)
  ويسجل الربط؛ تُبقى أسماء الفريق/القناة غير المحلولة كما كُتبت، لكنها تُتجاهل في التوجيه افتراضيًا ما لم يكن `channels.msteams.dangerouslyAllowNameMatching: true` مفعّلًا.

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

إذا لم تستطع استخدام Teams CLI، يمكنك إعداد البوت يدويًا عبر Azure Portal.

### كيفية عمله

1. تأكد من توفر Microsoft Teams Plugin (مضمّن في الإصدارات الحالية).
2. أنشئ **Azure Bot** (App ID + سر + tenant ID).
3. ابنِ **حزمة تطبيق Teams** تشير إلى البوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams في فريق (أو في النطاق الشخصي للرسائل المباشرة).
5. اضبط `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway لحركة Webhook الخاصة بـ Bot Framework على `/api/messages` افتراضيًا.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [إنشاء Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ علامة تبويب **الأساسيات**:

   | الحقل              | القيمة                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **معرّف البوت**     | اسم البوت لديك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **الاشتراك**   | اختر اشتراك Azure لديك                           |
   | **مجموعة الموارد** | أنشئ واحدة جديدة أو استخدم الموجودة                               |
   | **طبقة التسعير**   | **مجاني** للتطوير/الاختبار                                 |
   | **نوع التطبيق**    | **مستأجر واحد** (موصى به - راجع الملاحظة أدناه)         |
   | **نوع الإنشاء**  | **إنشاء Microsoft App ID جديد**                          |

<Warning>
أُلغي دعم إنشاء بوتات جديدة متعددة المستأجرين بعد 2025-07-31. استخدم **مستأجرًا واحدًا** للبوتات الجديدة.
</Warning>

3. انقر **مراجعة + إنشاء** → **إنشاء** (انتظر نحو 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot لديك → **Configuration**
2. انسخ **Microsoft App ID** → هذا هو `appId` الخاص بك
3. انقر **Manage Password** → انتقل إلى App Registration
4. ضمن **Certificates & secrets** → **New client secret** → انسخ **Value** → هذا هو `appPassword` الخاص بك
5. انتقل إلى **Overview** → انسخ **Directory (tenant) ID** → هذا هو `tenantId` الخاص بك

### الخطوة 3: ضبط نقطة نهاية المراسلة

1. في Azure Bot → **Configuration**
2. عيّن **Messaging endpoint** إلى عنوان Webhook الخاص بك:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تفعيل قناة Teams

1. في Azure Bot → **Channels**
2. انقر **Microsoft Teams** → ضبط → حفظ
3. اقبل شروط الخدمة

### الخطوة 5: بناء بيان تطبيق Teams

- ضمّن إدخال `bot` مع `botId = <App ID>`.
- النطاقات: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (مطلوب لمعالجة الملفات في النطاق الشخصي).
- أضف أذونات RSC (راجع [أذونات RSC](#current-teams-rsc-permissions-manifest)).
- أنشئ الأيقونات: `outline.png` (32x32) و`color.png` (192x192).
- اضغط الملفات الثلاثة معًا: `manifest.json`، `outline.png`، `color.png`.

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

متغيرات البيئة: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

### الخطوة 7: تشغيل Gateway

تبدأ قناة Teams تلقائيًا عندما يكون Plugin متاحًا وتوجد إعدادات `msteams` مع بيانات الاعتماد.

</details>

## المصادقة الموحّدة (شهادة بالإضافة إلى هوية مُدارة)

> أضيفت في 2026.4.11

لعمليات النشر الإنتاجية، يدعم OpenClaw **المصادقة الموحّدة** كبديل أكثر أمانًا لأسرار العملاء. تتوفر طريقتان:

### الخيار أ: المصادقة القائمة على الشهادة

استخدم شهادة PEM مسجلة مع تسجيل تطبيق Entra ID لديك.

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

استخدم Azure Managed Identity للمصادقة بلا كلمة مرور. هذا مثالي لعمليات النشر على بنية Azure التحتية (AKS، App Service، أجهزة Azure VM) حيث تتوفر هوية مُدارة.

**كيفية عملها:**

1. يحتوي جراب/جهاز VM الخاص بالبوت على هوية مُدارة (مخصصة للنظام أو مخصصة للمستخدم).
2. يربط **اعتماد هوية موحّدة** الهوية المُدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على الرموز من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يُمرر الرمز إلى Teams SDK لمصادقة البوت.

**المتطلبات المسبقة:**

- بنية Azure تحتية مع تمكين الهوية المُدارة (هوية حمل عمل AKS، App Service، VM)
- اعتماد هوية موحّدة مُنشأ على تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من الجراب/VM

**الإعدادات (هوية مُدارة مخصصة للنظام):**

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

**التكوين (الهوية المُدارة المعيّنة من قِبل المستخدم):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (للهوية المعيّنة من قِبل المستخدم فقط)

### إعداد هوية عبء العمل في AKS

لعمليات نشر AKS التي تستخدم هوية عبء العمل:

1. **فعّل هوية عبء العمل** على عنقود AKS لديك.
2. **أنشئ بيانات اعتماد هوية موحّدة** على تسجيل تطبيق Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **أضف تعليقًا توضيحيًا إلى حساب خدمة Kubernetes** باستخدام معرّف عميل التطبيق:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **أضف تسمية إلى الـ pod** لحقن هوية عبء العمل:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكد من الوصول الشبكي** إلى IMDS (`169.254.169.254`) - إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج تسمح بحركة المرور إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة               | التكوين                                        | المزايا                            | العيوب                                |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **سر العميل**        | `appPassword`                                  | إعداد بسيط                        | يتطلب تدوير السر، أقل أمانًا         |
| **الشهادة**          | `authType: "federated"` + `certificatePath`    | لا يوجد سر مشترك عبر الشبكة       | عبء إضافي لإدارة الشهادات            |
| **الهوية المُدارة**  | `authType: "federated"` + `useManagedIdentity` | بلا كلمات مرور، لا أسرار لإدارتها | تتطلب بنية Azure التحتية             |

**السلوك الافتراضي:** عندما لا يتم تعيين `authType`، يستخدم OpenClaw مصادقة سر العميل افتراضيًا. تستمر التكوينات الحالية في العمل دون تغييرات.

## التطوير المحلي (إنشاء نفق)

لا يمكن لـ Teams الوصول إلى `localhost`. استخدم نفق تطوير ثابتًا حتى يبقى عنوان URL كما هو عبر الجلسات:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

بدائل: `ngrok http 3978` أو `tailscale funnel 3978` (قد تتغير عناوين URL في كل جلسة).

إذا تغير عنوان URL الخاص بالنفق، فحدّث نقطة النهاية:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## اختبار البوت

**تشغيل التشخيصات:**

```bash
teams app doctor <teamsAppId>
```

يتحقق من تسجيل البوت، وتطبيق AAD، والبيان، وتكوين SSO في مرور واحد.

**إرسال رسالة اختبار:**

1. ثبّت تطبيق Teams (استخدم رابط التثبيت من `teams app get <id> --install-link`)
2. ابحث عن البوت في Teams وأرسل رسالة مباشرة
3. تحقق من سجلات Gateway بحثًا عن النشاط الوارد

## متغيرات البيئة

يمكن تعيين جميع مفاتيح التكوين عبر متغيرات البيئة بدلًا من ذلك:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (اتحاد + شهادة)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
- `MSTEAMS_USE_MANAGED_IDENTITY` (اتحاد + هوية مُدارة)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (الهوية المُدارة المعيّنة من قِبل المستخدم فقط)

## إجراء معلومات العضو

يعرّض OpenClaw إجراء `member-info` مدعومًا من Graph لـ Microsoft Teams حتى تتمكن الوكلاء والأتمتات من حل تفاصيل أعضاء القناة (اسم العرض، البريد الإلكتروني، الدور) مباشرةً من Microsoft Graph.

المتطلبات:

- إذن RSC باسم `Member.Read.Group` (موجود بالفعل في البيان الموصى به)
- لعمليات البحث عبر الفرق: إذن تطبيق Graph باسم `User.Read.All` مع موافقة المسؤول

الإجراء محكوم بواسطة `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القنوات/المجموعات الحديثة التي تُغلّف داخل الموجّه.
- يعود إلى `messages.groupChat.historyLimit`. عيّن `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل السلاسل المجلوب بواسطة قوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذلك لا يتضمن تمهيد سياق السلسلة إلا الرسائل من المرسلين المسموح لهم.
- يتم حاليًا تمرير سياق المرفقات المقتبسة (المشتق من HTML ردود Teams عبر `ReplyTo*`) كما ورد.
- بعبارة أخرى، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ ولا تتم تصفية إلا مسارات سياق تكميلية محددة اليوم.
- يمكن تقييد سجل الرسائل المباشرة باستخدام `channels.msteams.dmHistoryLimit` (دورات المستخدم). تجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات RSC الحالية في Teams (البيان)

هذه هي **أذونات resourceSpecific الحالية** في بيان تطبيق Teams لدينا. لا تنطبق إلا داخل الفريق/الدردشة حيث تم تثبيت التطبيق.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` (Application) - استقبال جميع رسائل القناة دون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**للدردشات الجماعية:**

- `ChatMessage.Read.Chat` (Application) - استقبال جميع رسائل الدردشة الجماعية دون @mention

لإضافة أذونات RSC عبر Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## مثال بيان Teams (منقّح)

مثال صالح وحدّ أدنى يتضمن الحقول المطلوبة. استبدل المعرّفات وعناوين URL.

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

### ملاحظات البيان (حقول لا بد منها)

- يجب أن يطابق `bots[].botId` **معرّف تطبيق Azure Bot**.
- يجب أن يطابق `webApplicationInfo.id` **معرّف تطبيق Azure Bot**.
- يجب أن يتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` مطلوب لمعالجة الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` قراءة/إرسال القنوات إذا كنت تريد حركة مرور القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبت بالفعل (على سبيل المثال، لإضافة أذونات RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

بعد التحديث، أعد تثبيت التطبيق في كل فريق حتى تصبح الأذونات الجديدة نافذة، و**أغلق Teams بالكامل ثم أعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

<details>
<summary>تحديث البيان يدويًا (بدون CLI)</summary>

1. حدّث `manifest.json` بالإعدادات الجديدة
2. **زد حقل `version`** (على سبيل المثال، `1.0.0` → `1.1.0`)
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json`، `outline.png`، `color.png`)
4. ارفع ملف zip الجديد:
   - **مركز إدارة Teams:** تطبيقات Teams → إدارة التطبيقات → ابحث عن تطبيقك → رفع إصدار جديد
   - **التحميل الجانبي:** في Teams → التطبيقات → إدارة تطبيقاتك → رفع تطبيق مخصص

</details>

## القدرات: RSC فقط مقابل Graph

### مع **Teams RSC فقط** (التطبيق مثبت، ولا توجد أذونات Graph API)

يعمل:

- قراءة محتوى **نص** رسالة القناة.
- إرسال محتوى **نص** رسالة القناة.
- استقبال مرفقات الملفات في **الشخصي (الرسائل المباشرة)**.

لا يعمل:

- **محتويات الصور أو الملفات** في القنوات/المجموعات (تتضمن الحمولة كعب HTML فقط).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (بعد حدث Webhook المباشر).

### مع **Teams RSC + أذونات تطبيق Microsoft Graph**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة في الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القناة/الدردشة عبر Graph.

### RSC مقابل Graph API

| القدرة                  | أذونات RSC           | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل الآنية**      | نعم (عبر Webhook)    | لا (استطلاع فقط)                   |
| **الرسائل التاريخية**   | لا                   | نعم (يمكن الاستعلام عن السجل)      |
| **تعقيد الإعداد**       | بيان التطبيق فقط     | يتطلب موافقة المسؤول + تدفق رمز    |
| **يعمل دون اتصال**      | لا (يجب أن يكون قيد التشغيل) | نعم (استعلام في أي وقت)      |

**الخلاصة:** RSC مخصص للاستماع الآني؛ وGraph API مخصص للوصول التاريخي. لمتابعة الرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط والسجل المدعومان بـ Graph (مطلوبان للقنوات)

إذا كنت تحتاج إلى الصور/الملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب عليك تفعيل أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **تسجيل التطبيق** في Entra ID (Azure AD)، أضف **أذونات تطبيق** Microsoft Graph:
   - `ChannelMessage.Read.All` (مرفقات القنوات + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (الدردشات الجماعية)
2. **امنح موافقة المسؤول** للمستأجر.
3. ارفع **إصدار بيان** تطبيق Teams، وأعد رفعه، و**أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams بالكامل ثم أعد تشغيله** لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

**إذن إضافي لإشارات المستخدمين:** تعمل إشارات @mentions للمستخدمين مباشرة للمستخدمين داخل المحادثة. ومع ذلك، إذا كنت تريد البحث ديناميكيًا عن مستخدمين **ليسوا في المحادثة الحالية** والإشارة إليهم، فأضف إذن `User.Read.All` (Application) وامنح موافقة المسؤول.

## القيود المعروفة

### مهل Webhook

يسلّم Teams الرسائل عبر Webhook HTTP. إذا استغرقت المعالجة وقتًا طويلًا جدًا (على سبيل المثال، استجابات LLM البطيئة)، فقد ترى:

- مهل Gateway
- إعادة Teams محاولة إرسال الرسالة (مما يسبب تكرارات)
- إسقاط الردود

يتعامل OpenClaw مع ذلك عبر الإرجاع بسرعة وإرسال الردود بشكل استباقي، لكن الردود البطيئة جدًا قد تظل تسبب مشكلات.

### التنسيق

Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق**، _مائل_، `code`، الروابط
- قد لا يُعرض Markdown المعقّد (الجداول، القوائم المتداخلة) بشكل صحيح
- تُدعم Adaptive Cards للاستطلاعات وإرسال العروض الدلالية (انظر أدناه)

## الإعدادات

الإعدادات الرئيسية (راجع `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تفعيل/تعطيل القناة.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: بيانات اعتماد البوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة السماح للرسائل المباشرة (يوصى بمعرّفات كائنات AAD). يحلّ معالج الإعداد الأسماء إلى معرّفات أثناء الإعداد عندما يكون الوصول إلى Graph متاحًا.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تفعيل مطابقة UPN/اسم العرض القابلين للتغيير والتوجيه المباشر باسم الفريق/القناة.
- `channels.msteams.textChunkLimit`: حجم جزء النص الصادر.
- `channels.msteams.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة السماح لمضيفي المرفقات الواردة (تكون افتراضيًا نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة السماح لإرفاق ترويسات Authorization عند إعادة محاولة الوسائط (تكون افتراضيًا مضيفي Graph + Bot Framework).
- `channels.msteams.requireMention`: يتطلب @mention في القنوات/المجموعات (الافتراضي true).
- `channels.msteams.replyStyle`: `thread | top-level` (راجع [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات افتراضية لكل فريق لسياسة الأدوات (`allow`/`deny`/`alsoAllow`) تُستخدم عندما يكون تجاوز القناة مفقودًا.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات افتراضية لكل فريق ولكل مُرسل لسياسة الأدوات (يدعم حرف البدل `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مُرسل (يدعم حرف البدل `"*"`).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:`، `e164:`، `username:`، `name:` (لا تزال المفاتيح القديمة غير المسبوقة تُعيّن إلى `id:` فقط).
- `channels.msteams.actions.memberInfo`: تفعيل أو تعطيل إجراء معلومات العضو المدعوم من Graph (الافتراضي: مفعّل عند توفر بيانات اعتماد Graph).
- `channels.msteams.authType`: نوع المصادقة - `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (مصادقة federated + certificate).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختياري، غير مطلوبة للمصادقة).
- `channels.msteams.useManagedIdentity`: تفعيل مصادقة managed identity (وضع federated).
- `channels.msteams.managedIdentityClientId`: معرّف العميل للهوية المُدارة المعيّنة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرّف موقع SharePoint لرفع الملفات في محادثات/قنوات المجموعات (راجع [إرسال الملفات في محادثات المجموعات](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (راجع [/concepts/session](/ar/concepts/session)):
  - تشارك الرسائل المباشرة الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: السلاسل مقابل المنشورات

أدخل Teams مؤخرًا نمطين لواجهة مستخدم القنوات فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                               | `replyStyle` الموصى به |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (كلاسيكي)      | تظهر الرسائل كبطاقات مع ردود مترابطة أسفلها | `thread` (الافتراضي)       |
| **Threads** (شبيه بـ Slack) | تتدفق الرسائل خطيًا، بشكل أقرب إلى Slack                   | `top-level`              |

**المشكلة:** لا تكشف واجهة Teams API عن نمط واجهة المستخدم الذي تستخدمه القناة. إذا استخدمت `replyStyle` الخاطئ:

- `thread` في قناة بنمط Threads → تظهر الردود متداخلة بشكل غير مريح
- `top-level` في قناة بنمط Posts → تظهر الردود كمنشورات منفصلة على المستوى الأعلى بدلًا من داخل السلسلة

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

### أسبقية الحل

عندما يرسل البوت ردًا إلى قناة، يُحلّ `replyStyle` من التجاوز الأكثر تحديدًا نزولًا إلى الإعداد الافتراضي. أول قيمة غير `undefined` هي التي تفوز:

1. **لكل قناة** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **لكل فريق** — `channels.msteams.teams.<teamId>.replyStyle`
3. **عام** — `channels.msteams.replyStyle`
4. **افتراضي ضمني** — مشتق من `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

إذا ضبطت `requireMention: false` عامًا من دون `replyStyle` صريح، فستظهر الإشارات في قنوات نمط Posts كمنشورات على المستوى الأعلى حتى عندما كان الوارد ردًا في سلسلة. ثبّت `replyStyle: "thread"` على المستوى العام أو مستوى الفريق أو القناة لتجنب المفاجآت.

### الحفاظ على سياق السلسلة

عندما يكون `replyStyle: "thread"` ساريًا وتمت الإشارة إلى البوت عبر @mention من داخل سلسلة قناة، يعيد OpenClaw إرفاق جذر السلسلة الأصلي بمرجع المحادثة الصادرة (`19:…@thread.tacv2;messageid=<root>`) بحيث يصل الرد داخل السلسلة نفسها. ينطبق ذلك على كل من الإرسالات الحية (داخل الدور) والإرسالات الاستباقية التي تتم بعد انتهاء صلاحية سياق دور Bot Framework (مثل الوكلاء طويلي التشغيل، وردود استدعاءات الأدوات الموضوعة في الصف عبر `mcp__openclaw__message`).

يؤخذ جذر السلسلة من `threadId` المخزن على مرجع المحادثة. تعود المراجع المخزنة الأقدم التي سبقت `threadId` إلى `activityId` (أي نشاط وارد زرع المحادثة آخر مرة)، لذلك تواصل عمليات النشر الحالية العمل من دون إعادة زرع.

عندما يكون `replyStyle: "top-level"` ساريًا، يُجاب عمدًا عن الواردات من سلاسل القنوات كمنشورات جديدة على المستوى الأعلى — ولا تُرفق لاحقة السلسلة. هذا هو السلوك الصحيح لقنوات نمط Threads؛ إذا رأيت منشورات على المستوى الأعلى حيث كنت تتوقع ردودًا مترابطة، فهذا يعني أن `replyStyle` مضبوط بشكل غير صحيح لتلك القناة.

## المرفقات والصور

**القيود الحالية:**

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر واجهات Teams bot file APIs.
- **القنوات/المجموعات:** توجد المرفقات في تخزين M365 (SharePoint/OneDrive). لا تتضمن حمولة Webhook إلا قالب HTML، وليس بايتات الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- للإرسالات الصريحة التي تبدأ بالملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ يصبح `message` الاختياري النص/التعليق المصاحب، ويتجاوز `filename` الاسم المرفوع.

من دون أذونات Graph، ستُستقبل رسائل القنوات التي تحتوي على صور كنص فقط (محتوى الصورة غير متاح للبوت).
افتراضيًا، لا ينزّل OpenClaw الوسائط إلا من أسماء مضيفي Microsoft/Teams. تجاوز ذلك باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
لا تُرفق ترويسات Authorization إلا للمضيفين في `channels.msteams.mediaAuthAllowHosts` (تكون افتراضيًا مضيفي Graph + Bot Framework). أبقِ هذه القائمة صارمة (تجنب لاحقات متعددة المستأجرين).

## إرسال الملفات في محادثات المجموعات

يمكن للبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard (مضمّن). ومع ذلك، يتطلب **إرسال الملفات في محادثات/قنوات المجموعات** إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                           | الإعداد المطلوب                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة**                  | FileConsentCard → يقبل المستخدم → يرفع البوت | يعمل مباشرة                            |
| **محادثات/قنوات المجموعات** | الرفع إلى SharePoint → مشاركة الرابط            | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | مضمنة بترميز Base64                        | تعمل مباشرة                            |

### لماذا تحتاج محادثات المجموعات إلى SharePoint

لا تملك البوتات محرك OneDrive شخصيًا (لا تعمل نقطة نهاية Graph API `/me/drive` لهويات التطبيقات). لإرسال الملفات في محادثات/قنوات المجموعات، يرفع البوت إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` (Application) - اختياري، يفعّل روابط المشاركة لكل مستخدم

2. **امنح موافقة المسؤول** للمستأجر.

3. **احصل على معرّف موقع SharePoint:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **اضبط OpenClaw:**

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
| محادثة مجموعة + ملف + ضبط `sharePointSiteId` | الرفع إلى SharePoint، إرسال رابط مشاركة            |
| محادثة مجموعة + ملف + عدم وجود `sharePointSiteId`         | محاولة رفع إلى OneDrive (قد تفشل)، إرسال النص فقط |
| محادثة شخصية + ملف                              | تدفق FileConsentCard (يعمل بدون SharePoint)    |
| أي سياق + صورة                               | مضمنة بترميز Base64 (تعمل بدون SharePoint)   |

### موقع تخزين الملفات

تُخزن الملفات المرفوعة في مجلد `/OpenClawShared/` في مكتبة المستندات الافتراضية لموقع SharePoint المضبوط.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams كـ Adaptive Cards (لا توجد Teams poll API أصلية).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- تُسجَّل الأصوات بواسطة Gateway في `~/.openclaw/msteams-polls.json`.
- يجب أن يبقى Gateway متصلاً بالإنترنت لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائياً بعد (افحص ملف المخزن إذا لزم الأمر).

## بطاقات العروض التقديمية

أرسل حمولات عروض تقديمية دلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. يعرضها OpenClaw كبطاقات Teams Adaptive Cards من عقد العرض التقديمي العام.

يقبل معامل `presentation` كتلاً دلالية. عند توفير `presentation`، يكون نص الرسالة اختيارياً.

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

| نوع الهدف           | التنسيق                         | المثال                                              |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| مستخدم (حسب المعرف) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| مستخدم (حسب الاسم)  | `user:<display-name>`            | `user:John Smith` (يتطلب Graph API)                 |
| مجموعة/قناة         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| مجموعة/قناة (خام)   | `<conversation-id>`              | `19:abc123...@thread.tacv2` (إذا كان يحتوي على `@thread`) |

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
من دون البادئة `user:`، تنتقل الأسماء افتراضياً إلى حلّ المجموعة أو الفريق. استخدم دائماً `user:` عند استهداف الأشخاص باسم العرض.
</Note>

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** تفاعل المستخدم، لأننا نخزن مراجع المحادثة عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة `dmPolicy` وبوابة قائمة السماح.

## معرّفات الفريق والقناة (مشكلة شائعة)

معامل الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليس** معرف الفريق المستخدم للتكوين. استخرج المعرّفات من مسار URL بدلاً من ذلك:

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

**للتكوين:**

- مفتاح الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثلاً `19:Bk4j...@thread.tacv2`؛ قد تعرض المستأجرات الأقدم `@thread.skype`، وهو صالح أيضاً)
- مفتاح القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معامل الاستعلام `groupId` لتوجيه OpenClaw. إنه معرف مجموعة Microsoft Entra، وليس معرف محادثة Bot Framework المستخدم في أنشطة Teams الواردة.

## القنوات الخاصة

تتمتع الروبوتات بدعم محدود في القنوات الخاصة:

| الميزة                       | القنوات القياسية | القنوات الخاصة                |
| ---------------------------- | ----------------- | ----------------------------- |
| تثبيت الروبوت                | نعم               | محدود                         |
| الرسائل في الوقت الفعلي (Webhook) | نعم               | قد لا تعمل                    |
| أذونات RSC                  | نعم               | قد تعمل بشكل مختلف            |
| @mentions                    | نعم               | إذا كان الروبوت قابلاً للوصول |
| سجل Graph API                | نعم               | نعم (مع الأذونات)             |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات الروبوت
2. استخدم الرسائل المباشرة - يستطيع المستخدمون دائماً مراسلة الروبوت مباشرة
3. استخدم Graph API للوصول إلى السجل (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### مشكلات شائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams تماماً ثم أعد فتحه.
- **لا توجد ردود في القناة:** الإشارات مطلوبة افتراضياً؛ اضبط `channels.msteams.requireMention=false` أو كوّن الإعداد لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض البيان القديم):** أزل التطبيق ثم أعد إضافته، وأغلق Teams تماماً لتحديثه.
- **401 Unauthorized من Webhook:** متوقع عند الاختبار يدوياً بدون Azure JWT - يعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع البيان

- **"Icon file cannot be empty":** يشير البيان إلى ملفات أيقونات بحجم 0 بايت. أنشئ أيقونات PNG صالحة (32x32 للملف `outline.png`، و192x192 للملف `color.png`).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتاً في فريق/دردشة أخرى. ابحث عنه وأزله أولاً، أو انتظر 5-10 دقائق حتى يكتمل الانتشار.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلاً من ذلك، وافتح أدوات مطور المتصفح (F12) ← تبويب Network، وتحقق من نص الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلاً من "Upload a custom app" - فهذا غالباً يتجاوز قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقق من أن `webApplicationInfo.id` يطابق App ID الخاص بالروبوت تماماً
2. أعد رفع التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقق مما إذا كان مسؤول المؤسسة قد حظر أذونات RSC
4. تأكد من أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` لدردشات المجموعات

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

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتحصين
