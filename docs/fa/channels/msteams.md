---
read_when:
    - کار روی قابلیت‌های کانال Microsoft Teams
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T17:12:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

وضعیت: متن و پیوست‌های پیام مستقیم پشتیبانی می‌شوند؛ ارسال فایل در کانال/گروه به `sharePointSiteId` + مجوزهای Graph نیاز دارد (نگاه کنید به [ارسال فایل در چت‌های گروهی](#sending-files-in-group-chats)). نظرسنجی‌ها از طریق کارت‌های Adaptive Cards ارسال می‌شوند. کنش‌های پیام، `upload-file` صریح را برای ارسال‌های فایل‌اول ارائه می‌کنند.

## Plugin همراه

Microsoft Teams در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه عرضه می‌شود، بنابراین در ساخت بسته‌بندی‌شده عادی به نصب جداگانه نیاز نیست.

اگر روی ساخت قدیمی‌تر هستید یا نصب سفارشی‌ای دارید که Teams همراه را حذف کرده است، بسته npm را مستقیم نصب کنید:

```bash
openclaw plugins install @openclaw/msteams
```

از بسته خام استفاده کنید تا برچسب انتشار رسمی فعلی را دنبال کنید. نسخه دقیق را فقط زمانی پین کنید که به نصب بازتولیدپذیر نیاز دارید.

چک‌اوت محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) ثبت ربات، ایجاد مانیفست، و تولید اعتبارنامه را در یک فرمان واحد انجام می‌دهد.

**۱. نصب و ورود**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI در حال حاضر در پیش‌نمایش است. فرمان‌ها و پرچم‌ها ممکن است بین انتشارها تغییر کنند.
</Note>

**۲. شروع یک تونل** (Teams نمی‌تواند به localhost دسترسی پیدا کند)

اگر هنوز CLI مربوط به devtunnel را نصب و احراز هویت نکرده‌اید، آن را نصب و احراز هویت کنید ([راهنمای شروع](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` لازم است، چون Teams نمی‌تواند با devtunnels احراز هویت کند. هر درخواست ورودی ربات همچنان به‌صورت خودکار توسط Teams SDK اعتبارسنجی می‌شود.
</Note>

گزینه‌های جایگزین: `ngrok http 3978` یا `tailscale funnel 3978` (اما این‌ها ممکن است در هر نشست URLها را تغییر دهند).

**۳. ایجاد برنامه**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

این فرمان واحد:

- یک برنامه Entra ID (Azure AD) ایجاد می‌کند
- یک راز کلاینت تولید می‌کند
- مانیفست برنامه Teams را می‌سازد و بارگذاری می‌کند (همراه با آیکن‌ها)
- ربات را ثبت می‌کند (به‌صورت پیش‌فرض مدیریت‌شده توسط Teams - بدون نیاز به اشتراک Azure)

خروجی، `CLIENT_ID`، `CLIENT_SECRET`، `TENANT_ID`، و یک **شناسه برنامه Teams** را نشان می‌دهد - این‌ها را برای گام‌های بعدی یادداشت کنید. همچنین پیشنهاد می‌دهد برنامه را مستقیم در Teams نصب کنید.

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

یا مستقیماً از متغیرهای محیطی استفاده کنید: `MSTEAMS_APP_ID`، `MSTEAMS_APP_PASSWORD`، `MSTEAMS_TENANT_ID`.

**۵. نصب برنامه در Teams**

`teams app create` از شما می‌خواهد برنامه را نصب کنید - «Install in Teams» را انتخاب کنید. اگر از آن رد شدید، می‌توانید بعداً لینک را بگیرید:

```bash
teams app get <teamsAppId> --install-link
```

**۶. بررسی اینکه همه‌چیز کار می‌کند**

```bash
teams app doctor <teamsAppId>
```

این کار عیب‌یابی را در ثبت ربات، پیکربندی برنامه AAD، اعتبار مانیفست، و راه‌اندازی SSO اجرا می‌کند.

برای استقرارهای تولید، استفاده از [احراز هویت فدره‌شده](/fa/channels/msteams#federated-authentication-certificate-plus-managed-identity) (گواهی یا هویت مدیریت‌شده) را به‌جای رازهای کلاینت در نظر بگیرید.

<Note>
چت‌های گروهی به‌صورت پیش‌فرض مسدود هستند (`channels.msteams.groupPolicy: "allowlist"`). برای اجازه دادن به پاسخ‌های گروهی، `channels.msteams.groupAllowFrom` را تنظیم کنید، یا از `groupPolicy: "open"` استفاده کنید تا هر عضو مجاز باشد (با دروازه‌گذاری اشاره).
</Note>

## اهداف

- با OpenClaw از طریق پیام‌های مستقیم Teams، چت‌های گروهی، یا کانال‌ها صحبت کنید.
- مسیریابی را قطعی نگه دارید: پاسخ‌ها همیشه به همان کانالی برمی‌گردند که از آن آمده‌اند.
- رفتار ایمن کانال را پیش‌فرض قرار دهید (اشاره‌ها لازم‌اند مگر اینکه خلافش پیکربندی شده باشد).

## نوشتن پیکربندی

به‌صورت پیش‌فرض، Microsoft Teams مجاز است به‌روزرسانی‌های پیکربندی را که با `/config set|unset` فعال می‌شوند بنویسد (به `commands.config: true` نیاز دارد).

غیرفعال‌سازی با:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## کنترل دسترسی (پیام‌های مستقیم + گروه‌ها)

**دسترسی پیام مستقیم**

- پیش‌فرض: `channels.msteams.dmPolicy = "pairing"`. فرستندگان ناشناس تا زمان تأیید نادیده گرفته می‌شوند.
- `channels.msteams.allowFrom` باید از شناسه‌های پایدار شیء AAD یا گروه‌های دسترسی ایستای فرستنده مانند `accessGroup:core-team` استفاده کند.
- برای فهرست‌های مجاز به تطبیق UPN/نام نمایشی تکیه نکنید - ممکن است تغییر کنند. OpenClaw تطبیق مستقیم نام را به‌صورت پیش‌فرض غیرفعال می‌کند؛ با `channels.msteams.dangerouslyAllowNameMatching: true` صریحاً آن را فعال کنید.
- ویزارد می‌تواند وقتی اعتبارنامه‌ها اجازه دهند، نام‌ها را از طریق Microsoft Graph به شناسه‌ها تبدیل کند.

**دسترسی گروه**

- پیش‌فرض: `channels.msteams.groupPolicy = "allowlist"` (مسدود است مگر اینکه `groupAllowFrom` اضافه کنید). برای بازنویسی پیش‌فرض در حالت تنظیم‌نشده، از `channels.defaults.groupPolicy` استفاده کنید.
- `channels.msteams.groupAllowFrom` کنترل می‌کند کدام فرستندگان یا گروه‌های دسترسی ایستای فرستنده می‌توانند در چت‌ها/کانال‌های گروهی فعال شوند (به `channels.msteams.allowFrom` برمی‌گردد).
- `groupPolicy: "open"` را تنظیم کنید تا هر عضو مجاز باشد (همچنان به‌صورت پیش‌فرض با دروازه‌گذاری اشاره).
- برای اینکه **هیچ کانالی** مجاز نباشد، `channels.msteams.groupPolicy: "disabled"` را تنظیم کنید.

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

**فهرست مجاز Teams + کانال**

- پاسخ‌های گروه/کانال را با فهرست کردن تیم‌ها و کانال‌ها زیر `channels.msteams.teams` محدود کنید.
- کلیدها باید از شناسه‌های مکالمه پایدار Teams از لینک‌های Teams استفاده کنند، نه نام‌های نمایشی قابل‌تغییر.
- وقتی `groupPolicy="allowlist"` باشد و فهرست مجاز تیم‌ها وجود داشته باشد، فقط تیم‌ها/کانال‌های فهرست‌شده پذیرفته می‌شوند (با دروازه‌گذاری اشاره).
- ویزارد پیکربندی ورودی‌های `Team/Channel` را می‌پذیرد و آن‌ها را برای شما ذخیره می‌کند.
- هنگام شروع، OpenClaw نام‌های فهرست مجاز تیم/کانال و کاربر را به شناسه‌ها تبدیل می‌کند (وقتی مجوزهای Graph اجازه دهند)
  و نگاشت را ثبت می‌کند؛ نام‌های حل‌نشده تیم/کانال همان‌طور که تایپ شده‌اند نگه داشته می‌شوند اما به‌صورت پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند، مگر اینکه `channels.msteams.dangerouslyAllowNameMatching: true` فعال باشد.

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

1. مطمئن شوید Microsoft Teams Plugin در دسترس است (در نسخه‌های فعلی همراه است).
2. یک **Azure Bot** ایجاد کنید (شناسه برنامه + راز + شناسه tenant).
3. یک **بسته برنامه Teams** بسازید که به ربات ارجاع دهد و مجوزهای RSC زیر را شامل شود.
4. برنامه Teams را در یک تیم بارگذاری/نصب کنید (یا برای پیام‌های مستقیم، در محدوده شخصی).
5. `msteams` را در `~/.openclaw/openclaw.json` (یا متغیرهای محیطی) پیکربندی کنید و Gateway را شروع کنید.
6. Gateway به‌صورت پیش‌فرض روی `/api/messages` برای ترافیک Webhook مربوط به Bot Framework گوش می‌دهد.

### گام ۱: ایجاد Azure Bot

1. به [ایجاد Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) بروید
2. زبانه **Basics** را پر کنید:

   | فیلد | مقدار |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle** | نام ربات شما، مثلاً `openclaw-msteams` (باید یکتا باشد) |
   | **Subscription** | اشتراک Azure خود را انتخاب کنید |
   | **Resource group** | جدید ایجاد کنید یا از موجود استفاده کنید |
   | **Pricing tier** | **Free** برای توسعه/آزمایش |
   | **Type of App** | **Single Tenant** (توصیه‌شده - یادداشت زیر را ببینید) |
   | **Creation type** | **Create new Microsoft App ID** |

<Warning>
ایجاد ربات‌های چند-tenant جدید پس از 2025-07-31 منسوخ شد. برای ربات‌های جدید از **Single Tenant** استفاده کنید.
</Warning>

3. روی **Review + create** → **Create** کلیک کنید (حدود ۱ تا ۲ دقیقه صبر کنید)

### گام ۲: دریافت اعتبارنامه‌ها

1. به منبع Azure Bot خود بروید → **Configuration**
2. **Microsoft App ID** را کپی کنید → این همان `appId` شما است
3. روی **Manage Password** کلیک کنید → به App Registration بروید
4. زیر **Certificates & secrets** → **New client secret** → **Value** را کپی کنید → این همان `appPassword` شما است
5. به **Overview** بروید → **Directory (tenant) ID** را کپی کنید → این همان `tenantId` شما است

### گام ۳: پیکربندی نقطه پایانی پیام‌رسانی

1. در Azure Bot → **Configuration**
2. **Messaging endpoint** را روی URL Webhook خود تنظیم کنید:
   - تولید: `https://your-domain.com/api/messages`
   - توسعه محلی: از یک تونل استفاده کنید (نگاه کنید به [توسعه محلی](#local-development-tunneling) در پایین)

### گام ۴: فعال‌سازی کانال Teams

1. در Azure Bot → **Channels**
2. روی **Microsoft Teams** → Configure → Save کلیک کنید
3. شرایط سرویس را بپذیرید

### گام ۵: ساخت مانیفست برنامه Teams

- یک ورودی `bot` با `botId = <App ID>` شامل کنید.
- محدوده‌ها: `personal`، `team`، `groupChat`.
- `supportsFiles: true` (برای مدیریت فایل در محدوده شخصی لازم است).
- مجوزهای RSC را اضافه کنید (نگاه کنید به [مجوزهای فعلی RSC در Teams](#current-teams-rsc-permissions-manifest)).
- آیکن‌ها را ایجاد کنید: `outline.png` (32x32) و `color.png` (192x192).
- هر سه فایل را با هم Zip کنید: `manifest.json`، `outline.png`، `color.png`.

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

## احراز هویت فدره‌شده (گواهی به‌همراه هویت مدیریت‌شده)

> اضافه‌شده در 2026.4.11

برای استقرارهای تولید، OpenClaw از **احراز هویت فدره‌شده** به‌عنوان جایگزینی امن‌تر برای رازهای کلاینت پشتیبانی می‌کند. دو روش در دسترس است:

### گزینه الف: احراز هویت مبتنی بر گواهی

از یک گواهی PEM ثبت‌شده با ثبت برنامه Entra ID خود استفاده کنید.

**راه‌اندازی:**

1. یک گواهی تولید یا دریافت کنید (قالب PEM با کلید خصوصی).
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

### گزینه ب: هویت مدیریت‌شده Azure

از Azure Managed Identity برای احراز هویت بدون گذرواژه استفاده کنید. این برای استقرارها روی زیرساخت Azure (AKS، App Service، ماشین‌های مجازی Azure) که در آن هویت مدیریت‌شده در دسترس است ایده‌آل است.

**سازوکار:**

1. پاد/ماشین مجازی ربات یک هویت مدیریت‌شده دارد (اختصاص‌یافته توسط سیستم یا اختصاص‌یافته توسط کاربر).
2. یک **اعتبارنامه هویت فدره‌شده** هویت مدیریت‌شده را به ثبت برنامه Entra ID پیوند می‌دهد.
3. در زمان اجرا، OpenClaw از `@azure/identity` برای دریافت توکن‌ها از نقطه پایانی Azure IMDS (`169.254.169.254`) استفاده می‌کند.
4. توکن برای احراز هویت ربات به Teams SDK داده می‌شود.

**پیش‌نیازها:**

- زیرساخت Azure با هویت مدیریت‌شده فعال (هویت workload در AKS، App Service، VM)
- اعتبارنامه هویت فدره‌شده ایجادشده روی ثبت برنامه Entra ID
- دسترسی شبکه به IMDS (`169.254.169.254:80`) از پاد/ماشین مجازی

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

برای استقرارهای AKS که از workload identity استفاده می‌کنند:

1. **workload identity را فعال کنید** روی کلاستر AKS خود.
2. **یک اعتبارنامه هویت فدرال بسازید** روی ثبت اپ Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **حساب سرویس Kubernetes را حاشیه‌نویسی کنید** با شناسه کلاینت اپ:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **pod را برچسب‌گذاری کنید** برای تزریق workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **دسترسی شبکه** به IMDS (`169.254.169.254`) را تضمین کنید - اگر از NetworkPolicy استفاده می‌کنید، یک قانون خروجی اضافه کنید که ترافیک به `169.254.169.254/32` روی پورت 80 را مجاز کند.

### مقایسه نوع احراز هویت

| روش                    | پیکربندی                                      | مزایا                              | معایب                                      |
| ---------------------- | --------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| **رمز محرمانه کلاینت** | `appPassword`                                 | راه‌اندازی ساده                   | نیازمند چرخش رمز محرمانه، امنیت کمتر      |
| **گواهی‌نامه**         | `authType: "federated"` + `certificatePath`   | بدون رمز محرمانه مشترک روی شبکه   | سربار مدیریت گواهی‌نامه                   |
| **Managed Identity**   | `authType: "federated"` + `useManagedIdentity` | بدون رمز عبور، بدون مدیریت اسرار | نیازمند زیرساخت Azure                     |

**رفتار پیش‌فرض:** وقتی `authType` تنظیم نشده باشد، OpenClaw به‌طور پیش‌فرض از احراز هویت با رمز محرمانه کلاینت استفاده می‌کند. پیکربندی‌های موجود بدون تغییر همچنان کار می‌کنند.

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

اگر URL تونل شما تغییر کرد، endpoint را به‌روزرسانی کنید:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## آزمایش Bot

**اجرای عیب‌یابی:**

```bash
teams app doctor <teamsAppId>
```

ثبت bot، اپ AAD، manifest و پیکربندی SSO را در یک مرحله بررسی می‌کند.

**ارسال پیام آزمایشی:**

1. اپ Teams را نصب کنید (از لینک نصب از `teams app get <id> --install-link` استفاده کنید)
2. bot را در Teams پیدا کنید و یک DM بفرستید
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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (فقط MI اختصاص‌یافته به کاربر)

## کنش اطلاعات عضو

OpenClaw یک کنش `member-info` مبتنی بر Graph برای Microsoft Teams ارائه می‌کند تا عامل‌ها و اتوماسیون‌ها بتوانند جزئیات اعضای کانال (نام نمایشی، ایمیل، نقش) را مستقیماً از Microsoft Graph برطرف کنند.

نیازمندی‌ها:

- مجوز RSC با نام `Member.Read.Group` (از قبل در manifest پیشنهادی وجود دارد)
- برای جست‌وجوهای بین تیمی: مجوز Graph Application با نام `User.Read.All` همراه با رضایت مدیر

این کنش توسط `channels.msteams.actions.memberInfo` کنترل می‌شود (پیش‌فرض: وقتی اعتبارنامه‌های Graph در دسترس باشند فعال است).

## زمینه تاریخچه

- `channels.msteams.historyLimit` کنترل می‌کند چند پیام اخیر کانال/گروه در prompt قرار داده شوند.
- به `messages.groupChat.historyLimit` بازمی‌گردد. برای غیرفعال‌سازی `0` را تنظیم کنید (پیش‌فرض 50).
- تاریخچه thread واکشی‌شده بر اساس allowlistهای فرستنده (`allowFrom` / `groupAllowFrom`) فیلتر می‌شود، بنابراین مقداردهی اولیه زمینه thread فقط شامل پیام‌های فرستندگان مجاز است.
- زمینه پیوست نقل‌قول‌شده (`ReplyTo*` مشتق‌شده از HTML پاسخ Teams) فعلاً همان‌طور که دریافت شده پاس داده می‌شود.
- به بیان دیگر، allowlistها تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند؛ امروز فقط مسیرهای مشخصی از زمینه تکمیلی فیلتر می‌شوند.
- تاریخچه DM را می‌توان با `channels.msteams.dmHistoryLimit` محدود کرد (نوبت‌های کاربر). بازنویسی‌های مختص کاربر: `channels.msteams.dms["<user_id>"].historyLimit`.

## مجوزهای فعلی RSC در Teams (manifest)

این‌ها **مجوزهای resourceSpecific موجود** در manifest اپ Teams ما هستند. آن‌ها فقط درون تیم/چتی اعمال می‌شوند که اپ در آن نصب شده است.

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

### نکات مهم manifest (فیلدهای ضروری)

- `bots[].botId` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `webApplicationInfo.id` **باید** با Azure Bot App ID مطابقت داشته باشد.
- `bots[].scopes` باید سطح‌هایی را که قصد استفاده از آن‌ها را دارید شامل شود (`personal`، `team`، `groupChat`).
- `bots[].supportsFiles: true` برای مدیریت فایل در دامنه شخصی لازم است.
- اگر ترافیک کانال می‌خواهید، `authorization.permissions.resourceSpecific` باید خواندن/ارسال کانال را شامل شود.

### به‌روزرسانی یک اپ موجود

برای به‌روزرسانی اپ Teams که از قبل نصب شده است (مثلاً برای افزودن مجوزهای RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

پس از به‌روزرسانی، اپ را در هر تیم دوباره نصب کنید تا مجوزهای جدید اعمال شوند، و **Teams را کاملاً ببندید و دوباره اجرا کنید** (نه اینکه فقط پنجره را ببندید) تا فراداده کش‌شده اپ پاک شود.

<details>
<summary>به‌روزرسانی دستی manifest (بدون CLI)</summary>

1. `manifest.json` خود را با تنظیمات جدید به‌روزرسانی کنید
2. **فیلد `version` را افزایش دهید** (مثلاً `1.0.0` → `1.1.0`)
3. manifest را همراه با آیکن‌ها **دوباره zip کنید** (`manifest.json`، `outline.png`، `color.png`)
4. zip جدید را بارگذاری کنید:
   - **Teams Admin Center:** Teams apps → Manage apps → اپ خود را پیدا کنید → Upload new version
   - **Sideload:** در Teams → Apps → Manage your apps → Upload a custom app

</details>

## قابلیت‌ها: فقط RSC در برابر Graph

### با **فقط Teams RSC** (اپ نصب‌شده، بدون مجوزهای Graph API)

کار می‌کند:

- خواندن محتوای **متنی** پیام کانال.
- ارسال محتوای **متنی** پیام کانال.
- دریافت پیوست‌های فایل **شخصی (DM)**.

کار نمی‌کند:

- **تصویر یا محتوای فایل** کانال/گروه (payload فقط شامل HTML stub است).
- دانلود پیوست‌های ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام‌ها (فراتر از رویداد webhook زنده).

### با **Teams RSC + مجوزهای Microsoft Graph Application**

اضافه می‌کند:

- دانلود محتواهای میزبانی‌شده (تصاویر چسبانده‌شده در پیام‌ها).
- دانلود پیوست‌های فایل ذخیره‌شده در SharePoint/OneDrive.
- خواندن تاریخچه پیام کانال/چت از طریق Graph.

### RSC در برابر Graph API

| قابلیت                 | مجوزهای RSC           | Graph API                            |
| ---------------------- | --------------------- | ------------------------------------ |
| **پیام‌های بلادرنگ**   | بله (از طریق webhook) | خیر (فقط polling)                    |
| **پیام‌های تاریخی**    | خیر                   | بله (می‌تواند تاریخچه را query کند) |
| **پیچیدگی راه‌اندازی** | فقط manifest اپ       | نیازمند رضایت مدیر + جریان توکن     |
| **کار در حالت آفلاین** | خیر (باید در حال اجرا باشد) | بله (query در هر زمان)              |

**خلاصه:** RSC برای گوش‌دادن بلادرنگ است؛ Graph API برای دسترسی تاریخی است. برای رسیدگی به پیام‌های ازدست‌رفته در زمان آفلاین، به Graph API با `ChannelMessage.Read.All` نیاز دارید (نیازمند رضایت مدیر).

## رسانه و تاریخچه فعال‌شده با Graph (لازم برای کانال‌ها)

اگر به تصاویر/فایل‌ها در **کانال‌ها** نیاز دارید یا می‌خواهید **تاریخچه پیام** را واکشی کنید، باید مجوزهای Microsoft Graph را فعال کنید و رضایت مدیر را بدهید.

1. در Entra ID (Azure AD) **App Registration**، مجوزهای **Application permissions** برای Microsoft Graph را اضافه کنید:
   - `ChannelMessage.Read.All` (پیوست‌ها + تاریخچه کانال)
   - `Chat.Read.All` یا `ChatMessage.Read.All` (چت‌های گروهی)
2. **رضایت مدیر را اعطا کنید** برای tenant.
3. **نسخه manifest** اپ Teams را افزایش دهید، دوباره بارگذاری کنید، و **اپ را در Teams دوباره نصب کنید**.
4. **Teams را کاملاً ببندید و دوباره اجرا کنید** تا فراداده کش‌شده اپ پاک شود.

**مجوز اضافی برای اشاره به کاربران:** @mentionهای کاربران برای کاربرانی که در گفت‌وگو هستند به‌صورت پیش‌فرض کار می‌کنند. بااین‌حال، اگر می‌خواهید کاربرانی را که **در گفت‌وگوی فعلی نیستند** به‌صورت پویا جست‌وجو و mention کنید، مجوز `User.Read.All` (Application) را اضافه کنید و رضایت مدیر را اعطا کنید.

## محدودیت‌های شناخته‌شده

### وقفه‌های webhook

Teams پیام‌ها را از طریق HTTP webhook تحویل می‌دهد. اگر پردازش بیش از حد طول بکشد (مثلاً پاسخ‌های کند LLM)، ممکن است موارد زیر را ببینید:

- وقفه‌های Gateway
- تلاش دوباره Teams برای پیام (ایجاد تکراری‌ها)
- پاسخ‌های حذف‌شده

OpenClaw این وضعیت را با بازگشت سریع و ارسال پیش‌دستانهٔ پاسخ‌ها مدیریت می‌کند، اما پاسخ‌های بسیار کند همچنان ممکن است مشکل ایجاد کنند.

### پشتیبانی از ابر Teams و URL سرویس

این مسیر Teams مبتنی بر SDK برای ابر عمومی Microsoft Teams به‌صورت زنده اعتبارسنجی شده است.

پاسخ‌های ورودی از زمینهٔ turn ورودی SDK مربوط به Teams استفاده می‌کنند. عملیات پیش‌دستانهٔ خارج از زمینه - ارسال‌ها، ویرایش‌ها، حذف‌ها، کارت‌ها، نظرسنجی‌ها، پیام‌های رضایت فایل، و پاسخ‌های طولانی‌مدتِ صف‌شده - از `serviceUrl` مرجع گفت‌وگوی ذخیره‌شده استفاده می‌کنند. ابر عمومی به‌طور پیش‌فرض از محیط ابر عمومی SDK مربوط به Teams استفاده می‌کند و مراجع ذخیره‌شده روی میزبان عمومی Teams Connector را مجاز می‌داند: `https://smba.trafficmanager.net/`.

ابر عمومی حالت پیش‌فرض است. برای ربات‌های معمول ابر عمومی لازم نیست `channels.msteams.cloud` یا `channels.msteams.serviceUrl` را تنظیم کنید.

برای ابرهای غیرعمومی Teams، وقتی Microsoft مرز پیش‌دستانهٔ متناظر را منتشر کرد، `cloud` و آن مرز را تنظیم کنید:

- `channels.msteams.cloud` پیش‌تنظیم ابر SDK مربوط به Teams را برای احراز هویت، اعتبارسنجی JWT، سرویس‌های توکن، و دامنهٔ Graph انتخاب می‌کند.
- `channels.msteams.serviceUrl` مرز نقطهٔ پایانی Bot Connector را انتخاب می‌کند که برای اعتبارسنجی مراجع گفت‌وگوی ذخیره‌شده پیش از ارسال‌ها، ویرایش‌ها، حذف‌ها، کارت‌ها، نظرسنجی‌ها، پیام‌های رضایت فایل، و پاسخ‌های طولانی‌مدتِ صف‌شدهٔ پیش‌دستانه استفاده می‌شود. این مورد برای ابرهای SDK مربوط به USGov و DoD الزامی است. برای China/21Vianet، OpenClaw از پیش‌تنظیم SDK با نام `China` استفاده می‌کند و URLهای سرویس ذخیره‌شده/پیکربندی‌شده را فقط روی میزبان‌های کانال Azure China Bot Framework می‌پذیرد.

Microsoft نقطه‌های پایانی سراسری پیش‌دستانهٔ Bot Connector را در بخش [ایجاد گفت‌وگو](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) از مستندات پیام‌رسانی پیش‌دستانهٔ Teams منتشر می‌کند. هرجا در دسترس بود، از `serviceUrl` فعالیت ورودی استفاده کنید؛ اگر به یک نقطهٔ پایانی پیش‌دستانهٔ سراسری نیاز دارید، از جدول Microsoft استفاده کنید.

| محیط Teams | پیکربندی OpenClaw                                             | `serviceUrl` پیش‌دستانه                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| عمومی            | به پیکربندی cloud/serviceUrl نیاز نیست                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | `serviceUrl` را تنظیم کنید؛ پیش‌تنظیم ابر جداگانه‌ای در SDK مربوط به Teams وجود ندارد | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | از `serviceUrl` فعالیت ورودی استفاده کنید           |

نمونه برای GCC، جایی که Microsoft یک URL سرویس پیش‌دستانهٔ جداگانه مستند کرده اما SDK مربوط به Teams پیش‌تنظیم ابر جداگانه‌ای برای GCC ارائه نمی‌کند:

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

`channels.msteams.serviceUrl` به میزبان‌های پشتیبانی‌شدهٔ Microsoft Teams Bot Connector محدود است. وقتی یک URL سرویس پیکربندی شده باشد، OpenClaw پیش از اجرای ارسال‌ها، ویرایش‌ها، حذف‌ها، کارت‌ها، نظرسنجی‌ها، یا پاسخ‌های طولانی‌مدتِ صف‌شدهٔ پیش‌دستانه بررسی می‌کند که `serviceUrl` گفت‌وگوی ذخیره‌شده از همان میزبان استفاده کند. با پیکربندی پیش‌فرض ابر عمومی، اگر یک گفت‌وگوی ذخیره‌شده به بیرون از میزبان عمومی Teams Connector اشاره کند، OpenClaw به‌صورت بسته شکست می‌خورد. پس از تغییر تنظیمات URL ابر/سرویس، یک پیام تازه از گفت‌وگو دریافت کنید تا مرجع گفت‌وگوی ذخیره‌شده به‌روز باشد.

China/21Vianet در جدول نقطه‌های پایانی پیش‌دستانهٔ Teams متعلق به Microsoft، URL سراسری پیش‌دستانهٔ `smba` جداگانه‌ای ندارد. `cloud: "China"` را پیکربندی کنید تا SDK مربوط به Teams از نقطه‌های پایانی احراز هویت، توکن، و JWT در Azure China استفاده کند. سپس ارسال‌های پیش‌دستانه به یک مرجع گفت‌وگوی ذخیره‌شده از یک فعالیت ورودی China Teams، یا یک URL سرویس صریحاً پیکربندی‌شده، روی مرز کانال Azure China Bot Framework (`*.botframework.azure.cn`) نیاز دارند. کمک‌کننده‌های Teams مبتنی بر Graph در حال حاضر برای `cloud: "China"` غیرفعال هستند تا زمانی که OpenClaw درخواست‌های Graph را از طریق نقطهٔ پایانی Azure China Graph مسیریابی کند.

### قالب‌بندی

Markdown در Teams محدودتر از Slack یا Discord است:

- قالب‌بندی پایه کار می‌کند: **پررنگ**، _کج_، `code`، پیوندها
- Markdown پیچیده (جدول‌ها، فهرست‌های تو در تو) ممکن است درست نمایش داده نشود
- Adaptive Cards برای نظرسنجی‌ها و ارسال‌های ارائهٔ معنایی پشتیبانی می‌شوند (در ادامه ببینید)

## پیکربندی

تنظیمات کلیدی (برای الگوهای مشترک کانال، `/gateway/configuration` را ببینید):

- `channels.msteams.enabled`: کانال را فعال/غیرفعال کنید.
- `channels.msteams.appId`، `channels.msteams.appPassword`، `channels.msteams.tenantId`: اعتبارنامه‌های ربات.
- `channels.msteams.cloud`: محیط ابر SDK مربوط به Teams (`Public`، `USGov`، `USGovDoD`، یا `China`؛ پیش‌فرض `Public`). این را همراه با `serviceUrl` برای ابرهای SDK مربوط به USGov/DoD تنظیم کنید؛ China از پیش‌تنظیم SDK و مراجع گفت‌وگوی ذخیره‌شدهٔ Azure China Bot Framework استفاده می‌کند، و کمک‌کننده‌های مبتنی بر Graph تا زمان پیاده‌سازی مسیریابی Azure China Graph غیرفعال هستند.
- `channels.msteams.serviceUrl`: مرز URL سرویس Bot Connector برای عملیات پیش‌دستانهٔ SDK. ابر عمومی از پیش‌فرض SDK استفاده می‌کند؛ این را برای GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`)، GCC High، یا DoD تنظیم کنید. China وقتی مرجع گفت‌وگوی ذخیره‌شده از Teams تحت بهره‌برداری 21Vianet آمده باشد، میزبان‌های کانال Azure China Bot Framework را می‌پذیرد.
- `channels.msteams.webhook.port` (پیش‌فرض `3978`)
- `channels.msteams.webhook.path` (پیش‌فرض `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: pairing)
- `channels.msteams.allowFrom`: فهرست مجاز DM (شناسه‌های شیء AAD توصیه می‌شود). وقتی دسترسی Graph در دسترس باشد، جادوگر هنگام راه‌اندازی نام‌ها را به شناسه‌ها تبدیل می‌کند.
- `channels.msteams.dangerouslyAllowNameMatching`: تغییر وضعیت اضطراری برای فعال‌سازی دوبارهٔ تطبیق قابل‌تغییر UPN/نام نمایشی و مسیریابی مستقیم نام تیم/کانال.
- `channels.msteams.textChunkLimit`: اندازهٔ قطعهٔ متن خروجی.
- `channels.msteams.chunkMode`: `length` (پیش‌فرض) یا `newline` برای تقسیم بر اساس خطوط خالی (مرزهای پاراگراف) پیش از قطعه‌بندی بر اساس طول.
- `channels.msteams.mediaAllowHosts`: فهرست مجاز میزبان‌های پیوست ورودی (به‌طور پیش‌فرض دامنه‌های Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: فهرست مجاز برای افزودن سرآیندهای Authorization در تلاش‌های مجدد رسانه (به‌طور پیش‌فرض میزبان‌های Graph + Bot Framework).
- `channels.msteams.requireMention`: در کانال‌ها/گروه‌ها @mention را الزامی کنید (پیش‌فرض true).
- `channels.msteams.replyStyle`: `thread | top-level` (بخش [سبک پاسخ](#reply-style-threads-vs-posts) را ببینید).
- `channels.msteams.teams.<teamId>.replyStyle`: بازنویسی به‌ازای هر تیم.
- `channels.msteams.teams.<teamId>.requireMention`: بازنویسی به‌ازای هر تیم.
- `channels.msteams.teams.<teamId>.tools`: بازنویسی‌های پیش‌فرض خط‌مشی ابزار به‌ازای هر تیم (`allow`/`deny`/`alsoAllow`) که وقتی بازنویسی کانال موجود نیست استفاده می‌شود.
- `channels.msteams.teams.<teamId>.toolsBySender`: بازنویسی‌های پیش‌فرض خط‌مشی ابزار به‌ازای هر تیم و هر فرستنده (نویسهٔ عام `"*"` پشتیبانی می‌شود).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: بازنویسی به‌ازای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: بازنویسی به‌ازای هر کانال.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: بازنویسی‌های خط‌مشی ابزار به‌ازای هر کانال (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: بازنویسی‌های خط‌مشی ابزار به‌ازای هر کانال و هر فرستنده (نویسهٔ عام `"*"` پشتیبانی می‌شود).
- کلیدهای `toolsBySender` باید از پیشوندهای صریح استفاده کنند:
  `channel:`، `id:`، `e164:`، `username:`، `name:` (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند).
- `channels.msteams.actions.memberInfo`: کنش اطلاعات عضو مبتنی بر Graph را فعال یا غیرفعال کنید (پیش‌فرض: وقتی اعتبارنامه‌های Graph در دسترس باشند فعال است).
- `channels.msteams.authType`: نوع احراز هویت - `"secret"` (پیش‌فرض) یا `"federated"`.
- `channels.msteams.certificatePath`: مسیر فایل گواهی PEM (احراز هویت federated + گواهی).
- `channels.msteams.certificateThumbprint`: اثر انگشت گواهی (اختیاری، برای احراز هویت الزامی نیست).
- `channels.msteams.useManagedIdentity`: احراز هویت هویت مدیریت‌شده را فعال کنید (حالت federated).
- `channels.msteams.managedIdentityClientId`: شناسهٔ کلاینت برای هویت مدیریت‌شدهٔ تخصیص‌یافته به کاربر.
- `channels.msteams.sharePointSiteId`: شناسهٔ سایت SharePoint برای بارگذاری فایل در گفت‌وگوهای گروهی/کانال‌ها (بخش [ارسال فایل در گفت‌وگوهای گروهی](#sending-files-in-group-chats) را ببینید).

## مسیریابی و نشست‌ها

- کلیدهای نشست از قالب استاندارد عامل پیروی می‌کنند (بخش [/concepts/session](/fa/concepts/session) را ببینید):
  - پیام‌های مستقیم نشست اصلی را به اشتراک می‌گذارند (`agent:<agentId>:<mainKey>`).
  - پیام‌های کانال/گروه از شناسهٔ گفت‌وگو استفاده می‌کنند:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## سبک پاسخ: رشته‌ها در برابر پست‌ها

Teams اخیراً دو سبک رابط کاربری کانال را روی همان مدل دادهٔ زیربنایی معرفی کرده است:

| سبک                    | توضیح                                               | `replyStyle` توصیه‌شده |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **پست‌ها** (کلاسیک)      | پیام‌ها به‌صورت کارت‌هایی با پاسخ‌های رشته‌ای در زیرشان ظاهر می‌شوند | `thread` (پیش‌فرض)       |
| **رشته‌ها** (شبیه Slack) | پیام‌ها به‌صورت خطی جریان می‌یابند، بیشتر شبیه Slack                   | `top-level`              |

**مشکل:** API مربوط به Teams مشخص نمی‌کند یک کانال از کدام سبک رابط کاربری استفاده می‌کند. اگر از `replyStyle` اشتباه استفاده کنید:

- `thread` در یک کانال با سبک Threads → پاسخ‌ها به‌صورت نامناسبی تو در تو ظاهر می‌شوند
- `top-level` در یک کانال با سبک Posts → پاسخ‌ها به‌جای داخل رشته، به‌صورت پست‌های سطح بالای جداگانه ظاهر می‌شوند

**راه‌حل:** `replyStyle` را بر اساس نحوهٔ تنظیم کانال، به‌ازای هر کانال پیکربندی کنید:

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

### تقدم تفکیک

وقتی ربات پاسخی را در یک کانال ارسال می‌کند، `replyStyle` از خاص‌ترین بازنویسی تا پیش‌فرض تفکیک می‌شود. نخستین مقدار غیر `undefined` برنده می‌شود:

1. **به‌ازای هر کانال** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **به‌ازای هر تیم** — `channels.msteams.teams.<teamId>.replyStyle`
3. **سراسری** — `channels.msteams.replyStyle`
4. **پیش‌فرض ضمنی** — برگرفته از `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

اگر `requireMention: false` را به‌صورت سراسری و بدون `replyStyle` صریح تنظیم کنید، mentionها در کانال‌های با سبک Posts حتی وقتی ورودی یک پاسخ رشته‌ای بوده باشد، به‌صورت پست‌های سطح بالا ظاهر می‌شوند. برای جلوگیری از غافلگیری، `replyStyle: "thread"` را در سطح سراسری، تیم، یا کانال ثابت کنید.

### حفظ زمینهٔ رشته

وقتی `replyStyle: "thread"` فعال است و ربات از داخل یک رشتهٔ کانال @mentioned شده باشد، OpenClaw ریشهٔ رشتهٔ اصلی را دوباره به مرجع گفت‌وگوی خروجی متصل می‌کند (`19:…@thread.tacv2;messageid=<root>`) تا پاسخ داخل همان رشته قرار بگیرد. این رفتار هم برای ارسال‌های زنده (درون turn) و هم برای ارسال‌های پیش‌دستانه‌ای که پس از منقضی شدن زمینهٔ turn در Bot Framework انجام می‌شوند برقرار است (برای مثال، عامل‌های طولانی‌مدت، پاسخ‌های فراخوانی ابزار صف‌شده از طریق `mcp__openclaw__message`).

ریشهٔ رشته از `threadId` ذخیره‌شده روی مرجع گفت‌وگو گرفته می‌شود. مراجع ذخیره‌شدهٔ قدیمی‌تر که پیش از `threadId` ایجاد شده‌اند به `activityId` بازمی‌گردند (هر فعالیت ورودی‌ای که آخرین بار گفت‌وگو را مقداردهی کرده باشد)، بنابراین استقرارهای موجود بدون مقداردهی دوباره همچنان کار می‌کنند.

وقتی `replyStyle: "top-level"` فعال است، ورودی‌های thread کانال عمدا به‌صورت پست‌های سطح بالا و جدید پاسخ داده می‌شوند؛ هیچ پسوند thread پیوست نمی‌شود. این رفتار صحیح برای کانال‌های سبک Threads است؛ اگر پست‌های سطح بالا می‌بینید در حالی که انتظار پاسخ‌های thread شده داشتید، `replyStyle` شما برای آن کانال نادرست تنظیم شده است.

## پیوست‌ها و تصاویر

**محدودیت‌های فعلی:**

- **پیام‌های مستقیم:** تصاویر و پیوست‌های فایل از طریق APIهای فایل ربات Teams کار می‌کنند.
- **کانال‌ها/گروه‌ها:** پیوست‌ها در فضای ذخیره‌سازی M365 (SharePoint/OneDrive) قرار دارند. payload وب‌هوک فقط یک stub HTML را شامل می‌شود، نه بایت‌های واقعی فایل. **مجوزهای Graph API لازم هستند** تا پیوست‌های کانال دانلود شوند.
- برای ارسال‌های صریحِ فایل‌محور، از `action=upload-file` همراه با `media` / `filePath` / `path` استفاده کنید؛ `message` اختیاری به متن/نظر همراه تبدیل می‌شود، و `filename` نام آپلودشده را بازنویسی می‌کند.

بدون مجوزهای Graph، پیام‌های کانال که شامل تصویر هستند فقط به‌صورت متن دریافت می‌شوند (محتوای تصویر برای ربات قابل دسترسی نیست).
به‌صورت پیش‌فرض، OpenClaw فقط رسانه را از نام‌های میزبان Microsoft/Teams دانلود می‌کند. با `channels.msteams.mediaAllowHosts` بازنویسی کنید (برای اجازه دادن به هر میزبان از `["*"]` استفاده کنید).
سرآیندهای مجوزدهی فقط برای میزبان‌های موجود در `channels.msteams.mediaAuthAllowHosts` پیوست می‌شوند (پیش‌فرض: میزبان‌های Graph + Bot Framework). این فهرست را سخت‌گیرانه نگه دارید (از پسوندهای چندمستاجری پرهیز کنید).

## ارسال فایل در گفت‌وگوهای گروهی

ربات‌ها می‌توانند با استفاده از جریان FileConsentCard (داخلی) در پیام‌های مستقیم فایل ارسال کنند. با این حال، **ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها** به راه‌اندازی بیشتری نیاز دارد:

| زمینه | نحوه ارسال فایل‌ها | راه‌اندازی لازم |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **پیام‌های مستقیم** | FileConsentCard → کاربر می‌پذیرد → ربات آپلود می‌کند | بدون تنظیم اضافی کار می‌کند |
| **گفت‌وگوهای گروهی/کانال‌ها** | آپلود در SharePoint → اشتراک‌گذاری پیوند | به `sharePointSiteId` + مجوزهای Graph نیاز دارد |
| **تصاویر (هر زمینه‌ای)** | درون‌خطی با کدگذاری Base64 | بدون تنظیم اضافی کار می‌کند |

### چرا گفت‌وگوهای گروهی به SharePoint نیاز دارند

ربات‌ها drive شخصی OneDrive ندارند (نقطه پایانی `/me/drive` در Graph API برای هویت‌های برنامه کار نمی‌کند). برای ارسال فایل در گفت‌وگوهای گروهی/کانال‌ها، ربات در یک **سایت SharePoint** آپلود می‌کند و یک پیوند اشتراک‌گذاری می‌سازد.

### راه‌اندازی

1. **مجوزهای Graph API را اضافه کنید** در Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - آپلود فایل‌ها در SharePoint
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

| مجوز | رفتار اشتراک‌گذاری |
| --------------------------------------- | --------------------------------------------------------- |
| فقط `Sites.ReadWrite.All` | پیوند اشتراک‌گذاری در سطح سازمان (هر کسی در سازمان می‌تواند دسترسی داشته باشد) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | پیوند اشتراک‌گذاری برای هر کاربر (فقط اعضای گفت‌وگو می‌توانند دسترسی داشته باشند) |

اشتراک‌گذاری برای هر کاربر امن‌تر است، چون فقط شرکت‌کنندگان گفت‌وگو می‌توانند به فایل دسترسی داشته باشند. اگر مجوز `Chat.Read.All` وجود نداشته باشد، ربات به اشتراک‌گذاری در سطح سازمان بازمی‌گردد.

### رفتار جایگزین

| سناریو | نتیجه |
| ------------------------------------------------- | -------------------------------------------------- |
| گفت‌وگوی گروهی + فایل + `sharePointSiteId` پیکربندی‌شده | آپلود در SharePoint، ارسال پیوند اشتراک‌گذاری |
| گفت‌وگوی گروهی + فایل + بدون `sharePointSiteId` | تلاش برای آپلود در OneDrive (ممکن است شکست بخورد)، فقط ارسال متن |
| گفت‌وگوی شخصی + فایل | جریان FileConsentCard (بدون SharePoint کار می‌کند) |
| هر زمینه‌ای + تصویر | درون‌خطی با کدگذاری Base64 (بدون SharePoint کار می‌کند) |

### محل ذخیره فایل‌ها

فایل‌های آپلودشده در پوشه `/OpenClawShared/` در کتابخانه اسناد پیش‌فرض سایت SharePoint پیکربندی‌شده ذخیره می‌شوند.

## نظرسنجی‌ها (Adaptive Cards)

OpenClaw نظرسنجی‌های Teams را به‌صورت Adaptive Cards ارسال می‌کند (API بومی نظرسنجی Teams وجود ندارد).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- رأی‌ها توسط Gateway در SQLite وضعیت Plugin متعلق به OpenClaw زیر `state/openclaw.sqlite` ثبت می‌شوند.
- فایل‌های موجود `msteams-polls.json` توسط `openclaw doctor --fix` وارد می‌شوند، نه توسط Plugin در حال اجرا.
- Gateway باید آنلاین بماند تا رأی‌ها ثبت شوند.
- نظرسنجی‌ها هنوز خلاصه‌های نتایج را خودکار پست نمی‌کنند، و هنوز CLI پشتیبانی‌شده‌ای برای نتایج نظرسنجی وجود ندارد.

## کارت‌های ارائه

payloadهای ارائه معنایی را با استفاده از ابزار `message`، CLI، یا تحویل پاسخ عادی به کاربران یا گفت‌وگوهای Teams ارسال کنید. OpenClaw آن‌ها را از قرارداد عمومی ارائه به‌صورت Teams Adaptive Cards رندر می‌کند.

پارامتر `presentation` بلوک‌های معنایی را می‌پذیرد. وقتی `presentation` ارائه شده باشد، متن پیام اختیاری است. دکمه‌ها به‌صورت اقدام‌های submit یا URL در Adaptive Card رندر می‌شوند. منوهای انتخابی هنوز در رندرر Teams بومی نیستند، بنابراین OpenClaw پیش از تحویل آن‌ها را به متن خوانا تنزل می‌دهد.

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

| نوع هدف | قالب | مثال |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| کاربر (بر اساس شناسه) | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| کاربر (بر اساس نام) | `user:<display-name>` | `user:John Smith` (به Graph API نیاز دارد) |
| گروه/کانال | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| گروه/کانال (خام) | `<conversation-id>` | `19:abc123...@thread.tacv2` (اگر شامل `@thread` باشد) |

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
بدون پیشوند `user:`، نام‌ها به‌صورت پیش‌فرض به تفکیک گروه یا تیم می‌روند. هنگام هدف‌گیری افراد بر اساس نام نمایشی، همیشه از `user:` استفاده کنید.
</Note>

## پیام‌رسانی پیش‌دستانه

- پیام‌های پیش‌دستانه فقط **پس از** تعامل کاربر ممکن هستند، چون در آن نقطه ارجاع‌های گفت‌وگو را ذخیره می‌کنیم.
- برای `dmPolicy` و کنترل allowlist، `/gateway/configuration` را ببینید.

## شناسه‌های تیم و کانال (اشتباه رایج)

پارامتر query با نام `groupId` در URLهای Teams، شناسه تیمی **نیست** که برای پیکربندی استفاده می‌شود. به‌جای آن، شناسه‌ها را از مسیر URL استخراج کنید:

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

- کلید تیم = بخش مسیر پس از `/team/` (URL-decoded، برای مثال `19:Bk4j...@thread.tacv2`؛ مستاجران قدیمی‌تر ممکن است `@thread.skype` را نشان دهند، که آن هم معتبر است)
- کلید کانال = بخش مسیر پس از `/channel/` (URL-decoded)
- پارامتر query با نام `groupId` را برای مسیریابی OpenClaw **نادیده بگیرید**. این شناسه گروه Microsoft Entra است، نه شناسه گفت‌وگوی Bot Framework که در فعالیت‌های ورودی Teams استفاده می‌شود.

## کانال‌های خصوصی

ربات‌ها در کانال‌های خصوصی پشتیبانی محدودی دارند:

| قابلیت | کانال‌های استاندارد | کانال‌های خصوصی |
| ---------------------------- | ----------------- | ---------------------- |
| نصب ربات | بله | محدود |
| پیام‌های بلادرنگ (Webhook) | بله | ممکن است کار نکند |
| مجوزهای RSC | بله | ممکن است رفتار متفاوتی داشته باشد |
| @mentionها | بله | اگر ربات قابل دسترسی باشد |
| تاریخچه Graph API | بله | بله (با مجوزها) |

**راهکارها اگر کانال‌های خصوصی کار نمی‌کنند:**

1. از کانال‌های استاندارد برای تعامل با ربات استفاده کنید
2. از پیام‌های مستقیم استفاده کنید - کاربران همیشه می‌توانند مستقیما به ربات پیام بدهند
3. از Graph API برای دسترسی تاریخی استفاده کنید (به `ChannelMessage.Read.All` نیاز دارد)

## عیب‌یابی

### مشکلات رایج

- **تصاویر در کانال‌ها نمایش داده نمی‌شوند:** مجوزهای Graph یا رضایت مدیر وجود ندارد. برنامه Teams را دوباره نصب کنید و Teams را کامل ببندید/دوباره باز کنید.
- **بدون پاسخ در کانال:** mentionها به‌صورت پیش‌فرض لازم هستند؛ `channels.msteams.requireMention=false` را تنظیم کنید یا برای هر تیم/کانال پیکربندی کنید.
- **عدم تطابق نسخه (Teams هنوز manifest قدیمی را نشان می‌دهد):** برنامه را حذف و دوباره اضافه کنید و Teams را کامل ببندید تا تازه‌سازی شود.
- **401 Unauthorized از وب‌هوک:** هنگام آزمایش دستی بدون Azure JWT مورد انتظار است - یعنی نقطه پایانی قابل دسترسی است اما احراز هویت شکست خورده است. برای آزمایش درست از Azure Web Chat استفاده کنید.

### خطاهای آپلود manifest

- **"Icon file cannot be empty":** manifest به فایل‌های آیکنی ارجاع می‌دهد که 0 بایت هستند. آیکن‌های PNG معتبر بسازید (32x32 برای `outline.png`، 192x192 برای `color.png`).
- **"webApplicationInfo.Id already in use":** برنامه هنوز در تیم/گفت‌وگوی دیگری نصب است. ابتدا آن را پیدا و حذف نصب کنید، یا 5 تا 10 دقیقه برای انتشار تغییر صبر کنید.
- **"Something went wrong" هنگام آپلود:** به‌جای آن از طریق [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) آپلود کنید، DevTools مرورگر (F12) → زبانه Network را باز کنید، و بدنه پاسخ را برای خطای واقعی بررسی کنید.
- **شکست sideload:** به‌جای "Upload a custom app"، گزینه "Upload an app to your org's app catalog" را امتحان کنید - این کار اغلب محدودیت‌های sideload را دور می‌زند.

### مجوزهای RSC کار نمی‌کنند

1. بررسی کنید `webApplicationInfo.id` دقیقاً با شناسهٔ برنامهٔ بات شما مطابقت داشته باشد
2. برنامه را دوباره بارگذاری کنید و آن را در تیم/گفت‌وگو دوباره نصب کنید
3. بررسی کنید آیا مدیر سازمان شما مجوزهای RSC را مسدود کرده است یا نه
4. تأیید کنید که از دامنهٔ درست استفاده می‌کنید: `ChannelMessage.Read.Group` برای تیم‌ها، `ChatMessage.Read.Chat` برای گفت‌وگوهای گروهی

## منابع

- [ایجاد Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - راهنمای راه‌اندازی Azure Bot
- [پرتال توسعه‌دهندگان Teams](https://dev.teams.microsoft.com/apps) - ایجاد/مدیریت برنامه‌های Teams
- [طرح‌وارهٔ مانیفست برنامهٔ Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [دریافت پیام‌های کانال با RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [مرجع مجوزهای RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [مدیریت فایل در بات Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (کانال/گروه به Graph نیاز دارد)
- [پیام‌رسانی پیش‌دستانه](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI مربوط به Teams برای مدیریت بات

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و محدودسازی مبتنی بر اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و سخت‌سازی
