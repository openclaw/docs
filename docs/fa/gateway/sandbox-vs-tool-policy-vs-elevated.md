---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'چرا یک ابزار مسدود می‌شود: محیط اجرای سندباکس، سیاست مجاز/ممنوع‌سازی ابزار، و دروازه‌های اجرای با سطح دسترسی بالاتر'
title: محیط محدود در برابر سیاست ابزار در برابر حالت ارتقایافته
x-i18n:
    generated_at: "2026-05-06T09:20:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw سه کنترل مرتبط (اما متفاوت) دارد:

1. **محیط ایزوله** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) تعیین می‌کند **ابزارها کجا اجرا شوند** (بک‌اند محیط ایزوله در برابر میزبان).
2. **سیاست ابزار** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) تعیین می‌کند **کدام ابزارها در دسترس/مجاز هستند**.
3. **ارتقایافته** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) یک **راه خروج فقط برای exec** است تا وقتی در محیط ایزوله هستید، بیرون از محیط ایزوله اجرا شود (`gateway` به‌طور پیش‌فرض، یا `node` وقتی هدف exec برای `node` پیکربندی شده باشد).

## اشکال‌زدایی سریع

از بازرس استفاده کنید تا ببینید OpenClaw _واقعاً_ چه کاری انجام می‌دهد:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

این موارد را چاپ می‌کند:

- حالت/دامنه/دسترسی مؤثر محیط ایزوله به فضای کاری
- اینکه نشست در حال حاضر در محیط ایزوله است یا نه (اصلی در برابر غیر اصلی)
- اجازه/رد مؤثر ابزار محیط ایزوله (و اینکه از عامل/سراسری/پیش‌فرض آمده است)
- گیت‌های ارتقایافته و مسیرهای کلید رفع مشکل

## محیط ایزوله: ابزارها کجا اجرا می‌شوند

محیط ایزوله با `agents.defaults.sandbox.mode` کنترل می‌شود:

- `"off"`: همه‌چیز روی میزبان اجرا می‌شود.
- `"non-main"`: فقط نشست‌های غیر اصلی در محیط ایزوله هستند («غافلگیری» رایج برای گروه‌ها/کانال‌ها).
- `"all"`: همه‌چیز در محیط ایزوله است.

برای ماتریس کامل (دامنه، اتصال‌های فضای کاری، imageها)، [محیط ایزوله](/fa/gateway/sandboxing) را ببینید.

### اتصال‌های Bind (بررسی امنیتی سریع)

- `docker.binds` سامانه فایل محیط ایزوله را _سوراخ می‌کند_: هرچه را mount کنید داخل کانتینر با حالتی که تعیین کرده‌اید (`:ro` یا `:rw`) قابل مشاهده است.
- اگر حالت را حذف کنید، پیش‌فرض خواندن-نوشتن است؛ برای سورس/secretها `:ro` را ترجیح دهید.
- `scope: "shared"` اتصال‌های هر عامل را نادیده می‌گیرد (فقط اتصال‌های سراسری اعمال می‌شوند).
- OpenClaw منابع bind را دو بار اعتبارسنجی می‌کند: ابتدا روی مسیر منبع نرمال‌سازی‌شده، سپس دوباره پس از resolve شدن از طریق عمیق‌ترین ancestor موجود. خروج از طریق والد symlink، بررسی‌های مسیر مسدودشده یا ریشه مجاز را دور نمی‌زند.
- مسیرهای leaf ناموجود همچنان به‌صورت ایمن بررسی می‌شوند. اگر `/workspace/alias-out/new-file` از طریق یک والد symlinkشده به یک مسیر مسدود یا بیرون از ریشه‌های مجاز پیکربندی‌شده resolve شود، bind رد می‌شود.
- bind کردن `/var/run/docker.sock` عملاً کنترل میزبان را به محیط ایزوله می‌دهد؛ این کار را فقط آگاهانه انجام دهید.
- دسترسی فضای کاری (`workspaceAccess: "ro"`/`"rw"`) مستقل از حالت‌های bind است.

## سیاست ابزار: کدام ابزارها وجود دارند/قابل فراخوانی هستند

دو لایه مهم است:

- **پروفایل ابزار**: `tools.profile` و `agents.list[].tools.profile` (allowlist پایه)
- **پروفایل ابزار ارائه‌دهنده**: `tools.byProvider[provider].profile` و `agents.list[].tools.byProvider[provider].profile`
- **سیاست ابزار سراسری/هر عامل**: `tools.allow`/`tools.deny` و `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **سیاست ابزار ارائه‌دهنده**: `tools.byProvider[provider].allow/deny` و `agents.list[].tools.byProvider[provider].allow/deny`
- **سیاست ابزار محیط ایزوله** (فقط وقتی در محیط ایزوله هستید اعمال می‌شود): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و `agents.list[].tools.sandbox.tools.*`

قاعده‌های کلی:

- `deny` همیشه برنده است.
- اگر `allow` خالی نباشد، هر چیز دیگری مسدود در نظر گرفته می‌شود.
- سیاست ابزار توقف سخت است: `/exec` نمی‌تواند ابزار `exec` ردشده را override کند.
- `/exec` فقط پیش‌فرض‌های نشست را برای فرستندگان مجاز تغییر می‌دهد؛ دسترسی ابزار اعطا نمی‌کند.
  کلیدهای ابزار ارائه‌دهنده یا `provider` (مثلاً `google-antigravity`) یا `provider/model` (مثلاً `openai/gpt-5.4`) را می‌پذیرند.

### گروه‌های ابزار (میان‌برها)

سیاست‌های ابزار (سراسری، عامل، محیط ایزوله) از ورودی‌های `group:*` پشتیبانی می‌کنند که به چند ابزار گسترش می‌یابند:

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
  alias برای `exec` پذیرفته می‌شود)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
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

ارتقایافته ابزارهای اضافی اعطا نمی‌کند؛ فقط روی `exec` اثر می‌گذارد.

- اگر در محیط ایزوله هستید، `/elevated on` (یا `exec` با `elevated: true`) بیرون از محیط ایزوله اجرا می‌شود (تأییدها ممکن است همچنان اعمال شوند).
- برای رد کردن تأییدهای exec برای نشست، از `/elevated full` استفاده کنید.
- اگر از قبل مستقیم اجرا می‌شوید، ارتقایافته عملاً بی‌اثر است (همچنان با گیت کنترل می‌شود).
- ارتقایافته **محدود به skill نیست** و allow/deny ابزار را override نمی‌کند.
- ارتقایافته overrideهای دلخواه بین میزبان‌ها را از `host=auto` اعطا نمی‌کند؛ از قواعد عادی هدف exec پیروی می‌کند و فقط وقتی هدف پیکربندی‌شده/نشست از قبل `node` باشد، `node` را حفظ می‌کند.
- `/exec` از ارتقایافته جداست. فقط پیش‌فرض‌های exec هر نشست را برای فرستندگان مجاز تنظیم می‌کند.

گیت‌ها:

- فعال‌سازی: `tools.elevated.enabled` (و اختیاری `agents.list[].tools.elevated.enabled`)
- allowlistهای فرستنده: `tools.elevated.allowFrom.<provider>` (و اختیاری `agents.list[].tools.elevated.allowFrom.<provider>`)

[حالت ارتقایافته](/fa/tools/elevated) را ببینید.

## رفع مشکل‌های رایج «حبس محیط ایزوله»

### «ابزار X توسط سیاست ابزار محیط ایزوله مسدود شده است»

کلیدهای رفع مشکل (یکی را انتخاب کنید):

- غیرفعال کردن محیط ایزوله: `agents.defaults.sandbox.mode=off` (یا برای هر عامل `agents.list[].sandbox.mode=off`)
- مجاز کردن ابزار داخل محیط ایزوله:
  - آن را از `tools.sandbox.tools.deny` حذف کنید (یا برای هر عامل `agents.list[].tools.sandbox.tools.deny`)
  - یا آن را به `tools.sandbox.tools.allow` اضافه کنید (یا allow هر عامل)

### «فکر می‌کردم این اصلی است؛ چرا در محیط ایزوله است؟»

در حالت `"non-main"`، کلیدهای گروه/کانال اصلی _نیستند_. از کلید نشست اصلی (که `sandbox explain` نشان می‌دهد) استفاده کنید یا حالت را به `"off"` تغییر دهید.

## مرتبط

- [محیط ایزوله](/fa/gateway/sandboxing) -- مرجع کامل محیط ایزوله (حالت‌ها، دامنه‌ها، بک‌اندها، imageها)
- [محیط ایزوله و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- overrideهای هر عامل و تقدم
- [حالت ارتقایافته](/fa/tools/elevated)
