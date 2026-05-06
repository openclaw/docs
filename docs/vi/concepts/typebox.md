---
read_when:
    - Cập nhật lược đồ giao thức hoặc tạo mã
summary: Các lược đồ TypeBox là nguồn chân lý duy nhất cho giao thức Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T09:10:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox là thư viện lược đồ ưu tiên TypeScript. Chúng tôi dùng nó để định nghĩa **giao thức Gateway
WebSocket** (bắt tay, yêu cầu/phản hồi, sự kiện máy chủ). Các lược đồ đó
điều khiển **xác thực runtime**, **xuất JSON Schema**, và **sinh mã Swift** cho
ứng dụng macOS. Một nguồn chân lý duy nhất; mọi thứ khác đều được tạo sinh.

Nếu bạn muốn ngữ cảnh giao thức cấp cao hơn, hãy bắt đầu với
[kiến trúc Gateway](/vi/concepts/architecture).

## Mô hình tư duy (30 giây)

Mỗi thông điệp Gateway WS là một trong ba khung:

- **Yêu cầu**: `{ type: "req", id, method, params }`
- **Phản hồi**: `{ type: "res", id, ok, payload | error }`
- **Sự kiện**: `{ type: "event", event, payload, seq?, stateVersion? }`

Khung đầu tiên **phải** là một yêu cầu `connect`. Sau đó, client có thể gọi
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
| Cốt lõi    | `connect`, `health`, `status`                              | `connect` phải là đầu tiên         |
| Nhắn tin   | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | tác dụng phụ cần `idempotencyKey`  |
| Trò chuyện | `chat.history`, `chat.send`, `chat.abort`                  | WebChat dùng các phương thức này   |
| Phiên      | `sessions.list`, `sessions.patch`, `sessions.delete`       | quản trị phiên                     |
| Tự động hóa | `wake`, `cron.list`, `cron.run`, `cron.runs`              | điều khiển wake + cron             |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + hành động node        |
| Sự kiện    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | máy chủ đẩy                        |

Kho **discovery** được quảng bá có thẩm quyền nằm trong
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Nơi đặt các lược đồ

- Nguồn: `src/gateway/protocol/schema.ts`
- Bộ xác thực runtime (AJV): `src/gateway/protocol/index.ts`
- Registry tính năng/discovery được quảng bá: `src/gateway/server-methods-list.ts`
- Bắt tay máy chủ + điều phối phương thức: `src/gateway/server.impl.ts`
- Client Node: `src/gateway/client.ts`
- JSON Schema được tạo sinh: `dist/protocol.schema.json`
- Model Swift được tạo sinh: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline hiện tại

- `pnpm protocol:gen`
  - ghi JSON Schema (draft-07) vào `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - tạo các model Gateway Swift
- `pnpm protocol:check`
  - chạy cả hai bộ tạo sinh và xác minh đầu ra đã được commit

## Cách các lược đồ được dùng ở runtime

- **Phía máy chủ**: mọi khung đến đều được xác thực bằng AJV. Bắt tay chỉ
  chấp nhận một yêu cầu `connect` có params khớp với `ConnectParams`.
- **Phía client**: client JS xác thực các khung sự kiện và phản hồi trước khi
  sử dụng chúng.
- **Discovery tính năng**: Gateway gửi danh sách `features.methods`
  và `features.events` thận trọng trong `hello-ok` từ `listGatewayMethods()` và
  `GATEWAY_EVENTS`.
- Danh sách discovery đó không phải là bản đổ được tạo sinh của mọi helper có thể gọi trong
  `coreGatewayHandlers`; một số RPC helper được triển khai trong
  `src/gateway/server-methods/*.ts` mà không được liệt kê trong danh sách
  tính năng được quảng bá.

## Khung ví dụ

Connect (thông điệp đầu tiên):

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

Phản hồi hello-ok:

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

## Client tối thiểu (Node.js)

Luồng hữu ích nhỏ nhất: kết nối + health.

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

## Ví dụ đầy đủ: thêm một phương thức từ đầu đến cuối

Ví dụ: thêm một yêu cầu `system.echo` mới trả về `{ ok: true, text }`.

1. **Lược đồ (nguồn chân lý)**

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

Thêm cả hai vào `ProtocolSchemas` và xuất các kiểu:

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
rồi thêm `"system.echo"` vào đầu vào `listGatewayMethods` trong
`src/gateway/server-methods-list.ts`.

Nếu phương thức có thể được gọi bởi client operator hoặc node, cũng phân loại nó trong
`src/gateway/method-scopes.ts` để thực thi scope và quảng bá tính năng `hello-ok`
luôn đồng bộ.

4. **Tạo sinh lại**

```bash
pnpm protocol:check
```

5. **Kiểm thử + tài liệu**

Thêm một kiểm thử máy chủ trong `src/gateway/server.*.test.ts` và ghi chú phương thức này trong tài liệu.

## Hành vi sinh mã Swift

Bộ tạo Swift phát ra:

- enum `GatewayFrame` với các case `req`, `res`, `event`, và `unknown`
- Các struct/enum payload được định kiểu mạnh
- Giá trị `ErrorCode` và `GATEWAY_PROTOCOL_VERSION`

Các kiểu khung không xác định được giữ nguyên dưới dạng payload thô để tương thích tiến.

## Phiên bản + tương thích

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/schema.ts`.
- Client gửi `minProtocol` + `maxProtocol`; máy chủ từ chối khi không khớp.
- Các model Swift giữ lại kiểu khung không xác định để tránh làm hỏng client cũ hơn.

## Mẫu và quy ước lược đồ

- Hầu hết đối tượng dùng `additionalProperties: false` cho payload nghiêm ngặt.
- `NonEmptyString` là mặc định cho ID và tên phương thức/sự kiện.
- `GatewayFrame` cấp cao nhất dùng một **discriminator** trên `type`.
- Các phương thức có tác dụng phụ thường yêu cầu `idempotencyKey` trong params
  (ví dụ: `send`, `poll`, `agent`, `chat.send`).
- `agent` chấp nhận `internalEvents` tùy chọn cho ngữ cảnh điều phối được tạo ở runtime
  (ví dụ bàn giao hoàn tất tác vụ subagent/cron); xem đây là bề mặt API nội bộ.

## JSON lược đồ live

JSON Schema được tạo sinh nằm trong repo tại `dist/protocol.schema.json`. Tệp thô
được phát hành thường có tại:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Khi bạn thay đổi lược đồ

1. Cập nhật các lược đồ TypeBox.
2. Đăng ký phương thức/sự kiện trong `src/gateway/server-methods-list.ts`.
3. Cập nhật `src/gateway/method-scopes.ts` khi RPC mới cần phân loại scope operator hoặc
   node.
4. Chạy `pnpm protocol:check`.
5. Commit lược đồ được tạo sinh lại + các model Swift.

## Liên quan

- [Giao thức đầu ra phong phú](/vi/reference/rich-output-protocol)
- [Bộ chuyển đổi RPC](/vi/reference/rpc)
