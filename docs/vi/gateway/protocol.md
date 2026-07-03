---
read_when:
    - Triển khai hoặc cập nhật các máy khách WS Gateway
    - Gỡ lỗi sự không khớp giao thức hoặc lỗi kết nối
    - Đang tạo lại schema/mô hình giao thức
summary: 'Giao thức WebSocket Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-07-03T09:45:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức Gateway WS là **mặt phẳng điều khiển + phương tiện truyền tải nút duy nhất** cho
OpenClaw. Tất cả ứng dụng khách (CLI, giao diện web, ứng dụng macOS, nút iOS/Android, nút
headless) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi** của chúng tại
thời điểm handshake.

## Phương tiện truyền tải

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **phải** là yêu cầu `connect`.
- Các khung trước khi kết nối bị giới hạn ở 64 KiB. Sau khi handshake thành công, ứng dụng khách
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các khung đến quá khổ và bộ đệm gửi đi chậm sẽ phát sự kiện `payload.large`
  trước khi gateway đóng hoặc bỏ khung bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ nội dung
  thông điệp, nội dung tệp đính kèm, nội dung khung thô, token, cookie hoặc giá trị bí mật.

## Handshake (connect)

Gateway → Ứng dụng khách (thử thách trước khi kết nối):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Ứng dụng khách → Gateway:

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

Gateway → Ứng dụng khách:

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
`"startup-sidecars"` và `retryAfterMs`. Ứng dụng khách nên thử lại phản hồi đó
trong ngân sách kết nối tổng thể của mình thay vì hiển thị nó như một lỗi
handshake kết thúc.

`server`, `features`, `snapshot` và `policy` đều là bắt buộc theo schema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` cũng là bắt buộc và báo cáo
vai trò/phạm vi đã thương lượng. `pluginSurfaceUrls` là tùy chọn và ánh xạ tên bề mặt plugin,
chẳng hạn như `canvas`, tới các URL được lưu trữ theo phạm vi.

URL bề mặt plugin theo phạm vi có thể hết hạn. Các nút có thể gọi
`node.pluginSurface.refresh` với `{ "surface": "canvas" }` để nhận một mục mới
trong `pluginSurfaceUrls`. Bản tái cấu trúc Plugin Canvas thử nghiệm không
hỗ trợ đường dẫn tương thích `canvasHostUrl`, `canvasCapability` hoặc
`node.canvas.capability.refresh` đã bị loại bỏ; ứng dụng khách native và
gateway hiện tại phải dùng bề mặt plugin.

Khi không có token thiết bị nào được phát hành, `hello-ok.auth` báo cáo các quyền
đã thương lượng mà không có trường token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Các ứng dụng khách backend đáng tin cậy trong cùng tiến trình (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên kết nối loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu gateway dùng chung. Đường dẫn này được dành riêng
cho các RPC mặt phẳng điều khiển nội bộ và giữ cho các baseline ghép đôi CLI/thiết bị cũ
không chặn công việc backend cục bộ như cập nhật phiên subagent. Ứng dụng khách từ xa,
ứng dụng khách có nguồn gốc trình duyệt, ứng dụng khách nút và ứng dụng khách token thiết bị/danh tính thiết bị
tường minh vẫn dùng các kiểm tra ghép đôi và nâng cấp phạm vi thông thường.

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

Bootstrap bằng QR/mã thiết lập tích hợp là một đường dẫn bàn giao di động mới. Một lần
kết nối bằng mã thiết lập baseline thành công trả về token nút chính cộng với một
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

Bàn giao operator được cố ý giới hạn để onboarding bằng QR có thể khởi động
vòng lặp operator trên di động mà không cấp `operator.admin` hoặc `operator.pairing`.
Nó có bao gồm `operator.talk.secrets` để ứng dụng khách native có thể đọc cấu hình Talk
mà nó cần sau bootstrap. Các phạm vi quản trị và ghép đôi rộng hơn yêu cầu
một luồng ghép đôi operator hoặc token riêng đã được phê duyệt. Ứng dụng khách chỉ nên lưu
`hello-ok.auth.deviceTokens`
khi kết nối dùng xác thực bootstrap trên phương tiện truyền tải đáng tin cậy như `wss://` hoặc
ghép đôi loopback/cục bộ.

### Ví dụ về nút

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

Các phương thức tạo tác dụng phụ yêu cầu **khóa idempotency** (xem schema).

## Vai trò + phạm vi

Để xem mô hình phạm vi operator đầy đủ, các kiểm tra tại thời điểm phê duyệt và
ngữ nghĩa shared-secret, hãy xem [Phạm vi operator](/vi/gateway/operator-scopes).

### Vai trò

