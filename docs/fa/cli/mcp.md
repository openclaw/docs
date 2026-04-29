---
read_when:
    - اتصال Codex، Claude Code یا یک کلاینت MCP دیگر به کانال‌های مبتنی بر OpenClaw
    - در حال اجرا `openclaw mcp serve`
    - مدیریت تعریف‌های سرور MCP ذخیره‌شده توسط OpenClaw
sidebarTitle: MCP
summary: گفت‌وگوهای کانال OpenClaw را از طریق MCP در دسترس قرار دهید و تعریف‌های ذخیره‌شدهٔ سرور MCP را مدیریت کنید
title: MCP
x-i18n:
    generated_at: "2026-04-29T22:36:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` دو وظیفه دارد:

- اجرای OpenClaw به‌عنوان یک سرور MCP با `openclaw mcp serve`
- مدیریت تعریف‌های سرور MCP خروجیِ متعلق به OpenClaw با `list`، `show`، `set` و `unset`

به بیان دیگر:

- `serve` یعنی OpenClaw در نقش یک سرور MCP عمل می‌کند
- `list` / `show` / `set` / `unset` یعنی OpenClaw در نقش یک رجیستری سمت کلاینت MCP برای سرورهای MCP دیگری عمل می‌کند که runtimeهای آن ممکن است بعدا مصرف کنند

وقتی OpenClaw باید خودش یک نشست هارنس کدنویسی را میزبانی کند و آن runtime را از طریق ACP مسیریابی کند، از [`openclaw acp`](/fa/cli/acp) استفاده کنید.

## OpenClaw به‌عنوان یک سرور MCP

این مسیر `openclaw mcp serve` است.

### چه زمانی از `serve` استفاده کنید

از `openclaw mcp serve` زمانی استفاده کنید که:

- Codex، Claude Code، یا یک کلاینت MCP دیگر باید مستقیما با گفتگوهای کانالیِ پشتیبانی‌شده توسط OpenClaw صحبت کند
- از قبل یک Gateway محلی یا راه‌دور OpenClaw با نشست‌های مسیریابی‌شده دارید
- یک سرور MCP می‌خواهید که به‌جای اجرای پل‌های جداگانه برای هر کانال، در همه بک‌اندهای کانالی OpenClaw کار کند

وقتی OpenClaw باید خودش runtime کدنویسی را میزبانی کند و نشست عامل را داخل OpenClaw نگه دارد، به‌جای آن از [`openclaw acp`](/fa/cli/acp) استفاده کنید.

### نحوه کار

`openclaw mcp serve` یک سرور stdio MCP را شروع می‌کند. کلاینت MCP مالک آن فرایند است. تا وقتی کلاینت نشست stdio را باز نگه دارد، پل از طریق WebSocket به یک Gateway محلی یا راه‌دور OpenClaw متصل می‌شود و گفتگوهای کانالی مسیریابی‌شده را از طریق MCP در دسترس قرار می‌دهد.

