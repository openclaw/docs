---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS Gateway
    - اشکال‌زدایی ناهماهنگی‌های پروتکل یا خطاهای اتصال
    - بازسازی طرح‌واره/مدل‌های پروتکل
summary: 'پروتکل WebSocket Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-07-03T09:49:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل WS در Gateway، **صفحهٔ کنترل واحد + انتقال نود** برای
OpenClaw است. همهٔ کلاینت‌ها (CLI، رابط وب، برنامهٔ macOS، نودهای iOS/Android، نودهای
بی‌واسطه) از طریق WebSocket وصل می‌شوند و در زمان
handshake، **نقش** + **دامنهٔ دسترسی** خود را اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود می‌شوند. پس از handshake موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. وقتی diagnostics فعال باشد،
  فریم‌های ورودی بیش‌ازحد بزرگ و bufferهای خروجی کند، پیش از آنکه gateway فریم
  متأثر را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطح‌ها، و کدهای دلیل امن را نگه می‌دارند. آن‌ها بدنهٔ پیام،
  محتوای پیوست، بدنهٔ خام فریم، tokenها، cookieها، یا مقدارهای محرمانه را نگه نمی‌دارند.

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

در حالی که Gateway هنوز در حال کامل‌کردن sidecarهای راه‌اندازی است، درخواست `connect` می‌تواند
یک خطای قابل‌تلاش‌مجدد `UNAVAILABLE` برگرداند که `details.reason` آن روی
`"startup-sidecars"` تنظیم شده و `retryAfterMs` دارد. کلاینت‌ها باید به‌جای نمایش آن
به‌عنوان شکست نهایی handshake، آن پاسخ را در بودجهٔ کلی اتصال خود دوباره امتحان کنند.

`server`، `features`، `snapshot`، و `policy` همگی در schema الزامی هستند
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` نیز الزامی است و
نقش/دامنه‌های دسترسی مذاکره‌شده را گزارش می‌کند. `pluginSurfaceUrls` اختیاری است و نام‌های سطح
plugin، مانند `canvas`، را به URLهای میزبانی‌شدهٔ scoped نگاشت می‌کند.

URLهای سطح Plugin scoped ممکن است منقضی شوند. نودها می‌توانند
`node.pluginSurface.refresh` را با `{ "surface": "canvas" }` فراخوانی کنند تا یک ورودی تازه
در `pluginSurfaceUrls` دریافت کنند. بازآرایی Plugin آزمایشی Canvas از مسیر سازگاری منسوخ
`canvasHostUrl`، `canvasCapability`، یا
`node.canvas.capability.refresh` پشتیبانی نمی‌کند؛ کلاینت‌های native و
gatewayهای فعلی باید از سطح‌های plugin استفاده کنند.

وقتی token دستگاه صادر نشود، `hello-ok.auth` مجوزهای مذاکره‌شده را بدون فیلدهای token گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend قابل‌اعتماد در همان فرایند (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصال‌های loopback مستقیم، وقتی با token/password مشترک gateway
احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای داخلی صفحهٔ کنترل رزرو شده است و
baselineهای قدیمی جفت‌سازی CLI/دستگاه را از مسدودکردن کار backend محلی مانند به‌روزرسانی‌های session
زیرعامل جلوگیری می‌کند. کلاینت‌های remote، کلاینت‌های با مبدأ browser، کلاینت‌های node، و
کلاینت‌های صریح device-token/device-identity همچنان از بررسی‌های عادی جفت‌سازی و ارتقای scope استفاده می‌کنند.

وقتی token دستگاه صادر شود، `hello-ok` همچنین شامل این مورد است:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

bootstrap داخلی با QR/setup-code یک مسیر تازهٔ handoff موبایل است. یک اتصال setup-code
baseline موفق، یک token نود اصلی به‌همراه یک token عملگر محدود برمی‌گرداند:

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

handoff عملگر عمداً محدود است تا onboarding با QR بتواند حلقهٔ عملگر موبایل را بدون اعطای
`operator.admin` یا `operator.pairing` شروع کند.
این handoff شامل `operator.talk.secrets` هست تا کلاینت native بتواند پس از bootstrap،
پیکربندی Talk موردنیازش را بخواند. دامنه‌های گسترده‌تر admin و pairing به یک
جفت‌سازی عملگر تأییدشدهٔ جداگانه یا جریان token جداگانه نیاز دارند. کلاینت‌ها باید
`hello-ok.auth.deviceTokens` را فقط
وقتی نگه دارند که connect از احراز هویت bootstrap روی انتقال قابل‌اعتماد مانند `wss://` یا
loopback/local pairing استفاده کرده باشد.

### نمونهٔ نود

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

## قاب‌بندی

- **درخواست**: `{type:"req", id, method, params}`
- **پاسخ**: `{type:"res", id, ok, payload|error}`
- **رویداد**: `{type:"event", event, payload, seq?, stateVersion?}`

متدهای دارای side effect به **کلیدهای idempotency** نیاز دارند (schema را ببینید).

## نقش‌ها + دامنه‌های دسترسی

برای مدل کامل scope عملگر، بررسی‌های زمان تأیید، و semantics مربوط به secret مشترک،
[دامنه‌های دسترسی عملگر](/fa/gateway/operator-scopes) را ببینید.

### نقش‌ها

- `operator` = کلاینت صفحهٔ کنترل (CLI/UI/automation).
- `node` = میزبان قابلیت (camera/screen/canvas/system.run).

### دامنه‌های دسترسی (عملگر)

scopeهای رایج:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` با `includeSecrets: true` به `operator.talk.secrets`
(یا `operator.admin`) نیاز دارد.
وقتی secretها گنجانده می‌شوند، کلاینت‌ها باید credential فعال provider در Talk را از
`talk.resolved.config.apiKey` بخوانند؛ `talk.providers.<id>.apiKey`
با شکل منبع باقی می‌ماند و ممکن است یک شیء SecretRef یا یک رشتهٔ redacted باشد.

متدهای RPC در gateway که توسط Plugin ثبت شده‌اند ممکن است scope عملگر خودشان را درخواست کنند، اما
پیشوندهای رزروشدهٔ admin در core (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` resolve می‌شوند.

scope متد فقط نخستین gate است. بعضی دستورهای slash که از طریق
`chat.send` رسیده‌اند، بررسی‌های سخت‌گیرانه‌تر در سطح دستور را روی آن اعمال می‌کنند. برای نمونه، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` نیز افزون بر scope پایهٔ متد، یک بررسی scope اضافی در زمان تأیید دارد:

- درخواست‌های بدون دستور: `operator.pairing`
- درخواست‌های دارای دستورهای نود غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare`، یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### قابلیت‌ها/دستورها/مجوزها (نود)

