---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS مربوط به Gateway
    - اشکال‌زدایی ناسازگاری‌های پروتکل یا خطاهای اتصال
    - تولید مجدد طرحواره/مدل‌های پروتکل
summary: 'پروتکل WebSocket Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-05-06T09:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل WS در Gateway، **صفحهٔ کنترل واحد + ترابرد نود** برای
OpenClaw است. همهٔ کلاینت‌ها (CLI، رابط کاربری وب، برنامهٔ macOS، نودهای iOS/Android، نودهای بدون رابط)
از طریق WebSocket وصل می‌شوند و در زمان دست‌دهی، **نقش** + **دامنهٔ دسترسی** خود را اعلام می‌کنند.

## ترابرد

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود می‌شوند. پس از یک دست‌دهی موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. با فعال بودن عیب‌یابی،
  فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه gateway فریم اثرپذیرفته را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
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

وقتی Gateway هنوز در حال تکمیل sidecarهای راه‌اندازی است، درخواست `connect` می‌تواند
یک خطای قابل‌تلاش‌دوبارهٔ `UNAVAILABLE` برگرداند که `details.reason` روی
`"startup-sidecars"` و `retryAfterMs` تنظیم شده است. کلاینت‌ها باید به‌جای نمایش آن به‌عنوان
شکست نهایی دست‌دهی، آن پاسخ را در محدودهٔ بودجهٔ کلی اتصال خود دوباره امتحان کنند.

