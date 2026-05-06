---
read_when:
    - اشکال‌زدایی احراز هویت مدل یا انقضای OAuth
    - مستندسازی احراز هویت یا ذخیره‌سازی اعتبارنامه‌ها
summary: 'احراز هویت مدل: OAuth، کلیدهای API، استفادهٔ مجدد از Claude CLI، و setup-token در Anthropic'
title: احراز هویت
x-i18n:
    generated_at: "2026-05-06T09:15:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
این صفحه مرجع احراز هویت **ارائه‌دهنده مدل** است (کلیدهای API، OAuth، استفاده مجدد از Claude CLI، و توکن راه‌اندازی Anthropic). برای احراز هویت **اتصال Gateway** (توکن، گذرواژه، پروکسی مورد اعتماد)، [پیکربندی](/fa/gateway/configuration) و [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth) را ببینید.
</Note>

OpenClaw از OAuth و کلیدهای API برای ارائه‌دهندگان مدل پشتیبانی می‌کند. برای میزبان‌های Gateway
همیشه‌روشن، کلیدهای API معمولا قابل‌پیش‌بینی‌ترین گزینه هستند. جریان‌های اشتراک/OAuth
نیز وقتی با مدل حساب ارائه‌دهنده شما سازگار باشند پشتیبانی می‌شوند.

برای جریان کامل OAuth و چیدمان ذخیره‌سازی، [/concepts/oauth](/fa/concepts/oauth) را ببینید.
برای احراز هویت مبتنی بر SecretRef (ارائه‌دهندگان `env`/`file`/`exec`)، [مدیریت اسرار](/fa/gateway/secrets) را ببینید.
برای قواعد واجد شرایط بودن اعتبارنامه/کد دلیل که توسط `models status --probe` استفاده می‌شوند، ببینید
[معناشناسی اعتبارنامه احراز هویت](/fa/auth-credential-semantics).

## راه‌اندازی پیشنهادی (کلید API، هر ارائه‌دهنده)

اگر یک Gateway بلندمدت اجرا می‌کنید، با یک کلید API برای ارائه‌دهنده انتخابی خود
شروع کنید.
به‌طور خاص برای Anthropic، احراز هویت با کلید API همچنان قابل‌پیش‌بینی‌ترین راه‌اندازی سرور
است، اما OpenClaw از استفاده مجدد از ورود محلی Claude CLI نیز پشتیبانی می‌کند.

1. در کنسول ارائه‌دهنده خود یک کلید API بسازید.
2. آن را روی **میزبان Gateway** (دستگاهی که `openclaw gateway` را اجرا می‌کند) قرار دهید.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. اگر Gateway زیر systemd/launchd اجرا می‌شود، بهتر است کلید را در
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

اگر ترجیح می‌دهید خودتان env vars را مدیریت نکنید، onboarding می‌تواند
کلیدهای API را برای استفاده daemon ذخیره کند: `openclaw onboard`.

برای جزئیات درباره ارث‌بری env (`env.shellEnv`،
`~/.openclaw/.env`، systemd/launchd)، [راهنما](/fa/help) را ببینید.

## Anthropic: سازگاری Claude CLI و توکن

احراز هویت توکن راه‌اندازی Anthropic همچنان به‌عنوان یک مسیر توکن پشتیبانی‌شده
در OpenClaw در دسترس است. کارکنان Anthropic از آن زمان به ما گفته‌اند که استفاده از Claude CLI به سبک OpenClaw
دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را
برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند. وقتی
استفاده مجدد از Claude CLI روی میزبان در دسترس باشد، اکنون مسیر ترجیحی همین است.

برای میزبان‌های Gateway بلندمدت، کلید API Anthropic همچنان قابل‌پیش‌بینی‌ترین
راه‌اندازی است. اگر می‌خواهید از ورود Claude موجود روی همان میزبان دوباره استفاده کنید، از مسیر
Anthropic Claude CLI در onboarding/configure استفاده کنید.

