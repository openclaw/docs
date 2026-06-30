---
read_when:
    - استفاده یا پیکربندی فرمان‌های چت
    - اشکال‌زدایی مسیریابی فرمان‌ها یا مجوزها
    - درک نحوه ثبت فرمان‌های Skills
sidebarTitle: Slash commands
summary: همهٔ دستورهای اسلش، دستورالعمل‌ها و میان‌برهای درون‌خطی موجود — پیکربندی، مسیریابی، و رفتار برای هر سطح.
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-06-30T14:16:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway فرمان‌هایی را مدیریت می‌کند که به‌صورت پیام‌های مستقل و با `/` شروع می‌شوند.
فرمان‌های bash فقط میزبان از `! <cmd>` استفاده می‌کنند (با `/bash <cmd>` به‌عنوان نام مستعار).

وقتی یک مکالمه به یک نشست ACP متصل باشد، متن عادی به harness مربوط به ACP
هدایت می‌شود. فرمان‌های مدیریتی Gateway محلی باقی می‌مانند: `/acp ...` همیشه به
مدیریت‌کننده فرمان OpenClaw می‌رسد، و `/status` به‌همراه `/unfocus` هر زمان که
مدیریت فرمان برای آن سطح فعال باشد محلی می‌مانند.

## سه نوع فرمان

