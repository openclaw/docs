---
read_when:
    - Triển khai hoặc cập nhật ứng dụng khách WS Gateway
    - Gỡ lỗi không khớp giao thức hoặc lỗi kết nối
    - Đang tái tạo schema/mô hình giao thức
summary: 'Giao thức WebSocket Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-07-04T18:06:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức Gateway WS là **mặt phẳng điều khiển + kênh vận chuyển nút duy nhất** cho
OpenClaw. Tất cả máy khách (CLI, giao diện web, ứng dụng macOS, nút iOS/Android, nút
headless) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi** của mình tại
thời điểm bắt tay.

## Vận chuyển

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **phải** là một yêu cầu `connect`.
- Các khung trước khi kết nối bị giới hạn ở 64 KiB. Sau khi bắt tay thành công, máy khách
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các khung đầu vào quá lớn và bộ đệm đầu ra chậm sẽ phát sự kiện `payload.large`
  trước khi gateway đóng hoặc bỏ khung bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ lại phần thân thông điệp,
  nội dung tệp đính kèm, phần thân khung thô, token, cookie hoặc giá trị bí mật.

## Bắt tay (connect)

Gateway → Máy khách (thử thách trước kết nối):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Máy khách → Gateway:

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

Gateway → Máy khách:

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
`"startup-sidecars"` và `retryAfterMs`. Máy khách nên thử lại phản hồi đó
trong ngân sách kết nối tổng thể thay vì hiển thị nó như một lỗi bắt tay
cuối cùng.

`server`, `features`, `snapshot` và `policy` đều được schema yêu cầu
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` cũng là bắt buộc và báo cáo
vai trò/phạm vi đã được thương lượng. `pluginSurfaceUrls` là tùy chọn và ánh xạ tên bề mặt plugin,
chẳng hạn như `canvas`, tới các URL được lưu trữ theo phạm vi.

URL bề mặt plugin theo phạm vi có thể hết hạn. Nút có thể gọi
`node.pluginSurface.refresh` với `{ "surface": "canvas" }` để nhận một mục mới
trong `pluginSurfaceUrls`. Bản tái cấu trúc Plugin Canvas thử nghiệm không
hỗ trợ đường dẫn tương thích `canvasHostUrl`, `canvasCapability` hoặc
`node.canvas.capability.refresh` đã bị loại bỏ; các máy khách native và
gateway hiện tại phải dùng bề mặt plugin.

Khi không phát hành token thiết bị, `hello-ok.auth` báo cáo các quyền đã được thương lượng
mà không có trường token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Các máy khách backend cùng tiến trình đáng tin cậy (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên kết nối local loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu gateway dùng chung. Đường dẫn này được dành riêng
cho các RPC mặt phẳng điều khiển nội bộ và tránh để các baseline ghép đôi CLI/thiết bị cũ
chặn công việc backend cục bộ như cập nhật phiên subagent. Máy khách từ xa,
máy khách nguồn trình duyệt, máy khách nút và các máy khách token thiết bị/danh tính thiết bị
rõ ràng vẫn dùng các kiểm tra ghép đôi và nâng cấp phạm vi thông thường.

Khi token thiết bị được phát hành, `hello-ok` cũng bao gồm:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Bootstrap mã QR/mã thiết lập tích hợp là một đường dẫn bàn giao di động mới. Một kết nối
mã thiết lập baseline thành công trả về một token nút chính cộng với một
token operator có giới hạn:

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

Bàn giao operator được giới hạn có chủ ý để onboarding QR có thể khởi động
vòng lặp operator di động và hoàn tất thiết lập native mà không cấp phạm vi
đột biến ghép đôi hoặc `operator.admin`. Nó bao gồm `operator.talk.secrets` để
máy khách native có thể đọc cấu hình Talk cần thiết sau bootstrap. Quyền
ghép đôi và truy cập quản trị rộng hơn yêu cầu một luồng ghép đôi operator hoặc token
được phê duyệt riêng. Máy khách chỉ nên lưu bền vững
`hello-ok.auth.deviceTokens`
khi kết nối dùng xác thực bootstrap trên kênh vận chuyển đáng tin cậy như `wss://` hoặc
ghép đôi loopback/cục bộ.

### Ví dụ nút

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

Các phương thức có tác dụng phụ yêu cầu **khóa idempotency** (xem schema).

## Vai trò + phạm vi

Để biết đầy đủ mô hình phạm vi operator, các kiểm tra tại thời điểm phê duyệt và
ngữ nghĩa shared-secret, xem [Phạm vi operator](/vi/gateway/operator-scopes).

### Vai trò

- `operator` = máy khách mặt phẳng điều khiển (CLI/UI/tự động hóa).
- `node` = máy chủ năng lực (camera/screen/canvas/system.run).

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
Khi bao gồm bí mật, máy khách nên đọc thông tin xác thực nhà cung cấp Talk đang hoạt động
từ `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
giữ nguyên hình dạng nguồn và có thể là đối tượng SecretRef hoặc chuỗi đã được che.

Các phương thức RPC gateway do plugin đăng ký có thể yêu cầu phạm vi operator riêng, nhưng
các tiền tố quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi phương thức chỉ là cổng đầu tiên. Một số lệnh slash được truy cập qua
`chat.send` áp dụng các kiểm tra cấp lệnh nghiêm ngặt hơn ở phía trên. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có một kiểm tra phạm vi bổ sung tại thời điểm phê duyệt bên trên
phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có lệnh nút không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Năng lực/lệnh/quyền (nút)

Nút khai báo các tuyên bố năng lực tại thời điểm kết nối:

- `caps`: các danh mục năng lực cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice` và `talk`.
- `commands`: danh sách lệnh được phép để invoke.
- `permissions`: bật/tắt chi tiết (ví dụ `screen.record`, `camera.capture`).

