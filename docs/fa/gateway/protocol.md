---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS Gateway
    - اشکال‌زدایی از ناسازگاری‌های پروتکل یا خطاهای اتصال
    - بازایجاد طرحواره/مدل‌های پروتکل
summary: 'پروتکل WebSocket Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-05-10T19:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل WS مربوط به Gateway، **تنها صفحه کنترل + انتقال گره** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط وب، برنامه macOS، گره‌های iOS/Android، گره‌های بدون رابط)
از طریق WebSocket متصل می‌شوند و در زمان دست‌دهی، **نقش** + **محدوده** خود را اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود شده‌اند. پس از یک دست‌دهی موفق، کلاینت‌ها
  باید محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` را رعایت کنند. وقتی عیب‌یابی فعال باشد،
  فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه Gateway فریم
  مربوط را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطوح و کدهای دلیل امن را نگه می‌دارند. آن‌ها متن پیام،
  محتوای پیوست، بدنه خام فریم، توکن‌ها، کوکی‌ها یا مقادیر محرمانه را نگه نمی‌دارند.

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

در حالی که Gateway هنوز در حال تکمیل سایدکارهای راه‌اندازی است، درخواست `connect` می‌تواند
یک خطای قابل‌تلاش‌مجدد `UNAVAILABLE` برگرداند که `details.reason` آن روی
`"startup-sidecars"` و `retryAfterMs` تنظیم شده است. کلاینت‌ها باید این پاسخ را
در بودجه کلی اتصال خود دوباره تلاش کنند، نه اینکه آن را به‌عنوان شکست نهایی
دست‌دهی نمایش دهند.

`server`، `features`، `snapshot` و `policy` همگی طبق schema
(`src/gateway/protocol/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/محدوده‌های مذاکره‌شده را گزارش می‌کند. `pluginSurfaceUrls` اختیاری است و نام
سطوح Plugin، مانند `canvas`، را به URLهای میزبانی‌شده دارای محدوده نگاشت می‌کند.

URLهای دارای محدوده برای سطوح Plugin ممکن است منقضی شوند. گره‌ها می‌توانند
`node.pluginSurface.refresh` را با `{ "surface": "canvas" }` فراخوانی کنند تا یک
ورودی تازه در `pluginSurfaceUrls` دریافت کنند. بازطراحی آزمایشی Plugin Canvas از
مسیر سازگاری منسوخ `canvasHostUrl`، `canvasCapability` یا
`node.canvas.capability.refresh` پشتیبانی نمی‌کند؛ کلاینت‌های بومی و Gatewayهای
فعلی باید از سطوح Plugin استفاده کنند.

