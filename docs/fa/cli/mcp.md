---
read_when:
    - اتصال Codex، Claude Code یا یک کلاینت MCP دیگر به کانال‌های پشتیبانی‌شده با OpenClaw
    - در حال اجرای `openclaw mcp serve`
    - مدیریت تعاریف سرور MCP ذخیره‌شده توسط OpenClaw
sidebarTitle: MCP
summary: گفت‌وگوهای کانال OpenClaw را از طریق MCP در دسترس قرار دهید و تعریف‌های ذخیره‌شدهٔ سرور MCP را مدیریت کنید
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:26:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` دو وظیفه دارد:

- اجرای OpenClaw به‌عنوان یک سرور MCP با `openclaw mcp serve`
- مدیریت تعریف‌های سرور MCP خروجیِ مدیریت‌شده توسط OpenClaw با `list`، `show`، `status`، `doctor`، `probe`، `add`، `set`، `configure`، `tools`، `login`، `logout`، `reload` و `unset`

به بیان دیگر:

- `serve` یعنی OpenClaw به‌عنوان یک سرور MCP عمل می‌کند
- زیرفرمان‌های دیگر یعنی OpenClaw به‌عنوان یک رجیستری سمت کلاینت MCP برای سرورهای MCP عمل می‌کند که زمان‌های اجرای آن ممکن است بعداً مصرف کنند

<Note>
  `list`، `show`، `set` و `unset` فقط ورودی‌های `mcp.servers` مدیریت‌شده توسط OpenClaw را در پیکربندی OpenClaw می‌خوانند و می‌نویسند. آن‌ها شامل سرورهای mcporter از `config/mcporter.json` نمی‌شوند؛ برای آن رجیستری از `mcporter list` استفاده کنید.
</Note>

زمانی از [`openclaw acp`](/fa/cli/acp) استفاده کنید که OpenClaw باید خودش یک نشست هارنس کدنویسی را میزبانی کند و آن زمان اجرا را از طریق ACP مسیریابی کند.

## انتخاب مسیر درست MCP

OpenClaw چندین سطح MCP دارد. گزینه‌ای را انتخاب کنید که با مالک زمان اجرای عامل و مالک ابزارها مطابقت دارد.

| هدف                                                                | استفاده                                                                  | دلیل                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| اجازه دادن به یک کلاینت MCP خارجی برای خواندن/ارسال گفت‌وگوهای کانال OpenClaw | `openclaw mcp serve`                                                 | OpenClaw سرور MCP است و گفت‌وگوهای پشتیبانی‌شده توسط Gateway را از طریق stdio ارائه می‌کند.                                 |
| ذخیره سرورهای MCP شخص ثالث برای اجراهای عامل مدیریت‌شده توسط OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw رجیستری سمت کلاینت MCP است و بعداً آن سرورها را به زمان‌های اجرای واجد شرایط تزریق می‌کند.               |
| بررسی یک سرور ذخیره‌شده بدون اجرای یک نوبت عامل                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` و `doctor` پیکربندی را بررسی می‌کنند؛ `probe` یک اتصال زنده MCP باز می‌کند و قابلیت‌ها را فهرست می‌کند.               |
| ویرایش پیکربندی MCP از مرورگر                                      | Control UI `/mcp`                                                    | این صفحه موجودی، فعال‌سازی، خلاصه‌های OAuth/فیلتر، راهنمای فرمان‌ها و یک ویرایشگر محدود به دامنه `mcp` را نشان می‌دهد.         |
| دادن یک سرور MCP بومی محدود به دامنه به app-server کدکس                    | `mcp.servers.<name>.codex`                                           | بلوک `codex` فقط بر تزریق رشته app-server کدکس اثر می‌گذارد و پیش از تحویل پیکربندی بومی حذف می‌شود. |
| اجرای نشست‌های هارنس میزبانی‌شده توسط ACP                                     | [`openclaw acp`](/fa/cli/acp) و [عامل‌های ACP](/fa/tools/acp-agents-setup) | حالت پل ACP تزریق سرور MCP برای هر نشست را نمی‌پذیرد؛ به‌جای آن پل‌های gateway/Plugin را پیکربندی کنید.     |

<Tip>
اگر مطمئن نیستید به کدام مسیر نیاز دارید، با `openclaw mcp status --verbose` شروع کنید. این فرمان بدون راه‌اندازی هیچ سرور MCP، آنچه OpenClaw ذخیره کرده است را نشان می‌دهد.
</Tip>

## OpenClaw به‌عنوان سرور MCP

این مسیر `openclaw mcp serve` است.

### چه زمانی از `serve` استفاده کنید

از `openclaw mcp serve` استفاده کنید وقتی:

- Codex، Claude Code یا یک کلاینت MCP دیگر باید مستقیماً با گفت‌وگوهای کانالی پشتیبانی‌شده توسط OpenClaw صحبت کند
- از قبل یک OpenClaw Gateway محلی یا راه‌دور با نشست‌های مسیریابی‌شده دارید
- یک سرور MCP می‌خواهید که روی بک‌اندهای کانالی OpenClaw کار کند، به‌جای اجرای پل‌های جداگانه برای هر کانال

زمانی به‌جای آن از [`openclaw acp`](/fa/cli/acp) استفاده کنید که OpenClaw باید خودش زمان اجرای کدنویسی را میزبانی کند و نشست عامل را داخل OpenClaw نگه دارد.

