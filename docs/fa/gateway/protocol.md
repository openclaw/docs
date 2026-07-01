---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS Gateway
    - اشکال‌زدایی ناهماهنگی‌های پروتکل یا خطاهای اتصال
    - در حال بازتولید schema/models پروتکل
summary: 'پروتکل WebSocket در Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-07-01T08:22:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل Gateway WS **صفحه کنترل واحد + انتقال گره** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط وب، اپ macOS، گره‌های iOS/Android، گره‌های بدون رابط)
از طریق WebSocket متصل می‌شوند و در زمان handshake، **نقش** + **دامنه** خود را اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود می‌شوند. پس از handshake موفق، کلاینت‌ها
  باید محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` را رعایت کنند. با فعال بودن diagnostics،
  فریم‌های ورودی بیش‌ازحد بزرگ و bufferهای خروجی کند، پیش از اینکه gateway
  فریم تحت تأثیر را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطح‌ها، و کدهای دلیل امن را نگه می‌دارند. آن‌ها بدنه پیام،
  محتوای پیوست، بدنه خام فریم، tokenها، cookieها، یا مقادیر محرمانه را نگه نمی‌دارند.

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

در حالی که Gateway هنوز در حال تکمیل sidecarهای راه‌اندازی است، درخواست `connect` می‌تواند
یک خطای قابل تلاش مجدد `UNAVAILABLE` برگرداند که `details.reason` روی
`"startup-sidecars"` و `retryAfterMs` تنظیم شده است. کلاینت‌ها باید این پاسخ را
در محدوده بودجه کلی اتصال خود دوباره تلاش کنند، نه اینکه آن را به‌عنوان شکست نهایی
handshake نمایش دهند.

`server`، `features`، `snapshot`، و `policy` همگی طبق schema
(`packages/gateway-protocol/src/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/دامنه‌های مذاکره‌شده را گزارش می‌کند. `pluginSurfaceUrls` اختیاری است و نام سطح‌های Plugin،
مانند `canvas`، را به URLهای میزبانی‌شده scoped نگاشت می‌کند.

URLهای سطح scoped Plugin ممکن است منقضی شوند. گره‌ها می‌توانند
`node.pluginSurface.refresh` را با `{ "surface": "canvas" }` فراخوانی کنند تا یک ورودی تازه
در `pluginSurfaceUrls` دریافت کنند. بازطراحی آزمایشی Plugin Canvas از مسیر سازگاری منسوخ
`canvasHostUrl`، `canvasCapability`، یا
`node.canvas.capability.refresh` پشتیبانی نمی‌کند؛ کلاینت‌های native و
gatewayهای فعلی باید از سطح‌های Plugin استفاده کنند.