نودها در زمان اتصال ادعاهای قابلیت را اعلام می‌کنند:

- `caps`: دسته‌های سطح‌بالای قابلیت مانند `camera`، `canvas`، `screen`،
  `location`، `voice`، و `talk`.
- `commands`: allowlist دستورها برای invoke.
- `permissions`: toggleهای ریزدانه (برای مثال `screen.record`، `camera.capture`).

Gateway با این موارد به‌عنوان **ادعا** رفتار می‌کند و allowlistهای سمت سرور را اعمال می‌کند.

## حضور

- `system-presence` ورودی‌هایی برمی‌گرداند که با identity دستگاه کلیدگذاری شده‌اند.
- ورودی‌های حضور شامل `deviceId`، `roles`، و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف واحد نشان دهند
  حتی وقتی هم به‌عنوان **operator** و هم به‌عنوان **node** وصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. نودهای متصل
  زمان اتصال فعلی خود را با دلیل `connect` به‌عنوان `lastSeenAtMs` گزارش می‌کنند؛ نودهای paired نیز می‌توانند
  وقتی یک رویداد نود قابل‌اعتماد metadata جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، حضور پایدار در پس‌زمینه را گزارش کنند.

### رویداد زنده‌بودن پس‌زمینهٔ نود

نودها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود یک نود paired
در زمان wake پس‌زمینه زنده بوده، بدون اینکه connected علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`,
`significant_location`، `manual`، یا `connect`. رشته‌های trigger ناشناخته پیش از persistence
توسط gateway به `background` normalize می‌شوند. این رویداد فقط برای sessionهای دستگاه node احرازهویت‌شده
پایدار است؛ sessionهای بدون دستگاه یا unpaired مقدار `handled: false` برمی‌گردانند.

gatewayهای موفق یک نتیجهٔ ساخت‌یافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

gatewayهای قدیمی‌تر ممکن است هنوز برای `node.event` مقدار `{ "ok": true }` برگردانند؛ کلاینت‌ها باید آن را یک
RPC تأییدشده بدانند، نه persistence پایدار حضور.

## Scopeگذاری رویدادهای broadcast

رویدادهای broadcast در WebSocket که از سرور push می‌شوند، scope-gated هستند تا sessionهای دارای scope جفت‌سازی یا فقط node، محتوای session را به‌صورت passive دریافت نکنند.

- **فریم‌های chat، agent، و tool-result** (از جمله رویدادهای streamed `agent` و نتایج فراخوانی ابزار) حداقل به `operator.read` نیاز دارند. sessionهای بدون `operator.read` این فریم‌ها را کاملاً رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به اینکه Plugin چگونه آن‌ها را ثبت کرده باشد، به `operator.write` یا `operator.admin` محدود می‌شوند.
- **رویدادهای وضعیت و انتقال** (`heartbeat`، `presence`، `tick`، چرخهٔ عمر connect/disconnect، و غیره) نامحدود می‌مانند تا سلامت انتقال برای هر session احرازهویت‌شده قابل مشاهده باشد.
- **خانواده‌های ناشناختهٔ رویداد broadcast** به‌صورت پیش‌فرض scope-gated هستند (fail-closed)، مگر اینکه یک handler ثبت‌شده صراحتاً آن‌ها را آزادتر کند.

هر اتصال کلاینت شمارهٔ توالی مخصوص همان کلاینت را نگه می‌دارد تا broadcastها روی آن socket ترتیب یکنواخت را حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های scope-filtered متفاوتی از جریان رویداد را می‌بینند.

## خانواده‌های رایج متد RPC

سطح عمومی WS گسترده‌تر از نمونه‌های handshake/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست کشف محافظه‌کارانه است که از
`src/gateway/server-methods-list.ts` به‌همراه exportهای متد plugin/channel بارگذاری‌شده ساخته می‌شود. با آن به‌عنوان کشف قابلیت رفتار کنید، نه فهرست کامل
`src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` نمای سلامت Gateway را که در کش است یا تازه بررسی شده برمی‌گرداند.
    - `diagnostics.stability` ضبط‌کننده پایداری تشخیصی محدود اخیر را برمی‌گرداند. این مورد فراداده عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایت، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/Plugin، و شناسه‌های نشست را نگه می‌دارد. متن گفت‌وگو، بدنه‌های Webhook، خروجی‌های ابزار، بدنه خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، یا مقادیر محرمانه را نگه نمی‌دارد. محدوده خواندن اپراتور لازم است.
    - `status` خلاصه Gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های اپراتور با محدوده مدیر گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه Gateway را که در جریان‌های relay و pairing استفاده می‌شود برمی‌گرداند.
    - `system-presence` نمای حضور فعلی را برای دستگاه‌های اپراتور/Node متصل برمی‌گرداند.
    - `system-event` یک رویداد سیستم را اضافه می‌کند و می‌تواند زمینه حضور را به‌روزرسانی/پخش کند.
    - `last-heartbeat` آخرین رویداد Heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را روی Gateway روشن یا خاموش می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و مصرف">
    - `models.list` کاتالوگ مدل مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخاب‌گر (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را بدهید، یا برای کاتالوگ کامل مقدار `{ "view": "all" }` را بدهید.
    - `usage.status` خلاصه پنجره‌های مصرف/سهمیه باقی‌مانده ارائه‌دهنده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیع‌شده مصرف هزینه را برای یک بازه تاریخ برمی‌گرداند.
      برای یک عامل `agentId` را بدهید، یا برای تجمیع عامل‌های پیکربندی‌شده `agentScope: "all"` را بدهید.
    - `doctor.memory.status` آمادگی vector-memory / embedding کش‌شده را برای فضای کاری عامل پیش‌فرض فعال برمی‌گرداند. فقط زمانی که فراخواننده صراحتاً یک ping زنده به ارائه‌دهنده embedding می‌خواهد، مقدار `{ "probe": true }` یا `{ "deep": true }` را بدهید. کلاینت‌های آگاه از Dreaming همچنین می‌توانند برای محدود کردن آمار ذخیره Dreaming به یک فضای کاری عامل انتخاب‌شده مقدار `{ "agentId": "agent-id" }` را بدهند؛ حذف `agentId` مسیر fallback عامل پیش‌فرض را حفظ می‌کند و فضاهای کاری Dreaming پیکربندی‌شده را تجمیع می‌کند.
    - `doctor.memory.dreamDiary`، `doctor.memory.backfillDreamDiary`، `doctor.memory.resetDreamDiary`، `doctor.memory.resetGroundedShortTerm`، `doctor.memory.repairDreamingArtifacts`، و `doctor.memory.dedupeDreamDiary` پارامترهای اختیاری `{ "agentId": "agent-id" }` را برای نماها/اقدام‌های Dreaming عامل انتخاب‌شده می‌پذیرند. وقتی `agentId` حذف شود، روی فضای کاری عامل پیش‌فرض پیکربندی‌شده عمل می‌کنند.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از REM harness را برای کلاینت‌های control-plane راه‌دور برمی‌گرداند. این می‌تواند مسیرهای فضای کاری، قطعه‌های حافظه، markdown grounded رندرشده، و نامزدهای ارتقای عمیق را شامل شود، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های مصرف هر نشست را برمی‌گرداند. برای یک
      عامل `agentId` را بدهید، یا برای فهرست کردن عامل‌های پیکربندی‌شده با هم `agentScope: "all"` را بدهید.
    - `sessions.usage.timeseries` مصرف سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های گزارش مصرف را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص که کانال از خروج پشتیبانی می‌کند خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/web را برای ارائه‌دهنده کانال وب فعلیِ دارای قابلیت QR شروع می‌کند.
    - `web.login.wait` منتظر تکمیل همان جریان ورود QR/web می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک push آزمایشی APNs را به یک Node ثبت‌شده iOS ارسال می‌کند.
    - `voicewake.get` محرک‌های wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` محرک‌های wake-word را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و گزارش‌ها">
    - `send` همان RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گذاری‌شده به کانال/حساب/رشته، خارج از اجراکننده گفت‌وگو است.
    - `logs.tail` tail گزارش فایل Gateway پیکربندی‌شده را با کنترل‌های cursor/limit و بیشینه بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.catalog` کاتالوگ فقط‌خواندنی ارائه‌دهنده Talk را برای گفتار، رونویسی جریانی، و صدای بی‌درنگ برمی‌گرداند. این شامل شناسه‌های canonical ارائه‌دهنده، aliasهای registry، برچسب‌ها، وضعیت پیکربندی‌شده، نتیجه اختیاری `ready` در سطح گروه، شناسه‌های مدل/صدا که در دسترس قرار گرفته‌اند، حالت‌های canonical، transportها، راهبردهای brain، و پرچم‌های صدای بی‌درنگ/قابلیت است، بدون اینکه رازهای ارائه‌دهنده را برگرداند یا پیکربندی سراسری را تغییر دهد. Gatewayهای فعلی پس از اعمال انتخاب ارائه‌دهنده زمان اجرا `ready` را تنظیم می‌کنند؛ کلاینت‌ها باید نبود آن را برای سازگاری با Gatewayهای قدیمی‌تر تأییدنشده تلقی کنند.
    - `talk.config` payload پیکربندی مؤثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.session.create` یک نشست Talk مالکیت‌شده توسط Gateway برای `realtime/gateway-relay`، `transcription/gateway-relay`، یا `stt-tts/managed-room` ایجاد می‌کند. برای `stt-tts/managed-room`، فراخواننده‌های `operator.write` که `sessionKey` می‌دهند باید برای نمایانی scoped کلید نشست، `spawnedBy` را هم بدهند؛ ایجاد `sessionKey` بدون scope و `brain: "direct-tools"` به `operator.admin` نیاز دارند.
    - `talk.session.join` یک توکن نشست managed-room را اعتبارسنجی می‌کند، در صورت نیاز رویدادهای `session.ready` یا `session.replaced` را منتشر می‌کند، و فراداده اتاق/نشست به‌همراه رویدادهای اخیر Talk را بدون توکن متن‌ساده یا هش توکن ذخیره‌شده برمی‌گرداند.
    - `talk.session.appendAudio` صدای ورودی PCM با base64 را به نشست‌های relay بی‌درنگ و رونویسی مالکیت‌شده توسط Gateway اضافه می‌کند.
    - `talk.session.startTurn`، `talk.session.endTurn`، و `talk.session.cancelTurn` چرخه عمر نوبت managed-room را با رد نوبت‌های کهنه پیش از پاک شدن وضعیت هدایت می‌کنند.
    - `talk.session.cancelOutput` خروجی صدای دستیار را متوقف می‌کند، عمدتاً برای barge-in محدودشده با VAD در نشست‌های relay Gateway.
    - `talk.session.submitToolResult` یک فراخوانی ابزار ارائه‌دهنده را که توسط نشست relay بی‌درنگ مالکیت‌شده توسط Gateway منتشر شده کامل می‌کند. وقتی یک نتیجه نهایی در ادامه خواهد آمد، برای خروجی موقت ابزار `options: { willContinue: true }` را بدهید، یا وقتی نتیجه ابزار باید فراخوانی ارائه‌دهنده را بدون شروع پاسخ بی‌درنگ دیگری از دستیار برآورده کند، `options: { suppressResponse: true }` را بدهید.
    - `talk.session.steer` کنترل صوتی اجرای فعال را به یک نشست Talk پشتیبانی‌شده با عامل و مالکیت‌شده توسط Gateway ارسال می‌کند. این مقدار `{ sessionId, text, mode? }` را می‌پذیرد، که در آن `mode` یکی از `status`، `steer`، `cancel`، یا `followup` است؛ حالت حذف‌شده از متن گفتاری طبقه‌بندی می‌شود.
    - `talk.session.close` یک نشست relay، رونویسی، یا managed-room مالکیت‌شده توسط Gateway را می‌بندد و رویدادهای پایانی Talk را منتشر می‌کند.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/Control UI تنظیم/پخش می‌کند.
    - `talk.client.create` یک نشست ارائه‌دهنده بی‌درنگ مالکیت‌شده توسط کلاینت را با استفاده از `webrtc` یا `provider-websocket` ایجاد می‌کند، در حالی که Gateway مالک پیکربندی، اعتبارنامه‌ها، دستورالعمل‌ها، و سیاست ابزار است.
    - `talk.client.toolCall` به transportهای بی‌درنگ مالکیت‌شده توسط کلاینت اجازه می‌دهد فراخوانی‌های ابزار ارائه‌دهنده را به سیاست Gateway منتقل کنند. نخستین ابزار پشتیبانی‌شده `openclaw_agent_consult` است؛ کلاینت‌ها یک شناسه اجرا دریافت می‌کنند و پیش از ارسال نتیجه ابزار مختص ارائه‌دهنده، منتظر رویدادهای عادی چرخه عمر گفت‌وگو می‌مانند.
    - `talk.client.steer` کنترل صوتی اجرای فعال را برای transportهای بی‌درنگ مالکیت‌شده توسط کلاینت ارسال می‌کند. Gateway اجرای embedded فعال را از `sessionKey` resolve می‌کند و به‌جای حذف بی‌صدا steering، یک نتیجه ساخت‌یافته پذیرفته/ردشده برمی‌گرداند.
    - `talk.event` کانال واحد رویداد Talk برای بی‌درنگ، رونویسی، STT/TTS، managed-room، تلفنی، و آداپتورهای جلسه است.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده فعال گفتار Talk سنتز می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان fallback، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` موجودی قابل مشاهده ارائه‌دهنده TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را روشن یا خاموش می‌کنند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="رازها، پیکربندی، به‌روزرسانی، و ویزارد">
    - `secrets.reload` SecretRefهای فعال را دوباره resolve می‌کند و وضعیت راز زمان اجرا را فقط در صورت موفقیت کامل جایگزین می‌کند.
    - `secrets.resolve` انتساب‌های راز هدف‌گذاری‌شده به دستور را برای یک مجموعه دستور/هدف مشخص resolve می‌کند.
    - `config.get` snapshot و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را merge می‌کند. جایگزینی تخریبی آرایه
      نیاز دارد مسیر تحت تأثیر در `replacePaths` باشد؛ آرایه‌های تودرتو
      زیر ورودی‌های آرایه از مسیرهای `[]` مانند `agents.list[].skills` استفاده می‌کنند.
    - `config.apply` payload کامل پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` payload schema زنده پیکربندی را که توسط ابزارهای Control UI و CLI استفاده می‌شود برمی‌گرداند: schema، `uiHints`، نسخه، و فراداده تولید، شامل فراداده schema متعلق به Plugin + کانال وقتی زمان اجرا بتواند آن را بارگذاری کند. schema شامل فراداده فیلد `title` / `description` است که از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط UI مشتق شده، از جمله شاخه‌های ترکیبی شیء تودرتو، wildcard، آیتم آرایه، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد منطبق وجود داشته باشد.
    - `config.schema.lookup` یک payload lookup محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک گره schema سطحی، hint منطبق + `hintPath`، `reloadKind` اختیاری، و خلاصه‌های فرزند فوری برای drill-down در UI/CLI. `reloadKind` یکی از `restart`، `hot`، یا `none` است و برنامه‌ریز reload پیکربندی Gateway را برای مسیر درخواست‌شده بازتاب می‌دهد. گره‌های schema در lookup مستندات رو به کاربر و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/شیء، و پرچم‌هایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، `reloadKind` اختیاری، به‌علاوه `hint` / `hintPath` منطبق را در دسترس قرار می‌دهند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد یک restart زمان‌بندی می‌کند؛ فراخواننده‌های دارای نشست می‌توانند `continuationMessage` را بگنجانند تا startup یک نوبت پیگیری عامل را از طریق صف ادامه restart از سر بگیرد. به‌روزرسانی‌های package-manager و به‌روزرسانی‌های git-checkout نظارت‌شده از control plane به‌جای جایگزینی درخت package یا تغییر خروجی checkout/build داخل Gateway زنده، از handoff سرویس مدیریت‌شده detached استفاده می‌کنند. یک handoff شروع‌شده مقدار `ok: true` را با `result.reason: "managed-service-handoff-started"` و `handoff.status: "started"` برمی‌گرداند؛ handoffهای در دسترس نبودنی یا ناموفق مقدار `ok: false` را با `managed-service-handoff-unavailable` یا `managed-service-handoff-failed`، به‌علاوه `handoff.command` وقتی به به‌روزرسانی دستی shell نیاز باشد، برمی‌گردانند. handoff در دسترس نبودنی یعنی OpenClaw فاقد مرز supervisor امن یا هویت سرویس پایدار است، مانند `OPENCLAW_SYSTEMD_UNIT` برای systemd. هنگام handoff شروع‌شده، restart sentinel ممکن است برای مدت کوتاهی `stats.reason: "restart-health-pending"` را گزارش کند؛ ادامه تا زمانی که CLI Gateway راه‌اندازی‌مجددشده را تأیید کند و sentinel نهایی `ok` را بنویسد به تأخیر می‌افتد.
    - `update.status` آخرین restart sentinel به‌روزرسانی را تازه‌سازی و برمی‌گرداند، شامل نسخه در حال اجرای پس از restart وقتی در دسترس باشد.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` ویزارد onboarding را از طریق WS RPC در دسترس قرار می‌دهند.

  </Accordion>

  <Accordion title="کمک‌کارهای عامل و فضای کاری">
    - `agents.list` ورودی‌های عامل پیکربندی‌شده را، شامل مدل مؤثر و فراداده runtime، برمی‌گرداند.
    - `agents.create`، `agents.update` و `agents.delete` رکوردهای عامل و اتصال‌های فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get` و `agents.files.set` فایل‌های فضای کاری راه‌انداز را که برای یک عامل در دسترس قرار گرفته‌اند مدیریت می‌کنند.
    - `tasks.list`، `tasks.get` و `tasks.cancel` دفتر وظایف Gateway را در اختیار کلاینت‌های SDK و اپراتور قرار می‌دهند.
    - `artifacts.list`، `artifacts.get` و `artifacts.download` خلاصه‌های آرتیفکت مشتق‌شده از رونوشت و دانلودها را برای محدوده صریح `sessionKey`، `runId` یا `taskId` در اختیار می‌گذارند. پرس‌وجوهای اجرا و وظیفه نشست مالک را در سمت سرور resolve می‌کنند و فقط رسانه‌های رونوشت با منشأ مطابق را برمی‌گردانند؛ منابع URL ناامن یا محلی، به‌جای واکشی در سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `environments.list` و `environments.status` کشف محیط فقط‌خواندنی محلی Gateway و Node را برای کلاینت‌های SDK در اختیار می‌گذارند.
    - `agent.identity.get` هویت مؤثر دستیار را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` تا پایان یک اجرا منتظر می‌ماند و در صورت موجود بودن، snapshot پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` نمایه نشست فعلی را، شامل فراداده `agentRuntime` برای هر ردیف وقتی backend runtime عامل پیکربندی شده باشد، برمی‌گرداند.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر نشست را برای کلاینت WS فعلی روشن یا خاموش می‌کنند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد رونوشت/پیام را برای یک نشست روشن یا خاموش می‌کنند.
    - `sessions.preview` پیش‌نمایش‌های محدودشده رونوشت را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.describe` یک ردیف نشست Gateway را برای یک کلید نشست دقیق برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را resolve یا canonicalize می‌کند.
    - `sessions.create` یک ورودی نشست جدید ایجاد می‌کند.
    - `sessions.send` پیامی را به یک نشست موجود می‌فرستد.
    - `sessions.steer` گونه interrupt-and-steer برای یک نشست فعال است.
    - `sessions.abort` کار فعال یک نشست را abort می‌کند. فراخواننده می‌تواند `key` را همراه با `runId` اختیاری بفرستد، یا برای اجراهای فعالی که Gateway می‌تواند به یک نشست resolve کند، فقط `runId` را بفرستد.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌همراه `agentRuntime` مؤثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete` و `sessions.compact` نگهداری نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort` و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌صورت نمایشی نرمال‌سازی می‌شود: تگ‌های directive درون‌خطی از متن قابل‌مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار در متن ساده (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شده فراخوانی ابزار) و توکن‌های کنترل مدل ASCII/تمام‌عرض نشت‌کرده حذف می‌شوند، ردیف‌های دستیار فقط با توکن خاموش مانند `NO_REPLY` / `no_reply` دقیق کنار گذاشته می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.
    - `chat.message.get` خواننده افزایشی و محدودشده پیام کامل برای یک ورودی رونوشت قابل‌مشاهده واحد است. کلاینت‌ها `sessionKey`، در صورت عامل‌محور بودن انتخاب نشست `agentId` اختیاری، به‌همراه `messageId` رونوشت را که قبلاً از طریق `chat.history` ارائه شده است می‌فرستند، و Gateway همان projection نرمال‌شده نمایشی را بدون سقف کوتاه‌سازی تاریخچه سبک برمی‌گرداند، اگر ورودی ذخیره‌شده هنوز موجود باشد و بیش‌ازحد بزرگ نباشد.
    - `chat.send` مقدار یک‌نوبتی `fastMode: "auto"` را می‌پذیرد تا برای فراخوانی‌های مدل که پیش از cutoff خودکار شروع شده‌اند از حالت سریع استفاده کند، سپس فراخوانی‌های retry، fallback، نتیجه ابزار یا continuation بعدی را بدون حالت سریع آغاز کند. cutoff به‌طور پیش‌فرض ۶۰ ثانیه است و می‌توان آن را برای هر مدل با `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` پیکربندی کرد. فراخواننده `chat.send` می‌تواند `fastAutoOnSeconds` یک‌نوبتی را برای override کردن cutoff همان درخواست بفرستد.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و توکن‌های دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شده در انتظار و تأییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject` و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` توکن یک دستگاه جفت‌شده را در محدوده‌های نقش تأییدشده و scope فراخواننده می‌چرخاند.
    - `device.token.revoke` توکن یک دستگاه جفت‌شده را در محدوده‌های نقش تأییدشده و scope فراخواننده لغو می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، invoke و کار در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove` و `node.pair.verify` جفت‌سازی Node و راستی‌آزمایی راه‌انداز را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک Node متصل forward می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای منشأگرفته از Node را به gateway برمی‌گرداند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کارهای در انتظار پایدار را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تأیید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list` و `exec.approval.resolve` درخواست‌های تأیید exec یک‌باره به‌همراه lookup/replay تأییدهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تأیید exec در انتظار می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در timeout مقدار `null`).
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای سیاست تأیید exec در Gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تأیید exec محلی Node را از طریق فرمان‌های relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision` و `plugin.approval.resolve` جریان‌های تأیید تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills و ابزارها">
    - اتوماسیون: `wake` تزریق فوری یا next-heartbeat متن بیدارسازی را زمان‌بندی می‌کند؛ `cron.get`، `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کار زمان‌بندی‌شده را مدیریت می‌کنند.
    - `cron.run` همچنان یک RPC از نوع enqueue برای اجراهای دستی است. کلاینت‌هایی که به semantics تکمیل نیاز دارند باید `runId` برگشتی را بخوانند و `cron.runs` را poll کنند.
    - `cron.runs` یک فیلتر اختیاری غیرخالی `runId` می‌پذیرد تا کلاینت‌ها بتوانند یک اجرای دستی صف‌شده را بدون race با سایر ورودی‌های تاریخچه همان job دنبال کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رایج رویداد

- `chat`: به‌روزرسانی‌های چت UI مانند `chat.inject` و سایر رویدادهای چت فقط‌-رونوشت. در پروتکل v4، payloadهای delta حامل `deltaText` هستند؛ `message` همچنان snapshot تجمعی دستیار می‌ماند. جایگزینی‌های غیرپیشوندی `replace=true` را تنظیم می‌کنند و از `deltaText` به‌عنوان متن جایگزین استفاده می‌کنند.
- `session.message`، `session.operation` و `session.tool`: رونوشت، عملیات نشست در حال انجام، و به‌روزرسانی‌های جریان رویداد برای یک نشست مشترک‌شده.
- `sessions.changed`: نمایه نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / liveness.
- `health`: به‌روزرسانی snapshot سلامت gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر job/اجرای Cron.
- `shutdown`: اعلان خاموشی gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه‌عمر جفت‌سازی Node.
- `node.invoke.request`: پخش درخواست invoke برای Node.
- `device.pair.requested` / `device.pair.resolved`: چرخه‌عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی trigger واژه بیدارسازی تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه‌عمر تأیید exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه‌عمر تأیید Plugin.

### متدهای کمک‌کار Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی executableهای skill را برای بررسی‌های auto-allow واکشی کنند.

### RPCهای دفتر وظایف

کلاینت‌های اپراتور می‌توانند رکوردهای وظیفه پس‌زمینه Gateway را از طریق RPCهای دفتر وظایف بررسی و cancel کنند. این متدها خلاصه‌های پاک‌سازی‌شده وظیفه را برمی‌گردانند، نه state خام runtime.

- `tasks.list` به `operator.read` نیاز دارد.
  - پارامترها: `status` اختیاری (`"queued"`، `"running"`، `"completed"`، `"failed"`، `"cancelled"` یا `"timed_out"`) یا آرایه‌ای از آن statusها، `agentId` اختیاری، `sessionKey` اختیاری، `limit` اختیاری از `1` تا `500`، و `cursor` رشته‌ای اختیاری.
  - نتیجه: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` به `operator.read` نیاز دارد.
  - پارامترها: `{ "taskId": string }`.
  - نتیجه: `{ "task": TaskSummary }`.
  - شناسه‌های وظیفه ناموجود، شکل خطای not-found در Gateway را برمی‌گردانند.
