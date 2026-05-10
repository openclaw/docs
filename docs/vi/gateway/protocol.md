---
read_when:
    - Triển khai hoặc cập nhật các ứng dụng khách WS của Gateway
    - Gỡ lỗi các điểm không khớp giao thức hoặc lỗi kết nối
    - Đang tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-05-10T19:36:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức Gateway WS là **mặt phẳng điều khiển duy nhất + lớp truyền tải node** cho
OpenClaw. Tất cả client (CLI, giao diện web, ứng dụng macOS, node iOS/Android,
node headless) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi** của
chúng tại thời điểm bắt tay.

## Truyền tải

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **phải** là một yêu cầu `connect`.
- Các khung trước khi kết nối bị giới hạn ở 64 KiB. Sau khi bắt tay thành công, client
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các khung đến quá cỡ và bộ đệm đi chậm sẽ phát sự kiện `payload.large`
  trước khi gateway đóng hoặc loại bỏ khung bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ lại phần thân thông điệp,
  nội dung tệp đính kèm, phần thân khung thô, token, cookie hoặc giá trị bí mật.

## Bắt tay (connect)

Gateway → Client (thử thách trước khi kết nối):

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
trong ngân sách kết nối tổng thể của chúng thay vì hiển thị nó như một lỗi
bắt tay kết thúc.

`server`, `features`, `snapshot` và `policy` đều được schema yêu cầu
(`src/gateway/protocol/schema/frames.ts`). `auth` cũng là bắt buộc và báo cáo
vai trò/phạm vi đã thương lượng. `pluginSurfaceUrls` là tùy chọn và ánh xạ tên bề mặt
Plugin, chẳng hạn như `canvas`, tới các URL được lưu trữ có phạm vi.

URL bề mặt Plugin có phạm vi có thể hết hạn. Node có thể gọi
`node.pluginSurface.refresh` với `{ "surface": "canvas" }` để nhận một mục mới
trong `pluginSurfaceUrls`. Tái cấu trúc Plugin Canvas thử nghiệm không
hỗ trợ đường dẫn tương thích đã ngừng dùng `canvasHostUrl`, `canvasCapability` hoặc
`node.canvas.capability.refresh`; client native và gateway hiện tại phải dùng bề mặt Plugin.

