---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم روبوت Microsoft Teams وإمكاناته وتكوينه
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T07:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

الحالة: النص + مرفقات الرسائل المباشرة مدعومة؛ يتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في محادثات المجموعات](#sending-files-in-group-chats)). تُرسل استطلاعات الرأي عبر Adaptive Cards. تعرض إجراءات الرسائل `upload-file` صريحًا للإرسال الذي يبدأ بالملف.

## Plugin المضمّن

يأتي Microsoft Teams كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا
يلزم تثبيت منفصل في البنية المعبأة العادية.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Teams المضمّن،
فثبّت حزمة npm حالية عند نشر واحدة:

```bash
openclaw plugins install @openclaw/msteams
```

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم بنية OpenClaw
معبأة حالية أو مسار النسخة المحلية حتى تُنشر حزمة npm أحدث.

النسخة المحلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

يتولى [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) تسجيل البوت، وإنشاء البيان، وتوليد بيانات الاعتماد في أمر واحد.

**1. التثبيت وتسجيل الدخول**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI حاليًا في مرحلة المعاينة. قد تتغير الأوامر والخيارات بين الإصدارات.
</Note>

**2. بدء نفق** (لا يستطيع Teams الوصول إلى localhost)

ثبّت وصادِق CLI الخاص بـ devtunnel إذا لم تكن قد فعلت ذلك بالفعل ([دليل البدء](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` مطلوب لأن Teams لا يمكنه المصادقة باستخدام devtunnels. ومع ذلك، يتحقق Teams SDK تلقائيًا من كل طلب بوت وارد.
</Note>

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (لكن قد تغيّر هذه عناوين URL في كل جلسة).

**3. إنشاء التطبيق**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

هذا الأمر الواحد:

- ينشئ تطبيق Entra ID (Azure AD)
- يولّد سر عميل
- يبني ويرفع بيان تطبيق Teams (مع الأيقونات)
- يسجّل البوت (تديره Teams افتراضيًا — لا حاجة إلى اشتراك Azure)

سيعرض الخرج `CLIENT_ID` و`CLIENT_SECRET` و`TENANT_ID` و**معرّف تطبيق Teams** — دوّنها للخطوات التالية. كما يعرض تثبيت التطبيق مباشرة في Teams.

**4. تهيئة OpenClaw** باستخدام بيانات الاعتماد من الخرج:

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

**5. تثبيت التطبيق في Teams**

سيطلب منك `teams app create` تثبيت التطبيق — اختر "Install in Teams". إذا تجاوزت ذلك، يمكنك الحصول على الرابط لاحقًا:

```bash
teams app get <teamsAppId> --install-link
```

**6. التحقق من أن كل شيء يعمل**

```bash
teams app doctor <teamsAppId>
```

يشغّل هذا تشخيصات عبر تسجيل البوت، وتهيئة تطبيق AAD، وصحة البيان، وإعداد SSO.

لعمليات النشر الإنتاجية، فكّر في استخدام [المصادقة الموحدة](/ar/channels/msteams#federated-authentication-certificate-plus-managed-identity) (شهادة أو هوية مُدارة) بدلًا من أسرار العملاء.

<Note>
تُحظر محادثات المجموعات افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بالردود في المجموعات، اضبط `channels.msteams.groupAllowFrom`، أو استخدم `groupPolicy: "open"` للسماح لأي عضو (مع تقييد بالإشارة).
</Note>

## الأهداف

- التحدث إلى OpenClaw عبر رسائل Teams المباشرة، أو محادثات المجموعات، أو القنوات.
- الحفاظ على توجيه حتمي: تعود الردود دائمًا إلى القناة التي وصلت منها.
- اعتماد سلوك آمن للقنوات افتراضيًا (الإشارات مطلوبة ما لم تتم التهيئة بخلاف ذلك).

## عمليات كتابة التهيئة

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات التهيئة التي يطلقها `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

**وصول الرسائل المباشرة**

- الافتراضي: `channels.msteams.dmPolicy = "pairing"`. يتم تجاهل المرسلين غير المعروفين حتى تتم الموافقة عليهم.
- يجب أن يستخدم `channels.msteams.allowFrom` معرّفات كائنات AAD مستقرة.
- لا تعتمد على مطابقة UPN/اسم العرض لقوائم السماح — إذ يمكن أن تتغير. يعطّل OpenClaw مطابقة الأسماء المباشرة افتراضيًا؛ فعّلها صراحة باستخدام `channels.msteams.dangerouslyAllowNameMatching: true`.
- يستطيع المعالج حل الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**وصول المجموعات**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز الافتراضي عند عدم ضبطه.
- يتحكم `channels.msteams.groupAllowFrom` في أي المرسلين يمكنهم التشغيل في محادثات المجموعات/القنوات (مع الرجوع إلى `channels.msteams.allowFrom`).
- اضبط `groupPolicy: "open"` للسماح لأي عضو (مع تقييد افتراضي بالإشارة).
- للسماح بـ **عدم وجود قنوات**، اضبط `channels.msteams.groupPolicy: "disabled"`.

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

**قائمة السماح لـ Teams + القنوات**

- قيّد ردود المجموعات/القنوات بإدراج الفرق والقنوات ضمن `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات محادثات Teams المستقرة من روابط Teams، وليس أسماء العرض القابلة للتغيير.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، تُقبل الفرق/القنوات المدرجة فقط (مع تقييد بالإشارة).
- يقبل معالج التهيئة إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يحل OpenClaw أسماء قوائم السماح للفرق/القنوات والمستخدمين إلى معرّفات (عندما تسمح أذونات Graph)
  ويسجل التعيين؛ تبقى أسماء الفرق/القنوات غير المحلولة كما كُتبت، لكنها تُتجاهل للتوجيه افتراضيًا ما لم يكن `channels.msteams.dangerouslyAllowNameMatching: true` مفعّلًا.

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

### كيف يعمل

1. تأكد من توفر Microsoft Teams Plugin (مضمّن في الإصدارات الحالية).
2. أنشئ **Azure Bot** (معرّف التطبيق + السر + معرّف المستأجر).
3. ابنِ **حزمة تطبيق Teams** تشير إلى البوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams داخل فريق (أو نطاق شخصي للرسائل المباشرة).
5. هيّئ `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ Gateway.
6. يستمع Gateway لحركة Webhook الخاصة بـ Bot Framework على `/api/messages` افتراضيًا.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [إنشاء Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ تبويب **الأساسيات**:

   | الحقل              | القيمة                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **معرّف البوت**     | اسم البوت لديك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **الاشتراك**   | اختر اشتراك Azure الخاص بك                           |
   | **مجموعة الموارد** | أنشئ جديدة أو استخدم الموجودة                               |
   | **فئة التسعير**   | **مجاني** للتطوير/الاختبار                                 |
   | **نوع التطبيق**    | **مستأجر واحد** (موصى به - راجع الملاحظة أدناه)         |
   | **نوع الإنشاء**  | **إنشاء Microsoft App ID جديد**                          |

<Warning>
أصبح إنشاء بوتات جديدة متعددة المستأجرين مهملًا بعد 2025-07-31. استخدم **مستأجر واحد** للبوتات الجديدة.
</Warning>

3. انقر **مراجعة + إنشاء** → **إنشاء** (انتظر حوالي 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot لديك → **التهيئة**
2. انسخ **Microsoft App ID** → هذا هو `appId` لديك
3. انقر **إدارة كلمة المرور** → انتقل إلى تسجيل التطبيق
4. ضمن **الشهادات والأسرار** → **سر عميل جديد** → انسخ **القيمة** → هذه هي `appPassword` لديك
5. انتقل إلى **نظرة عامة** → انسخ **معرّف الدليل (المستأجر)** → هذا هو `tenantId` لديك

### الخطوة 3: تهيئة نقطة نهاية المراسلة

1. في Azure Bot → **التهيئة**
2. اضبط **نقطة نهاية المراسلة** على عنوان URL الخاص بـ Webhook لديك:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تمكين قناة Teams

1. في Azure Bot → **القنوات**
2. انقر **Microsoft Teams** → تهيئة → حفظ
3. اقبل شروط الخدمة

### الخطوة 5: بناء بيان تطبيق Teams

- أدرج إدخال `bot` مع `botId = <App ID>`.
- النطاقات: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (مطلوب للتعامل مع الملفات في النطاق الشخصي).
- أضف أذونات RSC (راجع [أذونات RSC](#current-teams-rsc-permissions-manifest)).
- أنشئ الأيقونات: `outline.png` (32x32) و`color.png` (192x192).
- اضغط الملفات الثلاثة معًا: `manifest.json`، `outline.png`، `color.png`.

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

متغيرات البيئة: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

### الخطوة 7: تشغيل Gateway

تبدأ قناة Teams تلقائيًا عندما يكون Plugin متاحًا وتوجد تهيئة `msteams` مع بيانات الاعتماد.

</details>

## المصادقة الموحدة (شهادة بالإضافة إلى هوية مُدارة)

> أضيفت في 2026.4.11

لعمليات النشر الإنتاجية، يدعم OpenClaw **المصادقة الموحدة** كبديل أكثر أمانًا لأسرار العملاء. تتوفر طريقتان:

### الخيار A: المصادقة القائمة على الشهادات

استخدم شهادة PEM مسجلة مع تسجيل تطبيق Entra ID لديك.

**الإعداد:**

1. ولّد شهادة أو احصل عليها (تنسيق PEM مع مفتاح خاص).
2. في Entra ID → تسجيل التطبيق → **الشهادات والأسرار** → **الشهادات** → ارفع الشهادة العامة.

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

### الخيار B: هوية Azure المُدارة

استخدم هوية Azure المُدارة للمصادقة بلا كلمة مرور. هذا مثالي لعمليات النشر على بنية Azure التحتية (AKS، App Service، أجهزة Azure VM) حيث تتوفر هوية مُدارة.

**كيف يعمل:**

1. يمتلك بود/VM الخاص بالبوت هوية مُدارة (معينة من النظام أو معينة من المستخدم).
2. يربط **اعتماد هوية موحدة** الهوية المُدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على الرموز من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يُمرر الرمز إلى Teams SDK لمصادقة البوت.

**المتطلبات المسبقة:**

- بنية Azure تحتية مع تمكين الهوية المُدارة (هوية حمل عمل AKS، App Service، VM)
- اعتماد هوية موحدة منشأ على تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من البود/VM

**التهيئة (هوية مُدارة معينة من النظام):**

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

1. **فعّل هوية حمل العمل** على مجموعة AKS لديك.
2. **أنشئ بيانات اعتماد هوية موحّدة** في تسجيل تطبيق Entra ID:

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

5. **تأكد من توفر الوصول الشبكي** إلى IMDS (`169.254.169.254`) — إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج تسمح بالحركة إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة               | الإعدادات                                       | المزايا                            | العيوب                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **سر العميل**         | `appPassword`                                  | إعداد بسيط                         | يتطلب تدوير السر، وأقل أمانًا |
| **الشهادة**           | `authType: "federated"` + `certificatePath`    | لا يوجد سر مشترك عبر الشبكة        | عبء إدارة الشهادات       |
| **الهوية المُدارة** | `authType: "federated"` + `useManagedIdentity` | بلا كلمات مرور، ولا أسرار لإدارتها | تتطلب بنية Azure التحتية         |

**السلوك الافتراضي:** عندما لا يتم تعيين `authType`، يستخدم OpenClaw افتراضيًا مصادقة سر العميل. تستمر الإعدادات الحالية في العمل دون تغييرات.

## التطوير المحلي (التمرير النفقي)

لا يمكن لـ Teams الوصول إلى `localhost`. استخدم نفق تطوير مستمرًا حتى يبقى عنوان URL كما هو عبر الجلسات:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

البدائل: `ngrok http 3978` أو `tailscale funnel 3978` (قد تتغير عناوين URL في كل جلسة).

إذا تغير عنوان URL الخاص بالنفق، فحدّث نقطة النهاية:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## اختبار الروبوت

**شغّل التشخيصات:**

```bash
teams app doctor <teamsAppId>
```

يتحقق من تسجيل الروبوت، وتطبيق AAD، والبيان، وإعداد SSO دفعة واحدة.

**أرسل رسالة اختبار:**

1. ثبّت تطبيق Teams (استخدم رابط التثبيت من `teams app get <id> --install-link`)
2. ابحث عن الروبوت في Teams وأرسل رسالة مباشرة
3. تحقق من سجلات Gateway للنشاط الوارد

## متغيرات البيئة

يمكن تعيين جميع مفاتيح الإعدادات عبر متغيرات البيئة بدلًا من ذلك:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (موحّد + شهادة)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
- `MSTEAMS_USE_MANAGED_IDENTITY` (موحّد + هوية مُدارة)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (للهوية المُدارة المعيّنة من المستخدم فقط)

## إجراء معلومات العضو

يوفر OpenClaw إجراء `member-info` مدعومًا من Graph لـ Microsoft Teams حتى تتمكن الوكلاء وعمليات الأتمتة من حل تفاصيل أعضاء القناة (اسم العرض، والبريد الإلكتروني، والدور) مباشرةً من Microsoft Graph.

المتطلبات:

- إذن RSC ‏`Member.Read.Group` (موجود بالفعل في البيان الموصى به)
- لعمليات البحث عبر الفرق: إذن تطبيق Graph ‏`User.Read.All` مع موافقة المسؤول

يخضع الإجراء للتحكم عبر `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عند توفر بيانات اعتماد Graph).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القناة/المجموعة الحديثة التي تُغلّف داخل الموجّه.
- يعود إلى `messages.groupChat.historyLimit`. عيّن `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل سلسلة المحادثة المجلوب بحسب قوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذلك لا يتضمن تمهيد سياق سلسلة المحادثة إلا رسائل من المرسلين المسموح لهم.
- يتم حاليًا تمرير سياق المرفق المقتبس (`ReplyTo*` المشتق من HTML رد Teams) كما تم استلامه.
- بعبارة أخرى، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ ولا تتم تصفية سوى مسارات سياق إضافية محددة اليوم.
- يمكن تقييد سجل الرسائل المباشرة باستخدام `channels.msteams.dmHistoryLimit` (أدوار المستخدم). تجاوزات لكل مستخدم: `channels.msteams.dms["<user_id>"].historyLimit`.

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

**لدردشات المجموعات:**

- `ChatMessage.Read.Chat` (Application) - استقبال جميع رسائل دردشة المجموعة دون @mention

لإضافة أذونات RSC عبر Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## مثال على بيان Teams (منقّح)

مثال بسيط وصالح بالحقول المطلوبة. استبدل المعرّفات وعناوين URL.

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

### تنبيهات البيان (حقول إلزامية)

- يجب أن يطابق `bots[].botId` **معرّف تطبيق Azure Bot**.
- يجب أن يطابق `webApplicationInfo.id` **معرّف تطبيق Azure Bot**.
- يجب أن يتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal`، `team`، `groupChat`).
- يلزم `bots[].supportsFiles: true` لمعالجة الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` قراءة/إرسال القنوات إذا كنت تريد حركة القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبّت بالفعل (مثلًا، لإضافة أذونات RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

بعد التحديث، أعد تثبيت التطبيق في كل فريق حتى تسري الأذونات الجديدة، و**أغلق Teams بالكامل وأعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

<details>
<summary>تحديث البيان يدويًا (دون CLI)</summary>

1. حدّث `manifest.json` لديك بالإعدادات الجديدة
2. **زد حقل `version`** (مثلًا، `1.0.0` → `1.1.0`)
3. **أعد ضغط** البيان مع الأيقونات (`manifest.json`، `outline.png`، `color.png`)
4. ارفع ملف zip الجديد:
   - **مركز إدارة Teams:** تطبيقات Teams → إدارة التطبيقات → ابحث عن تطبيقك → رفع إصدار جديد
   - **التحميل الجانبي:** في Teams → التطبيقات → إدارة تطبيقاتك → رفع تطبيق مخصص

</details>

## الإمكانات: RSC فقط مقابل Graph

### مع **Teams RSC فقط** (التطبيق مثبت، ولا توجد أذونات Graph API)

يعمل:

- قراءة محتوى **نص** رسالة القناة.
- إرسال محتوى **نص** رسالة القناة.
- استقبال مرفقات ملفات **شخصية (رسائل مباشرة)**.

لا يعمل:

- **محتويات الصور أو الملفات** في القناة/المجموعة (لا تتضمن الحمولة إلا قالب HTML).
- تنزيل المرفقات المخزنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (بعد حدث Webhook المباشر).

### مع **Teams RSC + أذونات تطبيق Microsoft Graph**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة في الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القناة/الدردشة عبر Graph.

### RSC مقابل Graph API

| الإمكانية              | أذونات RSC          | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل الفورية**    | نعم (عبر Webhook)    | لا (استطلاع فقط)                   |
| **الرسائل التاريخية** | لا                   | نعم (يمكن الاستعلام عن السجل)             |
| **تعقيد الإعداد**      | بيان التطبيق فقط    | يتطلب موافقة المسؤول + تدفق الرموز |
| **يعمل دون اتصال**     | لا (يجب أن يكون قيد التشغيل) | نعم (استعلام في أي وقت)                 |

**الخلاصة:** RSC مخصص للاستماع الفوري؛ أما Graph API فهو للوصول إلى السجل. للحاق بالرسائل الفائتة أثناء عدم الاتصال، تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط والسجل الممكّنان بواسطة Graph (مطلوبان للقنوات)

إذا كنت تحتاج إلى الصور/الملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب تمكين أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **تسجيل التطبيق** في Entra ID (Azure AD)، أضف **أذونات التطبيق** لـ Microsoft Graph:
   - `ChannelMessage.Read.All` (مرفقات القنوات + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (دردشات المجموعات)
2. **امنح موافقة المسؤول** للمستأجر.
3. زد **إصدار بيان** تطبيق Teams، وأعد رفعه، و**أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams بالكامل وأعد تشغيله** لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

**إذن إضافي لإشارات المستخدمين:** تعمل إشارات @mentions للمستخدمين افتراضيًا للمستخدمين الموجودين في المحادثة. ومع ذلك، إذا كنت تريد البحث ديناميكيًا عن مستخدمين **غير موجودين في المحادثة الحالية** والإشارة إليهم، فأضف إذن `User.Read.All` (Application) وامنح موافقة المسؤول.

## القيود المعروفة

### مهلات Webhook

يرسل Teams الرسائل عبر HTTP Webhook. إذا استغرقت المعالجة وقتًا طويلًا جدًا (مثل استجابات LLM البطيئة)، فقد ترى:

- مهلات Gateway
- إعادة Teams محاولة إرسال الرسالة (ما يسبب تكرارات)
- ردودًا ساقطة

يتعامل OpenClaw مع ذلك بإرجاع الاستجابة بسرعة وإرسال الردود بشكل استباقي، لكن الاستجابات البطيئة جدًا قد تظل تسبب مشكلات.

### التنسيق

Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق**، _مائل_، `code`، الروابط
- قد لا تُعرض Markdown المعقدة (الجداول، القوائم المتداخلة) بشكل صحيح
- Adaptive Cards مدعومة للاستطلاعات وإرسالات العرض الدلالي (انظر أدناه)

## التكوين

الإعدادات الرئيسية (انظر `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تفعيل/تعطيل القناة.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: بيانات اعتماد البوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة سماح للرسائل المباشرة (يوصى بمعرّفات كائنات AAD). يعالج المعالج الأسماء إلى معرّفات أثناء الإعداد عندما يكون الوصول إلى Graph متاحًا.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تفعيل مطابقة UPN/اسم العرض القابلة للتغيير والتوجيه المباشر حسب اسم الفريق/القناة.
- `channels.msteams.textChunkLimit`: حجم تقسيم النص الصادر.
- `channels.msteams.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة سماح لمضيفي المرفقات الواردة (تكون افتراضيًا نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة سماح لإرفاق ترويسات Authorization عند إعادة محاولة الوسائط (تكون افتراضيًا مضيفي Graph + Bot Framework).
- `channels.msteams.requireMention`: اشتراط @mention في القنوات/المجموعات (افتراضيًا true).
- `channels.msteams.replyStyle`: `thread | top-level` (انظر [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) المستخدمة عندما لا يوجد تجاوز للقناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل فريق ولكل مُرسل (يدعم حرف البدل `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل قناة ولكل مُرسل (يدعم حرف البدل `"*"`).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:`، `e164:`، `username:`، `name:` (المفاتيح القديمة غير المسبوقة لا تزال تُطابق `id:` فقط).
- `channels.msteams.actions.memberInfo`: تفعيل أو تعطيل إجراء معلومات العضو المدعوم من Graph (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).
- `channels.msteams.authType`: نوع المصادقة — `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (المصادقة المتحدة + مصادقة الشهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختيارية، غير مطلوبة للمصادقة).
- `channels.msteams.useManagedIdentity`: تفعيل مصادقة الهوية المُدارة (الوضع المتحد).
- `channels.msteams.managedIdentityClientId`: معرّف العميل للهوية المُدارة المعيّنة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرّف موقع SharePoint لعمليات رفع الملفات في دردشات/قنوات المجموعات (انظر [إرسال الملفات في دردشات المجموعات](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (انظر [/concepts/session](/ar/concepts/session)):
  - تشارك الرسائل المباشرة الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القناة/المجموعة معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: السلاسل مقابل المنشورات

قدمت Teams مؤخرًا نمطين لواجهة القنوات فوق نموذج البيانات الأساسي نفسه:

| النمط                    | الوصف                                               | `replyStyle` الموصى به |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **المنشورات** (كلاسيكي)      | تظهر الرسائل كبطاقات مع ردود متسلسلة أسفلها | `thread` (الافتراضي)       |
| **السلاسل** (شبيهة بـ Slack) | تتدفق الرسائل خطيًا، بشكل أقرب إلى Slack                   | `top-level`              |

**المشكلة:** لا تكشف واجهة Teams API نمط الواجهة الذي تستخدمه القناة. إذا استخدمت `replyStyle` غير الصحيح:

- `thread` في قناة بنمط السلاسل → تظهر الردود متداخلة بشكل غير ملائم
- `top-level` في قناة بنمط المنشورات → تظهر الردود كمنشورات مستقلة في المستوى الأعلى بدلًا من أن تكون داخل السلسلة

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

- **الرسائل المباشرة:** تعمل الصور ومرفقات الملفات عبر واجهات Teams bot file API.
- **القنوات/المجموعات:** تعيش المرفقات في تخزين M365 (SharePoint/OneDrive). لا تتضمن حمولة Webhook سوى قالب HTML، وليس بايتات الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- للإرسالات الصريحة التي تبدأ بالملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ يصبح `message` الاختياري النص/التعليق المصاحب، ويتجاوز `filename` الاسم المرفوع.

من دون أذونات Graph، ستُستقبل رسائل القنوات التي تحتوي على صور كنص فقط (محتوى الصورة غير متاح للبوت).
افتراضيًا، ينزل OpenClaw الوسائط فقط من أسماء مضيفي Microsoft/Teams. تجاوز ذلك باستخدام `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
لا تُرفق ترويسات Authorization إلا للمضيفين في `channels.msteams.mediaAuthAllowHosts` (تكون افتراضيًا مضيفي Graph + Bot Framework). أبقِ هذه القائمة صارمة (تجنب لواحق المستأجرين المتعددين).

## إرسال الملفات في دردشات المجموعات

يمكن للبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard (مدمج). ومع ذلك، يتطلب **إرسال الملفات في دردشات/قنوات المجموعات** إعدادًا إضافيًا:

| السياق                  | كيفية إرسال الملفات                           | الإعداد المطلوب                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة**                  | FileConsentCard → يقبل المستخدم → يرفع البوت | يعمل مباشرة                            |
| **دردشات/قنوات المجموعات** | الرفع إلى SharePoint → مشاركة رابط            | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | مضمّنة بترميز Base64                        | تعمل مباشرة                            |

### لماذا تحتاج دردشات المجموعات إلى SharePoint

لا تمتلك البوتات محرك OneDrive شخصيًا (نقطة نهاية Graph API `/me/drive` لا تعمل مع هويات التطبيقات). لإرسال الملفات في دردشات/قنوات المجموعات، يرفع البوت إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` (Application) - اختياري، يفعّل روابط مشاركة لكل مستخدم

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
| `Sites.ReadWrite.All` + `Chat.Read.All` | رابط مشاركة لكل مستخدم (يمكن لأعضاء الدردشة فقط الوصول)      |

المشاركة لكل مستخدم أكثر أمانًا لأن المشاركين في الدردشة وحدهم يمكنهم الوصول إلى الملف. إذا كان إذن `Chat.Read.All` مفقودًا، يعود البوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع

| السيناريو                                          | النتيجة                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| دردشة مجموعة + ملف + `sharePointSiteId` مُكوّن | رفع إلى SharePoint، إرسال رابط مشاركة            |
| دردشة مجموعة + ملف + بدون `sharePointSiteId`         | محاولة رفع إلى OneDrive (قد تفشل)، إرسال نص فقط |
| دردشة شخصية + ملف                              | تدفق FileConsentCard (يعمل بدون SharePoint)    |
| أي سياق + صورة                               | مضمّنة بترميز Base64 (تعمل بدون SharePoint)   |

### موقع تخزين الملفات

تُخزن الملفات المرفوعة في مجلد `/OpenClawShared/` داخل مكتبة المستندات الافتراضية لموقع SharePoint المُكوّن.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams كـ Adaptive Cards (لا توجد Teams poll API أصلية).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- تُسجل الأصوات بواسطة Gateway في `~/.openclaw/msteams-polls.json`.
- يجب أن يظل Gateway متصلًا لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا بعد (افحص ملف التخزين عند الحاجة).

## بطاقات العرض

أرسل حمولات عرض دلالية إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI. يعرضها OpenClaw كبطاقات Teams Adaptive Cards من عقد العرض العام.

يقبل معامل `presentation` كتلًا دلالية. عند توفير `presentation`، يكون نص الرسالة اختياريًا.

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

للحصول على تفاصيل تنسيق الهدف، انظر [تنسيقات الهدف](#target-formats) أدناه.

## تنسيقات الهدف

تستخدم أهداف MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الهدف         | التنسيق                           | المثال                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| مستخدم (حسب المعرّف)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
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
من دون البادئة `user:`، يتم افتراض أن الأسماء موجهة إلى حلّ مجموعة أو فريق. استخدم دائمًا `user:` عند استهداف الأشخاص باسم العرض.
</Note>

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** تفاعل المستخدم، لأننا نخزن مراجع المحادثة في تلك المرحلة.
- راجع `/gateway/configuration` للاطلاع على `dmPolicy` وضبط قائمة السماح.

## معرّفات الفريق والقناة (مشكلة شائعة)

معامل الاستعلام `groupId` في عناوين URL الخاصة بـ Teams **ليس** معرّف الفريق المستخدم للتكوين. استخرج المعرّفات من مسار URL بدلًا من ذلك:

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

**للتكوين:**

- مفتاح الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`؛ قد تعرض المستأجرات الأقدم `@thread.skype`، وهو صالح أيضًا)
- مفتاح القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معامل الاستعلام `groupId` لتوجيه OpenClaw. إنه معرّف مجموعة Microsoft Entra، وليس معرّف محادثة Bot Framework المستخدم في أنشطة Teams الواردة.

## القنوات الخاصة

لدى الروبوتات دعم محدود في القنوات الخاصة:

| الميزة                       | القنوات القياسية | القنوات الخاصة              |
| ---------------------------- | ---------------- | --------------------------- |
| تثبيت الروبوت                | نعم              | محدود                       |
| الرسائل الفورية (Webhook)    | نعم              | قد لا تعمل                  |
| أذونات RSC                   | نعم              | قد تتصرف بشكل مختلف         |
| إشارات @mentions             | نعم              | إذا كان الروبوت قابلًا للوصول |
| سجل Graph API                | نعم              | نعم (مع الأذونات)           |

**حلول بديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات الروبوت
2. استخدم الرسائل المباشرة - يمكن للمستخدمين دائمًا مراسلة الروبوت مباشرة
3. استخدم Graph API للوصول التاريخي (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### مشكلات شائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams بالكامل ثم افتحه من جديد.
- **لا توجد ردود في القناة:** تكون الإشارات مطلوبة افتراضيًا؛ اضبط `channels.msteams.requireMention=false` أو كوّن ذلك لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض البيان القديم):** أزل التطبيق ثم أعد إضافته، وأغلق Teams بالكامل لتحديثه.
- **401 Unauthorized من Webhook:** متوقع عند الاختبار يدويًا من دون Azure JWT - يعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع البيان

- **"Icon file cannot be empty":** يشير البيان إلى ملفات أيقونات بحجم 0 بايت. أنشئ أيقونات PNG صالحة (32x32 لـ `outline.png`، و192x192 لـ `color.png`).
- **"webApplicationInfo.Id already in use":** لا يزال التطبيق مثبتًا في فريق/دردشة أخرى. اعثر عليه وأزله أولًا، أو انتظر 5-10 دقائق حتى يكتمل الانتشار.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح أدوات المطور في المتصفح (F12) ← تبويب الشبكة، وتحقق من نص الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" - غالبًا ما يتجاوز هذا قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقق من أن `webApplicationInfo.id` يطابق App ID الخاص بروبوتك تمامًا
2. أعد رفع التطبيق وثبّته من جديد في الفريق/الدردشة
3. تحقق مما إذا كان مسؤول مؤسستك قد حظر أذونات RSC
4. تأكد من أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` لدردشات المجموعات

## المراجع

- [إنشاء Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [بوابة مطوري Teams](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [مخطط بيان تطبيق Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [تلقي رسائل القناة باستخدام RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع أذونات RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [تعامل روبوت Teams مع الملفات](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (تتطلب القناة/المجموعة Graph)
- [المراسلة الاستباقية](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI لإدارة الروبوتات

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وضبط الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
