---
read_when:
    - می‌خواهید بدانید OpenClaw چه ابزارهایی ارائه می‌دهد
    - باید ابزارها را پیکربندی، مجاز یا رد کنید
    - شما بین ابزارهای توکار، Skills و Pluginها تصمیم می‌گیرید
summary: 'نمای کلی ابزارها و Pluginهای OpenClaw: عامل چه کارهایی می‌تواند انجام دهد و چگونه می‌توان آن را گسترش داد'
title: ابزارها و Plugin‌ها
x-i18n:
    generated_at: "2026-05-03T11:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

هر کاری که عامل فراتر از تولید متن انجام می‌دهد، از طریق **ابزارها** انجام می‌شود.
ابزارها روشی هستند که عامل با آن فایل‌ها را می‌خواند، فرمان‌ها را اجرا می‌کند، وب را مرور می‌کند، پیام می‌فرستد و با دستگاه‌ها تعامل می‌کند.

## ابزارها، Skills و Pluginها

OpenClaw سه لایه دارد که با هم کار می‌کنند:

<Steps>
  <Step title="ابزارها همان چیزهایی هستند که عامل فراخوانی می‌کند">
    ابزار یک تابع نوع‌دار است که عامل می‌تواند آن را فراخوانی کند (مثلاً `exec`، `browser`،
    `web_search`، `message`). OpenClaw مجموعه‌ای از **ابزارهای داخلی** ارائه می‌کند و
    Pluginها می‌توانند موارد بیشتری ثبت کنند.

    عامل ابزارها را به‌صورت تعریف‌های تابع ساختاریافته می‌بیند که به API مدل ارسال می‌شوند.

  </Step>

  <Step title="Skills به عامل یاد می‌دهند چه زمانی و چگونه">
    یک skill فایل markdown (`SKILL.md`) است که در system prompt تزریق می‌شود.
    Skills به عامل زمینه، محدودیت‌ها و راهنمای گام‌به‌گام برای
    استفاده مؤثر از ابزارها می‌دهند. Skills در فضای کاری شما، در پوشه‌های مشترک
    یا داخل Pluginها قرار می‌گیرند.

    [مرجع Skills](/fa/tools/skills) | [ایجاد Skills](/fa/tools/creating-skills)

  </Step>

  <Step title="Pluginها همه چیز را با هم بسته‌بندی می‌کنند">
    Plugin بسته‌ای است که می‌تواند هر ترکیبی از قابلیت‌ها را ثبت کند:
    کانال‌ها، ارائه‌دهندگان مدل، ابزارها، Skills، گفتار، رونویسی بلادرنگ،
    صدای بلادرنگ، فهم رسانه، تولید تصویر، تولید ویدئو،
    دریافت وب، جست‌وجوی وب و موارد بیشتر. برخی Pluginها **هسته‌ای** هستند (همراه
    OpenClaw عرضه می‌شوند)، برخی دیگر **خارجی** هستند (توسط جامعه روی npm منتشر می‌شوند).

    [نصب و پیکربندی Pluginها](/fa/tools/plugin) | [خودتان بسازید](/fa/plugins/building-plugins)

  </Step>
</Steps>

## ابزارهای داخلی

این ابزارها همراه OpenClaw عرضه می‌شوند و بدون نصب هیچ Pluginی در دسترس هستند:

