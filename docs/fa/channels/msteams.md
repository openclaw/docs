---
read_when:
    - کار روی قابلیت‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-07T13:13:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fa2aff4d957a59f694cf37d9a4e5ad6b7ee18004d84cbaf8d7ac1aa16860090
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: متن و پیوست‌های DM پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (به [ارسال فایل‌ها در گفت‌وگوهای گروهی](#sending-files-in-group-chats) مراجعه کنید). نظرسنجی‌ها از طریق Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌هایی که فایل در اولویت است ارائه می‌کنند.

## Plugin همراه

Microsoft Teams در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود، بنابراین در ساخت بسته‌بندی‌شده معمول، نصب جداگانه لازم نیست.

اگر از یک ساخت قدیمی‌تر یا نصب سفارشی‌ای استفاده می‌کنید که Teams همراه را حذف کرده است، بسته npm را مستقیم نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

از بسته بدون نسخه برای دنبال‌کردن برچسب انتشار رسمی فعلی استفاده کنید. فقط زمانی نسخه دقیق را pin کنید که به نصب بازتولیدپذیر نیاز دارید.

checkout محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت bot، ایجاد manifest و تولید اعتبارنامه را در یک فرمان انجام می‌دهد.

**۱. نصب کنید و وارد شوید**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI در حال حاضر در مرحله preview است. فرمان‌ها و flagها ممکن است بین نسخه‌ها تغییر کنند.
</Note>

**۲. یک تونل راه‌اندازی کنید** (Teams نمی‌تواند به localhost دسترسی پیدا کند)

اگر هنوز devtunnel CLI را نصب و احراز هویت نکرده‌اید، این کار را انجام دهید ([راهنمای شروع](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` لازم است چون Teams نمی‌تواند با devtunnels احراز هویت کند. هر درخواست bot ورودی همچنان به‌صورت خودکار توسط Teams SDK اعتبارسنجی می‌شود.
</Note>

گزینه‌های جایگزین: `ngrok http 3978` یا `tailscale funnel 3978` (اما ممکن است این‌ها در هر نشست URL را تغییر دهند).

**۳. برنامه را ایجاد کنید**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این فرمان واحد:

- یک برنامه Entra ID (Azure AD) ایجاد می‌کند
- یک client secret تولید می‌کند
- یک manifest برنامه Teams می‌سازد و بارگذاری می‌کند (همراه با آیکن‌ها)
- bot را ثبت می‌کند (به‌صورت پیش‌فرض مدیریت‌شده توسط Teams - بدون نیاز به اشتراک Azure)

خروجی `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID` و یک **Teams App ID** را نشان می‌دهد - این‌ها را برای گام‌های بعدی یادداشت کنید. همچنین پیشنهاد می‌کند برنامه را مستقیم در Teams نصب کنید.

**۴. OpenClaw را پیکربندی کنید** با استفاده از اعتبارنامه‌های خروجی:

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

یا مستقیم از متغیرهای محیطی استفاده کنید: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

**۵. برنامه را در Teams نصب کنید**

`teams app create` از شما می‌خواهد برنامه را نصب کنید - «Install in Teams» را انتخاب کنید. اگر از آن گذشتید، می‌توانید بعداً لینک را بگیرید:

```bash
teams app get <teamsAppId> --install-link
```

**۶. بررسی کنید همه چیز کار می‌کند**

```bash
teams app doctor <teamsAppId>
```

این فرمان عیب‌یابی را در ثبت bot، پیکربندی برنامه AAD، اعتبار manifest و راه‌اندازی SSO اجرا می‌کند.

برای استقرارهای production، به‌جای client secretها از [احراز هویت federated](/fa/channels/msteams#federated-authentication-certificate-plus-managed-identity) (گواهی یا managed identity) استفاده کنید.

<Note>
گفت‌وگوهای گروهی به‌صورت پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای مجازکردن پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` برای مجازکردن هر عضو استفاده کنید (با الزام mention).
</Note>

## اهداف

- از طریق DMهای Teams، گفت‌وگوهای گروهی یا کانال‌ها با OpenClaw صحبت کنید.
- مسیریابی را قطعی نگه دارید: پاسخ‌ها همیشه به همان کانالی برمی‌گردند که از آن آمده‌اند.
- رفتار امن کانال را پیش‌فرض قرار دهید (mentionها لازم هستند مگر اینکه طور دیگری پیکربندی شده باشد).

## نوشتن پیکربندی

به‌صورت پیش‌فرض، Microsoft Teams مجاز است به‌روزرسانی‌های پیکربندی را که با `/config set|unset` آغاز شده‌اند بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (DMها + گروه‌ها)

**دسترسی DM**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستندگان ناشناس تا زمان تأیید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از شناسه‌های پایدار شیء AAD استفاده کند.
- برای allowlistها به تطبیق UPN/نام نمایشی تکیه نکنید - ممکن است تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌صورت پیش‌فرض غیرفعال می‌کند؛ با `channels.msteams.dangerouslyAllowNameMatching: true` صریحاً فعالش کنید.
- wizard می‌تواند وقتی اعتبارنامه‌ها اجازه دهند، نام‌ها را از طریق Microsoft Graph به ID تبدیل کند.

**دسترسی گروه**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است مگر اینکه `groupAllowFrom` را اضافه کنید). برای override پیش‌فرض هنگام تنظیم‌نبودن، از `channels.defaults.groupPolicy` استفاده کنید.
- `channels.msteams.groupAllowFrom` کنترل می‌کند کدام فرستندگان می‌توانند در گفت‌وگوها/کانال‌های گروهی trigger کنند (به `channels.msteams.allowFrom` fallback می‌کند).
- برای مجازکردن هر عضو، `groupPolicy: "open"` را تنظیم کنید (همچنان به‌صورت پیش‌فرض با الزام mention).
- برای مجازکردن **هیچ کانالی**، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

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

**Allowlist تیم‌ها + کانال**

- پاسخ‌های گروه/کانال را با فهرست‌کردن تیم‌ها و کانال‌ها زیر `channels.msteams.teams` محدود کنید.
- کلیدها باید از شناسه‌های پایدار مکالمه Teams از لینک‌های Teams استفاده کنند، نه نام‌های نمایشی قابل‌تغییر.
- وقتی `groupPolicy="allowlist"` و allowlist تیم‌ها وجود دارد، فقط تیم‌ها/کانال‌های فهرست‌شده پذیرفته می‌شوند (با الزام mention).
- wizard پیکربندی ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام startup، OpenClaw نام‌های allowlist تیم/کانال و کاربر را به ID تبدیل می‌کند (وقتی مجوزهای Graph اجازه دهند)
  و نگاشت را log می‌کند؛ نام‌های resolveنشده تیم/کانال همان‌طور که وارد شده‌اند نگه داشته می‌شوند اما به‌صورت پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند، مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` فعال باشد.

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
<summary><strong>راه‌اندازی دستی (بدون Teams CLI)</strong></summary>

اگر نمی‌توانید از Teams CLI استفاده کنید، می‌توانید bot را به‌صورت دستی از طریق Azure Portal راه‌اندازی کنید.

### نحوه کار

1. مطمئن شوید Microsoft Teams Plugin در دسترس است (در نسخه‌های فعلی همراه است).
2. یک **Azure Bot** ایجاد کنید (App ID + secret + tenant ID).
3. یک **بسته برنامه Teams** بسازید که به bot ارجاع می‌دهد و مجوزهای RSC زیر را شامل می‌شود.
4. برنامه Teams را در یک تیم (یا محدوده شخصی برای DMها) بارگذاری/نصب کنید.
5. `msteams` را در `~/.openclaw/openclaw.json` (یا متغیرهای محیطی) پیکربندی کنید و gateway را راه‌اندازی کنید.
6. Gateway به‌صورت پیش‌فرض روی `/api/messages` منتظر ترافیک Webhook Bot Framework می‌ماند.

### گام ۱: Azure Bot ایجاد کنید

1. به [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید
2. زبانه **Basics** را پر کنید:

   | فیلد              | مقدار                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | نام bot شما، مثلاً `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription**   | اشتراک Azure خود را انتخاب کنید                           |
   | **Resource group** | مورد جدید ایجاد کنید یا از موجود استفاده کنید                               |
   | **Pricing tier**   | **Free** برای توسعه/آزمایش                                 |
   | **Type of App**    | **Single Tenant** (توصیه‌شده - یادداشت زیر را ببینید)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
ایجاد botهای multi-tenant جدید پس از 2025-07-31 منسوخ شد. برای botهای جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** → **Create** کلیک کنید (حدود ۱ تا ۲ دقیقه صبر کنید)

### گام ۲: دریافت اعتبارنامه‌ها

1. به منبع Azure Bot خود بروید → **Configuration**
2. **Microsoft App ID** را کپی کنید → این همان `appId` شماست
3. روی **Manage Password** کلیک کنید → به App Registration بروید
4. زیر **Certificates & secrets** → **New client secret** → **Value** را کپی کنید → این همان `appPassword` شماست
5. به **Overview** بروید → **Directory (tenant) ID** را کپی کنید → این همان `tenantId` شماست

### گام ۳: پیکربندی endpoint پیام‌رسانی

1. در Azure Bot → **Configuration**
2. **Messaging endpoint** را روی URL Webhook خود تنظیم کنید:
   - Production: `https://your-domain.com/api/messages`
   - توسعه محلی: از یک تونل استفاده کنید (به [توسعه محلی](#local-development-tunneling) در پایین مراجعه کنید)

### گام ۴: فعال‌کردن کانال Teams

1. در Azure Bot → **Channels**
2. روی **Microsoft Teams** → Configure → Save کلیک کنید
3. شرایط سرویس را بپذیرید

### گام ۵: ساخت manifest برنامه Teams

- یک ورودی `bot` با `botId = <App ID>` قرار دهید.
- محدوده‌ها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای مدیریت فایل در محدوده personal لازم است).
- مجوزهای RSC را اضافه کنید (به [مجوزهای RSC](#current-teams-rsc-permissions-manifest) مراجعه کنید).
- آیکن‌ها را ایجاد کنید: `outline.png` (32x32) و `color.png` (192x192).
- هر سه فایل را با هم zip کنید: `manifest.json`، `outline.png`، `color.png`.

### گام ۶: پیکربندی OpenClaw

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

### گام ۷: اجرای Gateway

کانال Teams وقتی Plugin در دسترس باشد و پیکربندی `msteams` با اعتبارنامه‌ها وجود داشته باشد، به‌صورت خودکار شروع می‌شود.

</details>

## احراز هویت federated (گواهی به‌همراه managed identity)

> اضافه‌شده در 2026.4.11

برای استقرارهای production، OpenClaw از **احراز هویت federated** به‌عنوان جایگزینی امن‌تر برای client secretها پشتیبانی می‌کند. دو روش در دسترس است:

### گزینه A: احراز هویت مبتنی بر گواهی

از یک گواهی PEM ثبت‌شده با app registration مربوط به Entra ID خود استفاده کنید.

**راه‌اندازی:**

1. یک گواهی تولید یا دریافت کنید (قالب PEM همراه با کلید خصوصی).
2. در Entra ID → App Registration → **Certificates & secrets** → **Certificates** → گواهی عمومی را بارگذاری کنید.

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

### گزینه B: Azure Managed Identity

از Azure Managed Identity برای احراز هویت بدون گذرواژه استفاده کنید. این گزینه برای استقرارها روی زیرساخت Azure (AKS، App Service، Azure VMs) که managed identity در دسترس است ایدئال است.

**نحوه کار:**

1. pod/VM مربوط به bot یک managed identity دارد (system-assigned یا user-assigned).
2. یک **federated identity credential**، managed identity را به app registration مربوط به Entra ID متصل می‌کند.
3. در زمان اجرا، OpenClaw از `@azure/identity` برای دریافت tokenها از endpoint مربوط به Azure IMDS (`169.254.169.254`) استفاده می‌کند.
4. token برای احراز هویت bot به Teams SDK پاس داده می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با managed identity فعال (AKS workload identity، App Service، VM)
- federated identity credential ایجادشده روی app registration مربوط به Entra ID
- دسترسی شبکه به IMDS (`169.254.169.254:80`) از pod/VM

**پیکربندی (managed identity نوع system-assigned):**

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

**پیکربندی (هویت مدیریت‌شده تخصیص‌یافته توسط کاربر):**

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

**متغیرهای محیطی:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط برای تخصیص‌یافته توسط کاربر)

### راه‌اندازی Workload Identity در AKS

برای استقرارهای AKS که از workload identity استفاده می‌کنند:

1. **workload identity را فعال کنید** روی کلاستر AKS خود.
2. **یک اعتبارنامه هویت فدره‌شده ایجاد کنید** روی ثبت برنامه Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **حساب سرویس Kubernetes را حاشیه‌نویسی کنید** با شناسه کلاینت برنامه:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **پاد را برچسب‌گذاری کنید** برای تزریق workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **دسترسی شبکه را تضمین کنید** به IMDS (`169.254.169.254`) - اگر از NetworkPolicy استفاده می‌کنید، یک قانون خروجی اضافه کنید که ترافیک به `169.254.169.254/32` روی پورت 80 را مجاز کند.

### مقایسه نوع احراز هویت

| روش                  | پیکربندی                                      | مزایا                              | معایب                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| **راز کلاینت**       | `appPassword`                                  | راه‌اندازی ساده                    | نیازمند چرخش راز، امنیت کمتر              |
| **گواهی**            | `authType: "federated"` + `certificatePath`    | بدون راز مشترک روی شبکه            | سربار مدیریت گواهی                         |
| **هویت مدیریت‌شده** | `authType: "federated"` + `useManagedIdentity` | بدون گذرواژه، بدون نیاز به مدیریت راز | نیازمند زیرساخت Azure                      |

**رفتار پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw به‌صورت پیش‌فرض از احراز هویت با راز کلاینت استفاده می‌کند. پیکربندی‌های موجود بدون تغییر همچنان کار می‌کنند.

## توسعه محلی (تونل‌سازی)

Teams نمی‌تواند به `localhost` دسترسی داشته باشد. از یک تونل توسعه پایدار استفاده کنید تا URL شما بین نشست‌ها ثابت بماند:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

گزینه‌های جایگزین: `ngrok http 3978` یا `tailscale funnel 3978` (URLها ممکن است در هر نشست تغییر کنند).

اگر URL تونل شما تغییر کرد، endpoint را به‌روزرسانی کنید:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## آزمایش ربات

**اجرای عیب‌یابی:**

```bash
teams app doctor <teamsAppId>
```

ثبت ربات، برنامه AAD، manifest، و پیکربندی SSO را در یک گذر بررسی می‌کند.

**ارسال پیام آزمایشی:**

1. برنامه Teams را نصب کنید (از پیوند نصب از `teams app get <id> --install-link` استفاده کنید)
2. ربات را در Teams پیدا کنید و یک پیام مستقیم بفرستید
3. لاگ‌های Gateway را برای فعالیت ورودی بررسی کنید

## متغیرهای محیطی

همه کلیدهای پیکربندی را می‌توان به‌جای آن از طریق متغیرهای محیطی تنظیم کرد:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختیاری: `"secret"` یا `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (فدره‌شده + گواهی)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختیاری، برای احراز هویت لازم نیست)
- `MSTEAMS_USE_MANAGED_IDENTITY` (فدره‌شده + هویت مدیریت‌شده)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI تخصیص‌یافته توسط کاربر)

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` مبتنی بر Graph برای Microsoft Teams ارائه می‌کند تا عامل‌ها و خودکارسازی‌ها بتوانند جزئیات اعضای کانال (نام نمایشی، ایمیل، نقش) را مستقیماً از Microsoft Graph بازیابی کنند.

نیازمندی‌ها:

- مجوز RSC با نام `Member.Read.Group` (از قبل در manifest پیشنهادی وجود دارد)
- برای جست‌وجوهای بین‌تیمی: مجوز Graph Application با نام `User.Read.All` همراه با رضایت مدیر

این کنش با `channels.msteams.actions.memberInfo` کنترل می‌شود (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).

## زمینه تاریخچه

- `channels.msteams.historyLimit` کنترل می‌کند چه تعداد از پیام‌های اخیر کانال/گروه در prompt قرار داده شوند.
- به `messages.groupChat.historyLimit` برمی‌گردد. برای غیرفعال‌سازی `0` تنظیم کنید (پیش‌فرض 50).
- تاریخچه thread دریافت‌شده بر اساس فهرست‌های مجاز فرستنده (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود، بنابراین مقداردهی اولیه زمینه thread فقط شامل پیام‌های فرستنده‌های مجاز است.
- زمینه پیوست نقل‌شده (`ReplyTo*` مشتق‌شده از HTML پاسخ Teams) فعلاً همان‌طور که دریافت شده عبور داده می‌شود.
- به بیان دیگر، فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند؛ امروز فقط مسیرهای مشخصی از زمینه تکمیلی فیلتر می‌شوند.
- تاریخچه DM را می‌توان با `channels.msteams.dmHistoryLimit` محدود کرد (نوبت‌های کاربر). بازنویسی‌های مخصوص هر کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

## مجوزهای فعلی RSC در Teams (manifest)

این‌ها **مجوزهای resourceSpecific موجود** در manifest برنامه Teams ما هستند. آن‌ها فقط داخل تیم/چتی اعمال می‌شوند که برنامه در آن نصب شده است.

**برای کانال‌ها (دامنه تیم):**

- `ChannelMessage.Read.Group` (Application) - دریافت همه پیام‌های کانال بدون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**برای چت‌های گروهی:**

- `ChatMessage.Read.Chat` (Application) - دریافت همه پیام‌های چت گروهی بدون @mention

برای افزودن مجوزهای RSC از طریق Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## نمونه manifest برای Teams (ویرایش‌شده)

نمونه‌ای حداقلی و معتبر با فیلدهای لازم. شناسه‌ها و URLها را جایگزین کنید.

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

### نکات احتیاطی manifest (فیلدهای الزامی)

- `bots[].botId` **باید** با شناسه برنامه Azure Bot مطابقت داشته باشد.
- `webApplicationInfo.id` **باید** با شناسه برنامه Azure Bot مطابقت داشته باشد.
- `bots[].scopes` باید سطح‌هایی را که قصد استفاده از آن‌ها را دارید شامل شود (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` برای مدیریت فایل در دامنه شخصی لازم است.
- اگر ترافیک کانال را می‌خواهید، `authorization.permissions.resourceSpecific` باید خواندن/ارسال کانال را شامل شود.

### به‌روزرسانی یک برنامه موجود

برای به‌روزرسانی برنامه Teams که از قبل نصب شده است (برای مثال، برای افزودن مجوزهای RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

پس از به‌روزرسانی، برنامه را در هر تیم دوباره نصب کنید تا مجوزهای جدید اعمال شوند، و **Teams را کاملاً ببندید و دوباره اجرا کنید** (نه فقط بستن پنجره) تا metadata ذخیره‌شده برنامه پاک شود.

<details>
<summary>به‌روزرسانی دستی manifest (بدون CLI)</summary>

1. `manifest.json` خود را با تنظیمات جدید به‌روزرسانی کنید
2. **فیلد `version` را افزایش دهید** (برای مثال، `1.0.0` → `1.1.0`)
3. manifest را همراه با آیکون‌ها **دوباره zip کنید** (`manifest.json`، `outline.png`، `color.png`)
4. zip جدید را بارگذاری کنید:
   - **Teams Admin Center:** برنامه‌های Teams → مدیریت برنامه‌ها → برنامه خود را پیدا کنید → بارگذاری نسخه جدید
   - **Sideload:** در Teams → برنامه‌ها → مدیریت برنامه‌های شما → بارگذاری یک برنامه سفارشی

</details>

## قابلیت‌ها: فقط RSC در برابر Graph

### با **فقط Teams RSC** (برنامه نصب‌شده، بدون مجوزهای Graph API)

کار می‌کند:

- خواندن محتوای **متنی** پیام کانال.
- ارسال محتوای **متنی** پیام کانال.
- دریافت پیوست‌های فایل **شخصی (DM)**.

کار نمی‌کند:

- **محتوای تصویر یا فایل** کانال/گروه (payload فقط شامل stub HTML است).
- دانلود پیوست‌های ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام (فراتر از رویداد Webhook زنده).

### با **Teams RSC + مجوزهای Microsoft Graph Application**

اضافه می‌کند:

- دانلود محتوای میزبانی‌شده (تصاویر چسبانده‌شده در پیام‌ها).
- دانلود پیوست‌های فایل ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام کانال/چت از طریق Graph.

### RSC در برابر Graph API

| قابلیت                  | مجوزهای RSC          | Graph API                            |
| ----------------------- | -------------------- | ------------------------------------ |
| **پیام‌های بلادرنگ**    | بله (از طریق Webhook) | خیر (فقط polling)                    |
| **پیام‌های تاریخی**     | خیر                  | بله (می‌تواند تاریخچه را query کند)  |
| **پیچیدگی راه‌اندازی**  | فقط manifest برنامه  | نیازمند رضایت مدیر + جریان token    |
| **کار در حالت آفلاین** | خیر (باید در حال اجرا باشد) | بله (query در هر زمان)               |

**خلاصه:** RSC برای گوش‌دادن بلادرنگ است؛ Graph API برای دسترسی تاریخی است. برای رسیدن به پیام‌های از‌دست‌رفته هنگام آفلاین بودن، به Graph API با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه + تاریخچه فعال‌شده با Graph (لازم برای کانال‌ها)

اگر در **کانال‌ها** به تصاویر/فایل‌ها نیاز دارید یا می‌خواهید **تاریخچه پیام** را دریافت کنید، باید مجوزهای Microsoft Graph را فعال کنید و رضایت مدیر را اعطا کنید.

1. در **App Registration** در Entra ID (Azure AD)، مجوزهای **Application** مربوط به Microsoft Graph را اضافه کنید:
   - `ChannelMessage.Read.All` (پیوست‌های کانال + تاریخچه)
   - `Chat.Read.All` یا `ChatMessage.Read.All` (چت‌های گروهی)
2. **رضایت مدیر را اعطا کنید** برای tenant.
3. **نسخه manifest** برنامه Teams را افزایش دهید، دوباره بارگذاری کنید، و **برنامه را در Teams دوباره نصب کنید**.
4. **Teams را کاملاً ببندید و دوباره اجرا کنید** تا metadata ذخیره‌شده برنامه پاک شود.

**مجوز اضافی برای mention کردن کاربران:** @mention کاربران برای کاربرانی که در مکالمه هستند، بدون کار اضافه کار می‌کند. با این حال، اگر می‌خواهید کاربرانی را که **در مکالمه فعلی نیستند** به‌صورت پویا جست‌وجو و mention کنید، مجوز `User.Read.All` (Application) را اضافه کنید و رضایت مدیر را اعطا کنید.

## محدودیت‌های شناخته‌شده

### وقفه‌های زمانی Webhook

Teams پیام‌ها را از طریق Webhook HTTP تحویل می‌دهد. اگر پردازش بیش از حد طول بکشد (برای مثال، پاسخ‌های کند LLM)، ممکن است این موارد را ببینید:

- وقفه‌های زمانی Gateway
- تلاش دوباره Teams برای پیام (که باعث تکراری شدن می‌شود)
- پاسخ‌های حذف‌شده

OpenClaw این را با برگشت سریع و ارسال پیش‌دستانه پاسخ‌ها مدیریت می‌کند، اما پاسخ‌های بسیار کند همچنان ممکن است مشکل ایجاد کنند.

### قالب‌بندی

markdown در Teams محدودتر از Slack یا Discord است:

- قالب‌بندی پایه کار می‌کند: **بولد**، _ایتالیک_، `code`، لینک‌ها
- Markdown پیچیده (جدول‌ها، فهرست‌های تودرتو) ممکن است درست رندر نشود
- Adaptive Cards برای نظرسنجی‌ها و ارسال‌های ارائهٔ معنایی پشتیبانی می‌شود (پایین را ببینید)

## پیکربندی

تنظیمات کلیدی (`/gateway/configuration` را برای الگوهای مشترک کانال ببینید):

- `channels.msteams.enabled`: فعال/غیرفعال کردن کانال.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اعتبارنامه‌های بات.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`)
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing)
- `channels.msteams.allowFrom`: فهرست مجاز DM (شناسه‌های شیء AAD توصیه می‌شوند). وقتی دسترسی Graph موجود باشد، راه‌انداز در زمان تنظیم نام‌ها را به شناسه‌ها تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: کلید اضطراری برای فعال‌سازی دوبارهٔ تطبیق UPN/نام نمایشی قابل‌تغییر و مسیریابی مستقیم نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازهٔ قطعهٔ متن خروجی.
- `channels.msteams.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خط‌های خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز میزبان‌های پیوست ورودی (پیش‌فرض دامنه‌های Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای افزودن سرآیندهای Authorization در تلاش‌های دوبارهٔ رسانه (پیش‌فرض میزبان‌های Graph + Bot Framework).
- `channels.msteams.requireMention`: الزام @mention در کانال‌ها/گروه‌ها (پیش‌فرض true).
- `channels.msteams.replyStyle`: `thread | top-level` ([سبک پاسخ](#reply-style-threads-vs-posts) را ببینید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر تیم (`allow`/`deny`/`alsoAllow`) که وقتی بازنویسی کانال موجود نباشد استفاده می‌شود.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر تیم و هر فرستنده (wildcard با `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های سیاست ابزار برای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های سیاست ابزار برای هر کانال و هر فرستنده (wildcard با `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند:
  `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمی بدون پیشوند هنوز فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.actions.memberInfo`: فعال یا غیرفعال کردن کنش اطلاعات عضو مبتنی بر Graph (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).
- `channels.msteams.authType`: نوع احراز هویت - `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (احراز هویت federated + certificate).
- `channels.msteams.certificateThumbprint`: اثر انگشت گواهی (اختیاری، برای احراز هویت لازم نیست).
- `channels.msteams.useManagedIdentity`: فعال کردن احراز هویت managed identity (حالت federated).
- `channels.msteams.managedIdentityClientId`: شناسهٔ کلاینت برای managed identity تخصیص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسهٔ سایت SharePoint برای بارگذاری فایل در چت‌های گروهی/کانال‌ها ([ارسال فایل در چت‌های گروهی](#sending-files-in-group-chats) را ببینید).

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد عامل پیروی می‌کنند ([/concepts/session](/fa/concepts/session) را ببینید):
  - پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسهٔ مکالمه استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams اخیراً دو سبک رابط کاربری کانال را روی همان مدل دادهٔ زیربنایی معرفی کرده است:

| سبک                     | توضیح                                                   | `replyStyle` پیشنهادی |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (کلاسیک)      | پیام‌ها به‌صورت کارت‌هایی با پاسخ‌های رشته‌ای زیر آن‌ها ظاهر می‌شوند | `thread` (پیش‌فرض)       |
| **Threads** (شبیه Slack) | پیام‌ها خطی جریان می‌یابند، بیشتر شبیه Slack            | `top-level`              |

**مشکل:** Teams API مشخص نمی‌کند یک کانال از کدام سبک رابط کاربری استفاده می‌کند. اگر از `replyStyle` اشتباه استفاده کنید:

- `thread` در کانالی با سبک Threads → پاسخ‌ها به‌صورت نامناسب تودرتو ظاهر می‌شوند
- `top-level` در کانالی با سبک Posts → پاسخ‌ها به‌جای داخل رشته، به‌صورت پست‌های سطح بالای جداگانه ظاهر می‌شوند

**راه‌حل:** `replyStyle` را بر اساس نحوهٔ تنظیم کانال، برای هر کانال پیکربندی کنید:

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

### اولویت رفع مقدار

وقتی بات پاسخی را به یک کانال می‌فرستد، `replyStyle` از اختصاصی‌ترین بازنویسی تا پیش‌فرض حل می‌شود. نخستین مقدار غیر `undefined` برنده است:

1. **برای هر کانال** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **برای هر تیم** — `channels.msteams.teams.<teamId>.replyStyle`
3. **سراسری** — `channels.msteams.replyStyle`
4. **پیش‌فرض ضمنی** — برگرفته از `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

اگر `requireMention: false` را به‌صورت سراسری و بدون `replyStyle` صریح تنظیم کنید، mentionها در کانال‌های سبک Posts حتی وقتی ورودی پاسخ رشته‌ای بوده است، به‌صورت پست‌های سطح بالا نمایش داده می‌شوند. برای جلوگیری از رفتارهای غیرمنتظره، `replyStyle: "thread"` را در سطح سراسری، تیم یا کانال ثابت کنید.

### حفظ زمینهٔ رشته

وقتی `replyStyle: "thread"` مؤثر باشد و بات از داخل یک رشتهٔ کانال @mentioned شده باشد، OpenClaw ریشهٔ رشتهٔ اصلی را دوباره به مرجع مکالمهٔ خروجی وصل می‌کند (`19:…@thread.tacv2;messageid=<root>`) تا پاسخ در همان رشته قرار بگیرد. این موضوع هم برای ارسال‌های زنده (در همان نوبت) و هم برای ارسال‌های proactive پس از منقضی شدن زمینهٔ نوبت Bot Framework برقرار است (برای مثال، عامل‌های طولانی‌اجرا، پاسخ‌های فراخوانی ابزار صف‌شده از طریق `mcp__openclaw__message`).

ریشهٔ رشته از `threadId` ذخیره‌شده روی مرجع مکالمه گرفته می‌شود. مراجع ذخیره‌شدهٔ قدیمی‌تر که پیش از `threadId` هستند به `activityId` برمی‌گردند (هر فعالیت ورودی‌ای که آخرین بار مکالمه را مقداردهی کرده باشد)، بنابراین استقرارهای موجود بدون مقداردهی دوباره همچنان کار می‌کنند.

وقتی `replyStyle: "top-level"` مؤثر باشد، ورودی‌های رشتهٔ کانال عمداً به‌صورت پست‌های سطح بالای جدید پاسخ داده می‌شوند — هیچ پسوند رشته‌ای اضافه نمی‌شود. این رفتار درست برای کانال‌های سبک Threads است؛ اگر پست‌های سطح بالا می‌بینید در حالی که انتظار پاسخ‌های رشته‌ای داشتید، `replyStyle` شما برای آن کانال نادرست تنظیم شده است.

## پیوست‌ها و تصاویر

**محدودیت‌های فعلی:**

- **DMها:** تصاویر و پیوست‌های فایل از طریق APIهای فایل بات Teams کار می‌کنند.
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 (SharePoint/OneDrive) قرار دارند. payload وبهوک فقط شامل یک stub HTML است، نه بایت‌های واقعی فایل. **مجوزهای Graph API برای دانلود پیوست‌های کانال لازم هستند**.
- برای ارسال‌های صریح فایل‌محور، از `action=upload-file` همراه با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود و `filename` نام بارگذاری‌شده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانال دارای تصویر به‌صورت فقط متن دریافت می‌شوند (محتوای تصویر برای بات قابل دسترسی نیست).
به‌طور پیش‌فرض، OpenClaw فقط رسانه را از نام میزبان‌های Microsoft/Teams دانلود می‌کند. با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای اجازه دادن به هر میزبان از `["*"]` استفاده کنید).
سرآیندهای Authorization فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` اضافه می‌شوند (پیش‌فرض میزبان‌های Graph + Bot Framework). این فهرست را سخت‌گیرانه نگه دارید (از پسوندهای چندمستأجری پرهیز کنید).

## ارسال فایل در چت‌های گروهی

بات‌ها می‌توانند با استفاده از جریان FileConsentCard در DMها فایل ارسال کنند (داخلی). با این حال، **ارسال فایل در چت‌های گروهی/کانال‌ها** به تنظیمات اضافی نیاز دارد:

| زمینه                   | فایل‌ها چگونه ارسال می‌شوند                    | تنظیم لازم                                      |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMها**                 | FileConsentCard → کاربر می‌پذیرد → بات بارگذاری می‌کند | بدون تنظیم اضافی کار می‌کند                    |
| **چت‌های گروهی/کانال‌ها** | بارگذاری در SharePoint → اشتراک‌گذاری لینک      | نیازمند `sharePointSiteId` + مجوزهای Graph      |
| **تصاویر (هر زمینه‌ای)** | درون‌خطی با کدگذاری Base64                    | بدون تنظیم اضافی کار می‌کند                    |

### چرا چت‌های گروهی به SharePoint نیاز دارند

بات‌ها drive شخصی OneDrive ندارند (نقطهٔ پایانی `/me/drive` در Graph API برای هویت‌های برنامه‌ای کار نمی‌کند). برای ارسال فایل در چت‌های گروهی/کانال‌ها، بات در یک **سایت SharePoint** بارگذاری می‌کند و لینک اشتراک‌گذاری می‌سازد.

### راه‌اندازی

1. **مجوزهای Graph API را اضافه کنید** در Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - بارگذاری فایل‌ها در SharePoint
   - `Chat.Read.All` (Application) - اختیاری، لینک‌های اشتراک‌گذاری برای هر کاربر را فعال می‌کند

2. **رضایت مدیر** را برای tenant اعطا کنید.

3. **شناسهٔ سایت SharePoint خود را بگیرید:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw را پیکربندی کنید:**

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

### رفتار اشتراک‌گذاری

| مجوز                                    | رفتار اشتراک‌گذاری                                      |
| --------------------------------------- | --------------------------------------------------------- |
| فقط `Sites.ReadWrite.All`               | لینک اشتراک‌گذاری در سطح سازمان (هر کسی در سازمان می‌تواند دسترسی داشته باشد) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | لینک اشتراک‌گذاری برای هر کاربر (فقط اعضای چت می‌توانند دسترسی داشته باشند) |

اشتراک‌گذاری برای هر کاربر امن‌تر است، چون فقط شرکت‌کنندگان چت می‌توانند به فایل دسترسی داشته باشند. اگر مجوز `Chat.Read.All` موجود نباشد، بات به اشتراک‌گذاری در سطح سازمان برمی‌گردد.

### رفتار fallback

| سناریو                                           | نتیجه                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| چت گروهی + فایل + `sharePointSiteId` پیکربندی‌شده | بارگذاری در SharePoint، ارسال لینک اشتراک‌گذاری    |
| چت گروهی + فایل + بدون `sharePointSiteId`         | تلاش برای بارگذاری OneDrive (ممکن است شکست بخورد)، ارسال فقط متن |
| چت شخصی + فایل                                   | جریان FileConsentCard (بدون SharePoint کار می‌کند) |
| هر زمینه + تصویر                                 | درون‌خطی با کدگذاری Base64 (بدون SharePoint کار می‌کند) |

### محل ذخیرهٔ فایل‌ها

فایل‌های بارگذاری‌شده در پوشهٔ `/OpenClawShared/` در کتابخانهٔ اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (Adaptive Cards)

OpenClaw نظرسنجی‌های Teams را به‌صورت Adaptive Cards ارسال می‌کند (API بومی نظرسنجی Teams وجود ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- رأی‌ها توسط Gateway در `~/.openclaw/msteams-polls.json` ثبت می‌شوند.
- Gateway باید آنلاین بماند تا رأی‌ها ثبت شوند.
- نظرسنجی‌ها هنوز خلاصهٔ نتایج را به‌صورت خودکار ارسال نمی‌کنند (در صورت نیاز فایل ذخیره را بررسی کنید).

## کارت‌های ارائه

پیام‌های ارائهٔ معنایی را با استفاده از ابزار `message` یا CLI به کاربران یا گفت‌وگوهای Teams ارسال کنید. OpenClaw آن‌ها را از قرارداد عمومی ارائه، به‌صورت Teams Adaptive Cards رندر می‌کند.

پارامتر `presentation` بلوک‌های معنایی را می‌پذیرد. وقتی `presentation` ارائه شود، متن پیام اختیاری است.

**ابزار عامل:**

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

برای جزئیات قالب مقصد، [قالب‌های مقصد](#target-formats) را در ادامه ببینید.

## قالب‌های مقصد

مقصدهای MSTeams برای تمایز بین کاربران و گفت‌وگوها از پیشوند استفاده می‌کنند:

| نوع مقصد | قالب | مثال |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| کاربر (بر اساس ID) | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| کاربر (بر اساس نام) | `user:<display-name>` | `user:John Smith` (به Graph API نیاز دارد) |
| گروه/کانال | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| گروه/کانال (خام) | `<conversation-id>` | `19:abc123...@thread.tacv2` (اگر شامل `@thread` باشد) |

**مثال‌های CLI:**

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

**مثال‌های ابزار عامل:**

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
بدون پیشوند `user:`، نام‌ها به‌طور پیش‌فرض به تفکیک گروه یا تیم ارجاع داده می‌شوند. هنگام هدف‌گیری افراد بر اساس نام نمایشی، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **پس از** تعامل کاربر ممکن هستند، زیرا در آن مرحله ارجاع‌های گفت‌وگو را ذخیره می‌کنیم.
- برای `dmPolicy` و کنترل allowlist، `/gateway/configuration` را ببینید.

## IDهای تیم و کانال (اشتباه رایج)

پارامتر کوئری `groupId` در URLهای Teams، **ID تیم** مورد استفاده برای پیکربندی نیست. در عوض، IDها را از مسیر URL استخراج کنید:

**URL تیم:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL کانال:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**برای پیکربندی:**

- کلید تیم = بخش مسیر پس از `/team/` (URL-decode شده، مانند `19:Bk4j...@thread.tacv2`؛ tenantهای قدیمی‌تر ممکن است `@thread.skype` را نشان دهند که آن هم معتبر است)
- کلید کانال = بخش مسیر پس از `/channel/` (URL-decode شده)
- پارامتر کوئری `groupId` را برای مسیریابی OpenClaw **نادیده بگیرید**. این شناسهٔ گروه Microsoft Entra است، نه Bot Framework conversation ID که در فعالیت‌های ورودی Teams استفاده می‌شود.

## کانال‌های خصوصی

بات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت | کانال‌های استاندارد | کانال‌های خصوصی |
| ---------------------------- | ----------------- | ---------------------- |
| نصب بات | بله | محدود |
| پیام‌های بلادرنگ (Webhook) | بله | ممکن است کار نکند |
| مجوزهای RSC | بله | ممکن است رفتار متفاوتی داشته باشد |
| @mentions | بله | اگر بات قابل دسترسی باشد |
| تاریخچه Graph API | بله | بله (با مجوزها) |

**راهکارهای جایگزین اگر کانال‌های خصوصی کار نمی‌کنند:**

1. برای تعاملات بات از کانال‌های استاندارد استفاده کنید
2. از DMها استفاده کنید - کاربران همیشه می‌توانند مستقیماً به بات پیام بدهند
3. برای دسترسی تاریخی از Graph API استفاده کنید (به `ChannelMessage.Read.All` نیاز دارد)

## عیب‌یابی

### مشکلات رایج

- **تصاویر در کانال‌ها نمایش داده نمی‌شوند:** مجوزهای Graph یا رضایت مدیر موجود نیست. برنامهٔ Teams را دوباره نصب کنید و Teams را کاملاً ببندید/دوباره باز کنید.
- **پاسخی در کانال دریافت نمی‌شود:** به‌طور پیش‌فرض mention لازم است؛ `channels.msteams.requireMention=false` را تنظیم کنید یا برای هر تیم/کانال پیکربندی کنید.
- **ناهماهنگی نسخه (Teams هنوز manifest قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و برای تازه‌سازی، Teams را کاملاً ببندید.
- **401 Unauthorized از Webhook:** هنگام آزمایش دستی بدون Azure JWT مورد انتظار است - یعنی endpoint قابل دسترسی است اما احراز هویت ناموفق بوده است. برای آزمایش درست از Azure Web Chat استفاده کنید.

### خطاهای بارگذاری manifest

- **"Icon file cannot be empty":** manifest به فایل‌های آیکونی اشاره می‌کند که 0 بایت هستند. آیکون‌های PNG معتبر بسازید (32x32 برای `outline.png` و 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه هنوز در تیم/چت دیگری نصب است. ابتدا آن را پیدا و حذف نصب کنید، یا 5 تا 10 دقیقه برای انتشار تغییرات صبر کنید.
- **"Something went wrong" هنگام بارگذاری:** به‌جای آن از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بارگذاری کنید، DevTools مرورگر (F12) → زبانهٔ Network را باز کنید و بدنهٔ پاسخ را برای خطای واقعی بررسی کنید.
- **Sideload ناموفق است:** به‌جای "Upload a custom app"، گزینهٔ "Upload an app to your org's app catalog" را امتحان کنید - این کار اغلب محدودیت‌های sideload را دور می‌زند.

### مجوزهای RSC کار نمی‌کنند

1. بررسی کنید `webApplicationInfo.id` دقیقاً با App ID بات شما مطابقت دارد
2. برنامه را دوباره بارگذاری کنید و در تیم/چت دوباره نصب کنید
3. بررسی کنید آیا مدیر سازمان شما مجوزهای RSC را مسدود کرده است
4. مطمئن شوید از scope درست استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای چت‌های گروهی

## منابع

- [ایجاد Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - ایجاد/مدیریت برنامه‌های Teams
- [شِمای manifest برنامهٔ Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل بات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI برای مدیریت بات

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و کنترل mention
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
