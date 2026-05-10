---
read_when:
    - کار روی قابلیت‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-10T19:23:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: f41c148e7ea0c2d0bde257d7af3ba0dc990f20110c08df3bb8c4d3f84e8563e0
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: متن + پیوست‌های DM پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (ببینید [ارسال فایل در چت‌های گروهی](#sending-files-in-group-chats)). نظرسنجی‌ها از طریق Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌های فایل‌محور ارائه می‌کنند.

## Plugin همراه

Microsoft Teams در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه ارائه می‌شود، بنابراین در بیلد بسته‌بندی‌شده‌ی معمولی به نصب جداگانه نیاز نیست.

اگر روی یک بیلد قدیمی‌تر هستید یا نصب سفارشی‌ای دارید که Teams همراه را حذف می‌کند، بسته‌ی npm را مستقیما نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

برای دنبال‌کردن تگ انتشار رسمی فعلی، از بسته‌ی خام استفاده کنید. فقط زمانی نسخه‌ی دقیق را پین کنید که به نصب بازتولیدپذیر نیاز دارید.

checkout محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت bot، ایجاد manifest، و تولید credential را در یک فرمان انجام می‌دهد.

**1. نصب و ورود**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI در حال حاضر در preview است. فرمان‌ها و flagها ممکن است بین نسخه‌ها تغییر کنند.
</Note>

**2. شروع یک tunnel** (Teams نمی‌تواند به localhost دسترسی پیدا کند)

اگر هنوز نصب و احراز هویت devtunnel CLI را انجام نداده‌اید، این کار را انجام دهید ([راهنمای شروع](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` لازم است چون Teams نمی‌تواند با devtunnels احراز هویت کند. هر درخواست bot ورودی همچنان به‌طور خودکار توسط Teams SDK اعتبارسنجی می‌شود.
</Note>

جایگزین‌ها: `ngrok http 3978` یا `tailscale funnel 3978` (اما ممکن است این‌ها در هر نشست URLها را تغییر دهند).

**3. ایجاد app**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این فرمان واحد:

- یک برنامه‌ی Entra ID (Azure AD) ایجاد می‌کند
- یک client secret تولید می‌کند
- یک manifest برنامه‌ی Teams را می‌سازد و بارگذاری می‌کند (با iconها)
- bot را ثبت می‌کند (به‌طور پیش‌فرض مدیریت‌شده توسط Teams - بدون نیاز به اشتراک Azure)

خروجی `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID`، و یک **Teams App ID** را نشان می‌دهد - این‌ها را برای مراحل بعد یادداشت کنید. همچنین پیشنهاد می‌دهد app را مستقیما در Teams نصب کنید.

**4. پیکربندی OpenClaw** با استفاده از credentialهای خروجی:

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

یا مستقیما از متغیرهای محیطی استفاده کنید: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

**5. نصب app در Teams**

`teams app create` از شما می‌خواهد app را نصب کنید - «Install in Teams» را انتخاب کنید. اگر از آن گذشتید، بعدا می‌توانید link را دریافت کنید:

```bash
teams app get <teamsAppId> --install-link
```

**6. بررسی اینکه همه‌چیز کار می‌کند**

```bash
teams app doctor <teamsAppId>
```

این فرمان diagnostics را روی ثبت bot، پیکربندی app در AAD، اعتبار manifest، و راه‌اندازی SSO اجرا می‌کند.

برای استقرارهای production، به‌جای client secretها، استفاده از [احراز هویت federated](/fa/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificate یا managed identity) را در نظر بگیرید.

<Note>
چت‌های گروهی به‌طور پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای مجازکردن پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` استفاده کنید تا هر عضو مجاز باشد (وابسته به mention).
</Note>

## هدف‌ها

- با OpenClaw از طریق DMهای Teams، چت‌های گروهی، یا کانال‌ها صحبت کنید.
- routing را deterministic نگه دارید: پاسخ‌ها همیشه به کانالی برمی‌گردند که از آن آمده‌اند.
- رفتار امن کانال را پیش‌فرض قرار دهید (mention لازم است مگر اینکه به‌شکل دیگری پیکربندی شده باشد).

## نوشتن پیکربندی

به‌طور پیش‌فرض، Microsoft Teams مجاز است به‌روزرسانی‌های پیکربندی‌ای را که با `/config set|unset` فعال می‌شوند بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (DMها + گروه‌ها)

**دسترسی DM**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستنده‌های ناشناس تا زمان تایید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از شناسه‌های object پایدار AAD یا گروه‌های دسترسی فرستنده‌ی static مانند `accessGroup:core-team` استفاده کند.
- برای allowlistها به تطبیق UPN/display-name تکیه نکنید - ممکن است تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌طور پیش‌فرض غیرفعال می‌کند؛ برای فعال‌سازی صریح از `channels.msteams.dangerouslyAllowNameMatching: true` استفاده کنید.
- wizard می‌تواند وقتی credentialها اجازه می‌دهند، نام‌ها را از طریق Microsoft Graph به IDها resolve کند.

**دسترسی گروه**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است مگر اینکه `groupAllowFrom` را اضافه کنید). وقتی تنظیم نشده، برای بازنویسی پیش‌فرض از `channels.defaults.groupPolicy` استفاده کنید.
- `channels.msteams.groupAllowFrom` کنترل می‌کند کدام فرستنده‌ها یا گروه‌های دسترسی فرستنده‌ی static می‌توانند در چت‌های گروهی/کانال‌ها trigger شوند (به `channels.msteams.allowFrom` fallback می‌کند).
- برای مجازکردن هر عضو، `groupPolicy: "open"` را تنظیم کنید (همچنان به‌طور پیش‌فرض وابسته به mention).
- برای مجازکردن **هیچ کانالی**، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

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

**Teams + allowlist کانال**

- پاسخ‌های گروه/کانال را با فهرست‌کردن teamها و channelها زیر `channels.msteams.teams` محدود کنید.
- keyها باید از شناسه‌های مکالمه‌ی پایدار Teams از linkهای Teams استفاده کنند، نه display nameهای قابل‌تغییر.
- وقتی `groupPolicy="allowlist"` و یک allowlist مربوط به teamها وجود دارد، فقط teamها/کانال‌های فهرست‌شده پذیرفته می‌شوند (وابسته به mention).
- configure wizard ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام startup، OpenClaw نام‌های team/channel و allowlist کاربر را به IDها resolve می‌کند (وقتی مجوزهای Graph اجازه می‌دهند)
  و mapping را log می‌کند؛ نام‌های resolveنشده‌ی team/channel همان‌طور که تایپ شده‌اند نگه داشته می‌شوند اما به‌طور پیش‌فرض برای routing نادیده گرفته می‌شوند مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` فعال شده باشد.

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

### سازوکار

1. مطمئن شوید Plugin Microsoft Teams در دسترس است (در نسخه‌های فعلی همراه است).
2. یک **Azure Bot** ایجاد کنید (App ID + secret + tenant ID).
3. یک **بسته‌ی app برای Teams** بسازید که به bot اشاره کند و شامل مجوزهای RSC زیر باشد.
4. app مربوط به Teams را در یک team (یا scope شخصی برای DMها) بارگذاری/نصب کنید.
5. `msteams` را در `~/.openclaw/openclaw.json` (یا env varها) پیکربندی کنید و Gateway را شروع کنید.
6. Gateway به‌طور پیش‌فرض برای ترافیک Webhook مربوط به Bot Framework روی `/api/messages` گوش می‌دهد.

### گام 1: ایجاد Azure Bot

1. به [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید
2. tab **Basics** را پر کنید:

   | فیلد              | مقدار                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | نام bot شما، مثلا `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription**   | اشتراک Azure خود را انتخاب کنید                           |
   | **Resource group** | مورد جدید ایجاد کنید یا از مورد موجود استفاده کنید                               |
   | **Pricing tier**   | **Free** برای توسعه/آزمایش                                 |
   | **Type of App**    | **Single Tenant** (پیشنهادی - یادداشت زیر را ببینید)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
ایجاد botهای multi-tenant جدید پس از 2025-07-31 منسوخ شد. برای botهای جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** → **Create** کلیک کنید (حدود 1-2 دقیقه صبر کنید)

### گام 2: دریافت credentialها

1. به resource مربوط به Azure Bot خود بروید → **Configuration**
2. **Microsoft App ID** را کپی کنید → این `appId` شماست
3. روی **Manage Password** کلیک کنید → به App Registration بروید
4. زیر **Certificates & secrets** → **New client secret** → **Value** را کپی کنید → این `appPassword` شماست
5. به **Overview** بروید → **Directory (tenant) ID** را کپی کنید → این `tenantId` شماست

### گام 3: پیکربندی Messaging Endpoint

1. در Azure Bot → **Configuration**
2. **Messaging endpoint** را روی URL وبهوک خود تنظیم کنید:
   - Production: `https://your-domain.com/api/messages`
   - توسعه‌ی محلی: از یک tunnel استفاده کنید (بخش [توسعه‌ی محلی](#local-development-tunneling) را در پایین ببینید)

### گام 4: فعال‌سازی کانال Teams

1. در Azure Bot → **Channels**
2. روی **Microsoft Teams** → Configure → Save کلیک کنید
3. Terms of Service را بپذیرید

### گام 5: ساخت Teams App Manifest

- یک ورودی `bot` با `botId = <App ID>` اضافه کنید.
- Scopeها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای مدیریت فایل در scope شخصی لازم است).
- مجوزهای RSC را اضافه کنید (بخش [مجوزهای فعلی RSC در manifest مربوط به Teams](#current-teams-rsc-permissions-manifest) را ببینید).
- iconها را ایجاد کنید: `outline.png` (32x32) و `color.png` (192x192).
- هر سه فایل را با هم zip کنید: `manifest.json`، `outline.png`، `color.png`.

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

کانال Teams زمانی که Plugin در دسترس باشد و پیکربندی `msteams` با credentialها وجود داشته باشد، به‌طور خودکار شروع می‌شود.

</details>

## احراز هویت federated (certificate به‌علاوه‌ی managed identity)

> افزوده‌شده در 2026.4.11

برای استقرارهای production، OpenClaw از **احراز هویت federated** به‌عنوان جایگزینی امن‌تر برای client secretها پشتیبانی می‌کند. دو روش موجود است:

### گزینه A: احراز هویت مبتنی بر certificate

از یک certificate با قالب PEM که در app registration مربوط به Entra ID شما ثبت شده استفاده کنید.

**راه‌اندازی:**

1. یک certificate تولید یا دریافت کنید (قالب PEM همراه با private key).
2. در Entra ID → App Registration → **Certificates & secrets** → **Certificates** → certificate عمومی را بارگذاری کنید.

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

**Env varها:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### گزینه B: Azure Managed Identity

برای احراز هویت بدون گذرواژه از Azure Managed Identity استفاده کنید. این روش برای استقرار روی زیرساخت Azure (AKS، App Service، Azure VMs) که managed identity در آن موجود است ایده‌آل است.

**سازوکار:**

1. pod/VM مربوط به bot یک managed identity دارد (system-assigned یا user-assigned).
2. یک **federated identity credential**، managed identity را به app registration مربوط به Entra ID متصل می‌کند.
3. در runtime، OpenClaw از `@azure/identity` برای دریافت tokenها از endpoint مربوط به Azure IMDS (`169.254.169.254`) استفاده می‌کند.
4. token برای احراز هویت bot به Teams SDK پاس داده می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با managed identity فعال (AKS workload identity، App Service، VM)
- federated identity credential ایجادشده روی app registration مربوط به Entra ID
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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط برای هویت اختصاص‌یافته به کاربر)

### راه‌اندازی Workload Identity در AKS

برای استقرارهای AKS که از Workload Identity استفاده می‌کنند:

1. **Workload Identity را فعال کنید** روی خوشه AKS خود.
2. **یک گواهی هویت فدرال ایجاد کنید** روی ثبت برنامه Entra ID:

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

4. **Pod را برچسب‌گذاری کنید** برای تزریق Workload Identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **دسترسی شبکه را تضمین کنید** به IMDS (`169.254.169.254`) - اگر از NetworkPolicy استفاده می‌کنید، یک قانون خروجی اضافه کنید که ترافیک به `169.254.169.254/32` روی پورت 80 را مجاز کند.

### مقایسه نوع احراز هویت

| روش | پیکربندی | مزایا | معایب |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **راز کلاینت** | `appPassword` | راه‌اندازی ساده | نیازمند چرخش راز، امنیت کمتر |
| **گواهی** | `authType: "federated"` + `certificatePath` | بدون راز مشترک روی شبکه | سربار مدیریت گواهی |
| **هویت مدیریت‌شده** | `authType: "federated"` + `useManagedIdentity` | بدون رمز عبور، بدون نیاز به مدیریت رازها | نیازمند زیرساخت Azure |

**رفتار پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw به‌طور پیش‌فرض از احراز هویت با راز کلاینت استفاده می‌کند. پیکربندی‌های موجود بدون تغییر همچنان کار می‌کنند.

## توسعه محلی (تونل‌سازی)

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

ثبت Bot، برنامه AAD، manifest، و پیکربندی SSO را در یک مرحله بررسی می‌کند.

**ارسال پیام آزمایشی:**

1. برنامه Teams را نصب کنید (از لینک نصبِ `teams app get <id> --install-link` استفاده کنید)
2. Bot را در Teams پیدا کنید و یک DM بفرستید
3. لاگ‌های Gateway را برای فعالیت ورودی بررسی کنید

## متغیرهای محیطی

همه کلیدهای پیکربندی را می‌توان به‌جای آن از طریق متغیرهای محیطی تنظیم کرد:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختیاری: `"secret"` یا `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (فدرال + گواهی)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختیاری، برای احراز هویت لازم نیست)
- `MSTEAMS_USE_MANAGED_IDENTITY` (فدرال + هویت مدیریت‌شده)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI اختصاص‌یافته به کاربر)

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` مبتنی بر Graph برای Microsoft Teams ارائه می‌کند تا agentها و خودکارسازی‌ها بتوانند جزئیات اعضای کانال (نام نمایشی، ایمیل، نقش) را مستقیماً از Microsoft Graph حل کنند.

نیازمندی‌ها:

- مجوز RSC با نام `Member.Read.Group` (از قبل در manifest پیشنهادی وجود دارد)
- برای جست‌وجوهای میان‌تیمی: مجوز Graph Application با نام `User.Read.All` همراه با رضایت مدیر

این کنش با `channels.msteams.actions.memberInfo` کنترل می‌شود (پیش‌فرض: وقتی اعتبارنامه‌های Graph در دسترس باشند فعال است).

## زمینه تاریخچه

- `channels.msteams.historyLimit` کنترل می‌کند چند پیام اخیر کانال/گروه در prompt قرار داده شوند.
- به `messages.groupChat.historyLimit` بازمی‌گردد. برای غیرفعال‌سازی مقدار `0` را تنظیم کنید (پیش‌فرض 50).
- تاریخچه thread واکشی‌شده بر اساس allowlistهای فرستنده (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود، بنابراین مقداردهی اولیه زمینه thread فقط شامل پیام‌های فرستندگان مجاز است.
- زمینه پیوست نقل‌شده (`ReplyTo*` مشتق‌شده از HTML پاسخ Teams) در حال حاضر همان‌طور که دریافت شده پاس داده می‌شود.
- به عبارت دیگر، allowlistها کنترل می‌کنند چه کسی می‌تواند agent را فعال کند؛ امروز فقط مسیرهای مشخصی از زمینه تکمیلی فیلتر می‌شوند.
- تاریخچه DM را می‌توان با `channels.msteams.dmHistoryLimit` محدود کرد (نوبت‌های کاربر). بازنویسی‌های هر کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

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

نمونه‌ای حداقلی و معتبر با فیلدهای موردنیاز. شناسه‌ها و URLها را جایگزین کنید.

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

### نکات مهم manifest (فیلدهای ضروری)

- `bots[].botId` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `webApplicationInfo.id` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `bots[].scopes` باید سطح‌هایی را که قصد استفاده از آن‌ها را دارید شامل شود (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` برای مدیریت فایل در دامنه شخصی الزامی است.
- اگر ترافیک کانال را می‌خواهید، `authorization.permissions.resourceSpecific` باید خواندن/ارسال کانال را شامل شود.

### به‌روزرسانی یک برنامه موجود

برای به‌روزرسانی یک برنامه Teams که از قبل نصب شده است (مثلاً برای افزودن مجوزهای RSC):

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
3. manifest را همراه با آیکون‌ها دوباره zip کنید (`manifest.json`، `outline.png`، `color.png`)
4. فایل zip جدید را بارگذاری کنید:
   - **Teams Admin Center:** Teams apps → Manage apps → find your app → Upload new version
   - **Sideload:** In Teams → Apps → Manage your apps → Upload a custom app

</details>

## قابلیت‌ها: فقط RSC در برابر Graph

### با **فقط Teams RSC** (برنامه نصب شده، بدون مجوزهای Graph API)

کار می‌کند:

- خواندن محتوای **متنی** پیام کانال.
- ارسال محتوای **متنی** پیام کانال.
- دریافت پیوست‌های فایل در **شخصی (DM)**.

کار نمی‌کند:

- **محتوای تصویر یا فایل** کانال/گروه (payload فقط شامل HTML stub است).
- دانلود پیوست‌های ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام (فراتر از رویداد زنده Webhook).

### با **Teams RSC + مجوزهای Microsoft Graph Application**

اضافه می‌کند:

- دانلود محتوای میزبانی‌شده (تصاویر چسبانده‌شده در پیام‌ها).
- دانلود پیوست‌های فایل ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام کانال/چت از طریق Graph.

### RSC در برابر Graph API

| قابلیت | مجوزهای RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **پیام‌های بلادرنگ** | بله (از طریق Webhook) | خیر (فقط polling) |
| **پیام‌های تاریخی** | خیر | بله (می‌تواند تاریخچه را پرس‌وجو کند) |
| **پیچیدگی راه‌اندازی** | فقط manifest برنامه | نیازمند رضایت مدیر + جریان توکن |
| **کار در حالت آفلاین** | خیر (باید در حال اجرا باشد) | بله (پرس‌وجو در هر زمان) |

**جمع‌بندی:** RSC برای گوش‌دادن بلادرنگ است؛ Graph API برای دسترسی تاریخی است. برای رسیدن به پیام‌های ازدست‌رفته هنگام آفلاین بودن، به Graph API همراه با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه و تاریخچه فعال‌شده با Graph (برای کانال‌ها الزامی)

اگر به تصاویر/فایل‌ها در **کانال‌ها** نیاز دارید یا می‌خواهید **تاریخچه پیام** را واکشی کنید، باید مجوزهای Microsoft Graph را فعال کنید و رضایت مدیر را اعطا کنید.

1. در **App Registration** در Entra ID (Azure AD)، مجوزهای **Application** برای Microsoft Graph را اضافه کنید:
   - `ChannelMessage.Read.All` (پیوست‌های کانال + تاریخچه)
   - `Chat.Read.All` یا `ChatMessage.Read.All` (چت‌های گروهی)
2. **رضایت مدیر را اعطا کنید** برای tenant.
3. **نسخه manifest** برنامه Teams را افزایش دهید، دوباره بارگذاری کنید، و **برنامه را در Teams دوباره نصب کنید**.
4. **Teams را کاملاً ببندید و دوباره اجرا کنید** تا فراداده کش‌شده برنامه پاک شود.

**مجوز اضافی برای mention کاربران:** @mention کاربران برای کاربرانی که در گفت‌وگو هستند بدون تنظیمات اضافی کار می‌کند. با این حال، اگر می‌خواهید به‌صورت پویا کاربرانی را که **در گفت‌وگوی فعلی نیستند** جست‌وجو و mention کنید، مجوز `User.Read.All` (Application) را اضافه کنید و رضایت مدیر را اعطا کنید.

## محدودیت‌های شناخته‌شده

### timeoutهای Webhook

Teams پیام‌ها را از طریق HTTP Webhook تحویل می‌دهد. اگر پردازش بیش از حد طول بکشد (مثلاً پاسخ‌های کند LLM)، ممکن است با این موارد روبه‌رو شوید:

- timeoutهای Gateway
- تلاش مجدد Teams برای پیام (که باعث تکراری شدن می‌شود)
- پاسخ‌های حذف‌شده

OpenClaw این را با سریع برگشتن و ارسال پیش‌دستانهٔ پاسخ‌ها مدیریت می‌کند، اما پاسخ‌های بسیار کند همچنان ممکن است مشکل ایجاد کنند.

### قالب‌بندی

markdown در Teams محدودتر از Slack یا Discord است:

- قالب‌بندی پایه کار می‌کند: **پررنگ**، _کج_، `code`، پیوندها
- markdown پیچیده (جدول‌ها، فهرست‌های تودرتو) ممکن است درست رندر نشود
- Adaptive Cards برای نظرسنجی‌ها و ارسال‌های ارائهٔ معنایی پشتیبانی می‌شود (پایین را ببینید)

## پیکربندی

تنظیمات کلیدی (`/gateway/configuration` را برای الگوهای مشترک کانال ببینید):

- `channels.msteams.enabled`: فعال/غیرفعال کردن کانال.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اعتبارنامه‌های bot.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`)
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing)
- `channels.msteams.allowFrom`: فهرست مجاز DM (شناسه‌های شیء AAD توصیه می‌شوند). راه‌انداز هنگام setup، اگر دسترسی Graph موجود باشد، نام‌ها را به شناسه‌ها تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: کلید اضطراری برای فعال‌سازی دوبارهٔ تطبیق UPN/نام نمایشی تغییرپذیر و مسیریابی مستقیم نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازهٔ قطعهٔ متن خروجی.
- `channels.msteams.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خط‌های خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز برای میزبان‌های پیوست ورودی (پیش‌فرض دامنه‌های Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای افزودن headerهای Authorization در تلاش‌های دوبارهٔ رسانه (پیش‌فرض میزبان‌های Graph + Bot Framework).
- `channels.msteams.requireMention`: الزام @mention در کانال‌ها/گروه‌ها (پیش‌فرض true).
- `channels.msteams.replyStyle`: `thread | top-level` ([سبک پاسخ](#reply-style-threads-vs-posts) را ببینید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر تیم (`allow`/`deny`/`alsoAllow`) که وقتی بازنویسی کانال موجود نباشد استفاده می‌شوند.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر تیم و هر فرستنده (wildcard `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های سیاست ابزار برای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های سیاست ابزار برای هر کانال و هر فرستنده (wildcard `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند:
  `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.actions.memberInfo`: فعال یا غیرفعال کردن کنش اطلاعات عضو مبتنی بر Graph (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).
- `channels.msteams.authType`: نوع احراز هویت - `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (احراز هویت federated + certificate).
- `channels.msteams.certificateThumbprint`: اثرانگشت گواهی (اختیاری، برای احراز هویت لازم نیست).
- `channels.msteams.useManagedIdentity`: فعال کردن احراز هویت managed identity (حالت federated).
- `channels.msteams.managedIdentityClientId`: شناسهٔ کلاینت برای managed identity تخصیص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسهٔ سایت SharePoint برای بارگذاری فایل‌ها در گفت‌وگوهای گروهی/کانال‌ها ([ارسال فایل‌ها در گفت‌وگوهای گروهی](#sending-files-in-group-chats) را ببینید).

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد agent پیروی می‌کنند ([/concepts/session](/fa/concepts/session) را ببینید):
  - پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسهٔ conversation استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams اخیراً دو سبک UI کانال را روی همان مدل دادهٔ زیرین معرفی کرده است:

| سبک                    | توضیح                                               | `replyStyle` توصیه‌شده |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **پست‌ها** (کلاسیک)      | پیام‌ها به‌صورت کارت‌هایی با پاسخ‌های رشته‌ای در زیرشان ظاهر می‌شوند | `thread` (پیش‌فرض)       |
| **رشته‌ها** (شبیه Slack) | پیام‌ها به‌صورت خطی جریان دارند، بیشتر شبیه Slack                   | `top-level`              |

**مشکل:** Teams API مشخص نمی‌کند که یک کانال از کدام سبک UI استفاده می‌کند. اگر از `replyStyle` اشتباه استفاده کنید:

- `thread` در کانالی با سبک Threads → پاسخ‌ها به‌شکل نامناسبی تودرتو ظاهر می‌شوند
- `top-level` در کانالی با سبک Posts → پاسخ‌ها به‌جای درون‌رشته، به‌صورت پست‌های سطح بالای جداگانه ظاهر می‌شوند

**راه‌حل:** `replyStyle` را بر اساس نحوهٔ setup شدن کانال، برای هر کانال پیکربندی کنید:

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

### تقدم حل مقدار

وقتی bot پاسخی را به یک کانال می‌فرستد، `replyStyle` از خاص‌ترین بازنویسی تا پیش‌فرض حل می‌شود. نخستین مقدار غیر `undefined` برنده است:

1. **برای هر کانال** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **برای هر تیم** — `channels.msteams.teams.<teamId>.replyStyle`
3. **سراسری** — `channels.msteams.replyStyle`
4. **پیش‌فرض ضمنی** — مشتق‌شده از `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

اگر `requireMention: false` را به‌صورت سراسری و بدون `replyStyle` صریح تنظیم کنید، mentionها در کانال‌های سبک Posts به‌صورت پست‌های سطح بالا نمایش داده می‌شوند، حتی وقتی ورودی یک پاسخ رشته‌ای بوده باشد. برای پرهیز از غافلگیری، `replyStyle: "thread"` را در سطح سراسری، تیم یا کانال تثبیت کنید.

### حفظ بافت رشته

وقتی `replyStyle: "thread"` فعال است و bot از درون یک رشتهٔ کانال @mention شده باشد، OpenClaw ریشهٔ رشتهٔ اصلی را دوباره به مرجع conversation خروجی متصل می‌کند (`19:…@thread.tacv2;messageid=<root>`) تا پاسخ داخل همان رشته قرار بگیرد. این هم برای ارسال‌های زنده (درون turn) و هم برای ارسال‌های پیش‌دستانه‌ای که پس از منقضی شدن بافت turn در Bot Framework انجام می‌شوند برقرار است (مثلاً agentهای طولانی‌اجرا، پاسخ‌های tool-call صف‌شده از طریق `mcp__openclaw__message`).

ریشهٔ رشته از `threadId` ذخیره‌شده روی مرجع conversation گرفته می‌شود. ارجاع‌های ذخیره‌شدهٔ قدیمی‌تر که پیش از `threadId` بوده‌اند به `activityId` بازمی‌گردند (هر فعالیت ورودی‌ای که آخرین بار conversation را seed کرده باشد)، بنابراین استقرارهای موجود بدون re-seed همچنان کار می‌کنند.

وقتی `replyStyle: "top-level"` فعال است، ورودی‌های رشتهٔ کانال عمداً به‌صورت پست‌های جدید سطح بالا پاسخ داده می‌شوند — هیچ پسوند رشته‌ای متصل نمی‌شود. این رفتار درست برای کانال‌های سبک Threads است؛ اگر پست‌های سطح بالا را جایی می‌بینید که انتظار پاسخ‌های رشته‌ای داشتید، `replyStyle` شما برای آن کانال نادرست تنظیم شده است.

## پیوست‌ها و تصاویر

**محدودیت‌های فعلی:**

- **DMها:** تصاویر و پیوست‌های فایل از طریق APIهای فایل bot در Teams کار می‌کنند.
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 (SharePoint/OneDrive) قرار دارند. payload وب‌هوک فقط شامل یک stub HTML است، نه byteهای واقعی فایل. **مجوزهای Graph API لازم هستند** تا پیوست‌های کانال دانلود شوند.
- برای ارسال‌های صریح file-first، از `action=upload-file` همراه با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود، و `filename` نام بارگذاری‌شده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانال که تصویر دارند به‌صورت فقط‌متن دریافت می‌شوند (محتوای تصویر برای bot قابل دسترسی نیست).
به‌صورت پیش‌فرض، OpenClaw فقط رسانه را از نام‌های میزبان Microsoft/Teams دانلود می‌کند. با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای اجازه دادن به هر میزبان از `["*"]` استفاده کنید).
headerهای Authorization فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` افزوده می‌شوند (پیش‌فرض میزبان‌های Graph + Bot Framework). این فهرست را سخت‌گیرانه نگه دارید (از پسوندهای چندمستاجری پرهیز کنید).

## ارسال فایل‌ها در گفت‌وگوهای گروهی

Botها می‌توانند با استفاده از جریان FileConsentCard (داخلی) فایل‌ها را در DMها ارسال کنند. با این حال، **ارسال فایل‌ها در گفت‌وگوهای گروهی/کانال‌ها** به setup اضافی نیاز دارد:

| بافت                  | فایل‌ها چگونه ارسال می‌شوند                           | setup لازم                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMها**                  | FileConsentCard → کاربر می‌پذیرد → bot بارگذاری می‌کند | بدون تنظیمات اضافی کار می‌کند                            |
| **گفت‌وگوهای گروهی/کانال‌ها** | بارگذاری در SharePoint → اشتراک‌گذاری پیوند            | به `sharePointSiteId` + مجوزهای Graph نیاز دارد |
| **تصاویر (هر بافتی)** | inline کدگذاری‌شده با Base64                        | بدون تنظیمات اضافی کار می‌کند                            |

### چرا گفت‌وگوهای گروهی به SharePoint نیاز دارند

Botها درایو شخصی OneDrive ندارند (نقطه‌پایانی `/me/drive` در Graph API برای هویت‌های application کار نمی‌کند). برای ارسال فایل‌ها در گفت‌وگوهای گروهی/کانال‌ها، bot در یک **سایت SharePoint** بارگذاری می‌کند و یک پیوند اشتراک‌گذاری می‌سازد.

### setup

1. **مجوزهای Graph API را اضافه کنید** در Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - بارگذاری فایل‌ها در SharePoint
   - `Chat.Read.All` (Application) - اختیاری، پیوندهای اشتراک‌گذاری برای هر کاربر را فعال می‌کند

2. **رضایت admin را** برای tenant اعطا کنید.

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

| مجوز                              | رفتار اشتراک‌گذاری                                          |
| --------------------------------------- | --------------------------------------------------------- |
| فقط `Sites.ReadWrite.All`              | پیوند اشتراک‌گذاری در سطح سازمان (هر کسی در سازمان می‌تواند دسترسی داشته باشد) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | پیوند اشتراک‌گذاری برای هر کاربر (فقط اعضای chat می‌توانند دسترسی داشته باشند)      |

اشتراک‌گذاری برای هر کاربر امن‌تر است، زیرا فقط شرکت‌کنندگان chat می‌توانند به فایل دسترسی داشته باشند. اگر مجوز `Chat.Read.All` وجود نداشته باشد، bot به اشتراک‌گذاری در سطح سازمان بازمی‌گردد.

### رفتار fallback

| سناریو                                          | نتیجه                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| گفت‌وگوی گروهی + فایل + `sharePointSiteId` پیکربندی‌شده | بارگذاری در SharePoint، ارسال پیوند اشتراک‌گذاری            |
| گفت‌وگوی گروهی + فایل + بدون `sharePointSiteId`         | تلاش برای بارگذاری OneDrive (ممکن است شکست بخورد)، ارسال فقط متن |
| گفت‌وگوی شخصی + فایل                              | جریان FileConsentCard (بدون SharePoint کار می‌کند)    |
| هر بافتی + تصویر                               | inline کدگذاری‌شده با Base64 (بدون SharePoint کار می‌کند)   |

### مکان ذخیرهٔ فایل‌ها

فایل‌های بارگذاری‌شده در یک پوشهٔ `/OpenClawShared/` در کتابخانهٔ اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (Adaptive Cards)

OpenClaw نظرسنجی‌های Teams را به‌صورت Adaptive Cards ارسال می‌کند (API بومی نظرسنجی در Teams وجود ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- رأی‌ها توسط Gateway در `~/.openclaw/msteams-polls.json` ثبت می‌شوند.
- Gateway باید برای ثبت رأی‌ها آنلاین بماند.
- نظرسنجی‌ها هنوز خلاصهٔ نتایج را به‌صورت خودکار ارسال نمی‌کنند (در صورت نیاز فایل ذخیره‌سازی را بررسی کنید).

## کارت‌های ارائه

بارهای معنایی ارائه را با استفاده از ابزار `message` یا CLI برای کاربران یا گفتگوهای Teams بفرستید. OpenClaw آن‌ها را از قرارداد عمومی ارائه به‌صورت Teams Adaptive Cards رندر می‌کند.

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

برای جزئیات قالب مقصد، در ادامه [قالب‌های مقصد](#target-formats) را ببینید.

## قالب‌های مقصد

مقصدهای MSTeams از پیشوندها برای تمایز بین کاربران و گفتگوها استفاده می‌کنند:

| نوع مقصد            | قالب                            | مثال                                                |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| کاربر (بر اساس شناسه) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| کاربر (بر اساس نام) | `user:<display-name>`            | `user:John Smith` (به Graph API نیاز دارد)          |
| گروه/کانال          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
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
بدون پیشوند `user:`، نام‌ها به‌طور پیش‌فرض با گروه یا تیم تطبیق داده می‌شوند. وقتی افراد را با نام نمایشی هدف می‌گیرید، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **بعد از** تعامل کاربر ممکن هستند، چون در آن نقطه ارجاع‌های گفتگو را ذخیره می‌کنیم.
- برای `dmPolicy` و کنترل با فهرست مجاز، `/gateway/configuration` را ببینید.

## شناسه‌های تیم و کانال (دام رایج)

پارامتر پرس‌وجوی `groupId` در URLهای Teams، شناسهٔ تیمی **نیست** که برای پیکربندی استفاده می‌شود. به‌جای آن، شناسه‌ها را از مسیر URL استخراج کنید:

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

- کلید تیم = بخش مسیر بعد از `/team/` (URL-decode شده، برای مثال `19:Bk4j...@thread.tacv2`؛ مستأجرهای قدیمی‌تر ممکن است `@thread.skype` را نشان دهند که آن هم معتبر است)
- کلید کانال = بخش مسیر بعد از `/channel/` (URL-decode شده)
- پارامتر پرس‌وجوی `groupId` را برای مسیریابی OpenClaw **نادیده بگیرید**. این شناسهٔ گروه Microsoft Entra است، نه شناسهٔ گفتگوی Bot Framework که در فعالیت‌های ورودی Teams استفاده می‌شود.

## کانال‌های خصوصی

ربات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت                       | کانال‌های استاندارد | کانال‌های خصوصی            |
| ---------------------------- | ----------------- | ---------------------- |
| نصب ربات                     | بله               | محدود                 |
| پیام‌های بلادرنگ (Webhook)   | بله               | ممکن است کار نکند       |
| مجوزهای RSC                  | بله               | ممکن است متفاوت عمل کند |
| @اشاره‌ها                    | بله               | اگر ربات در دسترس باشد  |
| تاریخچهٔ Graph API           | بله               | بله (با مجوزها)         |

**راهکارها اگر کانال‌های خصوصی کار نمی‌کنند:**

1. برای تعامل‌های ربات از کانال‌های استاندارد استفاده کنید
2. از پیام‌های مستقیم استفاده کنید - کاربران همیشه می‌توانند مستقیماً به ربات پیام بدهند
3. برای دسترسی تاریخی از Graph API استفاده کنید (به `ChannelMessage.Read.All` نیاز دارد)

## عیب‌یابی

### مشکلات رایج

- **تصاویر در کانال‌ها نمایش داده نمی‌شوند:** مجوزهای Graph یا رضایت مدیر وجود ندارد. برنامهٔ Teams را دوباره نصب کنید و Teams را کامل ببندید و دوباره باز کنید.
- **پاسخی در کانال دریافت نمی‌شود:** اشاره‌ها به‌طور پیش‌فرض لازم هستند؛ `channels.msteams.requireMention=false` را تنظیم کنید یا برای هر تیم/کانال پیکربندی کنید.
- **ناسازگاری نسخه (Teams هنوز manifest قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و برای تازه‌سازی، Teams را کامل ببندید.
- **401 Unauthorized از Webhook:** هنگام آزمایش دستی بدون Azure JWT مورد انتظار است - یعنی endpoint قابل دسترس است اما احراز هویت ناموفق بوده است. برای آزمایش درست از Azure Web Chat استفاده کنید.

### خطاهای بارگذاری manifest

- **"Icon file cannot be empty":** manifest به فایل‌های آیکونی ارجاع می‌دهد که ۰ بایت هستند. آیکون‌های PNG معتبر بسازید (32x32 برای `outline.png`، 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه هنوز در تیم/گفتگوی دیگری نصب است. ابتدا آن را پیدا و حذف نصب کنید، یا ۵ تا ۱۰ دقیقه برای انتشار تغییر صبر کنید.
- **"Something went wrong" هنگام بارگذاری:** در عوض از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بارگذاری کنید، DevTools مرورگر را باز کنید (F12) → زبانهٔ Network، و بدنهٔ پاسخ را برای خطای واقعی بررسی کنید.
- **شکست sideload:** به‌جای "Upload a custom app"، گزینهٔ "Upload an app to your org's app catalog" را امتحان کنید - این کار اغلب محدودیت‌های sideload را دور می‌زند.

### مجوزهای RSC کار نمی‌کنند

1. بررسی کنید `webApplicationInfo.id` دقیقاً با App ID ربات شما مطابقت داشته باشد
2. برنامه را دوباره بارگذاری کنید و در تیم/گفتگو دوباره نصب کنید
3. بررسی کنید آیا مدیر سازمان شما مجوزهای RSC را مسدود کرده است یا نه
4. مطمئن شوید از scope درست استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای گفتگوهای گروهی

## منابع

- [ساخت Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [پرتال توسعه‌دهندگان Teams](https://dev.teams.microsoft.com/apps) - ساخت/مدیریت برنامه‌های Teams
- [طرح‌وارهٔ manifest برنامهٔ Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل ربات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI تیم‌ها برای مدیریت ربات

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفتگوی گروهی و کنترل اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
