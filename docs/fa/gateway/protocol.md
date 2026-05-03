---
read_when:
    - پیاده‌سازی یا به‌روزرسانی کلاینت‌های WS برای Gateway
    - عیب‌یابی ناهمخوانی‌های پروتکل یا خطاهای اتصال
    - تولید مجدد طرح‌واره/مدل‌های پروتکل
summary: 'پروتکل وب‌سوکت Gateway: دست‌دهی، فریم‌ها، نسخه‌بندی'
title: پروتکل Gateway
x-i18n:
    generated_at: "2026-05-03T21:34:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway پروتکل WS، **تنها صفحه کنترل + انتقال Node** برای
OpenClaw است. همه کلاینت‌ها (CLI، رابط وب، برنامه macOS، Nodeهای iOS/Android، Nodeهای
بدون رابط) از طریق WebSocket متصل می‌شوند و در زمان handshake، **نقش** + **دامنه** خود را
اعلام می‌کنند.

## انتقال

- WebSocket، فریم‌های متنی با payloadهای JSON.
- نخستین فریم **باید** یک درخواست `connect` باشد.
- فریم‌های پیش از اتصال به 64 KiB محدود شده‌اند. پس از یک handshake موفق، کلاینت‌ها
  باید از محدودیت‌های `hello-ok.policy.maxPayload` و
  `hello-ok.policy.maxBufferedBytes` پیروی کنند. با فعال بودن diagnostics،
  فریم‌های ورودی بیش‌ازحد بزرگ و بافرهای خروجی کند، پیش از آنکه Gateway فریم
  تحت‌تأثیر را ببندد یا رها کند، رویدادهای `payload.large` منتشر می‌کنند. این رویدادها
  اندازه‌ها، محدودیت‌ها، سطح‌ها و کدهای دلیل امن را نگه می‌دارند. بدنه پیام،
  محتوای پیوست، بدنه خام فریم، توکن‌ها، کوکی‌ها یا مقادیر محرمانه را نگه نمی‌دارند.

## Handshake (`connect`)

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
یک خطای قابل تلاش مجدد `UNAVAILABLE` برگرداند که `details.reason` آن روی
`"startup-sidecars"` و `retryAfterMs` تنظیم شده است. کلاینت‌ها باید این پاسخ را
در چارچوب بودجه کلی اتصال خود دوباره تلاش کنند، نه اینکه آن را به‌عنوان شکست نهایی
handshake نمایش دهند.

`server`، `features`، `snapshot` و `policy` همگی طبق schema
(`src/gateway/protocol/schema/frames.ts`) الزامی هستند. `auth` نیز الزامی است و
نقش/دامنه‌های توافق‌شده را گزارش می‌کند. `canvasHostUrl` اختیاری است.

وقتی هیچ توکن دستگاهی صادر نمی‌شود، `hello-ok.auth` مجوزهای توافق‌شده را بدون
فیلدهای توکن گزارش می‌کند:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

کلاینت‌های بک‌اند هم‌پردازه معتمد (`client.id: "gateway-client"`،
`client.mode: "backend"`) می‌توانند در اتصال‌های مستقیم loopback، وقتی با توکن/گذرواژه
مشترک Gateway احراز هویت می‌شوند، `device` را حذف کنند. این مسیر برای RPCهای داخلی
صفحه کنترل رزرو شده است و اجازه نمی‌دهد baselineهای قدیمی جفت‌سازی CLI/دستگاه،
کار محلی بک‌اند مانند به‌روزرسانی‌های نشست subagent را مسدود کنند. کلاینت‌های دوردست،
کلاینت‌های با مبدأ مرورگر، کلاینت‌های Node، و کلاینت‌های صریح دارای توکن دستگاه/هویت دستگاه
همچنان از بررسی‌های عادی جفت‌سازی و ارتقای دامنه استفاده می‌کنند.

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

در طول واگذاری bootstrap معتمد، `hello-ok.auth` ممکن است ورودی‌های نقش محدود دیگری را
نیز در `deviceTokens` شامل شود:

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
`scopes: []` باقی می‌ماند و هر توکن operator واگذارشده به فهرست مجاز bootstrap
operator (`operator.approvals`، `operator.read`،
`operator.talk.secrets`، `operator.write`) محدود می‌ماند. بررسی‌های دامنه bootstrap
همچنان پیشوند نقش را رعایت می‌کنند: ورودی‌های operator فقط درخواست‌های operator را
برآورده می‌کنند، و نقش‌های غیر operator همچنان به دامنه‌هایی با پیشوند نقش خودشان نیاز دارند.

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

## فریم‌بندی

- **درخواست**: `{type:"req", id, method, params}`
- **پاسخ**: `{type:"res", id, ok, payload|error}`
- **رویداد**: `{type:"event", event, payload, seq?, stateVersion?}`

متدهای دارای اثر جانبی به **کلیدهای idempotency** نیاز دارند (schema را ببینید).

## نقش‌ها + دامنه‌ها

برای مدل کامل دامنه operator، بررسی‌های زمان تأیید، و معنای secret مشترک،
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

متدهای RPC Gateway ثبت‌شده توسط Plugin ممکن است دامنه operator اختصاصی خود را درخواست کنند، اما
پیشوندهای رزروشده ادمین هسته (`config.*`، `exec.approvals.*`، `wizard.*`،
`update.*`) همیشه به `operator.admin` resolve می‌شوند.

دامنه متد فقط نخستین gate است. برخی slash commandها که از طریق
`chat.send` می‌رسند، بررسی‌های سخت‌گیرانه‌تر در سطح command نیز اعمال می‌کنند. برای مثال، نوشتن‌های پایدار
`/config set` و `/config unset` به `operator.admin` نیاز دارند.

`node.pair.approve` نیز افزون بر دامنه پایه متد، یک بررسی دامنه اضافی در زمان تأیید دارد:

