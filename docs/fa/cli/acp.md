---
read_when:
    - راه‌اندازی یکپارچه‌سازی‌های IDE مبتنی بر ACP
    - اشکال‌زدایی مسیریابی نشست ACP به Gateway
summary: اجرای پل ACP برای یکپارچه‌سازی‌های IDE
title: ACP
x-i18n:
    generated_at: "2026-04-29T22:32:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 16
---

اجرای پل [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) که با یک OpenClaw Gateway صحبت می‌کند.

این فرمان ACP را از طریق stdio برای IDEها اجرا می‌کند و درخواست‌ها را از طریق WebSocket
به Gateway ارسال می‌کند. این فرمان نشست‌های ACP را به کلیدهای نشست Gateway نگاشت‌شده نگه می‌دارد.

`openclaw acp` یک پل ACP مبتنی بر Gateway است، نه یک runtime کامل و بومی ACP برای ویرایشگر.
تمرکز آن بر مسیریابی نشست، تحویل درخواست، و به‌روزرسانی‌های پایه‌ی streaming است.

اگر می‌خواهید یک کلاینت خارجی MCP به‌جای میزبانی نشست ACP harness مستقیماً با مکالمه‌های کانال OpenClaw
صحبت کند، به‌جای آن از
[`openclaw mcp serve`](/fa/cli/mcp) استفاده کنید.

## این چه چیزی نیست

این صفحه اغلب با نشست‌های ACP harness اشتباه گرفته می‌شود.

`openclaw acp` یعنی:

- OpenClaw به‌عنوان یک سرور ACP عمل می‌کند
- یک IDE یا کلاینت ACP به OpenClaw متصل می‌شود
- OpenClaw آن کار را به یک نشست Gateway ارسال می‌کند

این با [ACP Agents](/fa/tools/acp-agents) فرق دارد، جایی که OpenClaw یک harness خارجی مانند Codex یا Claude Code را از طریق `acpx` اجرا می‌کند.

قاعده‌ی سریع:

- ویرایشگر/کلاینت می‌خواهد با ACP با OpenClaw صحبت کند: از `openclaw acp` استفاده کنید
- OpenClaw باید Codex/Claude/Gemini را به‌عنوان ACP harness راه‌اندازی کند: از `/acp spawn` و [ACP Agents](/fa/tools/acp-agents) استفاده کنید

## ماتریس سازگاری

| حوزه ACP                                                               | وضعیت       | یادداشت‌ها                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | پیاده‌سازی شده | جریان اصلی پل از stdio به chat/send + abort در Gateway.                                                                                                                                                                                        |
| `listSessions`, فرمان‌های slash                                        | پیاده‌سازی شده | فهرست نشست‌ها با وضعیت نشست Gateway کار می‌کند؛ فرمان‌ها از طریق `available_commands_update` اعلام می‌شوند.                                                                                                                                     |
| `loadSession`                                                         | جزئی        | نشست ACP را دوباره به یک کلید نشست Gateway متصل می‌کند و تاریخچه‌ی متنی ذخیره‌شده‌ی کاربر/دستیار را بازپخش می‌کند. تاریخچه‌ی ابزار/سیستم هنوز بازسازی نمی‌شود.                                                                                   |
| محتوای درخواست (`text`، `resource` جاسازی‌شده، تصویرها)               | جزئی        | متن/منابع به ورودی چت تخت می‌شوند؛ تصویرها به پیوست‌های Gateway تبدیل می‌شوند.                                                                                                                                                                 |
| حالت‌های نشست                                                         | جزئی        | `session/set_mode` پشتیبانی می‌شود و پل کنترل‌های اولیه‌ی نشست مبتنی بر Gateway را برای سطح فکر، پرگویی ابزار، reasoning، جزئیات مصرف، و اقدام‌های ارتقایافته ارائه می‌کند. سطوح گسترده‌تر حالت/پیکربندی بومی ACP هنوز خارج از محدوده هستند. |
| اطلاعات نشست و به‌روزرسانی‌های مصرف                                   | جزئی        | پل اعلان‌های `session_info_update` و `usage_update` را به‌صورت best-effort از snapshotهای کش‌شده‌ی نشست Gateway منتشر می‌کند. مصرف تقریبی است و فقط وقتی ارسال می‌شود که مجموع tokenهای Gateway تازه علامت‌گذاری شده باشند.                  |
| streaming ابزار                                                       | جزئی        | رویدادهای `tool_call` / `tool_call_update` شامل I/O خام، محتوای متنی، و مکان‌های فایل به‌صورت best-effort هستند، وقتی args/results ابزار Gateway آن‌ها را آشکار کنند. ترمینال‌های جاسازی‌شده و خروجی غنی‌تر و بومی diff هنوز ارائه نمی‌شوند. |
| سرورهای MCP در هر نشست (`mcpServers`)                                  | پشتیبانی‌نشده | حالت پل درخواست‌های سرور MCP در هر نشست را رد می‌کند. MCP را به‌جای آن روی OpenClaw gateway یا agent پیکربندی کنید.                                                                                                                           |
| متدهای فایل‌سیستم کلاینت (`fs/read_text_file`, `fs/write_text_file`)  | پشتیبانی‌نشده | پل متدهای فایل‌سیستم کلاینت ACP را فراخوانی نمی‌کند.                                                                                                                                                                                          |
| متدهای ترمینال کلاینت (`terminal/*`)                                  | پشتیبانی‌نشده | پل ترمینال‌های کلاینت ACP ایجاد نمی‌کند یا شناسه‌های ترمینال را از طریق فراخوانی‌های ابزار stream نمی‌کند.                                                                                                                                      |
| برنامه‌های نشست / streaming فکر                                       | پشتیبانی‌نشده | پل در حال حاضر متن خروجی و وضعیت ابزار را منتشر می‌کند، نه به‌روزرسانی‌های برنامه یا فکر ACP.                                                                                                                                                  |

