---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'چرا یک ابزار مسدود می‌شود: زمان اجرای محیط ایزوله، سیاست اجازه/منع ابزار، و دروازه‌های اجرای با دسترسی ارتقایافته'
title: محیط ایزوله در برابر سیاست ابزار در برابر دسترسی ارتقایافته
x-i18n:
    generated_at: "2026-04-29T22:55:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw سه کنترل مرتبط (اما متفاوت) دارد:

1. **محیط ایزوله** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) تعیین می‌کند **ابزارها کجا اجرا شوند** (زیرساخت محیط ایزوله یا میزبان).
2. **خط‌مشی ابزار** (`tools.*`، `tools.sandbox.tools.*`، `agents.list[].tools.*`) تعیین می‌کند **کدام ابزارها در دسترس/مجاز باشند**.
3. **دسترسی ارتقایافته** (`tools.elevated.*`، `agents.list[].tools.elevated.*`) یک **راه خروج فقط برای exec** است تا وقتی در محیط ایزوله هستید، بیرون از آن اجرا شود (`gateway` به‌صورت پیش‌فرض، یا `node` وقتی هدف exec روی `node` پیکربندی شده باشد).

## اشکال‌زدایی سریع

از بازرس استفاده کنید تا ببینید OpenClaw _واقعاً_ چه کار می‌کند:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

این موارد را چاپ می‌کند:

- حالت/دامنه/دسترسی فضای کاری مؤثر محیط ایزوله
- اینکه نشست فعلی در حال حاضر در محیط ایزوله است یا نه (اصلی در برابر غیراصلی)
- مجوز/ممنوعیت مؤثر ابزارهای محیط ایزوله (و اینکه از عامل/سراسری/پیش‌فرض آمده است یا نه)
- دروازه‌های دسترسی ارتقایافته و مسیرهای کلید برای رفع مشکل

## محیط ایزوله: ابزارها کجا اجرا می‌شوند

ایزوله‌سازی با `agents.defaults.sandbox.mode` کنترل می‌شود:

- `"off"`: همه‌چیز روی میزبان اجرا می‌شود.
- `"non-main"`: فقط نشست‌های غیراصلی در محیط ایزوله هستند (یک «غافلگیری» رایج برای گروه‌ها/کانال‌ها).
- `"all"`: همه‌چیز در محیط ایزوله است.

برای ماتریس کامل (دامنه، اتصال‌های فضای کاری، ایمیج‌ها)، [ایزوله‌سازی](/fa/gateway/sandboxing) را ببینید.

### اتصال‌های bind (بررسی سریع امنیتی)

- `docker.binds` سامانه فایل محیط ایزوله را _سوراخ می‌کند_: هر چیزی را که متصل کنید، با حالتی که تعیین می‌کنید (`:ro` یا `:rw`) داخل کانتینر قابل مشاهده است.
- اگر حالت را حذف کنید، پیش‌فرض خواندن-نوشتن است؛ برای سورس/اسرار، `:ro` را ترجیح دهید.
- `scope: "shared"` اتصال‌های هر عامل را نادیده می‌گیرد (فقط اتصال‌های سراسری اعمال می‌شوند).
- OpenClaw منابع bind را دو بار اعتبارسنجی می‌کند: ابتدا روی مسیر منبع نرمال‌شده، سپس دوباره پس از resolve کردن از طریق عمیق‌ترین جد موجود. خروج از طریق والدهای symlink بررسی‌های مسیر مسدود یا ریشه مجاز را دور نمی‌زند.
- مسیرهای برگ ناموجود همچنان به‌صورت امن بررسی می‌شوند. اگر `/workspace/alias-out/new-file` از طریق یک والد symlink شده به مسیری مسدود یا خارج از ریشه‌های مجاز پیکربندی‌شده resolve شود، bind رد می‌شود.
- bind کردن `/var/run/docker.sock` عملاً کنترل میزبان را به محیط ایزوله می‌دهد؛ این کار را فقط آگاهانه انجام دهید.
- دسترسی فضای کاری (`workspaceAccess: "ro"`/`"rw"`) مستقل از حالت‌های bind است.

## خط‌مشی ابزار: کدام ابزارها وجود دارند/قابل فراخوانی هستند

دو لایه مهم‌اند:

- **نمایه ابزار**: `tools.profile` و `agents.list[].tools.profile` (allowlist پایه)
- **نمایه ابزار ارائه‌دهنده**: `tools.byProvider[provider].profile` و `agents.list[].tools.byProvider[provider].profile`
- **خط‌مشی ابزار سراسری/هر عامل**: `tools.allow`/`tools.deny` و `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **خط‌مشی ابزار ارائه‌دهنده**: `tools.byProvider[provider].allow/deny` و `agents.list[].tools.byProvider[provider].allow/deny`
- **خط‌مشی ابزار محیط ایزوله** (فقط هنگام ایزوله بودن اعمال می‌شود): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و `agents.list[].tools.sandbox.tools.*`

قواعد سرانگشتی:

- `deny` همیشه برنده است.
- اگر `allow` خالی نباشد، همه چیزهای دیگر مسدود در نظر گرفته می‌شوند.
- خط‌مشی ابزار توقف قطعی است: `/exec` نمی‌تواند ابزار `exec` ممنوع‌شده را دور بزند.
- `/exec` فقط پیش‌فرض‌های نشست را برای فرستنده‌های مجاز تغییر می‌دهد؛ دسترسی ابزار اعطا نمی‌کند.
  کلیدهای ابزار ارائه‌دهنده یا `provider` (مثلاً `google-antigravity`) یا `provider/model` (مثلاً `openai/gpt-5.4`) را می‌پذیرند.

### گروه‌های ابزار (میان‌برها)

خط‌مشی‌های ابزار (سراسری، عامل، محیط ایزوله) از ورودی‌های `group:*` پشتیبانی می‌کنند که به چند ابزار گسترش می‌یابند:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

گروه‌های موجود:

- `group:runtime`: `exec`، `process`، `code_execution` (`bash` به‌عنوان نام مستعار برای `exec` پذیرفته می‌شود)
- `group:fs`: `read`، `write`، `edit`، `apply_patch`
- `group:sessions`: `sessions_list`، `sessions_history`، `sessions_send`، `sessions_spawn`، `sessions_yield`، `subagents`، `session_status`
- `group:memory`: `memory_search`، `memory_get`
- `group:web`: `web_search`، `x_search`، `web_fetch`
- `group:ui`: `browser`، `canvas`
- `group:automation`: `cron`، `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`، `image_generate`، `video_generate`، `tts`
- `group:openclaw`: همه ابزارهای داخلی OpenClaw (Plugin‌های ارائه‌دهنده را شامل نمی‌شود)

## دسترسی ارتقایافته: «اجرا روی میزبان» فقط برای exec

دسترسی ارتقایافته ابزارهای اضافی اعطا **نمی‌کند**؛ فقط روی `exec` اثر می‌گذارد.

- اگر در محیط ایزوله هستید، `/elevated on` (یا `exec` با `elevated: true`) بیرون از محیط ایزوله اجرا می‌شود (ممکن است تأییدها همچنان اعمال شوند).
- برای رد کردن تأییدهای exec در نشست، از `/elevated full` استفاده کنید.
- اگر از قبل به‌صورت مستقیم اجرا می‌کنید، دسترسی ارتقایافته عملاً بی‌اثر است (هنوز از دروازه‌ها عبور می‌کند).
- دسترسی ارتقایافته محدود به Skills نیست و allow/deny ابزار را دور **نمی‌زند**.
- دسترسی ارتقایافته بازنویسی دلخواه بین‌میزبانی را از `host=auto` اعطا نمی‌کند؛ از قواعد عادی هدف exec پیروی می‌کند و فقط وقتی هدف پیکربندی‌شده/نشست از قبل `node` باشد، `node` را حفظ می‌کند.
- `/exec` جدا از دسترسی ارتقایافته است. این فقط پیش‌فرض‌های exec هر نشست را برای فرستنده‌های مجاز تنظیم می‌کند.

دروازه‌ها:

- فعال‌سازی: `tools.elevated.enabled` (و در صورت نیاز `agents.list[].tools.elevated.enabled`)
- allowlistهای فرستنده: `tools.elevated.allowFrom.<provider>` (و در صورت نیاز `agents.list[].tools.elevated.allowFrom.<provider>`)

[حالت دسترسی ارتقایافته](/fa/tools/elevated) را ببینید.

## رفع مشکلات رایج «زندان محیط ایزوله»

### «ابزار X توسط خط‌مشی ابزار محیط ایزوله مسدود شده است»

کلیدهای رفع مشکل (یکی را انتخاب کنید):

- غیرفعال کردن محیط ایزوله: `agents.defaults.sandbox.mode=off` (یا برای هر عامل `agents.list[].sandbox.mode=off`)
- مجاز کردن ابزار داخل محیط ایزوله:
  - آن را از `tools.sandbox.tools.deny` حذف کنید (یا برای هر عامل از `agents.list[].tools.sandbox.tools.deny`)
  - یا آن را به `tools.sandbox.tools.allow` اضافه کنید (یا به allow هر عامل)

### «فکر می‌کردم این main است؛ چرا در محیط ایزوله است؟»

در حالت `"non-main"`، کلیدهای گروه/کانال main _نیستند_. از کلید نشست main استفاده کنید (که `sandbox explain` نشان می‌دهد) یا حالت را به `"off"` تغییر دهید.

## مرتبط

- [ایزوله‌سازی](/fa/gateway/sandboxing) -- مرجع کامل محیط ایزوله (حالت‌ها، دامنه‌ها، زیرساخت‌ها، ایمیج‌ها)
- [محیط ایزوله و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- بازنویسی‌ها و تقدم هر عامل
- [حالت دسترسی ارتقایافته](/fa/tools/elevated)
