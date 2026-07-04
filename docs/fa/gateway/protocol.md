---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS برای gateway
    - اشکال‌زدایی از ناهماهنگی‌های پروتکل یا خرابی‌های اتصال
    - بازسازی طرح‌واره/مدل‌های پروتکل
summary: 'پروتکل WebSocket ‏Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-07-04T18:10:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway پروتکل WS، **صفحه کنترل واحد + انتقال Node** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط کاربری وب، برنامه macOS، Nodeهای iOS/Android، Nodeهای headless) از طریق WebSocket وصل می‌شوند و در زمان
دست‌دهی، **نقش** + **حوزه** خود را اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود هستند. پس از دست‌دهی موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. وقتی تشخیص‌ها فعال باشند،
  فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه gateway فریم
  تحت‌تأثیر را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطح‌ها و کدهای دلیل امن را نگه می‌دارند. آن‌ها بدنه پیام،
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

در حالی که Gateway هنوز در حال تکمیل sidecarهای راه‌اندازی است، درخواست `connect` می‌تواند
یک خطای قابل‌تلاش‌مجدد `UNAVAILABLE` برگرداند که در آن `details.reason` برابر
`"startup-sidecars"` و شامل `retryAfterMs` است. کلاینت‌ها باید این پاسخ را
در چارچوب بودجه کلی اتصال خود دوباره تلاش کنند، به‌جای اینکه آن را به‌عنوان
شکست نهایی دست‌دهی نمایش دهند.

`server`، `features`، `snapshot` و `policy` همگی طبق schema
(`packages/gateway-protocol/src/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/حوزه‌های مذاکره‌شده را گزارش می‌کند. `pluginSurfaceUrls` اختیاری است و نام سطح‌های Plugin،
مانند `canvas`، را به URLهای میزبانی‌شده و حوزه‌بندی‌شده نگاشت می‌کند.

URLهای سطح Plugin حوزه‌بندی‌شده ممکن است منقضی شوند. Nodeها می‌توانند
`node.pluginSurface.refresh` را با `{ "surface": "canvas" }` فراخوانی کنند تا یک ورودی تازه
در `pluginSurfaceUrls` دریافت کنند. بازآرایی آزمایشی Plugin بوم از مسیر سازگاری منسوخ
`canvasHostUrl`، `canvasCapability` یا
`node.canvas.capability.refresh` پشتیبانی نمی‌کند؛ کلاینت‌ها و gatewayهای native فعلی
باید از سطح‌های Plugin استفاده کنند.

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

کلاینت‌های بک‌اند مورداعتماد در همان فرایند (`client.id: "gateway-client"`,
`client.mode: "backend"`) می‌توانند در اتصالات loopback مستقیم، وقتی با توکن/گذرواژه مشترک gateway
احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای صفحه کنترل داخلی رزرو شده است
و مانع می‌شود baselineهای قدیمی جفت‌سازی CLI/دستگاه، کار بک‌اند محلی مانند به‌روزرسانی‌های نشست
subagent را مسدود کنند. کلاینت‌های دوردست،
کلاینت‌های با مبدأ مرورگر، کلاینت‌های Node، و کلاینت‌های صریح device-token/device-identity
همچنان از بررسی‌های عادی جفت‌سازی و ارتقای حوزه استفاده می‌کنند.

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

bootstrap داخلی QR/setup-code یک مسیر تحویل موبایل تازه است. یک اتصال موفق
baseline setup-code یک توکن Node اصلی به‌همراه یک توکن operator محدود برمی‌گرداند:

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

تحویل operator عمداً محدود شده است تا onboarding با QR بتواند حلقه operator موبایل را شروع کند
و راه‌اندازی native را بدون اعطای حوزه‌های تغییر جفت‌سازی یا `operator.admin` کامل کند.
این شامل `operator.talk.secrets` است تا کلاینت native بتواند پیکربندی Talk موردنیاز خود را
پس از bootstrap بخواند. دسترسی گسترده‌تر به جفت‌سازی و admin به یک جریان جداگانه جفت‌سازی
یا توکن operator تأییدشده نیاز دارد. کلاینت‌ها باید
`hello-ok.auth.deviceTokens` را فقط
وقتی پایدار کنند که اتصال از احراز هویت bootstrap روی انتقال مورداعتماد مانند `wss://` یا
جفت‌سازی loopback/local استفاده کرده باشد.

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

## نقش‌ها + حوزه‌ها

برای مدل کامل حوزه‌های operator، بررسی‌های زمان تأیید، و معناشناسی secret مشترک،
[حوزه‌های operator](/fa/gateway/operator-scopes) را ببینید.

### نقش‌ها

- `operator` = سرویس‌گیرنده سطح کنترل (CLI/UI/اتوماسیون).
- `node` = میزبان قابلیت (camera/screen/canvas/system.run).

### دامنه‌ها (`operator`)

دامنه‌های رایج:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` با `includeSecrets: true` به `operator.talk.secrets`
(یا `operator.admin`) نیاز دارد.
وقتی رازها گنجانده می‌شوند، سرویس‌گیرنده‌ها باید اعتبارنامه ارائه‌دهنده فعال Talk را
از `talk.resolved.config.apiKey` بخوانند؛ `talk.providers.<id>.apiKey`
در شکل منبع باقی می‌ماند و ممکن است یک شیء SecretRef یا یک رشته پوشیده‌شده باشد.

روش‌های RPC متعلق به Gateway که توسط Plugin ثبت شده‌اند ممکن است دامنه `operator` خودشان را درخواست کنند، اما
پیشوندهای مدیریت هسته رزرو شده (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` نگاشت می‌شوند.

دامنه روش فقط نخستین دروازه است. برخی دستورهای اسلش که از طریق
`chat.send` قابل دسترسی هستند، افزون بر آن بررسی‌های سخت‌گیرانه‌تری در سطح دستور اعمال می‌کنند. برای نمونه، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` افزون بر دامنه پایه روش، یک بررسی دامنه اضافی در زمان تأیید نیز دارد:

- درخواست‌های بدون دستور: `operator.pairing`
- درخواست‌های دارای دستورهای `node` غیر اجرایی: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare`، یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### قابلیت‌ها/دستورها/مجوزها (`node`)

گره‌ها هنگام اتصال ادعاهای قابلیت را اعلام می‌کنند:

- `caps`: دسته‌های سطح‌بالای قابلیت مانند `camera`، `canvas`، `screen`،
  `location`، `voice`، و `talk`.
- `commands`: فهرست مجاز دستورها برای فراخوانی.
- `permissions`: کنترل‌های جزئی (مانند `screen.record`، `camera.capture`).

Gateway این موارد را به‌عنوان **ادعا** در نظر می‌گیرد و فهرست‌های مجاز سمت سرور را اعمال می‌کند.

## حضور

- `system-presence` ورودی‌هایی را برمی‌گرداند که با هویت دستگاه کلیدگذاری شده‌اند.
- ورودی‌های حضور شامل `deviceId`، `roles`، و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف واحد نشان دهند،
  حتی وقتی دستگاه هم به‌عنوان **`operator`** و هم به‌عنوان **`node`** متصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. گره‌های متصل،
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ گره‌های جفت‌شده همچنین می‌توانند
  زمانی که یک رویداد قابل اعتماد گره، فراداده جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، حضور پس‌زمینه پایدار را گزارش کنند.

### رویداد زنده بودن پس‌زمینه گره

گره‌ها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک گره جفت‌شده
در طول یک بیدارسازی پس‌زمینه زنده بوده، بدون اینکه به‌عنوان متصل علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual`، یا `connect`. رشته‌های ناشناخته trigger پیش از پایداری توسط Gateway به
`background` عادی‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه `node` احراز هویت‌شده پایدار است؛
نشست‌های بدون دستگاه یا جفت‌نشده `handled: false` را برمی‌گردانند.

Gatewayهای موفق یک نتیجه ساختاریافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gatewayهای قدیمی‌تر ممکن است هنوز برای `node.event` مقدار `{ "ok": true }` را برگردانند؛ سرویس‌گیرنده‌ها باید آن را به‌عنوان یک
RPC تأییدشده در نظر بگیرند، نه به‌عنوان پایداری حضور بادوام.

## دامنه‌بندی رویدادهای پخش

رویدادهای پخش WebSocket که از سرور ارسال می‌شوند با دامنه محدود می‌شوند تا نشست‌های محدود به جفت‌سازی یا فقط گره، محتوای نشست را به‌صورت منفعل دریافت نکنند.

- **فریم‌های چت، عامل، و نتیجه ابزار** (از جمله رویدادهای `agent` جریانی و نتایج فراخوانی ابزار) دست‌کم به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را به‌طور کامل رد می‌کنند.
- **پخش‌های `plugin.*` تعریف‌شده توسط Plugin** بسته به اینکه Plugin چگونه آن‌ها را ثبت کرده است، به `operator.write` یا `operator.admin` محدود می‌شوند.
- **رویدادهای وضعیت و انتقال** (`heartbeat`، `presence`، `tick`، چرخه عمر اتصال/قطع اتصال، و مانند آن) بدون محدودیت باقی می‌مانند تا سلامت انتقال برای هر نشست احراز هویت‌شده قابل مشاهده بماند.
- **خانواده‌های ناشناخته رویدادهای پخش** به‌صورت پیش‌فرض با دامنه محدود می‌شوند (بسته در صورت خطا)، مگر اینکه یک handler ثبت‌شده صراحتاً آن‌ها را آزادتر کند.

هر اتصال سرویس‌گیرنده شماره توالی مخصوص همان سرویس‌گیرنده را نگه می‌دارد تا پخش‌ها روی همان سوکت ترتیب یکنواخت را حفظ کنند، حتی وقتی سرویس‌گیرنده‌های مختلف زیرمجموعه‌های متفاوتی از جریان رویداد را پس از فیلتر دامنه می‌بینند.

## خانواده‌های رایج روش‌های RPC

سطح عمومی WS گسترده‌تر از نمونه‌های handshake/auth بالا است. این
یک خروجی تولیدشده نیست — `hello-ok.features.methods` یک فهرست محافظه‌کارانه
برای کشف قابلیت است که از `src/gateway/server-methods-list.ts` به‌علاوه exportهای روش بارگذاری‌شده
Plugin/channel ساخته شده است. آن را به‌عنوان کشف قابلیت در نظر بگیرید، نه یک
شمارش کامل از `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` نمایه سلامت Gateway را، چه از حافظه نهان و چه با بررسی تازه، برمی‌گرداند.
    - `diagnostics.stability` ضبط‌کننده پایداری تشخیصی محدود اخیر را برمی‌گرداند. این مورد فراداده‌های عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایتی، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/Plugin و شناسه‌های نشست را نگه می‌دارد. متن گفت‌وگو، بدنه‌های Webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، یا مقادیر محرمانه را نگه نمی‌دارد. محدوده خواندن اپراتور لازم است.
    - `status` خلاصه Gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های اپراتور با محدوده ادمین گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه Gateway را که جریان‌های رله و جفت‌سازی از آن استفاده می‌کنند برمی‌گرداند.
    - `system-presence` نمایه حضور فعلی را برای دستگاه‌های اپراتور/Node متصل برمی‌گرداند.
    - `system-event` یک رویداد سیستم را اضافه می‌کند و می‌تواند زمینه حضور را به‌روزرسانی/پخش کند.
    - `last-heartbeat` آخرین رویداد Heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را در Gateway تغییر وضعیت می‌دهد.

  </Accordion>

  <Accordion title="مدل‌ها و مصرف">
    - `models.list` کاتالوگ مدل مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخابگر (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را بفرستید، یا برای کاتالوگ کامل مقدار `{ "view": "all" }` را.
    - `usage.status` پنجره‌های مصرف/خلاصه سهمیه باقی‌مانده ارائه‌دهنده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیعی مصرف هزینه را برای یک بازه تاریخی برمی‌گرداند.
      برای یک عامل `agentId` را بفرستید، یا برای تجمیع عامل‌های پیکربندی‌شده `agentScope: "all"` را.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding ذخیره‌شده در حافظه نهان را برای فضای کاری عامل پیش‌فرض فعال برمی‌گرداند. فقط زمانی که فراخواننده صریحا یک ping زنده به ارائه‌دهنده embedding می‌خواهد، `{ "probe": true }` یا `{ "deep": true }` را بفرستید. کلاینت‌های آگاه از Dreaming همچنین می‌توانند برای محدود کردن آمار ذخیره‌گاه Dreaming به یک فضای کاری عامل انتخاب‌شده، `{ "agentId": "agent-id" }` را بفرستند؛ حذف `agentId` جایگزین عامل پیش‌فرض را نگه می‌دارد و فضاهای کاری Dreaming پیکربندی‌شده را تجمیع می‌کند.
    - `doctor.memory.dreamDiary`، `doctor.memory.backfillDreamDiary`، `doctor.memory.resetDreamDiary`، `doctor.memory.resetGroundedShortTerm`، `doctor.memory.repairDreamingArtifacts`، و `doctor.memory.dedupeDreamDiary` پارامترهای اختیاری `{ "agentId": "agent-id" }` را برای نماها/کنش‌های Dreaming عامل انتخاب‌شده می‌پذیرند. وقتی `agentId` حذف شود، روی فضای کاری عامل پیش‌فرض پیکربندی‌شده عمل می‌کنند.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از مهار REM را برای کلاینت‌های صفحه کنترل راه‌دور برمی‌گرداند. این می‌تواند مسیرهای فضای کاری، بریده‌های حافظه، Markdown زمینه‌دار رندرشده و نامزدهای ارتقای عمیق را شامل شود، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های مصرف برای هر نشست را برمی‌گرداند. برای یک
      عامل `agentId` را بفرستید، یا برای فهرست کردن عامل‌های پیکربندی‌شده با هم `agentScope: "all"` را.
    - `sessions.usage.timeseries` مصرف سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های گزارش مصرف را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، در جایی که کانال از خروج پشتیبانی می‌کند، خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/وب را برای ارائه‌دهنده کانال وب فعلی که قابلیت QR دارد شروع می‌کند.
    - `web.login.wait` منتظر کامل شدن همان جریان ورود QR/وب می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک پوش آزمایشی APNs را به یک Node ثبت‌شده iOS می‌فرستد.
    - `voicewake.get` محرک‌های wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` محرک‌های wake-word را به‌روزرسانی و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و گزارش‌ها">
    - `send` همان RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گیری‌شده به کانال/حساب/رشته خارج از اجراکننده گفت‌وگو است.
    - `logs.tail` دنباله گزارش فایل پیکربندی‌شده Gateway را همراه با کنترل‌های نشانگر/محدودیت و حداکثر بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.catalog` کاتالوگ فقط‌خواندنی ارائه‌دهنده Talk را برای گفتار، رونویسی جریانی، و صدای بلادرنگ برمی‌گرداند. این شامل شناسه‌های رسمی ارائه‌دهنده، نام‌های مستعار رجیستری، برچسب‌ها، وضعیت پیکربندی‌شده، یک نتیجه اختیاری `ready` در سطح گروه، شناسه‌های مدل/صدای آشکارشده، حالت‌های رسمی، انتقال‌ها، راهبردهای مغز، و پرچم‌های صوتی/قابلیت بلادرنگ است، بدون اینکه اسرار ارائه‌دهنده را برگرداند یا پیکربندی سراسری را تغییر دهد. Gatewayهای فعلی پس از اعمال انتخاب ارائه‌دهنده زمان اجرا، `ready` را تنظیم می‌کنند؛ کلاینت‌ها برای سازگاری با Gatewayهای قدیمی‌تر باید نبود آن را تأییدنشده در نظر بگیرند.
    - `talk.config` بار پیکربندی مؤثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.session.create` یک نشست Talk تحت مالکیت Gateway برای `realtime/gateway-relay`، `transcription/gateway-relay`، یا `stt-tts/managed-room` ایجاد می‌کند. برای `stt-tts/managed-room`، فراخواننده‌های `operator.write` که `sessionKey` می‌فرستند باید برای دیدپذیری scoped کلید نشست، `spawnedBy` را نیز بفرستند؛ ایجاد `sessionKey` بدون scoped و `brain: "direct-tools"` به `operator.admin` نیاز دارد.
    - `talk.session.join` توکن نشست managed-room را اعتبارسنجی می‌کند، در صورت نیاز رویدادهای `session.ready` یا `session.replaced` را منتشر می‌کند، و فراداده اتاق/نشست را به‌همراه رویدادهای اخیر Talk بدون توکن متن‌آشکار یا هش توکن ذخیره‌شده برمی‌گرداند.
    - `talk.session.appendAudio` صدای ورودی PCM با کدگذاری base64 را به نشست‌های رله بلادرنگ و رونویسی تحت مالکیت Gateway اضافه می‌کند.
    - `talk.session.startTurn`، `talk.session.endTurn`، و `talk.session.cancelTurn` چرخه عمر نوبت managed-room را با رد نوبت کهنه پیش از پاک شدن وضعیت هدایت می‌کنند.
    - `talk.session.cancelOutput` خروجی صوتی دستیار را متوقف می‌کند، عمدتا برای ورود میان‌گفتاری کنترل‌شده با VAD در نشست‌های رله Gateway.
    - `talk.session.submitToolResult` یک فراخوانی ابزار ارائه‌دهنده را که توسط نشست رله بلادرنگ تحت مالکیت Gateway منتشر شده کامل می‌کند. وقتی نتیجه نهایی بعدا می‌آید، برای خروجی موقت ابزار `options: { willContinue: true }` را بفرستید، یا وقتی نتیجه ابزار باید فراخوانی ارائه‌دهنده را بدون شروع پاسخ بلادرنگ دیگری از دستیار برآورده کند، `options: { suppressResponse: true }` را.
    - `talk.session.steer` کنترل صوتی اجرای فعال را به یک نشست Talk پشتوانه‌دار با عامل و تحت مالکیت Gateway می‌فرستد. این مقدار `{ sessionId, text, mode? }` را می‌پذیرد، که در آن `mode` یکی از `status`، `steer`، `cancel`، یا `followup` است؛ حالت حذف‌شده از متن گفتاری طبقه‌بندی می‌شود.
    - `talk.session.close` یک نشست رله، رونویسی، یا managed-room تحت مالکیت Gateway را می‌بندد و رویدادهای پایانی Talk را منتشر می‌کند.
    - `talk.mode` وضعیت حالت Talk فعلی را برای کلاینت‌های WebChat/Control UI تنظیم/پخش می‌کند.
    - `talk.client.create` یک نشست ارائه‌دهنده بلادرنگ تحت مالکیت کلاینت را با استفاده از `webrtc` یا `provider-websocket` ایجاد می‌کند، در حالی که Gateway مالک پیکربندی، اعتبارنامه‌ها، دستورالعمل‌ها، و سیاست ابزار است.
    - `talk.client.toolCall` به انتقال‌های بلادرنگ تحت مالکیت کلاینت اجازه می‌دهد فراخوانی‌های ابزار ارائه‌دهنده را به سیاست Gateway ارسال کنند. نخستین ابزار پشتیبانی‌شده `openclaw_agent_consult` است؛ کلاینت‌ها یک شناسه اجرا دریافت می‌کنند و پیش از ارسال نتیجه ابزار ویژه ارائه‌دهنده، منتظر رویدادهای چرخه عمر عادی گفت‌وگو می‌مانند.
    - `talk.client.steer` کنترل صوتی اجرای فعال را برای انتقال‌های بلادرنگ تحت مالکیت کلاینت می‌فرستد. Gateway اجرای تعبیه‌شده فعال را از `sessionKey` حل می‌کند و به‌جای کنار گذاشتن بی‌صدای هدایت، یک نتیجه ساختاریافته پذیرفته/ردشده برمی‌گرداند.
    - `talk.event` کانال یکتای رویداد Talk برای آداپتورهای بلادرنگ، رونویسی، STT/TTS، managed-room، تلفنی، و جلسه است.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk سنتز می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان جایگزین، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` موجودی قابل‌مشاهده ارائه‌دهنده TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را تغییر وضعیت می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و جادوگر">
    - `secrets.reload` SecretRefهای فعال را دوباره حل می‌کند و وضعیت محرمانه زمان اجرا را فقط در صورت موفقیت کامل جایگزین می‌کند.
    - `secrets.resolve` انتساب‌های محرمانه هدف‌دستور را برای یک مجموعه دستور/هدف مشخص حل می‌کند.
    - `config.get` نمایه و هش پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک بار پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را ادغام می‌کند. جایگزینی مخرب آرایه
      نیاز دارد مسیر تحت‌تأثیر در `replacePaths` باشد؛ آرایه‌های تودرتو
      زیر ورودی‌های آرایه از مسیرهای `[]` مانند `agents.list[].skills` استفاده می‌کنند.
    - `config.apply` کل بار پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` بار schema پیکربندی زنده را که Control UI و ابزارهای CLI استفاده می‌کنند برمی‌گرداند: schema، `uiHints`، نسخه، و فراداده تولید، شامل فراداده schema مربوط به Plugin + کانال وقتی زمان اجرا بتواند آن را بارگذاری کند. schema شامل فراداده فیلد `title` / `description` است که از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط UI مشتق شده، شامل شاخه‌های ترکیب شیء تودرتو، wildcard، آیتم آرایه، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد منطبق وجود داشته باشد.
    - `config.schema.lookup` یک بار جست‌وجوی محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک گره schema کم‌عمق، راهنمای منطبق + `hintPath`، `reloadKind` اختیاری، و خلاصه‌های فرزند بلافصل برای کاوش UI/CLI. `reloadKind` یکی از `restart`، `hot`، یا `none` است و برنامه‌ریز بارگذاری مجدد پیکربندی Gateway را برای مسیر درخواست‌شده بازتاب می‌دهد. گره‌های schema جست‌وجو، مستندات کاربرمحور و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/شیء، و پرچم‌هایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، `reloadKind` اختیاری، به‌علاوه `hint` / `hintPath` منطبق را آشکار می‌کنند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد، یک راه‌اندازی مجدد زمان‌بندی می‌کند؛ فراخواننده‌های دارای نشست می‌توانند `continuationMessage` را بگنجانند تا راه‌اندازی، یک نوبت پیگیری عامل را از طریق صف ادامه راه‌اندازی مجدد از سر بگیرد. به‌روزرسانی‌های مدیر بسته و به‌روزرسانی‌های git-checkout نظارت‌شده از صفحه کنترل، به‌جای جایگزینی درخت بسته یا تغییر خروجی checkout/build داخل Gateway زنده، از تحویل مدیریت‌شده سرویس جداشده استفاده می‌کنند. یک تحویل شروع‌شده `ok: true` را با `result.reason: "managed-service-handoff-started"` و `handoff.status: "started"` برمی‌گرداند؛ تحویل‌های در دسترس نبودن یا ناموفق `ok: false` را با `managed-service-handoff-unavailable` یا `managed-service-handoff-failed`، به‌علاوه `handoff.command` وقتی به به‌روزرسانی دستی shell نیاز باشد، برمی‌گردانند. تحویل در دسترس نبودن یعنی OpenClaw مرز ناظر امن یا هویت سرویس پایدار ندارد، مانند `OPENCLAW_SYSTEMD_UNIT` برای systemd. هنگام یک تحویل شروع‌شده، sentinel راه‌اندازی مجدد ممکن است برای مدت کوتاهی `stats.reason: "restart-health-pending"` را گزارش کند؛ ادامه تا زمانی به تأخیر می‌افتد که CLI، Gateway راه‌اندازی‌شده دوباره را تأیید و sentinel نهایی `ok` را بنویسد.
    - `update.status` آخرین sentinel راه‌اندازی مجدد به‌روزرسانی را تازه‌سازی و برمی‌گرداند، شامل نسخه در حال اجرای پس از راه‌اندازی مجدد وقتی در دسترس باشد.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` جادوگر راه‌اندازی اولیه را از طریق WS RPC ارائه می‌کنند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های عامل و فضای کاری">
    - `agents.list` مدخل‌های عامل پیکربندی‌شده، از جمله مدل مؤثر و فرادادهٔ زمان اجرا را برمی‌گرداند.
    - `agents.create`، `agents.update` و `agents.delete` رکوردهای عامل و اتصال فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get` و `agents.files.set` فایل‌های فضای کاری راه‌انداز را که برای یک عامل در دسترس قرار گرفته‌اند مدیریت می‌کنند.
    - `tasks.list`، `tasks.get` و `tasks.cancel` دفتر وظایف Gateway را برای کلاینت‌های SDK و اپراتور در دسترس قرار می‌دهند.
    - `artifacts.list`، `artifacts.get` و `artifacts.download` خلاصه‌های آرتیفکت مشتق‌شده از رونوشت و بارگیری‌ها را برای محدودهٔ صریح `sessionKey`، `runId` یا `taskId` در دسترس قرار می‌دهند. پرس‌وجوهای اجرا و وظیفه، نشست مالک را در سمت سرور حل می‌کنند و فقط رسانه‌های رونوشت با منشأ مطابق را برمی‌گردانند؛ منابع URL ناامن یا محلی به‌جای واکشی در سمت سرور، بارگیری‌های پشتیبانی‌نشده برمی‌گردانند.
    - `environments.list` و `environments.status` کشف فقط‌خواندنی محیط‌های محلی Gateway و Node را برای کلاینت‌های SDK در دسترس قرار می‌دهند.
    - `agent.identity.get` هویت مؤثر دستیار را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک اجرا می‌ماند و در صورت موجود بودن، عکس‌برداشت پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` نمایهٔ فعلی نشست را برمی‌گرداند، از جمله فرادادهٔ `agentRuntime` در هر ردیف، وقتی یک پشتانهٔ زمان اجرای عامل پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر نشست را برای کلاینت WS فعلی روشن یا خاموش می‌کنند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد رونوشت/پیام را برای یک نشست روشن یا خاموش می‌کنند.
    - `sessions.preview` پیش‌نمایش‌های رونوشت محدودشده را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.describe` یک ردیف نشست Gateway را برای یک کلید نشست دقیق برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را حل یا متعارف‌سازی می‌کند.
    - `sessions.create` یک مدخل نشست جدید ایجاد می‌کند.
    - `sessions.send` پیامی را به یک نشست موجود می‌فرستد.
    - `sessions.steer` گونهٔ وقفه‌دادن و هدایت برای یک نشست فعال است.
    - `sessions.abort` کار فعال برای یک نشست را لغو می‌کند. فراخوان می‌تواند `key` به‌همراه `runId` اختیاری را بفرستد، یا برای اجراهای فعالی که Gateway می‌تواند به یک نشست حل کند، فقط `runId` را بفرستد.
    - `sessions.patch` فراداده/بازنویسی‌های نشست را به‌روزرسانی می‌کند و مدل متعارف حل‌شده به‌همراه `agentRuntime` مؤثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete` و `sessions.compact` نگهداشت نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort` و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI از نظر نمایش نرمال‌سازی می‌شود: برچسب‌های دستور درون‌خطی از متن قابل‌مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار در متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شدهٔ فراخوانی ابزار) و توکن‌های کنترل مدل ASCII/تمام‌عرض نشت‌کرده حذف می‌شوند، ردیف‌های دستیار فقط دارای توکن خاموش مانند دقیقاً `NO_REPLY` / `no_reply` حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با جای‌نگهدارها جایگزین شوند.
    - `chat.message.get` خوانندهٔ افزایشی و محدودِ پیام کامل برای یک مدخل رونوشت قابل‌مشاهدهٔ واحد است. کلاینت‌ها `sessionKey`، در صورت عامل‌محور بودن انتخاب نشست `agentId` اختیاری، به‌همراه یک `messageId` رونوشت را که قبلاً از طریق `chat.history` ارائه شده می‌فرستند، و Gateway همان تصویرسازی نرمال‌شده برای نمایش را بدون سقف کوتاه‌سازی تاریخچهٔ سبک برمی‌گرداند، وقتی مدخل ذخیره‌شده هنوز موجود باشد و بیش‌ازحد بزرگ نباشد.
    - `chat.send` مقدار یک‌نوبتی `fastMode: "auto"` را می‌پذیرد تا برای فراخوانی‌های مدل که پیش از آستانهٔ خودکار شروع شده‌اند از حالت سریع استفاده کند، سپس فراخوانی‌های تلاش دوباره، fallback، نتیجهٔ ابزار یا ادامه را بدون حالت سریع شروع کند. مقدار پیش‌فرض آستانه ۶۰ ثانیه است و می‌توان آن را برای هر مدل با `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` پیکربندی کرد. فراخوان `chat.send` می‌تواند مقدار یک‌نوبتی `fastAutoOnSeconds` را برای بازنویسی آستانه در آن درخواست بفرستد.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و توکن‌های دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شدهٔ در انتظار و تأییدشده را برمی‌گرداند.
    - `device.pair.setupCode` یک کد راه‌اندازی موبایل و، به‌طور پیش‌فرض، یک URL دادهٔ QR به‌صورت PNG ایجاد می‌کند. به `operator.admin` نیاز دارد و عمداً از کشف تبلیغ‌شده حذف شده است. نتیجه شامل `setupCode`، `qrDataUrl` اختیاری، `gatewayUrl`، برچسب غیرمحرمانهٔ `auth` و `urlSource` است.
    - `device.pair.approve`، `device.pair.reject` و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` یک توکن دستگاه جفت‌شده را در محدودهٔ نقش تأییدشده و دامنهٔ فراخوان آن می‌چرخاند.
    - `device.token.revoke` یک توکن دستگاه جفت‌شده را در محدودهٔ نقش تأییدشده و دامنهٔ فراخوان آن باطل می‌کند.

    کد راه‌اندازی یک گواهی راه‌انداز کوتاه‌عمر را در خود دارد. کلاینت‌ها نباید
    آن را بیرون از جریان جفت‌سازی ثبت یا پایدار کنند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، فراخوانی و کار در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove` و `node.pair.verify` جفت‌سازی Node و تأیید راه‌اندازی را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک Node متصل ارسال می‌کند.
    - `node.invoke.result` نتیجهٔ یک درخواست فراخوانی را برمی‌گرداند.
    - `node.event` رویدادهای منشأگرفته از Node را به gateway برمی‌گرداند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کارهای در انتظار بادوام را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تأیید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list` و `exec.approval.resolve` درخواست‌های تأیید اجرای یک‌باره به‌همراه جست‌وجو/بازپخش تأییدهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تأیید اجرای در انتظار می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در صورت timeout، `null`).
    - `exec.approvals.get` و `exec.approvals.set` عکس‌برداشت‌های سیاست تأیید اجرای gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تأیید اجرای محلی Node را از طریق فرمان‌های relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision` و `plugin.approval.resolve` جریان‌های تأیید تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills و ابزارها">
    - اتوماسیون: `wake` تزریق متن بیدارسازی فوری یا در Heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.get`، `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کار زمان‌بندی‌شده را مدیریت می‌کنند.
    - `cron.run` برای اجراهای دستی همچنان یک RPC از نوع صف‌گذاری باقی می‌ماند. کلاینت‌هایی که به معناشناسی تکمیل نیاز دارند باید `runId` برگشتی را بخوانند و `cron.runs` را poll کنند.
    - `cron.runs` یک فیلتر اختیاری و غیرخالی `runId` می‌پذیرد تا کلاینت‌ها بتوانند یک اجرای دستی صف‌شده را بدون رقابت با سایر مدخل‌های تاریخچه برای همان کار دنبال کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رویداد رایج

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و سایر رویدادهای چت
  فقط مربوط به رونوشت. در نسخهٔ ۴ پروتکل، payloadهای دلتا `deltaText` را حمل می‌کنند؛ `message`
  عکس‌برداشت تجمعی دستیار باقی می‌ماند. جایگزینی‌های غیرپیشوندی `replace=true`
  را تنظیم می‌کنند و از `deltaText` به‌عنوان متن جایگزین استفاده می‌کنند.
- `session.message`، `session.operation` و `session.tool`: به‌روزرسانی‌های رونوشت،
  عملیات نشست در جریان، و جریان رویداد برای یک نشست مشترک‌شده.
- `sessions.changed`: نمایهٔ نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های عکس‌برداشت حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / زنده‌بودن.
- `health`: به‌روزرسانی عکس‌برداشت سلامت gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر اجرای/کار cron.
- `shutdown`: اعلان خاموش‌شدن gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخهٔ عمر جفت‌سازی Node.
- `node.invoke.request`: پخش درخواست فراخوانی Node.
- `device.pair.requested` / `device.pair.resolved`: چرخهٔ عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی trigger واژهٔ بیدارباش تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: چرخهٔ عمر تأیید اجرا.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخهٔ عمر تأیید Plugin.

### متدهای کمک‌کنندهٔ Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی فایل‌های اجرایی skill
  را برای بررسی‌های اجازهٔ خودکار واکشی کنند.

### RPCهای دفتر وظایف

کلاینت‌های اپراتور می‌توانند رکوردهای وظیفهٔ پس‌زمینهٔ Gateway را از طریق
RPCهای دفتر وظایف بررسی و لغو کنند. این متدها خلاصه‌های پالایش‌شدهٔ وظیفه را برمی‌گردانند، نه
وضعیت خام زمان اجرا.

