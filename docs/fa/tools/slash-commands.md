---
read_when:
    - استفاده یا پیکربندی فرمان‌های چت
    - اشکال‌زدایی مسیریابی فرمان‌ها یا مجوزها
    - درک نحوه ثبت فرمان‌های Skills
sidebarTitle: Slash commands
summary: همهٔ فرمان‌های اسلش، دستورالعمل‌ها و میان‌برهای درون‌خطی موجود — پیکربندی، مسیریابی و رفتار مختص هر رابط.
title: دستورهای اسلش
x-i18n:
    generated_at: "2026-07-16T17:35:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway فرمان‌هایی را مدیریت می‌کند که به‌صورت پیام‌های مستقل و با `/` در آغاز ارسال می‌شوند.
فرمان‌های bash مختص میزبان از `! <cmd>` استفاده می‌کنند (با `/bash <cmd>` به‌عنوان نام مستعار).

هنگامی که مکالمه‌ای به یک نشست ACP متصل است، متن عادی به
سامانهٔ اجرایی ACP هدایت می‌شود. فرمان‌های مدیریت Gateway محلی باقی می‌مانند: `/acp ...` همیشه به
مدیریت‌کنندهٔ فرمان OpenClaw می‌رسد و `/status` به‌همراه `/unfocus` هرگاه
مدیریت فرمان برای سطح فعال باشد، محلی باقی می‌مانند.

## سه نوع فرمان

