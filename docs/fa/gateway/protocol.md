---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS Gateway
    - اشکال‌زدایی عدم تطابق‌های پروتکل یا خطاهای اتصال
    - بازسازی طرح‌واره‌ها/مدل‌های پروتکل
summary: 'پروتکل WebSocket Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-05-02T20:45:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc8bd6bae485f13bbd0e8762d30abdfab7e2aee635f8ebac1a38798493239798
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل WS مربوط به Gateway، **صفحهٔ کنترل واحد + ترابری گره** برای OpenClaw است. همهٔ کلاینت‌ها (CLI، رابط وب، برنامهٔ macOS، گره‌های iOS/Android، گره‌های headless) از طریق WebSocket متصل می‌شوند و هنگام دست‌دهی، **نقش** + **دامنهٔ دسترسی** خود را اعلام می‌کنند.

## ترابری

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود می‌شوند. پس از دست‌دهی موفق، کلاینت‌ها باید از محدودیت‌های `hello-ok.policy.maxPayload` و `hello-ok.policy.maxBufferedBytes` پیروی کنند. با فعال بودن diagnostics، فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه gateway فریم آسیب‌دیده را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها اندازه‌ها، محدودیت‌ها، سطح‌ها، و کدهای دلیل امن را نگه می‌دارند. آن‌ها بدنهٔ پیام، محتوای پیوست، بدنهٔ خام فریم، توکن‌ها، کوکی‌ها، یا مقدارهای محرمانه را نگه نمی‌دارند.

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

در حالی که Gateway هنوز در حال تکمیل sidecarهای راه‌اندازی است، درخواست `connect` می‌تواند یک خطای قابل‌تکرار `UNAVAILABLE` برگرداند که `details.reason` آن روی `"startup-sidecars"` و `retryAfterMs` تنظیم شده است. کلاینت‌ها باید این پاسخ را در محدودهٔ بودجهٔ کلی اتصال خود دوباره تلاش کنند، نه اینکه آن را به‌عنوان شکست نهایی دست‌دهی نشان دهند.

`server`، `features`، `snapshot`، و `policy` همگی توسط schema الزامی هستند (`src/gateway/protocol/schema/frames.ts`). `auth` نیز الزامی است و نقش/دامنه‌های دسترسی مذاکره‌شده را گزارش می‌کند. `canvasHostUrl` اختیاری است.

وقتی هیچ توکن دستگاهی صادر نشود، `hello-ok.auth` مجوزهای مذاکره‌شده را بدون فیلدهای توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend مورداعتمادِ همان پردازه (`client.id: "gateway-client"`، `client.mode: "backend"`) می‌توانند در اتصال‌های مستقیم loopback، وقتی با توکن/رمز مشترک gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای داخلی صفحهٔ کنترل رزرو شده است و مانع از آن می‌شود که baselineهای قدیمی pairing مربوط به CLI/دستگاه، کار backend محلی مانند به‌روزرسانی‌های نشست subagent را مسدود کنند. کلاینت‌های راه‌دور، کلاینت‌های با مبدأ مرورگر، کلاینت‌های گره، و کلاینت‌های صریح device-token/device-identity همچنان از بررسی‌های عادی pairing و ارتقای دامنهٔ دسترسی استفاده می‌کنند.

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

در هنگام واگذاری trusted bootstrap، `hello-ok.auth` ممکن است ورودی‌های نقش محدود اضافی را نیز در `deviceTokens` شامل شود:

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

برای جریان bootstrap داخلی node/operator، توکن اصلی گره با `scopes: []` باقی می‌ماند و هر توکن operator واگذارشده به allowlist اپراتور bootstrap محدود می‌ماند (`operator.approvals`، `operator.read`، `operator.talk.secrets`، `operator.write`). بررسی‌های دامنهٔ دسترسی bootstrap همچنان با پیشوند نقش می‌مانند: ورودی‌های operator فقط درخواست‌های operator را برآورده می‌کنند، و نقش‌های غیر operator همچنان به دامنه‌های دسترسی زیر پیشوند نقش خودشان نیاز دارند.

### نمونهٔ Node

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

### نقش‌ها

