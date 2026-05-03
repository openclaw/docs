---
read_when:
    - Triển khai hoặc cập nhật các máy khách WS của Gateway
    - Gỡ lỗi các điểm không khớp về giao thức hoặc lỗi kết nối
    - Tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket Gateway: bắt tay, khung, lập phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-05-03T10:37:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức WS Gateway là **mặt phẳng điều khiển duy nhất + kênh truyền tải node** cho
OpenClaw. Tất cả client (CLI, giao diện web, ứng dụng macOS, node iOS/Android, node
headless) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi** của chúng tại
thời điểm bắt tay.

## Truyền tải

- WebSocket, khung văn bản với payload JSON.
- Khung đầu tiên **bắt buộc** là yêu cầu `connect`.
- Các khung trước khi kết nối được giới hạn ở 64 KiB. Sau khi bắt tay thành công, client
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các khung đến quá lớn và bộ đệm đi chậm phát ra sự kiện `payload.large`
  trước khi gateway đóng hoặc loại bỏ khung bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ lại nội dung
  thông điệp, nội dung tệp đính kèm, thân khung thô, token, cookie hoặc giá trị bí mật.

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
trong tổng ngân sách kết nối của mình thay vì hiển thị nó như một lỗi
bắt tay kết thúc.

`server`, `features`, `snapshot` và `policy` đều được schema yêu cầu
(`src/gateway/protocol/schema/frames.ts`). `auth` cũng là bắt buộc và báo cáo
vai trò/phạm vi đã thương lượng. `canvasHostUrl` là tùy chọn.

