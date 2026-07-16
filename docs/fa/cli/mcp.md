---
read_when:
    - اتصال Codex، Claude Code یا یک کلاینت MCP دیگر به کانال‌های مبتنی بر OpenClaw
    - در حال اجرای `openclaw mcp serve`
    - مدیریت تعریف‌های سرور MCP ذخیره‌شده توسط OpenClaw
sidebarTitle: MCP
summary: گفت‌وگوهای کانال OpenClaw را از طریق MCP در دسترس قرار دهید و تعریف‌های ذخیره‌شدهٔ سرور MCP را مدیریت کنید
title: MCP
x-i18n:
    generated_at: "2026-07-16T16:31:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` دو وظیفه دارد:

- اجرای OpenClaw به‌عنوان سرور MCP با `openclaw mcp serve`
- مدیریت تعریف‌های سرور MCP خروجیِ تحت مدیریت OpenClaw با `list`، `show`، `status`، `doctor`، `probe`، `add`، `set`، `configure`، `tools`، `login`، `logout`، `reload` و `unset`

`serve` حالت عملکرد OpenClaw به‌عنوان سرور MCP است. زیرفرمان‌های دیگر، حالت عملکرد OpenClaw به‌عنوان رجیستری سمت کلاینت MCP برای سرورهایی هستند که زمان‌اجراهای خود OpenClaw ممکن است بعداً از آن‌ها استفاده کنند.

<Note>
  `list`، `show`، `set` و `unset` فقط ورودی‌های `mcp.servers` تحت مدیریت OpenClaw را در پیکربندی OpenClaw می‌خوانند و می‌نویسند. آن‌ها سرورهای mcporter موجود در `config/mcporter.json` را شامل نمی‌شوند؛ برای آن رجیستری از `mcporter list` استفاده کنید.
</Note>

وقتی OpenClaw باید خودش یک نشست محیط کدنویسی را میزبانی کند و آن زمان‌اجرا را از طریق ACP مسیریابی کند، از [`openclaw acp`](/fa/cli/acp) استفاده کنید.

## انتخاب مسیر مناسب MCP

| هدف                                                                | مورد استفاده                                                                  | دلیل                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| اجازه به یک کلاینت MCP خارجی برای خواندن/ارسال گفتگوهای کانال OpenClaw | `openclaw mcp serve`                                                 | OpenClaw سرور MCP است و گفتگوهای مبتنی بر Gateway را از طریق stdio ارائه می‌کند.                                 |
| ذخیره سرورهای MCP شخص ثالث برای اجراهای عامل تحت مدیریت OpenClaw        | `openclaw mcp add`، `set`، `configure`، `tools`، `login`             | OpenClaw رجیستری سمت کلاینت MCP است و بعداً آن سرورها را در زمان‌اجراهای واجد شرایط بازتاب می‌دهد.               |
| بررسی یک سرور ذخیره‌شده بدون اجرای نوبت عامل                  | `openclaw mcp status`، `doctor`، `probe`                             | `status` و `doctor` پیکربندی را بررسی می‌کنند؛ `probe` یک اتصال زنده MCP باز می‌کند و قابلیت‌ها را فهرست می‌کند.               |
| ویرایش پیکربندی MCP از مرورگر                                      | رابط کنترل `/settings/mcp` (نام مستعار `/mcp`)                            | این صفحه موجودی، وضعیت فعال‌سازی، خلاصه‌های OAuth/فیلتر، راهنمای فرمان‌ها و یک ویرایشگر محدود به دامنه برای `mcp` را نمایش می‌دهد.         |
| ارائه یک سرور MCP بومی با دامنه محدود به app-server متعلق به Codex                    | `mcp.servers.<name>.codex`                                           | بلوک `codex` فقط بر بازتاب رشته app-server در Codex اثر می‌گذارد و پیش از واگذاری پیکربندی بومی حذف می‌شود. |
| اجرای نشست‌های محیط میزبانی‌شده با ACP                                     | [`openclaw acp`](/fa/cli/acp) و [عامل‌های ACP](/fa/tools/acp-agents-setup) | حالت پل ACP تزریق سرور MCP به‌ازای هر نشست را نمی‌پذیرد؛ به‌جای آن پل‌های gateway/Plugin را پیکربندی کنید.     |

<Tip>
اگر مطمئن نیستید به کدام مسیر نیاز دارید، با `openclaw mcp status --verbose` شروع کنید. این گزینه بدون راه‌اندازی هیچ سرور MCP، موارد ذخیره‌شده در OpenClaw را نمایش می‌دهد.
</Tip>

## OpenClaw به‌عنوان سرور MCP

این مسیر `openclaw mcp serve` است.

### زمان استفاده از serve

از `openclaw mcp serve` زمانی استفاده کنید که:

- Codex، Claude Code یا کلاینت MCP دیگری باید مستقیماً با گفتگوهای کانال مبتنی بر OpenClaw ارتباط برقرار کند
- از قبل یک Gateway محلی یا راه‌دور OpenClaw با نشست‌های مسیریابی‌شده دارید
- به‌جای اجرای پل‌های جداگانه برای هر کانال، یک سرور MCP می‌خواهید که در همه زیرساخت‌های کانال OpenClaw کار کند

وقتی OpenClaw باید خودش زمان‌اجرای کدنویسی را میزبانی کند و نشست عامل را درون OpenClaw نگه دارد، به‌جای آن از [`openclaw acp`](/fa/cli/acp) استفاده کنید.

### نحوه کار

`openclaw mcp serve` یک سرور MCP مبتنی بر stdio راه‌اندازی می‌کند. کلاینت MCP مالک آن فرایند است. تا زمانی که کلاینت نشست stdio را باز نگه دارد، پل از طریق WebSocket به یک Gateway محلی یا راه‌دور OpenClaw متصل می‌شود و گفتگوهای کانال مسیریابی‌شده را از طریق MCP ارائه می‌کند.

