---
read_when:
    - جفت‌سازی گره‌های iOS/Android با Gateway
    - استفاده از canvas/camera در Node برای زمینهٔ عامل
    - افزودن فرمان‌های جدید Node یا کمک‌ابزارهای CLI
summary: 'Nodeها: جفت‌سازی، قابلیت‌ها، مجوزها و ابزارهای کمکی CLI برای بوم/دوربین/صفحه‌نمایش/دستگاه/اعلان‌ها/سیستم'
title: Nodeها
x-i18n:
    generated_at: "2026-05-06T09:28:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

یک **Node** دستگاه همراهی است (macOS/iOS/Android/headless) که با `role: "node"` به **WebSocket** Gateway (همان پورتی که operatorها استفاده می‌کنند) وصل می‌شود و از طریق `node.invoke` یک سطح فرمان (مثلاً `canvas.*`، `camera.*`، `device.*`، `notifications.*`، `system.*`) ارائه می‌کند. جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

انتقال قدیمی: [پروتکل Bridge](/fa/gateway/bridge-protocol) (TCP JSONL؛
فقط تاریخی برای Nodeهای فعلی).

macOS همچنین می‌تواند در **حالت Node** اجرا شود: برنامه menubar به سرور WS در Gateway وصل می‌شود و فرمان‌های canvas/camera محلی خود را به‌عنوان یک Node ارائه می‌کند (پس
`openclaw nodes …` روی این Mac کار می‌کند). در حالت remote gateway، خودکارسازی مرورگر را میزبان Node در CLI (`openclaw node run` یا سرویس نصب‌شده Node) انجام می‌دهد، نه Node برنامه native.

نکات:

- Nodeها **peripheral** هستند، نه gateway. آن‌ها سرویس gateway را اجرا نمی‌کنند.
- پیام‌های Telegram/WhatsApp/و غیره روی **gateway** وارد می‌شوند، نه روی Nodeها.
- راهنمای عیب‌یابی: [/nodes/troubleshooting](/fa/nodes/troubleshooting)

## جفت‌سازی + وضعیت

**Nodeهای WS از جفت‌سازی دستگاه استفاده می‌کنند.** Nodeها هنگام `connect` یک هویت دستگاه ارائه می‌کنند؛ Gateway
برای `role: node` یک درخواست جفت‌سازی دستگاه ایجاد می‌کند. آن را از طریق CLI دستگاه‌ها (یا UI) تأیید کنید.

CLI سریع:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

اگر Node با جزئیات auth تغییرکرده (role/scopes/public key) دوباره تلاش کند، درخواست
در انتظار قبلی جایگزین می‌شود و یک `requestId` تازه ایجاد می‌شود. قبل از تأیید، دوباره
`openclaw devices list` را اجرا کنید.

نکات:

- `nodes status` وقتی نقش جفت‌سازی دستگاه شامل `node` باشد، Node را **paired** نشان می‌دهد.
- رکورد جفت‌سازی دستگاه، قرارداد پایدار نقش تأییدشده است. چرخش Token
  داخل همان قرارداد می‌ماند؛ نمی‌تواند یک Node جفت‌شده را به نقشی متفاوت ارتقا دهد که تأیید جفت‌سازی هرگز اعطا نکرده است.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) یک store جداگانه جفت‌سازی Node است که مالک آن gateway است؛ این store
  handshake مربوط به WS `connect` را gate نمی‌کند.
- `openclaw nodes remove --node <id|name|ip>` ورودی‌های stale را از همان
  store جداگانه جفت‌سازی Node که مالک آن gateway است حذف می‌کند.
- دامنه تأیید از فرمان‌های اعلام‌شده درخواست pending پیروی می‌کند:
  - درخواست بدون فرمان: `operator.pairing`
  - فرمان‌های Node بدون exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## میزبان Node راه‌دور (system.run)

وقتی Gateway شما روی یک ماشین اجرا می‌شود و می‌خواهید فرمان‌ها
روی ماشین دیگری اجرا شوند، از یک **میزبان Node** استفاده کنید. مدل همچنان با **gateway** صحبت می‌کند؛ gateway
وقتی `host=node` انتخاب شود، فراخوانی‌های `exec` را به **میزبان Node** forward می‌کند.

