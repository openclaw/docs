---
read_when:
    - کار روی قابلیت‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T09:03:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48e6cba4c5204726015758503e596fc02938d9de788c363190c3e6988e75ce8a
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: متن + پیوست‌های DM پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (ببینید [ارسال فایل در گفت‌وگوهای گروهی](#sending-files-in-group-chats)). نظرسنجی‌ها از طریق Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌های فایل‌محور ارائه می‌کنند.

## Plugin همراه

Microsoft Teams در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود، بنابراین در ساخت بسته‌بندی‌شده معمولی به نصب جداگانه نیازی نیست.

اگر روی یک ساخت قدیمی‌تر یا نصب سفارشی‌ای هستید که Teams همراه را حذف کرده است، بسته npm را مستقیم نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

برای دنبال کردن تگ انتشار رسمی فعلی، از بسته بدون نسخه استفاده کنید. فقط وقتی به نصب بازتولیدپذیر نیاز دارید، نسخه دقیق را پین کنید.

چک‌اوت محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت ربات، ساخت manifest، و تولید اعتبارنامه را در یک فرمان انجام می‌دهد.

**۱. نصب کنید و وارد شوید**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI در حال حاضر در مرحله preview است. فرمان‌ها و پرچم‌ها ممکن است بین انتشارها تغییر کنند.
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
`--allow-anonymous` لازم است چون Teams نمی‌تواند با devtunnels احراز هویت کند. هر درخواست ورودی ربات همچنان به‌صورت خودکار توسط Teams SDK اعتبارسنجی می‌شود.
</Note>

جایگزین‌ها: `ngrok http 3978` یا `tailscale funnel 3978` (اما این‌ها ممکن است در هر نشست URLها را تغییر دهند).

**۳. برنامه را بسازید**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این فرمان واحد:

- یک برنامه Entra ID (Azure AD) ایجاد می‌کند
- یک client secret تولید می‌کند
- یک manifest برنامه Teams می‌سازد و بارگذاری می‌کند (همراه با آیکون‌ها)
- ربات را ثبت می‌کند (به‌صورت پیش‌فرض مدیریت‌شده توسط Teams - بدون نیاز به اشتراک Azure)

خروجی، `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID`، و یک **Teams App ID** را نشان می‌دهد - این‌ها را برای مراحل بعدی یادداشت کنید. همچنین پیشنهاد می‌دهد برنامه را مستقیم در Teams نصب کنید.

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

`teams app create` از شما می‌خواهد برنامه را نصب کنید - «Install in Teams» را انتخاب کنید. اگر از آن گذشتید، می‌توانید بعدا لینک را بگیرید:

```bash
teams app get <teamsAppId> --install-link
```

**۶. بررسی کنید همه‌چیز کار می‌کند**

```bash
teams app doctor <teamsAppId>
```

این فرمان عیب‌یابی‌هایی را در ثبت ربات، پیکربندی برنامه AAD، اعتبار manifest، و راه‌اندازی SSO اجرا می‌کند.

برای استقرارهای تولید، استفاده از [احراز هویت فدرال‌شده](/fa/channels/msteams#federated-authentication-certificate-plus-managed-identity) (گواهی یا managed identity) را به‌جای client secretها در نظر بگیرید.

<Note>
گفت‌وگوهای گروهی به‌صورت پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای اجازه دادن به پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` برای اجازه دادن به هر عضو استفاده کنید (با gate مبتنی بر mention).
</Note>

## اهداف

- با OpenClaw از طریق DMهای Teams، گفت‌وگوهای گروهی، یا کانال‌ها صحبت کنید.
- مسیریابی را قطعی نگه دارید: پاسخ‌ها همیشه به همان کانالی برمی‌گردند که از آن آمده‌اند.
- رفتار امن کانال را پیش‌فرض کنید (mention لازم است مگر اینکه خلاف آن پیکربندی شده باشد).

## نوشتن پیکربندی

به‌صورت پیش‌فرض، Microsoft Teams اجازه دارد به‌روزرسانی‌های پیکربندی ناشی از `/config set|unset` را بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (DMها + گروه‌ها)

**دسترسی DM**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستنده‌های ناشناس تا زمان تایید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از شناسه‌های پایدار شیء AAD استفاده کند.
- برای allowlistها به تطبیق UPN/display-name تکیه نکنید - ممکن است تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌صورت پیش‌فرض غیرفعال می‌کند؛ با `channels.msteams.dangerouslyAllowNameMatching: true` صریحا آن را فعال کنید.
- wizard می‌تواند وقتی اعتبارنامه‌ها اجازه دهند، نام‌ها را از طریق Microsoft Graph به شناسه‌ها تبدیل کند.

**دسترسی گروه**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است مگر اینکه `groupAllowFrom` را اضافه کنید). برای بازنویسی پیش‌فرض وقتی تنظیم نشده است، از `channels.defaults.groupPolicy` استفاده کنید.
- `channels.msteams.groupAllowFrom` کنترل می‌کند کدام فرستنده‌ها می‌توانند در گفت‌وگوهای گروهی/کانال‌ها trigger شوند (به `channels.msteams.allowFrom` fallback می‌کند).
- `groupPolicy: "open"` را تنظیم کنید تا هر عضو مجاز باشد (همچنان به‌صورت پیش‌فرض با gate مبتنی بر mention).
- برای اجازه دادن به **هیچ کانالی**، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

نمونه:

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

**Teams + allowlist کانال**

- با فهرست کردن تیم‌ها و کانال‌ها زیر `channels.msteams.teams`، پاسخ‌های گروه/کانال را محدود کنید.
- کلیدها باید از شناسه‌های پایدار گفت‌وگوی Teams از لینک‌های Teams استفاده کنند، نه نام‌های نمایشی قابل‌تغییر.
- وقتی `groupPolicy="allowlist"` باشد و allowlist تیم‌ها وجود داشته باشد، فقط تیم‌ها/کانال‌های فهرست‌شده پذیرفته می‌شوند (با gate مبتنی بر mention).
- wizard پیکربندی، ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام startup، OpenClaw نام‌های allowlist تیم/کانال و کاربر را به شناسه‌ها تبدیل می‌کند (وقتی مجوزهای Graph اجازه دهند)
  و نگاشت را لاگ می‌کند؛ نام‌های حل‌نشده تیم/کانال همان‌طور که تایپ شده‌اند نگه داشته می‌شوند اما به‌صورت پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند، مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` فعال شده باشد.

نمونه:

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

اگر نمی‌توانید از Teams CLI استفاده کنید، می‌توانید ربات را به‌صورت دستی از طریق Azure Portal راه‌اندازی کنید.

### نحوه کار

1. مطمئن شوید Plugin Microsoft Teams در دسترس است (در نسخه‌های فعلی همراه است).
2. یک **Azure Bot** بسازید (App ID + secret + tenant ID).
3. یک **بسته برنامه Teams** بسازید که به ربات اشاره می‌کند و شامل مجوزهای RSC زیر است.
4. برنامه Teams را در یک تیم بارگذاری/نصب کنید (یا برای DMها در scope شخصی).
5. `msteams` را در `~/.openclaw/openclaw.json` (یا متغیرهای محیطی) پیکربندی کنید و gateway را شروع کنید.
6. gateway به‌صورت پیش‌فرض برای ترافیک Webhook Bot Framework روی `/api/messages` گوش می‌دهد.

### مرحله ۱: ساخت Azure Bot

1. به [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید
2. زبانه **Basics** را پر کنید:

   | فیلد              | مقدار                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | نام ربات شما، مثلا `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription**   | اشتراک Azure خود را انتخاب کنید                           |
   | **Resource group** | جدید بسازید یا از موجود استفاده کنید                               |
   | **Pricing tier**   | **Free** برای توسعه/آزمایش                                 |
   | **Type of App**    | **Single Tenant** (توصیه‌شده - یادداشت زیر را ببینید)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
ساخت ربات‌های multi-tenant جدید پس از 2025-07-31 منسوخ شد. برای ربات‌های جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** → **Create** کلیک کنید (حدود ۱-۲ دقیقه صبر کنید)

### مرحله ۲: دریافت اعتبارنامه‌ها

1. به منبع Azure Bot خود بروید → **Configuration**
2. **Microsoft App ID** را کپی کنید → این همان `appId` شماست
3. روی **Manage Password** کلیک کنید → به App Registration بروید
4. زیر **Certificates & secrets** → **New client secret** → **Value** را کپی کنید → این همان `appPassword` شماست
5. به **Overview** بروید → **Directory (tenant) ID** را کپی کنید → این همان `tenantId` شماست

### مرحله ۳: پیکربندی Messaging Endpoint

1. در Azure Bot → **Configuration**
2. **Messaging endpoint** را روی URL Webhook خود تنظیم کنید:
   - تولید: `https://your-domain.com/api/messages`
   - توسعه محلی: از یک تونل استفاده کنید (پایین‌تر [توسعه محلی](#local-development-tunneling) را ببینید)

### مرحله ۴: فعال‌سازی کانال Teams

1. در Azure Bot → **Channels**
2. روی **Microsoft Teams** → Configure → Save کلیک کنید
3. Terms of Service را بپذیرید

### مرحله ۵: ساخت Teams App Manifest

- یک ورودی `bot` با `botId = <App ID>` اضافه کنید.
- Scopeها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای رسیدگی به فایل در scope شخصی لازم است).
- مجوزهای RSC را اضافه کنید (ببینید [مجوزهای فعلی Teams RSC در manifest](#current-teams-rsc-permissions-manifest)).
- آیکون‌ها را بسازید: `outline.png` (32x32) و `color.png` (192x192).
- هر سه فایل را با هم zip کنید: `manifest.json`، `outline.png`، `color.png`.

### مرحله ۶: پیکربندی OpenClaw

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

### مرحله ۷: اجرای Gateway

کانال Teams وقتی Plugin در دسترس باشد و پیکربندی `msteams` با اعتبارنامه‌ها وجود داشته باشد، خودکار شروع می‌شود.

</details>

## احراز هویت فدرال‌شده (گواهی به‌همراه managed identity)

> اضافه‌شده در 2026.4.11

برای استقرارهای تولید، OpenClaw از **احراز هویت فدرال‌شده** به‌عنوان جایگزینی امن‌تر برای client secretها پشتیبانی می‌کند. دو روش در دسترس است:

### گزینه A: احراز هویت مبتنی بر گواهی

از یک گواهی PEM ثبت‌شده با app registration در Entra ID خود استفاده کنید.

**راه‌اندازی:**

1. یک گواهی تولید یا تهیه کنید (فرمت PEM همراه با private key).
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

برای احراز هویت بدون گذرواژه از Azure Managed Identity استفاده کنید. این برای استقرارها روی زیرساخت Azure (AKS، App Service، Azure VMs) که managed identity در دسترس است، ایده‌آل است.

**نحوه کار:**

1. pod/VM ربات یک managed identity دارد (system-assigned یا user-assigned).
2. یک **federated identity credential**، managed identity را به app registration در Entra ID متصل می‌کند.
3. در زمان اجرا، OpenClaw از `@azure/identity` برای گرفتن توکن‌ها از endpoint Azure IMDS (`169.254.169.254`) استفاده می‌کند.
4. توکن برای احراز هویت ربات به Teams SDK داده می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با managed identity فعال (AKS workload identity، App Service، VM)
- federated identity credential ساخته‌شده روی app registration در Entra ID
- دسترسی شبکه به IMDS (`169.254.169.254:80`) از pod/VM

**پیکربندی (system-assigned managed identity):**

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

**پیکربندی (هویت مدیریت‌شده اختصاص‌داده‌شده توسط کاربر):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط برای نوع اختصاص‌داده‌شده توسط کاربر)

### راه‌اندازی هویت بار کاری AKS

برای استقرارهای AKS که از هویت بار کاری استفاده می‌کنند:

1. **هویت بار کاری را فعال کنید** روی کلاستر AKS خود.
2. **یک اعتبار هویت فدره‌شده بسازید** روی ثبت برنامه Entra ID:

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

4. **پاد را برچسب‌گذاری کنید** برای تزریق هویت بار کاری:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **دسترسی شبکه را تضمین کنید** به IMDS (`169.254.169.254`) - اگر از NetworkPolicy استفاده می‌کنید، یک قاعده خروجی اضافه کنید که ترافیک به `169.254.169.254/32` روی پورت 80 را مجاز کند.

### مقایسه نوع احراز هویت

| روش | پیکربندی | مزایا | معایب |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **رمز کلاینت** | `appPassword` | راه‌اندازی ساده | نیازمند چرخش رمز، امنیت کمتر |
| **گواهی** | `authType: "federated"` + `certificatePath` | بدون رمز مشترک روی شبکه | سربار مدیریت گواهی |
| **هویت مدیریت‌شده** | `authType: "federated"` + `useManagedIdentity` | بدون گذرواژه، بدون نیاز به مدیریت رمزها | نیازمند زیرساخت Azure |

**رفتار پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw به‌طور پیش‌فرض از احراز هویت با رمز کلاینت استفاده می‌کند. پیکربندی‌های موجود بدون تغییر همچنان کار می‌کنند.

## توسعه محلی (تونل‌زنی)

Teams نمی‌تواند به `localhost` دسترسی پیدا کند. از یک تونل توسعه پایدار استفاده کنید تا URL شما در همه نشست‌ها ثابت بماند:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

گزینه‌های جایگزین: `ngrok http 3978` یا `tailscale funnel 3978` (URLها ممکن است در هر نشست تغییر کنند).

اگر URL تونل شما تغییر کرد، نقطه پایانی را به‌روزرسانی کنید:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## آزمایش Bot

**اجرای عیب‌یابی:**

```bash
teams app doctor <teamsAppId>
```

ثبت Bot، برنامه AAD، مانیفست، و پیکربندی SSO را در یک گذر بررسی می‌کند.

**ارسال پیام آزمایشی:**

1. برنامه Teams را نصب کنید (از پیوند نصب در `teams app get <id> --install-link` استفاده کنید)
2. Bot را در Teams پیدا کنید و یک پیام مستقیم بفرستید
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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI اختصاص‌داده‌شده توسط کاربر)

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` مبتنی بر Graph برای Microsoft Teams ارائه می‌کند تا عامل‌ها و خودکارسازی‌ها بتوانند جزئیات اعضای کانال (نام نمایشی، ایمیل، نقش) را مستقیماً از Microsoft Graph resolve کنند.

نیازمندی‌ها:

- مجوز RSC با نام `Member.Read.Group` (از قبل در مانیفست پیشنهادی وجود دارد)
- برای جست‌وجوهای بین‌تیمی: مجوز Graph Application با نام `User.Read.All` همراه با رضایت مدیر

این کنش با `channels.msteams.actions.memberInfo` کنترل می‌شود (پیش‌فرض: وقتی اعتبارنامه‌های Graph در دسترس باشند فعال است).

## زمینه تاریخچه

- `channels.msteams.historyLimit` کنترل می‌کند چند پیام اخیر کانال/گروه در prompt بسته‌بندی شوند.
- به `messages.groupChat.historyLimit` بازمی‌گردد. برای غیرفعال‌کردن، `0` را تنظیم کنید (پیش‌فرض 50).
- تاریخچه thread واکشی‌شده با فهرست‌های مجاز فرستنده (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود، بنابراین seed کردن زمینه thread فقط شامل پیام‌های فرستندگان مجاز است.
- زمینه پیوست نقل‌قول‌شده (`ReplyTo*` مشتق‌شده از HTML پاسخ Teams) در حال حاضر همان‌طور که دریافت شده ارسال می‌شود.
- به بیان دیگر، فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند؛ امروز فقط مسیرهای مشخصی از زمینه تکمیلی فیلتر می‌شوند.
- تاریخچه پیام مستقیم را می‌توان با `channels.msteams.dmHistoryLimit` محدود کرد (نوبت‌های کاربر). بازنویسی‌های هر کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

## مجوزهای RSC فعلی Teams (مانیفست)

این‌ها **مجوزهای resourceSpecific موجود** در مانیفست برنامه Teams ما هستند. آن‌ها فقط داخل تیم/گپی اعمال می‌شوند که برنامه در آن نصب شده است.

**برای کانال‌ها (دامنه تیم):**

- `ChannelMessage.Read.Group` (Application) - دریافت همه پیام‌های کانال بدون @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**برای گپ‌های گروهی:**

- `ChatMessage.Read.Chat` (Application) - دریافت همه پیام‌های گپ گروهی بدون @mention

برای افزودن مجوزهای RSC از طریق Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## نمونه مانیفست Teams (ویرایش‌شده)

نمونه‌ای حداقلی و معتبر با فیلدهای مورد نیاز. شناسه‌ها و URLها را جایگزین کنید.

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

### نکات مهم مانیفست (فیلدهای ضروری)

- `bots[].botId` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `webApplicationInfo.id` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `bots[].scopes` باید سطح‌هایی را که قصد استفاده از آن‌ها را دارید شامل شود (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` برای مدیریت فایل در دامنه شخصی الزامی است.
- اگر ترافیک کانال می‌خواهید، `authorization.permissions.resourceSpecific` باید خواندن/ارسال کانال را شامل شود.

### به‌روزرسانی یک برنامه موجود

برای به‌روزرسانی برنامه Teams که از قبل نصب شده است (مثلاً برای افزودن مجوزهای RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

پس از به‌روزرسانی، برنامه را در هر تیم دوباره نصب کنید تا مجوزهای جدید اعمال شوند، و **Teams را کاملاً خارج و دوباره اجرا کنید** (نه فقط بستن پنجره) تا فراداده کش‌شده برنامه پاک شود.

<details>
<summary>به‌روزرسانی دستی مانیفست (بدون CLI)</summary>

1. فایل `manifest.json` خود را با تنظیمات جدید به‌روزرسانی کنید
2. **فیلد `version` را افزایش دهید** (مثلاً `1.0.0` → `1.1.0`)
3. مانیفست را همراه با آیکن‌ها **دوباره zip کنید** (`manifest.json`، `outline.png`، `color.png`)
4. zip جدید را بارگذاری کنید:
   - **Teams Admin Center:** برنامه‌های Teams → مدیریت برنامه‌ها → برنامه خود را پیدا کنید → بارگذاری نسخه جدید
   - **Sideload:** در Teams → برنامه‌ها → مدیریت برنامه‌های شما → بارگذاری یک برنامه سفارشی

</details>

## قابلیت‌ها: فقط RSC در برابر Graph

### با **فقط Teams RSC** (برنامه نصب‌شده، بدون مجوزهای Graph API)

کار می‌کند:

- خواندن محتوای **متنی** پیام کانال.
- ارسال محتوای **متنی** پیام کانال.
- دریافت پیوست‌های فایل **شخصی (پیام مستقیم)**.

کار نمی‌کند:

- **محتوای تصویر یا فایل** کانال/گروه (payload فقط شامل stub HTML است).
- دانلود پیوست‌های ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام (فراتر از رویداد زنده Webhook).

### با **Teams RSC + مجوزهای Microsoft Graph Application**

اضافه می‌کند:

- دانلود محتوای میزبانی‌شده (تصاویر چسبانده‌شده در پیام‌ها).
- دانلود پیوست‌های فایل ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام کانال/گپ از طریق Graph.

### RSC در برابر Graph API

| قابلیت | مجوزهای RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **پیام‌های بی‌درنگ** | بله (از طریق Webhook) | خیر (فقط polling) |
| **پیام‌های تاریخی** | خیر | بله (می‌تواند تاریخچه را query کند) |
| **پیچیدگی راه‌اندازی** | فقط مانیفست برنامه | نیازمند رضایت مدیر + جریان توکن |
| **کار در حالت آفلاین** | خیر (باید در حال اجرا باشد) | بله (query در هر زمان) |

**خلاصه:** RSC برای گوش‌دادن بی‌درنگ است؛ Graph API برای دسترسی تاریخی است. برای جبران پیام‌های ازدست‌رفته در زمان آفلاین، به Graph API با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه و تاریخچه فعال‌شده با Graph (الزامی برای کانال‌ها)

اگر به تصاویر/فایل‌ها در **کانال‌ها** نیاز دارید یا می‌خواهید **تاریخچه پیام** را واکشی کنید، باید مجوزهای Microsoft Graph را فعال کنید و رضایت مدیر را اعطا کنید.

1. در **ثبت برنامه** Entra ID (Azure AD)، مجوزهای **Application** مربوط به Microsoft Graph را اضافه کنید:
   - `ChannelMessage.Read.All` (پیوست‌های کانال + تاریخچه)
   - `Chat.Read.All` یا `ChatMessage.Read.All` (گپ‌های گروهی)
2. **رضایت مدیر را اعطا کنید** برای tenant.
3. **نسخه مانیفست** برنامه Teams را افزایش دهید، دوباره بارگذاری کنید، و **برنامه را در Teams دوباره نصب کنید**.
4. **Teams را کاملاً خارج و دوباره اجرا کنید** تا فراداده کش‌شده برنامه پاک شود.

**مجوز اضافی برای اشاره به کاربران:** @mention کاربران برای کاربران داخل مکالمه به‌صورت پیش‌فرض کار می‌کند. اما اگر می‌خواهید به‌صورت پویا کاربرانی را که **در مکالمه فعلی نیستند** جست‌وجو و mention کنید، مجوز `User.Read.All` (Application) را اضافه کنید و رضایت مدیر را اعطا کنید.

## محدودیت‌های شناخته‌شده

### مهلت زمانی Webhook

Teams پیام‌ها را از طریق Webhook HTTP تحویل می‌دهد. اگر پردازش بیش از حد طول بکشد (مثلاً پاسخ‌های کند LLM)، ممکن است این موارد را ببینید:

- timeoutهای Gateway
- تلاش دوباره Teams برای پیام (که باعث تکراری‌شدن می‌شود)
- پاسخ‌های حذف‌شده

OpenClaw این وضعیت را با برگشت سریع و ارسال پیش‌دستانه پاسخ‌ها مدیریت می‌کند، اما پاسخ‌های بسیار کند هنوز ممکن است مشکل ایجاد کنند.

### قالب‌بندی

Markdown در Teams محدودتر از Slack یا Discord است:

- قالب‌بندی پایه کار می‌کند: **پررنگ**، _کج_، `code`، پیوندها
- markdown پیچیده (جدول‌ها، فهرست‌های تودرتو) ممکن است درست رندر نشود
- Adaptive Cards برای نظرسنجی‌ها و ارسال‌های ارائه معنایی پشتیبانی می‌شود (پایین را ببینید)

## پیکربندی

تنظیمات کلیدی (برای الگوهای مشترک کانال، `/gateway/configuration` را ببینید):

- `channels.msteams.enabled`: فعال/غیرفعال کردن کانال.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اعتبارنامه‌های بات.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`)
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing)
- `channels.msteams.allowFrom`: فهرست مجاز پیام مستقیم (شناسه‌های شیء AAD توصیه می‌شوند). وقتی دسترسی Graph موجود باشد، جادوگر هنگام راه‌اندازی نام‌ها را به شناسه‌ها تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: کلید اضطراری برای فعال‌سازی دوباره تطبیق قابل‌تغییر UPN/نام نمایشی و مسیریابی مستقیم بر اساس نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازه بخش متن خروجی.
- `channels.msteams.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خطوط خالی (مرزهای پاراگراف) پیش از بخش‌بندی طولی.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز میزبان‌های پیوست ورودی (به‌طور پیش‌فرض دامنه‌های Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای افزودن سرآیندهای Authorization در تلاش‌های دوباره رسانه (به‌طور پیش‌فرض میزبان‌های Graph + Bot Framework).
- `channels.msteams.requireMention`: الزام @mention در کانال‌ها/گروه‌ها (پیش‌فرض true).
- `channels.msteams.replyStyle`: `thread | top-level` ([سبک پاسخ](#reply-style-threads-vs-posts) را ببینید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر تیم (`allow`/`deny`/`alsoAllow`) که وقتی بازنویسی کانال وجود ندارد استفاده می‌شود.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر تیم و هر فرستنده (wildcard با `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های سیاست ابزار برای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های سیاست ابزار برای هر کانال و هر فرستنده (wildcard با `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند:
  `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.actions.memberInfo`: فعال یا غیرفعال کردن کنش اطلاعات عضو مبتنی بر Graph (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).
- `channels.msteams.authType`: نوع احراز هویت - `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (احراز هویت federated + certificate).
- `channels.msteams.certificateThumbprint`: اثرانگشت گواهی (اختیاری، برای احراز هویت لازم نیست).
- `channels.msteams.useManagedIdentity`: فعال کردن احراز هویت managed identity (حالت federated).
- `channels.msteams.managedIdentityClientId`: شناسه کلاینت برای managed identity تخصیص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسه سایت SharePoint برای بارگذاری فایل در گفتگوهای گروهی/کانال‌ها ([ارسال فایل‌ها در گفتگوهای گروهی](#sending-files-in-group-chats) را ببینید).

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد عامل پیروی می‌کنند ([/concepts/session](/fa/concepts/session) را ببینید):
  - پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسه گفتگو استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams اخیراً دو سبک رابط کاربری کانال را روی یک مدل داده زیربنایی یکسان معرفی کرده است:

| سبک                     | توضیح                                                        | `replyStyle` پیشنهادی |
| ----------------------- | ------------------------------------------------------------ | --------------------- |
| **پست‌ها** (کلاسیک)     | پیام‌ها به‌صورت کارت‌هایی با پاسخ‌های رشته‌ای در زیر آن‌ها ظاهر می‌شوند | `thread` (پیش‌فرض)    |
| **رشته‌ها** (شبیه Slack) | پیام‌ها خطی جریان می‌یابند، بیشتر شبیه Slack                 | `top-level`           |

**مشکل:** API ‏Teams مشخص نمی‌کند که یک کانال از کدام سبک رابط کاربری استفاده می‌کند. اگر از `replyStyle` نادرست استفاده کنید:

- `thread` در کانالی با سبک Threads → پاسخ‌ها به‌شکل نامناسبی تو در تو ظاهر می‌شوند
- `top-level` در کانالی با سبک Posts → پاسخ‌ها به‌جای داخل رشته، به‌صورت پست‌های جداگانه سطح بالا ظاهر می‌شوند

**راه‌حل:** `replyStyle` را برای هر کانال بر اساس نحوه تنظیم کانال پیکربندی کنید:

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

## پیوست‌ها و تصاویر

**محدودیت‌های فعلی:**

- **پیام‌های مستقیم:** تصاویر و پیوست‌های فایل از طریق APIهای فایل بات Teams کار می‌کنند.
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 (SharePoint/OneDrive) قرار می‌گیرند. بار داده Webhook فقط یک HTML stub دارد، نه بایت‌های واقعی فایل. **مجوزهای Graph API لازم هستند** تا پیوست‌های کانال دانلود شوند.
- برای ارسال‌های صریح با اولویت فایل، از `action=upload-file` همراه با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود، و `filename` نام بارگذاری‌شده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانال دارای تصویر فقط به‌صورت متن دریافت می‌شوند (محتوای تصویر برای بات قابل دسترسی نیست).
به‌طور پیش‌فرض، OpenClaw فقط رسانه را از نام‌های میزبان Microsoft/Teams دانلود می‌کند. با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای مجاز کردن هر میزبان از `["*"]` استفاده کنید).
سرآیندهای Authorization فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` اضافه می‌شوند (به‌طور پیش‌فرض میزبان‌های Graph + Bot Framework). این فهرست را سخت‌گیرانه نگه دارید (از پسوندهای چندمستاجره پرهیز کنید).

## ارسال فایل‌ها در گفتگوهای گروهی

بات‌ها می‌توانند فایل‌ها را در پیام‌های مستقیم با جریان FileConsentCard ارسال کنند (داخلی). بااین‌حال، **ارسال فایل‌ها در گفتگوهای گروهی/کانال‌ها** به راه‌اندازی بیشتری نیاز دارد:

| زمینه                   | فایل‌ها چگونه ارسال می‌شوند                       | راه‌اندازی لازم                                  |
| ----------------------- | -------------------------------------------------- | ----------------------------------------------- |
| **پیام‌های مستقیم**     | FileConsentCard → کاربر می‌پذیرد → بات بارگذاری می‌کند | بدون پیکربندی اضافی کار می‌کند                  |
| **گفتگوهای گروهی/کانال‌ها** | بارگذاری در SharePoint → اشتراک‌گذاری پیوند       | به `sharePointSiteId` + مجوزهای Graph نیاز دارد |
| **تصاویر (هر زمینه‌ای)** | درون‌خطی با کدگذاری Base64                         | بدون پیکربندی اضافی کار می‌کند                  |

### چرا گفتگوهای گروهی به SharePoint نیاز دارند

بات‌ها drive شخصی OneDrive ندارند (نقطه پایانی `/me/drive` در Graph API برای هویت‌های برنامه کار نمی‌کند). برای ارسال فایل‌ها در گفتگوهای گروهی/کانال‌ها، بات در یک **سایت SharePoint** بارگذاری می‌کند و یک پیوند اشتراک‌گذاری می‌سازد.

### راه‌اندازی

1. **مجوزهای Graph API را اضافه کنید** در Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - بارگذاری فایل‌ها در SharePoint
   - `Chat.Read.All` (Application) - اختیاری، پیوندهای اشتراک‌گذاری برای هر کاربر را فعال می‌کند

2. **رضایت مدیر** را برای مستاجر اعطا کنید.

3. **شناسه سایت SharePoint خود را بگیرید:**

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

| مجوز                                    | رفتار اشتراک‌گذاری                                          |
| -------------------------------------- | ------------------------------------------------------------ |
| فقط `Sites.ReadWrite.All`              | پیوند اشتراک‌گذاری در سطح سازمان (هرکسی در سازمان می‌تواند دسترسی داشته باشد) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | پیوند اشتراک‌گذاری برای هر کاربر (فقط اعضای گفتگو می‌توانند دسترسی داشته باشند) |

اشتراک‌گذاری برای هر کاربر امن‌تر است، چون فقط شرکت‌کنندگان گفتگو می‌توانند به فایل دسترسی داشته باشند. اگر مجوز `Chat.Read.All` وجود نداشته باشد، بات به اشتراک‌گذاری در سطح سازمان بازمی‌گردد.

### رفتار جایگزین

| سناریو                                             | نتیجه                                               |
| -------------------------------------------------- | --------------------------------------------------- |
| گفتگوی گروهی + فایل + `sharePointSiteId` پیکربندی‌شده | بارگذاری در SharePoint، ارسال پیوند اشتراک‌گذاری    |
| گفتگوی گروهی + فایل + بدون `sharePointSiteId`       | تلاش برای بارگذاری در OneDrive (ممکن است شکست بخورد)، فقط ارسال متن |
| گفتگوی شخصی + فایل                                 | جریان FileConsentCard (بدون SharePoint کار می‌کند) |
| هر زمینه‌ای + تصویر                                | درون‌خطی با کدگذاری Base64 (بدون SharePoint کار می‌کند) |

### محل ذخیره فایل‌ها

فایل‌های بارگذاری‌شده در پوشه `/OpenClawShared/` در کتابخانه اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (Adaptive Cards)

OpenClaw نظرسنجی‌های Teams را به‌صورت Adaptive Cards ارسال می‌کند (API بومی نظرسنجی Teams وجود ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- رأی‌ها توسط Gateway در `~/.openclaw/msteams-polls.json` ثبت می‌شوند.
- Gateway باید آنلاین بماند تا رأی‌ها ثبت شوند.
- نظرسنجی‌ها هنوز خلاصه نتایج را خودکار منتشر نمی‌کنند (در صورت نیاز فایل ذخیره‌سازی را بررسی کنید).

## کارت‌های ارائه

بارهای داده ارائه معنایی را با استفاده از ابزار `message` یا CLI به کاربران یا گفتگوهای Teams ارسال کنید. OpenClaw آن‌ها را از قرارداد ارائه عمومی به‌صورت Teams Adaptive Cards رندر می‌کند.

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

برای جزئیات قالب هدف، [قالب‌های هدف](#target-formats) را در پایین ببینید.

## قالب‌های هدف

هدف‌های MSTeams از پیشوندها برای تمایز میان کاربران و گفتگوها استفاده می‌کنند:

| نوع هدف             | قالب                            | مثال                                               |
| ------------------- | -------------------------------- | -------------------------------------------------- |
| کاربر (بر اساس شناسه) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`        |
| کاربر (بر اساس نام) | `user:<display-name>`            | `user:John Smith` (به Graph API نیاز دارد)         |
| گروه/کانال          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| گروه/کانال (خام)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (اگر شامل `@thread` باشد) |

**نمونه‌های CLI:**

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

**نمونه‌های ابزار عامل:**

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
بدون پیشوند `user:`، نام‌ها به‌طور پیش‌فرض با گروه یا تیم تطبیق داده می‌شوند. هنگام هدف‌گیری افراد بر اساس نام نمایشی، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **پس از** تعامل کاربر ممکن هستند، چون در همان نقطه ارجاع‌های گفتگو را ذخیره می‌کنیم.
- برای `dmPolicy` و محدودسازی با فهرست مجاز، `/gateway/configuration` را ببینید.

## شناسه‌های تیم و کانال (دام رایج)

پارامتر پرس‌وجوی `groupId` در URLهای Teams، شناسه تیمی که برای پیکربندی استفاده می‌شود **نیست**. به‌جای آن، شناسه‌ها را از مسیر URL استخراج کنید:

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

- کلید تیم = بخش مسیر پس از `/team/` (URL-decoded، برای مثال `19:Bk4j...@thread.tacv2`؛ مستأجرهای قدیمی‌تر ممکن است `@thread.skype` را نشان دهند که آن هم معتبر است)
- کلید کانال = بخش مسیر پس از `/channel/` (URL-decoded)
- پارامتر پرس‌وجوی `groupId` را برای مسیریابی OpenClaw **نادیده بگیرید**. این شناسه گروه Microsoft Entra است، نه شناسه گفتگوی Bot Framework که در فعالیت‌های ورودی Teams استفاده می‌شود.

## کانال‌های خصوصی

بات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت                      | کانال‌های استاندارد | کانال‌های خصوصی       |
| ---------------------------- | ----------------- | ---------------------- |
| نصب بات             | بله               | محدود                |
| پیام‌های بی‌درنگ (Webhook) | بله               | ممکن است کار نکند           |
| مجوزهای RSC              | بله               | ممکن است رفتار متفاوتی داشته باشد |
| اشاره‌ها با @                    | بله               | اگر بات قابل دسترسی باشد   |
| تاریخچه Graph API            | بله               | بله (با مجوزها) |

**راهکارها اگر کانال‌های خصوصی کار نمی‌کنند:**

1. از کانال‌های استاندارد برای تعامل با بات استفاده کنید
2. از پیام‌های مستقیم استفاده کنید - کاربران همیشه می‌توانند مستقیما به بات پیام بدهند
3. برای دسترسی تاریخی از Graph API استفاده کنید (نیازمند `ChannelMessage.Read.All`)

## عیب‌یابی

### مشکلات رایج

- **نمایش داده نشدن تصاویر در کانال‌ها:** مجوزهای Graph یا رضایت مدیر وجود ندارد. برنامه Teams را دوباره نصب کنید و Teams را کامل ببندید و دوباره باز کنید.
- **پاسخی در کانال دریافت نمی‌شود:** به‌طور پیش‌فرض اشاره‌ها الزامی هستند؛ `channels.msteams.requireMention=false` را تنظیم کنید یا برای هر تیم/کانال پیکربندی کنید.
- **ناهمخوانی نسخه (Teams هنوز مانیفست قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و برای تازه‌سازی، Teams را کامل ببندید.
- **401 Unauthorized از Webhook:** هنگام آزمایش دستی بدون Azure JWT مورد انتظار است - یعنی endpoint قابل دسترسی است اما احراز هویت شکست خورده است. برای آزمایش درست از Azure Web Chat استفاده کنید.

### خطاهای بارگذاری مانیفست

- **"Icon file cannot be empty":** مانیفست به فایل‌های آیکنی اشاره می‌کند که 0 بایت هستند. آیکن‌های PNG معتبر بسازید (32x32 برای `outline.png`، 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه هنوز در تیم/چت دیگری نصب است. ابتدا آن را پیدا و حذف نصب کنید، یا 5 تا 10 دقیقه برای انتشار تغییرات صبر کنید.
- **"Something went wrong" هنگام بارگذاری:** به‌جای آن از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بارگذاری کنید، DevTools مرورگر (F12) → زبانه Network را باز کنید و بدنه پاسخ را برای خطای واقعی بررسی کنید.
- **شکست در sideload:** به‌جای "Upload a custom app"، گزینه "Upload an app to your org's app catalog" را امتحان کنید - این کار اغلب محدودیت‌های sideload را دور می‌زند.

### مجوزهای RSC کار نمی‌کنند

1. بررسی کنید `webApplicationInfo.id` دقیقا با App ID بات شما مطابقت دارد
2. برنامه را دوباره بارگذاری و در تیم/چت دوباره نصب کنید
3. بررسی کنید آیا مدیر سازمان شما مجوزهای RSC را مسدود کرده است
4. مطمئن شوید از scope درست استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای چت‌های گروهی

## منابع

- [ایجاد Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - ایجاد/مدیریت برنامه‌های Teams
- [طرح‌واره مانیفست برنامه Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل بات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI برای مدیریت بات

## مرتبط

- [مرور کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و دروازه‌گذاری اشاره‌ها
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
