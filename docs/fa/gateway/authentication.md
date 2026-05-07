---
read_when:
    - اشکال‌زدایی احراز هویت مدل یا انقضای OAuth
    - مستندسازی احراز هویت یا ذخیره‌سازی اعتبارنامه‌ها
summary: 'احراز هویت مدل: OAuth، کلیدهای API، استفادهٔ مجدد از Claude CLI، و setup-token Anthropic'
title: احراز هویت
x-i18n:
    generated_at: "2026-05-07T13:17:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
این صفحه مرجع احراز هویت **ارائه‌دهنده مدل** است (کلیدهای API، OAuth، استفاده دوباره از Claude CLI، و setup-token متعلق به Anthropic). برای احراز هویت **اتصال Gateway** (token، password، trusted-proxy)، [پیکربندی](/fa/gateway/configuration) و [احراز هویت پروکسی معتمد](/fa/gateway/trusted-proxy-auth) را ببینید.
</Note>

OpenClaw از OAuth و کلیدهای API برای ارائه‌دهندگان مدل پشتیبانی می‌کند. برای میزبان‌های Gateway همیشه روشن،
کلیدهای API معمولا قابل‌پیش‌بینی‌ترین گزینه هستند. جریان‌های اشتراک/OAuth
نیز زمانی پشتیبانی می‌شوند که با مدل حساب ارائه‌دهنده شما سازگار باشند.

برای جریان کامل OAuth و چیدمان ذخیره‌سازی،
[/concepts/oauth](/fa/concepts/oauth) را ببینید.
برای احراز هویت مبتنی بر SecretRef (ارائه‌دهندگان `env`/`file`/`exec`)، [مدیریت اسرار](/fa/gateway/secrets) را ببینید.
برای قواعد واجد شرایط بودن اعتبارنامه/کد دلیل که توسط `models status --probe` استفاده می‌شوند،
[معناشناسی اعتبارنامه‌های احراز هویت](/fa/auth-credential-semantics) را ببینید.

## راه‌اندازی پیشنهادی (کلید API، هر ارائه‌دهنده)

اگر یک Gateway بلندمدت اجرا می‌کنید، با یک کلید API برای ارائه‌دهنده انتخابی
خود شروع کنید.
به‌طور خاص برای Anthropic، احراز هویت با کلید API همچنان قابل‌پیش‌بینی‌ترین
راه‌اندازی سرور است، اما OpenClaw از استفاده دوباره از ورود محلی Claude CLI نیز پشتیبانی می‌کند.

1. در کنسول ارائه‌دهنده خود یک کلید API بسازید.
2. آن را روی **میزبان Gateway** (ماشینی که `openclaw gateway` را اجرا می‌کند) قرار دهید.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. اگر Gateway تحت systemd/launchd اجرا می‌شود، ترجیحا کلید را در
   `~/.openclaw/.env` قرار دهید تا daemon بتواند آن را بخواند:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

سپس daemon را بازراه‌اندازی کنید (یا فرایند Gateway خود را بازراه‌اندازی کنید) و دوباره بررسی کنید:

```bash
openclaw models status
openclaw doctor
```

اگر ترجیح می‌دهید env varها را خودتان مدیریت نکنید، onboarding می‌تواند
کلیدهای API را برای استفاده daemon ذخیره کند: `openclaw onboard`.

برای جزئیات مربوط به ارث‌بری env (`env.shellEnv`،
`~/.openclaw/.env`، systemd/launchd)، [راهنما](/fa/help) را ببینید.

## Anthropic: سازگاری Claude CLI و token

احراز هویت setup-token متعلق به Anthropic همچنان در OpenClaw به‌عنوان یک مسیر token
پشتیبانی‌شده در دسترس است. کارکنان Anthropic از آن زمان به ما گفته‌اند که استفاده از Claude CLI به سبک OpenClaw
دوباره مجاز است، بنابراین OpenClaw استفاده دوباره از Claude CLI و استفاده از `claude -p` را
برای این یکپارچه‌سازی مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند. وقتی
استفاده دوباره از Claude CLI روی میزبان در دسترس باشد، اکنون همان مسیر ترجیحی است.

برای میزبان‌های Gateway بلندمدت، کلید API متعلق به Anthropic همچنان قابل‌پیش‌بینی‌ترین
راه‌اندازی است. اگر می‌خواهید از ورود Claude موجود روی همان میزبان دوباره استفاده کنید، از مسیر
Anthropic Claude CLI در onboarding/configure استفاده کنید.

