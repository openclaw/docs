---
read_when:
    - استفاده از فرمان‌های گفت‌وگو یا پیکربندی آن‌ها
    - اشکال‌زدایی از مسیریابی فرمان یا مجوزها
sidebarTitle: Slash commands
summary: 'دستورهای اسلش: متنی در برابر بومی، پیکربندی، و دستورهای پشتیبانی‌شده'
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-05-01T11:54:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfa4c8e294080e824b15f0b54842718f7913cf6d42b7edd4ca9695c3d4113924
    source_path: tools/slash-commands.md
    workflow: 16
---

فرمان‌ها توسط Gateway مدیریت می‌شوند. بیشتر فرمان‌ها باید به‌صورت یک پیام **مستقل** فرستاده شوند که با `/` شروع می‌شود. فرمان گفت‌وگوی bash فقط مخصوص میزبان از `! <cmd>` استفاده می‌کند (`/bash <cmd>` نیز به‌عنوان نام مستعار آن است).

وقتی یک گفت‌وگو یا رشته به یک نشست ACP متصل باشد، متن پیگیری معمولی به همان چارچوب ACP هدایت می‌شود. فرمان‌های مدیریتی Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به مدیریت‌کننده فرمان ACP در OpenClaw می‌رسد، و `/status` همراه با `/unfocus` هر زمان که مدیریت فرمان برای آن سطح فعال باشد، محلی می‌مانند.