<CardGroup cols={3}>
  <Card title="فرمان‌ها" icon="terminal">
    پیام‌های مستقل `/...` که Gateway آن‌ها را مدیریت می‌کند. باید به‌عنوان
    تنها محتوای پیام ارسال شوند.
  </Card>
  <Card title="دستورالعمل‌ها" icon="sliders">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`،
    `/exec`، `/model`، `/queue` — پیش از آنکه مدل پیام را
    ببیند، از آن حذف می‌شوند. وقتی به‌تنهایی ارسال شوند، تنظیمات نشست را ماندگار می‌کنند؛
    وقتی همراه متن دیگری ارسال شوند، به‌صورت راهنمای درون‌خطی عمل می‌کنند.
  </Card>
  <Card title="میان‌برهای درون‌خطی" icon="bolt">
    `/help`، `/commands`، `/status`، `/whoami` — بلافاصله اجرا می‌شوند و
    پیش از آنکه مدل متن باقی‌مانده را ببیند، حذف می‌شوند. فقط فرستندگان مجاز.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="جزئیات رفتار دستورالعمل‌ها">
    - دستورالعمل‌ها پیش از آنکه مدل پیام را ببیند، از آن حذف می‌شوند.
    - در پیام‌های **فقط دستورالعمل** (پیام فقط شامل دستورالعمل‌ها است)، آن‌ها
      در نشست ماندگار می‌شوند و با تأییدیه پاسخ داده می‌شوند.
    - در پیام‌های **گفت‌وگوی عادی** که متن دیگری دارند، به‌صورت راهنمای درون‌خطی عمل می‌کنند و
      تنظیمات نشست را ماندگار **نمی‌کنند**.
    - دستورالعمل‌ها فقط برای **فرستندگان مجاز** اعمال می‌شوند. اگر `commands.allowFrom`
      تنظیم شده باشد، تنها فهرست مجاز مورداستفاده است؛ در غیر این صورت، مجوز از
      فهرست‌های مجاز کانال/جفت‌سازی به‌همراه `commands.useAccessGroups` می‌آید. برای فرستندگان
      غیرمجاز، دستورالعمل‌ها به‌عنوان متن ساده در نظر گرفته می‌شوند.
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
  تجزیهٔ `/...` را در پیام‌های گفت‌وگو فعال می‌کند. در سطوح فاقد فرمان‌های بومی
  (WhatsApp، WebChat، Signal، iMessage، Google Chat، Microsoft Teams)، فرمان‌های
  متنی حتی در صورت تنظیم روی `false` نیز کار می‌کنند.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  فرمان‌های بومی را ثبت می‌کند. خودکار: برای Discord/Telegram روشن؛ برای Slack خاموش؛
  برای ارائه‌دهندگان فاقد پشتیبانی بومی نادیده گرفته می‌شود. برای هر کانال با
  `channels.<provider>.commands.native` بازنویسی کنید. در Discord، `false` ثبت فرمان
  اسلش را رد می‌کند؛ فرمان‌های ثبت‌شدهٔ قبلی ممکن است تا زمان حذف، قابل‌مشاهده بمانند.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  در صورت پشتیبانی، فرمان‌های مهارت را به‌صورت بومی ثبت می‌کند. خودکار: برای
  Discord/Telegram روشن؛ برای Slack خاموش. با
  `channels.<provider>.commands.nativeSkills` بازنویسی کنید.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  اجرای فرمان‌های پوستهٔ میزبان را با `! <cmd>` فعال می‌کند (نام مستعار `/bash <cmd>`). به
  فهرست‌های مجاز `tools.elevated` نیاز دارد.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  مدت‌زمان انتظار bash پیش از تغییر به حالت پس‌زمینه را تعیین می‌کند (`0` بلافاصله
  به پس‌زمینه می‌رود).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` را فعال می‌کند (`openclaw.json` را می‌خواند/می‌نویسد). فقط مالک.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` را فعال می‌کند (پیکربندی MCP تحت مدیریت OpenClaw را در `mcp.servers` می‌خواند/می‌نویسد). فقط مالک.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` را فعال می‌کند (کشف/وضعیت Plugin به‌همراه نصب و فعال/غیرفعال‌سازی). نوشتن فقط برای مالک.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` را فعال می‌کند (بازنویسی‌های پیکربندی فقط در زمان اجرا). فقط مالک.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` و درخواست‌های راه‌اندازی مجدد خارجی `SIGUSR1` را فعال می‌کند.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  فهرست مجاز صریح مالک برای سطوح فرمان مختص مالک. جدا از
  `commands.allowFrom` و دسترسی جفت‌سازی پیام مستقیم.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  برای هر کانال: هویت مالک را برای فرمان‌های مختص مالک الزامی می‌کند. هنگامی که `true`،
  فرستنده باید با `commands.ownerAllowFrom` مطابقت داشته باشد یا دامنهٔ داخلی `operator.admin`
  را در اختیار داشته باشد. ورودی نویسهٔ عام `allowFrom` **کافی نیست**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  نحوهٔ نمایش شناسه‌های مالک در اعلان سیستم را کنترل می‌کند.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  راز HMAC مورداستفاده هنگام `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  فهرست مجاز هر ارائه‌دهنده برای مجوزدهی فرمان. وقتی پیکربندی شود،
  **تنها** منبع مجوزدهی برای فرمان‌ها و دستورالعمل‌ها است. برای پیش‌فرض
  سراسری از `"*"` استفاده کنید؛ کلیدهای مختص ارائه‌دهنده آن را بازنویسی می‌کنند.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  وقتی `commands.allowFrom` تنظیم نشده باشد، فهرست‌های مجاز/سیاست‌ها را برای فرمان‌ها اعمال می‌کند.
</ParamField>

## فهرست فرمان‌ها

فرمان‌ها از سه منبع می‌آیند:

- **فرمان‌های داخلی هسته:** `src/auto-reply/commands-registry.shared.ts`
- **فرمان‌های تولیدشدهٔ dock:** `src/auto-reply/commands-registry.data.ts`
- **فرمان‌های Plugin:** فراخوانی‌های `registerCommand()` از سوی Plugin

دسترس‌پذیری به پرچم‌های پیکربندی، سطح کانال و Pluginهای
نصب‌شده/فعال بستگی دارد.

### فرمان‌های هسته

<AccordionGroup>
  <Accordion title="نشست‌ها و اجراها">
    | فرمان | توضیحات |
    | --- | --- |
    | `/new [model]` | نشست کنونی را بایگانی و یک نشست تازه آغاز می‌کند |
    | `/reset [soft [message]]` | نشست کنونی را در جای خود بازنشانی می‌کند. `soft` رونوشت را نگه می‌دارد، شناسه‌های نشست پشتیبان CLI استفاده‌شدهٔ مجدد را حذف می‌کند و راه‌اندازی را دوباره اجرا می‌کند |
    | `/name <title>` | نشست کنونی را نام‌گذاری یا نام آن را تغییر می‌دهد. برای دیدن نام کنونی و یک پیشنهاد، عنوان را حذف کنید |
    | `/compact [instructions]` | زمینهٔ نشست را فشرده می‌کند. [Compaction](/fa/concepts/compaction) را ببینید |
    | `/stop` | اجرای کنونی را لغو می‌کند |
    | `/session idle <duration\|off>` | انقضای بی‌کاری اتصال رشته را مدیریت می‌کند |
    | `/session max-age <duration\|off>` | انقضای حداکثر سن اتصال رشته را مدیریت می‌کند |
    | `/export-session [path]` | فقط مالک. نشست کنونی را درون فضای کاری به HTML صادر می‌کند. نام مستعار: `/export` |
    | `/export-trajectory [path]` | یک بستهٔ مسیر JSONL برای نشست کنونی صادر می‌کند. نام مستعار: `/trajectory` |

    مسیرهای صریح `/export-session` فایل‌های موجود درون
    فضای کاری را جایگزین می‌کنند. برای تولید نام فایلی ایمن در برابر تداخل، مسیر را حذف کنید.

    <Note>
      Control UI ورودی تایپ‌شدهٔ `/new` را رهگیری می‌کند تا یک نشست تازهٔ
      داشبورد ایجاد کند و به آن جابه‌جا شود، مگر زمانی که `session.dmScope: "main"` پیکربندی شده باشد
      و والد کنونی، نشست اصلی عامل باشد — در این حالت `/new`
      نشست اصلی را در جای خود بازنشانی می‌کند. ورودی تایپ‌شدهٔ `/reset` همچنان بازنشانی
      در جای Gateway را اجرا می‌کند. وقتی می‌خواهید انتخاب مدل سنجاق‌شدهٔ
      نشست را پاک کنید، از `/model default` استفاده کنید.
    </Note>

  </Accordion>

  <Accordion title="کنترل‌های مدل و اجرا">
    | فرمان | توضیحات |
    | --- | --- |
    | `/think <level\|default>` | سطح تفکر را تنظیم می‌کند یا بازنویسی نشست را پاک می‌کند. نام‌های مستعار: `/thinking`، `/t` |
    | `/verbose on\|off\|full` | خروجی مشروح را تغییر وضعیت می‌دهد. نام مستعار: `/v` |
    | `/trace on\|off` | خروجی ردیابی Plugin را برای نشست کنونی تغییر وضعیت می‌دهد |
    | `/fast [status\|auto\|on\|off\|default]` | حالت سریع را نمایش می‌دهد، تنظیم می‌کند یا پاک می‌کند |
    | `/reasoning [on\|off\|stream]` | مشاهده‌پذیری استدلال را تغییر وضعیت می‌دهد. نام مستعار: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | حالت ارتقایافته را تغییر وضعیت می‌دهد. نام مستعار: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | پیش‌فرض‌های اجرا را نمایش می‌دهد یا تنظیم می‌کند |
    | `/login [codex\|openai\|openai-codex]` | ورود Codex/OpenAI را از یک گفت‌وگوی خصوصی یا نشست Web UI جفت می‌کند. فقط مالک/مدیر |
    | `/model [name\|#\|status]` | مدل را نمایش می‌دهد یا تنظیم می‌کند |
    | `/models [provider] [page] [limit=<n>\|all]` | ارائه‌دهندگان یا مدل‌های پیکربندی‌شده/دارای احراز هویت را فهرست می‌کند |
    | `/queue <mode>` | رفتار صف اجرای فعال را مدیریت می‌کند. [صف](/fa/concepts/queue) و [هدایت صف](/fa/concepts/queue-steering) را ببینید |
    | `/steer <message>` | راهنمایی را به اجرای فعال تزریق می‌کند. نام مستعار: `/tell`. [هدایت](/fa/tools/steer) را ببینید |

    <AccordionGroup>
      <Accordion title="ایمنی حالت مشروح / ردیابی / سریع / استدلال">
        - `/verbose` برای اشکال‌زدایی است — در استفادهٔ عادی آن را **خاموش** نگه دارید.
        - `/trace` فقط خطوط ردیابی/اشکال‌زدایی متعلق به Plugin را آشکار می‌کند؛ پیام‌های مشروح عادی خاموش می‌مانند.
        - `/fast auto|on|off` بازنویسی نشست را ماندگار می‌کند؛ برای پاک‌کردن آن از گزینهٔ `inherit` در رابط کاربری Sessions استفاده کنید.
        - `/fast` مختص ارائه‌دهنده است: OpenAI/Codex آن را به `service_tier=priority` نگاشت می‌کنند؛ درخواست‌های مستقیم Anthropic آن را به `service_tier=auto` یا `standard_only` نگاشت می‌کنند.
        - `/reasoning`، `/verbose` و `/trace` در محیط‌های گروهی پرخطرند — ممکن است استدلال داخلی یا اطلاعات تشخیصی Plugin را آشکار کنند. آن‌ها را در گفت‌وگوهای گروهی خاموش نگه دارید.

      </Accordion>
      <Accordion title="جزئیات تغییر مدل">
        - `/model` مدل جدید را بلافاصله در نشست ماندگار می‌کند.
        - اگر عامل بی‌کار باشد، اجرای بعدی فوراً از آن استفاده می‌کند.
        - اگر اجرایی فعال باشد، تغییر در حالت انتظار علامت‌گذاری می‌شود و در نقطهٔ پاک بعدی برای تلاش مجدد اعمال می‌شود.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="کشف و وضعیت">
    | فرمان | توضیحات |
    | --- | --- |
    | `/help` | خلاصهٔ کوتاه راهنما را نمایش می‌دهد |
    | `/commands` | کاتالوگ فرمان تولیدشده را نمایش می‌دهد |
    | `/tools [compact\|verbose]` | مواردی را که عامل کنونی هم‌اکنون می‌تواند استفاده کند، نمایش می‌دهد |
    | `/status` | وضعیت اجرا/زمان اجرا، زمان فعالیت Gateway و سیستم، سلامت Plugin و همچنین میزان استفاده/سهمیهٔ ارائه‌دهنده را نمایش می‌دهد |
    | `/status plugins` | جزئیات سلامت Plugin را نمایش می‌دهد: خطاهای بارگذاری، قرنطینه‌ها، شکست‌های Plugin کانال، مشکلات وابستگی و اعلان‌های سازگاری. به `commands.plugins: true` نیاز دارد |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | [هدف](/fa/tools/goal) ماندگار نشست کنونی را مدیریت می‌کند |
    | `/diagnostics [note]` | جریان گزارش پشتیبانی فقط برای مالک. هر بار تأیید اجرا درخواست می‌کند |
    | `/openclaw <request>` | ابزار کمکی راه‌اندازی و تعمیر OpenClaw را از یک پیام مستقیم مالک اجرا می‌کند |
    | `/tasks` | وظایف پس‌زمینهٔ فعال/اخیر نشست کنونی را فهرست می‌کند |
    | `/context [list\|detail\|map\|json]` | نحوهٔ گردآوری زمینه را توضیح می‌دهد |
    | `/whoami` | شناسهٔ فرستندهٔ شما را نمایش می‌دهد. نام مستعار: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | پابرگ مصرف هر پاسخ را کنترل می‌کند (`reset`/`inherit`/`clear`/`default` بازنویسی نشست را پاک می‌کند تا دوباره پیش‌فرض پیکربندی‌شده را به ارث ببرد) یا خلاصهٔ هزینهٔ محلی را چاپ می‌کند |
  </Accordion>

  <Accordion title="Skills، فهرست‌های مجاز، تأییدها">
    | فرمان | توضیحات |
    | --- | --- |
    | `/skill <name> [input]` | اجرای یک مهارت با نام |
    | `/learn [request]` | پیش‌نویس یک مهارت قابل‌بازبینی از گفت‌وگوی فعلی یا منابع نام‌برده‌شده از طریق [کارگاه مهارت](/fa/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | مدیریت ورودی‌های فهرست مجاز. فقط متنی |
    | `/approve <id> <decision>` | رسیدگی به درخواست‌های تأیید اجرای فرمان یا Plugin |
    | `/btw <question>` | پرسیدن یک سؤال جانبی بدون تغییر زمینهٔ نشست. نام مستعار: `/side`. [BTW](/fa/tools/btw) را ببینید |
  </Accordion>

  <Accordion title="عامل‌های فرعی و ACP">
    | فرمان | توضیحات |
    | --- | --- |
    | `/subagents list\|log\|info` | بررسی اجراهای عامل فرعی برای نشست فعلی |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | مدیریت نشست‌های ACP و گزینه‌های محیط اجرا. کنترل‌های محیط اجرا به هویت مالک خارجی یا مدیر داخلی Gateway نیاز دارند |
    | `/focus <target>` | اتصال رشتهٔ فعلی Discord یا موضوع Telegram به یک مقصد نشست |
    | `/unfocus` | حذف اتصال رشتهٔ فعلی |
    | `/agents` | فهرست‌کردن عامل‌های متصل به رشته برای نشست فعلی |
  </Accordion>

  <Accordion title="نوشتن‌های ویژهٔ مالک و مدیریت">
    | فرمان | نیازمندی | توضیحات |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | خواندن یا نوشتن `openclaw.json`. فقط مالک |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | خواندن یا نوشتن پیکربندی سرور MCP تحت مدیریت OpenClaw. فقط مالک |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | بررسی یا تغییر وضعیت Plugin. نوشتن فقط برای مالک. نام مستعار: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | بازنویسی‌های پیکربندی فقط برای محیط اجرا. فقط مالک |
    | `/restart` | `commands.restart: true` (پیش‌فرض) | راه‌اندازی مجدد OpenClaw |
    | `/send on\|off\|inherit` | مالک | تنظیم خط‌مشی ارسال |
  </Accordion>

  <Accordion title="صدا، TTS، کنترل کانال">
    | فرمان | توضیحات |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | کنترل TTS. [TTS](/fa/tools/tts) را ببینید |
    | `/activation mention\|always` | تنظیم حالت فعال‌سازی گروه |
    | `/bash <command>` | اجرای فرمان پوستهٔ میزبان. نام مستعار: `! <command>`. نیازمند `commands.bash: true` |
    | `!poll [sessionId]` | بررسی یک کار پس‌زمینهٔ bash |
    | `!stop [sessionId]` | توقف یک کار پس‌زمینهٔ bash |
  </Accordion>
</AccordionGroup>

### فرمان‌های اتصال کانال

فرمان‌های اتصال کانال، مسیر پاسخ نشست فعال را به کانال پیوندخوردهٔ دیگری تغییر می‌دهند.
برای راه‌اندازی و عیب‌یابی، [اتصال کانال](/fa/concepts/channel-docking) را ببینید.

تولیدشده از Pluginهای کانال با پشتیبانی از فرمان بومی:

- `/dock-discord` (نام مستعار: `/dock_discord`)
- `/dock-mattermost` (نام مستعار: `/dock_mattermost`)
- `/dock-slack` (نام مستعار: `/dock_slack`)
- `/dock-telegram` (نام مستعار: `/dock_telegram`)

فرمان‌های اتصال کانال به `session.identityLinks` نیاز دارند. فرستندهٔ مبدأ و همتای مقصد
باید در یک گروه هویتی باشند.

### فرمان‌های Plugin همراه

| فرمان                                                 | توضیحات                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | روشن یا خاموش‌کردن Dreaming حافظه (مالک یا مدیر Gateway). [Dreaming](/fa/concepts/dreaming) را ببینید                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | مدیریت جفت‌سازی دستگاه. [جفت‌سازی](/fa/channels/pairing) را ببینید                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | آماده‌سازی موقت فرمان‌های پرخطر Node (دوربین/صفحه‌نمایش/رایانه/نوشتن). [استفاده از رایانه](/fa/nodes/computer-use) را ببینید                                                                               |
| `/voice status\|list\|set <voiceId>`                    | مدیریت پیکربندی صدای گفتار. نام بومی Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | ارسال پیش‌تنظیم‌های کارت غنی LINE. [LINE](/fa/channels/line) را ببینید                                                                                                                                        |
| `/codex <action> ...`                                   | اتصال، هدایت و بررسی مهار app-server مربوط به Codex (وضعیت، رشته‌ها، ازسرگیری، مدل، حالت سریع، مجوزها، فشرده‌سازی، بازبینی، mcp، مهارت‌ها و موارد دیگر). [مهار Codex](/fa/plugins/codex-harness) را ببینید |

فقط QQBot: `/bot-ping`، `/bot-version`، `/bot-help`، `/bot-upgrade`، `/bot-logs`

### فرمان‌های مهارت

مهارت‌های قابل‌فراخوانی توسط کاربر به‌صورت فرمان‌های اسلش ارائه می‌شوند:

- `/skill <name> [input]` همیشه به‌عنوان نقطهٔ ورود عمومی کار می‌کند.
- مهارت‌ها می‌توانند به‌عنوان فرمان‌های مستقیم ثبت شوند (برای مثال `/prose` برای OpenProse).
- ثبت فرمان بومی مهارت توسط `commands.nativeSkills` و
  `channels.<provider>.commands.nativeSkills` کنترل می‌شود.
- نام‌ها به `a-z0-9_` پاک‌سازی می‌شوند (حداکثر 32 نویسه)؛ در صورت تداخل، پسوند عددی افزوده می‌شود.

<AccordionGroup>
  <Accordion title="ارسال فرمان مهارت">
    به‌طور پیش‌فرض، فرمان‌های مهارت مانند یک درخواست عادی به مدل هدایت می‌شوند.

    مهارت‌ها می‌توانند `command-dispatch: tool` را اعلام کنند تا مستقیماً به یک ابزار هدایت شوند
    (قطعی، بدون دخالت مدل). نمونه: `/prose` (Plugin متعلق به OpenProse)
    — [OpenProse](/fa/prose) را ببینید.

  </Accordion>
  <Accordion title="آرگومان‌های فرمان بومی">
    وقتی آرگومان‌های الزامی وارد نشده باشند، Discord از تکمیل خودکار برای گزینه‌های پویا و منوهای دکمه‌ای
    استفاده می‌کند. Telegram و Slack برای فرمان‌های دارای
    گزینه، منوی دکمه‌ای نمایش می‌دهند. گزینه‌های پویا بر اساس مدل نشست مقصد تعیین می‌شوند، بنابراین گزینه‌های
    ویژهٔ مدل مانند سطوح `/think` از بازنویسی `/model` نشست پیروی می‌کنند.
  </Accordion>
</AccordionGroup>

## `/tools`: آنچه عامل اکنون می‌تواند استفاده کند

`/tools` به یک پرسش محیط اجرا پاسخ می‌دهد: **این عامل اکنون در این
گفت‌وگو از چه چیزهایی می‌تواند استفاده کند** — نه یک فهرست پیکربندی ثابت.

```text
/tools         # نمای فشرده
/tools verbose # همراه با توضیحات کوتاه
```

نتایج به نشست محدودند. تغییر عامل، کانال، رشته، مجوز
فرستنده یا مدل می‌تواند خروجی را تغییر دهد. برای ویرایش نمایه و بازنویسی‌ها،
از پنل ابزارهای رابط کاربری کنترل یا سطوح پیکربندی استفاده کنید.

## `/model`: انتخاب مدل

```text
/model             # نمایش انتخابگر مدل
/model list        # همان
/model 3           # انتخاب با شماره از انتخابگر
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # پاک‌کردن انتخاب مدل نشست
/model status      # نمای تفصیلی همراه با نقطهٔ پایانی و حالت API
```

در Discord، `/model` و `/models` یک انتخابگر تعاملی با فهرست‌های کشویی ارائه‌دهنده و
مدل باز می‌کنند. انتخابگر، `agents.defaults.models`، از جمله
ورودی‌های `provider/*` را رعایت می‌کند.

## `/config`: نوشتن پیکربندی روی دیسک

<Note>
  فقط مالک. به‌طور پیش‌فرض غیرفعال است — با `commands.config: true` فعال کنید.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

پیکربندی پیش از نوشتن اعتبارسنجی می‌شود. تغییرات نامعتبر رد می‌شوند. به‌روزرسانی‌های `/config`
پس از راه‌اندازی مجدد نیز باقی می‌مانند.

## `/mcp`: پیکربندی سرور MCP

<Note>
  فقط مالک. به‌طور پیش‌فرض غیرفعال است — با `commands.mcp: true` فعال کنید.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` پیکربندی را در پیکربندی OpenClaw ذخیره می‌کند، نه در تنظیمات پروژهٔ عامل تعبیه‌شده.
`/mcp show` فیلدهای حاوی اعتبارنامه، مقادیر شناخته‌شدهٔ پرچم‌های اعتبارنامه
و آرگومان‌هایی با الگوی شناخته‌شدهٔ اطلاعات محرمانه را پوشانده می‌کند. وقتی این فرمان از یک گروه اجرا شود،
پیکربندی به‌صورت خصوصی برای مالک ارسال می‌شود؛ اگر مسیر خصوصی برای مالک
در دسترس نباشد، فرمان به‌صورت بسته شکست می‌خورد و از مالک می‌خواهد از یک
گفت‌وگوی مستقیم دوباره تلاش کند.

## `/debug`: بازنویسی‌های فقط محیط اجرا

<Note>
  فقط مالک. به‌طور پیش‌فرض غیرفعال است — با `commands.debug: true` فعال کنید.
  بازنویسی‌ها بلافاصله بر خواندن‌های جدید پیکربندی اعمال می‌شوند، اما روی دیسک نوشته **نمی‌شوند**.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: مدیریت Plugin

<Note>
  نوشتن فقط برای مالک. به‌طور پیش‌فرض غیرفعال است — با `commands.plugins: true` فعال کنید.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` پیکربندی Plugin را به‌روزرسانی می‌کند و محیط اجرای
Plugin متعلق به Gateway را برای نوبت‌های جدید عامل بارگذاری مجدد داغ می‌کند. `/plugins install` به‌دلیل تغییر
ماژول‌های منبع Plugin، Gatewayهای مدیریت‌شده را به‌طور خودکار راه‌اندازی مجدد می‌کند. نصب‌های معتبر ClawHub
و فهرست رسمی به تأیید اضافی نیاز ندارند. منابع دلخواه npm،
git، بایگانی، `npm-pack:` و مسیر محلی، هشدار منشأ نمایش می‌دهند و
پس از بازبینی منبع به یک `--force` پایانی نیاز دارند. این پرچم
منبع را تأیید می‌کند و جایگزینی نصب موجود را مجاز می‌سازد؛ اما
`security.installPolicy` یا بررسی‌های امنیتی نصب‌کننده را دور نمی‌زند. انتشارهای ClawHub دارای
هشدار خطر همچنان به پرچم جداگانهٔ فقط پوستهٔ
`--acknowledge-clawhub-risk` نیاز دارند. نصب‌های بازارچه‌ای، پیوندی و سنجاق‌شده نیز
همچنان فقط از طریق پوسته انجام می‌شوند.

## `/trace`: خروجی ردیابی Plugin

```text
/trace          # نمایش وضعیت فعلی ردیابی
/trace on
/trace off
```

`/trace` خطوط ردیابی/اشکال‌زدایی Plugin محدود به نشست را بدون حالت کاملاً مشروح
نمایان می‌کند. این جایگزین `/debug` (بازنویسی‌های محیط اجرا) یا `/verbose` (خروجی عادی
ابزار) نیست.

## `/btw`: پرسش‌های جانبی

`/btw` یک پرسش جانبی سریع دربارهٔ زمینهٔ نشست فعلی است. نام مستعار: `/side`.

```text
/btw اکنون دقیقاً چه کاری انجام می‌دهیم؟
/side درحالی‌که اجرای اصلی ادامه داشت، چه چیزی تغییر کرد؟
```

برخلاف یک پیام عادی:

- از نشست فعلی به‌عنوان زمینهٔ پس‌زمینه استفاده می‌کند.
- در نشست‌های مهار Codex، به‌صورت یک رشتهٔ جانبی موقت Codex اجرا می‌شود.
- زمینهٔ آیندهٔ نشست را تغییر **نمی‌دهد**.
- در تاریخچهٔ رونوشت نوشته نمی‌شود.

برای رفتار کامل، [پرسش‌های جانبی BTW](/fa/tools/btw) را ببینید.

## نکات سطوح

<AccordionGroup>
  <Accordion title="محدوده‌بندی نشست در هر سطح">
    - **فرمان‌های متنی:** در نشست عادی گفت‌وگو اجرا می‌شوند (پیام‌های مستقیم `main` را به‌اشتراک می‌گذارند، گروه‌ها نشست خود را دارند).
    - **فرمان‌های بومی Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **فرمان‌های بومی Slack:** `agent:<agentId>:slack:slash:<userId>` (پیشوند از طریق `channels.slack.slashCommand.sessionPrefix` قابل‌پیکربندی است)
    - **فرمان‌های بومی Telegram:** `telegram:slash:<userId>` (نشست گفت‌وگو را از طریق `CommandTargetSessionKey` هدف قرار می‌دهد)
    - **`/login codex`** کدهای جفت‌سازی دستگاه را فقط از طریق گفت‌وگوی خصوصی یا مسیرهای پاسخ رابط کاربری وب ارسال می‌کند. فراخوانی‌های گروه/موضوع Telegram از مالک می‌خواهند به ربات پیام مستقیم بدهد.
    - **`/stop`** نشست گفت‌وگوی فعال را هدف قرار می‌دهد تا اجرای فعلی را لغو کند.

  </Accordion>
  <Accordion title="جزئیات Slack">
    `channels.slack.slashCommand` از یک فرمان به سبک `/openclaw` پشتیبانی می‌کند.
    با `commands.native: true`، برای هر فرمان داخلی یک فرمان اسلش Slack ایجاد کنید.
    `/agentstatus` (نه `/status`) را ثبت کنید، زیرا Slack
    `/status` را رزرو کرده است. متن `/status` همچنان در پیام‌های Slack کار می‌کند.
  </Accordion>
  <Accordion title="مسیر سریع و میان‌برهای درون‌خطی">
    - پیام‌هایی که فقط شامل فرمان هستند و از سوی فرستندگان موجود در فهرست مجاز ارسال می‌شوند، بلافاصله پردازش می‌شوند (صف + مدل را دور می‌زنند).
    - میان‌برهای درون‌خطی (`/help`، `/commands`، `/status`، `/whoami`) درون پیام‌های عادی نیز کار می‌کنند و پیش از آنکه مدل متن باقی‌مانده را ببیند، حذف می‌شوند.
    - پیام‌های غیرمجازِ صرفاً شامل فرمان، بدون هیچ اطلاع‌رسانی نادیده گرفته می‌شوند؛ توکن‌های درون‌خطی `/...` به‌عنوان متن ساده در نظر گرفته می‌شوند.

  </Accordion>
  <Accordion title="نکات آرگومان‌ها">
    - فرمان‌ها یک `:` اختیاری میان فرمان و آرگومان‌ها می‌پذیرند (`/think: high`، `/send: on`).
    - `/new <model>` یک نام مستعار مدل، `provider/model` یا نام ارائه‌دهنده (با تطبیق تقریبی) را می‌پذیرد؛ اگر تطبیقی یافت نشود، متن به‌عنوان بدنه پیام در نظر گرفته می‌شود.
    - `/allowlist add|remove` به `commands.config: true` نیاز دارد و `configWrites` کانال را رعایت می‌کند.

  </Accordion>
</AccordionGroup>

## میزان استفاده و وضعیت ارائه‌دهنده

- **میزان استفاده/سهمیه ارائه‌دهنده** (برای مثال، «Claude ‏80% باقی‌مانده») هنگامی که ردیابی میزان استفاده فعال باشد، برای ارائه‌دهنده مدل فعلی در `/status` نمایش داده می‌شود.
- **خطوط توکن/کش** در `/status`، هنگامی که تصویر لحظه‌ای نشست زنده اطلاعات اندکی دارد، می‌توانند از آخرین ورودی میزان استفاده در رونوشت استفاده کنند.
- **اجرا در برابر زمان اجرا:** `/status`، `Execution` را برای مسیر مؤثر محیط ایزوله و `Runtime` را برای مشخص‌کردن اجراکننده نشست گزارش می‌کند: `OpenClaw Default`، `OpenAI Codex`، یک بک‌اند CLI یا یک بک‌اند ACP.
- **توکن‌ها/هزینه هر پاسخ:** با `/usage off|tokens|full` کنترل می‌شود.
- `/model status` مربوط به مدل‌ها/احراز هویت/نقاط پایانی است، نه میزان استفاده.

## مرتبط

<CardGroup cols={2}>
  <Card title="Skills" href="/fa/tools/skills" icon="puzzle-piece">
    نحوه ثبت و محدودسازی فرمان‌های اسلش Skills.
  </Card>
  <Card title="ایجاد Skills" href="/fa/tools/creating-skills" icon="hammer">
    یک Skill بسازید که فرمان اسلش خودش را ثبت کند.
  </Card>
  <Card title="راستی" href="/fa/tools/btw" icon="comments">
    پرسش‌های جانبی بدون تغییر زمینه نشست.
  </Card>
  <Card title="هدایت" href="/fa/tools/steer" icon="compass">
    عامل را در میانه اجرا با `/steer` هدایت کنید.
  </Card>
</CardGroup>
