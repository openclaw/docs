---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'چرا یک ابزار مسدود می‌شود: زمان اجرای sandbox، سیاست اجازه/منع ابزار، و دروازه‌های اجرای ارتقایافته'
title: محیط ایزوله در برابر خط‌مشی ابزار در برابر دسترسی ارتقایافته
x-i18n:
    generated_at: "2026-05-10T19:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw سه کنترل مرتبط (اما متفاوت) دارد:

1. **سندباکس** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) تعیین می‌کند **ابزارها کجا اجرا شوند** (پشتوانه سندباکس در برابر میزبان).
2. **سیاست ابزار** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) تعیین می‌کند **کدام ابزارها در دسترس/مجاز هستند**.
3. **ارتقایافته** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) یک **راه خروج فقط برای exec** است تا وقتی سندباکس شده‌اید، خارج از سندباکس اجرا شود (`gateway` به‌صورت پیش‌فرض، یا `node` وقتی هدف exec برای `node` پیکربندی شده باشد).

## اشکال‌زدایی سریع

از بازرس استفاده کنید تا ببینید OpenClaw _واقعاً_ چه کاری انجام می‌دهد:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

این موارد را چاپ می‌کند:

- حالت/دامنه/دسترسی فضای کاری مؤثر سندباکس
- اینکه آیا نشست فعلی در حال حاضر سندباکس شده است یا نه (اصلی در برابر غیر اصلی)
- اجازه/رد مؤثر ابزار سندباکس (و اینکه از agent/global/default آمده است یا نه)
- گیت‌های ارتقایافته و مسیرهای کلیدی اصلاح

## سندباکس: ابزارها کجا اجرا می‌شوند

سندباکس با `agents.defaults.sandbox.mode` کنترل می‌شود:

- `"off"`: همه‌چیز روی میزبان اجرا می‌شود.
- `"non-main"`: فقط نشست‌های غیر اصلی سندباکس می‌شوند (غافلگیری رایج برای گروه‌ها/کانال‌ها).
- `"all"`: همه‌چیز سندباکس می‌شود.

برای ماتریس کامل (دامنه، اتصال‌های فضای کاری، تصاویر)، [سندباکس‌سازی](/fa/gateway/sandboxing) را ببینید.

### اتصال‌های Bind (بررسی سریع امنیتی)

- `docker.binds` سامانه فایل سندباکس را _سوراخ می‌کند_: هرچه متصل کنید با حالتی که تعیین می‌کنید (`:ro` یا `:rw`) داخل کانتینر قابل مشاهده است.
- اگر حالت را حذف کنید، پیش‌فرض خواندن-نوشتن است؛ برای منبع/اسرار `:ro` را ترجیح دهید.
- `scope: "shared"` اتصال‌های مختص هر agent را نادیده می‌گیرد (فقط اتصال‌های سراسری اعمال می‌شوند).
- OpenClaw منابع bind را دو بار اعتبارسنجی می‌کند: ابتدا روی مسیر منبع نرمال‌شده، سپس دوباره پس از resolve کردن از طریق عمیق‌ترین نیای موجود. خروج از طریق والد symlink بررسی‌های مسیر مسدود یا ریشه مجاز را دور نمی‌زند.
- مسیرهای برگ ناموجود همچنان به‌شکل ایمن بررسی می‌شوند. اگر `/workspace/alias-out/new-file` از طریق یک والد symlink‌شده به مسیری مسدود یا بیرون از ریشه‌های مجاز پیکربندی‌شده resolve شود، bind رد می‌شود.
- اتصال `/var/run/docker.sock` عملاً کنترل میزبان را به سندباکس می‌دهد؛ فقط آگاهانه این کار را انجام دهید.
- دسترسی فضای کاری (`workspaceAccess: "ro"`/`"rw"`) مستقل از حالت‌های bind است.

## سیاست ابزار: کدام ابزارها وجود دارند/قابل فراخوانی هستند

دو لایه مهم هستند:

- **پروفایل ابزار**: `tools.profile` و `agents.list[].tools.profile` (فهرست مجاز پایه)
- **پروفایل ابزار ارائه‌دهنده**: `tools.byProvider[provider].profile` و `agents.list[].tools.byProvider[provider].profile`
- **سیاست ابزار سراسری/مختص agent**: `tools.allow`/`tools.deny` و `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **سیاست ابزار ارائه‌دهنده**: `tools.byProvider[provider].allow/deny` و `agents.list[].tools.byProvider[provider].allow/deny`
- **سیاست ابزار سندباکس** (فقط وقتی سندباکس شده باشد اعمال می‌شود): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و `agents.list[].tools.sandbox.tools.*`

قواعد سرانگشتی:

- `deny` همیشه برنده است.
- اگر `allow` خالی نباشد، هر چیز دیگر مسدود تلقی می‌شود.
- سیاست ابزار توقف قطعی است: `/exec` نمی‌تواند ابزار `exec` ردشده را override کند.
- سیاست ابزار دسترس‌پذیری ابزار را بر اساس نام فیلتر می‌کند؛ عوارض جانبی داخل `exec` را بازرسی نمی‌کند. اگر `exec` مجاز باشد، رد کردن `write`، `edit`، یا `apply_patch` فرمان‌های shell را فقط‌خواندنی نمی‌کند.
- `/exec` فقط پیش‌فرض‌های نشست را برای فرستندگان مجاز تغییر می‌دهد؛ دسترسی ابزار اعطا نمی‌کند.
  کلیدهای ابزار ارائه‌دهنده یا `provider` (مثلاً `google-antigravity`) یا `provider/model` (مثلاً `openai/gpt-5.4`) را می‌پذیرند.

### گروه‌های ابزار (میان‌برها)

سیاست‌های ابزار (سراسری، agent، سندباکس) از ورودی‌های `group:*` پشتیبانی می‌کنند که به چند ابزار گسترش می‌یابند:

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` به‌عنوان
  نام مستعار برای `exec` پذیرفته می‌شود)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  برای agentهای فقط‌خواندنی، `group:runtime` را نیز همراه با ابزارهای تغییردهنده سامانه فایل رد کنید، مگر اینکه سیاست سامانه فایل سندباکس یا یک مرز میزبان جداگانه محدودیت فقط‌خواندنی را اعمال کند.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: همه ابزارهای داخلی OpenClaw (Pluginهای ارائه‌دهنده را شامل نمی‌شود)

## ارتقایافته: «اجرا روی میزبان» فقط برای exec

ارتقایافته ابزارهای اضافی اعطا **نمی‌کند**؛ فقط بر `exec` اثر می‌گذارد.

- اگر سندباکس شده‌اید، `/elevated on` (یا `exec` با `elevated: true`) خارج از سندباکس اجرا می‌شود (ممکن است تأییدها همچنان اعمال شوند).
- برای رد کردن تأییدهای exec در نشست، از `/elevated full` استفاده کنید.
- اگر از قبل مستقیم اجرا می‌شوید، ارتقایافته عملاً بدون اثر است (همچنان پشت گیت است).
- ارتقایافته در دامنه Skills نیست و allow/deny ابزار را override **نمی‌کند**.
- ارتقایافته overrideهای دلخواه بین‌میزبانی را از `host=auto` اعطا نمی‌کند؛ از قواعد عادی هدف exec پیروی می‌کند و فقط وقتی هدف پیکربندی‌شده/نشست از قبل `node` باشد، `node` را حفظ می‌کند.
- `/exec` از ارتقایافته جداست. فقط پیش‌فرض‌های exec مختص نشست را برای فرستندگان مجاز تنظیم می‌کند.

گیت‌ها:

- فعال‌سازی: `tools.elevated.enabled` (و به‌صورت اختیاری `agents.list[].tools.elevated.enabled`)
- فهرست‌های مجاز فرستنده: `tools.elevated.allowFrom.<provider>` (و به‌صورت اختیاری `agents.list[].tools.elevated.allowFrom.<provider>`)

[حالت ارتقایافته](/fa/tools/elevated) را ببینید.

## اصلاحات رایج «زندان سندباکس»

### «ابزار X توسط سیاست ابزار سندباکس مسدود شد»

کلیدهای اصلاح (یکی را انتخاب کنید):

- غیرفعال کردن سندباکس: `agents.defaults.sandbox.mode=off` (یا برای هر agent، `agents.list[].sandbox.mode=off`)
- مجاز کردن ابزار داخل سندباکس:
  - آن را از `tools.sandbox.tools.deny` حذف کنید (یا از `agents.list[].tools.sandbox.tools.deny` مختص هر agent)
  - یا آن را به `tools.sandbox.tools.allow` اضافه کنید (یا allow مختص هر agent)

### «فکر می‌کردم این اصلی است، چرا سندباکس شده؟»

در حالت `"non-main"`، کلیدهای گروه/کانال اصلی _نیستند_. از کلید نشست اصلی (که با `sandbox explain` نشان داده می‌شود) استفاده کنید یا حالت را به `"off"` تغییر دهید.

## مرتبط

- [سندباکس‌سازی](/fa/gateway/sandboxing) -- مرجع کامل سندباکس (حالت‌ها، دامنه‌ها، پشتوانه‌ها، تصاویر)
- [سندباکس و ابزارهای چند agent](/fa/tools/multi-agent-sandbox-tools) -- overrideهای مختص هر agent و اولویت
- [حالت ارتقایافته](/fa/tools/elevated)
