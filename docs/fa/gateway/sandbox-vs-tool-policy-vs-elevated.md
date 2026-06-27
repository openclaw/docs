---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'چرا یک ابزار مسدود می‌شود: زمان اجرای سندباکس، سیاست مجاز/ممنوع ابزار، و دروازه‌های اجرای ارتقایافته'
title: Sandbox در برابر سیاست ابزار در برابر دسترسی ارتقایافته
x-i18n:
    generated_at: "2026-06-27T17:48:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw سه کنترل مرتبط (اما متفاوت) دارد:

1. **سندباکس** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) تعیین می‌کند **ابزارها کجا اجرا شوند** (backend سندباکس یا میزبان).
2. **سیاست ابزار** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) تعیین می‌کند **کدام ابزارها در دسترس/مجاز باشند**.
3. **ارتقایافته** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) یک **راه خروج فقط برای exec** است تا وقتی سندباکس شده‌اید، بیرون از سندباکس اجرا شود (`gateway` به‌صورت پیش‌فرض، یا `node` وقتی هدف exec روی `node` تنظیم شده باشد).

## اشکال‌زدایی سریع

از بازرس استفاده کنید تا ببینید OpenClaw _در عمل_ چه می‌کند:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

این موارد را چاپ می‌کند:

- حالت/دامنه/دسترسی workspace مؤثر سندباکس
- اینکه نشست در حال حاضر سندباکس شده است یا نه (اصلی در برابر غیر اصلی)
- allow/deny مؤثر ابزار سندباکس (و اینکه از عامل/سراسری/پیش‌فرض آمده است)
- گیت‌های ارتقایافته و مسیرهای کلید برای اصلاح

## سندباکس: ابزارها کجا اجرا می‌شوند

سندباکس با `agents.defaults.sandbox.mode` کنترل می‌شود:

- `"off"`: همه چیز روی میزبان اجرا می‌شود.
- `"non-main"`: فقط نشست‌های غیر اصلی سندباکس می‌شوند (یک «غافلگیری» رایج برای گروه‌ها/کانال‌ها).
- `"all"`: همه چیز سندباکس می‌شود.

برای ماتریس کامل (دامنه، mountهای workspace، imageها)، [سندباکس](/fa/gateway/sandboxing) را ببینید.

### Bind mountها (بررسی سریع امنیتی)

- `docker.binds` سامانه فایل سندباکس را _سوراخ می‌کند_: هرچه mount کنید، با حالتی که تنظیم کرده‌اید (`:ro` یا `:rw`) داخل container قابل مشاهده است.
- اگر حالت را حذف کنید، پیش‌فرض خواندن-نوشتن است؛ برای source/secrets حالت `:ro` را ترجیح دهید.
- `scope: "shared"` bindهای هر عامل را نادیده می‌گیرد (فقط bindهای سراسری اعمال می‌شوند).
- OpenClaw منبع bind را دو بار اعتبارسنجی می‌کند: ابتدا روی مسیر منبع نرمال‌شده، سپس دوباره پس از resolve کردن از طریق عمیق‌ترین جد موجود. خروج از طریق والد symlink، بررسی‌های مسیر مسدود یا ریشه مجاز را دور نمی‌زند.
- مسیرهای leaf ناموجود همچنان به‌صورت امن بررسی می‌شوند. اگر `/workspace/alias-out/new-file` از طریق یک والد symlinkشده به مسیری مسدود یا بیرون از ریشه‌های مجاز پیکربندی‌شده resolve شود، bind رد می‌شود.
- bind کردن `/var/run/docker.sock` عملاً کنترل میزبان را به سندباکس می‌دهد؛ این کار را فقط آگاهانه انجام دهید.
- دسترسی workspace (`workspaceAccess: "ro"`/`"rw"`) مستقل از حالت‌های bind است.

## سیاست ابزار: کدام ابزارها وجود دارند/قابل فراخوانی‌اند

دو لایه اهمیت دارد:

- **پروفایل ابزار**: `tools.profile` و `agents.list[].tools.profile` (allowlist پایه)
- **پروفایل ابزار provider**: `tools.byProvider[provider].profile` و `agents.list[].tools.byProvider[provider].profile`
- **سیاست ابزار سراسری/هر عامل**: `tools.allow`/`tools.deny` و `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **سیاست ابزار provider**: `tools.byProvider[provider].allow/deny` و `agents.list[].tools.byProvider[provider].allow/deny`
- **سیاست ابزار سندباکس** (فقط هنگام سندباکس‌شدن اعمال می‌شود): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` و `agents.list[].tools.sandbox.tools.*`

قاعده‌های کلی:

- `deny` همیشه برنده است.
- اگر `allow` خالی نباشد، هر چیز دیگر مسدود تلقی می‌شود.
- سیاست ابزار توقف قطعی است: `/exec` نمی‌تواند ابزار `exec` ردشده را override کند.
- سیاست ابزار دسترس‌پذیری ابزار را بر اساس نام فیلتر می‌کند؛ اثرات جانبی داخل `exec` را بازرسی نمی‌کند. اگر `exec` مجاز باشد، deny کردن `write`، `edit` یا `apply_patch` فرمان‌های shell را فقط-خواندنی نمی‌کند.
- `/exec` فقط پیش‌فرض‌های نشست را برای فرستنده‌های مجاز تغییر می‌دهد؛ دسترسی ابزار اعطا نمی‌کند.
  کلیدهای ابزار provider یا `provider` (مثلاً `google-antigravity`) یا `provider/model` (مثلاً `openai/gpt-5.4`) را می‌پذیرند.
