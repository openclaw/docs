---
read_when:
    - اشکال‌زدایی احراز هویت مدل یا انقضای OAuth
    - مستندسازی احراز هویت یا ذخیره‌سازی اعتبارنامه‌ها
summary: 'احراز هویت مدل: OAuth، کلیدهای API، استفادهٔ مجدد از Claude CLI، و توکن راه‌اندازی Anthropic'
title: احراز هویت
x-i18n:
    generated_at: "2026-04-29T22:48:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
این صفحه مرجع احراز هویت **ارائه‌دهنده مدل** است (کلیدهای API، OAuth، استفاده دوباره از Claude CLI، و setup-token مربوط به Anthropic). برای احراز هویت **اتصال Gateway** (token، password، trusted-proxy)، [پیکربندی](/fa/gateway/configuration) و [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth) را ببینید.
</Note>

OpenClaw از OAuth و کلیدهای API برای ارائه‌دهندگان مدل پشتیبانی می‌کند. برای میزبان‌های Gateway
همیشه‌روشن، کلیدهای API معمولا قابل پیش‌بینی‌ترین گزینه هستند. جریان‌های اشتراک/OAuth
نیز زمانی که با مدل حساب ارائه‌دهنده شما سازگار باشند پشتیبانی می‌شوند.

برای جریان کامل OAuth و چیدمان ذخیره‌سازی، [/concepts/oauth](/fa/concepts/oauth) را ببینید.
برای احراز هویت مبتنی بر SecretRef (ارائه‌دهندگان `env`/`file`/`exec`)، [مدیریت اسرار](/fa/gateway/secrets) را ببینید.
برای قواعد شایستگی اعتبارنامه/کد دلیل که توسط `models status --probe` استفاده می‌شوند، ببینید:
[معناشناسی اعتبارنامه احراز هویت](/fa/auth-credential-semantics).

## راه‌اندازی پیشنهادی (کلید API، هر ارائه‌دهنده)

اگر یک Gateway بلندمدت اجرا می‌کنید، با یک کلید API برای ارائه‌دهنده منتخب خود شروع کنید.
به‌طور خاص برای Anthropic، احراز هویت با کلید API همچنان قابل پیش‌بینی‌ترین راه‌اندازی سرور است،
اما OpenClaw از استفاده دوباره از ورود محلی Claude CLI نیز پشتیبانی می‌کند.

1. در کنسول ارائه‌دهنده خود یک کلید API بسازید.
2. آن را روی **میزبان Gateway** (دستگاهی که `openclaw gateway` را اجرا می‌کند) قرار دهید.

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

اگر ترجیح می‌دهید env vars را خودتان مدیریت نکنید، onboarding می‌تواند
کلیدهای API را برای استفاده daemon ذخیره کند: `openclaw onboard`.

برای جزئیات درباره وراثت env (`env.shellEnv`،
`~/.openclaw/.env`، systemd/launchd)، [راهنما](/fa/help) را ببینید.

## Anthropic: سازگاری Claude CLI و token

احراز هویت setup-token مربوط به Anthropic همچنان در OpenClaw به‌عنوان یک مسیر token
پشتیبانی‌شده در دسترس است. کارکنان Anthropic از آن زمان به ما گفته‌اند که استفاده به سبک OpenClaw از Claude CLI
دوباره مجاز است، بنابراین OpenClaw استفاده دوباره از Claude CLI و استفاده از `claude -p` را
برای این یکپارچه‌سازی مجاز در نظر می‌گیرد، مگر اینکه Anthropic سیاست جدیدی منتشر کند. وقتی
استفاده دوباره از Claude CLI روی میزبان در دسترس باشد، اکنون همان مسیر ترجیحی است.

برای میزبان‌های Gateway بلندمدت، کلید API مربوط به Anthropic همچنان قابل پیش‌بینی‌ترین
راه‌اندازی است. اگر می‌خواهید از یک ورود Claude موجود روی همان میزبان دوباره استفاده کنید، از مسیر
Anthropic Claude CLI در onboarding/configure استفاده کنید.