- `operator` = ứng dụng khách mặt phẳng điều khiển (CLI/giao diện người dùng/tự động hóa).
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
Khi secrets được bao gồm, ứng dụng khách nên đọc thông tin xác thực nhà cung cấp Talk đang hoạt động
từ `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
giữ nguyên dạng nguồn và có thể là đối tượng SecretRef hoặc chuỗi đã biên tập.

Các phương thức RPC gateway do Plugin đăng ký có thể yêu cầu phạm vi operator riêng của chúng, nhưng
các tiền tố quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi phương thức chỉ là cổng đầu tiên. Một số lệnh slash được truy cập thông qua
`chat.send` áp dụng các kiểm tra cấp lệnh nghiêm ngặt hơn ở phía trên. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có thêm một kiểm tra phạm vi tại thời điểm phê duyệt ngoài
phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có lệnh nút không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Năng lực/lệnh/quyền (nút)

Các nút khai báo yêu cầu năng lực tại thời điểm kết nối:

- `caps`: các danh mục năng lực cấp cao như `camera`, `canvas`, `screen`,
  `location`, `voice` và `talk`.
- `commands`: danh sách cho phép lệnh để invoke.
- `permissions`: các công tắc chi tiết (ví dụ `screen.record`, `camera.capture`).

Gateway coi những mục này là **yêu cầu** và thực thi danh sách cho phép phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để giao diện người dùng có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị đó kết nối với cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Các nút đã kết nối báo cáo
  thời gian kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; các nút đã ghép đôi cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện nút đáng tin cậy cập nhật metadata ghép đôi của chúng.

### Sự kiện nút còn hoạt động trong nền

Các nút có thể gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một nút đã ghép đôi
còn hoạt động trong một lần đánh thức nền mà không đánh dấu nó là đã kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững cho các phiên thiết bị nút đã xác thực;
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

Gateway cũ hơn vẫn có thể trả về `{ "ok": true }` cho `node.event`; ứng dụng khách nên coi đó là một
RPC đã được xác nhận, không phải là lưu bền vững hiện diện.

## Phạm vi sự kiện broadcast

Các sự kiện broadcast WebSocket do máy chủ đẩy được kiểm soát theo phạm vi để các phiên chỉ có phạm vi ghép đôi hoặc chỉ dành cho nút không thụ động nhận nội dung phiên.

- **Khung chat, agent và kết quả công cụ** (bao gồm sự kiện `agent` được stream và kết quả gọi công cụ) yêu cầu ít nhất `operator.read`. Các phiên không có `operator.read` bỏ qua hoàn toàn các khung này.
- **Broadcast `plugin.*` do Plugin định nghĩa** được kiểm soát bằng `operator.write` hoặc `operator.admin`, tùy theo cách plugin đăng ký chúng.
- **Sự kiện trạng thái và phương tiện truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để tình trạng phương tiện truyền tải vẫn quan sát được với mọi phiên đã xác thực.
- **Các họ sự kiện broadcast không xác định** mặc định bị kiểm soát theo phạm vi (fail-closed) trừ khi một trình xử lý đã đăng ký nới lỏng chúng một cách tường minh.

Mỗi kết nối ứng dụng khách giữ số thứ tự riêng theo từng ứng dụng khách để broadcast duy trì thứ tự đơn điệu trên socket đó ngay cả khi các ứng dụng khách khác nhau thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ handshake/xác thực ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là một
danh sách khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export phương thức
plugin/kênh đã tải. Hãy coi nó là khám phá tính năng, không phải bản liệt kê đầy đủ
của `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về ảnh chụp tình trạng Gateway được lưu trong bộ nhớ đệm hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi ổn định chẩn đoán có giới hạn gần đây. Nó giữ siêu dữ liệu vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và id phiên. Nó không giữ văn bản trò chuyện, nội dung Webhook, đầu ra công cụ, nội dung thô của yêu cầu hoặc phản hồi, token, cookie hoặc giá trị bí mật. Cần phạm vi đọc của người vận hành.
    - `status` trả về bản tóm tắt Gateway kiểu `/status`; các trường nhạy cảm chỉ được đưa vào cho máy khách người vận hành có phạm vi quản trị.
    - `gateway.identity.get` trả về danh tính thiết bị Gateway được dùng bởi các luồng chuyển tiếp và ghép đôi.
    - `system-presence` trả về ảnh chụp hiện diện hiện tại cho các thiết bị người vận hành/Node đã kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/phát ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện Heartbeat mới nhất đã được lưu bền vững.
    - `set-heartbeats` bật/tắt xử lý Heartbeat trên Gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Truyền `{ "view": "configured" }` để lấy các mô hình đã cấu hình có kích thước phù hợp cho bộ chọn (`agents.defaults.models` trước, sau đó `models.providers.*.models`), hoặc `{ "view": "all" }` để lấy toàn bộ danh mục.
    - `usage.status` trả về các cửa sổ mức sử dụng nhà cung cấp/tóm tắt hạn mức còn lại.
    - `usage.cost` trả về các tóm tắt mức sử dụng chi phí đã tổng hợp cho một khoảng ngày.
      Truyền `agentId` cho một agent, hoặc `agentScope: "all"` để tổng hợp các agent đã cấu hình.
    - `doctor.memory.status` trả về mức sẵn sàng của vector-memory / embedding được lưu trong bộ nhớ đệm cho workspace agent mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi yêu cầu rõ ràng một lần ping trực tiếp tới nhà cung cấp embedding. Máy khách hỗ trợ Dreaming cũng có thể truyền `{ "agentId": "agent-id" }` để giới hạn thống kê kho Dreaming vào một workspace agent đã chọn; bỏ qua `agentId` sẽ giữ fallback agent mặc định và tổng hợp các workspace Dreaming đã cấu hình.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, và `doctor.memory.dedupeDreamDiary` chấp nhận tham số tùy chọn `{ "agentId": "agent-id" }` cho các chế độ xem/hành động Dreaming của agent đã chọn. Khi bỏ qua `agentId`, chúng hoạt động trên workspace agent mặc định đã cấu hình.
    - `doctor.memory.remHarness` trả về bản xem trước harness REM có giới hạn, chỉ đọc cho máy khách control-plane từ xa. Nó có thể bao gồm đường dẫn workspace, đoạn trích bộ nhớ, markdown grounded đã render và ứng viên quảng bá sâu, vì vậy bên gọi cần `operator.read`.
    - `sessions.usage` trả về các tóm tắt mức sử dụng theo phiên. Truyền `agentId` cho một
      agent, hoặc `agentScope: "all"` để liệt kê các agent đã cấu hình cùng nhau.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký mức sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình trợ giúp đăng nhập">
    - `channels.status` trả về các tóm tắt trạng thái kênh/Plugin tích hợp sẵn + đóng gói kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có khả năng QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một APNs push thử nghiệm đến một Node iOS đã đăng ký.
    - `voicewake.get` trả về các trigger wake-word đã lưu.
    - `voicewake.set` cập nhật các trigger wake-word và phát thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi đi trực tiếp cho các lần gửi nhắm tới kênh/tài khoản/luồng bên ngoài trình chạy trò chuyện.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với các điều khiển con trỏ/giới hạn và byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.catalog` trả về danh mục nhà cung cấp Talk chỉ đọc cho giọng nói, phiên âm phát trực tuyến và giọng nói thời gian thực. Nó bao gồm id nhà cung cấp chuẩn, bí danh registry, nhãn, trạng thái đã cấu hình, kết quả `ready` tùy chọn cấp nhóm, id mô hình/giọng nói được phơi bày, chế độ chuẩn, transport, chiến lược não và cờ âm thanh/khả năng thời gian thực mà không trả về bí mật nhà cung cấp hoặc thay đổi cấu hình toàn cục. Các Gateway hiện tại đặt `ready` sau khi áp dụng lựa chọn nhà cung cấp runtime; máy khách nên xem việc thiếu nó là chưa được xác minh để tương thích với các Gateway cũ hơn.
    - `talk.config` trả về payload cấu hình Talk hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.session.create` tạo một phiên Talk do Gateway sở hữu cho `realtime/gateway-relay`, `transcription/gateway-relay`, hoặc `stt-tts/managed-room`. Với `stt-tts/managed-room`, bên gọi `operator.write` truyền `sessionKey` cũng phải truyền `spawnedBy` để có khả năng hiển thị khóa phiên theo phạm vi; tạo `sessionKey` không theo phạm vi và `brain: "direct-tools"` yêu cầu `operator.admin`.
    - `talk.session.join` xác thực token phiên managed-room, phát sự kiện `session.ready` hoặc `session.replaced` khi cần, và trả về siêu dữ liệu phòng/phiên cùng các sự kiện Talk gần đây mà không có token dạng rõ hoặc hash token đã lưu.
    - `talk.session.appendAudio` thêm âm thanh đầu vào PCM base64 vào các phiên chuyển tiếp thời gian thực và phiên âm do Gateway sở hữu.
    - `talk.session.startTurn`, `talk.session.endTurn`, và `talk.session.cancelTurn` điều khiển vòng đời lượt managed-room với việc từ chối lượt cũ trước khi trạng thái được xóa.
    - `talk.session.cancelOutput` dừng đầu ra âm thanh của trợ lý, chủ yếu cho chen ngang có VAD kiểm soát trong các phiên chuyển tiếp Gateway.
    - `talk.session.submitToolResult` hoàn tất một lệnh gọi công cụ nhà cung cấp do phiên chuyển tiếp thời gian thực do Gateway sở hữu phát ra. Truyền `options: { willContinue: true }` cho đầu ra công cụ tạm thời khi sẽ có kết quả cuối cùng theo sau, hoặc `options: { suppressResponse: true }` khi kết quả công cụ nên đáp ứng lệnh gọi nhà cung cấp mà không bắt đầu phản hồi trợ lý thời gian thực khác.
    - `talk.session.steer` gửi điều khiển giọng nói active-run vào một phiên Talk do Gateway sở hữu và được agent hỗ trợ. Nó chấp nhận `{ sessionId, text, mode? }`, trong đó `mode` là `status`, `steer`, `cancel`, hoặc `followup`; chế độ bị bỏ qua được phân loại từ văn bản đã nói.
    - `talk.session.close` đóng một phiên chuyển tiếp, phiên âm hoặc managed-room do Gateway sở hữu và phát các sự kiện Talk kết thúc.
    - `talk.mode` đặt/phát trạng thái chế độ Talk hiện tại cho máy khách WebChat/Control UI.
    - `talk.client.create` tạo một phiên nhà cung cấp thời gian thực do máy khách sở hữu bằng `webrtc` hoặc `provider-websocket` trong khi Gateway sở hữu cấu hình, thông tin xác thực, chỉ dẫn và chính sách công cụ.
    - `talk.client.toolCall` cho phép transport thời gian thực do máy khách sở hữu chuyển tiếp lệnh gọi công cụ nhà cung cấp tới chính sách Gateway. Công cụ được hỗ trợ đầu tiên là `openclaw_agent_consult`; máy khách nhận một run id và chờ các sự kiện vòng đời trò chuyện bình thường trước khi gửi kết quả công cụ dành riêng cho nhà cung cấp.
    - `talk.client.steer` gửi điều khiển giọng nói active-run cho transport thời gian thực do máy khách sở hữu. Gateway phân giải run nhúng đang hoạt động từ `sessionKey` và trả về kết quả có cấu trúc được chấp nhận/từ chối thay vì âm thầm bỏ qua điều khiển.
    - `talk.event` là kênh sự kiện Talk duy nhất cho thời gian thực, phiên âm, STT/TTS, managed-room, điện thoại và adapter cuộc họp.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp fallback và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về danh sách nhà cung cấp TTS hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRefs đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công toàn bộ.
    - `secrets.resolve` phân giải các gán bí mật đích-lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về ảnh chụp cấu hình hiện tại và hash.
    - `config.set` ghi một payload cấu hình đã xác thực.
    - `config.patch` hợp nhất một cập nhật cấu hình từng phần. Việc thay thế mảng
      mang tính phá hủy yêu cầu đường dẫn bị ảnh hưởng trong `replacePaths`; các mảng lồng nhau
      dưới các mục mảng dùng đường dẫn `[]` như `agents.list[].skills`.
    - `config.apply` xác thực + thay thế toàn bộ payload cấu hình.
    - `config.schema` trả về payload schema cấu hình trực tiếp được Control UI và công cụ CLI sử dụng: schema, `uiHints`, phiên bản và siêu dữ liệu tạo, bao gồm siêu dữ liệu schema Plugin + kênh khi runtime có thể tải nó. Schema bao gồm siêu dữ liệu trường `title` / `description` được dẫn xuất từ cùng nhãn và văn bản trợ giúp mà UI sử dụng, bao gồm các nhánh thành phần đối tượng lồng nhau, ký tự đại diện, mục mảng và `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về payload tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một nút schema nông, gợi ý khớp + `hintPath`, `reloadKind` tùy chọn và tóm tắt con trực tiếp cho drill-down UI/CLI. `reloadKind` là một trong `restart`, `hot`, hoặc `none` và phản ánh bộ lập kế hoạch tải lại cấu hình Gateway cho đường dẫn được yêu cầu. Các nút schema tra cứu giữ tài liệu hướng người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con phơi bày `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, `reloadKind` tùy chọn, cùng `hint` / `hintPath` đã khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi bản thân cập nhật thành công; bên gọi có phiên có thể bao gồm `continuationMessage` để quá trình khởi động tiếp tục một lượt agent theo sau qua hàng đợi tiếp tục sau khởi động lại. Các bản cập nhật bằng package-manager và các bản cập nhật git-checkout được giám sát từ control plane dùng một bàn giao managed-service tách rời thay vì thay thế cây package hoặc thay đổi đầu ra checkout/build bên trong Gateway đang chạy. Một bàn giao đã bắt đầu trả về `ok: true` với `result.reason: "managed-service-handoff-started"` và `handoff.status: "started"`; bàn giao không khả dụng hoặc thất bại trả về `ok: false` với `managed-service-handoff-unavailable` hoặc `managed-service-handoff-failed`, cùng `handoff.command` khi cần cập nhật shell thủ công. Bàn giao không khả dụng nghĩa là OpenClaw thiếu ranh giới supervisor an toàn hoặc danh tính dịch vụ bền vững, như `OPENCLAW_SYSTEMD_UNIT` cho systemd. Trong khi bàn giao đã bắt đầu, sentinel khởi động lại có thể báo cáo ngắn gọn `stats.reason: "restart-health-pending"`; việc tiếp tục bị trì hoãn cho đến khi CLI xác minh Gateway đã khởi động lại và ghi sentinel `ok` cuối cùng.
    - `update.status` làm mới và trả về sentinel khởi động lại cập nhật mới nhất, bao gồm phiên bản đang chạy sau khởi động lại khi có.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` phơi bày trình hướng dẫn onboarding qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp tác tử và không gian làm việc">
    - `agents.list` trả về các mục tác tử đã cấu hình, bao gồm mô hình hiệu lực và siêu dữ liệu thời gian chạy.
    - `agents.create`, `agents.update` và `agents.delete` quản lý bản ghi tác tử và liên kết không gian làm việc.
    - `agents.files.list`, `agents.files.get` và `agents.files.set` quản lý các tệp không gian làm việc khởi động được cung cấp cho tác tử.
    - `tasks.list`, `tasks.get` và `tasks.cancel` cung cấp sổ cái tác vụ Gateway cho SDK và ứng dụng khách của người vận hành.
    - `artifacts.list`, `artifacts.get` và `artifacts.download` cung cấp tóm tắt hiện vật được dẫn xuất từ bản ghi phiên và lượt tải xuống cho phạm vi `sessionKey`, `runId` hoặc `taskId` rõ ràng. Truy vấn lượt chạy và tác vụ phân giải phiên sở hữu ở phía máy chủ và chỉ trả về phương tiện bản ghi phiên có nguồn gốc khớp; nguồn URL không an toàn hoặc cục bộ trả về lượt tải xuống không được hỗ trợ thay vì được tìm nạp ở phía máy chủ.
    - `environments.list` và `environments.status` cung cấp khả năng khám phá môi trường chỉ đọc cục bộ trong Gateway và môi trường Node cho ứng dụng khách SDK.
    - `agent.identity.get` trả về danh tính trợ lý hiệu lực cho một tác tử hoặc phiên.
    - `agent.wait` chờ một lượt chạy hoàn tất và trả về ảnh chụp nhanh cuối khi có sẵn.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` trên từng hàng khi đã cấu hình phần phụ trợ thời gian chạy tác tử.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho ứng dụng khách WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện bản ghi phiên/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước bản ghi phiên có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một mục tiêu phiên.
    - `sessions.create` tạo mục phiên mới.
    - `sessions.send` gửi tin nhắn vào một phiên hiện có.
    - `sessions.steer` là biến thể ngắt và điều hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy bỏ công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` cùng `runId` tùy chọn, hoặc chỉ truyền `runId` cho các lượt chạy đang hoạt động mà Gateway có thể phân giải về một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/ghi đè của phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` hiệu lực.
    - `sessions.reset`, `sessions.delete` và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu.
    - Thực thi trò chuyện vẫn dùng `chat.history`, `chat.send`, `chat.abort` và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho ứng dụng khách UI: thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, tải trọng XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và các khối lệnh gọi công cụ bị cắt ngắn) cũng như mã điều khiển mô hình ASCII/toàn chiều bị rò rỉ sẽ bị loại bỏ, các hàng trợ lý chỉ có token im lặng như đúng chính xác `NO_REPLY` / `no_reply` sẽ bị bỏ qua, và các hàng quá lớn có thể được thay bằng phần giữ chỗ.
    - `chat.message.get` là trình đọc toàn bộ tin nhắn có giới hạn được thêm mới cho một mục bản ghi phiên hiển thị duy nhất. Ứng dụng khách truyền `sessionKey`, `agentId` tùy chọn khi lựa chọn phiên được đặt phạm vi theo tác tử, cộng với `messageId` bản ghi phiên từng được cung cấp qua `chat.history`, và Gateway trả về cùng phép chiếu đã chuẩn hóa hiển thị mà không có giới hạn cắt ngắn lịch sử nhẹ khi mục đã lưu vẫn còn khả dụng và không quá lớn.
    - `chat.send` chấp nhận `fastMode: "auto"` một lượt để dùng chế độ nhanh cho các lệnh gọi mô hình bắt đầu trước ngưỡng tự động, rồi bắt đầu các lệnh gọi thử lại, dự phòng, kết quả công cụ hoặc tiếp tục về sau mà không dùng chế độ nhanh. Ngưỡng mặc định là 60 giây và có thể được cấu hình theo từng mô hình bằng `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Bên gọi `chat.send` có thể truyền `fastAutoOnSeconds` một lượt để ghi đè ngưỡng cho yêu cầu đó.

  </Accordion>

  <Accordion title="Ghép nối thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép nối đang chờ xử lý và đã được phê duyệt.
    - `device.pair.approve`, `device.pair.reject` và `device.pair.remove` quản lý bản ghi ghép nối thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép nối trong giới hạn vai trò đã được phê duyệt và phạm vi của bên gọi.
    - `device.token.revoke` thu hồi token thiết bị đã ghép nối trong giới hạn vai trò đã được phê duyệt và phạm vi của bên gọi.

  </Accordion>

  <Accordion title="Ghép nối Node, gọi lệnh và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` và `node.pair.verify` bao gồm ghép nối Node và xác minh khởi động.
    - `node.list` và `node.describe` trả về trạng thái Node đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn Node đã ghép nối.
    - `node.invoke` chuyển tiếp một lệnh đến Node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu gọi lệnh.
    - `node.event` mang các sự kiện phát sinh từ Node trở lại gateway.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi Node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các Node ngoại tuyến/bị ngắt kết nối.

  </Accordion>

  <Accordion title="Nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` và `exec.approval.resolve` bao gồm yêu cầu phê duyệt exec một lần cùng tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý ảnh chụp nhanh chính sách phê duyệt exec của gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ trên Node thông qua lệnh chuyển tiếp Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` và `plugin.approval.resolve` bao gồm các luồng phê duyệt do Plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc ở Heartbeat kế tiếp; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - `cron.run` vẫn là RPC kiểu đưa vào hàng đợi cho các lượt chạy thủ công. Ứng dụng khách cần ngữ nghĩa hoàn tất nên đọc `runId` được trả về và thăm dò `cron.runs`.
    - `cron.runs` chấp nhận bộ lọc `runId` không rỗng tùy chọn để ứng dụng khách có thể theo dõi một lượt chạy thủ công đã xếp hàng mà không tranh chấp với các mục lịch sử khác của cùng công việc.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: cập nhật trò chuyện UI như `chat.inject` và các sự kiện trò chuyện chỉ liên quan đến bản ghi phiên khác. Trong giao thức v4, tải trọng delta mang `deltaText`; `message` vẫn là ảnh chụp nhanh trợ lý tích lũy. Các thay thế không phải tiền tố đặt `replace=true` và dùng `deltaText` làm văn bản thay thế.