- `tasks.list` به `operator.read` نیاز دارد.
  - پارامترها: `status` اختیاری (`"queued"`، `"running"`، `"completed"`،
    `"failed"`، `"cancelled"` یا `"timed_out"`) یا آرایه‌ای از آن وضعیت‌ها،
    `agentId` اختیاری، `sessionKey` اختیاری، `limit` اختیاری از `1` تا
    `500`، و رشتهٔ اختیاری `cursor`.
  - نتیجه: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` به `operator.read` نیاز دارد.
  - پارامترها: `{ "taskId": string }`.
  - نتیجه: `{ "task": TaskSummary }`.
  - شناسه‌های وظیفهٔ ناموجود، شکل خطای not-found متعلق به Gateway را برمی‌گردانند.
- `tasks.cancel` به `operator.write` نیاز دارد.
  - پارامترها: `{ "taskId": string, "reason"?: string }`.
  - نتیجه:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` گزارش می‌دهد که آیا دفتر، وظیفهٔ مطابقی داشته است یا نه. `cancelled`
    گزارش می‌دهد که آیا زمان اجرا لغو را پذیرفته یا ثبت کرده است.

`TaskSummary` شامل `id`، `status` و فرادادهٔ اختیاری مانند `kind`،
`runtime`، `title`، `agentId`، `sessionKey`، `childSessionKey`، `ownerKey`،
`runId`، `taskId`، `flowId`، `parentTaskId`، `sourceId`، timestampها، پیشرفت،
خلاصهٔ پایانی و متن خطای پالایش‌شده است. `agentId` عاملی را شناسایی می‌کند که
وظیفه را اجرا می‌کند؛ `sessionKey` و `ownerKey` زمینهٔ درخواست‌کننده و کنترل را
حفظ می‌کنند.

