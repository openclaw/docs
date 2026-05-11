---
read_when:
    - Triển khai hoặc cập nhật các máy khách WS của Gateway
    - Gỡ lỗi các điểm không khớp về giao thức hoặc lỗi kết nối
    - Tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-05-11T20:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol là **mặt phẳng điều khiển duy nhất + lớp vận chuyển Node** cho
OpenClaw. Tất cả client (CLI, giao diện web, ứng dụng macOS, Node iOS/Android, Node
không giao diện) kết nối qua WebSocket và khai báo **role** + **scope** của chúng tại
thời điểm bắt tay.

## Vận chuyển

- WebSocket, khung văn bản với tải trọng JSON.
- Khung đầu tiên **phải** là yêu cầu `connect`.
- Các khung trước kết nối được giới hạn ở 64 KiB. Sau khi bắt tay thành công, client
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các khung đến quá cỡ và bộ đệm gửi đi chậm sẽ phát ra sự kiện `payload.large`
  trước khi gateway đóng hoặc bỏ khung bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ nội dung thông điệp,
  nội dung tệp đính kèm, thân khung thô, token, cookie hoặc giá trị bí mật.

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
    "minProtocol": 3,
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

Khi Gateway vẫn đang hoàn tất các sidecar khởi động, yêu cầu `connect` có thể
trả về lỗi `UNAVAILABLE` có thể thử lại với `details.reason` được đặt thành
`"startup-sidecars"` và `retryAfterMs`. Client nên thử lại phản hồi đó
trong ngân sách kết nối tổng thể của chúng thay vì hiển thị nó như một lỗi
bắt tay cuối cùng.

`server`, `features`, `snapshot` và `policy` đều là bắt buộc theo schema
(`src/gateway/protocol/schema/frames.ts`). `auth` cũng là bắt buộc và báo cáo
role/scopes đã được thương lượng. `pluginSurfaceUrls` là tùy chọn và ánh xạ tên
bề mặt Plugin, chẳng hạn như `canvas`, tới các URL được lưu trữ có phạm vi.

URL bề mặt Plugin có phạm vi có thể hết hạn. Node có thể gọi
`node.pluginSurface.refresh` với `{ "surface": "canvas" }` để nhận một mục mới
trong `pluginSurfaceUrls`. Bản tái cấu trúc Plugin Canvas thử nghiệm không
hỗ trợ đường dẫn tương thích đã ngừng dùng `canvasHostUrl`, `canvasCapability` hoặc
`node.canvas.capability.refresh`; các client native và gateway hiện tại phải dùng
bề mặt Plugin.

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
chúng xác thực bằng token/mật khẩu gateway dùng chung. Đường dẫn này được dành riêng
cho các RPC mặt phẳng điều khiển nội bộ và tránh để các baseline ghép cặp CLI/thiết bị
cũ chặn công việc backend cục bộ như cập nhật phiên subagent. Client từ xa,
client có nguồn gốc trình duyệt, client Node và client token thiết bị/danh tính thiết bị
tường minh vẫn dùng các kiểm tra ghép cặp và nâng cấp phạm vi thông thường.

Khi cấp token thiết bị, `hello-ok` cũng bao gồm:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Trong quá trình chuyển giao bootstrap đáng tin cậy, `hello-ok.auth` cũng có thể bao gồm
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

Đối với luồng bootstrap Node/operator tích hợp, token Node chính giữ nguyên
`scopes: []` và mọi token operator được chuyển giao vẫn bị giới hạn trong allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kiểm tra phạm vi bootstrap vẫn
có tiền tố role: mục operator chỉ thỏa mãn yêu cầu operator, và các role không phải
operator vẫn cần phạm vi dưới tiền tố role riêng của chúng.

### Ví dụ Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

Các method có tác dụng phụ yêu cầu **khóa bất biến** (xem schema).

## Role + phạm vi

Để xem mô hình phạm vi operator đầy đủ, kiểm tra tại thời điểm phê duyệt và
ngữ nghĩa bí mật dùng chung, xem [Phạm vi operator](/vi/gateway/operator-scopes).

### Role

- `operator` = client mặt phẳng điều khiển (CLI/UI/tự động hóa).
- `node` = máy chủ capability (camera/screen/canvas/system.run).

### Phạm vi (operator)

