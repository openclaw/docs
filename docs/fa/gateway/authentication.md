---
read_when:
    - اشکال‌زدایی احراز هویت مدل یا انقضای OAuth
    - مستندسازی احراز هویت یا ذخیره‌سازی اعتبارنامه‌ها
summary: 'احراز هویت مدل: OAuth، کلیدهای API، استفادهٔ مجدد از Claude CLI، و توکن راه‌اندازی Anthropic'
title: احراز هویت
x-i18n:
    generated_at: "2026-06-27T17:39:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
این صفحه مرجع احراز هویت **ارائه‌دهنده مدل** است (کلیدهای API، OAuth، استفاده مجدد از Claude CLI، و setup-token مربوط به Anthropic). برای احراز هویت **اتصال Gateway** (توکن، گذرواژه، trusted-proxy)، [پیکربندی](/fa/gateway/configuration) و [احراز هویت پروکسی مورد اعتماد](/fa/gateway/trusted-proxy-auth) را ببینید.
</Note>

OpenClaw از OAuth و کلیدهای API برای ارائه‌دهندگان مدل پشتیبانی می‌کند. برای میزبان‌های Gateway همیشه‌روشن،
کلیدهای API معمولاً قابل‌پیش‌بینی‌ترین گزینه هستند. جریان‌های اشتراک/OAuth
نیز وقتی با مدل حساب ارائه‌دهنده شما همخوان باشند پشتیبانی می‌شوند.

برای جریان کامل OAuth و چیدمان ذخیره‌سازی، [/concepts/oauth](/fa/concepts/oauth) را ببینید.
برای احراز هویت مبتنی بر SecretRef (ارائه‌دهندگان `env`/`file`/`exec`)، [مدیریت اسرار](/fa/gateway/secrets) را ببینید.
برای قواعد واجد شرایط بودن اعتبارنامه/کد دلیل که توسط `models status --probe` استفاده می‌شوند، [معناشناسی اعتبارنامه احراز هویت](/fa/auth-credential-semantics) را ببینید.

## راه‌اندازی پیشنهادی (کلید API، هر ارائه‌دهنده)

اگر یک Gateway بلندمدت اجرا می‌کنید، با یک کلید API برای ارائه‌دهنده منتخب خود شروع کنید.
برای Anthropic به‌طور مشخص، احراز هویت با کلید API همچنان قابل‌پیش‌بینی‌ترین راه‌اندازی سرور است،
اما OpenClaw از استفاده مجدد از ورود محلی Claude CLI نیز پشتیبانی می‌کند.

1. در کنسول ارائه‌دهنده خود یک کلید API بسازید.
2. آن را روی **میزبان Gateway** قرار دهید (دستگاهی که `openclaw gateway` را اجرا می‌کند).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. اگر Gateway زیر systemd/launchd اجرا می‌شود، ترجیحاً کلید را در
   `~/.openclaw/.env` قرار دهید تا daemon بتواند آن را بخواند:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

سپس daemon را دوباره راه‌اندازی کنید (یا فرایند Gateway خود را دوباره راه‌اندازی کنید) و دوباره بررسی کنید:

```bash
openclaw models status
openclaw doctor
```

اگر ترجیح می‌دهید خودتان متغیرهای محیطی را مدیریت نکنید، onboarding می‌تواند
کلیدهای API را برای استفاده daemon ذخیره کند: `openclaw onboard`.

برای جزئیات مربوط به ارث‌بری محیط (`env.shellEnv`،
`~/.openclaw/.env`، systemd/launchd)، [راهنما](/fa/help) را ببینید.

## Anthropic: سازگاری Claude CLI و توکن

احراز هویت setup-token مربوط به Anthropic همچنان به‌عنوان یک مسیر توکن پشتیبانی‌شده
در OpenClaw در دسترس است. کارکنان Anthropic از آن زمان به ما گفته‌اند که استفاده از Claude CLI به سبک OpenClaw
دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را
برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند. وقتی
استفاده مجدد از Claude CLI روی میزبان در دسترس باشد، اکنون همان مسیر ترجیحی است.

