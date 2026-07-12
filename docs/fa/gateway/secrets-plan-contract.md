---
read_when:
    - تولید یا بازبینی طرح‌های `openclaw secrets apply`
    - اشکال‌زدایی خطاهای `Invalid plan target path`
    - درک رفتار اعتبارسنجی نوع و مسیر مقصد
summary: 'قرارداد برای طرح‌های `secrets apply`: اعتبارسنجی هدف، تطبیق مسیر و دامنهٔ هدف `auth-profiles.json`'
title: قرارداد طرح اعمال اسرار
x-i18n:
    generated_at: "2026-07-12T10:06:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

این صفحه قرارداد سخت‌گیرانه‌ای را تعریف می‌کند که توسط `openclaw secrets apply` اعمال می‌شود. اگر هدفی با این قواعد مطابقت نداشته باشد، عملیات اعمال پیش از تغییر هرگونه فایل شکست می‌خورد.

## ساختار فایل طرح

`openclaw secrets apply --from <plan.json>` انتظار آرایه‌ای از اهداف طرح با نام `targets` را دارد:

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

`openclaw secrets configure` طرح‌هایی با این ساختار تولید می‌کند. همچنین می‌توانید طرحی را به‌صورت دستی بنویسید یا ویرایش کنید.

## درج یا به‌روزرسانی و حذف ارائه‌دهندگان

طرح‌ها همچنین می‌توانند شامل دو فیلد اختیاری در سطح بالا باشند که نگاشت `secrets.providers` را هم‌زمان با نوشتن هر هدف تغییر می‌دهند:

- `providerUpserts` -- شیئی که کلیدهای آن نام‌های مستعار ارائه‌دهندگان هستند. هر مقدار، تعریف یک ارائه‌دهنده است؛ با همان ساختاری که در `secrets.providers.<alias>` در `openclaw.json` پذیرفته می‌شود، برای مثال ارائه‌دهنده‌ای از نوع `exec` یا `file`.
- `providerDeletes` -- آرایه‌ای از نام‌های مستعار ارائه‌دهندگان که باید حذف شوند.

`providerUpserts` پیش از `targets` اجرا می‌شود؛ بنابراین `target.ref.provider` می‌تواند به نام مستعار ارائه‌دهنده‌ای ارجاع دهد که همان طرح آن را در `providerUpserts` معرفی می‌کند. بدون این ترتیب، طرح‌هایی که به نام مستعاری ارجاع می‌دهند که هنوز در `openclaw.json` پیکربندی نشده است، با خطای `provider "<alias>" is not configured` شکست می‌خورند.

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

