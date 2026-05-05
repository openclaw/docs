---
read_when:
    - استفاده یا پیکربندی فرمان‌های چت
    - اشکال‌زدایی مسیریابی دستور یا مجوزها
sidebarTitle: Slash commands
summary: 'دستورهای اسلش: متنی در برابر بومی، پیکربندی، و دستورهای پشتیبانی‌شده'
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-05-05T06:20:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

فرمان‌ها توسط Gateway پردازش می‌شوند. بیشتر فرمان‌ها باید به‌صورت یک پیام **مستقل** ارسال شوند که با `/` شروع می‌شود. فرمان گفت‌وگوی bash فقط برای میزبان از `! <cmd>` استفاده می‌کند (با `/bash <cmd>` به‌عنوان نام مستعار).

وقتی یک مکالمه یا رشته به یک نشست ACP متصل باشد، متن معمول پیگیری به همان مهار ACP هدایت می‌شود. فرمان‌های مدیریتی Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به کنترل‌کننده فرمان ACP در OpenClaw می‌رسد، و `/status` به‌همراه `/unfocus` هر زمان که پردازش فرمان برای آن سطح فعال باشد محلی می‌مانند.

دو سامانه مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="Commands">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="Directives">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - دایرکتیوها پیش از آنکه مدل آن را ببیند از پیام حذف می‌شوند.
    - در پیام‌های عادی گفت‌وگو (نه فقط دایرکتیو)، آن‌ها به‌عنوان «راهنمای درون‌خطی» در نظر گرفته می‌شوند و تنظیمات نشست را **ماندگار** نمی‌کنند.
    - در پیام‌های فقط دایرکتیو (پیامی که فقط شامل دایرکتیوهاست)، آن‌ها در نشست ماندگار می‌شوند و با تأیید پاسخ می‌دهند.
    - دایرکتیوها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، تنها فهرست مجاز استفاده‌شده همان است؛ در غیر این صورت مجوز از فهرست‌های مجاز/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. فرستندگان غیرمجاز دایرکتیوها را به‌صورت متن ساده می‌بینند.

  </Accordion>
  <Accordion title="Inline shortcuts">
    فقط فرستندگان در فهرست مجاز/مجاز: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

    آن‌ها بلافاصله اجرا می‌شوند، پیش از آنکه مدل پیام را ببیند حذف می‌شوند، و متن باقی‌مانده از جریان عادی ادامه پیدا می‌کند.

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
  تجزیه `/...` را در پیام‌های گفت‌وگو فعال می‌کند. روی سطح‌هایی که فرمان‌های بومی ندارند (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، فرمان‌های متنی حتی اگر این گزینه را روی `false` تنظیم کنید همچنان کار می‌کنند.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  فرمان‌های بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (تا زمانی که فرمان‌های slash را اضافه کنید)؛ برای ارائه‌دهندگانی که پشتیبانی بومی ندارند نادیده گرفته می‌شود. برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.native`، `channels.telegram.commands.native`، یا `channels.slack.commands.native` را تنظیم کنید (بولی یا `"auto"`). در Discord، مقدار `false` ثبت و پاک‌سازی فرمان‌های slash را هنگام راه‌اندازی رد می‌کند؛ فرمان‌هایی که قبلاً ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید همچنان قابل مشاهده بمانند. فرمان‌های Slack در برنامه Slack مدیریت می‌شوند و به‌صورت خودکار حذف نمی‌شوند.
</ParamField>
در Discord، مشخصات فرمان بومی می‌تواند شامل `descriptionLocalizations` باشد، که OpenClaw آن را به‌عنوان `description_localizations` در Discord منتشر می‌کند و در مقایسه‌های همسان‌سازی قرار می‌دهد.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  وقتی پشتیبانی شود، فرمان‌های **skill** را به‌صورت بومی ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack نیاز دارد برای هر skill یک فرمان slash بسازید). برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills`، یا `channels.slack.commands.nativeSkills` را تنظیم کنید (بولی یا `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` را برای اجرای فرمان‌های پوسته میزبان فعال می‌کند (`/bash <cmd>` یک نام مستعار است؛ به فهرست‌های مجاز `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash پیش از رفتن به حالت پس‌زمینه چه مدت منتظر بماند (`0` فوراً به پس‌زمینه می‌رود).
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
  `/restart` را به‌همراه کنش‌های ابزار بازراه‌اندازی Gateway فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک را برای سطح‌های فرمان/ابزار فقط مالک تنظیم می‌کند. این حساب اپراتور انسانی است که می‌تواند کنش‌های خطرناک را تأیید کند و فرمان‌هایی مانند `/diagnostics`، `/export-trajectory`، و `/config` را اجرا کند. این از `commands.allowFrom` و از دسترسی جفت‌سازی پیام مستقیم جداست.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  به‌ازای هر کانال: باعث می‌شود فرمان‌های فقط مالک برای اجرا روی آن سطح به **هویت مالک** نیاز داشته باشند. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک حل‌شده مطابقت داشته باشد (برای نمونه یک مدخل در `commands.ownerAllowFrom` یا فراداده مالک بومیِ ارائه‌دهنده) یا در یک کانال پیام داخلی، محدوده داخلی `operator.admin` را داشته باشد. یک مدخل wildcard در `allowFrom` کانال، یا فهرست نامزدهای مالک خالی/حل‌نشده، کافی **نیست**؛ فرمان‌های فقط مالک در آن کانال بسته می‌مانند. اگر می‌خواهید فرمان‌های فقط مالک فقط توسط `ownerAllowFrom` و فهرست‌های مجاز استاندارد فرمان محدود شوند، این گزینه را خاموش بگذارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در اعلان سیستم ظاهر شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  به‌صورت اختیاری راز HMAC مورد استفاده هنگام `commands.ownerDisplay="hash"` را تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز به‌ازای هر ارائه‌دهنده برای مجوزدهی فرمان. وقتی پیکربندی شود، تنها منبع مجوزدهی برای فرمان‌ها و دایرکتیوهاست (فهرست‌های مجاز/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). از `"*"` برای پیش‌فرض سراسری استفاده کنید؛ کلیدهای ویژه ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای فرمان‌ها اعمال می‌کند.
</ParamField>

## فهرست فرمان‌ها

منبع حقیقت فعلی:

- فرمان‌های داخلی هسته از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- فرمان‌های dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- فرمان‌های plugin از فراخوانی‌های `registerCommand()` در plugin می‌آیند
- دسترس‌پذیری واقعی روی Gateway شما همچنان به پرچم‌های پیکربندی، سطح کانال، و pluginهای نصب‌شده/فعال‌شده بستگی دارد

### فرمان‌های داخلی هسته

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` یک نشست جدید شروع می‌کند؛ `/reset` نام مستعار بازنشانی است.
    - Control UI مقدار تایپ‌شده `/new` را رهگیری می‌کند تا یک نشست تازه داشبورد بسازد و به آن جابه‌جا شود؛ مقدار تایپ‌شده `/reset` همچنان بازنشانی درجا را در Gateway اجرا می‌کند.
    - `/reset soft [message]` رونوشت فعلی را نگه می‌دارد، شناسه‌های نشست CLI backend استفاده‌مجددشده را کنار می‌گذارد، و بارگذاری راه‌اندازی/اعلان سیستم را درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` زمینه نشست را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را لغو می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال رشته را مدیریت می‌کنند.
    - `/export-session [path]` نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` درخواست تأیید exec می‌کند، سپس یک [بسته مسیر](/fa/tools/trajectory) JSONL را برای نشست فعلی صادر می‌کند. وقتی برای یک نشست OpenClaw به خط زمانی اعلان، ابزار، و رونوشت نیاز دارید از آن استفاده کنید. در گفت‌وگوهای گروهی، اعلان تأیید و نتیجه صدور به‌صورت خصوصی برای مالک ارسال می‌شود. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` سطح تفکر را تنظیم می‌کند. گزینه‌ها از پروفایل ارائه‌دهنده مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium`، و `high` هستند، و سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max`، یا دودویی `on` فقط جایی که پشتیبانی شود در دسترس‌اند. نام‌های مستعار: `/thinking`، `/t`.
    - `/verbose on|off|full` خروجی مفصل را تغییر می‌دهد. نام مستعار: `/v`.
    - `/trace on|off` خروجی ردیابی plugin را برای نشست فعلی تغییر می‌دهد.
    - `/fast [status|on|off]` حالت سریع را نشان می‌دهد یا تنظیم می‌کند.
    - `/reasoning [on|off|stream]` نمایش استدلال را تغییر می‌دهد. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را تغییر می‌دهد. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نشان می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نشان می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` ارائه‌دهندگان پیکربندی‌شده/دارای احراز هویت در دسترس یا مدل‌های یک ارائه‌دهنده را فهرست می‌کند؛ برای مرور کاتالوگ کامل آن ارائه‌دهنده `all` را اضافه کنید.
    - `/queue <mode>` رفتار صف را مدیریت می‌کند (`steer`، `queue` قدیمی، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی نشست را پاک می‌کند. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.
    - `/steer <message>` راهنمایی را به اجرای فعال برای نشست فعلی تزریق می‌کند، مستقل از حالت `/queue`. وقتی نشست بیکار باشد اجرای جدیدی شروع نمی‌کند. نام مستعار: `/tell`. [هدایت](/fa/tools/steer) را ببینید.

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` خلاصه کوتاه راهنما را نشان می‌دهد.
    - `/commands` کاتالوگ فرمان تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد عامل فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا، زمان کارکرد Gateway و سیستم، به‌همراه مصرف/سهمیه ارائه‌دهنده را وقتی در دسترس باشد نشان می‌دهد.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط مالک برای باگ‌های Gateway و اجراهای مهار Codex است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` درخواست تأیید صریح exec می‌کند؛ diagnostics را با یک قانون allow-all تأیید نکنید. پس از تأیید، گزارشی قابل چسباندن با مسیر بسته محلی، خلاصه manifest، یادداشت‌های حریم خصوصی، و شناسه‌های نشست مرتبط ارسال می‌کند. در گفت‌وگوهای گروهی، اعلان تأیید و گزارش به‌صورت خصوصی برای مالک ارسال می‌شوند. وقتی نشست فعال از مهار OpenAI Codex استفاده می‌کند، همان تأیید همچنین بازخورد مرتبط Codex را به سرورهای OpenAI ارسال می‌کند و پاسخ تکمیل‌شده شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و فرمان‌های `codex resume <thread-id>` را فهرست می‌کند. [صدور Diagnostics](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` راهیار راه‌اندازی و تعمیر Crestodian را از پیام مستقیم مالک اجرا می‌کند.
    - `/tasks` کارهای پس‌زمینه فعال/اخیر را برای نشست فعلی فهرست می‌کند.
    - `/context [list|detail|json]` توضیح می‌دهد زمینه چگونه مونتاژ می‌شود.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` پاورقی مصرف به‌ازای هر پاسخ را کنترل می‌کند یا خلاصه هزینه محلی را چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` یک skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` مدخل‌های فهرست مجاز را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` اعلان‌های تأیید exec را حل می‌کند.
    - `/btw <question>` یک پرسش جانبی می‌پرسد بدون اینکه زمینه آینده نشست را تغییر دهد. نام مستعار: `/side`. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="زیروعامل‌ها و ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجراهای زیروعامل را برای نشست فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند.
    - `/focus <target>` رشته فعلی Discord یا موضوع/گفت‌وگوی Telegram را به یک هدف نشست متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` عامل‌های وابسته به رشته را برای نشست فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک زیروعامل در حال اجرا یا همه آن‌ها را متوقف می‌کند.
    - `/subagents steer <id|#> <message>` هدایت را به یک زیروعامل در حال اجرا می‌فرستد. [هدایت](/fa/tools/steer) را ببینید.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت plugin را بررسی یا تغییر می‌دهد. `/plugin` یک نام مستعار است. نوشتن فقط برای مالک است. به `commands.plugins: true` نیاز دارد.
    - `/debug show|set|unset|reset` بازنویسی‌های پیکربندی فقط زمان اجرا را مدیریت می‌کند. فقط مالک. به `commands.debug: true` نیاز دارد.
    - `/restart` وقتی فعال باشد OpenClaw را بازراه‌اندازی می‌کند. پیش‌فرض: فعال؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/send on|off|inherit` سیاست ارسال را تنظیم می‌کند. فقط مالک.

  </Accordion>
  <Accordion title="صدا، TTS، کنترل کانال">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` TTS را کنترل می‌کند. [TTS](/fa/tools/tts) را ببینید.
    - `/activation mention|always` حالت فعال‌سازی گروه را تنظیم می‌کند.
    - `/bash <command>` یک فرمان پوسته میزبان را اجرا می‌کند. فقط متنی. نام مستعار: `! <command>`. به `commands.bash: true` به‌همراه allowlistهای `tools.elevated` نیاز دارد.
    - `!poll [sessionId]` یک کار bash پس‌زمینه را بررسی می‌کند.
    - `!stop [sessionId]` یک کار bash پس‌زمینه را متوقف می‌کند.

  </Accordion>
</AccordionGroup>

### فرمان‌های dock تولیدشده

فرمان‌های dock مسیر پاسخ نشست فعلی را به کانال پیوندخورده دیگری تغییر می‌دهند. برای راه‌اندازی،
نمونه‌ها و عیب‌یابی، [dock کردن کانال](/fa/concepts/channel-docking) را ببینید.

فرمان‌های dock از pluginهای کانال با پشتیبانی از فرمان بومی تولید می‌شوند. مجموعه همراه فعلی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از فرمان‌های dock در یک گفت‌وگوی مستقیم استفاده کنید تا مسیر پاسخ نشست فعلی را به کانال پیوندخورده دیگری تغییر دهید. عامل همان زمینه نشست را نگه می‌دارد، اما پاسخ‌های بعدی برای آن نشست به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

فرمان‌های dock به `session.identityLinks` نیاز دارند. فرستنده مبدأ و همتای مقصد باید در یک گروه هویتی باشند، برای مثال `["telegram:123", "discord:456"]`. اگر کاربر Telegram با شناسه `123` فرمان `/dock_discord` را بفرستد، OpenClaw مقدار `lastChannel: "discord"` و `lastTo: "456"` را روی نشست فعال ذخیره می‌کند. اگر فرستنده به همتای Discord پیوند نشده باشد، فرمان به‌جای افتادن به گفت‌وگوی عادی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

dock کردن فقط مسیر نشست فعال را تغییر می‌دهد. حساب‌های کانال ایجاد نمی‌کند، دسترسی اعطا نمی‌کند، allowlistهای کانال را دور نمی‌زند، یا تاریخچه رونوشت را به نشست دیگری منتقل نمی‌کند. برای تغییر دوباره مسیر از `/dock-telegram`، `/dock-slack`، `/dock-mattermost`، یا فرمان dock تولیدشده دیگری استفاده کنید.

### فرمان‌های plugin همراه

Pluginهای همراه می‌توانند فرمان‌های اسلش بیشتری اضافه کنند. فرمان‌های همراه فعلی در این مخزن:

- `/dreaming [on|off|status|help]` Dreaming حافظه را روشن/خاموش می‌کند. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [جفت‌سازی](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` فرمان‌های پرخطر گره تلفن را به‌طور موقت مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام فرمان بومی `/talkvoice` است.
- `/card ...` پیش‌تنظیم‌های کارت غنی LINE را می‌فرستد. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` harness سرور برنامه Codex همراه را بررسی و کنترل می‌کند. [harness کدکس](/fa/plugins/codex-harness) را ببینید.
- فرمان‌های مخصوص QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### فرمان‌های پویای Skills

Skills قابل‌فراخوانی توسط کاربر نیز به‌صورت فرمان‌های اسلش در دسترس‌اند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills همچنین ممکن است وقتی skill/plugin آن‌ها را ثبت می‌کند، به‌صورت فرمان‌های مستقیم مانند `/prose` ظاهر شوند.
- ثبت فرمان skill بومی با `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- مشخصات فرمان می‌توانند برای سطوح بومی که از توضیحات بومی‌سازی‌شده پشتیبانی می‌کنند، از جمله Discord، `descriptionLocalizations` ارائه کنند.

<AccordionGroup>
  <Accordion title="نکات آرگومان و تجزیه‌گر">
    - فرمان‌ها یک `:` اختیاری بین فرمان و آرگومان‌ها می‌پذیرند (مثلاً `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام ارائه‌دهنده (تطبیق فازی) را می‌پذیرد؛ اگر تطبیقی نباشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل استفاده از ارائه‌دهنده، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و `configWrites` کانال را رعایت می‌کند.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدف‌گذاری‌شده به پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز `configWrites` حساب هدف را رعایت می‌کنند.
    - `/usage` پانوشت استفاده برای هر پاسخ را کنترل می‌کند؛ `/usage cost` خلاصه هزینه محلی را از گزارش‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌طور پیش‌فرض فعال است؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات plugin را می‌پذیرد که `openclaw plugins install` می‌پذیرد: مسیر/آرشیو محلی، بسته npm، `git:<repo>`، یا `clawhub:<pkg>`، سپس چون ماژول‌های منبع plugin تغییر کرده‌اند، درخواست بازراه‌اندازی Gateway می‌کند.
    - `/plugins enable|disable` پیکربندی plugin را به‌روزرسانی می‌کند و برای نوبت‌های جدید عامل، بارگذاری مجدد plugin در Gateway را فعال می‌کند.

  </Accordion>
  <Accordion title="رفتار ویژه کانال">
    - فرمان بومی مخصوص Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال voice/stage انتخاب‌شده نیاز دارد. به `channels.discord.voice` و فرمان‌های بومی نیاز دارد.
    - فرمان‌های اتصال رشته در Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های مؤثر رشته فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع فرمان ACP و رفتار زمان اجرا: [عامل‌های ACP](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی verbose / trace / fast / reasoning">
    - `/verbose` برای اشکال‌زدایی و دیدپذیری بیشتر است؛ در استفاده عادی آن را **خاموش** نگه دارید.
    - `/trace` محدودتر از `/verbose` است: فقط خط‌های trace/debug متعلق به plugin را آشکار می‌کند و پرگویی عادی ابزارها را خاموش نگه می‌دارد.
    - `/fast on|off` یک بازنویسی نشست را ماندگار می‌کند. برای پاک کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینه `inherit` در رابط کاربری Sessions استفاده کنید.
    - `/fast` مخصوص ارائه‌دهنده است: OpenAI/OpenAI Codex آن را در نقاط پایانی بومی Responses به `service_tier=priority` نگاشت می‌کنند، در حالی که درخواست‌های عمومی مستقیم Anthropic، از جمله ترافیک احرازشده با OAuth که به `api.anthropic.com` فرستاده می‌شود، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های شکست ابزار همچنان در صورت مرتبط بودن نمایش داده می‌شوند، اما متن تفصیلی شکست فقط وقتی گنجانده می‌شود که `/verbose` برابر `on` یا `full` باشد.
    - `/reasoning`، `/verbose`، و `/trace` در محیط‌های گروهی پرخطر هستند: ممکن است reasoning داخلی، خروجی ابزار، یا تشخیص‌های plugin را که قصد آشکار کردنشان را نداشتید، آشکار کنند. بهتر است آن‌ها را خاموش بگذارید، به‌ویژه در گفت‌وگوهای گروهی.

  </Accordion>
  <Accordion title="تغییر مدل">
    - `/model` مدل نشست جدید را فوراً ماندگار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی بلافاصله از آن استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw یک تغییر زنده را به‌عنوان در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش دوباره تمیز با مدل جدید بازراه‌اندازی می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت تلاش دوباره بعدی یا نوبت بعدی کاربر در صف بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian برمی‌گردد. این از حالت نجات کانال پیام جداست و اختیار پیکربندی راه‌دور اعطا نمی‌کند.

  </Accordion>
  <Accordion title="مسیر سریع و میانبرهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط فرمان از فرستنده‌های allowlistشده بلافاصله پردازش می‌شوند (دور زدن صف + مدل).
    - **دروازه‌گذاری اشاره گروهی:** پیام‌های فقط فرمان از فرستنده‌های allowlistشده نیازمندی‌های اشاره را دور می‌زنند.
    - **میانبرهای درون‌خطی (فقط فرستنده‌های allowlistشده):** بعضی فرمان‌ها وقتی در یک پیام عادی جاسازی شده باشند هم کار می‌کنند و پیش از اینکه مدل متن باقی‌مانده را ببیند، حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه می‌یابد.
    - در حال حاضر: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط فرمان غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="فرمان‌های Skills و آرگومان‌های بومی">
    - **فرمان‌های Skills:** Skillsهای `user-invocable` به‌صورت فرمان‌های اسلش در دسترس قرار می‌گیرند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوندهای عددی می‌گیرند (مثلاً `_2`).
      - `/skill <name> [input]` یک skill را با نام اجرا می‌کند (وقتی محدودیت‌های فرمان بومی مانع فرمان‌های جداگانه برای هر skill می‌شوند مفید است).
      - به‌طور پیش‌فرض، فرمان‌های skill به‌عنوان یک درخواست عادی به مدل ارسال می‌شوند.
      - Skills می‌توانند به‌صورت اختیاری `command-dispatch: tool` را اعلام کنند تا فرمان مستقیماً به یک ابزار مسیریابی شود (قطعی، بدون مدل).
      - مثال: `/prose` (plugin OpenProse) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های فرمان بومی:** Discord برای گزینه‌های پویا از تکمیل خودکار استفاده می‌کند (و وقتی آرگومان‌های الزامی را حذف کنید، از منوهای دکمه‌ای). Telegram و Slack وقتی فرمانی از گزینه‌ها پشتیبانی کند و آرگومان را حذف کنید، یک منوی دکمه‌ای نشان می‌دهند. گزینه‌های پویا بر اساس مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های مخصوص مدل مانند سطح‌های `/think` از بازنویسی `/model` همان نشست پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه یک پرسش پیکربندی: **این عامل همین حالا در این گفت‌وگو از چه چیزهایی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده و برای مرور سریع بهینه شده است.
- `/tools verbose` توضیحات کوتاه اضافه می‌کند.
- سطوح فرمان بومی که از آرگومان‌ها پشتیبانی می‌کنند، همان تغییر حالت `compact|verbose` را در دسترس می‌گذارند.
- نتایج محدود به نشست هستند، بنابراین تغییر عامل، کانال، رشته، مجوز فرستنده، یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` شامل ابزارهایی است که واقعاً در زمان اجرا قابل دسترسی هستند، از جمله ابزارهای هسته، ابزارهای plugin متصل، و ابزارهای متعلق به کانال.

برای ویرایش پروفایل و بازنویسی‌ها، به‌جای اینکه `/tools` را یک کاتالوگ ایستا در نظر بگیرید، از پنل Tools در Control UI یا سطوح پیکربندی/کاتالوگ استفاده کنید.

## سطوح استفاده (چه چیزی کجا نمایش داده می‌شود)

- **مصرف/سهمیهٔ ارائه‌دهنده** (مثال: «Claude 80٪ باقی‌مانده») وقتی رهگیری مصرف فعال باشد، برای ارائه‌دهندهٔ مدل فعلی در `/status` نمایش داده می‌شود. OpenClaw پنجره‌های ارائه‌دهنده را به `% left` نرمال‌سازی می‌کند؛ برای MiniMax، فیلدهای درصدی فقط-باقی‌مانده قبل از نمایش وارونه می‌شوند، و پاسخ‌های `model_remains` ورودی مدل چت را همراه با برچسب طرح دارای تگ مدل ترجیح می‌دهند.
- **خط‌های توکن/کش** در `/status` وقتی نمای لحظه‌ای نشست زنده کم‌جزئیات باشد، می‌توانند به تازه‌ترین ورودی مصرف رونوشت برگردند. مقدارهای زندهٔ غیرصفر موجود همچنان اولویت دارند، و جایگزین رونوشت همچنین می‌تواند برچسب مدل زمان اجرای فعال را به‌همراه مجموعی بزرگ‌تر و متمرکز بر پرامپت، وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند، بازیابی کند.
- **اجرا در برابر زمان اجرا:** `/status` مقدار `Execution` را برای مسیر مؤثر sandbox و مقدار `Runtime` را برای اینکه چه چیزی واقعا نشست را اجرا می‌کند گزارش می‌دهد: `OpenClaw Pi Default`، `OpenAI Codex`، یک پشتانهٔ CLI، یا یک پشتانهٔ ACP.
- **توکن/هزینهٔ هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی افزوده می‌شود).
- `/model status` دربارهٔ **مدل‌ها/احراز هویت/نقاط پایانی** است، نه مصرف.

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

یادداشت‌ها:

- `/model` و `/model list` یک انتخاب‌گر فشرده و شماره‌دار نشان می‌دهند (خانوادهٔ مدل + ارائه‌دهندگان موجود).
- در Discord، `/model` و `/models` یک انتخاب‌گر تعاملی با فهرست‌های کشویی ارائه‌دهنده و مدل، به‌همراه مرحلهٔ ارسال، باز می‌کنند.
- `/model <#>` از همان انتخاب‌گر انتخاب می‌کند (و در صورت امکان ارائه‌دهندهٔ فعلی را ترجیح می‌دهد).
- `/model status` نمای جزئیات را نشان می‌دهد، شامل نقطهٔ پایانی پیکربندی‌شدهٔ ارائه‌دهنده (`baseUrl`) و حالت API (`api`) وقتی موجود باشد.

## بازنویسی‌های اشکال‌زدایی

`/debug` به شما اجازه می‌دهد بازنویسی‌های پیکربندی **فقط در زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک). فقط مالک. به‌طور پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

مثال‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
بازنویسی‌ها بلافاصله روی خواندن‌های جدید پیکربندی اعمال می‌شوند، اما در `openclaw.json` نوشته **نمی‌شوند**. برای پاک‌کردن همهٔ بازنویسی‌ها و بازگشت به پیکربندی روی دیسک از `/debug reset` استفاده کنید.
</Note>

## خروجی ردگیری Plugin

`/trace` به شما اجازه می‌دهد **خط‌های ردگیری/اشکال‌زدایی Plugin در محدودهٔ نشست** را بدون روشن‌کردن حالت کامل verbose تغییر دهید.

مثال‌ها:

```text
/trace
/trace on
/trace off
```

یادداشت‌ها:

- `/trace` بدون آرگومان، وضعیت ردگیری نشست فعلی را نشان می‌دهد.
- `/trace on` خط‌های ردگیری Plugin را برای نشست فعلی فعال می‌کند.
- `/trace off` دوباره آن‌ها را غیرفعال می‌کند.
- خط‌های ردگیری Plugin می‌توانند در `/status` و به‌صورت پیام تشخیصی پیگیری پس از پاسخ عادی دستیار ظاهر شوند.
- `/trace` جایگزین `/debug` نیست؛ `/debug` همچنان بازنویسی‌های پیکربندی فقط در زمان اجرا را مدیریت می‌کند.
- `/trace` جایگزین `/verbose` نیست؛ خروجی عادی verbose برای ابزار/وضعیت همچنان مربوط به `/verbose` است.

## به‌روزرسانی‌های پیکربندی

`/config` در پیکربندی روی دیسک شما (`openclaw.json`) می‌نویسد. فقط مالک. به‌طور پیش‌فرض غیرفعال است؛ با `commands.config: true` فعال کنید.

مثال‌ها:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
پیکربندی پیش از نوشتن اعتبارسنجی می‌شود؛ تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config` پس از راه‌اندازی دوباره نیز باقی می‌مانند.
</Note>

## به‌روزرسانی‌های MCP

`/mcp` تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌نویسد. فقط مالک. به‌طور پیش‌فرض غیرفعال است؛ با `commands.mcp: true` فعال کنید.

مثال‌ها:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه تنظیمات پروژهٔ متعلق به Pi. آداپتورهای زمان اجرا تصمیم می‌گیرند کدام انتقال‌ها واقعا قابل اجرا هستند.
</Note>

## به‌روزرسانی‌های Plugin

`/plugins` به اپراتورها اجازه می‌دهد Pluginهای کشف‌شده را بررسی کنند و فعال‌سازی را در پیکربندی تغییر دهند. جریان‌های فقط‌خواندنی می‌توانند از `/plugin` به‌عنوان نام مستعار استفاده کنند. به‌طور پیش‌فرض غیرفعال است؛ با `commands.plugins: true` فعال کنید.

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
- `/plugins install` از ClawHub، npm، git، دایرکتوری‌های محلی، و آرشیوها نصب می‌کند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Pluginها را نصب یا حذف نصب نمی‌کند.
- تغییرات فعال‌سازی و غیرفعال‌سازی، سطوح زمان اجرای Plugin در Gateway را برای نوبت‌های جدید عامل hot-reload می‌کنند؛ نصب درخواست راه‌اندازی دوبارهٔ Gateway می‌دهد، چون ماژول‌های منبع Plugin تغییر کرده‌اند.

</Note>

## یادداشت‌های سطح

<AccordionGroup>
  <Accordion title="نشست‌ها برای هر سطح">
    - **فرمان‌های متنی** در نشست عادی چت اجرا می‌شوند (پیام‌های خصوصی `main` را به‌اشتراک می‌گذارند، گروه‌ها نشست خودشان را دارند).
    - **فرمان‌های بومی** از نشست‌های ایزوله استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (از طریق `CommandTargetSessionKey` نشست چت را هدف می‌گیرد)
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا بتواند اجرای فعلی را متوقف کند.

  </Accordion>
  <Accordion title="جزئیات Slack">
    `channels.slack.slashCommand` همچنان برای یک فرمان واحد به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر فرمان داخلی یک فرمان slash در Slack بسازید (همان نام‌های `/help`). منوهای آرگومان فرمان برای Slack به‌صورت دکمه‌های موقت Block Kit تحویل داده می‌شوند.

    استثنای بومی Slack: `/agentstatus` را ثبت کنید (نه `/status`)، چون Slack مقدار `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع دربارهٔ نشست فعلی است. `/side` نام مستعار آن است.

برخلاف چت عادی:

- از نشست فعلی به‌عنوان زمینهٔ پس‌زمینه استفاده می‌کند،
- به‌صورت یک فراخوانی یک‌بارهٔ جداگانه و **بدون ابزار** اجرا می‌شود،
- زمینهٔ نشست‌های آینده را تغییر نمی‌دهد،
- در تاریخچهٔ رونوشت نوشته نمی‌شود،
- به‌جای پیام عادی دستیار، به‌صورت نتیجهٔ جانبی زنده تحویل داده می‌شود.

این باعث می‌شود `/btw` زمانی مفید باشد که توضیحی موقت می‌خواهید، در حالی که کار اصلی ادامه دارد.

مثال:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

برای رفتار کامل و جزئیات تجربهٔ کاربری کلاینت، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## مرتبط

- [ایجاد Skills](/fa/tools/creating-skills)
- [Skills](/fa/tools/skills)
- [پیکربندی Skills](/fa/tools/skills-config)
