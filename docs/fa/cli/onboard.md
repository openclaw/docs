---
read_when:
    - شما راه‌اندازی راهنمایی‌شده برای Gateway، فضای کاری، احراز هویت، کانال‌ها و Skills می‌خواهید
summary: مرجع CLI برای `openclaw onboard` (آماده‌سازی اولیهٔ تعاملی)
title: راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-05-01T11:43:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1276a0b20f37da470bb4d49b38d06bacc38e7d0e85737a22971a2a9a3d90e244
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

راهنمای راه‌اندازی تعاملی برای تنظیم Gateway محلی یا راه دور.

## راهنماهای مرتبط

<CardGroup cols={2}>
  <Card title="مرکز راه‌اندازی CLI" href="/fa/start/wizard" icon="rocket">
    راهنمای گام‌به‌گام جریان تعاملی CLI.
  </Card>
  <Card title="نمای کلی راه‌اندازی" href="/fa/start/onboarding-overview" icon="map">
    نحوه کنار هم قرار گرفتن راه‌اندازی OpenClaw.
  </Card>
  <Card title="مرجع تنظیم CLI" href="/fa/start/wizard-cli-reference" icon="book">
    خروجی‌ها، سازوکارهای داخلی، و رفتار هر مرحله.
  </Card>
  <Card title="اتوماسیون CLI" href="/fa/start/wizard-cli-automation" icon="terminal">
    پرچم‌های غیرتعاملی و تنظیمات اسکریپتی.
  </Card>
  <Card title="راه‌اندازی برنامه macOS" href="/fa/start/onboarding" icon="apple">
    جریان راه‌اندازی برای برنامه نوار منوی macOS.
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

`--flow import` از ارائه‌دهندگان مهاجرت متعلق به plugin مانند Hermes استفاده می‌کند. این فقط روی یک تنظیم تازه OpenClaw اجرا می‌شود؛ اگر پیکربندی، اعتبارنامه‌ها، نشست‌ها، یا فایل‌های حافظه/هویت فضای کاری موجود باشند، پیش از واردسازی، بازنشانی کنید یا یک تنظیم تازه انتخاب کنید.

`--modern` پیش‌نمایش راه‌اندازی گفت‌وگویی Crestodian را شروع می‌کند. بدون
`--modern`، `openclaw onboard` جریان راه‌اندازی کلاسیک را حفظ می‌کند.

برای مقصدهای `ws://` متنی ساده در شبکه خصوصی (فقط شبکه‌های مورد اعتماد)،
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را در محیط فرایند راه‌اندازی تنظیم کنید.
برای این break-glass انتقال سمت کلاینت، معادل `openclaw.json` وجود ندارد.

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

`--custom-api-key` در حالت غیرتعاملی اختیاری است. اگر حذف شود، راه‌اندازی `CUSTOM_API_KEY` را بررسی می‌کند.
OpenClaw شناسه‌های رایج مدل‌های بینایی را به‌طور خودکار دارای قابلیت تصویر علامت‌گذاری می‌کند. برای شناسه‌های سفارشی ناشناخته بینایی، `--custom-image-input` را بفرستید، یا برای اجبار فراداده فقط‌متنی از `--custom-text-input` استفاده کنید.

LM Studio همچنین در حالت غیرتعاملی از یک پرچم کلید اختصاصی ارائه‌دهنده پشتیبانی می‌کند:

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

`--custom-base-url` به‌طور پیش‌فرض `http://127.0.0.1:11434` است. `--custom-model-id` اختیاری است؛ اگر حذف شود، راه‌اندازی از پیش‌فرض‌های پیشنهادی Ollama استفاده می‌کند. شناسه‌های مدل ابری مانند `kimi-k2.5:cloud` نیز اینجا کار می‌کنند.

کلیدهای ارائه‌دهنده را به‌جای متن ساده، به‌صورت ref ذخیره کنید:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

