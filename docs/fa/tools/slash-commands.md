---
read_when:
    - استفاده از فرمان‌های گفت‌وگو یا پیکربندی آن‌ها
    - اشکال‌زدایی از مسیریابی دستور یا مجوزها
sidebarTitle: Slash commands
summary: 'فرمان‌های اسلش: متنی در برابر بومی، پیکربندی و فرمان‌های پشتیبانی‌شده'
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-05-10T20:12:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e97154facfa481b0c0d4b595f595d3698ee3e92c0a197794d12d75030a12ecb7
    source_path: tools/slash-commands.md
    workflow: 16
---

دستورها توسط Gateway مدیریت می‌شوند. بیشتر دستورها باید به‌صورت یک پیام **مستقل** ارسال شوند که با `/` شروع می‌شود. دستور چت bash فقط برای میزبان از `! <cmd>` استفاده می‌کند (`/bash <cmd>` هم به‌عنوان نام مستعار آن است).

وقتی یک مکالمه یا thread به یک نشست ACP متصل باشد، متن‌های پیگیری عادی به همان ACP harness هدایت می‌شوند. دستورهای مدیریتی Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به پردازنده دستور ACP در OpenClaw می‌رسد، و `/status` به‌همراه `/unfocus` هر زمان که مدیریت دستور برای آن سطح فعال باشد محلی می‌مانند.

