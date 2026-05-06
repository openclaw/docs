---
read_when:
    - به‌روزرسانی طرح‌واره‌های پروتکل یا تولید کد
summary: طرحواره‌های TypeBox به‌عنوان منبع حقیقت واحد برای پروتکل Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T09:14:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox یک کتابخانهٔ طرح‌واره با رویکرد TypeScript-first است. ما از آن برای تعریف **پروتکل Gateway
WebSocket** (دست‌دهی، درخواست/پاسخ، رویدادهای سرور) استفاده می‌کنیم. این طرح‌واره‌ها
**اعتبارسنجی زمان اجرا**، **خروجی JSON Schema** و **تولید کد Swift** را برای
برنامهٔ macOS هدایت می‌کنند. یک منبع حقیقت؛ بقیهٔ موارد تولید می‌شوند.

اگر زمینهٔ سطح‌بالاتر پروتکل را می‌خواهید، از
[معماری Gateway](/fa/concepts/architecture) شروع کنید.

## مدل ذهنی (۳۰ ثانیه)

هر پیام Gateway WS یکی از سه فریم است:

- **درخواست**: `{ type: "req", id, method, params }`
- **پاسخ**: `{ type: "res", id, ok, payload | error }`
- **رویداد**: `{ type: "event", event, payload, seq?, stateVersion? }`

