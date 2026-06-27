---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS Gateway
    - اشکال‌زدایی عدم تطابق‌های پروتکل یا خطاهای اتصال
    - بازسازی طرح‌واره/مدل‌های پروتکل
summary: 'پروتکل WebSocket Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-06-27T17:48:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل WS ‏Gateway، **صفحه کنترل واحد + انتقال Node** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط کاربری وب، برنامه macOS، Nodeهای iOS/Android، Nodeهای
بدون رابط) از طریق WebSocket متصل می‌شوند و **نقش** + **دامنه** خود را در زمان
دست‌دهی اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود شده‌اند. پس از دست‌دهی موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. با فعال بودن diagnostics،
  فریم‌های ورودی بیش از اندازه و بافرهای خروجی کند، پیش از آنکه gateway فریم
  متأثر را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطوح، و کدهای دلیل امن را نگه می‌دارند. آن‌ها بدنه پیام،
  محتوای پیوست، بدنه خام فریم، توکن‌ها، کوکی‌ها، یا مقادیر محرمانه را نگه نمی‌دارند.

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

درحالی‌که Gateway هنوز در حال تکمیل sidecarهای راه‌اندازی است، درخواست `connect` می‌تواند
یک خطای قابل تلاش مجدد `UNAVAILABLE` برگرداند که `details.reason` آن روی
`"startup-sidecars"` تنظیم شده و `retryAfterMs` دارد. کلاینت‌ها باید این پاسخ را
در محدوده بودجه کلی اتصال خود دوباره امتحان کنند، نه اینکه آن را به‌عنوان شکست نهایی
دست‌دهی نمایش دهند.

