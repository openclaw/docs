---
read_when:
    - Ghép đôi các nút iOS/Android với Gateway
    - Sử dụng canvas/camera của nút cho ngữ cảnh tác nhân
    - Thêm lệnh Node mới hoặc trình trợ giúp CLI
summary: 'Node: ghép nối, năng lực, quyền và trình trợ giúp CLI cho khung vẽ/máy ảnh/màn hình/thiết bị/thông báo/hệ thống'
title: Node
x-i18n:
    generated_at: "2026-04-30T09:37:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

Một **node** là một thiết bị đồng hành (macOS/iOS/Android/không giao diện) kết nối tới **WebSocket** của Gateway (cùng cổng với operator) với `role: "node"` và cung cấp một bề mặt lệnh (ví dụ: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) thông qua `node.invoke`. Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol).

Giao vận kế thừa: [Giao thức Bridge](/vi/gateway/bridge-protocol) (TCP JSONL;
chỉ mang tính lịch sử đối với các node hiện tại).

macOS cũng có thể chạy ở **chế độ node**: ứng dụng thanh menu kết nối tới máy chủ
WS của Gateway và cung cấp các lệnh canvas/camera cục bộ của nó dưới dạng một node (để
`openclaw nodes …` hoạt động với máy Mac này). Ở chế độ gateway từ xa, tự động hóa trình duyệt
được xử lý bởi CLI node host (`openclaw node run` hoặc dịch vụ node
đã cài đặt), không phải bởi node ứng dụng gốc.

Ghi chú:

- Node là **thiết bị ngoại vi**, không phải gateway. Chúng không chạy dịch vụ gateway.
- Tin nhắn Telegram/WhatsApp/v.v. đến **gateway**, không đến node.
- Runbook khắc phục sự cố: [/nodes/troubleshooting](/vi/nodes/troubleshooting)

## Ghép cặp + trạng thái

**WS node dùng ghép cặp thiết bị.** Node trình bày danh tính thiết bị trong lúc `connect`; Gateway
tạo một yêu cầu ghép cặp thiết bị cho `role: node`. Phê duyệt qua CLI thiết bị (hoặc UI).

CLI nhanh:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Nếu một node thử lại với chi tiết xác thực đã thay đổi (role/scopes/public key), yêu cầu
đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại
`openclaw devices list` trước khi phê duyệt.

Ghi chú:

- `nodes status` đánh dấu một node là **đã ghép cặp** khi vai trò ghép cặp thiết bị của nó bao gồm `node`.
- Bản ghi ghép cặp thiết bị là hợp đồng vai trò được phê duyệt bền vững. Việc xoay vòng token
  vẫn nằm trong hợp đồng đó; nó không thể nâng cấp một node đã ghép cặp thành một
  vai trò khác mà phê duyệt ghép cặp chưa từng cấp.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) là một kho ghép cặp
  node riêng do gateway sở hữu; nó **không** chặn bắt tay WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` xóa các mục cũ khỏi
  kho ghép cặp node riêng do gateway sở hữu đó.
- Phạm vi phê duyệt tuân theo các lệnh đã khai báo của yêu cầu đang chờ:
  - yêu cầu không có lệnh: `operator.pairing`
  - lệnh node không phải exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote node host (system.run)

Dùng **node host** khi Gateway của bạn chạy trên một máy và bạn muốn lệnh
thực thi trên một máy khác. Model vẫn giao tiếp với **gateway**; gateway
chuyển tiếp các lệnh gọi `exec` tới **node host** khi `host=node` được chọn.

### Chạy ở đâu

- **Gateway host**: nhận tin nhắn, chạy model, định tuyến các lệnh gọi tool.
- **Node host**: thực thi `system.run`/`system.which` trên máy node.
- **Phê duyệt**: được thực thi trên node host thông qua `~/.openclaw/exec-approvals.json`.

Ghi chú phê duyệt:

- Các lượt chạy node dựa trên phê duyệt ràng buộc đúng ngữ cảnh yêu cầu.
- Đối với các lượt thực thi shell/runtime trực tiếp trên tệp, OpenClaw cũng cố gắng hết mức ràng buộc một toán hạng tệp cục bộ
  cụ thể và từ chối lượt chạy nếu tệp đó thay đổi trước khi thực thi.
- Nếu OpenClaw không thể xác định chính xác một tệp cục bộ cụ thể cho một lệnh interpreter/runtime,
  thực thi dựa trên phê duyệt sẽ bị từ chối thay vì giả vờ có phạm vi bao phủ runtime đầy đủ. Hãy dùng sandboxing,
  các host riêng biệt, hoặc một allowlist/quy trình đầy đủ đáng tin cậy rõ ràng cho ngữ nghĩa interpreter rộng hơn.

### Khởi động node host (foreground)

Trên máy node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway từ xa qua SSH tunnel (ràng buộc loopback)

Nếu Gateway ràng buộc vào loopback (`gateway.bind=loopback`, mặc định ở chế độ cục bộ),
các remote node host không thể kết nối trực tiếp. Tạo một SSH tunnel và trỏ
node host tới đầu cục bộ của tunnel.

Ví dụ (node host -> gateway host):

```bash
# Terminal A (giữ chạy): chuyển tiếp local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export gateway token và kết nối qua tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Ghi chú:

- `openclaw node run` hỗ trợ xác thực bằng token hoặc mật khẩu.
- Ưu tiên biến môi trường: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback cấu hình là `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ cục bộ, node host cố ý bỏ qua `gateway.remote.token` / `gateway.remote.password`.
- Ở chế độ từ xa, `gateway.remote.token` / `gateway.remote.password` đủ điều kiện theo các quy tắc ưu tiên từ xa.
- Nếu các SecretRef `gateway.auth.*` cục bộ đang hoạt động được cấu hình nhưng chưa phân giải được, xác thực node-host sẽ đóng theo hướng an toàn.
- Phân giải xác thực node-host chỉ tôn trọng biến môi trường `OPENCLAW_GATEWAY_*`.

### Khởi động node host (dịch vụ)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Ghép cặp + đặt tên

Trên gateway host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Nếu node thử lại với chi tiết xác thực đã thay đổi, hãy chạy lại `openclaw devices list`
và phê duyệt `requestId` hiện tại.

Tùy chọn đặt tên:

- `--display-name` trên `openclaw node run` / `openclaw node install` (được lưu trong `~/.openclaw/node.json` trên node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (ghi đè phía gateway).

### Allowlist các lệnh

Phê duyệt exec là **theo từng node host**. Thêm mục allowlist từ gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Phê duyệt nằm trên node host tại `~/.openclaw/exec-approvals.json`.

### Trỏ exec tới node

Cấu hình mặc định (cấu hình gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Hoặc theo phiên:

```
/exec host=node security=allowlist node=<id-or-name>
```

Sau khi thiết lập, bất kỳ lệnh gọi `exec` nào với `host=node` đều chạy trên node host (tuân theo
allowlist/phê duyệt của node).

`host=auto` sẽ không tự ngầm chọn node, nhưng yêu cầu `host=node` rõ ràng theo từng lệnh gọi được phép từ `auto`. Nếu bạn muốn node exec là mặc định cho phiên, hãy đặt `tools.exec.host=node` hoặc `/exec host=node ...` rõ ràng.

Liên quan:

- [CLI Node host](/vi/cli/node)
- [Tool exec](/vi/tools/exec)
- [Phê duyệt exec](/vi/tools/exec-approvals)

## Gọi lệnh

Cấp thấp (RPC thô):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Có các helper cấp cao hơn cho các quy trình phổ biến “cung cấp cho agent một tệp đính kèm MEDIA”.

## Chính sách lệnh

Lệnh node phải vượt qua hai cổng kiểm tra trước khi có thể được gọi:

1. Node phải khai báo lệnh trong danh sách WebSocket `connect.commands` của nó.
2. Chính sách nền tảng của gateway phải cho phép lệnh đã khai báo.

Các node đồng hành Windows và macOS cho phép các lệnh đã khai báo an toàn như
`canvas.*`, `camera.list`, `location.get`, và `screen.snapshot` theo mặc định.
Các lệnh nguy hiểm hoặc nhạy cảm về quyền riêng tư như `camera.snap`, `camera.clip`, và
`screen.record` vẫn yêu cầu bật rõ ràng với
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` luôn thắng
các mặc định và các mục allowlist bổ sung.

Các lệnh node do Plugin sở hữu có thể thêm chính sách node-invoke của Gateway. Chính sách đó
chạy sau bước kiểm tra allowlist và trước khi chuyển tiếp tới node, vì vậy RPC thô
`node.invoke`, helper CLI, và các tool agent chuyên dụng dùng chung cùng một ranh giới quyền
Plugin. Các lệnh node Plugin nguy hiểm vẫn yêu cầu bật rõ ràng
`gateway.nodes.allowCommands`.