وقتی هیچ token دستگاهی صادر نشود، `hello-ok.auth` مجوزهای مذاکره‌شده را
بدون فیلدهای token گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend قابل اعتماد در همان پردازش (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصال‌های loopback مستقیم، وقتی
با token/password مشترک gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر
برای RPCهای داخلی control-plane رزرو شده است و از مسدود شدن کار backend محلی مانند
به‌روزرسانی‌های جلسه subagent توسط baselineهای قدیمی جفت‌سازی CLI/دستگاه جلوگیری می‌کند. کلاینت‌های remote،
کلاینت‌های با origin مرورگر، کلاینت‌های گره، و کلاینت‌های صریح device-token/device-identity
همچنان از بررسی‌های عادی جفت‌سازی و ارتقای دامنه استفاده می‌کنند.

وقتی token دستگاه صادر شود، `hello-ok` همچنین شامل موارد زیر است:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

bootstrap داخلی QR/setup-code یک مسیر handoff تازه برای موبایل است. یک اتصال موفق
baseline setup-code، یک token گره اصلی به‌همراه یک token محدودشده operator برمی‌گرداند:

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

handoff اپراتور عمداً محدود شده است تا onboarding با QR بتواند حلقه operator موبایل را
بدون اعطای `operator.admin` یا `operator.pairing` آغاز کند.
این handoff شامل `operator.talk.secrets` هست تا کلاینت native بتواند پیکربندی Talk
موردنیاز پس از bootstrap را بخواند. دامنه‌های گسترده‌تر admin و pairing به
یک جفت‌سازی operator تأییدشده جداگانه یا جریان token جداگانه نیاز دارند. کلاینت‌ها باید
`hello-ok.auth.deviceTokens` را فقط
وقتی نگه‌داری کنند که اتصال از auth بوت‌استرپ روی انتقال قابل اعتماد مانند `wss://` یا
loopback/local pairing استفاده کرده باشد.

### مثال گره

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

متدهای دارای side effect به **کلیدهای idempotency** نیاز دارند (schema را ببینید).

## نقش‌ها + دامنه‌ها

برای مدل کامل دامنه‌های operator، بررسی‌های زمان تأیید، و معنای shared-secret،
به [دامنه‌های operator](/fa/gateway/operator-scopes) مراجعه کنید.

### نقش‌ها

- `operator` = کلاینت صفحه کنترل (CLI/UI/automation).
- `node` = میزبان capability (camera/screen/canvas/system.run).

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
وقتی secretها گنجانده شوند، کلاینت‌ها باید credential ارائه‌دهنده فعال Talk را از
`talk.resolved.config.apiKey` بخوانند؛ `talk.providers.<id>.apiKey`
در شکل source باقی می‌ماند و ممکن است یک شیء SecretRef یا یک رشته redacted باشد.

متدهای RPC gateway ثبت‌شده توسط Plugin ممکن است دامنه operator خودشان را درخواست کنند، اما
پیشوندهای admin رزروشده core (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` resolve می‌شوند.

دامنه متد فقط نخستین gate است. برخی slash commandها که از طریق
`chat.send` می‌رسند، بررسی‌های سخت‌گیرانه‌تر در سطح command را نیز اعمال می‌کنند. برای مثال، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` همچنین افزون بر دامنه پایه متد، یک بررسی دامنه اضافه در زمان تأیید دارد:

- درخواست‌های بدون command: `operator.pairing`
- درخواست‌های دارای commandهای گره غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare`، یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (گره)

گره‌ها در زمان اتصال ادعاهای capability را اعلام می‌کنند:

- `caps`: دسته‌های capability سطح بالا مانند `camera`، `canvas`، `screen`،
  `location`، `voice`، و `talk`.
- `commands`: allowlist command برای invoke.
- `permissions`: toggleهای ریزدانه (مانند `screen.record`، `camera.capture`).

Gateway این موارد را به‌عنوان **ادعا** در نظر می‌گیرد و allowlistهای سمت سرور را enforce می‌کند.

## Presence

- `system-presence` ورودی‌هایی را برمی‌گرداند که با هویت دستگاه key شده‌اند.
- ورودی‌های presence شامل `deviceId`، `roles`، و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف نشان دهند
  حتی وقتی آن دستگاه هم به‌عنوان **operator** و هم به‌عنوان **node** متصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. گره‌های متصل،
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ گره‌های paired همچنین می‌توانند
  وقتی یک رویداد گره قابل اعتماد metadata جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، presence پس‌زمینه پایدار را گزارش کنند.

### رویداد alive پس‌زمینه گره

گره‌ها ممکن است `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک گره paired
در طول wake پس‌زمینه alive بوده، بدون اینکه به‌عنوان connected علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual`، یا `connect`. رشته‌های trigger ناشناخته پیش از persistence توسط gateway به
`background` normalize می‌شوند. این رویداد فقط برای sessionهای دستگاه گره احراز هویت‌شده
پایدار است؛ sessionهای بدون دستگاه یا unpaired مقدار `handled: false` برمی‌گردانند.

gatewayهای موفق یک نتیجه ساخت‌یافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

gatewayهای قدیمی‌تر ممکن است هنوز برای `node.event` مقدار `{ "ok": true }` برگردانند؛ کلاینت‌ها باید آن را یک
RPC تأییدشده تلقی کنند، نه persistence پایدار presence.

## Scoping رویداد broadcast

رویدادهای broadcast WebSocket که از سرور push می‌شوند، scope-gated هستند تا sessionهای pairing-scoped یا node-only به‌صورت passive محتوای session را دریافت نکنند.

- **فریم‌های chat، agent، و tool-result** (از جمله رویدادهای streamed `agent` و نتایج فراخوانی tool) دست‌کم به `operator.read` نیاز دارند. sessionهای بدون `operator.read` این فریم‌ها را به‌طور کامل رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به اینکه Plugin چگونه آن‌ها را ثبت کرده باشد، به `operator.write` یا `operator.admin` gate می‌شوند.
- **رویدادهای status و transport** (`heartbeat`، `presence`، `tick`، چرخه عمر connect/disconnect، و غیره) بدون محدودیت باقی می‌مانند تا سلامت transport برای هر session احراز هویت‌شده قابل مشاهده باشد.
- **خانواده‌های ناشناخته رویداد broadcast** به‌صورت پیش‌فرض scope-gated هستند (fail-closed)، مگر اینکه یک handler ثبت‌شده صراحتاً آن‌ها را relaxed کند.

هر اتصال کلاینت شماره sequence مخصوص همان کلاینت را نگه می‌دارد تا broadcastها روی همان socket ترتیب monotonic را حفظ کنند، حتی وقتی کلاینت‌های مختلف subsetهای scope-filtered متفاوتی از جریان رویداد را می‌بینند.

## خانواده‌های رایج متد RPC

سطح عمومی WS گسترده‌تر از مثال‌های handshake/auth بالاست. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست discovery محافظه‌کارانه است که از `src/gateway/server-methods-list.ts` به‌علاوه exportهای متد Plugin/channel بارگذاری‌شده ساخته می‌شود. با آن به‌عنوان feature discovery رفتار کنید، نه enumeration کامل
`src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` تصویر وضعیت سلامت Gateway را که کش‌شده یا تازه بررسی‌شده است برمی‌گرداند.
    - `diagnostics.stability` ثبت‌کنندهٔ محدود و اخیر پایداری تشخیصی را برمی‌گرداند. این مورد فرادادهٔ عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایتی، خوانش‌های حافظه، وضعیت صف/نشست، نام‌های کانال/Plugin و شناسه‌های نشست را نگه می‌دارد. متن چت، بدنه‌های Webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها یا مقادیر محرمانه را نگه نمی‌دارد. دامنهٔ خواندن اپراتور لازم است.
    - `status` خلاصهٔ Gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های اپراتور با دامنهٔ ادمین گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه Gateway را که در جریان‌های رله و جفت‌سازی استفاده می‌شود برمی‌گرداند.
    - `system-presence` تصویر حضور فعلی را برای دستگاه‌های اپراتور/Node متصل برمی‌گرداند.
    - `system-event` یک رویداد سیستمی اضافه می‌کند و می‌تواند زمینهٔ حضور را به‌روزرسانی/پخش کند.
    - `last-heartbeat` آخرین رویداد Heartbeat ذخیره‌شده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را روی Gateway روشن یا خاموش می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و استفاده">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازهٔ انتخابگر، `{ "view": "configured" }` را ارسال کنید (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`)، یا برای کاتالوگ کامل `{ "view": "all" }` را ارسال کنید.
    - `usage.status` پنجره‌های استفادهٔ ارائه‌دهنده/خلاصه‌های سهمیهٔ باقی‌مانده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیع‌شدهٔ هزینهٔ استفاده را برای یک بازهٔ تاریخی برمی‌گرداند.
      برای یک عامل `agentId` را ارسال کنید، یا برای تجمیع عامل‌های پیکربندی‌شده `agentScope: "all"` را ارسال کنید.
    - `doctor.memory.status` آمادگی حافظهٔ برداری / embedding کش‌شده را برای فضای کاری عامل پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخواننده صراحتا یک ping زنده به ارائه‌دهندهٔ embedding می‌خواهد، `{ "probe": true }` یا `{ "deep": true }` را ارسال کنید. کلاینت‌های آگاه از Dreaming همچنین می‌توانند `{ "agentId": "agent-id" }` را ارسال کنند تا آمارهای فروشگاه Dreaming را به یک فضای کاری عامل انتخاب‌شده محدود کنند؛ حذف `agentId` بازگشت به عامل پیش‌فرض را حفظ می‌کند و فضاهای کاری Dreaming پیکربندی‌شده را تجمیع می‌کند.
    - `doctor.memory.dreamDiary`، `doctor.memory.backfillDreamDiary`، `doctor.memory.resetDreamDiary`، `doctor.memory.resetGroundedShortTerm`، `doctor.memory.repairDreamingArtifacts` و `doctor.memory.dedupeDreamDiary` پارامترهای اختیاری `{ "agentId": "agent-id" }` را برای نماها/کنش‌های Dreaming عامل انتخاب‌شده می‌پذیرند. وقتی `agentId` حذف شود، آن‌ها روی فضای کاری عامل پیش‌فرض پیکربندی‌شده عمل می‌کنند.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از ابزار REM را برای کلاینت‌های کنترل‌پلین راه‌دور برمی‌گرداند. این مورد می‌تواند شامل مسیرهای فضای کاری، قطعه‌های حافظه، Markdown زمینه‌مند رندرشده و نامزدهای ارتقای عمیق باشد، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های استفادهٔ هر نشست را برمی‌گرداند. برای یک
      عامل `agentId` را ارسال کنید، یا برای فهرست‌کردن عامل‌های پیکربندی‌شده با هم `agentScope: "all"` را ارسال کنید.
    - `sessions.usage.timeseries` استفادهٔ سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های گزارش استفاده را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و دستیارهای ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، در جایی که کانال از خروج پشتیبانی کند، خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/وب را برای ارائه‌دهنده کانال وب فعلی که قابلیت QR دارد آغاز می‌کند.
    - `web.login.wait` منتظر تکمیل آن جریان ورود QR/وب می‌ماند و در صورت موفقیت، کانال را راه‌اندازی می‌کند.
    - `push.test` یک پوش آزمایشی APNs را به یک گره iOS ثبت‌شده ارسال می‌کند.
    - `voicewake.get` محرک‌های ذخیره‌شده wake-word را برمی‌گرداند.
    - `voicewake.set` محرک‌های wake-word را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و لاگ‌ها">
    - `send` همان RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گذاری‌شده بر اساس کانال/حساب/رشته خارج از اجراکننده چت است.
    - `logs.tail` دنباله لاگ فایل پیکربندی‌شده Gateway را با کنترل‌های مکان‌نما/حد و حداکثر بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="گفتار و TTS">
    - `talk.catalog` کاتالوگ فقط‌خواندنی ارائه‌دهنده Talk را برای گفتار، رونویسی جریانی، و صدای بلادرنگ برمی‌گرداند. این شامل شناسه‌های ارائه‌دهنده، برچسب‌ها، وضعیت پیکربندی‌شده، شناسه‌های مدل/صداهای در معرض استفاده، حالت‌های canonical، انتقال‌ها، راهبردهای brain، و پرچم‌های صوت/قابلیت بلادرنگ است، بدون اینکه اسرار ارائه‌دهنده را برگرداند یا پیکربندی سراسری را تغییر دهد.
    - `talk.config` محموله پیکربندی مؤثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.session.create` یک نشست Talk متعلق به Gateway برای `realtime/gateway-relay`، `transcription/gateway-relay`، یا `stt-tts/managed-room` ایجاد می‌کند. برای `stt-tts/managed-room`، فراخوان‌های `operator.write` که `sessionKey` را پاس می‌دهند باید برای رؤیت‌پذیری محدوده‌دار کلید نشست، `spawnedBy` را نیز پاس بدهند؛ ایجاد `sessionKey` بدون محدوده و `brain: "direct-tools"` به `operator.admin` نیاز دارد.
    - `talk.session.join` توکن نشست managed-room را اعتبارسنجی می‌کند، در صورت نیاز رویدادهای `session.ready` یا `session.replaced` را منتشر می‌کند، و فراداده اتاق/نشست به‌همراه رویدادهای اخیر Talk را بدون توکن متن ساده یا هش توکن ذخیره‌شده برمی‌گرداند.
    - `talk.session.appendAudio` صدای ورودی PCM با کدگذاری base64 را به نشست‌های رله بلادرنگ و رونویسی متعلق به Gateway اضافه می‌کند.
    - `talk.session.startTurn`، `talk.session.endTurn`، و `talk.session.cancelTurn` چرخه عمر نوبت managed-room را با رد نوبت‌های منقضی پیش از پاک شدن وضعیت هدایت می‌کنند.
    - `talk.session.cancelOutput` خروجی صوتی دستیار را متوقف می‌کند، عمدتاً برای قطع گفتار مبتنی بر VAD در نشست‌های رله Gateway.
    - `talk.session.submitToolResult` یک فراخوان ابزار ارائه‌دهنده را که توسط یک نشست رله بلادرنگ متعلق به Gateway منتشر شده کامل می‌کند. وقتی خروجی موقت ابزار ارائه می‌شود و نتیجه نهایی در ادامه خواهد آمد، `options: { willContinue: true }` را پاس بدهید، یا وقتی نتیجه ابزار باید فراخوان ارائه‌دهنده را بدون شروع پاسخ بلادرنگ دیگری از دستیار برآورده کند، `options: { suppressResponse: true }` را پاس بدهید.
    - `talk.session.steer` کنترل صوتی اجرای فعال را به یک نشست Talk پشتیبانی‌شده با agent و متعلق به Gateway می‌فرستد. این `{ sessionId, text, mode? }` را می‌پذیرد، که در آن `mode` یکی از `status`، `steer`، `cancel`، یا `followup` است؛ حالت حذف‌شده از متن گفتاری طبقه‌بندی می‌شود.
    - `talk.session.close` یک نشست رله، رونویسی، یا managed-room متعلق به Gateway را می‌بندد و رویدادهای پایانی Talk را منتشر می‌کند.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/Control UI تنظیم/پخش می‌کند.
    - `talk.client.create` یک نشست ارائه‌دهنده بلادرنگ متعلق به کلاینت را با استفاده از `webrtc` یا `provider-websocket` ایجاد می‌کند، در حالی که Gateway مالک پیکربندی، اعتبارنامه‌ها، دستورالعمل‌ها، و سیاست ابزار است.
    - `talk.client.toolCall` به انتقال‌های بلادرنگ متعلق به کلاینت اجازه می‌دهد فراخوان‌های ابزار ارائه‌دهنده را به سیاست Gateway ارسال کنند. نخستین ابزار پشتیبانی‌شده `openclaw_agent_consult` است؛ کلاینت‌ها یک شناسه اجرا دریافت می‌کنند و پیش از ثبت نتیجه ابزار مخصوص ارائه‌دهنده، منتظر رویدادهای عادی چرخه عمر چت می‌مانند.
    - `talk.client.steer` کنترل صوتی اجرای فعال را برای انتقال‌های بلادرنگ متعلق به کلاینت می‌فرستد. Gateway اجرای فعال تعبیه‌شده را از `sessionKey` حل می‌کند و به‌جای حذف بی‌صدای هدایت، یک نتیجه ساخت‌یافته پذیرفته/ردشده برمی‌گرداند.
    - `talk.event` کانال رویداد واحد Talk برای آداپتورهای بلادرنگ، رونویسی، STT/TTS، managed-room، تلفنی، و جلسه است.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk تولید می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان پشتیبان، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` موجودی قابل مشاهده ارائه‌دهندگان TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل متن به گفتار یک‌باره را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و جادوگر">
    - `secrets.reload` SecretRefهای فعال را دوباره حل می‌کند و وضعیت اسرار زمان اجرا را فقط در صورت موفقیت کامل تعویض می‌کند.
    - `secrets.resolve` تخصیص‌های اسرار هدف‌گذاری‌شده به فرمان را برای یک مجموعه فرمان/هدف مشخص حل می‌کند.
    - `config.get` عکس فوری و هش پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک محموله پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را ادغام می‌کند. جایگزینی مخرب آرایه
      به مسیر تحت تأثیر در `replacePaths` نیاز دارد؛ آرایه‌های تودرتو
      زیر ورودی‌های آرایه از مسیرهای `[]` مانند `agents.list[].skills` استفاده می‌کنند.
    - `config.apply` کل محموله پیکربندی را اعتبارسنجی و جایگزین می‌کند.
    - `config.schema` محموله طرح‌واره پیکربندی زنده را که توسط ابزارهای Control UI و CLI استفاده می‌شود برمی‌گرداند: طرح‌واره، `uiHints`، نسخه، و فراداده تولید، از جمله فراداده طرح‌واره Plugin + کانال وقتی زمان اجرا بتواند آن را بارگذاری کند. طرح‌واره شامل فراداده فیلدهای `title` / `description` است که از همان برچسب‌ها و متن راهنمای مورد استفاده UI مشتق شده‌اند، از جمله شاخه‌های ترکیب شیء تودرتو، wildcard، آیتم آرایه، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد منطبق وجود داشته باشد.
    - `config.schema.lookup` یک محموله جست‌وجوی محدوده‌دار به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک گره کم‌عمق طرح‌واره، راهنمای منطبق + `hintPath`، `reloadKind` اختیاری، و خلاصه‌های فرزند فوری برای واکاوی UI/CLI. `reloadKind` یکی از `restart`، `hot`، یا `none` است و برنامه‌ریز بارگذاری مجدد پیکربندی Gateway را برای مسیر درخواست‌شده بازتاب می‌دهد. گره‌های طرح‌واره جست‌وجو مستندات روبه‌کاربر و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/شیئی، و پرچم‌هایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، `reloadKind` اختیاری، به‌علاوه `hint` / `hintPath` منطبق را در معرض می‌گذارند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد، راه‌اندازی مجدد را زمان‌بندی می‌کند؛ فراخوان‌هایی که نشست دارند می‌توانند `continuationMessage` را شامل کنند تا راه‌اندازی، یک نوبت agent پیگیری را از طریق صف ادامه راه‌اندازی مجدد از سر بگیرد. به‌روزرسانی‌های مدیر بسته و به‌روزرسانی‌های git-checkout تحت نظارت از صفحه کنترل، به‌جای جایگزینی درخت بسته یا تغییر خروجی checkout/build داخل Gateway زنده، از تحویل managed-service جداشده استفاده می‌کنند. یک تحویل شروع‌شده `ok: true` را با `result.reason: "managed-service-handoff-started"` و `handoff.status: "started"` برمی‌گرداند؛ تحویل‌های ناموجود یا ناموفق `ok: false` را با `managed-service-handoff-unavailable` یا `managed-service-handoff-failed`، به‌علاوه `handoff.command` وقتی به به‌روزرسانی دستی shell نیاز باشد، برمی‌گردانند. تحویل ناموجود یعنی OpenClaw فاقد مرز ناظر امن یا هویت سرویس پایدار است، مانند `OPENCLAW_SYSTEMD_UNIT` برای systemd. در طول یک تحویل شروع‌شده، sentinel راه‌اندازی مجدد ممکن است برای مدت کوتاهی `stats.reason: "restart-health-pending"` را گزارش کند؛ ادامه تا زمانی که CLI، Gateway راه‌اندازی‌شده دوباره را تأیید کند و sentinel نهایی `ok` را بنویسد، به تأخیر می‌افتد.
    - `update.status` آخرین sentinel راه‌اندازی مجدد به‌روزرسانی را، از جمله نسخه در حال اجرای پس از راه‌اندازی مجدد وقتی موجود باشد، تازه‌سازی و برمی‌گرداند.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` جادوگر راه‌اندازی اولیه را از طریق WS RPC در معرض می‌گذارند.

  </Accordion>

  <Accordion title="راهکارهای کمکی عامل و فضای کاری">
    - `agents.list` مدخل‌های عامل پیکربندی‌شده را برمی‌گرداند، از جمله مدل مؤثر و فراداده runtime.
    - `agents.create`، `agents.update` و `agents.delete` رکوردهای عامل و اتصال فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get` و `agents.files.set` فایل‌های فضای کاری bootstrap را که برای یک عامل ارائه شده‌اند مدیریت می‌کنند.
    - `tasks.list`، `tasks.get` و `tasks.cancel` دفترکل وظایف Gateway را در اختیار SDK و کلاینت‌های اپراتور قرار می‌دهند.
    - `artifacts.list`، `artifacts.get` و `artifacts.download` خلاصه‌ها و دانلودهای artifact برگرفته از رونوشت را برای دامنه صریح `sessionKey`، `runId` یا `taskId` ارائه می‌کنند. پرس‌وجوهای اجرا و وظیفه، نشست مالک را در سمت سرور resolve می‌کنند و فقط رسانه‌های رونوشت با منشأ همخوان را برمی‌گردانند؛ منابع URL ناامن یا محلی به‌جای واکشی در سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `environments.list` و `environments.status` کشف محیط فقط‌خواندنی Gateway-محلی و Node را برای کلاینت‌های SDK ارائه می‌کنند.
    - `agent.identity.get` هویت مؤثر دستیار را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک اجرا می‌ماند و در صورت موجود بودن، snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` نمایه نشست فعلی را برمی‌گرداند، از جمله فراداده `agentRuntime` برای هر ردیف وقتی backend runtime عامل پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک رویدادهای تغییر نشست را برای کلاینت WS فعلی روشن یا خاموش می‌کنند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک رویدادهای رونوشت/پیام را برای یک نشست روشن یا خاموش می‌کنند.
    - `sessions.preview` پیش‌نمایش‌های محدود رونوشت را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.describe` یک ردیف نشست Gateway را برای یک کلید نشست دقیق برمی‌گرداند.
    - `sessions.resolve` هدف نشست را resolve یا canonicalize می‌کند.
    - `sessions.create` یک مدخل نشست جدید ایجاد می‌کند.
    - `sessions.send` پیامی را به یک نشست موجود می‌فرستد.
    - `sessions.steer` گونه وقفه‌دادن و هدایت‌کردن برای یک نشست فعال است.
    - `sessions.abort` کار فعال را برای یک نشست abort می‌کند. فراخواننده می‌تواند `key` را همراه با `runId` اختیاری ارسال کند، یا برای اجراهای فعالی که Gateway می‌تواند به یک نشست resolve کند، فقط `runId` را ارسال کند.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌همراه `agentRuntime` مؤثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete` و `sessions.compact` نگهداشت نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort` و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌شکل نمایشی نرمال‌سازی می‌شود: تگ‌های directive درون‌خطی از متن قابل‌مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شده فراخوانی ابزار) و توکن‌های کنترل مدل ASCII/تمام‌عرض نشت‌کرده حذف می‌شوند، ردیف‌های دستیارِ صرفاً دارای توکن خاموش مانند `NO_REPLY` / `no_reply` دقیق کنار گذاشته می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholder جایگزین شوند.
    - `chat.message.get` خواننده افزایشی، محدود و تمام‌پیام برای یک مدخل رونوشت قابل‌مشاهده واحد است. کلاینت‌ها `sessionKey`، در صورت عامل‌دامنه بودن انتخاب نشست `agentId` اختیاری، به‌همراه یک `messageId` رونوشت را که قبلاً از طریق `chat.history` ارائه شده ارسال می‌کنند، و Gateway همان projection نمایشی نرمال‌سازی‌شده را بدون سقف سبک‌وزن کوتاه‌سازی history برمی‌گرداند، اگر مدخل ذخیره‌شده همچنان موجود باشد و بیش‌ازحد بزرگ نباشد.
    - `chat.send` مقدار یک‌نوبتی `fastMode: "auto"` را می‌پذیرد تا از fast mode برای فراخوانی‌های مدل که پیش از cutoff خودکار شروع شده‌اند استفاده کند، سپس فراخوانی‌های retry، fallback، نتیجه ابزار یا continuation بعدی را بدون fast mode آغاز کند. مقدار پیش‌فرض cutoff برابر ۶۰ ثانیه است و می‌تواند برای هر مدل با `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` پیکربندی شود. فراخواننده `chat.send` می‌تواند برای override کردن cutoff در همان درخواست، مقدار یک‌نوبتی `fastAutoOnSeconds` را ارسال کند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و توکن‌های دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شده در انتظار و تأییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject` و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` یک توکن دستگاه جفت‌شده را در محدوده‌های نقش تأییدشده و دامنه فراخواننده آن rotate می‌کند.
    - `device.token.revoke` یک توکن دستگاه جفت‌شده را در محدوده‌های نقش تأییدشده و دامنه فراخواننده آن revoke می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، فراخوانی و کار در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove` و `node.pair.verify` جفت‌سازی Node و راستی‌آزمایی bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک Node متصل forward می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای مبدأگرفته از Node را به gateway برمی‌گرداند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کارهای در انتظار پایدار را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تأیید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list` و `exec.approval.resolve` درخواست‌های تأیید یک‌باره exec به‌همراه جست‌وجو/بازپخش تأییدهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تأیید exec در انتظار می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در زمان timeout مقدار `null`).
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای سیاست تأیید exec در gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تأیید exec محلی Node را از طریق فرمان‌های relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision` و `plugin.approval.resolve` جریان‌های تأیید تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="Automation، Skills و ابزارها">
    - Automation: `wake` تزریق فوری متن wake یا تزریق در Heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.get`، `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کار زمان‌بندی‌شده را مدیریت می‌کنند.
    - `cron.run` همچنان یک RPC از نوع enqueue برای اجراهای دستی است. کلاینت‌هایی که به معنای تکمیل نیاز دارند باید `runId` برگشتی را بخوانند و `cron.runs` را poll کنند.
    - `cron.runs` یک فیلتر اختیاری و غیرخالی `runId` را می‌پذیرد تا کلاینت‌ها بتوانند یک اجرای دستی صف‌شده را بدون رقابت با مدخل‌های history دیگر برای همان job دنبال کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رویداد رایج

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و دیگر رویدادهای چت فقط‌مربوط به رونوشت. در protocol v4، payloadهای delta دارای `deltaText` هستند؛ `message` همچنان snapshot تجمعی دستیار باقی می‌ماند. جایگزینی‌های غیرپیشوندی `replace=true` را تنظیم می‌کنند و از `deltaText` به‌عنوان متن جایگزین استفاده می‌کنند.
- `session.message`، `session.operation` و `session.tool`: به‌روزرسانی‌های رونوشت، عملیات نشست در حال انجام، و event-stream برای یک نشست مشترک‌شده.
- `sessions.changed`: نمایه نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / liveness.
- `health`: به‌روزرسانی snapshot سلامت gateway.
- `heartbeat`: به‌روزرسانی event stream مربوط به Heartbeat.
- `cron`: رویداد تغییر اجرا/job مربوط به Cron.
- `shutdown`: اعلان خاموش‌شدن gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه‌عمر جفت‌سازی Node.
- `node.invoke.request`: پخش درخواست invoke برای Node.
- `device.pair.requested` / `device.pair.resolved`: چرخه‌عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی trigger واژه wake تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه‌عمر تأیید exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه‌عمر تأیید Plugin.

### متدهای کمکی Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی فایل‌های اجرایی skill را برای بررسی‌های auto-allow دریافت کنند.

### RPCهای دفترکل وظایف

کلاینت‌های اپراتور می‌توانند رکوردهای وظیفه پس‌زمینه Gateway را از طریق RPCهای دفترکل وظایف بررسی و cancel کنند. این متدها خلاصه‌های پاک‌سازی‌شده وظیفه را برمی‌گردانند، نه وضعیت خام runtime.

- `tasks.list` به `operator.read` نیاز دارد.
  - Params: مقدار اختیاری `status` (`"queued"`، `"running"`، `"completed"`، `"failed"`، `"cancelled"` یا `"timed_out"`) یا آرایه‌ای از آن وضعیت‌ها، `agentId` اختیاری، `sessionKey` اختیاری، `limit` اختیاری از `1` تا `500`، و رشته اختیاری `cursor`.
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` به `operator.read` نیاز دارد.
  - Params: `{ "taskId": string }`.
  - Result: `{ "task": TaskSummary }`.
  - شناسه‌های وظیفه ناموجود، شکل خطای not-found مربوط به Gateway را برمی‌گردانند.
