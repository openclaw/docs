---
read_when:
    - Cập nhật lược đồ giao thức hoặc mã được tạo tự động
summary: Các lược đồ TypeBox là nguồn chân lý duy nhất cho giao thức Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T07:50:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox là một thư viện lược đồ ưu tiên TypeScript. OpenClaw sử dụng thư viện này để định nghĩa **giao thức WebSocket của Gateway** (bắt tay, yêu cầu/phản hồi, sự kiện máy chủ). Các lược đồ đó phục vụ **xác thực khi chạy** (AJV), **xuất JSON Schema** và **sinh mã Swift** cho ứng dụng macOS. Chỉ có một nguồn dữ liệu chuẩn; mọi thứ khác đều được tạo tự động.

Để tìm hiểu bối cảnh giao thức ở cấp cao hơn, hãy bắt đầu với [kiến trúc Gateway](/vi/concepts/architecture).

## Mô hình tư duy (30 giây)

Mỗi thông điệp WS của Gateway thuộc một trong ba khung:

- **Yêu cầu**: `{ type: "req", id, method, params }`
- **Phản hồi**: `{ type: "res", id, ok, payload | error }`
- **Sự kiện**: `{ type: "event", event, payload, seq?, stateVersion? }`

Khung đầu tiên **bắt buộc** phải là một yêu cầu `connect`. Sau đó, máy khách gọi các phương thức (ví dụ: `health`, `send`, `chat.send`) và đăng ký nhận sự kiện (ví dụ: `presence`, `tick`, `agent`).

Luồng kết nối (tối thiểu):

```text
Máy khách                 Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Các phương thức và sự kiện thường dùng:

| Danh mục   | Ví dụ                                                      | Ghi chú                                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| Cốt lõi    | `connect`, `health`, `status`                              | `connect` phải được gửi đầu tiên                     |
| Nhắn tin   | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | các phương thức gây tác dụng phụ cần `idempotencyKey` |
| Trò chuyện | `chat.history`, `chat.send`, `chat.abort`                  | WebChat sử dụng các phương thức này                  |
| Phiên      | `sessions.list`, `sessions.patch`, `sessions.delete`       | quản trị phiên                                       |
| Tự động hóa | `wake`, `cron.list`, `cron.run`, `cron.runs`              | điều khiển đánh thức và Cron                         |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                  | WS của Gateway cùng các thao tác Node                |
| Sự kiện    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | máy chủ chủ động đẩy                                 |

Danh mục **khám phá** được công bố và có tính chuẩn nằm trong `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Vị trí của các lược đồ

- Tệp xuất nguồn: `packages/gateway-protocol/src/schema.ts` tái xuất các mô-đun miền trong `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` dành cho các phong bì cấp cao nhất và quá trình bắt tay, còn `agent.ts`, `sessions.ts`, `cron.ts`, v.v. dành cho từng khu vực tính năng). `protocol-schemas.ts` là sổ đăng ký `ProtocolSchemas` trung tâm, ánh xạ tên lược đồ tới định nghĩa TypeBox tương ứng.
- Trình xác thực khi chạy (AJV): `packages/gateway-protocol/src/index.ts`
- Sổ đăng ký tính năng/khám phá được công bố: `src/gateway/server-methods-list.ts`
- Bắt tay máy chủ và điều phối phương thức: `src/gateway/server.impl.ts`
- Máy khách Node: `src/gateway/client.ts`
- JSON Schema được tạo: `dist/protocol.schema.json` (đầu ra bản dựng, không được commit)
- Mô hình Swift được tạo: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Quy trình hiện tại

- `pnpm protocol:gen` ghi JSON Schema (draft-07) vào `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` tạo các mô hình Gateway bằng Swift.
- `pnpm protocol:check` chạy cả hai trình sinh và xác minh rằng đầu ra Swift đã được commit (đầu ra JSON Schema là một tạo tác bản dựng bị git bỏ qua).

## Cách sử dụng các lược đồ khi chạy

- **Phía máy chủ**: mọi khung đến đều được xác thực bằng AJV. Quá trình bắt tay chỉ chấp nhận yêu cầu `connect` có tham số khớp với `ConnectParams`.
- **Phía máy khách**: máy khách JS xác thực các khung sự kiện và phản hồi trước khi sử dụng.
- **Khám phá tính năng**: Gateway gửi danh sách `features.methods` và `features.events` theo hướng thận trọng trong `hello-ok`, lấy từ `listGatewayMethods()` và `GATEWAY_EVENTS`.
- Danh sách khám phá đó không phải là bản kết xuất được tạo tự động của mọi hàm trợ giúp có thể gọi trong `coreGatewayHandlers`; một số RPC trợ giúp được triển khai trong `src/gateway/server-methods/*.ts` nhưng không được liệt kê trong danh sách tính năng được công bố.

