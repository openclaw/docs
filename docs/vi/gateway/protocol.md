---
read_when:
    - Triển khai hoặc cập nhật các ứng dụng khách WS của Gateway
    - Gỡ lỗi các điểm không khớp giao thức hoặc lỗi kết nối
    - Đang tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-05-03T21:32:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức Gateway WS là **mặt phẳng điều khiển duy nhất + truyền tải Node** cho
OpenClaw. Tất cả client (CLI, giao diện web, ứng dụng macOS, Node iOS/Android,
Node không giao diện) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi**
của chúng tại thời điểm bắt tay.

## Truyền tải

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **phải** là yêu cầu `connect`.
- Các khung trước khi kết nối bị giới hạn ở 64 KiB. Sau khi bắt tay thành công, client
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các khung đến quá lớn và bộ đệm đi chậm sẽ phát sự kiện `payload.large`
  trước khi gateway đóng hoặc bỏ khung bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ phần thân thông điệp,
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
trả về lỗi `UNAVAILABLE` có thể thử lại với `details.reason` được đặt thành
`"startup-sidecars"` và `retryAfterMs`. Client nên thử lại phản hồi đó
trong ngân sách kết nối tổng thể thay vì hiển thị nó như một lỗi bắt tay
cuối cùng.

`server`, `features`, `snapshot` và `policy` đều là bắt buộc theo schema
(`src/gateway/protocol/schema/frames.ts`). `auth` cũng là bắt buộc và báo cáo
vai trò/phạm vi đã thương lượng. `canvasHostUrl` là tùy chọn.

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
cho các RPC mặt phẳng điều khiển nội bộ và ngăn baseline ghép cặp CLI/thiết bị cũ
chặn công việc backend cục bộ như cập nhật phiên subagent. Client từ xa,
client có nguồn gốc trình duyệt, client Node và client dùng device-token/device-identity
tường minh vẫn sử dụng các kiểm tra ghép cặp và nâng cấp phạm vi thông thường.

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

Đối với luồng bootstrap Node/operator tích hợp sẵn, token Node chính vẫn giữ
`scopes: []` và mọi token operator được bàn giao vẫn bị giới hạn trong allowlist
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Các kiểm tra phạm vi bootstrap vẫn
có tiền tố theo vai trò: các mục operator chỉ đáp ứng yêu cầu operator, và các vai trò
không phải operator vẫn cần phạm vi dưới tiền tố vai trò riêng của chúng.

### Ví dụ về Node

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

Các phương thức có tác dụng phụ yêu cầu **khóa idempotency** (xem schema).

## Vai trò + phạm vi

Để xem đầy đủ mô hình phạm vi operator, các kiểm tra tại thời điểm phê duyệt và
ngữ nghĩa shared-secret, hãy xem [Phạm vi operator](/vi/gateway/operator-scopes).

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
nhưng các tiền tố quản trị lõi được dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi phương thức chỉ là cổng đầu tiên. Một số lệnh slash đi qua
`chat.send` áp dụng các kiểm tra cấp lệnh nghiêm ngặt hơn ở phía trên. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có một kiểm tra phạm vi bổ sung tại thời điểm phê duyệt bên trên
phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu với lệnh Node không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Năng lực/lệnh/quyền (Node)

Node khai báo các claim năng lực tại thời điểm kết nối:

- `caps`: các danh mục năng lực cấp cao.
- `commands`: allowlist lệnh cho invoke.
- `permissions`: các công tắc chi tiết (ví dụ `screen.record`, `camera.capture`).

Gateway xem các mục này là **claim** và thực thi allowlist phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Các mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị đó kết nối dưới cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Node đã kết nối báo cáo
  thời gian kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; Node đã ghép cặp cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện Node đáng tin cậy cập nhật metadata ghép cặp của chúng.

### Sự kiện Node hoạt động trong nền

Node có thể gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một Node đã ghép cặp
đã hoạt động trong một lần đánh thức nền mà không đánh dấu nó là đã kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Các chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững đối với phiên thiết bị Node đã xác thực;
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

Các sự kiện broadcast WebSocket do máy chủ đẩy được giới hạn theo phạm vi để các phiên chỉ có phạm vi ghép cặp hoặc chỉ dành cho Node không thụ động nhận nội dung phiên.

