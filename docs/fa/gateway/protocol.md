---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS مربوط به Gateway
    - اشکال‌زدایی ناسازگاری‌های پروتکل یا خطاهای اتصال
    - بازسازی طرح‌واره/مدل‌های پروتکل
summary: 'پروتکل WebSocket Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-07-03T17:34:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل Gateway WS **صفحه کنترل واحد + انتقال نود** برای OpenClaw است. همه کلاینت‌ها (CLI، رابط وب، اپ macOS، نودهای iOS/Android، نودهای بی‌سر)
از طریق WebSocket متصل می‌شوند و در زمان handshake، **نقش** + **محدوده** خود را اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود می‌شوند. پس از یک handshake موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. با فعال بودن diagnostics،
  فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه gateway فریم تحت تاثیر را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطح‌ها و کدهای دلیل امن را نگه می‌دارند. آن‌ها بدنه پیام،
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
یک خطای قابل‌تلاش‌مجدد `UNAVAILABLE` برگرداند که `details.reason` روی
`"startup-sidecars"` تنظیم شده و شامل `retryAfterMs` است. کلاینت‌ها باید این پاسخ را
در چارچوب بودجه کلی اتصال خود دوباره تلاش کنند، نه اینکه آن را به‌عنوان شکست نهایی
handshake نمایش دهند.

