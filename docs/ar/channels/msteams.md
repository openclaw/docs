---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم روبوت Microsoft Teams وإمكاناته وإعداده
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T13:44:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

الحالة: النص ومرفقات الرسائل المباشرة مدعومان؛ يتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في الدردشات الجماعية](#sending-files-in-group-chats)). تُرسل استطلاعات الرأي عبر Adaptive Cards. تتيح إجراءات الرسائل خيار `upload-file` صريحًا لعمليات الإرسال التي تبدأ بملف.

## Plugin مضمّن

يأتي Microsoft Teams بوصفه Plugin مضمّنًا في إصدارات OpenClaw الحالية؛ ولا يلزم تثبيت منفصل في الإصدار المعتاد المحزّم.

في إصدار أقدم أو تثبيت مخصص يستثني Teams المضمّن، ثبّت حزمة npm مباشرةً:

```bash
openclaw plugins install @openclaw/msteams
```

استخدم الحزمة المجردة لاتباع وسم الإصدار الرسمي الحالي. ثبّت إصدارًا محددًا بدقة فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

نسخة محلية من المستودع (التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

يتولى [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) تسجيل الروبوت وإنشاء البيان وتوليد بيانات الاعتماد بأمر واحد.

**1. التثبيت وتسجيل الدخول**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # تحقّق من تسجيل دخولك واعرض معلومات المستأجر
```

<Note>
لا يزال Teams CLI في مرحلة المعاينة حاليًا. قد تتغير الأوامر والأعلام بين الإصدارات.
</Note>

**2. بدء نفق** (يتعذر على Teams الوصول إلى localhost)

ثبّت devtunnel CLI وصادقه عند الحاجة ([دليل البدء](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# إعداد لمرة واحدة (عنوان URL دائم عبر الجلسات):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# في كل جلسة تطوير:
devtunnel host my-openclaw-bot
# نقطة النهاية: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
يلزم `--allow-anonymous` لأن Teams لا يستطيع المصادقة باستخدام devtunnels. ومع ذلك، لا يزال Teams SDK يتحقق من صحة كل طلب روبوت وارد.
</Note>

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (قد تتغير عناوين URL في كل جلسة).

**3. إنشاء التطبيق**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

ينشئ هذا تطبيق Entra ID ‏(Azure AD)، ويولّد سر عميل، ويبني بيان تطبيق Teams ويرفعه (مع الأيقونات)، ويسجّل روبوتًا تديره Teams (من دون الحاجة إلى اشتراك Azure). يتضمن الإخراج `CLIENT_ID` و`CLIENT_SECRET` و`TENANT_ID` و**معرّف تطبيق Teams**؛ كما يتيح تثبيت التطبيق مباشرةً في Teams.

**4. تكوين OpenClaw** باستخدام بيانات الاعتماد الواردة في الإخراج:

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

**5. تثبيت التطبيق في Teams**

يطالبك `teams app create` بتثبيت التطبيق؛ حدّد "Install in Teams". للحصول على رابط التثبيت لاحقًا:

```bash
teams app get <teamsAppId> --install-link
```

**6. التحقق من عمل كل شيء**

```bash
teams app doctor <teamsAppId>
```

يشغّل عمليات تشخيص تشمل تسجيل الروبوت، وتكوين تطبيق AAD، وصحة البيان، وإعداد SSO.

بالنسبة إلى بيئة الإنتاج، فكّر في استخدام [المصادقة الموحّدة](#federated-authentication-certificate-plus-managed-identity) (شهادة أو هوية مُدارة) بدلًا من أسرار العميل.

<Note>
تُحظر الدردشات الجماعية افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بالردود الجماعية، اضبط `channels.msteams.groupAllowFrom`، أو استخدم `groupPolicy: "open"` للسماح لأي عضو (مع اشتراط الإشارة).
</Note>

## الأهداف

- تواصل مع OpenClaw عبر الرسائل المباشرة أو الدردشات الجماعية أو القنوات في Teams.
- حافظ على حتمية التوجيه: تعود الردود دائمًا إلى القناة التي وردت منها.
- استخدم سلوكًا آمنًا للقنوات افتراضيًا (تكون الإشارات مطلوبة ما لم يُضبط خلاف ذلك).

## عمليات كتابة التكوين

يمكن لـ Microsoft Teams افتراضيًا كتابة تحديثات التكوين التي يُشغّلها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**الوصول إلى الرسائل المباشرة**

- الإعداد الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يُتجاهل المرسلون غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائنات AAD ثابتة أو مجموعات وصول ثابتة للمرسلين مثل `accessGroup:core-team`.
- لا تعتمد على مطابقة UPN/اسم العرض في قوائم السماح؛ فقد تتغير. يعطّل OpenClaw المطابقة المباشرة للأسماء افتراضيًا؛ فعّلها باستخدام `channels.msteams.dangerouslyAllowNameMatching: true`.
- يمكن للمعالج تحويل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**الوصول إلى المجموعات**

- الإعداد الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تُضف `groupAllowFrom`). يمكن لـ `channels.defaults.groupPolicy` تجاوز الإعداد الافتراضي المشترك عندما لا يكون `channels.msteams.groupPolicy` مضبوطًا.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين أو مجموعات الوصول الثابتة للمرسلين الذين يمكنهم التشغيل في الدردشات الجماعية/القنوات (ويعود إلى `channels.msteams.allowFrom` عند عدم الضبط).
- اضبط `groupPolicy: "open"` للسماح لأي عضو (مع بقاء اشتراط الإشارة افتراضيًا).
- لحظر **جميع** القنوات، اضبط `channels.msteams.groupPolicy: "disabled"`.

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

**قائمة السماح للفرق + القنوات**

- حدّد نطاق الردود الجماعية/ردود القنوات بإدراج الفرق والقنوات ضمن `channels.msteams.teams`.
- استخدم معرّفات محادثات Teams الثابتة من روابط Teams بوصفها مفاتيح، وليس أسماء العرض القابلة للتغيير (راجع [معرّفات الفريق والقناة](#team-and-channel-ids-common-gotcha)).
- عند وجود `groupPolicy="allowlist"` وقائمة سماح للفرق، لا تُقبل إلا الفرق/القنوات المدرجة (مع اشتراط الإشارة).
- يقبل معالج التكوين إدخالات `Team/Channel` ويخزّنها لك.
- عند بدء التشغيل، يحوّل OpenClaw أسماء الفرق/القنوات وأسماء قائمة سماح المستخدمين إلى معرّفات (عندما تسمح أذونات Graph بذلك) ويسجّل المطابقة. تُحفظ الأسماء التي تعذر تحويلها كما كُتبت، لكنها تُتجاهل في التوجيه ما لم يُضبط `channels.msteams.dangerouslyAllowNameMatching: true`.

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

### آلية العمل

1. تأكد من توفر Plugin الخاص بـ Microsoft Teams (مضمّن في الإصدارات الحالية).
2. أنشئ **Azure Bot** (معرّف التطبيق + السر + معرّف المستأجر).
3. أنشئ **حزمة تطبيق Teams** تشير إلى الروبوت، بما في ذلك أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams في فريق (أو في النطاق الشخصي للرسائل المباشرة).
5. كوّن `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway افتراضيًا إلى حركة Webhook الخاصة بـ Bot Framework على `/api/messages`.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ علامة التبويب **Basics**:

   | الحقل              | القيمة                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | اسم الروبوت، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **Subscription**   | حدّد اشتراك Azure الخاص بك                           |
   | **Resource group** | أنشئ مجموعة جديدة أو استخدم مجموعة موجودة                               |
   | **Pricing tier**   | **Free** للتطوير/الاختبار                                 |
   | **Type of App**    | **Single Tenant** (موصى به؛ راجع الملاحظة أدناه)          |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
أصبح إنشاء روبوتات جديدة متعددة المستأجرين مهملًا بعد 2025-07-31. استخدم **Single Tenant** للروبوتات الجديدة.
</Warning>

3. انقر على **Review + create** ثم **Create** (نحو 1-2 دقيقة).

### الخطوة 2: الحصول على بيانات الاعتماد

1. مورد Azure Bot ← **Configuration** ← انسخ **Microsoft App ID** (وهو `appId` الخاص بك).
2. **Manage Password** ← App Registration ← **Certificates & secrets** ← **New client secret** ← انسخ **Value** (وهي `appPassword` الخاصة بك).
3. **Overview** ← انسخ **Directory (tenant) ID** (وهو `tenantId` الخاص بك).

### الخطوة 3: تكوين نقطة نهاية المراسلة

1. Azure Bot ← **Configuration**.
2. اضبط **Messaging endpoint**:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling))

