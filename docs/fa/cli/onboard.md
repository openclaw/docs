---
read_when:
    - شما راه‌اندازی هدایت‌شده برای Gateway، فضای کاری، احراز هویت، کانال‌ها و Skills می‌خواهید
summary: مرجع CLI برای `openclaw onboard` (راه‌اندازی تعاملی)
title: راه‌اندازی اولیه
x-i18n:
    generated_at: "2026-06-27T17:26:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

آنبوردینگ هدایت‌شده کامل برای راه‌اندازی Gateway محلی یا راه دور. وقتی می‌خواهید OpenClaw احراز هویت مدل، فضای کاری، Gateway، کانال‌ها، Skills و سلامت را در یک جریان طی کند، از این استفاده کنید.

## راهنماهای مرتبط

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/fa/start/wizard" icon="rocket">
    مرور گام‌به‌گام جریان تعاملی CLI.
  </Card>
  <Card title="Onboarding overview" href="/fa/start/onboarding-overview" icon="map">
    اینکه آنبوردینگ OpenClaw چگونه کنار هم قرار می‌گیرد.
  </Card>
  <Card title="CLI setup reference" href="/fa/start/wizard-cli-reference" icon="book">
    خروجی‌ها، جزئیات داخلی، و رفتار هر گام.
  </Card>
  <Card title="CLI automation" href="/fa/start/wizard-cli-automation" icon="terminal">
    پرچم‌های غیرتعاملی و راه‌اندازی‌های اسکریپت‌شده.
  </Card>
  <Card title="macOS app onboarding" href="/fa/start/onboarding" icon="apple">
    جریان آنبوردینگ برای برنامه نوار منوی macOS.
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

`--flow import` از ارائه‌دهنده‌های مهاجرت تحت مالکیت Plugin مانند Hermes استفاده می‌کند. این فقط روی یک راه‌اندازی تازه OpenClaw اجرا می‌شود؛ اگر پیکربندی، اعتبارنامه‌ها، نشست‌ها، یا فایل‌های حافظه/هویت فضای کاری موجود باشند، پیش از import بازنشانی کنید یا یک راه‌اندازی تازه انتخاب کنید.

`--modern` پیش‌نمایش آنبوردینگ گفت‌وگویی Crestodian را شروع می‌کند. بدون
`--modern`، `openclaw onboard` جریان کلاسیک آنبوردینگ را نگه می‌دارد.

در نصب تازه‌ای که فایل پیکربندی فعال وجود ندارد یا هیچ تنظیم نوشته‌شده‌ای
ندارد (خالی یا فقط فراداده)، اجرای ساده `openclaw` نیز جریان کلاسیک
آنبوردینگ را شروع می‌کند. وقتی فایل پیکربندی تنظیمات نوشته‌شده داشته باشد،
اجرای ساده `openclaw` به‌جای آن Crestodian را باز می‌کند.

متن ساده `ws://` برای local loopback، IPهای خصوصی literal، `.local` و
URLهای Gateway در Tailnet با `*.ts.net` پذیرفته می‌شود. برای نام‌های خصوصی-DNS
معتمد دیگر، `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را در محیط فرایند آنبوردینگ تنظیم کنید.

## زبان

آنبوردینگ تعاملی برای متن‌های ثابت راه‌اندازی از زبان ویزارد CLI استفاده می‌کند. ترتیب
تشخیص این است:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. بازگشت به انگلیسی

زبان‌های پشتیبانی‌شده ویزارد `en`، `zh-CN` و `zh-TW` هستند. مقادیر زبان می‌توانند از
زیرخط یا شکل‌های پسوند POSIX مانند `zh_CN.UTF-8` استفاده کنند. نام‌های محصول، نام‌های
دستور، کلیدهای پیکربندی، URLها، شناسه‌های ارائه‌دهنده، شناسه‌های مدل، و برچسب‌های Plugin/کانال
literal باقی می‌مانند.

مثال:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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

`--custom-api-key` در حالت غیرتعاملی اختیاری است. اگر حذف شود، آنبوردینگ `CUSTOM_API_KEY` را بررسی می‌کند.
OpenClaw شناسه‌های رایج مدل‌های بینایی را به‌صورت خودکار دارای قابلیت تصویر علامت‌گذاری می‌کند. برای شناسه‌های بینایی سفارشی ناشناخته `--custom-image-input` را بفرستید، یا برای اجبار فراداده فقط متنی از `--custom-text-input` استفاده کنید.
برای endpointهای سازگار با OpenAI که از `/v1/responses` پشتیبانی می‌کنند اما از `/v1/chat/completions` پشتیبانی نمی‌کنند، از `--custom-compatibility openai-responses` استفاده کنید.

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

`--custom-base-url` به‌صورت پیش‌فرض `http://127.0.0.1:11434` است. `--custom-model-id` اختیاری است؛ اگر حذف شود، آنبوردینگ از پیش‌فرض‌های پیشنهادی Ollama استفاده می‌کند. شناسه‌های مدل ابری مانند `kimi-k2.5:cloud` نیز اینجا کار می‌کنند.

