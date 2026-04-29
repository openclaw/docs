---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS برای Gateway
    - اشکال‌زدایی عدم‌تطابق‌های پروتکل یا شکست‌های اتصال
    - تولید مجدد طرح‌واره/مدل‌های پروتکل
summary: 'پروتکل وب‌سوکت Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-04-29T22:54:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51647177913f9ba0bbbe4fffbe4e06ff120d5307d075f49cb99d363ac6ad0f11
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل WS مربوط به Gateway، **صفحه کنترل واحد + انتقال Node** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط وب، اپ macOS، نودهای iOS/Android، نودهای
headless) از طریق WebSocket متصل می‌شوند و در زمان handshake، **نقش** + **دامنه** خود را
اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود می‌شوند. پس از یک handshake موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. با فعال بودن diagnostics،
  فریم‌های ورودی بیش از اندازه و بافرهای خروجی کند، پیش از اینکه Gateway فریم اثرپذیرفته را ببندد یا رها کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
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

در حالی که Gateway هنوز در حال تکمیل sidecarهای راه‌اندازی است، درخواست `connect` می‌تواند
یک خطای قابل تلاش مجدد `UNAVAILABLE` برگرداند که `details.reason` روی
`"startup-sidecars"` تنظیم شده و شامل `retryAfterMs` است. کلاینت‌ها باید این پاسخ را
در چارچوب بودجه کلی اتصال خود دوباره امتحان کنند، به‌جای اینکه آن را به‌عنوان شکست نهایی
handshake نشان دهند.

