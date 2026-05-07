---
read_when:
    - Triển khai hoặc cập nhật máy khách WS cho Gateway
    - Gỡ lỗi sự không khớp giao thức hoặc lỗi kết nối
    - Tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-05-07T13:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol là **mặt phẳng điều khiển duy nhất + truyền tải Node** cho
OpenClaw. Mọi client (CLI, web UI, ứng dụng macOS, Node iOS/Android, Node
headless) kết nối qua WebSocket và khai báo **role** + **scope** của mình tại
thời điểm bắt tay.

## Truyền tải

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **phải** là yêu cầu `connect`.
- Các khung trước kết nối bị giới hạn ở 64 KiB. Sau khi bắt tay thành công, client
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các khung đến quá lớn và bộ đệm gửi đi chậm sẽ phát sự kiện `payload.large`
  trước khi Gateway đóng hoặc loại bỏ khung bị ảnh hưởng. Các sự kiện này giữ
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ phần thân
  thông điệp, nội dung tệp đính kèm, phần thân khung thô, token, cookie hoặc giá trị bí mật.

## Bắt tay (connect)

Gateway → Client (thử thách trước kết nối):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

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

Gateway → Client:

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

Trong khi Gateway vẫn đang hoàn tất các sidecar khởi động, yêu cầu `connect` có thể
trả về lỗi `UNAVAILABLE` có thể thử lại với `details.reason` được đặt thành
`"startup-sidecars"` và `retryAfterMs`. Client nên thử lại phản hồi đó
trong ngân sách kết nối tổng thể thay vì hiển thị nó như một lỗi bắt tay
cuối cùng.

`server`, `features`, `snapshot` và `policy` đều được schema yêu cầu
(`src/gateway/protocol/schema/frames.ts`). `auth` cũng bắt buộc và báo cáo
role/scope đã thương lượng. `pluginSurfaceUrls` là tùy chọn và ánh xạ tên bề mặt
Plugin, chẳng hạn như `canvas`, tới các URL được lưu trữ có phạm vi.

URL bề mặt Plugin có phạm vi có thể hết hạn. Node có thể gọi
`node.pluginSurface.refresh` với `{ "surface": "canvas" }` để nhận một mục mới
trong `pluginSurfaceUrls`. Bản tái cấu trúc Plugin Canvas thử nghiệm không
hỗ trợ đường dẫn tương thích `canvasHostUrl`, `canvasCapability` hoặc
`node.canvas.capability.refresh` đã ngừng dùng; các client native và
Gateway hiện tại phải dùng bề mặt Plugin.

