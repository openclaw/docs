---
read_when:
    - می‌خواهید بدانید OpenClaw چه ابزارهایی ارائه می‌دهد
    - باید ابزارها را پیکربندی، مجاز یا رد کنید
    - شما در حال تصمیم‌گیری بین ابزارهای داخلی، Skills و Plugin‌ها هستید
summary: 'نمای کلی ابزارها و Pluginهای OpenClaw: عامل چه کارهایی می‌تواند انجام دهد و چگونه می‌توان آن را گسترش داد'
title: ابزارها و Pluginها
x-i18n:
    generated_at: "2026-05-06T09:46:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 894f6dc7e840f3153e95696a63c470a200886af7d3dc8399e87446cf0fb1b027
    source_path: tools/index.md
    workflow: 16
---

هر کاری که عامل فراتر از تولید متن انجام می‌دهد از طریق **ابزارها** انجام می‌شود.
ابزارها روشی هستند که عامل با آن فایل‌ها را می‌خواند، فرمان‌ها را اجرا می‌کند، وب را مرور می‌کند، پیام‌ها را
ارسال می‌کند و با دستگاه‌ها تعامل دارد.

## ابزارها، Skills و Pluginها

OpenClaw سه لایه دارد که با هم کار می‌کنند:

<Steps>
  <Step title="ابزارها همان چیزهایی هستند که عامل فراخوانی می‌کند">
    ابزار یک تابع تایپ‌شده است که عامل می‌تواند آن را فراخوانی کند (مثلاً `exec`، `browser`،
    `web_search`، `message`). OpenClaw مجموعه‌ای از **ابزارهای داخلی** را ارائه می‌کند و
    Pluginها می‌توانند ابزارهای بیشتری ثبت کنند.

    عامل ابزارها را به‌صورت تعریف‌های ساخت‌یافتهٔ تابع می‌بیند که به API مدل ارسال می‌شوند.

  </Step>

  <Step title="Skills به عامل یاد می‌دهد چه زمانی و چگونه">
    Skill یک فایل markdown (`SKILL.md`) است که در system prompt تزریق می‌شود.
    Skills به عامل زمینه، محدودیت‌ها و راهنمایی گام‌به‌گام می‌دهد تا
    از ابزارها به‌شکل مؤثر استفاده کند. Skills در workspace شما، در پوشه‌های مشترک،
    یا داخل Pluginها قرار می‌گیرد.

    [مرجع Skills](/fa/tools/skills) | [ساخت Skills](/fa/tools/creating-skills)

  </Step>

  <Step title="Pluginها همه‌چیز را با هم بسته‌بندی می‌کنند">
    Plugin بسته‌ای است که می‌تواند هر ترکیبی از قابلیت‌ها را ثبت کند:
    کانال‌ها، ارائه‌دهندگان مدل، ابزارها، Skills، گفتار، رونویسی بلادرنگ،
    صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدئو،
    واکشی وب، جست‌وجوی وب و موارد بیشتر. برخی Pluginها **هسته‌ای** هستند (همراه
    OpenClaw ارائه می‌شوند)، و برخی دیگر **خارجی** هستند (توسط جامعه در npm منتشر می‌شوند).

    [نصب و پیکربندی Pluginها](/fa/tools/plugin) | [Plugin خودتان را بسازید](/fa/plugins/building-plugins)

  </Step>
</Steps>

## ابزارهای داخلی

این ابزارها همراه OpenClaw ارائه می‌شوند و بدون نصب هیچ Pluginی در دسترس هستند:

