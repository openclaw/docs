---
read_when:
    - اتصال Codex، Claude Code یا یک کلاینت MCP دیگر به کانال‌های مبتنی بر OpenClaw
    - در حال اجرای `openclaw mcp serve`
    - مدیریت تعریف‌های سرور MCP ذخیره‌شده در OpenClaw
sidebarTitle: MCP
summary: گفت‌وگوهای کانال OpenClaw را از طریق MCP ارائه کنید و تعاریف ذخیره‌شدهٔ سرور MCP را مدیریت کنید
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:41:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` دو وظیفه دارد:

- اجرای OpenClaw به‌عنوان سرور MCP با `openclaw mcp serve`
- مدیریت تعریف‌های سرورهای MCP خروجیِ متعلق به OpenClaw با `list`، `show`، `set` و `unset`

به بیان دیگر:

- `serve` یعنی OpenClaw به‌عنوان سرور MCP عمل می‌کند
- `list` / `show` / `set` / `unset` یعنی OpenClaw به‌عنوان رجیستری سمت کلاینت MCP برای سرورهای MCP دیگری عمل می‌کند که runtimeهای آن ممکن است بعدا مصرف کنند

از [`openclaw acp`](/fa/cli/acp) زمانی استفاده کنید که OpenClaw باید خودش یک نشست harness کدنویسی را میزبانی کند و آن runtime را از طریق ACP مسیریابی کند.

## OpenClaw به‌عنوان سرور MCP

این مسیر `openclaw mcp serve` است.

### چه زمانی از `serve` استفاده کنید

از `openclaw mcp serve` زمانی استفاده کنید که:

- Codex، Claude Code، یا کلاینت MCP دیگری باید مستقیما با گفت‌وگوهای کانالیِ پشتیبانی‌شده توسط OpenClaw صحبت کند
- از قبل یک OpenClaw Gateway محلی یا راه‌دور با نشست‌های مسیریابی‌شده دارید
- یک سرور MCP می‌خواهید که به‌جای اجرای bridgeهای جداگانه برای هر کانال، روی backendهای کانالی OpenClaw کار کند

به‌جای آن از [`openclaw acp`](/fa/cli/acp) زمانی استفاده کنید که OpenClaw باید خودش runtime کدنویسی را میزبانی کند و نشست agent را داخل OpenClaw نگه دارد.

### نحوه کار

`openclaw mcp serve` یک سرور MCP مبتنی بر stdio را شروع می‌کند. کلاینت MCP مالک آن فرایند است. تا زمانی که کلاینت نشست stdio را باز نگه می‌دارد، bridge از طریق WebSocket به یک OpenClaw Gateway محلی یا راه‌دور وصل می‌شود و گفت‌وگوهای کانالی مسیریابی‌شده را از طریق MCP ارائه می‌کند.

<Steps>
  <Step title="Client spawns the bridge">
    کلاینت MCP، `openclaw mcp serve` را spawn می‌کند.
  </Step>
  <Step title="Bridge connects to Gateway">
    bridge از طریق WebSocket به OpenClaw Gateway وصل می‌شود.
  </Step>
  <Step title="Sessions become MCP conversations">
    نشست‌های مسیریابی‌شده به گفت‌وگوهای MCP و ابزارهای transcript/history تبدیل می‌شوند.
  </Step>
  <Step title="Live events queue">
    تا زمانی که bridge وصل است، رویدادهای زنده در حافظه صف می‌شوند.
  </Step>
  <Step title="Optional Claude push">
    اگر حالت کانال Claude فعال باشد، همان نشست می‌تواند اعلان‌های push ویژه Claude را هم دریافت کند.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - وضعیت صف زنده زمانی شروع می‌شود که bridge وصل شود
    - تاریخچه transcript قدیمی‌تر با `messages_read` خوانده می‌شود
    - اعلان‌های push مربوط به Claude فقط تا زمانی وجود دارند که نشست MCP زنده باشد
    - وقتی کلاینت قطع می‌شود، bridge خارج می‌شود و صف زنده از بین می‌رود
    - نقطه‌های ورود یک‌باره agent مانند `openclaw agent` و `openclaw infer model run` هر runtime بسته‌بندی‌شده MCP را که باز می‌کنند، پس از کامل شدن پاسخ بازنشسته می‌کنند؛ بنابراین اجرای اسکریپتی تکراری باعث انباشت فرایندهای فرزند stdio MCP نمی‌شود
    - سرورهای stdio MCP که توسط OpenClaw راه‌اندازی می‌شوند، چه بسته‌بندی‌شده و چه پیکربندی‌شده توسط کاربر، هنگام shutdown به‌صورت یک درخت فرایندی جمع‌آوری می‌شوند؛ بنابراین زیرفرایندهایی که سرور شروع کرده است پس از خروج کلاینت stdio والد باقی نمی‌مانند
    - حذف یا reset کردن یک نشست، کلاینت‌های MCP آن نشست را از طریق مسیر پاک‌سازی مشترک runtime dispose می‌کند؛ بنابراین اتصال‌های stdio باقی‌مانده مرتبط با نشست حذف‌شده وجود نخواهد داشت

  </Accordion>
</AccordionGroup>

### انتخاب حالت کلاینت

از همان bridge به دو روش متفاوت استفاده کنید:

<Tabs>
  <Tab title="Generic MCP clients">
    فقط ابزارهای استاندارد MCP. از `conversations_list`، `messages_read`، `events_poll`، `events_wait`، `messages_send` و ابزارهای approval استفاده کنید.
  </Tab>
  <Tab title="Claude Code">
    ابزارهای استاندارد MCP به‌همراه adapter کانال ویژه Claude. `--claude-channel-mode on` را فعال کنید یا مقدار پیش‌فرض `auto` را نگه دارید.
  </Tab>
</Tabs>

<Note>
امروز، `auto` همانند `on` رفتار می‌کند. هنوز تشخیص قابلیت کلاینت وجود ندارد.
</Note>

### آنچه `serve` ارائه می‌کند

bridge از metadata مسیر نشست موجود در Gateway استفاده می‌کند تا گفت‌وگوهای پشتیبانی‌شده توسط کانال را ارائه کند. یک گفت‌وگو زمانی ظاهر می‌شود که OpenClaw از قبل وضعیت نشستی با مسیر شناخته‌شده داشته باشد، مانند:

- `channel`
- metadata گیرنده یا مقصد
- `accountId` اختیاری
- `threadId` اختیاری

این به کلاینت‌های MCP یک محل واحد می‌دهد تا:

- گفت‌وگوهای مسیریابی‌شده اخیر را فهرست کنند
- تاریخچه transcript اخیر را بخوانند
- منتظر رویدادهای ورودی جدید بمانند
- از طریق همان مسیر پاسخ بفرستند
- درخواست‌های approval را که هنگام اتصال bridge می‌رسند ببینند

### استفاده

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ابزارهای bridge

bridge فعلی این ابزارهای MCP را ارائه می‌کند:

<AccordionGroup>
  <Accordion title="conversations_list">
    گفت‌وگوهای اخیر مبتنی بر نشست را که از قبل در وضعیت نشست Gateway دارای metadata مسیر هستند فهرست می‌کند.

    فیلترهای مفید:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    با استفاده از lookup مستقیم نشست Gateway، یک گفت‌وگو را بر اساس `session_key` برمی‌گرداند.
  </Accordion>
  <Accordion title="messages_read">
    پیام‌های transcript اخیر را برای یک گفت‌وگوی مبتنی بر نشست می‌خواند.
  </Accordion>
  <Accordion title="attachments_fetch">
    بلوک‌های محتوای غیرمتنی پیام را از یک پیام transcript استخراج می‌کند. این یک نمای metadata روی محتوای transcript است، نه یک blob store پیوست پایدار و مستقل.
  </Accordion>
  <Accordion title="events_poll">
    رویدادهای زنده صف‌شده از زمان یک cursor عددی را می‌خواند.
  </Accordion>
  <Accordion title="events_wait">
    تا رسیدن رویداد صف‌شده بعدیِ مطابق یا پایان timeout، long-poll می‌کند.

    وقتی یک کلاینت MCP عمومی به تحویل تقریبا بلادرنگ بدون پروتکل push ویژه Claude نیاز دارد، از این استفاده کنید.

  </Accordion>
  <Accordion title="messages_send">
    متن را از طریق همان مسیری که از قبل روی نشست ثبت شده است ارسال می‌کند.

    رفتار فعلی:

    - به یک مسیر گفت‌وگوی موجود نیاز دارد
    - از کانال، گیرنده، account id و thread id نشست استفاده می‌کند
    - فقط متن می‌فرستد

  </Accordion>
  <Accordion title="permissions_list_open">
    درخواست‌های approval معلق exec/Plugin را که bridge از زمان اتصال به Gateway مشاهده کرده است فهرست می‌کند.
  </Accordion>
  <Accordion title="permissions_respond">
    یک درخواست approval معلق exec/Plugin را با یکی از این موارد حل می‌کند:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### مدل رویداد

bridge تا زمانی که وصل است یک صف رویداد درون‌حافظه‌ای نگه می‌دارد.

انواع رویداد فعلی:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- صف فقط زنده است؛ وقتی bridge MCP شروع می‌شود آغاز می‌شود
- `events_poll` و `events_wait` به‌تنهایی تاریخچه قدیمی‌تر Gateway را بازپخش نمی‌کنند
- backlog پایدار باید با `messages_read` خوانده شود

</Warning>

### اعلان‌های کانال Claude

bridge همچنین می‌تواند اعلان‌های کانال ویژه Claude را ارائه کند. این معادل OpenClaw برای adapter کانال Claude Code است: ابزارهای استاندارد MCP همچنان در دسترس می‌مانند، اما پیام‌های ورودی زنده همچنین می‌توانند به‌صورت اعلان‌های MCP ویژه Claude برسند.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: فقط ابزارهای استاندارد MCP.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: اعلان‌های کانال Claude را فعال می‌کند.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: پیش‌فرض فعلی؛ همان رفتار bridge مثل `on`.
  </Tab>
</Tabs>

وقتی حالت کانال Claude فعال باشد، سرور قابلیت‌های آزمایشی Claude را advertise می‌کند و می‌تواند این موارد را emit کند:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

رفتار فعلی bridge:

- پیام‌های transcript ورودی `user` به‌صورت `notifications/claude/channel` forward می‌شوند
- درخواست‌های permission مربوط به Claude که از طریق MCP دریافت می‌شوند، در حافظه track می‌شوند
- اگر گفت‌وگوی لینک‌شده بعدا `yes abcde` یا `no abcde` بفرستد، bridge آن را به `notifications/claude/channel/permission` تبدیل می‌کند
- این اعلان‌ها فقط برای نشست زنده هستند؛ اگر کلاینت MCP قطع شود، هدف push وجود ندارد

این رفتار عمدا ویژه کلاینت است. کلاینت‌های MCP عمومی باید به ابزارهای polling استاندارد تکیه کنند.

### پیکربندی کلاینت MCP

نمونه پیکربندی کلاینت stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

برای بیشتر کلاینت‌های MCP عمومی، با سطح ابزار استاندارد شروع کنید و حالت Claude را نادیده بگیرید. حالت Claude را فقط برای کلاینت‌هایی روشن کنید که واقعا methodهای اعلان ویژه Claude را می‌فهمند.

### گزینه‌ها

`openclaw mcp serve` این موارد را پشتیبانی می‌کند:

<ParamField path="--url" type="string">
  URL مربوط به WebSocket در Gateway.
</ParamField>
<ParamField path="--token" type="string">
  token مربوط به Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  token را از فایل می‌خواند.
</ParamField>
<ParamField path="--password" type="string">
  password مربوط به Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  password را از فایل می‌خواند.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  حالت اعلان Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  لاگ‌های مفصل روی stderr.
</ParamField>

<Tip>
در صورت امکان، `--token-file` یا `--password-file` را به secretهای inline ترجیح دهید.
</Tip>

### امنیت و مرز اعتماد

bridge مسیریابی اختراع نمی‌کند. فقط گفت‌وگوهایی را ارائه می‌کند که Gateway از قبل می‌داند چگونه مسیریابی کند.

یعنی:

- allowlistهای فرستنده، pairing و اعتماد در سطح کانال همچنان متعلق به پیکربندی کانال OpenClaw زیرین هستند
- `messages_send` فقط می‌تواند از طریق یک مسیر ذخیره‌شده موجود پاسخ دهد
- وضعیت approval فقط برای نشست فعلی bridge، زنده/درون‌حافظه‌ای است
- احراز هویت bridge باید از همان کنترل‌های token یا password مربوط به Gateway استفاده کند که برای هر کلاینت راه‌دور دیگر Gateway به آن اعتماد می‌کنید

اگر گفت‌وگویی در `conversations_list` نیست، علت معمول پیکربندی MCP نیست. علت، metadata مسیر ناقص یا موجود نبودن آن در نشست Gateway زیرین است.

### آزمون

OpenClaw برای این bridge یک smoke قطعی Docker ارائه می‌کند:

```bash
pnpm test:docker:mcp-channels
```

آن smoke:

- یک container seeded Gateway را شروع می‌کند
- container دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند
- کشف گفت‌وگو، خواندن transcript، خواندن metadata پیوست، رفتار صف رویداد زنده و مسیریابی ارسال خروجی را verify می‌کند
- اعلان‌های کانال و permission به سبک Claude را روی bridge واقعی stdio MCP اعتبارسنجی می‌کند

این سریع‌ترین راه برای اثبات کارکرد bridge بدون اتصال یک حساب واقعی Telegram، Discord یا iMessage به اجرای آزمون است.

برای زمینه گسترده‌تر آزمون، [Testing](/fa/help/testing) را ببینید.

### عیب‌یابی

<AccordionGroup>
  <Accordion title="No conversations returned">
    معمولا یعنی نشست Gateway از قبل قابل مسیریابی نیست. تایید کنید که نشست زیرین دارای metadata مسیر ذخیره‌شده برای کانال/provider، گیرنده و account/thread اختیاری باشد.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    مورد انتظار است. صف زنده زمانی شروع می‌شود که bridge وصل شود. تاریخچه transcript قدیمی‌تر را با `messages_read` بخوانید.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    همه این موارد را بررسی کنید:

    - کلاینت نشست stdio MCP را باز نگه داشته باشد
    - `--claude-channel-mode` برابر `on` یا `auto` باشد
    - کلاینت واقعا methodهای اعلان ویژه Claude را بفهمد
    - پیام ورودی پس از اتصال bridge رخ داده باشد

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` فقط درخواست‌های approval را نشان می‌دهد که هنگام اتصال bridge مشاهده شده‌اند. این یک API تاریخچه approval پایدار نیست.
  </Accordion>