### الخطوة 4: تمكين قناة Teams

1. Azure Bot ← **Channels**.
2. انقر على **Microsoft Teams** ← Configure ← Save.
3. اقبل Terms of Service.

### الخطوة 5: إنشاء بيان تطبيق Teams

- أدرج إدخال `bot` مع `botId = <App ID>`.
- النطاقات: `personal` و`team` و`groupChat`.
- `supportsFiles: true` (مطلوب لمعالجة الملفات في النطاق الشخصي).
- أضف أذونات RSC (راجع [أذونات RSC](#current-teams-rsc-permissions-manifest)).
- أنشئ الأيقونات: `outline.png` ‏(32x32) و`color.png` ‏(192x192).
- اضغط `manifest.json` و`outline.png` و`color.png` معًا في ملف Zip.

### الخطوة 6: تكوين OpenClaw

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

تبدأ قناة Teams تلقائيًا عندما يتوفر Plugin ويحتوي تكوين `msteams` على بيانات الاعتماد.

</details>

## المصادقة الموحّدة (شهادة بالإضافة إلى هوية مُدارة)

بالنسبة إلى بيئة الإنتاج، يدعم OpenClaw **المصادقة الموحّدة** عبر `channels.msteams.authType: "federated"` بوصفها بديلًا لأسرار العميل. توجد طريقتان:

### الخيار أ: المصادقة المستندة إلى شهادة

استخدم شهادة PEM مسجّلة في تسجيل تطبيق Entra ID الخاص بك.

**الإعداد:**

1. ولّد شهادة أو احصل عليها (بتنسيق PEM مع مفتاح خاص).
2. Entra ID ← App Registration ← **Certificates & secrets** ← **Certificates** ← ارفع الشهادة العامة.

**التكوين:**

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

استخدم Azure Managed Identity للمصادقة من دون كلمة مرور على بنية Azure التحتية (AKS وApp Service وأجهزة Azure الافتراضية).

**آلية العمل:**

1. تحتوي حاوية الروبوت/الجهاز الافتراضي على هوية مُدارة (معيّنة من النظام أو المستخدم).
2. تربط بيانات اعتماد هوية موحّدة الهوية المُدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw ‏`@azure/identity` للحصول على الرموز المميزة من نقطة نهاية Azure IMDS.
4. يُمرر الرمز المميز إلى Teams SDK لمصادقة الروبوت.

**المتطلبات الأساسية:**

- بنية Azure التحتية مع تمكين الهوية المُدارة (هوية حمل العمل في AKS أو App Service أو VM).
- بيانات اعتماد هوية موحّدة مُنشأة في تسجيل تطبيق Entra ID.
- وصول الشبكة إلى IMDS ‏(`169.254.169.254:80`) من الحاوية/VM.

**الإعداد (هوية مُدارة معيّنة من النظام):**

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

**الإعداد (هوية مُدارة معيّنة من المستخدم):** أضف `managedIdentityClientId: "<MI_CLIENT_ID>"` إلى الكتلة أعلاه.

**متغيرات البيئة:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (للهوية المعيّنة من المستخدم فقط)

### إعداد هوية حمل العمل في AKS

لعمليات نشر AKS التي تستخدم هوية حمل العمل:

1. **فعّل هوية حمل العمل** في مجموعة AKS.
2. **أنشئ بيانات اعتماد هوية موحّدة** في تسجيل تطبيق Entra ID:

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

4. **أضف تسمية إلى الحاوية** لحقن هوية حمل العمل:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **اسمح بالوصول عبر الشبكة** إلى IMDS ‏(`169.254.169.254`): إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج لـ `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة               | الإعداد                                         | المزايا                               | العيوب                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **سر العميل**    | `appPassword`                                  | إعداد بسيط                       | يلزم تدوير السر، وأمانه أقل |
| **الشهادة**      | `authType: "federated"` + `certificatePath`    | لا يوجد سر مشترك عبر الشبكة      | عبء إدارة الشهادات       |
| **الهوية المُدارة** | `authType: "federated"` + `useManagedIdentity` | بلا كلمة مرور، ولا أسرار لإدارتها | تتطلب بنية Azure التحتية         |

يمكن تعيين `certificateThumbprint` إلى جانب `certificatePath`، لكن مسار المصادقة لا يقرأه حاليًا؛ ولا يُقبل إلا للتوافق المستقبلي.

**الإعداد الافتراضي:** عندما لا يكون `authType` معيّنًا، يستخدم OpenClaw مصادقة سر العميل (`appPassword`). وتستمر الإعدادات الحالية في العمل دون تغيير.

## التطوير المحلي (إنشاء نفق)

لا يمكن لـ Microsoft Teams الوصول إلى `localhost`. استخدم نفق تطوير دائمًا ليظل عنوان URL ثابتًا عبر الجلسات:

```bash
# إعداد لمرة واحدة:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# كل جلسة تطوير:
devtunnel host my-openclaw-bot
```

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (قد تتغير عناوين URL في كل جلسة).

إذا تغير عنوان URL للنفق، فحدّث نقطة النهاية:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## اختبار الروبوت

**شغّل عمليات التشخيص:**

```bash
teams app doctor <teamsAppId>
```

يتحقق من تسجيل الروبوت وتطبيق AAD والبيان وإعداد SSO في عملية واحدة.

**أرسل رسالة اختبار:**

1. ثبّت تطبيق Microsoft Teams (رابط التثبيت من `teams app get <id> --install-link`).
2. ابحث عن الروبوت في Microsoft Teams وأرسل إليه رسالة مباشرة.
3. تحقق من سجلات Gateway بحثًا عن النشاط الوارد.

## متغيرات البيئة

يمكن تعيين مفاتيح الإعداد المرتبطة بالمصادقة هذه عبر متغيرات البيئة بدلًا من `openclaw.json` (أما مفاتيح الإعداد الأخرى، مثل `groupPolicy` أو `historyLimit`، فلا يمكن تعيينها إلا في ملف الإعداد):

| متغير البيئة                              | مفتاح الإعداد                | ملاحظات                               |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                     |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                     |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                     |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` أو `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | الهوية الموحّدة + الشهادة             |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | مقبول، لكنه غير مطلوب للمصادقة     |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | الهوية الموحّدة + الهوية المُدارة        |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | للهوية المُدارة المعيّنة من المستخدم فقط |

## إجراء معلومات العضو

يوفّر OpenClaw إجراء `member-info` مدعومًا بـ Graph لـ Microsoft Teams كي تتمكن الوكلاء وعمليات الأتمتة من الحصول على تفاصيل موثّقة لقائمة الأعضاء في محادثة مهيأة.

المتطلبات:

- أذونات RSC ‏`ChannelSettings.Read.Group` و`TeamMember.Read.Group` (مضمّنة بالفعل في البيان الموصى به).

يتوفر الإجراء عند تهيئة بيانات اعتماد Graph؛ ولا يوجد مفتاح تبديل مستقل باسم `channels.msteams.actions.memberInfo`.
تعيد عمليات البحث في القنوات القياسية هوية قائمة أعضاء الفريق المطابقة واسم العرض والبريد الإلكتروني والأدوار.
في الرسالة المباشرة أو الدردشة الجماعية الحالية، يمكن للإجراء إعادة معرّف المستخدم الثابت للمرسل الموثوق به.
تتطلب عمليات البحث عن أعضاء القنوات الخاصة/المشتركة والدردشات غير الحالية أذونات إضافية لقائمة الأعضاء،
ويرفضها خط أساس الأذونات الافتراضي.

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القنوات/المجموعات الحديثة التي تُضمّن في الموجّه. ويعود إلى `messages.groupChat.historyLimit` عند عدم تعيينه، ثم تكون القيمة الافتراضية 50. عيّن `0` للتعطيل.
- يُرشّح سجل سلسلة المحادثة الذي جرى جلبه وفق قوائم المرسلين المسموح لهم (`allowFrom` / `groupAllowFrom`)؛ لذلك لا تتضمن تهيئة سياق السلسلة إلا رسائل المرسلين المسموح لهم.
- يُمرّر سياق المرفقات المقتبسة (المحلّل من HTML الخاص بمخطط Skype Reply ضمن مرفقات الرد نفسه) دون تصفية؛ وتطبّق تهيئة سجل السلسلة فقط مرشّح قائمة المرسلين المسموح لهم حاليًا.
- يمكن تقييد سجل الرسائل المباشرة باستخدام `channels.msteams.dmHistoryLimit` (أدوار المستخدم). التجاوزات الخاصة بكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات RSC الحالية في Microsoft Teams (البيان)

هذه هي **أذونات resourceSpecific الحالية** في بيان تطبيق Microsoft Teams. ولا تنطبق إلا داخل الفريق/الدردشة حيث يكون التطبيق مثبتًا.

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

أضف أذونات RSC عبر CLI الخاص بـ Microsoft Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## مثال على بيان Microsoft Teams (منقّح)

مثال صالح ومختصر يتضمن الحقول المطلوبة. استبدل المعرّفات وعناوين URL.

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

### محاذير البيان (الحقول الإلزامية)

- **يجب** أن يتطابق `bots[].botId` مع معرّف تطبيق Azure Bot.
- **يجب** أن يتطابق `webApplicationInfo.id` مع معرّف تطبيق Azure Bot.
- يجب أن يتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal`، `team`، `groupChat`).
- يلزم `bots[].supportsFiles: true` لمعالجة الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` أذونات قراءة القنوات والإرسال إليها لحركة مرور القنوات.

### تحديث تطبيق حالي

```bash
# نزّل البيان وعدّله ثم أعد تحميله
teams app manifest download <teamsAppId> manifest.json
# عدّل manifest.json محليًا...
teams app manifest upload manifest.json <teamsAppId>
# يُزاد الإصدار تلقائيًا إذا تغير المحتوى
```

بعد التحديث، أعد تثبيت التطبيق في كل فريق، ثم **اخرج من Microsoft Teams بالكامل وأعد تشغيله** (لا تكتفِ بإغلاق النافذة) لمسح بيانات التطبيق الوصفية المخزنة مؤقتًا.

<details>
<summary>تحديث البيان يدويًا (دون CLI)</summary>

1. حدّث `manifest.json` بالإعدادات الجديدة.
2. **زِد قيمة حقل `version`** (مثلًا، `1.0.0` → `1.1.0`).
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json`، `outline.png`، `color.png`).
4. حمّل ملف zip الجديد:
   - **Teams Admin Center:** Teams apps → Manage apps → ابحث عن تطبيقك → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## الإمكانات: RSC فقط مقارنةً بـ Graph