برای میزبان‌های Gateway بلندمدت، کلید API مربوط به Anthropic همچنان قابل‌پیش‌بینی‌ترین
راه‌اندازی است. اگر می‌خواهید از ورود موجود Claude روی همان میزبان دوباره استفاده کنید، از مسیر
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
   تغییر دهد و نمایه احراز هویت متناظر OpenClaw را ذخیره کند.

اگر `claude` روی `PATH` نیست، ابتدا Claude Code را نصب کنید یا
`agents.defaults.cliBackends.claude-cli.command` را روی مسیر واقعی باینری تنظیم کنید.

ورود دستی توکن (هر ارائه‌دهنده؛ ذخیره احراز هویت SQLite مخصوص هر agent را می‌نویسد و config را به‌روزرسانی می‌کند):

```bash
openclaw models auth paste-token --provider openrouter
```

ذخیره نمایه احراز هویت فقط اعتبارنامه‌ها را نگه می‌دارد. فایل‌های قدیمی `auth-profiles.json` از این شکل کانونی استفاده می‌کردند:

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

OpenClaw اکنون نمایه‌های احراز هویت را از `openclaw-agent.sqlite` هر agent می‌خواند. اگر یک نصب قدیمی هنوز `auth-profiles.json`، `auth-state.json`، یا یک فایل تخت نمایه احراز هویت مانند `{ "openrouter": { "apiKey": "..." } }` دارد، `openclaw doctor --fix` را اجرا کنید تا آن را به SQLite وارد کند؛ doctor نسخه‌های پشتیبان دارای برچسب زمانی را کنار فایل‌های JSON اصلی نگه می‌دارد. جزئیات endpoint مانند `baseUrl`، `api`، شناسه‌های مدل، سرآیندها، و timeoutها باید زیر `models.providers.<id>` در `openclaw.json` یا `models.json` باشند، نه در نمایه‌های احراز هویت.

مسیرهای احراز هویت خارجی مانند Bedrock `auth: "aws-sdk"` نیز اعتبارنامه نیستند. اگر یک مسیر نام‌دار Bedrock می‌خواهید، `auth.profiles.<id>.mode: "aws-sdk"` را در `openclaw.json` قرار دهید؛ `type: "aws-sdk"` را در ذخیره نمایه احراز هویت ننویسید. `openclaw doctor --fix` نشانگرهای قدیمی AWS SDK را از ذخیره اعتبارنامه به فراداده config منتقل می‌کند.

ارجاع‌های نمایه احراز هویت برای اعتبارنامه‌های ایستا نیز پشتیبانی می‌شوند:

- اعتبارنامه‌های `api_key` می‌توانند از `keyRef: { source, provider, id }` استفاده کنند
- اعتبارنامه‌های `token` می‌توانند از `tokenRef: { source, provider, id }` استفاده کنند
- نمایه‌های حالت OAuth از اعتبارنامه‌های SecretRef پشتیبانی نمی‌کنند؛ اگر `auth.profiles.<id>.mode` روی `"oauth"` تنظیم شده باشد، ورودی `keyRef`/`tokenRef` متکی بر SecretRef برای آن نمایه رد می‌شود.

بررسی مناسب برای اتوماسیون (خروجی `1` هنگام منقضی/مفقود بودن، `2` هنگام نزدیک بودن به انقضا):

```bash
openclaw models status --check
```

کاوش‌های زنده احراز هویت:

```bash
openclaw models status --probe
```

یادداشت‌ها:

- ردیف‌های کاوش می‌توانند از نمایه‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
- اگر `auth.order.<provider>` صریح یک نمایه ذخیره‌شده را حذف کند، کاوش برای آن نمایه
  به‌جای امتحان کردن آن، `excluded_by_auth_order` را گزارش می‌کند.
- اگر احراز هویت وجود داشته باشد اما OpenClaw نتواند یک نامزد مدل قابل کاوش را برای
  آن ارائه‌دهنده resolve کند، کاوش `status: no_model` را گزارش می‌کند.
- cooldownهای محدودیت نرخ می‌توانند در سطح مدل باشند. نمایه‌ای که برای یک
  مدل در cooldown است، همچنان می‌تواند برای یک مدل هم‌خانواده روی همان ارائه‌دهنده قابل استفاده باشد.