Khi không cấp token thiết bị, `hello-ok.auth` báo cáo các quyền đã thương lượng
không có trường token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Các client backend cùng tiến trình đáng tin cậy (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên kết nối local loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu gateway dùng chung. Đường dẫn này được dành riêng
cho RPC mặt phẳng điều khiển nội bộ và giữ cho các baseline ghép cặp CLI/thiết bị cũ
không chặn công việc backend cục bộ như cập nhật phiên subagent. Client từ xa,
client có nguồn gốc trình duyệt, client node và client token thiết bị/danh tính thiết bị
tường minh vẫn dùng các kiểm tra ghép cặp và nâng cấp phạm vi thông thường.

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

Trong quá trình chuyển giao bootstrap đáng tin cậy, `hello-ok.auth` cũng có thể bao gồm
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
`scopes: []` và mọi token operator được chuyển giao vẫn bị giới hạn trong allowlist operator
bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kiểm tra phạm vi bootstrap vẫn
được tiền tố theo vai trò: các mục operator chỉ đáp ứng yêu cầu operator, và vai trò
không phải operator vẫn cần phạm vi dưới tiền tố vai trò của chính chúng.

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

Các phương thức có tác dụng phụ yêu cầu **khóa idempotency** (xem schema).

## Vai trò + phạm vi

Để xem mô hình phạm vi operator đầy đủ, các kiểm tra tại thời điểm phê duyệt và
ngữ nghĩa shared-secret, hãy xem [Phạm vi operator](/vi/gateway/operator-scopes).

### Vai trò

- `operator` = client mặt phẳng điều khiển (CLI/UI/tự động hóa).
- `node` = máy chủ khả năng (camera/screen/canvas/system.run).

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

Các phương thức RPC gateway do Plugin đăng ký có thể yêu cầu phạm vi operator riêng của chúng, nhưng
các tiền tố quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi phương thức chỉ là cổng kiểm tra đầu tiên. Một số lệnh slash được truy cập qua
`chat.send` áp dụng thêm các kiểm tra cấp lệnh nghiêm ngặt hơn. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có một kiểm tra phạm vi bổ sung tại thời điểm phê duyệt bên cạnh
phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu với lệnh node không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node khai báo các claim khả năng tại thời điểm kết nối:

- `caps`: các danh mục khả năng cấp cao.
- `commands`: allowlist lệnh để gọi.
- `permissions`: các công tắc chi tiết (ví dụ `screen.record`, `camera.capture`).

Gateway xem những mục này là **claim** và thực thi allowlist phía server.

## Hiện diện

- `system-presence` trả về các mục được khóa theo danh tính thiết bị.
- Các mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi thiết bị đó kết nối với cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Các node đã kết nối báo cáo
  thời điểm kết nối hiện tại của chúng dưới dạng `lastSeenAtMs` với lý do `connect`; các node đã ghép cặp cũng có thể báo cáo
  hiện diện nền bền vững khi một sự kiện node đáng tin cậy cập nhật metadata ghép cặp của chúng.

### Sự kiện node sống ở nền

Node có thể gọi `node.event` với `event: "node.presence.alive"` để ghi lại rằng một node đã ghép cặp
đã sống trong một lần đánh thức nền mà không đánh dấu nó là đã kết nối.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` là một enum đóng: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` hoặc `connect`. Các chuỗi trigger không xác định được gateway chuẩn hóa thành
`background` trước khi lưu bền vững. Sự kiện chỉ bền vững cho các phiên thiết bị node đã xác thực;
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

Gateway cũ hơn vẫn có thể trả về `{ "ok": true }` cho `node.event`; client nên xem đó là một
RPC đã được xác nhận, không phải là lưu bền vững hiện diện.

## Phân phạm vi sự kiện broadcast

Các sự kiện broadcast WebSocket do server đẩy được kiểm soát theo phạm vi để các phiên theo phạm vi ghép cặp hoặc chỉ dành cho node không thụ động nhận nội dung phiên.

- **Khung chat, agent và kết quả công cụ** (bao gồm các sự kiện `agent` được stream và kết quả gọi công cụ) yêu cầu ít nhất `operator.read`. Các phiên không có `operator.read` bỏ qua hoàn toàn các khung này.
- **Broadcast `plugin.*` do Plugin định nghĩa** được kiểm soát bằng `operator.write` hoặc `operator.admin`, tùy cách Plugin đã đăng ký chúng.
- **Sự kiện trạng thái và truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để tình trạng truyền tải luôn quan sát được với mọi phiên đã xác thực.
- **Các họ sự kiện broadcast không xác định** được kiểm soát theo phạm vi theo mặc định (fail-closed) trừ khi một handler đã đăng ký nới lỏng chúng một cách tường minh.

Mỗi kết nối client giữ số thứ tự theo từng client của riêng nó để broadcast duy trì thứ tự đơn điệu trên socket đó ngay cả khi các client khác nhau thấy các tập con được lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ bắt tay/xác thực ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là một danh sách
khám phá thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export phương thức
Plugin/kênh đã tải. Hãy xem nó là khám phá tính năng, không phải bản liệt kê đầy đủ
của `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về snapshot tình trạng gateway được cache hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi ổn định chẩn đoán có giới hạn gần đây. Nó giữ metadata vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và id phiên. Nó không giữ văn bản chat, thân webhook, đầu ra công cụ, thân yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Cần phạm vi operator read.
    - `status` trả về tóm tắt gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho client operator có phạm vi admin.
    - `gateway.identity.get` trả về danh tính thiết bị gateway được dùng bởi các luồng relay và ghép cặp.
    - `system-presence` trả về snapshot hiện diện hiện tại cho các thiết bị operator/node đã kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/broadcast ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện heartbeat đã lưu bền vững mới nhất.
    - `set-heartbeats` bật/tắt xử lý heartbeat trên gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được phép dùng lúc chạy. Truyền `{ "view": "configured" }` để lấy các mô hình đã cấu hình có kích thước phù hợp cho bộ chọn (`agents.defaults.models` trước, rồi đến `models.providers.*.models`), hoặc `{ "view": "all" }` để lấy toàn bộ danh mục.
    - `usage.status` trả về các khoảng thời gian sử dụng của nhà cung cấp/tóm tắt hạn mức còn lại.
    - `usage.cost` trả về tóm tắt mức sử dụng chi phí đã tổng hợp cho một khoảng ngày.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của bộ nhớ vector / embedding đã lưu đệm cho workspace agent mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi rõ ràng muốn ping trực tiếp nhà cung cấp embedding.
    - `doctor.memory.remHarness` trả về bản xem trước REM harness có giới hạn, chỉ đọc cho các client control-plane từ xa. Nó có thể bao gồm đường dẫn workspace, đoạn trích bộ nhớ, markdown grounded đã render và ứng viên thăng hạng sâu, nên bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt mức sử dụng theo từng phiên.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình trợ giúp đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/Plugin tích hợp sẵn + đi kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có khả năng QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một APNs push thử nghiệm đến một Node iOS đã đăng ký.
    - `voicewake.get` trả về các trình kích hoạt wake-word đã lưu.
    - `voicewake.set` cập nhật các trình kích hoạt wake-word và phát thông báo thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC phân phối gửi đi trực tiếp cho các lần gửi nhắm đến kênh/tài khoản/luồng bên ngoài trình chạy chat.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với các điều khiển con trỏ/giới hạn và số byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.config` trả về payload cấu hình Talk có hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.mode` đặt/phát trạng thái chế độ Talk hiện tại cho các client WebChat/Control UI.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp dự phòng và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về danh sách nhà cung cấp TTS hiển thị được.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRef đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật nhắm đến lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về snapshot và hash cấu hình hiện tại.
    - `config.set` ghi một payload cấu hình đã được xác thực.
    - `config.patch` hợp nhất một bản cập nhật cấu hình một phần.
    - `config.apply` xác thực + thay thế toàn bộ payload cấu hình.
    - `config.schema` trả về payload schema cấu hình trực tiếp được Control UI và công cụ CLI dùng: schema, `uiHints`, phiên bản và siêu dữ liệu tạo, bao gồm siêu dữ liệu schema Plugin + kênh khi runtime có thể tải được. Schema bao gồm siêu dữ liệu trường `title` / `description` được suy ra từ cùng nhãn và văn bản trợ giúp mà UI dùng, bao gồm các nhánh thành phần đối tượng lồng nhau, wildcard, mục mảng và `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về payload tra cứu giới hạn theo đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một node schema nông, gợi ý khớp + `hintPath`, và tóm tắt con trực tiếp cho thao tác đi sâu của UI/CLI. Các node schema tra cứu giữ lại tài liệu hướng người dùng và các trường xác thực phổ biến (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, cùng với `hint` / `hintPath` khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi bản cập nhật đó thành công. Các bản cập nhật trình quản lý gói buộc khởi động lại cập nhật không trì hoãn, không có cooldown sau khi hoán đổi gói để tiến trình Gateway cũ không tiếp tục lazy-load từ cây `dist` đã bị thay thế.
    - `update.status` trả về sentinel khởi động lại cập nhật đã lưu đệm mới nhất, bao gồm phiên bản đang chạy sau khi khởi động lại nếu có.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` cung cấp trình hướng dẫn onboarding qua WS RPC.

  </Accordion>

  <Accordion title="Trình trợ giúp agent và workspace">
    - `agents.list` trả về các mục agent đã cấu hình, bao gồm mô hình có hiệu lực và siêu dữ liệu runtime.
    - `agents.create`, `agents.update`, và `agents.delete` quản lý bản ghi agent và liên kết workspace.
    - `agents.files.list`, `agents.files.get`, và `agents.files.set` quản lý các tệp workspace bootstrap được cung cấp cho một agent.
    - `artifacts.list`, `artifacts.get`, và `artifacts.download` cung cấp tóm tắt artifact suy ra từ transcript và bản tải xuống cho phạm vi `sessionKey`, `runId`, hoặc `taskId` rõ ràng. Truy vấn run và task phân giải phiên sở hữu ở phía máy chủ và chỉ trả về phương tiện transcript có provenance khớp; nguồn URL không an toàn hoặc cục bộ trả về bản tải xuống không được hỗ trợ thay vì fetch phía máy chủ.
    - `agent.identity.get` trả về danh tính trợ lý có hiệu lực cho một agent hoặc phiên.
    - `agent.wait` chờ một run kết thúc và trả về snapshot cuối nếu có.

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
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` cùng `runId` tùy chọn, hoặc chỉ truyền `runId` cho các run đang hoạt động mà Gateway có thể phân giải thành một phiên.
    - `sessions.patch` cập nhật siêu dữ liệu/ghi đè phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` có hiệu lực.
    - `sessions.reset`, `sessions.delete`, và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về toàn bộ hàng phiên đã lưu.
    - Thực thi chat vẫn dùng `chat.history`, `chat.send`, `chat.abort`, và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho các client UI: các thẻ chỉ thị inline bị loại khỏi văn bản hiển thị, payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn) và token điều khiển mô hình ASCII/toàn chiều bị rò rỉ được loại bỏ, các hàng trợ lý chỉ chứa token im lặng như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.

  </Accordion>

  <Accordion title="Ghép nối thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép nối đang chờ và đã được phê duyệt.
    - `device.pair.approve`, `device.pair.reject`, và `device.pair.remove` quản lý bản ghi ghép nối thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép nối trong giới hạn vai trò được phê duyệt và phạm vi bên gọi của nó.
    - `device.token.revoke` thu hồi token thiết bị đã ghép nối trong giới hạn vai trò được phê duyệt và phạm vi bên gọi của nó.

  </Accordion>

  <Accordion title="Ghép nối Node, invoke và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, và `node.pair.verify` bao quát ghép nối Node và xác minh bootstrap.
    - `node.list` và `node.describe` trả về trạng thái Node đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn Node đã ghép nối.
    - `node.invoke` chuyển tiếp một lệnh đến Node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu invoke.
    - `node.event` mang các sự kiện bắt nguồn từ Node trở lại Gateway.
    - `node.canvas.capability.refresh` làm mới token khả năng canvas có phạm vi.
    - `node.pending.pull` và `node.pending.ack` là các API hàng đợi Node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho Node ngoại tuyến/ngắt kết nối.

  </Accordion>

  <Accordion title="Nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, và `exec.approval.resolve` bao quát các yêu cầu phê duyệt exec một lần cùng tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý snapshot chính sách phê duyệt exec của Gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ của Node thông qua lệnh relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, và `plugin.approval.resolve` bao quát các luồng phê duyệt do Plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, Skills và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản đánh thức ngay lập tức hoặc ở Heartbeat tiếp theo; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện phổ biến

- `chat`: cập nhật chat UI như `chat.inject` và các sự kiện chat chỉ liên quan đến transcript khác.
- `session.message` và `session.tool`: cập nhật transcript/luồng sự kiện cho một phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc siêu dữ liệu đã thay đổi.
- `presence`: cập nhật snapshot hiện diện hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: cập nhật snapshot sức khỏe Gateway.
- `heartbeat`: cập nhật luồng sự kiện Heartbeat.
- `cron`: sự kiện thay đổi run/job Cron.
- `shutdown`: thông báo tắt Gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép nối Node.
- `node.invoke.request`: phát yêu cầu invoke Node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép nối.
- `voicewake.changed`: cấu hình trình kích hoạt wake-word đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt Plugin.

### Phương thức trợ giúp Node

- Node có thể gọi `skills.bins` để fetch danh sách hiện tại của các tệp thực thi skill cho kiểm tra tự động cho phép.

### Phương thức trợ giúp operator

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục
  lệnh runtime cho một tác tử.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc tác tử mặc định.
  - `scope` điều khiển bề mặt mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có `/` ở đầu
    - `native` và đường dẫn `both` mặc định trả về tên native nhận biết nhà cung cấp
      khi có
  - `textAliases` mang các bí danh slash chính xác như `/model` và `/m`.
  - `nativeName` mang tên lệnh native nhận biết nhà cung cấp khi có.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cùng khả năng có sẵn của
    lệnh Plugin native.
  - `includeArgs=false` bỏ qua siêu dữ liệu đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy danh mục công cụ runtime cho một
  tác tử. Phản hồi bao gồm các công cụ đã nhóm và siêu dữ liệu nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu Plugin khi `source="plugin"`
  - `optional`: công cụ Plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực runtime
  cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh runtime đáng tin cậy từ phiên ở phía máy chủ thay vì chấp nhận
    ngữ cảnh xác thực hoặc phân phối do bên gọi cung cấp.
  - Phản hồi được giới hạn theo phiên và phản ánh những gì cuộc hội thoại đang hoạt động có thể dùng ngay lúc này,
    bao gồm công cụ core, Plugin và kênh.
- Người vận hành có thể gọi `tools.invoke` (`operator.write`) để gọi một công cụ khả dụng thông qua
  cùng đường dẫn chính sách Gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm`, và
    `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều có mặt, tác tử phiên đã phân giải phải khớp
    `agentId`.
  - Phản hồi là một envelope hướng SDK với các trường `ok`, `toolName`, `output` tùy chọn và
    `error` có kiểu. Phê duyệt hoặc từ chối theo chính sách trả về `ok:false` trong payload thay vì
    bỏ qua pipeline chính sách công cụ Gateway.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy danh mục
  skill hiển thị cho một tác tử.
  - `agentId` là tùy chọn; bỏ qua để đọc không gian làm việc tác tử mặc định.
  - Phản hồi bao gồm tính đủ điều kiện, yêu cầu còn thiếu, kiểm tra cấu hình và
    tùy chọn cài đặt đã khử nhạy cảm mà không để lộ giá trị bí mật thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) cho
  siêu dữ liệu khám phá ClawHub.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một
    thư mục skill vào thư mục `skills/` trong không gian làm việc tác tử mặc định.
  - Chế độ trình cài đặt Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    chạy một hành động `metadata.openclaw.install` đã khai báo trên máy chủ Gateway.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc toàn bộ bản cài đặt ClawHub được theo dõi trong
    không gian làm việc tác tử mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`,
    `apiKey`, và `env`.

### Các chế độ xem của `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi runtime hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là danh mục được phép; nếu không, phản hồi là toàn bộ danh mục Gateway.
- `"configured"`: hành vi có kích thước phù hợp với bộ chọn. Nếu `agents.defaults.models` được cấu hình, nó vẫn được ưu tiên. Nếu không, phản hồi dùng các mục `models.providers.*.models` rõ ràng, chỉ quay về toàn bộ danh mục khi không có hàng mô hình đã cấu hình nào.
- `"all"`: toàn bộ danh mục Gateway, bỏ qua `agents.defaults.models`. Dùng chế độ này cho chẩn đoán và giao diện khám phá, không dùng cho bộ chọn mô hình thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, Gateway phát `exec.approval.requested`.
- Máy khách người vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu phạm vi `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand` chuẩn tắc/siêu dữ liệu phiên). Các yêu cầu thiếu `systemRunPlan` bị từ chối.
- Sau khi phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ tái sử dụng
  `systemRunPlan` chuẩn tắc đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId`, hoặc
  `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` cuối cùng đã được phê duyệt, thì
  Gateway từ chối lần chạy thay vì tin tưởng payload đã bị thay đổi.

## Dự phòng gửi tác tử

- Yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu gửi ra ngoài.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: mục tiêu gửi không phân giải được hoặc chỉ nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép dự phòng sang thực thi chỉ trong phiên khi không thể phân giải tuyến có thể gửi bên ngoài nào (ví dụ phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).

## Quản lý phiên bản

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/schema/protocol-schemas.ts`.
- Máy khách gửi `minProtocol` + `maxProtocol`; máy chủ từ chối khi không khớp.
- Schema + mô hình được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số máy khách

Máy khách tham chiếu trong `src/gateway/client.ts` dùng các giá trị mặc định này. Các giá trị
ổn định trên protocol v3 và là đường cơ sở được kỳ vọng cho máy khách bên thứ ba.

| Hằng số                                  | Mặc định                                               | Nguồn                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Thời gian chờ yêu cầu (mỗi RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Thời gian chờ preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env có thể tăng ngân sách máy chủ/máy khách ghép đôi) |
| Backoff kết nối lại ban đầu                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Kẹp thử lại nhanh sau khi đóng device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Thời gian gia hạn buộc dừng trước `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Thời gian chờ mặc định của `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng do hết thời gian tick                        | mã `4000` khi im lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Máy chủ quảng bá `policy.tickIntervalMs`, `policy.maxPayload`,
và `policy.maxBufferedBytes` có hiệu lực trong `hello-ok`; máy khách nên tuân thủ các giá trị đó
thay vì các giá trị mặc định trước bắt tay.

## Xác thực

- Xác thực Gateway bằng bí mật dùng chung sử dụng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy vào chế độ xác thực đã cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc chế độ không phải loopback
  `gateway.auth.mode: "trusted-proxy"` đáp ứng kiểm tra xác thực connect từ
  header yêu cầu thay vì `connect.params.auth.*`.
- Chế độ đầu vào riêng tư `gateway.auth.mode: "none"` bỏ qua hoàn toàn xác thực
  connect bằng bí mật dùng chung; không để lộ chế độ đó trên đầu vào công khai/không tin cậy.
- Sau khi ghép đôi, Gateway cấp một **mã thông báo thiết bị** có phạm vi theo
  vai trò kết nối + các phạm vi. Nó được trả về trong `hello-ok.auth.deviceToken`
  và nên được client lưu bền vững cho các lần kết nối sau.
- Client nên lưu bền vững `hello-ok.auth.deviceToken` chính sau bất kỳ lần
  kết nối thành công nào.
- Kết nối lại bằng mã thông báo thiết bị **đã lưu** đó cũng nên tái sử dụng tập
  phạm vi đã phê duyệt được lưu cho mã thông báo đó. Điều này giữ nguyên quyền
  truy cập đọc/thăm dò/trạng thái đã được cấp và tránh âm thầm thu hẹp các lần
  kết nối lại xuống một phạm vi ngầm định chỉ dành cho quản trị viên.
- Lắp ráp xác thực connect phía client (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` là độc lập và luôn được chuyển tiếp khi được đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: mã thông báo dùng chung tường minh trước,
    rồi một `deviceToken` tường minh, rồi một mã thông báo theo thiết bị đã lưu (được khóa theo
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được
    `auth.token`. Một mã thông báo dùng chung hoặc bất kỳ mã thông báo thiết bị nào đã phân giải sẽ chặn nó.
  - Tự động thăng cấp một mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được cho phép với **điểm cuối tin cậy** —
    loopback, hoặc `wss://` với `tlsFingerprint` đã ghim. `wss://` công khai
    không ghim không đủ điều kiện.
- Các mục bổ sung trong `hello-ok.auth.deviceTokens` là mã thông báo bàn giao bootstrap.
  Chỉ lưu bền vững chúng khi connect đã sử dụng xác thực bootstrap trên một kênh truyền tin cậy
  như `wss://` hoặc ghép đôi loopback/cục bộ.
- Nếu client cung cấp một `deviceToken` **tường minh** hoặc `scopes` tường minh, tập
  phạm vi do bên gọi yêu cầu đó vẫn là nguồn thẩm quyền; phạm vi trong bộ nhớ đệm chỉ
  được tái sử dụng khi client đang tái sử dụng mã thông báo theo thiết bị đã lưu.
- Mã thông báo thiết bị có thể được xoay vòng/thu hồi qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`).
- `device.token.rotate` trả về siêu dữ liệu xoay vòng. Nó chỉ phản hồi lại mã thông báo bearer
  thay thế cho các lệnh gọi cùng thiết bị đã được xác thực bằng
  mã thông báo thiết bị đó, để client chỉ dùng mã thông báo có thể lưu bền vững mã thay thế trước khi
  kết nối lại. Các thao tác xoay vòng bằng mã dùng chung/quản trị không phản hồi lại mã thông báo bearer.
- Việc cấp, xoay vòng và thu hồi mã thông báo vẫn bị giới hạn trong tập vai trò đã phê duyệt
  được ghi trong mục ghép đôi của thiết bị đó; thao tác thay đổi mã thông báo không thể mở rộng hoặc
  nhắm tới một vai trò thiết bị mà phê duyệt ghép đôi chưa từng cấp.
- Với các phiên mã thông báo thiết bị đã ghép đôi, quản lý thiết bị được giới hạn theo chính thiết bị đó trừ khi
  bên gọi cũng có `operator.admin`: bên gọi không phải quản trị viên chỉ có thể xóa/thu hồi/xoay vòng
  mục thiết bị **của chính họ**.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi mã thông báo người vận hành đích
  so với các phạm vi phiên hiện tại của bên gọi. Bên gọi không phải quản trị viên
  không thể xoay vòng hoặc thu hồi một mã thông báo người vận hành rộng hơn phạm vi họ đang có.
- Lỗi xác thực bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi client đối với `AUTH_TOKEN_MISMATCH`:
  - Client tin cậy có thể thử lại một lần có giới hạn bằng mã thông báo theo thiết bị trong bộ nhớ đệm.
  - Nếu lần thử lại đó thất bại, client nên dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho người vận hành.

## Danh tính thiết bị + ghép đôi

- Nút nên bao gồm một danh tính thiết bị ổn định (`device.id`) được suy ra từ
  dấu vân tay cặp khóa.
- Gateway cấp mã thông báo theo thiết bị + vai trò.
- Phê duyệt ghép đôi là bắt buộc đối với ID thiết bị mới trừ khi bật tự động phê duyệt cục bộ.
- Tự động phê duyệt ghép đôi tập trung vào các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường tự kết nối hẹp trong backend/container cục bộ cho
  các luồng trợ giúp bí mật dùng chung tin cậy.
- Các kết nối tailnet hoặc LAN cùng máy chủ vẫn được xem là từ xa đối với việc ghép đôi và
  yêu cầu phê duyệt.
- Client WS thường bao gồm danh tính `device` trong khi `connect` (người vận hành +
  nút). Các ngoại lệ người vận hành không có thiết bị duy nhất là các đường tin cậy tường minh:
  - `gateway.controlUi.allowInsecureAuth=true` cho khả năng tương thích HTTP không an toàn chỉ trên localhost.
  - xác thực Control UI của người vận hành `gateway.auth.mode: "trusted-proxy"` thành công.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (phương án khẩn cấp, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` qua direct-loopback được xác thực bằng mã thông báo/mật khẩu
    Gateway dùng chung.
- Tất cả kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di trú xác thực thiết bị

Đối với các client cũ vẫn dùng hành vi ký trước challenge, `connect` giờ trả về
mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` cùng `error.details.reason` ổn định.

Các lỗi di trú thường gặp:

| Thông báo                   | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi trống).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client đã ký bằng nonce cũ/sai.                   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp payload v2.              |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.    |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp dấu vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.       |

Mục tiêu di trú:

- Luôn đợi `connect.challenge`.
- Ký payload v2 có bao gồm nonce máy chủ.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Payload chữ ký ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  ngoài các trường thiết bị/client/vai trò/phạm vi/mã thông báo/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng ghim siêu dữ liệu
  thiết bị đã ghép đôi vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Client có thể tùy chọn ghim dấu vân tay chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này phơi bày **toàn bộ API Gateway** (trạng thái, kênh, mô hình, trò chuyện,
tác nhân, phiên, nút, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi các
schema TypeBox trong `src/gateway/protocol/schema.ts`.

## Liên quan

- [Giao thức Bridge](/vi/gateway/bridge-protocol)
- [Runbook Gateway](/vi/gateway)
