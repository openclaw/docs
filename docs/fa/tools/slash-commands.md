---
read_when:
    - استفاده از فرمان‌های چت یا پیکربندی آن‌ها
    - اشکال‌زدایی مسیریابی دستور یا مجوزها
sidebarTitle: Slash commands
summary: 'دستورهای اسلش: متنی در برابر بومی، پیکربندی، و دستورهای پشتیبانی‌شده'
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-04-30T09:44:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

دستورها توسط Gateway مدیریت می‌شوند. بیشتر دستورها باید به‌صورت پیام **مستقل** که با `/` شروع می‌شود ارسال شوند. دستور گفت‌وگوی bash فقط برای میزبان از `! <cmd>` استفاده می‌کند (`/bash <cmd>` نیز نام مستعار آن است).

وقتی یک گفت‌وگو یا رشته به یک نشست ACP متصل باشد، متن‌های پیگیری معمولی به همان چارچوب ACP هدایت می‌شوند. دستورهای مدیریتی Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به کنترل‌کننده دستور ACP در OpenClaw می‌رسد، و `/status` همراه با `/unfocus` هر زمان که مدیریت دستورها برای آن سطح فعال باشد محلی می‌مانند.

دو سیستم مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="دستورها">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="رهنمودها">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - رهنمودها پیش از آنکه مدل پیام را ببیند از پیام حذف می‌شوند.
    - در پیام‌های گفت‌وگوی معمولی (نه پیام‌هایی که فقط رهنمود هستند)، به‌عنوان «راهنمایی‌های درون‌خطی» در نظر گرفته می‌شوند و تنظیمات نشست را **ماندگار** نمی‌کنند.
    - در پیام‌هایی که فقط رهنمود هستند (پیام فقط شامل رهنمودهاست)، روی نشست ماندگار می‌شوند و با تأیید پاسخ داده می‌شود.
    - رهنمودها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، تنها فهرست مجاز مورد استفاده است؛ در غیر این صورت مجوز از فهرست‌های مجاز/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. فرستندگان غیرمجاز رهنمودها را به‌صورت متن ساده می‌بینند.

  </Accordion>
  <Accordion title="میانبرهای درون‌خطی">
    فقط فرستندگان موجود در فهرست مجاز/مجازشده: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

    این‌ها بلافاصله اجرا می‌شوند، پیش از آنکه مدل پیام را ببیند حذف می‌شوند، و متن باقی‌مانده از جریان عادی ادامه پیدا می‌کند.

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
  پردازش `/...` را در پیام‌های گفت‌وگو فعال می‌کند. روی سطح‌هایی که دستور بومی ندارند (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، دستورهای متنی همچنان کار می‌کنند حتی اگر این گزینه را روی `false` بگذارید.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  دستورهای بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (تا زمانی که دستورهای اسلش را اضافه کنید)؛ برای ارائه‌دهندگانی که پشتیبانی بومی ندارند نادیده گرفته می‌شود. برای بازنویسی در هر ارائه‌دهنده، `channels.discord.commands.native`، `channels.telegram.commands.native`، یا `channels.slack.commands.native` را تنظیم کنید (بولی یا `"auto"`). مقدار `false` هنگام راه‌اندازی دستورهای قبلاً ثبت‌شده را در Discord/Telegram پاک می‌کند. دستورهای Slack در برنامه Slack مدیریت می‌شوند و به‌طور خودکار حذف نمی‌شوند.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  دستورهای **skill** را وقتی پشتیبانی شوند به‌صورت بومی ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack نیاز دارد برای هر skill یک دستور اسلش ساخته شود). برای بازنویسی در هر ارائه‌دهنده، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills`، یا `channels.slack.commands.nativeSkills` را تنظیم کنید (بولی یا `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` را برای اجرای دستورهای پوسته میزبان فعال می‌کند (`/bash <cmd>` یک نام مستعار است؛ به فهرست‌های مجاز `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash پیش از رفتن به حالت پس‌زمینه چه مدت منتظر بماند (`0` بلافاصله به پس‌زمینه می‌برد).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` را فعال می‌کند (پیکربندی MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند/می‌نویسد).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` را فعال می‌کند (کشف/وضعیت plugin به‌همراه کنترل‌های نصب و فعال‌سازی/غیرفعال‌سازی).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` را فعال می‌کند (بازنویسی‌های فقط زمان اجرا).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` را به‌همراه کنش‌های ابزار راه‌اندازی مجدد Gateway فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز مالک صریح را برای سطح‌های دستور/ابزار فقط مالک تنظیم می‌کند. این حساب اپراتور انسانی است که می‌تواند کنش‌های خطرناک را تأیید کند و دستورهایی مانند `/diagnostics`، `/export-trajectory`، و `/config` را اجرا کند. این از `commands.allowFrom` و از دسترسی جفت‌سازی پیام مستقیم جداست.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  در هر کانال: باعث می‌شود دستورهای فقط مالک برای اجرا روی آن سطح به **هویت مالک** نیاز داشته باشند. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک حل‌شده مطابقت داشته باشد (برای نمونه یک ورودی در `commands.ownerAllowFrom` یا فراداده مالک بومی ارائه‌دهنده) یا روی یک کانال پیام داخلی، دامنه داخلی `operator.admin` را داشته باشد. یک ورودی wildcard در `allowFrom` کانال، یا یک فهرست نامزد مالک خالی/حل‌نشده، کافی **نیست** — دستورهای فقط مالک در آن کانال به‌صورت fail-closed شکست می‌خورند. اگر می‌خواهید دستورهای فقط مالک فقط با `ownerAllowFrom` و فهرست‌های مجاز استاندارد دستورها محدود شوند، این گزینه را خاموش نگه دارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در اعلان سیستم نمایش داده شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  به‌صورت اختیاری راز HMAC مورد استفاده هنگام `commands.ownerDisplay="hash"` را تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز هر ارائه‌دهنده برای مجوزدهی دستورها. وقتی پیکربندی شود، تنها منبع مجوزدهی برای دستورها و رهنمودهاست (فهرست‌های مجاز/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). از `"*"` برای پیش‌فرض سراسری استفاده کنید؛ کلیدهای اختصاصی ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای دستورها اعمال می‌کند.