- درخواست‌های بدون command: `operator.pairing`
- درخواست‌هایی با commandهای Node غیر exec: `operator.pairing` + `operator.write`
- درخواست‌هایی که شامل `system.run`، `system.run.prepare` یا `system.which` هستند:
  `operator.pairing` + `operator.admin`

### قابلیت‌ها/commandها/مجوزها (Node)

Nodeها هنگام اتصال ادعاهای قابلیت خود را اعلام می‌کنند:

- `caps`: دسته‌های سطح‌بالای قابلیت.
- `commands`: فهرست مجاز command برای invoke.
- `permissions`: toggleهای جزئی (مثلاً `screen.record`، `camera.capture`).

Gateway این‌ها را به‌عنوان **ادعا** در نظر می‌گیرد و فهرست‌های مجاز سمت سرور را enforce می‌کند.

## حضور

- `system-presence` ورودی‌هایی را برمی‌گرداند که با هویت دستگاه کلیدگذاری شده‌اند.
- ورودی‌های حضور شامل `deviceId`، `roles` و `scopes` هستند تا UIها بتوانند برای هر دستگاه یک ردیف واحد نشان دهند
  حتی وقتی هم به‌عنوان **operator** و هم به‌عنوان **Node** متصل می‌شود.
- `node.list` فیلدهای اختیاری `lastSeenAtMs` و `lastSeenReason` را شامل می‌شود. Nodeهای متصل،
  زمان اتصال فعلی خود را به‌عنوان `lastSeenAtMs` با دلیل `connect` گزارش می‌کنند؛ Nodeهای جفت‌شده همچنین می‌توانند
  وقتی یک رویداد Node معتمد metadata جفت‌سازی آن‌ها را به‌روزرسانی می‌کند، حضور پس‌زمینه پایدار گزارش کنند.

### رویداد زنده بودن پس‌زمینه Node