### نحوه کار

`openclaw mcp serve` یک سرور stdio MCP راه‌اندازی می‌کند. کلاینت MCP مالک آن فرایند است. تا زمانی که کلاینت نشست stdio را باز نگه دارد، پل از طریق WebSocket به یک OpenClaw Gateway محلی یا راه‌دور متصل می‌شود و گفت‌وگوهای کانالی مسیریابی‌شده را از طریق MCP ارائه می‌کند.

<Steps>
  <Step title="کلاینت پل را ایجاد می‌کند">
    کلاینت MCP، `openclaw mcp serve` را ایجاد می‌کند.
  </Step>
  <Step title="پل به Gateway متصل می‌شود">
    پل از طریق WebSocket به OpenClaw Gateway متصل می‌شود.
  </Step>
  <Step title="نشست‌ها به گفت‌وگوهای MCP تبدیل می‌شوند">
    نشست‌های مسیریابی‌شده به گفت‌وگوهای MCP و ابزارهای رونوشت/تاریخچه تبدیل می‌شوند.
  </Step>
  <Step title="صف رویدادهای زنده">
    رویدادهای زنده تا زمانی که پل متصل است در حافظه صف می‌شوند.
  </Step>
  <Step title="ارسال اختیاری Claude">
    اگر حالت کانال Claude فعال باشد، همان نشست می‌تواند اعلان‌های ارسالی ویژه Claude را نیز دریافت کند.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="رفتار مهم">
    - وضعیت صف زنده هنگام اتصال پل شروع می‌شود
    - تاریخچه رونوشت قدیمی‌تر با `messages_read` خوانده می‌شود
    - اعلان‌های ارسالی Claude فقط تا زمانی وجود دارند که نشست MCP زنده باشد
    - وقتی کلاینت قطع می‌شود، پل خارج می‌شود و صف زنده از بین می‌رود
    - نقاط ورود عامل یک‌باره مانند `openclaw agent` و `openclaw infer model run` هر زمان اجرای MCP همراهی را که باز می‌کنند پس از کامل شدن پاسخ بازنشسته می‌کنند، بنابراین اجراهای اسکریپتی تکراری فرایندهای فرزند stdio MCP را انباشته نمی‌کنند
    - سرورهای stdio MCP که توسط OpenClaw راه‌اندازی می‌شوند، چه همراه باشند چه پیکربندی‌شده توسط کاربر، هنگام خاموشی به‌صورت یک درخت فرایندی متوقف می‌شوند، بنابراین زیرفرایندهای فرزندی که توسط سرور شروع شده‌اند پس از خروج کلاینت stdio والد باقی نمی‌مانند
    - حذف یا بازنشانی یک نشست، کلاینت‌های MCP آن نشست را از مسیر مشترک پاک‌سازی زمان اجرا کنار می‌گذارد، بنابراین هیچ اتصال stdio باقی‌مانده‌ای وابسته به یک نشست حذف‌شده وجود ندارد

  </Accordion>
</AccordionGroup>

### انتخاب حالت کلاینت

از همان پل به دو روش متفاوت استفاده کنید:

<Tabs>
  <Tab title="کلاینت‌های عمومی MCP">
    فقط ابزارهای استاندارد MCP. از `conversations_list`، `messages_read`، `events_poll`، `events_wait`، `messages_send` و ابزارهای تأیید استفاده کنید.
  </Tab>
  <Tab title="Claude Code">
    ابزارهای استاندارد MCP به‌همراه آداپتر کانال ویژه Claude. `--claude-channel-mode on` را فعال کنید یا مقدار پیش‌فرض `auto` را نگه دارید.
  </Tab>
</Tabs>

<Note>
امروز، `auto` همانند `on` رفتار می‌کند. هنوز تشخیص قابلیت کلاینت وجود ندارد.
</Note>

### آنچه `serve` ارائه می‌کند

پل از فراداده مسیر نشست موجود در Gateway برای ارائه گفت‌وگوهای پشتیبانی‌شده توسط کانال استفاده می‌کند. یک گفت‌وگو زمانی ظاهر می‌شود که OpenClaw از قبل وضعیت نشست با مسیری شناخته‌شده داشته باشد، مانند:

- `channel`
- فراداده گیرنده یا مقصد
- `accountId` اختیاری
- `threadId` اختیاری

این به کلاینت‌های MCP یک مکان می‌دهد برای:

- فهرست کردن گفت‌وگوهای مسیریابی‌شده اخیر
- خواندن تاریخچه رونوشت اخیر
- منتظر ماندن برای رویدادهای ورودی جدید
- ارسال پاسخ از همان مسیر
- دیدن درخواست‌های تأییدی که هنگام اتصال پل وارد می‌شوند

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
  <Tab title="Gateway راه‌دور (گذرواژه)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="پرگویی / خاموش کردن Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ابزارهای پل

پل فعلی این ابزارهای MCP را ارائه می‌کند:

<AccordionGroup>
  <Accordion title="conversations_list">
    گفت‌وگوهای اخیر پشتیبانی‌شده توسط نشست را که از قبل فراداده مسیر در وضعیت نشست Gateway دارند فهرست می‌کند.

    فیلترهای مفید:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    یک گفت‌وگو را بر اساس `session_key` با استفاده از جست‌وجوی مستقیم نشست Gateway برمی‌گرداند.
  </Accordion>
  <Accordion title="messages_read">
    پیام‌های رونوشت اخیر را برای یک گفت‌وگوی پشتیبانی‌شده توسط نشست می‌خواند.
  </Accordion>
  <Accordion title="attachments_fetch">
    بلوک‌های محتوای غیرمتنی پیام را از یک پیام رونوشت استخراج می‌کند. این یک نمای فراداده روی محتوای رونوشت است، نه یک مخزن مستقل و بادوام برای blob پیوست.
  </Accordion>
  <Accordion title="events_poll">
    رویدادهای زنده صف‌شده را از زمان یک نشانگر عددی می‌خواند.
  </Accordion>
  <Accordion title="events_wait">
    تا رسیدن رویداد صف‌شده منطبق بعدی یا پایان مهلت، long-poll می‌کند.

    زمانی از این استفاده کنید که یک کلاینت MCP عمومی به تحویل نزدیک به بی‌درنگ بدون پروتکل ارسال ویژه Claude نیاز دارد.

  </Accordion>
  <Accordion title="messages_send">
    متن را از همان مسیری که از قبل روی نشست ثبت شده است برمی‌گرداند.

    رفتار فعلی:

    - به یک مسیر گفت‌وگوی موجود نیاز دارد
    - از کانال، گیرنده، شناسه حساب و شناسه رشته نشست استفاده می‌کند
    - فقط متن ارسال می‌کند

  </Accordion>
  <Accordion title="permissions_list_open">
    درخواست‌های تأیید exec/Plugin در انتظار را که پل از زمان اتصال به Gateway مشاهده کرده است فهرست می‌کند.
  </Accordion>
  <Accordion title="permissions_respond">
    یک درخواست تأیید exec/Plugin در انتظار را با این گزینه‌ها حل می‌کند:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### مدل رویداد

پل تا زمانی که متصل است یک صف رویداد در حافظه نگه می‌دارد.

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
- بک‌لاگ بادوام باید با `messages_read` خوانده شود

</Warning>

### اعلان‌های کانال Claude

پل می‌تواند اعلان‌های کانال ویژه Claude را نیز ارائه کند. این معادل OpenClaw برای آداپتر کانال Claude Code است: ابزارهای استاندارد MCP همچنان در دسترس می‌مانند، اما پیام‌های ورودی زنده می‌توانند به‌صورت اعلان‌های MCP ویژه Claude نیز برسند.

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

- پیام‌های رونوشت ورودی `user` به‌صورت `notifications/claude/channel` ارسال می‌شوند
- درخواست‌های مجوز Claude که از طریق MCP دریافت می‌شوند در حافظه ردیابی می‌شوند
- اگر مالک فرمان در گفت‌وگوی پیوندشده بعداً `yes abcde` یا `no abcde` را ارسال کند، پل آن را به `notifications/claude/channel/permission` تبدیل می‌کند
- این اعلان‌ها فقط برای نشست زنده هستند؛ اگر کلاینت MCP قطع شود، هدف ارسالی وجود ندارد

این رفتار عمداً ویژه کلاینت است. کلاینت‌های عمومی MCP باید به ابزارهای استاندارد نظرسنجی تکیه کنند.

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

برای بیشتر کلاینت‌های عمومی MCP، با سطح ابزار استاندارد شروع کنید و حالت Claude را نادیده بگیرید. حالت Claude را فقط برای کلاینت‌هایی روشن کنید که واقعاً روش‌های اعلان ویژه Claude را می‌فهمند.

### گزینه‌ها

`openclaw mcp serve` پشتیبانی می‌کند:

<ParamField path="--url" type="string">
  نشانی WebSocket ‏Gateway.
</ParamField>
<ParamField path="--token" type="string">
  توکن Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  خواندن توکن از فایل.
</ParamField>
<ParamField path="--password" type="string">
  گذرواژه Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  خواندن گذرواژه از فایل.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  حالت اعلان Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  لاگ‌های تفصیلی روی stderr.
</ParamField>

<Tip>
در صورت امکان، به‌جای اسرار درون‌خطی از `--token-file` یا `--password-file` استفاده کنید.
</Tip>

### مرز امنیت و اعتماد

پل، مسیریابی را از خود ابداع نمی‌کند. فقط گفتگوهایی را در معرض دسترس قرار می‌دهد که Gateway از قبل می‌داند چگونه مسیریابی کند.

یعنی:

- فهرست‌های مجاز فرستنده، جفت‌سازی، و اعتماد در سطح کانال همچنان متعلق به پیکربندی کانال OpenClaw زیربنایی هستند
- `messages_send` فقط می‌تواند از طریق یک مسیر ذخیره‌شده موجود پاسخ دهد
- وضعیت تأیید فقط برای نشست فعلی پل، زنده/درون‌حافظه‌ای است
- احراز هویت پل باید از همان کنترل‌های توکن یا گذرواژه Gateway استفاده کند که برای هر کلاینت Gateway راه‌دور دیگر به آن اعتماد می‌کنید

اگر گفتگویی در `conversations_list` وجود ندارد، علت معمولاً پیکربندی MCP نیست. علت، نبودن یا ناقص بودن فراداده مسیر در نشست Gateway زیربنایی است.

