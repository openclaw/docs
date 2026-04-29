---
read_when:
    - حل مجدد ارجاع‌های محرمانه در زمان اجرا
    - ممیزی بقایای متن آشکار و ارجاع‌های حل‌نشده
    - پیکربندی SecretRefs و اعمال تغییرات پاک‌سازی یک‌طرفه
summary: مرجع CLI برای `openclaw secrets` (reload، audit، configure، apply)
title: رازها
x-i18n:
    generated_at: "2026-04-29T22:38:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

از `openclaw secrets` برای مدیریت SecretRefها و سالم نگه داشتن snapshot فعال runtime استفاده کنید.

نقش‌های فرمان:

- `reload`: RPC مربوط به Gateway (`secrets.reload`) که refها را دوباره resolve می‌کند و snapshot runtime را فقط در صورت موفقیت کامل جایگزین می‌کند (بدون نوشتن پیکربندی).
- `audit`: اسکن فقط‌خواندنی storeهای پیکربندی/auth/generated-model و باقی‌مانده‌های legacy برای plaintext، refهای resolveنشده، و drift در precedence (refهای exec نادیده گرفته می‌شوند مگر اینکه `--allow-exec` تنظیم شده باشد).
- `configure`: برنامه‌ریز تعاملی برای راه‌اندازی provider، نگاشت target، و preflight (TTY لازم است).
- `apply`: اجرای یک plan ذخیره‌شده (`--dry-run` فقط برای اعتبارسنجی؛ dry-run به‌صورت پیش‌فرض بررسی‌های exec را نادیده می‌گیرد، و حالت write planهای دارای exec را رد می‌کند مگر اینکه `--allow-exec` تنظیم شده باشد)، سپس پاک‌سازی باقی‌مانده‌های plaintext هدف‌گذاری‌شده.

چرخه پیشنهادی برای operator:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

اگر plan شما شامل SecretRefها/providerهای `exec` است، در هر دو فرمان dry-run و write apply گزینه `--allow-exec` را ارسال کنید.

نکته exit code برای CI/gateها:

- `audit --check` در صورت وجود یافته‌ها `1` برمی‌گرداند.
- refهای resolveنشده `2` برمی‌گردانند.

مرتبط:

- راهنمای Secrets: [مدیریت Secrets](/fa/gateway/secrets)
- سطح credential: [سطح Credential مربوط به SecretRef](/fa/reference/secretref-credential-surface)
- راهنمای امنیت: [امنیت](/fa/gateway/security)

## بارگذاری دوباره snapshot runtime

refهای secret را دوباره resolve کنید و snapshot runtime را به‌صورت اتمی جایگزین کنید.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

نکته‌ها:

- از متد RPC مربوط به Gateway با نام `secrets.reload` استفاده می‌کند.
- اگر resolution شکست بخورد، Gateway آخرین snapshot سالم شناخته‌شده را نگه می‌دارد و خطا برمی‌گرداند (بدون فعال‌سازی جزئی).
- پاسخ JSON شامل `warningCount` است.

گزینه‌ها:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audit

وضعیت OpenClaw را برای موارد زیر اسکن کنید:

- ذخیره‌سازی secret به‌صورت plaintext
- refهای resolveنشده
- drift در precedence (credentialهای `auth-profiles.json` که refهای `openclaw.json` را shadow می‌کنند)
- باقی‌مانده‌های `agents/*/agent/models.json` تولیدشده (مقادیر `apiKey` برای provider و headerهای حساس provider)
- باقی‌مانده‌های legacy (ورودی‌های store قدیمی auth، یادآورهای OAuth)

نکته درباره باقی‌مانده header:

- تشخیص header حساس provider بر پایه heuristic نام است (نام‌ها و قطعه‌های رایج header مربوط به auth/credential مانند `authorization`، `x-api-key`، `token`، `secret`، `password`، و `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

رفتار exit:

- `--check` در صورت وجود یافته‌ها با مقدار غیرصفر خارج می‌شود.
- refهای resolveنشده با کد غیرصفر دارای اولویت بالاتر خارج می‌شوند.

نکات برجسته شکل گزارش:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- کدهای یافته:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (helper تعاملی)

تغییرات provider و SecretRef را به‌صورت تعاملی بسازید، preflight را اجرا کنید، و در صورت نیاز apply کنید:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

جریان:

- ابتدا راه‌اندازی provider (`add/edit/remove` برای aliasهای `secrets.providers`).
- سپس نگاشت credential (انتخاب fieldها و تخصیص refهای `{source, provider, id}`).
- در پایان preflight و apply اختیاری.

flagها:

- `--providers-only`: فقط `secrets.providers` را configure کنید و نگاشت credential را نادیده بگیرید.
- `--skip-provider-setup`: راه‌اندازی provider را نادیده بگیرید و credentialها را به providerهای موجود نگاشت کنید.
- `--agent <id>`: کشف target و نوشتن در `auth-profiles.json` را به یک store agent محدود کنید.
- `--allow-exec`: بررسی‌های exec SecretRef را هنگام preflight/apply مجاز کنید (ممکن است فرمان‌های provider اجرا شوند).

نکته‌ها:

- به TTY تعاملی نیاز دارد.
- نمی‌توانید `--providers-only` را با `--skip-provider-setup` ترکیب کنید.
- `configure` fieldهای دارای secret در `openclaw.json` به‌همراه `auth-profiles.json` را برای scope agent انتخاب‌شده هدف می‌گیرد.
- `configure` از ساخت مستقیم نگاشت‌های جدید `auth-profiles.json` در جریان picker پشتیبانی می‌کند.
- سطح canonical پشتیبانی‌شده: [سطح Credential مربوط به SecretRef](/fa/reference/secretref-credential-surface).
- پیش از apply، preflight resolution را انجام می‌دهد.
- اگر preflight/apply شامل refهای exec است، `--allow-exec` را برای هر دو مرحله تنظیم‌شده نگه دارید.
- planهای تولیدشده به‌صورت پیش‌فرض گزینه‌های scrub را فعال دارند (`scrubEnv`، `scrubAuthProfilesForProviderTargets`، `scrubLegacyAuthJson` همگی فعال هستند).
- مسیر apply برای مقادیر plaintext پاک‌سازی‌شده یک‌طرفه است.
- بدون `--apply`، CLI پس از preflight همچنان `Apply this plan now?` را prompt می‌کند.
- با `--apply` (و بدون `--yes`)، CLI یک confirmation برگشت‌ناپذیر اضافی prompt می‌کند.
- `--json` plan و گزارش preflight را چاپ می‌کند، اما فرمان همچنان به TTY تعاملی نیاز دارد.

نکته ایمنی provider نوع exec:

- نصب‌های Homebrew اغلب binaryهای symlinkشده را زیر `/opt/homebrew/bin/*` عرضه می‌کنند.
- `allowSymlinkCommand: true` را فقط زمانی تنظیم کنید که برای مسیرهای مورد اعتماد package-manager لازم است، و آن را با `trustedDirs` همراه کنید (برای مثال `["/opt/homebrew"]`).
- در Windows، اگر verification مربوط به ACL برای مسیر provider در دسترس نباشد، OpenClaw به‌شکل fail-closed عمل می‌کند. فقط برای مسیرهای مورد اعتماد، روی آن provider گزینه `allowInsecurePath: true` را تنظیم کنید تا بررسی‌های امنیت مسیر bypass شوند.

## Apply کردن یک plan ذخیره‌شده

plan تولیدشده قبلی را apply یا preflight کنید:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

رفتار exec:

- `--dry-run` بدون نوشتن fileها، preflight را اعتبارسنجی می‌کند.
- بررسی‌های exec SecretRef به‌صورت پیش‌فرض در dry-run نادیده گرفته می‌شوند.
- حالت write، planهایی را که شامل SecretRefها/providerهای exec هستند رد می‌کند مگر اینکه `--allow-exec` تنظیم شده باشد.
- برای opt in به بررسی/اجرای provider نوع exec در هر یک از دو حالت، از `--allow-exec` استفاده کنید.

جزئیات contract مربوط به plan (مسیرهای target مجاز، قواعد اعتبارسنجی، و semantics شکست):

- [Contract مربوط به Secrets Apply Plan](/fa/gateway/secrets-plan-contract)

مواردی که `apply` ممکن است به‌روزرسانی کند:

- `openclaw.json` (targetهای SecretRef + upsert/delete کردن provider)
- `auth-profiles.json` (scrub کردن provider-target)
- باقی‌مانده‌های legacy `auth.json`
- کلیدهای secret شناخته‌شده در `~/.openclaw/.env` که مقدارهایشان migrate شده‌اند

## چرا backup برای rollback وجود ندارد

`secrets apply` عمدا rollback backupهایی که شامل مقدارهای plaintext قدیمی باشند نمی‌نویسد.

ایمنی از preflight سخت‌گیرانه + apply تقریبا اتمی با restore درون‌حافظه‌ای best-effort هنگام شکست به دست می‌آید.

## مثال

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

اگر `audit --check` همچنان یافته‌های plaintext گزارش می‌کند، مسیرهای target گزارش‌شده باقی‌مانده را به‌روزرسانی کنید و audit را دوباره اجرا کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [مدیریت Secrets](/fa/gateway/secrets)