اسکریپت‌های اختیاری عملیات (systemd/Termux) اینجا مستند شده‌اند:
[اسکریپت‌های پایش احراز هویت](/fa/help/scripts#auth-monitoring-scripts)

## یادداشت Anthropic

backend مربوط به Anthropic `claude-cli` دوباره پشتیبانی می‌شود.

- کارکنان Anthropic به ما گفتند این مسیر یکپارچه‌سازی OpenClaw دوباره مجاز است.
- بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای اجراهای
  متکی بر Anthropic مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند.
- کلیدهای API مربوط به Anthropic همچنان قابل‌پیش‌بینی‌ترین انتخاب برای میزبان‌های Gateway
  بلندمدت و کنترل صریح صورتحساب سمت سرور هستند.

## بررسی وضعیت احراز هویت مدل

```bash
openclaw models status
openclaw doctor
```

## رفتار چرخش کلید API (Gateway)

برخی ارائه‌دهندگان از تلاش دوباره برای یک درخواست با کلیدهای جایگزین پشتیبانی می‌کنند، وقتی یک فراخوانی API
به محدودیت نرخ ارائه‌دهنده برخورد می‌کند.

- ترتیب اولویت:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (یک override تکی)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- ارائه‌دهندگان Google همچنین `GOOGLE_API_KEY` را به‌عنوان یک fallback اضافی شامل می‌شوند.
- همان فهرست کلید پیش از استفاده deduplicate می‌شود.
- OpenClaw فقط برای خطاهای محدودیت نرخ با کلید بعدی دوباره تلاش می‌کند (برای مثال
  `429`، `rate_limit`، `quota`، `resource exhausted`، `Too many concurrent
requests`، `ThrottlingException`، `concurrency limit reached`، یا
  `workers_ai ... quota limit exceeded`).
- خطاهای غیر محدودیت نرخ با کلیدهای جایگزین دوباره امتحان نمی‌شوند.
- اگر همه کلیدها شکست بخورند، خطای نهایی از آخرین تلاش بازگردانده می‌شود.

## حذف احراز هویت ارائه‌دهنده هنگام اجرای Gateway

وقتی احراز هویت ارائه‌دهنده از طریق control plane مربوط به Gateway حذف شود، OpenClaw
نمایه‌های احراز هویت ذخیره‌شده برای آن ارائه‌دهنده را حذف می‌کند و اجراهای فعال chat یا agent
را که ارائه‌دهنده مدل انتخاب‌شده‌شان با ارائه‌دهنده حذف‌شده مطابق است لغو می‌کند. اجراهای لغوشده
رویدادهای عادی لغو chat و چرخه عمر را با
`stopReason: "auth-revoked"` منتشر می‌کنند، تا کلاینت‌های متصل بتوانند نشان دهند که اجرا به‌دلیل
حذف اعتبارنامه‌ها متوقف شده است.

حذف احراز هویت ذخیره‌شده کلیدها را نزد ارائه‌دهنده باطل نمی‌کند. وقتی به ابطال سمت ارائه‌دهنده نیاز دارید،
کلید را در داشبورد ارائه‌دهنده بچرخانید یا باطل کنید.

## کنترل اینکه کدام اعتبارنامه استفاده شود

### OpenAI و شناسه‌های قدیمی `openai-codex`

نمایه‌های کلید API مربوط به OpenAI و نمایه‌های OAuth مربوط به ChatGPT/Codex هر دو از شناسه کانونی
ارائه‌دهنده `openai` استفاده می‌کنند. config جدید باید از شناسه‌های نمایه `openai:*` و
`auth.order.openai` استفاده کند.

اگر در config قدیمی‌تر، شناسه‌های نمایه احراز هویت، یا
`auth.order.openai-codex`، `openai-codex` را می‌بینید، آن را ورودی مهاجرت قدیمی تلقی کنید. نمایه‌های جدید
`openai-codex` نسازید. اجرا کنید:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor شناسه‌های نمایه قدیمی `openai-codex:*` و ورودی‌های
`auth.order.openai-codex` را به مسیر احراز هویت کانونی `openai` بازنویسی می‌کند. برای
مسیریابی مدل/runtime ویژه OpenAI، [OpenAI](/fa/providers/openai) را ببینید.

### هنگام ورود (CLI)

برای ارائه‌دهندگانی که هنگام ورود از نمایه‌های احراز هویت نام‌دار پشتیبانی می‌کنند، از
`openclaw models auth login --provider <id> --profile-id <profileId>` استفاده کنید.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

این ساده‌ترین راه برای جدا نگه داشتن چند ورود OAuth برای یک ارائه‌دهنده واحد
داخل یک agent است.

وقتی یک نمایه ارائه‌دهنده ذخیره‌شده گیر کرده، منقضی شده، یا به حساب اشتباه متصل است و فرمان عادی ورود
مدام از آن دوباره استفاده می‌کند، از `--force` استفاده کنید. `--force` نمایه‌های احراز هویت ذخیره‌شده
برای آن ارائه‌دهنده را در دایرکتوری agent انتخاب‌شده حذف می‌کند، سپس همان جریان احراز هویت ارائه‌دهنده را
دوباره اجرا می‌کند. این کار اعتبارنامه‌ها را نزد ارائه‌دهنده باطل نمی‌کند؛ وقتی به ابطال سمت ارائه‌دهنده
نیاز دارید، آن‌ها را در داشبورد ارائه‌دهنده بچرخانید یا باطل کنید.

```bash
openclaw models auth login --provider anthropic --force
```

### برای هر نشست (فرمان chat)

برای pin کردن یک اعتبارنامه ارائه‌دهنده مشخص برای نشست فعلی، از `/model <alias-or-id>@<profileId>` استفاده کنید (نمونه شناسه‌های نمایه: `anthropic:default`، `anthropic:work`).

برای یک انتخابگر فشرده از `/model` (یا `/model list`) استفاده کنید؛ برای نمای کامل از `/model status` استفاده کنید (نامزدها + نمایه احراز هویت بعدی، به‌علاوه جزئیات endpoint ارائه‌دهنده وقتی پیکربندی شده باشد).

### برای هر agent (override در CLI)

یک override صریح برای ترتیب نمایه احراز هویت یک agent تنظیم کنید (در وضعیت احراز هویت SQLite همان agent ذخیره می‌شود):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

برای هدف گرفتن یک agent مشخص از `--agent <id>` استفاده کنید؛ برای استفاده از agent پیش‌فرض پیکربندی‌شده آن را حذف کنید.
وقتی مشکلات ترتیب را debug می‌کنید، `openclaw models status --probe` نمایه‌های ذخیره‌شده حذف‌شده را
به‌جای عبور بی‌صدا از آن‌ها، به‌صورت `excluded_by_auth_order` نشان می‌دهد.
وقتی مشکلات cooldown را debug می‌کنید، به یاد داشته باشید که cooldownهای محدودیت نرخ می‌توانند به
یک شناسه مدل متصل باشند نه کل نمایه ارائه‌دهنده.

اگر ترتیب احراز هویت یا pin کردن نمایه را برای chatای که از قبل در حال اجراست تغییر دهید،
در آن chat، `/new` یا `/reset` را بفرستید تا یک نشست تازه شروع شود. نشست‌های موجود
می‌توانند انتخاب مدل/نمایه فعلی خود را تا reset نگه دارند.

## عیب‌یابی

### «هیچ اعتبارنامه‌ای پیدا نشد»

اگر نمایه Anthropic وجود ندارد، یک کلید API مربوط به Anthropic را روی
**میزبان Gateway** پیکربندی کنید یا مسیر setup-token مربوط به Anthropic را راه‌اندازی کنید، سپس دوباره بررسی کنید:

```bash
openclaw models status
```

### توکن نزدیک به انقضا/منقضی‌شده

`openclaw models status` را اجرا کنید تا تأیید کنید کدام نمایه نزدیک به انقضاست. اگر یک
نمایه توکن Anthropic وجود ندارد یا منقضی شده است، آن راه‌اندازی را از طریق
setup-token تازه‌سازی کنید یا به یک کلید API مربوط به Anthropic مهاجرت کنید.

## مرتبط

- [مدیریت اسرار](/fa/gateway/secrets)
- [دسترسی از راه دور](/fa/gateway/remote)
- [ذخیره‌سازی احراز هویت](/fa/concepts/oauth)
