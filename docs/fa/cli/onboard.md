---
read_when:
    - راه‌اندازی هدایت‌شده برای Gateway، workspace، احراز هویت، کانال‌ها و Skills می‌خواهید
summary: مرجع CLI برای `openclaw onboard` (راه‌اندازی تعاملی)
title: راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-07-01T13:13:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

راه‌اندازی اولیه‌ی راهنمایی‌شده‌ی کامل برای تنظیم Gateway محلی یا راه دور. وقتی می‌خواهید OpenClaw احراز هویت مدل، فضای کاری، Gateway، کانال‌ها، Skills و سلامت را در یک جریان طی کند، از این استفاده کنید.

## راهنماهای مرتبط

<CardGroup cols={2}>
  <Card title="مرکز راه‌اندازی اولیه CLI" href="/fa/start/wizard" icon="rocket">
    راهنمای گام‌به‌گام جریان تعاملی CLI.
  </Card>
  <Card title="نمای کلی راه‌اندازی اولیه" href="/fa/start/onboarding-overview" icon="map">
    اینکه راه‌اندازی اولیه OpenClaw چگونه در کنار هم قرار می‌گیرد.
  </Card>
  <Card title="مرجع تنظیم CLI" href="/fa/start/wizard-cli-reference" icon="book">
    خروجی‌ها، جزئیات داخلی، و رفتار هر گام.
  </Card>
  <Card title="خودکارسازی CLI" href="/fa/start/wizard-cli-automation" icon="terminal">
    پرچم‌های غیرتعاملی و تنظیمات اسکریپتی.
  </Card>
  <Card title="راه‌اندازی اولیه برنامه macOS" href="/fa/start/onboarding" icon="apple">
    جریان راه‌اندازی اولیه برای برنامه نوار منوی macOS.
  </Card>
</CardGroup>

## مثال‌ها

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` از تامین‌کنندگان مهاجرت متعلق به Plugin مانند Hermes استفاده می‌کند. این گزینه فقط روی تنظیم تازه OpenClaw اجرا می‌شود؛ اگر پیکربندی، اعتبارنامه‌ها، نشست‌ها، یا فایل‌های حافظه/هویت فضای کاری موجود باشند، پیش از وارد کردن، بازنشانی کنید یا یک تنظیم تازه انتخاب کنید.

`--modern` پیش‌نمایش راه‌اندازی اولیه گفت‌وگویی Crestodian را شروع می‌کند. بدون
`--modern`، `openclaw onboard` جریان راه‌اندازی اولیه کلاسیک را نگه می‌دارد.

در یک نصب تازه که فایل پیکربندی فعال وجود ندارد یا هیچ تنظیم نوشته‌شده‌ای
ندارد (خالی یا فقط شامل فراداده)، `openclaw` تنها نیز جریان راه‌اندازی اولیه
کلاسیک را شروع می‌کند. وقتی فایل پیکربندی تنظیمات نوشته‌شده داشته باشد،
`openclaw` تنها به‌جای آن Crestodian را باز می‌کند.

متن ساده `ws://` برای نشانی‌های Gateway مربوط به loopback، IPهای خصوصی صریح، `.local`، و
Tailnet `*.ts.net` پذیرفته می‌شود. برای نام‌های خصوصی-DNS مورد اعتماد دیگر،
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را در محیط فرایند راه‌اندازی اولیه تنظیم کنید.

## زبان

راه‌اندازی اولیه تعاملی از زبان جادوگر CLI برای متن ثابت تنظیم استفاده می‌کند. ترتیب
حل‌وفصل این است:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. جایگزین انگلیسی

زبان‌های پشتیبانی‌شده جادوگر `en`، `zh-CN`، و `zh-TW` هستند. مقادیر زبان می‌توانند از
زیرخط یا شکل‌های پسوند POSIX مانند `zh_CN.UTF-8` استفاده کنند. نام‌های محصول، نام‌های فرمان،
کلیدهای پیکربندی، URLها، شناسه‌های تامین‌کننده، شناسه‌های مدل، و برچسب‌های Plugin/کانال
به‌صورت لفظی باقی می‌مانند.

مثال:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

