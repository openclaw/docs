---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS Gateway
    - اشکال‌زدایی ناسازگاری‌های پروتکل یا خطاهای اتصال
    - بازسازی طرح‌واره/مدل‌های پروتکل
summary: 'پروتکل WebSocket Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-05-07T13:20:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل WS مربوط به Gateway، **صفحه کنترل واحد + انتقال Node** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط وب، برنامه macOS، Nodeهای iOS/Android، Nodeهای
بدون رابط) از طریق وب‌سوکت متصل می‌شوند و **نقش** + **دامنه** خود را در زمان
دست‌دهی اعلام می‌کنند.

## انتقال

- وب‌سوکت، فریم‌های متنی با payloadهای JSON.
- اولین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود شده‌اند. پس از یک دست‌دهی موفق، کلاینت‌ها
  باید محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` را رعایت کنند. وقتی عیب‌یابی فعال باشد،
  فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه Gateway فریم
  متأثر را ببندد یا کنار بگذارد، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطح‌ها، و کدهای دلیل ایمن را نگه می‌دارند. آن‌ها بدنه پیام،
  محتوای پیوست، بدنه خام فریم، توکن‌ها، کوکی‌ها، یا مقادیر محرمانه را نگه نمی‌دارند.

## دست‌دهی (اتصال)

Gateway → کلاینت (چالش پیش از اتصال):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

کلاینت → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → کلاینت:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

در حالی که Gateway هنوز در حال تکمیل sidecarهای راه‌اندازی است، درخواست `connect` می‌تواند
یک خطای قابل‌تکرار `UNAVAILABLE` برگرداند که `details.reason` روی
`"startup-sidecars"` و `retryAfterMs` تنظیم شده است. کلاینت‌ها باید این پاسخ را
در چارچوب بودجه کلی اتصال خود دوباره امتحان کنند، نه اینکه آن را به‌عنوان شکست
نهایی دست‌دهی نمایش دهند.

`server`، `features`، `snapshot`، و `policy` همگی طبق schema
(`src/gateway/protocol/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/دامنه‌های مذاکره‌شده را گزارش می‌کند. `pluginSurfaceUrls` اختیاری است و نام‌های
سطح Plugin، مانند `canvas`، را به URLهای میزبانی‌شده دارای دامنه نگاشت می‌کند.

URLهای سطح Plugin دارای دامنه ممکن است منقضی شوند. Nodeها می‌توانند
`node.pluginSurface.refresh` را با `{ "surface": "canvas" }` فراخوانی کنند تا یک
ورودی تازه در `pluginSurfaceUrls` دریافت کنند. بازآرایی آزمایشی Plugin مربوط به Canvas
از مسیر سازگاری منسوخ `canvasHostUrl`، `canvasCapability`، یا
`node.canvas.capability.refresh` پشتیبانی نمی‌کند؛ کلاینت‌های بومی و Gatewayهای فعلی
باید از سطح‌های Plugin استفاده کنند.

وقتی هیچ توکن دستگاهی صادر نشود، `hello-ok.auth` مجوزهای مذاکره‌شده را بدون فیلدهای
توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend قابل‌اعتماد هم‌فرآیند (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصال‌های loopback مستقیم، وقتی با توکن/رمز عبور
مشترک Gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای داخلی
صفحه کنترل رزرو شده است و مانع از آن می‌شود که مبناهای قدیمی جفت‌سازی CLI/دستگاه،
کار backend محلی مانند به‌روزرسانی‌های نشست subagent را مسدود کنند. کلاینت‌های راه‌دور،
کلاینت‌های دارای مبدأ مرورگر، کلاینت‌های Node، و کلاینت‌های صریح دارای توکن دستگاه/هویت
دستگاه همچنان از بررسی‌های معمول جفت‌سازی و ارتقای دامنه استفاده می‌کنند.

وقتی یک توکن دستگاه صادر شود، `hello-ok` همچنین شامل این مورد است:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

در طول واگذاری bootstrap قابل‌اعتماد، `hello-ok.auth` ممکن است ورودی‌های نقش محدود
اضافی را نیز در `deviceTokens` شامل شود:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

برای جریان bootstrap داخلی Node/operator، توکن اصلی Node به‌صورت
`scopes: []` باقی می‌ماند و هر توکن operator واگذارشده به فهرست مجاز operator مربوط به bootstrap
(`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`) محدود می‌ماند. بررسی‌های دامنه bootstrap همچنان
دارای پیشوند نقش می‌مانند: ورودی‌های operator فقط درخواست‌های operator را برآورده می‌کنند،
و نقش‌های غیر operator همچنان به دامنه‌هایی زیر پیشوند نقش خودشان نیاز دارند.

### نمونه Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## فریم‌بندی

- **درخواست**: `{type:"req", id, method, params}`
- **پاسخ**: `{type:"res", id, ok, payload|error}`
- **رویداد**: `{type:"event", event, payload, seq?, stateVersion?}`

متدهای دارای اثر جانبی به **کلیدهای idempotency** نیاز دارند (schema را ببینید).

## نقش‌ها + دامنه‌ها

برای مدل کامل دامنه operator، بررسی‌های زمان تأیید، و معنای secret مشترک،
[دامنه‌های operator](/fa/gateway/operator-scopes) را ببینید.

### نقش‌ها

- `operator` = کلاینت صفحه کنترل (CLI/UI/خودکارسازی).
- `node` = میزبان قابلیت (camera/screen/canvas/system.run).

### دامنه‌ها (operator)

دامنه‌های رایج:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` با `includeSecrets: true` به `operator.talk.secrets`
(یا `operator.admin`) نیاز دارد.

متدهای RPC مربوط به Gateway که توسط Plugin ثبت شده‌اند ممکن است دامنه operator خودشان را
درخواست کنند، اما پیشوندهای admin هسته رزروشده (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` resolve می‌شوند.

دامنه متد فقط اولین دروازه است. برخی فرمان‌های slash که از طریق
`chat.send` قابل‌دسترسی هستند، بررسی‌های سخت‌گیرانه‌تر در سطح فرمان را روی آن اعمال می‌کنند.
برای مثال، نوشتن‌های پایدار ` /config set` و ` /config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` همچنین افزون بر دامنه پایه متد، یک بررسی دامنه اضافی در زمان تأیید دارد:

- درخواست‌های بدون فرمان: `operator.pairing`
- درخواست‌های دارای فرمان‌های Node غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare`، یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### قابلیت‌ها/فرمان‌ها/مجوزها (Node)

Nodeها ادعاهای قابلیت را در زمان اتصال اعلام می‌کنند:

- `caps`: دسته‌های سطح بالای قابلیت مانند `camera`، `canvas`، `screen`،
  `location`، `voice`، و `talk`.
- `commands`: فهرست مجاز فرمان‌ها برای invoke.
- `permissions`: toggleهای ریزدانه (مثلاً `screen.record`، `camera.capture`).

Gateway با این‌ها به‌عنوان **ادعا** برخورد می‌کند و فهرست‌های مجاز سمت سرور را اعمال می‌کند.

## حضور

- `system-presence` ورودی‌هایی را برمی‌گرداند که با هویت دستگاه کلیدگذاری شده‌اند.
- ورودی‌های حضور شامل `deviceId`، `roles`، و `scopes` هستند تا رابط‌های کاربری بتوانند برای هر دستگاه
  حتی وقتی هم به‌عنوان **operator** و هم به‌عنوان **node** متصل می‌شود، یک ردیف واحد نشان دهند.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. Nodeهای متصل
  زمان اتصال فعلی خود را با دلیل `connect` به‌عنوان `lastSeenAtMs` گزارش می‌کنند؛ Nodeهای جفت‌شده
  همچنین وقتی یک رویداد Node قابل‌اعتماد metadata جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، می‌توانند
  حضور پس‌زمینه پایدار گزارش کنند.

### رویداد زنده‌بودن Node در پس‌زمینه

Nodeها ممکن است `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک Node جفت‌شده
در طول بیدارشدن پس‌زمینه زنده بوده است، بدون اینکه به‌عنوان متصل علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual`، یا `connect`. رشته‌های trigger ناشناخته پیش از پایداری، توسط Gateway به
`background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های احرازشده دستگاه Node
پایدار است؛ نشست‌های بدون دستگاه یا جفت‌نشده `handled: false` برمی‌گردانند.

Gatewayهای موفق یک نتیجه ساختاریافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gatewayهای قدیمی‌تر ممکن است همچنان برای `node.event` مقدار `{ "ok": true }` برگردانند؛ کلاینت‌ها باید آن را
به‌عنوان یک RPC تأییدشده در نظر بگیرند، نه به‌عنوان پایداری حضور پایدار.

## دامنه‌بندی رویدادهای broadcast

رویدادهای broadcast وب‌سوکت که از سمت سرور push می‌شوند، با دامنه gate می‌شوند تا نشست‌های دارای دامنه pairing یا فقط Node، محتوای نشست را به‌صورت غیرفعال دریافت نکنند.

- **فریم‌های chat، agent، و tool-result** (از جمله رویدادهای streamed `agent` و نتایج tool call) حداقل به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را کاملاً رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به نحوه ثبت آن‌ها توسط Plugin، با `operator.write` یا `operator.admin` gate می‌شوند.
- **رویدادهای وضعیت و انتقال** (`heartbeat`، `presence`، `tick`، چرخه عمر اتصال/قطع اتصال، و غیره) بدون محدودیت باقی می‌مانند تا سلامت انتقال برای هر نشست احرازشده قابل مشاهده باشد.
- **خانواده‌های ناشناخته رویدادهای broadcast** به‌صورت پیش‌فرض با دامنه gate می‌شوند (fail-closed)، مگر اینکه یک handler ثبت‌شده صریحاً آن‌ها را آزادتر کند.

هر اتصال کلاینت شماره توالی per-client خودش را نگه می‌دارد تا broadcastها روی آن socket ترتیب یکنواخت را حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوتی از جریان رویداد را پس از فیلتر دامنه می‌بینند.

## خانواده‌های رایج متدهای RPC

سطح عمومی WS گسترده‌تر از مثال‌های دست‌دهی/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست discovery محافظه‌کارانه است
که از `src/gateway/server-methods-list.ts` به‌علاوه exportهای متد Plugin/channel بارگذاری‌شده
ساخته شده است. با آن به‌عنوان feature discovery برخورد کنید، نه enumeration کامل
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` snapshot سلامت Gateway کش‌شده یا تازه probe‌شده را برمی‌گرداند.
    - `diagnostics.stability` ضبط‌کننده پایداری تشخیصی محدود اخیر را برمی‌گرداند. این مورد metadata عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های byte، خوانش‌های memory، وضعیت queue/session، نام‌های channel/plugin، و شناسه‌های session را نگه می‌دارد. متن chat، بدنه‌های Webhook، خروجی‌های tool، بدنه‌های خام request یا response، توکن‌ها، کوکی‌ها، یا مقادیر محرمانه را نگه نمی‌دارد. دامنه خواندن operator لازم است.
    - `status` خلاصه Gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های operator دارای دامنه admin گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه Gateway را که توسط جریان‌های relay و pairing استفاده می‌شود برمی‌گرداند.
    - `system-presence` snapshot حضور فعلی دستگاه‌های operator/Node متصل را برمی‌گرداند.
    - `system-event` یک رویداد سیستم را اضافه می‌کند و می‌تواند context حضور را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` آخرین رویداد Heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را روی Gateway toggle می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و استفاده">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازهٔ انتخاب‌گر (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را بفرستید، یا برای کاتالوگ کامل مقدار `{ "view": "all" }` را بفرستید.
    - `usage.status` خلاصه‌های بازه‌های استفادهٔ ارائه‌دهنده/سهمیهٔ باقی‌مانده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیعی استفادهٔ هزینه را برای یک بازهٔ تاریخی برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظهٔ برداری / embedding ذخیره‌شده در cache را برای workspace عامل پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخوان به‌صراحت یک ping زنده به ارائه‌دهندهٔ embedding می‌خواهد، مقدار `{ "probe": true }` یا `{ "deep": true }` را بفرستید.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از harness REM را برای کلاینت‌های control-plane راه‌دور برمی‌گرداند. این می‌تواند شامل مسیرهای workspace، قطعه‌های حافظه، Markdown زمینه‌دار رندرشده، و نامزدهای deep promotion باشد، بنابراین فراخوان‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های استفادهٔ هر نشست را برمی‌گرداند.
    - `sessions.usage.timeseries` استفادهٔ سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های log استفاده را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، در جایی که کانال از خروج پشتیبانی کند، خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/web را برای ارائه‌دهندهٔ کانال web فعلی که قابلیت QR دارد شروع می‌کند.
    - `web.login.wait` منتظر تکمیل آن جریان ورود QR/web می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک push آزمایشی APNs را به یک node ثبت‌شدهٔ iOS می‌فرستد.
    - `voicewake.get` triggerهای wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` triggerهای wake-word را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و logها">
    - `send` RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گذاری‌شده بر اساس کانال/حساب/thread در بیرون از runner چت است.
    - `logs.tail` انتهای log فایل پیکربندی‌شدهٔ gateway را با کنترل‌های cursor/limit و حداکثر byte برمی‌گرداند.

  </Accordion>

  <Accordion title="گفتار و TTS">
    - `talk.catalog` کاتالوگ فقط‌خواندنی ارائه‌دهندگان Talk را برای گفتار، رونویسی streaming، و صدای realtime برمی‌گرداند. این شامل شناسه‌های ارائه‌دهنده، برچسب‌ها، وضعیت پیکربندی‌شده، شناسه‌های مدل/صدا که expose شده‌اند، حالت‌های canonical، transportها، راهبردهای brain، و پرچم‌های audio/capability realtime است، بدون اینکه secretهای ارائه‌دهنده را برگرداند یا پیکربندی سراسری را تغییر دهد.
    - `talk.config` payload مؤثر پیکربندی Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.session.create` یک نشست Talk تحت مالکیت Gateway برای `realtime/gateway-relay`، `transcription/gateway-relay`، یا `stt-tts/managed-room` ایجاد می‌کند. `brain: "direct-tools"` به `operator.admin` نیاز دارد.
    - `talk.session.join` token نشست managed-room را اعتبارسنجی می‌کند، در صورت نیاز eventهای `session.ready` یا `session.replaced` را منتشر می‌کند، و metadata اتاق/نشست را همراه با eventهای Talk اخیر، بدون token متن ساده یا hash token ذخیره‌شده، برمی‌گرداند.
    - `talk.session.appendAudio` صدای ورودی PCM با base64 را به نشست‌های relay realtime و رونویسی تحت مالکیت Gateway اضافه می‌کند.
    - `talk.session.startTurn`، `talk.session.endTurn`، و `talk.session.cancelTurn` چرخهٔ عمر نوبت managed-room را با رد نوبت stale پیش از پاک شدن state هدایت می‌کنند.
    - `talk.session.cancelOutput` خروجی صوتی assistant را متوقف می‌کند، عمدتاً برای barge-in کنترل‌شده با VAD در نشست‌های relay Gateway.
    - `talk.session.submitToolResult` یک فراخوانی ابزار ارائه‌دهنده را که توسط نشست relay realtime تحت مالکیت Gateway منتشر شده تکمیل می‌کند.
    - `talk.session.close` یک نشست relay، رونویسی، یا managed-room تحت مالکیت Gateway را می‌بندد و eventهای پایانی Talk را منتشر می‌کند.
    - `talk.mode` وضعیت حالت Talk فعلی را برای کلاینت‌های WebChat/Control UI تنظیم/پخش می‌کند.
    - `talk.client.create` یک نشست ارائه‌دهندهٔ realtime تحت مالکیت کلاینت را با استفاده از `webrtc` یا `provider-websocket` ایجاد می‌کند، در حالی که Gateway مالک پیکربندی، credentialها، دستورالعمل‌ها، و سیاست ابزار است.
    - `talk.client.toolCall` به transportهای realtime تحت مالکیت کلاینت اجازه می‌دهد فراخوانی‌های ابزار ارائه‌دهنده را به سیاست Gateway ارسال کنند. نخستین ابزار پشتیبانی‌شده `openclaw_agent_consult` است؛ کلاینت‌ها یک run id دریافت می‌کنند و پیش از ارسال نتیجهٔ ابزار مختص ارائه‌دهنده، منتظر eventهای عادی چرخهٔ عمر چت می‌مانند.
    - `talk.event` تنها کانال eventهای Talk برای realtime، رونویسی، STT/TTS، managed-room، تلفنی، و آداپتورهای جلسه است.
    - `talk.speak` گفتار را از طریق ارائه‌دهندهٔ گفتار Talk فعال تولید می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهندهٔ فعال، ارائه‌دهندگان fallback، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` inventory قابل‌مشاهدهٔ ارائه‌دهندگان TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهندهٔ ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌بارهٔ متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="Secretها، پیکربندی، به‌روزرسانی، و wizard">
    - `secrets.reload` SecretRefهای فعال را دوباره resolve می‌کند و فقط در صورت موفقیت کامل، state secret زمان اجرا را جایگزین می‌کند.
    - `secrets.resolve` assignmentهای secret هدف‌گیری‌شده به command را برای یک مجموعهٔ command/target مشخص resolve می‌کند.
    - `config.get` snapshot و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را merge می‌کند.
    - `config.apply` payload کامل پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` payload schema زندهٔ پیکربندی را که توسط ابزارهای Control UI و CLI استفاده می‌شود برمی‌گرداند: schema، `uiHints`، نسخه، و metadata تولید، شامل metadata schema مربوط به Plugin + کانال وقتی runtime بتواند آن را load کند. schema شامل metadata فیلد `title` / `description` است که از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط UI مشتق شده، از جمله شاخه‌های composition برای object تودرتو، wildcard، array-item، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد مطابق وجود داشته باشد.
    - `config.schema.lookup` یک payload lookup محدود به path را برای یک path پیکربندی برمی‌گرداند: path نرمال‌شده، یک node کم‌عمق schema، hint مطابق + `hintPath`، و خلاصه‌های child فوری برای drill-down در UI/CLI. nodeهای lookup schema مستندات کاربرپسند و فیلدهای رایج validation (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های numeric/string/array/object، و flagهایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های child، `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، به‌علاوهٔ `hint` / `hintPath` مطابق را expose می‌کنند.
    - `update.run` جریان به‌روزرسانی gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد restart زمان‌بندی می‌کند؛ فراخوان‌هایی که نشست دارند می‌توانند `continuationMessage` را وارد کنند تا startup یک نوبت پیگیری agent را از طریق صف ادامهٔ restart از سر بگیرد. به‌روزرسانی‌های package-manager پس از تعویض package، یک restart به‌روزرسانی بدون تعویق و بدون cooldown را اجبار می‌کنند تا فرایند قدیمی Gateway از tree جایگزین‌شدهٔ `dist` به lazy-loading ادامه ندهد.
    - `update.status` آخرین sentinel ذخیره‌شده در cache برای restart به‌روزرسانی را، شامل نسخهٔ در حال اجرای پس از restart وقتی موجود باشد، برمی‌گرداند.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` wizard راه‌اندازی اولیه را از طریق WS RPC expose می‌کنند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های agent و workspace">
    - `agents.list` entryهای پیکربندی‌شدهٔ agent را، شامل مدل مؤثر و metadata زمان اجرا، برمی‌گرداند.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای agent و سیم‌کشی workspace را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های bootstrap workspace را که برای یک agent expose شده‌اند مدیریت می‌کنند.
    - `artifacts.list`، `artifacts.get`، و `artifacts.download` خلاصه‌های artifact مشتق‌شده از transcript و downloadها را برای scope صریح `sessionKey`، `runId`، یا `taskId` expose می‌کنند. queryهای run و task، نشست مالک را سمت سرور resolve می‌کنند و فقط transcript media با provenance مطابق را برمی‌گردانند؛ sourceهای URL ناامن یا محلی به‌جای fetch سمت سرور، downloadهای پشتیبانی‌نشده برمی‌گردانند.
    - `environments.list` و `environments.status` کشف محیط فقط‌خواندنی Gateway-local و node را برای کلاینت‌های SDK expose می‌کنند.
    - `agent.identity.get` هویت مؤثر assistant را برای یک agent یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک run می‌ماند و در صورت موجود بودن، snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` index نشست فعلی را، شامل metadata هر ردیف `agentRuntime` وقتی backend زمان اجرای agent پیکربندی شده باشد، برمی‌گرداند.
    - `sessions.subscribe` و `sessions.unsubscribe` subscriptionهای event تغییر نشست را برای کلاینت WS فعلی toggle می‌کنند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` subscriptionهای event مربوط به transcript/message را برای یک نشست toggle می‌کنند.
    - `sessions.preview` پیش‌نمایش‌های محدود transcript را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.describe` یک ردیف نشست Gateway را برای یک کلید نشست دقیق برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را resolve یا canonicalize می‌کند.
    - `sessions.create` یک entry نشست جدید ایجاد می‌کند.
    - `sessions.send` یک پیام را به یک نشست موجود می‌فرستد.
    - `sessions.steer` گونهٔ interrupt-and-steer برای یک نشست فعال است.
    - `sessions.abort` کار فعال برای یک نشست را abort می‌کند. فراخوان می‌تواند `key` به‌علاوهٔ `runId` اختیاری را بفرستد، یا برای runهای فعالی که Gateway می‌تواند به نشست resolve کند، فقط `runId` را بفرستد.
    - `sessions.patch` metadata/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌علاوهٔ `agentRuntime` مؤثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداری نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌صورت display-normalized است: tagهای directive inline از متن قابل‌مشاهده حذف می‌شوند، payloadهای XML متن سادهٔ tool-call (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و blockهای tool-call کوتاه‌شده) و tokenهای کنترل مدل ASCII/full-width نشت‌کرده حذف می‌شوند، ردیف‌های assistant با silent-token خالص مانند exact `NO_REPLY` / `no_reply` حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.

  </Accordion>

  <Accordion title="Pairing دستگاه و tokenهای دستگاه">
    - `device.pair.list` دستگاه‌های paired در انتظار و تأییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای device-pairing را مدیریت می‌کنند.
    - `device.token.rotate` یک token دستگاه paired را در محدوده‌های role تأییدشده و scope فراخوان rotate می‌کند.
    - `device.token.revoke` یک token دستگاه paired را در محدوده‌های role تأییدشده و scope فراخوان revoke می‌کند.

  </Accordion>

  <Accordion title="Pairing، invoke، و کارهای pending مربوط به Node">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` pairing node و verification bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` state مربوط به nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب node paired را به‌روزرسانی می‌کند.
    - `node.invoke` یک command را به یک node متصل forward می‌کند.
    - `node.invoke.result` نتیجه را برای یک درخواست invoke برمی‌گرداند.
    - `node.event` eventهای منشأگرفته از node را به gateway برمی‌گرداند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کار pending بادوام را برای nodeهای offline/disconnected مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تأیید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list`، و `exec.approval.resolve` درخواست‌های تأیید اجرای یک‌باره را به‌همراه جست‌وجو/بازپخش تأییدهای در انتظار پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تأیید اجرای در انتظار می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در صورت زمان‌بر شدن، `null`).
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای سیاست تأیید اجرای gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تأیید اجرای محلی node را از طریق فرمان‌های relay مربوط به node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision`، و `plugin.approval.resolve` جریان‌های تأیید تعریف‌شده توسط plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills، و ابزارها">
    - اتوماسیون: `wake` تزریق متن بیدارباش فوری یا heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کارهای زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رویداد رایج

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و سایر رویدادهای چت
  مخصوص transcript.
- `session.message` و `session.tool`: به‌روزرسانی‌های transcript/event-stream برای یک
  جلسه مشترک‌شده.
- `sessions.changed`: نمایه جلسه یا metadata تغییر کرده است.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / زنده‌بودن.
- `health`: به‌روزرسانی snapshot سلامت gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد heartbeat.
- `cron`: رویداد تغییر اجرای/job مربوط به cron.
- `shutdown`: اعلان خاموش‌شدن gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه عمر جفت‌سازی node.
- `node.invoke.request`: پخش درخواست invoke مربوط به node.
- `device.pair.requested` / `device.pair.resolved`: چرخه عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی trigger واژه بیدارباش تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه عمر تأیید اجرا.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه عمر تأیید plugin.

### روش‌های کمکی Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی فایل‌های اجرایی skill را
  برای بررسی‌های auto-allow دریافت کنند.

### روش‌های کمکی اپراتور

- اپراتورها می‌توانند `commands.list` (`operator.read`) را فراخوانی کنند تا موجودی فرمان runtime
  برای یک agent را دریافت کنند.
  - `agentId` اختیاری است؛ برای خواندن workspace پیش‌فرض agent آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both`، در صورت وجود، نام‌های native آگاه از provider را برمی‌گردانند
  - `textAliases` نام‌های مستعار slash دقیق مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` وقتی وجود داشته باشد، نام فرمان native آگاه از provider را حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری native به‌علاوه دسترس‌پذیری فرمان native مربوط به plugin اثر می‌گذارد.
  - `includeArgs=false` metadata سریال‌سازی‌شده آرگومان را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند `tools.catalog` (`operator.read`) را فراخوانی کنند تا کاتالوگ ابزار runtime برای یک
  agent را دریافت کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و metadata منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک plugin وقتی `source="plugin"` باشد
  - `optional`: آیا ابزار plugin اختیاری است یا نه
- اپراتورها می‌توانند `tools.effective` (`operator.read`) را فراخوانی کنند تا موجودی ابزار runtime-effective
  برای یک جلسه را دریافت کنند.
  - `sessionKey` الزامی است.
  - gateway به‌جای پذیرش auth یا context تحویلِ ارائه‌شده توسط caller،
    context runtime مورد اعتماد را از جلسه در سمت server استخراج می‌کند.
  - پاسخ در محدوده جلسه است و آنچه گفت‌وگوی فعال همین حالا می‌تواند استفاده کند را بازتاب می‌دهد،
    شامل ابزارهای core، plugin، و channel.
- اپراتورها می‌توانند `tools.invoke` (`operator.write`) را فراخوانی کنند تا یک ابزار در دسترس را از طریق
  همان مسیر سیاست gateway مانند `/tools/invoke` فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm`، و
    `idempotencyKey` اختیاری هستند.
  - اگر هم `sessionKey` و هم `agentId` وجود داشته باشند، agent جلسه resolve‌شده باید با
    `agentId` مطابقت داشته باشد.
  - پاسخ یک envelope رو به SDK با فیلدهای `ok`، `toolName`، `output` اختیاری، و
    `error` تایپ‌شده است. رد شدن به‌دلیل تأیید یا سیاست، به‌جای دور زدن pipeline سیاست ابزار gateway،
    مقدار `ok:false` را در payload برمی‌گرداند.
- اپراتورها می‌توانند `skills.status` (`operator.read`) را فراخوانی کنند تا موجودی skill قابل مشاهده
  برای یک agent را دریافت کنند.
  - `agentId` اختیاری است؛ برای خواندن workspace پیش‌فرض agent آن را حذف کنید.
  - پاسخ شامل eligibility، نیازمندی‌های مفقود، بررسی‌های config، و
    گزینه‌های نصب پاک‌سازی‌شده بدون افشای مقدارهای خام secret است.
- اپراتورها می‌توانند `skills.search` و `skills.detail` (`operator.read`) را برای
  metadata کشف ClawHub فراخوانی کنند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک
    پوشه skill را در دایرکتوری `skills/` workspace پیش‌فرض agent نصب می‌کند.
  - حالت installer مربوط به Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    یک action اعلام‌شده `metadata.openclaw.install` را روی host مربوط به gateway اجرا می‌کند.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug ردیابی‌شده یا همه نصب‌های ردیابی‌شده ClawHub را در
    workspace پیش‌فرض agent به‌روزرسانی می‌کند.
  - حالت Config مقدارهای `skills.entries.<skillKey>` مانند `enabled`،
    `apiKey`، و `env` را patch می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` را می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار runtime فعلی. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است؛ در غیر این صورت پاسخ، کاتالوگ کامل Gateway است.
- `"configured"`: رفتار به‌اندازه picker. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد. در غیر این صورت پاسخ از مدخل‌های صریح `models.providers.*.models` استفاده می‌کند، و فقط وقتی هیچ ردیف model پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل fallback می‌کند.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این برای diagnostics و UIهای کشف استفاده کنید، نه pickerهای عادی model.

## تأییدهای اجرا

- وقتی یک درخواست exec به تأیید نیاز داشته باشد، gateway رویداد `exec.approval.requested` را پخش می‌کند.
- clientهای اپراتور با فراخوانی `exec.approval.resolve` resolve می‌کنند (به scope `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/metadata جلسه canonical). درخواست‌های فاقد `systemRunPlan` رد می‌شوند.
- پس از تأیید، فراخوانی‌های forward‌شده `node.invoke system.run` همان
  `systemRunPlan` canonical را به‌عنوان context معتبر command/cwd/session دوباره استفاده می‌کنند.
- اگر یک caller بین prepare و forward نهایی `system.run` تأییدشده، `command`، `rawCommand`، `cwd`، `agentId`، یا
  `sessionKey` را تغییر دهد،
  gateway به‌جای اعتماد به payload تغییریافته، اجرا را رد می‌کند.

## fallback تحویل agent

- درخواست‌های `agent` می‌توانند `deliver=true` را شامل شوند تا تحویل outbound درخواست شود.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل resolveنشده یا فقط داخلی `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی قابل resolve نباشد، fallback به اجرای فقط-جلسه را مجاز می‌کند (برای مثال جلسه‌های internal/webchat یا configهای چند-channel مبهم).

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/version.ts` قرار دارد.
- clientها `minProtocol` + `maxProtocol` را می‌فرستند؛ server ناسازگاری‌ها را رد می‌کند.
- Schemaها + modelها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های client

client مرجع در `src/gateway/client.ts` از این defaultها استفاده می‌کند. مقدارها در
protocol v4 پایدار هستند و baseline مورد انتظار برای clientهای شخص ثالث‌اند.

| ثابت                                      | پیش‌فرض                                             | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| زمان‌بر شدن درخواست (برای هر RPC)          | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| زمان‌بر شدن Preauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env می‌تواند بودجه server/client جفت‌شده را افزایش دهد) |
| backoff اولیه reconnect                   | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه backoff مربوط به reconnect         | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp تلاش دوباره سریع پس از بستن device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت force-stop پیش از `terminate()`       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| زمان‌بر شدن پیش‌فرض `stopAndWait()`        | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصله پیش‌فرض tick (پیش از `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بسته‌شدن در tick-timeout                  | code `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

server مقدارهای مؤثر `policy.tickIntervalMs`، `policy.maxPayload`،
و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ clientها باید به‌جای defaultهای پیش از handshake،
به آن مقدارها پایبند باشند.

## Auth

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت، مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا
  `gateway.auth.mode: "trusted-proxy"` غیر local loopback، بررسی احراز هویت اتصال را به‌جای
  `connect.params.auth.*` از سرآیندهای درخواست برآورده می‌کنند.
- `gateway.auth.mode: "none"` برای ورودی خصوصی، احراز هویت اتصال با راز مشترک را
  کاملاً رد می‌کند؛ این حالت را روی ورودی عمومی/نامطمئن در معرض دسترس قرار ندهید.
- پس از جفت‌سازی، Gateway یک **توکن دستگاه** محدود به نقش اتصال
  + دامنه‌ها صادر می‌کند. این مقدار در `hello-ok.auth.deviceToken` برگردانده می‌شود و باید
  برای اتصال‌های آینده توسط کلاینت پایدار شود.
- کلاینت‌ها باید پس از هر اتصال موفق، `hello-ok.auth.deviceToken` اصلی را پایدار کنند.
- اتصال دوباره با آن توکن دستگاه **ذخیره‌شده** باید مجموعه دامنه تأییدشده ذخیره‌شده
  برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت
  را که قبلاً اعطا شده حفظ می‌کند و از فروکاهش بی‌صدای اتصال‌های مجدد به یک
  دامنه ضمنی محدودتر فقط-مدیر جلوگیری می‌کند.
- مونتاژ احراز هویت اتصال در سمت کلاینت (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و همیشه هنگام تنظیم‌شدن ارسال می‌شود.
  - `auth.token` به‌ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس یک `deviceToken` صریح، و بعد یک توکن ذخیره‌شده به‌ازای دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط زمانی فرستاده می‌شود که هیچ‌کدام از موارد بالا یک
    `auth.token` را تعیین نکرده باشند. توکن مشترک یا هر توکن دستگاه تعیین‌شده آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش دوباره یک‌باره
    `AUTH_TOKEN_MISMATCH` فقط به **نقطه‌های پایانی مورد اعتماد** محدود است —
    loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی
    بدون پین‌کردن واجد شرایط نیست.
- ورودی‌های اضافی `hello-ok.auth.deviceTokens` توکن‌های تحویل بوت‌استرپ هستند.
  آن‌ها را فقط وقتی پایدار کنید که اتصال از احراز هویت بوت‌استرپ روی یک انتقال مورد اعتماد
  مانند `wss://` یا جفت‌سازی loopback/محلی استفاده کرده باشد.
- اگر یک کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، آن
  مجموعه دامنه درخواست‌شده توسط فراخواننده مرجع باقی می‌ماند؛ دامنه‌های کش‌شده فقط
  وقتی دوباره استفاده می‌شوند که کلاینت در حال استفاده دوباره از توکن ذخیره‌شده به‌ازای دستگاه باشد.
- توکن‌های دستگاه را می‌توان از طریق `device.token.rotate` و
  `device.token.revoke` چرخاند/باطل کرد (به دامنه `operator.pairing` نیاز دارد).
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. این دستور توکن حامل جایگزین را
  فقط برای فراخوانی‌های همان دستگاه که از قبل با همان توکن دستگاه احراز هویت شده‌اند
  بازتاب می‌دهد، تا کلاینت‌های فقط-توکن بتوانند جایگزین خود را پیش از
  اتصال دوباره پایدار کنند. چرخش‌های مشترک/مدیر توکن حامل را بازتاب نمی‌دهند.
- صدور، چرخش، و ابطال توکن به مجموعه نقش تأییدشده‌ای محدود می‌ماند که
  در ورودی جفت‌سازی همان دستگاه ثبت شده است؛ جهش توکن نمی‌تواند نقش دستگاهی را
  گسترش دهد یا هدف بگیرد که تأیید جفت‌سازی هرگز اعطا نکرده است.
- برای نشست‌های توکن دستگاه جفت‌شده، مدیریت دستگاه خود-محدود است مگر اینکه
  فراخواننده `operator.admin` را نیز داشته باشد: فراخواننده‌های غیرمدیر فقط می‌توانند ورودی دستگاه **خودشان** را حذف/باطل/چرخش کنند.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه دامنه توکن عملگر هدف را
  در برابر دامنه‌های نشست فعلی فراخواننده بررسی می‌کنند. فراخواننده‌های غیرمدیر
  نمی‌توانند توکن عملگر گسترده‌تری از آنچه اکنون دارند را بچرخانند یا باطل کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (بولی)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های مورد اعتماد می‌توانند یک تلاش دوباره محدود با توکن کش‌شده به‌ازای دستگاه انجام دهند.
  - اگر آن تلاش دوباره شکست بخورد، کلاینت‌ها باید حلقه‌های اتصال مجدد خودکار را متوقف کنند و راهنمایی اقدام عملگر را نمایش دهند.

## هویت دستگاه + جفت‌سازی

- Nodeها باید یک هویت دستگاه پایدار (`device.id`) مشتق‌شده از
  اثرانگشت جفت‌کلید داشته باشند.
- Gatewayها توکن‌ها را به‌ازای دستگاه + نقش صادر می‌کنند.
- تأییدهای جفت‌سازی برای شناسه‌های دستگاه جدید لازم هستند، مگر اینکه تأیید خودکار محلی
  فعال شده باشد.
- تأیید خودکار جفت‌سازی حول اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر خوداتصالی محدود محلیِ بک‌اند/کانتینر برای
  جریان‌های کمکی راز مشترک مورد اعتماد دارد.
- اتصال‌های tailnet یا LAN روی همان میزبان همچنان برای جفت‌سازی دوردست تلقی می‌شوند و
  به تأیید نیاز دارند.
- کلاینت‌های WS معمولاً هنگام `connect` هویت `device` را شامل می‌کنند (عملگر +
  Node). تنها استثناهای عملگر بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط-میزبان‌محلی.
  - احراز هویت موفق واسط کاربری کنترل عملگر با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (شکستن اضطراری، کاهش امنیت شدید).
  - RPCهای بک‌اند `gateway-client` از مسیر direct-loopback که با توکن/رمز عبور مشترک
    Gateway احراز هویت شده‌اند.
- همه اتصال‌ها باید nonce مربوط به `connect.challenge` ارائه‌شده توسط سرور را امضا کنند.

### عیب‌یابی مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از چالش استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنا                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده (یا خالی فرستاده) است. |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce کهنه/اشتباه امضا کرده است.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | محموله امضا با محموله v2 مطابقت ندارد.           |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | زمان‌مهر امضاشده خارج از انحراف مجاز است.        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثرانگشت کلید عمومی مطابقت ندارد. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/متعارف‌سازی کلید عمومی شکست خورده است.      |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- محموله v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- محموله امضای ترجیحی `v3` است، که علاوه بر فیلدهای دستگاه/کلاینت/نقش/دامنه‌ها/توکن/nonce،
  `platform` و `deviceFamily` را نیز مقید می‌کند.
- امضاهای قدیمی `v2` همچنان برای سازگاری پذیرفته می‌شوند، اما پین‌کردن
  فراداده دستگاه جفت‌شده همچنان سیاست فرمان را هنگام اتصال دوباره کنترل می‌کند.

## TLS + پین‌کردن

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثرانگشت گواهی Gateway را پین کنند (به پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` مراجعه کنید).

## دامنه

این پروتکل **API کامل Gateway** را در معرض دسترس قرار می‌دهد (وضعیت، کانال‌ها، مدل‌ها، گفت‌وگو،
عامل، نشست‌ها، Nodeها، تأییدها، و غیره). سطح دقیق توسط
طرح‌واره‌های TypeBox در `src/gateway/protocol/schema.ts` تعریف می‌شود.

## مرتبط

- [پروتکل پل](/fa/gateway/bridge-protocol)
- [راهنمای عملیاتی Gateway](/fa/gateway)