Khi không có token thiết bị nào được cấp, `hello-ok.auth` báo cáo các quyền
đã thương lượng mà không có trường token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Client backend cùng tiến trình đáng tin cậy (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên các kết nối loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu gateway dùng chung. Đường dẫn này được dành riêng
cho các RPC mặt phẳng điều khiển nội bộ và ngăn các baseline ghép cặp CLI/thiết bị cũ
chặn công việc backend cục bộ như cập nhật phiên subagent. Client từ xa,
client có nguồn gốc trình duyệt, client node và client token thiết bị/danh tính thiết bị
rõ ràng vẫn dùng các kiểm tra ghép cặp và nâng cấp phạm vi thông thường.

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

Trong quá trình bàn giao bootstrap đáng tin cậy, `hello-ok.auth` cũng có thể bao gồm các
mục vai trò bổ sung có giới hạn trong `deviceTokens`:

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

Đối với luồng bootstrap node/operator tích hợp sẵn, token node chính vẫn giữ
`scopes: []` và mọi token operator được bàn giao vẫn bị giới hạn theo allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kiểm tra phạm vi bootstrap vẫn
được tiền tố theo vai trò: các mục operator chỉ thỏa mãn yêu cầu operator, và các vai trò
không phải operator vẫn cần phạm vi dưới tiền tố vai trò riêng của chúng.

### Ví dụ về node

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

## Vai trò + phạm vi

Để xem mô hình phạm vi operator đầy đủ, các kiểm tra tại thời điểm phê duyệt và ngữ nghĩa
bí mật dùng chung, hãy xem [Phạm vi operator](/vi/gateway/operator-scopes).

### Vai trò

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

Các phương thức RPC gateway do Plugin đăng ký có thể yêu cầu phạm vi operator riêng,
nhưng các tiền tố quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi phương thức chỉ là cổng đầu tiên. Một số lệnh slash đi qua
`chat.send` áp dụng thêm các kiểm tra nghiêm ngặt hơn ở cấp lệnh. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có thêm một kiểm tra phạm vi tại thời điểm phê duyệt bên trên
phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có lệnh node không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Capability/lệnh/quyền (node)

Node khai báo các claim capability tại thời điểm kết nối:

- `caps`: các danh mục capability cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice` và `talk`.
- `commands`: allowlist lệnh để invoke.
- `permissions`: các toggle chi tiết (ví dụ `screen.record`, `camera.capture`).

Gateway xử lý các mục này như **claim** và thực thi allowlist phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị kết nối với cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Node đã kết nối báo cáo
  thời điểm kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; node đã ghép cặp cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện node đáng tin cậy cập nhật metadata ghép cặp của chúng.

### Sự kiện node còn sống trong nền

Node có thể gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một node đã ghép cặp
còn sống trong một lần đánh thức nền mà không đánh dấu nó là đã kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững cho các phiên thiết bị node đã xác thực;
phiên không có thiết bị hoặc chưa ghép cặp trả về `handled: false`.

Gateway thành công trả về một kết quả có cấu trúc:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway cũ hơn vẫn có thể trả về `{ "ok": true }` cho `node.event`; client nên xem đó là một
RPC đã được xác nhận, không phải là việc lưu bền vững hiện diện.

## Phạm vi sự kiện phát sóng

Các sự kiện phát sóng WebSocket do máy chủ đẩy được kiểm soát theo phạm vi để các phiên có phạm vi ghép cặp hoặc chỉ dành cho node không thụ động nhận nội dung phiên.

- **Khung chat, agent và kết quả công cụ** (bao gồm các sự kiện `agent` được stream và kết quả lệnh gọi công cụ) yêu cầu ít nhất `operator.read`. Phiên không có `operator.read` bỏ qua hoàn toàn các khung này.
- **Phát sóng `plugin.*` do Plugin định nghĩa** được kiểm soát theo `operator.write` hoặc `operator.admin`, tùy vào cách Plugin đăng ký chúng.
- **Sự kiện trạng thái và truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để tình trạng truyền tải vẫn có thể quan sát được với mọi phiên đã xác thực.
- **Họ sự kiện phát sóng không xác định** mặc định được kiểm soát theo phạm vi (fail-closed) trừ khi một handler đã đăng ký nới lỏng chúng một cách rõ ràng.

Mỗi kết nối client giữ số thứ tự riêng cho từng client để các phát sóng duy trì thứ tự đơn điệu trên socket đó ngay cả khi các client khác nhau thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là một bản dump được tạo ra — `hello-ok.features.methods` là một danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export
phương thức Plugin/kênh đã tải. Hãy xem nó là khám phá tính năng, không phải một
liệt kê đầy đủ của `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` trả về snapshot tình trạng gateway đã được cache hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi ổn định chẩn đoán có giới hạn gần đây. Nó giữ metadata vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và id phiên. Nó không giữ văn bản chat, phần thân webhook, đầu ra công cụ, phần thân yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Phạm vi đọc operator là bắt buộc.
    - `status` trả về tóm tắt gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho client operator có phạm vi admin.
    - `gateway.identity.get` trả về danh tính thiết bị gateway được dùng bởi các luồng relay và ghép cặp.
    - `system-presence` trả về snapshot hiện diện hiện tại cho các thiết bị operator/node đã kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/phát sóng ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện Heartbeat mới nhất đã được lưu bền vững.
    - `set-heartbeats` bật/tắt xử lý Heartbeat trên gateway.

  </Accordion>

  <Accordion title="Mô hình và cách sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Truyền `{ "view": "configured" }` để lấy các mô hình đã cấu hình có kích thước phù hợp cho bộ chọn (`agents.defaults.models` trước, rồi đến `models.providers.*.models`), hoặc `{ "view": "all" }` để lấy toàn bộ danh mục.
    - `usage.status` trả về các cửa sổ sử dụng của nhà cung cấp/tóm tắt hạn mức còn lại.
    - `usage.cost` trả về tóm tắt chi phí sử dụng đã tổng hợp cho một khoảng ngày.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của bộ nhớ vector / embedding được lưu trong bộ nhớ đệm cho workspace agent mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi rõ ràng muốn ping trực tiếp nhà cung cấp embedding.
    - `doctor.memory.remHarness` trả về bản xem trước REM harness có giới hạn, chỉ đọc cho các client control-plane từ xa. Nó có thể bao gồm đường dẫn workspace, đoạn trích bộ nhớ, markdown grounded đã kết xuất, và các ứng viên quảng bá sâu, vì vậy bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt sử dụng theo từng phiên.
    - `sessions.usage.timeseries` trả về dữ liệu sử dụng dạng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trợ giúp đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/Plugin tích hợp sẵn + đi kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh đó hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có hỗ trợ QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một APNs push thử nghiệm đến một iOS node đã đăng ký.
    - `voicewake.get` trả về các trình kích hoạt wake-word đã lưu.
    - `voicewake.set` cập nhật các trình kích hoạt wake-word và phát thông báo thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi trực tiếp ra ngoài cho các lần gửi nhắm tới kênh/tài khoản/luồng bên ngoài chat runner.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với các điều khiển con trỏ/giới hạn và số byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.catalog` trả về danh mục nhà cung cấp Talk chỉ đọc cho giọng nói, phiên âm phát trực tuyến, và thoại thời gian thực. Nó bao gồm id nhà cung cấp, nhãn, trạng thái đã cấu hình, id mô hình/giọng nói được công khai, chế độ chuẩn, transport, chiến lược brain, và cờ âm thanh/khả năng thời gian thực mà không trả về bí mật của nhà cung cấp hoặc thay đổi cấu hình toàn cục.
    - `talk.config` trả về payload cấu hình Talk có hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.session.create` tạo một phiên Talk do Gateway sở hữu cho `realtime/gateway-relay`, `transcription/gateway-relay`, hoặc `stt-tts/managed-room`. `brain: "direct-tools"` yêu cầu `operator.admin`.
    - `talk.session.join` xác thực token phiên managed-room, phát các sự kiện `session.ready` hoặc `session.replaced` khi cần, và trả về siêu dữ liệu phòng/phiên cùng các sự kiện Talk gần đây mà không có token dạng văn bản thuần hoặc hash token đã lưu.
    - `talk.session.appendAudio` nối thêm âm thanh đầu vào PCM base64 vào các phiên realtime relay và transcription do Gateway sở hữu.
    - `talk.session.startTurn`, `talk.session.endTurn`, và `talk.session.cancelTurn` điều khiển vòng đời lượt managed-room với cơ chế từ chối lượt cũ trước khi trạng thái bị xóa.
    - `talk.session.cancelOutput` dừng đầu ra âm thanh của trợ lý, chủ yếu cho barge-in được chặn bằng VAD trong các phiên Gateway relay.
    - `talk.session.submitToolResult` hoàn tất một lệnh gọi công cụ của nhà cung cấp do một phiên realtime relay do Gateway sở hữu phát ra. Truyền `options: { willContinue: true }` cho đầu ra công cụ tạm thời khi sẽ có kết quả cuối cùng theo sau, hoặc `options: { suppressResponse: true }` khi kết quả công cụ cần thỏa mãn lệnh gọi của nhà cung cấp mà không bắt đầu một phản hồi trợ lý realtime khác.
    - `talk.session.close` đóng một phiên relay, transcription, hoặc managed-room do Gateway sở hữu và phát các sự kiện Talk kết thúc.
    - `talk.mode` đặt/phát trạng thái chế độ Talk hiện tại cho các client WebChat/Control UI.
    - `talk.client.create` tạo một phiên nhà cung cấp realtime do client sở hữu bằng `webrtc` hoặc `provider-websocket` trong khi Gateway sở hữu cấu hình, thông tin xác thực, hướng dẫn, và chính sách công cụ.
    - `talk.client.toolCall` cho phép các transport realtime do client sở hữu chuyển tiếp lệnh gọi công cụ của nhà cung cấp tới chính sách Gateway. Công cụ được hỗ trợ đầu tiên là `openclaw_agent_consult`; client nhận một run id và chờ các sự kiện vòng đời chat bình thường trước khi gửi kết quả công cụ đặc thù theo nhà cung cấp.
    - `talk.event` là kênh sự kiện Talk duy nhất cho realtime, transcription, STT/TTS, managed-room, telephony, và các adapter cuộc họp.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp dự phòng, và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về danh sách nhà cung cấp TTS hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật, và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRefs đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật nhắm tới lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về ảnh chụp cấu hình hiện tại và hash.
    - `config.set` ghi một payload cấu hình đã được xác thực.
    - `config.patch` hợp nhất một cập nhật cấu hình một phần.
    - `config.apply` xác thực + thay thế toàn bộ payload cấu hình.
    - `config.schema` trả về payload schema cấu hình trực tiếp được Control UI và công cụ CLI sử dụng: schema, `uiHints`, phiên bản, và siêu dữ liệu tạo, bao gồm siêu dữ liệu schema Plugin + kênh khi runtime có thể tải được. Schema bao gồm siêu dữ liệu trường `title` / `description` lấy từ cùng nhãn và văn bản trợ giúp được UI sử dụng, bao gồm các nhánh thành phần đối tượng lồng nhau, wildcard, phần tử mảng, và `anyOf` / `oneOf` / `allOf` khi có tài liệu trường phù hợp.
    - `config.schema.lookup` trả về một payload tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một nút schema nông, gợi ý khớp + `hintPath`, và tóm tắt con trực tiếp để UI/CLI đi sâu. Các nút schema tra cứu giữ lại tài liệu hướng tới người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, cùng `hint` / `hintPath` đã khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi bản cập nhật tự nó thành công; các bên gọi có phiên có thể bao gồm `continuationMessage` để quá trình khởi động tiếp tục một lượt agent theo dõi thông qua hàng đợi tiếp tục sau khởi động lại. Cập nhật qua trình quản lý gói buộc khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi gói để tiến trình Gateway cũ không tiếp tục lazy-load từ cây `dist` đã được thay thế.
    - `update.status` trả về sentinel khởi động lại cập nhật được lưu trong bộ nhớ đệm mới nhất, bao gồm phiên bản đang chạy sau khởi động lại khi có.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` công khai trình hướng dẫn onboarding qua WS RPC.

  </Accordion>

  <Accordion title="Trợ giúp agent và workspace">
    - `agents.list` trả về các mục agent đã cấu hình, bao gồm mô hình có hiệu lực và siêu dữ liệu runtime.
    - `agents.create`, `agents.update`, và `agents.delete` quản lý bản ghi agent và liên kết workspace.
    - `agents.files.list`, `agents.files.get`, và `agents.files.set` quản lý các tệp workspace bootstrap được công khai cho một agent.
    - `tasks.list`, `tasks.get`, và `tasks.cancel` công khai sổ cái tác vụ Gateway cho SDK và các client operator.
    - `artifacts.list`, `artifacts.get`, và `artifacts.download` công khai tóm tắt artifact bắt nguồn từ bản chép phiên và các bản tải xuống cho phạm vi `sessionKey`, `runId`, hoặc `taskId` rõ ràng. Truy vấn run và tác vụ phân giải phiên sở hữu ở phía server và chỉ trả về phương tiện bản chép phiên có nguồn gốc phù hợp; nguồn URL không an toàn hoặc cục bộ trả về bản tải xuống không được hỗ trợ thay vì fetch ở phía server.
    - `environments.list` và `environments.status` công khai phát hiện môi trường Gateway cục bộ và node chỉ đọc cho các client SDK.
    - `agent.identity.get` trả về danh tính trợ lý có hiệu lực cho một agent hoặc phiên.
    - `agent.wait` chờ một run hoàn tất và trả về snapshot kết thúc khi có.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` theo từng hàng khi backend runtime agent được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho client WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện bản chép phiên/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước bản chép phiên có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một đích phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào một phiên hiện có.
    - `sessions.steer` là biến thể ngắt-và-điều hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` cùng `runId` tùy chọn, hoặc chỉ truyền `runId` cho các run đang hoạt động mà Gateway có thể phân giải thành một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/ghi đè phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` có hiệu lực.
    - `sessions.reset`, `sessions.delete`, và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu.
    - Thực thi chat vẫn dùng `chat.history`, `chat.send`, `chat.abort`, và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho các client UI: các thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, các payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn) và các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ sẽ bị loại bỏ, các hàng trợ lý chỉ có token im lặng như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.

  </Accordion>

  <Accordion title="Ghép đôi thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép đôi đang chờ và đã phê duyệt.
    - `device.pair.approve`, `device.pair.reject`, và `device.pair.remove` quản lý các bản ghi ghép đôi thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi của nó.
    - `device.token.revoke` thu hồi token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi của nó.

  </Accordion>

  <Accordion title="Ghép đôi node, invoke, và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, và `node.pair.verify` bao quát ghép đôi node và xác minh bootstrap.
    - `node.list` và `node.describe` trả về trạng thái node đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn node đã ghép đôi.
    - `node.invoke` chuyển tiếp một lệnh tới node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu invoke.
    - `node.event` mang các sự kiện bắt nguồn từ node trở lại Gateway.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các node ngoại tuyến/ngắt kết nối.

  </Accordion>

  <Accordion title="Nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, và `exec.approval.resolve` bao quát các yêu cầu phê duyệt exec một lần cùng với việc tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý các snapshot chính sách phê duyệt exec của gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ trên node thông qua các lệnh relay của node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, và `plugin.approval.resolve` bao quát các luồng phê duyệt do plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc ở heartbeat tiếp theo; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: các cập nhật trò chuyện UI như `chat.inject` và các sự kiện trò chuyện
  chỉ dành cho bản ghi khác.
- `session.message` và `session.tool`: các cập nhật bản ghi/luồng sự kiện cho một
  phiên đã đăng ký theo dõi.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: các cập nhật snapshot hiện diện của hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: cập nhật snapshot tình trạng gateway.
- `heartbeat`: cập nhật luồng sự kiện heartbeat.
- `cron`: sự kiện thay đổi lần chạy/tác vụ cron.
- `shutdown`: thông báo tắt gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép cặp node.
- `node.invoke.request`: phát broadcast yêu cầu gọi node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép cặp.
- `voicewake.changed`: cấu hình trình kích hoạt wake-word đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt plugin.

### Phương thức trợ giúp node

- Node có thể gọi `skills.bins` để lấy danh sách hiện tại các tệp thực thi skill
  cho các bước kiểm tra tự động cho phép.

### RPC sổ cái tác vụ

Các client vận hành có thể kiểm tra và hủy bản ghi tác vụ nền của Gateway thông qua
các RPC sổ cái tác vụ. Những phương thức này trả về bản tóm tắt tác vụ đã được làm sạch, không phải
trạng thái runtime thô.

- `tasks.list` yêu cầu `operator.read`.
  - Tham số: `status` tùy chọn (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, hoặc `"timed_out"`) hoặc một mảng các trạng thái đó,
    `agentId` tùy chọn, `sessionKey` tùy chọn, `limit` tùy chọn từ `1` đến
    `500`, và chuỗi `cursor` tùy chọn.
  - Kết quả: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` yêu cầu `operator.read`.
  - Tham số: `{ "taskId": string }`.
  - Kết quả: `{ "task": TaskSummary }`.
  - Id tác vụ bị thiếu trả về dạng lỗi không tìm thấy của Gateway.
- `tasks.cancel` yêu cầu `operator.write`.
  - Tham số: `{ "taskId": string, "reason"?: string }`.
  - Kết quả:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` cho biết sổ cái có tác vụ khớp hay không. `cancelled`
    cho biết runtime đã chấp nhận hoặc ghi nhận việc hủy hay chưa.

`TaskSummary` bao gồm `id`, `status`, và siêu dữ liệu tùy chọn như `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, dấu thời gian, tiến độ,
tóm tắt kết thúc, và văn bản lỗi đã được làm sạch.

### Các phương thức trợ giúp cho người vận hành

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh runtime
  cho một tác tử.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc tác tử mặc định.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm tới:
    - `text` trả về mã thông báo lệnh văn bản chính không có dấu `/` ở đầu
    - `native` và đường dẫn `both` mặc định trả về tên native nhận biết nhà cung cấp
      khi có sẵn
  - `textAliases` mang các bí danh dấu gạch chéo chính xác như `/model` và `/m`.
  - `nativeName` mang tên lệnh native nhận biết nhà cung cấp khi có.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cùng tính khả dụng của lệnh Plugin
    native.
  - `includeArgs=false` bỏ qua siêu dữ liệu đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy danh mục công cụ runtime cho một
  tác tử. Phản hồi bao gồm các công cụ được nhóm và siêu dữ liệu nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu Plugin khi `source="plugin"`
  - `optional`: công cụ Plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực runtime
  cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh runtime đáng tin cậy từ phiên ở phía máy chủ thay vì chấp nhận
    xác thực hoặc ngữ cảnh phân phối do bên gọi cung cấp.
  - Phản hồi được giới hạn theo phiên và phản ánh những gì cuộc hội thoại đang hoạt động có thể dùng ngay bây giờ,
    bao gồm công cụ lõi, Plugin và kênh.
- Người vận hành có thể gọi `tools.invoke` (`operator.write`) để gọi một công cụ có sẵn thông qua
  cùng đường dẫn chính sách Gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm`, và
    `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều có mặt, tác tử phiên được phân giải phải khớp với
    `agentId`.
  - Phản hồi là một phong bì hướng SDK với các trường `ok`, `toolName`, `output` tùy chọn, và
    `error` có kiểu. Việc phê duyệt hoặc từ chối theo chính sách trả về `ok:false` trong payload thay vì
    bỏ qua pipeline chính sách công cụ của Gateway.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy danh mục
  kỹ năng hiển thị cho một tác tử.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc tác tử mặc định.
  - Phản hồi bao gồm điều kiện đủ, yêu cầu còn thiếu, kiểm tra cấu hình, và
    tùy chọn cài đặt đã được khử nhạy cảm mà không lộ giá trị bí mật thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) cho
  siêu dữ liệu khám phá ClawHub.