راه‌اندازی پیشنهادی میزبان برای استفاده دوباره از Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

این یک راه‌اندازی دومرحله‌ای است:

1. خود Claude Code را روی میزبان Gateway به Anthropic وارد کنید.
2. به OpenClaw بگویید انتخاب مدل Anthropic را به backend محلی `claude-cli`
   تغییر دهد و نمایه احراز هویت مطابق OpenClaw را ذخیره کند.

اگر `claude` در `PATH` نیست، ابتدا Claude Code را نصب کنید یا
`agents.defaults.cliBackends.claude-cli.command` را روی مسیر واقعی binary تنظیم کنید.

ورود دستی token (هر ارائه‌دهنده؛ `auth-profiles.json` را می‌نویسد و config را به‌روزرسانی می‌کند):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` فقط اعتبارنامه‌ها را ذخیره می‌کند. شکل متعارف این است:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw در زمان اجرا شکل متعارف `version` + `profiles` را انتظار دارد. اگر یک نصب قدیمی هنوز فایلی تخت مانند `{ "openrouter": { "apiKey": "..." } }` دارد، `openclaw doctor --fix` را اجرا کنید تا آن را به یک نمایه کلید API با نام `openrouter:default` بازنویسی کند؛ doctor یک کپی `.legacy-flat.*.bak` کنار فایل اصلی نگه می‌دارد. جزئیات endpoint مانند `baseUrl`، `api`، شناسه‌های مدل، headerها، و timeoutها باید زیر `models.providers.<id>` در `openclaw.json` یا `models.json` باشند، نه در `auth-profiles.json`.

مسیرهای احراز هویت خارجی مانند Bedrock `auth: "aws-sdk"` نیز اعتبارنامه نیستند. اگر یک مسیر نام‌دار Bedrock می‌خواهید، `auth.profiles.<id>.mode: "aws-sdk"` را در `openclaw.json` قرار دهید؛ `type: "aws-sdk"` را در `auth-profiles.json` ننویسید. `openclaw doctor --fix` نشانگرهای legacy AWS SDK را از ذخیره‌گاه اعتبارنامه به metadata پیکربندی منتقل می‌کند.

ارجاع‌های نمایه احراز هویت برای اعتبارنامه‌های static نیز پشتیبانی می‌شوند:

- اعتبارنامه‌های `api_key` می‌توانند از `keyRef: { source, provider, id }` استفاده کنند
- اعتبارنامه‌های `token` می‌توانند از `tokenRef: { source, provider, id }` استفاده کنند
- نمایه‌های حالت OAuth از اعتبارنامه‌های SecretRef پشتیبانی نمی‌کنند؛ اگر `auth.profiles.<id>.mode` روی `"oauth"` تنظیم شده باشد، ورودی `keyRef`/`tokenRef` پشتیبانی‌شده با SecretRef برای آن نمایه رد می‌شود.

بررسی مناسب برای خودکارسازی (خروج با `1` هنگام منقضی/ناموجود بودن، `2` هنگام نزدیک بودن انقضا):

```bash
openclaw models status --check
```

کاوش‌های زنده احراز هویت:

```bash
openclaw models status --probe
```

نکات:

- ردیف‌های probe می‌توانند از نمایه‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
- اگر `auth.order.<provider>` صریح یک نمایه ذخیره‌شده را حذف کند، probe برای آن نمایه
  به‌جای امتحان کردنش، `excluded_by_auth_order` را گزارش می‌کند.
- اگر احراز هویت وجود داشته باشد اما OpenClaw نتواند یک نامزد مدل قابل probe را برای
  آن ارائه‌دهنده resolve کند، probe مقدار `status: no_model` را گزارش می‌کند.
- cooldownهای rate-limit می‌توانند وابسته به مدل باشند. نمایه‌ای که برای یک
  مدل در cooldown است، همچنان می‌تواند برای یک مدل هم‌خانواده روی همان ارائه‌دهنده قابل استفاده باشد.

اسکریپت‌های اختیاری ops (systemd/Termux) اینجا مستند شده‌اند:
[اسکریپت‌های پایش احراز هویت](/fa/help/scripts#auth-monitoring-scripts)

## یادداشت Anthropic

backend متعلق به Anthropic با نام `claude-cli` دوباره پشتیبانی می‌شود.

- کارکنان Anthropic به ما گفته‌اند این مسیر یکپارچه‌سازی OpenClaw دوباره مجاز است.
- بنابراین OpenClaw استفاده دوباره از Claude CLI و استفاده از `claude -p` را
  برای اجراهای متکی بر Anthropic مجاز تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند.
- کلیدهای API متعلق به Anthropic همچنان قابل‌پیش‌بینی‌ترین انتخاب برای میزبان‌های Gateway
  بلندمدت و کنترل صریح صورتحساب سمت سرور هستند.

## بررسی وضعیت احراز هویت مدل

```bash
openclaw models status
openclaw doctor
```

## رفتار چرخش کلید API (Gateway)

برخی ارائه‌دهندگان از تلاش دوباره یک درخواست با کلیدهای جایگزین زمانی پشتیبانی می‌کنند که یک فراخوانی API
به rate limit ارائه‌دهنده برخورد کند.

- ترتیب اولویت:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (بازنویسی تکی)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- ارائه‌دهندگان Google همچنین `GOOGLE_API_KEY` را به‌عنوان fallback اضافی شامل می‌شوند.
- همان فهرست کلیدها پیش از استفاده deduplicate می‌شود.
- OpenClaw فقط برای خطاهای rate-limit با کلید بعدی دوباره تلاش می‌کند (برای مثال
  `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent
requests`، `ThrottlingException`، `concurrency limit reached`، یا
  `workers_ai ... quota limit exceeded`).
- خطاهای غیر rate-limit با کلیدهای جایگزین دوباره امتحان نمی‌شوند.
- اگر همه کلیدها شکست بخورند، خطای نهایی از آخرین تلاش برگردانده می‌شود.

## کنترل اینکه کدام اعتبارنامه استفاده شود

### برای هر نشست (فرمان chat)

از `/model <alias-or-id>@<profileId>` برای pin کردن یک اعتبارنامه ارائه‌دهنده مشخص برای نشست جاری استفاده کنید (نمونه شناسه‌های نمایه: `anthropic:default`، `anthropic:work`).

از `/model` (یا `/model list`) برای یک انتخاب‌گر فشرده استفاده کنید؛ از `/model status` برای نمای کامل استفاده کنید (نامزدها + نمایه احراز هویت بعدی، به‌همراه جزئیات endpoint ارائه‌دهنده وقتی پیکربندی شده باشد).

### برای هر agent (بازنویسی CLI)

یک بازنویسی صریح ترتیب نمایه احراز هویت برای یک agent تنظیم کنید (در `auth-state.json` همان agent ذخیره می‌شود):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

برای هدف گرفتن یک agent مشخص از `--agent <id>` استفاده کنید؛ آن را حذف کنید تا از agent پیش‌فرض پیکربندی‌شده استفاده شود.
وقتی مشکلات ترتیب را debug می‌کنید، `openclaw models status --probe` نمایه‌های ذخیره‌شده حذف‌شده را
به‌جای رد کردن بی‌صدا، به‌صورت `excluded_by_auth_order` نشان می‌دهد.
وقتی مشکلات cooldown را debug می‌کنید، به یاد داشته باشید که cooldownهای rate-limit می‌توانند
به یک شناسه مدل گره خورده باشند نه به کل نمایه ارائه‌دهنده.

## عیب‌یابی

### «هیچ اعتبارنامه‌ای پیدا نشد»

اگر نمایه Anthropic موجود نیست، یک کلید API متعلق به Anthropic را روی
**میزبان Gateway** پیکربندی کنید یا مسیر setup-token متعلق به Anthropic را راه‌اندازی کنید، سپس دوباره بررسی کنید:

```bash
openclaw models status
```

### Token در حال انقضا/منقضی شده

`openclaw models status` را اجرا کنید تا تایید شود کدام نمایه در حال انقضا است. اگر یک
نمایه token متعلق به Anthropic موجود نیست یا منقضی شده است، آن setup را از طریق
setup-token تازه‌سازی کنید یا به یک کلید API متعلق به Anthropic مهاجرت کنید.

## مرتبط

- [مدیریت اسرار](/fa/gateway/secrets)
- [دسترسی راه دور](/fa/gateway/remote)
- [ذخیره‌سازی احراز هویت](/fa/concepts/oauth)
