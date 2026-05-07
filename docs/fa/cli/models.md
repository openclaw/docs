---
read_when:
    - می‌خواهید مدل‌های پیش‌فرض را تغییر دهید یا وضعیت احراز هویت ارائه‌دهنده را مشاهده کنید
    - می‌خواهید مدل‌ها/ارائه‌دهندگان موجود را اسکن کنید و پروفایل‌های احراز هویت را اشکال‌زدایی کنید
summary: مرجع CLI برای `openclaw models` (status/list/set/scan، نام‌های مستعار، گزینه‌های جایگزین، احراز هویت)
title: مدل‌ها
x-i18n:
    generated_at: "2026-05-07T13:14:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

کشف، اسکن و پیکربندی مدل‌ها (مدل پیش‌فرض، fallbackها، پروفایل‌های احراز هویت).

مرتبط:

- ارائه‌دهندگان + مدل‌ها: [مدل‌ها](/fa/providers/models)
- مفاهیم انتخاب مدل + فرمان slash ‏`/models`: [مفهوم مدل‌ها](/fa/concepts/models)
- راه‌اندازی احراز هویت ارائه‌دهنده: [شروع کار](/fa/start/getting-started)

## فرمان‌های رایج

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` پیش‌فرض/fallbackهای resolve‌شده را به‌همراه نمای کلی احراز هویت نشان می‌دهد.
وقتی snapshotهای مصرف ارائه‌دهنده موجود باشند، بخش وضعیت OAuth/API-key شامل
بازه‌های مصرف ارائه‌دهنده و snapshotهای سهمیه می‌شود.
ارائه‌دهندگان فعلی بازه مصرف: Anthropic، GitHub Copilot، Gemini CLI، OpenAI
Codex، MiniMax، Xiaomi، و z.ai. احراز هویت مصرف، در صورت وجود، از hookهای اختصاصی ارائه‌دهنده می‌آید؛
در غیر این صورت OpenClaw به credentialهای OAuth/API-key متناظر
از پروفایل‌های احراز هویت، env، یا config fallback می‌کند.
در خروجی `--json`، ‏`auth.providers` نمای کلی ارائه‌دهنده با آگاهی از env/config/store است،
درحالی‌که `auth.oauth` فقط سلامت پروفایل auth-store است.
برای اجرای probeهای زنده احراز هویت روی هر پروفایل ارائه‌دهنده پیکربندی‌شده، `--probe` را اضافه کنید.
Probeها درخواست‌های واقعی هستند (ممکن است token مصرف کنند و rate limitها را فعال کنند).
برای بررسی وضعیت مدل/احراز هویت یک عامل پیکربندی‌شده از `--agent <id>` استفاده کنید. وقتی حذف شود،
فرمان در صورت تنظیم بودن از `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` استفاده می‌کند، وگرنه از
عامل پیش‌فرض پیکربندی‌شده استفاده می‌کند.
ردیف‌های probe می‌توانند از پروفایل‌های احراز هویت، credentialهای env، یا `models.json` بیایند.
برای عیب‌یابی OAuth در Codex، ‏`openclaw models status`،
`openclaw models auth list --provider openai-codex`، و
`openclaw config get agents.defaults.model --json` سریع‌ترین راه برای
تأیید این هستند که آیا یک عامل پروفایل احراز هویت قابل استفاده `openai-codex` برای
`openai/*` از طریق runtime بومی Codex دارد یا نه. [راه‌اندازی ارائه‌دهنده OpenAI](/fa/providers/openai#check-and-recover-codex-oauth-routing) را ببینید.

یادداشت‌ها:

- `models set <model-or-alias>` مقدار `provider/model` یا یک alias را می‌پذیرد.
- `models list` فقط خواندنی است: config، پروفایل‌های احراز هویت، وضعیت catalog موجود
  و ردیف‌های catalog متعلق به ارائه‌دهنده را می‌خواند، اما
  `models.json` را بازنویسی نمی‌کند.
- ستون `Auth` در سطح ارائه‌دهنده و فقط خواندنی است. این ستون از metadata محلی
  پروفایل احراز هویت، markerهای env، کلیدهای پیکربندی‌شده ارائه‌دهنده، markerهای ارائه‌دهنده محلی،
  markerهای env/profile در AWS Bedrock، و metadata احراز هویت مصنوعی Plugin محاسبه می‌شود؛
  این ستون runtime ارائه‌دهنده را load نمی‌کند، secretهای keychain را نمی‌خواند، APIهای
  ارائه‌دهنده را فراخوانی نمی‌کند، یا آمادگی دقیق اجرای هر مدل را اثبات نمی‌کند.
- `models list --all --provider <id>` می‌تواند ردیف‌های catalog ایستای متعلق به ارائه‌دهنده
  را از manifestهای Plugin یا metadata catalog ارائه‌دهنده bundled شامل کند، حتی وقتی هنوز
  با آن ارائه‌دهنده احراز هویت نکرده‌اید. آن ردیف‌ها تا زمانی که احراز هویت متناظر
  پیکربندی نشود همچنان unavailable نشان داده می‌شوند.
- `models list` هنگام کند بودن کشف catalog ارائه‌دهنده، control plane را پاسخ‌گو نگه می‌دارد.
  نماهای پیش‌فرض و پیکربندی‌شده پس از یک انتظار کوتاه به ردیف‌های مدل پیکربندی‌شده یا
  مصنوعی fallback می‌کنند و اجازه می‌دهند کشف در پس‌زمینه تمام شود. وقتی catalog کامل دقیق
  کشف‌شده را می‌خواهید و مایل به انتظار برای کشف ارائه‌دهنده هستید از `--all` استفاده کنید.
- اجرای گسترده `models list --all` ردیف‌های catalog در manifest را بدون load کردن hookهای supplement
  در runtime ارائه‌دهنده، روی ردیف‌های registry merge می‌کند. مسیرهای سریع manifest فیلترشده بر اساس ارائه‌دهنده
  فقط از ارائه‌دهندگانی استفاده می‌کنند که `static` علامت‌گذاری شده‌اند؛ ارائه‌دهندگان با علامت `refreshable`
  همچنان متکی به registry/cache می‌مانند و ردیف‌های manifest را به‌عنوان supplement اضافه می‌کنند، درحالی‌که
  ارائه‌دهندگان با علامت `runtime` روی کشف registry/runtime می‌مانند.
- `models list` metadata بومی مدل و capهای runtime را متمایز نگه می‌دارد. در خروجی جدول،
  وقتی یک cap مؤثر runtime با پنجره context بومی تفاوت داشته باشد، `Ctx` مقدار
  `contextTokens/contextWindow` را نشان می‌دهد؛ ردیف‌های JSON وقتی ارائه‌دهنده آن cap را expose کند
  شامل `contextTokens` می‌شوند.
- `models list --provider <id>` بر اساس id ارائه‌دهنده، مانند `moonshot` یا
  `openai-codex`، فیلتر می‌کند. labelهای نمایشی از pickerهای تعاملی ارائه‌دهنده،
  مانند `Moonshot AI`، را نمی‌پذیرد.
- refهای مدل با split کردن روی **اولین** `/` parse می‌شوند. اگر ID مدل شامل `/` است (به سبک OpenRouter)، prefix ارائه‌دهنده را اضافه کنید (مثال: `openrouter/moonshotai/kimi-k2`).
- اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا ورودی را به‌عنوان alias resolve می‌کند، سپس
  به‌عنوان یک match یکتای ارائه‌دهنده پیکربندی‌شده برای همان model id دقیق، و فقط بعد از آن
  با یک هشدار deprecation به ارائه‌دهنده پیش‌فرض پیکربندی‌شده fallback می‌کند.
  اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را expose نکند، OpenClaw
  به‌جای نمایش یک پیش‌فرض stale برای ارائه‌دهنده حذف‌شده، به اولین provider/model پیکربندی‌شده fallback می‌کند.
- `models status` ممکن است در خروجی احراز هویت برای placeholderهای غیر secret مقدار `marker(<value>)` نشان دهد (برای مثال `OPENAI_API_KEY`، ‏`secretref-managed`، ‏`minimax-oauth`، ‏`oauth:chutes`، ‏`ollama-local`) به‌جای اینکه آن‌ها را مانند secretها mask کند.

### اسکن مدل‌ها

`models scan`، catalog عمومی `:free` متعلق به OpenRouter را می‌خواند و candidateها را برای
استفاده به‌عنوان fallback رتبه‌بندی می‌کند. خود catalog عمومی است، بنابراین اسکن‌های فقط metadata
به کلید OpenRouter نیاز ندارند.

به‌صورت پیش‌فرض OpenClaw تلاش می‌کند پشتیبانی از ابزار و تصویر را با فراخوانی‌های زنده مدل probe کند.
اگر کلید OpenRouter پیکربندی نشده باشد، فرمان به خروجی فقط metadata fallback می‌کند
و توضیح می‌دهد که مدل‌های `:free` همچنان برای probeها و inference به `OPENROUTER_API_KEY` نیاز دارند.

گزینه‌ها:

- `--no-probe` (فقط metadata؛ بدون جست‌وجوی config/secretها)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout درخواست catalog و هر probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` و `--set-image` به probeهای زنده نیاز دارند؛ نتایج اسکن فقط metadata
اطلاعاتی هستند و روی config اعمال نمی‌شوند.

### وضعیت مدل‌ها

گزینه‌ها:

- `--json`
- `--plain`
- `--check` (exit 1=منقضی/مفقود، 2=در آستانه انقضا)
- `--probe` (probe زنده پروفایل‌های احراز هویت پیکربندی‌شده)
- `--probe-provider <name>` (probe یک ارائه‌دهنده)
- `--probe-profile <id>` (idهای پروفایل تکرارشده یا جداشده با کاما)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id عامل پیکربندی‌شده؛ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` را override می‌کند)

`--json`، stdout را برای payload JSON رزرو نگه می‌دارد. diagnostics مربوط به پروفایل احراز هویت،
ارائه‌دهنده، و startup به stderr هدایت می‌شوند تا scriptها بتوانند stdout را مستقیم
به ابزارهایی مانند `jq` pipe کنند.

bucketهای وضعیت probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

موردهای detail/reason-code در probe که باید انتظارشان را داشته باشید:

- `excluded_by_auth_order`: یک پروفایل ذخیره‌شده وجود دارد، اما
  `auth.order.<provider>` صریح آن را حذف کرده است، بنابراین probe به‌جای
  امتحان کردن آن، exclusion را گزارش می‌کند.
- `missing_credential`، ‏`invalid_expires`، ‏`expired`، ‏`unresolved_ref`:
  پروفایل وجود دارد اما واجد شرایط/قابل resolve نیست.
- `no_model`: احراز هویت ارائه‌دهنده وجود دارد، اما OpenClaw نتوانسته یک
  candidate مدل قابل probe برای آن ارائه‌دهنده resolve کند.

## Aliasها + fallbackها

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

`models auth add` helper تعاملی احراز هویت است. بسته به ارائه‌دهنده‌ای که انتخاب می‌کنید،
می‌تواند flow احراز هویت ارائه‌دهنده (OAuth/API key) را launch کند یا شما را برای paste دستی token راهنمایی کند.

`models auth list` پروفایل‌های احراز هویت ذخیره‌شده برای عامل انتخاب‌شده را بدون
چاپ token، ‏API-key، یا secret material مربوط به OAuth فهرست می‌کند. برای
فیلتر کردن به یک ارائه‌دهنده، مانند `openai-codex`، از `--provider <id>` و برای scripting از `--json` استفاده کنید.

`models auth login`، flow احراز هویت Plugin ارائه‌دهنده (OAuth/API key) را اجرا می‌کند. برای دیدن
ارائه‌دهندگان نصب‌شده از `openclaw plugins list` استفاده کنید.
برای نوشتن نتایج احراز هویت در store یک عامل پیکربندی‌شده مشخص، از
`openclaw models auth --agent <id> <subcommand>` استفاده کنید. flag والد `--agent` توسط
`add`، ‏`list`، ‏`login`، ‏`setup-token`، ‏`paste-token`، و
`login-github-copilot` رعایت می‌شود.

مثال‌ها:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

یادداشت‌ها:

- `setup-token` و `paste-token` برای ارائه‌دهندگانی که روش‌های احراز هویت token را expose می‌کنند،
  همچنان فرمان‌های token عمومی باقی می‌مانند.
- `setup-token` به یک TTY تعاملی نیاز دارد و روش token-auth ارائه‌دهنده را اجرا می‌کند
  (به‌صورت پیش‌فرض روش `setup-token` همان ارائه‌دهنده، وقتی یکی را expose کند).
- `paste-token` یک رشته token تولیدشده در جای دیگر یا از automation را می‌پذیرد.
- `paste-token` به `--provider` نیاز دارد، برای مقدار token prompt می‌کند، و آن را
  در id پروفایل پیش‌فرض `<provider>:manual` می‌نویسد مگر اینکه `--profile-id` را پاس دهید.
- `paste-token --expires-in <duration>` انقضای مطلق token را از یک
  duration نسبی مانند `365d` یا `12h` ذخیره می‌کند.
- یادداشت Anthropic: کارکنان Anthropic به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این integration تأییدشده تلقی می‌کند مگر اینکه Anthropic سیاست جدیدی منتشر کند.
- `setup-token` / `paste-token` مربوط به Anthropic همچنان به‌عنوان یک مسیر token پشتیبانی‌شده OpenClaw موجود هستند، اما OpenClaw اکنون هنگام موجود بودن، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [انتخاب مدل](/fa/concepts/model-providers)
- [Failover مدل](/fa/concepts/model-failover)