ارائه‌دهندگان `exec` که از طریق `providerUpserts` معرفی می‌شوند، همچنان مشمول قواعد رضایت اجرای دستور در [رفتار رضایت ارائه‌دهنده Exec](#exec-provider-consent-behavior) هستند: طرح‌های شامل ارائه‌دهندگان `exec` در حالت نوشتن به `--allow-exec` نیاز دارند.

## دامنه اهداف پشتیبانی‌شده

اهداف طرح برای مسیرهای اعتبارنامه پشتیبانی‌شده در [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) پذیرفته می‌شوند.

## رفتار نوع هدف

`target.type` باید نوع هدفی شناخته‌شده باشد و `target.path` نرمال‌شده باید با ساختار مسیر ثبت‌شده آن نوع مطابقت داشته باشد.

برخی انواع هدف، علاوه بر نام نوع معیار خود، برای طرح‌های موجود یک نام مستعار سازگاری را نیز به‌عنوان `target.type` می‌پذیرند:

| نوع معیار                              | نام مستعار پذیرفته‌شده                           |
| -------------------------------------- | ------------------------------------------------ |
| `models.providers.apiKey`              | `models.providers.*.apiKey`                      |
| `skills.entries.apiKey`                | `skills.entries.*.apiKey`                        |
| `channels.googlechat.serviceAccount`   | `channels.googlechat.accounts.*.serviceAccount`  |

## قواعد اعتبارسنجی مسیر

هر هدف با تمام قواعد زیر اعتبارسنجی می‌شود:

- `type` باید نوع هدفی شناخته‌شده باشد.
- `path` باید مسیری نقطه‌ای و غیرخالی باشد.
- `pathSegments` را می‌توان حذف کرد. در صورت ارائه، باید دقیقاً به همان مسیر `path` نرمال شود.
- بخش‌های ممنوع رد می‌شوند: `__proto__`، `prototype`، `constructor`.
- مسیر نرمال‌شده باید با ساختار مسیر ثبت‌شده برای نوع هدف مطابقت داشته باشد.
- اگر `providerId` یا `accountId` تنظیم شده باشد، باید با شناسه رمزگذاری‌شده در مسیر مطابقت داشته باشد.
- اهداف `auth-profiles.json` به `agentId` نیاز دارند.
- هنگام ایجاد نگاشت جدید `auth-profiles.json`، `authProfileProvider` را درج کنید.

## رفتار هنگام شکست

اگر اعتبارسنجی هدفی شکست بخورد، عملیات اعمال با خطایی مانند نمونه زیر خاتمه می‌یابد:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

برای طرح نامعتبر هیچ نوشتنی ثبت نمی‌شود: تفکیک اهداف و اعتبارسنجی مسیر پیش از دست‌کاری هر فایل اجرا می‌شوند. جدا از این، پس از آغاز نوشتن یک طرح معتبر، عملیات اعمال ابتدا از هر فایل دست‌کاری‌شده یک تصویر لحظه‌ای تهیه می‌کند و اگر نوشتن بعدی در همان اجرا شکست بخورد، آن تصاویر را بازیابی می‌کند؛ بنابراین نوشتن ناقص هرگز وضعیت پیکربندی، نمایه احراز هویت یا متغیرهای محیطی را ناهماهنگ باقی نمی‌گذارد.

## رفتار رضایت ارائه‌دهنده Exec

- `--dry-run` به‌طور پیش‌فرض بررسی‌های SecretRef از نوع `exec` را نادیده می‌گیرد.
- طرح‌های شامل SecretRefها یا ارائه‌دهندگان `exec` در حالت نوشتن رد می‌شوند، مگر اینکه `--allow-exec` تنظیم شده باشد.
- هنگام اعتبارسنجی یا اعمال طرح‌های شامل `exec`، گزینه `--allow-exec` را هم در فرمان اجرای آزمایشی و هم در فرمان نوشتن وارد کنید.

## نکات دامنه زمان اجرا و ممیزی

- ورودی‌های صرفاً ارجاعی `auth-profiles.json`، یعنی `keyRef`/`tokenRef`، در تفکیک اعتبارنامه زمان اجرا و پوشش ممیزی گنجانده می‌شوند.
- `secrets apply` اهداف پشتیبانی‌شده `openclaw.json`، اهداف پشتیبانی‌شده `auth-profiles.json` و سه مرحله پاک‌سازی اختیاری را می‌نویسد که هرکدام به‌طور پیش‌فرض فعال‌اند: `scrubEnv` (مقادیر متن ساده منتقل‌شده را از `.env` حذف می‌کند)، `scrubAuthProfilesForProviderTargets` (باقی‌مانده‌های متن ساده یا ارجاع‌های استفاده‌نشده را در `auth-profiles.json` برای ارائه‌دهندگانی که طرح به‌تازگی منتقل کرده است پاک می‌کند) و `scrubLegacyAuthJson` (ورودی‌های منتقل‌شده `api_key` را از مخازن قدیمی `auth.json` حذف می‌کند). برای رد کردن هر مرحله، مقدار متناظر `options.scrubEnv`، `options.scrubAuthProfilesForProviderTargets` یا `options.scrubLegacyAuthJson` را در طرح روی `false` تنظیم کنید.

## بررسی‌های راهبر

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

اگر عملیات اعمال با پیام مسیر هدف نامعتبر شکست خورد، طرح را با `openclaw secrets configure` دوباره تولید کنید یا مسیر هدف را به یکی از ساختارهای پشتیبانی‌شده بالا اصلاح کنید.

## مستندات مرتبط

- [مدیریت اسرار](/fa/gateway/secrets)
- [CLI ‏`secrets`](/fa/cli/secrets)
- [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface)
- [مرجع پیکربندی](/fa/gateway/configuration-reference)
