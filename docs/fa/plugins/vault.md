---
read_when:
    - می‌خواهید OpenClaw کلیدهای API را از HashiCorp Vault بخواند
    - شما در حال راه‌اندازی SecretRefها روی یک رایانه یا سرور محلی هستید
    - باید اطلاعات احراز هویت ارائه‌دهنده مدل با پشتیبانی Vault را پیکربندی کنید
summary: از Plugin داخلی Vault برای واکشی SecretRefها از HashiCorp Vault استفاده کنید
title: ارجاع‌های راز Vault
x-i18n:
    generated_at: "2026-07-12T10:34:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# SecretRefهای Vault

Plugin همراه Vault به OpenClaw امکان می‌دهد SecretRefهای `exec` را هنگام راه‌اندازی و بارگذاری مجدد Gateway از HashiCorp Vault دریافت و تفسیر کند. OpenClaw ارجاع‌های Vault را در پیکربندی ذخیره می‌کند، مقادیر دریافت‌شده را در نمای لحظه‌ای اسرارِ درون‌حافظه‌ای نگه می‌دارد و کلیدهای API دریافت‌شده را دوباره در `openclaw.json` نمی‌نویسد.

هنگامی از این قابلیت استفاده کنید که از قبل Vault را اجرا می‌کنید یا می‌خواهید کلیدهای ارائه‌دهندگان مدل خارج از فایل‌های پیکربندی OpenClaw نگهداری شوند. برای آشنایی با مدل زمان اجرای SecretRef، به [مدیریت اسرار](/fa/gateway/secrets) مراجعه کنید.

## پیش از شروع

به موارد زیر نیاز دارید:

- OpenClaw با Plugin همراه `vault`
- یک سرور Vault در دسترس
- احراز هویت Vault که بتواند یک توکن کارخواه با دسترسی خواندن به مسیرهای اسراری که OpenClaw باید دریافت کند، ایجاد کند
- محیطی که Gateway را راه‌اندازی می‌کند باید شامل `VAULT_ADDR` و یکی از این موارد باشد: `VAULT_TOKEN`، یا `OPENCLAW_VAULT_AUTH_METHOD=token_file` همراه با `VAULT_TOKEN_FILE`، یا ورود پیکربندی‌شده JWT/Kubernetes

حل‌کننده از طریق HTTP و از Node با Vault ارتباط برقرار می‌کند. Gateway برای دریافت و تفسیر SecretRefها به CLI مربوط به Vault نیاز ندارد.

پیش از اجرای فرمان‌های `openclaw vault`، Plugin همراه را فعال کنید:

```bash
openclaw plugins enable vault
```

## ذخیره کلید ارائه‌دهنده در Vault

پیش‌فرض OpenClaw استفاده از KV v2 نصب‌شده در `secret` است که با نمونه‌های سرور توسعه Vault مطابقت دارد. برای Vault عملیاتی، پیش از ایجاد شناسه‌های SecretRef، مقدار `OPENCLAW_VAULT_KV_MOUNT` را روی مسیر واقعی نصب KV خود تنظیم کنید. با پیش‌فرض‌های OpenClaw، این شناسه SecretRef:

```text
providers/openrouter/apiKey
```

این فیلد Vault را می‌خواند:

```text
secret/data/providers/openrouter -> apiKey
```

یکی از روش‌های ایجاد آن با CLI مربوط به Vault چنین است:

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

برای OpenClaw از توکن کارخواه دارای دامنه محدود استفاده کنید، نه توکن ریشه. برای چیدمان پیش‌فرض KV v2، یک خط‌مشی حداقلی برای کلیدهای ارائه‌دهنده مدل به این صورت است:

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## در دسترس قرار دادن Vault برای Gateway

برای یک Gateway محلی و بدون کانتینر، تنظیمات Vault را در همان پوسته‌ای صادر کنید که OpenClaw را راه‌اندازی می‌کند. روش احراز هویت پیش‌فرض، توکن کارخواه Vault را از `VAULT_TOKEN` می‌خواند:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

اگر Vault Agent توکن را در یک فایل مقصد می‌نویسد، از احراز هویت مبتنی بر فایل توکن استفاده کنید:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

برای سرور Vault که با یک مرجع صدور گواهی خصوصی امضا شده است، یا آن مرجع را در مخزن اعتماد میزبان نصب و اعتماد سیستمی Node را فعال کنید:

```bash
export NODE_USE_SYSTEM_CA=1
```

یا یک بسته PEM را مستقیماً ارائه دهید:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

این متغیرها باید هنگام راه‌اندازی OpenClaw موجود باشند. Plugin مربوط به Vault آن‌ها را به فرایند حل‌کننده خود ارسال می‌کند.

برای احراز هویت غیرتعاملی JWT، از یک فایل JWT بارکاری و یک نقش Vault از نوع `jwt` استفاده کنید:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

فایل JWT باید یک توکن بارکاری فرافکنی‌شده باشد؛ برای مثال، توکن حساب سرویس Kubernetes با مخاطبی که نقش Vault آن را می‌پذیرد.
ورود تعاملی OIDC از طریق مرورگر برای کاربران انسانی مفید است، اما زمان اجرای Gateway به ورود غیرتعاملی JWT یا یک فایل توکن نیاز دارد.

برای روش احراز هویت Kubernetes در Vault، از `kubernetes` استفاده کنید. این روش برای Gatewayهایی در نظر گرفته شده است که به‌شکل Pod اجرا می‌شوند؛ محل نصب پیش‌فرض `kubernetes` و فایل JWT پیش‌فرض، مسیر استاندارد توکن حساب سرویس است:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

فقط هنگامی `OPENCLAW_VAULT_AUTH_MOUNT` را تنظیم کنید که احراز هویت Kubernetes در Vault در جایی غیر از `auth/kubernetes` نصب شده باشد. فقط هنگامی `OPENCLAW_VAULT_JWT_FILE` را تنظیم کنید که توکن حساب سرویس در مسیری سفارشی فرافکنی شده باشد.

تنظیمات اختیاری:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

بررسی کنید پوسته فعلی چه مواردی را می‌تواند ببیند:

```bash
openclaw vault status
```

هنگامی که بیش از یک ارائه‌دهنده اسرار مبتنی بر Vault پیکربندی شده است، یکی را با نام مستعار انتخاب کنید:

```bash
openclaw vault status --provider-alias corp-vault
```

فرمان `openclaw vault status` هرگز `VAULT_TOKEN` را چاپ نمی‌کند؛ فقط گزارش می‌دهد که آیا توکن، فایل توکن و فایل JWT تنظیم شده‌اند یا خیر.

<Warning>
اگر Gateway به‌شکل سرویس، LaunchAgent، واحد systemd، وظیفه زمان‌بندی‌شده یا کانتینر اجرا می‌شود، محیط زمان اجرای آن باید همان متغیرهای Vault را دریافت کند. تنظیم متغیرها در یک پوسته تعاملی فقط وضعیت همان پوسته را اثبات می‌کند، نه Gateway در حال اجرا را.
</Warning>

## ایجاد و اعمال طرح SecretRef

طرحی ایجاد کنید که کلید API ارائه‌دهنده مدل OpenRouter را به Vault نگاشت کند:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

طرح را اعمال و تأیید کنید:

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

از `--allow-exec` استفاده کنید، زیرا Plugin مربوط به Vault عملیات دریافت و تفسیر را از طریق یک ارائه‌دهنده SecretRef از نوع exec و مدیریت‌شده توسط OpenClaw انجام می‌دهد.

اگر Gateway هنوز در حال اجرا نیست، پس از اعمال طرح، به‌جای اجرای `openclaw secrets reload` آن را به روش معمول راه‌اندازی کنید.

## پیکربندی کلیدهای بیشتر ارائه‌دهندگان

میان‌برهای داخلی:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

چند کلید ارائه‌دهنده در یک طرح:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

برای ارائه‌دهندگان همراهی که میان‌بر ندارند، یا ارائه‌دهندگان مدل سفارشی و سازگار با OpenAI که از قبل پیکربندی شده‌اند، از `--provider-key` استفاده کنید:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

هر `--provider-key <provider=id>` یک SecretRef را در `models.providers.<provider>.apiKey` می‌نویسد. برای ارائه‌دهندگان سفارشی، این گزینه تنظیمات `baseUrl`، `api` یا `models` ارائه‌دهنده را ایجاد نمی‌کند؛ ابتدا آن‌ها را پیکربندی کنید.

برای هر مسیر مقصد شناخته‌شده SecretRef از `--target <path=id>` استفاده کنید:

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

