---
read_when:
    - راه‌اندازی یکپارچه‌سازی‌های IDE مبتنی بر ACP
    - اشکال‌زدایی مسیریابی نشست ACP به Gateway
summary: پل ACP را برای یکپارچه‌سازی‌های IDE اجرا کنید
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:21:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

اجرای پل [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) که با یک OpenClaw Gateway صحبت می‌کند.

این دستور برای IDEها از طریق stdio با ACP صحبت می‌کند و اعلان‌ها را از طریق WebSocket
به Gateway فوروارد می‌کند. این دستور نشست‌های ACP را به کلیدهای نشست Gateway نگاشت‌شده نگه می‌دارد.

`openclaw acp` یک پل ACP مبتنی بر Gateway است، نه یک runtime کامل و بومی ACP برای ویرایشگر.
تمرکز آن بر مسیریابی نشست، تحویل اعلان، و به‌روزرسانی‌های پایهٔ streaming است.

اگر می‌خواهید یک سرویس‌گیرندهٔ خارجی MCP به‌جای میزبانی یک نشست ACP harness مستقیماً با گفتگوهای کانال
OpenClaw صحبت کند، به‌جای آن از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.

## این چه چیزی نیست

این صفحه اغلب با نشست‌های ACP harness اشتباه گرفته می‌شود.

`openclaw acp` یعنی:

- OpenClaw به‌عنوان یک سرور ACP عمل می‌کند
- یک IDE یا سرویس‌گیرندهٔ ACP به OpenClaw وصل می‌شود
- OpenClaw آن کار را به یک نشست Gateway فوروارد می‌کند

این با [ACP Agents](/fa/tools/acp-agents) متفاوت است؛ در آنجا OpenClaw یک harness خارجی
مانند Codex یا Claude Code را از طریق `acpx` اجرا می‌کند.

قاعدهٔ سریع:

- ویرایشگر/سرویس‌گیرنده می‌خواهد با ACP با OpenClaw صحبت کند: از `openclaw acp` استفاده کنید
- OpenClaw باید Codex/Claude/Gemini را به‌عنوان یک ACP harness راه‌اندازی کند: از `/acp spawn` و [ACP Agents](/fa/tools/acp-agents) استفاده کنید

## ماتریس سازگاری