<Steps>
  <Step title="کلاینت پل را ایجاد می‌کند">
    کلاینت MCP، `openclaw mcp serve` را ایجاد می‌کند.
  </Step>
  <Step title="پل به Gateway متصل می‌شود">
    پل از طریق WebSocket به Gateway متعلق به OpenClaw متصل می‌شود.
  </Step>
  <Step title="نشست‌ها به گفتگوهای MCP تبدیل می‌شوند">
    نشست‌های مسیریابی‌شده به گفتگوهای MCP و ابزارهای رونوشت/تاریخچه تبدیل می‌شوند.
  </Step>
  <Step title="رویدادهای زنده در صف قرار می‌گیرند">
    تا زمانی که پل متصل است، رویدادهای زنده در حافظه در صف قرار می‌گیرند.
  </Step>
  <Step title="ارسال اختیاری Claude">
    اگر حالت کانال Claude فعال باشد، همان نشست می‌تواند اعلان‌های ارسالی ویژه Claude را نیز دریافت کند.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="رفتار مهم">
    - وضعیت صف زنده هنگام اتصال پل آغاز می‌شود
    - تاریخچه قدیمی‌تر رونوشت با `messages_read` خوانده می‌شود
    - اعلان‌های ارسالی Claude فقط تا زمانی وجود دارند که نشست MCP زنده است
    - هنگام قطع اتصال کلاینت، پل خارج می‌شود و صف زنده از بین می‌رود
    - نقاط ورود یک‌باره عامل مانند `openclaw agent` و `openclaw infer model run`، هر زمان‌اجرای MCP همراهی را که باز می‌کنند پس از تکمیل پاسخ خاتمه می‌دهند؛ بنابراین اجراهای اسکریپتی تکراری باعث انباشت فرایندهای فرزند MCP مبتنی بر stdio نمی‌شوند
    - سرورهای MCP مبتنی بر stdio که OpenClaw راه‌اندازی می‌کند (همراه یا پیکربندی‌شده توسط کاربر)، هنگام خاموش‌شدن به‌صورت درخت فرایند پایان داده می‌شوند؛ بنابراین زیرفرایندهایی که سرور آغاز کرده است پس از خروج کلاینت والد stdio باقی نمی‌مانند
    - حذف یا بازنشانی یک نشست، کلاینت‌های MCP آن نشست را از طریق مسیر مشترک پاک‌سازی زمان‌اجرا آزاد می‌کند؛ بنابراین هیچ اتصال stdio باقی‌مانده‌ای به نشست حذف‌شده وابسته نمی‌ماند

  </Accordion>
</AccordionGroup>

### انتخاب حالت کلاینت

<Tabs>
  <Tab title="کلاینت‌های عمومی MCP">
    فقط ابزارهای استاندارد MCP. از `conversations_list`، `messages_read`، `events_poll`، `events_wait`، `messages_send` و ابزارهای تأیید استفاده کنید.
  </Tab>
  <Tab title="Claude Code">
    ابزارهای استاندارد MCP به‌همراه آداپتور کانال ویژه Claude. `--claude-channel-mode on` را فعال کنید یا مقدار پیش‌فرض `auto` را نگه دارید.
  </Tab>
</Tabs>

<Note>
در حال حاضر، `auto` مانند `on` رفتار می‌کند. هنوز قابلیت‌های کلاینت شناسایی نمی‌شوند.
</Note>

### مواردی که serve ارائه می‌کند

پل با استفاده از فراداده مسیر نشست موجود در Gateway، گفتگوهای مبتنی بر کانال را ارائه می‌کند. یک گفتگو زمانی ظاهر می‌شود که OpenClaw از قبل وضعیت نشستی با مسیری شناخته‌شده مانند موارد زیر داشته باشد:

- `channel`
- فراداده گیرنده یا مقصد
- `accountId` اختیاری
- `threadId` اختیاری

این قابلیت یک محل واحد در اختیار کلاینت‌های MCP قرار می‌دهد تا:

- گفتگوهای مسیریابی‌شده اخیر را فهرست کنند
- تاریخچه اخیر رونوشت را بخوانند
- منتظر رویدادهای ورودی جدید بمانند
- پاسخ را از طریق همان مسیر بازگردانند
- درخواست‌های تأییدی را که هنگام اتصال پل می‌رسند مشاهده کنند

### روش استفاده

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
  <Tab title="جزئیات بیشتر / Claude غیرفعال">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ابزارهای پل

