---
read_when:
    - Triển khai hoặc cập nhật các máy khách WS của Gateway
    - Gỡ lỗi tình trạng không khớp giao thức hoặc lỗi kết nối
    - Tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung dữ liệu, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-07-21T13:31:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b02b9366ca5ebfff8add001386fd56297a97d1d6932eea89745fc6e903f8a12
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức WS của Gateway là mặt phẳng điều khiển duy nhất và phương thức truyền tải Node cho
OpenClaw. Các máy khách vận hành và Node (CLI, giao diện web, ứng dụng macOS, các Node iOS/Android,
các Node không giao diện) kết nối qua WebSocket và khai báo **vai trò** cùng **phạm vi** tại
thời điểm bắt tay.

## Các gói npm

Các gói này được phát hành cùng các đợt phát hành OpenClaw. Trong quá trình triển khai ban đầu,
npm có thể trả về `E404` cho đến khi bản phát hành đầu tiên chứa gói được xuất bản.

- [`@openclaw/gateway-protocol`](https://www.npmjs.com/package/@openclaw/gateway-protocol)
  phát hành các schema, trình xác thực, kiểu TypeScript, trình trợ giúp gọn nhẹ cho frame và lỗi,
  cùng các hằng số phiên bản. Tarball của gói bao gồm hợp đồng có thể đọc bằng máy
  [`protocol.schema.json`](https://unpkg.com/@openclaw/gateway-protocol/protocol.schema.json)
  đã được tạo.
- [`@openclaw/gateway-client`](https://www.npmjs.com/package/@openclaw/gateway-client)
  phát hành máy khách Node tham chiếu và một điểm vào an toàn cho trình duyệt tại
  `@openclaw/gateway-client/browser`.

Để xem hướng dẫn về vòng đời ứng dụng, hãy xem
[Xây dựng máy khách Gateway](https://docs.openclaw.ai/gateway/clients). Đối với các ứng dụng
giám sát Gateway dưới dạng tiến trình con, hãy xem
[Nhúng OpenClaw](https://docs.openclaw.ai/gateway/embedding).

## Truyền tải và đóng khung

- WebSocket, frame văn bản, payload JSON.
- Frame đầu tiên **phải** là yêu cầu `connect`.
- Các frame trước khi kết nối bị giới hạn ở 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Sau
  khi bắt tay, tuân theo `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán, các
  frame đến quá kích thước và bộ đệm đi chậm sẽ phát sự kiện `payload.large` trước khi
  Gateway đóng kết nối hoặc loại bỏ frame. Các sự kiện này chứa `surface`, kích thước
  byte, giới hạn và mã lý do an toàn; tuyệt đối không chứa nội dung thông điệp, nội dung
  tệp đính kèm, byte frame thô, token, cookie hoặc bí mật.

Cấu trúc frame:

- Yêu cầu: `{type:"req", id, method, params}`
- Phản hồi: `{type:"res", id, ok, payload|error}`
- Sự kiện: `{type:"event", event, payload, seq?, stateVersion?}`

Lỗi phản hồi sử dụng `{ code, message, details?, retryable?, retryAfterMs? }`.
Máy khách nên phân nhánh theo `code` và `details.code`; `message` vẫn có thể đọc được
bởi con người và có thể thay đổi, ngoại trừ khi ghi chú tương thích quy định khác. Lỗi
ủy quyền ở cấp phương thức sử dụng `code: "FORBIDDEN"` cấp cao nhất với
chi tiết có cấu trúc về phạm vi còn thiếu:

- Phạm vi còn thiếu: `{ code: "MISSING_SCOPE", missingScope, requiredScopes }`.
  `requiredScopes` là toàn bộ tập hợp phạm vi đã biết cho thao tác được yêu cầu.
  Thông báo `missing scope: <scope>` cũ được giữ lại cho các máy khách cũ hơn.

Máy khách nên đọc `details` trước và chỉ sử dụng thông báo cũ làm phương án
dự phòng tương thích. `readMissingScopeError` và `readMissingScopeErrorDetails` được xuất từ
`@openclaw/gateway-protocol/gateway-error-details`; máy khách Gateway an toàn cho trình duyệt
tái xuất chúng từ `@openclaw/gateway-client/browser`.

Các schema được xuất dưới dạng `GatewayErrorDetailsSchema`,
`MissingScopeErrorDetailsSchema` từ `@openclaw/gateway-protocol/schema`.
Lỗi phạm vi HTTP phản chiếu đối tượng `MISSING_SCOPE` bên dưới `error.details` và
sử dụng trạng thái HTTP `403`.

Các phương thức gây tác dụng phụ yêu cầu khóa idempotency (xem schema).

## Bắt tay

Gateway gửi một thử thách trước khi kết nối:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Máy khách phản hồi bằng `connect`:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
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

Gateway phản hồi bằng `hello-ok`:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
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

`server`, `features`, `snapshot`, `policy` và `auth` đều được
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`) yêu cầu. `auth`
báo cáo vai trò/phạm vi đã thương lượng ngay cả khi không phát hành token thiết bị (cấu trúc
ở trên). `pluginSurfaceUrls` là tùy chọn và ánh xạ tên bề mặt Plugin (ví dụ:
`canvas`) tới các URL được lưu trữ theo phạm vi; mục này có thể hết hạn, vì vậy các Node gọi
`node.pluginSurface.refresh` với `{ "surface": "canvas" }` để lấy mục mới.
Đường dẫn `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
đã ngừng dùng không được hỗ trợ; hãy sử dụng các bề mặt Plugin.
`appliedConfigHash` tùy chọn của snapshot là bản sửa đổi cấu hình nguồn đã phân giải
được runtime Gateway đang hoạt động chấp nhận. Máy khách có thể so sánh giá trị này với
`config.get.configRevisionHash` để xác định xem cấu hình đã lưu mới hơn có còn
cần khởi động lại hay không. `config.get.hash` vẫn là bản sửa đổi tệp gốc thô được các
cơ chế bảo vệ xung đột khi ghi cấu hình sử dụng.

Khi Gateway vẫn đang hoàn tất khởi động các tiến trình phụ trợ, `connect` có thể trả về
lỗi `UNAVAILABLE` có thể thử lại với `details.reason: "startup-sidecars"` và
`retryAfterMs`. Hãy thử lại trong giới hạn kết nối thay vì coi đây là
lỗi bắt tay cuối cùng.

Khi token thiết bị được phát hành, `hello-ok.auth` sẽ thêm token đó:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Cơ chế khởi tạo tích hợp bằng mã QR/mã thiết lập là đường dẫn bàn giao cho thiết bị di động. Một
kết nối bằng mã thiết lập cơ sở thành công trả về một token Node chính cùng một
token người vận hành có giới hạn:

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

Việc bàn giao người vận hành này được chủ đích giới hạn: đủ để khởi động vòng lặp
người vận hành trên thiết bị di động và quá trình thiết lập gốc, bao gồm `operator.talk.secrets` để đọc
cấu hình Talk, nhưng không có phạm vi thay đổi ghép nối và không có `operator.admin`. Quyền
ghép nối/quản trị rộng hơn cần một luồng ghép nối hoặc token được phê duyệt riêng. Chỉ lưu
`hello-ok.auth.deviceTokens` khi xác thực khởi tạo chạy qua phương thức truyền tải đáng tin cậy
(`wss://` hoặc ghép nối loopback/cục bộ).

Các máy khách backend đáng tin cậy trong cùng tiến trình (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên kết nối loopback trực tiếp khi
xác thực bằng token/mật khẩu Gateway dùng chung. Đường dẫn này được dành riêng
cho các RPC mặt phẳng điều khiển nội bộ (ví dụ: cập nhật phiên subagent) và tránh
việc đường cơ sở ghép nối CLI/thiết bị cũ chặn công việc backend cục bộ. Máy khách từ xa,
có nguồn gốc trình duyệt, Node và máy khách sử dụng token thiết bị/danh tính thiết bị rõ ràng vẫn
phải trải qua các bước kiểm tra ghép nối và nâng cấp phạm vi thông thường.

### Vai trò worker và giao thức đóng

Các worker đám mây sử dụng một cổng vào loopback chuyên dụng thông qua đường hầm SSH
do Gateway sở hữu và ghim khóa máy chủ. Cổng này chỉ chấp nhận danh tính worker và tuyệt đối không điều phối
xác thực chung, sự kiện Node, RPC người vận hành hoặc phương thức Plugin. Một `connect` nghiêm ngặt
xác minh thông tin xác thực ngắn hạn được lưu dưới dạng băm, gắn với môi trường, hàm băm
bundle, epoch chủ sở hữu, phiên bản tập RPC, thời hạn và một phiên có thể null; đồng thời
kiểm tra riêng phiên bản và tập tính năng hiện tại. Khi thành công, hệ thống trả về
`worker-hello-ok` tối thiểu; quá trình thương lượng tính năng độc lập với phiên bản
giao thức chung. Các frame luôn nhỏ hơn 64 KiB, ngoại trừ frame `worker.inference.start`
đã thương lượng có thể lên tới 25 MiB. Danh sách cho phép đóng chứa `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` và
`worker.inference.cancel`.

Các lần commit bản chép lời sử dụng cơ chế rào chắn epoch chủ sở hữu, liên kết phiên
do Gateway sở hữu, thao tác so sánh-và-hoán đổi trên lá cơ sở và phát lại chuỗi bền vững; Gateway tạo
ID mục bản chép lời và ID cha thông qua trình ghi phiên thông thường. Quyền sở hữu và
thời hạn được kiểm tra lại trên mỗi RPC.

### Khả năng của máy khách

Máy khách người vận hành có thể quảng bá các khả năng tùy chọn trong `connect.params.caps`:

- `tool-events`: chấp nhận các sự kiện vòng đời công cụ có cấu trúc.
- `inline-widgets`: có thể kết xuất kết quả công cụ tiện ích nội tuyến được lưu trữ.

Khả năng của máy khách mô tả máy khách đang kết nối, không phải quyền ủy quyền. Công cụ tác nhân có thể khai báo các khả năng bắt buộc; Gateway bỏ qua các công cụ đó trừ khi mọi yêu cầu đều xuất hiện trong `caps` của máy khách khởi tạo. Các lượt chạy bắt nguồn từ kênh không có khả năng máy khách Gateway, vì vậy các công cụ bị giới hạn theo khả năng sẽ không khả dụng ngay cả khi chính sách công cụ cho phép rõ ràng.

### Ví dụ kết nối Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
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

Các Node khai báo các tuyên bố khả năng tại thời điểm kết nối:

- `caps`: các danh mục cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: danh sách lệnh được phép gọi.
- `permissions`: các nút chuyển đổi chi tiết (ví dụ: `screen.record`, `camera.capture`).

Gateway coi đây là các tuyên bố và thực thi danh sách cho phép ở phía máy chủ.

## Vai trò và phạm vi

Để xem đầy đủ mô hình phạm vi người vận hành, các bước kiểm tra tại thời điểm phê duyệt và
ngữ nghĩa bí mật dùng chung, hãy xem [Phạm vi người vận hành](/vi/gateway/operator-scopes).

Vai trò:

- `operator`: máy khách mặt phẳng điều khiển (CLI/giao diện người dùng/tự động hóa).
- `node`: máy chủ khả năng (camera/màn hình/canvas/system.run).
- `worker`: máy chủ thực thi đám mây trên giao thức worker đóng và chuyên dụng.

Phạm vi người vận hành (`src/gateway/operator-scopes.ts`), toàn bộ tập hợp đóng:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` với `includeSecrets: true` yêu cầu `operator.talk.secrets` (hoặc
`operator.admin`). Khi bao gồm bí mật, hãy đọc thông tin xác thực của nhà cung cấp Talk đang hoạt động
từ `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
giữ nguyên cấu trúc nguồn và có thể là đối tượng SecretRef hoặc chuỗi đã che.

Các phương thức RPC Gateway do Plugin đăng ký có thể yêu cầu phạm vi người vận hành riêng,
nhưng các tiền tố lõi dành riêng này luôn phân giải thành `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Phạm vi phương thức chỉ là cổng kiểm tra đầu tiên. Một số lệnh gạch chéo được truy cập thông qua
`chat.send` áp dụng các bước kiểm tra cấp lệnh nghiêm ngặt hơn: các thao tác ghi `/config set` và
`/config unset` bền vững yêu cầu `operator.admin` ngay cả đối với máy khách Gateway đã
có phạm vi người vận hành thấp hơn.

`node.pair.approve` có thêm bước kiểm tra phạm vi tại thời điểm phê duyệt bên trên
phạm vi phương thức cơ sở (`operator.pairing`), dựa trên `commands`
(`src/infra/node-pairing-authz.ts`) đã khai báo của yêu cầu đang chờ xử lý:

| Lệnh đã khai báo                                                                                                              | Phạm vi bắt buộc                      |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| không có                                                                                                                      | `operator.pairing`                    |
| lệnh thông thường                                                                                                             | `operator.pairing` + `operator.write` |
| bao gồm `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` hoặc `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Khả năng/lệnh/quyền (node)

Các node khai báo yêu cầu về khả năng khi kết nối:

- `caps`: các danh mục khả năng cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice` và `talk`.
- `commands`: danh sách lệnh cho phép gọi.
- `permissions`: các nút bật/tắt chi tiết (ví dụ: `screen.record`, `camera.capture`).

Gateway coi đây là các **yêu cầu** và thực thi danh sách cho phép ở phía máy chủ.
Sau khi kết nối hoặc kết nối lại thành công, các node đã kết nối có thể công bố
các bộ mô tả công cụ Plugin hoặc MCP tùy chọn mà tác nhân có thể thấy bằng
`node.pluginTools.update`. Các máy chủ node không giao diện sẽ khởi động lại để áp dụng
các thay đổi khai báo trong danh mục MCP. Phương thức cập nhật này là đường dẫn
công bố duy nhất; các bộ mô tả công cụ Plugin không được chấp nhận trong tham số
`connect`. Mỗi bộ mô tả phải sử dụng `name` của công cụ an toàn
cho nhà cung cấp và chỉ định một `command` trong danh sách lệnh hiện tại
được phép của node. Gateway tin cậy siêu dữ liệu bộ mô tả từ node đã ghép đôi,
lọc các bộ mô tả nằm ngoài bề mặt lệnh đã phê duyệt, xóa chúng khi node ngắt kết nối
và từ chối các thao tác của người vận hành nhằm sửa đổi danh mục của node khác.
Đặt `gateway.nodes.pluginTools.enabled: false` để bỏ qua các bộ mô tả do node công bố.

Các máy chủ node đã kết nối công bố toàn bộ danh mục thay thế Skills của chúng bằng
`node.skills.update`. Phương thức dành cho vai trò node này là đường dẫn công bố
Skills duy nhất của node; Skills không được chấp nhận trong tham số
`connect`. Mỗi bộ mô tả chứa tên an toàn, phần mô tả và nội dung
`SKILL.md` có giới hạn. Gateway phân tích nội dung đó bằng trình tải Skills
thông thường, đưa nội dung vào các bản chụp nhanh Skills của tác nhân khi node
được kết nối và xóa nội dung khi ngắt kết nối. Đặt
`gateway.nodes.skills.enabled: false` để bỏ qua Skills do node công bố.

## Trạng thái hiện diện

- `system-presence` trả về các mục được định khóa theo danh tính thiết bị, bao gồm
  `deviceId`, `roles` và `scopes`, để giao diện người dùng có thể hiển thị một hàng cho mỗi thiết bị ngay cả
  khi thiết bị kết nối với cả vai trò người vận hành và node.
- `node.list` bao gồm `lastSeenAtMs` và `lastSeenReason` tùy chọn. Các node
  đã kết nối báo cáo thời gian kết nối hiện tại với lý do `connect`; các node đã ghép đôi cũng có thể
  báo cáo trạng thái hiện diện lâu dài trong nền qua một sự kiện node đáng tin cậy.

Các node macOS gốc cũng có thể gửi sự kiện `node.presence.activity` đã xác thực
với thời gian đầu vào không hoạt động có giới hạn. Gateway tự suy ra dấu thời gian
hoạt động theo đồng hồ của mình, cung cấp máy Mac được kết nối gần đây nhất qua
`node.list` và `node.describe`, đồng thời phát các bản cập nhật
`node.presence` đến các máy khách có phạm vi đọc.
Xem [Trạng thái hiện diện của máy tính đang hoạt động](/vi/nodes/presence) để biết hành vi lựa chọn, quyền riêng tư, ngữ cảnh
mô hình và định tuyến thông báo.

### Sự kiện node hoạt động trong nền

Các node gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một
node đã ghép đôi từng hoạt động trong lần đánh thức nền mà không đánh dấu node đó là đã kết nối:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Các giá trị không xác định được chuẩn hóa thành
`background` (`src/shared/node-presence.ts`). Sự kiện chỉ được lưu bền vững cho
các phiên thiết bị node đã xác thực; các phiên không có thiết bị hoặc chưa ghép đôi trả về
`handled: false`.

Các Gateway xử lý thành công trả về một kết quả có cấu trúc:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Các Gateway cũ hơn có thể chỉ trả về `{ "ok": true }` cho `node.event`; hãy coi đó
là một RPC đã được xác nhận, không phải trạng thái hiện diện được lưu bền vững.

## Phạm vi sự kiện phát rộng

Các sự kiện phát rộng do máy chủ đẩy được kiểm soát theo phạm vi để các phiên
chỉ có phạm vi ghép đôi hoặc chỉ dành cho node không thụ động nhận nội dung phiên
(`src/gateway/server-broadcast.ts`):

- Các khung trò chuyện, tác nhân và kết quả công cụ (các sự kiện `agent` được truyền phát, sự kiện
  kết quả công cụ) yêu cầu ít nhất `operator.read`. Các phiên không có phạm vi này sẽ bỏ qua hoàn toàn
  các khung đó.
- Theo mặc định, các lần phát rộng `plugin.*` do Plugin định nghĩa được giới hạn ở `operator.write` hoặc
  `operator.admin`; các mục rõ ràng như
  `plugin.approval.requested` / `plugin.approval.resolved` sử dụng
  `operator.approvals` thay thế.
- Các sự kiện trạng thái/vận chuyển (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối)
  vẫn không bị hạn chế để mọi phiên đã xác thực đều có thể quan sát tình trạng
  vận chuyển.
- Theo mặc định, các họ sự kiện phát rộng không xác định bị giới hạn theo phạm vi (đóng khi lỗi),
  trừ khi một trình xử lý đã đăng ký nới lỏng chúng một cách rõ ràng.

Mỗi kết nối máy khách duy trì số thứ tự riêng cho từng máy khách, vì vậy các lần phát rộng
vẫn được sắp xếp tăng dần trên socket đó ngay cả khi các máy khách khác nhau thấy
các tập con khác nhau của luồng sự kiện sau khi lọc theo phạm vi.

## Các họ phương thức RPC

`hello-ok.features.methods` là một danh sách khám phá thận trọng được tạo từ
`src/gateway/server-methods-list.ts` cùng các mục xuất phương thức
Plugin/kênh đã tải — đây không phải bản kết xuất được tạo tự động của mọi phương thức, và một số phương thức (ví dụ
`push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
được cố ý loại khỏi hoạt động khám phá dù chúng là các phương thức thực sự có thể gọi.
Hãy coi đây là cơ chế khám phá tính năng, không phải danh sách đầy đủ của
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về bản chụp nhanh tình trạng Gateway đã lưu đệm hoặc vừa thăm dò.
    - `diagnostics.stability` trả về bộ ghi chẩn đoán độ ổn định gần đây có giới hạn: tên sự kiện, số lượng, kích thước byte, số liệu bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin, mã định danh phiên. Không có văn bản trò chuyện, nội dung Webhook, đầu ra công cụ, nội dung thô của yêu cầu/phản hồi, token, cookie hoặc bí mật. Yêu cầu `operator.read`.
    - `status` trả về bản tóm tắt Gateway kiểu `/status`; các trường nhạy cảm chỉ dành cho máy khách người vận hành có phạm vi quản trị.
    - `gateway.identity.get` trả về danh tính thiết bị Gateway được các luồng chuyển tiếp và ghép đôi sử dụng.
    - `system-presence` trả về bản chụp nhanh trạng thái hiện diện hiện tại của các thiết bị người vận hành/node đã kết nối.
    - `system-event` nối thêm một sự kiện hệ thống và có thể cập nhật/phát rộng ngữ cảnh trạng thái hiện diện.
    - `last-heartbeat` trả về sự kiện Heartbeat được lưu bền vững gần đây nhất.
    - `set-heartbeats` bật hoặc tắt quá trình xử lý Heartbeat trên Gateway.
    - `gateway.suspend.prepare` chỉ tạo một hợp đồng tạm ngưng phối hợp ngắn hạn khi công việc Gateway được theo dõi đang nhàn rỗi. `gateway.suspend.status` kiểm tra hợp đồng đó và `gateway.suspend.resume` giải phóng hợp đồng sau khi khôi phục hoặc sau một thao tác máy chủ bị hủy.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được thời gian chạy cho phép. Xem các chế độ xem "`models.list`" bên dưới.
    - `usage.status` trả về các cửa sổ sử dụng/tóm tắt hạn ngạch còn lại của nhà cung cấp.
    - `usage.cost` trả về các bản tóm tắt tổng hợp chi phí sử dụng cho một khoảng ngày. Truyền `agentId` cho một tác nhân hoặc `agentScope: "all"` để tổng hợp các tác nhân đã cấu hình.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của bộ nhớ vector / embedding được lưu đệm cho không gian làm việc của tác nhân mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` để ping rõ ràng nhà cung cấp embedding trực tiếp. Truyền `{ "agentId": "agent-id" }` để giới hạn số liệu thống kê kho Dreaming vào một không gian làm việc của tác nhân; nếu bỏ qua, các không gian làm việc Dreaming đã cấu hình sẽ được tổng hợp.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` và `doctor.memory.dedupeDreamDiary` chấp nhận `{ "agentId": "agent-id" }` tùy chọn; nếu bỏ qua, chúng hoạt động trên không gian làm việc của tác nhân mặc định đã cấu hình.
    - `doctor.memory.remHarness` trả về bản xem trước bộ kiểm thử REM chỉ đọc, có giới hạn dành cho các máy khách mặt phẳng điều khiển từ xa, bao gồm đường dẫn không gian làm việc, đoạn trích bộ nhớ, markdown có căn cứ đã kết xuất và các ứng viên nâng cấp sâu. Yêu cầu `operator.read`.
    - `sessions.usage` trả về các bản tóm tắt mức sử dụng theo từng phiên. Truyền `agentId` cho một tác nhân hoặc `agentScope: "all"` để liệt kê các tác nhân đã cấu hình cùng nhau.
      Cả hai phương thức mức sử dụng đều chấp nhận `mode: "specific"` với `timeZone` IANA để xác định ranh giới và nhóm ngày theo lịch có nhận biết DST. `utcOffset` vẫn được hỗ trợ cho các máy khách cũ hơn và làm phương án dự phòng khi thời gian chạy Gateway không nhận dạng được múi giờ yêu cầu.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký mức sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình trợ giúp đăng nhập">
    - `channels.status` trả về các bản tóm tắt trạng thái kênh/Plugin tích hợp sẵn và đi kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể nếu kênh hỗ trợ.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có hỗ trợ QR.
    - `web.login.wait` chờ luồng đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một thông báo đẩy APNs thử nghiệm đến node iOS đã đăng ký.
    - `voicewake.get` trả về các cụm từ kích hoạt bằng giọng nói đã lưu.
    - `voicewake.set` cập nhật các cụm từ kích hoạt bằng giọng nói và phát rộng thay đổi.

  </Accordion>

  <Accordion title="Quản lý Plugin">
    - `plugins.list` (`operator.read`) trả về danh mục Plugin đã cài đặt cùng các lựa chọn chính thức được tuyển chọn cục bộ, thông tin chẩn đoán và việc chế độ cài đặt hiện tại có cho phép sửa đổi hay không.
    - `plugins.search` (`operator.read`) tìm kiếm các họ Plugin mã và Plugin gói có thể cài đặt trên ClawHub. Truyền `query` không rỗng và `limit` tùy chọn từ 1 đến 100.
    - `plugins.install` (`operator.admin`) cài đặt một mục danh mục chính thức bằng `{ source: "official", pluginId }` hoặc một gói ClawHub bằng `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Các bản cài đặt ClawHub duy trì các bước kiểm tra về độ tin cậy, tính toàn vẹn và chính sách cài đặt của Gateway. Các bản cài đặt thành công yêu cầu khởi động lại Gateway.
    - `plugins.setEnabled` (`operator.admin`) thay đổi chính sách kích hoạt của một Plugin đã cài đặt bằng `{ pluginId, enabled }`. Phản hồi bao gồm mục danh mục đã cập nhật, siêu dữ liệu khởi động lại và mọi cảnh báo lựa chọn vị trí.
    - `plugins.uninstall` (`operator.admin`) xóa một Plugin được cài đặt bên ngoài bằng `{ pluginId }`: các tham chiếu cấu hình, bản ghi cài đặt và các tệp được quản lý. Không thể gỡ cài đặt các Plugin đi kèm mà chỉ có thể vô hiệu hóa. Phản hồi liệt kê các thao tác xóa và luôn yêu cầu khởi động lại Gateway.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi đi trực tiếp cho các lượt gửi nhắm đến kênh/tài khoản/luồng bên ngoài trình chạy trò chuyện.
    - `logs.tail` trả về phần đuôi nhật ký tệp đã cấu hình của Gateway, với các điều khiển con trỏ/giới hạn và số byte tối đa.

  </Accordion>

  <Accordion title="Thiết bị đầu cuối của người vận hành">
    - `terminal.open` khởi động một PTY máy chủ cho `agentId` được chỉ định rõ hoặc tác nhân mặc định, rồi trả về tác nhân đã phân giải, thư mục làm việc, shell và trạng thái giới hạn.
    - `terminal.input`, `terminal.resize` và `terminal.close` chỉ thao tác trên các phiên thuộc sở hữu của kết nối gọi.
    - `terminal.upload` chấp nhận một tệp base64 có kích thước tối đa 16 MiB, đưa tệp vào một thư mục tạm thời riêng tư tồn tại 24 giờ trên Gateway của phiên hoặc máy chủ node đã ghép nối, rồi trả về đường dẫn tuyệt đối. Bên gọi vẫn phải dán hoặc sử dụng đường dẫn đó theo cách khác; RPC không bao giờ ghi dữ liệu đầu vào của thiết bị đầu cuối hoặc thực thi lệnh.
    - Các sự kiện `terminal.data` và `terminal.exit` chỉ được truyền đến kết nối sở hữu phiên.
    - Các phiên bị mất kết nối sẽ được tách ra thay vì bị kết thúc: chúng vẫn có thể được gắn lại trong `gateway.terminal.detachedSessionTimeoutSeconds` (mặc định 300; `0` khôi phục hành vi kết thúc khi mất kết nối), trong khi đầu ra gần đây tích lũy trong bộ đệm phía máy chủ có giới hạn.
    - `terminal.list` trả về các phiên có thể gắn; `terminal.attach` liên kết lại một phiên đang hoạt động hoặc đã tách với kết nối gọi và trả về bộ đệm phát lại (tiếp quản theo kiểu tmux — chủ sở hữu đang hoạt động trước đó nhận được `terminal.exit` với lý do `detached`); `terminal.text` đọc bộ đệm dưới dạng văn bản thuần túy mà không gắn vào.
    - Mọi phương thức thiết bị đầu cuối đều yêu cầu `operator.admin`; `gateway.terminal.enabled` phải được đặt rõ ràng thành true. Các tác nhân được sandbox hoàn toàn sẽ bị từ chối, và việc thay đổi chính sách tác nhân sẽ đóng các PTY hiện có cũng như đang khởi tạo, bao gồm cả các PTY đã tách.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.catalog` trả về danh mục nhà cung cấp Talk chỉ đọc dành cho giọng nói, phiên âm trực tuyến và thoại thời gian thực: các mã định danh nhà cung cấp chuẩn, bí danh sổ đăng ký, nhãn, trạng thái đã cấu hình, kết quả `ready` tùy chọn ở cấp nhóm, các mã định danh mô hình/giọng nói được cung cấp, chế độ chuẩn, phương thức truyền tải, chiến lược bộ não và cờ âm thanh/khả năng thời gian thực, mà không trả về bí mật của nhà cung cấp hoặc sửa đổi cấu hình toàn cục. Các Gateway hiện tại đặt `ready` sau khi áp dụng lựa chọn nhà cung cấp lúc chạy; nếu thuộc tính này không có trên Gateway cũ, hãy coi trạng thái là chưa được xác minh.
    - `talk.config` trả về tải trọng cấu hình Talk có hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.session.create` tạo một phiên Talk do Gateway sở hữu cho `realtime/gateway-relay`, `transcription/gateway-relay` hoặc `stt-tts/managed-room`. Đối với `stt-tts/managed-room`, các bên gọi `operator.write` truyền `sessionKey` cũng phải truyền `spawnedBy` để giới hạn phạm vi hiển thị khóa phiên; việc tạo `sessionKey` không giới hạn phạm vi và `brain: "direct-tools"` yêu cầu `operator.admin`.
    - `talk.session.join` xác thực mã thông báo phiên phòng được quản lý, phát `session.ready` hoặc `session.replaced` khi cần, rồi trả về siêu dữ liệu phòng/phiên cùng các sự kiện Talk gần đây, nhưng không bao giờ trả về mã thông báo dạng văn bản thuần túy hoặc giá trị băm của mã đó.
    - `talk.session.appendAudio` nối thêm âm thanh đầu vào PCM dạng base64 vào các phiên chuyển tiếp và phiên âm thời gian thực do Gateway sở hữu.
    - `talk.session.startTurn`, `talk.session.endTurn` và `talk.session.cancelTurn` điều khiển vòng đời lượt của phòng được quản lý, đồng thời từ chối lượt cũ trước khi xóa trạng thái.
    - `talk.session.cancelOutput` dừng đầu ra âm thanh của trợ lý, chủ yếu để ngắt lời có kiểm soát bằng VAD trong các phiên chuyển tiếp của Gateway.
    - `talk.session.submitToolResult` hoàn tất một lệnh gọi công cụ của nhà cung cấp do phiên chuyển tiếp thời gian thực thuộc sở hữu của Gateway phát ra. Yêu cầu sẽ chờ mọi tín hiệu hoàn tất bất đồng bộ do cầu nối nhà cung cấp cung cấp; các lần gửi thất bại vẫn giữ lượt chạy liên kết ở trạng thái hoạt động và không phát sự kiện kết quả công cụ thành công. Truyền `options: { willContinue: true }` cho đầu ra công cụ tạm thời hoặc `options: { suppressResponse: true }` khi cầu nối nhà cung cấp thông báo hỗ trợ chế độ chặn và kết quả không được bắt đầu một phản hồi khác.
    - `talk.session.steer` gửi điều khiển giọng nói của lượt chạy đang hoạt động vào một phiên Talk dựa trên tác nhân do Gateway sở hữu: `{ sessionId, text, mode? }`, trong đó `mode` là `status`, `steer`, `cancel` hoặc `followup`; nếu bỏ qua chế độ, hệ thống sẽ phân loại dựa trên văn bản được nói.
    - `talk.session.close` đóng một phiên chuyển tiếp, phiên âm hoặc phòng được quản lý do Gateway sở hữu và phát các sự kiện Talk kết thúc.
    - `talk.mode` đặt/phát rộng trạng thái chế độ Talk hiện tại cho các máy khách WebChat/Control UI.
    - `talk.client.create` tạo hoặc tiếp tục một phiên nhà cung cấp thời gian thực do máy khách sở hữu bằng `webrtc` hoặc `provider-websocket`, trong khi Gateway sở hữu thông tin xác thực, chỉ dẫn, chính sách công cụ và `voiceSessionId` được trả về. Máy khách truyền `sessionKey` và tái sử dụng `voiceSessionId` khi thay thế phương thức truyền tải của nhà cung cấp trong một cuộc gọi.
    - `talk.client.transcript` nối thêm một mục `{ role, text }` đã hoàn tất vào phiên tác nhân thông thường. `entryId` bắt buộc có tính lũy đẳng trong `voiceSessionId`; việc thử lại không tạo bản sao trùng lặp của thông điệp bản chép lời.
    - `talk.client.close` đóng phiên thoại logic sau các thao tác ghi bản chép lời đang chờ xử lý. Thao tác đóng có tính lũy đẳng và có thể gửi bản tóm lược cuộc gọi chỉ chứa thay đổi đến kênh không phải WebChat gần nhất của phiên.
    - `talk.client.toolCall` cho phép các phương thức truyền tải thời gian thực do máy khách sở hữu chuyển tiếp lệnh gọi công cụ của nhà cung cấp đến chính sách Gateway. Công cụ đầu tiên được hỗ trợ là `openclaw_agent_consult`; máy khách nhận mã định danh lượt chạy và chờ các sự kiện vòng đời trò chuyện thông thường trước khi gửi kết quả công cụ dành riêng cho nhà cung cấp. Các hành động có tác động lớn gắn với giọng nói trả về `VOICE_CONFIRMATION_REQUIRED:<id>` cho đến khi một phát ngôn hoàn chỉnh sau đó của người dùng xác nhận rõ ràng chính xác hành động đó và lần tham vấn tiếp theo cung cấp `confirmationId`.
    - `talk.client.steer` gửi điều khiển giọng nói của lượt chạy đang hoạt động cho các phương thức truyền tải thời gian thực do máy khách sở hữu. Gateway phân giải lượt chạy nhúng đang hoạt động từ `sessionKey` và trả về kết quả chấp nhận/từ chối có cấu trúc thay vì âm thầm bỏ qua việc điều hướng.
    - `talk.event` là kênh sự kiện Talk duy nhất cho các bộ điều hợp thời gian thực, phiên âm, STT/TTS, phòng được quản lý, điện thoại và cuộc họp.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, các nhà cung cấp dự phòng và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về danh mục nhà cung cấp TTS hiển thị.
    - `tts.enable` và `tts.disable` chuyển đổi trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` thực hiện một lần chuyển đổi văn bản thành giọng nói.
    - `tts.speak` (`operator.write`) kết xuất `text` không rỗng bằng chuỗi nhà cung cấp TTS chung đã cấu hình và trả về toàn bộ một đoạn âm thanh trực tiếp dưới dạng `audioBase64`, cùng với siêu dữ liệu `provider` và các siêu dữ liệu tùy chọn `outputFormat`, `mimeType` và `fileExtension`. Không giống `tts.convert`, phương thức này không trả về đường dẫn cục bộ của Gateway; không giống `talk.speak`, phương thức này không yêu cầu nhà cung cấp Talk. Văn bản vượt quá `messages.tts.maxTextLength` trả về `INVALID_REQUEST`; lỗi tổng hợp trả về `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRef đang hoạt động và phát hành nguyên tử trạng thái lúc chạy có nhận biết chủ sở hữu. Lỗi của chủ sở hữu đủ điều kiện có thể được phát hành dưới dạng suy giảm nguội hoặc cũ với `warningCount`; lỗi nghiêm ngặt hoặc chưa ánh xạ sẽ từ chối tải lại và giữ nguyên ảnh chụp nhanh đang hoạt động.
    - `secrets.resolve` phân giải các phép gán bí mật cho đích lệnh đối với một tập hợp lệnh/đích cụ thể.
    - `config.get` trả về ảnh chụp nhanh cấu hình hiện tại trên đĩa, `hash` của tệp gốc thô, `configRevisionHash` đã phân giải và `appliedConfigHash` tùy chọn cho bản sửa đổi đã phân giải được môi trường chạy Gateway đang hoạt động chấp nhận.
    - `config.set` ghi một tải trọng cấu hình đã được xác thực.
    - `config.patch` hợp nhất một bản cập nhật cấu hình từng phần. Việc thay thế mảng có tính phá hủy yêu cầu đường dẫn bị ảnh hưởng trong `replacePaths`; các mảng lồng nhau bên dưới mục nhập mảng sử dụng các đường dẫn `[]`, chẳng hạn như `agents.list[].skills`.
    - `config.apply` xác thực và thay thế toàn bộ tải trọng cấu hình.
    - `config.schema` trả về tải trọng lược đồ cấu hình trực tiếp được công cụ Control UI và CLI sử dụng: lược đồ, `uiHints`, phiên bản, siêu dữ liệu tạo và siêu dữ liệu lược đồ plugin + kênh khi có thể tải. Tải trọng bao gồm siêu dữ liệu `title` / `description` từ cùng nhãn/văn bản trợ giúp như giao diện người dùng, bao gồm các nhánh kết hợp đối tượng lồng nhau, ký tự đại diện, mục mảng và `anyOf` / `oneOf` / `allOf` khi có tài liệu trường phù hợp.
    - `config.schema.lookup` trả về tải trọng tra cứu giới hạn theo đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một node lược đồ nông, gợi ý khớp + `hintPath`, `reloadKind` tùy chọn và bản tóm tắt các phần tử con trực tiếp để giao diện người dùng/CLI truy sâu. `reloadKind` là một trong `restart`, `hot` hoặc `none` (`src/config/schema.ts`) và phản ánh bộ lập kế hoạch tải lại cấu hình Gateway cho đường dẫn được yêu cầu. Các node lược đồ tra cứu giữ lại tài liệu hướng đến người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Bản tóm tắt phần tử con cung cấp `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, `reloadKind` tùy chọn, cùng `hint` / `hintPath` đã khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại nếu cập nhật thành công; các bên gọi có phiên có thể bao gồm `continuationMessage` để khi khởi động, một lượt tác nhân tiếp theo được tiếp tục thông qua hàng đợi tiếp diễn sau khởi động lại. Các bản cập nhật bằng trình quản lý gói và bản cập nhật checkout git được giám sát từ mặt phẳng điều khiển sử dụng cơ chế bàn giao dịch vụ được quản lý tách rời, thay vì thay thế cây gói hoặc sửa đổi đầu ra checkout/bản dựng bên trong Gateway đang hoạt động. Một lượt bàn giao đã bắt đầu trả về `ok: true` cùng `result.reason: "managed-service-handoff-started"` và `handoff.status: "started"`. Một `update.run` đồng thời thứ hai do cùng tiến trình Gateway xử lý trả về `ok: false` cùng `result.reason: "managed-service-handoff-already-running"` và `handoff.status: "already-running"`; yêu cầu tiếp diễn của nó không được chấp nhận, vì vậy bên gọi có thể thử lại sau khi bản cập nhật đang hoạt động hoàn tất. Các trình cập nhật CLI độc lập và tiến trình Gateway thay thế nằm ngoài cơ chế bảo vệ cục bộ theo tiến trình này. Các lượt bàn giao không khả dụng hoặc thất bại trả về `ok: false` cùng `managed-service-handoff-unavailable` hoặc `managed-service-handoff-failed`, cộng thêm `handoff.command` khi cần cập nhật shell thủ công. Không khả dụng có nghĩa là OpenClaw thiếu ranh giới trình giám sát an toàn hoặc danh tính dịch vụ bền vững, chẳng hạn như `OPENCLAW_SYSTEMD_UNIT` đối với systemd. Trong một lượt bàn giao đã bắt đầu, tín hiệu khởi động lại có thể báo cáo `stats.reason: "restart-health-pending"` trong thời gian ngắn; yêu cầu tiếp diễn bị trì hoãn cho đến khi CLI xác minh Gateway đã khởi động lại và ghi tín hiệu `ok` cuối cùng.
    - `update.status` làm mới và trả về tín hiệu khởi động lại do cập nhật mới nhất, bao gồm phiên bản đang chạy sau khi khởi động lại nếu có.
    - `wizard.start`, `wizard.next`, `wizard.status` và `wizard.cancel` cung cấp trình hướng dẫn thiết lập ban đầu qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp tác tử và không gian làm việc">
    - `agents.list` trả về các mục tác tử hiển thị với Gateway, bao gồm siêu dữ liệu mô hình/môi trường thực thi có hiệu lực và `kind` ngữ nghĩa tùy chọn (`agent` hoặc `system`). Máy khách quảng bá khả năng bắt tay `agent-kind` để nhận danh sách đầy đủ có kiểu; máy khách không có khả năng này tiếp tục nhận danh sách kiểu cũ, an toàn cho bộ chọn và không có các hàng hệ thống. Máy khách nhận biết loại sẽ loại trừ các hàng `system` khỏi bộ chọn thông thường nhưng vẫn giữ chúng trong chế độ xem chẩn đoán. Các Gateway v4 cũ hơn có thể trả về các hàng không có `kind`.
    - `agents.create`, `agents.update` và `agents.delete` quản lý bản ghi tác tử và việc kết nối không gian làm việc.
    - `agents.files.list`, `agents.files.get` và `agents.files.set` quản lý các tệp không gian làm việc khởi tạo được cung cấp cho một tác tử.
    - `audit.activity.list` trả về sổ cái hoạt động chỉ chứa siêu dữ liệu và có phiên bản; `audit.list` vẫn là RPC chạy/công cụ an toàn về khả năng tương thích.
    - `agents.workspace.list` và `agents.workspace.get` (`operator.read`) cung cấp khả năng duyệt chỉ đọc, có phân trang đối với thư mục không gian làm việc của tác tử cho các máy khách trong miền toán tử tin cậy được mô tả tại [Phạm vi toán tử](/vi/gateway/operator-scopes). Yêu cầu chỉ chấp nhận các đường dẫn tương đối với không gian làm việc; thao tác đọc được giới hạn trong thư mục gốc không gian làm việc đã được phân giải đường dẫn thực (từ chối thoát qua liên kết tượng trưng và liên kết cứng), bị giới hạn kích thước và chỉ hỗ trợ văn bản UTF-8 cùng các loại hình ảnh phổ biến (base64). Phản hồi không để lộ đường dẫn không gian làm việc trên máy chủ. Không có thao tác ghi nào trong không gian tên này.
    - `tasks.list`, `tasks.get` và `tasks.cancel` cung cấp sổ cái tác vụ của Gateway cho SDK và máy khách toán tử. Xem [RPC sổ cái tác vụ](#task-ledger-rpcs) bên dưới.
    - `artifacts.list`, `artifacts.get` và `artifacts.download` cung cấp bản tóm tắt và lượt tải xuống hiện vật được suy ra từ bản chép lời cho phạm vi `sessionKey`, `runId` hoặc `taskId` được chỉ định rõ ràng. Các truy vấn lượt chạy và tác vụ phân giải phiên sở hữu ở phía máy chủ và chỉ trả về nội dung đa phương tiện trong bản chép lời có nguồn gốc khớp; các nguồn URL không an toàn hoặc cục bộ trả về lượt tải xuống không được hỗ trợ thay vì được tìm nạp ở phía máy chủ.
    - `environments.list` và `environments.status` duy trì khả năng khám phá môi trường cục bộ của Gateway và môi trường Node. Các worker đám mây đã cấu hình và bản ghi bền vững do các hồ sơ trước đó để lại bổ sung siêu dữ liệu `worker` với `providerId`, `leaseId` tùy chọn, `state`, `ageMs`, `idleMs` tùy chọn và `attachedSessionIds`. Các trạng thái vòng đời của worker là `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` và `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) cấp phát một worker từ hồ sơ nhà cung cấp Plugin đã cấu hình; các lần thử lại với cùng khóa sẽ tái sử dụng thao tác bền vững. `environments.destroy` (`{ environmentId }`) yêu cầu hủy bỏ môi trường worker bền vững theo cách lũy đẳng. Cả hai đều yêu cầu `operator.admin`, là các thao tác ghi trên mặt phẳng điều khiển và trả về cùng cấu trúc tóm tắt môi trường được dùng trong phản hồi trạng thái.
    - `agent.identity.get` trả về danh tính trợ lý có hiệu lực cho một tác tử hoặc phiên.
    - `agent.wait` chờ một lượt chạy hoàn tất và trả về ảnh chụp nhanh trạng thái kết thúc khi có.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` cho từng hàng khi đã cấu hình phần phụ trợ môi trường thực thi tác tử. Khi bật tính năng bố trí worker đám mây hoặc tồn tại trạng thái khôi phục bền vững, các hàng phiên cũng bao gồm trạng thái `placement` đóng (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` hoặc `failed`) cùng các trường dành riêng cho trạng thái về môi trường, epoch chủ sở hữu, không gian làm việc, gói, con trỏ ACK hoặc khôi phục.
    - `sessions.subscribe` và `sessions.unsubscribe` bật hoặc tắt đăng ký nhận sự kiện thay đổi phiên cho máy khách WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật hoặc tắt đăng ký nhận sự kiện bản chép lời/tin nhắn cho một phiên. Truyền `includeApprovals: true` để đồng thời nhận các sự kiện vòng đời `session.approval` đã được làm sạch dành cho các phê duyệt có đối tượng được lưu trữ bao gồm chính xác phiên đó và có liên kết người đánh giá cho phép máy khách đăng ký. Khi đó, phản hồi đăng ký bao gồm một `approvalReplay` đang chờ có giới hạn; giá trị này là nguồn chính thức khi `truncated` là false. Việc chọn tham gia áp dụng theo từng lệnh gọi đăng ký, không được duy trì: đăng ký lại cùng phiên mà không có `includeApprovals: true` sẽ xóa đăng ký phê duyệt hiện có. Ngoài quyền đọc phiên thông thường, việc chọn tham gia này yêu cầu `operator.admin` hoặc `operator.approvals` trên thiết bị đã ghép đôi.
    - `sessions.preview` trả về bản xem trước bản chép lời có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một đích phiên.
    - `sessions.create` tạo một mục phiên mới. Các giá trị `model` và `thinkingLevel` tùy chọn lưu giữ nguyên tử các giá trị ghi đè ban đầu về mô hình và suy luận. `worktree: true` cấp phát một worktree được quản lý; `worktreeBaseRef`/`worktreeName` tùy chọn chọn tham chiếu cơ sở và tên nhánh, còn `execNode` (`operator.admin`) liên kết việc thực thi của phiên với một máy chủ Node. Worktree đã tạo được trả lại trong kết quả và lưu giữ trên hàng phiên (`worktree: { id, branch, repoRoot }`). Khi mục được tạo nhưng `chat.send` ban đầu lồng bên trong bị từ chối, kết quả thành công bao gồm `runStarted: false` và `runError`; máy khách có thể giữ lại lời nhắc và thử lại với khóa phiên được trả về. Bên gọi truyền `parentSessionKey` cùng `emitCommandHooks: true` cũng nên khai báo cách xử lý vòng đời của một phiên con riêng biệt: `succeedsParent: true` kết thúc phiên cha bằng `session_end`, trong khi `false` giữ phiên cha hoạt động và chỉ phát `session_start` của phiên con. Việc bỏ qua `succeedsParent` duy trì hành vi chuyển tiếp phiên cha kiểu cũ cho các máy khách hiện có. Cách xử lý này yêu cầu cả liên kết phiên cha và hook lệnh; một fork không thể đánh dấu thành công cho phiên cha. Hành vi đặt lại tại chỗ của phiên chính không thay đổi vì không có phiên con riêng biệt nào được tạo.
    - `sessions.dispatch` (`operator.admin`) chuyển một phiên OpenClaw cục bộ hiện có có worktree được quản lý thuộc sở hữu của phiên sang một hồ sơ worker đám mây đã cấu hình. Truyền `{ key, profileId, agentId? }`. Phương thức này không tồn tại khi chưa cấu hình hồ sơ worker, đóng việc tiếp nhận lượt cục bộ trước khi chờ công việc đang hoạt động hoàn tất và chỉ trả về sau khi việc bố trí đạt quyền sở hữu worker `active`. Việc điều phối chỉ diễn ra một chiều; RPC này không bao gồm thao tác kéo ngược từ worker về cục bộ.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` và `sessions.groups.delete` quản lý danh mục nhóm phiên tùy chỉnh do Gateway sở hữu (tên + thứ tự hiển thị). Tư cách thành viên vẫn nằm trong trường `category` của từng phiên; thao tác đổi tên và xóa sẽ cập nhật các phiên thành viên ở phía máy chủ.
    - `sessions.send` gửi một tin nhắn vào phiên hiện có.
    - `sessions.steer` là biến thể ngắt và điều hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động của một phiên. Truyền `key` cùng `runId` tùy chọn, hoặc chỉ `runId` đối với các lượt chạy đang hoạt động mà Gateway có thể phân giải thành một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/giá trị ghi đè của phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` có hiệu lực.
    - `sessions.reset`, `sessions.delete` và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu trữ.
    - Việc thực thi trò chuyện vẫn sử dụng `chat.history`, `chat.send`, `chat.abort` và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho máy khách UI: các thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, các tải trọng XML lời gọi công cụ dạng văn bản thuần (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và các khối lời gọi công cụ bị cắt ngắn) cùng các token điều khiển mô hình ASCII/toàn chiều rộng bị rò rỉ đều bị loại bỏ, các hàng trợ lý chỉ chứa token im lặng (chính xác là `NO_REPLY` / `no_reply`) bị bỏ qua và các hàng quá lớn có thể được thay bằng phần giữ chỗ.
    - `chat.message.get` là trình đọc toàn bộ tin nhắn có giới hạn được bổ sung cho một mục bản chép lời hiển thị duy nhất. Truyền `sessionKey`, `agentId` tùy chọn khi việc chọn phiên nằm trong phạm vi tác tử và một `messageId` của bản chép lời đã được cung cấp trước đó qua `chat.history`; Gateway trả về cùng phép chiếu đã chuẩn hóa hiển thị mà không áp dụng giới hạn cắt ngắn của lịch sử nhẹ, miễn là mục đã lưu trữ vẫn còn và không quá lớn.
    - `chat.toolTitles` trả về các tiêu đề ngắn mô tả mục đích cho lời gọi công cụ được hiển thị trong Control UI (theo lô, tối đa 24 mục với đầu vào có giới hạn). Tính năng này được chọn tham gia qua `gateway.controlUi.toolTitles` (mặc định tắt); Gateway đã tắt tính năng sẽ trả lời `{ titles: {}, disabled: true }` mà không gọi mô hình để máy khách ngừng yêu cầu. Khi được bật, tiêu đề sử dụng cơ chế định tuyến mô hình tiện ích tiêu chuẩn: `utilityModel` được cấu hình rõ ràng (một quyết định của toán tử mà, giống mọi tác vụ tiện ích, có thể gửi nội dung tác vụ có giới hạn đến nhà cung cấp đã chọn), nếu không thì dùng mô hình nhỏ mặc định do nhà cung cấp phiên khai báo để không ngầm xuất hiện đích gửi dữ liệu mới; `utilityModel` trống sẽ tắt hoàn toàn tính năng này. Tiêu đề không bao giờ chuyển sang dùng mô hình chính làm phương án dự phòng. Kết quả được lưu đệm trong cơ sở dữ liệu trạng thái theo tác tử với khóa là tên công cụ + đầu vào, vì vậy các lượt xem lặp lại không bao giờ bị tính phí lại cho cùng lời gọi.
    - `chat.send` chấp nhận `fastMode: "auto"` cho một lượt để sử dụng chế độ nhanh đối với các lời gọi mô hình bắt đầu trước ngưỡng cắt tự động, sau đó bắt đầu các lời gọi thử lại, dự phòng, kết quả công cụ hoặc tiếp tục về sau mà không dùng chế độ nhanh. Ngưỡng cắt mặc định là 60 giây (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) và có thể được cấu hình theo từng mô hình bằng `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Bên gọi `chat.send` có thể truyền `fastAutoOnSeconds` cho một lượt để ghi đè ngưỡng cắt cho yêu cầu đó. Truyền `queueMode` (`steer`, `followup`, `collect` hoặc `interrupt`) để chỉ ghi đè chế độ hàng đợi đã lưu trữ cho yêu cầu này; các thao tác điều hướng rõ ràng trong Control UI sử dụng `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Ghép đôi thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép đôi đang chờ và đã được phê duyệt.
    - `device.pair.setupCode` tạo mã thiết lập di động và theo mặc định là một URL dữ liệu QR PNG. Phương thức này yêu cầu `operator.admin` và được chủ ý loại khỏi thông tin khám phá được quảng bá. Kết quả bao gồm `setupCode`, `qrDataUrl` tùy chọn, `gatewayUrl`, nhãn không bí mật `auth` và `urlSource`.
    - `device.pair.approve`, `device.pair.reject` và `device.pair.remove` quản lý các bản ghi ghép đôi thiết bị.
    - `device.pair.rename` gán một nhãn toán tử (`{ deviceId, label }`) được ưu tiên hơn tên hiển thị do máy khách báo cáo và vẫn được duy trì sau khi sửa chữa hoặc phê duyệt lại thiết bị.
    - `device.token.rotate` luân chuyển token của thiết bị đã ghép đôi trong giới hạn vai trò được phê duyệt và phạm vi của bên gọi.
    - `device.token.revoke` thu hồi token của thiết bị đã ghép đôi trong giới hạn vai trò được phê duyệt và phạm vi của bên gọi.

    Mã thiết lập nhúng một thông tin xác thực khởi tạo có thời hạn ngắn. Máy khách không được
    ghi nhật ký hoặc lưu giữ thông tin này sau khi luồng ghép đôi kết thúc.

  </Accordion>

  <Accordion title="Ghép nối Node, gọi và công việc đang chờ xử lý">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject`, và `node.pair.remove` phụ trách phê duyệt năng lực của Node. `node.pair.request` và `node.pair.verify` đã bị loại bỏ trong phiên bản 2026.7 cùng với kho ghép nối Node độc lập; các yêu cầu đang chờ xử lý được Gateway tạo khi Node kết nối.
    - `node.list` và `node.describe` trả về trạng thái Node đã biết/đang kết nối.
    - `node.rename` cập nhật nhãn của một Node đã ghép nối.
    - `node.invoke` chuyển tiếp một lệnh đến Node đang kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu gọi.
    - `mcp.tools.call.v1` là lệnh máy chủ Node không giao diện để gọi một công cụ MCP cục bộ trên Node đã cấu hình. Lệnh này được truyền qua `node.invoke`, yêu cầu Node khai báo lệnh và vẫn chịu sự phê duyệt ghép nối cùng `gateway.nodes.denyCommands`.
    - `node.event` truyền các sự kiện bắt nguồn từ Node trở lại Gateway.
    - `node.pluginTools.update` là đường dẫn công bố duy nhất để thay thế các mô tả công cụ Plugin/MCP hiển thị với tác nhân của Node đang kết nối; các tham số `connect` không chứa chúng.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi của Node đang kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc bền vững đang chờ xử lý cho các Node ngoại tuyến/đã ngắt kết nối.

  </Accordion>

  <Accordion title="Các nhóm phê duyệt">
    - `approval.history` trả về các phê duyệt cuối cùng theo thứ tự mới nhất trước, được lưu giữ trong 30 ngày cho các yêu cầu thực thi, Plugin và tác nhân hệ thống (phạm vi `operator.approvals`). Phương thức này hỗ trợ phân trang bằng con trỏ cùng bộ lọc loại tùy chọn; các phê duyệt đang chờ xử lý không phải là hàng lịch sử.
    - `approval.get` và `approval.resolve` là các phương thức phê duyệt bền vững không phụ thuộc loại (phạm vi `operator.approvals`). `approval.get` trả về một phép chiếu đã làm sạch của trạng thái đang chờ xử lý hoặc trạng thái cuối được lưu giữ với `urlPath` ổn định; `approval.resolve` chấp nhận mã phê duyệt chuẩn, một `kind` rõ ràng và một quyết định, áp dụng cơ chế câu trả lời đầu tiên thắng, đồng thời luôn trả về kết quả chuẩn đã ghi nhận.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, và `exec.approval.resolve` phụ trách các yêu cầu phê duyệt thực thi một lần cùng việc tra cứu/phát lại phê duyệt đang chờ xử lý. Chúng là các bộ điều hợp biên giao thức trên cùng một sổ đăng ký phê duyệt bền vững.
    - `exec.approval.waitDecision` chờ một phê duyệt thực thi đang chờ xử lý và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý các bản chụp nhanh chính sách phê duyệt thực thi của Gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt thực thi cục bộ trên Node thông qua các lệnh chuyển tiếp của Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, và `plugin.approval.resolve` phụ trách các luồng phê duyệt do Plugin định nghĩa.

  </Accordion>

  <Accordion title="Các lệnh Control UI">
    - `ui.command` cho phép bên gọi `operator.write` gửi các lệnh bố cục và điều hướng có kiểu đến các máy khách Control UI đang kết nối có quảng bá năng lực `ui-commands`.
    - Các lệnh phụ trách việc chia/đóng/lấy tiêu điểm ngăn, khả năng hiển thị thanh bên, khả năng hiển thị và vị trí neo của bảng thiết bị đầu cuối/trình duyệt, cũng như điều hướng phiên.
    - Giao thức v1 chủ ý phát đến mọi Control UI đang kết nối và có năng lực. Nếu không có Control UI nào kết nối, yêu cầu sẽ thất bại với `UNAVAILABLE` thay vì giả vờ rằng bố cục đã thay đổi.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc vào Heartbeat tiếp theo; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - `cron.run` vẫn là một RPC kiểu đưa vào hàng đợi cho các lần chạy thủ công. Máy khách cần ngữ nghĩa hoàn tất nên đọc `runId` được trả về và thăm dò `cron.runs`.
    - `cron.runs` chấp nhận bộ lọc `runId` tùy chọn, không rỗng để máy khách có thể theo dõi một lần chạy thủ công trong hàng đợi mà không xảy ra tranh chấp với các mục lịch sử khác của cùng công việc.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Xem [Các phương thức trợ giúp cho người vận hành](#operator-helper-methods) bên dưới.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: các bản cập nhật trò chuyện trên giao diện người dùng như `chat.inject` và các sự kiện trò chuyện khác chỉ dành cho bản ghi
  hội thoại. Trong giao thức v4, tải trọng delta chứa `deltaText`; `message` vẫn là
  bản chụp nhanh tích lũy của trợ lý. Các thay thế không theo tiền tố đặt
  `replace=true` và sử dụng `deltaText` làm văn bản thay thế.
- `session.message`, `session.operation`, `session.tool`: các bản cập nhật bản ghi hội thoại, thao tác phiên
  đang diễn ra và luồng sự kiện cho một phiên đã đăng ký.
- `session.approval`: trạng thái phê duyệt đang chờ xử lý và cuối cùng đã được làm sạch cho bên đăng ký
  phiên chính xác đã chủ động chọn tham gia. Các phê duyệt con sử dụng đối tượng tổ tiên
  đã được lưu bền vững; sự kiện không bao giờ sửa đổi bản ghi hội thoại hoặc đánh thức tác nhân.
- `sessions.changed`: chỉ mục hoặc siêu dữ liệu phiên đã thay đổi.
- `presence`: các bản cập nhật bản chụp nhanh trạng thái hiện diện của hệ thống.
- `tick`: sự kiện duy trì kết nối/trạng thái hoạt động định kỳ.
- `health`: bản cập nhật bản chụp nhanh tình trạng Gateway.
- `heartbeat`: bản cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi lần chạy/công việc Cron.
- `shutdown`: thông báo tắt Gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép nối Node.
- `node.invoke.request`: phát rộng yêu cầu gọi Node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép nối.
- `voicewake.changed`: cấu hình kích hoạt bằng từ đánh thức đã thay đổi.
- `config.changed`: một thao tác ghi cấu hình đã được lưu bền vững (tải trọng chứa đường dẫn cấu hình,
  hàm băm bản chụp nhanh mới và dấu thời gian — không bao giờ chứa nội dung cấu hình). Có phạm vi đọc dành cho
  người vận hành; máy khách làm mới qua `config.get`.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt
  thực thi.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt
  Plugin.

### Các phương thức trợ giúp Node

Node có thể gọi `skills.bins` để truy xuất danh sách tệp thực thi Skills hiện tại
cho các bước kiểm tra tự động cho phép.

## RPC sổ cái kiểm tra

`audit.activity.list` cung cấp cho máy khách của người vận hành một chế độ xem ổn định theo thứ tự mới nhất trước về siêu dữ liệu vòng đời của
lần chạy tác nhân, hành động công cụ và tin nhắn chủ động chọn tham gia. Phương thức này yêu cầu
`operator.read`. Các truy vấn loại trừ bản ghi cũ hơn 30 ngày và sổ cái
SQLite dùng chung bị giới hạn ở 100.000 bản ghi. Các hàng hết hạn bị xóa trong quá trình
khởi động Gateway, bảo trì hằng giờ và các lần ghi sau đó. Xem
[Lịch sử kiểm tra](/vi/gateway/audit) để biết mô hình dữ liệu và ngữ nghĩa quyền riêng tư.

- Tham số: `agentId`, `sessionKey`, hoặc `runId` chính xác tùy chọn; `kind` tùy chọn
  (`"agent_run"`, `"tool_action"`, hoặc `"message"`); `status` tùy chọn
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"`, hoặc `"unknown"`); `direction` của tin nhắn tùy chọn (`"inbound"` hoặc
  `"outbound"`) và `channel` chính xác; các giới hạn mili giây Unix `after` / `before`
  bao hàm tùy chọn; `limit` tùy chọn từ `1` đến `500`; và chuỗi
  `cursor` tùy chọn từ trang trước.
- Kết quả: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Kiểu hợp kết quả V1 có tên có các lược đồ riêng cho lần chạy tác nhân, hành động công cụ, tin nhắn đến
và tin nhắn đi. Bộ phân biệt `eventType` lần lượt là
`agent_run`, `tool_action`, `inbound_message`, hoặc `outbound_message`; `kind` và
`direction` của tin nhắn vẫn có thể dùng để lọc và hiển thị. Mọi sự kiện đều có
`schemaVersion: 1` dạng số nguyên. Các tham chiếu danh tính tin nhắn sử dụng chính xác
định dạng `hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; mã tác nhân là người gửi của kênh
sử dụng cùng định dạng.

Tất cả biến thể đều yêu cầu `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor`, và
`redaction`. Các trường biến thể là:

| `eventType`        | Các trường bắt buộc                                               | Các trường tùy chọn                                                                                                             |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, các tham chiếu danh tính, `reasonCode`, `errorCode`                      |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, các tham chiếu danh tính, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Các enum tin nhắn đóng là:

- `conversationKind`: `direct`, `group`, `channel`, hoặc `unknown`.
- `outcome` đến: `completed`, `skipped`, hoặc `failed`; `reasonCode` tùy chọn:
  `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty`, hoặc `acp_dispatch_aborted`.
- `outcome` đi: `sent`, `suppressed`, `failed`, hoặc `unknown`; `reasonCode` tùy chọn:
  `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`,
  hoặc `no_visible_payload`. Một bộ điều hợp không trả về danh tính nền tảng là
  `unknown`, vì không thể bác bỏ tác dụng phụ bên ngoài.
- `deliveryKind`: `text`, `media`, hoặc `other`; `failureStage`:
  `platform_send`, `queue`, hoặc `unknown`.

Các trường cuối có tương quan với nhau, không phải từng trường tùy chọn độc lập:

| Biến thể         | Ánh xạ trạng thái kết thúc                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lượt chạy agent  | `started` không có `errorCode`; mỗi trạng thái hoàn tất không thành công đều yêu cầu mã `run_*` tương ứng.                                                                 |
| Hành động công cụ | `started` và trạng thái thành công không có `errorCode`; mỗi trạng thái hoàn tất khác đều yêu cầu mã `tool_*` tương ứng.                                                       |
| Tin nhắn đến     | thành công = `completed`; bị chặn = `skipped`; thất bại = `failed` cộng với `message_processing_failed`. `reasonCode`, khi có, phải thuộc họ trạng thái kết thúc đó. |
| Tin nhắn đi      | thành công = `sent`; bị chặn = `suppressed` cộng với `reasonCode`; thất bại = `failed` cộng với `errorCode` và `failureStage`; không xác định = `unknown` cộng với `failureStage`.      |

Mỗi sự kiện hoạt động bao gồm một mã định danh sự kiện ổn định, số thứ tự sổ cái tăng đơn điệu,
số thứ tự sự kiện nguồn, dấu thời gian, tác nhân, hành động, trạng thái, giá trị số nguyên
`schemaVersion: 1` và `redaction: "metadata_only"`. Bản ghi lượt chạy và công cụ
yêu cầu nguồn gốc agent và lượt chạy, đồng thời có thể bao gồm nguồn gốc phiên. Bản ghi
tin nhắn có thể bao gồm mã định danh agent và lượt chạy, nhưng có chủ ý không bao giờ bao gồm
`sessionKey` hoặc `sessionId`; do đó, bộ lọc truy vấn `sessionKey` chỉ áp dụng cho
các hàng lượt chạy và công cụ. Sự kiện công cụ có thể bao gồm mã định danh lệnh gọi công cụ và tên công cụ.

Bản ghi tin nhắn sử dụng `message.inbound.processed` hoặc
`message.outbound.finished` và bổ sung hướng, kênh, loại cuộc hội thoại,
kết quả đã chuẩn hóa, cùng loại phân phối, giai đoạn lỗi, thời lượng,
số lượng kết quả, mã lý do và các bút danh tài khoản/cuộc hội thoại/tin nhắn/đích
được định khóa cục bộ theo bản cài đặt (nếu có). Các bút danh này hỗ trợ
tương quan nhưng không phải là ẩn danh hóa: cơ sở dữ liệu trạng thái chứa khóa của chúng,
trong khi các bản xuất RPC và CLI thì không. Sổ cái không lưu prompt, nội dung
tin nhắn, đối số công cụ, kết quả công cụ, đầu ra lệnh hoặc văn bản lỗi thô.
Các giá trị `sessionKey` của lượt chạy/công cụ vẫn là siêu dữ liệu tương quan thô và có thể nhúng
mã định danh tài khoản nền tảng hoặc đối tác; bản ghi tin nhắn bỏ qua khóa phiên.

Đối với các hàng đến, `durationMs` đo quá trình điều phối lõi cho đến trạng thái kết thúc và
`resultCount` đếm các tải trọng công cụ, chặn và phản hồi đã hoàn tất trong hàng đợi. Đối với
các hàng đi, `durationMs` bao quát quyền sở hữu phân phối cho đến khi xác nhận,
đưa vào hàng thư chết hoặc đối soát (bao gồm thời gian chờ trong hàng đợi), và `resultCount`
đếm các lần gửi vật lý đã xác định trên nền tảng. `deliveryKind`, khi có,
mô tả tải trọng hiệu lực sau các hook và quá trình kết xuất; các hàng bị ngăn gửi hoặc
có trạng thái mơ hồ do sự cố sẽ bỏ qua giá trị này.

Phạm vi tin nhắn hiện tại bao gồm các tin nhắn đến được chấp nhận và đi đến
quá trình điều phối lõi, bao gồm các kết quả trùng lặp/kết thúc của lõi. Phạm vi tin nhắn đi ghi
một hàng kết thúc cho mỗi tải trọng phản hồi logic ban đầu đi đến cơ chế phân phối bền vững
dùng chung; việc chia nhỏ và phân nhánh qua bộ điều hợp được tổng hợp trong `resultCount`. Các lần gửi
có thể thử lại hoặc mơ hồ trong hàng đợi chỉ được ghi sau khi xác nhận, đưa vào hàng
thư chết hoặc đối soát. Các đường dẫn cục bộ của Plugin và gửi trực tiếp bỏ qua các
ranh giới dùng chung đó hiện chưa được bao phủ. Hàng đợi worker có giới hạn hoạt động theo khả năng tốt nhất
và có thể làm mất bản ghi khi xảy ra lỗi hoặc bão hòa, vì vậy bề mặt này không phải là
kho lưu trữ tuân thủ không mất dữ liệu.

Tính năng ghi được bật theo mặc định và được kiểm soát bởi
[`audit.enabled`](/vi/gateway/configuration-reference#audit). Việc ghi tin nhắn được
kiểm soát riêng bởi `audit.messages` và mặc định là `"off"`. Khi
tính năng ghi bị tắt, `audit.activity.list` vẫn tiếp tục cung cấp các bản ghi đã được ghi
trước đó cho đến khi chúng hết hạn.

Các lược đồ yêu cầu, kết quả và `AuditEvent` của `audit.list` đã phát hành vẫn
không thay đổi và chỉ trả về bản ghi lượt chạy agent và hành động công cụ. Các máy khách
vận hành mới nên gọi `audit.activity.list` khi Gateway quảng bá phương thức này. Các
Gateway cũ hơn có thể báo `unknown method: audit.activity.list` hoặc, do
việc ủy quyền diễn ra trước khi tra cứu phương thức trong các phiên bản đã phát hành, báo `missing scope:
operator.admin` cho một yêu cầu có phạm vi đọc. Chỉ coi trường hợp sau là phương thức
không tồn tại khi phương thức đó không được quảng bá. Sau đó, máy khách chỉ có thể thử lại `audit.list`
khi các bộ lọc của nó không yêu cầu hỗ trợ loại tin nhắn, hướng hoặc kênh.

Sử dụng [`openclaw audit`](/vi/cli/audit) cho các truy vấn văn bản và bản xuất JSON có giới hạn.

## RPC sổ cái tác vụ

Máy khách vận hành kiểm tra và hủy các bản ghi tác vụ nền của Gateway thông qua
các RPC sổ cái tác vụ (`packages/gateway-protocol/src/schema/tasks.ts`). Các RPC này
trả về bản tóm tắt tác vụ đã được làm sạch, không phải trạng thái thời gian chạy thô.

- `tasks.list` yêu cầu `operator.read`.
  - Tham số: `status` tùy chọn (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` hoặc `"timed_out"`) hoặc một mảng gồm các trạng thái đó,
    `agentId` tùy chọn, `sessionKey` tùy chọn, `limit` tùy chọn từ `1` đến
    `500`, và chuỗi `cursor` tùy chọn.
  - Kết quả: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` yêu cầu `operator.read`.
  - Tham số: `{ "taskId": string }`.
  - Kết quả: `{ "task": TaskSummary }`.
  - Mã định danh tác vụ không tồn tại trả về cấu trúc lỗi không tìm thấy của Gateway.
- `tasks.cancel` yêu cầu `operator.write`.
  - Tham số: `{ "taskId": string, "reason"?: string }`.
  - Kết quả: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` cho biết sổ cái có tác vụ khớp hay không. `cancelled`
    cho biết thời gian chạy có chấp nhận hoặc ghi nhận yêu cầu hủy hay không.

`TaskSummary` bao gồm `id`, `status` và siêu dữ liệu tùy chọn: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, các dấu thời gian, tiến độ,
bản tóm tắt kết thúc và văn bản lỗi đã được làm sạch. `agentId` xác định agent
đang thực thi tác vụ; `sessionKey` và `ownerKey` giữ lại ngữ cảnh của bên yêu cầu và ngữ cảnh điều khiển.

## Các phương thức trợ giúp dành cho người vận hành

- `commands.list` (`operator.read`) truy xuất danh mục lệnh thời gian chạy cho
  một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc mặc định của agent.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm đến: `text` trả về
    token lệnh văn bản chính không có `/` ở đầu; `native` và đường dẫn
    `both` mặc định trả về tên gốc nhận biết nhà cung cấp khi có.
  - `textAliases` chứa các bí danh dấu gạch chéo chính xác như `/model` và `/m`.
  - `nativeName` chứa tên lệnh gốc nhận biết nhà cung cấp khi
    có tên đó.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên gốc cùng tính khả dụng của lệnh Plugin
    gốc.
  - `includeArgs=false` loại bỏ siêu dữ liệu đối số đã tuần tự hóa khỏi phản hồi.
- `tools.catalog` (`operator.read`) truy xuất danh mục công cụ thời gian chạy cho một
  agent. Phản hồi bao gồm các công cụ được nhóm và siêu dữ liệu nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu Plugin khi `source="plugin"`
  - `optional`: công cụ Plugin có phải là tùy chọn hay không
- `tools.effective` (`operator.read`) truy xuất danh mục công cụ có hiệu lực trong thời gian chạy
  cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh thời gian chạy đáng tin cậy từ phiên ở phía máy chủ
    thay vì chấp nhận ngữ cảnh xác thực hoặc phân phối do bên gọi cung cấp.
  - Phản hồi là phép chiếu do máy chủ suy ra, giới hạn trong phiên, của danh mục
    đang hoạt động, bao gồm công cụ lõi, Plugin, kênh và máy chủ MCP
    đã được phát hiện.
  - `tools.effective` chỉ đọc đối với MCP: nó có thể chiếu danh mục MCP của phiên đang hoạt động
    qua chính sách công cụ cuối cùng, nhưng không tạo môi trường chạy MCP,
    kết nối phương thức truyền tải hoặc phát hành `tools/list`. Nếu không có danh mục đang hoạt động phù hợp,
    phản hồi có thể bao gồm thông báo như `mcp-not-yet-connected`,
    `mcp-not-yet-listed` hoặc `mcp-stale-catalog`.
  - Các mục công cụ có hiệu lực sử dụng `source="core"`, `source="plugin"`,
    `source="channel"` hoặc `source="mcp"`.
- `tools.invoke` (`operator.write`) gọi một công cụ khả dụng thông qua cùng
  đường dẫn chính sách Gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm` và
    `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều hiện diện, agent của phiên đã phân giải
    phải khớp với `agentId`.
  - Các trình bao bọc lõi chỉ dành cho chủ sở hữu như `cron`, `gateway` và `nodes` yêu cầu
    danh tính chủ sở hữu/quản trị viên (`operator.admin`) mặc dù bản thân `tools.invoke`
    là `operator.write`.
  - Phản hồi là một phong bì dành cho SDK với `ok`, `toolName`, `output`
    tùy chọn và các trường `error` có kiểu. Việc từ chối do phê duyệt hoặc chính sách trả về
    `ok:false` trong tải trọng thay vì bỏ qua pipeline chính sách công cụ
    của Gateway.
- `skills.status` (`operator.read`) truy xuất danh mục Skills hiển thị cho một
  agent.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc mặc định của agent.
  - Phản hồi bao gồm điều kiện đủ, các yêu cầu còn thiếu, kiểm tra cấu hình
    và các tùy chọn cài đặt đã được làm sạch mà không để lộ giá trị bí mật thô.
- `skills.search` và `skills.detail` (`operator.read`) trả về siêu dữ liệu
  khám phá ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` và `skills.upload.commit`
  (`operator.admin`) chuẩn bị một kho lưu trữ skill riêng tư trước khi cài đặt. Đây
  là đường dẫn tải lên quản trị riêng biệt dành cho máy khách đáng tin cậy, không phải luồng
  cài đặt skill ClawHub thông thường, và bị tắt theo mặc định trừ khi
  `skills.install.allowUploadedArchives` được bật.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tạo một lượt tải lên được liên kết với slug và giá trị ép buộc đó.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` nối thêm các byte tại
    độ lệch đã giải mã chính xác.
  - `skills.upload.commit({ uploadId, sha256? })` xác minh kích thước cuối cùng và
    SHA-256. Thao tác commit chỉ hoàn tất lượt tải lên; nó không cài đặt skill.
  - Các kho lưu trữ skill đã tải lên là kho lưu trữ zip chứa thư mục gốc `SKILL.md`. Tên
    thư mục nội bộ của kho lưu trữ không bao giờ chọn đích cài đặt.
- `skills.install` (`operator.admin`) có ba chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một
    thư mục skill vào thư mục `skills/` trong không gian làm việc mặc định của agent.
  - Chế độ tải lên: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    cài đặt một lượt tải lên đã commit vào thư mục `skills/<slug>`
    trong không gian làm việc mặc định của agent. Slug và giá trị ép buộc phải khớp với
    yêu cầu `skills.upload.begin` ban đầu. Yêu cầu bị từ chối trừ khi
    `skills.install.allowUploadedArchives` được bật; cài đặt này không
    ảnh hưởng đến các lượt cài đặt ClawHub.
  - Chế độ trình cài đặt Gateway: `{ name, installId, timeoutMs? }` chạy một hành động
    `metadata.openclaw.install` đã khai báo trên máy chủ Gateway. Các máy khách cũ hơn vẫn có thể
    gửi `dangerouslyForceUnsafeInstall`; trường này đã lỗi thời,
    chỉ được chấp nhận để tương thích giao thức và bị bỏ qua. Sử dụng
    `security.installPolicy` cho các quyết định cài đặt do người vận hành sở hữu.
- `skills.update` (`operator.admin`) có hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả lượt cài đặt ClawHub được theo dõi trong
    không gian làm việc mặc định của agent.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`,
    `apiKey` và `env`.

### Các chế độ xem `models.list`

`models.list` chấp nhận tham số `view` tùy chọn
(`src/agents/model-catalog-visibility.ts`):

- Bị bỏ qua hoặc `"default"`: nếu `agents.defaults.modelPolicy.allow` được cấu hình,
  phản hồi là danh mục được phép, bao gồm các mô hình được phát hiện động
  cho các mục `provider/*`. Nếu không, phản hồi là toàn bộ danh mục
  Gateway.
- `"configured"`: hành vi có kích thước phù hợp với bộ chọn. Nếu `agents.defaults.modelPolicy.allow`
  được cấu hình, nó vẫn được ưu tiên, bao gồm khám phá theo phạm vi nhà cung cấp cho
  các mục `provider/*`. Khi không có danh sách cho phép, phản hồi sử dụng các mục
  `models.providers.<provider>.models` rõ ràng và chỉ quay về toàn bộ
  danh mục khi không có hàng mô hình nào được cấu hình.
- `"provider-config"`: danh mục `models.providers.*.models` do nguồn tạo,
  độc lập với danh sách cho phép của bộ chọn. Các hàng bao gồm khả năng công khai của mô hình và
  tính khả dụng nhận biết tuyến, nhưng loại bỏ điểm cuối nhà cung cấp, tài liệu xác thực và
  cấu hình yêu cầu thời gian chạy.
- `"all"`: toàn bộ danh mục Gateway, bỏ qua `agents.defaults.modelPolicy.allow`. Dùng cho
  giao diện người dùng chẩn đoán/khám phá, không dùng cho bộ chọn mô hình thông thường.

## Phê duyệt thực thi

- Khi một yêu cầu thực thi cần được phê duyệt, Gateway phát rộng
  `exec.approval.requested`.
- Máy khách của người vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu
  `operator.approvals`).
- Đối với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan`
  (`argv`/`cwd`/`rawCommand`/siêu dữ liệu phiên chuẩn tắc). Các yêu cầu thiếu
  `systemRunPlan` sẽ bị từ chối.
- Sau khi được phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ tái sử dụng
  `systemRunPlan` chuẩn tắc đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc
  `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` cuối cùng đã được phê duyệt,
  Gateway sẽ từ chối chạy thay vì tin tưởng tải trọng đã bị thay đổi.

## Phương án dự phòng phân phối của agent

- Các yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối ra ngoài.
- `bestEffortDeliver=false` (mặc định) duy trì hành vi nghiêm ngặt: các đích
  phân phối không thể phân giải hoặc chỉ dùng nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép quay về chế độ thực thi chỉ trong phiên khi không thể
  phân giải tuyến phân phối bên ngoài (ví dụ: các phiên nội bộ/webchat
  hoặc cấu hình đa kênh không rõ ràng).
- Kết quả `agent` cuối cùng có thể bao gồm `result.deliveryStatus` khi đã yêu cầu phân phối,
  sử dụng cùng các trạng thái `sent`, `suppressed`, `partial_failed` và
  `failed` được ghi lại cho
  [`openclaw agent --json --deliver`](/vi/cli/agent#json-delivery-status).

## Quản lý phiên bản

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` và `MIN_PROBE_PROTOCOL_VERSION` nằm trong
  `packages/gateway-protocol/src/version.ts`.
- Máy khách gửi `minProtocol` + `maxProtocol`. Máy khách của người vận hành và giao diện người dùng phải
  bao gồm giao thức hiện tại trong phạm vi đó; máy khách và máy chủ hiện tại chạy
  giao thức v4.
- Máy khách đã xác thực có cả `role: "node"` và `client.mode: "node"`
  có thể sử dụng giao thức Node N-1 (hiện là v3). Các phép thăm dò khởi động lại hạng nhẹ sử dụng
  cùng cửa sổ N-1. Xác thực thiết bị, ghép nối, phạm vi, chính sách lệnh và phê duyệt
  thực thi không thay đổi bởi cửa sổ tương thích này. Các khả năng và lệnh Node
  do Plugin sở hữu bị giữ lại cho đến khi Node nâng cấp lên giao thức hiện tại
  vì các bề mặt được lưu trữ của chúng không thuộc hợp đồng N-1.
- Lược đồ và mô hình được tạo từ các định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số máy khách

Phần triển khai máy khách tham chiếu nằm trong `packages/gateway-client/src/`
(OpenClaw bao bọc nó thông qua facade `src/gateway/client.ts` mỏng). Các giá trị
mặc định này ổn định trên giao thức v4 và là đường cơ sở dự kiến cho
máy khách bên thứ ba.

| Hằng số                                   | Mặc định                                              | Nguồn                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                    | `packages/gateway-protocol/src/version.ts`                                                                                                        |
| `MIN_CLIENT_PROTOCOL_VERSION`                        | `4`                                    | `packages/gateway-protocol/src/version.ts`                                                                                                        |
| `MIN_NODE_PROTOCOL_VERSION`                        | `3`                                    | `packages/gateway-protocol/src/version.ts`                                                                                                        |
| `MIN_PROBE_PROTOCOL_VERSION`                        | `3`                                    | `packages/gateway-protocol/src/version.ts`                                                                                                        |
| Thời gian chờ yêu cầu (mỗi RPC)           | `30_000` ms                                 | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                                                   |
| Thời gian chờ xác thực trước / thử thách kết nối | `15_000` ms                          | `packages/gateway-client/src/timeouts.ts` (biến môi trường `OPENCLAW_HANDSHAKE_TIMEOUT_MS` có thể tăng ngân sách ghép cặp của máy chủ/máy khách)              |
| Thời gian chờ lùi khi kết nối lại ban đầu | `1_000` ms                                 | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                                                   |
| Thời gian chờ lùi tối đa khi kết nối lại  | `30_000` ms                                 | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                                                   |
| Giới hạn thử lại nhanh sau khi đóng do token thiết bị | `250` ms                     | `packages/gateway-client/src/client.ts`                                                                                                        |
| Thời gian gia hạn dừng cưỡng bức trước `terminate()` | `250` ms                  | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                                        |
| Thời gian chờ mặc định của `stopAndWait()` | `1_000` ms                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                        |
| Khoảng thời gian tick mặc định (trước `hello-ok`) | `30_000` ms                 | `packages/gateway-client/src/client.ts`                                                                                                        |
| Đóng do hết thời gian chờ tick            | mã `4000` khi thời gian im lặng vượt quá `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                     |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                                        |

Máy chủ thông báo `policy.tickIntervalMs`, `policy.maxPayload` và
`policy.maxBufferedBytes` có hiệu lực trong `hello-ok`; máy khách
nên tuân theo các giá trị đó thay vì các giá trị mặc định trước khi bắt tay.

Máy khách tham chiếu cho phép các yêu cầu hữu hạn tự quản lý thời hạn đã cấu hình khi
mọi yêu cầu đang chờ đều có thời hạn. Một yêu cầu `expectFinal` không có
`timeoutMs` hữu hạn, bất kỳ yêu cầu nào có `timeoutMs: null`, hoặc tổ hợp các yêu cầu hữu hạn và
không giới hạn đều duy trì watchdog nhịp hoạt động. Nếu các sự kiện đến và
phản hồi tiếp tục im lặng quá ngưỡng hết thời gian nhịp, máy khách sẽ đóng
socket với mã `4000`, từ chối mọi yêu cầu đang chờ và kết nối lại. Máy khách
không phát lại các yêu cầu đã bị từ chối sau khi kết nối lại.

## Xác thực

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy theo
  `gateway.auth.mode` đã cấu hình (`"none" | "token" | "password" | "trusted-proxy"`).
- Các chế độ mang danh tính như Tailscale Serve (`gateway.auth.allowTailscale: true`)
  hoặc `gateway.auth.mode: "trusted-proxy"` không phải loopback đáp ứng bước kiểm tra xác thực
  kết nối từ các tiêu đề yêu cầu thay vì `connect.params.auth.*`.
- `gateway.auth.mode: "none"` qua điểm vào riêng tư hoàn toàn bỏ qua xác thực kết nối
  bằng bí mật dùng chung; không để chế độ đó lộ ra trên điểm vào công khai/không đáng tin cậy.
- Sau khi ghép đôi, Gateway cấp một token thiết bị có phạm vi giới hạn theo vai trò
  kết nối + các phạm vi, được trả về trong `hello-ok.auth.deviceToken`. Máy khách nên
  lưu giữ token đó sau mọi lần kết nối thành công.
- Khi kết nối lại bằng token thiết bị đã lưu đó, cũng nên tái sử dụng tập
  phạm vi đã phê duyệt được lưu cho token đó. Điều này duy trì quyền truy cập đọc/thăm dò/trạng thái
  đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại thành một
  phạm vi ngầm định hẹp hơn chỉ dành cho quản trị viên.
- Tập hợp thông tin xác thực kết nối phía máy khách (`selectConnectAuth` trong
  `packages/gateway-client/src/client.ts`):
  - `auth.password` độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: trước tiên là token dùng chung tường minh,
    sau đó là `deviceToken` tường minh, rồi đến token được lưu theo từng thiết bị (được định danh bằng
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không có mục nào ở trên phân giải được
    `auth.token`. Token dùng chung hoặc bất kỳ token thiết bị nào đã phân giải đều ngăn việc gửi mục này.
  - Việc tự động nâng cấp token thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được phép đối với các điểm cuối đáng tin cậy: loopback,
    hoặc `wss://` có `tlsFingerprint` được ghim. `wss://` công khai không có ghim
    không đáp ứng điều kiện.
- Quá trình khởi tạo bằng mã thiết lập tích hợp trả về Node chính
  `hello-ok.auth.deviceToken` cùng một token người vận hành có giới hạn trong
  `hello-ok.auth.deviceTokens` để chuyển giao an toàn cho thiết bị di động. Token người vận hành
  bao gồm `operator.talk.secrets` để đọc cấu hình Talk gốc, nhưng
  không bao gồm các phạm vi thay đổi ghép đôi và `operator.admin`.
- Trong khi quá trình khởi tạo bằng mã thiết lập không thuộc đường cơ sở chờ phê duyệt,
  chi tiết `PAIRING_REQUIRED` bao gồm `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` và `pauseReconnect: false`. Tiếp tục kết nối lại bằng cùng
  token khởi tạo cho đến khi yêu cầu được phê duyệt hoặc token trở nên
  không hợp lệ.
- Chỉ lưu giữ `hello-ok.auth.deviceTokens` khi kết nối sử dụng xác thực
  khởi tạo trên phương thức truyền tải đáng tin cậy như `wss://` hoặc ghép đôi loopback/cục bộ.
- Nếu máy khách cung cấp `deviceToken` tường minh hoặc `scopes` tường minh, tập
  phạm vi do bên gọi yêu cầu đó vẫn có hiệu lực quyết định; các phạm vi được lưu đệm chỉ
  được tái sử dụng khi máy khách tái sử dụng token được lưu theo từng thiết bị.
- Có thể xoay vòng/thu hồi token thiết bị thông qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu `operator.pairing`). Việc xoay vòng hoặc thu hồi
  token của Node hoặc vai trò khác không phải người vận hành cũng yêu cầu `operator.admin`.
- `device.token.rotate` trả về siêu dữ liệu xoay vòng. Nó chỉ trả lại token mang thay thế
  cho các lệnh gọi từ cùng thiết bị đã được xác thực bằng token
  thiết bị đó, để máy khách chỉ dùng token có thể lưu giữ token thay thế trước khi
  kết nối lại. Các thao tác xoay vòng bằng bí mật dùng chung/quản trị viên không trả lại token mang.
- Việc cấp, xoay vòng và thu hồi token luôn bị giới hạn trong tập vai trò đã phê duyệt
  được ghi lại trong mục ghép đôi của thiết bị đó; thao tác thay đổi token không thể mở rộng hoặc
  nhắm đến một vai trò thiết bị mà phê duyệt ghép đôi chưa từng cấp.
- Đối với các phiên token của thiết bị đã ghép đôi, việc quản lý thiết bị chỉ giới hạn ở chính thiết bị đó, trừ khi
  bên gọi cũng có `operator.admin`: bên gọi không phải quản trị viên chỉ có thể quản lý
  token người vận hành cho mục thiết bị của chính họ. Việc quản lý token của Node và
  các vai trò khác không phải người vận hành chỉ dành cho quản trị viên, ngay cả với thiết bị của chính bên gọi.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi
  token người vận hành đích so với các phạm vi phiên hiện tại của bên gọi.
  Bên gọi không phải quản trị viên không thể xoay vòng hoặc thu hồi token người vận hành có phạm vi rộng hơn token
  mà họ đang nắm giữ.
- Lỗi xác thực bao gồm `error.details.code` cùng các gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep`: một trong `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Hành vi của máy khách đối với `AUTH_TOKEN_MISMATCH`:
  - Máy khách đáng tin cậy có thể thực hiện một lần thử lại có giới hạn bằng token được lưu đệm theo từng thiết bị.
  - Nếu lần thử lại đó thất bại, hãy dừng các vòng lặp kết nối lại tự động và hiển thị hướng dẫn
    hành động cho người vận hành.
- `AUTH_SCOPE_MISMATCH` có nghĩa là token thiết bị đã được nhận dạng nhưng không
  bao phủ vai trò/các phạm vi được yêu cầu. Không trình bày trường hợp này như một token không hợp lệ; hãy nhắc
  người vận hành ghép đôi lại hoặc phê duyệt hợp đồng phạm vi hẹp hơn/rộng hơn.

## Danh tính thiết bị và ghép nối

- Các Node phải chứa danh tính thiết bị ổn định (`device.id`) được suy ra từ
  dấu vân tay của cặp khóa.
- Gateway cấp token theo từng thiết bị + vai trò.
- Các ID thiết bị mới phải được phê duyệt ghép nối, trừ khi tính năng
  tự động phê duyệt cục bộ được bật.
- Tự động phê duyệt ghép nối tập trung vào các kết nối loopback cục bộ trực tiếp.
- OpenClaw cũng có một đường dẫn tự kết nối hẹp, cục bộ trong backend/container dành cho
  các luồng trình trợ giúp dùng bí mật dùng chung đáng tin cậy.
- Các kết nối tailnet hoặc LAN trên cùng máy chủ vẫn được xem là từ xa khi ghép nối
  và cần được phê duyệt.
- Các máy khách WS thường gửi kèm danh tính `device` trong `connect` (operator +
  node). Các ngoại lệ operator không có thiết bị duy nhất là những đường dẫn tin cậy rõ ràng:
  - `gateway.controlUi.allowInsecureAuth=true` để tương thích với HTTP không an toàn
    chỉ trên localhost.
  - xác thực operator thành công trên Control UI bằng `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (biện pháp khẩn cấp, làm suy giảm
    nghiêm trọng mức độ bảo mật).
  - Các RPC backend `gateway-client` qua loopback trực tiếp trên đường dẫn trình trợ giúp
    nội bộ dành riêng.
- Việc bỏ qua danh tính thiết bị gây ra hệ quả về phạm vi. Khi một kết nối
  operator không có thiết bị được cho phép qua một đường dẫn tin cậy rõ ràng, OpenClaw
  vẫn xóa các phạm vi do kết nối tự khai báo thành một tập hợp rỗng, trừ khi đường dẫn đó có
  một ngoại lệ duy trì phạm vi được đặt tên. Khi đó, các phương thức bị giới hạn theo phạm vi sẽ thất bại với
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` là một đường dẫn duy trì phạm vi khẩn cấp
  của Control UI. Đường dẫn này không cấp phạm vi cho các máy khách WebSocket backend tùy chỉnh
  hoặc có cấu trúc giống CLI bất kỳ.
- Đường dẫn trình trợ giúp backend `gateway-client` qua loopback trực tiếp dành riêng chỉ duy trì
  phạm vi cho các RPC mặt phẳng điều khiển cục bộ nội bộ; các ID backend tùy chỉnh
  không nhận được ngoại lệ này.
- Tất cả kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán quá trình di chuyển xác thực thiết bị

Đối với các máy khách cũ vẫn sử dụng hành vi ký trước cơ chế thử thách, `connect`
trả về các mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` với một
`error.details.reason` ổn định.

Các lỗi di chuyển thường gặp:

| Thông báo                     | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Máy khách đã bỏ qua `device.nonce` (hoặc gửi giá trị trống).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Máy khách đã ký bằng nonce cũ/không đúng.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp với payload v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp với dấu vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai không thành công.         |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký payload v2 có chứa nonce của máy chủ.
- Gửi cùng nonce đó trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`
  (`buildDeviceAuthPayloadV3` trong `packages/gateway-client/src/device-auth.ts`),
  liên kết `platform` và `deviceFamily` ngoài các trường
  thiết bị/máy khách/vai trò/phạm vi/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để đảm bảo khả năng tương thích, nhưng việc ghim
  siêu dữ liệu thiết bị đã ghép đôi vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS và ghim

- TLS được hỗ trợ cho các kết nối WS (cấu hình `gateway.tls`).
- Máy khách có thể tùy chọn ghim dấu vân tay chứng chỉ Gateway qua
  `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`.

## Phạm vi

Giao thức này cung cấp toàn bộ API Gateway: trạng thái, kênh, mô hình, trò chuyện,
tác nhân, phiên, Node, phê duyệt và nhiều nội dung khác. Bề mặt chính xác được xác định bởi
các lược đồ TypeBox được tái xuất từ `packages/gateway-protocol/src/schema.ts`.

## Liên quan

- [Xây dựng máy khách Gateway](https://docs.openclaw.ai/gateway/clients)
- [Nhúng OpenClaw](https://docs.openclaw.ai/gateway/embedding)
- [Giao thức cầu nối](/vi/gateway/bridge-protocol)
- [Cẩm nang vận hành Gateway](/vi/gateway)
