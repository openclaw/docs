---
read_when:
    - استفاده از فرمان‌های چت یا پیکربندی آن‌ها
    - اشکال‌زدایی مسیریابی فرمان‌ها یا مجوزها
sidebarTitle: Slash commands
summary: 'دستورهای اسلش: متنی در برابر بومی، پیکربندی و دستورهای پشتیبانی‌شده'
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-04-29T23:46:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b9a4bf0106df4d8397737976ddd4df665d80709892b686d71978d8a3bafae0
    source_path: tools/slash-commands.md
    workflow: 16
---

دستورها توسط Gateway مدیریت می‌شوند. بیشتر دستورها باید به‌صورت یک پیام **مستقل** ارسال شوند که با `/` شروع می‌شود. دستور گفت‌وگوی bash فقط برای میزبان از `! <cmd>` استفاده می‌کند (`/bash <cmd>` هم به‌عنوان نام مستعار آن است).

وقتی یک گفت‌وگو یا رشته به یک نشست ACP متصل باشد، متن‌های پیگیری عادی به همان مهار ACP هدایت می‌شوند. دستورهای مدیریتی Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به گرداننده دستور ACP در OpenClaw می‌رسد، و `/status` به‌همراه `/unfocus` هر زمان که مدیریت دستور برای سطح فعال باشد محلی می‌مانند.

دو سامانه مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="Commands">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directiveها پیش از آنکه مدل پیام را ببیند از پیام حذف می‌شوند.
    - در پیام‌های گفت‌وگوی عادی (نه فقط-Directive)، آن‌ها به‌عنوان «راهنمای درون‌خطی» در نظر گرفته می‌شوند و تنظیمات نشست را **ماندگار** نمی‌کنند.
    - در پیام‌های فقط-Directive (پیامی که فقط شامل Directiveهاست)، در نشست ماندگار می‌شوند و با یک تأیید پاسخ می‌دهند.
    - Directiveها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، تنها allowlist استفاده‌شده همان است؛ در غیر این صورت مجوز از allowlistها/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` می‌آید. فرستندگان غیرمجاز Directiveها را به‌صورت متن ساده می‌بینند.

  </Accordion>
  <Accordion title="Inline shortcuts">
    فقط فرستندگان allowlistشده/مجاز: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    آن‌ها فوراً اجرا می‌شوند، پیش از آنکه مدل پیام را ببیند حذف می‌شوند، و متن باقی‌مانده از جریان عادی ادامه پیدا می‌کند.

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
  تحلیل `/...` را در پیام‌های گفت‌وگو فعال می‌کند. روی سطح‌هایی که دستورهای native ندارند (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، دستورهای متنی حتی اگر این گزینه را روی `false` بگذارید همچنان کار می‌کنند.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  دستورهای native را ثبت می‌کند. Auto: برای Discord/Telegram روشن؛ برای Slack خاموش (تا زمانی که slash commandها را اضافه کنید)؛ برای ارائه‌دهندگانی که پشتیبانی native ندارند نادیده گرفته می‌شود. برای بازنویسی به‌ازای هر ارائه‌دهنده (bool یا `"auto"`)، `channels.discord.commands.native`، `channels.telegram.commands.native`، یا `channels.slack.commands.native` را تنظیم کنید. `false` دستورهایی را که قبلاً در Discord/Telegram ثبت شده‌اند هنگام راه‌اندازی پاک می‌کند. دستورهای Slack در برنامه Slack مدیریت می‌شوند و به‌طور خودکار حذف نمی‌شوند.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  هنگام پشتیبانی، دستورهای **skill** را به‌صورت native ثبت می‌کند. Auto: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack نیاز دارد برای هر skill یک slash command ساخته شود). برای بازنویسی به‌ازای هر ارائه‌دهنده (bool یا `"auto"`)، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills`، یا `channels.slack.commands.nativeSkills` را تنظیم کنید.
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>` را برای اجرای دستورهای shell میزبان فعال می‌کند (`/bash <cmd>` نام مستعار آن است؛ به allowlistهای `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash چه مدت منتظر بماند پیش از آنکه به حالت پس‌زمینه تغییر کند (`0` بلافاصله آن را به پس‌زمینه می‌برد).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` را فعال می‌کند (پیکربندی MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند/می‌نویسد).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` را فعال می‌کند (کشف/وضعیت plugin به‌همراه کنترل‌های نصب و فعال/غیرفعال‌سازی).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` را فعال می‌کند (بازنویسی‌های فقط زمان اجرا).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` را به‌همراه کنش‌های ابزار راه‌اندازی مجدد gateway فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  allowlist صریح مالک را برای سطح‌های دستور/ابزار فقط-مالک تنظیم می‌کند. این همان حساب اپراتور انسانی است که می‌تواند کنش‌های خطرناک را تأیید کند و دستورهایی مانند `/diagnostics`، `/export-trajectory`، و `/config` را اجرا کند. این مورد از `commands.allowFrom` و از دسترسی جفت‌سازی DM جداست.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  به‌ازای هر کانال: باعث می‌شود دستورهای فقط-مالک برای اجرا روی آن سطح به **هویت مالک** نیاز داشته باشند. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک حل‌شده مطابق باشد (برای مثال یک ورودی در `commands.ownerAllowFrom` یا فراداده مالک native ارائه‌دهنده) یا روی یک کانال پیام داخلی، scope داخلی `operator.admin` داشته باشد. یک ورودی wildcard در `allowFrom` کانال، یا فهرست خالی/حل‌نشده نامزدهای مالک، کافی **نیست** — دستورهای فقط-مالک در آن کانال به‌صورت fail closed شکست می‌خورند. اگر می‌خواهید دستورهای فقط-مالک فقط با `ownerAllowFrom` و allowlistهای استاندارد دستور محدود شوند، این گزینه را خاموش بگذارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در اعلان سیستم ظاهر شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  به‌صورت اختیاری secret مربوط به HMAC را که هنگام `commands.ownerDisplay="hash"` استفاده می‌شود تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  allowlist به‌ازای هر ارائه‌دهنده برای مجوزدهی دستور. وقتی پیکربندی شود، تنها منبع مجوزدهی برای دستورها و Directiveهاست (allowlistها/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). از `"*"` برای پیش‌فرض سراسری استفاده کنید؛ کلیدهای ویژه ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، allowlistها/سیاست‌ها را برای دستورها اعمال می‌کند.
</ParamField>