### باستخدام **RSC الخاص بـ Microsoft Teams فقط** (التطبيق مثبت، دون أذونات Graph API)

يعمل:

- قراءة المحتوى **النصي** لرسائل القناة.
- إرسال محتوى **نصي** في رسائل القناة.
- تلقي مرفقات الملفات **الشخصية (الرسائل المباشرة)**.

لا يعمل:

- **محتوى الصور أو الملفات** في القنوات/المجموعات (لا تتضمن الحمولة إلا جزء HTML نائبًا).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل خارج حدث Webhook المباشر.

### باستخدام **RSC الخاص بـ Microsoft Teams + أذونات تطبيق Microsoft Graph**

يضيف:

- تنزيل المحتوى المستضاف (الصور الملصقة في الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القنوات/الدردشات عبر Graph.

### RSC مقارنةً بـ Graph API

| الإمكانية              | أذونات RSC      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل في الوقت الفعلي**  | نعم (عبر Webhook)    | لا (الاستطلاع فقط)                   |
| **الرسائل التاريخية** | لا                   | نعم (يمكن الاستعلام عن السجل)             |
| **تعقيد الإعداد**    | بيان التطبيق فقط    | يتطلب موافقة المسؤول + تدفق الرمز |
| **العمل دون اتصال**       | لا (يجب أن يكون قيد التشغيل) | نعم (يمكن الاستعلام في أي وقت)                 |

**الخلاصة:** يُستخدم RSC للاستماع في الوقت الفعلي؛ ويُستخدم Graph API للوصول إلى السجل. لاستدراك الرسائل الفائتة أثناء عدم الاتصال، يلزم Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط والسجل الممكّنان عبر Graph

فعّل فقط أذونات تطبيق Microsoft Graph اللازمة لنطاقات Teams والبيانات التي تستخدمها:

1. Entra ID (Azure AD) **App Registration** → أضف **Application permissions** الخاصة بـ Graph:
   - `ChannelMessage.Read.All` لمرفقات القنوات وسجل القنوات.
   - `Chat.Read.All` لمرفقات المحادثات الجماعية وسجل المحادثات الجماعية.
   - `Files.Read.All` عندما يجب تنزيل وحدات بايت المرفقات من مساحة تخزين SharePoint/OneDrive؛ لا تحتاج إليها الإعدادات المخصصة للسجل فقط.
2. نفّذ **Grant admin consent** للمستأجر.
3. ارفع **manifest version** لتطبيق Teams، وأعد تحميله، ثم **أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams بالكامل ثم أعد تشغيله** لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

### استرداد ملفات القنوات/المجموعات (`graphMediaFallback`)

قد يزيل Teams علامات الملفات من نشاط HTML المُرسل إلى روبوت. في هذه الحالة، يتعذر تمييز نشاط Bot Framework عن رسالة HTML عادية؛ ولا يوجد مرجع المرفق الكامل إلا في نسخة الرسالة على Graph.

فعّل الإجراء الاحتياطي بعد منح الأذونات المذكورة أعلاه:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

ينطبق هذا على القنوات والمحادثات الجماعية فقط. ويضيف عملية بحث واحدة عن الرسالة في Graph كلما لم ينتج عن نشاط HTML أي وسائط قابلة للتنزيل مباشرة، بما في ذلك الرسائل العادية أو الرسائل التي تحتوي على إشارة فقط. القيمة الافتراضية هي `false` كي لا تكتسب عمليات التثبيت الحالية تلقائيًا حركة مرور إضافية إلى Graph أو أخطاء أذونات.

**إشارات المستخدمين:** تعمل إشارات @ مباشرةً للمستخدمين الموجودين بالفعل في المحادثة. للبحث ديناميكيًا عن مستخدمين **غير موجودين في المحادثة الحالية** والإشارة إليهم، أضف إذن `User.Read.All` (Application) وامنح موافقة المسؤول.

## القيود المعروفة

### انتهاء مهلة Webhook

يسلّم Teams الرسائل عبر Webhook باستخدام HTTP. يطبّق OpenClaw مهل خادم HTTP ثابتة على مستمع Webhook هذا: 30s لعدم النشاط، و30s لإجمالي الطلب، و15s لاستلام الترويسات. تتشارك الوسائط الواردة الاختيارية وإثراء السياق ميزانية قدرها 10 ثوانٍ، لكن Teams SDK يظل ينتظر دورة الوكيل قبل إعادة استجابة Webhook. إذا تجاوزت الدورة الكاملة نافذة إعادة المحاولة في Teams، فقد تظهر الحالات التالية:

- إعادة Teams محاولة إرسال الرسالة (ما يسبب تكرارات).
- فقدان الردود.

تُرسل الردود استباقيًا بمجرد استجابة الوكيل، لكن عمليات تشغيل الوكيل البطيئة قد تظل تؤدي إلى ظهور عمليات إعادة المحاولة أو التكرارات من جانب Teams.

### دعم سحابة Teams وعنوان URL للخدمة

تم التحقق المباشر من مسار Teams المدعوم بواسطة SDK هذا لسحابة Microsoft Teams العامة.

تستخدم الردود الواردة سياق دورة Teams SDK الوارد. أما العمليات الاستباقية خارج السياق — عمليات الإرسال والتعديل والحذف والبطاقات والاستطلاعات ورسائل الموافقة على الملفات والردود طويلة التشغيل الموضوعة في قائمة الانتظار — فتستخدم مرجع المحادثة المخزّن `serviceUrl`. تستخدم السحابة العامة افتراضيًا بيئة السحابة العامة في Teams SDK، وتسمح بالمراجع المخزنة على مضيف Teams Connector العام: `https://smba.trafficmanager.net/`.

السحابة العامة هي الإعداد الافتراضي. لا يلزم ضبط `channels.msteams.cloud` أو `channels.msteams.serviceUrl` لروبوتات السحابة العامة العادية.

بالنسبة إلى سُحب Teams غير العامة، اضبط `cloud` والحد الاستباقي المطابق عندما تنشر Microsoft واحدًا:

- يحدد `channels.msteams.cloud` الإعداد المسبق لسحابة Teams SDK للمصادقة، والتحقق من JWT، وخدمات الرموز، ونطاق Graph.
- يحدد `channels.msteams.serviceUrl` حد نقطة نهاية Bot Connector المستخدم للتحقق من مراجع المحادثات المخزنة قبل عمليات الإرسال والتعديل والحذف والبطاقات والاستطلاعات ورسائل الموافقة على الملفات والردود طويلة التشغيل الموضوعة في قائمة الانتظار. وهو مطلوب لسُحب USGov وDoD في SDK. بالنسبة إلى China/21Vianet، يستخدم OpenClaw إعداد SDK المسبق `China` ولا يقبل عناوين URL المخزنة/المكوّنة للخدمة إلا على مضيفات قنوات Azure China Bot Framework.

تنشر Microsoft نقاط نهاية Bot Connector الاستباقية العالمية في قسم [إنشاء المحادثة](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) من وثائق المراسلة الاستباقية في Teams. استخدم `serviceUrl` الخاص بالنشاط الوارد عند توفره؛ وإلا فاستخدم جدول Microsoft أدناه.

| بيئة Teams | إعداد OpenClaw                                             | `serviceUrl` الاستباقي                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| العامة            | لا حاجة إلى إعداد cloud/serviceUrl                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | اضبط `serviceUrl`؛ لا يوجد إعداد مسبق منفصل لسحابة Teams SDK | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | استخدم `serviceUrl` الخاص بالنشاط الوارد           |

مثال على GCC، حيث توثّق Microsoft عنوان URL منفصلًا للخدمة الاستباقية، لكن Teams SDK لا يوفّر إعدادًا مسبقًا منفصلًا لسحابة GCC:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

مثال على GCC High:

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

يقتصر `channels.msteams.serviceUrl` على مضيفات Microsoft Teams Bot Connector المدعومة. عند تكوين عنوان URL للخدمة، يتحقق OpenClaw من أن `serviceUrl` للمحادثة المخزنة يستخدم المضيف نفسه قبل تنفيذ عمليات الإرسال والتعديل والحذف والبطاقات والاستطلاعات أو الردود طويلة التشغيل الموضوعة في قائمة الانتظار. باستخدام إعداد السحابة العامة الافتراضي، يتوقف OpenClaw بشكل آمن إذا كانت محادثة مخزنة تشير إلى خارج مضيف Teams Connector العام. استقبل رسالة جديدة من المحادثة بعد تغيير إعدادات السحابة/عنوان URL للخدمة ليكون مرجع المحادثة المخزن محدّثًا.

لا يتوفر لـ China/21Vianet عنوان URL عالمي استباقي منفصل لـ `smba` في جدول نقاط النهاية الاستباقية لـ Teams من Microsoft. كوّن `cloud: "China"` كي يستخدم Teams SDK نقاط نهاية المصادقة والرموز وJWT الخاصة بـ Azure China. تتطلب عمليات الإرسال الاستباقية بعد ذلك مرجع محادثة مخزنًا من نشاط China Teams وارد، أو عنوان URL مكوّنًا صراحةً للخدمة، ضمن حد قناة Azure China Bot Framework ‏(`*.botframework.azure.cn`). تُعطّل أدوات Teams المساعدة المدعومة بواسطة Graph عند استخدام `cloud: "China"` إلى أن يوجّه OpenClaw طلبات Graph عبر نقطة نهاية Azure China Graph.

### التنسيق

إمكانات Markdown في Teams محدودة أكثر من Slack أو Discord:

- يعمل التنسيق الأساسي: **العريض**، _المائل_، `code`، والروابط.
- قد لا يُعرض Markdown المعقد (الجداول والقوائم المتداخلة) بصورة صحيحة.
- تُدعم Adaptive Cards للاستطلاعات وعمليات إرسال العروض الدلالية (انظر أدناه).

## الإعداد

الإعدادات الرئيسية (راجع [/gateway/configuration](/ar/gateway/configuration) للاطلاع على الأنماط المشتركة للقنوات):

- `channels.msteams.enabled`: تمكين/تعطيل القناة.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: بيانات اعتماد الروبوت.
- `channels.msteams.cloud`: بيئة Teams SDK السحابية (`Public`، أو `USGov`، أو `USGovDoD`، أو `China`؛ الافتراضي `Public`). اضبطها باستخدام `serviceUrl` لسُحب USGov/DoD الخاصة بـ SDK؛ تستخدم الصين الإعداد المسبق لـ SDK ومراجع محادثات Azure China Bot Framework المخزنة، مع تعطيل الأدوات المساعدة المدعومة من Graph حتى يتوفر توجيه Azure China Graph.
- `channels.msteams.serviceUrl`: حد عنوان URL لخدمة Bot Connector للعمليات الاستباقية في SDK. تستخدم السحابة العامة الإعداد الافتراضي لـ SDK؛ اضبطه لـ GCC ‏(`https://smba.infra.gcc.teams.microsoft.com/teams`) أو GCC High أو DoD. تقبل الصين مضيفي قنوات Azure China Bot Framework عندما يأتي مرجع المحادثة المخزن من Teams الذي تديره 21Vianet.
- `channels.msteams.webhook.port` (الافتراضي `3978`).
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي `pairing`).
- `channels.msteams.allowFrom`: قائمة السماح للرسائل المباشرة (يُوصى بمعرّفات كائنات AAD). يحوّل المعالج الأسماء إلى معرّفات أثناء الإعداد عندما يتوفر الوصول إلى Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح تبديل للطوارئ لإعادة تمكين مطابقة UPN/اسم العرض القابلة للتغيير والتوجيه المباشر بأسماء الفرق/القنوات.
- `channels.msteams.textChunkLimit`: حجم تجزئة النص الصادر بالأحرف (الافتراضي `4000`، مع حد أقصى صارم يبلغ `4000` بصرف النظر عن أي قيمة مُعدّة أعلى).
- `channels.msteams.streaming.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التجزئة حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة السماح لمضيفي المرفقات الواردة (الإعداد الافتراضي هو نطاقات Microsoft/Teams: ‏Graph وSharePoint/OneDrive وTeams CDN وBot Framework وAzure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: قائمة السماح بإرفاق ترويسات Authorization عند إعادة محاولة جلب الوسائط (الإعداد الافتراضي هو مضيفو Graph وBot Framework).
- `channels.msteams.graphMediaFallback`: الاشتراك في عمليات بحث Graph عن الرسائل عندما لا يتضمن HTML الخاص بالقناة/المجموعة علامات الملفات (الافتراضي `false`؛ راجع [استرداد ملفات القناة/المجموعة](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: تجاوز حد حجم الوسائط لكل قناة بالميغابايت. يعود إلى `agents.defaults.mediaMaxMb` عند عدم ضبطه.
- `channels.msteams.requireMention`: اشتراط الإشارة بـ @ في القنوات/المجموعات (الافتراضي `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (راجع [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) المستخدمة عند غياب تجاوز للقناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مُرسِل (حرف البدل `"*"` مدعوم).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مُرسِل (حرف البدل `"*"` مدعوم).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة: `channel:`، و`id:`، و`e164:`، و`username:`، و`name:` (لا تزال المفاتيح القديمة غير المسبوقة ببادئة تُعيَّن إلى `id:` فقط).
- `channels.msteams.authType`: نوع المصادقة - `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (المصادقة الموحدة + المصادقة بالشهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة؛ مقبولة، لكنها غير مطلوبة للمصادقة.
- `channels.msteams.useManagedIdentity`: تمكين المصادقة بالهوية المُدارة (الوضع الموحد).
- `channels.msteams.managedIdentityClientId`: معرّف العميل للهوية المُدارة المعيّنة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرّف موقع SharePoint لرفع الملفات في المحادثات الجماعية/القنوات (راجع [إرسال الملفات في المحادثات الجماعية](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`، `channels.msteams.groupWelcomeCard`، `channels.msteams.promptStarters`: بطاقة Adaptive Card ترحيبية تظهر عند أول تواصل عبر رسالة مباشرة/مجموعة، وأزرار المطالبات المقترحة فيها.
- `channels.msteams.responsePrefix`: نص يُضاف في بداية الردود الصادرة.
- `channels.msteams.feedbackEnabled` (الافتراضي `true`)، و`channels.msteams.feedbackReflection` (الافتراضي `true`)، و`channels.msteams.feedbackReflectionCooldownMs`: ملاحظات الإعجاب/عدم الإعجاب على الردود ومتابعة التأمل بشأن الملاحظات السلبية.
- `channels.msteams.sso`، `channels.msteams.delegatedAuth`: اتصال OAuth الخاص بـ Bot Framework ونطاقات Graph المفوضة للتدفقات المدعومة بتسجيل الدخول الأحادي؛ يتطلب `sso.enabled: true` وجود `sso.connectionName`.

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (راجع [/concepts/session](/ar/concepts/session)):
  - تتشارك الرسائل المباشرة الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: السلاسل مقابل المنشورات

لدى Teams نمطان لواجهة مستخدم القنوات يعتمدان على نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                               | `replyStyle` الموصى به |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **المنشورات** (التقليدي)      | تظهر الرسائل كبطاقات وتحتها ردود متسلسلة | `thread` (الافتراضي)       |
| **السلاسل** (شبيه بـ Slack) | تتدفق الرسائل خطيًا، على نحو أقرب إلى Slack                   | `top-level`              |

**المشكلة:** لا تكشف واجهة Teams API عن نمط واجهة المستخدم الذي تستخدمه القناة. إذا استخدمت `replyStyle` الخطأ:

- `thread` في قناة بنمط السلاسل ← تظهر الردود متداخلة بصورة غير ملائمة.
- `top-level` في قناة بنمط المنشورات ← تظهر الردود كمنشورات مستقلة من المستوى الأعلى بدلًا من ظهورها داخل السلسلة.

**الحل:** اضبط `replyStyle` لكل قناة وفقًا لكيفية إعداد القناة:

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

### أسبقية تحديد القيمة

عندما يرسل الروبوت ردًا إلى قناة، تُحدَّد قيمة `replyStyle` بدءًا من التجاوز الأكثر تحديدًا وصولًا إلى القيمة الافتراضية. تفوز أول قيمة غير `undefined`:

1. **لكل قناة** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **لكل فريق** - `channels.msteams.teams.<teamId>.replyStyle`
3. **عام** - `channels.msteams.replyStyle`
4. **القيمة الافتراضية الضمنية** - مشتقة من `requireMention`:
   - `requireMention: true` ← `thread`
   - `requireMention: false` ← `top-level`

إذا ضبطت `requireMention: false` عموميًا من دون `replyStyle` صريح، فستظهر الإشارات في القنوات ذات نمط المنشورات كمنشورات من المستوى الأعلى، حتى عندما كان الوارد ردًا داخل سلسلة. ثبّت `replyStyle: "thread"` على المستوى العام أو مستوى الفريق أو القناة لتجنب المفاجآت.

بالنسبة إلى عمليات الإرسال الاستباقية إلى محادثة قناة مخزنة (ردود استدعاءات الأدوات الموضوعة في قائمة الانتظار والوكلاء طويلي التشغيل)، يُطبَّق تحديد الفريق/القناة نفسه؛ أما المحادثات الجماعية والمحادثات الشخصية (الرسائل المباشرة)، فتُحدَّد دائمًا على `top-level` لعمليات الإرسال الاستباقية بصرف النظر عن `replyStyle`.

### الحفاظ على سياق السلسلة

عندما تكون `replyStyle: "thread"` سارية وتتم الإشارة إلى الروبوت بـ @ من داخل سلسلة قناة، يعيد OpenClaw إرفاق جذر السلسلة الأصلي بمرجع المحادثة الصادر (`19:...@thread.tacv2;messageid=<root>`) كي يصل الرد إلى السلسلة نفسها. ينطبق ذلك على كل من عمليات الإرسال المباشرة (ضمن الدور) وعمليات الإرسال الاستباقية التي تُنفَّذ بعد انتهاء صلاحية سياق دور Bot Framework (مثل الوكلاء طويلي التشغيل وردود استدعاءات الأدوات الموضوعة في قائمة الانتظار عبر `mcp__openclaw__message`).

يُؤخذ جذر السلسلة من `threadId` المخزن في مرجع المحادثة. أما المراجع المخزنة الأقدم التي تسبق `threadId`، فتعود إلى `activityId` (أي نشاط وارد استخدم آخر مرة لتهيئة المحادثة)، وبذلك تظل عمليات النشر الحالية عاملة من دون إعادة تهيئة.

عندما تكون `replyStyle: "top-level"` سارية، يُرد عمدًا على الرسائل الواردة ضمن سلاسل القنوات بمنشورات جديدة من المستوى الأعلى؛ ولا تُرفق أي لاحقة للسلسلة. هذا هو السلوك الصحيح للقنوات ذات نمط السلاسل؛ وإذا ظهرت منشورات من المستوى الأعلى حيث توقعت ردودًا متسلسلة، فهذا يعني أن `replyStyle` مضبوطة بصورة غير صحيحة لتلك القناة.

## المرفقات والصور

**القيود الحالية:**

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر واجهات ملفات روبوت Teams.
- **القنوات/المجموعات:** توجد المرفقات في تخزين M365 ‏(SharePoint/OneDrive). لا تتضمن حمولة Webhook سوى عنصر HTML نائب، لا بايتات الملف الفعلية. **تلزم أذونات Graph API** لتنزيل مرفقات القنوات.
- لعمليات الإرسال الصريحة التي يبدأ فيها الملف أولًا، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ تصبح `message` الاختيارية النص/التعليق المصاحب، وتتجاوز `filename` (أو `title`) الاسم المرفوع.

من دون أذونات Graph، تصل رسائل القنوات التي تحتوي على صور كنص فقط (لا يمكن للروبوت الوصول إلى محتوى الصورة).
افتراضيًا، لا ينزّل OpenClaw الوسائط إلا من أسماء مضيفي Microsoft/Teams. يمكنك تجاوز ذلك باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
لا تُرفق ترويسات Authorization إلا للمضيفين الموجودين في `channels.msteams.mediaAuthAllowHosts` (الإعداد الافتراضي هو مضيفو Graph وBot Framework). أبقِ هذه القائمة صارمة (وتجنب لواحق تعدد المستأجرين).

## إرسال الملفات في المحادثات الجماعية

يمكن للروبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard المضمّن. يتطلب **إرسال الملفات في المحادثات الجماعية/القنوات** إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                           | الإعداد المطلوب                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة**                  | FileConsentCard ← يقبل المستخدم ← يرفع الروبوت الملف | يعمل مباشرة دون إعداد إضافي                            |
| **المحادثات الجماعية/القنوات** | الرفع إلى SharePoint ← بطاقة ملف أصلية      | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | مضمنة بترميز Base64                        | تعمل مباشرة دون إعداد إضافي                            |

### لماذا تحتاج المحادثات الجماعية إلى SharePoint

تستخدم الروبوتات هوية تطبيق، في حين أن مورد `/me` في Microsoft Graph [يتطلب مستخدمًا مسجّل الدخول](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). لإرسال الملفات في المحادثات الجماعية/القنوات، يرفع الروبوت الملف إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID (Azure AD) ← App Registration:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint.
   - `ChatMember.Read.All` (Application) - الإذن الأقل امتيازًا على مستوى المستأجر لإرسال الملفات في المحادثات الجماعية. يعمل `Chat.Read.All` أيضًا، ويغطي ذلك بالفعل عند تمكين سجل المحادثات الجماعية. كبديل لكل محادثة، استخدم [إذن الموافقة الخاص بالمورد](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **امنح موافقة المسؤول** للمستأجر.
3. **احصل على معرّف موقع SharePoint:**

   ```bash
   # عبر Graph Explorer أو curl باستخدام رمز مميز صالح:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # مثال: لموقع على "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # تتضمن الاستجابة: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **إعداد OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... إعدادات أخرى ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### سلوك المشاركة

| السياق والإذن                                                  | سلوك المشاركة                                          |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| القناة + `Sites.ReadWrite.All`                                         | رابط مشاركة على مستوى المؤسسة (يمكن لأي شخص في المؤسسة الوصول إليه) |
| الدردشة الجماعية + `Sites.ReadWrite.All` + إذن قراءة مدعوم لأعضاء الدردشة | رابط مشاركة لكل مستخدم (يمكن لأعضاء الدردشة فقط الوصول إليه)      |
| دردشة جماعية من دون إذن قراءة مدعوم لأعضاء الدردشة                   | يفشل الإرسال بشكل مغلق                                         |

تُعد المشاركة لكل مستخدم أكثر أمانًا، إذ لا يمكن الوصول إلى الملف إلا للمشاركين في الدردشة. يتطلب OpenClaw نجاح البحث عن الأعضاء في الدردشات الجماعية؛ وتؤدي حالات انتهاء المهلة وفشل النقل والنتائج الفارغة ورفض Graph API إلى فشل الإرسال بدلًا من توسيع نطاق الوصول ليشمل المؤسسة.

### السلوك الاحتياطي

| السيناريو                                                         | النتيجة                                           |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| دردشة جماعية + ملف + إعداد أذونات SharePoint والأعضاء | الرفع إلى SharePoint وإرسال بطاقة ملف أصلية    |
| دردشة جماعية + ملف + فقدان أذونات SharePoint أو الأعضاء     | الفشل مع خطأ إعداد قابل لاتخاذ إجراء بشأنه      |
| قناة + ملف + إعداد `sharePointSiteId`                   | الرفع إلى SharePoint وإرسال بطاقة ملف أصلية    |
| دردشة شخصية + ملف                                             | تدفق FileConsentCard (يعمل من دون SharePoint)  |
| أي سياق + صورة                                              | تضمين بترميز Base64 (يعمل من دون SharePoint) |

### موقع تخزين الملفات

تُخزّن الملفات المرفوعة في مجلد `/OpenClawShared/` ضمن مكتبة المستندات الافتراضية لموقع SharePoint المُعدّ.

## استطلاعات الرأي (البطاقات التكيفية)

يرسل OpenClaw استطلاعات رأي Teams في صورة بطاقات تكيفية (لا توجد واجهة API أصلية لاستطلاعات الرأي في Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- يسجّل Gateway الأصوات في SQLite لحالة Plugin في OpenClaw ضمن `state/openclaw.sqlite`.
- تُستورد ملفات `msteams-polls.json` الموجودة بواسطة `openclaw doctor --fix`، وليس بواسطة Plugin قيد التشغيل.
- يجب أن يظل Gateway متصلًا لتسجيل الأصوات.
- لا تنشر استطلاعات الرأي ملخصات النتائج تلقائيًا، ولا توجد حتى الآن CLI لنتائج الاستطلاعات.

## بطاقات العرض

أرسل حمولات عرض دلالية إلى مستخدمي Teams أو محادثاته باستخدام أداة `message` أو CLI أو التسليم العادي للردود. يعرضها OpenClaw كبطاقات تكيفية في Teams انطلاقًا من عقد العرض العام.

تقبل المعلمة `presentation` كتلًا دلالية. عند توفير `presentation`، يكون نص الرسالة اختياريًا. تُعرض الأزرار كإجراءات إرسال أو إجراءات URL في البطاقة التكيفية. قوائم التحديد ليست أصلية في عارض Teams، لذلك يحوّلها OpenClaw إلى نص مقروء قبل التسليم.

**أداة الوكيل:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "مرحبًا",
    blocks: [{ type: "text", text: "مرحبًا!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"مرحبًا","blocks":[{"type":"text","text":"مرحبًا!"}]}'
```

للاطلاع على تفاصيل تنسيقات الوجهة، راجع [تنسيقات الوجهة](#target-formats) أدناه.

## تنسيقات الوجهة

تستخدم وجهات MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الوجهة         | التنسيق                           | المثال                                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| مستخدم (حسب المعرّف)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| مستخدم (حسب الاسم)      | `user:<display-name>`            | `user:John Smith` (يتطلب Graph API)                                                                 |
| مجموعة/قناة       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| مجموعة/قناة (خام) | `<conversation-id>`              | `19:abc123...@thread.tacv2` أو `19:...@unq.gbl.spaces` أو معرّف Bot Framework مجرد من النوع `a:`/`8:orgid:`/`29:` |

**أمثلة CLI:**

```bash
# الإرسال إلى مستخدم حسب المعرّف
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "مرحبًا"

# الإرسال إلى مستخدم حسب اسم العرض (يؤدي إلى البحث عبر Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "مرحبًا"

# الإرسال إلى دردشة جماعية أو قناة
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "مرحبًا"

# إرسال بطاقة عرض إلى محادثة
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"مرحبًا","blocks":[{"type":"text","text":"مرحبًا"}]}'
```

**أمثلة أداة الوكيل:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "مرحبًا!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "مرحبًا",
    blocks: [{ type: "text", text: "مرحبًا" }],
  },
}
```

<Note>
من دون البادئة `user:`، تُحل الأسماء افتراضيًا كمجموعة أو فريق. استخدم دائمًا `user:` عند استهداف الأشخاص حسب اسم العرض.
</Note>

## المراسلة الاستباقية

- لا يمكن إرسال الرسائل الاستباقية إلا **بعد** تفاعل المستخدم، لأن OpenClaw يخزّن مراجع المحادثة عندئذٍ.
- راجع [/gateway/configuration](/ar/gateway/configuration) لمعرفة `dmPolicy` وآلية التقييد بقائمة السماح.

## معرّفات الفريق والقناة (خطأ شائع)

معلمة الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليست** معرّف الفريق المستخدم في الإعداد. استخرج المعرّفات من مسار عنوان URL بدلًا من ذلك:

**عنوان URL للفريق:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    معرّف محادثة الفريق (فك ترميز URL لهذا المعرّف)
```

**عنوان URL للقناة:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      معرّف القناة (فك ترميز URL لهذا المعرّف)
```

**للإعداد:**

- مفتاح الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`؛ وقد تعرض المستأجرات الأقدم `@thread.skype`، وهو صالح أيضًا).
- مفتاح القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL).
- **تجاهل** معلمة الاستعلام `groupId` في توجيه OpenClaw. فهي معرّف مجموعة Microsoft Entra، وليست معرّف محادثة Bot Framework المستخدم في أنشطة Teams الواردة.

