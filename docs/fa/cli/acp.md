---
read_when:
    - راه‌اندازی یکپارچه‌سازی‌های IDE مبتنی بر ACP
    - اشکال‌زدایی مسیریابی جلسهٔ ACP به Gateway
summary: پل ACP را برای یکپارچه‌سازی‌های IDE اجرا کنید
title: ACP
x-i18n:
    generated_at: "2026-05-06T09:06:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

پل [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) را اجرا کنید که با یک OpenClaw Gateway صحبت می‌کند.

این دستور ACP را از طریق stdio برای IDEها صحبت می‌کند و اعلان‌ها را از طریق
WebSocket به Gateway ارسال می‌کند. این دستور نشست‌های ACP را به کلیدهای نشست Gateway نگاشت می‌کند.

`openclaw acp` یک پل ACP با پشتیبانی Gateway است، نه یک محیط اجرای ویرایشگر کاملا بومی ACP.
تمرکز آن بر مسیریابی نشست، تحویل اعلان، و به‌روزرسانی‌های پایه جریان‌دهی است.

اگر می‌خواهید یک سرویس‌گیرنده MCP خارجی به‌جای میزبانی یک نشست چارچوب ACP، مستقیما با
گفت‌وگوهای کانال OpenClaw صحبت کند، به‌جای آن از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.

## این چه چیزی نیست

این صفحه اغلب با نشست‌های چارچوب ACP اشتباه گرفته می‌شود.

`openclaw acp` یعنی:

- OpenClaw به‌عنوان یک سرور ACP عمل می‌کند
- یک IDE یا سرویس‌گیرنده ACP به OpenClaw متصل می‌شود
- OpenClaw آن کار را به یک نشست Gateway ارسال می‌کند

این با [عامل‌های ACP](/fa/tools/acp-agents) متفاوت است، جایی که OpenClaw یک
چارچوب خارجی مانند Codex یا Claude Code را از طریق `acpx` اجرا می‌کند.

قاعده سریع:

- ویرایشگر/سرویس‌گیرنده می‌خواهد با ACP با OpenClaw صحبت کند: از `openclaw acp` استفاده کنید
- OpenClaw باید Codex/Claude/Gemini را به‌عنوان یک چارچوب ACP اجرا کند: از `/acp spawn` و [عامل‌های ACP](/fa/tools/acp-agents) استفاده کنید

## ماتریس سازگاری

| حوزه ACP                                                              | وضعیت      | نکته‌ها                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | پیاده‌سازی‌شده | جریان اصلی پل از طریق stdio به چت/ارسال Gateway + لغو.                                                                                                                                                                                        |
| `listSessions`, فرمان‌های اسلش                                        | پیاده‌سازی‌شده | فهرست نشست‌ها در برابر وضعیت نشست Gateway کار می‌کند؛ فرمان‌ها از طریق `available_commands_update` اعلام می‌شوند.                                                                                                                                       |
| `loadSession`                                                         | جزئی     | نشست ACP را دوباره به یک کلید نشست Gateway متصل می‌کند و تاریخچه ذخیره‌شده متن کاربر/دستیار را بازپخش می‌کند. تاریخچه ابزار/سیستم هنوز بازسازی نمی‌شود.                                                                                                   |
| محتوای اعلان (`text`، `resource` جاسازی‌شده، تصاویر)                  | جزئی     | متن/منابع به ورودی چت تخت می‌شوند؛ تصاویر به پیوست‌های Gateway تبدیل می‌شوند.                                                                                                                                                                 |
| حالت‌های نشست                                                         | جزئی     | `session/set_mode` پشتیبانی می‌شود و پل کنترل‌های اولیه نشست با پشتیبانی Gateway را برای سطح تفکر، پرحرفی ابزار، استدلال، جزئیات مصرف، و کنش‌های ارتقایافته ارائه می‌کند. سطوح گسترده‌تر حالت/پیکربندی بومی ACP هنوز خارج از محدوده هستند. |
| اطلاعات نشست و به‌روزرسانی‌های مصرف                                        | جزئی     | پل اعلان‌های `session_info_update` و `usage_update` با تلاش حداکثری را از نماهای فوری ذخیره‌شده نشست Gateway منتشر می‌کند. مصرف تقریبی است و فقط زمانی ارسال می‌شود که جمع‌های توکن Gateway تازه علامت‌گذاری شده باشند.                                        |
| جریان‌دهی ابزار                                                        | جزئی     | رویدادهای `tool_call` / `tool_call_update` شامل ورودی/خروجی خام، محتوای متن، و مکان‌های فایل با تلاش حداکثری هستند وقتی آرگومان‌ها/نتایج ابزار Gateway آن‌ها را آشکار کنند. ترمینال‌های جاسازی‌شده و خروجی غنی‌تر بومی diff هنوز ارائه نمی‌شوند.                        |
| سرورهای MCP به‌ازای هر نشست (`mcpServers`)                                | پشتیبانی‌نشده | حالت پل درخواست‌های سرور MCP به‌ازای هر نشست را رد می‌کند. MCP را به‌جای آن روی Gateway یا عامل OpenClaw پیکربندی کنید.                                                                                                                                     |
| روش‌های فایل‌سیستم سرویس‌گیرنده (`fs/read_text_file`, `fs/write_text_file`) | پشتیبانی‌نشده | پل روش‌های فایل‌سیستم سرویس‌گیرنده ACP را فراخوانی نمی‌کند.                                                                                                                                                                                          |
| روش‌های ترمینال سرویس‌گیرنده (`terminal/*`)                                | پشتیبانی‌نشده | پل ترمینال‌های سرویس‌گیرنده ACP را ایجاد نمی‌کند یا شناسه‌های ترمینال را از طریق فراخوانی‌های ابزار جریان‌دهی نمی‌کند.                                                                                                                                                       |
| طرح‌های نشست / جریان‌دهی تفکر                                     | پشتیبانی‌نشده | پل در حال حاضر متن خروجی و وضعیت ابزار را منتشر می‌کند، نه به‌روزرسانی‌های طرح یا تفکر ACP.                                                                                                                                                         |

