---
read_when:
    - Triển khai hoặc cập nhật các máy khách WS của Gateway
    - Gỡ lỗi các điểm không khớp về giao thức hoặc lỗi kết nối
    - Tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung, lập phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-04-29T22:45:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51647177913f9ba0bbbe4fffbe4e06ff120d5307d075f49cb99d363ac6ad0f11
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức Gateway WS là **mặt phẳng điều khiển duy nhất + truyền tải Node** cho
OpenClaw. Tất cả client (CLI, giao diện web, ứng dụng macOS, node iOS/Android, node
headless) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi** của mình tại
thời điểm bắt tay.

## Truyền tải

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **bắt buộc** phải là yêu cầu `connect`.
- Các khung trước khi kết nối bị giới hạn ở 64 KiB. Sau khi bắt tay thành công, client
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các khung inbound quá lớn và bộ đệm outbound chậm sẽ phát sự kiện `payload.large`
  trước khi gateway đóng hoặc bỏ khung bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ nội dung thông điệp,
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

Khi Gateway vẫn đang hoàn tất các sidecar khởi động, yêu cầu `connect` có thể
trả về lỗi `UNAVAILABLE` có thể thử lại, với `details.reason` được đặt thành
`"startup-sidecars"` và `retryAfterMs`. Client nên thử lại phản hồi đó
trong tổng ngân sách kết nối của mình thay vì hiển thị nó như một lỗi bắt tay
kết thúc.

`server`, `features`, `snapshot` và `policy` đều được schema yêu cầu
(`src/gateway/protocol/schema/frames.ts`). `auth` cũng bắt buộc và báo cáo
vai trò/phạm vi đã thương lượng. `canvasHostUrl` là tùy chọn.

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