`server`، `features`، `snapshot` و `policy` همگی طبق schema
(`packages/gateway-protocol/src/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/محدوده‌های توافق‌شده را گزارش می‌کند. `pluginSurfaceUrls` اختیاری است و نام‌های سطح plugin،
مانند `canvas`، را به URLهای میزبانی‌شده و محدود به scope نگاشت می‌کند.

URLهای سطح plugin محدود به scope ممکن است منقضی شوند. نودها می‌توانند
`node.pluginSurface.refresh` را با `{ "surface": "canvas" }` فراخوانی کنند تا یک ورودی تازه
در `pluginSurfaceUrls` دریافت کنند. بازآرایی آزمایشی Canvas plugin از مسیر سازگاری منسوخ‌شده
`canvasHostUrl`، `canvasCapability` یا
`node.canvas.capability.refresh` پشتیبانی نمی‌کند؛ کلاینت‌های native و gatewayهای فعلی باید از سطح‌های plugin استفاده کنند.

وقتی هیچ توکن دستگاهی صادر نمی‌شود، `hello-ok.auth` مجوزهای توافق‌شده را
بدون فیلدهای توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend هم‌فرایند قابل‌اعتماد (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصال‌های مستقیم loopback، هنگامی‌که با توکن/رمز مشترک gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای داخلی control-plane رزرو شده است و مانع می‌شود baselineهای قدیمی جفت‌سازی CLI/دستگاه، کار backend محلی مانند به‌روزرسانی‌های نشست subagent را مسدود کنند. کلاینت‌های راه‌دور،
کلاینت‌های با مبدا مرورگر، کلاینت‌های نود، و کلاینت‌های صریح دارای device-token/device-identity
همچنان از بررسی‌های عادی جفت‌سازی و ارتقای scope استفاده می‌کنند.

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

راه‌اندازی bootstrap داخلی QR/setup-code یک مسیر تازه واگذاری موبایل است. یک اتصال
موفق baseline با setup-code، یک توکن نود اصلی به‌همراه یک توکن محدود operator برمی‌گرداند:

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

واگذاری operator عمدا محدود است تا QR onboarding بتواند حلقه operator موبایل را شروع کند
و راه‌اندازی native را بدون اعطای scopeهای تغییر جفت‌سازی یا `operator.admin` کامل کند. این شامل `operator.talk.secrets` است تا
کلاینت native بتواند پیکربندی Talk موردنیاز خود را پس از bootstrap بخواند. دسترسی گسترده‌تر
به جفت‌سازی و admin به یک جریان جداگانه جفت‌سازی operator تاییدشده یا توکن نیاز دارد. کلاینت‌ها باید
`hello-ok.auth.deviceTokens` را فقط زمانی نگه‌داری کنند
که اتصال از bootstrap auth روی انتقال قابل‌اعتماد مانند `wss://` یا
loopback/جفت‌سازی محلی استفاده کرده باشد.

### نمونه نود

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

متدهایی که اثر جانبی دارند به **کلیدهای idempotency** نیاز دارند (schema را ببینید).

## نقش‌ها + scopeها

برای مدل کامل scopeهای operator، بررسی‌های زمان تایید، و معناشناسی shared-secret،
[scopeهای Operator](/fa/gateway/operator-scopes) را ببینید.

### نقش‌ها

- `operator` = کلاینت control plane (CLI/UI/automation).
- `node` = میزبان قابلیت (camera/screen/canvas/system.run).

### Scopeها (operator)

scopeهای رایج:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` با `includeSecrets: true` به `operator.talk.secrets`
(یا `operator.admin`) نیاز دارد.
وقتی secrets گنجانده می‌شوند، کلاینت‌ها باید credential ارائه‌دهنده فعال Talk را
از `talk.resolved.config.apiKey` بخوانند؛ `talk.providers.<id>.apiKey`
در شکل منبع باقی می‌ماند و ممکن است یک آبجکت SecretRef یا یک رشته redacted باشد.

متدهای Gateway RPC ثبت‌شده توسط Plugin ممکن است scope operator خود را درخواست کنند، اما
پیشوندهای admin هسته رزروشده (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` resolve می‌شوند.

scope متد فقط نخستین gate است. برخی دستورهای slash که از طریق
`chat.send` رسیده‌اند، بررسی‌های سخت‌گیرانه‌تر در سطح دستور را روی آن اعمال می‌کنند. برای مثال، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` همچنین افزون بر scope پایه متد، یک بررسی scope اضافی در زمان تایید دارد:

- درخواست‌های بدون دستور: `operator.pairing`
- درخواست‌های دارای دستورهای نود غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare` یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (نود)

نودها ادعاهای قابلیت را در زمان اتصال اعلام می‌کنند:

- `caps`: دسته‌های سطح‌بالای قابلیت مانند `camera`، `canvas`، `screen`،
  `location`، `voice` و `talk`.
- `commands`: allowlist دستور برای invoke.
- `permissions`: toggleهای granular (مثلا `screen.record`، `camera.capture`).

Gateway با این موارد به‌عنوان **ادعا** برخورد می‌کند و allowlistهای سمت سرور را اعمال می‌کند.

## Presence

- `system-presence` ورودی‌هایی را برمی‌گرداند که بر اساس هویت دستگاه کلیدگذاری شده‌اند.
- ورودی‌های presence شامل `deviceId`، `roles` و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف واحد نشان دهند
  حتی وقتی هم به‌عنوان **operator** و هم به‌عنوان **node** متصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. نودهای متصل
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ نودهای جفت‌شده همچنین می‌توانند
  وقتی یک رویداد نود قابل‌اعتماد فراداده جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، presence پس‌زمینه پایدار گزارش کنند.

### رویداد زنده‌بودن پس‌زمینه نود

نودها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک نود جفت‌شده
در جریان یک بیدارسازی پس‌زمینه زنده بوده است، بدون اینکه به‌عنوان متصل علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual` یا `connect`. رشته‌های trigger ناشناخته پیش از پایداری‌سازی
توسط gateway به `background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه نود احراز‌هویت‌شده
پایدار است؛ نشست‌های بدون دستگاه یا جفت‌نشده `handled: false` برمی‌گردانند.

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
یک RPC تاییدشده بدانند، نه پایداری‌سازی durable presence.

## Scopeدهی رویدادهای broadcast

رویدادهای broadcast در WebSocket که سرور push می‌کند، scope-gated هستند تا نشست‌های محدود به pairing یا فقط node، محتوای نشست را به‌صورت منفعل دریافت نکنند.

- **فریم‌های chat، agent و tool-result** (شامل رویدادهای streamed `agent` و نتایج tool call) حداقل به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را کاملا رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به اینکه plugin آن‌ها را چگونه ثبت کرده است، به `operator.write` یا `operator.admin` محدود می‌شوند.
- **رویدادهای status و transport** (`heartbeat`، `presence`، `tick`، چرخه عمر connect/disconnect و غیره) بدون محدودیت باقی می‌مانند تا سلامت transport برای هر نشست احراز‌هویت‌شده قابل مشاهده باشد.
- **خانواده‌های ناشناخته رویداد broadcast** به‌صورت پیش‌فرض scope-gated هستند (fail-closed)، مگر اینکه یک handler ثبت‌شده صراحتا آن‌ها را آزادتر کند.

هر اتصال کلاینت شماره توالی per-client خودش را نگه می‌دارد تا broadcastها ترتیب monotonic را روی همان socket حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوت scope-filtered از جریان رویداد را می‌بینند.

## خانواده‌های رایج متد RPC

سطح عمومی WS گسترده‌تر از مثال‌های handshake/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست کشف محافظه‌کارانه است
که از `src/gateway/server-methods-list.ts` به‌علاوه exportهای متد plugin/channel بارگذاری‌شده ساخته شده است. با آن به‌عنوان کشف قابلیت برخورد کنید، نه یک
فهرست کامل از `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="سامانه و هویت">
    - `health` عکس فوری سلامت Gateway را که کش‌شده یا تازه بررسی‌شده است برمی‌گرداند.
    - `diagnostics.stability` ثبت‌کننده پایداری تشخیصی محدود اخیر را برمی‌گرداند. این مورد فراداده عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایتی، خوانش‌های حافظه، وضعیت صف/نشست، نام‌های کانال/Plugin و شناسه‌های نشست را نگه می‌دارد. متن چت، بدنه‌های Webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها یا مقادیر محرمانه را نگه نمی‌دارد. دامنه خواندن اپراتور لازم است.
    - `status` خلاصه Gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های اپراتور با دامنه ادمین گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه Gateway را که جریان‌های رله و جفت‌سازی استفاده می‌کنند برمی‌گرداند.
    - `system-presence` عکس فوری حضور فعلی برای دستگاه‌های اپراتور/Node متصل را برمی‌گرداند.
    - `system-event` یک رویداد سیستمی اضافه می‌کند و می‌تواند زمینه حضور را به‌روزرسانی/پخش کند.
    - `last-heartbeat` آخرین رویداد Heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را روی Gateway روشن یا خاموش می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و مصرف">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخاب‌گر (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را پاس دهید، یا برای کاتالوگ کامل مقدار `{ "view": "all" }` را پاس دهید.
    - `usage.status` پنجره‌های مصرف ارائه‌دهنده/خلاصه‌های سهمیه باقی‌مانده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیع‌شده مصرف هزینه را برای یک بازه تاریخ برمی‌گرداند.
      برای یک عامل `agentId` را پاس دهید، یا برای تجمیع عامل‌های پیکربندی‌شده `agentScope: "all"` را پاس دهید.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding کش‌شده را برای فضای کاری عامل پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخواننده صراحتا یک ping زنده به ارائه‌دهنده embedding می‌خواهد، مقدار `{ "probe": true }` یا `{ "deep": true }` را پاس دهید. کلاینت‌های آگاه از Dreaming می‌توانند برای محدود کردن آمار مخزن Dreaming به فضای کاری عامل انتخاب‌شده، مقدار `{ "agentId": "agent-id" }` را نیز پاس دهند؛ حذف `agentId` fallback عامل پیش‌فرض را نگه می‌دارد و فضاهای کاری Dreaming پیکربندی‌شده را تجمیع می‌کند.
    - `doctor.memory.dreamDiary`، `doctor.memory.backfillDreamDiary`، `doctor.memory.resetDreamDiary`، `doctor.memory.resetGroundedShortTerm`، `doctor.memory.repairDreamingArtifacts` و `doctor.memory.dedupeDreamDiary` پارامترهای اختیاری `{ "agentId": "agent-id" }` را برای نماها/کنش‌های Dreaming عامل انتخاب‌شده می‌پذیرند. وقتی `agentId` حذف شود، روی فضای کاری عامل پیش‌فرض پیکربندی‌شده عمل می‌کنند.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از ابزار REM را برای کلاینت‌های صفحه کنترل راه دور برمی‌گرداند. می‌تواند مسیرهای فضای کاری، قطعه‌های حافظه، Markdown زمینه‌مند رندرشده و نامزدهای ارتقای عمیق را شامل شود، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های مصرف هر نشست را برمی‌گرداند. برای یک
      عامل `agentId` را پاس دهید، یا برای فهرست کردن عامل‌های پیکربندی‌شده با هم `agentScope: "all"` را پاس دهید.
    - `sessions.usage.timeseries` مصرف سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های گزارش مصرف را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص که کانال از خروج پشتیبانی می‌کند خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/وب را برای ارائه‌دهنده کانال وب فعلی که قابلیت QR دارد شروع می‌کند.
    - `web.login.wait` منتظر تکمیل آن جریان ورود QR/وب می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک push آزمایشی APNs به یک Node ثبت‌شده iOS می‌فرستد.
    - `voicewake.get` محرک‌های wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` محرک‌های wake-word را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و گزارش‌ها">
    - `send` فراخوانی RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گیری‌شده به کانال/حساب/رشته خارج از اجراکننده چت است.
    - `logs.tail` دنباله گزارش فایل Gateway پیکربندی‌شده را با کنترل‌های مکان‌نما/حد و بیشینه بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.catalog` کاتالوگ فقط‌خواندنی ارائه‌دهنده Talk را برای گفتار، رونویسی جریانی و صدای بلادرنگ برمی‌گرداند. این مورد شناسه‌های canonical ارائه‌دهنده، نام‌های مستعار رجیستری، برچسب‌ها، وضعیت پیکربندی‌شده، نتیجه اختیاری `ready` در سطح گروه، شناسه‌های مدل/صدا در معرض، حالت‌های canonical، انتقال‌ها، راهبردهای مغز، و پرچم‌های صوت/قابلیت بلادرنگ را شامل می‌شود، بدون اینکه اسرار ارائه‌دهنده را برگرداند یا پیکربندی سراسری را تغییر دهد. Gatewayهای فعلی پس از اعمال انتخاب ارائه‌دهنده در زمان اجرا `ready` را تنظیم می‌کنند؛ کلاینت‌ها باید نبود آن را برای سازگاری با Gatewayهای قدیمی‌تر تأییدنشده در نظر بگیرند.
    - `talk.config` payload پیکربندی مؤثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.session.create` یک نشست Talk متعلق به Gateway برای `realtime/gateway-relay`، `transcription/gateway-relay` یا `stt-tts/managed-room` ایجاد می‌کند. برای `stt-tts/managed-room`، فراخواننده‌های `operator.write` که `sessionKey` را پاس می‌دهند باید برای نمایانی محدودشده کلید نشست `spawnedBy` را نیز پاس دهند؛ ایجاد `sessionKey` بدون دامنه و `brain: "direct-tools"` به `operator.admin` نیاز دارد.
    - `talk.session.join` یک توکن نشست managed-room را اعتبارسنجی می‌کند، در صورت نیاز رویدادهای `session.ready` یا `session.replaced` را منتشر می‌کند، و فراداده اتاق/نشست به‌همراه رویدادهای اخیر Talk را بدون توکن متن ساده یا hash توکن ذخیره‌شده برمی‌گرداند.
    - `talk.session.appendAudio` صوت ورودی PCM با کدگذاری base64 را به نشست‌های رله بلادرنگ و رونویسی متعلق به Gateway اضافه می‌کند.
    - `talk.session.startTurn`، `talk.session.endTurn` و `talk.session.cancelTurn` چرخه عمر نوبت managed-room را با رد نوبت کهنه پیش از پاک شدن وضعیت هدایت می‌کنند.
    - `talk.session.cancelOutput` خروجی صوتی دستیار را متوقف می‌کند، عمدتا برای barge-in با دروازه VAD در نشست‌های رله Gateway.
    - `talk.session.submitToolResult` یک فراخوانی ابزار ارائه‌دهنده را که توسط نشست رله بلادرنگ متعلق به Gateway منتشر شده است تکمیل می‌کند. برای خروجی موقت ابزار وقتی نتیجه نهایی در ادامه می‌آید، `options: { willContinue: true }` را پاس دهید، یا وقتی نتیجه ابزار باید فراخوانی ارائه‌دهنده را بدون شروع پاسخ بلادرنگ دیگری از دستیار برآورده کند، `options: { suppressResponse: true }` را پاس دهید.
    - `talk.session.steer` کنترل صوتی اجرای فعال را به یک نشست Talk پشتوانه‌دار با عامل و متعلق به Gateway می‌فرستد. این مورد `{ sessionId, text, mode? }` را می‌پذیرد، که در آن `mode` برابر `status`، `steer`، `cancel` یا `followup` است؛ حالت حذف‌شده از متن گفتاری طبقه‌بندی می‌شود.
    - `talk.session.close` یک نشست رله، رونویسی یا managed-room متعلق به Gateway را می‌بندد و رویدادهای پایانی Talk را منتشر می‌کند.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/واسط کاربری کنترل تنظیم/پخش می‌کند.
    - `talk.client.create` یک نشست ارائه‌دهنده بلادرنگ متعلق به کلاینت را با استفاده از `webrtc` یا `provider-websocket` ایجاد می‌کند، در حالی که Gateway مالک پیکربندی، اعتبارنامه‌ها، دستورالعمل‌ها و سیاست ابزار است.
    - `talk.client.toolCall` به انتقال‌های بلادرنگ متعلق به کلاینت اجازه می‌دهد فراخوانی‌های ابزار ارائه‌دهنده را به سیاست Gateway ارسال کنند. نخستین ابزار پشتیبانی‌شده `openclaw_agent_consult` است؛ کلاینت‌ها یک شناسه اجرا دریافت می‌کنند و پیش از ارسال نتیجه ابزار مخصوص ارائه‌دهنده منتظر رویدادهای چرخه عمر عادی چت می‌مانند.
    - `talk.client.steer` کنترل صوتی اجرای فعال را برای انتقال‌های بلادرنگ متعلق به کلاینت می‌فرستد. Gateway اجرای تعبیه‌شده فعال را از `sessionKey` حل می‌کند و به‌جای انداختن بی‌صدای فرمان، یک نتیجه ساختاریافته پذیرفته/ردشده برمی‌گرداند.
    - `talk.event` کانال واحد رویداد Talk برای آداپتورهای بلادرنگ، رونویسی، STT/TTS، managed-room، تلفنی و جلسه است.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk ترکیب می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان fallback و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` موجودی نمایان ارائه‌دهنده TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را روشن یا خاموش می‌کنند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی و wizard">
    - `secrets.reload` SecretRefهای فعال را دوباره resolve می‌کند و وضعیت اسرار زمان اجرا را فقط در صورت موفقیت کامل جایگزین می‌کند.
    - `secrets.resolve` انتساب‌های secret هدف‌گیری‌شده به فرمان را برای یک مجموعه فرمان/هدف مشخص resolve می‌کند.
    - `config.get` عکس فوری و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را ادغام می‌کند. جایگزینی مخرب آرایه
      مستلزم وجود مسیر متأثر در `replacePaths` است؛ آرایه‌های تودرتو
      زیر ورودی‌های آرایه از مسیرهای `[]` مانند `agents.list[].skills` استفاده می‌کنند.
    - `config.apply` کل payload پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` payload schema پیکربندی زنده را که واسط کاربری کنترل و ابزارهای CLI استفاده می‌کنند برمی‌گرداند: schema، `uiHints`، نسخه و فراداده تولید، شامل فراداده schema مربوط به Plugin + کانال وقتی زمان اجرا بتواند آن را بارگذاری کند. schema فراداده فیلد `title` / `description` را شامل می‌شود که از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط UI مشتق شده‌اند، از جمله object تودرتو، wildcard، array-item و شاخه‌های ترکیب `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد مطابق وجود داشته باشد.
    - `config.schema.lookup` یک payload lookup محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک node سطحی schema، hint مطابق + `hintPath`، `reloadKind` اختیاری، و خلاصه‌های فرزند فوری برای drill-down در UI/CLI. `reloadKind` یکی از `restart`، `hot` یا `none` است و برنامه‌ریز reload پیکربندی Gateway را برای مسیر درخواست‌شده بازتاب می‌دهد. nodeهای lookup schema مستندات روبه‌کاربر و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، مرزهای عددی/رشته‌ای/آرایه‌ای/object، و پرچم‌هایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، `reloadKind` اختیاری، به‌علاوه `hint` / `hintPath` مطابق را در معرض می‌گذارند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد، restart را زمان‌بندی می‌کند؛ فراخواننده‌های دارای نشست می‌توانند `continuationMessage` را شامل کنند تا startup یک نوبت پیگیری عامل را از طریق صف ادامه restart از سر بگیرد. به‌روزرسانی‌های package-manager و به‌روزرسانی‌های git-checkout تحت نظارت از صفحه کنترل، به‌جای جایگزینی درخت package یا تغییر خروجی checkout/build درون Gateway زنده، از یک handoff سرویس مدیریت‌شده detached استفاده می‌کنند. یک handoff شروع‌شده `ok: true` را همراه با `result.reason: "managed-service-handoff-started"` و `handoff.status: "started"` برمی‌گرداند؛ handoffهای ناموجود یا ناموفق `ok: false` را همراه با `managed-service-handoff-unavailable` یا `managed-service-handoff-failed`، به‌علاوه `handoff.command` وقتی یک به‌روزرسانی shell دستی لازم باشد، برمی‌گردانند. handoff ناموجود یعنی OpenClaw مرز supervisor امن یا هویت سرویس بادوام ندارد، مانند `OPENCLAW_SYSTEMD_UNIT` برای systemd. در طول یک handoff شروع‌شده، sentinel مربوط به restart ممکن است برای مدت کوتاهی `stats.reason: "restart-health-pending"` را گزارش کند؛ ادامه تا وقتی CLI Gateway restart‌شده را تأیید کند و sentinel نهایی `ok` را بنویسد به تأخیر می‌افتد.
    - `update.status` تازه‌ترین sentinel مربوط به update restart را refresh کرده و برمی‌گرداند، شامل نسخه در حال اجرای پس از restart وقتی موجود باشد.
    - `wizard.start`، `wizard.next`، `wizard.status` و `wizard.cancel` wizard onboarding را از طریق WS RPC در معرض می‌گذارند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های Agent و فضای کاری">
    - `agents.list` ورودی‌های Agent پیکربندی‌شده، از جمله مدل مؤثر و فرادادهٔ runtime را برمی‌گرداند.
    - `agents.create`، `agents.update` و `agents.delete` رکوردهای Agent و اتصال فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get` و `agents.files.set` فایل‌های bootstrap فضای کاری را که برای یک Agent عرضه شده‌اند مدیریت می‌کنند.
    - `tasks.list`، `tasks.get` و `tasks.cancel` دفترکل وظایف Gateway را برای کلاینت‌های SDK و اپراتور عرضه می‌کنند.
    - `artifacts.list`، `artifacts.get` و `artifacts.download` خلاصه‌های artifact و دانلودهای مشتق‌شده از transcript را برای محدودهٔ صریح `sessionKey`، `runId` یا `taskId` عرضه می‌کنند. پرس‌وجوهای اجرا و وظیفه، نشست مالک را در سمت سرور resolve می‌کنند و فقط رسانه‌های transcript با منشأ مطابق را برمی‌گردانند؛ منابع URL ناامن یا محلی به‌جای واکشی در سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `environments.list` و `environments.status` کشف محیط‌های فقط‌خواندنی محلیِ Gateway و Node را برای کلاینت‌های SDK عرضه می‌کنند.
    - `agent.identity.get` هویت مؤثر دستیار را برای یک Agent یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک اجرا می‌ماند و در صورت موجود بودن، snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` نمایهٔ نشست فعلی را برمی‌گرداند، از جمله فرادادهٔ `agentRuntime` برای هر ردیف وقتی backend runtime یک Agent پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر نشست را برای کلاینت WS فعلی روشن و خاموش می‌کنند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد transcript/پیام را برای یک نشست روشن و خاموش می‌کنند.
    - `sessions.preview` پیش‌نمایش‌های محدود transcript را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.describe` یک ردیف نشست Gateway را برای یک کلید نشست دقیق برمی‌گرداند.
    - `sessions.resolve` هدف نشست را resolve یا canonicalize می‌کند.
    - `sessions.create` یک ورودی نشست جدید می‌سازد.
    - `sessions.send` پیامی را به یک نشست موجود می‌فرستد.
    - `sessions.steer` گونهٔ interrupt-and-steer برای یک نشست فعال است.
    - `sessions.abort` کار فعال یک نشست را متوقف می‌کند. فراخواننده می‌تواند `key` را همراه با `runId` اختیاری پاس بدهد، یا برای اجراهای فعالی که Gateway می‌تواند به یک نشست resolve کند، فقط `runId` را پاس بدهد.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌همراه `agentRuntime` مؤثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete` و `sessions.compact` نگهداشت نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort` و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌صورت نمایشی نرمال‌سازی می‌شود: تگ‌های directive درون‌خطی از متن قابل‌مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های فراخوانی ابزارِ کوتاه‌شده) و توکن‌های کنترلی مدلِ ASCII/تمام‌عرضِ نشت‌کرده حذف می‌شوند، ردیف‌های assistant که صرفاً silent-token هستند مانند `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.
    - `chat.message.get` خوانندهٔ افزایشی، محدود و تمام‌پیام برای یک ورودی transcript قابل‌مشاهده است. کلاینت‌ها `sessionKey`، در صورت agent-scoped بودن انتخاب نشست `agentId` اختیاری، و یک `messageId` از transcript را که قبلاً از طریق `chat.history` عرضه شده پاس می‌دهند، و Gateway همان projection نرمال‌شده برای نمایش را، بدون سقف کوتاه‌سازی سبک history، وقتی ورودی ذخیره‌شده هنوز موجود و بیش‌ازحد بزرگ نباشد برمی‌گرداند.
    - `chat.send` مقدار یک‌نوبتی `fastMode: "auto"` را می‌پذیرد تا از حالت سریع برای فراخوانی‌های مدل که پیش از cutoff خودکار شروع شده‌اند استفاده کند، سپس فراخوانی‌های retry، fallback، tool-result یا continuation بعدی را بدون حالت سریع شروع کند. مقدار پیش‌فرض cutoff برابر ۶۰ ثانیه است و می‌توان آن را برای هر مدل با `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` پیکربندی کرد. فراخوانندهٔ `chat.send` می‌تواند `fastAutoOnSeconds` یک‌نوبتی را پاس بدهد تا cutoff را برای آن درخواست override کند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و توکن‌های دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شدهٔ در انتظار و تأییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject` و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` یک توکن دستگاه جفت‌شده را در محدوده‌های نقش تأییدشده و دامنهٔ فراخوانندهٔ آن rotate می‌کند.
    - `device.token.revoke` یک توکن دستگاه جفت‌شده را در محدوده‌های نقش تأییدشده و دامنهٔ فراخوانندهٔ آن revoke می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، فراخوانی و کارهای در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove` و `node.pair.verify` جفت‌سازی Node و تأیید bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک Node متصل forward می‌کند.
    - `node.invoke.result` نتیجه را برای یک درخواست invoke برمی‌گرداند.
    - `node.event` رویدادهای منشأگرفته از Node را به gateway برمی‌گرداند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کارهای در انتظارِ بادوام را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تأیید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list` و `exec.approval.resolve` درخواست‌های تأیید یک‌بارهٔ exec به‌علاوهٔ lookup/replay تأییدهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` روی یک تأیید exec در انتظار منتظر می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در timeout مقدار `null`).
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای سیاست تأیید exec در gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تأیید exec محلیِ Node را از طریق فرمان‌های relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision` و `plugin.approval.resolve` جریان‌های تأیید تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills و ابزارها">
    - اتوماسیون: `wake` تزریق فوری یا در heartbeat بعدیِ متن wake را زمان‌بندی می‌کند؛ `cron.get`، `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کارهای زمان‌بندی‌شده را مدیریت می‌کنند.
    - `cron.run` همچنان یک RPC از نوع enqueue برای اجراهای دستی باقی می‌ماند. کلاینت‌هایی که به معناشناسی تکمیل نیاز دارند باید `runId` برگشتی را بخوانند و `cron.runs` را poll کنند.
    - `cron.runs` یک فیلتر اختیاری و غیرخالی `runId` می‌پذیرد تا کلاینت‌ها بتوانند یک اجرای دستی صف‌شده را بدون race با سایر ورودی‌های history همان job دنبال کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رایج رویداد

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و سایر رویدادهای چت فقط transcript.
  در protocol v4، payloadهای delta دارای `deltaText` هستند؛ `message` همچنان
  snapshot تجمعی assistant باقی می‌ماند. جایگزینی‌های غیرپیشوندی `replace=true`
  تنظیم می‌کنند و از `deltaText` به‌عنوان متن جایگزین استفاده می‌کنند.
