---
read_when:
    - حل مجدد ارجاع‌های اسرار در زمان اجرا
    - ممیزی بقایای متن ساده و ارجاع‌های حل‌نشده
    - پیکربندی SecretRefها و اعمال تغییرات پاک‌سازی یک‌طرفه
summary: مرجع CLI برای `openclaw secrets` (بارگذاری مجدد، ممیزی، پیکربندی، اعمال)
title: اسرار
x-i18n:
    generated_at: "2026-07-12T09:46:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

SecretRefها را مدیریت کنید و اسنپ‌شات فعال زمان اجرا را سالم نگه دارید.

| فرمان       | نقش                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC مربوط به Gateway (`secrets.reload`): ارجاع‌ها را دوباره تفکیک می‌کند و فقط در صورت موفقیت کامل، اسنپ‌شات زمان اجرا را جایگزین می‌کند (بدون نوشتن پیکربندی)                                      |
| `audit`     | اسکن فقط‌خواندنی مخازن پیکربندی/احراز هویت/مدل‌های تولیدشده و بقایای قدیمی برای یافتن متن ساده، ارجاع‌های تفکیک‌نشده و انحراف تقدم (ارجاع‌های `exec` نادیده گرفته می‌شوند، مگر با `--allow-exec`) |
| `configure` | برنامه‌ریز تعاملی برای راه‌اندازی ارائه‌دهنده، نگاشت مقصد و بررسی پیش از اجرا (نیازمند TTY)                                                                                                         |
| `apply`     | یک برنامه ذخیره‌شده را اجرا می‌کند (`--dry-run` فقط اعتبارسنجی می‌کند و به‌طور پیش‌فرض بررسی‌های `exec` را نادیده می‌گیرد؛ حالت نوشتن برنامه‌های دارای `exec` را بدون `--allow-exec` رد می‌کند)، سپس بقایای متن ساده هدف‌گذاری‌شده را پاک‌سازی می‌کند |

چرخه پیشنهادی برای اپراتور:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

اگر برنامه شما شامل SecretRefها/ارائه‌دهندگان `exec` است، در هر دو فرمان `apply` برای اجرای آزمایشی و نوشتن، `--allow-exec` را وارد کنید.

کدهای خروج برای CI/دروازه‌ها:

- `audit --check` در صورت وجود یافته، `1` برمی‌گرداند.
- ارجاع‌های تفکیک‌نشده، صرف‌نظر از `--check`، مقدار `2` را برمی‌گردانند.

مرتبط: [مدیریت اسرار](/fa/gateway/secrets) · [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) · [امنیت](/fa/gateway/security)

## بارگذاری مجدد اسنپ‌شات زمان اجرا

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

از متد RPC مربوط به Gateway با نام `secrets.reload` استفاده می‌کند. اگر تفکیک ناموفق باشد، Gateway آخرین اسنپ‌شات سالم شناخته‌شده خود را نگه می‌دارد و خطا برمی‌گرداند (بدون فعال‌سازی جزئی). پاسخ JSON شامل `warningCount` است.

گزینه‌ها: `--url <url>`، `--token <token>`، `--timeout <ms>`، `--json`.

## ممیزی

وضعیت OpenClaw را برای موارد زیر اسکن می‌کند:

- ذخیره‌سازی اسرار به‌صورت متن ساده
- ارجاع‌های تفکیک‌نشده
- انحراف تقدم (اعتبارنامه‌های `auth-profiles.json` که ارجاع‌های `openclaw.json` را تحت‌الشعاع قرار می‌دهند)
- بقایای تولیدشده در `agents/*/agent/models.json` (مقادیر `apiKey` ارائه‌دهنده و سرآیندهای حساس ارائه‌دهنده)
- بقایای قدیمی (ورودی‌های مخزن احراز هویت قدیمی، یادآوری‌های OAuth)

تشخیص سرآیند حساس ارائه‌دهنده بر ابتکار اکتشافی نام استوار است: سرآیندهایی را علامت‌گذاری می‌کند که نامشان با بخش‌های رایج احراز هویت/اعتبارنامه (`authorization`، `x-api-key`، `token`، `secret`، `password`، `credential`) مطابقت دارد.

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