تامین‌کننده سفارشی غیرتعاملی:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` در حالت غیرتعاملی اختیاری است. اگر حذف شود، راه‌اندازی اولیه `CUSTOM_API_KEY` را بررسی می‌کند.
OpenClaw شناسه‌های رایج مدل بینایی را به‌طور خودکار دارای قابلیت تصویر علامت‌گذاری می‌کند. برای شناسه‌های بینایی سفارشی ناشناخته `--custom-image-input` را ارسال کنید، یا برای اجبار به فراداده فقط-متن از `--custom-text-input` استفاده کنید.
برای نقطه‌پایان‌های سازگار با OpenAI که از `/v1/responses` پشتیبانی می‌کنند اما نه از `/v1/chat/completions`، از `--custom-compatibility openai-responses` استفاده کنید.

LM Studio در حالت غیرتعاملی از یک پرچم کلید ویژه تامین‌کننده نیز پشتیبانی می‌کند:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama غیرتعاملی:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` به‌طور پیش‌فرض `http://127.0.0.1:11434` است. `--custom-model-id` اختیاری است؛ اگر حذف شود، راه‌اندازی اولیه از پیش‌فرض‌های پیشنهادی Ollama استفاده می‌کند. شناسه‌های مدل ابری مانند `kimi-k2.5:cloud` نیز اینجا کار می‌کنند.

کلیدهای تامین‌کننده را به‌جای متن ساده به‌صورت ارجاع ذخیره کنید:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

