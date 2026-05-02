---
read_when:
    - استفاده از فرمان‌های چت یا پیکربندی آن‌ها
    - اشکال‌زدایی مسیریابی فرمان یا مجوزها
sidebarTitle: Slash commands
summary: 'دستورهای اسلش: متنی در برابر بومی، پیکربندی، و دستورهای پشتیبانی‌شده'
title: فرمان‌های اسلش
x-i18n:
    generated_at: "2026-05-02T12:06:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b469c4436dec92eb3712f71e5f54bf2c96b9b0b17d60a1533d8669c127caefee
    source_path: tools/slash-commands.md
    workflow: 16
---

فرمان‌ها توسط Gateway پردازش می‌شوند. بیشتر فرمان‌ها باید به‌صورت یک پیام **مستقل** ارسال شوند که با `/` شروع می‌شود. فرمان گفت‌وگوی bash فقط برای میزبان از `! <cmd>` استفاده می‌کند (`/bash <cmd>` هم نام مستعار آن است).

وقتی یک گفت‌وگو یا رشته به یک نشست ACP متصل باشد، متن‌های پیگیری معمولی به همان ACP harness هدایت می‌شوند. فرمان‌های مدیریتی Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به پردازشگر فرمان ACP در OpenClaw می‌رسد، و `/status` به‌همراه `/unfocus` هر زمان که پردازش فرمان برای آن سطح فعال باشد محلی می‌مانند.