Gateway coi những giá trị này là **tuyên bố** và thực thi danh sách cho phép phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi nó kết nối với cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Nút đã kết nối báo cáo
  thời gian kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; nút đã ghép đôi cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện nút đáng tin cậy cập nhật metadata ghép đôi của chúng.

### Sự kiện nút còn sống trong nền

Nút có thể gọi `node.event` với `event: "node.presence.alive"` để ghi lại rằng một nút đã ghép đôi đã
còn sống trong một lần đánh thức nền mà không đánh dấu nó là đã kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Các chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững đối với phiên thiết bị nút đã xác thực;
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

Gateway cũ hơn vẫn có thể trả về `{ "ok": true }` cho `node.event`; máy khách nên coi đó là một
RPC đã được xác nhận, không phải là việc lưu bền vững hiện diện.

## Phạm vi hóa sự kiện broadcast

Các sự kiện broadcast WebSocket do máy chủ đẩy được chặn theo phạm vi để các phiên chỉ dành cho ghép đôi hoặc chỉ dành cho nút không thụ động nhận nội dung phiên.

- **Khung chat, agent và kết quả công cụ** (bao gồm sự kiện `agent` được stream và kết quả gọi công cụ) yêu cầu ít nhất `operator.read`. Các phiên không có `operator.read` bỏ qua hoàn toàn những khung này.
- **Broadcast `plugin.*` do Plugin định nghĩa** được chặn ở `operator.write` hoặc `operator.admin`, tùy theo cách Plugin đăng ký chúng.
- **Sự kiện trạng thái và vận chuyển** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để mọi phiên đã xác thực đều quan sát được tình trạng vận chuyển.
- **Các họ sự kiện broadcast không xác định** mặc định bị chặn theo phạm vi (fail-closed) trừ khi một handler đã đăng ký nới lỏng chúng rõ ràng.