- **Khung chat, agent và kết quả công cụ** (bao gồm các sự kiện `agent` được stream và kết quả lệnh gọi công cụ) yêu cầu tối thiểu `operator.read`. Các phiên không có `operator.read` bỏ qua hoàn toàn các khung này.
- **Broadcast `plugin.*` do Plugin định nghĩa** được giới hạn bằng `operator.write` hoặc `operator.admin`, tùy theo cách Plugin đăng ký chúng.
- **Sự kiện trạng thái và truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để mọi phiên đã xác thực đều có thể quan sát tình trạng truyền tải.
- **Các họ sự kiện broadcast không xác định** mặc định được giới hạn theo phạm vi (fail-closed) trừ khi một handler đã đăng ký nới lỏng chúng một cách tường minh.

Mỗi kết nối client giữ số thứ tự riêng theo từng client để các broadcast giữ thứ tự đơn điệu trên socket đó ngay cả khi các client khác nhau thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export phương thức
Plugin/channel đã tải. Hãy xem nó là khám phá tính năng, không phải là bản
liệt kê đầy đủ của `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về snapshot tình trạng gateway đã được lưu cache hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi chẩn đoán ổn định có giới hạn gần đây. Nó giữ metadata vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên channel/Plugin và id phiên. Nó không giữ văn bản chat, phần thân Webhook, đầu ra công cụ, phần thân yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Cần phạm vi đọc operator.
    - `status` trả về bản tóm tắt gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho client operator có phạm vi admin.
    - `gateway.identity.get` trả về danh tính thiết bị gateway được dùng bởi các luồng relay và ghép cặp.
    - `system-presence` trả về snapshot hiện diện hiện tại cho các thiết bị operator/Node đã kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/broadcast ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện Heartbeat được lưu bền vững mới nhất.
    - `set-heartbeats` bật/tắt xử lý Heartbeat trên gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Truyền `{ "view": "configured" }` cho các mô hình đã cấu hình có kích thước phù hợp với bộ chọn (`agents.defaults.models` trước, sau đó là `models.providers.*.models`), hoặc `{ "view": "all" }` cho danh mục đầy đủ.
    - `usage.status` trả về các cửa sổ sử dụng nhà cung cấp/tóm tắt hạn mức còn lại.
    - `usage.cost` trả về tóm tắt mức sử dụng chi phí đã tổng hợp cho một khoảng ngày.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của bộ nhớ vector / embedding được lưu cache cho workspace agent mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi rõ ràng muốn ping trực tiếp nhà cung cấp embedding.
    - `doctor.memory.remHarness` trả về bản xem trước harness REM có giới hạn, chỉ đọc cho các client control-plane từ xa. Nó có thể bao gồm đường dẫn workspace, đoạn trích bộ nhớ, markdown có căn cứ đã render và các ứng viên quảng bá sâu, vì vậy bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt mức sử dụng theo từng phiên.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình trợ giúp đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/plugin tích hợp sẵn + được đóng gói.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh hỗ trợ đăng xuất.
    - `web.login.start` khởi động luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có hỗ trợ QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một thông báo đẩy APNs thử nghiệm đến Node iOS đã đăng ký.
    - `voicewake.get` trả về các trình kích hoạt wake-word đã lưu.
    - `voicewake.set` cập nhật các trình kích hoạt wake-word và phát quảng bá thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi đi trực tiếp cho các lượt gửi nhắm đến kênh/tài khoản/luồng bên ngoài trình chạy chat.
    - `logs.tail` trả về phần cuối nhật ký tệp Gateway đã cấu hình với các điều khiển con trỏ/giới hạn và số byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.config` trả về payload cấu hình Talk hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.mode` đặt/phát quảng bá trạng thái chế độ Talk hiện tại cho các client WebChat/Control UI.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp dự phòng và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về danh sách nhà cung cấp TTS hiển thị.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRef đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật nhắm đến lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về snapshot cấu hình hiện tại và hash.
    - `config.set` ghi một payload cấu hình đã được xác thực.
    - `config.patch` hợp nhất một bản cập nhật cấu hình một phần.
    - `config.apply` xác thực + thay thế toàn bộ payload cấu hình.
    - `config.schema` trả về payload schema cấu hình trực tiếp được Control UI và công cụ CLI sử dụng: schema, `uiHints`, phiên bản và siêu dữ liệu tạo sinh, bao gồm siêu dữ liệu schema plugin + kênh khi runtime có thể tải được. Schema bao gồm siêu dữ liệu trường `title` / `description` bắt nguồn từ cùng nhãn và văn bản trợ giúp mà UI sử dụng, bao gồm các nhánh đối tượng lồng nhau, wildcard, phần tử mảng và cấu hợp `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về payload tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một nút schema nông, gợi ý khớp + `hintPath`, và tóm tắt con trực tiếp cho thao tác đi sâu UI/CLI. Các nút schema tra cứu giữ tài liệu hướng người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, cùng với `hint` / `hintPath` đã khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi bản cập nhật tự nó thành công; bên gọi có phiên có thể bao gồm `continuationMessage` để khi khởi động tiếp tục một lượt agent theo dõi thông qua hàng đợi tiếp tục sau khởi động lại. Cập nhật bằng trình quản lý gói buộc một lần khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi gói để tiến trình Gateway cũ không tiếp tục tải lười từ cây `dist` đã bị thay thế.
    - `update.status` trả về sentinel khởi động lại cập nhật được lưu cache mới nhất, bao gồm phiên bản đang chạy sau khởi động lại khi có.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` cung cấp trình hướng dẫn onboarding qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp agent và workspace">
    - `agents.list` trả về các mục agent đã cấu hình, bao gồm mô hình hiệu lực và siêu dữ liệu runtime.
    - `agents.create`, `agents.update`, và `agents.delete` quản lý bản ghi agent và nối dây workspace.
    - `agents.files.list`, `agents.files.get`, và `agents.files.set` quản lý các tệp workspace bootstrap được cung cấp cho một agent.
    - `artifacts.list`, `artifacts.get`, và `artifacts.download` cung cấp tóm tắt artifact bắt nguồn từ transcript và bản tải xuống cho một phạm vi `sessionKey`, `runId`, hoặc `taskId` rõ ràng. Truy vấn lượt chạy và tác vụ phân giải phiên sở hữu ở phía máy chủ và chỉ trả về phương tiện transcript có provenance khớp; nguồn URL không an toàn hoặc cục bộ trả về bản tải xuống không được hỗ trợ thay vì fetch phía máy chủ.
    - `agent.identity.get` trả về danh tính trợ lý hiệu lực cho một agent hoặc phiên.
    - `agent.wait` chờ một lượt chạy hoàn tất và trả về snapshot kết thúc khi có.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm siêu dữ liệu `agentRuntime` theo từng hàng khi backend runtime agent được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho client WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện transcript/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước transcript có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho một khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một đích phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào phiên hiện có.
    - `sessions.steer` là biến thể ngắt-và-điều-hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` cùng `runId` tùy chọn, hoặc chỉ truyền `runId` cho các lượt chạy đang hoạt động mà Gateway có thể phân giải tới một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/ghi đè phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` hiệu lực.
    - `sessions.reset`, `sessions.delete`, và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu.
    - Thực thi chat vẫn dùng `chat.history`, `chat.send`, `chat.abort`, và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho client UI: các thẻ chỉ thị nội tuyến bị loại bỏ khỏi văn bản hiển thị, payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn) cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ đều bị loại bỏ, các hàng trợ lý chỉ gồm token im lặng như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.

  </Accordion>

  <Accordion title="Ghép đôi thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép đôi đang chờ và đã phê duyệt.
    - `device.pair.approve`, `device.pair.reject`, và `device.pair.remove` quản lý bản ghi ghép đôi thiết bị.
    - `device.token.rotate` xoay token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi.
    - `device.token.revoke` thu hồi token thiết bị đã ghép đôi trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi.

  </Accordion>

  <Accordion title="Ghép đôi Node, invoke và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, và `node.pair.verify` bao quát ghép đôi Node và xác minh bootstrap.
    - `node.list` và `node.describe` trả về trạng thái Node đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn Node đã ghép đôi.
    - `node.invoke` chuyển tiếp một lệnh đến Node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu invoke.
    - `node.event` mang các sự kiện bắt nguồn từ Node trở lại gateway.
    - `node.canvas.capability.refresh` làm mới token năng lực canvas theo phạm vi.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi Node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc chờ bền vững cho các Node ngoại tuyến/ngắt kết nối.

  </Accordion>

  <Accordion title="Nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, và `exec.approval.resolve` bao quát các yêu cầu phê duyệt exec một lần cùng tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý snapshot chính sách phê duyệt exec của gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ trên Node thông qua các lệnh chuyển tiếp Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, và `plugin.approval.resolve` bao quát các luồng phê duyệt do plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc ở Heartbeat tiếp theo; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: các cập nhật chat UI như `chat.inject` và các sự kiện chat chỉ dành cho transcript khác.
- `session.message` và `session.tool`: các cập nhật transcript/luồng sự kiện cho một phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: cập nhật snapshot hiện diện hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: cập nhật snapshot sức khỏe gateway.
- `heartbeat`: cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi lượt chạy/công việc Cron.
- `shutdown`: thông báo tắt gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép đôi Node.
- `node.invoke.request`: phát quảng bá yêu cầu invoke Node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép đôi.
- `voicewake.changed`: cấu hình trình kích hoạt wake-word đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt plugin.

### Phương thức trợ giúp Node

- Node có thể gọi `skills.bins` để lấy danh sách hiện tại các tệp thực thi skill cho kiểm tra tự động cho phép.

### Phương thức trợ giúp Operator

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh thời gian chạy cho một tác tử.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc của tác tử mặc định.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có dấu `/` ở đầu
    - `native` và đường dẫn `both` mặc định trả về tên native nhận biết nhà cung cấp khi có sẵn
  - `textAliases` mang các bí danh slash chính xác như `/model` và `/m`.
  - `nativeName` mang tên lệnh native nhận biết nhà cung cấp khi tồn tại.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cùng tính khả dụng của lệnh Plugin native.
  - `includeArgs=false` bỏ qua siêu dữ liệu đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy danh mục công cụ thời gian chạy cho một tác tử. Phản hồi bao gồm các công cụ được nhóm và siêu dữ liệu nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu Plugin khi `source="plugin"`
  - `optional`: công cụ Plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực trong thời gian chạy cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh thời gian chạy đáng tin cậy từ phiên ở phía máy chủ thay vì chấp nhận xác thực hoặc ngữ cảnh phân phối do bên gọi cung cấp.
  - Phản hồi có phạm vi theo phiên và phản ánh những gì cuộc hội thoại đang hoạt động có thể sử dụng ngay bây giờ, bao gồm công cụ lõi, Plugin và kênh.
- Người vận hành có thể gọi `tools.invoke` (`operator.write`) để gọi một công cụ khả dụng thông qua cùng đường dẫn chính sách Gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm` và `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều có mặt, tác tử của phiên đã phân giải phải khớp với `agentId`.
  - Phản hồi là một phong bì hướng tới SDK với các trường `ok`, `toolName`, `output` tùy chọn và `error` có kiểu. Từ chối do phê duyệt hoặc chính sách trả về `ok:false` trong payload thay vì bỏ qua pipeline chính sách công cụ của Gateway.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy danh mục Skills hiển thị cho một tác tử.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc của tác tử mặc định.
  - Phản hồi bao gồm tính đủ điều kiện, yêu cầu còn thiếu, kiểm tra cấu hình và các tùy chọn cài đặt đã làm sạch mà không để lộ giá trị bí mật thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) để lấy siêu dữ liệu khám phá ClawHub.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một thư mục Skills vào thư mục `skills/` của không gian làm việc tác tử mặc định.
  - Chế độ trình cài đặt Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` chạy một hành động `metadata.openclaw.install` đã khai báo trên máy chủ Gateway.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả cài đặt ClawHub được theo dõi trong không gian làm việc tác tử mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`, `apiKey` và `env`.

### Các dạng xem `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi thời gian chạy hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là danh mục được phép; nếu không, phản hồi là toàn bộ danh mục Gateway.
- `"configured"`: hành vi có kích thước phù hợp bộ chọn. Nếu `agents.defaults.models` được cấu hình, nó vẫn được ưu tiên. Nếu không, phản hồi sử dụng các mục `models.providers.*.models` rõ ràng, chỉ dự phòng về toàn bộ danh mục khi không có hàng mô hình nào được cấu hình.
- `"all"`: toàn bộ danh mục Gateway, bỏ qua `agents.defaults.models`. Dùng mục này cho chẩn đoán và giao diện người dùng khám phá, không dùng cho bộ chọn mô hình thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, Gateway phát `exec.approval.requested`.
- Máy khách người vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu phạm vi `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/siêu dữ liệu phiên chuẩn). Các yêu cầu thiếu `systemRunPlan` bị từ chối.
- Sau khi được phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ tái sử dụng `systemRunPlan` chuẩn đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` đã phê duyệt cuối cùng, Gateway từ chối lần chạy thay vì tin payload đã bị thay đổi.