## محدودیت‌های شناخته‌شده

- `loadSession` تاریخچه‌ی متنی ذخیره‌شده‌ی کاربر و دستیار را بازپخش می‌کند، اما
  فراخوانی‌های تاریخی ابزار، اعلان‌های سیستم، یا نوع‌های رویداد غنی‌تر و بومی ACP را
  بازسازی نمی‌کند.
- اگر چند کلاینت ACP یک کلید نشست Gateway مشترک داشته باشند، مسیریابی رویداد و cancel
  به‌جای ایزوله‌سازی سخت‌گیرانه برای هر کلاینت، best-effort خواهد بود. وقتی به نوبت‌های
  تمیز و محلی ویرایشگر نیاز دارید، نشست‌های پیش‌فرض ایزوله‌ی `acp:<uuid>` را ترجیح دهید.
- وضعیت‌های توقف Gateway به دلایل توقف ACP ترجمه می‌شوند، اما آن نگاشت از یک runtime
  کاملاً بومی ACP بیان‌گری کمتری دارد.
- کنترل‌های اولیه‌ی نشست در حال حاضر زیرمجموعه‌ای متمرکز از پیچ‌های Gateway را نمایش می‌دهند:
  سطح فکر، پرگویی ابزار، reasoning، جزئیات مصرف، و اقدام‌های ارتقایافته. انتخاب مدل و کنترل‌های
  exec-host هنوز به‌عنوان گزینه‌های پیکربندی ACP ارائه نشده‌اند.
- `session_info_update` و `usage_update` از snapshotهای نشست Gateway مشتق می‌شوند،
  نه حسابداری زنده‌ی runtime بومی ACP. مصرف تقریبی است، داده‌ی هزینه ندارد، و فقط وقتی منتشر می‌شود
  که Gateway داده‌ی مجموع token را تازه علامت‌گذاری کند.
- داده‌ی همراهی ابزار best-effort است. پل می‌تواند مسیرهای فایلی را نمایش دهد که
  در args/results شناخته‌شده‌ی ابزار ظاهر می‌شوند، اما هنوز ترمینال‌های ACP یا diffهای ساختاریافته‌ی فایل را منتشر نمی‌کند.

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

از کلاینت داخلی ACP برای بررسی سلامت پل بدون IDE استفاده کنید.
این کلاینت پل ACP را spawn می‌کند و به شما اجازه می‌دهد درخواست‌ها را به‌صورت تعاملی تایپ کنید.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

مدل مجوزها (حالت اشکال‌زدایی کلاینت):