- لاگ‌های Gateway شامل ورودی‌های audit با نام `agents/tool-policy` هستند وقتی یک گام سیاست ابزار، ابزارها را حذف کند یا یک سیاست ابزار سندباکس فراخوانی را مسدود کند. از `openclaw logs` استفاده کنید تا برچسب rule، کلید config، و نام ابزارهای تحت تأثیر را ببینید.

### گروه‌های ابزار (میان‌برها)

سیاست‌های ابزار (سراسری، عامل، سندباکس) از ورودی‌های `group:*` پشتیبانی می‌کنند که به چند ابزار گسترش می‌یابند:

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
  برای عامل‌های فقط‌خواندنی، علاوه بر ابزارهای تغییر‌دهنده سامانه فایل، `group:runtime` را هم deny کنید، مگر اینکه سیاست سامانه فایل سندباکس یا یک مرز میزبان جداگانه محدودیت فقط‌خواندنی را enforce کند.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: همه ابزارهای داخلی OpenClaw (pluginهای provider را شامل نمی‌شود)
- `group:plugins`: همه ابزارهای متعلق به plugin بارگذاری‌شده، از جمله سرورهای MCP پیکربندی‌شده که از طریق `bundle-mcp` ارائه شده‌اند

برای سرورهای MCP سندباکس‌شده، سیاست ابزار سندباکس یک گیت allow دوم است. اگر `mcp.servers` پیکربندی شده اما نوبت‌های سندباکس‌شده فقط ابزارهای داخلی را نشان می‌دهند، `bundle-mcp`، `group:plugins`، یا یک نام/glob ابزار MCP با پیشوند سرور مانند `outlook__send_mail` یا `outlook__*` را به `tools.sandbox.tools.alsoAllow` اضافه کنید، سپس Gateway را restart/reload کنید و فهرست ابزار را دوباره ثبت کنید. globهای سرور از پیشوند سرور MCP امن برای provider استفاده می‌کنند: نویسه‌های غیر از `[A-Za-z0-9_-]` به `-` تبدیل می‌شوند، نام‌هایی که با حرف شروع نمی‌شوند پیشوند `mcp-` می‌گیرند، و پیشوندهای بلند یا تکراری ممکن است کوتاه شوند یا پسوند بگیرند.

`openclaw doctor` در حال حاضر این شکل را برای سرورهای مدیریت‌شده توسط OpenClaw در `mcp.servers` بررسی می‌کند. سرورهای MCP بارگذاری‌شده از manifestهای plugin داخلی یا `.mcp.json` مربوط به Claude از همان گیت سندباکس استفاده می‌کنند، اما این diagnostic هنوز آن منابع را enumerate نمی‌کند؛ اگر ابزارهای آن‌ها در نوبت‌های سندباکس‌شده ناپدید شدند، از همان ورودی‌های allowlist استفاده کنید.

## ارتقایافته: «اجرا روی میزبان» فقط برای exec

ارتقایافته ابزار اضافی اعطا **نمی‌کند**؛ فقط روی `exec` اثر می‌گذارد.

- اگر سندباکس شده‌اید، `/elevated on` (یا `exec` با `elevated: true`) بیرون از سندباکس اجرا می‌شود (ممکن است approvalها همچنان اعمال شوند).
- برای رد کردن approvalهای exec در نشست، از `/elevated full` استفاده کنید.
- اگر از قبل مستقیم اجرا می‌شوید، elevated عملاً no-op است (همچنان gate می‌شود).
- Elevated به Skills محدود نیست و allow/deny ابزار را override **نمی‌کند**.
- Elevated از `host=auto` overrideهای دلخواه cross-host اعطا نمی‌کند؛ از ruleهای معمول هدف exec پیروی می‌کند و فقط وقتی هدف پیکربندی‌شده/نشست از قبل `node` باشد، `node` را حفظ می‌کند.
- `/exec` جدا از elevated است. فقط پیش‌فرض‌های exec هر نشست را برای فرستنده‌های مجاز تنظیم می‌کند.

گیت‌ها:

- فعال‌سازی: `tools.elevated.enabled` (و به‌صورت اختیاری `agents.list[].tools.elevated.enabled`)
- allowlistهای فرستنده: `tools.elevated.allowFrom.<provider>` (و به‌صورت اختیاری `agents.list[].tools.elevated.allowFrom.<provider>`)

[حالت ارتقایافته](/fa/tools/elevated) را ببینید.

## اصلاح‌های رایج «زندان سندباکس»

### «Tool X توسط سیاست ابزار سندباکس مسدود شد»

کلیدهای اصلاح (یکی را انتخاب کنید):

- غیرفعال کردن سندباکس: `agents.defaults.sandbox.mode=off` (یا برای هر عامل `agents.list[].sandbox.mode=off`)
- مجاز کردن ابزار داخل سندباکس:
  - آن را از `tools.sandbox.tools.deny` حذف کنید (یا برای هر عامل از `agents.list[].tools.sandbox.tools.deny`)
  - یا آن را به `tools.sandbox.tools.allow` اضافه کنید (یا allow برای هر عامل)
- برای ورودی `agents/tool-policy`، `openclaw logs` را بررسی کنید. این ورودی حالت سندباکس و اینکه rule مربوط به allow یا deny ابزار را مسدود کرده است ثبت می‌کند.

### «فکر می‌کردم این main است، چرا سندباکس شده؟»

در حالت `"non-main"`، کلیدهای گروه/کانال main _نیستند_. از کلید نشست main (که `sandbox explain` نشان می‌دهد) استفاده کنید یا حالت را به `"off"` تغییر دهید.

## مرتبط

- [سندباکس](/fa/gateway/sandboxing) -- مرجع کامل سندباکس (حالت‌ها، دامنه‌ها، backendها، imageها)
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- overrideهای هر عامل و اولویت
- [حالت ارتقایافته](/fa/tools/elevated)
