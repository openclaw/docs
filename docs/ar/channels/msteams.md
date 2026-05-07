---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم روبوت Microsoft Teams وإمكاناته وتكوينه
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-07T13:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fa2aff4d957a59f694cf37d9a4e5ad6b7ee18004d84cbaf8d7ac1aa16860090
    source_path: channels/msteams.md
    workflow: 16
---

الحالة: النص + مرفقات الرسائل الخاصة مدعومة؛ يتطلب إرسال ملفات القنوات/المجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في محادثات المجموعات](#sending-files-in-group-chats)). تُرسل الاستطلاعات عبر Adaptive Cards. تكشف إجراءات الرسائل عن `upload-file` صريح للإرسالات التي تبدأ بالملف.

## Plugin المضمّن

يُشحن Microsoft Teams كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا
يلزم تثبيت منفصل في البناء المعبأ المعتاد.

إذا كنت تستخدم بناءً أقدم أو تثبيتًا مخصصًا يستثني Teams المضمّن،
فثبّت حزمة npm مباشرةً:

```bash
openclaw plugins install @openclaw/msteams
```

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا محددًا
فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

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
Teams CLI حاليًا في إصدار معاينة. قد تتغير الأوامر والخيارات بين الإصدارات.
</Note>

**2. ابدأ نفقًا** (لا يستطيع Teams الوصول إلى localhost)

ثبّت وصدّق devtunnel CLI إذا لم تكن قد فعلت ذلك بالفعل ([دليل البدء](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` مطلوب لأن Teams لا يستطيع المصادقة مع devtunnels. يظل كل طلب بوت وارد مُتحققًا منه تلقائيًا بواسطة Teams SDK.
</Note>

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (لكنها قد تغير عناوين URL في كل جلسة).

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
- يسجل البوت (مدار بواسطة Teams افتراضيًا - لا حاجة إلى اشتراك Azure)

سيعرض الخرج `CLIENT_ID` و`CLIENT_SECRET` و`TENANT_ID` و**معرّف تطبيق Teams** - دوّن هذه للخطوات التالية. كما يعرض تثبيت التطبيق في Teams مباشرةً.

**4. اضبط OpenClaw** باستخدام بيانات الاعتماد من الخرج:

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

سيطالبك `teams app create` بتثبيت التطبيق - اختر "التثبيت في Teams". إذا تخطيت ذلك، يمكنك الحصول على الرابط لاحقًا:

```bash
teams app get <teamsAppId> --install-link
```

**6. تحقق من أن كل شيء يعمل**

```bash
teams app doctor <teamsAppId>
```

يشغّل هذا تشخيصات عبر تسجيل البوت، وإعداد تطبيق AAD، وصلاحية البيان، وإعداد SSO.

لعمليات النشر الإنتاجية، فكر في استخدام [المصادقة الاتحادية](/ar/channels/msteams#federated-authentication-certificate-plus-managed-identity) (شهادة أو هوية مُدارة) بدلًا من أسرار العميل.

<Note>
محادثات المجموعات محظورة افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بردود المجموعات، اضبط `channels.msteams.groupAllowFrom`، أو استخدم `groupPolicy: "open"` للسماح لأي عضو (مقيد بالإشارة).
</Note>

## الأهداف

- تحدث إلى OpenClaw عبر رسائل Teams الخاصة أو محادثات المجموعات أو القنوات.
- أبقِ التوجيه حتميًا: تعود الردود دائمًا إلى القناة التي وصلت منها.
- استخدم سلوك قناة آمنًا افتراضيًا (الإشارات مطلوبة ما لم يُضبط خلاف ذلك).

## كتابات الإعدادات

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات الإعدادات التي يطلقها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل الخاصة + المجموعات)

**وصول الرسائل الخاصة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يُتجاهل المرسلون غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائن AAD مستقرة.
- لا تعتمد على مطابقة UPN/اسم العرض لقوائم السماح - فقد تتغير. يعطّل OpenClaw مطابقة الأسماء المباشرة افتراضيًا؛ فعّلها صراحةً باستخدام `channels.msteams.dangerouslyAllowNameMatching: true`.
- يستطيع المعالج حل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**وصول المجموعات**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عند عدم ضبطه.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين الذين يمكنهم التشغيل في محادثات المجموعات/القنوات (مع الرجوع إلى `channels.msteams.allowFrom`).
- اضبط `groupPolicy: "open"` للسماح لأي عضو (مع بقاء التقييد بالإشارة افتراضيًا).
- للسماح بـ **عدم وجود أي قنوات**، اضبط `channels.msteams.groupPolicy: "disabled"`.

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

**Teams + قائمة سماح القنوات**

- حدّد نطاق ردود المجموعات/القنوات بإدراج الفرق والقنوات ضمن `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات محادثات Teams المستقرة من روابط Teams، وليس أسماء العرض القابلة للتغيير.
- عند وجود `groupPolicy="allowlist"` وقائمة سماح فرق، لا تُقبل إلا الفرق/القنوات المدرجة (مقيدة بالإشارة).
- يقبل معالج الإعداد إدخالات `Team/Channel` ويخزنها نيابة عنك.
- عند بدء التشغيل، يحل OpenClaw أسماء قوائم سماح الفريق/القناة والمستخدم إلى معرّفات (عندما تسمح أذونات Graph)
  ويسجل التعيين؛ تُحفظ أسماء الفرق/القنوات غير المحلولة كما كُتبت، لكنها تُتجاهل للتوجيه افتراضيًا ما لم يُفعّل `channels.msteams.dangerouslyAllowNameMatching: true`.

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

1. تأكد من توفر Microsoft Teams Plugin (مضمّن في الإصدارات الحالية).
2. أنشئ **Azure Bot** (معرّف التطبيق + السر + معرّف المستأجر).
3. ابنِ **حزمة تطبيق Teams** تشير إلى البوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams في فريق (أو نطاق شخصي للرسائل الخاصة).
5. اضبط `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway لحركة Webhook الخاصة بـ Bot Framework على `/api/messages` افتراضيًا.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [إنشاء Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ تبويب **الأساسيات**:

   | الحقل              | القيمة                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **مقبض البوت**     | اسم البوت لديك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **الاشتراك**   | اختر اشتراك Azure لديك                           |
   | **مجموعة الموارد** | أنشئ جديدة أو استخدم الموجودة                               |
   | **طبقة التسعير**   | **مجاني** للتطوير/الاختبار                                 |
   | **نوع التطبيق**    | **مستأجر واحد** (موصى به - راجع الملاحظة أدناه)         |
   | **نوع الإنشاء**  | **إنشاء معرّف تطبيق Microsoft جديد**                          |

<Warning>
تم إيقاف إنشاء بوتات جديدة متعددة المستأجرين بعد 2025-07-31. استخدم **مستأجرًا واحدًا** للبوتات الجديدة.
</Warning>

3. انقر **مراجعة + إنشاء** ← **إنشاء** (انتظر نحو 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot لديك ← **الإعدادات**
2. انسخ **معرّف تطبيق Microsoft** ← هذا هو `appId`
3. انقر **إدارة كلمة المرور** ← انتقل إلى تسجيل التطبيق
4. ضمن **الشهادات والأسرار** ← **سر عميل جديد** ← انسخ **القيمة** ← هذا هو `appPassword`
5. انتقل إلى **نظرة عامة** ← انسخ **معرّف الدليل (المستأجر)** ← هذا هو `tenantId`

### الخطوة 3: ضبط نقطة نهاية المراسلة

1. في Azure Bot ← **الإعدادات**
2. اضبط **نقطة نهاية المراسلة** إلى عنوان Webhook الخاص بك:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تمكين قناة Teams

1. في Azure Bot ← **القنوات**
2. انقر **Microsoft Teams** ← ضبط ← حفظ
3. اقبل شروط الخدمة

### الخطوة 5: بناء بيان تطبيق Teams

- ضمّن إدخال `bot` مع `botId = <App ID>`.
- النطاقات: `personal` و`team` و`groupChat`.
- `supportsFiles: true` (مطلوب لمعالجة الملفات في النطاق الشخصي).
- أضف أذونات RSC (راجع [أذونات RSC](#current-teams-rsc-permissions-manifest)).
- أنشئ أيقونات: `outline.png` (32x32) و`color.png` (192x192).
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

> أضيف في 2026.4.11

لعمليات النشر الإنتاجية، يدعم OpenClaw **المصادقة الاتحادية** كبديل أكثر أمانًا لأسرار العميل. تتوفر طريقتان:

### الخيار أ: المصادقة المستندة إلى الشهادة

استخدم شهادة PEM مسجلة مع تسجيل تطبيق Entra ID لديك.

**الإعداد:**

1. ولّد أو احصل على شهادة (تنسيق PEM مع مفتاح خاص).
2. في Entra ID ← تسجيل التطبيق ← **الشهادات والأسرار** ← **الشهادات** ← ارفع الشهادة العامة.

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

استخدم Azure Managed Identity للمصادقة بلا كلمة مرور. هذا مثالي لعمليات النشر على بنية Azure التحتية (AKS وApp Service وأجهزة Azure VM) حيث تتوفر هوية مُدارة.

**كيف يعمل:**

1. يمتلك جراب/جهاز VM الخاص بالبوت هوية مُدارة (معينة من النظام أو معينة من المستخدم).
2. يربط **اعتماد هوية اتحادية** الهوية المُدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على الرموز من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يُمرر الرمز إلى Teams SDK لمصادقة البوت.

**المتطلبات المسبقة:**

- بنية Azure تحتية مع تمكين الهوية المُدارة (هوية حمل عمل AKS، App Service، VM)
- اعتماد هوية اتحادية منشأ على تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من الجراب/VM

**الإعدادات (هوية مُدارة معينة من النظام):**

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

**الإعدادات (هوية مُدارة يعيّنها المستخدم):**

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
2. **أنشئ اعتماد هوية اتحادية** في تسجيل تطبيق Entra ID:

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

4. **ضع تسمية على الحاوية** لحقن هوية عبء العمل:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكد من توفر وصول الشبكة** إلى IMDS (`169.254.169.254`) - إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج تسمح بمرور البيانات إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة               | الإعداد                                         | المزايا                               | العيوب                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **سر العميل**    | `appPassword`                                  | إعداد بسيط                       | يتطلب تدوير السر، وأقل أمانًا |
| **الشهادة**      | `authType: "federated"` + `certificatePath`    | لا يوجد سر مشترك عبر الشبكة      | عبء إدارة الشهادات       |
| **الهوية المُدارة** | `authType: "federated"` + `useManagedIdentity` | بلا كلمة مرور، ولا أسرار لإدارتها | تتطلب بنية Azure التحتية         |

**السلوك الافتراضي:** عند عدم تعيين `authType`، يستخدم OpenClaw افتراضيًا المصادقة بسر العميل. تستمر الإعدادات الحالية في العمل دون تغييرات.

## التطوير المحلي (الأنفاق)

لا يستطيع Teams الوصول إلى `localhost`. استخدم نفق تطوير ثابتًا حتى يبقى عنوان URL لديك كما هو عبر الجلسات:

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

## اختبار الروبوت

**شغّل التشخيصات:**

```bash
teams app doctor <teamsAppId>
```

يتحقق من تسجيل الروبوت، وتطبيق AAD، والبيان، وإعداد SSO في تمريرة واحدة.

**أرسل رسالة اختبار:**

1. ثبّت تطبيق Teams (استخدم رابط التثبيت من `teams app get <id> --install-link`)
2. ابحث عن الروبوت في Teams وأرسل رسالة مباشرة
3. تحقق من سجلات Gateway بحثًا عن نشاط وارد

## متغيرات البيئة

يمكن تعيين جميع مفاتيح الإعداد عبر متغيرات البيئة بدلًا من ذلك:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (اتحادي + شهادة)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
- `MSTEAMS_USE_MANAGED_IDENTITY` (اتحادي + هوية مُدارة)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (MI معيّنة من المستخدم فقط)

## إجراء معلومات العضو

يوفّر OpenClaw إجراء `member-info` مدعومًا بـ Graph لـ Microsoft Teams حتى يتمكن الوكلاء وعمليات الأتمتة من حل تفاصيل أعضاء القناة (اسم العرض، البريد الإلكتروني، الدور) مباشرةً من Microsoft Graph.

المتطلبات:

- إذن RSC `Member.Read.Group` (موجود بالفعل في البيان الموصى به)
- لعمليات البحث عبر فرق متعددة: إذن تطبيق Graph `User.Read.All` مع موافقة المسؤول

الإجراء محكوم بواسطة `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عند توفر بيانات اعتماد Graph).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القناة/المجموعة الحديثة التي تُغلّف ضمن الموجه.
- يعود احتياطيًا إلى `messages.groupChat.historyLimit`. عيّن `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل سلسلة المحادثة المُجلب بواسطة قوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذا فإن تمهيد سياق سلسلة المحادثة لا يتضمن إلا الرسائل من المرسلين المسموح لهم.
- يتم حاليًا تمرير سياق المرفق المقتبس (المشتق من HTML رد Teams `ReplyTo*`) كما تم استلامه.
- بعبارة أخرى، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ أما اليوم فتتم تصفية مسارات سياق تكميلية محددة فقط.
- يمكن تحديد سجل الرسائل المباشرة باستخدام `channels.msteams.dmHistoryLimit` (دورات المستخدم). تجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات RSC الحالية في Teams (البيان)

هذه هي **أذونات resourceSpecific الحالية** في بيان تطبيق Teams لدينا. لا تنطبق إلا داخل الفريق/الدردشة التي ثُبّت فيها التطبيق.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` (Application) - استلام جميع رسائل القناة دون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**لدردشات المجموعة:**

- `ChatMessage.Read.Chat` (Application) - استلام جميع رسائل دردشة المجموعة دون @mention

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

### ملاحظات البيان (حقول إلزامية)

- يجب أن يطابق `bots[].botId` **حتماً** معرّف تطبيق Azure Bot.
- يجب أن يطابق `webApplicationInfo.id` **حتماً** معرّف تطبيق Azure Bot.
- يجب أن تتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` مطلوب للتعامل مع الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` قراءة/إرسال القنوات إذا كنت تريد حركة القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبّت بالفعل (مثلًا لإضافة أذونات RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

بعد التحديث، أعد تثبيت التطبيق في كل فريق حتى تصبح الأذونات الجديدة نافذة، و**أنه Teams تمامًا ثم أعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

<details>
<summary>تحديث البيان يدويًا (دون CLI)</summary>

1. حدّث `manifest.json` لديك بالإعدادات الجديدة
2. **زِد حقل `version`** (مثلًا، `1.0.0` → `1.1.0`)
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json`، `outline.png`، `color.png`)
4. ارفع ملف zip الجديد:
   - **مركز إدارة Teams:** تطبيقات Teams → إدارة التطبيقات → ابحث عن تطبيقك → رفع إصدار جديد
   - **التحميل الجانبي:** في Teams → التطبيقات → إدارة تطبيقاتك → رفع تطبيق مخصص

</details>

## القدرات: RSC فقط مقابل Graph

### مع **Teams RSC فقط** (التطبيق مثبّت، ولا توجد أذونات Graph API)

يعمل:

- قراءة محتوى **نص** رسائل القناة.
- إرسال محتوى **نص** رسائل القناة.
- استلام مرفقات الملفات في **الشخصية (رسائل مباشرة)**.

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

| القدرة              | أذونات RSC      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل في الوقت الفعلي**  | نعم (عبر Webhook)    | لا (استطلاع فقط)                   |
| **الرسائل التاريخية** | لا                   | نعم (يمكن الاستعلام عن السجل)             |
| **تعقيد الإعداد**    | بيان التطبيق فقط    | يتطلب موافقة المسؤول + تدفق الرمز المميز |
| **يعمل دون اتصال**       | لا (يجب أن يكون قيد التشغيل) | نعم (استعلام في أي وقت)                 |

**الخلاصة:** RSC مخصص للاستماع في الوقت الفعلي؛ Graph API مخصص للوصول التاريخي. للحاق بالرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط والسجل المفعّلان عبر Graph (مطلوب للقنوات)

إذا كنت تحتاج إلى الصور/الملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب تمكين أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **تسجيل التطبيق** في Entra ID (Azure AD)، أضف **أذونات تطبيق** Microsoft Graph:
   - `ChannelMessage.Read.All` (مرفقات القناة + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (دردشات المجموعة)
2. **امنح موافقة المسؤول** للمستأجر.
3. زِد **إصدار بيان** تطبيق Teams، وأعد رفعه، و**أعد تثبيت التطبيق في Teams**.
4. **أنه Teams تمامًا ثم أعد تشغيله** لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

**إذن إضافي لإشارات المستخدمين:** تعمل إشارات @mentions للمستخدمين تلقائيًا للمستخدمين في المحادثة. لكن إذا كنت تريد البحث ديناميكيًا عن مستخدمين **غير موجودين في المحادثة الحالية** والإشارة إليهم، فأضف إذن `User.Read.All` (Application) وامنح موافقة المسؤول.

## القيود المعروفة

### مهلات Webhook

يوصل Teams الرسائل عبر HTTP Webhook. إذا استغرقت المعالجة وقتًا طويلًا جدًا (مثلًا، استجابات LLM البطيئة)، فقد ترى:

- مهلات Gateway
- إعادة Teams محاولة إرسال الرسالة (ما يسبب تكرارات)
- ردودًا مُسقطة

يتعامل OpenClaw مع ذلك بالعودة بسرعة وإرسال الردود استباقيًا، لكن الاستجابات البطيئة جدًا قد تظل تسبب مشكلات.

### التنسيق

Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق**، _مائل_، `code`، الروابط
- قد لا يُعرض Markdown المعقد (الجداول، القوائم المتداخلة) بشكل صحيح
- تُدعم Adaptive Cards للاستطلاعات وإرسالات العرض الدلالي (انظر أدناه)

## التكوين

الإعدادات الرئيسية (انظر `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تفعيل/تعطيل القناة.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: بيانات اعتماد البوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة السماح للرسائل المباشرة (يوصى بمعرّفات كائنات AAD). يعالج المعالج الأسماء إلى معرّفات أثناء الإعداد عندما يكون الوصول إلى Graph متاحًا.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تفعيل مطابقة UPN/اسم العرض القابلة للتغيير والتوجيه المباشر باسم الفريق/القناة.
- `channels.msteams.textChunkLimit`: حجم مقطع النص الصادر.
- `channels.msteams.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة سماح لمضيفي المرفقات الواردة (تكون افتراضيًا نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة سماح لإرفاق ترويسات Authorization عند إعادة محاولة الوسائط (تكون افتراضيًا مضيفي Graph + Bot Framework).
- `channels.msteams.requireMention`: طلب @mention في القنوات/المجموعات (الافتراضي true).
- `channels.msteams.replyStyle`: `thread | top-level` (انظر [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) المستخدمة عند غياب تجاوز للقناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مرسل (يدعم حرف البدل `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مرسل (يدعم حرف البدل `"*"`).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:`، `e164:`، `username:`، `name:` (المفاتيح القديمة بلا بادئة ما زالت تُطابق `id:` فقط).
- `channels.msteams.actions.memberInfo`: تفعيل أو تعطيل إجراء معلومات العضو المدعوم من Graph (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).
- `channels.msteams.authType`: نوع المصادقة - `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (المصادقة الاتحادية + مصادقة الشهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختياري، غير مطلوب للمصادقة).
- `channels.msteams.useManagedIdentity`: تفعيل مصادقة الهوية المُدارة (وضع federated).
- `channels.msteams.managedIdentityClientId`: معرّف العميل للهوية المُدارة المعيّنة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرّف موقع SharePoint لرفع الملفات في دردشات/قنوات المجموعات (انظر [إرسال الملفات في دردشات المجموعات](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (انظر [/concepts/session](/ar/concepts/session)):
  - تشترك الرسائل المباشرة في الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: السلاسل مقابل المنشورات

قدّمت Teams مؤخرًا نمطين لواجهة مستخدم القنوات فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                               | قيمة `replyStyle` الموصى بها |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **المنشورات** (كلاسيكي)      | تظهر الرسائل كبطاقات مع ردود متسلسلة أسفلها | `thread` (الافتراضي)       |
| **السلاسل** (شبيهة بـ Slack) | تتدفق الرسائل خطيًا، أقرب إلى Slack                   | `top-level`              |

**المشكلة:** لا تكشف Teams API نمط واجهة المستخدم الذي تستخدمه القناة. إذا استخدمت قيمة `replyStyle` خاطئة:

- `thread` في قناة بنمط السلاسل → تظهر الردود متداخلة بشكل مربك
- `top-level` في قناة بنمط المنشورات → تظهر الردود كمنشورات مستقلة في المستوى الأعلى بدلًا من داخل السلسلة

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

عندما يرسل البوت ردًا إلى قناة، يتم حل `replyStyle` من التجاوز الأكثر تحديدًا نزولًا إلى الافتراضي. تفوز أول قيمة غير `undefined`:

1. **لكل قناة** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **لكل فريق** — `channels.msteams.teams.<teamId>.replyStyle`
3. **عام** — `channels.msteams.replyStyle`
4. **افتراضي ضمني** — مشتق من `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

إذا عيّنت `requireMention: false` عالميًا دون `replyStyle` صريح، فستظهر الإشارات في قنوات نمط المنشورات كمنشورات في المستوى الأعلى حتى عندما كان الوارد ردًا في سلسلة. ثبّت `replyStyle: "thread"` على المستوى العام أو مستوى الفريق أو القناة لتجنب المفاجآت.

### الحفاظ على سياق السلسلة

عندما يكون `replyStyle: "thread"` مفعّلًا وتمت @mention للبوت من داخل سلسلة قناة، يعيد OpenClaw إرفاق جذر السلسلة الأصلي بمرجع المحادثة الصادرة (`19:…@thread.tacv2;messageid=<root>`) لكي يصل الرد داخل السلسلة نفسها. ينطبق ذلك على كل من الإرسالات المباشرة (داخل الدورة) والإرسالات الاستباقية التي تتم بعد انتهاء صلاحية سياق دورة Bot Framework (مثل الوكلاء طويلَي التشغيل، وردود استدعاءات الأدوات الموضوعة في قائمة الانتظار عبر `mcp__openclaw__message`).

يُؤخذ جذر السلسلة من `threadId` المخزّن في مرجع المحادثة. المراجع المخزنة الأقدم التي تسبق `threadId` تعود إلى `activityId` (أيًا كان النشاط الوارد الذي أنشأ المحادثة آخر مرة)، لذلك تستمر عمليات النشر الحالية في العمل دون إعادة تهيئة.

عندما يكون `replyStyle: "top-level"` مفعّلًا، تتم الإجابة عمدًا على الواردات من سلاسل القنوات كمنشورات جديدة في المستوى الأعلى — لا تُرفق لاحقة سلسلة. هذا هو السلوك الصحيح للقنوات بنمط السلاسل؛ إذا رأيت منشورات في المستوى الأعلى حيث كنت تتوقع ردودًا متسلسلة، فإن `replyStyle` مضبوط بشكل غير صحيح لتلك القناة.

## المرفقات والصور

**القيود الحالية:**

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر APIs ملفات بوت Teams.
- **القنوات/المجموعات:** توجد المرفقات في تخزين M365 (SharePoint/OneDrive). لا تتضمن حمولة Webhook إلا قالب HTML، وليس بايتات الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- للإرسالات الصريحة التي يبدأها الملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ يصبح `message` الاختياري النص/التعليق المرافق، ويتجاوز `filename` الاسم المرفوع.

بدون أذونات Graph، ستُستقبل رسائل القنوات التي تحتوي على صور كنص فقط (لا يمكن للبوت الوصول إلى محتوى الصورة).
افتراضيًا، ينزّل OpenClaw الوسائط من أسماء مضيفي Microsoft/Teams فقط. تجاوز ذلك باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
لا تُرفق ترويسات Authorization إلا للمضيفين في `channels.msteams.mediaAuthAllowHosts` (تكون افتراضيًا مضيفي Graph + Bot Framework). أبقِ هذه القائمة صارمة (تجنب لواحق متعددة المستأجرين).

## إرسال الملفات في دردشات المجموعات

يمكن للبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard (مدمج). ومع ذلك، **يتطلب إرسال الملفات في دردشات/قنوات المجموعات** إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                           | الإعداد المطلوب                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة**                  | FileConsentCard → يقبل المستخدم → يرفع البوت | يعمل مباشرة دون إعداد                            |
| **دردشات/قنوات المجموعات** | رفع إلى SharePoint → مشاركة رابط            | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | مضمّنة بترميز Base64                        | تعمل مباشرة دون إعداد                            |

### لماذا تحتاج دردشات المجموعات إلى SharePoint

لا تملك البوتات محرك OneDrive شخصيًا (لا تعمل نقطة نهاية Graph API‏ `/me/drive` لهويات التطبيقات). لإرسال الملفات في دردشات/قنوات المجموعات، يرفع البوت إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` (Application) - اختياري، يفعّل روابط المشاركة لكل مستخدم

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
| `Sites.ReadWrite.All` + `Chat.Read.All` | رابط مشاركة لكل مستخدم (يمكن لأعضاء الدردشة فقط الوصول)      |

المشاركة لكل مستخدم أكثر أمانًا لأن المشاركين في الدردشة فقط يمكنهم الوصول إلى الملف. إذا كان إذن `Chat.Read.All` مفقودًا، يعود البوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع

| السيناريو                                          | النتيجة                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| دردشة مجموعة + ملف + `sharePointSiteId` مهيأ | رفع إلى SharePoint، إرسال رابط مشاركة            |
| دردشة مجموعة + ملف + بدون `sharePointSiteId`         | محاولة رفع إلى OneDrive (قد تفشل)، إرسال نص فقط |
| دردشة شخصية + ملف                              | تدفق FileConsentCard (يعمل بدون SharePoint)    |
| أي سياق + صورة                               | مضمّنة بترميز Base64 (تعمل بدون SharePoint)   |

### موقع الملفات المخزنة

تُخزن الملفات المرفوعة في مجلد `/OpenClawShared/` في مكتبة المستندات الافتراضية لموقع SharePoint المهيأ.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams كـ Adaptive Cards (لا توجد Teams poll API أصلية).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- تُسجّل الأصوات بواسطة Gateway في `~/.openclaw/msteams-polls.json`.
- يجب أن يظل Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات نتائج تلقائيًا بعد (افحص ملف التخزين إذا لزم الأمر).

## بطاقات العرض

أرسل حمولات عروض تقديمية دلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. يعرضها OpenClaw كبطاقات Teams Adaptive Cards من عقد العرض التقديمي العام.

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

لتفاصيل تنسيق الهدف، راجع [تنسيقات الهدف](#target-formats) أدناه.

## تنسيقات الهدف

تستخدم أهداف MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الهدف           | التنسيق                         | المثال                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| مستخدم (بالمعرّف)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| مستخدم (بالاسم)     | `user:<display-name>`            | `user:John Smith` (يتطلب Graph API)                 |
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
من دون البادئة `user:`، تستخدم الأسماء افتراضيًا حلّ المجموعة أو الفريق. استخدم دائمًا `user:` عند استهداف الأشخاص باسم العرض.
</Note>

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** أن يتفاعل مستخدم، لأننا نخزن مراجع المحادثة عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة `dmPolicy` وبوابة قائمة السماح.

## معرّفات الفريق والقناة (مشكلة شائعة)

معلمة الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليست** معرّف الفريق المستخدم في الإعداد. استخرج المعرّفات من مسار URL بدلًا من ذلك:

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

**للإعداد:**

- مفتاح الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`؛ قد تعرض المستأجرات الأقدم `@thread.skype`، وهو صالح أيضًا)
- مفتاح القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معلمة الاستعلام `groupId` لتوجيه OpenClaw. فهي معرّف مجموعة Microsoft Entra، وليست معرّف محادثة Bot Framework المستخدم في أنشطة Teams الواردة.

## القنوات الخاصة

لدى البوتات دعم محدود في القنوات الخاصة:

| الميزة                       | القنوات القياسية | القنوات الخاصة          |
| ---------------------------- | ----------------- | ---------------------- |
| تثبيت البوت                  | نعم               | محدود                  |
| الرسائل في الوقت الفعلي (webhook) | نعم               | قد لا تعمل             |
| أذونات RSC                   | نعم               | قد تتصرف بشكل مختلف    |
| @mentions                    | نعم               | إذا كان البوت متاحًا   |
| سجل Graph API                | نعم               | نعم (مع الأذونات)      |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات البوت
2. استخدم الرسائل المباشرة - يستطيع المستخدمون دائمًا مراسلة البوت مباشرة
3. استخدم Graph API للوصول التاريخي (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### المشكلات الشائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams بالكامل ثم أعد فتحه.
- **لا توجد ردود في القناة:** الإشارات مطلوبة افتراضيًا؛ عيّن `channels.msteams.requireMention=false` أو اضبط ذلك لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض البيان القديم):** أزل التطبيق ثم أعد إضافته، وأغلق Teams بالكامل لتحديثه.
- **401 Unauthorized من Webhook:** متوقع عند الاختبار يدويًا بدون Azure JWT - يعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع البيان

- **"Icon file cannot be empty":** يشير البيان إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (32x32 لـ `outline.png`، و192x192 لـ `color.png`).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتًا في فريق/دردشة أخرى. ابحث عنه وألغ تثبيته أولًا، أو انتظر 5-10 دقائق حتى يتم الانتشار.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح DevTools في المتصفح (F12) ← علامة تبويب Network، وتحقق من نص الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" - فهذا غالبًا يتجاوز قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقق من أن `webApplicationInfo.id` يطابق App ID الخاص بالبوت لديك تمامًا
2. أعد رفع التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقق مما إذا كان مسؤول مؤسستك قد حظر أذونات RSC
4. أكّد أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` لدردشات المجموعات

## المراجع

- [إنشاء Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [بوابة مطوري Teams](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [مخطط بيان تطبيق Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [استلام رسائل القناة باستخدام RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع أذونات RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [تعامل بوت Teams مع الملفات](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (تتطلب القناة/المجموعة Graph)
- [المراسلة الاستباقية](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI لإدارة البوتات

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعة وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
