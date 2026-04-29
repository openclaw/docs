---
read_when:
    - جفت‌سازی گره‌های iOS/Android با یک Gateway
    - استفاده از بوم/دوربین گره برای زمینهٔ عامل
    - افزودن فرمان‌های جدید Node یا کمک‌کننده‌های CLI
summary: 'Nodeها: جفت‌سازی، قابلیت‌ها، مجوزها و کمک‌کننده‌های CLI برای بوم/دوربین/صفحه‌نمایش/دستگاه/اعلان‌ها/سیستم'
title: Nodeها
x-i18n:
    generated_at: "2026-04-29T23:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe9fdeb21173a32f284810d0bd1e9219932ce7c74fdcbc8b5b197f2647659e8
    source_path: nodes/index.md
    workflow: 16
---

یک **Node** دستگاه همراه (macOS/iOS/Android/headless) است که به Gateway **WebSocket** (همان پورت operatorها) با `role: "node"` وصل می‌شود و از طریق `node.invoke` یک سطح فرمان (مثلاً `canvas.*`، `camera.*`، `device.*`، `notifications.*`، `system.*`) ارائه می‌کند. جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

انتقال قدیمی: [پروتکل Bridge](/fa/gateway/bridge-protocol) (TCP JSONL؛
فقط تاریخی برای Nodeهای فعلی).

macOS همچنین می‌تواند در **حالت Node** اجرا شود: برنامه menubar به سرور
WS متعلق به Gateway وصل می‌شود و فرمان‌های canvas/camera محلی خود را به‌عنوان یک Node ارائه می‌کند (بنابراین
`openclaw nodes …` روی این Mac کار می‌کند). در حالت remote gateway، خودکارسازی مرورگر
توسط میزبان Node در CLI (`openclaw node run` یا سرویس Node نصب‌شده) انجام می‌شود، نه توسط Node برنامه native.

نکته‌ها:

- Nodeها **وسایل جانبی** هستند، نه Gateway. آن‌ها سرویس gateway را اجرا نمی‌کنند.
- پیام‌های Telegram/WhatsApp/و غیره روی **gateway** وارد می‌شوند، نه روی Nodeها.
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

- `nodes status` وقتی نقش جفت‌سازی دستگاه شامل `node` باشد، Node را **جفت‌شده** علامت‌گذاری می‌کند.
- رکورد جفت‌سازی دستگاه، قرارداد پایدار نقش‌های تأییدشده است. چرخش Token
  داخل همان قرارداد باقی می‌ماند؛ نمی‌تواند یک Node جفت‌شده را به
  نقشی متفاوت ارتقا دهد که تأیید جفت‌سازی هرگز اعطا نکرده است.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) یک مخزن جفت‌سازی Node جداگانه و متعلق به gateway است؛ این مخزن
  handshake مربوط به WS `connect` را کنترل نمی‌کند.
- `openclaw nodes remove --node <id|name|ip>` ورودی‌های قدیمی را از آن
  مخزن جفت‌سازی Node جداگانه و متعلق به gateway حذف می‌کند.
- دامنه تأیید از فرمان‌های اعلام‌شده در درخواست در انتظار پیروی می‌کند:
  - درخواست بدون فرمان: `operator.pairing`
  - فرمان‌های Node غیر exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## میزبان Node راه‌دور (system.run)

وقتی Gateway شما روی یک ماشین اجرا می‌شود و می‌خواهید فرمان‌ها
روی ماشین دیگری اجرا شوند، از یک **میزبان Node** استفاده کنید. مدل همچنان با **gateway** صحبت می‌کند؛ gateway
وقتی `host=node` انتخاب شده باشد، فراخوانی‌های `exec` را به **میزبان Node** ارسال می‌کند.

### چه چیزی کجا اجرا می‌شود

- **میزبان Gateway**: پیام‌ها را دریافت می‌کند، مدل را اجرا می‌کند، فراخوانی‌های ابزار را مسیر‌یابی می‌کند.
- **میزبان Node**: `system.run`/`system.which` را روی ماشین Node اجرا می‌کند.
- **تأییدها**: روی میزبان Node از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند.

نکته تأیید:

- اجراهای Node مبتنی بر تأیید، زمینه دقیق درخواست را bind می‌کنند.
- برای اجراهای مستقیم فایل shell/runtime، OpenClaw همچنین به‌صورت best-effort یک operand فایل محلی مشخص
  را bind می‌کند و اگر آن فایل پیش از اجرا تغییر کند، اجرا را رد می‌کند.
