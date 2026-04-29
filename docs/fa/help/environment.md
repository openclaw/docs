---
read_when:
    - باید بدانید کدام متغیرهای محیطی بارگذاری می‌شوند و به چه ترتیبی
    - در حال اشکال‌زدایی نبود کلیدهای API در Gateway هستید
    - شما در حال مستندسازی احراز هویت ارائه‌دهنده یا محیط‌های استقرار هستید
summary: محل بارگذاری متغیرهای محیطی توسط OpenClaw و ترتیب تقدم
title: متغیرهای محیطی
x-i18n:
    generated_at: "2026-04-29T22:58:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw متغیرهای محیطی را از چندین منبع می‌خواند. قاعده این است: **هرگز مقدارهای موجود را بازنویسی نکن**.

## اولویت (بالاترین → پایین‌ترین)

1. **محیط پردازه** (آنچه پردازه Gateway از قبل از shell/daemon والد دارد).
2. **`.env` در دایرکتوری کاری فعلی** (پیش‌فرض dotenv؛ بازنویسی نمی‌کند).
3. **`.env` سراسری** در `~/.openclaw/.env` (همان `$OPENCLAW_STATE_DIR/.env`؛ بازنویسی نمی‌کند).
4. **بلوک `env` در پیکربندی** در `~/.openclaw/openclaw.json` (فقط اگر مقدار وجود نداشته باشد اعمال می‌شود).
5. **درون‌ریزی اختیاری login-shell** (`env.shellEnv.enabled` یا `OPENCLAW_LOAD_SHELL_ENV=1`)، فقط برای کلیدهای مورد انتظارِ موجودنبودنی اعمال می‌شود.

در نصب‌های تازه Ubuntu که از دایرکتوری وضعیت پیش‌فرض استفاده می‌کنند، OpenClaw همچنین `~/.config/openclaw/gateway.env` را پس از `.env` سراسری به‌عنوان fallback سازگاری در نظر می‌گیرد. اگر هر دو فایل وجود داشته باشند و با هم ناسازگار باشند، OpenClaw مقدارهای `~/.openclaw/.env` را نگه می‌دارد و یک هشدار چاپ می‌کند.

اگر فایل پیکربندی کاملاً وجود نداشته باشد، مرحله ۴ رد می‌شود؛ درون‌ریزی shell همچنان در صورت فعال بودن اجرا می‌شود.

## بلوک `env` در پیکربندی

دو روش معادل برای تنظیم متغیرهای محیطی inline (هر دو بدون بازنویسی هستند):

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

## درون‌ریزی env از shell

`env.shellEnv`، login shell شما را اجرا می‌کند و فقط کلیدهای مورد انتظارِ **موجودنبودنی** را درون‌ریزی می‌کند:

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

OpenClaw همچنین نشانگرهای زمینه را به پردازه‌های فرزندِ ایجادشده تزریق می‌کند:

- `OPENCLAW_SHELL=exec`: برای دستورهایی که از طریق ابزار `exec` اجرا می‌شوند تنظیم می‌شود.
- `OPENCLAW_SHELL=acp`: برای ایجاد پردازه‌های backend زمان اجرای ACP تنظیم می‌شود (برای مثال `acpx`).
- `OPENCLAW_SHELL=acp-client`: برای `openclaw acp client` هنگام ایجاد پردازه پل ACP تنظیم می‌شود.
- `OPENCLAW_SHELL=tui-local`: برای دستورهای shell محلی TUI با `!` تنظیم می‌شود.

این‌ها نشانگرهای زمان اجرا هستند (نه پیکربندی الزامی کاربر). می‌توان از آن‌ها در منطق shell/profile
برای اعمال قواعد وابسته به زمینه استفاده کرد.

## متغیرهای محیطی UI

- `OPENCLAW_THEME=light`: وقتی ترمینال شما پس‌زمینه روشن دارد، palette روشن TUI را اجبار می‌کند.
- `OPENCLAW_THEME=dark`: palette تیره TUI را اجبار می‌کند.
- `COLORFGBG`: اگر ترمینال شما آن را export کند، OpenClaw از hint رنگ پس‌زمینه برای انتخاب خودکار palette TUI استفاده می‌کند.

## جایگزینی متغیر محیطی در پیکربندی

می‌توانید با استفاده از نحو `${VAR_NAME}` مستقیماً در مقدارهای رشته‌ای پیکربندی به متغیرهای محیطی ارجاع دهید:

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

## ارجاع‌های secret در برابر رشته‌های `${ENV}`

OpenClaw از دو الگوی مبتنی بر env پشتیبانی می‌کند:

- جایگزینی رشته‌ای `${VAR}` در مقدارهای پیکربندی.
- اشیای SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) برای فیلدهایی که از ارجاع‌های secrets پشتیبانی می‌کنند.

هر دو هنگام فعال‌سازی از env پردازه resolve می‌شوند. جزئیات SecretRef در [مدیریت secrets](/fa/gateway/secrets) مستند شده است.

## متغیرهای محیطی مرتبط با مسیر

| متغیر                 | هدف                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`       | دایرکتوری home مورد استفاده برای همه resolve کردن‌های مسیر داخلی را بازنویسی می‌کند (`~/.openclaw/`، دایرکتوری‌های agent، نشست‌ها، credentials). هنگام اجرای OpenClaw به‌عنوان کاربر سرویس اختصاصی مفید است. |
| `OPENCLAW_STATE_DIR`  | دایرکتوری وضعیت را بازنویسی می‌کند (پیش‌فرض `~/.openclaw`).                                                                                                                          |
| `OPENCLAW_CONFIG_PATH` | مسیر فایل پیکربندی را بازنویسی می‌کند (پیش‌فرض `~/.openclaw/openclaw.json`).                                                                                                         |

## ثبت لاگ

| متغیر                | هدف                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_LOG_LEVEL` | سطح لاگ را هم برای فایل و هم برای کنسول بازنویسی می‌کند (مثلاً `debug`، `trace`). بر `logging.level` و `logging.consoleLevel` در پیکربندی اولویت دارد. مقدارهای نامعتبر با هشدار نادیده گرفته می‌شوند. |

### `OPENCLAW_HOME`

وقتی تنظیم شود، `OPENCLAW_HOME` برای همه resolve کردن‌های مسیر داخلی جایگزین دایرکتوری home سیستم (`$HOME` / `os.homedir()`) می‌شود. این کار ایزوله‌سازی کامل filesystem را برای حساب‌های سرویس headless ممکن می‌کند.

**اولویت:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**مثال** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` همچنین می‌تواند روی یک مسیر دارای tilde تنظیم شود (مثلاً `~/svc`) که پیش از استفاده با `$HOME` گسترش داده می‌شود.

## کاربران nvm: خطاهای TLS در web_fetch

اگر Node.js از طریق **nvm** نصب شده باشد (نه package manager سیستم)، `fetch()` داخلی از
CA store همراه nvm استفاده می‌کند که ممکن است CAهای ریشه مدرن را نداشته باشد (ISRG Root X1/X2 برای Let's Encrypt،
DigiCert Global Root G2، و غیره). این باعث می‌شود `web_fetch` در بیشتر سایت‌های HTTPS با `"fetch failed"` شکست بخورد.

در Linux، OpenClaw به‌طور خودکار nvm را تشخیص می‌دهد و اصلاح را در محیط startup واقعی اعمال می‌کند:

- `openclaw gateway install` مقدار `NODE_EXTRA_CA_CERTS` را در محیط سرویس systemd می‌نویسد
- entrypoint مربوط به CLI با نام `openclaw` پیش از startup Node، خودش را با تنظیم‌شدن `NODE_EXTRA_CA_CERTS` دوباره exec می‌کند

**اصلاح دستی (برای نسخه‌های قدیمی‌تر یا اجرای مستقیم `node ...`):**

پیش از شروع OpenClaw، متغیر را export کنید:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

برای این متغیر فقط به نوشتن در `~/.openclaw/.env` تکیه نکنید؛ Node مقدار
`NODE_EXTRA_CA_CERTS` را هنگام startup پردازه می‌خواند.

## متغیرهای محیطی legacy

OpenClaw فقط متغیرهای محیطی `OPENCLAW_*` را می‌خواند. پیشوندهای legacy
`CLAWDBOT_*` و `MOLTBOT_*` از انتشارهای قبلی بی‌صدا
نادیده گرفته می‌شوند.

اگر هنگام startup هنوز هرکدام روی پردازه Gateway تنظیم شده باشند، OpenClaw یک
هشدار deprecation واحد از Node (`OPENCLAW_LEGACY_ENV_VARS`) صادر می‌کند که
پیشوندهای شناسایی‌شده و تعداد کل را فهرست می‌کند. هر مقدار را با جایگزین کردن
پیشوند legacy با `OPENCLAW_` تغییر نام دهید (برای مثال `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`)؛ نام‌های قدیمی هیچ اثری ندارند.

## مرتبط

- [پیکربندی Gateway](/fa/gateway/configuration)
- [پرسش‌های پرتکرار: متغیرهای محیطی و بارگذاری .env](/fa/help/faq#env-vars-and-env-loading)
- [نمای کلی مدل‌ها](/fa/concepts/models)