## Khung ví dụ

Kết nối (thông điệp đầu tiên):

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

Phản hồi hello-ok:

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

Yêu cầu và phản hồi:

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

## Máy khách tối thiểu (Node.js)

Luồng hữu ích nhỏ nhất: kết nối + kiểm tra tình trạng.

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

1. **Lược đồ (nguồn dữ liệu chuẩn)**

Thêm vào `packages/gateway-protocol/src/schema/system.ts` (hoặc mô-đun tính năng phù hợp nhất):

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

Nhập cả hai vào `packages/gateway-protocol/src/schema/protocol-schemas.ts`, thêm chúng vào sổ đăng ký `ProtocolSchemas` và xuất các kiểu dẫn xuất:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Xác thực**

Trong `packages/gateway-protocol/src/index.ts`, xuất một trình xác thực AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Hành vi máy chủ**

Thêm một trình xử lý trong `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Đăng ký trình xử lý này trong `src/gateway/server-methods.ts` (tệp này đã hợp nhất `systemHandlers`), sau đó thêm `"system.echo"` vào đầu vào của `listGatewayMethods` trong `src/gateway/server-methods-list.ts`.

Nếu phương thức có thể được máy khách vận hành viên hoặc Node gọi, hãy phân loại phương thức đó trong `src/gateway/method-scopes.ts` để việc thực thi phạm vi và công bố tính năng trong `hello-ok` luôn đồng bộ.

4. **Tạo lại**

```bash
pnpm protocol:check
```

5. **Kiểm thử và tài liệu**

Thêm một kiểm thử máy chủ trong `src/gateway/server.*.test.ts` và ghi chú phương thức này trong tài liệu.

## Hành vi sinh mã Swift

Trình sinh Swift tạo ra:

- một enum `GatewayFrame` với các trường hợp `req`, `res`, `event` và `unknown`
- các struct/enum tải trọng được định kiểu chặt chẽ
- các giá trị `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` và `GATEWAY_MIN_PROTOCOL_VERSION`

Các kiểu khung không xác định được giữ nguyên dưới dạng tải trọng thô để bảo đảm khả năng tương thích về sau.

## Lập phiên bản và khả năng tương thích

- `PROTOCOL_VERSION` nằm trong `packages/gateway-protocol/src/version.ts` (giá trị hiện tại: `4`).
- Máy khách gửi `minProtocol` và `maxProtocol`; máy chủ từ chối các phạm vi không bao gồm giao thức hiện tại của máy chủ.
- Các mô hình Swift giữ lại kiểu khung không xác định để tránh làm hỏng các máy khách cũ hơn.

## Mẫu và quy ước lược đồ

- Hầu hết đối tượng sử dụng `additionalProperties: false` để có tải trọng nghiêm ngặt.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) là giá trị mặc định cho ID cũng như tên phương thức/sự kiện.
- `GatewayFrame` cấp cao nhất sử dụng một **trường phân biệt** trên `type`.
- Các phương thức có tác dụng phụ thường yêu cầu `idempotencyKey` trong tham số (ví dụ: `send`, `poll`, `agent`, `chat.send`).
- `agent` chấp nhận `internalEvents` tùy chọn cho ngữ cảnh điều phối do môi trường chạy tạo ra (ví dụ: chuyển giao khi tác vụ tác nhân con/Cron hoàn tất); hãy xem đây là bề mặt API nội bộ.

## JSON lược đồ trực tiếp

JSON Schema được tạo là một tạo tác bản dựng, không được commit vào kho mã nguồn. Tệp thô đã phát hành thường có tại:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Khi bạn thay đổi lược đồ

1. Cập nhật các lược đồ TypeBox trong mô-đun sở hữu `packages/gateway-protocol/src/schema/*.ts` và đăng ký chúng trong `protocol-schemas.ts`.
2. Đăng ký phương thức/sự kiện trong `src/gateway/server-methods-list.ts`.
3. Cập nhật `src/gateway/method-scopes.ts` khi RPC mới cần phân loại phạm vi vận hành viên hoặc Node.
4. Chạy `pnpm protocol:check`.
5. Commit các mô hình Swift đã được tạo lại.

## Liên quan

- [Giao thức đầu ra phong phú](/vi/reference/rich-output-protocol)
- [Bộ điều hợp RPC](/vi/reference/rpc)