## فهرست دستورها

منبع حقیقت فعلی:

- دستورهای داخلی core از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- دستورهای dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- دستورهای plugin از فراخوانی‌های `registerCommand()` در plugin می‌آیند
- در دسترس بودن واقعی روی gateway شما همچنان به پرچم‌های پیکربندی، سطح کانال، و pluginهای نصب‌شده/فعال‌شده بستگی دارد

### دستورهای داخلی core

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` یک نشست جدید شروع می‌کند؛ `/reset` نام مستعار بازنشانی است.
    - `/reset soft [message]` رونوشت فعلی را نگه می‌دارد، شناسه‌های نشست backend مربوط به CLI که دوباره استفاده شده‌اند را حذف می‌کند، و بارگذاری startup/system-prompt را درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` زمینه نشست را compact می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را لغو می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال رشته را مدیریت می‌کنند.
    - `/export-session [path]` نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` درخواست تأیید exec می‌کند، سپس یک [بسته trajectory](/fa/tools/trajectory) با قالب JSONL برای نشست فعلی صادر می‌کند. وقتی برای یک نشست OpenClaw به جدول زمانی اعلان، ابزار، و رونوشت نیاز دارید از آن استفاده کنید. در گفت‌وگوهای گروهی، اعلان تأیید و نتیجه خروجی به‌صورت خصوصی برای مالک ارسال می‌شود. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` سطح تفکر را تنظیم می‌کند. گزینه‌ها از پروفایل ارائه‌دهنده مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium`، و `high` هستند، و سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max`، یا حالت دودویی `on` فقط جایی که پشتیبانی شود وجود دارند. نام‌های مستعار: `/thinking`, `/t`.
    - `/verbose on|off|full` خروجی verbose را تغییر می‌دهد. نام مستعار: `/v`.
    - `/trace on|off` خروجی trace مربوط به plugin را برای نشست فعلی تغییر می‌دهد.
    - `/fast [status|on|off]` حالت fast را نشان می‌دهد یا تنظیم می‌کند.
    - `/reasoning [on|off|stream]` نمایانی استدلال را تغییر می‌دهد. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را تغییر می‌دهد. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نشان می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نشان می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` ارائه‌دهندگان یا مدل‌های پیکربندی‌شده/دارای مجوز در دسترس را برای یک ارائه‌دهنده فهرست می‌کند؛ برای مرور کاتالوگ کامل آن ارائه‌دهنده، `all` را اضافه کنید.
    - `/queue <mode>` رفتار صف را مدیریت می‌کند (`steer`، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی نشست را پاک می‌کند. [صف دستور](/fa/concepts/queue) را ببینید.

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` خلاصه کوتاه راهنما را نشان می‌دهد.
    - `/commands` کاتالوگ دستور تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد agent فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا را، از جمله برچسب‌های `Execution`/`Runtime` و مصرف/سهمیه ارائه‌دهنده در صورت وجود، نشان می‌دهد.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط-مالک برای باگ‌های Gateway و اجراهای مهار Codex است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` درخواست تأیید صریح exec می‌کند؛ diagnostics را با قانون allow-all تأیید نکنید. پس از تأیید، گزارشی قابل چسباندن با مسیر بسته محلی، خلاصه manifest، نکات حریم خصوصی، و شناسه‌های نشست مرتبط ارسال می‌کند. در گفت‌وگوهای گروهی، اعلان تأیید و گزارش به‌صورت خصوصی برای مالک ارسال می‌شوند. وقتی نشست فعال از مهار OpenAI Codex استفاده می‌کند، همان تأیید همچنین بازخورد مرتبط Codex را به سرورهای OpenAI می‌فرستد و پاسخ تکمیل‌شده شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و دستورهای `codex resume <thread-id>` را فهرست می‌کند. [صادرات Diagnostics](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` کمک‌یار راه‌اندازی و تعمیر Crestodian را از یک DM مالک اجرا می‌کند.
    - `/tasks` کارهای پس‌زمینه فعال/اخیر را برای نشست فعلی فهرست می‌کند.
    - `/context [list|detail|json]` توضیح می‌دهد زمینه چگونه ساخته می‌شود.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` پاصفحه مصرف به‌ازای هر پاسخ را کنترل می‌کند یا یک خلاصه هزینه محلی چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` یک skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` ورودی‌های allowlist را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` اعلان‌های تأیید exec را حل می‌کند.
    - `/btw <question>` یک پرسش جانبی می‌پرسد بدون اینکه زمینه نشست‌های آینده را تغییر دهد. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="Subagents and ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجراهای sub-agent را برای نشست فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند.
    - `/focus <target>` رشته فعلی Discord یا موضوع/گفت‌وگوی Telegram را به یک هدف نشست متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` agentهای متصل به رشته را برای نشست فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک sub-agent در حال اجرا یا همه آن‌ها را لغو می‌کند.
    - `/steer <id|#> <message>` هدایت را به یک sub-agent در حال اجرا ارسال می‌کند. نام مستعار: `/tell`.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت Plugin را بررسی یا تغییر می‌دهد. `/plugin` نام مستعار است. نوشتن‌ها فقط برای مالک. به `commands.plugins: true` نیاز دارد.
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