<AccordionGroup>
  <Accordion title="conversations_list">
    گفتگوهای اخیر مبتنی بر نشستی را فهرست می‌کند که از قبل در وضعیت نشست Gateway فراداده مسیر دارند.

    فیلترها: `limit` (حداکثر 500)، `search`، `channel`، `includeDerivedTitles`، `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    یک گفتگو را بر اساس `session_key` و با جست‌وجوی مستقیم نشست Gateway بازمی‌گرداند.
  </Accordion>
  <Accordion title="messages_read">
    پیام‌های اخیر رونوشت را برای یک گفتگوی مبتنی بر نشست می‌خواند. مقدار پیش‌فرض `limit` برابر 20 و حداکثر آن 200 است.
  </Accordion>
  <Accordion title="attachments_fetch">
    بلوک‌های محتوای غیرمتنی را از یک پیام رونوشت استخراج می‌کند. این یک نمای فراداده‌ای از محتوای رونوشت است، نه یک مخزن مستقل و پایدار برای داده‌های پیوست.
  </Accordion>
  <Accordion title="events_poll">
    رویدادهای زنده در صف را از یک نشانگر عددی به بعد می‌خواند. حداکثر `limit` برابر 200 است.
  </Accordion>
  <Accordion title="events_wait">
    تا رسیدن رویداد بعدیِ منطبق در صف یا پایان مهلت، نظرسنجی طولانی انجام می‌دهد (پیش‌فرض 30s، حداکثر 300s).

    وقتی یک کلاینت عمومی MCP بدون پروتکل ارسال ویژه Claude به تحویل تقریباً بلادرنگ نیاز دارد، از این ابزار استفاده کنید.

  </Accordion>
  <Accordion title="messages_send">
    متن را از طریق همان مسیری که از قبل روی نشست ثبت شده است بازمی‌فرستد.

    رفتار فعلی:

    - به یک مسیر گفتگوی موجود نیاز دارد
    - از کانال، گیرنده، شناسه حساب و شناسه رشته نشست استفاده می‌کند
    - فقط متن ارسال می‌کند

  </Accordion>
  <Accordion title="permissions_list_open">
    درخواست‌های در انتظار تأیید اجرا/Plugin را که پل از زمان اتصال به Gateway مشاهده کرده است فهرست می‌کند.
  </Accordion>
  <Accordion title="permissions_respond">
    یک درخواست در انتظار تأیید اجرا/Plugin را با یکی از موارد زیر تعیین تکلیف می‌کند:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### مدل رویداد

پل تا زمانی که متصل است یک صف رویداد در حافظه نگه می‌دارد.

انواع فعلی رویداد:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- صف فقط زنده است؛ هنگام راه‌اندازی پل MCP آغاز می‌شود
- `events_poll` و `events_wait` به‌تنهایی تاریخچه قدیمی‌تر Gateway را بازپخش نمی‌کنند
- صف عقب‌مانده پایدار باید با `messages_read` خوانده شود

</Warning>

### اعلان‌های کانال Claude

پل همچنین می‌تواند اعلان‌های کانال ویژه Claude را ارائه کند. این قابلیت معادل آداپتور کانال Claude Code در OpenClaw است: ابزارهای استاندارد MCP همچنان در دسترس می‌مانند، اما پیام‌های ورودی زنده نیز می‌توانند به‌شکل اعلان‌های MCP ویژه Claude وارد شوند.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: فقط ابزارهای استاندارد MCP.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: اعلان‌های کانال Claude را فعال می‌کند.
  </Tab>
  <Tab title="auto (پیش‌فرض)">
    `--claude-channel-mode auto`: پیش‌فرض فعلی؛ رفتار پل مشابه `on` است.
  </Tab>
</Tabs>

وقتی حالت کانال Claude فعال باشد، سرور قابلیت‌های آزمایشی Claude را اعلام می‌کند و می‌تواند موارد زیر را منتشر کند:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

رفتار فعلی پل:

- پیام‌های رونوشت ورودی `user` به‌صورت `notifications/claude/channel` ارسال می‌شوند
- درخواست‌های مجوز Claude که از طریق MCP دریافت می‌شوند در حافظه پیگیری می‌شوند
- اگر مالک فرمان در گفتگوی پیوندخورده بعداً `yes <id>` یا `no <id>` را ارسال کند (`<id>` شناسه 5 حرفی درخواست، بدون `l` است)، پل آن را به `notifications/claude/channel/permission` تبدیل می‌کند
- این اعلان‌ها فقط برای نشست زنده هستند؛ اگر اتصال کلاینت MCP قطع شود، هیچ مقصد ارسالی وجود نخواهد داشت

این رفتار عمداً مختص کلاینت است. کلاینت‌های عمومی MCP باید به ابزارهای استاندارد نظرسنجی متکی باشند.

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

برای بیشتر کلاینت‌های عمومی MCP، با سطح ابزار استاندارد شروع کنید و حالت Claude را نادیده بگیرید. حالت Claude را فقط برای کلاینت‌هایی فعال کنید که واقعاً متدهای اعلان مختص Claude را درک می‌کنند.

### گزینه‌ها

`openclaw mcp serve` از موارد زیر پشتیبانی می‌کند:

<ParamField path="--url" type="string">
  نشانی WebSocket مربوط به Gateway. در صورت پیکربندی، مقدار پیش‌فرض `gateway.remote.url` است.
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
  حالت اعلان Claude. مقدار پیش‌فرض `auto` است.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  گزارش‌های تفصیلی در stderr.
</ParamField>

<Tip>
در صورت امکان، `--token-file` یا `--password-file` را به‌جای اسرار درون‌خطی ترجیح دهید.
</Tip>

### مرز امنیت و اعتماد

پل مسیریابی ابداع نمی‌کند. فقط مکالماتی را در دسترس قرار می‌دهد که Gateway از قبل می‌داند چگونه مسیریابی کند.

این یعنی:

- فهرست‌های مجاز فرستنده، جفت‌سازی و اعتماد در سطح کانال همچنان به پیکربندی کانال زیربنایی OpenClaw تعلق دارند
- `messages_send` فقط می‌تواند از طریق یک مسیر ذخیره‌شده موجود پاسخ دهد
- وضعیت تأیید فقط به‌صورت زنده/درون‌حافظه‌ای برای نشست فعلی پل نگه‌داری می‌شود
- احراز هویت پل باید از همان کنترل‌های توکن یا گذرواژه Gateway استفاده کند که برای هر کلاینت راه‌دور دیگر Gateway قابل اعتماد می‌دانید

اگر مکالمه‌ای در `conversations_list` وجود ندارد، علت معمول پیکربندی MCP نیست. علت، نبودن یا ناقص‌بودن فراداده مسیر در نشست زیربنایی Gateway است.

### آزمایش

OpenClaw یک آزمون دود قطعی Docker برای این پل ارائه می‌کند:

```bash
pnpm test:docker:mcp-channels
```

این آزمون دود یک کانتینر واحد را اجرا می‌کند: وضعیت مکالمه را مقداردهی اولیه می‌کند، Gateway را راه‌اندازی می‌کند، سپس `openclaw mcp serve` را به‌عنوان فرایند فرزند stdio ایجاد می‌کند و آن را مانند یک کلاینت MCP هدایت می‌کند. این آزمون، کشف مکالمه، خواندن رونوشت، خواندن فراداده پیوست‌ها، رفتار صف رویداد زنده و اعلان‌های کانال و مجوز به سبک Claude را از طریق پل واقعی stdio MCP بررسی می‌کند. مسیریابی ارسال خروجی (`messages_send` با استفاده مجدد از مسیر ذخیره‌شده مکالمه) به‌طور جداگانه با آزمون‌های واحد در `src/mcp/channel-server.test.ts` پوشش داده می‌شود.

این سریع‌ترین راه برای اثبات کارکرد پل است، بدون آنکه یک حساب واقعی Telegram، Discord یا iMessage را به اجرای آزمایش متصل کنید.

برای زمینه گسترده‌تر آزمایش، به [آزمایش](/fa/help/testing) مراجعه کنید.

### عیب‌یابی

<AccordionGroup>
  <Accordion title="هیچ مکالمه‌ای برگردانده نمی‌شود">
    معمولاً یعنی نشست Gateway از قبل قابل مسیریابی نیست. تأیید کنید که نشست زیربنایی، فراداده ذخیره‌شده کانال/ارائه‌دهنده، گیرنده و مسیر اختیاری حساب/رشته را دارد.
  </Accordion>
  <Accordion title="events_poll یا events_wait پیام‌های قدیمی‌تر را از دست می‌دهد">
    این رفتار مورد انتظار است. صف زنده هنگام اتصال پل آغاز می‌شود. تاریخچه رونوشت قدیمی‌تر را با `messages_read` بخوانید.
  </Accordion>
  <Accordion title="اعلان‌های Claude نمایش داده نمی‌شوند">
    همه موارد زیر را بررسی کنید:

    - کلاینت نشست stdio MCP را باز نگه داشته است
    - `--claude-channel-mode` برابر با `on` یا `auto` است
    - کلاینت واقعاً متدهای اعلان مختص Claude را درک می‌کند
    - پیام ورودی پس از اتصال پل رخ داده است

  </Accordion>
  <Accordion title="تأییدها وجود ندارند">
    `permissions_list_open` فقط درخواست‌های تأییدی را نشان می‌دهد که هنگام اتصال پل مشاهده شده‌اند. این یک API پایدار برای تاریخچه تأییدها نیست.
  </Accordion>
</AccordionGroup>

## OpenClaw به‌عنوان رجیستری کلاینت MCP

این مسیر `openclaw mcp list`، `show`، `status`، `doctor`، `probe`، `add`، `set`،
`configure`، `tools`، `login`، `logout`، `reload` و `unset` است.

این فرمان‌ها OpenClaw را از طریق MCP در دسترس قرار نمی‌دهند. آن‌ها تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw را در `mcp.servers` در پیکربندی OpenClaw مدیریت می‌کنند. آن‌ها سرورهای mcporter را از `config/mcporter.json` نمی‌خوانند.

این تعریف‌های ذخیره‌شده برای محیط‌های اجرایی هستند که OpenClaw بعداً راه‌اندازی یا پیکربندی می‌کند، مانند OpenClaw توکار و دیگر سازگارکننده‌های محیط اجرایی. OpenClaw تعریف‌ها را به‌صورت متمرکز ذخیره می‌کند تا آن محیط‌های اجرایی مجبور نباشند فهرست‌های تکراری سرور MCP خود را نگه‌داری کنند.

<AccordionGroup>
  <Accordion title="رفتار مهم">
    - این فرمان‌ها فقط پیکربندی OpenClaw را می‌خوانند یا می‌نویسند
    - `status`، `list`، `show`، `doctor` بدون `--probe`، `set`، `configure`، `tools`، `logout`، `reload` و `unset` به سرور MCP مقصد متصل نمی‌شوند
    - `login` جریان شبکه MCP OAuth را برای سرور HTTP پیکربندی‌شده اجرا می‌کند و اعتبارنامه‌های محلی حاصل را ذخیره می‌کند
    - `status --verbose` انتقال، احراز هویت، مهلت زمانی، فیلتر و راهنمای فراخوانی موازی ابزارها را پس از رفع مقادیر و بدون اتصال چاپ می‌کند
    - `doctor` تعریف‌های ذخیره‌شده را برای مشکلات راه‌اندازی محلی مانند فرمان‌های stdio مفقود، پوشه‌های کاری نامعتبر، فایل‌های TLS مفقود، سرورهای غیرفعال، مقادیر حساس صریح در سرآیند/متغیر محیطی و مجوز OAuth ناقص بررسی می‌کند
    - `doctor --probe` پس از موفقیت بررسی‌های ایستا، همان اثبات اتصال زنده `probe` را اضافه می‌کند
    - `probe` به سرور انتخاب‌شده یا همه سرورهای پیکربندی‌شده متصل می‌شود، ابزارها را فهرست می‌کند و قابلیت‌ها/اطلاعات تشخیصی را گزارش می‌دهد
    - `add` تعریفی را از پرچم‌ها می‌سازد و پیش از ذخیره‌سازی آن را وارسی می‌کند، مگر اینکه `--no-probe` تنظیم شده باشد یا ابتدا مجوز OAuth لازم باشد
    - سازگارکننده‌های محیط اجرایی هنگام اجرا تصمیم می‌گیرند که عملاً از کدام شکل‌های انتقال پشتیبانی کنند
    - `enabled: false` سرور را ذخیره‌شده نگه می‌دارد، اما آن را از کشف محیط اجرایی توکار کنار می‌گذارد
    - `timeout` و `connectTimeout` مهلت‌های زمانی درخواست و اتصال هر سرور را بر حسب ثانیه تنظیم می‌کنند
    - `supportsParallelToolCalls: true` سرورهایی را مشخص می‌کند که سازگارکننده‌ها می‌توانند به‌طور هم‌زمان فراخوانی کنند
    - سرورهای HTTP می‌توانند از سرآیندهای ایستا، ورود OAuth، کنترل اعتبارسنجی TLS و مسیرهای گواهی/کلید mTLS استفاده کنند
    - OpenClaw توکار، ابزارهای MCP پیکربندی‌شده را در پروفایل‌های ابزار معمول `coding` و `messaging` در دسترس قرار می‌دهد؛ `minimal` همچنان آن‌ها را پنهان می‌کند و `tools.deny: ["bundle-mcp"]` آن‌ها را صراحتاً غیرفعال می‌کند
    - `toolFilter.include` و `toolFilter.exclude` هر سرور، ابزارهای MCP کشف‌شده را پیش از تبدیل‌شدن به ابزارهای OpenClaw فیلتر می‌کنند
    - سرورهایی که منابع یا اعلان‌ها را معرفی می‌کنند، ابزارهای کمکی برای فهرست‌کردن/خواندن منابع و فهرست‌کردن/دریافت اعلان‌ها نیز در دسترس قرار می‌دهند؛ نام‌های کمکی تولیدشده (`resources_list`، `resources_read`، `prompts_list`، `prompts_get`) از همان فیلتر گنجاندن/حذف استفاده می‌کنند
    - تغییرات پویای فهرست ابزار MCP، کاتالوگ ذخیره‌شده در حافظه نهان آن نشست را نامعتبر می‌کنند؛ کشف یا استفاده بعدی آن را از سرور تازه‌سازی می‌کند
    - شکست‌های مکرر درخواست ابزار/پروتکل MCP، آن سرور را برای مدت کوتاهی متوقف می‌کنند تا یک سرور خراب کل نوبت را مصرف نکند
    - محیط‌های اجرایی MCP همراه و محدود به نشست، پس از `mcp.sessionIdleTtlMs` میلی‌ثانیه بی‌کاری پاک‌سازی می‌شوند (پیش‌فرض 10 دقیقه؛ برای غیرفعال‌کردن، `0` را تنظیم کنید) و اجراهای یک‌باره توکار آن‌ها را در پایان اجرا پاک‌سازی می‌کنند

  </Accordion>
</AccordionGroup>

سازگارکننده‌های محیط اجرایی ممکن است این رجیستری مشترک را به شکلی نرمال‌سازی کنند که کلاینت پایین‌دستی آن‌ها انتظار دارد. برای نمونه، OpenClaw توکار مقادیر `transport` مربوط به OpenClaw را مستقیماً مصرف می‌کند، درحالی‌که Claude Code و Gemini مقادیر بومی CLI در `type`، مانند `http`، `sse` یا `stdio` را دریافت می‌کنند.

Codex app-server همچنین یک بلوک اختیاری `codex` را در هر سرور رعایت می‌کند. این
فراداده نگاشت OpenClaw فقط برای رشته‌های Codex app-server است؛ این فراداده
نشست‌های ACP، پیکربندی عمومی چارچوب Codex یا دیگر سازگارکننده‌های محیط اجرایی را
تغییر نمی‌دهد. از `codex.agents` غیرخالی استفاده کنید تا یک سرور فقط به شناسه‌های مشخص عامل
OpenClaw نگاشت شود. فهرست‌های خالی، سفید یا نامعتبر عامل به‌وسیله اعتبارسنجی
پیکربندی رد می‌شوند و به‌جای سراسری‌شدن، از مسیر نگاشت محیط اجرایی
حذف می‌شوند. از `codex.defaultToolsApprovalMode` ‏(`auto`، `prompt` یا `approve`)
استفاده کنید تا `default_tools_approval_mode` بومی Codex برای یک سرور قابل اعتماد تولید شود.
OpenClaw پیش از تحویل پیکربندی بومی `mcp_servers` به Codex، فراداده `codex`
را حذف می‌کند.

### تعریف‌های ذخیره‌شده سرور MCP

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

نکات:

- `list` نام سرورها را مرتب می‌کند.
- `show` بدون نام، شیء کامل سرور MCP پیکربندی‌شده را چاپ می‌کند.
- `status` انتقال‌های پیکربندی‌شده را بدون اتصال دسته‌بندی می‌کند. `--verbose` جزئیات رفع‌شده راه‌اندازی، مهلت زمانی، OAuth، فیلتر و فراخوانی موازی را شامل می‌شود.
- `doctor` بررسی‌های ایستا را بدون اتصال انجام می‌دهد. وقتی فرمان باید اتصال سرورهای فعال را نیز تأیید کند، `--probe` را اضافه کنید.
- `probe` متصل می‌شود و تعداد ابزارها، پشتیبانی از منابع/اعلان‌ها، پشتیبانی از تغییرات فهرست و اطلاعات تشخیصی را گزارش می‌دهد.
- `add` پرچم‌های stdio مانند `--command`، `--arg`، `--env` و `--cwd`، یا پرچم‌های HTTP مانند `--url`، `--transport`، `--header`، `--auth oauth` و پرچم‌های TLS، مهلت زمانی و انتخاب ابزار را می‌پذیرد.
- `set` انتظار یک مقدار شیء JSON در خط فرمان را دارد.
- `configure` فعال‌بودن، فیلترهای ابزار، مهلت‌های زمانی، OAuth، TLS و راهنمای فراخوانی موازی ابزارها را بدون جایگزین‌کردن کل تعریف سرور به‌روزرسانی می‌کند. برای تأیید سرور به‌روزشده پیش از ذخیره‌سازی، `--probe` را اضافه کنید.
- `tools` فیلترهای ابزار هر سرور را به‌روزرسانی می‌کند. ورودی‌های گنجاندن/حذف، نام ابزارهای MCP و الگوهای ساده `*` هستند.
- `login` جریان OAuth را برای سرورهای HTTP پیکربندی‌شده با `auth: "oauth"` اجرا می‌کند. اجرای نخست یک نشانی مجوز چاپ می‌کند؛ پس از تأیید، دوباره با `--code` اجرا کنید.
- `logout` اعتبارنامه‌های OAuth ذخیره‌شده سرور نام‌برده را بدون حذف تعریف ذخیره‌شده سرور پاک می‌کند.
- `reload` محیط‌های اجرایی MCP درون‌فرایندی ذخیره‌شده در حافظه نهان را فقط برای فرایند CLI فعلی آزاد می‌کند. فرایندهای Gateway یا عامل در فرایندی دیگر همچنان به مسیر بازخوانی یا راه‌اندازی مجدد خود نیاز دارند.
- برای سرورهای Streamable HTTP MCP از `transport: "streamable-http"` استفاده کنید. `openclaw mcp set` همچنین برای سازگاری، `type: "http"` بومی CLI را به همان شکل پیکربندی معیار نرمال‌سازی می‌کند.
- `unset` در صورت نبودن سرور نام‌برده با شکست مواجه می‌شود.

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

این نمونه‌ها فقط تعریف‌های سرور را ذخیره می‌کنند. پس از آن `openclaw mcp doctor --probe` را اجرا کنید تا ثابت شود سرور راه‌اندازی می‌شود و ابزارها را ارائه می‌دهد.

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

    دامنهٔ سرورهای سیستم فایل را به کوچک‌ترین درخت شاخه‌ای محدود کنید که عامل باید آن را بخواند یا ویرایش کند.

  </Tab>
  <Tab title="حافظه">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    اگر سرور ابزارهای نوشتنی ارائه می‌دهد که نباید در دسترس عامل‌های عادی باشند، از فیلتر ابزار استفاده کنید.

  </Tab>
  <Tab title="اسکریپت محلی">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` بررسی می‌کند که `cwd` وجود داشته باشد و فرمان از محیط پیکربندی‌شده قابل یافتن باشد.

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

    وقتی سرور راه‌دور از OAuth پشتیبانی می‌کند، از آن استفاده کنید. اگر سرور به سرآیندهای ایستا نیاز دارد، از ثبت توکن‌های حامل صریح در مخزن خودداری کنید.

  </Tab>
  <Tab title="دسکتاپ/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    سرورهای کنترل مستقیم دسکتاپ، مجوزهای فرایندی را که راه‌اندازی می‌کنند به ارث می‌برند. از فیلترهای محدود ابزار و اعلان‌های مجوز در سطح سیستم‌عامل استفاده کنید.

  </Tab>