وقتی هیچ توکن دستگاهی صادر نشود، `hello-ok.auth` مجوزهای مذاکره‌شده را بدون
فیلدهای توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های بک‌اند قابل‌اعتماد در همان فرایند (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصال‌های loopback مستقیم، وقتی با
توکن/رمز عبور مشترک Gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر
برای RPCهای داخلی صفحه کنترل رزرو شده است و مانع می‌شود مبناهای قدیمی جفت‌سازی
CLI/دستگاه، کار محلی بک‌اند مانند به‌روزرسانی‌های نشست عامل فرعی را مسدود کنند.
کلاینت‌های راه‌دور، کلاینت‌های با مبدأ مرورگر، کلاینت‌های گره و کلاینت‌های صریح
با توکن دستگاه/هویت دستگاه همچنان از بررسی‌های عادی جفت‌سازی و ارتقای محدوده
استفاده می‌کنند.

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

در زمان تحویل راه‌اندازی اولیه قابل‌اعتماد، `hello-ok.auth` ممکن است ورودی‌های
نقشی محدود اضافی را نیز در `deviceTokens` داشته باشد:

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

برای جریان راه‌اندازی اولیه داخلی گره/اپراتور، توکن اصلی گره همچنان
`scopes: []` می‌ماند و هر توکن اپراتور تحویل‌داده‌شده به allowlist اپراتور
راه‌اندازی اولیه (`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`) محدود می‌ماند. بررسی‌های محدوده
راه‌اندازی اولیه همچنان با پیشوند نقش انجام می‌شوند: ورودی‌های اپراتور فقط
درخواست‌های اپراتور را برآورده می‌کنند، و نقش‌های غیر اپراتور همچنان به
محدوده‌هایی زیر پیشوند نقش خودشان نیاز دارند.

### نمونه گره

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

متدهای دارای اثر جانبی به **کلیدهای هم‌توانی** نیاز دارند (schema را ببینید).

## نقش‌ها + محدوده‌ها

برای مدل کامل محدوده اپراتور، بررسی‌های زمان تأیید و معناشناسی
محرمانه‌های مشترک، [محدوده‌های اپراتور](/fa/gateway/operator-scopes) را ببینید.

### نقش‌ها

- `operator` = کلاینت صفحه کنترل (CLI/رابط کاربری/اتوماسیون).
- `node` = میزبان قابلیت (camera/screen/canvas/system.run).

### محدوده‌ها (اپراتور)

محدوده‌های رایج:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` با `includeSecrets: true` به `operator.talk.secrets`
(یا `operator.admin`) نیاز دارد.

متدهای RPC مربوط به Gateway که توسط Plugin ثبت شده‌اند ممکن است محدوده اپراتور
خودشان را درخواست کنند، اما پیشوندهای رزروشده مدیریت هسته (`config.*`،
`exec.approvals.*`، `wizard.*`، `update.*`) همیشه به `operator.admin` resolve
می‌شوند.

محدوده متد فقط نخستین gate است. برخی دستورهای اسلش که از طریق `chat.send`
فراخوانی می‌شوند، بررسی‌های سخت‌گیرانه‌تر در سطح دستور را علاوه بر آن اعمال
می‌کنند. برای مثال، نوشتن‌های ماندگار `/config set` و `/config unset` به
`operator.admin` نیاز دارند.

`node.pair.approve` افزون بر محدوده پایه متد، یک بررسی محدوده اضافی در زمان
تأیید نیز دارد:

- درخواست‌های بدون دستور: `operator.pairing`
- درخواست‌های دارای دستورهای گره غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare` یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### قابلیت‌ها/دستورها/مجوزها (گره)

گره‌ها در زمان اتصال ادعاهای قابلیت را اعلام می‌کنند:

- `caps`: دسته‌های سطح‌بالای قابلیت مانند `camera`، `canvas`، `screen`،
  `location`، `voice` و `talk`.
- `commands`: allowlist دستورها برای invoke.
- `permissions`: toggles ریزدانه (برای مثال `screen.record`، `camera.capture`).

Gateway این موارد را به‌عنوان **ادعا** در نظر می‌گیرد و allowlistهای سمت سرور را
اعمال می‌کند.

## حضور

- `system-presence` ورودی‌هایی را برمی‌گرداند که با هویت دستگاه کلیدگذاری شده‌اند.
- ورودی‌های حضور شامل `deviceId`، `roles` و `scopes` هستند تا رابط‌های کاربری بتوانند برای هر دستگاه یک ردیف نشان دهند
  حتی وقتی همان دستگاه هم به‌عنوان **اپراتور** و هم به‌عنوان **گره** متصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. گره‌های متصل
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ گره‌های جفت‌شده همچنین می‌توانند
  وقتی یک رویداد گره قابل‌اعتماد metadata جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، حضور پس‌زمینه پایدار را گزارش کنند.

### رویداد زنده‌بودن پس‌زمینه گره

گره‌ها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک گره جفت‌شده
در طول بیدارشدن پس‌زمینه زنده بوده، بدون اینکه به‌عنوان متصل علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual` یا `connect`. رشته‌های trigger ناشناخته پیش از پایداری، توسط Gateway به
`background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه گره احراز هویت‌شده
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

Gatewayهای قدیمی‌تر ممکن است همچنان `{ "ok": true }` را برای `node.event` برگردانند؛ کلاینت‌ها باید آن را یک
RPC تأییدشده در نظر بگیرند، نه پایداری حضور بادوام.

## محدوده‌بندی رویدادهای broadcast

رویدادهای broadcast مبتنی بر WebSocket که از سرور push می‌شوند، با محدوده gate می‌شوند تا نشست‌های دارای محدوده جفت‌سازی یا فقط گره، محتوای نشست را به‌صورت منفعل دریافت نکنند.

- **فریم‌های چت، عامل و نتیجه ابزار** (از جمله رویدادهای stream‌شده `agent` و نتایج فراخوانی ابزار) دست‌کم به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را کاملاً رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به نحوه ثبت آن‌ها توسط Plugin، به `operator.write` یا `operator.admin` محدود می‌شوند.
- **رویدادهای وضعیت و انتقال** (`heartbeat`، `presence`، `tick`، چرخه عمر اتصال/قطع اتصال و غیره) نامحدود باقی می‌مانند تا سلامت انتقال برای هر نشست احراز هویت‌شده قابل مشاهده باشد.
- **خانواده‌های ناشناخته رویداد broadcast** به‌صورت پیش‌فرض با محدوده gate می‌شوند (fail-closed)، مگر اینکه یک handler ثبت‌شده صراحتاً آن‌ها را آزادتر کند.

هر اتصال کلاینت شماره توالی مختص به همان کلاینت را نگه می‌دارد تا broadcastها روی همان socket ترتیب یکنواخت را حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوتی از جریان رویداد را پس از فیلتر محدوده می‌بینند.

## خانواده‌های رایج متد RPC

سطح عمومی WS گسترده‌تر از نمونه‌های دست‌دهی/احراز هویت بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست conservative
برای کشف است که از `src/gateway/server-methods-list.ts` به‌علاوه exportهای متد
Plugin/کانال بارگذاری‌شده ساخته می‌شود. آن را کشف قابلیت در نظر بگیرید، نه یک
شمارش کامل از `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` تصویر لحظه‌ای سلامت Gateway را که cache شده یا تازه probe شده است برمی‌گرداند.
    - `diagnostics.stability` ضبط‌کننده پایداری عیب‌یابی محدود اخیر را برمی‌گرداند. این مورد metadata عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایت، خوانش‌های حافظه، وضعیت queue/session، نام‌های کانال/Plugin و شناسه‌های نشست را نگه می‌دارد. متن چت، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها یا مقادیر محرمانه را نگه نمی‌دارد. محدوده خواندن اپراتور لازم است.
    - `status` خلاصه Gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های اپراتور دارای محدوده admin گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه Gateway را که توسط جریان‌های relay و جفت‌سازی استفاده می‌شود برمی‌گرداند.
    - `system-presence` تصویر لحظه‌ای حضور فعلی برای دستگاه‌های اپراتور/گره متصل را برمی‌گرداند.
    - `system-event` یک رویداد سیستم را اضافه می‌کند و می‌تواند زمینه حضور را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` آخرین رویداد Heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را در Gateway toggle می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و استفاده">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخاب‌گر، `{ "view": "configured" }` را پاس دهید (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`)، یا برای کاتالوگ کامل `{ "view": "all" }`.
    - `usage.status` خلاصه‌های پنجره‌های استفاده/سهمیه باقی‌مانده ارائه‌دهنده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیعی هزینه استفاده را برای یک بازه تاریخی برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding کش‌شده را برای فضای کاری عامل پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخواننده صراحتا یک ping زنده به ارائه‌دهنده embedding می‌خواهد، `{ "probe": true }` یا `{ "deep": true }` را پاس دهید.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از هارنس REM را برای کلاینت‌های صفحه کنترل راه دور برمی‌گرداند. این می‌تواند شامل مسیرهای فضای کاری، قطعه‌های حافظه، markdown زمینه‌مند رندرشده، و نامزدهای ارتقای عمیق باشد، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های استفاده به‌ازای هر نشست را برمی‌گرداند.
    - `sessions.usage.timeseries` استفاده سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های لاگ استفاده را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، در جایی که کانال از خروج پشتیبانی می‌کند، خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/وب را برای ارائه‌دهنده کانال وب فعلی که از QR پشتیبانی می‌کند آغاز می‌کند.
    - `web.login.wait` منتظر تکمیل آن جریان ورود QR/وب می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک پوش APNs آزمایشی به یک گره iOS ثبت‌شده ارسال می‌کند.
    - `voicewake.get` محرک‌های واژه بیدارباش ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` محرک‌های واژه بیدارباش را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و لاگ‌ها">
    - `send` RPC تحویل خروجی مستقیم برای ارسال‌های هدف‌گذاری‌شده به کانال/حساب/رشته خارج از اجراکننده چت است.
    - `logs.tail` دنباله لاگ فایل پیکربندی‌شده Gateway را با کنترل‌های مکان‌نما/حد و حداکثر بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.catalog` کاتالوگ فقط‌خواندنی ارائه‌دهنده Talk را برای گفتار، رونویسی جریانی، و صدای realtime برمی‌گرداند. این شامل شناسه‌های ارائه‌دهنده، برچسب‌ها، وضعیت پیکربندی‌شده، شناسه‌های مدل/صدا ارائه‌شده، حالت‌های کانونی، انتقال‌ها، راهبردهای مغز، و پرچم‌های صوتی/قابلیت realtime است، بدون اینکه رازهای ارائه‌دهنده را برگرداند یا پیکربندی سراسری را تغییر دهد.
    - `talk.config` محموله پیکربندی مؤثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.session.create` یک نشست Talk متعلق به Gateway برای `realtime/gateway-relay`، `transcription/gateway-relay`، یا `stt-tts/managed-room` ایجاد می‌کند. `brain: "direct-tools"` به `operator.admin` نیاز دارد.
    - `talk.session.join` توکن نشست اتاق مدیریت‌شده را اعتبارسنجی می‌کند، در صورت نیاز رویدادهای `session.ready` یا `session.replaced` را منتشر می‌کند، و فراداده اتاق/نشست به‌همراه رویدادهای اخیر Talk را بدون توکن متن ساده یا هش توکن ذخیره‌شده برمی‌گرداند.
    - `talk.session.appendAudio` ورودی صوتی PCM با کدگذاری base64 را به نشست‌های relay و رونویسی realtime متعلق به Gateway اضافه می‌کند.
    - `talk.session.startTurn`، `talk.session.endTurn`، و `talk.session.cancelTurn` چرخه عمر نوبت اتاق مدیریت‌شده را با رد نوبت کهنه پیش از پاک شدن وضعیت هدایت می‌کنند.
    - `talk.session.cancelOutput` خروجی صوتی دستیار را متوقف می‌کند، عمدتا برای ورود میان‌صحبت کنترل‌شده با VAD در نشست‌های relay Gateway.
    - `talk.session.submitToolResult` یک فراخوانی ابزار ارائه‌دهنده را که توسط یک نشست relay realtime متعلق به Gateway منتشر شده کامل می‌کند. برای خروجی موقت ابزار وقتی نتیجه نهایی بعدا می‌آید، `options: { willContinue: true }` را پاس دهید، یا وقتی نتیجه ابزار باید فراخوانی ارائه‌دهنده را بدون شروع پاسخ realtime دیگری از دستیار برآورده کند، `options: { suppressResponse: true }` را پاس دهید.
    - `talk.session.close` یک نشست relay، رونویسی، یا اتاق مدیریت‌شده متعلق به Gateway را می‌بندد و رویدادهای پایانی Talk را منتشر می‌کند.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/Control UI تنظیم/پخش می‌کند.
    - `talk.client.create` یک نشست ارائه‌دهنده realtime متعلق به کلاینت را با استفاده از `webrtc` یا `provider-websocket` ایجاد می‌کند، در حالی که Gateway مالک پیکربندی، اعتبارنامه‌ها، دستورالعمل‌ها، و سیاست ابزار است.
    - `talk.client.toolCall` به انتقال‌های realtime متعلق به کلاینت اجازه می‌دهد فراخوانی‌های ابزار ارائه‌دهنده را به سیاست Gateway ارسال کنند. نخستین ابزار پشتیبانی‌شده `openclaw_agent_consult` است؛ کلاینت‌ها یک شناسه اجرا دریافت می‌کنند و پیش از ارسال نتیجه ابزار مخصوص ارائه‌دهنده، منتظر رویدادهای عادی چرخه عمر چت می‌مانند.
    - `talk.event` کانال رویداد واحد Talk برای آداپتورهای realtime، رونویسی، STT/TTS، اتاق مدیریت‌شده، تلفنی، و جلسه است.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk ترکیب می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان fallback، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` موجودی قابل مشاهده ارائه‌دهنده TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="رازها، پیکربندی، به‌روزرسانی، و ویزارد">
    - `secrets.reload` SecretRefهای فعال را دوباره resolve می‌کند و وضعیت راز زمان اجرا را فقط در صورت موفقیت کامل جایگزین می‌کند.
    - `secrets.resolve` انتساب‌های راز هدف دستور را برای یک مجموعه دستور/هدف مشخص resolve می‌کند.
    - `config.get` snapshot و هش پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک محموله پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را ادغام می‌کند.
    - `config.apply` محموله کامل پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` محموله schema زنده پیکربندی را که توسط ابزارهای Control UI و CLI استفاده می‌شود برمی‌گرداند: schema، `uiHints`، نسخه، و فراداده تولید، از جمله فراداده schema مربوط به Plugin + کانال وقتی زمان اجرا بتواند آن را بارگذاری کند. این schema شامل فراداده فیلد `title` / `description` است که از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط UI مشتق شده، از جمله شاخه‌های ترکیب شیء تو در تو، wildcard، مورد آرایه، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد مطابق وجود داشته باشد.
    - `config.schema.lookup` یک محموله lookup محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک گره schema کم‌عمق، hint مطابق + `hintPath`، و خلاصه‌های فرزند فوری برای drill-down در UI/CLI. گره‌های schema در lookup مستندات رو به کاربر و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/شیء، و پرچم‌هایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، به‌همراه `hint` / `hintPath` مطابق را ارائه می‌کنند.
    - `update.run` جریان به‌روزرسانی gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد یک راه‌اندازی مجدد زمان‌بندی می‌کند؛ فراخواننده‌هایی که نشست دارند می‌توانند `continuationMessage` را بگنجانند تا startup یک نوبت پیگیری عامل را از طریق صف ادامه راه‌اندازی مجدد از سر بگیرد. به‌روزرسانی‌های مدیر بسته پس از جایگزینی بسته، یک راه‌اندازی مجدد به‌روزرسانی بدون تعویق و بدون cooldown را اجباری می‌کنند تا فرایند قدیمی Gateway از یک درخت `dist` جایگزین‌شده به lazy-loading ادامه ندهد.
    - `update.status` آخرین sentinel کش‌شده راه‌اندازی مجدد به‌روزرسانی را، از جمله نسخه در حال اجرای پس از راه‌اندازی مجدد وقتی موجود باشد، برمی‌گرداند.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` ویزارد onboarding را از طریق WS RPC ارائه می‌کنند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های عامل و فضای کاری">
    - `agents.list` ورودی‌های عامل پیکربندی‌شده را، از جمله مدل مؤثر و فراداده زمان اجرا، برمی‌گرداند.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای عامل و سیم‌کشی فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های فضای کاری bootstrap ارائه‌شده برای یک عامل را مدیریت می‌کنند.
    - `tasks.list`، `tasks.get`، و `tasks.cancel` دفتر وظایف Gateway را در اختیار کلاینت‌های SDK و اپراتور قرار می‌دهند.
    - `artifacts.list`، `artifacts.get`، و `artifacts.download` خلاصه‌های artifact مشتق‌شده از transcript و دانلودها را برای محدوده صریح `sessionKey`، `runId`، یا `taskId` ارائه می‌کنند. پرس‌وجوهای اجرا و وظیفه نشست مالک را در سمت سرور resolve می‌کنند و فقط رسانه transcript با provenance مطابق را برمی‌گردانند؛ منابع URL ناامن یا محلی به‌جای fetch در سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `environments.list` و `environments.status` کشف فقط‌خواندنی محیط‌های محلی Gateway و گره را برای کلاینت‌های SDK ارائه می‌کنند.
    - `agent.identity.get` هویت مؤثر دستیار را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک اجرا می‌ماند و وقتی موجود باشد snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` نمایه نشست فعلی را برمی‌گرداند، از جمله فراداده `agentRuntime` به‌ازای هر ردیف وقتی یک backend زمان اجرای عامل پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر نشست را برای کلاینت WS فعلی تغییر می‌دهند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد transcript/پیام را برای یک نشست تغییر می‌دهند.
    - `sessions.preview` پیش‌نمایش‌های محدود transcript را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.describe` یک ردیف نشست Gateway را برای یک کلید نشست دقیق برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را resolve یا کانونی‌سازی می‌کند.
    - `sessions.create` یک ورودی نشست جدید ایجاد می‌کند.
    - `sessions.send` یک پیام به یک نشست موجود ارسال می‌کند.
    - `sessions.steer` گونه interrupt-and-steer برای یک نشست فعال است.
    - `sessions.abort` کار فعال برای یک نشست را abort می‌کند. فراخواننده می‌تواند `key` به‌همراه `runId` اختیاری را پاس دهد، یا برای اجراهای فعالی که Gateway می‌تواند به یک نشست resolve کند فقط `runId` را پاس دهد.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل کانونی resolve‌شده به‌همراه `agentRuntime` مؤثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداری نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌صورت display-normalized است: تگ‌های directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، محموله‌های XML فراخوانی ابزار به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های فراخوانی ابزار کوتاه‌شده) و توکن‌های کنترل مدل ASCII/تمام‌عرض نشت‌کرده حذف می‌شوند، ردیف‌های دستیار با توکن صرفا silent مانند `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و توکن‌های دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شده در انتظار و تأییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` یک توکن دستگاه جفت‌شده را در محدوده نقش تأییدشده و دامنه فراخواننده آن rotate می‌کند.
    - `device.token.revoke` یک توکن دستگاه جفت‌شده را در محدوده نقش تأییدشده و دامنه فراخواننده آن revoke می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، invoke، و کار در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` جفت‌سازی گره و اعتبارسنجی bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت گره‌های شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک گره جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک دستور را به یک گره متصل فوروارد می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای منشأگرفته از گره را به gateway برمی‌گرداند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف گره متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کار در انتظار بادوام را برای گره‌های آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تأیید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list` و `exec.approval.resolve` درخواست‌های تأیید یک‌باره‌ی exec و همچنین جست‌وجو/بازپخش تأییدهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تأیید exec در انتظار می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در صورت پایان مهلت، `null`).
    - `exec.approvals.get` و `exec.approvals.set` نماگرفت‌های سیاست تأیید exec در Gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تأیید exec محلیِ Node را از طریق فرمان‌های بازپخش Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision` و `plugin.approval.resolve` جریان‌های تأیید تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills و ابزارها">
    - اتوماسیون: `wake` تزریق متن بیدارسازی فوری یا در Heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run` و `cron.runs` کارهای زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رویداد رایج