راه‌اندازی پیشنهادی میزبان برای استفاده دوباره از Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

این یک راه‌اندازی دومرحله‌ای است:

1. خود Claude Code را روی میزبان Gateway وارد Anthropic کنید.
2. به OpenClaw بگویید انتخاب مدل Anthropic را به backend محلی `claude-cli`
   تغییر دهد و پروفایل احراز هویت مطابق OpenClaw را ذخیره کند.

اگر `claude` در `PATH` نیست، ابتدا Claude Code را نصب کنید یا
`agents.defaults.cliBackends.claude-cli.command` را روی مسیر واقعی فایل اجرایی تنظیم کنید.

ورود دستی token (هر ارائه‌دهنده؛ `auth-profiles.json` را می‌نویسد و config را به‌روزرسانی می‌کند):

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

OpenClaw در زمان اجرا انتظار شکل canonical شامل `version` + `profiles` را دارد. اگر یک نصب قدیمی هنوز فایلی flat مثل `{ "openrouter": { "apiKey": "..." } }` دارد، `openclaw doctor --fix` را اجرا کنید تا آن را به‌صورت پروفایل کلید API با نام `openrouter:default` بازنویسی کند؛ doctor یک کپی `.legacy-flat.*.bak` کنار فایل اصلی نگه می‌دارد. جزئیات endpoint مانند `baseUrl`، `api`، شناسه‌های مدل، headers، و timeouts باید زیر `models.providers.<id>` در `openclaw.json` یا `models.json` قرار بگیرند، نه در `auth-profiles.json`.

ارجاع‌های پروفایل احراز هویت برای اعتبارنامه‌های static نیز پشتیبانی می‌شوند:

- اعتبارنامه‌های `api_key` می‌توانند از `keyRef: { source, provider, id }` استفاده کنند
- اعتبارنامه‌های `token` می‌توانند از `tokenRef: { source, provider, id }` استفاده کنند
- پروفایل‌های حالت OAuth از اعتبارنامه‌های SecretRef پشتیبانی نمی‌کنند؛ اگر `auth.profiles.<id>.mode` روی `"oauth"` تنظیم شده باشد، ورودی `keyRef`/`tokenRef` مبتنی بر SecretRef برای آن پروفایل رد می‌شود.

بررسی مناسب برای خودکارسازی (خروج با `1` هنگام منقضی/مفقود بودن، `2` هنگام نزدیک بودن انقضا):

```bash
openclaw models status --check
```

probeهای زنده احراز هویت:

```bash
openclaw models status --probe
```

یادداشت‌ها:

- ردیف‌های probe می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
- اگر `auth.order.<provider>` صریح یک پروفایل ذخیره‌شده را حذف کند، probe به‌جای امتحان کردن آن،
  برای آن پروفایل `excluded_by_auth_order` گزارش می‌کند.
- اگر احراز هویت وجود داشته باشد اما OpenClaw نتواند برای آن ارائه‌دهنده یک candidate مدل قابل probe پیدا کند،
  probe مقدار `status: no_model` را گزارش می‌کند.
- cooldownهای محدودیت نرخ می‌توانند در سطح مدل باشند. پروفایلی که برای یک
  مدل در cooldown است همچنان می‌تواند برای مدل sibling روی همان ارائه‌دهنده قابل استفاده باشد.

