---
read_when:
    - شما راه‌اندازی هدایت‌شده برای Gateway، فضای کاری، احراز هویت، کانال‌ها و Skills می‌خواهید
summary: مرجع CLI برای `openclaw onboard` (شروع به کار تعاملی)
title: راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-05-02T11:40:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

راه‌اندازی اولیهٔ تعاملی برای پیکربندی Gateway محلی یا راه دور.

## راهنماهای مرتبط

<CardGroup cols={2}>
  <Card title="مرکز راه‌اندازی اولیهٔ CLI" href="/fa/start/wizard" icon="rocket">
    راهنمای گام‌به‌گام جریان تعاملی CLI.
  </Card>
  <Card title="نمای کلی راه‌اندازی اولیه" href="/fa/start/onboarding-overview" icon="map">
    چگونگی کنار هم قرار گرفتن راه‌اندازی اولیهٔ OpenClaw.
  </Card>
  <Card title="مرجع پیکربندی CLI" href="/fa/start/wizard-cli-reference" icon="book">
    خروجی‌ها، بخش‌های داخلی، و رفتار هر مرحله.
  </Card>
  <Card title="خودکارسازی CLI" href="/fa/start/wizard-cli-automation" icon="terminal">
    پرچم‌های غیرتعاملی و پیکربندی‌های اسکریپتی.
  </Card>
  <Card title="راه‌اندازی اولیهٔ اپلیکیشن macOS" href="/fa/start/onboarding" icon="apple">
    جریان راه‌اندازی اولیه برای اپلیکیشن نوار منوی macOS.
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

`--flow import` از ارائه‌دهندگان مهاجرت متعلق به Plugin، مانند Hermes، استفاده می‌کند. این فقط روی یک پیکربندی تازهٔ OpenClaw اجرا می‌شود؛ اگر پیکربندی، اعتبارنامه‌ها، نشست‌ها، یا فایل‌های حافظه/هویت workspace موجود باشند، پیش از درون‌ریزی بازنشانی کنید یا یک پیکربندی تازه انتخاب کنید.

`--modern` پیش‌نمایش راه‌اندازی اولیهٔ مکالمه‌ای Crestodian را شروع می‌کند. بدون
`--modern`، `openclaw onboard` جریان کلاسیک راه‌اندازی اولیه را حفظ می‌کند.

برای مقصدهای `ws://` متنی ساده در شبکهٔ خصوصی (فقط شبکه‌های مورد اعتماد)،
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را در محیط فرایند راه‌اندازی اولیه تنظیم کنید.
برای این راه‌گریز اضطراریِ انتقال سمت کلاینت، معادل `openclaw.json` وجود ندارد.

ارائه‌دهندهٔ سفارشی غیرتعاملی:

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
OpenClaw شناسه‌های رایج مدل‌های بینایی را به‌طور خودکار دارای قابلیت تصویر علامت‌گذاری می‌کند. برای شناسه‌های سفارشی ناشناختهٔ بینایی، `--custom-image-input` را پاس دهید، یا برای اجبار به فرادادهٔ فقط متنی از `--custom-text-input` استفاده کنید.

LM Studio همچنین در حالت غیرتعاملی از یک پرچم کلید مخصوص ارائه‌دهنده پشتیبانی می‌کند:

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

کلیدهای ارائه‌دهنده را به‌جای متن ساده به‌صورت ارجاع ذخیره کنید:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