</AccordionGroup>

## OpenClaw به‌عنوان رجیستری کلاینت MCP

این مسیر `openclaw mcp list`، `show`، `set` و `unset` است.

این فرمان‌ها OpenClaw را از طریق MCP در معرض دسترسی قرار نمی‌دهند. آن‌ها تعاریف سرور MCP متعلق به OpenClaw را زیر `mcp.servers` در پیکربندی OpenClaw مدیریت می‌کنند.

آن تعاریف ذخیره‌شده برای runtimeهایی هستند که OpenClaw بعداً راه‌اندازی یا پیکربندی می‌کند، مانند Pi تعبیه‌شده و دیگر adapterهای runtime. OpenClaw تعاریف را به‌صورت مرکزی ذخیره می‌کند تا آن runtimeها نیازی به نگهداری فهرست‌های تکراری جداگانه از سرورهای MCP نداشته باشند.

<AccordionGroup>
  <Accordion title="Important behavior">
    - این فرمان‌ها فقط پیکربندی OpenClaw را می‌خوانند یا می‌نویسند
    - آن‌ها به سرور MCP مقصد وصل نمی‌شوند
    - آن‌ها اعتبارسنجی نمی‌کنند که فرمان، URL یا انتقال راه‌دور همین حالا در دسترس است یا نه
    - adapterهای runtime در زمان اجرا تصمیم می‌گیرند که واقعاً از کدام شکل‌های انتقال پشتیبانی کنند
    - Pi تعبیه‌شده ابزارهای MCP پیکربندی‌شده را در پروفایل‌های ابزار عادی `coding` و `messaging` در معرض دسترس قرار می‌دهد؛ `minimal` همچنان آن‌ها را پنهان می‌کند، و `tools.deny: ["bundle-mcp"]` آن‌ها را صریحاً غیرفعال می‌کند
    - runtimeهای MCP بسته‌بندی‌شده با محدوده نشست، پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری جمع‌آوری می‌شوند (پیش‌فرض ۱۰ دقیقه؛ برای غیرفعال کردن `0` را تنظیم کنید) و اجراهای یک‌مرحله‌ای تعبیه‌شده در پایان اجرا آن‌ها را پاک‌سازی می‌کنند

  </Accordion>