- تأیید خودکار مبتنی بر allowlist است و فقط برای شناسه‌های ابزار هسته‌ی مورد اعتماد اعمال می‌شود.
- تأیید خودکار `read` به دایرکتوری کاری فعلی محدود است (وقتی `--cwd` تنظیم شده باشد).
- ACP فقط کلاس‌های باریک readonly را به‌صورت خودکار تأیید می‌کند: فراخوانی‌های `read` محدودشده زیر cwd فعال به‌علاوه‌ی ابزارهای جست‌وجوی readonly (`search`, `web_search`, `memory_search`). ابزارهای ناشناخته/غیرهسته‌ای، خواندن‌های خارج از محدوده، ابزارهای دارای قابلیت exec، ابزارهای control-plane، ابزارهای تغییردهنده، و جریان‌های تعاملی همیشه به تأیید صریح prompt نیاز دارند.
- `toolCall.kind` ارائه‌شده توسط سرور به‌عنوان metadata نامطمئن در نظر گرفته می‌شود (نه منبع مجوزدهی).
- این سیاست پل ACP از مجوزهای ACPX harness جداست. اگر OpenClaw را از طریق backend `acpx` اجرا کنید، `plugins.entries.acpx.config.permissionMode=approve-all` سوییچ اضطراری «yolo» برای آن نشست harness است.

## نحوه‌ی استفاده از این

وقتی یک IDE (یا کلاینت دیگر) با Agent Client Protocol صحبت می‌کند و می‌خواهید
یک نشست OpenClaw Gateway را هدایت کند، از ACP استفاده کنید.

1. مطمئن شوید Gateway در حال اجراست (محلی یا remote).
2. مقصد Gateway را پیکربندی کنید (config یا flagها).
3. IDE خود را طوری تنظیم کنید که `openclaw acp` را از طریق stdio اجرا کند.

نمونه config (ذخیره‌شده):

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

## انتخاب agentها

ACP مستقیماً agentها را انتخاب نمی‌کند. مسیریابی آن بر اساس کلید نشست Gateway است.

برای هدف‌گیری یک agent مشخص، از کلیدهای نشست دارای دامنه‌ی agent استفاده کنید:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

هر نشست ACP به یک کلید نشست Gateway واحد نگاشت می‌شود. یک agent می‌تواند نشست‌های زیادی داشته باشد؛
ACP به‌طور پیش‌فرض از یک نشست ایزوله‌ی `acp:<uuid>` استفاده می‌کند، مگر اینکه کلید یا برچسب را override کنید.

`mcpServers` در هر نشست در حالت پل پشتیبانی نمی‌شود. اگر یک کلاینت ACP
آن‌ها را هنگام `newSession` یا `loadSession` ارسال کند، پل به‌جای نادیده‌گرفتن بی‌صدا،
یک خطای واضح برمی‌گرداند.

