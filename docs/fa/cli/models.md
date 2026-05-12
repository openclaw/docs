---
read_when:
    - می‌خواهید مدل‌های پیش‌فرض را تغییر دهید یا وضعیت احراز هویت ارائه‌دهنده را مشاهده کنید
    - می‌خواهید مدل‌ها/ارائه‌دهندگان موجود را اسکن کنید و نمایه‌های احراز هویت را اشکال‌زدایی کنید.
summary: مرجع CLI برای `openclaw models` (status/list/set/scan، نام‌های مستعار، جایگزین‌ها، احراز هویت)
title: مدل‌ها
x-i18n:
    generated_at: "2026-05-12T00:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

کشف، پویش، و پیکربندی مدل‌ها (مدل پیش‌فرض، جایگزین‌ها، نمایه‌های احراز هویت).

مرتبط:

- ارائه‌دهندگان + مدل‌ها: [مدل‌ها](/fa/providers/models)
- مفاهیم انتخاب مدل + فرمان اسلش `/models`: [مفهوم مدل‌ها](/fa/concepts/models)
- راه‌اندازی احراز هویت ارائه‌دهنده: [شروع کار](/fa/start/getting-started)

## فرمان‌های رایج

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` مقدارهای پیش‌فرض/جایگزین حل‌شده را همراه با نمای کلی احراز هویت نشان می‌دهد.
وقتی نماگرفت‌های مصرف ارائه‌دهنده در دسترس باشند، بخش وضعیت OAuth/کلید API شامل
بازه‌های مصرف ارائه‌دهنده و نماگرفت‌های سهمیه است.
ارائه‌دهندگان فعلی بازه مصرف: Anthropic، GitHub Copilot، Gemini CLI، OpenAI
Codex، MiniMax، Xiaomi، و z.ai. احراز هویت مصرف، در صورت وجود، از hookهای اختصاصی ارائه‌دهنده
گرفته می‌شود؛ در غیر این صورت OpenClaw به اعتبارنامه‌های OAuth/کلید API
مطابق از نمایه‌های احراز هویت، env، یا config برمی‌گردد.
در خروجی `--json`، `auth.providers` نمای کلی ارائه‌دهنده با آگاهی از env/config/store
است، در حالی که `auth.oauth` فقط سلامت نمایه auth-store است.
برای اجرای probeهای زنده احراز هویت در برابر هر نمایه پیکربندی‌شده ارائه‌دهنده، `--probe` را اضافه کنید.
Probeها درخواست‌های واقعی هستند (ممکن است token مصرف کنند و rate limitها را فعال کنند).
برای بررسی وضعیت مدل/احراز هویت یک agent پیکربندی‌شده، از `--agent <id>` استفاده کنید. وقتی حذف شود،
فرمان در صورت تنظیم بودن از `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` استفاده می‌کند، وگرنه از
agent پیش‌فرض پیکربندی‌شده.
ردیف‌های probe می‌توانند از نمایه‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.
برای عیب‌یابی OAuth در Codex، `openclaw models status`،
`openclaw models auth list --provider openai-codex`، و
`openclaw config get agents.defaults.model --json` سریع‌ترین راه برای
تأیید این هستند که آیا یک agent نمایه احراز هویت قابل استفاده `openai-codex` برای
`openai/*` از طریق runtime بومی Codex دارد یا نه. [راه‌اندازی ارائه‌دهنده OpenAI](/fa/providers/openai#check-and-recover-codex-oauth-routing) را ببینید.

نکته‌ها:

- `models set <model-or-alias>` مقدار `provider/model` یا یک alias را می‌پذیرد.
- `models list` فقط‌خواندنی است: config، نمایه‌های احراز هویت، وضعیت catalog موجود
  و ردیف‌های catalog متعلق به ارائه‌دهنده را می‌خواند، اما `models.json`
  را بازنویسی نمی‌کند.
- ستون `Auth` در سطح ارائه‌دهنده و فقط‌خواندنی است. این مقدار از metadata محلی
  نمایه احراز هویت، نشانگرهای env، کلیدهای پیکربندی‌شده ارائه‌دهنده، نشانگرهای ارائه‌دهنده محلی،
  نشانگرهای env/profile مربوط به AWS Bedrock، و metadata احراز هویت مصنوعی Plugin محاسبه می‌شود؛
  runtime ارائه‌دهنده را بارگذاری نمی‌کند، secretهای keychain را نمی‌خواند، APIهای
  ارائه‌دهنده را فراخوانی نمی‌کند، یا آمادگی دقیق اجرای هر مدل را اثبات نمی‌کند.
- `models list --all --provider <id>` می‌تواند ردیف‌های catalog ایستا و متعلق به ارائه‌دهنده
  را از مانیفست‌های Plugin یا metadata catalog ارائه‌دهنده bundled شامل کند، حتی وقتی
  هنوز با آن ارائه‌دهنده احراز هویت نکرده‌اید. این ردیف‌ها تا زمانی که احراز هویت
  مطابق پیکربندی نشود همچنان ناموجود نشان داده می‌شوند.
- `models list` در حالی که کشف catalog ارائه‌دهنده کند است، control plane را پاسخ‌گو نگه می‌دارد.
  نماهای پیش‌فرض و پیکربندی‌شده پس از یک انتظار کوتاه به ردیف‌های مدل پیکربندی‌شده یا
  مصنوعی برمی‌گردند و می‌گذارند کشف در پس‌زمینه تمام شود. وقتی به catalog دقیق و کامل
  کشف‌شده نیاز دارید و مایلید منتظر کشف ارائه‌دهنده بمانید، از `--all` استفاده کنید.
- `models list --all` گسترده، ردیف‌های catalog مانیفست را بدون بارگذاری hookهای مکمل runtime
  ارائه‌دهنده، روی ردیف‌های registry ادغام می‌کند. مسیرهای سریع مانیفست فیلترشده با ارائه‌دهنده
  فقط از ارائه‌دهندگانی استفاده می‌کنند که با `static` علامت‌گذاری شده‌اند؛ ارائه‌دهندگانی که با `refreshable`
  علامت‌گذاری شده‌اند بر پایه registry/cache می‌مانند و ردیف‌های مانیفست را به‌عنوان مکمل اضافه می‌کنند، در حالی که
  ارائه‌دهندگان علامت‌گذاری‌شده با `runtime` روی کشف registry/runtime باقی می‌مانند.
- `models list` metadata مدل بومی و سقف‌های runtime را جدا نگه می‌دارد. در خروجی جدولی،
  `Ctx` وقتی یک سقف runtime مؤثر با پنجره context بومی تفاوت داشته باشد `contextTokens/contextWindow`
  را نشان می‌دهد؛ ردیف‌های JSON وقتی ارائه‌دهنده آن سقف را expose کند شامل `contextTokens`
  هستند.
- `models list --provider <id>` بر اساس شناسه ارائه‌دهنده، مانند `moonshot` یا
  `openai-codex`، فیلتر می‌کند. برچسب‌های نمایشی از انتخاب‌گرهای تعاملی ارائه‌دهنده،
  مانند `Moonshot AI`، را نمی‌پذیرد.
- ارجاع‌های مدل با تقسیم روی **اولین** `/` parse می‌شوند. اگر شناسه مدل شامل `/` باشد (به سبک OpenRouter)، پیشوند ارائه‌دهنده را وارد کنید (مثال: `openrouter/moonshotai/kimi-k2`).
- اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا ورودی را به‌عنوان alias حل می‌کند، سپس
  به‌عنوان تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط پس از آن
  با یک هشدار deprecation به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد.
  اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را expose نکند، OpenClaw
  به‌جای نمایش یک پیش‌فرض کهنه مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده
  برمی‌گردد.
- `models status` ممکن است در خروجی احراز هویت برای placeholderهای غیرsecret (برای مثال `OPENAI_API_KEY`، `secretref-managed`، `minimax-oauth`، `oauth:chutes`، `ollama-local`) به‌جای mask کردن آن‌ها به‌عنوان secret، `marker(<value>)` نشان دهد.

### پویش مدل‌ها

`models scan` catalog عمومی `:free` متعلق به OpenRouter را می‌خواند و candidateها را برای
استفاده به‌عنوان fallback رتبه‌بندی می‌کند. خود catalog عمومی است، بنابراین پویش‌های فقط metadata به
کلید OpenRouter نیاز ندارند.

به‌طور پیش‌فرض OpenClaw تلاش می‌کند پشتیبانی tool و image را با فراخوانی‌های زنده مدل probe کند.
اگر هیچ کلید OpenRouter پیکربندی نشده باشد، فرمان به خروجی فقط metadata
برمی‌گردد و توضیح می‌دهد که مدل‌های `:free` همچنان برای probe و inference به
`OPENROUTER_API_KEY` نیاز دارند.

گزینه‌ها:

- `--no-probe` (فقط metadata؛ بدون جست‌وجوی config/secrets)
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

`--set-default` و `--set-image` به probeهای زنده نیاز دارند؛ نتایج پویش فقط metadata
اطلاعاتی هستند و روی config اعمال نمی‌شوند.

### وضعیت مدل‌ها

گزینه‌ها:

- `--json`
- `--plain`
- `--check` (exit 1=منقضی/مفقود، 2=در حال انقضا)
- `--probe` (probe زنده نمایه‌های احراز هویت پیکربندی‌شده)
- `--probe-provider <name>` (probe یک ارائه‌دهنده)
- `--probe-profile <id>` (شناسه‌های profile تکراری یا جداشده با کاما)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (شناسه agent پیکربندی‌شده؛ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` را override می‌کند)

`--json` stdout را برای payload JSON رزرو نگه می‌دارد. تشخیص‌های auth-profile، ارائه‌دهنده،
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

موردهای detail/reason-code مربوط به probe که باید انتظار داشته باشید:

- `excluded_by_auth_order`: یک profile ذخیره‌شده وجود دارد، اما
  `auth.order.<provider>` صریح آن را حذف کرده است، بنابراین probe به‌جای
  تلاش برای آن، حذف را گزارش می‌کند.
- `missing_credential`، `invalid_expires`، `expired`، `unresolved_ref`:
  profile وجود دارد اما eligible/resolvable نیست.
- `no_model`: احراز هویت ارائه‌دهنده وجود دارد، اما OpenClaw نتوانست یک
  candidate مدل قابل probe برای آن ارائه‌دهنده حل کند.

## Aliasها + fallbackها

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## نمایه‌های احراز هویت

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` helper تعاملی احراز هویت است. بسته به
ارائه‌دهنده‌ای که انتخاب می‌کنید، می‌تواند جریان احراز هویت ارائه‌دهنده
(OAuth/کلید API) را اجرا کند یا شما را به paste دستی token راهنمایی کند.

`models auth list` نمایه‌های احراز هویت ذخیره‌شده برای agent انتخاب‌شده را بدون
چاپ token، کلید API، یا مواد secret مربوط به OAuth فهرست می‌کند. از `--provider <id>` برای
فیلتر کردن به یک ارائه‌دهنده، مانند `openai-codex`، و از `--json` برای scripting استفاده کنید.

`models auth login` جریان احراز هویت Plugin ارائه‌دهنده (OAuth/کلید API) را اجرا می‌کند. از
`openclaw plugins list` استفاده کنید تا ببینید کدام ارائه‌دهندگان نصب شده‌اند.
برای نوشتن نتایج احراز هویت در store یک agent پیکربندی‌شده مشخص، از
`openclaw models auth --agent <id> <subcommand>` استفاده کنید. پرچم parent `--agent` توسط
`add`، `list`، `login`، `setup-token`، `paste-token`، و
`login-github-copilot` رعایت می‌شود.

برای مدل‌های OpenAI، `--provider openai` به‌طور پیش‌فرض از ورود با حساب ChatGPT/Codex استفاده می‌کند.
فقط وقتی از `--method api-key` استفاده کنید که می‌خواهید یک profile کلید API مربوط به OpenAI اضافه کنید،
معمولاً به‌عنوان پشتیبان برای محدودیت‌های subscription مربوط به Codex. نگارش قدیمی
`--provider openai-codex` همچنان برای scriptهای موجود کار می‌کند.

مثال‌ها:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

نکته‌ها:

- `setup-token` و `paste-token` برای ارائه‌دهندگانی که روش‌های احراز هویت token را expose می‌کنند،
  همچنان فرمان‌های token عمومی باقی می‌مانند.
- `setup-token` به TTY تعاملی نیاز دارد و روش احراز هویت token ارائه‌دهنده را اجرا می‌کند
  (به‌طور پیش‌فرض روش `setup-token` همان ارائه‌دهنده، وقتی یکی را expose کند).
- `paste-token` یک رشته token تولیدشده در جای دیگر یا از automation را می‌پذیرد.
- `paste-token` به `--provider` نیاز دارد، مقدار token را prompt می‌کند، و آن را
  در شناسه profile پیش‌فرض `<provider>:manual` می‌نویسد، مگر اینکه
  `--profile-id` را پاس دهید.
- `paste-token --expires-in <duration>` یک انقضای مطلق token را از یک
  duration نسبی مانند `365d` یا `12h` ذخیره می‌کند.
- نکته Anthropic: کارکنان Anthropic به ما گفتند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این یکپارچه‌سازی مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند.
- `setup-token` / `paste-token` مربوط به Anthropic همچنان به‌عنوان یک مسیر token پشتیبانی‌شده OpenClaw در دسترس هستند، اما OpenClaw اکنون در صورت وجود، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [انتخاب مدل](/fa/concepts/model-providers)
- [failover مدل](/fa/concepts/model-failover)