Mỗi kết nối máy khách giữ số thứ tự riêng theo máy khách để broadcast duy trì thứ tự đơn điệu trên socket đó ngay cả khi các máy khách khác nhau thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export phương thức
plugin/kênh đã tải. Hãy coi nó là khám phá tính năng, không phải bản liệt kê đầy đủ
của `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về ảnh chụp nhanh tình trạng Gateway đã lưu trong bộ nhớ đệm hoặc vừa thăm dò.
    - `diagnostics.stability` trả về bộ ghi ổn định chẩn đoán có giới hạn gần đây. Nó giữ siêu dữ liệu vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và ID phiên. Nó không giữ văn bản trò chuyện, nội dung Webhook, đầu ra công cụ, nội dung yêu cầu hoặc phản hồi thô, token, cookie, hoặc giá trị bí mật. Cần phạm vi đọc của người vận hành.
    - `status` trả về bản tóm tắt Gateway kiểu `/status`; các trường nhạy cảm chỉ được đưa vào cho máy khách người vận hành có phạm vi quản trị.
    - `gateway.identity.get` trả về danh tính thiết bị Gateway được dùng bởi các luồng chuyển tiếp và ghép nối.
    - `system-presence` trả về ảnh chụp nhanh hiện diện hiện tại cho các thiết bị người vận hành/Node đã kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/phát ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện Heartbeat đã lưu mới nhất.
    - `set-heartbeats` bật/tắt xử lý Heartbeat trên Gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Truyền `{ "view": "configured" }` cho các mô hình đã cấu hình có kích thước phù hợp bộ chọn (`agents.defaults.models` trước, rồi `models.providers.*.models`), hoặc `{ "view": "all" }` cho danh mục đầy đủ.
    - `usage.status` trả về các cửa sổ sử dụng của nhà cung cấp/tóm tắt hạn mức còn lại.
    - `usage.cost` trả về tóm tắt mức sử dụng chi phí tổng hợp cho một khoảng ngày.
      Truyền `agentId` cho một tác nhân, hoặc `agentScope: "all"` để tổng hợp các tác nhân đã cấu hình.
    - `doctor.memory.status` trả về mức sẵn sàng của vector-memory / embedding đã lưu trong bộ nhớ đệm cho không gian làm việc tác nhân mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi muốn rõ ràng một lần ping nhà cung cấp embedding trực tiếp. Các máy khách nhận biết Dreaming cũng có thể truyền `{ "agentId": "agent-id" }` để giới hạn thống kê kho Dreaming vào một không gian làm việc tác nhân đã chọn; bỏ qua `agentId` giữ phương án dự phòng tác nhân mặc định và tổng hợp các không gian làm việc Dreaming đã cấu hình.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, và `doctor.memory.dedupeDreamDiary` chấp nhận tham số tùy chọn `{ "agentId": "agent-id" }` cho các chế độ xem/hành động Dreaming của tác nhân đã chọn. Khi bỏ qua `agentId`, chúng hoạt động trên không gian làm việc tác nhân mặc định đã cấu hình.
    - `doctor.memory.remHarness` trả về bản xem trước harness REM chỉ đọc, có giới hạn cho các máy khách control-plane từ xa. Nó có thể bao gồm đường dẫn không gian làm việc, đoạn trích bộ nhớ, markdown grounded đã kết xuất, và ứng viên thăng hạng sâu, nên bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt mức sử dụng theo từng phiên. Truyền `agentId` cho một
      tác nhân, hoặc `agentScope: "all"` để liệt kê cùng nhau các tác nhân đã cấu hình.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký mức sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình trợ giúp đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/Plugin tích hợp sẵn + đóng gói kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có khả năng QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một APNs push thử nghiệm đến một Node iOS đã đăng ký.
    - `voicewake.get` trả về các trình kích hoạt wake-word đã lưu.
    - `voicewake.set` cập nhật các trình kích hoạt wake-word và phát thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi đi trực tiếp cho các lượt gửi nhắm tới kênh/tài khoản/luồng bên ngoài trình chạy trò chuyện.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với con trỏ/giới hạn và các điều khiển byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.catalog` trả về danh mục nhà cung cấp Talk chỉ đọc cho giọng nói, phiên âm phát trực tuyến và giọng nói thời gian thực. Nó bao gồm id nhà cung cấp chuẩn, bí danh registry, nhãn, trạng thái đã cấu hình, kết quả `ready` cấp nhóm tùy chọn, id model/voice được hiển thị, chế độ chuẩn, transport, chiến lược brain và các cờ âm thanh/năng lực thời gian thực mà không trả về bí mật của nhà cung cấp hoặc thay đổi cấu hình toàn cục. Các Gateway hiện tại đặt `ready` sau khi áp dụng lựa chọn nhà cung cấp runtime; máy khách nên xem việc thiếu trường này là chưa được xác minh để tương thích với các Gateway cũ hơn.
    - `talk.config` trả về payload cấu hình Talk hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.session.create` tạo một phiên Talk do Gateway sở hữu cho `realtime/gateway-relay`, `transcription/gateway-relay`, hoặc `stt-tts/managed-room`. Với `stt-tts/managed-room`, các caller `operator.write` truyền `sessionKey` cũng phải truyền `spawnedBy` để có phạm vi hiển thị khóa phiên; tạo `sessionKey` không theo phạm vi và `brain: "direct-tools"` yêu cầu `operator.admin`.
    - `talk.session.join` xác thực token phiên managed-room, phát sự kiện `session.ready` hoặc `session.replaced` khi cần, và trả về siêu dữ liệu phòng/phiên cùng các sự kiện Talk gần đây mà không có token văn bản thuần hoặc hash token đã lưu.
    - `talk.session.appendAudio` nối âm thanh đầu vào PCM base64 vào các phiên realtime relay và transcription do Gateway sở hữu.
    - `talk.session.startTurn`, `talk.session.endTurn`, và `talk.session.cancelTurn` điều khiển vòng đời lượt managed-room với việc từ chối lượt cũ trước khi trạng thái được xóa.
    - `talk.session.cancelOutput` dừng đầu ra âm thanh của assistant, chủ yếu cho barge-in được chặn bằng VAD trong các phiên Gateway relay.
    - `talk.session.submitToolResult` hoàn tất một lệnh gọi công cụ của nhà cung cấp do phiên realtime relay thuộc sở hữu Gateway phát ra. Truyền `options: { willContinue: true }` cho đầu ra công cụ tạm thời khi kết quả cuối cùng sẽ theo sau, hoặc `options: { suppressResponse: true }` khi kết quả công cụ nên đáp ứng lệnh gọi của nhà cung cấp mà không khởi động một phản hồi assistant thời gian thực khác.
    - `talk.session.steer` gửi điều khiển giọng nói của lượt chạy đang hoạt động vào một phiên Talk được agent hỗ trợ và do Gateway sở hữu. Nó chấp nhận `{ sessionId, text, mode? }`, trong đó `mode` là `status`, `steer`, `cancel`, hoặc `followup`; chế độ bị bỏ qua sẽ được phân loại từ văn bản đã nói.
    - `talk.session.close` đóng một phiên relay, transcription, hoặc managed-room do Gateway sở hữu và phát các sự kiện Talk kết thúc.
    - `talk.mode` đặt/phát sóng trạng thái chế độ Talk hiện tại cho các máy khách WebChat/Control UI.
    - `talk.client.create` tạo một phiên nhà cung cấp thời gian thực do máy khách sở hữu bằng `webrtc` hoặc `provider-websocket` trong khi Gateway sở hữu cấu hình, thông tin xác thực, hướng dẫn và chính sách công cụ.
    - `talk.client.toolCall` cho phép transport thời gian thực do máy khách sở hữu chuyển tiếp các lệnh gọi công cụ của nhà cung cấp tới chính sách Gateway. Công cụ được hỗ trợ đầu tiên là `openclaw_agent_consult`; máy khách nhận id lượt chạy và chờ các sự kiện vòng đời trò chuyện bình thường trước khi gửi kết quả công cụ dành riêng cho nhà cung cấp.
    - `talk.client.steer` gửi điều khiển giọng nói của lượt chạy đang hoạt động cho transport thời gian thực do máy khách sở hữu. Gateway phân giải lượt chạy nhúng đang hoạt động từ `sessionKey` và trả về kết quả có cấu trúc được chấp nhận/từ chối thay vì âm thầm bỏ điều khiển.
    - `talk.event` là kênh sự kiện Talk duy nhất cho các adapter thời gian thực, transcription, STT/TTS, managed-room, điện thoại và cuộc họp.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp dự phòng và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về danh sách nhà cung cấp TTS hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRefs đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật nhắm tới lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về snapshot cấu hình hiện tại và hash.
    - `config.set` ghi một payload cấu hình đã được xác thực.
    - `config.patch` hợp nhất một bản cập nhật cấu hình một phần. Việc thay thế mảng có tính phá hủy yêu cầu đường dẫn bị ảnh hưởng trong `replacePaths`; các mảng lồng nhau dưới mục nhập mảng dùng đường dẫn `[]` như `agents.list[].skills`.
    - `config.apply` xác thực + thay thế toàn bộ payload cấu hình.
    - `config.schema` trả về payload schema cấu hình trực tiếp được dùng bởi Control UI và công cụ CLI: schema, `uiHints`, phiên bản và siêu dữ liệu tạo, bao gồm siêu dữ liệu schema Plugin + kênh khi runtime có thể tải được. Schema bao gồm siêu dữ liệu trường `title` / `description` bắt nguồn từ cùng nhãn và văn bản trợ giúp mà UI dùng, bao gồm các nhánh đối tượng lồng nhau, wildcard, mục mảng và thành phần `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về payload tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một nút schema nông, gợi ý khớp + `hintPath`, `reloadKind` tùy chọn và tóm tắt con trực tiếp để UI/CLI đi sâu. `reloadKind` là một trong `restart`, `hot`, hoặc `none` và phản ánh trình lập kế hoạch tải lại cấu hình Gateway cho đường dẫn được yêu cầu. Các nút schema tra cứu giữ tài liệu hướng tới người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, `reloadKind` tùy chọn, cùng `hint` / `hintPath` đã khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi bản cập nhật tự nó thành công; caller có phiên có thể bao gồm `continuationMessage` để khi khởi động tiếp tục một lượt agent theo dõi thông qua hàng đợi tiếp tục sau khởi động lại. Các bản cập nhật bằng trình quản lý gói và bản cập nhật git-checkout có giám sát từ mặt phẳng điều khiển dùng bàn giao dịch vụ được quản lý tách rời thay vì thay thế cây gói hoặc thay đổi đầu ra checkout/build bên trong Gateway đang chạy. Một bàn giao đã bắt đầu trả về `ok: true` với `result.reason: "managed-service-handoff-started"` và `handoff.status: "started"`; bàn giao không khả dụng hoặc thất bại trả về `ok: false` với `managed-service-handoff-unavailable` hoặc `managed-service-handoff-failed`, cùng `handoff.command` khi cần cập nhật shell thủ công. Bàn giao không khả dụng nghĩa là OpenClaw thiếu ranh giới supervisor an toàn hoặc định danh dịch vụ bền vững, chẳng hạn `OPENCLAW_SYSTEMD_UNIT` cho systemd. Trong khi bàn giao đã bắt đầu, sentinel khởi động lại có thể tạm thời báo cáo `stats.reason: "restart-health-pending"`; phần tiếp tục bị trì hoãn cho đến khi CLI xác minh Gateway đã khởi động lại và ghi sentinel `ok` cuối cùng.
    - `update.status` làm mới và trả về sentinel khởi động lại cập nhật mới nhất, bao gồm phiên bản đang chạy sau khởi động lại khi có.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` hiển thị trình hướng dẫn onboarding qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp tác tử và không gian làm việc">
    - `agents.list` trả về các mục tác tử đã cấu hình, bao gồm mô hình hiệu lực và siêu dữ liệu môi trường chạy.
    - `agents.create`, `agents.update`, và `agents.delete` quản lý bản ghi tác tử và liên kết không gian làm việc.
    - `agents.files.list`, `agents.files.get`, và `agents.files.set` quản lý các tệp không gian làm việc khởi động được cung cấp cho một tác tử.
    - `tasks.list`, `tasks.get`, và `tasks.cancel` cung cấp sổ cái tác vụ Gateway cho SDK và các máy khách vận hành.
    - `artifacts.list`, `artifacts.get`, và `artifacts.download` cung cấp tóm tắt hiện vật bắt nguồn từ bản ghi hội thoại và tải xuống cho phạm vi `sessionKey`, `runId`, hoặc `taskId` rõ ràng. Các truy vấn lượt chạy và tác vụ phân giải phiên sở hữu ở phía máy chủ và chỉ trả về phương tiện bản ghi hội thoại có nguồn gốc khớp; các nguồn URL không an toàn hoặc cục bộ trả về tải xuống không được hỗ trợ thay vì tìm nạp ở phía máy chủ.
    - `environments.list` và `environments.status` cung cấp khả năng khám phá môi trường chỉ đọc cục bộ Gateway và node cho các máy khách SDK.
    - `agent.identity.get` trả về danh tính trợ lý hiệu lực cho một tác tử hoặc phiên.
    - `agent.wait` chờ một lượt chạy hoàn tất và trả về ảnh chụp nhanh kết thúc khi có sẵn.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` theo từng hàng khi một backend môi trường chạy của tác tử được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho máy khách WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện bản ghi hội thoại/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước bản ghi hội thoại có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho một khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một mục tiêu phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào một phiên hiện có.
    - `sessions.steer` là biến thể ngắt-và-điều hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` cùng `runId` tùy chọn, hoặc chỉ truyền `runId` cho các lượt chạy đang hoạt động mà Gateway có thể phân giải thành một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/ghi đè của phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` hiệu lực.
    - `sessions.reset`, `sessions.delete`, và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu trữ.
    - Thực thi trò chuyện vẫn dùng `chat.history`, `chat.send`, `chat.abort`, và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho các máy khách UI: các thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, payload XML lời gọi công cụ dạng văn bản thuần túy (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lời gọi công cụ bị cắt ngắn) cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ sẽ bị loại bỏ, các hàng trợ lý chỉ chứa token im lặng như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.
    - `chat.message.get` là trình đọc toàn bộ tin nhắn có giới hạn bổ sung cho một mục bản ghi hội thoại hiển thị duy nhất. Máy khách truyền `sessionKey`, `agentId` tùy chọn khi lựa chọn phiên thuộc phạm vi tác tử, cộng với `messageId` bản ghi hội thoại đã được hiển thị trước đó qua `chat.history`, và Gateway trả về cùng phép chiếu đã chuẩn hóa hiển thị mà không có giới hạn cắt ngắn lịch sử nhẹ khi mục đã lưu trữ vẫn còn khả dụng và không quá lớn.
    - `chat.send` chấp nhận `fastMode: "auto"` một lượt để dùng chế độ nhanh cho các lời gọi mô hình bắt đầu trước ngưỡng tự động, rồi bắt đầu các lời gọi thử lại, dự phòng, kết quả công cụ, hoặc tiếp tục sau đó mà không dùng chế độ nhanh. Ngưỡng mặc định là 60 giây và có thể được cấu hình theo từng mô hình bằng `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Bên gọi `chat.send` có thể truyền `fastAutoOnSeconds` một lượt để ghi đè ngưỡng cho yêu cầu đó.

  </Accordion>

  <Accordion title="Ghép nối thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép nối đang chờ xử lý và đã phê duyệt.
    - `device.pair.setupCode` tạo mã thiết lập di động và, theo mặc định, URL dữ liệu QR PNG. Nó yêu cầu `operator.admin` và được cố ý bỏ khỏi khám phá được quảng bá. Kết quả bao gồm `setupCode`, `qrDataUrl` tùy chọn, `gatewayUrl`, nhãn `auth` không bí mật, và `urlSource`.
    - `device.pair.approve`, `device.pair.reject`, và `device.pair.remove` quản lý các bản ghi ghép nối thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép nối trong giới hạn vai trò đã phê duyệt và phạm vi bên gọi của nó.
    - `device.token.revoke` thu hồi token thiết bị đã ghép nối trong giới hạn vai trò đã phê duyệt và phạm vi bên gọi của nó.

    Mã thiết lập nhúng một thông tin xác thực khởi động tồn tại trong thời gian ngắn. Máy khách không được
    ghi log hoặc lưu giữ nó ngoài luồng ghép nối.

  </Accordion>

  <Accordion title="Ghép nối node, gọi lệnh, và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, và `node.pair.verify` bao quát ghép nối node và xác minh khởi động.
    - `node.list` và `node.describe` trả về trạng thái node đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn node đã ghép nối.
    - `node.invoke` chuyển tiếp một lệnh tới node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu gọi lệnh.
    - `node.event` mang các sự kiện bắt nguồn từ node trở lại gateway.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các node ngoại tuyến/đã ngắt kết nối.

  </Accordion>

  <Accordion title="Nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, và `exec.approval.resolve` bao quát các yêu cầu phê duyệt exec một lần cùng tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý các ảnh chụp nhanh chính sách phê duyệt exec của gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ node thông qua các lệnh chuyển tiếp node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, và `plugin.approval.resolve` bao quát các luồng phê duyệt do Plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc ở Heartbeat tiếp theo; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - `cron.run` vẫn là RPC kiểu đưa vào hàng đợi cho các lần chạy thủ công. Các client cần ngữ nghĩa hoàn tất nên đọc `runId` được trả về và thăm dò `cron.runs`.
    - `cron.runs` chấp nhận bộ lọc `runId` tùy chọn không rỗng để client có thể theo dõi một lần chạy thủ công đã đưa vào hàng đợi mà không bị tranh chấp với các mục lịch sử khác cho cùng công việc.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: các cập nhật trò chuyện UI như `chat.inject` và các sự kiện trò chuyện
  chỉ trong transcript khác. Trong giao thức v4, payload delta mang `deltaText`; `message` vẫn là
  ảnh chụp tích lũy của trợ lý. Các thay thế không theo tiền tố đặt `replace=true`
  và dùng `deltaText` làm văn bản thay thế.
- `session.message`, `session.operation`, và `session.tool`: transcript,
  thao tác phiên đang diễn ra, và các cập nhật luồng sự kiện cho một phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: cập nhật ảnh chụp trạng thái hiện diện của hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: cập nhật ảnh chụp tình trạng Gateway.
- `heartbeat`: cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi lần chạy/công việc cron.
- `shutdown`: thông báo tắt Gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép cặp node.
- `node.invoke.request`: phát rộng yêu cầu gọi node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép cặp.
- `voicewake.changed`: cấu hình kích hoạt bằng từ đánh thức đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt Plugin.

### Phương thức hỗ trợ Node

- Các node có thể gọi `skills.bins` để lấy danh sách hiện tại của các tệp thực thi skill
  cho kiểm tra tự động cho phép.

### RPC sổ cái tác vụ

Client vận hành có thể kiểm tra và hủy các bản ghi tác vụ nền của Gateway thông qua
các RPC sổ cái tác vụ. Các phương thức này trả về tóm tắt tác vụ đã làm sạch, không phải
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
  - ID tác vụ bị thiếu trả về dạng lỗi không tìm thấy của Gateway.
- `tasks.cancel` yêu cầu `operator.write`.
  - Tham số: `{ "taskId": string, "reason"?: string }`.
  - Kết quả:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` báo liệu sổ cái có tác vụ khớp hay không. `cancelled`
    báo liệu runtime đã chấp nhận hoặc ghi nhận việc hủy hay chưa.