با `--secret-input-mode ref`، راه‌اندازی اولیه به‌جای مقدارهای کلید متنی ساده، ارجاع‌های مبتنی بر env می‌نویسد.
برای ارائه‌دهندگان مبتنی بر auth-profile این کار ورودی‌های `keyRef` را می‌نویسد؛ برای ارائه‌دهندگان سفارشی، `models.providers.<id>.apiKey` را به‌عنوان یک ارجاع env می‌نویسد (برای مثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

قرارداد حالت `ref` غیرتعاملی:

- متغیر env ارائه‌دهنده را در محیط فرایند راه‌اندازی اولیه تنظیم کنید (برای مثال `OPENAI_API_KEY`).
- پرچم‌های کلید درون‌خطی را پاس ندهید (برای مثال `--openai-api-key`) مگر اینکه آن متغیر env نیز تنظیم شده باشد.
- اگر یک پرچم کلید درون‌خطی بدون متغیر env لازم پاس داده شود، راه‌اندازی اولیه به‌سرعت با راهنمایی شکست می‌خورد.

گزینه‌های توکن Gateway در حالت غیرتعاملی:

- `--gateway-auth token --gateway-token <token>` یک توکن متنی ساده ذخیره می‌کند.
- `--gateway-auth token --gateway-token-ref-env <name>` مقدار `gateway.auth.token` را به‌عنوان یک SecretRef مبتنی بر env ذخیره می‌کند.
- `--gateway-token` و `--gateway-token-ref-env` ناسازگار با یکدیگرند.
- `--gateway-token-ref-env` به یک متغیر env غیرخالی در محیط فرایند راه‌اندازی اولیه نیاز دارد.
- با `--install-daemon`، وقتی احراز هویت توکنی به توکن نیاز دارد، توکن‌های gateway مدیریت‌شده با SecretRef اعتبارسنجی می‌شوند اما به‌صورت متن سادهٔ resolveشده در فرادادهٔ محیط سرویس supervisor پایدار نمی‌شوند.
- با `--install-daemon`، اگر حالت توکن به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، راه‌اندازی اولیه به‌صورت بسته با راهنمای رفع مشکل شکست می‌خورد.
- با `--install-daemon`، اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، راه‌اندازی اولیه نصب را تا زمانی که حالت به‌صراحت تنظیم شود مسدود می‌کند.
- راه‌اندازی اولیهٔ محلی `gateway.mode="local"` را در پیکربندی می‌نویسد. اگر فایل پیکربندی بعدی `gateway.mode` را نداشته باشد، آن را آسیب پیکربندی یا ویرایش دستی ناقص تلقی کنید، نه یک میان‌بر معتبر برای حالت محلی.
- راه‌اندازی اولیهٔ محلی Pluginهای قابل دانلودِ انتخاب‌شده را وقتی مسیر پیکربندی انتخاب‌شده به آن‌ها نیاز دارد نصب می‌کند.
- راه‌اندازی اولیهٔ راه دور فقط اطلاعات اتصال را برای Gateway راه دور می‌نویسد و بسته‌های Plugin محلی را نصب نمی‌کند.
- `--allow-unconfigured` یک راه‌گریز جداگانه برای زمان اجرای gateway است. این به این معنا نیست که راه‌اندازی اولیه می‌تواند `gateway.mode` را حذف کند.

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

سلامت gateway محلی غیرتعاملی:

- مگر اینکه `--skip-health` را پاس دهید، راه‌اندازی اولیه پیش از خروج موفق، منتظر یک gateway محلی در دسترس می‌ماند.
- `--install-daemon` ابتدا مسیر نصب gateway مدیریت‌شده را شروع می‌کند. بدون آن، باید از قبل یک gateway محلی در حال اجرا داشته باشید، برای مثال `openclaw gateway run`.
- اگر در خودکارسازی فقط نوشتن پیکربندی/workspace/bootstrap را می‌خواهید، از `--skip-health` استفاده کنید.
- اگر فایل‌های workspace را خودتان مدیریت می‌کنید، `--skip-bootstrap` را پاس دهید تا `agents.defaults.skipBootstrap: true` تنظیم شود و ایجاد `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md` و `BOOTSTRAP.md` رد شود.
- در Windows بومی، `--install-daemon` ابتدا Scheduled Tasks را امتحان می‌کند و اگر ایجاد task رد شود، به یک مورد ورود در پوشهٔ Startup برای هر کاربر برمی‌گردد.

رفتار راه‌اندازی اولیهٔ تعاملی با حالت ارجاع:

- هنگام نمایش اعلان، **Use secret reference** را انتخاب کنید.
- سپس یکی از این‌ها را انتخاب کنید:
  - متغیر محیطی
  - ارائه‌دهندهٔ secret پیکربندی‌شده (`file` یا `exec`)
- راه‌اندازی اولیه پیش از ذخیرهٔ ref یک اعتبارسنجی سریع preflight انجام می‌دهد.
  - اگر اعتبارسنجی شکست بخورد، راه‌اندازی اولیه خطا را نشان می‌دهد و به شما اجازهٔ تلاش دوباره می‌دهد.

### انتخاب‌های endpoint غیرتعاملی Z.AI

<Note>
`--auth-choice zai-api-key` بهترین endpoint Z.AI را برای کلید شما به‌طور خودکار تشخیص می‌دهد (API عمومی با `zai/glm-5.1` را ترجیح می‌دهد). اگر به‌طور مشخص endpointهای GLM Coding Plan را می‌خواهید، `zai-coding-global` یا `zai-coding-cn` را انتخاب کنید.
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

## یادداشت‌های جریان

<AccordionGroup>
  <Accordion title="انواع جریان">
    - `quickstart`: اعلان‌های حداقلی، تولید خودکار توکن gateway.
    - `manual`: اعلان‌های کامل برای پورت، bind و احراز هویت (نام مستعار `advanced`).
    - `import`: یک ارائه‌دهندهٔ مهاجرت شناسایی‌شده را اجرا می‌کند، برنامه را پیش‌نمایش می‌دهد، سپس پس از تأیید اعمال می‌کند.

  </Accordion>
  <Accordion title="پیش‌فیلتر کردن ارائه‌دهنده">
    وقتی یک انتخاب احراز هویت بر ارائه‌دهندهٔ ترجیحی دلالت می‌کند، راه‌اندازی اولیه انتخابگرهای مدل پیش‌فرض و allowlist را برای آن ارائه‌دهنده پیش‌فیلتر می‌کند. برای Volcengine و BytePlus، این کار گونه‌های coding-plan را نیز مطابقت می‌دهد (`volcengine-plan/*`، `byteplus-plan/*`).

    اگر فیلتر ارائه‌دهندهٔ ترجیحی هنوز هیچ مدل بارگذاری‌شده‌ای تولید نکند، راه‌اندازی اولیه به‌جای خالی گذاشتن انتخابگر، به کاتالوگ فیلترنشده برمی‌گردد.

  </Accordion>
  <Accordion title="پیگیری‌های جست‌وجوی وب">
    بعضی ارائه‌دهندگان جست‌وجوی وب اعلان‌های پیگیری مخصوص ارائه‌دهنده را فعال می‌کنند:

    - **Grok** می‌تواند پیکربندی اختیاری `x_search` را با همان `XAI_API_KEY` و یک انتخاب مدل `x_search` ارائه دهد.
    - **Kimi** می‌تواند ناحیهٔ Moonshot API (`api.moonshot.ai` در برابر `api.moonshot.cn`) و مدل پیش‌فرض جست‌وجوی وب Kimi را درخواست کند.

  </Accordion>
  <Accordion title="رفتارهای دیگر">
    - رفتار دامنهٔ DM در راه‌اندازی اولیهٔ محلی: [مرجع پیکربندی CLI](/fa/start/wizard-cli-reference#outputs-and-internals).
    - سریع‌ترین اولین گفت‌وگو: `openclaw dashboard` (Control UI، بدون پیکربندی کانال).
    - ارائه‌دهندهٔ سفارشی: هر endpoint سازگار با OpenAI یا Anthropic را وصل کنید، از جمله ارائه‌دهندگان میزبانی‌شده‌ای که فهرست نشده‌اند. برای تشخیص خودکار از Unknown استفاده کنید.
    - اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیه یک جریان مهاجرت پیشنهاد می‌کند. برای برنامه‌های dry-run، حالت بازنویسی، گزارش‌ها و نگاشت‌های دقیق از [Migrate](/fa/cli/migrate) استفاده کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های پیگیری رایج

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` به معنی حالت غیرتعاملی نیست. برای اسکریپت‌ها از `--non-interactive` استفاده کنید.
</Note>