- `session.message`، `session.operation` و `session.tool`: به‌روزرسانی‌های transcript،
  عملیات نشست در حال اجرا و event-stream برای یک نشست subscribe‌شده.
- `sessions.changed`: نمایهٔ نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / liveness.
- `health`: به‌روزرسانی snapshot سلامت gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد heartbeat.
- `cron`: رویداد تغییر اجرای/job مربوط به Cron.
- `shutdown`: اعلان خاموشی gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخهٔ عمر جفت‌سازی Node.
- `node.invoke.request`: broadcast درخواست invoke برای Node.
- `device.pair.requested` / `device.pair.resolved`: چرخهٔ عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی trigger واژهٔ wake تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: چرخهٔ عمر تأیید exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخهٔ عمر تأیید Plugin.

### روش‌های کمکی Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی executableهای skill را
  برای بررسی‌های auto-allow دریافت کنند.

### RPCهای دفترکل وظایف

کلاینت‌های اپراتور می‌توانند رکوردهای وظایف پس‌زمینهٔ Gateway را از طریق
RPCهای دفترکل وظایف بررسی و لغو کنند. این روش‌ها خلاصه‌های پاک‌سازی‌شدهٔ وظیفه را برمی‌گردانند، نه وضعیت خام
runtime.

