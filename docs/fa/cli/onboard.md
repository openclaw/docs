---
read_when:
    - می‌خواهید راه‌اندازی هدایت‌شده‌ای برای Gateway، فضای کاری، احراز هویت، کانال‌ها و Skills داشته باشید
summary: مرجع CLI برای `openclaw onboard` (راه‌اندازی اولیه تعاملی)
title: راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-04-29T22:37:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

آماده‌سازی تعاملی برای راه‌اندازی Gateway محلی یا راه دور.

## راهنماهای مرتبط

<CardGroup cols={2}>
  <Card title="مرکز آماده‌سازی CLI" href="/fa/start/wizard" icon="rocket">
    راهنمای گام‌به‌گام جریان تعاملی CLI.
  </Card>
  <Card title="نمای کلی آماده‌سازی" href="/fa/start/onboarding-overview" icon="map">
    اینکه آماده‌سازی OpenClaw چگونه در کنار هم کار می‌کند.
  </Card>
  <Card title="مرجع راه‌اندازی CLI" href="/fa/start/wizard-cli-reference" icon="book">
    خروجی‌ها، جزئیات داخلی، و رفتار هر گام.
  </Card>
  <Card title="خودکارسازی CLI" href="/fa/start/wizard-cli-automation" icon="terminal">
    پرچم‌های غیرتعاملی و راه‌اندازی‌های اسکریپتی.
  </Card>
  <Card title="آماده‌سازی برنامه macOS" href="/fa/start/onboarding" icon="apple">
    جریان آماده‌سازی برای برنامه نوار منوی macOS.
  </Card>
</CardGroup>

## نمونه‌ها

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

`--flow import` از ارائه‌دهندگان مهاجرت متعلق به Plugin مانند Hermes استفاده می‌کند. این گزینه فقط روی راه‌اندازی تازه OpenClaw اجرا می‌شود؛ اگر پیکربندی، اعتبارنامه‌ها، نشست‌ها، یا فایل‌های حافظه/هویت فضای کاری موجود باشند، پیش از درون‌ریزی، بازنشانی کنید یا یک راه‌اندازی تازه انتخاب کنید.

`--modern` پیش‌نمایش آماده‌سازی گفت‌وگویی Crestodian را شروع می‌کند. بدون
`--modern`، `openclaw onboard` جریان آماده‌سازی کلاسیک را نگه می‌دارد.

برای هدف‌های `ws://` در شبکه خصوصی با متن ساده (فقط شبکه‌های مورد اعتماد)،
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را در محیط فرایند آماده‌سازی تنظیم کنید.
برای این راه‌گریز اضطراری انتقال سمت کلاینت، معادل `openclaw.json` وجود ندارد.

ارائه‌دهنده سفارشی غیرتعاملی:

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

`--custom-api-key` در حالت غیرتعاملی اختیاری است. اگر حذف شود، آماده‌سازی `CUSTOM_API_KEY` را بررسی می‌کند.
OpenClaw شناسه‌های رایج مدل بینایی را به‌صورت خودکار دارای قابلیت تصویر علامت‌گذاری می‌کند. برای شناسه‌های بینایی سفارشی ناشناخته، `--custom-image-input` را ارسال کنید، یا برای اجبار فراداده فقط‌متنی از `--custom-text-input` استفاده کنید.

LM Studio در حالت غیرتعاملی از یک پرچم کلید ویژه ارائه‌دهنده نیز پشتیبانی می‌کند:

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

`--custom-base-url` به‌طور پیش‌فرض `http://127.0.0.1:11434` است. `--custom-model-id` اختیاری است؛ اگر حذف شود، آماده‌سازی از پیش‌فرض‌های پیشنهادی Ollama استفاده می‌کند. شناسه‌های مدل ابری مانند `kimi-k2.5:cloud` نیز اینجا کار می‌کنند.

کلیدهای ارائه‌دهنده را به‌جای متن ساده به‌صورت ref ذخیره کنید:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