## Dự phòng phân phối tác tử

- Yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối ra ngoài.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: các mục tiêu phân phối không phân giải được hoặc chỉ dùng nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép dự phòng sang thực thi chỉ trong phiên khi không phân giải được tuyến có thể phân phối bên ngoài (ví dụ phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).

## Quản lý phiên bản

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/schema/protocol-schemas.ts`.
- Máy khách gửi `minProtocol` + `maxProtocol`; máy chủ từ chối khi không khớp.
- Schema + mô hình được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số máy khách

Máy khách tham chiếu trong `src/gateway/client.ts` sử dụng các giá trị mặc định này. Các giá trị ổn định xuyên suốt protocol v3 và là đường cơ sở được kỳ vọng cho máy khách bên thứ ba.

| Hằng số                                   | Mặc định                                              | Nguồn                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Thời gian chờ yêu cầu (mỗi RPC)           | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Thời gian chờ xác thực trước / thử thách kết nối | `15_000` ms                                    | `src/gateway/handshake-timeouts.ts` (config/env có thể tăng ngân sách máy chủ/máy khách ghép cặp) |
| Backoff kết nối lại ban đầu               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Kẹp thử lại nhanh sau khi đóng device-token | `250` ms                                            | `src/gateway/client.ts`                                                                    |
| Khoảng ân hạn buộc dừng trước `terminate()` | `250` ms                                            | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Thời gian chờ mặc định của `stopAndWait()` | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)   | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do hết thời gian tick                | mã `4000` khi im lặng vượt quá `tickIntervalMs * 2`   | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Máy chủ quảng bá `policy.tickIntervalMs`, `policy.maxPayload` và `policy.maxBufferedBytes` có hiệu lực trong `hello-ok`; máy khách nên tuân theo các giá trị đó thay vì các giá trị mặc định trước bắt tay.

## Xác thực

- Auth Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy theo chế độ auth đã cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc `gateway.auth.mode: "trusted-proxy"`
  không phải loopback đáp ứng kiểm tra auth khi kết nối từ header yêu cầu thay vì
  `connect.params.auth.*`.
- `gateway.auth.mode: "none"` cho ingress riêng tư bỏ qua hoàn toàn auth kết nối
  bằng bí mật dùng chung; không để lộ chế độ đó trên ingress công khai/không tin cậy.
- Sau khi ghép đôi, Gateway cấp một **token thiết bị** giới hạn theo vai trò kết nối
  + các phạm vi. Token được trả về trong `hello-ok.auth.deviceToken` và nên được
  client lưu bền vững cho các lần kết nối sau.
- Client nên lưu bền vững `hello-ok.auth.deviceToken` chính sau mọi lần kết nối
  thành công.
- Kết nối lại bằng token thiết bị **đã lưu** đó cũng nên tái sử dụng tập phạm vi đã
  được phê duyệt đã lưu cho token đó. Điều này giữ nguyên quyền truy cập đọc/thăm dò/trạng thái
  đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại xuống một phạm vi ngầm định
  chỉ dành cho admin.
- Lắp ráp auth kết nối phía client (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` là trực giao và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: token dùng chung tường minh trước,
    sau đó là `deviceToken` tường minh, rồi token theo thiết bị đã lưu (được khóa bằng
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không có mục nào ở trên phân giải được
    `auth.token`. Token dùng chung hoặc bất kỳ token thiết bị nào đã phân giải sẽ chặn nó.
  - Việc tự động nâng cấp token thiết bị đã lưu trong lần thử lại một lần duy nhất
    `AUTH_TOKEN_MISMATCH` chỉ được cho phép với **endpoint tin cậy** —
    loopback, hoặc `wss://` với `tlsFingerprint` đã ghim. `wss://` công khai
    không ghim không đủ điều kiện.
- Các mục `hello-ok.auth.deviceTokens` bổ sung là token chuyển giao bootstrap.
  Chỉ lưu chúng khi kết nối đã dùng auth bootstrap trên transport tin cậy
  như `wss://` hoặc ghép đôi loopback/local.
- Nếu client cung cấp `deviceToken` **tường minh** hoặc `scopes` tường minh, tập phạm vi
  do caller yêu cầu đó vẫn có thẩm quyền; phạm vi trong bộ nhớ đệm chỉ được
  tái sử dụng khi client đang tái sử dụng token theo thiết bị đã lưu.
- Token thiết bị có thể được xoay vòng/thu hồi qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`).
- `device.token.rotate` trả về siêu dữ liệu xoay vòng. Nó chỉ echo token bearer
  thay thế cho các lệnh gọi cùng thiết bị đã được xác thực bằng token thiết bị đó,
  để các client chỉ dùng token có thể lưu bền vững token thay thế trước khi
  kết nối lại. Các thao tác xoay vòng bằng token dùng chung/admin không echo token bearer.
- Việc cấp, xoay vòng và thu hồi token luôn bị giới hạn trong tập vai trò đã phê duyệt
  được ghi trong mục ghép đôi của thiết bị đó; việc thay đổi token không thể mở rộng hoặc
  nhắm tới một vai trò thiết bị mà phê duyệt ghép đôi chưa từng cấp.
- Với phiên token thiết bị đã ghép đôi, việc quản lý thiết bị được giới hạn trong chính thiết bị đó
  trừ khi caller cũng có `operator.admin`: caller không phải admin chỉ có thể xóa/thu hồi/xoay vòng
  mục thiết bị **của chính họ**.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi token người vận hành
  đích so với phạm vi phiên hiện tại của caller. Caller không phải admin không thể
  xoay vòng hoặc thu hồi token người vận hành rộng hơn token họ đang có.
- Lỗi auth bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi client cho `AUTH_TOKEN_MISMATCH`:
  - Client tin cậy có thể thử lại một lần có giới hạn bằng token theo thiết bị trong bộ nhớ đệm.
  - Nếu lần thử lại đó thất bại, client nên dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho người vận hành.

## Danh tính thiết bị + ghép đôi

- Node nên bao gồm một danh tính thiết bị ổn định (`device.id`) được dẫn xuất từ
  fingerprint của cặp khóa.
- Gateway cấp token theo từng thiết bị + vai trò.
- Phê duyệt ghép đôi là bắt buộc cho ID thiết bị mới trừ khi tính năng tự động phê duyệt cục bộ
  được bật.
- Tự động phê duyệt ghép đôi tập trung vào các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường tự kết nối backend/container-local hẹp cho
  các luồng trợ giúp dùng bí mật dùng chung tin cậy.
- Các kết nối tailnet hoặc LAN cùng host vẫn được xem là từ xa đối với ghép đôi và
  yêu cầu phê duyệt.
- Client WS thường bao gồm danh tính `device` trong khi `connect` (người vận hành +
  node). Các ngoại lệ người vận hành không có thiết bị duy nhất là các đường tin cậy tường minh:
  - `gateway.controlUi.allowInsecureAuth=true` để tương thích HTTP không an toàn chỉ dành cho localhost.
  - auth Control UI người vận hành `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (phá kính khẩn cấp, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` qua direct-loopback được xác thực bằng token/mật khẩu
    Gateway dùng chung.
- Mọi kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di trú auth thiết bị

Với các client cũ vẫn dùng hành vi ký trước challenge, `connect` hiện trả về
mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` cùng `error.details.reason` ổn định.

Các lỗi di trú thường gặp:

| Thông báo                   | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi trống).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client đã ký bằng nonce cũ/sai.                   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp với payload v2.          |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.    |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp fingerprint khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.       |

Mục tiêu di trú:

- Luôn đợi `connect.challenge`.
- Ký payload v2 có chứa nonce của máy chủ.
- Gửi cùng nonce đó trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  ngoài các trường thiết bị/client/vai trò/phạm vi/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng việc ghim siêu dữ liệu
  thiết bị đã ghép đôi vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Client có thể tùy chọn ghim fingerprint chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này phơi bày **API Gateway đầy đủ** (trạng thái, kênh, mô hình, chat,
agent, phiên, node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi
các schema TypeBox trong `src/gateway/protocol/schema.ts`.

## Liên quan

- [Giao thức cầu nối](/vi/gateway/bridge-protocol)
- [Sổ tay vận hành Gateway](/vi/gateway)
