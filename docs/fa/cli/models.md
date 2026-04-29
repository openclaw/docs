---
read_when:
    - می‌خواهید مدل‌های پیش‌فرض را تغییر دهید یا وضعیت احراز هویت ارائه‌دهنده را مشاهده کنید
    - می‌خواهید مدل‌ها/ارائه‌دهندگان موجود را پویش کنید و پروفایل‌های احراز هویت را عیب‌یابی کنید
summary: مرجع CLI برای `openclaw models` (status/list/set/scan، نام‌های مستعار، گزینه‌های جایگزین، احراز هویت)
title: مدل‌ها
x-i18n:
    generated_at: "2026-04-29T22:37:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

کشف، اسکن، و پیکربندی مدل‌ها (مدل پیش‌فرض، جایگزین‌ها، پروفایل‌های احراز هویت).

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

`openclaw models status` مقدار پیش‌فرض/جایگزین‌های حل‌شده را همراه با نمای کلی احراز هویت نشان می‌دهد.
وقتی نماهای لحظه‌ای استفاده از ارائه‌دهنده در دسترس باشند، بخش وضعیت OAuth/API-key شامل
پنجره‌های استفاده و نماهای لحظه‌ای سهمیه ارائه‌دهنده می‌شود.
ارائه‌دهنده‌های فعلی پنجره استفاده: Anthropic، GitHub Copilot، Gemini CLI، OpenAI
Codex، MiniMax، Xiaomi، و z.ai. احراز هویت استفاده، در صورت وجود، از هوک‌های اختصاصی ارائه‌دهنده می‌آید؛
در غیر این صورت OpenClaw به مدارک OAuth/API-key منطبق
از پروفایل‌های احراز هویت، env، یا config برمی‌گردد.
در خروجی `--json`، مقدار `auth.providers` نمای کلی ارائه‌دهنده آگاه از env/config/store است،
در حالی که `auth.oauth` فقط سلامت پروفایل auth-store را نشان می‌دهد.
برای اجرای پروب‌های زنده احراز هویت روی هر پروفایل ارائه‌دهنده پیکربندی‌شده، `--probe` را اضافه کنید.
پروب‌ها درخواست‌های واقعی هستند (ممکن است توکن مصرف کنند و محدودیت نرخ را فعال کنند).
برای بررسی وضعیت مدل/احراز هویت یک عامل پیکربندی‌شده، از `--agent <id>` استفاده کنید. اگر حذف شود،
فرمان در صورت تنظیم بودن از `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` استفاده می‌کند، وگرنه از
عامل پیش‌فرض پیکربندی‌شده.
ردیف‌های پروب می‌توانند از پروفایل‌های احراز هویت، مدارک env، یا `models.json` بیایند.

نکات:

- `models set <model-or-alias>` مقدار `provider/model` یا یک alias را می‌پذیرد.
- `models list` فقط خواندنی است: config، پروفایل‌های احراز هویت، وضعیت catalog موجود،
  و ردیف‌های catalog متعلق به ارائه‌دهنده را می‌خواند، اما
  `models.json` را بازنویسی نمی‌کند.
- ستون `Auth` در سطح ارائه‌دهنده و فقط خواندنی است. از متادیتای پروفایل احراز هویت محلی،
  نشانگرهای env، کلیدهای ارائه‌دهنده پیکربندی‌شده، نشانگرهای ارائه‌دهنده محلی،
  نشانگرهای env/profile مربوط به AWS Bedrock، و متادیتای synthetic-auth مربوط به Plugin محاسبه می‌شود؛
  runtime ارائه‌دهنده را بارگذاری نمی‌کند، اسرار keychain را نمی‌خواند، APIهای ارائه‌دهنده را فراخوانی نمی‌کند،
  یا آمادگی دقیق اجرای هر مدل را اثبات نمی‌کند.
- `models list --all --provider <id>` می‌تواند ردیف‌های catalog ایستای متعلق به ارائه‌دهنده
  را از manifestهای Plugin یا متادیتای catalog ارائه‌دهنده‌های همراه شامل کند، حتی وقتی هنوز
  با آن ارائه‌دهنده احراز هویت نکرده‌اید. آن ردیف‌ها همچنان تا زمانی که
  احراز هویت منطبق پیکربندی شود، ناموجود نشان داده می‌شوند.