راه‌اندازی پیشنهادی میزبان برای استفاده مجدد از Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

این یک راه‌اندازی دو مرحله‌ای است:

1. خود Claude Code را روی میزبان Gateway وارد Anthropic کنید.
2. به OpenClaw بگویید انتخاب مدل Anthropic را به backend محلی `claude-cli`
   تغییر دهد و پروفایل احراز هویت متناظر OpenClaw را ذخیره کند.

اگر `claude` در `PATH` نیست، ابتدا Claude Code را نصب کنید یا
`agents.defaults.cliBackends.claude-cli.command` را روی مسیر واقعی فایل اجرایی تنظیم کنید.

ورود دستی توکن (هر ارائه‌دهنده؛ `auth-profiles.json` را می‌نویسد و پیکربندی را به‌روزرسانی می‌کند):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` فقط اعتبارنامه‌ها را ذخیره می‌کند. شکل canonical این است:

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

OpenClaw در زمان اجرا انتظار شکل canonical شامل `version` + `profiles` را دارد. اگر یک نصب قدیمی‌تر هنوز فایلی تخت مانند `{ "openrouter": { "apiKey": "..." } }` دارد، `openclaw doctor --fix` را اجرا کنید تا آن را به‌عنوان یک پروفایل کلید API به شکل `openrouter:default` بازنویسی کند؛ doctor یک کپی `.legacy-flat.*.bak` کنار فایل اصلی نگه می‌دارد. جزئیات endpoint مانند `baseUrl`، `api`، شناسه‌های مدل، headers و timeouts باید زیر `models.providers.<id>` در `openclaw.json` یا `models.json` باشند، نه در `auth-profiles.json`.

ارجاع‌های پروفایل احراز هویت برای اعتبارنامه‌های ایستا نیز پشتیبانی می‌شوند:

- اعتبارنامه‌های `api_key` می‌توانند از `keyRef: { source, provider, id }` استفاده کنند
- اعتبارنامه‌های `token` می‌توانند از `tokenRef: { source, provider, id }` استفاده کنند
- پروفایل‌های حالت OAuth از اعتبارنامه‌های SecretRef پشتیبانی نمی‌کنند؛ اگر `auth.profiles.<id>.mode` روی `"oauth"` تنظیم شده باشد، ورودی `keyRef`/`tokenRef` متکی بر SecretRef برای آن پروفایل رد می‌شود.

بررسی سازگار با اتوماسیون (خروج با `1` هنگام منقضی/مفقود بودن، `2` هنگام نزدیک بودن انقضا):

```bash
openclaw models status --check
```

پروب‌های زنده احراز هویت:

```bash
openclaw models status --probe
```

نکات:

- ردیف‌های پروب می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
- اگر `auth.order.<provider>` صریحا یک پروفایل ذخیره‌شده را حذف کند، پروب برای آن پروفایل
  به‌جای تلاش برای آن، `excluded_by_auth_order` را گزارش می‌کند.
- اگر احراز هویت وجود داشته باشد اما OpenClaw نتواند یک نامزد مدل قابل پروب برای
  آن ارائه‌دهنده resolve کند، پروب `status: no_model` را گزارش می‌کند.
- cooldownهای rate-limit می‌توانند در سطح مدل باشند. پروفایلی که برای یک
  مدل در cooldown است همچنان ممکن است برای مدل هم‌خانواده روی همان ارائه‌دهنده قابل استفاده باشد.

اسکریپت‌های عملیاتی اختیاری (systemd/Termux) اینجا مستند شده‌اند:
[اسکریپت‌های پایش احراز هویت](/fa/help/scripts#auth-monitoring-scripts)

## یادداشت Anthropic

backend مربوط به `claude-cli` در Anthropic دوباره پشتیبانی می‌شود.

- کارکنان Anthropic به ما گفتند این مسیر یکپارچه‌سازی OpenClaw دوباره مجاز است.
- بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای اجراهای
  متکی بر Anthropic مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند.
- کلیدهای API Anthropic همچنان قابل‌پیش‌بینی‌ترین انتخاب برای میزبان‌های Gateway
  بلندمدت و کنترل صریح صورتحساب سمت سرور هستند.

## بررسی وضعیت احراز هویت مدل

```bash
openclaw models status
openclaw doctor
```

## رفتار چرخش کلید API (Gateway)

برخی ارائه‌دهندگان از تلاش دوباره درخواست با کلیدهای جایگزین هنگام برخورد یک فراخوانی API
با rate limit ارائه‌دهنده پشتیبانی می‌کنند.

- ترتیب اولویت:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override تکی)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- ارائه‌دهندگان Google همچنین `GOOGLE_API_KEY` را به‌عنوان fallback اضافی شامل می‌کنند.
- فهرست یکسان کلیدها پیش از استفاده deduplicate می‌شود.
- OpenClaw فقط برای خطاهای rate-limit با کلید بعدی دوباره تلاش می‌کند (برای مثال
  `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent
requests`، `ThrottlingException`، `concurrency limit reached`، یا
  `workers_ai ... quota limit exceeded`).
- خطاهای غیر rate-limit با کلیدهای جایگزین دوباره امتحان نمی‌شوند.
- اگر همه کلیدها شکست بخورند، خطای نهایی از آخرین تلاش بازگردانده می‌شود.

## کنترل اینکه کدام اعتبارنامه استفاده شود

### در سطح نشست (فرمان chat)

از `/model <alias-or-id>@<profileId>` برای ثابت کردن یک اعتبارنامه مشخص ارائه‌دهنده برای نشست فعلی استفاده کنید (نمونه شناسه‌های پروفایل: `anthropic:default`، `anthropic:work`).

از `/model` (یا `/model list`) برای یک انتخابگر فشرده استفاده کنید؛ از `/model status` برای نمای کامل استفاده کنید (نامزدها + پروفایل احراز هویت بعدی، به‌علاوه جزئیات endpoint ارائه‌دهنده هنگام پیکربندی).

### در سطح عامل (override در CLI)

یک override صریح برای ترتیب پروفایل احراز هویت یک عامل تنظیم کنید (در `auth-state.json` همان عامل ذخیره می‌شود):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

از `--agent <id>` برای هدف‌گیری یک عامل مشخص استفاده کنید؛ آن را حذف کنید تا از عامل پیش‌فرض پیکربندی‌شده استفاده شود.
وقتی مشکلات ترتیب را debug می‌کنید، `openclaw models status --probe` پروفایل‌های
ذخیره‌شده حذف‌شده را به‌جای رد کردن بی‌صدای آن‌ها به‌صورت `excluded_by_auth_order` نشان می‌دهد.
وقتی مشکلات cooldown را debug می‌کنید، به یاد داشته باشید که cooldownهای rate-limit می‌توانند
به یک شناسه مدل وابسته باشند، نه کل پروفایل ارائه‌دهنده.

## عیب‌یابی

### «هیچ اعتبارنامه‌ای پیدا نشد»

اگر پروفایل Anthropic مفقود است، یک کلید API Anthropic را روی
**میزبان Gateway** پیکربندی کنید یا مسیر توکن راه‌اندازی Anthropic را تنظیم کنید، سپس دوباره بررسی کنید:

```bash
openclaw models status
```

### توکن در حال انقضا/منقضی‌شده

`openclaw models status` را اجرا کنید تا تأیید کنید کدام پروفایل در حال انقضا است. اگر یک
پروفایل توکن Anthropic مفقود یا منقضی شده است، آن راه‌اندازی را از طریق
توکن راه‌اندازی refresh کنید یا به یک کلید API Anthropic مهاجرت کنید.

## مرتبط

- [مدیریت اسرار](/fa/gateway/secrets)
- [دسترسی راه دور](/fa/gateway/remote)
- [ذخیره‌سازی احراز هویت](/fa/concepts/oauth)