`server`، `features`، `snapshot` و `policy` همگی طبق schema
(`src/gateway/protocol/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/دامنه‌های مذاکره‌شده را گزارش می‌کند. `canvasHostUrl` اختیاری است.

وقتی هیچ توکن دستگاهی صادر نمی‌شود، `hello-ok.auth` مجوزهای مذاکره‌شده را
بدون فیلدهای توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend هم‌فرایندِ مورد اعتماد (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصال‌های مستقیم loopback، وقتی با توکن/گذرواژه مشترک Gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای داخلی صفحه کنترل رزرو شده است و مانع از آن می‌شود که مبناهای قدیمی جفت‌سازی CLI/دستگاه، کار backend محلی مانند به‌روزرسانی‌های نشست subagent را مسدود کنند. کلاینت‌های راه‌دور،
کلاینت‌های با مبدأ مرورگر، کلاینت‌های Node، و کلاینت‌های صریحِ device-token/device-identity
همچنان از بررسی‌های عادی جفت‌سازی و ارتقای دامنه استفاده می‌کنند.

وقتی یک توکن دستگاه صادر می‌شود، `hello-ok` همچنین شامل موارد زیر است:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

در زمان handoff راه‌اندازی مورد اعتماد، `hello-ok.auth` همچنین می‌تواند شامل ورودی‌های
نقش محدود اضافی در `deviceTokens` باشد:

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

برای جریان راه‌اندازی داخلی node/operator، توکن اصلی Node با
`scopes: []` باقی می‌ماند و هر توکن operator واگذارشده، به فهرست مجاز operator برای راه‌اندازی
(`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`) محدود می‌ماند. بررسی‌های دامنه راه‌اندازی
همچنان با پیشوند نقش انجام می‌شوند: ورودی‌های operator فقط درخواست‌های operator را برآورده می‌کنند، و نقش‌های غیر operator همچنان به دامنه‌هایی زیر پیشوند نقش خودشان نیاز دارند.

### نمونه Node

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

## قاب‌بندی

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

متدهای RPC مربوط به Gateway که توسط Plugin ثبت شده‌اند ممکن است دامنه operator خودشان را درخواست کنند، اما
پیشوندهای admin هسته که رزرو شده‌اند (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` نگاشت می‌شوند.

دامنه متد فقط نخستین gate است. برخی فرمان‌های slash که از طریق
`chat.send` می‌رسند، بررسی‌های سخت‌گیرانه‌تری در سطح فرمان اعمال می‌کنند. برای مثال، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` همچنین افزون بر دامنه پایه متد، یک بررسی دامنه اضافی در زمان تأیید دارد:

- درخواست‌های بدون فرمان: `operator.pairing`
- درخواست‌های دارای فرمان‌های غیر exec برای Node: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare` یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### قابلیت‌ها/فرمان‌ها/مجوزها (Node)

نودها در زمان اتصال، ادعاهای قابلیت خود را اعلام می‌کنند:

- `caps`: دسته‌بندی‌های سطح‌بالای قابلیت.
- `commands`: فهرست مجاز فرمان‌ها برای invoke.
- `permissions`: تغییر‌دهنده‌های دانه‌ریز (برای نمونه `screen.record`، `camera.capture`).

Gateway با این‌ها به‌عنوان **ادعا** برخورد می‌کند و فهرست‌های مجاز سمت سرور را اعمال می‌کند.

## Presence

- `system-presence` ورودی‌هایی را برمی‌گرداند که با هویت دستگاه کلیدگذاری شده‌اند.
- ورودی‌های presence شامل `deviceId`، `roles` و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف نمایش دهند
  حتی وقتی دستگاه هم به‌عنوان **operator** و هم به‌عنوان **node** متصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. نودهای متصل،
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ نودهای جفت‌شده همچنین می‌توانند
  وقتی یک رویداد Node مورد اعتماد metadata جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، presence پس‌زمینه پایدار گزارش کنند.

### رویداد زنده بودن پس‌زمینه Node

نودها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک Node جفت‌شده
در طول یک بیدارسازی پس‌زمینه زنده بوده، بدون اینکه آن را متصل علامت‌گذاری کنند.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual` یا `connect`. رشته‌های trigger ناشناخته پیش از پایدارسازی توسط Gateway به
`background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه Node احرازهویت‌شده
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

Gatewayهای قدیمی‌تر ممکن است همچنان `{ "ok": true }` را برای `node.event` برگردانند؛ کلاینت‌ها باید آن را
یک RPC تأییدشده تلقی کنند، نه پایدارسازی durable presence.

## دامنه‌بندی رویدادهای broadcast

رویدادهای broadcast در WebSocket که از سرور push می‌شوند، با دامنه gate می‌شوند تا نشست‌های محدود به جفت‌سازی یا فقط Node، محتوای نشست را به‌صورت منفعل دریافت نکنند.

- **فریم‌های chat، agent و tool-result** (از جمله رویدادهای stream شده `agent` و نتایج فراخوانی tool) دست‌کم به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را به‌طور کامل رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به نحوه ثبت آن‌ها توسط Plugin، به `operator.write` یا `operator.admin` محدود می‌شوند.
- **رویدادهای status و transport** (`heartbeat`، `presence`، `tick`، چرخه عمر اتصال/قطع اتصال و غیره) بدون محدودیت باقی می‌مانند تا سلامت transport برای هر نشست احرازهویت‌شده قابل مشاهده بماند.
- **خانواده‌های ناشناخته رویداد broadcast** به‌طور پیش‌فرض با دامنه gate می‌شوند (fail-closed)، مگر اینکه یک handler ثبت‌شده به‌صراحت آن‌ها را آزادتر کند.

هر اتصال کلاینت شماره توالی اختصاصی خودش را برای هر کلاینت نگه می‌دارد، بنابراین broadcastها روی همان socket ترتیب یکنواخت را حفظ می‌کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوتی از جریان رویداد را پس از فیلتر دامنه می‌بینند.

## خانواده‌های رایج متدهای RPC

سطح عمومی WS گسترده‌تر از نمونه‌های handshake/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست discovery محافظه‌کارانه است که از `src/gateway/server-methods-list.ts` به‌همراه خروجی‌های متد Plugin/Channel بارگذاری‌شده ساخته می‌شود. آن را discovery قابلیت بدانید، نه یک شمارش کامل
از `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` snapshot سلامت Gateway را که cache شده یا تازه probe شده است برمی‌گرداند.
    - `diagnostics.stability` ضبط‌کننده stability diagnostic محدود اخیر را برمی‌گرداند. این متادیتای عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایت، خوانش‌های حافظه، وضعیت queue/session، نام‌های channel/plugin و شناسه‌های نشست را نگه می‌دارد. متن chat، بدنه‌های Webhook، خروجی‌های tool، بدنه‌های خام request یا response، توکن‌ها، کوکی‌ها یا مقادیر محرمانه را نگه نمی‌دارد. دامنه خواندن operator لازم است.
    - `status` خلاصه Gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های operator دارای دامنه admin گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه Gateway را که توسط جریان‌های relay و جفت‌سازی استفاده می‌شود برمی‌گرداند.
    - `system-presence` snapshot فعلی presence برای دستگاه‌های operator/node متصل را برمی‌گرداند.
    - `system-event` یک رویداد system را اضافه می‌کند و می‌تواند context مربوط به presence را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` آخرین رویداد Heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را روی Gateway روشن یا خاموش می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و مصرف">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخابگر، `{ "view": "configured" }` را پاس دهید (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`)، یا برای کاتالوگ کامل `{ "view": "all" }` را پاس دهید.
    - `usage.status` پنجره‌های مصرف ارائه‌دهنده/خلاصه‌های سهمیه باقی‌مانده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیع‌شده مصرف هزینه را برای یک بازه تاریخی برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding کش‌شده را برای workspace عامل پیش‌فرض فعال برمی‌گرداند. فقط زمانی `{ "probe": true }` یا `{ "deep": true }` را پاس دهید که فراخواننده صراحتا یک ping زنده به ارائه‌دهنده embedding می‌خواهد.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از harness مربوط به REM را برای کلاینت‌های control-plane راه دور برمی‌گرداند. این می‌تواند شامل مسیرهای workspace، قطعه‌های حافظه، markdown زمینه‌دار رندرشده، و نامزدهای deep promotion باشد، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های مصرف به‌ازای هر نشست را برمی‌گرداند.
    - `sessions.usage.timeseries` مصرف timeseries را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های گزارش مصرف را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، در جایی که کانال از خروج پشتیبانی می‌کند، خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/web را برای ارائه‌دهنده کانال وب فعلی که قابلیت QR دارد شروع می‌کند.
    - `web.login.wait` منتظر می‌ماند تا آن جریان ورود QR/web کامل شود و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک push آزمایشی APNs را به یک node ثبت‌شده iOS ارسال می‌کند.
    - `voicewake.get` محرک‌های wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` محرک‌های wake-word را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و گزارش‌ها">
    - `send` RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گیری‌شده بر اساس کانال/حساب/thread خارج از اجراکننده چت است.
    - `logs.tail` انتهای گزارش فایل پیکربندی‌شده Gateway را با کنترل‌های cursor/limit و max-byte برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.config` payload پیکربندی موثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/Control UI تنظیم/پخش می‌کند.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk سنتز می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان fallback، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` فهرست ارائه‌دهندگان قابل مشاهده TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت prefs مربوط به TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و wizard">
    - `secrets.reload` ‏SecretRefهای فعال را دوباره resolve می‌کند و فقط در صورت موفقیت کامل، وضعیت secret زمان اجرا را جابه‌جا می‌کند.
    - `secrets.resolve` انتساب‌های secret هدف‌گیری‌شده به فرمان را برای یک مجموعه فرمان/هدف مشخص resolve می‌کند.
    - `config.get` snapshot و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را ادغام می‌کند.
    - `config.apply` کل payload پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` payload طرح‌واره پیکربندی زنده‌ای را برمی‌گرداند که Control UI و ابزارهای CLI استفاده می‌کنند: schema، `uiHints`، version، و فراداده تولید، شامل فراداده طرح‌واره Plugin + کانال وقتی runtime بتواند آن را بارگذاری کند. این طرح‌واره شامل فراداده فیلد `title` / `description` مشتق‌شده از همان برچسب‌ها و متن راهنمایی است که UI استفاده می‌کند، شامل object تو‌در‌تو، wildcard، array-item، و شاخه‌های ترکیب `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد مطابق وجود داشته باشد.
    - `config.schema.lookup` یک payload جست‌وجوی path-scoped برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک node کم‌عمق schema، hint مطابق + `hintPath`، و خلاصه‌های فرزند فوری برای drill-down در UI/CLI. nodeهای schema جست‌وجو مستندات روبه‌کاربر و فیلدهای اعتبارسنجی رایج (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های numeric/string/array/object، و flagهایی مثل `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، به‌علاوه `hint` / `hintPath` مطابق را آشکار می‌کنند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد، راه‌اندازی مجدد را زمان‌بندی می‌کند.
    - `update.status` تازه‌ترین sentinel کش‌شده راه‌اندازی مجدد به‌روزرسانی، شامل نسخه در حال اجرای پس از راه‌اندازی مجدد در صورت موجود بودن، را برمی‌گرداند.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` ویزارد onboarding را از طریق WS RPC در دسترس می‌گذارند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های عامل و workspace">
    - `agents.list` ورودی‌های عامل پیکربندی‌شده، شامل مدل موثر و فراداده runtime، را برمی‌گرداند.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای عامل و اتصال workspace را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های bootstrap workspace را که برای یک عامل در معرض قرار گرفته‌اند مدیریت می‌کنند.
    - `agent.identity.get` هویت موثر assistant را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` منتظر می‌ماند تا یک اجرا تمام شود و در صورت موجود بودن snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` نمایه نشست فعلی را برمی‌گرداند، شامل فراداده `agentRuntime` به‌ازای هر ردیف وقتی backend runtime عامل پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر نشست را برای کلاینت WS فعلی تغییر می‌دهند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد transcript/message را برای یک نشست تغییر می‌دهند.
    - `sessions.preview` پیش‌نمایش‌های transcript محدود را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را resolve یا canonicalize می‌کند.
    - `sessions.create` یک ورودی نشست جدید ایجاد می‌کند.
    - `sessions.send` یک پیام را به یک نشست موجود ارسال می‌کند.
    - `sessions.steer` گونه interrupt-and-steer برای یک نشست فعال است.
    - `sessions.abort` کار فعال را برای یک نشست لغو می‌کند.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical حل‌شده به‌علاوه `agentRuntime` موثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداری نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌شکل نمایش‌محور نرمال‌سازی شده است: tagهای directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار در قالب متن ساده (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های فراخوانی ابزار truncate‌شده) و tokenهای کنترلی مدل ASCII/full-width افشاشده حذف می‌شوند، ردیف‌های assistant صرفا silent-token مانند `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.

  </Accordion>

  <Accordion title="pairing دستگاه و tokenهای دستگاه">
    - `device.pair.list` دستگاه‌های paired در انتظار و تاییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای device-pairing را مدیریت می‌کنند.
    - `device.token.rotate` یک token دستگاه paired را در محدوده‌های نقش تاییدشده و scope فراخواننده آن rotate می‌کند.
    - `device.token.revoke` یک token دستگاه paired را در محدوده‌های نقش تاییدشده و scope فراخواننده آن revoke می‌کند.

  </Accordion>

  <Accordion title="pairing نود، invoke، و کارهای در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` pairing نود و تایید bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت نودهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک نود paired را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک نود متصل forward می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای برخاسته از نود را به Gateway برمی‌گرداند.
    - `node.canvas.capability.refresh` tokenهای scoped canvas-capability را refresh می‌کند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف نود متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کارهای در انتظار پایدار را برای نودهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های approval">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list`، و `exec.approval.resolve` درخواست‌های approval یک‌باره exec به‌علاوه lookup/replay مربوط به approval در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک approval در انتظار exec می‌ماند و تصمیم نهایی (یا `null` در timeout) را برمی‌گرداند.
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای سیاست approval اجرای Gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست approval اجرای local به نود را از طریق فرمان‌های relay نود مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision`، و `plugin.approval.resolve` جریان‌های approval تعریف‌شده توسط plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="خودکارسازی، skills، و ابزارها">
    - خودکارسازی: `wake` یک تزریق متن wake فوری یا در Heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کار زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رویداد رایج

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و دیگر رویدادهای فقط transcript چت.
- `session.message` و `session.tool`: به‌روزرسانی‌های transcript/event-stream برای یک نشست مشترک‌شده.
- `sessions.changed`: نمایه نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / liveness.
- `health`: به‌روزرسانی snapshot سلامت Gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر اجرای cron/job.
- `shutdown`: اعلان خاموشی Gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه عمر pairing نود.
- `node.invoke.request`: پخش درخواست invoke نود.
- `device.pair.requested` / `device.pair.resolved`: چرخه عمر دستگاه paired.
- `voicewake.changed`: پیکربندی محرک wake-word تغییر کرد.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه عمر approval اجرای exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه عمر approval مربوط به plugin.

### متدهای کمک‌کننده نود

- نودها ممکن است `skills.bins` را فراخوانی کنند تا فهرست فعلی فایل‌های اجرایی skill را برای بررسی‌های auto-allow دریافت کنند.

### متدهای کمک‌کننده operator

- عملگرها می‌توانند `commands.list` (`operator.read`) را فراخوانی کنند تا فهرست فرمان‌های زمان اجرا را برای یک عامل دریافت کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both` نام‌های بومی آگاه از ارائه‌دهنده را، در صورت وجود، برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` نام فرمان بومی آگاه از ارائه‌دهنده را، وقتی وجود داشته باشد، حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی و همچنین در دسترس بودن فرمان بومی Plugin اثر می‌گذارد.
  - `includeArgs=false` فراداده سریال‌شده آرگومان را از پاسخ حذف می‌کند.
- عملگرها می‌توانند `tools.catalog` (`operator.read`) را فراخوانی کنند تا کاتالوگ ابزار زمان اجرا را برای یک عامل دریافت کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه ابزار Plugin اختیاری است یا نه
- عملگرها می‌توانند `tools.effective` (`operator.read`) را فراخوانی کنند تا فهرست ابزار مؤثر در زمان اجرا را برای یک نشست دریافت کنند.
  - `sessionKey` الزامی است.
  - Gateway زمینه زمان اجرای مورد اعتماد را از نشست در سمت سرور استخراج می‌کند، به‌جای اینکه زمینه احراز هویت یا تحویل ارائه‌شده توسط فراخواننده را بپذیرد.
  - پاسخ محدود به نشست است و آنچه مکالمه فعال اکنون می‌تواند استفاده کند را بازتاب می‌دهد، شامل ابزارهای هسته، Plugin و کانال.
- عملگرها می‌توانند `skills.status` (`operator.read`) را فراخوانی کنند تا فهرست قابل مشاهده Skills را برای یک عامل دریافت کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی، و گزینه‌های نصب پاک‌سازی‌شده بدون افشای مقادیر خام محرمانه است.
- عملگرها می‌توانند `skills.search` و `skills.detail` (`operator.read`) را برای فراداده کشف ClawHub فراخوانی کنند.
- عملگرها می‌توانند `skills.install` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه Skills را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت نصب‌کننده Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` یک کنش اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
- عملگرها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug رهگیری‌شده یا همه نصب‌های رهگیری‌شده ClawHub را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`، `apiKey`، و `env` را وصله می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است؛ در غیر این صورت پاسخ، کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد. در غیر این صورت پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این برای عیب‌یابی و UIهای کشف استفاده کنید، نه انتخاب‌گرهای معمول مدل.

## تأییدهای Exec

- وقتی یک درخواست exec به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های عملگر با فراخوانی `exec.approval.resolve` حل می‌کنند (به محدوده `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده نشست به‌شکل کانونی). درخواست‌های بدون `systemRunPlan` رد می‌شوند.
- پس از تأیید، فراخوانی‌های ارسال‌شده `node.invoke system.run` همان `systemRunPlan` کانونی را به‌عنوان زمینه معتبر فرمان/cwd/نشست دوباره استفاده می‌کنند.
- اگر فراخواننده بین آماده‌سازی و ارسال نهایی `system.run` تأییدشده، `command`، `rawCommand`، `cwd`، `agentId`، یا `sessionKey` را تغییر دهد، Gateway اجرا را رد می‌کند به‌جای اینکه به محموله تغییرکرده اعتماد کند.

