---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS Gateway
    - اشکال‌زدایی ناسازگاری‌های پروتکل یا خطاهای اتصال
    - بازتولید اسکیما/مدل‌های پروتکل
summary: 'پروتکل WebSocket ‏Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-05-01T11:47:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8295e4e416250e7381393c0aa6a0016719f96552485cf9d56bb3896c9704c4a9
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل Gateway WS، **صفحه کنترل یکتا + انتقال Node** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط وب، اپ macOS، Nodeهای iOS/Android، Nodeهای
headless) از طریق WebSocket متصل می‌شوند و در زمان handshake، **نقش** + **دامنه** خود را
اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- اولین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود می‌شوند. پس از یک handshake موفق، کلاینت‌ها
  باید محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` را رعایت کنند. وقتی diagnostics فعال باشد،
  فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه gateway فریم تحت‌تاثیر را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطوح و کدهای دلیل امن را نگه می‌دارند. آن‌ها بدنه پیام،
  محتوای پیوست، بدنه خام فریم، توکن‌ها، کوکی‌ها یا مقادیر محرمانه را نگه نمی‌دارند.

## Handshake (connect)

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
    "maxProtocol": 3,
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
    "protocol": 3,
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

در حالی که Gateway هنوز در حال تکمیل sidecarهای شروع‌به‌کار است، درخواست `connect` می‌تواند
یک خطای قابل‌تلاش‌مجدد `UNAVAILABLE` برگرداند که `details.reason` روی
`"startup-sidecars"` و `retryAfterMs` تنظیم شده است. کلاینت‌ها باید این پاسخ را
در محدوده بودجه کلی اتصال خود دوباره تلاش کنند، نه اینکه آن را به‌عنوان شکست نهایی
handshake نمایش دهند.

`server`، `features`، `snapshot` و `policy` همگی طبق schema الزامی هستند
(`src/gateway/protocol/schema/frames.ts`). `auth` نیز الزامی است و
نقش/دامنه‌های مذاکره‌شده را گزارش می‌کند. `canvasHostUrl` اختیاری است.

وقتی هیچ توکن دستگاهی صادر نشده باشد، `hello-ok.auth` مجوزهای مذاکره‌شده را
بدون فیلدهای توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend مورداعتماد در همان فرایند (`client.id: "gateway-client"`,
`client.mode: "backend"`) ممکن است در اتصال‌های loopback مستقیم، وقتی با توکن/رمز مشترک gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای داخلی صفحه کنترل رزرو شده و اجازه نمی‌دهد baselineهای قدیمی جفت‌سازی CLI/دستگاه، کار backend محلی مانند به‌روزرسانی‌های نشست subagent را مسدود کنند. کلاینت‌های راه‌دور،
کلاینت‌های با مبدا مرورگر، کلاینت‌های Node، و کلاینت‌های صریح device-token/device-identity
همچنان از بررسی‌های معمول جفت‌سازی و ارتقای دامنه استفاده می‌کنند.

وقتی یک توکن دستگاه صادر شود، `hello-ok` همچنین شامل موارد زیر است:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

در زمان تحویل bootstrap مورداعتماد، `hello-ok.auth` ممکن است ورودی‌های نقش محدود بیشتری را نیز در `deviceTokens` شامل شود:

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
`scopes: []` باقی می‌ماند و هر توکن operator تحویل‌شده به allowlist اپراتور bootstrap
(`operator.approvals`، `operator.read`,
`operator.talk.secrets`، `operator.write`) محدود می‌ماند. بررسی‌های دامنه bootstrap همچنان
با پیشوند نقش انجام می‌شوند: ورودی‌های operator فقط درخواست‌های operator را برآورده می‌کنند، و نقش‌های غیر operator
هنوز به دامنه‌هایی زیر پیشوند نقش خودشان نیاز دارند.

### مثال Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

### نقش‌ها

- `operator` = کلاینت صفحه کنترل (CLI/UI/automation).
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

متدهای RPC Gateway ثبت‌شده توسط Plugin می‌توانند دامنه operator خودشان را درخواست کنند، اما
پیشوندهای admin هسته رزرو‌شده (`config.*`، `exec.approvals.*`، `wizard.*`,
`update.*`) همیشه به `operator.admin` نگاشت می‌شوند.

دامنه متد فقط اولین gate است. برخی فرمان‌های slash که از طریق
`chat.send` می‌رسند، بررسی‌های سخت‌گیرانه‌تری در سطح فرمان روی آن اعمال می‌کنند. برای مثال، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` همچنین افزون بر دامنه پایه متد، یک بررسی دامنه اضافی در زمان approval دارد:

- درخواست‌های بدون فرمان: `operator.pairing`
- درخواست‌های دارای فرمان‌های Node غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare`، یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (Node)

Nodeها در زمان اتصال، ادعاهای قابلیت را اعلام می‌کنند:

- `caps`: دسته‌های قابلیت سطح بالا.
- `commands`: allowlist فرمان برای invoke.
- `permissions`: toggleهای ریزدانه (مثلاً `screen.record`، `camera.capture`).

Gateway با این موارد به‌عنوان **ادعا** رفتار می‌کند و allowlistهای سمت سرور را اعمال می‌کند.

## Presence

- `system-presence` ورودی‌هایی را برمی‌گرداند که با هویت دستگاه کلیدگذاری شده‌اند.
- ورودی‌های Presence شامل `deviceId`، `roles` و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف نشان دهند
  حتی وقتی آن دستگاه هم به‌عنوان **operator** و هم به‌عنوان **node** متصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. Nodeهای متصل،
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ Nodeهای جفت‌شده همچنین می‌توانند
  presence پس‌زمینه پایدار را زمانی گزارش کنند که یک رویداد Node مورداعتماد، metadata جفت‌سازی آن‌ها را به‌روزرسانی می‌کند.

### رویداد زنده‌بودن پس‌زمینه Node

Nodeها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک Node جفت‌شده
در طول یک بیدارباش پس‌زمینه زنده بوده، بدون اینکه به‌عنوان متصل علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual`، یا `connect`. رشته‌های trigger ناشناخته پیش از ماندگارشدن
توسط gateway به `background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه Node
احراز هویت‌شده پایدار است؛ نشست‌های بدون دستگاه یا جفت‌نشده `handled: false` برمی‌گردانند.

gatewayهای موفق یک نتیجه ساختاریافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

gatewayهای قدیمی‌تر ممکن است همچنان برای `node.event` مقدار `{ "ok": true }` برگردانند؛ کلاینت‌ها باید آن را
به‌عنوان RPC تاییدشده در نظر بگیرند، نه به‌عنوان ماندگاری durable presence.

## دامنه‌بندی رویدادهای broadcast

رویدادهای broadcast WebSocket که از سرور push می‌شوند، scope-gated هستند تا نشست‌های محدود به جفت‌سازی یا فقط Node، محتوای نشست را به‌صورت غیرفعال دریافت نکنند.

- **فریم‌های chat، agent و tool-result** (از جمله رویدادهای stream‌شده `agent` و نتایج فراخوانی ابزار) دست‌کم به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را کاملاً رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به نحوه ثبت آن‌ها توسط Plugin، به `operator.write` یا `operator.admin` محدود می‌شوند.
- **رویدادهای status و transport** (`heartbeat`، `presence`، `tick`، چرخه عمر connect/disconnect و غیره) بدون محدودیت باقی می‌مانند تا سلامت transport برای هر نشست احراز هویت‌شده قابل مشاهده بماند.
- **خانواده‌های ناشناخته رویداد broadcast** به‌صورت پیش‌فرض scope-gated هستند (fail-closed)، مگر اینکه یک handler ثبت‌شده صراحتاً آن‌ها را آزادتر کند.

هر اتصال کلاینت شماره توالی per-client خودش را نگه می‌دارد تا broadcastها ترتیب monotonic را روی همان socket حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های scope-filtered متفاوتی از جریان رویداد را می‌بینند.

## خانواده‌های رایج متدهای RPC

سطح عمومی WS گسترده‌تر از مثال‌های handshake/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست discovery محافظه‌کارانه است که از `src/gateway/server-methods-list.ts` به‌همراه exportهای متد Plugin/channel بارگذاری‌شده ساخته شده است. با آن به‌عنوان feature discovery رفتار کنید، نه شمارش کامل
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` snapshot سلامت gateway ذخیره‌شده در cache یا تازه probe‌شده را برمی‌گرداند.
    - `diagnostics.stability` ضبط‌کننده stability diagnostic اخیر و محدود را برمی‌گرداند. این مورد metadata عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایت، خوانش‌های memory، وضعیت queue/session، نام‌های channel/plugin و شناسه‌های session را نگه می‌دارد. متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام request یا response، توکن‌ها، کوکی‌ها یا مقادیر محرمانه را نگه نمی‌دارد. دامنه read اپراتور الزامی است.
    - `status` خلاصه gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های operator دارای دامنه admin گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه gateway را که توسط جریان‌های relay و pairing استفاده می‌شود برمی‌گرداند.
    - `system-presence` snapshot فعلی presence را برای دستگاه‌های operator/node متصل برمی‌گرداند.
    - `system-event` یک رویداد سیستم را append می‌کند و می‌تواند context حضور را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` آخرین رویداد Heartbeat ماندگارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را روی gateway toggle می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و استفاده">
    - `models.list` فهرست مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخابگر (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را ارسال کنید، یا برای فهرست کامل مقدار `{ "view": "all" }` را ارسال کنید.
    - `usage.status` پنجره‌های استفاده ارائه‌دهنده / خلاصه‌های سهمیه باقی‌مانده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیعی استفاده هزینه را برای یک بازه تاریخی برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظه برداری / جاسازی کش‌شده را برای فضای کاری عامل پیش‌فرض فعال برمی‌گرداند. فقط زمانی `{ "probe": true }` یا `{ "deep": true }` را ارسال کنید که فراخواننده صراحتا یک پینگ زنده ارائه‌دهنده جاسازی می‌خواهد.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از harness REM را برای کلاینت‌های صفحه کنترل از راه دور برمی‌گرداند. این خروجی می‌تواند شامل مسیرهای فضای کاری، قطعه‌های حافظه، Markdown زمینه‌دار رندرشده، و نامزدهای ارتقای عمیق باشد، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های استفاده به‌ازای هر نشست را برمی‌گرداند.
    - `sessions.usage.timeseries` استفاده سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های لاگ استفاده را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص خارج می‌شود، در جایی که کانال از خروج پشتیبانی کند.
    - `web.login.start` یک جریان ورود QR/وب را برای ارائه‌دهنده کانال وب فعلی که قابلیت QR دارد شروع می‌کند.
    - `web.login.wait` منتظر تکمیل همان جریان ورود QR/وب می‌ماند و در صورت موفقیت، کانال را شروع می‌کند.
    - `push.test` یک پوش APNs آزمایشی را به یک Node ثبت‌شده iOS می‌فرستد.
    - `voicewake.get` محرک‌های ذخیره‌شده wake-word را برمی‌گرداند.
    - `voicewake.set` محرک‌های wake-word را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و لاگ‌ها">
    - `send` فراخوانی RPC تحویل خروجی مستقیم برای ارسال‌های هدف‌گذاری‌شده بر اساس کانال/حساب/رشته خارج از اجراکننده چت است.
    - `logs.tail` دنباله لاگ فایل Gateway پیکربندی‌شده را با کنترل‌های مکان‌نما/حد و حداکثر بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.config` payload پیکربندی موثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/Control UI تنظیم/پخش می‌کند.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk سنتز می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان پشتیبان، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` موجودی قابل مشاهده ارائه‌دهندگان TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت تنظیمات ترجیحی TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و ویزارد">
    - `secrets.reload` SecretRefهای فعال را دوباره حل می‌کند و فقط در صورت موفقیت کامل، وضعیت secret زمان اجرا را جایگزین می‌کند.
    - `secrets.resolve` تخصیص‌های secret هدف‌گذاری‌شده برای فرمان را برای یک مجموعه فرمان/هدف مشخص حل می‌کند.
    - `config.get` snapshot و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را ادغام می‌کند.
    - `config.apply` کل payload پیکربندی را اعتبارسنجی و جایگزین می‌کند.
    - `config.schema` payload طرحواره پیکربندی زنده مورد استفاده Control UI و ابزارهای CLI را برمی‌گرداند: schema، `uiHints`، version، و فراداده تولید، شامل فراداده schema مربوط به Plugin + کانال وقتی زمان اجرا بتواند آن را بار کند. این schema شامل فراداده فیلد `title` / `description` است که از همان برچسب‌ها و متن راهنمای مورد استفاده UI مشتق شده‌اند، شامل شاخه‌های ترکیب شیء تو در تو، wildcard، آیتم آرایه، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد منطبق وجود داشته باشد.
    - `config.schema.lookup` یک payload جست‌وجوی محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک گره schema کم‌عمق، hint منطبق + `hintPath`، و خلاصه‌های فرزند بی‌واسطه برای drill-down در UI/CLI. گره‌های schema در lookup مستندات کاربرمحور و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/شیئی، و پرچم‌هایی مثل `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را حفظ می‌کنند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، به‌علاوه `hint` / `hintPath` منطبق را ارائه می‌کنند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد، راه‌اندازی مجدد را زمان‌بندی می‌کند. به‌روزرسانی‌های مدیر بسته پس از تعویض بسته، یک راه‌اندازی مجدد به‌روزرسانی غیرتعویقی و بدون cooldown را اجبار می‌کنند تا فرایند قدیمی Gateway از درخت `dist` جایگزین‌شده، بارگذاری تنبل را ادامه ندهد.
    - `update.status` تازه‌ترین sentinel کش‌شده راه‌اندازی مجدد به‌روزرسانی را برمی‌گرداند، شامل نسخه در حال اجرا پس از راه‌اندازی مجدد، در صورت در دسترس بودن.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` ویزارد onboarding را از طریق WS RPC ارائه می‌کنند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های عامل و فضای کاری">
    - `agents.list` ورودی‌های عامل پیکربندی‌شده را، شامل مدل موثر و فراداده زمان اجرا، برمی‌گرداند.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای عامل و سیم‌کشی فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های فضای کاری bootstrap را که برای یک عامل ارائه شده‌اند مدیریت می‌کنند.
    - `artifacts.list`، `artifacts.get`، و `artifacts.download` خلاصه‌های artifact مشتق‌شده از transcript و دانلودها را برای یک محدوده صریح `sessionKey`، `runId`، یا `taskId` ارائه می‌کنند. کوئری‌های اجرا و کار، نشست مالک را در سمت سرور حل می‌کنند و فقط رسانه‌های transcript با provenance منطبق را برمی‌گردانند؛ منابع URL ناامن یا محلی به‌جای واکشی سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `agent.identity.get` هویت موثر دستیار را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک اجرا می‌ماند و در صورت در دسترس بودن، snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` نمایه نشست فعلی را، شامل فراداده `agentRuntime` در هر ردیف وقتی backend زمان اجرای عامل پیکربندی شده باشد، برمی‌گرداند.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک رویداد تغییر نشست را برای کلاینت WS فعلی تغییر می‌دهند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک رویداد transcript/پیام را برای یک نشست تغییر می‌دهند.
    - `sessions.preview` پیش‌نمایش‌های محدود transcript را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را حل یا canonicalize می‌کند.
    - `sessions.create` یک ورودی نشست جدید ایجاد می‌کند.
    - `sessions.send` یک پیام را به یک نشست موجود می‌فرستد.
    - `sessions.steer` گونه interrupt-and-steer برای یک نشست فعال است.
    - `sessions.abort` کار فعال برای یک نشست را لغو می‌کند. فراخواننده می‌تواند `key` به‌همراه `runId` اختیاری را ارسال کند، یا برای اجراهای فعالی که Gateway می‌تواند به یک نشست حل کند، فقط `runId` را ارسال کند.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical حل‌شده به‌علاوه `agentRuntime` موثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداری نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌صورت نمایشی نرمال‌سازی شده است: تگ‌های directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های فراخوانی ابزار کوتاه‌شده) و توکن‌های کنترل مدل ASCII/تمام‌عرض نشت‌کرده حذف می‌شوند، ردیف‌های دستیار با توکن کاملا خاموش مانند `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholders جایگزین شوند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و توکن‌های دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شده در انتظار و تاییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` توکن یک دستگاه جفت‌شده را در محدوده نقش تاییدشده و scope فراخواننده آن می‌چرخاند.
    - `device.token.revoke` توکن یک دستگاه جفت‌شده را در محدوده نقش تاییدشده و scope فراخواننده آن لغو می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، invoke، و کارهای در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` جفت‌سازی Node و تایید bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک Node متصل بازارسال می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای مبدأگرفته از Node را به Gateway بازمی‌گرداند.
    - `node.canvas.capability.refresh` توکن‌های قابلیت canvas محدود به scope را تازه‌سازی می‌کند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کارهای در انتظار ماندگار را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تایید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list`، و `exec.approval.resolve` درخواست‌های تایید exec یک‌باره به‌علاوه lookup/replay تاییدهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تایید exec در انتظار می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در زمان timeout مقدار `null`).
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای سیاست تایید exec در Gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تایید exec محلی Node را از طریق فرمان‌های relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision`، و `plugin.approval.resolve` جریان‌های تایید تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="خودکارسازی، Skills، و ابزارها">
    - خودکارسازی: `wake` تزریق متن wake فوری یا در Heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کارهای زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رویداد رایج

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و سایر رویدادهای صرفا transcript چت.
- `session.message` و `session.tool`: به‌روزرسانی‌های transcript/جریان رویداد برای یک نشست مشترک‌شده.
- `sessions.changed`: نمایه نشست یا فراداده تغییر کرد.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / زنده‌بودن.
- `health`: به‌روزرسانی snapshot سلامت Gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر اجرا/کار Cron.
- `shutdown`: اعلان خاموشی Gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه عمر جفت‌سازی Node.
- `node.invoke.request`: پخش درخواست invoke در Node.
- `device.pair.requested` / `device.pair.resolved`: چرخه عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی محرک wake-word تغییر کرد.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه عمر تایید exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه عمر تایید Plugin.

### روش‌های کمک‌کننده Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی executableهای skill را برای بررسی‌های auto-allow دریافت کنند.

### روش‌های کمک‌کننده اپراتور

- اپراتورها می‌توانند برای دریافت موجودی فرمان‌های زمان اجرای یک عامل، `commands.list` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both` در صورت وجود، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` در صورت وجود، نام فرمان بومی آگاه از ارائه‌دهنده را حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی به‌علاوهٔ در دسترس بودن فرمان‌های بومی Plugin اثر می‌گذارد.
  - `includeArgs=false` فرادادهٔ سریال‌شدهٔ آرگومان را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند برای دریافت کاتالوگ ابزارهای زمان اجرای یک عامل، `tools.catalog` (`operator.read`) را فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فرادادهٔ منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه آیا ابزار Plugin اختیاری است یا نه
- اپراتورها می‌توانند برای دریافت موجودی ابزارهای مؤثر در زمان اجرا برای یک نشست، `tools.effective` (`operator.read`) را فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا زمینهٔ تحویلِ ارائه‌شده توسط فراخواننده، زمینهٔ زمان اجرای قابل‌اعتماد را سمت سرور از نشست استخراج می‌کند.
  - پاسخ محدود به نشست است و آنچه را که گفت‌وگوی فعال همین حالا می‌تواند استفاده کند بازتاب می‌دهد، از جمله ابزارهای هسته، Plugin و کانال.
- اپراتورها می‌توانند برای فراخوانی یک ابزار موجود از همان مسیر سیاست Gateway مانند `/tools/invoke`، `tools.invoke` (`operator.write`) را فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm` و `idempotencyKey` اختیاری هستند.
  - اگر هر دو `sessionKey` و `agentId` وجود داشته باشند، عامل نشست حل‌شده باید با `agentId` مطابقت داشته باشد.
  - پاسخ یک پوشش رو به SDK با فیلدهای `ok`، `toolName`، `output` اختیاری و `error` تایپ‌شده است. تأیید یا ردهای سیاستی به‌جای دور زدن خط لولهٔ سیاست ابزار Gateway، در payload مقدار `ok:false` را برمی‌گردانند.