- `operator` = کلاینت صفحهٔ کنترل (CLI/UI/automation).
- `node` = میزبان قابلیت (camera/screen/canvas/system.run).

### دامنه‌های دسترسی (operator)

دامنه‌های دسترسی رایج:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` با `includeSecrets: true` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.

متدهای RPC مربوط به Gateway که توسط Plugin ثبت شده‌اند ممکن است دامنهٔ دسترسی operator خودشان را درخواست کنند، اما پیشوندهای admin رزروشدهٔ هسته (`config.*`، `exec.approvals.*`، `wizard.*`، `update.*`) همیشه به `operator.admin` resolve می‌شوند.

دامنهٔ دسترسی متد فقط نخستین دروازه است. برخی slash commandها که از طریق `chat.send` می‌رسند، بررسی‌های سخت‌گیرانه‌تر در سطح فرمان را علاوه بر آن اعمال می‌کنند. برای مثال، نوشتن‌های ماندگار `/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` علاوه بر دامنهٔ دسترسی پایهٔ متد، یک بررسی دامنهٔ دسترسی اضافی در زمان approval نیز دارد:

- درخواست‌های بدون فرمان: `operator.pairing`
- درخواست‌هایی با فرمان‌های گره غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare`، یا `system.which` هستند: `operator.pairing` + `operator.admin`

### قابلیت‌ها/فرمان‌ها/مجوزها (node)

گره‌ها هنگام اتصال، ادعاهای قابلیت را اعلام می‌کنند:

- `caps`: دسته‌های قابلیت سطح بالا.
- `commands`: allowlist فرمان برای invoke.
- `permissions`: toggleهای granular (مثلاً `screen.record`، `camera.capture`).

Gateway این موارد را به‌عنوان **ادعا** در نظر می‌گیرد و allowlistهای سمت سرور را اعمال می‌کند.

## حضور

