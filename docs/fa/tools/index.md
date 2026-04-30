---
read_when:
    - می‌خواهید بدانید OpenClaw چه ابزارهایی ارائه می‌دهد
    - باید ابزارها را پیکربندی، مجاز یا رد کنید
    - شما در حال تصمیم‌گیری بین ابزارهای داخلی، Skills و Pluginها هستید
summary: 'نمای کلی ابزارها و Pluginهای OpenClaw: عامل چه کارهایی می‌تواند انجام دهد و چگونه آن را گسترش دهید'
title: ابزارها و Plugin‌ها
x-i18n:
    generated_at: "2026-04-30T16:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

هر کاری که عامل فراتر از تولید متن انجام می‌دهد از طریق **ابزارها** انجام می‌شود.
ابزارها روشی هستند که عامل با آن‌ها فایل‌ها را می‌خواند، فرمان‌ها را اجرا می‌کند، وب را مرور می‌کند، پیام
می‌فرستد و با دستگاه‌ها تعامل می‌کند.

## ابزارها، Skills، و plugins

OpenClaw سه لایه دارد که با هم کار می‌کنند:

<Steps>
  <Step title="ابزارها همان چیزهایی هستند که عامل فراخوانی می‌کند">
    ابزار یک تابع دارای نوع است که عامل می‌تواند آن را فراخوانی کند (برای نمونه `exec`، `browser`،
    `web_search`، `message`). OpenClaw مجموعه‌ای از **ابزارهای داخلی** را ارائه می‌کند و
    plugins می‌توانند موارد بیشتری را ثبت کنند.

    عامل ابزارها را به‌صورت تعریف‌های تابع ساختاریافته‌ای می‌بیند که به API مدل فرستاده می‌شوند.

  </Step>

  <Step title="Skills به عامل می‌آموزند چه زمانی و چگونه">
    یک Skill یک فایل markdown (`SKILL.md`) است که در system prompt تزریق می‌شود.
    Skills به عامل زمینه، محدودیت‌ها، و راهنمایی گام‌به‌گام برای
    استفاده مؤثر از ابزارها می‌دهند. Skills در فضای کاری شما، در پوشه‌های مشترک،
    یا داخل plugins عرضه می‌شوند.

    [مرجع Skills](/fa/tools/skills) | [ایجاد Skills](/fa/tools/creating-skills)

  </Step>

  <Step title="Plugins همه‌چیز را با هم بسته‌بندی می‌کنند">
    یک plugin بسته‌ای است که می‌تواند هر ترکیبی از قابلیت‌ها را ثبت کند:
    کانال‌ها، ارائه‌دهندگان مدل، ابزارها، Skills، گفتار، رونویسی بی‌درنگ،
    صدای بی‌درنگ، درک رسانه، تولید تصویر، تولید ویدئو،
    دریافت وب، جستجوی وب، و موارد بیشتر. برخی plugins **هسته‌ای** هستند (همراه با
    OpenClaw عرضه می‌شوند)، و برخی دیگر **خارجی** هستند (توسط جامعه در npm منتشر می‌شوند).

    [نصب و پیکربندی plugins](/fa/tools/plugin) | [ساخت مورد اختصاصی خودتان](/fa/plugins/building-plugins)

  </Step>
</Steps>

## ابزارهای داخلی

این ابزارها همراه با OpenClaw عرضه می‌شوند و بدون نصب هیچ plugin در دسترس هستند:

| ابزار                                       | کاری که انجام می‌دهد                                                          | صفحه                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | اجرای فرمان‌های shell، مدیریت فرایندهای پس‌زمینه                       | [Exec](/fa/tools/exec), [تأییدیه‌های Exec](/fa/tools/exec-approvals) |
| `code_execution`                           | اجرای تحلیل Python راه‌دور در sandbox                                  | [اجرای کد](/fa/tools/code-execution)                      |
| `browser`                                  | کنترل مرورگر Chromium (پیمایش، کلیک، screenshot)              | [مرورگر](/fa/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | جستجوی وب، جستجوی پست‌های X، دریافت محتوای صفحه                    | [وب](/fa/tools/web), [دریافت وب](/fa/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ورودی/خروجی فایل در فضای کاری                                             |                                                              |
| `apply_patch`                              | patchهای چندبخشی فایل                                               | [اعمال Patch](/fa/tools/apply-patch)                            |
| `message`                                  | ارسال پیام در همه کانال‌ها                                     | [ارسال عامل](/fa/tools/agent-send)                              |
| `canvas`                                   | هدایت Canvas مربوط به Node (ارائه، eval، snapshot)                           |                                                              |
| `nodes`                                    | کشف و هدف‌گیری دستگاه‌های جفت‌شده                                    |                                                              |
| `cron` / `gateway`                         | مدیریت کارهای زمان‌بندی‌شده؛ بررسی، patch، راه‌اندازی مجدد، یا به‌روزرسانی gateway |                                                              |
| `image` / `image_generate`                 | تحلیل یا تولید تصویر                                            | [تولید تصویر](/fa/tools/image-generation)                  |
| `music_generate`                           | تولید قطعه‌های موسیقی                                                 | [تولید موسیقی](/fa/tools/music-generation)                  |
| `video_generate`                           | تولید ویدئو                                                       | [تولید ویدئو](/fa/tools/video-generation)                  |
| `tts`                                      | تبدیل یک‌باره متن به گفتار                                    | [TTS](/fa/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | مدیریت نشست، وضعیت، و هماهنگ‌سازی زیرعامل‌ها               | [زیرعامل‌ها](/fa/tools/subagents)                               |
| `session_status`                           | بازخوانی سبک‌وزن به سبک `/status` و override مدل نشست       | [ابزارهای نشست](/fa/concepts/session-tool)                      |

برای کار با تصویر، از `image` برای تحلیل و از `image_generate` برای تولید یا ویرایش استفاده کنید. اگر `openai/*`، `google/*`، `fal/*`، یا ارائه‌دهنده تصویر غیرفضلی دیگری را هدف می‌گیرید، ابتدا احراز هویت/API key آن ارائه‌دهنده را پیکربندی کنید.

برای کار با موسیقی، از `music_generate` استفاده کنید. اگر `google/*`، `minimax/*`، یا ارائه‌دهنده موسیقی غیرفضلی دیگری را هدف می‌گیرید، ابتدا احراز هویت/API key آن ارائه‌دهنده را پیکربندی کنید.

برای کار با ویدئو، از `video_generate` استفاده کنید. اگر `qwen/*` یا ارائه‌دهنده ویدئوی غیرفضلی دیگری را هدف می‌گیرید، ابتدا احراز هویت/API key آن ارائه‌دهنده را پیکربندی کنید.

برای تولید صوت مبتنی بر workflow، وقتی pluginای مانند
ComfyUI آن را ثبت می‌کند، از `music_generate` استفاده کنید. این از `tts` که تبدیل متن به گفتار است جداست.

`session_status` ابزار سبک‌وزن وضعیت/بازخوانی در گروه نشست‌ها است.
این ابزار به پرسش‌هایی به سبک `/status` درباره نشست فعلی پاسخ می‌دهد و می‌تواند
به‌صورت اختیاری یک override مدل برای هر نشست تنظیم کند؛ `model=default` آن
override را پاک می‌کند. مانند `/status`، می‌تواند شمارنده‌های پراکنده token/cache و برچسب
مدل runtime فعال را از آخرین ورودی کاربرد transcript تکمیل کند.

`gateway` ابزار runtime فقط مخصوص مالک برای عملیات gateway است:

- `config.schema.lookup` برای یک زیرشاخه پیکربندی محدود به مسیر پیش از ویرایش‌ها
- `config.get` برای snapshot + hash پیکربندی فعلی
- `config.patch` برای به‌روزرسانی‌های جزئی پیکربندی همراه با راه‌اندازی مجدد
- `config.apply` فقط برای جایگزینی کامل پیکربندی
- `update.run` برای خودبه‌روزرسانی صریح + راه‌اندازی مجدد

برای تغییرات جزئی، ابتدا `config.schema.lookup` و سپس `config.patch` را ترجیح دهید. فقط زمانی از
`config.apply` استفاده کنید که عمداً کل پیکربندی را جایگزین می‌کنید.
برای مستندات گسترده‌تر پیکربندی، [پیکربندی](/fa/gateway/configuration) و
[مرجع پیکربندی](/fa/gateway/configuration-reference) را بخوانید.
این ابزار همچنین از تغییر `tools.exec.ask` یا `tools.exec.security` خودداری می‌کند؛
نام‌های مستعار قدیمی `tools.bash.*` به همان مسیرهای exec محافظت‌شده عادی‌سازی می‌شوند.

### ابزارهای ارائه‌شده توسط Plugin

Plugins می‌توانند ابزارهای بیشتری ثبت کنند. چند نمونه:

- [Diffها](/fa/tools/diffs) — نمایشگر و رندرکننده diff
- [وظیفه LLM](/fa/tools/llm-task) — گام LLM فقط JSON برای خروجی ساختاریافته
- [Lobster](/fa/tools/lobster) — runtime workflow دارای نوع با تأییدیه‌های قابل ازسرگیری
- [تولید موسیقی](/fa/tools/music-generation) — ابزار مشترک `music_generate` با ارائه‌دهندگان مبتنی بر workflow
- [OpenProse](/fa/prose) — هماهنگ‌سازی workflow با رویکرد markdown-first
- [Tokenjuice](/fa/tools/tokenjuice) — فشرده‌سازی نتایج پرنویز ابزارهای `exec` و `bash`

## پیکربندی ابزار

### فهرست‌های مجاز و ممنوع

اینکه عامل چه ابزارهایی را می‌تواند فراخوانی کند، از طریق `tools.allow` / `tools.deny` در
پیکربندی کنترل کنید. ممنوع همیشه بر مجاز اولویت دارد.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw وقتی یک allowlist صریح به هیچ ابزار قابل فراخوانی‌ای resolve نشود، به‌صورت بسته شکست می‌خورد.
برای مثال، `tools.allow: ["query_db"]` فقط زمانی کار می‌کند که یک plugin بارگذاری‌شده واقعاً
`query_db` را ثبت کند. اگر هیچ ابزار داخلی، plugin، یا ابزار MCP بسته‌بندی‌شده‌ای با
allowlist مطابقت نداشته باشد، اجرا پیش از فراخوانی مدل متوقف می‌شود، به‌جای اینکه به‌صورت
اجرای فقط‌متن ادامه دهد که ممکن است نتایج ابزار را توهم کند.

### پروفایل‌های ابزار

`tools.profile` پیش از اعمال `allow`/`deny` یک allowlist پایه تنظیم می‌کند.
override برای هر عامل: `agents.list[].tools.profile`.

| پروفایل     | شامل چه چیزهایی است                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | پایه نامحدود برای دسترسی گسترده‌تر فرمان/کنترل؛ همانند تنظیم‌نکردن `tools.profile`                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | فقط `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` عمداً برای عامل‌های متمرکز بر کانال محدود است.
این پروفایل ابزارهای گسترده‌تر فرمان/کنترل مانند filesystem، runtime،
browser، canvas، nodes، cron، و کنترل gateway را کنار می‌گذارد. از `tools.profile: "full"`
به‌عنوان پایه نامحدود برای دسترسی گسترده‌تر فرمان/کنترل استفاده کنید، سپس در صورت نیاز
دسترسی را با `tools.allow` / `tools.deny` محدود کنید.
</Note>

`coding` ابزارهای سبک‌وزن وب (`web_search`، `web_fetch`، `x_search`) را شامل می‌شود
اما ابزار کامل کنترل مرورگر را نه. خودکارسازی مرورگر می‌تواند نشست‌های واقعی و
پروفایل‌های واردشده را هدایت کند، بنابراین آن را به‌صراحت با
`tools.alsoAllow: ["browser"]` یا
`agents.list[].tools.alsoAllow: ["browser"]` برای هر عامل اضافه کنید.

<Note>
پیکربندی `tools.exec` یا `tools.fs` زیر یک پروفایل محدود (`messaging`، `minimal`) به‌صورت ضمنی allowlist پروفایل را گسترده‌تر نمی‌کند. وقتی می‌خواهید یک پروفایل محدود از آن بخش‌های پیکربندی‌شده استفاده کند، ورودی‌های صریح `tools.alsoAllow` اضافه کنید (برای نمونه `["exec", "process"]` برای exec، یا `["read", "write", "edit"]` برای fs). OpenClaw وقتی یک بخش پیکربندی بدون grant متناظر `alsoAllow` حاضر باشد، هنگام startup هشدار ثبت می‌کند.
</Note>

پروفایل‌های `coding` و `messaging` همچنین ابزارهای MCP بسته‌بندی‌شده پیکربندی‌شده را
زیر کلید plugin با نام `bundle-mcp` مجاز می‌کنند. وقتی می‌خواهید
یک پروفایل built-inهای عادی خود را نگه دارد اما همه ابزارهای MCP پیکربندی‌شده را پنهان کند، `tools.deny: ["bundle-mcp"]` را اضافه کنید.
پروفایل `minimal` ابزارهای MCP بسته‌بندی‌شده را شامل نمی‌شود.

مثال (گسترده‌ترین سطح ابزار به‌صورت پیش‌فرض):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### گروه‌های ابزار

از میان‌برهای `group:*` در فهرست‌های allow/deny استفاده کنید:

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
| `group:openclaw`   | همهٔ ابزارهای داخلی OpenClaw (به‌جز ابزارهای Plugin)                                                     |

`sessions_history` یک نمای یادآوری محدود و فیلترشده از نظر ایمنی برمی‌گرداند. این نما
برچسب‌های thinking، اسکفلدینگ `<relevant-memories>`، payloadهای XML فراخوانی ابزار به‌صورت متن ساده
(از جمله `<tool_call>...</tool_call>`،
`<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`،
`<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شدهٔ فراخوانی ابزار)،
اسکفلدینگ تنزل‌یافتهٔ فراخوانی ابزار، توکن‌های کنترل مدل ASCII/تمام‌عرض افشاشده،
و XML نادرست فراخوانی ابزار MiniMax را از متن دستیار حذف می‌کند، سپس
به‌جای اینکه مانند یک دامپ خام رونوشت عمل کند، ویرایش محرمانه/کوتاه‌سازی و جایگزین‌های احتمالی برای ردیف‌های بیش‌ازحد بزرگ را اعمال می‌کند.

### محدودیت‌های ویژهٔ ارائه‌دهنده

از `tools.byProvider` برای محدود کردن ابزارها برای ارائه‌دهنده‌های مشخص استفاده کنید، بدون اینکه
پیش‌فرض‌های سراسری را تغییر دهید:

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
