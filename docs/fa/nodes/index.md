---
read_when:
    - جفت‌سازی Nodeهای iOS/Android با یک Gateway
    - استفاده از بوم/دوربین گره برای زمینهٔ عامل
    - افزودن دستورهای جدید Node یا کمک‌کننده‌های CLI
summary: 'Nodeها: جفت‌سازی، قابلیت‌ها، مجوزها و ابزارهای کمکی CLI برای بوم/دوربین/صفحه‌نمایش/دستگاه/اعلان‌ها/سیستم'
title: Nodeها
x-i18n:
    generated_at: "2026-04-30T09:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

یک **Node** دستگاه همراهی (macOS/iOS/Android/headless) است که با `role: "node"` به **WebSocket** Gateway (همان درگاه اپراتورها) وصل می‌شود و از طریق `node.invoke` یک سطح فرمان (مانند `canvas.*`، `camera.*`، `device.*`، `notifications.*`، `system.*`) را ارائه می‌کند. جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

انتقال قدیمی: [پروتکل Bridge](/fa/gateway/bridge-protocol) (TCP JSONL؛
فقط تاریخی برای Nodeهای فعلی).

macOS همچنین می‌تواند در **حالت Node** اجرا شود: برنامهٔ نوار منو به سرور WS متعلق به Gateway وصل می‌شود و فرمان‌های محلی canvas/camera خود را به‌عنوان یک Node ارائه می‌کند (بنابراین
`openclaw nodes …` روی همین Mac کار می‌کند). در حالت Gateway راه‌دور، خودکارسازی مرورگر توسط میزبان Node در CLI (`openclaw node run` یا سرویس Node نصب‌شده) انجام می‌شود، نه توسط Node برنامهٔ بومی.

نکته‌ها:

- Nodeها **لوازم جانبی** هستند، نه Gateway. آن‌ها سرویس Gateway را اجرا نمی‌کنند.
- پیام‌های Telegram/WhatsApp/و غیره روی **Gateway** وارد می‌شوند، نه روی Nodeها.
- راهنمای عیب‌یابی: [/nodes/troubleshooting](/fa/nodes/troubleshooting)

## جفت‌سازی + وضعیت

**Nodeهای WS از جفت‌سازی دستگاه استفاده می‌کنند.** Nodeها هنگام `connect` یک هویت دستگاه ارائه می‌کنند؛ Gateway
برای `role: node` یک درخواست جفت‌سازی دستگاه ایجاد می‌کند. از طریق CLI دستگاه‌ها (یا UI) تأیید کنید.

CLI سریع:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

اگر یک Node با جزئیات احراز هویت تغییریافته (role/scopes/public key) دوباره تلاش کند، درخواست
در انتظار قبلی جایگزین می‌شود و یک `requestId` جدید ساخته می‌شود. پیش از تأیید، دوباره
`openclaw devices list` را اجرا کنید.

نکته‌ها:

- `nodes status` وقتی نقش جفت‌سازی دستگاه شامل `node` باشد، Node را **جفت‌شده** نشان می‌دهد.
- رکورد جفت‌سازی دستگاه، قرارداد پایدار نقشِ تأییدشده است. چرخش توکن
  درون همان قرارداد می‌ماند؛ نمی‌تواند یک Node جفت‌شده را به
  نقش متفاوتی ارتقا دهد که تأیید جفت‌سازی هرگز اعطا نکرده است.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) یک ذخیره‌گاه جفت‌سازی Node جداگانه و متعلق به Gateway است؛ این ذخیره‌گاه دست‌دهی `connect` در WS را کنترل نمی‌کند.
- `openclaw nodes remove --node <id|name|ip>` ورودی‌های قدیمی را از همان
  ذخیره‌گاه جفت‌سازی Node جداگانه و متعلق به Gateway حذف می‌کند.
- دامنهٔ تأیید از فرمان‌های اعلام‌شده در درخواست در انتظار پیروی می‌کند:
  - درخواست بدون فرمان: `operator.pairing`
  - فرمان‌های Node غیر exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## میزبان Node راه‌دور (system.run)

وقتی Gateway شما روی یک ماشین اجرا می‌شود و می‌خواهید فرمان‌ها
روی ماشین دیگری اجرا شوند، از یک **میزبان Node** استفاده کنید. مدل همچنان با **Gateway** صحبت می‌کند؛ Gateway
وقتی `host=node` انتخاب شده باشد، فراخوانی‌های `exec` را به **میزبان Node** فوروارد می‌کند.