</Tabs>

### ساختارهای خروجی JSON

برای اسکریپت‌ها و داشبوردها از `--json` استفاده کنید. مجموعهٔ فیلدها ممکن است با گذشت زمان گسترش یابد، بنابراین مصرف‌کنندگان باید کلیدهای ناشناخته را نادیده بگیرند.

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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "اعتبارنامه‌های OAuth مجاز نشده‌اند؛ openclaw mcp login docs را اجرا کنید"
            }
          ]
        }
      ]
    }
    ```

    وقتی هر سرور فعالِ بررسی‌شده دارای مشکلی در سطح `error` باشد، `doctor --json` با کد خروج غیرصفر خاتمه می‌یابد. مشکلات `warning` و `info` گزارش می‌شوند، اما به‌تنهایی باعث شکست فرمان نمی‌شوند.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    `probe --json` یک نشست زندهٔ کلاینت MCP باز می‌کند و نتیجهٔ آن را مستقیماً چاپ می‌کند؛ برخلاف `status`/`doctor`، خروجی هیچ فیلد سطح‌بالای `path` ندارد. کلیدهای `resources` و `prompts` فقط زمانی وجود دارند که سرور واقعاً آن قابلیت را اعلام کند (سروری بدون پرامپت، به‌جای گزارش `false`، کلید `prompts` را حذف می‌کند). از `probe` برای اثبات دسترس‌پذیری و قابلیت‌ها استفاده کنید، نه برای ممیزی پیکربندی ایستا.

  </Accordion>
</AccordionGroup>

نمونهٔ ساختار پیکربندی:

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

یک فرایند فرزند محلی را راه‌اندازی می‌کند و از طریق stdin/stdout با آن ارتباط برقرار می‌کند.

| فیلد                       | توضیحات                              |
| -------------------------- | ------------------------------------ |
| `command`                  | فایل اجرایی برای راه‌اندازی (الزامی) |
| `args`                     | آرایه‌ای از آرگومان‌های خط فرمان      |
| `env`                      | متغیرهای محیطی اضافی                  |
| `cwd` / `workingDirectory` | پوشهٔ کاری فرایند                     |

<Warning>
**فیلتر ایمنی محیط Stdio**

OpenClaw پیش از راه‌اندازی یک سرور MCP مبتنی بر stdio، کلیدهای محیطی مربوط به راه‌اندازی مفسر، ربایش بارگذار و مقداردهی اولیهٔ پوسته را رد می‌کند، حتی اگر در بلوک `env` سرور ظاهر شوند. این سازوکار از همان سیاست امنیتی محیط میزبان استفاده می‌کند که برای سایر فرایندهای راه‌اندازی‌شده توسط OpenClaw به‌کار می‌رود: قلاب‌های شناخته‌شدهٔ راه‌اندازی مفسر (برای مثال `NODE_OPTIONS`، `PYTHONSTARTUP`، `PERL5OPT`، `RUBYOPT`، `BASHOPTS`، `KSH_ENV`) و پیشوندهای تزریق کتابخانهٔ اشتراکی و تابع (`DYLD_*`، `LD_*`، `BASH_FUNC_*`) و متغیرهای مشابه کنترل زمان اجرا را مسدود می‌کند. هنگام راه‌اندازی، این موارد بی‌سروصدا حذف و یک هشدار ثبت می‌شود تا نتوانند یک مقدمهٔ ضمنی تزریق کنند، مفسر را عوض کنند، اشکال‌زدا را فعال کنند یا پیونددهندهٔ پویا را علیه فرایند stdio بربایند. یک فهرست مجاز صریح، متغیرهای محیطی عادی اعتبارنامهٔ MCP را قابل استفاده نگه می‌دارد (`GITHUB_TOKEN`، `GH_TOKEN`، `GITLAB_TOKEN`، `NPM_TOKEN`، `NODE_AUTH_TOKEN`، `DATABASE_URL`، `MONGODB_URI`، `REDIS_URL`، `AMQP_URL`، `AWS_ACCESS_KEY_ID`، `AWS_SECRET_ACCESS_KEY`، `AWS_SESSION_TOKEN`، `AZURE_CLIENT_ID`، `AZURE_CLIENT_SECRET`) و همچنین متغیرهای محیطی عادی پروکسی و مختص سرور (`HTTP_PROXY`، `*_API_KEY` سفارشی و غیره) را مجاز می‌کند. کلیدهای دیگر `AWS_*` مانند `AWS_CONFIG_FILE` و `AWS_SHARED_CREDENTIALS_FILE` همچنان مسدود می‌مانند، زیرا به‌جای حمل مستقیم مقدار اعتبارنامه، به فایل‌های اعتبارنامه اشاره می‌کنند.

اگر سرور MCP واقعاً به یکی از متغیرهای مسدودشده نیاز دارد، آن را به‌جای بخش `env` سرور stdio، روی فرایند میزبان Gateway تنظیم کنید.
</Warning>

### انتقال SSE / HTTP

از طریق رویدادهای ارسال‌شده از سرور HTTP به یک سرور MCP راه‌دور متصل می‌شود.

| فیلد                           | توضیحات                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `url`                          | نشانی HTTP یا HTTPS سرور راه‌دور (الزامی)                             |
| `headers`                      | نگاشت اختیاری کلید-مقدار از سرآیندهای HTTP (برای مثال توکن‌های احراز هویت) |
| `connectionTimeoutMs`          | مهلت اتصال هر سرور بر حسب میلی‌ثانیه (اختیاری)                        |
| `connectTimeout`               | مهلت اتصال هر سرور بر حسب ثانیه (اختیاری)                             |
| `timeout` / `requestTimeoutMs` | مهلت درخواست MCP هر سرور بر حسب ثانیه یا میلی‌ثانیه                  |
| `auth: "oauth"`                | استفاده از اعتبارنامه‌های OAuth مربوط به MCP که با `openclaw mcp login` ذخیره شده‌اند |
| `sslVerify`                    | فقط برای نقاط پایانی خصوصی HTTPS که صریحاً قابل اعتمادند، روی false تنظیم شود |
| `clientCert` / `clientKey`     | مسیرهای گواهی و کلید کلاینت mTLS                                     |
| `supportsParallelToolCalls`    | نشان می‌دهد فراخوانی‌های هم‌زمان برای این سرور ایمن هستند             |

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

مقادیر حساس در `url` (اطلاعات کاربر) و `headers` در گزارش‌ها و خروجی وضعیت پوشانده می‌شوند. وقتی ورودی‌های حساس‌به‌نظررسِ `headers` یا `env` حاوی مقادیر صریح باشند، `openclaw mcp doctor` هشدار می‌دهد تا اپراتورها بتوانند آن مقادیر را از پیکربندی ثبت‌شده در مخزن خارج کنند.

### گردش‌کار OAuth

OAuth برای سرورهای MCP مبتنی بر HTTP است که جریان OAuth مربوط به MCP را اعلام می‌کنند. وقتی `auth: "oauth"` فعال باشد، سرآیندهای ایستای `Authorization` برای آن سرور نادیده گرفته می‌شوند. اعتبارنامه‌های ذخیره‌شده توسط `openclaw mcp login` با MCP تعبیه‌شده، اجراکننده‌های CLI و app-server محلی Codex کار می‌کنند.

تا زمانی که اعتبارنامه‌ها در دسترس نباشند، OpenClaw به‌جای شکست نوبت عامل، فقط همان سرور MCP را از زمان اجرای عامل حذف می‌کند. سپس اپراتور یا عاملی با دسترسی پوسته می‌تواند `openclaw mcp login <name>` را اجرا کند و در نوبتی بعدی از سرور استفاده کند.

وقتی یک سرویس MCP راه‌دور از قبل توسط نمایهٔ احراز هویت جداگانهٔ OpenClaw با قابلیت نوسازی پشتیبانی می‌شود، می‌توانید در صورت تمایل `oauth.authProfileId` را تنظیم کنید. OpenClaw پیش از نگاشت به زمان اجرا، هر یک از منابع اعتبارنامه را نوسازی می‌کند و فقط توکن دسترسی فعلی را به کلاینت MCP پایین‌دستی می‌دهد.

<Steps>
  <Step title="ذخیرهٔ سرور">
    سرور را با `auth: "oauth"` و هر فرادادهٔ اختیاری OAuth اضافه یا به‌روزرسانی کنید.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    برای توکن حامل متکی بر نمایهٔ احراز هویت، اتصال نمایه را ذخیره کنید:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="شروع ورود">
    برای ایجاد درخواست مجوز، فرمان ورود را اجرا کنید.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw نشانی مجوز را چاپ می‌کند و وضعیت موقت تأییدکنندهٔ OAuth را در پوشهٔ وضعیت OpenClaw ذخیره می‌کند.

  </Step>
  <Step title="تکمیل با کد">
    پس از تأیید در مرورگر، کد بازگردانده‌شده را دوباره به OpenClaw بدهید.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="بررسی مجوزدهی">
    برای تأیید وجود توکن‌ها از status یا doctor استفاده کنید.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="پاک‌کردن اطلاعات احراز هویت">
    خروج از سیستم، اطلاعات احراز هویت ذخیره‌شده OAuth را حذف می‌کند، اما تعریف ذخیره‌شدهٔ سرور را نگه می‌دارد.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

اگر ارائه‌دهنده توکن‌ها را تعویض کند یا وضعیت مجوزدهی گیر کند، `openclaw mcp logout <name>` را اجرا کنید، سپس `login` را تکرار کنید. `logout` می‌تواند اطلاعات احراز هویت یک سرور HTTP ذخیره‌شده را حتی پس از حذف `auth: "oauth"` از پیکربندی پاک کند، به‌شرط آنکه نام و URL سرور همچنان ورودی مخزن اطلاعات احراز هویت را مشخص کنند.

### انتقال HTTP جریانی

`streamable-http` در کنار `sse` و `stdio` یک گزینهٔ انتقالی دیگر است. این گزینه برای ارتباط دوسویه با سرورهای MCP راه دور از جریان‌سازی HTTP استفاده می‌کند.

| فیلد                           | توضیحات                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`             | URL مبتنی بر HTTP یا HTTPS سرور راه دور (الزامی)                                       |
| `transport`             | برای انتخاب این انتقال روی `"streamable-http"` تنظیم کنید؛ در صورت حذف، OpenClaw از `sse` استفاده می‌کند |
| `headers`             | نگاشت اختیاری کلید-مقدار سرآیندهای HTTP (برای مثال، توکن‌های احراز هویت)                |
| `connectionTimeoutMs`             | مهلت اتصال هر سرور بر حسب ms (اختیاری)                                                  |
| `connectTimeout`             | مهلت اتصال هر سرور بر حسب ثانیه (اختیاری)                                               |
| `timeout` / `requestTimeoutMs` | مهلت درخواست MCP هر سرور بر حسب ثانیه یا ms                                  |
| `auth: "oauth"`             | استفاده از اطلاعات احراز هویت MCP OAuth ذخیره‌شده توسط `openclaw mcp login`             |
| `sslVerify`             | فقط برای نقاط پایانی خصوصی و صراحتاً مورداعتماد HTTPS روی false تنظیم کنید              |
| `clientCert` / `clientKey` | مسیرهای گواهی و کلید کلاینت mTLS                                             |
| `supportsParallelToolCalls`             | نشان می‌دهد فراخوانی‌های هم‌زمان برای این سرور امن هستند                                |