Các phạm vi phổ biến:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` với `includeSecrets: true` yêu cầu `operator.talk.secrets`
(hoặc `operator.admin`).

Các method RPC Gateway do Plugin đăng ký có thể yêu cầu phạm vi operator riêng,
nhưng các tiền tố quản trị core được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi method chỉ là cổng đầu tiên. Một số slash command được truy cập qua
`chat.send` áp dụng kiểm tra cấp lệnh nghiêm ngặt hơn ở phía trên. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có thêm kiểm tra phạm vi tại thời điểm phê duyệt bên trên
phạm vi method cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có lệnh Node không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (Node)

Node khai báo các capability claim tại thời điểm kết nối:

- `caps`: các danh mục capability cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice` và `talk`.
- `commands`: allowlist lệnh cho invoke.
- `permissions`: các công tắc chi tiết (ví dụ: `screen.record`, `camera.capture`).

Gateway xem các mục này là **claim** và thực thi allowlist phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị đó kết nối vừa là **operator** vừa là **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Node đã kết nối báo cáo
  thời gian kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; Node đã ghép cặp cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện Node đáng tin cậy cập nhật metadata ghép cặp của chúng.

### Sự kiện Node sống trong nền

Node có thể gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một Node đã ghép cặp
đã sống trong một lần đánh thức nền mà không đánh dấu nó là đã kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Các chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững cho các phiên thiết bị Node đã xác thực;
phiên không có thiết bị hoặc chưa ghép cặp trả về `handled: false`.

Gateway thành công trả về kết quả có cấu trúc:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway cũ hơn vẫn có thể trả về `{ "ok": true }` cho `node.event`; client nên xem đó là một
RPC đã được xác nhận, không phải là lưu bền vững hiện diện.

## Phạm vi sự kiện broadcast

Các sự kiện broadcast WebSocket do máy chủ đẩy được kiểm soát theo phạm vi để các phiên chỉ có phạm vi ghép cặp hoặc chỉ dành cho Node không thụ động nhận nội dung phiên.

- **Khung chat, agent và kết quả công cụ** (bao gồm các sự kiện `agent` được stream và kết quả gọi công cụ) yêu cầu ít nhất `operator.read`. Các phiên không có `operator.read` bỏ qua hoàn toàn các khung này.
- **Broadcast `plugin.*` do Plugin định nghĩa** được kiểm soát theo `operator.write` hoặc `operator.admin`, tùy theo cách Plugin đăng ký chúng.
- **Sự kiện trạng thái và vận chuyển** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để mọi phiên đã xác thực đều quan sát được sức khỏe vận chuyển.
- **Các họ sự kiện broadcast không xác định** mặc định bị kiểm soát theo phạm vi (fail-closed) trừ khi một handler đã đăng ký nới lỏng chúng một cách tường minh.

