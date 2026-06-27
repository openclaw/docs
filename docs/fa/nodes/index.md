---
read_when:
    - جفت‌سازی گره‌های iOS/Android با یک Gateway
    - استفاده از canvas/camera در Node برای زمینه عامل
    - افزودن دستورهای جدید Node یا کمک‌کننده‌های CLI
summary: 'Nodeها: جفت‌سازی، قابلیت‌ها، مجوزها، و کمک‌کننده‌های CLI برای بوم/دوربین/صفحه‌نمایش/دستگاه/اعلان‌ها/سامانه'
title: Nodeها
x-i18n:
    generated_at: "2026-06-27T18:03:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

یک **Node** دستگاه همراهی است (macOS/iOS/Android/headless) که با `role: "node"` به **وب‌سوکت** Gateway (همان پورتی که اپراتورها استفاده می‌کنند) متصل می‌شود و از طریق `node.invoke` سطحی از فرمان‌ها (مثل `canvas.*`، `camera.*`، `device.*`، `notifications.*`، `system.*`) را ارائه می‌کند. جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

انتقال قدیمی: [پروتکل Bridge](/fa/gateway/bridge-protocol) (TCP JSONL؛
فقط برای Nodeهای فعلی، تاریخی است).

macOS همچنین می‌تواند در **حالت Node** اجرا شود: برنامه menubar به سرور
WS متعلق به Gateway متصل می‌شود و فرمان‌های canvas/camera محلی خود را به‌عنوان یک Node ارائه می‌کند (بنابراین
`openclaw nodes …` روی همین Mac کار می‌کند). در حالت Gateway راه‌دور، خودکارسازی مرورگر
توسط میزبان Node در CLI (`openclaw node run` یا سرویس Node نصب‌شده) انجام می‌شود، نه توسط Node برنامه بومی.

نکته‌ها:

- Nodeها **دستگاه‌های جانبی** هستند، نه Gateway. آن‌ها سرویس Gateway را اجرا نمی‌کنند.
- پیام‌های Telegram/WhatsApp/و غیره روی **Gateway** دریافت می‌شوند، نه روی Nodeها.
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

اگر یک Node با جزئیات احراز هویت تغییرکرده (نقش/دامنه‌ها/کلید عمومی) دوباره تلاش کند، درخواست
در انتظار قبلی جایگزین می‌شود و یک `requestId` تازه ایجاد می‌شود. پیش از تأیید، دوباره
`openclaw devices list` را اجرا کنید.

نکته‌ها:

- `nodes status` وقتی نقش جفت‌سازی دستگاه شامل `node` باشد، Node را **جفت‌شده** علامت‌گذاری می‌کند.
- رکورد جفت‌سازی دستگاه قرارداد پایدار نقشِ تأییدشده است. چرخش توکن
  داخل همان قرارداد باقی می‌ماند؛ نمی‌تواند یک Node جفت‌شده را به
  نقش متفاوتی ارتقا دهد که تأیید جفت‌سازی هرگز اجازه نداده است.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) یک انبار جفت‌سازی Node جداگانه و متعلق به Gateway است؛ این انبار
  دست‌دهی WS `connect` را محدود نمی‌کند.
- `openclaw nodes remove --node <id|name|ip>` یک جفت‌سازی Node را حذف می‌کند. برای یک
  Node متکی بر دستگاه، نقش `node` آن دستگاه را در `devices/paired.json`
  لغو می‌کند و نشست‌های نقش-Node همان دستگاه را قطع می‌کند؛ یک دستگاه چندنقشی
  ردیف خود را نگه می‌دارد و فقط نقش `node` را از دست می‌دهد، درحالی‌که ردیف دستگاهی که فقط Node است
  حذف می‌شود. همچنین هر ورودی مطابق را از انبار جفت‌سازی Node جداگانه و متعلق به Gateway
  پاک می‌کند. `operator.pairing` می‌تواند ردیف‌های Node غیر-اپراتور را حذف کند؛ فراخواننده‌ای با توکن دستگاه که نقش Node خودش را روی یک دستگاه چندنقشی لغو می‌کند
  علاوه بر آن به `operator.admin` نیاز دارد.
- دامنه تأیید از فرمان‌های اعلام‌شده در درخواست در انتظار پیروی می‌کند:
  - درخواست بدون فرمان: `operator.pairing`
  - فرمان‌های Node غیر-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## میزبان Node راه‌دور (system.run)

وقتی Gateway شما روی یک ماشین اجرا می‌شود و می‌خواهید فرمان‌ها
روی ماشین دیگری اجرا شوند، از یک **میزبان Node** استفاده کنید. مدل همچنان با **Gateway** صحبت می‌کند؛ Gateway
وقتی `host=node` انتخاب شده باشد، فراخوانی‌های `exec` را به **میزبان Node** ارسال می‌کند.

### چه چیزی کجا اجرا می‌شود

- **میزبان Gateway**: پیام‌ها را دریافت می‌کند، مدل را اجرا می‌کند، فراخوانی‌های ابزار را مسیریابی می‌کند.
- **میزبان Node**: `system.run`/`system.which` را روی ماشین Node اجرا می‌کند.
- **تأییدها**: روی میزبان Node از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند.

نکته تأیید:

- اجراهای Node متکی بر تأیید به بافت دقیق درخواست متصل می‌شوند.
- برای اجرای مستقیم فایل‌های shell/runtime، OpenClaw همچنین به‌صورت بهترین تلاش، یک عملوند فایل محلی مشخص
  را متصل می‌کند و اگر آن فایل پیش از اجرا تغییر کند، اجرا را رد می‌کند.
- اگر OpenClaw نتواند دقیقاً یک فایل محلی مشخص را برای فرمان interpreter/runtime شناسایی کند،
  اجرای متکی بر تأیید رد می‌شود، به‌جای اینکه پوشش کامل runtime را وانمود کند. برای معناشناسی گسترده‌تر interpreter از sandboxing،
  میزبان‌های جداگانه، یا یک allowlist/گردش‌کار کامل و صریحاً مورد اعتماد استفاده کنید.

### شروع یک میزبان Node (foreground)

روی ماشین Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway راه‌دور از طریق تونل SSH (bind روی لوپ‌بک)

اگر Gateway به لوپ‌بک bind شود (`gateway.bind=loopback`، پیش‌فرض در حالت محلی)،
میزبان‌های Node راه‌دور نمی‌توانند مستقیم متصل شوند. یک تونل SSH ایجاد کنید و
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
- مسیر fallback پیکربندی `gateway.auth.token` / `gateway.auth.password` است.
- در حالت محلی، میزبان Node عمداً `gateway.remote.token` / `gateway.remote.password` را نادیده می‌گیرد.
- در حالت راه‌دور، `gateway.remote.token` / `gateway.remote.password` طبق قواعد تقدم راه‌دور واجد شرایط هستند.
- اگر SecretRefهای فعال محلی `gateway.auth.*` پیکربندی شده اما resolve نشده باشند، احراز هویت میزبان Node به‌صورت fail closed شکست می‌خورد.
- resolve احراز هویت میزبان Node فقط متغیرهای محیطی `OPENCLAW_GATEWAY_*` را می‌پذیرد.

### شروع یک میزبان Node (سرویس)

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

اگر Node با جزئیات احراز هویت تغییرکرده دوباره تلاش کند، دوباره `openclaw devices list`
را اجرا کنید و `requestId` فعلی را تأیید کنید.

گزینه‌های نام‌گذاری:

- `--display-name` روی `openclaw node run` / `openclaw node install` (روی Node در `~/.openclaw/node.json` پایدار می‌ماند).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (بازنویسی Gateway).

### فرمان‌ها را در allowlist قرار دهید

تأییدهای Exec **به‌ازای هر میزبان Node** هستند. ورودی‌های allowlist را از Gateway اضافه کنید:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

تأییدها روی میزبان Node در `~/.openclaw/exec-approvals.json` قرار دارند.

### exec را به Node اشاره دهید