- `system-presence` ورودی‌هایی را برمی‌گرداند که بر اساس identity دستگاه کلیدگذاری شده‌اند.
- ورودی‌های حضور شامل `deviceId`، `roles`، و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف واحد نشان دهند، حتی وقتی همان دستگاه هم به‌عنوان **operator** و هم به‌عنوان **node** متصل می‌شود.
- `node.list` شامل فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` است. گره‌های متصل، زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ گره‌های pairشده همچنین می‌توانند وقتی یک رویداد گرهٔ مورداعتماد، فرادادهٔ pairing آن‌ها را به‌روزرسانی می‌کند، حضور پس‌زمینهٔ پایدار گزارش کنند.

### رویداد زنده‌بودن پس‌زمینهٔ Node

گره‌ها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک گرهٔ pairشده هنگام wake پس‌زمینه زنده بوده، بدون اینکه آن را متصل علامت‌گذاری کند.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`، `significant_location`، `manual`، یا `connect`. رشته‌های trigger ناشناخته پیش از persistence توسط gateway به `background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه node احرازشده پایدار است؛ نشست‌های بدون دستگاه یا unpaired مقدار `handled: false` برمی‌گردانند.

Gatewayهای موفق یک نتیجهٔ ساختاریافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gatewayهای قدیمی‌تر ممکن است همچنان برای `node.event` مقدار `{ "ok": true }` برگردانند؛ کلاینت‌ها باید آن را به‌عنوان یک RPC تأییدشده در نظر بگیرند، نه persistence پایدار حضور.

## دامنه‌بندی رویداد broadcast

رویدادهای broadcast مربوط به WebSocket که توسط سرور push می‌شوند، با دامنهٔ دسترسی gate می‌شوند تا نشست‌های دارای دامنهٔ pairing یا نشست‌های فقط node، محتوای نشست را به‌صورت passive دریافت نکنند.

- **فریم‌های chat، agent، و tool-result** (از جمله رویدادهای streamed `agent` و نتایج tool call) حداقل به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را کاملاً رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به نحوهٔ ثبت آن‌ها توسط Plugin، با `operator.write` یا `operator.admin` gate می‌شوند.
- **رویدادهای status و transport** (`heartbeat`، `presence`، `tick`، چرخهٔ عمر connect/disconnect، و غیره) بدون محدودیت می‌مانند تا سلامت transport برای هر نشست احرازشده قابل مشاهده باشد.
- **خانواده‌های رویداد broadcast ناشناخته** به‌صورت پیش‌فرض با دامنهٔ دسترسی gate می‌شوند (fail-closed)، مگر اینکه یک handler ثبت‌شده صراحتاً آن‌ها را relax کند.

هر اتصال کلاینت شمارهٔ sequence مختص همان کلاینت را نگه می‌دارد، بنابراین broadcastها روی آن socket ترتیب یکنواخت را حفظ می‌کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوتی از جریان رویداد را پس از فیلتر دامنهٔ دسترسی می‌بینند.

## خانواده‌های رایج متد RPC

سطح عمومی WS از مثال‌های handshake/auth بالا گسترده‌تر است. این یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست conservative برای discovery است که از `src/gateway/server-methods-list.ts` به‌علاوهٔ exportهای متد Plugin/channel بارگذاری‌شده ساخته می‌شود. آن را discovery قابلیت در نظر بگیرید، نه enumeration کامل `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="سامانه و identity">
    - `health` snapshot سلامت gateway را که cached یا تازه probe شده است برمی‌گرداند.
    - `diagnostics.stability` رکوردر diagnostic stability محدود و اخیر را برمی‌گرداند. این مورد فرادادهٔ عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایت، خوانش‌های حافظه، وضعیت queue/session، نام channel/plugin، و شناسه‌های نشست را نگه می‌دارد. متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، یا مقدارهای محرمانه را نگه نمی‌دارد. دامنهٔ دسترسی خواندن operator الزامی است.
    - `status` خلاصهٔ gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های operator دارای دامنهٔ admin گنجانده می‌شوند.
    - `gateway.identity.get` identity دستگاه gateway را که توسط جریان‌های relay و pairing استفاده می‌شود برمی‌گرداند.
    - `system-presence` snapshot حضور فعلی دستگاه‌های operator/node متصل را برمی‌گرداند.
    - `system-event` یک رویداد سامانه را اضافه می‌کند و می‌تواند زمینهٔ حضور را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` آخرین رویداد heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش heartbeat را روی gateway toggle می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و استفاده">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخاب‌گر (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را ارسال کنید، یا برای کاتالوگ کامل مقدار `{ "view": "all" }` را ارسال کنید.
    - `usage.status` خلاصه‌های پنجره‌های استفاده/سهمیه باقی‌مانده ارائه‌دهنده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیع‌شده هزینه استفاده را برای یک بازه تاریخی برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding ذخیره‌شده در cache را برای workspace عامل پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخواننده صریحا یک ping زنده به ارائه‌دهنده embedding می‌خواهد، مقدار `{ "probe": true }` یا `{ "deep": true }` را ارسال کنید.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از harness REM را برای کلاینت‌های control-plane راه‌دور برمی‌گرداند. این می‌تواند شامل مسیرهای workspace، قطعه‌های حافظه، markdown زمینه‌مند رندرشده، و نامزدهای ارتقای عمیق باشد، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های استفاده به‌ازای هر session را برمی‌گرداند.
    - `sessions.usage.timeseries` استفاده timeseries را برای یک session برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های گزارش استفاده را برای یک session برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و helperهای ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص خارج می‌شود، در جایی که کانال از خروج پشتیبانی کند.
    - `web.login.start` یک جریان ورود QR/web را برای ارائه‌دهنده کانال web فعلی که از QR پشتیبانی می‌کند شروع می‌کند.
    - `web.login.wait` منتظر تکمیل آن جریان ورود QR/web می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک push آزمایشی APNs را به یک Node ثبت‌شده iOS ارسال می‌کند.
    - `voicewake.get` triggerهای wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` triggerهای wake-word را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و گزارش‌ها">
    - `send` RPC تحویل خروجی مستقیم برای ارسال‌های هدف‌گیری‌شده به کانال/حساب/thread خارج از chat runner است.
    - `logs.tail` انتهای گزارش فایل پیکربندی‌شده Gateway را با کنترل‌های cursor/limit و max-byte برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.config` payload پیکربندی موثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/Control UI تنظیم/پخش می‌کند.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk تولید می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهنده‌های fallback، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` موجودی قابل مشاهده ارائه‌دهنده‌های TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="رازها، پیکربندی، به‌روزرسانی، و wizard">
    - `secrets.reload` SecretRefهای فعال را دوباره resolve می‌کند و وضعیت راز runtime را فقط در صورت موفقیت کامل جایگزین می‌کند.
    - `secrets.resolve` انتساب‌های راز هدف‌گیری‌شده به فرمان را برای یک مجموعه فرمان/هدف مشخص resolve می‌کند.
    - `config.get` snapshot و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را merge می‌کند.
    - `config.apply` کل payload پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` payload schema پیکربندی زنده‌ای را که Control UI و ابزارهای CLI استفاده می‌کنند برمی‌گرداند: schema، `uiHints`، نسخه، و metadata تولید، شامل metadata مربوط به schemaهای Plugin + کانال وقتی runtime بتواند آن را load کند. schema شامل metadata فیلدهای `title` / `description` است که از همان برچسب‌ها و متن راهنمایی مشتق شده‌اند که UI استفاده می‌کند، از جمله objectهای تودرتو، wildcard، array-item، و شاخه‌های ترکیب `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد مطابق وجود داشته باشد.
    - `config.schema.lookup` یک payload lookup محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک node کم‌عمق schema، hint مطابق + `hintPath`، و خلاصه‌های فرزند بلافاصله برای drill-down در UI/CLI. nodeهای schema در lookup مستندات کاربرپسند و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/object، و flagهایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، به‌علاوه `hint` / `hintPath` مطابق را آشکار می‌کنند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد restart زمان‌بندی می‌کند. به‌روزرسانی‌های package-manager پس از جابه‌جایی package یک restart به‌روزرسانی بدون تعویق و بدون cooldown را اجبار می‌کنند تا فرایند قدیمی Gateway از tree جایگزین‌شده `dist` همچنان lazy-load نکند.
    - `update.status` آخرین sentinel ذخیره‌شده restart به‌روزرسانی را برمی‌گرداند، شامل نسخه در حال اجرای پس از restart وقتی در دسترس باشد.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` onboarding wizard را از طریق WS RPC در دسترس قرار می‌دهند.

  </Accordion>

  <Accordion title="helperهای عامل و workspace">
    - `agents.list` ورودی‌های عامل پیکربندی‌شده را برمی‌گرداند، شامل مدل موثر و metadata مربوط به runtime.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای عامل و اتصال workspace را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های bootstrap workspace را که برای یک عامل expose شده‌اند مدیریت می‌کنند.
    - `artifacts.list`، `artifacts.get`، و `artifacts.download` خلاصه‌ها و دانلودهای artifact مشتق‌شده از transcript را برای یک scope صریح `sessionKey`، `runId`، یا `taskId` expose می‌کنند. queryهای run و task، session مالک را در سمت سرور resolve می‌کنند و فقط رسانه transcript با provenance مطابق را برمی‌گردانند؛ منبع‌های URL ناامن یا محلی، به‌جای fetch سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `agent.identity.get` هویت موثر دستیار را برای یک عامل یا session برمی‌گرداند.
    - `agent.wait` منتظر پایان یک run می‌ماند و snapshot پایانی را وقتی در دسترس باشد برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل session">
    - `sessions.list` index فعلی session را برمی‌گرداند، شامل metadata ردیفی `agentRuntime` وقتی یک backend runtime عامل پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر session را برای کلاینت WS فعلی تغییر می‌دهند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد transcript/message را برای یک session تغییر می‌دهند.
    - `sessions.preview` پیش‌نمایش‌های محدود transcript را برای کلیدهای مشخص session برمی‌گرداند.
    - `sessions.describe` یک ردیف session Gateway را برای یک کلید دقیق session برمی‌گرداند.
    - `sessions.resolve` یک هدف session را resolve یا canonicalize می‌کند.
    - `sessions.create` یک ورودی session جدید ایجاد می‌کند.
    - `sessions.send` یک پیام را به یک session موجود ارسال می‌کند.
    - `sessions.steer` نوع interrupt-and-steer برای یک session فعال است.
    - `sessions.abort` کار فعال را برای یک session لغو می‌کند. فراخواننده می‌تواند `key` به‌علاوه `runId` اختیاری را ارسال کند، یا فقط `runId` را برای runهای فعالی ارسال کند که Gateway می‌تواند به یک session resolve کند.
    - `sessions.patch` metadata/overrideهای session را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌علاوه `agentRuntime` موثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداری session را انجام می‌دهند.
    - `sessions.get` کل ردیف session ذخیره‌شده را برمی‌گرداند.
    - اجرای chat همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌شکل نمایشی نرمال‌سازی شده است: tagهای directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، payloadهای XML مربوط به فراخوانی ابزار به صورت plain-text (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و blockهای کوتاه‌شده فراخوانی ابزار) و tokenهای کنترلی model نشت‌کرده ASCII/full-width حذف می‌شوند، ردیف‌های دستیار فقط silent-token مانند مقدار دقیق `NO_REPLY` / `no_reply` حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholder جایگزین شوند.

  </Accordion>

  <Accordion title="pairing دستگاه و tokenهای دستگاه">
    - `device.pair.list` دستگاه‌های paired در انتظار و تاییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای device-pairing را مدیریت می‌کنند.
    - `device.token.rotate` token یک دستگاه paired را در محدوده role تاییدشده و scope فراخواننده می‌چرخاند.
    - `device.token.revoke` token یک دستگاه paired را در محدوده role تاییدشده و scope فراخواننده revoke می‌کند.

  </Accordion>

  <Accordion title="pairing، invoke، و کارهای در انتظار Node">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` pairing نود و bootstrap verification را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت نودهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک نود paired را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک نود متصل forward می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای originating از نود را به Gateway برمی‌گرداند.
    - `node.canvas.capability.refresh` tokenهای canvas-capability محدود به scope را refresh می‌کند.
    - `node.pending.pull` و `node.pending.ack` APIهای queue نود متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کارهای در انتظار بادوام را برای نودهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های approval">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list`، و `exec.approval.resolve` درخواست‌های approval یک‌باره exec به‌علاوه lookup/replay approvalهای در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک approval در انتظار exec می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در صورت timeout مقدار `null`).
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای سیاست approval اجرای Gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست approval اجرای local نود را از طریق فرمان‌های relay نود مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision`، و `plugin.approval.resolve` جریان‌های approval تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills، و ابزارها">
    - Automation: `wake` تزریق متن wake فوری یا در Heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کارهای زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رایج رویداد

- `chat`: به‌روزرسانی‌های chat در UI مانند `chat.inject` و سایر رویدادهای chat که فقط مربوط به transcript هستند.
- `session.message` و `session.tool`: به‌روزرسانی‌های transcript/event-stream برای یک session مشترک‌شده.
- `sessions.changed`: index یا metadata session تغییر کرده است.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / liveness.
- `health`: به‌روزرسانی snapshot سلامت Gateway.
- `heartbeat`: به‌روزرسانی event stream مربوط به Heartbeat.
- `cron`: رویداد تغییر run/job مربوط به Cron.
- `shutdown`: اعلان shutdown مربوط به Gateway.
- `node.pair.requested` / `node.pair.resolved`: lifecycle pairing نود.
- `node.invoke.request`: پخش درخواست invoke نود.
- `device.pair.requested` / `device.pair.resolved`: lifecycle دستگاه paired.
- `voicewake.changed`: پیکربندی triggerهای wake-word تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: lifecycle approval اجرای exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: lifecycle approval مربوط به Plugin.

### متدهای helper برای Node

- نودها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی executableهای skill را برای بررسی‌های auto-allow دریافت کنند.

### متدهای helper برای operator

- اپراتورها می‌توانند برای دریافت موجودی فرمان‌های زمان اجرا برای یک عامل، `commands.list` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both`، در صورت وجود، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` نام فرمان بومی آگاه از ارائه‌دهنده را، در صورت وجود، حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی و در دسترس بودن فرمان بومی Plugin اثر می‌گذارد.
  - `includeArgs=false` فراداده سریال‌سازی‌شده آرگومان‌ها را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند برای دریافت کاتالوگ ابزار زمان اجرا برای یک عامل، `tools.catalog` (`operator.read`) را فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه آیا ابزار Plugin اختیاری است یا نه
- اپراتورها می‌توانند برای دریافت موجودی ابزار مؤثر در زمان اجرا برای یک نشست، `tools.effective` (`operator.read`) را فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا زمینه تحویل ارائه‌شده توسط فراخواننده، زمینه زمان اجرای مورد اعتماد را از نشست در سمت سرور استخراج می‌کند.
  - پاسخ محدود به نشست است و آنچه گفت‌وگوی فعال همین حالا می‌تواند استفاده کند را بازتاب می‌دهد، از جمله ابزارهای هسته، Plugin و کانال.
- اپراتورها می‌توانند برای فراخوانی یک ابزار در دسترس از همان مسیر سیاست Gateway که `/tools/invoke` استفاده می‌کند، `tools.invoke` (`operator.write`) را فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm` و `idempotencyKey` اختیاری هستند.
  - اگر هر دو `sessionKey` و `agentId` وجود داشته باشند، عامل نشست حل‌شده باید با `agentId` مطابقت داشته باشد.
  - پاسخ یک پاکت مخصوص SDK با فیلدهای `ok`، `toolName`، `output` اختیاری و `error` تایپ‌شده است. تأیید یا ردهای سیاستی، به‌جای دور زدن خط لوله سیاست ابزار Gateway، مقدار `ok:false` را در payload برمی‌گردانند.