## محدودیت‌های شناخته‌شده

- `loadSession` تاریخچه ذخیره‌شده متن کاربر و دستیار را بازپخش می‌کند، اما
  فراخوانی‌های تاریخی ابزار، اعلان‌های سیستم، یا انواع رویداد غنی‌تر بومی ACP را
  بازسازی نمی‌کند.
- اگر چند سرویس‌گیرنده ACP یک کلید نشست Gateway یکسان را به اشتراک بگذارند، مسیریابی رویداد و لغو
  با تلاش حداکثری انجام می‌شود، نه به‌صورت کاملا ایزوله برای هر سرویس‌گیرنده. وقتی به نوبت‌های
  تمیز محلی ویرایشگر نیاز دارید، نشست‌های ایزوله پیش‌فرض `acp:<uuid>` را ترجیح دهید.
- وضعیت‌های توقف Gateway به دلایل توقف ACP ترجمه می‌شوند، اما این نگاشت
  از یک محیط اجرای کاملا بومی ACP کم‌بیان‌تر است.
- کنترل‌های اولیه نشست در حال حاضر زیرمجموعه‌ای متمرکز از تنظیمات Gateway را نشان می‌دهند:
  سطح تفکر، پرحرفی ابزار، استدلال، جزئیات مصرف، و کنش‌های ارتقایافته.
  انتخاب مدل و کنترل‌های میزبان اجرا هنوز به‌عنوان گزینه‌های پیکربندی ACP ارائه نشده‌اند.
- `session_info_update` و `usage_update` از نماهای فوری نشست Gateway مشتق می‌شوند،
  نه از حسابداری زنده محیط اجرای بومی ACP. مصرف تقریبی است،
  داده هزینه ندارد، و فقط زمانی منتشر می‌شود که Gateway داده کل توکن را تازه علامت‌گذاری کند.
- داده‌های همراهی ابزار با تلاش حداکثری است. پل می‌تواند مسیرهای فایلی را که
  در آرگومان‌ها/نتایج شناخته‌شده ابزار ظاهر می‌شوند نشان دهد، اما هنوز ترمینال‌های ACP یا
  diffهای ساختاریافته فایل را منتشر نمی‌کند.

## استفاده

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## سرویس‌گیرنده ACP (اشکال‌زدایی)

از سرویس‌گیرنده داخلی ACP برای بررسی سلامت پل بدون IDE استفاده کنید.
این سرویس‌گیرنده پل ACP را ایجاد می‌کند و به شما اجازه می‌دهد اعلان‌ها را به‌صورت تعاملی تایپ کنید.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

مدل مجوز (حالت اشکال‌زدایی سرویس‌گیرنده):

