---
read_when:
    - باید بدانید کدام متغیرهای محیطی بارگذاری می‌شوند و به چه ترتیبی
    - در حال اشکال‌زدایی کلیدهای API گم‌شده در Gateway هستید
    - شما در حال مستندسازی احراز هویت ارائه‌دهنده یا محیط‌های استقرار هستید
summary: OpenClaw متغیرهای محیطی را از کجا بارگذاری می‌کند و ترتیب تقدم چگونه است
title: متغیرهای محیطی
x-i18n:
    generated_at: "2026-05-11T20:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b91e9bb3c386292f11a3ffe5ae718a74a800bd19fe95073da990d881e6069d
    source_path: help/environment.md
    workflow: 16
---

OpenClaw متغیرهای محیطی را از چندین منبع دریافت می‌کند. قاعده این است: **هرگز مقادیر موجود را بازنویسی نکنید**.

## تقدم (بیشترین → کمترین)

1. **محیط فرایند** (چیزی که فرایند Gateway از قبل از shell/daemon والد دارد).
2. **`.env` در دایرکتوری کاری فعلی** (پیش‌فرض dotenv؛ بازنویسی نمی‌کند).
3. **`.env` سراسری** در `~/.openclaw/.env` (معروف به `$OPENCLAW_STATE_DIR/.env`؛ بازنویسی نمی‌کند).
4. **بلوک `env` پیکربندی** در `~/.openclaw/openclaw.json` (فقط در صورت نبودن اعمال می‌شود).
5. **واردسازی اختیاری login-shell** (`env.shellEnv.enabled` یا `OPENCLAW_LOAD_SHELL_ENV=1`)، فقط برای کلیدهای مورد انتظارِ ناموجود اعمال می‌شود.

در نصب‌های تازه Ubuntu که از دایرکتوری وضعیت پیش‌فرض استفاده می‌کنند، OpenClaw همچنین `~/.config/openclaw/gateway.env` را پس از `.env` سراسری به‌عنوان جایگزین سازگاری در نظر می‌گیرد. اگر هر دو فایل وجود داشته باشند و با هم ناسازگار باشند، OpenClaw مقدار `~/.openclaw/.env` را نگه می‌دارد و یک هشدار چاپ می‌کند.

اگر فایل پیکربندی کاملاً وجود نداشته باشد، گام 4 نادیده گرفته می‌شود؛ واردسازی shell همچنان در صورت فعال بودن اجرا می‌شود.

## بلوک `env` پیکربندی

دو روش معادل برای تنظیم متغیرهای محیطی درون‌خطی (هر دو بدون بازنویسی هستند):

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

## واردسازی محیط shell

`env.shellEnv`، login shell شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ **ناموجود** را وارد می‌کند:

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

## متغیرهای محیطی تزریق‌شده در زمان اجرا

OpenClaw همچنین نشانگرهای زمینه را به فرایندهای فرزند ایجادشده تزریق می‌کند:

- `OPENCLAW_SHELL=exec`: برای فرمان‌هایی که از طریق ابزار `exec` اجرا می‌شوند تنظیم می‌شود.
- `OPENCLAW_SHELL=acp`: برای ایجاد فرایندهای backend زمان اجرای ACP تنظیم می‌شود (برای مثال `acpx`).
- `OPENCLAW_SHELL=acp-client`: برای `openclaw acp client` هنگامی که فرایند پل ACP را ایجاد می‌کند تنظیم می‌شود.
- `OPENCLAW_SHELL=tui-local`: برای فرمان‌های shell محلی TUI با `!` تنظیم می‌شود.

این‌ها نشانگرهای زمان اجرا هستند (نه پیکربندی موردنیاز کاربر). می‌توان از آن‌ها در منطق shell/profile
برای اعمال قواعد وابسته به زمینه استفاده کرد.

## متغیرهای محیطی UI

- `OPENCLAW_THEME=light`: هنگامی که ترمینال شما پس‌زمینه روشن دارد، palette روشن TUI را اجبار می‌کند.
- `OPENCLAW_THEME=dark`: palette تیره TUI را اجبار می‌کند.
- `COLORFGBG`: اگر ترمینال شما آن را export کند، OpenClaw از راهنمای رنگ پس‌زمینه برای انتخاب خودکار palette TUI استفاده می‌کند.

## جایگزینی متغیر محیطی در پیکربندی

می‌توانید با استفاده از نحو `${VAR_NAME}` مستقیماً در مقادیر رشته‌ای پیکربندی به متغیرهای محیطی ارجاع دهید:

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

برای جزئیات کامل، [پیکربندی: جایگزینی متغیر محیطی](/fa/gateway/configuration-reference#env-var-substitution) را ببینید.

## ارجاع‌های محرمانه در برابر رشته‌های `${ENV}`

OpenClaw از دو الگوی مبتنی بر env پشتیبانی می‌کند:

- جایگزینی رشته‌ای `${VAR}` در مقادیر پیکربندی.
- اشیای SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) برای فیلدهایی که از ارجاع‌های محرمانه پشتیبانی می‌کنند.

هر دو در زمان فعال‌سازی از env فرایند resolve می‌شوند. جزئیات SecretRef در [مدیریت اسرار](/fa/gateway/secrets) مستند شده است.

## متغیرهای محیطی مرتبط با مسیر