مسیرهای مقصد ساده روی `openclaw.json` اعمال می‌شوند. برای مقصدهای موجود در `auth-profiles.json` از `auth-profiles:<agentId>:<path>` استفاده کنید.
مسیر مقصد باید یک مقصد ثبت‌شده SecretRef در OpenClaw باشد. فرمان راه‌اندازی، اسرار نام‌گذاری‌شده دلخواهی را در OpenClaw ایجاد نمی‌کند؛ Vault همچنان مخزن اسرار باقی می‌ماند و OpenClaw فقط SecretRefها را در فیلدهای پیکربندی پشتیبانی‌شده ذخیره می‌کند.

## قالب شناسه SecretRef

شناسه‌های SecretRef مربوط به Vault از این قرارداد استفاده می‌کنند:

```text
<vault-secret-path>/<field>
```

نمونه‌ها:

| شناسه SecretRef                  | خواندن پیش‌فرض Vault با KV v2           | فیلد بازگردانده‌شده |
| ----------------------------- | ---------------------------------- | -------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`       |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`       |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`   |

فیلد بازگردانده‌شده Vault باید رشته باشد.

برای KV v1، این مقدار را تنظیم کنید:

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

سپس `providers/openrouter/apiKey` این مورد را می‌خواند:

```text
secret/providers/openrouter -> apiKey
```

## آنچه OpenClaw ذخیره می‌کند

اعمال طرح راه‌اندازی Vault، یک ارائه‌دهنده مدیریت‌شده توسط Plugin را ذخیره می‌کند:

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

فیلدهای اعتبارنامه به آن ارائه‌دهنده اشاره می‌کنند:

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

مقدار دریافت‌شده فقط در نمای لحظه‌ای اسرارِ زمان اجرای فعال نگهداری می‌شود.

## کانتینرها و استقرارهای مدیریت‌شده

Gatewayهای کانتینری نیز از همان Plugin و پیکربندی SecretRef استفاده می‌کنند. کانتینر باید این موارد را دریافت کند:

- `VAULT_ADDR`
- یک منبع احراز هویت:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` به‌همراه `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` به‌همراه `OPENCLAW_VAULT_AUTH_MOUNT`،
    `OPENCLAW_VAULT_AUTH_ROLE` و `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` به‌همراه `OPENCLAW_VAULT_AUTH_ROLE`؛ در صورت نیاز
    `OPENCLAW_VAULT_AUTH_MOUNT` یا `OPENCLAW_VAULT_JWT_FILE` را بازنویسی کنید
- `VAULT_NAMESPACE`، `OPENCLAW_VAULT_KV_MOUNT` و `OPENCLAW_VAULT_KV_VERSION` به‌صورت اختیاری

هنگام استفاده از Kubernetes، اگر احراز هویت Kubernetes در Vault برای خوشه پیکربندی شده است، `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` را ترجیح دهید. فقط هنگامی از `OPENCLAW_VAULT_AUTH_METHOD=jwt` استفاده کنید که Vault برای درنظرگرفتن خوشه به‌عنوان صادرکننده عمومی JWT/OIDC پیکربندی شده باشد. هر دو گزینه از یک توکن بلندمدت Vault در Kubernetes Secret بهترند. استقرارهای مبتنی بر همراه جانبی یا تزریق‌کننده Vault Agent می‌توانند به‌جای آن از `token_file` استفاده کنند.

برای راه‌اندازی‌های چندمستأجری Vault، مسیریابی مستأجر را در خط‌مشی Vault و پیکربندی استقرار نگه دارید. OpenClaw به محل نصب، نقش یا مسیر ثابتی نیاز ندارد: هر محیط Gateway می‌تواند `OPENCLAW_VAULT_KV_MOUNT`، `OPENCLAW_VAULT_AUTH_ROLE` و شناسه‌های SecretRef خود را تنظیم کند. اگر یک Gateway مشترک باید هم‌زمان اسرار کاربران متفاوت Vault را دریافت و تفسیر کند، از ارائه‌دهندگان exec با پیکربندی دستی استفاده کنید که محیط‌های احراز هویت مجزا را دربر می‌گیرند، یا مستأجران را میان محیط‌های Gateway با محیط‌های Vault جداگانه تقسیم کنید.

## مطالب مرتبط

- [مدیریت اسرار](/fa/gateway/secrets)
- [`openclaw secrets`](/fa/cli/secrets)
- [فهرست Pluginها](/fa/plugins/plugin-inventory)