Nodeها می‌توانند `node.event` را با `event: "node.presence.alive"` فراخوانی کنند تا ثبت شود که یک Node جفت‌شده
در طول یک بیدارشدن پس‌زمینه زنده بوده است، بدون اینکه به‌عنوان متصل علامت‌گذاری شود.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` یک enum بسته است: `background`، `silent_push`، `bg_app_refresh`،
`significant_location`، `manual` یا `connect`. رشته‌های trigger ناشناخته پیش از ماندگاری توسط Gateway به
`background` نرمال‌سازی می‌شوند. این رویداد فقط برای نشست‌های احراز هویت‌شده دستگاه Node
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

Gatewayهای قدیمی‌تر ممکن است همچنان برای `node.event` مقدار `{ "ok": true }` برگردانند؛ کلاینت‌ها باید آن را
یک RPC تأییدشده تلقی کنند، نه ماندگاری پایدار حضور.

## دامنه‌بندی رویدادهای broadcast

رویدادهای broadcast WebSocket که سرور push می‌کند، با دامنه gate می‌شوند تا نشست‌های محدود به جفت‌سازی یا فقط Node، محتوای نشست را به‌صورت passive دریافت نکنند.

- **فریم‌های chat، agent، و نتیجه ابزار** (شامل رویدادهای `agent` جریانی و نتایج فراخوانی ابزار) حداقل به `operator.read` نیاز دارند. نشست‌های بدون `operator.read` این فریم‌ها را کاملاً رد می‌کنند.
- **broadcastهای `plugin.*` تعریف‌شده توسط Plugin** بسته به نحوه ثبت آن‌ها توسط Plugin، با `operator.write` یا `operator.admin` gate می‌شوند.
- **رویدادهای وضعیت و انتقال** (`heartbeat`، `presence`، `tick`، چرخه عمر connect/disconnect، و غیره) بدون محدودیت می‌مانند تا سلامت انتقال برای هر نشست احراز هویت‌شده قابل مشاهده بماند.
- **خانواده‌های ناشناخته رویداد broadcast** به‌طور پیش‌فرض با دامنه gate می‌شوند (fail-closed)، مگر آنکه یک handler ثبت‌شده صریحاً آن‌ها را شل کند.

هر اتصال کلاینت شماره توالی per-client خودش را نگه می‌دارد تا broadcastها روی آن socket ترتیب یکنواخت را حفظ کنند، حتی وقتی کلاینت‌های مختلف زیرمجموعه‌های متفاوتی از جریان رویداد را پس از فیلتر دامنه می‌بینند.

## خانواده‌های رایج متد RPC

سطح عمومی WS گسترده‌تر از مثال‌های handshake/auth بالا است. این
یک dump تولیدشده نیست — `hello-ok.features.methods` یک فهرست discovery محافظه‌کارانه است
که از `src/gateway/server-methods-list.ts` به‌همراه exportهای متد Plugin/channel بارگذاری‌شده ساخته می‌شود. آن را feature discovery بدانید، نه فهرست کامل
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="سیستم و هویت">
    - `health` snapshot سلامت Gateway کش‌شده یا تازه probe‌شده را برمی‌گرداند.
    - `diagnostics.stability` ضبط‌کننده پایداری diagnostic محدود و اخیر را برمی‌گرداند. metadata عملیاتی مانند نام رویدادها، شمارش‌ها، اندازه‌های بایتی، خوانش‌های حافظه، وضعیت queue/session، نام‌های channel/Plugin، و شناسه‌های session را نگه می‌دارد. متن chat، بدنه‌های webhook، خروجی‌های ابزار، بدنه‌های خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها یا مقادیر محرمانه را نگه نمی‌دارد. دامنه خواندن operator لازم است.
    - `status` خلاصه Gateway به سبک `/status` را برمی‌گرداند؛ فیلدهای حساس فقط برای کلاینت‌های operator دارای دامنه admin گنجانده می‌شوند.
    - `gateway.identity.get` هویت دستگاه Gateway را که توسط جریان‌های relay و جفت‌سازی استفاده می‌شود برمی‌گرداند.
    - `system-presence` snapshot حضور فعلی دستگاه‌های operator/Node متصل را برمی‌گرداند.
    - `system-event` یک رویداد سیستم را append می‌کند و می‌تواند زمینه حضور را به‌روزرسانی/broadcast کند.
    - `last-heartbeat` آخرین رویداد Heartbeat ماندگارشده را برمی‌گرداند.
    - `set-heartbeats` پردازش Heartbeat را روی Gateway toggle می‌کند.

  </Accordion>

  <Accordion title="مدل‌ها و مصرف">
    - `models.list` کاتالوگ مدل‌های مجاز در زمان اجرا را برمی‌گرداند. برای مدل‌های پیکربندی‌شده در اندازه انتخاب‌گر (`agents.defaults.models` ابتدا، سپس `models.providers.*.models`) مقدار `{ "view": "configured" }` را ارسال کنید، یا برای کاتالوگ کامل مقدار `{ "view": "all" }` را ارسال کنید.
    - `usage.status` پنجره‌های مصرف ارائه‌دهنده/خلاصه سهمیه باقی‌مانده را برمی‌گرداند.
    - `usage.cost` خلاصه‌های تجمیعی هزینه مصرف را برای یک بازه تاریخ برمی‌گرداند.
    - `doctor.memory.status` آمادگی حافظه برداری / embedding کش‌شده را برای فضای کاری agent پیش‌فرض فعال برمی‌گرداند. فقط وقتی فراخواننده صراحتا یک ping زنده به ارائه‌دهنده embedding می‌خواهد، `{ "probe": true }` یا `{ "deep": true }` را ارسال کنید.
    - `doctor.memory.remHarness` یک پیش‌نمایش محدود و فقط‌خواندنی از مهار REM را برای کلاینت‌های control-plane راه دور برمی‌گرداند. این می‌تواند مسیرهای فضای کاری، قطعه‌های حافظه، markdown مستند رندرشده، و نامزدهای promotion عمیق را شامل شود، پس فراخواننده‌ها به `operator.read` نیاز دارند.
    - `sessions.usage` خلاصه‌های مصرف هر session را برمی‌گرداند.
    - `sessions.usage.timeseries` مصرف سری زمانی را برای یک session برمی‌گرداند.
    - `sessions.usage.logs` ورودی‌های لاگ مصرف را برای یک session برمی‌گرداند.

  </Accordion>

  <Accordion title="کانال‌ها و کمک‌کننده‌های ورود">
    - `channels.status` خلاصه وضعیت کانال/Plugin داخلی + همراه را برمی‌گرداند.
    - `channels.logout` از یک کانال/حساب مشخص، جایی که کانال از خروج پشتیبانی می‌کند، خارج می‌شود.
    - `web.login.start` یک جریان ورود QR/web را برای ارائه‌دهنده کانال وب فعلی دارای قابلیت QR آغاز می‌کند.
    - `web.login.wait` منتظر می‌ماند تا آن جریان ورود QR/web کامل شود و در صورت موفقیت کانال را شروع می‌کند.
    - `push.test` یک push آزمایشی APNs به یک Node ثبت‌شده iOS می‌فرستد.
    - `voicewake.get` تریگرهای wake-word ذخیره‌شده را برمی‌گرداند.
    - `voicewake.set` تریگرهای wake-word را به‌روزرسانی می‌کند و تغییر را broadcast می‌کند.

  </Accordion>

  <Accordion title="پیام‌رسانی و لاگ‌ها">
    - `send` فراخوانی RPC مستقیم تحویل خروجی برای ارسال‌های هدف‌گذاری‌شده بر اساس کانال/حساب/thread خارج از chat runner است.
    - `logs.tail` tail لاگ فایل پیکربندی‌شده Gateway را با کنترل‌های cursor/limit و max-byte برمی‌گرداند.

  </Accordion>

  <Accordion title="Talk و TTS">
    - `talk.config` payload پیکربندی موثر Talk را برمی‌گرداند؛ `includeSecrets` به `operator.talk.secrets` (یا `operator.admin`) نیاز دارد.
    - `talk.mode` وضعیت حالت Talk فعلی را برای کلاینت‌های WebChat/Control UI تنظیم/broadcast می‌کند.
    - `talk.speak` گفتار را از طریق ارائه‌دهنده گفتار فعال Talk سنتز می‌کند.
    - `tts.status` وضعیت فعال بودن TTS، ارائه‌دهنده فعال، ارائه‌دهنده‌های fallback، و وضعیت پیکربندی ارائه‌دهنده را برمی‌گرداند.
    - `tts.providers` فهرست قابل مشاهده ارائه‌دهنده‌های TTS را برمی‌گرداند.
    - `tts.enable` و `tts.disable` وضعیت ترجیحات TTS را تغییر می‌دهند.
    - `tts.setProvider` ارائه‌دهنده ترجیحی TTS را به‌روزرسانی می‌کند.
    - `tts.convert` تبدیل یک‌باره متن به گفتار را اجرا می‌کند.

  </Accordion>

  <Accordion title="اسرار، پیکربندی، به‌روزرسانی، و wizard">
    - `secrets.reload` دوباره SecretRefهای فعال را resolve می‌کند و فقط در صورت موفقیت کامل، وضعیت secret زمان اجرا را جایگزین می‌کند.
    - `secrets.resolve` انتساب‌های secret هدف‌گذاری‌شده برای command را برای یک مجموعه command/target مشخص resolve می‌کند.
    - `config.get` snapshot و hash پیکربندی فعلی را برمی‌گرداند.
    - `config.set` یک payload پیکربندی اعتبارسنجی‌شده را می‌نویسد.
    - `config.patch` یک به‌روزرسانی جزئی پیکربندی را merge می‌کند.
    - `config.apply` payload کامل پیکربندی را اعتبارسنجی + جایگزین می‌کند.
    - `config.schema` payload schema زنده پیکربندی را که توسط ابزارهای Control UI و CLI استفاده می‌شود برمی‌گرداند: schema، `uiHints`، version، و metadata تولید، از جمله metadata مربوط به schemaهای Plugin + channel وقتی runtime بتواند آن را load کند. schema شامل metadata فیلد `title` / `description` است که از همان برچسب‌ها و متن راهنمای استفاده‌شده در UI مشتق شده‌اند، از جمله شاخه‌های ترکیب شیء تو‌در‌تو، wildcard، آیتم آرایه، و `anyOf` / `oneOf` / `allOf` وقتی مستندات فیلد منطبق وجود داشته باشد.
    - `config.schema.lookup` یک payload lookup محدود به path را برای یک مسیر پیکربندی برمی‌گرداند: مسیر نرمال‌شده، یک schema node کم‌عمق، hint منطبق + `hintPath`، و خلاصه‌های فرزند بلافاصله برای drill-down در UI/CLI. schema nodeهای lookup مستندات کاربرپسند و فیلدهای رایج اعتبارسنجی (`title`، `description`، `type`، `enum`، `const`، `format`، `pattern`، کران‌های عددی/رشته‌ای/آرایه‌ای/شیئی، و flagهایی مثل `additionalProperties`، `deprecated`، `readOnly`، `writeOnly`) را حفظ می‌کنند. خلاصه‌های فرزند `key`، `path` نرمال‌شده، `type`، `required`، `hasChildren`، به‌علاوه `hint` / `hintPath` منطبق را ارائه می‌کنند.
    - `update.run` جریان به‌روزرسانی Gateway را اجرا می‌کند و فقط وقتی خود به‌روزرسانی موفق شده باشد، restart را زمان‌بندی می‌کند؛ فراخواننده‌های دارای session می‌توانند `continuationMessage` را اضافه کنند تا startup یک نوبت follow-up agent را از طریق صف continuation مربوط به restart از سر بگیرد. به‌روزرسانی‌های package-manager پس از تعویض package یک restart به‌روزرسانی غیرتعویقی و بدون cooldown را اجبار می‌کنند تا فرایند قدیمی Gateway از درخت `dist` جایگزین‌شده lazy-load نکند.
    - `update.status` آخرین sentinel کش‌شده restart به‌روزرسانی را برمی‌گرداند، از جمله نسخه در حال اجرای پس از restart وقتی در دسترس باشد.
    - `wizard.start`، `wizard.next`، `wizard.status`، و `wizard.cancel`، onboarding wizard را از طریق WS RPC در دسترس قرار می‌دهند.

  </Accordion>

  <Accordion title="کمک‌کننده‌های agent و فضای کاری">
    - `agents.list` ورودی‌های agent پیکربندی‌شده را برمی‌گرداند، از جمله مدل موثر و metadata زمان اجرا.
    - `agents.create`، `agents.update`، و `agents.delete` رکوردهای agent و اتصال فضای کاری را مدیریت می‌کنند.
    - `agents.files.list`، `agents.files.get`، و `agents.files.set` فایل‌های bootstrap فضای کاری را که برای یک agent ارائه شده‌اند مدیریت می‌کنند.
    - `artifacts.list`، `artifacts.get`، و `artifacts.download` خلاصه‌ها و دانلودهای artifact مشتق‌شده از transcript را برای scope صریح `sessionKey`، `runId`، یا `taskId` در دسترس قرار می‌دهند. queryهای run و task، session مالک را سمت سرور resolve می‌کنند و فقط transcript media با provenance منطبق را برمی‌گردانند؛ منبع‌های URL ناامن یا محلی به‌جای fetch سمت سرور، دانلودهای پشتیبانی‌نشده برمی‌گردانند.
    - `agent.identity.get` هویت موثر assistant را برای یک agent یا session برمی‌گرداند.
    - `agent.wait` منتظر می‌ماند تا یک run تمام شود و در صورت موجود بودن snapshot نهایی را برمی‌گرداند.

  </Accordion>

  <Accordion title="کنترل session">
    - `sessions.list` index فعلی session را برمی‌گرداند، از جمله metadata مربوط به `agentRuntime` برای هر row وقتی backend زمان اجرای agent پیکربندی شده باشد.
    - `sessions.subscribe` و `sessions.unsubscribe` اشتراک‌های رویداد تغییر session را برای کلاینت WS فعلی تغییر می‌دهند.
    - `sessions.messages.subscribe` و `sessions.messages.unsubscribe` اشتراک‌های رویداد transcript/message را برای یک session تغییر می‌دهند.
    - `sessions.preview` پیش‌نمایش‌های محدود transcript را برای کلیدهای session مشخص برمی‌گرداند.
    - `sessions.describe` یک row از session Gateway را برای کلید دقیق session برمی‌گرداند.
    - `sessions.resolve` یک هدف session را resolve یا canonicalize می‌کند.
    - `sessions.create` یک ورودی session جدید ایجاد می‌کند.
    - `sessions.send` یک پیام را به یک session موجود می‌فرستد.
    - `sessions.steer` گونه interrupt-and-steer برای یک session فعال است.
    - `sessions.abort` کار فعال را برای یک session لغو می‌کند. فراخواننده می‌تواند `key` به‌همراه `runId` اختیاری را ارسال کند، یا برای runهای فعالی که Gateway می‌تواند به یک session resolve کند، فقط `runId` را ارسال کند.
    - `sessions.patch` metadata/overrideهای session را به‌روزرسانی می‌کند و مدل canonical حل‌شده به‌علاوه `agentRuntime` موثر را گزارش می‌دهد.
    - `sessions.reset`، `sessions.delete`، و `sessions.compact` نگهداری session را انجام می‌دهند.
    - `sessions.get` row کامل session ذخیره‌شده را برمی‌گرداند.
    - اجرای chat همچنان از `chat.history`، `chat.send`، `chat.abort`، و `chat.inject` استفاده می‌کند. `chat.history` برای کلاینت‌های UI به‌صورت display-normalized است: tagهای directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های tool-call کوتاه‌شده) و tokenهای کنترلی model لو‌رفته ASCII/full-width حذف می‌شوند، rowهای assistant شامل فقط silent-token مانند `NO_REPLY` / `no_reply` دقیق حذف می‌شوند، و rowهای بیش‌ازحد بزرگ می‌توانند با placeholderها جایگزین شوند.

  </Accordion>

  <Accordion title="جفت‌سازی دستگاه و tokenهای دستگاه">
    - `device.pair.list` دستگاه‌های جفت‌شده در انتظار و تاییدشده را برمی‌گرداند.
    - `device.pair.approve`، `device.pair.reject`، و `device.pair.remove` رکوردهای جفت‌سازی دستگاه را مدیریت می‌کنند.
    - `device.token.rotate` token یک دستگاه جفت‌شده را در محدوده‌های role تاییدشده و scope فراخواننده آن rotate می‌کند.
    - `device.token.revoke` token یک دستگاه جفت‌شده را در محدوده‌های role تاییدشده و scope فراخواننده آن revoke می‌کند.

  </Accordion>

  <Accordion title="جفت‌سازی Node، invoke، و کارهای در انتظار">
    - `node.pair.request`، `node.pair.list`، `node.pair.approve`، `node.pair.reject`، `node.pair.remove`، و `node.pair.verify` جفت‌سازی Node و تایید bootstrap را پوشش می‌دهند.
    - `node.list` و `node.describe` وضعیت Nodeهای شناخته‌شده/متصل را برمی‌گردانند.
    - `node.rename` برچسب یک Node جفت‌شده را به‌روزرسانی می‌کند.
    - `node.invoke` یک command را به یک Node متصل forward می‌کند.
    - `node.invoke.result` نتیجه یک درخواست invoke را برمی‌گرداند.
    - `node.event` رویدادهای برخاسته از Node را به gateway برمی‌گرداند.
    - `node.canvas.capability.refresh` tokenهای canvas-capability محدود به scope را refresh می‌کند.
    - `node.pending.pull` و `node.pending.ack` APIهای صف Node متصل هستند.
    - `node.pending.enqueue` و `node.pending.drain` کارهای در انتظار durable را برای Nodeهای offline/disconnected مدیریت می‌کنند.

  </Accordion>

  <Accordion title="خانواده‌های approval">
    - `exec.approval.request`، `exec.approval.get`، `exec.approval.list`، و `exec.approval.resolve` درخواست‌های approval یک‌باره exec به‌علاوه lookup/replay مربوط به approval در انتظار را پوشش می‌دهند.
    - `exec.approval.waitDecision` منتظر یک approval در انتظار exec می‌ماند و تصمیم نهایی را برمی‌گرداند (یا در timeout مقدار `null`).
    - `exec.approvals.get` و `exec.approvals.set` snapshotهای policy مربوط به approvalهای exec در gateway را مدیریت می‌کنند.
    - `exec.approvals.node.get` و `exec.approvals.node.set` policy مربوط به approvalهای exec محلی Node را از طریق commandهای relay Node مدیریت می‌کنند.
    - `plugin.approval.request`، `plugin.approval.list`، `plugin.approval.waitDecision`، و `plugin.approval.resolve` جریان‌های approval تعریف‌شده توسط Plugin را پوشش می‌دهند.

  </Accordion>

  <Accordion title="اتوماسیون، Skills، و ابزارها">
    - اتوماسیون: `wake` تزریق فوری یا next-heartbeat متن wake را زمان‌بندی می‌کند؛ `cron.list`، `cron.status`، `cron.add`، `cron.update`، `cron.remove`، `cron.run`، `cron.runs` کارهای زمان‌بندی‌شده را مدیریت می‌کنند.
    - Skills و ابزارها: `commands.list`، `skills.*`، `tools.catalog`، `tools.effective`، `tools.invoke`.

  </Accordion>
</AccordionGroup>

### خانواده‌های رایج رویداد

- `chat`: به‌روزرسانی‌های chat در UI مانند `chat.inject` و دیگر رویدادهای فقط transcript مربوط به chat.
- `session.message` و `session.tool`: به‌روزرسانی‌های transcript/event-stream برای یک session مشترک‌شده.
- `sessions.changed`: index یا metadata مربوط به session تغییر کرده است.
- `presence`: به‌روزرسانی‌های snapshot حضور سیستم.
- `tick`: رویداد دوره‌ای keepalive / liveness.
- `health`: به‌روزرسانی snapshot سلامت Gateway.
- `heartbeat`: به‌روزرسانی جریان رویداد Heartbeat.
- `cron`: رویداد تغییر اجرای Cron/کار.
- `shutdown`: اعلان خاموش‌شدن Gateway.
- `node.pair.requested` / `node.pair.resolved`: چرخه عمر جفت‌سازی Node.
- `node.invoke.request`: broadcast درخواست invoke برای Node.
- `device.pair.requested` / `device.pair.resolved`: چرخه عمر دستگاه جفت‌شده.
- `voicewake.changed`: پیکربندی تریگر wake-word تغییر کرد.
- `exec.approval.requested` / `exec.approval.resolved`: چرخه عمر approval برای exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: چرخه عمر approval برای Plugin.

### متدهای کمک‌کننده Node

- Nodeها می‌توانند `skills.bins` را فراخوانی کنند تا فهرست فعلی executableهای skill را برای بررسی‌های auto-allow دریافت کنند.

### متدهای کمک‌کننده operator

- عملگرها می‌توانند برای دریافت موجودی فرمان‌های runtime برای یک عامل، `commands.list` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - `scope` کنترل می‌کند که `name` اصلی کدام سطح را هدف بگیرد:
    - `text` توکن فرمان متنی اصلی را بدون `/` ابتدایی برمی‌گرداند
    - `native` و مسیر پیش‌فرض `both`، وقتی در دسترس باشد، نام‌های بومی آگاه از ارائه‌دهنده را برمی‌گردانند
  - `textAliases` نام‌های مستعار دقیق اسلش‌دار مانند `/model` و `/m` را حمل می‌کند.
  - `nativeName` نام فرمان بومی آگاه از ارائه‌دهنده را وقتی وجود داشته باشد حمل می‌کند.
  - `provider` اختیاری است و فقط بر نام‌گذاری بومی و دسترس‌پذیری فرمان‌های بومی Plugin اثر می‌گذارد.
  - `includeArgs=false` فراداده سریال‌شده آرگومان را از پاسخ حذف می‌کند.
- عملگرها می‌توانند برای دریافت کاتالوگ ابزار runtime برای یک عامل، `tools.catalog` (`operator.read`) را فراخوانی کنند. پاسخ شامل ابزارهای گروه‌بندی‌شده و فراداده خاستگاه است:
  - `source`: `core` یا `plugin`
  - `pluginId`: مالک Plugin وقتی `source="plugin"` باشد
  - `optional`: اینکه آیا ابزار Plugin اختیاری است
- عملگرها می‌توانند برای دریافت موجودی ابزار runtime-effective برای یک نشست، `tools.effective` (`operator.read`) را فراخوانی کنند.
  - `sessionKey` الزامی است.
  - Gateway به‌جای پذیرش احراز هویت یا زمینه تحویل ارائه‌شده توسط فراخواننده، زمینه runtime مورد اعتماد را از نشست در سمت سرور استخراج می‌کند.
  - پاسخ محدود به نشست است و آنچه مکالمه فعال همین حالا می‌تواند استفاده کند را بازتاب می‌دهد، از جمله ابزارهای هسته، Plugin و کانال.
- عملگرها می‌توانند برای فراخوانی یک ابزار در دسترس از طریق همان مسیر سیاست Gateway مثل `/tools/invoke`، `tools.invoke` (`operator.write`) را فراخوانی کنند.
  - `name` الزامی است. `args`، `sessionKey`، `agentId`، `confirm`، و `idempotencyKey` اختیاری هستند.
  - اگر هم `sessionKey` و هم `agentId` حضور داشته باشند، عامل نشست حل‌شده باید با `agentId` مطابقت داشته باشد.
  - پاسخ یک پوشش روبه‌روی SDK با فیلدهای `ok`، `toolName`، `output` اختیاری، و `error` تایپ‌شده است. تأیید یا ردهای سیاستی، به‌جای دور زدن خط لوله سیاست ابزار Gateway، مقدار `ok:false` را در payload برمی‌گردانند.
- عملگرها می‌توانند برای دریافت موجودی قابل مشاهده Skills برای یک عامل، `skills.status` (`operator.read`) را فراخوانی کنند.
  - `agentId` اختیاری است؛ برای خواندن فضای کاری عامل پیش‌فرض آن را حذف کنید.
  - پاسخ شامل واجد شرایط بودن، نیازمندی‌های مفقود، بررسی‌های پیکربندی، و گزینه‌های نصب پاک‌سازی‌شده بدون افشای مقادیر خام محرمانه است.
- عملگرها می‌توانند برای فراداده اکتشاف ClawHub، `skills.search` و `skills.detail` (`operator.read`) را فراخوانی کنند.
- عملگرها می‌توانند `skills.install` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub: `{ source: "clawhub", slug, version?, force? }` یک پوشه Skill را در دایرکتوری `skills/` فضای کاری عامل پیش‌فرض نصب می‌کند.
  - حالت نصب‌کننده Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` یک کنش اعلام‌شده `metadata.openclaw.install` را روی میزبان Gateway اجرا می‌کند.
