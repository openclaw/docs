---
read_when:
    - کار روی قابلیت‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی بات Microsoft Teams، قابلیت‌ها و پیکربندی
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-02T22:16:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: f26d6403934a654ef847aff1563500649083598cfdcb3d463890706e31480525
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: پیوست‌های متن و DM پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (ببینید [ارسال فایل در چت‌های گروهی](#sending-files-in-group-chats)). نظرسنجی‌ها از طریق Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌های فایل‌محور ارائه می‌کنند.

## Plugin همراه

Microsoft Teams در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه ارائه می‌شود، بنابراین در بیلد بسته‌بندی‌شده معمولی نیازی به نصب جداگانه نیست.

اگر از بیلد قدیمی‌تر یا نصب سفارشی‌ای استفاده می‌کنید که Teams همراه را حذف کرده است، بسته npm را مستقیماً نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

برای دنبال‌کردن تگ انتشار رسمی فعلی، از بسته خام استفاده کنید. نسخه دقیق را فقط زمانی سنجاق کنید که به نصب بازتولیدپذیر نیاز دارید.

checkout محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت بات، ایجاد manifest و تولید اعتبارنامه را در یک فرمان انجام می‌دهد.

**۱. نصب و ورود**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI در حال حاضر در حالت پیش‌نمایش است. فرمان‌ها و flagها ممکن است بین نسخه‌ها تغییر کنند.
</Note>

**۲. شروع یک تونل** (Teams نمی‌تواند به localhost دسترسی پیدا کند)

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
`--allow-anonymous` لازم است چون Teams نمی‌تواند با devtunnels احراز هویت کند. هر درخواست ورودی بات همچنان به‌طور خودکار توسط Teams SDK اعتبارسنجی می‌شود.
</Note>

جایگزین‌ها: `ngrok http 3978` یا `tailscale funnel 3978` (اما ممکن است این‌ها در هر نشست URLها را تغییر دهند).

**۳. ایجاد اپ**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این فرمان واحد:

- یک برنامه Entra ID (Azure AD) ایجاد می‌کند
- یک client secret تولید می‌کند
- یک manifest اپ Teams می‌سازد و بارگذاری می‌کند (با آیکن‌ها)
- بات را ثبت می‌کند (به‌صورت پیش‌فرض مدیریت‌شده توسط Teams — بدون نیاز به اشتراک Azure)

خروجی `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID` و یک **Teams App ID** را نشان می‌دهد — این‌ها را برای مراحل بعدی یادداشت کنید. همچنین پیشنهاد می‌دهد اپ را مستقیماً در Teams نصب کنید.

**۴. پیکربندی OpenClaw** با استفاده از اعتبارنامه‌های خروجی:

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

یا از متغیرهای محیطی به‌طور مستقیم استفاده کنید: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

**۵. نصب اپ در Teams**

`teams app create` از شما می‌خواهد اپ را نصب کنید — «Install in Teams» را انتخاب کنید. اگر از آن عبور کردید، بعداً می‌توانید لینک را دریافت کنید:

```bash
teams app get <teamsAppId> --install-link
```

**۶. اطمینان از کارکرد همه‌چیز**

```bash
teams app doctor <teamsAppId>
```

این فرمان diagnostics را در ثبت بات، پیکربندی اپ AAD، اعتبار manifest و راه‌اندازی SSO اجرا می‌کند.

برای استقرارهای production، به‌جای client secrets از [احراز هویت federated](/fa/channels/msteams#federated-authentication-certificate-plus-managed-identity) (گواهی یا managed identity) استفاده کنید.

<Note>
چت‌های گروهی به‌صورت پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای اجازه‌دادن به پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` برای اجازه‌دادن به هر عضو (با gating مبتنی بر mention) استفاده کنید.
</Note>

## اهداف

- گفت‌وگو با OpenClaw از طریق DMهای Teams، چت‌های گروهی یا کانال‌ها.
- نگه‌داشتن routing به‌صورت قطعی: پاسخ‌ها همیشه به همان کانالی برمی‌گردند که از آن آمده‌اند.
- رفتار امن کانال را پیش‌فرض قرار دهید (mentionها لازم هستند مگر اینکه طور دیگری پیکربندی شده باشد).

## نوشتن پیکربندی

به‌صورت پیش‌فرض، Microsoft Teams اجازه دارد به‌روزرسانی‌های پیکربندی‌ای را که با `/config set|unset` فعال می‌شوند بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (DMها + گروه‌ها)

**دسترسی DM**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستنده‌های ناشناس تا زمان تأیید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از object IDهای پایدار AAD استفاده کند.
- برای allowlistها به تطبیق UPN/نام نمایشی تکیه نکنید — آن‌ها می‌توانند تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌صورت پیش‌فرض غیرفعال می‌کند؛ با `channels.msteams.dangerouslyAllowNameMatching: true` صراحتاً آن را فعال کنید.
- wizard می‌تواند زمانی که اعتبارنامه‌ها اجازه دهند، نام‌ها را از طریق Microsoft Graph به IDها resolve کند.

**دسترسی گروه**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است مگر اینکه `groupAllowFrom` را اضافه کنید). برای override کردن پیش‌فرض در حالت تنظیم‌نشده، از `channels.defaults.groupPolicy` استفاده کنید.
- `channels.msteams.groupAllowFrom` کنترل می‌کند کدام فرستنده‌ها می‌توانند در چت‌های گروهی/کانال‌ها فعال‌سازی انجام دهند (به `channels.msteams.allowFrom` fallback می‌کند).
- `groupPolicy: "open"` را تنظیم کنید تا به هر عضو اجازه داده شود (همچنان به‌صورت پیش‌فرض با mention-gated).
- برای اجازه‌ندادن به **هیچ کانالی**، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

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

**Teams + allowlist کانال**

- با فهرست‌کردن تیم‌ها و کانال‌ها زیر `channels.msteams.teams`، پاسخ‌های گروه/کانال را scope کنید.
- کلیدها باید از IDهای پایدار گفت‌وگوی Teams از لینک‌های Teams استفاده کنند، نه نام‌های نمایشی قابل‌تغییر.
- وقتی `groupPolicy="allowlist"` است و allowlist تیم‌ها وجود دارد، فقط تیم‌ها/کانال‌های فهرست‌شده پذیرفته می‌شوند (mention-gated).
- wizard پیکربندی، ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام startup، OpenClaw نام‌های allowlist تیم/کانال و کاربر را به IDها resolve می‌کند (وقتی مجوزهای Graph اجازه دهند)
  و mapping را log می‌کند؛ نام‌های resolveنشده تیم/کانال همان‌طور که تایپ شده‌اند نگه داشته می‌شوند اما به‌صورت پیش‌فرض برای routing نادیده گرفته می‌شوند مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` فعال باشد.

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

اگر نمی‌توانید از Teams CLI استفاده کنید، می‌توانید بات را به‌صورت دستی از طریق Azure Portal راه‌اندازی کنید.

### نحوه کار

1. مطمئن شوید Plugin مربوط به Microsoft Teams در دسترس است (در نسخه‌های فعلی همراه است).
2. یک **Azure Bot** ایجاد کنید (App ID + secret + tenant ID).
3. یک **بسته اپ Teams** بسازید که به بات ارجاع دهد و مجوزهای RSC زیر را شامل شود.
4. اپ Teams را در یک تیم (یا scope شخصی برای DMها) بارگذاری/نصب کنید.
5. `msteams` را در `~/.openclaw/openclaw.json` (یا env vars) پیکربندی کنید و Gateway را شروع کنید.
6. Gateway به‌صورت پیش‌فرض برای ترافیک Webhook Bot Framework روی `/api/messages` گوش می‌دهد.

### گام ۱: ایجاد Azure Bot

1. به [ایجاد Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید
2. تب **Basics** را پر کنید:

   | فیلد              | مقدار                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | نام بات شما، برای مثال `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription**   | اشتراک Azure خود را انتخاب کنید                           |
   | **Resource group** | گروه جدید ایجاد کنید یا از موجود استفاده کنید                               |
   | **Pricing tier**   | **Free** برای توسعه/آزمون                                 |
   | **Type of App**    | **Single Tenant** (توصیه‌شده - یادداشت زیر را ببینید)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
ایجاد بات‌های multi-tenant جدید پس از 2025-07-31 منسوخ شد. برای بات‌های جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** → **Create** کلیک کنید (حدود ۱ تا ۲ دقیقه صبر کنید)

### گام ۲: دریافت اعتبارنامه‌ها

1. به منبع Azure Bot خود بروید → **Configuration**
2. **Microsoft App ID** را کپی کنید → این `appId` شماست
3. روی **Manage Password** کلیک کنید → به App Registration بروید
4. زیر **Certificates & secrets** → **New client secret** → **Value** را کپی کنید → این `appPassword` شماست
5. به **Overview** بروید → **Directory (tenant) ID** را کپی کنید → این `tenantId` شماست

### گام ۳: پیکربندی Messaging Endpoint

1. در Azure Bot → **Configuration**
2. **Messaging endpoint** را روی URL Webhook خود تنظیم کنید:
   - Production: `https://your-domain.com/api/messages`
   - توسعه محلی: از یک تونل استفاده کنید (بخش [توسعه محلی](#local-development-tunneling) را در پایین ببینید)

### گام ۴: فعال‌سازی کانال Teams

1. در Azure Bot → **Channels**
2. روی **Microsoft Teams** → Configure → Save کلیک کنید
3. شرایط سرویس را بپذیرید

### گام ۵: ساخت Teams App Manifest

- یک ورودی `bot` با `botId = <App ID>` اضافه کنید.
- Scopeها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای مدیریت فایل در scope شخصی لازم است).
- مجوزهای RSC را اضافه کنید (بخش [مجوزهای RSC](#current-teams-rsc-permissions-manifest) را ببینید).
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

کانال Teams زمانی که Plugin در دسترس باشد و پیکربندی `msteams` با اعتبارنامه‌ها وجود داشته باشد، به‌صورت خودکار شروع می‌شود.

</details>

## احراز هویت federated (گواهی به‌همراه managed identity)

> در 2026.4.11 اضافه شد

برای استقرارهای production، OpenClaw از **احراز هویت federated** به‌عنوان جایگزینی امن‌تر برای client secrets پشتیبانی می‌کند. دو روش در دسترس است:

### گزینه A: احراز هویت مبتنی بر گواهی

از یک گواهی PEM ثبت‌شده در app registration مربوط به Entra ID خود استفاده کنید.

**راه‌اندازی:**

1. یک گواهی (فرمت PEM با کلید خصوصی) تولید یا دریافت کنید.
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

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### گزینه B: Azure Managed Identity

از Azure Managed Identity برای احراز هویت بدون گذرواژه استفاده کنید. این گزینه برای استقرارها روی زیرساخت Azure (AKS، App Service، VMهای Azure) که managed identity در دسترس است، ایده‌آل است.

**نحوه کار:**

1. pod/VM بات یک managed identity دارد (system-assigned یا user-assigned).
2. یک **federated identity credential**، managed identity را به app registration مربوط به Entra ID وصل می‌کند.
3. در زمان اجرا، OpenClaw از `@azure/identity` برای دریافت tokenها از endpoint Azure IMDS (`169.254.169.254`) استفاده می‌کند.
4. token برای احراز هویت بات به Teams SDK ارسال می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با managed identity فعال (AKS workload identity، App Service، VM)
- federated identity credential ایجادشده روی app registration مربوط به Entra ID
- دسترسی شبکه به IMDS (`169.254.169.254:80`) از pod/VM

**پیکربندی (managed identity از نوع system-assigned):**

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

**پیکربندی (هویت مدیریت‌شده اختصاص‌یافته به کاربر):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط برای اختصاص‌یافته به کاربر)

### راه‌اندازی هویت بار کاری AKS

برای استقرارهای AKS که از هویت بار کاری استفاده می‌کنند:

1. **هویت بار کاری را فعال کنید** روی خوشه AKS خود.
2. **یک اعتبارنامه هویت فدرال بسازید** روی ثبت برنامه Entra ID:

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

5. **دسترسی شبکه را تضمین کنید** به IMDS (`169.254.169.254`) — اگر از NetworkPolicy استفاده می‌کنید، یک قاعده خروجی اضافه کنید که ترافیک به `169.254.169.254/32` روی پورت 80 را مجاز کند.

### مقایسه نوع احراز هویت

| روش | پیکربندی | مزایا | معایب |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **رمز کلاینت** | `appPassword` | راه‌اندازی ساده | نیازمند چرخش رمز، امنیت کمتر |
| **گواهی‌نامه** | `authType: "federated"` + `certificatePath` | بدون رمز مشترک روی شبکه | سربار مدیریت گواهی‌نامه |
| **هویت مدیریت‌شده** | `authType: "federated"` + `useManagedIdentity` | بدون گذرواژه، بدون نیاز به مدیریت رمزها | نیازمند زیرساخت Azure |

**رفتار پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw به‌طور پیش‌فرض از احراز هویت با رمز کلاینت استفاده می‌کند. پیکربندی‌های موجود بدون تغییر همچنان کار می‌کنند.

## توسعه محلی (تونل‌سازی)

Teams نمی‌تواند به `localhost` دسترسی پیدا کند. از یک تونل توسعه پایدار استفاده کنید تا URL شما در همه نشست‌ها یکسان بماند:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

جایگزین‌ها: `ngrok http 3978` یا `tailscale funnel 3978` (ممکن است URLها در هر نشست تغییر کنند).

اگر URL تونل شما تغییر کرد، نقطه پایانی را به‌روزرسانی کنید:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## آزمایش ربات

**اجرای عیب‌یابی‌ها:**

```bash
teams app doctor <teamsAppId>
```

ثبت ربات، برنامه AAD، مانیفست، و پیکربندی SSO را در یک گذر بررسی می‌کند.

**ارسال پیام آزمایشی:**

1. برنامه Teams را نصب کنید (از پیوند نصب از `teams app get <id> --install-link` استفاده کنید)
2. ربات را در Teams پیدا کنید و یک پیام مستقیم ارسال کنید
3. گزارش‌های Gateway را برای فعالیت ورودی بررسی کنید

## متغیرهای محیطی

همه کلیدهای پیکربندی را می‌توان به‌جای آن از طریق متغیرهای محیطی تنظیم کرد:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختیاری: `"secret"` یا `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (فدرال + گواهی‌نامه)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختیاری، برای احراز هویت لازم نیست)
- `MSTEAMS_USE_MANAGED_IDENTITY` (فدرال + هویت مدیریت‌شده)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI اختصاص‌یافته به کاربر)

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` مبتنی بر Graph برای Microsoft Teams ارائه می‌کند تا عامل‌ها و خودکارسازی‌ها بتوانند جزئیات اعضای کانال (نام نمایشی، ایمیل، نقش) را مستقیما از Microsoft Graph resolve کنند.

نیازمندی‌ها:

- مجوز RSC به نام `Member.Read.Group` (از قبل در مانیفست پیشنهادی وجود دارد)
- برای جست‌وجوهای بین‌تیمی: مجوز Graph Application به نام `User.Read.All` با رضایت مدیر

این کنش با `channels.msteams.actions.memberInfo` کنترل می‌شود (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).

## زمینه تاریخچه

- `channels.msteams.historyLimit` کنترل می‌کند چند پیام اخیر کانال/گروه در prompt پیچیده شوند.
- به `messages.groupChat.historyLimit` برمی‌گردد. برای غیرفعال‌سازی، `0` را تنظیم کنید (پیش‌فرض 50).
- تاریخچه واکشی‌شده رشته بر اساس فهرست‌های مجاز فرستنده (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود، بنابراین seed کردن زمینه رشته فقط شامل پیام‌های فرستندگان مجاز است.
- زمینه پیوست نقل‌قول‌شده (`ReplyTo*` مشتق‌شده از HTML پاسخ Teams) در حال حاضر همان‌طور که دریافت شده عبور داده می‌شود.
- به بیان دیگر، فهرست‌های مجاز کنترل می‌کنند چه کسی می‌تواند عامل را فعال کند؛ امروز فقط مسیرهای مشخص زمینه تکمیلی فیلتر می‌شوند.
- تاریخچه DM را می‌توان با `channels.msteams.dmHistoryLimit` (نوبت‌های کاربر) محدود کرد. بازنویسی‌های مخصوص هر کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

## مجوزهای RSC فعلی Teams (مانیفست)

این‌ها **مجوزهای resourceSpecific موجود** در مانیفست برنامه Teams ما هستند. آن‌ها فقط داخل تیم/چتی اعمال می‌شوند که برنامه در آن نصب شده است.

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

## نمونه مانیفست Teams (ویرایش‌شده)

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

### نکات مهم مانیفست (فیلدهای الزامی)

- `bots[].botId` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `webApplicationInfo.id` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `bots[].scopes` باید سطوحی را شامل شود که قصد استفاده از آن‌ها را دارید (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` برای مدیریت فایل در دامنه شخصی لازم است.
- اگر ترافیک کانال را می‌خواهید، `authorization.permissions.resourceSpecific` باید خواندن/ارسال کانال را شامل شود.

### به‌روزرسانی یک برنامه موجود

برای به‌روزرسانی برنامه Teams که از قبل نصب شده است (مثلا برای افزودن مجوزهای RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

پس از به‌روزرسانی، برنامه را در هر تیم دوباره نصب کنید تا مجوزهای جدید اعمال شوند، و **Teams را کاملا ببندید و دوباره اجرا کنید** (نه فقط بستن پنجره) تا فراداده برنامه کش‌شده پاک شود.

<details>
<summary>به‌روزرسانی دستی مانیفست (بدون CLI)</summary>

1. `manifest.json` خود را با تنظیمات جدید به‌روزرسانی کنید
2. **فیلد `version` را افزایش دهید** (مثلا `1.0.0` → `1.1.0`)
3. مانیفست را همراه با آیکن‌ها (`manifest.json`، `outline.png`، `color.png`) **دوباره zip کنید**
4. zip جدید را بارگذاری کنید:
   - **Teams Admin Center:** برنامه‌های Teams → مدیریت برنامه‌ها → برنامه خود را پیدا کنید → بارگذاری نسخه جدید
   - **Sideload:** در Teams → Apps → مدیریت برنامه‌های شما → بارگذاری یک برنامه سفارشی

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

| قابلیت | مجوزهای RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **پیام‌های بلادرنگ** | بله (از طریق Webhook) | نه (فقط polling) |
| **پیام‌های تاریخی** | نه | بله (امکان query تاریخچه) |
| **پیچیدگی راه‌اندازی** | فقط مانیفست برنامه | نیازمند رضایت مدیر + جریان token |
| **کارکرد آفلاین** | نه (باید در حال اجرا باشد) | بله (query در هر زمان) |

**جمع‌بندی:** RSC برای شنود بلادرنگ است؛ Graph API برای دسترسی تاریخی است. برای رسیدگی به پیام‌های ازدست‌رفته هنگام آفلاین بودن، به Graph API با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه و تاریخچه فعال‌شده با Graph (لازم برای کانال‌ها)

اگر به تصاویر/فایل‌ها در **کانال‌ها** نیاز دارید یا می‌خواهید **تاریخچه پیام** را واکشی کنید، باید مجوزهای Microsoft Graph را فعال کنید و رضایت مدیر را بدهید.

1. در **ثبت برنامه** Entra ID (Azure AD)، مجوزهای **Application** مربوط به Microsoft Graph را اضافه کنید:
   - `ChannelMessage.Read.All` (پیوست‌های کانال + تاریخچه)
   - `Chat.Read.All` یا `ChatMessage.Read.All` (چت‌های گروهی)
2. **رضایت مدیر را بدهید** برای tenant.
3. **نسخه مانیفست** برنامه Teams را افزایش دهید، دوباره بارگذاری کنید، و **برنامه را در Teams دوباره نصب کنید**.
4. **Teams را کاملا ببندید و دوباره اجرا کنید** تا فراداده برنامه کش‌شده پاک شود.

**مجوز اضافی برای mention کردن کاربران:** @mention کاربران برای کاربرانی که در مکالمه هستند بدون تنظیم اضافی کار می‌کند. با این حال، اگر می‌خواهید کاربرانی را که **در مکالمه فعلی نیستند** به‌صورت پویا جست‌وجو و mention کنید، مجوز `User.Read.All` (Application) را اضافه کنید و رضایت مدیر را بدهید.

## محدودیت‌های شناخته‌شده

### زمان‌پایان‌های Webhook

Teams پیام‌ها را از طریق HTTP Webhook تحویل می‌دهد. اگر پردازش بیش از حد طول بکشد (مثلا پاسخ‌های کند LLM)، ممکن است این موارد را ببینید:

- زمان‌پایان‌های Gateway
- Teams پیام را دوباره تلاش می‌کند (باعث ایجاد موارد تکراری می‌شود)
- پاسخ‌های حذف‌شده

OpenClaw این را با بازگشت سریع و ارسال پاسخ‌ها به‌صورت پیش‌دستانه مدیریت می‌کند، اما پاسخ‌های بسیار کند همچنان ممکن است مشکل ایجاد کنند.

### قالب‌بندی

Markdown در Teams محدودتر از Slack یا Discord است:

- قالب‌بندی پایه کار می‌کند: **bold**، _italic_، `code`، پیوندها
- Markdown پیچیده (جدول‌ها، فهرست‌های تو در تو) ممکن است درست رندر نشود
- کارت‌های تطبیقی برای نظرسنجی‌ها و ارسال‌های ارائه‌ی معنایی پشتیبانی می‌شوند (پایین را ببینید)

## پیکربندی

تنظیمات کلیدی (برای الگوهای مشترک کانال، `/gateway/configuration` را ببینید):

- `channels.msteams.enabled`: فعال/غیرفعال کردن کانال.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اعتبارنامه‌های بات.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`)
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing)
- `channels.msteams.allowFrom`: فهرست مجاز DM (شناسه‌های شیء AAD توصیه می‌شوند). راه‌انداز هنگام نصب، در صورت دسترسی به Graph، نام‌ها را به شناسه تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: سوییچ اضطراری برای فعال‌سازی دوباره‌ی تطبیق قابل‌تغییر UPN/نام نمایشی و مسیریابی مستقیم نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازه‌ی تکه‌ی متن خروجی.
- `channels.msteams.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خط‌های خالی (مرزهای پاراگراف) پیش از تکه‌سازی بر اساس طول.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز میزبان‌های پیوست ورودی (به‌طور پیش‌فرض دامنه‌های Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای افزودن سرآیندهای Authorization هنگام تلاش دوباره برای رسانه (به‌طور پیش‌فرض میزبان‌های Graph + Bot Framework).
- `channels.msteams.requireMention`: نیازمند @mention در کانال‌ها/گروه‌ها (پیش‌فرض true).
- `channels.msteams.replyStyle`: `thread | top-level` ([سبک پاسخ](#reply-style-threads-vs-posts) را ببینید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی به‌ازای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی به‌ازای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض خط‌مشی ابزار به‌ازای هر تیم (`allow`/`deny`/`alsoAllow`) که وقتی بازنویسی کانال وجود ندارد استفاده می‌شود.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض خط‌مشی ابزار به‌ازای هر تیم و هر فرستنده (نویسه‌ی عام `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی به‌ازای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی به‌ازای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های خط‌مشی ابزار به‌ازای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های خط‌مشی ابزار به‌ازای هر کانال و هر فرستنده (نویسه‌ی عام `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند:
  `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.actions.memberInfo`: فعال یا غیرفعال کردن کنش اطلاعات عضو متکی بر Graph (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).
- `channels.msteams.authType`: نوع احراز هویت — `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (احراز هویت فدره‌شده + گواهی).
- `channels.msteams.certificateThumbprint`: اثر انگشت گواهی (اختیاری، برای احراز هویت لازم نیست).
- `channels.msteams.useManagedIdentity`: فعال کردن احراز هویت هویت مدیریت‌شده (حالت فدره‌شده).
- `channels.msteams.managedIdentityClientId`: شناسه‌ی کلاینت برای هویت مدیریت‌شده‌ی اختصاص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسه‌ی سایت SharePoint برای بارگذاری فایل در گفت‌وگوهای گروهی/کانال‌ها ([ارسال فایل در گفت‌وگوهای گروهی](#sending-files-in-group-chats) را ببینید).

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد عامل پیروی می‌کنند ([/concepts/session](/fa/concepts/session) را ببینید):
  - پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسه‌ی مکالمه استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams اخیراً دو سبک رابط کاربری کانال را روی یک مدل داده‌ی زیربنایی معرفی کرده است:

| سبک                     | توضیح                                                     | `replyStyle` پیشنهادی |
| ----------------------- | --------------------------------------------------------- | --------------------- |
| **پست‌ها** (کلاسیک)     | پیام‌ها به‌صورت کارت با پاسخ‌های رشته‌ای زیر آن‌ها ظاهر می‌شوند | `thread` (پیش‌فرض)    |
| **رشته‌ها** (شبیه Slack) | پیام‌ها به‌صورت خطی جریان دارند، بیشتر شبیه Slack          | `top-level`           |

**مشکل:** API مربوط به Teams نشان نمی‌دهد یک کانال از کدام سبک رابط کاربری استفاده می‌کند. اگر از `replyStyle` اشتباه استفاده کنید:

- `thread` در کانالی با سبک Threads → پاسخ‌ها به‌شکل نامناسب تو در تو ظاهر می‌شوند
- `top-level` در کانالی با سبک Posts → پاسخ‌ها به‌جای داخل رشته، به‌صورت پست‌های سطح بالای جداگانه ظاهر می‌شوند

**راه‌حل:** `replyStyle` را به‌ازای هر کانال، بر اساس نحوه‌ی تنظیم کانال پیکربندی کنید:

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

- **DMها:** تصاویر و پیوست‌های فایل از طریق APIهای فایل بات Teams کار می‌کنند.
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 (SharePoint/OneDrive) قرار دارند. بار Webhook فقط شامل یک قطعه‌ی HTML است، نه بایت‌های واقعی فایل. **مجوزهای Graph API لازم‌اند** تا پیوست‌های کانال دانلود شوند.
- برای ارسال‌های صریحِ فایل‌محور، از `action=upload-file` همراه با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود، و `filename` نام بارگذاری‌شده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانال که تصویر دارند فقط به‌صورت متن دریافت می‌شوند (محتوای تصویر برای بات قابل دسترسی نیست).
به‌طور پیش‌فرض، OpenClaw فقط رسانه را از نام‌های میزبان Microsoft/Teams دانلود می‌کند. با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای مجاز کردن هر میزبان از `["*"]` استفاده کنید).
سرآیندهای Authorization فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` افزوده می‌شوند (به‌طور پیش‌فرض میزبان‌های Graph + Bot Framework). این فهرست را سخت‌گیرانه نگه دارید (از پسوندهای چندمستاجری پرهیز کنید).

## ارسال فایل در گفت‌وگوهای گروهی

بات‌ها می‌توانند با استفاده از جریان FileConsentCard (داخلی) در DMها فایل بفرستند. با این حال، **ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها** به راه‌اندازی اضافی نیاز دارد:

| زمینه                    | فایل‌ها چگونه ارسال می‌شوند                 | راه‌اندازی لازم                                  |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **DMها**                 | FileConsentCard → کاربر می‌پذیرد → بات بارگذاری می‌کند | بدون تنظیم اضافی کار می‌کند                     |
| **گفت‌وگوهای گروهی/کانال‌ها** | بارگذاری در SharePoint → اشتراک‌گذاری پیوند | به `sharePointSiteId` + مجوزهای Graph نیاز دارد |
| **تصاویر (هر زمینه‌ای)** | درون‌خطی با کدگذاری Base64                  | بدون تنظیم اضافی کار می‌کند                     |

### چرا گفت‌وگوهای گروهی به SharePoint نیاز دارند

بات‌ها درایو شخصی OneDrive ندارند (نقطه‌ی پایانی `/me/drive` در Graph API برای هویت‌های برنامه کار نمی‌کند). برای ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها، بات در یک **سایت SharePoint** بارگذاری می‌کند و یک پیوند اشتراک‌گذاری می‌سازد.

### راه‌اندازی

1. **مجوزهای Graph API را اضافه کنید** در Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - بارگذاری فایل‌ها در SharePoint
   - `Chat.Read.All` (Application) - اختیاری، پیوندهای اشتراک‌گذاری به‌ازای هر کاربر را فعال می‌کند

2. **رضایت مدیر** را برای مستاجر اعطا کنید.

3. **شناسه‌ی سایت SharePoint خود را بگیرید:**

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

| مجوز                                   | رفتار اشتراک‌گذاری                                      |
| -------------------------------------- | ------------------------------------------------------- |
| فقط `Sites.ReadWrite.All`              | پیوند اشتراک‌گذاری در سطح سازمان (همه‌ی افراد سازمان می‌توانند دسترسی داشته باشند) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | پیوند اشتراک‌گذاری به‌ازای هر کاربر (فقط اعضای گفت‌وگو می‌توانند دسترسی داشته باشند) |

اشتراک‌گذاری به‌ازای هر کاربر امن‌تر است، چون فقط شرکت‌کنندگان گفت‌وگو می‌توانند به فایل دسترسی داشته باشند. اگر مجوز `Chat.Read.All` موجود نباشد، بات به اشتراک‌گذاری در سطح سازمان بازمی‌گردد.

### رفتار جایگزین

| سناریو                                          | نتیجه                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| گفت‌وگوی گروهی + فایل + `sharePointSiteId` پیکربندی شده | بارگذاری در SharePoint، ارسال پیوند اشتراک‌گذاری   |
| گفت‌وگوی گروهی + فایل + بدون `sharePointSiteId` | تلاش برای بارگذاری در OneDrive (ممکن است شکست بخورد)، ارسال فقط متن |
| گفت‌وگوی شخصی + فایل                              | جریان FileConsentCard (بدون SharePoint کار می‌کند) |
| هر زمینه‌ای + تصویر                               | درون‌خطی با کدگذاری Base64 (بدون SharePoint کار می‌کند) |

### محل ذخیره‌ی فایل‌ها

فایل‌های بارگذاری‌شده در پوشه‌ی `/OpenClawShared/` در کتابخانه‌ی اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (کارت‌های تطبیقی)

OpenClaw نظرسنجی‌های Teams را به‌صورت کارت‌های تطبیقی ارسال می‌کند (API بومی نظرسنجی Teams وجود ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- رأی‌ها توسط Gateway در `~/.openclaw/msteams-polls.json` ثبت می‌شوند.
- Gateway باید آنلاین بماند تا رأی‌ها ثبت شوند.
- نظرسنجی‌ها هنوز خلاصه‌ی نتایج را به‌صورت خودکار پست نمی‌کنند (در صورت نیاز فایل ذخیره‌سازی را بررسی کنید).

## کارت‌های ارائه

بارهای ارائه‌ی معنایی را با استفاده از ابزار `message` یا CLI برای کاربران یا مکالمه‌های Teams ارسال کنید. OpenClaw آن‌ها را از قرارداد ارائه‌ی عمومی به‌صورت کارت‌های تطبیقی Teams رندر می‌کند.

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

برای جزئیات قالب مقصد، [قالب‌های مقصد](#target-formats) را در پایین ببینید.

## قالب‌های مقصد

مقصدهای MSTeams از پیشوندها برای تمایز بین کاربران و مکالمه‌ها استفاده می‌کنند:

| نوع مقصد             | قالب                            | نمونه                                              |
| -------------------- | ------------------------------- | -------------------------------------------------- |
| کاربر (بر اساس شناسه) | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`        |
| کاربر (بر اساس نام)  | `user:<display-name>`           | `user:John Smith` (به Graph API نیاز دارد)         |
| گروه/کانال           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| گروه/کانال (خام)     | `<conversation-id>`             | `19:abc123...@thread.tacv2` (اگر شامل `@thread` باشد) |

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
بدون پیشوند `user:`، نام‌ها به‌صورت پیش‌فرض با گروه یا تیم تطبیق داده می‌شوند. هنگام هدف‌گیری افراد با نام نمایشی، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **پس از** تعامل کاربر ممکن هستند، چون در آن نقطه ارجاع‌های مکالمه را ذخیره می‌کنیم.
- برای `dmPolicy` و دروازه‌گذاری فهرست مجاز، `/gateway/configuration` را ببینید.

## شناسه‌های تیم و کانال (اشتباه رایج)

پارامتر پرس‌وجوی `groupId` در URLهای Teams، شناسه تیمی **نیست** که برای پیکربندی استفاده می‌شود. به‌جای آن، شناسه‌ها را از مسیر URL استخراج کنید:

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

- کلید تیم = بخش مسیر پس از `/team/` (URL-decode شده، برای مثال `19:Bk4j...@thread.tacv2`؛ مستأجرهای قدیمی‌تر ممکن است `@thread.skype` را نشان دهند که آن هم معتبر است)
- کلید کانال = بخش مسیر پس از `/channel/` (URL-decode شده)
- پارامتر پرس‌وجوی `groupId` را برای مسیریابی OpenClaw **نادیده بگیرید**. این شناسه گروه Microsoft Entra است، نه شناسه مکالمه Bot Framework که در فعالیت‌های ورودی Teams استفاده می‌شود.

## کانال‌های خصوصی

ربات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت                      | کانال‌های استاندارد | کانال‌های خصوصی             |
| ---------------------------- | ----------------- | ---------------------- |
| نصب ربات             | بله               | محدود                |
| پیام‌های بلادرنگ (webhook) | بله               | ممکن است کار نکند           |
| مجوزهای RSC              | بله               | ممکن است رفتار متفاوتی داشته باشد |
| @اشاره‌ها                    | بله               | اگر ربات قابل دسترسی باشد   |
| تاریخچه Graph API            | بله               | بله (با مجوزها) |

**راهکارها در صورت کار نکردن کانال‌های خصوصی:**

1. برای تعاملات ربات از کانال‌های استاندارد استفاده کنید
2. از پیام‌های مستقیم استفاده کنید - کاربران همیشه می‌توانند مستقیم به ربات پیام بدهند
3. برای دسترسی تاریخی از Graph API استفاده کنید (به `ChannelMessage.Read.All` نیاز دارد)

## عیب‌یابی

### مشکلات رایج

- **تصاویر در کانال‌ها نمایش داده نمی‌شوند:** مجوزهای Graph یا رضایت مدیر وجود ندارد. برنامه Teams را دوباره نصب کنید و Teams را کاملا ببندید و دوباره باز کنید.
- **پاسخی در کانال دریافت نمی‌شود:** اشاره‌ها به‌صورت پیش‌فرض الزامی هستند؛ `channels.msteams.requireMention=false` را تنظیم کنید یا برای هر تیم/کانال جداگانه پیکربندی کنید.
- **ناسازگاری نسخه (Teams هنوز مانیفست قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و برای تازه‌سازی، Teams را کاملا ببندید.
- **401 Unauthorized از webhook:** هنگام آزمایش دستی بدون Azure JWT مورد انتظار است - یعنی نقطه پایانی قابل دسترسی است اما احراز هویت ناموفق بوده است. برای آزمایش درست از Azure Web Chat استفاده کنید.

### خطاهای بارگذاری مانیفست

- **"Icon file cannot be empty":** مانیفست به فایل‌های آیکنی ارجاع می‌دهد که ۰ بایت هستند. آیکن‌های PNG معتبر بسازید (32x32 برای `outline.png`، 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه هنوز در تیم/چت دیگری نصب است. ابتدا آن را پیدا و حذف کنید، یا ۵ تا ۱۰ دقیقه برای انتشار تغییرات صبر کنید.
- **"Something went wrong" هنگام بارگذاری:** به‌جای آن از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بارگذاری کنید، DevTools مرورگر (F12) → زبانه Network را باز کنید و بدنه پاسخ را برای خطای واقعی بررسی کنید.
- **بارگذاری جانبی ناموفق است:** به‌جای "Upload a custom app"، گزینه "Upload an app to your org's app catalog" را امتحان کنید - این روش اغلب محدودیت‌های sideload را دور می‌زند.

### مجوزهای RSC کار نمی‌کنند

1. بررسی کنید `webApplicationInfo.id` دقیقا با App ID ربات شما مطابقت داشته باشد
2. برنامه را دوباره بارگذاری کنید و در تیم/چت دوباره نصب کنید
3. بررسی کنید آیا مدیر سازمان شما مجوزهای RSC را مسدود کرده است یا نه
4. تأیید کنید از دامنه درست استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای چت‌های گروهی

## منابع

- [ایجاد Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - ایجاد/مدیریت برنامه‌های Teams
- [طرح‌واره مانیفست برنامه Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل ربات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI برای مدیریت ربات

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و دروازه‌گذاری اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