- Người vận hành có thể gọi `skills.upload.begin`, `skills.upload.chunk`, và
  `skills.upload.commit` (`operator.admin`) để chuẩn bị một kho lưu trữ kỹ năng riêng tư
  trước khi cài đặt. Đây là đường dẫn tải lên quản trị riêng cho các máy khách đáng tin cậy,
  không phải luồng cài đặt kỹ năng ClawHub thông thường, và bị tắt theo mặc định trừ khi
  `skills.install.allowUploadedArchives` được bật.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tạo một lượt tải lên được ràng buộc với slug và giá trị force đó.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` nối thêm byte tại
    độ lệch đã giải mã chính xác.
  - `skills.upload.commit({ uploadId, sha256? })` xác minh kích thước cuối cùng và
    SHA-256. Commit chỉ hoàn tất lượt tải lên; nó không cài đặt kỹ năng.
  - Kho lưu trữ kỹ năng đã tải lên là các kho lưu trữ zip chứa gốc `SKILL.md`.
    Tên thư mục nội bộ của kho lưu trữ không bao giờ chọn đích cài đặt.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở ba chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một
    thư mục kỹ năng vào thư mục `skills/` trong không gian làm việc tác tử mặc định.
  - Chế độ tải lên: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    cài đặt một lượt tải lên đã commit vào thư mục `skills/<slug>`
    trong không gian làm việc tác tử mặc định. Slug và giá trị force phải khớp với yêu cầu
    `skills.upload.begin` ban đầu. Chế độ này bị từ chối trừ khi
    `skills.install.allowUploadedArchives` được bật. Thiết lập này không
    ảnh hưởng đến các lượt cài đặt ClawHub.
  - Chế độ trình cài đặt Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    chạy một hành động `metadata.openclaw.install` đã khai báo trên máy chủ Gateway.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả lượt cài đặt ClawHub được theo dõi trong
    không gian làm việc tác tử mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`,
    `apiKey`, và `env`.

