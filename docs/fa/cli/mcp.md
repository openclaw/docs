---
read_when:
    - اتصال Codex، Claude Code یا یک کلاینت MCP دیگر به کانال‌های پشتیبانی‌شده توسط OpenClaw
    - در حال اجرای `openclaw mcp serve`
    - مدیریت تعریف‌های سرور MCP ذخیره‌شده توسط OpenClaw
sidebarTitle: MCP
summary: مکالمات کانال OpenClaw را از طریق MCP در دسترس قرار دهید و تعریف‌های ذخیره‌شدهٔ سرور MCP را مدیریت کنید
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:24:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` دو وظیفه دارد:

- اجرای OpenClaw به‌عنوان یک سرور MCP با `openclaw mcp serve`
- مدیریت تعریف‌های سرور MCP خروجیِ مدیریت‌شده توسط OpenClaw با `list`، `show`، `status`، `doctor`، `probe`، `add`، `set`، `configure`، `tools`، `login`، `logout`، `reload` و `unset`

به بیان دیگر:

- `serve` یعنی OpenClaw در نقش یک سرور MCP عمل می‌کند
- زیرفرمان‌های دیگر یعنی OpenClaw در نقش یک رجیستری سمت کلاینت MCP برای سرورهای MCP عمل می‌کند که runtimeهای آن ممکن است بعدا مصرف کنند

<Note>
  `list`، `show`، `set` و `unset` فقط ورودی‌های `mcp.servers` مدیریت‌شده توسط OpenClaw را در پیکربندی OpenClaw می‌خوانند و می‌نویسند. آن‌ها شامل سرورهای mcporter از `config/mcporter.json` نمی‌شوند؛ برای آن رجیستری از `mcporter list` استفاده کنید.
</Note>

وقتی OpenClaw باید خودش یک نشست harness کدنویسی را میزبانی کند و آن runtime را از طریق ACP مسیریابی کند، از [`openclaw acp`](/fa/cli/acp) استفاده کنید.

## مسیر درست MCP را انتخاب کنید

OpenClaw چند سطح MCP دارد. موردی را انتخاب کنید که با مالک runtime عامل و مالک ابزارها مطابقت دارد.

| هدف                                                                | استفاده                                                                  | چرا                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| اجازه دهید یک کلاینت MCP خارجی مکالمه‌های کانال OpenClaw را بخواند/ارسال کند | `openclaw mcp serve`                                                 | OpenClaw سرور MCP است و مکالمه‌های پشتیبانی‌شده توسط Gateway را از طریق stdio عرضه می‌کند.                                 |
| ذخیره سرورهای MCP شخص ثالث برای اجرای عامل‌های مدیریت‌شده توسط OpenClaw        | `openclaw mcp add`، `set`، `configure`، `tools`، `login`             | OpenClaw رجیستری سمت کلاینت MCP است و بعدا آن سرورها را به runtimeهای واجد شرایط تزریق می‌کند.               |
| بررسی یک سرور ذخیره‌شده بدون اجرای یک نوبت عامل                  | `openclaw mcp status`، `doctor`، `probe`                             | `status` و `doctor` پیکربندی را بررسی می‌کنند؛ `probe` یک اتصال MCP زنده باز می‌کند و قابلیت‌ها را فهرست می‌کند.               |
| ویرایش پیکربندی MCP از مرورگر                                      | Control UI `/mcp`                                                    | این صفحه موجودی، فعال‌سازی، خلاصه‌های OAuth/فیلتر، راهنمای فرمان‌ها، و یک ویرایشگر محدود به دامنه `mcp` را نشان می‌دهد.         |
| دادن یک سرور MCP بومیِ محدود به app-server مربوط به Codex                    | `mcp.servers.<name>.codex`                                           | بلوک `codex` فقط بر projection ترد app-server مربوط به Codex اثر می‌گذارد و پیش از تحویل پیکربندی بومی حذف می‌شود. |
| اجرای نشست‌های harness میزبانی‌شده توسط ACP                                     | [`openclaw acp`](/fa/cli/acp) و [عامل‌های ACP](/fa/tools/acp-agents-setup) | حالت پل ACP تزریق سرور MCP به‌ازای هر نشست را نمی‌پذیرد؛ به‌جای آن پل‌های gateway/Plugin را پیکربندی کنید.     |

<Tip>
اگر مطمئن نیستید به کدام مسیر نیاز دارید، با `openclaw mcp status --verbose` شروع کنید. این فرمان آنچه OpenClaw ذخیره کرده است را بدون راه‌اندازی هیچ سرور MCP نشان می‌دهد.
</Tip>

## OpenClaw به‌عنوان یک سرور MCP

این مسیر `openclaw mcp serve` است.

### چه زمانی از `serve` استفاده کنید

از `openclaw mcp serve` استفاده کنید وقتی:

- Codex، Claude Code، یا یک کلاینت MCP دیگر باید مستقیما با مکالمه‌های کانال پشتیبانی‌شده توسط OpenClaw صحبت کند
- از قبل یک Gateway محلی یا راه‌دور OpenClaw با نشست‌های مسیریابی‌شده دارید
- یک سرور MCP می‌خواهید که در backendهای کانال OpenClaw کار کند، به‌جای اجرای پل‌های جداگانه برای هر کانال

وقتی OpenClaw باید خودش runtime کدنویسی را میزبانی کند و نشست عامل را داخل OpenClaw نگه دارد، به‌جای آن از [`openclaw acp`](/fa/cli/acp) استفاده کنید.

### نحوه کار

`openclaw mcp serve` یک سرور MCP از نوع stdio را شروع می‌کند. کلاینت MCP مالک آن فرایند است. تا وقتی کلاینت نشست stdio را باز نگه می‌دارد، پل از طریق WebSocket به یک Gateway محلی یا راه‌دور OpenClaw وصل می‌شود و مکالمه‌های کانال مسیریابی‌شده را از طریق MCP عرضه می‌کند.

<Steps>
  <Step title="کلاینت پل را ایجاد می‌کند">
    کلاینت MCP، `openclaw mcp serve` را ایجاد می‌کند.
  </Step>
  <Step title="پل به Gateway وصل می‌شود">
    پل از طریق WebSocket به Gateway مربوط به OpenClaw وصل می‌شود.
  </Step>
  <Step title="نشست‌ها به مکالمه‌های MCP تبدیل می‌شوند">
    نشست‌های مسیریابی‌شده به مکالمه‌های MCP و ابزارهای رونوشت/تاریخچه تبدیل می‌شوند.
  </Step>
  <Step title="صف رویدادهای زنده">
    رویدادهای زنده تا وقتی پل وصل است در حافظه صف می‌شوند.
  </Step>
  <Step title="push اختیاری Claude">
    اگر حالت کانال Claude فعال باشد، همان نشست می‌تواند اعلان‌های push اختصاصی Claude را نیز دریافت کند.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="رفتار مهم">
    - وضعیت صف زنده از زمان اتصال پل شروع می‌شود
    - تاریخچه رونوشت‌های قدیمی‌تر با `messages_read` خوانده می‌شود
    - اعلان‌های push مربوط به Claude فقط تا وقتی نشست MCP زنده است وجود دارند
    - وقتی کلاینت قطع می‌شود، پل خارج می‌شود و صف زنده از بین می‌رود
    - نقاط ورود یک‌باره عامل مانند `openclaw agent` و `openclaw infer model run` هر runtime بسته‌بندی‌شده MCP را که باز می‌کنند پس از تکمیل پاسخ بازنشسته می‌کنند، بنابراین اجراهای اسکریپتی تکرارشونده فرایندهای فرزند stdio MCP را انباشته نمی‌کنند
    - سرورهای stdio MCP که توسط OpenClaw راه‌اندازی می‌شوند، چه بسته‌بندی‌شده و چه پیکربندی‌شده توسط کاربر، هنگام خاموشی به‌صورت یک درخت فرایند برچیده می‌شوند، بنابراین زیرفرایندهای فرزندی که سرور شروع کرده پس از خروج کلاینت stdio والد باقی نمی‌مانند
    - حذف یا بازنشانی یک نشست، کلاینت‌های MCP آن نشست را از مسیر پاک‌سازی runtime مشترک آزاد می‌کند، بنابراین هیچ اتصال stdio باقی‌مانده‌ای به نشست حذف‌شده وابسته نمی‌ماند

  </Accordion>
</AccordionGroup>

### حالت کلاینت را انتخاب کنید

از همان پل به دو روش متفاوت استفاده کنید:

<Tabs>
  <Tab title="کلاینت‌های عمومی MCP">
    فقط ابزارهای استاندارد MCP. از `conversations_list`، `messages_read`، `events_poll`، `events_wait`، `messages_send` و ابزارهای تأیید استفاده کنید.
  </Tab>
  <Tab title="Claude Code">
    ابزارهای استاندارد MCP به‌علاوه adapter کانال اختصاصی Claude. `--claude-channel-mode on` را فعال کنید یا مقدار پیش‌فرض `auto` را باقی بگذارید.
  </Tab>
</Tabs>

<Note>
امروز، `auto` همان رفتار `on` را دارد. هنوز تشخیص قابلیت کلاینت وجود ندارد.
</Note>

### `serve` چه چیزی عرضه می‌کند

پل از متادیتای مسیر نشست Gateway موجود استفاده می‌کند تا مکالمه‌های پشتیبانی‌شده توسط کانال را عرضه کند. یک مکالمه زمانی ظاهر می‌شود که OpenClaw از قبل وضعیت نشست با یک مسیر شناخته‌شده داشته باشد، مانند:

- `channel`
- متادیتای گیرنده یا مقصد
- `accountId` اختیاری
- `threadId` اختیاری

این به کلاینت‌های MCP یک محل واحد می‌دهد تا:

- مکالمه‌های مسیریابی‌شده اخیر را فهرست کنند
- تاریخچه رونوشت اخیر را بخوانند
- برای رویدادهای ورودی جدید منتظر بمانند
- از طریق همان مسیر پاسخ ارسال کنند
- درخواست‌های تأییدی را که هنگام اتصال پل می‌رسند ببینند

### استفاده

<Tabs>
  <Tab title="Gateway محلی">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway راه‌دور (توکن)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway راه‌دور (رمز عبور)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="پرحرف / Claude خاموش">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ابزارهای پل

پل فعلی این ابزارهای MCP را عرضه می‌کند:

<AccordionGroup>
  <Accordion title="conversations_list">
    مکالمه‌های اخیرِ پشتیبانی‌شده توسط نشست را که از قبل در وضعیت نشست Gateway متادیتای مسیر دارند فهرست می‌کند.

    فیلترهای مفید:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    یک مکالمه را با `session_key` و با استفاده از جست‌وجوی مستقیم نشست Gateway برمی‌گرداند.
  </Accordion>
  <Accordion title="messages_read">
    پیام‌های رونوشت اخیر را برای یک مکالمه پشتیبانی‌شده توسط نشست می‌خواند.
  </Accordion>
  <Accordion title="attachments_fetch">
    بلوک‌های محتوای غیرمتنی پیام را از یک پیام رونوشت استخراج می‌کند. این یک نمای متادیتا روی محتوای رونوشت است، نه یک ذخیره‌گاه مستقل و پایدار برای blob پیوست.
  </Accordion>
  <Accordion title="events_poll">
    رویدادهای زنده صف‌شده را از زمان یک cursor عددی می‌خواند.
  </Accordion>
  <Accordion title="events_wait">
    به‌صورت long-poll منتظر می‌ماند تا رویداد صف‌شده مطابق بعدی برسد یا زمان انتظار منقضی شود.

    وقتی یک کلاینت عمومی MCP به تحویل نزدیک به زمان واقعی بدون پروتکل push اختصاصی Claude نیاز دارد، از این استفاده کنید.

  </Accordion>
  <Accordion title="messages_send">
    متن را از طریق همان مسیری که از قبل روی نشست ثبت شده است ارسال می‌کند.

    رفتار فعلی:

    - به یک مسیر مکالمه موجود نیاز دارد
    - از کانال، گیرنده، شناسه حساب و شناسه ترد نشست استفاده می‌کند
    - فقط متن ارسال می‌کند

  </Accordion>
  <Accordion title="permissions_list_open">
    درخواست‌های تأیید exec/Plugin در انتظار را که پل از زمان اتصال به Gateway مشاهده کرده است فهرست می‌کند.
  </Accordion>
  <Accordion title="permissions_respond">
    یک درخواست تأیید exec/Plugin در انتظار را با یکی از این‌ها حل می‌کند:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### مدل رویداد

پل تا وقتی وصل است یک صف رویداد درون‌حافظه‌ای نگه می‌دارد.

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
- backlog پایدار باید با `messages_read` خوانده شود

</Warning>

### اعلان‌های کانال Claude

پل همچنین می‌تواند اعلان‌های کانال اختصاصی Claude را عرضه کند. این معادل OpenClaw برای adapter کانال Claude Code است: ابزارهای استاندارد MCP همچنان در دسترس می‌مانند، اما پیام‌های ورودی زنده می‌توانند به‌صورت اعلان‌های MCP اختصاصی Claude نیز برسند.

<Tabs>
  <Tab title="خاموش">
    `--claude-channel-mode off`: فقط ابزارهای استاندارد MCP.
  </Tab>
  <Tab title="روشن">
    `--claude-channel-mode on`: اعلان‌های کانال Claude را فعال می‌کند.
  </Tab>
  <Tab title="خودکار (پیش‌فرض)">
    `--claude-channel-mode auto`: پیش‌فرض فعلی؛ همان رفتار پل مانند `on`.
  </Tab>
</Tabs>

وقتی حالت کانال Claude فعال است، سرور قابلیت‌های آزمایشی Claude را اعلام می‌کند و می‌تواند این‌ها را منتشر کند:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

رفتار فعلی پل:

- پیام‌های رونوشت ورودی `user` به‌صورت `notifications/claude/channel` فوروارد می‌شوند
- درخواست‌های مجوز Claude که از طریق MCP دریافت می‌شوند در حافظه رهگیری می‌شوند
- اگر مکالمه پیوندخورده بعدا `yes abcde` یا `no abcde` ارسال کند، پل آن را به `notifications/claude/channel/permission` تبدیل می‌کند
- این اعلان‌ها فقط برای نشست زنده هستند؛ اگر کلاینت MCP قطع شود، هیچ هدف push وجود ندارد

این کار عمدا اختصاصی کلاینت است. کلاینت‌های عمومی MCP باید به ابزارهای polling استاندارد متکی باشند.

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

برای بیشتر کلاینت‌های عمومی MCP، با سطح ابزار استاندارد شروع کنید و حالت Claude را نادیده بگیرید. حالت Claude را فقط برای کلاینت‌هایی روشن کنید که واقعا متدهای اعلان اختصاصی Claude را می‌فهمند.

### گزینه‌ها

`openclaw mcp serve` پشتیبانی می‌کند:

<ParamField path="--url" type="string">
  نشانی URL WebSocket Gateway.
</ParamField>
<ParamField path="--token" type="string">
  توکن Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  توکن را از فایل بخوان.
</ParamField>
<ParamField path="--password" type="string">
  گذرواژه Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  گذرواژه را از فایل بخوان.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  حالت اعلان Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  لاگ‌های پرجزئیات روی stderr.
</ParamField>

<Tip>
در صورت امکان، به‌جای رازهای درون‌خطی از `--token-file` یا `--password-file` استفاده کن.
</Tip>

### مرز امنیت و اعتماد

این پل مسیریابی تازه‌ای ابداع نمی‌کند. فقط گفتگوهایی را در معرض دسترس قرار می‌دهد که Gateway از قبل می‌داند چگونه آن‌ها را مسیریابی کند.

یعنی:

- فهرست‌های مجاز فرستنده، جفت‌سازی، و اعتماد در سطح کانال همچنان به پیکربندی کانال زیرین OpenClaw تعلق دارند
- `messages_send` فقط می‌تواند از طریق یک مسیر ذخیره‌شده موجود پاسخ دهد
- وضعیت تأیید فقط برای نشست فعلی پل زنده/درون‌حافظه‌ای است
- احراز هویت پل باید از همان کنترل‌های توکن یا گذرواژه Gateway استفاده کند که برای هر کلاینت راه‌دور دیگر Gateway قابل اعتماد می‌دانید

اگر گفتگویی در `conversations_list` وجود ندارد، علت معمولاً پیکربندی MCP نیست. علت، نبودن یا ناقص بودن فراداده مسیر در نشست زیرین Gateway است.

### آزمون

OpenClaw یک smoke قطعی Docker برای این پل ارائه می‌کند:

```bash
pnpm test:docker:mcp-channels
```

این smoke:

- یک کانتینر Gateway با داده اولیه راه‌اندازی می‌کند
- کانتینر دومی را راه‌اندازی می‌کند که `openclaw mcp serve` را اجرا می‌کند
- کشف گفتگو، خواندن رونوشت، خواندن فراداده پیوست، رفتار صف رویداد زنده، و مسیریابی ارسال خروجی را بررسی می‌کند
- اعلان‌های کانال و مجوز به سبک Claude را از طریق پل واقعی stdio MCP اعتبارسنجی می‌کند

این سریع‌ترین راه برای اثبات کارکرد پل بدون اتصال یک حساب واقعی Telegram، Discord، یا iMessage به اجرای آزمون است.

برای زمینه گسترده‌تر آزمون، [آزمون](/fa/help/testing) را ببینید.

### عیب‌یابی

<AccordionGroup>
  <Accordion title="No conversations returned">
    معمولاً یعنی نشست Gateway از قبل قابل مسیریابی نیست. تأیید کنید که نشست زیرین، فراداده ذخیره‌شده مسیر برای کانال/ارائه‌دهنده، گیرنده، و حساب/رشته اختیاری را دارد.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    مورد انتظار است. صف زنده زمانی شروع می‌شود که پل وصل شود. تاریخچه قدیمی‌تر رونوشت را با `messages_read` بخوانید.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    همه این موارد را بررسی کنید:

    - کلاینت نشست stdio MCP را باز نگه داشته باشد
    - `--claude-channel-mode` برابر `on` یا `auto` باشد
    - کلاینت واقعاً روش‌های اعلان اختصاصی Claude را بفهمد
    - پیام ورودی پس از اتصال پل رخ داده باشد

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` فقط درخواست‌های تأییدی را نشان می‌دهد که هنگام اتصال پل مشاهده شده‌اند. این یک API پایدار برای تاریخچه تأییدها نیست.
  </Accordion>
