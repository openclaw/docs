---
read_when:
    - به‌روزرسانی طرح‌واره‌های پروتکل یا تولید کد
summary: طرح‌واره‌های TypeBox به‌عنوان تنها منبع حقیقت برای پروتکل Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T09:54:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox یک کتابخانهٔ طرح‌واره با رویکرد TypeScript-first است. OpenClaw از آن برای تعریف **پروتکل WebSocket در Gateway** (دست‌دهی، درخواست/پاسخ و رویدادهای سرور) استفاده می‌کند. این طرح‌واره‌ها مبنای **اعتبارسنجی زمان اجرا** (AJV)، **صدور JSON Schema** و **تولید کد Swift** برای برنامهٔ macOS هستند. یک منبع حقیقت وجود دارد و هر چیز دیگری از روی آن تولید می‌شود.

برای آشنایی با زمینهٔ سطح‌بالاتر پروتکل، از [معماری Gateway](/fa/concepts/architecture) شروع کنید.

## مدل ذهنی (۳۰ ثانیه)

هر پیام WS در Gateway یکی از سه قاب زیر است:

- **درخواست**: `{ type: "req", id, method, params }`
- **پاسخ**: `{ type: "res", id, ok, payload | error }`
- **رویداد**: `{ type: "event", event, payload, seq?, stateVersion? }`

قاب نخست **باید** یک درخواست `connect` باشد. پس از آن، کلاینت‌ها متدها را فراخوانی می‌کنند (برای مثال `health`، `send` و `chat.send`) و مشترک رویدادها می‌شوند (برای مثال `presence`، `tick` و `agent`).

جریان اتصال (حداقلی):

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

متدها و رویدادهای رایج:

| دسته       | نمونه‌ها                                                     | توضیحات                                          |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------ |
| هسته       | `connect`، `health`، `status`                                | `connect` باید نخستین مورد باشد                  |
| پیام‌رسانی | `send`، `agent`، `agent.wait`، `system-event`، `logs.tail`   | متدهای دارای اثر جانبی به `idempotencyKey` نیاز دارند |
| گفت‌وگو    | `chat.history`، `chat.send`، `chat.abort`                    | WebChat از این موارد استفاده می‌کند              |
| نشست‌ها    | `sessions.list`، `sessions.patch`، `sessions.delete`         | مدیریت نشست                                      |
| خودکارسازی | `wake`، `cron.list`، `cron.run`، `cron.runs`                 | کنترل بیدارسازی و cron                           |
| Nodeها     | `node.list`، `node.invoke`، `node.pair.*`                    | WS در Gateway به‌همراه کنش‌های Node              |
| رویدادها   | `tick`، `presence`، `agent`، `chat`، `health`، `shutdown`    | ارسال از سوی سرور                                |

فهرست مرجع و اعلام‌شدهٔ **کشف قابلیت‌ها** در `src/gateway/server-methods-list.ts` (`listGatewayMethods`، `GATEWAY_EVENTS`) قرار دارد.

## محل طرح‌واره‌ها

- فایل تجمیعی منبع: `packages/gateway-protocol/src/schema.ts` ماژول‌های دامنه را از `packages/gateway-protocol/src/schema/*.ts` بازصادر می‌کند (`frames.ts` برای پوشش‌های سطح‌بالا و دست‌دهی و فایل‌های `agent.ts`، `sessions.ts`، `cron.ts` و غیره برای هر حوزهٔ قابلیت). فایل `protocol-schemas.ts` رجیستری مرکزی `ProtocolSchemas` است که نام طرح‌واره‌ها را به تعریف‌های TypeBox آن‌ها نگاشت می‌کند.
- اعتبارسنج‌های زمان اجرا (AJV): `packages/gateway-protocol/src/index.ts`
- رجیستری قابلیت‌ها/کشف اعلام‌شده: `src/gateway/server-methods-list.ts`
- دست‌دهی سرور و هدایت متدها: `src/gateway/server.impl.ts`
- کلاینت Node: `src/gateway/client.ts`
- JSON Schema تولیدشده: `dist/protocol.schema.json` (خروجی ساخت، ثبت‌نشده در مخزن)
- مدل‌های Swift تولیدشده: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## خط لولهٔ فعلی

- `pnpm protocol:gen`، JSON Schema (نسخهٔ draft-07) را در `dist/protocol.schema.json` می‌نویسد.
- `pnpm protocol:gen:swift` مدل‌های Swift مربوط به Gateway را تولید می‌کند.
- `pnpm protocol:check` هر دو مولد را اجرا و بررسی می‌کند که خروجی Swift در مخزن ثبت شده باشد (خروجی JSON Schema یک محصول جانبی ساخت است که Git آن را نادیده می‌گیرد).

## نحوهٔ استفاده از طرح‌واره‌ها در زمان اجرا

- **سمت سرور**: هر قاب ورودی با AJV اعتبارسنجی می‌شود. دست‌دهی فقط درخواست `connect`ای را می‌پذیرد که پارامترهای آن با `ConnectParams` مطابقت داشته باشند.
- **سمت کلاینت**: کلاینت JS قاب‌های رویداد و پاسخ را پیش از استفاده اعتبارسنجی می‌کند.
- **کشف قابلیت‌ها**: Gateway در `hello-ok` فهرستی محافظه‌کارانه از `features.methods` و `features.events` را از `listGatewayMethods()` و `GATEWAY_EVENTS` ارسال می‌کند.
- این فهرست کشف، تخلیه‌ای تولیدشده از تمام توابع کمکی قابل فراخوانی در `coreGatewayHandlers` نیست؛ برخی RPCهای کمکی در `src/gateway/server-methods/*.ts` پیاده‌سازی شده‌اند، بی‌آنکه در فهرست قابلیت‌های اعلام‌شده برشمرده شوند.

