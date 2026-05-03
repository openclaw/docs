---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS برای Gateway
    - اشکال‌زدایی عدم تطابق‌های پروتکل یا خطاهای اتصال
    - بازسازی طرح‌واره/مدل‌های پروتکل
summary: 'پروتکل WebSocket Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-05-03T11:36:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل WS مربوط به Gateway، **صفحه کنترل واحد + انتقال node** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط وب، برنامه macOS، نودهای iOS/Android، نودهای
بدون رابط) از طریق WebSocket متصل می‌شوند و در زمان
handshake، **role** + **scope** خود را اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود می‌شوند. پس از یک handshake موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. با فعال بودن عیب‌یابی،
  فریم‌های ورودی بیش از اندازه و بافرهای خروجی کند، پیش از اینکه gateway فریم
  متأثر را ببندد یا رها کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
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
یک خطای قابل تلاش مجدد `UNAVAILABLE` با `details.reason` برابر با
`"startup-sidecars"` و `retryAfterMs` برگرداند. کلاینت‌ها باید به‌جای نمایش آن به‌عنوان
شکست نهایی handshake، آن پاسخ را در چارچوب بودجه کلی اتصال خود دوباره تلاش کنند.

`server`، `features`، `snapshot` و `policy` همگی توسط schema
(`src/gateway/protocol/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
role/scopes مذاکره‌شده را گزارش می‌کند. `canvasHostUrl` اختیاری است.

وقتی هیچ device token صادر نمی‌شود، `hello-ok.auth` مجوزهای مذاکره‌شده را بدون
فیلدهای token گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend هم‌فرآیند مورد اعتماد (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصال‌های loopback مستقیم، وقتی با token/password مشترک gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای صفحه کنترل داخلی رزرو شده است و مانع می‌شود baselineهای قدیمی pairing مربوط به CLI/device کار محلی backend مانند به‌روزرسانی‌های نشست subagent را مسدود کنند. کلاینت‌های راه‌دور،
کلاینت‌های با منشأ مرورگر، کلاینت‌های node، و کلاینت‌های صریح device-token/device-identity
همچنان از بررسی‌های عادی pairing و ارتقای scope استفاده می‌کنند.

وقتی یک device token صادر می‌شود، `hello-ok` همچنین شامل این موارد است:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

در زمان تحویل bootstrap مورد اعتماد، `hello-ok.auth` ممکن است ورودی‌های role محدود اضافی
را نیز در `deviceTokens` شامل شود:

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

برای جریان bootstrap داخلی node/operator، token اصلی node با
`scopes: []` باقی می‌ماند و هر token operator تحویل‌شده به allowlist مربوط به operator
در bootstrap محدود می‌ماند (`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`). بررسی‌های scope در bootstrap همچنان
با پیشوند role انجام می‌شوند: ورودی‌های operator فقط درخواست‌های operator را برآورده می‌کنند،
و roleهای غیر operator همچنان به scopeهایی زیر پیشوند role خودشان نیاز دارند.

### نمونه node

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

## نقش‌ها + scopeها

برای مدل کامل scopeهای operator، بررسی‌های زمان تأیید، و معناشناسی shared-secret،
[scopeهای operator](/fa/gateway/operator-scopes) را ببینید.

### نقش‌ها

- `operator` = کلاینت صفحه کنترل (CLI/UI/automation).
- `node` = میزبان capability (camera/screen/canvas/system.run).

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

متدهای RPC مربوط به gateway که توسط Plugin ثبت شده‌اند ممکن است scope operator خودشان را درخواست کنند، اما
پیشوندهای رزروشده ادمین هسته (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` resolve می‌شوند.

scope متد فقط نخستین gate است. برخی slash commandهایی که از طریق
`chat.send` می‌رسند، بررسی‌های سخت‌گیرانه‌تر در سطح command را نیز اعمال می‌کنند. برای نمونه، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` نیز افزون بر scope پایه متد، یک بررسی scope اضافی در زمان تأیید دارد:

- درخواست‌های بدون command: `operator.pairing`
- درخواست‌های دارای commandهای node غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare` یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

نودها claimهای capability را در زمان connect اعلام می‌کنند:

- `caps`: دسته‌های capability سطح بالا.
- `commands`: allowlist command برای invoke.
- `permissions`: toggleهای ریزدانه (مانند `screen.record`، `camera.capture`).

Gateway با این موارد به‌عنوان **claim** رفتار می‌کند و allowlistهای سمت سرور را اعمال می‌کند.

## Presence

- `system-presence` ورودی‌هایی را برمی‌گرداند که با device identity کلیدگذاری شده‌اند.
- ورودی‌های Presence شامل `deviceId`، `roles` و `scopes` هستند تا UIها بتوانند برای هر device یک ردیف واحد نشان دهند
  حتی وقتی هم به‌عنوان **operator** و هم به‌عنوان **node** متصل می‌شود.
- `node.list` فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` را شامل می‌شود. نودهای متصل
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ نودهای paired همچنین می‌توانند
  وقتی یک رویداد node مورد اعتماد metadata مربوط به pairing آن‌ها را به‌روزرسانی می‌کند، presence پس‌زمینه پایدار را گزارش کنند.

### رویداد زنده بودن پس‌زمینه node

نودها ممکن است `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک node paired
در زمان wake پس‌زمینه زنده بوده است، بدون اینکه به‌عنوان متصل علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual` یا `connect`. رشته‌های trigger ناشناخته پیش از persistence توسط gateway به
`background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های authenticated node
device پایدار است؛ نشست‌های بدون device یا unpaired مقدار `handled: false` برمی‌گردانند.

Gatewayهای موفق یک نتیجه ساختاریافته برمی‌گردانند:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gatewayهای قدیمی‌تر ممکن است همچنان برای `node.event` مقدار `{ "ok": true }` برگردانند؛ کلاینت‌ها باید آن را
یک RPC تأییدشده بدانند، نه persistence پایدار presence.

## تعیین scope برای رویدادهای broadcast

رویدادهای broadcast در WebSocket که سرور push می‌کند، scope-gated هستند تا نشست‌های pairing-scoped یا فقط node محتوای نشست را به‌صورت passive دریافت نکنند.

- **فریم‌های chat، agent و tool-result** (از جمله رویدادهای streamed `agent` و نتایج tool call) حداقل به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را به‌طور کامل نادیده می‌گیرند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به اینکه Plugin چگونه آن‌ها را ثبت کرده باشد، به `operator.write` یا `operator.admin` محدود می‌شوند.
- **رویدادهای status و transport** (`heartbeat`، `presence`، `tick`، چرخه عمر connect/disconnect و غیره) بدون محدودیت باقی می‌مانند تا سلامت transport برای هر نشست authenticated قابل مشاهده بماند.
- **خانواده‌های ناشناخته رویداد broadcast** به‌صورت پیش‌فرض scope-gated هستند (fail-closed)، مگر اینکه یک handler ثبت‌شده آن‌ها را صراحتاً آزادتر کند.

هر اتصال کلاینت شماره توالی per-client خودش را نگه می‌دارد تا broadcastها حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوت scope-filtered از جریان رویداد را می‌بینند، ترتیب یکنواخت را روی همان socket حفظ کنند.

## خانواده‌های رایج متد RPC

سطح عمومی WS گسترده‌تر از نمونه‌های handshake/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست محافظه‌کارانه
برای discovery است که از `src/gateway/server-methods-list.ts` به‌علاوه exportهای متد
Plugin/channel بارگذاری‌شده ساخته می‌شود. با آن به‌عنوان feature discovery رفتار کنید، نه enumeration کامل
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` snapshot سلامت gateway را که cached یا تازه probe شده است برمی‌گرداند.
    - `diagnostics.stability` recorder پایداری diagnostic محدود اخیر را برمی‌گرداند. این مورد metadata عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های byte، خوانش‌های memory، وضعیت queue/session، نام‌های channel/plugin و شناسه‌های session را نگه می‌دارد. متن chat، بدنه‌های webhook، خروجی‌های tool، بدنه خام request یا response، tokenها، cookieها یا مقادیر secret را نگه نمی‌دارد. scope خواندن operator لازم است.
    - `status` خلاصه gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های operator دارای scope ادمین گنجانده می‌شوند.
    - `gateway.identity.get` device identity مربوط به gateway را که در جریان‌های relay و pairing استفاده می‌شود برمی‌گرداند.
    - `system-presence` snapshot فعلی presence برای deviceهای operator/node متصل را برمی‌گرداند.
    - `system-event` یک system event را append می‌کند و می‌تواند context مربوط به presence را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` آخرین رویداد heartbeat persist شده را برمی‌گرداند.
    - `set-heartbeats` پردازش heartbeat را روی gateway toggle می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و استفاده">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخاب‌گر، `{ "view": "configured" }` را ارسال کنید (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`)، یا برای کاتالوگ کامل `{ "view": "all" }` را ارسال کنید.
    - `usage.status` خلاصه‌های پنجره‌های استفاده/سهمیه باقی‌مانده ارائه‌دهنده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیعی استفاده هزینه را برای یک بازه تاریخی برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding کش‌شده را برای workspace عامل پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخواننده صراحتا یک پینگ زنده به ارائه‌دهنده embedding می‌خواهد، `{ "probe": true }` یا `{ "deep": true }` را ارسال کنید.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از مهار REM را برای کلاینت‌های control-plane راه دور برمی‌گرداند. این می‌تواند شامل مسیرهای workspace، قطعه‌های حافظه، markdown مستند رندرشده، و نامزدهای ارتقای عمیق باشد، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های استفاده برای هر نشست را برمی‌گرداند.
    - `sessions.usage.timeseries` استفاده سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های لاگ استفاده را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص خارج می‌شود، در جایی که کانال از خروج پشتیبانی می‌کند.
    - `web.login.start` یک جریان ورود QR/وب را برای ارائه‌دهنده کانال وب فعلی که قابلیت QR دارد شروع می‌کند.
    - `web.login.wait` منتظر تکمیل همان جریان ورود QR/وب می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک پوش APNs آزمایشی به یک Node ثبت‌شده iOS می‌فرستد.
    - `voicewake.get` محرک‌های wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` محرک‌های wake-word را به‌روزرسانی می‌کند و تغییر را پخش می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و لاگ‌ها">
    - `send` RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گیری‌شده به کانال/حساب/رشته خارج از chat runner است.
    - `logs.tail` انتهای فایل‌لاگ Gateway پیکربندی‌شده را با کنترل‌های مکان‌نما/محدودیت و حداکثر بایت برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.config` payload موثر پیکربندی Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/رابط کاربری کنترل تنظیم/پخش می‌کند.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk می‌سازد.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهندگان جایگزین، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` فهرست موجودی قابل مشاهده ارائه‌دهندگان TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و راه‌انداز">
    - `secrets.reload` SecretRefهای فعال را دوباره resolve می‌کند و فقط در صورت موفقیت کامل، وضعیت secret زمان اجرا را تعویض می‌کند.
    - `secrets.resolve` انتساب‌های secret هدف‌گیری‌شده به فرمان را برای یک مجموعه مشخص فرمان/هدف resolve می‌کند.
    - `config.get` اسنپ‌شات و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را merge می‌کند.
    - `config.apply` payload کامل پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` payload schema زنده پیکربندی را که توسط رابط کاربری کنترل و ابزارهای CLI استفاده می‌شود برمی‌گرداند: schema، `uiHints`، نسخه، و فراداده تولید، شامل فراداده schema مربوط به Plugin + کانال وقتی زمان اجرا بتواند آن را بارگذاری کند. schema شامل فراداده فیلد `title` / `description` است که از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط رابط کاربری مشتق شده‌اند، از جمله شاخه‌های ترکیب object تودرتو، wildcard، array-item، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد مطابق وجود داشته باشد.
    - `config.schema.lookup` یک payload جست‌وجوی محدود به مسیر را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک node سطحی از schema، hint مطابق + `hintPath`، و خلاصه‌های فرزند فوری برای drill-down در رابط کاربری/CLI. nodeهای schema در lookup مستندات کاربرپسند و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/object، و flagهایی مانند `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، به‌علاوه `hint` / `hintPath` مطابق را نمایش می‌دهند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد، یک راه‌اندازی مجدد زمان‌بندی می‌کند. به‌روزرسانی‌های package-manager پس از تعویض بسته، یک راه‌اندازی مجدد به‌روزرسانی بدون تعویق و بدون cooldown را اجبار می‌کنند تا فرایند قدیمی Gateway از درخت `dist` جایگزین‌شده lazy-load نکند.
    - `update.status` آخرین sentinel کش‌شده راه‌اندازی مجدد به‌روزرسانی را برمی‌گرداند، از جمله نسخه در حال اجرای پس از راه‌اندازی مجدد وقتی در دسترس باشد.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` راه‌انداز onboarding را از طریق WS RPC در دسترس قرار می‌دهند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های عامل و workspace">
    - `agents.list` ورودی‌های عامل پیکربندی‌شده را برمی‌گرداند، شامل مدل موثر و فراداده زمان اجرا.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای عامل و سیم‌کشی workspace را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های bootstrap workspace را که برای یک عامل در دسترس هستند مدیریت می‌کنند.
    - `artifacts.list`، `artifacts.get`، و `artifacts.download` خلاصه‌ها و دانلودهای artifact مشتق‌شده از رونوشت را برای یک scope صریح `sessionKey`، `runId`، یا `taskId` در دسترس قرار می‌دهند. پرس‌وجوهای run و task نشست مالک را در سمت سرور resolve می‌کنند و فقط رسانه رونوشت با provenance مطابق را برمی‌گردانند؛ منابع URL ناامن یا محلی، به جای واکشی سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `agent.identity.get` هویت موثر دستیار را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک run می‌ماند و در صورت دسترس بودن، اسنپ‌شات پایانی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` نمایه نشست فعلی را برمی‌گرداند، شامل فراداده `agentRuntime` برای هر ردیف وقتی backend زمان اجرای عامل پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر نشست را برای کلاینت WS فعلی تغییر می‌دهند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد رونوشت/پیام را برای یک نشست تغییر می‌دهند.
    - `sessions.preview` پیش‌نمایش‌های محدود رونوشت را برای کلیدهای مشخص نشست برمی‌گرداند.
    - `sessions.describe` یک ردیف نشست Gateway را برای یک کلید دقیق نشست برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را resolve یا canonicalize می‌کند.
    - `sessions.create` یک ورودی نشست جدید ایجاد می‌کند.
    - `sessions.send` یک پیام را به یک نشست موجود می‌فرستد.
    - `sessions.steer` گونه interrupt-and-steer برای یک نشست فعال است.
    - `sessions.abort` کار فعال یک نشست را abort می‌کند. فراخواننده می‌تواند `key` به‌علاوه `runId` اختیاری را ارسال کند، یا برای runهای فعالی که Gateway می‌تواند به یک نشست resolve کند، فقط `runId` را ارسال کند.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌علاوه `agentRuntime` موثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداشت نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل ذخیره‌شده نشست را برمی‌گرداند.
    - اجرای چت همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های رابط کاربری به‌صورت نمایشی نرمال‌سازی می‌شود: تگ‌های directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار در متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های فراخوانی ابزار کوتاه‌شده) و tokenهای کنترلی مدل ASCII/تمام‌عرض نشت‌کرده حذف می‌شوند، ردیف‌های assistant با token صرفا خاموش مانند `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و ردیف‌های بیش از اندازه می‌توانند با placeholderها جایگزین شوند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و tokenهای دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شده در انتظار و تاییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` یک token دستگاه جفت‌شده را در محدوده‌های نقش تاییدشده و scope فراخواننده می‌چرخاند.
    - `device.token.revoke` یک token دستگاه جفت‌شده را در محدوده‌های نقش تاییدشده و scope فراخواننده باطل می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، invoke، و کار در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` جفت‌سازی Node و اعتبارسنجی bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک فرمان را به یک Node متصل forward می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای برخاسته از Node را به gateway برمی‌گرداند.
    - `node.canvas.capability.refresh` tokenهای scoped canvas-capability را تازه‌سازی می‌کند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کار در انتظار بادوام را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تایید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list`، و `exec.approval.resolve` درخواست‌های تایید exec یک‌باره به‌علاوه lookup/replay تایید در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تایید exec در انتظار می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در timeout، `null`).
    - `exec.approvals.get` و `exec.approvals.set` اسنپ‌شات‌های سیاست تایید exec در gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تایید exec محلی Node را از طریق فرمان‌های relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision`، و `plugin.approval.resolve` جریان‌های تایید تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills، و ابزارها">
    - اتوماسیون: `wake` یک تزریق فوری متن wake یا در Heartbeat بعدی را زمان‌بندی می‌کند؛ `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کار زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رایج رویداد

- `chat`: به‌روزرسانی‌های چت رابط کاربری مانند `chat.inject` و دیگر رویدادهای فقط رونوشت چت.
- `session.message` و `session.tool`: به‌روزرسانی‌های رونوشت/جریان رویداد برای یک نشست مشترک‌شده.
- `sessions.changed`: نمایه نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های اسنپ‌شات حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / زنده‌بودن.
- `health`: به‌روزرسانی اسنپ‌شات سلامت gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر job/run کرون.
- `shutdown`: اعلان خاموشی gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه عمر جفت‌سازی Node.
- `node.invoke.request`: پخش درخواست invoke Node.
- `device.pair.requested` / `device.pair.resolved`: چرخه عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی محرک wake-word تغییر کرد.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه عمر تایید exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه عمر تایید Plugin.

### روش‌های کمکی Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی executableهای skill را برای بررسی‌های auto-allow دریافت کنند.

### روش‌های کمکی operator

- اپراتورها می‌توانند `commands.list` (`operator.read`) را برای دریافت فهرست فرمان‌های زمان اجرا برای یک عامل فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both`، در صورت وجود، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` در صورت وجود، نام فرمان بومی آگاه از ارائه‌دهنده را حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی و دردسترس‌بودن فرمان‌های Plugin بومی اثر می‌گذارد.
  - `includeArgs=false` فراداده سریال‌شده آرگومان‌ها را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند `tools.catalog` (`operator.read`) را برای دریافت کاتالوگ ابزارهای زمان اجرا برای یک عامل فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه آیا ابزار Plugin اختیاری است یا نه
- اپراتورها می‌توانند `tools.effective` (`operator.read`) را برای دریافت فهرست ابزارهای مؤثر در زمان اجرا برای یک نشست فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا زمینه تحویل ارائه‌شده توسط فراخوان، زمینه معتمد زمان اجرا را از نشست در سمت سرور استخراج می‌کند.
  - پاسخ در محدوده نشست است و آنچه گفت‌وگوی فعال همین حالا می‌تواند استفاده کند را بازتاب می‌دهد، از جمله ابزارهای هسته، Plugin و کانال.
- اپراتورها می‌توانند `tools.invoke` (`operator.write`) را برای فراخوانی یک ابزار دردسترس از همان مسیر سیاست Gateway مانند `/tools/invoke` فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm` و `idempotencyKey` اختیاری هستند.
  - اگر هر دو `sessionKey` و `agentId` وجود داشته باشند، عامل نشست حل‌شده باید با `agentId` مطابقت داشته باشد.
  - پاسخ یک پوشش روبه‌روی SDK با فیلدهای `ok`، `toolName`، `output` اختیاری و `error` نوع‌دار است. تأیید یا ردهای سیاستی، به‌جای دورزدن خط لوله سیاست ابزار Gateway، مقدار `ok:false` را در بار پاسخ برمی‌گردانند.
- اپراتورها می‌توانند `skills.status` (`operator.read`) را برای دریافت فهرست Skills قابل مشاهده برای یک عامل فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - پاسخ شامل واجدشرایط‌بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی و گزینه‌های نصب پاک‌سازی‌شده بدون افشای مقادیر خام محرمانه است.
- اپراتورها می‌توانند `skills.search` و `skills.detail` (`operator.read`) را برای فراداده کشف ClawHub فراخوانی کنند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه Skills را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت نصب‌کننده Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` یک کنش اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug رهگیری‌شده یا همه نصب‌های ClawHub رهگیری‌شده را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`، `apiKey` و `env` را وصله می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است؛ در غیر این صورت پاسخ کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان غالب است. در غیر این صورت پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دورزدن `agents.defaults.models`. از این برای عیب‌یابی و رابط‌های کشف استفاده کنید، نه انتخاب‌گرهای معمول مدل.

## تأییدهای اجرای دستور

- وقتی یک درخواست اجرا به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` آن را حل می‌کنند (به محدوده `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده نشستِ کانونی). درخواست‌های فاقد `systemRunPlan` رد می‌شوند.
- پس از تأیید، فراخوانی‌های هدایت‌شده `node.invoke system.run` همان `systemRunPlan` کانونی را به‌عنوان زمینه معتبر فرمان/cwd/نشست دوباره استفاده می‌کنند.
- اگر یک فراخوان `command`، `rawCommand`، `cwd`، `agentId` یا `sessionKey` را بین آماده‌سازی و هدایت نهایی تأییدشده `system.run` تغییر دهد، Gateway به‌جای اعتماد به بار تغییر‌یافته، اجرا را رد می‌کند.