Các client backend cùng tiến trình đáng tin cậy (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên các kết nối loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu Gateway dùng chung. Đường dẫn này được dành riêng
cho các RPC mặt phẳng điều khiển nội bộ và tránh để các baseline ghép cặp CLI/thiết bị
đã cũ chặn công việc backend cục bộ như cập nhật phiên subagent. Client từ xa,
client có nguồn gốc trình duyệt, client node và các client dùng token thiết bị/danh tính thiết bị
rõ ràng vẫn sử dụng các bước kiểm tra ghép cặp và nâng cấp phạm vi thông thường.

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

Đối với luồng bootstrap node/operator tích hợp sẵn, token node chính vẫn giữ
`scopes: []` và mọi token operator được bàn giao vẫn bị giới hạn trong allowlist operator
bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Các bước kiểm tra phạm vi bootstrap vẫn
được tiền tố theo vai trò: các mục operator chỉ thỏa mãn yêu cầu operator, và các vai trò
không phải operator vẫn cần phạm vi dưới tiền tố vai trò của chính chúng.

### Ví dụ Node

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

### Vai trò

- `operator` = client mặt phẳng điều khiển (CLI/UI/tự động hóa).
- `node` = host năng lực (camera/screen/canvas/system.run).

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

Phạm vi phương thức chỉ là cổng đầu tiên. Một số lệnh slash được truy cập qua
`chat.send` áp dụng thêm các kiểm tra nghiêm ngặt hơn ở cấp lệnh. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có một bước kiểm tra phạm vi tại thời điểm phê duyệt bổ sung
bên trên phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có các lệnh node không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Năng lực/lệnh/quyền (node)

Node khai báo các claim năng lực tại thời điểm kết nối:

- `caps`: các danh mục năng lực cấp cao.
- `commands`: allowlist lệnh cho invoke.
- `permissions`: các công tắc chi tiết (ví dụ `screen.record`, `camera.capture`).

Gateway coi các mục này là **claim** và thực thi allowlist phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị đó kết nối với cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Node đang kết nối báo cáo
  thời gian kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; node đã ghép cặp cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện node đáng tin cậy cập nhật metadata ghép cặp của chúng.

### Sự kiện Node còn hoạt động trong nền

Node có thể gọi `node.event` với `event: "node.presence.alive"` để ghi nhận rằng một node đã ghép cặp
đã hoạt động trong một lần đánh thức nền mà không đánh dấu nó là đã kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Các chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững đối với các phiên thiết bị node đã xác thực;
các phiên không có thiết bị hoặc chưa ghép cặp trả về `handled: false`.

Gateway thành công trả về một kết quả có cấu trúc:

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

## Phạm vi hóa sự kiện broadcast

Các sự kiện broadcast WebSocket do máy chủ đẩy được kiểm soát theo phạm vi để các phiên chỉ có phạm vi ghép cặp hoặc chỉ dành cho node không thụ động nhận nội dung phiên.

- **Các khung chat, agent và kết quả công cụ** (bao gồm các sự kiện `agent` được stream và kết quả gọi công cụ) yêu cầu tối thiểu `operator.read`. Các phiên không có `operator.read` bỏ qua hoàn toàn những khung này.
- **Các broadcast `plugin.*` do Plugin định nghĩa** được kiểm soát bằng `operator.write` hoặc `operator.admin`, tùy theo cách Plugin đăng ký chúng.
- **Sự kiện trạng thái và truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để mọi phiên đã xác thực đều có thể quan sát tình trạng truyền tải.
- **Các họ sự kiện broadcast không xác định** mặc định được kiểm soát theo phạm vi (fail-closed) trừ khi một handler đã đăng ký nới lỏng chúng một cách rõ ràng.

Mỗi kết nối client giữ số thứ tự riêng theo từng client để các broadcast duy trì thứ tự đơn điệu trên socket đó ngay cả khi các client khác nhau thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export phương thức
Plugin/kênh đã tải. Hãy coi nó là khám phá tính năng, không phải bản liệt kê đầy đủ
của `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về snapshot tình trạng Gateway được lưu cache hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi chẩn đoán ổn định có giới hạn gần đây. Nó giữ metadata vận hành như tên sự kiện, số đếm, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và id phiên. Nó không giữ văn bản chat, thân webhook, đầu ra công cụ, thân yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Yêu cầu phạm vi operator đọc.
    - `status` trả về tóm tắt Gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho client operator có phạm vi admin.
    - `gateway.identity.get` trả về danh tính thiết bị Gateway được dùng bởi các luồng relay và ghép cặp.
    - `system-presence` trả về snapshot hiện diện hiện tại cho các thiết bị operator/node đang kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/broadcast ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện Heartbeat bền vững mới nhất.
    - `set-heartbeats` bật/tắt xử lý Heartbeat trên Gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được phép trong runtime. Truyền `{ "view": "configured" }` cho các mô hình đã cấu hình có kích thước phù hợp với bộ chọn (`agents.defaults.models` trước, sau đó `models.providers.*.models`), hoặc `{ "view": "all" }` cho danh mục đầy đủ.
    - `usage.status` trả về các cửa sổ sử dụng của nhà cung cấp/tóm tắt hạn mức còn lại.
    - `usage.cost` trả về tóm tắt mức sử dụng chi phí đã tổng hợp cho một khoảng ngày.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của bộ nhớ vector / embedding được lưu trong bộ nhớ đệm cho workspace agent mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi yêu cầu rõ ràng một lần ping trực tiếp tới nhà cung cấp embedding.
    - `doctor.memory.remHarness` trả về bản xem trước REM harness có giới hạn, chỉ đọc cho các client control-plane từ xa. Nó có thể bao gồm đường dẫn workspace, đoạn trích bộ nhớ, markdown có căn cứ đã render, và ứng viên thăng hạng sâu, nên bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt mức sử dụng theo từng phiên.
    - `sessions.usage.timeseries` trả về mức sử dụng dạng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình trợ giúp đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/Plugin tích hợp sẵn + đi kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có hỗ trợ QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một APNs push thử nghiệm tới một node iOS đã đăng ký.
    - `voicewake.get` trả về các trigger wake-word đã lưu.
    - `voicewake.set` cập nhật các trigger wake-word và phát thông báo thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi đi trực tiếp cho các lượt gửi nhắm tới kênh/tài khoản/luồng bên ngoài chat runner.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với các điều khiển con trỏ/giới hạn và số byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.config` trả về payload cấu hình Talk hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.mode` đặt/phát trạng thái chế độ Talk hiện tại cho các client WebChat/Control UI.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp dự phòng, và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về danh mục nhà cung cấp TTS hiển thị được.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và wizard">
    - `secrets.reload` phân giải lại các SecretRef đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật nhắm tới lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về snapshot cấu hình hiện tại và hash.
    - `config.set` ghi một payload cấu hình đã được xác thực.
    - `config.patch` hợp nhất một cập nhật cấu hình một phần.
    - `config.apply` xác thực + thay thế payload cấu hình đầy đủ.
    - `config.schema` trả về payload schema cấu hình trực tiếp được Control UI và công cụ CLI sử dụng: schema, `uiHints`, phiên bản, và metadata tạo sinh, bao gồm metadata schema Plugin + kênh khi runtime có thể tải được. Schema bao gồm metadata trường `title` / `description` được dẫn xuất từ cùng nhãn và văn bản trợ giúp mà UI sử dụng, bao gồm các nhánh đối tượng lồng nhau, wildcard, mục mảng, và tổ hợp `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về payload tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một node schema nông, hint khớp + `hintPath`, và tóm tắt con trực tiếp cho thao tác đi sâu của UI/CLI. Các node schema tra cứu giữ tài liệu hướng người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, cùng `hint` / `hintPath` khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi chính bản cập nhật đã thành công.
    - `update.status` trả về sentinel khởi động lại cập nhật mới nhất đã lưu trong bộ nhớ đệm, bao gồm phiên bản đang chạy sau khi khởi động lại khi có sẵn.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` cung cấp onboarding wizard qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp agent và workspace">
    - `agents.list` trả về các mục agent đã cấu hình, bao gồm mô hình hiệu lực và metadata runtime.
    - `agents.create`, `agents.update`, và `agents.delete` quản lý bản ghi agent và liên kết workspace.
    - `agents.files.list`, `agents.files.get`, và `agents.files.set` quản lý các tệp workspace bootstrap được hiển thị cho một agent.
    - `agent.identity.get` trả về danh tính assistant hiệu lực cho một agent hoặc phiên.
    - `agent.wait` chờ một lượt chạy hoàn tất và trả về snapshot cuối khi có sẵn.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm metadata `agentRuntime` theo từng hàng khi một backend runtime agent được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho client WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện bản ghi tin nhắn/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước bản ghi tin nhắn có giới hạn cho các khóa phiên cụ thể.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một đích phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào một phiên hiện có.
    - `sessions.steer` là biến thể ngắt-và-điều-hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên.
    - `sessions.patch` cập nhật metadata/ghi đè phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` hiệu lực.
    - `sessions.reset`, `sessions.delete`, và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về hàng phiên đã lưu đầy đủ.
    - Thực thi chat vẫn dùng `chat.history`, `chat.send`, `chat.abort`, và `chat.inject`. `chat.history` được chuẩn hóa để hiển thị cho các client UI: các thẻ chỉ thị inline bị loại khỏi văn bản hiển thị, payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn) và các token điều khiển mô hình ASCII/full-width bị rò rỉ đều bị loại bỏ, các hàng assistant chỉ gồm token im lặng như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.

  </Accordion>

  <Accordion title="Ghép cặp thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép cặp đang chờ và đã được phê duyệt.
    - `device.pair.approve`, `device.pair.reject`, và `device.pair.remove` quản lý bản ghi ghép cặp thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép cặp trong giới hạn vai trò đã phê duyệt và phạm vi bên gọi.
    - `device.token.revoke` thu hồi token thiết bị đã ghép cặp trong giới hạn vai trò đã phê duyệt và phạm vi bên gọi.

  </Accordion>

  <Accordion title="Ghép cặp Node, invoke và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, và `node.pair.verify` bao quát xác minh ghép cặp node và bootstrap.
    - `node.list` và `node.describe` trả về trạng thái node đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn node đã ghép cặp.
    - `node.invoke` chuyển tiếp một lệnh tới một node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu invoke.
    - `node.event` mang các sự kiện bắt nguồn từ node trở lại Gateway.
    - `node.canvas.capability.refresh` làm mới các token capability canvas theo phạm vi.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các node offline/bị ngắt kết nối.

  </Accordion>

  <Accordion title="Nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, và `exec.approval.resolve` bao quát các yêu cầu phê duyệt exec một lần cùng tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý snapshot chính sách phê duyệt exec của Gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ trên node thông qua các lệnh relay node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, và `plugin.approval.resolve` bao quát các luồng phê duyệt do Plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản wake ngay lập tức hoặc ở heartbeat kế tiếp; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: các cập nhật chat UI như `chat.inject` và các sự kiện chat chỉ liên quan đến bản ghi tin nhắn khác.
