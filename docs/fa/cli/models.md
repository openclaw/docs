---
read_when:
    - می‌خواهید مدل‌های پیش‌فرض را تغییر دهید یا وضعیت احراز هویت ارائه‌دهنده را مشاهده کنید
    - می‌خواهید مدل‌ها/ارائه‌دهندگان موجود را اسکن کنید و پروفایل‌های احراز هویت را اشکال‌زدایی کنید
summary: مرجع CLI برای `openclaw models` (status/list/set/scan، نام‌های مستعار، گزینه‌های جایگزین، احراز هویت)
title: مدل‌ها
x-i18n:
    generated_at: "2026-05-04T11:59:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc7842f02e29aa0ac2ae88f3d42bba71f1890a58ab22d818dbee0585bc562fea
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

کشف، اسکن و پیکربندی مدل‌ها (مدل پیش‌فرض، گزینه‌های جایگزین، پروفایل‌های احراز هویت).

مرتبط:

- ارائه‌دهندگان + مدل‌ها: [مدل‌ها](/fa/providers/models)
- مفاهیم انتخاب مدل + دستور اسلش `/models`: [مفهوم مدل‌ها](/fa/concepts/models)
- راه‌اندازی احراز هویت ارائه‌دهنده: [شروع به کار](/fa/start/getting-started)

