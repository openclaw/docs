---
read_when:
    - به‌روزرسانی طرح‌واره‌های پروتکل یا تولید کد
summary: طرح‌واره‌های TypeBox به‌عنوان تنها منبع حقیقت برای پروتکل gateway
title: TypeBox
x-i18n:
    generated_at: "2026-06-27T17:38:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2f3da11e9dcf3250fd77e0c43f4ed918551a536d93fa71bce95eaf3d7539f6d
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox یک کتابخانهٔ schema با رویکرد TypeScript-first است. ما از آن برای تعریف **پروتکل WebSocket مربوط به Gateway** استفاده می‌کنیم (handshake، request/response، server events). این schemaها **اعتبارسنجی زمان اجرا**، **خروجی JSON Schema**، و **تولید کد Swift** برای برنامهٔ macOS را هدایت می‌کنند. یک منبع حقیقت؛ بقیهٔ چیزها تولید می‌شوند.

اگر زمینهٔ سطح بالاتر پروتکل را می‌خواهید، از
[معماری Gateway](/fa/concepts/architecture) شروع کنید.

## مدل ذهنی (۳۰ ثانیه)

هر پیام Gateway WS یکی از سه frame است:

- **درخواست**: `{ type: "req", id, method, params }`
- **پاسخ**: `{ type: "res", id, ok, payload | error }`
- **رویداد**: `{ type: "event", event, payload, seq?, stateVersion? }`

