---
read_when:
    - Triển khai hoặc cập nhật các máy khách WS của gateway
    - Gỡ lỗi sai khớp giao thức hoặc lỗi kết nối
    - Đang tái tạo lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-07-03T13:36:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức Gateway WS là **mặt phẳng điều khiển duy nhất + truyền tải nút** cho
OpenClaw. Mọi máy khách (CLI, giao diện web, ứng dụng macOS, nút iOS/Android, nút
không giao diện) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi** của
chúng tại thời điểm bắt tay.

## Truyền tải

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **phải** là một yêu cầu `connect`.
- Các khung trước khi kết nối bị giới hạn ở 64 KiB. Sau khi bắt tay thành công, máy khách
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các khung đến quá lớn và bộ đệm đi chậm sẽ phát ra sự kiện `payload.large`
  trước khi gateway đóng hoặc bỏ khung bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ phần thân
  thông điệp, nội dung tệp đính kèm, thân khung thô, token, cookie hoặc giá trị bí mật.

## Bắt tay (connect)

Gateway → Máy khách (thử thách trước khi kết nối):

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

Trong khi Gateway vẫn đang hoàn tất các sidecar khởi động, yêu cầu `connect` có thể
trả về lỗi `UNAVAILABLE` có thể thử lại với `details.reason` được đặt thành
`"startup-sidecars"` và `retryAfterMs`. Máy khách nên thử lại phản hồi đó
trong ngân sách kết nối tổng thể của chúng thay vì hiển thị nó như một lỗi
bắt tay cuối cùng.

`server`, `features`, `snapshot` và `policy` đều là bắt buộc theo schema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` cũng là bắt buộc và báo cáo
vai trò/phạm vi đã thương lượng. `pluginSurfaceUrls` là tùy chọn và ánh xạ tên
bề mặt plugin, chẳng hạn như `canvas`, tới các URL được lưu trữ theo phạm vi.

URL bề mặt plugin có phạm vi có thể hết hạn. Nút có thể gọi
`node.pluginSurface.refresh` với `{ "surface": "canvas" }` để nhận một mục mới
trong `pluginSurfaceUrls`. Bản tái cấu trúc Plugin Canvas thử nghiệm không
hỗ trợ đường dẫn tương thích `canvasHostUrl`, `canvasCapability` hoặc
`node.canvas.capability.refresh` đã bị ngừng dùng; máy khách native và
gateway hiện tại phải dùng bề mặt plugin.

Khi không phát hành token thiết bị, `hello-ok.auth` báo cáo các quyền đã thương lượng
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
`client.mode: "backend"`) có thể bỏ qua `device` trên các kết nối loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu gateway dùng chung. Đường dẫn này được dành riêng
cho RPC mặt phẳng điều khiển nội bộ và tránh để các baseline ghép đôi CLI/thiết bị cũ
chặn công việc backend cục bộ như cập nhật phiên subagent. Máy khách từ xa,
máy khách nguồn gốc trình duyệt, máy khách nút và máy khách token thiết bị/danh tính thiết bị
rõ ràng vẫn dùng các kiểm tra ghép đôi và nâng cấp phạm vi bình thường.

Khi phát hành token thiết bị, `hello-ok` cũng bao gồm:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Bootstrap QR/mã thiết lập tích hợp sẵn là một đường dẫn bàn giao di động mới. Một
kết nối mã thiết lập baseline thành công trả về một token nút chính cùng một
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

Việc bàn giao operator được giới hạn có chủ ý để quá trình đưa vào sử dụng bằng QR có thể khởi động
vòng lặp operator di động và hoàn tất thiết lập native mà không cấp phạm vi
thay đổi ghép đôi hoặc `operator.admin`. Nó bao gồm `operator.talk.secrets` để
máy khách native có thể đọc cấu hình Talk cần thiết sau bootstrap. Quyền truy cập
ghép đôi và quản trị rộng hơn yêu cầu một luồng ghép đôi operator hoặc token
được phê duyệt riêng. Máy khách chỉ nên lưu bền vững
`hello-ok.auth.deviceTokens`
khi kết nối đã dùng xác thực bootstrap trên truyền tải đáng tin cậy như `wss://` hoặc
ghép đôi loopback/cục bộ.

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

Các phương thức có tác dụng phụ yêu cầu **khóa idempotency** (xem schema).

## Vai trò + phạm vi

Để xem đầy đủ mô hình phạm vi operator, các kiểm tra tại thời điểm phê duyệt và
ngữ nghĩa bí mật dùng chung, xem [Phạm vi operator](/vi/gateway/operator-scopes).

### Vai trò

- `operator` = máy khách mặt phẳng điều khiển (CLI/giao diện/tự động hóa).
- `node` = máy chủ năng lực (camera/screen/canvas/system.run).

### Phạm vi (operator)

Các phạm vi thường gặp:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` với `includeSecrets: true` yêu cầu `operator.talk.secrets`
(hoặc `operator.admin`).
Khi có bao gồm bí mật, máy khách nên đọc thông tin xác thực nhà cung cấp Talk đang hoạt động
từ `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
giữ nguyên dạng nguồn và có thể là đối tượng SecretRef hoặc chuỗi đã được che.

Các phương thức RPC gateway do Plugin đăng ký có thể yêu cầu phạm vi operator riêng,
nhưng các tiền tố quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi phương thức chỉ là cổng đầu tiên. Một số lệnh gạch chéo đi qua
`chat.send` áp dụng các kiểm tra cấp lệnh nghiêm ngặt hơn ở phía trên. Ví dụ, các lệnh ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có thêm một kiểm tra phạm vi tại thời điểm phê duyệt ở phía trên
phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có lệnh nút không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Năng lực/lệnh/quyền (nút)

