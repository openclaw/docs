---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS برای Gateway
    - اشکال‌زدایی عدم‌تطابق‌های پروتکل یا شکست‌های اتصال
    - بازسازی طرح‌واره‌ها/مدل‌های پروتکل
summary: 'پروتکل وب‌سوکت Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-04-30T00:06:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

پروتکل WS Gateway **تنها صفحه کنترل + انتقال Node** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط وب، اپ macOS، Nodeهای iOS/Android، Nodeهای
بدون رابط) از طریق WebSocket وصل می‌شوند و در زمان دست‌دهی، **نقش** + **محدوده** خود را
اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود هستند. پس از دست‌دهی موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. با فعال بودن عیب‌یابی،
  فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه gateway فریم
  متاثر را ببندد یا حذف کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطح‌ها، و کدهای دلیل امن را نگه می‌دارند. آن‌ها بدنه پیام،
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
یک خطای قابل‌تلاش‌مجدد `UNAVAILABLE` برگرداند که `details.reason` آن روی
`"startup-sidecars"` و `retryAfterMs` تنظیم شده است. کلاینت‌ها باید این پاسخ را
در چارچوب بودجه کلی اتصال خود دوباره امتحان کنند، نه اینکه آن را به‌عنوان شکست نهایی
دست‌دهی نمایش دهند.