## دستورهای رایج

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` مقدار حل‌شده پیش‌فرض/جایگزین‌ها را همراه با نمای کلی احراز هویت نشان می‌دهد.
وقتی عکس‌های لحظه‌ای استفاده ارائه‌دهنده در دسترس باشند، بخش وضعیت OAuth/API-key شامل
پنجره‌های استفاده ارائه‌دهنده و عکس‌های لحظه‌ای سهمیه است.
ارائه‌دهندگان فعلی پنجره استفاده: Anthropic، GitHub Copilot، Gemini CLI، OpenAI
Codex، MiniMax، Xiaomi، و z.ai. احراز هویت استفاده، در صورت وجود، از hookهای ویژه ارائه‌دهنده
می‌آید؛ در غیر این صورت OpenClaw به اعتبارنامه‌های OAuth/API-key مطابق
از پروفایل‌های احراز هویت، env، یا پیکربندی برمی‌گردد.
در خروجی `--json`، `auth.providers` نمای کلی ارائه‌دهنده آگاه از env/config/store است،
در حالی که `auth.oauth` فقط سلامت پروفایل auth-store است.
برای اجرای probeهای زنده احراز هویت روی هر پروفایل ارائه‌دهنده پیکربندی‌شده، `--probe` را اضافه کنید.
Probeها درخواست‌های واقعی هستند (ممکن است توکن مصرف کنند و محدودیت نرخ را فعال کنند).
برای بررسی وضعیت مدل/احراز هویت یک عامل پیکربندی‌شده، از `--agent <id>` استفاده کنید. وقتی حذف شود،
دستور اگر `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` تنظیم شده باشد از آن استفاده می‌کند، وگرنه از
عامل پیش‌فرض پیکربندی‌شده استفاده می‌کند.
ردیف‌های probe می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.

نکات:

- `models set <model-or-alias>` مقدار `provider/model` یا یک alias را می‌پذیرد.
- `models list` فقط خواندنی است: پیکربندی، پروفایل‌های احراز هویت، وضعیت catalog موجود
  و ردیف‌های catalog متعلق به ارائه‌دهنده را می‌خواند، اما
  `models.json` را بازنویسی نمی‌کند.
- ستون `Auth` در سطح ارائه‌دهنده و فقط خواندنی است. این ستون از فراداده پروفایل احراز هویت محلی،
  نشانگرهای env، کلیدهای ارائه‌دهنده پیکربندی‌شده، نشانگرهای ارائه‌دهنده محلی،
  نشانگرهای env/profile در AWS Bedrock، و فراداده synthetic-auth در Plugin محاسبه می‌شود؛
  runtime ارائه‌دهنده را بارگذاری نمی‌کند، secretهای keychain را نمی‌خواند، APIهای ارائه‌دهنده
  را فراخوانی نمی‌کند، یا آمادگی دقیق اجرای هر مدل را اثبات نمی‌کند.
- `models list --all --provider <id>` می‌تواند ردیف‌های catalog ایستای متعلق به ارائه‌دهنده
  را از manifestهای Plugin یا فراداده catalog ارائه‌دهنده‌های bundled شامل کند، حتی وقتی هنوز
  با آن ارائه‌دهنده احراز هویت نکرده‌اید. آن ردیف‌ها همچنان تا وقتی احراز هویت مطابق پیکربندی نشود
  ناموجود نشان داده می‌شوند.
- `models list` در زمانی که کشف catalog ارائه‌دهنده کند است، control plane را پاسخ‌گو نگه می‌دارد.
  نماهای پیش‌فرض و پیکربندی‌شده پس از انتظاری کوتاه به ردیف‌های مدل پیکربندی‌شده یا
  synthetic برمی‌گردند و اجازه می‌دهند کشف در پس‌زمینه تمام شود. وقتی به catalog کامل کشف‌شده دقیق نیاز دارید
  و آماده انتظار برای کشف ارائه‌دهنده هستید، از `--all` استفاده کنید.
- دستور گسترده `models list --all` ردیف‌های catalog در manifest را روی ردیف‌های registry ادغام می‌کند
  بدون اینکه hookهای مکمل runtime ارائه‌دهنده را بارگذاری کند. مسیرهای سریع manifest با فیلتر ارائه‌دهنده
  فقط از ارائه‌دهندگانی استفاده می‌کنند که `static` علامت‌گذاری شده‌اند؛ ارائه‌دهندگان علامت‌گذاری‌شده با `refreshable`
  بر پایه registry/cache می‌مانند و ردیف‌های manifest را به‌عنوان مکمل اضافه می‌کنند، در حالی که
  ارائه‌دهندگان علامت‌گذاری‌شده با `runtime` روی کشف registry/runtime می‌مانند.
- `models list` فراداده native مدل و سقف‌های runtime را جدا نگه می‌دارد. در خروجی جدولی،
  `Ctx` وقتی سقف runtime مؤثر با پنجره context native فرق داشته باشد، `contextTokens/contextWindow` را نشان می‌دهد؛ ردیف‌های JSON وقتی یک ارائه‌دهنده آن سقف را آشکار کند، `contextTokens` را شامل می‌شوند.
- `models list --provider <id>` بر اساس شناسه ارائه‌دهنده، مانند `moonshot` یا
  `openai-codex`، فیلتر می‌کند. این دستور برچسب‌های نمایشی از انتخاب‌گرهای تعاملی ارائه‌دهنده،
  مانند `Moonshot AI`، را نمی‌پذیرد.
- ارجاع‌های مدل با تقسیم بر اساس **اولین** `/` parse می‌شوند. اگر شناسه مدل شامل `/` است (سبک OpenRouter)، پیشوند ارائه‌دهنده را اضافه کنید (مثال: `openrouter/moonshotai/kimi-k2`).
- اگر ارائه‌دهنده را حذف کنید، OpenClaw ورودی را ابتدا به‌عنوان alias حل می‌کند، سپس
  به‌عنوان یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط پس از آن
  با هشدار deprecation به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد.
  اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw
  به‌جای نمایش یک پیش‌فرض قدیمی مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
- `models status` ممکن است برای placeholderهای غیرمحرمانه (برای مثال `OPENAI_API_KEY`، `secretref-managed`، `minimax-oauth`، `oauth:chutes`، `ollama-local`) در خروجی احراز هویت `marker(<value>)` را نشان دهد، به‌جای اینکه آن‌ها را مانند secretها mask کند.

### اسکن مدل‌ها

`models scan` کاتالوگ عمومی `:free` در OpenRouter را می‌خواند و candidateها را برای
استفاده جایگزین رتبه‌بندی می‌کند. خود catalog عمومی است، بنابراین اسکن‌های فقط فراداده به
کلید OpenRouter نیاز ندارند.

به‌طور پیش‌فرض OpenClaw تلاش می‌کند پشتیبانی ابزار و تصویر را با فراخوانی‌های زنده مدل probe کند.
اگر هیچ کلید OpenRouter پیکربندی نشده باشد، دستور به خروجی فقط فراداده
برمی‌گردد و توضیح می‌دهد که مدل‌های `:free` همچنان برای
probeها و inference به `OPENROUTER_API_KEY` نیاز دارند.

گزینه‌ها:

- `--no-probe` (فقط فراداده؛ بدون جست‌وجوی پیکربندی/secretها)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (درخواست catalog و timeout برای هر probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` و `--set-image` به probeهای زنده نیاز دارند؛ نتایج اسکن فقط فراداده
اطلاع‌رسان هستند و روی پیکربندی اعمال نمی‌شوند.

### وضعیت مدل‌ها

گزینه‌ها:

- `--json`
- `--plain`
- `--check` (exit 1=منقضی/مفقود، 2=در آستانه انقضا)
- `--probe` (probe زنده پروفایل‌های احراز هویت پیکربندی‌شده)
- `--probe-provider <name>` (probe یک ارائه‌دهنده)
- `--probe-profile <id>` (شناسه‌های پروفایل تکراری یا جداشده با کاما)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (شناسه عامل پیکربندی‌شده؛ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` را override می‌کند)

`--json` stdout را برای payload JSON رزرو نگه می‌دارد. عیب‌یابی‌های پروفایل احراز هویت، ارائه‌دهنده،
و startup به stderr هدایت می‌شوند تا scriptها بتوانند stdout را مستقیم
به ابزارهایی مانند `jq` pipe کنند.

دسته‌های وضعیت probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

موارد جزئیات/کد دلیل probe که باید انتظار داشته باشید:

- `excluded_by_auth_order`: یک پروفایل ذخیره‌شده وجود دارد، اما
  `auth.order.<provider>` صریح آن را حذف کرده است، بنابراین probe به‌جای
  امتحان کردن آن، حذف را گزارش می‌کند.
- `missing_credential`، `invalid_expires`، `expired`، `unresolved_ref`:
  پروفایل وجود دارد اما eligible/resolvable نیست.
- `no_model`: احراز هویت ارائه‌دهنده وجود دارد، اما OpenClaw نتوانست یک
  candidate مدل قابل probe برای آن ارائه‌دهنده حل کند.

## aliasها + جایگزین‌ها

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## پروفایل‌های احراز هویت

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` کمک‌گر تعاملی احراز هویت است. بسته به
ارائه‌دهنده‌ای که انتخاب می‌کنید، می‌تواند جریان احراز هویت ارائه‌دهنده
(OAuth/API key) را اجرا کند یا شما را به paste دستی token راهنمایی کند.

`models auth list` پروفایل‌های احراز هویت ذخیره‌شده برای عامل انتخاب‌شده را بدون
چاپ token، API-key، یا مواد secret در OAuth فهرست می‌کند. برای
فیلتر کردن به یک ارائه‌دهنده، مانند `openai-codex`، از `--provider <id>` استفاده کنید و برای scriptنویسی از `--json`.

`models auth login` جریان احراز هویت Plugin ارائه‌دهنده (OAuth/API key) را اجرا می‌کند. برای دیدن اینکه کدام ارائه‌دهندگان نصب شده‌اند، از
`openclaw plugins list` استفاده کنید.
برای نوشتن نتایج احراز هویت در store یک عامل پیکربندی‌شده خاص، از `openclaw models auth --agent <id> <subcommand>` استفاده کنید.
فلگ والد `--agent` توسط
`add`، `list`، `login`، `setup-token`، `paste-token`، و
`login-github-copilot` رعایت می‌شود.

مثال‌ها:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

نکات:

- `setup-token` و `paste-token` برای ارائه‌دهندگانی که
  روش‌های احراز هویت token را آشکار می‌کنند، دستورهای generic token باقی می‌مانند.
- `setup-token` به TTY تعاملی نیاز دارد و روش token-auth ارائه‌دهنده را اجرا می‌کند
  (وقتی آن ارائه‌دهنده روشی ارائه دهد، به‌طور پیش‌فرض از روش `setup-token` همان ارائه‌دهنده استفاده می‌کند).
- `paste-token` رشته token تولیدشده در جای دیگر یا از automation را می‌پذیرد.
- `paste-token` به `--provider` نیاز دارد، مقدار token را درخواست می‌کند، و آن را در شناسه پروفایل پیش‌فرض `<provider>:manual` می‌نویسد مگر اینکه
  `--profile-id` را پاس دهید.
- `paste-token --expires-in <duration>` انقضای مطلق token را از یک
  مدت نسبی مانند `365d` یا `12h` ذخیره می‌کند.
- نکته Anthropic: کارکنان Anthropic به ما گفتند که استفاده به سبک OpenClaw از Claude CLI دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این integration مجاز تلقی می‌کند، مگر اینکه Anthropic policy جدیدی منتشر کند.
- `setup-token` / `paste-token` در Anthropic همچنان به‌عنوان یک مسیر token پشتیبانی‌شده OpenClaw در دسترس هستند، اما OpenClaw اکنون در صورت دسترس بودن، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [انتخاب مدل](/fa/concepts/model-providers)
- [failover مدل](/fa/concepts/model-failover)