</AccordionGroup>

adapterهای runtime ممکن است این registry مشترک را به شکلی عادی‌سازی کنند که client پایین‌دستی آن‌ها انتظار دارد. برای مثال، Pi تعبیه‌شده مقادیر `transport` در OpenClaw را مستقیماً مصرف می‌کند، درحالی‌که Claude Code و Gemini مقادیر `type` بومی CLI مانند `http`، `sse` یا `stdio` را دریافت می‌کنند.

### تعاریف ذخیره‌شده سرور MCP

OpenClaw همچنین یک registry سبک‌وزن سرور MCP را در پیکربندی برای سطح‌هایی ذخیره می‌کند که تعاریف MCP مدیریت‌شده توسط OpenClaw را می‌خواهند.

فرمان‌ها:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

نکته‌ها:

- `list` نام سرورها را مرتب می‌کند.
- `show` بدون نام، کل شیء پیکربندی‌شده سرور MCP را چاپ می‌کند.
- `set` یک مقدار شیء JSON را در خط فرمان انتظار دارد.
- برای سرورهای Streamable HTTP MCP از `transport: "streamable-http"` استفاده کنید. `openclaw mcp set` همچنین برای سازگاری، `type: "http"` بومی CLI را به همان شکل پیکربندی canonical عادی‌سازی می‌کند.
- `unset` اگر سرور نام‌برده وجود نداشته باشد شکست می‌خورد.

