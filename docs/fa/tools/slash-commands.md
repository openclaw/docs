---
read_when:
    - استفاده یا پیکربندی فرمان‌های چت
    - اشکال‌زدایی مسیریابی فرمان یا مجوزها
    - آشنایی با نحوهٔ ثبت فرمان‌های Skills
sidebarTitle: Slash commands
summary: همهٔ دستورهای اسلش، دستورالعمل‌ها و میان‌برهای درون‌خطی موجود — پیکربندی، مسیریابی و رفتار مختص هر سطح.
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-07-01T20:31:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway دستورهایی را مدیریت می‌کند که به‌صورت پیام‌های مستقل و با شروع `/` فرستاده می‌شوند.
دستورهای bash فقط میزبان از `! <cmd>` استفاده می‌کنند (با `/bash <cmd>` به‌عنوان نام مستعار).

وقتی یک گفتگو به یک نشست ACP متصل است، متن عادی به harness مربوط به ACP
هدایت می‌شود. دستورهای مدیریتی Gateway محلی می‌مانند: `/acp ...` همیشه به
مدیریت‌کنندهٔ دستور OpenClaw می‌رسد، و `/status` به‌همراه `/unfocus` هر زمان
که مدیریت دستور برای آن سطح فعال باشد محلی می‌مانند.

## سه نوع دستور

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    پیام‌های مستقل `/...` که توسط Gateway مدیریت می‌شوند. باید به‌عنوان
    تنها محتوای پیام فرستاده شوند.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — پیش از آنکه مدل پیام را ببیند از پیام
    حذف می‌شوند. وقتی به‌تنهایی فرستاده شوند تنظیمات نشست را پایدار می‌کنند؛
    وقتی همراه متن دیگر فرستاده شوند مانند راهنمایی‌های درون‌خطی عمل می‌کنند.
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — بلافاصله اجرا می‌شوند و
    پیش از آنکه مدل متن باقی‌مانده را ببیند حذف می‌شوند. فقط فرستنده‌های مجاز.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - دستورالعمل‌ها پیش از آنکه مدل پیام را ببیند از پیام حذف می‌شوند.
    - در پیام‌های **فقط دستورالعمل** (پیام فقط شامل دستورالعمل‌هاست)، آن‌ها
      در نشست پایدار می‌شوند و با یک تأیید پاسخ می‌دهند.
    - در پیام‌های **گفتگوی عادی** همراه متن دیگر، آن‌ها مانند راهنمایی‌های
      درون‌خطی عمل می‌کنند و تنظیمات نشست را پایدار **نمی‌کنند**.
    - دستورالعمل‌ها فقط برای **فرستنده‌های مجاز** اعمال می‌شوند. اگر `commands.allowFrom`
      تنظیم شده باشد، همان تنها allowlist استفاده‌شده است؛ در غیر این صورت
      مجوز از allowlistها/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. فرستنده‌های
      غیرمجاز می‌بینند که دستورالعمل‌ها مانند متن ساده رفتار می‌شوند.
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
  پردازش `/...` را در پیام‌های گفتگو فعال می‌کند. روی سطح‌هایی که دستورهای بومی ندارند
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams)، دستورهای متنی
  حتی وقتی روی `false` تنظیم شده باشد کار می‌کنند.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  دستورهای بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش؛
  برای providerهای بدون پشتیبانی بومی نادیده گرفته می‌شود. برای هر کانال با
  `channels.<provider>.commands.native` بازنویسی کنید. در Discord، مقدار `false` از ثبت
  slash-command می‌گذرد؛ دستورهایی که قبلاً ثبت شده‌اند ممکن است تا زمان حذف همچنان قابل مشاهده بمانند.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  دستورهای Skills را وقتی پشتیبانی شود به‌صورت بومی ثبت می‌کند. خودکار: برای
  Discord/Telegram روشن؛ برای Slack خاموش. با
  `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` را برای اجرای دستورهای shell میزبان فعال می‌کند (نام مستعار `/bash <cmd>`). به
  allowlistهای `tools.elevated` نیاز دارد.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  مدت زمانی که bash پیش از تغییر به حالت پس‌زمینه صبر می‌کند (`0` بلافاصله
  به پس‌زمینه می‌برد).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). فقط مالک.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` را فعال می‌کند (پیکربندی MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند/می‌نویسد). فقط مالک.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` را فعال می‌کند (کشف/وضعیت Plugin به‌همراه نصب + فعال/غیرفعال‌سازی). نوشتن فقط برای مالک.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` را فعال می‌کند (بازنویسی‌های پیکربندی فقط زمان اجرا). فقط مالک.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` و کنش‌های ابزار راه‌اندازی دوبارهٔ gateway را فعال می‌کند.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  allowlist صریح مالک برای سطح‌های دستور فقط مالک. جدا از
  `commands.allowFrom` و دسترسی جفت‌سازی DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  برای هر کانال: برای دستورهای فقط مالک به هویت مالک نیاز دارد. وقتی `true` باشد،
  فرستنده باید با `commands.ownerAllowFrom` مطابق باشد یا scope داخلی `operator.admin`
  داشته باشد. یک ورودی wildcard در `allowFrom` **کافی نیست**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در اعلان سیستم ظاهر شوند.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  راز HMAC که وقتی `commands.ownerDisplay: "hash"` باشد استفاده می‌شود.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  allowlist برای هر provider جهت مجوزدهی دستور. وقتی پیکربندی شود، برای
  دستورها و دستورالعمل‌ها **تنها** منبع مجوز است. از `"*"` برای مقدار پیش‌فرض
  سراسری استفاده کنید؛ کلیدهای ویژهٔ provider آن را بازنویسی می‌کنند.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، allowlistها/سیاست‌ها را برای دستورها اعمال می‌کند.