`server`، `features`، `snapshot`، و `policy` همگی طبق schema
(`packages/gateway-protocol/src/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/دامنه‌های توافق‌شده را گزارش می‌کند. `pluginSurfaceUrls` اختیاری است و نام سطح‌های plugin،
مانند `canvas`، را به URLهای میزبانی‌شده دامنه‌دار نگاشت می‌کند.

URLهای سطح plugin دامنه‌دار ممکن است منقضی شوند. Nodeها می‌توانند
`node.pluginSurface.refresh` را با `{ "surface": "canvas" }` فراخوانی کنند تا یک ورودی تازه
در `pluginSurfaceUrls` دریافت کنند. بازآرایی آزمایشی Canvas plugin از مسیر سازگاری منسوخ
`canvasHostUrl`، `canvasCapability`، یا
`node.canvas.capability.refresh` پشتیبانی نمی‌کند؛ کلاینت‌های بومی و gatewayهای فعلی
باید از سطح‌های plugin استفاده کنند.

وقتی هیچ توکن دستگاهی صادر نشده باشد، `hello-ok.auth` مجوزهای توافق‌شده را بدون فیلدهای توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend قابل اعتماد در همان فرایند (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصالات مستقیم loopback، وقتی با توکن/گذرواژه مشترک gateway
احراز هویت می‌شوند، `device` را حذف کنند. این مسیر برای RPCهای داخلی صفحه کنترل رزرو شده است
و مانع می‌شود baselineهای قدیمی جفت‌سازی CLI/دستگاه، کارهای backend محلی مانند به‌روزرسانی‌های
نشست subagent را مسدود کنند. کلاینت‌های راه‌دور، کلاینت‌های با خاستگاه مرورگر، کلاینت‌های Node،
و کلاینت‌های صریح توکن دستگاه/هویت دستگاه همچنان از بررسی‌های عادی جفت‌سازی و ارتقای دامنه استفاده می‌کنند.

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

bootstrap داخلی QR/setup-code یک مسیر تحویل تازه برای موبایل است. یک اتصال موفق
setup-code پایه، یک توکن Node اصلی به‌همراه یک توکن operator محدود برمی‌گرداند:

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

تحویل operator عمداً محدود است تا onboarding با QR بتواند حلقه operator موبایل را بدون اعطای
`operator.admin` یا `operator.pairing` شروع کند.
این شامل `operator.talk.secrets` هست تا کلاینت بومی بتواند پس از bootstrap، پیکربندی Talk
موردنیاز خود را بخواند. دامنه‌های گسترده‌تر admin و pairing به یک جفت‌سازی operator تأییدشده جداگانه
یا جریان توکن جداگانه نیاز دارند. کلاینت‌ها باید `hello-ok.auth.deviceTokens` را فقط
وقتی اتصال از auth مربوط به bootstrap روی انتقال قابل اعتماد مانند `wss://` یا
جفت‌سازی loopback/local استفاده کرده است، پایدار کنند.

### نمونه Node

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

برای مدل کامل دامنه operator، بررسی‌های زمان تأیید، و معناشناسی secret مشترک،
[دامنه‌های operator](/fa/gateway/operator-scopes) را ببینید.

### نقش‌ها

- `operator` = کلاینت صفحه کنترل (CLI/UI/اتوماسیون).
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

روش‌های RPC در Gateway که توسط Plugin ثبت شده‌اند ممکن است دامنه operator خودشان را درخواست کنند، اما
پیشوندهای رزرو‌شده مدیریت هسته (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` نگاشت می‌شوند.

دامنه روش فقط نخستین دروازه است. برخی دستورهای اسلش که از طریق
`chat.send` در دسترس قرار می‌گیرند، افزون بر آن بررسی‌های سخت‌گیرانه‌تری در سطح دستور اعمال می‌کنند. برای مثال، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` نیز افزون بر دامنه پایه روش، یک بررسی دامنه اضافی در زمان تأیید دارد:

- درخواست‌های بدون دستور: `operator.pairing`
- درخواست‌های دارای دستورهای Node غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare` یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### قابلیت‌ها/دستورها/مجوزها (node)

Nodeها هنگام اتصال، ادعاهای قابلیت را اعلام می‌کنند:

- `caps`: دسته‌های قابلیت سطح‌بالا مانند `camera`، `canvas`، `screen`،
  `location`، `voice` و `talk`.
- `commands`: فهرست مجاز دستورها برای فراخوانی.
- `permissions`: کلیدهای جزئی (برای نمونه `screen.record`، `camera.capture`).

Gateway این موارد را به‌عنوان **ادعا** در نظر می‌گیرد و فهرست‌های مجاز سمت سرور را اعمال می‌کند.

## حضور

- `system-presence` مدخل‌هایی را برمی‌گرداند که با هویت دستگاه کلیدگذاری شده‌اند.
- مدخل‌های حضور شامل `deviceId`، `roles` و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف واحد نشان دهند،
  حتی وقتی همان دستگاه هم به‌عنوان **operator** و هم به‌عنوان **node** متصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. Nodeهای متصل
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ Nodeهای جفت‌شده همچنین می‌توانند
  وقتی یک رویداد Node مورد اعتماد فراداده جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، حضور پس‌زمینه پایدار را گزارش کنند.

### رویداد زنده‌بودن پس‌زمینه Node

Nodeها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک Node جفت‌شده
در جریان بیدارباش پس‌زمینه زنده بوده، بدون اینکه به‌عنوان متصل علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual` یا `connect`. رشته‌های trigger ناشناخته پیش از پایدارسازی توسط Gateway به
`background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه Node احراز هویت‌شده
پایدار است؛ نشست‌های بدون دستگاه یا جفت‌نشده `handled: false` برمی‌گردانند.

Gatewayهای موفق یک نتیجه ساخت‌یافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gatewayهای قدیمی‌تر ممکن است همچنان برای `node.event` مقدار `{ "ok": true }` برگردانند؛ کلاینت‌ها باید آن را یک
RPC تأییدشده در نظر بگیرند، نه پایدارسازی ماندگار حضور.

## دامنه‌بندی رویدادهای پخش همگانی

رویدادهای پخش همگانی WebSocket که از سمت سرور ارسال می‌شوند با دامنه کنترل می‌شوند تا نشست‌های محدود به جفت‌سازی یا فقط Node، محتوای نشست را به‌صورت غیرفعال دریافت نکنند.

- **فریم‌های چت، عامل و نتیجه ابزار** (از جمله رویدادهای جاری `agent` و نتایج فراخوانی ابزار) دست‌کم به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را کاملاً رد می‌کنند.
- **پخش‌های `plugin.*` تعریف‌شده توسط Plugin** بسته به اینکه Plugin چگونه آن‌ها را ثبت کرده است، با `operator.write` یا `operator.admin` کنترل می‌شوند.
- **رویدادهای وضعیت و انتقال** (`heartbeat`، `presence`، `tick`، چرخه عمر اتصال/قطع اتصال و غیره) بدون محدودیت باقی می‌مانند تا سلامت انتقال برای هر نشست احراز هویت‌شده قابل مشاهده باشد.
- **خانواده‌های ناشناخته رویداد پخش همگانی** به‌طور پیش‌فرض با دامنه کنترل می‌شوند (fail-closed)، مگر اینکه یک handler ثبت‌شده صراحتاً آن‌ها را آسان‌گیرتر کند.

هر اتصال کلاینت شماره توالی مختص همان کلاینت را نگه می‌دارد تا پخش‌های همگانی روی آن socket ترتیب یکنوای خود را حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوتِ فیلترشده بر اساس دامنه را از جریان رویداد می‌بینند.

## خانواده‌های رایج روش‌های RPC

سطح عمومی WS گسترده‌تر از نمونه‌های handshake/auth بالاست. این
یک dump تولیدشده نیست — `hello-ok.features.methods` فهرست اکتشافی محافظه‌کارانه‌ای است که از `src/gateway/server-methods-list.ts` به‌علاوه exportهای روش Plugin/channel بارگذاری‌شده ساخته شده است. آن را اکتشاف قابلیت بدانید، نه
فهرست کامل `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` تصویر لحظه‌ای سلامت Gateway را که از حافظهٔ نهان آمده یا تازه بررسی شده است برمی‌گرداند.
    - `diagnostics.stability` ضبط‌کنندهٔ پایداری تشخیصی محدود اخیر را برمی‌گرداند. این مورد فرادادهٔ عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایتی، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/Plugin، و شناسه‌های نشست را نگه می‌دارد. متن چت، بدنه‌های Webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، یا مقادیر محرمانه را نگه نمی‌دارد. دامنهٔ خواندن عملگر لازم است.
    - `status` خلاصهٔ Gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های عملگر با دامنهٔ ادمین گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه Gateway را که جریان‌های رله و جفت‌سازی از آن استفاده می‌کنند برمی‌گرداند.
    - `system-presence` تصویر لحظه‌ای حضور فعلی را برای دستگاه‌های عملگر/Node متصل برمی‌گرداند.
    - `system-event` یک رویداد سیستمی اضافه می‌کند و می‌تواند زمینهٔ حضور را به‌روزرسانی/پخش کند.
    - `last-heartbeat` آخرین رویداد Heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را روی Gateway روشن یا خاموش می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و مصرف">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازهٔ انتخابگر (`agents.defaults.models` در ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را پاس دهید، یا برای کاتالوگ کامل مقدار `{ "view": "all" }` را پاس دهید.
    - `usage.status` خلاصه‌های پنجره‌های مصرف/سهمیهٔ باقی‌ماندهٔ ارائه‌دهنده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیع‌شدهٔ مصرف هزینه را برای یک بازهٔ تاریخی برمی‌گرداند.
      برای یک عامل `agentId` را پاس دهید، یا برای تجمیع عامل‌های پیکربندی‌شده `agentScope: "all"` را پاس دهید.
    - `doctor.memory.status` آمادگی حافظهٔ برداری / امبدینگ ذخیره‌شده در حافظهٔ نهان را برای فضای کاری عامل پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخواننده صریحاً پینگ زندهٔ ارائه‌دهندهٔ امبدینگ را می‌خواهد، `{ "probe": true }` یا `{ "deep": true }` را پاس دهید. کلاینت‌های آگاه از Dreaming همچنین می‌توانند `{ "agentId": "agent-id" }` را پاس دهند تا آمار فروشگاه Dreaming به فضای کاری عامل انتخاب‌شده محدود شود؛ حذف `agentId` جایگزین عامل پیش‌فرض را نگه می‌دارد و فضاهای کاری Dreaming پیکربندی‌شده را تجمیع می‌کند.
    - `doctor.memory.dreamDiary`، `doctor.memory.backfillDreamDiary`، `doctor.memory.resetDreamDiary`، `doctor.memory.resetGroundedShortTerm`، `doctor.memory.repairDreamingArtifacts`، و `doctor.memory.dedupeDreamDiary` پارامترهای اختیاری `{ "agentId": "agent-id" }` را برای نماها/کنش‌های Dreaming عامل انتخاب‌شده می‌پذیرند. وقتی `agentId` حذف شود، آن‌ها روی فضای کاری عامل پیش‌فرض پیکربندی‌شده عمل می‌کنند.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از هارنس REM را برای کلاینت‌های صفحهٔ کنترل راه‌دور برمی‌گرداند. این می‌تواند مسیرهای فضای کاری، قطعه‌های حافظه، مارک‌داون مستقرشدهٔ رندرشده، و نامزدهای ارتقای عمیق را شامل شود، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های مصرف به‌ازای هر نشست را برمی‌گرداند. برای یک
      عامل `agentId` را پاس دهید، یا برای فهرست‌کردن عامل‌های پیکربندی‌شده با هم `agentScope: "all"` را پاس دهید.
    - `sessions.usage.timeseries` مصرف سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` مدخل‌های گزارش مصرف را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + بسته‌بندی‌شده را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، در جایی که کانال از خروج پشتیبانی می‌کند، خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/وب را برای ارائه‌دهندهٔ کانال وب فعلی که قابلیت QR دارد شروع می‌کند.
    - `web.login.wait` منتظر تکمیل آن جریان ورود QR/وب می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک پوش APNs آزمایشی به یک Node iOS ثبت‌شده می‌فرستد.
    - `voicewake.get` محرک‌های واژهٔ بیدارباش ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` محرک‌های واژهٔ بیدارباش را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و گزارش‌ها">
    - `send` فراخوانی RPC تحویل خروجی مستقیم برای ارسال‌های هدف‌گیری‌شده به کانال/حساب/رشته خارج از اجراکنندهٔ چت است.
    - `logs.tail` دنبالهٔ گزارش فایل Gateway پیکربندی‌شده را با کنترل‌های مکان‌نما/محدودیت و بیشینهٔ بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="گفتار و TTS">
    - `talk.catalog` کاتالوگ فقط‌خواندنی ارائه‌دهندهٔ گفتار را برای گفتار، رونویسی جریانی، و صدای بلادرنگ برمی‌گرداند. این شامل شناسه‌های ارائه‌دهنده، برچسب‌ها، وضعیت پیکربندی‌شده، شناسه‌های مدل/صدای آشکارشده، حالت‌های متعارف، انتقال‌ها، راهبردهای مغز، و پرچم‌های صوت/قابلیت بلادرنگ است، بدون اینکه اسرار ارائه‌دهنده را برگرداند یا پیکربندی سراسری را تغییر دهد.
    - `talk.config` بار مؤثر پیکربندی گفتار را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.session.create` یک نشست گفتار متعلق به Gateway برای `realtime/gateway-relay`، `transcription/gateway-relay`، یا `stt-tts/managed-room` ایجاد می‌کند. برای `stt-tts/managed-room`، فراخواننده‌های `operator.write` که `sessionKey` را پاس می‌دهند باید برای رؤیت‌پذیری کلید نشست دامنه‌دار `spawnedBy` را نیز پاس دهند؛ ایجاد `sessionKey` بدون دامنه و `brain: "direct-tools"` به `operator.admin` نیاز دارند.
    - `talk.session.join` یک توکن نشست اتاق مدیریت‌شده را اعتبارسنجی می‌کند، در صورت نیاز رویدادهای `session.ready` یا `session.replaced` را منتشر می‌کند، و فرادادهٔ اتاق/نشست به‌همراه رویدادهای گفتار اخیر را بدون توکن متن ساده یا هش توکن ذخیره‌شده برمی‌گرداند.
    - `talk.session.appendAudio` صدای ورودی PCM با کدگذاری base64 را به نشست‌های رلهٔ بلادرنگ و رونویسی متعلق به Gateway اضافه می‌کند.
    - `talk.session.startTurn`، `talk.session.endTurn`، و `talk.session.cancelTurn` چرخهٔ عمر نوبت اتاق مدیریت‌شده را با رد نوبت کهنه پیش از پاک‌شدن وضعیت هدایت می‌کنند.
    - `talk.session.cancelOutput` خروجی صوتی دستیار را متوقف می‌کند، عمدتاً برای ورود میان‌گفتاری محافظت‌شده با VAD در نشست‌های رلهٔ Gateway.
    - `talk.session.submitToolResult` یک فراخوانی ابزار ارائه‌دهنده را که توسط یک نشست رلهٔ بلادرنگ متعلق به Gateway منتشر شده است کامل می‌کند. وقتی نتیجهٔ نهایی در ادامه می‌آید، برای خروجی موقت ابزار `options: { willContinue: true }` را پاس دهید، یا وقتی نتیجهٔ ابزار باید فراخوانی ارائه‌دهنده را بدون شروع پاسخ بلادرنگ دیگر از دستیار برآورده کند، `options: { suppressResponse: true }` را پاس دهید.
    - `talk.session.steer` کنترل صوتی اجرای فعال را به یک نشست گفتار عامل‌پشتوانهٔ متعلق به Gateway می‌فرستد. این `{ sessionId, text, mode? }` را می‌پذیرد، که در آن `mode` برابر `status`، `steer`، `cancel`، یا `followup` است؛ حالت حذف‌شده از متن گفتاری طبقه‌بندی می‌شود.
    - `talk.session.close` یک نشست رله، رونویسی، یا اتاق مدیریت‌شدهٔ متعلق به Gateway را می‌بندد و رویدادهای پایانی گفتار را منتشر می‌کند.
    - `talk.mode` وضعیت حالت گفتار فعلی را برای کلاینت‌های WebChat/رابط کاربری کنترل تنظیم/پخش می‌کند.
    - `talk.client.create` یک نشست ارائه‌دهندهٔ بلادرنگ متعلق به کلاینت را با استفاده از `webrtc` یا `provider-websocket` ایجاد می‌کند، در حالی که Gateway مالک پیکربندی، اعتبارنامه‌ها، دستورالعمل‌ها، و سیاست ابزار است.
    - `talk.client.toolCall` به انتقال‌های بلادرنگ متعلق به کلاینت اجازه می‌دهد فراخوانی‌های ابزار ارائه‌دهنده را به سیاست Gateway ارسال کنند. نخستین ابزار پشتیبانی‌شده `openclaw_agent_consult` است؛ کلاینت‌ها یک شناسهٔ اجرا دریافت می‌کنند و پیش از ارسال نتیجهٔ ابزار ویژهٔ ارائه‌دهنده منتظر رویدادهای چرخهٔ عمر معمول چت می‌مانند.
    - `talk.client.steer` کنترل صوتی اجرای فعال را برای انتقال‌های بلادرنگ متعلق به کلاینت می‌فرستد. Gateway اجرای تعبیه‌شدهٔ فعال را از `sessionKey` حل می‌کند و به‌جای رهاکردن بی‌صدای هدایت، یک نتیجهٔ ساختاریافتهٔ پذیرفته/ردشده برمی‌گرداند.
    - `talk.event` کانال رویداد واحد گفتار برای آداپتورهای بلادرنگ، رونویسی، STT/TTS، اتاق مدیریت‌شده، تلفنی، و جلسه است.
    - `talk.speak` گفتار را از طریق ارائه‌دهندهٔ گفتار فعال سنتز می‌کند.
    - `tts.status` وضعیت فعال‌بودن TTS، ارائه‌دهندهٔ فعال، ارائه‌دهندگان جایگزین، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` موجودی قابل‌مشاهدهٔ ارائه‌دهندگان TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را روشن یا خاموش می‌کنند.
    - `tts.setProvider` ارائه‌دهندهٔ ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌بارهٔ متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و جادوگر">
    - `secrets.reload` SecretRefهای فعال را دوباره حل می‌کند و فقط در صورت موفقیت کامل، وضعیت اسرار زمان اجرا را جابه‌جا می‌کند.
    - `secrets.resolve` انتساب‌های سری هدف‌گرفته به فرمان را برای یک مجموعهٔ فرمان/هدف مشخص حل می‌کند.
    - `config.get` تصویر لحظه‌ای پیکربندی و هش فعلی را برمی‌گرداند.
    - `config.set` یک بار پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را ادغام می‌کند. جایگزینی مخرب آرایه
      مستلزم وجود مسیر متأثر در `replacePaths` است؛ آرایه‌های تو در تو
      زیر مدخل‌های آرایه از مسیرهای `[]` مانند `agents.list[].skills` استفاده می‌کنند.
    - `config.apply` کل بار پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` بار طرح پیکربندی زنده‌ای را که رابط کاربری کنترل و ابزارهای CLI استفاده می‌کنند برمی‌گرداند: طرح، `uiHints`، نسخه، و فرادادهٔ تولید، شامل فرادادهٔ طرح Plugin + کانال وقتی زمان اجرا بتواند آن را بارگذاری کند. طرح شامل فرادادهٔ فیلد `title` / `description` است که از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط رابط کاربری مشتق شده‌اند، از جمله شاخه‌های ترکیبی شیء تو در تو، وایلدکارت، آیتم آرایه، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد منطبق وجود دارد.
    - `config.schema.lookup` یک بار جست‌وجوی محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک گرهٔ طرح کم‌عمق، راهنمای منطبق + `hintPath`، `reloadKind` اختیاری، و خلاصه‌های فرزند فوری برای واکاوی رابط کاربری/CLI. `reloadKind` یکی از `restart`، `hot`، یا `none` است و برنامه‌ریز بارگذاری مجدد پیکربندی Gateway را برای مسیر درخواست‌شده بازتاب می‌دهد. گره‌های طرح جست‌وجو مستندات روبه‌کاربر و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، حدود عددی/رشته‌ای/آرایه‌ای/شیئی، و پرچم‌هایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، `reloadKind` اختیاری، به‌علاوهٔ `hint` / `hintPath` منطبق را آشکار می‌کنند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد یک راه‌اندازی مجدد زمان‌بندی می‌کند؛ فراخواننده‌های دارای نشست می‌توانند `continuationMessage` را شامل کنند تا راه‌اندازی یک نوبت پیگیری عامل را از طریق صف ادامهٔ راه‌اندازی مجدد از سر بگیرد. به‌روزرسانی‌های مدیر بسته و به‌روزرسانی‌های git-checkout تحت نظارت از صفحهٔ کنترل، به‌جای جایگزین‌کردن درخت بسته یا تغییر خروجی checkout/build داخل Gateway زنده، از تحویل سرویس مدیریت‌شدهٔ جداشده استفاده می‌کنند. یک تحویل شروع‌شده `ok: true` را با `result.reason: "managed-service-handoff-started"` و `handoff.status: "started"` برمی‌گرداند؛ تحویل‌های در دسترس نبودن یا ناموفق `ok: false` را با `managed-service-handoff-unavailable` یا `managed-service-handoff-failed`، به‌علاوهٔ `handoff.command` وقتی به به‌روزرسانی دستی shell نیاز است، برمی‌گردانند. تحویل در دسترس نبودن یعنی OpenClaw فاقد مرز ناظر امن یا هویت سرویس پایدار است، مانند `OPENCLAW_SYSTEMD_UNIT` برای systemd. طی یک تحویل شروع‌شده، نگهبان راه‌اندازی مجدد ممکن است برای مدت کوتاهی `stats.reason: "restart-health-pending"` را گزارش کند؛ ادامه تا زمانی که CLI، Gateway راه‌اندازی‌مجددشده را تأیید کند و نگهبان نهایی `ok` را بنویسد به تأخیر می‌افتد.
    - `update.status` تازه‌ترین نگهبان راه‌اندازی مجدد به‌روزرسانی را تازه‌سازی و برمی‌گرداند، از جمله نسخهٔ در حال اجرای پس از راه‌اندازی مجدد وقتی در دسترس باشد.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` جادوگر راه‌اندازی اولیه را از طریق WS RPC آشکار می‌کنند.

  </Accordion>

  <Accordion title="کمک‌کارهای عامل و فضای کاری">
    - `agents.list` مدخل‌های عامل پیکربندی‌شده را، شامل مدل مؤثر و فرادادهٔ زمان اجرا، برمی‌گرداند.
    - `agents.create`، `agents.update` و `agents.delete` رکوردهای عامل و اتصال‌های فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get` و `agents.files.set` فایل‌های فضای کاری راه‌اندازی اولیه را که برای یک عامل در معرض دسترس قرار می‌گیرند مدیریت می‌کنند.
    - `tasks.list`، `tasks.get` و `tasks.cancel` دفترکل وظایف Gateway را در اختیار کلاینت‌های SDK و اپراتور قرار می‌دهند.
    - `artifacts.list`، `artifacts.get` و `artifacts.download` خلاصه‌های آرتیفکت مشتق‌شده از رونوشت و دانلودها را برای دامنهٔ صریح `sessionKey`، `runId` یا `taskId` در اختیار می‌گذارند. پرس‌وجوهای اجرا و وظیفه، نشست مالک را در سمت سرور resolve می‌کنند و فقط رسانه‌های رونوشت با منشأ مطابق را برمی‌گردانند؛ منابع URL ناامن یا محلی، به‌جای واکشی در سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `environments.list` و `environments.status` کشف محیط محلی Gateway و محیط Node را به‌صورت فقط‌خواندنی در اختیار کلاینت‌های SDK قرار می‌دهند.
    - `agent.identity.get` هویت مؤثر دستیار را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک اجرا می‌ماند و در صورت موجود بودن، snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` نمایهٔ نشست فعلی را، شامل فرادادهٔ `agentRuntime` در هر ردیف وقتی backend زمان اجرای عامل پیکربندی شده باشد، برمی‌گرداند.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک رویدادهای تغییر نشست را برای کلاینت WS فعلی روشن یا خاموش می‌کنند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک رویدادهای رونوشت/پیام را برای یک نشست روشن یا خاموش می‌کنند.
    - `sessions.preview` پیش‌نمایش‌های محدود رونوشت را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.describe` یک ردیف نشست Gateway را برای یک کلید نشست دقیق برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را resolve یا canonical می‌کند.
    - `sessions.create` یک مدخل نشست جدید ایجاد می‌کند.
    - `sessions.send` پیامی را به یک نشست موجود می‌فرستد.
    - `sessions.steer` گونهٔ قطع‌کردن-و-هدایت برای یک نشست فعال است.
    - `sessions.abort` کار فعال یک نشست را abort می‌کند. فراخواننده می‌تواند `key` به‌همراه `runId` اختیاری بفرستد، یا برای اجراهای فعالی که Gateway می‌تواند به یک نشست resolve کند، فقط `runId` را بفرستد.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌همراه `agentRuntime` مؤثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete` و `sessions.compact` نگهداری نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort` و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌شکل نمایشی نرمال‌سازی می‌شود: تگ‌های directive درون‌خطی از متن قابل‌مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شدهٔ فراخوانی ابزار) و توکن‌های کنترلی مدل ASCII/تمام‌عرض نشت‌کرده حذف می‌شوند، ردیف‌های دستیارِ صرفاً silent-token مانند `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.
    - `chat.message.get` خوانندهٔ افزایشی و محدود پیام کامل برای یک مدخل رونوشت قابل‌مشاهده است. کلاینت‌ها `sessionKey`، در صورت agent-scoped بودن انتخاب نشست، `agentId` اختیاری، به‌همراه `messageId` رونوشت را که قبلاً از طریق `chat.history` ارائه شده است می‌فرستند، و Gateway همان projection نرمال‌شده برای نمایش را بدون سقف کوتاه‌سازی history سبک برمی‌گرداند، وقتی مدخل ذخیره‌شده هنوز موجود باشد و بیش‌ازحد بزرگ نباشد.
    - `chat.send` مقدار یک‌نوبتی `fastMode: "auto"` را می‌پذیرد تا برای فراخوانی‌های مدل که پیش از cutoff خودکار شروع شده‌اند از حالت سریع استفاده کند، سپس فراخوانی‌های retry، fallback، نتیجهٔ ابزار یا ادامه را بعداً بدون حالت سریع شروع کند. مقدار پیش‌فرض cutoff برابر ۶۰ ثانیه است و می‌توان آن را برای هر مدل با `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` پیکربندی کرد. فراخوانندهٔ `chat.send` می‌تواند `fastAutoOnSeconds` یک‌نوبتی بفرستد تا cutoff را برای آن درخواست override کند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و توکن‌های دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شدهٔ در انتظار و تأییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject` و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` یک توکن دستگاه جفت‌شده را در محدوده‌های نقش تأییدشده و دامنهٔ فراخوانندهٔ آن rotate می‌کند.
    - `device.token.revoke` یک توکن دستگاه جفت‌شده را در محدوده‌های نقش تأییدشده و دامنهٔ فراخوانندهٔ آن revoke می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، invoke و کارهای در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove` و `node.pair.verify` جفت‌سازی Node و راستی‌آزمایی bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک Node متصل forward می‌کند.
    - `node.invoke.result` نتیجهٔ یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای منشأگرفته از Node را به gateway برمی‌گرداند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کارهای در انتظار پایدار را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تأیید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list` و `exec.approval.resolve` درخواست‌های تأیید یک‌بارهٔ exec به‌همراه lookup/replay تأییدهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` روی یک تأیید exec در انتظار منتظر می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در صورت timeout مقدار `null`).
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای سیاست تأیید exec در gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تأیید exec محلی Node را از طریق فرمان‌های relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision` و `plugin.approval.resolve` جریان‌های تأیید تعریف‌شده توسط plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills و ابزارها">
    - اتوماسیون: `wake` تزریق فوری متن wake یا تزریق در Heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.get`، `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کارهای زمان‌بندی‌شده را مدیریت می‌کنند.
    - `cron.run` همچنان یک RPC از نوع enqueue برای اجراهای دستی است. کلاینت‌هایی که به معنای تکمیل نیاز دارند باید `runId` برگشتی را بخوانند و `cron.runs` را poll کنند.
    - `cron.runs` یک فیلتر اختیاری و غیرخالی `runId` می‌پذیرد تا کلاینت‌ها بتوانند یک اجرای دستی صف‌شده را بدون رقابت با دیگر مدخل‌های history همان job دنبال کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رویداد رایج

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و سایر رویدادهای چتِ فقط‌رونوشت.
  در protocol v4، payloadهای delta مقدار `deltaText` را حمل می‌کنند؛ `message` همچنان
  snapshot تجمعی دستیار است. جایگزینی‌های غیرپیشوندی `replace=true`
  تنظیم می‌کنند و از `deltaText` به‌عنوان متن جایگزین استفاده می‌کنند.
- `session.message`، `session.operation` و `session.tool`: به‌روزرسانی‌های رونوشت،
  عملیات نشست درحال‌اجرا، و event-stream برای یک نشست مشترک‌شده.
- `sessions.changed`: نمایهٔ نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / liveness.
- `health`: به‌روزرسانی snapshot سلامت gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد heartbeat.
- `cron`: رویداد تغییر اجرای cron/job.
- `shutdown`: اعلان خاموشی gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخهٔ عمر جفت‌سازی Node.
- `node.invoke.request`: broadcast درخواست invoke برای Node.
- `device.pair.requested` / `device.pair.resolved`: چرخهٔ عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی تریگر wake-word تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: چرخهٔ عمر تأیید exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخهٔ عمر تأیید plugin.

### متدهای کمک‌کار Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی executableهای skill
  را برای بررسی‌های auto-allow واکشی کنند.

### RPCهای دفترکل وظایف

کلاینت‌های اپراتور می‌توانند رکوردهای وظایف پس‌زمینهٔ Gateway را از طریق
RPCهای دفترکل وظایف بررسی و لغو کنند. این متدها خلاصه‌های پاک‌سازی‌شدهٔ وظیفه را برمی‌گردانند، نه
وضعیت خام زمان اجرا.

- `tasks.list` به `operator.read` نیاز دارد.
  - Params: مقدار اختیاری `status` (`"queued"`، `"running"`، `"completed"`،
    `"failed"`، `"cancelled"` یا `"timed_out"`) یا آرایه‌ای از آن وضعیت‌ها،
    `agentId` اختیاری، `sessionKey` اختیاری، `limit` اختیاری از `1` تا
    `500`، و `cursor` رشته‌ای اختیاری.
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` به `operator.read` نیاز دارد.
  - Params: `{ "taskId": string }`.
  - Result: `{ "task": TaskSummary }`.
  - شناسه‌های وظیفهٔ ناموجود، شکل خطای not-found مربوط به Gateway را برمی‌گردانند.