نمونه‌ها:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

نمونه شکل پیکربندی:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### انتقال Stdio

یک فرایند فرزند محلی را راه‌اندازی می‌کند و از طریق stdin/stdout ارتباط برقرار می‌کند.

| فیلد                       | توضیح                               |
| -------------------------- | ----------------------------------- |
| `command`                  | فایل اجرایی برای ایجاد فرایند (الزامی) |
| `args`                     | آرایه‌ای از آرگومان‌های خط فرمان    |
| `env`                      | متغیرهای محیطی اضافه               |
| `cwd` / `workingDirectory` | دایرکتوری کاری برای فرایند          |

<Warning>
**فیلتر ایمنی env در Stdio**

OpenClaw کلیدهای env مربوط به شروع interpreter را که می‌توانند نحوه شروع یک سرور stdio MCP را پیش از نخستین RPC تغییر دهند رد می‌کند، حتی اگر در بلوک `env` یک سرور ظاهر شوند. کلیدهای مسدودشده شامل `NODE_OPTIONS`، `PYTHONSTARTUP`، `PYTHONPATH`، `PERL5OPT`، `RUBYOPT`، `SHELLOPTS`، `PS4` و متغیرهای مشابه کنترل runtime هستند. startup این موارد را با خطای پیکربندی رد می‌کند تا نتوانند یک مقدمه ضمنی تزریق کنند، interpreter را عوض کنند، یا debugger را روی فرایند stdio فعال کنند. متغیرهای معمول اعتبارنامه، proxy و env اختصاصی سرور (`GITHUB_TOKEN`، `HTTP_PROXY`، `*_API_KEY` سفارشی و غیره) تحت تأثیر قرار نمی‌گیرند.