- `tasks.cancel` به `operator.write` نیاز دارد.
  - پارامترها: `{ "taskId": string, "reason"?: string }`.
  - نتیجه:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` گزارش می‌دهد که آیا دفتر وظایف یک وظیفه مطابق داشته است یا نه. `cancelled` گزارش می‌دهد که آیا runtime لغو را پذیرفته یا ثبت کرده است یا نه.

`TaskSummary` شامل `id`، `status` و فراداده اختیاری مانند `kind`، `runtime`، `title`، `agentId`، `sessionKey`، `childSessionKey`، `ownerKey`، `runId`، `taskId`، `flowId`، `parentTaskId`، `sourceId`، timestampها، progress، خلاصه پایانی و متن خطای پاک‌سازی‌شده است. `agentId` عاملی را که وظیفه را اجرا می‌کند شناسایی می‌کند؛ `sessionKey` و `ownerKey` زمینه درخواست‌دهنده و کنترل را حفظ می‌کنند.

### متدهای کمک‌کار اپراتور

- اپراتورها می‌توانند `commands.list` (`operator.read`) را برای دریافت فهرست فرمان‌های زمان اجرای یک عامل فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both` در صورت وجود، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` در صورت وجود، نام فرمان بومی آگاه از ارائه‌دهنده را حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی و در دسترس بودن فرمان بومی Plugin اثر می‌گذارد.
  - `includeArgs=false` فراداده سریال‌شده آرگومان‌ها را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند `tools.catalog` (`operator.read`) را برای دریافت کاتالوگ ابزار زمان اجرای یک عامل فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` است
  - `optional`: اینکه آیا یک ابزار Plugin اختیاری است