- `tasks.cancel` به `operator.write` نیاز دارد.
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` گزارش می‌دهد که آیا دفترکل وظیفهٔ مطابق داشته است یا نه. `cancelled`
    گزارش می‌دهد که آیا زمان اجرا لغو را پذیرفته یا ثبت کرده است یا نه.

`TaskSummary` شامل `id`، `status` و فرادادهٔ اختیاری مانند `kind`،
`runtime`، `title`، `agentId`، `sessionKey`، `childSessionKey`، `ownerKey`،
`runId`، `taskId`، `flowId`، `parentTaskId`، `sourceId`، timestampها، progress،
خلاصهٔ پایانی، و متن خطای پاک‌سازی‌شده است. `agentId` عاملی را مشخص می‌کند که
وظیفه را اجرا می‌کند؛ `sessionKey` و `ownerKey` زمینهٔ درخواست‌دهنده و کنترل را
حفظ می‌کنند.

### متدهای کمک‌کار اپراتور

- اپراتورها می‌توانند برای دریافت فهرست فرمان‌های زمان اجرای یک عامل، `commands.list` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - `scope` کنترل می‌کند سطحی که `name` اصلی هدف می‌گیرد کدام است:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both`، در صورت وجود، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` نام فرمان بومی آگاه از ارائه‌دهنده را، وقتی وجود داشته باشد، حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی و دسترس‌پذیری فرمان Plugin بومی اثر می‌گذارد.
  - `includeArgs=false` فراداده سریال‌شده آرگومان را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند برای دریافت کاتالوگ ابزار زمان اجرای یک عامل، `tools.catalog` (`operator.read`) را فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` است
  - `optional`: اینکه آیا ابزار Plugin اختیاری است یا نه