### آزمون

OpenClaw برای این پل یک دودآزمایی Docker قطعی ارائه می‌کند:

```bash
pnpm test:docker:mcp-channels
```

این دودآزمایی:

- یک کانتینر Gateway با داده اولیه راه‌اندازی می‌کند
- کانتینر دومی را راه‌اندازی می‌کند که `openclaw mcp serve` را اجرا می‌کند
- کشف گفتگو، خواندن رونوشت، خواندن فراداده پیوست، رفتار صف رویداد زنده، و مسیریابی ارسال خروجی را راستی‌آزمایی می‌کند
- اعلان‌های کانال و مجوز به سبک Claude را روی پل MCP واقعی stdio اعتبارسنجی می‌کند

این سریع‌ترین راه برای اثبات کارکرد پل بدون اتصال یک حساب واقعی Telegram، Discord، یا iMessage به اجرای آزمون است.

برای زمینه گسترده‌تر آزمون، [آزمون](/fa/help/testing) را ببینید.

### عیب‌یابی

<AccordionGroup>
  <Accordion title="هیچ گفتگویی برگردانده نمی‌شود">
    معمولاً یعنی نشست Gateway از قبل قابل مسیریابی نیست. تأیید کنید که نشست زیربنایی فراداده مسیرِ کانال/ارائه‌دهنده، گیرنده، و حساب/رشته اختیاری را ذخیره کرده است.
  </Accordion>
  <Accordion title="events_poll یا events_wait پیام‌های قدیمی‌تر را از دست می‌دهد">
    مورد انتظار است. صف زنده وقتی پل متصل می‌شود شروع می‌شود. تاریخچه رونوشت قدیمی‌تر را با `messages_read` بخوانید.
  </Accordion>
  <Accordion title="اعلان‌های Claude نمایش داده نمی‌شوند">
    همه این موارد را بررسی کنید:

    - کلاینت، نشست MCP ‏stdio را باز نگه داشته است
    - `--claude-channel-mode` برابر `on` یا `auto` است
    - کلاینت واقعاً متدهای اعلان اختصاصی Claude را می‌فهمد
    - پیام ورودی پس از اتصال پل رخ داده است

  </Accordion>
  <Accordion title="تأییدها وجود ندارند">
    `permissions_list_open` فقط درخواست‌های تأییدی را نشان می‌دهد که هنگام اتصال پل مشاهده شده‌اند. این یک API ماندگار برای تاریخچه تأیید نیست.
  </Accordion>
</AccordionGroup>

## OpenClaw به‌عنوان رجیستری کلاینت MCP

این مسیر `openclaw mcp list`، `show`، `status`، `doctor`، `probe`، `add`، `set`،
`configure`، `tools`، `login`، `logout`، `reload`، و `unset` است.