اگر سرور MCP شما واقعاً به یکی از متغیرهای مسدودشده نیاز دارد، آن را به‌جای قرار دادن زیر `env` سرور stdio، روی فرایند میزبان Gateway تنظیم کنید.
</Warning>

### انتقال SSE / HTTP

از طریق HTTP Server-Sent Events به یک سرور MCP راه‌دور وصل می‌شود.

| فیلد                  | توضیح                                                            |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL نوع HTTP یا HTTPS سرور راه‌دور (الزامی)                      |
| `headers`             | نگاشت key-value اختیاری از headerهای HTTP (برای مثال tokenهای auth) |
| `connectionTimeoutMs` | timeout اتصال به‌ازای هر سرور بر حسب ms (اختیاری)               |

نمونه:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

مقادیر حساس در `url` (userinfo) و `headers` در logها و خروجی وضعیت redacted می‌شوند.

### انتقال Streamable HTTP

`streamable-http` یک گزینه انتقال اضافی در کنار `sse` و `stdio` است. از streaming HTTP برای ارتباط دوطرفه با سرورهای MCP راه‌دور استفاده می‌کند.

| فیلد                  | توضیح                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL نوع HTTP یا HTTPS سرور راه‌دور (الزامی)                                            |
| `transport`           | برای انتخاب این انتقال روی `"streamable-http"` تنظیم کنید؛ وقتی حذف شود، OpenClaw از `sse` استفاده می‌کند |
| `headers`             | نگاشت key-value اختیاری از headerهای HTTP (برای مثال tokenهای auth)                    |
| `connectionTimeoutMs` | timeout اتصال به‌ازای هر سرور بر حسب ms (اختیاری)                                     |