- تایید خودکار مبتنی بر فهرست مجاز است و فقط برای شناسه‌های ابزار هسته قابل اعتماد اعمال می‌شود.
- تایید خودکار `read` به دایرکتوری کاری فعلی محدود است (وقتی `--cwd` تنظیم شده باشد).
- ACP فقط کلاس‌های باریک فقط‌خواندنی را به‌صورت خودکار تایید می‌کند: فراخوانی‌های محدوده‌دار `read` زیر cwd فعال به‌علاوه ابزارهای جست‌وجوی فقط‌خواندنی (`search`, `web_search`, `memory_search`). ابزارهای ناشناخته/غیرهسته، خواندن‌های خارج از محدوده، ابزارهای دارای قابلیت اجرا، ابزارهای صفحه کنترل، ابزارهای تغییردهنده، و جریان‌های تعاملی همیشه به تایید صریح اعلان نیاز دارند.
- `toolCall.kind` ارائه‌شده توسط سرور به‌عنوان فراداده نامطمئن در نظر گرفته می‌شود (نه یک منبع مجوز).
- این سیاست پل ACP از مجوزهای چارچوب ACPX جدا است. اگر OpenClaw را از طریق بک‌اند `acpx` اجرا می‌کنید، `plugins.entries.acpx.config.permissionMode=approve-all` کلید اضطراری "yolo" برای آن نشست چارچوب است.

## روش استفاده از این

وقتی یک IDE (یا سرویس‌گیرنده دیگر) Agent Client Protocol را صحبت می‌کند و می‌خواهید
یک نشست OpenClaw Gateway را هدایت کند، از ACP استفاده کنید.

1. مطمئن شوید Gateway در حال اجراست (محلی یا راه‌دور).
2. هدف Gateway را پیکربندی کنید (پیکربندی یا پرچم‌ها).
3. IDE خود را تنظیم کنید تا `openclaw acp` را از طریق stdio اجرا کند.

نمونه پیکربندی (ماندگار):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

نمونه اجرای مستقیم (بدون نوشتن پیکربندی):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## انتخاب عامل‌ها

ACP عامل‌ها را مستقیم انتخاب نمی‌کند. این کار را بر اساس کلید نشست Gateway مسیریابی می‌کند.

از کلیدهای نشست محدوده‌دار به عامل برای هدف گرفتن یک عامل مشخص استفاده کنید:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

هر نشست ACP به یک کلید نشست Gateway واحد نگاشت می‌شود. یک عامل می‌تواند نشست‌های زیادی داشته باشد؛
ACP به‌طور پیش‌فرض از یک نشست ایزوله `acp:<uuid>` استفاده می‌کند مگر اینکه کلید یا برچسب را بازنویسی کنید.

`mcpServers` به‌ازای هر نشست در حالت پل پشتیبانی نمی‌شود. اگر یک سرویس‌گیرنده ACP
آن‌ها را هنگام `newSession` یا `loadSession` ارسال کند، پل به‌جای نادیده گرفتن بی‌صدا،
یک خطای شفاف برمی‌گرداند.