با `--secret-input-mode ref`، راه‌اندازی به‌جای مقدارهای کلید متنی ساده، refهای پشتیبانی‌شده با env می‌نویسد.
برای ارائه‌دهندگان پشتیبانی‌شده با auth-profile این کار ورودی‌های `keyRef` را می‌نویسد؛ برای ارائه‌دهندگان سفارشی، `models.providers.<id>.apiKey` را به‌صورت یک env ref می‌نویسد (برای مثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

قرارداد حالت `ref` غیرتعاملی:

- متغیر env ارائه‌دهنده را در محیط فرایند راه‌اندازی تنظیم کنید (برای مثال `OPENAI_API_KEY`).
- پرچم‌های کلید درون‌خطی را نفرستید (برای مثال `--openai-api-key`) مگر اینکه آن متغیر env نیز تنظیم شده باشد.
- اگر یک پرچم کلید درون‌خطی بدون متغیر env لازم فرستاده شود، راه‌اندازی سریعاً با راهنمایی شکست می‌خورد.

گزینه‌های توکن Gateway در حالت غیرتعاملی:

- `--gateway-auth token --gateway-token <token>` یک توکن متنی ساده ذخیره می‌کند.
- `--gateway-auth token --gateway-token-ref-env <name>` مقدار `gateway.auth.token` را به‌صورت یک env SecretRef ذخیره می‌کند.
- `--gateway-token` و `--gateway-token-ref-env` ناسازگارند و نمی‌توانند هم‌زمان استفاده شوند.
- `--gateway-token-ref-env` به یک متغیر env غیرخالی در محیط فرایند راه‌اندازی نیاز دارد.
- با `--install-daemon`، وقتی احراز هویت توکنی به توکن نیاز دارد، توکن‌های Gateway مدیریت‌شده با SecretRef اعتبارسنجی می‌شوند اما به‌صورت متن ساده resolveشده در فراداده محیط سرویس supervisor پایدار نمی‌شوند.
- با `--install-daemon`، اگر حالت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده resolve نشده باشد، راه‌اندازی به‌صورت بسته شکست می‌خورد و راهنمای رفع مشکل ارائه می‌دهد.
- با `--install-daemon`، اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، راه‌اندازی نصب را تا زمانی که mode صراحتاً تنظیم شود مسدود می‌کند.
- راه‌اندازی محلی `gateway.mode="local"` را در پیکربندی می‌نویسد. اگر یک فایل پیکربندی بعدی فاقد `gateway.mode` باشد، آن را آسیب پیکربندی یا ویرایش دستی ناقص در نظر بگیرید، نه یک میان‌بر معتبر حالت محلی.
- راه‌اندازی محلی پس از نوشتن پیکربندی، وابستگی‌های runtime pluginهای همراه را که تازه لازم شده‌اند materialize می‌کند، پیش از آنکه فضای کاری/bootstrap، نصب daemon، یا بررسی‌های سلامت ادامه پیدا کنند. این یک مرحله محدود تعمیر package-manager است، نه اجرای کامل `openclaw doctor`.
- راه‌اندازی راه دور فقط اطلاعات اتصال برای Gateway راه دور را می‌نویسد و وابستگی‌های plugin همراه محلی را نصب نمی‌کند.
- `--allow-unconfigured` یک راه گریز جداگانه برای runtime Gateway است. این به این معنا نیست که راه‌اندازی می‌تواند `gateway.mode` را حذف کند.

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

- مگر اینکه `--skip-health` را بفرستید، راه‌اندازی پیش از خروج موفق، منتظر یک Gateway محلی قابل دسترس می‌ماند.
- `--install-daemon` ابتدا مسیر نصب Gateway مدیریت‌شده را شروع می‌کند. بدون آن، باید از قبل یک Gateway محلی در حال اجرا داشته باشید، برای مثال `openclaw gateway run`.
- اگر در اتوماسیون فقط نوشتن پیکربندی/فضای کاری/bootstrap را می‌خواهید، از `--skip-health` استفاده کنید.
- اگر فایل‌های فضای کاری را خودتان مدیریت می‌کنید، `--skip-bootstrap` را بفرستید تا `agents.defaults.skipBootstrap: true` تنظیم شود و ایجاد `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، و `BOOTSTRAP.md` رد شود.
- در Windows بومی، `--install-daemon` ابتدا Scheduled Tasks را امتحان می‌کند و اگر ایجاد task رد شود، به یک آیتم ورود پوشه Startup برای هر کاربر برمی‌گردد.

رفتار راه‌اندازی تعاملی با حالت reference:

- هنگام درخواست، **Use secret reference** را انتخاب کنید.
- سپس یکی از این‌ها را انتخاب کنید:
  - متغیر محیطی
  - ارائه‌دهنده secret پیکربندی‌شده (`file` یا `exec`)
- راه‌اندازی پیش از ذخیره ref، یک اعتبارسنجی سریع preflight انجام می‌دهد.
  - اگر اعتبارسنجی شکست بخورد، راه‌اندازی خطا را نشان می‌دهد و اجازه تلاش دوباره می‌دهد.

### انتخاب‌های endpoint غیرتعاملی Z.AI

<Note>
`--auth-choice zai-api-key` بهترین endpoint Z.AI را برای کلید شما به‌طور خودکار تشخیص می‌دهد (API عمومی با `zai/glm-5.1` را ترجیح می‌دهد). اگر مشخصاً endpointهای GLM Coding Plan را می‌خواهید، `zai-coding-global` یا `zai-coding-cn` را انتخاب کنید.
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

## نکات جریان

<AccordionGroup>
  <Accordion title="انواع جریان">
    - `quickstart`: درخواست‌های حداقلی، تولید خودکار یک توکن gateway.
    - `manual`: درخواست‌های کامل برای پورت، bind، و auth (نام مستعار `advanced`).
    - `import`: یک ارائه‌دهنده مهاجرت شناسایی‌شده را اجرا می‌کند، طرح را پیش‌نمایش می‌دهد، سپس پس از تأیید اعمال می‌کند.

  </Accordion>
  <Accordion title="پیش‌فیلتر کردن ارائه‌دهنده">
    وقتی یک انتخاب auth به یک ارائه‌دهنده ترجیحی اشاره دارد، راه‌اندازی انتخابگرهای مدل پیش‌فرض و allowlist را به آن ارائه‌دهنده پیش‌فیلتر می‌کند. برای Volcengine و BytePlus، این همچنین با گونه‌های coding-plan مطابقت دارد (`volcengine-plan/*`، `byteplus-plan/*`).

    اگر فیلتر ارائه‌دهنده ترجیحی هنوز هیچ مدل بارگذاری‌شده‌ای تولید نکند، راه‌اندازی به‌جای خالی گذاشتن انتخابگر، به کاتالوگ فیلترنشده برمی‌گردد.

  </Accordion>
  <Accordion title="پیگیری‌های جست‌وجوی وب">
    برخی ارائه‌دهندگان جست‌وجوی وب، درخواست‌های پیگیری اختصاصی ارائه‌دهنده را فعال می‌کنند:

    - **Grok** می‌تواند تنظیم اختیاری `x_search` را با همان `XAI_API_KEY` و یک انتخاب مدل `x_search` ارائه کند.
    - **Kimi** می‌تواند منطقه API Moonshot (`api.moonshot.ai` در برابر `api.moonshot.cn`) و مدل پیش‌فرض جست‌وجوی وب Kimi را درخواست کند.

  </Accordion>
  <Accordion title="رفتارهای دیگر">
    - رفتار محدوده DM در راه‌اندازی محلی: [مرجع تنظیم CLI](/fa/start/wizard-cli-reference#outputs-and-internals).
    - سریع‌ترین گفت‌وگوی اول: `openclaw dashboard` (Control UI، بدون تنظیم کانال).
    - ارائه‌دهنده سفارشی: هر endpoint سازگار با OpenAI یا Anthropic را وصل کنید، از جمله ارائه‌دهندگان میزبانی‌شده‌ای که فهرست نشده‌اند. برای تشخیص خودکار از Unknown استفاده کنید.
    - اگر وضعیت Hermes شناسایی شود، راه‌اندازی یک جریان مهاجرت پیشنهاد می‌دهد. برای طرح‌های dry-run، حالت overwrite، گزارش‌ها، و نگاشت‌های دقیق از [Migrate](/fa/cli/migrate) استفاده کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های پیگیری رایج

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` به معنای حالت غیرتعاملی نیست. برای اسکریپت‌ها از `--non-interactive` استفاده کنید.
</Note>