</ParamField>

## فهرست دستورها

دستورها از سه منبع می‌آیند:

- **داخلی‌های هسته:** `src/auto-reply/commands-registry.shared.ts`
- **دستورهای dock تولیدشده:** `src/auto-reply/commands-registry.data.ts`
- **دستورهای Plugin:** فراخوانی‌های `registerCommand()` مربوط به Plugin

دسترس‌پذیری به پرچم‌های پیکربندی، سطح کانال، و Pluginهای نصب‌شده/فعال
بستگی دارد.

### دستورهای هسته

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | دستور | توضیح |
    | --- | --- |
    | `/new [model]` | نشست فعلی را بایگانی می‌کند و یک نشست تازه شروع می‌کند |
    | `/reset [soft [message]]` | نشست فعلی را درجا بازنشانی می‌کند. `soft` رونوشت را نگه می‌دارد، شناسه‌های نشست backend مربوط به CLI را که دوباره استفاده شده‌اند حذف می‌کند، و startup را دوباره اجرا می‌کند |
    | `/name <title>` | نشست فعلی را نام‌گذاری یا تغییرنام می‌کند. عنوان را حذف کنید تا نام فعلی و یک پیشنهاد را ببینید |
    | `/compact [instructions]` | زمینهٔ نشست را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید |
    | `/stop` | اجرای فعلی را متوقف می‌کند |
    | `/session idle <duration\|off>` | انقضای idle مربوط به اتصال thread را مدیریت می‌کند |
    | `/session max-age <duration\|off>` | انقضای حداکثر عمر مربوط به اتصال thread را مدیریت می‌کند |
    | `/export-session [path]` | نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export` |
    | `/export-trajectory [path]` | یک بستهٔ trajectory با قالب JSONL برای نشست فعلی صادر می‌کند. نام مستعار: `/trajectory` |

    <Note>
      Control UI ورودی تایپ‌شدهٔ `/new` را رهگیری می‌کند تا یک نشست داشبورد تازه
      بسازد و به آن جابه‌جا شود، مگر وقتی `session.dmScope: "main"` پیکربندی شده
      باشد و والد فعلی نشست اصلی agent باشد — در آن حالت `/new`
      نشست اصلی را درجا بازنشانی می‌کند. `/reset` تایپ‌شده همچنان بازنشانی درجای
      Gateway را اجرا می‌کند. وقتی می‌خواهید انتخاب مدل سنجاق‌شدهٔ نشست را پاک کنید
      از `/model default` استفاده کنید.
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | دستور | توضیح |
    | --- | --- |
    | `/think <level\|default>` | سطح فکرکردن را تنظیم می‌کند یا بازنویسی نشست را پاک می‌کند. نام‌های مستعار: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | خروجی verbose را تغییر وضعیت می‌دهد. نام مستعار: `/v` |
    | `/trace on\|off` | خروجی trace مربوط به Plugin را برای نشست فعلی تغییر وضعیت می‌دهد |
    | `/fast [status\|auto\|on\|off\|default]` | حالت سریع را نمایش می‌دهد، تنظیم می‌کند، یا پاک می‌کند |
    | `/reasoning [on\|off\|stream]` | مشاهده‌پذیری reasoning را تغییر وضعیت می‌دهد. نام مستعار: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | حالت elevated را تغییر وضعیت می‌دهد. نام مستعار: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | پیش‌فرض‌های exec را نمایش می‌دهد یا تنظیم می‌کند |
    | `/login [codex\|openai\|openai-codex]` | ورود Codex/OpenAI را از یک گفتگوی خصوصی یا نشست Web UI جفت می‌کند. فقط مالک/admin |
    | `/model [name\|#\|status]` | مدل را نمایش می‌دهد یا تنظیم می‌کند |
    | `/models [provider] [page] [limit=<n>\|all]` | providerها یا مدل‌های پیکربندی‌شده/دارای auth را فهرست می‌کند |
    | `/queue <mode>` | رفتار صف اجرای فعال را مدیریت می‌کند. [Queue](/fa/concepts/queue) و [هدایت Queue](/fa/concepts/queue-steering) را ببینید |
    | `/steer <message>` | راهنمایی را به اجرای فعال تزریق می‌کند. نام مستعار: `/tell`. [Steer](/fa/tools/steer) را ببینید |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` برای debugging است — در استفادهٔ عادی آن را **خاموش** نگه دارید.
        - `/trace` فقط خط‌های trace/debug متعلق به Plugin را آشکار می‌کند؛ گفت‌وگوی verbose عادی خاموش می‌ماند.
        - `/fast auto|on|off` یک بازنویسی نشست را پایدار می‌کند؛ برای پاک‌کردن آن از گزینهٔ `inherit` در Sessions UI استفاده کنید.
        - `/fast` ویژهٔ provider است: OpenAI/Codex آن را به `service_tier=priority` نگاشت می‌کنند؛ درخواست‌های مستقیم Anthropic آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند.
        - `/reasoning`، `/verbose`، و `/trace` در تنظیمات گروهی پرریسک هستند — ممکن است reasoning داخلی یا diagnostics مربوط به Plugin را آشکار کنند. در گفتگوهای گروهی آن‌ها را خاموش نگه دارید.

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` مدل جدید را بلافاصله در نشست پایدار می‌کند.
        - اگر agent idle باشد، اجرای بعدی فوراً از آن استفاده می‌کند.
        - اگر اجرایی فعال باشد، جابه‌جایی به‌عنوان pending علامت‌گذاری می‌شود و در نقطهٔ retry تمیز بعدی اعمال می‌شود.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | دستور | توضیح |
    | --- | --- |
    | `/help` | خلاصهٔ کمک کوتاه را نشان می‌دهد |
    | `/commands` | کاتالوگ دستور تولیدشده را نشان می‌دهد |
    | `/tools [compact\|verbose]` | نشان می‌دهد agent فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند |
    | `/status` | وضعیت اجرا/زمان اجرا، uptime مربوط به Gateway و سیستم، سلامت Plugin، به‌همراه مصرف/سهمیهٔ provider را نشان می‌دهد |
    | `/status plugins` | سلامت تفصیلی Plugin را نشان می‌دهد: خطاهای بارگذاری، quarantineها، خرابی‌های کانال، مشکلات وابستگی، اطلاعیه‌های سازگاری |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | [goal](/fa/tools/goal) پایدار نشست فعلی را مدیریت می‌کند |
    | `/diagnostics [note]` | جریان گزارش پشتیبانی فقط مالک. هر بار تأیید exec می‌خواهد |
    | `/crestodian <request>` | کمک‌کنندهٔ setup و repair مربوط به Crestodian را از DM مالک اجرا می‌کند |
    | `/tasks` | وظایف پس‌زمینهٔ فعال/اخیر برای نشست فعلی را فهرست می‌کند |
    | `/context [list\|detail\|map\|json]` | توضیح می‌دهد context چگونه مونتاژ می‌شود |
    | `/whoami` | شناسهٔ فرستندهٔ شما را نشان می‌دهد. نام مستعار: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | footer مصرف هر پاسخ را کنترل می‌کند (`reset`/`inherit`/`clear`/`default` بازنویسی نشست را پاک می‌کند تا دوباره مقدار پیش‌فرض پیکربندی‌شده را به ارث ببرد) یا یک خلاصهٔ هزینهٔ محلی چاپ می‌کند |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | دستور | توضیح |
    | --- | --- |
    | `/skill <name> [input]` | یک Skill را با نام اجرا می‌کند |
    | `/allowlist [list\|add\|remove] ...` | ورودی‌های allowlist را مدیریت می‌کند. فقط متن |
    | `/approve <id> <decision>` | promptهای تأیید exec یا Plugin را حل می‌کند |
    | `/btw <question>` | بدون تغییر context نشست، یک پرسش جانبی می‌پرسد. نام مستعار: `/side`. [BTW](/fa/tools/btw) را ببینید |
  </Accordion>

  <Accordion title="زیرعامل‌ها و ACP">
    | دستور | توضیح |
    | --- | --- |
    | `/subagents list\|log\|info` | اجراهای زیرعامل را برای نشست فعلی بررسی کنید |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت کنید. کنترل‌های زمان اجرا به مالک خارجی یا هویت مدیر داخلی Gateway نیاز دارند |
    | `/focus <target>` | رشته فعلی Discord یا موضوع Telegram را به یک هدف نشست متصل کنید |
    | `/unfocus` | اتصال رشته فعلی را حذف کنید |
    | `/agents` | عامل‌های متصل به رشته را برای نشست فعلی فهرست کنید |
  </Accordion>

  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    | دستور | نیازمند | توضیح |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | خواندن یا نوشتن `openclaw.json`. فقط مالک |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | خواندن یا نوشتن پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw. فقط مالک |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | بررسی یا تغییر وضعیت plugin. برای نوشتن فقط مالک. نام مستعار: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | بازنویسی‌های پیکربندی فقط در زمان اجرا. فقط مالک |
    | `/restart` | `commands.restart: true` (پیش‌فرض) | راه‌اندازی مجدد OpenClaw |
    | `/send on\|off\|inherit` | مالک | تنظیم خط‌مشی ارسال |
  </Accordion>

  <Accordion title="صدا، TTS، کنترل کانال">
    | دستور | توضیح |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | کنترل TTS. [TTS](/fa/tools/tts) را ببینید |
    | `/activation mention\|always` | تنظیم حالت فعال‌سازی گروه |
    | `/bash <command>` | اجرای یک دستور پوسته میزبان. نام مستعار: `! <command>`. نیازمند `commands.bash: true` |
    | `!poll [sessionId]` | بررسی یک کار bash پس‌زمینه |
    | `!stop [sessionId]` | توقف یک کار bash پس‌زمینه |
  </Accordion>
</AccordionGroup>

### دستورهای dock

دستورهای dock مسیر پاسخ نشست فعال را به کانال لینک‌شده دیگری تغییر می‌دهند.
برای راه‌اندازی و عیب‌یابی، [اتصال کانال](/fa/concepts/channel-docking) را ببینید.

تولیدشده از pluginهای کانال با پشتیبانی از دستور بومی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

دستورهای dock به `session.identityLinks` نیاز دارند. فرستنده مبدأ و همتای هدف
باید در همان گروه هویتی باشند.

### دستورهای plugin همراه

| دستور                                                                                      | توضیح                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | روشن/خاموش کردن Dreaming حافظه (مالک یا مدیر Gateway). [Dreaming](/fa/concepts/dreaming) را ببینید |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | مدیریت جفت‌سازی دستگاه. [جفت‌سازی](/fa/channels/pairing) را ببینید                             |
| `/phone status\|arm ...\|disarm`                                                             | مسلح‌کردن موقت دستورهای گره تلفن پرخطر                                       |
| `/voice status\|list\|set <voiceId>`                                                         | مدیریت پیکربندی صدای Talk. نام بومی Discord: `/talkvoice`                         |
| `/card ...`                                                                                  | ارسال پیش‌تنظیم‌های کارت غنی LINE. [LINE](/fa/channels/line) را ببینید                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | کنترل هارنس سرور برنامه Codex. [هارنس Codex](/fa/plugins/codex-harness) را ببینید   |

فقط QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### دستورهای Skills

Skills قابل فراخوانی توسط کاربر به‌صورت دستورهای اسلش ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills ممکن است به‌عنوان دستورهای مستقیم ثبت شوند (برای مثال `/prose` برای OpenProse).
- ثبت دستور بومی Skill با `commands.nativeSkills` و
  `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوندهای عددی می‌گیرند.

<AccordionGroup>
  <Accordion title="ارسال دستور Skill">
    به‌صورت پیش‌فرض، دستورهای Skill مانند یک درخواست عادی به مدل مسیر داده می‌شوند.

    Skills می‌توانند `command-dispatch: tool` را اعلام کنند تا مستقیماً به یک ابزار مسیر داده شوند
    (قطعی، بدون دخالت مدل). مثال: `/prose` (plugin OpenProse)
    — [OpenProse](/fa/prose) را ببینید.

  </Accordion>
  <Accordion title="آرگومان‌های دستور بومی">
    Discord برای گزینه‌های پویا و منوهای دکمه‌ای، هنگامی که آرگومان‌های الزامی
    حذف شده‌اند، از تکمیل خودکار استفاده می‌کند. Telegram و Slack برای دستورهایی با
    انتخاب‌ها یک منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا در برابر مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های
    خاص مدل مانند سطوح `/think` از بازنویسی `/model` نشست پیروی می‌کنند.
  </Accordion>
</AccordionGroup>

## `/tools` — عامل اکنون از چه چیزی می‌تواند استفاده کند

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد: **این عامل همین حالا در این
گفت‌وگو از چه چیزی می‌تواند استفاده کند** — نه یک کاتالوگ پیکربندی ایستا.

```text
/tools         # نمای فشرده
/tools verbose # همراه با توضیح‌های کوتاه
```

نتایج محدود به نشست هستند. تغییر عامل، کانال، رشته، مجوز
فرستنده، یا مدل می‌تواند خروجی را تغییر دهد. برای ویرایش پروفایل و بازنویسی،
از پنل Tools در Control UI یا سطوح پیکربندی استفاده کنید.

## `/model` — انتخاب مدل

```text
/model             # نمایش انتخابگر مدل
/model list        # همان
/model 3           # انتخاب بر اساس شماره از انتخابگر
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # پاک‌کردن انتخاب مدل نشست
/model status      # نمای جزئی با نقطه پایانی و حالت API
```

در Discord، `/model` و `/models` یک انتخابگر تعاملی با فهرست‌های کشویی ارائه‌دهنده و
مدل باز می‌کنند. انتخابگر به `agents.defaults.models`، از جمله
ورودی‌های `provider/*`، احترام می‌گذارد.

## `/config` — نوشتن پیکربندی روی دیسک

<Note>
  فقط مالک. به‌صورت پیش‌فرض غیرفعال است — با `commands.config: true` فعال کنید.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

پیکربندی پیش از نوشتن اعتبارسنجی می‌شود. تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config`
پس از راه‌اندازی مجدد نیز باقی می‌مانند.

## `/mcp` — پیکربندی سرور MCP

<Note>
  فقط مالک. به‌صورت پیش‌فرض غیرفعال است — با `commands.mcp: true` فعال کنید.
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
  فقط مالک. به‌صورت پیش‌فرض غیرفعال است — با `commands.debug: true` فعال کنید.
  بازنویسی‌ها فوراً روی خواندن‌های جدید پیکربندی اعمال می‌شوند، اما روی دیسک نوشته **نمی‌شوند**.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — مدیریت plugin

<Note>
  برای نوشتن فقط مالک. به‌صورت پیش‌فرض غیرفعال است — با `commands.plugins: true` فعال کنید.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` پیکربندی plugin را به‌روزرسانی می‌کند و زمان اجرای plugin
Gateway را برای نوبت‌های جدید عامل بازبارگذاری داغ می‌کند. `/plugins install` به‌دلیل تغییر ماژول‌های منبع
plugin، Gatewayهای مدیریت‌شده را به‌صورت خودکار راه‌اندازی مجدد می‌کند.

## `/trace` — خروجی trace plugin

```text
/trace          # نمایش وضعیت trace فعلی
/trace on
/trace off
```

`/trace` خطوط trace/debug مربوط به plugin و محدود به نشست را بدون حالت verbose کامل آشکار می‌کند.
این جایگزین `/debug` (بازنویسی‌های زمان اجرا) یا `/verbose` (خروجی عادی ابزار)
نمی‌شود.

## `/btw` — پرسش‌های جانبی

`/btw` یک پرسش جانبی سریع درباره زمینه نشست فعلی است. نام مستعار: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

برخلاف یک پیام عادی:

- از نشست فعلی به‌عنوان زمینه پس‌زمینه استفاده می‌کند.
- در نشست‌های هارنس Codex، به‌صورت یک رشته جانبی موقت Codex اجرا می‌شود.
- زمینه نشست‌های آینده را تغییر **نمی‌دهد**.
- در تاریخچه transcript نوشته نمی‌شود.

برای رفتار کامل، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## نکات سطح

<AccordionGroup>
  <Accordion title="محدوده‌بندی نشست در هر سطح">
    - **دستورهای متنی:** در نشست چت عادی اجرا می‌شوند (DMها `main` را به اشتراک می‌گذارند، گروه‌ها نشست خودشان را دارند).
    - **دستورهای بومی Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **دستورهای بومی Slack:** `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
    - **دستورهای بومی Telegram:** `telegram:slash:<userId>` (نشست چت را از طریق `CommandTargetSessionKey` هدف می‌گیرد)
    - **`/login codex`** کدهای جفت‌سازی دستگاه را فقط از طریق چت خصوصی یا مسیرهای پاسخ Web UI ارسال می‌کند. فراخوانی‌های گروه/موضوع Telegram از مالک می‌خواهند به‌جای آن به ربات DM بدهد.
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا اجرای فعلی را لغو کند.

  </Accordion>
  <Accordion title="جزئیات Slack">
    `channels.slack.slashCommand` از یک دستور سبک `/openclaw` پشتیبانی می‌کند.
    با `commands.native: true`، برای هر دستور داخلی یک دستور اسلش Slack
    بسازید. `/agentstatus` را ثبت کنید (نه `/status`) زیرا Slack
    `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.
  </Accordion>
  <Accordion title="مسیر سریع و میانبرهای درون‌خطی">
    - پیام‌های فقط‌دستور از فرستندگان موجود در allowlist فوراً رسیدگی می‌شوند (دورزدن صف + مدل).
    - میانبرهای درون‌خطی (`/help`, `/commands`, `/status`, `/whoami`) همچنین در پیام‌های عادی جاسازی‌شده کار می‌کنند و پیش از آنکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.
    - پیام‌های فقط‌دستور غیرمجاز بی‌صدا نادیده گرفته می‌شوند؛ توکن‌های درون‌خطی `/...` به‌عنوان متن ساده برخورد می‌شوند.

  </Accordion>
  <Accordion title="نکات آرگومان">
    - دستورها یک `:` اختیاری بین دستور و آرگومان‌ها می‌پذیرند (`/think: high`, `/send: on`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام ارائه‌دهنده را می‌پذیرد (تطبیق فازی)؛ اگر هیچ تطبیقی نباشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - `/allowlist add|remove` به `commands.config: true` نیاز دارد و به `configWrites` کانال احترام می‌گذارد.

  </Accordion>
</AccordionGroup>

## استفاده و وضعیت ارائه‌دهنده

- **استفاده/سهمیه ارائه‌دهنده** (برای مثال، "Claude 80% left") هنگامی که رهگیری استفاده فعال باشد، در `/status` برای ارائه‌دهنده مدل فعلی نشان داده می‌شود.
- **خطوط توکن/کش** در `/status` می‌توانند هنگامی که snapshot نشست زنده کم‌جزئیات است، به آخرین ورودی استفاده transcript بازگردند.
- **اجرا در برابر زمان اجرا:** `/status` برای مسیر sandbox مؤثر `Execution` و برای کسی که نشست را اجرا می‌کند `Runtime` را گزارش می‌کند: `OpenClaw Default`، `OpenAI Codex`، یک backend مربوط به CLI، یا یک backend مربوط به ACP.
- **توکن‌ها/هزینه به‌ازای هر پاسخ:** با `/usage off|tokens|full` کنترل می‌شود.
- `/model status` درباره مدل‌ها/احراز هویت/نقاط پایانی است، نه استفاده.

## مرتبط

<CardGroup cols={2}>
  <Card title="Skills" href="/fa/tools/skills" icon="puzzle-piece">
    نحوه ثبت و محدودسازی دستورهای اسلش Skill.
  </Card>
  <Card title="ساخت Skills" href="/fa/tools/creating-skills" icon="hammer">
    یک Skill بسازید که دستور اسلش خودش را ثبت کند.
  </Card>
  <Card title="BTW" href="/fa/tools/btw" icon="comments">
    پرسش‌های جانبی بدون تغییر زمینه نشست.
  </Card>
  <Card title="Steer" href="/fa/tools/steer" icon="compass">
    عامل را در میانه اجرا با `/steer` هدایت کنید.
  </Card>
</CardGroup>