- `tasks.list` به `operator.read` نیاز دارد.
  - پارامترها: `status` اختیاری (`"queued"`، `"running"`، `"completed"`،
    `"failed"`، `"cancelled"` یا `"timed_out"`) یا آرایه‌ای از آن وضعیت‌ها،
    `agentId` اختیاری، `sessionKey` اختیاری، `limit` اختیاری از `1` تا
    `500`، و رشتهٔ اختیاری `cursor`.
  - نتیجه: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` به `operator.read` نیاز دارد.
  - پارامترها: `{ "taskId": string }`.
  - نتیجه: `{ "task": TaskSummary }`.
  - شناسه‌های وظیفهٔ گم‌شده شکل خطای not-found در Gateway را برمی‌گردانند.
- `tasks.cancel` به `operator.write` نیاز دارد.
  - پارامترها: `{ "taskId": string, "reason"?: string }`.
  - نتیجه:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` گزارش می‌دهد که آیا دفترکل وظیفه‌ای مطابق داشته است یا نه. `cancelled`
    گزارش می‌دهد که آیا runtime لغو را پذیرفته یا ثبت کرده است یا نه.

`TaskSummary` شامل `id`، `status` و فرادادهٔ اختیاری مانند `kind`،
`runtime`، `title`، `agentId`، `sessionKey`، `childSessionKey`، `ownerKey`،
`runId`، `taskId`، `flowId`، `parentTaskId`، `sourceId`، timestampها، پیشرفت،
خلاصهٔ پایانی و متن خطای پاک‌سازی‌شده است. `agentId` عامل اجراکنندهٔ وظیفه را مشخص می‌کند؛
`sessionKey` و `ownerKey` زمینهٔ درخواست‌دهنده و کنترل را حفظ می‌کنند.