پیکربندی OpenClaw از `transport: "streamable-http"` به‌عنوان املای canonical استفاده می‌کند. مقادیر `type: "http"` بومی CLI هنگام ذخیره از طریق `openclaw mcp set` پذیرفته می‌شوند و در پیکربندی موجود توسط `openclaw doctor --fix` ترمیم می‌شوند، اما `transport` چیزی است که Pi تعبیه‌شده مستقیماً مصرف می‌کند.

نمونه:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
این فرمان‌ها فقط پیکربندی ذخیره‌شده را مدیریت می‌کنند. آن‌ها پل channel را شروع نمی‌کنند، نشست client زنده MCP باز نمی‌کنند، یا ثابت نمی‌کنند که سرور مقصد در دسترس است.
</Note>

## محدودیت‌های فعلی

این صفحه bridge را همان‌طور که امروز منتشر شده مستند می‌کند.

محدودیت‌های فعلی:

- کشف گفت‌وگو به metadata مسیر نشست Gateway موجود وابسته است
- هیچ پروتکل push عمومی فراتر از adapter اختصاصی Claude وجود ندارد
- هنوز ابزاری برای ویرایش پیام یا واکنش وجود ندارد
- انتقال HTTP/SSE/streamable-http به یک سرور راه‌دور واحد وصل می‌شود؛ هنوز upstream چندگانه وجود ندارد
- `permissions_list_open` فقط approvalهایی را شامل می‌شود که هنگام اتصال bridge مشاهده شده‌اند

## مرتبط

- [مرجع CLI](/fa/cli)
- [Pluginها](/fa/cli/plugins)
