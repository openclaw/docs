---
read_when:
    - Ghép nối các nút iOS/Android với Gateway
    - Sử dụng khung vẽ/camera của nút cho ngữ cảnh tác nhân
    - Thêm lệnh node mới hoặc trình trợ giúp CLI
summary: 'Các Node: ghép nối, khả năng, quyền và trình trợ giúp CLI cho canvas/camera/screen/device/notifications/system'
title: Node
x-i18n:
    generated_at: "2026-04-29T22:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe9fdeb21173a32f284810d0bd1e9219932ce7c74fdcbc8b5b197f2647659e8
    source_path: nodes/index.md
    workflow: 16
---

Một **node** là một thiết bị đồng hành (macOS/iOS/Android/headless) kết nối tới **WebSocket** của Gateway (cùng cổng với operator) với `role: "node"` và cung cấp một giao diện lệnh (ví dụ: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) thông qua `node.invoke`. Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol).

Giao thức truyền tải cũ: [Giao thức Bridge](/vi/gateway/bridge-protocol) (TCP JSONL;
chỉ mang tính lịch sử đối với các node hiện tại).

macOS cũng có thể chạy ở **chế độ node**: ứng dụng trên thanh menu kết nối tới máy chủ WS của Gateway và cung cấp các lệnh canvas/camera cục bộ của nó như một node (vì vậy
`openclaw nodes …` hoạt động với máy Mac này). Ở chế độ gateway từ xa, tự động hóa trình duyệt được xử lý bởi node host CLI (`openclaw node run` hoặc dịch vụ node đã cài đặt), không phải bởi node của ứng dụng native.

Ghi chú:

- Node là **thiết bị ngoại vi**, không phải gateway. Chúng không chạy dịch vụ gateway.
- Tin nhắn Telegram/WhatsApp/v.v. đến **gateway**, không đến node.
- Runbook khắc phục sự cố: [/nodes/troubleshooting](/vi/nodes/troubleshooting)

## Ghép cặp + trạng thái

**Node WS sử dụng ghép cặp thiết bị.** Node trình bày danh tính thiết bị trong khi `connect`; Gateway
tạo yêu cầu ghép cặp thiết bị cho `role: node`. Phê duyệt qua CLI thiết bị (hoặc UI).

CLI nhanh:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Nếu một node thử lại với chi tiết xác thực đã thay đổi (role/scopes/public key), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại
`openclaw devices list` trước khi phê duyệt.

Ghi chú:

- `nodes status` đánh dấu một node là **đã ghép cặp** khi vai trò ghép cặp thiết bị của nó bao gồm `node`.
- Bản ghi ghép cặp thiết bị là hợp đồng vai trò đã phê duyệt bền vững. Việc xoay vòng token nằm trong hợp đồng đó; nó không thể nâng cấp một node đã ghép cặp thành một vai trò khác mà phê duyệt ghép cặp chưa từng cấp.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) là một kho ghép cặp node riêng do gateway sở hữu; nó **không** chặn handshake `connect` của WS.
- `openclaw nodes remove --node <id|name|ip>` xóa các mục cũ khỏi kho ghép cặp node riêng do gateway sở hữu đó.
- Phạm vi phê duyệt tuân theo các lệnh đã khai báo của yêu cầu đang chờ:
  - yêu cầu không có lệnh: `operator.pairing`
  - lệnh node không phải exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Node host từ xa (system.run)

Dùng **node host** khi Gateway của bạn chạy trên một máy và bạn muốn lệnh thực thi trên máy khác. Mô hình vẫn nói chuyện với **gateway**; gateway chuyển tiếp các lệnh gọi `exec` đến **node host** khi `host=node` được chọn.

### Cái gì chạy ở đâu

- **Gateway host**: nhận tin nhắn, chạy mô hình, định tuyến lệnh gọi công cụ.
- **Node host**: thực thi `system.run`/`system.which` trên máy node.
- **Phê duyệt**: được thực thi trên node host qua `~/.openclaw/exec-approvals.json`.

Ghi chú phê duyệt:

- Các lần chạy node dựa trên phê duyệt ràng buộc ngữ cảnh yêu cầu chính xác.
- Với các lần thực thi tệp shell/runtime trực tiếp, OpenClaw cũng cố gắng ràng buộc một toán hạng tệp cục bộ cụ thể và từ chối chạy nếu tệp đó thay đổi trước khi thực thi.
- Nếu OpenClaw không thể xác định đúng một tệp cục bộ cụ thể cho một lệnh interpreter/runtime,
  việc thực thi dựa trên phê duyệt sẽ bị từ chối thay vì giả vờ có phạm vi bao phủ runtime đầy đủ. Hãy dùng sandboxing,
  host riêng, hoặc một allowlist/quy trình đầy đủ đáng tin cậy rõ ràng cho ngữ nghĩa interpreter rộng hơn.

### Khởi động node host (foreground)

Trên máy node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway từ xa qua SSH tunnel (bind loopback)

Nếu Gateway bind vào loopback (`gateway.bind=loopback`, mặc định trong chế độ cục bộ),
node host từ xa không thể kết nối trực tiếp. Tạo một SSH tunnel và trỏ node host tới đầu cục bộ của tunnel.

Ví dụ (node host -> gateway host):

```bash
# Terminal A (giữ chạy): chuyển tiếp local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export token gateway và kết nối qua tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Ghi chú:

- `openclaw node run` hỗ trợ xác thực bằng token hoặc mật khẩu.
- Nên dùng biến môi trường: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback cấu hình là `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ cục bộ, node host cố ý bỏ qua `gateway.remote.token` / `gateway.remote.password`.
- Ở chế độ từ xa, `gateway.remote.token` / `gateway.remote.password` đủ điều kiện theo các quy tắc ưu tiên từ xa.
- Nếu các SecretRef `gateway.auth.*` cục bộ đang hoạt động đã được cấu hình nhưng chưa phân giải được, xác thực node-host sẽ fail closed.
- Phân giải xác thực node-host chỉ tôn trọng các biến môi trường `OPENCLAW_GATEWAY_*`.

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

Nếu node thử lại với chi tiết xác thực đã thay đổi, chạy lại `openclaw devices list`
và phê duyệt `requestId` hiện tại.

Tùy chọn đặt tên:

- `--display-name` trên `openclaw node run` / `openclaw node install` (được lưu trong `~/.openclaw/node.json` trên node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (ghi đè phía gateway).

### Thêm lệnh vào allowlist

Phê duyệt exec là **theo từng node host**. Thêm các mục allowlist từ gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Các phê duyệt nằm trên node host tại `~/.openclaw/exec-approvals.json`.

### Trỏ exec tới node

Cấu hình mặc định (cấu hình gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Hoặc theo từng phiên:

```
/exec host=node security=allowlist node=<id-or-name>
```

Sau khi đặt, mọi lệnh gọi `exec` với `host=node` sẽ chạy trên node host (tùy thuộc vào allowlist/phê duyệt của node).

`host=auto` sẽ không tự ngầm chọn node, nhưng một yêu cầu `host=node` rõ ràng theo từng lệnh gọi được phép từ `auto`. Nếu bạn muốn exec trên node là mặc định cho phiên, hãy đặt `tools.exec.host=node` hoặc `/exec host=node ...` một cách rõ ràng.

Liên quan:

- [CLI node host](/vi/cli/node)
- [Công cụ exec](/vi/tools/exec)
- [Phê duyệt exec](/vi/tools/exec-approvals)

## Gọi lệnh

Mức thấp (RPC thô):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Có các trình trợ giúp mức cao hơn cho những quy trình phổ biến kiểu “cấp cho agent một tệp đính kèm MEDIA”.

## Chính sách lệnh

Lệnh node phải vượt qua hai cổng kiểm tra trước khi có thể được gọi:

1. Node phải khai báo lệnh trong danh sách `connect.commands` của WebSocket.
2. Chính sách nền tảng của gateway phải cho phép lệnh đã khai báo.

Các node đồng hành Windows và macOS mặc định cho phép các lệnh đã khai báo an toàn như
`canvas.*`, `camera.list`, `location.get`, và `screen.snapshot`.
Các lệnh nguy hiểm hoặc nhạy cảm về quyền riêng tư như `camera.snap`, `camera.clip`, và
`screen.record` vẫn yêu cầu opt-in rõ ràng bằng
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` luôn thắng các giá trị mặc định và các mục allowlist bổ sung.

Sau khi node thay đổi danh sách lệnh đã khai báo, hãy từ chối ghép cặp thiết bị cũ
và phê duyệt yêu cầu mới để gateway lưu snapshot lệnh đã cập nhật.

## Ảnh chụp màn hình (snapshot canvas)

Nếu node đang hiển thị Canvas (WebView), `canvas.snapshot` trả về `{ format, base64 }`.

Trình trợ giúp CLI (ghi vào tệp tạm và in `MEDIA:<path>`):

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

- `canvas present` chấp nhận URL hoặc đường dẫn tệp cục bộ (`--target`), cùng với `--x/--y/--width/--height` tùy chọn để định vị.
- `canvas eval` chấp nhận JS nội tuyến (`--js`) hoặc một đối số vị trí.

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

Clip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Ghi chú:

- Node phải ở **foreground** cho `canvas.*` và `camera.*` (lệnh gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`).
- Thời lượng clip bị giới hạn (hiện tại `<= 60s`) để tránh payload base64 quá lớn.
- Android sẽ nhắc quyền `CAMERA`/`RECORD_AUDIO` khi có thể; quyền bị từ chối sẽ thất bại với `*_PERMISSION_REQUIRED`.

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

Node cung cấp `location.get` khi Location được bật trong cài đặt.

Trình trợ giúp CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Ghi chú:

- Location **tắt theo mặc định**.
- “Always” yêu cầu quyền hệ thống; fetch nền là best-effort.
- Phản hồi bao gồm lat/lon, độ chính xác (mét), và timestamp.

## SMS (node Android)

Node Android có thể cung cấp `sms.send` khi người dùng cấp quyền **SMS** và thiết bị hỗ trợ điện thoại.

Lệnh gọi mức thấp:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Ghi chú:

- Lời nhắc quyền phải được chấp nhận trên thiết bị Android trước khi capability được quảng bá.
- Thiết bị chỉ có Wi-Fi và không có điện thoại sẽ không quảng bá `sms.send`.

## Lệnh dữ liệu cá nhân + thiết bị Android

Node Android có thể quảng bá các họ lệnh bổ sung khi các capability tương ứng được bật.

Các họ có sẵn:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Ví dụ lệnh gọi:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Ghi chú:

- Lệnh motion được bảo vệ bằng capability theo các cảm biến khả dụng.

## Lệnh hệ thống (Node host / Node trên Mac)

Node macOS cung cấp `system.run`, `system.notify`, và `system.execApprovals.get/set`.
Node host không giao diện cung cấp `system.run`, `system.which`, và `system.execApprovals.get/set`.

Ví dụ:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Ghi chú:

- `system.run` trả về stdout/stderr/mã thoát trong payload.
- Thực thi shell hiện đi qua công cụ `exec` với `host=node`; `nodes` vẫn là bề mặt RPC trực tiếp cho các lệnh Node tường minh.
- `nodes invoke` không hiển thị `system.run` hoặc `system.run.prepare`; các lệnh đó chỉ nằm trên đường dẫn exec.
- Đường dẫn exec chuẩn bị một `systemRunPlan` chuẩn tắc trước khi phê duyệt. Sau khi
  phê duyệt được cấp, Gateway chuyển tiếp kế hoạch đã lưu đó, không phải bất kỳ
  trường command/cwd/session nào được bên gọi chỉnh sửa sau đó.
- `system.notify` tôn trọng trạng thái quyền thông báo trên ứng dụng macOS.
- Metadata `platform` / `deviceFamily` không được nhận dạng của Node dùng một allowlist mặc định thận trọng, loại trừ `system.run` và `system.which`. Nếu bạn cố ý cần các lệnh đó cho một nền tảng không xác định, hãy thêm chúng rõ ràng qua `gateway.nodes.allowCommands`.
- `system.run` hỗ trợ `--cwd`, `--env KEY=VAL`, `--command-timeout`, và `--needs-screen-recording`.
- Với các shell wrapper (`bash|sh|zsh ... -c/-lc`), các giá trị `--env` theo phạm vi yêu cầu được rút gọn thành một allowlist rõ ràng (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Với các quyết định luôn cho phép trong chế độ allowlist, các dispatch wrapper đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu các đường dẫn executable bên trong thay vì đường dẫn wrapper. Nếu việc gỡ wrapper không an toàn, không có mục allowlist nào được tự động lưu.
- Trên Node host Windows ở chế độ allowlist, các lần chạy shell-wrapper qua `cmd.exe /c` cần được phê duyệt (chỉ riêng mục allowlist không tự động cho phép dạng wrapper).
- `system.notify` hỗ trợ `--priority <passive|active|timeSensitive>` và `--delivery <system|overlay|auto>`.
- Node host bỏ qua các ghi đè `PATH` và loại bỏ các khóa khởi động/shell nguy hiểm (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Nếu bạn cần thêm mục PATH, hãy cấu hình môi trường dịch vụ Node host (hoặc cài đặt công cụ vào vị trí chuẩn) thay vì truyền `PATH` qua `--env`.
- Ở chế độ Node macOS, `system.run` được kiểm soát bằng phê duyệt exec trong ứng dụng macOS (Settings → Exec approvals).
  Ask/allowlist/full hoạt động giống như Node host không giao diện; lời nhắc bị từ chối trả về `SYSTEM_RUN_DENIED`.
- Trên Node host không giao diện, `system.run` được kiểm soát bằng phê duyệt exec (`~/.openclaw/exec-approvals.json`).

## Liên kết Node exec

Khi có nhiều Node khả dụng, bạn có thể liên kết exec với một Node cụ thể.
Thao tác này đặt Node mặc định cho `exec host=node` (và có thể được ghi đè theo từng agent).

Mặc định toàn cục:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ghi đè theo từng agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Bỏ đặt để cho phép bất kỳ Node nào:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Bản đồ quyền

Node có thể bao gồm một bản đồ `permissions` trong `node.list` / `node.describe`, được khóa theo tên quyền (ví dụ: `screenRecording`, `accessibility`) với giá trị boolean (`true` = đã cấp).

## Node host không giao diện (đa nền tảng)

OpenClaw có thể chạy một **Node host không giao diện** (không có UI) kết nối với WebSocket
Gateway và cung cấp `system.run` / `system.which`. Điều này hữu ích trên Linux/Windows
hoặc để chạy một Node tối thiểu cùng với máy chủ.

Khởi động:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Ghi chú:

- Vẫn cần ghép đôi (Gateway sẽ hiển thị lời nhắc ghép đôi thiết bị).
- Node host lưu node id, token, tên hiển thị và thông tin kết nối Gateway trong `~/.openclaw/node.json`.
- Phê duyệt exec được thực thi cục bộ qua `~/.openclaw/exec-approvals.json`
  (xem [Phê duyệt exec](/vi/tools/exec-approvals)).
- Trên macOS, Node host không giao diện thực thi `system.run` cục bộ theo mặc định. Đặt
  `OPENCLAW_NODE_EXEC_HOST=app` để định tuyến `system.run` qua companion app exec host; thêm
  `OPENCLAW_NODE_EXEC_FALLBACK=0` để yêu cầu app host và thất bại đóng nếu không khả dụng.
- Thêm `--tls` / `--tls-fingerprint` khi Gateway WS dùng TLS.

## Chế độ Node trên Mac

- Ứng dụng menubar macOS kết nối với máy chủ Gateway WS dưới dạng một Node (nên `openclaw nodes …` hoạt động với Mac này).
- Ở chế độ từ xa, ứng dụng mở một đường hầm SSH cho cổng Gateway và kết nối tới `localhost`.