- `chat`: به‌روزرسانی‌های گفت‌وگوی UI مانند `chat.inject` و دیگر رویدادهای گفت‌وگویی که فقط مربوط به رونوشت هستند.
- `session.message` و `session.tool`: به‌روزرسانی‌های رونوشت/جریان رویداد برای یک نشست مشترک‌شده.
- `sessions.changed`: نمایه یا فراداده‌ی نشست تغییر کرده است.
- `presence`: به‌روزرسانی‌های نماگرفت حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / liveness.
- `health`: به‌روزرسانی نماگرفت سلامت Gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر اجرای Cron/کار.
- `shutdown`: اعلان خاموشی Gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه‌ی عمر جفت‌سازی Node.
- `node.invoke.request`: پخش درخواست فراخوانی Node.
- `device.pair.requested` / `device.pair.resolved`: چرخه‌ی عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی محرک wake-word تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه‌ی عمر تأیید exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه‌ی عمر تأیید Plugin.

### متدهای کمکی Node

- Nodeها می‌توانند برای دریافت فهرست فعلی اجراپذیرهای مهارت جهت بررسی‌های اجازه‌دهی خودکار، `skills.bins` را فراخوانی کنند.

### RPCهای دفتر وظایف

کلاینت‌های اپراتور می‌توانند رکوردهای وظایف پس‌زمینه‌ی Gateway را از طریق
RPCهای دفتر وظایف بررسی و لغو کنند. این متدها خلاصه‌های پاک‌سازی‌شده‌ی وظیفه را برمی‌گردانند، نه وضعیت خام زمان اجرا.