- اپراتورها می‌توانند برای دریافت موجودی مهارت قابل‌مشاهده برای یک عامل، `skills.status` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی، و گزینه‌های نصب پاک‌سازی‌شده بدون افشای مقادیر خام محرمانه است.
- اپراتورها می‌توانند برای فرادادهٔ کشف ClawHub، `skills.search` و `skills.detail` (`operator.read`) را فراخوانی کنند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشهٔ مهارت را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت نصب‌کنندهٔ Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` یک اقدام اعلام‌شدهٔ `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug ردیابی‌شده یا همهٔ نصب‌های ClawHub ردیابی‌شده را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیری مانند `enabled`، `apiKey` و `env` را در `skills.entries.<skillKey>` وصله می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است؛ در غیر این صورت پاسخ، کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازهٔ انتخابگر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد. در غیر این صورت پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این برای عیب‌یابی و رابط‌های کشف استفاده کنید، نه انتخابگرهای معمول مدل.

## تأییدهای اجرا

- وقتی یک درخواست اجرا به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` آن را حل می‌کنند (به دامنهٔ `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فرادادهٔ نشست به‌صورت متعارف). درخواست‌های فاقد `systemRunPlan` رد می‌شوند.
- پس از تأیید، فراخوانی‌های ارسال‌شدهٔ `node.invoke system.run` از همان `systemRunPlan` متعارف به‌عنوان زمینهٔ معتبر فرمان/cwd/نشست استفاده می‌کنند.
- اگر فراخواننده بین آماده‌سازی و ارسال نهایی تأییدشدهٔ `system.run`، `command`، `rawCommand`، `cwd`، `agentId` یا `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به payload تغییریافته، اجرا را رد می‌کند.

## پشتیبان تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی، `deliver=true` را شامل شوند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل حل‌نشده یا فقط داخلی، `INVALID_REQUEST` را برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل‌تحویل خارجی قابل حل نباشد، امکان بازگشت به اجرای فقط در نشست را فراهم می‌کند (برای مثال نشست‌های داخلی/webchat یا پیکربندی‌های چندکانالهٔ مبهم).

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/schema/protocol-schemas.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را ارسال می‌کنند؛ سرور ناسازگاری‌ها را رد می‌کند.
- شِماها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در سراسر پروتکل v3 پایدار هستند و مبنای مورد انتظار برای کلاینت‌های شخص ثالث‌اند.

| ثابت                                      | پیش‌فرض                                               | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                         |
| مهلت درخواست (برای هر RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| مهلت پیش‌احراز / چالش اتصال              | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (پیکربندی/env می‌تواند بودجهٔ جفت‌شدهٔ سرور/کلاینت را افزایش دهد) |
| بازگشت اولیهٔ اتصال مجدد                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                     |
| حداکثر بازگشت اتصال مجدد                 | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| محدودسازی تلاش مجدد سریع پس از بستن توکن دستگاه | `250` ms                                              | `src/gateway/client.ts`                                                                   |
| مهلت توقف اجباری پیش از `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| مهلت پیش‌فرض `stopAndWait()`             | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| فاصلهٔ تیک پیش‌فرض (پیش از `hello-ok`)   | `30_000` ms                                           | `src/gateway/client.ts`                                                                   |
| بستن در مهلت تیک                          | کد `4000` وقتی سکوت از `tickIntervalMs * 2` فراتر رود | `src/gateway/client.ts`                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                         |