- `session.message`, `session.operation` và `session.tool`: bản ghi phiên, thao tác phiên đang diễn ra và cập nhật luồng sự kiện cho một phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: cập nhật ảnh chụp nhanh hiện diện hệ thống.
- `tick`: sự kiện keepalive / kiểm tra còn sống định kỳ.
- `health`: cập nhật ảnh chụp nhanh tình trạng gateway.
- `heartbeat`: cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi lượt chạy/công việc cron.
- `shutdown`: thông báo tắt gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép nối Node.
- `node.invoke.request`: phát rộng yêu cầu gọi lệnh Node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép nối.
- `voicewake.changed`: cấu hình kích hoạt từ đánh thức đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt Plugin.

### Phương thức trợ giúp Node

- Node có thể gọi `skills.bins` để lấy danh sách hiện tại của các tệp thực thi kỹ năng cho kiểm tra tự động cho phép.

### RPC sổ cái tác vụ

Ứng dụng khách của người vận hành có thể kiểm tra và hủy bản ghi tác vụ nền của Gateway thông qua các RPC sổ cái tác vụ. Các phương thức này trả về tóm tắt tác vụ đã được làm sạch, không phải trạng thái thời gian chạy thô.

- `tasks.list` yêu cầu `operator.read`.
  - Tham số: `status` tùy chọn (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` hoặc `"timed_out"`) hoặc một mảng các trạng thái đó,
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
  - `found` báo cáo liệu sổ cái có tác vụ khớp hay không. `cancelled`
    báo cáo liệu thời gian chạy đã chấp nhận hoặc ghi nhận việc hủy hay chưa.

`TaskSummary` bao gồm `id`, `status` và siêu dữ liệu tùy chọn như `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, dấu thời gian, tiến độ,
tóm tắt cuối và văn bản lỗi đã được làm sạch. `agentId` xác định tác tử
đang thực thi tác vụ; `sessionKey` và `ownerKey` giữ lại ngữ cảnh người yêu cầu
và điều khiển.

### Phương thức trợ giúp người vận hành

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh runtime
  cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có dấu `/` ở đầu
    - `native` và đường dẫn mặc định `both` trả về tên native có nhận biết provider
      khi có sẵn
  - `textAliases` chứa các alias slash chính xác như `/model` và `/m`.
  - `nativeName` chứa tên lệnh native có nhận biết provider khi tồn tại.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cùng tính khả dụng của lệnh plugin
    native.
  - `includeArgs=false` bỏ qua metadata đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy danh mục công cụ runtime cho một
  agent. Phản hồi bao gồm các công cụ được nhóm và metadata nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu plugin khi `source="plugin"`
  - `optional`: công cụ plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực ở runtime
  cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh runtime đáng tin cậy từ phía máy chủ của phiên thay vì chấp nhận
    ngữ cảnh xác thực hoặc phân phối do bên gọi cung cấp.
  - Phản hồi là một phép chiếu theo phạm vi phiên, do máy chủ suy ra, của danh mục đang hoạt động,
    bao gồm các công cụ core, plugin, kênh và công cụ máy chủ MCP đã được phát hiện.
  - `tools.effective` chỉ đọc đối với MCP: nó có thể chiếu một danh mục MCP của phiên đã warm qua
    chính sách công cụ cuối cùng, nhưng không tạo runtime MCP, kết nối transport, hoặc phát hành
    `tools/list`. Nếu không có danh mục đã warm phù hợp, phản hồi có thể bao gồm một thông báo như
    `mcp-not-yet-connected`, `mcp-not-yet-listed`, hoặc `mcp-stale-catalog`.
  - Các mục công cụ có hiệu lực dùng `source="core"`, `source="plugin"`, `source="channel"`, hoặc
    `source="mcp"`.
- Người vận hành có thể gọi `tools.invoke` (`operator.write`) để gọi một công cụ khả dụng thông qua
  cùng đường dẫn chính sách Gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm`, và
    `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều có mặt, agent của phiên đã phân giải phải khớp với
    `agentId`.
  - Các wrapper core chỉ dành cho chủ sở hữu như `cron`, `gateway`, và `nodes` yêu cầu
    danh tính chủ sở hữu/quản trị viên (`operator.admin`) mặc dù bản thân phương thức
    `tools.invoke` là `operator.write`.
  - Phản hồi là một envelope hướng SDK với các trường `ok`, `toolName`, `output` tùy chọn, và
    `error` có kiểu. Từ chối phê duyệt hoặc chính sách trả về `ok:false` trong payload thay vì
    bỏ qua pipeline chính sách công cụ Gateway.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy danh mục
  skill hiển thị cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - Phản hồi bao gồm điều kiện đủ, yêu cầu còn thiếu, kiểm tra cấu hình, và
    tùy chọn cài đặt đã được làm sạch mà không để lộ giá trị secret thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) cho
  metadata khám phá ClawHub.
