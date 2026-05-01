---
read_when:
    - می‌خواهید مدل‌های پیش‌فرض را تغییر دهید یا وضعیت احراز هویت ارائه‌دهنده را مشاهده کنید
    - می‌خواهید مدل‌ها/ارائه‌دهندگان موجود را بررسی کنید و پروفایل‌های احراز هویت را اشکال‌زدایی کنید
summary: مرجع CLI برای `openclaw models` (status/list/set/scan، نام‌های مستعار، گزینه‌های جایگزین، احراز هویت)
title: مدل‌ها
x-i18n:
    generated_at: "2026-05-01T11:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 538d3e4808329737fdc044dc6e14e5c7c78052e75d8a8b3b257b1ebd821c84d1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

کشف، اسکن و پیکربندی مدل‌ها (مدل پیش‌فرض، گزینه‌های پشتیبان، نمایه‌های احراز هویت).

مرتبط:

- ارائه‌دهنده‌ها + مدل‌ها: [مدل‌ها](/fa/providers/models)
- مفاهیم انتخاب مدل + دستور اسلش `/models`: [مفهوم مدل‌ها](/fa/concepts/models)
- راه‌اندازی احراز هویت ارائه‌دهنده: [شروع به کار](/fa/start/getting-started)

## دستورهای رایج

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` پیش‌فرض/گزینه‌های پشتیبان حل‌شده را همراه با یک نمای کلی احراز هویت نشان می‌دهد.
وقتی عکس‌برداشت‌های مصرف ارائه‌دهنده در دسترس باشند، بخش وضعیت OAuth/API-key شامل
بازه‌های مصرف ارائه‌دهنده و عکس‌برداشت‌های سهمیه است.
ارائه‌دهنده‌های فعلی بازه مصرف: Anthropic، GitHub Copilot، Gemini CLI، OpenAI
Codex، MiniMax، Xiaomi، و z.ai. احراز هویت مصرف، در صورت وجود، از hookهای
اختصاصی ارائه‌دهنده می‌آید؛ در غیر این صورت OpenClaw به اعتبارنامه‌های OAuth/API-key
منطبق از نمایه‌های احراز هویت، env، یا پیکربندی fallback می‌کند.
در خروجی `--json`، `auth.providers` نمای کلی ارائه‌دهنده آگاه از env/config/store
است، در حالی که `auth.oauth` فقط سلامت نمایه‌های auth-store است.
برای اجرای probeهای زنده احراز هویت روی هر نمایه ارائه‌دهنده پیکربندی‌شده، `--probe` را اضافه کنید.
Probeها درخواست‌های واقعی هستند (ممکن است توکن مصرف کنند و rate limit را فعال کنند).
برای بررسی وضعیت مدل/احراز هویت یک agent پیکربندی‌شده، از `--agent <id>` استفاده کنید. وقتی حذف شود،
دستور در صورت تنظیم بودن از `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` استفاده می‌کند، وگرنه از
agent پیش‌فرض پیکربندی‌شده استفاده می‌کند.
ردیف‌های probe می‌توانند از نمایه‌های احراز هویت، اعتبارنامه‌های env، یا `models.json` بیایند.

نکته‌ها:

- `models set <model-or-alias>` مقدار `provider/model` یا یک نام مستعار را می‌پذیرد.
- `models list` فقط‌خواندنی است: پیکربندی، نمایه‌های احراز هویت، وضعیت کاتالوگ موجود
  و ردیف‌های کاتالوگ متعلق به ارائه‌دهنده را می‌خواند، اما `models.json` را بازنویسی
  نمی‌کند.
- ستون `Auth` در سطح ارائه‌دهنده و فقط‌خواندنی است. این ستون از فراداده نمایه احراز هویت محلی،
  نشانگرهای env، کلیدهای ارائه‌دهنده پیکربندی‌شده، نشانگرهای ارائه‌دهنده محلی،
  نشانگرهای env/profile مربوط به AWS Bedrock و فراداده synthetic-auth مربوط به Plugin محاسبه می‌شود؛
  runtime ارائه‌دهنده را بارگذاری نمی‌کند، secretهای keychain را نمی‌خواند، APIهای ارائه‌دهنده را
  فراخوانی نمی‌کند، یا آمادگی دقیق اجرای هر مدل را اثبات نمی‌کند.
- `models list --all --provider <id>` می‌تواند ردیف‌های کاتالوگ ایستای متعلق به ارائه‌دهنده
  را از مانیفست‌های Plugin یا فراداده کاتالوگ ارائه‌دهنده‌های بسته‌بندی‌شده شامل کند، حتی وقتی
  هنوز با آن ارائه‌دهنده احراز هویت نکرده‌اید. آن ردیف‌ها تا وقتی احراز هویت منطبق پیکربندی نشده باشد
  همچنان unavailable نشان داده می‌شوند.
- `models list` در زمانی که کشف کاتالوگ ارائه‌دهنده کند است، control plane را پاسخ‌گو نگه می‌دارد.
  نماهای پیش‌فرض و پیکربندی‌شده پس از یک انتظار کوتاه به ردیف‌های مدل پیکربندی‌شده یا
  synthetic fallback می‌کنند و اجازه می‌دهند کشف در پس‌زمینه تمام شود.
  وقتی به کاتالوگ کامل کشف‌شده دقیق نیاز دارید و مایلید منتظر کشف ارائه‌دهنده بمانید، از `--all` استفاده کنید.
- `models list --all` گسترده، ردیف‌های کاتالوگ مانیفست را بدون بارگذاری hookهای تکمیلی runtime ارائه‌دهنده
  روی ردیف‌های رجیستری merge می‌کند. مسیرهای سریع مانیفست فیلترشده بر اساس ارائه‌دهنده فقط از
  ارائه‌دهنده‌هایی استفاده می‌کنند که `static` علامت‌گذاری شده‌اند؛ ارائه‌دهنده‌هایی که `refreshable`
  علامت‌گذاری شده‌اند registry/cache-backed می‌مانند و ردیف‌های مانیفست را به‌عنوان مکمل append می‌کنند،
  در حالی که ارائه‌دهنده‌هایی که `runtime` علامت‌گذاری شده‌اند روی کشف registry/runtime می‌مانند.
- `models list` فراداده native مدل و سقف‌های runtime را جدا نگه می‌دارد. در خروجی جدولی،
  `Ctx` وقتی یک سقف runtime مؤثر با پنجره context بومی فرق داشته باشد، `contextTokens/contextWindow` را نشان می‌دهد؛
  ردیف‌های JSON وقتی یک ارائه‌دهنده آن سقف را expose کند، `contextTokens` را شامل می‌شوند.
- `models list --provider <id>` بر اساس شناسه ارائه‌دهنده، مثل `moonshot` یا
  `openai-codex`، فیلتر می‌کند. این دستور برچسب‌های نمایشی از انتخاب‌گرهای تعاملی ارائه‌دهنده،
  مثل `Moonshot AI`، را نمی‌پذیرد.
- ارجاع‌های مدل با جدا کردن بر اساس **اولین** `/` parse می‌شوند. اگر شناسه مدل شامل `/` است (سبک OpenRouter)، پیشوند ارائه‌دهنده را شامل کنید (نمونه: `openrouter/moonshotai/kimi-k2`).
- اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا ورودی را به‌عنوان نام مستعار resolve می‌کند، سپس
  به‌عنوان یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط پس از آن
  با یک هشدار deprecation به ارائه‌دهنده پیش‌فرض پیکربندی‌شده fallback می‌کند.
  اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را expose نکند، OpenClaw
  به‌جای نمایش یک پیش‌فرض کهنه از ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده
  fallback می‌کند.
- `models status` ممکن است در خروجی احراز هویت برای placeholderهای غیرمحرمانه (برای مثال `OPENAI_API_KEY`، `secretref-managed`، `minimax-oauth`، `oauth:chutes`، `ollama-local`) به‌جای mask کردن آن‌ها به‌عنوان secret، `marker(<value>)` را نشان دهد.

### اسکن مدل‌ها

`models scan` کاتالوگ عمومی `:free` متعلق به OpenRouter را می‌خواند و نامزدها را برای
استفاده fallback رتبه‌بندی می‌کند. خود کاتالوگ عمومی است، بنابراین اسکن‌های فقط‌فراداده به
کلید OpenRouter نیاز ندارند.

به‌صورت پیش‌فرض OpenClaw تلاش می‌کند پشتیبانی ابزار و تصویر را با فراخوانی‌های زنده مدل probe کند.
اگر هیچ کلید OpenRouter پیکربندی نشده باشد، دستور به خروجی فقط‌فراداده fallback می‌کند
و توضیح می‌دهد که مدل‌های `:free` همچنان برای probeها و inference به `OPENROUTER_API_KEY` نیاز دارند.

گزینه‌ها:

- `--no-probe` (فقط فراداده؛ بدون lookup پیکربندی/secret)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (درخواست کاتالوگ و timeout هر probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` و `--set-image` به probeهای زنده نیاز دارند؛ نتایج اسکن فقط‌فراداده
اطلاعاتی هستند و روی پیکربندی اعمال نمی‌شوند.

