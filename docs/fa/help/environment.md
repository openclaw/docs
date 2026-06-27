---
read_when:
    - باید بدانید کدام متغیرهای محیطی بارگذاری می‌شوند و به چه ترتیبی
    - شما در حال اشکال‌زدایی کلیدهای API گم‌شده در Gateway هستید.
    - شما در حال مستندسازی احراز هویت ارائه‌دهنده یا محیط‌های استقرار هستید
summary: محل بارگذاری متغیرهای محیطی توسط OpenClaw و ترتیب اولویت
title: متغیرهای محیطی
x-i18n:
    generated_at: "2026-06-27T17:52:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw متغیرهای محیطی را از چندین منبع می‌خواند. قاعده این است: **هرگز مقادیر موجود را بازنویسی نکن**.
فایل‌های `.env` فضای کاری منبعی با اعتماد کمتر هستند: OpenClaw پیش از اعمال ترتیب تقدم، اعتبارنامه‌های ارائه‌دهنده و کنترل‌های محافظت‌شده runtime را از `.env` فضای کاری نادیده می‌گیرد.

## ترتیب تقدم (بالاترین ← پایین‌ترین)

1. **محیط فرایند** (آنچه فرایند Gateway از قبل از شل/daemon والد دارد).
2. **`.env` در دایرکتوری کاری فعلی** (پیش‌فرض dotenv؛ بازنویسی نمی‌کند؛ اعتبارنامه‌های ارائه‌دهنده و کنترل‌های محافظت‌شده runtime نادیده گرفته می‌شوند).
3. **`.env` سراسری** در `~/.openclaw/.env` (یا `$OPENCLAW_STATE_DIR/.env`؛ برای کلیدهای API ارائه‌دهنده توصیه می‌شود؛ بازنویسی نمی‌کند).
4. **بلوک `env` پیکربندی** در `~/.openclaw/openclaw.json` (فقط اگر مقدار موجود نباشد اعمال می‌شود).
5. **واردسازی اختیاری login-shell** (`env.shellEnv.enabled` یا `OPENCLAW_LOAD_SHELL_ENV=1`) که فقط برای کلیدهای مورد انتظارِ ناموجود اعمال می‌شود.

در نصب‌های تازه Ubuntu که از دایرکتوری وضعیت پیش‌فرض استفاده می‌کنند، OpenClaw همچنین `~/.config/openclaw/gateway.env` را پس از `.env` سراسری به‌عنوان fallback سازگاری در نظر می‌گیرد. اگر هر دو فایل وجود داشته باشند و با هم ناسازگار باشند، OpenClaw مقدار `~/.openclaw/.env` را نگه می‌دارد و هشدار چاپ می‌کند.

اگر فایل پیکربندی کاملا وجود نداشته باشد، مرحله 4 رد می‌شود؛ واردسازی شل همچنان در صورت فعال بودن اجرا می‌شود.

## اعتبارنامه‌های ارائه‌دهنده و `.env` فضای کاری

کلیدهای API ارائه‌دهنده را فقط در `.env` فضای کاری نگه ندارید. OpenClaw متغیرهای محیطی اعتبارنامه ارائه‌دهنده را از فایل‌های `.env` فضای کاری نادیده می‌گیرد، از جمله کلیدهای رایجی مانند `GEMINI_API_KEY`، `GOOGLE_API_KEY`، `XAI_API_KEY`، `MISTRAL_API_KEY`، `GROQ_API_KEY`، `DEEPSEEK_API_KEY`، `PERPLEXITY_API_KEY`، `BRAVE_API_KEY`، `TAVILY_API_KEY`، `EXA_API_KEY` و `FIRECRAWL_API_KEY`.

برای اعتبارنامه‌های ارائه‌دهنده از یکی از این منابع مورد اعتماد استفاده کنید:

- محیط فرایند Gateway، مانند شل، واحد launchd/systemd، secret کانتینر، یا secret در CI.
- فایل dotenv سراسری runtime در `~/.openclaw/.env` یا `$OPENCLAW_STATE_DIR/.env`.
- بلوک `env` پیکربندی در `~/.openclaw/openclaw.json`.
- واردسازی اختیاری login-shell وقتی `env.shellEnv.enabled` یا `OPENCLAW_LOAD_SHELL_ENV=1` فعال باشد.

اگر قبلا کلیدهای ارائه‌دهنده را فقط در `.env` فضای کاری ذخیره کرده‌اید، آن‌ها را به یکی از منابع مورد اعتماد بالا منتقل کنید. `.env` فضای کاری همچنان می‌تواند متغیرهای عادی پروژه را که اعتبارنامه، تغییرمسیر endpoint، بازنویسی host، یا کنترل‌های runtime با پیشوند `OPENCLAW_*` نیستند فراهم کند.

برای منطق امنیتی، [فایل‌های `.env` فضای کاری](/fa/gateway/security#workspace-env-files) را ببینید.

## بلوک `env` پیکربندی

دو روش معادل برای تنظیم inline env vars (هر دو غیر بازنویسنده هستند):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

بلوک `env` پیکربندی فقط مقدارهای رشته‌ای literal را می‌پذیرد. مقدارهای
`file:...` را گسترش نمی‌دهد؛ برای مثال، `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
دقیقا به‌صورت همان رشته به ارائه‌دهنده‌ها فرستاده می‌شود.

برای کلیدهای ارائه‌دهنده مبتنی بر فایل، روی فیلد اعتبارنامه‌ای که از آن
پشتیبانی می‌کند از SecretRef استفاده کنید:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

برای فیلدهای پشتیبانی‌شده، [مدیریت Secrets](/fa/gateway/secrets) و
[سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) را ببینید.

## واردسازی env شل

`env.shellEnv` شل ورود شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ **ناموجود** را وارد می‌کند:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

معادل‌های متغیر محیطی:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## snapshotهای شل exec

روی میزبان‌های Gateway غیر Windows، دستورهای bash و zsh `exec` به‌طور پیش‌فرض از snapshot زمان شروع استفاده می‌کنند.
برای غیرفعال کردن این مسیر، `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` را در محیط فرایند Gateway تنظیم کنید.
مقادیر `false`، `no` و `off` نیز آن را غیرفعال می‌کنند. مقدارهای `exec.env` در هر فراخوانی نمی‌توانند
snapshotها را تغییر دهند یا cache مربوط به snapshot را تغییرمسیر دهند.

## متغیرهای محیطی تزریق‌شده توسط runtime

OpenClaw همچنین نشانگرهای زمینه را به فرایندهای فرزند ایجادشده تزریق می‌کند:

- `OPENCLAW_SHELL=exec`: برای دستورهایی که از طریق ابزار `exec` اجرا می‌شوند تنظیم می‌شود.
- `OPENCLAW_SHELL=acp`: برای ایجاد فرایندهای backend runtime مربوط به ACP تنظیم می‌شود (برای مثال `acpx`).
- `OPENCLAW_SHELL=acp-client`: برای `openclaw acp client` وقتی فرایند bridge مربوط به ACP را ایجاد می‌کند تنظیم می‌شود.
- `OPENCLAW_SHELL=tui-local`: برای دستورهای شل `!` در TUI محلی تنظیم می‌شود.
- `OPENCLAW_CLI=1`: برای فرایندهای فرزندی که توسط نقطه ورود CLI ایجاد می‌شوند تنظیم می‌شود.

این‌ها نشانگرهای runtime هستند (پیکربندی کاربر لازم نیستند). می‌توان از آن‌ها در منطق shell/profile
برای اعمال قواعد ویژه هر زمینه استفاده کرد.

## متغیرهای محیطی UI

- `OPENCLAW_THEME=light`: وقتی terminal شما پس‌زمینه روشن دارد، palette روشن TUI را اجباری می‌کند.
- `OPENCLAW_THEME=dark`: palette تیره TUI را اجباری می‌کند.
- `COLORFGBG`: اگر terminal شما آن را export کند، OpenClaw از راهنمای رنگ پس‌زمینه برای انتخاب خودکار palette در TUI استفاده می‌کند.

## جای‌گذاری متغیر محیطی در پیکربندی

می‌توانید با استفاده از نحو `${VAR_NAME}` مستقیما در مقدارهای رشته‌ای پیکربندی به env vars ارجاع دهید:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

برای جزئیات کامل، [پیکربندی: جای‌گذاری متغیر محیطی](/fa/gateway/configuration-reference#env-var-substitution) را ببینید.

## secret refها در برابر رشته‌های `${ENV}`

OpenClaw از دو الگوی مبتنی بر env پشتیبانی می‌کند:

- جای‌گذاری رشته‌ای `${VAR}` در مقدارهای پیکربندی.
- آبجکت‌های SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) برای فیلدهایی که از ارجاع به secrets پشتیبانی می‌کنند.

هر دو در زمان فعال‌سازی از env فرایند resolve می‌شوند. جزئیات SecretRef در [مدیریت Secrets](/fa/gateway/secrets) مستند شده است.
خود بلوک `env` پیکربندی، SecretRefها یا مقدارهای کوتاه‌نویسی
`file:...` را resolve نمی‌کند.

## متغیرهای محیطی مرتبط با مسیر

| متغیر                    | هدف                                                                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | دایرکتوری home استفاده‌شده برای پیش‌فرض‌های مسیر داخلی OpenClaw را بازنویسی می‌کند (`~/.openclaw/`، دایرکتوری‌های agent، sessionها، اعتبارنامه‌ها، onboarding نصب‌کننده، و checkout پیش‌فرض dev). هنگام اجرای OpenClaw به‌عنوان کاربر سرویس اختصاصی مفید است. |
| `OPENCLAW_STATE_DIR`     | دایرکتوری وضعیت را بازنویسی می‌کند (پیش‌فرض `~/.openclaw`).                                                                                                                                                                         |
| `OPENCLAW_CONFIG_PATH`   | مسیر فایل پیکربندی را بازنویسی می‌کند (پیش‌فرض `~/.openclaw/openclaw.json`).                                                                                                                                                         |
| `OPENCLAW_INCLUDE_ROOTS` | فهرست مسیر دایرکتوری‌هایی که directiveهای `$include` ممکن است فایل‌هایی بیرون از دایرکتوری پیکربندی را در آن‌ها resolve کنند (پیش‌فرض: هیچ‌کدام — `$include` به دایرکتوری پیکربندی محدود است). Tilde-expanded.                      |

## ثبت رخداد

| متغیر                           | هدف                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_LOG_LEVEL`             | سطح log را هم برای فایل و هم کنسول بازنویسی می‌کند (مثلا `debug`، `trace`). نسبت به `logging.level` و `logging.consoleLevel` در پیکربندی تقدم دارد. مقدارهای نامعتبر با هشدار نادیده گرفته می‌شوند. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | diagnostics زمان‌بندی هدفمند request/response مدل را در سطح `info` بدون فعال کردن logهای debug سراسری منتشر می‌کند.                                                                      |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | diagnostics payload مدل: `summary`، `tools`، یا `full-redacted`. `full-redacted` محدود و redacted است، اما ممکن است متن prompt/message را شامل شود.                                      |
| `OPENCLAW_DEBUG_SSE`             | diagnostics جریان‌دهی: `events` برای زمان‌بندی first/done، `peek` برای شامل کردن پنج رویداد SSE نخست که redacted شده‌اند.                                                                |
| `OPENCLAW_DEBUG_CODE_MODE`       | diagnostics سطح مدل در code-mode، شامل پنهان‌سازی provider-tool و اجرای اجباری exec/wait-only.                                                                                           |

### `OPENCLAW_HOME`

وقتی تنظیم شود، `OPENCLAW_HOME` دایرکتوری home سیستم (`$HOME` / `os.homedir()`) را برای پیش‌فرض‌های مسیر داخلی OpenClaw جایگزین می‌کند. این شامل دایرکتوری وضعیت پیش‌فرض، مسیر پیکربندی، دایرکتوری‌های agent، اعتبارنامه‌ها، فضای کاری onboarding نصب‌کننده، و checkout پیش‌فرض dev است که توسط `openclaw update --channel dev` استفاده می‌شود.

**ترتیب تقدم:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback مربوط به home در Termux `PREFIX` روی Android > `os.homedir()`

**مثال** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` همچنین می‌تواند روی یک مسیر tilde تنظیم شود (مثلا `~/svc`) که پیش از استفاده با همان زنجیره fallback مربوط به home در OS گسترش می‌یابد.

متغیرهای مسیر صریح مانند `OPENCLAW_STATE_DIR`، `OPENCLAW_CONFIG_PATH` و `OPENCLAW_GIT_DIR` همچنان تقدم دارند. کارهای مربوط به حساب OS مانند تشخیص فایل startup شل، راه‌اندازی package-manager، و گسترش `~` در host ممکن است همچنان از home واقعی سیستم استفاده کنند.

## کاربران nvm: خطاهای TLS در web_fetch

اگر Node.js از طریق **nvm** نصب شده باشد (نه package manager سیستم)، `fetch()` داخلی از
CA store همراه nvm استفاده می‌کند که ممکن است CAهای ریشه مدرن را نداشته باشد (ISRG Root X1/X2 برای Let's Encrypt،
DigiCert Global Root G2، و غیره). این باعث می‌شود `web_fetch` در بیشتر سایت‌های HTTPS با `"fetch failed"` شکست بخورد.

روی Linux، OpenClaw به‌طور خودکار nvm را تشخیص می‌دهد و اصلاح را در محیط واقعی startup اعمال می‌کند:

- `openclaw gateway install` مقدار `NODE_EXTRA_CA_CERTS` را در محیط سرویس systemd می‌نویسد
- نقطه ورود CLI یعنی `openclaw` پیش از startup مربوط به Node خودش را با `NODE_EXTRA_CA_CERTS` تنظیم‌شده دوباره exec می‌کند

**اصلاح دستی (برای نسخه‌های قدیمی‌تر یا اجرای مستقیم `node ...`):**

پیش از شروع OpenClaw، متغیر را export کنید:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

برای این متغیر فقط به نوشتن در `~/.openclaw/.env` اتکا نکنید؛ Node مقدار
`NODE_EXTRA_CA_CERTS` را هنگام startup فرایند می‌خواند.

## متغیرهای محیطی legacy

OpenClaw فقط متغیرهای محیطی `OPENCLAW_*` را می‌خواند. پیشوندهای legacy
`CLAWDBOT_*` و `MOLTBOT_*` از انتشارهای قدیمی‌تر بی‌صدا
نادیده گرفته می‌شوند.

اگر هرکدام هنوز هنگام startup روی فرایند Gateway تنظیم باشند، OpenClaw یک
هشدار deprecation واحد از Node (`OPENCLAW_LEGACY_ENV_VARS`) منتشر می‌کند که
پیشوندهای شناسایی‌شده و تعداد کل را فهرست می‌کند. هر مقدار را با جایگزین کردن
پیشوند legacy با `OPENCLAW_` تغییرنام دهید (برای مثال `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`)؛ نام‌های قدیمی اثری ندارند.

## مرتبط

- [پیکربندی Gateway](/fa/gateway/configuration)
- [سوالات متداول: env vars و بارگذاری .env](/fa/help/faq#env-vars-and-env-loading)
- [مرور کلی مدل‌ها](/fa/concepts/models)