Khi không cấp token thiết bị, `hello-ok.auth` báo cáo các quyền đã thương lượng
mà không có trường token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Các client backend cùng tiến trình đáng tin cậy (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên các kết nối loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu Gateway dùng chung. Đường dẫn này được dành riêng
cho các RPC mặt phẳng điều khiển nội bộ và ngăn các baseline ghép đôi CLI/thiết bị cũ
chặn công việc backend cục bộ như cập nhật phiên subagent. Client từ xa,
client có nguồn gốc trình duyệt, client Node và client token thiết bị/danh tính thiết bị
rõ ràng vẫn dùng các kiểm tra ghép đôi và nâng cấp scope thông thường.

Khi token thiết bị được cấp, `hello-ok` cũng bao gồm:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Trong quá trình bàn giao bootstrap đáng tin cậy, `hello-ok.auth` cũng có thể bao gồm
các mục role bổ sung có giới hạn trong `deviceTokens`:

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

Đối với luồng bootstrap Node/operator tích hợp sẵn, token Node chính vẫn là
`scopes: []` và mọi token operator được bàn giao vẫn bị giới hạn trong allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kiểm tra scope bootstrap vẫn
được đặt tiền tố theo role: các mục operator chỉ thỏa mãn yêu cầu operator, và
các role không phải operator vẫn cần scope dưới tiền tố role của chính chúng.

### Ví dụ Node

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

## Đóng khung

- **Yêu cầu**: `{type:"req", id, method, params}`
- **Phản hồi**: `{type:"res", id, ok, payload|error}`
- **Sự kiện**: `{type:"event", event, payload, seq?, stateVersion?}`

Các phương thức có tác dụng phụ yêu cầu **khóa idempotency** (xem schema).

## Role + scope

Để xem mô hình scope operator đầy đủ, các kiểm tra tại thời điểm phê duyệt và
ngữ nghĩa bí mật dùng chung, xem [Scope operator](/vi/gateway/operator-scopes).

### Role

- `operator` = client mặt phẳng điều khiển (CLI/UI/tự động hóa).
- `node` = host năng lực (camera/screen/canvas/system.run).

### Scope (operator)

Các scope phổ biến:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` với `includeSecrets: true` yêu cầu `operator.talk.secrets`
(hoặc `operator.admin`).

Các phương thức RPC Gateway do Plugin đăng ký có thể yêu cầu scope operator riêng,
nhưng các tiền tố quản trị core dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Scope phương thức chỉ là cổng kiểm tra đầu tiên. Một số lệnh slash được truy cập qua
`chat.send` áp dụng các kiểm tra cấp lệnh nghiêm ngặt hơn ở phía trên. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có thêm một kiểm tra scope tại thời điểm phê duyệt bên trên
scope phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có lệnh Node không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (Node)

Node khai báo các tuyên bố năng lực tại thời điểm kết nối:

- `caps`: các danh mục năng lực cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice` và `talk`.
- `commands`: allowlist lệnh cho invoke.
- `permissions`: các công tắc chi tiết (ví dụ: `screen.record`, `camera.capture`).

Gateway xem chúng là **tuyên bố** và thực thi allowlist phía máy chủ.

## Presence

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Mục presence bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị đó kết nối với cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Node đang kết nối báo cáo
  thời gian kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; Node đã ghép đôi cũng có thể báo cáo
  presence nền bền vững khi một sự kiện Node đáng tin cậy cập nhật metadata ghép đôi của chúng.

### Sự kiện Node còn sống trong nền

Node có thể gọi `node.event` với `event: "node.presence.alive"` để ghi lại rằng một Node đã ghép đôi đã
còn sống trong một lần đánh thức nền mà không đánh dấu nó là đang kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Các chuỗi trigger không xác định được Gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững cho các phiên thiết bị Node đã xác thực;
phiên không có thiết bị hoặc chưa ghép đôi trả về `handled: false`.

Gateway thành công trả về một kết quả có cấu trúc:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway cũ hơn vẫn có thể trả về `{ "ok": true }` cho `node.event`; client nên xem đó là
RPC đã được xác nhận, không phải là presence đã được lưu bền vững.

## Định phạm vi sự kiện broadcast

Các sự kiện broadcast WebSocket do máy chủ đẩy được kiểm soát theo scope để các phiên chỉ có scope ghép đôi hoặc chỉ dành cho Node không thụ động nhận nội dung phiên.

- **Khung chat, agent và kết quả công cụ** (bao gồm sự kiện `agent` được stream và kết quả gọi công cụ) yêu cầu ít nhất `operator.read`. Phiên không có `operator.read` bỏ qua hoàn toàn các khung này.
- **Broadcast `plugin.*` do Plugin định nghĩa** được kiểm soát theo `operator.write` hoặc `operator.admin`, tùy thuộc cách Plugin đăng ký chúng.
- **Sự kiện trạng thái và truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để tình trạng truyền tải luôn quan sát được với mọi phiên đã xác thực.
- **Các họ sự kiện broadcast không xác định** mặc định được kiểm soát theo scope (fail-closed) trừ khi một handler đã đăng ký nới lỏng chúng một cách rõ ràng.

Mỗi kết nối client giữ số thứ tự riêng theo client để broadcast duy trì thứ tự tăng đơn điệu trên socket đó ngay cả khi các client khác nhau thấy các tập con đã lọc theo scope khác nhau của luồng sự kiện.

## Các họ phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export
phương thức Plugin/kênh đã tải. Hãy xem nó là khám phá tính năng, không phải là bản
liệt kê đầy đủ của `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về snapshot tình trạng Gateway đã lưu trong bộ nhớ đệm hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về trình ghi ổn định chẩn đoán có giới hạn gần đây. Nó giữ metadata vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và id phiên. Nó không giữ văn bản chat, phần thân Webhook, đầu ra công cụ, phần thân yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Yêu cầu scope operator read.
    - `status` trả về bản tóm tắt Gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho client operator có scope admin.
    - `gateway.identity.get` trả về danh tính thiết bị Gateway được dùng bởi các luồng relay và ghép đôi.
    - `system-presence` trả về snapshot presence hiện tại cho các thiết bị operator/Node đang kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/broadcast ngữ cảnh presence.
    - `last-heartbeat` trả về sự kiện Heartbeat đã lưu mới nhất.
    - `set-heartbeats` bật/tắt xử lý Heartbeat trên Gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Truyền `{ "view": "configured" }` để lấy các mô hình đã cấu hình có kích thước phù hợp với bộ chọn (`agents.defaults.models` trước, rồi đến `models.providers.*.models`), hoặc `{ "view": "all" }` để lấy toàn bộ danh mục.
    - `usage.status` trả về các cửa sổ sử dụng của nhà cung cấp/tóm tắt hạn mức còn lại.
    - `usage.cost` trả về tóm tắt mức sử dụng chi phí đã tổng hợp cho một khoảng ngày.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của bộ nhớ vector / embedding đã lưu trong bộ nhớ đệm cho workspace của tác nhân mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi rõ ràng muốn ping trực tiếp nhà cung cấp embedding.
    - `doctor.memory.remHarness` trả về bản xem trước REM harness có giới hạn, chỉ đọc cho các client mặt phẳng điều khiển từ xa. Nó có thể bao gồm đường dẫn workspace, đoạn trích bộ nhớ, markdown có căn cứ đã render, và các ứng viên thăng hạng sâu, nên bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt mức sử dụng theo từng phiên.
    - `sessions.usage.timeseries` trả về mức sử dụng dạng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình trợ giúp đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/Plugin tích hợp sẵn + đi kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh đó hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có khả năng QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một push APNs thử nghiệm đến một Node iOS đã đăng ký.
    - `voicewake.get` trả về các trigger wake-word đã lưu.
    - `voicewake.set` cập nhật các trigger wake-word và phát thông báo thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi trực tiếp ra ngoài cho các lượt gửi nhắm theo kênh/tài khoản/luồng bên ngoài trình chạy chat.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với các điều khiển con trỏ/giới hạn và số byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.catalog` trả về danh mục nhà cung cấp Talk chỉ đọc cho giọng nói, phiên âm phát trực tuyến, và giọng nói thời gian thực. Nó bao gồm id nhà cung cấp, nhãn, trạng thái đã cấu hình, id mô hình/giọng nói được hiển thị, chế độ chuẩn, phương thức truyền tải, chiến lược não, và cờ âm thanh/khả năng thời gian thực mà không trả về bí mật của nhà cung cấp hoặc thay đổi cấu hình toàn cục.
    - `talk.config` trả về payload cấu hình Talk có hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.session.create` tạo một phiên Talk do Gateway sở hữu cho `realtime/gateway-relay`, `transcription/gateway-relay`, hoặc `stt-tts/managed-room`. `brain: "direct-tools"` yêu cầu `operator.admin`.
    - `talk.session.join` xác thực token phiên managed-room, phát các sự kiện `session.ready` hoặc `session.replaced` khi cần, và trả về siêu dữ liệu phòng/phiên cùng các sự kiện Talk gần đây mà không có token dạng văn bản thuần hoặc hàm băm token đã lưu.
    - `talk.session.appendAudio` nối âm thanh đầu vào PCM base64 vào các phiên relay thời gian thực và phiên phiên âm do Gateway sở hữu.
    - `talk.session.startTurn`, `talk.session.endTurn`, và `talk.session.cancelTurn` điều khiển vòng đời lượt managed-room với việc từ chối lượt đã cũ trước khi trạng thái bị xóa.
    - `talk.session.cancelOutput` dừng đầu ra âm thanh của trợ lý, chủ yếu cho chen ngang có VAD kiểm soát trong các phiên relay Gateway.
    - `talk.session.submitToolResult` hoàn tất một lệnh gọi công cụ của nhà cung cấp do phiên relay thời gian thực do Gateway sở hữu phát ra.
    - `talk.session.close` đóng một phiên relay, phiên âm, hoặc managed-room do Gateway sở hữu và phát các sự kiện Talk kết thúc.
    - `talk.mode` đặt/phát trạng thái chế độ Talk hiện tại cho các client WebChat/Control UI.
    - `talk.client.create` tạo một phiên nhà cung cấp thời gian thực do client sở hữu bằng `webrtc` hoặc `provider-websocket` trong khi Gateway sở hữu cấu hình, thông tin xác thực, chỉ dẫn, và chính sách công cụ.
    - `talk.client.toolCall` cho phép các phương thức truyền tải thời gian thực do client sở hữu chuyển tiếp lệnh gọi công cụ của nhà cung cấp đến chính sách Gateway. Công cụ được hỗ trợ đầu tiên là `openclaw_agent_consult`; client nhận một id lượt chạy và chờ các sự kiện vòng đời chat bình thường trước khi gửi kết quả công cụ đặc thù của nhà cung cấp.
    - `talk.event` là kênh sự kiện Talk duy nhất cho thời gian thực, phiên âm, STT/TTS, managed-room, điện thoại, và bộ điều hợp cuộc họp.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp dự phòng, và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về kho nhà cung cấp TTS hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy một lần chuyển đổi văn bản thành giọng nói.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật, và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRefs đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật nhắm đến lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về snapshot cấu hình hiện tại và hash.
    - `config.set` ghi một payload cấu hình đã được xác thực.
    - `config.patch` hợp nhất một bản cập nhật cấu hình một phần.
    - `config.apply` xác thực + thay thế toàn bộ payload cấu hình.
    - `config.schema` trả về payload schema cấu hình live được Control UI và công cụ CLI dùng: schema, `uiHints`, phiên bản, và siêu dữ liệu tạo sinh, bao gồm siêu dữ liệu schema Plugin + kênh khi runtime có thể tải. Schema bao gồm siêu dữ liệu trường `title` / `description` được dẫn xuất từ cùng các nhãn và văn bản trợ giúp mà UI dùng, bao gồm các nhánh thành phần đối tượng lồng nhau, wildcard, mục mảng, và `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về payload tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một nút schema nông, gợi ý khớp + `hintPath`, và tóm tắt con trực tiếp cho thao tác đi sâu UI/CLI. Các nút schema tra cứu giữ tài liệu hướng tới người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, cùng `hint` / `hintPath` khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi bản cập nhật đã thành công; bên gọi có phiên có thể bao gồm `continuationMessage` để khi khởi động, hệ thống tiếp tục một lượt tác nhân theo sau thông qua hàng đợi tiếp tục sau khởi động lại. Các bản cập nhật bằng trình quản lý gói buộc khởi động lại cập nhật không trì hoãn, không thời gian chờ sau khi hoán đổi gói để tiến trình Gateway cũ không tiếp tục tải lười từ cây `dist` đã bị thay thế.
    - `update.status` trả về sentinel khởi động lại cập nhật đã lưu trong bộ nhớ đệm mới nhất, bao gồm phiên bản đang chạy sau khởi động lại khi có.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` hiển thị trình hướng dẫn onboarding qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp tác nhân và workspace">
    - `agents.list` trả về các mục tác nhân đã cấu hình, bao gồm mô hình có hiệu lực và siêu dữ liệu runtime.
    - `agents.create`, `agents.update`, và `agents.delete` quản lý bản ghi tác nhân và liên kết workspace.
    - `agents.files.list`, `agents.files.get`, và `agents.files.set` quản lý các tệp workspace khởi động được hiển thị cho một tác nhân.
    - `artifacts.list`, `artifacts.get`, và `artifacts.download` hiển thị tóm tắt artifact dẫn xuất từ transcript và tải xuống cho phạm vi `sessionKey`, `runId`, hoặc `taskId` rõ ràng. Truy vấn lượt chạy và tác vụ phân giải phiên sở hữu ở phía máy chủ và chỉ trả về phương tiện transcript có provenance khớp; nguồn URL không an toàn hoặc cục bộ trả về tải xuống không được hỗ trợ thay vì fetch phía máy chủ.
    - `environments.list` và `environments.status` hiển thị khám phá môi trường chỉ đọc cục bộ Gateway và Node cho các client SDK.
    - `agent.identity.get` trả về định danh trợ lý có hiệu lực cho một tác nhân hoặc phiên.
    - `agent.wait` chờ một lượt chạy kết thúc và trả về snapshot kết thúc khi có.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` theo từng hàng khi một backend runtime tác nhân được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho client WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện transcript/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước transcript có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho một khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một đích phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào một phiên hiện có.
    - `sessions.steer` là biến thể ngắt-và-điều hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` cộng với `runId` tùy chọn, hoặc chỉ truyền `runId` cho các lượt chạy đang hoạt động mà Gateway có thể phân giải thành một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/ghi đè phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` có hiệu lực.
    - `sessions.reset`, `sessions.delete`, và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu.
    - Thực thi chat vẫn dùng `chat.history`, `chat.send`, `chat.abort`, và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho các client UI: các thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn) và token điều khiển mô hình ASCII/toàn chiều bị rò rỉ sẽ bị loại, các hàng trợ lý chỉ chứa token im lặng như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.

  </Accordion>

  <Accordion title="Ghép đôi thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép đôi đang chờ duyệt và đã được phê duyệt.
    - `device.pair.approve`, `device.pair.reject`, và `device.pair.remove` quản lý bản ghi ghép đôi thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi.
    - `device.token.revoke` thu hồi token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi.

  </Accordion>

  <Accordion title="Ghép đôi Node, gọi lệnh, và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, và `node.pair.verify` bao quát ghép đôi Node và xác minh bootstrap.
    - `node.list` và `node.describe` trả về trạng thái Node đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn Node đã ghép đôi.
    - `node.invoke` chuyển tiếp một lệnh đến Node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu gọi lệnh.
    - `node.event` mang các sự kiện bắt nguồn từ Node quay lại gateway.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi Node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các Node ngoại tuyến/mất kết nối.

  </Accordion>

  <Accordion title="Các nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` và `exec.approval.resolve` bao quát các yêu cầu phê duyệt exec một lần cùng với việc tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý các snapshot chính sách phê duyệt exec của Gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ trên Node thông qua các lệnh chuyển tiếp Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` và `plugin.approval.resolve` bao quát các luồng phê duyệt do Plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc ở lần Heartbeat tiếp theo; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: các bản cập nhật trò chuyện UI như `chat.inject` và các sự kiện trò chuyện chỉ dành cho bản ghi khác.