- Người vận hành có thể gọi `skills.upload.begin`, `skills.upload.chunk`, và
  `skills.upload.commit` (`operator.admin`) để stage một kho lưu trữ skill riêng tư
  trước khi cài đặt. Đây là đường dẫn tải lên quản trị riêng cho các client đáng tin cậy,
  không phải luồng cài đặt skill ClawHub thông thường, và mặc định bị tắt trừ khi
  `skills.install.allowUploadedArchives` được bật.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    tạo một lượt tải lên gắn với slug và giá trị force đó.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` nối thêm byte tại
    offset đã giải mã chính xác.
  - `skills.upload.commit({ uploadId, sha256? })` xác minh kích thước cuối cùng và
    SHA-256. Commit chỉ hoàn tất lượt tải lên; nó không cài đặt skill.
  - Kho lưu trữ skill đã tải lên là các kho lưu trữ zip chứa root `SKILL.md`. Tên thư mục nội bộ
    của kho lưu trữ không bao giờ chọn đích cài đặt.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở ba chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một
    thư mục skill vào thư mục `skills/` của workspace agent mặc định.
  - Chế độ tải lên: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    cài đặt một lượt tải lên đã commit vào thư mục `skills/<slug>` của workspace agent mặc định.
    Slug và giá trị force phải khớp với yêu cầu
    `skills.upload.begin` ban đầu. Chế độ này bị từ chối trừ khi
    `skills.install.allowUploadedArchives` được bật. Cài đặt này không
    ảnh hưởng đến các lượt cài đặt ClawHub.
  - Chế độ trình cài đặt Gateway: `{ name, installId, timeoutMs? }`
    chạy một hành động `metadata.openclaw.install` đã khai báo trên máy chủ Gateway.
    Các client cũ vẫn có thể gửi `dangerouslyForceUnsafeInstall`; trường này
    đã ngừng khuyến nghị, chỉ được chấp nhận để tương thích giao thức, và bị bỏ qua. Dùng
    `security.installPolicy` cho các quyết định cài đặt do người vận hành sở hữu.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả các lượt cài đặt ClawHub được theo dõi trong
    workspace agent mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`,
    `apiKey`, và `env`.