- اگر OpenClaw نتواند دقیقاً یک فایل محلی مشخص را برای یک فرمان interpreter/runtime شناسایی کند،
  اجرای مبتنی بر تأیید به‌جای وانمود کردن به پوشش کامل runtime رد می‌شود. برای معنای گسترده‌تر interpreter، از sandboxing،
  میزبان‌های جداگانه، یا یک allowlist/workflow کامل و قابل اعتماد صریح استفاده کنید.

### شروع میزبان Node (foreground)

روی ماشین Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### remote gateway از طریق SSH tunnel (اتصال loopback)

اگر Gateway به loopback bind شود (`gateway.bind=loopback`، پیش‌فرض در حالت local)،
میزبان‌های Node راه‌دور نمی‌توانند مستقیم وصل شوند. یک SSH tunnel بسازید و
میزبان Node را به انتهای local تونل اشاره دهید.

مثال (میزبان Node -> میزبان gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

نکته‌ها:

- `openclaw node run` از احراز هویت با token یا password پشتیبانی می‌کند.
- متغیرهای محیطی ترجیح داده می‌شوند: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- fallback پیکربندی `gateway.auth.token` / `gateway.auth.password` است.
- در حالت local، میزبان Node عمداً `gateway.remote.token` / `gateway.remote.password` را نادیده می‌گیرد.
- در حالت remote، `gateway.remote.token` / `gateway.remote.password` طبق قواعد اولویت remote واجد شرایط هستند.
- اگر SecretRefهای active local مربوط به `gateway.auth.*` پیکربندی شده اما resolve نشده باشند، احراز هویت میزبان Node بسته و fail می‌شود.
- حل احراز هویت میزبان Node فقط متغیرهای محیطی `OPENCLAW_GATEWAY_*` را رعایت می‌کند.

### شروع میزبان Node (سرویس)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### جفت‌سازی + نام‌گذاری

روی میزبان gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

اگر Node با جزئیات احراز هویت تغییریافته دوباره تلاش کند، `openclaw devices list`
را دوباره اجرا کنید و `requestId` فعلی را تأیید کنید.

گزینه‌های نام‌گذاری:

- `--display-name` روی `openclaw node run` / `openclaw node install` (روی Node در `~/.openclaw/node.json` پایدار می‌ماند).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override در gateway).

### فرمان‌ها را allowlist کنید

تأییدهای Exec **برای هر میزبان Node** جداگانه هستند. از gateway ورودی‌های allowlist اضافه کنید:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

تأییدها روی میزبان Node در `~/.openclaw/exec-approvals.json` قرار دارند.

### exec را به Node اشاره دهید