Sau khi một node thay đổi danh sách lệnh đã khai báo, hãy từ chối ghép cặp thiết bị cũ
và phê duyệt yêu cầu mới để gateway lưu ảnh chụp lệnh đã cập nhật.

## Ảnh chụp màn hình (ảnh chụp canvas)

Nếu node đang hiển thị Canvas (WebView), `canvas.snapshot` trả về `{ format, base64 }`.

Helper CLI (ghi vào một tệp tạm và in `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Điều khiển Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Ghi chú:

- `canvas present` nhận URL hoặc đường dẫn tệp cục bộ (`--target`), cùng với `--x/--y/--width/--height` tùy chọn để định vị.
- `canvas eval` nhận JS nội tuyến (`--js`) hoặc một đối số vị trí.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Ghi chú:

- Chỉ hỗ trợ A2UI v0.8 JSONL (v0.9/createSurface bị từ chối).

## Ảnh + video (camera node)

Ảnh (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # mặc định: cả hai hướng camera (2 dòng MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Đoạn video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Ghi chú:

- Node phải ở **foreground** cho `canvas.*` và `camera.*` (các lệnh gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`).
- Thời lượng đoạn clip bị giới hạn (hiện tại `<= 60s`) để tránh payload base64 quá lớn.
- Android sẽ nhắc cấp quyền `CAMERA`/`RECORD_AUDIO` khi có thể; quyền bị từ chối sẽ thất bại với `*_PERMISSION_REQUIRED`.

## Ghi màn hình (node)

Các node được hỗ trợ cung cấp `screen.record` (mp4). Ví dụ:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Ghi chú:

- Tính khả dụng của `screen.record` phụ thuộc vào nền tảng node.
- Bản ghi màn hình bị giới hạn ở `<= 60s`.
- `--no-audio` tắt thu âm microphone trên các nền tảng được hỗ trợ.
- Dùng `--screen <index>` để chọn một màn hình khi có nhiều màn hình khả dụng.

## Vị trí (node)

Node cung cấp `location.get` khi Vị trí được bật trong phần cài đặt.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Ghi chú:

- Vị trí **tắt theo mặc định**.
- “Luôn luôn” yêu cầu quyền hệ thống; lấy dữ liệu nền là nỗ lực tối đa.
- Phản hồi bao gồm lat/lon, độ chính xác (mét), và dấu thời gian.

## SMS (node Android)

Node Android có thể cung cấp `sms.send` khi người dùng cấp quyền **SMS** và thiết bị hỗ trợ điện thoại.

Gọi cấp thấp:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Ghi chú:

- Lời nhắc cấp quyền phải được chấp nhận trên thiết bị Android trước khi capability được quảng bá.
- Các thiết bị chỉ có Wi-Fi không có điện thoại sẽ không quảng bá `sms.send`.

## Thiết bị Android + lệnh dữ liệu cá nhân

Node Android có thể quảng bá thêm các nhóm lệnh khi các capability tương ứng được bật.

Các nhóm khả dụng:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Ví dụ gọi:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Ghi chú:

- Các lệnh chuyển động được kiểm soát theo năng lực bởi những cảm biến khả dụng.

## Lệnh hệ thống (host node / node mac)

Node macOS cung cấp `system.run`, `system.notify`, và `system.execApprovals.get/set`.
Host node không giao diện cung cấp `system.run`, `system.which`, và `system.execApprovals.get/set`.

Ví dụ:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Ghi chú:

- `system.run` trả về stdout/stderr/mã thoát trong payload.
- Thực thi shell hiện đi qua công cụ `exec` với `host=node`; `nodes` vẫn là bề mặt RPC trực tiếp cho các lệnh node tường minh.
- `nodes invoke` không cung cấp `system.run` hoặc `system.run.prepare`; các lệnh đó chỉ nằm trên đường dẫn exec.
- Đường dẫn exec chuẩn bị một `systemRunPlan` chuẩn trước khi phê duyệt. Sau khi
  phê duyệt được cấp, Gateway chuyển tiếp kế hoạch đã lưu đó, không phải bất kỳ
  trường command/cwd/session nào được bên gọi chỉnh sửa về sau.