- `session.message` và `session.tool`: các bản cập nhật bản ghi/luồng sự kiện cho một phiên đã đăng ký theo dõi.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: các bản cập nhật snapshot trạng thái hiện diện của hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: bản cập nhật snapshot sức khỏe Gateway.
- `heartbeat`: bản cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi lần chạy/tác vụ Cron.
- `shutdown`: thông báo tắt Gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép cặp Node.
- `node.invoke.request`: phát rộng yêu cầu gọi Node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép cặp.
- `voicewake.changed`: cấu hình kích hoạt bằng từ đánh thức đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt Plugin.

### Phương thức trợ giúp Node

- Node có thể gọi `skills.bins` để lấy danh sách hiện tại các tệp thực thi Skills cho các kiểm tra tự động cho phép.

### Phương thức trợ giúp cho người vận hành

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh runtime cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có dấu `/` ở đầu
    - `native` và đường dẫn mặc định `both` trả về tên native có nhận biết provider khi có sẵn
  - `textAliases` mang các bí danh slash chính xác như `/model` và `/m`.
  - `nativeName` mang tên lệnh native có nhận biết provider khi tồn tại.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cùng tính khả dụng của lệnh Plugin native.
  - `includeArgs=false` bỏ qua siêu dữ liệu đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy danh mục công cụ runtime cho một agent. Phản hồi bao gồm các công cụ đã nhóm và siêu dữ liệu nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu Plugin khi `source="plugin"`
  - `optional`: công cụ Plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực trong runtime cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh runtime đáng tin cậy từ phía máy chủ phiên thay vì chấp nhận ngữ cảnh xác thực hoặc phân phối do bên gọi cung cấp.
  - Phản hồi được giới hạn theo phiên và phản ánh những gì cuộc hội thoại đang hoạt động có thể dùng ngay lúc này, bao gồm các công cụ core, Plugin và kênh.