- `session.message` và `session.tool`: các cập nhật bản ghi tin nhắn/luồng sự kiện cho một phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc metadata đã thay đổi.
- `presence`: cập nhật snapshot hiện diện hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: cập nhật snapshot sức khỏe Gateway.
- `heartbeat`: cập nhật luồng sự kiện heartbeat.
- `cron`: sự kiện thay đổi lượt chạy/tác vụ cron.
- `shutdown`: thông báo tắt Gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép cặp node.
- `node.invoke.request`: phát thông báo yêu cầu invoke node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép cặp.
- `voicewake.changed`: cấu hình trigger wake-word đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt Plugin.

### Phương thức trợ giúp Node

- Node có thể gọi `skills.bins` để lấy danh sách hiện tại của các executable skill cho kiểm tra tự động cho phép.

### Phương thức trợ giúp operator

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh runtime
  cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - `scope` kiểm soát surface mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có `/` đứng đầu
    - `native` và đường dẫn mặc định `both` trả về tên native nhận biết provider
      khi có
  - `textAliases` mang các bí danh slash chính xác như `/model` và `/m`.
  - `nativeName` mang tên lệnh native nhận biết provider khi có.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cộng với tính khả dụng của lệnh Plugin
    native.
  - `includeArgs=false` bỏ qua metadata đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy catalog công cụ runtime cho một
  agent. Phản hồi bao gồm các công cụ đã nhóm và metadata nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu Plugin khi `source="plugin"`
  - `optional`: công cụ Plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực trong runtime
  cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh runtime đáng tin cậy từ phiên ở phía server thay vì chấp nhận
    auth hoặc ngữ cảnh giao nhận do caller cung cấp.
  - Phản hồi được giới hạn theo phiên và phản ánh những gì cuộc trò chuyện đang hoạt động có thể dùng ngay bây giờ,
    bao gồm công cụ core, Plugin và kênh.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy danh mục
  skill hiển thị cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - Phản hồi bao gồm điều kiện đủ, yêu cầu còn thiếu, kiểm tra config và
    tùy chọn cài đặt đã được làm sạch mà không để lộ giá trị secret thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) để lấy
  metadata khám phá ClawHub.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một
    thư mục skill vào thư mục `skills/` của workspace agent mặc định.
  - Chế độ trình cài đặt Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    chạy một hành động `metadata.openclaw.install` đã khai báo trên host Gateway.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug đang được theo dõi hoặc tất cả bản cài đặt ClawHub đang được theo dõi trong
    workspace agent mặc định.
  - Chế độ config vá các giá trị `skills.entries.<skillKey>` như `enabled`,
    `apiKey` và `env`.

