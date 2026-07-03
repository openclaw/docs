---
read_when:
    - جفت‌سازی گره‌های iOS/Android با یک Gateway
    - استفاده از بوم/دوربین node برای زمینهٔ عامل
    - افزودن فرمان‌های جدید Node یا ابزارهای کمکی CLI
summary: 'Nodes: جفت‌سازی، قابلیت‌ها، مجوزها، و کمک‌کننده‌های CLI برای canvas/camera/screen/device/notifications/system'
title: Nodeها
x-i18n:
    generated_at: "2026-07-03T09:50:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

یک **Node** دستگاه همراه (macOS/iOS/Android/بدون رابط گرافیکی) است که با `role: "node"` به **WebSocket**ِ Gateway (همان پورتِ اپراتورها) وصل می‌شود و یک سطح فرمان (برای نمونه `canvas.*`، `camera.*`، `device.*`، `notifications.*`، `system.*`) را از طریق `node.invoke` ارائه می‌کند. جزئیات پروتکل: [پروتکل Gateway](/fa/gateway/protocol).

انتقال قدیمی: [پروتکل Bridge](/fa/gateway/bridge-protocol) (TCP JSONL؛
فقط برای Nodeهای فعلی جنبه تاریخی دارد).

macOS همچنین می‌تواند در **حالت Node** اجرا شود: برنامه نوار منو به سرور WSِ Gateway وصل می‌شود و فرمان‌های محلی canvas/camera خود را به‌عنوان یک Node ارائه می‌کند (بنابراین
`openclaw nodes …` روی همین Mac کار می‌کند). در حالت Gateway راه‌دور، خودکارسازی مرورگر توسط میزبان Nodeِ CLI (`openclaw node run` یا سرویس Node نصب‌شده) انجام می‌شود، نه توسط Node برنامه بومی.

نکته‌ها:

- Nodeها **دستگاه‌های جانبی** هستند، نه Gateway. آن‌ها سرویس Gateway را اجرا نمی‌کنند.
- پیام‌های Telegram/WhatsApp/و غیره روی **Gateway** وارد می‌شوند، نه روی Nodeها.
- راهنمای عیب‌یابی: [/nodes/troubleshooting](/fa/nodes/troubleshooting)

## جفت‌سازی + وضعیت

**Nodeهای WS از جفت‌سازی دستگاه استفاده می‌کنند.** Nodeها هنگام `connect` یک هویت دستگاه ارائه می‌کنند؛ Gateway برای `role: node` یک درخواست جفت‌سازی دستگاه ایجاد می‌کند. از طریق CLI دستگاه‌ها (یا UI) تأیید کنید.

CLI سریع:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

اگر یک Node با جزئیات احراز هویت تغییریافته (نقش/دامنه‌ها/کلید عمومی) دوباره تلاش کند، درخواست معلق قبلی جایگزین می‌شود و یک `requestId` جدید ساخته می‌شود. پیش از تأیید، دوباره
`openclaw devices list` را اجرا کنید.

نکته‌ها:

- `nodes status` وقتی نقش جفت‌سازی دستگاه شامل `node` باشد، Node را **paired** نشان می‌دهد.
- رکورد جفت‌سازی دستگاه، قرارداد پایدار نقشِ تأییدشده است. چرخش توکن داخل همان قرارداد می‌ماند؛ نمی‌تواند یک Node جفت‌شده را به نقشی متفاوت ارتقا دهد که تأیید جفت‌سازی هرگز اعطا نکرده است.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) یک مخزن جداگانه جفت‌سازی Node است که مالک آن Gateway است؛ این مخزن دست‌دهی WS `connect` را محدود نمی‌کند.
- `openclaw nodes remove --node <id|name|ip>` یک جفت‌سازی Node را حذف می‌کند. برای یک Node مبتنی بر دستگاه، نقش `node` آن دستگاه را در `devices/paired.json` لغو می‌کند و نشست‌های نقش-Node آن دستگاه را قطع می‌کند — یک دستگاه چندنقشی ردیف خود را نگه می‌دارد و فقط نقش `node` را از دست می‌دهد، درحالی‌که ردیف دستگاهی که فقط Node است حذف می‌شود. همچنین هر ورودی مطابق را از مخزن جداگانه جفت‌سازی Node که مالک آن Gateway است پاک می‌کند. `operator.pairing` ممکن است ردیف‌های Node غیر-اپراتور را حذف کند؛ یک فراخواننده توکن دستگاه که نقش Node خودش را روی یک دستگاه چندنقشی لغو می‌کند، علاوه بر آن به `operator.admin` نیاز دارد.
- دامنه تأیید از فرمان‌های اعلام‌شده درخواست معلق پیروی می‌کند:
  - درخواست بدون فرمان: `operator.pairing`
  - فرمان‌های Node غیر-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## میزبان Node راه‌دور (system.run)

وقتی Gateway شما روی یک دستگاه اجرا می‌شود و می‌خواهید فرمان‌ها روی دستگاه دیگری اجرا شوند، از یک **میزبان Node** استفاده کنید. مدل همچنان با **Gateway** صحبت می‌کند؛ وقتی `host=node` انتخاب شده باشد، Gateway فراخوانی‌های `exec` را به **میزبان Node** ارسال می‌کند.

### چه چیزی کجا اجرا می‌شود

- **میزبان Gateway**: پیام‌ها را دریافت می‌کند، مدل را اجرا می‌کند، فراخوانی‌های ابزار را مسیریابی می‌کند.
- **میزبان Node**: `system.run`/`system.which` را روی دستگاه Node اجرا می‌کند.
- **تأییدها**: روی میزبان Node از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند.

نکته تأیید:

- اجرای Node مبتنی بر تأیید، به متن دقیق درخواست مقید می‌شود.
- برای اجرای مستقیم فایل‌های شل/زمان اجرا، OpenClaw همچنین تا حد امکان یک عملوند فایل محلی مشخص را مقید می‌کند و اگر آن فایل پیش از اجرا تغییر کند، اجرا را رد می‌کند.
- اگر OpenClaw نتواند دقیقاً یک فایل محلی مشخص را برای یک فرمان مفسر/زمان اجرا شناسایی کند، اجرای مبتنی بر تأیید به‌جای وانمود کردن به پوشش کامل زمان اجرا رد می‌شود. برای معناشناسی گسترده‌تر مفسر، از sandboxing، میزبان‌های جداگانه، یا یک allowlist/گردش‌کار کامل و صریحاً مورد اعتماد استفاده کنید.

### راه‌اندازی میزبان Node (پیش‌زمینه)

روی دستگاه Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway راه‌دور از طریق تونل SSH (اتصال loopback)

اگر Gateway به loopback متصل باشد (`gateway.bind=loopback`، پیش‌فرض در حالت محلی)، میزبان‌های Node راه‌دور نمی‌توانند مستقیم وصل شوند. یک تونل SSH بسازید و میزبان Node را به انتهای محلی تونل اشاره دهید.

نمونه (میزبان Node -> میزبان Gateway):

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
- اگر SecretRefs فعال محلی `gateway.auth.*` پیکربندی شده اما حل‌نشده باشند، احراز هویت میزبان Node به‌صورت fail closed شکست می‌خورد.
- حل احراز هویت میزبان Node فقط متغیرهای محیطی `OPENCLAW_GATEWAY_*` را رعایت می‌کند.

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

اگر Node با جزئیات احراز هویت تغییریافته دوباره تلاش کند، `openclaw devices list` را دوباره اجرا کنید و `requestId` فعلی را تأیید کنید.

گزینه‌های نام‌گذاری:

- `--display-name` روی `openclaw node run` / `openclaw node install` (در `~/.openclaw/node.json` روی Node پایدار می‌ماند).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (بازنویسی از سمت Gateway).

### افزودن فرمان‌ها به allowlist

تأییدهای Exec **برای هر میزبان Node** جداگانه هستند. ورودی‌های allowlist را از Gateway اضافه کنید:

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

پس از تنظیم، هر فراخوانی `exec` با `host=node` روی میزبان Node اجرا می‌شود (مشروط به allowlist/تأییدهای Node).

`host=auto` به‌طور ضمنی خودش Node را انتخاب نمی‌کند، اما درخواست صریح `host=node` برای هر فراخوانی از `auto` مجاز است. اگر می‌خواهید exec روی Node پیش‌فرض نشست باشد، `tools.exec.host=node` یا `/exec host=node ...` را صریحاً تنظیم کنید.

مرتبط:

- [CLI میزبان Node](/fa/cli/node)
- [ابزار Exec](/fa/tools/exec)
- [تأییدهای Exec](/fa/tools/exec-approvals)

### استنتاج مدل محلی

یک Node دسکتاپ یا سرور می‌تواند مدل‌های دارای قابلیت چت را از یک سرور Ollama که روی همان Node اجرا می‌شود ارائه کند. Agentها از ابزار `node_inference` در Pluginِ Ollama برای کشف مدل‌های نصب‌شده و اجرای راه‌دور یک prompt محدود استفاده می‌کنند؛ Gateway به دسترسی مستقیم شبکه به Ollama نیاز ندارد. برای راه‌اندازی، فیلتر کردن مدل، و فرمان‌های راستی‌آزمایی مستقیم، [استنتاج محلی روی Node با Ollama](/fa/providers/ollama#node-local-inference) را ببینید.

## فراخوانی فرمان‌ها

سطح پایین (RPC خام):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

برای گردش‌کارهای رایج «دادن یک پیوست MEDIA به Agent»، کمک‌کننده‌های سطح بالاتر وجود دارند.

## سیاست فرمان

فرمان‌های Node پیش از آنکه بتوانند فراخوانی شوند، باید از دو دروازه عبور کنند:

1. Node باید فرمان را در فهرست WebSocket `connect.commands` خود اعلام کند.
2. سیاست پلتفرم Gateway باید فرمان اعلام‌شده را مجاز بداند.

Nodeهای همراه Windows و macOS به‌طور پیش‌فرض فرمان‌های اعلام‌شده ایمن مانند
`canvas.*`، `camera.list`، `location.get` و `screen.snapshot` را مجاز می‌کنند.
Nodeهای مورد اعتماد که قابلیت `talk` را تبلیغ می‌کنند یا فرمان‌های `talk.*` را اعلام می‌کنند
نیز به‌طور پیش‌فرض فرمان‌های اعلام‌شده push-to-talk (`talk.ptt.start`، `talk.ptt.stop`،
`talk.ptt.cancel`، `talk.ptt.once`) را مستقل از برچسب پلتفرم مجاز می‌کنند.
فرمان‌های خطرناک یا سنگین از نظر حریم خصوصی مانند `camera.snap`، `camera.clip` و
`screen.record` همچنان به opt-in صریح با
`gateway.nodes.allowCommands` نیاز دارند. `gateway.nodes.denyCommands` همیشه بر
پیش‌فرض‌ها و ورودی‌های allowlist اضافی غلبه می‌کند.

فرمان‌های Node که مالک آن‌ها Plugin است می‌توانند یک سیاست node-invoke در Gateway اضافه کنند. آن سیاست
پس از بررسی allowlist و پیش از ارسال به Node اجرا می‌شود، بنابراین `node.invoke` خام،
کمک‌کننده‌های CLI، و ابزارهای اختصاصی Agent همگی مرز مجوزدهی یکسان Plugin را به اشتراک می‌گذارند.
فرمان‌های خطرناک Node متعلق به Plugin همچنان به opt-in صریح
`gateway.nodes.allowCommands` نیاز دارند.

پس از آنکه یک Node فهرست فرمان‌های اعلام‌شده خود را تغییر داد، جفت‌سازی دستگاه قدیمی را رد کنید
و درخواست جدید را تأیید کنید تا Gateway تصویر به‌روز فرمان‌ها را ذخیره کند.

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

از نام دقیق فرمان‌های Node استفاده کنید. `denyCommands` حتی وقتی یک پیش‌فرض پلتفرم یا ورودی `allowCommands` در غیر این صورت آن را مجاز می‌کرد، فرمان را حذف می‌کند. برای جزئیات فیلدهای جفت‌سازی Node در Gateway و سیاست فرمان، [مرجع پیکربندی Gateway](/fa/gateway/configuration-reference#gateway-field-details) را ببینید.

بازنویسی Nodeِ exec برای هر Agent:

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

## اسکرین‌شات‌ها (تصویرهای Canvas)

اگر Node در حال نمایش Canvas (WebView) باشد، `canvas.snapshot` مقدار `{ format, base64 }` را برمی‌گرداند.

کمک‌کننده CLI (در یک فایل موقت می‌نویسد و مسیر ذخیره‌شده را چاپ می‌کند):

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

- `canvas present` نشانی‌های URL یا مسیرهای فایل محلی (`--target`) را می‌پذیرد، به‌علاوه `--x/--y/--width/--height` اختیاری برای تعیین موقعیت.
- `canvas eval` جاوااسکریپت درون‌خطی (`--js`) یا یک آرگومان موقعیتی را می‌پذیرد.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

نکته‌ها:

- نودهای موبایل برای رندر دارای قابلیت اقدام، از یک صفحه A2UI بسته‌بندی‌شده و متعلق به اپ استفاده می‌کنند.
- فقط A2UI v0.8 JSONL پشتیبانی می‌شود (v0.9/createSurface رد می‌شود).
- iOS و Android صفحه‌های remote Gateway Canvas را رندر می‌کنند، اما اقدام‌های دکمه A2UI فقط از صفحه A2UI بسته‌بندی‌شده و متعلق به اپ ارسال می‌شوند. صفحه‌های HTTP/HTTPS A2UI میزبانی‌شده توسط Gateway روی آن کلاینت‌های موبایل فقط قابلیت رندر دارند.

## عکس‌ها + ویدئوها (دوربین نود)

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

- نود باید برای `canvas.*` و `camera.*` **در پیش‌زمینه** باشد (فراخوانی‌های پس‌زمینه `NODE_BACKGROUND_UNAVAILABLE` برمی‌گردانند).
- مدت کلیپ محدود می‌شود (در حال حاضر `<= 60s`) تا از payloadهای base64 بیش‌ازحد بزرگ جلوگیری شود.
- Android در صورت امکان برای مجوزهای `CAMERA`/`RECORD_AUDIO` درخواست می‌دهد؛ مجوزهای ردشده با `*_PERMISSION_REQUIRED` شکست می‌خورند.

## ضبط صفحه (نودها)

نودهای پشتیبانی‌شده `screen.record` (mp4) را در دسترس می‌گذارند. نمونه:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

نکته‌ها:

- در دسترس بودن `screen.record` به پلتفرم نود بستگی دارد.
- ضبط‌های صفحه به `<= 60s` محدود می‌شوند.
- `--no-audio` ضبط میکروفون را روی پلتفرم‌های پشتیبانی‌شده غیرفعال می‌کند.
- وقتی چند صفحه در دسترس است، برای انتخاب نمایشگر از `--screen <index>` استفاده کنید.

## موقعیت مکانی (نودها)

وقتی Location در تنظیمات فعال باشد، نودها `location.get` را در دسترس می‌گذارند.

راهنمای CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

نکته‌ها:

- Location به‌صورت **پیش‌فرض خاموش** است.
- «Always» به مجوز سیستم نیاز دارد؛ واکشی در پس‌زمینه به‌صورت بهترین تلاش انجام می‌شود.
- پاسخ شامل lat/lon، دقت (متر)، و timestamp است.

## SMS (نودهای Android)

نودهای Android می‌توانند وقتی کاربر مجوز **SMS** را اعطا کند و دستگاه از تلفن‌کاری پشتیبانی کند، `sms.send` را در دسترس بگذارند.

فراخوانی سطح پایین:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

نکته‌ها:

- پیش از اعلام capability، درخواست مجوز باید روی دستگاه Android پذیرفته شود.
- دستگاه‌های فقط Wi-Fi که تلفن‌کاری ندارند، `sms.send` را اعلام نمی‌کنند.

## فرمان‌های دستگاه Android + داده‌های شخصی

نودهای Android می‌توانند وقتی capabilityهای متناظر فعال باشند، خانواده‌های فرمان اضافی را اعلام کنند.

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

نکته‌ها:

- `device.apps` اختیاری است و به‌صورت پیش‌فرض اپ‌های قابل مشاهده در لانچر را برمی‌گرداند.
- فرمان‌های حرکت بر اساس سنسورهای موجود با capability محدود می‌شوند.

## فرمان‌های سیستم (میزبان نود / نود Mac)

نود macOS، `system.run`، `system.notify`، و `system.execApprovals.get/set` را در دسترس می‌گذارد.
میزبان نود headless، `system.run`، `system.which`، و `system.execApprovals.get/set` را در دسترس می‌گذارد.

نمونه‌ها:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

نکته‌ها:

- `system.run` در payload، stdout/stderr/exit code را برمی‌گرداند.
- اجرای shell اکنون از مسیر ابزار `exec` با `host=node` انجام می‌شود؛ `nodes` همچنان سطح direct-RPC برای فرمان‌های صریح نود باقی می‌ماند.
- `nodes invoke`، `system.run` یا `system.run.prepare` را در دسترس نمی‌گذارد؛ آن‌ها فقط روی مسیر exec باقی می‌مانند.
- مسیر exec پیش از approval یک `systemRunPlan` استاندارد آماده می‌کند. پس از اعطای
  approval، gateway همان plan ذخیره‌شده را ارسال می‌کند، نه هیچ فیلد command/cwd/session
  که بعداً توسط فراخواننده ویرایش شده باشد.
- `system.notify` وضعیت مجوز اعلان را در اپ macOS رعایت می‌کند.
- metadata ناشناخته `platform` / `deviceFamily` نود از allowlist پیش‌فرض محافظه‌کارانه‌ای استفاده می‌کند که `system.run` و `system.which` را حذف می‌کند. اگر عمداً برای یک پلتفرم ناشناخته به آن فرمان‌ها نیاز دارید، آن‌ها را صراحتاً از طریق `gateway.nodes.allowCommands` اضافه کنید.
- `system.run` از `--cwd`، `--env KEY=VAL`، `--command-timeout`، و `--needs-screen-recording` پشتیبانی می‌کند.
- برای wrapperهای shell (`bash|sh|zsh ... -c/-lc`)، مقدارهای `--env` محدود به درخواست به یک allowlist صریح کاهش می‌یابند (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- برای تصمیم‌های allow-always در حالت allowlist، wrapperهای dispatch شناخته‌شده (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) به‌جای مسیرهای wrapper، مسیرهای اجرایی داخلی را پایدار می‌کنند. اگر بازکردن wrapper ایمن نباشد، هیچ ورودی allowlist به‌صورت خودکار پایدار نمی‌شود.
- روی میزبان‌های نود Windows در حالت allowlist، اجراهای shell-wrapper از طریق `cmd.exe /c` به approval نیاز دارند (تنها وجود ورودی allowlist فرم wrapper را خودکار مجاز نمی‌کند).
- `system.notify` از `--priority <passive|active|timeSensitive>` و `--delivery <system|overlay|auto>` پشتیبانی می‌کند.
- میزبان‌های نود overrideهای `PATH` را نادیده می‌گیرند و کلیدهای خطرناک startup/shell را حذف می‌کنند (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). اگر به ورودی‌های PATH اضافی نیاز دارید، به‌جای ارسال `PATH` از طریق `--env`، محیط سرویس میزبان نود را پیکربندی کنید (یا ابزارها را در مکان‌های استاندارد نصب کنید).
- در حالت نود macOS، `system.run` توسط approvalهای exec در اپ macOS محدود می‌شود (Settings → Exec approvals).
  Ask/allowlist/full همانند میزبان نود headless رفتار می‌کنند؛ promptهای ردشده `SYSTEM_RUN_DENIED` برمی‌گردانند.
- روی میزبان نود headless، `system.run` توسط approvalهای exec (`~/.openclaw/exec-approvals.json`) محدود می‌شود.

## اتصال نود exec

وقتی چند نود در دسترس باشند، می‌توانید exec را به یک نود مشخص متصل کنید.
این کار نود پیش‌فرض را برای `exec host=node` تنظیم می‌کند (و برای هر agent قابل override است).

پیش‌فرض سراسری:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

override برای هر agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

برای اجازه دادن به هر نود، تنظیم را حذف کنید:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## نگاشت مجوزها

نودها ممکن است در `node.list` / `node.describe` یک map به نام `permissions` داشته باشند که با نام مجوز کلیدگذاری شده است (مثلاً `screenRecording`، `accessibility`) و مقدارهای boolean دارد (`true` = اعطا شده).

## میزبان نود headless (چندپلتفرمی)

OpenClaw می‌تواند یک **میزبان نود headless** (بدون UI) اجرا کند که به WebSocket
Gateway وصل می‌شود و `system.run` / `system.which` را در دسترس می‌گذارد. این روی Linux/Windows
یا برای اجرای یک نود حداقلی کنار سرور مفید است.

راه‌اندازی:

```bash
openclaw node run --host <gateway-host> --port 18789
```

نکته‌ها:

- جفت‌سازی همچنان لازم است (Gateway یک prompt جفت‌سازی دستگاه نشان می‌دهد).
- میزبان نود، شناسه نود، token، نام نمایشی، و اطلاعات اتصال gateway خود را در `~/.openclaw/node.json` ذخیره می‌کند.
- approvalهای exec به‌صورت محلی از طریق `~/.openclaw/exec-approvals.json` اعمال می‌شوند
  (ببینید [approvalهای Exec](/fa/tools/exec-approvals)).
- در macOS، میزبان نود headless به‌صورت پیش‌فرض `system.run` را به‌صورت محلی اجرا می‌کند. برای مسیریابی
  `system.run` از طریق میزبان exec اپ همراه، `OPENCLAW_NODE_EXEC_HOST=app` را تنظیم کنید؛ برای الزام به میزبان اپ و fail closed در صورت در دسترس نبودن آن،
  `OPENCLAW_NODE_EXEC_FALLBACK=0` را اضافه کنید.
- وقتی Gateway WS از TLS استفاده می‌کند، `--tls` / `--tls-fingerprint` را اضافه کنید.

## حالت نود Mac

- اپ menubar macOS به‌عنوان یک نود به سرور Gateway WS وصل می‌شود (بنابراین `openclaw nodes …` روی این Mac کار می‌کند).
- در حالت remote، اپ برای پورت Gateway یک تونل SSH باز می‌کند و به `localhost` وصل می‌شود.