### چه چیزی کجا اجرا می‌شود

- **میزبان Gateway**: پیام‌ها را دریافت می‌کند، مدل را اجرا می‌کند، فراخوانی‌های ابزار را مسیریابی می‌کند.
- **میزبان Node**: `system.run`/`system.which` را روی ماشین Node اجرا می‌کند.
- **تأییدها**: روی میزبان Node از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند.

نکتهٔ تأیید:

- اجرای Nodeهای پشتوانه‌دار با تأیید، به زمینهٔ دقیق درخواست مقید می‌شود.
- برای اجراهای مستقیم فایل shell/runtime، OpenClaw همچنین به‌صورت بهترین‌تلاش یک عملوند فایل محلی مشخص را مقید می‌کند و اگر آن فایل پیش از اجرا تغییر کند، اجرا را رد می‌کند.
- اگر OpenClaw نتواند برای یک فرمان interpreter/runtime دقیقاً یک فایل محلی مشخص را شناسایی کند،
  اجرای پشتوانه‌دار با تأیید به‌جای وانمود کردن به پوشش کامل runtime رد می‌شود. برای معناشناسی گسترده‌تر interpreter از sandboxing،
  میزبان‌های جداگانه، یا یک فهرست مجاز/گردش‌کار کامل و صریحاً مورد اعتماد استفاده کنید.

### راه‌اندازی میزبان Node (پیش‌زمینه)

روی ماشین Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway راه‌دور از طریق تونل SSH (اتصال loopback)

اگر Gateway به loopback وصل شود (`gateway.bind=loopback`، پیش‌فرض در حالت محلی)،
میزبان‌های Node راه‌دور نمی‌توانند مستقیم وصل شوند. یک تونل SSH ایجاد کنید و
میزبان Node را به انتهای محلی تونل اشاره دهید.

مثال (میزبان Node -> میزبان Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

نکته‌ها:

- `openclaw node run` از احراز هویت با توکن یا گذرواژه پشتیبانی می‌کند.
- متغیرهای محیطی ترجیح داده می‌شوند: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- fallback پیکربندی `gateway.auth.token` / `gateway.auth.password` است.
- در حالت محلی، میزبان Node عمداً `gateway.remote.token` / `gateway.remote.password` را نادیده می‌گیرد.
- در حالت راه‌دور، `gateway.remote.token` / `gateway.remote.password` طبق قواعد تقدم راه‌دور واجد شرایط هستند.
- اگر SecretRefهای فعال محلی `gateway.auth.*` پیکربندی شده اما resolve نشده باشند، احراز هویت میزبان Node به‌صورت بسته شکست می‌خورد.
- resolve احراز هویت میزبان Node فقط متغیرهای محیطی `OPENCLAW_GATEWAY_*` را می‌پذیرد.

### راه‌اندازی میزبان Node (سرویس)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### جفت‌سازی + نام‌گذاری

روی میزبان Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

اگر Node با جزئیات احراز هویت تغییریافته دوباره تلاش کند، دوباره `openclaw devices list`
را اجرا کنید و `requestId` فعلی را تأیید کنید.

گزینه‌های نام‌گذاری:

- `--display-name` روی `openclaw node run` / `openclaw node install` (روی Node در `~/.openclaw/node.json` پایدار می‌شود).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override در Gateway).

### مجاز کردن فرمان‌ها

تأییدهای Exec **برای هر میزبان Node** هستند. ورودی‌های فهرست مجاز را از Gateway اضافه کنید:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

تأییدها روی میزبان Node در `~/.openclaw/exec-approvals.json` قرار دارند.

### اشاره دادن exec به Node

