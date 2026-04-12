---
read_when:
    - العمل على ميزات قناة Microsoft Teams
summary: حالة دعم بوت Microsoft Teams، والإمكانات، والإعدادات
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-12T00:18:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e6841a618fb030e4c2029b3652d45dedd516392e2ae17309ff46b93648ffb79
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "تخلَّوا عن كل أمل، يا من تدخلون هنا."

تم التحديث: 2026-03-25

الحالة: النص + مرفقات الرسائل المباشرة مدعومان؛ يتطلب إرسال الملفات في القنوات/المجموعات `sharePointSiteId` + أذونات Graph (راجع [إرسال الملفات في الدردشات الجماعية](#sending-files-in-group-chats)). تُرسَل الاستطلاعات عبر Adaptive Cards. تعرض إجراءات الرسائل `upload-file` بشكل صريح لعمليات الإرسال التي تبدأ بالملفات.

## المكون الإضافي المضمَّن

يأتي Microsoft Teams كمكون إضافي مضمَّن في إصدارات OpenClaw الحالية، لذا لا يلزم
أي تثبيت منفصل في البنية المعبأة العادية.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Teams المضمَّن،
فقم بتثبيته يدويًا:

```bash
openclaw plugins install @openclaw/msteams
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

التفاصيل: [المكونات الإضافية](/ar/tools/plugin)

## الإعداد السريع (للمبتدئين)

1. تأكد من أن المكون الإضافي Microsoft Teams متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ **Azure Bot** (معرّف التطبيق + سر العميل + معرّف المستأجر).
3. اضبط OpenClaw باستخدام بيانات الاعتماد هذه.
4. عرّض `/api/messages` (المنفذ 3978 افتراضيًا) عبر عنوان URL عام أو نفق.
5. ثبّت حزمة تطبيق Teams وابدأ البوابة.

الإعدادات الدنيا (سر العميل):

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

بالنسبة لعمليات النشر الإنتاجية، فكّر في استخدام [المصادقة الاتحادية](#federated-authentication-certificate--managed-identity) (شهادة أو هوية مُدارة) بدلًا من أسرار العميل.

ملاحظة: يتم حظر الدردشات الجماعية افتراضيًا (`channels.msteams.groupPolicy: "allowlist"`). للسماح بالردود الجماعية، اضبط `channels.msteams.groupAllowFrom` (أو استخدم `groupPolicy: "open"` للسماح لأي عضو، مع اشتراط الإشارة).

## الأهداف

- التحدث إلى OpenClaw عبر رسائل Teams المباشرة أو الدردشات الجماعية أو القنوات.
- الحفاظ على توجيه حتمي: تعود الردود دائمًا إلى القناة التي وصلت منها.
- اعتماد سلوك آمن للقنوات افتراضيًا (الإشارات مطلوبة ما لم يتم ضبط خلاف ذلك).

## كتابات الإعدادات

افتراضيًا، يُسمح لـ Microsoft Teams بكتابة تحديثات الإعدادات التي يتم تشغيلها بواسطة `/config set|unset` (يتطلب `commands.config: true`).

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
- أسماء UPN/العرض قابلة للتغيير؛ والمطابقة المباشرة معطلة افتراضيًا ولا تُفعّل إلا مع `channels.msteams.dangerouslyAllowNameMatching: true`.
- يمكن للمعالج حلّ الأسماء إلى معرّفات عبر Microsoft Graph عندما تسمح بيانات الاعتماد بذلك.

**الوصول إلى المجموعات**

- الافتراضي: `channels.msteams.groupPolicy = "allowlist"` (محظور ما لم تضف `groupAllowFrom`). استخدم `channels.defaults.groupPolicy` لتجاوز القيمة الافتراضية عند عدم الضبط.
- يتحكم `channels.msteams.groupAllowFrom` في المرسلين الذين يمكنهم التفعيل في الدردشات الجماعية/القنوات (مع الرجوع إلى `channels.msteams.allowFrom`).
- اضبط `groupPolicy: "open"` للسماح لأي عضو (ولا يزال مقيدًا بالإشارة افتراضيًا).
- لعدم السماح **بأي قنوات**، اضبط `channels.msteams.groupPolicy: "disabled"`.

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

- حدّد نطاق الردود في المجموعات/القنوات عبر إدراج الفرق والقنوات تحت `channels.msteams.teams`.
- يجب أن تستخدم المفاتيح معرّفات الفرق الثابتة ومعرّفات محادثات القنوات.
- عندما يكون `groupPolicy="allowlist"` وتوجد قائمة سماح للفرق، يتم قبول الفرق/القنوات المدرجة فقط (مع اشتراط الإشارة).
- يقبل معالج الإعداد إدخالات `Team/Channel` ويخزنها لك.
- عند بدء التشغيل، يحل OpenClaw أسماء الفرق/القنوات وأسماء المستخدمين في قائمة السماح إلى معرّفات (عندما تسمح أذونات Graph بذلك)
  ويسجل التعيين؛ وتُحتفظ بأسماء الفرق/القنوات غير المحلولة كما كُتبت لكن يتم تجاهلها في التوجيه افتراضيًا ما لم يتم تفعيل `channels.msteams.dangerouslyAllowNameMatching: true`.

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

## كيف يعمل

1. تأكد من أن المكون الإضافي Microsoft Teams متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ **Azure Bot** (معرّف التطبيق + السر + معرّف المستأجر).
3. أنشئ **حزمة تطبيق Teams** تشير إلى البوت وتتضمن أذونات RSC أدناه.
4. ارفع/ثبّت تطبيق Teams داخل فريق (أو في النطاق الشخصي للرسائل المباشرة).
5. اضبط `msteams` في `~/.openclaw/openclaw.json` (أو متغيرات البيئة) وابدأ البوابة.
6. تستمع البوابة افتراضيًا إلى حركة مرور Webhook الخاصة بـ Bot Framework على `/api/messages`.

## إعداد Azure Bot (المتطلبات المسبقة)

قبل ضبط OpenClaw، تحتاج إلى إنشاء مورد Azure Bot.

### الخطوة 1: إنشاء Azure Bot

1. انتقل إلى [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. املأ علامة التبويب **Basics**:

   | الحقل | القيمة |
   | ------------------ | -------------------------------------------------------- |
   | **اسم البوت** | اسم البوت الخاص بك، مثل `openclaw-msteams` (يجب أن يكون فريدًا) |
   | **الاشتراك** | اختر اشتراك Azure الخاص بك |
   | **مجموعة الموارد** | أنشئ مجموعة جديدة أو استخدم مجموعة موجودة |
   | **فئة التسعير** | **مجاني** للتطوير/الاختبار |
   | **نوع التطبيق** | **Single Tenant** (موصى به - راجع الملاحظة أدناه) |
   | **نوع الإنشاء** | **Create new Microsoft App ID** |

> **إشعار إهمال:** تم إهمال إنشاء بوتات جديدة متعددة المستأجرين بعد 2025-07-31. استخدم **Single Tenant** للبوتات الجديدة.

3. انقر **Review + create** → **Create** (انتظر حوالي 1-2 دقيقة)

### الخطوة 2: الحصول على بيانات الاعتماد

1. انتقل إلى مورد Azure Bot الخاص بك → **Configuration**
2. انسخ **Microsoft App ID** → هذا هو `appId`
3. انقر **Manage Password** → انتقل إلى App Registration
4. ضمن **Certificates & secrets** → **New client secret** → انسخ **Value** → هذا هو `appPassword`
5. انتقل إلى **Overview** → انسخ **Directory (tenant) ID** → هذا هو `tenantId`

### الخطوة 3: إعداد نقطة نهاية المراسلة

1. في Azure Bot → **Configuration**
2. اضبط **Messaging endpoint** على عنوان URL الخاص بـ webhook:
   - الإنتاج: `https://your-domain.com/api/messages`
   - التطوير المحلي: استخدم نفقًا (راجع [التطوير المحلي](#local-development-tunneling) أدناه)

### الخطوة 4: تفعيل قناة Teams

1. في Azure Bot → **Channels**
2. انقر **Microsoft Teams** → Configure → Save
3. اقبل شروط الخدمة

## المصادقة الاتحادية (الشهادة + الهوية المُدارة)

> أُضيف في 2026.3.24

بالنسبة لعمليات النشر الإنتاجية، يدعم OpenClaw **المصادقة الاتحادية** كبديل أكثر أمانًا لأسرار العميل. تتوفر طريقتان:

### الخيار أ: المصادقة المستندة إلى الشهادة

استخدم شهادة PEM مسجلة في تسجيل تطبيق Entra ID الخاص بك.

**الإعداد:**

1. أنشئ شهادة أو احصل عليها (بتنسيق PEM مع المفتاح الخاص).
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

استخدم Azure Managed Identity للمصادقة دون كلمة مرور. وهذا مثالي لعمليات النشر على بنية Azure التحتية (AKS، App Service، Azure VMs) حيث تتوفر هوية مُدارة.

**كيف يعمل:**

1. يحتوي الـ pod/VM الخاص بالبوت على هوية مُدارة (مخصصة من النظام أو من المستخدم).
2. يربط **اعتماد هوية اتحادية** الهوية المُدارة بتسجيل تطبيق Entra ID.
3. في وقت التشغيل، يستخدم OpenClaw `@azure/identity` للحصول على الرموز المميزة من نقطة نهاية Azure IMDS (`169.254.169.254`).
4. يتم تمرير الرمز المميز إلى Teams SDK لمصادقة البوت.

**المتطلبات المسبقة:**

- بنية Azure تحتية مع تفعيل الهوية المُدارة (AKS workload identity أو App Service أو VM)
- إنشاء اعتماد هوية اتحادية في تسجيل تطبيق Entra ID
- وصول شبكي إلى IMDS (`169.254.169.254:80`) من الـ pod/VM

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

**الإعدادات (هوية مُدارة مخصصة من المستخدم):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط للهوية المخصصة من المستخدم)

### إعداد AKS Workload Identity

لعمليات نشر AKS التي تستخدم workload identity:

1. **فعّل workload identity** في عنقود AKS الخاص بك.
2. **أنشئ اعتماد هوية اتحادية** في تسجيل تطبيق Entra ID:

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

4. **أضف تسمية إلى الـ pod** لحقن workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **تأكد من الوصول الشبكي** إلى IMDS (`169.254.169.254`) — إذا كنت تستخدم NetworkPolicy، فأضف قاعدة خروج تسمح بحركة المرور إلى `169.254.169.254/32` على المنفذ 80.

### مقارنة أنواع المصادقة

| الطريقة | الإعدادات | المزايا | العيوب |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **سر العميل** | `appPassword` | إعداد بسيط | يتطلب تدوير الأسرار، وأقل أمانًا |
| **الشهادة** | `authType: "federated"` + `certificatePath` | لا يوجد سر مشترك عبر الشبكة | عبء إدارة الشهادات |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | بدون كلمة مرور، ولا توجد أسرار لإدارتها | يتطلب بنية Azure التحتية |

**السلوك الافتراضي:** عندما لا يتم ضبط `authType`، يستخدم OpenClaw افتراضيًا مصادقة سر العميل. تستمر الإعدادات الحالية في العمل دون تغييرات.

## التطوير المحلي (الأنفاق)

لا يمكن لـ Teams الوصول إلى `localhost`. استخدم نفقًا للتطوير المحلي:

**الخيار أ: ngrok**

```bash
ngrok http 3978
# انسخ عنوان URL الخاص بـ https، مثل https://abc123.ngrok.io
# اضبط نقطة نهاية المراسلة على: https://abc123.ngrok.io/api/messages
```

**الخيار ب: Tailscale Funnel**

```bash
tailscale funnel 3978
# استخدم عنوان URL الخاص بـ Tailscale funnel كنقطة نهاية للمراسلة
```

## Teams Developer Portal (بديل)

بدلًا من إنشاء ملف manifest ZIP يدويًا، يمكنك استخدام [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. انقر **+ New app**
2. املأ المعلومات الأساسية (الاسم، الوصف، معلومات المطوّر)
3. انتقل إلى **App features** → **Bot**
4. اختر **Enter a bot ID manually** والصق Azure Bot App ID الخاص بك
5. حدّد النطاقات: **Personal** و**Team** و**Group Chat**
6. انقر **Distribute** → **Download app package**
7. في Teams: **Apps** → **Manage your apps** → **Upload a custom app** → اختر ملف ZIP

غالبًا ما يكون هذا أسهل من تعديل ملفات JSON manifest يدويًا.

## اختبار البوت

**الخيار أ: Azure Web Chat (تحقق من webhook أولًا)**

1. في Azure Portal → مورد Azure Bot الخاص بك → **Test in Web Chat**
2. أرسل رسالة - يجب أن ترى ردًا
3. يؤكد هذا أن نقطة نهاية webhook تعمل قبل إعداد Teams

**الخيار ب: Teams (بعد تثبيت التطبيق)**

1. ثبّت تطبيق Teams (تحميل جانبي أو كتالوج المؤسسة)
2. اعثر على البوت في Teams وأرسل رسالة مباشرة
3. تحقّق من سجلات البوابة لرؤية النشاط الوارد

## الإعداد (الحد الأدنى للنص فقط)

1. **تأكد من أن المكون الإضافي Microsoft Teams متاح**
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا:
     - من npm: `openclaw plugins install @openclaw/msteams`
     - من نسخة محلية: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **تسجيل البوت**
   - أنشئ Azure Bot (راجع أعلاه) وسجّل:
     - App ID
     - سر العميل (App password)
     - Tenant ID (مستأجر واحد)

3. **manifest تطبيق Teams**
   - أضف إدخال `bot` مع `botId = <App ID>`.
   - النطاقات: `personal` و`team` و`groupChat`.
   - `supportsFiles: true` (مطلوب للتعامل مع الملفات في النطاق الشخصي).
   - أضف أذونات RSC (أدناه).
   - أنشئ الأيقونات: `outline.png` (32x32) و`color.png` (192x192).
   - اضغط الملفات الثلاثة معًا في ملف Zip: `manifest.json` و`outline.png` و`color.png`.

4. **اضبط OpenClaw**

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

   يمكنك أيضًا استخدام متغيرات البيئة بدلًا من مفاتيح الإعداد:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (اختياري: `"secret"` أو `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (مصادقة اتحادية + شهادة)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختياري، غير مطلوب للمصادقة)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (مصادقة اتحادية + هوية مُدارة)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (لهوية MI المخصصة من المستخدم فقط)

5. **نقطة نهاية البوت**
   - اضبط Azure Bot Messaging Endpoint على:
     - `https://<host>:3978/api/messages` (أو المسار/المنفذ الذي اخترته).

6. **شغّل البوابة**
   - تبدأ قناة Teams تلقائيًا عندما يكون المكون الإضافي المضمَّن أو المثبَّت يدويًا متاحًا وتكون إعدادات `msteams` موجودة مع بيانات الاعتماد.

## إجراء معلومات العضو

يوفّر OpenClaw إجراء `member-info` مدعومًا من Graph لـ Microsoft Teams بحيث يمكن للوكلاء وعمليات الأتمتة حلّ تفاصيل أعضاء القناة (الاسم المعروض، البريد الإلكتروني، الدور) مباشرةً من Microsoft Graph.

المتطلبات:

- إذن RSC `Member.Read.Group` (موجود بالفعل في manifest الموصى به)
- لعمليات البحث عبر الفرق: إذن تطبيق Graph `User.Read.All` مع موافقة المسؤول

يتم التحكم في هذا الإجراء بواسطة `channels.msteams.actions.memberInfo` (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).

## سياق السجل

- يتحكم `channels.msteams.historyLimit` في عدد رسائل القناة/المجموعة الحديثة التي يتم تضمينها في الموجّه.
- يعود إلى `messages.groupChat.historyLimit`. اضبطه على `0` للتعطيل (الافتراضي 50).
- تتم تصفية سجل سلسلة الرسائل الذي يتم جلبه وفقًا لقوائم السماح للمرسلين (`allowFrom` / `groupAllowFrom`)، لذا فإن تهيئة سياق السلسلة لا تتضمن إلا الرسائل من المرسلين المسموح بهم.
- يتم تمرير سياق المرفقات المقتبسة (`ReplyTo*` المشتق من HTML الرد في Teams) كما تم استلامه حاليًا.
- بعبارة أخرى، تتحكم قوائم السماح في من يمكنه تشغيل الوكيل؛ ويتم اليوم تصفية مسارات سياق إضافية محددة فقط.
- يمكن تقييد سجل الرسائل المباشرة عبر `channels.msteams.dmHistoryLimit` (أدوار المستخدم). وتوجد تجاوزات لكل مستخدم عبر: `channels.msteams.dms["<user_id>"].historyLimit`.

## أذونات Teams RSC الحالية (Manifest)

هذه هي **resourceSpecific permissions** الحالية في manifest تطبيق Teams لدينا. وهي تنطبق فقط داخل الفريق/الدردشة المثبَّت فيها التطبيق.

**للقنوات (نطاق الفريق):**

- `ChannelMessage.Read.Group` (Application) - تلقي كل رسائل القناة بدون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**للدردشات الجماعية:**

- `ChatMessage.Read.Chat` (Application) - تلقي كل رسائل الدردشة الجماعية بدون @mention

## مثال على Teams Manifest (مع تنقيح البيانات)

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

### تحذيرات manifest (حقول أساسية مطلوبة)

- يجب أن يطابق `bots[].botId` **بالضرورة** Azure Bot App ID.
- يجب أن يطابق `webApplicationInfo.id` **بالضرورة** Azure Bot App ID.
- يجب أن يتضمن `bots[].scopes` الأسطح التي تخطط لاستخدامها (`personal` و`team` و`groupChat`).
- `bots[].supportsFiles: true` مطلوب للتعامل مع الملفات في النطاق الشخصي.
- يجب أن يتضمن `authorization.permissions.resourceSpecific` أذونات قراءة/إرسال القنوات إذا كنت تريد حركة مرور القنوات.

### تحديث تطبيق موجود

لتحديث تطبيق Teams مثبت بالفعل (على سبيل المثال، لإضافة أذونات RSC):

1. حدّث `manifest.json` بالإعدادات الجديدة
2. **زد حقل `version`** (مثلًا `1.0.0` → `1.1.0`)
3. **أعِد ضغط** manifest مع الأيقونات (`manifest.json` و`outline.png` و`color.png`)
4. ارفع ملف zip الجديد:
   - **الخيار أ (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → اعثر على تطبيقك → Upload new version
   - **الخيار ب (التحميل الجانبي):** في Teams → Apps → Manage your apps → Upload a custom app
5. **لقنوات الفريق:** أعد تثبيت التطبيق في كل فريق حتى تصبح الأذونات الجديدة فعّالة
6. **أغلق Teams تمامًا وأعد تشغيله** (وليس مجرد إغلاق النافذة) لمسح بيانات تعريف التطبيق المخزنة مؤقتًا

## الإمكانات: RSC فقط مقابل Graph

### مع **Teams RSC فقط** (التطبيق مثبت، بدون أذونات Microsoft Graph API)

يعمل:

- قراءة محتوى **النص** في رسائل القنوات.
- إرسال محتوى **نصي** إلى القنوات.
- استقبال مرفقات الملفات في **النطاق الشخصي (DM)**.

لا يعمل:

- **صور أو محتويات ملفات** القنوات/المجموعات (تتضمن الحمولة فقط HTML placeholder).
- تنزيل المرفقات المخزّنة في SharePoint/OneDrive.
- قراءة سجل الرسائل (إلى ما بعد حدث webhook المباشر).

### مع **Teams RSC + أذونات تطبيق Microsoft Graph**

يضيف:

- تنزيل المحتويات المستضافة (الصور الملصقة في الرسائل).
- تنزيل مرفقات الملفات المخزنة في SharePoint/OneDrive.
- قراءة سجل رسائل القنوات/الدردشات عبر Graph.

### RSC مقابل Graph API

| الإمكانية | أذونات RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **الرسائل الفورية** | نعم (عبر webhook) | لا (استقصاء فقط) |
| **الرسائل التاريخية** | لا | نعم (يمكن الاستعلام عن السجل) |
| **تعقيد الإعداد** | manifest التطبيق فقط | يتطلب موافقة المسؤول + تدفق الرموز |
| **يعمل دون اتصال** | لا (يجب أن يكون قيد التشغيل) | نعم (يمكن الاستعلام في أي وقت) |

**الخلاصة:** تُستخدم RSC للاستماع الفوري؛ ويُستخدم Graph API للوصول إلى السجل. إذا كنت تريد تعويض الرسائل الفائتة أثناء عدم الاتصال، فأنت تحتاج إلى Graph API مع `ChannelMessage.Read.All` (يتطلب موافقة المسؤول).

## الوسائط + السجل مع تفعيل Graph (مطلوب للقنوات)

إذا كنت تحتاج إلى صور/ملفات في **القنوات** أو تريد جلب **سجل الرسائل**، فيجب عليك تفعيل أذونات Microsoft Graph ومنح موافقة المسؤول.

1. في **App Registration** ضمن Entra ID (Azure AD)، أضف **Application permissions** لـ Microsoft Graph:
   - `ChannelMessage.Read.All` (مرفقات القنوات + السجل)
   - `Chat.Read.All` أو `ChatMessage.Read.All` (الدردشات الجماعية)
2. **امنح موافقة المسؤول** للمستأجر.
3. ارفع **إصدار manifest** لتطبيق Teams، ثم أعد رفعه، و**أعد تثبيت التطبيق في Teams**.
4. **أغلق Teams تمامًا وأعد تشغيله** لمسح بيانات تعريف التطبيق المخزنة مؤقتًا.

**إذن إضافي لإشارات المستخدمين:** تعمل إشارات المستخدم @mentions مباشرةً للمستخدمين الموجودين في المحادثة. ولكن إذا كنت تريد البحث ديناميكيًا عن مستخدمين والإشارة إليهم وهم **ليسوا في المحادثة الحالية**، فأضف إذن التطبيق `User.Read.All` وامنح موافقة المسؤول.

## القيود المعروفة

### مهلات webhook

يُسلِّم Teams الرسائل عبر HTTP webhook. إذا استغرقت المعالجة وقتًا طويلًا جدًا (مثل استجابات LLM البطيئة)، فقد ترى:

- مهلات البوابة
- إعادة Teams لمحاولة إرسال الرسالة (مما يسبب تكرارات)
- إسقاط الردود

يعالج OpenClaw ذلك عبر الإرجاع السريع وإرسال الردود بشكل استباقي، لكن الاستجابات البطيئة جدًا قد تظل تسبب مشكلات.

### التنسيق

تنسيق Markdown في Teams أكثر محدودية من Slack أو Discord:

- يعمل التنسيق الأساسي: **غامق** و_مائل_ و`code` والروابط
- قد لا يتم عرض Markdown المعقد (الجداول، القوائم المتداخلة) بشكل صحيح
- يتم دعم Adaptive Cards للاستطلاعات وعمليات إرسال البطاقات العامة (راجع أدناه)

## الإعدادات

الإعدادات الأساسية (راجع `/gateway/configuration` لأنماط القنوات المشتركة):

- `channels.msteams.enabled`: تفعيل/تعطيل القناة.
- `channels.msteams.appId` و`channels.msteams.appPassword` و`channels.msteams.tenantId`: بيانات اعتماد البوت.
- `channels.msteams.webhook.port` (الافتراضي `3978`)
- `channels.msteams.webhook.path` (الافتراضي `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing)
- `channels.msteams.allowFrom`: قائمة السماح للرسائل المباشرة (يُنصح باستخدام معرّفات كائنات AAD). يحلّ المعالج الأسماء إلى معرّفات أثناء الإعداد عندما يكون وصول Graph متاحًا.
- `channels.msteams.dangerouslyAllowNameMatching`: مفتاح طوارئ لإعادة تفعيل مطابقة UPN/أسماء العرض القابلة للتغيير والتوجيه المباشر بأسماء الفرق/القنوات.
- `channels.msteams.textChunkLimit`: حجم تقسيم النص الصادر.
- `channels.msteams.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.msteams.mediaAllowHosts`: قائمة السماح لمضيفي المرفقات الواردة (الافتراضي: نطاقات Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: قائمة السماح لإرفاق ترويسات Authorization عند إعادة محاولة الوسائط (الافتراضي: مضيفو Graph + Bot Framework).
- `channels.msteams.requireMention`: اشتراط @mention في القنوات/المجموعات (الافتراضي true).
- `channels.msteams.replyStyle`: `thread | top-level` (راجع [نمط الرد](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.requireMention`: تجاوز لكل فريق.
- `channels.msteams.teams.<teamId>.tools`: تجاوزات سياسة الأدوات الافتراضية لكل فريق (`allow`/`deny`/`alsoAllow`) تُستخدم عند غياب تجاوز على مستوى القناة.
- `channels.msteams.teams.<teamId>.toolsBySender`: تجاوزات سياسة الأدوات الافتراضية لكل مرسل داخل الفريق (`"*"` wildcard مدعوم).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: تجاوز لكل قناة.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: تجاوزات سياسة الأدوات لكل قناة (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: تجاوزات سياسة الأدوات لكل مرسل داخل القناة (`"*"` wildcard مدعوم).
- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة:
  `id:` و`e164:` و`username:` و`name:` (المفاتيح القديمة غير المسبوقة لا تزال تُطابق `id:` فقط).
- `channels.msteams.actions.memberInfo`: تفعيل أو تعطيل إجراء معلومات العضو المدعوم من Graph (الافتراضي: مفعّل عندما تكون بيانات اعتماد Graph متاحة).
- `channels.msteams.authType`: نوع المصادقة — `"secret"` (الافتراضي) أو `"federated"`.
- `channels.msteams.certificatePath`: مسار ملف شهادة PEM (مصادقة اتحادية + شهادة).
- `channels.msteams.certificateThumbprint`: بصمة الشهادة (اختياري، غير مطلوب للمصادقة).
- `channels.msteams.useManagedIdentity`: تفعيل مصادقة الهوية المُدارة (في وضع federated).
- `channels.msteams.managedIdentityClientId`: معرّف العميل للهوية المُدارة المخصصة من المستخدم.
- `channels.msteams.sharePointSiteId`: معرّف موقع SharePoint لرفع الملفات في الدردشات الجماعية/القنوات (راجع [إرسال الملفات في الدردشات الجماعية](#sending-files-in-group-chats)).

## التوجيه والجلسات

- تتبع مفاتيح الجلسات تنسيق الوكيل القياسي (راجع [/concepts/session](/ar/concepts/session)):
  - تشترك الرسائل المباشرة في الجلسة الرئيسية (`agent:<agentId>:<mainKey>`).
  - تستخدم رسائل القنوات/المجموعات معرّف المحادثة:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## نمط الرد: سلاسل الرسائل مقابل المنشورات

قدّم Teams مؤخرًا نمطين لواجهة القنوات فوق نموذج البيانات الأساسي نفسه:

| النمط | الوصف | `replyStyle` الموصى به |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (الكلاسيكي) | تظهر الرسائل كبطاقات مع ردود مترابطة أسفلها | `thread` (الافتراضي) |
| **Threads** (على نمط Slack) | تتدفق الرسائل بشكل خطي، بصورة أقرب إلى Slack | `top-level` |

**المشكلة:** لا تكشف Teams API عن نمط الواجهة الذي تستخدمه القناة. إذا استخدمت `replyStyle` غير المناسب:

- `thread` في قناة بنمط Threads → تظهر الردود متداخلة بشكل غير ملائم
- `top-level` في قناة بنمط Posts → تظهر الردود كمنشورات مستقلة على المستوى الأعلى بدلًا من داخل السلسلة

**الحل:** اضبط `replyStyle` لكل قناة وفقًا لطريقة إعداد القناة:

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
- **القنوات/المجموعات:** تعيش المرفقات في تخزين M365 (SharePoint/OneDrive). تتضمن حمولة webhook فقط HTML placeholder، وليس بايتات الملف الفعلية. **أذونات Graph API مطلوبة** لتنزيل مرفقات القنوات.
- لعمليات الإرسال الصريحة التي تبدأ بملف، استخدم `action=upload-file` مع `media` / `filePath` / `path`؛ ويصبح `message` الاختياري النص/التعليق المرافق، بينما يتجاوز `filename` الاسم المرفوع.

من دون أذونات Graph، ستُستقبل رسائل القنوات التي تحتوي على صور كنص فقط (ولا يكون محتوى الصورة متاحًا للبوت).
افتراضيًا، ينزّل OpenClaw الوسائط فقط من أسماء مضيفي Microsoft/Teams. ويمكنك تجاوز ذلك عبر `channels.msteams.mediaAllowHosts` (استخدم `["*"]` للسماح بأي مضيف).
تُرفق ترويسات Authorization فقط للمضيفين الموجودين في `channels.msteams.mediaAuthAllowHosts` (الافتراضي: مضيفو Graph + Bot Framework). أبقِ هذه القائمة صارمة (وتجنب suffixes متعددة المستأجرين).

## إرسال الملفات في الدردشات الجماعية

يمكن للبوتات إرسال الملفات في الرسائل المباشرة باستخدام تدفق FileConsentCard (مدمج). لكن **إرسال الملفات في الدردشات الجماعية/القنوات** يتطلب إعدادًا إضافيًا:

| السياق | كيفية إرسال الملفات | الإعداد المطلوب |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **الرسائل المباشرة** | FileConsentCard → يقبل المستخدم → يرفع البوت | يعمل مباشرةً |
| **الدردشات الجماعية/القنوات** | رفع إلى SharePoint → مشاركة الرابط | يتطلب `sharePointSiteId` + أذونات Graph |
| **الصور (أي سياق)** | Base64 مضمّن inline | يعمل مباشرةً |

### لماذا تحتاج الدردشات الجماعية إلى SharePoint

لا تمتلك البوتات محرك OneDrive شخصيًا (لا تعمل نقطة نهاية Graph API ‏`/me/drive` مع هويات التطبيقات). لإرسال الملفات في الدردشات الجماعية/القنوات، يرفع البوت الملف إلى **موقع SharePoint** وينشئ رابط مشاركة.

### الإعداد

1. **أضف أذونات Graph API** في Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - رفع الملفات إلى SharePoint
   - `Chat.Read.All` (Application) - اختياري، يفعّل روابط مشاركة لكل مستخدم

2. **امنح موافقة المسؤول** للمستأجر.

3. **احصل على معرّف موقع SharePoint الخاص بك:**

   ```bash
   # عبر Graph Explorer أو curl مع رمز صالح:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # مثال: لموقع على "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # تتضمن الاستجابة: "id": "contoso.sharepoint.com,guid1,guid2"
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

| الإذن | سلوك المشاركة |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` فقط | رابط مشاركة على مستوى المؤسسة (يمكن لأي شخص في المؤسسة الوصول) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | رابط مشاركة لكل مستخدم (يمكن فقط لأعضاء الدردشة الوصول) |

تكون المشاركة لكل مستخدم أكثر أمانًا لأن المشاركين في الدردشة فقط يمكنهم الوصول إلى الملف. وإذا كان إذن `Chat.Read.All` مفقودًا، يعود البوت إلى المشاركة على مستوى المؤسسة.

### سلوك الرجوع الاحتياطي

| السيناريو | النتيجة |
| ------------------------------------------------- | -------------------------------------------------- |
| دردشة جماعية + ملف + تم ضبط `sharePointSiteId` | الرفع إلى SharePoint، ثم إرسال رابط مشاركة |
| دردشة جماعية + ملف + لا يوجد `sharePointSiteId` | محاولة رفع إلى OneDrive (قد تفشل)، ثم إرسال نص فقط |
| دردشة شخصية + ملف | تدفق FileConsentCard (يعمل بدون SharePoint) |
| أي سياق + صورة | Base64 مضمّن inline (يعمل بدون SharePoint) |

### موقع تخزين الملفات

تُخزَّن الملفات المرفوعة في مجلد `/OpenClawShared/` داخل مكتبة المستندات الافتراضية لموقع SharePoint المضبوط.

## الاستطلاعات (Adaptive Cards)

يرسل OpenClaw استطلاعات Teams كبطاقات Adaptive Cards (لا توجد Teams poll API أصلية).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- تُسجَّل الأصوات بواسطة البوابة في `~/.openclaw/msteams-polls.json`.
- يجب أن تظل البوابة متصلة لتسجيل الأصوات.
- لا تنشر الاستطلاعات ملخصات النتائج تلقائيًا حتى الآن (افحص ملف التخزين إذا لزم الأمر).

## Adaptive Cards (عامة)

أرسل أي JSON من نوع Adaptive Card إلى مستخدمي Teams أو المحادثات باستخدام أداة `message` أو CLI.

تقبل المعلمة `card` كائن JSON لـ Adaptive Card. وعند توفير `card`، يصبح نص الرسالة اختياريًا.

**أداة الوكيل:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

راجع [وثائق Adaptive Cards](https://adaptivecards.io/) للحصول على مخطط البطاقات والأمثلة. ولمعرفة تفاصيل تنسيق الوجهة، راجع [تنسيقات الوجهة](#target-formats) أدناه.

## تنسيقات الوجهة

تستخدم وجهات MSTeams بادئات للتمييز بين المستخدمين والمحادثات:

| نوع الوجهة | التنسيق | المثال |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| مستخدم (حسب المعرّف) | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| مستخدم (حسب الاسم) | `user:<display-name>` | `user:John Smith` (يتطلب Graph API) |
| مجموعة/قناة | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| مجموعة/قناة (خام) | `<conversation-id>` | `19:abc123...@thread.tacv2` (إذا كان يحتوي على `@thread`) |

**أمثلة CLI:**

```bash
# الإرسال إلى مستخدم حسب المعرّف
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# الإرسال إلى مستخدم حسب اسم العرض (يؤدي إلى بحث عبر Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# الإرسال إلى دردشة جماعية أو قناة
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# إرسال Adaptive Card إلى محادثة
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
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
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

ملاحظة: بدون البادئة `user:`، تُوجَّه الأسماء افتراضيًا إلى حلّ المجموعة/الفريق. استخدم دائمًا `user:` عند استهداف الأشخاص باسم العرض.

## المراسلة الاستباقية

- لا تكون الرسائل الاستباقية ممكنة إلا **بعد** أن يتفاعل المستخدم، لأننا نخزن مراجع المحادثة عند تلك النقطة.
- راجع `/gateway/configuration` لمعرفة إعدادات `dmPolicy` وتقييد قائمة السماح.

## معرّفات الفريق والقناة (مشكلة شائعة)

ليست معلمة الاستعلام `groupId` في عناوين URL الخاصة بـ Teams هي معرّف الفريق المستخدم للإعداد. استخرج المعرّفات من مسار URL بدلًا من ذلك:

**عنوان URL للفريق:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    معرّف الفريق (فك ترميز URL لهذا)
```

**عنوان URL للقناة:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      معرّف القناة (فك ترميز URL لهذا)
```

**للإعداد:**

- معرّف الفريق = مقطع المسار بعد `/team/` (بعد فك ترميز URL، مثل `19:Bk4j...@thread.tacv2`)
- معرّف القناة = مقطع المسار بعد `/channel/` (بعد فك ترميز URL)
- **تجاهل** معلمة الاستعلام `groupId`

## القنوات الخاصة

تتمتع البوتات بدعم محدود في القنوات الخاصة:

| الميزة | القنوات القياسية | القنوات الخاصة |
| ---------------------------- | ----------------- | ---------------------- |
| تثبيت البوت | نعم | محدود |
| الرسائل الفورية (webhook) | نعم | قد لا تعمل |
| أذونات RSC | نعم | قد تتصرف بشكل مختلف |
| @mentions | نعم | إذا كان البوت متاحًا |
| سجل Graph API | نعم | نعم (مع الأذونات) |

**الحلول البديلة إذا لم تعمل القنوات الخاصة:**

1. استخدم القنوات القياسية لتفاعلات البوت
2. استخدم الرسائل المباشرة - يمكن للمستخدمين دائمًا مراسلة البوت مباشرةً
3. استخدم Graph API للوصول إلى السجل (يتطلب `ChannelMessage.Read.All`)

## استكشاف الأخطاء وإصلاحها

### المشكلات الشائعة

- **الصور لا تظهر في القنوات:** أذونات Graph أو موافقة المسؤول مفقودة. أعد تثبيت تطبيق Teams وأغلق Teams تمامًا/أعد فتحه.
- **لا توجد ردود في القناة:** الإشارات مطلوبة افتراضيًا؛ اضبط `channels.msteams.requireMention=false` أو قم بالضبط لكل فريق/قناة.
- **عدم تطابق الإصدار (لا يزال Teams يعرض manifest القديم):** أزل التطبيق ثم أضفه من جديد وأغلق Teams تمامًا لتحديثه.
- **401 Unauthorized من webhook:** هذا متوقع عند الاختبار اليدوي بدون Azure JWT - وهذا يعني أن نقطة النهاية قابلة للوصول لكن المصادقة فشلت. استخدم Azure Web Chat للاختبار بشكل صحيح.

### أخطاء رفع manifest

- **"Icon file cannot be empty":** يشير manifest إلى ملفات أيقونات حجمها 0 بايت. أنشئ أيقونات PNG صالحة (`outline.png` بحجم 32x32 و`color.png` بحجم 192x192).
- **"webApplicationInfo.Id already in use":** التطبيق لا يزال مثبتًا في فريق/دردشة أخرى. ابحث عنه وأزِل تثبيته أولًا، أو انتظر 5-10 دقائق لانتشار التغييرات.
- **"Something went wrong" عند الرفع:** ارفع عبر [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بدلًا من ذلك، وافتح أدوات المطور في المتصفح (F12) → علامة تبويب Network، وتحقق من نص الاستجابة لمعرفة الخطأ الفعلي.
- **فشل التحميل الجانبي:** جرّب "Upload an app to your org's app catalog" بدلًا من "Upload a custom app" - فهذا غالبًا ما يتجاوز قيود التحميل الجانبي.

### أذونات RSC لا تعمل

1. تحقّق من أن `webApplicationInfo.id` يطابق App ID الخاص بالبوت تمامًا
2. أعد رفع التطبيق وأعد تثبيته في الفريق/الدردشة
3. تحقّق مما إذا كان مسؤول المؤسسة قد حظر أذونات RSC
4. أكّد أنك تستخدم النطاق الصحيح: `ChannelMessage.Read.Group` للفرق، و`ChatMessage.Read.Chat` للدردشات الجماعية

## المراجع

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - دليل إعداد Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - إنشاء/إدارة تطبيقات Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (القنوات/المجموعات تتطلب Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتحصين
