---
read_when:
    - Ghép nối các nút iOS/Android với một gateway
    - Sử dụng node canvas/camera cho ngữ cảnh agent
    - Thêm lệnh Node mới hoặc trình trợ giúp CLI
summary: 'Nút: ghép đôi, khả năng, quyền và trình trợ giúp CLI cho canvas/camera/màn hình/thiết bị/thông báo/hệ thống'
title: Nút
x-i18n:
    generated_at: "2026-06-27T17:39:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

Một **node** là một thiết bị đồng hành (macOS/iOS/Android/headless) kết nối tới **WebSocket** của Gateway (cùng cổng với operator) với `role: "node"` và cung cấp một bề mặt lệnh (ví dụ `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) qua `node.invoke`. Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol).

Transport cũ: [Giao thức Bridge](/vi/gateway/bridge-protocol) (TCP JSONL;
chỉ mang tính lịch sử đối với các node hiện tại).

macOS cũng có thể chạy ở **chế độ node**: ứng dụng menubar kết nối tới máy chủ
WS của Gateway và cung cấp các lệnh canvas/camera cục bộ của nó như một node (để
`openclaw nodes …` hoạt động với máy Mac này). Ở chế độ gateway từ xa, tự động hóa
trình duyệt được xử lý bởi host node CLI (`openclaw node run` hoặc dịch vụ node
đã cài đặt), không phải bởi node ứng dụng gốc.

Ghi chú:

- Node là **thiết bị ngoại vi**, không phải gateway. Chúng không chạy dịch vụ gateway.
- Tin nhắn Telegram/WhatsApp/v.v. đến **gateway**, không đến node.
- Runbook khắc phục sự cố: [/nodes/troubleshooting](/vi/nodes/troubleshooting)

## Ghép nối + trạng thái

**Node WS dùng ghép nối thiết bị.** Node trình bày danh tính thiết bị trong lúc `connect`; Gateway
tạo một yêu cầu ghép nối thiết bị cho `role: node`. Phê duyệt qua CLI thiết bị (hoặc UI).

CLI nhanh:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Nếu một node thử lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu
đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại
`openclaw devices list` trước khi phê duyệt.

Ghi chú:

- `nodes status` đánh dấu một node là **đã ghép nối** khi vai trò ghép nối thiết bị của nó bao gồm `node`.
- Bản ghi ghép nối thiết bị là hợp đồng vai trò đã phê duyệt bền vững. Việc xoay vòng token
  vẫn nằm trong hợp đồng đó; nó không thể nâng cấp một node đã ghép nối thành một
  vai trò khác mà phê duyệt ghép nối chưa từng cấp.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) là một kho ghép nối
  node riêng do gateway sở hữu; nó **không** chặn handshake `connect` của WS.
- `openclaw nodes remove --node <id|name|ip>` xóa một ghép nối node. Với node
  dựa trên thiết bị, lệnh này thu hồi vai trò `node` của thiết bị trong `devices/paired.json`
  và ngắt kết nối các phiên vai trò node của thiết bị đó — một thiết bị nhiều vai trò vẫn giữ
  hàng của nó và chỉ mất vai trò `node`, còn hàng của thiết bị chỉ có node sẽ bị
  xóa. Lệnh này cũng xóa mọi mục khớp khỏi kho ghép nối node riêng do gateway sở hữu.
  `operator.pairing` có thể xóa các hàng node không phải operator; một bên gọi bằng
  token thiết bị tự thu hồi vai trò node của chính nó trên thiết bị nhiều vai trò
  còn cần thêm `operator.admin`.
- Phạm vi phê duyệt tuân theo các lệnh đã khai báo của yêu cầu đang chờ:
  - yêu cầu không có lệnh: `operator.pairing`
  - lệnh node không exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host node từ xa (system.run)

Dùng **host node** khi Gateway của bạn chạy trên một máy và bạn muốn lệnh
thực thi trên máy khác. Mô hình vẫn nói chuyện với **gateway**; gateway
chuyển tiếp các lệnh gọi `exec` tới **host node** khi `host=node` được chọn.

### Cái gì chạy ở đâu

- **Host Gateway**: nhận tin nhắn, chạy mô hình, định tuyến lệnh gọi công cụ.
- **Host node**: thực thi `system.run`/`system.which` trên máy node.
- **Phê duyệt**: được thực thi trên host node qua `~/.openclaw/exec-approvals.json`.

Ghi chú phê duyệt:

- Các lượt chạy node dựa trên phê duyệt ràng buộc ngữ cảnh yêu cầu chính xác.
- Với các lần thực thi tệp shell/runtime trực tiếp, OpenClaw cũng cố gắng tối đa để ràng buộc một toán hạng
  tệp cục bộ cụ thể và từ chối lượt chạy nếu tệp đó thay đổi trước khi thực thi.
- Nếu OpenClaw không thể xác định đúng một tệp cục bộ cụ thể cho một lệnh interpreter/runtime,
  thực thi dựa trên phê duyệt sẽ bị từ chối thay vì giả vờ có phạm vi bao phủ runtime đầy đủ. Hãy dùng sandboxing,
  host riêng, hoặc một allowlist/quy trình đầy đủ đáng tin cậy rõ ràng cho ngữ nghĩa interpreter rộng hơn.

### Khởi động host node (foreground)

Trên máy node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway từ xa qua đường hầm SSH (bind loopback)

Nếu Gateway bind vào loopback (`gateway.bind=loopback`, mặc định ở chế độ cục bộ),
host node từ xa không thể kết nối trực tiếp. Tạo một đường hầm SSH và trỏ
host node tới đầu cục bộ của đường hầm.

Ví dụ (host node -> host gateway):

```bash
# Terminal A (giữ chạy): chuyển tiếp local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export token gateway và kết nối qua đường hầm
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Ghi chú:

- `openclaw node run` hỗ trợ xác thực bằng token hoặc mật khẩu.
- Ưu tiên biến môi trường: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Dự phòng cấu hình là `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ cục bộ, host node cố ý bỏ qua `gateway.remote.token` / `gateway.remote.password`.
- Ở chế độ từ xa, `gateway.remote.token` / `gateway.remote.password` đủ điều kiện theo các quy tắc ưu tiên từ xa.
- Nếu SecretRef `gateway.auth.*` cục bộ đang hoạt động được cấu hình nhưng chưa được phân giải, xác thực host node sẽ fail closed.
- Phân giải xác thực host node chỉ tôn trọng các biến môi trường `OPENCLAW_GATEWAY_*`.

### Khởi động host node (dịch vụ)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Ghép nối + đặt tên

Trên host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Nếu node thử lại với chi tiết xác thực đã thay đổi, hãy chạy lại `openclaw devices list`
và phê duyệt `requestId` hiện tại.

Tùy chọn đặt tên:

- `--display-name` trên `openclaw node run` / `openclaw node install` (được lưu bền trong `~/.openclaw/node.json` trên node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (ghi đè từ gateway).

### Đưa lệnh vào allowlist

Phê duyệt exec là **theo từng host node**. Thêm mục allowlist từ gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Các phê duyệt nằm trên host node tại `~/.openclaw/exec-approvals.json`.

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

Sau khi đặt, mọi lệnh gọi `exec` với `host=node` sẽ chạy trên host node (tuân theo
allowlist/phê duyệt của node).

`host=auto` sẽ không tự ngầm chọn node, nhưng yêu cầu `host=node` rõ ràng theo từng lệnh gọi được phép từ `auto`. Nếu bạn muốn exec trên node là mặc định cho phiên, hãy đặt `tools.exec.host=node` hoặc `/exec host=node ...` một cách rõ ràng.

Liên quan:

- [CLI host node](/vi/cli/node)
- [Công cụ exec](/vi/tools/exec)
- [Phê duyệt exec](/vi/tools/exec-approvals)

## Gọi lệnh

Cấp thấp (RPC thô):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Có các helper cấp cao hơn cho những quy trình phổ biến kiểu "cấp cho agent một tệp đính kèm MEDIA".

## Chính sách lệnh

Lệnh node phải vượt qua hai cổng trước khi có thể được gọi:

1. Node phải khai báo lệnh trong danh sách `connect.commands` của WebSocket.
2. Chính sách nền tảng của gateway phải cho phép lệnh đã khai báo.

Các node đồng hành Windows và macOS mặc định cho phép các lệnh đã khai báo an toàn như
`canvas.*`, `camera.list`, `location.get`, và `screen.snapshot`.
Các node đáng tin cậy quảng bá capability `talk` hoặc khai báo lệnh `talk.*`
cũng mặc định cho phép các lệnh push-to-talk đã khai báo (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), độc lập với nhãn nền tảng.
Các lệnh nguy hiểm hoặc nặng về quyền riêng tư như `camera.snap`, `camera.clip`, và
`screen.record` vẫn yêu cầu opt-in rõ ràng bằng
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` luôn thắng
mặc định và các mục allowlist bổ sung.

Các lệnh node do Plugin sở hữu có thể thêm một chính sách node-invoke của Gateway. Chính sách đó
chạy sau kiểm tra allowlist và trước khi chuyển tiếp tới node, vì vậy RPC thô
`node.invoke`, helper CLI, và công cụ agent chuyên dụng dùng chung cùng một ranh giới
quyền Plugin. Các lệnh node Plugin nguy hiểm vẫn yêu cầu opt-in rõ ràng bằng
`gateway.nodes.allowCommands`.

Sau khi một node thay đổi danh sách lệnh đã khai báo, hãy từ chối ghép nối thiết bị cũ
và phê duyệt yêu cầu mới để gateway lưu ảnh chụp lệnh đã cập nhật.

## Cấu hình (`openclaw.json`)

Các thiết lập liên quan đến node nằm dưới `gateway.nodes` và `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Dùng đúng tên lệnh node. `denyCommands` loại bỏ một lệnh ngay cả khi một
mặc định nền tảng hoặc mục `allowCommands` lẽ ra sẽ cho phép nó. Xem
[Tham chiếu cấu hình Gateway](/vi/gateway/configuration-reference#gateway-field-details)
để biết chi tiết trường ghép nối node gateway và chính sách lệnh.

Ghi đè node exec theo từng agent:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Ảnh chụp màn hình (ảnh chụp canvas)

Nếu node đang hiển thị Canvas (WebView), `canvas.snapshot` trả về `{ format, base64 }`.

Helper CLI (ghi vào một tệp tạm và in đường dẫn đã lưu):

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

- Node di động dùng một trang A2UI đi kèm do ứng dụng sở hữu để render có hỗ trợ action.
- Chỉ hỗ trợ JSONL A2UI v0.8 (v0.9/createSurface bị từ chối).
- iOS và Android render các trang Gateway Canvas từ xa, nhưng action nút A2UI chỉ được dispatch từ trang A2UI đi kèm do ứng dụng sở hữu. Các trang A2UI HTTP/HTTPS do Gateway host chỉ render trên các client di động đó.

## Ảnh + video (camera node)

Ảnh (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Đoạn video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Ghi chú:

- Node phải được **đưa lên tiền cảnh** cho `canvas.*` và `camera.*` (lệnh gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`).
- Thời lượng đoạn video bị giới hạn (hiện tại `<= 60s`) để tránh payload base64 quá lớn.
- Android sẽ nhắc cấp quyền `CAMERA`/`RECORD_AUDIO` khi có thể; quyền bị từ chối sẽ thất bại với `*_PERMISSION_REQUIRED`.