### متدهای کمک‌کنندهٔ اپراتور

- اپراتورها می‌توانند `commands.list` (`operator.read`) را برای دریافت فهرست دستورهای زمان اجرای یک عامل فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن دستور متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both`، در صورت وجود، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` نام دستور بومی آگاه از ارائه‌دهنده را، وقتی وجود داشته باشد، حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی و در دسترس بودن دستورهای Plugin بومی اثر می‌گذارد.
  - `includeArgs=false` فراداده آرگومان سریال‌شده را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند `tools.catalog` (`operator.read`) را برای دریافت کاتالوگ ابزار زمان اجرا برای یک عامل فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه ابزار Plugin اختیاری است یا نه
- اپراتورها می‌توانند `tools.effective` (`operator.read`) را برای دریافت فهرست ابزار مؤثر در زمان اجرا برای یک نشست فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش زمینه احراز هویت یا تحویلِ ارائه‌شده توسط فراخوان، زمینه زمان اجرای قابل اعتماد را سمت سرور از نشست استخراج می‌کند.
  - پاسخ، یک تصویر مشتق‌شده سمت سرور و محدود به نشست از فهرست فعال است، شامل ابزارهای هسته، Plugin، کانال، و ابزارهای سرور MCP که از قبل کشف شده‌اند.
  - `tools.effective` برای MCP فقط خواندنی است: ممکن است کاتالوگ MCP یک نشست گرم را از طریق سیاست نهایی ابزار تصویر کند، اما زمان‌های اجرای MCP را ایجاد نمی‌کند، ترابری‌ها را وصل نمی‌کند، یا `tools/list` صادر نمی‌کند. اگر هیچ کاتالوگ گرم مطابقی وجود نداشته باشد، پاسخ ممکن است اعلانی مانند `mcp-not-yet-connected`، `mcp-not-yet-listed`، یا `mcp-stale-catalog` را شامل شود.
  - ورودی‌های ابزار مؤثر از `source="core"`، `source="plugin"`، `source="channel"`، یا `source="mcp"` استفاده می‌کنند.