این فرمان‌ها OpenClaw را از طریق MCP در معرض دسترس قرار نمی‌دهند. آن‌ها تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` در پیکربندی OpenClaw مدیریت می‌کنند. آن‌ها سرورهای mcporter را از `config/mcporter.json` نمی‌خوانند.

این تعریف‌های ذخیره‌شده برای runtimeهایی هستند که OpenClaw بعداً راه‌اندازی یا پیکربندی می‌کند، مانند OpenClaw توکار و adapterهای runtime دیگر. OpenClaw تعریف‌ها را به‌صورت مرکزی ذخیره می‌کند تا آن runtimeها نیاز نداشته باشند فهرست‌های تکراری سرور MCP خودشان را نگه دارند.

<AccordionGroup>
  <Accordion title="رفتار مهم">
    - این فرمان‌ها فقط پیکربندی OpenClaw را می‌خوانند یا می‌نویسند
    - `status`، `list`، `show`، `doctor` بدون `--probe`، `set`، `configure`، `tools`، `logout`، `reload`، و `unset` به سرور MCP هدف وصل نمی‌شوند
    - `login` جریان شبکه OAuth ‏MCP را برای سرور HTTP پیکربندی‌شده اجرا می‌کند و اعتبارنامه‌های local حاصل را ذخیره می‌کند
    - `status --verbose` بدون اتصال، transport، احراز هویت، timeout، filter، و راهنمایی‌های فراخوانی موازی ابزار را چاپ می‌کند
    - `doctor` تعریف‌های ذخیره‌شده را برای مشکلات راه‌اندازی local مانند فرمان‌های stdio گمشده، دایرکتوری‌های کاری نامعتبر، فایل‌های TLS گمشده، سرورهای غیرفعال، مقادیر حساس header/env به‌صورت literal، و مجوز OAuth ناقص بررسی می‌کند
    - `doctor --probe` پس از موفقیت بررسی‌های ایستا، همان اثبات اتصال زنده `probe` را اضافه می‌کند
    - `probe` به سرور انتخاب‌شده یا همه سرورهای پیکربندی‌شده وصل می‌شود، ابزارها را فهرست می‌کند، و قابلیت‌ها/عیب‌یابی‌ها را گزارش می‌دهد
    - `add` از flagها یک تعریف می‌سازد و پیش از ذخیره آن را probe می‌کند، مگر اینکه `--no-probe` تنظیم شده باشد یا ابتدا به مجوز OAuth نیاز باشد
    - adapterهای runtime در زمان اجرا تصمیم می‌گیرند واقعاً از کدام شکل‌های transport پشتیبانی کنند
    - `enabled: false` سرور را ذخیره نگه می‌دارد اما آن را از کشف runtime توکار کنار می‌گذارد
    - `timeout` و `connectTimeout` مهلت‌های درخواست و اتصال هر سرور را بر حسب ثانیه تنظیم می‌کنند
    - `supportsParallelToolCalls: true` سرورهایی را علامت‌گذاری می‌کند که adapterها می‌توانند همزمان فراخوانی کنند
    - سرورهای HTTP می‌توانند از headerهای ایستا، ورود OAuth، کنترل راستی‌آزمایی TLS، و مسیرهای گواهی/کلید mTLS استفاده کنند
    - OpenClaw توکار، ابزارهای MCP پیکربندی‌شده را در پروفایل‌های ابزار معمول `coding` و `messaging` در معرض دسترس قرار می‌دهد؛ `minimal` همچنان آن‌ها را پنهان می‌کند، و `tools.deny: ["bundle-mcp"]` آن‌ها را صریحاً غیرفعال می‌کند
    - `toolFilter.include` و `toolFilter.exclude` برای هر سرور، ابزارهای MCP کشف‌شده را پیش از تبدیل شدن به ابزارهای OpenClaw فیلتر می‌کنند
    - سرورهایی که resources یا prompts را اعلام می‌کنند، ابزارهای کمکی برای فهرست/خواندن resources و فهرست/واکشی prompts نیز ارائه می‌کنند؛ آن نام‌های کمکی تولیدشده (`resources_list`، `resources_read`، `prompts_list`، `prompts_get`) از همان filter include/exclude استفاده می‌کنند
    - تغییرات پویا در فهرست ابزار MCP، catalog کش‌شده آن نشست را نامعتبر می‌کند؛ کشف/استفاده بعدی از سرور تازه‌سازی می‌کند
    - شکست‌های تکراری درخواست/پروتکل ابزار MCP آن سرور را برای مدت کوتاهی متوقف می‌کند تا یک سرور خراب کل نوبت را مصرف نکند
    - runtimeهای MCP بسته‌بندی‌شده با دامنه نشست، پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه زمان بیکاری جمع‌آوری می‌شوند (پیش‌فرض ۱۰ دقیقه؛ برای غیرفعال کردن، `0` تنظیم کنید) و اجراهای توکار یک‌باره آن‌ها را در پایان اجرا پاک‌سازی می‌کنند

  </Accordion>
</AccordionGroup>

adapterهای runtime ممکن است این رجیستری مشترک را به شکلی normalize کنند که کلاینت پایین‌دستی آن‌ها انتظار دارد. برای مثال، OpenClaw توکار مقادیر `transport` ‏OpenClaw را مستقیماً مصرف می‌کند، در حالی که Claude Code و Gemini مقادیر `type` بومی CLI مانند `http`، `sse`، یا `stdio` را دریافت می‌کنند.

app-server ‏Codex همچنین یک بلوک اختیاری `codex` را روی هر سرور رعایت می‌کند. این
فراداده projection ‏OpenClaw فقط برای رشته‌های app-server ‏Codex است؛ نشست‌های ACP،
پیکربندی عمومی harness ‏Codex، یا adapterهای runtime دیگر را تغییر نمی‌دهد.
از `codex.agents` غیرخالی استفاده کنید تا یک سرور را فقط به idهای عامل مشخص
OpenClaw project کنید. فهرست‌های عامل خالی، blank، یا نامعتبر توسط اعتبارسنجی
پیکربندی رد می‌شوند و به‌جای global شدن، توسط مسیر projection runtime حذف می‌شوند.
از `codex.defaultToolsApprovalMode` (`auto`، `prompt`، یا `approve`) استفاده کنید
تا `default_tools_approval_mode` بومی Codex را برای یک سرور مورد اعتماد صادر کنید.
OpenClaw پیش از تحویل پیکربندی بومی `mcp_servers` به Codex، فراداده `codex` را حذف می‌کند.

### تعریف‌های ذخیره‌شده سرور MCP

OpenClaw همچنین یک رجیستری سبک سرور MCP را برای سطح‌هایی که تعریف‌های MCP مدیریت‌شده توسط OpenClaw می‌خواهند، در پیکربندی ذخیره می‌کند.

فرمان‌ها:

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
- `show` بدون نام، کل شیء سرور MCP پیکربندی‌شده را چاپ می‌کند.
- `status` ‏transportهای پیکربندی‌شده را بدون اتصال دسته‌بندی می‌کند. `--verbose` جزئیات راه‌اندازی، timeout، OAuth، filter، و فراخوانی موازی resolve‌شده را شامل می‌شود.
- `doctor` بررسی‌های ایستا را بدون اتصال انجام می‌دهد. وقتی فرمان باید وصل شدن سرورهای فعال را نیز راستی‌آزمایی کند، `--probe` را اضافه کنید.
- `probe` وصل می‌شود و تعداد ابزارها، پشتیبانی resources/prompts، پشتیبانی list-change، و عیب‌یابی‌ها را گزارش می‌دهد.
- `add` ‏flagهای stdio مانند `--command`، `--arg`، `--env`، و `--cwd`، یا flagهای HTTP مانند `--url`، `--transport`، `--header`، `--auth oauth`، TLS، timeout، و flagهای انتخاب ابزار را می‌پذیرد.
- `set` انتظار دارد یک مقدار شیء JSON روی خط فرمان دریافت کند.
- `configure` فعال‌سازی، filterهای ابزار، timeoutها، OAuth، TLS، و راهنمایی‌های فراخوانی موازی ابزار را بدون جایگزین کردن کل تعریف سرور به‌روزرسانی می‌کند.
- `tools` ‏filterهای ابزار هر سرور را به‌روزرسانی می‌کند. ورودی‌های include/exclude نام ابزارهای MCP و globهای ساده `*` هستند.
- `login` جریان OAuth را برای سرورهای HTTP پیکربندی‌شده با `auth: "oauth"` اجرا می‌کند. اجرای اول یک URL مجوز چاپ می‌کند؛ پس از تأیید، با `--code` دوباره اجرا کنید.
- `logout` اعتبارنامه‌های OAuth ذخیره‌شده را برای سرور نام‌گذاری‌شده پاک می‌کند، بدون اینکه تعریف ذخیره‌شده سرور را حذف کند.
- `reload` ‏runtimeهای MCP درون‌فرایندی کش‌شده را dispose می‌کند. فرایندهای Gateway یا عامل در فرایندی دیگر همچنان به مسیر reload یا restart خودشان نیاز دارند.
- برای سرورهای Streamable HTTP ‏MCP از `transport: "streamable-http"` استفاده کنید. `openclaw mcp set` همچنین برای سازگاری، `type: "http"` بومی CLI را به همان شکل پیکربندی canonical normalize می‌کند.
- اگر سرور نام‌گذاری‌شده وجود نداشته باشد، `unset` شکست می‌خورد.

مثال‌ها:

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

این مثال‌ها فقط تعریف‌های سرور را ذخیره می‌کنند. سپس `openclaw mcp doctor --probe` را اجرا کنید تا ثابت شود سرور شروع می‌شود و ابزارها را در معرض دسترس قرار می‌دهد.

<Tabs>
  <Tab title="سیستم فایل">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    دامنه سرورهای سیستم فایل را به کوچک‌ترین درخت دایرکتوری‌ای محدود کنید که عامل باید بخواند یا ویرایش کند.

  </Tab>
  <Tab title="حافظه">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    اگر سرور ابزارهای نوشتنی ارائه می‌کند که نباید برای عامل‌های معمولی در دسترس باشند، از filter ابزار استفاده کنید.

  </Tab>
  <Tab title="اسکریپت local">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` بررسی می‌کند که `cwd` وجود دارد و فرمان از محیط پیکربندی‌شده resolve می‌شود.

  </Tab>
  <Tab title="HTTP راه‌دور">
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

    وقتی سرور راه‌دور از OAuth پشتیبانی می‌کند، از OAuth استفاده کنید. اگر سرور به سرآیندهای ایستا نیاز دارد، از commit کردن توکن‌های حاملِ لفظی خودداری کنید.

  </Tab>
  <Tab title="دسکتاپ/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    سرورهای کنترل مستقیم دسکتاپ، مجوزهای فرایندی را که اجرا می‌کنند به ارث می‌برند. از فیلترهای محدود ابزار و اعلان‌های مجوز در سطح سیستم‌عامل استفاده کنید.

  </Tab>