اسکریپت‌های عملیاتی اختیاری (systemd/Termux) اینجا مستند شده‌اند:
[اسکریپت‌های پایش احراز هویت](/fa/help/scripts#auth-monitoring-scripts)

## یادداشت Anthropic

backend مربوط به Anthropic `claude-cli` دوباره پشتیبانی می‌شود.

- کارکنان Anthropic به ما گفتند این مسیر یکپارچه‌سازی OpenClaw دوباره مجاز است.
- بنابراین OpenClaw استفاده دوباره از Claude CLI و استفاده از `claude -p` را
  برای اجراهای مبتنی بر Anthropic مجاز در نظر می‌گیرد، مگر اینکه Anthropic سیاست جدیدی منتشر کند.
- کلیدهای API مربوط به Anthropic همچنان قابل پیش‌بینی‌ترین انتخاب برای میزبان‌های Gateway
  بلندمدت و کنترل صریح صورت‌حساب سمت سرور هستند.

## بررسی وضعیت احراز هویت مدل

```bash
openclaw models status
openclaw doctor
```

## رفتار چرخش کلید API (Gateway)

برخی ارائه‌دهندگان از تلاش دوباره یک درخواست با کلیدهای جایگزین هنگام برخورد یک فراخوانی API
با محدودیت نرخ ارائه‌دهنده پشتیبانی می‌کنند.

- ترتیب اولویت:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override تکی)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- ارائه‌دهندگان Google همچنین `GOOGLE_API_KEY` را به‌عنوان fallback اضافی شامل می‌کنند.
- همان فهرست کلیدها پیش از استفاده deduplicate می‌شود.
- OpenClaw فقط برای خطاهای محدودیت نرخ با کلید بعدی دوباره تلاش می‌کند (برای مثال
  `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent
requests`، `ThrottlingException`، `concurrency limit reached`، یا
  `workers_ai ... quota limit exceeded`).
- خطاهای غیر محدودیت نرخ با کلیدهای جایگزین دوباره تلاش نمی‌شوند.
- اگر همه کلیدها شکست بخورند، خطای نهایی از آخرین تلاش برگردانده می‌شود.

## کنترل اینکه کدام اعتبارنامه استفاده شود

### در هر جلسه (فرمان chat)

از `/model <alias-or-id>@<profileId>` برای pin کردن یک اعتبارنامه ارائه‌دهنده مشخص برای جلسه فعلی استفاده کنید (نمونه شناسه‌های پروفایل: `anthropic:default`، `anthropic:work`).

از `/model` (یا `/model list`) برای یک picker فشرده استفاده کنید؛ از `/model status` برای نمای کامل استفاده کنید (candidateها + پروفایل احراز هویت بعدی، به‌علاوه جزئیات endpoint ارائه‌دهنده وقتی پیکربندی شده باشد).

### در هر agent (override در CLI)

یک override صریح برای ترتیب پروفایل احراز هویت برای یک agent تنظیم کنید (در `auth-state.json` همان agent ذخیره می‌شود):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

برای هدف گرفتن یک agent مشخص از `--agent <id>` استفاده کنید؛ آن را حذف کنید تا از agent پیش‌فرض پیکربندی‌شده استفاده شود.
وقتی مشکلات ترتیب را debug می‌کنید، `openclaw models status --probe` پروفایل‌های ذخیره‌شده حذف‌شده را
به‌جای رد کردن بی‌سروصدای آن‌ها، به‌صورت `excluded_by_auth_order` نشان می‌دهد.
وقتی مشکلات cooldown را debug می‌کنید، به خاطر داشته باشید که cooldownهای محدودیت نرخ می‌توانند به
یک شناسه مدل وابسته باشند، نه کل پروفایل ارائه‌دهنده.

## عیب‌یابی

### «هیچ اعتبارنامه‌ای پیدا نشد»

اگر پروفایل Anthropic وجود ندارد، یک کلید API مربوط به Anthropic را روی
**میزبان Gateway** پیکربندی کنید یا مسیر setup-token مربوط به Anthropic را راه‌اندازی کنید، سپس دوباره بررسی کنید:

```bash
openclaw models status
```

### token در حال انقضا/منقضی‌شده

`openclaw models status` را اجرا کنید تا تایید کنید کدام پروفایل در حال انقضا است. اگر یک
پروفایل token مربوط به Anthropic وجود ندارد یا منقضی شده است، آن راه‌اندازی را از طریق
setup-token تازه‌سازی کنید یا به یک کلید API مربوط به Anthropic مهاجرت کنید.

## مرتبط

- [مدیریت اسرار](/fa/gateway/secrets)
- [دسترسی راه دور](/fa/gateway/remote)
- [ذخیره‌سازی احراز هویت](/fa/concepts/oauth)
