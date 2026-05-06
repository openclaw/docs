---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم روبوت Microsoft Teams وإمكاناته وتكوينه
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T17:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: be669545bd692754fbee8b670b1b482c39399a3d26e06a7ae01230fdaee645fe
    source_path: channels/msteams.md
    workflow: 16
---

الحالة: النص ومرفقات الرسائل المباشرة مدعومة؛ يتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` وأذونات Graph (راجع [إرسال الملفات في محادثات المجموعات](#sending-files-in-group-chats)). تُرسل الاستطلاعات عبر Adaptive Cards. تعرض إجراءات الرسائل `upload-file` صريحًا للإرسالات التي تبدأ بالملف.

## Plugin مضمن

يأتي Microsoft Teams على هيئة Plugin مضمن في إصدارات OpenClaw الحالية، لذا لا يلزم
تثبيت منفصل في البناء المعبأ العادي.

إذا كنت تستخدم بناءً أقدم أو تثبيتًا مخصصًا يستبعد Teams المضمن،
فثبّت حزمة npm مباشرة:

```bash
openclaw plugins install @openclaw/msteams
```

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا دقيقًا
فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

السحب المحلي (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع

يتولى [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) تسجيل البوت، وإنشاء البيان، وتوليد بيانات الاعتماد في أمر واحد.

**1. ثبّت وسجّل الدخول**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
إن Teams CLI حاليًا في المعاينة. قد تتغير الأوامر والوسوم بين الإصدارات.
</Note>

**2. ابدأ نفقًا** (لا يستطيع Teams الوصول إلى localhost)

ثبّت وصادق devtunnel CLI إذا لم تفعل ذلك مسبقًا ([دليل البدء](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
يلزم `--allow-anonymous` لأن Teams لا يستطيع المصادقة مع devtunnels. لا يزال كل طلب بوت وارد يُتحقق منه تلقائيًا بواسطة Teams SDK.
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
- يسجل البوت (مُدار من Teams افتراضيًا - لا يلزم اشتراك Azure)

سيعرض الناتج `CLIENT_ID` و`CLIENT_SECRET` و`TENANT_ID` و**معرّف تطبيق Teams** - دوّنها للخطوات التالية. كما يعرض تثبيت التطبيق في Teams مباشرة.

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

أو استخدم متغيرات البيئة مباشرة: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. ثبّت التطبيق في Teams**

سيطلب منك `teams app create` تثبيت التطبيق - اختر "Install in Teams". إذا تخطيت ذلك، يمكنك الحصول على الرابط لاحقًا:

```bash
teams app get <teamsAppId> --install-link
```

**6. تحقق من أن كل شيء يعمل**

```bash
teams app doctor <teamsAppId>
```

يشغّل هذا تشخيصات عبر تسجيل البوت، وضبط تطبيق AAD، وصحة البيان، وإعداد SSO.

لعمليات نشر الإنتاج، فكر في استخدام [المصادقة الموحدة](/ar/channels/msteams#federated-authentication-certificate-plus-managed-identity) (شهادة أو هوية مدارة) بدلًا من أسرار العملاء.

<Note>
محادثات المجموعات محظورة افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بردود المجموعات، عيّن `channels.msteams.groupAllowFrom`، أو استخدم `groupPolicy: "open"` للسماح لأي عضو (مشروط بالذكر).
</Note>

## الأهداف

- التحدث إلى OpenClaw عبر رسائل Teams المباشرة، أو محادثات المجموعات، أو القنوات.
- إبقاء التوجيه حتميًا: تعود الردود دائمًا إلى القناة التي وردت منها.
- اعتماد سلوك قنوات آمن افتراضيًا (تكون الإشارات مطلوبة ما لم يُضبط خلاف ذلك).

## كتابات الضبط

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات الضبط التي تُشغّلها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك عبر:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**الوصول إلى الرسائل المباشرة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يتم تجاهل المرسلين غير المعروفين إلى أن تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائن AAD مستقرة.
- لا تعتمد على مطابقة UPN/اسم العرض لقوائم السماح - فقد تتغير. يعطل OpenClaw مطابقة الأسماء المباشرة افتراضيًا؛ فعّلها صراحة باستخدام `channels.msteams.dangerouslyAllowNameMatching: true`.
- يستطيع المعالج حل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد.

**الوصول إلى المجموعات**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عندما لا يكون معينًا.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين الذين يمكنهم التشغيل في محادثات/قنوات المجموعات (يرجع إلى `channels.msteams.allowFrom`).
- عيّن `groupPolicy: "open"` للسماح لأي عضو (لا يزال مشروطًا بالذكر افتراضيًا).
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

**Teams + قائمة السماح للقنوات**

- حدّد نطاق ردود المجموعات/القنوات بإدراج الفرق والقنوات ضمن `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات محادثات Teams المستقرة من روابط Teams، وليس أسماء العرض القابلة للتغيير.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، تُقبل الفرق/القنوات المدرجة فقط (مشروطة بالذكر).
- يقبل معالج الضبط إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يحل OpenClaw أسماء قوائم السماح للفريق/القناة والمستخدم إلى معرّفات (عندما تسمح أذونات Graph)
  ويسجل الربط؛ تُبقى أسماء الفريق/القناة غير المحلولة كما كُتبت لكنها تُتجاهل للتوجيه افتراضيًا ما لم يكن `channels.msteams.dangerouslyAllowNameMatching: true` مفعّلًا.

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