- عملگرها می‌توانند `skills.update` (`operator.admin`) را در دو حالت فراخوانی کنند:
  - حالت ClawHub یک slug رهگیری‌شده یا همه نصب‌های رهگیری‌شده ClawHub را در فضای کاری عامل پیش‌فرض به‌روزرسانی می‌کند.
  - حالت پیکربندی مقادیر `skills.entries.<skillKey>` مانند `enabled`، `apiKey`، و `env` را وصله می‌کند.

### نماهای `models.list`

`models.list` یک پارامتر اختیاری `view` می‌پذیرد:

- حذف‌شده یا `"default"`: رفتار runtime فعلی. اگر `agents.defaults.models` پیکربندی شده باشد، پاسخ همان کاتالوگ مجاز است؛ در غیر این صورت پاسخ کاتالوگ کامل Gateway است.
- `"configured"`: رفتار در اندازه انتخاب‌گر. اگر `agents.defaults.models` پیکربندی شده باشد، همچنان اولویت دارد. در غیر این صورت پاسخ از ورودی‌های صریح `models.providers.*.models` استفاده می‌کند و فقط وقتی هیچ ردیف مدل پیکربندی‌شده‌ای وجود نداشته باشد به کاتالوگ کامل برمی‌گردد.
- `"all"`: کاتالوگ کامل Gateway، با دور زدن `agents.defaults.models`. از این مورد برای تشخیص و رابط‌های کاربری اکتشاف استفاده کنید، نه انتخاب‌گرهای معمول مدل.

## تأییدهای exec

- وقتی یک درخواست exec به تأیید نیاز داشته باشد، Gateway رویداد `exec.approval.requested` را پخش می‌کند.
- کلاینت‌های عملگر با فراخوانی `exec.approval.resolve` حل می‌کنند (به دامنه `operator.approvals` نیاز دارد).
- برای `host=node`، `exec.approval.request` باید شامل `systemRunPlan` باشد (`argv`/`cwd`/`rawCommand`/فراداده نشست استاندارد). درخواست‌هایی که `systemRunPlan` ندارند رد می‌شوند.
- پس از تأیید، فراخوانی‌های ارسال‌شده `node.invoke system.run` همان `systemRunPlan` استاندارد را به‌عنوان زمینه معتبر فرمان/cwd/نشست دوباره استفاده می‌کنند.
- اگر فراخواننده بین آماده‌سازی و ارسال نهایی تأییدشده `system.run`، `command`، `rawCommand`، `cwd`، `agentId`، یا `sessionKey` را تغییر دهد، Gateway به‌جای اعتماد به payload تغییریافته، اجرا را رد می‌کند.

## fallback تحویل عامل

- درخواست‌های `agent` می‌توانند برای درخواست تحویل خروجی شامل `deliver=true` باشند.
- `bestEffortDeliver=false` رفتار سخت‌گیرانه را حفظ می‌کند: هدف‌های تحویل حل‌نشده یا فقط داخلی، `INVALID_REQUEST` برمی‌گردانند.
- `bestEffortDeliver=true` وقتی هیچ مسیر قابل تحویل خارجی قابل حل نباشد، fallback به اجرای فقط در نشست را مجاز می‌کند (برای مثال نشست‌های داخلی/webchat یا پیکربندی‌های چندکاناله مبهم).