## نمونهٔ قاب‌ها

اتصال (نخستین پیام):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

پاسخ Hello-ok:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

درخواست و پاسخ:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

رویداد:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## کلاینت حداقلی (Node.js)

کوچک‌ترین جریان کاربردی: اتصال + بررسی سلامت.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 4,
        maxProtocol: 4,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## مثال عملی: افزودن سرتاسری یک متد

مثال: افزودن درخواست جدید `system.echo` که `{ ok: true, text }` را برمی‌گرداند.

1. **طرح‌واره (منبع حقیقت)**

به `packages/gateway-protocol/src/schema/system.ts` (یا نزدیک‌ترین ماژول قابلیت مرتبط) اضافه کنید:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

هر دو را در `packages/gateway-protocol/src/schema/protocol-schemas.ts` وارد کنید، آن‌ها را به رجیستری `ProtocolSchemas` بیفزایید و نوع‌های مشتق‌شده را صادر کنید:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **اعتبارسنجی**

در `packages/gateway-protocol/src/index.ts` یک اعتبارسنج AJV صادر کنید:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **رفتار سرور**

یک کنترل‌گر در `src/gateway/server-methods/system.ts` اضافه کنید:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

آن را در `src/gateway/server-methods.ts` ثبت کنید (این فایل از قبل `systemHandlers` را ادغام می‌کند)، سپس `"system.echo"` را به ورودی `listGatewayMethods` در `src/gateway/server-methods-list.ts` اضافه کنید.

اگر این متد توسط کلاینت‌های عملگر یا Node قابل فراخوانی است، آن را در `src/gateway/method-scopes.ts` نیز طبقه‌بندی کنید تا اعمال دامنهٔ دسترسی و اعلام قابلیت‌ها در `hello-ok` هم‌راستا بمانند.

4. **تولید مجدد**

```bash
pnpm protocol:check
```

5. **آزمون‌ها و مستندات**

یک آزمون سرور در `src/gateway/server.*.test.ts` اضافه کنید و متد را در مستندات ذکر کنید.

## رفتار تولید کد Swift

مولد Swift موارد زیر را تولید می‌کند:

- یک enum به نام `GatewayFrame` با حالت‌های `req`، `res`، `event` و `unknown`
- ساختارها و enumهای payload با نوع‌دهی قوی
- مقادیر `ErrorCode`، `GATEWAY_PROTOCOL_VERSION` و `GATEWAY_MIN_PROTOCOL_VERSION`

نوع‌های ناشناختهٔ قاب برای سازگاری رو‌به‌جلو به‌صورت payload خام حفظ می‌شوند.

## نسخه‌بندی و سازگاری

- `PROTOCOL_VERSION` در `packages/gateway-protocol/src/version.ts` قرار دارد (مقدار فعلی: `4`).
- کلاینت‌ها `minProtocol` و `maxProtocol` را ارسال می‌کنند؛ سرور بازه‌هایی را که پروتکل فعلی‌اش را در بر نگیرند رد می‌کند.
- مدل‌های Swift نوع‌های ناشناختهٔ قاب را حفظ می‌کنند تا کلاینت‌های قدیمی‌تر از کار نیفتند.

## الگوها و قراردادهای طرح‌واره

- بیشتر اشیا برای payloadهای سخت‌گیرانه از `additionalProperties: false` استفاده می‌کنند.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) گزینهٔ پیش‌فرض برای شناسه‌ها و نام متدها/رویدادها است.
- `GatewayFrame` سطح‌بالا از یک **تفکیک‌گر** روی `type` استفاده می‌کند.
- متدهای دارای اثر جانبی معمولاً در پارامترهای خود به `idempotencyKey` نیاز دارند (مثال: `send`، `poll`، `agent`، `chat.send`).
- `agent` مقدار اختیاری `internalEvents` را برای زمینهٔ هماهنگ‌سازی تولیدشده در زمان اجرا می‌پذیرد (برای مثال تحویل تکمیل وظیفهٔ زیرعامل/cron)؛ این مورد را یک سطح API داخلی در نظر بگیرید.

## JSON زندهٔ طرح‌واره

JSON Schema تولیدشده یک محصول جانبی ساخت است و در مخزن ثبت نمی‌شود. فایل خام منتشرشده معمولاً در نشانی زیر در دسترس است:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## هنگام تغییر طرح‌واره‌ها

1. طرح‌واره‌های TypeBox را در ماژول مالک `packages/gateway-protocol/src/schema/*.ts` به‌روزرسانی و آن‌ها را در `protocol-schemas.ts` ثبت کنید.
2. متد/رویداد را در `src/gateway/server-methods-list.ts` ثبت کنید.
3. هنگامی که RPC جدید به طبقه‌بندی دامنهٔ دسترسی عملگر یا Node نیاز دارد، `src/gateway/method-scopes.ts` را به‌روزرسانی کنید.
4. دستور `pnpm protocol:check` را اجرا کنید.
5. مدل‌های Swift بازتولیدشده را ثبت کنید.

## مرتبط

- [پروتکل خروجی غنی](/fa/reference/rich-output-protocol)
- [آداپتورهای RPC](/fa/reference/rpc)