## fallback تحویل عامل

- درخواست‌های `agent` می‌توانند `deliver=true` را برای درخواست تحویل خروجی شامل کنند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: مقصدهای تحویل حل‌نشده یا فقط‌داخلی `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی قابل حل نباشد، اجازه fallback به اجرای فقط‌نشست را می‌دهد (برای مثال نشست‌های داخلی/webchat یا پیکربندی‌های چندکاناله مبهم).

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/schema/protocol-schemas.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را می‌فرستند؛ سرور ناهماهنگی‌ها را رد می‌کند.
- طرح‌واره‌ها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در protocol v3 پایدار هستند و خط مبنای مورد انتظار برای کلاینت‌های شخص ثالث‌اند.

| ثابت                                      | پیش‌فرض                                              | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| مهلت درخواست (برای هر RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلت Preauth / connect-challenge          | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| backoff اولیه اتصال مجدد                  | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه backoff اتصال مجدد                 | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp تلاش مجدد سریع پس از بستن device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت force-stop پیش از `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلت پیش‌فرض `stopAndWait()`              | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| بازه tick پیش‌فرض (پیش از `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن در tick-timeout                      | code `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور مقادیر مؤثر `policy.tickIntervalMs`، `policy.maxPayload`، و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، آن مقادیر را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با shared-secret بسته به حالت احراز هویت پیکربندی‌شده از `connect.params.auth.token` یا `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve (`gateway.auth.allowTailscale: true`) یا `gateway.auth.mode: "trusted-proxy"` غیر local loopback، بررسی احراز هویت اتصال را از هدرهای درخواست برآورده می‌کنند، نه از `connect.params.auth.*`.
- `gateway.auth.mode: "none"` برای private-ingress احراز هویت اتصال shared-secret را کاملاً رد می‌کند؛ این حالت را روی ورودی عمومی/غیرقابل‌اعتماد در معرض قرار ندهید.
- پس از pairing، Gateway یک **device token** محدود به نقش اتصال + محدوده‌ها صادر می‌کند. این مقدار در `hello-ok.auth.deviceToken` برگردانده می‌شود و باید توسط کلاینت برای اتصال‌های آینده پایدار شود.
- کلاینت‌ها باید `hello-ok.auth.deviceToken` اصلی را پس از هر اتصال موفق پایدار کنند.
- اتصال مجدد با آن device token **ذخیره‌شده** باید مجموعه محدوده تأییدشده ذخیره‌شده برای همان token را نیز دوباره استفاده کند. این کار دسترسی read/probe/status را که قبلاً اعطا شده بود حفظ می‌کند و مانع می‌شود اتصال‌های مجدد بی‌صدا به یک محدوده ضمنی فقط‌ادمین محدودتر فروبریزند.
- مونتاژ احراز هویت اتصال در سمت کلاینت (`selectConnectAuth` در `src/gateway/client.ts`):
  - `auth.password` مستقل است و وقتی تنظیم شده باشد همیشه ارسال می‌شود.
  - `auth.token` به ترتیب اولویت پر می‌شود: ابتدا shared token صریح، سپس یک `deviceToken` صریح، سپس یک token ذخیره‌شده برای هر دستگاه (کلیدخورده با `deviceId` + `role`).
  - `auth.bootstrapToken` فقط وقتی فرستاده می‌شود که هیچ‌کدام از موارد بالا یک `auth.token` را حل نکرده باشند. یک shared token یا هر device token حل‌شده آن را سرکوب می‌کند.
  - ارتقای خودکار یک device token ذخیره‌شده در تلاش مجدد یک‌باره `AUTH_TOKEN_MISMATCH` فقط برای **نقطه‌های انتهایی مورد اعتماد** مجاز است — loopback، یا `wss://` با `tlsFingerprint` pin‌شده. `wss://` عمومی بدون pinning واجد شرایط نیست.
- ورودی‌های اضافی `hello-ok.auth.deviceTokens`، tokenهای تحویل bootstrap هستند. آن‌ها را فقط وقتی پایدار کنید که اتصال از احراز هویت bootstrap روی یک انتقال مورد اعتماد مانند `wss://` یا pairing از نوع loopback/local استفاده کرده باشد.
- اگر کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، همان مجموعه محدوده درخواست‌شده توسط فراخواننده معتبر باقی می‌ماند؛ محدوده‌های cache‌شده فقط وقتی دوباره استفاده می‌شوند که کلاینت در حال استفاده دوباره از token ذخیره‌شده برای هر دستگاه باشد.
- device tokenها را می‌توان از طریق `device.token.rotate` و `device.token.revoke` چرخاند/لغو کرد (به محدوده `operator.pairing` نیاز دارد).
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. bearer token جایگزین را فقط برای فراخوانی‌های همان دستگاه که از قبل با همان device token احراز هویت شده‌اند echo می‌کند، تا کلاینت‌های فقط‌token بتوانند پیش از اتصال مجدد جایگزین خود را پایدار کنند. چرخش‌های shared/admin bearer token را echo نمی‌کنند.
- صدور، چرخش، و لغو token در مجموعه نقش تأییدشده ثبت‌شده در ورودی pairing همان دستگاه محدود می‌ماند؛ تغییر token نمی‌تواند نقشی را گسترش دهد یا نقشی از دستگاه را هدف بگیرد که تأیید pairing هرگز اعطا نکرده است.
- برای نشست‌های token دستگاه pairing‌شده، مدیریت دستگاه self-scoped است مگر اینکه فراخواننده `operator.admin` هم داشته باشد: فراخواننده‌های غیرادمین فقط می‌توانند ورودی دستگاه **خودشان** را حذف/لغو/بچرخانند.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه محدوده token عملگر هدف را در برابر محدوده‌های نشست فعلی فراخواننده بررسی می‌کنند. فراخواننده‌های غیرادمین نمی‌توانند token عملگری گسترده‌تر از آنچه خودشان در اختیار دارند را بچرخانند یا لغو کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌علاوه راهنمایی‌های بازیابی‌اند:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های مورد اعتماد می‌توانند یک تلاش مجدد محدود با token cache‌شده برای هر دستگاه انجام دهند.
  - اگر آن تلاش مجدد شکست بخورد، کلاینت‌ها باید حلقه‌های اتصال مجدد خودکار را متوقف کنند و راهنمایی اقدام عملگر را نمایش دهند.

## هویت دستگاه + pairing

- Nodes باید یک هویت پایدار دستگاه (`device.id`) داشته باشند که از اثرانگشت
  جفت‌کلید مشتق شده است.
- Gatewayها برای هر دستگاه + نقش، توکن صادر می‌کنند.
- برای شناسه‌های دستگاه جدید، تأیید جفت‌سازی لازم است مگر اینکه تأیید خودکار محلی
  فعال باشد.
- تأیید خودکار جفت‌سازی بر اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر محدود اتصال به خودِ محلیِ backend/container برای
  جریان‌های کمکی قابل‌اعتماد با shared-secret دارد.
- اتصال‌های tailnet یا LAN روی همان میزبان همچنان برای جفت‌سازی remote محسوب می‌شوند و
  به تأیید نیاز دارند.
- کلاینت‌های WS معمولاً هنگام `connect` هویت `device` را شامل می‌کنند (اپراتور +
  node). تنها استثناهای اپراتور بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط روی localhost.
  - احراز هویت موفق Control UI اپراتور با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (اقدام اضطراری، کاهش شدید امنیت).
  - RPCهای بک‌اند `gateway-client` از مسیر direct-loopback که با توکن/گذرواژه مشترک
    gateway احراز هویت شده‌اند.
- همه اتصال‌ها باید nonce مربوط به `connect.challenge` را که سرور ارائه می‌کند امضا کنند.

### تشخیص‌های مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را در `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

خرابی‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنی                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده است (یا خالی فرستاده است). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با یک nonce قدیمی/اشتباه امضا کرده است.     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload امضا با payload نسخه v2 مطابقت ندارد.      |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | زمان امضاشده خارج از انحراف مجاز است.              |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثرانگشت کلید عمومی مطابقت ندارد.  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/canonicalization کلید عمومی ناموفق بوده است.  |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- payload نسخه v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- payload امضای ترجیحی `v3` است که علاوه بر فیلدهای device/client/role/scopes/token/nonce،
  `platform` و `deviceFamily` را نیز bind می‌کند.
- امضاهای قدیمی `v2` برای سازگاری همچنان پذیرفته می‌شوند، اما pinning فراداده
  دستگاه جفت‌شده همچنان policy فرمان را هنگام اتصال دوباره کنترل می‌کند.

## TLS + pinning

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثرانگشت گواهی gateway را pin کنند (به پیکربندی `gateway.tls`
  به‌علاوه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` مراجعه کنید).

## دامنه

این پروتکل **API کامل Gateway** را در دسترس قرار می‌دهد (status، channels، models، chat،
agent، sessions، nodes، approvals، و غیره). سطح دقیق توسط schemaهای TypeBox در
`src/gateway/protocol/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل Bridge](/fa/gateway/bridge-protocol)
- [runbook Gateway](/fa/gateway)