## نسخه‌بندی

- `PROTOCOL_VERSION` در `src/gateway/protocol/schema/protocol-schemas.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را می‌فرستند؛ سرور عدم تطابق‌ها را رد می‌کند.
- طرح‌واره‌ها + مدل‌ها از تعریف‌های TypeBox تولید می‌شوند:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ثابت‌های کلاینت

کلاینت مرجع در `src/gateway/client.ts` از این پیش‌فرض‌ها استفاده می‌کند. مقادیر در protocol v3 پایدار هستند و مبنای مورد انتظار برای کلاینت‌های شخص ثالث محسوب می‌شوند.

| ثابت                                      | پیش‌فرض                                               | منبع                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| زمان انقضای درخواست (به‌ازای هر RPC)     | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| زمان انقضای Preauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env می‌تواند بودجه جفت‌شده سرور/کلاینت را افزایش دهد) |
| backoff اولیه اتصال مجدد                  | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| حداکثر backoff اتصال مجدد                 | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp تلاش مجدد سریع پس از بستن device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| مهلت force-stop پیش از `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| زمان انقضای پیش‌فرض `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| بازه tick پیش‌فرض (پیش از `hello-ok`)     | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| بستن در tick-timeout                      | کد `4000` وقتی سکوت از `tickIntervalMs * 2` بیشتر شود | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

سرور `policy.tickIntervalMs`، `policy.maxPayload`، و `policy.maxBufferedBytes` مؤثر را در `hello-ok` اعلام می‌کند؛ کلاینت‌ها باید به‌جای پیش‌فرض‌های پیش از handshake، این مقادیر را رعایت کنند.

## احراز هویت

- احراز هویت Gateway با راز مشترک از `connect.params.auth.token` یا
  `connect.params.auth.password` استفاده می‌کند، بسته به حالت احراز هویت پیکربندی‌شده.
- حالت‌های دارای هویت مانند Tailscale Serve
  (`gateway.auth.allowTailscale: true`) یا غیر loopback
  `gateway.auth.mode: "trusted-proxy"` بررسی احراز هویت connect را از
  سرآیندهای درخواست، به‌جای `connect.params.auth.*`، برآورده می‌کنند.
- ورودی خصوصی `gateway.auth.mode: "none"` احراز هویت connect با راز مشترک را
  کاملاً رد می‌کند؛ این حالت را روی ورودی عمومی/نامطمئن در معرض دسترس قرار ندهید.
- پس از pairing، Gateway یک **توکن دستگاه** صادر می‌کند که به نقش اتصال
  + دامنه‌ها محدود است. این توکن در `hello-ok.auth.deviceToken` بازگردانده می‌شود و باید
  برای اتصال‌های آینده توسط client ذخیره شود.
- Clientها باید پس از هر connect موفق، `hello-ok.auth.deviceToken` اصلی را ذخیره کنند.
- اتصال مجدد با آن توکن دستگاه **ذخیره‌شده** باید مجموعه دامنه‌های تأییدشده ذخیره‌شده
  برای همان توکن را نیز دوباره استفاده کند. این کار دسترسی خواندن/کاوش/وضعیت
  را که قبلاً اعطا شده حفظ می‌کند و از محدود شدن بی‌صدای اتصال‌های مجدد به یک
  دامنه ضمنی باریک‌ترِ فقط مدیر جلوگیری می‌کند.
- ساخت احراز هویت connect در سمت client (`selectConnectAuth` در
  `src/gateway/client.ts`):
  - `auth.password` مستقل است و همیشه هنگام تنظیم شدن ارسال می‌شود.
  - `auth.token` به‌ترتیب اولویت پر می‌شود: ابتدا توکن مشترک صریح،
    سپس یک `deviceToken` صریح، سپس یک توکن ذخیره‌شده به‌ازای هر دستگاه (کلیدشده با
    `deviceId` + `role`).
  - `auth.bootstrapToken` فقط زمانی فرستاده می‌شود که هیچ‌یک از موارد بالا یک
    `auth.token` را حل نکرده باشند. توکن مشترک یا هر توکن دستگاه حل‌شده‌ای آن را سرکوب می‌کند.
  - ارتقای خودکار یک توکن دستگاه ذخیره‌شده در retry یک‌باره
    `AUTH_TOKEN_MISMATCH` فقط برای **نقطه‌های پایانی مورد اعتماد** مجاز است —
    loopback، یا `wss://` با `tlsFingerprint` پین‌شده. `wss://` عمومی
    بدون pinning واجد شرایط نیست.