سرور مقادیر مؤثر `policy.tickIntervalMs`، `policy.maxPayload` و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از دست‌دهی، آن مقادیر را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا
  `gateway.auth.mode: "trusted-proxy"` غیر-loopback، بررسی احراز هویت اتصال را به‌جای `connect.params.auth.*` از
  سرآیندهای درخواست برآورده می‌کنند.
- `gateway.auth.mode: "none"` برای ورودی خصوصی، احراز هویت اتصال با راز مشترک را
  کاملا رد می‌کند؛ این حالت را روی ورودی عمومی/نامطمئن در دسترس قرار ندهید.
- پس از جفت‌سازی، Gateway یک **توکن دستگاه** محدود به نقش اتصال
  + scopeها صادر می‌کند. این توکن در `hello-ok.auth.deviceToken` برگردانده می‌شود و باید برای اتصال‌های آینده توسط مشتری
  پایدارسازی شود.
- مشتری‌ها باید پس از هر اتصال موفق، `hello-ok.auth.deviceToken` اصلی را پایدارسازی کنند.
- اتصال دوباره با آن توکن دستگاه **ذخیره‌شده** باید مجموعه scope تأییدشده ذخیره‌شده برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت
  که پیش‌تر اعطا شده بود را حفظ می‌کند و مانع می‌شود اتصال‌های دوباره بی‌صدا به scope ضمنی محدودتر فقط-مدیر فروبکاهند.
