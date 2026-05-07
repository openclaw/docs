---
read_when:
    - به‌روزرسانی طرح‌واره‌های پروتکل یا تولید کد
summary: طرح‌واره‌های TypeBox به‌عنوان تنها منبع حقیقت برای پروتکل Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-07T13:16:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95baccfdfa6f77ba57f6ac8502d502084289a84cfd03a450dd1e9422931706dd
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox یک کتابخانهٔ schema با رویکرد TypeScript-first است. ما از آن برای تعریف **پروتکل WebSocket
Gateway** استفاده می‌کنیم (handshake، request/response، رویدادهای سرور). این schemaها
**اعتبارسنجی runtime**، **خروجی JSON Schema** و **تولید کد Swift** برای
اپ macOS را هدایت می‌کنند. یک منبع حقیقت؛ هر چیز دیگری تولید می‌شود.

اگر زمینهٔ سطح‌بالای پروتکل را می‌خواهید، از
[معماری Gateway](/fa/concepts/architecture) شروع کنید.

## مدل ذهنی (۳۰ ثانیه)

هر پیام WS مربوط به Gateway یکی از سه frame است:

- **درخواست**: `{ type: "req", id, method, params }`
- **پاسخ**: `{ type: "res", id, ok, payload | error }`
- **رویداد**: `{ type: "event", event, payload, seq?, stateVersion? }`

اولین frame **باید** یک درخواست `connect` باشد. پس از آن، کلاینت‌ها می‌توانند
methodها را فراخوانی کنند (برای مثال `health`، `send`، `chat.send`) و در رویدادها مشترک شوند (برای مثال
`presence`، `tick`، `agent`).

جریان اتصال (حداقلی):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

methodها + رویدادهای رایج:

| دسته‌بندی | نمونه‌ها                                                   | یادداشت‌ها                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| هسته       | `connect`, `health`, `status`                              | `connect` باید اول باشد            |
| پیام‌رسانی  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | اثرات جانبی به `idempotencyKey` نیاز دارند |
| چت       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat از این‌ها استفاده می‌کند                 |
| نشست‌ها   | `sessions.list`, `sessions.patch`, `sessions.delete`       | مدیریت نشست                      |
| خودکارسازی | `wake`, `cron.list`, `cron.run`, `cron.runs`               | کنترل wake + cron                |
| Nodeها      | `node.list`, `node.invoke`, `node.pair.*`                  | WS مربوط به Gateway + کنش‌های node          |
| رویدادها     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push سرور                        |