إذا تعذر عليك استخدام Teams CLI، يمكنك إعداد البوت يدويًا عبر Azure Portal.

### كيفية عمله

1. تأكد من توفر Microsoft Teams plugin (مضمن في الإصدارات الحالية).
2. أنشئ **Azure Bot** (معرّف التطبيق + السر + معرّف المستأجر).
3. ابنِ **حزمة تطبيق Teams** تشير إلى البوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams في فريق (أو نطاق شخصي للرسائل المباشرة).
5. اضبط `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway إلى حركة Webhook الخاصة بـ Bot Framework على `/api/messages` افتراضيًا.

### الخطوة 1: أنشئ Azure Bot

1. انتقل إلى [إنشاء Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ تبويب **الأساسيات**:

   | الحقل              | القيمة                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **مقبض البوت**     | اسم البوت الخاص بك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **الاشتراك**       | اختر اشتراك Azure الخاص بك                               |
   | **مجموعة الموارد** | أنشئ واحدة جديدة أو استخدم موجودة                        |
   | **فئة التسعير**    | **مجاني** للتطوير/الاختبار                               |
   | **نوع التطبيق**    | **مستأجر واحد** (موصى به - راجع الملاحظة أدناه)         |
   | **نوع الإنشاء**    | **إنشاء Microsoft App ID جديد**                          |

<Warning>
أُلغي إنشاء بوتات جديدة متعددة المستأجرين بعد 2025-07-31. استخدم **مستأجر واحد** للبوتات الجديدة.
</Warning>

3. انقر **Review + create** → **Create** (انتظر نحو 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot الخاص بك → **Configuration**
2. انسخ **Microsoft App ID** → هذا هو `appId` الخاص بك
3. انقر **Manage Password** → انتقل إلى App Registration
4. ضمن **Certificates & secrets** → **New client secret** → انسخ **Value** → هذا هو `appPassword` الخاص بك
5. انتقل إلى **Overview** → انسخ **Directory (tenant) ID** → هذا هو `tenantId` الخاص بك

### الخطوة 3: ضبط نقطة نهاية المراسلة

1. في Azure Bot → **Configuration**
2. عيّن **Messaging endpoint** إلى عنوان URL الخاص بـ Webhook:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تمكين قناة Teams

1. في Azure Bot → **Channels**
2. انقر **Microsoft Teams** → Configure → Save
3. اقبل شروط الخدمة

### الخطوة 5: بناء بيان تطبيق Teams

- ضمّن إدخال `bot` مع `botId = <App ID>`.
- النطاقات: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (مطلوب لمعالجة الملفات في النطاق الشخصي).
- أضف أذونات RSC (راجع [أذونات RSC](#current-teams-rsc-permissions-manifest)).
- أنشئ الأيقونات: `outline.png` (32x32) و`color.png` (192x192).
- اضغط الملفات الثلاثة معًا: `manifest.json`, `outline.png`, `color.png`.

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

متغيرات البيئة: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### الخطوة 7: تشغيل Gateway

تبدأ قناة Teams تلقائيًا عندما يكون plugin متوفرًا ويوجد ضبط `msteams` مع بيانات الاعتماد.

</details>

## المصادقة الموحدة (شهادة بالإضافة إلى هوية مدارة)

> أُضيفت في 2026.4.11

لعمليات نشر الإنتاج، يدعم OpenClaw **المصادقة الموحدة** كبديل أكثر أمانًا لأسرار العملاء. تتوفر طريقتان:

### الخيار أ: المصادقة القائمة على الشهادات

استخدم شهادة PEM مسجلة مع تسجيل تطبيق Entra ID الخاص بك.

**الإعداد:**

1. ولّد أو احصل على شهادة (تنسيق PEM مع مفتاح خاص).
2. في Entra ID → App Registration → **Certificates & secrets** → **Certificates** → ارفع الشهادة العامة.

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

استخدم Azure Managed Identity للمصادقة بلا كلمات مرور. هذا مثالي لعمليات النشر على بنية Azure التحتية (AKS، App Service، أجهزة Azure VM) حيث تتوفر هوية مدارة.

**كيفية عمله:**

1. لدى حاوية/جهاز VM الخاصة بالبوت هوية مدارة (معينة من النظام أو معينة من المستخدم).
2. يربط **اعتماد هوية موحدة** الهوية المدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على الرموز من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يُمرر الرمز إلى Teams SDK لمصادقة البوت.

**المتطلبات المسبقة:**

- بنية Azure تحتية مع تمكين الهوية المدارة (هوية حمل عمل AKS، App Service، VM)
- اعتماد هوية موحدة منشأ على تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من الحاوية/VM

**الضبط (هوية مدارة معينة من النظام):**

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

**الإعداد (هوية مُدارة معيّنة من المستخدم):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط للهوية المعيّنة من المستخدم)

### إعداد هوية حمل العمل في AKS

لعمليات نشر AKS التي تستخدم هوية حمل العمل:

1. **فعّل هوية حمل العمل** على عنقود AKS لديك.
2. **أنشئ بيانات اعتماد هوية موحّدة** على تسجيل تطبيق Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **أضف تعليقات توضيحية إلى حساب خدمة Kubernetes** بمعرّف عميل التطبيق:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **أضف تسمية إلى الـ pod** لحقن هوية حمل العمل:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكّد من إتاحة الوصول الشبكي** إلى IMDS (`169.254.169.254`) - إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج تسمح بمرور البيانات إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة               | الإعداد                                         | المزايا                               | العيوب                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **سر العميل**    | `appPassword`                                  | إعداد بسيط                       | يتطلب تدوير السر، وأقل أمانًا |
| **الشهادة**      | `authType: "federated"` + `certificatePath`    | لا يوجد سر مشترك عبر الشبكة      | عبء إدارة الشهادات       |
| **الهوية المُدارة** | `authType: "federated"` + `useManagedIdentity` | بلا كلمة مرور، ولا توجد أسرار لإدارتها | تتطلب بنية Azure التحتية         |

**السلوك الافتراضي:** عندما لا يتم تعيين `authType`، يستخدم OpenClaw افتراضيًا مصادقة سر العميل. تستمر الإعدادات الحالية في العمل دون تغييرات.

## التطوير المحلي (النفق)

لا يمكن لـ Teams الوصول إلى `localhost`. استخدم نفق تطوير ثابتًا حتى يبقى عنوان URL كما هو عبر الجلسات:

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

يفحص تسجيل البوت، وتطبيق AAD، والبيان، وإعداد SSO في تمريرة واحدة.

**أرسل رسالة اختبار:**

1. ثبّت تطبيق Teams (استخدم رابط التثبيت من `teams app get <id> --install-link`)
2. ابحث عن البوت في Teams وأرسل رسالة مباشرة
3. تحقق من سجلات Gateway للنشاط الوارد

## متغيرات البيئة

يمكن تعيين جميع مفاتيح الإعداد عبر متغيرات البيئة بدلًا من ذلك:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (موحّد + شهادة)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
- `MSTEAMS_USE_MANAGED_IDENTITY` (موحّد + هوية مُدارة)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI معيّنة من المستخدم)

## إجراء معلومات العضو

يعرض OpenClaw إجراء `member-info` المدعوم من Graph لـ Microsoft Teams حتى تتمكن الوكلاء والأتمتات من حل تفاصيل أعضاء القناة (اسم العرض، البريد الإلكتروني، الدور) مباشرةً من Microsoft Graph.

المتطلبات:

- إذن RSC `Member.Read.Group` (موجود بالفعل في البيان الموصى به)
- لعمليات البحث عبر الفرق: إذن تطبيق Graph `User.Read.All` مع موافقة المسؤول

يخضع الإجراء للحارس `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القنوات/المجموعات الحديثة التي يتم تغليفها داخل الموجه.
- يعود احتياطيًا إلى `messages.groupChat.historyLimit`. عيّن `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل السلاسل الذي تم جلبه حسب قوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذلك لا يتضمن زرع سياق السلسلة إلا الرسائل من المرسلين المسموح لهم.
- يتم حاليًا تمرير سياق المرفقات المقتبسة (`ReplyTo*` المشتق من HTML رد Teams) كما تم استلامه.
- بعبارة أخرى، تحدد قوائم السماح من يمكنه تشغيل الوكيل؛ ولا تتم تصفية إلا مسارات سياق تكميلية محددة اليوم.
- يمكن تحديد سجل الرسائل المباشرة باستخدام `channels.msteams.dmHistoryLimit` (أدوار المستخدم). تجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات Teams RSC الحالية (البيان)

هذه هي **أذونات resourceSpecific الحالية** في بيان تطبيق Teams لدينا. تنطبق فقط داخل الفريق/الدردشة حيث يكون التطبيق مثبتًا.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` (Application) - استلام جميع رسائل القناة دون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**لدردشات المجموعات:**