اگر می‌خواهید نشست‌های مبتنی بر ACPX ابزارهای Plugin OpenClaw یا ابزارهای داخلی انتخاب‌شده
مانند `cron` را ببینند، به‌جای تلاش برای ارسال `mcpServers` در هر نشست، پل‌های ACPX MCP سمت gateway را فعال کنید. ببینید:
[ACP Agents](/fa/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[پل MCP ابزارهای OpenClaw](/fa/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## استفاده از `acpx` (Codex، Claude، کلاینت‌های دیگر ACP)

اگر می‌خواهید یک agent کدنویسی مانند Codex یا Claude Code با bot
OpenClaw شما از طریق ACP صحبت کند، از `acpx` با target داخلی `openclaw` آن استفاده کنید.

جریان معمول:

1. Gateway را اجرا کنید و مطمئن شوید پل ACP می‌تواند به آن دسترسی پیدا کند.
2. `acpx openclaw` را به `openclaw acp` اشاره دهید.
3. کلید نشست OpenClaw را که می‌خواهید agent کدنویسی استفاده کند، هدف بگیرید.

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
فرمان agent به نام `openclaw` را در `~/.acpx/config.json` override کنید:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

برای یک checkout محلی repo از OpenClaw، به‌جای dev runner از entrypoint مستقیم CLI استفاده کنید
تا stream ACP تمیز بماند. برای مثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

این ساده‌ترین راه است تا Codex، Claude Code، یا یک کلاینت دیگر آگاه از ACP بتواند
اطلاعات زمینه‌ای را از یک agent در OpenClaw بدون scraping ترمینال دریافت کند.

## راه‌اندازی ویرایشگر Zed

یک agent سفارشی ACP را در `~/.config/zed/settings.json` اضافه کنید (یا از Settings UI در Zed استفاده کنید):

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

در Zed، پنل عامل را باز کنید و «OpenClaw ACP» را برای شروع یک رشته انتخاب کنید.

## نگاشت نشست

به‌طور پیش‌فرض، نشست‌های ACP یک کلید نشست Gateway ایزوله با پیشوند `acp:` دریافت می‌کنند.
برای استفادهٔ دوباره از یک نشست شناخته‌شده، یک کلید یا برچسب نشست ارسال کنید:

- `--session <key>`: از یک کلید نشست Gateway مشخص استفاده کنید.
- `--session-label <label>`: یک نشست موجود را بر اساس برچسب پیدا کنید.
- `--reset-session`: برای آن کلید یک شناسهٔ نشست تازه بسازید (همان کلید، رونوشت تازه).

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

دربارهٔ کلیدهای نشست در [/concepts/session](/fa/concepts/session) بیشتر بیاموزید.

## گزینه‌ها

- `--url <url>`: URL WebSocket مربوط به Gateway (وقتی پیکربندی شده باشد، پیش‌فرض `gateway.remote.url` است).
- `--token <token>`: توکن احراز هویت Gateway.
- `--token-file <path>`: توکن احراز هویت Gateway را از فایل بخوانید.
- `--password <password>`: گذرواژهٔ احراز هویت Gateway.
- `--password-file <path>`: گذرواژهٔ احراز هویت Gateway را از فایل بخوانید.
- `--session <key>`: کلید نشست پیش‌فرض.
- `--session-label <label>`: برچسب نشست پیش‌فرض برای پیدا کردن.
- `--require-existing`: اگر کلید/برچسب نشست وجود نداشته باشد، ناموفق شود.
- `--reset-session`: پیش از نخستین استفاده، کلید نشست را بازنشانی کنید.
- `--no-prefix-cwd`: اعلان‌ها را با دایرکتوری کاری پیشوندگذاری نکنید.
- `--provenance <off|meta|meta+receipt>`: فراداده یا رسیدهای منشأ ACP را شامل کنید.
- `--verbose, -v`: گزارش‌دهی مفصل به خروجی خطای استاندارد.

نکتهٔ امنیتی:

- `--token` و `--password` در برخی سیستم‌ها می‌توانند در فهرست فرایندهای محلی قابل مشاهده باشند.
- `--token-file`/`--password-file` یا متغیرهای محیطی (`OPENCLAW_GATEWAY_TOKEN`، `OPENCLAW_GATEWAY_PASSWORD`) را ترجیح دهید.
- حل احراز هویت Gateway از قرارداد مشترکی پیروی می‌کند که سایر کلاینت‌های Gateway استفاده می‌کنند:
  - حالت محلی: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> بازگشت به `gateway.remote.*` فقط وقتی `gateway.auth.*` تنظیم نشده باشد (SecretRefs محلی پیکربندی‌شده اما حل‌نشده بسته و ناموفق می‌شوند)
  - حالت دوردست: `gateway.remote.*` با بازگشت env/config بر اساس قواعد تقدم دوردست
  - `--url` بازنویسی امن است و از اعتبارنامه‌های ضمنی config/env دوباره استفاده نمی‌کند؛ `--token`/`--password` صریح (یا گونه‌های فایلی) ارسال کنید
- فرایندهای فرزند پشتوانهٔ زمان اجرای ACP مقدار `OPENCLAW_SHELL=acp` را دریافت می‌کنند، که می‌تواند برای قواعد shell/profile وابسته به زمینه استفاده شود.
- `openclaw acp client` مقدار `OPENCLAW_SHELL=acp-client` را روی فرایند پل ایجادشده تنظیم می‌کند.

### گزینه‌های `acp client`

- `--cwd <dir>`: دایرکتوری کاری برای نشست ACP.
- `--server <command>`: فرمان سرور ACP (پیش‌فرض: `openclaw`).
- `--server-args <args...>`: آرگومان‌های اضافه که به سرور ACP ارسال می‌شوند.
- `--server-verbose`: گزارش‌دهی مفصل را روی سرور ACP فعال کنید.
- `--verbose, -v`: گزارش‌دهی مفصل کلاینت.

## مرتبط

- [مرجع CLI](/fa/cli)
- [عامل‌های ACP](/fa/tools/acp-agents)