</Tabs>

### شکل‌های خروجی JSON

برای اسکریپت‌ها و داشبوردها از `--json` استفاده کنید. مجموعه فیلدها می‌تواند در طول زمان بزرگ‌تر شود، بنابراین مصرف‌کننده‌ها باید کلیدهای ناشناخته را نادیده بگیرند.

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

    وقتی هر سرور فعالِ بررسی‌شده خطا داشته باشد، `doctor --json` با کد غیرصفر خارج می‌شود. هشدارها گزارش می‌شوند، اما به‌تنهایی باعث شکست فرمان نمی‌شوند.

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

    `probe` یک نشست زنده کلاینت MCP باز می‌کند. از آن برای اثبات دسترس‌پذیری و قابلیت‌ها استفاده کنید، نه برای ممیزی‌های پیکربندی ایستا.

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

| فیلد                       | توضیح                                  |
| -------------------------- | -------------------------------------- |
| `command`                  | فایل اجرایی برای اجرا (الزامی)         |
| `args`                     | آرایه‌ای از آرگومان‌های خط فرمان       |
| `env`                      | متغیرهای محیطی اضافی                   |
| `cwd` / `workingDirectory` | دایرکتوری کاری برای فرایند             |

<Warning>
**فیلتر ایمنی env در Stdio**

OpenClaw کلیدهای env مربوط به راه‌اندازی مفسر را که می‌توانند نحوه شروع یک سرور stdio MCP را پیش از نخستین RPC تغییر دهند رد می‌کند، حتی اگر در بلوک `env` سرور ظاهر شوند. کلیدهای مسدودشده شامل `BASHOPTS`، `FPATH`، `KSH_ENV`، `NODE_OPTIONS`، `NODE_REDIRECT_WARNINGS`، `NODE_REPL_EXTERNAL_MODULE`، `NODE_REPL_HISTORY`، `NODE_V8_COVERAGE`، `PYTHONSTARTUP`، `PYTHONPATH`، `PERL5OPT`، `RUBYOPT`، `SHELLOPTS`، `PS4`، `TCLLIBPATH` و متغیرهای مشابه کنترل زمان اجرا هستند. راه‌اندازی این موارد را با خطای پیکربندی رد می‌کند تا نتوانند یک مقدمه ضمنی تزریق کنند، مفسر را عوض کنند، دیباگر را فعال کنند، یا خروجی زمان اجرا را علیه فرایند stdio بازهدایت کنند. متغیرهای env معمولیِ مربوط به اعتبارنامه، پروکسی و سرورهای خاص (`GITHUB_TOKEN`، `HTTP_PROXY`، `*_API_KEY` سفارشی و غیره) تحت تأثیر نیستند.

