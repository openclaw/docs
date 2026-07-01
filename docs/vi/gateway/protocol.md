---
read_when:
    - Triển khai hoặc cập nhật các client WS của Gateway
    - Gỡ lỗi các điểm không khớp giao thức hoặc lỗi kết nối
    - Đang tạo lại schema/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-07-01T08:14:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức Gateway WS là **mặt phẳng điều khiển + truyền tải nút duy nhất** cho
OpenClaw. Tất cả client (CLI, giao diện web, ứng dụng macOS, nút iOS/Android,
nút headless) kết nối qua WebSocket và khai báo **role** + **scope** của chúng
tại thời điểm bắt tay.

## Truyền tải

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **phải** là yêu cầu `connect`.
- Các khung trước khi kết nối được giới hạn ở 64 KiB. Sau khi bắt tay thành công, client
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  khung gửi vào quá lớn và bộ đệm gửi ra chậm sẽ phát sự kiện `payload.large`
  trước khi gateway đóng hoặc loại bỏ khung bị ảnh hưởng. Các sự kiện này giữ
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ thân thông điệp,
  nội dung tệp đính kèm, thân khung thô, token, cookie hoặc giá trị bí mật.

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

Trong khi Gateway vẫn đang hoàn tất các sidecar khởi động, yêu cầu `connect` có thể
trả về lỗi `UNAVAILABLE` có thể thử lại với `details.reason` được đặt thành
`"startup-sidecars"` và `retryAfterMs`. Client nên thử lại phản hồi đó
trong ngân sách kết nối tổng thể của mình thay vì hiển thị nó như một lỗi
bắt tay cuối cùng.

`server`, `features`, `snapshot` và `policy` đều là bắt buộc theo schema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` cũng bắt buộc và báo cáo
role/scope đã thương lượng. `pluginSurfaceUrls` là tùy chọn và ánh xạ tên bề mặt plugin,
chẳng hạn như `canvas`, tới URL được lưu trữ theo phạm vi.

URL bề mặt plugin theo phạm vi có thể hết hạn. Nút có thể gọi
`node.pluginSurface.refresh` với `{ "surface": "canvas" }` để nhận một mục mới
trong `pluginSurfaceUrls`. Bản tái cấu trúc Plugin Canvas thử nghiệm không
hỗ trợ đường tương thích đã ngừng dùng `canvasHostUrl`, `canvasCapability` hoặc
`node.canvas.capability.refresh`; client native và gateway hiện tại phải dùng bề mặt plugin.

Khi không có token thiết bị nào được cấp, `hello-ok.auth` báo cáo các quyền đã thương lượng
không có trường token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Client backend cùng tiến trình đáng tin cậy (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên kết nối loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu gateway dùng chung. Đường này được dành riêng
cho RPC mặt phẳng điều khiển nội bộ và ngăn baseline ghép nối CLI/thiết bị đã cũ
chặn công việc backend cục bộ như cập nhật phiên subagent. Client từ xa,
client có nguồn gốc trình duyệt, client nút và client dùng token thiết bị/danh tính thiết bị
rõ ràng vẫn dùng các bước kiểm tra ghép nối và nâng cấp phạm vi thông thường.

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

Bootstrap mã QR/mã thiết lập tích hợp là đường bàn giao di động mới. Một kết nối
setup-code baseline thành công trả về một token nút chính cộng với một token
operator có giới hạn:

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

Bàn giao operator được giới hạn có chủ ý để onboarding QR có thể khởi động vòng lặp
operator di động mà không cấp `operator.admin` hoặc `operator.pairing`.
Nó có bao gồm `operator.talk.secrets` để client native có thể đọc cấu hình Talk
cần thiết sau bootstrap. Phạm vi admin và ghép nối rộng hơn yêu cầu
một luồng ghép nối operator hoặc token riêng đã được phê duyệt. Client chỉ nên lưu
`hello-ok.auth.deviceTokens` khi kết nối đã dùng xác thực bootstrap trên truyền tải
đáng tin cậy như `wss://` hoặc ghép nối loopback/cục bộ.

### Ví dụ node

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

## Role + scope

Để xem đầy đủ mô hình phạm vi operator, kiểm tra tại thời điểm phê duyệt và
ngữ nghĩa shared-secret, hãy xem [Phạm vi operator](/vi/gateway/operator-scopes).

### Role

- `operator` = client mặt phẳng điều khiển (CLI/UI/tự động hóa).
- `node` = host năng lực (camera/screen/canvas/system.run).

### Scope (operator)

