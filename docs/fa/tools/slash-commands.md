---
read_when:
    - استفاده از دستورهای چت یا پیکربندی آن‌ها
    - اشکال‌زدایی مسیریابی فرمان یا مجوزها
sidebarTitle: Slash commands
summary: 'دستورات اسلش: متن در برابر بومی، پیکربندی و دستورات پشتیبانی‌شده'
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-05-04T02:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49eb41674c8d0a01dbd28a2df783eb9aba3dde18d8425951a266cede825e9a84
    source_path: tools/slash-commands.md
    workflow: 16
---

دستورات توسط Gateway مدیریت می‌شوند. بیشتر دستورات باید به‌صورت پیام **مستقل** که با `/` شروع می‌شود فرستاده شوند. دستور گفت‌وگوی bash فقط مخصوص میزبان از `! <cmd>` استفاده می‌کند (`/bash <cmd>` به‌عنوان نام مستعار).

وقتی یک گفت‌وگو یا رشته به یک نشست ACP متصل باشد، متن‌های پیگیری عادی به همان مهار ACP هدایت می‌شوند. دستورات مدیریتی Gateway همچنان محلی می‌مانند: `/acp ...` همیشه به گرداننده دستور ACP در OpenClaw می‌رسد، و `/status` به‌همراه `/unfocus` هر زمان که مدیریت دستور برای سطح فعال باشد محلی می‌مانند.

دو سامانه مرتبط وجود دارد:

<AccordionGroup>
  <Accordion title="دستورات">
    پیام‌های مستقل `/...`.
  </Accordion>
  <Accordion title="رهنمودها">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - رهنمودها پیش از آنکه مدل پیام را ببیند، از پیام حذف می‌شوند.
    - در پیام‌های گفت‌وگوی عادی (نه فقط-رهنمود)، آن‌ها به‌عنوان «راهنمای درون‌خطی» در نظر گرفته می‌شوند و تنظیمات نشست را پایدار نمی‌کنند.
    - در پیام‌های فقط-رهنمود (پیامی که فقط شامل رهنمودهاست)، در نشست پایدار می‌شوند و با تأییدیه پاسخ می‌دهند.
    - رهنمودها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom` تنظیم شده باشد، تنها فهرست مجاز استفاده‌شده همان است؛ در غیر این صورت مجوز از فهرست‌های مجاز/جفت‌سازی کانال به‌همراه `commands.useAccessGroups` به‌دست می‌آید. فرستندگان غیرمجاز می‌بینند که رهنمودها به‌عنوان متن ساده تلقی می‌شوند.

  </Accordion>
  <Accordion title="میان‌برهای درون‌خطی">
    فقط فرستندگان در فهرست مجاز/مجاز: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

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
  پردازش `/...` را در پیام‌های گفت‌وگو فعال می‌کند. روی سطوحی که دستورهای بومی ندارند (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، دستورهای متنی حتی اگر این گزینه را روی `false` بگذارید همچنان کار می‌کنند.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  دستورهای بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (تا زمانی که دستورهای اسلش را اضافه کنید)؛ برای ارائه‌دهندگانی که پشتیبانی بومی ندارند نادیده گرفته می‌شود. برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.native`، `channels.telegram.commands.native`، یا `channels.slack.commands.native` را تنظیم کنید (بولی یا `"auto"`). در Discord، مقدار `false` ثبت دستور اسلش و پاک‌سازی هنگام راه‌اندازی را رد می‌کند؛ دستورهایی که قبلاً ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید همچنان قابل مشاهده بمانند. دستورهای Slack در برنامه Slack مدیریت می‌شوند و به‌طور خودکار حذف نمی‌شوند.