Nút khai báo các tuyên bố năng lực tại thời điểm kết nối:

- `caps`: các danh mục năng lực cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice` và `talk`.
- `commands`: danh sách cho phép lệnh để invoke.
- `permissions`: các nút bật/tắt chi tiết (ví dụ `screen.record`, `camera.capture`).

Gateway coi các mục này là **tuyên bố** và thực thi danh sách cho phép ở phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để giao diện có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị đó kết nối với cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Các nút đã kết nối báo cáo
  thời gian kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; các nút đã ghép đôi cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện nút đáng tin cậy cập nhật siêu dữ liệu ghép đôi của chúng.

### Sự kiện nút còn sống trong nền

Nút có thể gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một nút đã ghép đôi
đã còn sống trong một lần đánh thức nền mà không đánh dấu nó là đã kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Các chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện này chỉ bền vững cho các phiên thiết bị nút đã xác thực;
các phiên không có thiết bị hoặc chưa ghép đôi trả về `handled: false`.

Gateway thành công trả về một kết quả có cấu trúc:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway cũ hơn có thể vẫn trả về `{ "ok": true }` cho `node.event`; máy khách nên coi đó là một
RPC đã được xác nhận, không phải là việc lưu bền vững hiện diện.

## Phạm vi sự kiện phát sóng

Các sự kiện phát sóng WebSocket do máy chủ đẩy được kiểm soát theo phạm vi để các phiên chỉ có phạm vi ghép đôi hoặc chỉ dành cho nút không thụ động nhận nội dung phiên.

- **Khung trò chuyện, agent và kết quả công cụ** (bao gồm sự kiện `agent` được stream và kết quả lệnh gọi công cụ) yêu cầu ít nhất `operator.read`. Các phiên không có `operator.read` bỏ qua hoàn toàn các khung này.
- **Các phát sóng `plugin.*` do Plugin định nghĩa** được kiểm soát bằng `operator.write` hoặc `operator.admin`, tùy vào cách plugin đã đăng ký chúng.
- **Sự kiện trạng thái và truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để mọi phiên đã xác thực đều có thể quan sát tình trạng truyền tải.
- **Các họ sự kiện phát sóng không xác định** mặc định được kiểm soát theo phạm vi (đóng khi lỗi) trừ khi một handler đã đăng ký nới lỏng chúng một cách rõ ràng.

Mỗi kết nối máy khách giữ số thứ tự riêng theo máy khách để các phát sóng giữ thứ tự đơn điệu trên socket đó, ngay cả khi các máy khách khác nhau thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ phương thức RPC thường gặp

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export
phương thức plugin/kênh đã tải. Hãy coi nó là khám phá tính năng, không phải danh sách
liệt kê đầy đủ của `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về ảnh chụp nhanh tình trạng Gateway được lưu trong bộ nhớ đệm hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi độ ổn định chẩn đoán có giới hạn gần đây. Nó giữ siêu dữ liệu vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/plugin và mã định danh phiên. Nó không giữ văn bản trò chuyện, nội dung webhook, đầu ra công cụ, nội dung yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Cần phạm vi đọc của người vận hành.
    - `status` trả về tóm tắt Gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho máy khách người vận hành có phạm vi quản trị.
    - `gateway.identity.get` trả về danh tính thiết bị Gateway được các luồng relay và ghép đôi sử dụng.
    - `system-presence` trả về ảnh chụp nhanh hiện diện hiện tại cho các thiết bị người vận hành/node đã kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/phát sóng ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện Heartbeat mới nhất đã được lưu bền vững.
    - `set-heartbeats` bật/tắt xử lý Heartbeat trên Gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Truyền `{ "view": "configured" }` để lấy các mô hình đã cấu hình có kích thước phù hợp cho bộ chọn (`agents.defaults.models` trước, rồi đến `models.providers.*.models`), hoặc `{ "view": "all" }` để lấy toàn bộ danh mục.
    - `usage.status` trả về các cửa sổ sử dụng/tóm tắt hạn ngạch còn lại của nhà cung cấp.
    - `usage.cost` trả về tóm tắt chi phí sử dụng đã tổng hợp cho một khoảng ngày.
      Truyền `agentId` cho một agent, hoặc `agentScope: "all"` để tổng hợp các agent đã cấu hình.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của vector-memory / embedding đã lưu trong bộ nhớ đệm cho workspace agent mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi rõ ràng muốn ping nhà cung cấp embedding trực tiếp. Máy khách có nhận biết Dreaming cũng có thể truyền `{ "agentId": "agent-id" }` để giới hạn thống kê kho Dreaming vào workspace agent đã chọn; bỏ qua `agentId` sẽ giữ fallback agent mặc định và tổng hợp các workspace Dreaming đã cấu hình.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, và `doctor.memory.dedupeDreamDiary` chấp nhận tham số tùy chọn `{ "agentId": "agent-id" }` cho các chế độ xem/hành động Dreaming của agent đã chọn. Khi bỏ qua `agentId`, chúng hoạt động trên workspace agent mặc định đã cấu hình.
    - `doctor.memory.remHarness` trả về bản xem trước REM harness chỉ đọc, có giới hạn cho các máy khách mặt phẳng điều khiển từ xa. Nó có thể bao gồm đường dẫn workspace, đoạn trích bộ nhớ, markdown grounded đã render và ứng viên thăng cấp sâu, nên bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt sử dụng theo phiên. Truyền `agentId` cho một
      agent, hoặc `agentScope: "all"` để liệt kê các agent đã cấu hình cùng nhau.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình hỗ trợ đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/plugin tích hợp sẵn + đi kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có khả năng QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một thông báo đẩy APNs thử nghiệm đến node iOS đã đăng ký.
    - `voicewake.get` trả về các trigger từ khóa đánh thức đã lưu.
    - `voicewake.set` cập nhật các trigger từ khóa đánh thức và phát sóng thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi đi trực tiếp cho các lượt gửi nhắm đến kênh/tài khoản/luồng bên ngoài trình chạy trò chuyện.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với điều khiển con trỏ/giới hạn và số byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.catalog` trả về danh mục nhà cung cấp Talk chỉ đọc cho giọng nói, phiên âm truyền phát và giọng nói thời gian thực. Nó bao gồm mã định danh nhà cung cấp chuẩn, bí danh registry, nhãn, trạng thái đã cấu hình, kết quả `ready` tùy chọn ở cấp nhóm, mã định danh mô hình/giọng nói được hiển thị, chế độ chuẩn, transport, chiến lược brain, và cờ âm thanh/khả năng thời gian thực mà không trả về bí mật nhà cung cấp hoặc thay đổi cấu hình toàn cục. Các Gateway hiện tại đặt `ready` sau khi áp dụng lựa chọn nhà cung cấp runtime; máy khách nên xem việc thiếu nó là chưa được xác minh để tương thích với các Gateway cũ hơn.
    - `talk.config` trả về payload cấu hình Talk hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.session.create` tạo phiên Talk do Gateway sở hữu cho `realtime/gateway-relay`, `transcription/gateway-relay`, hoặc `stt-tts/managed-room`. Với `stt-tts/managed-room`, bên gọi `operator.write` truyền `sessionKey` cũng phải truyền `spawnedBy` để hiển thị khóa phiên theo phạm vi; tạo `sessionKey` không theo phạm vi và `brain: "direct-tools"` yêu cầu `operator.admin`.
    - `talk.session.join` xác thực token phiên managed-room, phát sự kiện `session.ready` hoặc `session.replaced` khi cần, và trả về siêu dữ liệu phòng/phiên cùng các sự kiện Talk gần đây mà không có token dạng văn bản thuần hoặc hash token đã lưu.
    - `talk.session.appendAudio` thêm âm thanh đầu vào PCM base64 vào các phiên relay thời gian thực và phiên âm do Gateway sở hữu.
    - `talk.session.startTurn`, `talk.session.endTurn`, và `talk.session.cancelTurn` điều khiển vòng đời lượt managed-room với từ chối lượt cũ trước khi trạng thái bị xóa.
    - `talk.session.cancelOutput` dừng đầu ra âm thanh của assistant, chủ yếu cho barge-in được VAD kiểm soát trong các phiên relay Gateway.
    - `talk.session.submitToolResult` hoàn tất một lệnh gọi công cụ của nhà cung cấp do phiên relay thời gian thực do Gateway sở hữu phát ra. Truyền `options: { willContinue: true }` cho đầu ra công cụ tạm thời khi kết quả cuối cùng sẽ theo sau, hoặc `options: { suppressResponse: true }` khi kết quả công cụ nên đáp ứng lệnh gọi nhà cung cấp mà không bắt đầu một phản hồi assistant thời gian thực khác.
    - `talk.session.steer` gửi điều khiển giọng nói của lượt chạy đang hoạt động vào phiên Talk có agent hậu thuẫn do Gateway sở hữu. Nó chấp nhận `{ sessionId, text, mode? }`, trong đó `mode` là `status`, `steer`, `cancel`, hoặc `followup`; chế độ bị bỏ qua được phân loại từ văn bản được nói.
    - `talk.session.close` đóng phiên relay, phiên âm hoặc managed-room do Gateway sở hữu và phát các sự kiện Talk kết thúc.
    - `talk.mode` đặt/phát sóng trạng thái chế độ Talk hiện tại cho máy khách WebChat/Control UI.
    - `talk.client.create` tạo phiên nhà cung cấp thời gian thực do máy khách sở hữu bằng `webrtc` hoặc `provider-websocket` trong khi Gateway sở hữu cấu hình, thông tin xác thực, chỉ dẫn và chính sách công cụ.
    - `talk.client.toolCall` cho phép transport thời gian thực do máy khách sở hữu chuyển tiếp các lệnh gọi công cụ của nhà cung cấp đến chính sách Gateway. Công cụ được hỗ trợ đầu tiên là `openclaw_agent_consult`; máy khách nhận mã định danh lượt chạy và chờ các sự kiện vòng đời trò chuyện bình thường trước khi gửi kết quả công cụ dành riêng cho nhà cung cấp.
    - `talk.client.steer` gửi điều khiển giọng nói của lượt chạy đang hoạt động cho transport thời gian thực do máy khách sở hữu. Gateway phân giải lượt chạy nhúng đang hoạt động từ `sessionKey` và trả về kết quả được chấp nhận/từ chối có cấu trúc thay vì âm thầm bỏ điều khiển.
    - `talk.event` là kênh sự kiện Talk duy nhất cho các adapter thời gian thực, phiên âm, STT/TTS, managed-room, điện thoại và cuộc họp.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp fallback và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về kho nhà cung cấp TTS hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và wizard">
    - `secrets.reload` phân giải lại các SecretRef đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công toàn bộ.
    - `secrets.resolve` phân giải các gán bí mật nhắm đến lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về ảnh chụp nhanh cấu hình hiện tại và hash.
    - `config.set` ghi một payload cấu hình đã được xác thực.
    - `config.patch` hợp nhất một bản cập nhật cấu hình một phần. Thay thế mảng có tính phá hủy
      yêu cầu đường dẫn bị ảnh hưởng trong `replacePaths`; các mảng lồng nhau
      bên dưới mục nhập mảng dùng đường dẫn `[]` như `agents.list[].skills`.
    - `config.apply` xác thực + thay thế toàn bộ payload cấu hình.
    - `config.schema` trả về payload schema cấu hình trực tiếp được Control UI và công cụ CLI sử dụng: schema, `uiHints`, phiên bản và siêu dữ liệu tạo, bao gồm siêu dữ liệu schema plugin + kênh khi runtime có thể tải được. Schema bao gồm siêu dữ liệu trường `title` / `description` được suy ra từ cùng nhãn và văn bản trợ giúp mà UI sử dụng, bao gồm các nhánh đối tượng lồng nhau, wildcard, mục mảng và thành phần `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về payload tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một node schema nông, gợi ý khớp + `hintPath`, `reloadKind` tùy chọn và tóm tắt con trực tiếp cho thao tác drill-down UI/CLI. `reloadKind` là một trong `restart`, `hot`, hoặc `none` và phản chiếu bộ lập kế hoạch tải lại cấu hình Gateway cho đường dẫn được yêu cầu. Các node schema tra cứu giữ tài liệu hướng tới người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, `reloadKind` tùy chọn, cùng `hint` / `hintPath` khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi chính bản cập nhật thành công; bên gọi có phiên có thể bao gồm `continuationMessage` để khi khởi động sẽ tiếp tục một lượt agent theo dõi thông qua hàng đợi tiếp tục sau khởi động lại. Cập nhật qua trình quản lý gói và cập nhật git-checkout được giám sát từ mặt phẳng điều khiển dùng bàn giao managed-service tách rời thay vì thay thế cây gói hoặc thay đổi đầu ra checkout/build bên trong Gateway đang chạy. Một bàn giao đã bắt đầu trả về `ok: true` với `result.reason: "managed-service-handoff-started"` và `handoff.status: "started"`; bàn giao không khả dụng hoặc thất bại trả về `ok: false` với `managed-service-handoff-unavailable` hoặc `managed-service-handoff-failed`, cùng `handoff.command` khi cần cập nhật shell thủ công. Bàn giao không khả dụng nghĩa là OpenClaw thiếu ranh giới supervisor an toàn hoặc danh tính dịch vụ bền vững, chẳng hạn `OPENCLAW_SYSTEMD_UNIT` cho systemd. Trong lúc bàn giao đã bắt đầu, sentinel khởi động lại có thể báo cáo ngắn gọn `stats.reason: "restart-health-pending"`; phần tiếp tục bị trì hoãn cho đến khi CLI xác minh Gateway đã khởi động lại và ghi sentinel `ok` cuối cùng.
    - `update.status` làm mới và trả về sentinel khởi động lại cập nhật mới nhất, bao gồm phiên bản đang chạy sau khởi động lại khi có.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` hiển thị onboarding wizard qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp tác tử và không gian làm việc">
    - `agents.list` trả về các mục tác tử đã cấu hình, bao gồm mô hình hiệu lực và siêu dữ liệu runtime.
    - `agents.create`, `agents.update`, và `agents.delete` quản lý bản ghi tác tử và kết nối không gian làm việc.
    - `agents.files.list`, `agents.files.get`, và `agents.files.set` quản lý các tệp không gian làm việc bootstrap được cung cấp cho một tác tử.
    - `tasks.list`, `tasks.get`, và `tasks.cancel` cung cấp sổ cái tác vụ Gateway cho SDK và ứng dụng khách vận hành.
    - `artifacts.list`, `artifacts.get`, và `artifacts.download` cung cấp bản tóm tắt tạo tác bắt nguồn từ bản ghi hội thoại và tải xuống cho phạm vi `sessionKey`, `runId`, hoặc `taskId` rõ ràng. Truy vấn lượt chạy và tác vụ phân giải phiên sở hữu ở phía máy chủ và chỉ trả về phương tiện bản ghi hội thoại có nguồn gốc khớp; nguồn URL không an toàn hoặc cục bộ trả về tải xuống không được hỗ trợ thay vì tìm nạp ở phía máy chủ.
    - `environments.list` và `environments.status` cung cấp khả năng khám phá môi trường chỉ đọc trên Gateway cục bộ và nút cho ứng dụng khách SDK.
    - `agent.identity.get` trả về danh tính trợ lý hiệu lực cho một tác tử hoặc phiên.
    - `agent.wait` chờ một lượt chạy kết thúc và trả về ảnh chụp nhanh cuối cùng khi có sẵn.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` theo từng hàng khi backend runtime tác tử được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho ứng dụng khách WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện bản ghi hội thoại/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước bản ghi hội thoại có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một mục tiêu phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào một phiên hiện có.
    - `sessions.steer` là biến thể ngắt và điều hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên. Trình gọi có thể truyền `key` cùng `runId` tùy chọn, hoặc chỉ truyền `runId` cho các lượt chạy đang hoạt động mà Gateway có thể phân giải về một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/ghi đè phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` hiệu lực.
    - `sessions.reset`, `sessions.delete`, và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu.
    - Thực thi trò chuyện vẫn dùng `chat.history`, `chat.send`, `chat.abort`, và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho ứng dụng khách UI: thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn) cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ sẽ bị loại bỏ, các hàng trợ lý chỉ có token im lặng như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.
    - `chat.message.get` là trình đọc toàn bộ tin nhắn có giới hạn bổ sung cho một mục bản ghi hội thoại hiển thị duy nhất. Ứng dụng khách truyền `sessionKey`, `agentId` tùy chọn khi lựa chọn phiên có phạm vi theo tác tử, cùng một `messageId` bản ghi hội thoại đã được cung cấp trước đó qua `chat.history`, và Gateway trả về cùng phép chiếu đã chuẩn hóa hiển thị mà không áp dụng giới hạn cắt ngắn lịch sử nhẹ khi mục đã lưu vẫn còn sẵn có và không quá lớn.
    - `chat.send` chấp nhận `fastMode: "auto"` một lượt để dùng chế độ nhanh cho các lệnh gọi mô hình bắt đầu trước ngưỡng tự động, rồi khởi chạy các lệnh gọi thử lại, fallback, kết quả công cụ, hoặc tiếp tục sau đó mà không dùng chế độ nhanh. Ngưỡng mặc định là 60 giây và có thể cấu hình theo từng mô hình bằng `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Trình gọi `chat.send` có thể truyền `fastAutoOnSeconds` một lượt để ghi đè ngưỡng cho yêu cầu đó.

  </Accordion>

  <Accordion title="Ghép đôi thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép đôi đang chờ xử lý và đã được phê duyệt.
    - `device.pair.approve`, `device.pair.reject`, và `device.pair.remove` quản lý bản ghi ghép đôi thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và giới hạn phạm vi của trình gọi.
    - `device.token.revoke` thu hồi token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và giới hạn phạm vi của trình gọi.

  </Accordion>

  <Accordion title="Ghép đôi nút, gọi lệnh và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, và `node.pair.verify` bao quát ghép đôi nút và xác minh bootstrap.
    - `node.list` và `node.describe` trả về trạng thái nút đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn nút đã ghép đôi.
    - `node.invoke` chuyển tiếp một lệnh đến nút đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu gọi lệnh.
    - `node.event` mang các sự kiện bắt nguồn từ nút trở lại Gateway.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi cho nút đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các nút ngoại tuyến/mất kết nối.

  </Accordion>

  <Accordion title="Nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, và `exec.approval.resolve` bao quát yêu cầu phê duyệt exec một lần cùng tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý ảnh chụp nhanh chính sách phê duyệt exec của Gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ của nút qua lệnh chuyển tiếp nút.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, và `plugin.approval.resolve` bao quát các luồng phê duyệt do plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc ở Heartbeat tiếp theo; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - `cron.run` vẫn là RPC kiểu đưa vào hàng đợi cho các lượt chạy thủ công. Ứng dụng khách cần ngữ nghĩa hoàn tất nên đọc `runId` được trả về và thăm dò `cron.runs`.
    - `cron.runs` chấp nhận bộ lọc `runId` không rỗng tùy chọn để ứng dụng khách có thể theo dõi một lượt chạy thủ công đã xếp hàng mà không bị tranh chấp với các mục lịch sử khác của cùng công việc.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: cập nhật trò chuyện UI như `chat.inject` và các sự kiện trò chuyện chỉ liên quan đến bản ghi hội thoại khác. Trong giao thức v4, payload delta mang `deltaText`; `message` vẫn là ảnh chụp nhanh trợ lý tích lũy. Các thay thế không phải tiền tố đặt `replace=true` và dùng `deltaText` làm văn bản thay thế.
- `session.message`, `session.operation`, và `session.tool`: cập nhật bản ghi hội thoại, thao tác phiên đang diễn ra, và luồng sự kiện cho một phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: cập nhật ảnh chụp nhanh hiện diện hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: cập nhật ảnh chụp nhanh sức khỏe Gateway.
- `heartbeat`: cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi lượt chạy/công việc Cron.
- `shutdown`: thông báo tắt Gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép đôi nút.
- `node.invoke.request`: phát quảng bá yêu cầu gọi lệnh nút.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép đôi.
- `voicewake.changed`: cấu hình kích hoạt từ đánh thức đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt plugin.

### Phương thức trợ giúp nút

- Nút có thể gọi `skills.bins` để lấy danh sách hiện tại các tệp thực thi kỹ năng cho kiểm tra tự động cho phép.

### RPC sổ cái tác vụ

Ứng dụng khách vận hành có thể kiểm tra và hủy các bản ghi tác vụ nền Gateway thông qua RPC sổ cái tác vụ. Các phương thức này trả về tóm tắt tác vụ đã làm sạch, không phải trạng thái runtime thô.

- `tasks.list` yêu cầu `operator.read`.
  - Tham số: `status` tùy chọn (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"`, hoặc `"timed_out"`) hoặc một mảng các trạng thái đó, `agentId` tùy chọn, `sessionKey` tùy chọn, `limit` tùy chọn từ `1` đến `500`, và chuỗi `cursor` tùy chọn.
  - Kết quả: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` yêu cầu `operator.read`.
  - Tham số: `{ "taskId": string }`.
  - Kết quả: `{ "task": TaskSummary }`.
  - ID tác vụ bị thiếu trả về dạng lỗi không tìm thấy của Gateway.
- `tasks.cancel` yêu cầu `operator.write`.
  - Tham số: `{ "taskId": string, "reason"?: string }`.
  - Kết quả:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` báo cáo liệu sổ cái có tác vụ khớp hay không. `cancelled` báo cáo liệu runtime đã chấp nhận hoặc ghi nhận việc hủy hay chưa.