| حوزهٔ ACP                                                              | وضعیت      | یادداشت‌ها                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | پیاده‌سازی‌شده | جریان اصلی پل از طریق stdio به Gateway chat/send + abort.                                                                                                                                                                                        |
| `listSessions`, دستورهای اسلش                                        | پیاده‌سازی‌شده | فهرست نشست‌ها بر پایهٔ وضعیت نشست Gateway با صفحه‌بندی cursor محدود و فیلتر `cwd` کار می‌کند، در جایی که ردیف‌های نشست Gateway فرادادهٔ workspace داشته باشند؛ دستورها از طریق `available_commands_update` اعلام می‌شوند.                                |
| فرادادهٔ تبار نشست                                              | پیاده‌سازی‌شده | فهرست‌های نشست و snapshotهای اطلاعات نشست، تبار والد و فرزند OpenClaw را در `_meta` شامل می‌شوند تا سرویس‌گیرنده‌های ACP بتوانند گراف‌های subagent را بدون کانال‌های جانبی خصوصی Gateway رندر کنند.                                                                |
| `resumeSession`, `closeSession`                                       | پیاده‌سازی‌شده | Resume یک نشست ACP را بدون پخش دوبارهٔ تاریخچه به یک نشست Gateway موجود دوباره متصل می‌کند. Close کار فعال پل را لغو می‌کند، اعلان‌های در انتظار را به‌صورت لغوشده resolve می‌کند، و وضعیت نشست پل را آزاد می‌کند.                                              |
| `loadSession`                                                         | جزئی     | نشست ACP را به یک کلید نشست Gateway دوباره متصل می‌کند و تاریخچهٔ event-ledger ACP را برای نشست‌هایی که پل ساخته است دوباره پخش می‌کند. نشست‌های قدیمی‌تر/بدون ledger به متن ذخیره‌شدهٔ کاربر/دستیار fallback می‌کنند.                                                             |
| محتوای اعلان (`text`، `resource` جاسازی‌شده، تصاویر)                  | جزئی     | متن/منابع به ورودی chat تخت می‌شوند؛ تصاویر به پیوست‌های Gateway تبدیل می‌شوند.                                                                                                                                                                 |
| حالت‌های نشست                                                         | جزئی     | `session/set_mode` پشتیبانی می‌شود و پل کنترل‌های اولیهٔ نشست مبتنی بر Gateway را برای سطح فکر، پرگویی ابزار، reasoning، جزئیات مصرف، و اقدام‌های ارتقایافته ارائه می‌دهد. سطح‌های گسترده‌تر حالت/پیکربندی بومی ACP همچنان خارج از دامنه هستند. |
| اطلاعات نشست و به‌روزرسانی‌های مصرف                                        | جزئی     | پل اعلان‌های `session_info_update` و `usage_update` را به‌صورت best-effort از snapshotهای cacheشدهٔ نشست Gateway منتشر می‌کند. مصرف تقریبی است و فقط وقتی فرستاده می‌شود که مجموع tokenهای Gateway به‌عنوان تازه علامت‌گذاری شده باشند.                                        |
| Streaming ابزار                                                        | جزئی     | رویدادهای `tool_call` / `tool_call_update` شامل I/O خام، محتوای متنی، و مکان‌های فایل به‌صورت best-effort هستند، وقتی آرگومان‌ها/نتایج ابزار Gateway آن‌ها را در دسترس بگذارند. ترمینال‌های جاسازی‌شده و خروجی غنی‌تر بومی diff هنوز ارائه نمی‌شوند.                        |
| تأییدهای exec                                                        | جزئی     | اعلان‌های تأیید exec در Gateway در طول نوبت‌های فعال اعلان ACP با `session/request_permission` به سرویس‌گیرندهٔ ACP relay می‌شوند.                                                                                                                    |
| سرورهای MCP به‌ازای هر نشست (`mcpServers`)                                | پشتیبانی‌نشده | حالت پل درخواست‌های سرور MCP به‌ازای هر نشست را رد می‌کند. MCP را به‌جای آن روی OpenClaw gateway یا agent پیکربندی کنید.                                                                                                                                     |
| روش‌های فایل‌سیستم سرویس‌گیرنده (`fs/read_text_file`, `fs/write_text_file`) | پشتیبانی‌نشده | پل روش‌های فایل‌سیستم سرویس‌گیرندهٔ ACP را فراخوانی نمی‌کند.                                                                                                                                                                                          |
| روش‌های ترمینال سرویس‌گیرنده (`terminal/*`)                                | پشتیبانی‌نشده | پل ترمینال‌های سرویس‌گیرندهٔ ACP را ایجاد نمی‌کند یا شناسه‌های ترمینال را از طریق فراخوانی‌های ابزار stream نمی‌کند.                                                                                                                                                       |
| برنامه‌های نشست / streaming فکر                                     | پشتیبانی‌نشده | پل در حال حاضر متن خروجی و وضعیت ابزار را منتشر می‌کند، نه به‌روزرسانی‌های برنامه یا فکر ACP.                                                                                                                                                         |

## محدودیت‌های شناخته‌شده

- `loadSession` فقط برای نشست‌هایی که پل ساخته است می‌تواند تاریخچهٔ کامل event-ledger ACP را دوباره پخش کند.
  نشست‌های قدیمی‌تر/بدون ledger همچنان از transcript
  fallback استفاده می‌کنند و فراخوانی‌های تاریخی ابزار یا اعلان‌های سیستم را بازسازی نمی‌کنند.
- اگر چند سرویس‌گیرندهٔ ACP کلید نشست Gateway یکسانی را به اشتراک بگذارند، مسیریابی رویداد و لغو
  به‌جای ایزوله‌سازی سخت‌گیرانه به‌ازای هر سرویس‌گیرنده، best-effort است. وقتی به نوبت‌های تمیز
  محلیِ ویرایشگر نیاز دارید، نشست‌های ایزولهٔ پیش‌فرض `acp-bridge:<uuid>` را ترجیح دهید.
