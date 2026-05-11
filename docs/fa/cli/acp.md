---
read_when:
    - راه‌اندازی یکپارچه‌سازی‌های IDE مبتنی بر ACP
    - اشکال‌زدایی مسیر‌یابی نشست ACP به Gateway
summary: پل ACP را برای یکپارچه‌سازی‌های IDE اجرا کنید
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:27:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

پل [پروتکل مشتری عامل (ACP)](https://agentclientprotocol.com/) را اجرا کنید که با یک OpenClaw Gateway گفتگو می‌کند.

این فرمان ACP را از طریق stdio برای IDEها صحبت می‌کند و اعلان‌ها را از طریق WebSocket به Gateway
ارسال می‌کند. این فرمان نشست‌های ACP را به کلیدهای نشست Gateway نگاشت‌شده نگه می‌دارد.

`openclaw acp` یک پل ACP متکی بر Gateway است، نه یک runtime ویرایشگر کاملا بومی ACP.
تمرکز آن روی مسیریابی نشست، تحویل اعلان، و به‌روزرسانی‌های پایه‌ی streaming است.

اگر می‌خواهید یک مشتری MCP خارجی به‌جای میزبانی یک نشست harness مربوط به ACP مستقیما با گفتگوهای کانال
OpenClaw صحبت کند، از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.

## این چه چیزی نیست

این صفحه اغلب با نشست‌های harness مربوط به ACP اشتباه گرفته می‌شود.

`openclaw acp` یعنی:

- OpenClaw به‌عنوان سرور ACP عمل می‌کند
- یک IDE یا مشتری ACP به OpenClaw وصل می‌شود
- OpenClaw آن کار را به یک نشست Gateway ارسال می‌کند

این با [عامل‌های ACP](/fa/tools/acp-agents) فرق دارد، جایی که OpenClaw یک
harness خارجی مانند Codex یا Claude Code را از طریق `acpx` اجرا می‌کند.

قاعده‌ی سریع:

- ویرایشگر/مشتری می‌خواهد با ACP با OpenClaw صحبت کند: از `openclaw acp` استفاده کنید
- OpenClaw باید Codex/Claude/Gemini را به‌عنوان harness مربوط به ACP اجرا کند: از `/acp spawn` و [عامل‌های ACP](/fa/tools/acp-agents) استفاده کنید

## ماتریس سازگاری

| ناحیه ACP                                                              | وضعیت      | یادداشت‌ها                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | پیاده‌سازی‌شده | جریان اصلی پل از stdio به chat/send و abort در Gateway.                                                                                                                                                                                        |
| `listSessions`, فرمان‌های slash                                        | پیاده‌سازی‌شده | فهرست نشست با وضعیت نشست Gateway، صفحه‌بندی cursor محدود، و فیلتر `cwd` کار می‌کند، در جایی که ردیف‌های نشست Gateway فراداده‌ی workspace داشته باشند؛ فرمان‌ها از طریق `available_commands_update` اعلام می‌شوند.                                |
| فراداده‌ی تبار نشست                                              | پیاده‌سازی‌شده | فهرست‌های نشست و snapshotهای اطلاعات نشست، تبار والد و فرزند OpenClaw را در `_meta` شامل می‌شوند تا مشتریان ACP بتوانند گراف‌های subagent را بدون کانال‌های جانبی خصوصی Gateway نمایش دهند.                                                                |
| `resumeSession`, `closeSession`                                       | پیاده‌سازی‌شده | Resume یک نشست ACP را بدون بازپخش تاریخچه به یک نشست Gateway موجود دوباره متصل می‌کند. Close کار فعال پل را لغو می‌کند، اعلان‌های معلق را به‌عنوان لغوشده resolve می‌کند، و وضعیت نشست پل را آزاد می‌کند.                                              |
| `loadSession`                                                         | جزئی     | نشست ACP را به یک کلید نشست Gateway دوباره متصل می‌کند و تاریخچه‌ی ledger رویداد ACP را برای نشست‌های ساخته‌شده توسط پل بازپخش می‌کند. نشست‌های قدیمی‌تر/بدون ledger به متن ذخیره‌شده‌ی کاربر/دستیار fallback می‌کنند.                                                             |
| محتوای اعلان (`text`, `resource` جاسازی‌شده، تصاویر)                  | جزئی     | متن/منابع به ورودی chat تخت می‌شوند؛ تصاویر به پیوست‌های Gateway تبدیل می‌شوند.                                                                                                                                                                 |
| حالت‌های نشست                                                         | جزئی     | `session/set_mode` پشتیبانی می‌شود و پل کنترل‌های اولیه‌ی نشست متکی بر Gateway را برای سطح فکر، میزان جزئیات ابزار، استدلال، جزئیات مصرف، و اقدام‌های elevated عرضه می‌کند. سطوح گسترده‌تر حالت/پیکربندی بومی ACP هنوز خارج از محدوده‌اند. |
| اطلاعات نشست و به‌روزرسانی‌های مصرف                                        | جزئی     | پل اعلان‌های `session_info_update` و `usage_update` را به‌صورت best-effort از snapshotهای cached نشست Gateway صادر می‌کند. مصرف تقریبی است و فقط وقتی ارسال می‌شود که مجموع tokenهای Gateway تازه علامت‌گذاری شده باشد.                                        |
| Streaming ابزار                                                        | جزئی     | رویدادهای `tool_call` / `tool_call_update` شامل I/O خام، محتوای متن، و مکان‌های best-effort فایل هستند، وقتی args/results ابزار Gateway آن‌ها را افشا کنند. ترمینال‌های جاسازی‌شده و خروجی غنی‌تر بومی diff هنوز ارائه نمی‌شوند.                        |
| تاییدیه‌های exec                                                        | جزئی     | اعلان‌های تایید exec مربوط به Gateway هنگام نوبت‌های فعال اعلان ACP با `session/request_permission` به مشتری ACP منتقل می‌شوند.                                                                                                                    |
| سرورهای MCP به‌ازای هر نشست (`mcpServers`)                                | پشتیبانی‌نشده | حالت پل درخواست‌های سرور MCP به‌ازای هر نشست را رد می‌کند. به‌جای آن، MCP را روی OpenClaw gateway یا عامل پیکربندی کنید.                                                                                                                                     |
| متدهای فایل‌سیستم مشتری (`fs/read_text_file`, `fs/write_text_file`) | پشتیبانی‌نشده | پل متدهای فایل‌سیستم مشتری ACP را فراخوانی نمی‌کند.                                                                                                                                                                                          |
| متدهای ترمینال مشتری (`terminal/*`)                                | پشتیبانی‌نشده | پل ترمینال‌های مشتری ACP را ایجاد نمی‌کند یا شناسه‌های ترمینال را از طریق فراخوانی‌های ابزار stream نمی‌کند.                                                                                                                                                       |
| طرح‌های نشست / streaming فکر                                     | پشتیبانی‌نشده | پل در حال حاضر متن خروجی و وضعیت ابزار را صادر می‌کند، نه به‌روزرسانی‌های طرح یا فکر ACP.                                                                                                                                                         |

## محدودیت‌های شناخته‌شده

- `loadSession` می‌تواند تاریخچه‌ی کامل ledger رویداد ACP را فقط برای
  نشست‌های ساخته‌شده توسط پل بازپخش کند. نشست‌های قدیمی‌تر/بدون ledger همچنان از fallback
  transcript استفاده می‌کنند و فراخوانی‌های تاریخی ابزار یا اعلان‌های سیستم را بازسازی نمی‌کنند.
- اگر چند مشتری ACP یک کلید نشست Gateway یکسان را به‌اشتراک بگذارند، مسیریابی رویداد و cancel
  best-effort است، نه کاملا ایزوله به‌ازای هر مشتری. وقتی به نوبت‌های تمیز محلی ویرایشگر
  نیاز دارید، نشست‌های ایزوله‌ی پیش‌فرض `acp:<uuid>` را ترجیح دهید.
- وضعیت‌های stop در Gateway به دلایل stop در ACP ترجمه می‌شوند، اما آن نگاشت
  از یک runtime کاملا بومی ACP کم‌بیان‌تر است.
- کنترل‌های اولیه‌ی نشست در حال حاضر زیرمجموعه‌ای متمرکز از knobهای Gateway را ارائه می‌کنند:
  سطح فکر، میزان جزئیات ابزار، استدلال، جزئیات مصرف، و اقدام‌های elevated. انتخاب مدل و کنترل‌های exec-host هنوز به‌عنوان گزینه‌های پیکربندی ACP ارائه نشده‌اند.
- `session_info_update` و `usage_update` از snapshotهای نشست Gateway مشتق می‌شوند،
  نه حسابداری runtime زنده‌ی بومی ACP. مصرف تقریبی است،
  داده‌ی هزینه ندارد، و فقط وقتی صادر می‌شود که Gateway داده‌ی مجموع token را تازه علامت‌گذاری کند.
- داده‌ی همراه ابزار best-effort است. پل می‌تواند مسیرهای فایلی را که
  در args/results شناخته‌شده‌ی ابزار ظاهر می‌شوند نمایش دهد، اما هنوز ترمینال‌های ACP یا
  diffهای ساختاریافته‌ی فایل را صادر نمی‌کند.
- انتقال تایید exec به نوبت فعال اعلان ACP محدود است؛ تاییدیه‌های
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

## مشتری ACP (debug)

از مشتری ACP داخلی برای sanity-check پل بدون IDE استفاده کنید.
این ابزار پل ACP را spawn می‌کند و اجازه می‌دهد اعلان‌ها را به‌صورت تعاملی تایپ کنید.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

مدل مجوزها (حالت debug مشتری):

- تایید خودکار مبتنی بر allowlist است و فقط برای شناسه‌های ابزار core مورد اعتماد اعمال می‌شود.
- تایید خودکار `read` به دایرکتوری کاری فعلی محدود است (`--cwd` وقتی تنظیم شده باشد).
- ACP فقط کلاس‌های readonly محدود را خودکار تایید می‌کند: فراخوانی‌های scoped `read` زیر cwd فعال به‌علاوه ابزارهای جست‌وجوی readonly (`search`, `web_search`, `memory_search`). ابزارهای ناشناخته/غیر core، خواندن‌های خارج از محدوده، ابزارهای دارای قابلیت exec، ابزارهای control-plane، ابزارهای تغییر‌دهنده، و جریان‌های تعاملی همیشه به تایید صریح اعلان نیاز دارند.
- `toolCall.kind` ارائه‌شده توسط سرور به‌عنوان فراداده‌ی غیرقابل اعتماد در نظر گرفته می‌شود (نه منبع authorization).
- این سیاست پل ACP از مجوزهای harness مربوط به ACPX جدا است. اگر OpenClaw را از طریق backend `acpx` اجرا می‌کنید، `plugins.entries.acpx.config.permissionMode=approve-all` سوئیچ اضطراری "yolo" برای آن نشست harness است.

## Smoke testing پروتکل

برای debugging در سطح پروتکل، یک Gateway را با وضعیت ایزوله شروع کنید و
`openclaw acp` را از طریق stdio با یک مشتری ACP JSON-RPC هدایت کنید. `initialize`،
`session/new`، `session/list` با یک `cwd` مطلق، `session/resume`،
`session/close`، close تکراری، و resume مفقود را پوشش دهید.

اثبات باید قابلیت‌های lifecycle اعلام‌شده، یک ردیف نشست متکی بر Gateway،
اعلان‌های به‌روزرسانی، و log مربوط به `sessions.list` در Gateway را شامل شود:

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
مسیر CLI ممکن است ارتقای محدوده‌ی operator با token تازه درخواست کند؛ درستی پل ACP
با frameهای stdio مربوط به ACP به‌علاوه log مربوط به `sessions.list` در Gateway اثبات می‌شود.

## روش استفاده از این

وقتی یک IDE (یا مشتری دیگر) با Agent Client Protocol صحبت می‌کند و می‌خواهید
یک نشست OpenClaw Gateway را هدایت کند، از ACP استفاده کنید.

1. مطمئن شوید Gateway اجرا شده است (محلی یا راه‌دور).
2. هدف Gateway را پیکربندی کنید (config یا flagها).
3. IDE خود را طوری تنظیم کنید که `openclaw acp` را از طریق stdio اجرا کند.

نمونه config (ماندگار):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

نمونه اجرای مستقیم (بدون نوشتن config):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## انتخاب عامل‌ها

ACP عامل‌ها را مستقیما انتخاب نمی‌کند. بر اساس کلید نشست Gateway مسیریابی می‌کند.

برای هدف‌گیری یک عامل مشخص، از کلیدهای نشست با scope عامل استفاده کنید:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

هر نشست ACP به یک کلید نشست Gateway واحد نگاشت می‌شود. یک عامل می‌تواند
نشست‌های زیادی داشته باشد؛ ACP به‌طور پیش‌فرض از یک نشست ایزوله‌ی `acp:<uuid>` استفاده می‌کند،
مگر اینکه کلید یا برچسب را بازنویسی کنید.

`mcpServers` برای هر نشست در حالت پل پشتیبانی نمی‌شود. اگر یک سرویس‌گیرنده‌ی ACP
آن‌ها را هنگام `newSession` یا `loadSession` ارسال کند، پل به‌جای نادیده گرفتن بی‌صدای آن‌ها،
یک خطای روشن برمی‌گرداند.

اگر می‌خواهید نشست‌های مبتنی بر ACPX ابزارهای Plugin در OpenClaw یا ابزارهای
داخلی منتخب مانند `cron` را ببینند، به‌جای تلاش برای پاس دادن `mcpServers` برای هر نشست،
پل‌های ACPX MCP سمت Gateway را فعال کنید. ببینید
[عامل‌های ACP](/fa/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[پل MCP ابزارهای OpenClaw](/fa/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## استفاده از `acpx` (Codex، Claude، سایر سرویس‌گیرنده‌های ACP)

اگر می‌خواهید یک عامل کدنویسی مانند Codex یا Claude Code از طریق ACP با بات
OpenClaw شما صحبت کند، از `acpx` با هدف داخلی `openclaw` آن استفاده کنید.

جریان معمول:

1. Gateway را اجرا کنید و مطمئن شوید پل ACP می‌تواند به آن دسترسی پیدا کند.
2. `acpx openclaw` را به `openclaw acp` اشاره دهید.
3. کلید نشست OpenClaw را که می‌خواهید عامل کدنویسی استفاده کند هدف بگیرید.

مثال‌ها:

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

برای یک checkout محلی OpenClaw در مخزن، به‌جای اجراکننده‌ی توسعه از نقطه‌ورود مستقیم CLI
استفاده کنید تا جریان ACP تمیز بماند. برای مثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

این ساده‌ترین راه است تا Codex، Claude Code، یا یک سرویس‌گیرنده‌ی دیگر آگاه از ACP بتواند
اطلاعات زمینه‌ای را از یک عامل OpenClaw بدون scraping ترمینال بیرون بکشد.

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

در Zed، پنل Agent را باز کنید و برای شروع یک رشته، "OpenClaw ACP" را انتخاب کنید.

## نگاشت نشست

به‌طور پیش‌فرض، نشست‌های ACP یک کلید نشست Gateway ایزوله با پیشوند `acp:` دریافت می‌کنند.
برای استفاده‌ی مجدد از یک نشست شناخته‌شده، یک کلید نشست یا برچسب پاس دهید:

- `--session <key>`: از یک کلید نشست Gateway مشخص استفاده کنید.
- `--session-label <label>`: یک نشست موجود را بر اساس برچسب resolve کنید.
- `--reset-session`: برای آن کلید یک شناسه‌ی نشست تازه mint کنید (همان کلید، transcript جدید).

اگر سرویس‌گیرنده‌ی ACP شما از فراداده پشتیبانی می‌کند، می‌توانید برای هر نشست بازنویسی کنید:

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

- `--url <url>`: URL WebSocket برای Gateway (وقتی پیکربندی شده باشد، پیش‌فرض `gateway.remote.url` است).
- `--token <token>`: توکن احراز هویت Gateway.
- `--token-file <path>`: توکن احراز هویت Gateway را از فایل بخوانید.
- `--password <password>`: گذرواژه‌ی احراز هویت Gateway.
- `--password-file <path>`: گذرواژه‌ی احراز هویت Gateway را از فایل بخوانید.
- `--session <key>`: کلید نشست پیش‌فرض.
- `--session-label <label>`: برچسب نشست پیش‌فرض برای resolve کردن.
- `--require-existing`: اگر کلید/برچسب نشست وجود ندارد شکست بخور.
- `--reset-session`: کلید نشست را پیش از اولین استفاده reset کن.
- `--no-prefix-cwd`: پیشوند پوشه‌ی کاری را به promptها اضافه نکن.
- `--provenance <off|meta|meta+receipt>`: فراداده یا receiptهای provenance مربوط به ACP را شامل کن.
- `--verbose, -v`: ثبت لاگ مفصل در stderr.

نکته‌ی امنیتی:

- `--token` و `--password` در برخی سیستم‌ها می‌توانند در فهرست فرایندهای محلی قابل مشاهده باشند.
- `--token-file`/`--password-file` یا متغیرهای محیطی (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) را ترجیح دهید.
- resolve احراز هویت Gateway از قرارداد مشترک استفاده‌شده توسط سایر سرویس‌گیرنده‌های Gateway پیروی می‌کند:
  - حالت محلی: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback به `gateway.remote.*` فقط وقتی `gateway.auth.*` تنظیم نشده باشد (SecretRefهای محلی پیکربندی‌شده اما resolveنشده fail closed می‌شوند)
  - حالت remote: `gateway.remote.*` با fallback env/config طبق قواعد تقدم remote
  - `--url` برای override امن است و credentialهای ضمنی config/env را دوباره استفاده نمی‌کند؛ `--token`/`--password` صریح (یا گونه‌های فایل) را پاس دهید
- فرایندهای فرزند backend زمان اجرای ACP مقدار `OPENCLAW_SHELL=acp` را دریافت می‌کنند، که می‌تواند برای قواعد shell/profile مختص زمینه استفاده شود.
- `openclaw acp client` مقدار `OPENCLAW_SHELL=acp-client` را روی فرایند پل spawnشده تنظیم می‌کند.

### گزینه‌های `acp client`

- `--cwd <dir>`: پوشه‌ی کاری برای نشست ACP.
- `--server <command>`: فرمان سرور ACP (پیش‌فرض: `openclaw`).
- `--server-args <args...>`: آرگومان‌های اضافی پاس‌داده‌شده به سرور ACP.
- `--server-verbose`: ثبت لاگ مفصل را روی سرور ACP فعال کن.
- `--verbose, -v`: ثبت لاگ مفصل سرویس‌گیرنده.

## مرتبط

- [مرجع CLI](/fa/cli)
- [عامل‌های ACP](/fa/tools/acp-agents)
