---
read_when:
    - Triển khai hoặc cập nhật các client WS của Gateway
    - Gỡ lỗi sự không khớp giao thức hoặc lỗi kết nối
    - Đang tạo lại lược đồ/mô hình giao thức
summary: 'Giao thức WebSocket của Gateway: bắt tay, khung, quản lý phiên bản'
title: Giao thức Gateway
x-i18n:
    generated_at: "2026-05-02T20:44:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc8bd6bae485f13bbd0e8762d30abdfab7e2aee635f8ebac1a38798493239798
    source_path: gateway/protocol.md
    workflow: 16
---

Giao thức Gateway WS là **mặt phẳng điều khiển duy nhất + tầng truyền tải node** cho
OpenClaw. Tất cả client (CLI, giao diện web, ứng dụng macOS, node iOS/Android, node
headless) kết nối qua WebSocket và khai báo **vai trò** + **phạm vi** của chúng tại
thời điểm handshake.

## Truyền tải

- WebSocket, frame văn bản với payload JSON.
- Frame đầu tiên **phải** là yêu cầu `connect`.
- Các frame trước khi kết nối được giới hạn ở 64 KiB. Sau khi handshake thành công, client
  nên tuân theo các giới hạn `hello-ok.policy.maxPayload` và
  `hello-ok.policy.maxBufferedBytes`. Khi bật chẩn đoán,
  các frame inbound quá lớn và bộ đệm outbound chậm sẽ phát ra sự kiện `payload.large`
  trước khi gateway đóng hoặc bỏ frame bị ảnh hưởng. Các sự kiện này giữ lại
  kích thước, giới hạn, bề mặt và mã lý do an toàn. Chúng không giữ phần thân thông điệp,
  nội dung tệp đính kèm, phần thân frame thô, token, cookie hoặc giá trị bí mật.

## Handshake (connect)

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
trong ngân sách kết nối tổng thể của mình thay vì hiển thị nó như một lỗi
handshake kết thúc.

`server`, `features`, `snapshot` và `policy` đều được schema yêu cầu
(`src/gateway/protocol/schema/frames.ts`). `auth` cũng là bắt buộc và báo cáo
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

Các client backend đáng tin cậy cùng tiến trình (`client.id: "gateway-client"`,
`client.mode: "backend"`) có thể bỏ qua `device` trên các kết nối loopback trực tiếp khi
chúng xác thực bằng token/mật khẩu gateway dùng chung. Đường dẫn này được dành riêng
cho các RPC mặt phẳng điều khiển nội bộ và tránh để các baseline ghép cặp CLI/thiết bị cũ
chặn công việc backend cục bộ như cập nhật phiên subagent. Client từ xa,
client có nguồn gốc trình duyệt, client node và client token thiết bị/danh tính thiết bị
tường minh vẫn sử dụng các bước kiểm tra ghép cặp và nâng cấp phạm vi thông thường.

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
`scopes: []` và mọi token operator được chuyển giao vẫn bị giới hạn trong danh sách cho phép
operator bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Kiểm tra phạm vi bootstrap vẫn
được tiền tố theo vai trò: các mục operator chỉ đáp ứng yêu cầu operator, và các vai trò
không phải operator vẫn cần phạm vi dưới tiền tố vai trò của chính chúng.

### Ví dụ về node

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