- Người vận hành có thể gọi `tools.invoke` (`operator.write`) để gọi một công cụ khả dụng thông qua cùng đường dẫn chính sách Gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm` và `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều có mặt, agent của phiên đã phân giải phải khớp với `agentId`.
  - Phản hồi là một envelope hướng SDK với các trường `ok`, `toolName`, `output` tùy chọn và `error` có kiểu. Các từ chối do phê duyệt hoặc chính sách trả về `ok:false` trong payload thay vì bỏ qua pipeline chính sách công cụ Gateway.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy danh mục Skills hiển thị cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - Phản hồi bao gồm tính đủ điều kiện, các yêu cầu bị thiếu, kiểm tra cấu hình và các tùy chọn cài đặt đã làm sạch mà không để lộ giá trị bí mật thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) để lấy siêu dữ liệu khám phá ClawHub.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một thư mục skill vào thư mục `skills/` của workspace agent mặc định.
  - Chế độ trình cài đặt Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` chạy một hành động `metadata.openclaw.install` đã khai báo trên máy chủ Gateway.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug đang được theo dõi hoặc tất cả các bản cài đặt ClawHub đang được theo dõi trong workspace agent mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`, `apiKey` và `env`.

### Các chế độ xem `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi runtime hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là danh mục được cho phép; nếu không, phản hồi là toàn bộ danh mục Gateway.
- `"configured"`: hành vi có kích thước phù hợp cho bộ chọn. Nếu `agents.defaults.models` được cấu hình, nó vẫn được ưu tiên. Nếu không, phản hồi dùng các mục `models.providers.*.models` rõ ràng, chỉ quay về toàn bộ danh mục khi không có hàng model nào được cấu hình.
- `"all"`: toàn bộ danh mục Gateway, bỏ qua `agents.defaults.models`. Dùng chế độ này cho chẩn đoán và UI khám phá, không dùng cho bộ chọn model thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, Gateway phát rộng `exec.approval.requested`.
- Client người vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu scope `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/siêu dữ liệu phiên chuẩn). Các yêu cầu thiếu `systemRunPlan` bị từ chối.
- Sau khi được phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ tái sử dụng `systemRunPlan` chuẩn đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` đã được phê duyệt cuối cùng, Gateway từ chối lần chạy thay vì tin payload đã bị thay đổi.