پیکربندی OpenClaw از `transport: "streamable-http"` به‌عنوان املای معیار استفاده می‌کند. مقادیر بومی CLI مربوط به MCP، یعنی `type: "http"`، هنگام ذخیره‌شدن از طریق `openclaw mcp set` پذیرفته می‌شوند و در پیکربندی موجود توسط `openclaw doctor --fix` اصلاح می‌شوند، اما `transport` مقداری است که OpenClaw تعبیه‌شده مستقیماً مصرف می‌کند.

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
فرمان‌های رجیستری پل کانال را راه‌اندازی نمی‌کنند. فقط `probe` و `doctor --probe` یک نشست زندهٔ کلاینت MCP باز می‌کنند تا دردسترس‌بودن سرور مقصد را اثبات کنند.
</Note>

## رابط کاربری کنترل

رابط کاربری کنترل مبتنی بر مرورگر، یک صفحهٔ اختصاصی تنظیمات MCP در `/settings/mcp` دارد؛ مسیر قبلی `/mcp` همچنان به‌عنوان نام مستعار باقی می‌ماند. این صفحه تعداد سرورهای پیکربندی‌شده، خلاصه‌های فعال‌بودن/OAuth/فیلتر، ردیف انتقال هر سرور، کنترل‌های فعال/غیرفعال‌سازی، فرمان‌های رایج CLI و یک ویرایشگر محدود به بخش پیکربندی `mcp` را نمایش می‌دهد.