با `--secret-input-mode ref`، راه‌اندازی اولیه به‌جای مقادیر کلید متن ساده، ارجاع‌های مبتنی بر env می‌نویسد.
برای تامین‌کنندگان مبتنی بر auth-profile این کار ورودی‌های `keyRef` را می‌نویسد؛ برای تامین‌کنندگان سفارشی این کار `models.providers.<id>.apiKey` را به‌عنوان یک ارجاع env می‌نویسد (برای مثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

قرارداد حالت `ref` غیرتعاملی:

- متغیر env تامین‌کننده را در محیط فرایند راه‌اندازی اولیه تنظیم کنید (برای مثال `OPENAI_API_KEY`).
- پرچم‌های کلید درون‌خطی را ارسال نکنید (برای مثال `--openai-api-key`) مگر اینکه آن متغیر env نیز تنظیم شده باشد.
- اگر یک پرچم کلید درون‌خطی بدون متغیر env لازم ارسال شود، راه‌اندازی اولیه سریعاً با راهنمایی شکست می‌خورد.

گزینه‌های توکن Gateway در حالت غیرتعاملی:

- `--gateway-auth token --gateway-token <token>` یک توکن متن ساده ذخیره می‌کند.
- `--gateway-auth token --gateway-token-ref-env <name>` مقدار `gateway.auth.token` را به‌عنوان یک env SecretRef ذخیره می‌کند.
- `--gateway-token` و `--gateway-token-ref-env` ناسازگار با یکدیگر هستند.
- `--gateway-token-ref-env` به یک متغیر env غیرخالی در محیط فرایند راه‌اندازی اولیه نیاز دارد.
- با `--install-daemon`، وقتی احراز هویت توکنی به توکن نیاز دارد، توکن‌های Gateway مدیریت‌شده با SecretRef اعتبارسنجی می‌شوند اما به‌صورت متن ساده حل‌شده در فراداده محیط سرویس supervisor پایدار نمی‌شوند.
- با `--install-daemon`، اگر حالت توکن به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، راه‌اندازی اولیه با راهنمایی اصلاح، fail closed می‌شود.
- با `--install-daemon`، اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، راه‌اندازی اولیه نصب را تا زمانی که حالت صریحاً تنظیم شود مسدود می‌کند.
- راه‌اندازی اولیه محلی `gateway.mode="local"` را در پیکربندی می‌نویسد. اگر یک فایل پیکربندی بعدی `gateway.mode` را نداشته باشد، آن را آسیب پیکربندی یا ویرایش دستی ناقص بدانید، نه یک میان‌بر معتبر حالت محلی.
- راه‌اندازی اولیه محلی Pluginهای قابل دانلود انتخاب‌شده را وقتی مسیر تنظیم انتخاب‌شده به آن‌ها نیاز دارد نصب می‌کند.
- راه‌اندازی اولیه راه دور فقط اطلاعات اتصال برای Gateway راه دور را می‌نویسد و بسته‌های Plugin محلی را نصب نمی‌کند.
- `--allow-unconfigured` یک دریچه فرار جداگانه برای زمان اجرای Gateway است. به این معنی نیست که راه‌اندازی اولیه می‌تواند `gateway.mode` را حذف کند.

مثال:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

سلامت Gateway محلی غیرتعاملی:

- مگر اینکه `--skip-health` را ارسال کنید، راه‌اندازی اولیه پیش از خروج موفقیت‌آمیز منتظر یک Gateway محلی قابل دسترسی می‌ماند.
- `--install-daemon` ابتدا مسیر نصب Gateway مدیریت‌شده را شروع می‌کند. بدون آن، باید از قبل یک Gateway محلی در حال اجرا داشته باشید، برای مثال `openclaw gateway run`.
- اگر در خودکارسازی فقط نوشتن پیکربندی/فضای کاری/bootstrap را می‌خواهید، از `--skip-health` استفاده کنید.
- اگر فایل‌های فضای کاری را خودتان مدیریت می‌کنید، `--skip-bootstrap` را ارسال کنید تا `agents.defaults.skipBootstrap: true` تنظیم شود و ساخت `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، و `BOOTSTRAP.md` رد شود.
- در Windows بومی، `--install-daemon` ابتدا Scheduled Tasks را امتحان می‌کند و اگر ساخت task رد شود، به یک مورد ورود پوشه Startup برای هر کاربر برمی‌گردد.

رفتار راه‌اندازی اولیه تعاملی با حالت ارجاع:

- هنگام درخواست، **استفاده از ارجاع محرمانه** را انتخاب کنید.
- سپس یکی از این دو را انتخاب کنید:
  - متغیر محیطی
  - تامین‌کننده محرمانه پیکربندی‌شده (`file` یا `exec`)
- راه‌اندازی اولیه پیش از ذخیره ارجاع، یک اعتبارسنجی preflight سریع انجام می‌دهد.
  - اگر اعتبارسنجی شکست بخورد، راه‌اندازی اولیه خطا را نشان می‌دهد و اجازه تلاش دوباره می‌دهد.

### انتخاب‌های نقطه‌پایان Z.AI غیرتعاملی

<Note>
`--auth-choice zai-api-key` بهترین نقطه‌پایان و مدل Z.AI را برای
کلید شما به‌طور خودکار تشخیص می‌دهد. نقطه‌پایان‌های Coding Plan‏ `zai/glm-5.2` را ترجیح می‌دهند؛ نقطه‌پایان‌های API عمومی از
`zai/glm-5.1` استفاده می‌کنند. برای اجبار به یک نقطه‌پایان Coding Plan، `zai-coding-global` یا
`zai-coding-cn` را انتخاب کنید.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

مثال Mistral غیرتعاملی:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## پرچم‌های غیرتعاملی بیشتر

احراز هویت مدل مبتنی بر توکن (غیرتعاملی؛ همراه با `--auth-choice token` استفاده می‌شود):

- `--token-provider <id>` — شناسه تامین‌کننده توکن. مشخص می‌کند کدام تامین‌کننده توکن را صادر می‌کند.
- `--token <token>` — مقدار توکن برای احراز هویت مدل.
- `--token-profile-id <id>` — شناسه پروفایل احراز هویت. ذخیره‌سازی توکن عمومی به‌طور پیش‌فرض `<provider>:manual` است؛ جریان‌های تنظیم متعلق به تامین‌کننده ممکن است از پیش‌فرض خودشان استفاده کنند، مانند `anthropic:default`.
- `--token-expires-in <duration>` — مدت انقضای اختیاری توکن (مثلاً `365d`، `12h`).

Cloudflare AI Gateway (غیرتعاملی):

- `--cloudflare-ai-gateway-account-id <id>` — شناسه حساب Cloudflare برای مسیریابی از طریق Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — شناسه Cloudflare AI Gateway.

کنترل نصب daemon:

- `--no-install-daemon` — نصب سرویس Gateway را صریحاً رد می‌کند.
- `--skip-daemon` — نام مستعار برای `--no-install-daemon`.

کنترل تنظیم UI و hook:

- `--skip-ui` — درخواست‌های Control UI / TUI را در طول راه‌اندازی اولیه رد می‌کند.
- `--skip-hooks` — درخواست‌های تنظیم Webhook / hook را در طول راه‌اندازی اولیه رد می‌کند.

سرکوب خروجی:

- `--suppress-gateway-token-output` — خروجی Gateway/UI دارای توکن را سرکوب می‌کند (راهنماهای توکن، URL ورود خودکار با توکن جاسازی‌شده، و اجرای خودکار Control UI). در محیط‌های ترمینال مشترک و CI مفید است.

## نکات جریان

<AccordionGroup>
  <Accordion title="انواع جریان">
    - `quickstart`: درخواست‌های حداقلی، یک توکن Gateway را خودکار تولید می‌کند.
    - `manual`: درخواست‌های کامل برای port، bind، و auth (نام مستعار `advanced`).
    - `import`: یک تامین‌کننده مهاجرت شناسایی‌شده را اجرا می‌کند، طرح را پیش‌نمایش می‌کند، سپس پس از تایید اعمال می‌کند.

  </Accordion>
  <Accordion title="پیش‌فیلتر کردن تامین‌کننده">
    وقتی یک انتخاب احراز هویت به یک تامین‌کننده ترجیحی دلالت دارد، راه‌اندازی اولیه انتخاب‌گرهای مدل پیش‌فرض و allowlist را از پیش به همان تامین‌کننده فیلتر می‌کند. برای Volcengine و BytePlus، این مورد با گونه‌های coding-plan نیز منطبق می‌شود (`volcengine-plan/*`، `byteplus-plan/*`).

    اگر فیلتر تامین‌کننده ترجیحی هنوز هیچ مدل بارگذاری‌شده‌ای برنگرداند، راه‌اندازی اولیه به‌جای خالی گذاشتن انتخاب‌گر، به کاتالوگ بدون فیلتر برمی‌گردد.

  </Accordion>
  <Accordion title="پیگیری‌های جست‌وجوی وب">
    برخی تامین‌کنندگان جست‌وجوی وب درخواست‌های پیگیری ویژه تامین‌کننده را فعال می‌کنند:

    - **Grok** می‌تواند تنظیم اختیاری `x_search` را با همان پروفایل OAuth یا کلید API مربوط به xAI و یک انتخاب مدل `x_search` ارائه کند.
    - **Kimi** می‌تواند ناحیه API مربوط به Moonshot (`api.moonshot.ai` در برابر `api.moonshot.cn`) و مدل پیش‌فرض جست‌وجوی وب Kimi را درخواست کند.

  </Accordion>
  <Accordion title="رفتارهای دیگر">
    - رفتار دامنه DM در راه‌اندازی اولیه محلی: [مرجع تنظیم CLI](/fa/start/wizard-cli-reference#outputs-and-internals).
    - سریع‌ترین گفت‌وگوی نخست: `openclaw dashboard` (Control UI، بدون تنظیم کانال).
    - تامین‌کننده سفارشی: هر نقطه‌پایان سازگار با OpenAI یا Anthropic را وصل کنید، از جمله تامین‌کنندگان میزبانی‌شده‌ای که فهرست نشده‌اند. برای تشخیص خودکار از Unknown استفاده کنید.
    - اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیه یک جریان مهاجرت پیشنهاد می‌کند. برای طرح‌های dry-run، حالت بازنویسی، گزارش‌ها، و نگاشت‌های دقیق از [مهاجرت](/fa/cli/migrate) استفاده کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های پیگیری رایج

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

از `openclaw setup` به‌عنوان همان نقطه ورود راه‌اندازی اولیه راهنمایی‌شده استفاده کنید. وقتی فقط به پیکربندی/فضای کاری baseline نیاز دارید از `openclaw setup --baseline` استفاده کنید، بعداً برای تغییرات هدفمند از `openclaw configure`، و برای تنظیم فقط کانال از `openclaw channels add` استفاده کنید.

<Note>
`--json` به‌معنای حالت غیرتعاملی نیست. برای اسکریپت‌ها از `--non-interactive` استفاده کنید.
</Note>
