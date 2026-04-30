---
read_when:
    - در حال کار روی ویژگی‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی بات Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T09:34:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: متن + پیوست‌های DM پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (نگاه کنید به [ارسال فایل‌ها در گفت‌وگوهای گروهی](#sending-files-in-group-chats)). نظرسنجی‌ها از طریق Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌های فایل‌اول در دسترس می‌گذارند.

## Plugin همراه

Microsoft Teams در نسخه‌های کنونی OpenClaw به‌صورت یک Plugin همراه عرضه می‌شود، بنابراین در ساخت بسته‌بندی‌شده معمولی به نصب جداگانه نیاز نیست.

اگر روی یک ساخت قدیمی‌تر یا نصب سفارشی هستید که Teams همراه را حذف کرده است،
وقتی یک بسته npm کنونی منتشر شد، آن را نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

اگر npm بسته متعلق به OpenClaw را منسوخ گزارش کرد، تا زمانی که بسته npm جدیدتری
منتشر شود، از یک ساخت بسته‌بندی‌شده کنونی OpenClaw یا مسیر checkout محلی استفاده کنید.

checkout محلی (هنگام اجرا از یک repo گیت):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Plugins](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت ربات، ساخت manifest، و تولید اطلاعات اعتبارسنجی را در یک فرمان انجام می‌دهد.

**1. نصب و ورود**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI در حال حاضر در مرحله پیش‌نمایش است. فرمان‌ها و پرچم‌ها ممکن است بین نسخه‌ها تغییر کنند.
</Note>

**2. راه‌اندازی تونل** (Teams نمی‌تواند به localhost دسترسی پیدا کند)

اگر هنوز devtunnel CLI را نصب و احراز هویت نکرده‌اید، آن را نصب و احراز هویت کنید ([راهنمای شروع](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

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

گزینه‌های جایگزین: `ngrok http 3978` یا `tailscale funnel 3978` (اما این‌ها ممکن است در هر نشست URLها را تغییر دهند).

**3. ساخت برنامه**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این فرمان واحد:

- یک برنامه Entra ID (Azure AD) ایجاد می‌کند
- یک client secret تولید می‌کند
- یک manifest برنامه Teams می‌سازد و بارگذاری می‌کند (با آیکن‌ها)
- ربات را ثبت می‌کند (به‌صورت پیش‌فرض مدیریت‌شده توسط Teams — بدون نیاز به اشتراک Azure)

خروجی `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID`، و یک **Teams App ID** را نشان می‌دهد — این موارد را برای مراحل بعد یادداشت کنید. همچنین پیشنهاد می‌دهد برنامه را مستقیماً در Teams نصب کنید.

**4. پیکربندی OpenClaw** با استفاده از اطلاعات اعتبارسنجی خروجی:

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

`teams app create` از شما می‌خواهد برنامه را نصب کنید — «Install in Teams» را انتخاب کنید. اگر از آن گذشتید، می‌توانید بعداً لینک را بگیرید:

```bash
teams app get <teamsAppId> --install-link
```

**6. بررسی اینکه همه چیز کار می‌کند**

```bash
teams app doctor <teamsAppId>
```

این فرمان عیب‌یابی را روی ثبت ربات، پیکربندی برنامه AAD، اعتبار manifest، و راه‌اندازی SSO اجرا می‌کند.

برای استقرارهای production، به‌جای client secretها، استفاده از [احراز هویت فدره‌شده](/fa/channels/msteams#federated-authentication-certificate-plus-managed-identity) (گواهی یا managed identity) را در نظر بگیرید.

<Note>
گفت‌وگوهای گروهی به‌صورت پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای مجاز کردن پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` برای مجاز کردن هر عضو (مشروط به mention) استفاده کنید.
</Note>

## اهداف

- از طریق DMهای Teams، گفت‌وگوهای گروهی، یا کانال‌ها با OpenClaw صحبت کنید.
- مسیریابی را قطعی نگه دارید: پاسخ‌ها همیشه به همان کانالی برمی‌گردند که از آن رسیده‌اند.
- رفتار امن کانال را پیش‌فرض کنید (مگر اینکه خلاف آن پیکربندی شده باشد، mention لازم است).

## نوشتن پیکربندی

به‌صورت پیش‌فرض، Microsoft Teams اجازه دارد به‌روزرسانی‌های پیکربندی را که با `/config set|unset` آغاز شده‌اند بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (DMها + گروه‌ها)

**دسترسی DM**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستندگان ناشناس تا زمان تأیید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از شناسه‌های شیء پایدار AAD استفاده کند.
- برای allowlistها به تطبیق UPN/display-name تکیه نکنید — ممکن است تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌صورت پیش‌فرض غیرفعال می‌کند؛ با `channels.msteams.dangerouslyAllowNameMatching: true` صریحاً آن را فعال کنید.
- وقتی اطلاعات اعتبارسنجی اجازه دهد، wizard می‌تواند نام‌ها را از طریق Microsoft Graph به شناسه‌ها resolve کند.

**دسترسی گروهی**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است مگر اینکه `groupAllowFrom` اضافه کنید). برای override کردن مقدار پیش‌فرض هنگام تنظیم‌نبودن، از `channels.defaults.groupPolicy` استفاده کنید.
- `channels.msteams.groupAllowFrom` کنترل می‌کند کدام فرستندگان می‌توانند در گفت‌وگوهای گروهی/کانال‌ها trigger کنند (به `channels.msteams.allowFrom` fallback می‌کند).
- برای مجاز کردن هر عضو، `groupPolicy: "open"` را تنظیم کنید (همچنان به‌صورت پیش‌فرض مشروط به mention).
- برای مجاز کردن **هیچ کانالی**، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

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
- کلیدها باید از شناسه‌های پایدار گفت‌وگوی Teams در لینک‌های Teams استفاده کنند، نه نام‌های نمایشی قابل‌تغییر.
- وقتی `groupPolicy="allowlist"` باشد و یک allowlist تیم‌ها وجود داشته باشد، فقط تیم‌ها/کانال‌های فهرست‌شده پذیرفته می‌شوند (مشروط به mention).
- wizard پیکربندی ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام شروع، OpenClaw نام‌های allowlist تیم/کانال و کاربر را به شناسه‌ها resolve می‌کند (وقتی مجوزهای Graph اجازه دهند)
  و نگاشت را log می‌کند؛ نام‌های resolveنشده تیم/کانال همان‌طور که تایپ شده‌اند نگه داشته می‌شوند اما به‌صورت پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند، مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` فعال شده باشد.

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

اگر نمی‌توانید از Teams CLI استفاده کنید، می‌توانید ربات را به‌صورت دستی از طریق Azure Portal راه‌اندازی کنید.

### سازوکار

1. مطمئن شوید Plugin Microsoft Teams در دسترس است (در نسخه‌های کنونی همراه است).
2. یک **Azure Bot** بسازید (App ID + secret + tenant ID).
3. یک **بسته برنامه Teams** بسازید که به ربات اشاره می‌کند و مجوزهای RSC زیر را شامل می‌شود.
4. برنامه Teams را در یک تیم (یا scope شخصی برای DMها) بارگذاری/نصب کنید.
5. `msteams` را در `~/.openclaw/openclaw.json` (یا متغیرهای env) پیکربندی کنید و Gateway را شروع کنید.
6. Gateway به‌صورت پیش‌فرض روی `/api/messages` برای ترافیک Webhook Bot Framework گوش می‌دهد.

### مرحله 1: ساخت Azure Bot

1. به [ساخت Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید
2. تب **Basics** را پر کنید:

   | فیلد              | مقدار                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | نام ربات شما، مثلاً `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription**   | اشتراک Azure خود را انتخاب کنید                           |
   | **Resource group** | مورد جدید بسازید یا از موجود استفاده کنید                               |
   | **Pricing tier**   | **Free** برای dev/testing                                 |
   | **Type of App**    | **Single Tenant** (توصیه‌شده - یادداشت زیر را ببینید)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
ساخت ربات‌های multi-tenant جدید پس از 2025-07-31 منسوخ شد. برای ربات‌های جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** → **Create** کلیک کنید (حدود 1 تا 2 دقیقه صبر کنید)

### مرحله 2: دریافت اطلاعات اعتبارسنجی

1. به منبع Azure Bot خود بروید → **Configuration**
2. **Microsoft App ID** را کپی کنید → این `appId` شما است
3. روی **Manage Password** کلیک کنید → به App Registration بروید
4. زیر **Certificates & secrets** → **New client secret** → **Value** را کپی کنید → این `appPassword` شما است
5. به **Overview** بروید → **Directory (tenant) ID** را کپی کنید → این `tenantId` شما است

### مرحله 3: پیکربندی Messaging Endpoint

1. در Azure Bot → **Configuration**
2. **Messaging endpoint** را روی URL Webhook خود تنظیم کنید:
   - Production: `https://your-domain.com/api/messages`
   - توسعه محلی: از یک تونل استفاده کنید (پایین‌تر [توسعه محلی](#local-development-tunneling) را ببینید)

### مرحله 4: فعال‌سازی کانال Teams

1. در Azure Bot → **Channels**
2. روی **Microsoft Teams** کلیک کنید → Configure → Save
3. Terms of Service را بپذیرید

### مرحله 5: ساخت manifest برنامه Teams

- یک ورودی `bot` با `botId = <App ID>` اضافه کنید.
- Scopeها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای مدیریت فایل در scope شخصی لازم است).
- مجوزهای RSC را اضافه کنید (نگاه کنید به [مجوزهای RSC](#current-teams-rsc-permissions-manifest)).
- آیکن‌ها را بسازید: `outline.png` (32x32) و `color.png` (192x192).
- هر سه فایل را با هم Zip کنید: `manifest.json`، `outline.png`، `color.png`.

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

کانال Teams زمانی که Plugin در دسترس باشد و config مربوط به `msteams` با اطلاعات اعتبارسنجی وجود داشته باشد، به‌صورت خودکار شروع می‌شود.

</details>

## احراز هویت فدره‌شده (گواهی به‌همراه managed identity)

> اضافه‌شده در 2026.4.11

برای استقرارهای production، OpenClaw از **احراز هویت فدره‌شده** به‌عنوان جایگزینی امن‌تر برای client secretها پشتیبانی می‌کند. دو روش در دسترس است:

### گزینه A: احراز هویت مبتنی بر گواهی

از یک گواهی PEM ثبت‌شده در app registration متعلق به Entra ID خود استفاده کنید.

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

**متغیرهای env:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### گزینه B: Azure Managed Identity

از Azure Managed Identity برای احراز هویت بدون گذرواژه استفاده کنید. این گزینه برای استقرارها روی زیرساخت Azure (AKS، App Service، Azure VMs) که در آن‌ها managed identity در دسترس است، ایدئال است.

**سازوکار:**

1. pod/VM ربات یک managed identity دارد (system-assigned یا user-assigned).
2. یک **federated identity credential**، managed identity را به app registration مربوط به Entra ID پیوند می‌دهد.
3. در زمان اجرا، OpenClaw از `@azure/identity` برای دریافت tokenها از endpoint Azure IMDS (`169.254.169.254`) استفاده می‌کند.
4. token برای احراز هویت ربات به Teams SDK پاس داده می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با managed identity فعال‌شده (AKS workload identity، App Service، VM)
- federated identity credential ساخته‌شده روی app registration مربوط به Entra ID
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

**پیکربندی (هویت مدیریت‌شده اختصاص‌داده‌شده به کاربر):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط برای اختصاص‌داده‌شده به کاربر)

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

3. **حساب سرویس Kubernetes را حاشیه‌نویسی کنید** با شناسه سرویس‌گیرنده برنامه:

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

5. **دسترسی شبکه را تضمین کنید** به IMDS (`169.254.169.254`) — اگر از NetworkPolicy استفاده می‌کنید، یک قاعده خروجی اضافه کنید که ترافیک به `169.254.169.254/32` روی پورت 80 را مجاز کند.

### مقایسه نوع احراز هویت

| روش                  | پیکربندی                                      | مزایا                              | معایب                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| **راز سرویس‌گیرنده** | `appPassword`                                  | راه‌اندازی ساده                   | نیازمند چرخش راز، امنیت کمتر              |
| **گواهی**            | `authType: "federated"` + `certificatePath`    | بدون راز مشترک روی شبکه           | سربار مدیریت گواهی                         |
| **هویت مدیریت‌شده**  | `authType: "federated"` + `useManagedIdentity` | بدون گذرواژه، بدون راز برای مدیریت | نیازمند زیرساخت Azure                      |

**رفتار پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw به‌طور پیش‌فرض از احراز هویت با راز سرویس‌گیرنده استفاده می‌کند. پیکربندی‌های موجود بدون تغییر به کار خود ادامه می‌دهند.

## توسعه محلی (تونل‌سازی)

Teams نمی‌تواند به `localhost` دسترسی پیدا کند. از یک تونل توسعه پایدار استفاده کنید تا URL شما در نشست‌های مختلف ثابت بماند:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

جایگزین‌ها: `ngrok http 3978` یا `tailscale funnel 3978` (ممکن است URLها در هر نشست تغییر کنند).

اگر URL تونل شما تغییر کرد، endpoint را به‌روزرسانی کنید:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## آزمایش ربات

**اجرای عیب‌یابی:**

```bash
teams app doctor <teamsAppId>
```

ثبت ربات، برنامه AAD، مانیفست، و پیکربندی SSO را در یک گذر بررسی می‌کند.

**ارسال پیام آزمایشی:**

1. برنامه Teams را نصب کنید (از لینک نصب در `teams app get <id> --install-link` استفاده کنید)
2. ربات را در Teams پیدا کنید و یک DM بفرستید
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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI اختصاص‌داده‌شده به کاربر)

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` مبتنی بر Graph برای Microsoft Teams ارائه می‌کند تا عامل‌ها و خودکارسازی‌ها بتوانند جزئیات عضو کانال (نام نمایشی، ایمیل، نقش) را مستقیماً از Microsoft Graph resolve کنند.

نیازمندی‌ها:

- مجوز RSC با نام `Member.Read.Group` (از قبل در مانیفست پیشنهادی وجود دارد)
- برای جست‌وجوهای بین‌تیمی: مجوز Application در Graph با نام `User.Read.All` همراه با رضایت مدیر

این کنش با `channels.msteams.actions.memberInfo` کنترل می‌شود (پیش‌فرض: وقتی اعتبارنامه‌های Graph در دسترس باشند فعال است).

## زمینه تاریخچه

- `channels.msteams.historyLimit` کنترل می‌کند چند پیام اخیر کانال/گروه در prompt قرار داده شوند.
- به `messages.groupChat.historyLimit` بازمی‌گردد. برای غیرفعال‌سازی مقدار `0` را تنظیم کنید (پیش‌فرض 50).
- تاریخچه نخ دریافت‌شده بر اساس فهرست‌های مجاز فرستنده (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود، بنابراین بذرگذاری زمینه نخ فقط شامل پیام‌های فرستندگان مجاز است.
- زمینه پیوست نقل‌قول‌شده (`ReplyTo*` مشتق‌شده از HTML پاسخ Teams) در حال حاضر همان‌طور که دریافت شده منتقل می‌شود.
- به بیان دیگر، فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند؛ امروز فقط مسیرهای خاص زمینه تکمیلی فیلتر می‌شوند.
- تاریخچه DM را می‌توان با `channels.msteams.dmHistoryLimit` محدود کرد (نوبت‌های کاربر). بازنویسی‌های هر کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

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

## نمونه مانیفست Teams (ویرایش‌شده برای حذف اطلاعات حساس)

نمونه حداقلی و معتبر با فیلدهای لازم. شناسه‌ها و URLها را جایگزین کنید.

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

### نکات مانیفست (فیلدهای ضروری)

- `bots[].botId` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `webApplicationInfo.id` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `bots[].scopes` باید سطوحی را شامل شود که قصد استفاده از آن‌ها را دارید (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` برای مدیریت فایل در دامنه شخصی لازم است.
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
<summary>به‌روزرسانی دستی مانیفست (بدون CLI)</summary>

1. `manifest.json` خود را با تنظیمات جدید به‌روزرسانی کنید
2. **فیلد `version` را افزایش دهید** (مثلاً `1.0.0` → `1.1.0`)
3. مانیفست را همراه با آیکن‌ها **دوباره zip کنید** (`manifest.json`، `outline.png`، `color.png`)
4. zip جدید را بارگذاری کنید:
   - **Teams Admin Center:** Teams apps → Manage apps → find your app → Upload new version
   - **Sideload:** In Teams → Apps → Manage your apps → Upload a custom app

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

### با **Teams RSC + مجوزهای Application در Microsoft Graph**

اضافه می‌کند:

- دانلود محتوای میزبانی‌شده (تصویرهایی که در پیام‌ها paste شده‌اند).
- دانلود پیوست‌های فایل ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام کانال/گپ از طریق Graph.

### RSC در برابر Graph API

| قابلیت                 | مجوزهای RSC          | Graph API                            |
| ----------------------- | -------------------- | ------------------------------------ |
| **پیام‌های بی‌درنگ**    | بله (از طریق webhook) | خیر (فقط polling)                    |
| **پیام‌های تاریخی**     | خیر                  | بله (می‌تواند تاریخچه را query کند)  |
| **پیچیدگی راه‌اندازی** | فقط مانیفست برنامه   | نیازمند رضایت مدیر + جریان token     |
| **کار در حالت آفلاین** | خیر (باید در حال اجرا باشد) | بله (query در هر زمان)          |

**جمع‌بندی:** RSC برای گوش‌دادن بی‌درنگ است؛ Graph API برای دسترسی تاریخی است. برای جبران پیام‌های ازدست‌رفته هنگام آفلاین بودن، به Graph API با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه و تاریخچه فعال‌شده با Graph (لازم برای کانال‌ها)

اگر به تصویر/فایل در **کانال‌ها** نیاز دارید یا می‌خواهید **تاریخچه پیام** را دریافت کنید، باید مجوزهای Microsoft Graph را فعال کنید و رضایت مدیر را اعطا کنید.

1. در Entra ID (Azure AD) **App Registration**، مجوزهای **Application** در Microsoft Graph را اضافه کنید:
   - `ChannelMessage.Read.All` (پیوست‌های کانال + تاریخچه)
   - `Chat.Read.All` یا `ChatMessage.Read.All` (گپ‌های گروهی)
2. **رضایت مدیر را اعطا کنید** برای tenant.
3. **نسخه مانیفست** برنامه Teams را افزایش دهید، دوباره بارگذاری کنید، و **برنامه را در Teams دوباره نصب کنید**.
4. **Teams را کاملاً ببندید و دوباره اجرا کنید** تا فراداده کش‌شده برنامه پاک شود.

**مجوز اضافی برای mention کردن کاربران:** @mention کاربران برای کاربرانی که در مکالمه هستند به‌صورت پیش‌فرض کار می‌کند. با این حال، اگر می‌خواهید کاربرانی را که **در مکالمه فعلی نیستند** به‌صورت پویا جست‌وجو و mention کنید، مجوز `User.Read.All` (Application) را اضافه کنید و رضایت مدیر را اعطا کنید.

## محدودیت‌های شناخته‌شده

### مهلت زمانی Webhook

Teams پیام‌ها را از طریق HTTP webhook تحویل می‌دهد. اگر پردازش بیش از حد طول بکشد (مثلاً پاسخ‌های کند LLM)، ممکن است با این موارد روبه‌رو شوید:

- پایان مهلت Gateway
- تلاش دوباره Teams برای پیام (که باعث تکرار می‌شود)
- پاسخ‌های حذف‌شده

OpenClaw این موضوع را با بازگشت سریع و ارسال پیش‌دستانهٔ پاسخ‌ها مدیریت می‌کند، اما پاسخ‌های بسیار کند همچنان ممکن است مشکل ایجاد کنند.

### قالب‌بندی

Markdown در Teams محدودتر از Slack یا Discord است:

- قالب‌بندی پایه کار می‌کند: **پررنگ**، _ایتالیک_، `code`، پیوندها
- Markdown پیچیده (جدول‌ها، فهرست‌های تودرتو) ممکن است درست نمایش داده نشود
- Adaptive Cards برای نظرسنجی‌ها و ارسال‌های ارائهٔ معنایی پشتیبانی می‌شوند (پایین را ببینید)

## پیکربندی

تنظیمات کلیدی (برای الگوهای مشترک کانال، `/gateway/configuration` را ببینید):

- `channels.msteams.enabled`: فعال/غیرفعال کردن کانال.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اطلاعات احراز هویت ربات.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`)
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing)
- `channels.msteams.allowFrom`: فهرست مجاز پیام مستقیم (شناسه‌های شیء AAD توصیه می‌شوند). وقتی دسترسی Graph موجود باشد، راه‌انداز در زمان نصب نام‌ها را به شناسه‌ها تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: کلید اضطراری برای فعال‌سازی دوبارهٔ تطبیق تغییرپذیر UPN/نام نمایشی و مسیریابی مستقیم نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازهٔ قطعهٔ متن خروجی.
- `channels.msteams.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خطوط خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز میزبان‌های پیوست ورودی (پیش‌فرض دامنه‌های Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای افزودن سربرگ‌های Authorization در تلاش‌های دوبارهٔ رسانه (پیش‌فرض میزبان‌های Graph + Bot Framework).
- `channels.msteams.requireMention`: الزام @mention در کانال‌ها/گروه‌ها (پیش‌فرض true).
- `channels.msteams.replyStyle`: `thread | top-level` ([سبک پاسخ](#reply-style-threads-vs-posts) را ببینید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی به‌ازای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی به‌ازای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض سیاست ابزار به‌ازای هر تیم (`allow`/`deny`/`alsoAllow`) که وقتی بازنویسی کانال وجود نداشته باشد استفاده می‌شود.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض سیاست ابزار به‌ازای هر فرستنده در هر تیم (wildcard با `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی به‌ازای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی به‌ازای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های سیاست ابزار به‌ازای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های سیاست ابزار به‌ازای هر فرستنده در هر کانال (wildcard با `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند:
  `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.actions.memberInfo`: فعال یا غیرفعال کردن کنش اطلاعات عضو متکی بر Graph (پیش‌فرض: وقتی اطلاعات احراز هویت Graph موجود باشد فعال است).
- `channels.msteams.authType`: نوع احراز هویت — `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (federated + احراز هویت گواهی).
- `channels.msteams.certificateThumbprint`: thumbprint گواهی (اختیاری، برای احراز هویت لازم نیست).
- `channels.msteams.useManagedIdentity`: فعال کردن احراز هویت managed identity (حالت federated).
- `channels.msteams.managedIdentityClientId`: شناسهٔ کلاینت برای managed identity اختصاص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسهٔ سایت SharePoint برای بارگذاری فایل در گفت‌وگوهای گروهی/کانال‌ها ([ارسال فایل‌ها در گفت‌وگوهای گروهی](#sending-files-in-group-chats) را ببینید).

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد عامل پیروی می‌کنند ([/concepts/session](/fa/concepts/session) را ببینید):
  - پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسهٔ گفت‌وگو استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams اخیراً دو سبک رابط کاربری کانال را روی همان مدل دادهٔ زیربنایی معرفی کرده است:

| سبک                    | توضیح                                               | `replyStyle` پیشنهادی |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **پست‌ها** (کلاسیک)      | پیام‌ها به‌صورت کارت‌هایی با پاسخ‌های رشته‌ای در زیرشان ظاهر می‌شوند | `thread` (پیش‌فرض)       |
| **رشته‌ها** (شبیه Slack) | پیام‌ها به‌صورت خطی جریان دارند، شبیه‌تر به Slack                   | `top-level`              |

**مشکل:** API مربوط به Teams نشان نمی‌دهد یک کانال از کدام سبک رابط کاربری استفاده می‌کند. اگر از `replyStyle` اشتباه استفاده کنید:

- `thread` در یک کانال با سبک رشته‌ای → پاسخ‌ها به‌صورت تودرتوی نامناسب ظاهر می‌شوند
- `top-level` در یک کانال با سبک پستی → پاسخ‌ها به‌جای داخل رشته، به‌صورت پست‌های جداگانهٔ سطح بالا ظاهر می‌شوند

**راه‌حل:** `replyStyle` را بر اساس نحوهٔ راه‌اندازی کانال، به‌ازای هر کانال پیکربندی کنید:

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

- **پیام‌های مستقیم:** تصاویر و پیوست‌های فایل از طریق APIهای فایل ربات Teams کار می‌کنند.
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 ‏(SharePoint/OneDrive) قرار دارند. payload مربوط به Webhook فقط یک stub HTML دارد، نه بایت‌های واقعی فایل. **مجوزهای Graph API لازم هستند** تا پیوست‌های کانال دانلود شوند.
- برای ارسال‌های صریحِ فایل‌محور، از `action=upload-file` همراه با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود، و `filename` نام بارگذاری‌شده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانال که تصویر دارند به‌صورت فقط متن دریافت می‌شوند (محتوای تصویر برای ربات قابل دسترسی نیست).
به‌طور پیش‌فرض، OpenClaw فقط رسانه را از نام‌های میزبان Microsoft/Teams دانلود می‌کند. با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای مجاز کردن هر میزبان از `["*"]` استفاده کنید).
سربرگ‌های Authorization فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` افزوده می‌شوند (پیش‌فرض میزبان‌های Graph + Bot Framework). این فهرست را سخت‌گیرانه نگه دارید (از پسوندهای چندمستاجری پرهیز کنید).

## ارسال فایل‌ها در گفت‌وگوهای گروهی

ربات‌ها می‌توانند با استفاده از جریان FileConsentCard (داخلی) در پیام‌های مستقیم فایل بفرستند. با این حال، **ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها** به راه‌اندازی اضافی نیاز دارد:

| زمینه                  | فایل‌ها چگونه ارسال می‌شوند                           | راه‌اندازی لازم                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **پیام‌های مستقیم**                  | FileConsentCard → کاربر می‌پذیرد → ربات بارگذاری می‌کند | بدون تنظیمات اضافی کار می‌کند                            |
| **گفت‌وگوهای گروهی/کانال‌ها** | بارگذاری در SharePoint → اشتراک‌گذاری پیوند            | نیازمند `sharePointSiteId` + مجوزهای Graph |
| **تصاویر (هر زمینه‌ای)** | درون‌خطیِ کدگذاری‌شده با Base64                        | بدون تنظیمات اضافی کار می‌کند                            |

### چرا گفت‌وگوهای گروهی به SharePoint نیاز دارند

ربات‌ها درایو شخصی OneDrive ندارند (endpoint مربوط به `/me/drive` در Graph API برای هویت‌های برنامه کار نمی‌کند). برای ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها، ربات در یک **سایت SharePoint** بارگذاری می‌کند و یک پیوند اشتراک‌گذاری می‌سازد.

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

| مجوز                              | رفتار اشتراک‌گذاری                                          |
| --------------------------------------- | --------------------------------------------------------- |
| فقط `Sites.ReadWrite.All`              | پیوند اشتراک‌گذاری در سطح سازمان (هرکسی در سازمان می‌تواند دسترسی داشته باشد) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | پیوند اشتراک‌گذاری به‌ازای هر کاربر (فقط اعضای گفت‌وگو می‌توانند دسترسی داشته باشند)      |

اشتراک‌گذاری به‌ازای هر کاربر امن‌تر است، چون فقط شرکت‌کنندگان گفت‌وگو می‌توانند به فایل دسترسی داشته باشند. اگر مجوز `Chat.Read.All` وجود نداشته باشد، ربات به اشتراک‌گذاری در سطح سازمان بازمی‌گردد.

### رفتار جایگزین

| سناریو                                          | نتیجه                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| گفت‌وگوی گروهی + فایل + `sharePointSiteId` پیکربندی‌شده | بارگذاری در SharePoint، ارسال پیوند اشتراک‌گذاری            |
| گفت‌وگوی گروهی + فایل + بدون `sharePointSiteId`         | تلاش برای بارگذاری در OneDrive (ممکن است شکست بخورد)، ارسال فقط متن |
| گفت‌وگوی شخصی + فایل                              | جریان FileConsentCard (بدون SharePoint کار می‌کند)    |
| هر زمینه + تصویر                               | درون‌خطیِ کدگذاری‌شده با Base64 (بدون SharePoint کار می‌کند)   |

### محل ذخیرهٔ فایل‌ها

فایل‌های بارگذاری‌شده در پوشهٔ `/OpenClawShared/` در کتابخانهٔ اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (Adaptive Cards)

OpenClaw نظرسنجی‌های Teams را به‌صورت Adaptive Cards ارسال می‌کند (هیچ API بومی نظرسنجی Teams وجود ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- رأی‌ها توسط Gateway در `~/.openclaw/msteams-polls.json` ثبت می‌شوند.
- Gateway باید برای ثبت رأی‌ها آنلاین بماند.
- نظرسنجی‌ها هنوز خلاصهٔ نتایج را به‌صورت خودکار پست نمی‌کنند (در صورت نیاز فایل ذخیره‌گاه را بررسی کنید).

## کارت‌های ارائه

payloadهای ارائهٔ معنایی را با استفاده از ابزار `message` یا CLI برای کاربران یا گفت‌وگوهای Teams ارسال کنید. OpenClaw آن‌ها را از قرارداد ارائهٔ عمومی به‌صورت Adaptive Cards در Teams رندر می‌کند.

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

| نوع هدف         | قالب                           | مثال                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| کاربر (بر اساس شناسه)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| کاربر (بر اساس نام)      | `user:<display-name>`            | `user:John Smith` (نیازمند Graph API)              |
| گروه/کانال       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| گروه/کانال (خام) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (اگر شامل `@thread` باشد) |

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
بدون پیشوند `user:`، نام‌ها به‌طور پیش‌فرض به حل‌وفصل گروه یا تیم ارجاع داده می‌شوند. هنگام هدف‌گیری افراد با نام نمایشی، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **پس از** تعامل کاربر ممکن هستند، چون در آن نقطه ارجاع‌های گفتگو را ذخیره می‌کنیم.
- برای `dmPolicy` و کنترل با فهرست مجاز، `/gateway/configuration` را ببینید.

## شناسه‌های تیم و کانال (دام رایج)

پارامتر کوئری `groupId` در URLهای Teams، شناسه تیمی **نیست** که برای پیکربندی استفاده می‌شود. در عوض، شناسه‌ها را از مسیر URL استخراج کنید:

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

- کلید تیم = بخش مسیر پس از `/team/` (URL-decode شده، مثلاً `19:Bk4j...@thread.tacv2`؛ مستأجرهای قدیمی‌تر ممکن است `@thread.skype` را نشان دهند که آن هم معتبر است)
- کلید کانال = بخش مسیر پس از `/channel/` (URL-decode شده)
- پارامتر کوئری `groupId` را برای مسیریابی OpenClaw **نادیده بگیرید**. این شناسه گروه Microsoft Entra است، نه شناسه گفتگوی Bot Framework که در فعالیت‌های ورودی Teams استفاده می‌شود.

## کانال‌های خصوصی

ربات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت                      | کانال‌های استاندارد | کانال‌های خصوصی       |
| ---------------------------- | ----------------- | ---------------------- |
| نصب ربات             | بله               | محدود                |
| پیام‌های بلادرنگ (Webhook) | بله               | ممکن است کار نکند           |
| مجوزهای RSC              | بله               | ممکن است رفتار متفاوتی داشته باشد |
| اشاره‌های @                    | بله               | اگر ربات در دسترس باشد   |
| تاریخچه Graph API            | بله               | بله (با مجوزها) |

**راهکارها در صورت کار نکردن کانال‌های خصوصی:**

1. برای تعامل با ربات از کانال‌های استاندارد استفاده کنید
2. از پیام‌های مستقیم استفاده کنید - کاربران همیشه می‌توانند مستقیماً به ربات پیام بدهند
3. برای دسترسی تاریخی از Graph API استفاده کنید (نیازمند `ChannelMessage.Read.All`)

## عیب‌یابی

### مشکلات رایج

- **نمایش داده نشدن تصاویر در کانال‌ها:** مجوزهای Graph یا رضایت مدیر وجود ندارد. برنامه Teams را دوباره نصب کنید و Teams را کاملاً ببندید/دوباره باز کنید.
- **نبود پاسخ در کانال:** اشاره‌ها به‌طور پیش‌فرض لازم هستند؛ `channels.msteams.requireMention=false` را تنظیم کنید یا برای هر تیم/کانال جداگانه پیکربندی کنید.
- **ناسازگاری نسخه (Teams همچنان مانیفست قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و Teams را کاملاً ببندید تا تازه‌سازی شود.
- **401 Unauthorized از Webhook:** هنگام آزمایش دستی بدون Azure JWT مورد انتظار است - یعنی endpoint در دسترس است اما احراز هویت ناموفق بوده است. برای آزمایش درست از Azure Web Chat استفاده کنید.

### خطاهای بارگذاری مانیفست

- **"Icon file cannot be empty":** مانیفست به فایل‌های آیکونی ارجاع می‌دهد که 0 بایت هستند. آیکون‌های PNG معتبر بسازید (32x32 برای `outline.png`، 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه هنوز در تیم/چت دیگری نصب است. ابتدا آن را پیدا و حذف کنید، یا 5-10 دقیقه برای انتشار منتظر بمانید.
- **"Something went wrong" هنگام بارگذاری:** به‌جای آن از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بارگذاری کنید، DevTools مرورگر (F12) → زبانه Network را باز کنید، و بدنه پاسخ را برای خطای واقعی بررسی کنید.
- **ناموفق بودن sideload:** به‌جای "Upload a custom app"، گزینه "Upload an app to your org's app catalog" را امتحان کنید - این کار اغلب محدودیت‌های sideload را دور می‌زند.

### کار نکردن مجوزهای RSC

1. بررسی کنید `webApplicationInfo.id` دقیقاً با App ID ربات شما مطابقت داشته باشد
2. برنامه را دوباره بارگذاری کنید و در تیم/چت دوباره نصب کنید
3. بررسی کنید آیا مدیر سازمان شما مجوزهای RSC را مسدود کرده است
4. تأیید کنید از scope درست استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای چت‌های گروهی

## منابع

- [ایجاد Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - ایجاد/مدیریت برنامه‌های Teams
- [طرحواره مانیفست برنامه Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل ربات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI برای مدیریت ربات

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و کنترل اشاره‌ها
- [مسیر‌یابی کانال](/fa/channels/channel-routing) — مسیر‌یابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