- اپراتورها می‌توانند برای دریافت فهرست ابزارهای مؤثر در زمان اجرا برای یک نشست، `tools.effective` (`operator.read`) را فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا زمینه تحویل ارائه‌شده توسط فراخوان، زمینه قابل اعتماد زمان اجرا را از سمت سرور نشست استخراج می‌کند.
  - پاسخ یک نمای مشتق‌شده از سرور و محدود به نشست از فهرست فعال است، شامل ابزارهای هسته، Plugin، کانال، و ابزارهای سرور MCP که از قبل کشف شده‌اند.
  - `tools.effective` برای MCP فقط خواندنی است: ممکن است یک کاتالوگ MCP نشست گرم را از طریق سیاست نهایی ابزار نمایش دهد، اما زمان‌اجراهای MCP را ایجاد نمی‌کند، انتقال‌ها را وصل نمی‌کند، یا `tools/list` صادر نمی‌کند. اگر کاتالوگ گرم منطبقی وجود نداشته باشد، پاسخ ممکن است اعلانی مانند `mcp-not-yet-connected`، `mcp-not-yet-listed`، یا `mcp-stale-catalog` داشته باشد.
  - ورودی‌های ابزار مؤثر از `source="core"`، `source="plugin"`، `source="channel"`، یا `source="mcp"` استفاده می‌کنند.