### روش‌های کمکی اپراتور

- اپراتورها می‌توانند برای دریافت فهرست فرمان‌های زمان اجرا برای یک عامل، `commands.list` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - `scope` کنترل می‌کند که سطح هدف `name` اصلی کدام باشد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both` در صورت وجود، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` در صورت وجود، نام فرمان بومی آگاه از ارائه‌دهنده را حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی و دسترس‌پذیری فرمان Plugin بومی اثر می‌گذارد.
  - `includeArgs=false` فراداده سریال‌شده آرگومان را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند برای دریافت کاتالوگ ابزارهای زمان اجرا برای یک عامل، `tools.catalog` (`operator.read`) را فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه آیا ابزار Plugin اختیاری است یا نه
- اپراتورها می‌توانند برای دریافت فهرست ابزارهای مؤثر در زمان اجرا برای یک نشست، `tools.effective` (`operator.read`) را فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا بافت تحویل ارائه‌شده از سوی فراخوان، بافت قابل اعتماد زمان اجرا را از نشست در سمت سرور استخراج می‌کند.
  - پاسخ، یک نمایش مشتق‌شده از سرور و محدود به نشست از فهرست فعال است، شامل ابزارهای هسته، Plugin، کانال و سرور MCP که از قبل کشف شده‌اند.
  - `tools.effective` برای MCP فقط خواندنی است: می‌تواند کاتالوگ MCP یک نشست گرم را از میان سیاست نهایی ابزار نمایش دهد، اما زمان‌اجراهای MCP ایجاد نمی‌کند، انتقال‌ها را متصل نمی‌کند، یا `tools/list` صادر نمی‌کند. اگر کاتالوگ گرم منطبقی وجود نداشته باشد، پاسخ ممکن است اعلانی مانند `mcp-not-yet-connected`، `mcp-not-yet-listed`، یا `mcp-stale-catalog` داشته باشد.
  - ورودی‌های ابزار مؤثر از `source="core"`، `source="plugin"`، `source="channel"`، یا `source="mcp"` استفاده می‌کنند.