`TaskSummary` bao gồm `id`, `status`, và siêu dữ liệu tùy chọn như `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, dấu thời gian, tiến độ, tóm tắt cuối cùng, và văn bản lỗi đã làm sạch. `agentId` xác định tác tử đang thực thi tác vụ; `sessionKey` và `ownerKey` giữ lại ngữ cảnh bên yêu cầu và điều khiển.

### Phương thức trợ giúp vận hành

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh runtime
  cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có `/` ở đầu
    - `native` và đường dẫn mặc định `both` trả về tên native nhận biết provider
      khi có sẵn
  - `textAliases` mang các bí danh slash chính xác như `/model` và `/m`.
  - `nativeName` mang tên lệnh native nhận biết provider khi tồn tại.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cùng tính khả dụng của lệnh Plugin
    native.
  - `includeArgs=false` bỏ qua metadata đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy danh mục công cụ runtime cho một
  agent. Phản hồi bao gồm các công cụ được nhóm và metadata nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu Plugin khi `source="plugin"`
  - `optional`: công cụ Plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực runtime
  cho một phiên.
  - Bắt buộc có `sessionKey`.
  - Gateway suy ra ngữ cảnh runtime tin cậy từ phiên ở phía máy chủ thay vì chấp nhận
    ngữ cảnh xác thực hoặc phân phối do bên gọi cung cấp.
  - Phản hồi là một phép chiếu theo phạm vi phiên, do máy chủ suy ra, của danh mục đang hoạt động,
    bao gồm các công cụ core, Plugin, channel và công cụ máy chủ MCP đã được phát hiện.
  - `tools.effective` là chỉ đọc đối với MCP: nó có thể chiếu danh mục MCP của phiên đã warm qua
    chính sách công cụ cuối cùng, nhưng không tạo runtime MCP, kết nối transport, hoặc phát
    `tools/list`. Nếu không có danh mục warm khớp, phản hồi có thể bao gồm thông báo như
    `mcp-not-yet-connected`, `mcp-not-yet-listed`, hoặc `mcp-stale-catalog`.
  - Các mục công cụ hiệu lực dùng `source="core"`, `source="plugin"`, `source="channel"`, hoặc
    `source="mcp"`.
- Người vận hành có thể gọi `tools.invoke` (`operator.write`) để gọi một công cụ khả dụng qua cùng
  đường dẫn chính sách Gateway như `/tools/invoke`.
  - Bắt buộc có `name`. `args`, `sessionKey`, `agentId`, `confirm`, và
    `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều hiện diện, agent của phiên được phân giải phải khớp
    `agentId`.
  - Các wrapper core chỉ dành cho chủ sở hữu như `cron`, `gateway`, và `nodes` yêu cầu
    danh tính chủ sở hữu/quản trị (`operator.admin`) dù chính phương thức `tools.invoke`
    là `operator.write`.
  - Phản hồi là một envelope hướng SDK với các trường `ok`, `toolName`, `output` tùy chọn, và
    `error` có kiểu. Từ chối do phê duyệt hoặc chính sách trả về `ok:false` trong payload thay vì
    bỏ qua pipeline chính sách công cụ Gateway.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy danh mục skill
  hiển thị cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - Phản hồi bao gồm điều kiện đủ, yêu cầu còn thiếu, kiểm tra cấu hình, và
    tùy chọn cài đặt đã được làm sạch mà không lộ giá trị bí mật thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) cho
  metadata khám phá ClawHub.