| ابزار                                       | چه کاری انجام می‌دهد                                                          | صفحه                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | اجرای فرمان‌های shell، مدیریت فرایندهای پس‌زمینه                       | [Exec](/fa/tools/exec), [تأییدیه‌های Exec](/fa/tools/exec-approvals) |
| `code_execution`                           | اجرای تحلیل Python راه‌دور در sandbox                                  | [اجرای کد](/fa/tools/code-execution)                      |
| `browser`                                  | کنترل مرورگر Chromium (پیمایش، کلیک، screenshot)              | [مرورگر](/fa/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | جست‌وجوی وب، جست‌وجوی پست‌های X، دریافت محتوای صفحه                    | [وب](/fa/tools/web), [دریافت وب](/fa/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ورودی/خروجی فایل در فضای کاری                                             |                                                              |
| `apply_patch`                              | patchهای چندبخشی فایل                                               | [اعمال Patch](/fa/tools/apply-patch)                            |
| `message`                                  | ارسال پیام در همه کانال‌ها                                     | [ارسال عامل](/fa/tools/agent-send)                              |
| `canvas`                                   | هدایت node Canvas (ارائه، ارزیابی، snapshot)                           |                                                              |
| `nodes`                                    | کشف و هدف‌گیری دستگاه‌های جفت‌شده                                    |                                                              |
| `cron` / `gateway`                         | مدیریت کارهای زمان‌بندی‌شده؛ بازرسی، patch، راه‌اندازی مجدد یا به‌روزرسانی Gateway |                                                              |
| `image` / `image_generate`                 | تحلیل یا تولید تصویر                                            | [تولید تصویر](/fa/tools/image-generation)                  |
| `music_generate`                           | تولید قطعه‌های موسیقی                                                 | [تولید موسیقی](/fa/tools/music-generation)                  |
| `video_generate`                           | تولید ویدئو                                                       | [تولید ویدئو](/fa/tools/video-generation)                  |
| `tts`                                      | تبدیل یک‌باره متن به گفتار                                    | [TTS](/fa/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | مدیریت نشست، وضعیت و هماهنگ‌سازی زیرعامل‌ها               | [زیرعامل‌ها](/fa/tools/subagents)                               |
| `session_status`                           | بازخوانی سبک به سبک `/status` و بازنویسی مدل نشست       | [ابزارهای نشست](/fa/concepts/session-tool)                      |

برای کار تصویری، از `image` برای تحلیل و از `image_generate` برای تولید یا ویرایش استفاده کنید. اگر `openai/*`، `google/*`، `fal/*` یا ارائه‌دهنده تصویر غیربنیادی دیگری را هدف می‌گیرید، ابتدا auth/API key آن ارائه‌دهنده را پیکربندی کنید.

برای کار موسیقی، از `music_generate` استفاده کنید. اگر `google/*`، `minimax/*` یا ارائه‌دهنده موسیقی غیربنیادی دیگری را هدف می‌گیرید، ابتدا auth/API key آن ارائه‌دهنده را پیکربندی کنید.

برای کار ویدئو، از `video_generate` استفاده کنید. اگر `qwen/*` یا ارائه‌دهنده ویدئوی غیربنیادی دیگری را هدف می‌گیرید، ابتدا auth/API key آن ارائه‌دهنده را پیکربندی کنید.

برای تولید صوت مبتنی بر گردش کار، وقتی Pluginی مانند
ComfyUI آن را ثبت می‌کند از `music_generate` استفاده کنید. این جدا از `tts` است که متن به گفتار است.

`session_status` ابزار سبک وضعیت/بازخوانی در گروه نشست‌ها است.
به پرسش‌های به سبک `/status` درباره نشست فعلی پاسخ می‌دهد و می‌تواند
به‌صورت اختیاری یک بازنویسی مدل مختص نشست تنظیم کند؛ `model=default` آن
بازنویسی را پاک می‌کند. مانند `/status`، می‌تواند شمارنده‌های پراکنده token/cache و برچسب
مدل runtime فعال را از آخرین ورودی مصرف transcript تکمیل کند.

`gateway` ابزار runtime فقط برای مالک برای عملیات Gateway است:

- `config.schema.lookup` برای یک زیردرخت پیکربندی محدود به مسیر پیش از ویرایش‌ها
- `config.get` برای snapshot و hash پیکربندی فعلی
- `config.patch` برای به‌روزرسانی‌های جزئی پیکربندی همراه با راه‌اندازی مجدد
- `config.apply` فقط برای جایگزینی کامل پیکربندی
- `update.run` برای self-update صریح همراه با راه‌اندازی مجدد

برای تغییرات جزئی، ابتدا `config.schema.lookup` و سپس `config.patch` را ترجیح دهید. از
`config.apply` فقط زمانی استفاده کنید که عمداً کل پیکربندی را جایگزین می‌کنید.
برای مستندات گسترده‌تر پیکربندی، [پیکربندی](/fa/gateway/configuration) و
[مرجع پیکربندی](/fa/gateway/configuration-reference) را بخوانید.
این ابزار همچنین از تغییر `tools.exec.ask` یا `tools.exec.security` خودداری می‌کند؛
aliasهای قدیمی `tools.bash.*` به همان مسیرهای محافظت‌شده exec عادی‌سازی می‌شوند.

### ابزارهای ارائه‌شده توسط Plugin

Pluginها می‌توانند ابزارهای بیشتری ثبت کنند. چند نمونه:

- [Diffها](/fa/tools/diffs) — نمایشگر و رندرکننده diff
- [LLM Task](/fa/tools/llm-task) — گام LLM فقط JSON برای خروجی ساختاریافته
- [Lobster](/fa/tools/lobster) — runtime گردش کار نوع‌دار با تأییدیه‌های قابل ازسرگیری
- [تولید موسیقی](/fa/tools/music-generation) — ابزار مشترک `music_generate` با ارائه‌دهندگان پشتیبانی‌شده با گردش کار
- [OpenProse](/fa/prose) — هماهنگ‌سازی گردش کار با اولویت markdown
- [Tokenjuice](/fa/tools/tokenjuice) — فشرده‌سازی نتایج پرنویز ابزارهای `exec` و `bash`

ابزارهای Plugin همچنان با `api.registerTool(...)` نوشته می‌شوند و در
فهرست `contracts.tools` در manifest Plugin اعلام می‌شوند. OpenClaw توصیفگر
اعتبارسنجی‌شده ابزار را هنگام discovery ضبط می‌کند و آن را بر اساس منبع Plugin و قرارداد cache می‌کند، تا
برنامه‌ریزی ابزار در مراحل بعد بتواند از بارگذاری runtime Plugin صرف‌نظر کند. اجرای ابزار همچنان
Plugin مالک را بارگذاری می‌کند و پیاده‌سازی ثبت‌شده زنده را فراخوانی می‌کند.

## پیکربندی ابزار

### فهرست‌های اجازه و منع

کنترل کنید عامل کدام ابزارها را می‌تواند از طریق `tools.allow` / `tools.deny` در
پیکربندی فراخوانی کند. منع همیشه بر اجازه مقدم است.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

وقتی یک allowlist صریح به هیچ ابزار قابل‌فراخوانی resolve نشود، OpenClaw بسته می‌ماند.
برای مثال، `tools.allow: ["query_db"]` فقط زمانی کار می‌کند که یک Plugin بارگذاری‌شده واقعاً
`query_db` را ثبت کند. اگر هیچ ابزار داخلی، Plugin یا ابزار MCP بسته‌بندی‌شده‌ای با
allowlist مطابق نباشد، اجرا پیش از فراخوانی مدل متوقف می‌شود، به‌جای اینکه به‌صورت
اجرای فقط متنی ادامه دهد که ممکن است نتایج ابزار را hallucinate کند.

### پروفایل‌های ابزار

`tools.profile` پیش از اعمال `allow`/`deny` یک allowlist پایه تنظیم می‌کند.
بازنویسی مختص عامل: `agents.list[].tools.profile`.

| پروفایل     | شامل چه چیزهایی است                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | همه ابزارهای هسته‌ای و Plugin اختیاری؛ خط پایه بدون محدودیت برای دسترسی گسترده‌تر فرمان/کنترل                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | فقط `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` عمداً برای عامل‌های متمرکز بر کانال محدود است.
ابزارهای گسترده‌تر فرمان/کنترل مانند فایل‌سیستم، runtime،
مرورگر، canvas، nodes، cron و کنترل Gateway را کنار می‌گذارد. از `tools.profile: "full"`
به‌عنوان خط پایه بدون محدودیت برای دسترسی گسترده‌تر فرمان/کنترل استفاده کنید، سپس در صورت نیاز
دسترسی را با `tools.allow` / `tools.deny` محدود کنید.
</Note>

`coding` ابزارهای سبک وب (`web_search`، `web_fetch`، `x_search`) را شامل می‌شود
اما ابزار کامل کنترل مرورگر را شامل نمی‌شود. خودکارسازی مرورگر می‌تواند نشست‌های واقعی
و پروفایل‌های واردشده را هدایت کند، بنابراین آن را صراحتاً با
`tools.alsoAllow: ["browser"]` یا
`agents.list[].tools.alsoAllow: ["browser"]` مختص عامل اضافه کنید.

<Note>
پیکربندی `tools.exec` یا `tools.fs` زیر یک پروفایل محدود (`messaging`، `minimal`) به‌صورت ضمنی allowlist پروفایل را گسترش نمی‌دهد. وقتی می‌خواهید یک پروفایل محدود از آن بخش‌های پیکربندی‌شده استفاده کند، ورودی‌های صریح `tools.alsoAllow` اضافه کنید (برای مثال `["exec", "process"]` برای exec، یا `["read", "write", "edit"]` برای fs). OpenClaw وقتی یک بخش پیکربندی بدون grant متناظر `alsoAllow` وجود داشته باشد، هنگام شروع یک هشدار ثبت می‌کند.
</Note>

پروفایل‌های `coding` و `messaging` همچنین ابزارهای MCP بسته‌بندی‌شده پیکربندی‌شده را
زیر کلید Plugin با نام `bundle-mcp` مجاز می‌کنند. وقتی می‌خواهید
یک پروفایل built-inهای عادی خود را نگه دارد اما همه ابزارهای MCP پیکربندی‌شده را پنهان کند، `tools.deny: ["bundle-mcp"]` را اضافه کنید.
پروفایل `minimal` ابزارهای MCP بسته‌بندی‌شده را شامل نمی‌شود.

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
| `group:openclaw`   | همهٔ ابزارهای داخلی OpenClaw (ابزارهای Plugin را شامل نمی‌شود)                                           |

`sessions_history` نمای یادآوری محدود و فیلترشده از نظر ایمنی را برمی‌گرداند. این نما
برچسب‌های تفکر، چارچوب `<relevant-memories>`، بارهای XML فراخوانی ابزار در متن ساده
(از جمله `<tool_call>...</tool_call>`،
`<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`،
`<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شدهٔ فراخوانی ابزار)،
چارچوب‌بندی تنزل‌یافتهٔ فراخوانی ابزار، توکن‌های کنترلی مدل نشت‌کرده به صورت ASCII/تمام‌عرض،
و XML بدساخت فراخوانی ابزار MiniMax را از متن دستیار حذف می‌کند، سپس
به‌جای عمل‌کردن به‌عنوان تخلیهٔ خام رونوشت، پالایش/کوتاه‌سازی و در صورت لزوم
جای‌گیرهای ردیف‌های بیش‌ازحد بزرگ را اعمال می‌کند.

### محدودیت‌های ویژهٔ ارائه‌دهنده

برای محدودکردن ابزارها برای ارائه‌دهندگان مشخص، بدون تغییر پیش‌فرض‌های سراسری، از `tools.byProvider` استفاده کنید:

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