`server`، `features`، `snapshot`، و `policy` همگی طبق schema
(`src/gateway/protocol/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/دامنه‌های دسترسی مذاکره‌شده را گزارش می‌کند. `canvasHostUrl` اختیاری است.

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

کلاینت‌های backend قابل‌اعتماد در همان فرایند (`client.id: "gateway-client"`،
`client.mode: "backend"`) ممکن است در اتصال‌های loopback مستقیم، وقتی با توکن/رمز عبور مشترک gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای داخلی صفحهٔ کنترل رزرو شده است و از مسدود شدن کار محلی backend، مانند به‌روزرسانی‌های نشست subagent، به‌دلیل baselineهای قدیمی جفت‌سازی CLI/دستگاه جلوگیری می‌کند. کلاینت‌های ریموت،
کلاینت‌های با مبدأ مرورگر، کلاینت‌های نود، و کلاینت‌های صریح device-token/device-identity
همچنان از بررسی‌های عادی جفت‌سازی و ارتقای دامنهٔ دسترسی استفاده می‌کنند.

وقتی یک توکن دستگاه صادر می‌شود، `hello-ok` همچنین شامل این مورد است:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

در طول تحویل bootstrap قابل‌اعتماد، `hello-ok.auth` همچنین ممکن است ورودی‌های نقش محدود اضافی
در `deviceTokens` داشته باشد:

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

برای جریان bootstrap داخلی نود/operator، توکن اصلی نود روی
`scopes: []` باقی می‌ماند و هر توکن operator واگذارشده به allowlist
operator bootstrap محدود می‌ماند (`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`). بررسی‌های دامنهٔ دسترسی bootstrap
همچنان با پیشوند نقش باقی می‌مانند: ورودی‌های operator فقط درخواست‌های operator را برآورده می‌کنند، و نقش‌های غیر-operator
همچنان به دامنه‌های دسترسی زیر پیشوند نقش خودشان نیاز دارند.

### نمونهٔ نود

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

## نقش‌ها + دامنه‌های دسترسی

برای مدل کامل دامنهٔ دسترسی operator، بررسی‌های زمان تأیید، و معنای secret مشترک،
[دامنه‌های دسترسی operator](/fa/gateway/operator-scopes) را ببینید.

### نقش‌ها

- `operator` = کلاینت صفحهٔ کنترل (CLI/UI/اتوماسیون).
- `node` = میزبان قابلیت (camera/screen/canvas/system.run).

### دامنه‌های دسترسی (operator)

دامنه‌های دسترسی رایج:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` با `includeSecrets: true` به `operator.talk.secrets`
(یا `operator.admin`) نیاز دارد.

متدهای RPC در gateway که توسط Plugin ثبت شده‌اند می‌توانند دامنهٔ دسترسی operator خود را درخواست کنند، اما
پیشوندهای ادمین هستهٔ رزروشده (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` resolve می‌شوند.

دامنهٔ دسترسی متد فقط دروازهٔ اول است. برخی slash commandها که از طریق
`chat.send` می‌رسند، علاوه بر آن بررسی‌های سخت‌گیرانه‌تر در سطح command اعمال می‌کنند. برای مثال، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` نیز علاوه بر دامنهٔ دسترسی پایهٔ متد، یک بررسی دامنهٔ دسترسی اضافی در زمان تأیید دارد:

- درخواست‌های بدون command: `operator.pairing`
- درخواست‌های دارای commandهای نود غیر-exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare`، یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### قابلیت‌ها/commandها/مجوزها (نود)

نودها در زمان اتصال ادعاهای قابلیت را اعلام می‌کنند:

- `caps`: دسته‌های قابلیت سطح‌بالا مانند `camera`، `canvas`، `screen`،
  `location`، `voice`، و `talk`.
- `commands`: allowlist command برای invoke.
- `permissions`: toggles دانه‌ریز (برای مثال `screen.record`، `camera.capture`).

Gateway با این‌ها به‌عنوان **ادعا** رفتار می‌کند و allowlistهای سمت سرور را اعمال می‌کند.

## حضور

- `system-presence` ورودی‌هایی را برمی‌گرداند که بر اساس هویت دستگاه کلیدگذاری شده‌اند.
- ورودی‌های حضور شامل `deviceId`، `roles`، و `scopes` هستند تا رابط‌های کاربری بتوانند برای هر دستگاه یک ردیف نشان دهند
  حتی وقتی هم به‌عنوان **operator** و هم به‌عنوان **node** وصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. نودهای متصل
  زمان اتصال فعلی خود را با دلیل `connect` به‌عنوان `lastSeenAtMs` گزارش می‌کنند؛ نودهای جفت‌شده همچنین می‌توانند
  وقتی یک رویداد نود قابل‌اعتماد metadata جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، حضور پس‌زمینهٔ پایدار گزارش کنند.

### رویداد زنده بودن نود در پس‌زمینه

نودها ممکن است `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت کنند که یک نود جفت‌شده
در طول بیدار شدن پس‌زمینه زنده بوده است، بدون آنکه آن را متصل علامت‌گذاری کنند.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual`، یا `connect`. رشته‌های trigger ناشناخته پیش از ماندگار شدن توسط gateway به
`background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه نود احراز هویت‌شده
پایدار است؛ نشست‌های بدون دستگاه یا جفت‌نشده `handled: false` برمی‌گردانند.

gatewayهای موفق یک نتیجهٔ ساخت‌یافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

gatewayهای قدیمی‌تر ممکن است همچنان برای `node.event` مقدار `{ "ok": true }` برگردانند؛ کلاینت‌ها باید آن را به‌عنوان
یک RPC تأییدشده در نظر بگیرند، نه به‌عنوان ماندگار شدن حضور پایدار.

## دامنه‌بندی رویدادهای broadcast

رویدادهای broadcast در WebSocket که توسط سرور push می‌شوند با دامنهٔ دسترسی محدود می‌شوند تا نشست‌های محدود به جفت‌سازی یا فقط نود، محتوای نشست را به‌صورت منفعل دریافت نکنند.

- **فریم‌های چت، agent، و نتیجهٔ ابزار** (از جمله رویدادهای streamed `agent` و نتایج tool call) دست‌کم به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را به‌طور کامل رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به اینکه Plugin چگونه آن‌ها را ثبت کرده باشد، با `operator.write` یا `operator.admin` محدود می‌شوند.
- **رویدادهای وضعیت و ترابرد** (`heartbeat`، `presence`، `tick`، چرخهٔ عمر connect/disconnect و غیره) بدون محدودیت می‌مانند تا سلامت ترابرد برای هر نشست احراز هویت‌شده قابل مشاهده باشد.
- **خانواده‌های ناشناختهٔ رویداد broadcast** به‌صورت پیش‌فرض با دامنهٔ دسترسی محدود می‌شوند (fail-closed)، مگر آنکه یک handler ثبت‌شده صراحتاً آن‌ها را آزادتر کند.

هر اتصال کلاینت شمارهٔ توالی مخصوص همان کلاینت را نگه می‌دارد تا broadcastها ترتیب یکنواخت را روی آن socket حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوتی از جریان رویداد را پس از فیلتر دامنهٔ دسترسی می‌بینند.

## خانواده‌های رایج متد RPC

سطح عمومی WS گسترده‌تر از نمونه‌های دست‌دهی/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست کشف محافظه‌کارانه است
که از `src/gateway/server-methods-list.ts` به‌علاوهٔ exportهای متد Plugin/channel بارگذاری‌شده ساخته شده است.
با آن به‌عنوان کشف قابلیت رفتار کنید، نه enumeration کامل
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` snapshot سلامت gateway را که cached یا تازه probe شده است برمی‌گرداند.
    - `diagnostics.stability` recorder پایداری عیب‌یابی محدود اخیر را برمی‌گرداند. این metadata عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های byte، خوانش‌های حافظه، وضعیت queue/session، نام‌های channel/plugin، و شناسه‌های session را نگه می‌دارد. متن چت، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام request یا response، توکن‌ها، کوکی‌ها، یا مقادیر secret را نگه نمی‌دارد. دامنهٔ دسترسی خواندن operator لازم است.
    - `status` خلاصهٔ gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های operator دارای دامنهٔ admin درج می‌شوند.
    - `gateway.identity.get` هویت دستگاه gateway را که توسط جریان‌های relay و جفت‌سازی استفاده می‌شود برمی‌گرداند.
    - `system-presence` snapshot حضور فعلی دستگاه‌های operator/node متصل را برمی‌گرداند.
    - `system-event` یک رویداد سیستم را append می‌کند و می‌تواند context حضور را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` آخرین رویداد heartbeat ماندگارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش heartbeat را روی gateway toggle می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و مصرف">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخاب‌گر (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را ارسال کنید، یا برای کاتالوگ کامل مقدار `{ "view": "all" }` را ارسال کنید.
    - `usage.status` خلاصه‌های پنجره‌های مصرف/سهمیه باقی‌مانده ارائه‌دهنده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیع‌شده هزینه مصرف را برای یک بازه تاریخ برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding کش‌شده را برای فضای کاری عامل پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخواننده صریحا یک ping زنده به ارائه‌دهنده embedding می‌خواهد، مقدار `{ "probe": true }` یا `{ "deep": true }` را ارسال کنید.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از harness مربوط به REM را برای کلاینت‌های control-plane راه دور برمی‌گرداند. این می‌تواند شامل مسیرهای فضای کاری، قطعه‌های حافظه، markdown زمینه‌مند رندرشده، و نامزدهای ارتقای عمیق باشد، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های مصرف هر جلسه را برمی‌گرداند.
    - `sessions.usage.timeseries` مصرف سری زمانی را برای یک جلسه برمی‌گرداند.
    - `sessions.usage.logs` مدخل‌های لاگ مصرف را برای یک جلسه برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، در جایی که کانال از خروج پشتیبانی می‌کند، خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/وب را برای ارائه‌دهنده کانال وب فعلی که قابلیت QR دارد آغاز می‌کند.
    - `web.login.wait` منتظر تکمیل آن جریان ورود QR/وب می‌ماند و در صورت موفقیت کانال را راه‌اندازی می‌کند.
    - `push.test` یک push آزمایشی APNs را به یک Node ثبت‌شده iOS می‌فرستد.
    - `voicewake.get` محرک‌های wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` محرک‌های wake-word را به‌روزرسانی می‌کند و تغییر را منتشر می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و لاگ‌ها">
    - `send` RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گذاری‌شده به کانال/حساب/رشته در خارج از اجراکننده چت است.
    - `logs.tail` انتهای لاگ فایل پیکربندی‌شده Gateway را با کنترل‌های مکان‌نما/حد و حداکثر بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.catalog` کاتالوگ فقط‌خواندنی ارائه‌دهنده Talk را برای گفتار، رونویسی جریانی، و صدای بلادرنگ برمی‌گرداند. این شامل شناسه‌های ارائه‌دهنده، برچسب‌ها، وضعیت پیکربندی‌شده، شناسه‌های مدل/صداهای در معرض استفاده، حالت‌های canonical، انتقال‌ها، راهبردهای مغز، و پرچم‌های صدای بلادرنگ/قابلیت است، بدون اینکه اسرار ارائه‌دهنده را برگرداند یا پیکربندی سراسری را تغییر دهد.
    - `talk.config` payload پیکربندی موثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.session.create` یک جلسه Talk متعلق به Gateway را برای `realtime/gateway-relay`، `transcription/gateway-relay`، یا `stt-tts/managed-room` ایجاد می‌کند. `brain: "direct-tools"` به `operator.admin` نیاز دارد.
    - `talk.session.join` توکن جلسه managed-room را اعتبارسنجی می‌کند، در صورت نیاز رویدادهای `session.ready` یا `session.replaced` را منتشر می‌کند، و metadata اتاق/جلسه به‌علاوه رویدادهای اخیر Talk را بدون توکن متن ساده یا hash توکن ذخیره‌شده برمی‌گرداند.
    - `talk.session.appendAudio` صدای ورودی PCM با base64 را به جلسات relay بلادرنگ و رونویسی متعلق به Gateway اضافه می‌کند.
    - `talk.session.startTurn`، `talk.session.endTurn`، و `talk.session.cancelTurn` چرخه عمر نوبت managed-room را با رد نوبت‌های کهنه پیش از پاک شدن وضعیت هدایت می‌کنند.
    - `talk.session.cancelOutput` خروجی صدای دستیار را متوقف می‌کند، عمدتا برای مداخله VAD-gated در جلسات relay مربوط به Gateway.
    - `talk.session.submitToolResult` فراخوانی ابزار ارائه‌دهنده را که توسط یک جلسه relay بلادرنگ متعلق به Gateway منتشر شده کامل می‌کند.
    - `talk.session.close` یک جلسه relay، رونویسی، یا managed-room متعلق به Gateway را می‌بندد و رویدادهای پایانی Talk را منتشر می‌کند.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/Control UI تنظیم/منتشر می‌کند.
    - `talk.client.create` یک جلسه ارائه‌دهنده بلادرنگ متعلق به کلاینت را با استفاده از `webrtc` یا `provider-websocket` ایجاد می‌کند، در حالی که Gateway مالک پیکربندی، اعتبارنامه‌ها، دستورالعمل‌ها، و سیاست ابزار است.
    - `talk.client.toolCall` به انتقال‌های بلادرنگ متعلق به کلاینت اجازه می‌دهد فراخوانی‌های ابزار ارائه‌دهنده را به سیاست Gateway ارسال کنند. نخستین ابزار پشتیبانی‌شده `openclaw_agent_consult` است؛ کلاینت‌ها یک شناسه اجرا دریافت می‌کنند و پیش از ارسال نتیجه ابزار ویژه ارائه‌دهنده، منتظر رویدادهای معمول چرخه عمر چت می‌مانند.
    - `talk.event` تنها کانال رویداد Talk برای آداپتورهای بلادرنگ، رونویسی، STT/TTS، managed-room، تلفنی، و جلسه است.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk سنتز می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان fallback، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` فهرست ارائه‌دهندگان قابل مشاهده TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و ویزارد">
    - `secrets.reload` SecretRefهای فعال را دوباره resolve می‌کند و وضعیت اسرار زمان اجرا را فقط در صورت موفقیت کامل جایگزین می‌کند.
    - `secrets.resolve` انتساب‌های secret هدف‌گذاری‌شده به فرمان را برای یک مجموعه فرمان/هدف مشخص resolve می‌کند.
    - `config.get` snapshot و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را ادغام می‌کند.
    - `config.apply` کل payload پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` payload زنده schema پیکربندی را که توسط ابزارهای Control UI و CLI استفاده می‌شود برمی‌گرداند: schema، `uiHints`، نسخه، و metadata تولید، شامل metadata مربوط به schemaهای Plugin + کانال وقتی runtime بتواند آن را بارگذاری کند. این schema شامل metadata فیلد `title` / `description` مشتق‌شده از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط UI است، شامل شاخه‌های شیء تو در تو، wildcard، آیتم آرایه، و ترکیب `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد مطابق وجود داشته باشد.
    - `config.schema.lookup` یک payload lookup محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک گره schema کم‌عمق، hint مطابق + `hintPath`، و خلاصه‌های فرزند مستقیم برای drill-down در UI/CLI. گره‌های lookup schema مستندات کاربرمحور و فیلدهای اعتبارسنجی رایج (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/شیء، و پرچم‌هایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، به‌علاوه `hint` / `hintPath` مطابق را در معرض استفاده قرار می‌دهند.
    - `update.run` جریان به‌روزرسانی gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد یک راه‌اندازی مجدد زمان‌بندی می‌کند؛ فراخواننده‌های دارای جلسه می‌توانند `continuationMessage` را درج کنند تا راه‌اندازی، یک نوبت پیگیری عامل را از طریق صف ادامه پس از راه‌اندازی مجدد از سر بگیرد. به‌روزرسانی‌های مدیر بسته، پس از جایگزینی بسته، یک راه‌اندازی مجدد به‌روزرسانی بدون تاخیر و بدون cooldown را اجباری می‌کنند تا فرایند قدیمی Gateway از درخت `dist` جایگزین‌شده به lazy-loading ادامه ندهد.
    - `update.status` آخرین sentinel کش‌شده راه‌اندازی مجدد به‌روزرسانی را برمی‌گرداند، شامل نسخه در حال اجرای پس از راه‌اندازی مجدد وقتی در دسترس باشد.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` ویزارد onboarding را از طریق WS RPC در معرض استفاده قرار می‌دهند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های عامل و فضای کاری">
    - `agents.list` مدخل‌های عامل پیکربندی‌شده، شامل مدل موثر و metadata زمان اجرا را برمی‌گرداند.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای عامل و اتصال فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های فضای کاری bootstrap را که برای یک عامل در معرض استفاده قرار گرفته‌اند مدیریت می‌کنند.
    - `artifacts.list`، `artifacts.get`، و `artifacts.download` خلاصه‌ها و دانلودهای artifact مشتق‌شده از transcript را برای یک محدوده صریح `sessionKey`، `runId`، یا `taskId` در معرض استفاده قرار می‌دهند. کوئری‌های اجرا و وظیفه، جلسه مالک را در سمت سرور resolve می‌کنند و فقط رسانه transcript با provenance مطابق را برمی‌گردانند؛ منابع URL ناامن یا محلی، به‌جای fetch سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `environments.list` و `environments.status` کشف فقط‌خواندنی محیط‌های محلی Gateway و Node را برای کلاینت‌های SDK در معرض استفاده قرار می‌دهند.
    - `agent.identity.get` هویت موثر دستیار را برای یک عامل یا جلسه برمی‌گرداند.
    - `agent.wait` منتظر پایان یک اجرا می‌ماند و وقتی در دسترس باشد snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل جلسه">
    - `sessions.list` نمایه جلسه فعلی را برمی‌گرداند، شامل metadata مربوط به `agentRuntime` برای هر ردیف وقتی backend زمان اجرای عامل پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر جلسه را برای کلاینت WS فعلی تغییر می‌دهند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد transcript/پیام را برای یک جلسه تغییر می‌دهند.
    - `sessions.preview` پیش‌نمایش‌های محدود transcript را برای کلیدهای جلسه مشخص برمی‌گرداند.
    - `sessions.describe` یک ردیف جلسه Gateway را برای یک کلید جلسه دقیق برمی‌گرداند.
    - `sessions.resolve` یک هدف جلسه را resolve یا canonicalize می‌کند.
    - `sessions.create` یک مدخل جلسه جدید ایجاد می‌کند.
    - `sessions.send` یک پیام را به یک جلسه موجود می‌فرستد.
    - `sessions.steer` گونه interrupt-and-steer برای یک جلسه فعال است.
    - `sessions.abort` کار فعال را برای یک جلسه abort می‌کند. فراخواننده می‌تواند `key` به‌علاوه `runId` اختیاری را ارسال کند، یا فقط `runId` را برای اجراهای فعالی ارسال کند که Gateway بتواند به یک جلسه resolve کند.
    - `sessions.patch` metadata/overrideهای جلسه را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌علاوه `agentRuntime` موثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداشت جلسه را انجام می‌دهند.
    - `sessions.get` ردیف کامل ذخیره‌شده جلسه را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌شکل نمایش‌نرمال‌شده است: تگ‌های directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شده فراخوانی ابزار) و توکن‌های کنترل مدل ASCII/تمام‌عرض نشت‌کرده حذف می‌شوند، ردیف‌های دستیار که صرفا توکن سکوت هستند مانند `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و ردیف‌های بسیار بزرگ می‌توانند با placeholderها جایگزین شوند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و توکن‌های دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شده در انتظار و تاییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` یک توکن دستگاه جفت‌شده را در محدوده‌های نقش تاییدشده و scope فراخواننده خودش rotate می‌کند.
    - `device.token.revoke` یک توکن دستگاه جفت‌شده را در محدوده‌های نقش تاییدشده و scope فراخواننده خودش revoke می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، invoke، و کار در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` جفت‌سازی Node و اعتبارسنجی bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک Node متصل forward می‌کند.
    - `node.invoke.result` نتیجه را برای یک درخواست invoke برمی‌گرداند.
    - `node.event` رویدادهای منشأگرفته از Node را به gateway برمی‌گرداند.
    - `node.canvas.capability.refresh` توکن‌های canvas-capability محدود به scope را refresh می‌کند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کار پایدار در انتظار را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تأیید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list` و `exec.approval.resolve` درخواست‌های تأیید یک‌باره‌ی exec به‌علاوه‌ی جست‌وجو/بازپخش تأییدهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تأیید exec در انتظار می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در صورت پایان مهلت، `null`).
    - `exec.approvals.get` و `exec.approvals.set` اسنپ‌شات‌های سیاست تأیید exec در Gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تأیید exec محلی Node را از طریق فرمان‌های رله‌ی Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision` و `plugin.approval.resolve` جریان‌های تأیید تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills و ابزارها">
    - اتوماسیون: `wake` یک تزریق متن بیدارباش فوری یا در Heartbeat بعدی زمان‌بندی می‌کند؛ `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کار زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رویداد رایج

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و دیگر رویدادهای چت فقط مخصوص رونوشت.
- `session.message` و `session.tool`: به‌روزرسانی‌های رونوشت/جریان رویداد برای یک نشست مشترک‌شده.
- `sessions.changed`: نمایه‌ی نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های اسنپ‌شات حضور سیستم.
- `tick`: رویداد keepalive / liveness دوره‌ای.
- `health`: به‌روزرسانی اسنپ‌شات سلامت Gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر اجرای cron/کار.
- `shutdown`: اعلان خاموشی Gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه‌ی عمر جفت‌سازی Node.
- `node.invoke.request`: پخش درخواست فراخوانی Node.
- `device.pair.requested` / `device.pair.resolved`: چرخه‌ی عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی محرک واژه‌ی بیدارباش تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه‌ی عمر تأیید exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه‌ی عمر تأیید Plugin.

### متدهای کمکی Node

- Nodeها می‌توانند برای دریافت فهرست فعلی اجراپذیرهای skill جهت بررسی‌های اجازه‌ی خودکار، `skills.bins` را فراخوانی کنند.

### متدهای کمکی اپراتور

- اپراتورها می‌توانند برای دریافت موجودی فرمان زمان اجرا برای یک agent، `commands.list` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری agent پیش‌فرض، آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both` در صورت موجود بودن، نام‌های native آگاه از provider را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق slash مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` در صورت وجود، نام فرمان native آگاه از provider را حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری native به‌علاوه‌ی در دسترس بودن فرمان native Plugin اثر می‌گذارد.
  - `includeArgs=false` فراداده‌ی آرگومان سریال‌شده را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند برای دریافت کاتالوگ ابزار زمان اجرا برای یک agent، `tools.catalog` (`operator.read`) را فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده‌ی منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه آیا ابزار Plugin اختیاری است
- اپراتورها می‌توانند برای دریافت موجودی ابزار مؤثر در زمان اجرا برای یک نشست، `tools.effective` (`operator.read`) را فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش زمینه‌ی احراز هویت یا تحویل ارائه‌شده توسط فراخواننده، زمینه‌ی زمان اجرای معتمد را از نشست در سمت سرور استخراج می‌کند.
  - پاسخ محدود به نشست است و نشان می‌دهد گفت‌وگوی فعال اکنون چه چیزهایی می‌تواند استفاده کند، از جمله ابزارهای core، Plugin و channel.
- اپراتورها می‌توانند برای فراخوانی یک ابزار در دسترس از همان مسیر سیاست Gateway که `/tools/invoke` استفاده می‌کند، `tools.invoke` (`operator.write`) را فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm` و `idempotencyKey` اختیاری هستند.
  - اگر هر دو `sessionKey` و `agentId` وجود داشته باشند، agent نشست حل‌شده باید با `agentId` مطابقت داشته باشد.
  - پاسخ یک پوشش رو به SDK با فیلدهای `ok`، `toolName`، `output` اختیاری و `error` تایپ‌شده است. رد شدن به‌دلیل تأیید یا سیاست، به‌جای دور زدن خط لوله‌ی سیاست ابزار Gateway، در payload مقدار `ok:false` برمی‌گرداند.
- اپراتورها می‌توانند برای دریافت موجودی skill قابل مشاهده برای یک agent، `skills.status` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری agent پیش‌فرض، آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی و گزینه‌های نصب پاک‌سازی‌شده است، بدون افشای مقادیر خام secret.
- اپراتورها می‌توانند برای فراداده‌ی کشف ClawHub، `skills.search` و `skills.detail` (`operator.read`) را فراخوانی کنند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه‌ی skill را در دایرکتوری `skills/` فضای کاری agent پیش‌فرض نصب می‌کند.
  - حالت نصب‌کننده‌ی Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` یک اقدام اعلام‌شده‌ی `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug رهگیری‌شده یا همه‌ی نصب‌های رهگیری‌شده‌ی ClawHub را در فضای کاری agent پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`، `apiKey` و `env` را patch می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است؛ در غیر این صورت پاسخ، کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه‌ی انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد. در غیر این صورت پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد، به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این برای عیب‌یابی و UIهای کشف استفاده کنید، نه انتخاب‌گرهای عادی مدل.

## تأییدهای exec

- وقتی یک درخواست exec به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` آن را حل می‌کنند (به scope `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده‌ی نشست canonical). درخواست‌های فاقد `systemRunPlan` رد می‌شوند.
- پس از تأیید، فراخوانی‌های `node.invoke system.run` ارسال‌شده، همان `systemRunPlan` canonical را به‌عنوان زمینه‌ی معتبر فرمان/cwd/نشست دوباره استفاده می‌کنند.
- اگر فراخواننده‌ای بین آماده‌سازی و ارسال نهایی `system.run` تأییدشده، `command`، `rawCommand`، `cwd`، `agentId` یا `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به payload تغییریافته، اجرا را رد می‌کند.

## fallback تحویل agent

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی، `deliver=true` را شامل شوند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل حل‌نشده یا فقط داخلی، `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی قابل حل نباشد (برای مثال نشست‌های داخلی/webchat یا پیکربندی‌های چندکاناله‌ی مبهم)، fallback به اجرای فقط نشست را مجاز می‌کند.

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/schema/protocol-schemas.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را می‌فرستند؛ سرور عدم تطابق را رد می‌کند.
- schemaها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در سراسر protocol v3 پایدار هستند و خط مبنای مورد انتظار برای کلاینت‌های شخص ثالث‌اند.

| ثابت                                      | پیش‌فرض                                              | منبع                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| پایان مهلت درخواست (برای هر RPC)          | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| پایان مهلت Preauth / connect-challenge    | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env می‌تواند بودجه‌ی server/client جفت‌شده را افزایش دهد) |
| backoff اولیه‌ی اتصال مجدد                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه‌ی backoff اتصال مجدد               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| محدودسازی تلاش سریع پس از بسته‌شدن device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت Force-stop پیش از `terminate()`       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| پایان مهلت پیش‌فرض `stopAndWait()`        | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصله‌ی پیش‌فرض tick (پیش از `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن در پایان مهلت tick                   | code `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور مقادیر مؤثر `policy.tickIntervalMs`، `policy.maxPayload` و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، به آن مقادیر عمل کنند.

## احراز هویت

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های حامل هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا `gateway.auth.mode: "trusted-proxy"`
  غیر local loopback، بررسی احراز هویت connect را به‌جای `connect.params.auth.*` از
  هدرهای درخواست برآورده می‌کنند.
- `gateway.auth.mode: "none"` برای ورودی خصوصی، احراز هویت connect با راز مشترک را
  به‌طور کامل رد می‌کند؛ این حالت را روی ورودی عمومی/غیرقابل‌اعتماد در معرض دسترس قرار ندهید.
- پس از pair شدن، Gateway یک **توکن دستگاه** با دامنهٔ نقش اتصال
  + scopeها صادر می‌کند. این توکن در `hello-ok.auth.deviceToken` برگردانده می‌شود و باید
  توسط client برای اتصال‌های آینده پایدارسازی شود.
- clientها باید پس از هر connect موفق، `hello-ok.auth.deviceToken` اصلی را پایدارسازی کنند.
- اتصال دوباره با آن توکن دستگاه **ذخیره‌شده** باید مجموعه scope تأییدشدهٔ ذخیره‌شده
  برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت را که
  قبلاً اعطا شده حفظ می‌کند و از کاهش بی‌سروصدای اتصال‌های مجدد به scope ضمنی محدودتر
  فقط admin جلوگیری می‌کند.
- ساخت احراز هویت connect در سمت client (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و همیشه در صورت تنظیم ارسال می‌شود.
  - `auth.token` به ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس یک `deviceToken` صریح، سپس یک توکن ذخیره‌شدهٔ مختص هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط زمانی ارسال می‌شود که هیچ‌یک از موارد بالا یک
    `auth.token` را resolve نکرده باشد. یک توکن مشترک یا هر توکن دستگاه resolve‌شده آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در retry تک‌مرحله‌ای
    `AUTH_TOKEN_MISMATCH` فقط برای **endpointهای قابل‌اعتماد** مجاز است —
    loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی
    بدون pinning واجد شرایط نیست.
- ورودی‌های اضافی `hello-ok.auth.deviceTokens` توکن‌های handoff بوت‌استرپ هستند.
  آن‌ها را فقط زمانی پایدارسازی کنید که connect از احراز هویت بوت‌استرپ روی یک transport قابل‌اعتماد
  مانند `wss://` یا loopback/pairing محلی استفاده کرده باشد.
- اگر یک client یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، همان
  مجموعه scope درخواست‌شده توسط فراخواننده مرجع باقی می‌ماند؛ scopeهای cache‌شده فقط
  زمانی دوباره استفاده می‌شوند که client در حال استفادهٔ دوباره از توکن ذخیره‌شدهٔ مختص هر دستگاه باشد.
- توکن‌های دستگاه را می‌توان از طریق `device.token.rotate` و
  `device.token.revoke` چرخاند/باطل کرد (نیازمند scope `operator.pairing`).
- `device.token.rotate` فرادادهٔ چرخش را برمی‌گرداند. این دستور توکن bearer جایگزین را
  فقط برای فراخوانی‌های همان دستگاه که از قبل با همان توکن دستگاه احراز هویت شده‌اند بازتاب می‌دهد،
  تا clientهای فقط توکنی بتوانند جایگزین خود را پیش از اتصال دوباره پایدارسازی کنند.
  چرخش‌های مشترک/admin توکن bearer را بازتاب نمی‌دهند.
- صدور، چرخش، و ابطال توکن محدود به مجموعه نقش‌های تأییدشده‌ای می‌ماند
  که در ورودی pairing آن دستگاه ثبت شده است؛ تغییر توکن نمی‌تواند یک نقش دستگاه را گسترش دهد
  یا نقشی را هدف بگیرد که تأیید pairing هرگز اعطا نکرده است.
- برای sessionهای توکن دستگاه pair‌شده، مدیریت دستگاه self-scoped است مگر اینکه
  فراخواننده `operator.admin` را نیز داشته باشد: فراخواننده‌های غیر admin فقط می‌توانند ورودی دستگاه
  **خودشان** را حذف/باطل/rotate کنند.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه scope توکن operator هدف را
  در برابر scopeهای session فعلی فراخواننده بررسی می‌کنند. فراخواننده‌های غیر admin
  نمی‌توانند توکن operator گسترده‌تری از آنچه خودشان دارند rotate یا revoke کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمای بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار client برای `AUTH_TOKEN_MISMATCH`:
  - clientهای قابل‌اعتماد می‌توانند یک retry محدود با توکن cache‌شدهٔ مختص هر دستگاه انجام دهند.
  - اگر آن retry شکست خورد، clientها باید حلقه‌های اتصال مجدد خودکار را متوقف کنند و راهنمای اقدام operator را نمایش دهند.

## هویت دستگاه + pairing

- Nodeها باید یک هویت پایدار دستگاه (`device.id`) داشته باشند که از
  fingerprint یک keypair مشتق شده است.
- Gatewayها توکن‌ها را به‌ازای هر دستگاه + نقش صادر می‌کنند.
- تأییدهای pairing برای شناسه‌های دستگاه جدید لازم هستند، مگر اینکه auto-approval محلی
  فعال باشد.
- auto-approval مربوط به pairing حول اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر self-connect محدود backend/container-local برای
  جریان‌های helper راز مشترک قابل‌اعتماد دارد.
- اتصال‌های tailnet یا LAN همان میزبان همچنان برای pairing به‌عنوان remote تلقی می‌شوند و
  نیازمند تأیید هستند.
- clientهای WS معمولاً هنگام `connect` هویت `device` را شامل می‌کنند (operator +
  node). تنها استثناهای operator بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط localhost.
  - احراز هویت operator Control UI موفق با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass، کاهش امنیتی شدید).
  - RPCهای backend مستقیم loopback در `gateway-client` که با توکن/رمز عبور مشترک
    Gateway احراز هویت شده‌اند.
- همهٔ اتصال‌ها باید nonce `connect.challenge` ارائه‌شده توسط server را امضا کنند.

### تشخیص‌های مهاجرت احراز هویت دستگاه

برای clientهای legacy که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنی                                                |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | client مقدار `device.nonce` را حذف کرده (یا خالی فرستاده است). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | client با nonce قدیمی/نادرست امضا کرده است.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload امضا با payload v2 مطابقت ندارد.           |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp امضاشده خارج از skew مجاز است.           |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با fingerprint کلید عمومی مطابقت ندارد. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/canonicalization کلید عمومی شکست خورد.        |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- payload v2 را که شامل nonce server است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- payload امضای ترجیحی `v3` است، که علاوه بر فیلدهای device/client/role/scopes/token/nonce،
  `platform` و `deviceFamily` را نیز bind می‌کند.
- امضاهای legacy `v2` برای سازگاری همچنان پذیرفته می‌شوند، اما pinning فرادادهٔ دستگاه pair‌شده
  هنوز سیاست command را هنگام اتصال مجدد کنترل می‌کند.

## TLS + pinning

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- clientها می‌توانند به‌صورت اختیاری fingerprint گواهی Gateway را pin کنند (پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` را ببینید).

## Scope

این پروتکل **API کامل Gateway** را در معرض دسترس قرار می‌دهد (وضعیت، channelها، مدل‌ها، chat،
agent، sessionها، nodeها، تأییدها، و غیره). سطح دقیق توسط
schemaهای TypeBox در `src/gateway/protocol/schema.ts` تعریف می‌شود.

## مرتبط

- [پروتکل Bridge](/fa/gateway/bridge-protocol)
- [runbook Gateway](/fa/gateway)