### Các chế độ xem của `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi runtime hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là catalog được phép; nếu không phản hồi là catalog Gateway đầy đủ.
- `"configured"`: hành vi có kích thước phù hợp cho picker. Nếu `agents.defaults.models` được cấu hình, nó vẫn được ưu tiên. Nếu không phản hồi dùng các mục `models.providers.*.models` tường minh, chỉ fallback về catalog đầy đủ khi không tồn tại hàng model đã cấu hình nào.
- `"all"`: catalog Gateway đầy đủ, bỏ qua `agents.defaults.models`. Dùng chế độ này cho chẩn đoán và UI khám phá, không dùng cho picker model thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, Gateway phát `exec.approval.requested`.
- Client của người vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu scope `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata phiên chuẩn tắc). Các yêu cầu thiếu `systemRunPlan` sẽ bị từ chối.
- Sau khi phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ dùng lại
  `systemRunPlan` chuẩn tắc đó làm ngữ cảnh command/cwd/phiên có thẩm quyền.
- Nếu caller thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc
  `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` cuối cùng đã được phê duyệt, Gateway
  từ chối lần chạy thay vì tin payload đã bị thay đổi.

## Fallback giao nhận agent

- Yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu giao nhận outbound.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: mục tiêu giao nhận không thể phân giải hoặc chỉ nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép fallback sang thực thi chỉ theo phiên khi không thể phân giải route có thể giao nhận bên ngoài (ví dụ phiên nội bộ/webchat hoặc config đa kênh mơ hồ).

## Quản lý phiên bản

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/schema/protocol-schemas.ts`.
- Client gửi `minProtocol` + `maxProtocol`; server từ chối các trường hợp không khớp.
- Schema + model được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số client