از این صفحه برای ویرایش‌های اپراتور و بررسی سریع موجودی استفاده کنید. هنگامی که به اثبات زندهٔ سرور نیاز دارید، از `openclaw mcp doctor --probe` یا `openclaw mcp probe` استفاده کنید.

گردش‌کار اپراتور:

1. رابط کاربری کنترل را باز کنید و **MCP** را انتخاب کنید.
2. کارت‌های خلاصه را برای تعداد کل، سرورهای فعال، OAuth و سرورهای فیلترشده بررسی کنید.
3. از ردیف هر سرور برای مشاهدهٔ راهنمای انتقال، احراز هویت، فیلتر، مهلت و فرمان استفاده کنید.
4. هرگاه می‌خواهید تعریفی را نگه دارید اما آن را از کشف زمان اجرا کنار بگذارید، وضعیت فعال‌بودن را تغییر دهید.
5. برای تغییرات ساختاری مانند سرورهای جدید، سرآیندها، TLS، فرادادهٔ OAuth یا فیلترهای ابزار، بخش پیکربندی محدودشدهٔ `mcp` را ویرایش کنید.
6. برای فقط ذخیره‌کردن پیکربندی، **Save** را انتخاب کنید؛ یا برای اعمال آن از طریق مسیر پیکربندی Gateway، **Save & Publish** را انتخاب کنید.
7. هنگامی که به اثبات زندهٔ راه‌اندازی سرور و فهرست‌شدن ابزارهای آن نیاز دارید، `openclaw mcp doctor --probe` را اجرا کنید.

