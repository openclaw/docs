---
read_when:
    - راه‌اندازی هدایت‌شده برای Gateway، فضای کاری، احراز هویت، کانال‌ها و Skills می‌خواهید
summary: مرجع CLI برای `openclaw onboard` (راه‌اندازی تعاملی)
title: راه‌اندازی
x-i18n:
    generated_at: "2026-06-30T22:24:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

راه‌اندازی اولیهٔ راهنمایی‌شدهٔ کامل برای تنظیم Gateway محلی یا راه‌دور. وقتی می‌خواهید OpenClaw احراز هویت مدل، فضای کاری، Gateway، کانال‌ها، Skills و سلامت را در یک جریان طی کند، از این استفاده کنید.

## راهنماهای مرتبط

<CardGroup cols={2}>
  <Card title="مرکز راه‌اندازی اولیهٔ CLI" href="/fa/start/wizard" icon="rocket">
    راهنمای گام‌به‌گام جریان تعاملی CLI.
  </Card>
  <Card title="نمای کلی راه‌اندازی اولیه" href="/fa/start/onboarding-overview" icon="map">
    اینکه راه‌اندازی اولیهٔ OpenClaw چگونه در کنار هم قرار می‌گیرد.
  </Card>
  <Card title="مرجع تنظیم CLI" href="/fa/start/wizard-cli-reference" icon="book">
    خروجی‌ها، سازوکارهای داخلی، و رفتار هر گام.
  </Card>
  <Card title="اتوماسیون CLI" href="/fa/start/wizard-cli-automation" icon="terminal">
    پرچم‌های غیرتعاملی و تنظیمات اسکریپت‌شده.
  </Card>
  <Card title="راه‌اندازی اولیهٔ برنامهٔ macOS" href="/fa/start/onboarding" icon="apple">
    جریان راه‌اندازی اولیه برای برنامهٔ نوار منوی macOS.
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

`--flow import` از ارائه‌دهنده‌های مهاجرت متعلق به Plugin مانند Hermes استفاده می‌کند. این فقط روی یک تنظیم تازهٔ OpenClaw اجرا می‌شود؛ اگر پیکربندی، اعتبارنامه‌ها، نشست‌ها، یا فایل‌های حافظه/هویت فضای کاری موجود باشند، پیش از وارد کردن، بازنشانی کنید یا یک تنظیم تازه انتخاب کنید.

`--modern` پیش‌نمایش راه‌اندازی اولیهٔ مکالمه‌ای Crestodian را شروع می‌کند. بدون
`--modern`، `openclaw onboard` جریان کلاسیک راه‌اندازی اولیه را نگه می‌دارد.

در نصب تازه‌ای که فایل پیکربندی فعال وجود ندارد یا هیچ تنظیمات نوشته‌شده‌ای
ندارد (خالی یا فقط فراداده)، `openclaw` بدون آرگومان نیز جریان کلاسیک
راه‌اندازی اولیه را شروع می‌کند. وقتی فایل پیکربندی تنظیمات نوشته‌شده داشته باشد، `openclaw` بدون آرگومان
به‌جای آن Crestodian را باز می‌کند.

`ws://` متن ساده برای local loopback، لفظ‌های IP خصوصی، `.local`، و
نشانی‌های Gateway مربوط به Tailnet `*.ts.net` پذیرفته می‌شود. برای نام‌های خصوصی-DNS قابل اعتماد دیگر،
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را در محیط فرایند راه‌اندازی اولیه تنظیم کنید.

## محلی‌سازی

راه‌اندازی اولیهٔ تعاملی از زبان ویزارد CLI برای متن ثابت تنظیم استفاده می‌کند. ترتیب
حل‌کردن به این شکل است:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. بازگشت پیش‌فرض به انگلیسی

زبان‌های پشتیبانی‌شدهٔ ویزارد `en`، `zh-CN`، و `zh-TW` هستند. مقدارهای زبان می‌توانند از
زیرخط یا شکل‌های پسوند POSIX مانند `zh_CN.UTF-8` استفاده کنند. نام‌های محصول، نام‌های دستور،
کلیدهای پیکربندی، URLها، شناسه‌های ارائه‌دهنده، شناسه‌های مدل، و برچسب‌های plugin/channel
به‌صورت لفظی باقی می‌مانند.

نمونه:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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
OpenClaw شناسه‌های مدل بینایی رایج را به‌طور خودکار دارای قابلیت تصویر علامت‌گذاری می‌کند. برای شناسه‌های بینایی سفارشی ناشناخته `--custom-image-input` را پاس بدهید، یا برای تحمیل فرادادهٔ فقط متنی از `--custom-text-input` استفاده کنید.
برای endpointهای سازگار با OpenAI که از `/v1/responses` پشتیبانی می‌کنند اما از `/v1/chat/completions` نه، از `--custom-compatibility openai-responses` استفاده کنید.