- `tasks.list` به `operator.read` نیاز دارد.
  - پارامترها: `status` اختیاری (`"queued"`، `"running"`، `"completed"`،
    `"failed"`، `"cancelled"`، یا `"timed_out"`) یا آرایه‌ای از آن وضعیت‌ها،
    `agentId` اختیاری، `sessionKey` اختیاری، `limit` اختیاری از `1` تا
    `500`، و رشته‌ی اختیاری `cursor`.
  - نتیجه: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` به `operator.read` نیاز دارد.
  - پارامترها: `{ "taskId": string }`.
  - نتیجه: `{ "task": TaskSummary }`.
  - شناسه‌های وظیفه‌ی ناموجود، قالب خطای not-found در Gateway را برمی‌گردانند.
- `tasks.cancel` به `operator.write` نیاز دارد.
  - پارامترها: `{ "taskId": string, "reason"?: string }`.
  - نتیجه:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` گزارش می‌کند آیا دفتر، وظیفه‌ی منطبقی داشته است یا نه. `cancelled`
    گزارش می‌کند آیا زمان اجرا لغو را پذیرفته یا ثبت کرده است یا نه.

`TaskSummary` شامل `id`، `status` و فراداده‌ی اختیاری مانند `kind`،
`runtime`، `title`، `agentId`، `sessionKey`، `childSessionKey`، `ownerKey`،
`runId`، `taskId`، `flowId`، `parentTaskId`، `sourceId`، مهرهای زمانی، پیشرفت،
خلاصه‌ی پایانی، و متن خطای پاک‌سازی‌شده است.