- وضعیت‌های توقف Gateway به دلایل توقف ACP ترجمه می‌شوند، اما آن نگاشت
  از یک runtime کاملاً بومی ACP کم‌بیان‌تر است.
- کنترل‌های اولیهٔ نشست در حال حاضر زیرمجموعه‌ای متمرکز از تنظیمات Gateway را نشان می‌دهند:
  سطح فکر، پرگویی ابزار، reasoning، جزئیات مصرف، و اقدام‌های ارتقایافته. انتخاب مدل و کنترل‌های میزبان exec هنوز به‌عنوان گزینه‌های پیکربندی ACP ارائه نشده‌اند.
- `session_info_update` و `usage_update` از snapshotهای نشست Gateway مشتق می‌شوند،
  نه از حسابداری زندهٔ runtime بومی ACP. مصرف تقریبی است،
  دادهٔ هزینه ندارد، و فقط وقتی منتشر می‌شود که Gateway دادهٔ کل tokenها را تازه علامت‌گذاری کند.
- دادهٔ همراهی ابزار best-effort است. پل می‌تواند مسیرهای فایلی را نشان دهد که
  در آرگومان‌ها/نتایج شناخته‌شدهٔ ابزار ظاهر می‌شوند، اما هنوز ترمینال‌های ACP یا
  diffهای ساختاریافتهٔ فایل را منتشر نمی‌کند.
- relay تأیید exec به نوبت اعلان ACP فعال محدود است؛ تأییدهای
  دیگر نشست‌های Gateway نادیده گرفته می‌شوند.

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

## سرویس‌گیرندهٔ ACP (debug)

از سرویس‌گیرندهٔ داخلی ACP برای sanity-check پل بدون IDE استفاده کنید.
این ابزار پل ACP را spawn می‌کند و به شما اجازه می‌دهد اعلان‌ها را به‌صورت تعاملی تایپ کنید.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

مدل مجوز (حالت debug سرویس‌گیرنده):

- تأیید خودکار بر پایهٔ allowlist است و فقط برای شناسه‌های ابزار core مورد اعتماد اعمال می‌شود.
- تأیید خودکار `read` به دایرکتوری کاری فعلی محدود است (وقتی `--cwd` تنظیم شده باشد).
- ACP فقط کلاس‌های readonly محدود را به‌صورت خودکار تأیید می‌کند: فراخوانی‌های محدود `read` زیر cwd فعال به‌همراه ابزارهای جستجوی readonly (`search`, `web_search`, `memory_search`). ابزارهای ناشناخته/غیر core، خواندن‌های خارج از دامنه، ابزارهای دارای قابلیت exec، ابزارهای control-plane، ابزارهای تغییردهنده، و جریان‌های تعاملی همیشه به تأیید صریح اعلان نیاز دارند.
- `toolCall.kind` ارائه‌شده توسط سرور به‌عنوان فرادادهٔ غیرقابل اعتماد در نظر گرفته می‌شود (نه منبع authorization).
- این سیاست پل ACP از مجوزهای ACPX harness جداست. اگر OpenClaw را از طریق backend `acpx` اجرا می‌کنید، `plugins.entries.acpx.config.permissionMode=approve-all` کلید اضطراری "yolo" برای آن نشست harness است.

## Smoke testing پروتکل

برای debug در سطح پروتکل، یک Gateway با وضعیت ایزوله راه‌اندازی کنید و
`openclaw acp` را از طریق stdio با یک سرویس‌گیرندهٔ ACP JSON-RPC هدایت کنید. `initialize`،
`session/new`، `session/list` با یک `cwd` مطلق، `session/resume`،
`session/close`، close تکراری، و resume ناموجود را پوشش دهید.

اثبات باید شامل قابلیت‌های lifecycle اعلام‌شده، یک ردیف نشست مبتنی بر Gateway،
اعلان‌های به‌روزرسانی، و log مربوط به `sessions.list` در Gateway باشد:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