</ParamField>
در Discord، مشخصات دستور بومی می‌تواند شامل `descriptionLocalizations` باشد که OpenClaw آن را به‌صورت `description_localizations` در Discord منتشر می‌کند و در مقایسه‌های تطبیق نیز لحاظ می‌کند.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  وقتی پشتیبانی شود، دستورهای **skill** را به‌صورت بومی ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش (Slack نیاز دارد برای هر skill یک دستور اسلش ایجاد شود). برای بازنویسی به‌ازای هر ارائه‌دهنده، `channels.discord.commands.nativeSkills`، `channels.telegram.commands.nativeSkills`، یا `channels.slack.commands.nativeSkills` را تنظیم کنید (بولی یا `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  اجرای دستورهای پوسته میزبان با `! <cmd>` را فعال می‌کند (`/bash <cmd>` یک نام مستعار است؛ به فهرست‌های مجاز `tools.elevated` نیاز دارد).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  کنترل می‌کند bash پیش از تغییر به حالت پس‌زمینه چه مدت منتظر بماند (`0` بلافاصله به پس‌زمینه می‌رود).
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
  `/restart` را به‌همراه اقدام‌های ابزار راه‌اندازی مجدد Gateway فعال می‌کند.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک را برای سطح‌های دستور/ابزار فقط مخصوص مالک تنظیم می‌کند. این حساب انسانیِ اپراتور است که می‌تواند اقدام‌های خطرناک را تأیید کند و دستورهایی مانند `/diagnostics`، `/export-trajectory`، و `/config` را اجرا کند. این از `commands.allowFrom` و از دسترسی جفت‌سازی پیام مستقیم جداست.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  به‌ازای هر کانال: باعث می‌شود اجرای دستورهای فقط مخصوص مالک روی آن سطح به **هویت مالک** نیاز داشته باشد. وقتی `true` باشد، فرستنده باید یا با یک نامزد مالک حل‌شده مطابقت داشته باشد (برای مثال، ورودی‌ای در `commands.ownerAllowFrom` یا فراداده مالک بومی ارائه‌دهنده) یا در یک کانال پیام داخلی، دامنه داخلی `operator.admin` را داشته باشد. یک ورودی wildcard در `allowFrom` کانال، یا فهرست خالی/حل‌نشده از نامزدهای مالک، کافی **نیست** — دستورهای فقط مخصوص مالک در آن کانال به‌صورت پیش‌فرض بسته شکست می‌خورند. اگر می‌خواهید دستورهای فقط مخصوص مالک فقط با `ownerAllowFrom` و فهرست‌های مجاز استاندارد دستور کنترل شوند، این گزینه را خاموش بگذارید.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  کنترل می‌کند شناسه‌های مالک چگونه در اعلان سیستم ظاهر شوند.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  در صورت نیاز، راز HMAC استفاده‌شده هنگام `commands.ownerDisplay="hash"` را تنظیم می‌کند.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز به‌ازای هر ارائه‌دهنده برای مجوز دستور. وقتی پیکربندی شود، تنها منبع مجوز برای دستورها و رهنمودهاست (فهرست‌های مجاز/جفت‌سازی کانال و `commands.useAccessGroups` نادیده گرفته می‌شوند). برای پیش‌فرض سراسری از `"*"` استفاده کنید؛ کلیدهای مخصوص ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای دستورها اعمال می‌کند.
</ParamField>

## فهرست دستورها

منبع حقیقت فعلی:

- دستورهای داخلی هسته از `src/auto-reply/commands-registry.shared.ts` می‌آیند
- دستورهای dock تولیدشده از `src/auto-reply/commands-registry.data.ts` می‌آیند
- دستورهای plugin از فراخوانی‌های `registerCommand()` مربوط به plugin می‌آیند
- دسترس‌پذیری واقعی روی gateway شما همچنان به پرچم‌های پیکربندی، سطح کانال، و pluginهای نصب‌شده/فعال بستگی دارد

### دستورهای داخلی هسته

<AccordionGroup>
  <Accordion title="نشست‌ها و اجراها">
    - `/new [model]` یک نشست جدید شروع می‌کند؛ `/reset` نام مستعار بازنشانی است.
    - Control UI، `/new` تایپ‌شده را رهگیری می‌کند تا یک نشست داشبورد تازه بسازد و به آن سوییچ کند؛ `/reset` تایپ‌شده همچنان بازنشانی درجا در Gateway را اجرا می‌کند.
    - `/reset soft [message]` رونوشت فعلی را نگه می‌دارد، شناسه‌های نشست backend CLI بازاستفاده‌شده را حذف می‌کند، و بارگذاری راه‌اندازی/اعلان سیستم را درجا دوباره اجرا می‌کند.
    - `/compact [instructions]` زمینه نشست را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید.
    - `/stop` اجرای فعلی را متوقف می‌کند.
    - `/session idle <duration|off>` و `/session max-age <duration|off>` انقضای اتصال رشته را مدیریت می‌کنند.
    - `/export-session [path]` نشست فعلی را به HTML صادر می‌کند. نام مستعار: `/export`.
    - `/export-trajectory [path]` درخواست تأیید exec می‌کند، سپس یک [بسته trajectory](/fa/tools/trajectory) JSONL برای نشست فعلی صادر می‌کند. وقتی برای یک نشست OpenClaw به خط زمانی اعلان، ابزار، و رونوشت نیاز دارید از آن استفاده کنید. در گفت‌وگوهای گروهی، اعلان تأیید و نتیجه صدور به‌صورت خصوصی برای مالک ارسال می‌شود. نام مستعار: `/trajectory`.

  </Accordion>
  <Accordion title="مدل و کنترل‌های اجرا">
    - `/think <level>` سطح تفکر را تنظیم می‌کند. گزینه‌ها از نمایه ارائه‌دهنده مدل فعال می‌آیند؛ سطح‌های رایج `off`، `minimal`، `low`، `medium`، و `high` هستند، همراه با سطح‌های سفارشی مانند `xhigh`، `adaptive`، `max`، یا دودویی `on` فقط در جایی که پشتیبانی شود. نام‌های مستعار: `/thinking`، `/t`.
    - `/verbose on|off|full` خروجی پرجزئیات را تغییر وضعیت می‌دهد. نام مستعار: `/v`.
    - `/trace on|off` خروجی ردگیری plugin را برای نشست فعلی تغییر وضعیت می‌دهد.
    - `/fast [status|on|off]` حالت سریع را نشان می‌دهد یا تنظیم می‌کند.
    - `/reasoning [on|off|stream]` نمایانی استدلال را تغییر وضعیت می‌دهد. نام مستعار: `/reason`.
    - `/elevated [on|off|ask|full]` حالت elevated را تغییر وضعیت می‌دهد. نام مستعار: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` پیش‌فرض‌های exec را نشان می‌دهد یا تنظیم می‌کند.
    - `/model [name|#|status]` مدل را نشان می‌دهد یا تنظیم می‌کند.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` ارائه‌دهندگان یا مدل‌های پیکربندی‌شده/دارای احراز هویت در دسترس را برای یک ارائه‌دهنده فهرست می‌کند؛ برای مرور کل کاتالوگ آن ارائه‌دهنده، `all` را اضافه کنید.
    - `/queue <mode>` رفتار صف را مدیریت می‌کند (`steer`، `queue` قدیمی، `followup`، `collect`، `steer-backlog`، `interrupt`) به‌همراه گزینه‌هایی مانند `debounce:0.5s cap:25 drop:summarize`؛ `/queue default` یا `/queue reset` بازنویسی نشست را پاک می‌کند. [صف دستور](/fa/concepts/queue) و [صف هدایت](/fa/concepts/queue-steering) را ببینید.
    - `/steer <message>` راهنمایی را برای نشست فعلی به اجرای فعال تزریق می‌کند، مستقل از حالت `/queue`. وقتی نشست بیکار است اجرای جدیدی شروع نمی‌کند. نام مستعار: `/tell`. [Steer](/fa/tools/steer) را ببینید.

  </Accordion>
  <Accordion title="کشف و وضعیت">
    - `/help` خلاصه راهنمای کوتاه را نشان می‌دهد.
    - `/commands` کاتالوگ دستور تولیدشده را نشان می‌دهد.
    - `/tools [compact|verbose]` نشان می‌دهد عامل فعلی همین حالا از چه چیزهایی می‌تواند استفاده کند.
    - `/status` وضعیت اجرا/زمان اجرا را نشان می‌دهد، شامل برچسب‌های `Execution`/`Runtime` و مصرف/سهمیه ارائه‌دهنده وقتی در دسترس باشد.
    - `/diagnostics [note]` جریان گزارش پشتیبانی فقط مخصوص مالک برای خطاهای Gateway و اجراهای مهار Codex است. هر بار پیش از اجرای `openclaw gateway diagnostics export --json` تأیید صریح exec می‌خواهد؛ diagnostics را با قاعده allow-all تأیید نکنید. پس از تأیید، گزارشی قابل جای‌گذاری شامل مسیر بسته محلی، خلاصه manifest، نکات حریم خصوصی، و شناسه‌های نشست مرتبط ارسال می‌کند. در گفت‌وگوهای گروهی، اعلان تأیید و گزارش به‌صورت خصوصی برای مالک ارسال می‌شوند. وقتی نشست فعال از مهار OpenAI Codex استفاده می‌کند، همان تأیید همچنین بازخورد مرتبط Codex را به سرورهای OpenAI می‌فرستد و پاسخ کامل‌شده شناسه‌های نشست OpenClaw، شناسه‌های رشته Codex، و دستورهای `codex resume <thread-id>` را فهرست می‌کند. [صدور Diagnostics](/fa/gateway/diagnostics) را ببینید.
    - `/crestodian <request>` کمک‌یار راه‌اندازی و تعمیر Crestodian را از پیام مستقیم مالک اجرا می‌کند.
    - `/tasks` کارهای پس‌زمینه فعال/اخیر را برای نشست فعلی فهرست می‌کند.
    - `/context [list|detail|json]` توضیح می‌دهد زمینه چگونه مونتاژ می‌شود.
    - `/whoami` شناسه فرستنده شما را نشان می‌دهد. نام مستعار: `/id`.
    - `/usage off|tokens|full|cost` پاورقی مصرف به‌ازای هر پاسخ را کنترل می‌کند یا خلاصه هزینه محلی را چاپ می‌کند.

  </Accordion>
  <Accordion title="Skills، فهرست‌های مجاز، تأییدها">
    - `/skill <name> [input]` یک skill را با نام اجرا می‌کند.
    - `/allowlist [list|add|remove] ...` ورودی‌های فهرست مجاز را مدیریت می‌کند. فقط متنی.
    - `/approve <id> <decision>` اعلان‌های تأیید exec را حل می‌کند.
    - `/btw <question>` بدون تغییر زمینه نشست‌های آینده، یک پرسش جانبی می‌پرسد. نام مستعار: `/side`. [BTW](/fa/tools/btw) را ببینید.

  </Accordion>
  <Accordion title="زیرعامل‌ها و ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` اجرای زیرعامل‌ها را برای نشست فعلی مدیریت می‌کند.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` نشست‌های ACP و گزینه‌های زمان اجرا را مدیریت می‌کند.
    - `/focus <target>` رشته فعلی Discord یا موضوع/گفت‌وگوی Telegram را به یک هدف نشست متصل می‌کند.
    - `/unfocus` اتصال فعلی را حذف می‌کند.
    - `/agents` عامل‌های وابسته به رشته را برای نشست فعلی فهرست می‌کند.
    - `/kill <id|#|all>` یک یا همه زیرعامل‌های در حال اجرا را متوقف می‌کند.
    - `/subagents steer <id|#> <message>` هدایت را به یک زیرعامل در حال اجرا می‌فرستد. [هدایت](/fa/tools/steer) را ببینید.

  </Accordion>
  <Accordion title="نوشتن‌های فقط مالک و مدیریت">
    - `/config show|get|set|unset` فایل `openclaw.json` را می‌خواند یا می‌نویسد. فقط مالک. به `commands.config: true` نیاز دارد.
    - `/mcp show|get|set|unset` پیکربندی سرور MCP مدیریت‌شده توسط OpenClaw را زیر `mcp.servers` می‌خواند یا می‌نویسد. فقط مالک. به `commands.mcp: true` نیاز دارد.
    - `/plugins list|inspect|show|get|install|enable|disable` وضعیت Plugin را بررسی یا تغییر می‌دهد. `/plugin` یک نام مستعار است. نوشتن‌ها فقط برای مالک است. به `commands.plugins: true` نیاز دارد.
    - `/debug show|set|unset|reset` بازنویسی‌های پیکربندی فقط در زمان اجرا را مدیریت می‌کند. فقط مالک. به `commands.debug: true` نیاز دارد.
    - `/restart` وقتی فعال باشد OpenClaw را بازراه‌اندازی می‌کند. پیش‌فرض: فعال؛ برای غیرفعال‌کردن آن `commands.restart: false` را تنظیم کنید.
    - `/send on|off|inherit` سیاست ارسال را تنظیم می‌کند. فقط مالک.

  </Accordion>
  <Accordion title="صدا، TTS و کنترل کانال">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` TTS را کنترل می‌کند. [TTS](/fa/tools/tts) را ببینید.
    - `/activation mention|always` حالت فعال‌سازی گروه را تنظیم می‌کند.
    - `/bash <command>` یک دستور پوسته میزبان را اجرا می‌کند. فقط متنی. نام مستعار: `! <command>`. به `commands.bash: true` به‌همراه فهرست‌های مجاز `tools.elevated` نیاز دارد.
    - `!poll [sessionId]` یک کار bash پس‌زمینه را بررسی می‌کند.
    - `!stop [sessionId]` یک کار bash پس‌زمینه را متوقف می‌کند.

  </Accordion>
</AccordionGroup>

### دستورهای داک تولیدشده

دستورهای داک مسیر پاسخ نشست فعلی را به یک کانال پیوندخورده دیگر تغییر می‌دهند. برای راه‌اندازی، مثال‌ها و عیب‌یابی، [داک‌کردن کانال](/fa/concepts/channel-docking) را ببینید.

دستورهای داک از Pluginهای کانالی که از دستور بومی پشتیبانی می‌کنند تولید می‌شوند. مجموعه بسته‌بندی‌شده فعلی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

از دستورهای داک در یک گفت‌وگوی مستقیم استفاده کنید تا مسیر پاسخ نشست فعلی را به یک کانال پیوندخورده دیگر تغییر دهید. عامل همان زمینه نشست را نگه می‌دارد، اما پاسخ‌های آینده برای آن نشست به همتای کانال انتخاب‌شده تحویل داده می‌شوند.

دستورهای داک به `session.identityLinks` نیاز دارند. فرستنده مبدا و همتای هدف باید در یک گروه هویتی باشند، برای مثال `["telegram:123", "discord:456"]`. اگر کاربر Telegram با شناسه `123` دستور `/dock_discord` را بفرستد، OpenClaw مقدار `lastChannel: "discord"` و `lastTo: "456"` را روی نشست فعال ذخیره می‌کند. اگر فرستنده به همتای Discord پیوند نشده باشد، دستور به‌جای ادامه به گفت‌وگوی عادی، با یک راهنمای راه‌اندازی پاسخ می‌دهد.

داک‌کردن فقط مسیر نشست فعال را تغییر می‌دهد. حساب کانال ایجاد نمی‌کند، دسترسی نمی‌دهد، فهرست‌های مجاز کانال را دور نمی‌زند، یا تاریخچه رونوشت را به نشست دیگری منتقل نمی‌کند. برای تغییر دوباره مسیر از `/dock-telegram`، `/dock-slack`، `/dock-mattermost` یا دستور داک تولیدشده دیگری استفاده کنید.

### دستورهای Plugin بسته‌بندی‌شده

Pluginهای بسته‌بندی‌شده می‌توانند دستورهای اسلش بیشتری اضافه کنند. دستورهای بسته‌بندی‌شده فعلی در این مخزن:

- `/dreaming [on|off|status|help]` Dreaming حافظه را روشن یا خاموش می‌کند. [Dreaming](/fa/concepts/dreaming) را ببینید.
- `/pair [qr|status|pending|approve|cleanup|notify]` جریان جفت‌سازی/راه‌اندازی دستگاه را مدیریت می‌کند. [جفت‌سازی](/fa/channels/pairing) را ببینید.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` دستورهای پرخطر گره تلفن را موقتاً مسلح می‌کند.
- `/voice status|list [limit]|set <voiceId|name>` پیکربندی صدای Talk را مدیریت می‌کند. در Discord، نام دستور بومی `/talkvoice` است.
- `/card ...` پیش‌تنظیم‌های کارت غنی LINE را می‌فرستد. [LINE](/fa/channels/line) را ببینید.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` مهار کارساز برنامه Codex بسته‌بندی‌شده را بررسی و کنترل می‌کند. [مهار Codex](/fa/plugins/codex-harness) را ببینید.
- دستورهای فقط QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### دستورهای پویای Skills

Skills قابل‌فراخوانی توسط کاربر نیز به‌عنوان دستورهای اسلش ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطه ورود عمومی کار می‌کند.
- Skills همچنین ممکن است وقتی Skill/Plugin آن‌ها را ثبت می‌کند، به‌صورت دستورهای مستقیم مانند `/prose` ظاهر شوند.
- ثبت دستور بومی Skills با `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- مشخصات دستور می‌توانند برای سطح‌های بومی که از توضیحات بومی‌سازی‌شده پشتیبانی می‌کنند، از جمله Discord، `descriptionLocalizations` ارائه کنند.

<AccordionGroup>
  <Accordion title="یادداشت‌های آرگومان و تجزیه‌گر">
    - دستورها یک `:` اختیاری بین دستور و آرگومان‌ها می‌پذیرند (مانند `/think: high`، `/send: on`، `/help:`).
    - `/new <model>` یک نام مستعار مدل، `provider/model` یا نام ارائه‌دهنده را می‌پذیرد (تطبیق تقریبی)؛ اگر تطبیقی وجود نداشته باشد، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - برای تفکیک کامل مصرف ارائه‌دهنده، از `openclaw status --usage` استفاده کنید.
    - `/allowlist add|remove` به `commands.config=true` نیاز دارد و `configWrites` کانال را رعایت می‌کند.
    - در کانال‌های چندحسابی، `/allowlist --account <id>` هدف‌گیری‌شده برای پیکربندی و `/config set channels.<provider>.accounts.<id>...` نیز `configWrites` حساب هدف را رعایت می‌کنند.
    - `/usage` پاورقی مصرف برای هر پاسخ را کنترل می‌کند؛ `/usage cost` یک خلاصه هزینه محلی را از گزارش‌های نشست OpenClaw چاپ می‌کند.
    - `/restart` به‌طور پیش‌فرض فعال است؛ برای غیرفعال‌کردن آن `commands.restart: false` را تنظیم کنید.
    - `/plugins install <spec>` همان مشخصات Plugin را می‌پذیرد که `openclaw plugins install` می‌پذیرد: مسیر/آرشیو محلی، بسته npm، `git:<repo>`، یا `clawhub:<pkg>`، سپس درخواست بازراه‌اندازی Gateway می‌دهد چون ماژول‌های منبع Plugin تغییر کرده‌اند.
    - `/plugins enable|disable` پیکربندی Plugin را به‌روزرسانی می‌کند و بارگذاری دوباره Pluginهای Gateway را برای نوبت‌های جدید عامل فعال می‌کند.

  </Accordion>
  <Accordion title="رفتار ویژه کانال">
    - دستور بومی فقط Discord: `/vc join|leave|status` کانال‌های صوتی را کنترل می‌کند (به‌صورت متن در دسترس نیست). `join` به یک guild و کانال voice/stage انتخاب‌شده نیاز دارد. به `channels.discord.voice` و دستورهای بومی نیاز دارد.
    - دستورهای اتصال رشته Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) نیاز دارند اتصال‌های مؤثر رشته فعال باشند (`session.threadBindings.enabled` و/یا `channels.discord.threadBindings.enabled`).
    - مرجع دستور ACP و رفتار زمان اجرا: [عامل‌های ACP](/fa/tools/acp-agents).

  </Accordion>
  <Accordion title="ایمنی verbose / trace / fast / reasoning">
    - `/verbose` برای اشکال‌زدایی و دیدپذیری بیشتر در نظر گرفته شده است؛ در استفاده عادی آن را **خاموش** نگه دارید.
    - `/trace` از `/verbose` محدودتر است: فقط خط‌های trace/debug متعلق به Plugin را آشکار می‌کند و پرحرفی عادی ابزار را خاموش نگه می‌دارد.
    - `/fast on|off` یک بازنویسی نشست را پایدار می‌کند. برای پاک‌کردن آن و بازگشت به پیش‌فرض‌های پیکربندی، از گزینه `inherit` در رابط کاربری Sessions استفاده کنید.
    - `/fast` وابسته به ارائه‌دهنده است: OpenAI/OpenAI Codex آن را در نقاط پایانی بومی Responses به `service_tier=priority` نگاشت می‌کنند، درحالی‌که درخواست‌های عمومی مستقیم Anthropic، از جمله ترافیک احراز‌هویت‌شده با OAuth که به `api.anthropic.com` فرستاده می‌شود، آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند. [OpenAI](/fa/providers/openai) و [Anthropic](/fa/providers/anthropic) را ببینید.
    - خلاصه‌های شکست ابزار همچنان وقتی مرتبط باشند نمایش داده می‌شوند، اما متن تفصیلی شکست فقط وقتی شامل می‌شود که `/verbose` برابر `on` یا `full` باشد.
    - `/reasoning`، `/verbose` و `/trace` در محیط‌های گروهی پرخطر هستند: ممکن است استدلال داخلی، خروجی ابزار یا عیب‌یابی‌های Plugin را که قصد افشای آن‌ها را نداشتید آشکار کنند. ترجیحاً آن‌ها را خاموش نگه دارید، به‌ویژه در گفت‌وگوهای گروهی.

  </Accordion>
  <Accordion title="تغییر مدل">
    - `/model` مدل جدید نشست را بلافاصله پایدار می‌کند.
    - اگر عامل بیکار باشد، اجرای بعدی فوراً از آن استفاده می‌کند.
    - اگر اجرایی از قبل فعال باشد، OpenClaw تغییر زنده را در حالت انتظار علامت‌گذاری می‌کند و فقط در یک نقطه تلاش مجدد تمیز با مدل جدید بازراه‌اندازی می‌کند.
    - اگر فعالیت ابزار یا خروجی پاسخ از قبل شروع شده باشد، تغییر در انتظار می‌تواند تا فرصت تلاش مجدد بعدی یا نوبت بعدی کاربر در صف بماند.
    - در TUI محلی، `/crestodian [request]` از TUI عادی عامل به Crestodian برمی‌گردد. این از حالت نجات کانال پیام جداست و اختیار پیکربندی از راه دور نمی‌دهد.

  </Accordion>
  <Accordion title="مسیر سریع و میان‌برهای درون‌خطی">
    - **مسیر سریع:** پیام‌های فقط‌دستور از فرستندگان موجود در فهرست مجازها فوراً رسیدگی می‌شوند (صف + مدل را دور می‌زنند).
    - **الزام منشن گروهی:** پیام‌های فقط‌دستور از فرستندگان موجود در فهرست مجازها الزام منشن را دور می‌زنند.
    - **میان‌برهای درون‌خطی (فقط فرستندگان موجود در فهرست مجازها):** برخی دستورها همچنین وقتی در یک پیام عادی جاسازی شده باشند کار می‌کنند و پیش از اینکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.
      - مثال: `hey /status` یک پاسخ وضعیت را فعال می‌کند، و متن باقی‌مانده از جریان عادی ادامه می‌یابد.
    - در حال حاضر: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - پیام‌های فقط‌دستور غیرمجاز بی‌صدا نادیده گرفته می‌شوند، و توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="دستورهای Skills و آرگومان‌های بومی">
    - **دستورهای Skills:** Skills از نوع `user-invocable` به‌عنوان دستورهای اسلش ارائه می‌شوند. نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر ۳۲ نویسه)؛ برخوردها پسوند عددی می‌گیرند (مانند `_2`).
      - `/skill <name> [input]` یک Skill را با نام اجرا می‌کند (وقتی محدودیت‌های دستور بومی مانع دستور جداگانه برای هر Skill می‌شوند، مفید است).
      - به‌طور پیش‌فرض، دستورهای Skills به‌عنوان درخواست عادی به مدل فرستاده می‌شوند.
      - Skills می‌توانند به‌صورت اختیاری `command-dispatch: tool` را اعلام کنند تا دستور مستقیماً به یک ابزار مسیریابی شود (قطعی، بدون مدل).
      - مثال: `/prose` (Plugin OpenProse) — [OpenProse](/fa/prose) را ببینید.
    - **آرگومان‌های دستور بومی:** Discord برای گزینه‌های پویا از تکمیل خودکار استفاده می‌کند (و وقتی آرگومان‌های الزامی را حذف کنید، از منوهای دکمه‌ای استفاده می‌کند). Telegram و Slack وقتی یک دستور از انتخاب‌ها پشتیبانی کند و شما آرگومان را حذف کنید، یک منوی دکمه‌ای نشان می‌دهند. انتخاب‌های پویا نسبت به مدل نشست هدف حل می‌شوند، بنابراین گزینه‌های ویژه مدل مانند سطح‌های `/think` از بازنویسی `/model` همان نشست پیروی می‌کنند.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` به یک پرسش زمان اجرا پاسخ می‌دهد، نه پرسش پیکربندی: **این عامل همین حالا در این گفت‌وگو از چه چیزی می‌تواند استفاده کند**.

- `/tools` پیش‌فرض فشرده و برای مرور سریع بهینه شده است.
- `/tools verbose` توضیحات کوتاه اضافه می‌کند.
- سطح‌های دستور بومی که از آرگومان‌ها پشتیبانی می‌کنند همان تغییر حالت را به‌صورت `compact|verbose` ارائه می‌کنند.
- نتایج در محدوده نشست هستند، بنابراین تغییر عامل، کانال، رشته، مجوز فرستنده یا مدل می‌تواند خروجی را تغییر دهد.
- `/tools` ابزارهایی را شامل می‌شود که واقعاً در زمان اجرا قابل دسترسی‌اند، از جمله ابزارهای هسته، ابزارهای Plugin متصل، و ابزارهای متعلق به کانال.

برای ویرایش پروفایل و بازنویسی‌ها، به‌جای اینکه `/tools` را به‌عنوان یک کاتالوگ ایستا در نظر بگیرید، از پنل Tools در Control UI یا سطح‌های پیکربندی/کاتالوگ استفاده کنید.

## سطح‌های مصرف (چه چیزی کجا نمایش داده می‌شود)

- **مصرف/سهمیهٔ ارائه‌دهنده** (مثال: "Claude 80% left") وقتی رهگیری مصرف فعال باشد، برای ارائه‌دهندهٔ مدل فعلی در `/status` نمایش داده می‌شود. OpenClaw پنجره‌های ارائه‌دهنده را به `% left` عادی‌سازی می‌کند؛ برای MiniMax، فیلدهای درصدِ فقط باقی‌مانده پیش از نمایش وارونه می‌شوند، و پاسخ‌های `model_remains` ورودی مدل چت به‌همراه برچسب طرحِ برچسب‌خورده با مدل را ترجیح می‌دهند.
- **خطوط توکن/کش** در `/status` وقتی نمای فوری نشست زنده کم‌جزئیات باشد، می‌توانند به آخرین ورودی مصرف رونوشت بازگردند. مقدارهای زندهٔ غیرصفر موجود همچنان اولویت دارند، و بازگشت به رونوشت همچنین می‌تواند برچسب مدل زمان اجرای فعال به‌همراه یک مجموع بزرگ‌ترِ متمرکز بر پرامپت را وقتی مجموع‌های ذخیره‌شده وجود ندارند یا کوچک‌ترند بازیابی کند.
- **اجرا در برابر زمان اجرا:** `/status` مقدار `Execution` را برای مسیر sandbox مؤثر و `Runtime` را برای کسی که واقعاً نشست را اجرا می‌کند گزارش می‌دهد: `OpenClaw Pi Default`، `OpenAI Codex`، یک بک‌اند CLI، یا یک بک‌اند ACP.
- **توکن/هزینه برای هر پاسخ** با `/usage off|tokens|full` کنترل می‌شود (به پاسخ‌های عادی افزوده می‌شود).
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

نکته‌ها:

- `/model` و `/model list` یک انتخاب‌گر فشرده و شماره‌دار نشان می‌دهند (خانوادهٔ مدل + ارائه‌دهندگان موجود).
- در Discord، `/model` و `/models` یک انتخاب‌گر تعاملی با منوهای کشویی ارائه‌دهنده و مدل به‌همراه مرحلهٔ Submit باز می‌کنند.
- `/model <#>` از همان انتخاب‌گر انتخاب می‌کند (و هر وقت ممکن باشد ارائه‌دهندهٔ فعلی را ترجیح می‌دهد).
- `/model status` نمای جزئیات را نشان می‌دهد، شامل نقطهٔ پایانی پیکربندی‌شدهٔ ارائه‌دهنده (`baseUrl`) و حالت API (`api`) وقتی موجود باشد.

