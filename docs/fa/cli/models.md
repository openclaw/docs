---
read_when:
    - می‌خواهید مدل‌های پیش‌فرض را تغییر دهید یا وضعیت احراز هویت ارائه‌دهنده را ببینید
    - می‌خواهید مدل‌ها/ارائه‌دهندگان موجود را اسکن کنید و پروفایل‌های احراز هویت را اشکال‌زدایی کنید
summary: مرجع CLI برای `openclaw models` (status/list/set/scan، نام‌های مستعار، fallbackها، احراز هویت)
title: مدل‌ها
x-i18n:
    generated_at: "2026-06-27T17:25:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

کشف، پویش و پیکربندی مدل (مدل پیش‌فرض، جایگزین‌ها، پروفایل‌های احراز هویت).

مرتبط:

- ارائه‌دهندگان + مدل‌ها: [مدل‌ها](/fa/providers/models)
- مفاهیم انتخاب مدل + فرمان اسلش `/models`: [مفهوم مدل‌ها](/fa/concepts/models)
- راه‌اندازی احراز هویت ارائه‌دهنده: [شروع به کار](/fa/start/getting-started)

## فرمان‌های رایج

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` پیش‌فرض/جایگزین‌های حل‌شده را همراه با نمای کلی احراز هویت نشان می‌دهد.
وقتی نماهای لحظه‌ای استفاده از ارائه‌دهنده در دسترس باشند، بخش وضعیت OAuth/API-key
شامل پنجره‌های استفاده ارائه‌دهنده و نماهای لحظه‌ای سهمیه است.
ارائه‌دهندگان فعلی پنجره استفاده: Anthropic، GitHub Copilot، Gemini CLI، OpenAI،
MiniMax، Xiaomi و z.ai. احراز هویت استفاده، در صورت وجود، از هوک‌های اختصاصی ارائه‌دهنده
می‌آید؛ در غیر این صورت OpenClaw به اعتبارنامه‌های OAuth/API-key مطابق
از پروفایل‌های احراز هویت، env یا پیکربندی بازمی‌گردد.
در خروجی `--json`، `auth.providers` نمای کلی ارائه‌دهنده آگاه از env/config/store
است، در حالی که `auth.oauth` فقط سلامت پروفایل auth-store است.
برای اجرای پروب‌های زنده احراز هویت روی هر پروفایل ارائه‌دهنده پیکربندی‌شده، `--probe` را اضافه کنید.
پروب‌ها درخواست‌های واقعی هستند (ممکن است توکن مصرف کنند و محدودیت نرخ را فعال کنند).
برای بررسی وضعیت مدل/احراز هویت یک عامل پیکربندی‌شده، از `--agent <id>` استفاده کنید. وقتی حذف شود،
فرمان اگر `OPENCLAW_AGENT_DIR` تنظیم شده باشد از آن استفاده می‌کند، وگرنه از
عامل پیش‌فرض پیکربندی‌شده استفاده می‌کند.
ردیف‌های پروب می‌توانند از پروفایل‌های احراز هویت، اعتبارنامه‌های env یا `models.json` بیایند.
برای عیب‌یابی OAuth مربوط به OpenAI ChatGPT/Codex، `openclaw models status`،
`openclaw models auth list --provider openai` و
`openclaw config get agents.defaults.model --json` سریع‌ترین راه برای
تایید این هستند که آیا یک عامل پروفایل OAuth قابل‌استفاده `openai` برای
`openai/*` از طریق runtime بومی Codex دارد یا نه. [راه‌اندازی ارائه‌دهنده OpenAI](/fa/providers/openai#check-and-recover-codex-oauth-routing) را ببینید.

نکات:

- `models set <model-or-alias>` مقدار `provider/model` یا یک alias را می‌پذیرد.
- `models list` فقط خواندنی است: پیکربندی، پروفایل‌های احراز هویت، وضعیت catalog موجود
  و ردیف‌های catalog متعلق به ارائه‌دهنده را می‌خواند، اما
  `models.json` را بازنویسی نمی‌کند.
- ستون `Auth` در سطح ارائه‌دهنده و فقط خواندنی است. این مقدار از فراداده پروفایل احراز هویت محلی،
  نشانگرهای env، کلیدهای ارائه‌دهنده پیکربندی‌شده، نشانگرهای ارائه‌دهنده محلی،
  نشانگرهای env/profile مربوط به AWS Bedrock و فراداده synthetic-auth مربوط به Plugin محاسبه می‌شود؛
  runtime ارائه‌دهنده را بارگذاری نمی‌کند، secretهای keychain را نمی‌خواند، APIهای
  ارائه‌دهنده را فراخوانی نمی‌کند، یا آمادگی اجرای دقیق برای هر مدل را اثبات نمی‌کند.
- `models list --all --provider <id>` می‌تواند ردیف‌های catalog ایستای متعلق به ارائه‌دهنده
  را از manifestهای Plugin یا فراداده catalog ارائه‌دهنده bundled شامل کند، حتی وقتی هنوز
  با آن ارائه‌دهنده احراز هویت نکرده‌اید. آن ردیف‌ها تا زمانی که احراز هویت مطابق
  پیکربندی نشود همچنان به‌صورت در دسترس نبودن نمایش داده می‌شوند.
- `models list` هنگام کند بودن کشف catalog ارائه‌دهنده، control plane را پاسخ‌گو نگه می‌دارد.
  نماهای پیش‌فرض و پیکربندی‌شده پس از یک انتظار کوتاه به ردیف‌های مدل پیکربندی‌شده یا
  synthetic بازمی‌گردند و اجازه می‌دهند کشف در پس‌زمینه تمام شود.
  وقتی به catalog دقیق و کامل کشف‌شده نیاز دارید و مایلید منتظر کشف ارائه‌دهنده بمانید،
  از `--all` استفاده کنید.
- `models list --all` گسترده، ردیف‌های catalog manifest را روی ردیف‌های registry ادغام می‌کند
  بدون اینکه هوک‌های مکمل runtime ارائه‌دهنده را بارگذاری کند. مسیرهای سریع manifest فیلترشده بر اساس ارائه‌دهنده
  فقط از ارائه‌دهندگانی استفاده می‌کنند که با `static` علامت‌گذاری شده‌اند؛ ارائه‌دهندگانی که با `refreshable`
  علامت‌گذاری شده‌اند، registry/cache-backed می‌مانند و ردیف‌های manifest را به‌عنوان مکمل اضافه می‌کنند، در حالی که
  ارائه‌دهندگان علامت‌گذاری‌شده با `runtime` روی کشف registry/runtime می‌مانند.
- `models list` فراداده مدل بومی و سقف‌های runtime را جدا نگه می‌دارد. در خروجی جدول،
  وقتی سقف runtime موثر با پنجره context بومی فرق داشته باشد، `Ctx` مقدار `contextTokens/contextWindow`
  را نشان می‌دهد؛ ردیف‌های JSON وقتی ارائه‌دهنده آن سقف را افشا کند، `contextTokens`
  را شامل می‌شوند.
- `models list --provider <id>` بر اساس شناسه ارائه‌دهنده فیلتر می‌کند، مانند `moonshot` یا
  `openai`. این فرمان برچسب‌های نمایشی pickerهای تعاملی ارائه‌دهنده،
  مانند `Moonshot AI`، را نمی‌پذیرد.
- ارجاع‌های مدل با جدا کردن روی **اولین** `/` تجزیه می‌شوند. اگر شناسه مدل شامل `/` است (به سبک OpenRouter)، پیشوند ارائه‌دهنده را وارد کنید (مثال: `openrouter/moonshotai/kimi-k2`).
- اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا ورودی را به‌عنوان alias حل می‌کند، سپس
  به‌عنوان تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط بعد از آن
  با یک هشدار deprecation به ارائه‌دهنده پیش‌فرض پیکربندی‌شده بازمی‌گردد.
  اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw
  به‌جای نمایش یک پیش‌فرض کهنه مربوط به ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل
  پیکربندی‌شده بازمی‌گردد.
- `models status` ممکن است در خروجی احراز هویت برای placeholderهای غیرمحرمانه (برای مثال `OPENAI_API_KEY`، `secretref-managed`، `minimax-oauth`، `oauth:chutes`، `ollama-local`) مقدار `marker(<value>)` را نشان دهد، به‌جای اینکه آن‌ها را مانند secretها mask کند.

### پویش مدل‌ها

`models scan` catalog عمومی `:free` مربوط به OpenRouter را می‌خواند و candidateها را برای
استفاده به‌عنوان fallback رتبه‌بندی می‌کند. خود catalog عمومی است، بنابراین پویش‌های فقط فراداده
به کلید OpenRouter نیاز ندارند.

به‌صورت پیش‌فرض OpenClaw تلاش می‌کند پشتیبانی از tool و image را با فراخوانی‌های زنده مدل probe کند.
اگر هیچ کلید OpenRouter پیکربندی نشده باشد، فرمان به خروجی فقط فراداده
بازمی‌گردد و توضیح می‌دهد که مدل‌های `:free` همچنان برای
پروب‌ها و inference به `OPENROUTER_API_KEY` نیاز دارند.

گزینه‌ها:

- `--no-probe` (فقط فراداده؛ بدون lookup پیکربندی/secretها)
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

`--set-default` و `--set-image` به پروب‌های زنده نیاز دارند؛ نتایج پویش فقط فراداده
اطلاعاتی هستند و به پیکربندی اعمال نمی‌شوند.

### وضعیت مدل‌ها

گزینه‌ها:

- `--json`
- `--plain`
- `--check` (exit 1=منقضی‌شده/مفقود، 2=در حال انقضا)
- `--probe` (پروب زنده پروفایل‌های احراز هویت پیکربندی‌شده)
- `--probe-provider <name>` (پروب یک ارائه‌دهنده)
- `--probe-profile <id>` (شناسه‌های پروفایل تکراری یا جداشده با کاما)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (شناسه عامل پیکربندی‌شده؛ `OPENCLAW_AGENT_DIR` را override می‌کند)

`--json` stdout را برای payload JSON رزرو نگه می‌دارد. diagnostics مربوط به پروفایل احراز هویت، ارائه‌دهنده
و startup به stderr هدایت می‌شوند تا اسکریپت‌ها بتوانند stdout را مستقیم
به ابزارهایی مانند `jq` pipe کنند.

bucketهای وضعیت پروب:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

موارد detail/reason-code پروب که باید انتظار داشت:

- `excluded_by_auth_order`: یک پروفایل ذخیره‌شده وجود دارد، اما
  `auth.order.<provider>` صریح آن را حذف کرده است، بنابراین پروب به‌جای
  امتحان کردن آن، exclusion را گزارش می‌کند.
- `missing_credential`، `invalid_expires`، `expired`، `unresolved_ref`:
  پروفایل حاضر است اما eligible/resolvable نیست.
- `no_model`: احراز هویت ارائه‌دهنده وجود دارد، اما OpenClaw نتوانست یک candidate
  مدل قابل probe برای آن ارائه‌دهنده حل کند.

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
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` راهنمای تعاملی احراز هویت است. بسته به ارائه‌دهنده‌ای که انتخاب می‌کنید،
می‌تواند یک جریان احراز هویت ارائه‌دهنده (OAuth/API key) را اجرا کند یا شما را به paste دستی token راهنمایی کند.

`models auth list` پروفایل‌های احراز هویت ذخیره‌شده را برای عامل انتخاب‌شده فهرست می‌کند
بدون اینکه token، API-key یا ماده secret مربوط به OAuth را چاپ کند. از `--provider <id>` برای
فیلتر کردن به یک ارائه‌دهنده، مانند `openai`، و از `--json` برای اسکریپت‌نویسی استفاده کنید.

`models auth login` جریان احراز هویت Plugin ارائه‌دهنده (OAuth/API key) را اجرا می‌کند. از
`openclaw plugins list` استفاده کنید تا ببینید کدام ارائه‌دهندگان نصب شده‌اند.
برای نوشتن نتایج احراز هویت در store یک عامل پیکربندی‌شده مشخص، از
`openclaw models auth --agent <id> <subcommand>` استفاده کنید. flag والد `--agent` توسط
`add`، `list`، `login`، `paste-api-key`، `setup-token`، `paste-token` و
`login-github-copilot` رعایت می‌شود.

برای مدل‌های OpenAI، `--provider openai` به‌صورت پیش‌فرض وارد شدن با حساب ChatGPT/Codex است.
فقط وقتی از `--method api-key` استفاده کنید که می‌خواهید یک پروفایل API-key OpenAI اضافه کنید،
معمولا به‌عنوان پشتیبان برای محدودیت‌های subscription مربوط به Codex. برای مهاجرت وضعیت auth/profile
قدیمی با پیشوند legacy OpenAI Codex به `openai`، `openclaw doctor --fix` را اجرا کنید.

مثال‌ها:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

نکات:

- `login` برای ارائه‌دهندگانی که در هنگام login از پروفایل‌های نام‌گذاری‌شده پشتیبانی می‌کنند،
  `--profile-id <id>` را می‌پذیرد. از این برای جدا نگه داشتن چند login برای یک
  ارائه‌دهنده استفاده کنید.
- `paste-api-key` کلیدهای API تولیدشده در جای دیگر را می‌پذیرد، مقدار کلید
  را prompt می‌کند، و آن را در شناسه پروفایل پیش‌فرض `<provider>:manual` می‌نویسد، مگر اینکه
  `--profile-id` را پاس دهید. در automation، کلید را روی stdin pipe کنید، برای مثال
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` و `paste-token` به‌عنوان فرمان‌های generic token برای ارائه‌دهندگانی باقی می‌مانند
  که روش‌های احراز هویت token را افشا می‌کنند.
- `setup-token` به یک TTY تعاملی نیاز دارد و روش token-auth ارائه‌دهنده را اجرا می‌کند
  (وقتی آن ارائه‌دهنده روش `setup-token` را افشا کند، به‌صورت پیش‌فرض همان روش).
- `paste-token` یک رشته token تولیدشده در جای دیگر یا از automation را می‌پذیرد.
- `paste-token` به `--provider` نیاز دارد، به‌صورت پیش‌فرض مقدار token را prompt می‌کند،
  و آن را در شناسه پروفایل پیش‌فرض `<provider>:manual` می‌نویسد، مگر اینکه
  `--profile-id` را پاس دهید.
- در automation، به‌جای پاس دادن token به‌عنوان آرگومان، آن را روی stdin pipe کنید تا
  اعتبارنامه‌های ارائه‌دهنده در shell history یا process list ظاهر نشوند.
- `paste-token --expires-in <duration>` انقضای مطلق token را از یک
  مدت نسبی مانند `365d` یا `12h` ذخیره می‌کند.
- برای `openai`، کلیدهای API OpenAI و ماده token مربوط به ChatGPT/OAuth
  شکل‌های احراز هویت متفاوتی هستند. از `paste-api-key` برای کلیدهای API OpenAI با `sk-...` و
  از `paste-token` فقط برای ماده احراز هویت token استفاده کنید.
- نکته Anthropic: کارکنان Anthropic به ما گفته‌اند استفاده به سبک OpenClaw از Claude CLI دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این integration مجاز تلقی می‌کند، مگر اینکه Anthropic سیاست جدیدی منتشر کند.
- `setup-token` / `paste-token` مربوط به Anthropic همچنان به‌عنوان یک مسیر token پشتیبانی‌شده OpenClaw در دسترس هستند، اما OpenClaw اکنون استفاده مجدد از Claude CLI و `claude -p` را، وقتی در دسترس باشد، ترجیح می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [انتخاب مدل](/fa/concepts/model-providers)
- [Failover مدل](/fa/concepts/model-failover)
