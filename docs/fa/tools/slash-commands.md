---
read_when:
    - استفاده از دستورهای چت یا پیکربندی آن‌ها
    - اشکال‌زدایی مسیریابی فرمان‌ها یا مجوزها
sidebarTitle: Slash commands
summary: 'دستورهای اسلش: متنی در برابر بومی، پیکربندی، و دستورهای پشتیبانی‌شده'
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-05-03T21:42:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

فرمان‌ها توسط Gateway مدیریت می‌شوند. بیشتر فرمان‌ها باید به‌صورت یک پیام **مستقل** ارسال شوند که با `/` شروع می‌شود. فرمان گفت‌وگوی bash فقط برای میزبان از `! <cmd>` استفاده می‌کند (`/bash <cmd>` به‌عنوان نام مستعار).

وقتی یک گفت‌وگو یا رشته به یک نشست ACP متصل باشد، متن پیگیری عادی به همان harness مربوط به ACP هدایت می‌شود. فرمان‌های مدیریت Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به handler فرمان ACP در OpenClaw می‌رسد، و `/status` به‌همراه `/unfocus` هر زمان که مدیریت فرمان برای آن سطح فعال باشد محلی می‌مانند.

دو سامانه مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="فرمان‌ها">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="دستورالعمل‌ها">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - دستورالعمل‌ها پیش از آن‌که مدل پیام را ببیند، از پیام حذف می‌شوند.
    - در پیام‌های گفت‌وگوی عادی (نه پیام‌هایی که فقط دستورالعمل هستند)، آن‌ها به‌عنوان «راهنمای درون‌خطی» در نظر گرفته می‌شوند و تنظیمات نشست را **پایدار** نمی‌کنند.
    - در پیام‌هایی که فقط دستورالعمل هستند (پیام فقط شامل دستورالعمل‌هاست)، آن‌ها در نشست پایدار می‌شوند و با یک تأیید پاسخ داده می‌شود.
    - دستورالعمل‌ها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، تنها فهرست مجاز مورد استفاده است؛ در غیر این صورت مجوز از فهرست‌های مجاز/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. فرستندگان غیرمجاز دستورالعمل‌ها را به‌صورت متن ساده می‌بینند.

  </Accordion>
  <Accordion title="میان‌برهای درون‌خطی">
    فقط فرستندگان داخل فهرست مجاز/مجاز: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    آن‌ها بلافاصله اجرا می‌شوند، پیش از آن‌که مدل پیام را ببیند حذف می‌شوند، و متن باقی‌مانده از مسیر عادی ادامه پیدا می‌کند.

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
  تجزیه `/...` را در پیام‌های گفت‌وگو فعال می‌کند. روی سطح‌هایی که فرمان بومی ندارند (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، فرمان‌های متنی حتی اگر این مقدار را روی `false` بگذارید همچنان کار می‌کنند.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  فرمان‌های بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (تا زمانی که فرمان‌های اسلش را اضافه کنید)؛ برای providerهایی که پشتیبانی بومی ندارند نادیده گرفته می‌شود. برای بازنویسی به‌ازای هر provider، `channels.discord.commands.native`، `channels.telegram.commands.native`، یا `channels.slack.commands.native` را تنظیم کنید (bool یا `"auto"`). در Discord، مقدار `false` ثبت فرمان اسلش و پاک‌سازی هنگام راه‌اندازی را رد می‌کند؛ فرمان‌هایی که قبلاً ثبت شده‌اند ممکن است تا وقتی آن‌ها را از برنامه Discord حذف کنید همچنان قابل مشاهده بمانند. فرمان‌های Slack در برنامه Slack مدیریت می‌شوند و به‌صورت خودکار حذف نمی‌شوند.
</ParamField>
در Discord، مشخصات فرمان بومی می‌توانند شامل `descriptionLocalizations` باشند که OpenClaw آن را به‌صورت `description_localizations` در Discord منتشر می‌کند و در مقایسه‌های تطبیق نیز لحاظ می‌کند.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  وقتی پشتیبانی شود، فرمان‌های **skill** را به‌صورت بومی ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack نیاز دارد برای هر skill یک فرمان اسلش ساخته شود). برای بازنویسی به‌ازای هر provider، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills`، یا `channels.slack.commands.nativeSkills` را تنظیم کنید (bool یا `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  اجرای فرمان‌های shell میزبان را با `! <cmd>` فعال می‌کند (`/bash <cmd>` یک نام مستعار است؛ به فهرست‌های مجاز `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash چه مدت پیش از رفتن به حالت پس‌زمینه منتظر بماند (`0` بلافاصله به پس‌زمینه می‌رود).
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
  `/restart` را به‌همراه کنش‌های ابزار راه‌اندازی دوباره Gateway فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک را برای سطح‌های فرمان/ابزار فقط‌مالک تنظیم می‌کند. این حساب اپراتور انسانی است که می‌تواند کنش‌های خطرناک را تأیید کند و فرمان‌هایی مانند `/diagnostics`، `/export-trajectory`، و `/config` را اجرا کند. این از `commands.allowFrom` و از دسترسی جفت‌سازی DM جداست.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  به‌ازای هر کانال: باعث می‌شود فرمان‌های فقط‌مالک برای اجرا روی آن سطح به **هویت مالک** نیاز داشته باشند. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک حل‌شده مطابقت داشته باشد (برای مثال ورودی‌ای در `commands.ownerAllowFrom` یا فراداده مالک بومی provider) یا روی یک کانال پیام داخلی، scope داخلی `operator.admin` را داشته باشد. یک ورودی wildcard در `allowFrom` کانال، یا یک فهرست نامزد مالک خالی/حل‌نشده، کافی **نیست** — فرمان‌های فقط‌مالک در آن کانال به‌صورت بسته شکست می‌خورند. اگر می‌خواهید فرمان‌های فقط‌مالک فقط با `ownerAllowFrom` و فهرست‌های مجاز استاندارد فرمان کنترل شوند، این گزینه را خاموش بگذارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در prompt سامانه ظاهر شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  به‌صورت اختیاری secret مربوط به HMAC را که هنگام `commands.ownerDisplay="hash"` استفاده می‌شود تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز به‌ازای هر provider برای مجوزدهی فرمان. وقتی پیکربندی شود، تنها منبع مجوز برای فرمان‌ها و دستورالعمل‌هاست (فهرست‌های مجاز/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). از `"*"` برای پیش‌فرض سراسری استفاده کنید؛ کلیدهای خاص provider آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای فرمان‌ها اعمال می‌کند.
</ParamField>

## فهرست فرمان‌ها

منبع حقیقت فعلی:

- فرمان‌های داخلی core از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- فرمان‌های dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- فرمان‌های Plugin از فراخوانی‌های `registerCommand()` در Plugin می‌آیند
- دسترس‌پذیری واقعی روی gateway شما همچنان به flagهای پیکربندی، سطح کانال، و Pluginهای نصب‌شده/فعال‌شده بستگی دارد

### فرمان‌های داخلی core

<AccordionGroup>
  <Accordion title="نشست‌ها و اجراها">
    - `/new [model]` یک نشست جدید را شروع می‌کند؛ `/reset` نام مستعار reset است.
    - Control UI فرمان تایپ‌شده `/new` را رهگیری می‌کند تا یک نشست dashboard تازه بسازد و به آن جابه‌جا شود؛ فرمان تایپ‌شده `/reset` همچنان reset درجا در Gateway را اجرا می‌کند.
    - `/reset soft [message]` رونوشت فعلی را نگه می‌دارد، شناسه‌های نشست backend مربوط به CLI که دوباره استفاده شده‌اند را حذف می‌کند، و بارگذاری راه‌اندازی/prompt سامانه را درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` زمینه نشست را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را لغو می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال رشته را مدیریت می‌کنند.
    - `/export-session [path]` نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` تأیید exec می‌خواهد، سپس یک [بسته trajectory](/fa/tools/trajectory) به‌صورت JSONL برای نشست فعلی صادر می‌کند. وقتی برای یک نشست OpenClaw به timeline مربوط به prompt، ابزار، و رونوشت نیاز دارید از آن استفاده کنید. در گفت‌وگوهای گروهی، prompt تأیید و نتیجه export به‌صورت خصوصی برای مالک ارسال می‌شود. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="کنترل‌های مدل و اجرا">
    - `/think <level>` سطح فکر کردن را تنظیم می‌کند. گزینه‌ها از profile مربوط به provider مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium`، و `high` هستند، و سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max`، یا مقدار دودویی `on` فقط در جاهایی که پشتیبانی شوند در دسترس‌اند. نام‌های مستعار: `/thinking`، `/t`.
    - `/verbose on|off|full` خروجی verbose را تغییر وضعیت می‌دهد. نام مستعار: `/v`.
    - `/trace on|off` خروجی trace مربوط به Plugin را برای نشست فعلی تغییر وضعیت می‌دهد.
    - `/fast [status|on|off]` حالت fast را نشان می‌دهد یا تنظیم می‌کند.
    - `/reasoning [on|off|stream]` نمایان بودن reasoning را تغییر وضعیت می‌دهد. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را تغییر وضعیت می‌دهد. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نشان می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نشان می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` providerهای پیکربندی‌شده/دارای auth در دسترس یا مدل‌های یک provider را فهرست می‌کند؛ برای مرور کاتالوگ کامل آن provider، `all` را اضافه کنید.
    - `/queue <mode>` رفتار صف را مدیریت می‌کند (`steer`، `queue` قدیمی، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مثل `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی نشست را پاک می‌کند. [صف فرمان](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.

  </Accordion>
  <Accordion title="کشف و وضعیت">
    - `/help` خلاصه راهنمای کوتاه را نشان می‌دهد.
    - `/commands` کاتالوگ فرمان تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد agent فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا را نشان می‌دهد، از جمله برچسب‌های `Execution`/`Runtime` و مصرف/quota مربوط به provider در صورت دسترسی.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط‌مالک برای باگ‌های Gateway و اجراهای harness مربوط به Codex است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` تأیید صریح exec می‌خواهد؛ diagnostics را با قاعده allow-all تأیید نکنید. پس از تأیید، گزارشی قابل paste شامل مسیر بسته محلی، خلاصه manifest، یادداشت‌های حریم خصوصی، و شناسه‌های نشست مرتبط ارسال می‌کند. در گفت‌وگوهای گروهی، prompt تأیید و گزارش به‌صورت خصوصی برای مالک ارسال می‌شوند. وقتی نشست فعال از harness مربوط به OpenAI Codex استفاده می‌کند، همان تأیید، بازخورد مرتبط Codex را نیز به سرورهای OpenAI می‌فرستد و پاسخ کامل‌شده شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و فرمان‌های `codex resume <thread-id>` را فهرست می‌کند. [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` ابزار کمکی راه‌اندازی و تعمیر Crestodian را از DM مالک اجرا می‌کند.
    - `/tasks` کارهای پس‌زمینه فعال/اخیر را برای نشست فعلی فهرست می‌کند.
    - `/context [list|detail|json]` توضیح می‌دهد context چگونه مونتاژ می‌شود.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` footer مصرف به‌ازای هر پاسخ را کنترل می‌کند یا یک خلاصه هزینه محلی چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills، فهرست‌های مجاز، تأییدها">
    - `/skill <name> [input]` یک skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` ورودی‌های فهرست مجاز را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` promptهای تأیید exec را حل می‌کند.
    - `/btw <question>` یک پرسش جانبی می‌پرسد بدون اینکه context آینده نشست را تغییر دهد. نام مستعار: `/side`. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="زیرعامل‌ها و ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجراهای زیرعامل را برای نشست فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند.
    - `/focus <target>` رشته فعلی Discord یا موضوع/گفت‌وگوی Telegram را به یک هدف نشست متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` عامل‌های متصل به رشته را برای نشست فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک یا همه زیرعامل‌های در حال اجرا را متوقف می‌کند.
    - `/steer <id|#> <message>` راهبری را به یک زیرعامل در حال اجرا می‌فرستد. نام مستعار: `/tell`.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت plugin را بررسی یا تغییر می‌دهد. `/plugin` یک نام مستعار است. نوشتن فقط برای مالک است. به `commands.plugins: true` نیاز دارد.
    - `/debug show|set|unset|reset` بازنویسی‌های پیکربندی فقط زمان اجرا را مدیریت می‌کند. فقط مالک. به `commands.debug: true` نیاز دارد.
    - `/restart` در صورت فعال بودن، OpenClaw را راه‌اندازی مجدد می‌کند. پیش‌فرض: فعال؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
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

### فرمان‌های dock تولیدشده

فرمان‌های dock مسیر پاسخ نشست فعلی را به کانال پیوندخورده دیگری تغییر می‌دهند. برای راه‌اندازی، مثال‌ها و عیب‌یابی، [داکینگ کانال](/fa/concepts/channel-docking) را ببینید.

فرمان‌های dock از pluginهای کانال با پشتیبانی فرمان بومی تولید می‌شوند. مجموعه بسته‌بندی‌شده فعلی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از فرمان‌های dock در یک گفت‌وگوی مستقیم استفاده کنید تا مسیر پاسخ نشست فعلی را به کانال پیوندخورده دیگری تغییر دهید. عامل همان زمینه نشست را حفظ می‌کند، اما پاسخ‌های آینده برای آن نشست به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

فرمان‌های dock به `session.identityLinks` نیاز دارند. فرستنده مبدأ و همتای هدف باید در یک گروه هویتی باشند، برای مثال `["telegram:123", "discord:456"]`. اگر کاربر Telegram با شناسه `123` فرمان `/dock_discord` را بفرستد، OpenClaw مقدار `lastChannel: "discord"` و `lastTo: "456"` را روی نشست فعال ذخیره می‌کند. اگر فرستنده به یک همتای Discord پیوند نشده باشد، فرمان به‌جای افتادن در مسیر چت عادی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

داکینگ فقط مسیر نشست فعال را تغییر می‌دهد. حساب‌های کانال ایجاد نمی‌کند، دسترسی نمی‌دهد، فهرست‌های مجاز کانال را دور نمی‌زند، یا تاریخچه رونوشت را به نشست دیگری منتقل نمی‌کند. برای تغییر دوباره مسیر از `/dock-telegram`، `/dock-slack`، `/dock-mattermost` یا یک فرمان dock تولیدشده دیگر استفاده کنید.

### فرمان‌های plugin بسته‌بندی‌شده

pluginهای بسته‌بندی‌شده می‌توانند فرمان‌های اسلش بیشتری اضافه کنند. فرمان‌های بسته‌بندی‌شده فعلی در این repo:

- `/dreaming [on|off|status|help]` Dreaming حافظه را روشن یا خاموش می‌کند. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [جفت‌سازی](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` به‌طور موقت فرمان‌های پرریسک گره تلفن را مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام فرمان بومی `/talkvoice` است.
- `/card ...` presetهای کارت غنی LINE را می‌فرستد. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` harness سرور برنامه Codex بسته‌بندی‌شده را بررسی و کنترل می‌کند. [harness Codex](/fa/plugins/codex-harness) را ببینید.
- فرمان‌های فقط QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### فرمان‌های Skills پویا

Skills قابل فراخوانی توسط کاربر نیز به‌صورت فرمان‌های اسلش ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills ممکن است وقتی skill/plugin آن‌ها را ثبت می‌کند، به‌صورت فرمان‌های مستقیم مانند `/prose` نیز ظاهر شوند.
- ثبت فرمان Skill بومی توسط `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- مشخصات فرمان می‌توانند برای سطح‌های بومی که از توضیحات محلی‌سازی‌شده پشتیبانی می‌کنند، از جمله Discord، `descriptionLocalizations` ارائه کنند.

<AccordionGroup>
  <Accordion title="یادداشت‌های آرگومان و parser">
    - فرمان‌ها یک `:` اختیاری را بین فرمان و آرگومان‌ها می‌پذیرند (مثلاً `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام provider را می‌پذیرد (تطبیق تقریبی)؛ اگر تطبیقی نباشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل مصرف provider، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و `configWrites` کانال را رعایت می‌کند.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدف‌گیری‌شده برای پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز `configWrites` حساب هدف را رعایت می‌کنند.
    - `/usage` پانویس مصرف برای هر پاسخ را کنترل می‌کند؛ `/usage cost` یک خلاصه هزینه محلی را از گزارش‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌طور پیش‌فرض فعال است؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات plugin را که `openclaw plugins install` می‌پذیرد قبول می‌کند: مسیر/آرشیو محلی، بسته npm، `git:<repo>`، یا `clawhub:<pkg>`، سپس درخواست راه‌اندازی مجدد Gateway می‌دهد چون ماژول‌های منبع plugin تغییر کرده‌اند.
    - `/plugins enable|disable` پیکربندی plugin را به‌روزرسانی می‌کند و برای نوبت‌های جدید عامل، بارگذاری مجدد plugin در Gateway را فعال می‌کند.

  </Accordion>
  <Accordion title="رفتار ویژه کانال">
    - فرمان بومی فقط Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال صوتی/استیج انتخاب‌شده نیاز دارد. به `channels.discord.voice` و فرمان‌های بومی نیاز دارد.
    - فرمان‌های اتصال رشته Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های مؤثر رشته فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع فرمان ACP و رفتار زمان اجرا: [عامل‌های ACP](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی verbose / trace / fast / reasoning">
    - `/verbose` برای اشکال‌زدایی و دیدپذیری بیشتر در نظر گرفته شده است؛ در استفاده عادی آن را **خاموش** نگه دارید.
    - `/trace` محدودتر از `/verbose` است: فقط خط‌های trace/debug متعلق به plugin را آشکار می‌کند و پرگویی عادی ابزار را خاموش نگه می‌دارد.
    - `/fast on|off` یک بازنویسی نشست را پایدار می‌کند. برای پاک کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینه `inherit` در UI نشست‌ها استفاده کنید.
    - `/fast` وابسته به provider است: OpenAI/OpenAI Codex آن را روی endpointهای Responses بومی به `service_tier=priority` نگاشت می‌کنند، درحالی‌که درخواست‌های عمومی مستقیم Anthropic، از جمله ترافیک احراز هویت‌شده با OAuth که به `api.anthropic.com` فرستاده می‌شود، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های شکست ابزار همچنان در صورت مرتبط بودن نمایش داده می‌شوند، اما متن تفصیلی شکست فقط وقتی گنجانده می‌شود که `/verbose` برابر `on` یا `full` باشد.
    - `/reasoning`، `/verbose` و `/trace` در محیط‌های گروهی پرریسک هستند: ممکن است reasoning داخلی، خروجی ابزار یا diagnostics مربوط به plugin را که قصد افشای آن را نداشتید آشکار کنند. به‌ویژه در چت‌های گروهی، ترجیحاً آن‌ها را خاموش نگه دارید.

  </Accordion>
  <Accordion title="تغییر مدل">
    - `/model` مدل جدید نشست را فوراً پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی بلافاصله از آن استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw یک تغییر زنده را به‌عنوان در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه retry تمیز به مدل جدید راه‌اندازی مجدد می‌شود.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت retry بعدی یا نوبت کاربر بعدی در صف بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian برمی‌گردد. این از حالت نجات کانال پیام جداست و اختیار پیکربندی راه دور نمی‌دهد.

  </Accordion>
  <Accordion title="مسیر سریع و میانبرهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط فرمان از فرستنده‌های موجود در فهرست مجاز فوراً پردازش می‌شوند (دور زدن صف + مدل).
    - **دروازه‌گذاری mention گروهی:** پیام‌های فقط فرمان از فرستنده‌های موجود در فهرست مجاز، الزامات mention را دور می‌زنند.
    - **میانبرهای درون‌خطی (فقط فرستنده‌های موجود در فهرست مجاز):** بعضی فرمان‌ها وقتی در یک پیام عادی جاسازی شوند نیز کار می‌کنند و پیش از اینکه مدل متن باقی‌مانده را ببیند، حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه می‌یابد.
    - فعلاً: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط فرمان غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و tokenهای درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="فرمان‌های Skill و آرگومان‌های بومی">
    - **فرمان‌های Skill:** Skills از نوع `user-invocable` به‌صورت فرمان‌های اسلش ارائه می‌شوند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها suffix عددی می‌گیرند (مثلاً `_2`).
      - `/skill <name> [input]` یک Skill را با نام اجرا می‌کند (وقتی محدودیت‌های فرمان بومی مانع فرمان‌های جداگانه برای هر Skill می‌شوند مفید است).
      - به‌طور پیش‌فرض، فرمان‌های Skill به‌عنوان یک درخواست عادی به مدل فرستاده می‌شوند.
      - Skills می‌توانند به‌صورت اختیاری `command-dispatch: tool` را اعلام کنند تا فرمان مستقیماً به یک ابزار مسیریابی شود (قطعی، بدون مدل).
      - مثال: `/prose` (plugin OpenProse) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های فرمان بومی:** Discord برای گزینه‌های پویا از تکمیل خودکار استفاده می‌کند (و وقتی آرگومان‌های لازم را حذف کنید، از منوهای دکمه‌ای). Telegram و Slack وقتی فرمانی از انتخاب‌ها پشتیبانی کند و آرگومان را حذف کنید، منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا در برابر مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های وابسته به مدل مانند سطح‌های `/think` از بازنویسی `/model` آن نشست پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه پرسش پیکربندی: **این عامل همین حالا در این گفت‌وگو از چه چیزی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده و برای مرور سریع بهینه شده است.
- `/tools verbose` توضیحات کوتاه اضافه می‌کند.
- سطح‌های فرمان بومی که از آرگومان‌ها پشتیبانی می‌کنند، همان تغییر حالت را به‌صورت `compact|verbose` ارائه می‌کنند.
- نتایج محدود به نشست هستند، بنابراین تغییر عامل، کانال، رشته، مجوز فرستنده یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` شامل ابزارهایی است که واقعاً در زمان اجرا قابل دسترسی هستند، از جمله ابزارهای core، ابزارهای plugin متصل، و ابزارهای متعلق به کانال.

برای ویرایش profile و override، به‌جای تلقی کردن `/tools` به‌عنوان یک catalog ثابت، از پنل ابزارهای Control UI یا سطح‌های پیکربندی/catalog استفاده کنید.

## سطح‌های مصرف (چه چیزی کجا نمایش داده می‌شود)

- **مصرف/سهمیهٔ ارائه‌دهنده** (نمونه: "Claude 80% left") وقتی رهگیری مصرف فعال باشد، برای ارائه‌دهندهٔ مدل فعلی در `/status` نمایش داده می‌شود. OpenClaw پنجره‌های ارائه‌دهنده را به `% left` یکسان‌سازی می‌کند؛ برای MiniMax، فیلدهای درصدِ فقط-باقی‌مانده پیش از نمایش معکوس می‌شوند، و پاسخ‌های `model_remains` ورودی مدل چت را همراه با برچسب طرح دارای تگ مدل ترجیح می‌دهند.
- **خط‌های توکن/کش** در `/status` وقتی نمای فوری نشست زنده کم‌جزئیات باشد، می‌توانند به آخرین ورودی مصرف رونوشت برگردند. مقدارهای زندهٔ غیرصفر موجود همچنان اولویت دارند، و بازگشت به رونوشت می‌تواند برچسب مدل runtime فعال را نیز همراه با مجموعی بزرگ‌تر و متمرکز بر پرامپت بازیابی کند، وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند.
- **اجرا در برابر runtime:** ‏`/status` برای مسیر sandbox مؤثر، `Execution` را گزارش می‌کند و برای اینکه چه کسی واقعاً نشست را اجرا می‌کند، `Runtime` را: `OpenClaw Pi Default`،‏ `OpenAI Codex`، یک backend متعلق به CLI، یا یک backend متعلق به ACP.
- **توکن/هزینه برای هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی افزوده می‌شود).
- `/model status` دربارهٔ **مدل‌ها/احراز هویت/endpointها** است، نه مصرف.

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

نکات:

- `/model` و `/model list` یک انتخابگر فشرده و شماره‌دار نشان می‌دهند (خانوادهٔ مدل + ارائه‌دهندگان موجود).
- در Discord،‏ `/model` و `/models` یک انتخابگر تعاملی با منوهای کشویی ارائه‌دهنده و مدل، به‌همراه مرحلهٔ Submit باز می‌کنند.
- `/model <#>` از همان انتخابگر انتخاب می‌کند (و در صورت امکان ارائه‌دهندهٔ فعلی را ترجیح می‌دهد).
- `/model status` نمای جزئیات را نشان می‌دهد، شامل endpoint پیکربندی‌شدهٔ ارائه‌دهنده (`baseUrl`) و حالت API (`api`) وقتی موجود باشد.

## overrideهای اشکال‌زدایی

`/debug` به شما امکان می‌دهد overrideهای پیکربندی **فقط runtime** تنظیم کنید (در حافظه، نه روی دیسک). فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
overrideها بلافاصله روی خواندن‌های جدید پیکربندی اعمال می‌شوند، اما در `openclaw.json` نوشته نمی‌شوند. برای پاک‌کردن همهٔ overrideها و بازگشت به پیکربندی روی دیسک، از `/debug reset` استفاده کنید.
</Note>

## خروجی ردیابی Plugin

`/trace` به شما امکان می‌دهد **خط‌های ردیابی/اشکال‌زدایی Plugin در محدودهٔ نشست** را بدون روشن‌کردن حالت verbose کامل تغییر دهید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

نکات:

- `/trace` بدون آرگومان، وضعیت ردیابی نشست فعلی را نشان می‌دهد.
- `/trace on` خط‌های ردیابی Plugin را برای نشست فعلی فعال می‌کند.
- `/trace off` دوباره آن‌ها را غیرفعال می‌کند.
- خط‌های ردیابی Plugin می‌توانند در `/status` و به‌صورت پیام تشخیصی پیگیری پس از پاسخ عادی دستیار ظاهر شوند.
- `/trace` جایگزین `/debug` نیست؛ `/debug` همچنان overrideهای پیکربندی فقط runtime را مدیریت می‌کند.
- `/trace` جایگزین `/verbose` نیست؛ خروجی عادی verbose ابزار/وضعیت همچنان متعلق به `/verbose` است.

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

`/mcp` تعریف‌های سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌نویسد. فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.mcp: true` فعال کنید.

نمونه‌ها:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه تنظیمات پروژهٔ متعلق به Pi. adapterهای runtime تصمیم می‌گیرند کدام transportها واقعاً قابل اجرا هستند.
</Note>

## به‌روزرسانی‌های Plugin

`/plugins` به operatorها اجازه می‌دهد Pluginهای کشف‌شده را بررسی کنند و فعال‌سازی را در پیکربندی تغییر دهند. جریان‌های فقط‌خواندنی می‌توانند از `/plugin` به‌عنوان alias استفاده کنند. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.plugins: true` فعال کنید.

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
- `/plugins install` از ClawHub،‏ npm،‏ git، دایرکتوری‌های محلی و آرشیوها نصب می‌کند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Pluginها را نصب یا حذف نصب نمی‌کند.
- تغییرات فعال‌سازی و غیرفعال‌سازی سطح‌های runtime مربوط به Plugin در Gateway را برای turnهای جدید agent به‌صورت hot-reload بارگذاری می‌کنند؛ نصب درخواست راه‌اندازی مجدد Gateway می‌دهد، چون ماژول‌های منبع Plugin تغییر کرده‌اند.

</Note>

## نکات سطح‌ها

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **فرمان‌های متنی** در نشست عادی چت اجرا می‌شوند (DMها `main` را به‌اشتراک می‌گذارند، گروه‌ها نشست خودشان را دارند).
    - **فرمان‌های بومی** از نشست‌های جداشده استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (از طریق `CommandTargetSessionKey` نشست چت را هدف می‌گیرد)
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا بتواند اجرای فعلی را abort کند.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` همچنان برای یک فرمان واحد به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر فرمان built-in یک فرمان slash در Slack بسازید (هم‌نام با `/help`). منوهای آرگومان فرمان برای Slack به‌صورت دکمه‌های ephemeral در Block Kit تحویل داده می‌شوند.

    استثنای بومی Slack: ‏`/agentstatus` را ثبت کنید (نه `/status`) چون Slack،‏ `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع دربارهٔ نشست فعلی است. `/side` یک alias است.

برخلاف چت عادی:

- از نشست فعلی به‌عنوان زمینهٔ پس‌زمینه استفاده می‌کند،
- به‌صورت یک فراخوانی یک‌بارهٔ جداگانه و **بدون ابزار** اجرا می‌شود،
- زمینهٔ نشست‌های آینده را تغییر نمی‌دهد،
- در تاریخچهٔ رونوشت نوشته نمی‌شود،
- به‌جای پیام عادی دستیار، به‌صورت نتیجهٔ جانبی زنده تحویل داده می‌شود.

این باعث می‌شود `/btw` وقتی به یک توضیح موقت نیاز دارید و هم‌زمان کار اصلی ادامه دارد مفید باشد.

نمونه:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

برای رفتار کامل و جزئیات UX کلاینت، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## مرتبط

- [ایجاد Skills](/fa/tools/creating-skills)
- [Skills](/fa/tools/skills)
- [پیکربندی Skills](/fa/tools/skills-config)