Mỗi kết nối client giữ số thứ tự theo từng client riêng để broadcast duy trì thứ tự đơn điệu trên socket đó ngay cả khi các client khác nhau thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ method RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export method
Plugin/channel đã tải. Hãy xem nó là khám phá tính năng, không phải danh sách liệt kê đầy đủ
của `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` trả về ảnh chụp nhanh sức khỏe gateway đã lưu cache hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi ổn định chẩn đoán có giới hạn gần đây. Nó giữ metadata vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên channel/Plugin và id phiên. Nó không giữ văn bản chat, thân webhook, đầu ra công cụ, thân yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Yêu cầu phạm vi đọc operator.
    - `status` trả về tóm tắt gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho client operator có phạm vi admin.
    - `gateway.identity.get` trả về danh tính thiết bị gateway được dùng bởi các luồng relay và ghép cặp.
    - `system-presence` trả về ảnh chụp nhanh hiện diện hiện tại cho các thiết bị operator/Node đã kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/broadcast ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện heartbeat đã lưu bền vững mới nhất.
    - `set-heartbeats` bật/tắt xử lý heartbeat trên gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Truyền `{ "view": "configured" }` cho các mô hình đã cấu hình có kích thước phù hợp với bộ chọn (`agents.defaults.models` trước, rồi `models.providers.*.models`), hoặc `{ "view": "all" }` cho toàn bộ danh mục.
    - `usage.status` trả về các cửa sổ sử dụng/tóm tắt hạn mức còn lại của provider.
    - `usage.cost` trả về các tóm tắt mức sử dụng chi phí đã tổng hợp cho một khoảng ngày.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của vector-memory / embedding đã lưu trong bộ nhớ đệm cho workspace agent mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi rõ ràng muốn ping provider embedding trực tiếp.
    - `doctor.memory.remHarness` trả về bản xem trước REM harness có giới hạn, chỉ đọc cho các client control-plane từ xa. Nó có thể bao gồm đường dẫn workspace, đoạn trích bộ nhớ, markdown có căn cứ đã render, và các ứng viên thăng cấp sâu, nên bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt mức sử dụng theo từng phiên.
    - `sessions.usage.timeseries` trả về mức sử dụng theo chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình hỗ trợ đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/Plugin tích hợp sẵn + đóng gói kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho provider kênh web hiện tại có hỗ trợ QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một APNs push thử nghiệm đến một Node iOS đã đăng ký.
    - `voicewake.get` trả về các kích hoạt wake-word đã lưu.
    - `voicewake.set` cập nhật các kích hoạt wake-word và phát thông báo thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi trực tiếp ra ngoài cho các lượt gửi được nhắm theo kênh/tài khoản/luồng bên ngoài chat runner.
    - `logs.tail` trả về phần đuôi file-log Gateway đã cấu hình với cursor/limit và các điều khiển số byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.catalog` trả về danh mục provider Talk chỉ đọc cho giọng nói, phiên âm streaming và giọng nói realtime. Nó bao gồm id provider, nhãn, trạng thái đã cấu hình, id mô hình/giọng nói được công bố, chế độ chuẩn, transport, chiến lược brain, và cờ âm thanh/khả năng realtime mà không trả về bí mật provider hoặc thay đổi cấu hình toàn cục.
    - `talk.config` trả về payload cấu hình Talk hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.session.create` tạo một phiên Talk do Gateway sở hữu cho `realtime/gateway-relay`, `transcription/gateway-relay`, hoặc `stt-tts/managed-room`. `brain: "direct-tools"` yêu cầu `operator.admin`.
    - `talk.session.join` xác thực token phiên managed-room, phát sự kiện `session.ready` hoặc `session.replaced` khi cần, và trả về metadata phòng/phiên cùng các sự kiện Talk gần đây mà không có token văn bản thuần hoặc hash token đã lưu.
    - `talk.session.appendAudio` thêm âm thanh đầu vào PCM base64 vào các phiên realtime relay và phiên âm do Gateway sở hữu.
    - `talk.session.startTurn`, `talk.session.endTurn`, và `talk.session.cancelTurn` điều khiển vòng đời lượt managed-room với cơ chế từ chối lượt cũ trước khi trạng thái bị xóa.
    - `talk.session.cancelOutput` dừng đầu ra âm thanh của assistant, chủ yếu cho barge-in có cổng VAD trong các phiên Gateway relay.
    - `talk.session.submitToolResult` hoàn tất một lệnh gọi công cụ provider do phiên realtime relay do Gateway sở hữu phát ra. Truyền `options: { willContinue: true }` cho đầu ra công cụ tạm thời khi kết quả cuối cùng sẽ theo sau, hoặc `options: { suppressResponse: true }` khi kết quả công cụ nên đáp ứng lệnh gọi provider mà không bắt đầu một phản hồi assistant realtime khác.
    - `talk.session.close` đóng một phiên relay, phiên âm hoặc managed-room do Gateway sở hữu và phát các sự kiện Talk kết thúc.
    - `talk.mode` đặt/phát trạng thái chế độ Talk hiện tại cho các client WebChat/Control UI.
    - `talk.client.create` tạo một phiên provider realtime do client sở hữu bằng `webrtc` hoặc `provider-websocket` trong khi Gateway sở hữu cấu hình, thông tin xác thực, chỉ dẫn và chính sách công cụ.
    - `talk.client.toolCall` cho phép các transport realtime do client sở hữu chuyển tiếp lệnh gọi công cụ provider đến chính sách Gateway. Công cụ được hỗ trợ đầu tiên là `openclaw_agent_consult`; client nhận một id lần chạy và chờ các sự kiện vòng đời chat bình thường trước khi gửi kết quả công cụ đặc thù provider.
    - `talk.event` là kênh sự kiện Talk duy nhất cho realtime, phiên âm, STT/TTS, managed-room, điện thoại và bộ chuyển đổi cuộc họp.
    - `talk.speak` tổng hợp giọng nói thông qua provider giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, provider đang hoạt động, các provider fallback và trạng thái cấu hình provider.
    - `tts.providers` trả về kho provider TTS hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật provider TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRef đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật nhắm theo lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về snapshot cấu hình hiện tại và hash.
    - `config.set` ghi một payload cấu hình đã xác thực.
    - `config.patch` hợp nhất một cập nhật cấu hình một phần.
    - `config.apply` xác thực + thay thế toàn bộ payload cấu hình.
    - `config.schema` trả về payload schema cấu hình trực tiếp được Control UI và công cụ CLI sử dụng: schema, `uiHints`, phiên bản và metadata tạo sinh, bao gồm metadata schema Plugin + kênh khi runtime có thể tải được. Schema bao gồm metadata trường `title` / `description` được dẫn xuất từ cùng nhãn và văn bản trợ giúp mà UI sử dụng, bao gồm các nhánh thành phần đối tượng lồng nhau, wildcard, phần tử mảng, và `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về một payload tra cứu giới hạn theo đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một node schema nông, hint khớp + `hintPath`, và tóm tắt con trực tiếp cho thao tác đi sâu UI/CLI. Các node schema tra cứu giữ tài liệu hướng người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con công bố `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, cùng `hint` / `hintPath` đã khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi bản cập nhật tự nó thành công; bên gọi có phiên có thể bao gồm `continuationMessage` để khi khởi động tiếp tục một lượt agent theo dõi qua hàng đợi tiếp tục sau khởi động lại. Các cập nhật package-manager buộc một lần khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi gói để tiến trình Gateway cũ không tiếp tục lazy-load từ cây `dist` đã bị thay thế.
    - `update.status` trả về sentinel khởi động lại cập nhật đã lưu trong bộ nhớ đệm mới nhất, bao gồm phiên bản đang chạy sau khởi động lại khi có.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` công bố trình hướng dẫn onboarding qua WS RPC.

  </Accordion>

  <Accordion title="Agent và trình hỗ trợ workspace">
    - `agents.list` trả về các mục agent đã cấu hình, bao gồm mô hình hiệu lực và metadata runtime.
    - `agents.create`, `agents.update`, và `agents.delete` quản lý bản ghi agent và liên kết workspace.
    - `agents.files.list`, `agents.files.get`, và `agents.files.set` quản lý các file workspace bootstrap được công bố cho một agent.
    - `tasks.list`, `tasks.get`, và `tasks.cancel` công bố sổ cái tác vụ Gateway cho SDK và client operator.
    - `artifacts.list`, `artifacts.get`, và `artifacts.download` công bố tóm tắt hiện vật dẫn xuất từ transcript và tải xuống cho phạm vi `sessionKey`, `runId`, hoặc `taskId` rõ ràng. Truy vấn lần chạy và tác vụ phân giải phiên sở hữu ở phía server và chỉ trả về media transcript có provenance khớp; nguồn URL không an toàn hoặc cục bộ trả về tải xuống không được hỗ trợ thay vì fetch phía server.
    - `environments.list` và `environments.status` công bố khám phá môi trường Gateway-local và node chỉ đọc cho client SDK.
    - `agent.identity.get` trả về danh tính assistant hiệu lực cho một agent hoặc phiên.
    - `agent.wait` chờ một lần chạy kết thúc và trả về snapshot kết thúc khi có.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm metadata `agentRuntime` theo từng hàng khi một backend runtime agent được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho client WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện transcript/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước transcript có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một đích phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào một phiên hiện có.
    - `sessions.steer` là biến thể ngắt-và-điều-hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` cùng `runId` tùy chọn, hoặc chỉ truyền `runId` cho các lần chạy đang hoạt động mà Gateway có thể phân giải về một phiên.
    - `sessions.patch` cập nhật metadata/ghi đè phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` hiệu lực.
    - `sessions.reset`, `sessions.delete`, và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu.
    - Thực thi chat vẫn dùng `chat.history`, `chat.send`, `chat.abort`, và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho client UI: các thẻ chỉ thị inline bị loại khỏi văn bản hiển thị, payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn) và token điều khiển mô hình ASCII/full-width bị rò rỉ được loại bỏ, các hàng assistant chỉ gồm token im lặng như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.

  </Accordion>

  <Accordion title="Ghép đôi thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép đôi đang chờ xử lý và đã phê duyệt.
    - `device.pair.approve`, `device.pair.reject`, và `device.pair.remove` quản lý bản ghi ghép đôi thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi.
    - `device.token.revoke` thu hồi token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi.

  </Accordion>

  <Accordion title="Ghép đôi Node, gọi lệnh và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, và `node.pair.verify` bao quát ghép đôi node và xác minh bootstrap.
    - `node.list` và `node.describe` trả về trạng thái node đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn node đã ghép đôi.
    - `node.invoke` chuyển tiếp một lệnh đến node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu gọi lệnh.
    - `node.event` mang các sự kiện có nguồn gốc từ node trở lại gateway.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các node ngoại tuyến/bị ngắt kết nối.

  </Accordion>

  <Accordion title="Các nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` và `exec.approval.resolve` bao quát các yêu cầu phê duyệt exec một lần cùng với tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý các snapshot chính sách phê duyệt exec của gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ trên node thông qua các lệnh chuyển tiếp node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` và `plugin.approval.resolve` bao quát các luồng phê duyệt do plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc ở heartbeat kế tiếp; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện thường gặp

- `chat`: các cập nhật trò chuyện UI như `chat.inject` và các sự kiện trò chuyện
  chỉ thuộc bản ghi khác.
- `session.message` và `session.tool`: các cập nhật bản ghi/luồng sự kiện cho một
  phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: các cập nhật snapshot hiện diện hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: cập nhật snapshot tình trạng gateway.
- `heartbeat`: cập nhật luồng sự kiện heartbeat.
- `cron`: sự kiện thay đổi lượt chạy/tác vụ cron.
- `shutdown`: thông báo tắt gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép cặp node.
- `node.invoke.request`: phát quảng bá yêu cầu gọi node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép cặp.
- `voicewake.changed`: cấu hình kích hoạt bằng wake-word đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt plugin.

### Phương thức trợ giúp Node

- Nodes có thể gọi `skills.bins` để lấy danh sách hiện tại của các tệp thực thi skill
  phục vụ kiểm tra tự động cho phép.

### RPC sổ cái tác vụ

Các client vận hành có thể kiểm tra và hủy các bản ghi tác vụ nền của Gateway thông qua
các RPC sổ cái tác vụ. Các phương thức này trả về bản tóm tắt tác vụ đã được làm sạch,
không phải trạng thái runtime thô.

- `tasks.list` yêu cầu `operator.read`.
  - Tham số: `status` tùy chọn (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` hoặc `"timed_out"`) hoặc một mảng các trạng thái đó,
    `agentId` tùy chọn, `sessionKey` tùy chọn, `limit` tùy chọn từ `1` đến
    `500`, và chuỗi `cursor` tùy chọn.
  - Kết quả: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` yêu cầu `operator.read`.
  - Tham số: `{ "taskId": string }`.
  - Kết quả: `{ "task": TaskSummary }`.
  - Id tác vụ bị thiếu trả về dạng lỗi not-found của Gateway.
- `tasks.cancel` yêu cầu `operator.write`.
  - Tham số: `{ "taskId": string, "reason"?: string }`.
  - Kết quả:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` báo cáo liệu sổ cái có tác vụ khớp hay không. `cancelled`
    báo cáo liệu runtime đã chấp nhận hoặc ghi nhận việc hủy hay chưa.