## عقب‌نشینی تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی، `deliver=true` را شامل شوند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: اهداف تحویل حل‌نشده یا فقط داخلی، `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی‌ای قابل حل نباشد، امکان عقب‌نشینی به اجرای فقط در نشست را فراهم می‌کند (برای مثال نشست‌های داخلی/وب‌چت یا پیکربندی‌های چندکاناله مبهم).

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/schema/protocol-schemas.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را می‌فرستند؛ سرور عدم تطابق‌ها را رد می‌کند.
- طرح‌واره‌ها و مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در protocol v3 پایدار هستند و خط مبنای مورد انتظار برای کلاینت‌های شخص ثالث‌اند.

| ثابت                                      | پیش‌فرض                                               | منبع                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| زمان‌پایان درخواست (برای هر RPC)          | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| زمان‌پایان پیش‌احراز / چالش اتصال         | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (پیکربندی/محیط می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| وقفه اولیه تلاش مجدد اتصال                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه وقفه تلاش مجدد اتصال               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| محدودسازی تلاش سریع پس از بسته‌شدن توکن دستگاه | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت توقف اجباری پیش از `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| زمان‌پایان پیش‌فرض `stopAndWait()`        | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| فاصله تیک پیش‌فرض (پیش از `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن هنگام زمان‌پایان تیک                 | کد `4000` وقتی سکوت از `tickIntervalMs * 2` فراتر رود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور مقادیر مؤثر `policy.tickIntervalMs`، `policy.maxPayload` و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از دست‌دهی، از آن مقادیر پیروی کنند.

## احراز هویت

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند.