- ورودی‌های اضافی `hello-ok.auth.deviceTokens` توکن‌های handoff مربوط به bootstrap هستند.
  آن‌ها را فقط زمانی ذخیره کنید که connect از احراز هویت bootstrap روی یک transport مورد اعتماد
  مانند `wss://` یا pairing از نوع loopback/local استفاده کرده باشد.
- اگر client یک `deviceToken` **صریح** یا `scopes` صریح ارائه کند، همان
  مجموعه دامنه درخواست‌شده توسط caller معتبر باقی می‌ماند؛ دامنه‌های cache‌شده فقط
  زمانی دوباره استفاده می‌شوند که client در حال استفاده دوباره از توکن ذخیره‌شده به‌ازای هر دستگاه باشد.
- توکن‌های دستگاه را می‌توان از طریق `device.token.rotate` و
  `device.token.revoke` چرخاند/لغو کرد (نیازمند دامنه `operator.pairing`).
- `device.token.rotate` فراداده rotation را برمی‌گرداند. این متد توکن bearer جایگزین
  را فقط برای فراخوانی‌های همان دستگاه echo می‌کند که از قبل با همان توکن دستگاه
  احراز هویت شده‌اند، تا clientهای فقط‌توکن بتوانند جایگزین خود را پیش از
  اتصال مجدد ذخیره کنند. rotationهای shared/admin توکن bearer را echo نمی‌کنند.
