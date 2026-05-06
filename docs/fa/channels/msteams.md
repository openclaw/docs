---
read_when:
    - کار روی ویژگی‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی ربات Microsoft Teams، قابلیت‌ها و پیکربندی
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T17:52:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: be669545bd692754fbee8b670b1b482c39399a3d26e06a7ae01230fdaee645fe
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: متن + پیوست‌های DM پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (نگاه کنید به [ارسال فایل‌ها در چت‌های گروهی](#sending-files-in-group-chats)). نظرسنجی‌ها از طریق Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌های فایل‌اول ارائه می‌کنند.

## Plugin همراه

Microsoft Teams در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin همراه ارائه می‌شود، بنابراین در بیلد بسته‌بندی‌شده معمولی به نصب جداگانه نیاز نیست.

اگر روی یک بیلد قدیمی‌تر هستید یا نصب سفارشی‌ای دارید که Teams همراه را حذف کرده است،
بسته npm را مستقیما نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

برای دنبال کردن تگ انتشار رسمی فعلی، از بسته بدون نسخه استفاده کنید. نسخه دقیق را
فقط زمانی پین کنید که به نصب قابل بازتولید نیاز دارید.

checkout محلی (هنگام اجرا از یک git repo):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت ربات، ساخت manifest، و تولید اعتبارنامه‌ها را در یک فرمان انجام می‌دهد.

**1. نصب و ورود**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI در حال حاضر در مرحله preview است. فرمان‌ها و فلگ‌ها ممکن است بین انتشارها تغییر کنند.
</Note>

**2. شروع یک تونل** (Teams نمی‌تواند به localhost دسترسی پیدا کند)

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

**3. ساخت برنامه**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این فرمان واحد:

- یک برنامه Entra ID (Azure AD) می‌سازد
- یک client secret تولید می‌کند
- یک manifest برنامه Teams را می‌سازد و بارگذاری می‌کند (با iconها)
- ربات را ثبت می‌کند (به‌صورت پیش‌فرض مدیریت‌شده توسط Teams - بدون نیاز به اشتراک Azure)

خروجی `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID`، و یک **Teams App ID** را نشان می‌دهد - این‌ها را برای مراحل بعدی یادداشت کنید. همچنین پیشنهاد می‌دهد برنامه را مستقیما در Teams نصب کنید.

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

یا مستقیما از متغیرهای محیطی استفاده کنید: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

**5. نصب برنامه در Teams**

`teams app create` از شما می‌خواهد برنامه را نصب کنید - «Install in Teams» را انتخاب کنید. اگر از آن گذشتید، بعدا می‌توانید لینک را بگیرید:

```bash
teams app get <teamsAppId> --install-link
```

**6. بررسی اینکه همه‌چیز کار می‌کند**

```bash
teams app doctor <teamsAppId>
```

این کار عیب‌یابی‌هایی را روی ثبت ربات، پیکربندی برنامه AAD، اعتبار manifest، و راه‌اندازی SSO اجرا می‌کند.

برای استقرارهای production، به‌جای client secretها از [احراز هویت فدره‌شده](/fa/channels/msteams#federated-authentication-certificate-plus-managed-identity) (گواهی یا managed identity) استفاده کنید.

<Note>
چت‌های گروهی به‌صورت پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای اجازه دادن به پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` برای اجازه دادن به هر عضو (با دروازه mention) استفاده کنید.
</Note>

## اهداف

- گفت‌وگو با OpenClaw از طریق DMهای Teams، چت‌های گروهی، یا کانال‌ها.
- قطعی نگه داشتن مسیریابی: پاسخ‌ها همیشه به همان کانالی برمی‌گردند که از آن آمده‌اند.
- استفاده پیش‌فرض از رفتار ایمن کانال (mention لازم است مگر اینکه طور دیگری پیکربندی شده باشد).

## نوشتن پیکربندی

به‌صورت پیش‌فرض، Microsoft Teams مجاز است به‌روزرسانی‌های پیکربندی فعال‌شده توسط `/config set|unset` را بنویسد (نیازمند `commands.config: true`).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (DMها + گروه‌ها)

**دسترسی DM**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستندگان ناشناس تا زمان تایید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از AAD object IDهای پایدار استفاده کند.
- برای allowlistها به تطبیق UPN/display-name تکیه نکنید - ممکن است تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌صورت پیش‌فرض غیرفعال می‌کند؛ با `channels.msteams.dangerouslyAllowNameMatching: true` صراحتا آن را فعال کنید.
- wizard می‌تواند نام‌ها را از طریق Microsoft Graph به IDها resolve کند، وقتی اعتبارنامه‌ها اجازه دهند.

**دسترسی گروه**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است مگر اینکه `groupAllowFrom` را اضافه کنید). برای override کردن مقدار پیش‌فرض وقتی تنظیم نشده است، از `channels.defaults.groupPolicy` استفاده کنید.
- `channels.msteams.groupAllowFrom` کنترل می‌کند کدام فرستندگان می‌توانند در چت‌ها/کانال‌های گروهی trigger کنند (به `channels.msteams.allowFrom` fallback می‌کند).
- `groupPolicy: "open"` را تنظیم کنید تا به هر عضو اجازه دهید (همچنان به‌صورت پیش‌فرض با دروازه mention).
- برای اجازه ندادن به **هیچ کانالی**، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

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

- پاسخ‌های گروه/کانال را با فهرست کردن teamها و کانال‌ها زیر `channels.msteams.teams` محدود کنید.
- کلیدها باید از Teams conversation IDهای پایدار در لینک‌های Teams استفاده کنند، نه نام‌های نمایشی تغییرپذیر.
- وقتی `groupPolicy="allowlist"` و یک allowlist برای teamها وجود دارد، فقط teamها/کانال‌های فهرست‌شده پذیرفته می‌شوند (با دروازه mention).
- wizard پیکربندی ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام startup، OpenClaw نام‌های allowlist مربوط به team/channel و کاربر را به IDها resolve می‌کند (وقتی مجوزهای Graph اجازه دهند)
  و نگاشت را log می‌کند؛ نام‌های resolveنشده team/channel همان‌طور که تایپ شده‌اند نگه داشته می‌شوند، اما به‌صورت پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` فعال باشد.

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

1. مطمئن شوید Microsoft Teams Plugin در دسترس است (در انتشارهای فعلی همراه است).
2. یک **Azure Bot** بسازید (App ID + secret + tenant ID).
3. یک **بسته برنامه Teams** بسازید که به ربات ارجاع می‌دهد و مجوزهای RSC زیر را شامل می‌شود.
4. برنامه Teams را در یک team بارگذاری/نصب کنید (یا scope شخصی برای DMها).
5. `msteams` را در `~/.openclaw/openclaw.json` (یا env varها) پیکربندی کنید و gateway را شروع کنید.
6. Gateway به‌صورت پیش‌فرض برای ترافیک Webhook مربوط به Bot Framework روی `/api/messages` گوش می‌دهد.

### مرحله 1: ساخت Azure Bot

1. به [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید
2. تب **Basics** را پر کنید:

   | فیلد | مقدار |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | نام ربات شما، مثلا `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription**   | اشتراک Azure خود را انتخاب کنید |
   | **Resource group** | یک مورد جدید بسازید یا از موجود استفاده کنید |
   | **Pricing tier**   | **Free** برای dev/testing |
   | **Type of App**    | **Single Tenant** (توصیه‌شده - یادداشت زیر را ببینید) |
   | **Creation type**  | **Create new Microsoft App ID** |

<Warning>
ساخت ربات‌های multi-tenant جدید پس از 2025-07-31 منسوخ شد. برای ربات‌های جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** → **Create** کلیک کنید (حدود 1-2 دقیقه صبر کنید)

### مرحله 2: دریافت اعتبارنامه‌ها

1. به resource مربوط به Azure Bot خود → **Configuration** بروید
2. **Microsoft App ID** را کپی کنید → این همان `appId` شماست
3. روی **Manage Password** کلیک کنید → به App Registration بروید
4. زیر **Certificates & secrets** → **New client secret** → **Value** را کپی کنید → این همان `appPassword` شماست
5. به **Overview** بروید → **Directory (tenant) ID** را کپی کنید → این همان `tenantId` شماست

### مرحله 3: پیکربندی Messaging Endpoint

1. در Azure Bot → **Configuration**
2. **Messaging endpoint** را روی URL Webhook خود تنظیم کنید:
   - Production: `https://your-domain.com/api/messages`
   - توسعه محلی: از یک تونل استفاده کنید (پایین‌تر [توسعه محلی](#local-development-tunneling) را ببینید)

### مرحله 4: فعال‌سازی Teams Channel

1. در Azure Bot → **Channels**
2. روی **Microsoft Teams** → Configure → Save کلیک کنید
3. Terms of Service را بپذیرید

### مرحله 5: ساخت Teams App Manifest

- یک ورودی `bot` با `botId = <App ID>` اضافه کنید.
- Scopeها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای مدیریت فایل در scope شخصی لازم است).
- مجوزهای RSC را اضافه کنید (نگاه کنید به [مجوزهای فعلی Teams RSC در manifest](#current-teams-rsc-permissions-manifest)).
- iconها را بسازید: `outline.png` (32x32) و `color.png` (192x192).
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

برای استقرارهای production، OpenClaw از **احراز هویت فدره‌شده** به‌عنوان جایگزینی امن‌تر برای client secretها پشتیبانی می‌کند. دو روش در دسترس است:

### گزینه A: احراز هویت مبتنی بر گواهی

از یک گواهی PEM ثبت‌شده با app registration در Entra ID خود استفاده کنید.

**راه‌اندازی:**

1. یک گواهی تولید یا تهیه کنید (فرمت PEM با private key).
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

**Env varها:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### گزینه B: Azure Managed Identity

برای احراز هویت بدون گذرواژه از Azure Managed Identity استفاده کنید. این برای استقرارها روی زیرساخت Azure (AKS، App Service، Azure VMها) که managed identity در آن در دسترس است ایدئال است.

**نحوه کار:**

1. pod/VM ربات یک managed identity دارد (system-assigned یا user-assigned).
2. یک **federated identity credential**، managed identity را به app registration در Entra ID وصل می‌کند.
3. در runtime، OpenClaw از `@azure/identity` برای گرفتن token از endpoint مربوط به Azure IMDS (`169.254.169.254`) استفاده می‌کند.
4. token برای احراز هویت ربات به Teams SDK داده می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با managed identity فعال (AKS workload identity، App Service، VM)
- federated identity credential ساخته‌شده روی app registration در Entra ID
- دسترسی شبکه از pod/VM به IMDS (`169.254.169.254:80`)

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

**پیکربندی (هویت مدیریت‌شده اختصاص‌یافته توسط کاربر):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (فقط برای اختصاص‌یافته توسط کاربر)

### راه‌اندازی هویت بارکاری AKS

برای استقرارهای AKS که از هویت بارکاری استفاده می‌کنند:

1. **هویت بارکاری را فعال کنید** روی خوشه AKS خود.
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

4. **پاد را برچسب‌گذاری کنید** برای تزریق هویت بارکاری:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **دسترسی شبکه** به IMDS (`169.254.169.254`) را تضمین کنید - اگر از NetworkPolicy استفاده می‌کنید، یک قاعده خروجی اضافه کنید که ترافیک به `169.254.169.254/32` روی پورت 80 را مجاز کند.

### مقایسه نوع احراز هویت

| روش                  | پیکربندی                                      | مزایا                              | معایب                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| **رمز کلاینت**       | `appPassword`                                  | راه‌اندازی ساده                   | نیازمند چرخش رمز، امنیت کمتر             |
| **گواهی‌نامه**       | `authType: "federated"` + `certificatePath`    | بدون رمز مشترک روی شبکه           | سربار مدیریت گواهی‌نامه                  |
| **هویت مدیریت‌شده**  | `authType: "federated"` + `useManagedIdentity` | بدون گذرواژه، بدون مدیریت اسرار   | نیازمند زیرساخت Azure                    |

**رفتار پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw به‌طور پیش‌فرض از احراز هویت با رمز کلاینت استفاده می‌کند. پیکربندی‌های موجود بدون تغییر همچنان کار می‌کنند.

## توسعه محلی (تونل‌سازی)

Teams نمی‌تواند به `localhost` دسترسی پیدا کند. از یک تونل توسعه پایدار استفاده کنید تا URL شما در نشست‌های مختلف ثابت بماند:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

گزینه‌های جایگزین: `ngrok http 3978` یا `tailscale funnel 3978` (ممکن است URLها در هر نشست تغییر کنند).

اگر URL تونل شما تغییر کرد، نقطه پایانی را به‌روزرسانی کنید:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## آزمایش Bot

**اجرای عیب‌یابی:**

```bash
teams app doctor <teamsAppId>
```

ثبت Bot، برنامه AAD، مانیفست و پیکربندی SSO را در یک گذر بررسی می‌کند.

**ارسال پیام آزمایشی:**

1. برنامه Teams را نصب کنید (از پیوند نصبِ `teams app get <id> --install-link` استفاده کنید)
2. Bot را در Teams پیدا کنید و یک پیام مستقیم بفرستید
3. لاگ‌های Gateway را برای فعالیت ورودی بررسی کنید

## متغیرهای محیطی

همه کلیدهای پیکربندی می‌توانند به‌جای آن از طریق متغیرهای محیطی تنظیم شوند:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (اختیاری: `"secret"` یا `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (فدرال + گواهی‌نامه)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (اختیاری، برای احراز هویت لازم نیست)
- `MSTEAMS_USE_MANAGED_IDENTITY` (فدرال + هویت مدیریت‌شده)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI اختصاص‌یافته توسط کاربر)

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` مبتنی بر Graph برای Microsoft Teams ارائه می‌کند تا عامل‌ها و اتوماسیون‌ها بتوانند جزئیات اعضای کانال (نام نمایشی، ایمیل، نقش) را مستقیماً از Microsoft Graph حل کنند.

نیازمندی‌ها:

- مجوز RSC با نام `Member.Read.Group` (از قبل در مانیفست پیشنهادی وجود دارد)
- برای جست‌وجوهای بین‌تیمی: مجوز برنامه Graph با نام `User.Read.All` همراه با رضایت مدیر

این کنش با `channels.msteams.actions.memberInfo` کنترل می‌شود (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).

## زمینه تاریخچه

- `channels.msteams.historyLimit` کنترل می‌کند چند پیام اخیر کانال/گروه در اعلان پیچیده شوند.
- به `messages.groupChat.historyLimit` بازمی‌گردد. برای غیرفعال‌کردن، `0` را تنظیم کنید (پیش‌فرض 50).
- تاریخچه رشته دریافت‌شده با فهرست‌های مجاز فرستنده (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود، بنابراین آماده‌سازی زمینه رشته فقط پیام‌های فرستنده‌های مجاز را شامل می‌شود.
- زمینه پیوست نقل‌قول‌شده (`ReplyTo*` مشتق‌شده از HTML پاسخ Teams) فعلاً همان‌طور که دریافت شده است منتقل می‌شود.
- به بیان دیگر، فهرست‌های مجاز کنترل می‌کنند چه کسی می‌تواند عامل را فعال کند؛ امروز فقط مسیرهای خاص زمینه تکمیلی فیلتر می‌شوند.
- تاریخچه پیام مستقیم را می‌توان با `channels.msteams.dmHistoryLimit` محدود کرد (نوبت‌های کاربر). بازنویسی‌های هر کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

## مجوزهای فعلی RSC در Teams (مانیفست)

این‌ها **مجوزهای resourceSpecific موجود** در مانیفست برنامه Teams ما هستند. این مجوزها فقط داخل تیم/چتی اعمال می‌شوند که برنامه در آن نصب شده است.

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

نمونه کمینه و معتبر با فیلدهای لازم. شناسه‌ها و URLها را جایگزین کنید.

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

### نکات احتیاطی مانیفست (فیلدهای ضروری)

- `bots[].botId` **باید** با شناسه برنامه Azure Bot مطابقت داشته باشد.
- `webApplicationInfo.id` **باید** با شناسه برنامه Azure Bot مطابقت داشته باشد.
- `bots[].scopes` باید سطح‌هایی را شامل شود که قصد استفاده از آن‌ها را دارید (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` برای مدیریت فایل در دامنه شخصی لازم است.
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

پس از به‌روزرسانی، برنامه را در هر تیم دوباره نصب کنید تا مجوزهای جدید اثر کنند، و **Teams را کاملاً ببندید و دوباره اجرا کنید** (نه فقط بستن پنجره) تا فراداده کش‌شده برنامه پاک شود.

<details>
<summary>به‌روزرسانی دستی مانیفست (بدون CLI)</summary>

1. `manifest.json` خود را با تنظیمات جدید به‌روزرسانی کنید
2. **فیلد `version` را افزایش دهید** (مثلاً `1.0.0` → `1.1.0`)
3. مانیفست را همراه با آیکون‌ها (`manifest.json`، `outline.png`، `color.png`) **دوباره zip کنید**
4. zip جدید را بارگذاری کنید:
   - **مرکز مدیریت Teams:** برنامه‌های Teams → مدیریت برنامه‌ها → برنامه خود را پیدا کنید → بارگذاری نسخه جدید
   - **Sideload:** در Teams → برنامه‌ها → مدیریت برنامه‌های شما → بارگذاری یک برنامه سفارشی

</details>

## قابلیت‌ها: فقط RSC در برابر Graph

### با **فقط Teams RSC** (برنامه نصب‌شده، بدون مجوزهای Graph API)

کار می‌کند:

- خواندن محتوای **متنی** پیام کانال.
- ارسال محتوای **متنی** پیام کانال.
- دریافت پیوست‌های فایل **شخصی (DM)**.

کار نمی‌کند:

- **تصاویر یا محتوای فایل** کانال/گروه (payload فقط شامل قالب HTML است).
- دانلود پیوست‌هایی که در SharePoint/OneDrive ذخیره شده‌اند.
- خواندن تاریخچه پیام (فراتر از رویداد زنده Webhook).

### با **Teams RSC + مجوزهای برنامه Microsoft Graph**

اضافه می‌کند:

- دانلود محتوای میزبانی‌شده (تصاویر چسبانده‌شده در پیام‌ها).
- دانلود پیوست‌های فایل ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام کانال/چت از طریق Graph.

### RSC در برابر Graph API

| قابلیت                   | مجوزهای RSC           | Graph API                            |
| ------------------------ | --------------------- | ------------------------------------ |
| **پیام‌های بلادرنگ**     | بله (از طریق Webhook) | نه (فقط نظرسنجی)                    |
| **پیام‌های تاریخی**      | نه                    | بله (می‌تواند تاریخچه را پرس‌وجو کند) |
| **پیچیدگی راه‌اندازی**   | فقط مانیفست برنامه   | نیازمند رضایت مدیر + جریان توکن     |
| **کارکرد آفلاین**        | نه (باید در حال اجرا باشد) | بله (پرس‌وجو در هر زمان)       |

**جمع‌بندی:** RSC برای گوش‌دادن بلادرنگ است؛ Graph API برای دسترسی تاریخی است. برای رسیدن به پیام‌های ازدست‌رفته هنگام آفلاین بودن، به Graph API با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه و تاریخچه فعال با Graph (لازم برای کانال‌ها)

اگر به تصاویر/فایل‌ها در **کانال‌ها** نیاز دارید یا می‌خواهید **تاریخچه پیام** را دریافت کنید، باید مجوزهای Microsoft Graph را فعال کنید و رضایت مدیر را بدهید.

1. در **ثبت برنامه** Entra ID (Azure AD)، **مجوزهای برنامه** Microsoft Graph را اضافه کنید:
   - `ChannelMessage.Read.All` (پیوست‌ها + تاریخچه کانال)
   - `Chat.Read.All` یا `ChatMessage.Read.All` (چت‌های گروهی)
2. **رضایت مدیر** را برای مستأجر اعطا کنید.
3. **نسخه مانیفست** برنامه Teams را افزایش دهید، دوباره بارگذاری کنید و **برنامه را در Teams دوباره نصب کنید**.
4. **Teams را کاملاً ببندید و دوباره اجرا کنید** تا فراداده کش‌شده برنامه پاک شود.

**مجوز اضافی برای اشاره به کاربران:** @mention کاربران برای کاربرانی که در مکالمه هستند به‌صورت پیش‌فرض کار می‌کند. بااین‌حال، اگر می‌خواهید به‌صورت پویا کاربرانی را جست‌وجو و mention کنید که **در مکالمه فعلی نیستند**، مجوز `User.Read.All` (Application) را اضافه کنید و رضایت مدیر را اعطا کنید.

## محدودیت‌های شناخته‌شده

### مهلت‌های زمانی Webhook

Teams پیام‌ها را از طریق Webhook HTTP تحویل می‌دهد. اگر پردازش بیش از حد طول بکشد (مثلاً پاسخ‌های کند LLM)، ممکن است این موارد را ببینید:

- مهلت زمانی Gateway
- تلاش مجدد Teams برای پیام (که باعث تکرار می‌شود)
- پاسخ‌های حذف‌شده

OpenClaw این را با بازگشت سریع و ارسال فعالانه پاسخ‌ها مدیریت می‌کند، اما پاسخ‌های بسیار کند همچنان ممکن است مشکل ایجاد کنند.

### قالب‌بندی

Markdown در Teams محدودتر از Slack یا Discord است:

- قالب‌بندی پایه کار می‌کند: **پررنگ**، _کج_، `code`، پیوندها
- Markdown پیچیده (جدول‌ها، فهرست‌های تودرتو) ممکن است درست رندر نشود
- Adaptive Cards برای نظرسنجی‌ها و ارسال‌های ارائه معنایی پشتیبانی می‌شود (پایین را ببینید)

## پیکربندی

تنظیمات کلیدی (برای الگوهای مشترک کانال، `/gateway/configuration` را ببینید):

- `channels.msteams.enabled`: کانال را فعال/غیرفعال می‌کند.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اعتبارنامه‌های bot.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`)
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing)
- `channels.msteams.allowFrom`: فهرست مجاز DM (شناسه‌های شیء AAD توصیه می‌شوند). هنگام راه‌اندازی، وقتی دسترسی Graph موجود باشد، جادوگر نام‌ها را به شناسه‌ها تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: کلید اضطراری برای فعال‌سازی دوباره تطبیق UPN/نام نمایشی تغییرپذیر و مسیریابی مستقیم نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازه تکه متن خروجی.
- `channels.msteams.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم روی خط‌های خالی (مرزهای پاراگراف) پیش از تکه‌بندی بر اساس طول.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز میزبان‌های پیوست ورودی (پیش‌فرض دامنه‌های Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای افزودن سرآیندهای Authorization در تلاش‌های دوباره رسانه (پیش‌فرض میزبان‌های Graph + Bot Framework).
- `channels.msteams.requireMention`: در کانال‌ها/گروه‌ها @mention را الزامی می‌کند (پیش‌فرض true).
- `channels.msteams.replyStyle`: `thread | top-level` ([سبک پاسخ](#reply-style-threads-vs-posts) را ببینید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی برای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر تیم (`allow`/`deny`/`alsoAllow`) که وقتی بازنویسی کانال وجود ندارد استفاده می‌شود.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض سیاست ابزار برای هر فرستنده در هر تیم (حرف عام `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی برای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های سیاست ابزار برای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های سیاست ابزار برای هر فرستنده در هر کانال (حرف عام `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند:
  `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.actions.memberInfo`: کنش اطلاعات عضو مبتنی بر Graph را فعال یا غیرفعال می‌کند (پیش‌فرض: وقتی اعتبارنامه‌های Graph موجود باشند فعال است).
- `channels.msteams.authType`: نوع احراز هویت - `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (احراز هویت federated + certificate).
- `channels.msteams.certificateThumbprint`: اثرانگشت گواهی (اختیاری، برای احراز هویت لازم نیست).
- `channels.msteams.useManagedIdentity`: احراز هویت با هویت مدیریت‌شده را فعال می‌کند (حالت federated).
- `channels.msteams.managedIdentityClientId`: شناسه کلاینت برای هویت مدیریت‌شده اختصاص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسه سایت SharePoint برای بارگذاری فایل در چت‌های گروهی/کانال‌ها ([ارسال فایل در چت‌های گروهی](#sending-files-in-group-chats) را ببینید).

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد agent پیروی می‌کنند ([/concepts/session](/fa/concepts/session) را ببینید):
  - پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسه گفت‌وگو استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams اخیراً دو سبک UI کانال را روی یک مدل داده زیربنایی یکسان معرفی کرده است:

| سبک                    | توضیح                                               | `replyStyle` پیشنهادی |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (کلاسیک)      | پیام‌ها به‌صورت کارت‌هایی با پاسخ‌های رشته‌ای در زیرشان ظاهر می‌شوند | `thread` (پیش‌فرض)       |
| **Threads** (مشابه Slack) | پیام‌ها به‌صورت خطی جریان می‌یابند، بیشتر شبیه Slack                   | `top-level`              |

**مشکل:** API Teams مشخص نمی‌کند که یک کانال از کدام سبک UI استفاده می‌کند. اگر از `replyStyle` اشتباه استفاده کنید:

- `thread` در کانالی با سبک Threads → پاسخ‌ها به‌شکلی نامناسب تودرتو ظاهر می‌شوند
- `top-level` در کانالی با سبک Posts → پاسخ‌ها به‌جای اینکه داخل رشته باشند، به‌صورت پست‌های سطح بالای جداگانه ظاهر می‌شوند

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

## پیوست‌ها و تصاویر

**محدودیت‌های فعلی:**

- **DMها:** تصاویر و پیوست‌های فایل از طریق APIهای فایل bot در Teams کار می‌کنند.
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 قرار دارند (SharePoint/OneDrive). payload مربوط به Webhook فقط شامل یک stub HTML است، نه بایت‌های واقعی فایل. **مجوزهای Graph API لازم هستند** تا پیوست‌های کانال دانلود شوند.
- برای ارسال‌های صریحی که ابتدا فایل هستند، از `action=upload-file` همراه با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود، و `filename` نام بارگذاری‌شده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانالی همراه با تصویر به‌صورت فقط متن دریافت می‌شوند (محتوای تصویر برای bot قابل دسترسی نیست).
به‌طور پیش‌فرض، OpenClaw فقط رسانه را از نام میزبان‌های Microsoft/Teams دانلود می‌کند. با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای مجاز کردن هر میزبانی از `["*"]` استفاده کنید).
سرآیندهای Authorization فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` افزوده می‌شوند (پیش‌فرض میزبان‌های Graph + Bot Framework). این فهرست را سخت‌گیرانه نگه دارید (از پسوندهای چندمستاجری پرهیز کنید).

## ارسال فایل در چت‌های گروهی

Botها می‌توانند با استفاده از جریان FileConsentCard فایل‌ها را در DMها ارسال کنند (داخلی). با این حال، **ارسال فایل در چت‌های گروهی/کانال‌ها** به راه‌اندازی اضافی نیاز دارد:

| زمینه                  | فایل‌ها چگونه ارسال می‌شوند                           | راه‌اندازی لازم                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMها**                  | FileConsentCard → کاربر می‌پذیرد → bot بارگذاری می‌کند | بدون تنظیمات اضافی کار می‌کند                            |
| **چت‌های گروهی/کانال‌ها** | بارگذاری در SharePoint → اشتراک‌گذاری پیوند            | به `sharePointSiteId` + مجوزهای Graph نیاز دارد |
| **تصاویر (هر زمینه‌ای)** | درون‌خطی با رمزگذاری Base64                        | بدون تنظیمات اضافی کار می‌کند                            |

### چرا چت‌های گروهی به SharePoint نیاز دارند

Botها یک درایو شخصی OneDrive ندارند (نقطه پایانی Graph API یعنی `/me/drive` برای هویت‌های برنامه کار نمی‌کند). برای ارسال فایل در چت‌های گروهی/کانال‌ها، bot در یک **سایت SharePoint** بارگذاری می‌کند و یک پیوند اشتراک‌گذاری می‌سازد.

### راه‌اندازی

1. **مجوزهای Graph API را اضافه کنید** در Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - بارگذاری فایل‌ها در SharePoint
   - `Chat.Read.All` (Application) - اختیاری، پیوندهای اشتراک‌گذاری برای هر کاربر را فعال می‌کند

2. **رضایت مدیر** را برای tenant اعطا کنید.

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

| مجوز                              | رفتار اشتراک‌گذاری                                          |
| --------------------------------------- | --------------------------------------------------------- |
| فقط `Sites.ReadWrite.All`              | پیوند اشتراک‌گذاری در سطح سازمان (هر کسی در سازمان می‌تواند دسترسی داشته باشد) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | پیوند اشتراک‌گذاری برای هر کاربر (فقط اعضای چت می‌توانند دسترسی داشته باشند)      |

اشتراک‌گذاری برای هر کاربر امن‌تر است، چون فقط شرکت‌کنندگان چت می‌توانند به فایل دسترسی داشته باشند. اگر مجوز `Chat.Read.All` وجود نداشته باشد، bot به اشتراک‌گذاری در سطح سازمان برمی‌گردد.

### رفتار جایگزین

| سناریو                                          | نتیجه                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| چت گروهی + فایل + `sharePointSiteId` پیکربندی‌شده | بارگذاری در SharePoint، ارسال پیوند اشتراک‌گذاری            |
| چت گروهی + فایل + بدون `sharePointSiteId`         | تلاش برای بارگذاری در OneDrive (ممکن است شکست بخورد)، ارسال فقط متن |
| چت شخصی + فایل                              | جریان FileConsentCard (بدون SharePoint کار می‌کند)    |
| هر زمینه‌ای + تصویر                               | درون‌خطی با رمزگذاری Base64 (بدون SharePoint کار می‌کند)   |

### محل ذخیره فایل‌ها

فایل‌های بارگذاری‌شده در پوشه‌ای با نام `/OpenClawShared/` در کتابخانه اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (Adaptive Cards)

OpenClaw نظرسنجی‌های Teams را به‌صورت Adaptive Cards ارسال می‌کند (هیچ API نظرسنجی بومی برای Teams وجود ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- رأی‌ها توسط Gateway در `~/.openclaw/msteams-polls.json` ثبت می‌شوند.
- Gateway باید آنلاین بماند تا رأی‌ها ثبت شوند.
- نظرسنجی‌ها هنوز خلاصه نتایج را به‌صورت خودکار ارسال نمی‌کنند (در صورت نیاز فایل store را بررسی کنید).

## کارت‌های ارائه

payloadهای ارائه معنایی را با استفاده از ابزار `message` یا CLI برای کاربران یا گفت‌وگوهای Teams ارسال کنید. OpenClaw آن‌ها را از قرارداد عمومی ارائه به‌صورت Teams Adaptive Cards رندر می‌کند.

پارامتر `presentation` بلوک‌های معنایی را می‌پذیرد. وقتی `presentation` ارائه شود، متن پیام اختیاری است.

**ابزار agent:**

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

هدف‌های MSTeams از پیشوندها استفاده می‌کنند تا بین کاربران و گفت‌وگوها تمایز بگذارند:

| نوع هدف         | قالب                           | نمونه                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| کاربر (بر اساس شناسه)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| کاربر (بر اساس نام)      | `user:<display-name>`            | `user:John Smith` (به Graph API نیاز دارد)              |
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
بدون پیشوند `user:`، نام‌ها به‌طور پیش‌فرض با تفکیک گروه یا تیم پردازش می‌شوند. هنگام هدف‌گرفتن افراد با نام نمایشی، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **پس از** تعامل کاربر ممکن هستند، زیرا در آن لحظه ارجاع‌های مکالمه را ذخیره می‌کنیم.
- برای `dmPolicy` و دروازه‌گذاری فهرست مجاز، `/gateway/configuration` را ببینید.

## شناسه‌های تیم و کانال (دام رایج)

پارامتر کوئری `groupId` در URLهای Teams **شناسه تیمی نیست** که برای پیکربندی استفاده می‌شود. به‌جای آن، شناسه‌ها را از مسیر URL استخراج کنید:

**URL تیم:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    شناسه مکالمه تیم (این را URL-decode کنید)
```

**URL کانال:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      شناسه کانال (این را URL-decode کنید)
```

**برای پیکربندی:**

- کلید تیم = بخش مسیر پس از `/team/` (URL-decoded، برای مثال `19:Bk4j...@thread.tacv2`؛ مستاجرهای قدیمی‌تر ممکن است `@thread.skype` را نشان دهند که آن هم معتبر است)
- کلید کانال = بخش مسیر پس از `/channel/` (URL-decoded)
- پارامتر کوئری `groupId` را برای مسیریابی OpenClaw **نادیده بگیرید**. این شناسه گروه Microsoft Entra است، نه شناسه مکالمه Bot Framework که در فعالیت‌های ورودی Teams استفاده می‌شود.

## کانال‌های خصوصی

بات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت                      | کانال‌های استاندارد | کانال‌های خصوصی       |
| ---------------------------- | ----------------- | ---------------------- |
| نصب بات             | بله               | محدود                |
| پیام‌های بلادرنگ (Webhook) | بله               | ممکن است کار نکند           |
| مجوزهای RSC              | بله               | ممکن است رفتار متفاوتی داشته باشد |
| @mentionها                    | بله               | اگر بات قابل دسترسی باشد   |
| تاریخچه Graph API            | بله               | بله (با مجوزها) |

**راهکارها در صورت کار نکردن کانال‌های خصوصی:**

1. برای تعاملات بات از کانال‌های استاندارد استفاده کنید
2. از DMها استفاده کنید - کاربران همیشه می‌توانند مستقیماً به بات پیام بدهند
3. برای دسترسی تاریخی از Graph API استفاده کنید (به `ChannelMessage.Read.All` نیاز دارد)

## عیب‌یابی

### مشکلات رایج

- **تصاویر در کانال‌ها نمایش داده نمی‌شوند:** مجوزهای Graph یا رضایت مدیر وجود ندارد. برنامه Teams را دوباره نصب کنید و Teams را کاملاً ببندید و دوباره باز کنید.
- **پاسخی در کانال دریافت نمی‌شود:** به‌طور پیش‌فرض mentionها لازم هستند؛ `channels.msteams.requireMention=false` را تنظیم کنید یا برای هر تیم/کانال جداگانه پیکربندی کنید.
- **عدم تطابق نسخه (Teams هنوز manifest قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و برای تازه‌سازی، Teams را کاملاً ببندید.
- **401 Unauthorized از Webhook:** هنگام آزمایش دستی بدون Azure JWT انتظار می‌رود - یعنی endpoint قابل دسترسی است اما احراز هویت شکست خورده است. برای آزمایش درست از Azure Web Chat استفاده کنید.

### خطاهای بارگذاری manifest

- **"Icon file cannot be empty":** manifest به فایل‌های آیکونی ارجاع می‌دهد که 0 بایت هستند. آیکون‌های PNG معتبر بسازید (32x32 برای `outline.png`، 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه هنوز در تیم/چت دیگری نصب است. ابتدا آن را پیدا و حذف نصب کنید، یا 5 تا 10 دقیقه برای انتشار تغییرات صبر کنید.
- **"Something went wrong" هنگام بارگذاری:** به‌جای آن از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) بارگذاری کنید، DevTools مرورگر را باز کنید (F12) → زبانه Network، و بدنه پاسخ را برای خطای واقعی بررسی کنید.
- **شکست sideload:** به‌جای "Upload a custom app"، گزینه "Upload an app to your org's app catalog" را امتحان کنید - این کار اغلب محدودیت‌های sideload را دور می‌زند.

### مجوزهای RSC کار نمی‌کنند

1. بررسی کنید `webApplicationInfo.id` دقیقاً با App ID بات شما مطابقت داشته باشد
2. برنامه را دوباره بارگذاری کنید و در تیم/چت دوباره نصب کنید
3. بررسی کنید آیا مدیر سازمان شما مجوزهای RSC را مسدود کرده است
4. تأیید کنید از scope درست استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای چت‌های گروهی

## منابع

- [ایجاد Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - ایجاد/مدیریت برنامه‌های Teams
- [طرح‌واره manifest برنامه Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل در بات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI برای مدیریت بات

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) - احراز هویت DM و جریان Pairing
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و دروازه‌گذاری mention
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