نکات:

- قطعه‌فرمان‌ها نام سرورها را در گیومه قرار می‌دهند تا نام‌های غیرمعمول نیز در پوسته قابل کپی باشند
- مقادیر نمایش‌داده‌شدهٔ شبیه URL، اگر حاوی اطلاعات احراز هویت تعبیه‌شده باشند، پیش از رندر پنهان‌سازی می‌شوند
- این صفحه به‌تنهایی انتقال‌های MCP را راه‌اندازی نمی‌کند
- زمان‌های اجرای فعال، بسته به اینکه کدام فرایند مالک کلاینت‌های MCP است، ممکن است به `openclaw mcp reload`، انتشار پیکربندی Gateway یا راه‌اندازی مجدد فرایند نیاز داشته باشند

## برنامه‌های MCP

OpenClaw می‌تواند ابزارهایی را رندر کند که [افزونهٔ MCP Apps](https://modelcontextprotocol.io/extensions/apps) پایدار را پیاده‌سازی می‌کنند. برنامه‌ها به‌صورت انتخابی فعال می‌شوند، زیرا HTML آن‌ها از سرور MCP پیکربندی‌شده می‌آید و می‌تواند ابزارها یا منابع قابل‌مشاهده برای برنامه را از همان سرور درخواست کند.

پل میزبان را فعال کنید:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

پس از تغییر این تنظیم، Gateway را مجدداً راه‌اندازی کنید. در صورت فعال‌بودن، OpenClaw یک شنوندهٔ HTTP(S) فقط برای محیط ایزوله روی پورت Gateway به‌علاوهٔ یک راه‌اندازی می‌کند (برای Gateway پیش‌فرض، `18790`). رابط کاربری کنترل، برنامه‌ها را از آن مبدأ جداگانه بارگیری می‌کند؛ این شنونده هرگز رابط کاربری کنترل، مسیرهای احرازهویت‌شدهٔ Gateway یا داده‌های کاربر را ارائه نمی‌کند.

اتصال‌های مستقیم Gateway باید به هر دو پورت دسترسی داشته باشند. اگر یک پراکسی معکوس یا پایان‌دهندهٔ TLS رابط کاربری کنترل را ارائه می‌کند، یک مبدأ عمومی اختصاصی به برنامه‌ها بدهید و فقط همان مبدأ را به شنوندهٔ محیط ایزوله پراکسی کنید:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

مبدأ محیط ایزوله باید با مبدأ رابط کاربری کنترل متفاوت باشد. هیچ محتوای احرازهویت‌شده یا حساسی را روی آن میزبانی نکنید.

برای مثال، دموی رسمی و پایهٔ React را می‌توان به‌شکل زیر پیکربندی کرد:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

مرزهای رفتاری و امنیتی:

- OpenClaw فقط هنگامی افزونهٔ `io.modelcontextprotocol/ui` را اعلام می‌کند که برنامه‌ها فعال باشند.
- فقط منابع `ui://` با نوع MIME دقیق `text/html;profile=mcp-app` رندر می‌شوند.
- منابع رابط کاربری به 2 MiB محدود می‌شوند، پشت یک پراکسی دو-iframe روی یک مبدأ بیرونی اختصاصی قرار می‌گیرند، در یک مبدأ داخلی مبهم برنامه بارگیری می‌شوند و توسط CSP برگرفته از فرادادهٔ منبع محدود می‌شوند.
- ابزارهای مختص برنامه (`_meta.ui.visibility: ["app"]`) خارج از فهرست ابزارهای مدل باقی می‌مانند. برنامه‌ها فقط می‌توانند ابزارهای قابل‌مشاهده برای برنامه را روی سرور مالک خود فراخوانی کنند که سیاست مؤثر ابزار OpenClaw را نیز برای اجرایی که نما را ایجاد کرده است، پشت سر بگذارند.
- تا زمانی که سندهای داخلی برنامه برای جداسازی میان برنامه‌ها از مبدأهای مبهم استفاده می‌کنند، مجوزهای برنامهٔ وابسته به مبدأ، مانند دوربین، میکروفن و موقعیت جغرافیایی، اعطا نمی‌شوند.
- HTML برنامه، آرگومان‌های کامل ابزار و نتایج خام، در یک اجارهٔ نمای درون‌حافظه‌ای و محدود به ده دقیقه نگهداری می‌شوند و روی دیسک نوشته یا در فرادادهٔ پیش‌نمایش رونوشت کپی نمی‌شوند. رونوشت فقط یک توصیفگر محدود سرور/ابزار/منبع را که به شناسهٔ فراخوانی ابزار اصلی پیوند دارد ذخیره می‌کند. پس از راه‌اندازی مجدد Gateway، رابط کاربری کنترل می‌تواند آن توصیفگر را با رونوشت نشست احرازهویت‌شده تطبیق دهد و منبع `ui://` را دوباره واکشی کند؛ نماهای بازسازی‌شده تا زمانی که یک اجرای تازه مجوزهای فعلی ابزار را برقرار کند، فقط خواندنی هستند.
- `openclaw security audit` هنگام فعال‌بودن پل هشدار می‌دهد. وقتی به آن نیاز ندارید، با `openclaw config set mcp.apps.enabled false --strict-json` غیرفعالش کنید.

## محدودیت‌های کنونی

این صفحه پل را مطابق آنچه امروز عرضه شده است مستند می‌کند.

محدودیت‌های کنونی:

- کشف مکالمه به فرادادهٔ مسیر نشست موجود Gateway وابسته است
- هیچ پروتکل ارسال عمومی فراتر از آداپتور مختص Claude وجود ندارد
- هنوز هیچ ابزار ویرایش پیام یا واکنش‌دادن وجود ندارد
- انتقال HTTP/SSE/streamable-http به یک سرور راه دور متصل می‌شود؛ هنوز بالادست چندگانه‌ای وجود ندارد
- `permissions_list_open` فقط تأییدهایی را شامل می‌شود که هنگام اتصال پل مشاهده شده‌اند

## مرتبط

- [مرجع CLI](/fa/cli)
- [Pluginها](/fa/cli/plugins)