<Steps>
  <Step title="Client spawns the bridge">
    کلاینت MCP، `openclaw mcp serve` را spawn می‌کند.
  </Step>
  <Step title="Bridge connects to Gateway">
    پل از طریق WebSocket به Gateway OpenClaw متصل می‌شود.
  </Step>
  <Step title="Sessions become MCP conversations">
    نشست‌های مسیریابی‌شده به گفتگوهای MCP و ابزارهای رونوشت/تاریخچه تبدیل می‌شوند.
  </Step>
  <Step title="Live events queue">
    رویدادهای زنده تا زمانی که پل متصل است در حافظه صف می‌شوند.
  </Step>
  <Step title="Optional Claude push">
    اگر حالت کانال Claude فعال باشد، همان نشست می‌تواند اعلان‌های push ویژه Claude را نیز دریافت کند.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - وضعیت صف زنده وقتی پل متصل می‌شود شروع می‌شود
    - تاریخچه رونوشت قدیمی‌تر با `messages_read` خوانده می‌شود
    - اعلان‌های push مربوط به Claude فقط تا زمانی وجود دارند که نشست MCP زنده است
    - وقتی کلاینت قطع شود، پل خارج می‌شود و صف زنده از بین می‌رود
    - نقطه‌های ورود یک‌باره عامل مانند `openclaw agent` و `openclaw infer model run` هر runtime MCP همراهی را که باز می‌کنند پس از تکمیل پاسخ بازنشسته می‌کنند، بنابراین اجراهای اسکریپتی تکراری فرایندهای فرزند stdio MCP را انباشته نمی‌کنند
    - سرورهای stdio MCP که توسط OpenClaw راه‌اندازی می‌شوند، چه همراه و چه پیکربندی‌شده توسط کاربر، هنگام خاموشی به‌صورت یک درخت فرایند از بین برده می‌شوند، بنابراین زیرفرایندهای فرزندی که سرور شروع کرده است پس از خروج کلاینت stdio والد باقی نمی‌مانند
    - حذف یا بازنشانی یک نشست، کلاینت‌های MCP آن نشست را از طریق مسیر پاک‌سازی runtime مشترک dispose می‌کند، بنابراین هیچ اتصال stdio ماندگاری وابسته به یک نشست حذف‌شده باقی نمی‌ماند

  </Accordion>
</AccordionGroup>

### انتخاب حالت کلاینت

از همان پل به دو روش متفاوت استفاده کنید:

<Tabs>
  <Tab title="Generic MCP clients">
    فقط ابزارهای استاندارد MCP. از `conversations_list`، `messages_read`، `events_poll`، `events_wait`، `messages_send` و ابزارهای تأیید استفاده کنید.
  </Tab>
  <Tab title="Claude Code">
    ابزارهای استاندارد MCP به‌همراه adapter کانال ویژه Claude. `--claude-channel-mode on` را فعال کنید یا مقدار پیش‌فرض `auto` را باقی بگذارید.
  </Tab>
</Tabs>

<Note>
امروز، `auto` همانند `on` رفتار می‌کند. هنوز تشخیص قابلیت کلاینت وجود ندارد.
</Note>

### آنچه `serve` در دسترس قرار می‌دهد

پل از متادیتای مسیر نشست Gateway موجود استفاده می‌کند تا گفتگوهای پشتیبانی‌شده توسط کانال را در دسترس قرار دهد. یک گفتگو زمانی ظاهر می‌شود که OpenClaw از قبل وضعیت نشست را با یک مسیر شناخته‌شده داشته باشد، مانند:

- `channel`
- متادیتای گیرنده یا مقصد
- `accountId` اختیاری
- `threadId` اختیاری

این به کلاینت‌های MCP یک جای واحد می‌دهد تا:

- گفتگوهای مسیریابی‌شده اخیر را فهرست کنند
- تاریخچه رونوشت اخیر را بخوانند
- برای رویدادهای ورودی جدید منتظر بمانند
- از طریق همان مسیر پاسخی ارسال کنند
- درخواست‌های تأییدی را که هنگام اتصال پل می‌رسند ببینند

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

### ابزارهای پل

پل فعلی این ابزارهای MCP را در دسترس قرار می‌دهد:

<AccordionGroup>
  <Accordion title="conversations_list">
    گفتگوهای اخیرِ پشتیبانی‌شده توسط نشست را فهرست می‌کند که از قبل در وضعیت نشست Gateway متادیتای مسیر دارند.

    فیلترهای مفید:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    یک گفتگو را بر اساس `session_key` برمی‌گرداند.
  </Accordion>
  <Accordion title="messages_read">
    پیام‌های رونوشت اخیر را برای یک گفتگوی پشتیبانی‌شده توسط نشست می‌خواند.
  </Accordion>
  <Accordion title="attachments_fetch">
    بلوک‌های محتوای غیرمتنی پیام را از یک پیام رونوشت استخراج می‌کند. این یک نمای متادیتا روی محتوای رونوشت است، نه یک مخزن blob پیوست بادوام و مستقل.
  </Accordion>
  <Accordion title="events_poll">
    رویدادهای زنده صف‌شده از زمان یک مکان‌نمای عددی را می‌خواند.
  </Accordion>
  <Accordion title="events_wait">
    تا رسیدن رویداد صف‌شده بعدیِ منطبق یا پایان timeout، long-poll می‌کند.

    وقتی یک کلاینت عمومی MCP به تحویل تقریبا هم‌زمان بدون پروتکل push ویژه Claude نیاز دارد، از این استفاده کنید.

  </Accordion>
  <Accordion title="messages_send">
    متن را از طریق همان مسیری که از قبل روی نشست ثبت شده است ارسال می‌کند.

    رفتار فعلی:

    - به یک مسیر گفتگوی موجود نیاز دارد
    - از کانال، گیرنده، شناسه حساب و شناسه thread نشست استفاده می‌کند
    - فقط متن ارسال می‌کند

  </Accordion>
  <Accordion title="permissions_list_open">
    درخواست‌های تأیید در انتظار exec/Plugin را که پل از زمان اتصال به Gateway مشاهده کرده است فهرست می‌کند.
  </Accordion>
  <Accordion title="permissions_respond">
    یک درخواست تأیید در انتظار exec/Plugin را با یکی از این‌ها حل می‌کند:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### مدل رویداد

پل تا زمانی که متصل است یک صف رویداد درون‌حافظه‌ای نگه می‌دارد.

انواع رویداد فعلی:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- صف فقط زنده است؛ وقتی پل MCP شروع می‌شود آغاز می‌شود
- `events_poll` و `events_wait` به‌تنهایی تاریخچه قدیمی‌تر Gateway را بازپخش نمی‌کنند
- backlog بادوام باید با `messages_read` خوانده شود

</Warning>

### اعلان‌های کانال Claude

پل همچنین می‌تواند اعلان‌های کانال ویژه Claude را در دسترس قرار دهد. این معادل OpenClaw برای یک adapter کانال Claude Code است: ابزارهای استاندارد MCP همچنان در دسترس می‌مانند، اما پیام‌های ورودی زنده نیز می‌توانند به‌صورت اعلان‌های MCP ویژه Claude برسند.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: فقط ابزارهای استاندارد MCP.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: اعلان‌های کانال Claude را فعال کنید.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: پیش‌فرض فعلی؛ همان رفتار پل مانند `on`.
  </Tab>
</Tabs>

وقتی حالت کانال Claude فعال باشد، سرور قابلیت‌های آزمایشی Claude را advertise می‌کند و می‌تواند این‌ها را emit کند:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

رفتار فعلی پل:

- پیام‌های رونوشت ورودی `user` به‌صورت `notifications/claude/channel` forward می‌شوند
- درخواست‌های permission مربوط به Claude که از طریق MCP دریافت می‌شوند در حافظه ردیابی می‌شوند
- اگر گفتگوی لینک‌شده بعدا `yes abcde` یا `no abcde` ارسال کند، پل آن را به `notifications/claude/channel/permission` تبدیل می‌کند
- این اعلان‌ها فقط مربوط به نشست زنده هستند؛ اگر کلاینت MCP قطع شود، هدف push وجود ندارد

این عمدا ویژه کلاینت است. کلاینت‌های عمومی MCP باید به ابزارهای استاندارد polling تکیه کنند.

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

برای بیشتر کلاینت‌های عمومی MCP، با سطح ابزار استاندارد شروع کنید و حالت Claude را نادیده بگیرید. حالت Claude را فقط برای کلاینت‌هایی روشن کنید که واقعا متدهای اعلان ویژه Claude را می‌فهمند.

### گزینه‌ها

`openclaw mcp serve` از این‌ها پشتیبانی می‌کند:

<ParamField path="--url" type="string">
  URL WebSocket مربوط به Gateway.
</ParamField>
<ParamField path="--token" type="string">
  توکن Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  توکن را از فایل بخوانید.
