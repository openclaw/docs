---
read_when:
    - می‌خواهید بدانید OpenClaw چه ابزارهایی ارائه می‌کند
    - باید ابزارها را پیکربندی، مجاز یا رد کنید
    - شما در حال انتخاب بین ابزارهای داخلی، Skills و Pluginها هستید
summary: 'نمای کلی ابزارها و Pluginهای OpenClaw: عامل چه کارهایی می‌تواند انجام دهد و چگونه آن را گسترش دهید'
title: ابزارها و Plugin‌ها
x-i18n:
    generated_at: "2026-05-10T20:11:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

هر کاری که عامل فراتر از تولید متن انجام می‌دهد از طریق **ابزارها** انجام می‌شود.
ابزارها راهی هستند که عامل با آن‌ها فایل‌ها را می‌خواند، دستورها را اجرا می‌کند، وب را مرور می‌کند، پیام می‌فرستد، و با دستگاه‌ها تعامل دارد.

## ابزارها، Skills، و Pluginها

OpenClaw سه لایه دارد که با هم کار می‌کنند:

<Steps>
  <Step title="ابزارها همان چیزی هستند که عامل فراخوانی می‌کند">
    ابزار یک تابع تایپ‌شده است که عامل می‌تواند آن را فراخوانی کند (مثلاً `exec`، `browser`،
    `web_search`، `message`). OpenClaw مجموعه‌ای از **ابزارهای توکار** را ارائه می‌کند و
    Pluginها می‌توانند ابزارهای بیشتری ثبت کنند.

    عامل ابزارها را به‌صورت تعریف‌های تابع ساختاریافته می‌بیند که به API مدل ارسال می‌شوند.

  </Step>

  <Step title="Skills به عامل یاد می‌دهند چه زمانی و چگونه">
    یک skill یک فایل مارک‌داون (`SKILL.md`) است که در system prompt تزریق می‌شود.
    Skills به عامل زمینه، محدودیت‌ها، و راهنمایی گام‌به‌گام برای
    استفاده مؤثر از ابزارها می‌دهند. Skills در workspace شما، در پوشه‌های مشترک،
    یا داخل Pluginها ارائه می‌شوند.

    [مرجع Skills](/fa/tools/skills) | [ایجاد Skills](/fa/tools/creating-skills)

  </Step>

  <Step title="Pluginها همه چیز را در کنار هم بسته‌بندی می‌کنند">
    Plugin بسته‌ای است که می‌تواند هر ترکیبی از قابلیت‌ها را ثبت کند:
    کانال‌ها، ارائه‌دهندگان مدل، ابزارها، Skills، گفتار، رونویسی بلادرنگ،
    صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدیو،
    دریافت وب، جستجوی وب، و موارد بیشتر. برخی Pluginها **core** هستند (همراه با
    OpenClaw ارائه می‌شوند)، و برخی دیگر **external** هستند (توسط جامعه در npm منتشر می‌شوند).

    [نصب و پیکربندی Pluginها](/fa/tools/plugin) | [خودتان بسازید](/fa/plugins/building-plugins)

  </Step>
</Steps>

## ابزارهای توکار

این ابزارها همراه OpenClaw ارائه می‌شوند و بدون نصب هیچ Pluginی در دسترس هستند:

| ابزار                                      | کاری که انجام می‌دهد                                                  | صفحه                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | اجرای دستورهای shell، مدیریت پردازش‌های پس‌زمینه                     | [Exec](/fa/tools/exec), [تأییدهای Exec](/fa/tools/exec-approvals) |
| `code_execution`                           | اجرای تحلیل Python راه‌دور در sandbox                                 | [اجرای کد](/fa/tools/code-execution)                           |
| `browser`                                  | کنترل یک مرورگر Chromium (پیمایش، کلیک، screenshot)                  | [مرورگر](/fa/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | جستجوی وب، جستجوی پست‌های X، دریافت محتوای صفحه                     | [وب](/fa/tools/web), [دریافت وب](/fa/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ورودی/خروجی فایل در workspace                                         |                                                              |
| `apply_patch`                              | patchهای چندبخشی فایل                                                 | [اعمال Patch](/fa/tools/apply-patch)                           |
| `message`                                  | ارسال پیام در همه کانال‌ها                                           | [ارسال عامل](/fa/tools/agent-send)                             |
| `nodes`                                    | کشف و هدف‌گیری دستگاه‌های جفت‌شده                                     |                                                              |
| `cron` / `gateway`                         | مدیریت jobهای زمان‌بندی‌شده؛ بازرسی، patch، راه‌اندازی مجدد، یا به‌روزرسانی gateway |                                                              |
| `image` / `image_generate`                 | تحلیل یا تولید تصاویر                                                 | [تولید تصویر](/fa/tools/image-generation)                      |
| `music_generate`                           | تولید ترک‌های موسیقی                                                  | [تولید موسیقی](/fa/tools/music-generation)                     |
| `video_generate`                           | تولید ویدیوها                                                         | [تولید ویدیو](/fa/tools/video-generation)                      |
| `tts`                                      | تبدیل یک‌باره متن به گفتار                                           | [TTS](/fa/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | مدیریت session، وضعیت، و هماهنگ‌سازی sub-agentها                     | [Sub-agentها](/fa/tools/subagents)                             |
| `session_status`                           | readback سبک به سبک `/status` و override مدل session                 | [ابزارهای Session](/fa/concepts/session-tool)                  |

برای کارهای تصویری، از `image` برای تحلیل و از `image_generate` برای تولید یا ویرایش استفاده کنید. اگر `openai/*`، `google/*`، `fal/*`، یا ارائه‌دهنده تصویر غیرپیش‌فرض دیگری را هدف می‌گیرید، ابتدا کلید auth/API آن ارائه‌دهنده را پیکربندی کنید.

برای کارهای موسیقی، از `music_generate` استفاده کنید. اگر `google/*`، `minimax/*`، یا ارائه‌دهنده موسیقی غیرپیش‌فرض دیگری را هدف می‌گیرید، ابتدا کلید auth/API آن ارائه‌دهنده را پیکربندی کنید.

برای کارهای ویدیویی، از `video_generate` استفاده کنید. اگر `qwen/*` یا ارائه‌دهنده ویدیوی غیرپیش‌فرض دیگری را هدف می‌گیرید، ابتدا کلید auth/API آن ارائه‌دهنده را پیکربندی کنید.

برای تولید صوت مبتنی بر workflow، وقتی Pluginی مانند
ComfyUI آن را ثبت می‌کند از `music_generate` استفاده کنید. این جدا از `tts` است که متن‌به‌گفتار است.

`session_status` ابزار سبک وضعیت/readback در گروه sessions است.
این ابزار به پرسش‌های به سبک `/status` درباره session فعلی پاسخ می‌دهد و می‌تواند
به‌صورت اختیاری override مدل در سطح هر session را تنظیم کند؛ `model=default` آن
override را پاک می‌کند. مانند `/status`، می‌تواند شمارنده‌های پراکنده token/cache و
برچسب مدل runtime فعال را از آخرین ورودی usage در transcript تکمیل کند.

`gateway` ابزار runtime فقط مالک برای عملیات gateway است:

- `config.schema.lookup` برای یک زیردرخت config محدود به یک path پیش از ویرایش‌ها
- `config.get` برای snapshot + hash فعلی config
- `config.patch` برای به‌روزرسانی‌های جزئی config همراه با راه‌اندازی مجدد
- `config.apply` فقط برای جایگزینی کامل config
- `update.run` برای خودبه‌روزرسانی صریح + راه‌اندازی مجدد

برای تغییرات جزئی، ابتدا `config.schema.lookup` و سپس `config.patch` را ترجیح دهید. از
`config.apply` فقط زمانی استفاده کنید که عمداً کل config را جایگزین می‌کنید.
برای مستندات گسترده‌تر config، [پیکربندی](/fa/gateway/configuration) و
[مرجع پیکربندی](/fa/gateway/configuration-reference) را بخوانید.
این ابزار همچنین از تغییر `tools.exec.ask` یا `tools.exec.security` خودداری می‌کند؛
aliasهای قدیمی `tools.bash.*` به همان مسیرهای exec محافظت‌شده normalize می‌شوند.

### ابزارهای ارائه‌شده توسط Plugin

Pluginها می‌توانند ابزارهای بیشتری ثبت کنند. چند نمونه:

- [Canvas](/fa/plugins/reference/canvas) — Plugin آزمایشی bundled برای کنترل Canvas در Node و rendering A2UI
- [Diffs](/fa/tools/diffs) — نمایشگر و renderer diff
- [LLM Task](/fa/tools/llm-task) — گام LLM فقط JSON برای خروجی ساختاریافته
- [Lobster](/fa/tools/lobster) — runtime workflow تایپ‌شده با تأییدهای قابل‌ازسرگیری
- [تولید موسیقی](/fa/tools/music-generation) — ابزار مشترک `music_generate` با ارائه‌دهندگان پشتیبانی‌شده توسط workflow
- [OpenProse](/fa/prose) — هماهنگ‌سازی workflow با اولویت مارک‌داون
- [Tokenjuice](/fa/tools/tokenjuice) — فشرده‌سازی نتایج پرنویز ابزارهای `exec` و `bash`

ابزارهای Plugin همچنان با `api.registerTool(...)` نوشته می‌شوند و در
فهرست `contracts.tools` در manifest Plugin اعلام می‌شوند. OpenClaw توصیفگر
اعتبارسنجی‌شده ابزار را هنگام discovery ثبت می‌کند و آن را بر اساس منبع Plugin و contract cache می‌کند، تا
برنامه‌ریزی ابزار بعداً بتواند از بارگذاری runtime Plugin صرف‌نظر کند. اجرای ابزار همچنان
Plugin مالک را بارگذاری می‌کند و پیاده‌سازی ثبت‌شده زنده را فراخوانی می‌کند.

[جستجوی ابزار](/fa/tools/tool-search) سطح فشرده
برای کاتالوگ‌های بزرگ است. به‌جای قرار دادن schema هر ابزار OpenClaw، MCP، یا client
در prompt، OpenClaw می‌تواند به مدل یک runtime ایزوله Node
با `openclaw.tools.search`، `openclaw.tools.describe`، و
`openclaw.tools.call` بدهد. فراخوانی‌ها همچنان از طریق Gateway برمی‌گردند، بنابراین
سیاست ابزار، تأییدها، hooks، و logهای session مرجع معتبر باقی می‌مانند.

## پیکربندی ابزار

### فهرست‌های مجاز و ممنوع

از طریق `tools.allow` / `tools.deny` در
config کنترل کنید عامل کدام ابزارها را می‌تواند فراخوانی کند. ممنوعیت همیشه بر مجوز غلبه می‌کند.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

وقتی allowlist صریح به هیچ ابزار قابل‌فراخوانی‌ای resolve نشود، OpenClaw بسته می‌ماند.
برای مثال، `tools.allow: ["query_db"]` فقط زمانی کار می‌کند که یک Plugin بارگذاری‌شده واقعاً
`query_db` را ثبت کند. اگر هیچ ابزار توکار، Plugin، یا MCP bundled با
allowlist مطابقت نداشته باشد، اجرا پیش از فراخوانی مدل متوقف می‌شود، به‌جای اینکه به‌صورت
اجرای فقط‌متنی ادامه دهد که ممکن است نتایج ابزار را hallucinate کند.

### پروفایل‌های ابزار

`tools.profile` پیش از اعمال `allow`/`deny` یک allowlist پایه تنظیم می‌کند.
override در سطح هر عامل: `agents.list[].tools.profile`.

| پروفایل    | شامل چه چیزهایی است                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | همه ابزارهای core و Plugin اختیاری؛ baseline نامحدود برای دسترسی گسترده‌تر command/control                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | فقط `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` عمداً برای عامل‌های متمرکز بر کانال محدود است.
این پروفایل ابزارهای گسترده‌تر command/control مانند filesystem، runtime،
browser، canvas، nodes، cron، و کنترل gateway را کنار می‌گذارد. از `tools.profile: "full"`
به‌عنوان baseline نامحدود برای دسترسی گسترده‌تر command/control استفاده کنید، سپس
در صورت نیاز دسترسی را با `tools.allow` / `tools.deny` کاهش دهید.
</Note>

`coding` شامل ابزارهای سبک وب (`web_search`، `web_fetch`، `x_search`) است
اما ابزار کامل کنترل مرورگر را شامل نمی‌شود. automation مرورگر می‌تواند sessionهای واقعی و
profileهای واردشده را هدایت کند، بنابراین آن را صراحتاً با
`tools.alsoAllow: ["browser"]` یا
`agents.list[].tools.alsoAllow: ["browser"]` در سطح هر عامل اضافه کنید.

<Note>
پیکربندی `tools.exec` یا `tools.fs` زیر یک پروفایل محدود (`messaging`، `minimal`) به‌صورت ضمنی allowlist پروفایل را گسترش نمی‌دهد. وقتی می‌خواهید یک پروفایل محدود از آن بخش‌های پیکربندی‌شده استفاده کند، ورودی‌های صریح `tools.alsoAllow` اضافه کنید (برای مثال `["exec", "process"]` برای exec، یا `["read", "write", "edit"]` برای fs). وقتی یک بخش config بدون grant متناظر `alsoAllow` وجود داشته باشد، OpenClaw هنگام startup یک هشدار ثبت می‌کند.
</Note>

پروفایل‌های `coding` و `messaging` همچنین ابزارهای bundle MCP پیکربندی‌شده را
زیر کلید Plugin با نام `bundle-mcp` مجاز می‌کنند. وقتی می‌خواهید
یک پروفایل built-inهای عادی خود را نگه دارد اما همه ابزارهای MCP پیکربندی‌شده را پنهان کند،
`tools.deny: ["bundle-mcp"]` را اضافه کنید.
پروفایل `minimal` شامل ابزارهای bundle MCP نیست.

مثال (گسترده‌ترین سطح ابزار به‌صورت پیش‌فرض):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### گروه‌های ابزار

از کوتاه‌نویسی‌های `group:*` در فهرست‌های allow/deny استفاده کنید:

| گروه               | ابزارها                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` به‌عنوان نام مستعار برای `exec` پذیرفته می‌شود)                    |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas هنگامی که Plugin همراهِ Canvas فعال باشد                                                 |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | همه ابزارهای داخلی OpenClaw (ابزارهای Plugin را شامل نمی‌شود)                                           |

`sessions_history` یک نمای یادآوری محدود و فیلترشده از نظر ایمنی برمی‌گرداند. این نما
برچسب‌های تفکر، سازه‌های `<relevant-memories>`، payloadهای XML فراخوانی ابزار به‌صورت متن ساده
(از جمله `<tool_call>...</tool_call>`،
`<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`،
`<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شده فراخوانی ابزار)،
سازه‌های تنزل‌یافته فراخوانی ابزار، توکن‌های کنترلی مدل افشاشده ASCII/تمام‌عرض
و XML نادرست فراخوانی ابزار MiniMax را از متن دستیار حذف می‌کند، سپس
به‌جای عمل کردن مانند یک خروجی خام رونوشت، حذف‌سازی/کوتاه‌سازی و جایگزین‌های احتمالی برای ردیف‌های بیش‌ازحد بزرگ را اعمال می‌کند.

### محدودیت‌های ویژه ارائه‌دهنده

از `tools.byProvider` برای محدود کردن ابزارها برای ارائه‌دهنده‌های مشخص استفاده کنید، بدون آن‌که
پیش‌فرض‌های سراسری تغییر کنند:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
