---
read_when:
    - Cập nhật lược đồ giao thức hoặc sinh mã
summary: Các lược đồ TypeBox làm nguồn chân lý duy nhất cho giao thức Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-07T13:15:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95baccfdfa6f77ba57f6ac8502d502084289a84cfd03a450dd1e9422931706dd
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox là thư viện schema ưu tiên TypeScript. Chúng tôi dùng nó để định nghĩa **giao thức WebSocket Gateway** (bắt tay, yêu cầu/phản hồi, sự kiện máy chủ). Các schema đó điều khiển **xác thực khi chạy**, **xuất JSON Schema**, và **sinh mã Swift** cho ứng dụng macOS. Một nguồn sự thật duy nhất; mọi thứ khác đều được tạo ra.

Nếu bạn muốn ngữ cảnh giao thức ở cấp cao hơn, hãy bắt đầu với
[Kiến trúc Gateway](/vi/concepts/architecture).

## Mô hình tư duy (30 giây)

Mọi thông điệp Gateway WS là một trong ba frame:

- **Yêu cầu**: `{ type: "req", id, method, params }`
- **Phản hồi**: `{ type: "res", id, ok, payload | error }`
- **Sự kiện**: `{ type: "event", event, payload, seq?, stateVersion? }`

Frame đầu tiên **phải** là yêu cầu `connect`. Sau đó, ứng dụng khách có thể gọi
các phương thức (ví dụ `health`, `send`, `chat.send`) và đăng ký nhận sự kiện (ví dụ
`presence`, `tick`, `agent`).

Luồng kết nối (tối thiểu):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Các phương thức + sự kiện phổ biến:

| Danh mục   | Ví dụ                                                      | Ghi chú                            |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Lõi        | `connect`, `health`, `status`                              | `connect` phải là đầu tiên         |
| Nhắn tin   | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | tác dụng phụ cần `idempotencyKey`  |
| Trò chuyện | `chat.history`, `chat.send`, `chat.abort`                  | WebChat dùng các mục này           |
| Phiên      | `sessions.list`, `sessions.patch`, `sessions.delete`       | quản trị phiên                     |
| Tự động hóa | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wake + điều khiển cron             |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + hành động node        |
| Sự kiện    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | máy chủ đẩy                        |

Danh mục **khám phá** được quảng bá có thẩm quyền nằm trong
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Nơi đặt schema

- Nguồn: `src/gateway/protocol/schema.ts`
- Bộ xác thực khi chạy (AJV): `src/gateway/protocol/index.ts`
- Registry tính năng/khám phá được quảng bá: `src/gateway/server-methods-list.ts`
- Bắt tay máy chủ + điều phối phương thức: `src/gateway/server.impl.ts`
- Ứng dụng khách Node: `src/gateway/client.ts`
- JSON Schema được tạo: `dist/protocol.schema.json`
- Mô hình Swift được tạo: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline hiện tại