</ParamField>
<ParamField path="--password" type="string">
  گذرواژه Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  گذرواژه را از فایل بخوانید.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  حالت اعلان Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  لاگ‌های پرجزئیات روی stderr.
</ParamField>

<Tip>
در صورت امکان، `--token-file` یا `--password-file` را به secretهای inline ترجیح دهید.
</Tip>

### امنیت و مرز اعتماد

پل مسیریابی را ابداع نمی‌کند. فقط گفتگوهایی را در دسترس قرار می‌دهد که Gateway از قبل می‌داند چگونه مسیریابی کند.

یعنی:

- allowlistهای فرستنده، pairing، و اعتماد در سطح کانال همچنان به پیکربندی کانال OpenClaw زیرین تعلق دارند
- `messages_send` فقط می‌تواند از طریق یک مسیر ذخیره‌شده موجود پاسخ دهد
- وضعیت تأیید فقط برای نشست فعلی پل زنده/درون‌حافظه‌ای است
- احراز هویت پل باید از همان کنترل‌های توکن یا گذرواژه Gateway استفاده کند که برای هر کلاینت Gateway راه‌دور دیگری به آن اعتماد می‌کنید

اگر گفتگویی در `conversations_list` نیست، علت معمول پیکربندی MCP نیست. علت، نبودن یا ناقص بودن متادیتای مسیر در نشست Gateway زیرین است.

### تست

OpenClaw یک smoke قطعی Docker برای این پل ارائه می‌کند:

```bash
pnpm test:docker:mcp-channels
```

آن smoke:

- یک کانتینر Gateway seeded را شروع می‌کند
- یک کانتینر دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند
- کشف گفتگو، خواندن رونوشت، خواندن متادیتای پیوست، رفتار صف رویداد زنده و مسیریابی ارسال خروجی را راستی‌آزمایی می‌کند
- اعلان‌های کانال و permission به سبک Claude را از طریق پل واقعی stdio MCP اعتبارسنجی می‌کند

این سریع‌ترین راه برای اثبات کار کردن پل بدون سیم‌کشی یک حساب واقعی Telegram، Discord یا iMessage به اجرای تست است.

برای زمینه گسترده‌تر تست، [تست](/fa/help/testing) را ببینید.

### عیب‌یابی