- اپراتورها می‌توانند `tools.effective` (`operator.read`) را برای دریافت فهرست ابزار مؤثر در زمان اجرا برای یک نشست فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا بافت تحویلِ ارائه‌شده توسط فراخواننده، بافت زمان اجرای مورد اعتماد را از نشست در سمت سرور استخراج می‌کند.
  - پاسخ، تصویری مشتق‌شده در سمت سرور و محدود به نشست از فهرست فعال است، شامل ابزارهای هسته، Plugin، کانال، و سرور MCP که از قبل کشف شده‌اند.
  - `tools.effective` برای MCP فقط خواندنی است: می‌تواند یک کاتالوگ MCP نشست گرم را از سیاست نهایی ابزار عبور دهد، اما زمان اجراهای MCP را ایجاد نمی‌کند، ترابری‌ها را وصل نمی‌کند، و `tools/list` صادر نمی‌کند. اگر کاتالوگ گرم منطبقی وجود نداشته باشد، پاسخ ممکن است اعلانی مانند `mcp-not-yet-connected`، `mcp-not-yet-listed`، یا `mcp-stale-catalog` داشته باشد.
  - ورودی‌های ابزار مؤثر از `source="core"`، `source="plugin"`، `source="channel"`، یا `source="mcp"` استفاده می‌کنند.