- اپراتورها می‌توانند برای فراخوانی یک ابزار موجود از همان مسیر سیاست Gateway مانند `/tools/invoke`، `tools.invoke` (`operator.write`) را فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm` و `idempotencyKey` اختیاری هستند.
  - اگر هر دو `sessionKey` و `agentId` وجود داشته باشند، عامل نشست حل‌شده باید با `agentId` منطبق باشد.
  - پوشش‌دهنده‌های هسته فقط‌مالک مانند `cron`، `gateway` و `nodes` به هویت مالک/مدیر (`operator.admin`) نیاز دارند، هرچند خود متد `tools.invoke` برابر با `operator.write` است.
  - پاسخ یک پاکت رو به SDK با فیلدهای `ok`، `toolName`، `output` اختیاری، و `error` تایپ‌شده است. ردهای تأیید یا سیاست، به‌جای دور زدن خط لوله سیاست ابزار Gateway، در بار پاسخ `ok:false` برمی‌گردانند.
- اپراتورها می‌توانند برای دریافت فهرست Skills قابل مشاهده برای یک عامل، `skills.status` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی و گزینه‌های نصب پاک‌سازی‌شده است، بدون افشای مقادیر خام محرمانه.
- اپراتورها می‌توانند برای فراداده کشف ClawHub، `skills.search` و `skills.detail` (`operator.read`) را فراخوانی کنند.
- اپراتورها می‌توانند برای آماده‌سازی یک آرشیو Skill خصوصی پیش از نصب آن، `skills.upload.begin`، `skills.upload.chunk` و `skills.upload.commit` (`operator.admin`) را فراخوانی کنند. این یک مسیر بارگذاری مدیر جداگانه برای کلاینت‌های مورد اعتماد است، نه جریان عادی نصب Skill از ClawHub، و به‌طور پیش‌فرض غیرفعال است مگر اینکه `skills.install.allowUploadedArchives` فعال باشد.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` یک بارگذاری وابسته به همان slug و مقدار force ایجاد می‌کند.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` بایت‌ها را در offset دقیق رمزگشایی‌شده اضافه می‌کند.
  - `skills.upload.commit({ uploadId, sha256? })` اندازه نهایی و SHA-256 را تأیید می‌کند. commit فقط بارگذاری را نهایی می‌کند؛ Skill را نصب نمی‌کند.
  - آرشیوهای Skill بارگذاری‌شده، آرشیوهای zip شامل ریشه `SKILL.md` هستند. نام دایرکتوری داخلی آرشیو هرگز هدف نصب را انتخاب نمی‌کند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در سه حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه Skill را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت بارگذاری: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` یک بارگذاری commit‌شده را در دایرکتوری `skills/<slug>` فضای کاری عامل پیش‌فرض نصب می‌کند. مقدار slug و force باید با درخواست اصلی `skills.upload.begin` منطبق باشند. این حالت رد می‌شود مگر اینکه `skills.install.allowUploadedArchives` فعال باشد. این تنظیم روی نصب‌های ClawHub اثری ندارد.
  - حالت نصب‌کننده Gateway: `{ name, installId, timeoutMs? }` یک اقدام اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند. کلاینت‌های قدیمی‌تر ممکن است همچنان `dangerouslyForceUnsafeInstall` را ارسال کنند؛ این فیلد منسوخ شده، فقط برای سازگاری پروتکل پذیرفته می‌شود، و نادیده گرفته می‌شود. برای تصمیم‌های نصب در مالکیت اپراتور از `security.installPolicy` استفاده کنید.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug رهگیری‌شده یا همه نصب‌های رهگیری‌شده ClawHub را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`، `apiKey` و `env` را وصله می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است، شامل مدل‌های کشف‌شده به‌صورت پویا برای ورودی‌های `provider/*`. در غیر این صورت پاسخ، کاتالوگ کامل Gateway است.
- `"configured"`: رفتار هم‌اندازه انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد، شامل کشف محدود به ارائه‌دهنده برای ورودی‌های `provider/*`. بدون allowlist، پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این مورد برای تشخیص و رابط‌های کشف استفاده کنید، نه انتخاب‌گرهای عادی مدل.

## تأییدهای Exec

- وقتی یک درخواست exec به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` آن را حل می‌کنند (به دامنه `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده نشست canonical). درخواست‌هایی که `systemRunPlan` ندارند رد می‌شوند.
- پس از تأیید، فراخوانی‌های هدایت‌شده `node.invoke system.run` از همان `systemRunPlan` canonical به‌عنوان بافت معتبر فرمان/cwd/نشست استفاده می‌کنند.
- اگر فراخوان بین آماده‌سازی و هدایت نهایی `system.run` تأییدشده، `command`، `rawCommand`، `cwd`، `agentId` یا `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به بار تغییر‌یافته، اجرا را رد می‌کند.

## مسیر جایگزین تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی، `deliver=true` داشته باشند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل حل‌نشده یا فقط‌داخلی `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی قابل حل نباشد، امکان بازگشت به اجرای فقط‌نشست را فراهم می‌کند (برای مثال نشست‌های داخلی/وب‌چت یا پیکربندی‌های چندکاناله مبهم).
- نتایج نهایی `agent` ممکن است وقتی تحویل درخواست شده باشد، `result.deliveryStatus` داشته باشند، با استفاده از همان وضعیت‌های `sent`، `suppressed`، `partial_failed` و `failed` که برای [`openclaw agent --json --deliver`](/fa/cli/agent#json-delivery-status) مستند شده‌اند.

## نسخه‌بندی

- `PROTOCOL_VERSION` در `packages/gateway-protocol/src/version.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را ارسال می‌کنند؛ سرور بازه‌هایی را که شامل پروتکل فعلی آن نباشند رد می‌کند. کلاینت‌ها و سرورهای فعلی به پروتکل v4 نیاز دارند.
- Schemaها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در سراسر پروتکل v4 پایدار هستند و مبنای مورد انتظار برای کلاینت‌های شخص ثالث به‌شمار می‌آیند.

| ثابت                                      | پیش‌فرض                                               | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| مهلت درخواست (برای هر RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلت preauth / connect-challenge          | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| backoff اولیه اتصال مجدد                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه backoff اتصال مجدد                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp تلاش سریع پس از بستن device-token  | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت force-stop پیش از `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلت پیش‌فرض `stopAndWait()`              | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| بازه tick پیش‌فرض (پیش از `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن هنگام tick-timeout                   | کد `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور مقادیر مؤثر `policy.tickIntervalMs`، `policy.maxPayload` و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، این مقادیر را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با secret مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا غیر-loopback
  `gateway.auth.mode: "trusted-proxy"` بررسی احراز هویت اتصال را به‌جای `connect.params.auth.*` از
  سرآیندهای درخواست برآورده می‌کنند.
- `gateway.auth.mode: "none"` برای ورودی خصوصی، احراز هویت اتصال با secret مشترک را
  به‌طور کامل رد می‌کند؛ این حالت را روی ورودی عمومی/نامطمئن در دسترس نگذارید.
- پس از جفت‌سازی، Gateway یک **توکن دستگاه** محدود به نقش + دامنه‌های اتصال صادر می‌کند.
  در `hello-ok.auth.deviceToken` برگردانده می‌شود و باید برای اتصال‌های آینده
  توسط کلاینت پایدار شود.
- کلاینت‌ها باید پس از هر اتصال موفق، `hello-ok.auth.deviceToken` اصلی را پایدار کنند.
- اتصال دوباره با آن توکن دستگاه **ذخیره‌شده** باید مجموعه دامنه‌های تأییدشده ذخیره‌شده
  برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت را
  که قبلاً اعطا شده حفظ می‌کند و از فروکاستن بی‌سروصدای اتصال‌های دوباره به
  دامنه ضمنی باریک‌ترِ فقط-admin جلوگیری می‌کند.
- مونتاژ احراز هویت اتصال در سمت کلاینت (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و وقتی تنظیم شده باشد همیشه ارسال می‌شود.
  - `auth.token` به ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس یک `deviceToken` صریح، سپس یک توکن ذخیره‌شده برای هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط زمانی ارسال می‌شود که هیچ‌کدام از موارد بالا یک
    `auth.token` را حل نکرده باشند. توکن مشترک یا هر توکن دستگاه حل‌شده‌ای آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش دوباره یک‌باره
    `AUTH_TOKEN_MISMATCH` فقط به **نقاط انتهایی مورد اعتماد** محدود است —
    loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی
    بدون پین‌کردن واجد شرایط نیست.
- bootstrap داخلی با کد راه‌اندازی، `hello-ok.auth.deviceToken` نود اصلی
  به‌علاوه یک توکن عملگر محدودشده را در `hello-ok.auth.deviceTokens` برای تحویل موبایل مورد اعتماد
  برمی‌گرداند. توکن عملگر شامل `operator.talk.secrets` برای خواندن‌های پیکربندی Talk بومی است، اما
  دامنه‌های جهش جفت‌سازی و `operator.admin` را شامل نمی‌شود.
- وقتی bootstrap با کد راه‌اندازی غیر-مبنایی منتظر تأیید است، جزئیات `PAIRING_REQUIRED`
  شامل `recommendedNextStep: "wait_then_retry"`، `retryable: true`،
  و `pauseReconnect: false` است. کلاینت‌ها باید تا زمانی که درخواست تأیید شود
  یا توکن نامعتبر شود، با همان توکن bootstrap دوباره متصل شوند.
- `hello-ok.auth.deviceTokens` را فقط زمانی پایدار کنید که اتصال از احراز هویت bootstrap
  روی یک انتقال مورد اعتماد مانند `wss://` یا جفت‌سازی loopback/local استفاده کرده باشد.
- اگر کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، آن مجموعه دامنه
  درخواست‌شده توسط فراخواننده معتبر باقی می‌ماند؛ دامنه‌های کش‌شده فقط زمانی
  دوباره استفاده می‌شوند که کلاینت در حال استفاده دوباره از توکن ذخیره‌شده برای هر دستگاه باشد.
- توکن‌های دستگاه می‌توانند از طریق `device.token.rotate` و
  `device.token.revoke` چرخش/لغو شوند (به دامنه `operator.pairing` نیاز دارد). چرخاندن یا
  لغو یک نود یا نقش غیر-عملگر دیگر به `operator.admin` نیز نیاز دارد.
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. توکن bearer جایگزین را فقط
  برای فراخوانی‌های همان دستگاه که از قبل با همان توکن دستگاه احراز هویت شده‌اند
  بازتاب می‌دهد، تا کلاینت‌های فقط-توکن بتوانند جایگزین خود را پیش از اتصال دوباره پایدار کنند.
  چرخش‌های مشترک/admin توکن bearer را بازتاب نمی‌دهند.
- صدور، چرخش، و لغو توکن به مجموعه نقش‌های تأییدشده ثبت‌شده در ورودی جفت‌سازی
  همان دستگاه محدود می‌ماند؛ جهش توکن نمی‌تواند نقش دستگاهی را گسترش دهد یا هدف بگیرد
  که تأیید جفت‌سازی هرگز اعطا نکرده است.
- برای نشست‌های توکن دستگاه جفت‌شده، مدیریت دستگاه self-scoped است مگر اینکه
  فراخواننده `operator.admin` را نیز داشته باشد: فراخواننده‌های غیر-admin فقط می‌توانند
  توکن عملگر برای ورودی دستگاه **خودشان** را مدیریت کنند. مدیریت توکن نود و
  دیگر توکن‌های غیر-عملگر فقط-admin است، حتی برای دستگاه خود فراخواننده.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه دامنه توکن عملگر هدف
  را در برابر دامنه‌های نشست فعلی فراخواننده بررسی می‌کنند. فراخواننده‌های غیر-admin
  نمی‌توانند توکن عملگر گسترده‌تری از آنچه خودشان در اختیار دارند بچرخانند یا لغو کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌علاوه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (بولی)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های مورد اعتماد می‌توانند یک تلاش دوباره محدود با توکن کش‌شده برای هر دستگاه انجام دهند.
  - اگر آن تلاش دوباره شکست بخورد، کلاینت‌ها باید حلقه‌های اتصال دوباره خودکار را متوقف کنند و راهنمایی اقدام عملگر را نمایش دهند.
- `AUTH_SCOPE_MISMATCH` یعنی توکن دستگاه شناسایی شده اما نقش/دامنه‌های درخواست‌شده را پوشش نمی‌دهد.
  کلاینت‌ها نباید این را به‌عنوان توکن بد نمایش دهند؛
  از عملگر بخواهید دوباره جفت‌سازی کند یا قرارداد دامنه باریک‌تر/گسترده‌تر را تأیید کند.

## هویت دستگاه + جفت‌سازی

- نودها باید یک هویت دستگاه پایدار (`device.id`) شامل کنند که از
  اثرانگشت keypair مشتق شده باشد.
- Gatewayها برای هر دستگاه + نقش توکن صادر می‌کنند.
- تأییدهای جفت‌سازی برای شناسه‌های دستگاه جدید لازم هستند، مگر اینکه تأیید خودکار محلی
  فعال باشد.
- تأیید خودکار جفت‌سازی بر اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر باریک self-connect محلیِ backend/container برای
  جریان‌های helper با secret مشترک مورد اعتماد دارد.
- اتصال‌های same-host tailnet یا LAN همچنان برای جفت‌سازی remote تلقی می‌شوند و
  به تأیید نیاز دارند.
- کلاینت‌های WS معمولاً در طول `connect` هویت `device` را شامل می‌کنند (عملگر +
  نود). تنها استثناهای عملگر بدون دستگاه مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط-localhost.
  - احراز هویت موفق Control UI عملگر با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass، کاهش شدید امنیت).
  - RPCهای backend مستقیم-loopback `gateway-client` روی مسیر helper داخلی رزرو‌شده.
- حذف هویت دستگاه پیامدهای دامنه دارد. وقتی یک اتصال عملگر بدون دستگاه از طریق
  مسیر اعتماد صریح مجاز می‌شود، OpenClaw همچنان دامنه‌های self-declared را به مجموعه‌ای خالی
  پاک می‌کند مگر اینکه آن مسیر یک استثنای نام‌دار برای حفظ دامنه داشته باشد.
  سپس متدهای وابسته به دامنه با `missing scope` شکست می‌خورند.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` یک مسیر break-glass حفظ دامنه
  برای Control UI است. به backend سفارشی دلخواه یا کلاینت‌های WebSocket به‌شکل CLI
  دامنه اعطا نمی‌کند.
- مسیر helper رزرو‌شده backend `gateway-client` مستقیم-loopback دامنه‌ها را فقط برای
  RPCهای control-plane محلی داخلی حفظ می‌کند؛ شناسه‌های backend سفارشی این استثنا را
  دریافت نمی‌کنند.
- همه اتصال‌ها باید nonce `connect.challenge` ارائه‌شده توسط سرور را امضا کنند.

### عیب‌یابی مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` همراه با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنی                                                |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده (یا خالی فرستاده) است. |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce کهنه/اشتباه امضا کرده است.         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | بار امضا با بار v2 مطابقت ندارد.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp امضاشده بیرون از skew مجاز است.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثرانگشت کلید عمومی مطابقت ندارد. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/canonicalization کلید عمومی شکست خورده است.  |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- بار v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` ارسال کنید.
- بار امضای ترجیحی `v3` است، که علاوه بر فیلدهای device/client/role/scopes/token/nonce،
  `platform` و `deviceFamily` را نیز bind می‌کند.
- امضاهای legacy `v2` برای سازگاری همچنان پذیرفته می‌شوند، اما پین‌کردن فراداده
  دستگاه جفت‌شده همچنان سیاست command را هنگام اتصال دوباره کنترل می‌کند.

## TLS + پین‌کردن

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثرانگشت گواهی Gateway را پین کنند (به پیکربندی `gateway.tls`
  به‌علاوه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` مراجعه کنید).

## دامنه

این پروتکل **API کامل Gateway** را در معرض می‌گذارد (وضعیت، کانال‌ها، مدل‌ها، chat،
agent، نشست‌ها، نودها، approvals، و غیره). سطح دقیق توسط
schemaهای TypeBox در `packages/gateway-protocol/src/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل Bridge](/fa/gateway/bridge-protocol)
- [Runbook Gateway](/fa/gateway)