<AccordionGroup>
  <Accordion title="No conversations returned">
    معمولا یعنی نشست Gateway از قبل قابل مسیریابی نیست. تأیید کنید که نشست زیرین، متادیتای route کانال/provider، گیرنده، و حساب/thread اختیاری را ذخیره کرده است.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    مورد انتظار است. صف زنده وقتی پل متصل می‌شود شروع می‌شود. تاریخچه رونوشت قدیمی‌تر را با `messages_read` بخوانید.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    همه این موارد را بررسی کنید:

    - کلاینت، نشست stdio MCP را باز نگه داشته است
    - `--claude-channel-mode` برابر `on` یا `auto` است
    - کلاینت واقعا متدهای اعلان ویژه Claude را می‌فهمد
    - پیام ورودی پس از اتصال پل رخ داده است

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` فقط درخواست‌های تأییدی را نشان می‌دهد که هنگام اتصال پل مشاهده شده‌اند. این یک API تاریخچه تأیید بادوام نیست.
  </Accordion>
</AccordionGroup>

## OpenClaw به‌عنوان رجیستری کلاینت MCP

این مسیر `openclaw mcp list`، `show`، `set` و `unset` است.

این فرمان‌ها OpenClaw را از طریق MCP در معرض دسترسی قرار نمی‌دهند. آن‌ها تعریف‌های سرور MCP متعلق به OpenClaw را زیر `mcp.servers` در پیکربندی OpenClaw مدیریت می‌کنند.

این تعریف‌های ذخیره‌شده برای زمان‌اجراهایی هستند که OpenClaw بعدا راه‌اندازی یا پیکربندی می‌کند، مانند Pi تعبیه‌شده و دیگر آداپتورهای زمان اجرا. OpenClaw تعریف‌ها را به‌صورت مرکزی ذخیره می‌کند تا آن زمان‌اجراها نیازی نداشته باشند فهرست‌های تکراری سرور MCP خودشان را نگه دارند.

<AccordionGroup>
  <Accordion title="رفتار مهم">
    - این فرمان‌ها فقط پیکربندی OpenClaw را می‌خوانند یا می‌نویسند
    - به سرور MCP مقصد وصل نمی‌شوند
    - بررسی نمی‌کنند که فرمان، URL یا ترابرد راه‌دور در همین لحظه در دسترس باشد
    - آداپتورهای زمان اجرا در زمان اجرا تصمیم می‌گیرند که واقعا از کدام شکل‌های ترابرد پشتیبانی کنند
    - Pi تعبیه‌شده ابزارهای MCP پیکربندی‌شده را در پروفایل‌های عادی ابزار `coding` و `messaging` ارائه می‌کند؛ `minimal` همچنان آن‌ها را پنهان می‌کند، و `tools.deny: ["bundle-mcp"]` آن‌ها را صراحتا غیرفعال می‌کند
    - زمان‌اجراهای MCP بسته‌بندی‌شده با محدوده نشست، پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری پاک‌سازی می‌شوند (پیش‌فرض ۱۰ دقیقه؛ برای غیرفعال‌کردن روی `0` تنظیم کنید) و اجراهای یک‌باره تعبیه‌شده آن‌ها را در پایان اجرا پاک‌سازی می‌کنند

  </Accordion>
</AccordionGroup>

آداپتورهای زمان اجرا ممکن است این رجیستری مشترک را به شکلی نرمال‌سازی کنند که کلاینت پایین‌دستی آن‌ها انتظار دارد. برای مثال، Pi تعبیه‌شده مقادیر `transport` در OpenClaw را مستقیما مصرف می‌کند، در حالی که Claude Code و Gemini مقادیر `type` بومی CLI مانند `http`، `sse` یا `stdio` را دریافت می‌کنند.

### تعریف‌های ذخیره‌شده سرور MCP

OpenClaw همچنین یک رجیستری سبک سرور MCP را در پیکربندی ذخیره می‌کند برای سطح‌هایی که تعریف‌های MCP مدیریت‌شده توسط OpenClaw را می‌خواهند.

فرمان‌ها:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

نکته‌ها:

- `list` نام‌های سرور را مرتب می‌کند.
- `show` بدون نام، شیء کامل سرور MCP پیکربندی‌شده را چاپ می‌کند.
- `set` انتظار دارد یک مقدار شیء JSON روی خط فرمان دریافت کند.
- برای سرورهای Streamable HTTP MCP از `transport: "streamable-http"` استفاده کنید. `openclaw mcp set` همچنین برای سازگاری، `type: "http"` بومی CLI را به همان شکل پیکربندی کانونی نرمال‌سازی می‌کند.
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

### ترابرد Stdio

یک فرایند فرزند محلی را راه‌اندازی می‌کند و از طریق stdin/stdout ارتباط برقرار می‌کند.

| فیلد                      | توضیح                       |
| -------------------------- | --------------------------------- |
| `command`                  | فایل اجرایی برای ایجاد فرایند (الزامی)    |
| `args`                     | آرایه‌ای از آرگومان‌های خط فرمان   |
| `env`                      | متغیرهای محیطی اضافی       |
| `cwd` / `workingDirectory` | دایرکتوری کاری برای فرایند |

<Warning>
**فیلتر ایمنی env برای Stdio**

OpenClaw کلیدهای env مربوط به شروع مفسر را که می‌توانند نحوه شروع یک سرور stdio MCP را پیش از نخستین RPC تغییر دهند رد می‌کند، حتی اگر در بلوک `env` یک سرور ظاهر شوند. کلیدهای مسدودشده شامل `NODE_OPTIONS`، `PYTHONSTARTUP`، `PYTHONPATH`، `PERL5OPT`، `RUBYOPT`، `SHELLOPTS`، `PS4` و متغیرهای مشابه کنترل زمان اجرا هستند. شروع کار این موارد را با خطای پیکربندی رد می‌کند تا نتوانند یک مقدمه ضمنی تزریق کنند، مفسر را تعویض کنند، یا یک اشکال‌زدا را برای فرایند stdio فعال کنند. متغیرهای env معمولی مربوط به اعتبارنامه، پراکسی و موارد خاص سرور (`GITHUB_TOKEN`، `HTTP_PROXY`، `*_API_KEY` سفارشی و غیره) تحت تاثیر قرار نمی‌گیرند.

اگر سرور MCP شما واقعا به یکی از متغیرهای مسدودشده نیاز دارد، آن را به‌جای زیر `env` سرور stdio، روی فرایند میزبان Gateway تنظیم کنید.
</Warning>

### ترابرد SSE / HTTP

از طریق HTTP Server-Sent Events به یک سرور MCP راه‌دور وصل می‌شود.

| فیلد                 | توضیح                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL مربوط به HTTP یا HTTPS سرور راه‌دور (الزامی)                |
| `headers`             | نگاشت اختیاری کلید-مقدار از سرآیندهای HTTP (برای مثال توکن‌های احراز هویت) |
| `connectionTimeoutMs` | مهلت زمانی اتصال برای هر سرور بر حسب میلی‌ثانیه (اختیاری)                   |

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

مقادیر حساس در `url` (userinfo) و `headers` در خروجی گزارش‌ها و وضعیت پوشانده می‌شوند.

### ترابرد Streamable HTTP

`streamable-http` یک گزینه ترابرد اضافی در کنار `sse` و `stdio` است. برای ارتباط دوسویه با سرورهای MCP راه‌دور از جریان‌سازی HTTP استفاده می‌کند.

| فیلد                 | توضیح                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL مربوط به HTTP یا HTTPS سرور راه‌دور (الزامی)                                      |
| `transport`           | برای انتخاب این ترابرد روی `"streamable-http"` تنظیم کنید؛ وقتی حذف شود، OpenClaw از `sse` استفاده می‌کند |
| `headers`             | نگاشت اختیاری کلید-مقدار از سرآیندهای HTTP (برای مثال توکن‌های احراز هویت)                       |
| `connectionTimeoutMs` | مهلت زمانی اتصال برای هر سرور بر حسب میلی‌ثانیه (اختیاری)                                         |

پیکربندی OpenClaw از `transport: "streamable-http"` به‌عنوان نگارش کانونی استفاده می‌کند. مقادیر MCP بومی CLI به شکل `type: "http"` هنگام ذخیره از طریق `openclaw mcp set` پذیرفته می‌شوند و در پیکربندی موجود توسط `openclaw doctor --fix` ترمیم می‌شوند، اما `transport` همان چیزی است که Pi تعبیه‌شده مستقیما مصرف می‌کند.

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
این فرمان‌ها فقط پیکربندی ذخیره‌شده را مدیریت می‌کنند. آن‌ها پل کانال را شروع نمی‌کنند، یک نشست زنده کلاینت MCP باز نمی‌کنند، یا ثابت نمی‌کنند که سرور مقصد در دسترس است.
</Note>

## محدودیت‌های فعلی

این صفحه پل را همان‌طور که امروز عرضه شده است مستند می‌کند.

محدودیت‌های فعلی:

- کشف گفت‌وگو به فراداده مسیر نشست موجود Gateway وابسته است
- هیچ پروتکل push عمومی فراتر از آداپتور ویژه Claude وجود ندارد
- هنوز ابزاری برای ویرایش پیام یا واکنش وجود ندارد
- ترابرد HTTP/SSE/streamable-http به یک سرور راه‌دور واحد وصل می‌شود؛ هنوز بالادست چندگانه وجود ندارد
- `permissions_list_open` فقط تاییدهایی را شامل می‌شود که هنگام اتصال پل مشاهده شده‌اند

## مرتبط

- [مرجع CLI](/fa/cli)
- [Plugins](/fa/cli/plugins)