| ابزار                                      | چه کاری انجام می‌دهد                                                | صفحه                                                        |
| ------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `exec` / `process`                         | اجرای فرمان‌های shell، مدیریت فرایندهای پس‌زمینه                   | [Exec](/fa/tools/exec)، [تأییدهای Exec](/fa/tools/exec-approvals) |
| `code_execution`                           | اجرای تحلیل Python راه‌دور در sandbox                              | [اجرای کد](/fa/tools/code-execution)                           |
| `browser`                                  | کنترل مرورگر Chromium (پیمایش، کلیک، screenshot)                   | [مرورگر](/fa/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | جست‌وجوی وب، جست‌وجوی پست‌های X، واکشی محتوای صفحه                 | [وب](/fa/tools/web)، [واکشی وب](/fa/tools/web-fetch)              |
| `read` / `write` / `edit`                  | ورودی/خروجی فایل در workspace                                      |                                                             |
| `apply_patch`                              | وصله‌های چندبخشی فایل                                               | [اعمال وصله](/fa/tools/apply-patch)                            |
| `message`                                  | ارسال پیام در همهٔ کانال‌ها                                        | [ارسال عامل](/fa/tools/agent-send)                             |
| `canvas`                                   | هدایت node Canvas (ارائه، eval، snapshot)                          |                                                             |
| `nodes`                                    | کشف و هدف‌گیری دستگاه‌های جفت‌شده                                  |                                                             |
| `cron` / `gateway`                         | مدیریت کارهای زمان‌بندی‌شده؛ بازرسی، وصله، راه‌اندازی مجدد، یا به‌روزرسانی Gateway |                                                             |
| `image` / `image_generate`                 | تحلیل یا تولید تصویر                                                | [تولید تصویر](/fa/tools/image-generation)                      |
| `music_generate`                           | تولید قطعه‌های موسیقی                                               | [تولید موسیقی](/fa/tools/music-generation)                     |
| `video_generate`                           | تولید ویدئوها                                                       | [تولید ویدئو](/fa/tools/video-generation)                      |
| `tts`                                      | تبدیل یک‌مرحله‌ای متن به گفتار                                      | [TTS](/fa/tools/tts)                                           |
| `sessions_*` / `subagents` / `agents_list` | مدیریت نشست، وضعیت و هماهنگ‌سازی زیرعامل‌ها                        | [زیرعامل‌ها](/fa/tools/subagents)                              |
| `session_status`                           | بازخوانی سبک به سبک `/status` و بازنویسی مدل نشست                  | [ابزارهای نشست](/fa/concepts/session-tool)                     |

برای کارهای تصویری، از `image` برای تحلیل و از `image_generate` برای تولید یا ویرایش استفاده کنید. اگر `openai/*`، `google/*`، `fal/*` یا ارائه‌دهندهٔ تصویر غیرپیش‌فرض دیگری را هدف می‌گیرید، ابتدا احراز هویت/کلید API آن ارائه‌دهنده را پیکربندی کنید.

برای کارهای موسیقی، از `music_generate` استفاده کنید. اگر `google/*`، `minimax/*` یا ارائه‌دهندهٔ موسیقی غیرپیش‌فرض دیگری را هدف می‌گیرید، ابتدا احراز هویت/کلید API آن ارائه‌دهنده را پیکربندی کنید.

برای کارهای ویدئویی، از `video_generate` استفاده کنید. اگر `qwen/*` یا ارائه‌دهندهٔ ویدئوی غیرپیش‌فرض دیگری را هدف می‌گیرید، ابتدا احراز هویت/کلید API آن ارائه‌دهنده را پیکربندی کنید.

برای تولید صوت مبتنی بر گردش کار، وقتی Pluginی مانند
ComfyUI آن را ثبت می‌کند از `music_generate` استفاده کنید. این از `tts`، که متن به گفتار است، جداست.

`session_status` ابزار سبک وضعیت/بازخوانی در گروه نشست‌ها است.
به پرسش‌های به سبک `/status` دربارهٔ نشست فعلی پاسخ می‌دهد و می‌تواند
به‌صورت اختیاری بازنویسی مدل برای هر نشست تنظیم کند؛ `model=default` آن
بازنویسی را پاک می‌کند. مانند `/status`، می‌تواند شمارنده‌های پراکندهٔ token/cache و
برچسب مدل runtime فعال را از آخرین ورودی استفادهٔ transcript تکمیل کند.

`gateway` ابزار runtime فقط برای مالک در عملیات Gateway است:

- `config.schema.lookup` برای یک زیردرخت config محدود به path پیش از ویرایش‌ها
- `config.get` برای snapshot و hash فعلی config
- `config.patch` برای به‌روزرسانی‌های جزئی config همراه با راه‌اندازی مجدد
- `config.apply` فقط برای جایگزینی کامل config
- `update.run` برای self-update صریح + راه‌اندازی مجدد

برای تغییرات جزئی، ابتدا `config.schema.lookup` و سپس `config.patch` را ترجیح دهید. از
`config.apply` فقط زمانی استفاده کنید که عمداً کل config را جایگزین می‌کنید.
برای مستندات گسترده‌تر config، [پیکربندی](/fa/gateway/configuration) و
[مرجع پیکربندی](/fa/gateway/configuration-reference) را بخوانید.
این ابزار همچنین از تغییر `tools.exec.ask` یا `tools.exec.security` خودداری می‌کند؛
نام‌های مستعار قدیمی `tools.bash.*` به همان مسیرهای محافظت‌شدهٔ exec نرمال‌سازی می‌شوند.

### ابزارهای ارائه‌شده توسط Plugin

Pluginها می‌توانند ابزارهای بیشتری ثبت کنند. چند نمونه:

- [Diffها](/fa/tools/diffs) — نمایشگر و renderer تفاوت‌ها
- [وظیفهٔ LLM](/fa/tools/llm-task) — گام LLM فقط JSON برای خروجی ساخت‌یافته
- [Lobster](/fa/tools/lobster) — runtime گردش کار تایپ‌شده با تأییدهای قابل‌ادامه
- [تولید موسیقی](/fa/tools/music-generation) — ابزار مشترک `music_generate` با ارائه‌دهندگان مبتنی بر گردش کار
- [OpenProse](/fa/prose) — هماهنگ‌سازی گردش کار markdown-first
- [Tokenjuice](/fa/tools/tokenjuice) — فشرده‌سازی نتایج پرنویز ابزارهای `exec` و `bash`

ابزارهای Plugin همچنان با `api.registerTool(...)` نوشته می‌شوند و در
فهرست `contracts.tools` در manifest مربوط به Plugin اعلام می‌شوند. OpenClaw توصیف‌گر
اعتبارسنجی‌شدهٔ ابزار را هنگام discovery ثبت می‌کند و آن را بر اساس منبع و قرارداد Plugin cache می‌کند، تا
برنامه‌ریزی ابزار در مراحل بعد بتواند از بارگذاری runtime مربوط به Plugin صرف‌نظر کند. اجرای ابزار همچنان
Plugin مالک را بارگذاری می‌کند و پیاده‌سازی زندهٔ ثبت‌شده را فراخوانی می‌کند.

## پیکربندی ابزار

### فهرست‌های اجازه و رد

از طریق `tools.allow` / `tools.deny` در
config کنترل کنید عامل کدام ابزارها را می‌تواند فراخوانی کند. رد کردن همیشه بر اجازه دادن غلبه دارد.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw وقتی allowlist صریح به هیچ ابزار قابل‌فراخوانی منتهی نشود، به‌صورت بسته شکست می‌خورد.
برای مثال، `tools.allow: ["query_db"]` فقط زمانی کار می‌کند که Plugin بارگذاری‌شده‌ای واقعاً
`query_db` را ثبت کند. اگر هیچ ابزار داخلی، Plugin، یا ابزار MCP بسته‌بندی‌شده با
allowlist مطابقت نداشته باشد، اجرا پیش از فراخوانی مدل متوقف می‌شود، نه اینکه به‌صورت
اجرای فقط متنی ادامه دهد که ممکن است نتایج ابزار را hallucinate کند.

### پروفایل‌های ابزار

`tools.profile` پیش از اعمال `allow`/`deny` یک allowlist پایه تنظیم می‌کند.
بازنویسی برای هر عامل: `agents.list[].tools.profile`.

| پروفایل    | شامل چه چیزهایی است                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`     | همهٔ ابزارهای هسته‌ای و اختیاری Plugin؛ خط پایهٔ نامحدود برای دسترسی گسترده‌تر به فرمان/کنترل                                                  |
| `coding`   | `group:fs`، `group:runtime`، `group:web`، `group:sessions`، `group:memory`، `cron`، `image`، `image_generate`، `music_generate`، `video_generate` |
| `messaging` | `group:messaging`، `sessions_list`، `sessions_history`، `sessions_send`، `session_status`                                                         |
| `minimal`  | فقط `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` عمداً برای عامل‌های متمرکز بر کانال محدود است.
ابزارهای گسترده‌تر فرمان/کنترل مانند filesystem، runtime،
browser، canvas، nodes، cron و کنترل gateway را کنار می‌گذارد. از `tools.profile: "full"`
به‌عنوان خط پایهٔ نامحدود برای دسترسی گسترده‌تر به فرمان/کنترل استفاده کنید، سپس در صورت نیاز
دسترسی را با `tools.allow` / `tools.deny` محدود کنید.
</Note>

`coding` شامل ابزارهای سبک وب (`web_search`، `web_fetch`، `x_search`) است
اما ابزار کامل کنترل browser را شامل نمی‌شود. خودکارسازی مرورگر می‌تواند نشست‌های واقعی و
پروفایل‌های واردشده را هدایت کند، بنابراین آن را به‌صورت صریح با
`tools.alsoAllow: ["browser"]` یا
`agents.list[].tools.alsoAllow: ["browser"]` برای هر عامل اضافه کنید.

<Note>
پیکربندی `tools.exec` یا `tools.fs` زیر یک پروفایل محدود (`messaging`، `minimal`) به‌صورت ضمنی allowlist آن پروفایل را گسترش نمی‌دهد. وقتی می‌خواهید یک پروفایل محدود از آن بخش‌های پیکربندی‌شده استفاده کند، ورودی‌های صریح `tools.alsoAllow` اضافه کنید (برای مثال `["exec", "process"]` برای exec، یا `["read", "write", "edit"]` برای fs). وقتی یک بخش config بدون مجوز متناظر `alsoAllow` وجود داشته باشد، OpenClaw هنگام startup یک هشدار ثبت می‌کند.
</Note>

پروفایل‌های `coding` و `messaging` همچنین ابزارهای MCP بسته‌بندی‌شدهٔ پیکربندی‌شده را
زیر کلید Plugin به نام `bundle-mcp` مجاز می‌کنند. وقتی می‌خواهید
یک پروفایل built-ins معمول خود را نگه دارد اما همهٔ ابزارهای MCP پیکربندی‌شده را پنهان کند، `tools.deny: ["bundle-mcp"]` را اضافه کنید.
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

از کوتاه‌نویسی‌های `group:*` در فهرست‌های اجازه/رد استفاده کنید:

| گروه               | ابزارها                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec، process، code_execution (`bash` به‌عنوان نام مستعار برای `exec` پذیرفته می‌شود)                    |
| `group:fs`         | read، write، edit، apply_patch                                                                            |
| `group:sessions`   | sessions_list، sessions_history، sessions_send، sessions_spawn، sessions_yield، subagents، session_status |
| `group:memory`     | memory_search، memory_get                                                                                 |
| `group:web`        | web_search، x_search، web_fetch                                                                           |
| `group:ui`         | browser، canvas                                                                                           |
| `group:automation` | heartbeat_respond، cron، gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list، update_plan                                                                                  |
| `group:media`      | image، image_generate، music_generate، video_generate، tts                                                |
| `group:openclaw`   | همهٔ ابزارهای داخلی OpenClaw (ابزارهای Plugin را مستثنا می‌کند)                                          |

`sessions_history` یک نمای یادآوری محدود و فیلترشده از نظر ایمنی برمی‌گرداند. این نما
برچسب‌های تفکر، چارچوب `<relevant-memories>`، payloadهای XML فراخوانی ابزار به‌صورت متن ساده
(از جمله `<tool_call>...</tool_call>`،
`<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`،
`<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شدهٔ فراخوانی ابزار)،
چارچوب تنزل‌یافتهٔ فراخوانی ابزار، توکن‌های کنترلی مدل افشاشدهٔ ASCII/تمام‌عرض،
و XML بدشکل فراخوانی ابزار MiniMax را از متن دستیار حذف می‌کند، سپس
به‌جای عمل کردن مانند dump خام رونوشت، ویرایش محرمانه/کوتاه‌سازی و جای‌نگهدارهای احتمالی برای ردیف‌های بیش‌ازحد بزرگ را اعمال می‌کند.

### محدودیت‌های مختص ارائه‌دهنده

از `tools.byProvider` برای محدود کردن ابزارها برای ارائه‌دهندگان مشخص بدون
تغییر پیش‌فرض‌های سراسری استفاده کنید:

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