### فرمان‌های dock تولیدشده

فرمان‌های dock مسیر پاسخ نشست فعلی را به کانال پیوندخورده دیگری تغییر می‌دهند. برای راه‌اندازی، نمونه‌ها و عیب‌یابی، [Docking کانال](/fa/concepts/channel-docking) را ببینید.

فرمان‌های dock از Pluginهای کانال با پشتیبانی از فرمان بومی تولید می‌شوند. مجموعه همراه فعلی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از فرمان‌های dock در یک گفت‌وگوی مستقیم استفاده کنید تا مسیر پاسخ نشست فعلی را به کانال پیوندخورده دیگری تغییر دهید. عامل همان زمینه نشست را نگه می‌دارد، اما پاسخ‌های آینده آن نشست به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

فرمان‌های dock به `session.identityLinks` نیاز دارند. فرستنده مبدأ و همتای مقصد باید در یک گروه هویتی باشند، برای نمونه `["telegram:123", "discord:456"]`. اگر کاربر Telegram با شناسه `123` فرمان `/dock_discord` را بفرستد، OpenClaw مقدار `lastChannel: "discord"` و `lastTo: "456"` را روی نشست فعال ذخیره می‌کند. اگر فرستنده به یک همتای Discord پیوند نشده باشد، فرمان به‌جای عبور به گفت‌وگوی عادی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