## بازنویسی‌های اشکال‌زدایی

`/debug` به شما اجازه می‌دهد بازنویسی‌های پیکربندی **فقط زمان اجرا** را تنظیم کنید (در حافظه، نه روی دیسک). فقط مالک. به‌صورت پیش‌فرض غیرفعال است؛ با `commands.debug: true` فعال کنید.

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

`/trace` به شما اجازه می‌دهد **خطوط ردگیری/اشکال‌زدایی Plugin در محدودهٔ نشست** را بدون روشن‌کردن حالت کاملاً پرجزئیات تغییر وضعیت دهید.

مثال‌ها:

```text
/trace
/trace on
/trace off
```

نکته‌ها:

- `/trace` بدون آرگومان وضعیت ردگیری نشست فعلی را نشان می‌دهد.
- `/trace on` خطوط ردگیری Plugin را برای نشست فعلی فعال می‌کند.
- `/trace off` دوباره آن‌ها را غیرفعال می‌کند.
- خطوط ردگیری Plugin می‌توانند در `/status` و به‌صورت یک پیام تشخیصی پیگیری پس از پاسخ عادی دستیار ظاهر شوند.
- `/trace` جایگزین `/debug` نیست؛ `/debug` همچنان بازنویسی‌های پیکربندی فقط زمان اجرا را مدیریت می‌کند.
- `/trace` جایگزین `/verbose` نیست؛ خروجی عادی ابزار/وضعیتِ پرجزئیات همچنان متعلق به `/verbose` است.

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
پیکربندی پیش از نوشتن اعتبارسنجی می‌شود؛ تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config` در میان راه‌اندازی‌های دوباره پایدار می‌مانند.
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
`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه در تنظیمات پروژهٔ متعلق به Pi. آداپتورهای زمان اجرا تصمیم می‌گیرند کدام انتقال‌ها واقعاً قابل اجرا هستند.
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
- `/plugins list` و `/plugins show` از کشف واقعی Plugin در فضای کاری فعلی به‌همراه پیکربندی روی دیسک استفاده می‌کنند.
- `/plugins install` از ClawHub، npm، git، دایرکتوری‌های محلی، و آرشیوها نصب می‌کند.
- `/plugins enable|disable` فقط پیکربندی Plugin را به‌روزرسانی می‌کند؛ Pluginها را نصب یا حذف نصب نمی‌کند.
- تغییرات فعال‌سازی و غیرفعال‌سازی، سطوح زمان اجرای Plugin در Gateway را برای نوبت‌های جدید عامل به‌صورت بارگذاری مجدد داغ اعمال می‌کنند؛ درخواست نصب به راه‌اندازی دوبارهٔ Gateway نیاز دارد، چون ماژول‌های منبع Plugin تغییر کرده‌اند.

