---
read_when:
    - استفاده از دستورهای چت یا پیکربندی آن‌ها
    - اشکال‌زدایی مسیریابی فرمان یا مجوزها
sidebarTitle: Slash commands
summary: 'دستورهای اسلش: متن در برابر بومی، پیکربندی، و دستورهای پشتیبانی‌شده'
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-05-02T21:01:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

فرمان‌ها توسط Gateway پردازش می‌شوند. بیشتر فرمان‌ها باید به‌صورت یک پیام **مستقل** فرستاده شوند که با `/` شروع می‌شود. فرمان گفت‌وگوی bash فقط برای میزبان از `! <cmd>` استفاده می‌کند (`/bash <cmd>` هم به‌عنوان نام مستعار آن است).

وقتی یک مکالمه یا رشته به یک جلسه ACP متصل باشد، متن‌های پیگیری عادی به همان هارنس ACP هدایت می‌شوند. فرمان‌های مدیریتی Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به پردازشگر فرمان ACP در OpenClaw می‌رسد، و `/status` همراه با `/unfocus` هر زمان که پردازش فرمان برای سطح فعال باشد، محلی می‌مانند.

دو سامانه مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="فرمان‌ها">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="دستورالعمل‌ها">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - دستورالعمل‌ها پیش از آنکه مدل پیام را ببیند از پیام حذف می‌شوند.
    - در پیام‌های گفت‌وگوی عادی (نه پیام‌هایی که فقط دستورالعمل هستند)، به‌عنوان «راهنمای درون‌خطی» در نظر گرفته می‌شوند و تنظیمات جلسه را پایدار نمی‌کنند.
    - در پیام‌هایی که فقط دستورالعمل هستند (پیام فقط شامل دستورالعمل‌هاست)، در جلسه پایدار می‌شوند و با یک تأیید پاسخ می‌دهند.
    - دستورالعمل‌ها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، تنها فهرست مجاز مورد استفاده همان است؛ در غیر این صورت مجوز از فهرست‌های مجاز/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. فرستندگان غیرمجاز می‌بینند که دستورالعمل‌ها به‌عنوان متن ساده تلقی می‌شوند.

  </Accordion>
  <Accordion title="میان‌برهای درون‌خطی">
    فقط فرستندگان موجود در فهرست مجاز/مجاز: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

    بلافاصله اجرا می‌شوند، پیش از آنکه مدل پیام را ببیند حذف می‌شوند، و متن باقی‌مانده از مسیر عادی ادامه پیدا می‌کند.

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
  تجزیه `/...` را در پیام‌های گفت‌وگو فعال می‌کند. در سطح‌هایی بدون فرمان‌های بومی (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، فرمان‌های متنی حتی اگر این را روی `false` بگذارید همچنان کار می‌کنند.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  فرمان‌های بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (تا زمانی که فرمان‌های اسلش اضافه کنید)؛ برای ارائه‌دهندگان بدون پشتیبانی بومی نادیده گرفته می‌شود. برای بازنویسی به‌ازای هر ارائه‌دهنده (بولی یا `"auto"`)، `channels.discord.commands.native`، `channels.telegram.commands.native`، یا `channels.slack.commands.native` را تنظیم کنید. مقدار `false` فرمان‌های از پیش ثبت‌شده روی Discord/Telegram را هنگام راه‌اندازی پاک می‌کند. فرمان‌های Slack در برنامه Slack مدیریت می‌شوند و به‌صورت خودکار حذف نمی‌شوند.
</ParamField>
در Discord، مشخصات فرمان بومی می‌تواند شامل `descriptionLocalizations` باشد که OpenClaw آن را به‌عنوان `description_localizations` در Discord منتشر می‌کند و در مقایسه‌های تطبیق هم می‌گنجاند.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  فرمان‌های **skill** را در صورت پشتیبانی به‌صورت بومی ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack نیاز دارد برای هر skill یک فرمان اسلش ساخته شود). برای بازنویسی به‌ازای هر ارائه‌دهنده (بولی یا `"auto"`)، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills`، یا `channels.slack.commands.nativeSkills` را تنظیم کنید.
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  اجرای فرمان‌های shell میزبان با `! <cmd>` را فعال می‌کند (`/bash <cmd>` نام مستعار آن است؛ به فهرست‌های مجاز `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash چه مدت پیش از رفتن به حالت پس‌زمینه منتظر بماند (`0` بلافاصله آن را پس‌زمینه می‌کند).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` را فعال می‌کند (پیکربندی MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند/می‌نویسد).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` را فعال می‌کند (کشف/وضعیت Plugin به‌همراه کنترل‌های نصب و فعال/غیرفعال‌سازی).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` را فعال می‌کند (بازنویسی‌های فقط زمان اجرا).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` به‌همراه کنش‌های ابزار بازراه‌اندازی Gateway را فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک را برای سطح‌های فرمان/ابزار فقط مالک تنظیم می‌کند. این حساب اپراتور انسانی است که می‌تواند کنش‌های خطرناک را تأیید کند و فرمان‌هایی مانند `/diagnostics`، `/export-trajectory`، و `/config` را اجرا کند. این از `commands.allowFrom` و از دسترسی جفت‌سازی DM جداست.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  به‌ازای هر کانال: باعث می‌شود فرمان‌های فقط مالک برای اجرا روی آن سطح به **هویت مالک** نیاز داشته باشند. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک حل‌شده مطابقت داشته باشد (برای مثال یک ورودی در `commands.ownerAllowFrom` یا فراداده مالک بومی ارائه‌دهنده) یا روی یک کانال پیام داخلی، دامنه داخلی `operator.admin` داشته باشد. یک ورودی wildcard در `allowFrom` کانال، یا یک فهرست خالی/حل‌نشده از نامزدهای مالک، کافی **نیست** — فرمان‌های فقط مالک در آن کانال در حالت بسته شکست می‌خورند. اگر می‌خواهید فرمان‌های فقط مالک فقط با `ownerAllowFrom` و فهرست‌های مجاز استاندارد فرمان محدود شوند، این را خاموش بگذارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در پرامپت سیستم ظاهر شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  به‌صورت اختیاری راز HMAC مورد استفاده هنگام `commands.ownerDisplay="hash"` را تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز به‌ازای هر ارائه‌دهنده برای مجوز فرمان. وقتی پیکربندی شود، تنها منبع مجوز برای فرمان‌ها و دستورالعمل‌هاست (فهرست‌های مجاز/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). برای پیش‌فرض سراسری از `"*"` استفاده کنید؛ کلیدهای اختصاصی ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای فرمان‌ها اعمال می‌کند.
</ParamField>