- `tasks.cancel` به `operator.write` نیاز دارد.
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` گزارش می‌دهد که آیا دفترکل وظیفه‌ای همخوان داشته است یا نه. `cancelled` گزارش می‌دهد که آیا runtime لغو را پذیرفته یا ثبت کرده است.

`TaskSummary` شامل `id`، `status` و فراداده اختیاری مانند `kind`، `runtime`، `title`، `agentId`، `sessionKey`، `childSessionKey`، `ownerKey`، `runId`، `taskId`، `flowId`، `parentTaskId`، `sourceId`، timestampها، پیشرفت، خلاصه پایانی، و متن خطای پاک‌سازی‌شده است. `agentId` عاملی را که وظیفه را اجرا می‌کند مشخص می‌کند؛ `sessionKey` و `ownerKey` زمینه درخواست‌دهنده و کنترل را حفظ می‌کنند.

### متدهای کمکی اپراتور

- اپراتورها می‌توانند `commands.list` (`operator.read`) را برای دریافت فهرست فرمان‌های زمان اجرای یک عامل فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both` در صورت وجود، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` در صورت وجود، نام فرمان بومی آگاه از ارائه‌دهنده را حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی و دسترس‌پذیری فرمان بومی Plugin اثر می‌گذارد.
  - `includeArgs=false` فراداده سریال‌شده آرگومان را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند `tools.catalog` (`operator.read`) را برای دریافت کاتالوگ ابزار زمان اجرای یک عامل فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه ابزار Plugin اختیاری است یا نه
- اپراتورها می‌توانند `tools.effective` (`operator.read`) را برای دریافت فهرست ابزار مؤثر در زمان اجرا برای یک نشست فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا زمینه تحویل ارائه‌شده توسط فراخواننده، زمینه زمان اجرای مورد اعتماد را از نشست در سمت سرور استخراج می‌کند.
  - پاسخ، نمایشی محدود به نشست و استخراج‌شده در سرور از فهرست فعال است، شامل ابزارهای هسته، Plugin، کانال، و ابزارهای سرور MCP که از قبل کشف شده‌اند.
  - `tools.effective` برای MCP فقط خواندنی است: می‌تواند یک کاتالوگ MCP نشست گرم را از طریق سیاست ابزار نهایی نمایش دهد، اما زمان‌های اجرای MCP را ایجاد نمی‌کند، ترنسپورت‌ها را متصل نمی‌کند، یا `tools/list` صادر نمی‌کند. اگر هیچ کاتالوگ گرم منطبقی وجود نداشته باشد، پاسخ ممکن است شامل اعلانی مانند `mcp-not-yet-connected`، `mcp-not-yet-listed`، یا `mcp-stale-catalog` باشد.
  - ورودی‌های ابزار مؤثر از `source="core"`، `source="plugin"`، `source="channel"`، یا `source="mcp"` استفاده می‌کنند.
- اپراتورها می‌توانند `tools.invoke` (`operator.write`) را برای فراخوانی یک ابزار در دسترس از همان مسیر سیاست Gateway مانند `/tools/invoke` فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm`، و `idempotencyKey` اختیاری هستند.
  - اگر هر دو `sessionKey` و `agentId` وجود داشته باشند، عامل نشست حل‌شده باید با `agentId` مطابقت داشته باشد.
  - بسته‌بندهای هسته فقط مالک مانند `cron`، `gateway`، و `nodes` به هویت مالک/ادمین (`operator.admin`) نیاز دارند، هرچند خود متد `tools.invoke` برابر با `operator.write` است.
  - پاسخ یک پاکت رو به SDK با فیلدهای `ok`، `toolName`، `output` اختیاری، و `error` تایپ‌شده است. ردهای تأیید یا سیاست، به‌جای دور زدن خط لوله سیاست ابزار Gateway، مقدار `ok:false` را در payload برمی‌گردانند.