`TaskSummary` bao gồm `id`, `status`, và siêu dữ liệu tùy chọn như `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, dấu thời gian, tiến độ,
tóm tắt kết thúc, và văn bản lỗi đã làm sạch. `agentId` xác định agent
thực thi tác vụ; `sessionKey` và `ownerKey` giữ lại ngữ cảnh người yêu cầu và điều khiển.

### Phương thức hỗ trợ vận hành

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy kho lệnh runtime cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có `/` ở đầu
    - `native` và đường dẫn mặc định `both` trả về tên native có nhận biết provider khi có sẵn
  - `textAliases` chứa các bí danh slash chính xác như `/model` và `/m`.
  - `nativeName` chứa tên lệnh native có nhận biết provider khi tồn tại.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến việc đặt tên native cùng với khả năng sẵn có của lệnh plugin native.
  - `includeArgs=false` bỏ qua metadata đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy catalog công cụ runtime cho một agent. Phản hồi bao gồm các công cụ được nhóm và metadata nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu plugin khi `source="plugin"`
  - `optional`: liệu công cụ plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy kho công cụ có hiệu lực trong runtime cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh runtime đáng tin cậy từ phiên ở phía máy chủ thay vì chấp nhận auth hoặc ngữ cảnh phân phối do bên gọi cung cấp.
  - Phản hồi là một phép chiếu do máy chủ suy ra theo phạm vi phiên của kho đang hoạt động, bao gồm các công cụ core, plugin, kênh và máy chủ MCP đã được phát hiện.
  - `tools.effective` là chỉ đọc đối với MCP: nó có thể chiếu một catalog MCP của phiên đã warm qua chính sách công cụ cuối cùng, nhưng không tạo runtime MCP, kết nối transport hoặc phát hành `tools/list`. Nếu không có catalog warm khớp, phản hồi có thể bao gồm một thông báo như `mcp-not-yet-connected`, `mcp-not-yet-listed`, hoặc `mcp-stale-catalog`.
  - Các mục công cụ hiệu lực dùng `source="core"`, `source="plugin"`, `source="channel"`, hoặc `source="mcp"`.
- Người vận hành có thể gọi `tools.invoke` (`operator.write`) để gọi một công cụ sẵn có qua cùng đường dẫn chính sách Gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm`, và `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều hiện diện, agent của phiên đã phân giải phải khớp với `agentId`.
  - Các wrapper core chỉ dành cho owner như `cron`, `gateway`, và `nodes` yêu cầu danh tính owner/admin (`operator.admin`) dù bản thân phương thức `tools.invoke` là `operator.write`.
  - Phản hồi là một envelope hướng SDK với các trường `ok`, `toolName`, `output` tùy chọn, và `error` có kiểu. Từ chối phê duyệt hoặc chính sách trả về `ok:false` trong payload thay vì bỏ qua pipeline chính sách công cụ của Gateway.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy kho skill hiển thị cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - Phản hồi bao gồm tính đủ điều kiện, yêu cầu còn thiếu, kiểm tra cấu hình, và các tùy chọn cài đặt đã được làm sạch mà không lộ giá trị bí mật thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) cho metadata khám phá ClawHub.
- Người vận hành có thể gọi `skills.upload.begin`, `skills.upload.chunk`, và `skills.upload.commit` (`operator.admin`) để chuẩn bị một kho lưu trữ skill riêng trước khi cài đặt. Đây là đường dẫn tải lên admin riêng cho các client đáng tin cậy, không phải luồng cài đặt skill ClawHub thông thường, và bị tắt theo mặc định trừ khi `skills.install.allowUploadedArchives` được bật.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` tạo một lượt tải lên được gắn với slug và giá trị force đó.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` nối thêm byte tại offset đã giải mã chính xác.
  - `skills.upload.commit({ uploadId, sha256? })` xác minh kích thước cuối cùng và SHA-256. Commit chỉ hoàn tất lượt tải lên; nó không cài đặt skill.
  - Các kho lưu trữ skill đã tải lên là tệp zip chứa root `SKILL.md`. Tên thư mục nội bộ của kho lưu trữ không bao giờ chọn đích cài đặt.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở ba chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một thư mục skill vào thư mục `skills/` của workspace agent mặc định.
  - Chế độ tải lên: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` cài đặt một lượt tải lên đã commit vào thư mục `skills/<slug>` của workspace agent mặc định. Slug và giá trị force phải khớp với yêu cầu `skills.upload.begin` ban đầu. Chế độ này bị từ chối trừ khi `skills.install.allowUploadedArchives` được bật. Thiết lập này không ảnh hưởng đến các lượt cài đặt ClawHub.
  - Chế độ trình cài đặt Gateway: `{ name, installId, timeoutMs? }` chạy một hành động `metadata.openclaw.install` đã khai báo trên máy chủ Gateway. Các client cũ hơn vẫn có thể gửi `dangerouslyForceUnsafeInstall`; trường này đã bị ngừng khuyến nghị, chỉ được chấp nhận vì tương thích giao thức, và bị bỏ qua. Dùng `security.installPolicy` cho các quyết định cài đặt do người vận hành sở hữu.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả các lượt cài đặt ClawHub được theo dõi trong workspace agent mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`, `apiKey`, và `env`.

### Chế độ xem `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi runtime hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là catalog được cho phép, bao gồm các model được phát hiện động cho các mục `provider/*`. Nếu không, phản hồi là toàn bộ catalog Gateway.
- `"configured"`: hành vi có kích thước phù hợp cho bộ chọn. Nếu `agents.defaults.models` được cấu hình, nó vẫn được ưu tiên, bao gồm khám phá theo phạm vi provider cho các mục `provider/*`. Khi không có danh sách cho phép, phản hồi dùng các mục `models.providers.*.models` tường minh, chỉ quay về toàn bộ catalog khi không có hàng model đã cấu hình nào tồn tại.
- `"all"`: toàn bộ catalog Gateway, bỏ qua `agents.defaults.models`. Dùng chế độ này cho chẩn đoán và UI khám phá, không dùng cho bộ chọn model thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, Gateway phát sóng `exec.approval.requested`.
- Client người vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu phạm vi `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata phiên chuẩn). Các yêu cầu thiếu `systemRunPlan` bị từ chối.
- Sau khi phê duyệt, các lời gọi `node.invoke system.run` được chuyển tiếp sẽ tái sử dụng `systemRunPlan` chuẩn đó làm ngữ cảnh command/cwd/phiên có thẩm quyền.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId`, hoặc `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` đã được phê duyệt cuối cùng, Gateway từ chối lượt chạy thay vì tin payload đã bị thay đổi.