### Các dạng xem `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi runtime hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là danh mục được cho phép, bao gồm các mô hình được khám phá động cho các mục `provider/*`. Nếu không, phản hồi là toàn bộ danh mục Gateway.
- `"configured"`: hành vi có kích thước phù hợp cho bộ chọn. Nếu `agents.defaults.models` được cấu hình, nó vẫn được ưu tiên, bao gồm khám phá theo phạm vi nhà cung cấp cho các mục `provider/*`. Khi không có danh sách cho phép, phản hồi dùng các mục `models.providers.*.models` tường minh, chỉ rơi về toàn bộ danh mục khi không tồn tại hàng mô hình đã cấu hình nào.
- `"all"`: toàn bộ danh mục Gateway, bỏ qua `agents.defaults.models`. Dùng dạng này cho chẩn đoán và giao diện khám phá, không dùng cho bộ chọn mô hình thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, Gateway phát `exec.approval.requested`.
- Máy khách người vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu phạm vi `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/siêu dữ liệu phiên chuẩn). Các yêu cầu thiếu `systemRunPlan` bị từ chối.
- Sau khi phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ dùng lại
  `systemRunPlan` chuẩn đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi sửa đổi `command`, `rawCommand`, `cwd`, `agentId`, hoặc
  `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` cuối cùng đã được phê duyệt, Gateway
  từ chối lần chạy thay vì tin payload đã bị sửa đổi.

## Dự phòng phân phối tác tử

- Yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối đi.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: các đích phân phối không phân giải được hoặc chỉ nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép rơi về thực thi chỉ trong phiên khi không thể phân giải tuyến có thể phân phối bên ngoài nào (ví dụ phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).
- Kết quả `agent` cuối cùng có thể bao gồm `result.deliveryStatus` khi đã yêu cầu phân phối,
  dùng cùng các trạng thái `sent`, `suppressed`, `partial_failed`, và `failed`
  được ghi lại cho [`openclaw agent --json --deliver`](/vi/cli/agent#json-delivery-status).

## Quản lý phiên bản

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/version.ts`.
- Máy khách gửi `minProtocol` + `maxProtocol`; máy chủ từ chối khi không khớp.
- Schema + mô hình được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số máy khách