<CardGroup cols={3}>
  <Card title="فرمان‌ها" icon="terminal">
    پیام‌های مستقل `/...` که توسط Gateway مدیریت می‌شوند. باید به‌عنوان تنها
    محتوای پیام ارسال شوند.
  </Card>
  <Card title="دستورالعمل‌ها" icon="sliders">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`،
    `/exec`، `/model`، `/queue` — پیش از آنکه مدل پیام را ببیند از پیام حذف
    می‌شوند. وقتی به‌تنهایی ارسال شوند، تنظیمات نشست را پایدار می‌کنند؛ وقتی
    همراه با متن دیگر ارسال شوند، به‌عنوان راهنمای درون‌خطی عمل می‌کنند.
  </Card>
  <Card title="میانبرهای درون‌خطی" icon="bolt">
    `/help`، `/commands`، `/status`، `/whoami` — بلافاصله اجرا می‌شوند و پیش
    از آنکه مدل متن باقی‌مانده را ببیند حذف می‌شوند. فقط فرستنده‌های مجاز.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="جزئیات رفتار دستورالعمل">
    - دستورالعمل‌ها پیش از آنکه مدل پیام را ببیند از پیام حذف می‌شوند.
    - در پیام‌های **فقط دستورالعمل** (پیامی که فقط شامل دستورالعمل‌هاست)، آن‌ها
      در نشست پایدار می‌شوند و با یک تأییدیه پاسخ می‌دهند.
    - در پیام‌های **گفت‌وگوی عادی** همراه با متن دیگر، آن‌ها به‌عنوان راهنمای
      درون‌خطی عمل می‌کنند و تنظیمات نشست را پایدار **نمی‌کنند**.
    - دستورالعمل‌ها فقط برای **فرستنده‌های مجاز** اعمال می‌شوند. اگر `commands.allowFrom`
      تنظیم شده باشد، تنها فهرست مجاز مورد استفاده است؛ در غیر این صورت مجوز از
      فهرست‌های مجاز/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. برای
      فرستنده‌های غیرمجاز، دستورالعمل‌ها مثل متن ساده در نظر گرفته می‌شوند.
  </Accordion>
</AccordionGroup>

## پیکربندی

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  تجزیه `/...` را در پیام‌های گفت‌وگو فعال می‌کند. روی سطح‌هایی که فرمان‌های بومی
  ندارند (WhatsApp، WebChat، Signal، iMessage، Google Chat، Microsoft Teams)، فرمان‌های
  متنی حتی وقتی روی `false` تنظیم شده باشند هم کار می‌کنند.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  فرمان‌های بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش؛
  برای ارائه‌دهندگانی که پشتیبانی بومی ندارند نادیده گرفته می‌شود. با
  `channels.<provider>.commands.native` برای هر کانال بازنویسی کنید. در Discord،
  مقدار `false` از ثبت slash-command صرف‌نظر می‌کند؛ فرمان‌هایی که قبلاً ثبت شده‌اند
  ممکن است تا زمان حذف همچنان قابل مشاهده بمانند.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  وقتی پشتیبانی شود، فرمان‌های Skills را به‌صورت بومی ثبت می‌کند. خودکار: برای
  Discord/Telegram روشن؛ برای Slack خاموش. با
  `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` را برای اجرای فرمان‌های پوسته میزبان فعال می‌کند (نام مستعار
  `/bash <cmd>`). به فهرست‌های مجاز `tools.elevated` نیاز دارد.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  مدت زمانی که bash پیش از رفتن به حالت پس‌زمینه منتظر می‌ماند (`0` بلافاصله به
  پس‌زمینه می‌رود).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). فقط مالک.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` را فعال می‌کند (پیکربندی MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند/می‌نویسد). فقط مالک.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` را فعال می‌کند (کشف/وضعیت Plugin به‌همراه نصب و فعال/غیرفعال‌سازی). نوشتن فقط برای مالک.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` را فعال می‌کند (بازنویسی‌های پیکربندی فقط در زمان اجرا). فقط مالک.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` و کنش‌های ابزار راه‌اندازی دوباره Gateway را فعال می‌کند.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک برای سطح‌های فرمان فقط مالک. جدا از
  `commands.allowFrom` و دسترسی جفت‌سازی پیام مستقیم است.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  برای هر کانال: برای فرمان‌های فقط مالک به هویت مالک نیاز دارد. وقتی `true` باشد،
  فرستنده باید با `commands.ownerAllowFrom` مطابقت داشته باشد یا دامنه داخلی
  `operator.admin` را داشته باشد. یک ورودی wildcard در `allowFrom` **کافی نیست**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در پرامپت سیستم نمایش داده شوند.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  راز HMAC که وقتی `commands.ownerDisplay: "hash"` باشد استفاده می‌شود.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز برای هر ارائه‌دهنده جهت مجوزدهی فرمان. وقتی پیکربندی شود، **تنها**
  منبع مجوزدهی برای فرمان‌ها و دستورالعمل‌هاست. از `"*"` برای پیش‌فرض سراسری
  استفاده کنید؛ کلیدهای اختصاصی ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای فرمان‌ها اعمال می‌کند.
</ParamField>

## فهرست فرمان‌ها

فرمان‌ها از سه منبع می‌آیند:

- **توکارهای هسته:** `src/auto-reply/commands-registry.shared.ts`
- **فرمان‌های dock تولیدشده:** `src/auto-reply/commands-registry.data.ts`
- **فرمان‌های Plugin:** فراخوانی‌های `registerCommand()` در Plugin

در دسترس بودن به پرچم‌های پیکربندی، سطح کانال، و Pluginهای نصب‌شده/فعال
بستگی دارد.

### فرمان‌های هسته

<AccordionGroup>
  <Accordion title="نشست‌ها و اجراها">
    | فرمان | توضیح |
    | --- | --- |
    | `/new [model]` | نشست فعلی را بایگانی کرده و یک نشست تازه شروع می‌کند |
    | `/reset [soft [message]]` | نشست فعلی را درجا بازنشانی می‌کند. `soft` رونوشت را نگه می‌دارد، شناسه‌های نشست backend مربوط به CLI را که دوباره استفاده شده‌اند حذف می‌کند، و راه‌اندازی اولیه را دوباره اجرا می‌کند |
    | `/name <title>` | نشست فعلی را نام‌گذاری یا بازنام‌گذاری می‌کند. عنوان را حذف کنید تا نام فعلی و یک پیشنهاد را ببینید |
    | `/compact [instructions]` | زمینه نشست را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید |
    | `/stop` | اجرای فعلی را لغو می‌کند |
    | `/session idle <duration\|off>` | انقضای بیکاری اتصال رشته را مدیریت می‌کند |
    | `/session max-age <duration\|off>` | انقضای حداکثر عمر اتصال رشته را مدیریت می‌کند |
    | `/export-session [path]` | نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export` |
    | `/export-trajectory [path]` | یک بسته مسیر JSONL برای نشست فعلی صادر می‌کند. نام مستعار: `/trajectory` |

    <Note>
      Control UI مقدار تایپ‌شده `/new` را رهگیری می‌کند تا یک نشست داشبورد تازه
      بسازد و به آن جابه‌جا شود، مگر وقتی `session.dmScope: "main"` پیکربندی
      شده باشد و والد فعلی نشست اصلی عامل باشد — در آن حالت `/new` نشست اصلی را
      درجا بازنشانی می‌کند. مقدار تایپ‌شده `/reset` همچنان بازنشانی درجای Gateway را
      اجرا می‌کند. وقتی می‌خواهید انتخاب مدل سنجاق‌شده نشست را پاک کنید، از
      `/model default` استفاده کنید.
    </Note>

  </Accordion>

  <Accordion title="مدل و کنترل‌های اجرا">
    | فرمان | توضیح |
    | --- | --- |
    | `/think <level\|default>` | سطح تفکر را تنظیم می‌کند یا بازنویسی نشست را پاک می‌کند. نام‌های مستعار: `/thinking`، `/t` |
    | `/verbose on\|off\|full` | خروجی پرجزئیات را روشن/خاموش می‌کند. نام مستعار: `/v` |
    | `/trace on\|off` | خروجی trace مربوط به Plugin را برای نشست فعلی روشن/خاموش می‌کند |
    | `/fast [status\|auto\|on\|off\|default]` | حالت سریع را نمایش، تنظیم، یا پاک می‌کند |
    | `/reasoning [on\|off\|stream]` | نمایش استدلال را روشن/خاموش می‌کند. نام مستعار: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | حالت elevated را روشن/خاموش می‌کند. نام مستعار: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | پیش‌فرض‌های exec را نمایش یا تنظیم می‌کند |
    | `/model [name\|#\|status]` | مدل را نمایش یا تنظیم می‌کند |
    | `/models [provider] [page] [limit=<n>\|all]` | ارائه‌دهندگان یا مدل‌های پیکربندی‌شده/دارای احراز هویت در دسترس را فهرست می‌کند |
    | `/queue <mode>` | رفتار صف اجرای فعال را مدیریت می‌کند. [صف](/fa/concepts/queue) و [هدایت صف](/fa/concepts/queue-steering) را ببینید |
    | `/steer <message>` | راهنمایی را به اجرای فعال تزریق می‌کند. نام مستعار: `/tell`. [هدایت](/fa/tools/steer) را ببینید |

    <AccordionGroup>
      <Accordion title="ایمنی verbose / trace / fast / reasoning">
        - `/verbose` برای اشکال‌زدایی است — در استفاده عادی آن را **خاموش** نگه دارید.
        - `/trace` فقط خط‌های trace/debug متعلق به Plugin را آشکار می‌کند؛ گفت‌وگوی پرجزئیات عادی خاموش می‌ماند.
        - `/fast auto|on|off` یک بازنویسی نشست را پایدار می‌کند؛ برای پاک‌کردن آن از گزینه `inherit` در رابط نشست‌ها استفاده کنید.
        - `/fast` وابسته به ارائه‌دهنده است: OpenAI/Codex آن را به `service_tier=priority` نگاشت می‌کند؛ درخواست‌های مستقیم Anthropic آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند.
        - `/reasoning`، `/verbose`، و `/trace` در محیط‌های گروهی پرخطرند — ممکن است استدلال داخلی یا عیب‌یابی‌های Plugin را آشکار کنند. آن‌ها را در گفت‌وگوهای گروهی خاموش نگه دارید.

      </Accordion>
      <Accordion title="جزئیات تغییر مدل">
        - `/model` مدل جدید را بلافاصله در نشست پایدار می‌کند.
        - اگر عامل بیکار باشد، اجرای بعدی فوراً از آن استفاده می‌کند.
        - اگر اجرایی فعال باشد، تغییر به‌صورت در انتظار علامت‌گذاری می‌شود و در نقطه تلاش مجدد پاک بعدی اعمال می‌شود.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="کشف و وضعیت">
    | فرمان | توضیح |
    | --- | --- |
    | `/help` | خلاصه کوتاه راهنما را نشان می‌دهد |
    | `/commands` | کاتالوگ فرمان تولیدشده را نشان می‌دهد |
    | `/tools [compact\|verbose]` | نشان می‌دهد عامل فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند |
    | `/status` | وضعیت اجرا/زمان اجرا، Gateway و زمان کارکرد سیستم، سلامت Plugin، به‌همراه مصرف/سهمیه ارائه‌دهنده را نشان می‌دهد |
    | `/status plugins` | سلامت تفصیلی Plugin را نشان می‌دهد: خطاهای بارگذاری، قرنطینه‌ها، خرابی‌های کانال، مشکلات وابستگی، اعلان‌های سازگاری |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | [هدف](/fa/tools/goal) پایدار نشست فعلی را مدیریت می‌کند |
    | `/diagnostics [note]` | جریان گزارش پشتیبانی فقط مالک. هر بار تأیید exec می‌خواهد |
    | `/crestodian <request>` | راه‌انداز و کمک‌کننده تعمیر Crestodian را از پیام مستقیم مالک اجرا می‌کند |
    | `/tasks` | کارهای پس‌زمینه فعال/اخیر نشست فعلی را فهرست می‌کند |
    | `/context [list\|detail\|map\|json]` | توضیح می‌دهد زمینه چگونه مونتاژ می‌شود |
    | `/whoami` | شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | پانوشت مصرف برای هر پاسخ را کنترل می‌کند (`reset`/`inherit`/`clear`/`default` بازنویسی نشست را پاک می‌کند تا دوباره پیش‌فرض پیکربندی‌شده را به ارث ببرد) یا یک خلاصه هزینه محلی چاپ می‌کند |
  </Accordion>

  <Accordion title="Skills، فهرست‌های مجاز، تأییدها">
    | فرمان | توضیح |
    | --- | --- |
    | `/skill <name> [input]` | یک skill را با نام اجرا می‌کند |
    | `/allowlist [list\|add\|remove] ...` | ورودی‌های فهرست مجاز را مدیریت می‌کند. فقط متنی |
    | `/approve <id> <decision>` | درخواست‌های تأیید exec یا Plugin را حل می‌کند |
    | `/btw <question>` | بدون تغییر زمینه نشست، یک پرسش جانبی می‌پرسد. نام مستعار: `/side`. [BTW](/fa/tools/btw) را ببینید |
  </Accordion>

  <Accordion title="زیرعامل‌ها و ACP">
    | دستور | توضیح |
    | --- | --- |
    | `/subagents list\|log\|info` | اجرای زیرعامل‌ها را برای نشست فعلی بررسی می‌کند |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند. کنترل‌های زمان اجرا به مالک خارجی یا هویت مدیر داخلی Gateway نیاز دارند |
    | `/focus <target>` | رشته فعلی Discord یا موضوع Telegram را به یک هدف نشست متصل می‌کند |
    | `/unfocus` | اتصال رشته فعلی را حذف می‌کند |
    | `/agents` | عامل‌های متصل به رشته را برای نشست فعلی فهرست می‌کند |
  </Accordion>

  <Accordion title="نوشتن‌های مخصوص مالک و مدیریت">
    | دستور | نیازمند | توضیح |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` را می‌خواند یا می‌نویسد. مخصوص مالک |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را می‌خواند یا می‌نویسد. مخصوص مالک |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | وضعیت Plugin را بررسی یا تغییر می‌دهد. نوشتن فقط برای مالک است. نام مستعار: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | بازنویسی‌های پیکربندی فقط در زمان اجرا. مخصوص مالک |
    | `/restart` | `commands.restart: true` (پیش‌فرض) | OpenClaw را راه‌اندازی مجدد می‌کند |
    | `/send on\|off\|inherit` | مالک | سیاست ارسال را تنظیم می‌کند |
  </Accordion>

  <Accordion title="صدا، TTS، کنترل کانال">
    | دستور | توضیح |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS را کنترل می‌کند. [TTS](/fa/tools/tts) را ببینید |
    | `/activation mention\|always` | حالت فعال‌سازی گروه را تنظیم می‌کند |
    | `/bash <command>` | یک دستور پوسته میزبان را اجرا می‌کند. نام مستعار: `! <command>`. نیازمند `commands.bash: true` |
    | `!poll [sessionId]` | یک کار bash پس‌زمینه را بررسی می‌کند |
    | `!stop [sessionId]` | یک کار bash پس‌زمینه را متوقف می‌کند |
  </Accordion>
</AccordionGroup>

### دستورهای اتصال

دستورهای اتصال مسیر پاسخ نشست فعال را به کانال متصل دیگری تغییر می‌دهند.
برای راه‌اندازی و عیب‌یابی، [اتصال کانال](/fa/concepts/channel-docking) را ببینید.

تولیدشده از Pluginهای کانال با پشتیبانی از دستور بومی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

دستورهای اتصال به `session.identityLinks` نیاز دارند. فرستنده مبدا و همتای مقصد
باید در یک گروه هویت باشند.

### دستورهای Pluginهای همراه

| دستور                                                                                       | توضیح                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Dreaming حافظه را روشن یا خاموش می‌کند (مالک یا مدیر Gateway). [Dreaming](/fa/concepts/dreaming) را ببینید |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | جفت‌سازی دستگاه را مدیریت می‌کند. [جفت‌سازی](/fa/channels/pairing) را ببینید             |
| `/phone status\|arm ...\|disarm`                                                             | دستورهای پرخطر گره تلفن را موقتاً مسلح می‌کند                                        |
| `/voice status\|list\|set <voiceId>`                                                         | پیکربندی صدای Talk را مدیریت می‌کند. نام بومی Discord: `/talkvoice`                  |
| `/card ...`                                                                                  | پیش‌تنظیم‌های کارت غنی LINE را ارسال می‌کند. [LINE](/fa/channels/line) را ببینید        |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | مهار سرور برنامه Codex را کنترل می‌کند. [مهار Codex](/fa/plugins/codex-harness) را ببینید |

فقط QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### دستورهای Skill

Skills قابل فراخوانی توسط کاربر به‌صورت دستورهای اسلش ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills می‌توانند به‌عنوان دستورهای مستقیم ثبت شوند (مانند `/prose` برای OpenProse).
- ثبت دستور بومی Skill با `commands.nativeSkills` و
  `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوند عددی می‌گیرند.