دو سامانه مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="فرمان‌ها">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="دستورالعمل‌ها">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - دستورالعمل‌ها پیش از اینکه مدل پیام را ببیند، از پیام حذف می‌شوند.
    - در پیام‌های گفت‌وگوی معمولی (نه پیام‌هایی که فقط دستورالعمل هستند)، آن‌ها به‌عنوان «راهنمای درون‌خطی» در نظر گرفته می‌شوند و تنظیمات نشست را **ماندگار** نمی‌کنند.
    - در پیام‌هایی که فقط دستورالعمل هستند (پیام فقط شامل دستورالعمل‌هاست)، آن‌ها در نشست ماندگار می‌شوند و با یک تأیید پاسخ می‌دهند.
    - دستورالعمل‌ها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، همان تنها فهرست مجاز استفاده‌شده است؛ در غیر این صورت مجوز از فهرست‌های مجاز/جفت‌سازی کانال به‌علاوه `commands.useAccessGroups` می‌آید. فرستندگان غیرمجاز دستورالعمل‌ها را به‌صورت متن ساده می‌بینند.

  </Accordion>
  <Accordion title="میان‌برهای درون‌خطی">
    فقط فرستندگان حاضر در فهرست مجاز/مجاز: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    آن‌ها بلافاصله اجرا می‌شوند، پیش از اینکه مدل پیام را ببیند حذف می‌شوند، و متن باقی‌مانده از جریان معمول ادامه پیدا می‌کند.

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
  تجزیه `/...` را در پیام‌های گفت‌وگو فعال می‌کند. روی سطح‌هایی بدون فرمان‌های بومی (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، فرمان‌های متنی حتی اگر این را روی `false` بگذارید همچنان کار می‌کنند.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  فرمان‌های بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (تا زمانی که فرمان‌های اسلش را اضافه کنید)؛ برای ارائه‌دهندگان بدون پشتیبانی بومی نادیده گرفته می‌شود. برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.native`، `channels.telegram.commands.native`، یا `channels.slack.commands.native` را تنظیم کنید (بولی یا `"auto"`). `false` هنگام راه‌اندازی، فرمان‌های قبلاً ثبت‌شده در Discord/Telegram را پاک می‌کند. فرمان‌های Slack در برنامه Slack مدیریت می‌شوند و به‌طور خودکار حذف نمی‌شوند.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  فرمان‌های **skill** را در صورت پشتیبانی به‌صورت بومی ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack نیاز دارد برای هر skill یک فرمان اسلش ساخته شود). برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills`، یا `channels.slack.commands.nativeSkills` را تنظیم کنید (بولی یا `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` را برای اجرای فرمان‌های پوسته میزبان فعال می‌کند (`/bash <cmd>` یک نام مستعار است؛ به فهرست‌های مجاز `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash پیش از جابه‌جایی به حالت پس‌زمینه چه مدت منتظر بماند (`0` بلافاصله آن را پس‌زمینه می‌کند).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` را فعال می‌کند (پیکربندی MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند/می‌نویسد).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` را فعال می‌کند (کشف/وضعیت Plugin به‌همراه کنترل‌های نصب و فعال‌سازی/غیرفعال‌سازی).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` را فعال می‌کند (بازنویسی‌های فقط زمان اجرا).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` را به‌همراه کنش‌های ابزار راه‌اندازی مجدد gateway فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک را برای سطح‌های فرمان/ابزار فقط مخصوص مالک تنظیم می‌کند. این حساب اپراتور انسانی است که می‌تواند کنش‌های خطرناک را تأیید کند و فرمان‌هایی مانند `/diagnostics`، `/export-trajectory` و `/config` را اجرا کند. این از `commands.allowFrom` و از دسترسی جفت‌سازی پیام مستقیم جداست.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  به‌ازای هر کانال: اجرای فرمان‌های فقط مخصوص مالک روی آن سطح را ملزم به **هویت مالک** می‌کند. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک حل‌شده مطابقت داشته باشد (برای نمونه یک ورودی در `commands.ownerAllowFrom` یا فراداده مالک بومی ارائه‌دهنده)، یا روی یک کانال پیام داخلی دارای حوزه داخلی `operator.admin` باشد. یک ورودی wildcard در `allowFrom` کانال، یا یک فهرست نامزد مالک خالی/حل‌نشده، کافی **نیست** — فرمان‌های فقط مخصوص مالک روی آن کانال به‌صورت بسته شکست می‌خورند. اگر می‌خواهید فرمان‌های فقط مخصوص مالک فقط با `ownerAllowFrom` و فهرست‌های مجاز استاندارد فرمان محدود شوند، این را خاموش بگذارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در prompt سیستم ظاهر شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  به‌صورت اختیاری، secret مربوط به HMAC را که هنگام `commands.ownerDisplay="hash"` استفاده می‌شود تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز به‌ازای هر ارائه‌دهنده برای مجوزدهی فرمان. وقتی پیکربندی شود، تنها منبع مجوزدهی برای فرمان‌ها و دستورالعمل‌هاست (فهرست‌های مجاز/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). برای پیش‌فرض سراسری از `"*"` استفاده کنید؛ کلیدهای مخصوص ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای فرمان‌ها اعمال می‌کند.
</ParamField>

## فهرست فرمان‌ها

منبع حقیقت فعلی:

- فرمان‌های داخلی هسته از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- فرمان‌های dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- فرمان‌های Plugin از فراخوانی‌های `registerCommand()` در Plugin می‌آیند
- در دسترس بودن واقعی روی gateway شما همچنان به پرچم‌های پیکربندی، سطح کانال، و Pluginهای نصب‌شده/فعال بستگی دارد

### فرمان‌های داخلی هسته

<AccordionGroup>
  <Accordion title="نشست‌ها و اجراها">
    - `/new [model]` یک نشست تازه شروع می‌کند؛ `/reset` نام مستعار بازنشانی است.
    - `/reset soft [message]` رونوشت فعلی را نگه می‌دارد، شناسه‌های نشست backend مربوط به CLI را که دوباره استفاده شده‌اند حذف می‌کند، و بارگذاری راه‌اندازی/prompt سیستم را درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` بافت نشست را compact می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را لغو می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال رشته را مدیریت می‌کنند.
    - `/export-session [path]` نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` درخواست تأیید exec می‌کند، سپس یک [بسته trajectory](/fa/tools/trajectory) با قالب JSONL برای نشست فعلی صادر می‌کند. وقتی برای یک نشست OpenClaw به timeline مربوط به prompt، ابزار و رونوشت نیاز دارید از آن استفاده کنید. در گفت‌وگوهای گروهی، prompt تأیید و نتیجه export به‌صورت خصوصی برای مالک فرستاده می‌شود. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="کنترل‌های مدل و اجرا">
    - `/think <level>` سطح thinking را تنظیم می‌کند. گزینه‌ها از پروفایل ارائه‌دهنده مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium` و `high` هستند، و سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max`، یا `on` دودویی فقط جایی که پشتیبانی شوند وجود دارند. نام‌های مستعار: `/thinking`، `/t`.
    - `/verbose on|off|full` خروجی verbose را تغییر وضعیت می‌دهد. نام مستعار: `/v`.
    - `/trace on|off` خروجی trace مربوط به Plugin را برای نشست فعلی تغییر وضعیت می‌دهد.
    - `/fast [status|on|off]` حالت fast را نشان می‌دهد یا تنظیم می‌کند.
    - `/reasoning [on|off|stream]` نمایان بودن reasoning را تغییر وضعیت می‌دهد. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را تغییر وضعیت می‌دهد. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نشان می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نشان می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` ارائه‌دهندگان پیکربندی‌شده/دارای احراز هویت در دسترس یا مدل‌های یک ارائه‌دهنده را فهرست می‌کند؛ برای مرور catalog کامل آن ارائه‌دهنده، `all` را اضافه کنید.
    - `/queue <mode>` رفتار صف را مدیریت می‌کند (`steer`، `queue` قدیمی، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی نشست را پاک می‌کند. [صف فرمان](/fa/concepts/queue) و [صف Steering](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
  <Accordion title="کشف و وضعیت">
    - `/help` خلاصه راهنمای کوتاه را نشان می‌دهد.
    - `/commands` catalog فرمان تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد agent فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا را نشان می‌دهد، از جمله برچسب‌های `Execution`/`Runtime` و میزان استفاده/quota ارائه‌دهنده وقتی در دسترس باشد.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط مخصوص مالک برای باگ‌های Gateway و اجراهای harness مربوط به Codex است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` تأیید صریح exec درخواست می‌کند؛ diagnostics را با یک قانون allow-all تأیید نکنید. پس از تأیید، گزارشی قابل paste با مسیر bundle محلی، خلاصه manifest، یادداشت‌های حریم خصوصی، و شناسه‌های نشست مرتبط می‌فرستد. در گفت‌وگوهای گروهی، prompt تأیید و گزارش به‌صورت خصوصی برای مالک می‌روند. وقتی نشست فعال از harness مربوط به OpenAI Codex استفاده می‌کند، همان تأیید همچنین بازخورد مرتبط Codex را به سرورهای OpenAI می‌فرستد و پاسخ کامل‌شده شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و فرمان‌های `codex resume <thread-id>` را فهرست می‌کند. [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` ابزار کمکی راه‌اندازی و تعمیر Crestodian را از یک پیام مستقیم مالک اجرا می‌کند.
    - `/tasks` taskهای پس‌زمینه فعال/اخیر را برای نشست فعلی فهرست می‌کند.
    - `/context [list|detail|json]` توضیح می‌دهد context چگونه سرهم می‌شود.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` پابرگ استفاده به‌ازای هر پاسخ را کنترل می‌کند یا یک خلاصه هزینه محلی چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills، فهرست‌های مجاز، تأییدها">
    - `/skill <name> [input]` یک skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` ورودی‌های فهرست مجاز را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` promptهای تأیید exec را حل می‌کند.
    - `/btw <question>` یک پرسش جانبی می‌پرسد بدون اینکه context آینده نشست را تغییر دهد. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="Subagentها و ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجراهای sub-agent را برای نشست فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند.
    - `/focus <target>` رشته فعلی Discord یا topic/گفت‌وگوی Telegram را به یک هدف نشست متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` agentهای متصل به رشته را برای نشست فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک یا همه sub-agentهای در حال اجرا را لغو می‌کند.
    - `/steer <id|#> <message>` steering را به یک sub-agent در حال اجرا می‌فرستد. نام مستعار: `/tell`.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت plugin را بررسی یا تغییر می‌دهد. `/plugin` یک نام مستعار است. نوشتن فقط برای مالک است. به `commands.plugins: true` نیاز دارد.
    - `/debug show|set|unset|reset` بازنویسی‌های پیکربندی فقط زمان اجرا را مدیریت می‌کند. فقط مالک. به `commands.debug: true` نیاز دارد.
    - `/restart` وقتی فعال باشد OpenClaw را راه‌اندازی مجدد می‌کند. پیش‌فرض: فعال؛ برای غیرفعال‌کردن آن `commands.restart: false` را تنظیم کنید.
    - `/send on|off|inherit` سیاست ارسال را تنظیم می‌کند. فقط مالک.

  </Accordion>
  <Accordion title="صدا، TTS، کنترل کانال">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help`، TTS را کنترل می‌کند. [TTS](/fa/tools/tts) را ببینید.
    - `/activation mention|always` حالت فعال‌سازی گروه را تنظیم می‌کند.
    - `/bash <command>` یک فرمان پوسته میزبان را اجرا می‌کند. فقط متن. نام مستعار: `! <command>`. به `commands.bash: true` به‌همراه فهرست‌های مجاز `tools.elevated` نیاز دارد.
    - `!poll [sessionId]` یک کار bash پس‌زمینه را بررسی می‌کند.
    - `!stop [sessionId]` یک کار bash پس‌زمینه را متوقف می‌کند.

  </Accordion>
</AccordionGroup>

### دستورهای dock تولیدشده

دستورهای dock مسیر پاسخ نشست جاری را به یک کانال پیوندخورده دیگر تغییر می‌دهند. برای راه‌اندازی،
نمونه‌ها و عیب‌یابی، [داک‌کردن کانال](/fa/concepts/channel-docking) را ببینید.

دستورهای dock از pluginهای کانال با پشتیبانی از فرمان بومی تولید می‌شوند. مجموعه همراه فعلی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از دستورهای dock در یک گفتگوی مستقیم استفاده کنید تا مسیر پاسخ نشست جاری را به یک کانال پیوندخورده دیگر تغییر دهید. عامل همان زمینه نشست را نگه می‌دارد، اما پاسخ‌های بعدی برای آن نشست به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

دستورهای dock به `session.identityLinks` نیاز دارند. فرستنده مبدا و همتای هدف باید در یک گروه هویتی باشند، برای مثال `["telegram:123", "discord:456"]`. اگر یک کاربر Telegram با شناسه `123`، `/dock_discord` را بفرستد، OpenClaw مقدارهای `lastChannel: "discord"` و `lastTo: "456"` را روی نشست فعال ذخیره می‌کند. اگر فرستنده به همتای Discord پیوند نشده باشد، فرمان به‌جای عبور به گفتگوی عادی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

داک‌کردن فقط مسیر نشست فعال را تغییر می‌دهد. حساب‌های کانال ایجاد نمی‌کند، دسترسی اعطا نمی‌کند، فهرست‌های مجاز کانال را دور نمی‌زند، یا تاریخچه رونوشت را به نشست دیگری منتقل نمی‌کند. از `/dock-telegram`، `/dock-slack`، `/dock-mattermost` یا دستور dock تولیدشده دیگری استفاده کنید تا مسیر را دوباره تغییر دهید.

### دستورهای plugin همراه

pluginهای همراه می‌توانند دستورهای اسلش بیشتری اضافه کنند. دستورهای همراه فعلی در این مخزن:

- `/dreaming [on|off|status|help]`، dreaming حافظه را تغییر وضعیت می‌دهد. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [جفت‌سازی](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` فرمان‌های پرخطر گره تلفن را موقتاً مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام فرمان بومی `/talkvoice` است.
- `/card ...` پیش‌تنظیم‌های کارت غنی LINE را می‌فرستد. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` مهار app-server همراه Codex را بررسی و کنترل می‌کند. [مهار Codex](/fa/plugins/codex-harness) را ببینید.
- دستورهای مخصوص QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### دستورهای Skills پویا

Skills قابل فراخوانی توسط کاربر نیز به‌عنوان دستورهای اسلش ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills همچنین ممکن است وقتی Skill/plugin آن‌ها را ثبت کند، به‌صورت دستورهای مستقیم مانند `/prose` ظاهر شوند.
- ثبت فرمان بومی Skill با `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.

<AccordionGroup>
  <Accordion title="نکته‌های آرگومان و تجزیه‌گر">
    - دستورها یک `:` اختیاری بین فرمان و آرگومان‌ها می‌پذیرند (مثلاً `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام ارائه‌دهنده را می‌پذیرد (تطبیق فازی)؛ اگر تطبیقی نباشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل مصرف ارائه‌دهنده، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و به `configWrites` کانال احترام می‌گذارد.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدف‌گذاری‌شده برای پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز به `configWrites` حساب هدف احترام می‌گذارند.
    - `/usage` پانویس مصرف در هر پاسخ را کنترل می‌کند؛ `/usage cost` یک خلاصه هزینه محلی را از گزارش‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌صورت پیش‌فرض فعال است؛ برای غیرفعال‌کردن آن `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات plugin را می‌پذیرد که `openclaw plugins install` می‌پذیرد: مسیر/بایگانی محلی، بسته npm، `git:<repo>`، یا `clawhub:<pkg>`.
    - `/plugins enable|disable` پیکربندی plugin را به‌روزرسانی می‌کند و ممکن است درخواست راه‌اندازی مجدد بدهد.

  </Accordion>
  <Accordion title="رفتار ویژه کانال">
    - فرمان بومی فقط Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال صوتی/stage انتخاب‌شده نیاز دارد. به `channels.discord.voice` و فرمان‌های بومی نیاز دارد.
    - دستورهای اتصال نخ Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های مؤثر نخ فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع فرمان و رفتار زمان اجرای ACP: [عامل‌های ACP](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی پرجزئیات / ردگیری / سریع / reasoning">
    - `/verbose` برای اشکال‌زدایی و دیدپذیری بیشتر در نظر گرفته شده است؛ در استفاده عادی آن را **خاموش** نگه دارید.
    - `/trace` محدودتر از `/verbose` است: فقط خطوط trace/debug متعلق به plugin را آشکار می‌کند و پرگویی عادی ابزارها را خاموش نگه می‌دارد.
    - `/fast on|off` یک بازنویسی نشست را پایدار می‌کند. برای پاک‌کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینه `inherit` در رابط کاربری Sessions استفاده کنید.
    - `/fast` وابسته به ارائه‌دهنده است: OpenAI/OpenAI Codex آن را روی نقاط پایانی بومی Responses به `service_tier=priority` نگاشت می‌کنند، درحالی‌که درخواست‌های عمومی مستقیم Anthropic، از جمله ترافیک احراز هویت‌شده با OAuth که به `api.anthropic.com` فرستاده می‌شود، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های شکست ابزار همچنان هنگام مرتبط‌بودن نشان داده می‌شوند، اما متن دقیق شکست فقط وقتی گنجانده می‌شود که `/verbose` برابر `on` یا `full` باشد.
    - `/reasoning`، `/verbose` و `/trace` در محیط‌های گروهی پرخطر هستند: ممکن است reasoning داخلی، خروجی ابزار یا عیب‌یابی‌های plugin را که قصد آشکارکردنشان را نداشتید نشان دهند. ترجیحاً آن‌ها را خاموش بگذارید، به‌ویژه در گفتگوهای گروهی.

  </Accordion>
  <Accordion title="تغییر مدل">
    - `/model` مدل جدید نشست را فوراً پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی فوراً از آن استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw یک تغییر زنده را در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش مجدد تمیز با مدل جدید راه‌اندازی مجدد می‌شود.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت تلاش مجدد بعدی یا نوبت کاربر بعدی در صف بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian برمی‌گردد. این از حالت نجات کانال پیام جداست و اختیار پیکربندی راه‌دور اعطا نمی‌کند.

  </Accordion>
  <Accordion title="مسیر سریع و میان‌برهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط فرمان از فرستندگان فهرست مجاز فوراً پردازش می‌شوند (دورزدن صف + مدل).
    - **گیت‌گذاری اشاره گروه:** پیام‌های فقط فرمان از فرستندگان فهرست مجاز، نیازهای اشاره را دور می‌زنند.
    - **میان‌برهای درون‌خطی (فقط فرستندگان فهرست مجاز):** بعضی دستورها وقتی در یک پیام عادی جای‌گذاری شوند نیز کار می‌کنند و پیش از اینکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه می‌یابد.
    - فعلاً: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط فرمان غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="دستورهای Skill و آرگومان‌های بومی">
    - **دستورهای Skill:** Skills با برچسب `user-invocable` به‌عنوان دستورهای اسلش ارائه می‌شوند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوند عددی می‌گیرند (مثلاً `_2`).
      - `/skill <name> [input]` یک Skill را با نام اجرا می‌کند (وقتی محدودیت‌های فرمان بومی مانع دستورهای جداگانه برای هر Skill می‌شود مفید است).
      - به‌صورت پیش‌فرض، دستورهای Skill به‌عنوان یک درخواست عادی به مدل ارسال می‌شوند.
      - Skills می‌توانند به‌اختیار `command-dispatch: tool` را اعلام کنند تا فرمان مستقیماً به یک ابزار هدایت شود (قطعی، بدون مدل).
      - مثال: `/prose` (plugin OpenProse) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های فرمان بومی:** Discord از تکمیل خودکار برای گزینه‌های پویا استفاده می‌کند (و وقتی آرگومان‌های ضروری را حذف کنید، منوهای دکمه‌ای). Telegram و Slack وقتی فرمانی از انتخاب‌ها پشتیبانی کند و شما آرگومان را حذف کنید، یک منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا نسبت به مدل نشست هدف حل می‌شوند، پس گزینه‌های ویژه مدل مانند سطح‌های `/think` از بازنویسی `/model` همان نشست پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه پرسش پیکربندی: **این عامل همین حالا در این مکالمه از چه چیزهایی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده است و برای مرور سریع بهینه شده است.
- `/tools verbose` توضیحات کوتاه اضافه می‌کند.
- سطح‌های فرمان بومی که از آرگومان‌ها پشتیبانی می‌کنند، همان تغییر حالت `compact|verbose` را ارائه می‌دهند.
- نتایج وابسته به نشست هستند، بنابراین تغییر عامل، کانال، نخ، مجوز فرستنده یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` شامل ابزارهایی است که واقعاً در زمان اجرا دسترس‌پذیرند، از جمله ابزارهای هسته، ابزارهای plugin متصل و ابزارهای متعلق به کانال.

برای ویرایش پروفایل و بازنویسی، به‌جای اینکه `/tools` را یک کاتالوگ ایستا در نظر بگیرید، از پنل Tools در Control UI یا سطح‌های پیکربندی/کاتالوگ استفاده کنید.

## سطح‌های مصرف (چه چیزی کجا نمایش داده می‌شود)

- **مصرف/سهمیه ارائه‌دهنده** (مثال: "Claude 80% left") وقتی رهگیری مصرف فعال باشد، در `/status` برای ارائه‌دهنده مدل فعلی نمایش داده می‌شود. OpenClaw پنجره‌های ارائه‌دهنده را به `% left` نرمال‌سازی می‌کند؛ برای MiniMax، فیلدهای درصد فقط باقی‌مانده پیش از نمایش معکوس می‌شوند، و پاسخ‌های `model_remains` ورودی مدل گفتگو به‌همراه برچسب طرح دارای برچسب مدل را ترجیح می‌دهند.
- **خطوط توکن/کش** در `/status` می‌توانند وقتی اسنپ‌شات نشست زنده کم‌اطلاعات است، به آخرین ورودی مصرف رونوشت برگردند. مقدارهای زنده غیرصفر موجود همچنان برنده‌اند، و بازگشت به رونوشت همچنین می‌تواند برچسب مدل زمان اجرای فعال به‌همراه یک مجموع بزرگ‌ترِ متمرکز بر prompt را وقتی مجموع‌های ذخیره‌شده موجود نیستند یا کوچک‌ترند بازیابی کند.
- **اجرا در برابر زمان اجرا:** `/status` برای مسیر sandbox مؤثر `Execution` و برای کسی که واقعاً نشست را اجرا می‌کند `Runtime` را گزارش می‌کند: `OpenClaw Pi Default`، `OpenAI Codex`، یک backend CLI، یا یک backend ACP.
- **توکن/هزینه در هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی افزوده می‌شود).
- `/model status` درباره **مدل‌ها/احراز هویت/نقاط پایانی** است، نه مصرف.

## انتخاب مدل (`/model`)

`/model` به‌عنوان یک دستورالعمل پیاده‌سازی شده است.

نمونه‌ها:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

نکته‌ها:

- `/model` و `/model list` یک گزینش‌گر فشرده و شماره‌دار نشان می‌دهند (خانواده مدل + ارائه‌دهندگان موجود).
- در Discord، `/model` و `/models` یک گزینش‌گر تعاملی با کشویی‌های ارائه‌دهنده و مدل، به‌همراه گام Submit باز می‌کنند.
- `/model <#>` از همان گزینش‌گر انتخاب می‌کند (و وقتی ممکن باشد ارائه‌دهنده فعلی را ترجیح می‌دهد).
- `/model status` نمای دقیق را نشان می‌دهد، شامل نقطه پایانی ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) وقتی موجود باشد.

## بازنویسی‌های Debug

`/debug` به شما امکان می‌دهد بازنویسی‌های پیکربندی **فقط در زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک). فقط مالک. به‌طور پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
بازنویسی‌ها بلافاصله روی خواندن‌های جدید پیکربندی اعمال می‌شوند، اما در `openclaw.json` نوشته **نمی‌شوند**. برای پاک کردن همه بازنویسی‌ها و بازگشت به پیکربندی روی دیسک، از `/debug reset` استفاده کنید.
</Note>

## خروجی trace برای Plugin

`/trace` به شما امکان می‌دهد **خطوط trace/debug مربوط به Plugin و محدود به نشست** را بدون فعال کردن حالت کاملاً پرجزئیات روشن یا خاموش کنید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

نکته‌ها:

- `/trace` بدون آرگومان، وضعیت trace نشست فعلی را نشان می‌دهد.
- `/trace on` خطوط trace مربوط به Plugin را برای نشست فعلی فعال می‌کند.
- `/trace off` دوباره آن‌ها را غیرفعال می‌کند.
- خطوط trace مربوط به Plugin می‌توانند در `/status` و به‌صورت یک پیام تشخیصی پیگیری پس از پاسخ عادی دستیار ظاهر شوند.
- `/trace` جایگزین `/debug` نمی‌شود؛ `/debug` همچنان بازنویسی‌های پیکربندی فقط در زمان اجرا را مدیریت می‌کند.
- `/trace` جایگزین `/verbose` نمی‌شود؛ خروجی عادی پرجزئیات ابزار/وضعیت همچنان متعلق به `/verbose` است.

## به‌روزرسانی‌های پیکربندی

`/config` در پیکربندی روی دیسک شما (`openclaw.json`) می‌نویسد. فقط مالک. به‌طور پیش‌فرض غیرفعال است؛ با `commands.config: true` فعال کنید.

نمونه‌ها:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
پیکربندی پیش از نوشتن اعتبارسنجی می‌شود؛ تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config` پس از راه‌اندازی‌های مجدد نیز باقی می‌مانند.
</Note>

## به‌روزرسانی‌های MCP

`/mcp` تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌نویسد. فقط مالک. به‌طور پیش‌فرض غیرفعال است؛ با `commands.mcp: true` فعال کنید.

نمونه‌ها:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه تنظیمات پروژه متعلق به Pi. آداپتورهای زمان اجرا تصمیم می‌گیرند کدام transportها واقعاً قابل اجرا هستند.
</Note>

## به‌روزرسانی‌های Plugin

`/plugins` به اپراتورها امکان می‌دهد Pluginهای کشف‌شده را بررسی کنند و فعال‌بودن را در پیکربندی روشن یا خاموش کنند. جریان‌های فقط‌خواندنی می‌توانند از `/plugin` به‌عنوان نام مستعار استفاده کنند. به‌طور پیش‌فرض غیرفعال است؛ با `commands.plugins: true` فعال کنید.

نمونه‌ها:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` و `/plugins show` از کشف واقعی Plugin در برابر workspace فعلی به‌همراه پیکربندی روی دیسک استفاده می‌کنند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Pluginها را نصب یا حذف نصب نمی‌کند.
- پس از تغییرات فعال/غیرفعال‌سازی، Gateway را دوباره راه‌اندازی کنید تا اعمال شوند.

</Note>

## نکته‌های سطح

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **دستورهای متنی** در نشست عادی چت اجرا می‌شوند (DMها `main` را مشترک دارند، گروه‌ها نشست خودشان را دارند).
    - **دستورهای بومی** از نشست‌های ایزوله استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (از طریق `CommandTargetSessionKey` نشست چت را هدف می‌گیرد)
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا بتواند اجرای فعلی را متوقف کند.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` همچنان برای یک دستور به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر دستور داخلی یک دستور slash در Slack بسازید (با همان نام‌های `/help`). منوهای آرگومان دستور برای Slack به‌صورت دکمه‌های موقت Block Kit تحویل داده می‌شوند.

    استثنای بومی Slack: `/agentstatus` را ثبت کنید (نه `/status`) چون Slack، `/status` را رزرو کرده است. `/status` متنی همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع درباره نشست فعلی است.

برخلاف چت عادی:

- از نشست فعلی به‌عنوان زمینه پس‌زمینه استفاده می‌کند،
- به‌صورت یک فراخوان یک‌باره جداگانه **بدون ابزار** اجرا می‌شود،
- زمینه نشست‌های آینده را تغییر نمی‌دهد،
- در تاریخچه رونوشت نوشته نمی‌شود،
- به‌جای پیام عادی دستیار، به‌صورت یک نتیجه جانبی زنده تحویل داده می‌شود.

این باعث می‌شود `/btw` زمانی مفید باشد که در حین ادامه کار اصلی، یک شفاف‌سازی موقت می‌خواهید.

نمونه:

```text
/btw what are we doing right now?
```

برای رفتار کامل و جزئیات UX کلاینت، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## مرتبط

- [ایجاد Skills](/fa/tools/creating-skills)
- [Skills](/fa/tools/skills)
- [پیکربندی Skills](/fa/tools/skills-config)