- اپراتورها می‌توانند برای دریافت موجودی قابل مشاهده Skills برای یک عامل، `skills.status` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی و گزینه‌های نصب پاک‌سازی‌شده است، بدون اینکه مقدارهای خام محرمانه را افشا کند.
- اپراتورها می‌توانند برای فراداده کشف ClawHub، `skills.search` و `skills.detail` (`operator.read`) را فراخوانی کنند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه Skills را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت نصب‌کننده Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` یک اقدام اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug ردیابی‌شده یا همه نصب‌های ClawHub ردیابی‌شده را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقدارهای `skills.entries.<skillKey>` مانند `enabled`، `apiKey` و `env` را وصله می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ کاتالوگ مجاز است؛ در غیر این صورت پاسخ کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه انتخابگر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد. در غیر این صورت پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل بازمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این گزینه برای تشخیص و رابط‌های کشف استفاده کنید، نه انتخابگرهای معمول مدل.

## تأییدهای اجرا

- وقتی یک درخواست اجرا به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را broadcast می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` آن را حل می‌کنند (به دامنه `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید `systemRunPlan` را شامل شود (`argv`/`cwd`/`rawCommand`/فراداده نشست به شکل canonical). درخواست‌هایی که `systemRunPlan` ندارند رد می‌شوند.
- پس از تأیید، فراخوانی‌های فورواردشده `node.invoke system.run` همان `systemRunPlan` canonical را به‌عنوان زمینه معتبر فرمان/cwd/نشست دوباره استفاده می‌کنند.
- اگر فراخواننده بین آماده‌سازی و فوروارد نهایی تأییدشده `system.run`، `command`، `rawCommand`، `cwd`، `agentId` یا `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به payload تغییر‌یافته، اجرا را رد می‌کند.

## بازگشت جایگزین تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی، `deliver=true` را شامل شوند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: اهداف تحویل حل‌نشده یا فقط‌داخلی، `INVALID_REQUEST` را برمی‌گردانند.
- `bestEffortDeliver=true` اجازه می‌دهد وقتی هیچ مسیر قابل تحویل خارجی قابل حل نیست، به اجرای فقط در نشست بازگردد؛ برای مثال نشست‌های داخلی/وب‌چت یا پیکربندی‌های چندکاناله مبهم.

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/schema/protocol-schemas.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را می‌فرستند؛ سرور ناسازگاری‌ها را رد می‌کند.
- schemaها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقدارها در سراسر پروتکل v3 پایدار هستند و مبنای مورد انتظار برای کلاینت‌های شخص ثالث محسوب می‌شوند.

| ثابت                                      | پیش‌فرض                                               | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| مهلت درخواست (برای هر RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلت Preauth / چالش اتصال                 | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (پیکربندی/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| backoff اولیه اتصال مجدد                  | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه backoff اتصال مجدد                 | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp تلاش مجدد سریع پس از بستن device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت force-stop پیش از `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلت پیش‌فرض `stopAndWait()`              | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصله tick پیش‌فرض (قبل از `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن به‌دلیل مهلت tick                    | کد `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور مقدارهای مؤثر `policy.tickIntervalMs`، `policy.maxPayload` و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، به این مقدارها احترام بگذارند.

## احراز هویت

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا `gateway.auth.mode: "trusted-proxy"`
  غیر local loopback، بررسی احراز هویت اتصال را به‌جای `connect.params.auth.*`
  از سرآیندهای درخواست برآورده می‌کنند.
- ورودی خصوصی `gateway.auth.mode: "none"` احراز هویت اتصال با راز مشترک را
  کاملا رد می‌کند؛ این حالت را روی ورودی عمومی/غیرقابل‌اعتماد در دسترس قرار ندهید.
- پس از جفت‌سازی، Gateway یک **توکن دستگاه** محدود به نقش اتصال + محدوده‌های دسترسی
  صادر می‌کند. این مقدار در `hello-ok.auth.deviceToken` برگردانده می‌شود و باید
  برای اتصال‌های آینده توسط کلاینت پایدار ذخیره شود.
- کلاینت‌ها باید پس از هر اتصال موفق، `hello-ok.auth.deviceToken` اصلی را پایدار ذخیره کنند.
- اتصال دوباره با آن توکن دستگاه **ذخیره‌شده** باید مجموعه محدوده‌های دسترسی تاییدشده
  ذخیره‌شده برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت
  را که قبلا اعطا شده حفظ می‌کند و از فروکاست بی‌صدای اتصال‌های دوباره به یک
  محدوده ضمنی باریک‌تر فقط مخصوص مدیر جلوگیری می‌کند.
- سرهم‌سازی احراز هویت اتصال در سمت کلاینت (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و هرگاه تنظیم شده باشد همیشه ارسال می‌شود.
  - `auth.token` به‌ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس یک `deviceToken` صریح، سپس یک توکن ذخیره‌شده برای هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط زمانی فرستاده می‌شود که هیچ‌کدام از موارد بالا یک
    `auth.token` را تعیین نکرده باشند. یک توکن مشترک یا هر توکن دستگاه تعیین‌شده‌ای
    آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش دوباره یک‌باره
    `AUTH_TOKEN_MISMATCH` فقط به **نقاط پایانی قابل‌اعتماد** محدود است —
    loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی
    بدون پین‌کردن واجد شرایط نیست.
- ورودی‌های اضافی `hello-ok.auth.deviceTokens` توکن‌های تحویل bootstrap هستند.
  آن‌ها را فقط زمانی پایدار ذخیره کنید که اتصال از احراز هویت bootstrap روی یک انتقال
  قابل‌اعتماد مانند `wss://` یا loopback/جفت‌سازی محلی استفاده کرده باشد.
- اگر یک کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، همان مجموعه
  محدوده‌های دسترسی درخواست‌شده توسط فراخواننده مرجع باقی می‌ماند؛ محدوده‌های دسترسی
  کش‌شده فقط زمانی دوباره استفاده می‌شوند که کلاینت در حال استفاده دوباره از توکن
  ذخیره‌شده برای هر دستگاه باشد.
- توکن‌های دستگاه می‌توانند از طریق `device.token.rotate` و
  `device.token.revoke` چرخانده/لغو شوند (نیازمند محدوده دسترسی `operator.pairing`).
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. این دستور توکن bearer جایگزین
  را فقط برای فراخوانی‌های همان دستگاه که از قبل با همان توکن دستگاه احراز هویت شده‌اند
  بازتاب می‌دهد، تا کلاینت‌های فقط مبتنی بر توکن بتوانند جایگزین خود را پیش از اتصال دوباره
  پایدار ذخیره کنند. چرخش‌های مشترک/مدیر توکن bearer را بازتاب نمی‌دهند.
- صدور، چرخش و لغو توکن در مجموعه نقش تاییدشده ثبت‌شده در ورودی جفت‌سازی همان دستگاه
  محدود می‌ماند؛ جهش توکن نمی‌تواند نقش دستگاهی را گسترش دهد یا هدف بگیرد که تایید
  جفت‌سازی هرگز اعطا نکرده است.
- برای نشست‌های توکن دستگاه جفت‌شده، مدیریت دستگاه خودمحدود است مگر اینکه فراخواننده
  همچنین `operator.admin` داشته باشد: فراخواننده‌های غیرمدیر فقط می‌توانند ورودی
  دستگاه **خودشان** را حذف/لغو/چرخش کنند.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه محدوده‌های دسترسی
  توکن عملگر هدف را در برابر محدوده‌های دسترسی نشست فعلی فراخواننده بررسی می‌کنند.
  فراخواننده‌های غیرمدیر نمی‌توانند توکن عملگر گسترده‌تری از آنچه خودشان دارند را
  بچرخانند یا لغو کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنماهای بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (بولی)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های قابل‌اعتماد می‌توانند یک تلاش دوباره محدود با توکن کش‌شده برای هر دستگاه انجام دهند.
  - اگر آن تلاش دوباره شکست بخورد، کلاینت‌ها باید حلقه‌های اتصال دوباره خودکار را متوقف کنند و راهنمای اقدام عملگر را نمایش دهند.

## هویت دستگاه + جفت‌سازی

- Nodeها باید یک هویت دستگاه پایدار (`device.id`) داشته باشند که از اثرانگشت
  جفت‌کلید مشتق شده است.
- Gatewayها برای هر دستگاه + نقش توکن صادر می‌کنند.
- تاییدهای جفت‌سازی برای شناسه‌های دستگاه جدید لازم هستند، مگر اینکه تایید خودکار محلی
  فعال باشد.
- تایید خودکار جفت‌سازی حول اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر خوداتصال باریک backend/container-local برای جریان‌های
  کمکی قابل‌اعتماد راز مشترک دارد.
- اتصال‌های tailnet یا LAN روی همان میزبان همچنان برای جفت‌سازی remote تلقی می‌شوند و
  به تایید نیاز دارند.
- کلاینت‌های WS معمولا هنگام `connect` هویت `device` را شامل می‌کنند (عملگر +
  node). تنها استثناهای عملگر بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط localhost.
  - احراز هویت موفق عملگر Control UI با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass، کاهش شدید امنیت).
  - RPCهای backend مستقیم-loopback `gateway-client` که با توکن/رمز عبور مشترک
    gateway احراز هویت شده‌اند.
- همه اتصال‌ها باید nonce ارائه‌شده توسط سرور در `connect.challenge` را امضا کنند.

### عیب‌یابی مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنی                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده است (یا خالی فرستاده است). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce کهنه/اشتباه امضا کرده است.         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload امضا با payload نسخه ۲ مطابقت ندارد.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp امضاشده خارج از skew مجاز است.           |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثرانگشت کلید عمومی مطابقت ندارد.  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/متعارف‌سازی کلید عمومی شکست خورده است.       |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- payload نسخه ۲ را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- payload امضای ترجیحی `v3` است، که علاوه بر فیلدهای دستگاه/کلاینت/نقش/محدوده‌های دسترسی/توکن/nonce،
  `platform` و `deviceFamily` را هم متصل می‌کند.
- امضاهای قدیمی `v2` همچنان برای سازگاری پذیرفته می‌شوند، اما پین‌کردن فراداده
  دستگاه جفت‌شده همچنان سیاست فرمان را هنگام اتصال دوباره کنترل می‌کند.

## TLS + پین‌کردن

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثرانگشت گواهی gateway را پین کنند (به پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` مراجعه کنید).

## محدوده دسترسی

این پروتکل **API کامل gateway** را در دسترس قرار می‌دهد (وضعیت، کانال‌ها، مدل‌ها، چت،
عامل، نشست‌ها، nodeها، تاییدها، و غیره). سطح دقیق توسط طرح‌واره‌های TypeBox در
`src/gateway/protocol/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل پل](/fa/gateway/bridge-protocol)
- [راهنمای عملیاتی Gateway](/fa/gateway)