اگر می‌خواهید نشست‌های با پشتیبانی ACPX ابزارهای Plugin در OpenClaw یا ابزارهای داخلی منتخب
مانند `cron` را ببینند، به‌جای تلاش برای پاس دادن `mcpServers` به‌ازای هر نشست،
پل‌های MCP سمت Gateway برای ACPX را فعال کنید. [عامل‌های ACP](/fa/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[پل MCP ابزارهای OpenClaw](/fa/tools/acp-agents-setup#openclaw-tools-mcp-bridge) را ببینید.

## استفاده از `acpx` (Codex، Claude، سرویس‌گیرنده‌های ACP دیگر)

اگر می‌خواهید یک عامل کدنویسی مانند Codex یا Claude Code از طریق ACP با ربات
OpenClaw شما صحبت کند، از `acpx` با هدف داخلی `openclaw` آن استفاده کنید.

جریان معمول:

1. Gateway را اجرا کنید و مطمئن شوید پل ACP می‌تواند به آن دسترسی پیدا کند.
2. `acpx openclaw` را به `openclaw acp` اشاره دهید.
3. کلید نشست OpenClaw را هدف بگیرید که می‌خواهید عامل کدنویسی از آن استفاده کند.

نمونه‌ها:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

اگر می‌خواهید `acpx openclaw` هر بار یک Gateway و کلید نشست مشخص را هدف بگیرد،
فرمان عامل `openclaw` را در `~/.acpx/config.json` بازنویسی کنید:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

برای یک checkout محلی مخزن OpenClaw، به‌جای اجراکننده توسعه از نقطه ورود مستقیم CLI استفاده کنید
تا جریان ACP تمیز بماند. برای مثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

این ساده‌ترین راه است تا Codex، Claude Code، یا یک سرویس‌گیرنده دیگر آگاه از ACP
اطلاعات زمینه‌ای را از یک عامل OpenClaw بدون استخراج از ترمینال دریافت کند.

## راه‌اندازی ویرایشگر Zed

یک عامل ACP سفارشی در `~/.config/zed/settings.json` اضافه کنید (یا از رابط کاربری تنظیمات Zed استفاده کنید):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

برای هدف‌گیری یک Gateway یا عامل مشخص:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

در Zed، پنل عامل را باز کنید و برای شروع یک رشته، «OpenClaw ACP» را انتخاب کنید.

## نگاشت جلسه

به‌طور پیش‌فرض، جلسه‌های ACP یک کلید جلسهٔ ایزولهٔ Gateway با پیشوند `acp:` دریافت می‌کنند.
برای استفادهٔ دوباره از یک جلسهٔ شناخته‌شده، یک کلید یا برچسب جلسه را پاس دهید:

- `--session <key>`: از یک کلید جلسهٔ مشخص Gateway استفاده می‌کند.
- `--session-label <label>`: یک جلسهٔ موجود را بر اساس برچسب پیدا می‌کند.
- `--reset-session`: برای آن کلید یک شناسهٔ جلسهٔ تازه می‌سازد (همان کلید، رونوشت جدید).

اگر کلاینت ACP شما از فراداده پشتیبانی می‌کند، می‌توانید برای هر جلسه بازنویسی کنید:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

دربارهٔ کلیدهای جلسه در [/concepts/session](/fa/concepts/session) بیشتر بیاموزید.

## گزینه‌ها

- `--url <url>`: URL WebSocket مربوط به Gateway (وقتی پیکربندی شده باشد، پیش‌فرض `gateway.remote.url` است).
- `--token <token>`: توکن احراز هویت Gateway.
- `--token-file <path>`: توکن احراز هویت Gateway را از فایل می‌خواند.
- `--password <password>`: گذرواژهٔ احراز هویت Gateway.
- `--password-file <path>`: گذرواژهٔ احراز هویت Gateway را از فایل می‌خواند.
- `--session <key>`: کلید جلسهٔ پیش‌فرض.
- `--session-label <label>`: برچسب جلسهٔ پیش‌فرض برای یافتن.
- `--require-existing`: اگر کلید/برچسب جلسه وجود نداشته باشد، شکست می‌خورد.
- `--reset-session`: کلید جلسه را پیش از نخستین استفاده بازنشانی می‌کند.
- `--no-prefix-cwd`: اعلان‌ها را با پوشهٔ کاری پیشوندگذاری نمی‌کند.
- `--provenance <off|meta|meta+receipt>`: فراداده یا رسیدهای منشأ ACP را شامل می‌کند.
- `--verbose, -v`: ثبت گزارش پرجزئیات در stderr.

نکتهٔ امنیتی:

- `--token` و `--password` ممکن است در فهرست فرایندهای محلی در برخی سیستم‌ها قابل مشاهده باشند.
- `--token-file`/`--password-file` یا متغیرهای محیطی (`OPENCLAW_GATEWAY_TOKEN`، `OPENCLAW_GATEWAY_PASSWORD`) را ترجیح دهید.
- حل‌وفصل احراز هویت Gateway از قرارداد مشترکی پیروی می‌کند که دیگر کلاینت‌های Gateway استفاده می‌کنند:
  - حالت محلی: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> بازگشت به `gateway.remote.*` فقط وقتی `gateway.auth.*` تنظیم نشده باشد (SecretRefs محلیِ پیکربندی‌شده اما حل‌نشده به‌صورت بسته شکست می‌خورند)
  - حالت راه‌دور: `gateway.remote.*` با بازگشت به env/config طبق قواعد تقدم راه‌دور
  - `--url` برای بازنویسی ایمن است و از اعتبارنامه‌های ضمنی config/env استفادهٔ دوباره نمی‌کند؛ `--token`/`--password` صریح را پاس دهید (یا گونه‌های فایلی آن‌ها)
- فرایندهای فرزند بک‌اند زمان اجرای ACP مقدار `OPENCLAW_SHELL=acp` را دریافت می‌کنند که می‌تواند برای قواعد shell/profile ویژهٔ زمینه استفاده شود.
- `openclaw acp client` مقدار `OPENCLAW_SHELL=acp-client` را روی فرایند پلِ اجراشده تنظیم می‌کند.

### گزینه‌های `acp client`

- `--cwd <dir>`: پوشهٔ کاری برای جلسهٔ ACP.
- `--server <command>`: فرمان سرور ACP (پیش‌فرض: `openclaw`).
- `--server-args <args...>`: آرگومان‌های اضافی پاس‌داده‌شده به سرور ACP.
- `--server-verbose`: ثبت گزارش پرجزئیات را روی سرور ACP فعال می‌کند.
- `--verbose, -v`: ثبت گزارش پرجزئیات کلاینت.

## مرتبط

- [مرجع CLI](/fa/cli)
- [عامل‌های ACP](/fa/tools/acp-agents)