## Ghi màn hình (node)

Các node được hỗ trợ cung cấp `screen.record` (`mp4`). Ví dụ:

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

Các node cung cấp `location.get` khi Vị trí được bật trong cài đặt.

Trình trợ giúp CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Ghi chú:

- Vị trí **tắt theo mặc định**.
- "Luôn luôn" yêu cầu quyền hệ thống; việc lấy dữ liệu trong nền là nỗ lực tối đa.
- Phản hồi bao gồm lat/lon, độ chính xác (mét) và dấu thời gian.

## SMS (node Android)

Node Android có thể cung cấp `sms.send` khi người dùng cấp quyền **SMS** và thiết bị hỗ trợ điện thoại di động.

Lệnh gọi cấp thấp:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Ghi chú:

- Lời nhắc cấp quyền phải được chấp nhận trên thiết bị Android trước khi capability được quảng bá.
- Thiết bị chỉ có Wi-Fi và không có điện thoại di động sẽ không quảng bá `sms.send`.

## Lệnh thiết bị Android + dữ liệu cá nhân

Node Android có thể quảng bá thêm các họ lệnh khi các capability tương ứng được bật.

Các họ có sẵn:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` khi chia sẻ Ứng dụng đã cài đặt được bật trong Cài đặt Android
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Ví dụ gọi lệnh:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Ghi chú:

- `device.apps` là tùy chọn tham gia và mặc định trả về các ứng dụng hiển thị trong launcher.
- Các lệnh chuyển động được kiểm soát bằng capability theo cảm biến khả dụng.

## Lệnh hệ thống (máy chủ node / node Mac)

Node macOS cung cấp `system.run`, `system.notify` và `system.execApprovals.get/set`.
Máy chủ node không giao diện cung cấp `system.run`, `system.which` và `system.execApprovals.get/set`.

Ví dụ:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Ghi chú:

- `system.run` trả về stdout/stderr/mã thoát trong payload.
- Việc thực thi shell hiện đi qua công cụ `exec` với `host=node`; `nodes` vẫn là bề mặt RPC trực tiếp cho các lệnh node tường minh.
- `nodes invoke` không cung cấp `system.run` hoặc `system.run.prepare`; các lệnh đó chỉ ở trên đường dẫn exec.
- Đường dẫn exec chuẩn bị một `systemRunPlan` chuẩn trước khi phê duyệt. Sau khi
  phê duyệt được cấp, Gateway chuyển tiếp kế hoạch đã lưu đó, không phải bất kỳ
  trường command/cwd/session nào do bên gọi chỉnh sửa sau đó.
- `system.notify` tôn trọng trạng thái quyền thông báo trên ứng dụng macOS.
- Metadata `platform` / `deviceFamily` của node không nhận dạng được dùng allowlist mặc định thận trọng, loại trừ `system.run` và `system.which`. Nếu bạn cố ý cần các lệnh đó cho một nền tảng không xác định, hãy thêm chúng rõ ràng qua `gateway.nodes.allowCommands`.
- `system.run` hỗ trợ `--cwd`, `--env KEY=VAL`, `--command-timeout` và `--needs-screen-recording`.
- Với trình bao bọc shell (`bash|sh|zsh ... -c/-lc`), các giá trị `--env` theo phạm vi yêu cầu được rút gọn về một allowlist tường minh (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Với quyết định luôn cho phép trong chế độ allowlist, các trình bao bọc dispatch đã biết (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn executable bên trong thay vì đường dẫn trình bao bọc. Nếu không thể tháo bao bọc một cách an toàn, không có mục allowlist nào được lưu tự động.
- Trên máy chủ node Windows ở chế độ allowlist, các lần chạy trình bao bọc shell qua `cmd.exe /c` cần được phê duyệt (chỉ riêng mục allowlist không tự động cho phép dạng trình bao bọc).
- `system.notify` hỗ trợ `--priority <passive|active|timeSensitive>` và `--delivery <system|overlay|auto>`.
- Máy chủ node bỏ qua ghi đè `PATH` và loại bỏ các khóa khởi động/shell nguy hiểm (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Nếu bạn cần thêm mục PATH, hãy cấu hình môi trường dịch vụ máy chủ node (hoặc cài đặt công cụ ở vị trí tiêu chuẩn) thay vì truyền `PATH` qua `--env`.
- Ở chế độ node macOS, `system.run` được kiểm soát bằng phê duyệt exec trong ứng dụng macOS (Cài đặt → Phê duyệt exec).
  Hỏi/allowlist/đầy đủ hoạt động giống như máy chủ node không giao diện; lời nhắc bị từ chối trả về `SYSTEM_RUN_DENIED`.
- Trên máy chủ node không giao diện, `system.run` được kiểm soát bằng phê duyệt exec (`~/.openclaw/exec-approvals.json`).

## Liên kết node exec

Khi có nhiều node khả dụng, bạn có thể liên kết exec với một node cụ thể.
Thao tác này đặt node mặc định cho `exec host=node` (và có thể được ghi đè theo từng agent).

Mặc định toàn cục:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ghi đè theo từng agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Bỏ đặt để cho phép bất kỳ node nào:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Bản đồ quyền

Node có thể bao gồm một bản đồ `permissions` trong `node.list` / `node.describe`, được khóa theo tên quyền (ví dụ `screenRecording`, `accessibility`) với giá trị boolean (`true` = đã cấp).

## Máy chủ node không giao diện (đa nền tảng)

OpenClaw có thể chạy một **máy chủ node không giao diện** (không có UI) kết nối tới Gateway
WebSocket và cung cấp `system.run` / `system.which`. Điều này hữu ích trên Linux/Windows
hoặc để chạy một node tối giản cùng với máy chủ.

Khởi động:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Ghi chú:

- Vẫn cần ghép đôi (Gateway sẽ hiển thị lời nhắc ghép đôi thiết bị).
- Máy chủ node lưu id node, token, tên hiển thị và thông tin kết nối gateway trong `~/.openclaw/node.json`.
- Phê duyệt exec được thực thi cục bộ qua `~/.openclaw/exec-approvals.json`
  (xem [Phê duyệt exec](/vi/tools/exec-approvals)).
- Trên macOS, máy chủ node không giao diện thực thi `system.run` cục bộ theo mặc định. Đặt
  `OPENCLAW_NODE_EXEC_HOST=app` để định tuyến `system.run` qua máy chủ exec của ứng dụng đồng hành; thêm
  `OPENCLAW_NODE_EXEC_FALLBACK=0` để yêu cầu máy chủ ứng dụng và thất bại đóng nếu không khả dụng.
- Thêm `--tls` / `--tls-fingerprint` khi Gateway WS dùng TLS.

## Chế độ node Mac

- Ứng dụng thanh menu macOS kết nối tới máy chủ Gateway WS dưới dạng một node (vì vậy `openclaw nodes …` hoạt động với Mac này).
- Ở chế độ từ xa, ứng dụng mở một đường hầm SSH cho cổng Gateway và kết nối tới `localhost`.