### چه چیزی کجا اجرا می‌شود

- **میزبان Gateway**: پیام‌ها را دریافت می‌کند، مدل را اجرا می‌کند، فراخوانی‌های ابزار را مسیریابی می‌کند.
- **میزبان Node**: `system.run`/`system.which` را روی ماشین Node اجرا می‌کند.
- **تأییدها**: روی میزبان Node از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند.

نکته تأیید:

- اجراهای Node که پشتوانه تأیید دارند، به context دقیق درخواست bind می‌شوند.
- برای اجراهای مستقیم فایل shell/runtime، OpenClaw همچنین به‌صورت best-effort یک operand فایل محلی مشخص
  را bind می‌کند و اگر آن فایل پیش از اجرا تغییر کند، اجرا را deny می‌کند.
- اگر OpenClaw نتواند دقیقاً یک فایل محلی مشخص برای یک فرمان interpreter/runtime شناسایی کند،
  اجرای پشتوانه‌دار با تأیید deny می‌شود، نه اینکه وانمود کند پوشش کامل runtime وجود دارد. برای semantics گسترده‌تر interpreter از sandboxing،
  میزبان‌های جداگانه، یا یک allowlist/workflow کامل و صریحاً trusted استفاده کنید.

### شروع میزبان Node (foreground)

روی ماشین Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway راه‌دور از طریق تونل SSH (bind روی loopback)

اگر Gateway به loopback bind شده باشد (`gateway.bind=loopback`، پیش‌فرض در local mode)،
میزبان‌های Node راه‌دور نمی‌توانند مستقیماً وصل شوند. یک تونل SSH بسازید و میزبان
Node را به انتهای محلی تونل اشاره دهید.

مثال (میزبان Node -> میزبان gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

نکات:

- `openclaw node run` از auth با token یا password پشتیبانی می‌کند.
- Env varها ترجیح داده می‌شوند: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- fallback در config این است: `gateway.auth.token` / `gateway.auth.password`.
- در local mode، میزبان Node عمداً `gateway.remote.token` / `gateway.remote.password` را نادیده می‌گیرد.
- در remote mode، `gateway.remote.token` / `gateway.remote.password` طبق قواعد precedence راه‌دور قابل استفاده‌اند.
- اگر SecretRefهای فعال محلی `gateway.auth.*` پیکربندی شده اما resolve نشده باشند، auth میزبان Node fail closed می‌شود.
- resolution auth میزبان Node فقط env varهای `OPENCLAW_GATEWAY_*` را رعایت می‌کند.

### شروع میزبان Node (service)

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

اگر Node با جزئیات auth تغییرکرده دوباره تلاش کند، دوباره `openclaw devices list` را اجرا کنید
و `requestId` فعلی را تأیید کنید.

گزینه‌های نام‌گذاری:

- `--display-name` روی `openclaw node run` / `openclaw node install` (روی Node در `~/.openclaw/node.json` persist می‌شود).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override در gateway).

### فرمان‌ها را allowlist کنید

تأییدهای Exec **برای هر میزبان Node جداگانه** هستند. ورودی‌های allowlist را از gateway اضافه کنید:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

تأییدها روی میزبان Node در `~/.openclaw/exec-approvals.json` قرار دارند.

### Exec را به Node اشاره دهید

پیش‌فرض‌ها را پیکربندی کنید (config در gateway):

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
allowlist/approvals در Node).

`host=auto` به‌صورت implicit خودبه‌خود Node را انتخاب نمی‌کند، اما درخواست صریح per-call با `host=node` از `auto` مجاز است. اگر می‌خواهید exec روی Node پیش‌فرض session باشد، صریحاً `tools.exec.host=node` یا `/exec host=node ...` را تنظیم کنید.

مرتبط:

- [CLI میزبان Node](/fa/cli/node)
- [ابزار Exec](/fa/tools/exec)
- [تأییدهای Exec](/fa/tools/exec-approvals)

## فراخوانی فرمان‌ها