`TaskSummary` bao gồm `id`, `status`, và siêu dữ liệu tùy chọn như `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, dấu thời gian, tiến độ,
tóm tắt kết thúc, và văn bản lỗi đã được làm sạch.

### Phương thức trợ giúp cho operator

- Operators có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh runtime
  cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - `scope` điều khiển bề mặt mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có `/` ở đầu
    - `native` và đường dẫn `both` mặc định trả về tên native nhận biết provider
      khi có
  - `textAliases` mang các alias slash chính xác như `/model` và `/m`.
  - `nativeName` mang tên lệnh native nhận biết provider khi tồn tại.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cùng khả năng
    sẵn có của lệnh plugin native.
  - `includeArgs=false` bỏ siêu dữ liệu đối số đã tuần tự hóa khỏi phản hồi.
- Operators có thể gọi `tools.catalog` (`operator.read`) để lấy danh mục công cụ runtime cho một
  agent. Phản hồi bao gồm các công cụ đã nhóm và siêu dữ liệu nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu plugin khi `source="plugin"`
  - `optional`: liệu công cụ plugin có tùy chọn hay không
- Operators có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực runtime
  cho một phiên.
  - `sessionKey` là bắt buộc.
  - gateway suy ra ngữ cảnh runtime đáng tin cậy từ phiên ở phía máy chủ thay vì chấp nhận
    ngữ cảnh xác thực hoặc phân phối do bên gọi cung cấp.
  - Phản hồi được giới hạn theo phiên và phản ánh những gì cuộc hội thoại đang hoạt động có thể dùng ngay bây giờ,
    bao gồm công cụ core, plugin và kênh.
- Operators có thể gọi `tools.invoke` (`operator.write`) để gọi một công cụ có sẵn thông qua
  cùng đường dẫn chính sách gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm` và
    `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều có mặt, agent của phiên đã phân giải phải khớp
    `agentId`.
  - Phản hồi là một envelope hướng tới SDK với `ok`, `toolName`, `output` tùy chọn, và các trường
    `error` có kiểu. Từ chối do phê duyệt hoặc chính sách trả về `ok:false` trong payload thay vì
    bỏ qua pipeline chính sách công cụ gateway.
- Operators có thể gọi `skills.status` (`operator.read`) để lấy danh mục skill hiển thị
  cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - Phản hồi bao gồm điều kiện đủ, yêu cầu còn thiếu, kiểm tra cấu hình, và
    tùy chọn cài đặt đã được làm sạch mà không để lộ giá trị bí mật thô.
- Operators có thể gọi `skills.search` và `skills.detail` (`operator.read`) để lấy
  siêu dữ liệu khám phá ClawHub.
- Operators có thể gọi `skills.upload.begin`, `skills.upload.chunk` và
  `skills.upload.commit` (`operator.admin`) để stage một kho lưu trữ skill riêng tư
  trước khi cài đặt. Đây là đường dẫn tải lên admin riêng cho các client đáng tin cậy,
  không phải luồng cài đặt skill ClawHub thông thường, và mặc định bị tắt trừ khi
  `skills.install.allowUploadedArchives` được bật.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tạo một lượt tải lên gắn với slug và giá trị force đó.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` nối byte tại
    offset đã giải mã chính xác.
  - `skills.upload.commit({ uploadId, sha256? })` xác minh kích thước cuối cùng và
    SHA-256. Commit chỉ hoàn tất lượt tải lên; nó không cài đặt skill.
  - Kho lưu trữ skill đã tải lên là kho lưu trữ zip chứa một gốc `SKILL.md`. Tên thư mục nội bộ của
    kho lưu trữ không bao giờ chọn đích cài đặt.