دو سیستم مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="دستورها">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="دستورالعمل‌ها">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - دستورالعمل‌ها پیش از آنکه مدل پیام را ببیند از پیام حذف می‌شوند.
    - در پیام‌های چت عادی (نه فقط شامل دستورالعمل)، آن‌ها به‌عنوان «راهنمای درون‌خطی» در نظر گرفته می‌شوند و تنظیمات نشست را پایدار نمی‌کنند.
    - در پیام‌های فقط شامل دستورالعمل (پیام فقط دستورالعمل دارد)، روی نشست پایدار می‌شوند و با یک تأیید پاسخ می‌دهند.
    - دستورالعمل‌ها فقط برای **فرستنده‌های مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، تنها فهرست مجاز استفاده‌شده همان است؛ در غیر این صورت مجوز از فهرست‌های مجاز/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. فرستنده‌های غیرمجاز دستورالعمل‌ها را به‌صورت متن ساده می‌بینند.

  </Accordion>
  <Accordion title="میان‌برهای درون‌خطی">
    فقط فرستنده‌های موجود در فهرست مجاز/مجاز: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    آن‌ها بلافاصله اجرا می‌شوند، پیش از دیده‌شدن پیام توسط مدل حذف می‌شوند، و متن باقی‌مانده در جریان عادی ادامه پیدا می‌کند.

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
  تجزیه `/...` را در پیام‌های چت فعال می‌کند. روی سطح‌هایی بدون دستورهای بومی (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، دستورهای متنی حتی اگر این مقدار را روی `false` بگذارید همچنان کار می‌کنند.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  دستورهای بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (تا وقتی slash commandها را اضافه کنید)؛ برای ارائه‌دهنده‌هایی که پشتیبانی بومی ندارند نادیده گرفته می‌شود. برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.native`، `channels.telegram.commands.native`، یا `channels.slack.commands.native` را تنظیم کنید (bool یا `"auto"`). در Discord، مقدار `false` ثبت و پاک‌سازی slash-command را هنگام راه‌اندازی رد می‌کند؛ دستورهای ثبت‌شده قبلی ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید قابل مشاهده بمانند. دستورهای Slack در برنامه Slack مدیریت می‌شوند و به‌صورت خودکار حذف نمی‌شوند.
</ParamField>
در Discord، مشخصات دستور بومی می‌تواند شامل `descriptionLocalizations` باشد، که OpenClaw آن را به‌عنوان `description_localizations` در Discord منتشر می‌کند و در مقایسه‌های همگام‌سازی لحاظ می‌کند.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  وقتی پشتیبانی شود، دستورهای **skill** را به‌صورت بومی ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack برای هر skill نیازمند ساخت یک slash command است). برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills`، یا `channels.slack.commands.nativeSkills` را تنظیم کنید (bool یا `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  اجرای دستورهای shell میزبان با `! <cmd>` را فعال می‌کند (`/bash <cmd>` یک نام مستعار است؛ به فهرست‌های مجاز `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash پیش از رفتن به حالت پس‌زمینه چه مدت منتظر بماند (`0` بلافاصله به پس‌زمینه می‌رود).
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
  `/restart` به‌همراه کنش‌های ابزار راه‌اندازی مجدد gateway را فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک را برای سطح‌های دستور/ابزار فقط مخصوص مالک تنظیم می‌کند. این حساب اپراتور انسانی است که می‌تواند کنش‌های خطرناک را تأیید کند و دستورهایی مانند `/diagnostics`، `/export-trajectory` و `/config` را اجرا کند. این از `commands.allowFrom` و از دسترسی جفت‌سازی DM جدا است.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  به‌ازای هر کانال: اجرای دستورهای فقط مخصوص مالک روی آن سطح را نیازمند **هویت مالک** می‌کند. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک حل‌شده مطابقت داشته باشد (برای مثال یک ورودی در `commands.ownerAllowFrom` یا فراداده مالک بومی ارائه‌دهنده) یا در یک کانال پیام داخلی scope داخلی `operator.admin` داشته باشد. یک ورودی wildcard در `allowFrom` کانال، یا یک فهرست نامزد مالک خالی/حل‌نشده، کافی **نیست** — دستورهای فقط مخصوص مالک روی آن کانال بسته شکست می‌خورند. اگر می‌خواهید دستورهای فقط مخصوص مالک فقط با `ownerAllowFrom` و فهرست‌های مجاز استاندارد دستور محدود شوند، این گزینه را خاموش بگذارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در اعلان سیستم ظاهر شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  در صورت نیاز secret مربوط به HMAC را که هنگام `commands.ownerDisplay="hash"` استفاده می‌شود تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز به‌ازای ارائه‌دهنده برای مجوزدهی دستور. وقتی پیکربندی شده باشد، تنها منبع مجوزدهی برای دستورها و دستورالعمل‌هاست (فهرست‌های مجاز/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). از `"*"` برای پیش‌فرض سراسری استفاده کنید؛ کلیدهای ویژه ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای دستورها اعمال می‌کند.
</ParamField>

## فهرست دستورها

منبع حقیقت فعلی:

- built-inهای هسته از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- دستورهای dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- دستورهای Plugin از فراخوانی‌های `registerCommand()` در Plugin می‌آیند
- در دسترس بودن واقعی روی gateway شما همچنان به پرچم‌های پیکربندی، سطح کانال، و Pluginهای نصب‌شده/فعال بستگی دارد

### دستورهای built-in هسته

<AccordionGroup>
  <Accordion title="نشست‌ها و اجراها">
    - `/new [model]` یک نشست جدید شروع می‌کند؛ `/reset` نام مستعار بازنشانی است.
    - Control UI دستور تایپ‌شده `/new` را intercept می‌کند تا یک نشست تازه dashboard بسازد و به آن جابه‌جا شود، مگر وقتی `session.dmScope: "main"` پیکربندی شده باشد و والد فعلی نشست اصلی agent باشد؛ در آن حالت `/new` نشست اصلی را درجا بازنشانی می‌کند. دستور تایپ‌شده `/reset` همچنان reset درجا در Gateway را اجرا می‌کند.
    - `/reset soft [message]` transcript فعلی را نگه می‌دارد، شناسه‌های نشست backend مربوط به CLI را که دوباره استفاده شده‌اند حذف می‌کند، و بارگذاری startup/system-prompt را درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` زمینه نشست را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را متوقف می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال thread را مدیریت می‌کنند.
    - `/export-session [path]` نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` درخواست تأیید exec می‌کند، سپس یک [trajectory bundle](/fa/tools/trajectory) از نوع JSONL برای نشست فعلی صادر می‌کند. وقتی برای یک نشست OpenClaw به جدول زمانی prompt، ابزار و transcript نیاز دارید از آن استفاده کنید. در چت‌های گروهی، prompt تأیید و نتیجه export به‌صورت خصوصی برای مالک ارسال می‌شود. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="کنترل‌های مدل و اجرا">
    - `/think <level|default>` سطح thinking را تنظیم می‌کند یا بازنویسی نشست را پاک می‌کند. گزینه‌ها از profile ارائه‌دهنده مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium` و `high` هستند، و سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max` یا مقدار دودویی `on` فقط جایی که پشتیبانی شود وجود دارند. نام‌های مستعار: `/thinking`، `/t`.
    - `/verbose on|off|full` خروجی verbose را تغییر می‌دهد. نام مستعار: `/v`.
    - `/trace on|off` خروجی trace مربوط به Plugin را برای نشست فعلی تغییر می‌دهد.
    - `/fast [status|on|off|default]` حالت fast را نشان می‌دهد، تنظیم می‌کند یا پاک می‌کند.
    - `/reasoning [on|off|stream]` نمایش reasoning را تغییر می‌دهد. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را تغییر می‌دهد. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نشان می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نشان می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` ارائه‌دهنده‌های پیکربندی‌شده/دارای auth در دسترس یا مدل‌های یک ارائه‌دهنده را فهرست می‌کند؛ برای مرور کل catalog آن ارائه‌دهنده `all` را اضافه کنید. ورودی‌های `provider/*` در `agents.defaults.models` باعث می‌شوند `/model` و `/models` فقط مدل‌های کشف‌شده برای همان ارائه‌دهنده‌ها را نشان دهند.
    - `/queue <mode>` رفتار queue را مدیریت می‌کند (`steer`، `queue` قدیمی، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی نشست را پاک می‌کند. [Command queue](/fa/concepts/queue) و [Steering queue](/fa/concepts/queue-steering) را ببینید.
    - `/steer <message>` راهنمایی را به اجرای فعال برای نشست فعلی تزریق می‌کند، مستقل از حالت `/queue`. وقتی نشست idle باشد اجرای جدیدی شروع نمی‌کند. نام مستعار: `/tell`. [Steer](/fa/tools/steer) را ببینید.

  </Accordion>
  <Accordion title="کشف و وضعیت">
    - `/help` خلاصه کوتاه راهنما را نشان می‌دهد.
    - `/commands` catalog دستور تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد agent فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا، uptime مربوط به Gateway و سیستم، به‌همراه استفاده/quota ارائه‌دهنده را در صورت دسترسی نشان می‌دهد.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط مخصوص مالک برای خطاهای Gateway و اجراهای Codex harness است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` درخواست تأیید صریح exec می‌کند؛ diagnostics را با یک قاعده allow-all تأیید نکنید. پس از تأیید، گزارشی قابل paste ارسال می‌کند که شامل مسیر bundle محلی، خلاصه manifest، یادداشت‌های حریم خصوصی، و شناسه‌های نشست مرتبط است. در چت‌های گروهی، prompt تأیید و گزارش به‌صورت خصوصی برای مالک ارسال می‌شود. وقتی نشست فعال از OpenAI Codex harness استفاده می‌کند، همان تأیید feedback مرتبط با Codex را نیز به سرورهای OpenAI ارسال می‌کند و پاسخ تکمیل‌شده شناسه‌های نشست OpenClaw، شناسه‌های thread مربوط به Codex و دستورهای `codex resume <thread-id>` را فهرست می‌کند. [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` راه‌اندازی Crestodian و کمک‌کننده repair را از DM مالک اجرا می‌کند.
    - `/tasks` taskهای پس‌زمینه فعال/اخیر را برای نشست فعلی فهرست می‌کند.
    - `/context [list|detail|map|json]` توضیح می‌دهد context چگونه assembled می‌شود. `map` یک تصویر treemap از context نشست فعلی ارسال می‌کند.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` footer استفاده به‌ازای هر پاسخ را کنترل می‌کند یا خلاصه cost محلی را چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills، allowlistها، تأییدها">
    - `/skill <name> [input]` یک Skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` ورودی‌های allowlist را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` درخواست‌های تأیید exec را حل می‌کند.
    - `/btw <question>` یک پرسش جانبی را بدون تغییر دادن زمینهٔ جلسه‌های آینده می‌پرسد. نام مستعار: `/side`. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="زیرعامل‌ها و ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجراهای زیرعامل را برای جلسهٔ فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسه‌های ACP و گزینه‌های runtime را مدیریت می‌کند.
    - `/focus <target>` نخ فعلی Discord یا موضوع/گفت‌وگوی Telegram را به یک هدف جلسه متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` عامل‌های متصل به نخ را برای جلسهٔ فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک یا همهٔ زیرعامل‌های در حال اجرا را متوقف می‌کند.
    - `/subagents steer <id|#> <message>` پیام هدایت را به یک زیرعامل در حال اجرا می‌فرستد. [Steer](/fa/tools/steer) را ببینید.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت Plugin را بررسی یا تغییر می‌دهد. `/plugin` یک نام مستعار است. نوشتن فقط برای مالک است. به `commands.plugins: true` نیاز دارد.
    - `/debug show|set|unset|reset` بازنویسی‌های پیکربندی فقط runtime را مدیریت می‌کند. فقط مالک. به `commands.debug: true` نیاز دارد.
    - `/restart` وقتی فعال باشد OpenClaw را راه‌اندازی مجدد می‌کند. پیش‌فرض: فعال؛ برای غیرفعال کردن آن `commands.restart: false` را تنظیم کنید.
    - `/send on|off|inherit` سیاست ارسال را تنظیم می‌کند. فقط مالک.

  </Accordion>
  <Accordion title="صدا، TTS، کنترل کانال">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` TTS را کنترل می‌کند. [TTS](/fa/tools/tts) را ببینید.
    - `/activation mention|always` حالت فعال‌سازی گروه را تنظیم می‌کند.
    - `/bash <command>` یک فرمان پوستهٔ میزبان را اجرا می‌کند. فقط متنی. نام مستعار: `! <command>`. به `commands.bash: true` به‌همراه allowlistهای `tools.elevated` نیاز دارد.
    - `!poll [sessionId]` یک کار bash پس‌زمینه را بررسی می‌کند.
    - `!stop [sessionId]` یک کار bash پس‌زمینه را متوقف می‌کند.

  </Accordion>
</AccordionGroup>

### فرمان‌های dock تولیدشده

فرمان‌های dock مسیر پاسخ جلسهٔ فعلی را به کانال لینک‌شدهٔ دیگری
تغییر می‌دهند. برای راه‌اندازی، نمونه‌ها و عیب‌یابی، [Channel docking](/fa/concepts/channel-docking) را ببینید.

فرمان‌های dock از Pluginهای کانالی دارای پشتیبانی فرمان بومی تولید می‌شوند. مجموعهٔ بسته‌بندی‌شدهٔ فعلی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از فرمان‌های dock در یک گفت‌وگوی مستقیم استفاده کنید تا مسیر پاسخ جلسهٔ فعلی را به کانال لینک‌شدهٔ دیگری تغییر دهید. عامل همان زمینهٔ جلسه را نگه می‌دارد، اما پاسخ‌های آینده برای آن جلسه به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

فرمان‌های dock به `session.identityLinks` نیاز دارند. فرستندهٔ مبدأ و همتای مقصد باید در یک گروه هویت باشند، برای مثال `["telegram:123", "discord:456"]`. اگر یک کاربر Telegram با شناسهٔ `123` فرمان `/dock_discord` را بفرستد، OpenClaw مقدار `lastChannel: "discord"` و `lastTo: "456"` را روی جلسهٔ فعال ذخیره می‌کند. اگر فرستنده به یک همتای Discord لینک نشده باشد، فرمان به‌جای افتادن در گفت‌وگوی عادی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

Docking فقط مسیر جلسهٔ فعال را تغییر می‌دهد. حساب‌های کانال ایجاد نمی‌کند، دسترسی نمی‌دهد، allowlistهای کانال را دور نمی‌زند، یا تاریخچهٔ رونوشت را به جلسهٔ دیگری منتقل نمی‌کند. برای تغییر دوبارهٔ مسیر از `/dock-telegram`، `/dock-slack`، `/dock-mattermost` یا فرمان dock تولیدشدهٔ دیگری استفاده کنید.

### فرمان‌های Plugin بسته‌بندی‌شده

Pluginهای بسته‌بندی‌شده می‌توانند فرمان‌های اسلش بیشتری اضافه کنند. فرمان‌های بسته‌بندی‌شدهٔ فعلی در این مخزن:

- `/dreaming [on|off|status|help]` Dreaming حافظه را روشن یا خاموش می‌کند. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [Pairing](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` فرمان‌های پرخطر گره تلفن را موقتاً مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام فرمان بومی `/talkvoice` است.
- `/card ...` پیش‌تنظیم‌های کارت غنی LINE را می‌فرستد. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` harness سرور-برنامهٔ Codex بسته‌بندی‌شده را بررسی و کنترل می‌کند. [Codex harness](/fa/plugins/codex-harness) را ببینید.
- فرمان‌های فقط QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### دستورهای پویای Skills

Skills قابل فراخوانی توسط کاربر نیز به‌صورت دستورهای اسلش در دسترس هستند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- وقتی Skill/Plugin آن‌ها را ثبت کند، Skills ممکن است به‌صورت دستورهای مستقیم مانند `/prose` نیز ظاهر شوند.
- ثبت بومی دستورهای Skill با `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- مشخصات دستور می‌تواند برای سطوح بومی‌ای که از توضیحات بومی‌سازی‌شده پشتیبانی می‌کنند، از جمله Discord، `descriptionLocalizations` ارائه کند.

<AccordionGroup>
  <Accordion title="نکات آرگومان و پارسر">
    - دستورها یک `:` اختیاری را بین دستور و آرگومان‌ها می‌پذیرند (مثلاً `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام یک ارائه‌دهنده را می‌پذیرد (تطبیق فازی)؛ اگر تطبیقی پیدا نشود، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل استفاده از ارائه‌دهنده، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و `configWrites` کانال را رعایت می‌کند.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدف‌گیری‌شده برای پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز `configWrites` حساب هدف را رعایت می‌کنند.
    - `/usage` پابرگ استفاده برای هر پاسخ را کنترل می‌کند؛ `/usage cost` یک خلاصه هزینه محلی را از لاگ‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌صورت پیش‌فرض فعال است؛ برای غیرفعال کردن آن، `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات Plugin را می‌پذیرد که `openclaw plugins install` می‌پذیرد: مسیر/آرشیو محلی، بسته npm، `git:<repo>`، یا `clawhub:<pkg>`، سپس چون ماژول‌های منبع Plugin تغییر کرده‌اند، درخواست راه‌اندازی دوباره Gateway می‌دهد.
    - `/plugins enable|disable` پیکربندی Plugin را به‌روزرسانی می‌کند و برای نوبت‌های جدید عامل، بارگذاری دوباره Plugin در Gateway را فعال می‌کند.

  </Accordion>
  <Accordion title="رفتار ویژه کانال">
    - دستور بومی فقط مخصوص Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال صوتی/استیج انتخاب‌شده نیاز دارد. به `channels.discord.voice` و دستورهای بومی نیاز دارد.
    - دستورهای اتصال رشته در Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های مؤثر رشته فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع دستور ACP و رفتار زمان اجرا: [عامل‌های ACP](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی verbose / trace / fast / reasoning">
    - `/verbose` برای اشکال‌زدایی و دیدپذیری بیشتر در نظر گرفته شده است؛ در استفاده عادی آن را **خاموش** نگه دارید.
    - `/trace` محدودتر از `/verbose` است: فقط خط‌های trace/debug متعلق به Plugin را آشکار می‌کند و گفت‌وگوی عادی ابزار در حالت verbose را خاموش نگه می‌دارد.
    - `/fast on|off` یک override نشست را پایدار می‌کند. برای پاک کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینه `inherit` در رابط کاربری Sessions استفاده کنید.
    - `/fast` ویژه ارائه‌دهنده است: OpenAI/OpenAI Codex آن را در نقاط پایانی بومی Responses به `service_tier=priority` نگاشت می‌کنند، در حالی که درخواست‌های عمومی مستقیم Anthropic، از جمله ترافیک احراز هویت‌شده با OAuth که به `api.anthropic.com` ارسال می‌شود، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های شکست ابزار همچنان وقتی مرتبط باشند نشان داده می‌شوند، اما متن جزئیات شکست فقط وقتی گنجانده می‌شود که `/verbose` برابر `on` یا `full` باشد.
    - `/reasoning`، `/verbose`، و `/trace` در محیط‌های گروهی پرریسک هستند: ممکن است استدلال داخلی، خروجی ابزار، یا عیب‌یابی‌های Plugin را که قصد آشکار کردنشان را نداشتید نشان دهند. بهتر است آن‌ها را خاموش نگه دارید، به‌ویژه در چت‌های گروهی.

  </Accordion>
  <Accordion title="تغییر مدل">
    - `/model` مدل جدید نشست را فوراً پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی بلافاصله از آن استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw یک تغییر زنده را در وضعیت در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش مجدد تمیز به مدل جدید راه‌اندازی مجدد می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت تلاش مجدد بعدی یا نوبت بعدی کاربر در صف باقی بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian برمی‌گردد. این از حالت نجات کانال پیام جدا است و اختیار پیکربندی از راه دور اعطا نمی‌کند.

  </Accordion>
  <Accordion title="مسیر سریع و میان‌برهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط-دستور از فرستندگان allowlistشده فوراً پردازش می‌شوند (صف + مدل را دور می‌زنند).
    - **گیت‌گذاری منشن گروهی:** پیام‌های فقط-دستور از فرستندگان allowlistشده الزامات منشن را دور می‌زنند.
    - **میان‌برهای درون‌خطی (فقط فرستندگان allowlistشده):** برخی دستورها وقتی در یک پیام عادی جاسازی شوند نیز کار می‌کنند و پیش از اینکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه می‌یابد.
    - در حال حاضر: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط-دستور غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="دستورهای Skill و آرگومان‌های بومی">
    - **دستورهای Skill:** Skills از نوع `user-invocable` به‌صورت دستورهای اسلش در دسترس قرار می‌گیرند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوند عددی می‌گیرند (مثلاً `_2`).
      - `/skill <name> [input]` یک Skill را با نام اجرا می‌کند (وقتی محدودیت‌های دستور بومی مانع دستورهای جداگانه برای هر Skill می‌شوند مفید است).
      - به‌صورت پیش‌فرض، دستورهای Skill به‌عنوان یک درخواست عادی به مدل ارسال می‌شوند.
      - Skills می‌توانند به‌صورت اختیاری `command-dispatch: tool` را اعلام کنند تا دستور مستقیماً به یک ابزار مسیریابی شود (قطعی، بدون مدل).
      - مثال: `/prose` (Plugin OpenProse) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های دستور بومی:** Discord از تکمیل خودکار برای گزینه‌های پویا استفاده می‌کند (و وقتی آرگومان‌های لازم را حذف کنید، از منوهای دکمه‌ای استفاده می‌کند). Telegram و Slack وقتی یک دستور از انتخاب‌ها پشتیبانی کند و شما آرگومان را حذف کنید، یک منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا بر اساس مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های ویژه مدل مانند سطح‌های `/think` از override آن نشست برای `/model` پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه یک پرسش پیکربندی: **این عامل همین حالا در این گفت‌وگو از چه چیزی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده است و برای مرور سریع بهینه شده است.
- `/tools verbose` توضیحات کوتاه اضافه می‌کند.
- سطوح دستور بومی که از آرگومان‌ها پشتیبانی می‌کنند همان تغییر حالت `compact|verbose` را ارائه می‌کنند.
- نتایج وابسته به نشست هستند، بنابراین تغییر عامل، کانال، رشته، مجوز فرستنده، یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` ابزارهایی را شامل می‌شود که واقعاً در زمان اجرا قابل دسترسی هستند، از جمله ابزارهای core، ابزارهای Plugin متصل، و ابزارهای متعلق به کانال.

برای ویرایش پروفایل و override، به‌جای اینکه `/tools` را به‌عنوان یک کاتالوگ ثابت در نظر بگیرید، از پنل Tools در Control UI یا سطوح پیکربندی/کاتالوگ استفاده کنید.

## سطوح استفاده (چه چیزی کجا نشان داده می‌شود)

- **کاربرد/سهمیهٔ ارائه‌دهنده** (مثال: «Claude 80% باقی‌مانده») در `/status` برای ارائه‌دهندهٔ مدل فعلی وقتی رهگیری مصرف فعال باشد نمایش داده می‌شود. OpenClaw پنجره‌های ارائه‌دهنده را به `% left` یکسان‌سازی می‌کند؛ برای MiniMax، فیلدهای درصدِ فقط-باقی‌مانده پیش از نمایش معکوس می‌شوند، و پاسخ‌های `model_remains` ورودی مدل چت به‌همراه یک برچسب طرحِ دارای برچسب مدل را ترجیح می‌دهند.
- **خطوط توکن/کش** در `/status` می‌توانند وقتی نمای لحظه‌ای نشست زنده کم‌داده باشد، به آخرین ورودی مصرف رونوشت برگردند. مقادیر زندهٔ غیرصفر موجود همچنان اولویت دارند، و fallback رونوشت همچنین می‌تواند برچسب مدل runtime فعال به‌همراه یک مجموع بزرگ‌ترِ متمرکز بر prompt را وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند بازیابی کند.
- **اجرا در برابر runtime:** `/status` مقدار `Execution` را برای مسیر sandbox مؤثر و `Runtime` را برای کسی که واقعاً نشست را اجرا می‌کند گزارش می‌کند: `OpenClaw Pi Default`، `OpenAI Codex`، یک backend CLI، یا یک backend ACP.
- **توکن/هزینهٔ هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی افزوده می‌شود).
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

نکته‌ها:

- `/model` و `/model list` یک انتخابگر فشرده و شماره‌دار نشان می‌دهند (خانوادهٔ مدل + ارائه‌دهندگان موجود).
- در Discord، `/model` و `/models` یک انتخابگر تعاملی با منوهای کشویی ارائه‌دهنده و مدل به‌همراه مرحلهٔ Submit باز می‌کنند. انتخابگر به `agents.defaults.models` احترام می‌گذارد، از جمله ورودی‌های `provider/*`، تا کشف محدود به ارائه‌دهنده بتواند انتخابگر را زیر سقف ۲۵ گزینه‌ای کامپوننت Discord نگه دارد.
- `/model <#>` از همان انتخابگر انتخاب می‌کند (و در صورت امکان ارائه‌دهندهٔ فعلی را ترجیح می‌دهد).
- `/model status` نمای تفصیلی را نشان می‌دهد، از جمله endpoint پیکربندی‌شدهٔ ارائه‌دهنده (`baseUrl`) و حالت API (`api`) وقتی موجود باشد.

## overrideهای اشکال‌زدایی

`/debug` به شما امکان می‌دهد overrideهای پیکربندی **فقط runtime** را تنظیم کنید (در حافظه، نه دیسک). فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

نمونه‌ها:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
overrideها فوراً روی خواندن‌های جدید پیکربندی اعمال می‌شوند، اما در `openclaw.json` نوشته نمی‌شوند. برای پاک کردن همهٔ overrideها و بازگشت به پیکربندی روی دیسک از `/debug reset` استفاده کنید.
</Note>

## خروجی trace Plugin

`/trace` به شما امکان می‌دهد **خطوط trace/debug محدود به نشست برای Plugin** را بدون روشن کردن حالت verbose کامل تغییر دهید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

نکته‌ها:

- `/trace` بدون آرگومان وضعیت trace نشست فعلی را نشان می‌دهد.
- `/trace on` خطوط trace Plugin را برای نشست فعلی فعال می‌کند.
- `/trace off` دوباره آن‌ها را غیرفعال می‌کند.
- خطوط trace Plugin می‌توانند در `/status` و به‌صورت یک پیام تشخیصیِ پیگیری پس از پاسخ عادی assistant ظاهر شوند.
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
پیکربندی پیش از نوشتن اعتبارسنجی می‌شود؛ تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config` پس از restart نیز باقی می‌مانند.
</Note>

## به‌روزرسانی‌های MCP

`/mcp` تعریف‌های server مربوط به MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌نویسد. فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.mcp: true` فعال کنید.

نمونه‌ها:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه در تنظیمات پروژهٔ متعلق به Pi. adapterهای runtime تصمیم می‌گیرند کدام transportها واقعاً قابل اجرا هستند.
</Note>

## به‌روزرسانی‌های Plugin

`/plugins` به operatorها امکان می‌دهد Pluginهای کشف‌شده را بررسی کنند و فعال‌سازی را در پیکربندی تغییر دهند. جریان‌های فقط خواندنی می‌توانند از `/plugin` به‌عنوان alias استفاده کنند. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.plugins: true` فعال کنید.

نمونه‌ها:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` و `/plugins show` کشف واقعی Plugin را روی workspace فعلی به‌همراه پیکربندی روی دیسک انجام می‌دهند.
- `/plugins install` از ClawHub، npm، git، دایرکتوری‌های محلی و archiveها نصب می‌کند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Pluginها را نصب یا حذف نصب نمی‌کند.
- تغییرات فعال‌سازی و غیرفعال‌سازی، سطح‌های runtime مربوط به Gateway Plugin را برای نوبت‌های جدید agent به‌صورت hot-reload به‌روزرسانی می‌کنند؛ install درخواست restart کردن Gateway را می‌دهد چون ماژول‌های source Plugin تغییر کرده‌اند.

</Note>

## نکته‌های سطح

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **دستورهای متنی** در نشست چت عادی اجرا می‌شوند (DMها `main` را به‌اشتراک می‌گذارند، گروه‌ها نشست خودشان را دارند).
    - **دستورهای native** از نشست‌های جدا استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (نشست چت را از طریق `CommandTargetSessionKey` هدف می‌گیرد)
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا بتواند اجرای فعلی را متوقف کند.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand` همچنان برای یک دستور واحد به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر دستور داخلی یک دستور slash در Slack بسازید (هم‌نام با `/help`). منوهای آرگومان دستور برای Slack به‌صورت دکمه‌های ephemeral در Block Kit تحویل داده می‌شوند.

    استثنای native در Slack: `/agentstatus` را ثبت کنید (نه `/status`) چون Slack، `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع دربارهٔ نشست فعلی است. `/side` یک alias است.

برخلاف چت عادی:

- از نشست فعلی به‌عنوان زمینهٔ پس‌زمینه استفاده می‌کند،
- به‌صورت یک فراخوانی one-shot جداگانه و **بدون ابزار** اجرا می‌شود،
- زمینهٔ آیندهٔ نشست را تغییر نمی‌دهد،
- در تاریخچهٔ رونوشت نوشته نمی‌شود،
- به‌جای پیام عادی assistant، به‌صورت نتیجهٔ جانبی زنده تحویل داده می‌شود.

این باعث می‌شود `/btw` وقتی به یک شفاف‌سازی موقت نیاز دارید و در همان حال کار اصلی ادامه دارد، مفید باشد.

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
