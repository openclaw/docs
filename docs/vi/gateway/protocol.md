---
read_when:
    - Triển khai hoặc cập nhật máy khách WS của Gateway
    - Gỡ lỗi tình trạng không khớp giao thức hoặc lỗi kết nối
    - Tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-04-30T00:06:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol là **mặt phẳng điều khiển duy nhất + lớp truyền tải node** cho
OpenClaw. Tất cả client (CLI, web UI, ứng dụng macOS, node iOS/Android, node
headless) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi** của mình tại
thời điểm bắt tay.

## Lớp truyền tải

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **phải** là một yêu cầu `connect`.
- Các khung trước kết nối bị giới hạn ở 64 KiB. Sau khi bắt tay thành công, client
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán, các khung inbound quá cỡ
  và bộ đệm outbound chậm sẽ phát sự kiện `payload.large`
  trước khi Gateway đóng hoặc bỏ khung bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ phần thân thông báo,
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
    "maxProtocol": 3,
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
    "protocol": 3,
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
trả về lỗi `UNAVAILABLE` có thể thử lại, với `details.reason` được đặt thành
`"startup-sidecars"` và `retryAfterMs`. Client nên thử lại phản hồi đó
trong ngân sách kết nối tổng thể của mình thay vì hiển thị nó như một lỗi
bắt tay cuối cùng.

`server`, `features`, `snapshot` và `policy` đều bắt buộc theo schema
(`src/gateway/protocol/schema/frames.ts`). `auth` cũng bắt buộc và báo cáo
vai trò/phạm vi đã thương lượng. `canvasHostUrl` là tùy chọn.

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