فهرست معتبر **discovery** اعلام‌شده در
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`) قرار دارد.

## محل schemaها

- منبع: `src/gateway/protocol/schema.ts`
- اعتبارسنج‌های runtime (AJV): `src/gateway/protocol/index.ts`
- رجیستری feature/discovery اعلام‌شده: `src/gateway/server-methods-list.ts`
- handshake سرور + dispatch کردن method: `src/gateway/server.impl.ts`
- کلاینت Node: `src/gateway/client.ts`
- JSON Schema تولیدشده: `dist/protocol.schema.json`
- مدل‌های Swift تولیدشده: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## pipeline فعلی

- `pnpm protocol:gen`
  - JSON Schema (draft-07) را در `dist/protocol.schema.json` می‌نویسد
- `pnpm protocol:gen:swift`
  - مدل‌های Gateway مربوط به Swift را تولید می‌کند
- `pnpm protocol:check`
  - هر دو generator را اجرا می‌کند و تأیید می‌کند خروجی commit شده است

## نحوهٔ استفاده از schemaها در runtime

- **سمت سرور**: هر frame ورودی با AJV اعتبارسنجی می‌شود. handshake فقط
  درخواست `connect` را می‌پذیرد که params آن با `ConnectParams` منطبق باشد.
- **سمت کلاینت**: کلاینت JS پیش از استفاده از frameهای رویداد و پاسخ، آن‌ها را اعتبارسنجی می‌کند.
- **feature discovery**: Gateway یک فهرست محافظه‌کارانهٔ `features.methods`
  و `features.events` را در `hello-ok` از `listGatewayMethods()` و
  `GATEWAY_EVENTS` می‌فرستد.
- آن فهرست discovery یک dump تولیدشده از همهٔ helperهای قابل فراخوانی در
  `coreGatewayHandlers` نیست؛ برخی RPCهای helper در
  `src/gateway/server-methods/*.ts` پیاده‌سازی شده‌اند بدون اینکه در فهرست feature
  اعلام‌شده شمارش شوند.

## frameهای نمونه

اتصال (اولین پیام):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

درخواست + پاسخ:

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

کوچک‌ترین جریان مفید: اتصال + health.

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

## مثال عملی: افزودن یک method از ابتدا تا انتها

مثال: یک درخواست جدید `system.echo` اضافه کنید که `{ ok: true, text }` برمی‌گرداند.

1. **Schema (منبع حقیقت)**

به `src/gateway/protocol/schema.ts` اضافه کنید:

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

هر دو را به `ProtocolSchemas` اضافه کنید و typeها را export کنید:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **اعتبارسنجی**

در `src/gateway/protocol/index.ts`، یک اعتبارسنج AJV را export کنید:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **رفتار سرور**

یک handler در `src/gateway/server-methods/system.ts` اضافه کنید:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

آن را در `src/gateway/server-methods.ts` ثبت کنید (هم‌اکنون `systemHandlers` را merge می‌کند)،
سپس `"system.echo"` را به ورودی `listGatewayMethods` در
`src/gateway/server-methods-list.ts` اضافه کنید.

اگر method توسط کلاینت‌های operator یا node قابل فراخوانی است، آن را در
`src/gateway/method-scopes.ts` نیز طبقه‌بندی کنید تا scope enforcement و اعلام feature در `hello-ok`
هماهنگ بمانند.

4. **تولید دوباره**

```bash
pnpm protocol:check
```

5. **تست‌ها + مستندات**

یک تست سرور در `src/gateway/server.*.test.ts` اضافه کنید و method را در مستندات ذکر کنید.

## رفتار تولید کد Swift

generator مربوط به Swift این موارد را emit می‌کند:

- enum مربوط به `GatewayFrame` با caseهای `req`، `res`، `event` و `unknown`
- structها/enumهای payload با type قوی
- مقادیر `ErrorCode` و `GATEWAY_PROTOCOL_VERSION`

typeهای ناشناختهٔ frame برای سازگاری رو به جلو به صورت payload خام حفظ می‌شوند.

## نسخه‌بندی + سازگاری

- `PROTOCOL_VERSION` در `src/gateway/protocol/version.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را می‌فرستند؛ سرور mismatchها را رد می‌کند.
- مدل‌های Swift برای جلوگیری از شکستن کلاینت‌های قدیمی‌تر، typeهای ناشناختهٔ frame را نگه می‌دارند.

## الگوها و قراردادهای schema

- بیشتر objectها برای payloadهای strict از `additionalProperties: false` استفاده می‌کنند.
- `NonEmptyString` پیش‌فرض برای IDها و نام‌های method/event است.
- `GatewayFrame` سطح بالا از یک **discriminator** روی `type` استفاده می‌کند.
- methodهایی که اثر جانبی دارند معمولاً به یک `idempotencyKey` در params نیاز دارند
  (مثال: `send`، `poll`، `agent`، `chat.send`).
- `agent` مقدار اختیاری `internalEvents` را برای زمینهٔ orchestration تولیدشده در runtime می‌پذیرد
  (برای مثال تحویل تکمیل subagent/cron task)؛ با این مورد به عنوان سطح API داخلی رفتار کنید.

## JSON زندهٔ schema

JSON Schema تولیدشده در repo و در `dist/protocol.schema.json` قرار دارد. فایل raw منتشرشده معمولاً در اینجا در دسترس است:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## وقتی schemaها را تغییر می‌دهید

1. schemaهای TypeBox را به‌روزرسانی کنید.
2. method/event را در `src/gateway/server-methods-list.ts` ثبت کنید.
3. وقتی RPC جدید به طبقه‌بندی scope مربوط به operator یا
   node نیاز دارد، `src/gateway/method-scopes.ts` را به‌روزرسانی کنید.
4. `pnpm protocol:check` را اجرا کنید.
5. schema تولیدشدهٔ دوباره + مدل‌های Swift را commit کنید.

## مرتبط

- [پروتکل خروجی غنی](/fa/reference/rich-output-protocol)
- [adapterهای RPC](/fa/reference/rpc)
