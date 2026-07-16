---
read_when:
    - کار روی قابلیت‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی بات Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T16:04:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: متن و پیوست‌های پیام خصوصی پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (به [ارسال فایل در گفت‌وگوهای گروهی](#sending-files-in-group-chats) مراجعه کنید). نظرسنجی‌ها از طریق Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌هایی که فایل در آن‌ها مقدم است، ارائه می‌کنند.

## Plugin همراه

Microsoft Teams در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه عرضه می‌شود؛ در ساخت بسته‌بندی‌شدهٔ معمول، نصب جداگانه‌ای لازم نیست.

در یک ساخت قدیمی‌تر یا نصب سفارشی که Teams همراه را شامل نمی‌شود، بستهٔ npm را مستقیماً نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

برای پیروی از برچسب رسمی نسخهٔ فعلی، از بستهٔ بدون نسخه استفاده کنید. تنها زمانی یک نسخهٔ دقیق را سنجاق کنید که به نصبی تکرارپذیر نیاز دارید.

بررسی محلی (اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت ربات، ایجاد مانیفست و تولید اعتبارنامه را با یک فرمان انجام می‌دهد.

**1. نصب و ورود**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # بررسی کنید که وارد شده‌اید و اطلاعات مستأجر خود را ببینید
```

<Note>
Teams CLI در حال حاضر در مرحلهٔ پیش‌نمایش است. فرمان‌ها و پرچم‌ها ممکن است بین نسخه‌ها تغییر کنند.
</Note>

**2. راه‌اندازی یک تونل** (Teams نمی‌تواند به localhost دسترسی پیدا کند)

در صورت نیاز، devtunnel CLI را نصب کرده و احراز هویت کنید ([راهنمای شروع به کار](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# راه‌اندازی یک‌باره (نشانی پایدار در نشست‌های مختلف):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# در هر نشست توسعه:
devtunnel host my-openclaw-bot
# نقطهٔ پایانی شما: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` الزامی است، زیرا Teams نمی‌تواند با devtunnels احراز هویت کند. هر درخواست ورودی ربات همچنان توسط Teams SDK اعتبارسنجی می‌شود.
</Note>

جایگزین‌ها: `ngrok http 3978` یا `tailscale funnel 3978` (نشانی‌ها ممکن است در هر نشست تغییر کنند).

**3. ایجاد برنامه**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این کار یک برنامهٔ Entra ID (Azure AD) ایجاد می‌کند، یک راز سرویس‌گیرنده تولید می‌کند، مانیفست برنامهٔ Teams را (همراه با نمادها) می‌سازد و بارگذاری می‌کند، و یک ربات مدیریت‌شده توسط Teams را ثبت می‌کند (بدون نیاز به اشتراک Azure). خروجی شامل `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID` و یک **شناسهٔ برنامهٔ Teams** است؛ همچنین امکان نصب مستقیم برنامه در Teams را ارائه می‌دهد.

**4. پیکربندی OpenClaw** با استفاده از اعتبارنامه‌های خروجی:

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

یا مستقیماً از متغیرهای محیطی استفاده کنید: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

**5. نصب برنامه در Teams**

`teams app create` از شما می‌خواهد برنامه را نصب کنید؛ "Install in Teams" را انتخاب کنید. برای دریافت پیوند نصب در آینده:

```bash
teams app get <teamsAppId> --install-link
```

**6. بررسی عملکرد صحیح همه‌چیز**

```bash
teams app doctor <teamsAppId>
```

عیب‌یابی را در ثبت ربات، پیکربندی برنامهٔ AAD، اعتبار مانیفست و راه‌اندازی SSO اجرا می‌کند.

برای محیط عملیاتی، به‌جای رازهای سرویس‌گیرنده، [احراز هویت فدرال](#federated-authentication-certificate-plus-managed-identity) (گواهی یا هویت مدیریت‌شده) را در نظر بگیرید.

<Note>
گفت‌وگوهای گروهی به‌طور پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای اجازه‌دادن به پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` استفاده کنید تا هر عضوی مجاز باشد (مشروط به منشن).
</Note>

## اهداف

- از طریق پیام‌های خصوصی، گفت‌وگوهای گروهی یا کانال‌های Teams با OpenClaw گفت‌وگو کنید.
- مسیریابی را قطعی نگه دارید: پاسخ‌ها همیشه به همان کانالی بازمی‌گردند که از آن دریافت شده‌اند.
- رفتار ایمن کانال را پیش‌فرض قرار دهید (مگر آنکه پیکربندی دیگری انجام شده باشد، منشن الزامی است).

## نوشتن پیکربندی

به‌طور پیش‌فرض، Microsoft Teams می‌تواند به‌روزرسانی‌های پیکربندیِ فعال‌شده توسط `/config set|unset` را بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (پیام‌های خصوصی + گروه‌ها)

**دسترسی پیام خصوصی**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستندگان ناشناس تا زمان تأیید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از شناسه‌های پایدار شیء AAD یا گروه‌های دسترسی ایستای فرستنده مانند `accessGroup:core-team` استفاده کند.
- برای فهرست‌های مجاز به تطبیق UPN/نام نمایشی اتکا نکنید؛ این موارد ممکن است تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌طور پیش‌فرض غیرفعال می‌کند؛ با `channels.msteams.dangerouslyAllowNameMatching: true` آن را فعال کنید.
- وقتی اعتبارنامه‌ها اجازه دهند، جادوگر می‌تواند نام‌ها را از طریق Microsoft Graph به شناسه‌ها تبدیل کند.

**دسترسی گروهی**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است، مگر اینکه `groupAllowFrom` را اضافه کنید). وقتی `channels.msteams.groupPolicy` تنظیم نشده باشد، `channels.defaults.groupPolicy` می‌تواند پیش‌فرض مشترک را بازنویسی کند.
- `channels.msteams.groupAllowFrom` تعیین می‌کند کدام فرستندگان یا گروه‌های دسترسی ثابت فرستنده می‌توانند در گفت‌وگوهای گروهی/کانال‌ها آن را فعال کنند (در صورت نبود، از `channels.msteams.allowFrom` استفاده می‌شود).
- برای اجازه‌دادن به هر عضو، `groupPolicy: "open"` را تنظیم کنید (همچنان به‌طور پیش‌فرض منوط به منشن است).
- برای مسدودکردن **همه** کانال‌ها، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

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

**فهرست مجاز تیم و کانال**

- دامنه پاسخ‌های گروه/کانال را با فهرست‌کردن تیم‌ها و کانال‌ها در `channels.msteams.teams` محدود کنید.
- شناسه‌های پایدار مکالمه Teams را از پیوندهای Teams به‌عنوان کلید استفاده کنید، نه نام‌های نمایشی تغییرپذیر (به [شناسه‌های تیم و کانال](#team-and-channel-ids-common-gotcha) مراجعه کنید).
- وقتی `groupPolicy="allowlist"` و یک فهرست مجاز تیم‌ها وجود داشته باشد، فقط تیم‌ها/کانال‌های فهرست‌شده پذیرفته می‌شوند (منوط به منشن).
- جادوگر پیکربندی ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام راه‌اندازی، OpenClaw نام‌های تیم/کانال و فهرست مجاز کاربران را به شناسه تبدیل می‌کند (اگر مجوزهای Graph اجازه دهند) و نگاشت را در گزارش ثبت می‌کند. نام‌های حل‌نشده همان‌طور که وارد شده‌اند حفظ می‌شوند، اما مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` تنظیم شده باشد، برای مسیریابی نادیده گرفته می‌شوند.

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
<summary><strong>راه‌اندازی دستی (بدون CLI تیم‌ها)</strong></summary>

### نحوه کار

1. مطمئن شوید Plugin مربوط به Microsoft Teams در دسترس است (در نسخه‌های فعلی همراه محصول ارائه می‌شود).
2. یک **Azure Bot** ایجاد کنید (App ID، رمز و شناسه مستأجر).
3. یک **بسته برنامه Teams** بسازید که به بات ارجاع دهد و مجوزهای RSC زیر را شامل شود.
4. برنامه Teams را در یک تیم بارگذاری/نصب کنید (یا برای پیام‌های مستقیم، در دامنه شخصی).
5. `msteams` را در `~/.openclaw/openclaw.json` (یا متغیرهای محیطی) پیکربندی و Gateway را راه‌اندازی کنید.
6. Gateway به‌طور پیش‌فرض در `/api/messages` به ترافیک Webhook مربوط به Bot Framework گوش می‌دهد.

### گام 1: ایجاد Azure Bot

1. به [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید.
2. زبانه **Basics** را تکمیل کنید:

   | فیلد               | مقدار                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | نام بات شما، برای مثال `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription**   | اشتراک Azure خود را انتخاب کنید                           |
   | **Resource group** | یک مورد جدید ایجاد کنید یا از مورد موجود استفاده کنید     |
   | **Pricing tier**   | برای توسعه/آزمایش، **Free**                               |
   | **Type of App**    | **Single Tenant** (توصیه‌شده؛ یادداشت زیر را ببینید)      |
   | **Creation type**  | **Create new Microsoft App ID**                           |

<Warning>
ایجاد بات‌های چندمستأجری جدید پس از 2025-07-31 منسوخ شد. برای بات‌های جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** و سپس **Create** کلیک کنید (حدود 1-2 دقیقه).

### گام 2: دریافت اطلاعات احراز هویت

1. منبع Azure Bot ← **Configuration** ← **Microsoft App ID** را کپی کنید (`appId` شما).
2. **Manage Password** ← App Registration ← **Certificates & secrets** ← **New client secret** ← **Value** را کپی کنید (`appPassword` شما).
3. **Overview** ← **Directory (tenant) ID** را کپی کنید (`tenantId` شما).

### گام 3: پیکربندی نقطه پایانی پیام‌رسانی

1. Azure Bot ← **Configuration**.
2. **Messaging endpoint** را تنظیم کنید:
   - محیط عملیاتی: `https://your-domain.com/api/messages`
   - توسعه محلی: از یک تونل استفاده کنید (به [توسعه محلی](#local-development-tunneling) مراجعه کنید)

### گام 4: فعال‌کردن کانال Teams

1. Azure Bot ← **Channels**.
2. روی **Microsoft Teams** ← Configure ← Save کلیک کنید.
3. شرایط استفاده از خدمات را بپذیرید.

### گام 5: ساخت مانیفست برنامه Teams

- یک ورودی `bot` شامل `botId = <App ID>` اضافه کنید.
- دامنه‌ها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای مدیریت فایل در دامنه شخصی الزامی است).
- مجوزهای RSC را اضافه کنید (به [مجوزهای RSC](#current-teams-rsc-permissions-manifest) مراجعه کنید).
- آیکون‌ها را ایجاد کنید: `outline.png` (32x32) و `color.png` (192x192).
- `manifest.json`، `outline.png` و `color.png` را با هم فشرده کنید.

### گام 6: پیکربندی OpenClaw

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

متغیرهای محیطی: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

### گام 7: اجرای Gateway

وقتی Plugin در دسترس باشد و پیکربندی `msteams` دارای اطلاعات احراز هویت باشد، کانال Teams به‌طور خودکار راه‌اندازی می‌شود.

</details>

## احراز هویت فدرال (گواهی به‌همراه هویت مدیریت‌شده)

برای محیط عملیاتی، OpenClaw از طریق `channels.msteams.authType: "federated"` از **احراز هویت فدرال** به‌عنوان جایگزین رمزهای کلاینت پشتیبانی می‌کند. دو روش وجود دارد:

### گزینه A: احراز هویت مبتنی بر گواهی

از یک گواهی PEM ثبت‌شده در ثبت برنامه Entra ID خود استفاده کنید.

**راه‌اندازی:**

1. یک گواهی ایجاد یا دریافت کنید (قالب PEM همراه با کلید خصوصی).
2. Entra ID ← App Registration ← **Certificates & secrets** ← **Certificates** ← گواهی عمومی را بارگذاری کنید.

**پیکربندی:**

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

**متغیرهای محیطی:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### گزینه B: هویت مدیریت‌شده Azure

برای احراز هویت بدون رمز عبور در زیرساخت Azure ‏(AKS، App Service، ماشین‌های مجازی Azure) از هویت مدیریت‌شده Azure استفاده کنید.

**نحوه کار:**

1. پاد/ماشین مجازی بات یک هویت مدیریت‌شده دارد (اختصاص‌یافته توسط سیستم یا کاربر).
2. یک اعتبارنامه هویت فدرال، هویت مدیریت‌شده را به ثبت برنامه Entra ID پیوند می‌دهد.
3. هنگام اجرا، OpenClaw برای دریافت توکن‌ها از نقطه پایانی Azure IMDS از `@azure/identity` استفاده می‌کند.
4. توکن برای احراز هویت بات به SDK مربوط به Teams ارسال می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با هویت مدیریت‌شده فعال (هویت بار کاری AKS، App Service، ماشین مجازی).
- اعتبارنامه هویت فدرال‌شده در ثبت برنامه Entra ID ایجاد شده است.
- دسترسی شبکه از پاد/ماشین مجازی به IMDS (`169.254.169.254:80`).

**پیکربندی (هویت مدیریت‌شده اختصاص‌یافته توسط سیستم):**

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

**پیکربندی (هویت مدیریت‌شده اختصاص‌یافته توسط کاربر):** `managedIdentityClientId: "<MI_CLIENT_ID>"` را به بلوک بالا اضافه کنید.

**متغیرهای محیطی:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط اختصاص‌یافته توسط کاربر)

### راه‌اندازی هویت بار کاری AKS

برای استقرارهای AKS که از هویت بار کاری استفاده می‌کنند:

1. **هویت بار کاری را در خوشه AKS خود فعال کنید**.
2. **یک اعتبارنامه هویت فدرال‌شده** در ثبت برنامه Entra ID ایجاد کنید:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **حساب سرویس Kubernetes را** با شناسه کلاینت برنامه حاشیه‌نویسی کنید:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **پاد را** برای تزریق هویت بار کاری برچسب‌گذاری کنید:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **دسترسی شبکه** به IMDS (`169.254.169.254`) را مجاز کنید: اگر از NetworkPolicy استفاده می‌کنید، یک قاعده خروجی برای `169.254.169.254/32` روی درگاه 80 اضافه کنید.

### مقایسه انواع احراز هویت

| روش                       | پیکربندی                                      | مزایا                                      | معایب                                        |
| ------------------------- | --------------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| **رمز کلاینت**            | `appPassword`                            | راه‌اندازی ساده                            | نیازمند چرخش رمز، امنیت کمتر                  |
| **گواهی**                 | `authType: "federated"` + `certificatePath`       | بدون رمز مشترک در شبکه                     | سربار مدیریت گواهی                            |
| **هویت مدیریت‌شده**       | `authType: "federated"` + `useManagedIdentity`       | بدون گذرواژه، بدون نیاز به مدیریت رمزها    | نیازمند زیرساخت Azure                         |

`certificateThumbprint` را می‌توان در کنار `certificatePath` تنظیم کرد، اما در حال حاضر مسیر احراز هویت آن را نمی‌خواند؛ این مقدار فقط برای سازگاری آینده پذیرفته می‌شود.

**پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw از احراز هویت با رمز کلاینت (`appPassword`) استفاده می‌کند. پیکربندی‌های موجود بدون تغییر به کار خود ادامه می‌دهند.

## توسعه محلی (تونل‌سازی)

Teams نمی‌تواند به `localhost` دسترسی پیدا کند. از یک تونل توسعه پایدار استفاده کنید تا نشانی URL میان نشست‌ها ثابت بماند:

```bash
# راه‌اندازی یک‌باره:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# هر نشست توسعه:
devtunnel host my-openclaw-bot
```

گزینه‌های جایگزین: `ngrok http 3978` یا `tailscale funnel 3978` (ممکن است نشانی‌های URL در هر نشست تغییر کنند).

اگر نشانی URL تونل تغییر کرد، نقطه پایانی را به‌روزرسانی کنید:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## آزمایش ربات

**اجرای عیب‌یابی:**

```bash
teams app doctor <teamsAppId>
```

ثبت ربات، برنامه AAD، مانیفست و پیکربندی SSO را در یک مرحله بررسی می‌کند.

**ارسال یک پیام آزمایشی:**

1. برنامه Teams را نصب کنید (پیوند نصب از `teams app get <id> --install-link`).
2. ربات را در Teams پیدا کنید و یک پیام مستقیم بفرستید.
3. گزارش‌های Gateway را برای فعالیت ورودی بررسی کنید.

## متغیرهای محیطی

این کلیدهای پیکربندی مرتبط با احراز هویت را می‌توان به‌جای `openclaw.json` از طریق متغیرهای محیطی تنظیم کرد (سایر کلیدهای پیکربندی، مانند `groupPolicy` یا `historyLimit`، فقط از طریق پیکربندی قابل تنظیم‌اند):

| متغیر محیطی                         | کلید پیکربندی             | یادداشت‌ها                              |
| ----------------------------------- | ------------------------- | --------------------------------------- |
| `MSTEAMS_APP_ID`                  | `appId`         |                                         |
| `MSTEAMS_APP_PASSWORD`                  | `appPassword`         |                                         |
| `MSTEAMS_TENANT_ID`                  | `tenantId`         |                                         |
| `MSTEAMS_AUTH_TYPE`                  | `authType`         | `"secret"` یا `"federated"` |
| `MSTEAMS_CERTIFICATE_PATH`                  | `certificatePath`         | فدرال‌شده + گواهی                       |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                  | `certificateThumbprint`         | پذیرفته می‌شود، برای احراز هویت الزامی نیست |
| `MSTEAMS_USE_MANAGED_IDENTITY`                  | `useManagedIdentity`         | فدرال‌شده + هویت مدیریت‌شده             |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                  | `managedIdentityClientId`         | فقط هویت مدیریت‌شده اختصاص‌یافته توسط کاربر |

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` مبتنی بر Graph برای Microsoft Teams ارائه می‌کند تا عامل‌ها و خودکارسازی‌ها بتوانند جزئیات تأییدشده فهرست اعضای یک مکالمه پیکربندی‌شده را بازیابی کنند.

الزامات:

- مجوزهای RSC مربوط به `ChannelSettings.Read.Group` و `TeamMember.Read.Group` (از قبل در مانیفست پیشنهادی وجود دارند).

هرگاه اعتبارنامه‌های Graph پیکربندی شده باشند، این کنش در دسترس است؛ کلید فعال‌سازی جداگانه‌ای به نام `channels.msteams.actions.memberInfo` وجود ندارد.
جست‌وجوهای کانال استاندارد، هویت منطبق در فهرست اعضای تیم، نام نمایشی، ایمیل و نقش‌ها را برمی‌گردانند.
در پیام مستقیم یا گفت‌وگوی گروهی فعلی، این کنش می‌تواند شناسه کاربری پایدار فرستنده مورد اعتماد را برگرداند.
جست‌وجوی اعضای کانال خصوصی/اشتراکی و گفت‌وگوهایی غیر از گفت‌وگوی فعلی به مجوزهای بیشتری برای فهرست اعضا نیاز دارد
و خط‌مشی پایه مجوزها آن‌ها را رد می‌کند.

## بافت تاریخچه

- `channels.msteams.historyLimit` تعیین می‌کند چند پیام اخیر کانال/گروه در پرامپت قرار گیرند. ابتدا به `messages.groupChat.historyLimit` برمی‌گردد و سپس مقدار پیش‌فرض 50 را استفاده می‌کند. برای غیرفعال‌سازی، `0` را تنظیم کنید.
- تاریخچه واکشی‌شده رشته بر اساس فهرست‌های مجاز فرستندگان (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود؛ بنابراین مقداردهی اولیه بافت رشته فقط پیام‌های فرستندگان مجاز را شامل می‌شود.
- بافت پیوست نقل‌شده (تجزیه‌شده از HTML طرح‌واره Skype Reply در پیوست‌های خود پاسخ) بدون فیلتر عبور داده می‌شود؛ در حال حاضر فقط مقداردهی اولیه تاریخچه رشته، فیلتر فهرست مجاز فرستندگان را اعمال می‌کند.
- تاریخچه پیام مستقیم را می‌توان با `channels.msteams.dmHistoryLimit` (نوبت‌های کاربر) محدود کرد. بازنویسی‌های مختص هر کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

## مجوزهای فعلی RSC در Teams (مانیفست)

این‌ها **مجوزهای resourceSpecific موجود** در مانیفست برنامه Teams ما هستند. این مجوزها فقط درون تیم/گفت‌وگویی اعمال می‌شوند که برنامه در آن نصب شده است.

**برای کانال‌ها (دامنه تیم):**

- `ChannelMessage.Read.Group` (Application) - دریافت همه پیام‌های کانال بدون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**برای گفت‌وگوهای گروهی:**

- `ChatMessage.Read.Chat` (Application) - دریافت همه پیام‌های گفت‌وگوی گروهی بدون @mention

مجوزهای RSC را از طریق CLI مربوط به Teams اضافه کنید:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## نمونه مانیفست Teams (با اطلاعات حذف‌شده)

نمونه‌ای حداقلی و معتبر با فیلدهای الزامی. شناسه‌ها و نشانی‌های URL را جایگزین کنید.

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

### ملاحظات مهم مانیفست (فیلدهای الزامی)

- `bots[].botId` **باید** با شناسه برنامه Azure Bot مطابقت داشته باشد.
- `webApplicationInfo.id` **باید** با شناسه برنامه Azure Bot مطابقت داشته باشد.
- `bots[].scopes` باید سطوحی را که قصد استفاده از آن‌ها را دارید دربرگیرد (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` برای مدیریت فایل در دامنه شخصی الزامی است.
- `authorization.permissions.resourceSpecific` باید مجوز خواندن/ارسال کانال را برای ترافیک کانال دربرگیرد.

### به‌روزرسانی یک برنامه موجود

```bash
# مانیفست را بارگیری، ویرایش و دوباره بارگذاری کنید
teams app manifest download <teamsAppId> manifest.json
# manifest.json را به‌صورت محلی ویرایش کنید...
teams app manifest upload manifest.json <teamsAppId>
# اگر محتوا تغییر کرده باشد، نسخه به‌طور خودکار افزایش می‌یابد
```

پس از به‌روزرسانی، برنامه را در هر تیم دوباره نصب کنید و برای پاک‌شدن فراداده کش‌شده برنامه، **Teams را کاملاً ببندید و دوباره اجرا کنید** (نه اینکه فقط پنجره را ببندید).

<details>
<summary>به‌روزرسانی دستی مانیفست (بدون CLI)</summary>

1. `manifest.json` را با تنظیمات جدید به‌روزرسانی کنید.
2. **فیلد `version` را افزایش دهید** (برای مثال، `1.0.0` → `1.1.0`).
3. مانیفست را همراه با نمادها (`manifest.json`، `outline.png`، `color.png`) **دوباره به‌صورت zip بسته‌بندی کنید**.
4. فایل zip جدید را بارگذاری کنید:
   - **Teams Admin Center:** Teams apps → Manage apps → برنامه خود را پیدا کنید → Upload new version.
   - **بارگذاری جانبی:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## قابلیت‌ها: فقط RSC در برابر Graph

### با **فقط RSC در Teams** (برنامه نصب‌شده، بدون مجوزهای Graph API)

کار می‌کند:

- خواندن محتوای **متنی** پیام کانال.
- ارسال محتوای **متنی** پیام کانال.
- دریافت پیوست‌های فایل **شخصی (پیام مستقیم)**.

کار نمی‌کند:

- محتوای **تصویر یا فایل** کانال/گروه (بار داده فقط شامل یک نگهدارنده HTML است).
- بارگیری پیوست‌های ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام‌ها فراتر از رویداد زنده Webhook.

### با **RSC در Teams + مجوزهای برنامه Microsoft Graph**

موارد زیر را اضافه می‌کند:

- بارگیری محتوای میزبانی‌شده (تصاویر چسبانده‌شده در پیام‌ها).
- بارگیری پیوست‌های فایل ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام‌های کانال/گفت‌وگو از طریق Graph.

### RSC در برابر Graph API

| قابلیت                       | مجوزهای RSC             | Graph API                                     |
| ---------------------------- | ----------------------- | --------------------------------------------- |
| **پیام‌های بلادرنگ**         | بله (از طریق Webhook)   | خیر (فقط نظرسنجی دوره‌ای)                     |
| **پیام‌های تاریخی**          | خیر                     | بله (امکان واکشی تاریخچه)                     |
| **پیچیدگی راه‌اندازی**       | فقط مانیفست برنامه      | نیازمند رضایت مدیر + فرایند توکن              |
| **کارکرد در حالت آفلاین**    | خیر (باید در حال اجرا باشد) | بله (واکشی در هر زمان)                    |

**جمع‌بندی:** RSC برای شنود بلادرنگ است؛ Graph API برای دسترسی تاریخی است. برای دریافت پیام‌های ازدست‌رفته در زمان آفلاین‌بودن، به Graph API همراه با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه + تاریخچه با قابلیت Graph

فقط مجوزهای برنامه Microsoft Graph موردنیاز برای دامنه‌ها و داده‌های Teams مورداستفاده را فعال کنید:

1. Entra ID (Azure AD) **App Registration** → مجوزهای **Application permissions** در Graph را اضافه کنید:
   - `ChannelMessage.Read.All` برای پیوست‌های کانال و تاریخچه کانال.
   - `Chat.Read.All` برای پیوست‌های گفت‌وگوی گروهی و تاریخچه گفت‌وگوی گروهی.
   - `Files.Read.All` زمانی که بایت‌های پیوست باید از فضای ذخیره‌سازی SharePoint/OneDrive دانلود شوند؛ راه‌اندازی‌های صرفاً مبتنی بر تاریخچه به آن نیاز ندارند.
2. برای مستأجر، **Grant admin consent** را انجام دهید.
3. **manifest version** برنامه Teams را افزایش دهید، دوباره بارگذاری کنید و **برنامه را در Teams دوباره نصب کنید**.
4. برای پاک‌شدن فراداده کش‌شده برنامه، **Teams را کاملاً ببندید و دوباره اجرا کنید**.

### بازیابی فایل کانال/گروه (`graphMediaFallback`)

Teams می‌تواند نشانگرهای فایل را از فعالیت HTML ارسال‌شده به ربات حذف کند. در این حالت، فعالیت Bot Framework از یک پیام HTML عادی قابل‌تشخیص نیست؛ ارجاع کامل پیوست فقط در نسخه Graph پیام وجود دارد.

پس از اعطای مجوزهای بالا، مسیر جایگزین را فعال کنید:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

این فقط برای کانال‌ها و گفت‌وگوهای گروهی اعمال می‌شود. هرگاه یک فعالیت HTML هیچ رسانه قابل‌دانلود مستقیمی تولید نکند، از جمله پیام‌های عادی یا پیام‌هایی که فقط شامل اشاره هستند، یک واکشی پیام Graph اضافه می‌کند. مقدار پیش‌فرض `false` است تا نصب‌های موجود به‌طور خودکار با ترافیک اضافی Graph یا خطاهای مجوز مواجه نشوند.

**اشاره به کاربران:** ‎@mention برای کاربرانی که از قبل در گفت‌وگو حضور دارند، بدون تنظیمات اضافی کار می‌کند. برای جست‌وجو و اشاره پویای کاربرانی که **در گفت‌وگوی فعلی نیستند**، مجوز `User.Read.All` (Application) را اضافه و رضایت مدیر را اعطا کنید.

## محدودیت‌های شناخته‌شده

### مهلت‌های زمانی Webhook

Teams پیام‌ها را از طریق Webhook مبتنی بر HTTP تحویل می‌دهد. OpenClaw مهلت‌های زمانی ثابت سرور HTTP را روی شنونده آن Webhook اعمال می‌کند: 30s برای عدم فعالیت، 30s برای کل درخواست و 15s برای دریافت سرآیندها. رسانه ورودی اختیاری و غنی‌سازی زمینه، بودجه مشترک 10 ثانیه‌ای دارند، اما SDK مربوط به Teams همچنان پیش از بازگرداندن پاسخ Webhook منتظر نوبت عامل می‌ماند. اگر کل نوبت از بازه تلاش مجدد Teams فراتر رود، ممکن است موارد زیر را ببینید:

- تلاش مجدد Teams برای پیام (که باعث ایجاد موارد تکراری می‌شود).
- پاسخ‌های حذف‌شده.

پس از پاسخ عامل، پاسخ‌ها به‌صورت پیش‌دستانه ارسال می‌شوند؛ اما اجرای کند عامل همچنان می‌تواند در سمت Teams باعث تلاش‌های مجدد یا موارد تکراری شود.

### پشتیبانی از ابر Teams و URL سرویس

این مسیر Teams مبتنی بر SDK برای ابر عمومی Microsoft Teams به‌صورت زنده اعتبارسنجی شده است.

پاسخ‌های ورودی از زمینه نوبت SDK مربوط به Teams در پیام ورودی استفاده می‌کنند. عملیات پیش‌دستانه خارج از زمینه — ارسال، ویرایش، حذف، کارت‌ها، نظرسنجی‌ها، پیام‌های رضایت فایل و پاسخ‌های طولانی‌مدت صف‌شده — از ارجاع ذخیره‌شده گفت‌وگو، یعنی `serviceUrl`، استفاده می‌کنند. ابر عمومی به‌طور پیش‌فرض از محیط ابر عمومی SDK مربوط به Teams استفاده می‌کند و ارجاع‌های ذخیره‌شده را روی میزبان عمومی Teams Connector مجاز می‌داند: `https://smba.trafficmanager.net/`.

ابر عمومی حالت پیش‌فرض است. برای ربات‌های عادی ابر عمومی، نیازی به تنظیم `channels.msteams.cloud` یا `channels.msteams.serviceUrl` نیست.

برای ابرهای غیرعمومی Teams، مقدار `cloud` و مرز پیش‌دستانه متناظر را، زمانی که Microsoft آن را منتشر می‌کند، تنظیم کنید:

- `channels.msteams.cloud` پیش‌تنظیم ابر SDK مربوط به Teams را برای احراز هویت، اعتبارسنجی JWT، سرویس‌های توکن و دامنه Graph انتخاب می‌کند.
- `channels.msteams.serviceUrl` مرز نقطه پایانی Bot Connector را انتخاب می‌کند که برای اعتبارسنجی ارجاع‌های ذخیره‌شده گفت‌وگو پیش از اجرای ارسال‌ها، ویرایش‌ها، حذف‌ها، کارت‌ها، نظرسنجی‌ها، پیام‌های رضایت فایل و پاسخ‌های طولانی‌مدت صف‌شده به‌صورت پیش‌دستانه استفاده می‌شود. این تنظیم برای ابرهای SDK مربوط به USGov و DoD الزامی است. برای China/21Vianet، OpenClaw از پیش‌تنظیم `China` در SDK استفاده می‌کند و URLهای سرویس ذخیره‌شده/پیکربندی‌شده را فقط روی میزبان‌های کانال Azure China Bot Framework می‌پذیرد.

Microsoft نقاط پایانی سراسری و پیش‌دستانه Bot Connector را در بخش [ایجاد گفت‌وگو](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) از مستندات پیام‌رسانی پیش‌دستانه Teams منتشر می‌کند. در صورت وجود، از `serviceUrl` فعالیت ورودی استفاده کنید؛ در غیر این صورت، از جدول Microsoft در زیر استفاده کنید.

| محیط Teams       | پیکربندی OpenClaw                                                  | `serviceUrl` پیش‌دستانه                             |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| عمومی            | نیازی به پیکربندی cloud/serviceUrl نیست                            | `https://smba.trafficmanager.net/teams`                                        |
| GCC              | `serviceUrl` را تنظیم کنید؛ هیچ پیش‌تنظیم ابری جداگانه‌ای در SDK مربوط به Teams وجود ندارد | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High         | `cloud: "USGov"` + `serviceUrl`                            | `https://smba.infra.gov.teams.microsoft.us/teams`                                        |
| DoD              | `cloud: "USGovDoD"` + `serviceUrl`                            | `https://smba.infra.dod.teams.microsoft.us/teams`                                        |
| China/21Vianet   | `cloud: "China"`                                                  | از `serviceUrl` فعالیت ورودی استفاده کنید           |

نمونه برای GCC که در آن Microsoft یک URL سرویس پیش‌دستانه جداگانه مستند کرده است، اما SDK مربوط به Teams هیچ پیش‌تنظیم ابری جداگانه‌ای برای GCC ارائه نمی‌کند:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

نمونه برای GCC High:

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

`channels.msteams.serviceUrl` به میزبان‌های پشتیبانی‌شده Microsoft Teams Bot Connector محدود است. هنگامی که یک URL سرویس پیکربندی شده باشد، OpenClaw پیش از اجرای ارسال‌ها، ویرایش‌ها، حذف‌ها، کارت‌ها، نظرسنجی‌ها یا پاسخ‌های طولانی‌مدت صف‌شده به‌صورت پیش‌دستانه، بررسی می‌کند که `serviceUrl` گفت‌وگوی ذخیره‌شده از همان میزبان استفاده کند. با پیکربندی پیش‌فرض ابر عمومی، اگر یک گفت‌وگوی ذخیره‌شده به خارج از میزبان عمومی Teams Connector اشاره کند، OpenClaw به‌صورت بسته و ایمن شکست می‌خورد. پس از تغییر تنظیمات ابر/URL سرویس، یک پیام تازه از گفت‌وگو دریافت کنید تا ارجاع ذخیره‌شده گفت‌وگو به‌روز باشد.

China/21Vianet در جدول نقاط پایانی پیش‌دستانه Teams متعلق به Microsoft هیچ URL سراسری و پیش‌دستانه جداگانه‌ای برای `smba` ندارد. `cloud: "China"` را پیکربندی کنید تا SDK مربوط به Teams از نقاط پایانی احراز هویت، توکن و JWT متعلق به Azure China استفاده کند. سپس ارسال‌های پیش‌دستانه به یک ارجاع ذخیره‌شده گفت‌وگو از یک فعالیت ورودی China Teams، یا یک URL سرویس صریحاً پیکربندی‌شده، روی مرز کانال Azure China Bot Framework (`*.botframework.azure.cn`) نیاز دارند. ابزارهای کمکی Teams مبتنی بر Graph برای `cloud: "China"` غیرفعال هستند تا زمانی که OpenClaw درخواست‌های Graph را از طریق نقطه پایانی Azure China Graph مسیریابی کند.

### قالب‌بندی

Markdown در Teams نسبت به Slack یا Discord محدودتر است:

- قالب‌بندی پایه کار می‌کند: **پررنگ**، _مورب_، `code`، پیوندها.
- Markdown پیچیده (جدول‌ها، فهرست‌های تودرتو) ممکن است به‌درستی رندر نشود.
- Adaptive Cards برای نظرسنجی‌ها و ارسال‌های ارائه معنایی پشتیبانی می‌شوند (پایین را ببینید).

## پیکربندی

تنظیمات کلیدی (برای الگوهای مشترک کانال، [/gateway/configuration](/fa/gateway/configuration) را ببینید):

- `channels.msteams.enabled`: کانال را فعال/غیرفعال می‌کند.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اطلاعات اعتبارسنجی ربات.
- `channels.msteams.cloud`: محیط ابری SDK مربوط به Teams ‏(`Public`، `USGov`، `USGovDoD` یا `China`؛ پیش‌فرض `Public`). برای ابرهای SDK مربوط به USGov/DoD آن را با `serviceUrl` تنظیم کنید؛ چین از پیش‌تنظیم SDK و ارجاعات مکالمه ذخیره‌شده Azure China Bot Framework استفاده می‌کند و تا زمان عرضه مسیریابی Azure China Graph، ابزارهای کمکی متکی بر Graph غیرفعال هستند.
- `channels.msteams.serviceUrl`: مرز URL سرویس Bot Connector برای عملیات پیش‌دستانه SDK. ابر عمومی از پیش‌فرض SDK استفاده می‌کند؛ برای GCC ‏(`https://smba.infra.gcc.teams.microsoft.com/teams`)، GCC High یا DoD آن را تنظیم کنید. هنگامی‌که ارجاع مکالمه ذخیره‌شده از Teams تحت مدیریت 21Vianet آمده باشد، چین میزبان‌های کانال Azure China Bot Framework را می‌پذیرد.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`).
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض `pairing`).
- `channels.msteams.allowFrom`: فهرست مجاز پیام‌های مستقیم (شناسه‌های شیء AAD توصیه می‌شوند). در صورت دسترسی به Graph، راه‌انداز هنگام تنظیم نام‌ها را به شناسه تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: کلید اضطراری برای فعال‌سازی دوباره تطبیق UPN/نام نمایشی تغییرپذیر و مسیریابی مستقیم بر اساس نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازه قطعه‌های متن خروجی برحسب نویسه (پیش‌فرض `4000`، و صرف‌نظر از مقدار پیکربندی‌شده بالاتر، با سقف سخت `4000`).
- `channels.msteams.streaming.chunkMode`: ‏`length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خطوط خالی (مرز پاراگراف‌ها) پیش از قطعه‌بندی بر اساس طول.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز میزبان‌های پیوست ورودی (به‌طور پیش‌فرض دامنه‌های Microsoft/Teams: ‏Graph، ‏SharePoint/OneDrive، ‏Teams CDN، ‏Bot Framework و Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای پیوست‌کردن سرآیندهای Authorization هنگام تلاش مجدد برای رسانه (به‌طور پیش‌فرض میزبان‌های Graph و Bot Framework).
- `channels.msteams.graphMediaFallback`: استفاده اختیاری از جست‌وجوی پیام‌های Graph هنگامی‌که HTML کانال/گروه فاقد نشانگر فایل است (پیش‌فرض `false`؛ به [بازیابی فایل کانال/گروه](#channelgroup-file-recovery-graphmediafallback) مراجعه کنید).
- `channels.msteams.mediaMaxMb`: بازنویسی محدودیت اندازه رسانه برای هر کانال برحسب MB. در صورت تنظیم‌نبودن، به `agents.defaults.mediaMaxMb` برمی‌گردد.
- `channels.msteams.requireMention`: الزام @mention در کانال‌ها/گروه‌ها (پیش‌فرض `true`).
- `channels.msteams.replyStyle`: ‏`thread | top-level` (به [سبک پاسخ](#reply-style-threads-vs-posts) مراجعه کنید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض خط‌مشی ابزار برای هر تیم (`allow`/`deny`/`alsoAllow`) که در صورت نبود بازنویسی کانال استفاده می‌شوند.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض خط‌مشی ابزار برای هر تیم و هر فرستنده (نویسه عام `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های خط‌مشی ابزار برای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های خط‌مشی ابزار برای هر کانال و هر فرستنده (نویسه عام `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند: `channel:`، `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمیِ بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.authType`: نوع احراز هویت — `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (احراز هویت فدرال + گواهی).
- `channels.msteams.certificateThumbprint`: اثر انگشت گواهی؛ پذیرفته می‌شود، اما برای احراز هویت الزامی نیست.
- `channels.msteams.useManagedIdentity`: فعال‌سازی احراز هویت با هویت مدیریت‌شده (حالت فدرال).
- `channels.msteams.managedIdentityClientId`: شناسه کلاینت برای هویت مدیریت‌شده تخصیص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسه سایت SharePoint برای بارگذاری فایل در گفت‌وگوهای گروهی/کانال‌ها (به [ارسال فایل در گفت‌وگوهای گروهی](#sending-files-in-group-chats) مراجعه کنید).
- `channels.msteams.welcomeCard`، `channels.msteams.groupWelcomeCard`، `channels.msteams.promptStarters`: Adaptive Card خوشامدگویی که در نخستین تماس پیام مستقیم/گروهی نمایش داده می‌شود و دکمه‌های درخواست پیشنهادی آن.
- `channels.msteams.responsePrefix`: متنی که به ابتدای پاسخ‌های خروجی افزوده می‌شود.
- `channels.msteams.feedbackEnabled` (پیش‌فرض `true`)، `channels.msteams.feedbackReflection` (پیش‌فرض `true`)، `channels.msteams.feedbackReflectionCooldownMs`: بازخورد پسندیدن/نپسندیدن درباره پاسخ‌ها و پیگیری تأمل درباره بازخورد منفی.
- `channels.msteams.sso`، `channels.msteams.delegatedAuth`: اتصال OAuth مربوط به Bot Framework و دامنه‌های تفویض‌شده Graph برای جریان‌های متکی بر SSO؛ `sso.enabled: true` به `sso.connectionName` نیاز دارد.

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد عامل پیروی می‌کنند (به [/concepts/session](/fa/concepts/session) مراجعه کنید):
  - پیام‌های مستقیم نشست اصلی را به‌اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسه مکالمه استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams برای یک مدل داده زیربنایی یکسان، دو سبک رابط کاربری کانال دارد:

| سبک                     | توضیح                                                     | `replyStyle` توصیه‌شده |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **پست‌ها** (کلاسیک)      | پیام‌ها به‌صورت کارت‌هایی با پاسخ‌های رشته‌ای در زیر آن‌ها نمایش داده می‌شوند | `thread` (پیش‌فرض)       |
| **رشته‌ها** (شبیه Slack) | پیام‌ها به‌شکل خطی و بیشتر شبیه Slack جریان می‌یابند      | `top-level`              |

**مشکل:** API مربوط به Teams مشخص نمی‌کند که یک کانال از کدام سبک رابط کاربری استفاده می‌کند. اگر `replyStyle` نادرست را به‌کار ببرید:

- `thread` در کانالی با سبک رشته‌ای ← پاسخ‌ها به‌شکل نامناسبی تودرتو ظاهر می‌شوند.
- `top-level` در کانالی با سبک پستی ← پاسخ‌ها به‌جای قرارگرفتن در رشته، به‌صورت پست‌های سطح‌بالای جداگانه ظاهر می‌شوند.

**راه‌حل:** بر اساس نحوه تنظیم کانال، `replyStyle` را برای هر کانال پیکربندی کنید:

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

### تقدم در تعیین مقدار

هنگامی‌که ربات پاسخی را به یک کانال می‌فرستد، `replyStyle` از اختصاصی‌ترین بازنویسی تا مقدار پیش‌فرض تعیین می‌شود. نخستین مقدار غیر `undefined` برنده است:

1. **برای هر کانال** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **برای هر تیم** — `channels.msteams.teams.<teamId>.replyStyle`
3. **سراسری** — `channels.msteams.replyStyle`
4. **پیش‌فرض ضمنی** — برگرفته از `requireMention`:
   - `requireMention: true` ← `thread`
   - `requireMention: false` ← `top-level`

اگر `requireMention: false` را بدون `replyStyle` صریح به‌صورت سراسری تنظیم کنید، اشاره‌ها در کانال‌های دارای سبک پستی به‌شکل پست‌های سطح‌بالا ظاهر می‌شوند، حتی اگر ورودی پاسخی درون یک رشته بوده باشد. برای جلوگیری از رفتارهای غیرمنتظره، `replyStyle: "thread"` را در سطح سراسری، تیم یا کانال ثابت کنید.

برای ارسال‌های پیش‌دستانه به یک مکالمه کانال ذخیره‌شده (پاسخ‌های فراخوانی ابزار در صف، عامل‌های طولانی‌مدت)، همان تعیین مقدار تیم/کانال اعمال می‌شود؛ گفت‌وگوهای گروهی و مکالمات شخصی (پیام مستقیم)، صرف‌نظر از `replyStyle`، برای ارسال‌های پیش‌دستانه همیشه به `top-level` تعیین می‌شوند.

### حفظ زمینه رشته

هنگامی‌که `replyStyle: "thread"` برقرار است و ربات از درون یک رشته کانال @mention شده است، OpenClaw ریشه اصلی رشته را دوباره به ارجاع مکالمه خروجی (`19:...@thread.tacv2;messageid=<root>`) پیوست می‌کند تا پاسخ در همان رشته قرار گیرد. این رفتار هم برای ارسال‌های زنده (درون همان نوبت) و هم برای ارسال‌های پیش‌دستانه پس از انقضای زمینه نوبت Bot Framework برقرار است (برای نمونه، عامل‌های طولانی‌مدت و پاسخ‌های فراخوانی ابزار در صف از طریق `mcp__openclaw__message`).

ریشه رشته از `threadId` ذخیره‌شده در ارجاع مکالمه گرفته می‌شود. ارجاعات ذخیره‌شده قدیمی‌تر که پیش از `threadId` ایجاد شده‌اند، به `activityId` برمی‌گردند (هر فعالیت ورودی که آخرین‌بار مکالمه را مقداردهی اولیه کرده است)؛ بنابراین استقرارهای موجود بدون مقداردهی اولیه مجدد به کار ادامه می‌دهند.

هنگامی‌که `replyStyle: "top-level"` برقرار است، به ورودی‌های رشته کانال عمداً به‌صورت پست‌های سطح‌بالای جدید پاسخ داده می‌شود؛ هیچ پسوند رشته‌ای پیوست نمی‌شود. این رفتار برای کانال‌های دارای سبک رشته‌ای درست است؛ ظاهرشدن پست‌های سطح‌بالا در جایی که انتظار پاسخ‌های رشته‌ای داشتید، یعنی `replyStyle` برای آن کانال نادرست تنظیم شده است.

## پیوست‌ها و تصاویر

**محدودیت‌های فعلی:**

- **پیام‌های مستقیم:** تصاویر و پیوست‌های فایل از طریق APIهای فایل ربات Teams کار می‌کنند.
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 ‏(SharePoint/OneDrive) قرار دارند. بار داده Webhook فقط شامل یک بخش HTML است، نه بایت‌های واقعی فایل. **برای بارگیری پیوست‌های کانال، مجوزهای Graph API الزامی هستند**.
- برای ارسال‌های صریحی که ابتدا فایل را می‌فرستند، از `action=upload-file` همراه با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود و `filename` (یا `title`) نام بارگذاری‌شده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانال دارای تصویر فقط به‌صورت متن دریافت می‌شوند (محتوای تصویر برای ربات قابل دسترسی نیست).
OpenClaw به‌طور پیش‌فرض رسانه را فقط از نام‌های میزبان Microsoft/Teams بارگیری می‌کند. آن را با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای مجازکردن هر میزبانی از `["*"]` استفاده کنید).
سرآیندهای Authorization فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` پیوست می‌شوند (به‌طور پیش‌فرض میزبان‌های Graph و Bot Framework). این فهرست را محدود نگه دارید (از پسوندهای چندمستاجری اجتناب کنید).

## ارسال فایل در گفت‌وگوهای گروهی

ربات‌ها می‌توانند با استفاده از جریان داخلی FileConsentCard فایل‌ها را در پیام‌های مستقیم ارسال کنند. **ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها** به تنظیمات بیشتری نیاز دارد:

| زمینه                    | نحوه ارسال فایل‌ها                           | تنظیمات موردنیاز                                  |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **پیام‌های مستقیم**      | FileConsentCard ← کاربر می‌پذیرد ← ربات بارگذاری می‌کند | بدون نیاز به تنظیمات اضافی کار می‌کند            |
| **گفت‌وگوهای گروهی/کانال‌ها** | بارگذاری در SharePoint ← کارت فایل بومی      | به `sharePointSiteId` و مجوزهای Graph نیاز دارد |
| **تصاویر (هر زمینه‌ای)** | درون‌خطی با کدگذاری Base64                   | بدون نیاز به تنظیمات اضافی کار می‌کند            |

### چرا گفت‌وگوهای گروهی به SharePoint نیاز دارند

ربات‌ها از هویت برنامه استفاده می‌کنند، درحالی‌که منبع `/me` در Microsoft Graph [به کاربر واردشده نیاز دارد](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). برای ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها، ربات فایل را در یک **سایت SharePoint** بارگذاری و یک پیوند اشتراک‌گذاری ایجاد می‌کند.

### تنظیم

1. **افزودن مجوزهای Graph API** در Entra ID (Azure AD) ← App Registration:
   - `Sites.ReadWrite.All` (برنامه) — بارگذاری فایل‌ها در SharePoint.
   - `ChatMember.Read.All` (برنامه) — مجوز کمینه برای سراسر مستأجر جهت ارسال فایل در گفت‌وگوی گروهی. `Chat.Read.All` نیز کار می‌کند و هنگامی‌که تاریخچه گفت‌وگوی گروهی فعال باشد، از پیش این مورد را پوشش می‌دهد. به‌عنوان جایگزینی برای هر گفت‌وگو، از [مجوز رضایت مختص منبع](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat` استفاده کنید.
2. **اعطای رضایت مدیر** برای مستأجر.
3. **دریافت شناسه سایت SharePoint:**

   ```bash
   # از طریق Graph Explorer یا curl با یک توکن معتبر:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # مثال: برای سایتی در "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # پاسخ شامل این مورد است: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **پیکربندی OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... سایر تنظیمات ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### رفتار اشتراک‌گذاری

| زمینه و مجوز                                                  | رفتار اشتراک‌گذاری                                          |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| کانال + `Sites.ReadWrite.All`                                         | پیوند اشتراک‌گذاری در سطح سازمان (همه افراد سازمان می‌توانند دسترسی داشته باشند) |
| گفت‌وگوی گروهی + `Sites.ReadWrite.All` + مجوز خواندن پشتیبانی‌شده برای اعضای گفت‌وگو | پیوند اشتراک‌گذاری اختصاصی هر کاربر (فقط اعضای گفت‌وگو می‌توانند دسترسی داشته باشند)      |
| گفت‌وگوی گروهی بدون مجوز خواندن پشتیبانی‌شده برای اعضای گفت‌وگو                   | ارسال به‌صورت بسته و ایمن ناموفق می‌شود                                         |

اشتراک‌گذاری اختصاصی هر کاربر امن‌تر است، زیرا فقط شرکت‌کنندگان گفت‌وگو می‌توانند به فایل دسترسی داشته باشند. OpenClaw برای گفت‌وگوهای گروهی به جست‌وجوی موفق اعضا نیاز دارد؛ اتمام مهلت، خطاهای انتقال، نتایج خالی و رد درخواست توسط Graph API باعث شکست ارسال می‌شوند، نه گسترش دسترسی به کل سازمان.

### رفتار جایگزین

| سناریو                                                         | نتیجه                                           |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| گفت‌وگوی گروهی + فایل + پیکربندی مجوزهای SharePoint و اعضا | بارگذاری در SharePoint و ارسال کارت بومی فایل    |
| گفت‌وگوی گروهی + فایل + نبود مجوزهای SharePoint یا اعضا     | شکست با خطای پیکربندی قابل‌اقدام      |
| کانال + فایل + پیکربندی `sharePointSiteId`                   | بارگذاری در SharePoint و ارسال کارت بومی فایل    |
| گفت‌وگوی شخصی + فایل                                             | جریان FileConsentCard (بدون SharePoint کار می‌کند)  |
| هر زمینه‌ای + تصویر                                              | درون‌خطی با کدگذاری Base64 (بدون SharePoint کار می‌کند) |

### محل ذخیره فایل‌ها

فایل‌های بارگذاری‌شده در پوشه‌ای با نام `/OpenClawShared/` در کتابخانه اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (کارت‌های تطبیقی)

OpenClaw نظرسنجی‌های Teams را به‌صورت کارت‌های تطبیقی ارسال می‌کند (Teams هیچ API بومی برای نظرسنجی ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- رأی‌ها توسط Gateway در SQLite وضعیت Plugin متعلق به OpenClaw و زیر `state/openclaw.sqlite` ثبت می‌شوند.
- فایل‌های موجود `msteams-polls.json` توسط `openclaw doctor --fix` وارد می‌شوند، نه توسط Plugin در حال اجرا.
- برای ثبت رأی‌ها، Gateway باید آنلاین بماند.
- نظرسنجی‌ها خلاصه نتایج را به‌طور خودکار منتشر نمی‌کنند و هنوز CLI برای نتایج نظرسنجی وجود ندارد.

## کارت‌های ارائه

با استفاده از ابزار `message`، CLI یا تحویل عادی پاسخ، محموله‌های ارائه معنایی را برای کاربران یا مکالمات Teams ارسال کنید. OpenClaw آن‌ها را براساس قرارداد عمومی ارائه، به‌صورت کارت‌های تطبیقی Teams رندر می‌کند.

پارامتر `presentation` بلوک‌های معنایی را می‌پذیرد. وقتی `presentation` ارائه شود، متن پیام اختیاری است. دکمه‌ها به‌صورت اقدام‌های ارسال یا URL کارت تطبیقی رندر می‌شوند. منوهای انتخاب در رندرکننده Teams بومی نیستند، بنابراین OpenClaw پیش از تحویل، آن‌ها را به متن خوانا تبدیل می‌کند.

**ابزار عامل:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "سلام",
    blocks: [{ type: "text", text: "سلام!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"سلام","blocks":[{"type":"text","text":"سلام!"}]}'
```

برای جزئیات قالب مقصد، بخش [قالب‌های مقصد](#target-formats) را در ادامه ببینید.

## قالب‌های مقصد

مقصدهای MSTeams برای تمایز میان کاربران و مکالمات از پیشوند استفاده می‌کنند:

| نوع مقصد         | قالب                           | مثال                                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| کاربر (براساس شناسه)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| کاربر (براساس نام)      | `user:<display-name>`            | `user:John Smith` (به Graph API نیاز دارد)                                                                 |
| گروه/کانال       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| گروه/کانال (خام) | `<conversation-id>`              | `19:abc123...@thread.tacv2`، `19:...@unq.gbl.spaces`، یا شناسه بدون پیشوند `a:`/`8:orgid:`/`29:` در Bot Framework |

**نمونه‌های CLI:**

```bash
# ارسال به کاربر براساس شناسه
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "سلام"

# ارسال به کاربر براساس نام نمایشی (جست‌وجوی Graph API را فعال می‌کند)
openclaw message send --channel msteams --target "user:John Smith" --message "سلام"

# ارسال به گفت‌وگوی گروهی یا کانال
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "سلام"

# ارسال کارت ارائه به یک مکالمه
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"سلام","blocks":[{"type":"text","text":"سلام"}]}'
```

**نمونه‌های ابزار عامل:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "سلام!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "سلام",
    blocks: [{ type: "text", text: "سلام" }],
  },
}
```

<Note>
بدون پیشوند `user:`، نام‌ها به‌طور پیش‌فرض به‌عنوان گروه یا تیم تفکیک می‌شوند. هنگام هدف‌گیری افراد براساس نام نمایشی، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **پس از** تعامل کاربر ممکن هستند، زیرا OpenClaw در آن زمان ارجاعات مکالمه را ذخیره می‌کند.
- برای `dmPolicy` و کنترل فهرست مجاز، به [/gateway/configuration](/fa/gateway/configuration) مراجعه کنید.

## شناسه‌های تیم و کانال (اشتباه رایج)

پارامتر پرس‌وجوی `groupId` در URLهای Teams، شناسه تیم مورداستفاده برای پیکربندی **نیست**. در عوض، شناسه‌ها را از مسیر URL استخراج کنید:

**URL تیم:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    شناسه مکالمه تیم (این مقدار را از حالت کدگذاری URL خارج کنید)
```

**URL کانال:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      شناسه کانال (این مقدار را از حالت کدگذاری URL خارج کنید)
```

**برای پیکربندی:**

- کلید تیم = قطعه مسیر پس از `/team/` (رمزگشایی‌شده از URL، برای مثال `19:Bk4j...@thread.tacv2`؛ مستأجرهای قدیمی‌تر ممکن است `@thread.skype` را نشان دهند که آن نیز معتبر است).
- کلید کانال = قطعه مسیر پس از `/channel/` (رمزگشایی‌شده از URL).
- پارامتر پرس‌وجوی `groupId` را برای مسیریابی OpenClaw **نادیده بگیرید**. این پارامتر شناسه گروه Microsoft Entra است، نه شناسه مکالمه Bot Framework که در فعالیت‌های ورودی Teams استفاده می‌شود.

## کانال‌های خصوصی

ربات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت                      | کانال‌های استاندارد | کانال‌های خصوصی       |
| ---------------------------- | ----------------- | ---------------------- |
| نصب ربات             | بله               | محدود                |
| پیام‌های بلادرنگ (Webhook) | بله               | ممکن است کار نکند           |
| مجوزهای RSC              | بله               | ممکن است رفتار متفاوتی داشته باشد |
| @اشاره‌ها                    | بله               | اگر ربات قابل‌دسترسی باشد   |
| تاریخچه Graph API            | بله               | بله (با مجوزها) |

**راهکارهای جایگزین در صورت کار نکردن کانال‌های خصوصی:**

1. برای تعامل با ربات از کانال‌های استاندارد استفاده کنید.
2. از پیام‌های مستقیم استفاده کنید؛ کاربران همیشه می‌توانند مستقیماً به ربات پیام دهند.
3. برای دسترسی به تاریخچه از Graph API استفاده کنید (به `ChannelMessage.Read.All` نیاز دارد).

## عیب‌یابی

### مشکلات رایج

- **تصاویر در کانال‌ها نمایش داده نمی‌شوند:** مجوزهای Graph یا رضایت مدیر وجود ندارد. برنامه Teams را دوباره نصب کنید و Teams را کاملاً ببندید و دوباره باز کنید.
- **در کانال پاسخی دریافت نمی‌شود:** اشاره‌ها به‌طور پیش‌فرض الزامی هستند؛ `channels.msteams.requireMention=false` را تنظیم کنید یا آن را برای هر تیم/کانال پیکربندی کنید.
- **ناهماهنگی نسخه (Teams همچنان مانیفست قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و برای تازه‌سازی، Teams را کاملاً ببندید.
- **خطای 401 Unauthorized از Webhook:** هنگام آزمایش دستی بدون Azure JWT قابل‌انتظار است؛ یعنی نقطه پایانی قابل‌دسترسی است، اما احراز هویت ناموفق بوده است. برای آزمایش صحیح از Azure Web Chat استفاده کنید.

### خطاهای بارگذاری مانیفست

- **"Icon file cannot be empty":** مانیفست به فایل‌های نمادی ارجاع می‌دهد که اندازه آن‌ها 0 بایت است. نمادهای PNG معتبر ایجاد کنید (32x32 برای `outline.png`، 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه همچنان در تیم/گفت‌وگوی دیگری نصب است. ابتدا آن را پیدا و حذف نصب کنید یا برای انتشار تغییرات 5-10 دقیقه صبر کنید.
- **نمایش "Something went wrong" هنگام بارگذاری:** در عوض از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بارگذاری کنید، DevTools مرورگر را باز کنید (F12) → زبانه Network و برای مشاهده خطای واقعی، بدنه پاسخ را بررسی کنید.
- **بارگذاری جانبی ناموفق است:** به‌جای "Upload a custom app"، گزینه "Upload an app to your org's app catalog" را امتحان کنید؛ این کار اغلب محدودیت‌های بارگذاری جانبی را دور می‌زند.

### مجوزهای RSC کار نمی‌کنند

1. بررسی کنید که `webApplicationInfo.id` دقیقاً با App ID ربات شما مطابقت داشته باشد.
2. برنامه را دوباره بارگذاری و در تیم/گفت‌وگو مجدداً نصب کنید.
3. بررسی کنید که آیا مدیر سازمان مجوزهای RSC را مسدود کرده است.
4. تأیید کنید که از دامنه صحیح استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای گفت‌وگوهای گروهی.

## منابع

- [ایجاد Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [پورتال توسعه‌دهندگان Teams](https://dev.teams.microsoft.com/apps) - ایجاد/مدیریت برنامه‌های Teams
- [طرح‌واره مانیفست برنامه Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل ربات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI مربوط به Teams برای مدیریت ربات

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و فرایند جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و محدودسازی بر اساس اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