Các phạm vi phổ biến:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` với `includeSecrets: true` yêu cầu `operator.talk.secrets`
(hoặc `operator.admin`).
Khi bao gồm secret, client nên đọc thông tin xác thực nhà cung cấp Talk đang hoạt động
từ `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
giữ nguyên hình dạng nguồn và có thể là đối tượng SecretRef hoặc chuỗi đã được biên tập.

Các phương thức RPC Gateway do plugin đăng ký có thể yêu cầu phạm vi operator riêng,
nhưng các tiền tố admin lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi phương thức chỉ là cổng đầu tiên. Một số lệnh slash đi qua
`chat.send` áp dụng kiểm tra cấp lệnh nghiêm ngặt hơn ở phía trên. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có thêm một kiểm tra phạm vi tại thời điểm phê duyệt bên trên
phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có lệnh nút không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nút khai báo các xác nhận năng lực tại thời điểm kết nối:

- `caps`: các danh mục năng lực cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice` và `talk`.
- `commands`: danh sách cho phép lệnh để invoke.
- `permissions`: các công tắc chi tiết (ví dụ `screen.record`, `camera.capture`).

Gateway coi chúng là **xác nhận** và thực thi danh sách cho phép phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị đó kết nối dưới cả **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Nút đã kết nối báo cáo
  thời điểm kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; nút đã ghép nối cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện nút đáng tin cậy cập nhật metadata ghép nối của chúng.

### Sự kiện node còn hoạt động trong nền

Nút có thể gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một nút đã ghép nối
còn hoạt động trong một lần đánh thức nền mà không đánh dấu nó là đã kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững cho phiên thiết bị nút đã xác thực;
phiên không có thiết bị hoặc chưa ghép nối trả về `handled: false`.

Gateway thành công trả về kết quả có cấu trúc:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway cũ hơn vẫn có thể trả về `{ "ok": true }` cho `node.event`; client nên coi đó là một
RPC đã được xác nhận, không phải là lưu bền vững hiện diện.

## Phạm vi sự kiện broadcast

Các sự kiện broadcast WebSocket do máy chủ đẩy được kiểm soát theo phạm vi để phiên chỉ có phạm vi ghép nối hoặc chỉ dành cho nút không thụ động nhận nội dung phiên.

- **Khung chat, agent và kết quả công cụ** (bao gồm sự kiện `agent` được stream và kết quả lời gọi công cụ) yêu cầu ít nhất `operator.read`. Phiên không có `operator.read` bỏ qua hoàn toàn các khung này.
- **Broadcast `plugin.*` do Plugin định nghĩa** được kiểm soát bằng `operator.write` hoặc `operator.admin`, tùy theo cách Plugin đăng ký chúng.
- **Sự kiện trạng thái và truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để mọi phiên đã xác thực đều quan sát được tình trạng truyền tải.
- **Nhóm sự kiện broadcast không xác định** mặc định được kiểm soát theo phạm vi (fail-closed) trừ khi một handler đã đăng ký nới lỏng chúng một cách rõ ràng.

Mỗi kết nối client giữ số thứ tự riêng theo từng client để broadcast duy trì thứ tự đơn điệu trên socket đó ngay cả khi các client khác nhau thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các nhóm phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là bản xuất được tạo tự động — `hello-ok.features.methods` là danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các
export phương thức plugin/kênh đã tải. Hãy coi nó là khám phá tính năng, không phải là
liệt kê đầy đủ `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về ảnh chụp tình trạng Gateway được lưu trong bộ nhớ đệm hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi ổn định chẩn đoán có giới hạn gần đây. Nó giữ siêu dữ liệu vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và id phiên. Nó không giữ văn bản trò chuyện, nội dung Webhook, đầu ra công cụ, nội dung yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Cần phạm vi đọc của người vận hành.
    - `status` trả về tóm tắt Gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho máy khách người vận hành trong phạm vi quản trị.
    - `gateway.identity.get` trả về danh tính thiết bị Gateway được dùng bởi các luồng chuyển tiếp và ghép đôi.
    - `system-presence` trả về ảnh chụp hiện diện hiện tại cho các thiết bị người vận hành/Node đã kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/phát sóng ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện Heartbeat mới nhất đã được lưu.
    - `set-heartbeats` bật/tắt xử lý Heartbeat trên Gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Truyền `{ "view": "configured" }` cho các mô hình đã cấu hình có kích thước phù hợp bộ chọn (`agents.defaults.models` trước, rồi `models.providers.*.models`), hoặc `{ "view": "all" }` cho danh mục đầy đủ.
    - `usage.status` trả về các cửa sổ sử dụng nhà cung cấp/tóm tắt hạn mức còn lại.
    - `usage.cost` trả về tóm tắt mức sử dụng chi phí tổng hợp cho một khoảng ngày.
      Truyền `agentId` cho một agent, hoặc `agentScope: "all"` để tổng hợp các agent đã cấu hình.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của bộ nhớ vector / embedding được lưu trong bộ nhớ đệm cho workspace agent mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi rõ ràng muốn ping nhà cung cấp embedding trực tiếp. Các máy khách nhận biết Dreaming cũng có thể truyền `{ "agentId": "agent-id" }` để giới hạn thống kê kho Dreaming vào workspace agent đã chọn; bỏ qua `agentId` sẽ giữ fallback agent mặc định và tổng hợp các workspace Dreaming đã cấu hình.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` và `doctor.memory.dedupeDreamDiary` chấp nhận tham số `{ "agentId": "agent-id" }` tùy chọn cho các chế độ xem/hành động Dreaming của agent đã chọn. Khi bỏ qua `agentId`, chúng hoạt động trên workspace agent mặc định đã cấu hình.
    - `doctor.memory.remHarness` trả về bản xem trước harness REM chỉ đọc, có giới hạn cho các máy khách mặt phẳng điều khiển từ xa. Nó có thể bao gồm đường dẫn workspace, đoạn trích bộ nhớ, markdown đã kết xuất có căn cứ và ứng viên thăng hạng sâu, nên bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt mức sử dụng theo phiên. Truyền `agentId` cho một
      agent, hoặc `agentScope: "all"` để liệt kê các agent đã cấu hình cùng nhau.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình trợ giúp đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/Plugin tích hợp sẵn + đi kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh đó hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có khả năng QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một thông báo đẩy APNs thử nghiệm đến Node iOS đã đăng ký.
    - `voicewake.get` trả về các trình kích hoạt từ đánh thức đã lưu.
    - `voicewake.set` cập nhật các trình kích hoạt từ đánh thức và phát sóng thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi đi trực tiếp cho các lượt gửi nhắm đến kênh/tài khoản/luồng bên ngoài trình chạy trò chuyện.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với con trỏ/giới hạn và các điều khiển số byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.catalog` trả về danh mục nhà cung cấp Talk chỉ đọc cho giọng nói, phiên âm phát trực tuyến và giọng nói thời gian thực. Nó bao gồm mã định danh nhà cung cấp, nhãn, trạng thái đã cấu hình, mã định danh mô hình/giọng nói được hiển thị, các chế độ chuẩn, cơ chế truyền tải, chiến lược não và cờ âm thanh/khả năng thời gian thực mà không trả về bí mật của nhà cung cấp hoặc sửa đổi cấu hình toàn cục.
    - `talk.config` trả về tải trọng cấu hình Talk có hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.session.create` tạo một phiên Talk do Gateway sở hữu cho `realtime/gateway-relay`, `transcription/gateway-relay`, hoặc `stt-tts/managed-room`. Với `stt-tts/managed-room`, bên gọi `operator.write` truyền `sessionKey` cũng phải truyền `spawnedBy` để có khả năng hiển thị khóa phiên theo phạm vi; việc tạo `sessionKey` không theo phạm vi và `brain: "direct-tools"` yêu cầu `operator.admin`.
    - `talk.session.join` xác thực mã thông báo phiên phòng được quản lý, phát các sự kiện `session.ready` hoặc `session.replaced` khi cần, và trả về siêu dữ liệu phòng/phiên cùng các sự kiện Talk gần đây mà không có mã thông báo văn bản thuần hoặc hàm băm mã thông báo đã lưu.
    - `talk.session.appendAudio` nối âm thanh đầu vào PCM base64 vào các phiên chuyển tiếp thời gian thực và phiên âm do Gateway sở hữu.
    - `talk.session.startTurn`, `talk.session.endTurn`, và `talk.session.cancelTurn` điều khiển vòng đời lượt trong phòng được quản lý với việc từ chối lượt cũ trước khi trạng thái bị xóa.
    - `talk.session.cancelOutput` dừng đầu ra âm thanh của trợ lý, chủ yếu cho việc chen ngang có kiểm soát bằng VAD trong các phiên chuyển tiếp Gateway.
    - `talk.session.submitToolResult` hoàn tất một lệnh gọi công cụ của nhà cung cấp do một phiên chuyển tiếp thời gian thực do Gateway sở hữu phát ra. Truyền `options: { willContinue: true }` cho đầu ra công cụ tạm thời khi sẽ có kết quả cuối cùng theo sau, hoặc `options: { suppressResponse: true }` khi kết quả công cụ phải đáp ứng lệnh gọi của nhà cung cấp mà không bắt đầu một phản hồi trợ lý thời gian thực khác.
    - `talk.session.steer` gửi điều khiển giọng nói của lượt chạy đang hoạt động vào một phiên Talk được hỗ trợ bởi tác nhân và do Gateway sở hữu. Nó chấp nhận `{ sessionId, text, mode? }`, trong đó `mode` là `status`, `steer`, `cancel`, hoặc `followup`; chế độ bị bỏ qua sẽ được phân loại từ văn bản được nói.
    - `talk.session.close` đóng một phiên chuyển tiếp, phiên âm hoặc phòng được quản lý do Gateway sở hữu và phát các sự kiện Talk kết thúc.
    - `talk.mode` đặt/phát trạng thái chế độ Talk hiện tại cho các máy khách WebChat/Control UI.
    - `talk.client.create` tạo một phiên nhà cung cấp thời gian thực do máy khách sở hữu bằng `webrtc` hoặc `provider-websocket` trong khi Gateway sở hữu cấu hình, thông tin xác thực, hướng dẫn và chính sách công cụ.
    - `talk.client.toolCall` cho phép các cơ chế truyền tải thời gian thực do máy khách sở hữu chuyển tiếp lệnh gọi công cụ của nhà cung cấp đến chính sách Gateway. Công cụ được hỗ trợ đầu tiên là `openclaw_agent_consult`; máy khách nhận mã định danh lượt chạy và chờ các sự kiện vòng đời trò chuyện bình thường trước khi gửi kết quả công cụ dành riêng cho nhà cung cấp.
    - `talk.client.steer` gửi điều khiển giọng nói của lượt chạy đang hoạt động cho các cơ chế truyền tải thời gian thực do máy khách sở hữu. Gateway phân giải lượt chạy nhúng đang hoạt động từ `sessionKey` và trả về kết quả chấp nhận/từ chối có cấu trúc thay vì âm thầm bỏ điều khiển.
    - `talk.event` là kênh sự kiện Talk duy nhất cho các bộ chuyển đổi thời gian thực, phiên âm, STT/TTS, phòng được quản lý, điện thoại và cuộc họp.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp dự phòng và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về kho nhà cung cấp TTS hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRef đang hoạt động và chỉ hoán đổi trạng thái bí mật thời gian chạy khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật nhắm đến lệnh cho một tập hợp lệnh/đích cụ thể.
    - `config.get` trả về ảnh chụp cấu hình hiện tại và hàm băm.
    - `config.set` ghi một tải trọng cấu hình đã được xác thực.
    - `config.patch` hợp nhất một bản cập nhật cấu hình một phần. Việc thay thế mảng có tính phá hủy
      yêu cầu đường dẫn bị ảnh hưởng trong `replacePaths`; các mảng lồng nhau
      bên dưới mục nhập mảng dùng đường dẫn `[]` như `agents.list[].skills`.
    - `config.apply` xác thực + thay thế toàn bộ tải trọng cấu hình.
    - `config.schema` trả về tải trọng lược đồ cấu hình trực tiếp được Control UI và công cụ CLI sử dụng: lược đồ, `uiHints`, phiên bản và siêu dữ liệu tạo, bao gồm siêu dữ liệu lược đồ Plugin + kênh khi thời gian chạy có thể tải nó. Lược đồ bao gồm siêu dữ liệu trường `title` / `description` được suy ra từ cùng nhãn và văn bản trợ giúp mà UI sử dụng, bao gồm các nhánh cấu thành đối tượng lồng nhau, ký tự đại diện, mục mảng và `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về tải trọng tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một nút lược đồ nông, gợi ý khớp + `hintPath`, `reloadKind` tùy chọn và tóm tắt con trực tiếp để UI/CLI đi sâu. `reloadKind` là một trong `restart`, `hot`, hoặc `none` và phản ánh bộ lập kế hoạch tải lại cấu hình Gateway cho đường dẫn được yêu cầu. Các nút lược đồ tra cứu giữ tài liệu hướng người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, `reloadKind` tùy chọn, cùng `hint` / `hintPath` khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi chính bản cập nhật thành công; bên gọi có phiên có thể bao gồm `continuationMessage` để khi khởi động, một lượt tác nhân theo dõi được tiếp tục thông qua hàng đợi tiếp tục sau khởi động lại. Các cập nhật trình quản lý gói và cập nhật bản checkout git được giám sát từ mặt phẳng điều khiển dùng cơ chế bàn giao dịch vụ được quản lý tách rời thay vì thay thế cây gói hoặc sửa đổi đầu ra checkout/build bên trong Gateway đang chạy. Một bàn giao đã bắt đầu trả về `ok: true` với `result.reason: "managed-service-handoff-started"` và `handoff.status: "started"`; bàn giao không khả dụng hoặc thất bại trả về `ok: false` với `managed-service-handoff-unavailable` hoặc `managed-service-handoff-failed`, cùng `handoff.command` khi cần cập nhật shell thủ công. Bàn giao không khả dụng nghĩa là OpenClaw thiếu ranh giới giám sát an toàn hoặc danh tính dịch vụ bền vững, chẳng hạn `OPENCLAW_SYSTEMD_UNIT` cho systemd. Trong một bàn giao đã bắt đầu, dấu hiệu khởi động lại có thể báo cáo ngắn gọn `stats.reason: "restart-health-pending"`; phần tiếp tục bị trì hoãn cho đến khi CLI xác minh Gateway đã khởi động lại và ghi dấu hiệu `ok` cuối cùng.
    - `update.status` làm mới và trả về dấu hiệu khởi động lại cập nhật mới nhất, bao gồm phiên bản đang chạy sau khởi động lại khi có.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` hiển thị trình hướng dẫn onboarding qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp tác nhân và workspace">
    - `agents.list` trả về các mục tác nhân đã cấu hình, bao gồm mô hình hiệu lực và siêu dữ liệu runtime.
    - `agents.create`, `agents.update` và `agents.delete` quản lý bản ghi tác nhân và liên kết workspace.
    - `agents.files.list`, `agents.files.get` và `agents.files.set` quản lý các tệp workspace khởi tạo được cung cấp cho một tác nhân.
    - `tasks.list`, `tasks.get` và `tasks.cancel` cung cấp sổ cái tác vụ Gateway cho các client SDK và toán tử.
    - `artifacts.list`, `artifacts.get` và `artifacts.download` cung cấp tóm tắt artifact bắt nguồn từ bản ghi và tải xuống cho phạm vi `sessionKey`, `runId` hoặc `taskId` rõ ràng. Các truy vấn lượt chạy và tác vụ phân giải phiên sở hữu ở phía máy chủ và chỉ trả về phương tiện bản ghi có nguồn gốc khớp; các nguồn URL không an toàn hoặc cục bộ trả về lượt tải xuống không được hỗ trợ thay vì tìm nạp ở phía máy chủ.
    - `environments.list` và `environments.status` cung cấp khả năng khám phá môi trường chỉ đọc cục bộ với Gateway và nút cho các client SDK.
    - `agent.identity.get` trả về danh tính trợ lý hiệu lực cho một tác nhân hoặc phiên.
    - `agent.wait` chờ một lượt chạy hoàn tất và trả về ảnh chụp nhanh kết thúc khi có sẵn.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` theo từng hàng khi backend runtime tác nhân được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho client WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện bản ghi/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước bản ghi có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho một khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một mục tiêu phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào một phiên hiện có.
    - `sessions.steer` là biến thể ngắt-và-điều hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` kèm `runId` tùy chọn, hoặc chỉ truyền `runId` cho các lượt chạy đang hoạt động mà Gateway có thể phân giải thành một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/ghi đè của phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` hiệu lực.
    - `sessions.reset`, `sessions.delete` và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu trữ.
    - Thực thi trò chuyện vẫn dùng `chat.history`, `chat.send`, `chat.abort` và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho client UI: các thẻ chỉ thị inline bị loại khỏi văn bản hiển thị, payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và các khối gọi công cụ bị cắt ngắn) và token điều khiển mô hình ASCII/toàn chiều bị rò rỉ sẽ bị loại bỏ, các hàng trợ lý chỉ chứa token im lặng thuần túy như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.
    - `chat.message.get` là trình đọc toàn bộ tin nhắn có giới hạn được bổ sung cho một mục bản ghi hiển thị duy nhất. Client truyền `sessionKey`, `agentId` tùy chọn khi lựa chọn phiên được giới hạn theo tác nhân, cùng một `messageId` bản ghi trước đó đã được hiển thị qua `chat.history`, và Gateway trả về cùng phép chiếu đã chuẩn hóa hiển thị mà không có giới hạn cắt ngắn lịch sử nhẹ khi mục đã lưu vẫn còn khả dụng và không quá lớn.
    - `chat.send` chấp nhận `fastMode: "auto"` cho một lượt để dùng chế độ nhanh cho các lệnh gọi mô hình bắt đầu trước ngưỡng cắt tự động, rồi khởi động các lệnh gọi thử lại, fallback, kết quả công cụ hoặc tiếp tục về sau mà không dùng chế độ nhanh. Ngưỡng cắt mặc định là 60 giây và có thể được cấu hình theo từng mô hình bằng `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Bên gọi `chat.send` có thể truyền `fastAutoOnSeconds` cho một lượt để ghi đè ngưỡng cắt cho yêu cầu đó.

  </Accordion>

  <Accordion title="Ghép nối thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép nối đang chờ xử lý và đã phê duyệt.
    - `device.pair.approve`, `device.pair.reject` và `device.pair.remove` quản lý bản ghi ghép nối thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép nối trong phạm vi vai trò đã phê duyệt và giới hạn phạm vi của bên gọi.
    - `device.token.revoke` thu hồi token thiết bị đã ghép nối trong phạm vi vai trò đã phê duyệt và giới hạn phạm vi của bên gọi.

  </Accordion>

  <Accordion title="Ghép nối nút, invoke và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` và `node.pair.verify` bao quát xác minh ghép nối và khởi tạo nút.
    - `node.list` và `node.describe` trả về trạng thái nút đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn nút đã ghép nối.
    - `node.invoke` chuyển tiếp một lệnh tới nút đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu invoke.
    - `node.event` mang các sự kiện bắt nguồn từ nút quay lại gateway.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi nút đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các nút ngoại tuyến/bị ngắt kết nối.

  </Accordion>

  <Accordion title="Nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` và `exec.approval.resolve` bao quát các yêu cầu phê duyệt exec một lần cùng tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý ảnh chụp nhanh chính sách phê duyệt exec của gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ trên nút qua các lệnh relay của nút.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` và `plugin.approval.resolve` bao quát các luồng phê duyệt do plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc vào Heartbeat kế tiếp; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - `cron.run` vẫn là RPC kiểu đưa vào hàng đợi cho các lượt chạy thủ công. Client cần ngữ nghĩa hoàn tất nên đọc `runId` được trả về và thăm dò `cron.runs`.
    - `cron.runs` chấp nhận bộ lọc `runId` tùy chọn không rỗng để client có thể theo dõi một lượt chạy thủ công đã xếp hàng mà không cạnh tranh với các mục lịch sử khác cho cùng công việc.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: các cập nhật trò chuyện UI như `chat.inject` và các sự kiện trò chuyện chỉ liên quan đến bản ghi khác. Trong giao thức v4, payload delta mang `deltaText`; `message` vẫn là ảnh chụp nhanh trợ lý tích lũy. Các thay thế không theo tiền tố đặt `replace=true` và dùng `deltaText` làm văn bản thay thế.
