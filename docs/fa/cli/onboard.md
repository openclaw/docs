---
read_when:
    - شما راه‌اندازی هدایت‌شده برای Gateway، فضای کاری، احراز هویت، کانال‌ها و Skills می‌خواهید
summary: مرجع CLI برای `openclaw onboard` (آماده‌سازی تعاملی)
title: راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-07-04T20:38:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

راه‌اندازی اولیهٔ هدایت‌شدهٔ کامل برای تنظیم Gateway محلی یا راه دور. زمانی از این استفاده کنید که می‌خواهید OpenClaw احراز هویت مدل، فضای کاری، Gateway، کانال‌ها، Skills و سلامت را در یک جریان مرور کند.

## راهنماهای مرتبط

<CardGroup cols={2}>
  <Card title="مرکز راه‌اندازی اولیهٔ CLI" href="/fa/start/wizard" icon="rocket">
    راهنمای گام‌به‌گام جریان تعاملی CLI.
  </Card>
  <Card title="نمای کلی راه‌اندازی اولیه" href="/fa/start/onboarding-overview" icon="map">
    راه‌اندازی اولیهٔ OpenClaw چگونه کنار هم قرار می‌گیرد.
  </Card>
  <Card title="مرجع تنظیم CLI" href="/fa/start/wizard-cli-reference" icon="book">
    خروجی‌ها، سازوکارهای داخلی، و رفتار هر مرحله.
  </Card>
  <Card title="اتوماسیون CLI" href="/fa/start/wizard-cli-automation" icon="terminal">
    پرچم‌های غیرتعاملی و تنظیم‌های اسکریپت‌شده.
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

`--flow import` از ارائه‌دهنده‌های مهاجرتِ متعلق به Plugin مانند Hermes استفاده می‌کند. این گزینه فقط روی یک تنظیم تازهٔ OpenClaw اجرا می‌شود؛ اگر پیکربندی، اعتبارنامه‌ها، نشست‌ها، یا فایل‌های حافظه/هویت فضای کاری موجود باشند، پیش از وارد کردن، بازنشانی کنید یا یک تنظیم تازه انتخاب کنید.

`--modern` پیش‌نمایش راه‌اندازی اولیهٔ گفت‌وگویی Crestodian را شروع می‌کند. بدون
`--modern`، `openclaw onboard` جریان کلاسیک راه‌اندازی اولیه را نگه می‌دارد.

در یک ترمینال تعاملی، `openclaw` خام (بدون زیرفرمان) بر اساس وضعیت پیکربندی
مسیریابی می‌شود:

- اگر فایل پیکربندی فعال وجود نداشته باشد یا هیچ تنظیم نوشته‌شده‌ای نداشته باشد (خالی یا
  فقط شامل فراداده)، این جریان کلاسیک راه‌اندازی اولیه را شروع می‌کند.
- اگر فایل پیکربندی وجود داشته باشد اما اعتبارسنجی آن شکست بخورد،
  [Crestodian](/fa/cli/crestodian) را برای تعمیر شروع می‌کند.
- اگر فایل پیکربندی معتبر باشد، TUI عامل عادی را باز می‌کند، یا به‌صورت محلی
  یا متصل به یک Gateway پیکربندی‌شدهٔ در دسترس. در یک نصب پیکربندی‌شده،
  از داخل TUI با `/crestodian` یا با `openclaw crestodian` به Crestodian برسید.

متن سادهٔ `ws://` برای loopback، نویسه‌های IP خصوصی، `.local`، و
نشانی‌های Gateway در Tailnet با الگوی `*.ts.net` پذیرفته می‌شود. برای نام‌های خصوصی-DNS قابل اعتماد دیگر،
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را در محیط فرایند راه‌اندازی اولیه تنظیم کنید.

## زبان

راه‌اندازی اولیهٔ تعاملی از زبان جادوگر CLI برای متن ثابت تنظیم استفاده می‌کند. ترتیب
حل‌وفصل چنین است:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. بازگشت به انگلیسی