با `--secret-input-mode ref`، آماده‌سازی به‌جای مقدارهای کلید متن ساده، refهای مبتنی بر env می‌نویسد.
برای ارائه‌دهندگان مبتنی بر auth-profile، این کار ورودی‌های `keyRef` را می‌نویسد؛ برای ارائه‌دهندگان سفارشی، `models.providers.<id>.apiKey` را به‌صورت env ref می‌نویسد (برای مثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

قرارداد حالت `ref` غیرتعاملی:

- متغیر env ارائه‌دهنده را در محیط فرایند آماده‌سازی تنظیم کنید (برای مثال `OPENAI_API_KEY`).
- پرچم‌های کلید درون‌خطی را ارسال نکنید (برای مثال `--openai-api-key`) مگر اینکه آن متغیر env نیز تنظیم شده باشد.
- اگر پرچم کلید درون‌خطی بدون متغیر env لازم ارسال شود، آماده‌سازی با راهنمایی سریعاً شکست می‌خورد.

گزینه‌های توکن Gateway در حالت غیرتعاملی:

- `--gateway-auth token --gateway-token <token>` یک توکن متن ساده ذخیره می‌کند.
- `--gateway-auth token --gateway-token-ref-env <name>` مقدار `gateway.auth.token` را به‌صورت یک SecretRef مبتنی بر env ذخیره می‌کند.
- `--gateway-token` و `--gateway-token-ref-env` هم‌زمان قابل استفاده نیستند.
- `--gateway-token-ref-env` به یک متغیر env غیرخالی در محیط فرایند آماده‌سازی نیاز دارد.
- با `--install-daemon`، وقتی احراز هویت توکنی به توکن نیاز دارد، توکن‌های Gateway مدیریت‌شده با SecretRef اعتبارسنجی می‌شوند اما به‌صورت متن ساده حل‌شده در فراداده محیط سرویس supervisor پایدار نمی‌شوند.
- با `--install-daemon`، اگر حالت توکن به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، آماده‌سازی با راهنمایی رفع مشکل به‌صورت بسته شکست می‌خورد.
- با `--install-daemon`، اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، آماده‌سازی نصب را تا زمانی که حالت صراحتاً تنظیم شود مسدود می‌کند.
- آماده‌سازی محلی `gateway.mode="local"` را در پیکربندی می‌نویسد. اگر فایل پیکربندی بعدی فاقد `gateway.mode` باشد، آن را آسیب پیکربندی یا ویرایش دستی ناقص در نظر بگیرید، نه میان‌بر معتبر حالت محلی.
- `--allow-unconfigured` یک راه‌گریز زمان اجرای Gateway جداگانه است. به این معنی نیست که آماده‌سازی می‌تواند `gateway.mode` را حذف کند.

نمونه:

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

- مگر اینکه `--skip-health` را ارسال کنید، آماده‌سازی پیش از خروج موفق منتظر یک Gateway محلی قابل دسترسی می‌ماند.
- `--install-daemon` ابتدا مسیر نصب Gateway مدیریت‌شده را شروع می‌کند. بدون آن، باید از قبل یک Gateway محلی در حال اجرا داشته باشید، برای مثال `openclaw gateway run`.
- اگر در خودکارسازی فقط نوشتن پیکربندی/فضای کاری/bootstrap را می‌خواهید، از `--skip-health` استفاده کنید.
- اگر فایل‌های فضای کاری را خودتان مدیریت می‌کنید، `--skip-bootstrap` را ارسال کنید تا `agents.defaults.skipBootstrap: true` تنظیم شود و ایجاد `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، و `BOOTSTRAP.md` نادیده گرفته شود.
- در Windows بومی، `--install-daemon` ابتدا Scheduled Tasks را امتحان می‌کند و اگر ایجاد task رد شود، به یک login item پوشه Startup مخصوص هر کاربر برمی‌گردد.

رفتار آماده‌سازی تعاملی با حالت ارجاع:

- هنگام درخواست، **استفاده از ارجاع محرمانه** را انتخاب کنید.
- سپس یکی از این‌ها را انتخاب کنید:
  - متغیر محیطی
  - ارائه‌دهنده محرمانه پیکربندی‌شده (`file` یا `exec`)
- آماده‌سازی پیش از ذخیره ref، یک اعتبارسنجی سریع پیش‌پرواز انجام می‌دهد.
  - اگر اعتبارسنجی شکست بخورد، آماده‌سازی خطا را نشان می‌دهد و اجازه تلاش دوباره می‌دهد.

### انتخاب‌های endpoint غیرتعاملی Z.AI

<Note>
`--auth-choice zai-api-key` بهترین endpoint Z.AI را برای کلید شما به‌صورت خودکار تشخیص می‌دهد (API عمومی با `zai/glm-5.1` را ترجیح می‌دهد). اگر مشخصاً endpointهای GLM Coding Plan را می‌خواهید، `zai-coding-global` یا `zai-coding-cn` را انتخاب کنید.
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

نمونه Mistral غیرتعاملی:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## یادداشت‌های جریان

<AccordionGroup>
  <Accordion title="نوع‌های جریان">
    - `quickstart`: درخواست‌های حداقلی، یک توکن Gateway را به‌صورت خودکار تولید می‌کند.
    - `manual`: درخواست‌های کامل برای پورت، bind، و احراز هویت (نام مستعار `advanced`).
    - `import`: یک ارائه‌دهنده مهاجرت تشخیص‌داده‌شده را اجرا می‌کند، طرح را پیش‌نمایش می‌دهد، سپس پس از تأیید اعمال می‌کند.

  </Accordion>
  <Accordion title="پیش‌فیلتر کردن ارائه‌دهنده">
    وقتی یک انتخاب احراز هویت ارائه‌دهنده ترجیحی را القا می‌کند، آماده‌سازی انتخابگرهای مدل پیش‌فرض و allowlist را به آن ارائه‌دهنده پیش‌فیلتر می‌کند. برای Volcengine و BytePlus، این با گونه‌های coding-plan نیز مطابقت می‌دهد (`volcengine-plan/*`، `byteplus-plan/*`).

    اگر فیلتر ارائه‌دهنده ترجیحی هنوز هیچ مدل بارگذاری‌شده‌ای برنگرداند، آماده‌سازی به‌جای خالی گذاشتن انتخابگر، به کاتالوگ فیلترنشده برمی‌گردد.

  </Accordion>
  <Accordion title="پیگیری‌های جست‌وجوی وب">
    برخی ارائه‌دهندگان جست‌وجوی وب، درخواست‌های پیگیری ویژه ارائه‌دهنده را فعال می‌کنند:

    - **Grok** می‌تواند راه‌اندازی اختیاری `x_search` را با همان `XAI_API_KEY` و یک انتخاب مدل `x_search` ارائه کند.
    - **Kimi** می‌تواند منطقه Moonshot API (`api.moonshot.ai` در برابر `api.moonshot.cn`) و مدل پیش‌فرض جست‌وجوی وب Kimi را درخواست کند.

  </Accordion>
  <Accordion title="رفتارهای دیگر">
    - رفتار دامنه DM در آماده‌سازی محلی: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference#outputs-and-internals).
    - سریع‌ترین گفت‌وگوی نخست: `openclaw dashboard` (Control UI، بدون راه‌اندازی کانال).
    - ارائه‌دهنده سفارشی: هر endpoint سازگار با OpenAI یا Anthropic را، از جمله ارائه‌دهندگان میزبانی‌شده‌ای که فهرست نشده‌اند، وصل کنید. برای تشخیص خودکار از Unknown استفاده کنید.
    - اگر وضعیت Hermes تشخیص داده شود، آماده‌سازی یک جریان مهاجرت ارائه می‌کند. برای طرح‌های dry-run، حالت بازنویسی، گزارش‌ها، و نگاشت‌های دقیق از [مهاجرت](/fa/cli/migrate) استفاده کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های رایج پیگیری

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` به معنی حالت غیرتعاملی نیست. برای اسکریپت‌ها از `--non-interactive` استفاده کنید.
</Note>