## Fallback phân phối agent

- Các yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối outbound.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: các đích phân phối không phân giải được hoặc chỉ nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép fallback về thực thi chỉ trong phiên khi không thể phân giải tuyến có thể phân phối bên ngoài (ví dụ phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).
- Kết quả `agent` cuối cùng có thể bao gồm `result.deliveryStatus` khi phân phối đã được yêu cầu, sử dụng cùng các trạng thái `sent`, `suppressed`, `partial_failed`, và `failed` được ghi trong tài liệu cho [`openclaw agent --json --deliver`](/vi/cli/agent#json-delivery-status).

## Quản lý phiên bản

- `PROTOCOL_VERSION` nằm trong `packages/gateway-protocol/src/version.ts`.
- Client gửi `minProtocol` + `maxProtocol`; máy chủ từ chối các dải không bao gồm giao thức hiện tại của nó. Client và máy chủ hiện tại yêu cầu giao thức v4.
- Schema + model được tạo từ các định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số client

Client tham chiếu trong `src/gateway/client.ts` dùng các giá trị mặc định này. Các giá trị ổn định trên giao thức v4 và là baseline kỳ vọng cho client bên thứ ba.

| Hằng số                                   | Mặc định                                              | Nguồn                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Timeout yêu cầu (mỗi RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env có thể tăng ngân sách server/client đi cặp) |
| Backoff kết nối lại ban đầu               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Kẹp thử lại nhanh sau đóng device-token   | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Thời gian chờ force-stop trước `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout mặc định của `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)   | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do tick-timeout                      | code `4000` khi im lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Máy chủ quảng bá `policy.tickIntervalMs`, `policy.maxPayload`, và `policy.maxBufferedBytes` có hiệu lực trong `hello-ok`; client nên tuân theo các giá trị đó thay vì các mặc định trước bắt tay.

