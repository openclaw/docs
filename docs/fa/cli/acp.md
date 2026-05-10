---
read_when:
    - راه‌اندازی یکپارچه‌سازی‌های IDE مبتنی بر ACP
    - اشکال‌زدایی از مسیریابی نشست ACP به Gateway
summary: پل ACP را برای یکپارچه‌سازی‌های IDE اجرا کنید
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

پل [پروتکل کلاینت عامل (ACP)](https://agentclientprotocol.com/) را اجرا کنید که با یک OpenClaw Gateway ارتباط برقرار می‌کند.

این فرمان ACP را از طریق stdio برای IDEها صحبت می‌کند و promptها را از طریق WebSocket به Gateway
ارسال می‌کند. این فرمان نشست‌های ACP را به کلیدهای نشست Gateway نگاشت‌شده نگه می‌دارد.

`openclaw acp` یک پل ACP متکی به Gateway است، نه یک runtime ویرایشگر کاملا ACP-native.
تمرکز آن بر مسیریابی نشست، تحویل prompt و به‌روزرسانی‌های پایه streaming است.

اگر می‌خواهید یک کلاینت MCP خارجی به‌جای میزبانی نشست ACP harness، مستقیما با گفت‌وگوهای
کانال OpenClaw صحبت کند، به‌جای آن از [`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.

## این چه چیزی نیست

این صفحه اغلب با نشست‌های ACP harness اشتباه گرفته می‌شود.

`openclaw acp` یعنی:

- OpenClaw به‌عنوان یک سرور ACP عمل می‌کند
- یک IDE یا کلاینت ACP به OpenClaw وصل می‌شود
- OpenClaw آن کار را به یک نشست Gateway ارسال می‌کند

این با [عامل‌های ACP](/fa/tools/acp-agents) متفاوت است؛ جایی که OpenClaw یک
harness خارجی مانند Codex یا Claude Code را از طریق `acpx` اجرا می‌کند.

قاعده سریع:

- ویرایشگر/کلاینت می‌خواهد با OpenClaw از طریق ACP صحبت کند: از `openclaw acp` استفاده کنید
- OpenClaw باید Codex/Claude/Gemini را به‌عنوان ACP harness اجرا کند: از `/acp spawn` و [عامل‌های ACP](/fa/tools/acp-agents) استفاده کنید

## ماتریس سازگاری

| حوزه ACP                                                               | وضعیت      | یادداشت‌ها                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | پیاده‌سازی‌شده | جریان اصلی پل از طریق stdio به chat/send و abort در Gateway.                                                                                                                                                                                        |
| `listSessions`, فرمان‌های slash                                        | پیاده‌سازی‌شده | فهرست نشست در برابر وضعیت نشست Gateway با صفحه‌بندی cursor محدود و فیلتر کردن `cwd` کار می‌کند، در جایی که ردیف‌های نشست Gateway فراداده workspace را حمل می‌کنند؛ فرمان‌ها از طریق `available_commands_update` اعلام می‌شوند.                                |
| `resumeSession`, `closeSession`                                       | پیاده‌سازی‌شده | Resume یک نشست ACP را بدون بازپخش تاریخچه به یک نشست Gateway موجود دوباره متصل می‌کند. Close کار فعال پل را لغو می‌کند، promptهای در انتظار را به‌عنوان لغوشده حل می‌کند و وضعیت نشست پل را آزاد می‌کند.                                              |
| `loadSession`                                                         | جزئی     | نشست ACP را دوباره به یک کلید نشست Gateway متصل می‌کند و تاریخچه event-ledger ACP را برای نشست‌هایی که پل ساخته است بازپخش می‌کند. نشست‌های قدیمی‌تر/بدون ledger به متن ذخیره‌شده کاربر/دستیار fallback می‌کنند.                                                             |
| محتوای prompt (`text`، `resource` جاسازی‌شده، تصویرها)                  | جزئی     | متن/منبع‌ها به ورودی chat تخت می‌شوند؛ تصویرها به پیوست‌های Gateway تبدیل می‌شوند.                                                                                                                                                                 |
| حالت‌های نشست                                                         | جزئی     | `session/set_mode` پشتیبانی می‌شود و پل کنترل‌های اولیه نشست متکی به Gateway را برای سطح فکر، پرگویی ابزار، استدلال، جزئیات مصرف و اقدام‌های ارتقایافته در معرض استفاده می‌گذارد. سطوح گسترده‌تر حالت/پیکربندی ACP-native هنوز خارج از محدوده هستند. |
| اطلاعات نشست و به‌روزرسانی‌های مصرف                                        | جزئی     | پل اعلان‌های `session_info_update` و `usage_update` را به‌صورت best-effort از snapshotهای کش‌شده نشست Gateway صادر می‌کند. مصرف تقریبی است و فقط وقتی فرستاده می‌شود که مجموع tokenهای Gateway تازه علامت‌گذاری شده باشند.                                        |
| streaming ابزار                                                        | جزئی     | رویدادهای `tool_call` / `tool_call_update` شامل I/O خام، محتوای متنی، و مکان‌های فایل best-effort هستند، وقتی args/results ابزار Gateway آن‌ها را در معرض بگذارند. terminalهای جاسازی‌شده و خروجی غنی‌تر diff-native هنوز در معرض استفاده نیستند.                        |
| تاییدهای exec                                                        | جزئی     | promptهای تایید exec در Gateway طی turnهای فعال prompt ACP با `session/request_permission` به کلاینت ACP منتقل می‌شوند.                                                                                                                    |
| سرورهای MCP هر نشست (`mcpServers`)                                | پشتیبانی‌نشده | حالت پل درخواست‌های سرور MCP هر نشست را رد می‌کند. MCP را به‌جای آن روی Gateway یا عامل OpenClaw پیکربندی کنید.                                                                                                                                     |
| متدهای فایل‌سیستم کلاینت (`fs/read_text_file`, `fs/write_text_file`) | پشتیبانی‌نشده | پل متدهای فایل‌سیستم کلاینت ACP را فراخوانی نمی‌کند.                                                                                                                                                                                          |
| متدهای terminal کلاینت (`terminal/*`)                                | پشتیبانی‌نشده | پل terminalهای کلاینت ACP را نمی‌سازد یا شناسه‌های terminal را از طریق فراخوانی‌های ابزار stream نمی‌کند.                                                                                                                                                       |
| برنامه‌های نشست / streaming فکر                                     | پشتیبانی‌نشده | پل در حال حاضر متن خروجی و وضعیت ابزار را صادر می‌کند، نه به‌روزرسانی‌های برنامه یا فکر ACP.                                                                                                                                                         |

## محدودیت‌های شناخته‌شده

- `loadSession` فقط برای نشست‌هایی که پل ساخته است می‌تواند تاریخچه کامل event-ledger ACP را
  بازپخش کند. نشست‌های قدیمی‌تر/بدون ledger همچنان از transcript fallback استفاده می‌کنند
  و فراخوانی‌های تاریخی ابزار یا اعلان‌های سیستم را بازسازی نمی‌کنند.
- اگر چند کلاینت ACP کلید نشست Gateway یکسانی را به اشتراک بگذارند، مسیریابی رویداد و لغو
  به‌جای جداسازی سخت‌گیرانه برای هر کلاینت، best-effort است. وقتی به turnهای
  تمیز editor-local نیاز دارید، نشست‌های جداافتاده پیش‌فرض `acp:<uuid>` را ترجیح دهید.
- وضعیت‌های توقف Gateway به علت‌های توقف ACP ترجمه می‌شوند، اما آن نگاشت از یک runtime
  کاملا ACP-native کم‌بیان‌تر است.
- کنترل‌های اولیه نشست در حال حاضر زیرمجموعه‌ای متمرکز از knobهای Gateway را نمایش می‌دهند:
  سطح فکر، پرگویی ابزار، استدلال، جزئیات مصرف و اقدام‌های ارتقایافته.
  انتخاب مدل و کنترل‌های exec-host هنوز به‌عنوان گزینه‌های پیکربندی ACP در معرض استفاده نیستند.
- `session_info_update` و `usage_update` از snapshotهای نشست Gateway گرفته می‌شوند،
  نه حسابداری runtime زنده ACP-native. مصرف تقریبی است،
  داده هزینه ندارد و فقط زمانی صادر می‌شود که Gateway داده مجموع tokenها را تازه علامت بزند.
- داده follow-along ابزار best-effort است. پل می‌تواند مسیرهای فایلی را نمایش دهد که
  در args/results شناخته‌شده ابزار ظاهر می‌شوند، اما هنوز terminalهای ACP یا
  diffهای ساختاریافته فایل را صادر نمی‌کند.
- انتقال تایید exec به turn فعال prompt ACP محدود است؛ تاییدهای
  نشست‌های دیگر Gateway نادیده گرفته می‌شوند.

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

## کلاینت ACP (اشکال‌زدایی)

از کلاینت داخلی ACP برای sanity-check کردن پل بدون IDE استفاده کنید.
این کلاینت پل ACP را اجرا می‌کند و اجازه می‌دهد promptها را به‌صورت تعاملی تایپ کنید.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

مدل مجوز (حالت اشکال‌زدایی کلاینت):

- تایید خودکار مبتنی بر allowlist است و فقط برای شناسه‌های ابزار core قابل اعتماد اعمال می‌شود.
- تایید خودکار `read` به دایرکتوری کاری فعلی محدود است (وقتی `--cwd` تنظیم شده باشد).
- ACP فقط کلاس‌های محدود readonly را به‌طور خودکار تایید می‌کند: فراخوانی‌های `read` محدودشده زیر cwd فعال به‌علاوه ابزارهای جست‌وجوی readonly (`search`, `web_search`, `memory_search`). ابزارهای ناشناخته/غیر core، خواندن‌های خارج از محدوده، ابزارهای قادر به exec، ابزارهای control-plane، ابزارهای تغییردهنده، و جریان‌های تعاملی همیشه به تایید صریح prompt نیاز دارند.
- `toolCall.kind` ارائه‌شده توسط سرور به‌عنوان فراداده غیرقابل اعتماد در نظر گرفته می‌شود (نه منبع مجوزدهی).
- این سیاست پل ACP از مجوزهای ACPX harness جدا است. اگر OpenClaw را از طریق backend `acpx` اجرا می‌کنید، `plugins.entries.acpx.config.permissionMode=approve-all` کلید break-glass "yolo" برای آن نشست harness است.

## smoke testing پروتکل

برای اشکال‌زدایی در سطح پروتکل، یک Gateway را با وضعیت جداافتاده آغاز کنید و
`openclaw acp` را از طریق stdio با یک کلاینت ACP JSON-RPC هدایت کنید. `initialize`،
`session/new`، `session/list` با یک `cwd` مطلق، `session/resume`،
`session/close`، close تکراری و resume ناموجود را پوشش دهید.

اثبات باید شامل قابلیت‌های چرخه‌عمر اعلام‌شده، یک ردیف نشست متکی به Gateway،
اعلان‌های به‌روزرسانی، و log `sessions.list` در Gateway باشد:

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

از استفاده از `openclaw gateway call sessions.list` به‌عنوان تنها اثبات ACP پرهیز کنید. آن
مسیر CLI ممکن است ارتقای scope اپراتور با fresh-token درخواست کند؛ درستی پل ACP
با frameهای stdio ACP به‌علاوه log `sessions.list` در Gateway اثبات می‌شود.

## نحوه استفاده از این

از ACP وقتی استفاده کنید که یک IDE (یا کلاینت دیگر) Agent Client Protocol صحبت می‌کند و می‌خواهید
یک نشست OpenClaw Gateway را هدایت کند.

1. مطمئن شوید Gateway در حال اجراست (محلی یا راه دور).
2. هدف Gateway را پیکربندی کنید (پیکربندی یا flagها).
3. IDE خود را طوری تنظیم کنید که `openclaw acp` را از طریق stdio اجرا کند.

نمونه پیکربندی (persisted):

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

ACP عامل‌ها را مستقیما انتخاب نمی‌کند. این مسیریابی را بر اساس کلید نشست Gateway انجام می‌دهد.

برای هدف‌گیری یک عامل مشخص، از کلیدهای نشست agent-scoped استفاده کنید:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

هر نشست ACP به یک کلید نشست Gateway واحد نگاشت می‌شود. یک عامل می‌تواند نشست‌های زیادی داشته باشد؛
ACP به‌طور پیش‌فرض از یک نشست جداافتاده `acp:<uuid>` استفاده می‌کند، مگر اینکه
کلید یا label را override کنید.

`mcpServers` در هر نشست در حالت bridge پشتیبانی نمی‌شود. اگر یک کلاینت ACP
آن‌ها را هنگام `newSession` یا `loadSession` ارسال کند، bridge به‌جای نادیده‌گرفتن
بی‌سروصدای آن‌ها، یک خطای روشن برمی‌گرداند.

اگر می‌خواهید نشست‌های پشتیبانی‌شده با ACPX ابزارهای Plugin در OpenClaw یا ابزارهای
داخلی منتخب مانند `cron` را ببینند، به‌جای تلاش برای پاس‌دادن `mcpServers` در هر نشست،
bridgeهای ACPX MCP سمت Gateway را فعال کنید. ببینید
[عامل‌های ACP](/fa/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[bridge ابزارهای OpenClaw برای MCP](/fa/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## استفاده از `acpx` (Codex، Claude، سایر کلاینت‌های ACP)

اگر می‌خواهید یک عامل کدنویسی مانند Codex یا Claude Code از طریق ACP با ربات
OpenClaw شما صحبت کند، از `acpx` با هدف داخلی `openclaw` آن استفاده کنید.

روند معمول:

1. Gateway را اجرا کنید و مطمئن شوید bridge مربوط به ACP می‌تواند به آن دسترسی داشته باشد.
2. `acpx openclaw` را به `openclaw acp` متصل کنید.
3. کلید نشست OpenClaw را که می‌خواهید عامل کدنویسی استفاده کند هدف بگیرید.

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

برای checkout محلی OpenClaw در مخزن، به‌جای اجراکننده dev از نقطه ورود مستقیم CLI
استفاده کنید تا جریان ACP تمیز بماند. برای مثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

این ساده‌ترین راه است تا Codex، Claude Code، یا یک کلاینت دیگرِ آگاه به ACP بتواند
بدون scrape کردن ترمینال، اطلاعات زمینه‌ای را از یک عامل OpenClaw دریافت کند.

## راه‌اندازی ویرایشگر Zed

یک عامل ACP سفارشی در `~/.config/zed/settings.json` اضافه کنید (یا از UI تنظیمات Zed استفاده کنید):

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

برای هدف‌گرفتن یک Gateway یا عامل مشخص:

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

در Zed، پنل Agent را باز کنید و "OpenClaw ACP" را برای شروع یک thread انتخاب کنید.

## نگاشت نشست

به‌طور پیش‌فرض، نشست‌های ACP یک کلید نشست Gateway ایزوله با پیشوند `acp:` دریافت می‌کنند.
برای استفاده مجدد از یک نشست شناخته‌شده، یک کلید نشست یا برچسب پاس دهید:

- `--session <key>`: از یک کلید نشست مشخص Gateway استفاده کنید.
- `--session-label <label>`: یک نشست موجود را بر اساس برچسب resolve کنید.
- `--reset-session`: برای آن کلید یک شناسه نشست تازه صادر کنید (همان کلید، transcript جدید).

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

درباره کلیدهای نشست در [/concepts/session](/fa/concepts/session) بیشتر بدانید.

## گزینه‌ها

- `--url <url>`: نشانی WebSocket مربوط به Gateway (وقتی پیکربندی شده باشد، پیش‌فرض `gateway.remote.url` است).
- `--token <token>`: توکن احراز هویت Gateway.
- `--token-file <path>`: خواندن توکن احراز هویت Gateway از فایل.
- `--password <password>`: گذرواژه احراز هویت Gateway.
- `--password-file <path>`: خواندن گذرواژه احراز هویت Gateway از فایل.
- `--session <key>`: کلید نشست پیش‌فرض.
- `--session-label <label>`: برچسب نشست پیش‌فرض برای resolve کردن.
- `--require-existing`: اگر کلید/برچسب نشست وجود نداشته باشد، شکست بخورد.
- `--reset-session`: کلید نشست را پیش از نخستین استفاده reset کند.
- `--no-prefix-cwd`: promptها را با دایرکتوری کاری prefix نکند.
- `--provenance <off|meta|meta+receipt>`: فراداده یا رسیدهای منشأ ACP را شامل کند.
- `--verbose, -v`: ثبت گزارش پرجزئیات در stderr.

نکته امنیتی:

- `--token` و `--password` در برخی سیستم‌ها ممکن است در فهرست پردازش‌های محلی قابل مشاهده باشند.
- `--token-file`/`--password-file` یا متغیرهای محیطی (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) را ترجیح دهید.
- resolve احراز هویت Gateway از قرارداد مشترکی پیروی می‌کند که سایر کلاینت‌های Gateway استفاده می‌کنند:
  - حالت local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback به `gateway.remote.*` فقط وقتی `gateway.auth.*` تنظیم نشده باشد (SecretRefهای محلیِ پیکربندی‌شده اما resolveنشده با fail closed شکست می‌خورند)
  - حالت remote: `gateway.remote.*` همراه با fallback به env/config طبق قواعد تقدم remote
  - `--url` برای بازنویسی امن است و اعتبارنامه‌های ضمنی config/env را دوباره استفاده نمی‌کند؛ `--token`/`--password` صریح (یا گونه‌های فایل) را پاس دهید
- فرایندهای فرزند backend زمان اجرای ACP مقدار `OPENCLAW_SHELL=acp` را دریافت می‌کنند، که می‌توان از آن برای قواعد shell/profile ویژه زمینه استفاده کرد.
- `openclaw acp client` مقدار `OPENCLAW_SHELL=acp-client` را روی فرایند bridge ایجادشده تنظیم می‌کند.

### گزینه‌های `acp client`

- `--cwd <dir>`: دایرکتوری کاری برای نشست ACP.
- `--server <command>`: فرمان سرور ACP (پیش‌فرض: `openclaw`).
- `--server-args <args...>`: آرگومان‌های اضافی که به سرور ACP پاس داده می‌شوند.
- `--server-verbose`: ثبت گزارش پرجزئیات را روی سرور ACP فعال می‌کند.
- `--verbose, -v`: ثبت گزارش پرجزئیات کلاینت.

## مرتبط

- [مرجع CLI](/fa/cli)
- [عامل‌های ACP](/fa/tools/acp-agents)