### متدهای کمکی اپراتور

- اپراتورها می‌توانند برای دریافت موجودی فرمان‌های زمان اجرا برای یک عامل، `commands.list` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - `scope` کنترل می‌کند `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both`، وقتی در دسترس باشد، نام‌های native آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` وقتی وجود داشته باشد، نام فرمان native آگاه از ارائه‌دهنده را حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری native و دسترس‌پذیری فرمان native Plugin اثر می‌گذارد.
  - `includeArgs=false` فراداده‌ی آرگومان سریال‌شده را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند برای دریافت کاتالوگ ابزار زمان اجرا برای یک عامل، `tools.catalog` (`operator.read`) را فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده‌ی منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه ابزار Plugin اختیاری است یا نه
- اپراتورها می‌توانند برای دریافت موجودی ابزار مؤثر در زمان اجرا برای یک نشست، `tools.effective` (`operator.read`) را فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا بافت تحویلِ ارائه‌شده توسط فراخواننده، بافت زمان اجرای مورد اعتماد را از نشست در سمت سرور استخراج می‌کند.
  - پاسخ در دامنه‌ی نشست است و آنچه گفت‌وگوی فعال همین حالا می‌تواند استفاده کند را بازتاب می‌دهد، شامل ابزارهای هسته، Plugin و کانال.
- اپراتورها می‌توانند برای فراخوانی یک ابزار موجود از همان مسیر سیاست Gateway که `/tools/invoke` استفاده می‌کند، `tools.invoke` (`operator.write`) را فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm` و
    `idempotencyKey` اختیاری هستند.
  - اگر هم `sessionKey` و هم `agentId` حاضر باشند، عامل نشست حل‌شده باید با
    `agentId` مطابقت داشته باشد.
  - پاسخ یک پوشش رو به SDK با `ok`، `toolName`، `output` اختیاری، و فیلدهای
    `error` نوع‌دار است. رد شدن به‌دلیل تأیید یا سیاست، به‌جای دور زدن خط لوله‌ی سیاست ابزار Gateway، `ok:false` را در payload برمی‌گرداند.
