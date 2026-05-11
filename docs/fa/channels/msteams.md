---
read_when:
    - در حال کار روی ویژگی‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-11T20:22:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7bf8cd0ae6c6053f51794e6bc03bb6d927d640256272f3afb04f3b0ec99eb43
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: متن و پیوست‌های DM پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (نگاه کنید به [ارسال فایل‌ها در گفت‌وگوهای گروهی](#sending-files-in-group-chats)). نظرسنجی‌ها از طریق Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌های فایل‌اول در دسترس می‌گذارند.

## Plugin بسته‌شده

Microsoft Teams در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin بسته‌شده ارائه می‌شود، بنابراین در بیلد بسته‌بندی‌شده معمولی نیازی به نصب جداگانه نیست.

اگر روی یک بیلد قدیمی‌تر هستید یا نصب سفارشی‌ای دارید که Teams بسته‌شده را حذف کرده است، بسته npm را مستقیماً نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

از بسته خام استفاده کنید تا برچسب نسخه رسمی فعلی را دنبال کنید. فقط زمانی یک نسخه دقیق را پین کنید که به نصبی بازتولیدپذیر نیاز دارید.

checkout محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت بات، ساخت manifest، و تولید اعتبارنامه‌ها را در یک فرمان انجام می‌دهد.

**1. نصب و ورود**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI در حال حاضر در وضعیت پیش‌نمایش است. فرمان‌ها و فلگ‌ها ممکن است بین نسخه‌ها تغییر کنند.
</Note>

**2. یک تونل را شروع کنید** (Teams نمی‌تواند به localhost دسترسی پیدا کند)

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
`--allow-anonymous` لازم است، چون Teams نمی‌تواند با devtunnels احراز هویت کند. هر درخواست ورودی بات همچنان به‌طور خودکار توسط Teams SDK اعتبارسنجی می‌شود.
</Note>

جایگزین‌ها: `ngrok http 3978` یا `tailscale funnel 3978` (اما این‌ها ممکن است در هر نشست URLها را تغییر دهند).

**3. ساخت برنامه**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این فرمان واحد:

- یک برنامه Entra ID (Azure AD) می‌سازد
- یک client secret تولید می‌کند
- یک Teams app manifest (با آیکن‌ها) می‌سازد و آپلود می‌کند
- بات را ثبت می‌کند (به‌صورت پیش‌فرض مدیریت‌شده توسط Teams - بدون نیاز به اشتراک Azure)

خروجی `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID`، و یک **Teams App ID** را نشان می‌دهد - این‌ها را برای مراحل بعدی یادداشت کنید. همچنین پیشنهاد می‌دهد برنامه را مستقیماً در Teams نصب کنید.

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

`teams app create` از شما می‌خواهد برنامه را نصب کنید - گزینه "Install in Teams" را انتخاب کنید. اگر از آن عبور کردید، بعداً می‌توانید لینک را دریافت کنید:

```bash
teams app get <teamsAppId> --install-link
```

**6. تأیید کنید همه‌چیز کار می‌کند**

```bash
teams app doctor <teamsAppId>
```

این کار عیب‌یابی‌هایی را در ثبت بات، پیکربندی برنامه AAD، اعتبار manifest، و راه‌اندازی SSO اجرا می‌کند.

برای استقرارهای تولیدی، به‌جای client secretها از [احراز هویت فدره‌شده](/fa/channels/msteams#federated-authentication-certificate-plus-managed-identity) (گواهی یا managed identity) استفاده کنید.

<Note>
گفت‌وگوهای گروهی به‌صورت پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای اجازه دادن به پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` برای اجازه دادن به هر عضو (وابسته به mention) استفاده کنید.
</Note>

## هدف‌ها

- از طریق DMهای Teams، گفت‌وگوهای گروهی، یا کانال‌ها با OpenClaw صحبت کنید.
- مسیریابی را قطعی نگه دارید: پاسخ‌ها همیشه به همان کانالی برمی‌گردند که از آن آمده‌اند.
- رفتار امن کانال را پیش‌فرض قرار دهید (mentionها لازم هستند مگر اینکه خلاف آن پیکربندی شده باشد).

## نوشتن پیکربندی

به‌صورت پیش‌فرض، Microsoft Teams مجاز است به‌روزرسانی‌های پیکربندی را که با `/config set|unset` ایجاد می‌شوند بنویسد (نیازمند `commands.config: true`).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (DMها + گروه‌ها)

**دسترسی DM**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستندگان ناشناس تا زمان تأیید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از شناسه‌های پایدار شیء AAD یا گروه‌های دسترسی ثابت فرستنده مانند `accessGroup:core-team` استفاده کند.
- برای allowlistها به تطبیق UPN/display-name تکیه نکنید - ممکن است تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌صورت پیش‌فرض غیرفعال می‌کند؛ به‌صورت صریح با `channels.msteams.dangerouslyAllowNameMatching: true` فعال کنید.
- wizard می‌تواند وقتی اعتبارنامه‌ها اجازه دهند، نام‌ها را از طریق Microsoft Graph به شناسه‌ها تبدیل کند.

**دسترسی گروه**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است مگر اینکه `groupAllowFrom` را اضافه کنید). از `channels.defaults.groupPolicy` برای بازنویسی پیش‌فرض هنگام تنظیم‌نبودن استفاده کنید.
- `channels.msteams.groupAllowFrom` کنترل می‌کند کدام فرستندگان یا گروه‌های دسترسی ثابت فرستنده می‌توانند در گفت‌وگوهای گروهی/کانال‌ها تریگر شوند (به `channels.msteams.allowFrom` fallback می‌کند).
- `groupPolicy: "open"` را تنظیم کنید تا به هر عضو اجازه داده شود (همچنان به‌صورت پیش‌فرض وابسته به mention).
- برای اجازه ندادن به **هیچ کانالی**، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

نمونه:

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

**Teams + allowlist کانال**

- پاسخ‌های گروه/کانال را با فهرست کردن تیم‌ها و کانال‌ها زیر `channels.msteams.teams` محدود کنید.
- کلیدها باید از شناسه‌های پایدار گفت‌وگوی Teams از لینک‌های Teams استفاده کنند، نه نام‌های نمایشی قابل‌تغییر.
- وقتی `groupPolicy="allowlist"` و یک allowlist تیم‌ها وجود دارد، فقط تیم‌ها/کانال‌های فهرست‌شده پذیرفته می‌شوند (وابسته به mention).
- wizard پیکربندی، ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام شروع، OpenClaw نام‌های allowlist تیم/کانال و کاربر را به شناسه‌ها تبدیل می‌کند (وقتی مجوزهای Graph اجازه دهند)
  و نگاشت را لاگ می‌کند؛ نام‌های حل‌نشده تیم/کانال همان‌طور که تایپ شده‌اند نگه داشته می‌شوند، اما به‌صورت پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` فعال باشد.

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

اگر نمی‌توانید از Teams CLI استفاده کنید، می‌توانید بات را به‌صورت دستی از طریق Azure Portal راه‌اندازی کنید.

### نحوه کار

1. مطمئن شوید Plugin Microsoft Teams در دسترس است (در نسخه‌های فعلی بسته‌شده است).
2. یک **Azure Bot** بسازید (App ID + secret + tenant ID).
3. یک **بسته برنامه Teams** بسازید که به بات ارجاع می‌دهد و مجوزهای RSC زیر را شامل می‌شود.
4. برنامه Teams را در یک تیم (یا scope شخصی برای DMها) آپلود/نصب کنید.
5. `msteams` را در `~/.openclaw/openclaw.json` (یا متغیرهای محیطی) پیکربندی کنید و Gateway را شروع کنید.
6. Gateway به‌صورت پیش‌فرض روی `/api/messages` به ترافیک Webhook مربوط به Bot Framework گوش می‌دهد.

### مرحله 1: ساخت Azure Bot

1. به [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید
2. زبانه **Basics** را پر کنید:

   | فیلد              | مقدار                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | نام بات شما، مثلاً `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription**   | اشتراک Azure خود را انتخاب کنید                           |
   | **Resource group** | مورد جدید بسازید یا از مورد موجود استفاده کنید                               |
   | **Pricing tier**   | **Free** برای توسعه/آزمایش                                 |
   | **Type of App**    | **Single Tenant** (توصیه‌شده - یادداشت زیر را ببینید)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
ساخت بات‌های multi-tenant جدید پس از 2025-07-31 منسوخ شد. برای بات‌های جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** → **Create** کلیک کنید (حدود 1 تا 2 دقیقه صبر کنید)

### مرحله 2: دریافت اعتبارنامه‌ها

1. به منبع Azure Bot خود بروید → **Configuration**
2. **Microsoft App ID** را کپی کنید → این همان `appId` شماست
3. روی **Manage Password** کلیک کنید → به App Registration بروید
4. زیر **Certificates & secrets** → **New client secret** → **Value** را کپی کنید → این همان `appPassword` شماست
5. به **Overview** بروید → **Directory (tenant) ID** را کپی کنید → این همان `tenantId` شماست

### مرحله 3: پیکربندی Messaging Endpoint

1. در Azure Bot → **Configuration**
2. **Messaging endpoint** را روی URL Webhook خود تنظیم کنید:
   - تولید: `https://your-domain.com/api/messages`
   - توسعه محلی: از یک تونل استفاده کنید (نگاه کنید به [توسعه محلی](#local-development-tunneling) در پایین)

### مرحله 4: فعال‌سازی کانال Teams

1. در Azure Bot → **Channels**
2. روی **Microsoft Teams** → Configure → Save کلیک کنید
3. Terms of Service را بپذیرید

### مرحله 5: ساخت Teams App Manifest

- یک ورودی `bot` با `botId = <App ID>` اضافه کنید.
- scopeها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای مدیریت فایل در scope شخصی لازم است).
- مجوزهای RSC را اضافه کنید (نگاه کنید به [مجوزهای RSC](#current-teams-rsc-permissions-manifest)).
- آیکن‌ها را بسازید: `outline.png` (32x32) و `color.png` (192x192).
- هر سه فایل را با هم zip کنید: `manifest.json`، `outline.png`، `color.png`.

### مرحله 6: پیکربندی OpenClaw

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

### مرحله 7: اجرای Gateway

کانال Teams وقتی Plugin در دسترس باشد و پیکربندی `msteams` با اعتبارنامه‌ها وجود داشته باشد، به‌صورت خودکار شروع می‌شود.

</details>

## احراز هویت فدره‌شده (گواهی به‌علاوه managed identity)

> اضافه‌شده در 2026.4.11

برای استقرارهای تولیدی، OpenClaw از **احراز هویت فدره‌شده** به‌عنوان جایگزینی امن‌تر برای client secretها پشتیبانی می‌کند. دو روش در دسترس است:

### گزینه A: احراز هویت مبتنی بر گواهی

از یک گواهی PEM ثبت‌شده در app registration مربوط به Entra ID خود استفاده کنید.

**راه‌اندازی:**

1. یک گواهی تولید یا تهیه کنید (قالب PEM با کلید خصوصی).
2. در Entra ID → App Registration → **Certificates & secrets** → **Certificates** → گواهی عمومی را آپلود کنید.

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

از Azure Managed Identity برای احراز هویت بدون رمز عبور استفاده کنید. این گزینه برای استقرارها روی زیرساخت Azure (AKS، App Service، Azure VMs) که در آن managed identity در دسترس است، ایدئال است.

**نحوه کار:**

1. پاد/VM بات یک managed identity دارد (system-assigned یا user-assigned).
2. یک **federated identity credential**، managed identity را به app registration مربوط به Entra ID متصل می‌کند.
3. در زمان اجرا، OpenClaw از `@azure/identity` برای دریافت توکن‌ها از endpoint مربوط به Azure IMDS (`169.254.169.254`) استفاده می‌کند.
4. توکن برای احراز هویت بات به Teams SDK داده می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با managed identity فعال (AKS workload identity، App Service، VM)
- federated identity credential ساخته‌شده روی app registration مربوط به Entra ID
- دسترسی شبکه از پاد/VM به IMDS (`169.254.169.254:80`)

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

### راه‌اندازی AKS Workload Identity

برای استقرارهای AKS که از هویت بار کاری استفاده می‌کنند:

1. **هویت بار کاری را فعال کنید** روی کلاستر AKS خود.
2. **یک اعتبار هویت فدرال بسازید** روی ثبت برنامه Entra ID:

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
| **راز کلاینت** | `appPassword` | راه‌اندازی ساده | نیازمند چرخش راز، امنیت کمتر |
| **گواهی** | `authType: "federated"` + `certificatePath` | بدون راز مشترک روی شبکه | سربار مدیریت گواهی |
| **هویت مدیریت‌شده** | `authType: "federated"` + `useManagedIdentity` | بدون گذرواژه، بدون راز برای مدیریت | نیازمند زیرساخت Azure |

**رفتار پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw به‌طور پیش‌فرض از احراز هویت راز کلاینت استفاده می‌کند. پیکربندی‌های موجود بدون تغییر به کار ادامه می‌دهند.

## توسعه محلی (تونل‌سازی)

Teams نمی‌تواند به `localhost` دسترسی پیدا کند. از یک تونل توسعه پایدار استفاده کنید تا URL شما در نشست‌های مختلف ثابت بماند:

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

ثبت Bot، برنامه AAD، manifest و پیکربندی SSO را در یک گذر بررسی می‌کند.

**ارسال پیام آزمایشی:**

1. برنامه Teams را نصب کنید (از پیوند نصب از `teams app get <id> --install-link` استفاده کنید)
2. Bot را در Teams پیدا کنید و یک DM بفرستید
3. گزارش‌های Gateway را برای فعالیت ورودی بررسی کنید

## متغیرهای محیطی

همه کلیدهای پیکربندی می‌توانند به‌جای آن از طریق متغیرهای محیطی تنظیم شوند:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختیاری: `"secret"` یا `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (فدرال + گواهی)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختیاری، برای احراز هویت لازم نیست)
- `MSTEAMS_USE_MANAGED_IDENTITY` (فدرال + هویت مدیریت‌شده)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI اختصاص‌یافته به کاربر)

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` پشتیبانی‌شده با Graph برای Microsoft Teams ارائه می‌کند تا عامل‌ها و خودکارسازی‌ها بتوانند جزئیات اعضای کانال (نام نمایشی، ایمیل، نقش) را مستقیما از Microsoft Graph حل کنند.

نیازمندی‌ها:

- مجوز RSC به نام `Member.Read.Group` (از قبل در manifest پیشنهادی وجود دارد)
- برای جست‌وجوهای میان‌تیمی: مجوز برنامه Graph به نام `User.Read.All` با رضایت مدیر

این کنش با `channels.msteams.actions.memberInfo` کنترل می‌شود (پیش‌فرض: وقتی اعتبارنامه‌های Graph در دسترس باشند فعال است).

## زمینه تاریخچه

- `channels.msteams.historyLimit` کنترل می‌کند چند پیام اخیر کانال/گروه در prompt پیچیده شوند.
- به `messages.groupChat.historyLimit` برمی‌گردد. برای غیرفعال کردن، `0` را تنظیم کنید (پیش‌فرض 50).
- تاریخچه نخ واکشی‌شده با allowlistهای فرستنده (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود، بنابراین آماده‌سازی زمینه نخ فقط شامل پیام‌های فرستنده‌های مجاز است.
- زمینه پیوست نقل‌قول‌شده (`ReplyTo*` مشتق‌شده از HTML پاسخ Teams) در حال حاضر همان‌طور که دریافت شده پاس داده می‌شود.
- به بیان دیگر، allowlistها تعیین می‌کنند چه کسی می‌تواند عامل را تحریک کند؛ امروز فقط مسیرهای مشخصی از زمینه تکمیلی فیلتر می‌شوند.
- تاریخچه DM می‌تواند با `channels.msteams.dmHistoryLimit` محدود شود (نوبت‌های کاربر). بازنویسی‌های مخصوص هر کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

## مجوزهای RSC فعلی Teams (manifest)

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

## نمونه manifest برای Teams (با حذف اطلاعات حساس)

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

### نکته‌های manifest (فیلدهای الزامی)

- `bots[].botId` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `webApplicationInfo.id` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `bots[].scopes` باید سطح‌هایی را که قصد استفاده از آن‌ها را دارید شامل شود (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` برای رسیدگی به فایل در دامنه شخصی لازم است.
- اگر ترافیک کانال را می‌خواهید، `authorization.permissions.resourceSpecific` باید خواندن/ارسال کانال را شامل شود.

### به‌روزرسانی یک برنامه موجود

برای به‌روزرسانی یک برنامه Teams که از قبل نصب شده است (مثلا برای افزودن مجوزهای RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

پس از به‌روزرسانی، برنامه را در هر تیم دوباره نصب کنید تا مجوزهای جدید اعمال شوند، و **Teams را کاملا ببندید و دوباره اجرا کنید** (نه فقط بستن پنجره) تا فراداده برنامه در کش پاک شود.

<details>
<summary>به‌روزرسانی دستی manifest (بدون CLI)</summary>

1. `manifest.json` خود را با تنظیمات جدید به‌روزرسانی کنید
2. **فیلد `version` را افزایش دهید** (مثلا `1.0.0` → `1.1.0`)
3. manifest را همراه با آیکن‌ها دوباره zip کنید (`manifest.json`, `outline.png`, `color.png`)
4. zip جدید را بارگذاری کنید:
   - **Teams Admin Center:** برنامه‌های Teams → مدیریت برنامه‌ها → برنامه خود را پیدا کنید → بارگذاری نسخه جدید
   - **Sideload:** در Teams → Apps → مدیریت برنامه‌های شما → بارگذاری یک برنامه سفارشی

</details>

## قابلیت‌ها: فقط RSC در برابر Graph

### با **فقط Teams RSC** (برنامه نصب شده، بدون مجوزهای Graph API)

کار می‌کند:

- خواندن محتوای **متن** پیام کانال.
- ارسال محتوای **متن** پیام کانال.
- دریافت پیوست‌های فایل **شخصی (DM)**.

کار نمی‌کند:

- **محتوای تصویر یا فایل** کانال/گروه (payload فقط شامل stub HTML است).
- دانلود پیوست‌های ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام (فراتر از رویداد Webhook زنده).

### با **Teams RSC + مجوزهای برنامه Microsoft Graph**

اضافه می‌کند:

- دانلود محتوای میزبانی‌شده (تصاویر چسبانده‌شده در پیام‌ها).
- دانلود پیوست‌های فایل ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام کانال/چت از طریق Graph.

### RSC در برابر Graph API

| قابلیت | مجوزهای RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **پیام‌های بی‌درنگ** | بله (از طریق Webhook) | نه (فقط polling) |
| **پیام‌های تاریخی** | نه | بله (می‌تواند تاریخچه را پرس‌وجو کند) |
| **پیچیدگی راه‌اندازی** | فقط manifest برنامه | نیازمند رضایت مدیر + جریان token |
| **کارکرد آفلاین** | نه (باید در حال اجرا باشد) | بله (پرس‌وجو در هر زمان) |

**خلاصه:** RSC برای گوش‌دادن بی‌درنگ است؛ Graph API برای دسترسی تاریخی است. برای رسیدن به پیام‌های ازدست‌رفته هنگام آفلاین بودن، به Graph API با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه + تاریخچه فعال با Graph (لازم برای کانال‌ها)

اگر به تصاویر/فایل‌ها در **کانال‌ها** نیاز دارید یا می‌خواهید **تاریخچه پیام** را واکشی کنید، باید مجوزهای Microsoft Graph را فعال کنید و رضایت مدیر را بدهید.

1. در Entra ID (Azure AD) **App Registration**، مجوزهای **Application** مربوط به Microsoft Graph را اضافه کنید:
   - `ChannelMessage.Read.All` (پیوست‌های کانال + تاریخچه)
   - `Chat.Read.All` یا `ChatMessage.Read.All` (چت‌های گروهی)
2. **رضایت مدیر را اعطا کنید** برای tenant.
3. **نسخه manifest** برنامه Teams را افزایش دهید، دوباره بارگذاری کنید، و **برنامه را در Teams دوباره نصب کنید**.
4. **Teams را کاملا ببندید و دوباره اجرا کنید** تا فراداده برنامه در کش پاک شود.

**مجوز اضافی برای اشاره به کاربران:** @mention کاربران برای کاربرانی که در مکالمه هستند، بدون تنظیم اضافه کار می‌کند. با این حال، اگر می‌خواهید کاربرانی را که **در مکالمه فعلی نیستند** به‌صورت پویا جست‌وجو و mention کنید، مجوز `User.Read.All` (Application) را اضافه کنید و رضایت مدیر را اعطا کنید.

## محدودیت‌های شناخته‌شده

### timeoutهای Webhook

Teams پیام‌ها را از طریق HTTP Webhook تحویل می‌دهد. اگر پردازش بیش از حد طول بکشد (مثلا پاسخ‌های کند LLM)، ممکن است این موارد را ببینید:

- timeoutهای Gateway
- تلاش دوباره Teams برای پیام (که باعث نسخه‌های تکراری می‌شود)
- پاسخ‌های حذف‌شده

OpenClaw این مورد را با بازگشت سریع و ارسال پیش‌دستانه پاسخ‌ها مدیریت می‌کند، اما پاسخ‌های بسیار کند همچنان ممکن است مشکل ایجاد کنند.

### قالب‌بندی

Markdown در Teams محدودتر از Slack یا Discord است:

- قالب‌بندی پایه کار می‌کند: **bold**، _italic_، `code`، پیوندها
- Markdown پیچیده (جدول‌ها، فهرست‌های تودرتو) ممکن است درست نمایش داده نشود
- Adaptive Cards برای نظرسنجی‌ها و ارسال‌های ارائه معنایی پشتیبانی می‌شوند (در ادامه ببینید)

## پیکربندی

تنظیمات کلیدی (برای الگوهای مشترک کانال، `/gateway/configuration` را ببینید):

- `channels.msteams.enabled`: فعال/غیرفعال کردن کانال.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اعتبارنامه‌های ربات.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`)
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: جفت‌سازی)
- `channels.msteams.allowFrom`: فهرست مجاز پیام مستقیم (شناسه‌های شیء AAD توصیه می‌شوند). وقتی دسترسی Graph در دسترس باشد، راه‌انداز در زمان نصب نام‌ها را به شناسه‌ها تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: کلید اضطراری برای فعال‌سازی دوباره تطبیق قابل‌تغییر UPN/نام نمایشی و مسیریابی مستقیم نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازه قطعه متن خروجی.
- `channels.msteams.chunkMode`: `length` (پیش‌فرض) یا `newline` برای شکستن روی خط‌های خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز میزبان‌ها برای پیوست‌های ورودی (به‌طور پیش‌فرض دامنه‌های Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای افزودن سرآیندهای Authorization در تلاش‌های دوباره رسانه (به‌طور پیش‌فرض میزبان‌های Graph + Bot Framework).
- `channels.msteams.requireMention`: الزام @mention در کانال‌ها/گروه‌ها (پیش‌فرض true).
- `channels.msteams.replyStyle`: `thread | top-level` ([سبک پاسخ](#reply-style-threads-vs-posts) را ببینید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر تیم (`allow`/`deny`/`alsoAllow`) که وقتی بازنویسی کانال وجود ندارد استفاده می‌شوند.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر فرستنده در هر تیم (نویسه عام `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های سیاست ابزار برای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های سیاست ابزار برای هر فرستنده در هر کانال (نویسه عام `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند:
  `channel:`، `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.actions.memberInfo`: فعال یا غیرفعال کردن کنش اطلاعات عضو مبتنی بر Graph (پیش‌فرض: وقتی اعتبارنامه‌های Graph در دسترس باشند فعال است).
- `channels.msteams.authType`: نوع احراز هویت - `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (احراز هویت federated + گواهی).
- `channels.msteams.certificateThumbprint`: اثرانگشت گواهی (اختیاری، برای احراز هویت لازم نیست).
- `channels.msteams.useManagedIdentity`: فعال‌سازی احراز هویت managed identity (حالت federated).
- `channels.msteams.managedIdentityClientId`: شناسه کلاینت برای managed identity اختصاص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسه سایت SharePoint برای بارگذاری فایل در گفت‌وگوهای گروهی/کانال‌ها ([ارسال فایل در گفت‌وگوهای گروهی](#sending-files-in-group-chats) را ببینید).

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد عامل پیروی می‌کنند ([/concepts/session](/fa/concepts/session) را ببینید):
  - پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسه مکالمه استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams اخیرا دو سبک رابط کاربری کانال را روی همان مدل داده زیربنایی معرفی کرده است:

| سبک                    | توضیح                                               | `replyStyle` توصیه‌شده |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **پست‌ها** (کلاسیک)      | پیام‌ها به‌صورت کارت‌هایی با پاسخ‌های رشته‌ای در زیر آن‌ها ظاهر می‌شوند | `thread` (پیش‌فرض)       |
| **رشته‌ها** (شبیه Slack) | پیام‌ها به‌صورت خطی جریان می‌یابند، بیشتر شبیه Slack                   | `top-level`              |

**مشکل:** API در Teams مشخص نمی‌کند یک کانال از کدام سبک رابط کاربری استفاده می‌کند. اگر از `replyStyle` اشتباه استفاده کنید:

- `thread` در یک کانال با سبک رشته‌ها → پاسخ‌ها به‌صورت تودرتوی نامناسب ظاهر می‌شوند
- `top-level` در یک کانال با سبک پست‌ها → پاسخ‌ها به‌جای داخل رشته، به‌صورت پست‌های سطح‌بالای جداگانه ظاهر می‌شوند

**راه‌حل:** `replyStyle` را بر اساس نحوه راه‌اندازی کانال، برای هر کانال پیکربندی کنید:

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

### اولویت حل‌وفصل

وقتی ربات پاسخی را در یک کانال ارسال می‌کند، `replyStyle` از خاص‌ترین بازنویسی تا پیش‌فرض حل‌وفصل می‌شود. نخستین مقدار غیر `undefined` برنده است:

1. **برای هر کانال** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **برای هر تیم** — `channels.msteams.teams.<teamId>.replyStyle`
3. **سراسری** — `channels.msteams.replyStyle`
4. **پیش‌فرض ضمنی** — برگرفته از `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

اگر `requireMention: false` را به‌صورت سراسری بدون `replyStyle` صریح تنظیم کنید، mentionها در کانال‌های سبک پست‌ها حتی وقتی ورودی پاسخ یک رشته بوده است به‌صورت پست‌های سطح‌بالا ظاهر می‌شوند. برای جلوگیری از غافلگیری، `replyStyle: "thread"` را در سطح سراسری، تیم، یا کانال ثابت کنید.

### حفظ زمینه رشته

وقتی `replyStyle: "thread"` فعال است و ربات از داخل یک رشته کانال @mentioned شده باشد، OpenClaw ریشه رشته اصلی را دوباره به مرجع مکالمه خروجی متصل می‌کند (`19:…@thread.tacv2;messageid=<root>`) تا پاسخ داخل همان رشته قرار بگیرد. این موضوع هم برای ارسال‌های زنده (در همان نوبت) و هم برای ارسال‌های پیش‌دستانه پس از منقضی شدن زمینه نوبت Bot Framework برقرار است (برای مثال، عامل‌های طولانی‌اجرا، پاسخ‌های فراخوانی ابزار در صف از طریق `mcp__openclaw__message`).

ریشه رشته از `threadId` ذخیره‌شده روی مرجع مکالمه گرفته می‌شود. مرجع‌های ذخیره‌شده قدیمی‌تر که مربوط به پیش از `threadId` هستند به `activityId` برمی‌گردند (هر فعالیت ورودی‌ای که آخرین بار مکالمه را seed کرده است)، بنابراین استقرارهای موجود بدون seed دوباره به کار خود ادامه می‌دهند.

وقتی `replyStyle: "top-level"` فعال است، ورودی‌های رشته کانال عمدا به‌صورت پست‌های سطح‌بالای جدید پاسخ داده می‌شوند — هیچ پسوند رشته‌ای اضافه نمی‌شود. این رفتار درست برای کانال‌های سبک رشته‌ها است؛ اگر پست‌های سطح‌بالا را جایی می‌بینید که انتظار پاسخ‌های رشته‌ای داشتید، `replyStyle` شما برای آن کانال اشتباه تنظیم شده است.

## پیوست‌ها و تصویرها

**محدودیت‌های فعلی:**

- **پیام‌های مستقیم:** تصویرها و پیوست‌های فایل از طریق APIهای فایل ربات Teams کار می‌کنند.
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 قرار دارند (SharePoint/OneDrive). بار webhook فقط یک stub HTML را شامل می‌شود، نه بایت‌های واقعی فایل. **برای دانلود پیوست‌های کانال، مجوزهای Graph API لازم هستند**.
- برای ارسال‌های صریح با اولویت فایل، از `action=upload-file` همراه با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود، و `filename` نام بارگذاری‌شده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانال دارای تصویر فقط به‌صورت متن دریافت می‌شوند (محتوای تصویر برای ربات قابل دسترسی نیست).
به‌طور پیش‌فرض، OpenClaw فقط رسانه را از نام میزبان‌های Microsoft/Teams دانلود می‌کند. با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای مجاز کردن هر میزبانی از `["*"]` استفاده کنید).
سرآیندهای Authorization فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` اضافه می‌شوند (به‌طور پیش‌فرض میزبان‌های Graph + Bot Framework). این فهرست را محدود نگه دارید (از پسوندهای چندمستاجری پرهیز کنید).

## ارسال فایل در گفت‌وگوهای گروهی

ربات‌ها می‌توانند با استفاده از جریان FileConsentCard (داخلی) فایل‌ها را در پیام‌های مستقیم ارسال کنند. با این حال، **ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها** به راه‌اندازی اضافی نیاز دارد:

| زمینه                  | فایل‌ها چگونه ارسال می‌شوند                           | راه‌اندازی لازم                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **پیام‌های مستقیم**                  | FileConsentCard → کاربر می‌پذیرد → ربات بارگذاری می‌کند | به‌صورت آماده کار می‌کند                            |
| **گفت‌وگوهای گروهی/کانال‌ها** | بارگذاری در SharePoint → اشتراک‌گذاری پیوند            | به `sharePointSiteId` + مجوزهای Graph نیاز دارد |
| **تصویرها (هر زمینه‌ای)** | درون‌خطی با کدگذاری Base64                        | به‌صورت آماده کار می‌کند                            |

### چرا گفت‌وگوهای گروهی به SharePoint نیاز دارند

ربات‌ها drive شخصی OneDrive ندارند (نقطه پایانی `/me/drive` در Graph API برای هویت‌های application کار نمی‌کند). برای ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها، ربات در یک **سایت SharePoint** بارگذاری می‌کند و یک پیوند اشتراک‌گذاری می‌سازد.

### راه‌اندازی

1. **مجوزهای Graph API را اضافه کنید** در Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - بارگذاری فایل‌ها در SharePoint
   - `Chat.Read.All` (Application) - اختیاری، پیوندهای اشتراک‌گذاری برای هر کاربر را فعال می‌کند

2. **رضایت مدیر** را برای مستاجر اعطا کنید.

3. **شناسه سایت SharePoint خود را دریافت کنید:**

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

| مجوز                              | رفتار اشتراک‌گذاری                                          |
| --------------------------------------- | --------------------------------------------------------- |
| فقط `Sites.ReadWrite.All`              | پیوند اشتراک‌گذاری در سطح سازمان (هر کسی در سازمان می‌تواند دسترسی داشته باشد) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | پیوند اشتراک‌گذاری برای هر کاربر (فقط اعضای گفت‌وگو می‌توانند دسترسی داشته باشند)      |

اشتراک‌گذاری برای هر کاربر امن‌تر است، زیرا فقط شرکت‌کنندگان گفت‌وگو می‌توانند به فایل دسترسی داشته باشند. اگر مجوز `Chat.Read.All` وجود نداشته باشد، ربات به اشتراک‌گذاری در سطح سازمان برمی‌گردد.

### رفتار جایگزین

| سناریو                                          | نتیجه                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| گفت‌وگوی گروهی + فایل + `sharePointSiteId` پیکربندی‌شده | بارگذاری در SharePoint، ارسال پیوند اشتراک‌گذاری            |
| گفت‌وگوی گروهی + فایل + بدون `sharePointSiteId`         | تلاش برای بارگذاری در OneDrive (ممکن است شکست بخورد)، فقط متن ارسال می‌شود |
| گفت‌وگوی شخصی + فایل                              | جریان FileConsentCard (بدون SharePoint کار می‌کند)    |
| هر زمینه + تصویر                               | درون‌خطی با کدگذاری Base64 (بدون SharePoint کار می‌کند)   |

### محل ذخیره فایل‌ها

فایل‌های بارگذاری‌شده در پوشه `/OpenClawShared/` در کتابخانه اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (Adaptive Cards)

OpenClaw نظرسنجی‌های Teams را به‌صورت Adaptive Cards ارسال می‌کند (هیچ API بومی نظرسنجی Teams وجود ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- رأی‌ها توسط Gateway در `~/.openclaw/msteams-polls.json` ثبت می‌شوند.
- Gateway باید آنلاین بماند تا رأی‌ها را ثبت کند.
- نظرسنجی‌ها هنوز خلاصهٔ نتایج را به‌صورت خودکار ارسال نمی‌کنند (در صورت نیاز فایل ذخیره‌سازی را بررسی کنید).

## کارت‌های ارائه

با استفاده از ابزار `message` یا CLI، محموله‌های معنایی ارائه را به کاربران یا گفت‌وگوهای Teams بفرستید. OpenClaw آن‌ها را از قرارداد عمومی ارائه به‌صورت Teams Adaptive Cards رندر می‌کند.

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

هدف‌های MSTeams از پیشوندها برای تمایز بین کاربران و گفت‌وگوها استفاده می‌کنند:

| نوع هدف              | قالب                            | نمونه                                              |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| کاربر (بر اساس شناسه) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| کاربر (بر اساس نام)  | `user:<display-name>`            | `user:John Smith` (به Graph API نیاز دارد)          |
| گروه/کانال           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| گروه/کانال (خام)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (اگر شامل `@thread` باشد) |

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
بدون پیشوند `user:`، نام‌ها به‌صورت پیش‌فرض برای تفکیک گروه یا تیم در نظر گرفته می‌شوند. هنگام هدف‌گیری افراد بر اساس نام نمایشی، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **پس از** تعامل یک کاربر ممکن هستند، چون در آن نقطه ارجاع‌های گفت‌وگو را ذخیره می‌کنیم.
- برای `dmPolicy` و کنترل فهرست مجاز، `/gateway/configuration` را ببینید.

## شناسه‌های تیم و کانال (اشتباه رایج)

پارامتر پرس‌وجوی `groupId` در URLهای Teams، شناسهٔ تیم مورد استفاده برای پیکربندی **نیست**. به‌جای آن، شناسه‌ها را از مسیر URL استخراج کنید:

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

- کلید تیم = قطعهٔ مسیر پس از `/team/` (URL-decoded، برای مثال `19:Bk4j...@thread.tacv2`؛ مستأجرهای قدیمی‌تر ممکن است `@thread.skype` را نشان دهند که آن هم معتبر است)
- کلید کانال = قطعهٔ مسیر پس از `/channel/` (URL-decoded)
- پارامتر پرس‌وجوی `groupId` را برای مسیریابی OpenClaw **نادیده بگیرید**. این شناسهٔ گروه Microsoft Entra است، نه شناسهٔ گفت‌وگوی Bot Framework که در فعالیت‌های ورودی Teams استفاده می‌شود.

## کانال‌های خصوصی

بات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت                       | کانال‌های استاندارد | کانال‌های خصوصی             |
| ---------------------------- | ----------------- | ---------------------- |
| نصب بات                      | بله               | محدود                  |
| پیام‌های بلادرنگ (Webhook)   | بله               | ممکن است کار نکند       |
| مجوزهای RSC                  | بله               | ممکن است متفاوت رفتار کند |
| @mentions                    | بله               | اگر بات قابل دسترسی باشد |
| تاریخچهٔ Graph API           | بله               | بله (با مجوزها)         |

**راهکارها در صورتی که کانال‌های خصوصی کار نکنند:**

1. برای تعاملات بات از کانال‌های استاندارد استفاده کنید
2. از پیام‌های مستقیم استفاده کنید - کاربران همیشه می‌توانند مستقیماً به بات پیام بدهند
3. برای دسترسی تاریخی از Graph API استفاده کنید (به `ChannelMessage.Read.All` نیاز دارد)

## عیب‌یابی

### مشکلات رایج

- **تصاویر در کانال‌ها نمایش داده نمی‌شوند:** مجوزهای Graph یا رضایت مدیر وجود ندارد. برنامهٔ Teams را دوباره نصب کنید و Teams را کاملاً ببندید/دوباره باز کنید.
- **پاسخی در کانال دریافت نمی‌شود:** mentionها به‌صورت پیش‌فرض الزامی هستند؛ `channels.msteams.requireMention=false` را تنظیم کنید یا برای هر تیم/کانال پیکربندی کنید.
- **ناسازگاری نسخه (Teams هنوز manifest قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و برای تازه‌سازی، Teams را کاملاً ببندید.
- **401 Unauthorized از Webhook:** هنگام آزمون دستی بدون Azure JWT مورد انتظار است - یعنی endpoint قابل دسترسی است اما احراز هویت شکست خورده است. برای آزمون درست از Azure Web Chat استفاده کنید.

### خطاهای بارگذاری manifest

- **"Icon file cannot be empty":** manifest به فایل‌های آیکونی ارجاع می‌دهد که ۰ بایت هستند. آیکون‌های PNG معتبر ایجاد کنید (32x32 برای `outline.png`، 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه هنوز در تیم/چت دیگری نصب است. ابتدا آن را پیدا و حذف نصب کنید، یا ۵ تا ۱۰ دقیقه برای انتشار تغییرات صبر کنید.
- **"Something went wrong" هنگام بارگذاری:** به‌جای آن از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بارگذاری کنید، DevTools مرورگر (F12) → زبانهٔ Network را باز کنید و بدنهٔ پاسخ را برای خطای واقعی بررسی کنید.
- **شکست sideload:** به‌جای "Upload a custom app"، گزینهٔ "Upload an app to your org's app catalog" را امتحان کنید - این کار اغلب محدودیت‌های sideload را دور می‌زند.

### مجوزهای RSC کار نمی‌کنند

1. تأیید کنید `webApplicationInfo.id` دقیقاً با App ID بات شما مطابقت دارد
2. برنامه را دوباره بارگذاری کنید و در تیم/چت دوباره نصب کنید
3. بررسی کنید آیا مدیر سازمان شما مجوزهای RSC را مسدود کرده است
4. تأیید کنید از دامنهٔ درست استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای چت‌های گروهی

## منابع

- [ایجاد Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - ایجاد/مدیریت برنامه‌های Teams
- [طرح‌وارهٔ manifest برنامهٔ Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل بات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI برای مدیریت بات

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و کنترل mention
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