پیش‌فرض‌ها را پیکربندی کنید (پیکربندی Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

یا برای هر نشست:

```
/exec host=node security=allowlist node=<id-or-name>
```

پس از تنظیم، هر فراخوانی `exec` با `host=node` روی میزبان Node اجرا می‌شود (مشروط به
فهرست مجاز/تأییدهای Node).

`host=auto` به‌خودی‌خود Node را ضمنی انتخاب نمی‌کند، اما درخواست صریح `host=node` در هر فراخوانی از `auto` مجاز است. اگر می‌خواهید exec روی Node پیش‌فرض نشست باشد، `tools.exec.host=node` یا `/exec host=node ...` را صریحاً تنظیم کنید.

مرتبط:

- [CLI میزبان Node](/fa/cli/node)
- [ابزار Exec](/fa/tools/exec)
- [تأییدهای Exec](/fa/tools/exec-approvals)

## فراخوانی فرمان‌ها

سطح پایین (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

برای گردش‌کارهای رایج «دادن پیوست MEDIA به عامل»، helperهای سطح بالاتر وجود دارد.

## سیاست فرمان

فرمان‌های Node پیش از اینکه بتوانند فراخوانی شوند باید از دو gate عبور کنند:

1. Node باید فرمان را در فهرست WebSocket `connect.commands` خود اعلام کند.
2. سیاست پلتفرم Gateway باید فرمان اعلام‌شده را مجاز کند.

Nodeهای همراه Windows و macOS به‌صورت پیش‌فرض فرمان‌های اعلام‌شدهٔ ایمن مانند
`canvas.*`، `camera.list`، `location.get` و `screen.snapshot` را مجاز می‌کنند.
فرمان‌های خطرناک یا سنگین از نظر حریم خصوصی مانند `camera.snap`، `camera.clip` و
`screen.record` همچنان به opt-in صریح با
`gateway.nodes.allowCommands` نیاز دارند. `gateway.nodes.denyCommands` همیشه بر
پیش‌فرض‌ها و ورودی‌های اضافی فهرست مجاز غلبه می‌کند.

فرمان‌های Node متعلق به Plugin می‌توانند یک سیاست node-invoke در Gateway اضافه کنند. آن سیاست
پس از بررسی فهرست مجاز و پیش از فوروارد به Node اجرا می‌شود، بنابراین `node.invoke` خام،
helperهای CLI، و ابزارهای اختصاصی عامل، همان مرز مجوز Plugin را به اشتراک می‌گذارند.
فرمان‌های خطرناک Node در Plugin همچنان به opt-in صریح
`gateway.nodes.allowCommands` نیاز دارند.

پس از اینکه یک Node فهرست فرمان‌های اعلام‌شدهٔ خود را تغییر داد، جفت‌سازی دستگاه قدیمی را رد کنید
و درخواست جدید را تأیید کنید تا Gateway snapshot فرمان به‌روزشده را ذخیره کند.

## نماگرفت‌ها (snapshotهای canvas)

اگر Node در حال نمایش Canvas (WebView) باشد، `canvas.snapshot` مقدار `{ format, base64 }` را برمی‌گرداند.

helper در CLI (در یک فایل موقت می‌نویسد و `MEDIA:<path>` را چاپ می‌کند):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### کنترل‌های Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

نکته‌ها:

- `canvas present` نشانی‌های URL یا مسیرهای فایل محلی (`--target`) را می‌پذیرد، به‌علاوهٔ `--x/--y/--width/--height` اختیاری برای جای‌گذاری.
- `canvas eval` کد JS درون‌خطی (`--js`) یا یک آرگومان مکانی را می‌پذیرد.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

نکته‌ها:

- فقط A2UI v0.8 JSONL پشتیبانی می‌شود (v0.9/createSurface رد می‌شود).

## عکس‌ها + ویدئوها (دوربین Node)

عکس‌ها (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

کلیپ‌های ویدئویی (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

نکته‌ها:

- Node باید برای `canvas.*` و `camera.*` **در پیش‌زمینه** باشد (فراخوانی‌های پس‌زمینه `NODE_BACKGROUND_UNAVAILABLE` برمی‌گردانند).
- مدت کلیپ clamp می‌شود (در حال حاضر `<= 60s`) تا از payloadهای base64 بیش‌ازحد بزرگ جلوگیری شود.
- Android در صورت امکان برای مجوزهای `CAMERA`/`RECORD_AUDIO` prompt نشان می‌دهد؛ مجوزهای ردشده با `*_PERMISSION_REQUIRED` شکست می‌خورند.

## ضبط‌های صفحه (Nodeها)

Nodeهای پشتیبانی‌شده `screen.record` (mp4) را ارائه می‌کنند. مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

نکته‌ها:

- دسترس‌پذیری `screen.record` به پلتفرم Node بستگی دارد.
- ضبط‌های صفحه به `<= 60s` محدود می‌شوند.
- `--no-audio` ضبط میکروفن را روی پلتفرم‌های پشتیبانی‌شده غیرفعال می‌کند.
- وقتی چند صفحه‌نمایش در دسترس است، برای انتخاب یک نمایشگر از `--screen <index>` استفاده کنید.

## مکان (Nodeها)

Nodeها وقتی Location در تنظیمات فعال باشد `location.get` را ارائه می‌کنند.

helper در CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

نکته‌ها:

- Location به‌صورت پیش‌فرض **خاموش** است.
- «Always» به مجوز سیستم نیاز دارد؛ fetch پس‌زمینه به‌صورت بهترین‌تلاش است.
- پاسخ شامل lat/lon، دقت (متر)، و timestamp است.

## SMS (Nodeهای Android)

Nodeهای Android وقتی کاربر مجوز **SMS** را بدهد و دستگاه از تلفن پشتیبانی کند، می‌توانند `sms.send` را ارائه کنند.

فراخوانی سطح پایین:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

نکته‌ها:

- prompt مجوز باید پیش از تبلیغ قابلیت، روی دستگاه Android پذیرفته شود.
- دستگاه‌های فقط Wi-Fi بدون تلفن، `sms.send` را تبلیغ نمی‌کنند.

## فرمان‌های دستگاه Android + داده‌های شخصی

Nodeهای Android وقتی قابلیت‌های متناظر فعال باشند، می‌توانند خانواده‌های فرمان اضافی را تبلیغ کنند.

خانواده‌های در دسترس:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

نمونه فراخوانی‌ها:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

یادداشت‌ها:

- فرمان‌های حرکت با قابلیت حسگرهای موجود محدود می‌شوند.

## فرمان‌های سامانه (میزبان Node / Node مک)

Node در macOS فرمان‌های `system.run`، `system.notify` و `system.execApprovals.get/set` را ارائه می‌کند.
میزبان Node بدون رابط کاربری فرمان‌های `system.run`، `system.which` و `system.execApprovals.get/set` را ارائه می‌کند.

نمونه‌ها:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

یادداشت‌ها:

- `system.run` خروجی stdout/stderr/کد خروج را در payload برمی‌گرداند.
- اجرای Shell اکنون از طریق ابزار `exec` با `host=node` انجام می‌شود؛ `nodes` همچنان سطح مستقیم RPC برای فرمان‌های صریح Node است.
- `nodes invoke`، `system.run` یا `system.run.prepare` را ارائه نمی‌کند؛ آن‌ها فقط روی مسیر exec باقی می‌مانند.
- مسیر exec پیش از تأیید، یک `systemRunPlan` متعارف آماده می‌کند. پس از اینکه
  تأیید صادر شد، Gateway همان طرح ذخیره‌شده را ارسال می‌کند، نه هیچ فیلد فرمان/cwd/session که بعداً توسط فراخواننده ویرایش شده باشد.
- `system.notify` وضعیت مجوز اعلان را در برنامه macOS رعایت می‌کند.
- فراداده ناشناخته Node برای `platform` / `deviceFamily` از یک فهرست مجاز پیش‌فرض محافظه‌کارانه استفاده می‌کند که `system.run` و `system.which` را مستثنی می‌کند. اگر عمداً به این فرمان‌ها برای یک پلتفرم ناشناخته نیاز دارید، آن‌ها را به‌صراحت از طریق `gateway.nodes.allowCommands` اضافه کنید.
- `system.run` از `--cwd`، `--env KEY=VAL`، `--command-timeout` و `--needs-screen-recording` پشتیبانی می‌کند.
- برای wrapperهای Shell (`bash|sh|zsh ... -c/-lc`)، مقادیر `--env` محدود به درخواست به یک فهرست مجاز صریح کاهش می‌یابند (`TERM`، `LANG`، `LC_*`، `COLORTERM`، `NO_COLOR`، `FORCE_COLOR`).
- برای تصمیم‌های always-allow در حالت فهرست مجاز، wrapperهای dispatch شناخته‌شده (`env`، `nice`، `nohup`، `stdbuf`، `timeout`) به‌جای مسیرهای wrapper، مسیرهای executable داخلی را پایدار می‌کنند. اگر بازکردن wrapper ایمن نباشد، هیچ ورودی فهرست مجازی به‌صورت خودکار پایدار نمی‌شود.
- در میزبان‌های Node ویندوز در حالت فهرست مجاز، اجراهای wrapper شل از طریق `cmd.exe /c` به تأیید نیاز دارند (ورودی فهرست مجاز به‌تنهایی فرم wrapper را به‌صورت خودکار مجاز نمی‌کند).
- `system.notify` از `--priority <passive|active|timeSensitive>` و `--delivery <system|overlay|auto>` پشتیبانی می‌کند.
- میزبان‌های Node بازنویسی‌های `PATH` را نادیده می‌گیرند و کلیدهای خطرناک startup/shell را حذف می‌کنند (`DYLD_*`، `LD_*`، `NODE_OPTIONS`، `PYTHON*`، `PERL*`، `RUBYOPT`، `SHELLOPTS`، `PS4`). اگر به ورودی‌های PATH اضافی نیاز دارید، به‌جای ارسال `PATH` از طریق `--env`، محیط سرویس میزبان Node را پیکربندی کنید (یا ابزارها را در مکان‌های استاندارد نصب کنید).
- در حالت Node مک، `system.run` با تأییدهای exec در برنامه macOS محدود می‌شود (Settings → Exec approvals).
  Ask/allowlist/full مانند میزبان Node بدون رابط کاربری رفتار می‌کنند؛ درخواست‌های ردشده `SYSTEM_RUN_DENIED` را برمی‌گردانند.
- در میزبان Node بدون رابط کاربری، `system.run` با تأییدهای exec محدود می‌شود (`~/.openclaw/exec-approvals.json`).

## مقیدسازی Node برای exec

وقتی چند Node در دسترس هستند، می‌توانید exec را به یک Node مشخص مقید کنید.
این کار Node پیش‌فرض را برای `exec host=node` تنظیم می‌کند (و می‌تواند برای هر agent بازنویسی شود).

پیش‌فرض سراسری:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

بازنویسی برای هر agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

برای اجازه‌دادن به هر Node، تنظیم را بردارید:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## نقشه مجوزها

Nodeها ممکن است در `node.list` / `node.describe` یک نقشه `permissions` داشته باشند که با نام مجوز (مثلاً `screenRecording`، `accessibility`) کلیدگذاری شده و دارای مقادیر بولی است (`true` = اعطا شده).

## میزبان Node بدون رابط کاربری (چندپلتفرمی)

OpenClaw می‌تواند یک **میزبان Node بدون رابط کاربری** (بدون UI) اجرا کند که به WebSocket
Gateway وصل می‌شود و `system.run` / `system.which` را ارائه می‌کند. این برای Linux/Windows
یا برای اجرای یک Node حداقلی کنار یک سرور مفید است.

آن را شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789
```

یادداشت‌ها:

- Pairing همچنان لازم است (Gateway یک اعلان pairing دستگاه نشان می‌دهد).
- میزبان Node شناسه Node، توکن، نام نمایشی و اطلاعات اتصال Gateway خود را در `~/.openclaw/node.json` ذخیره می‌کند.
- تأییدهای exec به‌صورت محلی از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند
  (به [تأییدهای exec](/fa/tools/exec-approvals) مراجعه کنید).
- در macOS، میزبان Node بدون رابط کاربری به‌طور پیش‌فرض `system.run` را به‌صورت محلی اجرا می‌کند. برای مسیریابی `system.run` از طریق میزبان exec برنامه همراه، `OPENCLAW_NODE_EXEC_HOST=app` را تنظیم کنید؛
  برای الزام میزبان برنامه و شکست بسته در صورت در دسترس نبودن آن، `OPENCLAW_NODE_EXEC_FALLBACK=0` را اضافه کنید.
- وقتی WS مربوط به Gateway از TLS استفاده می‌کند، `--tls` / `--tls-fingerprint` را اضافه کنید.

## حالت Node مک

- برنامه menubar در macOS به‌عنوان یک Node به سرور WS مربوط به Gateway وصل می‌شود (پس `openclaw nodes …` در برابر این مک کار می‌کند).
- در حالت remote، برنامه یک تونل SSH برای پورت Gateway باز می‌کند و به `localhost` وصل می‌شود.