سطح پایین (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

helperهای سطح بالاتر برای workflowهای رایج «دادن attachment از نوع MEDIA به agent» وجود دارند.

## سیاست فرمان

فرمان‌های Node پیش از آنکه بتوانند فراخوانی شوند باید از دو gate عبور کنند:

1. Node باید فرمان را در فهرست WebSocket `connect.commands` خود اعلام کند.
2. سیاست platform در gateway باید فرمان اعلام‌شده را مجاز بداند.

Nodeهای همراه Windows و macOS به‌صورت پیش‌فرض فرمان‌های اعلام‌شده امنی مانند
`canvas.*`، `camera.list`، `location.get` و `screen.snapshot` را مجاز می‌دانند.
Nodeهای trusted که capability به نام `talk` را advertise می‌کنند یا فرمان‌های `talk.*` را اعلام می‌کنند
نیز به‌صورت پیش‌فرض فرمان‌های اعلام‌شده push-to-talk (`talk.ptt.start`، `talk.ptt.stop`،
`talk.ptt.cancel`، `talk.ptt.once`) را، مستقل از label پلتفرم، مجاز می‌دانند.
فرمان‌های خطرناک یا سنگین از نظر حریم خصوصی مانند `camera.snap`، `camera.clip` و
`screen.record` همچنان به opt-in صریح با
`gateway.nodes.allowCommands` نیاز دارند. `gateway.nodes.denyCommands` همیشه بر
پیش‌فرض‌ها و ورودی‌های allowlist اضافی اولویت دارد.

فرمان‌های Node که مالک آن‌ها Plugin است می‌توانند یک سیاست Gateway برای node-invoke اضافه کنند. آن سیاست
پس از بررسی allowlist و قبل از forward به Node اجرا می‌شود، بنابراین
`node.invoke` خام، helperهای CLI و ابزارهای اختصاصی agent همگی همان مرز permission مربوط به Plugin را به اشتراک می‌گذارند. فرمان‌های خطرناک Node مربوط به Plugin همچنان به opt-in صریح
`gateway.nodes.allowCommands` نیاز دارند.

پس از اینکه Node فهرست فرمان‌های اعلام‌شده‌اش را تغییر داد، جفت‌سازی دستگاه قدیمی را reject کنید
و درخواست جدید را approve کنید تا gateway snapshot فرمان به‌روزشده را ذخیره کند.

## اسکرین‌شات‌ها (snapshotهای canvas)

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

نکات:

- `canvas present` URLها یا مسیرهای فایل محلی (`--target`) را می‌پذیرد، به‌علاوه `--x/--y/--width/--height` اختیاری برای positioning.
- `canvas eval` JS inline (`--js`) یا یک arg positional را می‌پذیرد.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

نکات:

- فقط A2UI v0.8 JSONL پشتیبانی می‌شود (v0.9/createSurface رد می‌شود).

## عکس‌ها + ویدیوها (دوربین Node)

عکس‌ها (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

کلیپ‌های ویدیویی (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

نکات:

- Node باید برای `canvas.*` و `camera.*` **در foreground** باشد (فراخوانی‌های background مقدار `NODE_BACKGROUND_UNAVAILABLE` برمی‌گردانند).
- مدت کلیپ clamp می‌شود (در حال حاضر `<= 60s`) تا از payloadهای base64 بیش از حد بزرگ جلوگیری شود.
- Android در صورت امکان برای permissionهای `CAMERA`/`RECORD_AUDIO` prompt نشان می‌دهد؛ permissionهای denied با `*_PERMISSION_REQUIRED` fail می‌شوند.

## ضبط‌های صفحه (Nodeها)

Nodeهای پشتیبانی‌شده `screen.record` (mp4) را ارائه می‌کنند. مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

نکات:

- دسترس‌پذیری `screen.record` به پلتفرم Node بستگی دارد.
- ضبط‌های صفحه به `<= 60s` clamp می‌شوند.
- `--no-audio` ضبط میکروفون را روی پلتفرم‌های پشتیبانی‌شده غیرفعال می‌کند.
- وقتی چند صفحه در دسترس باشد، برای انتخاب display از `--screen <index>` استفاده کنید.

## Location (Nodeها)

Nodeها وقتی Location در settings فعال باشد، `location.get` را ارائه می‌کنند.

helper در CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

نکات:

- Location به‌صورت پیش‌فرض **خاموش** است.
- «Always» به permission سیستم نیاز دارد؛ fetch در background به‌صورت best-effort است.
- پاسخ شامل lat/lon، accuracy (متر) و timestamp است.

## SMS (Nodeهای Android)

Nodeهای Android وقتی کاربر permission مربوط به **SMS** را بدهد و دستگاه از telephony پشتیبانی کند، می‌توانند `sms.send` را ارائه کنند.

فراخوانی سطح پایین:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

نکات:

- پیش از advertise شدن capability، prompt مربوط به permission باید روی دستگاه Android پذیرفته شود.
- دستگاه‌های فقط Wi-Fi و بدون telephony، `sms.send` را advertise نمی‌کنند.

## فرمان‌های دستگاه Android + داده‌های شخصی

Nodeهای Android وقتی capabilityهای متناظر فعال باشند می‌توانند خانواده‌های فرمان اضافی را advertise کنند.

خانواده‌های در دسترس:

- `device.status`، `device.info`، `device.permissions`، `device.health`
- `notifications.list`، `notifications.actions`
- `photos.latest`
- `contacts.search`، `contacts.add`
- `calendar.events`، `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`، `motion.pedometer`

نمونه فراخوانی‌ها:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

نکته‌ها:

- دستورهای حرکت بر اساس حسگرهای موجود، با قابلیت‌ها محدود می‌شوند.

## دستورهای سیستم (میزبان Node / Node مک)

Node در macOS، `system.run`، `system.notify` و `system.execApprovals.get/set` را ارائه می‌کند.
میزبان Node بدون رابط کاربری، `system.run`، `system.which` و `system.execApprovals.get/set` را ارائه می‌کند.

نمونه‌ها:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

نکته‌ها:

- `system.run` خروجی استاندارد، خطای استاندارد و کد خروج را در payload برمی‌گرداند.
- اجرای shell اکنون از طریق ابزار `exec` با `host=node` انجام می‌شود؛ `nodes` همچنان سطح مستقیم RPC برای دستورهای صریح Node باقی می‌ماند.
- `nodes invoke`، `system.run` یا `system.run.prepare` را ارائه نمی‌کند؛ این‌ها فقط در مسیر exec می‌مانند.
- مسیر exec پیش از تأیید، یک `systemRunPlan` استاندارد آماده می‌کند. پس از اعطای تأیید، Gateway همان طرح ذخیره‌شده را ارسال می‌کند، نه هیچ فیلد command/cwd/session که بعداً توسط فراخواننده ویرایش شده باشد.
- `system.notify` وضعیت مجوز اعلان را در برنامه macOS رعایت می‌کند.
- فراداده ناشناخته `platform` / `deviceFamily` برای Node از یک allowlist پیش‌فرض محافظه‌کارانه استفاده می‌کند که `system.run` و `system.which` را مستثنی می‌کند. اگر عمداً به این دستورها برای یک سکوی ناشناخته نیاز دارید، آن‌ها را به‌صورت صریح از طریق `gateway.nodes.allowCommands` اضافه کنید.
- `system.run` از `--cwd`، `--env KEY=VAL`، `--command-timeout` و `--needs-screen-recording` پشتیبانی می‌کند.
- برای wrapperهای shell (`bash|sh|zsh ... -c/-lc`)، مقدارهای `--env` با دامنه درخواست به یک allowlist صریح (`TERM`، `LANG`، `LC_*`، `COLORTERM`، `NO_COLOR`، `FORCE_COLOR`) کاهش داده می‌شوند.
- برای تصمیم‌های همیشه مجاز در حالت allowlist، wrapperهای dispatch شناخته‌شده (`env`، `nice`، `nohup`، `stdbuf`، `timeout`) به‌جای مسیرهای wrapper، مسیرهای executable داخلی را ماندگار می‌کنند. اگر بازکردن wrapper امن نباشد، هیچ ورودی allowlist به‌طور خودکار ماندگار نمی‌شود.
- در میزبان‌های Node ویندوز در حالت allowlist، اجراهای shell-wrapper از طریق `cmd.exe /c` به تأیید نیاز دارند (تنها داشتن ورودی allowlist، فرم wrapper را به‌طور خودکار مجاز نمی‌کند).
- `system.notify` از `--priority <passive|active|timeSensitive>` و `--delivery <system|overlay|auto>` پشتیبانی می‌کند.
- میزبان‌های Node بازنویسی‌های `PATH` را نادیده می‌گیرند و کلیدهای خطرناک راه‌اندازی/shell (`DYLD_*`، `LD_*`، `NODE_OPTIONS`، `PYTHON*`، `PERL*`، `RUBYOPT`، `SHELLOPTS`، `PS4`) را حذف می‌کنند. اگر به ورودی‌های اضافی PATH نیاز دارید، به‌جای ارسال `PATH` از طریق `--env`، محیط سرویس میزبان Node را پیکربندی کنید (یا ابزارها را در مکان‌های استاندارد نصب کنید).
- در حالت Node در macOS، `system.run` با تأییدهای exec در برنامه macOS محدود می‌شود (Settings → Exec approvals).
  رفتار ask/allowlist/full مانند میزبان Node بدون رابط کاربری است؛ درخواست‌های ردشده `SYSTEM_RUN_DENIED` برمی‌گردانند.
- در میزبان Node بدون رابط کاربری، `system.run` با تأییدهای exec (`~/.openclaw/exec-approvals.json`) محدود می‌شود.

## اتصال Node برای exec

وقتی چند Node در دسترس باشد، می‌توانید exec را به یک Node مشخص متصل کنید.
این کار Node پیش‌فرض را برای `exec host=node` تنظیم می‌کند (و برای هر agent قابل بازنویسی است).

پیش‌فرض سراسری:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

بازنویسی برای هر agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

برای مجاز کردن هر Node، تنظیم را حذف کنید:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## نگاشت مجوزها

Nodeها ممکن است یک نگاشت `permissions` را در `node.list` / `node.describe` شامل شوند که با نام مجوز (مثلاً `screenRecording`، `accessibility`) کلیدگذاری شده و مقدارهای بولی دارد (`true` = اعطاشده).

## میزبان Node بدون رابط کاربری (چندسکویی)

OpenClaw می‌تواند یک **میزبان Node بدون رابط کاربری** (بدون UI) اجرا کند که به WebSocket Gateway متصل می‌شود و `system.run` / `system.which` را ارائه می‌کند. این برای Linux/Windows یا اجرای یک Node حداقلی در کنار یک سرور مفید است.

آن را شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789
```

نکته‌ها:

- Pairing همچنان لازم است (Gateway یک درخواست pairing دستگاه نشان می‌دهد).
- میزبان Node شناسه Node، توکن، نام نمایشی و اطلاعات اتصال Gateway خود را در `~/.openclaw/node.json` ذخیره می‌کند.
- تأییدهای exec به‌صورت محلی از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند
  (به [تأییدهای exec](/fa/tools/exec-approvals) مراجعه کنید).
- در macOS، میزبان Node بدون رابط کاربری به‌طور پیش‌فرض `system.run` را به‌صورت محلی اجرا می‌کند. `OPENCLAW_NODE_EXEC_HOST=app` را تنظیم کنید تا `system.run` از طریق میزبان exec برنامه همراه مسیریابی شود؛ `OPENCLAW_NODE_EXEC_FALLBACK=0` را اضافه کنید تا میزبان برنامه الزامی شود و اگر در دسترس نبود، به‌صورت بسته شکست بخورد.
- وقتی Gateway WS از TLS استفاده می‌کند، `--tls` / `--tls-fingerprint` را اضافه کنید.

## حالت Node مک

- برنامه menubar در macOS به‌عنوان یک Node به سرور Gateway WS متصل می‌شود (بنابراین `openclaw nodes …` علیه این مک کار می‌کند).
- در حالت remote، برنامه یک تونل SSH برای پورت Gateway باز می‌کند و به `localhost` متصل می‌شود.