## Auth

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy thuộc vào chế độ xác thực đã cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc non-loopback
  `gateway.auth.mode: "trusted-proxy"` đáp ứng kiểm tra xác thực kết nối từ
  các tiêu đề yêu cầu thay vì `connect.params.auth.*`.
- `gateway.auth.mode: "none"` cho lối vào riêng tư bỏ qua hoàn toàn xác thực
  kết nối bằng bí mật dùng chung; không để lộ chế độ đó trên lối vào công khai/không tin cậy.
- Sau khi ghép đôi, Gateway cấp một **mã thông báo thiết bị** giới hạn theo vai trò
  kết nối + các phạm vi. Nó được trả về trong `hello-ok.auth.deviceToken` và nên được
  máy khách lưu giữ cho các lần kết nối sau.
- Máy khách nên lưu giữ `hello-ok.auth.deviceToken` chính sau mọi lần kết nối
  thành công.
- Việc kết nối lại bằng mã thông báo thiết bị **đã lưu** đó cũng nên tái sử dụng
  tập phạm vi đã phê duyệt được lưu cho mã thông báo đó. Điều này giữ nguyên quyền truy cập
  đọc/thăm dò/trạng thái đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại
  xuống phạm vi ngầm định chỉ dành cho quản trị viên hẹp hơn.