- اپراتورها می‌توانند برای دریافت موجودی قابل مشاهده‌ی مهارت برای یک عامل، `skills.status` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی، و گزینه‌های نصب پاک‌سازی‌شده بدون افشای مقدارهای خام محرمانه است.
- اپراتورها می‌توانند برای فراداده‌ی کشف ClawHub، `skills.search` و `skills.detail` (`operator.read`) را فراخوانی کنند.
- اپراتورها می‌توانند برای آماده‌سازی یک آرشیو مهارت خصوصی پیش از نصب، `skills.upload.begin`، `skills.upload.chunk` و
  `skills.upload.commit` (`operator.admin`) را فراخوانی کنند. این یک مسیر آپلود مدیریتی جداگانه برای کلاینت‌های مورد اعتماد است،
  نه جریان عادی نصب مهارت ClawHub، و به‌صورت پیش‌فرض غیرفعال است مگر اینکه
  `skills.install.allowUploadedArchives` فعال شده باشد.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    یک آپلود وابسته به آن slug و مقدار force ایجاد می‌کند.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` بایت‌ها را در
    offset دقیقِ رمزگشایی‌شده اضافه می‌کند.
  - `skills.upload.commit({ uploadId, sha256? })` اندازه‌ی نهایی و
    SHA-256 را راستی‌آزمایی می‌کند. commit فقط آپلود را نهایی می‌کند؛ مهارت را نصب نمی‌کند.
  - آرشیوهای مهارت آپلودشده، آرشیوهای zip دارای ریشه‌ی `SKILL.md` هستند. نام دایرکتوری داخلی آرشیو هرگز هدف نصب را انتخاب نمی‌کند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در سه حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه‌ی مهارت را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت آپلود: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    یک آپلود commit‌شده را در دایرکتوری `skills/<slug>` فضای کاری عامل پیش‌فرض نصب می‌کند. مقدارهای slug و force باید با درخواست اولیه‌ی
    `skills.upload.begin` مطابقت داشته باشند. این حالت رد می‌شود مگر اینکه
    `skills.install.allowUploadedArchives` فعال شده باشد. این تنظیم بر نصب‌های ClawHub اثری ندارد.
  - حالت نصب‌کننده‌ی Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    یک کنش اعلام‌شده‌ی `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug پیگیری‌شده یا همه‌ی نصب‌های پیگیری‌شده‌ی ClawHub را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقدارهای `skills.entries.<skillKey>` مانند `enabled`،
    `apiKey` و `env` را وصله می‌کند.

### نماهای `models.list`

`models.list` پارامتر اختیاری `view` را می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است، شامل مدل‌های کشف‌شده‌ی پویا برای ورودی‌های `provider/*`. در غیر این صورت پاسخ، کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه‌ی انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد، شامل کشف محدود به ارائه‌دهنده برای ورودی‌های `provider/*`. بدون allowlist، پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این برای رابط‌های کاربری عیب‌یابی و کشف استفاده کنید، نه انتخاب‌گرهای عادی مدل.