### Các view của `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi runtime hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là danh mục được phép, bao gồm các model được phát hiện động cho các mục `provider/*`. Nếu không, phản hồi là toàn bộ danh mục Gateway.
- `"configured"`: hành vi có kích thước phù hợp cho bộ chọn. Nếu `agents.defaults.models` được cấu hình, nó vẫn được ưu tiên, bao gồm khám phá theo phạm vi provider cho các mục `provider/*`. Khi không có allowlist, phản hồi dùng các mục `models.providers.*.models` rõ ràng, chỉ fallback về toàn bộ danh mục khi không tồn tại hàng model đã cấu hình.
- `"all"`: toàn bộ danh mục Gateway, bỏ qua `agents.defaults.models`. Dùng mục này cho giao diện chẩn đoán và khám phá, không dùng cho bộ chọn model thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, Gateway phát `exec.approval.requested`.
- Client của người vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu scope `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata phiên chuẩn). Các yêu cầu thiếu `systemRunPlan` sẽ bị từ chối.
- Sau khi phê duyệt, các lời gọi `node.invoke system.run` được chuyển tiếp sẽ dùng lại
  `systemRunPlan` chuẩn đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi sửa đổi `command`, `rawCommand`, `cwd`, `agentId`, hoặc
  `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` đã được phê duyệt cuối cùng,
  Gateway từ chối lượt chạy thay vì tin payload đã bị sửa đổi.

## Fallback phân phối agent

- Yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối ra ngoài.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: đích phân phối không phân giải được hoặc chỉ nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép fallback sang thực thi chỉ trong phiên khi không thể phân giải tuyến có thể phân phối bên ngoài (ví dụ phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).
- Kết quả `agent` cuối cùng có thể bao gồm `result.deliveryStatus` khi đã yêu cầu phân phối,
  dùng cùng các trạng thái `sent`, `suppressed`, `partial_failed`, và `failed`
  được ghi trong tài liệu cho [`openclaw agent --json --deliver`](/vi/cli/agent#json-delivery-status).

## Phiên bản hóa

- `PROTOCOL_VERSION` nằm trong `packages/gateway-protocol/src/version.ts`.
- Client gửi `minProtocol` + `maxProtocol`; máy chủ từ chối các khoảng
  không bao gồm giao thức hiện tại của nó. Client và máy chủ hiện tại yêu cầu
  giao thức v4.
- Schema + model được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số client

Client tham chiếu trong `src/gateway/client.ts` dùng các mặc định này. Giá trị
ổn định trên giao thức v4 và là baseline mong đợi cho client bên thứ ba.

| Hằng số                                  | Mặc định                                               | Nguồn                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Thời gian chờ yêu cầu (mỗi RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Thời gian chờ preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env có thể tăng ngân sách máy chủ/client theo cặp) |
| Backoff kết nối lại ban đầu                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Kẹp thử lại nhanh sau khi đóng device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Thời gian gia hạn force-stop trước `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Thời gian chờ mặc định của `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do tick-timeout                        | mã `4000` khi im lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Máy chủ quảng bá `policy.tickIntervalMs`, `policy.maxPayload`, và
`policy.maxBufferedBytes` có hiệu lực trong `hello-ok`; client nên tôn trọng các giá trị đó
thay vì các mặc định trước bắt tay.

## Xác thực

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy theo chế độ xác thực đã cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc không phải local loopback
  `gateway.auth.mode: "trusted-proxy"` đáp ứng kiểm tra xác thực kết nối từ
  header yêu cầu thay vì `connect.params.auth.*`.
- Ingress riêng tư `gateway.auth.mode: "none"` bỏ qua hoàn toàn xác thực kết nối
  bằng bí mật dùng chung; không để lộ chế độ đó trên ingress công khai/không đáng tin cậy.
- Sau khi ghép đôi, Gateway cấp một **mã thông báo thiết bị** giới hạn theo vai trò
  kết nối + phạm vi. Nó được trả về trong `hello-ok.auth.deviceToken` và nên được
  client lưu bền vững cho các lần kết nối sau.
- Client nên lưu bền vững `hello-ok.auth.deviceToken` chính sau mọi lần kết nối
  thành công.
- Kết nối lại bằng mã thông báo thiết bị **đã lưu** đó cũng nên tái sử dụng tập
  phạm vi đã phê duyệt được lưu cho mã thông báo đó. Điều này giữ lại quyền truy cập
  đọc/thăm dò/trạng thái đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại
  xuống phạm vi ngầm định chỉ dành cho quản trị viên.
- Lắp ghép xác thực kết nối phía client (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` là độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: trước hết là mã thông báo dùng chung tường minh,
    rồi đến `deviceToken` tường minh, rồi đến mã thông báo theo thiết bị đã lưu (được khóa theo
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được
    `auth.token`. Một mã thông báo dùng chung hoặc bất kỳ mã thông báo thiết bị đã phân giải nào
    sẽ chặn nó.
  - Tự động nâng cấp một mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được mở cho **điểm cuối đáng tin cậy** -
    loopback, hoặc `wss://` với `tlsFingerprint` đã ghim. `wss://` công khai
    không ghim sẽ không đủ điều kiện.
- Bootstrap bằng mã thiết lập tích hợp sẵn trả về
  `hello-ok.auth.deviceToken` của nút chính cùng một mã thông báo người vận hành có giới hạn trong
  `hello-ok.auth.deviceTokens` để chuyển giao di động đáng tin cậy. Mã thông báo người vận hành
  bao gồm `operator.talk.secrets` để đọc cấu hình Talk gốc và
  loại trừ `operator.admin` cùng `operator.pairing`.
- Khi bootstrap bằng mã thiết lập không phải baseline đang chờ phê duyệt, chi tiết `PAIRING_REQUIRED`
  bao gồm `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  và `pauseReconnect: false`. Client nên tiếp tục kết nối lại bằng cùng
  mã thông báo bootstrap cho đến khi yêu cầu được phê duyệt hoặc mã thông báo không còn hợp lệ.
- Chỉ lưu bền vững `hello-ok.auth.deviceTokens` khi lần kết nối dùng xác thực bootstrap
  trên một transport đáng tin cậy như `wss://` hoặc ghép đôi loopback/cục bộ.
- Nếu client cung cấp `deviceToken` **tường minh** hoặc `scopes` tường minh, tập
  phạm vi do caller yêu cầu đó vẫn là nguồn có thẩm quyền; phạm vi trong cache chỉ
  được tái sử dụng khi client đang tái sử dụng mã thông báo theo thiết bị đã lưu.
- Mã thông báo thiết bị có thể được xoay vòng/thu hồi qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`). Xoay vòng hoặc
  thu hồi một nút hoặc vai trò không phải người vận hành khác cũng yêu cầu `operator.admin`.
- `device.token.rotate` trả về siêu dữ liệu xoay vòng. Nó chỉ phản hồi lại mã thông báo bearer
  thay thế cho các lệnh gọi cùng thiết bị đã được xác thực bằng
  chính mã thông báo thiết bị đó, để client chỉ dùng mã thông báo có thể lưu bền vững mã thay thế trước khi
  kết nối lại. Các lần xoay vòng bằng mã dùng chung/quản trị không phản hồi mã thông báo bearer.
- Việc cấp, xoay vòng và thu hồi mã thông báo vẫn bị giới hạn trong tập vai trò đã phê duyệt
  được ghi trong mục ghép đôi của thiết bị đó; thao tác thay đổi mã thông báo không thể mở rộng hoặc
  nhắm tới vai trò thiết bị mà phê duyệt ghép đôi chưa từng cấp.
- Với các phiên mã thông báo thiết bị đã ghép đôi, quản lý thiết bị có phạm vi tự thân trừ khi
  caller cũng có `operator.admin`: caller không phải quản trị viên chỉ có thể quản lý
  mã thông báo người vận hành cho mục thiết bị **của chính họ**. Quản lý mã thông báo nút và các mã không phải người vận hành khác
  chỉ dành cho quản trị viên, kể cả với thiết bị của chính caller.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi mã thông báo người vận hành đích
  so với phạm vi phiên hiện tại của caller. Caller không phải quản trị viên
  không thể xoay vòng hoặc thu hồi một mã thông báo người vận hành rộng hơn mã họ đang giữ.
- Lỗi xác thực bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi client cho `AUTH_TOKEN_MISMATCH`:
  - Client đáng tin cậy có thể thử lại một lần có giới hạn bằng mã thông báo theo thiết bị trong cache.
  - Nếu lần thử lại đó thất bại, client nên dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho người vận hành.
- `AUTH_SCOPE_MISMATCH` nghĩa là mã thông báo thiết bị đã được nhận dạng nhưng không bao phủ
  vai trò/phạm vi được yêu cầu. Client không nên trình bày lỗi này như một mã thông báo sai;
  hãy nhắc người vận hành ghép đôi lại hoặc phê duyệt hợp đồng phạm vi hẹp/rộng hơn.

## Danh tính thiết bị + ghép đôi

- Nút nên bao gồm một danh tính thiết bị ổn định (`device.id`) được suy ra từ
  dấu vân tay của cặp khóa.
- Gateway cấp mã thông báo theo từng thiết bị + vai trò.
- Cần phê duyệt ghép đôi cho ID thiết bị mới trừ khi tự động phê duyệt cục bộ
  được bật.
- Tự động phê duyệt ghép đôi xoay quanh các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường tự kết nối backend/container-local hẹp cho
  các luồng trợ giúp bằng bí mật dùng chung đáng tin cậy.
- Các kết nối cùng máy chủ qua tailnet hoặc LAN vẫn được xem là từ xa đối với ghép đôi và
  cần phê duyệt.
- Client WS thường bao gồm danh tính `device` trong `connect` (người vận hành +
  nút). Các ngoại lệ người vận hành không có thiết bị duy nhất là các đường tin cậy tường minh:
  - `gateway.controlUi.allowInsecureAuth=true` để tương thích HTTP không an toàn chỉ trên localhost.
  - xác thực Control UI cho người vận hành bằng `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (phá kính khẩn cấp, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` qua direct-loopback trên đường trợ giúp nội bộ
    được dành riêng.
- Bỏ qua danh tính thiết bị có hệ quả về phạm vi. Khi một kết nối người vận hành không có thiết bị
  được cho phép qua một đường tin cậy tường minh, OpenClaw vẫn xóa
  phạm vi tự khai báo thành tập rỗng trừ khi đường đó có ngoại lệ
  bảo toàn phạm vi được đặt tên. Các phương thức bị chặn theo phạm vi sau đó sẽ thất bại với
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` là đường bảo toàn phạm vi
  phá kính khẩn cấp của Control UI. Nó không cấp phạm vi cho
  client WebSocket backend tùy chỉnh hoặc dạng CLI tùy ý.
- Đường trợ giúp backend `gateway-client` direct-loopback được dành riêng chỉ bảo toàn
  phạm vi cho RPC mặt phẳng điều khiển cục bộ nội bộ; ID backend tùy chỉnh không
  nhận ngoại lệ này.
- Mọi kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di trú xác thực thiết bị

Với client cũ vẫn dùng hành vi ký trước thử thách, `connect` hiện trả về
mã chi tiết `DEVICE_AUTH_*` dưới `error.details.code` cùng một `error.details.reason` ổn định.

Các lỗi di trú thường gặp:

| Thông báo                   | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi rỗng).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client đã ký bằng nonce cũ/sai.                   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp payload v2.             |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp dấu vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.      |

Mục tiêu di trú:

- Luôn chờ `connect.challenge`.
- Ký payload v2 bao gồm nonce của máy chủ.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  bên cạnh các trường thiết bị/client/vai trò/phạm vi/mã thông báo/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng việc ghim siêu dữ liệu
  thiết bị đã ghép đôi vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Client có thể tùy chọn ghim dấu vân tay chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này phơi bày **toàn bộ API Gateway** (trạng thái, kênh, mô hình, chat,
agent, phiên, nút, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi
các schema TypeBox trong `packages/gateway-protocol/src/schema.ts`.

## Liên quan

- [Giao thức bridge](/vi/gateway/bridge-protocol)
- [Runbook Gateway](/vi/gateway)