Các phạm vi thường dùng:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` với `includeSecrets: true` yêu cầu `operator.talk.secrets`
(hoặc `operator.admin`).

Các phương thức RPC gateway do Plugin đăng ký có thể yêu cầu phạm vi operator riêng, nhưng
các tiền tố quản trị lõi dành riêng (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) luôn phân giải thành `operator.admin`.

Phạm vi phương thức chỉ là cổng kiểm tra đầu tiên. Một số lệnh slash được truy cập qua
`chat.send` áp dụng thêm các kiểm tra cấp lệnh nghiêm ngặt hơn. Ví dụ, các thao tác ghi
`/config set` và `/config unset` bền vững yêu cầu `operator.admin`.

`node.pair.approve` cũng có thêm kiểm tra phạm vi tại thời điểm phê duyệt bên trên
phạm vi phương thức cơ sở:

- yêu cầu không có lệnh: `operator.pairing`
- yêu cầu có các lệnh node không phải exec: `operator.pairing` + `operator.write`
- yêu cầu bao gồm `system.run`, `system.run.prepare` hoặc `system.which`:
  `operator.pairing` + `operator.admin`

### Năng lực/lệnh/quyền (node)

Node khai báo các claim năng lực tại thời điểm kết nối:

- `caps`: các danh mục năng lực cấp cao.
- `commands`: danh sách cho phép lệnh để invoke.
- `permissions`: các công tắc chi tiết (ví dụ `screen.record`, `camera.capture`).

Gateway xem chúng là **claim** và thực thi các danh sách cho phép phía máy chủ.

## Hiện diện

- `system-presence` trả về các mục được định khóa theo danh tính thiết bị.
- Mục hiện diện bao gồm `deviceId`, `roles` và `scopes` để UI có thể hiển thị một hàng duy nhất cho mỗi thiết bị
  ngay cả khi nó kết nối với cả vai trò **operator** và **node**.
- `node.list` bao gồm các trường tùy chọn `lastSeenAtMs` và `lastSeenReason`. Các node đã kết nối báo cáo
  thời gian kết nối hiện tại của chúng là `lastSeenAtMs` với lý do `connect`; các node đã ghép cặp cũng có thể báo cáo
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

## Phạm vi hóa sự kiện phát rộng

Các sự kiện phát rộng WebSocket do máy chủ đẩy được kiểm soát theo phạm vi để các phiên chỉ có phạm vi ghép cặp hoặc chỉ dành cho node không thụ động nhận nội dung phiên.

- **Frame chat, agent và kết quả công cụ** (bao gồm các sự kiện `agent` được stream và kết quả gọi công cụ) yêu cầu tối thiểu `operator.read`. Các phiên không có `operator.read` bỏ qua hoàn toàn những frame này.
- **Các phát rộng `plugin.*` do Plugin định nghĩa** được kiểm soát theo `operator.write` hoặc `operator.admin`, tùy theo cách Plugin đã đăng ký chúng.
- **Sự kiện trạng thái và truyền tải** (`heartbeat`, `presence`, `tick`, vòng đời kết nối/ngắt kết nối, v.v.) vẫn không bị hạn chế để mọi phiên đã xác thực đều quan sát được tình trạng truyền tải.
- **Các họ sự kiện phát rộng không xác định** mặc định được kiểm soát theo phạm vi (đóng khi lỗi) trừ khi một handler đã đăng ký nới lỏng chúng một cách tường minh.

Mỗi kết nối client giữ số thứ tự riêng theo từng client để các phát rộng giữ thứ tự đơn điệu trên socket đó, ngay cả khi các client khác nhau nhìn thấy các tập con đã lọc theo phạm vi khác nhau của luồng sự kiện.

## Các họ phương thức RPC phổ biến

Bề mặt WS công khai rộng hơn các ví dụ handshake/auth ở trên. Đây
không phải là bản dump được tạo tự động — `hello-ok.features.methods` là danh sách khám phá
thận trọng được xây dựng từ `src/gateway/server-methods-list.ts` cộng với các export phương thức
Plugin/kênh đã tải. Hãy xem nó là khám phá tính năng, không phải danh sách liệt kê đầy đủ
của `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Hệ thống và danh tính">
    - `health` trả về snapshot tình trạng gateway đã lưu cache hoặc vừa được thăm dò.
    - `diagnostics.stability` trả về bộ ghi ổn định chẩn đoán có giới hạn gần đây. Nó giữ metadata vận hành như tên sự kiện, số lượng, kích thước byte, chỉ số bộ nhớ, trạng thái hàng đợi/phiên, tên kênh/Plugin và id phiên. Nó không giữ văn bản chat, phần thân webhook, đầu ra công cụ, phần thân yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Yêu cầu phạm vi đọc của operator.
    - `status` trả về tóm tắt gateway kiểu `/status`; các trường nhạy cảm chỉ được bao gồm cho client operator có phạm vi admin.
    - `gateway.identity.get` trả về danh tính thiết bị gateway được dùng bởi các luồng relay và ghép cặp.
    - `system-presence` trả về snapshot hiện diện hiện tại cho các thiết bị operator/node đã kết nối.
    - `system-event` thêm một sự kiện hệ thống và có thể cập nhật/phát rộng ngữ cảnh hiện diện.
    - `last-heartbeat` trả về sự kiện heartbeat đã lưu bền vững mới nhất.
    - `set-heartbeats` bật/tắt xử lý heartbeat trên gateway.

  </Accordion>

  <Accordion title="Mô hình và mức sử dụng">
    - `models.list` trả về danh mục mô hình được runtime cho phép. Truyền `{ "view": "configured" }` cho các mô hình đã cấu hình có kích thước phù hợp bộ chọn (`agents.defaults.models` trước, rồi `models.providers.*.models`), hoặc `{ "view": "all" }` cho danh mục đầy đủ.
    - `usage.status` trả về các cửa sổ sử dụng của nhà cung cấp/tóm tắt hạn mức còn lại.
    - `usage.cost` trả về tóm tắt mức sử dụng chi phí tổng hợp cho một khoảng ngày.
    - `doctor.memory.status` trả về trạng thái sẵn sàng của bộ nhớ vector / embedding được lưu trong bộ nhớ đệm cho không gian làm việc tác nhân mặc định đang hoạt động. Chỉ truyền `{ "probe": true }` hoặc `{ "deep": true }` khi bên gọi muốn ping nhà cung cấp embedding trực tiếp một cách rõ ràng.
    - `doctor.memory.remHarness` trả về bản xem trước REM harness có giới hạn, chỉ đọc cho các máy khách control-plane từ xa. Nó có thể bao gồm đường dẫn không gian làm việc, đoạn trích bộ nhớ, markdown có căn cứ đã render, và ứng viên quảng bá sâu, nên bên gọi cần `operator.read`.
    - `sessions.usage` trả về tóm tắt mức sử dụng theo từng phiên.
    - `sessions.usage.timeseries` trả về mức sử dụng chuỗi thời gian cho một phiên.
    - `sessions.usage.logs` trả về các mục nhật ký sử dụng cho một phiên.

  </Accordion>

  <Accordion title="Kênh và trình hỗ trợ đăng nhập">
    - `channels.status` trả về tóm tắt trạng thái kênh/plugin tích hợp sẵn + đi kèm.
    - `channels.logout` đăng xuất một kênh/tài khoản cụ thể khi kênh hỗ trợ đăng xuất.
    - `web.login.start` bắt đầu luồng đăng nhập QR/web cho nhà cung cấp kênh web hiện tại có hỗ trợ QR.
    - `web.login.wait` chờ luồng đăng nhập QR/web đó hoàn tất và khởi động kênh khi thành công.
    - `push.test` gửi một push APNs thử nghiệm đến một node iOS đã đăng ký.
    - `voicewake.get` trả về các trình kích hoạt wake-word đã lưu.
    - `voicewake.set` cập nhật các trình kích hoạt wake-word và phát sóng thay đổi.

  </Accordion>

  <Accordion title="Nhắn tin và nhật ký">
    - `send` là RPC gửi đi trực tiếp cho các lần gửi nhắm tới kênh/tài khoản/luồng bên ngoài trình chạy chat.
    - `logs.tail` trả về phần đuôi nhật ký tệp Gateway đã cấu hình với các điều khiển con trỏ/giới hạn và byte tối đa.

  </Accordion>

  <Accordion title="Talk và TTS">
    - `talk.config` trả về payload cấu hình Talk hiệu lực; `includeSecrets` yêu cầu `operator.talk.secrets` (hoặc `operator.admin`).
    - `talk.mode` đặt/phát sóng trạng thái chế độ Talk hiện tại cho máy khách WebChat/Control UI.
    - `talk.speak` tổng hợp giọng nói thông qua nhà cung cấp giọng nói Talk đang hoạt động.
    - `tts.status` trả về trạng thái bật TTS, nhà cung cấp đang hoạt động, nhà cung cấp dự phòng, và trạng thái cấu hình nhà cung cấp.
    - `tts.providers` trả về danh mục nhà cung cấp TTS có thể thấy.
    - `tts.enable` và `tts.disable` bật/tắt trạng thái tùy chọn TTS.
    - `tts.setProvider` cập nhật nhà cung cấp TTS ưu tiên.
    - `tts.convert` chạy chuyển đổi văn bản thành giọng nói một lần.

  </Accordion>

  <Accordion title="Bí mật, cấu hình, cập nhật, và trình hướng dẫn">
    - `secrets.reload` phân giải lại các SecretRefs đang hoạt động và chỉ hoán đổi trạng thái bí mật runtime khi thành công hoàn toàn.
    - `secrets.resolve` phân giải các gán bí mật nhắm tới lệnh cho một tập lệnh/đích cụ thể.
    - `config.get` trả về snapshot cấu hình hiện tại và hash.
    - `config.set` ghi một payload cấu hình đã xác thực.
    - `config.patch` hợp nhất một bản cập nhật cấu hình một phần.
    - `config.apply` xác thực + thay thế payload cấu hình đầy đủ.
    - `config.schema` trả về payload schema cấu hình trực tiếp được Control UI và công cụ CLI sử dụng: schema, `uiHints`, phiên bản, và metadata tạo sinh, bao gồm metadata schema plugin + kênh khi runtime có thể tải được. Schema bao gồm metadata trường `title` / `description` được dẫn xuất từ cùng nhãn và văn bản trợ giúp mà UI sử dụng, bao gồm các nhánh cấu thành đối tượng lồng nhau, ký tự đại diện, mục mảng, và `anyOf` / `oneOf` / `allOf` khi có tài liệu trường khớp.
    - `config.schema.lookup` trả về payload tra cứu theo phạm vi đường dẫn cho một đường dẫn cấu hình: đường dẫn đã chuẩn hóa, một node schema nông, gợi ý khớp + `hintPath`, và tóm tắt con trực tiếp cho UI/CLI đi sâu. Các node schema tra cứu giữ lại tài liệu hướng người dùng và các trường xác thực thông dụng (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, giới hạn số/chuỗi/mảng/đối tượng, và các cờ như `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Tóm tắt con hiển thị `key`, `path` đã chuẩn hóa, `type`, `required`, `hasChildren`, cộng với `hint` / `hintPath` khớp.
    - `update.run` chạy luồng cập nhật Gateway và chỉ lên lịch khởi động lại khi bản cập nhật tự nó thành công. Các cập nhật trình quản lý gói buộc khởi động lại cập nhật không trì hoãn, không cooldown sau khi hoán đổi gói để tiến trình Gateway cũ không tiếp tục lazy-load từ cây `dist` đã bị thay thế.
    - `update.status` trả về sentinel khởi động lại cập nhật mới nhất đã lưu trong bộ nhớ đệm, bao gồm phiên bản đang chạy sau khởi động lại khi có sẵn.
    - `wizard.start`, `wizard.next`, `wizard.status`, và `wizard.cancel` cung cấp trình hướng dẫn onboarding qua WS RPC.

  </Accordion>

  <Accordion title="Trình hỗ trợ tác nhân và không gian làm việc">
    - `agents.list` trả về các mục tác nhân đã cấu hình, bao gồm mô hình hiệu lực và metadata runtime.
    - `agents.create`, `agents.update`, và `agents.delete` quản lý bản ghi tác nhân và nối dây không gian làm việc.
    - `agents.files.list`, `agents.files.get`, và `agents.files.set` quản lý các tệp không gian làm việc bootstrap được hiển thị cho một tác nhân.
    - `artifacts.list`, `artifacts.get`, và `artifacts.download` hiển thị tóm tắt artifact dẫn xuất từ transcript và tải xuống cho một phạm vi `sessionKey`, `runId`, hoặc `taskId` rõ ràng. Các truy vấn lượt chạy và tác vụ phân giải phiên sở hữu ở phía máy chủ và chỉ trả về media transcript có provenance khớp; nguồn URL không an toàn hoặc cục bộ trả về tải xuống không được hỗ trợ thay vì fetch ở phía máy chủ.
    - `agent.identity.get` trả về danh tính trợ lý hiệu lực cho một tác nhân hoặc phiên.
    - `agent.wait` chờ một lượt chạy kết thúc và trả về snapshot cuối khi có sẵn.

  </Accordion>

  <Accordion title="Điều khiển phiên">
    - `sessions.list` trả về chỉ mục phiên hiện tại, bao gồm metadata `agentRuntime` theo từng hàng khi backend runtime tác nhân được cấu hình.
    - `sessions.subscribe` và `sessions.unsubscribe` bật/tắt đăng ký sự kiện thay đổi phiên cho máy khách WS hiện tại.
    - `sessions.messages.subscribe` và `sessions.messages.unsubscribe` bật/tắt đăng ký sự kiện transcript/tin nhắn cho một phiên.
    - `sessions.preview` trả về bản xem trước transcript có giới hạn cho các khóa phiên cụ thể.
    - `sessions.describe` trả về một hàng phiên Gateway cho khóa phiên chính xác.
    - `sessions.resolve` phân giải hoặc chuẩn hóa một đích phiên.
    - `sessions.create` tạo một mục phiên mới.
    - `sessions.send` gửi một tin nhắn vào phiên hiện có.
    - `sessions.steer` là biến thể ngắt-và-điều-hướng cho một phiên đang hoạt động.
    - `sessions.abort` hủy công việc đang hoạt động cho một phiên. Bên gọi có thể truyền `key` cộng với `runId` tùy chọn, hoặc chỉ truyền `runId` cho các lượt chạy đang hoạt động mà Gateway có thể phân giải tới một phiên.
    - `sessions.patch` cập nhật metadata/ghi đè phiên và báo cáo mô hình chuẩn đã phân giải cùng `agentRuntime` hiệu lực.
    - `sessions.reset`, `sessions.delete`, và `sessions.compact` thực hiện bảo trì phiên.
    - `sessions.get` trả về hàng phiên đã lưu đầy đủ.
    - Việc thực thi chat vẫn dùng `chat.history`, `chat.send`, `chat.abort`, và `chat.inject`. `chat.history` được chuẩn hóa hiển thị cho máy khách UI: các thẻ chỉ thị inline bị loại khỏi văn bản hiển thị, payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn) và token điều khiển mô hình ASCII/toàn chiều rộng bị rò rỉ sẽ bị loại bỏ, các hàng trợ lý chỉ chứa token im lặng thuần như chính xác `NO_REPLY` / `no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng placeholder.

  </Accordion>

  <Accordion title="Ghép cặp thiết bị và token thiết bị">
    - `device.pair.list` trả về các thiết bị đã ghép cặp đang chờ và đã phê duyệt.
    - `device.pair.approve`, `device.pair.reject`, và `device.pair.remove` quản lý bản ghi ghép cặp thiết bị.
    - `device.token.rotate` xoay vòng token thiết bị đã ghép cặp trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi của nó.
    - `device.token.revoke` thu hồi token thiết bị đã ghép cặp trong phạm vi vai trò đã phê duyệt và phạm vi bên gọi của nó.

  </Accordion>

  <Accordion title="Ghép cặp node, gọi, và công việc đang chờ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, và `node.pair.verify` bao quát ghép cặp node và xác minh bootstrap.
    - `node.list` và `node.describe` trả về trạng thái node đã biết/đã kết nối.
    - `node.rename` cập nhật nhãn node đã ghép cặp.
    - `node.invoke` chuyển tiếp một lệnh tới node đã kết nối.
    - `node.invoke.result` trả về kết quả cho một yêu cầu gọi.
    - `node.event` mang các sự kiện bắt nguồn từ node trở lại gateway.
    - `node.canvas.capability.refresh` làm mới các token khả năng canvas theo phạm vi.
    - `node.pending.pull` và `node.pending.ack` là API hàng đợi của node đã kết nối.
    - `node.pending.enqueue` và `node.pending.drain` quản lý công việc đang chờ bền vững cho các node ngoại tuyến/ngắt kết nối.

  </Accordion>

  <Accordion title="Nhóm phê duyệt">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, và `exec.approval.resolve` bao quát các yêu cầu phê duyệt exec một lần cộng với tra cứu/phát lại phê duyệt đang chờ.
    - `exec.approval.waitDecision` chờ một phê duyệt exec đang chờ và trả về quyết định cuối cùng (hoặc `null` khi hết thời gian chờ).
    - `exec.approvals.get` và `exec.approvals.set` quản lý snapshot chính sách phê duyệt exec của gateway.
    - `exec.approvals.node.get` và `exec.approvals.node.set` quản lý chính sách phê duyệt exec cục bộ của node thông qua lệnh chuyển tiếp node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, và `plugin.approval.resolve` bao quát các luồng phê duyệt do plugin định nghĩa.

  </Accordion>

  <Accordion title="Tự động hóa, skills, và công cụ">
    - Tự động hóa: `wake` lên lịch chèn văn bản wake ngay lập tức hoặc vào heartbeat tiếp theo; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` quản lý công việc đã lên lịch.
    - Skills và công cụ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Các nhóm sự kiện thông dụng

- `chat`: các cập nhật chat UI như `chat.inject` và các sự kiện chat chỉ dành cho transcript khác.
- `session.message` và `session.tool`: cập nhật transcript/luồng sự kiện cho một phiên đã đăng ký.
- `sessions.changed`: chỉ mục phiên hoặc metadata đã thay đổi.
- `presence`: cập nhật snapshot hiện diện hệ thống.
- `tick`: sự kiện keepalive / liveness định kỳ.
- `health`: cập nhật snapshot sức khỏe gateway.
- `heartbeat`: cập nhật luồng sự kiện heartbeat.
- `cron`: sự kiện thay đổi lượt chạy/công việc cron.
- `shutdown`: thông báo tắt gateway.
- `node.pair.requested` / `node.pair.resolved`: vòng đời ghép cặp node.
- `node.invoke.request`: phát sóng yêu cầu gọi node.
- `device.pair.requested` / `device.pair.resolved`: vòng đời thiết bị đã ghép cặp.
- `voicewake.changed`: cấu hình trình kích hoạt wake-word đã thay đổi.
- `exec.approval.requested` / `exec.approval.resolved`: vòng đời phê duyệt exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: vòng đời phê duyệt plugin.

### Phương thức hỗ trợ node

- Node có thể gọi `skills.bins` để fetch danh sách hiện tại của các tệp thực thi skill cho kiểm tra tự động cho phép.

### Phương thức hỗ trợ toán tử

- Người vận hành có thể gọi `commands.list` (`operator.read`) để lấy danh mục lệnh runtime
  cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - `scope` kiểm soát bề mặt mà `name` chính nhắm tới:
    - `text` trả về token lệnh văn bản chính không có dấu `/` ở đầu
    - `native` và đường dẫn mặc định `both` trả về tên native có nhận biết nhà cung cấp
      khi có sẵn
  - `textAliases` mang các bí danh slash chính xác như `/model` và `/m`.
  - `nativeName` mang tên lệnh native có nhận biết nhà cung cấp khi có.
  - `provider` là tùy chọn và chỉ ảnh hưởng đến cách đặt tên native cùng tính khả dụng
    của lệnh Plugin native.
  - `includeArgs=false` bỏ qua metadata đối số đã tuần tự hóa khỏi phản hồi.
- Người vận hành có thể gọi `tools.catalog` (`operator.read`) để lấy danh mục công cụ runtime cho một
  agent. Phản hồi bao gồm các công cụ được nhóm và metadata nguồn gốc:
  - `source`: `core` hoặc `plugin`
  - `pluginId`: chủ sở hữu Plugin khi `source="plugin"`
  - `optional`: cho biết một công cụ Plugin có phải là tùy chọn hay không
- Người vận hành có thể gọi `tools.effective` (`operator.read`) để lấy danh mục công cụ có hiệu lực runtime
  cho một phiên.
  - `sessionKey` là bắt buộc.
  - Gateway suy ra ngữ cảnh runtime đáng tin cậy từ phiên ở phía máy chủ thay vì chấp nhận
    xác thực hoặc ngữ cảnh phân phối do bên gọi cung cấp.
  - Phản hồi được giới hạn theo phiên và phản ánh những gì cuộc trò chuyện đang hoạt động có thể dùng ngay lúc này,
    bao gồm các công cụ core, Plugin và kênh.
- Người vận hành có thể gọi `tools.invoke` (`operator.write`) để gọi một công cụ khả dụng thông qua
  cùng đường dẫn chính sách Gateway như `/tools/invoke`.
  - `name` là bắt buộc. `args`, `sessionKey`, `agentId`, `confirm` và
    `idempotencyKey` là tùy chọn.
  - Nếu cả `sessionKey` và `agentId` đều có mặt, agent của phiên đã phân giải phải khớp với
    `agentId`.
  - Phản hồi là một envelope hướng SDK với các trường `ok`, `toolName`, `output` tùy chọn và
    `error` có kiểu. Việc phê duyệt hoặc từ chối theo chính sách trả về `ok:false` trong payload thay vì
    bỏ qua pipeline chính sách công cụ của Gateway.
- Người vận hành có thể gọi `skills.status` (`operator.read`) để lấy danh mục
  Skills hiển thị cho một agent.
  - `agentId` là tùy chọn; bỏ qua để đọc workspace agent mặc định.
  - Phản hồi bao gồm điều kiện hợp lệ, các yêu cầu còn thiếu, kiểm tra cấu hình và
    tùy chọn cài đặt đã được làm sạch mà không để lộ giá trị bí mật thô.
- Người vận hành có thể gọi `skills.search` và `skills.detail` (`operator.read`) cho
  metadata khám phá ClawHub.
- Người vận hành có thể gọi `skills.install` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub: `{ source: "clawhub", slug, version?, force? }` cài đặt một
    thư mục skill vào thư mục `skills/` của workspace agent mặc định.
  - Chế độ trình cài đặt Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    chạy một hành động `metadata.openclaw.install` đã khai báo trên máy chủ Gateway.
- Người vận hành có thể gọi `skills.update` (`operator.admin`) ở hai chế độ:
  - Chế độ ClawHub cập nhật một slug được theo dõi hoặc tất cả bản cài đặt ClawHub được theo dõi trong
    workspace agent mặc định.
  - Chế độ cấu hình vá các giá trị `skills.entries.<skillKey>` như `enabled`,
    `apiKey` và `env`.

### Các chế độ xem `models.list`

`models.list` chấp nhận tham số `view` tùy chọn:

- Bỏ qua hoặc `"default"`: hành vi runtime hiện tại. Nếu `agents.defaults.models` được cấu hình, phản hồi là danh mục được phép; nếu không, phản hồi là toàn bộ danh mục Gateway.
- `"configured"`: hành vi có kích thước phù hợp cho trình chọn. Nếu `agents.defaults.models` được cấu hình, nó vẫn được ưu tiên. Nếu không, phản hồi dùng các mục `models.providers.*.models` tường minh, chỉ quay về toàn bộ danh mục khi không có hàng mô hình nào được cấu hình.
- `"all"`: toàn bộ danh mục Gateway, bỏ qua `agents.defaults.models`. Dùng mục này cho chẩn đoán và UI khám phá, không dùng cho trình chọn mô hình thông thường.

## Phê duyệt exec

- Khi một yêu cầu exec cần phê duyệt, Gateway phát `exec.approval.requested`.
- Client vận hành phân giải bằng cách gọi `exec.approval.resolve` (yêu cầu phạm vi `operator.approvals`).
- Với `host=node`, `exec.approval.request` phải bao gồm `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata phiên chuẩn). Yêu cầu thiếu `systemRunPlan` sẽ bị từ chối.
- Sau khi được phê duyệt, các lệnh gọi `node.invoke system.run` được chuyển tiếp sẽ dùng lại `systemRunPlan`
  chuẩn đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc
  `sessionKey` giữa bước chuẩn bị và lần chuyển tiếp `system.run` đã được phê duyệt cuối cùng, Gateway
  sẽ từ chối lượt chạy thay vì tin payload đã bị thay đổi.