- اپراتورها می‌توانند `skills.status` (`operator.read`) را برای دریافت فهرست قابل مشاهده Skills برای یک عامل فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی، و گزینه‌های نصب پاک‌سازی‌شده بدون افشای مقادیر خام محرمانه است.
- اپراتورها می‌توانند `skills.search` و `skills.detail` (`operator.read`) را برای فراداده کشف ClawHub فراخوانی کنند.
- اپراتورها می‌توانند `skills.upload.begin`، `skills.upload.chunk`، و `skills.upload.commit` (`operator.admin`) را برای آماده‌سازی یک آرشیو خصوصی skill پیش از نصب آن فراخوانی کنند. این یک مسیر آپلود ادمین جداگانه برای کلاینت‌های مورد اعتماد است، نه جریان عادی نصب skill از ClawHub، و به‌صورت پیش‌فرض غیرفعال است مگر اینکه `skills.install.allowUploadedArchives` فعال باشد.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    یک آپلود وابسته به همان slug و مقدار force ایجاد می‌کند.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` بایت‌ها را در آفست دقیق رمزگشایی‌شده اضافه می‌کند.
  - `skills.upload.commit({ uploadId, sha256? })` اندازه نهایی و SHA-256 را تأیید می‌کند. commit فقط آپلود را نهایی می‌کند؛ skill را نصب نمی‌کند.
  - آرشیوهای skill آپلودشده، آرشیوهای zip حاوی ریشه `SKILL.md` هستند. نام دایرکتوری داخلی آرشیو هرگز هدف نصب را انتخاب نمی‌کند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در سه حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه skill را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت آپلود: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    یک آپلود commit‌شده را در دایرکتوری `skills/<slug>` فضای کاری عامل پیش‌فرض نصب می‌کند. مقدار slug و force باید با درخواست اصلی `skills.upload.begin` مطابقت داشته باشد. این حالت رد می‌شود مگر اینکه `skills.install.allowUploadedArchives` فعال باشد. این تنظیم بر نصب‌های ClawHub اثر نمی‌گذارد.
  - حالت نصب‌کننده Gateway: `{ name, installId, timeoutMs? }`
    یک کنش اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
    کلاینت‌های قدیمی‌تر ممکن است همچنان `dangerouslyForceUnsafeInstall` را ارسال کنند؛ این فیلد منسوخ شده، فقط برای سازگاری پروتکل پذیرفته می‌شود، و نادیده گرفته می‌شود. برای تصمیم‌های نصب تحت مالکیت اپراتور از `security.installPolicy` استفاده کنید.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug ردیابی‌شده یا همه نصب‌های ردیابی‌شده ClawHub را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیری مانند `enabled`، `apiKey`، و `env` را در `skills.entries.<skillKey>` وصله می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ کاتالوگ مجاز است، شامل مدل‌های کشف‌شده پویا برای ورودی‌های `provider/*`. در غیر این صورت پاسخ، کاتالوگ کامل Gateway است.
- `"configured"`: رفتار هم‌اندازه انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان غالب است، شامل کشف محدود به ارائه‌دهنده برای ورودی‌های `provider/*`. بدون فهرست مجاز، پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این برای تشخیص و رابط‌های کشف استفاده کنید، نه انتخاب‌گرهای عادی مدل.

## تأییدهای exec

- وقتی یک درخواست exec به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` حل می‌کنند (نیازمند دامنه `operator.approvals`).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده نشست کانونی). درخواست‌هایی که `systemRunPlan` ندارند رد می‌شوند.
- پس از تأیید، فراخوانی‌های هدایت‌شده `node.invoke system.run` همان `systemRunPlan` کانونی را به‌عنوان زمینه معتبر command/cwd/session دوباره استفاده می‌کنند.
- اگر فراخواننده بین مرحله آماده‌سازی و هدایت نهایی `system.run` تأییدشده، `command`، `rawCommand`، `cwd`، `agentId`، یا `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به payload تغییریافته، اجرا را رد می‌کند.

## fallback تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی شامل `deliver=true` باشند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: اهداف تحویل حل‌نشده یا فقط داخلی، `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی حل‌پذیر نباشد، fallback به اجرای فقط نشست را مجاز می‌کند (برای نمونه نشست‌های داخلی/webchat یا پیکربندی‌های چندکاناله مبهم).
- نتایج نهایی `agent` ممکن است وقتی تحویل درخواست شده باشد شامل `result.deliveryStatus` باشند، با استفاده از همان وضعیت‌های `sent`، `suppressed`، `partial_failed`، و `failed` که برای [`openclaw agent --json --deliver`](/fa/cli/agent#json-delivery-status) مستند شده‌اند.

## نسخه‌بندی

- `PROTOCOL_VERSION` در `packages/gateway-protocol/src/version.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` ارسال می‌کنند؛ سرور بازه‌هایی را که شامل پروتکل فعلی آن نباشند رد می‌کند. کلاینت‌ها و سرورهای فعلی به پروتکل v4 نیاز دارند.
- Schemaها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در سراسر پروتکل v4 پایدار هستند و خط مبنای مورد انتظار برای کلاینت‌های شخص ثالث محسوب می‌شوند.

| ثابت                                      | پیش‌فرض                                               | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| مهلت درخواست (برای هر RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلت Preauth / connect-challenge          | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| backoff اولیه اتصال مجدد                  | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه backoff اتصال مجدد                 | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| محدودسازی fast-retry پس از بسته‌شدن device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت Force-stop پیش از `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلت پیش‌فرض `stopAndWait()`              | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصله tick پیش‌فرض (پیش از `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن در tick-timeout                      | code `4000` وقتی سکوت از `tickIntervalMs * 2` فراتر رود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور مقدارهای مؤثر `policy.tickIntervalMs`، `policy.maxPayload`، و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، این مقادیر را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا non-loopback
  `gateway.auth.mode: "trusted-proxy"` بررسی احراز هویت اتصال را به‌جای
  `connect.params.auth.*` از سرآیندهای درخواست برآورده می‌کنند.
- حالت ورودی خصوصی `gateway.auth.mode: "none"` احراز هویت اتصال با راز مشترک را
  به‌طور کامل رد می‌کند؛ این حالت را روی ورودی عمومی/نامطمئن در معرض دسترس قرار ندهید.
- پس از جفت‌سازی، Gateway یک **توکن دستگاه** محدود به نقش اتصال
  + دامنه‌ها صادر می‌کند. این توکن در `hello-ok.auth.deviceToken` بازگردانده می‌شود و باید
  برای اتصال‌های آینده توسط کلاینت پایدارسازی شود.
- کلاینت‌ها باید `hello-ok.auth.deviceToken` اصلی را پس از هر اتصال
  موفق پایدارسازی کنند.
- اتصال مجدد با آن توکن دستگاه **ذخیره‌شده** باید مجموعه دامنه‌های تأییدشده
  ذخیره‌شده برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/بررسی/وضعیت
  را که قبلاً اعطا شده حفظ می‌کند و از فروکاستن بی‌صدای اتصال‌های مجدد به یک
  دامنه ضمنی محدودتر و فقط ادمین جلوگیری می‌کند.
- سرهم‌بندی احراز هویت اتصال در سمت کلاینت (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و همیشه وقتی تنظیم شده باشد ارسال می‌شود.
  - `auth.token` به‌ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس یک `deviceToken` صریح، سپس یک توکن ذخیره‌شده برای هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط زمانی ارسال می‌شود که هیچ‌یک از موارد بالا یک
    `auth.token` را تعیین نکرده باشد. توکن مشترک یا هر توکن دستگاه تعیین‌شده آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش مجدد یک‌باره
    `AUTH_TOKEN_MISMATCH` فقط به **نقطه‌های پایانی مورداعتماد** محدود است —
    loopback، یا `wss://` با `tlsFingerprint` سنجاق‌شده. `wss://` عمومی
    بدون سنجاق‌کردن واجد شرایط نیست.
- بوت‌استرپ داخلی کد راه‌اندازی، `hello-ok.auth.deviceToken` گره اصلی
  به‌همراه یک توکن اپراتور محدود را در
  `hello-ok.auth.deviceTokens` برای تحویل موبایل مورداعتماد بازمی‌گرداند. توکن اپراتور
  شامل `operator.talk.secrets` برای خواندن پیکربندی بومی Talk است و
  `operator.admin` و `operator.pairing` را مستثنی می‌کند.
- وقتی یک بوت‌استرپ کد راه‌اندازی غیربیس‌لاین منتظر تأیید است، جزئیات `PAIRING_REQUIRED`
  شامل `recommendedNextStep: "wait_then_retry"`، `retryable: true`،
  و `pauseReconnect: false` است. کلاینت‌ها باید تا زمانی که درخواست تأیید شود
  یا توکن نامعتبر شود، با همان توکن بوت‌استرپ دوباره متصل شوند.
- `hello-ok.auth.deviceTokens` را فقط زمانی پایدارسازی کنید که اتصال از احراز هویت بوت‌استرپ
  روی یک انتقال مورداعتماد مانند `wss://` یا جفت‌سازی loopback/local استفاده کرده باشد.
- اگر کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، همان
  مجموعه دامنه درخواست‌شده توسط فراخوان معتبر باقی می‌ماند؛ دامنه‌های کش‌شده فقط
  وقتی دوباره استفاده می‌شوند که کلاینت در حال استفاده مجدد از توکن ذخیره‌شده برای هر دستگاه باشد.
- توکن‌های دستگاه را می‌توان از طریق `device.token.rotate` و
  `device.token.revoke` چرخاند/لغو کرد (نیازمند دامنه `operator.pairing`). چرخاندن یا
  لغو یک گره یا نقش غیر اپراتور دیگر، به `operator.admin` نیز نیاز دارد.
- `device.token.rotate` فراداده چرخش را بازمی‌گرداند. توکن حامل جایگزین را
  فقط برای فراخوان‌های همان دستگاه که از قبل با همان توکن دستگاه احراز هویت شده‌اند
  بازتاب می‌دهد، تا کلاینت‌های فقط توکنی بتوانند جایگزین خود را پیش از
  اتصال مجدد پایدارسازی کنند. چرخش‌های مشترک/ادمین توکن حامل را بازتاب نمی‌دهند.
- صدور، چرخش، و لغو توکن به مجموعه نقش تأییدشده‌ای محدود می‌ماند
  که در ورودی جفت‌سازی همان دستگاه ثبت شده است؛ تغییر توکن نمی‌تواند نقش دستگاهی را گسترش دهد
  یا هدف بگیرد که تأیید جفت‌سازی هرگز اعطا نکرده است.
- برای نشست‌های توکن دستگاه جفت‌شده، مدیریت دستگاه خود-محدود است مگر اینکه
  فراخوان `operator.admin` نیز داشته باشد: فراخوان‌های غیرادمین فقط می‌توانند
  توکن اپراتور مربوط به ورودی دستگاه **خودشان** را مدیریت کنند. مدیریت توکن گره و دیگر
  توکن‌های غیر اپراتور فقط ادمین است، حتی برای دستگاه خود فراخوان.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه دامنه توکن اپراتور
  هدف را در برابر دامنه‌های نشست فعلی فراخوان بررسی می‌کنند. فراخوان‌های غیرادمین
  نمی‌توانند توکن اپراتوری گسترده‌تر از آنچه خودشان دارند را بچرخانند یا لغو کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (بولی)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های مورداعتماد می‌توانند یک تلاش مجدد محدود با توکن کش‌شده برای هر دستگاه انجام دهند.
  - اگر آن تلاش مجدد شکست بخورد، کلاینت‌ها باید حلقه‌های اتصال مجدد خودکار را متوقف کنند و راهنمایی اقدام اپراتور را نمایش دهند.
- `AUTH_SCOPE_MISMATCH` یعنی توکن دستگاه شناسایی شده اما نقش/دامنه‌های
  درخواست‌شده را پوشش نمی‌دهد. کلاینت‌ها نباید این را به‌عنوان توکن بد نمایش دهند؛
  از اپراتور بخواهید دوباره جفت‌سازی کند یا قرارداد دامنه محدودتر/گسترده‌تر را تأیید کند.

## هویت دستگاه + جفت‌سازی

- گره‌ها باید یک هویت دستگاه پایدار (`device.id`) مشتق‌شده از
  اثر انگشت جفت‌کلید را شامل شوند.
- Gatewayها برای هر دستگاه + نقش توکن صادر می‌کنند.
- تأییدهای جفت‌سازی برای شناسه‌های دستگاه جدید لازم هستند مگر اینکه تأیید خودکار محلی
  فعال باشد.
- تأیید خودکار جفت‌سازی حول اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر خود-اتصال محدود backend/container-local برای
  جریان‌های کمکی راز مشترک مورداعتماد دارد.
- اتصال‌های tailnet یا LAN روی همان میزبان همچنان برای جفت‌سازی ریموت تلقی می‌شوند و
  به تأیید نیاز دارند.
- کلاینت‌های WS معمولاً هنگام `connect` هویت `device` را شامل می‌کنند (اپراتور +
  گره). تنها استثناهای اپراتور بدون دستگاه مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط روی localhost.
  - احراز هویت موفق Control UI اپراتور با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass، کاهش شدید امنیت).
  - RPCهای backend مستقیم-loopback `gateway-client` روی مسیر کمکی داخلی
    رزروشده.
- حذف هویت دستگاه پیامدهای دامنه دارد. وقتی اتصال اپراتور بدون دستگاه
  از مسیر اعتماد صریح مجاز می‌شود، OpenClaw همچنان دامنه‌های خوداظهاری‌شده
  را به مجموعه‌ای خالی پاک می‌کند مگر اینکه آن مسیر یک استثنای نام‌دار
  حفظ دامنه داشته باشد. سپس متدهای دارای گیت دامنه با
  `missing scope` شکست می‌خورند.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` یک مسیر حفظ دامنه
  break-glass برای Control UI است. این مسیر به backend سفارشی دلخواه یا کلاینت‌های WebSocket شبیه CLI
  دامنه اعطا نمی‌کند.
- مسیر کمکی backend رزروشده مستقیم-loopback `gateway-client` دامنه‌ها را
  فقط برای RPCهای داخلی صفحه کنترل محلی حفظ می‌کند؛ شناسه‌های backend سفارشی این
  استثنا را دریافت نمی‌کنند.
- همه اتصال‌ها باید nonce ارائه‌شده توسط سرور، یعنی `connect.challenge`، را امضا کنند.

### عیب‌یابی مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار بازمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                     | details.code                     | details.reason           | معنی                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده (یا خالی ارسال کرده) است.     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce کهنه/نادرست امضا کرده است.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | بار امضا با بار v2 مطابقت ندارد.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | مهر زمانی امضاشده خارج از انحراف مجاز است.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثر انگشت کلید عمومی مطابقت ندارد. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/استانداردسازی کلید عمومی شکست خورده است.         |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- بار v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` ارسال کنید.
- بار امضای ترجیحی `v3` است، که علاوه بر فیلدهای دستگاه/کلاینت/نقش/دامنه‌ها/توکن/nonce،
  `platform` و `deviceFamily` را نیز مقید می‌کند.
- امضاهای قدیمی `v2` همچنان برای سازگاری پذیرفته می‌شوند، اما سنجاق‌کردن
  فراداده دستگاه جفت‌شده همچنان سیاست فرمان را هنگام اتصال مجدد کنترل می‌کند.

## TLS + سنجاق‌کردن

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثر انگشت گواهی gateway را سنجاق کنند (نگاه کنید به پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint`).

## دامنه

این پروتکل **API کامل gateway** را در معرض قرار می‌دهد (وضعیت، کانال‌ها، مدل‌ها، چت،
عامل، نشست‌ها، گره‌ها، تأییدها، و غیره). سطح دقیق توسط
طرحواره‌های TypeBox در `packages/gateway-protocol/src/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل پل](/fa/gateway/bridge-protocol)
- [راهنمای عملیاتی Gateway](/fa/gateway)