## Dự phòng phân phối agent

- Các yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối outbound.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: các đích phân phối không phân giải được hoặc chỉ nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép dự phòng sang thực thi chỉ trong phiên khi không thể phân giải tuyến có thể phân phối bên ngoài (ví dụ các phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).

## Đánh phiên bản

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/version.ts`.
- Client gửi `minProtocol` + `maxProtocol`; máy chủ từ chối các trường hợp không khớp.
- Schema + model được tạo từ các định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số client

Client tham chiếu trong `src/gateway/client.ts` dùng các giá trị mặc định này. Các giá trị ổn định trên protocol v4 và là baseline kỳ vọng cho client bên thứ ba.

| Hằng số                                  | Mặc định                                               | Nguồn                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Thời gian chờ yêu cầu (mỗi RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Thời gian chờ tiền xác thực / thử thách kết nối       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (cấu hình/env có thể tăng ngân sách máy chủ/client đã ghép cặp) |
| Backoff kết nối lại ban đầu                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Kẹp thử lại nhanh sau khi đóng bằng token thiết bị | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Thời gian gia hạn force-stop trước `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Thời gian chờ mặc định của `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do hết thời gian chờ tick                        | code `4000` khi im lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Máy chủ quảng bá `policy.tickIntervalMs`, `policy.maxPayload` và `policy.maxBufferedBytes` có hiệu lực trong `hello-ok`; client nên tuân theo các giá trị đó thay vì các giá trị mặc định trước bắt tay.

## Xác thực

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy theo chế độ xác thực đã cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc non-loopback
  `gateway.auth.mode: "trusted-proxy"` đáp ứng kiểm tra xác thực kết nối từ
  header của yêu cầu thay vì `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` bỏ qua hoàn toàn xác thực kết nối
  bằng bí mật dùng chung; không để lộ chế độ đó trên ingress công khai/không đáng tin cậy.
- Sau khi ghép nối, Gateway cấp một **mã thông báo thiết bị** được giới hạn theo
  vai trò kết nối + phạm vi. Nó được trả về trong `hello-ok.auth.deviceToken` và nên được
  máy khách lưu lại cho các lần kết nối sau.
- Máy khách nên lưu `hello-ok.auth.deviceToken` chính sau mọi lần kết nối
  thành công.
- Kết nối lại bằng mã thông báo thiết bị **đã lưu** đó cũng nên dùng lại tập
  phạm vi đã phê duyệt được lưu cho mã thông báo đó. Điều này giữ nguyên quyền truy cập đọc/thăm dò/trạng thái
  đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại về một
  phạm vi ngầm định chỉ dành cho quản trị viên.
- Tập hợp xác thực kết nối phía máy khách (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` là độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: mã thông báo dùng chung tường minh trước,
    sau đó là một `deviceToken` tường minh, rồi đến mã thông báo theo từng thiết bị đã lưu (được khóa theo
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được một
    `auth.token`. Mã thông báo dùng chung hoặc bất kỳ mã thông báo thiết bị nào được phân giải sẽ chặn nó.
  - Việc tự động nâng cấp một mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được cho phép với **điểm cuối đáng tin cậy** —
    loopback, hoặc `wss://` với `tlsFingerprint` được ghim. `wss://` công khai
    không ghim không đủ điều kiện.
- Các mục `hello-ok.auth.deviceTokens` bổ sung là mã thông báo bàn giao bootstrap.
  Chỉ lưu chúng khi kết nối dùng xác thực bootstrap trên một transport đáng tin cậy
  như `wss://` hoặc ghép nối loopback/local.
- Nếu máy khách cung cấp một `deviceToken` **tường minh** hoặc `scopes` tường minh, thì
  tập phạm vi do bên gọi yêu cầu đó vẫn là nguồn có thẩm quyền; phạm vi trong bộ nhớ đệm chỉ
  được dùng lại khi máy khách dùng lại mã thông báo theo từng thiết bị đã lưu.
- Mã thông báo thiết bị có thể được xoay/thu hồi qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`).
- `device.token.rotate` trả về siêu dữ liệu xoay. Nó chỉ phản hồi lại mã thông báo bearer
  thay thế cho các lệnh gọi cùng thiết bị đã được xác thực bằng
  mã thông báo thiết bị đó, để máy khách chỉ dùng mã thông báo có thể lưu mã thay thế trước khi
  kết nối lại. Các lần xoay dùng chung/quản trị viên không phản hồi lại mã thông báo bearer.
- Việc cấp, xoay và thu hồi mã thông báo vẫn bị giới hạn trong tập vai trò đã phê duyệt
  được ghi trong mục ghép nối của thiết bị đó; thao tác thay đổi mã thông báo không thể mở rộng hoặc
  nhắm tới vai trò thiết bị mà phê duyệt ghép nối chưa từng cấp.
- Với các phiên mã thông báo thiết bị đã ghép nối, quản lý thiết bị được giới hạn trong chính thiết bị đó trừ khi
  bên gọi cũng có `operator.admin`: bên gọi không phải quản trị viên chỉ có thể xóa/thu hồi/xoay
  mục thiết bị **của chính họ**.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi mã thông báo operator
  đích với phạm vi phiên hiện tại của bên gọi. Bên gọi không phải quản trị viên
  không thể xoay hoặc thu hồi một mã thông báo operator rộng hơn phạm vi họ đang có.
- Lỗi xác thực bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi của máy khách với `AUTH_TOKEN_MISMATCH`:
  - Máy khách đáng tin cậy có thể thử lại một lần có giới hạn bằng mã thông báo theo từng thiết bị trong bộ nhớ đệm.
  - Nếu lần thử lại đó thất bại, máy khách nên dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho người vận hành.

## Danh tính thiết bị + ghép nối

- Các Node nên bao gồm một danh tính thiết bị ổn định (`device.id`) được dẫn xuất từ
  vân tay cặp khóa.
- Gateway cấp mã thông báo theo từng thiết bị + vai trò.
- Cần có phê duyệt ghép nối cho ID thiết bị mới trừ khi bật tự động phê duyệt cục bộ.
- Tự động phê duyệt ghép nối tập trung vào các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường dẫn tự kết nối hẹp trong backend/container-local cho
  các luồng trợ giúp dùng bí mật dùng chung đáng tin cậy.
- Các kết nối tailnet hoặc LAN cùng máy chủ vẫn được xem là từ xa đối với ghép nối và
  yêu cầu phê duyệt.
- Máy khách WS thường bao gồm danh tính `device` trong khi `connect` (operator +
  node). Các ngoại lệ operator không có thiết bị duy nhất là các đường dẫn tin cậy tường minh:
  - `gateway.controlUi.allowInsecureAuth=true` cho khả năng tương thích HTTP không an toàn chỉ trên localhost.
  - xác thực Control UI operator thành công với `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` qua direct-loopback được xác thực bằng mã thông báo/mật khẩu
    Gateway dùng chung.
- Tất cả kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di chuyển xác thực thiết bị

Với các máy khách cũ vẫn dùng hành vi ký trước challenge, `connect` hiện trả về
mã chi tiết `DEVICE_AUTH_*` dưới `error.details.code` cùng `error.details.reason` ổn định.

Các lỗi di chuyển thường gặp:

| Thông báo                    | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Máy khách bỏ qua `device.nonce` (hoặc gửi rỗng).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Máy khách đã ký bằng nonce cũ/sai.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp payload v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.         |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký payload v2 có bao gồm nonce máy chủ.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`, liên kết `platform` và `deviceFamily`
  bên cạnh các trường device/client/role/scopes/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng ghim siêu dữ liệu
  thiết bị đã ghép nối vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Máy khách có thể tùy chọn ghim vân tay chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này phơi bày **toàn bộ API Gateway** (trạng thái, kênh, mô hình, chat,
agent, phiên, node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi các schema
TypeBox trong `src/gateway/protocol/schema.ts`.

## Liên quan

- [Giao thức bridge](/vi/gateway/bridge-protocol)
- [Runbook Gateway](/vi/gateway)