اگر سرور MCP شما واقعاً به یکی از متغیرهای مسدودشده نیاز دارد، آن را به‌جای زیر `env` سرور stdio، روی فرایند میزبان Gateway تنظیم کنید.
</Warning>

### انتقال SSE / HTTP

از طریق HTTP Server-Sent Events به یک سرور MCP راه‌دور متصل می‌شود.

| فیلد                           | توضیح                                                          |
| ------------------------------ | -------------------------------------------------------------- |
| `url`                          | URL از نوع HTTP یا HTTPS برای سرور راه‌دور (الزامی)            |
| `headers`                      | نگاشت اختیاری کلید-مقدار از سرآیندهای HTTP (برای مثال توکن‌های احراز هویت) |
| `connectionTimeoutMs`          | مهلت اتصال برای هر سرور بر حسب میلی‌ثانیه (اختیاری)           |
| `connectTimeout`               | مهلت اتصال برای هر سرور بر حسب ثانیه (اختیاری)                |
| `timeout` / `requestTimeoutMs` | مهلت درخواست MCP برای هر سرور بر حسب ثانیه یا میلی‌ثانیه      |
| `auth: "oauth"`                | از ذخیره‌سازی توکن OAuth برای MCP و `openclaw mcp login` استفاده کنید |
| `sslVerify`                    | فقط برای endpointهای خصوصی HTTPS که صراحتاً مورد اعتمادند، روی false تنظیم کنید |
| `clientCert` / `clientKey`     | مسیرهای گواهی و کلید کلاینت mTLS                              |
| `supportsParallelToolCalls`    | اشاره می‌کند که فراخوانی‌های هم‌زمان برای این سرور ایمن هستند |

نمونه:

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

مقادیر حساس در `url` (userinfo) و `headers` در گزارش‌ها و خروجی وضعیت redact می‌شوند. `openclaw mcp doctor` وقتی ورودی‌های ظاهراً حساس در `headers` یا `env` شامل مقادیر لفظی باشند هشدار می‌دهد، تا اپراتورها بتوانند آن مقادیر را از پیکربندی commitشده بیرون ببرند.

### گردش‌کار OAuth

OAuth برای سرورهای HTTP MCP است که جریان OAuth مربوط به MCP را اعلام می‌کنند. وقتی `auth: "oauth"` برای یک سرور فعال باشد، سرآیندهای ایستای `Authorization` برای آن سرور نادیده گرفته می‌شوند.

<Steps>
  <Step title="ذخیره سرور">
    سرور را با `auth: "oauth"` و هر فراداده اختیاری OAuth اضافه یا به‌روزرسانی کنید.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="شروع ورود">
    login را اجرا کنید تا درخواست مجوز ساخته شود.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw نشانی URL مجوز را چاپ می‌کند و وضعیت موقت verifier مربوط به OAuth را زیر دایرکتوری وضعیت OpenClaw ذخیره می‌کند.

  </Step>
  <Step title="پایان با کد">
    پس از تأیید در مرورگر، کد برگشتی را به OpenClaw بدهید.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="بررسی مجوز">
    از status یا doctor استفاده کنید تا تأیید کنید توکن‌ها حاضر هستند.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="پاک کردن اعتبارنامه‌ها">
    Logout اعتبارنامه‌های ذخیره‌شده OAuth را حذف می‌کند، اما تعریف ذخیره‌شده سرور را نگه می‌دارد.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

اگر ارائه‌دهنده توکن‌ها را rotate می‌کند یا وضعیت مجوز گیر می‌کند، `openclaw mcp logout <name>` را اجرا کنید و سپس `login` را تکرار کنید. `logout` می‌تواند اعتبارنامه‌های یک سرور HTTP ذخیره‌شده را حتی پس از حذف `auth: "oauth"` از پیکربندی پاک کند، تا وقتی که نام سرور و URL همچنان ورودی مخزن اعتبارنامه را شناسایی کنند.

### انتقال HTTP قابل‌استریم

`streamable-http` یک گزینه انتقال اضافی در کنار `sse` و `stdio` است. از استریم HTTP برای ارتباط دوسویه با سرورهای MCP راه‌دور استفاده می‌کند.

