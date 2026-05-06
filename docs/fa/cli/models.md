---
read_when:
    - می‌خواهید مدل‌های پیش‌فرض را تغییر دهید یا وضعیت احراز هویت ارائه‌دهنده را مشاهده کنید
    - می‌خواهید مدل‌ها/ارائه‌دهندگان موجود را پویش کنید و پروفایل‌های احراز هویت را اشکال‌زدایی کنید.
summary: مرجع CLI برای `openclaw models` (status/list/set/scan، نام‌های مستعار، جایگزین‌ها، احراز هویت)
title: مدل‌ها
x-i18n:
    generated_at: "2026-05-06T19:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

کشف، پویش، و پیکربندی مدل‌ها (مدل پیش‌فرض، جایگزین‌ها، پروفایل‌های احراز هویت).

مرتبط:

- ارائه‌دهنده‌ها + مدل‌ها: [مدل‌ها](/fa/providers/models)
- مفاهیم انتخاب مدل + فرمان اسلش `/models`: [مفهوم مدل‌ها](/fa/concepts/models)
- راه‌اندازی احراز هویت ارائه‌دهنده: [شروع به کار](/fa/start/getting-started)

## فرمان‌های رایج

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` مقدارهای پیش‌فرض/جایگزین‌های حل‌شده را همراه با نمای کلی احراز هویت نشان می‌دهد.
وقتی تصویرهای لحظه‌ای مصرف ارائه‌دهنده در دسترس باشند، بخش وضعیت OAuth/API-key شامل
پنجره‌های مصرف ارائه‌دهنده و تصویرهای لحظه‌ای سهمیه است.
ارائه‌دهنده‌های فعلی پنجره مصرف: Anthropic، GitHub Copilot، Gemini CLI، OpenAI
Codex، MiniMax، Xiaomi، و z.ai. احراز هویت مصرف، در صورت وجود، از hookهای مخصوص ارائه‌دهنده
می‌آید؛ در غیر این صورت OpenClaw به اطلاعات احراز هویت OAuth/API-key
مطابق از پروفایل‌های احراز هویت، env، یا config برمی‌گردد.
در خروجی `--json`، `auth.providers` نمای کلی ارائه‌دهنده آگاه از env/config/store
است، در حالی که `auth.oauth` فقط سلامت پروفایل auth-store است.
برای اجرای پروب‌های زنده احراز هویت روی هر پروفایل پیکربندی‌شده ارائه‌دهنده، `--probe` را اضافه کنید.
پروب‌ها درخواست‌های واقعی هستند (ممکن است token مصرف کنند و rate limitها را فعال کنند).
برای بررسی وضعیت مدل/احراز هویت یک agent پیکربندی‌شده از `--agent <id>` استفاده کنید. وقتی حذف شود،
فرمان اگر `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` تنظیم شده باشد از آن استفاده می‌کند، وگرنه از
agent پیش‌فرض پیکربندی‌شده استفاده می‌کند.
ردیف‌های پروب می‌توانند از پروفایل‌های احراز هویت، اطلاعات احراز هویت env، یا `models.json` بیایند.
برای عیب‌یابی OAuth مربوط به Codex، `openclaw models status`،
`openclaw models auth list --provider openai-codex`، و
`openclaw config get agents.defaults.model --json` سریع‌ترین راه برای
تایید این است که آیا یک agent از `openai-codex/*` از طریق PI استفاده می‌کند یا از `openai/*`
از طریق runtime بومی Codex. [راه‌اندازی ارائه‌دهنده OpenAI](/fa/providers/openai#check-and-recover-codex-oauth-routing) را ببینید.

نکات:

- `models set <model-or-alias>` مقدار `provider/model` یا یک نام مستعار را می‌پذیرد.
- `models list` فقط خواندنی است: config، پروفایل‌های احراز هویت، وضعیت catalog موجود
  و ردیف‌های catalog متعلق به ارائه‌دهنده را می‌خواند، اما
  `models.json` را بازنویسی نمی‌کند.
- ستون `Auth` در سطح ارائه‌دهنده و فقط خواندنی است. این مقدار از metadata پروفایل احراز هویت محلی،
  نشانگرهای env، کلیدهای ارائه‌دهنده پیکربندی‌شده، نشانگرهای ارائه‌دهنده محلی،
  نشانگرهای env/profile مربوط به AWS Bedrock، و metadata احراز هویت ساختگی Plugin محاسبه می‌شود؛
  runtime ارائه‌دهنده را بارگذاری نمی‌کند، secretهای keychain را نمی‌خواند، APIهای ارائه‌دهنده را فراخوانی نمی‌کند،
  یا آمادگی دقیق اجرای هر مدل را اثبات نمی‌کند.
- `models list --all --provider <id>` می‌تواند ردیف‌های catalog ایستای متعلق به ارائه‌دهنده
  از manifestهای Plugin یا metadata catalog ارائه‌دهنده‌های bundled را حتی وقتی هنوز
  با آن ارائه‌دهنده احراز هویت نکرده‌اید شامل شود. آن ردیف‌ها همچنان تا زمانی که
  احراز هویت مطابق پیکربندی شود، unavailable نشان داده می‌شوند.
- `models list` هنگامی که کشف catalog ارائه‌دهنده کند است، control plane را پاسخ‌گو نگه می‌دارد.
  نماهای پیش‌فرض و پیکربندی‌شده پس از یک انتظار کوتاه به ردیف‌های مدل پیکربندی‌شده یا
  ساختگی برمی‌گردند و اجازه می‌دهند کشف در پس‌زمینه تمام شود.
  وقتی به catalog کامل و دقیق کشف‌شده نیاز دارید و حاضرید منتظر کشف ارائه‌دهنده بمانید، از `--all` استفاده کنید.
- `models list --all` گسترده، ردیف‌های manifest catalog را روی ردیف‌های registry ادغام می‌کند
  بدون آنکه hookهای مکمل runtime ارائه‌دهنده را بارگذاری کند. مسیرهای سریع manifest فیلترشده با ارائه‌دهنده
  فقط از ارائه‌دهنده‌هایی استفاده می‌کنند که `static` علامت‌گذاری شده‌اند؛ ارائه‌دهنده‌هایی که `refreshable`
  علامت‌گذاری شده‌اند registry/cache-backed می‌مانند و ردیف‌های manifest را به‌عنوان مکمل اضافه می‌کنند، در حالی که
  ارائه‌دهنده‌هایی که `runtime` علامت‌گذاری شده‌اند روی کشف registry/runtime باقی می‌مانند.
- `models list` metadata بومی مدل و caps مربوط به runtime را جدا نگه می‌دارد. در خروجی جدول،
  `Ctx` وقتی یک cap موثر runtime با پنجره context بومی متفاوت باشد، `contextTokens/contextWindow` را نشان می‌دهد؛ ردیف‌های JSON وقتی یک ارائه‌دهنده آن cap را expose کند، شامل `contextTokens` هستند.
- `models list --provider <id>` بر اساس id ارائه‌دهنده فیلتر می‌کند، مانند `moonshot` یا
  `openai-codex`. این فرمان labelهای نمایشی از pickerهای تعاملی ارائه‌دهنده،
  مانند `Moonshot AI` را نمی‌پذیرد.
- ارجاع‌های مدل با جدا کردن روی **اولین** `/` parse می‌شوند. اگر ID مدل شامل `/` است (به سبک OpenRouter)، پیشوند ارائه‌دهنده را وارد کنید (مثال: `openrouter/moonshotai/kimi-k2`).
- اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا ورودی را به‌عنوان نام مستعار resolve می‌کند، سپس
  به‌عنوان یک تطبیق یکتای ارائه‌دهنده پیکربندی‌شده برای همان id دقیق مدل، و فقط پس از آن
  با هشدار deprecation به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد.
  اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را expose نکند، OpenClaw
  به‌جای نشان دادن پیش‌فرض قدیمیِ ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
- `models status` ممکن است در خروجی احراز هویت برای placeholderهای غیرمحرمانه (برای مثال `OPENAI_API_KEY`، `secretref-managed`، `minimax-oauth`، `oauth:chutes`، `ollama-local`) به‌جای mask کردن آن‌ها به‌عنوان secret، `marker(<value>)` را نشان دهد.

### پویش مدل‌ها

`models scan` catalog عمومی `:free` متعلق به OpenRouter را می‌خواند و candidateها را برای
استفاده به‌عنوان جایگزین رتبه‌بندی می‌کند. خود catalog عمومی است، پس پویش‌های فقط metadata به
کلید OpenRouter نیاز ندارند.

به‌طور پیش‌فرض OpenClaw تلاش می‌کند پشتیبانی ابزار و تصویر را با فراخوانی‌های زنده مدل probe کند.
اگر هیچ کلید OpenRouter پیکربندی نشده باشد، فرمان به خروجی فقط metadata برمی‌گردد
و توضیح می‌دهد که مدل‌های `:free` همچنان برای probeها و inference به `OPENROUTER_API_KEY` نیاز دارند.

گزینه‌ها:

- `--no-probe` (فقط metadata؛ بدون lookup برای config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (درخواست catalog و timeout هر probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` و `--set-image` به probeهای زنده نیاز دارند؛ نتیجه‌های پویش فقط metadata
اطلاع‌رسان هستند و روی config اعمال نمی‌شوند.

### وضعیت مدل‌ها

گزینه‌ها:

- `--json`
- `--plain`
- `--check` (exit 1=expired/missing، 2=expiring)
- `--probe` (probe زنده پروفایل‌های احراز هویت پیکربندی‌شده)
- `--probe-provider <name>` (probe یک ارائه‌دهنده)
- `--probe-profile <id>` (idهای پروفایل تکراری یا جداشده با ویرگول)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent پیکربندی‌شده؛ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` را override می‌کند)

`--json` stdout را برای payload JSON رزرو نگه می‌دارد. diagnostics مربوط به auth-profile، ارائه‌دهنده،
و startup به stderr هدایت می‌شوند تا scriptها بتوانند stdout را مستقیم
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

حالت‌های detail/reason-code مربوط به probe که باید انتظارشان را داشته باشید:

- `excluded_by_auth_order`: یک پروفایل ذخیره‌شده وجود دارد، اما
  `auth.order.<provider>` صریح آن را حذف کرده است، بنابراین probe به‌جای
  تلاش برای آن، exclusion را گزارش می‌کند.
- `missing_credential`، `invalid_expires`، `expired`، `unresolved_ref`:
  پروفایل وجود دارد اما eligible/resolvable نیست.
- `no_model`: احراز هویت ارائه‌دهنده وجود دارد، اما OpenClaw نتوانسته یک candidate
  مدل قابل probe برای آن ارائه‌دهنده resolve کند.

## نام‌های مستعار + جایگزین‌ها

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

`models auth add` راهنمای تعاملی احراز هویت است. بسته به ارائه‌دهنده‌ای که انتخاب می‌کنید،
می‌تواند flow احراز هویت ارائه‌دهنده (OAuth/API key) را اجرا کند یا شما را به paste دستی token راهنمایی کند.

`models auth list` پروفایل‌های احراز هویت ذخیره‌شده را برای agent انتخاب‌شده
بدون چاپ token، API-key، یا material محرمانه OAuth فهرست می‌کند. برای
فیلتر کردن به یک ارائه‌دهنده، مانند `openai-codex`، از `--provider <id>` و برای scripting از `--json` استفاده کنید.

`models auth login` flow احراز هویت Plugin ارائه‌دهنده (OAuth/API key) را اجرا می‌کند. برای
دیدن اینکه کدام ارائه‌دهنده‌ها نصب شده‌اند از `openclaw plugins list` استفاده کنید.
برای نوشتن نتیجه‌های احراز هویت در store یک agent پیکربندی‌شده مشخص، از
`openclaw models auth --agent <id> <subcommand>` استفاده کنید. flag والد `--agent` توسط
`add`، `list`، `login`، `setup-token`، `paste-token`، و
`login-github-copilot` رعایت می‌شود.

مثال‌ها:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

نکات:

- `setup-token` و `paste-token` برای ارائه‌دهنده‌هایی که methodهای احراز هویت token را expose می‌کنند،
  فرمان‌های عمومی token باقی می‌مانند.
- `setup-token` به TTY تعاملی نیاز دارد و method احراز هویت token ارائه‌دهنده را اجرا می‌کند
  (وقتی ارائه‌دهنده method `setup-token` را expose کند، به‌طور پیش‌فرض از همان method استفاده می‌کند).
- `paste-token` یک رشته token تولیدشده در جای دیگر یا از automation را می‌پذیرد.
- `paste-token` به `--provider` نیاز دارد، مقدار token را درخواست می‌کند، و آن را
  در id پروفایل پیش‌فرض `<provider>:manual` می‌نویسد مگر اینکه `--profile-id` را pass کنید.
- `paste-token --expires-in <duration>` انقضای مطلق token را از یک مدت نسبی
  مانند `365d` یا `12h` ذخیره می‌کند.
- نکته Anthropic: کارکنان Anthropic به ما گفته‌اند که استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این integration مجاز تلقی می‌کند مگر اینکه Anthropic policy جدیدی منتشر کند.
- `setup-token` / `paste-token` مربوط به Anthropic همچنان به‌عنوان یک مسیر token پشتیبانی‌شده OpenClaw در دسترس هستند، اما OpenClaw اکنون در صورت وجود، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [انتخاب مدل](/fa/concepts/model-providers)
- [failover مدل](/fa/concepts/model-failover)
