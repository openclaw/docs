---
read_when:
    - Triển khai hoặc cập nhật các máy khách WS của Gateway
    - Gỡ lỗi tình trạng không khớp giao thức hoặc lỗi kết nối
    - Tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung dữ liệu, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-07-16T14:27:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức WS của Gateway là mặt phẳng điều khiển duy nhất và phương thức truyền tải Node cho
OpenClaw. Các máy khách vận hành và Node (CLI, giao diện web, ứng dụng macOS, các Node iOS/Android,
các Node không giao diện) kết nối qua WebSocket và khai báo **vai trò** cùng **phạm vi** tại
thời điểm bắt tay.

## Phương thức truyền tải và đóng khung

- WebSocket, khung văn bản, tải trọng JSON.
- Khung đầu tiên **phải** là một yêu cầu `connect`.
- Các khung trước khi kết nối bị giới hạn ở 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Sau
  khi bắt tay, tuân theo `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán, các
  khung đến quá lớn và bộ đệm đi chậm sẽ phát ra các sự kiện `payload.large` trước khi
  Gateway đóng kết nối hoặc loại bỏ khung. Các sự kiện này chứa `surface`, kích thước
  theo byte, giới hạn và mã lý do an toàn; tuyệt đối không chứa nội dung thư, nội dung
  tệp đính kèm, byte khung thô, token, cookie hoặc bí mật.

Hình dạng khung:

- Yêu cầu: `{type:"req", id, method, params}`
- Phản hồi: `{type:"res", id, ok, payload|error}`
- Sự kiện: `{type:"event", event, payload, seq?, stateVersion?}`

Các phương thức gây tác dụng phụ yêu cầu khóa đảm bảo tính lũy đẳng (xem lược đồ).

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
báo cáo vai trò/phạm vi đã thương lượng ngay cả khi không cấp token thiết bị (hình dạng
ở trên). `pluginSurfaceUrls` là tùy chọn và ánh xạ tên bề mặt Plugin (ví dụ:
`canvas`) tới các URL được lưu trữ có phạm vi; mục này có thể hết hạn, vì vậy các Node gọi
`node.pluginSurface.refresh` với `{ "surface": "canvas" }` để nhận mục mới.
Đường dẫn `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
đã lỗi thời không được hỗ trợ; hãy sử dụng các bề mặt Plugin.
`appliedConfigHash` tùy chọn của ảnh chụp nhanh là bản sửa đổi cấu hình nguồn đã phân giải
được môi trường chạy Gateway đang hoạt động chấp nhận. Máy khách có thể so sánh nó với
`config.get.configRevisionHash` để xác định xem cấu hình mới hơn đã lưu có còn
cần khởi động lại hay không. `config.get.hash` vẫn là bản sửa đổi tệp gốc thô được các
cơ chế bảo vệ xung đột khi ghi cấu hình sử dụng.

Trong khi Gateway vẫn đang hoàn tất các tiến trình phụ lúc khởi động, `connect` có thể trả về
lỗi `UNAVAILABLE` có thể thử lại, kèm `details.reason: "startup-sidecars"` và
`retryAfterMs`. Hãy thử lại trong giới hạn thời gian kết nối thay vì coi đó là
lỗi bắt tay cuối cùng.

Khi token thiết bị được cấp, `hello-ok.auth` sẽ thêm token đó:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Cơ chế khởi tạo tích hợp bằng mã QR/mã thiết lập là đường dẫn bàn giao cho thiết bị di động. Một lần
kết nối bằng mã thiết lập cơ sở thành công sẽ trả về một token Node chính cùng một
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

Việc bàn giao cho người vận hành này được cố ý giới hạn: đủ để bắt đầu vòng lặp
người vận hành trên thiết bị di động và thiết lập gốc, bao gồm `operator.talk.secrets` để đọc
cấu hình Talk, nhưng không có phạm vi thay đổi ghép nối và không có `operator.admin`. Quyền
ghép nối/quản trị rộng hơn cần một luồng ghép nối hoặc token được phê duyệt riêng. Chỉ duy trì
`hello-ok.auth.deviceTokens` khi xác thực khởi tạo chạy qua một phương thức truyền tải đáng tin cậy
(`wss://` hoặc ghép nối loopback/cục bộ).