LM Studio در حالت غیرتعاملی از یک پرچم کلید ویژهٔ ارائه‌دهنده نیز پشتیبانی می‌کند:

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

کلیدهای ارائه‌دهنده را به‌جای متن ساده به‌صورت ref ذخیره کنید:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

با `--secret-input-mode ref`، راه‌اندازی اولیه به‌جای مقدارهای کلید متن ساده، refهای متکی بر env می‌نویسد.
برای ارائه‌دهنده‌های مبتنی بر auth-profile این کار ورودی‌های `keyRef` را می‌نویسد؛ برای ارائه‌دهنده‌های سفارشی این کار `models.providers.<id>.apiKey` را به‌عنوان یک env ref می‌نویسد (برای مثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

قرارداد حالت `ref` غیرتعاملی:

- متغیر env ارائه‌دهنده را در محیط فرایند راه‌اندازی اولیه تنظیم کنید (برای مثال `OPENAI_API_KEY`).
- پرچم‌های کلید درون‌خطی را پاس ندهید (برای مثال `--openai-api-key`) مگر اینکه آن متغیر env نیز تنظیم شده باشد.
- اگر پرچم کلید درون‌خطی بدون متغیر env لازم پاس داده شود، راه‌اندازی اولیه با راهنمایی سریعاً شکست می‌خورد.

گزینه‌های توکن Gateway در حالت غیرتعاملی:

- `--gateway-auth token --gateway-token <token>` یک توکن متن ساده ذخیره می‌کند.
- `--gateway-auth token --gateway-token-ref-env <name>` مقدار `gateway.auth.token` را به‌عنوان یک env SecretRef ذخیره می‌کند.
- `--gateway-token` و `--gateway-token-ref-env` ناسازگار با هم هستند.
- `--gateway-token-ref-env` به یک متغیر env غیرخالی در محیط فرایند راه‌اندازی اولیه نیاز دارد.
- با `--install-daemon`، وقتی احراز هویت توکنی به توکن نیاز دارد، توکن‌های Gateway مدیریت‌شده با SecretRef اعتبارسنجی می‌شوند اما به‌صورت متن سادهٔ حل‌شده در فرادادهٔ محیط سرویس supervisor پایدار نمی‌شوند.
- با `--install-daemon`، اگر حالت توکن به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، راه‌اندازی اولیه با راهنمایی ترمیمی به‌صورت بسته شکست می‌خورد.
- با `--install-daemon`، اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، راه‌اندازی اولیه نصب را تا زمانی که حالت صریحاً تنظیم شود مسدود می‌کند.
- راه‌اندازی اولیهٔ محلی `gateway.mode="local"` را در پیکربندی می‌نویسد. اگر فایل پیکربندی بعدی `gateway.mode` را نداشته باشد، آن را آسیب پیکربندی یا ویرایش دستی ناقص بدانید، نه میانبر معتبر حالت محلی.
- راه‌اندازی اولیهٔ محلی زمانی که مسیر تنظیم انتخاب‌شده به Pluginهای قابل دانلود نیاز داشته باشد، آن‌ها را نصب می‌کند.
- راه‌اندازی اولیهٔ راه‌دور فقط اطلاعات اتصال برای Gateway راه‌دور را می‌نویسد و بسته‌های Plugin محلی را نصب نمی‌کند.
- `--allow-unconfigured` یک راه فرار جداگانه برای زمان اجرای Gateway است. معنی‌اش این نیست که راه‌اندازی اولیه می‌تواند `gateway.mode` را حذف کند.

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

- مگر اینکه `--skip-health` را پاس بدهید، راه‌اندازی اولیه پیش از خروج موفق منتظر یک gateway محلی قابل دسترس می‌ماند.
- `--install-daemon` ابتدا مسیر نصب gateway مدیریت‌شده را شروع می‌کند. بدون آن، باید از قبل یک gateway محلی در حال اجرا داشته باشید، برای مثال `openclaw gateway run`.
- اگر در اتوماسیون فقط نوشتن پیکربندی/فضای کاری/bootstrap را می‌خواهید، از `--skip-health` استفاده کنید.
- اگر خودتان فایل‌های فضای کاری را مدیریت می‌کنید، `--skip-bootstrap` را پاس بدهید تا `agents.defaults.skipBootstrap: true` تنظیم شود و ایجاد `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، و `BOOTSTRAP.md` رد شود.
- در Windows بومی، `--install-daemon` ابتدا Scheduled Tasks را امتحان می‌کند و اگر ایجاد task رد شود، به یک آیتم ورود Startup-folder برای هر کاربر بازمی‌گردد.

رفتار راه‌اندازی اولیهٔ تعاملی با حالت ارجاع:

- هنگام درخواست، **استفاده از ارجاع مخفی** را انتخاب کنید.
- سپس یکی از این دو را انتخاب کنید:
  - متغیر محیطی
  - ارائه‌دهندهٔ راز پیکربندی‌شده (`file` یا `exec`)
- راه‌اندازی اولیه پیش از ذخیرهٔ ref یک اعتبارسنجی preflight سریع انجام می‌دهد.
  - اگر اعتبارسنجی شکست بخورد، راه‌اندازی اولیه خطا را نشان می‌دهد و اجازه می‌دهد دوباره تلاش کنید.

### انتخاب‌های endpoint غیرتعاملی Z.AI

<Note>
`--auth-choice zai-api-key` بهترین endpoint و مدل Z.AI را برای
کلید شما به‌طور خودکار تشخیص می‌دهد. endpointهای Coding Plan، `zai/glm-5.2` را ترجیح می‌دهند؛ endpointهای API عمومی از
`zai/glm-5.1` استفاده می‌کنند. برای تحمیل یک endpoint مربوط به Coding Plan، `zai-coding-global` یا
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

نمونهٔ Mistral غیرتعاملی:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## یادداشت‌های جریان

<AccordionGroup>
  <Accordion title="انواع جریان">
    - `quickstart`: درخواست‌های حداقلی، تولید خودکار توکن Gateway.
    - `manual`: درخواست‌های کامل برای پورت، bind، و auth (نام مستعار `advanced`).
    - `import`: یک ارائه‌دهندهٔ مهاجرت شناسایی‌شده را اجرا می‌کند، طرح را پیش‌نمایش می‌دهد، سپس پس از تأیید اعمال می‌کند.

  </Accordion>
  <Accordion title="پیش‌فیلتر کردن ارائه‌دهنده">
    وقتی یک انتخاب auth به ارائه‌دهندهٔ ترجیحی اشاره می‌کند، راه‌اندازی اولیه انتخابگرهای مدل پیش‌فرض و allowlist را به آن ارائه‌دهنده پیش‌فیلتر می‌کند. برای Volcengine و BytePlus، این همچنین با گونه‌های coding-plan (`volcengine-plan/*`، `byteplus-plan/*`) مطابقت دارد.

    اگر فیلتر ارائه‌دهندهٔ ترجیحی هنوز هیچ مدل بارگذاری‌شده‌ای ندهد، راه‌اندازی اولیه به‌جای خالی گذاشتن انتخابگر، به کاتالوگ فیلترنشده بازمی‌گردد.

  </Accordion>
  <Accordion title="پیگیری‌های جست‌وجوی وب">
    برخی ارائه‌دهنده‌های جست‌وجوی وب درخواست‌های پیگیری ویژهٔ ارائه‌دهنده را فعال می‌کنند:

    - **Grok** می‌تواند تنظیم اختیاری `x_search` را با همان پروفایل xAI OAuth یا کلید API و یک انتخاب مدل `x_search` پیشنهاد کند.
    - **Kimi** می‌تواند منطقهٔ API مربوط به Moonshot (`api.moonshot.ai` در برابر `api.moonshot.cn`) و مدل پیش‌فرض جست‌وجوی وب Kimi را بپرسد.

  </Accordion>
  <Accordion title="رفتارهای دیگر">
    - رفتار محدودهٔ DM در راه‌اندازی اولیهٔ محلی: [مرجع تنظیم CLI](/fa/start/wizard-cli-reference#outputs-and-internals).
    - سریع‌ترین چت اول: `openclaw dashboard` (Control UI، بدون تنظیم کانال).
    - ارائه‌دهندهٔ سفارشی: هر endpoint سازگار با OpenAI یا Anthropic را، از جمله ارائه‌دهنده‌های میزبانی‌شده‌ای که فهرست نشده‌اند، وصل کنید. برای تشخیص خودکار از Unknown استفاده کنید.
    - اگر وضعیت Hermes شناسایی شود، راه‌اندازی اولیه یک جریان مهاجرت پیشنهاد می‌کند. برای طرح‌های dry-run، حالت بازنویسی، گزارش‌ها، و نگاشت‌های دقیق از [مهاجرت](/fa/cli/migrate) استفاده کنید.

  </Accordion>
</AccordionGroup>

## دستورهای رایج بعدی

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

از `openclaw setup` به‌عنوان همان نقطهٔ ورود راه‌اندازی اولیهٔ راهنمایی‌شده استفاده کنید. وقتی فقط به پیکربندی/فضای کاری پایه نیاز دارید، از `openclaw setup --baseline` استفاده کنید، بعداً برای تغییرات هدفمند از `openclaw configure`، و برای تنظیم فقط کانال از `openclaw channels add` استفاده کنید.

<Note>
`--json` به معنی حالت غیرتعاملی نیست. برای اسکریپت‌ها از `--non-interactive` استفاده کنید.
</Note>