`server`، `features`، `snapshot`، و `policy` همگی توسط schema
(`src/gateway/protocol/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/محدوده‌های مذاکره‌شده را گزارش می‌کند. `canvasHostUrl` اختیاری است.

وقتی هیچ توکن دستگاهی صادر نشده باشد، `hello-ok.auth` مجوزهای مذاکره‌شده را بدون
فیلدهای توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های backend مورداعتماد هم‌فرایند (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند روی اتصال‌های مستقیم loopback، وقتی با توکن/گذرواژه
مشترک gateway احراز هویت می‌کنند، `device` را حذف کنند. این مسیر برای RPCهای داخلی
صفحه کنترل رزرو شده است و مانع از آن می‌شود که baselineهای جفت‌سازی قدیمی CLI/دستگاه،
کار backend محلی مانند به‌روزرسانی‌های نشست subagent را مسدود کنند. کلاینت‌های دوردست،
کلاینت‌های با مبدا مرورگر، کلاینت‌های Node، و کلاینت‌های صریح device-token/device-identity
همچنان از بررسی‌های عادی جفت‌سازی و ارتقای محدوده استفاده می‌کنند.

وقتی یک توکن دستگاه صادر شود، `hello-ok` همچنین شامل این موارد است:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

در جریان تحویل bootstrap مورداعتماد، `hello-ok.auth` ممکن است ورودی‌های نقش محدودشده
اضافی را نیز در `deviceTokens` شامل شود:

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

برای جریان bootstrap داخلی Node/operator، توکن اصلی Node با
`scopes: []` باقی می‌ماند و هر توکن operator تحویل‌شده به allowlist اپراتور bootstrap
(`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`) محدود می‌ماند. بررسی‌های محدوده bootstrap
همچنان پیشوند نقش را رعایت می‌کنند: ورودی‌های operator فقط درخواست‌های operator را
برآورده می‌کنند، و نقش‌های غیر-operator همچنان به محدوده‌هایی زیر پیشوند نقش خودشان نیاز دارند.

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

## نقش‌ها + محدوده‌ها

### نقش‌ها

- `operator` = کلاینت صفحه کنترل (CLI/UI/اتوماسیون).
- `node` = میزبان قابلیت (camera/screen/canvas/system.run).

### محدوده‌ها (operator)

محدوده‌های رایج:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` با `includeSecrets: true` به `operator.talk.secrets`
(یا `operator.admin`) نیاز دارد.

متدهای RPC gateway ثبت‌شده توسط Plugin ممکن است محدوده operator خودشان را درخواست کنند، اما
پیشوندهای admin هسته رزرو شده (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` resolve می‌شوند.

محدوده متد فقط نخستین دروازه است. برخی فرمان‌های slash که از طریق
`chat.send` رسیده‌اند، بررسی‌های سخت‌گیرانه‌تر در سطح فرمان را نیز اعمال می‌کنند. برای نمونه، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` علاوه بر محدوده پایه متد، یک بررسی محدوده اضافی در زمان تایید نیز دارد:

- درخواست‌های بدون فرمان: `operator.pairing`
- درخواست‌های دارای فرمان‌های Node غیر-exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare`، یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### قابلیت‌ها/فرمان‌ها/مجوزها (Node)

Nodeها ادعاهای قابلیت را در زمان اتصال اعلام می‌کنند:

- `caps`: دسته‌های قابلیت سطح بالا.
- `commands`: allowlist فرمان برای invoke.
- `permissions`: سوییچ‌های جزئی (مثلا `screen.record`، `camera.capture`).

Gateway این موارد را به‌عنوان **ادعا** در نظر می‌گیرد و allowlistهای سمت سرور را اعمال می‌کند.

## حضور

- `system-presence` ورودی‌هایی را برمی‌گرداند که بر اساس هویت دستگاه کلیدگذاری شده‌اند.
- ورودی‌های حضور شامل `deviceId`، `roles`، و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف واحد نشان دهند
  حتی وقتی هم به‌عنوان **operator** و هم **node** وصل می‌شود.
- `node.list` فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` را شامل می‌شود. Nodeهای متصل،
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ Nodeهای جفت‌شده همچنین می‌توانند
  وقتی یک رویداد Node مورداعتماد metadata جفت‌سازی آن‌ها را به‌روز می‌کند، حضور پس‌زمینه پایدار را گزارش کنند.

### رویداد زنده بودن پس‌زمینه Node

Nodeها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک Node جفت‌شده
در طول بیدار شدن پس‌زمینه زنده بوده، بدون اینکه به‌عنوان متصل علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual`، یا `connect`. رشته‌های trigger ناشناخته پیش از پایداری‌سازی توسط gateway به
`background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های دستگاه Node احرازهویت‌شده
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
یک RPC تاییدشده بدانند، نه پایداری‌سازی حضور بادوام.

## محدوده‌گذاری رویدادهای broadcast

رویدادهای broadcast WebSocket که از سرور push می‌شوند، با محدوده کنترل می‌شوند تا نشست‌های دارای محدوده جفت‌سازی یا فقط-Node، محتوای نشست را به‌صورت منفعل دریافت نکنند.

- **فریم‌های chat، agent، و نتیجه ابزار** (از جمله رویدادهای streamشده `agent` و نتایج فراخوانی ابزار) دست‌کم به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را کاملا رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به اینکه Plugin آن‌ها را چگونه ثبت کرده باشد، با `operator.write` یا `operator.admin` کنترل می‌شوند.
- **رویدادهای وضعیت و انتقال** (`heartbeat`، `presence`، `tick`، چرخه حیات connect/disconnect، و غیره) بدون محدودیت می‌مانند تا سلامت انتقال برای هر نشست احرازهویت‌شده قابل مشاهده باشد.
- **خانواده‌های ناشناخته رویداد broadcast** به‌صورت پیش‌فرض با محدوده کنترل می‌شوند (fail-closed)، مگر اینکه یک handler ثبت‌شده صریحا آن‌ها را آزادتر کند.

هر اتصال کلاینت شماره توالی مختص همان کلاینت را نگه می‌دارد تا broadcastها روی آن socket ترتیب یکنواخت را حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوتی از stream رویداد را پس از فیلتر محدوده می‌بینند.

## خانواده‌های رایج متد RPC

سطح عمومی WS گسترده‌تر از نمونه‌های handshake/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست discovery محافظه‌کارانه است که از
`src/gateway/server-methods-list.ts` به‌علاوه exportهای متد Plugin/channel بارگذاری‌شده ساخته می‌شود. با آن به‌عنوان feature discovery رفتار کنید، نه یک فهرست کامل
از `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` snapshot سلامت gateway کش‌شده یا تازه probeشده را برمی‌گرداند.
    - `diagnostics.stability` رکوردر پایداری عیب‌یابی محدود اخیر را برمی‌گرداند. این رکوردر metadata عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه بایت، خوانش‌های حافظه، وضعیت صف/نشست، نام‌های channel/plugin، و شناسه‌های نشست را نگه می‌دارد. متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، یا مقادیر محرمانه را نگه نمی‌دارد. محدوده خواندن operator لازم است.
    - `status` خلاصه gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های operator دارای محدوده admin گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه gateway را که توسط جریان‌های relay و جفت‌سازی استفاده می‌شود، برمی‌گرداند.
    - `system-presence` snapshot حضور فعلی دستگاه‌های operator/node متصل را برمی‌گرداند.
    - `system-event` یک رویداد سیستم را اضافه می‌کند و می‌تواند زمینه حضور را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` آخرین رویداد heartbeat پایدارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش heartbeat را روی gateway روشن/خاموش می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و استفاده">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده با اندازه مناسب انتخاب‌گر، `{ "view": "configured" }` را ارسال کنید (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`)، یا برای کاتالوگ کامل `{ "view": "all" }` را ارسال کنید.
    - `usage.status` خلاصه‌های پنجره‌های استفاده/سهمیه باقی‌مانده ارائه‌دهنده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیعی هزینه استفاده را برای یک بازه تاریخی برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding کش‌شده را برای workspace عامل پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخواننده صراحتا ping زنده ارائه‌دهنده embedding می‌خواهد، `{ "probe": true }` یا `{ "deep": true }` را ارسال کنید.
    - `doctor.memory.remHarness` یک پیش‌نمایش REM harness محدود و فقط‌خواندنی برای کلاینت‌های control-plane راه دور برمی‌گرداند. می‌تواند شامل مسیرهای workspace، قطعه‌های حافظه، markdown زمینه‌مند رندرشده، و نامزدهای ارتقای عمیق باشد، بنابراین فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های استفاده به‌ازای هر نشست را برمی‌گرداند.
    - `sessions.usage.timeseries` استفاده سری زمانی را برای یک نشست برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های گزارش استفاده را برای یک نشست برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه‌های وضعیت کانال/Plugin داخلی + بسته‌شده را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، در جایی که کانال از خروج پشتیبانی می‌کند، خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/web را برای ارائه‌دهنده کانال وب فعلیِ دارای قابلیت QR شروع می‌کند.
    - `web.login.wait` منتظر تکمیل آن جریان ورود QR/web می‌ماند و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک push آزمایشی APNs به یک Node ثبت‌شده iOS ارسال می‌کند.
    - `voicewake.get` تریگرهای wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` تریگرهای wake-word را به‌روزرسانی و تغییر را broadcast می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و گزارش‌ها">
    - `send` همان RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گیری‌شده به کانال/حساب/thread خارج از chat runner است.
    - `logs.tail` tail گزارش فایل Gateway پیکربندی‌شده را با کنترل‌های cursor/limit و max-byte برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.config` payload پیکربندی موثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.mode` وضعیت حالت فعلی Talk را برای کلاینت‌های WebChat/Control UI تنظیم/broadcast می‌کند.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk سنتز می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهنده‌های fallback، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` inventory قابل مشاهده ارائه‌دهنده TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را toggle می‌کنند.
    - `tts.setProvider` ارائه‌دهنده TTS ترجیحی را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و جادوگر">
    - `secrets.reload` SecretRefهای فعال را دوباره resolve می‌کند و فقط در صورت موفقیت کامل، وضعیت secret زمان اجرا را تعویض می‌کند.
    - `secrets.resolve` انتساب‌های secret هدف‌گیری‌شده به command را برای یک مجموعه command/target مشخص resolve می‌کند.
    - `config.get` snapshot و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را merge می‌کند.
    - `config.apply` payload کامل پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` payload زنده schema پیکربندی را که توسط Control UI و ابزارهای CLI استفاده می‌شود برمی‌گرداند: schema، `uiHints`، نسخه، و فراداده تولید، شامل فراداده schema مربوط به Plugin + کانال وقتی runtime بتواند آن را load کند. schema شامل فراداده فیلدهای `title` / `description` است که از همان برچسب‌ها و متن راهنمای استفاده‌شده توسط UI مشتق شده‌اند، از جمله شاخه‌های ترکیب شیء تودرتو، wildcard، آیتم آرایه، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد متناظر وجود داشته باشد.
    - `config.schema.lookup` یک payload lookup محدود به مسیر برای یک مسیر پیکربندی برمی‌گرداند: مسیر normalized، یک node کم‌عمق schema، hint تطبیق‌یافته + `hintPath`، و خلاصه‌های فرزند فوری برای drill-down در UI/CLI. nodeهای schema در lookup مستندات کاربرمحور و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، محدودیت‌های عددی/رشته‌ای/آرایه‌ای/شیء، و flagهایی مثل `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را نگه می‌دارند. خلاصه‌های فرزند `key`، `path` normalized، `type`، `required`، `hasChildren`، به‌علاوه `hint` / `hintPath` تطبیق‌یافته را نمایش می‌دهند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد، یک restart زمان‌بندی می‌کند.
    - `update.status` آخرین sentinel کش‌شده restart به‌روزرسانی را، شامل نسخه در حال اجرای پس از restart در صورت موجود بودن، برمی‌گرداند.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel` جادوگر onboarding را از طریق WS RPC در دسترس قرار می‌دهند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های عامل و workspace">
    - `agents.list` entryهای عامل پیکربندی‌شده، شامل مدل موثر و فراداده runtime را برمی‌گرداند.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای عامل و سیم‌کشی workspace را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های bootstrap workspace را که برای یک عامل در دسترس هستند مدیریت می‌کنند.
    - `agent.identity.get` هویت موثر assistant را برای یک عامل یا نشست برمی‌گرداند.
    - `agent.wait` منتظر پایان یک run می‌ماند و snapshot پایانی را در صورت موجود بودن برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل نشست">
    - `sessions.list` index نشست فعلی را برمی‌گرداند، شامل فراداده `agentRuntime` به‌ازای هر ردیف وقتی backend runtime عامل پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر نشست را برای کلاینت WS فعلی toggle می‌کنند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد transcript/message را برای یک نشست toggle می‌کنند.
    - `sessions.preview` پیش‌نمایش‌های transcript محدود را برای کلیدهای نشست مشخص برمی‌گرداند.
    - `sessions.resolve` یک هدف نشست را resolve یا canonicalize می‌کند.
    - `sessions.create` یک entry نشست جدید ایجاد می‌کند.
    - `sessions.send` یک پیام را به یک نشست موجود ارسال می‌کند.
    - `sessions.steer` گونه interrupt-and-steer برای یک نشست فعال است.
    - `sessions.abort` کار فعال را برای یک نشست abort می‌کند. فراخواننده می‌تواند `key` به‌علاوه `runId` اختیاری را ارسال کند، یا برای runهای فعالی که Gateway می‌تواند به یک نشست resolve کند فقط `runId` را ارسال کند.
    - `sessions.patch` فراداده/overrideهای نشست را به‌روزرسانی می‌کند و مدل canonical resolve‌شده به‌علاوه `agentRuntime` موثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداری نشست را انجام می‌دهند.
    - `sessions.get` ردیف کامل نشست ذخیره‌شده را برمی‌گرداند.
    - اجرای chat همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI از نظر نمایش normalized است: tagهای directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های tool-call بریده‌شده) و tokenهای کنترلی model نشت‌کرده ASCII/full-width حذف می‌شوند، ردیف‌های assistant صرفا silent-token مثل `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و tokenهای دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شده pending و تاییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` یک token دستگاه جفت‌شده را در محدوده‌های نقش تاییدشده و scope فراخواننده rotate می‌کند.
    - `device.token.revoke` یک token دستگاه جفت‌شده را در محدوده‌های نقش تاییدشده و scope فراخواننده revoke می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، invoke، و کار pending">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` جفت‌سازی Node و تایید bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک command را به یک Node متصل forward می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای با منشا Node را به Gateway برمی‌گرداند.
    - `node.canvas.capability.refresh` tokenهای canvas-capability محدود به scope را refresh می‌کند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کار pending بادوام را برای Nodeهای آفلاین/قطع‌شده مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های تایید">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list`، و `exec.approval.resolve` درخواست‌های تایید exec یک‌باره به‌علاوه lookup/replay تایید pending را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک تایید exec pending می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در صورت timeout مقدار `null`).
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای سیاست تایید exec Gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` سیاست تایید exec محلی Node را از طریق commandهای relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision`، و `plugin.approval.resolve` جریان‌های تایید تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills، و ابزارها">
    - اتوماسیون: `wake` یک تزریق متن wake فوری یا در Heartbeat بعدی زمان‌بندی می‌کند؛ `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کار زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رایج رویداد

- `chat`: به‌روزرسانی‌های chat در UI مانند `chat.inject` و سایر رویدادهای chat
  که فقط transcript هستند.
- `session.message` و `session.tool`: به‌روزرسانی‌های transcript/event-stream برای یک
  نشست subscribe‌شده.
- `sessions.changed`: index نشست یا فراداده تغییر کرده است.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد keepalive / liveness دوره‌ای.
- `health`: به‌روزرسانی snapshot سلامت Gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر run/job مربوط به Cron.
- `shutdown`: اعلان shutdown مربوط به Gateway.
- `node.pair.requested` / `node.pair.resolved`: lifecycle جفت‌سازی Node.
- `node.invoke.request`: broadcast درخواست invoke مربوط به Node.
- `device.pair.requested` / `device.pair.resolved`: lifecycle دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی trigger واژه بیدارباش تغییر کرده است.
- `exec.approval.requested` / `exec.approval.resolved`: lifecycle تایید exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: lifecycle تایید Plugin.

### متدهای کمک‌کننده Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی executableهای skill
  را برای بررسی‌های auto-allow دریافت کنند.

### متدهای کمک‌کننده operator

- اپراتورها می‌توانند برای دریافت موجودی فرمان‌های زمان اجرا برای یک عامل، `commands.list` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - مسیر `native` و مسیر پیش‌فرض `both` در صورت وجود، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار اسلش‌دار دقیق مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` نام فرمان بومی آگاه از ارائه‌دهنده را، وقتی وجود داشته باشد، حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی به‌همراه دسترس‌پذیری فرمان‌های بومی Plugin اثر می‌گذارد.
  - `includeArgs=false` فراداده سریال‌شده آرگومان‌ها را از پاسخ حذف می‌کند.
- اپراتورها می‌توانند برای دریافت کاتالوگ ابزار زمان اجرا برای یک عامل، `tools.catalog` (`operator.read`) را فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده منشأ است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه آیا یک ابزار Plugin اختیاری است یا نه
- اپراتورها می‌توانند برای دریافت موجودی ابزار مؤثر در زمان اجرا برای یک نشست، `tools.effective` (`operator.read`) را فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا زمینه تحویل ارائه‌شده از سوی فراخواننده، زمینه زمان اجرای مورد اعتماد را از سمت سرور نشست استخراج می‌کند.
  - پاسخ محدود به نشست است و آنچه گفت‌وگوی فعال همین حالا می‌تواند استفاده کند را بازتاب می‌دهد، از جمله ابزارهای هسته، Plugin و کانال.
- اپراتورها می‌توانند برای دریافت موجودی مهارت قابل مشاهده برای یک عامل، `skills.status` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض، آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی و گزینه‌های نصب پاک‌سازی‌شده است، بدون افشای مقادیر خام محرمانه.
- اپراتورها می‌توانند برای فراداده کشف ClawHub، `skills.search` و `skills.detail` (`operator.read`) را فراخوانی کنند.
- اپراتورها می‌توانند `skills.install` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه مهارت را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت نصب‌کننده Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` یک کنش اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
- اپراتورها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug رهگیری‌شده یا همه نصب‌های ClawHub رهگیری‌شده را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`، `apiKey` و `env` را وصله می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار فعلی زمان اجرا. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است؛ در غیر این صورت پاسخ کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه انتخابگر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد. در غیر این صورت پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این گزینه برای عیب‌یابی و رابط‌های کاربری کشف استفاده کنید، نه انتخابگرهای معمول مدل.

## تأییدیه‌های اجرا

- وقتی یک درخواست اجرا به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های اپراتور با فراخوانی `exec.approval.resolve` آن را حل می‌کنند (به حوزه `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده نشستِ معیار). درخواست‌های فاقد `systemRunPlan` رد می‌شوند.
- پس از تأیید، فراخوانی‌های ارسال‌شده `node.invoke system.run` همان `systemRunPlan` معیار را به‌عنوان زمینه معتبر فرمان/cwd/نشست دوباره استفاده می‌کنند.
- اگر یک فراخواننده بین آماده‌سازی و ارسال نهایی `system.run` تأییدشده، `command`، `rawCommand`، `cwd`، `agentId` یا `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به payload تغییریافته، اجرا را رد می‌کند.

## جایگزین تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی، `deliver=true` را شامل شوند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل حل‌نشده یا فقط داخلی، `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی قابل حل نباشد، امکان بازگشت به اجرای فقط-نشست را می‌دهد (برای مثال نشست‌های داخلی/webchat یا پیکربندی‌های چندکاناله مبهم).

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/schema/protocol-schemas.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را ارسال می‌کنند؛ سرور ناسازگاری‌ها را رد می‌کند.
- طرح‌واره‌ها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در سراسر پروتکل v3 پایدارند و مبنای مورد انتظار برای کلاینت‌های شخص ثالث هستند.

| ثابت                                      | پیش‌فرض                                               | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| مهلت درخواست (برای هر RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| مهلت پیش‌احراز / چالش اتصال               | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (پیکربندی/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| وقفه بازاتصال اولیه                       | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| بیشینه وقفه بازاتصال                      | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| گیره تلاش سریع پس از بستن توکن دستگاه     | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| مهلت Force-stop پیش از `terminate()`       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| مهلت پیش‌فرض `stopAndWait()`              | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| بازه tick پیش‌فرض (پیش از `hello-ok`)      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن به‌دلیل مهلت tick                    | کد `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور مقادیر مؤثر `policy.tickIntervalMs`، `policy.maxPayload` و `policy.maxBufferedBytes` را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از دست‌دهی، آن مقادیر را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با راز مشترک، بسته به حالت احراز هویت پیکربندی‌شده، از `connect.params.auth.token` یا `connect.params.auth.password` استفاده می‌کند.
- حالت‌های دارای هویت مانند Tailscale Serve (`gateway.auth.allowTailscale: true`) یا `gateway.auth.mode: "trusted-proxy"` غیر-loopback، بررسی احراز هویت اتصال را به‌جای `connect.params.auth.*` از سرآیندهای درخواست برآورده می‌کنند.
- `gateway.auth.mode: "none"` برای ورودی خصوصی، احراز هویت اتصال با راز مشترک را کامل رد می‌کند؛ این حالت را روی ورودی عمومی/غیرقابل‌اعتماد در معرض قرار ندهید.
- پس از جفت‌سازی، Gateway یک **توکن دستگاه** محدود به نقش اتصال + حوزه‌ها صادر می‌کند. این توکن در `hello-ok.auth.deviceToken` برگردانده می‌شود و باید برای اتصال‌های آینده توسط کلاینت ماندگار شود.
- کلاینت‌ها باید پس از هر اتصال موفق، `hello-ok.auth.deviceToken` اصلی را ماندگار کنند.
- بازاتصال با آن توکن دستگاه **ذخیره‌شده** باید مجموعه حوزه تأییدشده ذخیره‌شده برای آن توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت را که قبلاً اعطا شده حفظ می‌کند و از فروکاست بی‌صدای بازاتصال‌ها به یک حوزه ضمنی محدودترِ فقط-admin جلوگیری می‌کند.
- مونتاژ احراز هویت اتصال سمت کلاینت (`selectConnectAuth` در `src/gateway/client.ts`):
  - `auth.password` مستقل است و وقتی تنظیم شده باشد همیشه ارسال می‌شود.
  - `auth.token` به‌ترتیب اولویت پر می‌شود: نخست توکن مشترک صریح، سپس یک `deviceToken` صریح، سپس یک توکن ذخیره‌شده برای هر دستگاه (با کلید `deviceId` + `role`).
  - `auth.bootstrapToken` فقط وقتی ارسال می‌شود که هیچ‌یک از موارد بالا یک `auth.token` را حل نکرده باشند. توکن مشترک یا هر توکن دستگاه حل‌شده‌ای آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در تلاش مجدد یک‌باره `AUTH_TOKEN_MISMATCH` فقط برای **نقطه‌های پایانی مورد اعتماد** مجاز است — loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی بدون پین‌کردن واجد شرایط نیست.
- ورودی‌های اضافی `hello-ok.auth.deviceTokens` توکن‌های واگذاری bootstrap هستند. آن‌ها را فقط وقتی ماندگار کنید که اتصال از احراز هویت bootstrap روی یک انتقال مورد اعتماد مانند `wss://` یا جفت‌سازی loopback/local استفاده کرده باشد.
- اگر یک کلاینت یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، همان مجموعه حوزه درخواست‌شده توسط فراخواننده معتبر باقی می‌ماند؛ حوزه‌های کش‌شده فقط وقتی دوباره استفاده می‌شوند که کلاینت در حال استفاده دوباره از توکن ذخیره‌شده برای هر دستگاه باشد.
- توکن‌های دستگاه را می‌توان از طریق `device.token.rotate` و `device.token.revoke` چرخاند/لغو کرد (به حوزه `operator.pairing` نیاز دارد).
- `device.token.rotate` فراداده چرخش را برمی‌گرداند. این فرمان توکن حامل جایگزین را فقط برای فراخوانی‌های همان دستگاهی بازتاب می‌دهد که از پیش با همان توکن دستگاه احراز هویت شده‌اند، تا کلاینت‌های فقط-توکن بتوانند جایگزین خود را پیش از بازاتصال ماندگار کنند. چرخش‌های مشترک/admin توکن حامل را بازتاب نمی‌دهند.
- صدور، چرخش و لغو توکن به مجموعه نقش تأییدشده ثبت‌شده در ورودی جفت‌سازی همان دستگاه محدود می‌ماند؛ تغییر توکن نمی‌تواند نقش دستگاهی را گسترش دهد یا هدف بگیرد که تأیید جفت‌سازی هرگز اعطا نکرده است.
- برای نشست‌های توکن دستگاه جفت‌شده، مدیریت دستگاه خود-محدود است مگر اینکه فراخواننده `operator.admin` هم داشته باشد: فراخواننده‌های غیر-admin فقط می‌توانند ورودی دستگاه **خودشان** را حذف/لغو/بچرخانند.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه حوزه توکن اپراتور هدف را در برابر حوزه‌های نشست فعلی فراخواننده بررسی می‌کنند. فراخواننده‌های غیر-admin نمی‌توانند توکن اپراتوری گسترده‌تر از آنچه اکنون دارند را بچرخانند یا لغو کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمایی‌های بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار کلاینت برای `AUTH_TOKEN_MISMATCH`:
  - کلاینت‌های مورد اعتماد می‌توانند یک تلاش مجدد محدود با توکن کش‌شده برای هر دستگاه انجام دهند.
  - اگر آن تلاش مجدد شکست بخورد، کلاینت‌ها باید حلقه‌های بازاتصال خودکار را متوقف کنند و راهنمای اقدام اپراتور را نمایش دهند.

## هویت دستگاه + جفت‌سازی

- Nodeها باید شامل یک هویت پایدار دستگاه (`device.id`) باشند که از
  اثر انگشت جفت‌کلید مشتق شده است.
- Gatewayها برای هر دستگاه + نقش توکن صادر می‌کنند.
- تأییدهای جفت‌سازی برای شناسه‌های دستگاه جدید الزامی هستند، مگر اینکه تأیید خودکار محلی
  فعال باشد.
- تأیید خودکار جفت‌سازی حول اتصال‌های مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر محدود خوداتصالی محلیِ بک‌اند/کانتینر برای
  جریان‌های کمکی مورداعتماد با راز مشترک دارد.
- اتصال‌های هم‌میزبان از طریق tailnet یا LAN همچنان برای جفت‌سازی ریموت تلقی می‌شوند و
  نیازمند تأیید هستند.
- کلاینت‌های WS معمولاً هویت `device` را هنگام `connect` ارسال می‌کنند (اپراتور +
  Node). تنها استثناهای اپراتور بدون دستگاه، مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامن فقط روی localhost.
  - احراز هویت موفق Control UI اپراتور با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (حالت اضطراری، کاهش شدید امنیت).
  - RPCهای بک‌اند `gateway-client` روی direct-loopback که با توکن/گذرواژه مشترک
    Gateway احراز هویت شده‌اند.
- همه اتصال‌ها باید nonce مربوط به `connect.challenge` ارائه‌شده توسط سرور را امضا کنند.

### عیب‌یابی مهاجرت احراز هویت دستگاه

برای کلاینت‌های قدیمی که هنوز از رفتار امضای پیش از چالش استفاده می‌کنند، اکنون `connect`
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

خرابی‌های رایج مهاجرت:

| پیام                        | details.code                     | details.reason           | معنی                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | کلاینت `device.nonce` را حذف کرده است (یا خالی فرستاده است). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | کلاینت با nonce منقضی/اشتباه امضا کرده است.       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | محموله امضا با محموله v2 مطابقت ندارد.            |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | زمان امضاشده خارج از انحراف مجاز است.             |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثر انگشت کلید عمومی مطابقت ندارد. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/کانونی‌سازی کلید عمومی ناموفق بود.           |

هدف مهاجرت:

- همیشه منتظر `connect.challenge` بمانید.
- محموله v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- محموله امضای ترجیحی `v3` است که علاوه بر فیلدهای دستگاه/کلاینت/نقش/دامنه‌ها/توکن/nonce،
  `platform` و `deviceFamily` را هم مقید می‌کند.
- امضاهای قدیمی `v2` برای سازگاری همچنان پذیرفته می‌شوند، اما پین‌کردن
  فراداده دستگاه جفت‌شده همچنان سیاست فرمان را هنگام اتصال مجدد کنترل می‌کند.

## TLS + پین‌کردن

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- کلاینت‌ها می‌توانند به‌صورت اختیاری اثر انگشت گواهی Gateway را پین کنند (به پیکربندی `gateway.tls`
  به‌همراه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` مراجعه کنید).

## دامنه

این پروتکل **API کامل Gateway** را ارائه می‌کند (وضعیت، کانال‌ها، مدل‌ها، چت،
عامل، نشست‌ها، Nodeها، تأییدها و غیره). سطح دقیق توسط
اسکیماهای TypeBox در `src/gateway/protocol/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل Bridge](/fa/gateway/bridge-protocol)
- [راهنمای عملیاتی Gateway](/fa/gateway)