## فهرست فرمان‌ها

منبع حقیقت فعلی:

- فرمان‌های داخلی هسته از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- فرمان‌های dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- فرمان‌های Plugin از فراخوانی‌های `registerCommand()` در Plugin می‌آیند
- دسترس‌پذیری واقعی روی Gateway شما همچنان به پرچم‌های پیکربندی، سطح کانال، و Pluginهای نصب‌شده/فعال بستگی دارد

### فرمان‌های داخلی هسته

<AccordionGroup>
  <Accordion title="جلسه‌ها و اجراها">
    - `/new [model]` یک جلسه تازه را شروع می‌کند؛ `/reset` نام مستعار بازنشانی است.
    - Control UI ورودی تایپ‌شده `/new` را رهگیری می‌کند تا یک جلسه داشبورد تازه بسازد و به آن جابه‌جا شود؛ ورودی تایپ‌شده `/reset` همچنان بازنشانی درجا در Gateway را اجرا می‌کند.
    - `/reset soft [message]` رونوشت فعلی را نگه می‌دارد، شناسه‌های جلسه backend CLI استفاده‌مجددشده را حذف می‌کند، و بارگذاری راه‌اندازی/پرامپت سیستم را درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` زمینه جلسه را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را لغو می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال رشته را مدیریت می‌کنند.
    - `/export-session [path]` جلسه فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` درخواست تأیید exec می‌کند، سپس یک [بسته trajectory](/fa/tools/trajectory) از نوع JSONL را برای جلسه فعلی صادر می‌کند. وقتی برای یک جلسه OpenClaw به خط زمانی پرامپت، ابزار، و رونوشت نیاز دارید از آن استفاده کنید. در گفت‌وگوهای گروهی، درخواست تأیید و نتیجه صدور به‌صورت خصوصی برای مالک فرستاده می‌شود. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="کنترل‌های مدل و اجرا">
    - `/think <level>` سطح تفکر را تنظیم می‌کند. گزینه‌ها از پروفایل ارائه‌دهنده مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium`، و `high` هستند، و سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max`، یا دودویی `on` فقط در جایی که پشتیبانی می‌شود وجود دارند. نام‌های مستعار: `/thinking`، `/t`.
    - `/verbose on|off|full` خروجی verbose را تغییر می‌دهد. نام مستعار: `/v`.
    - `/trace on|off` خروجی trace Plugin را برای جلسه فعلی تغییر می‌دهد.
    - `/fast [status|on|off]` حالت سریع را نشان می‌دهد یا تنظیم می‌کند.
    - `/reasoning [on|off|stream]` نمایانی reasoning را تغییر می‌دهد. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را تغییر می‌دهد. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نشان می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نشان می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` ارائه‌دهندگان پیکربندی‌شده/دارای احراز هویت در دسترس یا مدل‌های یک ارائه‌دهنده را فهرست می‌کند؛ برای مرور کامل کاتالوگ آن ارائه‌دهنده، `all` را اضافه کنید.
    - `/queue <mode>` رفتار صف را مدیریت می‌کند (`steer`، `queue` قدیمی، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی جلسه را پاک می‌کند. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
  <Accordion title="کشف و وضعیت">
    - `/help` خلاصه راهنمای کوتاه را نشان می‌دهد.
    - `/commands` کاتالوگ فرمان تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد عامل فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا را نشان می‌دهد، از جمله برچسب‌های `Execution`/`Runtime` و میزان مصرف/سهمیه ارائه‌دهنده، وقتی در دسترس باشد.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط مالک برای باگ‌های Gateway و اجراهای هارنس Codex است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` درخواست تأیید صریح exec می‌کند؛ diagnostics را با یک قانون allow-all تأیید نکنید. پس از تأیید، یک گزارش قابل چسباندن با مسیر بسته محلی، خلاصه manifest، یادداشت‌های حریم خصوصی، و شناسه‌های جلسه مرتبط می‌فرستد. در گفت‌وگوهای گروهی، درخواست تأیید و گزارش به‌صورت خصوصی برای مالک فرستاده می‌شود. وقتی جلسه فعال از هارنس OpenAI Codex استفاده می‌کند، همان تأیید همچنین بازخورد مرتبط Codex را به سرورهای OpenAI می‌فرستد و پاسخ تکمیل‌شده شناسه‌های جلسه OpenClaw، شناسه‌های رشته Codex، و فرمان‌های `codex resume <thread-id>` را فهرست می‌کند. [صدور Diagnostics](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` کمک‌یار راه‌اندازی و تعمیر Crestodian را از یک DM مالک اجرا می‌کند.
    - `/tasks` کارهای پس‌زمینه فعال/اخیر را برای جلسه فعلی فهرست می‌کند.
    - `/context [list|detail|json]` توضیح می‌دهد context چگونه مونتاژ می‌شود.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` پانویس مصرف به‌ازای هر پاسخ را کنترل می‌کند یا یک خلاصه هزینه محلی چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills، فهرست‌های مجاز، تأییدها">
    - `/skill <name> [input]` یک skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` ورودی‌های فهرست مجاز را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` درخواست‌های تأیید exec را حل می‌کند.
    - `/btw <question>` یک پرسش جانبی می‌پرسد بدون اینکه context آینده جلسه را تغییر دهد. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="زیرعامل‌ها و ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجراهای زیرعامل را برای نشست فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند.
    - `/focus <target>` رشته فعلی Discord یا موضوع/گفت‌وگوی Telegram را به یک هدف نشست متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` عامل‌های متصل به رشته را برای نشست فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک یا همه زیرعامل‌های در حال اجرا را متوقف می‌کند.
    - `/steer <id|#> <message>` پیام هدایت را به یک زیرعامل در حال اجرا می‌فرستد. نام مستعار: `/tell`.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت Plugin را بررسی یا تغییر می‌دهد. `/plugin` یک نام مستعار است. نوشتن فقط برای مالک. به `commands.plugins: true` نیاز دارد.
    - `/debug show|set|unset|reset` بازنویسی‌های پیکربندی فقط زمان اجرا را مدیریت می‌کند. فقط مالک. به `commands.debug: true` نیاز دارد.
    - `/restart` وقتی فعال باشد OpenClaw را راه‌اندازی مجدد می‌کند. پیش‌فرض: فعال؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/send on|off|inherit` سیاست ارسال را تنظیم می‌کند. فقط مالک.

  </Accordion>
  <Accordion title="صدا، TTS، کنترل کانال">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` TTS را کنترل می‌کند. [TTS](/fa/tools/tts) را ببینید.
    - `/activation mention|always` حالت فعال‌سازی گروه را تنظیم می‌کند.
    - `/bash <command>` یک فرمان پوسته میزبان را اجرا می‌کند. فقط متن. نام مستعار: `! <command>`. به `commands.bash: true` به‌همراه فهرست‌های مجاز `tools.elevated` نیاز دارد.
    - `!poll [sessionId]` یک کار bash پس‌زمینه را بررسی می‌کند.
    - `!stop [sessionId]` یک کار bash پس‌زمینه را متوقف می‌کند.

  </Accordion>
</AccordionGroup>

### دستورهای dock تولیدشده

دستورهای dock مسیر پاسخ نشست فعلی را به کانال پیوندشده دیگری تغییر می‌دهند. برای راه‌اندازی،
نمونه‌ها و عیب‌یابی، [Channel docking](/fa/concepts/channel-docking) را ببینید.

دستورهای dock از Pluginهای کانالی با پشتیبانی از فرمان بومی تولید می‌شوند. مجموعه همراه فعلی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از دستورهای dock در یک گفت‌وگوی مستقیم استفاده کنید تا مسیر پاسخ نشست فعلی را به کانال پیوندشده دیگری تغییر دهید. عامل همان زمینه نشست را حفظ می‌کند، اما پاسخ‌های بعدی برای آن نشست به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

دستورهای dock به `session.identityLinks` نیاز دارند. فرستنده مبدأ و همتای مقصد باید در یک گروه هویتی باشند، برای مثال `["telegram:123", "discord:456"]`. اگر کاربر Telegram با شناسه `123` دستور `/dock_discord` را بفرستد، OpenClaw مقدار `lastChannel: "discord"` و `lastTo: "456"` را روی نشست فعال ذخیره می‌کند. اگر فرستنده به یک همتای Discord پیوند نشده باشد، فرمان به‌جای عبور به گفت‌وگوی عادی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

dock کردن فقط مسیر نشست فعال را تغییر می‌دهد. حساب‌های کانال ایجاد نمی‌کند، دسترسی نمی‌دهد، فهرست‌های مجاز کانال را دور نمی‌زند، یا تاریخچه رونوشت را به نشست دیگری منتقل نمی‌کند. برای تغییر دوباره مسیر از `/dock-telegram`، `/dock-slack`، `/dock-mattermost` یا یک دستور dock تولیدشده دیگر استفاده کنید.

### دستورهای Plugin همراه

Pluginهای همراه می‌توانند دستورهای slash بیشتری اضافه کنند. دستورهای همراه فعلی در این مخزن:

- `/dreaming [on|off|status|help]` Dreaming حافظه را تغییر می‌دهد. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [Pairing](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` فرمان‌های پرخطر Node تلفن را موقتاً مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام فرمان بومی `/talkvoice` است.
- `/card ...` پیش‌تنظیم‌های کارت غنی LINE را ارسال می‌کند. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` harness سرور برنامه Codex همراه را بررسی و کنترل می‌کند. [Codex harness](/fa/plugins/codex-harness) را ببینید.
- دستورهای فقط QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### دستورهای Skills پویا

Skills قابل فراخوانی توسط کاربر نیز به‌صورت دستورهای slash ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills ممکن است وقتی Skills/Plugin آن‌ها را ثبت کند، به‌صورت فرمان‌های مستقیم مانند `/prose` نیز ظاهر شوند.
- ثبت فرمان بومی Skills توسط `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- مشخصات فرمان می‌تواند برای سطوح بومی که از توضیحات بومی‌سازی‌شده پشتیبانی می‌کنند، از جمله Discord، مقدار `descriptionLocalizations` ارائه کند.

<AccordionGroup>
  <Accordion title="نکات آرگومان و پارسر">
    - فرمان‌ها یک `:` اختیاری بین فرمان و آرگومان‌ها می‌پذیرند (مثلاً `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام provider را می‌پذیرد (تطبیق تقریبی)؛ اگر تطبیقی نباشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل مصرف provider، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و `configWrites` کانال را رعایت می‌کند.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدف‌دار برای پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز `configWrites` حساب هدف را رعایت می‌کنند.
    - `/usage` پابرگ مصرف هر پاسخ را کنترل می‌کند؛ `/usage cost` یک خلاصه هزینه محلی را از لاگ‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌صورت پیش‌فرض فعال است؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات Plugin را می‌پذیرد که `openclaw plugins install` می‌پذیرد: مسیر/آرشیو محلی، بسته npm، `git:<repo>`، یا `clawhub:<pkg>`، سپس چون ماژول‌های منبع Plugin تغییر کرده‌اند، درخواست راه‌اندازی مجدد Gateway می‌کند.
    - `/plugins enable|disable` پیکربندی Plugin را به‌روزرسانی می‌کند و برای نوبت‌های جدید عامل، بارگذاری دوباره Plugin در Gateway را فعال می‌کند.

  </Accordion>
  <Accordion title="رفتار ویژه کانال">
    - فرمان بومی فقط Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال صوتی/stage انتخاب‌شده نیاز دارد. به `channels.discord.voice` و فرمان‌های بومی نیاز دارد.
    - فرمان‌های اتصال رشته در Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های مؤثر رشته فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع فرمان ACP و رفتار زمان اجرا: [ACP agents](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی verbose / trace / fast / reasoning">
    - `/verbose` برای اشکال‌زدایی و دیدپذیری بیشتر است؛ در استفاده عادی آن را **خاموش** نگه دارید.
    - `/trace` از `/verbose` محدودتر است: فقط خطوط trace/debug متعلق به Plugin را آشکار می‌کند و پرگویی عادی ابزارها را خاموش نگه می‌دارد.
    - `/fast on|off` یک بازنویسی نشست را پایدار می‌کند. برای پاک کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینه `inherit` در رابط کاربری Sessions استفاده کنید.
    - `/fast` ویژه provider است: OpenAI/OpenAI Codex آن را روی endpointهای بومی Responses به `service_tier=priority` نگاشت می‌کنند، در حالی که درخواست‌های عمومی مستقیم Anthropic، از جمله ترافیک احراز‌شده با OAuth که به `api.anthropic.com` فرستاده می‌شود، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های شکست ابزار همچنان وقتی مرتبط باشند نشان داده می‌شوند، اما متن تفصیلی شکست فقط زمانی درج می‌شود که `/verbose` برابر `on` یا `full` باشد.
    - `/reasoning`، `/verbose` و `/trace` در محیط‌های گروهی پرریسک هستند: ممکن است reasoning داخلی، خروجی ابزار یا عیب‌یابی‌های Plugin را که قصد افشایشان را نداشتید آشکار کنند. بهتر است آن‌ها را خاموش نگه دارید، به‌ویژه در گفت‌وگوهای گروهی.

  </Accordion>
  <Accordion title="تعویض مدل">
    - `/model` مدل نشست جدید را فوراً پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی بلافاصله از آن استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw تعویض زنده را در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه retry تمیز با مدل جدید راه‌اندازی مجدد می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تعویض در انتظار می‌تواند تا فرصت retry بعدی یا نوبت بعدی کاربر در صف بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian برمی‌گردد. این از حالت نجات کانال پیام جداست و اختیار پیکربندی راه‌دور نمی‌دهد.

  </Accordion>
  <Accordion title="مسیر سریع و میانبرهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط فرمان از فرستندگان در فهرست مجاز فوراً پردازش می‌شوند (دور زدن صف + مدل).
    - **دروازه‌گذاری منشن گروهی:** پیام‌های فقط فرمان از فرستندگان در فهرست مجاز، الزامات منشن را دور می‌زنند.
    - **میانبرهای درون‌خطی (فقط فرستندگان در فهرست مجاز):** بعضی فرمان‌ها وقتی در یک پیام عادی جاسازی شده باشند نیز کار می‌کنند و قبل از اینکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه پیدا می‌کند.
    - در حال حاضر: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط فرمان غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="دستورهای Skills و آرگومان‌های بومی">
    - **دستورهای Skills:** Skills با مقدار `user-invocable` به‌صورت دستورهای slash ارائه می‌شوند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوندهای عددی می‌گیرند (مثلاً `_2`).
      - `/skill <name> [input]` یک Skills را با نام اجرا می‌کند (وقتی محدودیت‌های فرمان بومی مانع فرمان‌های جداگانه برای هر Skills می‌شود مفید است).
      - به‌صورت پیش‌فرض، دستورهای Skills به‌عنوان یک درخواست عادی به مدل فرستاده می‌شوند.
      - Skills می‌توانند به‌صورت اختیاری `command-dispatch: tool` را اعلام کنند تا فرمان مستقیماً به یک ابزار مسیریابی شود (قطعی، بدون مدل).
      - مثال: `/prose` (OpenProse plugin) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های فرمان بومی:** Discord برای گزینه‌های پویا از تکمیل خودکار استفاده می‌کند (و وقتی آرگومان‌های ضروری را حذف کنید، از منوهای دکمه‌ای). Telegram و Slack وقتی یک فرمان از انتخاب‌ها پشتیبانی کند و شما آرگومان را حذف کنید، یک منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا نسبت به مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های ویژه مدل مانند سطوح `/think` از بازنویسی `/model` همان نشست پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه یک پرسش پیکربندی: **این عامل همین حالا در این گفت‌وگو از چه چیزهایی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده و برای مرور سریع بهینه شده است.
- `/tools verbose` توضیح‌های کوتاه اضافه می‌کند.
- سطوح فرمان بومی که از آرگومان‌ها پشتیبانی می‌کنند، همان تغییر حالت `compact|verbose` را ارائه می‌کنند.
- نتایج وابسته به نشست هستند، بنابراین تغییر عامل، کانال، رشته، مجوز فرستنده یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` ابزارهایی را شامل می‌شود که واقعاً در زمان اجرا قابل دسترسی هستند، از جمله ابزارهای هسته، ابزارهای Plugin متصل، و ابزارهای متعلق به کانال.

برای ویرایش پروفایل و بازنویسی‌ها، به‌جای اینکه `/tools` را به‌عنوان یک کاتالوگ ثابت در نظر بگیرید، از پنل Tools در Control UI یا سطوح پیکربندی/کاتالوگ استفاده کنید.

## سطوح مصرف (چه چیزی کجا نمایش داده می‌شود)

- **استفاده/سهمیه ارائه‌دهنده** (مثال: "Claude 80% left") وقتی ردیابی استفاده فعال باشد، برای ارائه‌دهنده مدل فعلی در `/status` نشان داده می‌شود. OpenClaw پنجره‌های ارائه‌دهنده را به `% left` نرمال‌سازی می‌کند؛ برای MiniMax، فیلدهای درصدِ فقط-باقی‌مانده پیش از نمایش معکوس می‌شوند، و پاسخ‌های `model_remains` ورودی مدل چت به‌همراه برچسب پلنِ دارای برچسب مدل را ترجیح می‌دهند.
- **خطوط توکن/کش** در `/status` وقتی تصویر لحظه‌ای نشست زنده کم‌جزئیات باشد، می‌توانند به آخرین ورودی استفاده در رونوشت برگردند. مقادیر زنده غیرصفر موجود همچنان اولویت دارند، و fallback رونوشت همچنین می‌تواند برچسب مدل زمان اجرای فعال به‌همراه یک مجموع بزرگ‌ترِ متمرکز بر پرامپت را، وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند، بازیابی کند.
- **اجرا در برابر زمان اجرا:** `/status` مقدار `Execution` را برای مسیر مؤثر sandbox و `Runtime` را برای کسی که واقعاً نشست را اجرا می‌کند گزارش می‌دهد: `OpenClaw Pi Default`، `OpenAI Codex`، یک backend مربوط به CLI، یا یک backend مربوط به ACP.
- **توکن/هزینه به‌ازای هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی افزوده می‌شود).
- `/model status` درباره **مدل‌ها/احراز هویت/endpointها** است، نه استفاده.

## انتخاب مدل (`/model`)

`/model` به‌صورت یک directive پیاده‌سازی شده است.

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

- `/model` و `/model list` یک انتخابگر فشرده و شماره‌دار نشان می‌دهند (خانواده مدل + ارائه‌دهندگان موجود).
- در Discord، `/model` و `/models` یک انتخابگر تعاملی با dropdownهای ارائه‌دهنده و مدل به‌همراه یک مرحله Submit باز می‌کنند.
- `/model <#>` از همان انتخابگر انتخاب می‌کند (و در صورت امکان ارائه‌دهنده فعلی را ترجیح می‌دهد).
- `/model status` نمای تفصیلی را نشان می‌دهد، از جمله endpoint پیکربندی‌شده ارائه‌دهنده (`baseUrl`) و حالت API (`api`) وقتی موجود باشد.

## overrideهای دیباگ

`/debug` به شما اجازه می‌دهد overrideهای پیکربندی **فقط زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک). فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
overrideها فوراً روی خواندن‌های جدید پیکربندی اعمال می‌شوند، اما در `openclaw.json` نوشته نمی‌شوند. برای پاک‌کردن همه overrideها و بازگشت به پیکربندی روی دیسک از `/debug reset` استفاده کنید.
</Note>

## خروجی trace مربوط به Plugin

`/trace` به شما اجازه می‌دهد **خطوط trace/debug مربوط به Plugin در محدوده نشست** را بدون روشن‌کردن حالت کامل verbose تغییر دهید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

نکته‌ها:

- `/trace` بدون آرگومان وضعیت trace نشست فعلی را نشان می‌دهد.
- `/trace on` خطوط trace مربوط به Plugin را برای نشست فعلی فعال می‌کند.
- `/trace off` دوباره آن‌ها را غیرفعال می‌کند.
- خطوط trace مربوط به Plugin می‌توانند در `/status` و به‌صورت پیام تشخیصیِ پیگیری پس از پاسخ عادی دستیار ظاهر شوند.
- `/trace` جایگزین `/debug` نمی‌شود؛ `/debug` همچنان overrideهای پیکربندی فقط زمان اجرا را مدیریت می‌کند.
- `/trace` جایگزین `/verbose` نمی‌شود؛ خروجی عادی verbose مربوط به ابزار/وضعیت همچنان به `/verbose` تعلق دارد.

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
پیکربندی پیش از نوشتن اعتبارسنجی می‌شود؛ تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config` پس از راه‌اندازی مجدد هم باقی می‌مانند.
</Note>

## به‌روزرسانی‌های MCP

`/mcp` تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌نویسد. فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.mcp: true` فعال کنید.

نمونه‌ها:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه در تنظیمات پروژه متعلق به Pi. adapterهای زمان اجرا تصمیم می‌گیرند کدام transportها واقعاً قابل اجرا هستند.
</Note>

## به‌روزرسانی‌های Plugin

`/plugins` به اپراتورها اجازه می‌دهد Pluginهای کشف‌شده را بررسی کنند و فعال‌بودن را در پیکربندی تغییر دهند. جریان‌های فقط خواندنی می‌توانند از `/plugin` به‌عنوان alias استفاده کنند. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.plugins: true` فعال کنید.

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
- `/plugins install` از ClawHub، npm، git، دایرکتوری‌های محلی و archiveها نصب می‌کند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Pluginها را نصب یا حذف نمی‌کند.
- تغییرات فعال‌سازی و غیرفعال‌سازی، سطح‌های زمان اجرای Plugin مربوط به Gateway را برای نوبت‌های جدید عامل hot-reload می‌کنند؛ درخواست نصب نیازمند راه‌اندازی مجدد Gateway است، چون ماژول‌های منبع Plugin تغییر کرده‌اند.

</Note>

## نکته‌های سطح

<AccordionGroup>
  <Accordion title="نشست‌ها به‌ازای هر سطح">
    - **دستورهای متنی** در نشست عادی چت اجرا می‌شوند (DMها `main` را به‌اشتراک می‌گذارند، گروه‌ها نشست خودشان را دارند).
    - **دستورهای بومی** از نشست‌های ایزوله استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (نشست چت را از طریق `CommandTargetSessionKey` هدف می‌گیرد)
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا بتواند اجرای فعلی را abort کند.

  </Accordion>
  <Accordion title="جزئیات Slack">
    `channels.slack.slashCommand` همچنان برای یک دستور واحد به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر دستور داخلی یک Slack slash command بسازید (همان نام‌های `/help`). منوهای آرگومان دستور برای Slack به‌صورت دکمه‌های ephemeral مربوط به Block Kit ارسال می‌شوند.

    استثنای بومی Slack: `/agentstatus` را ثبت کنید (نه `/status`) چون Slack، `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع درباره نشست فعلی است.

برخلاف چت عادی:

- از نشست فعلی به‌عنوان زمینه پس‌زمینه استفاده می‌کند،
- به‌صورت یک فراخوانی one-shot جداگانه و **بدون ابزار** اجرا می‌شود،
- زمینه نشست آینده را تغییر نمی‌دهد،
- در تاریخچه رونوشت نوشته نمی‌شود،
- به‌جای پیام عادی دستیار، به‌صورت نتیجه جانبی زنده تحویل داده می‌شود.

این باعث می‌شود `/btw` وقتی بخواهید در حالی که کار اصلی ادامه دارد یک شفاف‌سازی موقت بگیرید، مفید باشد.

نمونه:

```text
/btw what are we doing right now?
```

برای رفتار کامل و جزئیات UX کلاینت، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## مرتبط

- [ایجاد Skills](/fa/tools/creating-skills)
- [Skills](/fa/tools/skills)
- [پیکربندی Skills](/fa/tools/skills-config)