پیش‌فرض‌ها را پیکربندی کنید (پیکربندی gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

یا برای هر session:

```
/exec host=node security=allowlist node=<id-or-name>
```

پس از تنظیم، هر فراخوانی `exec` با `host=node` روی میزبان Node اجرا می‌شود (مشروط به
allowlist/تأییدهای Node).

`host=auto` به‌صورت ضمنی خودش Node را انتخاب نمی‌کند، اما درخواست صریح برای هر فراخوانی با `host=node` از `auto` مجاز است. اگر می‌خواهید exec روی Node پیش‌فرض session باشد، `tools.exec.host=node` یا `/exec host=node ...` را صریح تنظیم کنید.

مرتبط:

- [CLI میزبان Node](/fa/cli/node)
- [ابزار Exec](/fa/tools/exec)
- [تأییدهای Exec](/fa/tools/exec-approvals)

## فراخوانی فرمان‌ها

سطح پایین (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

برای workflowهای رایج «دادن یک پیوست MEDIA به agent»، helperهای سطح بالاتر وجود دارد.

## سیاست فرمان

فرمان‌های Node پیش از اینکه فراخوانی شوند باید از دو gate عبور کنند:

1. Node باید فرمان را در فهرست WebSocket `connect.commands` خود اعلام کند.
2. سیاست platform متعلق به gateway باید فرمان اعلام‌شده را مجاز بداند.

Nodeهای همراه Windows و macOS به‌صورت پیش‌فرض فرمان‌های اعلام‌شده امن مانند
`canvas.*`، `camera.list`، `location.get` و `screen.snapshot` را مجاز می‌دانند.
فرمان‌های خطرناک یا حساس از نظر حریم خصوصی مانند `camera.snap`، `camera.clip` و
`screen.record` همچنان نیازمند opt-in صریح با
`gateway.nodes.allowCommands` هستند. `gateway.nodes.denyCommands` همیشه بر
پیش‌فرض‌ها و ورودی‌های allowlist اضافی اولویت دارد.

پس از اینکه یک Node فهرست فرمان‌های اعلام‌شده خود را تغییر داد، جفت‌سازی دستگاه قدیمی را رد کنید
و درخواست جدید را تأیید کنید تا gateway snapshot فرمان به‌روزشده را ذخیره کند.

## Screenshotها (snapshotهای canvas)

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

- `canvas present` URLها یا مسیرهای فایل local (`--target`) را می‌پذیرد، به‌علاوه `--x/--y/--width/--height` اختیاری برای موقعیت‌دهی.
- `canvas eval` کد JS درون‌خطی (`--js`) یا یک آرگومان positional را می‌پذیرد.

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

- Node باید برای `canvas.*` و `camera.*` در **foreground** باشد (فراخوانی‌های background مقدار `NODE_BACKGROUND_UNAVAILABLE` را برمی‌گردانند).
- مدت کلیپ clamp می‌شود (در حال حاضر `<= 60s`) تا از payloadهای base64 بیش از حد بزرگ جلوگیری شود.
- Android در صورت امکان برای مجوزهای `CAMERA`/`RECORD_AUDIO` prompt نشان می‌دهد؛ مجوزهای ردشده با `*_PERMISSION_REQUIRED` fail می‌شوند.

## ضبط‌های صفحه (Nodeها)

Nodeهای پشتیبانی‌شده `screen.record` (mp4) را ارائه می‌کنند. مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

نکته‌ها:

- در دسترس بودن `screen.record` به platform Node بستگی دارد.
- ضبط‌های صفحه به `<= 60s` clamp می‌شوند.
- `--no-audio` ضبط microphone را روی platformهای پشتیبانی‌شده غیرفعال می‌کند.
- وقتی چند صفحه در دسترس است، برای انتخاب display از `--screen <index>` استفاده کنید.

## Location (Nodeها)

وقتی Location در تنظیمات فعال باشد، Nodeها `location.get` را ارائه می‌کنند.

helper در CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

نکته‌ها:

- Location به‌صورت **پیش‌فرض خاموش** است.
- «Always» نیازمند مجوز سیستم است؛ دریافت در background به‌صورت best-effort انجام می‌شود.
- پاسخ شامل lat/lon، accuracy (متر) و timestamp است.

## SMS (Nodeهای Android)

Nodeهای Android وقتی کاربر مجوز **SMS** را اعطا کند و دستگاه از telephony پشتیبانی کند، می‌توانند `sms.send` را ارائه کنند.

فراخوانی سطح پایین:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

نکته‌ها:

- پیش از advertise شدن capability، prompt مجوز باید روی دستگاه Android پذیرفته شود.
- دستگاه‌های فقط Wi-Fi بدون telephony، `sms.send` را advertise نمی‌کنند.

## فرمان‌های دستگاه Android + داده‌های شخصی

Nodeهای Android وقتی capabilityهای متناظر فعال باشند، می‌توانند خانواده‌های فرمان اضافی را advertise کنند.

خانواده‌های موجود:

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

نکته‌ها:

- فرمان‌های motion بر اساس sensorهای موجود با capability محدود می‌شوند.

## فرمان‌های سیستم (میزبان Node / Node مک)

Node در macOS، `system.run`، `system.notify` و `system.execApprovals.get/set` را ارائه می‌کند.
میزبان Node بدون واسط کاربری، `system.run`، `system.which` و `system.execApprovals.get/set` را ارائه می‌کند.

نمونه‌ها:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

نکته‌ها:

- `system.run` در payload، stdout/stderr/exit code را برمی‌گرداند.
- اجرای shell اکنون از طریق ابزار `exec` با `host=node` انجام می‌شود؛ `nodes` همچنان سطح direct-RPC برای فرمان‌های صریح Node است.
- `nodes invoke`، `system.run` یا `system.run.prepare` را ارائه نمی‌کند؛ آن‌ها فقط روی مسیر exec باقی می‌مانند.
- مسیر exec پیش از تأیید، یک `systemRunPlan` canonical آماده می‌کند. پس از اینکه
  تأیید داده شد، Gateway همان plan ذخیره‌شده را فوروارد می‌کند، نه هیچ فیلد command/cwd/session که بعداً توسط فراخواننده ویرایش شده باشد.
- `system.notify` وضعیت مجوز notification را در اپ macOS رعایت می‌کند.
- metadata ناشناخته‌ی `platform` / `deviceFamily` برای Node از یک allowlist پیش‌فرض محافظه‌کارانه استفاده می‌کند که `system.run` و `system.which` را حذف می‌کند. اگر عمداً برای یک platform ناشناخته به این فرمان‌ها نیاز دارید، آن‌ها را صریحاً از طریق `gateway.nodes.allowCommands` اضافه کنید.
- `system.run` از `--cwd`، `--env KEY=VAL`، `--command-timeout` و `--needs-screen-recording` پشتیبانی می‌کند.
- برای wrapperهای shell (`bash|sh|zsh ... -c/-lc`)، مقدارهای `--env` با دامنه‌ی request به یک allowlist صریح کاهش داده می‌شوند (`TERM`، `LANG`، `LC_*`، `COLORTERM`، `NO_COLOR`، `FORCE_COLOR`).
- برای تصمیم‌های allow-always در حالت allowlist، wrapperهای dispatch شناخته‌شده (`env`، `nice`، `nohup`، `stdbuf`، `timeout`) به‌جای مسیرهای wrapper، مسیرهای executable داخلی را نگه می‌دارند. اگر بازکردن wrapper امن نباشد، هیچ ورودی allowlist به‌صورت خودکار نگه داشته نمی‌شود.
- روی میزبان‌های Node ویندوزی در حالت allowlist، اجراهای shell-wrapper از طریق `cmd.exe /c` به تأیید نیاز دارند (صرفاً وجود ورودی allowlist، فرم wrapper را خودکار مجاز نمی‌کند).
- `system.notify` از `--priority <passive|active|timeSensitive>` و `--delivery <system|overlay|auto>` پشتیبانی می‌کند.
- میزبان‌های Node، overrideهای `PATH` را نادیده می‌گیرند و کلیدهای startup/shell خطرناک را حذف می‌کنند (`DYLD_*`، `LD_*`، `NODE_OPTIONS`، `PYTHON*`، `PERL*`، `RUBYOPT`، `SHELLOPTS`، `PS4`). اگر به ورودی‌های اضافی PATH نیاز دارید، به‌جای ارسال `PATH` از طریق `--env`، محیط سرویس میزبان Node را پیکربندی کنید (یا ابزارها را در مکان‌های استاندارد نصب کنید).
- در حالت Node روی macOS، `system.run` با تأییدهای exec در اپ macOS کنترل می‌شود (Settings → Exec approvals).
  Ask/allowlist/full همان رفتار میزبان Node بدون واسط کاربری را دارند؛ promptهای ردشده `SYSTEM_RUN_DENIED` برمی‌گردانند.
- روی میزبان Node بدون واسط کاربری، `system.run` با تأییدهای exec کنترل می‌شود (`~/.openclaw/exec-approvals.json`).

## اتصال Node برای exec

وقتی چند Node در دسترس باشد، می‌توانید exec را به یک Node مشخص متصل کنید.
این کار Node پیش‌فرض را برای `exec host=node` تنظیم می‌کند (و می‌تواند برای هر agent override شود).

پیش‌فرض سراسری:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

override برای هر agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

برای مجاز کردن هر Node، تنظیم را حذف کنید:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## نقشه‌ی مجوزها

Nodeها ممکن است در `node.list` / `node.describe` یک map به نام `permissions` داشته باشند که با نام مجوز key شده است (مثلاً `screenRecording`، `accessibility`) و مقدارهای boolean دارد (`true` = granted).

## میزبان Node بدون واسط کاربری (چندسکویی)

OpenClaw می‌تواند یک **میزبان Node بدون واسط کاربری** (بدون UI) اجرا کند که به WebSocket مربوط به Gateway وصل می‌شود و `system.run` / `system.which` را ارائه می‌کند. این روی Linux/Windows
یا برای اجرای یک Node حداقلی کنار یک server مفید است.

آن را شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789
```

نکته‌ها:

- Pairing همچنان لازم است (Gateway یک prompt برای device pairing نشان می‌دهد).
- میزبان Node، node id، token، display name و اطلاعات اتصال Gateway خود را در `~/.openclaw/node.json` ذخیره می‌کند.
- تأییدهای exec به‌صورت محلی از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند
  (ببینید [تأییدهای exec](/fa/tools/exec-approvals)).
- روی macOS، میزبان Node بدون واسط کاربری به‌صورت پیش‌فرض `system.run` را محلی اجرا می‌کند. برای مسیریابی `system.run` از طریق میزبان exec اپ همراه، `OPENCLAW_NODE_EXEC_HOST=app` را تنظیم کنید؛
  برای الزامی‌کردن میزبان اپ و fail closed در صورت در دسترس نبودن آن، `OPENCLAW_NODE_EXEC_FALLBACK=0` را اضافه کنید.
- وقتی Gateway WS از TLS استفاده می‌کند، `--tls` / `--tls-fingerprint` را اضافه کنید.

## حالت Node مک

- اپ menubar در macOS به‌عنوان یک Node به سرور Gateway WS وصل می‌شود (بنابراین `openclaw nodes …` روی این مک کار می‌کند).
- در حالت remote، اپ برای پورت Gateway یک tunnel SSH باز می‌کند و به `localhost` وصل می‌شود.