- اپراتورها می‌توانند `tools.invoke` (`operator.write`) را برای فراخوانی یک ابزار در دسترس از همان مسیر سیاست Gateway مانند `/tools/invoke` فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm`، و `idempotencyKey` اختیاری هستند.
  - اگر هر دو `sessionKey` و `agentId` حاضر باشند، عامل نشست حل‌شده باید با `agentId` منطبق باشد.
  - پوشش‌دهنده‌های هسته فقط‌مالک مانند `cron`، `gateway`، و `nodes` به هویت مالک/مدیر (`operator.admin`) نیاز دارند، هرچند خود متد `tools.invoke` برابر `operator.write` است.
  - پاسخ یک پاکت روبه‌روی SDK با فیلدهای `ok`، `toolName`، `output` اختیاری، و `error` نوع‌دار است. تأییدیه یا ردهای سیاستی به‌جای دور زدن خط لوله سیاست ابزار Gateway، `ok:false` را در payload برمی‌گردانند.
- اپراتورها می‌توانند `skills.status` (`operator.read`) را برای دریافت فهرست مهارت‌های قابل مشاهده برای یک عامل فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - پاسخ شامل احراز شرایط، نیازمندی‌های مفقود، بررسی‌های پیکربندی، و گزینه‌های نصب پاک‌سازی‌شده است، بدون افشای مقادیر خام محرمانه.
- اپراتورها می‌توانند `skills.search` و `skills.detail` (`operator.read`) را برای فراداده کشف ClawHub فراخوانی کنند.
- اپراتورها می‌توانند `skills.upload.begin`، `skills.upload.chunk`، و `skills.upload.commit` (`operator.admin`) را برای آماده‌سازی یک آرشیو مهارت خصوصی پیش از نصب آن فراخوانی کنند. این یک مسیر آپلود مدیریتی جداگانه برای کلاینت‌های مورد اعتماد است، نه جریان عادی نصب مهارت ClawHub، و به‌صورت پیش‌فرض غیرفعال است مگر اینکه `skills.install.allowUploadedArchives` فعال شده باشد.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` یک آپلود وابسته به آن slug و مقدار force ایجاد می‌کند.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` بایت‌ها را در offset دقیق رمزگشایی‌شده اضافه می‌کند.
  - `skills.upload.commit({ uploadId, sha256? })` اندازه نهایی و SHA-256 را تأیید می‌کند. commit فقط آپلود را نهایی می‌کند؛ مهارت را نصب نمی‌کند.
  - آرشیوهای مهارت آپلودشده، آرشیوهای zip شامل یک ریشه `SKILL.md` هستند. نام پوشه داخلی آرشیو هرگز هدف نصب را انتخاب نمی‌کند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در سه حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه مهارت را در پوشه `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت آپلود: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` یک آپلود commitشده را در پوشه `skills/<slug>` فضای کاری عامل پیش‌فرض نصب می‌کند. مقدار slug و force باید با درخواست اصلی `skills.upload.begin` منطبق باشند. این حالت رد می‌شود مگر اینکه `skills.install.allowUploadedArchives` فعال شده باشد. این تنظیم بر نصب‌های ClawHub اثر نمی‌گذارد.
  - حالت نصب‌کننده Gateway: `{ name, installId, timeoutMs? }` یک کنش اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند. کلاینت‌های قدیمی‌تر ممکن است همچنان `dangerouslyForceUnsafeInstall` بفرستند؛ این فیلد منسوخ شده، فقط برای سازگاری پروتکل پذیرفته می‌شود، و نادیده گرفته می‌شود. برای تصمیم‌های نصب تحت مالکیت اپراتور از `security.installPolicy` استفاده کنید.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug ردیابی‌شده یا همه نصب‌های ClawHub ردیابی‌شده در فضای کاری عامل پیش‌فرض را به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`، `apiKey`، و `env` را patch می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ کاتالوگ مجاز است، شامل مدل‌های کشف‌شده به‌صورت پویا برای ورودی‌های `provider/*`. در غیر این صورت پاسخ، کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد، شامل کشف محدود به ارائه‌دهنده برای ورودی‌های `provider/*`. بدون فهرست مجاز، پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند، و فقط زمانی به کاتالوگ کامل برمی‌گردد که هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این گزینه برای عیب‌یابی و رابط‌های کشف استفاده کنید، نه انتخاب‌گرهای عادی مدل.