## Dự phòng phân phối agent

- Yêu cầu `agent` có thể bao gồm `deliver=true` để yêu cầu phân phối ra ngoài.
- `bestEffortDeliver=false` giữ hành vi nghiêm ngặt: mục tiêu phân phối không phân giải được hoặc chỉ dùng nội bộ trả về `INVALID_REQUEST`.
- `bestEffortDeliver=true` cho phép dự phòng sang thực thi chỉ trong phiên khi không thể phân giải tuyến có thể phân phối ra bên ngoài (ví dụ phiên nội bộ/webchat hoặc cấu hình đa kênh mơ hồ).

## Quản lý phiên bản

- `PROTOCOL_VERSION` nằm trong `src/gateway/protocol/schema/protocol-schemas.ts`.
- Client gửi `minProtocol` + `maxProtocol`; máy chủ từ chối các trường hợp không khớp.
- Schema + mô hình được tạo từ định nghĩa TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Hằng số client

Client tham chiếu trong `src/gateway/client.ts` dùng các mặc định này. Các giá trị
ổn định trên protocol v3 và là baseline kỳ vọng cho client bên thứ ba.

| Hằng số                                  | Mặc định                                               | Nguồn                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Thời gian chờ yêu cầu (mỗi RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Thời gian chờ preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env có thể tăng ngân sách máy chủ/client ghép cặp) |
| Backoff kết nối lại ban đầu                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff kết nối lại tối đa                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Giới hạn fast-retry sau khi đóng do device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Thời gian gia hạn force-stop trước `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Thời gian chờ mặc định của `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Khoảng tick mặc định (trước `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Đóng khi hết thời gian tick                        | mã `4000` khi im lặng vượt quá `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Máy chủ quảng bá `policy.tickIntervalMs`, `policy.maxPayload` có hiệu lực,
và `policy.maxBufferedBytes` trong `hello-ok`; client nên tuân theo các giá trị đó
thay vì các mặc định trước handshake.

## Xác thực

- Xác thực Gateway bằng bí mật chia sẻ dùng `connect.params.auth.token` hoặc
  `connect.params.auth.password`, tùy theo chế độ xác thực đã cấu hình.
- Các chế độ mang danh tính như Tailscale Serve
  (`gateway.auth.allowTailscale: true`) hoặc non-loopback
  `gateway.auth.mode: "trusted-proxy"` đáp ứng kiểm tra xác thực connect từ
  header yêu cầu thay vì `connect.params.auth.*`.
- `gateway.auth.mode: "none"` cho ingress riêng tư bỏ qua hoàn toàn xác thực
  connect bằng bí mật chia sẻ; không để lộ chế độ đó trên ingress công khai/không đáng tin cậy.
- Sau khi ghép nối, Gateway phát hành một **mã thông báo thiết bị** giới hạn theo vai trò
  kết nối + phạm vi. Nó được trả về trong `hello-ok.auth.deviceToken` và client nên
  lưu lại để dùng cho các lần kết nối sau.
- Client nên lưu `hello-ok.auth.deviceToken` chính sau bất kỳ lần kết nối
  thành công nào.
- Kết nối lại bằng mã thông báo thiết bị **đã lưu** đó cũng nên tái sử dụng tập phạm vi
  đã phê duyệt được lưu cho mã thông báo đó. Điều này giữ nguyên quyền truy cập đọc/thăm dò/trạng thái
  đã được cấp và tránh âm thầm thu hẹp các lần kết nối lại xuống
  phạm vi ngầm chỉ dành cho admin.
- Lắp ráp xác thực connect phía client (`selectConnectAuth` trong
  `src/gateway/client.ts`):
  - `auth.password` độc lập và luôn được chuyển tiếp khi đã đặt.
  - `auth.token` được điền theo thứ tự ưu tiên: mã thông báo chia sẻ tường minh trước,
    sau đó là `deviceToken` tường minh, rồi mã thông báo theo thiết bị đã lưu (được khóa theo
    `deviceId` + `role`).
  - `auth.bootstrapToken` chỉ được gửi khi không mục nào ở trên phân giải được
    `auth.token`. Mã thông báo chia sẻ hoặc bất kỳ mã thông báo thiết bị nào đã phân giải sẽ ngăn gửi nó.
  - Việc tự động nâng cấp mã thông báo thiết bị đã lưu trong lần thử lại một lần
    `AUTH_TOKEN_MISMATCH` chỉ được bật cho **điểm cuối đáng tin cậy** —
    loopback, hoặc `wss://` với `tlsFingerprint` đã ghim. `wss://` công khai
    không ghim thì không đủ điều kiện.
- Các mục `hello-ok.auth.deviceTokens` bổ sung là mã thông báo bàn giao bootstrap.
  Chỉ lưu chúng khi connect dùng xác thực bootstrap trên phương tiện truyền tải đáng tin cậy
  như `wss://` hoặc ghép nối loopback/cục bộ.
- Nếu client cung cấp `deviceToken` **tường minh** hoặc `scopes` tường minh, tập phạm vi
  do caller yêu cầu đó vẫn là nguồn có thẩm quyền; phạm vi đã lưu trong bộ nhớ đệm chỉ
  được tái sử dụng khi client đang tái sử dụng mã thông báo theo thiết bị đã lưu.
- Mã thông báo thiết bị có thể được xoay vòng/thu hồi qua `device.token.rotate` và
  `device.token.revoke` (yêu cầu phạm vi `operator.pairing`).
- `device.token.rotate` trả về siêu dữ liệu xoay vòng. Nó chỉ phản hồi lại mã thông báo
  bearer thay thế cho các lệnh gọi cùng thiết bị đã được xác thực bằng
  chính mã thông báo thiết bị đó, để client chỉ dùng mã thông báo có thể lưu bản thay thế trước khi
  kết nối lại. Các lần xoay vòng bằng shared/admin không phản hồi mã thông báo bearer.
- Việc phát hành, xoay vòng và thu hồi mã thông báo vẫn bị giới hạn trong tập vai trò đã phê duyệt
  được ghi trong mục ghép nối của thiết bị đó; thao tác thay đổi mã thông báo không thể mở rộng hoặc
  nhắm tới vai trò thiết bị mà phê duyệt ghép nối chưa từng cấp.
- Với các phiên mã thông báo thiết bị đã ghép nối, quản lý thiết bị chỉ trong phạm vi của chính nó trừ khi
  caller cũng có `operator.admin`: caller không phải admin chỉ có thể xóa/thu hồi/xoay vòng
  mục thiết bị **của chính họ**.
- `device.token.rotate` và `device.token.revoke` cũng kiểm tra tập phạm vi mã thông báo operator
  mục tiêu với phạm vi phiên hiện tại của caller. Caller không phải admin
  không thể xoay vòng hoặc thu hồi mã thông báo operator rộng hơn mã họ đang có.
- Lỗi xác thực bao gồm `error.details.code` cùng gợi ý khôi phục:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Hành vi client đối với `AUTH_TOKEN_MISMATCH`:
  - Client đáng tin cậy có thể thử lại một lần có giới hạn bằng mã thông báo theo thiết bị trong bộ nhớ đệm.
  - Nếu lần thử lại đó thất bại, client nên dừng các vòng lặp tự động kết nối lại và hiển thị hướng dẫn hành động cho operator.

## Danh tính thiết bị + ghép nối

- Node nên bao gồm danh tính thiết bị ổn định (`device.id`) được suy ra từ
  dấu vân tay của cặp khóa.
- Gateway phát hành mã thông báo theo thiết bị + vai trò.
- Phê duyệt ghép nối là bắt buộc cho ID thiết bị mới trừ khi tự động phê duyệt cục bộ
  được bật.
- Tự động phê duyệt ghép nối tập trung vào các kết nối local loopback trực tiếp.
- OpenClaw cũng có một đường tự kết nối backend/container-local hẹp cho
  các luồng trợ giúp shared-secret đáng tin cậy.
- Các kết nối cùng host qua tailnet hoặc LAN vẫn được xem là từ xa đối với ghép nối và
  yêu cầu phê duyệt.
- Client WS thường bao gồm danh tính `device` trong `connect` (operator +
  node). Các ngoại lệ operator không có thiết bị duy nhất là các đường tin cậy tường minh:
  - `gateway.controlUi.allowInsecureAuth=true` cho khả năng tương thích HTTP không an toàn chỉ trên localhost.
  - xác thực Control UI operator thành công với `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (phá kính khẩn cấp, hạ cấp bảo mật nghiêm trọng).
  - RPC backend `gateway-client` qua direct-loopback được xác thực bằng mã thông báo/mật khẩu
    Gateway chia sẻ.
- Tất cả kết nối phải ký nonce `connect.challenge` do máy chủ cung cấp.

### Chẩn đoán di chuyển xác thực thiết bị

Đối với client cũ vẫn dùng hành vi ký trước challenge, `connect` hiện trả về
mã chi tiết `DEVICE_AUTH_*` trong `error.details.code` cùng `error.details.reason` ổn định.

Các lỗi di chuyển phổ biến:

| Thông báo                   | details.code                     | details.reason           | Ý nghĩa                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client bỏ qua `device.nonce` (hoặc gửi rỗng).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client đã ký bằng nonce cũ/sai.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Payload chữ ký không khớp payload v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Dấu thời gian đã ký nằm ngoài độ lệch cho phép.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` không khớp dấu vân tay khóa công khai. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Định dạng/chuẩn hóa khóa công khai thất bại.         |

Mục tiêu di chuyển:

- Luôn chờ `connect.challenge`.
- Ký payload v2 có bao gồm nonce của máy chủ.
- Gửi cùng nonce trong `connect.params.device.nonce`.
- Payload chữ ký được ưu tiên là `v3`, ràng buộc `platform` và `deviceFamily`
  ngoài các trường device/client/role/scopes/token/nonce.
- Chữ ký `v2` cũ vẫn được chấp nhận để tương thích, nhưng việc ghim siêu dữ liệu
  thiết bị đã ghép nối vẫn kiểm soát chính sách lệnh khi kết nối lại.

## TLS + ghim

- TLS được hỗ trợ cho kết nối WS.
- Client có thể tùy chọn ghim dấu vân tay chứng chỉ Gateway (xem cấu hình `gateway.tls`
  cùng `gateway.remote.tlsFingerprint` hoặc CLI `--tls-fingerprint`).

## Phạm vi

Giao thức này cung cấp **toàn bộ API Gateway** (trạng thái, kênh, mô hình, chat,
agent, phiên, node, phê duyệt, v.v.). Bề mặt chính xác được định nghĩa bởi
các schema TypeBox trong `src/gateway/protocol/schema.ts`.

## Liên quan

- [Giao thức Bridge](/vi/gateway/bridge-protocol)
- [Sổ tay vận hành Gateway](/vi/gateway)