نخستین frame **باید** یک درخواست `connect` باشد. پس از آن، clientها می‌توانند
methodها را فراخوانی کنند (برای نمونه `health`، `send`، `chat.send`) و در رویدادها مشترک شوند (برای نمونه
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

methodها و eventهای رایج:

| دسته | نمونه‌ها | یادداشت‌ها |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| هسته | `connect`, `health`, `status` | `connect` باید اولین مورد باشد |
| پیام‌رسانی | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effectها به `idempotencyKey` نیاز دارند |
| چت | `chat.history`, `chat.send`, `chat.abort` | WebChat از این‌ها استفاده می‌کند |
| نشست‌ها | `sessions.list`, `sessions.patch`, `sessions.delete` | مدیریت نشست |
| خودکارسازی | `wake`, `cron.list`, `cron.run`, `cron.runs` | کنترل wake + cron |
| Nodeها | `node.list`, `node.invoke`, `node.pair.*` | Gateway WS + کنش‌های node |
| رویدادها | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | ارسال از سمت server |

فهرست معتبر **کشف** تبلیغ‌شده در
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`) قرار دارد.

## محل قرارگیری schemaها

- منبع: `packages/gateway-protocol/src/schema.ts`
- اعتبارسنج‌های زمان اجرا (AJV): `packages/gateway-protocol/src/index.ts`
- رجیستری feature/discovery تبلیغ‌شده: `src/gateway/server-methods-list.ts`
- handshake سرور + dispatch متد: `src/gateway/server.impl.ts`
- client مربوط به Node: `src/gateway/client.ts`
- JSON Schema تولیدشده: `dist/protocol.schema.json`
- مدل‌های Swift تولیدشده: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## pipeline فعلی

- `pnpm protocol:gen`
  - JSON Schema (draft-07) را در `dist/protocol.schema.json` می‌نویسد
- `pnpm protocol:gen:swift`
  - مدل‌های Swift مربوط به gateway را تولید می‌کند
- `pnpm protocol:check`
  - هر دو generator را اجرا می‌کند و بررسی می‌کند خروجی commit شده باشد

## نحوهٔ استفاده از schemaها در زمان اجرا

- **سمت سرور**: هر frame ورودی با AJV اعتبارسنجی می‌شود. handshake فقط
  درخواست `connect`ای را می‌پذیرد که params آن با `ConnectParams` سازگار باشد.
- **سمت client**: client جاوااسکریپت frameهای event و response را پیش از
  استفاده اعتبارسنجی می‌کند.
- **کشف feature**: Gateway یک فهرست محافظه‌کارانهٔ `features.methods`
  و `features.events` را در `hello-ok` از `listGatewayMethods()` و
  `GATEWAY_EVENTS` ارسال می‌کند.
- آن فهرست کشف، dump تولیدشده از همهٔ helperهای قابل فراخوانی در
  `coreGatewayHandlers` نیست؛ برخی helper RPCها در
  `src/gateway/server-methods/*.ts` پیاده‌سازی شده‌اند، بدون اینکه در فهرست feature تبلیغ‌شده
  enumerate شده باشند.

## نمونه frameها

Connect (اولین پیام):

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

## client حداقلی (Node.js)

کوچک‌ترین جریان مفید: connect + health.

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

## مثال کارشده: افزودن یک method به‌صورت end-to-end

مثال: افزودن یک درخواست جدید `system.echo` که `{ ok: true, text }` را برمی‌گرداند.

1. **Schema (منبع حقیقت)**

به `packages/gateway-protocol/src/schema.ts` اضافه کنید:

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

در `packages/gateway-protocol/src/index.ts`، یک اعتبارسنج AJV را export کنید:

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

آن را در `src/gateway/server-methods.ts` ثبت کنید (از قبل `systemHandlers` را merge می‌کند)،
سپس `"system.echo"` را به ورودی `listGatewayMethods` در
`src/gateway/server-methods-list.ts` اضافه کنید.

اگر method توسط operator یا node clientها قابل فراخوانی است، آن را در
`src/gateway/method-scopes.ts` نیز دسته‌بندی کنید تا اعمال scope و تبلیغ feature
در `hello-ok` هم‌راستا بمانند.

4. **تولید مجدد**

```bash
pnpm protocol:check
```

5. **تست‌ها + مستندات**

یک تست سرور در `src/gateway/server.*.test.ts` اضافه کنید و method را در مستندات ذکر کنید.

## رفتار تولید کد Swift

generator مربوط به Swift این موارد را emit می‌کند:

- enum مربوط به `GatewayFrame` با caseهای `req`، `res`، `event`، و `unknown`
- structها/enumهای payload با typeهای قوی
- مقدارهای `ErrorCode`، `GATEWAY_PROTOCOL_VERSION`، و `GATEWAY_MIN_PROTOCOL_VERSION`

نوع‌های ناشناختهٔ frame برای سازگاری رو به جلو به‌صورت raw payload حفظ می‌شوند.

## نسخه‌بندی + سازگاری

- `PROTOCOL_VERSION` در `packages/gateway-protocol/src/version.ts` قرار دارد.
- clientها `minProtocol` + `maxProtocol` را ارسال می‌کنند؛ سرور rangeهایی را که
  پروتکل فعلی آن را شامل نشوند رد می‌کند.
- مدل‌های Swift نوع‌های ناشناختهٔ frame را نگه می‌دارند تا clientهای قدیمی‌تر دچار شکست نشوند.

## الگوها و قراردادهای schema

- بیشتر objectها برای payloadهای سخت‌گیرانه از `additionalProperties: false` استفاده می‌کنند.
- `NonEmptyString` مقدار پیش‌فرض برای IDها و نام‌های method/event است.
- `GatewayFrame` سطح بالا از یک **discriminator** روی `type` استفاده می‌کند.
- methodهایی که side effect دارند معمولاً در params به `idempotencyKey` نیاز دارند
  (مثال: `send`، `poll`، `agent`، `chat.send`).
- `agent` برای زمینهٔ orchestration تولیدشده در زمان اجرا، `internalEvents` اختیاری را می‌پذیرد
  (برای نمونه handoff تکمیل subagent/cron task)؛ این را به‌عنوان سطح API داخلی در نظر بگیرید.

## JSON زندهٔ schema

JSON Schema تولیدشده در repo در `dist/protocol.schema.json` قرار دارد. فایل raw منتشرشده
معمولاً در این نشانی در دسترس است:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## هنگام تغییر schemaها

1. schemaهای TypeBox را به‌روزرسانی کنید.
2. method/event را در `src/gateway/server-methods-list.ts` ثبت کنید.
3. وقتی RPC جدید به دسته‌بندی scope مربوط به operator یا
   node نیاز دارد، `src/gateway/method-scopes.ts` را به‌روزرسانی کنید.
4. `pnpm protocol:check` را اجرا کنید.
5. schema تولیدشده + مدل‌های Swift را commit کنید.

## مرتبط

- [پروتکل خروجی غنی](/fa/reference/rich-output-protocol)
- [adapterهای RPC](/fa/reference/rpc)