## تأییدهای اجرا

- وقتی یک درخواست اجرا به تأیید نیاز دارد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` حل می‌کنند (به scope برابر `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده نشست به‌شکل canonical). درخواست‌های فاقد `systemRunPlan` رد می‌شوند.
- پس از تأیید، فراخوانی‌های هدایت‌شده `node.invoke system.run` همان `systemRunPlan` به‌شکل canonical را به‌عنوان بافت معتبر فرمان/cwd/نشست دوباره استفاده می‌کنند.
- اگر یک فراخواننده `command`، `rawCommand`، `cwd`، `agentId`، یا `sessionKey` را بین آماده‌سازی و ارسال نهایی تأییدشده `system.run` تغییر دهد، Gateway به‌جای اعتماد به payload تغییریافته، اجرا را رد می‌کند.

## جایگزین تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی شامل `deliver=true` باشند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل حل‌نشده یا فقط‌داخلی `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` زمانی که هیچ مسیر قابل تحویل خارجی قابل حل نباشد، امکان بازگشت به اجرای فقط‌نشست را فراهم می‌کند (برای مثال نشست‌های داخلی/webchat یا پیکربندی‌های چندکاناله مبهم).
- نتایج نهایی `agent` وقتی تحویل درخواست شده باشد، ممکن است شامل `result.deliveryStatus` باشند، با همان وضعیت‌های `sent`، `suppressed`، `partial_failed`، و `failed` که برای [`openclaw agent --json --deliver`](/fa/cli/agent#json-delivery-status) مستند شده‌اند.

## نسخه‌بندی

- `PROTOCOL_VERSION` در `packages/gateway-protocol/src/version.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را می‌فرستند؛ سرور بازه‌هایی را که شامل پروتکل فعلی آن نباشند رد می‌کند. کلاینت‌ها و سرورهای فعلی به پروتکل v4 نیاز دارند.
- طرح‌واره‌ها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در سراسر پروتکل v4 پایدار هستند و مبنای مورد انتظار برای کلاینت‌های شخص ثالث‌اند.

| ثابت                                      | پیش‌فرض                                               | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| زمان انقضای درخواست (برای هر RPC)         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| زمان انقضای preauth / چالش اتصال          | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| عقب‌نشینی اولیه اتصال مجدد                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه عقب‌نشینی اتصال مجدد               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| گیره تلاش سریع دوباره پس از بسته شدن device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت force-stop پیش از `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| زمان انقضای پیش‌فرض `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصله tick پیش‌فرض (پیش از `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن به‌علت زمان انقضای tick              | code `4000` وقتی سکوت از `tickIntervalMs * 2` فراتر برود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور مقادیر مؤثر `policy.tickIntervalMs`، `policy.maxPayload`، و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، آن مقادیر را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا non-loopback
  `gateway.auth.mode: "trusted-proxy"` بررسی احراز هویت اتصال را از
  سرآیندهای درخواست، به‌جای `connect.params.auth.*`، برآورده می‌کنند.
- حالت ورودی خصوصی `gateway.auth.mode: "none"` احراز هویت اتصال با راز مشترک را
  کاملا رد می‌کند؛ این حالت را روی ورودی عمومی/نامطمئن در معرض دسترس قرار ندهید.
- پس از جفت‌سازی، Gateway یک **توکن دستگاه** صادر می‌کند که به نقش اتصال
  + دامنه‌ها محدود است. این توکن در `hello-ok.auth.deviceToken` برگردانده می‌شود و
  باید برای اتصال‌های آینده توسط کلاینت پایدارسازی شود.
- کلاینت‌ها باید پس از هر اتصال موفق، `hello-ok.auth.deviceToken` اصلی را پایدارسازی کنند.
- اتصال دوباره با آن توکن دستگاه **ذخیره‌شده** باید مجموعه دامنه‌های تأییدشده ذخیره‌شده
  برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت را
  که قبلا اعطا شده حفظ می‌کند و مانع از آن می‌شود که اتصال‌های دوباره بی‌صدا به
  دامنه ضمنی محدودترِ فقط-مدیر فروکاسته شوند.
- سرهم‌بندی احراز هویت اتصال در سمت کلاینت (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و هر زمان تنظیم شده باشد همیشه ارسال می‌شود.
  - `auth.token` به‌ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس یک `deviceToken` صریح، سپس یک توکن ذخیره‌شده به‌ازای هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط زمانی فرستاده می‌شود که هیچ‌کدام از موارد بالا یک
    `auth.token` را تعیین نکرده باشند. یک توکن مشترک یا هر توکن دستگاه تعیین‌شده آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش دوباره تک‌مرحله‌ای
    `AUTH_TOKEN_MISMATCH` فقط برای **نقطه‌های پایانی مورد اعتماد** مجاز است —
    loopback، یا `wss://` با `tlsFingerprint` سنجاق‌شده. `wss://` عمومی
    بدون سنجاق‌سازی واجد شرایط نیست.
- بوت‌استرپ کد راه‌اندازی داخلی، `hello-ok.auth.deviceToken` گره اصلی را
  به‌همراه یک توکن اپراتور محدودشده در `hello-ok.auth.deviceTokens` برای
  تحویل امن موبایل برمی‌گرداند. توکن اپراتور برای خواندن‌های پیکربندی بومی Talk شامل
  `operator.talk.secrets` است و `operator.admin` و `operator.pairing` را
  مستثنی می‌کند.
- وقتی یک بوت‌استرپ کد راه‌اندازی غیرپایه در انتظار تأیید است، جزئیات `PAIRING_REQUIRED`
  شامل `recommendedNextStep: "wait_then_retry"`، `retryable: true`،
  و `pauseReconnect: false` است. کلاینت‌ها باید تا زمانی که درخواست تأیید شود
  یا توکن نامعتبر شود، با همان توکن بوت‌استرپ دوباره وصل شوند.
- `hello-ok.auth.deviceTokens` را فقط زمانی پایدارسازی کنید که اتصال از احراز هویت بوت‌استرپ
  روی یک انتقال مورد اعتماد مانند `wss://` یا جفت‌سازی loopback/local استفاده کرده باشد.
- اگر کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، آن
  مجموعه دامنه درخواست‌شده توسط فراخواننده مرجع باقی می‌ماند؛ دامنه‌های کش‌شده فقط
  زمانی دوباره استفاده می‌شوند که کلاینت همان توکن ذخیره‌شده به‌ازای هر دستگاه را دوباره استفاده کند.
- توکن‌های دستگاه را می‌توان از طریق `device.token.rotate` و
  `device.token.revoke` چرخاند/لغو کرد (به دامنه `operator.pairing` نیاز دارد). چرخاندن یا
  لغو یک گره یا نقش غیر-اپراتور دیگر، به `operator.admin` نیز نیاز دارد.
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. این متد توکن حامل جایگزین را
  فقط برای فراخوانی‌های همان دستگاه بازتاب می‌دهد که از قبل با همان توکن دستگاه
  احراز هویت شده‌اند، تا کلاینت‌های فقط-توکن بتوانند جایگزین خود را پیش از
  اتصال دوباره پایدارسازی کنند. چرخش‌های اشتراکی/مدیر توکن حامل را بازتاب نمی‌دهند.
- صدور، چرخش و لغو توکن در محدوده مجموعه نقش تأییدشده‌ای می‌ماند که در
  ورودی جفت‌سازی همان دستگاه ثبت شده است؛ تغییر توکن نمی‌تواند نقش دستگاهی را گسترش دهد
  یا هدف بگیرد که تأیید جفت‌سازی هرگز اعطا نکرده است.
- برای نشست‌های توکن دستگاه جفت‌شده، مدیریت دستگاه خود-دامنه است مگر اینکه
  فراخواننده `operator.admin` نیز داشته باشد: فراخوانندگان غیرمدیر فقط می‌توانند
  توکن اپراتور مربوط به ورودی دستگاه **خودشان** را مدیریت کنند. مدیریت توکن گره و
  دیگر توکن‌های غیر-اپراتور فقط مدیر است، حتی برای دستگاه خود فراخواننده.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه دامنه توکن اپراتور هدف را
  در برابر دامنه‌های نشست فعلی فراخواننده بررسی می‌کنند. فراخوانندگان غیرمدیر
  نمی‌توانند توکن اپراتوری گسترده‌تر از آنچه خودشان دارند را بچرخانند یا لغو کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (بولی)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های مورد اعتماد می‌توانند یک تلاش دوباره محدود با یک توکن کش‌شده به‌ازای هر دستگاه انجام دهند.
  - اگر آن تلاش دوباره شکست بخورد، کلاینت‌ها باید حلقه‌های اتصال دوباره خودکار را متوقف کنند و راهنمای اقدام اپراتور را نمایش دهند.
- `AUTH_SCOPE_MISMATCH` یعنی توکن دستگاه شناسایی شده اما نقش/دامنه‌های
  درخواست‌شده را پوشش نمی‌دهد. کلاینت‌ها نباید این را به‌عنوان توکن نامعتبر نمایش دهند؛
  از اپراتور بخواهید دوباره جفت‌سازی کند یا قرارداد دامنه محدودتر/گسترده‌تر را تأیید کند.

## هویت دستگاه + جفت‌سازی

- گره‌ها باید یک هویت دستگاه پایدار (`device.id`) داشته باشند که از
  اثر انگشت جفت‌کلید مشتق شده است.
- Gatewayها به‌ازای دستگاه + نقش توکن صادر می‌کنند.
- تأییدهای جفت‌سازی برای شناسه‌های دستگاه جدید لازم هستند، مگر اینکه تأیید خودکار محلی
  فعال شده باشد.
- تأیید خودکار جفت‌سازی حول اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر محدود اتصال-به-خودِ backend/container-local برای
  جریان‌های کمکی راز مشترک مورد اعتماد دارد.
- اتصال‌های same-host tailnet یا LAN همچنان برای جفت‌سازی به‌عنوان راه‌دور در نظر گرفته می‌شوند و
  به تأیید نیاز دارند.
- کلاینت‌های WS معمولا هنگام `connect` هویت `device` را شامل می‌کنند (اپراتور +
  گره). تنها استثناهای اپراتور بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط-میزبان محلی.
  - احراز هویت موفق اپراتور Control UI با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (راه‌حل اضطراری، کاهش امنیت شدید).
  - RPCهای backend مستقیم-loopback `gateway-client` روی مسیر کمکی داخلی
    رزرو‌شده.
- حذف هویت دستگاه پیامدهای دامنه دارد. وقتی یک اتصال اپراتور بدون دستگاه
  از طریق یک مسیر اعتماد صریح مجاز می‌شود، OpenClaw همچنان دامنه‌های
  خوداظهارشده را به مجموعه‌ای خالی پاک می‌کند، مگر اینکه آن مسیر یک استثنای نام‌گذاری‌شده
  برای حفظ دامنه داشته باشد. سپس متدهای مقید به دامنه با
  `missing scope` شکست می‌خورند.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` یک مسیر حفظ دامنه
  اضطراری Control UI است. این مسیر به backendهای سفارشی دلخواه یا کلاینت‌های WebSocket با شکل CLI
  دامنه اعطا نمی‌کند.
- مسیر کمکی backend رزرو‌شده مستقیم-loopback `gateway-client` دامنه‌ها را
  فقط برای RPCهای داخلی صفحه کنترل محلی حفظ می‌کند؛ شناسه‌های backend سفارشی
  این استثنا را دریافت نمی‌کنند.
- همه اتصال‌ها باید nonce مربوط به `connect.challenge` ارائه‌شده توسط سرور را امضا کنند.

### عیب‌یابی مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنی                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده (یا خالی فرستاده) است. |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce کهنه/اشتباه امضا کرده است.         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | بار امضا با بار v2 مطابقت ندارد.                  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | زمان‌مهر امضاشده خارج از انحراف مجاز است.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثر انگشت کلید عمومی مطابقت ندارد. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/متعارف‌سازی کلید عمومی شکست خورده است.       |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- بار v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- بار امضای ترجیحی `v3` است، که علاوه بر فیلدهای device/client/role/scopes/token/nonce،
  `platform` و `deviceFamily` را نیز متصل می‌کند.
- امضاهای قدیمی `v2` همچنان برای سازگاری پذیرفته می‌شوند، اما سنجاق‌سازی فراداده
  دستگاه جفت‌شده همچنان سیاست فرمان را هنگام اتصال دوباره کنترل می‌کند.

## TLS + سنجاق‌سازی

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثر انگشت گواهی gateway را سنجاق کنند (پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` را ببینید).

## دامنه

این پروتکل **API کامل gateway** را در معرض دسترس قرار می‌دهد (وضعیت، کانال‌ها، مدل‌ها، چت،
عامل، نشست‌ها، گره‌ها، تأییدها، و غیره). سطح دقیق توسط شِماهای
TypeBox در `packages/gateway-protocol/src/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل Bridge](/fa/gateway/bridge-protocol)
- [راهنمای عملیاتی Gateway](/fa/gateway)