<AccordionGroup>
  <Accordion title="ارسال دستور Skill">
    به‌طور پیش‌فرض، دستورهای Skill مانند یک درخواست عادی به مدل هدایت می‌شوند.

    Skills می‌توانند `command-dispatch: tool` را اعلام کنند تا مستقیماً به یک ابزار هدایت شوند
    (قطعی، بدون دخالت مدل). نمونه: `/prose` (Plugin ‏OpenProse)
    — [OpenProse](/fa/prose) را ببینید.

  </Accordion>
  <Accordion title="آرگومان‌های دستور بومی">
    Discord برای گزینه‌های پویا و منوهای دکمه‌ای، وقتی آرگومان‌های
    لازم حذف شده باشند، از تکمیل خودکار استفاده می‌کند. Telegram و Slack برای دستورهایی که
    انتخاب دارند، منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا در برابر مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های
    مخصوص مدل مانند سطح‌های `/think` از بازنویسی `/model` نشست پیروی می‌کنند.
  </Accordion>
</AccordionGroup>

## `/tools` — عامل اکنون از چه چیزی می‌تواند استفاده کند

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد: **این عامل همین حالا در این
گفت‌وگو از چه چیزی می‌تواند استفاده کند** — نه یک کاتالوگ ایستای پیکربندی.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