دو سامانه مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="فرمان‌ها">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="دستورالعمل‌ها">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - دستورالعمل‌ها پیش از آن‌که مدل پیام را ببیند از پیام حذف می‌شوند.
    - در پیام‌های گفت‌وگوی معمولی (نه پیام‌های فقط-دستورالعمل)، آن‌ها به‌عنوان «راهنمای درون‌خطی» در نظر گرفته می‌شوند و تنظیمات نشست را پایدار نمی‌کنند.
    - در پیام‌های فقط-دستورالعمل (پیامی که فقط شامل دستورالعمل‌هاست)، آن‌ها در نشست پایدار می‌شوند و با یک تأیید پاسخ می‌دهند.
    - دستورالعمل‌ها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، تنها فهرست مجاز مورد استفاده همان است؛ در غیر این صورت مجوز از فهرست‌های مجاز/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. فرستندگان غیرمجاز می‌بینند که دستورالعمل‌ها به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="میانبرهای درون‌خطی">
    فقط فرستندگان موجود در فهرست مجاز/مجازشده: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

    آن‌ها بلافاصله اجرا می‌شوند، پیش از آن‌که مدل پیام را ببیند حذف می‌شوند، و متن باقی‌مانده از جریان عادی ادامه پیدا می‌کند.

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
  تجزیه `/...` را در پیام‌های گفت‌وگو فعال می‌کند. روی سطح‌هایی که فرمان بومی ندارند (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، فرمان‌های متنی همچنان کار می‌کنند حتی اگر این گزینه را روی `false` تنظیم کنید.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  فرمان‌های بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (تا زمانی که slash command اضافه کنید)؛ برای ارائه‌دهندگانی که پشتیبانی بومی ندارند نادیده گرفته می‌شود. برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.native`، `channels.telegram.commands.native` یا `channels.slack.commands.native` را تنظیم کنید (bool یا `"auto"`). مقدار `false` در زمان راه‌اندازی، فرمان‌های ثبت‌شده قبلی را در Discord/Telegram پاک می‌کند. فرمان‌های Slack در برنامه Slack مدیریت می‌شوند و به‌صورت خودکار حذف نمی‌شوند.
</ParamField>
در Discord، مشخصات فرمان بومی می‌تواند شامل `descriptionLocalizations` باشد که OpenClaw آن را به‌عنوان `description_localizations` در Discord منتشر می‌کند و در مقایسه‌های همگام‌سازی لحاظ می‌کند.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  وقتی پشتیبانی شود، فرمان‌های **skill** را به‌صورت بومی ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack نیاز دارد برای هر skill یک slash command بسازید). برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills` یا `channels.slack.commands.nativeSkills` را تنظیم کنید (bool یا `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  اجرای فرمان‌های پوسته میزبان را با `! <cmd>` فعال می‌کند (`/bash <cmd>` نام مستعار است؛ به فهرست‌های مجاز `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash چه مدت پیش از رفتن به حالت پس‌زمینه منتظر بماند (`0` بلافاصله به پس‌زمینه می‌فرستد).
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
  `/restart` را به‌همراه کنش‌های ابزار راه‌اندازی مجدد gateway فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک را برای سطح‌های فرمان/ابزار فقط-مالک تنظیم می‌کند. این حساب اپراتور انسانی است که می‌تواند کنش‌های خطرناک را تأیید کند و فرمان‌هایی مانند `/diagnostics`، `/export-trajectory` و `/config` را اجرا کند. این گزینه از `commands.allowFrom` و از دسترسی جفت‌سازی DM جداست.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  به‌ازای هر کانال: باعث می‌شود فرمان‌های فقط-مالک برای اجرا روی آن سطح به **هویت مالک** نیاز داشته باشند. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک حل‌شده (برای مثال یک ورودی در `commands.ownerAllowFrom` یا فراداده مالک بومی ارائه‌دهنده) مطابقت داشته باشد، یا روی یک کانال پیام داخلی دامنه داخلی `operator.admin` داشته باشد. یک ورودی wildcard در `allowFrom` کانال، یا یک فهرست خالی/حل‌نشده از نامزدهای مالک، کافی **نیست** — فرمان‌های فقط-مالک روی آن کانال به‌صورت بسته شکست می‌خورند. اگر می‌خواهید فرمان‌های فقط-مالک فقط با `ownerAllowFrom` و فهرست‌های مجاز استاندارد فرمان محدود شوند، این گزینه را خاموش بگذارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در اعلان سیستم نمایش داده شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  به‌صورت اختیاری راز HMAC مورد استفاده هنگام `commands.ownerDisplay="hash"` را تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز به‌ازای هر ارائه‌دهنده برای مجوزدهی فرمان. وقتی پیکربندی شود، تنها منبع مجوزدهی برای فرمان‌ها و دستورالعمل‌هاست (فهرست‌های مجاز/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). از `"*"` برای پیش‌فرض سراسری استفاده کنید؛ کلیدهای مخصوص ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای فرمان‌ها اعمال می‌کند.
</ParamField>

## فهرست فرمان‌ها

منبع حقیقت فعلی:

- فرمان‌های داخلی هسته از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- فرمان‌های dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- فرمان‌های Plugin از فراخوانی‌های `registerCommand()` در Plugin می‌آیند
- دسترس‌پذیری واقعی روی gateway شما همچنان به پرچم‌های پیکربندی، سطح کانال، و Pluginهای نصب‌شده/فعال بستگی دارد

### فرمان‌های داخلی هسته

<AccordionGroup>
  <Accordion title="نشست‌ها و اجراها">
    - `/new [model]` یک نشست جدید شروع می‌کند؛ `/reset` نام مستعار بازنشانی است.
    - Control UI، `/new` تایپ‌شده را رهگیری می‌کند تا یک نشست داشبورد تازه بسازد و به آن سوییچ کند؛ `/reset` تایپ‌شده همچنان بازنشانی درجا در Gateway را اجرا می‌کند.
    - `/reset soft [message]` رونوشت فعلی را نگه می‌دارد، شناسه‌های نشست backend مربوط به CLI که دوباره استفاده شده‌اند را حذف می‌کند، و بارگذاری راه‌اندازی/اعلان سیستم را به‌صورت درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` زمینه نشست را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را لغو می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال رشته را مدیریت می‌کنند.
    - `/export-session [path]` نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` درخواست تأیید exec می‌کند، سپس یک [بسته trajectory](/fa/tools/trajectory) از نوع JSONL را برای نشست فعلی صادر می‌کند. وقتی برای یک نشست OpenClaw به خط زمانی اعلان، ابزار، و رونوشت نیاز دارید از آن استفاده کنید. در گفت‌وگوهای گروهی، اعلان تأیید و نتیجه خروجی به‌صورت خصوصی برای مالک ارسال می‌شوند. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="کنترل‌های مدل و اجرا">
    - `/think <level>` سطح تفکر را تنظیم می‌کند. گزینه‌ها از پروفایل ارائه‌دهنده مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium` و `high` هستند، و سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max` یا مقدار دودویی `on` فقط جایی که پشتیبانی شود وجود دارند. نام‌های مستعار: `/thinking`، `/t`.
    - `/verbose on|off|full` خروجی پرجزئیات را تغییر می‌دهد. نام مستعار: `/v`.
    - `/trace on|off` خروجی trace مربوط به Plugin را برای نشست فعلی تغییر می‌دهد.
    - `/fast [status|on|off]` حالت سریع را نشان می‌دهد یا تنظیم می‌کند.
    - `/reasoning [on|off|stream]` نمایانی reasoning را تغییر می‌دهد. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را تغییر می‌دهد. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نشان می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نشان می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` ارائه‌دهندگان پیکربندی‌شده/دارای احراز هویت در دسترس یا مدل‌های یک ارائه‌دهنده را فهرست می‌کند؛ برای مرور کاتالوگ کامل آن ارائه‌دهنده، `all` را اضافه کنید.
    - `/queue <mode>` رفتار صف را مدیریت می‌کند (`steer`، `queue` قدیمی، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی نشست را پاک می‌کند. [صف فرمان](/fa/concepts/queue) و [صف Steering](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
  <Accordion title="کشف و وضعیت">
    - `/help` خلاصه کوتاه راهنما را نشان می‌دهد.
    - `/commands` کاتالوگ فرمان تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد عامل فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا را نشان می‌دهد، از جمله برچسب‌های `Execution`/`Runtime` و مصرف/سهمیه ارائه‌دهنده در صورت دسترس بودن.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط-مالک برای خطاهای Gateway و اجراهای Codex harness است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` تأیید صریح exec می‌خواهد؛ diagnostics را با قانون allow-all تأیید نکنید. پس از تأیید، گزارشی قابل چسباندن می‌فرستد که شامل مسیر بسته محلی، خلاصه manifest، نکات حریم خصوصی، و شناسه‌های نشست مرتبط است. در گفت‌وگوهای گروهی، اعلان تأیید و گزارش به‌صورت خصوصی برای مالک ارسال می‌شوند. وقتی نشست فعال از OpenAI Codex harness استفاده کند، همان تأیید همچنین بازخورد مرتبط Codex را به سرورهای OpenAI می‌فرستد و پاسخ تکمیل‌شده شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و فرمان‌های `codex resume <thread-id>` را فهرست می‌کند. [خروجی Diagnostics](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` راه‌انداز و کمک‌ابزار تعمیر Crestodian را از DM مالک اجرا می‌کند.
    - `/tasks` کارهای پس‌زمینه فعال/اخیر را برای نشست فعلی فهرست می‌کند.
    - `/context [list|detail|json]` توضیح می‌دهد زمینه چگونه مونتاژ می‌شود.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` پاورقی مصرف به‌ازای هر پاسخ را کنترل می‌کند یا خلاصه هزینه محلی را چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills، فهرست‌های مجاز، تأییدها">
    - `/skill <name> [input]` یک skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` ورودی‌های فهرست مجاز را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` اعلان‌های تأیید exec را حل می‌کند.
    - `/btw <question>` بدون تغییر زمینه آینده نشست، یک پرسش جانبی می‌پرسد. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="زیرعامل‌ها و ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجراهای زیرعامل را برای نشست فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند.
    - `/focus <target>` رشته فعلی Discord یا موضوع/مکالمه Telegram را به یک هدف نشست متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` عامل‌های متصل به رشته را برای نشست فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک یا همه زیرعامل‌های در حال اجرا را متوقف می‌کند.
    - `/steer <id|#> <message>` هدایت را به یک زیرعامل در حال اجرا می‌فرستد. نام مستعار: `/tell`.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت Plugin را بررسی یا تغییر می‌دهد. `/plugin` یک نام مستعار است. نوشتن فقط برای مالک است. به `commands.plugins: true` نیاز دارد.
    - `/debug show|set|unset|reset` بازنویسی‌های پیکربندی فقط زمان اجرا را مدیریت می‌کند. فقط مالک. به `commands.debug: true` نیاز دارد.
    - `/restart` در صورت فعال بودن، OpenClaw را راه‌اندازی مجدد می‌کند. پیش‌فرض: فعال؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/send on|off|inherit` سیاست ارسال را تنظیم می‌کند. فقط مالک.

  </Accordion>
  <Accordion title="صدا، TTS، کنترل کانال">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` کنترل TTS را انجام می‌دهد. [TTS](/fa/tools/tts) را ببینید.
    - `/activation mention|always` حالت فعال‌سازی گروهی را تنظیم می‌کند.
    - `/bash <command>` یک فرمان پوسته میزبان را اجرا می‌کند. فقط متنی. نام مستعار: `! <command>`. به `commands.bash: true` به‌علاوه فهرست‌های مجاز `tools.elevated` نیاز دارد.
    - `!poll [sessionId]` یک کار پس‌زمینه bash را بررسی می‌کند.
    - `!stop [sessionId]` یک کار پس‌زمینه bash را متوقف می‌کند.

  </Accordion>
</AccordionGroup>

### فرمان‌های dock تولیدشده

فرمان‌های Dock مسیر پاسخ نشست فعلی را به کانال متصل دیگری تغییر می‌دهند. برای راه‌اندازی، نمونه‌ها و عیب‌یابی، [اتصال کانال](/fa/concepts/channel-docking) را ببینید.

فرمان‌های Dock از Pluginهای کانال با پشتیبانی فرمان بومی تولید می‌شوند. مجموعه بسته‌بندی‌شده فعلی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از فرمان‌های dock در یک گفت‌وگوی مستقیم استفاده کنید تا مسیر پاسخ نشست فعلی را به کانال متصل دیگری تغییر دهید. عامل همان زمینه نشست را نگه می‌دارد، اما پاسخ‌های بعدی برای آن نشست به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

فرمان‌های Dock به `session.identityLinks` نیاز دارند. فرستنده مبدأ و همتای مقصد باید در یک گروه هویت باشند، برای مثال `["telegram:123", "discord:456"]`. اگر یک کاربر Telegram با شناسه `123` فرمان `/dock_discord` را بفرستد، OpenClaw مقدار `lastChannel: "discord"` و `lastTo: "456"` را روی نشست فعال ذخیره می‌کند. اگر فرستنده به همتای Discord متصل نباشد، فرمان به‌جای عبور به گفت‌وگوی معمولی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

اتصال فقط مسیر نشست فعال را تغییر می‌دهد. حساب‌های کانال ایجاد نمی‌کند، دسترسی نمی‌دهد، فهرست‌های مجاز کانال را دور نمی‌زند، یا تاریخچه رونوشت را به نشست دیگری منتقل نمی‌کند. برای تغییر دوباره مسیر از `/dock-telegram`، `/dock-slack`، `/dock-mattermost`، یا فرمان dock تولیدشده دیگری استفاده کنید.

### فرمان‌های Plugin بسته‌بندی‌شده

Pluginهای بسته‌بندی‌شده می‌توانند فرمان‌های اسلش بیشتری اضافه کنند. فرمان‌های بسته‌بندی‌شده فعلی در این مخزن:

- `/dreaming [on|off|status|help]` memory dreaming را روشن یا خاموش می‌کند. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [جفت‌سازی](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` فرمان‌های پرخطر گره تلفن را به‌طور موقت مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام فرمان بومی `/talkvoice` است.
- `/card ...` پیش‌تنظیم‌های کارت غنی LINE را می‌فرستد. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` harness سرور-برنامه Codex بسته‌بندی‌شده را بررسی و کنترل می‌کند. [harness کدکس](/fa/plugins/codex-harness) را ببینید.
- فرمان‌های فقط QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### فرمان‌های Skills پویا

Skills قابل فراخوانی توسط کاربر نیز به‌صورت فرمان‌های اسلش ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills همچنین ممکن است وقتی Skill/Plugin آن‌ها را ثبت می‌کند، به‌صورت فرمان‌های مستقیم مانند `/prose` ظاهر شوند.
- ثبت بومی فرمان Skill با `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- مشخصات فرمان می‌توانند برای سطح‌های بومی که از توضیحات بومی‌سازی‌شده پشتیبانی می‌کنند، از جمله Discord، مقدار `descriptionLocalizations` ارائه کنند.

<AccordionGroup>
  <Accordion title="یادداشت‌های آرگومان و تجزیه‌گر">
    - فرمان‌ها یک `:` اختیاری بین فرمان و آرگومان‌ها می‌پذیرند (مثلاً `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام ارائه‌دهنده را می‌پذیرد (تطبیق تقریبی)؛ اگر تطبیقی نباشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل استفاده از ارائه‌دهنده، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و `configWrites` کانال را رعایت می‌کند.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدف‌گذاری‌شده برای پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز `configWrites` حساب هدف را رعایت می‌کنند.
    - `/usage` پانوشت استفاده برای هر پاسخ را کنترل می‌کند؛ `/usage cost` یک خلاصه هزینه محلی را از گزارش‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌طور پیش‌فرض فعال است؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات Plugin را می‌پذیرد که `openclaw plugins install` می‌پذیرد: مسیر/آرشیو محلی، بسته npm، `git:<repo>`، یا `clawhub:<pkg>`.
    - `/plugins enable|disable` پیکربندی Plugin را به‌روزرسانی می‌کند و ممکن است درخواست راه‌اندازی مجدد کند.

  </Accordion>
  <Accordion title="رفتار ویژه کانال">
    - فرمان بومی فقط Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال صوتی/stage انتخاب‌شده نیاز دارد. به `channels.discord.voice` و فرمان‌های بومی نیاز دارد.
    - فرمان‌های اتصال رشته در Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های رشته مؤثر فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع فرمان ACP و رفتار زمان اجرا: [عامل‌های ACP](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی verbose / trace / fast / reasoning">
    - `/verbose` برای اشکال‌زدایی و دیدپذیری بیشتر در نظر گرفته شده است؛ در استفاده عادی آن را **خاموش** نگه دارید.
    - `/trace` از `/verbose` محدودتر است: فقط خط‌های trace/debug متعلق به Plugin را آشکار می‌کند و گفت‌وگوی پرجزئیات عادی ابزار را خاموش نگه می‌دارد.
    - `/fast on|off` یک بازنویسی نشست را پایدار می‌کند. برای پاک کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینه `inherit` در رابط کاربری Sessions استفاده کنید.
    - `/fast` وابسته به ارائه‌دهنده است: OpenAI/OpenAI Codex آن را در نقاط پایانی بومی Responses به `service_tier=priority` نگاشت می‌کنند، در حالی که درخواست‌های عمومی مستقیم Anthropic، از جمله ترافیک احراز هویت‌شده با OAuth ارسال‌شده به `api.anthropic.com`، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های شکست ابزار همچنان در صورت مرتبط بودن نمایش داده می‌شوند، اما متن تفصیلی شکست فقط وقتی گنجانده می‌شود که `/verbose` برابر `on` یا `full` باشد.
    - `/reasoning`، `/verbose`، و `/trace` در محیط‌های گروهی پرخطر هستند: ممکن است استدلال داخلی، خروجی ابزار، یا تشخیص‌های Plugin را که قصد افشای آن‌ها را نداشتید آشکار کنند. ترجیحاً آن‌ها را خاموش بگذارید، به‌ویژه در گفت‌وگوهای گروهی.

  </Accordion>
  <Accordion title="تعویض مدل">
    - `/model` مدل جدید نشست را بلافاصله پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی بلافاصله از آن استفاده می‌کند.
    - اگر اجرا از قبل فعال باشد، OpenClaw یک تعویض زنده را در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش مجدد تمیز با مدل جدید راه‌اندازی مجدد می‌شود.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تعویض در انتظار می‌تواند تا فرصت تلاش مجدد بعدی یا نوبت کاربر بعدی در صف بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian بازمی‌گردد. این از حالت نجات کانال پیام جداست و اختیار پیکربندی از راه دور نمی‌دهد.

  </Accordion>
  <Accordion title="مسیر سریع و میانبرهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط فرمان از فرستندگان حاضر در فهرست مجاز، بلافاصله پردازش می‌شوند (دور زدن صف + مدل).
    - **دروازه‌گذاری اشاره گروهی:** پیام‌های فقط فرمان از فرستندگان حاضر در فهرست مجاز، نیازمندی‌های اشاره را دور می‌زنند.
    - **میانبرهای درون‌خطی (فقط فرستندگان حاضر در فهرست مجاز):** برخی فرمان‌ها وقتی در یک پیام عادی جاسازی شوند نیز کار می‌کنند و پیش از اینکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه می‌یابد.
    - در حال حاضر: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط فرمان غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="فرمان‌های Skill و آرگومان‌های بومی">
    - **فرمان‌های Skill:** Skills از نوع `user-invocable` به‌صورت فرمان‌های اسلش ارائه می‌شوند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوند عددی می‌گیرند (مثلاً `_2`).
      - `/skill <name> [input]` یک Skill را با نام اجرا می‌کند (وقتی محدودیت‌های فرمان بومی مانع فرمان‌های جداگانه برای هر Skill می‌شوند مفید است).
      - به‌طور پیش‌فرض، فرمان‌های Skill به‌عنوان یک درخواست عادی به مدل فرستاده می‌شوند.
      - Skills می‌توانند به‌صورت اختیاری `command-dispatch: tool` را اعلام کنند تا فرمان مستقیماً به یک ابزار هدایت شود (قطعی، بدون مدل).
      - مثال: `/prose` (Plugin OpenProse) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های فرمان بومی:** Discord برای گزینه‌های پویا از تکمیل خودکار استفاده می‌کند (و وقتی آرگومان‌های الزامی را حذف کنید، منوهای دکمه‌ای نشان می‌دهد). Telegram و Slack وقتی فرمانی از انتخاب‌ها پشتیبانی کند و آرگومان را حذف کنید، یک منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا در برابر مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های ویژه مدل مانند سطح‌های `/think` از بازنویسی `/model` آن نشست پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه یک پرسش پیکربندی: **این عامل همین حالا در این مکالمه از چه چیزهایی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده و برای مرور سریع بهینه شده است.
- `/tools verbose` توضیحات کوتاه اضافه می‌کند.
- سطح‌های فرمان بومی که از آرگومان‌ها پشتیبانی می‌کنند همان تغییر حالت `compact|verbose` را ارائه می‌کنند.
- نتایج محدود به نشست هستند، بنابراین تغییر عامل، کانال، رشته، مجوز فرستنده، یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` ابزارهایی را شامل می‌شود که واقعاً در زمان اجرا قابل دسترسی هستند، از جمله ابزارهای هسته، ابزارهای Plugin متصل، و ابزارهای متعلق به کانال.

برای ویرایش پروفایل و بازنویسی، به‌جای اینکه با `/tools` مانند یک کاتالوگ ایستا رفتار کنید، از پنل Tools در رابط کاربری Control یا سطح‌های پیکربندی/کاتالوگ استفاده کنید.

## سطح‌های استفاده (چه چیزی کجا نمایش داده می‌شود)

- **استفاده/سهمیه ارائه‌دهنده** (مثال: «Claude 80% باقی‌مانده») وقتی ردیابی استفاده فعال باشد، در `/status` برای ارائه‌دهنده مدل فعلی نمایش داده می‌شود. OpenClaw پنجره‌های ارائه‌دهنده را به `% left` نرمال‌سازی می‌کند؛ برای MiniMax، فیلدهای درصدیِ فقط-باقی‌مانده پیش از نمایش معکوس می‌شوند، و پاسخ‌های `model_remains` ورودی مدل گفتگو به‌همراه برچسب طرحِ دارای تگ مدل را ترجیح می‌دهند.
- **خطوط توکن/کش** در `/status` می‌توانند وقتی نمای فوری جلسه زنده کم‌داده است، به آخرین ورودی استفاده در رونوشت برگردند. مقدارهای زنده غیرصفر موجود همچنان اولویت دارند، و جایگزینی از رونوشت همچنین می‌تواند برچسب مدل زمان اجرای فعال به‌همراه یک مجموع بزرگ‌ترِ متمرکز بر پرامپت را، وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند، بازیابی کند.
- **اجرا در برابر زمان اجرا:** `/status` برای مسیر sandbox مؤثر، `Execution` و برای اینکه چه کسی واقعا جلسه را اجرا می‌کند، `Runtime` را گزارش می‌کند: `OpenClaw Pi Default`، `OpenAI Codex`، یک پشتانه CLI، یا یک پشتانه ACP.
- **توکن/هزینه برای هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی افزوده می‌شود).
- `/model status` درباره **مدل‌ها/احراز هویت/نقاط پایانی** است، نه استفاده.

## انتخاب مدل (`/model`)

`/model` به‌صورت یک دستورالعمل پیاده‌سازی شده است.

مثال‌ها:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

نکته‌ها:

- `/model` و `/model list` یک انتخاب‌گر فشرده و شماره‌گذاری‌شده را نمایش می‌دهند (خانواده مدل + ارائه‌دهندگان موجود).
- در Discord، `/model` و `/models` یک انتخاب‌گر تعاملی با فهرست‌های کشویی ارائه‌دهنده و مدل، به‌همراه مرحله Submit باز می‌کنند.
- `/model <#>` از همان انتخاب‌گر انتخاب می‌کند (و در صورت امکان ارائه‌دهنده فعلی را ترجیح می‌دهد).
- `/model status` نمای دقیق را نمایش می‌دهد، از جمله نقطه پایانی ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) وقتی موجود باشد.

## بازنویسی‌های اشکال‌زدایی

`/debug` به شما اجازه می‌دهد بازنویسی‌های پیکربندی **فقط در زمان اجرا** را تنظیم کنید (در حافظه، نه دیسک). فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

مثال‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
بازنویسی‌ها بلافاصله روی خواندن‌های جدید پیکربندی اعمال می‌شوند، اما در `openclaw.json` نوشته **نمی‌شوند**. برای پاک‌کردن همه بازنویسی‌ها و بازگشت به پیکربندی روی دیسک، از `/debug reset` استفاده کنید.
</Note>

## خروجی ردیابی Plugin

`/trace` به شما اجازه می‌دهد **خطوط ردیابی/اشکال‌زدایی Plugin در محدوده جلسه** را بدون روشن‌کردن حالت کامل verbose تغییر دهید.

مثال‌ها:

```text
/trace
/trace on
/trace off
```

نکته‌ها:

- `/trace` بدون آرگومان، وضعیت ردیابی جلسه فعلی را نمایش می‌دهد.
- `/trace on` خطوط ردیابی Plugin را برای جلسه فعلی فعال می‌کند.
- `/trace off` دوباره آن‌ها را غیرفعال می‌کند.
- خطوط ردیابی Plugin می‌توانند در `/status` و به‌صورت یک پیام تشخیصی پیگیری پس از پاسخ عادی دستیار ظاهر شوند.
- `/trace` جایگزین `/debug` نمی‌شود؛ `/debug` همچنان بازنویسی‌های پیکربندی فقط در زمان اجرا را مدیریت می‌کند.
- `/trace` جایگزین `/verbose` نمی‌شود؛ خروجی عادی verbose برای ابزار/وضعیت همچنان متعلق به `/verbose` است.

## به‌روزرسانی‌های پیکربندی

`/config` در پیکربندی روی دیسک شما (`openclaw.json`) می‌نویسد. فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.config: true` فعال کنید.

مثال‌ها:

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

`/mcp` تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌نویسد. فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.mcp: true` فعال کنید.

مثال‌ها:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه تنظیمات پروژه متعلق به Pi. آداپتورهای زمان اجرا تصمیم می‌گیرند کدام انتقال‌ها واقعا قابل اجرا هستند.
</Note>

## به‌روزرسانی‌های Plugin

`/plugins` به اپراتورها اجازه می‌دهد Pluginهای کشف‌شده را بررسی کنند و فعال‌سازی را در پیکربندی تغییر دهند. جریان‌های فقط خواندنی می‌توانند از `/plugin` به‌عنوان نام مستعار استفاده کنند. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.plugins: true` فعال کنید.

مثال‌ها:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` و `/plugins show` از کشف واقعی Plugin در برابر فضای کاری فعلی به‌همراه پیکربندی روی دیسک استفاده می‌کنند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Pluginها را نصب یا حذف نمی‌کند.
- پس از تغییرات فعال/غیرفعال‌سازی، gateway را راه‌اندازی مجدد کنید تا اعمال شوند.

</Note>

## نکته‌های سطح

<AccordionGroup>
  <Accordion title="جلسه‌ها برای هر سطح">
    - **دستورهای متنی** در جلسه گفتگوی عادی اجرا می‌شوند (DMها `main` را به‌اشتراک می‌گذارند، گروه‌ها جلسه خودشان را دارند).
    - **دستورهای بومی** از جلسه‌های ایزوله استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (از طریق `CommandTargetSessionKey` جلسه گفتگو را هدف می‌گیرد)
    - **`/stop`** جلسه گفتگوی فعال را هدف می‌گیرد تا بتواند اجرای فعلی را متوقف کند.

  </Accordion>
  <Accordion title="جزئیات Slack">
    `channels.slack.slashCommand` همچنان برای یک دستور به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر دستور داخلی یک دستور اسلش Slack بسازید (با همان نام‌های `/help`). منوهای آرگومان دستور برای Slack به‌صورت دکمه‌های Block Kit موقتی ارائه می‌شوند.

    استثنای بومی Slack: `/agentstatus` را ثبت کنید (نه `/status`) چون Slack، `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع درباره جلسه فعلی است.

برخلاف گفتگوی عادی:

- از جلسه فعلی به‌عنوان زمینه پس‌زمینه استفاده می‌کند،
- به‌صورت یک فراخوان یک‌باره **بدون ابزار** و جداگانه اجرا می‌شود،
- زمینه جلسه‌های آینده را تغییر نمی‌دهد،
- در تاریخچه رونوشت نوشته نمی‌شود،
- به‌جای پیام عادی دستیار، به‌صورت نتیجه جانبی زنده تحویل داده می‌شود.

این ویژگی باعث می‌شود `/btw` وقتی به یک توضیح موقت نیاز دارید در حالی که کار اصلی ادامه دارد، مفید باشد.

مثال:

```text
/btw what are we doing right now?
```

برای رفتار کامل و جزئیات تجربه کاربری کلاینت، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## مرتبط

- [ایجاد Skills](/fa/tools/creating-skills)
- [Skills](/fa/tools/skills)
- [پیکربندی Skills](/fa/tools/skills-config)