### وضعیت مدل‌ها

گزینه‌ها:

- `--json`
- `--plain`
- `--check` (exit 1=expired/missing, 2=expiring)
- `--probe` (probe زنده نمایه‌های احراز هویت پیکربندی‌شده)
- `--probe-provider <name>` (probe یک ارائه‌دهنده)
- `--probe-profile <id>` (شناسه‌های نمایه تکرارشونده یا جداشده با ویرگول)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (شناسه agent پیکربندی‌شده؛ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` را override می‌کند)

`--json` stdout را برای payload JSON رزرو نگه می‌دارد. diagnostics مربوط به auth-profile، ارائه‌دهنده،
و startup به stderr هدایت می‌شوند تا scriptها بتوانند stdout را مستقیم
به ابزارهایی مثل `jq` pipe کنند.

bucketهای وضعیت probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

موارد detail/reason-code مربوط به probe که باید انتظار داشته باشید:

- `excluded_by_auth_order`: یک نمایه ذخیره‌شده وجود دارد، اما `auth.order.<provider>` صریح
  آن را حذف کرده است، بنابراین probe به‌جای امتحان کردن آن، exclusion را گزارش می‌کند.
- `missing_credential`، `invalid_expires`، `expired`، `unresolved_ref`:
  نمایه وجود دارد اما واجد شرایط/قابل resolve نیست.
- `no_model`: احراز هویت ارائه‌دهنده وجود دارد، اما OpenClaw نتوانست یک نامزد مدل قابل probe
  برای آن ارائه‌دهنده resolve کند.

## نام‌های مستعار + گزینه‌های پشتیبان

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## نمایه‌های احراز هویت

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` کمک‌کننده تعاملی احراز هویت است. بسته به ارائه‌دهنده‌ای که انتخاب می‌کنید،
می‌تواند یک جریان احراز هویت ارائه‌دهنده (OAuth/API key) را اجرا کند یا شما را برای paste دستی token راهنمایی کند.

`models auth login` جریان احراز هویت Plugin ارائه‌دهنده (OAuth/API key) را اجرا می‌کند. برای دیدن اینکه
کدام ارائه‌دهنده‌ها نصب شده‌اند از `openclaw plugins list` استفاده کنید.
برای نوشتن نتایج احراز هویت در store یک agent پیکربندی‌شده مشخص، از
`openclaw models auth --agent <id> <subcommand>` استفاده کنید. flag والد `--agent` توسط
`add`، `login`، `setup-token`، `paste-token` و `login-github-copilot` رعایت می‌شود.

نمونه‌ها:

```bash
openclaw models auth login --provider openai-codex --set-default
```

نکته‌ها:

- `setup-token` و `paste-token` برای ارائه‌دهنده‌هایی که methodهای احراز هویت token را expose می‌کنند،
  دستورهای عمومی token باقی می‌مانند.
- `setup-token` به یک TTY تعاملی نیاز دارد و method احراز هویت token ارائه‌دهنده را اجرا می‌کند
  (به‌صورت پیش‌فرض method همان ارائه‌دهنده با نام `setup-token` وقتی چنین موردی را expose کند).
- `paste-token` یک رشته token تولیدشده در جای دیگر یا از automation را می‌پذیرد.
- `paste-token` به `--provider` نیاز دارد، مقدار token را prompt می‌کند، و آن را در
  شناسه نمایه پیش‌فرض `<provider>:manual` می‌نویسد مگر اینکه `--profile-id` را پاس دهید.
- `paste-token --expires-in <duration>` انقضای مطلق token را از یک مدت نسبی مثل
  `365d` یا `12h` ذخیره می‌کند.
- نکته Anthropic: کارکنان Anthropic به ما گفتند که استفاده به سبک OpenClaw از Claude CLI دوباره مجاز است، بنابراین OpenClaw استفاده دوباره از Claude CLI و استفاده از `claude -p` را برای این integration مجاز تلقی می‌کند مگر اینکه Anthropic سیاست تازه‌ای منتشر کند.
- `setup-token` / `paste-token` مربوط به Anthropic همچنان به‌عنوان یک مسیر token پشتیبانی‌شده OpenClaw در دسترس می‌مانند، اما OpenClaw اکنون در صورت وجود، استفاده دوباره از Claude CLI و `claude -p` را ترجیح می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [انتخاب مدل](/fa/concepts/model-providers)
- [failover مدل](/fa/concepts/model-failover)