- Operators có thể gọi `skills.install` (`operator.admin`) ở ba chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một
    thư mục skill vào thư mục `skills/` của workspace agent mặc định.
  - Chế độ tải lên: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    cài đặt một lượt tải lên đã commit vào thư mục `skills/<slug>` của workspace agent mặc định.
    slug và giá trị force phải khớp yêu cầu
    `skills.upload.begin` ban đầu. Chế độ này bị từ chối trừ khi
    `skills.install.allowUploadedArchives` được bật. Thiết lập này không
    ảnh hưởng đến các cài đặt ClawHub.
  - Chế độ trình cài đặt Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    chạy một hành động `metadata.openclaw.install` đã khai báo trên host gateway.
- Operators có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả cài đặt ClawHub được theo dõi trong
    workspace agent mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`,
    `apiKey` và `env`.

### Chế độ xem `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi runtime hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là catalog được phép, bao gồm các model được phát hiện động cho các mục `provider/*`. Nếu không, phản hồi là toàn bộ catalog Gateway.
- `"configured"`: hành vi có kích thước phù hợp cho bộ chọn. Nếu `agents.defaults.models` được cấu hình, nó vẫn được ưu tiên, bao gồm khám phá theo phạm vi provider cho các mục `provider/*`. Khi không có danh sách cho phép, phản hồi dùng các mục `models.providers.*.models` rõ ràng, chỉ fallback về toàn bộ catalog khi không tồn tại hàng model đã cấu hình nào.
- `"all"`: toàn bộ catalog Gateway, bỏ qua `agents.defaults.models`. Dùng chế độ này cho chẩn đoán và UI khám phá, không phải các bộ chọn model thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, gateway phát quảng bá `exec.approval.requested`.
- Client vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu phạm vi `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/siêu dữ liệu phiên chuẩn). Các yêu cầu thiếu `systemRunPlan` bị từ chối.
- Sau khi phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ tái sử dụng
  `systemRunPlan` chuẩn đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi chỉnh sửa `command`, `rawCommand`, `cwd`, `agentId` hoặc
  `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` đã phê duyệt cuối cùng, gateway
  từ chối lượt chạy thay vì tin vào payload đã bị chỉnh sửa.

## Fallback phân phối agent

- Các yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối đi.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: các đích phân phối không phân giải được hoặc chỉ nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép fallback về thực thi chỉ trong phiên khi không thể phân giải tuyến có thể phân phối ra bên ngoài (ví dụ phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).
- Kết quả `agent` cuối cùng có thể bao gồm `result.deliveryStatus` khi đã yêu cầu phân phối,
  dùng cùng các trạng thái `sent`, `suppressed`, `partial_failed` và `failed`
  được ghi tài liệu cho [`openclaw agent --json --deliver`](/vi/cli/agent#json-delivery-status).

## Phiên bản hóa

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/version.ts`.
- Clients gửi `minProtocol` + `maxProtocol`; máy chủ từ chối các khoảng
  không bao gồm giao thức hiện tại của nó. Client native dùng giới hạn dưới v3 để
  các client v4 bổ sung vẫn có thể truy cập gateway v3.