| متغیر                    | هدف                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | بازنویسی دایرکتوری home استفاده‌شده برای تمام resolve کردن مسیرهای داخلی (`~/.openclaw/`، دایرکتوری‌های agent، نشست‌ها، credentials). هنگام اجرای OpenClaw به‌عنوان کاربر سرویس اختصاصی مفید است. |
| `OPENCLAW_STATE_DIR`     | بازنویسی دایرکتوری وضعیت (پیش‌فرض `~/.openclaw`).                                                                                                                                       |
| `OPENCLAW_CONFIG_PATH`   | بازنویسی مسیر فایل پیکربندی (پیش‌فرض `~/.openclaw/openclaw.json`).                                                                                                                     |
| `OPENCLAW_INCLUDE_ROOTS` | فهرست مسیر دایرکتوری‌هایی که دستورهای `$include` می‌توانند فایل‌های بیرون از دایرکتوری پیکربندی را از آن‌ها resolve کنند (پیش‌فرض: هیچ‌کدام — `$include` به دایرکتوری پیکربندی محدود است). با tilde گسترش می‌یابد. |

## ثبت رویداد

| متغیر                           | هدف                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | بازنویسی سطح log برای هر دو خروجی فایل و console (مثلاً `debug`، `trace`). نسبت به `logging.level` و `logging.consoleLevel` در پیکربندی تقدم دارد. مقادیر نامعتبر با هشدار نادیده گرفته می‌شوند. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | انتشار diagnostics هدفمند زمان‌بندی request/response مدل در سطح `info` بدون فعال کردن logهای debug سراسری.                                                                                         |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | diagnostics payload مدل: `summary`، `tools`، یا `full-redacted`. `full-redacted` محدود و redacted است اما ممکن است متن prompt/message را شامل شود.                                                   |
| `OPENCLAW_DEBUG_SSE`             | diagnostics جریان‌دهی: `events` برای زمان‌بندی first/done، `peek` برای شامل کردن پنج رویداد redacted SSE نخست.                                                                                     |
| `OPENCLAW_DEBUG_CODE_MODE`       | diagnostics سطح مدل code-mode، شامل پنهان‌سازی provider-tool و اعمال محدودیت exec/wait-only.                                                                                                        |

### `OPENCLAW_HOME`

وقتی تنظیم شود، `OPENCLAW_HOME` دایرکتوری home سیستم (`$HOME` / `os.homedir()`) را برای تمام resolve کردن مسیرهای داخلی جایگزین می‌کند. این کار جداسازی کامل filesystem را برای حساب‌های سرویس headless ممکن می‌سازد.

**تقدم:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**نمونه** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` همچنین می‌تواند به‌صورت مسیر tilde تنظیم شود (مثلاً `~/svc`) که پیش از استفاده با `$HOME` گسترش می‌یابد.

## کاربران nvm: خطاهای TLS در web_fetch

اگر Node.js از طریق **nvm** نصب شده باشد (نه مدیر بسته سیستم)، `fetch()` داخلی از
مخزن CA همراه nvm استفاده می‌کند که ممکن است CAهای ریشه مدرن را نداشته باشد (ISRG Root X1/X2 برای Let's Encrypt،
DigiCert Global Root G2 و غیره). این باعث می‌شود `web_fetch` در بیشتر سایت‌های HTTPS با `"fetch failed"` شکست بخورد.

در Linux، OpenClaw به‌طور خودکار nvm را تشخیص می‌دهد و اصلاح را در محیط startup واقعی اعمال می‌کند:

- `openclaw gateway install`، مقدار `NODE_EXTRA_CA_CERTS` را در محیط سرویس systemd می‌نویسد
- entrypoint مربوط به CLI با نام `openclaw`، پیش از startup Node خود را با تنظیم `NODE_EXTRA_CA_CERTS` دوباره اجرا می‌کند

**اصلاح دستی (برای نسخه‌های قدیمی‌تر یا اجراهای مستقیم `node ...`):**

پیش از شروع OpenClaw، متغیر را export کنید:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

برای این متغیر فقط به نوشتن در `~/.openclaw/.env` تکیه نکنید؛ Node مقدار
`NODE_EXTRA_CA_CERTS` را هنگام startup فرایند می‌خواند.

## متغیرهای محیطی قدیمی

OpenClaw فقط متغیرهای محیطی `OPENCLAW_*` را می‌خواند. پیشوندهای قدیمی
`CLAWDBOT_*` و `MOLTBOT_*` از نسخه‌های قبلی بی‌صدا
نادیده گرفته می‌شوند.

اگر هنگام startup هنوز هرکدام از آن‌ها روی فرایند Gateway تنظیم شده باشند، OpenClaw یک
هشدار deprecation واحد Node (`OPENCLAW_LEGACY_ENV_VARS`) منتشر می‌کند که
پیشوندهای شناسایی‌شده و تعداد کل را فهرست می‌کند. هر مقدار را با جایگزین کردن
پیشوند قدیمی با `OPENCLAW_` تغییر نام دهید (برای مثال `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`)؛ نام‌های قدیمی هیچ اثری ندارند.

## مرتبط

- [پیکربندی Gateway](/fa/gateway/configuration)
- [پرسش‌های متداول: متغیرهای محیطی و بارگذاری .env](/fa/help/faq#env-vars-and-env-loading)
- [نمای کلی مدل‌ها](/fa/concepts/models)