زبان‌های پشتیبانی‌شدهٔ جادوگر `en`، `zh-CN`، و `zh-TW` هستند. مقدارهای زبان می‌توانند از
زیرخط یا شکل‌های پسوند POSIX مانند `zh_CN.UTF-8` استفاده کنند. نام‌های محصول، نام‌های فرمان،
کلیدهای پیکربندی، URLها، شناسه‌های ارائه‌دهنده، شناسه‌های مدل، و برچسب‌های Plugin/کانال
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
OpenClaw شناسه‌های رایج مدل‌های بینایی را به‌طور خودکار دارای قابلیت تصویر علامت‌گذاری می‌کند. برای شناسه‌های سفارشی بینایی ناشناخته `--custom-image-input` را پاس کنید، یا برای اجبار فرادادهٔ فقط‌متنی از `--custom-text-input` استفاده کنید.
برای نقاط پایانی سازگار با OpenAI که از `/v1/responses` پشتیبانی می‌کنند اما از `/v1/chat/completions` نه، از `--custom-compatibility openai-responses` استفاده کنید.

LM Studio همچنین در حالت غیرتعاملی از یک پرچم کلید ویژهٔ ارائه‌دهنده پشتیبانی می‌کند:

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

با `--secret-input-mode ref`، راه‌اندازی اولیه به‌جای مقدارهای کلیدِ متن ساده، ارجاع‌های مبتنی بر env می‌نویسد.
برای ارائه‌دهنده‌های مبتنی بر نمایهٔ احراز هویت، این کار ورودی‌های `keyRef` می‌نویسد؛ برای ارائه‌دهنده‌های سفارشی، `models.providers.<id>.apiKey` را به‌عنوان یک ارجاع env می‌نویسد (برای مثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

قرارداد حالت `ref` غیرتعاملی:

- متغیر env ارائه‌دهنده را در محیط فرایند راه‌اندازی اولیه تنظیم کنید (برای مثال `OPENAI_API_KEY`).
- پرچم‌های کلید درون‌خطی (برای مثال `--openai-api-key`) را پاس نکنید مگر اینکه آن متغیر env نیز تنظیم شده باشد.
- اگر یک پرچم کلید درون‌خطی بدون متغیر env لازم پاس شود، راه‌اندازی اولیه سریع و همراه با راهنمایی شکست می‌خورد.

گزینه‌های توکن Gateway در حالت غیرتعاملی:

- `--gateway-auth token --gateway-token <token>` یک توکن متن ساده ذخیره می‌کند.
- `--gateway-auth token --gateway-token-ref-env <name>` مقدار `gateway.auth.token` را به‌عنوان یک SecretRef مبتنی بر env ذخیره می‌کند.
- `--gateway-token` و `--gateway-token-ref-env` ناسازگار با یکدیگر هستند.
- `--gateway-token-ref-env` به یک متغیر env غیرخالی در محیط فرایند راه‌اندازی اولیه نیاز دارد.
- با `--install-daemon`، وقتی احراز هویت توکنی به توکن نیاز دارد، توکن‌های Gateway مدیریت‌شده با SecretRef اعتبارسنجی می‌شوند اما به‌صورت متن سادهٔ حل‌شده در فرادادهٔ محیط سرویس supervisor پایدار نمی‌شوند.
- با `--install-daemon`، اگر حالت توکن به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، راه‌اندازی اولیه به‌صورت بسته شکست می‌خورد و راهنمایی ترمیم ارائه می‌دهد.
- با `--install-daemon`، اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، راه‌اندازی اولیه نصب را تا زمانی که حالت به‌صراحت تنظیم شود مسدود می‌کند.
- راه‌اندازی اولیهٔ محلی `gateway.mode="local"` را در پیکربندی می‌نویسد. اگر یک فایل پیکربندی بعدی `gateway.mode` را نداشته باشد، آن را آسیب پیکربندی یا ویرایش دستی ناقص در نظر بگیرید، نه یک میان‌بر معتبر حالت محلی.
- راه‌اندازی اولیهٔ محلی Pluginهای دانلودشدنی انتخاب‌شده را وقتی مسیر تنظیم انتخاب‌شده به آن‌ها نیاز دارد نصب می‌کند.
- راه‌اندازی اولیهٔ راه دور فقط اطلاعات اتصال برای Gateway راه دور را می‌نویسد و بسته‌های Plugin محلی را نصب نمی‌کند.
- `--allow-unconfigured` یک راه گریز جداگانهٔ زمان اجرای Gateway است. این به این معنا نیست که راه‌اندازی اولیه می‌تواند `gateway.mode` را حذف کند.

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

- مگر اینکه `--skip-health` را پاس کنید، راه‌اندازی اولیه پیش از خروج موفق، منتظر یک Gateway محلی در دسترس می‌ماند.
- `--install-daemon` ابتدا مسیر نصب Gateway مدیریت‌شده را شروع می‌کند. بدون آن، باید از قبل یک Gateway محلی در حال اجرا داشته باشید، برای مثال `openclaw gateway run`.
- اگر در اتوماسیون فقط نوشتن پیکربندی/فضای کاری/bootstrap را می‌خواهید، از `--skip-health` استفاده کنید.
- اگر خودتان فایل‌های فضای کاری را مدیریت می‌کنید، `--skip-bootstrap` را پاس کنید تا `agents.defaults.skipBootstrap: true` تنظیم شود و ایجاد `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`، و `BOOTSTRAP.md` رد شود.
- در Windows بومی، `--install-daemon` ابتدا Scheduled Tasks را امتحان می‌کند و اگر ایجاد task رد شود، به یک مورد ورود پوشهٔ Startup برای هر کاربر بازمی‌گردد.

رفتار راه‌اندازی اولیهٔ تعاملی با حالت ارجاع:

- هنگام درخواست، **استفاده از ارجاع محرمانه** را انتخاب کنید.
- سپس یکی از این دو را انتخاب کنید:
  - متغیر محیطی
  - ارائه‌دهندهٔ محرمانهٔ پیکربندی‌شده (`file` یا `exec`)
- راه‌اندازی اولیه پیش از ذخیرهٔ ارجاع، یک اعتبارسنجی پیش‌پرواز سریع انجام می‌دهد.
  - اگر اعتبارسنجی شکست بخورد، راه‌اندازی اولیه خطا را نشان می‌دهد و اجازهٔ تلاش دوباره می‌دهد.

### انتخاب‌های نقطهٔ پایانی Z.AI غیرتعاملی

<Note>
`--auth-choice zai-api-key` بهترین نقطهٔ پایانی و مدل Z.AI را برای
کلید شما به‌طور خودکار تشخیص می‌دهد. نقاط پایانی Coding Plan، `zai/glm-5.2` را ترجیح می‌دهند؛ نقاط پایانی API عمومی از
`zai/glm-5.1` استفاده می‌کنند. برای اجبار یک نقطهٔ پایانی Coding Plan، `zai-coding-global` یا
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

## پرچم‌های غیرتعاملی اضافی

احراز هویت مدل مبتنی بر توکن (غیرتعاملی؛ همراه با `--auth-choice token` استفاده می‌شود):

- `--token-provider <id>` — شناسهٔ ارائه‌دهندهٔ توکن. مشخص می‌کند کدام ارائه‌دهنده توکن را صادر می‌کند.
- `--token <token>` — مقدار توکن برای احراز هویت مدل.
- `--token-profile-id <id>` — شناسهٔ نمایهٔ احراز هویت. ذخیره‌سازی توکن عمومی به‌طور پیش‌فرض `<provider>:manual` است؛ جریان‌های تنظیم متعلق به ارائه‌دهنده ممکن است از پیش‌فرض خود استفاده کنند، مانند `anthropic:default`.
- `--token-expires-in <duration>` — مدت انقضای اختیاری توکن (مثلاً `365d`، `12h`).

Cloudflare AI Gateway (غیرتعاملی):

- `--cloudflare-ai-gateway-account-id <id>` — شناسهٔ حساب Cloudflare برای مسیریابی از طریق Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — شناسهٔ Cloudflare AI Gateway.

کنترل نصب daemon:

- `--no-install-daemon` — نصب سرویس Gateway را به‌صراحت رد می‌کند.
- `--skip-daemon` — نام مستعار برای `--no-install-daemon`.

کنترل تنظیم UI و hook:

- `--skip-ui` — درخواست‌های Control UI / TUI را در طول راه‌اندازی اولیه رد می‌کند.
- `--skip-hooks` — درخواست‌های تنظیم webhook / hook را در طول راه‌اندازی اولیه رد می‌کند.

سرکوب خروجی:

- `--suppress-gateway-token-output` — خروجی Gateway/UI دارای توکن را سرکوب می‌کند (راهنماهای توکن، URL ورود خودکار با توکن جاسازی‌شده، و اجرای خودکار Control UI). در محیط‌های ترمینال مشترک و CI مفید است.

## نکات جریان

<AccordionGroup>
  <Accordion title="انواع جریان">
    - `quickstart`: درخواست‌های حداقلی، یک توکن Gateway را به‌طور خودکار تولید می‌کند.
    - `manual`: درخواست‌های کامل برای پورت، bind، و احراز هویت (نام مستعار `advanced`).
    - `import`: یک ارائه‌دهندهٔ مهاجرت تشخیص‌داده‌شده را اجرا می‌کند، برنامه را پیش‌نمایش می‌دهد، سپس پس از تأیید اعمال می‌کند.

  </Accordion>
  <Accordion title="پیش‌فیلتر کردن ارائه‌دهنده">
    وقتی یک انتخاب احراز هویت به یک ارائه‌دهندهٔ ترجیحی اشاره می‌کند، راه‌اندازی اولیه انتخابگرهای مدل پیش‌فرض و allowlist را به آن ارائه‌دهنده پیش‌فیلتر می‌کند. برای Volcengine و BytePlus، این همچنین گونه‌های coding-plan را تطبیق می‌دهد (`volcengine-plan/*`، `byteplus-plan/*`).

    اگر فیلتر ارائه‌دهندهٔ ترجیحی هنوز هیچ مدل بارگذاری‌شده‌ای برنگرداند، راه‌اندازی اولیه به‌جای خالی گذاشتن انتخابگر، به کاتالوگ بدون فیلتر بازمی‌گردد.

  </Accordion>
  <Accordion title="پیگیری‌های جست‌وجوی وب">
    برخی ارائه‌دهنده‌های جست‌وجوی وب، درخواست‌های پیگیری ویژهٔ ارائه‌دهنده را فعال می‌کنند:

    - **Grok** می‌تواند تنظیم اختیاری `x_search` را با همان نمایهٔ OAuth یا کلید API متعلق به xAI و یک انتخاب مدل `x_search` ارائه کند.
    - **Kimi** می‌تواند منطقهٔ API مربوط به Moonshot (`api.moonshot.ai` در برابر `api.moonshot.cn`) و مدل پیش‌فرض جست‌وجوی وب Kimi را بپرسد.

  </Accordion>
  <Accordion title="رفتارهای دیگر">
    - رفتار دامنهٔ DM در راه‌اندازی اولیهٔ محلی: [مرجع تنظیم CLI](/fa/start/wizard-cli-reference#outputs-and-internals).
    - سریع‌ترین چت اول: `openclaw dashboard` (Control UI، بدون تنظیم کانال).
    - ارائه‌دهندهٔ سفارشی: هر نقطهٔ پایانی سازگار با OpenAI یا Anthropic را، از جمله ارائه‌دهنده‌های میزبانی‌شده‌ای که فهرست نشده‌اند، متصل کنید. برای تشخیص خودکار از Unknown استفاده کنید.
    - اگر وضعیت Hermes تشخیص داده شود، راه‌اندازی اولیه یک جریان مهاجرت ارائه می‌کند. برای برنامه‌های dry-run، حالت overwrite، گزارش‌ها، و نگاشت‌های دقیق از [مهاجرت](/fa/cli/migrate) استفاده کنید.

  </Accordion>
</AccordionGroup>

## فرمان‌های پیگیری رایج

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

از `openclaw setup` به‌عنوان همان نقطهٔ ورود راه‌اندازی هدایت‌شده استفاده کنید. وقتی فقط به پیکربندی/فضای کاری پایه نیاز دارید از `openclaw setup --baseline` استفاده کنید، برای تغییرات هدفمند بعدی از `openclaw configure`، و برای راه‌اندازی فقط کانال از `openclaw channels add` استفاده کنید.

<Note>
`--json` به‌معنای حالت غیرتعاملی نیست. برای اسکریپت‌ها از `--non-interactive` استفاده کنید.
</Note>
