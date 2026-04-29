---
read_when:
    - می‌خواهید بدانید OpenClaw چه ابزارهایی ارائه می‌دهد
    - باید ابزارها را پیکربندی کنید، به آن‌ها اجازه دهید یا آن‌ها را رد کنید
    - در حال تصمیم‌گیری بین ابزارهای توکار، Skills و Pluginها هستید
summary: 'مرور کلی ابزارها و Pluginهای OpenClaw: عامل چه کارهایی می‌تواند انجام دهد و چگونه آن را گسترش دهید'
title: ابزارها و Pluginها
x-i18n:
    generated_at: "2026-04-29T23:43:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

هر کاری که عامل فراتر از تولید متن انجام می‌دهد، از طریق **ابزارها** رخ می‌دهد.
ابزارها راهی هستند که عامل با آن فایل‌ها را می‌خواند، فرمان‌ها را اجرا می‌کند، وب را مرور می‌کند، پیام
می‌فرستد و با دستگاه‌ها تعامل می‌کند.

## ابزارها، Skills، و Pluginها

OpenClaw سه لایه دارد که با هم کار می‌کنند:

<Steps>
  <Step title="ابزارها همان چیزهایی هستند که عامل فراخوانی می‌کند">
    ابزار یک تابع دارای نوع است که عامل می‌تواند آن را فراخوانی کند (مثلاً `exec`، `browser`،
    `web_search`، `message`). OpenClaw مجموعه‌ای از **ابزارهای داخلی** ارائه می‌کند و
    Pluginها می‌توانند موارد بیشتری ثبت کنند.

    عامل ابزارها را به‌صورت تعریف‌های تابع ساختاریافته‌ای می‌بیند که به API مدل فرستاده می‌شوند.

  </Step>

  <Step title="Skills به عامل می‌آموزند چه زمانی و چگونه">
    یک skill فایل markdown (`SKILL.md`) است که در system prompt تزریق می‌شود.
    Skills به عامل زمینه، محدودیت‌ها و راهنمایی گام‌به‌گام می‌دهند تا از
    ابزارها به‌طور مؤثر استفاده کند. Skills در workspace شما، در پوشه‌های مشترک،
    یا داخل Pluginها ارائه می‌شوند.

    [مرجع Skills](/fa/tools/skills) | [ایجاد Skills](/fa/tools/creating-skills)

  </Step>

  <Step title="Pluginها همه‌چیز را با هم بسته‌بندی می‌کنند">
    Plugin بسته‌ای است که می‌تواند هر ترکیبی از قابلیت‌ها را ثبت کند:
    کانال‌ها، ارائه‌دهندگان مدل، ابزارها، Skills، گفتار، رونویسی هم‌زمان،
    صدای هم‌زمان، درک رسانه، تولید تصویر، تولید ویدئو،
    دریافت وب، جست‌وجوی وب، و موارد بیشتر. برخی Pluginها **core** هستند (همراه
    OpenClaw ارائه می‌شوند)، برخی دیگر **external** هستند (توسط جامعه روی npm منتشر می‌شوند).

    [نصب و پیکربندی Pluginها](/fa/tools/plugin) | [خودتان بسازید](/fa/plugins/building-plugins)

  </Step>
</Steps>

## ابزارهای داخلی

این ابزارها همراه OpenClaw ارائه می‌شوند و بدون نصب هیچ Pluginی در دسترس هستند:

| ابزار                                      | کاری که انجام می‌دهد                                                   | صفحه                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | اجرای فرمان‌های shell، مدیریت فرایندهای پس‌زمینه                      | [Exec](/fa/tools/exec), [تأییدهای Exec](/fa/tools/exec-approvals) |
| `code_execution`                           | اجرای تحلیل Python از راه دور در sandbox                              | [اجرای کد](/fa/tools/code-execution)                           |
| `browser`                                  | کنترل مرورگر Chromium (ناوبری، کلیک، screenshot)                      | [مرورگر](/fa/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | جست‌وجوی وب، جست‌وجوی پست‌های X، دریافت محتوای صفحه                 | [وب](/fa/tools/web), [دریافت وب](/fa/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ورودی/خروجی فایل در workspace                                         |                                                              |
| `apply_patch`                              | patchهای فایل چندبخشی                                                 | [اعمال Patch](/fa/tools/apply-patch)                           |
| `message`                                  | ارسال پیام در همه کانال‌ها                                            | [ارسال عامل](/fa/tools/agent-send)                             |
| `canvas`                                   | راهبری node Canvas (ارائه، eval، snapshot)                            |                                                              |
| `nodes`                                    | کشف و هدف‌گیری دستگاه‌های جفت‌شده                                     |                                                              |
| `cron` / `gateway`                         | مدیریت کارهای زمان‌بندی‌شده؛ بازرسی، patch، راه‌اندازی مجدد، یا به‌روزرسانی gateway |                                                              |
| `image` / `image_generate`                 | تحلیل یا تولید تصویر                                                   | [تولید تصویر](/fa/tools/image-generation)                      |
| `music_generate`                           | تولید قطعه‌های موسیقی                                                  | [تولید موسیقی](/fa/tools/music-generation)                     |
| `video_generate`                           | تولید ویدئوها                                                         | [تولید ویدئو](/fa/tools/video-generation)                      |
| `tts`                                      | تبدیل یک‌باره متن به گفتار                                            | [TTS](/fa/tools/tts)                                           |
| `sessions_*` / `subagents` / `agents_list` | مدیریت نشست، وضعیت، و هماهنگ‌سازی زیرعامل‌ها                          | [زیرعامل‌ها](/fa/tools/subagents)                              |
| `session_status`                           | بازخوانی سبک به سبک `/status` و override مدل نشست                    | [ابزارهای نشست](/fa/concepts/session-tool)                    |

برای کار با تصویر، از `image` برای تحلیل و از `image_generate` برای تولید یا ویرایش استفاده کنید. اگر `openai/*`، `google/*`، `fal/*`، یا ارائه‌دهنده تصویر غیردیفالتی دیگری را هدف می‌گیرید، ابتدا auth/API key آن ارائه‌دهنده را پیکربندی کنید.

برای کار با موسیقی، از `music_generate` استفاده کنید. اگر `google/*`، `minimax/*`، یا ارائه‌دهنده موسیقی غیردیفالتی دیگری را هدف می‌گیرید، ابتدا auth/API key آن ارائه‌دهنده را پیکربندی کنید.

برای کار با ویدئو، از `video_generate` استفاده کنید. اگر `qwen/*` یا ارائه‌دهنده ویدئوی غیردیفالتی دیگری را هدف می‌گیرید، ابتدا auth/API key آن ارائه‌دهنده را پیکربندی کنید.

برای تولید صدای مبتنی بر workflow، وقتی Pluginای مانند
ComfyUI آن را ثبت می‌کند، از `music_generate` استفاده کنید. این جدا از `tts` است که متن را به گفتار تبدیل می‌کند.

`session_status` ابزار سبک وضعیت/بازخوانی در گروه نشست‌ها است.
به پرسش‌های به سبک `/status` درباره نشست فعلی پاسخ می‌دهد و می‌تواند
به‌صورت اختیاری یک override مدل برای هر نشست تنظیم کند؛ `model=default` آن
override را پاک می‌کند. مانند `/status`، می‌تواند شمارنده‌های پراکنده token/cache و
برچسب مدل runtime فعال را از آخرین ورودی استفاده transcript تکمیل کند.

`gateway` ابزار runtime فقط برای مالک در عملیات gateway است:

- `config.schema.lookup` برای یک زیردرخت پیکربندی محدود به مسیر پیش از ویرایش‌ها
- `config.get` برای snapshot + hash پیکربندی فعلی
- `config.patch` برای به‌روزرسانی‌های جزئی پیکربندی همراه با راه‌اندازی مجدد
- `config.apply` فقط برای جایگزینی کامل پیکربندی
- `update.run` برای خودبه‌روزرسانی صریح + راه‌اندازی مجدد

برای تغییرات جزئی، ابتدا `config.schema.lookup` و سپس `config.patch` را ترجیح دهید. فقط وقتی از
`config.apply` استفاده کنید که عمداً کل پیکربندی را جایگزین می‌کنید.
برای مستندات گسترده‌تر پیکربندی، [پیکربندی](/fa/gateway/configuration) و
[مرجع پیکربندی](/fa/gateway/configuration-reference) را بخوانید.
این ابزار همچنین از تغییر `tools.exec.ask` یا `tools.exec.security` خودداری می‌کند؛
aliasهای قدیمی `tools.bash.*` به همان مسیرهای محافظت‌شده exec نرمال‌سازی می‌شوند.

### ابزارهای ارائه‌شده توسط Plugin

Pluginها می‌توانند ابزارهای بیشتری ثبت کنند. چند نمونه:

- [Diffها](/fa/tools/diffs) — نمایشگر و renderer diff
- [وظیفه LLM](/fa/tools/llm-task) — گام LLM فقط JSON برای خروجی ساختاریافته
- [Lobster](/fa/tools/lobster) — runtime workflow دارای نوع با تأییدهای قابل‌ازسرگیری
- [تولید موسیقی](/fa/tools/music-generation) — ابزار مشترک `music_generate` با ارائه‌دهندگان پشتیبانی‌شده با workflow
- [OpenProse](/fa/prose) — هماهنگ‌سازی workflow با اولویت markdown
- [Tokenjuice](/fa/tools/tokenjuice) — فشرده‌سازی نتایج پرنویز ابزارهای `exec` و `bash`

## پیکربندی ابزار

### فهرست‌های مجاز و ممنوع

کنترل کنید عامل کدام ابزارها را می‌تواند از طریق `tools.allow` / `tools.deny` در
پیکربندی فراخوانی کند. deny همیشه بر allow غلبه می‌کند.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw وقتی یک allowlist صریح به هیچ ابزار قابل‌فراخوانی‌ای resolve نشود، بسته و متوقف می‌شود.
برای مثال، `tools.allow: ["query_db"]` فقط وقتی کار می‌کند که یک Plugin بارگذاری‌شده واقعاً
`query_db` را ثبت کند. اگر هیچ ابزار داخلی، Plugin، یا ابزار MCP بسته‌بندی‌شده‌ای با
allowlist تطبیق نداشته باشد، اجرا پیش از فراخوانی مدل متوقف می‌شود، به‌جای اینکه به‌صورت
اجرای فقط متنی ادامه دهد که ممکن است نتایج ابزار را hallucinate کند.

### پروفایل‌های ابزار

`tools.profile` پیش از اعمال `allow`/`deny` یک allowlist پایه تنظیم می‌کند.
override برای هر عامل: `agents.list[].tools.profile`.

| پروفایل     | شامل چه چیزهایی است                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | baseline نامحدود برای دسترسی گسترده‌تر command/control؛ همانند تنظیم‌نکردن `tools.profile`                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | فقط `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` عمداً برای عامل‌های متمرکز بر کانال محدود است.
ابزارهای گسترده‌تر command/control مانند filesystem، runtime،
browser، canvas، nodes، cron، و کنترل gateway را کنار می‌گذارد. از `tools.profile: "full"`
به‌عنوان baseline نامحدود برای دسترسی گسترده‌تر command/control استفاده کنید، سپس در صورت نیاز
دسترسی را با `tools.allow` / `tools.deny` محدود کنید.
</Note>

`coding` ابزارهای سبک وب (`web_search`، `web_fetch`، `x_search`) را شامل می‌شود
اما ابزار کامل کنترل مرورگر را نه. خودکارسازی مرورگر می‌تواند نشست‌های واقعی
و پروفایل‌های واردشده را راهبری کند، بنابراین آن را صریحاً با
`tools.alsoAllow: ["browser"]` یا
`agents.list[].tools.alsoAllow: ["browser"]` برای هر عامل اضافه کنید.

پروفایل‌های `coding` و `messaging` همچنین ابزارهای MCP بسته‌بندی‌شده پیکربندی‌شده را
زیر کلید Plugin با نام `bundle-mcp` مجاز می‌کنند. وقتی می‌خواهید
یک پروفایل built-inهای عادی خود را نگه دارد اما همه ابزارهای MCP پیکربندی‌شده را پنهان کند،
`tools.deny: ["bundle-mcp"]` را اضافه کنید.
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

در فهرست‌های allow/deny از میان‌برهای `group:*` استفاده کنید:

| گروه               | ابزارها                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec، process، code_execution (`bash` به‌عنوان نام مستعار برای `exec` پذیرفته می‌شود)                    |
| `group:fs`         | read، write، edit، apply_patch                                                                            |
| `group:sessions`   | sessions_list، sessions_history، sessions_send، sessions_spawn، sessions_yield، subagents، session_status |
| `group:memory`     | memory_search، memory_get                                                                                 |
| `group:web`        | web_search، x_search، web_fetch                                                                           |
| `group:ui`         | browser، canvas                                                                                           |
| `group:automation` | cron، gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image، image_generate، music_generate، video_generate، tts                                                |
| `group:openclaw`   | همه ابزارهای داخلی OpenClaw (ابزارهای Plugin را شامل نمی‌شود)                                            |

`sessions_history` نمای یادآوری محدود و فیلترشده از نظر ایمنی را برمی‌گرداند. این نما
برچسب‌های تفکر، ساختار کمکی `<relevant-memories>`، بارهای XML فراخوانی ابزار به‌صورت متن ساده
(از جمله `<tool_call>...</tool_call>`،
`<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`،
`<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شده فراخوانی ابزار)،
ساختار کمکی تنزل‌یافته فراخوانی ابزار، توکن‌های کنترلی مدل ASCII/تمام‌عرضِ نشت‌کرده،
و XML ناقص فراخوانی ابزار MiniMax را از متن دستیار حذف می‌کند، سپس
پوشاندن/کوتاه‌سازی و جای‌نگهدارهای احتمالی برای ردیف‌های بیش‌ازحد بزرگ را اعمال می‌کند، به‌جای آنکه
مثل تخلیه خام رونوشت عمل کند.

### محدودیت‌های ویژه ارائه‌دهنده

از `tools.byProvider` برای محدود کردن ابزارها برای ارائه‌دهندگان مشخص استفاده کنید، بدون اینکه
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