- Lắp ráp xác thực kết nối phía máy khách (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: mã thông báo dùng chung tường minh trước,
    rồi một `deviceToken` tường minh, rồi mã thông báo theo thiết bị đã lưu (được khóa bằng
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được
    `auth.token`. Một mã thông báo dùng chung hoặc bất kỳ mã thông báo thiết bị nào đã phân giải đều chặn nó.
  - Tự động thăng cấp mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được cho phép với **điểm cuối tin cậy** -
    loopback, hoặc `wss://` có `tlsFingerprint` được ghim. `wss://` công khai
    không ghim không đủ điều kiện.
- Bootstrap bằng mã thiết lập tích hợp trả về Node chính
  `hello-ok.auth.deviceToken` cùng một mã thông báo người vận hành có giới hạn trong
  `hello-ok.auth.deviceTokens` để bàn giao di động tin cậy. Mã thông báo người vận hành
  bao gồm `operator.talk.secrets` để đọc cấu hình Talk gốc, nhưng
  loại trừ các phạm vi thay đổi ghép đôi và `operator.admin`.
- Khi một bootstrap bằng mã thiết lập không phải đường cơ sở đang chờ phê duyệt, chi tiết `PAIRING_REQUIRED`
  bao gồm `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  và `pauseReconnect: false`. Máy khách nên tiếp tục kết nối lại bằng cùng
  mã thông báo bootstrap cho đến khi yêu cầu được phê duyệt hoặc mã thông báo không còn hợp lệ.
- Chỉ lưu giữ `hello-ok.auth.deviceTokens` khi kết nối đã sử dụng xác thực bootstrap
  trên một phương thức truyền tải tin cậy như `wss://` hoặc ghép đôi loopback/cục bộ.
- Nếu máy khách cung cấp một `deviceToken` **tường minh** hoặc `scopes` tường minh, tập
  phạm vi do bên gọi yêu cầu đó vẫn là nguồn quyết định; phạm vi được lưu trong bộ nhớ đệm chỉ
  được tái sử dụng khi máy khách đang tái sử dụng mã thông báo theo thiết bị đã lưu.
- Có thể xoay vòng/thu hồi mã thông báo thiết bị qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`). Xoay vòng hoặc
  thu hồi mã thông báo của Node hoặc vai trò không phải người vận hành khác cũng yêu cầu `operator.admin`.
- `device.token.rotate` trả về siêu dữ liệu xoay vòng. Nó chỉ phản hồi lại mã thông báo bearer
  thay thế cho các lệnh gọi cùng thiết bị đã được xác thực bằng
  mã thông báo thiết bị đó, để máy khách chỉ dùng mã thông báo có thể lưu giữ mã thay thế trước khi
  kết nối lại. Các lượt xoay vòng bằng mã dùng chung/quản trị không phản hồi lại mã thông báo bearer.
- Việc cấp, xoay vòng và thu hồi mã thông báo vẫn được giới hạn trong tập vai trò đã phê duyệt
  được ghi trong mục ghép đôi của thiết bị đó; thao tác thay đổi mã thông báo không thể mở rộng hoặc
  nhắm đến vai trò thiết bị mà phê duyệt ghép đôi chưa từng cấp.
- Với các phiên mã thông báo thiết bị đã ghép đôi, quản lý thiết bị tự giới hạn phạm vi trừ khi
  bên gọi cũng có `operator.admin`: bên gọi không phải quản trị viên chỉ có thể quản lý
  mã thông báo người vận hành cho mục thiết bị **của chính họ**. Quản lý mã thông báo của Node
  và các mã thông báo không phải người vận hành khác chỉ dành cho quản trị viên, ngay cả với thiết bị của chính bên gọi.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi mã thông báo người vận hành
  mục tiêu so với các phạm vi phiên hiện tại của bên gọi. Bên gọi không phải quản trị viên
  không thể xoay vòng hoặc thu hồi một mã thông báo người vận hành rộng hơn phạm vi họ đang có.
- Lỗi xác thực bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi máy khách cho `AUTH_TOKEN_MISMATCH`:
  - Máy khách tin cậy có thể thử một lần thử lại có giới hạn bằng mã thông báo theo thiết bị được lưu trong bộ nhớ đệm.
  - Nếu lần thử lại đó thất bại, máy khách nên dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho người vận hành.
- `AUTH_SCOPE_MISMATCH` nghĩa là mã thông báo thiết bị đã được nhận diện nhưng không bao phủ
  vai trò/phạm vi được yêu cầu. Máy khách không nên trình bày lỗi này như một mã thông báo sai;
  hãy nhắc người vận hành ghép đôi lại hoặc phê duyệt hợp đồng phạm vi hẹp hơn/rộng hơn.

## Danh tính thiết bị + ghép đôi

- Các Node nên bao gồm một danh tính thiết bị ổn định (`device.id`) được suy ra từ
  dấu vân tay cặp khóa.
- Gateway cấp mã thông báo theo thiết bị + vai trò.
- Phê duyệt ghép đôi là bắt buộc cho ID thiết bị mới trừ khi tự động phê duyệt cục bộ
  được bật.
- Tự động phê duyệt ghép đôi tập trung vào các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường tự kết nối hẹp cục bộ phần phụ trợ/vùng chứa cho
  các luồng trợ giúp bằng bí mật dùng chung tin cậy.
- Các kết nối cùng máy chủ qua tailnet hoặc LAN vẫn được xử lý là từ xa đối với ghép đôi và
  yêu cầu phê duyệt.
- Máy khách WS thường bao gồm danh tính `device` trong `connect` (người vận hành +
  Node). Các ngoại lệ người vận hành không có thiết bị duy nhất là các đường tin cậy tường minh:
  - `gateway.controlUi.allowInsecureAuth=true` cho khả năng tương thích HTTP không an toàn chỉ trên localhost.
  - xác thực Control UI người vận hành `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (phá kính khẩn cấp, hạ cấp bảo mật nghiêm trọng).
  - RPC phần phụ trợ `gateway-client` qua direct-loopback trên đường trợ giúp nội bộ
    dành riêng.
- Bỏ qua danh tính thiết bị có hệ quả về phạm vi. Khi một kết nối người vận hành không có thiết bị
  được cho phép qua một đường tin cậy tường minh, OpenClaw vẫn xóa
  các phạm vi tự khai báo thành tập rỗng trừ khi đường đó có một ngoại lệ
  bảo toàn phạm vi được đặt tên. Khi đó các phương thức bị chặn theo phạm vi sẽ thất bại với
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` là một đường bảo toàn phạm vi
  phá kính khẩn cấp của Control UI. Nó không cấp phạm vi cho các máy khách WebSocket
  phần phụ trợ tùy chỉnh hoặc dạng CLI tùy ý.
- Đường trợ giúp phần phụ trợ `gateway-client` direct-loopback dành riêng chỉ bảo toàn
  phạm vi cho các RPC mặt phẳng điều khiển cục bộ nội bộ; các ID phần phụ trợ tùy chỉnh không
  nhận ngoại lệ này.
- Mọi kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di chuyển xác thực thiết bị

Với các máy khách cũ vẫn dùng hành vi ký trước thử thách, `connect` hiện trả về
mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` cùng một `error.details.reason` ổn định.

Các lỗi di chuyển thường gặp:

| Thông báo                   | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Máy khách đã bỏ qua `device.nonce` (hoặc gửi rỗng). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Máy khách đã ký bằng nonce cũ/sai.                 |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Tải trọng chữ ký không khớp tải trọng v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.    |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp dấu vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.       |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký tải trọng v2 bao gồm nonce máy chủ.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Tải trọng chữ ký ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  ngoài các trường thiết bị/máy khách/vai trò/phạm vi/mã thông báo/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng việc ghim siêu dữ liệu
  thiết bị đã ghép đôi vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Máy khách có thể tùy chọn ghim dấu vân tay chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này để lộ **toàn bộ API Gateway** (trạng thái, kênh, mô hình, trò chuyện,
tác tử, phiên, Node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi các
schema TypeBox trong `packages/gateway-protocol/src/schema.ts`.

## Liên quan

- [Giao thức cầu nối](/vi/gateway/bridge-protocol)
- [Sổ tay vận hành Gateway](/vi/gateway)