- صدور، rotation، و revocation توکن به مجموعه نقش تأییدشده‌ای محدود می‌ماند
  که در ورودی pairing آن دستگاه ثبت شده است؛ تغییر توکن نمی‌تواند نقش دستگاهی را
  گسترش دهد یا هدف بگیرد که approval مربوط به pairing هرگز اعطا نکرده است.
- برای sessionهای توکن دستگاه pairing‌شده، مدیریت دستگاه self-scoped است مگر اینکه
  caller همچنین `operator.admin` داشته باشد: callerهای غیر admin فقط می‌توانند ورودی دستگاه
  **خودشان** را حذف/revoke/rotate کنند.
- `device.token.rotate` و `device.token.revoke` همچنین مجموعه دامنه توکن operator هدف
  را در برابر دامنه‌های session فعلی caller بررسی می‌کنند. callerهای غیر admin
  نمی‌توانند توکن operator گسترده‌تری از آنچه خودشان دارند rotate یا revoke کنند.
- شکست‌های احراز هویت شامل `error.details.code` به‌همراه راهنمای بازیابی هستند:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- رفتار client برای `AUTH_TOKEN_MISMATCH`:
  - clientهای مورد اعتماد می‌توانند یک retry محدود با توکن cache‌شده به‌ازای هر دستگاه انجام دهند.
  - اگر آن retry شکست بخورد، clientها باید loopهای اتصال مجدد خودکار را متوقف کنند و راهنمای اقدام operator را نمایش دهند.

## هویت دستگاه + pairing

- Nodeها باید یک هویت پایدار دستگاه (`device.id`) را شامل شوند که از
  اثرانگشت keypair مشتق شده است.
- Gatewayها توکن‌ها را به‌ازای هر دستگاه + نقش صادر می‌کنند.
- approvalهای pairing برای شناسه‌های دستگاه جدید لازم هستند مگر اینکه auto-approval محلی
  فعال باشد.
- auto-approval مربوط به pairing حول connectهای مستقیم local loopback متمرکز است.
- OpenClaw همچنین یک مسیر self-connect باریکِ backend/container-local برای
  جریان‌های helper مورد اعتماد با راز مشترک دارد.
- connectهای همان میزبان روی tailnet یا LAN همچنان برای pairing به‌عنوان remote در نظر گرفته می‌شوند و
  به approval نیاز دارند.
- clientهای WS معمولاً هویت `device` را هنگام `connect` شامل می‌کنند (operator +
  node). تنها استثناهای operator بدون دستگاه مسیرهای اعتماد صریح هستند:
  - `gateway.controlUi.allowInsecureAuth=true` برای سازگاری HTTP ناامنِ فقط localhost.
  - احراز هویت موفق operator Control UI با `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass، کاهش امنیت شدید).
  - RPCهای backend مستقیمِ loopback با `gateway-client` که با توکن/رمز عبور مشترک
    Gateway احراز هویت شده‌اند.
- همه اتصال‌ها باید nonce مربوط به `connect.challenge` ارائه‌شده توسط server را امضا کنند.

### عیب‌یابی migration احراز هویت دستگاه

برای clientهای قدیمی که هنوز از رفتار امضای پیش از challenge استفاده می‌کنند، `connect` اکنون
کدهای جزئیات `DEVICE_AUTH_*` را زیر `error.details.code` با یک `error.details.reason` پایدار برمی‌گرداند.

شکست‌های رایج migration:

| پیام                        | details.code                     | details.reason           | معنی                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client مقدار `device.nonce` را حذف کرده (یا خالی فرستاده است). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client با nonce منقضی/اشتباه امضا کرده است.       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload امضا با payload v2 مطابقت ندارد.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp امضاشده خارج از skew مجاز است.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` با اثرانگشت کلید عمومی مطابقت ندارد. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | قالب/canonicalization کلید عمومی شکست خورده است. |

هدف migration:

- همیشه منتظر `connect.challenge` بمانید.
- payload v2 را که شامل nonce سرور است امضا کنید.
- همان nonce را در `connect.params.device.nonce` بفرستید.
- payload امضای ترجیحی `v3` است که علاوه بر فیلدهای device/client/role/scopes/token/nonce،
  `platform` و `deviceFamily` را نیز bind می‌کند.
- امضاهای قدیمی `v2` برای سازگاری همچنان پذیرفته می‌شوند، اما pinning فراداده
  دستگاه pairing‌شده همچنان policy فرمان را هنگام اتصال مجدد کنترل می‌کند.

## TLS + pinning

- TLS برای اتصال‌های WS پشتیبانی می‌شود.
- clientها می‌توانند به‌صورت اختیاری اثرانگشت گواهی Gateway را pin کنند (به پیکربندی `gateway.tls`
  به‌علاوه `gateway.remote.tlsFingerprint` یا CLI `--tls-fingerprint` مراجعه کنید).

## دامنه

این پروتکل **API کامل Gateway** را در معرض دسترس قرار می‌دهد (وضعیت، کانال‌ها، مدل‌ها، chat،
agent، sessionها، nodeها، approvalها، و غیره). سطح دقیق توسط
schemaهای TypeBox در `src/gateway/protocol/schema.ts` تعریف شده است.

## مرتبط

- [پروتکل bridge](/fa/gateway/bridge-protocol)
- [runbook Gateway](/fa/gateway)