- Schemas + models được tạo từ các định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số client

Client tham chiếu trong `src/gateway/client.ts` dùng các giá trị mặc định này. Các giá trị
ổn định trên protocol v4 và là baseline kỳ vọng cho client bên thứ ba.

| Hằng số                                  | Mặc định                                               | Nguồn                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Thời gian chờ yêu cầu (mỗi RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Thời gian chờ tiền xác thực / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (cấu hình/env có thể tăng ngân sách server/client ghép cặp) |
| Backoff kết nối lại ban đầu                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Giới hạn thử lại nhanh sau khi đóng do mã thông báo thiết bị | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Khoảng gia hạn force-stop trước `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Thời gian chờ mặc định của `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do hết thời gian tick                        | mã `4000` khi khoảng lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server quảng bá `policy.tickIntervalMs`, `policy.maxPayload`,
và `policy.maxBufferedBytes` hiệu dụng trong `hello-ok`; client nên tuân theo các giá trị đó
thay vì các mặc định trước bắt tay.

## Xác thực

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy theo chế độ xác thực đã cấu hình.
- Các chế độ mang định danh như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc
  `gateway.auth.mode: "trusted-proxy"` không phải loopback đáp ứng kiểm tra xác thực kết nối từ
  header yêu cầu thay vì `connect.params.auth.*`.
- `gateway.auth.mode: "none"` cho ingress riêng tư bỏ qua hoàn toàn xác thực kết nối bằng bí mật dùng chung;
  không để lộ chế độ đó trên ingress công khai/không tin cậy.
- Sau khi ghép cặp, Gateway cấp một **mã thông báo thiết bị** giới hạn theo
  vai trò + phạm vi kết nối. Nó được trả về trong `hello-ok.auth.deviceToken` và nên được
  client lưu giữ cho các lần kết nối sau.
- Client nên lưu giữ `hello-ok.auth.deviceToken` chính sau bất kỳ lần kết nối
  thành công nào.
- Kết nối lại bằng mã thông báo thiết bị **đã lưu** đó cũng nên tái sử dụng tập
  phạm vi đã phê duyệt được lưu cho mã thông báo đó. Điều này bảo toàn quyền truy cập đọc/thăm dò/trạng thái
  đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại thành một
  phạm vi ngầm định chỉ dành cho quản trị hẹp hơn.
- Tập hợp xác thực kết nối phía client (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: mã thông báo dùng chung tường minh trước,
    sau đó là `deviceToken` tường minh, rồi đến mã thông báo theo từng thiết bị đã lưu (khóa theo
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không có mục nào ở trên phân giải được
    `auth.token`. Một mã thông báo dùng chung hoặc bất kỳ mã thông báo thiết bị nào đã phân giải sẽ chặn nó.
  - Tự động nâng cấp một mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được cho phép với **endpoint tin cậy** —
    loopback, hoặc `wss://` có `tlsFingerprint` được ghim. `wss://` công khai
    không có ghim không đủ điều kiện.
- Các mục `hello-ok.auth.deviceTokens` bổ sung là mã thông báo bàn giao bootstrap.
  Chỉ lưu giữ chúng khi kết nối đã dùng xác thực bootstrap trên một transport tin cậy
  như `wss://` hoặc ghép cặp loopback/cục bộ.
- Nếu client cung cấp `deviceToken` **tường minh** hoặc `scopes` tường minh, tập
  phạm vi do bên gọi yêu cầu đó vẫn có thẩm quyền; phạm vi đã lưu trong cache chỉ
  được tái sử dụng khi client đang tái sử dụng mã thông báo theo từng thiết bị đã lưu.
- Có thể xoay vòng/thu hồi mã thông báo thiết bị qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`).
- `device.token.rotate` trả về siêu dữ liệu xoay vòng. Nó chỉ phản hồi lại mã thông báo
  bearer thay thế cho các lệnh gọi cùng thiết bị đã được xác thực bằng
  mã thông báo thiết bị đó, để các client chỉ dùng mã thông báo có thể lưu giữ mã thay thế trước khi
  kết nối lại. Các lần xoay vòng dùng shared/admin không phản hồi lại mã thông báo bearer.
- Việc cấp, xoay vòng và thu hồi mã thông báo luôn bị giới hạn trong tập vai trò đã phê duyệt
  được ghi trong mục ghép cặp của thiết bị đó; việc thay đổi mã thông báo không thể mở rộng hoặc
  nhắm tới một vai trò thiết bị mà phê duyệt ghép cặp chưa từng cấp.
- Với phiên mã thông báo thiết bị đã ghép cặp, quản lý thiết bị được tự giới hạn phạm vi trừ khi
  bên gọi cũng có `operator.admin`: bên gọi không phải quản trị chỉ có thể xóa/thu hồi/xoay vòng
  mục thiết bị **của chính họ**.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi mã thông báo operator
  mục tiêu so với phạm vi phiên hiện tại của bên gọi. Bên gọi không phải quản trị
  không thể xoay vòng hoặc thu hồi một mã thông báo operator rộng hơn phạm vi họ đang có.
- Lỗi xác thực bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi client đối với `AUTH_TOKEN_MISMATCH`:
  - Client tin cậy có thể thử lại một lần có giới hạn bằng mã thông báo theo từng thiết bị đã lưu trong cache.
  - Nếu lần thử lại đó thất bại, client nên dừng vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho operator.
- `AUTH_SCOPE_MISMATCH` nghĩa là mã thông báo thiết bị đã được nhận diện nhưng không bao phủ
  vai trò/phạm vi được yêu cầu. Client không nên trình bày lỗi này như một mã thông báo sai;
  hãy nhắc operator ghép cặp lại hoặc phê duyệt hợp đồng phạm vi hẹp/rộng hơn.

## Định danh thiết bị + ghép cặp

- Node nên bao gồm một định danh thiết bị ổn định (`device.id`) được dẫn xuất từ
  fingerprint của keypair.
- Gateway cấp mã thông báo theo thiết bị + vai trò.
- Cần phê duyệt ghép cặp cho ID thiết bị mới trừ khi bật tự động phê duyệt cục bộ.
- Tự động phê duyệt ghép cặp xoay quanh các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường tự kết nối hẹp, cục bộ với backend/container cho
  các luồng helper dùng bí mật dùng chung tin cậy.
- Các kết nối tailnet hoặc LAN cùng máy chủ vẫn được xem là từ xa cho mục đích ghép cặp và
  yêu cầu phê duyệt.
- Client WS thường bao gồm định danh `device` trong `connect` (operator +
  node). Các ngoại lệ operator không có thiết bị duy nhất là các đường tin cậy tường minh:
  - `gateway.controlUi.allowInsecureAuth=true` cho khả năng tương thích HTTP không an toàn chỉ trên localhost.
  - xác thực Control UI của operator bằng `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` direct-loopback được xác thực bằng
    mã thông báo/mật khẩu Gateway dùng chung.
- Tất cả kết nối phải ký nonce `connect.challenge` do server cung cấp.

### Chẩn đoán di chuyển xác thực thiết bị

Với các client cũ vẫn dùng hành vi ký trước challenge, `connect` hiện trả về
mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` cùng `error.details.reason` ổn định.

Các lỗi di chuyển thường gặp:

| Thông báo                     | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi rỗng).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client đã ký bằng nonce cũ/sai.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp payload v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp fingerprint của khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.         |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký payload v2 có bao gồm nonce của server.
- Gửi cùng nonce đó trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  ngoài các trường device/client/role/scopes/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng việc ghim siêu dữ liệu
  thiết bị đã ghép cặp vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Client có thể tùy chọn ghim fingerprint chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này phơi bày **toàn bộ API Gateway** (trạng thái, kênh, model, chat,
agent, phiên, node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi
schema TypeBox trong `src/gateway/protocol/schema.ts`.

## Liên quan

- [Giao thức bridge](/vi/gateway/bridge-protocol)
- [Runbook Gateway](/vi/gateway)