ساختار گزارش:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`، `skippedExecRefs`، `resolvabilityComplete`
- `summary`: `plaintextCount`، `unresolvedRefCount`، `shadowedRefCount`، `legacyResidueCount`
- کدهای یافته: `PLAINTEXT_FOUND`، `REF_UNRESOLVED`، `REF_SHADOWED`، `LEGACY_RESIDUE`

## پیکربندی (دستیار تعاملی)

تغییرات ارائه‌دهنده و SecretRef را به‌صورت تعاملی ایجاد کنید، بررسی پیش از اجرا را انجام دهید و در صورت تمایل اعمال کنید:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

روند: ابتدا راه‌اندازی ارائه‌دهنده (افزودن/ویرایش/حذف نام‌های مستعار `secrets.providers`)، سپس نگاشت اعتبارنامه (انتخاب فیلدها و تخصیص ارجاع‌های `{source, provider, id}`)، و پس از آن بررسی پیش از اجرا و اعمال اختیاری.

پرچم‌ها:

- `--providers-only`: فقط `secrets.providers` را پیکربندی می‌کند و از نگاشت اعتبارنامه صرف‌نظر می‌کند
- `--skip-provider-setup`: راه‌اندازی ارائه‌دهنده را نادیده می‌گیرد و اعتبارنامه‌ها را به ارائه‌دهندگان موجود نگاشت می‌کند
- `--agent <id>`: کشف مقصد و نوشتن `auth-profiles.json` را به مخزن یک عامل محدود می‌کند
- `--allow-exec`: بررسی SecretRefهای `exec` را هنگام بررسی پیش از اجرا/اعمال مجاز می‌کند (ممکن است فرمان‌های ارائه‌دهنده را اجرا کند)

`--providers-only` و `--skip-provider-setup` را نمی‌توان با هم استفاده کرد.

نکات:

- به یک TTY تعاملی نیاز دارد.
- فیلدهای حاوی اسرار در `openclaw.json` و همچنین `auth-profiles.json` را برای محدوده عامل انتخاب‌شده هدف قرار می‌دهد؛ سطح متعارف پشتیبانی‌شده: [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface).
- از ایجاد مستقیم نگاشت‌های جدید `auth-profiles.json` در روند انتخاب‌گر پشتیبانی می‌کند.
- پیش از اعمال، تفکیک پیش از اجرا را انجام می‌دهد.
- گزینه‌های پاک‌سازی در برنامه‌های تولیدشده به‌طور پیش‌فرض فعال هستند (`scrubEnv`، `scrubAuthProfilesForProviderTargets`، `scrubLegacyAuthJson`). اعمال برای مقادیر متن ساده پاک‌سازی‌شده برگشت‌ناپذیر است.
- بدون `--apply`، CLI همچنان پس از بررسی پیش از اجرا پیام `Apply this plan now?` را نمایش می‌دهد.
- با `--apply` (و بدون `--yes`)، CLI یک تأیید اضافی برای مهاجرت برگشت‌ناپذیر درخواست می‌کند.
- `--json` برنامه و گزارش بررسی پیش از اجرا را چاپ می‌کند، اما همچنان به یک TTY تعاملی نیاز دارد.

### ایمنی ارائه‌دهنده Exec

نصب‌های Homebrew اغلب فایل‌های اجرایی دارای پیوند نمادین را زیر `/opt/homebrew/bin/*` ارائه می‌کنند. فقط در صورت نیاز برای مسیرهای مورداعتماد مدیر بسته، `allowSymlinkCommand: true` را تنظیم کنید و آن را همراه با `trustedDirs` (برای مثال `["/opt/homebrew"]`) به‌کار ببرید. در Windows، اگر تأیید ACL برای مسیر ارائه‌دهنده در دسترس نباشد، OpenClaw به‌صورت بسته و امن شکست می‌خورد؛ فقط برای مسیرهای مورداعتماد، `allowInsecurePath: true` را روی آن ارائه‌دهنده تنظیم کنید تا بررسی امنیت مسیر دور زده شود.

## اعمال یک برنامه ذخیره‌شده

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` بررسی پیش از اجرا را بدون نوشتن فایل‌ها اعتبارسنجی می‌کند؛ بررسی SecretRefهای `exec` در اجرای آزمایشی به‌طور پیش‌فرض نادیده گرفته می‌شود. حالت نوشتن، برنامه‌های حاوی SecretRefها/ارائه‌دهندگان `exec` را بدون `--allow-exec` رد می‌کند. برای پذیرش بررسی/اجرای ارائه‌دهنده `exec` در هر یک از حالت‌ها، از `--allow-exec` استفاده کنید.

مواردی که `apply` ممکن است به‌روزرسانی کند:

- `openclaw.json` (مقصدهای SecretRef و درج/به‌روزرسانی یا حذف ارائه‌دهندگان)
- `auth-profiles.json` (پاک‌سازی مقصد ارائه‌دهنده)
- بقایای قدیمی `auth.json`
- کلیدهای شناخته‌شده اسرار در `~/.openclaw/.env` که مقادیرشان مهاجرت داده شده‌اند

جزئیات قرارداد برنامه (مسیرهای مقصد مجاز، قواعد اعتبارسنجی، معنای شکست): [قرارداد برنامه اعمال اسرار](/fa/gateway/secrets-plan-contract).

### چرا نسخه پشتیبان بازگردانی وجود ندارد

`secrets apply` عمداً نسخه‌های پشتیبان بازگردانی حاوی مقادیر قدیمی متن ساده ایجاد نمی‌کند. ایمنی از بررسی سخت‌گیرانه پیش از اجرا و اعمال تقریباً اتمی، همراه با بازیابی درون‌حافظه‌ای در حد توان هنگام شکست، تأمین می‌شود.

## مثال

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

اگر `audit --check` همچنان یافته‌های متن ساده را گزارش می‌کند، مسیرهای مقصد باقی‌مانده در گزارش را به‌روزرسانی کنید و ممیزی را دوباره اجرا کنید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [مدیریت اسرار](/fa/gateway/secrets)
- [SecretRefهای Vault](/plugins/vault)