## القنوات الخاصة

دعم البوتات في القنوات الخاصة محدود:

| الميزة                      | القنوات القياسية | القنوات الخاصة       |
| ---------------------------- | ----------------- | ---------------------- |
| تثبيت البوت             | نعم               | محدود                |
| الرسائل الفورية (Webhook) | نعم               | قد لا تعمل           |
| أذونات RSC              | نعم               | قد تتصرف على نحو مختلف |
| الإشارات باستخدام @                    | نعم               | إذا كان البوت متاحًا   |
| سجل Graph API            | نعم               | نعم (مع الأذونات) |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية للتفاعل مع البوت.
2. استخدم الرسائل المباشرة؛ يمكن للمستخدمين دائمًا مراسلة البوت مباشرةً.
3. استخدم Graph API للوصول إلى السجل (يتطلب `ChannelMessage.Read.All`).

## استكشاف الأخطاء وإصلاحها

### المشكلات الشائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams، ثم أغلق Teams بالكامل وأعد فتحه.
- **لا توجد استجابات في القناة:** الإشارات مطلوبة افتراضيًا؛ عيّن `channels.msteams.requireMention=false` أو أجرِ الإعداد لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض البيان القديم):** أزل التطبيق ثم أضفه مجددًا، وأغلق Teams بالكامل لتحديثه.
- **استجابة 401 Unauthorized من Webhook:** هذا متوقع عند الاختبار يدويًا من دون Azure JWT؛ ويعني أن نقطة النهاية متاحة لكن المصادقة فشلت. استخدم Azure Web Chat لإجراء الاختبار بصورة صحيحة.