- Người vận hành có thể gọi `skills.upload.begin`, `skills.upload.chunk`, và
  `skills.upload.commit` (`operator.admin`) để staging một kho lưu trữ skill riêng tư
  trước khi cài đặt. Đây là đường dẫn tải lên quản trị riêng cho client tin cậy,
  không phải luồng cài đặt skill ClawHub thông thường, và mặc định bị tắt trừ khi
  `skills.install.allowUploadedArchives` được bật.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tạo một lượt tải lên gắn với slug và giá trị force đó.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` nối thêm byte tại
    offset đã giải mã chính xác.
  - `skills.upload.commit({ uploadId, sha256? })` xác minh kích thước cuối cùng và
    SHA-256. Commit chỉ hoàn tất lượt tải lên; nó không cài đặt skill.
  - Kho lưu trữ skill đã tải lên là kho lưu trữ zip chứa root `SKILL.md`. Tên thư mục
    bên trong kho lưu trữ không bao giờ chọn đích cài đặt.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở ba chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một
    thư mục skill vào thư mục `skills/` của workspace agent mặc định.
  - Chế độ tải lên: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    cài đặt một lượt tải lên đã commit vào thư mục `skills/<slug>` của workspace agent
    mặc định. Slug và giá trị force phải khớp với yêu cầu
    `skills.upload.begin` ban đầu. Chế độ này bị từ chối trừ khi
    `skills.install.allowUploadedArchives` được bật. Thiết lập này không
    ảnh hưởng đến cài đặt ClawHub.
  - Chế độ trình cài đặt Gateway: `{ name, installId, timeoutMs? }`
    chạy một hành động `metadata.openclaw.install` đã khai báo trên host Gateway.
    Client cũ vẫn có thể gửi `dangerouslyForceUnsafeInstall`; trường này đã
    lỗi thời, chỉ được chấp nhận để tương thích giao thức, và bị bỏ qua. Dùng
    `security.installPolicy` cho quyết định cài đặt do người vận hành sở hữu.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả cài đặt ClawHub được theo dõi trong
    workspace agent mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`,
    `apiKey`, và `env`.