- `system.notify` tôn trọng trạng thái quyền thông báo trên ứng dụng macOS.
- Metadata `platform` / `deviceFamily` của node không được nhận dạng sẽ dùng danh sách cho phép mặc định thận trọng, loại trừ `system.run` và `system.which`. Nếu bạn chủ ý cần các lệnh đó cho một nền tảng không xác định, hãy thêm chúng tường minh qua `gateway.nodes.allowCommands`.
- `system.run` hỗ trợ `--cwd`, `--env KEY=VAL`, `--command-timeout`, và `--needs-screen-recording`.
- Với các shell wrapper (`bash|sh|zsh ... -c/-lc`), các giá trị `--env` theo phạm vi yêu cầu được rút gọn thành danh sách cho phép tường minh (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Với các quyết định luôn cho phép trong chế độ danh sách cho phép, các dispatch wrapper đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sẽ lưu đường dẫn executable bên trong thay vì đường dẫn wrapper. Nếu không thể unwrap an toàn, không có mục danh sách cho phép nào được tự động lưu.
- Trên host node Windows ở chế độ danh sách cho phép, các lần chạy shell-wrapper qua `cmd.exe /c` cần phê duyệt (chỉ mục danh sách cho phép không tự động cho phép dạng wrapper).
- `system.notify` hỗ trợ `--priority <passive|active|timeSensitive>` và `--delivery <system|overlay|auto>`.
- Host node bỏ qua các override `PATH` và loại bỏ các khóa khởi động/shell nguy hiểm (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Nếu bạn cần thêm mục PATH, hãy cấu hình môi trường dịch vụ host node (hoặc cài công cụ ở vị trí tiêu chuẩn) thay vì truyền `PATH` qua `--env`.
- Ở chế độ node macOS, `system.run` được kiểm soát bằng phê duyệt exec trong ứng dụng macOS (Settings → Exec approvals).
  Ask/allowlist/full hoạt động giống host node không giao diện; các prompt bị từ chối trả về `SYSTEM_RUN_DENIED`.
- Trên host node không giao diện, `system.run` được kiểm soát bằng phê duyệt exec (`~/.openclaw/exec-approvals.json`).

## Liên kết node cho exec

Khi có nhiều node khả dụng, bạn có thể liên kết exec với một node cụ thể.
Việc này đặt node mặc định cho `exec host=node` (và có thể được ghi đè theo từng tác nhân).

Mặc định toàn cục:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ghi đè theo từng tác nhân:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Bỏ đặt để cho phép bất kỳ node nào:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Bản đồ quyền

Node có thể bao gồm một bản đồ `permissions` trong `node.list` / `node.describe`, được khóa theo tên quyền (ví dụ `screenRecording`, `accessibility`) với giá trị boolean (`true` = đã cấp).

## Host node không giao diện (đa nền tảng)

OpenClaw có thể chạy một **host node không giao diện** (không có UI) kết nối tới WebSocket
Gateway và cung cấp `system.run` / `system.which`. Điều này hữu ích trên Linux/Windows
hoặc để chạy một node tối thiểu cùng với một server.

Khởi động:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Ghi chú:

- Vẫn cần ghép đôi (Gateway sẽ hiển thị prompt ghép đôi thiết bị).
- Host node lưu id node, token, tên hiển thị và thông tin kết nối gateway trong `~/.openclaw/node.json`.
- Phê duyệt exec được thực thi cục bộ qua `~/.openclaw/exec-approvals.json`
  (xem [Phê duyệt exec](/vi/tools/exec-approvals)).
- Trên macOS, host node không giao diện thực thi `system.run` cục bộ theo mặc định. Đặt
  `OPENCLAW_NODE_EXEC_HOST=app` để định tuyến `system.run` qua host exec của ứng dụng đồng hành; thêm
  `OPENCLAW_NODE_EXEC_FALLBACK=0` để yêu cầu host ứng dụng và fail closed nếu không khả dụng.
- Thêm `--tls` / `--tls-fingerprint` khi Gateway WS dùng TLS.

## Chế độ node Mac

- Ứng dụng thanh menu macOS kết nối tới server Gateway WS dưới dạng node (vì vậy `openclaw nodes …` hoạt động với máy Mac này).
- Ở chế độ từ xa, ứng dụng mở một tunnel SSH cho cổng Gateway và kết nối tới `localhost`.