Các client backend cùng tiến trình đáng tin cậy (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên các kết nối loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu Gateway dùng chung. Đường dẫn này được dành riêng
cho các RPC mặt phẳng điều khiển nội bộ và ngăn các baseline ghép đôi CLI/thiết bị cũ
chặn công việc backend cục bộ như cập nhật phiên subagent. Client từ xa,
client nguồn gốc trình duyệt, client node và client dùng token thiết bị/danh tính thiết bị
tường minh vẫn sử dụng các kiểm tra ghép đôi và nâng cấp phạm vi bình thường.

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
các mục vai trò bổ sung có giới hạn trong `deviceTokens`:

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

Đối với luồng bootstrap node/operator tích hợp sẵn, token node chính giữ nguyên
`scopes: []` và mọi token operator được bàn giao vẫn bị giới hạn trong allowlist operator
bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Các kiểm tra phạm vi bootstrap vẫn
có tiền tố theo vai trò: mục operator chỉ đáp ứng yêu cầu operator, và các vai trò không phải operator
vẫn cần phạm vi dưới tiền tố vai trò của chính chúng.

### Ví dụ node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

Các phương thức có hiệu ứng phụ yêu cầu **khóa idempotency** (xem schema).

## Vai trò + phạm vi

### Vai trò

- `operator` = client mặt phẳng điều khiển (CLI/UI/tự động hóa).
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

Các phương thức RPC Gateway do Plugin đăng ký có thể yêu cầu phạm vi operator riêng,
nhưng các tiền tố quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi phương thức chỉ là cổng kiểm tra đầu tiên. Một số lệnh slash truy cập qua
`chat.send` áp dụng các kiểm tra cấp lệnh nghiêm ngặt hơn ở phía trên. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có một kiểm tra phạm vi bổ sung tại thời điểm phê duyệt, phía trên
phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có lệnh node không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Năng lực/lệnh/quyền (node)

Node khai báo các tuyên bố năng lực tại thời điểm kết nối:

- `caps`: các danh mục năng lực cấp cao.
- `commands`: allowlist lệnh cho invoke.
- `permissions`: các công tắc chi tiết (ví dụ: `screen.record`, `camera.capture`).

Gateway xem các mục này là **tuyên bố** và thực thi allowlist phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Các mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị đó kết nối với cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Node đang kết nối báo cáo
  thời điểm kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; node đã ghép đôi cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện node đáng tin cậy cập nhật metadata ghép đôi của chúng.

### Sự kiện node còn sống trong nền

Node có thể gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một node đã ghép đôi
còn sống trong một lần đánh thức nền mà không đánh dấu nó là đang kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Các chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững cho các phiên thiết bị node
đã xác thực; phiên không có thiết bị hoặc chưa ghép đôi trả về `handled: false`.

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

## Phân phạm vi sự kiện broadcast

Các sự kiện broadcast WebSocket do máy chủ đẩy được kiểm soát theo phạm vi để các phiên chỉ có phạm vi ghép đôi hoặc chỉ dành cho node không thụ động nhận nội dung phiên.

- **Khung chat, agent và kết quả công cụ** (bao gồm các sự kiện `agent` được stream và kết quả gọi công cụ) yêu cầu ít nhất `operator.read`. Các phiên không có `operator.read` bỏ qua hoàn toàn các khung này.
- **Broadcast `plugin.*` do Plugin định nghĩa** được kiểm soát theo `operator.write` hoặc `operator.admin`, tùy theo cách Plugin đăng ký chúng.
- **Sự kiện trạng thái và truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để sức khỏe truyền tải vẫn quan sát được đối với mọi phiên đã xác thực.
- **Các họ sự kiện broadcast không xác định** mặc định được kiểm soát theo phạm vi (fail-closed) trừ khi một handler đã đăng ký nới lỏng chúng một cách tường minh.

Mỗi kết nối client giữ số thứ tự theo từng client riêng, để broadcast duy trì thứ tự tăng đơn điệu trên socket đó ngay cả khi các client khác nhau thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export phương thức
Plugin/channel đã tải. Hãy xem nó là khám phá tính năng, không phải danh sách
đầy đủ của `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về snapshot sức khỏe Gateway được lưu cache hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi ổn định chẩn đoán có giới hạn gần đây. Nó giữ metadata vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên channel/Plugin và id phiên. Nó không giữ văn bản chat, thân Webhook, đầu ra công cụ, thân yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Yêu cầu phạm vi đọc của operator.
    - `status` trả về tóm tắt Gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho client operator có phạm vi admin.
    - `gateway.identity.get` trả về danh tính thiết bị Gateway được dùng bởi các luồng relay và ghép đôi.
    - `system-presence` trả về snapshot hiện diện hiện tại cho các thiết bị operator/node đang kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/broadcast ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện heartbeat được lưu bền vững mới nhất.
    - `set-heartbeats` bật/tắt xử lý heartbeat trên Gateway.

  </Accordion>

  <Accordion title="Mô hình và sử dụng">
    - `models.list` trả về danh mục mô hình được thời gian chạy cho phép. Truyền `{ "view": "configured" }` cho các mô hình đã cấu hình có kích thước phù hợp cho bộ chọn (`agents.defaults.models` trước, sau đó `models.providers.*.models`), hoặc `{ "view": "all" }` cho danh mục đầy đủ.
    - `usage.status` trả về tóm tắt khoảng thời gian sử dụng và hạn mức còn lại của nhà cung cấp.
    - `usage.cost` trả về tóm tắt sử dụng chi phí tổng hợp cho một phạm vi ngày.
    - `doctor.memory.status` trả về mức sẵn sàng của bộ nhớ vector / phép nhúng được lưu đệm cho không gian làm việc của tác tử mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi rõ ràng muốn gửi ping trực tiếp tới nhà cung cấp phép nhúng.
    - `doctor.memory.remHarness` trả về bản xem trước khung thử nghiệm REM có giới hạn, chỉ đọc cho các máy khách mặt phẳng điều khiển từ xa. Nó có thể bao gồm đường dẫn không gian làm việc, đoạn trích bộ nhớ, Markdown có căn cứ đã kết xuất và các ứng viên thăng cấp sâu, vì vậy bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt sử dụng theo phiên.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình trợ giúp đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/Plugin tích hợp sẵn + đi kèm.
    - `channels.logout` đăng xuất khỏi một kênh/tài khoản cụ thể khi kênh hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có hỗ trợ QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một APNs push thử nghiệm tới một Node iOS đã đăng ký.
    - `voicewake.get` trả về các trình kích hoạt từ đánh thức đã lưu.
    - `voicewake.set` cập nhật trình kích hoạt từ đánh thức và phát quảng bá thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC phân phối gửi đi trực tiếp cho các lần gửi nhắm tới kênh/tài khoản/luồng bên ngoài trình chạy trò chuyện.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với các điều khiển con trỏ/giới hạn và số byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.config` trả về nội dung cấu hình Talk hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.mode` đặt/phát quảng bá trạng thái chế độ Talk hiện tại cho các máy khách WebChat/Control UI.
    - `talk.speak` tổng hợp lời nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp dự phòng và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về kiểm kê nhà cung cấp TTS hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRefs đang hoạt động và chỉ hoán đổi trạng thái bí mật thời gian chạy khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật theo lệnh/đích cho một tập lệnh/đích cụ thể.
    - `config.get` trả về ảnh chụp cấu hình hiện tại và giá trị băm.
    - `config.set` ghi một nội dung cấu hình đã xác thực.
    - `config.patch` hợp nhất một cập nhật cấu hình từng phần.
    - `config.apply` xác thực + thay thế toàn bộ nội dung cấu hình.
    - `config.schema` trả về nội dung lược đồ cấu hình trực tiếp được công cụ Control UI và CLI sử dụng: lược đồ, `uiHints`, phiên bản và siêu dữ liệu tạo sinh, bao gồm siêu dữ liệu lược đồ Plugin + kênh khi thời gian chạy có thể tải được. Lược đồ bao gồm siêu dữ liệu trường `title` / `description` được dẫn xuất từ cùng các nhãn và văn bản trợ giúp mà UI sử dụng, bao gồm đối tượng lồng nhau, ký tự đại diện, mục mảng và các nhánh kết hợp `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về nội dung tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một nút lược đồ nông, gợi ý khớp + `hintPath`, và tóm tắt con trực tiếp cho truy sâu UI/CLI. Các nút lược đồ tra cứu giữ lại tài liệu hướng tới người dùng và các trường xác thực chung (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn dạng số/chuỗi/mảng/đối tượng và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, cùng `hint` / `hintPath` đã khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi bản cập nhật tự nó thành công.
    - `update.status` trả về chỉ báo khởi động lại sau cập nhật được lưu đệm mới nhất, bao gồm phiên bản đang chạy sau khi khởi động lại khi có.
    - `wizard.start`, `wizard.next`, `wizard.status` và `wizard.cancel` cung cấp trình hướng dẫn khởi tạo qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp tác tử và không gian làm việc">
    - `agents.list` trả về các mục tác tử đã cấu hình, bao gồm mô hình hiệu lực và siêu dữ liệu thời gian chạy.
    - `agents.create`, `agents.update` và `agents.delete` quản lý bản ghi tác tử và liên kết không gian làm việc.
    - `agents.files.list`, `agents.files.get` và `agents.files.set` quản lý các tệp không gian làm việc khởi tạo được hiển thị cho một tác tử.
    - `agent.identity.get` trả về danh tính trợ lý hiệu lực cho một tác tử hoặc phiên.
    - `agent.wait` chờ một lượt chạy kết thúc và trả về ảnh chụp trạng thái cuối khi có.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` theo từng hàng khi phần phụ trợ thời gian chạy tác tử được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho máy khách WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện bản ghi hội thoại/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước bản ghi hội thoại có giới hạn cho các khóa phiên cụ thể.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một đích phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào một phiên hiện có.
    - `sessions.steer` là biến thể ngắt-và-điều hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy bỏ công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` cùng `runId` tùy chọn, hoặc chỉ truyền `runId` cho các lượt chạy đang hoạt động mà Gateway có thể phân giải thành một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/ghi đè phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` hiệu lực.
    - `sessions.reset`, `sessions.delete` và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về hàng phiên đã lưu trữ đầy đủ.
    - Thực thi trò chuyện vẫn dùng `chat.history`, `chat.send`, `chat.abort` và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho máy khách UI: các thẻ chỉ thị nội tuyến bị loại bỏ khỏi văn bản hiển thị, các nội dung XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và các khối gọi công cụ bị cắt ngắn) và các mã thông báo điều khiển mô hình ASCII/toàn độ rộng bị rò rỉ bị loại bỏ, các hàng trợ lý chỉ chứa mã thông báo im lặng như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay thế bằng phần giữ chỗ.

  </Accordion>

  <Accordion title="Ghép cặp thiết bị và mã thông báo thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép cặp đang chờ và đã được phê duyệt.
    - `device.pair.approve`, `device.pair.reject` và `device.pair.remove` quản lý bản ghi ghép cặp thiết bị.
    - `device.token.rotate` xoay vòng mã thông báo thiết bị đã ghép cặp trong giới hạn vai trò đã được phê duyệt và phạm vi bên gọi của nó.
    - `device.token.revoke` thu hồi mã thông báo thiết bị đã ghép cặp trong giới hạn vai trò đã được phê duyệt và phạm vi bên gọi của nó.

  </Accordion>

  <Accordion title="Ghép cặp Node, gọi và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` và `node.pair.verify` bao quát ghép cặp Node và xác minh khởi tạo.
    - `node.list` và `node.describe` trả về trạng thái Node đã biết/đang kết nối.
    - `node.rename` cập nhật nhãn Node đã ghép cặp.
    - `node.invoke` chuyển tiếp một lệnh tới Node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu gọi.
    - `node.event` mang các sự kiện bắt nguồn từ Node trở lại Gateway.
    - `node.canvas.capability.refresh` làm mới các mã thông báo năng lực khung vẽ có phạm vi.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi Node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các Node ngoại tuyến/bị ngắt kết nối.

  </Accordion>

  <Accordion title="Các nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` và `exec.approval.resolve` bao quát các yêu cầu phê duyệt thực thi một lần cùng tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt thực thi đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý ảnh chụp chính sách phê duyệt thực thi Gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt thực thi cục bộ của Node qua các lệnh chuyển tiếp Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` và `plugin.approval.resolve` bao quát các luồng phê duyệt do Plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc vào Heartbeat kế tiếp; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc theo lịch.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện chung

- `chat`: cập nhật trò chuyện UI như `chat.inject` và các sự kiện trò chuyện
  chỉ liên quan đến bản ghi hội thoại khác.
- `session.message` và `session.tool`: cập nhật bản ghi hội thoại/luồng sự kiện cho một
  phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: cập nhật ảnh chụp sự hiện diện hệ thống.
- `tick`: sự kiện duy trì kết nối / trạng thái sống định kỳ.
- `health`: cập nhật ảnh chụp tình trạng Gateway.
- `heartbeat`: cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi lượt chạy/công việc Cron.
- `shutdown`: thông báo tắt Gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép cặp Node.
- `node.invoke.request`: phát quảng bá yêu cầu gọi Node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép cặp.
- `voicewake.changed`: cấu hình trình kích hoạt từ đánh thức đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt thực thi.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt Plugin.

### Phương thức trợ giúp Node

- Các Node có thể gọi `skills.bins` để lấy danh sách hiện tại các tệp thực thi Skills
  cho kiểm tra tự động cho phép.

### Phương thức trợ giúp người vận hành

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh thời gian chạy cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc agent mặc định.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có dấu `/` ở đầu
    - `native` và đường dẫn mặc định `both` trả về tên native nhận biết nhà cung cấp khi có sẵn
  - `textAliases` mang các bí danh slash chính xác như `/model` và `/m`.
  - `nativeName` mang tên lệnh native nhận biết nhà cung cấp khi tồn tại.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cùng khả năng có sẵn của lệnh plugin native.
  - `includeArgs=false` bỏ qua metadata đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy danh mục công cụ thời gian chạy cho một agent. Phản hồi bao gồm các công cụ được nhóm và metadata nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu plugin khi `source="plugin"`
  - `optional`: công cụ plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực trong thời gian chạy cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh thời gian chạy đáng tin cậy từ phiên ở phía máy chủ thay vì chấp nhận ngữ cảnh xác thực hoặc phân phối do bên gọi cung cấp.
  - Phản hồi được giới hạn theo phiên và phản ánh những gì cuộc trò chuyện đang hoạt động có thể dùng ngay bây giờ, bao gồm công cụ lõi, plugin và kênh.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy danh mục skill hiển thị cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc agent mặc định.
  - Phản hồi bao gồm tính đủ điều kiện, yêu cầu còn thiếu, kiểm tra cấu hình và các tùy chọn cài đặt đã được làm sạch mà không để lộ giá trị bí mật thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) cho metadata khám phá ClawHub.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một thư mục skill vào thư mục `skills/` của không gian làm việc agent mặc định.
  - Chế độ trình cài đặt Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` chạy một hành động `metadata.openclaw.install` đã khai báo trên máy chủ Gateway.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả bản cài đặt ClawHub được theo dõi trong không gian làm việc agent mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`, `apiKey` và `env`.

### Các chế độ xem `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi thời gian chạy hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là danh mục được cho phép; nếu không, phản hồi là toàn bộ danh mục Gateway.
- `"configured"`: hành vi có kích thước phù hợp với bộ chọn. Nếu `agents.defaults.models` được cấu hình, giá trị đó vẫn được ưu tiên. Nếu không, phản hồi dùng các mục `models.providers.*.models` rõ ràng, chỉ quay về toàn bộ danh mục khi không có hàng mô hình đã cấu hình nào tồn tại.
- `"all"`: toàn bộ danh mục Gateway, bỏ qua `agents.defaults.models`. Dùng chế độ này cho chẩn đoán và UI khám phá, không dùng cho bộ chọn mô hình thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, gateway phát `exec.approval.requested`.
- Máy khách người vận hành giải quyết bằng cách gọi `exec.approval.resolve` (yêu cầu phạm vi `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata phiên chuẩn). Yêu cầu thiếu `systemRunPlan` sẽ bị từ chối.
- Sau khi được phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ tái sử dụng `systemRunPlan` chuẩn đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` cuối cùng đã được phê duyệt, gateway từ chối lần chạy thay vì tin payload đã bị thay đổi.

## Dự phòng phân phối agent

- Yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối đi.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: mục tiêu phân phối không phân giải được hoặc chỉ dùng nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép dự phòng sang thực thi chỉ theo phiên khi không thể phân giải tuyến có thể phân phối ra bên ngoài (ví dụ phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).

## Quản lý phiên bản

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/schema/protocol-schemas.ts`.
- Máy khách gửi `minProtocol` + `maxProtocol`; máy chủ từ chối các trường hợp không khớp.
- Schema + mô hình được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số máy khách

Máy khách tham chiếu trong `src/gateway/client.ts` dùng các mặc định này. Các giá trị ổn định trên protocol v3 và là đường cơ sở kỳ vọng cho máy khách bên thứ ba.

| Hằng số                                   | Mặc định                                              | Nguồn                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Thời gian chờ yêu cầu (mỗi RPC)           | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Thời gian chờ preauth / connect-challenge | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env có thể tăng ngân sách máy chủ/máy khách theo cặp) |
| Backoff kết nối lại ban đầu               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Giới hạn thử lại nhanh sau khi đóng device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Khoảng chờ force-stop trước `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Thời gian chờ mặc định của `stopAndWait()` | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)   | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do tick-timeout                      | code `4000` khi im lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Máy chủ quảng bá `policy.tickIntervalMs`, `policy.maxPayload` và `policy.maxBufferedBytes` có hiệu lực trong `hello-ok`; máy khách nên tuân thủ các giá trị đó thay vì các mặc định trước bắt tay.

## Xác thực

- Xác thực gateway bằng shared-secret dùng `connect.params.auth.token` hoặc `connect.params.auth.password`, tùy theo chế độ xác thực đã cấu hình.
- Các chế độ mang định danh như Tailscale Serve (`gateway.auth.allowTailscale: true`) hoặc `gateway.auth.mode: "trusted-proxy"` không phải loopback đáp ứng kiểm tra xác thực kết nối từ header yêu cầu thay vì `connect.params.auth.*`.
- `gateway.auth.mode: "none"` cho private-ingress bỏ qua hoàn toàn xác thực kết nối bằng shared-secret; không để lộ chế độ đó trên ingress công khai/không đáng tin cậy.
- Sau khi ghép nối, Gateway phát hành **device token** được giới hạn theo vai trò kết nối + phạm vi. Token này được trả về trong `hello-ok.auth.deviceToken` và nên được máy khách lưu lại cho các lần kết nối sau.
- Máy khách nên lưu `hello-ok.auth.deviceToken` chính sau bất kỳ lần kết nối thành công nào.
- Kết nối lại bằng device token **đã lưu** đó cũng nên tái sử dụng tập phạm vi đã được phê duyệt và lưu cho token đó. Điều này giữ nguyên quyền truy cập đọc/thăm dò/trạng thái đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại xuống phạm vi ngầm chỉ dành cho quản trị viên.
- Lắp ráp xác thực kết nối phía máy khách (`selectConnectAuth` trong `src/gateway/client.ts`):
  - `auth.password` độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: shared token rõ ràng trước, sau đó là `deviceToken` rõ ràng, rồi token theo thiết bị đã lưu (được khóa bằng `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được `auth.token`. Shared token hoặc bất kỳ device token nào đã phân giải sẽ chặn nó.
  - Tự động thăng cấp device token đã lưu trong lần thử lại một lần `AUTH_TOKEN_MISMATCH` chỉ được cho phép với **endpoint đáng tin cậy** — loopback, hoặc `wss://` với `tlsFingerprint` đã ghim. `wss://` công khai không ghim không đủ điều kiện.
- Các mục `hello-ok.auth.deviceTokens` bổ sung là token bàn giao bootstrap. Chỉ lưu chúng khi kết nối dùng xác thực bootstrap trên một transport đáng tin cậy như `wss://` hoặc ghép nối loopback/local.
- Nếu máy khách cung cấp `deviceToken` **rõ ràng** hoặc `scopes` rõ ràng, tập phạm vi do bên gọi yêu cầu đó vẫn có thẩm quyền; phạm vi trong cache chỉ được tái sử dụng khi máy khách đang tái sử dụng token theo thiết bị đã lưu.
- Device token có thể được xoay vòng/thu hồi qua `device.token.rotate` và `device.token.revoke` (yêu cầu phạm vi `operator.pairing`).
- `device.token.rotate` trả về metadata xoay vòng. Nó chỉ echo bearer token thay thế cho các lệnh gọi cùng thiết bị đã được xác thực bằng device token đó, để máy khách chỉ dùng token có thể lưu token thay thế trước khi kết nối lại. Các lần xoay vòng shared/admin không echo bearer token.
- Việc phát hành, xoay vòng và thu hồi token vẫn bị giới hạn trong tập vai trò đã phê duyệt được ghi trong mục ghép nối của thiết bị đó; thao tác token không thể mở rộng hoặc nhắm tới một vai trò thiết bị mà phê duyệt ghép nối chưa từng cấp.
- Với phiên token của thiết bị đã ghép nối, quản lý thiết bị được giới hạn theo chính thiết bị đó trừ khi bên gọi cũng có `operator.admin`: bên gọi không phải quản trị viên chỉ có thể xóa/thu hồi/xoay vòng mục thiết bị **của chính họ**.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi token người vận hành mục tiêu so với phạm vi phiên hiện tại của bên gọi. Bên gọi không phải quản trị viên không thể xoay vòng hoặc thu hồi token người vận hành rộng hơn token họ đang giữ.
- Lỗi xác thực bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi máy khách cho `AUTH_TOKEN_MISMATCH`:
  - Máy khách đáng tin cậy có thể thử lại một lần có giới hạn bằng token theo thiết bị trong cache.
  - Nếu lần thử lại đó thất bại, máy khách nên dừng vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho người vận hành.

## Định danh thiết bị + ghép nối

- Các Node nên bao gồm một định danh thiết bị ổn định (`device.id`) được suy ra từ
  dấu vân tay của cặp khóa.
- Các Gateway cấp token theo từng thiết bị + vai trò.
- Phê duyệt ghép nối là bắt buộc đối với ID thiết bị mới, trừ khi tự động phê duyệt cục bộ
  được bật.
- Tự động phê duyệt ghép nối tập trung vào các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường tự kết nối backend/container-local hẹp dành cho
  các luồng helper dùng shared-secret đáng tin cậy.
- Các kết nối tailnet hoặc LAN cùng host vẫn được xem là từ xa khi ghép nối và
  yêu cầu phê duyệt.
- Client WS thường bao gồm định danh `device` trong khi `connect` (operator +
  node). Các ngoại lệ operator không có thiết bị duy nhất là các đường tin cậy rõ ràng:
  - `gateway.controlUi.allowInsecureAuth=true` cho khả năng tương thích HTTP không an toàn chỉ dành cho localhost.
  - xác thực Control UI của operator bằng `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (biện pháp khẩn cấp, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` qua direct-loopback được xác thực bằng token/mật khẩu Gateway
    dùng chung.
- Tất cả kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di chuyển xác thực thiết bị

Đối với các client cũ vẫn dùng hành vi ký trước challenge, `connect` giờ trả về
mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` với `error.details.reason` ổn định.

Các lỗi di chuyển thường gặp:

| Thông báo                   | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi trống).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client đã ký bằng nonce cũ/sai.                   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp với payload v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.    |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp với dấu vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai không thành công. |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký payload v2 có bao gồm nonce của máy chủ.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  ngoài các trường device/client/role/scopes/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng việc ghim metadata
  thiết bị đã ghép nối vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Client có thể tùy chọn ghim dấu vân tay chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng với `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này cung cấp **toàn bộ API Gateway** (trạng thái, kênh, mô hình, chat,
agent, phiên, node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi các schema
TypeBox trong `src/gateway/protocol/schema.ts`.

## Liên quan

- [Giao thức Bridge](/vi/gateway/bridge-protocol)
- [Runbook Gateway](/vi/gateway)