از استفاده از `openclaw gateway call sessions.list` به‌عنوان تنها اثبات ACP خودداری کنید. آن
مسیر CLI ممکن است ارتقای scope اپراتور fresh-token درخواست کند؛ درستی پل ACP
با frameهای stdio در ACP به‌همراه log مربوط به `sessions.list` در Gateway اثبات می‌شود.

## نحوهٔ استفاده از این

وقتی یک IDE (یا سرویس‌گیرندهٔ دیگر) با Agent Client Protocol صحبت می‌کند و می‌خواهید
یک نشست OpenClaw Gateway را هدایت کند، از ACP استفاده کنید.

1. مطمئن شوید Gateway در حال اجراست (محلی یا remote).
2. هدف Gateway را پیکربندی کنید (config یا flagها).
3. IDE خود را طوری تنظیم کنید که `openclaw acp` را از طریق stdio اجرا کند.

نمونهٔ config (پایدارشده):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

نمونهٔ اجرای مستقیم (بدون نوشتن config):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## انتخاب agentها

ACP به‌طور مستقیم agentها را انتخاب نمی‌کند. این کار بر اساس کلید نشست Gateway مسیریابی می‌کند.

برای هدف‌گیری یک agent مشخص، از کلیدهای نشست دارای دامنهٔ agent استفاده کنید:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

هر نشست ACP به یک کلید نشست Gateway نگاشت می‌شود. یک عامل می‌تواند نشست‌های
زیادی داشته باشد؛ ACP به‌صورت پیش‌فرض از یک نشست ایزوله‌ی `acp-bridge:<uuid>` استفاده می‌کند، مگر اینکه
کلید یا برچسب را بازنویسی کنید.

`mcpServers`های مختص هر نشست در حالت پل پشتیبانی نمی‌شوند. اگر یک کلاینت ACP
آن‌ها را هنگام `newSession` یا `loadSession` ارسال کند، پل به‌جای نادیده گرفتن بی‌صدای آن‌ها،
یک خطای روشن برمی‌گرداند.

