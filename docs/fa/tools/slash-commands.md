---
read_when:
    - استفاده از فرمان‌های چت یا پیکربندی آن‌ها
    - اشکال‌زدایی مسیریابی فرمان یا مجوزها
sidebarTitle: Slash commands
summary: 'دستورهای اسلش: متن در برابر بومی، پیکربندی و دستورهای پشتیبانی‌شده'
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-05-11T20:46:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

دستورات توسط Gateway مدیریت می‌شوند. بیشتر دستورات باید به‌صورت یک پیام **مستقل** ارسال شوند که با `/` شروع می‌شود. دستور چت bash فقط برای میزبان از `! <cmd>` استفاده می‌کند (`/bash <cmd>` نیز به‌عنوان نام مستعار آن است).

وقتی یک مکالمه یا رشته به یک نشست ACP متصل باشد، متن‌های پیگیری عادی به همان مهار ACP هدایت می‌شوند. دستورات مدیریت Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به مدیر دستور ACP در OpenClaw می‌رسد، و `/status` به‌همراه `/unfocus` هر زمان که مدیریت دستور برای سطح فعال باشد، محلی می‌مانند.

دو سامانه مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="دستورات">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="رهنمودها">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - رهنمودها پیش از آنکه مدل پیام را ببیند از پیام حذف می‌شوند.
    - در پیام‌های چت عادی (نه پیام‌هایی که فقط رهنمود دارند)، آن‌ها به‌عنوان «نکات درون‌خطی» در نظر گرفته می‌شوند و تنظیمات نشست را پایدار نمی‌کنند.
    - در پیام‌هایی که فقط رهنمود دارند (پیام فقط شامل رهنمودها است)، آن‌ها در نشست پایدار می‌شوند و با یک تأیید پاسخ می‌دهند.
    - رهنمودها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، تنها فهرست مجاز مورد استفاده همان است؛ در غیر این صورت مجوز از فهرست‌های مجاز/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. فرستندگان غیرمجاز رهنمودها را به‌صورت متن ساده می‌بینند.

  </Accordion>
  <Accordion title="میان‌برهای درون‌خطی">
    فقط فرستندگان در فهرست مجاز/مجازشده: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  پردازش `/...` را در پیام‌های چت فعال می‌کند. روی سطح‌هایی که دستورات بومی ندارند (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، دستورات متنی حتی اگر این گزینه را روی `false` بگذارید همچنان کار می‌کنند.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  دستورات بومی را ثبت می‌کند. حالت خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (تا زمانی که فرمان‌های اسلش را اضافه کنید)؛ برای ارائه‌دهندگانی که پشتیبانی بومی ندارند نادیده گرفته می‌شود. برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.native`، `channels.telegram.commands.native`، یا `channels.slack.commands.native` را تنظیم کنید (بولی یا `"auto"`). در Discord، مقدار `false` ثبت و پاک‌سازی فرمان اسلش را هنگام راه‌اندازی رد می‌کند؛ دستوراتی که قبلاً ثبت شده‌اند ممکن است تا وقتی آن‌ها را از برنامه Discord حذف کنید همچنان قابل مشاهده بمانند. دستورات Slack در برنامه Slack مدیریت می‌شوند و به‌طور خودکار حذف نمی‌شوند.
</ParamField>
در Discord، مشخصات دستور بومی ممکن است شامل `descriptionLocalizations` باشد که OpenClaw آن را به‌عنوان `description_localizations` در Discord منتشر می‌کند و در مقایسه‌های سازگارسازی قرار می‌دهد.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  دستورات **skill** را، وقتی پشتیبانی شوند، به‌صورت بومی ثبت می‌کند. حالت خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack نیاز دارد برای هر skill یک فرمان اسلش ایجاد شود). برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills`، یا `channels.slack.commands.nativeSkills` را تنظیم کنید (بولی یا `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` را برای اجرای دستورات پوسته میزبان فعال می‌کند (`/bash <cmd>` یک نام مستعار است؛ به فهرست‌های مجاز `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash چه مدت منتظر بماند پیش از آنکه به حالت پس‌زمینه برود (`0` بلافاصله آن را پس‌زمینه می‌کند).
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
  `/restart` را به‌همراه کنش‌های ابزار راه‌اندازی مجدد Gateway فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک را برای سطح‌های دستور/ابزار فقط مالک تنظیم می‌کند. این همان حساب اپراتور انسانی است که می‌تواند کنش‌های خطرناک را تأیید کند و دستورهایی مانند `/diagnostics`، `/export-trajectory`، و `/config` را اجرا کند. این گزینه از `commands.allowFrom` و از دسترسی جفت‌سازی پیام خصوصی جدا است.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  به‌ازای هر کانال: باعث می‌شود دستورات فقط مالک برای اجرا روی آن سطح به **هویت مالک** نیاز داشته باشند. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک resolve‌شده مطابقت داشته باشد (برای مثال ورودی‌ای در `commands.ownerAllowFrom` یا فراداده مالک بومی ارائه‌دهنده) یا روی یک کانال پیام داخلی محدوده داخلی `operator.admin` داشته باشد. یک ورودی wildcard در `allowFrom` کانال، یا یک فهرست نامزد مالک خالی/resolveنشده، **کافی نیست** — دستورات فقط مالک روی آن کانال fail closed می‌شوند. اگر می‌خواهید دستورات فقط مالک فقط با `ownerAllowFrom` و فهرست‌های مجاز استاندارد دستور کنترل شوند، این گزینه را خاموش بگذارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در system prompt ظاهر شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  به‌صورت اختیاری secret مربوط به HMAC را که هنگام `commands.ownerDisplay="hash"` استفاده می‌شود تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز به‌ازای هر ارائه‌دهنده برای مجوزدهی دستور. وقتی پیکربندی شود، تنها منبع مجوزدهی برای دستورات و رهنمودها است (فهرست‌های مجاز/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). برای پیش‌فرض سراسری از `"*"` استفاده کنید؛ کلیدهای ویژه ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای دستورات اعمال می‌کند.
</ParamField>

## فهرست دستورات

منبع حقیقت فعلی:

- موارد داخلی هسته از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- دستورات dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- دستورات Plugin از فراخوانی‌های `registerCommand()` در Plugin می‌آیند
- دسترس‌پذیری واقعی روی Gateway شما همچنان به پرچم‌های پیکربندی، سطح کانال، و Pluginهای نصب‌شده/فعال بستگی دارد

### دستورات داخلی هسته

<AccordionGroup>
  <Accordion title="نشست‌ها و اجراها">
    - `/new [model]` یک نشست جدید آغاز می‌کند؛ `/reset` نام مستعار بازنشانی است.
    - رابط کاربری کنترل، `/new` تایپ‌شده را برای ایجاد و جابه‌جایی به یک نشست تازه داشبورد می‌گیرد، مگر وقتی `session.dmScope: "main"` پیکربندی شده باشد و والد فعلی نشست اصلی عامل باشد؛ در این حالت `/new` نشست اصلی را در همان‌جا بازنشانی می‌کند. `/reset` تایپ‌شده همچنان بازنشانی درجا توسط Gateway را اجرا می‌کند.
    - `/reset soft [message]` رونوشت فعلی را نگه می‌دارد، شناسه‌های نشست backend CLI استفاده‌مجددشده را حذف می‌کند، و بارگذاری راه‌اندازی/system-prompt را درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` زمینه نشست را compact می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را لغو می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال رشته را مدیریت می‌کنند.
    - `/export-session [path]` نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` تأیید exec را درخواست می‌کند، سپس یک [بسته trajectory](/fa/tools/trajectory) JSONL برای نشست فعلی صادر می‌کند. وقتی برای یک نشست OpenClaw به prompt، ابزار، و timeline رونوشت نیاز دارید از آن استفاده کنید. در چت‌های گروهی، prompt تأیید و نتیجه صدور به‌صورت خصوصی برای مالک ارسال می‌شود. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="کنترل‌های مدل و اجرا">
    - `/think <level|default>` سطح thinking را تنظیم می‌کند یا بازنویسی نشست را پاک می‌کند. گزینه‌ها از نمایه ارائه‌دهنده مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium`، و `high` هستند، و سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max`، یا مقدار دودویی `on` فقط در جاهایی که پشتیبانی شوند وجود دارند. نام‌های مستعار: `/thinking`، `/t`.
    - `/verbose on|off|full` خروجی verbose را روشن یا خاموش می‌کند. نام مستعار: `/v`.
    - `/trace on|off` خروجی trace مربوط به Plugin را برای نشست فعلی روشن یا خاموش می‌کند.
    - `/fast [status|on|off|default]` حالت fast را نمایش می‌دهد، تنظیم می‌کند، یا پاک می‌کند.
    - `/reasoning [on|off|stream]` نمایش reasoning را روشن یا خاموش می‌کند. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را روشن یا خاموش می‌کند. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نمایش می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نمایش می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` ارائه‌دهندگان پیکربندی‌شده/دارای احراز هویت در دسترس یا مدل‌های یک ارائه‌دهنده را فهرست می‌کند؛ برای مرور کاتالوگ کامل آن ارائه‌دهنده، `all` را اضافه کنید. ورودی‌های `provider/*` در `agents.defaults.models` باعث می‌شوند `/model` و `/models` فقط مدل‌های کشف‌شده برای همان ارائه‌دهندگان را نشان دهند.
    - `/queue <mode>` رفتار queue را مدیریت می‌کند (`steer`، `queue` قدیمی، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی نشست را پاک می‌کند. [صف دستور](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.
    - `/steer <message>` راهنمایی را به اجرای فعال برای نشست فعلی تزریق می‌کند، مستقل از حالت `/queue`. وقتی نشست idle باشد اجرای جدیدی شروع نمی‌کند. نام مستعار: `/tell`. [Steer](/fa/tools/steer) را ببینید.

  </Accordion>
  <Accordion title="کشف و وضعیت">
    - `/help` خلاصه کوتاه راهنما را نشان می‌دهد.
    - `/commands` کاتالوگ دستور تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد عامل فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا، uptime مربوط به Gateway و سیستم، به‌همراه میزان استفاده/quota ارائه‌دهنده را وقتی در دسترس باشد نشان می‌دهد.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط مالک برای باگ‌های Gateway و اجراهای مهار Codex است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` تأیید صریح exec درخواست می‌کند؛ diagnostics را با قاعده allow-all تأیید نکنید. پس از تأیید، گزارشی قابل paste با مسیر بسته محلی، خلاصه manifest، نکات حریم خصوصی، و شناسه‌های نشست مرتبط می‌فرستد. در چت‌های گروهی، prompt تأیید و گزارش به‌صورت خصوصی برای مالک ارسال می‌شوند. وقتی نشست فعال از مهار OpenAI Codex استفاده می‌کند، همان تأیید همچنین بازخورد مرتبط Codex را به سرورهای OpenAI می‌فرستد و پاسخ کامل‌شده شناسه‌های نشست OpenClaw، شناسه‌های thread در Codex، و دستورات `codex resume <thread-id>` را فهرست می‌کند. [صدور Diagnostics](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` راه‌انداز و ابزار کمکی تعمیر Crestodian را از یک پیام خصوصی مالک اجرا می‌کند.
    - `/tasks` وظایف پس‌زمینه فعال/اخیر را برای نشست فعلی فهرست می‌کند.
    - `/context [list|detail|map|json]` توضیح می‌دهد context چگونه مونتاژ می‌شود. `map` یک تصویر treemap از context نشست فعلی ارسال می‌کند.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` footer مربوط به usage در هر پاسخ را کنترل می‌کند یا یک خلاصه هزینه محلی چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills، فهرست‌های مجاز، تأییدها">
    - `/skill <name> [input]` یک skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` ورودی‌های فهرست مجاز را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` درخواست‌های تأیید اجرا را حل می‌کند.
    - `/btw <question>` یک پرسش جانبی می‌پرسد بدون اینکه زمینهٔ آیندهٔ نشست را تغییر دهد. نام مستعار: `/side`. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="زیرعامل‌ها و ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجراهای زیرعامل را برای نشست فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند.
    - `/focus <target>` رشتهٔ فعلی Discord یا موضوع/گفت‌وگوی Telegram را به یک هدف نشست متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` عامل‌های متصل به رشته را برای نشست فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک یا همهٔ زیرعامل‌های در حال اجرا را متوقف می‌کند.
    - `/subagents steer <id|#> <message>` پیام هدایت را به یک زیرعامل در حال اجرا می‌فرستد. [Steer](/fa/tools/steer) را ببینید.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت Plugin را بررسی یا تغییر می‌دهد. `/plugin` یک نام مستعار است. نوشتن فقط برای مالک. به `commands.plugins: true` نیاز دارد.
    - `/debug show|set|unset|reset` بازنویسی‌های پیکربندی فقط زمان اجرا را مدیریت می‌کند. فقط مالک. به `commands.debug: true` نیاز دارد.
    - `/restart` وقتی فعال باشد OpenClaw را دوباره راه‌اندازی می‌کند. پیش‌فرض: فعال؛ برای غیرفعال‌کردن آن `commands.restart: false` را تنظیم کنید.
    - `/send on|off|inherit` سیاست ارسال را تنظیم می‌کند. فقط مالک.

  </Accordion>
  <Accordion title="صدا، TTS، کنترل کانال">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help`، TTS را کنترل می‌کند. [TTS](/fa/tools/tts) را ببینید.
    - `/activation mention|always` حالت فعال‌سازی گروهی را تنظیم می‌کند.
    - `/bash <command>` یک فرمان پوستهٔ میزبان را اجرا می‌کند. فقط متنی. نام مستعار: `! <command>`. به `commands.bash: true` به‌همراه فهرست‌های مجاز `tools.elevated` نیاز دارد.
    - `!poll [sessionId]` یک کار پس‌زمینهٔ bash را بررسی می‌کند.
    - `!stop [sessionId]` یک کار پس‌زمینهٔ bash را متوقف می‌کند.

  </Accordion>
</AccordionGroup>

### فرمان‌های dock تولیدشده

فرمان‌های dock مسیر پاسخ نشست فعلی را به کانال پیوندخوردهٔ دیگری تغییر می‌دهند. برای راه‌اندازی، مثال‌ها و عیب‌یابی، [Channel docking](/fa/concepts/channel-docking) را ببینید.

فرمان‌های dock از Pluginهای کانال با پشتیبانی فرمان بومی تولید می‌شوند. مجموعهٔ همراه فعلی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از فرمان‌های dock در یک گفت‌وگوی مستقیم استفاده کنید تا مسیر پاسخ نشست فعلی را به کانال پیوندخوردهٔ دیگری تغییر دهید. عامل همان زمینهٔ نشست را نگه می‌دارد، اما پاسخ‌های آیندهٔ آن نشست به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

فرمان‌های dock به `session.identityLinks` نیاز دارند. فرستندهٔ مبدأ و همتای مقصد باید در همان گروه هویتی باشند، برای مثال `["telegram:123", "discord:456"]`. اگر یک کاربر Telegram با شناسهٔ `123` فرمان `/dock_discord` را بفرستد، OpenClaw مقدار `lastChannel: "discord"` و `lastTo: "456"` را روی نشست فعال ذخیره می‌کند. اگر فرستنده به یک همتای Discord پیوند نشده باشد، فرمان به‌جای افتادن در گفت‌وگوی عادی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

dock فقط مسیر نشست فعال را تغییر می‌دهد. حساب‌های کانال ایجاد نمی‌کند، دسترسی اعطا نمی‌کند، فهرست‌های مجاز کانال را دور نمی‌زند، یا تاریخچهٔ رونوشت را به نشست دیگری منتقل نمی‌کند. برای تغییر دوبارهٔ مسیر، از `/dock-telegram`، `/dock-slack`، `/dock-mattermost` یا فرمان dock تولیدشدهٔ دیگری استفاده کنید.

### فرمان‌های Plugin همراه

Pluginهای همراه می‌توانند فرمان‌های slash بیشتری اضافه کنند. فرمان‌های همراه فعلی در این مخزن:

- `/dreaming [on|off|status|help]`، Dreaming حافظه را تغییر وضعیت می‌دهد. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [Pairing](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` فرمان‌های پرریسک گره تلفن را موقتاً مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام فرمان بومی `/talkvoice` است.
- `/card ...` پیش‌تنظیم‌های کارت غنی LINE را می‌فرستد. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` مهار app-server همراه Codex را بررسی و کنترل می‌کند. [Codex harness](/fa/plugins/codex-harness) را ببینید.
- فرمان‌های فقط QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### فرمان‌های skill پویا

skillهای قابل فراخوانی توسط کاربر نیز به‌صورت فرمان‌های slash ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطهٔ ورود عمومی کار می‌کند.
- skillها ممکن است وقتی skill/Plugin آن‌ها را ثبت می‌کند، به‌صورت فرمان‌های مستقیم مانند `/prose` نیز ظاهر شوند.
- ثبت فرمان skill بومی با `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- مشخصات فرمان می‌توانند برای سطوح بومی‌ای که از توضیح‌های بومی‌سازی‌شده پشتیبانی می‌کنند، از جمله Discord، `descriptionLocalizations` ارائه کنند.

<AccordionGroup>
  <Accordion title="نکته‌های آرگومان و پارسر">
    - فرمان‌ها یک `:` اختیاری بین فرمان و آرگومان‌ها می‌پذیرند (برای نمونه `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام یک ارائه‌دهنده را می‌پذیرد (تطبیق فازی)؛ اگر هیچ تطبیقی نباشد، متن به‌عنوان بدنهٔ پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل استفادهٔ ارائه‌دهنده، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و `configWrites` کانال را رعایت می‌کند.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدف‌گذاری‌شده برای پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز `configWrites` حساب هدف را رعایت می‌کنند.
    - `/usage` پانویس استفاده برای هر پاسخ را کنترل می‌کند؛ `/usage cost` یک خلاصهٔ هزینهٔ محلی را از گزارش‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌صورت پیش‌فرض فعال است؛ برای غیرفعال‌کردن آن `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات Plugin را می‌پذیرد که `openclaw plugins install` می‌پذیرد: مسیر/آرشیو محلی، بستهٔ npm، `git:<repo>`، یا `clawhub:<pkg>`، سپس چون ماژول‌های منبع Plugin تغییر کرده‌اند، درخواست راه‌اندازی دوبارهٔ Gateway می‌دهد.
    - `/plugins enable|disable` پیکربندی Plugin را به‌روزرسانی می‌کند و برای نوبت‌های جدید عامل، بارگذاری دوبارهٔ Pluginهای Gateway را آغاز می‌کند.

  </Accordion>
  <Accordion title="رفتار ویژهٔ کانال">
    - فرمان بومی فقط Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال صوتی/استیج انتخاب‌شده نیاز دارد. به `channels.discord.voice` و فرمان‌های بومی نیاز دارد.
    - فرمان‌های اتصال رشتهٔ Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های رشتهٔ مؤثر فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع فرمان ACP و رفتار زمان اجرا: [ACP agents](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی verbose / trace / fast / reasoning">
    - `/verbose` برای اشکال‌زدایی و دیدپذیری بیشتر است؛ در استفادهٔ عادی آن را **خاموش** نگه دارید.
    - `/trace` از `/verbose` محدودتر است: فقط خط‌های trace/debug متعلق به Plugin را آشکار می‌کند و گفت‌وگوی پرجزئیات عادی ابزار را خاموش نگه می‌دارد.
    - `/fast on|off` یک بازنویسی نشست را پایدار می‌کند. برای پاک‌کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینهٔ `inherit` در رابط کاربری Sessions استفاده کنید.
    - `/fast` ویژهٔ ارائه‌دهنده است: OpenAI/OpenAI Codex آن را روی نقاط پایانی بومی Responses به `service_tier=priority` نگاشت می‌کنند، درحالی‌که درخواست‌های مستقیم عمومی Anthropic، از جمله ترافیک احرازشده با OAuth که به `api.anthropic.com` فرستاده می‌شود، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های شکست ابزار همچنان هنگام مرتبط بودن نشان داده می‌شوند، اما متن تفصیلی شکست فقط وقتی گنجانده می‌شود که `/verbose` روی `on` یا `full` باشد.
    - `/reasoning`، `/verbose`، و `/trace` در محیط‌های گروهی پرریسک هستند: ممکن است reasoning داخلی، خروجی ابزار، یا عیب‌یابی‌های Plugin را که قصد افشایشان را نداشتید آشکار کنند. ترجیحاً آن‌ها را خاموش بگذارید، به‌ویژه در گفت‌وگوهای گروهی.

  </Accordion>
  <Accordion title="تغییر مدل">
    - `/model` مدل جدید نشست را فوراً پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی بی‌درنگ از آن استفاده می‌کند.
    - اگر یک اجرا از قبل فعال باشد، OpenClaw یک تغییر زنده را به‌عنوان در انتظار علامت‌گذاری می‌کند و فقط در یک نقطهٔ retry تمیز با مدل جدید دوباره شروع می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت retry بعدی یا نوبت بعدی کاربر در صف بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian بازمی‌گردد. این از حالت نجات کانال پیام جداست و اختیار پیکربندی از راه دور اعطا نمی‌کند.

  </Accordion>
  <Accordion title="مسیر سریع و میان‌برهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط فرمان از فرستندگان مجاز فوراً پردازش می‌شوند (دورزدن صف + مدل).
    - **دروازه‌گذاری منشن گروه:** پیام‌های فقط فرمان از فرستندگان مجاز، الزامات منشن را دور می‌زنند.
    - **میان‌برهای درون‌خطی (فقط فرستندگان مجاز):** برخی فرمان‌ها هنگام جاسازی در یک پیام عادی نیز کار می‌کنند و پیش از اینکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه می‌یابد.
    - در حال حاضر: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط فرمانِ غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="فرمان‌های skill و آرگومان‌های بومی">
    - **فرمان‌های skill:** skillهای `user-invocable` به‌صورت فرمان‌های slash ارائه می‌شوند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوندهای عددی می‌گیرند (برای نمونه `_2`).
      - `/skill <name> [input]` یک skill را با نام اجرا می‌کند (وقتی محدودیت‌های فرمان بومی مانع فرمان‌های جداگانه برای هر skill می‌شوند، مفید است).
      - به‌صورت پیش‌فرض، فرمان‌های skill به‌عنوان یک درخواست عادی به مدل فرستاده می‌شوند.
      - skillها می‌توانند به‌صورت اختیاری `command-dispatch: tool` را اعلام کنند تا فرمان مستقیماً به یک ابزار مسیریابی شود (قطعی، بدون مدل).
      - مثال: `/prose` (Plugin OpenProse) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های فرمان بومی:** Discord برای گزینه‌های پویا از تکمیل خودکار استفاده می‌کند (و وقتی آرگومان‌های الزامی را حذف کنید، از منوهای دکمه‌ای استفاده می‌کند). Telegram و Slack وقتی یک فرمان از انتخاب‌ها پشتیبانی کند و شما آرگومان را حذف کنید، یک منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا در برابر مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های ویژهٔ مدل مانند سطح‌های `/think` از بازنویسی `/model` همان نشست پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه یک پرسش پیکربندی: **این عامل همین حالا در این گفت‌وگو از چه چیزهایی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده و برای مرور سریع بهینه شده است.
- `/tools verbose` توضیح‌های کوتاه اضافه می‌کند.
- سطوح فرمان بومی که از آرگومان‌ها پشتیبانی می‌کنند، همان کلید تغییر حالت را به‌صورت `compact|verbose` ارائه می‌کنند.
- نتیجه‌ها وابسته به نشست هستند، بنابراین تغییر عامل، کانال، رشته، مجوز فرستنده یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` شامل ابزارهایی است که واقعاً در زمان اجرا قابل دسترسی هستند، از جمله ابزارهای هسته، ابزارهای Plugin متصل، و ابزارهای متعلق به کانال.

برای ویرایش پروفایل و بازنویسی، به‌جای اینکه `/tools` را یک کاتالوگ ایستا بدانید، از پنل Tools در رابط کاربری Control یا سطوح پیکربندی/کاتالوگ استفاده کنید.

## سطوح استفاده (چه چیزی کجا نشان داده می‌شود)

- **مصرف/سهمیه ارائه‌دهنده** (مثال: «۸۰٪ Claude باقی مانده») وقتی رهگیری مصرف فعال باشد، برای ارائه‌دهنده مدل فعلی در `/status` نمایش داده می‌شود. OpenClaw پنجره‌های ارائه‌دهنده را به «٪ باقی‌مانده» نرمال‌سازی می‌کند؛ برای MiniMax، فیلدهای درصدیِ فقط-باقی‌مانده پیش از نمایش معکوس می‌شوند، و پاسخ‌های `model_remains` ورودی مدل چت را همراه با یک برچسب طرحِ دارای تگ مدل ترجیح می‌دهند.
- **خط‌های توکن/کش** در `/status` می‌توانند وقتی نمای لحظه‌ای نشست زنده کم‌جزئیات است، به آخرین ورودی مصرف رونوشت برگردند. مقدارهای زنده غیرصفر موجود همچنان اولویت دارند، و جایگزینی از رونوشت می‌تواند برچسب مدل runtime فعال را نیز همراه با یک مجموع بزرگ‌ترِ متمرکز بر پرامپت، وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند، بازیابی کند.
- **اجرا در برابر runtime:** `/status` مقدار `Execution` را برای مسیر sandbox مؤثر و مقدار `Runtime` را برای چیزی که واقعا نشست را اجرا می‌کند گزارش می‌کند: `OpenClaw Pi Default`، `OpenAI Codex`، یک پشتیبان CLI، یا یک پشتیبان ACP.
- **توکن/هزینه به‌ازای هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی افزوده می‌شود).
- `/model status` درباره **مدل‌ها/احراز هویت/نقاط پایانی** است، نه مصرف.

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

- `/model` و `/model list` یک انتخاب‌گر فشرده و شماره‌گذاری‌شده را نمایش می‌دهند (خانواده مدل + ارائه‌دهنده‌های موجود).
- در Discord، `/model` و `/models` یک انتخاب‌گر تعاملی با فهرست‌های کشویی ارائه‌دهنده و مدل، به‌همراه یک مرحله ارسال باز می‌کنند. این انتخاب‌گر `agents.defaults.models` را، شامل ورودی‌های `provider/*`، رعایت می‌کند، بنابراین کشف محدود به ارائه‌دهنده می‌تواند انتخاب‌گر را زیر محدودیت ۲۵ گزینه‌ای مؤلفه‌های Discord نگه دارد.
- `/model <#>` از همان انتخاب‌گر انتخاب می‌کند (و در صورت امکان ارائه‌دهنده فعلی را ترجیح می‌دهد).
- `/model status` نمای جزئیات را نشان می‌دهد، از جمله نقطه پایانی پیکربندی‌شده ارائه‌دهنده (`baseUrl`) و حالت API (`api`) وقتی موجود باشند.

## بازنویسی‌های اشکال‌زدایی

`/debug` به شما اجازه می‌دهد بازنویسی‌های پیکربندی **فقط در runtime** را تنظیم کنید (در حافظه، نه روی دیسک). فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

مثال‌ها:

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

## خروجی رهگیری Plugin

`/trace` به شما اجازه می‌دهد **خط‌های رهگیری/اشکال‌زدایی Plugin در محدوده نشست** را بدون روشن کردن حالت کاملا پرجزئیات تغییر وضعیت دهید.

مثال‌ها:

```text
/trace
/trace on
/trace off
```

نکته‌ها:

- `/trace` بدون آرگومان وضعیت رهگیری نشست فعلی را نشان می‌دهد.
- `/trace on` خط‌های رهگیری Plugin را برای نشست فعلی فعال می‌کند.
- `/trace off` آن‌ها را دوباره غیرفعال می‌کند.
- خط‌های رهگیری Plugin می‌توانند در `/status` و به‌صورت یک پیام تشخیصیِ پیگیری پس از پاسخ عادی دستیار ظاهر شوند.
- `/trace` جایگزین `/debug` نیست؛ `/debug` همچنان بازنویسی‌های پیکربندی فقط در runtime را مدیریت می‌کند.
- `/trace` جایگزین `/verbose` نیست؛ خروجی عادی و پرجزئیات ابزار/وضعیت همچنان متعلق به `/verbose` است.

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
پیکربندی پیش از نوشتن اعتبارسنجی می‌شود؛ تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config` پس از راه‌اندازی‌های دوباره نیز باقی می‌مانند.
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
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه تنظیمات پروژه متعلق به Pi. آداپتورهای runtime تصمیم می‌گیرند کدام انتقال‌ها واقعا قابل اجرا هستند.
</Note>

## به‌روزرسانی‌های Plugin

`/plugins` به اپراتورها اجازه می‌دهد Pluginهای کشف‌شده را بررسی کنند و فعال‌بودن آن‌ها را در پیکربندی تغییر دهند. جریان‌های فقط‌خواندنی می‌توانند از `/plugin` به‌عنوان نام مستعار استفاده کنند. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.plugins: true` فعال کنید.

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
- `/plugins install` از ClawHub، npm، git، دایرکتوری‌های محلی و آرشیوها نصب می‌کند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Pluginها را نصب یا حذف نمی‌کند.
- تغییرات فعال‌سازی و غیرفعال‌سازی سطح‌های runtime Plugin در Gateway را برای نوبت‌های جدید عامل، با بارگذاری مجدد داغ به‌روزرسانی می‌کنند؛ درخواست نصب به راه‌اندازی دوباره Gateway نیاز دارد، چون ماژول‌های منبع Plugin تغییر کرده‌اند.

</Note>

## نکته‌های سطح

<AccordionGroup>
  <Accordion title="نشست‌ها به‌ازای هر سطح">
    - **دستورهای متنی** در نشست چت عادی اجرا می‌شوند (پیام‌های مستقیم `main` را به‌اشتراک می‌گذارند، گروه‌ها نشست خودشان را دارند).
    - **دستورهای بومی** از نشست‌های ایزوله استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (از طریق `CommandTargetSessionKey` نشست چت را هدف می‌گیرد)
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا بتواند اجرای فعلی را متوقف کند.

  </Accordion>
  <Accordion title="جزئیات مخصوص Slack">
    `channels.slack.slashCommand` همچنان برای یک دستور تکی به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر دستور داخلی یک دستور اسلش Slack بسازید (با همان نام‌های `/help`). منوهای آرگومان دستور برای Slack به‌صورت دکمه‌های موقت Block Kit تحویل داده می‌شوند.

    استثنای بومی Slack: `/agentstatus` را ثبت کنید (نه `/status`)، چون Slack مقدار `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع درباره نشست فعلی است. `/side` یک نام مستعار است.

برخلاف چت عادی:

- از نشست فعلی به‌عنوان زمینه پس‌زمینه استفاده می‌کند،
- در نشست‌های harness مربوط به Codex، به‌صورت یک رشته جانبی موقت Codex با
  مجوزهای فعلی Codex و سطح ابزار بومی اجرا می‌شود،
- در نشست‌های غیر Codex، رفتار قدیمی‌ترِ فراخوانی جانبی مستقیم و یک‌باره را حفظ می‌کند،
- زمینه نشست‌های آینده را تغییر نمی‌دهد،
- در تاریخچه رونوشت نوشته نمی‌شود،
- به‌جای یک پیام عادی دستیار، به‌صورت یک نتیجه جانبی زنده تحویل داده می‌شود.

این باعث می‌شود `/btw` زمانی مفید باشد که هنگام ادامه یافتن کار اصلی، یک شفاف‌سازی موقت می‌خواهید.

مثال:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

برای رفتار کامل و جزئیات تجربه کاربری کلاینت، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## مرتبط

- [ایجاد Skills](/fa/tools/creating-skills)
- [Skills](/fa/tools/skills)
- [پیکربندی Skills](/fa/tools/skills-config)