نتایج در محدوده نشست هستند. تغییر عامل، کانال، رشته، مجوز فرستنده
یا مدل می‌تواند خروجی را تغییر دهد. برای ویرایش پروفایل و بازنویسی‌ها،
از پنل Tools در Control UI یا سطح‌های پیکربندی استفاده کنید.

## `/model` — انتخاب مدل

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

در Discord، ‏`/model` و `/models` یک انتخاب‌گر تعاملی با فهرست‌های کشویی ارائه‌دهنده و
مدل باز می‌کنند. انتخاب‌گر به `agents.defaults.models` احترام می‌گذارد، از جمله
ورودی‌های `provider/*`.

## `/config` — نوشتن پیکربندی روی دیسک

<Note>
  مخصوص مالک. به‌طور پیش‌فرض غیرفعال است — با `commands.config: true` فعال کنید.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

پیکربندی پیش از نوشتن اعتبارسنجی می‌شود. تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config`
پس از راه‌اندازی مجدد نیز ماندگار می‌مانند.

## `/mcp` — پیکربندی سرور MCP

<Note>
  مخصوص مالک. به‌طور پیش‌فرض غیرفعال است — با `commands.mcp: true` فعال کنید.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه در تنظیمات پروژه عامل تعبیه‌شده.

## `/debug` — بازنویسی‌های فقط زمان اجرا

<Note>
  مخصوص مالک. به‌طور پیش‌فرض غیرفعال است — با `commands.debug: true` فعال کنید.
  بازنویسی‌ها فوراً روی خواندن‌های جدید پیکربندی اعمال می‌شوند، اما روی دیسک نوشته **نمی‌شوند**.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — مدیریت Plugin

<Note>
  نوشتن فقط برای مالک است. به‌طور پیش‌فرض غیرفعال است — با `commands.plugins: true` فعال کنید.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` پیکربندی Plugin را به‌روزرسانی می‌کند و زمان اجرای Plugin در Gateway را