کلیدهای ارائه‌دهنده را به‌جای متن ساده به‌صورت ref ذخیره کنید:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

با `--secret-input-mode ref`، آنبوردینگ به‌جای مقادیر کلید متن ساده، refهای متکی به env می‌نویسد.
برای ارائه‌دهنده‌های متکی به پروفایل احراز هویت، این کار ورودی‌های `keyRef` را می‌نویسد؛ برای ارائه‌دهنده‌های سفارشی، `models.providers.<id>.apiKey` را به‌عنوان یک ref از env می‌نویسد (برای مثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

قرارداد حالت غیرتعاملی `ref`:

- متغیر env ارائه‌دهنده را در محیط فرایند آنبوردینگ تنظیم کنید (برای مثال `OPENAI_API_KEY`).
- پرچم‌های کلید inline را نفرستید (برای مثال `--openai-api-key`) مگر اینکه آن متغیر env نیز تنظیم شده باشد.
- اگر یک پرچم کلید inline بدون متغیر env لازم ارسال شود، آنبوردینگ با راهنمایی سریعاً شکست می‌خورد.

گزینه‌های token Gateway در حالت غیرتعاملی:

- `--gateway-auth token --gateway-token <token>` یک token متن ساده ذخیره می‌کند.
- `--gateway-auth token --gateway-token-ref-env <name>` مقدار `gateway.auth.token` را به‌عنوان یک SecretRef از env ذخیره می‌کند.
- `--gateway-token` و `--gateway-token-ref-env` ناسازگار و هم‌زمان‌ناپذیرند.
- `--gateway-token-ref-env` به یک متغیر env غیرخالی در محیط فرایند آنبوردینگ نیاز دارد.
- با `--install-daemon`، وقتی احراز هویت token به token نیاز داشته باشد، tokenهای Gateway مدیریت‌شده با SecretRef اعتبارسنجی می‌شوند اما به‌صورت متن ساده resolve‌شده در فراداده محیط سرویس supervisor پایدار نمی‌شوند.
- با `--install-daemon`، اگر حالت token به token نیاز داشته باشد و SecretRef پیکربندی‌شده token resolve نشده باشد، آنبوردینگ به‌صورت بسته شکست می‌خورد و راهنمای اصلاح ارائه می‌دهد.
- با `--install-daemon`، اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، آنبوردینگ نصب را تا زمان تنظیم صریح mode مسدود می‌کند.
- آنبوردینگ محلی `gateway.mode="local"` را در پیکربندی می‌نویسد. اگر فایل پیکربندی بعدی `gateway.mode` را نداشته باشد، آن را آسیب پیکربندی یا ویرایش دستی ناقص بدانید، نه یک میان‌بر معتبر برای حالت محلی.
- آنبوردینگ محلی وقتی مسیر راه‌اندازی انتخاب‌شده نیاز داشته باشد، Pluginهای قابل دانلود انتخاب‌شده را نصب می‌کند.
- آنبوردینگ راه دور فقط اطلاعات اتصال برای Gateway راه دور را می‌نویسد و بسته‌های Plugin محلی را نصب نمی‌کند.
- `--allow-unconfigured` یک راه گریز جداگانه برای زمان اجرای Gateway است. این به این معنی نیست که آنبوردینگ می‌تواند `gateway.mode` را حذف کند.

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

- مگر اینکه `--skip-health` را بفرستید، آنبوردینگ پیش از خروج موفق منتظر یک Gateway محلی قابل دسترس می‌ماند.
- `--install-daemon` ابتدا مسیر نصب Gateway مدیریت‌شده را شروع می‌کند. بدون آن، باید از قبل یک Gateway محلی در حال اجرا داشته باشید، برای مثال `openclaw gateway run`.
- اگر در automation فقط نوشتن پیکربندی/فضای کاری/bootstrap را می‌خواهید، از `--skip-health` استفاده کنید.
- اگر فایل‌های فضای کاری را خودتان مدیریت می‌کنید، `--skip-bootstrap` را بفرستید تا `agents.defaults.skipBootstrap: true` تنظیم شود و ایجاد `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md` و `BOOTSTRAP.md` رد شود.
- در Windows بومی، `--install-daemon` ابتدا Scheduled Tasks را امتحان می‌کند و اگر ایجاد task رد شود، به یک آیتم login در پوشه Startup مخصوص هر کاربر برمی‌گردد.

رفتار آنبوردینگ تعاملی با حالت reference:

- هنگام درخواست، **Use secret reference** را انتخاب کنید.
- سپس یکی از این دو را انتخاب کنید:
  - متغیر محیطی
  - ارائه‌دهنده secret پیکربندی‌شده (`file` یا `exec`)
- آنبوردینگ پیش از ذخیره ref یک اعتبارسنجی preflight سریع انجام می‌دهد.
  - اگر اعتبارسنجی شکست بخورد، آنبوردینگ خطا را نشان می‌دهد و اجازه تلاش دوباره می‌دهد.

### انتخاب‌های endpoint غیرتعاملی Z.AI

<Note>
`--auth-choice zai-api-key` بهترین endpoint و مدل Z.AI را برای
کلید شما به‌صورت خودکار تشخیص می‌دهد. endpointهای Coding Plan، `zai/glm-5.2` را ترجیح می‌دهند؛ endpointهای API عمومی از
`zai/glm-5.1` استفاده می‌کنند. برای اجبار یک endpoint از نوع Coding Plan، `zai-coding-global` یا
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

## یادداشت‌های جریان

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: اعلان‌های حداقلی، یک token Gateway را خودکار تولید می‌کند.
    - `manual`: اعلان‌های کامل برای port، bind و auth (نام مستعار `advanced`).
    - `import`: یک ارائه‌دهنده مهاجرت تشخیص‌داده‌شده را اجرا می‌کند، برنامه را پیش‌نمایش می‌دهد، سپس پس از تأیید اعمال می‌کند.

  </Accordion>
  <Accordion title="Provider prefiltering">
    وقتی یک انتخاب auth به یک ارائه‌دهنده ترجیحی اشاره کند، آنبوردینگ انتخاب‌گرهای default-model و allowlist را از پیش به همان ارائه‌دهنده فیلتر می‌کند. برای Volcengine و BytePlus، این همچنین واریانت‌های coding-plan را match می‌کند (`volcengine-plan/*`، `byteplus-plan/*`).

    اگر فیلتر ارائه‌دهنده ترجیحی هنوز هیچ مدل بارگذاری‌شده‌ای ندهد، آنبوردینگ به‌جای خالی گذاشتن انتخاب‌گر، به کاتالوگ فیلترنشده برمی‌گردد.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    برخی ارائه‌دهنده‌های جست‌وجوی وب، اعلان‌های follow-up ویژه ارائه‌دهنده را trigger می‌کنند:

    - **Grok** می‌تواند راه‌اندازی اختیاری `x_search` را با همان پروفایل xAI OAuth یا کلید API و انتخاب مدل `x_search` ارائه دهد.
    - **Kimi** می‌تواند منطقه API مربوط به Moonshot (`api.moonshot.ai` در برابر `api.moonshot.cn`) و مدل پیش‌فرض جست‌وجوی وب Kimi را بپرسد.

  </Accordion>
  <Accordion title="Other behaviors">
    - رفتار scope مربوط به DM در آنبوردینگ محلی: [مرجع راه‌اندازی CLI](/fa/start/wizard-cli-reference#outputs-and-internals).
    - سریع‌ترین چت اول: `openclaw dashboard` (Control UI، بدون راه‌اندازی کانال).
    - ارائه‌دهنده سفارشی: هر endpoint سازگار با OpenAI یا Anthropic را، از جمله ارائه‌دهنده‌های hosted که فهرست نشده‌اند، متصل کنید. برای تشخیص خودکار از Unknown استفاده کنید.
    - اگر state مربوط به Hermes تشخیص داده شود، آنبوردینگ یک جریان مهاجرت پیشنهاد می‌دهد. برای برنامه‌های dry-run، حالت overwrite، گزارش‌ها و نگاشت‌های دقیق از [Migrate](/fa/cli/migrate) استفاده کنید.

  </Accordion>
</AccordionGroup>

## دستورهای follow-up رایج

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

وقتی فقط به پیکربندی/فضای کاری پایه نیاز دارید، به‌جای آن از `openclaw setup` استفاده کنید. برای تغییرهای هدفمند بعدی از `openclaw configure` و برای راه‌اندازی فقط کانال از `openclaw channels add` استفاده کنید.

<Note>
`--json` به معنی حالت غیرتعاملی نیست. برای اسکریپت‌ها از `--non-interactive` استفاده کنید.
</Note>