- سرهم‌بندی احراز هویت اتصال در سمت مشتری (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و وقتی تنظیم شده باشد همیشه ارسال می‌شود.
  - `auth.token` به‌ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس یک `deviceToken` صریح، سپس یک توکن ذخیره‌شده به‌ازای هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط وقتی ارسال می‌شود که هیچ‌یک از موارد بالا یک
    `auth.token` را تعیین نکرده باشند. توکن مشترک یا هر توکن دستگاه تعیین‌شده‌ای آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش مجدد یک‌باره
    `AUTH_TOKEN_MISMATCH` فقط به **نقاط پایانی مورد اعتماد** محدود است —
    loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی
    بدون پین‌کردن واجد شرایط نیست.
- ورودی‌های اضافی `hello-ok.auth.deviceTokens` توکن‌های واگذاری bootstrap هستند.
  آن‌ها را فقط وقتی پایدارسازی کنید که اتصال از احراز هویت bootstrap روی یک انتقال مورد اعتماد
  مانند `wss://` یا جفت‌سازی loopback/محلی استفاده کرده باشد.
- اگر مشتری یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، همان
  مجموعه scope درخواست‌شده توسط فراخواننده مرجع باقی می‌ماند؛ scopeهای cacheشده فقط
  وقتی دوباره استفاده می‌شوند که مشتری در حال استفاده دوباره از توکن ذخیره‌شده به‌ازای هر دستگاه باشد.
- توکن‌های دستگاه را می‌توان از طریق `device.token.rotate` و
  `device.token.revoke` چرخاند/ابطال کرد (به scope `operator.pairing` نیاز دارد).
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. توکن bearer جایگزین را فقط برای فراخوانی‌های همان دستگاهی بازتاب می‌دهد که از قبل با
  همان توکن دستگاه احراز هویت شده‌اند، تا مشتری‌های فقط-توکن بتوانند جایگزین خود را پیش از
  اتصال دوباره پایدارسازی کنند. چرخش‌های مشترک/مدیر توکن bearer را بازتاب نمی‌دهند.
- صدور، چرخش و ابطال توکن محدود به مجموعه نقش تأییدشده‌ای می‌ماند که
  در ورودی جفت‌سازی همان دستگاه ثبت شده است؛ جهش توکن نمی‌تواند نقش دستگاهی را گسترش دهد یا
  هدف بگیرد که تأیید جفت‌سازی هرگز اعطا نکرده است.
- برای نشست‌های توکن دستگاه جفت‌شده، مدیریت دستگاه تا وقتی فراخواننده
  `operator.admin` هم نداشته باشد، خود-محدود است: فراخواننده‌های غیرمدیر فقط می‌توانند ورودی دستگاه **خودشان** را حذف/ابطال/بچرخانند.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه scope توکن عملگر هدف
  را در برابر scopeهای نشست فعلی فراخواننده بررسی می‌کنند. فراخواننده‌های غیرمدیر
  نمی‌توانند توکن عملگر گسترده‌تری را نسبت به آنچه خودشان دارند بچرخانند یا ابطال کنند.
- خطاهای احراز هویت شامل `error.details.code` به‌همراه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار مشتری برای `AUTH_TOKEN_MISMATCH`:
  - مشتری‌های مورد اعتماد می‌توانند یک تلاش مجدد محدود با توکن cacheشده به‌ازای هر دستگاه انجام دهند.
  - اگر آن تلاش مجدد شکست بخورد، مشتری‌ها باید حلقه‌های اتصال دوباره خودکار را متوقف کنند و راهنمای اقدام عملگر را نمایش دهند.

## هویت دستگاه + جفت‌سازی

- Nodeها باید یک هویت پایدار دستگاه (`device.id`) مشتق‌شده از
  اثرانگشت جفت‌کلید داشته باشند.
- Gatewayها توکن‌ها را به‌ازای هر دستگاه + نقش صادر می‌کنند.
- تأییدهای جفت‌سازی برای شناسه‌های دستگاه جدید لازم‌اند، مگر اینکه تأیید خودکار محلی
  فعال باشد.
- تأیید خودکار جفت‌سازی بر اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر محدود خود-اتصالی backend/container-local برای
  جریان‌های کمکی راز مشترک مورد اعتماد دارد.
- اتصال‌های tailnet یا LAN روی همان میزبان همچنان برای جفت‌سازی remote تلقی می‌شوند و
  به تأیید نیاز دارند.
- مشتری‌های WS معمولا هنگام `connect` هویت `device` را شامل می‌کنند (عملگر +
  node). تنها استثناهای عملگر بدون دستگاه مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط-localhost.
  - احراز هویت موفق رابط کاربری کنترل عملگر با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (گزینه اضطراری، تنزل شدید امنیتی).
  - RPCهای backend مستقیم-loopback مربوط به `gateway-client` که با توکن/گذرواژه مشترک
    Gateway احراز هویت شده‌اند.
- همه اتصال‌ها باید nonce مربوط به `connect.challenge` ارائه‌شده توسط سرور را امضا کنند.

### تشخیص‌های مهاجرت احراز هویت دستگاه

برای مشتری‌های قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

خرابی‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنا                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | مشتری `device.nonce` را حذف کرده است (یا خالی فرستاده است). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | مشتری با nonce کهنه/اشتباه امضا کرده است.         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload امضا با payload نسخه ۲ مطابقت ندارد.      |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp امضاشده خارج از انحراف مجاز است.        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثرانگشت کلید عمومی مطابقت ندارد. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/متعارف‌سازی کلید عمومی ناموفق بود.           |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- payload نسخه ۲ را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- payload امضای ترجیحی `v3` است که افزون بر فیلدهای دستگاه/مشتری/نقش/scopeها/توکن/nonce،
  `platform` و `deviceFamily` را هم bind می‌کند.
- امضاهای قدیمی `v2` برای سازگاری همچنان پذیرفته می‌شوند، اما پین‌کردن فراداده
  دستگاه جفت‌شده همچنان سیاست فرمان را هنگام اتصال دوباره کنترل می‌کند.

## TLS + پین‌کردن

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- مشتری‌ها می‌توانند به‌صورت اختیاری اثرانگشت گواهی Gateway را پین کنند (پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` را ببینید).

## Scope

این پروتکل **API کامل Gateway** را در دسترس قرار می‌دهد (وضعیت، کانال‌ها، مدل‌ها، گپ،
عامل، نشست‌ها، nodeها، تأییدها، و غیره). سطح دقیق توسط
schemaهای TypeBox در `src/gateway/protocol/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل پل](/fa/gateway/bridge-protocol)
- [runbook Gateway](/fa/gateway)