| فیلد                           | توضیح                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `url`                          | URL از نوع HTTP یا HTTPS برای سرور راه‌دور (الزامی)                                   |
| `transport`                    | برای انتخاب این انتقال روی `"streamable-http"` تنظیم کنید؛ اگر حذف شود، OpenClaw از `sse` استفاده می‌کند |
| `headers`                      | نگاشت اختیاری کلید-مقدار از سرآیندهای HTTP (برای مثال توکن‌های احراز هویت)           |
| `connectionTimeoutMs`          | مهلت اتصال برای هر سرور بر حسب میلی‌ثانیه (اختیاری)                                  |
| `connectTimeout`               | مهلت اتصال برای هر سرور بر حسب ثانیه (اختیاری)                                       |
| `timeout` / `requestTimeoutMs` | مهلت درخواست MCP برای هر سرور بر حسب ثانیه یا میلی‌ثانیه                             |
| `auth: "oauth"`                | از ذخیره‌سازی توکن OAuth برای MCP و `openclaw mcp login` استفاده کنید                 |
| `sslVerify`                    | فقط برای endpointهای خصوصی HTTPS که صراحتاً مورد اعتمادند، روی false تنظیم کنید      |
| `clientCert` / `clientKey`     | مسیرهای گواهی و کلید کلاینت mTLS                                                     |
| `supportsParallelToolCalls`    | اشاره می‌کند که فراخوانی‌های هم‌زمان برای این سرور ایمن هستند                        |

پیکربندی OpenClaw از `transport: "streamable-http"` به‌عنوان املای canonical استفاده می‌کند. مقدارهای `type: "http"` مربوط به MCP بومی CLI وقتی از طریق `openclaw mcp set` ذخیره شوند پذیرفته می‌شوند و در پیکربندی موجود توسط `openclaw doctor --fix` اصلاح می‌شوند، اما `transport` چیزی است که OpenClaw تعبیه‌شده مستقیماً مصرف می‌کند.

نمونه:

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
فرمان‌های registry، پل کانال را شروع نمی‌کنند. فقط `probe` و `doctor --probe` یک نشست زنده کلاینت MCP باز می‌کنند تا ثابت کنند سرور هدف قابل دسترسی است.
</Note>

## رابط کاربری کنترل

رابط کاربری کنترل در مرورگر یک صفحه تنظیمات اختصاصی MCP در `/mcp` دارد. این صفحه شمارش سرورهای پیکربندی‌شده، خلاصه‌های فعال/OAuth/فیلتر، ردیف‌های انتقال برای هر سرور، کنترل‌های فعال/غیرفعال کردن، فرمان‌های رایج CLI، و یک ویرایشگر محدود به دامنه برای بخش پیکربندی `mcp` را نشان می‌دهد.

از این صفحه برای ویرایش‌های اپراتور و inventory سریع استفاده کنید. وقتی به اثبات زنده سرور نیاز دارید، از `openclaw mcp doctor --probe` یا `openclaw mcp probe` استفاده کنید.

گردش‌کار اپراتور:

1. رابط کاربری کنترل را باز کنید و **MCP** را انتخاب کنید.
2. کارت‌های خلاصه را برای سرورهای کل، فعال‌شده، OAuth، و پالایش‌شده بررسی کنید.
3. از ردیف هر سرور برای نکات انتقال، احراز هویت، پالایه، وقفه زمانی، و فرمان استفاده کنید.
4. وقتی می‌خواهید یک تعریف را نگه دارید اما آن را از کشف در زمان اجرا کنار بگذارید، فعال‌سازی را تغییر دهید.
5. بخش پیکربندی محدوده‌دار `mcp` را برای تغییرات ساختاری مانند سرورهای جدید، سرآیندها، TLS، فراداده OAuth، یا پالایه‌های ابزار ویرایش کنید.
6. **ذخیره** را برای ماندگار کردن فقط پیکربندی انتخاب کنید، یا **ذخیره و انتشار** را برای اعمال از مسیر پیکربندی Gateway انتخاب کنید.
7. وقتی به اثبات زنده نیاز دارید که سرور ویرایش‌شده شروع می‌شود و ابزارها را فهرست می‌کند، `openclaw mcp doctor --probe` را اجرا کنید.

یادداشت‌ها:

- قطعه‌های فرمان نام سرورها را داخل نقل‌قول می‌گذارند تا نام‌های غیرمعمول در shell همچنان قابل کپی باشند
- مقادیر شبیه URL نمایش‌داده‌شده، وقتی اعتبارنامه‌های جاسازی‌شده داشته باشند، پیش از رندر پنهان‌سازی می‌شوند
- این صفحه خودش انتقال‌های MCP را شروع نمی‌کند
- اجراهای فعال بسته به اینکه کدام فرایند مالک کلاینت‌های MCP است، ممکن است به `openclaw mcp reload`، انتشار پیکربندی Gateway، یا راه‌اندازی مجدد فرایند نیاز داشته باشند

## محدودیت‌های فعلی

این صفحه پل را همان‌طور که امروز ارائه شده مستند می‌کند.

محدودیت‌های فعلی:

- کشف گفتگو به فراداده مسیر نشست موجود Gateway وابسته است
- هیچ پروتکل push عمومی فراتر از آداپتور اختصاصی Claude وجود ندارد
- هنوز ابزارهای ویرایش پیام یا واکنش وجود ندارند
- انتقال HTTP/SSE/streamable-http به یک سرور راه‌دور واحد وصل می‌شود؛ هنوز upstream چندگانه وجود ندارد
- `permissions_list_open` فقط تأییدهایی را شامل می‌شود که هنگام اتصال پل مشاهده شده‌اند

## مرتبط

- [مرجع CLI](/fa/cli)
- [Pluginها](/fa/cli/plugins)