Client tham chiếu trong `src/gateway/client.ts` dùng các giá trị mặc định này. Các giá trị
ổn định trên protocol v3 và là baseline kỳ vọng cho client bên thứ ba.

| Hằng số                                  | Mặc định                                               | Nguồn                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Timeout yêu cầu (mỗi RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env có thể tăng ngân sách server/client được ghép cặp) |
| Backoff kết nối lại ban đầu               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Kẹp retry nhanh sau khi đóng device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Khoảng chờ force-stop trước `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout mặc định của `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)   | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do tick-timeout                      | mã `4000` khi thời gian im lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Server quảng bá `policy.tickIntervalMs`, `policy.maxPayload` và
`policy.maxBufferedBytes` có hiệu lực trong `hello-ok`; client nên tuân theo các giá trị đó
thay vì các giá trị mặc định trước handshake.

## Auth

- Auth Gateway bằng shared-secret dùng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy theo chế độ auth đã cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc `gateway.auth.mode: "trusted-proxy"`
  không phải local loopback đáp ứng kiểm tra connect auth từ
  header yêu cầu thay vì `connect.params.auth.*`.
- `gateway.auth.mode: "none"` cho private-ingress bỏ qua hoàn toàn shared-secret connect auth;
  không để lộ chế độ đó trên ingress công khai/không đáng tin cậy.
- Sau khi pairing, Gateway cấp một **device token** được giới hạn theo vai trò
  kết nối + scope. Token được trả về trong `hello-ok.auth.deviceToken` và nên được
  client lưu bền vững cho các lần kết nối sau.
- Client nên lưu bền vững `hello-ok.auth.deviceToken` chính sau bất kỳ
  lần kết nối thành công nào.
- Kết nối lại bằng device token **đã lưu** đó cũng nên dùng lại bộ scope đã được phê duyệt đã lưu
  cho token đó. Việc này giữ nguyên quyền truy cập đọc/probe/trạng thái
  đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại xuống
  scope chỉ admin ngầm định.