- `ChatMessage.Read.Chat` (Application) - استلام جميع رسائل دردشة المجموعة دون @mention

لإضافة أذونات RSC عبر Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## مثال على بيان Teams (منقّح)

مثال صالح وحد أدنى يتضمن الحقول المطلوبة. استبدل المعرّفات وعناوين URL.

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

- يجب أن يطابق `bots[].botId` **معرّف تطبيق Azure Bot**.
- يجب أن يطابق `webApplicationInfo.id` **معرّف تطبيق Azure Bot**.
- يجب أن يتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` مطلوب لمعالجة الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` القراءة/الإرسال للقنوات إذا كنت تريد مرور بيانات القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبّت بالفعل (مثلًا لإضافة أذونات RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

بعد التحديث، أعد تثبيت التطبيق في كل فريق حتى تدخل الأذونات الجديدة حيز التنفيذ، و**أغلق Teams بالكامل ثم أعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

<details>
<summary>تحديث البيان يدويًا (بدون CLI)</summary>

1. حدّث `manifest.json` بالإعدادات الجديدة
2. **زد حقل `version`** (مثلًا، `1.0.0` → `1.1.0`)
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json`, `outline.png`, `color.png`)
4. ارفع ملف zip الجديد:
   - **مركز إدارة Teams:** تطبيقات Teams → إدارة التطبيقات → ابحث عن تطبيقك → رفع إصدار جديد
   - **التحميل الجانبي:** في Teams → التطبيقات → إدارة تطبيقاتك → رفع تطبيق مخصص

</details>

## الإمكانات: RSC فقط مقابل Graph

### مع **Teams RSC فقط** (التطبيق مثبّت، دون أذونات Graph API)

يعمل:

- قراءة محتوى **نص** رسائل القنوات.
- إرسال محتوى **نص** رسائل القنوات.
- استلام مرفقات الملفات في **الشخصي (DM)**.

لا يعمل:

- **محتويات الصور أو الملفات** في القنوات/المجموعات (تتضمن الحمولة قالب HTML فقط).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (بعد حدث Webhook المباشر).

### مع **Teams RSC + أذونات تطبيق Microsoft Graph**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة في الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القنوات/الدردشة عبر Graph.

### RSC مقابل Graph API

| الإمكانية              | أذونات RSC      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل الفورية**  | نعم (عبر Webhook)    | لا (استطلاع فقط)                   |
| **الرسائل التاريخية** | لا                   | نعم (يمكن الاستعلام عن السجل)             |
| **تعقيد الإعداد**    | بيان التطبيق فقط    | يتطلب موافقة المسؤول + تدفق الرمز المميز |
| **يعمل دون اتصال**       | لا (يجب أن يكون قيد التشغيل) | نعم (استعلم في أي وقت)                 |

**الخلاصة:** RSC مخصص للاستماع في الوقت الحقيقي؛ Graph API مخصص للوصول التاريخي. للحاق بالرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط والسجل المفعّلان عبر Graph (مطلوبان للقنوات)

إذا كنت تحتاج إلى الصور/الملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب تمكين أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **تسجيل التطبيق** في Entra ID (Azure AD)، أضف **أذونات تطبيق** Microsoft Graph:
   - `ChannelMessage.Read.All` (مرفقات القناة + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (دردشات المجموعات)
2. **امنح موافقة المسؤول** للمستأجر.
3. ارفع **إصدار بيان** تطبيق Teams، وأعد رفعه، و**أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams بالكامل ثم أعد تشغيله** لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

**إذن إضافي لإشارات المستخدمين:** تعمل @mentions للمستخدمين مباشرةً للمستخدمين الموجودين في المحادثة. ومع ذلك، إذا كنت تريد البحث ديناميكيًا عن مستخدمين **ليسوا في المحادثة الحالية** والإشارة إليهم، فأضف إذن `User.Read.All` (Application) وامنح موافقة المسؤول.

## القيود المعروفة

### مهل Webhook

يسلّم Teams الرسائل عبر Webhook HTTP. إذا استغرقت المعالجة وقتًا طويلًا جدًا (مثلًا، استجابات LLM البطيئة)، فقد ترى:

- مهل Gateway
- يعيد Teams محاولة إرسال الرسالة (مما يسبب تكرارات)
- ردودًا ساقطة

يتعامل OpenClaw مع ذلك من خلال العودة بسرعة وإرسال الردود استباقيًا، لكن الاستجابات البطيئة جدًا قد تظل تسبب مشكلات.

### التنسيق

Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق**، _مائل_، `code`، والروابط
- قد لا يُعرض Markdown المعقد (الجداول والقوائم المتداخلة) بشكل صحيح
- تُدعم Adaptive Cards للاستطلاعات وإرسالات العروض الدلالية (انظر أدناه)

## التكوين

الإعدادات الرئيسية (انظر `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تفعيل/تعطيل القناة.
- `channels.msteams.appId` و`channels.msteams.appPassword` و`channels.msteams.tenantId`: بيانات اعتماد البوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة السماح للرسائل المباشرة (يُوصى بمعرّفات كائنات AAD). يحل المعالج الأسماء إلى معرّفات أثناء الإعداد عندما يكون وصول Graph متاحًا.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تفعيل مطابقة UPN/اسم العرض القابلة للتغيير وتوجيه اسم الفريق/القناة مباشرة.
- `channels.msteams.textChunkLimit`: حجم مقطع النص الصادر.
- `channels.msteams.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة سماح لمضيفي المرفقات الواردة (تكون افتراضيًا نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة سماح لإرفاق ترويسات Authorization عند إعادة محاولة الوسائط (تكون افتراضيًا مضيفي Graph + Bot Framework).
- `channels.msteams.requireMention`: اشتراط @mention في القنوات/المجموعات (صحيح افتراضيًا).
- `channels.msteams.replyStyle`: `thread | top-level` (انظر [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) المستخدمة عند غياب تجاوز القناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مُرسل (يدعم حرف البدل `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مُرسل (يدعم حرف البدل `"*"`).
- ينبغي أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:` و`e164:` و`username:` و`name:` (لا تزال المفاتيح القديمة غير ذات البادئة تُطابق إلى `id:` فقط).
- `channels.msteams.actions.memberInfo`: تفعيل أو تعطيل إجراء معلومات العضو المدعوم من Graph (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).
- `channels.msteams.authType`: نوع المصادقة - `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (مصادقة موحدة + شهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختيارية، غير مطلوبة للمصادقة).
- `channels.msteams.useManagedIdentity`: تفعيل مصادقة الهوية المُدارة (وضع federated).
- `channels.msteams.managedIdentityClientId`: معرّف العميل للهوية المُدارة المعينة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرّف موقع SharePoint لرفع الملفات في محادثات المجموعات/القنوات (انظر [إرسال الملفات في محادثات المجموعات](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (انظر [/concepts/session](/ar/concepts/session)):
  - تشارك الرسائل المباشرة الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: السلاسل مقابل المنشورات

قدّم Teams مؤخرًا نمطين لواجهة القنوات فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                               | `replyStyle` الموصى به |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **المنشورات** (الكلاسيكي)      | تظهر الرسائل كبطاقات مع ردود متسلسلة أسفلها | `thread` (الافتراضي)       |
| **السلاسل** (شبيه بـ Slack) | تتدفق الرسائل خطيًا، أقرب إلى Slack                   | `top-level`              |

**المشكلة:** لا تكشف Teams API نمط الواجهة الذي تستخدمه القناة. إذا استخدمت `replyStyle` الخطأ:

- `thread` في قناة بنمط السلاسل → تظهر الردود متداخلة بشكل غير ملائم
- `top-level` في قناة بنمط المنشورات → تظهر الردود كمنشورات مستقلة على المستوى الأعلى بدلًا من ظهورها داخل السلسلة

**الحل:** كوّن `replyStyle` لكل قناة بناءً على كيفية إعداد القناة:

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
- **القنوات/المجموعات:** توجد المرفقات في تخزين M365 (SharePoint/OneDrive). لا تتضمن حمولة Webhook إلا قالب HTML، وليس بايتات الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- للإرسالات الصريحة التي تبدأ بالملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ يصبح `message` الاختياري النص/التعليق المرافق، ويتجاوز `filename` الاسم المرفوع.

بدون أذونات Graph، ستُستلم رسائل القنوات التي تحتوي على صور كنص فقط (لا يمكن للبوت الوصول إلى محتوى الصورة).
افتراضيًا، لا ينزّل OpenClaw الوسائط إلا من أسماء مضيفي Microsoft/Teams. تجاوز ذلك باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
لا تُرفق ترويسات Authorization إلا للمضيفين في `channels.msteams.mediaAuthAllowHosts` (تكون افتراضيًا مضيفي Graph + Bot Framework). أبقِ هذه القائمة صارمة (تجنب لواحق المستأجرين المتعددين).

## إرسال الملفات في محادثات المجموعات

يمكن للبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard (مدمج). ومع ذلك، يتطلب **إرسال الملفات في محادثات المجموعات/القنوات** إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                           | الإعداد المطلوب                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة**                  | FileConsentCard → يقبل المستخدم → يرفع البوت | يعمل مباشرة                            |
| **محادثات المجموعات/القنوات** | الرفع إلى SharePoint → مشاركة الرابط            | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | مضمنة بترميز Base64                        | تعمل مباشرة                            |

### لماذا تحتاج محادثات المجموعات إلى SharePoint

لا تملك البوتات محرك OneDrive شخصيًا (لا تعمل نقطة نهاية Graph API ‏`/me/drive` لهويات التطبيقات). لإرسال الملفات في محادثات المجموعات/القنوات، يرفع البوت إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` (Application) - اختياري، يتيح روابط مشاركة لكل مستخدم

2. **امنح موافقة المسؤول** للمستأجر.

3. **احصل على معرّف موقع SharePoint الخاص بك:**

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
| `Sites.ReadWrite.All` فقط              | رابط مشاركة على مستوى المؤسسة (يمكن لأي شخص في المؤسسة الوصول إليه) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | رابط مشاركة لكل مستخدم (يمكن لأعضاء المحادثة فقط الوصول إليه)      |

المشاركة لكل مستخدم أكثر أمانًا لأن المشاركين في المحادثة وحدهم يمكنهم الوصول إلى الملف. إذا كان إذن `Chat.Read.All` مفقودًا، يعود البوت إلى المشاركة على مستوى المؤسسة.

### سلوك الاحتياط

| السيناريو                                          | النتيجة                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| محادثة مجموعة + ملف + `sharePointSiteId` مكوّن | الرفع إلى SharePoint، وإرسال رابط مشاركة            |
| محادثة مجموعة + ملف + بدون `sharePointSiteId`         | محاولة الرفع إلى OneDrive (قد تفشل)، وإرسال النص فقط |
| دردشة شخصية + ملف                              | تدفق FileConsentCard (يعمل بدون SharePoint)    |
| أي سياق + صورة                               | مضمنة بترميز Base64 (تعمل بدون SharePoint)   |

### موقع تخزين الملفات

تُخزّن الملفات المرفوعة في مجلد `/OpenClawShared/` في مكتبة المستندات الافتراضية لموقع SharePoint المكوّن.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams كـ Adaptive Cards (لا توجد Teams poll API أصلية).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- يسجل Gateway الأصوات في `~/.openclaw/msteams-polls.json`.
- يجب أن يبقى Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا بعد (افحص ملف التخزين عند الحاجة).

## بطاقات العرض

أرسل حمولات العرض الدلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. يعرضها OpenClaw كـ Teams Adaptive Cards من عقد العرض العام.

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

لتفاصيل تنسيق الهدف، انظر [تنسيقات الأهداف](#target-formats) أدناه.

## تنسيقات الأهداف

تستخدم أهداف MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الهدف         | التنسيق                           | المثال                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| المستخدم (بالمعرّف)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| المستخدم (بالاسم)      | `user:<display-name>`            | `user:John Smith` (يتطلب Graph API)              |
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
من دون بادئة `user:`، تُحلّ الأسماء افتراضيًا على أنها مجموعة أو فريق. استخدم دائمًا `user:` عند استهداف الأشخاص باسم العرض.
</Note>

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** تفاعل المستخدم، لأننا نخزّن مراجع المحادثات عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة `dmPolicy` وبوابة قائمة السماح.

## معرّفات الفريق والقناة (خطأ شائع)

معامل الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليس** معرّف الفريق المستخدم للتكوين. استخرج المعرّفات من مسار URL بدلًا من ذلك:

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

- مفتاح الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`؛ قد تُظهر المستأجرات الأقدم `@thread.skype`، وهو صالح أيضًا)
- مفتاح القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معامل الاستعلام `groupId` لتوجيه OpenClaw. إنه معرّف مجموعة Microsoft Entra، وليس معرّف محادثة Bot Framework المستخدم في أنشطة Teams الواردة.

## القنوات الخاصة

لدى البوتات دعم محدود في القنوات الخاصة:

| الميزة                       | القنوات القياسية | القنوات الخاصة              |
| ---------------------------- | ----------------- | --------------------------- |
| تثبيت البوت                  | نعم               | محدود                       |
| الرسائل الفورية (Webhook)    | نعم               | قد لا تعمل                  |
| أذونات RSC                   | نعم               | قد تعمل بشكل مختلف          |
| @mentions                    | نعم               | إذا كان البوت قابلاً للوصول |
| سجل Graph API                | نعم               | نعم (مع الأذونات)           |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات البوت
2. استخدم الرسائل المباشرة - يمكن للمستخدمين دائماً مراسلة البوت مباشرة
3. استخدم Graph API للوصول التاريخي (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### المشكلات الشائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams تماماً ثم أعد فتحه.
- **لا توجد ردود في القناة:** تكون الإشارات مطلوبة افتراضياً؛ اضبط `channels.msteams.requireMention=false` أو كوّن ذلك لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض البيان القديم):** أزل التطبيق ثم أعد إضافته وأغلق Teams تماماً لتحديثه.
- **401 Unauthorized من Webhook:** متوقع عند الاختبار يدوياً من دون Azure JWT - يعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء تحميل البيان

- **"Icon file cannot be empty":** يشير البيان إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (32x32 لـ `outline.png`، و192x192 لـ `color.png`).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتاً في فريق/دردشة آخر. ابحث عنه وأزله أولاً، أو انتظر 5-10 دقائق حتى يكتمل الانتشار.
- **"Something went wrong" عند التحميل:** حمّل عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلاً من ذلك، وافتح أدوات مطوري المتصفح (F12) → تبويب الشبكة، وتحقق من جسم الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلاً من "Upload a custom app" - فهذا غالباً يتجاوز قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقق من أن `webApplicationInfo.id` يطابق App ID الخاص بالبوت تماماً
2. أعد تحميل التطبيق وثبّته مجدداً في الفريق/الدردشة
3. تحقق مما إذا كان مسؤول مؤسستك قد حظر أذونات RSC
4. تأكد من أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` لدردشات المجموعات

## المراجع

- [إنشاء Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [مخطط بيان تطبيق Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [تلقي رسائل القناة باستخدام RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع أذونات RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [معالجة ملفات بوت Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (تتطلب القناة/المجموعة Graph)
- [المراسلة الاستباقية](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI لإدارة البوت

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) - كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعة وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
