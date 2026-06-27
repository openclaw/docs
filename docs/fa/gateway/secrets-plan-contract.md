---
read_when:
    - ایجاد یا بازبینی طرح‌های `openclaw secrets apply`
    - اشکال‌زدایی خطاهای `Invalid plan target path`
    - درک نوع هدف و رفتار اعتبارسنجی مسیر
summary: 'قرارداد برای طرح‌های `secrets apply`: اعتبارسنجی هدف، تطبیق مسیر، و دامنه هدف `auth-profiles.json`'
title: قرارداد طرح اعمال رازها
x-i18n:
    generated_at: "2026-06-27T17:49:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

این صفحه قرارداد سخت‌گیرانه‌ای را تعریف می‌کند که توسط `openclaw secrets apply` اعمال می‌شود.

اگر هدفی با این قواعد مطابقت نداشته باشد، apply پیش از تغییر پیکربندی شکست می‌خورد.

## شکل فایل طرح

`openclaw secrets apply --from <plan.json>` انتظار یک آرایه `targets` از اهداف طرح را دارد:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## درج/به‌روزرسانی و حذف‌های ارائه‌دهنده

طرح‌ها همچنین می‌توانند دو فیلد اختیاری در سطح بالا داشته باشند که نگاشت
`secrets.providers` را همراه با نوشتن‌های هر هدف تغییر می‌دهند:

- `providerUpserts` — شیئی که کلیدهای آن نام‌های مستعار ارائه‌دهنده هستند. هر مقدار یک
  تعریف ارائه‌دهنده است (همان شکلی که زیر
  `secrets.providers.<alias>` در `openclaw.json` پذیرفته می‌شود، برای مثال یک ارائه‌دهنده
  `exec` یا `file`).
- `providerDeletes` — آرایه‌ای از نام‌های مستعار ارائه‌دهنده برای حذف.

`providerUpserts` پیش از `targets` اجرا می‌شود، بنابراین یک `target.ref.provider` می‌تواند
به نام مستعار ارائه‌دهنده‌ای اشاره کند که همان طرح در
`providerUpserts` معرفی می‌کند. بدون این، طرح‌هایی که به نام مستعاری اشاره می‌کنند که هنوز
در `openclaw.json` پیکربندی نشده است، با `provider "<alias>" is not
configured` شکست می‌خورند.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

ارائه‌دهنده‌های Exec که از طریق `providerUpserts` معرفی می‌شوند همچنان مشمول
قواعد رضایت exec در [رفتار رضایت ارائه‌دهنده Exec](#exec-provider-consent-behavior) هستند:
طرح‌هایی که شامل ارائه‌دهنده‌های exec هستند در حالت نوشتن به `--allow-exec` نیاز دارند.

## محدوده هدف پشتیبانی‌شده

اهداف طرح برای مسیرهای اعتبارنامه پشتیبانی‌شده در موارد زیر پذیرفته می‌شوند:

- [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)

## رفتار نوع هدف

قاعده کلی:

- `target.type` باید شناخته‌شده باشد و باید با شکل نرمال‌شده `target.path` مطابقت داشته باشد.

نام‌های مستعار سازگاری برای طرح‌های موجود همچنان پذیرفته می‌شوند:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## قواعد اعتبارسنجی مسیر

هر هدف با همه موارد زیر اعتبارسنجی می‌شود:

- `type` باید یک نوع هدف شناخته‌شده باشد.
- `path` باید یک مسیر نقطه‌ای غیرخالی باشد.
- `pathSegments` می‌تواند حذف شود. اگر ارائه شود، باید دقیقاً به همان مسیر `path` نرمال شود.
- بخش‌های ممنوع رد می‌شوند: `__proto__`، `prototype`، `constructor`.
- مسیر نرمال‌شده باید با شکل مسیر ثبت‌شده برای نوع هدف مطابقت داشته باشد.
- اگر `providerId` یا `accountId` تنظیم شده باشد، باید با شناسه کدگذاری‌شده در مسیر مطابقت داشته باشد.
- اهداف `auth-profiles.json` به `agentId` نیاز دارند.
- هنگام ایجاد نگاشت جدید `auth-profiles.json`، `authProfileProvider` را شامل کنید.

## رفتار شکست

اگر اعتبارسنجی یک هدف شکست بخورد، apply با خطایی مانند این خارج می‌شود:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

برای طرح نامعتبر، هیچ نوشتنی ثبت نمی‌شود.

## رفتار رضایت ارائه‌دهنده Exec

- `--dry-run` به‌صورت پیش‌فرض بررسی‌های SecretRef از نوع exec را رد می‌کند.
- طرح‌هایی که شامل SecretRefها/ارائه‌دهنده‌های exec هستند، در حالت نوشتن رد می‌شوند مگر اینکه `--allow-exec` تنظیم شده باشد.
- هنگام اعتبارسنجی/اعمال طرح‌هایی که شامل exec هستند، در هر دو فرمان dry-run و نوشتن، `--allow-exec` را ارسال کنید.

## نکات محدوده زمان اجرا و ممیزی

- ورودی‌های فقط‌ارجاعی `auth-profiles.json` (`keyRef`/`tokenRef`) در حل‌وفصل زمان اجرا و پوشش ممیزی گنجانده می‌شوند.
- `secrets apply` اهداف پشتیبانی‌شده `openclaw.json`، اهداف پشتیبانی‌شده `auth-profiles.json`، و اهداف اختیاری پاک‌سازی را می‌نویسد.

## بررسی‌های اپراتور

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

اگر apply با پیام مسیر هدف نامعتبر شکست خورد، طرح را با `openclaw secrets configure` دوباره تولید کنید یا مسیر هدف را به یکی از شکل‌های پشتیبانی‌شده بالا اصلاح کنید.

## مستندات مرتبط

- [مدیریت اسرار](/fa/gateway/secrets)
- [CLI `secrets`](/fa/cli/secrets)
- [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