- `models list --all` گسترده ردیف‌های catalog manifest را روی ردیف‌های registry ادغام می‌کند
  بدون اینکه هوک‌های مکمل runtime ارائه‌دهنده را بارگذاری کند. مسیرهای سریع manifest فیلترشده بر اساس ارائه‌دهنده
  فقط از ارائه‌دهنده‌هایی استفاده می‌کنند که با `static` علامت‌گذاری شده‌اند؛ ارائه‌دهنده‌هایی که با `refreshable`
  علامت‌گذاری شده‌اند registry/cache-backed می‌مانند و ردیف‌های manifest را به‌عنوان مکمل اضافه می‌کنند، در حالی که
  ارائه‌دهنده‌هایی که با `runtime` علامت‌گذاری شده‌اند روی کشف registry/runtime می‌مانند.
- `models list` متادیتای بومی مدل و سقف‌های runtime را جدا نگه می‌دارد. در خروجی جدول،
  `Ctx` وقتی یک سقف runtime مؤثر با پنجره context بومی فرق داشته باشد `contextTokens/contextWindow` را نشان می‌دهد؛
  ردیف‌های JSON وقتی ارائه‌دهنده آن سقف را ارائه کند شامل `contextTokens` می‌شوند.
- `models list --provider <id>` بر اساس شناسه ارائه‌دهنده، مانند `moonshot` یا
  `openai-codex` فیلتر می‌کند. برچسب‌های نمایشی از انتخابگرهای تعاملی ارائه‌دهنده،
  مانند `Moonshot AI` را نمی‌پذیرد.
- ارجاع‌های مدل با تقسیم بر اساس **اولین** `/` تجزیه می‌شوند. اگر شناسه مدل شامل `/` باشد (سبک OpenRouter)، پیشوند ارائه‌دهنده را وارد کنید (مثال: `openrouter/moonshotai/kimi-k2`).
- اگر ارائه‌دهنده را حذف کنید، OpenClaw ابتدا ورودی را به‌عنوان alias حل می‌کند، سپس
  به‌عنوان یک تطابق یکتای ارائه‌دهنده پیکربندی‌شده برای همان شناسه دقیق مدل، و فقط پس از آن
  با یک هشدار منسوخ‌شدن به ارائه‌دهنده پیش‌فرض پیکربندی‌شده برمی‌گردد.
  اگر آن ارائه‌دهنده دیگر مدل پیش‌فرض پیکربندی‌شده را ارائه نکند، OpenClaw
  به‌جای نمایش یک پیش‌فرض قدیمیِ ارائه‌دهنده حذف‌شده، به اولین ارائه‌دهنده/مدل پیکربندی‌شده برمی‌گردد.
- `models status` ممکن است در خروجی احراز هویت برای placeholderهای غیرمحرمانه (برای مثال `OPENAI_API_KEY`، `secretref-managed`، `minimax-oauth`، `oauth:chutes`، `ollama-local`) به‌جای پنهان‌سازی آن‌ها به‌عنوان اسرار، `marker(<value>)` را نشان دهد.

### اسکن مدل‌ها

`models scan` catalog عمومی `:free` متعلق به OpenRouter را می‌خواند و نامزدها را برای
استفاده به‌عنوان جایگزین رتبه‌بندی می‌کند. خود catalog عمومی است، پس اسکن‌های فقط متادیتا
به کلید OpenRouter نیاز ندارند.

به‌طور پیش‌فرض OpenClaw تلاش می‌کند پشتیبانی از ابزار و تصویر را با فراخوانی‌های زنده مدل پروب کند.
اگر هیچ کلید OpenRouter پیکربندی نشده باشد، فرمان به خروجی فقط متادیتا
برمی‌گردد و توضیح می‌دهد که مدل‌های `:free` همچنان برای پروب‌ها و استنتاج
به `OPENROUTER_API_KEY` نیاز دارند.

گزینه‌ها:

- `--no-probe` (فقط متادیتا؛ بدون جست‌وجوی config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (درخواست catalog و timeout هر پروب)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` و `--set-image` به پروب‌های زنده نیاز دارند؛ نتایج اسکن فقط متادیتا
اطلاعاتی هستند و روی config اعمال نمی‌شوند.

### وضعیت مدل‌ها

گزینه‌ها:

- `--json`
- `--plain`
- `--check` (خروج 1=منقضی/مفقود، 2=در حال انقضا)
- `--probe` (پروب زنده پروفایل‌های احراز هویت پیکربندی‌شده)
- `--probe-provider <name>` (پروب یک ارائه‌دهنده)
- `--probe-profile <id>` (شناسه‌های پروفایل تکراری یا جداشده با کاما)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (شناسه عامل پیکربندی‌شده؛ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` را override می‌کند)

`--json` stdout را برای payload JSON رزرو نگه می‌دارد. diagnostics مربوط به پروفایل احراز هویت، ارائه‌دهنده،
و startup به stderr هدایت می‌شوند تا اسکریپت‌ها بتوانند stdout را مستقیم
به ابزارهایی مانند `jq` pipe کنند.

دسته‌های وضعیت پروب:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

موارد detail/reason-code پروب که باید انتظار داشت:

- `excluded_by_auth_order`: یک پروفایل ذخیره‌شده وجود دارد، اما `auth.order.<provider>` صریح
  آن را حذف کرده است، پس پروب به‌جای تلاش برای آن، حذف‌شدن را گزارش می‌کند.
- `missing_credential`، `invalid_expires`، `expired`، `unresolved_ref`:
  پروفایل وجود دارد اما واجد شرایط/قابل حل نیست.
- `no_model`: احراز هویت ارائه‌دهنده وجود دارد، اما OpenClaw نتوانست یک نامزد مدل قابل پروب
  برای آن ارائه‌دهنده حل کند.

## Aliasها + جایگزین‌ها

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## پروفایل‌های احراز هویت

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` کمک‌کننده تعاملی احراز هویت است. بسته به
ارائه‌دهنده‌ای که انتخاب می‌کنید، می‌تواند یک جریان احراز هویت ارائه‌دهنده
(OAuth/API key) را راه‌اندازی کند یا شما را به چسباندن دستی توکن راهنمایی کند.

`models auth login` جریان احراز هویت Plugin یک ارائه‌دهنده (OAuth/API key) را اجرا می‌کند. برای دیدن اینکه کدام ارائه‌دهنده‌ها نصب شده‌اند، از
`openclaw plugins list` استفاده کنید.
برای نوشتن نتایج احراز هویت در store یک عامل پیکربندی‌شده خاص، از `openclaw models auth --agent <id> <subcommand>` استفاده کنید.
پرچم والد `--agent` توسط
`add`، `login`، `setup-token`، `paste-token`، و `login-github-copilot` رعایت می‌شود.

مثال‌ها:

```bash
openclaw models auth login --provider openai-codex --set-default
```

نکات:

- `setup-token` و `paste-token` برای ارائه‌دهنده‌هایی که روش‌های احراز هویت با توکن
  ارائه می‌کنند، همچنان فرمان‌های عمومی توکن هستند.
- `setup-token` به یک TTY تعاملی نیاز دارد و روش token-auth ارائه‌دهنده را اجرا می‌کند
  (به‌طور پیش‌فرض روش `setup-token` همان ارائه‌دهنده، وقتی چنین روشی را ارائه کند).
- `paste-token` یک رشته توکن تولیدشده در جای دیگر یا از automation را می‌پذیرد.
- `paste-token` به `--provider` نیاز دارد، مقدار توکن را درخواست می‌کند، و
  آن را در شناسه پروفایل پیش‌فرض `<provider>:manual` می‌نویسد مگر اینکه
  `--profile-id` را پاس دهید.
- `paste-token --expires-in <duration>` انقضای مطلق توکن را از یک
  مدت نسبی مانند `365d` یا `12h` ذخیره می‌کند.
- نکته Anthropic: کارکنان Anthropic به ما گفتند استفاده Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین OpenClaw استفاده مجدد از Claude CLI و استفاده از `claude -p` را برای این integration مجاز می‌داند مگر اینکه Anthropic سیاست جدیدی منتشر کند.
- `setup-token` / `paste-token` مربوط به Anthropic همچنان به‌عنوان یک مسیر توکن پشتیبانی‌شده OpenClaw در دسترس هستند، اما OpenClaw اکنون در صورت در دسترس بودن، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [انتخاب مدل](/fa/concepts/model-providers)
- [Failover مدل](/fa/concepts/model-failover)