</ParamField>

## فهرست دستورها

منبع حقیقت فعلی:

- دستورهای داخلی هسته از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- دستورهای dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- دستورهای plugin از فراخوانی‌های `registerCommand()` در plugin می‌آیند
- دسترس‌پذیری واقعی روی gateway شما همچنان به پرچم‌های پیکربندی، سطح کانال، و pluginهای نصب‌شده/فعال‌شده وابسته است

### دستورهای داخلی هسته

<AccordionGroup>
  <Accordion title="نشست‌ها و اجراها">
    - `/new [model]` یک نشست جدید آغاز می‌کند؛ `/reset` نام مستعار بازنشانی است.
    - `/reset soft [message]` رونوشت فعلی را نگه می‌دارد، شناسه‌های نشست backend مربوط به CLI که دوباره استفاده شده‌اند را حذف می‌کند، و بارگذاری شروع/اعلان سیستم را درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` زمینه نشست را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را لغو می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال رشته را مدیریت می‌کنند.
    - `/export-session [path]` نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` درخواست تأیید exec می‌کند، سپس یک [بسته trajectory](/fa/tools/trajectory) با قالب JSONL برای نشست فعلی صادر می‌کند. وقتی به خط زمانی اعلان، ابزار، و رونوشت برای یک نشست OpenClaw نیاز دارید از آن استفاده کنید. در گفت‌وگوهای گروهی، اعلان تأیید و نتیجه صدور به‌صورت خصوصی برای مالک ارسال می‌شوند. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="مدل و کنترل‌های اجرا">
    - `/think <level>` سطح تفکر را تنظیم می‌کند. گزینه‌ها از نمایه ارائه‌دهنده مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium`، و `high` هستند، و سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max`، یا مقدار دودویی `on` فقط در جاهایی که پشتیبانی شوند وجود دارند. نام‌های مستعار: `/thinking`، `/t`.
    - `/verbose on|off|full` خروجی پرجزئیات را تغییر می‌دهد. نام مستعار: `/v`.
    - `/trace on|off` خروجی trace مربوط به plugin را برای نشست فعلی تغییر می‌دهد.
    - `/fast [status|on|off]` حالت سریع را نشان می‌دهد یا تنظیم می‌کند.
    - `/reasoning [on|off|stream]` نمایانی reasoning را تغییر می‌دهد. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را تغییر می‌دهد. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نشان می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نشان می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` ارائه‌دهندگان پیکربندی‌شده/دارای احراز هویت در دسترس یا مدل‌های یک ارائه‌دهنده را فهرست می‌کند؛ برای مرور کامل کاتالوگ آن ارائه‌دهنده، `all` را اضافه کنید.
    - `/queue <mode>` رفتار صف را مدیریت می‌کند (`steer`، `queue` قدیمی، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی نشست را پاک می‌کند. [صف دستور](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
  <Accordion title="کشف و وضعیت">
    - `/help` خلاصه کوتاه راهنما را نشان می‌دهد.
    - `/commands` کاتالوگ دستور تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد عامل فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا را نشان می‌دهد، از جمله برچسب‌های `Execution`/`Runtime` و مصرف/سهمیه ارائه‌دهنده وقتی در دسترس باشد.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط مالک برای باگ‌های Gateway و اجراهای چارچوب Codex است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` تأیید صریح exec درخواست می‌کند؛ diagnostics را با قاعده allow-all تأیید نکنید. پس از تأیید، گزارشی قابل چسباندن ارسال می‌کند که شامل مسیر بسته محلی، خلاصه manifest، یادداشت‌های حریم خصوصی، و شناسه‌های نشست مرتبط است. در گفت‌وگوهای گروهی، اعلان تأیید و گزارش به‌صورت خصوصی برای مالک ارسال می‌شوند. وقتی نشست فعال از چارچوب OpenAI Codex استفاده کند، همان تأیید همچنین بازخورد Codex مرتبط را به سرورهای OpenAI ارسال می‌کند و پاسخ کامل‌شده، شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و دستورهای `codex resume <thread-id>` را فهرست می‌کند. [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` دستیار راه‌اندازی و تعمیر Crestodian را از پیام مستقیم مالک اجرا می‌کند.
    - `/tasks` وظایف پس‌زمینه فعال/اخیر را برای نشست فعلی فهرست می‌کند.
    - `/context [list|detail|json]` توضیح می‌دهد زمینه چگونه ساخته می‌شود.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` پابرگ مصرف هر پاسخ را کنترل می‌کند یا خلاصه هزینه محلی را چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills، فهرست‌های مجاز، تأییدها">
    - `/skill <name> [input]` یک skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` ورودی‌های فهرست مجاز را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` اعلان‌های تأیید exec را حل می‌کند.
    - `/btw <question>` بدون تغییر زمینه نشست آینده، یک پرسش جانبی می‌پرسد. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="زیرعامل‌ها و ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجراهای زیرعامل را برای نشست فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند.
    - `/focus <target>` رشته فعلی Discord یا موضوع/گفت‌وگوی Telegram را به یک هدف نشست متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` عامل‌های متصل به رشته را برای نشست فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک یا همه زیرعامل‌های در حال اجرا را لغو می‌کند.
    - `/steer <id|#> <message>` به یک زیرعامل در حال اجرا هدایت ارسال می‌کند. نام مستعار: `/tell`.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت plugin را بررسی یا تغییر می‌دهد. `/plugin` یک نام مستعار است. نوشتن‌ها فقط برای مالک است. به `commands.plugins: true` نیاز دارد.
    - `/debug show|set|unset|reset` بازنویسی‌های پیکربندی فقط زمان اجرا را مدیریت می‌کند. فقط مالک. به `commands.debug: true` نیاز دارد.
    - `/restart` وقتی فعال باشد OpenClaw را راه‌اندازی مجدد می‌کند. پیش‌فرض: فعال؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/send on|off|inherit` سیاست ارسال را تنظیم می‌کند. فقط مالک.

  </Accordion>
  <Accordion title="صدا، TTS، کنترل کانال">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` TTS را کنترل می‌کند. [TTS](/fa/tools/tts) را ببینید.
    - `/activation mention|always` حالت فعال‌سازی گروه را تنظیم می‌کند.
    - `/bash <command>` یک فرمان پوسته میزبان را اجرا می‌کند. فقط متنی. نام مستعار: `! <command>`. به `commands.bash: true` به‌همراه فهرست‌های مجاز `tools.elevated` نیاز دارد.
    - `!poll [sessionId]` یک کار bash پس‌زمینه را بررسی می‌کند.
    - `!stop [sessionId]` یک کار bash پس‌زمینه را متوقف می‌کند.

  </Accordion>
</AccordionGroup>

### فرمان‌های dock تولیدشده

فرمان‌های dock مسیر پاسخ نشست فعلی را به کانال پیوندشده دیگری تغییر می‌دهند. برای راه‌اندازی، نمونه‌ها و عیب‌یابی، [Channel docking](/fa/concepts/channel-docking) را ببینید.

فرمان‌های dock از pluginهای کانال با پشتیبانی فرمان بومی تولید می‌شوند. مجموعه فعلی همراه:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از فرمان‌های dock در یک گفت‌وگوی مستقیم استفاده کنید تا مسیر پاسخ نشست فعلی را به کانال پیوندشده دیگری تغییر دهید. عامل همان زمینه نشست را نگه می‌دارد، اما پاسخ‌های بعدی آن نشست به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

فرمان‌های dock به `session.identityLinks` نیاز دارند. فرستنده مبدأ و همتای مقصد باید در یک گروه هویتی باشند، برای مثال `["telegram:123", "discord:456"]`. اگر کاربر Telegram با شناسه `123` فرمان `/dock_discord` را بفرستد، OpenClaw مقدار `lastChannel: "discord"` و `lastTo: "456"` را روی نشست فعال ذخیره می‌کند. اگر فرستنده به یک همتای Discord پیوند نشده باشد، فرمان به‌جای عبور به گفت‌وگوی عادی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

Docking فقط مسیر نشست فعال را تغییر می‌دهد. حساب‌های کانال ایجاد نمی‌کند، دسترسی نمی‌دهد، فهرست‌های مجاز کانال را دور نمی‌زند، یا تاریخچه رونوشت را به نشست دیگری منتقل نمی‌کند. برای تغییر دوباره مسیر از `/dock-telegram`، `/dock-slack`، `/dock-mattermost`، یا فرمان dock تولیدشده دیگری استفاده کنید.

### فرمان‌های plugin همراه

pluginهای همراه می‌توانند فرمان‌های اسلش بیشتری اضافه کنند. فرمان‌های همراه فعلی در این مخزن:

- `/dreaming [on|off|status|help]` Dreaming حافظه را روشن یا خاموش می‌کند. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [Pairing](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` فرمان‌های پرریسک گره تلفن را موقتاً مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام فرمان بومی `/talkvoice` است.
- `/card ...` پیش‌تنظیم‌های کارت غنی LINE را ارسال می‌کند. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` مهار app-server همراه Codex را بررسی و کنترل می‌کند. [Codex harness](/fa/plugins/codex-harness) را ببینید.
- فرمان‌های فقط QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### فرمان‌های Skills پویا

Skills قابل فراخوانی توسط کاربر نیز به‌صورت فرمان‌های اسلش ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills ممکن است وقتی skill/plugin آن‌ها را ثبت می‌کند به‌صورت فرمان‌های مستقیم مانند `/prose` نیز ظاهر شوند.
- ثبت فرمان بومی skill با `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.

<AccordionGroup>
  <Accordion title="نکات آرگومان و تجزیه‌گر">
    - فرمان‌ها یک `:` اختیاری بین فرمان و آرگومان‌ها می‌پذیرند (مثلاً `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام provider را می‌پذیرد (تطبیق تقریبی)؛ اگر تطبیقی نباشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل مصرف provider، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و به `configWrites` کانال احترام می‌گذارد.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدفمند برای پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز به `configWrites` حساب هدف احترام می‌گذارند.
    - `/usage` پانویس مصرف هر پاسخ را کنترل می‌کند؛ `/usage cost` خلاصه هزینه محلی را از گزارش‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌صورت پیش‌فرض فعال است؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات plugin را می‌پذیرد که `openclaw plugins install` می‌پذیرد: مسیر/آرشیو محلی، بسته npm، یا `clawhub:<pkg>`.
    - `/plugins enable|disable` پیکربندی plugin را به‌روزرسانی می‌کند و ممکن است درخواست راه‌اندازی مجدد بدهد.

  </Accordion>
  <Accordion title="رفتار ویژه کانال">
    - فرمان بومی فقط Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال صوتی/stage انتخاب‌شده نیاز دارد. به `channels.discord.voice` و فرمان‌های بومی نیاز دارد.
    - فرمان‌های thread-binding در Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های مؤثر thread فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع فرمان ACP و رفتار زمان اجرا: [ACP agents](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی verbose / trace / fast / reasoning">
    - `/verbose` برای اشکال‌زدایی و دید بیشتر است؛ در استفاده عادی آن را **خاموش** نگه دارید.
    - `/trace` محدودتر از `/verbose` است: فقط خطوط trace/debug متعلق به plugin را آشکار می‌کند و گفت‌وگوی عادی ابزار در حالت verbose را خاموش نگه می‌دارد.
    - `/fast on|off` یک بازنویسی نشست را پایدار می‌کند. برای پاک کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینه `inherit` در UI نشست‌ها استفاده کنید.
    - `/fast` وابسته به provider است: OpenAI/OpenAI Codex آن را در endpointهای بومی Responses به `service_tier=priority` نگاشت می‌کنند، درحالی‌که درخواست‌های عمومی مستقیم Anthropic، از جمله ترافیک احرازهویت‌شده با OAuth که به `api.anthropic.com` ارسال می‌شود، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های شکست ابزار همچنان وقتی مرتبط باشند نمایش داده می‌شوند، اما متن تفصیلی شکست فقط وقتی گنجانده می‌شود که `/verbose` برابر `on` یا `full` باشد.
    - `/reasoning`، `/verbose`، و `/trace` در محیط‌های گروهی پرریسک هستند: ممکن است استدلال داخلی، خروجی ابزار، یا عیب‌یابی‌های plugin را که قصد آشکار کردنشان را نداشتید نشان دهند. ترجیحاً آن‌ها را خاموش نگه دارید، مخصوصاً در گفت‌وگوهای گروهی.

  </Accordion>
  <Accordion title="تغییر مدل">
    - `/model` مدل نشست جدید را بلافاصله پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی فوراً از آن استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw تغییر زنده را در حالت در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش مجدد تمیز با مدل جدید راه‌اندازی مجدد می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت تلاش مجدد بعدی یا نوبت بعدی کاربر در صف بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian برمی‌گردد. این از حالت نجات کانال پیام جداست و اختیار پیکربندی راه دور اعطا نمی‌کند.

  </Accordion>
  <Accordion title="مسیر سریع و میانبرهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط فرمان از فرستندگان مجاز فوراً پردازش می‌شوند (دور زدن صف + مدل).
    - **دروازه‌گذاری mention گروه:** پیام‌های فقط فرمان از فرستندگان مجاز الزامات mention را دور می‌زنند.
    - **میانبرهای درون‌خطی (فقط فرستندگان مجاز):** برخی فرمان‌ها وقتی در یک پیام عادی جاسازی شده باشند نیز کار می‌کنند و پیش از اینکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه می‌یابد.
    - فعلاً: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط فرمان غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="فرمان‌های Skills و آرگومان‌های بومی">
    - **فرمان‌های Skills:** Skills با `user-invocable` به‌صورت فرمان‌های اسلش ارائه می‌شوند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوند عددی می‌گیرند (مثلاً `_2`).
      - `/skill <name> [input]` یک skill را با نام اجرا می‌کند (وقتی محدودیت‌های فرمان بومی مانع فرمان‌های جداگانه برای هر skill شوند مفید است).
      - به‌صورت پیش‌فرض، فرمان‌های skill به‌عنوان درخواست عادی به مدل فرستاده می‌شوند.
      - Skills می‌توانند به‌صورت اختیاری `command-dispatch: tool` را اعلام کنند تا فرمان مستقیماً به یک ابزار مسیر داده شود (قطعی، بدون مدل).
      - مثال: `/prose` (plugin OpenProse) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های فرمان بومی:** Discord برای گزینه‌های پویا از autocomplete استفاده می‌کند (و وقتی آرگومان‌های لازم را حذف کنید از منوهای دکمه‌ای). Telegram و Slack وقتی یک فرمان از گزینه‌ها پشتیبانی کند و شما آرگومان را حذف کنید، یک منوی دکمه‌ای نشان می‌دهند. گزینه‌های پویا در برابر مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های ویژه مدل مانند سطح‌های `/think` از بازنویسی `/model` آن نشست پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه یک پرسش پیکربندی: **این عامل همین حالا در این مکالمه از چه چیزهایی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده و برای مرور سریع بهینه شده است.
- `/tools verbose` توضیحات کوتاه اضافه می‌کند.
- سطوح فرمان بومی که از آرگومان‌ها پشتیبانی می‌کنند همان کلید تغییر حالت را با `compact|verbose` ارائه می‌کنند.
- نتایج وابسته به نشست هستند، بنابراین تغییر عامل، کانال، thread، مجوز فرستنده، یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` شامل ابزارهایی است که واقعاً در زمان اجرا قابل دسترسی هستند، از جمله ابزارهای هسته، ابزارهای plugin متصل، و ابزارهای متعلق به کانال.

برای ویرایش پروفایل و بازنویسی، به‌جای در نظر گرفتن `/tools` به‌عنوان یک کاتالوگ ایستا، از پنل Tools در Control UI یا سطوح پیکربندی/کاتالوگ استفاده کنید.

## سطوح مصرف (چه چیزی کجا نمایش داده می‌شود)

- **مصرف/سهمیه provider** (مثال: "Claude 80% left") وقتی رهگیری مصرف فعال باشد، در `/status` برای provider مدل فعلی نمایش داده می‌شود. OpenClaw پنجره‌های provider را به `% left` نرمال‌سازی می‌کند؛ برای MiniMax، فیلدهای درصد فقط-باقی‌مانده پیش از نمایش معکوس می‌شوند، و پاسخ‌های `model_remains` ورودی مدل گفت‌وگو به‌همراه برچسب طرح دارای تگ مدل را ترجیح می‌دهند.
- **خطوط توکن/کش** در `/status` وقتی snapshot زنده نشست کم‌جزئیات باشد، می‌توانند به آخرین ورودی مصرف رونوشت برگردند. مقادیر زنده غیرصفر موجود همچنان اولویت دارند، و fallback رونوشت می‌تواند برچسب مدل زمان اجرای فعال به‌همراه مجموع بزرگ‌تر متمرکز بر prompt را نیز بازیابی کند، وقتی مجموع‌های ذخیره‌شده موجود نباشند یا کوچک‌تر باشند.
- **اجرا در برابر زمان اجرا:** `/status` برای مسیر sandbox مؤثر `Execution` و برای اینکه چه کسی واقعاً نشست را اجرا می‌کند `Runtime` را گزارش می‌دهد: `OpenClaw Pi Default`، `OpenAI Codex`، یک backend CLI، یا یک backend ACP.
- **توکن/هزینه هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی پیوست می‌شود).
- `/model status` درباره **مدل‌ها/احراز هویت/endpointها** است، نه مصرف.

## انتخاب مدل (`/model`)

`/model` به‌عنوان یک directive پیاده‌سازی شده است.

نمونه‌ها:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

نکات:

- `/model` و `/model list` یک انتخاب‌گر فشرده شماره‌دار نشان می‌دهند (خانواده مدل + providerهای در دسترس).
- در Discord، `/model` و `/models` یک انتخاب‌گر تعاملی با منوهای کشویی provider و مدل به‌همراه مرحله Submit باز می‌کنند.
- `/model <#>` از همان انتخاب‌گر انتخاب می‌کند (و وقتی ممکن باشد provider فعلی را ترجیح می‌دهد).
- `/model status` نمای تفصیلی را نشان می‌دهد، از جمله endpoint پیکربندی‌شده provider (`baseUrl`) و حالت API (`api`) وقتی در دسترس باشد.

## بازنویسی‌های اشکال‌زدایی

`/debug` به شما امکان می‌دهد بازنویسی‌های پیکربندی **فقط در زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک). فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
بازنویسی‌ها بلافاصله روی خواندن‌های جدید پیکربندی اعمال می‌شوند، اما در `openclaw.json` نوشته نمی‌شوند. برای پاک کردن همه بازنویسی‌ها و بازگشت به پیکربندی روی دیسک، از `/debug reset` استفاده کنید.
</Note>

## خروجی ردیابی Plugin

`/trace` به شما امکان می‌دهد **خطوط ردیابی/اشکال‌زدایی Plugin در محدوده نشست** را بدون روشن کردن حالت کاملاً پرجزئیات تغییر دهید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

یادداشت‌ها:

- `/trace` بدون آرگومان، وضعیت ردیابی نشست فعلی را نشان می‌دهد.
- `/trace on` خطوط ردیابی Plugin را برای نشست فعلی فعال می‌کند.
- `/trace off` دوباره آن‌ها را غیرفعال می‌کند.
- خطوط ردیابی Plugin می‌توانند در `/status` و به‌عنوان پیام تشخیصی پیگیری پس از پاسخ عادی دستیار ظاهر شوند.
- `/trace` جایگزین `/debug` نیست؛ `/debug` همچنان بازنویسی‌های پیکربندی فقط در زمان اجرا را مدیریت می‌کند.
- `/trace` جایگزین `/verbose` نیست؛ خروجی عادی و پرجزئیات ابزار/وضعیت همچنان به `/verbose` تعلق دارد.

## به‌روزرسانی‌های پیکربندی

`/config` در پیکربندی روی دیسک شما (`openclaw.json`) می‌نویسد. فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.config: true` فعال کنید.

نمونه‌ها:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
پیکربندی پیش از نوشتن اعتبارسنجی می‌شود؛ تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config` پس از راه‌اندازی مجدد نیز باقی می‌مانند.
</Note>

## به‌روزرسانی‌های MCP

`/mcp` تعاریف سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌نویسد. فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.mcp: true` فعال کنید.

نمونه‌ها:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه در تنظیمات پروژه متعلق به Pi. آداپتورهای زمان اجرا تصمیم می‌گیرند کدام ترابری‌ها واقعاً قابل اجرا هستند.
</Note>

## به‌روزرسانی‌های Plugin

`/plugins` به اپراتورها امکان می‌دهد Pluginهای کشف‌شده را بررسی کنند و فعال‌سازی را در پیکربندی تغییر دهند. جریان‌های فقط خواندنی می‌توانند از `/plugin` به‌عنوان نام مستعار استفاده کنند. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.plugins: true` فعال کنید.

نمونه‌ها:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` و `/plugins show` از کشف واقعی Plugin بر اساس فضای کاری فعلی به‌همراه پیکربندی روی دیسک استفاده می‌کنند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Pluginها را نصب یا حذف نصب نمی‌کند.
- پس از تغییرات فعال/غیرفعال‌سازی، Gateway را راه‌اندازی مجدد کنید تا اعمال شوند.

</Note>

## یادداشت‌های سطح

<AccordionGroup>
  <Accordion title="نشست‌ها برای هر سطح">
    - **دستورهای متنی** در نشست عادی چت اجرا می‌شوند (پیام‌های مستقیم `main` را به‌اشتراک می‌گذارند، گروه‌ها نشست خودشان را دارند).
    - **دستورهای بومی** از نشست‌های ایزوله استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (از طریق `CommandTargetSessionKey` نشست چت را هدف می‌گیرد)
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا بتواند اجرای فعلی را متوقف کند.

  </Accordion>
  <Accordion title="جزئیات Slack">
    `channels.slack.slashCommand` همچنان برای یک دستور واحد به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر دستور داخلی یک دستور اسلش Slack ایجاد کنید (همان نام‌های `/help`). منوهای آرگومان دستور برای Slack به‌صورت دکمه‌های موقت Block Kit ارائه می‌شوند.

    استثنای بومی Slack: `/agentstatus` را ثبت کنید (نه `/status`)، چون Slack، `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع درباره نشست فعلی است.

برخلاف چت عادی:

- از نشست فعلی به‌عنوان زمینه پس‌زمینه استفاده می‌کند،
- به‌صورت یک فراخوانی یک‌باره **بدون ابزار** و جداگانه اجرا می‌شود،
- زمینه نشست‌های آینده را تغییر نمی‌دهد،
- در تاریخچه رونوشت نوشته نمی‌شود،
- به‌جای پیام عادی دستیار، به‌صورت نتیجه جانبی زنده ارائه می‌شود.

این باعث می‌شود `/btw` زمانی مفید باشد که در حالی‌که کار اصلی ادامه دارد، توضیح موقتی می‌خواهید.

نمونه:

```text
/btw what are we doing right now?
```

برای رفتار کامل و جزئیات تجربه کاربری کلاینت، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## مرتبط

- [ایجاد Skills](/fa/tools/creating-skills)
- [Skills](/fa/tools/skills)
- [پیکربندی Skills](/fa/tools/skills-config)