اولین فریم **باید** یک درخواست `connect` باشد. پس از آن، کلاینت‌ها می‌توانند
متدها را فراخوانی کنند (مثلاً `health`، `send`، `chat.send`) و در رویدادها مشترک شوند (مثلاً
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

متدها + رویدادهای رایج:

| دسته‌بندی | نمونه‌ها                                                   | یادداشت‌ها                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| هسته       | `connect`, `health`, `status`                              | `connect` باید اول باشد            |
| پیام‌رسانی  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | اثرات جانبی به `idempotencyKey` نیاز دارند |
| چت       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat از این‌ها استفاده می‌کند                 |
| نشست‌ها   | `sessions.list`, `sessions.patch`, `sessions.delete`       | مدیریت نشست                      |
| خودکارسازی | `wake`, `cron.list`, `cron.run`, `cron.runs`               | بیدارسازی + کنترل cron                |
| Nodeها      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + کنش‌های node          |
| رویدادها     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | پوش سرور                        |

موجودی معتبر **کشف** تبلیغ‌شده در
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`) قرار دارد.

## محل قرارگیری طرح‌واره‌ها

- منبع: `src/gateway/protocol/schema.ts`
- اعتبارسنج‌های زمان اجرا (AJV): `src/gateway/protocol/index.ts`
- رجیستری قابلیت/کشف تبلیغ‌شده: `src/gateway/server-methods-list.ts`
- دست‌دهی سرور + توزیع متد: `src/gateway/server.impl.ts`
- کلاینت Node: `src/gateway/client.ts`
- JSON Schema تولیدشده: `dist/protocol.schema.json`
- مدل‌های Swift تولیدشده: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## پایپ‌لاین فعلی

- `pnpm protocol:gen`
  - JSON Schema (draft-07) را در `dist/protocol.schema.json` می‌نویسد
- `pnpm protocol:gen:swift`
  - مدل‌های Gateway برای Swift را تولید می‌کند
- `pnpm protocol:check`
  - هر دو تولیدکننده را اجرا می‌کند و بررسی می‌کند خروجی commit شده باشد

## نحوهٔ استفاده از طرح‌واره‌ها در زمان اجرا

- **سمت سرور**: هر فریم ورودی با AJV اعتبارسنجی می‌شود. دست‌دهی فقط
  درخواست `connect`ای را می‌پذیرد که params آن با `ConnectParams` مطابقت داشته باشد.
- **سمت کلاینت**: کلاینت JS فریم‌های رویداد و پاسخ را پیش از
  استفاده اعتبارسنجی می‌کند.
- **کشف قابلیت**: Gateway فهرست محافظه‌کارانهٔ `features.methods`
  و `features.events` را در `hello-ok` از `listGatewayMethods()` و
  `GATEWAY_EVENTS` می‌فرستد.
- آن فهرست کشف، dump تولیدشده از هر helper قابل فراخوانی در
  `coreGatewayHandlers` نیست؛ برخی helper RPCها در
  `src/gateway/server-methods/*.ts` پیاده‌سازی شده‌اند بی‌آنکه در فهرست قابلیت
  تبلیغ‌شده شمارش شوند.

## نمونه فریم‌ها

Connect (اولین پیام):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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
    "protocol": 3,
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
        minProtocol: 3,
        maxProtocol: 3,
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

## مثال کامل: افزودن یک متد از ابتدا تا انتها

مثال: افزودن درخواست جدید `system.echo` که `{ ok: true, text }` را برمی‌گرداند.

1. **طرح‌واره (منبع حقیقت)**

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

در `src/gateway/protocol/index.ts`، یک اعتبارسنج AJV export کنید:

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

اگر متد توسط کلاینت‌های operator یا node قابل فراخوانی است، آن را در
`src/gateway/method-scopes.ts` نیز طبقه‌بندی کنید تا اعمال scope و تبلیغ قابلیت
`hello-ok` هم‌راستا بمانند.

4. **تولید دوباره**

```bash
pnpm protocol:check
```

5. **تست‌ها + مستندات**

یک تست سرور در `src/gateway/server.*.test.ts` اضافه کنید و متد را در مستندات ذکر کنید.

## رفتار تولید کد Swift

تولیدکنندهٔ Swift این موارد را منتشر می‌کند:

- enum به نام `GatewayFrame` با caseهای `req`، `res`، `event` و `unknown`
- structها/enumهای payload با type قوی
- مقادیر `ErrorCode` و `GATEWAY_PROTOCOL_VERSION`

نوع‌های ناشناختهٔ فریم برای سازگاری رو به جلو به‌صورت payload خام حفظ می‌شوند.

## نسخه‌بندی + سازگاری

- `PROTOCOL_VERSION` در `src/gateway/protocol/schema.ts` قرار دارد.
- کلاینت‌ها `minProtocol` + `maxProtocol` را می‌فرستند؛ سرور ناسازگاری‌ها را رد می‌کند.
- مدل‌های Swift نوع‌های ناشناختهٔ فریم را نگه می‌دارند تا کلاینت‌های قدیمی‌تر نشکنند.

## الگوها و قراردادهای طرح‌واره

- بیشتر objectها برای payloadهای سخت‌گیرانه از `additionalProperties: false` استفاده می‌کنند.
- `NonEmptyString` مقدار پیش‌فرض برای IDها و نام‌های متد/رویداد است.
- `GatewayFrame` سطح بالا از یک **discriminator** روی `type` استفاده می‌کند.
- متدهایی با اثرات جانبی معمولاً به یک `idempotencyKey` در params نیاز دارند
  (مثال: `send`، `poll`، `agent`، `chat.send`).
- `agent` مقدار اختیاری `internalEvents` را برای زمینهٔ ارکستراسیون تولیدشده در زمان اجرا می‌پذیرد
  (برای مثال تحویل تکمیل وظیفهٔ subagent/cron)؛ این را به‌عنوان سطح API داخلی در نظر بگیرید.

## JSON زندهٔ طرح‌واره

JSON Schema تولیدشده در repo در `dist/protocol.schema.json` قرار دارد. فایل خام
منتشرشده معمولاً در این آدرس در دسترس است:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## وقتی طرح‌واره‌ها را تغییر می‌دهید

1. طرح‌واره‌های TypeBox را به‌روزرسانی کنید.
2. متد/رویداد را در `src/gateway/server-methods-list.ts` ثبت کنید.
3. وقتی RPC جدید به طبقه‌بندی scope مربوط به operator یا
   node نیاز دارد، `src/gateway/method-scopes.ts` را به‌روزرسانی کنید.
4. `pnpm protocol:check` را اجرا کنید.
5. طرح‌وارهٔ تولیدشده + مدل‌های Swift را commit کنید.

## مرتبط

- [پروتکل خروجی غنی](/fa/reference/rich-output-protocol)
- [آداپتورهای RPC](/fa/reference/rpc)
