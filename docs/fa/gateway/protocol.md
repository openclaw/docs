---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS Gateway
    - اشکال‌زدایی عدم‌تطابق‌های پروتکل یا شکست‌های اتصال
    - بازسازی طرح‌واره/مدل‌های پروتکل
summary: 'پروتکل WebSocket Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-05-11T20:34:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل Gateway WS، **صفحهٔ کنترل واحد + انتقال Node** برای
OpenClaw است. همهٔ کلاینت‌ها (CLI، رابط کاربری وب، برنامهٔ macOS، Nodeهای iOS/Android، Nodeهای بدون سر)
از طریق WebSocket متصل می‌شوند و در زمان دست‌دهی، **نقش** + **دامنهٔ** خود را اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود می‌شوند. پس از یک دست‌دهی موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. با فعال بودن عیب‌یابی،
  فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه gateway فریم
  متأثر را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطح‌ها، و کدهای دلیل امن را نگه می‌دارند. آن‌ها بدنهٔ پیام،
  محتوای پیوست، بدنهٔ خام فریم، توکن‌ها، کوکی‌ها، یا مقادیر محرمانه را نگه نمی‌دارند.

## دست‌دهی (connect)

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
    "minProtocol": 3,
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

در حالی که Gateway هنوز در حال کامل کردن sidecarهای راه‌اندازی است، درخواست `connect` می‌تواند
یک خطای قابل تلاش دوبارهٔ `UNAVAILABLE` برگرداند که `details.reason` آن روی
`"startup-sidecars"` و `retryAfterMs` تنظیم شده است. کلاینت‌ها باید آن پاسخ را
در چارچوب بودجهٔ کلی اتصال خود دوباره تلاش کنند، نه اینکه آن را به‌عنوان شکست نهایی
دست‌دهی نمایش دهند.