</AccordionGroup>

## OpenClaw به‌عنوان رجیستری کلاینت MCP

این مسیر `openclaw mcp list`، `show`، `status`، `doctor`، `probe`، `add`، `set`،
`configure`، `tools`، `login`، `logout`، `reload`، و `unset` است.

این دستورها OpenClaw را از طریق MCP در معرض دسترس قرار نمی‌دهند. آن‌ها تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` در پیکربندی OpenClaw مدیریت می‌کنند. آن‌ها سرورهای mcporter را از `config/mcporter.json` نمی‌خوانند.

این تعریف‌های ذخیره‌شده برای runtimeهایی هستند که OpenClaw بعداً راه‌اندازی یا پیکربندی می‌کند، مانند OpenClaw تعبیه‌شده و آداپتورهای runtime دیگر. OpenClaw تعریف‌ها را به‌صورت مرکزی ذخیره می‌کند تا آن runtimeها مجبور نباشند فهرست‌های تکراری سرور MCP خود را نگه دارند.

<AccordionGroup>
  <Accordion title="Important behavior">
    - این دستورها فقط پیکربندی OpenClaw را می‌خوانند یا می‌نویسند
    - `status`، `list`، `show`، `doctor` بدون `--probe`، `set`، `configure`، `tools`، `logout`، `reload`، و `unset` به سرور MCP هدف وصل نمی‌شوند
    - `login` جریان شبکه OAuth مربوط به MCP را برای سرور HTTP پیکربندی‌شده اجرا می‌کند و اعتبارنامه‌های محلی حاصل را ذخیره می‌کند
    - `status --verbose` بدون اتصال، نکته‌های transport حل‌شده، احراز هویت، timeout، filter، و فراخوانی موازی ابزار را چاپ می‌کند
    - `doctor` تعریف‌های ذخیره‌شده را از نظر مشکلات راه‌اندازی محلی مانند دستورهای stdio مفقود، دایرکتوری‌های کاری نامعتبر، فایل‌های TLS مفقود، سرورهای غیرفعال، مقادیر حساس header/env به‌صورت لفظی، و مجوزدهی OAuth ناقص بررسی می‌کند
    - `doctor --probe` پس از گذر بررسی‌های ایستا، همان اثبات اتصال زنده `probe` را اضافه می‌کند
    - `probe` به سرور انتخاب‌شده یا همه سرورهای پیکربندی‌شده وصل می‌شود، ابزارها را فهرست می‌کند، و قابلیت‌ها/تشخیص‌ها را گزارش می‌دهد
    - `add` پیش از ذخیره، یک تعریف را از flagها می‌سازد و probe می‌کند، مگر اینکه `--no-probe` تنظیم شده باشد یا ابتدا مجوزدهی OAuth لازم باشد
    - آداپتورهای runtime تصمیم می‌گیرند که در زمان اجرا واقعاً از کدام شکل‌های transport پشتیبانی کنند
    - `enabled: false` یک سرور را ذخیره نگه می‌دارد اما آن را از کشف runtime تعبیه‌شده کنار می‌گذارد
    - `timeout` و `connectTimeout` زمان‌های timeout درخواست و اتصال هر سرور را بر حسب ثانیه تنظیم می‌کنند
    - `supportsParallelToolCalls: true` سرورهایی را مشخص می‌کند که آداپتورها می‌توانند هم‌زمان فراخوانی کنند
    - سرورهای HTTP می‌توانند از headerهای ایستا، ورود OAuth، کنترل اعتبارسنجی TLS، و مسیرهای گواهی/کلید mTLS استفاده کنند
    - OpenClaw تعبیه‌شده ابزارهای MCP پیکربندی‌شده را در پروفایل‌های ابزار معمولی `coding` و `messaging` در معرض دسترس قرار می‌دهد؛ `minimal` همچنان آن‌ها را پنهان می‌کند، و `tools.deny: ["bundle-mcp"]` آن‌ها را صراحتاً غیرفعال می‌کند
    - `toolFilter.include` و `toolFilter.exclude` برای هر سرور، ابزارهای MCP کشف‌شده را پیش از تبدیل شدن به ابزارهای OpenClaw فیلتر می‌کنند
    - سرورهایی که resources یا prompts را اعلام می‌کنند، ابزارهای کمکی برای فهرست/خواندن resources و فهرست/دریافت prompts نیز در معرض دسترس قرار می‌دهند؛ این نام‌های کمکی تولیدشده (`resources_list`، `resources_read`، `prompts_list`، `prompts_get`) از همان filter شامل/مستثنی استفاده می‌کنند
    - تغییرهای پویا در فهرست ابزار MCP، کاتالوگ cacheشده آن نشست را نامعتبر می‌کند؛ کشف/استفاده بعدی از سرور تازه‌سازی می‌شود
    - خرابی‌های تکراری درخواست/پروتکل ابزار MCP آن سرور را برای مدت کوتاهی متوقف می‌کند تا یک سرور خراب کل نوبت را مصرف نکند
    - runtimeهای MCP بسته‌بندی‌شده در محدوده نشست پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری جمع‌آوری می‌شوند (پیش‌فرض ۱۰ دقیقه؛ برای غیرفعال‌سازی `0` بگذارید) و اجراهای تعبیه‌شده یک‌باره آن‌ها را در پایان اجرا پاک‌سازی می‌کنند

  </Accordion>
</AccordionGroup>

آداپتورهای runtime ممکن است این رجیستری مشترک را به شکلی که کلاینت پایین‌دستی‌شان انتظار دارد نرمال‌سازی کنند. برای نمونه، OpenClaw تعبیه‌شده مقادیر `transport` در OpenClaw را مستقیماً مصرف می‌کند، در حالی که Claude Code و Gemini مقادیر `type` بومی CLI مانند `http`، `sse`، یا `stdio` را دریافت می‌کنند.

Codex app-server همچنین یک بلوک اختیاری `codex` را روی هر سرور رعایت می‌کند. این
فراداده projection در OpenClaw فقط برای رشته‌های Codex app-server است؛
نشست‌های ACP، پیکربندی عمومی harness در Codex، یا آداپتورهای runtime دیگر را
تغییر نمی‌دهد. از `codex.agents` غیرخالی استفاده کنید تا یک سرور را فقط به idهای
عامل خاص OpenClaw project کنید. فهرست‌های agent خالی، blank، یا نامعتبر توسط
اعتبارسنجی پیکربندی رد می‌شوند و به‌جای جهانی شدن، در مسیر projection runtime
حذف می‌شوند. از `codex.defaultToolsApprovalMode` (`auto`، `prompt`، یا `approve`)
استفاده کنید تا `default_tools_approval_mode` بومی Codex برای یک سرور قابل اعتماد
منتشر شود. OpenClaw پیش از تحویل پیکربندی بومی `mcp_servers` به Codex،
فراداده `codex` را حذف می‌کند.

### تعریف‌های ذخیره‌شده سرور MCP

OpenClaw همچنین یک رجیستری سبک‌وزن سرور MCP را در پیکربندی برای سطح‌هایی ذخیره می‌کند که تعریف‌های MCP مدیریت‌شده توسط OpenClaw می‌خواهند.

دستورها:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

نکته‌ها:

- `list` نام سرورها را مرتب می‌کند.
- `show` بدون نام، کل object پیکربندی‌شده سرور MCP را چاپ می‌کند.
- `status` transportهای پیکربندی‌شده را بدون اتصال دسته‌بندی می‌کند. `--verbose` جزئیات حل‌شده راه‌اندازی، timeout، OAuth، filter، و فراخوانی موازی را شامل می‌شود.
- `doctor` بررسی‌های ایستا را بدون اتصال انجام می‌دهد. وقتی دستور باید اتصال سرورهای فعال را نیز بررسی کند، `--probe` را اضافه کنید.
- `probe` وصل می‌شود و تعداد ابزارها، پشتیبانی از resources/prompts، پشتیبانی از تغییر فهرست، و تشخیص‌ها را گزارش می‌دهد.
- `add` flagهای stdio مانند `--command`، `--arg`، `--env`، و `--cwd`، یا flagهای HTTP مانند `--url`، `--transport`، `--header`، `--auth oauth`، TLS، timeout، و flagهای انتخاب ابزار را می‌پذیرد.
- `set` یک مقدار object JSON روی خط فرمان انتظار دارد.
- `configure` فعال‌سازی، filterهای ابزار، timeoutها، OAuth، TLS، و نکته‌های فراخوانی موازی ابزار را بدون جایگزینی کل تعریف سرور به‌روزرسانی می‌کند.
- `tools` filterهای ابزار هر سرور را به‌روزرسانی می‌کند. مدخل‌های include/exclude نام ابزارهای MCP و globهای ساده `*` هستند.
- `login` جریان OAuth را برای سرورهای HTTP پیکربندی‌شده با `auth: "oauth"` اجرا می‌کند. اجرای اول یک URL مجوزدهی چاپ می‌کند؛ پس از تأیید، با `--code` دوباره اجرا کنید.
- `logout` اعتبارنامه‌های OAuth ذخیره‌شده برای سرور نام‌گذاری‌شده را بدون حذف تعریف ذخیره‌شده سرور پاک می‌کند.
- `reload` runtimeهای MCP درون‌فرایندی cacheشده را dispose می‌کند. فرایندهای Gateway یا agent در فرایندی دیگر همچنان به مسیر reload یا restart خودشان نیاز دارند.
- برای سرورهای Streamable HTTP MCP از `transport: "streamable-http"` استفاده کنید. `openclaw mcp set` همچنین برای سازگاری، `type: "http"` بومی CLI را به همان شکل پیکربندی canonical نرمال‌سازی می‌کند.
- اگر سرور نام‌گذاری‌شده وجود نداشته باشد، `unset` شکست می‌خورد.

نمونه‌ها:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### دستورالعمل‌های رایج سرور

این نمونه‌ها فقط تعریف‌های سرور را ذخیره می‌کنند. پس از آن `openclaw mcp doctor --probe` را اجرا کنید تا ثابت شود سرور شروع می‌شود و ابزارها را در معرض دسترس قرار می‌دهد.

<Tabs>
  <Tab title="Filesystem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    سرورهای filesystem را به کوچک‌ترین درخت دایرکتوری که agent باید بخواند یا ویرایش کند محدود کنید.

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    اگر سرور ابزارهای نوشتنی در معرض دسترس قرار می‌دهد که نباید برای agentهای عادی در دسترس باشند، از filter ابزار استفاده کنید.

  </Tab>
  <Tab title="Local script">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` بررسی می‌کند که `cwd` وجود دارد و دستور از محیط پیکربندی‌شده resolve می‌شود.

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    وقتی سرور راه‌دور از OAuth پشتیبانی می‌کند، از OAuth استفاده کنید. اگر سرور به سرآیندهای ثابت نیاز دارد، از ثبت توکن‌های حامل به‌صورت لفظی در مخزن خودداری کنید.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    سرورهای کنترل مستقیم دسکتاپ، مجوزهای فرایندی را که اجرا می‌کنند به ارث می‌برند. از فیلترهای محدود ابزار و اعلان‌های مجوز در سطح سیستم‌عامل استفاده کنید.

  </Tab>
