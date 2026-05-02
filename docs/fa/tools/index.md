---
read_when:
    - می‌خواهید بدانید OpenClaw چه ابزارهایی ارائه می‌دهد
    - باید ابزارها را پیکربندی، مجاز یا رد کنید
    - شما در حال تصمیم‌گیری بین ابزارهای توکار، Skills و Pluginها هستید
summary: 'نمای کلی ابزارها و Plugin‌های OpenClaw: عامل چه کارهایی می‌تواند انجام دهد و چگونه می‌توان آن را گسترش داد'
title: ابزارها و Plugin‌ها
x-i18n:
    generated_at: "2026-05-02T21:01:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

هر کاری که عامل فراتر از تولید متن انجام می‌دهد از طریق **ابزارها** انجام می‌شود.
ابزارها روشی هستند که عامل با آن‌ها فایل‌ها را می‌خواند، فرمان‌ها را اجرا می‌کند، وب را مرور می‌کند، پیام
می‌فرستد و با دستگاه‌ها تعامل می‌کند.

## ابزارها، Skills و Pluginها

OpenClaw سه لایه دارد که با هم کار می‌کنند:

<Steps>
  <Step title="Tools are what the agent calls">
    ابزار یک تابع دارای نوع است که عامل می‌تواند آن را فراخوانی کند (مثلاً `exec`، `browser`،
    `web_search`، `message`). OpenClaw مجموعه‌ای از **ابزارهای داخلی** را ارائه می‌کند و
    Pluginها می‌توانند موارد بیشتری ثبت کنند.

    عامل ابزارها را به‌صورت تعریف‌های ساختاریافته‌ی تابع می‌بیند که به API مدل فرستاده می‌شوند.

  </Step>

  <Step title="Skills teach the agent when and how">
    Skills فایل markdownی (`SKILL.md`) است که در پرامپت سیستم تزریق می‌شود.
    Skills به عامل زمینه، محدودیت‌ها و راهنمایی گام‌به‌گام برای
    استفاده‌ی مؤثر از ابزارها می‌دهد. Skills در فضای کاری شما، در پوشه‌های مشترک،
    یا داخل Pluginها قرار می‌گیرد.

    [مرجع Skills](/fa/tools/skills) | [ایجاد Skills](/fa/tools/creating-skills)

  </Step>

  <Step title="Plugins package everything together">
    Plugin بسته‌ای است که می‌تواند هر ترکیبی از قابلیت‌ها را ثبت کند:
    کانال‌ها، ارائه‌دهندگان مدل، ابزارها، Skills، گفتار، رونویسی بلادرنگ،
    صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدئو،
    دریافت وب، جستجوی وب و موارد بیشتر. برخی Pluginها **هسته‌ای** هستند (همراه
    OpenClaw ارائه می‌شوند)، برخی دیگر **خارجی** هستند (توسط جامعه روی npm منتشر می‌شوند).

    [نصب و پیکربندی Pluginها](/fa/tools/plugin) | [ساخت مورد اختصاصی خودتان](/fa/plugins/building-plugins)

  </Step>
</Steps>

## ابزارهای داخلی

این ابزارها همراه OpenClaw ارائه می‌شوند و بدون نصب هیچ Pluginی در دسترس هستند:

| ابزار                                      | کاری که انجام می‌دهد                                                   | صفحه                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | اجرای فرمان‌های shell، مدیریت پردازه‌های پس‌زمینه                     | [Exec](/fa/tools/exec), [Exec Approvals](/fa/tools/exec-approvals) |
| `code_execution`                           | اجرای تحلیل Python راه‌دور در sandbox                                 | [Code Execution](/fa/tools/code-execution)                      |
| `browser`                                  | کنترل مرورگر Chromium (پیمایش، کلیک، screenshot)                      | [مرورگر](/fa/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | جستجوی وب، جستجوی پست‌های X، دریافت محتوای صفحه                      | [وب](/fa/tools/web), [Web Fetch](/fa/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ورودی/خروجی فایل در فضای کاری                                         |                                                              |
| `apply_patch`                              | وصله‌های چندبخشی فایل                                                 | [Apply Patch](/fa/tools/apply-patch)                            |
| `message`                                  | ارسال پیام در همه کانال‌ها                                            | [Agent Send](/fa/tools/agent-send)                              |
| `canvas`                                   | هدایت node Canvas (present، eval، snapshot)                           |                                                              |
| `nodes`                                    | کشف و هدف‌گیری دستگاه‌های جفت‌شده                                     |                                                              |
| `cron` / `gateway`                         | مدیریت کارهای زمان‌بندی‌شده؛ بررسی، وصله، بازراه‌اندازی یا به‌روزرسانی Gateway |                                                              |
| `image` / `image_generate`                 | تحلیل یا تولید تصویر                                                  | [تولید تصویر](/fa/tools/image-generation)                  |
| `music_generate`                           | تولید قطعه‌های موسیقی                                                 | [تولید موسیقی](/fa/tools/music-generation)                  |
| `video_generate`                           | تولید ویدئوها                                                         | [تولید ویدئو](/fa/tools/video-generation)                  |
| `tts`                                      | تبدیل یک‌مرحله‌ای متن به گفتار                                        | [TTS](/fa/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | مدیریت نشست، وضعیت و هماهنگ‌سازی زیرعامل‌ها                           | [زیرعامل‌ها](/fa/tools/subagents)                               |
| `session_status`                           | بازخوانی سبک به سبک `/status` و override مدل نشست                    | [ابزارهای نشست](/fa/concepts/session-tool)                      |

برای کارهای تصویری، از `image` برای تحلیل و از `image_generate` برای تولید یا ویرایش استفاده کنید. اگر `openai/*`، `google/*`، `fal/*` یا ارائه‌دهنده‌ی تصویر غیرپیش‌فرض دیگری را هدف می‌گیرید، ابتدا auth/API key آن ارائه‌دهنده را پیکربندی کنید.

برای کارهای موسیقی، از `music_generate` استفاده کنید. اگر `google/*`، `minimax/*` یا ارائه‌دهنده‌ی موسیقی غیرپیش‌فرض دیگری را هدف می‌گیرید، ابتدا auth/API key آن ارائه‌دهنده را پیکربندی کنید.

برای کارهای ویدئویی، از `video_generate` استفاده کنید. اگر `qwen/*` یا ارائه‌دهنده‌ی ویدئوی غیرپیش‌فرض دیگری را هدف می‌گیرید، ابتدا auth/API key آن ارائه‌دهنده را پیکربندی کنید.

برای تولید صوت مبتنی بر workflow، وقتی Pluginی مانند
ComfyUI آن را ثبت می‌کند، از `music_generate` استفاده کنید. این از `tts` که متن‌به‌گفتار است جداست.

`session_status` ابزار سبک وضعیت/بازخوانی در گروه نشست‌هاست.
این ابزار به پرسش‌های سبک `/status` درباره نشست فعلی پاسخ می‌دهد و می‌تواند
اختیاراً برای هر نشست یک override مدل تنظیم کند؛ `model=default` آن
override را پاک می‌کند. مانند `/status`، می‌تواند شمارنده‌های پراکنده‌ی token/cache و برچسب مدل runtime فعال را از آخرین ورودی usage در رونوشت تکمیل کند.

`gateway` ابزار runtime فقط‌مالک برای عملیات Gateway است:

- `config.schema.lookup` برای یک زیردرخت پیکربندی محدود به مسیر پیش از ویرایش‌ها
- `config.get` برای snapshot پیکربندی فعلی + hash
- `config.patch` برای به‌روزرسانی‌های جزئی پیکربندی همراه با restart
- `config.apply` فقط برای جایگزینی کامل پیکربندی
- `update.run` برای self-update + restart صریح

برای تغییرات جزئی، ابتدا `config.schema.lookup` و سپس `config.patch` را ترجیح دهید. فقط زمانی از
`config.apply` استفاده کنید که عمداً کل پیکربندی را جایگزین می‌کنید.
برای مستندات گسترده‌تر پیکربندی، [پیکربندی](/fa/gateway/configuration) و
[مرجع پیکربندی](/fa/gateway/configuration-reference) را بخوانید.
این ابزار همچنین از تغییر `tools.exec.ask` یا `tools.exec.security` خودداری می‌کند؛
نام‌های مستعار قدیمی `tools.bash.*` به همان مسیرهای محافظت‌شده exec normalize می‌شوند.

### ابزارهای ارائه‌شده توسط Plugin

Pluginها می‌توانند ابزارهای بیشتری ثبت کنند. چند نمونه:

- [Diffها](/fa/tools/diffs) — نمایشگر و renderer diff
- [LLM Task](/fa/tools/llm-task) — گام LLM فقط JSON برای خروجی ساختاریافته
- [Lobster](/fa/tools/lobster) — runtime workflow نوع‌دار با تأییدهای قابل ازسرگیری
- [تولید موسیقی](/fa/tools/music-generation) — ابزار مشترک `music_generate` با ارائه‌دهندگان متکی بر workflow
- [OpenProse](/fa/prose) — هماهنگ‌سازی workflow با محوریت markdown
- [Tokenjuice](/fa/tools/tokenjuice) — فشرده‌سازی نتایج پرنویز ابزارهای `exec` و `bash`

ابزارهای Plugin همچنان با `api.registerTool(...)` نوشته می‌شوند و در
فهرست `contracts.tools` در manifest Plugin اعلام می‌شوند. OpenClaw توصیفگر
اعتبارسنجی‌شده‌ی ابزار را هنگام کشف ثبت می‌کند و آن را بر اساس منبع و قرارداد Plugin cache می‌کند، تا
برنامه‌ریزی ابزار بعدی بتواند از بارگذاری runtime Plugin صرف‌نظر کند. اجرای ابزار همچنان
Plugin مالک را بارگذاری می‌کند و پیاده‌سازی ثبت‌شده‌ی زنده را فراخوانی می‌کند.

## پیکربندی ابزار

### فهرست‌های مجاز و ممنوع

کنترل کنید عامل کدام ابزارها را می‌تواند از طریق `tools.allow` / `tools.deny` در
پیکربندی فراخوانی کند. ممنوع‌کردن همیشه بر مجازکردن اولویت دارد.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw وقتی یک allowlist صریح به هیچ ابزار قابل‌فراخوانی نرسد، بسته و امن شکست می‌خورد.
برای مثال، `tools.allow: ["query_db"]` فقط زمانی کار می‌کند که یک Plugin بارگذاری‌شده واقعاً
`query_db` را ثبت کرده باشد. اگر هیچ ابزار داخلی، Plugin، یا ابزار MCP بسته‌شده‌ای با
allowlist منطبق نباشد، اجرا پیش از فراخوانی مدل متوقف می‌شود، به‌جای اینکه به‌صورت اجرای
فقط‌متنی ادامه دهد که ممکن است نتایج ابزار را hallucinate کند.

### پروفایل‌های ابزار

`tools.profile` پیش از اعمال `allow`/`deny` یک allowlist پایه تنظیم می‌کند.
override برای هر عامل: `agents.list[].tools.profile`.

| پروفایل     | شامل چه چیزهایی است                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | خط پایه بدون محدودیت برای دسترسی گسترده‌تر command/control؛ همانند تنظیم‌نکردن `tools.profile`                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | فقط `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` برای عامل‌های متمرکز بر کانال عمداً محدود است.
این پروفایل ابزارهای گسترده‌تر command/control مانند filesystem، runtime،
browser، canvas، nodes، cron و کنترل Gateway را کنار می‌گذارد. از `tools.profile: "full"`
به‌عنوان خط پایه بدون محدودیت برای دسترسی گسترده‌تر command/control استفاده کنید، سپس در صورت نیاز
دسترسی را با `tools.allow` / `tools.deny` محدود کنید.
</Note>

`coding` شامل ابزارهای سبک وب (`web_search`، `web_fetch`، `x_search`) است
اما ابزار کامل کنترل مرورگر را شامل نمی‌شود. خودکارسازی مرورگر می‌تواند نشست‌های واقعی
و پروفایل‌های واردشده را هدایت کند، بنابراین آن را صریحاً با
`tools.alsoAllow: ["browser"]` یا برای هر عامل با
`agents.list[].tools.alsoAllow: ["browser"]` اضافه کنید.

<Note>
پیکربندی `tools.exec` یا `tools.fs` زیر یک پروفایل محدود (`messaging`، `minimal`) به‌طور ضمنی allowlist پروفایل را گسترش نمی‌دهد. وقتی می‌خواهید یک پروفایل محدود از آن بخش‌های پیکربندی‌شده استفاده کند، ورودی‌های صریح `tools.alsoAllow` اضافه کنید (برای مثال `["exec", "process"]` برای exec، یا `["read", "write", "edit"]` برای fs). وقتی یک بخش پیکربندی بدون grant متناظر `alsoAllow` وجود داشته باشد، OpenClaw هنگام startup یک هشدار ثبت می‌کند.
</Note>

پروفایل‌های `coding` و `messaging` همچنین ابزارهای MCP بسته‌شده‌ی پیکربندی‌شده را
زیر کلید Plugin یعنی `bundle-mcp` مجاز می‌کنند. وقتی می‌خواهید
یک پروفایل built-inهای عادی خود را نگه دارد اما همه ابزارهای MCP پیکربندی‌شده را پنهان کند، `tools.deny: ["bundle-mcp"]` را اضافه کنید.
پروفایل `minimal` ابزارهای MCP بسته‌شده را شامل نمی‌شود.

نمونه (گسترده‌ترین سطح ابزار به‌صورت پیش‌فرض):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### گروه‌های ابزار

از کوتاه‌نوشت‌های `group:*` در فهرست‌های allow/deny استفاده کنید:

| گروه               | ابزارها                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` به‌عنوان نام مستعار برای `exec` پذیرفته می‌شود)                    |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | همهٔ ابزارهای داخلی OpenClaw (ابزارهای Plugin را شامل نمی‌شود)                                           |

`sessions_history` یک نمای یادآوری محدود و فیلترشده از نظر ایمنی برمی‌گرداند. این نما
برچسب‌های تفکر، قالب‌بندی کمکی `<relevant-memories>`، payloadهای XML فراخوانی ابزارِ متن ساده
(از جمله `<tool_call>...</tool_call>`،
`<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`،
`<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شدهٔ فراخوانی ابزار)،
قالب‌بندی کمکی تنزل‌یافتهٔ فراخوانی ابزار، توکن‌های کنترلی نشت‌کردهٔ مدل به‌صورت ASCII/تمام‌عرض،
و XML بدشکل فراخوانی ابزار MiniMax را از متن دستیار حذف می‌کند، سپس
به‌جای عمل کردن به‌عنوان تخلیهٔ خام رونوشت، بازنویسی/کوتاه‌سازی و جای‌نگهدارهای احتمالی برای ردیف‌های بیش‌ازحد بزرگ را اعمال می‌کند.

### محدودیت‌های ویژهٔ ارائه‌دهنده

برای محدود کردن ابزارها برای ارائه‌دهنده‌های خاص بدون
تغییر پیش‌فرض‌های سراسری، از `tools.byProvider` استفاده کنید:

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