اگر می‌خواهید نشست‌های مبتنی بر ACPX ابزارهای Plugin در OpenClaw یا ابزارهای
داخلی منتخب مانند `cron` را ببینند، به‌جای تلاش برای ارسال `mcpServers` مختص هر نشست،
پل‌های ACPX MCP سمت Gateway را فعال کنید. ببینید
[عامل‌های ACP](/fa/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[پل MCP ابزارهای OpenClaw](/fa/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## استفاده از `acpx` (Codex، Claude، دیگر کلاینت‌های ACP)

اگر می‌خواهید یک عامل کدنویسی مانند Codex یا Claude Code از طریق ACP با ربات
OpenClaw شما صحبت کند، از `acpx` با هدف داخلی `openclaw` آن استفاده کنید.

جریان معمول:

1. Gateway را اجرا کنید و مطمئن شوید پل ACP می‌تواند به آن دسترسی داشته باشد.
2. `acpx openclaw` را به `openclaw acp` متصل کنید.
3. کلید نشست OpenClaw را که می‌خواهید عامل کدنویسی از آن استفاده کند هدف بگیرید.

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

برای یک checkout محلی OpenClaw در مخزن، به‌جای اجراکننده‌ی توسعه از نقطه‌ی ورود مستقیم CLI
استفاده کنید تا جریان ACP تمیز بماند. برای مثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

این ساده‌ترین راه است تا Codex، Claude Code، یا یک کلاینت دیگرِ آگاه از ACP
بتواند بدون scrape کردن ترمینال، اطلاعات زمینه‌ای را از یک عامل OpenClaw بگیرد.

## راه‌اندازی ویرایشگر Zed

یک عامل ACP سفارشی در `~/.config/zed/settings.json` اضافه کنید (یا از رابط تنظیمات Zed استفاده کنید):

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

برای هدف گرفتن یک Gateway یا عامل مشخص:

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

در Zed، پنل عامل را باز کنید و برای شروع یک رشته، "OpenClaw ACP" را انتخاب کنید.

## نگاشت نشست

به‌صورت پیش‌فرض، نشست‌های پل ACP یک کلید نشست Gateway ایزوله با پیشوند
`acp-bridge:` دریافت می‌کنند. این نشست‌های پلِ مدل عادی ساختگی هستند و
مشمول هرس ورودی‌های کهنه و سقف تعداد ورودی می‌شوند. برای استفاده‌ی دوباره از یک نشست شناخته‌شده،
یک کلید نشست یا برچسب ارسال کنید:

- `--session <key>`: از یک کلید نشست مشخص Gateway استفاده کنید.
- `--session-label <label>`: یک نشست موجود را با برچسب resolve کنید.
- `--reset-session`: برای آن کلید یک شناسه‌ی نشست تازه بسازید (همان کلید، transcript جدید).

اگر کلاینت ACP شما از فراداده پشتیبانی می‌کند، می‌توانید برای هر نشست بازنویسی کنید:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

درباره‌ی کلیدهای نشست در [/concepts/session](/fa/concepts/session) بیشتر بیاموزید.

## گزینه‌ها

- `--url <url>`: URL وب‌سوکت Gateway (وقتی پیکربندی شده باشد، پیش‌فرض `gateway.remote.url` است).
- `--token <token>`: توکن احراز هویت Gateway.
- `--token-file <path>`: توکن احراز هویت Gateway را از فایل بخوانید.
- `--password <password>`: گذرواژه‌ی احراز هویت Gateway.
- `--password-file <path>`: گذرواژه‌ی احراز هویت Gateway را از فایل بخوانید.
- `--session <key>`: کلید نشست پیش‌فرض.
- `--session-label <label>`: برچسب نشست پیش‌فرض برای resolve کردن.
- `--require-existing`: اگر کلید/برچسب نشست وجود نداشته باشد، شکست بخور.
- `--reset-session`: کلید نشست را پیش از اولین استفاده بازنشانی کن.
- `--no-prefix-cwd`: پیشوند پوشه‌ی کاری را به promptها اضافه نکن.
- `--provenance <off|meta|meta+receipt>`: فراداده یا رسیدهای منشأ ACP را شامل کن.
- `--verbose, -v`: ثبت گزارش مفصل در stderr.

یادداشت امنیتی:

- `--token` و `--password` در بعضی سیستم‌ها می‌توانند در فهرست پردازش‌های محلی قابل مشاهده باشند.
- `--token-file`/`--password-file` یا متغیرهای محیطی (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) را ترجیح دهید.
- resolve کردن احراز هویت Gateway از قرارداد مشترکی پیروی می‌کند که کلاینت‌های دیگر Gateway استفاده می‌کنند:
  - حالت محلی: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback به `gateway.remote.*` فقط وقتی `gateway.auth.*` تنظیم نشده باشد (SecretRefهای محلیِ پیکربندی‌شده اما resolveنشده fail closed می‌شوند)
  - حالت راه‌دور: `gateway.remote.*` همراه با fallback env/config طبق قواعد تقدم راه‌دور
  - `--url` برای بازنویسی امن است و از اعتبارنامه‌های ضمنی config/env دوباره استفاده نمی‌کند؛ `--token`/`--password` صریح (یا گونه‌های فایلی) ارسال کنید
- فرایندهای فرزند backend زمان اجرای ACP مقدار `OPENCLAW_SHELL=acp` را دریافت می‌کنند، که می‌تواند برای قواعد shell/profile مختص زمینه استفاده شود.
- `openclaw acp client` روی فرایند پلِ ایجادشده مقدار `OPENCLAW_SHELL=acp-client` را تنظیم می‌کند.

### گزینه‌های `acp client`

- `--cwd <dir>`: پوشه‌ی کاری برای نشست ACP.
- `--server <command>`: فرمان سرور ACP (پیش‌فرض: `openclaw`).
- `--server-args <args...>`: آرگومان‌های اضافی که به سرور ACP ارسال می‌شوند.
- `--server-verbose`: ثبت گزارش مفصل را روی سرور ACP فعال کن.
- `--verbose, -v`: ثبت گزارش مفصل کلاینت.

## مرتبط

- [مرجع CLI](/fa/cli)
- [عامل‌های ACP](/fa/tools/acp-agents)