</Tabs>

### شکل‌های خروجی JSON

برای اسکریپت‌ها و داشبوردها از `--json` استفاده کنید. مجموعه فیلدها ممکن است در طول زمان گسترش یابد، بنابراین مصرف‌کننده‌ها باید کلیدهای ناشناخته را نادیده بگیرند.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    وقتی هر سرور فعالِ بررسی‌شده خطا داشته باشد، `doctor --json` با کد غیرصفر خارج می‌شود. هشدارها گزارش می‌شوند اما به‌تنهایی باعث شکست فرمان نمی‌شوند.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` یک نشست زنده کلاینت MCP را باز می‌کند. از آن برای اثبات دسترسی‌پذیری و قابلیت‌ها استفاده کنید، نه برای ممیزی ایستای پیکربندی.

  </Accordion>
</AccordionGroup>

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
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### انتقال Stdio

یک فرایند فرزند محلی را اجرا می‌کند و از طریق stdin/stdout ارتباط برقرار می‌کند.

| فیلد                      | توضیح                       |
| -------------------------- | --------------------------------- |
| `command`                  | فایل اجرایی برای ایجاد فرایند (الزامی)    |
| `args`                     | آرایه‌ای از آرگومان‌های خط فرمان   |
| `env`                      | متغیرهای محیطی اضافی       |
| `cwd` / `workingDirectory` | دایرکتوری کاری فرایند |

<Warning>
**فیلتر ایمنی env در Stdio**

OpenClaw کلیدهای env مربوط به راه‌اندازی مفسر را که می‌توانند نحوه شروع یک سرور MCP با stdio را پیش از نخستین RPC تغییر دهند رد می‌کند، حتی اگر در بلوک `env` یک سرور ظاهر شوند. کلیدهای مسدودشده شامل `BASHOPTS`، `FPATH`، `KSH_ENV`، `NODE_OPTIONS`، `NODE_REDIRECT_WARNINGS`، `NODE_REPL_EXTERNAL_MODULE`، `NODE_REPL_HISTORY`، `NODE_V8_COVERAGE`، `PYTHONSTARTUP`، `PYTHONPATH`، `PERL5OPT`، `RUBYOPT`، `SHELLOPTS`، `PS4`، `TCLLIBPATH` و متغیرهای مشابه کنترل زمان اجرا هستند. راه‌اندازی این موارد را با خطای پیکربندی رد می‌کند تا نتوانند یک مقدمه ضمنی تزریق کنند، مفسر را جایگزین کنند، اشکال‌زدا را فعال کنند، یا خروجی زمان اجرا را علیه فرایند stdio بازهدایت کنند. متغیرهای env معمولی مربوط به اعتبارنامه، پروکسی و سرورهای خاص (`GITHUB_TOKEN`، `HTTP_PROXY`، `*_API_KEY` سفارشی، و غیره) تحت تأثیر قرار نمی‌گیرند.

اگر سرور MCP شما واقعاً به یکی از متغیرهای مسدودشده نیاز دارد، آن را به‌جای زیر `env` سرور stdio، روی فرایند میزبان gateway تنظیم کنید.
</Warning>

### انتقال SSE / HTTP

از طریق HTTP Server-Sent Events به یک سرور MCP راه‌دور وصل می‌شود.

| فیلد                          | توضیح                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | URL از نوع HTTP یا HTTPS برای سرور راه‌دور (الزامی)                |
| `headers`                      | نگاشت اختیاری کلید-مقدار از سرآیندهای HTTP (برای مثال توکن‌های auth) |
| `connectionTimeoutMs`          | مهلت اتصال برای هر سرور بر حسب ms (اختیاری)                   |
| `connectTimeout`               | مهلت اتصال برای هر سرور بر حسب ثانیه (اختیاری)              |
| `timeout` / `requestTimeoutMs` | مهلت درخواست MCP برای هر سرور بر حسب ثانیه یا ms                  |
| `auth: "oauth"`                | استفاده از ذخیره‌سازی توکن OAuth در MCP و `openclaw mcp login`             |
| `sslVerify`                    | فقط برای endpointهای خصوصی HTTPS که صراحتاً مورد اعتماد هستند روی false تنظیم کنید    |
| `clientCert` / `clientKey`     | مسیرهای گواهی و کلید کلاینت mTLS                            |
| `supportsParallelToolCalls`    | راهنمایی می‌کند که فراخوانی‌های هم‌زمان برای این سرور ایمن هستند              |

مثال:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

مقادیر حساس در `url` (userinfo) و `headers` در لاگ‌ها و خروجی وضعیت پوشانده می‌شوند. `openclaw mcp doctor` وقتی ورودی‌های شبیه به داده حساس در `headers` یا `env` شامل مقادیر لفظی باشند هشدار می‌دهد، تا اپراتورها بتوانند آن مقادیر را از پیکربندی ثبت‌شده در مخزن بیرون ببرند.

### گردش‌کار OAuth

OAuth برای سرورهای HTTP MCP است که جریان OAuth مربوط به MCP را اعلام می‌کنند. تا زمانی که `auth: "oauth"` فعال باشد، سرآیندهای ثابت `Authorization` برای آن سرور نادیده گرفته می‌شوند.

<Steps>
  <Step title="Save the server">
    سرور را با `auth: "oauth"` و هر فراداده اختیاری OAuth اضافه یا به‌روزرسانی کنید.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    برای ساخت درخواست مجوز، login را اجرا کنید.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw نشانی URL مجوزدهی را چاپ می‌کند و وضعیت موقت verifier مربوط به OAuth را زیر دایرکتوری وضعیت OpenClaw ذخیره می‌کند.

  </Step>
  <Step title="Finish with the code">
    پس از تأیید در مرورگر، کد برگشتی را به OpenClaw بدهید.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    برای تأیید وجود توکن‌ها از status یا doctor استفاده کنید.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout اعتبارنامه‌های ذخیره‌شده OAuth را حذف می‌کند اما تعریف ذخیره‌شده سرور را نگه می‌دارد.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

اگر ارائه‌دهنده توکن‌ها را چرخاند یا وضعیت مجوزدهی گیر کرد، `openclaw mcp logout <name>` را اجرا کنید و سپس `login` را تکرار کنید. حتی پس از حذف `auth: "oauth"` از پیکربندی، تا زمانی که نام سرور و URL همچنان ورودی مخزن اعتبارنامه را شناسایی کنند، `logout` می‌تواند اعتبارنامه‌های یک سرور HTTP ذخیره‌شده را پاک کند.

### انتقال Streamable HTTP

`streamable-http` یک گزینه انتقال اضافی در کنار `sse` و `stdio` است. این گزینه برای ارتباط دوسویه با سرورهای MCP راه‌دور از استریم HTTP استفاده می‌کند.

| فیلد                          | توضیح                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL از نوع HTTP یا HTTPS برای سرور راه‌دور (الزامی)                                      |
| `transport`                    | برای انتخاب این انتقال روی `"streamable-http"` تنظیم کنید؛ در صورت حذف، OpenClaw از `sse` استفاده می‌کند |
| `headers`                      | نگاشت اختیاری کلید-مقدار از سرآیندهای HTTP (برای مثال توکن‌های auth)                       |
| `connectionTimeoutMs`          | مهلت اتصال برای هر سرور بر حسب ms (اختیاری)                                         |
| `connectTimeout`               | مهلت اتصال برای هر سرور بر حسب ثانیه (اختیاری)                                    |
| `timeout` / `requestTimeoutMs` | مهلت درخواست MCP برای هر سرور بر حسب ثانیه یا ms                                        |
| `auth: "oauth"`                | استفاده از ذخیره‌سازی توکن OAuth در MCP و `openclaw mcp login`                                   |
| `sslVerify`                    | فقط برای endpointهای خصوصی HTTPS که صراحتاً مورد اعتماد هستند روی false تنظیم کنید                          |
| `clientCert` / `clientKey`     | مسیرهای گواهی و کلید کلاینت mTLS                                                  |
| `supportsParallelToolCalls`    | راهنمایی می‌کند که فراخوانی‌های هم‌زمان برای این سرور ایمن هستند                                    |

پیکربندی OpenClaw از `transport: "streamable-http"` به‌عنوان نگارش canonical استفاده می‌کند. مقادیر CLI-native MCP مانند `type: "http"` وقتی از طریق `openclaw mcp set` ذخیره شوند پذیرفته می‌شوند و در پیکربندی موجود با `openclaw doctor --fix` اصلاح می‌شوند، اما `transport` چیزی است که OpenClaw تعبیه‌شده مستقیماً مصرف می‌کند.

مثال:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
فرمان‌های رجیستری پل کانال را شروع نمی‌کنند. فقط `probe` و `doctor --probe` یک نشست زنده کلاینت MCP را باز می‌کنند تا اثبات کنند سرور هدف در دسترس است.
</Note>

## رابط کاربری کنترل

رابط کاربری کنترل در مرورگر شامل یک صفحه اختصاصی تنظیمات MCP در `/mcp` است. این صفحه تعداد سرورهای پیکربندی‌شده، خلاصه‌های enabled/OAuth/filter، ردیف‌های انتقال برای هر سرور، کنترل‌های فعال/غیرفعال‌سازی، فرمان‌های رایج CLI و یک ویرایشگر محدود به بخش پیکربندی `mcp` را نشان می‌دهد.

از این صفحه برای ویرایش‌های اپراتور و فهرست‌برداری سریع استفاده کنید. وقتی به اثبات زنده سرور نیاز دارید، از `openclaw mcp doctor --probe` یا `openclaw mcp probe` استفاده کنید.

گردش‌کار اپراتور:

1. رابط کاربری کنترل را باز کنید و **MCP** را انتخاب کنید.
2. کارت‌های خلاصه را برای مجموع، فعال‌شده، OAuth، و سرورهای فیلترشده بررسی کنید.
3. از هر ردیف سرور برای راهنماهای انتقال، احراز هویت، فیلتر، زمان‌پایان، و فرمان استفاده کنید.
4. وقتی می‌خواهید یک تعریف را نگه دارید اما آن را از کشف زمان اجرا کنار بگذارید، فعال‌بودن را تغییر وضعیت دهید.
5. بخش پیکربندی محدوده‌دار `mcp` را برای تغییرات ساختاری مانند سرورهای جدید، سرآیندها، TLS، فرادادهٔ OAuth، یا فیلترهای ابزار ویرایش کنید.
6. برای ماندگار کردن فقط پیکربندی، **ذخیره** را انتخاب کنید، یا برای اعمال از مسیر پیکربندی Gateway، **ذخیره و انتشار** را انتخاب کنید.
7. وقتی به اثبات زنده نیاز دارید که سرور ویرایش‌شده شروع می‌شود و ابزارها را فهرست می‌کند، `openclaw mcp doctor --probe` را اجرا کنید.

نکات:

- قطعه‌های فرمان نام سرورها را نقل‌قول می‌کنند تا نام‌های نامعمول در پوسته قابل کپی بمانند
- مقادیر نمایش‌داده‌شدهٔ شبیه URL، وقتی شامل اعتبارنامه‌های جاسازی‌شده باشند، پیش از رندر کردن پوشانده می‌شوند
- این صفحه به‌تنهایی انتقال‌های MCP را شروع نمی‌کند
- زمان‌های اجرای فعال ممکن است بسته به اینکه کدام فرایند مالک کلاینت‌های MCP است، به `openclaw mcp reload`، انتشار پیکربندی Gateway، یا راه‌اندازی دوبارهٔ فرایند نیاز داشته باشند

## محدودیت‌های فعلی

این صفحه پل را همان‌گونه که امروز عرضه شده است مستند می‌کند.

محدودیت‌های فعلی:

- کشف گفت‌وگو به فرادادهٔ مسیر نشست موجود Gateway وابسته است
- هیچ پروتکل push عمومی فراتر از آداپتور ویژهٔ Claude وجود ندارد
- هنوز ابزارهای ویرایش پیام یا واکنش وجود ندارند
- انتقال HTTP/SSE/streamable-http به یک سرور راه‌دور واحد وصل می‌شود؛ هنوز هیچ بالادست چندگانه‌ای وجود ندارد
- `permissions_list_open` فقط تأییدهایی را شامل می‌شود که هنگام اتصال پل مشاهده شده‌اند

## مرتبط

- [مرجع CLI](/fa/cli)
- [Plugins](/fa/cli/plugins)