Máy khách tham chiếu trong `src/gateway/client.ts` dùng các mặc định này. Các giá trị
ổn định trên protocol v4 và là baseline dự kiến cho máy khách bên thứ ba.

| Hằng số                                  | Mặc định                                               | Nguồn                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Thời gian chờ yêu cầu (mỗi RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Thời gian chờ xác thực trước / thử thách kết nối       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (cấu hình/env có thể tăng ngân sách máy chủ/máy khách đi kèm) |
| Độ trễ thử kết nối lại ban đầu                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Độ trễ thử kết nối lại tối đa                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Giới hạn thử lại nhanh sau khi đóng do mã thông báo thiết bị | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Thời gian chờ gia hạn buộc dừng trước `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Thời gian chờ mặc định của `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do hết thời gian chờ tick                        | mã `4000` khi im lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Máy chủ quảng bá `policy.tickIntervalMs`, `policy.maxPayload`,
và `policy.maxBufferedBytes` hiệu dụng trong `hello-ok`; máy khách nên tuân theo các giá trị đó
thay vì các mặc định trước bắt tay.

## Xác thực

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy thuộc vào chế độ xác thực được cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc non-loopback
  `gateway.auth.mode: "trusted-proxy"` đáp ứng kiểm tra xác thực kết nối từ
  tiêu đề yêu cầu thay vì `connect.params.auth.*`.
- `gateway.auth.mode: "none"` cho ingress riêng tư bỏ qua hoàn toàn xác thực kết nối
  bằng bí mật dùng chung; không để lộ chế độ đó trên ingress công khai/không đáng tin cậy.
- Sau khi ghép nối, Gateway phát hành một **mã thông báo thiết bị** theo phạm vi vai trò
  kết nối + phạm vi quyền. Nó được trả về trong `hello-ok.auth.deviceToken` và nên được
  máy khách lưu bền vững cho các lần kết nối sau.
- Máy khách nên lưu bền vững `hello-ok.auth.deviceToken` chính sau bất kỳ
  lần kết nối thành công nào.
- Kết nối lại bằng mã thông báo thiết bị **đã lưu** đó cũng nên tái sử dụng tập phạm vi
  đã phê duyệt được lưu cho mã thông báo đó. Điều này giữ quyền truy cập đọc/thăm dò/trạng thái
  đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại thành phạm vi ngầm định
  chỉ dành cho quản trị viên hẹp hơn.
- Lắp ráp xác thực kết nối phía máy khách (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: mã thông báo dùng chung tường minh trước,
    sau đó là `deviceToken` tường minh, rồi đến mã thông báo theo thiết bị đã lưu (khóa theo
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được
    `auth.token`. Mã thông báo dùng chung hoặc bất kỳ mã thông báo thiết bị nào được phân giải đều chặn nó.
  - Tự động nâng cấp mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được mở cho **điểm cuối đáng tin cậy** —
    loopback, hoặc `wss://` với `tlsFingerprint` đã ghim. `wss://` công khai
    không ghim không đủ điều kiện.
- Các mục `hello-ok.auth.deviceTokens` bổ sung là mã thông báo bàn giao bootstrap.
  Chỉ lưu bền vững chúng khi kết nối dùng xác thực bootstrap trên phương tiện truyền đáng tin cậy
  như `wss://` hoặc ghép nối loopback/cục bộ.
- Nếu máy khách cung cấp `deviceToken` **tường minh** hoặc `scopes` tường minh, tập phạm vi
  do bên gọi yêu cầu đó vẫn là nguồn có thẩm quyền; phạm vi đã lưu trong bộ nhớ đệm chỉ
  được tái sử dụng khi máy khách đang tái sử dụng mã thông báo theo thiết bị đã lưu.
- Có thể xoay vòng/thu hồi mã thông báo thiết bị qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`).
- `device.token.rotate` trả về siêu dữ liệu xoay vòng. Nó chỉ phản hồi lại mã thông báo
  bearer thay thế cho các lệnh gọi cùng thiết bị đã được xác thực bằng
  mã thông báo thiết bị đó, để máy khách chỉ dùng mã thông báo có thể lưu bền vững bản thay thế
  trước khi kết nối lại. Các lần xoay vòng dùng chung/quản trị viên không phản hồi mã thông báo bearer.
- Việc phát hành, xoay vòng và thu hồi mã thông báo luôn bị giới hạn trong tập vai trò đã phê duyệt
  được ghi trong mục ghép nối của thiết bị đó; thao tác thay đổi mã thông báo không thể mở rộng hoặc
  nhắm tới vai trò thiết bị mà phê duyệt ghép nối chưa từng cấp.
- Với phiên mã thông báo thiết bị đã ghép nối, quản lý thiết bị được tự giới hạn phạm vi trừ khi
  bên gọi cũng có `operator.admin`: bên gọi không phải quản trị viên chỉ có thể xóa/thu hồi/xoay vòng
  mục thiết bị **của chính họ**.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi mã thông báo operator
  mục tiêu với phạm vi phiên hiện tại của bên gọi. Bên gọi không phải quản trị viên
  không thể xoay vòng hoặc thu hồi mã thông báo operator rộng hơn mã họ đang có.
- Lỗi xác thực bao gồm `error.details.code` cùng các gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi máy khách cho `AUTH_TOKEN_MISMATCH`:
  - Máy khách đáng tin cậy có thể thử một lần thử lại có giới hạn bằng mã thông báo theo thiết bị đã lưu trong bộ nhớ đệm.
  - Nếu lần thử lại đó thất bại, máy khách nên dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho người vận hành.

## Danh tính thiết bị + ghép nối

- Node nên bao gồm một danh tính thiết bị ổn định (`device.id`) bắt nguồn từ
  dấu vân tay cặp khóa.
- Gateway phát hành mã thông báo theo thiết bị + vai trò.
- Phê duyệt ghép nối là bắt buộc cho ID thiết bị mới trừ khi bật tự động phê duyệt cục bộ.
- Tự động phê duyệt ghép nối xoay quanh các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường tự kết nối hẹp trong backend/container-cục bộ cho
  các luồng trợ giúp bí mật dùng chung đáng tin cậy.
- Các kết nối tailnet hoặc LAN cùng máy chủ vẫn được xem là từ xa cho ghép nối và
  yêu cầu phê duyệt.
- Máy khách WS thường bao gồm danh tính `device` trong khi `connect` (operator +
  node). Các ngoại lệ operator không có thiết bị duy nhất là các đường tin cậy tường minh:
  - `gateway.controlUi.allowInsecureAuth=true` cho tương thích HTTP không an toàn chỉ trên localhost.
  - xác thực Control UI operator `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (phá kính khẩn cấp, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` direct-loopback được xác thực bằng mã thông báo/mật khẩu
    Gateway dùng chung.
- Mọi kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di chuyển xác thực thiết bị

Với máy khách cũ vẫn dùng hành vi ký trước thử thách, `connect` giờ trả về
mã chi tiết `DEVICE_AUTH_*` dưới `error.details.code` cùng `error.details.reason` ổn định.

Các lỗi di chuyển thường gặp:

| Thông báo                     | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Máy khách bỏ qua `device.nonce` (hoặc gửi trống).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Máy khách đã ký bằng nonce cũ/sai.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Tải ký không khớp với tải v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp dấu vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.         |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký tải v2 bao gồm nonce của máy chủ.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Tải ký ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  bên cạnh các trường device/client/role/scopes/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng ghim siêu dữ liệu
  thiết bị đã ghép nối vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Máy khách có thể tùy chọn ghim dấu vân tay chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này cung cấp **toàn bộ API Gateway** (trạng thái, kênh, mô hình, chat,
agent, phiên, node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi
các schema TypeBox trong `src/gateway/protocol/schema.ts`.

## Liên quan

- [Giao thức cầu nối](/vi/gateway/bridge-protocol)
- [Runbook Gateway](/vi/gateway)