- Lắp ráp connect auth phía client (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: token dùng chung tường minh trước,
    sau đó là `deviceToken` tường minh, rồi token theo thiết bị đã lưu (được khóa theo
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được
    `auth.token`. Token dùng chung hoặc bất kỳ device token đã phân giải nào sẽ chặn nó.
  - Tự động nâng cấp một device token đã lưu trên lần retry một lần
    `AUTH_TOKEN_MISMATCH` chỉ được cho phép với **endpoint đáng tin cậy** —
    loopback, hoặc `wss://` có `tlsFingerprint` được pin. `wss://` công khai
    không pin không đủ điều kiện.
- Các mục `hello-ok.auth.deviceTokens` bổ sung là token bàn giao bootstrap.
  Chỉ lưu bền vững chúng khi lần connect dùng bootstrap auth trên transport đáng tin cậy
  như `wss://` hoặc pairing loopback/local.
- Nếu client cung cấp `deviceToken` **tường minh** hoặc `scopes` tường minh, bộ scope
  do caller yêu cầu đó vẫn có thẩm quyền; scope đã cache chỉ
  được dùng lại khi client đang dùng lại token theo thiết bị đã lưu.
- Device token có thể được xoay vòng/thu hồi qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu scope `operator.pairing`).
- `device.token.rotate` trả về metadata xoay vòng. Nó chỉ phản hồi lại replacement
  bearer token cho các lệnh gọi cùng thiết bị đã được xác thực bằng
  device token đó, để client chỉ dùng token có thể lưu bền vững replacement trước khi
  kết nối lại. Các lần xoay vòng dùng shared/admin không phản hồi bearer token.
- Việc cấp, xoay vòng và thu hồi token vẫn được giới hạn trong bộ vai trò đã được phê duyệt
  được ghi trong mục pairing của thiết bị đó; thao tác thay đổi token không thể mở rộng hoặc
  nhắm tới vai trò thiết bị mà phê duyệt pairing chưa từng cấp.
- Với phiên token của thiết bị đã pairing, quản lý thiết bị được giới hạn trong phạm vi tự thân trừ khi
  caller cũng có `operator.admin`: caller không phải admin chỉ có thể xóa/thu hồi/xoay vòng
  mục thiết bị **của chính họ**.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra bộ scope token operator mục tiêu
  so với scope phiên hiện tại của caller. Caller không phải admin
  không thể xoay vòng hoặc thu hồi token operator rộng hơn token họ đang có.
- Lỗi auth bao gồm `error.details.code` cộng với gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi client cho `AUTH_TOKEN_MISMATCH`:
  - Client đáng tin cậy có thể thử một lần retry có giới hạn bằng token theo thiết bị đã cache.
  - Nếu retry đó thất bại, client nên dừng các vòng lặp kết nối lại tự động và hiển thị hướng dẫn hành động cho người vận hành.

## Danh tính thiết bị + pairing

- Các Node nên bao gồm danh tính thiết bị ổn định (`device.id`) được suy ra từ
  dấu vân tay của cặp khóa.
- Các Gateway phát hành token theo từng thiết bị + vai trò.
- Cần có phê duyệt ghép cặp cho các ID thiết bị mới, trừ khi tính năng tự động phê duyệt
  cục bộ được bật.
- Tự động phê duyệt ghép cặp tập trung vào các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường dẫn tự kết nối hẹp, cục bộ trong backend/container cho
  các luồng trợ giúp dùng bí mật chung đáng tin cậy.
- Các kết nối tailnet cùng máy chủ hoặc LAN vẫn được xem là từ xa đối với ghép cặp và
  cần được phê duyệt.
- Các client WS thường bao gồm danh tính `device` trong lúc `connect` (operator +
  node). Các ngoại lệ operator không có thiết bị duy nhất là các đường dẫn tin cậy rõ ràng:
  - `gateway.controlUi.allowInsecureAuth=true` để tương thích HTTP không an toàn chỉ dành cho localhost.
  - xác thực Control UI của operator với `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (tình huống khẩn cấp, hạ cấp bảo mật nghiêm trọng).
  - các RPC backend `gateway-client` qua direct-loopback được xác thực bằng token/mật khẩu
    Gateway dùng chung.
- Tất cả kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di chuyển xác thực thiết bị

Đối với các client cũ vẫn dùng hành vi ký trước challenge, `connect` hiện trả về
các mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` với `error.details.reason` ổn định.

Các lỗi di chuyển thường gặp:

| Thông báo                   | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi giá trị trống). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client đã ký bằng nonce cũ/sai.                   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp payload v2.             |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp dấu vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.      |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký payload v2 có bao gồm nonce của máy chủ.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Payload chữ ký được ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  ngoài các trường device/client/role/scopes/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng việc ghim siêu dữ liệu
  thiết bị đã ghép cặp vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho các kết nối WS.
- Client có thể tùy chọn ghim dấu vân tay chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cộng với `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này phơi bày **toàn bộ API Gateway** (trạng thái, kênh, mô hình, chat,
agent, phiên, node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi
các schema TypeBox trong `src/gateway/protocol/schema.ts`.

## Liên quan

- [Giao thức Bridge](/vi/gateway/bridge-protocol)
- [Runbook Gateway](/vi/gateway)