### Các chế độ xem của `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi runtime hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là danh mục được cho phép, bao gồm các model được phát hiện động cho mục `provider/*`. Nếu không, phản hồi là toàn bộ danh mục Gateway.
- `"configured"`: hành vi có kích thước phù hợp cho bộ chọn. Nếu `agents.defaults.models` được cấu hình, nó vẫn thắng, bao gồm khám phá theo phạm vi provider cho mục `provider/*`. Khi không có allowlist, phản hồi dùng các mục `models.providers.*.models` rõ ràng, chỉ fallback về toàn bộ danh mục khi không tồn tại hàng model đã cấu hình nào.
- `"all"`: toàn bộ danh mục Gateway, bỏ qua `agents.defaults.models`. Dùng mục này cho chẩn đoán và UI khám phá, không dùng cho bộ chọn model thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, Gateway phát `exec.approval.requested`.
- Client người vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu phạm vi `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata phiên canonical). Yêu cầu thiếu `systemRunPlan` sẽ bị từ chối.
- Sau khi được phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ tái sử dụng
  `systemRunPlan` canonical đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId`, hoặc
  `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` đã được phê duyệt cuối cùng, thì
  Gateway từ chối lượt chạy thay vì tin payload đã bị thay đổi.

## Fallback phân phối agent

- Yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối ra ngoài.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: đích phân phối không phân giải được hoặc chỉ nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép fallback sang thực thi chỉ theo phiên khi không phân giải được tuyến có thể phân phối bên ngoài (ví dụ phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).
- Kết quả `agent` cuối cùng có thể bao gồm `result.deliveryStatus` khi đã yêu cầu
  phân phối, dùng cùng các trạng thái `sent`, `suppressed`, `partial_failed`, và `failed`
  được ghi tài liệu cho [`openclaw agent --json --deliver`](/vi/cli/agent#json-delivery-status).

## Phiên bản

- `PROTOCOL_VERSION` nằm trong `packages/gateway-protocol/src/version.ts`.
- Client gửi `minProtocol` + `maxProtocol`; máy chủ từ chối các dải
  không bao gồm giao thức hiện tại của nó. Client và máy chủ hiện tại yêu cầu
  giao thức v4.
- Schema + model được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số client

Client tham chiếu trong `src/gateway/client.ts` dùng các mặc định này. Giá trị
ổn định trên toàn giao thức v4 và là baseline dự kiến cho client bên thứ ba.

| Hằng số                                  | Mặc định                                               | Nguồn                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Thời gian chờ yêu cầu (mỗi RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Thời gian chờ Preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env có thể tăng ngân sách máy chủ/client đi cặp) |
| Backoff kết nối lại ban đầu                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Giới hạn thử lại nhanh sau khi đóng device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Khoảng chờ Force-stop trước `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Thời gian chờ mặc định của `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do hết thời gian tick                        | code `4000` khi im lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Máy chủ quảng bá `policy.tickIntervalMs`, `policy.maxPayload`,
và `policy.maxBufferedBytes` hiệu lực trong `hello-ok`; client nên tuân thủ các giá trị đó
thay vì các mặc định trước handshake.

## Xác thực

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy thuộc vào chế độ xác thực đã cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc non-loopback
  `gateway.auth.mode: "trusted-proxy"` đáp ứng kiểm tra xác thực kết nối từ
  header yêu cầu thay vì `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` bỏ qua hoàn toàn xác thực kết nối
  bằng bí mật dùng chung; không để lộ chế độ đó trên ingress công khai/không tin cậy.
- Sau khi ghép nối, Gateway cấp một **mã thông báo thiết bị** giới hạn theo
  vai trò + phạm vi của kết nối. Mã này được trả về trong
  `hello-ok.auth.deviceToken` và nên được client lưu bền vững cho các lần kết nối sau.
- Client nên lưu bền vững `hello-ok.auth.deviceToken` chính sau bất kỳ lần
  kết nối thành công nào.
- Kết nối lại bằng mã thông báo thiết bị **đã lưu** đó cũng nên tái sử dụng
  tập phạm vi đã phê duyệt được lưu cho mã đó. Việc này bảo toàn quyền truy cập
  đọc/thăm dò/trạng thái đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại
  thành phạm vi ngầm định chỉ dành cho admin.
- Lắp ráp xác thực kết nối phía client (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` là độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: mã dùng chung rõ ràng trước,
    sau đó là `deviceToken` rõ ràng, rồi đến mã thông báo theo thiết bị đã lưu
    (khóa theo `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được
    `auth.token`. Mã dùng chung hoặc bất kỳ mã thông báo thiết bị đã phân giải nào
    đều chặn nó.
  - Tự động nâng cấp mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được cho phép với **endpoint đáng tin cậy** —
    loopback, hoặc `wss://` với `tlsFingerprint` đã ghim. `wss://` công khai
    không ghim thì không đủ điều kiện.
- Bootstrap bằng mã thiết lập tích hợp sẵn trả về
  `hello-ok.auth.deviceToken` của nút chính cùng một mã thông báo người vận hành
  có giới hạn trong `hello-ok.auth.deviceTokens` để bàn giao di động đáng tin cậy.
  Mã thông báo người vận hành bao gồm `operator.talk.secrets` để đọc cấu hình
  Talk native, nhưng loại trừ các phạm vi thay đổi ghép nối và `operator.admin`.
- Khi bootstrap bằng mã thiết lập không phải baseline đang chờ phê duyệt, chi tiết
  `PAIRING_REQUIRED` bao gồm `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  và `pauseReconnect: false`. Client nên tiếp tục kết nối lại bằng cùng
  bootstrap token cho đến khi yêu cầu được phê duyệt hoặc mã trở nên không hợp lệ.
- Chỉ lưu bền vững `hello-ok.auth.deviceTokens` khi kết nối đã dùng xác thực bootstrap
  trên một transport đáng tin cậy như `wss://` hoặc ghép nối loopback/local.
- Nếu client cung cấp một `deviceToken` **rõ ràng** hoặc `scopes` rõ ràng, tập
  phạm vi do caller yêu cầu đó vẫn là nguồn thẩm quyền; phạm vi trong cache chỉ
  được tái sử dụng khi client đang tái sử dụng mã thông báo theo thiết bị đã lưu.
- Mã thông báo thiết bị có thể được xoay vòng/thu hồi qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`). Xoay vòng hoặc
  thu hồi một nút hoặc vai trò không phải người vận hành khác cũng yêu cầu `operator.admin`.
- `device.token.rotate` trả về metadata xoay vòng. Nó chỉ echo mã bearer thay thế
  cho các lệnh gọi cùng thiết bị đã được xác thực bằng chính mã thông báo thiết bị đó,
  để client chỉ dùng mã thông báo có thể lưu mã thay thế trước khi kết nối lại.
  Các thao tác xoay vòng bằng bí mật dùng chung/admin không echo mã bearer.
- Việc cấp, xoay vòng và thu hồi mã thông báo vẫn bị giới hạn trong tập vai trò
  đã phê duyệt được ghi trong mục ghép nối của thiết bị đó; thay đổi mã thông báo
  không thể mở rộng hoặc nhắm tới vai trò thiết bị mà phê duyệt ghép nối chưa từng cấp.
- Với phiên mã thông báo của thiết bị đã ghép nối, quản lý thiết bị được giới hạn
  trong chính nó trừ khi caller cũng có `operator.admin`: caller không phải admin
  chỉ có thể quản lý mã thông báo người vận hành cho mục thiết bị **của chính họ**.
  Quản lý mã thông báo nút và các mã không phải người vận hành khác chỉ dành cho admin,
  ngay cả với thiết bị của chính caller.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi mã thông báo
  người vận hành đích so với phạm vi phiên hiện tại của caller. Caller không phải admin
  không thể xoay vòng hoặc thu hồi một mã thông báo người vận hành rộng hơn mã họ đang có.
- Lỗi xác thực bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi client cho `AUTH_TOKEN_MISMATCH`:
  - Client đáng tin cậy có thể thử lại một lần có giới hạn bằng mã thông báo theo thiết bị trong cache.
  - Nếu lần thử lại đó thất bại, client nên dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho người vận hành.
- `AUTH_SCOPE_MISMATCH` nghĩa là mã thông báo thiết bị đã được nhận diện nhưng không bao phủ
  vai trò/phạm vi được yêu cầu. Client không nên trình bày lỗi này như một mã thông báo sai;
  hãy nhắc người vận hành ghép nối lại hoặc phê duyệt hợp đồng phạm vi hẹp hơn/rộng hơn.

## Danh tính thiết bị + ghép nối

- Các nút nên bao gồm danh tính thiết bị ổn định (`device.id`) được suy ra từ
  fingerprint của keypair.
- Gateway cấp mã thông báo theo thiết bị + vai trò.
- Phê duyệt ghép nối là bắt buộc cho ID thiết bị mới trừ khi tự động phê duyệt local
  được bật.
- Tự động phê duyệt ghép nối tập trung vào các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường dẫn tự kết nối backend/container-local hẹp cho
  các luồng helper bí mật dùng chung đáng tin cậy.
- Các kết nối tailnet hoặc LAN cùng host vẫn được xem là từ xa cho ghép nối và
  yêu cầu phê duyệt.
- Client WS thường bao gồm danh tính `device` trong khi `connect` (người vận hành +
  nút). Các ngoại lệ người vận hành không có thiết bị duy nhất là các đường dẫn tin cậy rõ ràng:
  - `gateway.controlUi.allowInsecureAuth=true` cho tương thích HTTP không an toàn chỉ trên localhost.
  - xác thực Control UI người vận hành `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` qua direct-loopback trên đường dẫn helper nội bộ
    được dành riêng.
- Bỏ qua danh tính thiết bị có hệ quả về phạm vi. Khi kết nối người vận hành không có thiết bị
  được cho phép qua một đường dẫn tin cậy rõ ràng, OpenClaw vẫn xóa các phạm vi
  tự khai báo thành tập rỗng trừ khi đường dẫn đó có một ngoại lệ bảo toàn
  phạm vi được đặt tên. Khi đó các phương thức có kiểm soát phạm vi sẽ thất bại với
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` là một đường dẫn break-glass
  bảo toàn phạm vi của Control UI. Nó không cấp phạm vi cho các client WebSocket
  backend tùy chỉnh hoặc dạng CLI tùy ý.
- Đường dẫn helper backend `gateway-client` direct-loopback được dành riêng chỉ bảo toàn
  phạm vi cho các RPC control-plane local nội bộ; ID backend tùy chỉnh không
  nhận ngoại lệ này.
- Tất cả kết nối phải ký nonce `connect.challenge` do server cung cấp.

### Chẩn đoán di trú xác thực thiết bị

Đối với client cũ vẫn dùng hành vi ký trước challenge, `connect` nay trả về
mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` cùng `error.details.reason` ổn định.

Các lỗi di trú thường gặp:

| Thông báo                   | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi trống).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client đã ký bằng nonce cũ/sai.                    |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp payload v2.              |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp đã ký nằm ngoài độ lệch cho phép.        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp fingerprint khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.       |

Mục tiêu di trú:

- Luôn chờ `connect.challenge`.
- Ký payload v2 có bao gồm nonce của server.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  ngoài các trường device/client/role/scopes/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận vì tương thích, nhưng việc ghim metadata
  thiết bị đã ghép nối vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Client có thể tùy chọn ghim fingerprint chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này phơi bày **toàn bộ API Gateway** (trạng thái, kênh, mô hình, chat,
agent, phiên, nút, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi
schema TypeBox trong `packages/gateway-protocol/src/schema.ts`.

## Liên quan

- [Giao thức bridge](/vi/gateway/bridge-protocol)
- [Runbook Gateway](/vi/gateway)