- اپراتورها می‌توانند برای فراخوانی یک ابزار در دسترس از همان مسیر سیاست Gateway مانند `/tools/invoke`، `tools.invoke` (`operator.write`) را فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm`، و `idempotencyKey` اختیاری هستند.
  - اگر هم `sessionKey` و هم `agentId` وجود داشته باشند، عامل نشست حل‌شده باید با `agentId` مطابقت داشته باشد.
  - پوشش‌دهنده‌های هسته فقط‌مالک مانند `cron`، `gateway`، و `nodes` به هویت مالک/مدیر (`operator.admin`) نیاز دارند، هرچند خود متد `tools.invoke` برابر با `operator.write` است.
  - پاسخ یک پاکت رو به SDK با فیلدهای `ok`، `toolName`، `output` اختیاری، و `error` تایپ‌شده است. ردهای تأیید یا سیاست به‌جای دور زدن خط لوله سیاست ابزار Gateway، در payload مقدار `ok:false` برمی‌گردانند.
- اپراتورها می‌توانند برای دریافت فهرست Skills قابل مشاهده برای یک عامل، `skills.status` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های کمبود، بررسی‌های پیکربندی، و گزینه‌های نصب پاک‌سازی‌شده است، بدون افشای مقادیر خام محرمانه.
- اپراتورها می‌توانند برای فراداده کشف ClawHub، `skills.search` و `skills.detail` (`operator.read`) را فراخوانی کنند.
- اپراتورها می‌توانند برای آماده‌سازی یک آرشیو Skills خصوصی پیش از نصب آن، `skills.upload.begin`، `skills.upload.chunk`، و `skills.upload.commit` (`operator.admin`) را فراخوانی کنند. این یک مسیر بارگذاری مدیریتی جداگانه برای کلاینت‌های مورد اعتماد است، نه جریان نصب عادی Skills از ClawHub، و به‌طور پیش‌فرض غیرفعال است مگر اینکه `skills.install.allowUploadedArchives` فعال باشد.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    یک بارگذاری وابسته به آن slug و مقدار force ایجاد می‌کند.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` بایت‌ها را در offset دقیقِ کدگشایی‌شده اضافه می‌کند.
  - `skills.upload.commit({ uploadId, sha256? })` اندازه نهایی و SHA-256 را راستی‌آزمایی می‌کند. Commit فقط بارگذاری را نهایی می‌کند؛ Skills را نصب نمی‌کند.
  - آرشیوهای Skills بارگذاری‌شده، آرشیوهای zip شامل یک ریشه `SKILL.md` هستند. نام دایرکتوری داخلی آرشیو هرگز هدف نصب را انتخاب نمی‌کند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در سه حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه Skills را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت بارگذاری: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    یک بارگذاری commit‌شده را در دایرکتوری `skills/<slug>` فضای کاری عامل پیش‌فرض نصب می‌کند. مقدار slug و force باید با درخواست اصلی `skills.upload.begin` مطابقت داشته باشد. این حالت رد می‌شود مگر اینکه `skills.install.allowUploadedArchives` فعال باشد. این تنظیم بر نصب‌های ClawHub اثر نمی‌گذارد.
  - حالت نصب‌کننده Gateway: `{ name, installId, timeoutMs? }`
    یک کنش اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند. کلاینت‌های قدیمی‌تر ممکن است همچنان `dangerouslyForceUnsafeInstall` را ارسال کنند؛ این فیلد منسوخ شده، فقط برای سازگاری پروتکل پذیرفته می‌شود، و نادیده گرفته می‌شود. برای تصمیم‌های نصب تحت مالکیت اپراتور از `security.installPolicy` استفاده کنید.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug رهگیری‌شده یا همه نصب‌های ClawHub رهگیری‌شده را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`، `apiKey`، و `env` را وصله می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ کاتالوگ مجاز است، شامل مدل‌های کشف‌شده پویا برای ورودی‌های `provider/*`. در غیر این صورت، پاسخ کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد، شامل کشف محدود به ارائه‌دهنده برای ورودی‌های `provider/*`. بدون allowlist، پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد، به کاتالوگ کامل fallback می‌کند.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این برای تشخیص و UIهای کشف استفاده کنید، نه انتخاب‌گرهای معمول مدل.

## تأییدهای اجرا

- وقتی یک درخواست exec به تأیید نیاز دارد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` حل می‌کنند (به دامنه `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده نشستِ canonical). درخواست‌های فاقد `systemRunPlan` رد می‌شوند.
- پس از تأیید، فراخوانی‌های هدایت‌شده `node.invoke system.run` دوباره از همان `systemRunPlan` canonical به‌عنوان زمینه معتبر فرمان/cwd/نشست استفاده می‌کنند.
- اگر فراخوان بین آماده‌سازی و ارسال نهایی `system.run` تأییدشده، `command`، `rawCommand`، `cwd`، `agentId`، یا `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به payload تغییریافته، اجرا را رد می‌کند.

## fallback تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی شامل `deliver=true` باشند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل حل‌نشده یا فقط‌داخلی، `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی قابل حل نباشد، fallback به اجرای فقط‌نشست را مجاز می‌کند (برای مثال نشست‌های داخلی/webchat یا پیکربندی‌های چندکاناله مبهم).
- نتایج نهایی `agent` ممکن است وقتی تحویل درخواست شده باشد، شامل `result.deliveryStatus` باشند و از همان وضعیت‌های `sent`، `suppressed`، `partial_failed`، و `failed` مستندشده برای [`openclaw agent --json --deliver`](/fa/cli/agent#json-delivery-status) استفاده کنند.

## نسخه‌بندی

- `PROTOCOL_VERSION` در `packages/gateway-protocol/src/version.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را ارسال می‌کنند؛ سرور بازه‌هایی را که شامل پروتکل فعلی آن نباشند رد می‌کند. کلاینت‌ها و سرورهای فعلی به پروتکل v4 نیاز دارند.
- طرح‌واره‌ها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در سراسر پروتکل v4 پایدار هستند و خط مبنای مورد انتظار برای کلاینت‌های شخص ثالث‌اند.

| ثابت                                      | پیش‌فرض                                              | منبع                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| زمان پایان درخواست (برای هر RPC)         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| زمان پایان Preauth / چالش اتصال          | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| backoff اولیه اتصال مجدد                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| حداکثر backoff اتصال مجدد                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp تلاش مجدد سریع پس از بستن device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت force-stop پیش از `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| زمان پایان پیش‌فرض `stopAndWait()`        | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصله tick پیش‌فرض (پیش از `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن بر اثر زمان پایان tick              | code `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور مقدارهای مؤثر `policy.tickIntervalMs`، `policy.maxPayload`، و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، از آن مقدارها پیروی کنند.

## احراز هویت

- احراز هویت Gateway با shared-secret، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا غیر loopback با
  `gateway.auth.mode: "trusted-proxy"` بررسی احراز هویت اتصال را از
  هدرهای درخواست به‌جای `connect.params.auth.*` برآورده می‌کنند.
- حالت ورودی خصوصی `gateway.auth.mode: "none"` احراز هویت اتصال با shared-secret را
  کاملا رد می‌کند؛ این حالت را روی ورودی عمومی/غیرقابل‌اعتماد در دسترس قرار ندهید.
- پس از جفت‌سازی، Gateway یک **توکن دستگاه** محدود به نقش اتصال
  + scopeها صادر می‌کند. این توکن در `hello-ok.auth.deviceToken` برگردانده می‌شود و
  کلاینت باید آن را برای اتصال‌های آینده پایدارسازی کند.
- کلاینت‌ها باید پس از هر اتصال موفق، `hello-ok.auth.deviceToken` اصلی را پایدارسازی کنند.
- اتصال مجدد با آن توکن دستگاه **ذخیره‌شده** باید مجموعه scope تاییدشده ذخیره‌شده
  برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی read/probe/status را
  که قبلا اعطا شده حفظ می‌کند و از محدود شدن بی‌صدای اتصال‌های مجدد به یک
  scope ضمنی باریک‌تر و فقط مدیریتی جلوگیری می‌کند.
- مونتاژ احراز هویت اتصال در سمت کلاینت (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و همیشه وقتی تنظیم شده باشد ارسال می‌شود.
  - `auth.token` به‌ترتیب اولویت پر می‌شود: ابتدا توکن shared صریح،
    سپس یک `deviceToken` صریح، و بعد یک توکن ذخیره‌شده برای هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط وقتی ارسال می‌شود که هیچ‌کدام از موارد بالا یک
    `auth.token` را resolve نکرده باشند. یک توکن shared یا هر توکن دستگاه resolveشده آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش مجدد یک‌باره
    `AUTH_TOKEN_MISMATCH` فقط برای **endpointهای قابل‌اعتماد** فعال است —
    loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی
    بدون پین‌کردن واجد شرایط نیست.
- bootstrap داخلی setup-code مقدار `hello-ok.auth.deviceToken` نود اصلی
  به‌همراه یک توکن اپراتور محدودشده در
  `hello-ok.auth.deviceTokens` را برای تحویل مطمئن موبایل برمی‌گرداند. توکن اپراتور
  شامل `operator.talk.secrets` برای خواندن پیکربندی بومی Talk است و
  `operator.admin` و `operator.pairing` را حذف می‌کند.
- وقتی یک bootstrap غیر baseline با setup-code منتظر تایید است، جزئیات `PAIRING_REQUIRED`
  شامل `recommendedNextStep: "wait_then_retry"`، `retryable: true`،
  و `pauseReconnect: false` است. کلاینت‌ها باید تا زمان تایید درخواست یا نامعتبر شدن توکن،
  با همان توکن bootstrap دوباره متصل شوند.
- `hello-ok.auth.deviceTokens` را فقط وقتی پایدارسازی کنید که اتصال از احراز هویت bootstrap
  روی یک transport قابل‌اعتماد مانند `wss://` یا جفت‌سازی loopback/local استفاده کرده باشد.
- اگر یک کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، آن
  مجموعه scope درخواست‌شده توسط فراخواننده مرجع باقی می‌ماند؛ scopeهای cacheشده فقط
  وقتی دوباره استفاده می‌شوند که کلاینت در حال استفاده مجدد از توکن ذخیره‌شده برای هر دستگاه باشد.
- توکن‌های دستگاه می‌توانند از طریق `device.token.rotate` و
  `device.token.revoke` چرخش/لغو شوند (نیازمند scope `operator.pairing`). چرخاندن یا
  لغو یک نود یا نقش غیر اپراتوری دیگر همچنین نیازمند `operator.admin` است.
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. توکن bearer جایگزین را فقط
  برای فراخوانی‌های همان دستگاه echo می‌کند که از قبل با همان توکن دستگاه احراز هویت شده‌اند،
  تا کلاینت‌های فقط توکنی بتوانند جایگزین خود را پیش از اتصال مجدد پایدارسازی کنند.
  چرخش‌های shared/admin توکن bearer را echo نمی‌کنند.
- صدور، چرخش، و لغو توکن به مجموعه نقش تاییدشده‌ای محدود می‌ماند
  که در ورودی جفت‌سازی آن دستگاه ثبت شده است؛ تغییر توکن نمی‌تواند نقشی را گسترش دهد یا
  دستگاهی را هدف بگیرد که تایید جفت‌سازی هرگز اعطا نکرده است.
- برای sessionهای توکن دستگاه جفت‌شده، مدیریت دستگاه خودمحدود است مگر اینکه
  فراخواننده `operator.admin` نیز داشته باشد: فراخوانندگان غیر admin فقط می‌توانند
  توکن اپراتور برای ورودی دستگاه **خودشان** را مدیریت کنند. مدیریت توکن نود و
  سایر توکن‌های غیر اپراتوری فقط admin است، حتی برای دستگاه خود فراخواننده.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه scope توکن اپراتور هدف
  را در برابر scopeهای session فعلی فراخواننده بررسی می‌کنند. فراخوانندگان غیر admin
  نمی‌توانند توکن اپراتوری گسترده‌تر از آنچه خودشان دارند را بچرخانند یا لغو کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های قابل‌اعتماد می‌توانند یک تلاش مجدد محدود با توکن cacheشده برای هر دستگاه انجام دهند.
  - اگر آن تلاش مجدد شکست بخورد، کلاینت‌ها باید حلقه‌های اتصال مجدد خودکار را متوقف کنند و راهنمایی اقدام اپراتور را نمایش دهند.
- `AUTH_SCOPE_MISMATCH` یعنی توکن دستگاه شناسایی شده اما نقش/scopeهای
  درخواست‌شده را پوشش نمی‌دهد. کلاینت‌ها نباید این را به‌عنوان توکن بد نمایش دهند؛
  از اپراتور بخواهید دوباره جفت‌سازی کند یا قرارداد scope باریک‌تر/گسترده‌تر را تایید کند.

## هویت دستگاه + جفت‌سازی

- نودها باید یک هویت دستگاه پایدار (`device.id`) را که از
  اثر انگشت keypair مشتق شده است شامل کنند.
- Gatewayها برای هر دستگاه + نقش توکن صادر می‌کنند.
- تاییدهای جفت‌سازی برای شناسه‌های دستگاه جدید لازم هستند مگر اینکه تایید خودکار محلی
  فعال باشد.
- تایید خودکار جفت‌سازی حول اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر self-connect محدود backend/container-local برای
  جریان‌های کمکی shared-secret قابل‌اعتماد دارد.
- اتصال‌های tailnet یا LAN روی همان host همچنان برای جفت‌سازی remote محسوب می‌شوند و
  به تایید نیاز دارند.
- کلاینت‌های WS معمولا هنگام `connect` هویت `device` را شامل می‌کنند (اپراتور +
  نود). تنها استثناهای اپراتور بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط localhost.
  - احراز هویت موفق operator Control UI با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass، کاهش شدید امنیتی).
  - RPCهای backend مستقیم-loopback `gateway-client` روی مسیر کمکی داخلی
    رزروشده.
- حذف هویت دستگاه پیامدهای scope دارد. وقتی اتصال اپراتور بدون دستگاه
  از طریق یک مسیر اعتماد صریح مجاز شود، OpenClaw همچنان scopeهای
  خوداظهارشده را به مجموعه خالی پاک می‌کند مگر اینکه آن مسیر یک استثنای نام‌دار
  برای حفظ scope داشته باشد. سپس متدهای scope-gated با
  `missing scope` شکست می‌خورند.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` یک مسیر حفظ scope
  break-glass برای Control UI است. این مسیر به backend سفارشی دلخواه یا کلاینت‌های WebSocket
  به‌شکل CLI، scope اعطا نمی‌کند.
- مسیر کمکی backend رزروشده مستقیم-loopback `gateway-client` فقط برای RPCهای داخلی
  local control-plane، scopeها را حفظ می‌کند؛ شناسه‌های backend سفارشی
  این استثنا را دریافت نمی‌کنند.
- همه اتصال‌ها باید nonce `connect.challenge` ارائه‌شده توسط سرور را امضا کنند.

### عیب‌یابی مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنا                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده (یا خالی فرستاده) است. |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce قدیمی/نادرست امضا کرده است.       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload امضا با payload v2 مطابقت ندارد.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp امضاشده خارج از skew مجاز است.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثر انگشت کلید عمومی مطابقت ندارد. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/canonicalization کلید عمومی شکست خورده است.  |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- payload v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` ارسال کنید.
- payload امضای ترجیحی `v3` است که علاوه بر فیلدهای device/client/role/scopes/token/nonce،
  `platform` و `deviceFamily` را نیز bind می‌کند.
- امضاهای قدیمی `v2` برای سازگاری همچنان پذیرفته می‌شوند، اما پین‌کردن فراداده
  دستگاه جفت‌شده همچنان سیاست command را هنگام اتصال مجدد کنترل می‌کند.

## TLS + پین‌کردن

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثر انگشت گواهی gateway را پین کنند (پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` را ببینید).

## Scope

این پروتکل **API کامل gateway** را در دسترس می‌گذارد (status، channels، models، chat،
agent، sessions، nodes، approvals، و غیره). سطح دقیق توسط
schemaهای TypeBox در `packages/gateway-protocol/src/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل Bridge](/fa/gateway/bridge-protocol)
- [runbook Gateway](/fa/gateway)