- `pnpm protocol:gen`
  - ghi JSON Schema (draft-07) vào `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - tạo mô hình gateway Swift
- `pnpm protocol:check`
  - chạy cả hai trình tạo và xác minh đầu ra đã được commit

## Cách schema được dùng khi chạy

- **Phía máy chủ**: mọi frame đến đều được xác thực bằng AJV. Bắt tay chỉ
  chấp nhận yêu cầu `connect` có params khớp với `ConnectParams`.
- **Phía ứng dụng khách**: ứng dụng khách JS xác thực các frame sự kiện và phản hồi trước khi
  sử dụng chúng.
- **Khám phá tính năng**: Gateway gửi danh sách `features.methods`
  và `features.events` thận trọng trong `hello-ok` từ `listGatewayMethods()` và
  `GATEWAY_EVENTS`.
- Danh sách khám phá đó không phải là bản kết xuất được tạo của mọi helper có thể gọi trong
  `coreGatewayHandlers`; một số RPC helper được triển khai trong
  `src/gateway/server-methods/*.ts` mà không được liệt kê trong danh sách
  tính năng được quảng bá.

## Frame ví dụ

Connect (thông điệp đầu tiên):

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

Phản hồi Hello-ok:

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

Yêu cầu + phản hồi:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Sự kiện:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Ứng dụng khách tối thiểu (Node.js)

Luồng hữu ích nhỏ nhất: connect + health.

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

## Ví dụ hoàn chỉnh: thêm một phương thức từ đầu đến cuối

Ví dụ: thêm yêu cầu `system.echo` mới trả về `{ ok: true, text }`.

1. **Schema (nguồn sự thật)**

Thêm vào `src/gateway/protocol/schema.ts`:

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

Thêm cả hai vào `ProtocolSchemas` và xuất kiểu:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Xác thực**

Trong `src/gateway/protocol/index.ts`, xuất một bộ xác thực AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Hành vi máy chủ**

Thêm một handler trong `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Đăng ký nó trong `src/gateway/server-methods.ts` (đã hợp nhất `systemHandlers`),
sau đó thêm `"system.echo"` vào đầu vào `listGatewayMethods` trong
`src/gateway/server-methods-list.ts`.

Nếu phương thức có thể được gọi bởi ứng dụng khách operator hoặc node, cũng phân loại nó trong
`src/gateway/method-scopes.ts` để việc thực thi scope và quảng bá tính năng `hello-ok`
luôn đồng bộ.

4. **Tạo lại**

```bash
pnpm protocol:check
```

5. **Kiểm thử + tài liệu**

Thêm kiểm thử máy chủ trong `src/gateway/server.*.test.ts` và ghi chú phương thức trong tài liệu.

## Hành vi sinh mã Swift

Trình tạo Swift phát ra:

- enum `GatewayFrame` với các trường hợp `req`, `res`, `event`, và `unknown`
- struct/enum payload có kiểu mạnh
- giá trị `ErrorCode` và `GATEWAY_PROTOCOL_VERSION`

Các kiểu frame không xác định được giữ nguyên dưới dạng payload thô để tương thích về sau.

## Phiên bản + tương thích

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/version.ts`.
- Ứng dụng khách gửi `minProtocol` + `maxProtocol`; máy chủ từ chối các trường hợp không khớp.
- Các mô hình Swift giữ lại kiểu frame không xác định để tránh làm hỏng ứng dụng khách cũ.

## Mẫu schema và quy ước

- Hầu hết object dùng `additionalProperties: false` để có payload nghiêm ngặt.
- `NonEmptyString` là mặc định cho ID và tên phương thức/sự kiện.
- `GatewayFrame` cấp cao nhất dùng một **discriminator** trên `type`.
- Các phương thức có tác dụng phụ thường yêu cầu `idempotencyKey` trong params
  (ví dụ: `send`, `poll`, `agent`, `chat.send`).
- `agent` chấp nhận `internalEvents` tùy chọn cho ngữ cảnh điều phối được tạo khi chạy
  (ví dụ bàn giao hoàn tất tác vụ subagent/cron); hãy xem đây là bề mặt API nội bộ.

## JSON schema trực tiếp

JSON Schema được tạo nằm trong repo tại `dist/protocol.schema.json`. Tệp thô đã xuất bản thường có sẵn tại:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Khi bạn thay đổi schema

1. Cập nhật schema TypeBox.
2. Đăng ký phương thức/sự kiện trong `src/gateway/server-methods-list.ts`.
3. Cập nhật `src/gateway/method-scopes.ts` khi RPC mới cần phân loại scope operator hoặc
   node.
4. Chạy `pnpm protocol:check`.
5. Commit schema được tạo lại + mô hình Swift.

## Liên quan

- [Giao thức đầu ra phong phú](/vi/reference/rich-output-protocol)
- [Bộ chuyển đổi RPC](/vi/reference/rpc)