Docking فقط مسیر نشست فعال را تغییر می‌دهد. حساب‌های کانال ایجاد نمی‌کند، دسترسی اعطا نمی‌کند، فهرست‌های مجاز کانال را دور نمی‌زند، یا تاریخچه رونوشت را به نشست دیگری منتقل نمی‌کند. برای تغییر دوباره مسیر، از `/dock-telegram`، `/dock-slack`، `/dock-mattermost`، یا فرمان dock تولیدشده دیگری استفاده کنید.

### فرمان‌های Plugin همراه

Pluginهای همراه می‌توانند فرمان‌های اسلش بیشتری اضافه کنند. فرمان‌های همراه فعلی در این مخزن:

- `/dreaming [on|off|status|help]`، Dreaming حافظه را روشن یا خاموش می‌کند. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [جفت‌سازی](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` فرمان‌های پرخطر نود تلفن را موقتاً مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام فرمان بومی `/talkvoice` است.
- `/card ...` پیش‌تنظیم‌های کارت غنی LINE را ارسال می‌کند. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` چارچوب app-server همراه Codex را بررسی و کنترل می‌کند. [چارچوب Codex](/fa/plugins/codex-harness) را ببینید.
- فرمان‌های فقط QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### فرمان‌های پویای Skill

Skills قابل فراخوانی توسط کاربر نیز به‌صورت فرمان‌های اسلش ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills همچنین ممکن است وقتی Skill/Plugin آن‌ها را ثبت می‌کند، به‌صورت فرمان‌های مستقیم مانند `/prose` ظاهر شوند.
- ثبت فرمان بومی Skill با `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.

<AccordionGroup>
  <Accordion title="نکات آرگومان و تجزیه‌گر">
    - فرمان‌ها یک `:` اختیاری بین فرمان و آرگومان‌ها می‌پذیرند (مثلاً `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model`، یا نام ارائه‌دهنده را می‌پذیرد (تطبیق تقریبی)؛ اگر تطبیقی نباشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل مصرف ارائه‌دهنده، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و `configWrites` کانال را رعایت می‌کند.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدف‌گذاری‌شده برای پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز `configWrites` حساب هدف را رعایت می‌کنند.
    - `/usage` پاورقی مصرف هر پاسخ را کنترل می‌کند؛ `/usage cost` یک خلاصه هزینه محلی را از گزارش‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌صورت پیش‌فرض فعال است؛ برای غیرفعال‌کردن آن `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات Plugin را می‌پذیرد که `openclaw plugins install` می‌پذیرد: مسیر/آرشیو محلی، بسته npm، یا `clawhub:<pkg>`.
    - `/plugins enable|disable` پیکربندی Plugin را به‌روزرسانی می‌کند و ممکن است درخواست راه‌اندازی مجدد بدهد.

  </Accordion>
  <Accordion title="رفتار ویژه کانال">
    - فرمان بومی فقط Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال صوتی/stage انتخاب‌شده نیاز دارد. به `channels.discord.voice` و فرمان‌های بومی نیاز دارد.
    - فرمان‌های اتصال رشته Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های مؤثر رشته فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع فرمان ACP و رفتار زمان اجرا: [عامل‌های ACP](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی verbose / trace / fast / reasoning">
    - `/verbose` برای اشکال‌زدایی و دیدپذیری بیشتر است؛ در استفاده عادی آن را **خاموش** نگه دارید.
    - `/trace` از `/verbose` محدودتر است: فقط خط‌های trace/debug متعلق به Plugin را آشکار می‌کند و پرگویی عادی ابزارها را خاموش نگه می‌دارد.
    - `/fast on|off` یک بازنویسی نشست را پایدار می‌کند. برای پاک‌کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینه `inherit` در UI نشست‌ها استفاده کنید.
    - `/fast` ویژه ارائه‌دهنده است: OpenAI/OpenAI Codex آن را روی نقاط پایانی بومی Responses به `service_tier=priority` نگاشت می‌کنند، در حالی‌که درخواست‌های عمومی مستقیم Anthropic، از جمله ترافیک احراز هویت‌شده با OAuth که به `api.anthropic.com` فرستاده می‌شود، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های خرابی ابزار همچنان وقتی مرتبط باشند نشان داده می‌شوند، اما متن جزئی خرابی فقط وقتی گنجانده می‌شود که `/verbose` برابر `on` یا `full` باشد.
    - `/reasoning`، `/verbose` و `/trace` در محیط‌های گروهی پرخطر هستند: ممکن است استدلال داخلی، خروجی ابزار، یا عیب‌یابی Plugin را که قصد افشایش را نداشتید آشکار کنند. ترجیحاً آن‌ها را خاموش بگذارید، به‌ویژه در گفت‌وگوهای گروهی.

  </Accordion>
  <Accordion title="تغییر مدل">
    - `/model` مدل نشست جدید را بلافاصله پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی فوراً از آن استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw یک تغییر زنده را در حالت در انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش مجدد تمیز با مدل جدید راه‌اندازی مجدد می‌شود.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت تلاش مجدد بعدی یا نوبت بعدی کاربر در صف بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian برمی‌گردد. این از حالت نجات کانال پیام جداست و اختیار پیکربندی راه‌دور اعطا نمی‌کند.

  </Accordion>
  <Accordion title="مسیر سریع و میانبرهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط فرمان از فرستندگان موجود در فهرست مجاز فوراً مدیریت می‌شوند (دورزدن صف + مدل).
    - **دروازه‌گذاری اشاره گروهی:** پیام‌های فقط فرمان از فرستندگان موجود در فهرست مجاز نیازمندی‌های اشاره را دور می‌زنند.
    - **میانبرهای درون‌خطی (فقط فرستندگان موجود در فهرست مجاز):** بعضی فرمان‌ها وقتی در یک پیام عادی جاسازی شوند نیز کار می‌کنند و پیش از دیده‌شدن متن باقی‌مانده توسط مدل حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه می‌یابد.
    - در حال حاضر: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط فرمان غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="فرمان‌های Skill و آرگومان‌های بومی">
    - **فرمان‌های Skill:** Skills از نوع `user-invocable` به‌صورت فرمان‌های اسلش ارائه می‌شوند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوند عددی می‌گیرند (مثلاً `_2`).
      - `/skill <name> [input]` یک Skill را با نام اجرا می‌کند (زمانی مفید است که محدودیت‌های فرمان بومی مانع فرمان‌های جداگانه برای هر Skill می‌شوند).
      - به‌صورت پیش‌فرض، فرمان‌های Skill به‌عنوان درخواست عادی به مدل ارسال می‌شوند.
      - Skills می‌توانند به‌صورت اختیاری `command-dispatch: tool` را اعلام کنند تا فرمان را مستقیماً به یک ابزار مسیر‌دهی کنند (قطعی، بدون مدل).
      - مثال: `/prose` (Plugin OpenProse) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های فرمان بومی:** Discord برای گزینه‌های پویا از تکمیل خودکار استفاده می‌کند (و وقتی آرگومان‌های الزامی را حذف کنید از منوهای دکمه‌ای). Telegram و Slack وقتی یک فرمان از انتخاب‌ها پشتیبانی کند و آرگومان را حذف کنید، یک منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا نسبت به مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های ویژه مدل مانند سطح‌های `/think` از بازنویسی `/model` همان نشست پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه یک پرسش پیکربندی: **این عامل همین حالا در این گفت‌وگو از چه چیزی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده و برای اسکن سریع بهینه شده است.
- `/tools verbose` توضیح‌های کوتاه اضافه می‌کند.
- سطح‌های فرمان بومی که از آرگومان‌ها پشتیبانی می‌کنند همان تغییر حالت `compact|verbose` را ارائه می‌دهند.
- نتایج در محدوده نشست هستند، بنابراین تغییر عامل، کانال، رشته، مجوز فرستنده، یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` شامل ابزارهایی است که واقعاً در زمان اجرا قابل دسترسی هستند، از جمله ابزارهای هسته، ابزارهای Plugin متصل، و ابزارهای متعلق به کانال.

برای ویرایش پروفایل و بازنویسی، به‌جای تلقی‌کردن `/tools` به‌عنوان یک کاتالوگ ایستا، از پنل Tools در Control UI یا سطح‌های پیکربندی/کاتالوگ استفاده کنید.

## سطح‌های مصرف (چه چیزی کجا نشان داده می‌شود)

- **مصرف/سهمیه ارائه‌دهنده** (مثال: "Claude 80% left") در `/status` برای ارائه‌دهنده مدل فعلی وقتی ردیابی مصرف فعال باشد نشان داده می‌شود. OpenClaw پنجره‌های ارائه‌دهنده را به `% left` نرمال‌سازی می‌کند؛ برای MiniMax، فیلدهای درصد فقط باقی‌مانده پیش از نمایش معکوس می‌شوند، و پاسخ‌های `model_remains` ورودی مدل گفت‌وگو را به‌همراه برچسب طرح دارای برچسب مدل ترجیح می‌دهند.
- **خط‌های توکن/کش** در `/status` می‌توانند وقتی snapshot نشست زنده کم‌داده است، به تازه‌ترین ورودی مصرف رونوشت برگردند. مقدارهای زنده غیرصفر موجود همچنان برنده‌اند، و fallback رونوشت همچنین می‌تواند برچسب مدل زمان اجرای فعال به‌همراه یک مجموع بزرگ‌ترِ متمرکز بر prompt را وقتی مجموع‌های ذخیره‌شده گم شده‌اند یا کوچک‌ترند بازیابی کند.
- **اجرا در برابر زمان اجرا:** `/status`، `Execution` را برای مسیر sandbox مؤثر و `Runtime` را برای این‌که واقعاً چه کسی نشست را اجرا می‌کند گزارش می‌دهد: `OpenClaw Pi Default`، `OpenAI Codex`، یک backend CLI، یا یک backend ACP.
- **توکن‌ها/هزینه هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی افزوده می‌شود).
- `/model status` درباره **مدل‌ها/احراز هویت/نقاط پایانی** است، نه مصرف.

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

- `/model` و `/model list` یک انتخاب‌گر فشرده و شماره‌دار نشان می‌دهند (خانواده مدل + ارائه‌دهندگان موجود).
- در Discord، `/model` و `/models` یک انتخاب‌گر تعاملی با فهرست‌های کشویی ارائه‌دهنده و مدل به‌همراه مرحله Submit باز می‌کنند.
- `/model <#>` از همان انتخاب‌گر انتخاب می‌کند (و وقتی ممکن باشد ارائه‌دهنده فعلی را ترجیح می‌دهد).
- `/model status` نمای جزئیات را نشان می‌دهد، از جمله نقطه پایانی ارائه‌دهنده پیکربندی‌شده (`baseUrl`) و حالت API (`api`) وقتی موجود باشد.

## بازنویسی‌های Debug

`/debug` به شما اجازه می‌دهد بازنویسی‌های پیکربندی **فقط در زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک). فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

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

## خروجی ردگیری Plugin

`/trace` به شما اجازه می‌دهد **خط‌های ردگیری/اشکال‌زدایی Plugin در محدوده نشست** را بدون فعال کردن حالت کامل verbose روشن یا خاموش کنید.

نمونه‌ها:

```text
/trace
/trace on
/trace off
```

نکته‌ها:

- `/trace` بدون آرگومان، وضعیت فعلی ردگیری نشست را نشان می‌دهد.
- `/trace on` خط‌های ردگیری Plugin را برای نشست فعلی فعال می‌کند.
- `/trace off` دوباره آن‌ها را غیرفعال می‌کند.
- خط‌های ردگیری Plugin می‌توانند در `/status` و به‌صورت یک پیام تشخیصی پیگیری پس از پاسخ عادی دستیار ظاهر شوند.
- `/trace` جایگزین `/debug` نمی‌شود؛ `/debug` همچنان بازنویسی‌های پیکربندی فقط در زمان اجرا را مدیریت می‌کند.
- `/trace` جایگزین `/verbose` نمی‌شود؛ خروجی عادی ابزار/وضعیت verbose همچنان متعلق به `/verbose` است.

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
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه در تنظیمات پروژه متعلق به Pi. آداپتورهای زمان اجرا تصمیم می‌گیرند کدام انتقال‌ها واقعا قابل اجرا هستند.
</Note>

## به‌روزرسانی‌های Plugin

`/plugins` به اپراتورها اجازه می‌دهد Plugin‌های کشف‌شده را بررسی کنند و فعال‌سازی را در پیکربندی روشن یا خاموش کنند. جریان‌های فقط‌خواندنی می‌توانند از `/plugin` به‌عنوان نام مستعار استفاده کنند. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.plugins: true` فعال کنید.

نمونه‌ها:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` و `/plugins show` کشف واقعی Plugin را روی فضای کاری فعلی به‌همراه پیکربندی روی دیسک اجرا می‌کنند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Plugin‌ها را نصب یا حذف نصب نمی‌کند.
- پس از تغییرات فعال/غیرفعال‌سازی، Gateway را برای اعمال آن‌ها راه‌اندازی مجدد کنید.

</Note>

## نکته‌های سطح

<AccordionGroup>
  <Accordion title="نشست‌ها برای هر سطح">
    - **دستورهای متنی** در نشست عادی چت اجرا می‌شوند (پیام‌های مستقیم `main` را مشترک استفاده می‌کنند، گروه‌ها نشست خودشان را دارند).
    - **دستورهای بومی** از نشست‌های ایزوله استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (نشست چت را از طریق `CommandTargetSessionKey` هدف می‌گیرد)
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا بتواند اجرای فعلی را متوقف کند.

  </Accordion>
  <Accordion title="جزئیات Slack">
    `channels.slack.slashCommand` همچنان برای یک دستور به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر دستور داخلی یک دستور slash در Slack ایجاد کنید (با همان نام‌های `/help`). منوهای آرگومان دستور برای Slack به‌صورت دکمه‌های موقت Block Kit تحویل داده می‌شوند.

    استثنای بومی Slack: `/agentstatus` را ثبت کنید (نه `/status`) چون Slack، `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع درباره نشست فعلی است.

برخلاف چت عادی:

- از نشست فعلی به‌عنوان زمینه پس‌زمینه استفاده می‌کند،
- به‌صورت یک فراخوانی یک‌باره جداگانه **بدون ابزار** اجرا می‌شود،
- زمینه نشست‌های آینده را تغییر نمی‌دهد،
- در تاریخچه رونوشت نوشته نمی‌شود،
- به‌جای یک پیام عادی دستیار، به‌صورت نتیجه جانبی زنده تحویل داده می‌شود.

این باعث می‌شود `/btw` زمانی مفید باشد که هنگام ادامه داشتن کار اصلی، یک شفاف‌سازی موقت می‌خواهید.

نمونه:

```text
/btw what are we doing right now?
```

برای رفتار کامل و جزئیات تجربه کاربری کلاینت، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## مرتبط

- [ایجاد Skills](/fa/tools/creating-skills)
- [Skills](/fa/tools/skills)
- [پیکربندی Skills](/fa/tools/skills-config)