## تأییدهای exec

- وقتی یک درخواست exec به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` حل می‌کنند (به دامنه‌ی `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده‌ی نشست canonical). درخواست‌هایی که `systemRunPlan` ندارند رد می‌شوند.
- پس از تأیید، فراخوانی‌های بازفرستاده‌شده‌ی `node.invoke system.run` همان
  `systemRunPlan` canonical را به‌عنوان بافت معتبر فرمان/cwd/نشست دوباره استفاده می‌کنند.
- اگر فراخواننده بین آماده‌سازی و بازفرستادن نهایی `system.run` تأییدشده، `command`، `rawCommand`، `cwd`، `agentId` یا
  `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به payload تغییر‌یافته، اجرا را رد می‌کند.

## fallback تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی، شامل `deliver=true` باشند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل حل‌نشده یا فقط داخلی، `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی قابل حل نباشد، امکان fallback به اجرای فقط در نشست را فراهم می‌کند (برای نمونه نشست‌های داخلی/webchat یا پیکربندی‌های چندکاناله‌ی مبهم).
- نتیجه‌های نهایی `agent` وقتی تحویل درخواست شده باشد ممکن است شامل `result.deliveryStatus` باشند، با همان وضعیت‌های `sent`، `suppressed`، `partial_failed` و `failed`
  که برای [`openclaw agent --json --deliver`](/fa/cli/agent#json-delivery-status) مستند شده‌اند.

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/version.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را ارسال می‌کنند؛ سرور عدم تطابق‌ها را رد می‌کند.
- schemaها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقدارها در protocol v4 پایدار هستند و baseline مورد انتظار برای کلاینت‌های شخص ثالث به‌شمار می‌روند.

| ثابت                                      | پیش‌فرض                                              | منبع                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| مهلت درخواست (برای هر RPC)                | `30_000` میلی‌ثانیه                                  | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلت پیش‌احراز هویت / چالش اتصال         | `15_000` میلی‌ثانیه                                  | `src/gateway/handshake-timeouts.ts` (پیکربندی/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| backoff اولیه اتصال دوباره                | `1_000` میلی‌ثانیه                                   | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه backoff اتصال دوباره               | `30_000` میلی‌ثانیه                                  | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| محدودسازی تلاش دوباره سریع پس از بسته‌شدن با توکن دستگاه | `250` میلی‌ثانیه                         | `src/gateway/client.ts`                                                                    |
| مهلت ارفاق توقف اجباری پیش از `terminate()` | `250` میلی‌ثانیه                                  | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلت پیش‌فرض `stopAndWait()`              | `1_000` میلی‌ثانیه                                   | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| بازه tick پیش‌فرض (پیش از `hello-ok`)     | `30_000` میلی‌ثانیه                                  | `src/gateway/client.ts`                                                                    |
| بستن در اثر پایان مهلت tick              | کد `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 مگابایت)                      | `src/gateway/server-constants.ts`                                                          |

سرور مقدار مؤثر `policy.tickIntervalMs`، `policy.maxPayload`،
و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، این مقدارها را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا
  `gateway.auth.mode: "trusted-proxy"` غیر loopback، بررسی احراز هویت اتصال را به‌جای `connect.params.auth.*` از
  هدرهای درخواست برآورده می‌کنند.
- حالت ورودی خصوصی `gateway.auth.mode: "none"` احراز هویت اتصال با راز مشترک را کاملاً رد می‌کند؛ این حالت را روی ورودی عمومی/نامطمئن در معرض دسترس قرار ندهید.
- پس از pairing، Gateway یک **توکن دستگاه** محدود به نقش اتصال + scopeها صادر می‌کند. این توکن در `hello-ok.auth.deviceToken` برگردانده می‌شود و کلاینت باید آن را برای اتصال‌های آینده پایدار ذخیره کند.
- کلاینت‌ها باید پس از هر اتصال موفق، `hello-ok.auth.deviceToken` اصلی را پایدار ذخیره کنند.
- اتصال دوباره با آن توکن دستگاه **ذخیره‌شده** باید مجموعه scope تأییدشده ذخیره‌شده برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت را که قبلاً اعطا شده حفظ می‌کند و مانع از آن می‌شود که اتصال‌های دوباره به‌صورت بی‌صدا به scope ضمنی محدودترِ فقط مدیر فروکاسته شوند.
- مونتاژ احراز هویت اتصال در سمت کلاینت (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و وقتی تنظیم شده باشد همیشه ارسال می‌شود.
  - `auth.token` به ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس `deviceToken` صریح، سپس توکن ذخیره‌شده برای هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط وقتی فرستاده می‌شود که هیچ‌کدام از موارد بالا یک
    `auth.token` را حل نکرده باشند. توکن مشترک یا هر توکن دستگاه حل‌شده‌ای آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش دوباره یک‌باره
    `AUTH_TOKEN_MISMATCH` فقط به **endpointهای مورد اعتماد** محدود است —
    loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی
    بدون پین‌کردن واجد شرایط نیست.
- ورودی‌های اضافی `hello-ok.auth.deviceTokens` توکن‌های handoff راه‌اندازی هستند.
  آن‌ها را فقط وقتی پایدار ذخیره کنید که اتصال از احراز هویت bootstrap روی transport مورد اعتماد
  مانند `wss://` یا pairing محلی/loopback استفاده کرده باشد.
- اگر کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، آن
  مجموعه scope درخواستی فراخواننده مرجع باقی می‌ماند؛ scopeهای cacheشده فقط زمانی
  دوباره استفاده می‌شوند که کلاینت در حال استفاده مجدد از توکن ذخیره‌شده برای هر دستگاه باشد.
- توکن‌های دستگاه را می‌توان از طریق `device.token.rotate` و
  `device.token.revoke` چرخاند/ابطال کرد (به scope `operator.pairing` نیاز دارد).
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. این متد توکن bearer جایگزین را فقط برای فراخوانی‌های همان دستگاه که از قبل با همان توکن دستگاه احراز هویت شده‌اند echo می‌کند، تا کلاینت‌های فقط‌توکن بتوانند جایگزین خود را پیش از اتصال دوباره پایدار ذخیره کنند. چرخش‌های مشترک/مدیر، توکن bearer را echo نمی‌کنند.
- صدور، چرخش، و ابطال توکن در محدوده مجموعه نقش‌های تأییدشده ثبت‌شده در ورودی pairing همان دستگاه باقی می‌ماند؛ تغییر توکن نمی‌تواند نقش دستگاهی را گسترش دهد یا هدف بگیرد که تأیید pairing هرگز اعطا نکرده است.
- برای نشست‌های توکن دستگاه pairingشده، مدیریت دستگاه self-scoped است مگر اینکه
  فراخواننده `operator.admin` نیز داشته باشد: فراخواننده‌های غیرمدیر فقط می‌توانند ورودی دستگاه **خودشان** را حذف/ابطال/چرخش کنند.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه scope توکن operator هدف را در برابر scopeهای نشست فعلی فراخواننده بررسی می‌کنند. فراخواننده‌های غیرمدیر نمی‌توانند توکن operator گسترده‌تری از آنچه خودشان دارند بچرخانند یا ابطال کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های مورد اعتماد می‌توانند یک تلاش دوباره محدود با توکن cacheشده برای هر دستگاه انجام دهند.
  - اگر آن تلاش دوباره شکست بخورد، کلاینت‌ها باید حلقه‌های اتصال دوباره خودکار را متوقف کنند و راهنمای اقدام operator را نمایش دهند.

## هویت دستگاه + pairing

- Nodeها باید یک هویت دستگاه پایدار (`device.id`) مشتق‌شده از
  اثرانگشت keypair داشته باشند.
- Gatewayها برای هر دستگاه + نقش توکن صادر می‌کنند.
- تأییدهای pairing برای شناسه‌های دستگاه جدید لازم هستند، مگر اینکه تأیید خودکار محلی فعال باشد.
- تأیید خودکار pairing بر اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر self-connect محدودِ backend/container-local برای
  جریان‌های helper مورد اعتماد با راز مشترک دارد.
- اتصال‌های tailnet یا LAN روی همان میزبان همچنان برای pairing به‌عنوان راه‌دور تلقی می‌شوند و
  به تأیید نیاز دارند.
- کلاینت‌های WS معمولاً هنگام `connect` هویت `device` را شامل می‌کنند (operator +
  node). تنها استثناهای operator بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط localhost.
  - احراز هویت موفق operator Control UI با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass، کاهش شدید امنیت).
  - RPCهای backend مستقیم-loopback `gateway-client` که با توکن/گذرواژه مشترک
    Gateway احراز هویت شده‌اند.
- همه اتصال‌ها باید nonce مربوط به `connect.challenge` ارائه‌شده توسط سرور را امضا کنند.

### تشخیص‌های مهاجرت احراز هویت دستگاه

برای کلاینت‌های legacy که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون کدهای جزئیات
`DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنا                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده (یا خالی فرستاده) است. |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce کهنه/نادرست امضا کرده است.        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload امضا با payload v2 مطابق نیست.            |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp امضاشده بیرون از skew مجاز است.         |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثرانگشت کلید عمومی مطابق نیست.    |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/canonicalization کلید عمومی ناموفق بود.      |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- payload v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- payload امضای ترجیحی `v3` است که علاوه بر فیلدهای device/client/role/scopes/token/nonce،
  `platform` و `deviceFamily` را نیز bind می‌کند.
- امضاهای legacy `v2` همچنان برای سازگاری پذیرفته می‌شوند، اما پین‌کردن فراداده دستگاه pairingشده همچنان policy فرمان را هنگام اتصال دوباره کنترل می‌کند.

## TLS + پین‌کردن

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثرانگشت گواهی Gateway را پین کنند (به پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` مراجعه کنید).

## scope

این پروتکل **API کامل Gateway** را در معرض دسترس قرار می‌دهد (وضعیت، کانال‌ها، مدل‌ها، chat،
agent، نشست‌ها، nodeها، تأییدها، و غیره). سطح دقیق توسط schemaهای
TypeBox در `src/gateway/protocol/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل Bridge](/fa/gateway/bridge-protocol)
- [runbook Gateway](/fa/gateway)