- اپراتورها می‌توانند `tools.invoke` (`operator.write`) را برای فراخوانی یک ابزار در دسترس از همان مسیر سیاست Gateway مانند `/tools/invoke` فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm`، و `idempotencyKey` اختیاری هستند.
  - اگر هم `sessionKey` و هم `agentId` وجود داشته باشند، عامل نشست حل‌شده باید با `agentId` مطابقت داشته باشد.
  - پوشش‌دهنده‌های هسته فقط-مالک مانند `cron`، `gateway`، و `nodes` به هویت مالک/مدیر (`operator.admin`) نیاز دارند، هرچند خود متد `tools.invoke` برابر `operator.write` است.
  - پاسخ یک پوشش رو به SDK با فیلدهای `ok`، `toolName`، `output` اختیاری، و `error` نوع‌دار است. ردهای تأیید یا سیاست، به‌جای دور زدن خط لوله سیاست ابزار Gateway، در payload مقدار `ok:false` برمی‌گردانند.
- اپراتورها می‌توانند `skills.status` (`operator.read`) را برای دریافت فهرست skill قابل مشاهده برای یک عامل فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های موجود نبودن، بررسی‌های پیکربندی، و گزینه‌های نصب پاک‌سازی‌شده است، بدون افشای مقادیر خام secret.
- اپراتورها می‌توانند `skills.search` و `skills.detail` (`operator.read`) را برای فراداده کشف ClawHub فراخوانی کنند.
- اپراتورها می‌توانند `skills.upload.begin`، `skills.upload.chunk`، و `skills.upload.commit` (`operator.admin`) را برای آماده‌سازی یک آرشیو skill خصوصی پیش از نصب آن فراخوانی کنند. این یک مسیر بارگذاری مدیرانه جداگانه برای کلاینت‌های قابل اعتماد است، نه جریان عادی نصب skill از ClawHub، و به‌طور پیش‌فرض غیرفعال است مگر اینکه `skills.install.allowUploadedArchives` فعال باشد.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    یک بارگذاری وابسته به آن slug و مقدار force ایجاد می‌کند.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` بایت‌ها را در offset دقیقِ رمزگشایی‌شده اضافه می‌کند.
  - `skills.upload.commit({ uploadId, sha256? })` اندازه نهایی و SHA-256 را راستی‌آزمایی می‌کند. Commit فقط بارگذاری را نهایی می‌کند؛ skill را نصب نمی‌کند.
  - آرشیوهای skill بارگذاری‌شده آرشیوهای zip هستند که یک ریشه `SKILL.md` دارند. نام دایرکتوری داخلی آرشیو هرگز هدف نصب را انتخاب نمی‌کند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در سه حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه skill را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت بارگذاری: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    یک بارگذاری commit‌شده را در دایرکتوری `skills/<slug>` فضای کاری عامل پیش‌فرض نصب می‌کند. مقدار slug و force باید با درخواست اصلی `skills.upload.begin` مطابقت داشته باشند. این حالت رد می‌شود مگر اینکه `skills.install.allowUploadedArchives` فعال باشد. این تنظیم بر نصب‌های ClawHub اثر نمی‌گذارد.
  - حالت نصب‌کننده Gateway: `{ name, installId, timeoutMs? }`
    یک کنش اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند. کلاینت‌های قدیمی‌تر ممکن است هنوز `dangerouslyForceUnsafeInstall` را ارسال کنند؛ این فیلد منسوخ شده، فقط برای سازگاری پروتکل پذیرفته می‌شود، و نادیده گرفته می‌شود. برای تصمیم‌های نصب تحت مالکیت اپراتور از `security.installPolicy` استفاده کنید.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug رهگیری‌شده یا همه نصب‌های رهگیری‌شده ClawHub را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`، `apiKey`، و `env` را patch می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ کاتالوگ مجاز است، شامل مدل‌های کشف‌شده به‌صورت پویا برای ورودی‌های `provider/*`. در غیر این صورت پاسخ، کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد، شامل کشف محدود به ارائه‌دهنده برای ورودی‌های `provider/*`. بدون یک allowlist، پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این برای تشخیص و رابط‌های کاربری کشف استفاده کنید، نه انتخاب‌گرهای عادی مدل.

## تأییدهای اجرا

- وقتی یک درخواست exec به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` حل می‌کنند (به scope `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید `systemRunPlan` را شامل شود (`argv`/`cwd`/`rawCommand`/فراداده نشستِ canonical). درخواست‌هایی که `systemRunPlan` ندارند رد می‌شوند.
- پس از تأیید، فراخوانی‌های فورواردشده `node.invoke system.run` همان `systemRunPlan` canonical را به‌عنوان زمینه معتبر دستور/cwd/نشست دوباره استفاده می‌کنند.
- اگر فراخوان بین آماده‌سازی و فوروارد نهاییِ تأییدشده `system.run` مقدار `command`، `rawCommand`، `cwd`، `agentId`، یا `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به payload تغییریافته، اجرا را رد می‌کند.

## fallback تحویل عامل

- درخواست‌های `agent` می‌توانند `deliver=true` را برای درخواست تحویل خروجی شامل کنند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را نگه می‌دارد: هدف‌های تحویل حل‌نشده یا فقط-داخلی `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` اجازه می‌دهد وقتی هیچ مسیر قابل تحویل خارجی قابل حل نباشد، به اجرای فقط-نشست fallback شود (برای مثال نشست‌های داخلی/webchat یا پیکربندی‌های چندکاناله مبهم).
- نتیجه‌های نهایی `agent` ممکن است وقتی تحویل درخواست شده باشد `result.deliveryStatus` را شامل شوند، با استفاده از همان وضعیت‌های `sent`، `suppressed`، `partial_failed`، و `failed` که برای [`openclaw agent --json --deliver`](/fa/cli/agent#json-delivery-status) مستند شده‌اند.

## نسخه‌بندی

- `PROTOCOL_VERSION` در `packages/gateway-protocol/src/version.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را ارسال می‌کنند؛ سرور بازه‌هایی را که پروتکل فعلی‌اش را شامل نشوند رد می‌کند. کلاینت‌ها و سرورهای فعلی به پروتکل v4 نیاز دارند.
- Schemaها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در سراسر پروتکل v4 پایدار هستند و baseline مورد انتظار برای کلاینت‌های شخص ثالث‌اند.

| ثابت                                      | پیش‌فرض                                               | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| زمان پایان درخواست (برای هر RPC)          | `30_000` میلی‌ثانیه                                   | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| زمان پایان Preauth / چالش اتصال           | `15_000` میلی‌ثانیه                                   | `src/gateway/handshake-timeouts.ts` (پیکربندی/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| backoff اولیه اتصال مجدد                  | `1_000` میلی‌ثانیه                                    | `src/gateway/client.ts` (`backoffMs`)                                                      |
| حداکثر backoff اتصال مجدد                 | `30_000` میلی‌ثانیه                                   | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| محدودسازی تلاش مجدد سریع پس از بسته‌شدن device-token | `250` میلی‌ثانیه                                      | `src/gateway/client.ts`                                                                    |
| مهلت force-stop پیش از `terminate()`      | `250` میلی‌ثانیه                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| زمان پایان پیش‌فرض `stopAndWait()`        | `1_000` میلی‌ثانیه                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصله tick پیش‌فرض (پیش از `hello-ok`)    | `30_000` میلی‌ثانیه                                   | `src/gateway/client.ts`                                                                    |
| بستن در زمان پایان tick                   | کد `4000` وقتی سکوت از `tickIntervalMs * 2` فراتر برود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 مگابایت)                       | `src/gateway/server-constants.ts`                                                          |

سرور مقادیر مؤثر `policy.tickIntervalMs`، `policy.maxPayload`، و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، همان مقادیر را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت، مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا
  `gateway.auth.mode: "trusted-proxy"` غیر loopback، بررسی احراز هویت اتصال را از
  سرآیندهای درخواست، به‌جای `connect.params.auth.*`، برآورده می‌کنند.
- حالت ورودی خصوصی `gateway.auth.mode: "none"` احراز هویت اتصال با راز مشترک را
  کاملا رد می‌کند؛ این حالت را روی ورودی عمومی/نامطمئن در معرض دسترس قرار ندهید.
- پس از جفت‌سازی، Gateway یک **توکن دستگاه** صادر می‌کند که به نقش اتصال
  + دامنه‌ها محدود است. این توکن در `hello-ok.auth.deviceToken` برگردانده می‌شود و باید
  برای اتصال‌های آینده توسط کلاینت پایدار شود.
- کلاینت‌ها باید `hello-ok.auth.deviceToken` اصلی را پس از هر اتصال موفق
  پایدار کنند.
- اتصال مجدد با آن توکن دستگاه **ذخیره‌شده** باید مجموعه دامنه تاییدشده ذخیره‌شده
  برای آن توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت را
  که قبلا اعطا شده حفظ می‌کند و از فروکاستن بی‌صدای اتصال‌های مجدد به یک
  دامنه ضمنی باریک‌تر و فقط مدیریتی جلوگیری می‌کند.
- سرهم‌بندی احراز هویت اتصال در سمت کلاینت (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و هر زمان تنظیم شده باشد همیشه ارسال می‌شود.
  - `auth.token` به‌ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس یک `deviceToken` صریح، سپس یک توکن ذخیره‌شده به‌ازای هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط زمانی فرستاده می‌شود که هیچ‌کدام از موارد بالا یک
    `auth.token` را به‌دست نیاورده باشند. توکن مشترک یا هر توکن دستگاه به‌دست‌آمده‌ای آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش مجدد یک‌باره
    `AUTH_TOKEN_MISMATCH` فقط به **نقطه‌های پایانی مورد اعتماد** محدود است —
    loopback، یا `wss://` با `tlsFingerprint` سنجاق‌شده. `wss://` عمومی
    بدون سنجاق‌کردن واجد شرایط نیست.
- راه‌اندازی bootstrap داخلی با کد راه‌اندازی، `hello-ok.auth.deviceToken` نود اصلی
  به‌همراه یک توکن عملگر محدود را در
  `hello-ok.auth.deviceTokens` برای تحویل موبایل مورد اعتماد برمی‌گرداند. توکن عملگر
  شامل `operator.talk.secrets` برای خواندن پیکربندی بومی Talk است، اما
  دامنه‌های تغییر جفت‌سازی و `operator.admin` را مستثنی می‌کند.
- هنگامی که bootstrap کد راه‌اندازی غیرخط‌مبنا منتظر تایید است، جزئیات `PAIRING_REQUIRED`
  شامل `recommendedNextStep: "wait_then_retry"`، `retryable: true`،
  و `pauseReconnect: false` است. کلاینت‌ها باید تا زمانی که درخواست تایید شود
  یا توکن نامعتبر شود، با همان توکن bootstrap به اتصال مجدد ادامه دهند.
- `hello-ok.auth.deviceTokens` را فقط زمانی پایدار کنید که اتصال از احراز هویت bootstrap
  روی یک انتقال مورد اعتماد مانند `wss://` یا جفت‌سازی loopback/محلی استفاده کرده باشد.
- اگر کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، آن
  مجموعه دامنه درخواست‌شده توسط فراخواننده مرجع باقی می‌ماند؛ دامنه‌های کش‌شده فقط
  زمانی دوباره استفاده می‌شوند که کلاینت از توکن ذخیره‌شده به‌ازای هر دستگاه دوباره استفاده کند.
- توکن‌های دستگاه را می‌توان از طریق `device.token.rotate` و
  `device.token.revoke` چرخاند/لغو کرد (به دامنه `operator.pairing` نیاز دارد). چرخاندن یا
  لغو یک نود یا نقش غیرعملگر دیگر همچنین به `operator.admin` نیاز دارد.
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. این متد توکن bearer جایگزین را
  فقط برای فراخوانی‌های همان دستگاه که از قبل با همان توکن دستگاه احراز هویت شده‌اند
  بازتاب می‌دهد، تا کلاینت‌های فقط‌توکن بتوانند جایگزین خود را پیش از
  اتصال مجدد پایدار کنند. چرخش‌های مشترک/مدیریتی توکن bearer را بازتاب نمی‌دهند.
- صدور، چرخش، و لغو توکن محدود به مجموعه نقش تاییدشده‌ای می‌ماند
  که در ورودی جفت‌سازی آن دستگاه ثبت شده است؛ تغییر توکن نمی‌تواند دامنه را گسترش دهد یا
  نقش دستگاهی را هدف بگیرد که تایید جفت‌سازی هرگز اعطا نکرده است.
- برای نشست‌های توکن دستگاه جفت‌شده، مدیریت دستگاه خوددامنه است مگر این‌که
  فراخواننده `operator.admin` نیز داشته باشد: فراخواننده‌های غیرمدیر فقط می‌توانند
  توکن عملگر ورودی دستگاه **خودشان** را مدیریت کنند. مدیریت توکن نود و دیگر
  توکن‌های غیرعملگر فقط مدیریتی است، حتی برای دستگاه خود فراخواننده.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه دامنه توکن عملگر هدف
  را در برابر دامنه‌های نشست فعلی فراخواننده بررسی می‌کنند. فراخواننده‌های غیرمدیر
  نمی‌توانند توکن عملگری گسترده‌تر از آنچه خودشان دارند را بچرخانند یا لغو کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (بولی)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های مورد اعتماد می‌توانند یک تلاش مجدد محدود با توکن کش‌شده به‌ازای هر دستگاه انجام دهند.
  - اگر آن تلاش مجدد شکست بخورد، کلاینت‌ها باید حلقه‌های اتصال مجدد خودکار را متوقف کنند و راهنمای اقدام عملگر را نمایش دهند.
- `AUTH_SCOPE_MISMATCH` یعنی توکن دستگاه شناسایی شد اما نقش/دامنه‌های
  درخواست‌شده را پوشش نمی‌دهد. کلاینت‌ها نباید این را به‌عنوان توکن بد نمایش دهند؛
  از عملگر بخواهید دوباره جفت‌سازی کند یا قرارداد دامنه باریک‌تر/گسترده‌تر را تایید کند.

## هویت دستگاه + جفت‌سازی

- نودها باید یک هویت دستگاه پایدار (`device.id`) داشته باشند که از
  اثرانگشت keypair مشتق شده است.
- Gatewayها برای هر دستگاه + نقش توکن صادر می‌کنند.
- تاییدهای جفت‌سازی برای شناسه‌های دستگاه جدید لازم هستند، مگر این‌که تایید خودکار محلی
  فعال باشد.
- تایید خودکار جفت‌سازی حول اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر self-connect محدود محلی در backend/container برای
  جریان‌های کمکی راز مشترک مورد اعتماد دارد.
- اتصال‌های tailnet همان میزبان یا LAN همچنان برای جفت‌سازی remote تلقی می‌شوند و
  به تایید نیاز دارند.
- کلاینت‌های WS معمولا هویت `device` را هنگام `connect` شامل می‌کنند (عملگر +
  نود). تنها استثناهای عملگر بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط localhost.
  - احراز هویت موفق Control UI عملگر با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass، کاهش شدید امنیت).
  - RPCهای backend مستقیم-loopback `gateway-client` روی مسیر کمکی داخلی
    رزروشده.
- حذف هویت دستگاه پیامدهای دامنه دارد. وقتی اتصال عملگر بدون دستگاه
  از طریق یک مسیر اعتماد صریح مجاز می‌شود، OpenClaw همچنان دامنه‌های
  خوداظهارشده را به یک مجموعه خالی پاک می‌کند مگر این‌که آن مسیر یک استثنای
  نام‌گذاری‌شده برای حفظ دامنه داشته باشد. سپس متدهای محدودشده با دامنه با
  `missing scope` شکست می‌خورند.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` یک مسیر حفظ دامنه
  break-glass برای Control UI است. این گزینه دامنه‌ها را به کلاینت‌های WebSocket
  سفارشی دلخواه backend یا CLI-شکل اعطا نمی‌کند.
- مسیر کمکی backend رزروشده مستقیم-loopback `gateway-client`
  دامنه‌ها را فقط برای RPCهای داخلی control-plane محلی حفظ می‌کند؛ شناسه‌های backend سفارشی
  این استثنا را دریافت نمی‌کنند.
- همه اتصال‌ها باید nonce ارائه‌شده توسط سرور در `connect.challenge` را امضا کنند.

### عیب‌یابی مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنا                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده (یا خالی فرستاده) است. |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce کهنه/اشتباه امضا کرده است.         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload امضا با payload نسخه 2 مطابقت ندارد.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | زمان‌مهر امضاشده خارج از skew مجاز است.            |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثرانگشت کلید عمومی مطابقت ندارد.  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/استانداردسازی کلید عمومی شکست خورد.          |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- payload نسخه 2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- payload امضای ترجیحی `v3` است، که علاوه بر فیلدهای دستگاه/کلاینت/نقش/دامنه‌ها/توکن/nonce،
  `platform` و `deviceFamily` را نیز bind می‌کند.
- امضاهای قدیمی `v2` برای سازگاری همچنان پذیرفته می‌شوند، اما pinning فراداده
  دستگاه جفت‌شده همچنان سیاست فرمان را در اتصال مجدد کنترل می‌کند.

## TLS + سنجاق‌کردن

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثرانگشت گواهی gateway را سنجاق کنند (پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` را ببینید).

## دامنه

این پروتکل **API کامل gateway** را در معرض دسترس قرار می‌دهد (وضعیت، کانال‌ها، مدل‌ها، چت،
عامل، نشست‌ها، نودها، تاییدها، و غیره). سطح دقیق توسط
طرحواره‌های TypeBox در `packages/gateway-protocol/src/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل Bridge](/fa/gateway/bridge-protocol)
- [runbook Gateway](/fa/gateway)