- `session.message`, `session.operation` và `session.tool`: các cập nhật bản ghi, thao tác phiên đang diễn ra và luồng sự kiện cho một phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: cập nhật ảnh chụp nhanh hiện diện hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: cập nhật ảnh chụp nhanh sức khỏe gateway.
- `heartbeat`: cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi lượt chạy/công việc Cron.
- `shutdown`: thông báo tắt gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép nối nút.
- `node.invoke.request`: phát rộng yêu cầu invoke nút.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép nối.
- `voicewake.changed`: cấu hình kích hoạt từ đánh thức đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt plugin.

### Phương thức trợ giúp nút

- Các nút có thể gọi `skills.bins` để lấy danh sách hiện tại của các tệp thực thi skill cho kiểm tra tự động cho phép.

### RPC sổ cái tác vụ

Client toán tử có thể kiểm tra và hủy bản ghi tác vụ nền Gateway thông qua các RPC sổ cái tác vụ. Các phương thức này trả về tóm tắt tác vụ đã được làm sạch, không phải trạng thái runtime thô.

- `tasks.list` yêu cầu `operator.read`.
  - Tham số: `status` tùy chọn (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` hoặc `"timed_out"`) hoặc một mảng các trạng thái đó, `agentId` tùy chọn, `sessionKey` tùy chọn, `limit` tùy chọn từ `1` đến `500` và chuỗi `cursor` tùy chọn.
  - Kết quả: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` yêu cầu `operator.read`.
  - Tham số: `{ "taskId": string }`.
  - Kết quả: `{ "task": TaskSummary }`.
  - Id tác vụ bị thiếu trả về dạng lỗi không tìm thấy của Gateway.
- `tasks.cancel` yêu cầu `operator.write`.
  - Tham số: `{ "taskId": string, "reason"?: string }`.
  - Kết quả:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` báo cáo sổ cái có tác vụ khớp hay không. `cancelled` báo cáo runtime đã chấp nhận hoặc ghi nhận việc hủy hay chưa.

`TaskSummary` bao gồm `id`, `status` và siêu dữ liệu tùy chọn như `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, dấu thời gian, tiến độ, tóm tắt kết thúc và văn bản lỗi đã được làm sạch. `agentId` xác định tác nhân đang thực thi tác vụ; `sessionKey` và `ownerKey` giữ lại ngữ cảnh bên yêu cầu và điều khiển.

### Phương thức trợ giúp toán tử

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh runtime cho một agent.

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy theo chế độ xác thực đã cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc non-loopback
  `gateway.auth.mode: "trusted-proxy"` đáp ứng kiểm tra xác thực khi kết nối từ
  header yêu cầu thay vì `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` bỏ qua hoàn toàn xác thực kết nối
  bằng bí mật dùng chung; không phơi bày chế độ đó trên ingress công khai/không tin cậy.
- Sau khi ghép cặp, Gateway cấp một **mã thông báo thiết bị** có phạm vi theo vai trò
  kết nối + các phạm vi. Nó được trả về trong `hello-ok.auth.deviceToken` và nên được
  client lưu bền vững cho các lần kết nối sau.
- Client nên lưu bền vững `hello-ok.auth.deviceToken` chính sau mọi lần kết nối
  thành công.
- Kết nối lại bằng mã thông báo thiết bị **đã lưu** đó cũng nên tái sử dụng tập
  phạm vi đã phê duyệt được lưu cho mã thông báo đó. Điều này giữ nguyên quyền truy cập
  đọc/thăm dò/trạng thái đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại về
  phạm vi ngầm định chỉ dành cho admin.
- Lắp ráp xác thực kết nối phía client (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` là trực giao và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: mã thông báo dùng chung tường minh trước,
    rồi một `deviceToken` tường minh, rồi mã thông báo theo thiết bị đã lưu (được khóa theo
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được
    `auth.token`. Một mã thông báo dùng chung hoặc bất kỳ mã thông báo thiết bị đã phân giải nào sẽ chặn nó.
  - Tự động nâng cấp một mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được cho phép với **điểm cuối tin cậy** —
    loopback, hoặc `wss://` với `tlsFingerprint` đã ghim. `wss://` công khai
    không ghim không đủ điều kiện.
- Bootstrap bằng mã thiết lập tích hợp trả về node chính
  `hello-ok.auth.deviceToken` cùng một mã thông báo operator có giới hạn trong
  `hello-ok.auth.deviceTokens` cho chuyển giao di động tin cậy. Mã thông báo operator
  bao gồm `operator.talk.secrets` để đọc cấu hình Talk gốc và
  loại trừ `operator.admin` và `operator.pairing`.
- Trong khi bootstrap bằng mã thiết lập không phải baseline đang chờ phê duyệt, chi tiết `PAIRING_REQUIRED`
  bao gồm `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  và `pauseReconnect: false`. Client nên tiếp tục kết nối lại bằng cùng
  mã thông báo bootstrap cho đến khi yêu cầu được phê duyệt hoặc mã thông báo không còn hợp lệ.
- Chỉ lưu bền vững `hello-ok.auth.deviceTokens` khi lần kết nối dùng xác thực bootstrap
  trên transport tin cậy như `wss://` hoặc ghép cặp loopback/local.
- Nếu client cung cấp `deviceToken` **tường minh** hoặc `scopes` tường minh, tập
  phạm vi do caller yêu cầu đó vẫn là nguồn có thẩm quyền; các phạm vi trong cache chỉ
  được tái sử dụng khi client tái sử dụng mã thông báo theo thiết bị đã lưu.
- Mã thông báo thiết bị có thể được xoay vòng/thu hồi qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`). Xoay vòng hoặc
  thu hồi một node hoặc vai trò không phải operator khác cũng yêu cầu `operator.admin`.
- `device.token.rotate` trả về metadata xoay vòng. Nó chỉ echo mã thông báo bearer thay thế
  cho các lệnh gọi cùng thiết bị đã được xác thực bằng mã thông báo thiết bị đó,
  để client chỉ dùng mã thông báo có thể lưu bền vững bản thay thế trước khi
  kết nối lại. Các xoay vòng dùng chung/admin không echo mã thông báo bearer.
- Việc cấp, xoay vòng và thu hồi mã thông báo vẫn bị giới hạn trong tập vai trò đã phê duyệt
  được ghi lại trong mục ghép cặp của thiết bị đó; đột biến mã thông báo không thể mở rộng hoặc
  nhắm tới vai trò thiết bị mà phê duyệt ghép cặp chưa từng cấp.
- Với các phiên mã thông báo thiết bị đã ghép cặp, quản lý thiết bị tự giới hạn phạm vi trừ khi
  caller cũng có `operator.admin`: caller không phải admin chỉ có thể quản lý
  mã thông báo operator cho mục thiết bị **của chính họ**. Quản lý mã thông báo node
  và các mã thông báo không phải operator khác chỉ dành cho admin, kể cả với thiết bị của chính caller.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi mã thông báo operator đích
  so với phạm vi phiên hiện tại của caller. Caller không phải admin
  không thể xoay vòng hoặc thu hồi mã thông báo operator rộng hơn phạm vi họ đang có.
- Lỗi xác thực bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi client cho `AUTH_TOKEN_MISMATCH`:
  - Client tin cậy có thể thử lại một lần có giới hạn bằng mã thông báo theo thiết bị trong cache.
  - Nếu lần thử lại đó thất bại, client nên dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn thao tác cho operator.
- `AUTH_SCOPE_MISMATCH` nghĩa là mã thông báo thiết bị đã được nhận diện nhưng không bao phủ
  vai trò/phạm vi được yêu cầu. Client không nên trình bày lỗi này như mã thông báo không hợp lệ;
  hãy nhắc operator ghép cặp lại hoặc phê duyệt hợp đồng phạm vi hẹp/rộng hơn.

## Danh tính thiết bị + ghép cặp

- Node nên bao gồm danh tính thiết bị ổn định (`device.id`) được dẫn xuất từ
  fingerprint của keypair.
- Gateway cấp mã thông báo theo thiết bị + vai trò.
- Cần phê duyệt ghép cặp cho ID thiết bị mới trừ khi tự động phê duyệt local
  được bật.
- Tự động phê duyệt ghép cặp tập trung vào các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường dẫn tự kết nối backend/container-local hẹp cho
  các luồng helper bí mật dùng chung tin cậy.
- Các kết nối tailnet cùng host hoặc LAN vẫn được coi là từ xa cho ghép cặp và
  yêu cầu phê duyệt.
- Client WS thường bao gồm danh tính `device` trong `connect` (operator +
  node). Các ngoại lệ operator không có thiết bị duy nhất là các đường dẫn tin cậy tường minh:
  - `gateway.controlUi.allowInsecureAuth=true` để tương thích HTTP không an toàn chỉ dành cho localhost.
  - xác thực operator Control UI thành công với `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` direct-loopback trên đường dẫn helper nội bộ
    dành riêng.
- Bỏ qua danh tính thiết bị có hệ quả về phạm vi. Khi một kết nối operator
  không có thiết bị được cho phép qua đường dẫn tin cậy tường minh, OpenClaw vẫn xóa
  các phạm vi tự khai báo về tập rỗng trừ khi đường dẫn đó có ngoại lệ
  bảo toàn phạm vi được đặt tên. Các phương thức có kiểm soát phạm vi sau đó thất bại với
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` là đường dẫn bảo toàn phạm vi break-glass
  của Control UI. Nó không cấp phạm vi cho các WebSocket client backend tùy chỉnh
  hoặc dạng CLI tùy ý.
- Đường dẫn helper backend `gateway-client` direct-loopback dành riêng bảo toàn
  phạm vi chỉ cho RPC control-plane local nội bộ; ID backend tùy chỉnh không
  nhận ngoại lệ này.
- Tất cả kết nối phải ký nonce `connect.challenge` do server cung cấp.

### Chẩn đoán di trú xác thực thiết bị

Với các client legacy vẫn dùng hành vi ký trước challenge, `connect` hiện trả về
mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` cùng `error.details.reason` ổn định.

Các lỗi di trú thường gặp:

| Thông báo                    | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi trống).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client đã ký bằng nonce cũ/sai.                   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp payload v2.             |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Timestamp đã ký nằm ngoài độ lệch cho phép.       |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp fingerprint khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.       |

Mục tiêu di trú:

- Luôn chờ `connect.challenge`.
- Ký payload v2 bao gồm nonce của server.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`, liên kết `platform` và `deviceFamily`
  ngoài các trường device/client/role/scopes/token/nonce.
- Chữ ký legacy `v2` vẫn được chấp nhận để tương thích, nhưng ghim metadata
  thiết bị đã ghép cặp vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Client có thể tùy chọn ghim fingerprint chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này phơi bày **toàn bộ API Gateway** (trạng thái, kênh, mô hình, chat,
agent, phiên, node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi các
schema TypeBox trong `packages/gateway-protocol/src/schema.ts`.

## Liên quan

- [Giao thức bridge](/vi/gateway/bridge-protocol)
- [Runbook Gateway](/vi/gateway)
