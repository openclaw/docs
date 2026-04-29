---
read_when:
    - کار روی ویژگی‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-29T22:27:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 535bd7f9713f221572a99ae3a7a39d7acdd5a1e41c2d79a43d4caf9c2ce2b159
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: متن + پیوست‌های DM پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (نگاه کنید به [ارسال فایل‌ها در گفت‌وگوهای گروهی](#sending-files-in-group-chats)). نظرسنجی‌ها از طریق Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌های فایل‌محور ارائه می‌کنند.

## Plugin بسته‌بندی‌شده

Microsoft Teams در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin بسته‌بندی‌شده ارائه می‌شود، بنابراین در بیلد بسته‌بندی‌شده‌ی معمولی به نصب جداگانه نیاز نیست.

اگر روی بیلد قدیمی‌تر یا نصب سفارشی‌ای هستید که Teams بسته‌بندی‌شده را حذف کرده است، وقتی یک بسته‌ی npm فعلی منتشر شد، آن را نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

اگر npm گزارش داد که بسته‌ی متعلق به OpenClaw منسوخ شده است، تا زمانی که بسته‌ی npm جدیدتری منتشر شود از یک بیلد بسته‌بندی‌شده‌ی فعلی OpenClaw یا مسیر checkout محلی استفاده کنید.

checkout محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت بات، ساخت manifest، و تولید اعتبارنامه را در یک فرمان انجام می‌دهد.

**1. نصب و ورود**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI در حال حاضر در حالت پیش‌نمایش است. فرمان‌ها و پرچم‌ها ممکن است بین نسخه‌ها تغییر کنند.
</Note>

**2. یک تونل شروع کنید** (Teams نمی‌تواند به localhost دسترسی پیدا کند)

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
`--allow-anonymous` لازم است، چون Teams نمی‌تواند با devtunnels احراز هویت کند. هر درخواست ورودی بات همچنان به‌صورت خودکار توسط Teams SDK اعتبارسنجی می‌شود.
</Note>

جایگزین‌ها: `ngrok http 3978` یا `tailscale funnel 3978` (اما این‌ها ممکن است در هر نشست URLها را تغییر دهند).

**3. ساخت برنامه**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این فرمان واحد:

- یک برنامه‌ی Entra ID (Azure AD) می‌سازد
- یک client secret تولید می‌کند
- یک Teams app manifest را می‌سازد و بارگذاری می‌کند (با آیکن‌ها)
- بات را ثبت می‌کند (به‌طور پیش‌فرض مدیریت‌شده توسط Teams — بدون نیاز به اشتراک Azure)

خروجی، `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID`، و یک **Teams App ID** را نشان می‌دهد — این‌ها را برای مراحل بعد یادداشت کنید. همچنین پیشنهاد می‌دهد برنامه را مستقیماً در Teams نصب کنید.

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

`teams app create` از شما می‌خواهد برنامه را نصب کنید — "Install in Teams" را انتخاب کنید. اگر آن را رد کردید، می‌توانید بعداً لینک را دریافت کنید:

```bash
teams app get <teamsAppId> --install-link
```

**6. تأیید کارکرد همه‌چیز**

```bash
teams app doctor <teamsAppId>
```

این فرمان diagnostics را روی ثبت بات، پیکربندی برنامه‌ی AAD، اعتبار manifest، و راه‌اندازی SSO اجرا می‌کند.

برای استقرارهای تولید، به‌جای client secretها، استفاده از [احراز هویت فدره‌شده](/fa/channels/msteams#federated-authentication-certificate-plus-managed-identity) (گواهی یا managed identity) را در نظر بگیرید.

<Note>
گفت‌وگوهای گروهی به‌طور پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای اجازه دادن به پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` برای اجازه دادن به هر عضو استفاده کنید (محدود به mention).
</Note>

## اهداف

- از طریق DMهای Teams، گفت‌وگوهای گروهی، یا کانال‌ها با OpenClaw صحبت کنید.
- مسیریابی را قطعی نگه دارید: پاسخ‌ها همیشه به کانالی برمی‌گردند که از آن آمده‌اند.
- به‌طور پیش‌فرض از رفتار ایمن کانال استفاده کنید (mention لازم است مگر اینکه خلاف آن پیکربندی شده باشد).

## نوشتن‌های پیکربندی

به‌طور پیش‌فرض، Microsoft Teams اجازه دارد به‌روزرسانی‌های پیکربندی فعال‌شده توسط `/config set|unset` را بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (DMها + گروه‌ها)

**دسترسی DM**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستنده‌های ناشناس تا زمان تأیید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از AAD object IDهای پایدار استفاده کند.
- برای allowlistها به تطبیق UPN/display-name تکیه نکنید — ممکن است تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌طور پیش‌فرض غیرفعال می‌کند؛ با `channels.msteams.dangerouslyAllowNameMatching: true` صریحاً آن را فعال کنید.
- wizard می‌تواند وقتی اعتبارنامه‌ها اجازه دهند، نام‌ها را از طریق Microsoft Graph به IDها resolve کند.

**دسترسی گروه**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است مگر اینکه `groupAllowFrom` را اضافه کنید). برای override کردن مقدار پیش‌فرض هنگام تنظیم‌نبودن، از `channels.defaults.groupPolicy` استفاده کنید.
- `channels.msteams.groupAllowFrom` کنترل می‌کند کدام فرستنده‌ها می‌توانند در گفت‌وگوهای گروهی/کانال‌ها فعال شوند (به `channels.msteams.allowFrom` fallback می‌کند).
- `groupPolicy: "open"` را تنظیم کنید تا هر عضو مجاز باشد (همچنان به‌طور پیش‌فرض محدود به mention).
- برای اجازه دادن به **هیچ کانالی**، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

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

- پاسخ‌های گروه/کانال را با فهرست کردن تیم‌ها و کانال‌ها زیر `channels.msteams.teams` محدود کنید.
- کلیدها باید از team IDها و channel conversation IDهای پایدار استفاده کنند.
- وقتی `groupPolicy="allowlist"` و یک allowlist تیم‌ها وجود دارد، فقط تیم‌ها/کانال‌های فهرست‌شده پذیرفته می‌شوند (محدود به mention).
- wizard پیکربندی، ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام راه‌اندازی، OpenClaw نام‌های allowlist تیم/کانال و کاربر را به IDها resolve می‌کند (وقتی مجوزهای Graph اجازه دهند)
  و نگاشت را log می‌کند؛ نام‌های resolveنشده‌ی تیم/کانال همان‌طور که تایپ شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` فعال باشد.

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

### نحوه‌ی کارکرد

1. مطمئن شوید Microsoft Teams Plugin در دسترس است (در نسخه‌های فعلی بسته‌بندی شده است).
2. یک **Azure Bot** بسازید (App ID + secret + tenant ID).
3. یک **Teams app package** بسازید که به بات ارجاع دهد و مجوزهای RSC زیر را شامل شود.
4. Teams app را در یک تیم (یا scope شخصی برای DMها) بارگذاری/نصب کنید.
5. `msteams` را در `~/.openclaw/openclaw.json` (یا env vars) پیکربندی کنید و Gateway را شروع کنید.
6. Gateway به‌طور پیش‌فرض برای ترافیک Webhook مربوط به Bot Framework روی `/api/messages` گوش می‌دهد.

### مرحله 1: ساخت Azure Bot

1. به [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید
2. زبانه‌ی **Basics** را پر کنید:

   | فیلد              | مقدار                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | نام بات شما، مثلاً `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription**   | اشتراک Azure خود را انتخاب کنید                           |
   | **Resource group** | جدید بسازید یا از موجود استفاده کنید                               |
   | **Pricing tier**   | **Free** برای توسعه/آزمایش                                 |
   | **Type of App**    | **Single Tenant** (توصیه‌شده - یادداشت زیر را ببینید)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
ساخت بات‌های چندمستاجری جدید بعد از 2025-07-31 منسوخ شد. برای بات‌های جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** → **Create** کلیک کنید (حدود 1 تا 2 دقیقه صبر کنید)

### مرحله 2: دریافت اعتبارنامه‌ها

1. به منبع Azure Bot خود بروید → **Configuration**
2. **Microsoft App ID** را کپی کنید → این `appId` شماست
3. روی **Manage Password** کلیک کنید → به App Registration بروید
4. زیر **Certificates & secrets** → **New client secret** → **Value** را کپی کنید → این `appPassword` شماست
5. به **Overview** بروید → **Directory (tenant) ID** را کپی کنید → این `tenantId` شماست

### مرحله 3: پیکربندی Messaging Endpoint

1. در Azure Bot → **Configuration**
2. **Messaging endpoint** را روی URL Webhook خود تنظیم کنید:
   - تولید: `https://your-domain.com/api/messages`
   - توسعه‌ی محلی: از یک تونل استفاده کنید (نگاه کنید به [توسعه‌ی محلی](#local-development-tunneling) در پایین)

### مرحله 4: فعال‌سازی کانال Teams

1. در Azure Bot → **Channels**
2. روی **Microsoft Teams** → Configure → Save کلیک کنید
3. شرایط خدمات را بپذیرید

### مرحله 5: ساخت Teams App Manifest

- یک ورودی `bot` با `botId = <App ID>` اضافه کنید.
- scopeها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای مدیریت فایل در scope شخصی لازم است).
- مجوزهای RSC را اضافه کنید (نگاه کنید به [مجوزهای فعلی Teams RSC در manifest](#current-teams-rsc-permissions-manifest)).
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

وقتی Plugin در دسترس باشد و پیکربندی `msteams` با اعتبارنامه‌ها وجود داشته باشد، کانال Teams به‌صورت خودکار شروع می‌شود.

</details>

## احراز هویت فدره‌شده (گواهی به‌علاوه managed identity)

> افزوده‌شده در 2026.4.11

برای استقرارهای تولید، OpenClaw از **احراز هویت فدره‌شده** به‌عنوان جایگزینی امن‌تر برای client secretها پشتیبانی می‌کند. دو روش در دسترس است:

### گزینه A: احراز هویت مبتنی بر گواهی

از یک گواهی PEM ثبت‌شده در app registration مربوط به Entra ID خود استفاده کنید.

**راه‌اندازی:**

1. یک گواهی تولید یا دریافت کنید (فرمت PEM با کلید خصوصی).
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

برای احراز هویت بدون گذرواژه از Azure Managed Identity استفاده کنید. این برای استقرارها روی زیرساخت Azure (AKS، App Service، VMهای Azure) که managed identity در آن‌ها موجود است ایده‌آل است.

**نحوه‌ی کارکرد:**

1. pod/VM بات یک managed identity دارد (system-assigned یا user-assigned).
2. یک **federated identity credential**، managed identity را به app registration مربوط به Entra ID وصل می‌کند.
3. در زمان اجرا، OpenClaw از `@azure/identity` برای دریافت token از endpoint مربوط به Azure IMDS (`169.254.169.254`) استفاده می‌کند.
4. token برای احراز هویت بات به Teams SDK داده می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با managed identity فعال (AKS workload identity، App Service، VM)
- federated identity credential ساخته‌شده روی app registration مربوط به Entra ID
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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط برای مورد اختصاص‌یافته به کاربر)

### راه‌اندازی هویت بارکاری AKS

برای استقرارهای AKS که از هویت بارکاری استفاده می‌کنند:

1. **هویت بارکاری را فعال کنید** روی کلاستر AKS خود.
2. **یک اعتبارنامه هویت فدرال‌شده ایجاد کنید** در ثبت برنامه Entra ID:

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

4. **Pod را برچسب‌گذاری کنید** برای تزریق هویت بارکاری:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **دسترسی شبکه را تضمین کنید** به IMDS (`169.254.169.254`) — اگر از NetworkPolicy استفاده می‌کنید، یک قاعده خروجی اضافه کنید که ترافیک به `169.254.169.254/32` روی پورت 80 را مجاز کند.

### مقایسه نوع احراز هویت

| روش | پیکربندی | مزایا | معایب |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **راز کلاینت** | `appPassword` | راه‌اندازی ساده | نیازمند چرخش راز، امنیت کمتر |
| **گواهی** | `authType: "federated"` + `certificatePath` | بدون راز مشترک روی شبکه | سربار مدیریت گواهی |
| **هویت مدیریت‌شده** | `authType: "federated"` + `useManagedIdentity` | بدون رمز عبور، بدون نیاز به مدیریت رازها | نیازمند زیرساخت Azure |

**رفتار پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw به‌طور پیش‌فرض از احراز هویت راز کلاینت استفاده می‌کند. پیکربندی‌های موجود بدون تغییر همچنان کار می‌کنند.

## توسعه محلی (تونل‌سازی)

Teams نمی‌تواند به `localhost` دسترسی پیدا کند. از یک تونل توسعه پایدار استفاده کنید تا URL شما در نشست‌های مختلف یکسان بماند:

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

## آزمودن Bot

**اجرای عیب‌یابی:**

```bash
teams app doctor <teamsAppId>
```

ثبت Bot، برنامه AAD، manifest و پیکربندی SSO را در یک گذر بررسی می‌کند.

**ارسال پیام آزمایشی:**

1. برنامه Teams را نصب کنید (از پیوند نصب `teams app get <id> --install-link` استفاده کنید)
2. Bot را در Teams پیدا کنید و یک پیام مستقیم ارسال کنید
3. گزارش‌های Gateway را برای فعالیت ورودی بررسی کنید

## متغیرهای محیطی

همه کلیدهای پیکربندی را می‌توان به‌جای آن از طریق متغیرهای محیطی تنظیم کرد:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختیاری: `"secret"` یا `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (فدرال‌شده + گواهی)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختیاری، برای احراز هویت لازم نیست)
- `MSTEAMS_USE_MANAGED_IDENTITY` (فدرال‌شده + هویت مدیریت‌شده)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI اختصاص‌یافته به کاربر)

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` مبتنی بر Graph برای Microsoft Teams ارائه می‌کند تا عامل‌ها و خودکارسازی‌ها بتوانند جزئیات اعضای کانال (نام نمایشی، ایمیل، نقش) را مستقیماً از Microsoft Graph واکشی کنند.

نیازمندی‌ها:

- مجوز RSC با نام `Member.Read.Group` (از قبل در manifest پیشنهادی وجود دارد)
- برای جست‌وجوهای بین‌تیمی: مجوز برنامه Graph با نام `User.Read.All` همراه با رضایت مدیر

این کنش با `channels.msteams.actions.memberInfo` کنترل می‌شود (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).

## زمینه تاریخچه

- `channels.msteams.historyLimit` کنترل می‌کند چند پیام اخیر کانال/گروه در prompt پیچیده شوند.
- به `messages.groupChat.historyLimit` بازمی‌گردد. برای غیرفعال‌سازی `0` را تنظیم کنید (پیش‌فرض 50).
- تاریخچه thread واکشی‌شده بر اساس allowlistهای فرستنده (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود، بنابراین مقداردهی اولیه زمینه thread فقط شامل پیام‌های فرستندگان مجاز است.
- زمینه پیوست نقل‌قول‌شده (`ReplyTo*` مشتق‌شده از HTML پاسخ Teams) فعلاً همان‌طور که دریافت شده است ارسال می‌شود.
- به بیان دیگر، allowlistها تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند؛ امروزه فقط مسیرهای زمینه تکمیلی مشخصی فیلتر می‌شوند.
- تاریخچه DM را می‌توان با `channels.msteams.dmHistoryLimit` محدود کرد (نوبت‌های کاربر). بازنویسی‌های هر کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

## مجوزهای فعلی RSC در Teams (manifest)

این‌ها **مجوزهای resourceSpecific موجود** در manifest برنامه Teams ما هستند. آن‌ها فقط داخل تیم/چتی اعمال می‌شوند که برنامه در آن نصب شده است.

**برای کانال‌ها (محدوده تیم):**

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

نمونه حداقلی و معتبر با فیلدهای الزامی. شناسه‌ها و URLها را جایگزین کنید.

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
- `bots[].scopes` باید سطوحی را که قصد استفاده از آن‌ها را دارید شامل شود (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` برای مدیریت فایل در محدوده شخصی الزامی است.
- اگر ترافیک کانال را می‌خواهید، `authorization.permissions.resourceSpecific` باید خواندن/ارسال کانال را شامل شود.

### به‌روزرسانی یک برنامه موجود

برای به‌روزرسانی برنامه Teams که از قبل نصب شده است (مثلاً برای افزودن مجوزهای RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

پس از به‌روزرسانی، برنامه را در هر تیم دوباره نصب کنید تا مجوزهای جدید اعمال شوند، و **Teams را کاملاً ببندید و دوباره اجرا کنید** (نه فقط بستن پنجره) تا فراداده کش‌شده برنامه پاک شود.

<details>
<summary>به‌روزرسانی دستی manifest (بدون CLI)</summary>

1. `manifest.json` خود را با تنظیمات جدید به‌روزرسانی کنید
2. **فیلد `version` را افزایش دهید** (مثلاً `1.0.0` → `1.1.0`)
3. manifest را همراه با آیکن‌ها **دوباره zip کنید** (`manifest.json`، `outline.png`، `color.png`)
4. فایل zip جدید را بارگذاری کنید:
   - **Teams Admin Center:** برنامه‌های Teams → مدیریت برنامه‌ها → برنامه خود را پیدا کنید → بارگذاری نسخه جدید
   - **Sideload:** در Teams → برنامه‌ها → مدیریت برنامه‌هایتان → بارگذاری یک برنامه سفارشی

</details>

## قابلیت‌ها: فقط RSC در برابر Graph

### با **فقط Teams RSC** (برنامه نصب‌شده، بدون مجوزهای Graph API)

کار می‌کند:

- خواندن محتوای **متنی** پیام کانال.
- ارسال محتوای **متنی** پیام کانال.
- دریافت پیوست‌های فایل **شخصی (DM)**.

کار نمی‌کند:

- **محتوای تصویر یا فایل** کانال/گروه (payload فقط شامل stub مربوط به HTML است).
- دانلود پیوست‌های ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام (فراتر از رویداد زنده Webhook).

### با **Teams RSC + مجوزهای برنامه Microsoft Graph**

اضافه می‌کند:

- دانلود محتوای میزبانی‌شده (تصاویر چسبانده‌شده در پیام‌ها).
- دانلود پیوست‌های فایل ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام کانال/چت از طریق Graph.

### RSC در برابر Graph API

| قابلیت | مجوزهای RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **پیام‌های بلادرنگ** | بله (از طریق Webhook) | خیر (فقط polling) |
| **پیام‌های تاریخی** | خیر | بله (امکان پرس‌وجوی تاریخچه) |
| **پیچیدگی راه‌اندازی** | فقط manifest برنامه | نیازمند رضایت مدیر + جریان توکن |
| **کار در حالت آفلاین** | خیر (باید در حال اجرا باشد) | بله (پرس‌وجو در هر زمان) |

**خلاصه:** RSC برای گوش‌دادن بلادرنگ است؛ Graph API برای دسترسی تاریخی است. برای جبران پیام‌های ازدست‌رفته هنگام آفلاین بودن، به Graph API با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه و تاریخچه فعال‌شده با Graph (الزامی برای کانال‌ها)

اگر در **کانال‌ها** به تصاویر/فایل‌ها نیاز دارید یا می‌خواهید **تاریخچه پیام** را واکشی کنید، باید مجوزهای Microsoft Graph را فعال کنید و رضایت مدیر را اعطا کنید.

1. در **ثبت برنامه** Entra ID (Azure AD)، **مجوزهای برنامه** Microsoft Graph را اضافه کنید:
   - `ChannelMessage.Read.All` (پیوست‌ها + تاریخچه کانال)
   - `Chat.Read.All` یا `ChatMessage.Read.All` (چت‌های گروهی)
2. **رضایت مدیر را اعطا کنید** برای tenant.
3. **نسخه manifest** برنامه Teams را افزایش دهید، دوباره بارگذاری کنید، و **برنامه را در Teams دوباره نصب کنید**.
4. **Teams را کاملاً ببندید و دوباره اجرا کنید** تا فراداده کش‌شده برنامه پاک شود.

**مجوز اضافی برای mention کردن کاربران:** @mention کاربران برای کاربرانی که در مکالمه هستند به‌صورت پیش‌فرض کار می‌کند. بااین‌حال، اگر می‌خواهید کاربرانی را که **در مکالمه فعلی نیستند** به‌صورت پویا جست‌وجو و mention کنید، مجوز `User.Read.All` (Application) را اضافه کنید و رضایت مدیر را اعطا کنید.

## محدودیت‌های شناخته‌شده

### زمان‌پایان‌های Webhook

Teams پیام‌ها را از طریق Webhook HTTP تحویل می‌دهد. اگر پردازش بیش از حد طول بکشد (مثلاً پاسخ‌های کند LLM)، ممکن است موارد زیر را ببینید:

- زمان‌پایان‌های Gateway
- تلاش دوباره Teams برای پیام (که باعث ایجاد موارد تکراری می‌شود)
- پاسخ‌های حذف‌شده

OpenClaw این مورد را با بازگشت سریع و ارسال پیش‌دستانهٔ پاسخ‌ها مدیریت می‌کند، اما پاسخ‌های بسیار کند همچنان ممکن است مشکل ایجاد کنند.

### قالب‌بندی

مارک‌داون Teams محدودتر از Slack یا Discord است:

- قالب‌بندی پایه کار می‌کند: **پررنگ**، _کج_، `code`، پیوندها
- مارک‌داون پیچیده (جدول‌ها، فهرست‌های تو‌در‌تو) ممکن است درست رندر نشود
- Adaptive Cards برای نظرسنجی‌ها و ارسال‌های ارائهٔ معنایی پشتیبانی می‌شوند (پایین را ببینید)

## پیکربندی

تنظیمات کلیدی (برای الگوهای مشترک کانال، `/gateway/configuration` را ببینید):

- `channels.msteams.enabled`: فعال/غیرفعال کردن کانال.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اعتبارنامه‌های بات.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`)
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing)
- `channels.msteams.allowFrom`: فهرست مجاز پیام مستقیم (شناسه‌های شیء AAD توصیه می‌شود). جادوگر هنگام راه‌اندازی، در صورت دسترس بودن Graph، نام‌ها را به شناسه‌ها تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: کلید اضطراری برای فعال‌سازی دوبارهٔ تطبیق قابل‌تغییر UPN/نام نمایشی و مسیریابی مستقیم با نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازهٔ قطعه‌های متن خروجی.
- `channels.msteams.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خط‌های خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز برای میزبان‌های پیوست ورودی (به‌صورت پیش‌فرض دامنه‌های Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای افزودن سرآیندهای Authorization در تلاش دوبارهٔ رسانه (به‌صورت پیش‌فرض میزبان‌های Graph و Bot Framework).
- `channels.msteams.requireMention`: الزام @mention در کانال‌ها/گروه‌ها (پیش‌فرض true).
- `channels.msteams.replyStyle`: `thread | top-level` ( [سبک پاسخ](#reply-style-threads-vs-posts) را ببینید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی به‌ازای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی به‌ازای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض سیاست ابزار به‌ازای هر تیم (`allow`/`deny`/`alsoAllow`) که وقتی بازنویسی کانال وجود ندارد استفاده می‌شود.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض سیاست ابزار به‌ازای هر تیم و هر فرستنده (wildcard با `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی به‌ازای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی به‌ازای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های سیاست ابزار به‌ازای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های سیاست ابزار به‌ازای هر کانال و هر فرستنده (wildcard با `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند:
  `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.actions.memberInfo`: فعال یا غیرفعال کردن کنش اطلاعات عضو مبتنی بر Graph (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).
- `channels.msteams.authType`: نوع احراز هویت — `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (احراز هویت federated + گواهی).
- `channels.msteams.certificateThumbprint`: اثرانگشت گواهی (اختیاری، برای احراز هویت الزامی نیست).
- `channels.msteams.useManagedIdentity`: فعال کردن احراز هویت با هویت مدیریت‌شده (حالت federated).
- `channels.msteams.managedIdentityClientId`: شناسهٔ کلاینت برای هویت مدیریت‌شدهٔ اختصاص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسهٔ سایت SharePoint برای بارگذاری فایل در گفت‌وگوهای گروهی/کانال‌ها ([ارسال فایل در گفت‌وگوهای گروهی](#sending-files-in-group-chats) را ببینید).

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد عامل پیروی می‌کنند ([/concepts/session](/fa/concepts/session) را ببینید):
  - پیام‌های مستقیم نشست اصلی را به‌اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسهٔ گفت‌وگو استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams اخیراً دو سبک رابط کاربری کانال را روی همان مدل دادهٔ زیربنایی معرفی کرده است:

| سبک                     | توضیح                                                     | `replyStyle` پیشنهادی |
| ------------------------ | --------------------------------------------------------- | --------------------- |
| **پست‌ها** (کلاسیک)      | پیام‌ها به‌صورت کارت‌هایی با پاسخ‌های رشته‌ای زیرشان ظاهر می‌شوند | `thread` (پیش‌فرض)    |
| **رشته‌ها** (شبیه Slack) | پیام‌ها به‌صورت خطی جریان دارند، بیشتر شبیه Slack         | `top-level`           |

**مشکل:** API Teams مشخص نمی‌کند یک کانال از کدام سبک رابط کاربری استفاده می‌کند. اگر از `replyStyle` اشتباه استفاده کنید:

- `thread` در کانالی با سبک رشته‌ای → پاسخ‌ها به‌صورت تو‌در‌تو و ناموزون ظاهر می‌شوند
- `top-level` در کانالی با سبک پست‌ها → پاسخ‌ها به‌جای درون‌رشته‌ای، به‌صورت پست‌های جداگانهٔ سطح بالا ظاهر می‌شوند

**راه‌حل:** `replyStyle` را به‌ازای هر کانال، بر اساس نحوهٔ راه‌اندازی آن کانال پیکربندی کنید:

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
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 (SharePoint/OneDrive) قرار دارند. بار Webhook فقط شامل یک قطعهٔ HTML است، نه بایت‌های واقعی فایل. **مجوزهای Graph API لازم هستند** تا پیوست‌های کانال دانلود شوند.
- برای ارسال‌های صریحِ فایل‌محور، از `action=upload-file` با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود، و `filename` نام بارگذاری‌شده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانالی همراه با تصویر فقط به‌صورت متن دریافت می‌شوند (محتوای تصویر برای بات قابل دسترسی نیست).
به‌صورت پیش‌فرض، OpenClaw فقط رسانه را از نام میزبان‌های Microsoft/Teams دانلود می‌کند. با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای مجاز کردن هر میزبان از `["*"]` استفاده کنید).
سرآیندهای Authorization فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` افزوده می‌شوند (به‌صورت پیش‌فرض میزبان‌های Graph و Bot Framework). این فهرست را سخت‌گیرانه نگه دارید (از پسوندهای چندمستاجری پرهیز کنید).

## ارسال فایل در گفت‌وگوهای گروهی

بات‌ها می‌توانند با استفاده از جریان FileConsentCard در پیام‌های مستقیم فایل ارسال کنند (داخلی). با این حال، **ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها** به راه‌اندازی اضافه نیاز دارد:

| زمینه                    | فایل‌ها چگونه ارسال می‌شوند                | راه‌اندازی لازم                                  |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **پیام‌های مستقیم**      | FileConsentCard → کاربر می‌پذیرد → بات بارگذاری می‌کند | بدون تنظیمات اضافه کار می‌کند                   |
| **گفت‌وگوهای گروهی/کانال‌ها** | بارگذاری در SharePoint → اشتراک‌گذاری پیوند | به `sharePointSiteId` + مجوزهای Graph نیاز دارد |
| **تصاویر (هر زمینه‌ای)** | درون‌خطی با کدگذاری Base64                 | بدون تنظیمات اضافه کار می‌کند                   |

### چرا گفت‌وگوهای گروهی به SharePoint نیاز دارند

بات‌ها درایو شخصی OneDrive ندارند (نقطهٔ پایانی Graph API با `/me/drive` برای هویت‌های برنامه کار نمی‌کند). برای ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها، بات در یک **سایت SharePoint** بارگذاری می‌کند و یک پیوند اشتراک‌گذاری می‌سازد.

### راه‌اندازی

1. **مجوزهای Graph API را اضافه کنید** در Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - بارگذاری فایل‌ها در SharePoint
   - `Chat.Read.All` (Application) - اختیاری، پیوندهای اشتراک‌گذاری به‌ازای هر کاربر را فعال می‌کند

2. **رضایت مدیر** را برای مستاجر اعطا کنید.

3. **شناسهٔ سایت SharePoint خود را دریافت کنید:**

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
| فقط `Sites.ReadWrite.All`              | پیوند اشتراک‌گذاری در سطح سازمان (هرکسی در سازمان می‌تواند دسترسی داشته باشد) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | پیوند اشتراک‌گذاری به‌ازای هر کاربر (فقط اعضای گفت‌وگو می‌توانند دسترسی داشته باشند) |

اشتراک‌گذاری به‌ازای هر کاربر امن‌تر است، چون فقط مشارکت‌کنندگان گفت‌وگو می‌توانند به فایل دسترسی داشته باشند. اگر مجوز `Chat.Read.All` وجود نداشته باشد، بات به اشتراک‌گذاری در سطح سازمان بازمی‌گردد.

### رفتار جایگزین

| سناریو                                           | نتیجه                                             |
| ------------------------------------------------ | ------------------------------------------------- |
| گفت‌وگوی گروهی + فایل + `sharePointSiteId` پیکربندی‌شده | بارگذاری در SharePoint، ارسال پیوند اشتراک‌گذاری |
| گفت‌وگوی گروهی + فایل + بدون `sharePointSiteId` | تلاش برای بارگذاری OneDrive (ممکن است شکست بخورد)، فقط ارسال متن |
| گفت‌وگوی شخصی + فایل                             | جریان FileConsentCard (بدون SharePoint کار می‌کند) |
| هر زمینه‌ای + تصویر                              | درون‌خطی با کدگذاری Base64 (بدون SharePoint کار می‌کند) |

### محل ذخیرهٔ فایل‌ها

فایل‌های بارگذاری‌شده در پوشهٔ `/OpenClawShared/` در کتابخانهٔ اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (Adaptive Cards)

OpenClaw نظرسنجی‌های Teams را به‌صورت Adaptive Cards ارسال می‌کند (API نظرسنجی بومی Teams وجود ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- رأی‌ها توسط Gateway در `~/.openclaw/msteams-polls.json` ثبت می‌شوند.
- Gateway باید آنلاین بماند تا رأی‌ها ثبت شوند.
- نظرسنجی‌ها هنوز خلاصهٔ نتایج را به‌صورت خودکار پست نمی‌کنند (در صورت نیاز، فایل ذخیره را بررسی کنید).

## کارت‌های ارائه

بارهای ارائهٔ معنایی را با استفاده از ابزار `message` یا CLI به کاربران یا گفت‌وگوهای Teams ارسال کنید. OpenClaw آن‌ها را از قرارداد عمومی ارائه به‌صورت Adaptive Cards در Teams رندر می‌کند.

پارامتر `presentation` بلوک‌های معنایی می‌پذیرد. وقتی `presentation` ارائه شود، متن پیام اختیاری است.

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

مقصدهای MSTeams از پیشوندها برای تمایز بین کاربران و گفت‌وگوها استفاده می‌کنند:

| نوع مقصد              | قالب                            | مثال                                                |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| کاربر (بر اساس شناسه) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| کاربر (بر اساس نام)   | `user:<display-name>`            | `user:John Smith` (به Graph API نیاز دارد)          |
| گروه/کانال            | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| گروه/کانال (خام)      | `<conversation-id>`              | `19:abc123...@thread.tacv2` (اگر شامل `@thread` باشد) |

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
بدون پیشوند `user:`، نام‌ها به‌طور پیش‌فرض به گروه یا تیم resolve می‌شوند. هنگام هدف‌گیری افراد با نام نمایشی، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **بعد از** تعامل کاربر ممکن هستند، چون در آن نقطه ارجاع‌های مکالمه را ذخیره می‌کنیم.
- برای `dmPolicy` و کنترل allowlist، `/gateway/configuration` را ببینید.

## شناسه‌های تیم و کانال (اشتباه رایج)

پارامتر query با نام `groupId` در URLهای Teams، شناسه تیم مورد استفاده برای پیکربندی **نیست**. به‌جای آن، شناسه‌ها را از مسیر URL استخراج کنید:

**URL تیم:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode this)
```

**URL کانال:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**برای پیکربندی:**

- شناسه تیم = قطعه مسیر بعد از `/team/` (URL-decoded، برای مثال `19:Bk4j...@thread.tacv2`)
- شناسه کانال = قطعه مسیر بعد از `/channel/` (URL-decoded)
- پارامتر query با نام `groupId` را **نادیده بگیرید**

## کانال‌های خصوصی

ربات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت                      | کانال‌های استاندارد | کانال‌های خصوصی       |
| ---------------------------- | ----------------- | ---------------------- |
| نصب ربات             | بله               | محدود                |
| پیام‌های بلادرنگ (Webhook) | بله               | ممکن است کار نکند           |
| مجوزهای RSC              | بله               | ممکن است رفتار متفاوتی داشته باشد |
| @mentionها                    | بله               | اگر ربات قابل دسترسی باشد   |
| تاریخچه Graph API            | بله               | بله (با مجوزها) |

**راه‌حل‌ها اگر کانال‌های خصوصی کار نمی‌کنند:**

1. برای تعاملات ربات از کانال‌های استاندارد استفاده کنید
2. از DMها استفاده کنید - کاربران همیشه می‌توانند مستقیما به ربات پیام بدهند
3. برای دسترسی تاریخی از Graph API استفاده کنید (به `ChannelMessage.Read.All` نیاز دارد)

## عیب‌یابی

### مشکلات رایج

- **تصاویر در کانال‌ها نمایش داده نمی‌شوند:** مجوزهای Graph یا رضایت مدیر وجود ندارد. برنامه Teams را دوباره نصب کنید و Teams را کاملا ببندید و دوباره باز کنید.
- **عدم پاسخ در کانال:** به‌طور پیش‌فرض mentionها لازم هستند؛ `channels.msteams.requireMention=false` را تنظیم کنید یا برای هر تیم/کانال جداگانه پیکربندی کنید.
- **عدم تطابق نسخه (Teams هنوز manifest قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و برای تازه‌سازی، Teams را کاملا ببندید.
- **401 Unauthorized از Webhook:** هنگام آزمون دستی بدون Azure JWT مورد انتظار است - یعنی endpoint قابل دسترسی است اما احراز هویت شکست خورده است. برای آزمون درست از Azure Web Chat استفاده کنید.

### خطاهای بارگذاری manifest

- **"Icon file cannot be empty":** manifest به فایل‌های آیکونی اشاره می‌کند که 0 بایت هستند. آیکون‌های PNG معتبر بسازید (32x32 برای `outline.png`، 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه هنوز در تیم/چت دیگری نصب است. ابتدا آن را پیدا و حذف نصب کنید، یا 5 تا 10 دقیقه برای انتشار تغییرات صبر کنید.
- **"Something went wrong" هنگام بارگذاری:** به‌جای آن از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بارگذاری کنید، DevTools مرورگر (F12) → زبانه Network را باز کنید، و بدنه پاسخ را برای خطای واقعی بررسی کنید.
- **شکست sideload:** به‌جای "Upload a custom app"، گزینه "Upload an app to your org's app catalog" را امتحان کنید - این کار اغلب محدودیت‌های sideload را دور می‌زند.

### مجوزهای RSC کار نمی‌کنند

1. بررسی کنید `webApplicationInfo.id` دقیقا با App ID ربات شما مطابقت داشته باشد
2. برنامه را دوباره بارگذاری کنید و در تیم/چت دوباره نصب کنید
3. بررسی کنید آیا مدیر سازمان شما مجوزهای RSC را مسدود کرده است یا نه
4. تایید کنید از scope درست استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای چت‌های گروهی

## منابع

- [ایجاد Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - ایجاد/مدیریت برنامه‌های Teams
- [طرح‌واره manifest برنامه Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل ربات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI برای مدیریت ربات

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و کنترل mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