برای نوبت‌های جدید عامل، بی‌درنگ بارگذاری مجدد می‌کند. `/plugins install` به‌دلیل تغییر ماژول‌های منبع
Plugin، Gatewayهای مدیریت‌شده را به‌طور خودکار راه‌اندازی مجدد می‌کند.

## `/trace` — خروجی ردگیری Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` خط‌های ردگیری/اشکال‌زدایی Plugin در محدوده نشست را بدون حالت کاملِ مفصل
نمایان می‌کند. جایگزین `/debug` (بازنویسی‌های زمان اجرا) یا `/verbose` (خروجی عادی
ابزار) نیست.

## `/btw` — پرسش‌های جانبی

`/btw` یک پرسش جانبی سریع درباره زمینه نشست فعلی است. نام مستعار: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

برخلاف پیام عادی:

- از نشست فعلی به‌عنوان زمینه پس‌زمینه استفاده می‌کند.
- در نشست‌های مهار Codex، به‌صورت رشته جانبی موقت Codex اجرا می‌شود.
- زمینه نشست آینده را تغییر **نمی‌دهد**.
- در تاریخچه رونوشت نوشته نمی‌شود.

برای رفتار کامل، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## یادداشت‌های سطح

<AccordionGroup>
  <Accordion title="محدوده‌بندی نشست برای هر سطح">
    - **دستورهای متنی:** در نشست گفت‌وگوی عادی اجرا می‌شوند (DMها `main` را مشترک دارند، گروه‌ها نشست خودشان را دارند).
    - **دستورهای بومی Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **دستورهای بومی Slack:** `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
    - **دستورهای بومی Telegram:** `telegram:slash:<userId>` (نشست گفت‌وگو را از طریق `CommandTargetSessionKey` هدف می‌گیرد)
    - **`/stop`** نشست گفت‌وگوی فعال را هدف می‌گیرد تا اجرای فعلی را متوقف کند.

  </Accordion>
  <Accordion title="جزئیات Slack">
    `channels.slack.slashCommand` از یک دستور به سبک `/openclaw` پشتیبانی می‌کند.
    با `commands.native: true`، برای هر دستور داخلی یک دستور اسلش Slack بسازید.
    `/agentstatus` را ثبت کنید (نه `/status`) چون Slack ‏`/status` را رزرو کرده است.
    متن `/status` همچنان در پیام‌های Slack کار می‌کند.
  </Accordion>
  <Accordion title="مسیر سریع و میان‌برهای درون‌خطی">
    - پیام‌های فقط دستور از فرستندگان موجود در فهرست مجاز فوراً پردازش می‌شوند (دور زدن صف + مدل).
    - میان‌برهای درون‌خطی (`/help`, `/commands`, `/status`, `/whoami`) در پیام‌های عادی نیز کار می‌کنند و پیش از آنکه مدل متن باقی‌مانده را ببیند، حذف می‌شوند.
    - پیام‌های فقط دستورِ غیرمجاز بی‌صدا نادیده گرفته می‌شوند؛ توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="یادداشت‌های آرگومان">
    - دستورها یک `:` اختیاری بین دستور و آرگومان‌ها می‌پذیرند (`/think: high`, `/send: on`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام ارائه‌دهنده را می‌پذیرد (تطبیق مبهم)؛ اگر تطبیقی نباشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - `/allowlist add|remove` به `commands.config: true` نیاز دارد و به `configWrites` کانال احترام می‌گذارد.

  </Accordion>
</AccordionGroup>

## استفاده و وضعیت ارائه‌دهنده

- **استفاده/سهمیه ارائه‌دهنده** (مانند «۸۰٪ Claude باقی مانده») وقتی ردیابی استفاده فعال باشد، در `/status` برای ارائه‌دهنده مدل فعلی نشان داده می‌شود.
- **خط‌های توکن/کش** در `/status` وقتی تصویر لحظه‌ای نشست زنده کم‌جزئیات باشد، می‌توانند به آخرین ورودی استفاده رونوشت برگردند.
- **اجرا در برابر زمان اجرا:** `/status` برای مسیر sandbox مؤثر `Execution` و برای کسی که نشست را اجرا می‌کند `Runtime` را گزارش می‌کند: `OpenClaw Default`، ‏`OpenAI Codex`، یک پس‌زمینه CLI، یا یک پس‌زمینه ACP.
- **توکن/هزینه برای هر پاسخ:** با `/usage off|tokens|full` کنترل می‌شود.
- `/model status` درباره مدل‌ها/احراز هویت/نقاط پایانی است، نه استفاده.

## مرتبط

<CardGroup cols={2}>
  <Card title="Skills" href="/fa/tools/skills" icon="puzzle-piece">
    چگونگی ثبت و کنترل دسترسی دستورهای اسلش Skill.
  </Card>
  <Card title="ساخت Skills" href="/fa/tools/creating-skills" icon="hammer">
    Skillی بسازید که دستور اسلش خودش را ثبت می‌کند.
  </Card>
  <Card title="BTW" href="/fa/tools/btw" icon="comments">
    پرسش‌های جانبی بدون تغییر زمینه نشست.
  </Card>
  <Card title="هدایت" href="/fa/tools/steer" icon="compass">
    عامل را در میانه اجرا با `/steer` هدایت کنید.
  </Card>
</CardGroup>