</Note>

## نکته‌های سطح

<AccordionGroup>
  <Accordion title="نشست‌ها برای هر سطح">
    - **دستورهای متنی** در نشست چت عادی اجرا می‌شوند (پیام‌های مستقیم `main` را به اشتراک می‌گذارند، گروه‌ها نشست خودشان را دارند).
    - **دستورهای بومی** از نشست‌های ایزوله استفاده می‌کنند:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل پیکربندی است)
      - Telegram: `telegram:slash:<userId>` (از طریق `CommandTargetSessionKey` نشست چت را هدف می‌گیرد)
    - **`/stop`** نشست چت فعال را هدف می‌گیرد تا بتواند اجرای فعلی را متوقف کند.

  </Accordion>
  <Accordion title="جزئیات Slack">
    `channels.slack.slashCommand` همچنان برای یک دستور تک‌تایی به سبک `/openclaw` پشتیبانی می‌شود. اگر `commands.native` را فعال کنید، باید برای هر دستور داخلی یک دستور اسلش Slack بسازید (همان نام‌ها مانند `/help`). منوهای آرگومان دستور برای Slack به‌صورت دکمه‌های موقت Block Kit تحویل داده می‌شوند.

    استثنای بومی Slack: `/agentstatus` را ثبت کنید (نه `/status`)، چون Slack `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.

  </Accordion>
</AccordionGroup>

## پرسش‌های جانبی BTW

`/btw` یک **پرسش جانبی** سریع دربارهٔ نشست فعلی است. `/side` یک نام مستعار است.

برخلاف چت عادی:

- از نشست فعلی به‌عنوان زمینهٔ پس‌زمینه استفاده می‌کند،
- به‌صورت یک فراخوانی جداگانهٔ یک‌بارهٔ **بدون ابزار** اجرا می‌شود،
- زمینهٔ آیندهٔ نشست را تغییر نمی‌دهد،
- در تاریخچهٔ رونوشت نوشته نمی‌شود،
- به‌جای یک پیام عادی دستیار، به‌صورت یک نتیجهٔ جانبی زنده تحویل داده می‌شود.

این باعث می‌شود `/btw` زمانی مفید باشد که در حین ادامهٔ کار اصلی، یک شفاف‌سازی موقت می‌خواهید.

مثال:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

برای رفتار کامل و جزئیات UX کلاینت، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## مرتبط

- [ایجاد Skills](/fa/tools/creating-skills)
- [Skills](/fa/tools/skills)
- [پیکربندی Skills](/fa/tools/skills-config)