`server`، `features`، `snapshot`، و `policy` همگی توسط schema
(`src/gateway/protocol/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/دامنه‌های مذاکره‌شده را گزارش می‌کند. `pluginSurfaceUrls` اختیاری است و نام‌های
سطح Plugin، مانند `canvas`، را به URLهای میزبانی‌شدهٔ دارای دامنه نگاشت می‌کند.

URLهای سطح Plugin دارای دامنه ممکن است منقضی شوند. Nodeها می‌توانند
`node.pluginSurface.refresh` را با `{ "surface": "canvas" }` فراخوانی کنند تا یک
ورودی تازه در `pluginSurfaceUrls` دریافت کنند. بازسازی آزمایشی Canvas plugin از مسیر
سازگاری منسوخ‌شدهٔ `canvasHostUrl`، `canvasCapability`، یا
`node.canvas.capability.refresh` پشتیبانی نمی‌کند؛ کلاینت‌های بومی و gatewayهای فعلی
باید از سطح‌های Plugin استفاده کنند.

وقتی هیچ توکن دستگاهی صادر نمی‌شود، `hello-ok.auth` مجوزهای مذاکره‌شده را بدون
فیلدهای توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend مورداعتمادِ همان فرایند (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصال‌های مستقیم loopback، وقتی با توکن/گذرواژهٔ
مشترک gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای داخلی
صفحهٔ کنترل رزرو شده است و baselineهای قدیمی جفت‌سازی CLI/دستگاه را از مسدود کردن
کار backend محلی، مانند به‌روزرسانی‌های نشست subagent، بازمی‌دارد. کلاینت‌های راه‌دور،
کلاینت‌های با خاستگاه مرورگر، کلاینت‌های Node، و کلاینت‌های صریحِ دارای توکن دستگاه/هویت دستگاه
همچنان از بررسی‌های عادی جفت‌سازی و ارتقای دامنه استفاده می‌کنند.

وقتی یک توکن دستگاه صادر می‌شود، `hello-ok` همچنین شامل این موارد است:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

در طول واگذاری bootstrap مورداعتماد، `hello-ok.auth` همچنین ممکن است شامل ورودی‌های
نقش محدودشدهٔ اضافی در `deviceTokens` باشد:

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
`scopes: []` باقی می‌ماند و هر توکن operator واگذارشده به allowlist اپراتور bootstrap
(`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`) محدود می‌ماند. بررسی‌های دامنهٔ bootstrap
همچنان با پیشوند نقش می‌مانند: ورودی‌های operator فقط درخواست‌های operator را برآورده
می‌کنند، و نقش‌های غیر-operator همچنان به دامنه‌هایی زیر پیشوند نقش خود نیاز دارند.

### نمونهٔ Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

برای مدل کامل دامنهٔ operator، بررسی‌های زمان تأیید، و معنای shared-secret،
[دامنه‌های Operator](/fa/gateway/operator-scopes) را ببینید.

### نقش‌ها

- `operator` = کلاینت صفحهٔ کنترل (CLI/UI/خودکارسازی).
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

متدهای RPC gateway ثبت‌شده توسط Plugin ممکن است دامنهٔ operator خودشان را درخواست کنند، اما
پیشوندهای admin هستهٔ رزرو‌شده (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` resolve می‌شوند.

دامنهٔ متد فقط نخستین gate است. برخی دستورهای slash که از طریق
`chat.send` می‌رسند، بررسی‌های سخت‌گیرانه‌تر در سطح دستور را نیز اعمال می‌کنند. برای مثال، نوشتن‌های ماندگار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` همچنین علاوه بر دامنهٔ پایهٔ متد، یک بررسی دامنهٔ اضافی در زمان تأیید دارد:

- درخواست‌های بدون دستور: `operator.pairing`
- درخواست‌هایی با دستورهای Node غیر-exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare`، یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodeها در زمان اتصال ادعاهای قابلیت را اعلام می‌کنند:

- `caps`: دسته‌های قابلیت سطح بالا مانند `camera`، `canvas`، `screen`،
  `location`، `voice`، و `talk`.
- `commands`: allowlist دستور برای invoke.
- `permissions`: toggleهای جزئی (مثلاً `screen.record`، `camera.capture`).

Gateway با این موارد به‌عنوان **ادعا** رفتار می‌کند و allowlistهای سمت سرور را اعمال می‌کند.

## Presence

- `system-presence` ورودی‌هایی با کلید هویت دستگاه برمی‌گرداند.
- ورودی‌های Presence شامل `deviceId`، `roles`، و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف واحد نشان دهند
  حتی وقتی هم به‌عنوان **operator** و هم **node** متصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. Nodeهای متصل
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ Nodeهای جفت‌شده همچنین می‌توانند
  وقتی یک رویداد Node مورداعتماد metadata جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، presence پس‌زمینهٔ پایدار گزارش کنند.

### رویداد زنده بودن پس‌زمینهٔ Node

Nodeها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت کنند که یک Node جفت‌شده
در طول wake پس‌زمینه زنده بوده است، بدون اینکه آن را متصل علامت‌گذاری کنند.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual`، یا `connect`. رشته‌های trigger ناشناخته پیش از persistence
توسط gateway به `background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه Node احرازشده
پایدار است؛ نشست‌های بدون دستگاه یا جفت‌نشده `handled: false` برمی‌گردانند.

gatewayهای موفق یک نتیجهٔ ساختاریافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

gatewayهای قدیمی‌تر ممکن است همچنان `{ "ok": true }` را برای `node.event` برگردانند؛ کلاینت‌ها باید آن را
یک RPC تأییدشده تلقی کنند، نه persistence پایدار presence.

## دامنه‌بندی رویدادهای broadcast

رویدادهای broadcast WebSocket که از سرور push می‌شوند با دامنه gate می‌شوند تا نشست‌های دارای دامنهٔ pairing یا فقط-Node، محتوای نشست را به‌صورت منفعلانه دریافت نکنند.

- **فریم‌های chat، agent، و نتیجهٔ ابزار** (شامل رویدادهای streamشدهٔ `agent` و نتایج فراخوانی ابزار) حداقل به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را کاملاً رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به اینکه Plugin آن‌ها را چگونه ثبت کرده باشد، به `operator.write` یا `operator.admin` محدود می‌شوند.
- **رویدادهای وضعیت و انتقال** (`heartbeat`، `presence`، `tick`، چرخهٔ عمر اتصال/قطع اتصال، و غیره) بدون محدودیت می‌مانند تا سلامت انتقال برای هر نشست احرازشده قابل مشاهده بماند.
- **خانواده‌های ناشناختهٔ رویداد broadcast** به‌صورت پیش‌فرض با دامنه gate می‌شوند (fail-closed)، مگر اینکه یک handler ثبت‌شده صراحتاً آن‌ها را آزادتر کند.

هر اتصال کلاینت شمارهٔ sequence مختص خود را نگه می‌دارد تا broadcastها ترتیب یکنواخت را روی آن socket حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوتِ فیلترشده بر اساس دامنه از جریان رویداد را می‌بینند.

## خانواده‌های رایج متد RPC

سطح عمومی WS گسترده‌تر از نمونه‌های handshake/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست discovery محافظه‌کارانه است
که از `src/gateway/server-methods-list.ts` به‌علاوهٔ exportهای متد Plugin/channel بارگذاری‌شده ساخته می‌شود.
با آن به‌عنوان feature discovery رفتار کنید، نه یک فهرست کامل از
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` snapshot سلامت gateway را که cache شده یا تازه probe شده است برمی‌گرداند.
    - `diagnostics.stability` ضبط‌کنندهٔ stability تشخیصی محدود اخیر را برمی‌گرداند. این مورد metadata عملیاتی مانند نام رویدادها، تعدادها، اندازه‌های بایت، خوانش‌های حافظه، وضعیت queue/session، نام‌های channel/plugin، و شناسه‌های session را نگه می‌دارد. متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، یا مقادیر محرمانه را نگه نمی‌دارد. دامنهٔ خواندن Operator لازم است.
    - `status` خلاصهٔ gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های operator دارای دامنهٔ admin گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه gateway را که توسط جریان‌های relay و pairing استفاده می‌شود برمی‌گرداند.
    - `system-presence` snapshot فعلی presence برای دستگاه‌های operator/node متصل را برمی‌گرداند.
    - `system-event` یک رویداد system اضافه می‌کند و می‌تواند زمینهٔ presence را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` تازه‌ترین رویداد heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش heartbeat را روی gateway روشن/خاموش می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و استفاده">
    - `models.list` فهرست مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخاب‌گر (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را ارسال کنید، یا برای فهرست کامل مقدار `{ "view": "all" }` را ارسال کنید.
    - `usage.status` پنجره‌های استفاده ارائه‌دهنده/خلاصه‌های سهمیه باقی‌مانده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیع‌شده هزینه استفاده را برای یک بازه تاریخی برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding ذخیره‌شده در کش را برای فضای کاری عامل پیش‌فرض فعال برمی‌گرداند. فقط زمانی `{ "probe": true }` یا `{ "deep": true }` را ارسال کنید که فراخواننده صراحتا یک ping زنده به ارائه‌دهنده embedding می‌خواهد.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از ابزار REM را برای کلاینت‌های control-plane راه‌دور برمی‌گرداند. این می‌تواند مسیرهای فضای کاری، قطعه‌های حافظه، markdown زمینه‌مند رندرشده، و نامزدهای ارتقای عمیق را شامل شود، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های استفاده به‌ازای هر نشست را برمی‌گرداند.
    - `sessions.usage.timeseries` استفاده سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های گزارش استفاده را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و راهنماهای ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، در جایی که کانال از خروج پشتیبانی می‌کند، خارج می‌شود.
    - `web.login.start` جریان ورود QR/web را برای ارائه‌دهنده کانال وب فعلی که قابلیت QR دارد آغاز می‌کند.
    - `web.login.wait` منتظر تکمیل همان جریان ورود QR/web می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک اعلان آزمایشی APNs را به یک Node ثبت‌شده iOS می‌فرستد.
    - `voicewake.get` محرک‌های ذخیره‌شده واژه بیدارباش را برمی‌گرداند.
    - `voicewake.set` محرک‌های واژه بیدارباش را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و گزارش‌ها">
    - `send` فراخوانی RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گیری‌شده بر اساس کانال/حساب/رشته در خارج از اجراکننده چت است.
    - `logs.tail` انتهای گزارش فایل پیکربندی‌شده Gateway را همراه با کنترل‌های cursor/limit و حداکثر بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.catalog` فهرست فقط‌خواندنی ارائه‌دهنده Talk را برای گفتار، رونویسی جریانی، و صدای realtime برمی‌گرداند. این شامل شناسه‌های ارائه‌دهنده، برچسب‌ها، وضعیت پیکربندی‌شده، شناسه‌های مدل/صداهای در معرض، حالت‌های کانونی، انتقال‌ها، راهبردهای مغز، و پرچم‌های صوتی/قابلیتی realtime است، بدون اینکه اسرار ارائه‌دهنده را برگرداند یا پیکربندی سراسری را تغییر دهد.
    - `talk.config` بار داده پیکربندی موثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.session.create` یک نشست Talk تحت مالکیت Gateway برای `realtime/gateway-relay`، `transcription/gateway-relay`، یا `stt-tts/managed-room` ایجاد می‌کند. `brain: "direct-tools"` به `operator.admin` نیاز دارد.
    - `talk.session.join` توکن نشست managed-room را اعتبارسنجی می‌کند، رویدادهای `session.ready` یا `session.replaced` را در صورت نیاز منتشر می‌کند، و فراداده اتاق/نشست به‌همراه رویدادهای اخیر Talk را بدون توکن متن ساده یا هش توکن ذخیره‌شده برمی‌گرداند.
    - `talk.session.appendAudio` صدای ورودی PCM با base64 را به نشست‌های realtime relay و رونویسی تحت مالکیت Gateway اضافه می‌کند.
    - `talk.session.startTurn`، `talk.session.endTurn`، و `talk.session.cancelTurn` چرخه عمر نوبت managed-room را با رد نوبت‌های کهنه پیش از پاک شدن وضعیت هدایت می‌کنند.
    - `talk.session.cancelOutput` خروجی صوتی دستیار را متوقف می‌کند، عمدتا برای مداخله کاربر مبتنی بر VAD در نشست‌های Gateway relay.
    - `talk.session.submitToolResult` فراخوانی ابزار ارائه‌دهنده را که توسط یک نشست realtime relay تحت مالکیت Gateway منتشر شده کامل می‌کند. برای خروجی موقت ابزار وقتی نتیجه نهایی بعدا می‌آید، `options: { willContinue: true }` را ارسال کنید، یا وقتی نتیجه ابزار باید فراخوانی ارائه‌دهنده را بدون آغاز پاسخ realtime دیگری از دستیار برآورده کند، `options: { suppressResponse: true }` را ارسال کنید.
    - `talk.session.close` یک نشست relay، رونویسی، یا managed-room تحت مالکیت Gateway را می‌بندد و رویدادهای پایانی Talk را منتشر می‌کند.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/Control UI تنظیم/پخش می‌کند.
    - `talk.client.create` یک نشست ارائه‌دهنده realtime تحت مالکیت کلاینت با استفاده از `webrtc` یا `provider-websocket` ایجاد می‌کند، در حالی که Gateway مالک پیکربندی، اعتبارنامه‌ها، دستورالعمل‌ها، و سیاست ابزار است.
    - `talk.client.toolCall` به انتقال‌های realtime تحت مالکیت کلاینت اجازه می‌دهد فراخوانی‌های ابزار ارائه‌دهنده را به سیاست Gateway فوروارد کنند. اولین ابزار پشتیبانی‌شده `openclaw_agent_consult` است؛ کلاینت‌ها یک شناسه اجرا دریافت می‌کنند و پیش از ارسال نتیجه ابزار ویژه ارائه‌دهنده، منتظر رویدادهای معمول چرخه عمر چت می‌مانند.
    - `talk.event` کانال رویداد واحد Talk برای realtime، رونویسی، STT/TTS، managed-room، تلفن، و آداپتورهای جلسه است.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk تولید می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان fallback، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` فهرست ارائه‌دهندگان قابل‌مشاهده TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و ویزارد">
    - `secrets.reload` SecretRefهای فعال را دوباره resolve می‌کند و وضعیت سری زمان اجرا را فقط در صورت موفقیت کامل جایگزین می‌کند.
    - `secrets.resolve` تخصیص‌های سری هدف‌فرمان را برای یک مجموعه فرمان/هدف مشخص resolve می‌کند.
    - `config.get` snapshot و هش پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک بار داده پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را ادغام می‌کند.
    - `config.apply` کل بار داده پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` بار داده schema زنده پیکربندی را که توسط ابزارهای Control UI و CLI استفاده می‌شود برمی‌گرداند: schema، `uiHints`، نسخه، و فراداده تولید، از جمله فراداده schema مربوط به Plugin + کانال وقتی زمان اجرا بتواند آن را بارگیری کند. schema شامل فراداده فیلدهای `title` / `description` است که از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط UI استخراج شده‌اند، از جمله شاخه‌های ترکیب شیء تودرتو، wildcard، آیتم آرایه، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد منطبق وجود دارد.
    - `config.schema.lookup` یک بار داده lookup محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک گره schema کم‌عمق، hint منطبق + `hintPath`، و خلاصه‌های فرزند بلافصل برای drill-down در UI/CLI. گره‌های schema مربوط به lookup مستندات روبه‌کاربر و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/شیء، و پرچم‌هایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، به‌همراه `hint` / `hintPath` منطبق را آشکار می‌کنند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد یک راه‌اندازی مجدد زمان‌بندی می‌کند؛ فراخواننده‌هایی که نشست دارند می‌توانند `continuationMessage` را شامل کنند تا هنگام شروع، یک نوبت پیگیری عامل از طریق صف ادامه پس از راه‌اندازی مجدد از سر گرفته شود. به‌روزرسانی‌های مدیر بسته پس از جایگزینی بسته، یک راه‌اندازی مجدد به‌روزرسانی غیربه‌تعویق‌افتاده و بدون cooldown را اجباری می‌کنند تا فرایند Gateway قدیمی از یک درخت `dist` جایگزین‌شده به بارگذاری تنبل ادامه ندهد.
    - `update.status` آخرین sentinel ذخیره‌شده در کش مربوط به راه‌اندازی مجدد به‌روزرسانی را برمی‌گرداند، از جمله نسخه در حال اجرا پس از راه‌اندازی مجدد، وقتی در دسترس باشد.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` ویزارد onboarding را از طریق WS RPC در معرض می‌گذارند.

  </Accordion>

  <Accordion title="راهنماهای عامل و فضای کاری">
    - `agents.list` ورودی‌های عامل پیکربندی‌شده را، از جمله مدل موثر و فراداده زمان اجرا، برمی‌گرداند.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای عامل و اتصال فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های فضای کاری bootstrap را که برای یک عامل در معرض قرار گرفته‌اند مدیریت می‌کنند.
    - `tasks.list`، `tasks.get`، و `tasks.cancel` دفتر وظایف Gateway را برای کلاینت‌های SDK و اپراتور در معرض می‌گذارند.
    - `artifacts.list`، `artifacts.get`، و `artifacts.download` خلاصه‌ها و دانلودهای artifact استخراج‌شده از transcript را برای دامنه صریح `sessionKey`، `runId`، یا `taskId` در معرض می‌گذارند. پرس‌وجوهای اجرا و وظیفه، نشست مالک را سمت سرور resolve می‌کنند و فقط رسانه transcript با provenance منطبق را برمی‌گردانند؛ منابع URL ناامن یا محلی به‌جای واکشی سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `environments.list` و `environments.status` کشف فقط‌خواندنی محیط‌های محلی Gateway و Node را برای کلاینت‌های SDK در معرض می‌گذارند.
    - `agent.identity.get` هویت موثر دستیار را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک اجرا می‌ماند و در صورت دسترس بودن، snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` فهرست نشست فعلی را برمی‌گرداند، از جمله فراداده `agentRuntime` به‌ازای هر ردیف وقتی backend زمان اجرای عامل پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر نشست را برای کلاینت WS فعلی تغییر می‌دهند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد transcript/پیام را برای یک نشست تغییر می‌دهند.
    - `sessions.preview` پیش‌نمایش‌های محدود transcript را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.describe` یک ردیف نشست Gateway را برای یک کلید نشست دقیق برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را resolve یا canonicalize می‌کند.
    - `sessions.create` یک ورودی نشست جدید ایجاد می‌کند.
    - `sessions.send` یک پیام را به یک نشست موجود می‌فرستد.
    - `sessions.steer` گونه interrupt-and-steer برای یک نشست فعال است.
    - `sessions.abort` کار فعال را برای یک نشست لغو می‌کند. فراخواننده می‌تواند `key` به‌همراه `runId` اختیاری را ارسال کند، یا برای اجراهای فعالی که Gateway می‌تواند به یک نشست resolve کند، فقط `runId` را ارسال کند.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌همراه `agentRuntime` موثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداری نشست را انجام می‌دهند.
    - `sessions.get` کل ردیف نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌صورت نرمال‌شده برای نمایش است: تگ‌های directive درون‌خطی از متن قابل‌مشاهده حذف می‌شوند، بارهای XML متن ساده فراخوانی ابزار (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شده فراخوانی ابزار) و توکن‌های کنترلی مدل ASCII/تمام‌عرضِ نشت‌کرده حذف می‌شوند، ردیف‌های دستیار با توکن کاملا خاموش مانند `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و توکن‌های دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شده در انتظار و تاییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` یک توکن دستگاه جفت‌شده را در محدوده نقش تاییدشده و دامنه فراخواننده آن چرخش می‌دهد.
    - `device.token.revoke` یک توکن دستگاه جفت‌شده را در محدوده نقش تاییدشده و دامنه فراخواننده آن لغو می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، فراخوانی، و کار در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` جفت‌سازی Node و اعتبارسنجی bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک Node متصل فوروارد می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای منشأگرفته از Node را به Gateway بازمی‌گرداند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کار در انتظار پایدار را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تأیید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list`، و `exec.approval.resolve` درخواست‌های تأیید اجرای یک‌باره به‌همراه جست‌وجو/بازپخش تأییدهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تأیید اجرای در انتظار می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در صورت پایان مهلت، `null`).
    - `exec.approvals.get` و `exec.approvals.set` اسنپ‌شات‌های سیاست تأیید اجرای Gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تأیید اجرای محلی Node را از طریق فرمان‌های relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision`، و `plugin.approval.resolve` جریان‌های تأیید تعریف‌شده توسط plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills، و ابزارها">
    - اتوماسیون: `wake` تزریق متن بیدارباش فوری یا در Heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.get`، `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کارهای زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رویداد رایج

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و سایر رویدادهای چت
  فقط مخصوص رونوشت.
- `session.message` و `session.tool`: به‌روزرسانی‌های رونوشت/جریان رویداد برای یک
  نشست مشترک‌شده.
- `sessions.changed`: نمایه نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های اسنپ‌شات حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / زنده‌بودن.
- `health`: به‌روزرسانی اسنپ‌شات سلامت Gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر اجرای cron/کار.
- `shutdown`: اعلان خاموش‌سازی Gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه عمر جفت‌سازی Node.
- `node.invoke.request`: پخش درخواست invoke در Node.
- `device.pair.requested` / `device.pair.resolved`: چرخه عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی محرک واژه بیدارباش تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه عمر تأیید اجرا.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه عمر تأیید plugin.

### متدهای کمکی Node

- Nodeها می‌توانند برای واکشی فهرست فعلی فایل‌های اجرایی skill
  جهت بررسی‌های auto-allow، `skills.bins` را فراخوانی کنند.

### RPCهای دفتر کل وظایف

کلاینت‌های عملگر می‌توانند رکوردهای وظایف پس‌زمینه Gateway را از طریق
RPCهای دفتر کل وظایف بررسی و لغو کنند. این متدها خلاصه‌های پاک‌سازی‌شده وظایف را برمی‌گردانند، نه وضعیت خام
زمان اجرا را.

- `tasks.list` به `operator.read` نیاز دارد.
  - پارامترها: `status` اختیاری (`"queued"`، `"running"`، `"completed"`،
    `"failed"`، `"cancelled"`، یا `"timed_out"`) یا آرایه‌ای از این وضعیت‌ها،
    `agentId` اختیاری، `sessionKey` اختیاری، `limit` اختیاری از `1` تا
    `500`، و `cursor` رشته‌ای اختیاری.
  - نتیجه: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` به `operator.read` نیاز دارد.
  - پارامترها: `{ "taskId": string }`.
  - نتیجه: `{ "task": TaskSummary }`.
  - شناسه‌های وظیفه ناموجود، قالب خطای not-found Gateway را برمی‌گردانند.
- `tasks.cancel` به `operator.write` نیاز دارد.
  - پارامترها: `{ "taskId": string, "reason"?: string }`.
  - نتیجه:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` گزارش می‌کند که آیا دفتر کل وظیفه منطبقی داشته است یا نه. `cancelled`
    گزارش می‌کند که آیا زمان اجرا لغو را پذیرفته یا ثبت کرده است یا نه.

`TaskSummary` شامل `id`، `status`، و فراداده اختیاری مانند `kind`،
`runtime`، `title`، `agentId`، `sessionKey`، `childSessionKey`، `ownerKey`،
`runId`، `taskId`، `flowId`، `parentTaskId`، `sourceId`، زمان‌مُهرها، پیشرفت،
خلاصه پایانی، و متن خطای پاک‌سازی‌شده است.

### متدهای کمکی عملگر

- عملگرها می‌توانند برای واکشی موجودی فرمان‌های زمان اجرا برای یک agent،
  `commands.list` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری agent پیش‌فرض، آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both` در صورت موجود بودن، نام‌های native آگاه از provider را
      برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق slash مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` در صورت وجود، نام فرمان native آگاه از provider را حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری native به‌علاوه دسترس‌پذیری فرمان
    plugin native اثر می‌گذارد.
  - `includeArgs=false` فراداده آرگومان سریال‌شده را از پاسخ حذف می‌کند.
- عملگرها می‌توانند برای واکشی کاتالوگ ابزار زمان اجرا برای یک
  agent، `tools.catalog` (`operator.read`) را فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک plugin وقتی `source="plugin"`
  - `optional`: اینکه آیا ابزار plugin اختیاری است یا نه
- عملگرها می‌توانند برای واکشی موجودی ابزار مؤثر در زمان اجرا
  برای یک نشست، `tools.effective` (`operator.read`) را فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا زمینه تحویل ارائه‌شده توسط فراخواننده،
    زمینه زمان اجرای قابل اعتماد را از نشست در سمت سرور استخراج می‌کند.
  - پاسخ محدود به نشست است و نشان می‌دهد گفت‌وگوی فعال همین حالا از چه چیزهایی می‌تواند استفاده کند،
    شامل ابزارهای core، plugin، و channel.
- عملگرها می‌توانند برای فراخوانی یک ابزار در دسترس از طریق
  همان مسیر سیاست Gateway مانند `/tools/invoke`، `tools.invoke` (`operator.write`) را فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm`، و
    `idempotencyKey` اختیاری هستند.
  - اگر هر دو `sessionKey` و `agentId` حاضر باشند، agent نشست resolve‌شده باید با
    `agentId` مطابقت داشته باشد.
  - پاسخ یک envelope رو به SDK با فیلدهای `ok`، `toolName`، `output` اختیاری، و
    `error`های تایپ‌شده است. ردهای تأیید یا سیاست، به‌جای دور زدن
    پایپ‌لاین سیاست ابزار Gateway، در payload مقدار `ok:false` برمی‌گردانند.
- عملگرها می‌توانند برای واکشی موجودی skill قابل مشاهده
  برای یک agent، `skills.status` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری agent پیش‌فرض، آن را حذف کنید.
  - پاسخ شامل واجدشرایط‌بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی، و
    گزینه‌های نصب پاک‌سازی‌شده بدون افشای مقادیر خام secret است.
- عملگرها می‌توانند برای فراداده کشف ClawHub،
  `skills.search` و `skills.detail` (`operator.read`) را فراخوانی کنند.
- عملگرها می‌توانند برای stage کردن یک آرشیو skill خصوصی
  پیش از نصب آن، `skills.upload.begin`، `skills.upload.chunk`، و
  `skills.upload.commit` (`operator.admin`) را فراخوانی کنند. این یک مسیر upload مدیریتی جداگانه برای کلاینت‌های مورد اعتماد است،
  نه جریان عادی نصب skill از ClawHub، و به‌صورت پیش‌فرض غیرفعال است مگر اینکه
  `skills.install.allowUploadedArchives` فعال باشد.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    یک upload وابسته به همان slug و مقدار force ایجاد می‌کند.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` بایت‌ها را در
    offset دقیق decodeشده اضافه می‌کند.
  - `skills.upload.commit({ uploadId, sha256? })` اندازه نهایی و
    SHA-256 را تأیید می‌کند. commit فقط upload را نهایی می‌کند؛ skill را نصب نمی‌کند.
  - آرشیوهای skill uploadشده، آرشیوهای zip حاوی ریشه `SKILL.md` هستند. نام دایرکتوری داخلی
    آرشیو هرگز هدف نصب را انتخاب نمی‌کند.
- عملگرها می‌توانند `skills.install` (`operator.admin`) را در سه حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک
    پوشه skill را در دایرکتوری `skills/` فضای کاری agent پیش‌فرض نصب می‌کند.
  - حالت upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    یک upload commitشده را در دایرکتوری `skills/<slug>`
    فضای کاری agent پیش‌فرض نصب می‌کند. مقدار slug و force باید با درخواست اصلی
    `skills.upload.begin` مطابقت داشته باشد. این حالت رد می‌شود مگر اینکه
    `skills.install.allowUploadedArchives` فعال باشد. این تنظیم بر نصب‌های ClawHub
    اثر نمی‌گذارد.
  - حالت نصب‌کننده Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    یک اقدام اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
- عملگرها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug رهگیری‌شده یا همه نصب‌های رهگیری‌شده ClawHub را در
    فضای کاری agent پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`،
    `apiKey`، و `env` را patch می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر `view` اختیاری می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است، شامل مدل‌های کشف‌شده پویا برای ورودی‌های `provider/*`. در غیر این صورت، پاسخ کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه picker. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد، شامل کشف محدود به provider برای ورودی‌های `provider/*`. بدون allowlist، پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد، به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این برای عیب‌یابی و UIهای کشف استفاده کنید، نه pickerهای عادی مدل.

## تأییدهای اجرا

- وقتی یک درخواست exec به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های عملگر با فراخوانی `exec.approval.resolve` آن را resolve می‌کنند (به scope `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده نشست canonical). درخواست‌های بدون `systemRunPlan` رد می‌شوند.
- پس از تأیید، فراخوانی‌های forwardشده `node.invoke system.run` همان
  `systemRunPlan` canonical را به‌عنوان زمینه معتبر command/cwd/session دوباره استفاده می‌کنند.
- اگر یک فراخواننده `command`، `rawCommand`، `cwd`، `agentId`، یا
  `sessionKey` را بین آماده‌سازی و forward نهایی `system.run` تأییدشده تغییر دهد،
  Gateway به‌جای اعتماد به payload تغییر‌یافته، اجرا را رد می‌کند.

## fallback تحویل agent

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی، `deliver=true` را شامل شوند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل resolveنشده یا فقط داخلی، `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی قابل resolve نباشد، fallback به اجرای فقط نشست را اجازه می‌دهد (برای مثال نشست‌های internal/webchat یا پیکربندی‌های چندکاناله مبهم).
- نتایج نهایی `agent` ممکن است وقتی تحویل درخواست شده باشد،
  `result.deliveryStatus` را شامل شوند و از همان وضعیت‌های `sent`، `suppressed`، `partial_failed`، و `failed`
  استفاده کنند که برای [`openclaw agent --json --deliver`](/fa/cli/agent#json-delivery-status) مستند شده‌اند.

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/version.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را ارسال می‌کنند؛ سرور بازه‌هایی را که
  پروتکل فعلی آن را شامل نشوند رد می‌کند. کلاینت‌های native از کران پایین v3 استفاده می‌کنند تا
  کلاینت‌های افزایشی v4 همچنان بتوانند به gatewayهای v3 برسند.
- اسکیماها + مدل‌ها از تعاریف TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در
protocol v4 پایدارند و baseline مورد انتظار برای کلاینت‌های شخص ثالث هستند.

| ثابت                                      | پیش‌فرض                                             | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| مهلت درخواست (برای هر RPC)                | `30_000` میلی‌ثانیه                                   | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلت Preauth / connect-challenge          | `15_000` میلی‌ثانیه                                   | `src/gateway/handshake-timeouts.ts` (config/env می‌تواند بودجهٔ جفت‌شدهٔ سرور/کلاینت را افزایش دهد) |
| backoff اولیهٔ اتصال مجدد                 | `1_000` میلی‌ثانیه                                    | `src/gateway/client.ts` (`backoffMs`)                                                      |
| حداکثر backoff اتصال مجدد                 | `30_000` میلی‌ثانیه                                   | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| محدودسازی fast-retry پس از بستن device-token | `250` میلی‌ثانیه                                      | `src/gateway/client.ts`                                                                    |
| مهلت force-stop پیش از `terminate()`      | `250` میلی‌ثانیه                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلت پیش‌فرض `stopAndWait()`              | `1_000` میلی‌ثانیه                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصلهٔ tick پیش‌فرض (پیش از `hello-ok`)   | `30_000` میلی‌ثانیه                                   | `src/gateway/client.ts`                                                                    |
| بستن به‌دلیل tick-timeout                 | کد `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 مگابایت)                       | `src/gateway/server-constants.ts`                                                          |

سرور مقادیر مؤثر `policy.tickIntervalMs`، `policy.maxPayload`،
و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، همان مقادیر را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با shared-secret، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا
  `gateway.auth.mode: "trusted-proxy"` غیر local loopback، بررسی احراز هویت connect را از
  headerهای درخواست برآورده می‌کنند، نه از `connect.params.auth.*`.
- حالت private-ingress با `gateway.auth.mode: "none"` احراز هویت connect با shared-secret را
  کاملاً رد می‌کند؛ این حالت را روی ورودی عمومی/نامطمئن در معرض دسترس قرار ندهید.
- پس از pairing، Gateway یک **device token** صادر می‌کند که به role + scopes اتصال
  محدود است. این مقدار در `hello-ok.auth.deviceToken` برگردانده می‌شود و باید
  برای اتصال‌های آینده توسط کلاینت پایدار ذخیره شود.
- کلاینت‌ها باید پس از هر connect موفق، `hello-ok.auth.deviceToken` اصلی را پایدار ذخیره کنند.
- اتصال مجدد با آن device token **ذخیره‌شده** باید مجموعه scope تأییدشدهٔ ذخیره‌شده برای همان token را نیز دوباره استفاده کند. این کار دسترسی read/probe/status را
  که قبلاً اعطا شده حفظ می‌کند و مانع از آن می‌شود که اتصال‌های مجدد بی‌صدا به scope ضمنی محدودترِ فقط admin فروبریزد.
- مونتاژ احراز هویت connect در سمت کلاینت (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و همیشه وقتی تنظیم شده باشد ارسال می‌شود.
  - `auth.token` به ترتیب اولویت پر می‌شود: ابتدا shared token صریح،
    سپس `deviceToken` صریح، سپس token ذخیره‌شدهٔ per-device (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط وقتی فرستاده می‌شود که هیچ‌یک از موارد بالا به
    یک `auth.token` منجر نشده باشد. shared token یا هر device token حل‌شده‌ای آن را سرکوب می‌کند.
  - ارتقای خودکار device token ذخیره‌شده در retry تک‌مرحله‌ای
    `AUTH_TOKEN_MISMATCH` فقط برای **endpointهای مورد اعتماد** مجاز است —
    loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی
    بدون پین‌کردن واجد شرایط نیست.
- ورودی‌های اضافی `hello-ok.auth.deviceTokens`، tokenهای تحویل bootstrap هستند.
  فقط وقتی آن‌ها را پایدار ذخیره کنید که connect از احراز هویت bootstrap روی transport مورد اعتماد
  مانند `wss://` یا pairing از نوع loopback/local استفاده کرده باشد.
- اگر کلاینت یک `deviceToken` صریح یا `scopes` صریح ارائه کند، آن
  مجموعه scope درخواست‌شده توسط فراخواننده همچنان مرجع است؛ scopeهای کش‌شده فقط
  وقتی دوباره استفاده می‌شوند که کلاینت در حال استفادهٔ دوباره از token ذخیره‌شدهٔ per-device باشد.
- device tokenها را می‌توان از طریق `device.token.rotate` و
  `device.token.revoke` چرخاند/لغو کرد (نیازمند scope `operator.pairing`).
- `device.token.rotate` فرادادهٔ چرخش را برمی‌گرداند. token bearer جایگزین را
  فقط برای فراخوانی‌های same-device که از قبل با همان device token احراز هویت شده‌اند بازتاب می‌دهد،
  تا کلاینت‌های token-only بتوانند جایگزین خود را پیش از اتصال مجدد پایدار ذخیره کنند.
  چرخش‌های shared/admin، bearer token را بازتاب نمی‌دهند.
- صدور، چرخش، و لغو token به مجموعه role تأییدشده‌ای محدود می‌ماند
  که در ورودی pairing همان دستگاه ثبت شده است؛ تغییر token نمی‌تواند role دستگاهی را گسترش دهد یا
  هدف بگیرد که تأیید pairing هرگز اعطا نکرده است.
- برای sessionهای token دستگاه paired، مدیریت دستگاه self-scoped است مگر اینکه
  فراخواننده `operator.admin` نیز داشته باشد: فراخوانندگان غیر admin فقط می‌توانند ورودی دستگاه **خودشان** را حذف/لغو/rotate کنند.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه scope token اپراتور هدف
  را در برابر scopeهای session فعلی فراخواننده بررسی می‌کنند. فراخوانندگان غیر admin
  نمی‌توانند token اپراتوری گسترده‌تر از آنچه خودشان دارند rotate یا revoke کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های مورد اعتماد می‌توانند یک retry محدود با token کش‌شدهٔ per-device انجام دهند.
  - اگر آن retry شکست خورد، کلاینت‌ها باید حلقه‌های اتصال مجدد خودکار را متوقف کنند و راهنمای اقدام اپراتور را نمایش دهند.
- `AUTH_SCOPE_MISMATCH` یعنی device token شناسایی شده، اما role/scopes
  درخواست‌شده را پوشش نمی‌دهد. کلاینت‌ها نباید این را به‌عنوان token بد نشان دهند؛
  از اپراتور بخواهید دوباره pair کند یا قرارداد scope محدودتر/گسترده‌تر را تأیید کند.

## هویت دستگاه + pairing

- Nodeها باید یک هویت دستگاه پایدار (`device.id`) داشته باشند که از
  اثرانگشت keypair مشتق شده است.
- Gatewayها token را به‌ازای هر دستگاه + role صادر می‌کنند.
- تأییدهای pairing برای شناسه‌های دستگاه جدید لازم است، مگر اینکه auto-approval محلی
  فعال باشد.
- auto-approval برای pairing حول اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر self-connect محدودِ backend/container-local برای
  جریان‌های کمکی shared-secret مورد اعتماد دارد.
- اتصال‌های same-host tailnet یا LAN همچنان برای pairing به‌عنوان remote در نظر گرفته می‌شوند و
  نیازمند تأیید هستند.
- کلاینت‌های WS معمولاً هویت `device` را هنگام `connect` شامل می‌کنند (operator +
  node). تنها استثناهای اپراتور بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط روی localhost.
  - احراز هویت موفق operator Control UI با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass، کاهش شدید امنیت).
  - RPCهای backend مستقیم از نوع loopback با `gateway-client` که با token/password مشترک
    Gateway احراز هویت شده‌اند.
- همهٔ اتصال‌ها باید nonce مربوط به `connect.challenge` ارائه‌شده توسط سرور را امضا کنند.

### عیب‌یابی مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنی                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده (یا خالی فرستاده است). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce کهنه/اشتباه امضا کرده است.         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload امضا با payload v2 تطابق ندارد.            |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp امضاشده بیرون از skew مجاز است.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثرانگشت public key مطابقت ندارد.   |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/canonicalization مربوط به public key شکست خورده است. |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- payload نسخه v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` ارسال کنید.
- payload امضای ترجیحی `v3` است که افزون بر فیلدهای device/client/role/scopes/token/nonce،
  `platform` و `deviceFamily` را نیز bind می‌کند.
- امضاهای قدیمی `v2` برای سازگاری همچنان پذیرفته می‌شوند، اما pinning فرادادهٔ paired-device
  همچنان سیاست command را در اتصال مجدد کنترل می‌کند.

## TLS + pinning

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثرانگشت گواهی Gateway را pin کنند (به config
  `gateway.tls` به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` مراجعه کنید).

## دامنه

این protocol **API کامل Gateway** را در معرض دسترس قرار می‌دهد (status، channels، models، chat،
agent، sessions، nodes، approvals، و غیره). سطح دقیق توسط schemaهای TypeBox در
`src/gateway/protocol/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل Bridge](/fa/gateway/bridge-protocol)
- [راهنمای عملیاتی Gateway](/fa/gateway)