Các máy khách backend đáng tin cậy trong cùng tiến trình (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên các kết nối loopback trực tiếp khi
xác thực bằng token/mật khẩu dùng chung của Gateway. Đường dẫn này chỉ dành riêng
cho các RPC mặt phẳng điều khiển nội bộ (ví dụ: cập nhật phiên của tác tử con) và tránh
việc đường cơ sở ghép nối CLI/thiết bị lỗi thời chặn công việc backend cục bộ. Các máy khách
từ xa, có nguồn gốc từ trình duyệt, Node và máy khách dùng token thiết bị/danh tính thiết bị rõ ràng vẫn
phải trải qua các bước kiểm tra ghép nối và nâng cấp phạm vi thông thường.

### Vai trò worker và giao thức đóng

Các worker đám mây sử dụng một điểm vào loopback chuyên dụng thông qua đường hầm SSH do Gateway sở hữu
và được ghim khóa máy chủ. Điểm vào này chỉ chấp nhận danh tính worker và không bao giờ điều phối
xác thực chung, sự kiện Node, RPC của người vận hành hoặc phương thức Plugin. Một `connect` nghiêm ngặt
xác minh thông tin xác thực có thời hạn ngắn, được băm khi lưu trữ và ràng buộc với môi trường, hàm băm
gói, kỷ nguyên chủ sở hữu, phiên bản tập RPC, thời điểm hết hạn và một phiên có thể là null; nó
kiểm tra riêng phiên bản hiện tại và tập tính năng. Thành công trả về
`worker-hello-ok` tối thiểu; việc thương lượng tính năng độc lập với phiên bản
giao thức chung. Các khung duy trì dưới 64 KiB, ngoại trừ khung `worker.inference.start`
đã thương lượng có thể lên tới 25 MiB. Danh sách cho phép đóng chứa `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` và
`worker.inference.cancel`.

Các lần ghi nhận bản chép lời sử dụng rào chắn kỷ nguyên chủ sở hữu, liên kết phiên do Gateway sở hữu,
cơ chế so sánh-và-hoán-đổi lá cơ sở và phát lại chuỗi bền vững; Gateway tạo
mục bản chép lời và ID cha thông qua trình ghi phiên thông thường. Quyền sở hữu và
thời hạn được kiểm tra lại trên mỗi RPC.

### Khả năng của máy khách

Máy khách vận hành có thể quảng bá các khả năng tùy chọn trong `connect.params.caps`:

- `tool-events`: chấp nhận các sự kiện vòng đời công cụ có cấu trúc.
- `inline-widgets`: có thể kết xuất kết quả công cụ tiện ích nội tuyến được lưu trữ.

Khả năng của máy khách mô tả máy khách đang kết nối, không phải quyền hạn. Các công cụ tác tử có thể khai báo những khả năng bắt buộc; Gateway bỏ qua các công cụ đó trừ khi mọi yêu cầu đều xuất hiện trong `caps` của máy khách khởi tạo. Các lượt chạy bắt nguồn từ kênh không có khả năng máy khách Gateway, vì vậy những công cụ bị giới hạn theo khả năng sẽ không khả dụng ngay cả khi chính sách công cụ cho phép rõ ràng.

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

Các Node khai báo yêu cầu về khả năng tại thời điểm kết nối:

- `caps`: các danh mục cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: danh sách lệnh được phép gọi.
- `permissions`: các nút bật/tắt chi tiết (ví dụ: `screen.record`, `camera.capture`).

Gateway xem đây là các khai báo và thực thi danh sách cho phép phía máy chủ.

## Vai trò và phạm vi

Để biết đầy đủ mô hình phạm vi người vận hành, các bước kiểm tra tại thời điểm phê duyệt và ngữ nghĩa
bí mật dùng chung, hãy xem [Phạm vi người vận hành](/vi/gateway/operator-scopes).

Vai trò:

- `operator`: máy khách mặt phẳng điều khiển (CLI/giao diện người dùng/tự động hóa).
- `node`: máy chủ khả năng (camera/màn hình/canvas/system.run).
- `worker`: máy chủ thực thi đám mây trên giao thức worker chuyên dụng, đóng.

Phạm vi người vận hành (`src/gateway/operator-scopes.ts`), toàn bộ tập đóng:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` với `includeSecrets: true` yêu cầu `operator.talk.secrets` (hoặc
`operator.admin`). Khi bao gồm bí mật, hãy đọc thông tin xác thực của nhà cung cấp Talk đang hoạt động
từ `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
vẫn giữ hình dạng nguồn và có thể là một đối tượng SecretRef hoặc chuỗi đã che.

Các phương thức RPC của Gateway do Plugin đăng ký có thể yêu cầu phạm vi người vận hành riêng,
nhưng các tiền tố lõi dành riêng này luôn phân giải thành `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Phạm vi phương thức chỉ là cổng kiểm tra đầu tiên. Một số lệnh gạch chéo được truy cập qua
`chat.send` áp dụng các bước kiểm tra cấp lệnh nghiêm ngặt hơn: các lần ghi `/config set` và
`/config unset` lâu dài yêu cầu `operator.admin` ngay cả với các máy khách Gateway
đã có phạm vi người vận hành thấp hơn.

`node.pair.approve` có thêm bước kiểm tra phạm vi tại thời điểm phê duyệt bên cạnh phạm vi
phương thức cơ sở (`operator.pairing`), dựa trên `commands` đã khai báo
của yêu cầu đang chờ xử lý (`src/infra/node-pairing-authz.ts`):

| Các lệnh đã khai báo                                                                                                          | Phạm vi bắt buộc                       |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| không có                                                                                                                      | `operator.pairing`                    |
| các lệnh thông thường                                                                                                         | `operator.pairing` + `operator.write` |
| bao gồm `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` hoặc `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Caps/commands/permissions (Node)

Các Node khai báo yêu cầu về khả năng tại thời điểm kết nối:

- `caps`: các danh mục khả năng cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice` và `talk`.
- `commands`: danh sách lệnh được phép gọi.
- `permissions`: các nút bật/tắt chi tiết (ví dụ: `screen.record`, `camera.capture`).

Gateway coi các mục này là **xác nhận** và thực thi danh sách cho phép ở phía máy chủ.
Các node đã kết nối có thể công bố các bộ mô tả Plugin hoặc công cụ MCP tùy chọn mà tác nhân có thể thấy bằng `node.pluginTools.update` sau khi kết nối hoặc
kết nối lại thành công. Các máy chủ node không có giao diện sẽ khởi động lại để áp dụng các thay đổi
đối với danh mục MCP khai báo. Phương thức cập nhật này là đường dẫn công bố duy nhất; các bộ mô tả công cụ Plugin không được chấp nhận trong
các tham số `connect`. Mỗi bộ mô tả phải sử dụng một `name` công cụ an toàn cho nhà cung cấp và chỉ định
một `command` trong danh sách lệnh hiện được phép của node. Gateway tin cậy siêu dữ liệu của bộ mô tả
từ node đã ghép cặp, lọc các bộ mô tả nằm ngoài phạm vi lệnh
được phê duyệt, xóa chúng khi node ngắt kết nối và từ chối các nỗ lực của người vận hành
nhằm thay đổi danh mục của node khác. Đặt `gateway.nodes.pluginTools.enabled: false`
để bỏ qua các bộ mô tả do node công bố.

Các máy chủ node đã kết nối công bố danh mục thay thế skill hoàn chỉnh của chúng bằng
`node.skills.update`. Phương thức dành cho vai trò node này là đường dẫn công bố skill của node
duy nhất; các skill không được chấp nhận trong tham số `connect`. Mỗi bộ mô tả chứa
tên an toàn, mô tả và nội dung `SKILL.md` có giới hạn. Gateway phân tích
nội dung đó bằng trình tải skill thông thường, đưa nội dung này vào ảnh chụp nhanh skill của tác nhân
khi node đang kết nối và xóa khi ngắt kết nối. Đặt
`gateway.nodes.skills.enabled: false` để bỏ qua các skill do node công bố.

## Trạng thái hiện diện

- `system-presence` trả về các mục được định khóa theo danh tính thiết bị, bao gồm
  `deviceId`, `roles` và `scopes`, để giao diện người dùng có thể hiển thị một hàng cho mỗi thiết bị ngay cả
  khi thiết bị kết nối với cả vai trò người vận hành và node.
- `node.list` bao gồm `lastSeenAtMs` và `lastSeenReason` tùy chọn. Các node đã kết nối
  báo cáo thời gian kết nối hiện tại với lý do `connect`; các node đã ghép cặp
  cũng có thể báo cáo trạng thái hiện diện nền bền vững thông qua một sự kiện node đáng tin cậy.

Các node macOS gốc cũng có thể gửi các sự kiện `node.presence.activity` đã xác thực
với thời gian đầu vào không hoạt động có giới hạn. Gateway tự suy ra dấu thời gian hoạt động theo
đồng hồ của mình, hiển thị máy Mac được kết nối gần đây nhất qua `node.list` và
`node.describe`, đồng thời phát các bản cập nhật `node.presence` tới các máy khách có phạm vi đọc.
Xem [Trạng thái hiện diện của máy tính đang hoạt động](/nodes/presence) để biết hành vi lựa chọn, quyền riêng tư, ngữ cảnh
mô hình và định tuyến thông báo.

### Sự kiện node còn hoạt động trong nền

Các node gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một
node đã ghép cặp còn hoạt động trong lần đánh thức nền mà không đánh dấu node đó là đang kết nối:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Các giá trị không xác định được chuẩn hóa thành
`background` (`src/shared/node-presence.ts`). Sự kiện chỉ được lưu bền vững cho
các phiên thiết bị node đã xác thực; các phiên không có thiết bị hoặc chưa ghép cặp trả về
`handled: false`.

Các Gateway xử lý thành công trả về kết quả có cấu trúc:

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

## Phạm vi sự kiện phát

Các sự kiện phát do máy chủ đẩy được kiểm soát theo phạm vi để các phiên chỉ dành cho
ghép cặp hoặc node không thụ động nhận nội dung phiên
(`src/gateway/server-broadcast.ts`):

- Các khung trò chuyện, tác nhân và kết quả công cụ (các sự kiện `agent` được truyền phát trực tuyến, các sự kiện kết quả công cụ)
  yêu cầu ít nhất `operator.read`. Các phiên không có phạm vi này sẽ bỏ qua hoàn toàn
  các khung đó.
- Các sự kiện phát `plugin.*` do Plugin định nghĩa mặc định bị giới hạn ở `operator.write` hoặc
  `operator.admin`; các mục rõ ràng như
  `plugin.approval.requested` / `plugin.approval.resolved` sử dụng
  `operator.approvals` thay thế.
- Các sự kiện trạng thái/vận chuyển (`heartbeat`, `presence`, `tick`, vòng đời
  kết nối/ngắt kết nối) vẫn không bị hạn chế để mọi
  phiên đã xác thực đều có thể quan sát tình trạng vận chuyển.
- Các họ sự kiện phát không xác định mặc định bị kiểm soát theo phạm vi (đóng khi lỗi)
  trừ khi trình xử lý đã đăng ký nới lỏng chúng một cách rõ ràng.

Mỗi kết nối máy khách duy trì số thứ tự riêng cho từng máy khách, vì vậy các sự kiện phát
vẫn được sắp xếp tăng dần đơn điệu trên socket đó ngay cả khi các máy khách khác nhau nhìn thấy
các tập con khác nhau của luồng sự kiện sau khi lọc theo phạm vi.

## Các họ phương thức RPC

`hello-ok.features.methods` là danh sách khám phá thận trọng được xây dựng từ
`src/gateway/server-methods-list.ts` cộng với các bản xuất phương thức Plugin/kênh
đã tải — đây không phải bản kết xuất được tạo tự động của mọi phương thức, và một số phương thức (ví dụ
`push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
được chủ ý loại khỏi quá trình khám phá dù chúng là các phương thức thực, có thể gọi.
Hãy coi đây là hoạt động khám phá tính năng, không phải danh sách liệt kê đầy đủ
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về ảnh chụp nhanh tình trạng Gateway từ bộ nhớ đệm hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi chẩn đoán độ ổn định gần đây có giới hạn: tên sự kiện, số lượng, kích thước byte, số đo bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin, mã định danh phiên. Không có văn bản trò chuyện, nội dung Webhook, đầu ra công cụ, nội dung yêu cầu/phản hồi thô, token, cookie hoặc bí mật. Yêu cầu `operator.read`.
    - `status` trả về bản tóm tắt Gateway theo kiểu `/status`; các trường nhạy cảm chỉ dành cho máy khách người vận hành có phạm vi quản trị.
    - `gateway.identity.get` trả về danh tính thiết bị Gateway được dùng bởi các luồng chuyển tiếp và ghép cặp.
    - `system-presence` trả về ảnh chụp nhanh trạng thái hiện diện hiện tại cho các thiết bị người vận hành/node đã kết nối.
    - `system-event` nối thêm một sự kiện hệ thống và có thể cập nhật/phát ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện Heartbeat được lưu bền vững gần nhất.
    - `set-heartbeats` bật hoặc tắt quá trình xử lý Heartbeat trên Gateway.
    - `gateway.suspend.prepare` chỉ tạo một hợp đồng thuê tạm ngưng phối hợp ngắn khi công việc Gateway được theo dõi đang nhàn rỗi. `gateway.suspend.status` kiểm tra hợp đồng thuê đó và `gateway.suspend.resume` giải phóng nó sau khi khôi phục hoặc sau khi một thao tác máy chủ bị hủy.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Xem các chế độ xem "`models.list`" bên dưới.
    - `usage.status` trả về các cửa sổ sử dụng nhà cung cấp/bản tóm tắt hạn ngạch còn lại.
    - `usage.cost` trả về bản tóm tắt tổng hợp mức sử dụng chi phí cho một khoảng ngày. Truyền `agentId` cho một tác nhân hoặc `agentScope: "all"` để tổng hợp các tác nhân đã cấu hình.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của bộ nhớ vector/embedding được lưu đệm cho không gian làm việc của tác nhân mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` để thực hiện ping trực tiếp rõ ràng tới nhà cung cấp embedding. Truyền `{ "agentId": "agent-id" }` để giới hạn thống kê kho Dreaming trong một không gian làm việc của tác nhân; nếu bỏ qua, các không gian làm việc Dreaming đã cấu hình sẽ được tổng hợp.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` và `doctor.memory.dedupeDreamDiary` chấp nhận `{ "agentId": "agent-id" }` tùy chọn; nếu bỏ qua, chúng hoạt động trên không gian làm việc của tác nhân mặc định đã cấu hình.
    - `doctor.memory.remHarness` trả về bản xem trước bộ kiểm thử REM chỉ đọc có giới hạn dành cho các máy khách mặt phẳng điều khiển từ xa, bao gồm đường dẫn không gian làm việc, đoạn trích bộ nhớ, markdown có căn cứ đã kết xuất và các ứng viên thăng hạng sâu. Yêu cầu `operator.read`.
    - `sessions.usage` trả về bản tóm tắt mức sử dụng theo từng phiên. Truyền `agentId` cho một tác nhân hoặc `agentScope: "all"` để liệt kê các tác nhân đã cấu hình cùng nhau.
      Cả hai phương thức sử dụng đều chấp nhận `mode: "specific"` với `timeZone` IANA để xác định ranh giới và nhóm ngày theo lịch có nhận biết DST. `utcOffset` vẫn được hỗ trợ cho các máy khách cũ và làm phương án dự phòng khi runtime Gateway không nhận dạng múi giờ được yêu cầu.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình hỗ trợ đăng nhập">
    - `channels.status` trả về bản tóm tắt trạng thái của các kênh/Plugin tích hợp sẵn và đi kèm.
    - `channels.logout` đăng xuất khỏi một kênh/tài khoản cụ thể nếu kênh đó hỗ trợ.
    - `web.login.start` bắt đầu luồng đăng nhập bằng QR/web cho nhà cung cấp kênh web hiện tại có hỗ trợ QR.
    - `web.login.wait` chờ luồng đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi thông báo đẩy APNs thử nghiệm tới một node iOS đã đăng ký.
    - `voicewake.get` trả về các trình kích hoạt từ đánh thức đã lưu.
    - `voicewake.set` cập nhật các trình kích hoạt từ đánh thức và phát thay đổi.

  </Accordion>

  <Accordion title="Quản lý Plugin">
    - `plugins.list` (`operator.read`) trả về danh mục Plugin đã cài đặt cùng với các lựa chọn chính thức được tuyển chọn cục bộ, dữ liệu chẩn đoán và thông tin liệu chế độ cài đặt hiện tại có cho phép thay đổi hay không.
    - `plugins.search` (`operator.read`) tìm kiếm các họ Plugin mã và Plugin gói có thể cài đặt trên ClawHub. Truyền `query` không rỗng và `limit` tùy chọn từ 1 đến 100.
    - `plugins.install` (`operator.admin`) cài đặt một mục danh mục chính thức bằng `{ source: "official", pluginId }` hoặc một gói ClawHub bằng `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Các bản cài đặt ClawHub duy trì các bước kiểm tra độ tin cậy, tính toàn vẹn và chính sách cài đặt của Gateway. Các bản cài đặt thành công yêu cầu khởi động lại Gateway.
    - `plugins.setEnabled` (`operator.admin`) thay đổi chính sách bật của một Plugin đã cài đặt bằng `{ pluginId, enabled }`. Phản hồi bao gồm mục danh mục đã cập nhật, siêu dữ liệu khởi động lại và mọi cảnh báo lựa chọn vị trí.
    - `plugins.uninstall` (`operator.admin`) xóa một Plugin được cài đặt bên ngoài bằng `{ pluginId }`: các tham chiếu cấu hình, bản ghi cài đặt và các tệp được quản lý. Không thể gỡ cài đặt các Plugin đi kèm, chỉ có thể tắt chúng. Phản hồi liệt kê các thao tác xóa và luôn yêu cầu khởi động lại Gateway.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC chuyển phát đi trực tiếp dành cho các lần gửi nhắm tới kênh/tài khoản/luồng bên ngoài trình chạy trò chuyện.
    - `logs.tail` trả về phần cuối nhật ký tệp Gateway đã cấu hình với các điều khiển con trỏ/giới hạn và số byte tối đa.

  </Accordion>

  <Accordion title="Thiết bị đầu cuối của người vận hành">
    - `terminal.open` khởi động một PTY máy chủ cho `agentId` được chỉ định hoặc tác tử mặc định, rồi trả về tác tử đã phân giải, thư mục làm việc, shell và trạng thái cô lập.
    - `terminal.input`, `terminal.resize` và `terminal.close` chỉ thao tác trên các phiên thuộc sở hữu của kết nối gọi.
    - `terminal.upload` chấp nhận một tệp base64 tối đa 16 MiB, đưa tệp đó vào một thư mục tạm thời riêng tư tồn tại 24 giờ trên Gateway của phiên hoặc máy chủ nút đã ghép nối, rồi trả về đường dẫn tuyệt đối. Bên gọi vẫn phải dán hoặc sử dụng đường dẫn đó theo cách khác; RPC không bao giờ ghi dữ liệu đầu vào vào thiết bị đầu cuối hoặc thực thi lệnh.
    - Các sự kiện `terminal.data` và `terminal.exit` chỉ truyền trực tuyến đến kết nối sở hữu phiên.
    - Các phiên bị mất kết nối sẽ được tách ra chứ không bị kết thúc: chúng vẫn có thể được gắn lại trong `gateway.terminal.detachedSessionTimeoutSeconds` (mặc định 300; `0` khôi phục hành vi kết thúc khi mất kết nối), trong khi đầu ra gần đây tích lũy trong một bộ đệm có giới hạn ở phía máy chủ.
    - `terminal.list` trả về các phiên có thể gắn; `terminal.attach` liên kết lại một phiên đang hoạt động hoặc đã tách với kết nối gọi và trả về bộ đệm phát lại (tiếp quản theo kiểu tmux — chủ sở hữu đang hoạt động trước đó nhận được `terminal.exit` với lý do `detached`); `terminal.text` đọc bộ đệm dưới dạng văn bản thuần túy mà không cần gắn.
    - Mọi phương thức thiết bị đầu cuối đều yêu cầu `operator.admin`; `gateway.terminal.enabled` phải được đặt rõ ràng thành true. Các tác tử được sandbox hoàn toàn sẽ bị từ chối, và thay đổi chính sách tác tử sẽ đóng các PTY hiện có và đang xử lý, kể cả các PTY đã tách.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.catalog` trả về danh mục nhà cung cấp Talk chỉ đọc cho giọng nói, phiên âm trực tuyến và thoại thời gian thực: id nhà cung cấp chuẩn, bí danh registry, nhãn, trạng thái đã cấu hình, kết quả `ready` tùy chọn ở cấp nhóm, id mô hình/giọng nói được cung cấp, chế độ chuẩn, phương thức truyền tải, chiến lược bộ não và các cờ âm thanh/khả năng thời gian thực, mà không trả về bí mật của nhà cung cấp hoặc thay đổi cấu hình toàn cục. Các Gateway hiện tại đặt `ready` sau khi áp dụng lựa chọn nhà cung cấp lúc chạy; trên các Gateway cũ hơn, hãy xem việc thiếu trường này là chưa được xác minh.
    - `talk.config` trả về payload cấu hình Talk có hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.session.create` tạo một phiên Talk do Gateway sở hữu cho `realtime/gateway-relay`, `transcription/gateway-relay` hoặc `stt-tts/managed-room`. Đối với `stt-tts/managed-room`, bên gọi `operator.write` truyền `sessionKey` cũng phải truyền `spawnedBy` để giới hạn phạm vi hiển thị khóa phiên; việc tạo `sessionKey` không giới hạn phạm vi và `brain: "direct-tools"` yêu cầu `operator.admin`.
    - `talk.session.join` xác thực token phiên của phòng được quản lý, phát `session.ready` hoặc `session.replaced` khi cần, rồi trả về siêu dữ liệu phòng/phiên cùng các sự kiện Talk gần đây, tuyệt đối không trả về token dạng văn bản thuần túy hoặc hàm băm của token.
    - `talk.session.appendAudio` nối thêm âm thanh đầu vào PCM dạng base64 vào các phiên chuyển tiếp thời gian thực và phiên âm do Gateway sở hữu.
    - `talk.session.startTurn`, `talk.session.endTurn` và `talk.session.cancelTurn` điều khiển vòng đời lượt của phòng được quản lý, với việc từ chối lượt cũ trước khi xóa trạng thái.
    - `talk.session.cancelOutput` dừng đầu ra âm thanh của trợ lý, chủ yếu để hỗ trợ ngắt lời được kiểm soát bằng VAD trong các phiên chuyển tiếp của Gateway.
    - `talk.session.submitToolResult` hoàn tất một lệnh gọi công cụ của nhà cung cấp do phiên chuyển tiếp thời gian thực thuộc sở hữu của Gateway phát ra. Yêu cầu sẽ chờ mọi tín hiệu hoàn tất bất đồng bộ mà cầu nối nhà cung cấp cung cấp; các lần gửi thất bại giữ lượt chạy được liên kết ở trạng thái hoạt động và không phát sự kiện kết quả công cụ thành công. Truyền `options: { willContinue: true }` cho đầu ra công cụ tạm thời hoặc `options: { suppressResponse: true }` khi cầu nối nhà cung cấp công bố hỗ trợ bỏ qua và kết quả không nên bắt đầu một phản hồi khác.
    - `talk.session.steer` gửi điều khiển bằng giọng nói cho lượt chạy đang hoạt động vào một phiên Talk dựa trên tác tử do Gateway sở hữu: `{ sessionId, text, mode? }`, trong đó `mode` là `status`, `steer`, `cancel` hoặc `followup`; nếu bỏ qua chế độ, chế độ sẽ được phân loại từ văn bản nói.
    - `talk.session.close` đóng một phiên chuyển tiếp, phiên âm hoặc phòng được quản lý do Gateway sở hữu và phát các sự kiện Talk kết thúc.
    - `talk.mode` đặt/phát rộng trạng thái chế độ Talk hiện tại cho các máy khách WebChat/Control UI.
    - `talk.client.create` tạo một phiên nhà cung cấp thời gian thực do máy khách sở hữu bằng `webrtc` hoặc `provider-websocket`, trong khi Gateway sở hữu cấu hình, thông tin xác thực, chỉ dẫn và chính sách công cụ.
    - `talk.client.toolCall` cho phép các phương thức truyền tải thời gian thực do máy khách sở hữu chuyển tiếp lệnh gọi công cụ của nhà cung cấp đến chính sách Gateway. Công cụ đầu tiên được hỗ trợ là `openclaw_agent_consult`; máy khách nhận id lượt chạy và chờ các sự kiện vòng đời trò chuyện thông thường trước khi gửi kết quả công cụ dành riêng cho nhà cung cấp.
    - `talk.client.steer` gửi điều khiển bằng giọng nói cho lượt chạy đang hoạt động đối với các phương thức truyền tải thời gian thực do máy khách sở hữu. Gateway phân giải lượt chạy nhúng đang hoạt động từ `sessionKey` và trả về kết quả chấp nhận/từ chối có cấu trúc thay vì âm thầm bỏ qua chỉ dẫn điều hướng.
    - `talk.event` là kênh sự kiện Talk duy nhất cho các bộ chuyển đổi thời gian thực, phiên âm, STT/TTS, phòng được quản lý, điện thoại và cuộc họp.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, các nhà cung cấp dự phòng và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về danh sách nhà cung cấp TTS có thể hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` thực hiện một lần chuyển đổi văn bản thành giọng nói.
    - `tts.speak` (`operator.write`) kết xuất `text` không trống bằng chuỗi nhà cung cấp TTS chung đã cấu hình và trả về toàn bộ một đoạn âm thanh trực tiếp dưới dạng `audioBase64`, cùng với `provider` và siêu dữ liệu `outputFormat`, `mimeType` và `fileExtension` tùy chọn. Không giống `tts.convert`, phương thức này không trả về đường dẫn cục bộ của Gateway; không giống `talk.speak`, phương thức này không yêu cầu nhà cung cấp Talk. Văn bản vượt quá `messages.tts.maxTextLength` trả về `INVALID_REQUEST`; lỗi tổng hợp trả về `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRef đang hoạt động và chỉ thay thế trạng thái bí mật lúc chạy khi toàn bộ quá trình thành công.
    - `secrets.resolve` phân giải các phép gán bí mật cho đích lệnh đối với một tập hợp lệnh/đích cụ thể.
    - `config.get` trả về ảnh chụp nhanh cấu hình hiện tại trên đĩa, `hash` của tệp gốc dạng thô, `configRevisionHash` đã phân giải và `appliedConfigHash` tùy chọn cho bản sửa đổi đã phân giải được môi trường chạy Gateway đang hoạt động chấp nhận.
    - `config.set` ghi một payload cấu hình đã được xác thực.
    - `config.patch` hợp nhất một bản cập nhật cấu hình từng phần. Việc thay thế mảng mang tính phá hủy yêu cầu đường dẫn bị ảnh hưởng trong `replacePaths`; các mảng lồng nhau bên trong phần tử mảng sử dụng đường dẫn `[]` như `agents.list[].skills`.
    - `config.apply` xác thực và thay thế toàn bộ payload cấu hình.
    - `config.schema` trả về payload schema cấu hình trực tiếp được công cụ Control UI và CLI sử dụng: schema, `uiHints`, phiên bản, siêu dữ liệu tạo sinh, cùng siêu dữ liệu schema của Plugin và kênh khi có thể tải. Payload này bao gồm siêu dữ liệu `title` / `description` từ cùng nhãn/văn bản trợ giúp như UI, bao gồm các nhánh thành phần đối tượng lồng nhau, ký tự đại diện, phần tử mảng và `anyOf` / `oneOf` / `allOf` khi có tài liệu trường tương ứng.
    - `config.schema.lookup` trả về payload tra cứu giới hạn theo đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một nút schema nông, gợi ý khớp cùng `hintPath`, `reloadKind` tùy chọn và bản tóm tắt các phần tử con trực tiếp để UI/CLI truy sâu. `reloadKind` là một trong `restart`, `hot` hoặc `none` (`src/config/schema.ts`) và phản ánh trình lập kế hoạch tải lại cấu hình Gateway cho đường dẫn được yêu cầu. Các nút schema tra cứu giữ lại tài liệu hướng đến người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Bản tóm tắt phần tử con cung cấp `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, `reloadKind` tùy chọn, cùng `hint` / `hintPath` tương ứng.
    - `update.run` chạy quy trình cập nhật Gateway và chỉ lên lịch khởi động lại nếu cập nhật thành công; bên gọi có phiên có thể bao gồm `continuationMessage` để khi khởi động, một lượt tác tử tiếp theo được tiếp tục thông qua hàng đợi tiếp diễn sau khởi động lại. Các bản cập nhật qua trình quản lý gói và bản cập nhật checkout git được giám sát từ mặt phẳng điều khiển sử dụng cơ chế bàn giao dịch vụ được quản lý đã tách, thay vì thay thế cây gói hoặc sửa đổi đầu ra checkout/bản dựng bên trong Gateway đang hoạt động. Một lần bàn giao đã bắt đầu trả về `ok: true` cùng `result.reason: "managed-service-handoff-started"` và `handoff.status: "started"`; các lần bàn giao không khả dụng hoặc thất bại trả về `ok: false` cùng `managed-service-handoff-unavailable` hoặc `managed-service-handoff-failed`, cộng thêm `handoff.command` khi cần cập nhật shell thủ công. Không khả dụng nghĩa là OpenClaw thiếu ranh giới trình giám sát an toàn hoặc danh tính dịch vụ bền vững, chẳng hạn như `OPENCLAW_SYSTEMD_UNIT` đối với systemd. Trong khi một lần bàn giao đã bắt đầu diễn ra, dấu hiệu khởi động lại có thể báo cáo `stats.reason: "restart-health-pending"` trong thời gian ngắn; quá trình tiếp diễn bị trì hoãn cho đến khi CLI xác minh Gateway đã khởi động lại và ghi dấu hiệu `ok` cuối cùng.
    - `update.status` làm mới và trả về dấu hiệu khởi động lại sau cập nhật mới nhất, bao gồm phiên bản đang chạy sau khi khởi động lại nếu có.
    - `wizard.start`, `wizard.next`, `wizard.status` và `wizard.cancel` cung cấp trình hướng dẫn thiết lập ban đầu qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp cho agent và workspace">
    - `agents.list` trả về các mục agent đã cấu hình, bao gồm siêu dữ liệu về mô hình và runtime có hiệu lực.
    - `agents.create`, `agents.update` và `agents.delete` quản lý các bản ghi agent và việc kết nối workspace.
    - `agents.files.list`, `agents.files.get` và `agents.files.set` quản lý các tệp workspace khởi tạo được cung cấp cho một agent.
    - `audit.activity.list` trả về sổ cái hoạt động chỉ chứa siêu dữ liệu và có phiên bản; `audit.list` vẫn là RPC chạy/công cụ an toàn về khả năng tương thích.
    - `agents.workspace.list` và `agents.workspace.get` (`operator.read`) cung cấp khả năng duyệt chỉ đọc, có phân trang đối với thư mục workspace của một agent cho các máy khách thuộc miền người vận hành đáng tin cậy được mô tả trong [Phạm vi người vận hành](/vi/gateway/operator-scopes). Yêu cầu chỉ chấp nhận các đường dẫn tương đối với workspace; hoạt động đọc luôn bị giới hạn trong thư mục gốc workspace đã được phân giải thành đường dẫn thực (từ chối thoát qua liên kết tượng trưng và liên kết cứng), bị giới hạn kích thước và chỉ hỗ trợ văn bản UTF-8 cùng các loại hình ảnh thông dụng (base64). Phản hồi không tiết lộ đường dẫn workspace trên máy chủ. Không có thao tác ghi nào trong namespace này.
    - `tasks.list`, `tasks.get` và `tasks.cancel` cung cấp sổ cái tác vụ của Gateway cho SDK và máy khách người vận hành. Xem [RPC sổ cái tác vụ](#task-ledger-rpcs) bên dưới.
    - `artifacts.list`, `artifacts.get` và `artifacts.download` cung cấp bản tóm tắt và bản tải xuống của các tạo tác được suy ra từ bản chép lời cho phạm vi `sessionKey`, `runId` hoặc `taskId` được chỉ định rõ ràng. Truy vấn lượt chạy và tác vụ phân giải phiên sở hữu ở phía máy chủ và chỉ trả về nội dung đa phương tiện trong bản chép lời có nguồn gốc khớp; các nguồn URL không an toàn hoặc cục bộ trả về bản tải xuống không được hỗ trợ thay vì được tìm nạp ở phía máy chủ.
    - `environments.list` và `environments.status` duy trì khả năng khám phá môi trường cục bộ của Gateway và Node. Các worker đám mây đã cấu hình và bản ghi bền vững do các hồ sơ trước đó để lại bổ sung siêu dữ liệu `worker` với `providerId`, `leaseId` tùy chọn, `state`, `ageMs`, `idleMs` tùy chọn và `attachedSessionIds`. Các trạng thái vòng đời worker là `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` và `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) cấp phát một worker từ hồ sơ nhà cung cấp Plugin đã cấu hình; các lần thử lại với cùng khóa sẽ tái sử dụng thao tác bền vững. `environments.destroy` (`{ environmentId }`) yêu cầu hủy bỏ môi trường worker bền vững theo cách lũy đẳng. Cả hai đều yêu cầu `operator.admin`, là các thao tác ghi trên mặt phẳng điều khiển và trả về cùng cấu trúc tóm tắt môi trường được dùng trong phản hồi trạng thái.
    - `agent.identity.get` trả về danh tính trợ lý có hiệu lực cho một agent hoặc phiên.
    - `agent.wait` chờ một lượt chạy kết thúc và trả về ảnh chụp trạng thái kết thúc khi có.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` cho từng hàng khi backend runtime của agent được cấu hình. Khi tính năng bố trí worker đám mây được bật hoặc tồn tại trạng thái khôi phục bền vững, các hàng phiên cũng bao gồm một trạng thái `placement` đóng (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` hoặc `failed`) cùng các trường môi trường, epoch chủ sở hữu, workspace, gói, con trỏ ACK hoặc khôi phục dành riêng cho từng trạng thái.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký nhận sự kiện thay đổi phiên cho máy khách WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký nhận sự kiện bản chép lời/tin nhắn cho một phiên. Truyền `includeApprovals: true` để đồng thời nhận các sự kiện vòng đời `session.approval` đã được làm sạch cho những phê duyệt có đối tượng được lưu trữ bao gồm chính xác phiên đó và có ràng buộc người xét duyệt cho phép máy khách đăng ký. Khi đó, phản hồi đăng ký bao gồm một `approvalReplay` đang chờ có giới hạn; phản hồi này là nguồn có thẩm quyền khi `truncated` là false. Việc chọn tham gia áp dụng theo từng lệnh đăng ký và không được duy trì: đăng ký lại cùng phiên mà không có `includeApprovals: true` sẽ xóa đăng ký phê duyệt hiện có. Ngoài quyền đọc phiên thông thường, việc chọn tham gia này yêu cầu `operator.admin`, hoặc `operator.approvals` trên thiết bị đã ghép đôi.
    - `sessions.preview` trả về bản xem trước bản chép lời có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho một khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một đích phiên.
    - `sessions.create` tạo một mục phiên mới. Các giá trị `model` và `thinkingLevel` tùy chọn lưu trữ nguyên tử các giá trị ghi đè ban đầu cho mô hình và suy luận. `worktree: true` cấp phát một worktree được quản lý; `worktreeBaseRef`/`worktreeName` tùy chọn chọn tham chiếu cơ sở và tên nhánh, còn `execNode` (`operator.admin`) liên kết hoạt động thực thi của phiên với một máy chủ Node. Worktree được tạo được trả lại trong kết quả và lưu trữ trong hàng phiên (`worktree: { id, branch, repoRoot }`). Khi mục được tạo nhưng `chat.send` ban đầu lồng bên trong bị từ chối, kết quả thành công bao gồm `runStarted: false` và `runError`; máy khách có thể giữ lại prompt và thử lại với khóa phiên được trả về.
    - `sessions.dispatch` (`operator.admin`) di chuyển một phiên OpenClaw cục bộ hiện có với worktree được quản lý thuộc sở hữu của phiên sang một hồ sơ worker đám mây đã cấu hình. Truyền `{ key, profileId, agentId? }`. Phương thức này không tồn tại khi chưa cấu hình hồ sơ worker, đóng khả năng tiếp nhận lượt cục bộ trước khi chờ công việc đang hoạt động hoàn tất và chỉ trả về sau khi việc bố trí đạt quyền sở hữu worker `active`. Việc điều phối chỉ theo một chiều; kéo ngược từ worker về cục bộ không thuộc RPC này.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` và `sessions.groups.delete` quản lý danh mục nhóm phiên tùy chỉnh do Gateway sở hữu (tên + thứ tự hiển thị). Tư cách thành viên vẫn nằm trong trường `category` của từng phiên; thao tác đổi tên và xóa cập nhật các phiên thành viên ở phía máy chủ.
    - `sessions.send` gửi một tin nhắn vào phiên hiện có.
    - `sessions.steer` là biến thể ngắt và điều hướng dành cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động của một phiên. Truyền `key` cùng `runId` tùy chọn, hoặc chỉ `runId` đối với các lượt chạy đang hoạt động mà Gateway có thể phân giải thành một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/giá trị ghi đè của phiên và báo cáo mô hình chuẩn hóa đã phân giải cùng `agentRuntime` có hiệu lực.
    - `sessions.reset`, `sessions.delete` và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu trữ.
    - Hoạt động thực thi trò chuyện vẫn sử dụng `chat.history`, `chat.send`, `chat.abort` và `chat.inject`. `chat.history` được chuẩn hóa để hiển thị cho các máy khách UI: các thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị; các payload XML của lệnh gọi công cụ ở dạng văn bản thuần (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và các khối lệnh gọi công cụ bị cắt ngắn) cùng các token điều khiển mô hình ASCII/toàn chiều rộng bị rò rỉ đều bị loại bỏ; các hàng trợ lý chỉ chứa token im lặng (chính xác là `NO_REPLY` / `no_reply`) bị bỏ qua; và các hàng quá lớn có thể được thay bằng phần giữ chỗ.
    - `chat.message.get` là trình đọc toàn bộ tin nhắn có giới hạn, được bổ sung cho một mục bản chép lời hiển thị duy nhất. Truyền `sessionKey`, `agentId` tùy chọn khi việc chọn phiên nằm trong phạm vi agent, cùng một `messageId` của bản chép lời đã được cung cấp trước đó thông qua `chat.history`; Gateway trả về cùng phép chiếu đã chuẩn hóa để hiển thị mà không áp dụng giới hạn cắt ngắn lịch sử nhẹ khi mục đã lưu trữ vẫn còn và không quá lớn.
    - `chat.toolTitles` trả về các tiêu đề mục đích ngắn cho lệnh gọi công cụ được hiển thị trong Control UI (theo lô, tối đa 24 mục với đầu vào có giới hạn). Tính năng này được chọn tham gia qua `gateway.controlUi.toolTitles` (mặc định tắt); các Gateway đã tắt tính năng sẽ phản hồi `{ titles: {}, disabled: true }` mà không gọi mô hình để máy khách ngừng yêu cầu. Khi được bật, tiêu đề sử dụng định tuyến mô hình tiện ích tiêu chuẩn: một `utilityModel` được cấu hình rõ ràng (một quyết định của người vận hành mà, tương tự mọi tác vụ tiện ích, có thể gửi nội dung tác vụ có giới hạn đến nhà cung cấp được chọn), nếu không thì dùng mô hình nhỏ mặc định do nhà cung cấp của phiên khai báo để không ngầm phát sinh đích dữ liệu đi ra mới; `utilityModel` trống sẽ tắt hoàn toàn các tiêu đề. Tiêu đề không bao giờ dự phòng sang mô hình chính. Kết quả được lưu vào bộ nhớ đệm trong cơ sở dữ liệu trạng thái theo agent với khóa là tên công cụ + đầu vào, vì vậy việc xem lại không bao giờ tính phí lại cho cùng các lệnh gọi.
    - `chat.send` chấp nhận `fastMode: "auto"` áp dụng cho một lượt để sử dụng chế độ nhanh cho các lệnh gọi mô hình bắt đầu trước ngưỡng tự động, rồi bắt đầu các lệnh gọi thử lại, dự phòng, kết quả công cụ hoặc tiếp tục sau đó mà không dùng chế độ nhanh. Ngưỡng mặc định là 60 giây (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) và có thể được cấu hình theo từng mô hình bằng `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Bên gọi `chat.send` có thể truyền `fastAutoOnSeconds` áp dụng cho một lượt để ghi đè ngưỡng cho yêu cầu đó. Truyền `queueMode` (`steer`, `followup`, `collect` hoặc `interrupt`) để chỉ ghi đè chế độ hàng đợi đã lưu trữ cho yêu cầu này; các thao tác điều hướng rõ ràng trong Control UI sử dụng `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Ghép đôi thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép đôi đang chờ và đã được phê duyệt.
    - `device.pair.setupCode` tạo mã thiết lập di động và theo mặc định là một URL dữ liệu QR PNG. Phương thức này yêu cầu `operator.admin` và được chủ ý loại khỏi nội dung khám phá được quảng bá. Kết quả bao gồm `setupCode`, `qrDataUrl` tùy chọn, `gatewayUrl`, nhãn không bí mật `auth` và `urlSource`.
    - `device.pair.approve`, `device.pair.reject` và `device.pair.remove` quản lý các bản ghi ghép đôi thiết bị.
    - `device.pair.rename` gán một nhãn người vận hành (`{ deviceId, label }`) được ưu tiên hơn tên hiển thị do máy khách báo cáo và vẫn được giữ lại sau khi sửa chữa hoặc phê duyệt lại thiết bị.
    - `device.token.rotate` xoay vòng token của thiết bị đã ghép đôi trong giới hạn vai trò đã được phê duyệt và phạm vi của bên gọi.
    - `device.token.revoke` thu hồi token của thiết bị đã ghép đôi trong giới hạn vai trò đã được phê duyệt và phạm vi của bên gọi.

    Mã thiết lập nhúng một thông tin xác thực khởi tạo có thời hạn ngắn. Máy khách không được
    ghi nhật ký hoặc lưu giữ thông tin đó quá thời gian của quy trình ghép đôi.

  </Accordion>

  <Accordion title="Ghép nối Node, gọi và công việc đang chờ">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` và `node.pair.remove` bao quát việc phê duyệt khả năng của node. `node.pair.request` và `node.pair.verify` đã bị loại bỏ trong phiên bản 2026.7 cùng với kho lưu trữ ghép nối node độc lập; các yêu cầu đang chờ được Gateway tạo trong khi node kết nối.
    - `node.list` và `node.describe` trả về trạng thái node đã biết/đang kết nối.
    - `node.rename` cập nhật nhãn của một node đã ghép nối.
    - `node.invoke` chuyển tiếp một lệnh đến node đang kết nối.
    - `node.invoke.result` trả về kết quả của một yêu cầu gọi.
    - `mcp.tools.call.v1` là lệnh máy chủ node không giao diện để gọi một công cụ MCP cục bộ trên node đã cấu hình. Lệnh này được truyền qua `node.invoke`, yêu cầu node khai báo lệnh và vẫn phải tuân theo phê duyệt ghép nối cùng `gateway.nodes.denyCommands`.
    - `node.event` truyền các sự kiện bắt nguồn từ node trở lại gateway.
    - `node.pluginTools.update` là đường dẫn công bố duy nhất để thay thế các bộ mô tả công cụ plugin/MCP hiển thị với agent của node đang kết nối; các tham số `connect` không mang chúng.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi của node đang kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc bền vững đang chờ dành cho các node ngoại tuyến/đã ngắt kết nối.

  </Accordion>

  <Accordion title="Các nhóm phê duyệt">
    - `approval.get` và `approval.resolve` là các phương thức phê duyệt bền vững không phụ thuộc loại (phạm vi `operator.approvals`). `approval.get` trả về một phép chiếu đã làm sạch của trạng thái đang chờ hoặc trạng thái kết thúc được lưu giữ, với `urlPath` ổn định; `approval.resolve` chấp nhận mã phê duyệt chuẩn, một `kind` tường minh và một quyết định, áp dụng cách phân giải câu trả lời đầu tiên thắng và luôn trả về kết quả chuẩn đã ghi nhận.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` và `exec.approval.resolve` bao quát các yêu cầu phê duyệt thực thi một lần cùng việc tra cứu/phát lại phê duyệt đang chờ. Chúng là các bộ chuyển đổi tại ranh giới giao thức trên cùng một sổ đăng ký phê duyệt bền vững.
    - `exec.approval.waitDecision` chờ một phê duyệt thực thi đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý các ảnh chụp nhanh chính sách phê duyệt thực thi của gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt thực thi cục bộ trên node thông qua các lệnh chuyển tiếp của node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` và `plugin.approval.resolve` bao quát các luồng phê duyệt do plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc vào Heartbeat tiếp theo; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - `cron.run` vẫn là một RPC kiểu đưa vào hàng đợi dành cho các lần chạy thủ công. Các máy khách cần ngữ nghĩa hoàn tất nên đọc `runId` được trả về và thăm dò `cron.runs`.
    - `cron.runs` chấp nhận một bộ lọc `runId` không rỗng tùy chọn để máy khách có thể theo dõi một lần chạy thủ công trong hàng đợi mà không bị tranh chấp với các mục lịch sử khác của cùng công việc.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Xem [Các phương thức trợ giúp dành cho người vận hành](#operator-helper-methods) bên dưới.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: các bản cập nhật trò chuyện trên giao diện người dùng như `chat.inject` và các sự kiện trò chuyện khác chỉ dành cho bản ghi hội thoại. Trong giao thức v4, tải trọng delta mang `deltaText`; `message` vẫn là
  ảnh chụp nhanh tích lũy của trợ lý. Các phép thay thế không theo tiền tố đặt
  `replace=true` và sử dụng `deltaText` làm văn bản thay thế.
- `session.message`, `session.operation`, `session.tool`: các bản cập nhật bản ghi hội thoại, thao tác phiên đang diễn ra
  và luồng sự kiện cho một phiên đã đăng ký.
- `session.approval`: thông tin xác thực đã làm sạch về phê duyệt đang chờ và đã kết thúc dành cho một
  bên đăng ký phiên chính xác đã chủ động chọn tham gia. Các phê duyệt con sử dụng
  đối tượng nhận là tổ tiên đã lưu bền vững; sự kiện không bao giờ sửa đổi bản ghi hội thoại hoặc đánh thức agent.
- `sessions.changed`: chỉ mục hoặc siêu dữ liệu phiên đã thay đổi.
- `presence`: các bản cập nhật ảnh chụp nhanh trạng thái hiện diện của hệ thống.
- `tick`: sự kiện duy trì kết nối/khả dụng định kỳ.
- `health`: bản cập nhật ảnh chụp nhanh tình trạng gateway.
- `heartbeat`: bản cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi lần chạy/công việc Cron.
- `shutdown`: thông báo Gateway tắt.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép nối node.
- `node.invoke.request`: phát rộng yêu cầu gọi node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép nối.
- `voicewake.changed`: cấu hình kích hoạt bằng từ đánh thức đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt thực thi.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt plugin.

### Các phương thức trợ giúp của node

Node có thể gọi `skills.bins` để tìm nạp danh sách hiện tại gồm các tệp thực thi của skill
nhằm kiểm tra tự động cho phép.

## RPC sổ cái kiểm toán

`audit.activity.list` cung cấp cho máy khách của người vận hành một chế độ xem ổn định, mới nhất trước tiên về siêu dữ liệu vòng đời
của lần chạy agent, hành động công cụ và tin nhắn đã chọn tham gia. Phương thức này yêu cầu
`operator.read`. Các truy vấn loại trừ bản ghi cũ hơn 30 ngày và sổ cái
SQLite dùng chung bị giới hạn ở 100,000 bản ghi. Các hàng hết hạn bị xóa khi
Gateway khởi động, trong quá trình bảo trì hằng giờ và ở các lần ghi sau đó. Xem
[Lịch sử kiểm toán](/gateway/audit) để biết mô hình dữ liệu và ngữ nghĩa quyền riêng tư.

- Tham số: `agentId`, `sessionKey` hoặc `runId` chính xác tùy chọn; `kind` tùy chọn
  (`"agent_run"`, `"tool_action"` hoặc `"message"`); `status` tùy chọn
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` hoặc `"unknown"`); `direction` tin nhắn tùy chọn (`"inbound"` hoặc
  `"outbound"`) và `channel` chính xác; các giới hạn mili giây Unix `after` / `before` bao gồm điểm biên tùy chọn; `limit` tùy chọn từ `1` đến `500`; và chuỗi
  `cursor` tùy chọn từ trang trước.
- Kết quả: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Hợp kết quả V1 có tên gồm các lược đồ riêng biệt cho lần chạy agent, hành động công cụ, tin nhắn đến
và tin nhắn đi. Bộ phân biệt `eventType` tương ứng là
`agent_run`, `tool_action`, `inbound_message` hoặc `outbound_message`; `kind` và
`direction` của tin nhắn vẫn khả dụng để lọc và hiển thị. Mọi sự kiện đều có
`schemaVersion: 1` dạng số nguyên. Tham chiếu danh tính tin nhắn sử dụng chính xác định dạng
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; mã tác nhân là người gửi trên kênh
sử dụng cùng định dạng.

Tất cả các biến thể đều yêu cầu `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` và
`redaction`. Các trường của biến thể gồm:

| `eventType`        | Các trường bắt buộc                                                   | Các trường tùy chọn                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, tham chiếu danh tính, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, tham chiếu danh tính, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Các enum tin nhắn đóng gồm:

- `conversationKind`: `direct`, `group`, `channel` hoặc `unknown`.
- `outcome` đến: `completed`, `skipped` hoặc `failed`; `reasonCode` tùy chọn:
  `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` hoặc `acp_dispatch_aborted`.
- `outcome` đi: `sent`, `suppressed`, `failed` hoặc `unknown`; `reasonCode` tùy chọn:
  `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  hoặc `no_visible_payload`. Một bộ chuyển đổi không trả về danh tính nền tảng là
  `unknown`, vì không thể chứng minh rằng tác dụng phụ bên ngoài không xảy ra.
- `deliveryKind`: `text`, `media` hoặc `other`; `failureStage`:
  `platform_send`, `queue` hoặc `unknown`.

Các trường kết thúc có tương quan với nhau, không phải tùy chọn độc lập:

| Biến thể          | Ánh xạ kết thúc                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lần chạy agent        | `started` không có `errorCode`; mỗi trạng thái hoàn tất không thành công yêu cầu mã `run_*` tương ứng.                                                                 |
| Hành động công cụ      | `started` và trạng thái thành công không có `errorCode`; mỗi trạng thái hoàn tất khác yêu cầu mã `tool_*` tương ứng.                                                       |
| Tin nhắn đến  | thành công = `completed`; bị chặn = `skipped`; thất bại = `failed` cộng `message_processing_failed`. Khi có, `reasonCode` phải thuộc nhóm trạng thái kết thúc đó. |
| Tin nhắn đi | thành công = `sent`; bị chặn = `suppressed` cộng `reasonCode`; thất bại = `failed` cộng `errorCode` và `failureStage`; không xác định = `unknown` cộng `failureStage`.      |

Mỗi sự kiện hoạt động bao gồm một mã định danh sự kiện ổn định, số thứ tự sổ cái đơn điệu,
số thứ tự sự kiện nguồn, dấu thời gian, tác nhân, hành động, trạng thái, số nguyên
`schemaVersion: 1` và `redaction: "metadata_only"`. Các bản ghi lượt chạy và công cụ
yêu cầu thông tin nguồn gốc của tác nhân và lượt chạy, đồng thời có thể bao gồm thông tin nguồn gốc phiên. Các bản ghi
tin nhắn có thể bao gồm mã định danh tác nhân và lượt chạy, nhưng chủ ý không bao giờ bao gồm
`sessionKey` hoặc `sessionId`; do đó, bộ lọc truy vấn `sessionKey` chỉ áp dụng cho
các hàng lượt chạy và công cụ. Sự kiện công cụ có thể bao gồm mã định danh lệnh gọi công cụ và tên công cụ.

Các bản ghi tin nhắn sử dụng `message.inbound.processed` hoặc
`message.outbound.finished` và bổ sung hướng, kênh, loại cuộc hội thoại,
kết quả đã chuẩn hóa, cùng loại phân phối, giai đoạn lỗi, thời lượng,
số lượng kết quả, mã lý do và các bí danh tài khoản/cuộc hội thoại/tin nhắn/đích
được tạo bằng khóa cục bộ theo bản cài đặt nếu có. Các bí danh này hỗ trợ
việc tương quan nhưng không phải là ẩn danh hóa: cơ sở dữ liệu trạng thái chứa khóa của chúng,
còn các bản xuất RPC và CLI thì không. Sổ cái không lưu lời nhắc, nội dung
tin nhắn, đối số công cụ, kết quả công cụ, đầu ra lệnh hoặc văn bản lỗi thô.
Các giá trị `sessionKey` của lượt chạy/công cụ vẫn là siêu dữ liệu tương quan thô và có thể nhúng
mã định danh tài khoản nền tảng hoặc đối tác; các bản ghi tin nhắn bỏ qua khóa phiên.

Đối với các hàng gửi đến, `durationMs` đo quá trình điều phối lõi cho đến trạng thái kết thúc và
`resultCount` đếm các tải trọng công cụ, khối và phản hồi trong hàng đợi đã được hoàn tất. Đối với
các hàng gửi đi, `durationMs` bao quát quyền sở hữu phân phối cho đến khi xác nhận,
chuyển vào thư chết hoặc đối soát (bao gồm thời gian chờ trong hàng đợi), và `resultCount`
đếm các lần gửi vật lý đã xác định trên nền tảng. `deliveryKind`, khi có,
mô tả tải trọng hiệu lực sau các hook và quá trình kết xuất; các hàng bị chặn hoặc
có trạng thái không rõ ràng do sự cố sẽ bỏ qua trường này.

Phạm vi tin nhắn hiện tại bao gồm các tin nhắn gửi đến được chấp nhận và đến được quá trình
điều phối lõi, bao gồm các kết quả trùng lặp/kết thúc của lõi. Phạm vi gửi đi ghi
một hàng kết thúc cho mỗi tải trọng phản hồi logic ban đầu đến được cơ chế phân phối bền vững
dùng chung; việc chia đoạn và phân tán qua bộ điều hợp được tổng hợp trong `resultCount`. Các lần gửi
có thể thử lại hoặc không rõ ràng trong hàng đợi chỉ được ghi sau khi xác nhận, chuyển vào
thư chết hoặc đối soát. Các đường dẫn cục bộ của Plugin và đường dẫn gửi trực tiếp bỏ qua
các ranh giới dùng chung này hiện chưa được bao phủ. Hàng đợi worker có giới hạn hoạt động theo
cơ chế nỗ lực tối đa và có thể làm mất bản ghi khi xảy ra lỗi hoặc bão hòa, vì vậy bề mặt này
không phải là kho lưu trữ tuân thủ không mất dữ liệu.

Tính năng ghi được bật theo mặc định và do
[`audit.enabled`](/vi/gateway/configuration-reference#audit) kiểm soát. Việc ghi tin nhắn được
kiểm soát riêng bởi `audit.messages` và mặc định là `"off"`. Khi
tính năng ghi bị tắt, `audit.activity.list` vẫn tiếp tục cung cấp các bản ghi đã được ghi
trước đó cho đến khi chúng hết hạn.

Các lược đồ yêu cầu, kết quả và `AuditEvent` của `audit.list` đã phát hành vẫn
không thay đổi và chỉ trả về các bản ghi lượt chạy của tác nhân và hành động công cụ. Các máy khách
vận hành mới nên gọi `audit.activity.list` khi Gateway quảng bá phương thức này. Các
Gateway cũ hơn có thể báo cáo `unknown method: audit.activity.list` hoặc, do
việc ủy quyền diễn ra trước bước tra cứu phương thức trong các phiên bản đã phát hành, `missing scope:
operator.admin` cho một yêu cầu có phạm vi đọc. Chỉ coi trường hợp sau là phương thức
không tồn tại khi phương thức đó không được quảng bá. Khi đó, máy khách chỉ có thể thử lại `audit.list`
nếu các bộ lọc của nó không yêu cầu hỗ trợ loại tin nhắn, hướng hoặc kênh.

Sử dụng [`openclaw audit`](/vi/cli/audit) cho các truy vấn văn bản và bản xuất JSON có giới hạn.

## RPC sổ cái tác vụ

Các máy khách vận hành kiểm tra và hủy các bản ghi tác vụ nền của Gateway thông qua
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
  - Mã định danh tác vụ không tồn tại trả về dạng lỗi không tìm thấy của Gateway.
- `tasks.cancel` yêu cầu `operator.write`.
  - Tham số: `{ "taskId": string, "reason"?: string }`.
  - Kết quả: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` cho biết sổ cái có tác vụ khớp hay không. `cancelled`
    cho biết môi trường thời gian chạy đã chấp nhận hoặc ghi nhận việc hủy hay chưa.

`TaskSummary` bao gồm `id`, `status` và siêu dữ liệu tùy chọn: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, dấu thời gian, tiến độ,
bản tóm tắt kết thúc và văn bản lỗi đã được làm sạch. `agentId` xác định tác nhân
thực thi tác vụ; `sessionKey` và `ownerKey` giữ lại ngữ cảnh của bên yêu cầu và ngữ cảnh
điều khiển.

## Các phương thức hỗ trợ vận hành

- `commands.list` (`operator.read`) truy xuất danh mục lệnh thời gian chạy cho
  một tác nhân.
  - `agentId` là tùy chọn; bỏ qua trường này để đọc không gian làm việc mặc định của tác nhân.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm đến: `text` trả về
    token lệnh văn bản chính không có `/` ở đầu; `native` và đường dẫn
    `both` mặc định trả về tên gốc nhận biết nhà cung cấp khi có.
  - `textAliases` chứa các bí danh dấu gạch chéo chính xác như `/model` và `/m`.
  - `nativeName` chứa tên lệnh gốc nhận biết nhà cung cấp khi
    tồn tại.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên gốc cùng tính khả dụng của lệnh
    Plugin gốc.
  - `includeArgs=false` loại bỏ siêu dữ liệu đối số đã tuần tự hóa khỏi phản hồi.
- `tools.catalog` (`operator.read`) truy xuất danh mục công cụ thời gian chạy cho một
  tác nhân. Phản hồi bao gồm các công cụ được nhóm và siêu dữ liệu nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu Plugin khi `source="plugin"`
  - `optional`: công cụ Plugin có phải là tùy chọn hay không
- `tools.effective` (`operator.read`) truy xuất danh mục công cụ có hiệu lực trong thời gian chạy
  cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh thời gian chạy đáng tin cậy từ phiên ở phía máy chủ
    thay vì chấp nhận ngữ cảnh xác thực hoặc phân phối do bên gọi cung cấp.
  - Phản hồi là một phép chiếu bắt nguồn từ máy chủ và có phạm vi phiên của danh mục
    đang hoạt động, bao gồm các công cụ lõi, Plugin, kênh và máy chủ MCP đã được
    phát hiện.
  - `tools.effective` chỉ đọc đối với MCP: nó có thể chiếu danh mục MCP của phiên
    đang hoạt động qua chính sách công cụ cuối cùng, nhưng không tạo môi trường thời gian chạy MCP,
    kết nối phương tiện truyền tải hoặc phát hành `tools/list`. Nếu không có danh mục đang hoạt động
    phù hợp, phản hồi có thể bao gồm thông báo như `mcp-not-yet-connected`,
    `mcp-not-yet-listed` hoặc `mcp-stale-catalog`.
  - Các mục công cụ có hiệu lực sử dụng `source="core"`, `source="plugin"`,
    `source="channel"` hoặc `source="mcp"`.
- `tools.invoke` (`operator.write`) gọi một công cụ khả dụng thông qua cùng
  đường dẫn chính sách Gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm` và
    `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều có mặt, tác nhân phiên đã phân giải
    phải khớp với `agentId`.
  - Các trình bao bọc lõi chỉ dành cho chủ sở hữu như `cron`, `gateway` và `nodes` yêu cầu
    danh tính chủ sở hữu/quản trị viên (`operator.admin`) mặc dù bản thân `tools.invoke`
    là `operator.write`.
  - Phản hồi là một phong bì dành cho SDK với `ok`, `toolName`, `output`
    tùy chọn và các trường `error` có kiểu. Việc phê duyệt hoặc từ chối theo chính sách trả về
    `ok:false` trong tải trọng thay vì bỏ qua quy trình chính sách công cụ
    của Gateway.
- `skills.status` (`operator.read`) truy xuất danh mục kỹ năng hiển thị cho một
  tác nhân.
  - `agentId` là tùy chọn; bỏ qua trường này để đọc không gian làm việc mặc định của tác nhân.
  - Phản hồi bao gồm tính đủ điều kiện, các yêu cầu còn thiếu, kiểm tra cấu hình
    và các tùy chọn cài đặt đã được làm sạch mà không làm lộ giá trị bí mật thô.
- `skills.search` và `skills.detail` (`operator.read`) trả về siêu dữ liệu
  khám phá ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` và `skills.upload.commit`
  (`operator.admin`) chuẩn bị một kho lưu trữ kỹ năng riêng tư trước khi cài đặt. Đây
  là một đường dẫn tải lên quản trị riêng biệt dành cho máy khách đáng tin cậy, không phải luồng
  cài đặt kỹ năng ClawHub thông thường, và bị tắt theo mặc định trừ khi
  `skills.install.allowUploadedArchives` được bật.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tạo một lượt tải lên gắn với slug và giá trị bắt buộc ghi đè đó.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` nối thêm byte tại
    độ lệch đã giải mã chính xác.
  - `skills.upload.commit({ uploadId, sha256? })` xác minh kích thước cuối cùng và
    SHA-256. Việc commit chỉ hoàn tất lượt tải lên; nó không cài đặt kỹ năng.
  - Các kho lưu trữ kỹ năng được tải lên là kho lưu trữ zip chứa gốc `SKILL.md`. Tên
    thư mục nội bộ của kho lưu trữ không bao giờ chọn đích cài đặt.
- `skills.install` (`operator.admin`) có ba chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một
    thư mục kỹ năng vào thư mục `skills/` trong không gian làm việc mặc định của tác nhân.
  - Chế độ tải lên: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    cài đặt một lượt tải lên đã commit vào thư mục `skills/<slug>`
    trong không gian làm việc mặc định của tác nhân. Slug và giá trị bắt buộc ghi đè phải khớp với
    yêu cầu `skills.upload.begin` ban đầu. Yêu cầu sẽ bị từ chối trừ khi
    `skills.install.allowUploadedArchives` được bật; thiết lập này không
    ảnh hưởng đến các lượt cài đặt ClawHub.
  - Chế độ trình cài đặt Gateway: `{ name, installId, timeoutMs? }` chạy một hành động
    `metadata.openclaw.install` đã khai báo trên máy chủ Gateway. Các máy khách cũ hơn vẫn có thể
    gửi `dangerouslyForceUnsafeInstall`; trường này đã lỗi thời,
    chỉ được chấp nhận để tương thích giao thức và bị bỏ qua. Sử dụng
    `security.installPolicy` cho các quyết định cài đặt thuộc quyền sở hữu của bên vận hành.
- `skills.update` (`operator.admin`) có hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả các bản cài đặt ClawHub được theo dõi trong
    không gian làm việc mặc định của tác nhân.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`,
    `apiKey` và `env`.

### Các chế độ xem `models.list`

`models.list` chấp nhận tham số `view` tùy chọn
(`src/agents/model-catalog-visibility.ts`):

- Bị bỏ qua hoặc `"default"`: nếu `agents.defaults.models` được cấu hình, phản hồi
  là danh mục được cho phép, bao gồm các mô hình được phát hiện động
  cho các mục `provider/*`. Nếu không, phản hồi là toàn bộ danh mục
  của Gateway.
- `"configured"`: hành vi phù hợp với bộ chọn. Nếu `agents.defaults.models` được
  cấu hình, nó vẫn được ưu tiên, bao gồm cả việc phát hiện trong phạm vi nhà cung cấp cho
  các mục `provider/*`. Khi không có danh sách cho phép, phản hồi sử dụng các mục
  `models.providers.<provider>.models` rõ ràng, chỉ chuyển sang toàn bộ
  danh mục khi không có hàng mô hình nào được cấu hình.
- `"provider-config"`: kho `models.providers.*.models` do nguồn xác định,
  độc lập với danh sách cho phép của bộ chọn. Các hàng bao gồm những khả năng công khai của mô hình và
  tính khả dụng có xét đến tuyến, nhưng bỏ qua các điểm cuối của nhà cung cấp, thông tin xác thực và
  cấu hình yêu cầu khi chạy.
- `"all"`: toàn bộ danh mục của Gateway, bỏ qua `agents.defaults.models`. Dùng cho
  giao diện chẩn đoán/phát hiện, không dùng cho bộ chọn mô hình thông thường.

## Phê duyệt thực thi

- Khi một yêu cầu thực thi cần được phê duyệt, Gateway phát quảng bá
  `exec.approval.requested`.
- Máy khách của người vận hành xử lý bằng cách gọi `exec.approval.resolve` (yêu cầu
  `operator.approvals`).
- Đối với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan`
  (siêu dữ liệu phiên/`argv`/`cwd`/`rawCommand` chuẩn). Các yêu cầu thiếu
  `systemRunPlan` sẽ bị từ chối.
- Sau khi được phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ tái sử dụng
  `systemRunPlan` chuẩn đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi sửa đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc
  `sessionKey` trong khoảng từ lúc chuẩn bị đến lần chuyển tiếp `system.run` cuối cùng đã được phê duyệt,
  Gateway sẽ từ chối lần chạy thay vì tin tưởng tải trọng đã bị sửa đổi.

## Phương án dự phòng khi phân phối của tác tử

- Các yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối ra ngoài.
- `bestEffortDeliver=false` (mặc định) duy trì hành vi nghiêm ngặt: các đích phân phối
  không thể phân giải hoặc chỉ dùng nội bộ sẽ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép chuyển sang chỉ thực thi trong phiên khi không thể
  phân giải tuyến có thể phân phối ra bên ngoài (ví dụ: các phiên nội bộ/webchat
  hoặc cấu hình đa kênh không rõ ràng).
- Kết quả `agent` cuối cùng có thể bao gồm `result.deliveryStatus` khi đã yêu cầu phân phối,
  sử dụng cùng các trạng thái `sent`, `suppressed`, `partial_failed` và
  `failed` được ghi lại cho
  [`openclaw agent --json --deliver`](/vi/cli/agent#json-delivery-status).

## Quản lý phiên bản

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` và `MIN_PROBE_PROTOCOL_VERSION` nằm trong
  `packages/gateway-protocol/src/version.ts`.
- Máy khách gửi `minProtocol` + `maxProtocol`. Máy khách dành cho người vận hành và giao diện người dùng phải
  bao gồm giao thức hiện tại trong phạm vi đó; máy khách và máy chủ hiện tại chạy
  giao thức v4.
- Máy khách đã xác thực có cả `role: "node"` và `client.mode: "node"`
  có thể sử dụng giao thức Node N-1 (hiện là v3). Các phép thăm dò khởi động lại gọn nhẹ sử dụng
  cùng cửa sổ N-1. Việc xác thực thiết bị, ghép nối, phạm vi, chính sách lệnh và phê duyệt
  thực thi không thay đổi theo cửa sổ tương thích này. Các khả năng và lệnh Node
  do Plugin sở hữu sẽ bị giữ lại cho đến khi Node nâng cấp lên giao thức hiện tại
  vì các bề mặt được lưu trữ của chúng không thuộc hợp đồng N-1.
- Các lược đồ và mô hình được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số máy khách

Phần triển khai máy khách tham chiếu nằm trong `packages/gateway-client/src/`
(OpenClaw bao bọc nó thông qua lớp giao diện mỏng `src/gateway/client.ts`). Các giá trị
mặc định này ổn định trên toàn giao thức v4 và là đường cơ sở dự kiến cho
máy khách bên thứ ba.

| Hằng số                                   | Mặc định                                              | Nguồn                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Thời gian chờ yêu cầu (mỗi RPC)           | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Thời gian chờ tiền xác thực / thử thách kết nối | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (biến môi trường `OPENCLAW_HANDSHAKE_TIMEOUT_MS` có thể tăng ngân sách máy chủ/máy khách đã ghép nối) |
| Thời gian chờ lùi khi kết nối lại ban đầu | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Thời gian chờ lùi tối đa khi kết nối lại  | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Giới hạn thử lại nhanh sau khi đóng do mã thông báo thiết bị | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Khoảng gia hạn buộc dừng trước `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Thời gian chờ mặc định của `stopAndWait()` | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Khoảng nhịp mặc định (trước `hello-ok`) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Đóng do hết thời gian chờ nhịp            | mã `4000` khi thời gian im lặng vượt quá `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Máy chủ công bố các giá trị `policy.tickIntervalMs`,
`policy.maxPayload` và `policy.maxBufferedBytes` có hiệu lực trong `hello-ok`; máy khách
nên tuân theo các giá trị đó thay vì các giá trị mặc định trước bắt tay.

Máy khách tham chiếu cho phép các yêu cầu hữu hạn tự quản lý thời hạn đã cấu hình khi
mọi yêu cầu đang chờ đều có thời hạn. Một yêu cầu `expectFinal` không có
`timeoutMs` hữu hạn, bất kỳ yêu cầu nào có `timeoutMs: null`, hoặc sự kết hợp giữa các yêu cầu
hữu hạn và không giới hạn sẽ giữ bộ giám sát nhịp hoạt động. Nếu các sự kiện đến và
phản hồi tiếp tục im lặng quá ngưỡng hết thời gian chờ nhịp, máy khách sẽ đóng
socket bằng mã `4000`, từ chối mọi yêu cầu đang chờ và kết nối lại. Máy khách
không phát lại các yêu cầu đã bị từ chối sau khi kết nối lại.

## Xác thực

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy thuộc vào
  `gateway.auth.mode` đã cấu hình (`"none" | "token" | "password" | "trusted-proxy"`).
- Các chế độ mang danh tính như Tailscale Serve (`gateway.auth.allowTailscale: true`)
  hoặc `gateway.auth.mode: "trusted-proxy"` không phải loopback đáp ứng bước kiểm tra xác thực kết nối
  từ các tiêu đề yêu cầu thay vì `connect.params.auth.*`.
- `gateway.auth.mode: "none"` qua điểm vào riêng tư bỏ qua hoàn toàn xác thực kết nối
  bằng bí mật dùng chung; không để chế độ đó lộ ra trên điểm vào công khai/không đáng tin cậy.
- Sau khi ghép đôi, Gateway cấp một mã thông báo thiết bị có phạm vi giới hạn theo
  vai trò kết nối + các phạm vi, được trả về trong `hello-ok.auth.deviceToken`. Máy khách nên
  lưu mã này sau bất kỳ lần kết nối thành công nào.
- Khi kết nối lại bằng mã thông báo thiết bị đã lưu đó, cũng nên sử dụng lại tập hợp
  phạm vi đã được phê duyệt và lưu cho mã thông báo đó. Điều này duy trì quyền truy cập đọc/thăm dò/trạng thái
  đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại thành một phạm vi ngầm định
  chỉ dành cho quản trị viên.
- Tạo thông tin xác thực kết nối phía máy khách (`selectConnectAuth` trong
  `packages/gateway-client/src/client.ts`):
  - `auth.password` độc lập và luôn được chuyển tiếp khi đã đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: trước tiên là mã thông báo dùng chung được chỉ định rõ,
    sau đó là `deviceToken` được chỉ định rõ, rồi đến mã thông báo đã lưu theo từng thiết bị (được lập khóa theo
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được
    `auth.token`. Mã thông báo dùng chung hoặc bất kỳ mã thông báo thiết bị nào đã phân giải đều ngăn việc gửi nó.
  - Việc tự động nâng cấp mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được phép đối với các điểm cuối đáng tin cậy: loopback,
    hoặc `wss://` có `tlsFingerprint` được ghim. `wss://` công khai không có ghim
    không đủ điều kiện.
- Quá trình khởi tạo bằng mã thiết lập tích hợp trả về
  `hello-ok.auth.deviceToken` của Node chính cùng một mã thông báo người vận hành bị giới hạn trong
  `hello-ok.auth.deviceTokens` để bàn giao an toàn cho thiết bị di động. Mã thông báo người vận hành
  bao gồm `operator.talk.secrets` để đọc cấu hình Talk gốc, nhưng
  loại trừ các phạm vi sửa đổi ghép đôi và `operator.admin`.
- Trong khi quá trình khởi tạo bằng mã thiết lập không thuộc đường cơ sở chờ phê duyệt,
  chi tiết `PAIRING_REQUIRED` bao gồm `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` và `pauseReconnect: false`. Tiếp tục kết nối lại bằng cùng
  mã thông báo khởi tạo cho đến khi yêu cầu được phê duyệt hoặc mã thông báo trở nên
  không hợp lệ.
- Chỉ lưu `hello-ok.auth.deviceTokens` khi kết nối đã sử dụng xác thực khởi tạo
  qua phương thức truyền tải đáng tin cậy như `wss://` hoặc ghép đôi loopback/cục bộ.
- Nếu máy khách cung cấp rõ `deviceToken` hoặc `scopes`, thì
  tập hợp phạm vi do bên gọi yêu cầu đó vẫn có hiệu lực quyết định; các phạm vi được lưu đệm chỉ
  được sử dụng lại khi máy khách sử dụng lại mã thông báo đã lưu theo từng thiết bị.
- Có thể xoay vòng/thu hồi mã thông báo thiết bị qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu `operator.pairing`). Việc xoay vòng hoặc thu hồi
  mã thông báo của Node hoặc vai trò không phải người vận hành khác cũng yêu cầu `operator.admin`.
- `device.token.rotate` trả về siêu dữ liệu xoay vòng. Nó chỉ trả lại mã thông báo
  mang quyền thay thế cho các lệnh gọi từ cùng thiết bị đã được xác thực bằng chính
  mã thông báo thiết bị đó, để các máy khách chỉ dùng mã thông báo có thể lưu mã thay thế trước khi
  kết nối lại. Các lần xoay vòng dùng thông tin dùng chung/quản trị viên không trả lại mã thông báo mang quyền.
- Việc cấp, xoay vòng và thu hồi mã thông báo luôn bị giới hạn trong tập hợp vai trò đã được phê duyệt
  ghi trong mục ghép đôi của thiết bị đó; thao tác sửa đổi mã thông báo không thể mở rộng hoặc
  nhắm đến một vai trò thiết bị mà phê duyệt ghép đôi chưa từng cấp.
- Đối với các phiên mã thông báo thiết bị đã ghép đôi, việc quản lý thiết bị chỉ giới hạn trong phạm vi bản thân trừ khi
  bên gọi cũng có `operator.admin`: bên gọi không phải quản trị viên chỉ có thể quản lý
  mã thông báo người vận hành cho mục thiết bị của chính mình. Việc quản lý mã thông báo của Node
  và các vai trò không phải người vận hành khác chỉ dành cho quản trị viên, kể cả đối với thiết bị của chính bên gọi.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập hợp phạm vi
  của mã thông báo người vận hành đích so với các phạm vi phiên hiện tại của bên gọi.
  Bên gọi không phải quản trị viên không thể xoay vòng hoặc thu hồi một mã thông báo người vận hành có phạm vi rộng hơn
  phạm vi họ đang có.
- Lỗi xác thực bao gồm `error.details.code` cùng các gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep`: một trong `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Hành vi máy khách đối với `AUTH_TOKEN_MISMATCH`:
  - Máy khách đáng tin cậy có thể thử lại một lần có giới hạn bằng mã thông báo được lưu đệm
    theo từng thiết bị.
  - Nếu lần thử lại đó thất bại, hãy dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn
    về hành động mà người vận hành cần thực hiện.
- `AUTH_SCOPE_MISMATCH` có nghĩa là mã thông báo thiết bị đã được nhận diện nhưng không
  bao phủ vai trò/các phạm vi được yêu cầu. Không trình bày đây là mã thông báo không hợp lệ; hãy nhắc
  người vận hành ghép đôi lại hoặc phê duyệt hợp đồng phạm vi hẹp hơn/rộng hơn.

## Danh tính thiết bị và ghép đôi

- Các Node nên bao gồm một danh tính thiết bị ổn định (`device.id`) được dẫn xuất từ
  dấu vân tay của cặp khóa.
- Gateway cấp mã thông báo theo từng thiết bị + vai trò.
- Cần phê duyệt ghép đôi cho các ID thiết bị mới, trừ khi đã bật
  tự động phê duyệt cục bộ.
- Tự động phê duyệt ghép đôi tập trung vào các kết nối loopback cục bộ trực tiếp.
- OpenClaw cũng có một đường tự kết nối hẹp, cục bộ trong phần phụ trợ/vùng chứa dành cho
  các luồng trình trợ giúp dùng bí mật chung đáng tin cậy.
- Các kết nối tailnet hoặc LAN trên cùng máy chủ vẫn được xem là từ xa khi ghép đôi
  và yêu cầu phê duyệt.
- Máy khách WS thường bao gồm danh tính `device` trong `connect` (người vận hành +
  Node). Các ngoại lệ duy nhất cho người vận hành không có thiết bị là những đường tin cậy được chỉ định rõ:
  - `gateway.controlUi.allowInsecureAuth=true` dành cho khả năng tương thích HTTP không an toàn
    chỉ trên localhost.
  - xác thực Control UI của người vận hành qua `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (phương án khẩn cấp, hạ cấp
    bảo mật nghiêm trọng).
  - Các RPC phần phụ trợ `gateway-client` qua loopback trực tiếp trên đường dẫn trình trợ giúp
    nội bộ dành riêng.
- Việc bỏ qua danh tính thiết bị dẫn đến hệ quả về phạm vi. Khi một kết nối
  người vận hành không có thiết bị được cho phép qua một đường tin cậy được chỉ định rõ, OpenClaw
  vẫn xóa các phạm vi tự khai báo thành một tập hợp trống, trừ khi đường đó có
  một ngoại lệ duy trì phạm vi được đặt tên. Khi đó, các phương thức bị giới hạn theo phạm vi sẽ thất bại với
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` là một đường duy trì phạm vi
  khẩn cấp của Control UI. Nó không cấp phạm vi cho các máy khách WebSocket phần phụ trợ tùy chỉnh
  hoặc có dạng CLI tùy ý.
- Đường trình trợ giúp phần phụ trợ `gateway-client` qua loopback trực tiếp dành riêng chỉ duy trì
  phạm vi cho các RPC mặt phẳng điều khiển cục bộ nội bộ; các ID phần phụ trợ tùy chỉnh không
  nhận được ngoại lệ này.
- Tất cả kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di chuyển xác thực thiết bị

Đối với các máy khách cũ vẫn sử dụng hành vi ký trước cơ chế thử thách, `connect`
trả về các mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` cùng một
`error.details.reason` ổn định.

Các lỗi di chuyển thường gặp:

| Thông báo                   | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Máy khách đã bỏ qua `device.nonce` (hoặc gửi giá trị trống). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Máy khách đã ký bằng nonce cũ/không đúng.          |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Tải trọng chữ ký không khớp với tải trọng v2.      |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.     |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp với dấu vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.        |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký tải trọng v2 có chứa nonce của máy chủ.
- Gửi cùng nonce đó trong `connect.params.device.nonce`.
- Tải trọng chữ ký ưu tiên là `v3`
  (`buildDeviceAuthPayloadV3` trong `packages/gateway-client/src/device-auth.ts`),
  liên kết `platform` và `deviceFamily` ngoài
  các trường thiết bị/máy khách/vai trò/phạm vi/mã thông báo/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để đảm bảo khả năng tương thích, nhưng việc ghim
  siêu dữ liệu thiết bị đã ghép đôi vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS và ghim

- TLS được hỗ trợ cho các kết nối WS (cấu hình `gateway.tls`).
- Máy khách có thể tùy chọn ghim dấu vân tay chứng chỉ của Gateway qua
  `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`.

## Phạm vi

Giao thức này cung cấp toàn bộ API của Gateway: trạng thái, kênh, mô hình, trò chuyện,
tác tử, phiên, Node, phê duyệt và nhiều nội dung khác. Bề mặt chính xác được xác định bởi
các lược đồ TypeBox được tái xuất từ `packages/gateway-protocol/src/schema.ts`.

## Liên quan

- [Giao thức cầu nối](/vi/gateway/bridge-protocol)
- [Sổ tay vận hành Gateway](/vi/gateway)