پیش‌فرض‌ها را پیکربندی کنید (پیکربندی Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

یا به‌ازای هر نشست:

```
/exec host=node security=allowlist node=<id-or-name>
```

پس از تنظیم، هر فراخوانی `exec` با `host=node` روی میزبان Node اجرا می‌شود (مشروط به
allowlist/تأییدهای Node).

`host=auto` به‌طور ضمنی خودش Node را انتخاب نمی‌کند، اما درخواست صریح `host=node` به‌ازای هر فراخوانی از `auto` مجاز است. اگر می‌خواهید exec روی Node پیش‌فرض نشست باشد، `tools.exec.host=node` یا `/exec host=node ...` را صریحاً تنظیم کنید.

مرتبط:

- [CLI میزبان Node](/fa/cli/node)
- [ابزار Exec](/fa/tools/exec)
- [تأییدهای Exec](/fa/tools/exec-approvals)

## فراخوانی فرمان‌ها

سطح پایین (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

برای گردش‌کارهای رایج «دادن یک پیوست MEDIA به عامل»، helperهای سطح‌بالاتری وجود دارد.

## سیاست فرمان

فرمان‌های Node پیش از اینکه قابل فراخوانی باشند باید از دو gate عبور کنند:

1. Node باید فرمان را در فهرست WebSocket `connect.commands` خود اعلام کند.
2. سیاست پلتفرم Gateway باید فرمان اعلام‌شده را مجاز بداند.

Nodeهای همراه Windows و macOS به‌طور پیش‌فرض فرمان‌های اعلام‌شده امنی مانند
`canvas.*`، `camera.list`، `location.get`، و `screen.snapshot` را مجاز می‌دانند.
Nodeهای مورد اعتماد که قابلیت `talk` را تبلیغ می‌کنند یا فرمان‌های `talk.*` را اعلام می‌کنند
نیز به‌طور پیش‌فرض فرمان‌های push-to-talk اعلام‌شده (`talk.ptt.start`، `talk.ptt.stop`،
`talk.ptt.cancel`، `talk.ptt.once`) را مستقل از برچسب پلتفرم مجاز می‌دانند.
فرمان‌های خطرناک یا حساس از نظر حریم خصوصی مانند `camera.snap`، `camera.clip`، و
`screen.record` همچنان به opt-in صریح با
`gateway.nodes.allowCommands` نیاز دارند. `gateway.nodes.denyCommands` همیشه بر
پیش‌فرض‌ها و ورودی‌های اضافی allowlist مقدم است.

فرمان‌های Node متعلق به Plugin می‌توانند یک سیاست node-invoke برای Gateway اضافه کنند. آن سیاست
پس از بررسی allowlist و پیش از ارسال به Node اجرا می‌شود، بنابراین
`node.invoke` خام، helperهای CLI، و ابزارهای اختصاصی عامل همگی مرز مجوز
Plugin یکسانی را به اشتراک می‌گذارند. فرمان‌های خطرناک Node متعلق به Plugin همچنان به opt-in صریح
`gateway.nodes.allowCommands` نیاز دارند.

پس از اینکه یک Node فهرست فرمان‌های اعلام‌شده خود را تغییر داد، جفت‌سازی دستگاه قدیمی را رد کنید
و درخواست تازه را تأیید کنید تا Gateway snapshot فرمان به‌روز را ذخیره کند.

## پیکربندی (`openclaw.json`)

تنظیمات مرتبط با Node زیر `gateway.nodes` و `tools.exec` قرار دارند:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

از نام‌های دقیق فرمان Node استفاده کنید. `denyCommands` حتی وقتی یک
پیش‌فرض پلتفرم یا ورودی `allowCommands` در غیر این صورت آن را مجاز می‌کرد، فرمان را حذف می‌کند. برای جزئیات فیلدهای جفت‌سازی Node در Gateway و سیاست فرمان، ببینید:
[مرجع پیکربندی Gateway](/fa/gateway/configuration-reference#gateway-field-details)

بازنویسی Node مربوط به exec به‌ازای هر عامل:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## اسکرین‌شات‌ها (snapshotهای canvas)

اگر Node در حال نمایش Canvas (WebView) باشد، `canvas.snapshot` مقدار `{ format, base64 }` را برمی‌گرداند.

helper در CLI (در یک فایل موقت می‌نویسد و مسیر ذخیره‌شده را چاپ می‌کند):

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

- `canvas present` نشانی‌های URL یا مسیرهای فایل محلی (`--target`) را می‌پذیرد، به‌علاوه `--x/--y/--width/--height` اختیاری برای موقعیت‌دهی.
- `canvas eval` JS درون‌خطی (`--js`) یا یک آرگومان مکانی را می‌پذیرد.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

نکته‌ها:

- Nodeهای موبایل از یک صفحه A2UI همراه و متعلق به برنامه برای رندر دارای قابلیت action استفاده می‌کنند.
- فقط A2UI v0.8 JSONL پشتیبانی می‌شود (v0.9/createSurface رد می‌شود).
- iOS و Android صفحه‌های Canvas راه‌دور Gateway را رندر می‌کنند، اما actionهای دکمه A2UI فقط از صفحه A2UI همراه و متعلق به برنامه dispatch می‌شوند. صفحه‌های A2UI مبتنی بر HTTP/HTTPS و میزبانی‌شده در Gateway روی آن clientهای موبایل فقط رندر می‌شوند.

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

- گره باید برای `canvas.*` و `camera.*` **در پیش‌زمینه** باشد (فراخوانی‌های پس‌زمینه `NODE_BACKGROUND_UNAVAILABLE` برمی‌گردانند).
- مدت کلیپ محدود می‌شود (در حال حاضر `<= 60s`) تا از payloadهای base64 بیش از حد بزرگ جلوگیری شود.
- Android در صورت امکان برای مجوزهای `CAMERA`/`RECORD_AUDIO` درخواست نشان می‌دهد؛ مجوزهای ردشده با `*_PERMISSION_REQUIRED` شکست می‌خورند.

## ضبط‌های صفحه‌نمایش (گره‌ها)

گره‌های پشتیبانی‌شده `screen.record` را ارائه می‌کنند (`mp4`). مثال:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

نکات:

- دسترس‌پذیری `screen.record` به پلتفرم گره بستگی دارد.
- ضبط‌های صفحه‌نمایش به `<= 60s` محدود می‌شوند.
- `--no-audio` ضبط میکروفون را در پلتفرم‌های پشتیبانی‌شده غیرفعال می‌کند.
- وقتی چند صفحه‌نمایش در دسترس است، برای انتخاب نمایشگر از `--screen <index>` استفاده کنید.

## موقعیت مکانی (گره‌ها)

گره‌ها وقتی Location در تنظیمات فعال باشد، `location.get` را ارائه می‌کنند.

کمک‌کننده CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

نکات:

- Location به‌صورت **پیش‌فرض خاموش** است.
- «همیشه» به مجوز سیستم نیاز دارد؛ واکشی پس‌زمینه به‌صورت best-effort انجام می‌شود.
- پاسخ شامل lat/lon، دقت (متر)، و timestamp است.

## SMS (گره‌های Android)

گره‌های Android وقتی کاربر مجوز **SMS** را بدهد و دستگاه از تلفن پشتیبانی کند، می‌توانند `sms.send` را ارائه کنند.

فراخوانی سطح پایین:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

نکات:

- پیش از اعلام این قابلیت، درخواست مجوز باید روی دستگاه Android پذیرفته شود.
- دستگاه‌های فقط Wi-Fi که تلفن ندارند، `sms.send` را اعلام نمی‌کنند.

## فرمان‌های دستگاه Android و داده‌های شخصی

گره‌های Android وقتی قابلیت‌های متناظر فعال باشند، می‌توانند خانواده‌های فرمان اضافی را اعلام کنند.

خانواده‌های موجود:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` وقتی اشتراک‌گذاری Installed Apps در Android Settings فعال باشد
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
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

نکات:

- `device.apps` اختیاری است و به‌صورت پیش‌فرض برنامه‌های قابل مشاهده در launcher را برمی‌گرداند.
- فرمان‌های Motion با قابلیت‌های حسگرهای موجود محدود می‌شوند.

## فرمان‌های سیستم (میزبان گره / گره Mac)

گره macOS، `system.run`، `system.notify`، و `system.execApprovals.get/set` را ارائه می‌کند.
میزبان گره headless، `system.run`، `system.which`، و `system.execApprovals.get/set` را ارائه می‌کند.

مثال‌ها:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

نکات:

- `system.run`، stdout/stderr/exit code را در payload برمی‌گرداند.
- اجرای shell اکنون از طریق ابزار `exec` با `host=node` انجام می‌شود؛ `nodes` همچنان سطح direct-RPC برای فرمان‌های صریح گره است.
- `nodes invoke`، `system.run` یا `system.run.prepare` را ارائه نمی‌کند؛ آن‌ها فقط روی مسیر exec باقی می‌مانند.
- مسیر exec پیش از تأیید، یک `systemRunPlan` متعارف آماده می‌کند. پس از اینکه
  تأیید داده شد، Gateway همان طرح ذخیره‌شده را ارسال می‌کند، نه هیچ فیلد command/cwd/session
  که بعداً توسط فراخواننده ویرایش شده باشد.
- `system.notify` وضعیت مجوز اعلان را در برنامه macOS رعایت می‌کند.
- metadata ناشناخته `platform` / `deviceFamily` گره از allowlist پیش‌فرض محافظه‌کارانه‌ای استفاده می‌کند که `system.run` و `system.which` را مستثنی می‌کند. اگر عمداً به این فرمان‌ها برای یک پلتفرم ناشناخته نیاز دارید، آن‌ها را صریحاً از طریق `gateway.nodes.allowCommands` اضافه کنید.
- `system.run` از `--cwd`، `--env KEY=VAL`، `--command-timeout`، و `--needs-screen-recording` پشتیبانی می‌کند.
- برای wrapperهای shell (`bash|sh|zsh ... -c/-lc`)، مقدارهای request-scoped مربوط به `--env` به یک allowlist صریح (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`) کاهش داده می‌شوند.
- برای تصمیم‌های allow-always در حالت allowlist، wrapperهای dispatch شناخته‌شده (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) به‌جای مسیرهای wrapper، مسیرهای اجرایی داخلی را پایدار می‌کنند. اگر بازکردن wrapper ایمن نباشد، هیچ ورودی allowlist به‌طور خودکار پایدار نمی‌شود.
- روی میزبان‌های گره Windows در حالت allowlist، اجراهای shell-wrapper از طریق `cmd.exe /c` به تأیید نیاز دارند (صرفاً وجود ورودی allowlist فرم wrapper را خودکار مجاز نمی‌کند).
- `system.notify` از `--priority <passive|active|timeSensitive>` و `--delivery <system|overlay|auto>` پشتیبانی می‌کند.
- میزبان‌های گره overrideهای `PATH` را نادیده می‌گیرند و کلیدهای خطرناک startup/shell را حذف می‌کنند (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). اگر به ورودی‌های PATH اضافی نیاز دارید، به‌جای ارسال `PATH` از طریق `--env`، محیط سرویس میزبان گره را پیکربندی کنید (یا ابزارها را در مکان‌های استاندارد نصب کنید).
- در حالت گره macOS، `system.run` با تأییدهای exec در برنامه macOS کنترل می‌شود (Settings → Exec approvals).
  Ask/allowlist/full همانند میزبان گره headless رفتار می‌کنند؛ درخواست‌های ردشده `SYSTEM_RUN_DENIED` برمی‌گردانند.
- روی میزبان گره headless، `system.run` با تأییدهای exec (`~/.openclaw/exec-approvals.json`) کنترل می‌شود.

## اتصال گره exec

وقتی چند گره در دسترس است، می‌توانید exec را به یک گره مشخص متصل کنید.
این کار گره پیش‌فرض را برای `exec host=node` تنظیم می‌کند (و می‌تواند برای هر agent بازنویسی شود).

پیش‌فرض سراسری:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

بازنویسی برای هر agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

برای اجازه دادن به هر گره، unset کنید:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## نگاشت مجوزها

گره‌ها ممکن است یک نگاشت `permissions` در `node.list` / `node.describe` داشته باشند، که با نام مجوز (مثلاً `screenRecording`، `accessibility`) کلیدگذاری شده و مقدارهای boolean (`true` = granted) دارد.

## میزبان گره headless (چندپلتفرمی)

OpenClaw می‌تواند یک **میزبان گره headless** (بدون UI) اجرا کند که به WebSocket مربوط به Gateway
وصل می‌شود و `system.run` / `system.which` را ارائه می‌کند. این برای Linux/Windows
یا برای اجرای یک گره حداقلی کنار یک server مفید است.

آن را شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789
```

نکات:

- Pairing همچنان لازم است (Gateway یک درخواست pairing دستگاه نشان می‌دهد).
- میزبان گره، node id، token، display name، و اطلاعات اتصال gateway خود را در `~/.openclaw/node.json` ذخیره می‌کند.
- تأییدهای exec به‌صورت محلی از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند
  (ببینید [تأییدهای Exec](/fa/tools/exec-approvals)).
- روی macOS، میزبان گره headless به‌صورت پیش‌فرض `system.run` را محلی اجرا می‌کند. برای مسیریابی
  `system.run` از طریق exec host برنامه همراه، `OPENCLAW_NODE_EXEC_HOST=app` را تنظیم کنید؛ برای الزامی کردن app host و fail closed در صورت ناموجود بودن آن،
  `OPENCLAW_NODE_EXEC_FALLBACK=0` را اضافه کنید.
- وقتی Gateway WS از TLS استفاده می‌کند، `--tls` / `--tls-fingerprint` را اضافه کنید.

## حالت گره Mac

- برنامه menubar macOS به‌عنوان یک گره به سرور Gateway WS وصل می‌شود (بنابراین `openclaw nodes …` روی این Mac کار می‌کند).
- در حالت remote، برنامه یک tunnel SSH برای پورت Gateway باز می‌کند و به `localhost` وصل می‌شود.