### أخطاء رفع البيان

- **"Icon file cannot be empty":** يشير البيان إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (32x32 لـ `outline.png`، و192x192 لـ `color.png`).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتًا في فريق/دردشة أخرى. ابحث عنه وألغِ تثبيته أولًا، أو انتظر 5-10 دقائق حتى ينتشر التغيير.
- **ظهور "Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح أدوات المطور في المتصفح (F12) ← علامة التبويب Network، ثم افحص نص الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app"؛ فهذا يتجاوز غالبًا قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقق من تطابق `webApplicationInfo.id` تمامًا مع App ID الخاص بالبوت.
2. أعد رفع التطبيق وثبّته مجددًا في الفريق/الدردشة.
3. تحقق مما إذا كان مسؤول المؤسسة قد حظر أذونات RSC.
4. تأكد من استخدام النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` للدردشات الجماعية.

## المراجع

- [إنشاء Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [بوابة مطوري Teams](https://dev.teams.microsoft.com/apps) - إنشاء تطبيقات Teams وإدارتها
- [مخطط بيان تطبيق Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [تلقي رسائل القناة باستخدام RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع أذونات RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [معالجة ملفات بوت Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (تتطلب القناة/المجموعة Graph)
- [المراسلة الاستباقية](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI لـ Teams لإدارة البوتات

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
