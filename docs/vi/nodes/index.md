---
read_when:
    - Ghép nối các nút iOS/Android với Gateway
    - Sử dụng canvas/camera của node cho ngữ cảnh agent
    - Thêm lệnh node hoặc trình trợ giúp CLI mới
summary: 'Node: ghép nối, năng lực, quyền và trình trợ giúp CLI cho canvas/camera/màn hình/thiết bị/thông báo/hệ thống'
title: Các Node
x-i18n:
    generated_at: "2026-07-03T09:45:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

Một **Node** là thiết bị đồng hành (macOS/iOS/Android/headless) kết nối tới Gateway **WebSocket** (cùng cổng với operator) với `role: "node"` và cung cấp một bề mặt lệnh (ví dụ `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) qua `node.invoke`. Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol).

Transport cũ: [Giao thức Bridge](/vi/gateway/bridge-protocol) (TCP JSONL;
chỉ mang tính lịch sử đối với các Node hiện tại).

macOS cũng có thể chạy ở **chế độ Node**: ứng dụng trên menubar kết nối tới
máy chủ WS của Gateway và cung cấp các lệnh canvas/camera cục bộ của nó như một Node (để
`openclaw nodes …` hoạt động với máy Mac này). Ở chế độ Gateway từ xa, tự động hóa trình duyệt
được xử lý bởi máy chủ Node CLI (`openclaw node run` hoặc
dịch vụ Node đã cài đặt), không phải bởi Node ứng dụng gốc.

Ghi chú:

- Node là **thiết bị ngoại vi**, không phải Gateway. Chúng không chạy dịch vụ Gateway.
- Tin nhắn Telegram/WhatsApp/v.v. đến **Gateway**, không đến Node.
- Runbook khắc phục sự cố: [/nodes/troubleshooting](/vi/nodes/troubleshooting)

## Ghép đôi + trạng thái

**Node WS dùng ghép đôi thiết bị.** Node trình bày danh tính thiết bị trong lúc `connect`; Gateway
tạo yêu cầu ghép đôi thiết bị cho `role: node`. Phê duyệt qua CLI thiết bị (hoặc UI).

CLI nhanh:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Nếu một Node thử lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu
đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại
`openclaw devices list` trước khi phê duyệt.

Ghi chú:

- `nodes status` đánh dấu một Node là **đã ghép đôi** khi vai trò ghép đôi thiết bị của nó bao gồm `node`.
- Bản ghi ghép đôi thiết bị là hợp đồng vai trò đã phê duyệt bền vững. Việc xoay vòng token
  nằm trong hợp đồng đó; nó không thể nâng cấp một Node đã ghép đôi thành
  một vai trò khác mà phê duyệt ghép đôi chưa từng cấp.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) là kho lưu trữ
  ghép đôi Node riêng do Gateway sở hữu; nó **không** chặn bắt tay `connect` của WS.
- `openclaw nodes remove --node <id|name|ip>` xóa một ghép đôi Node. Với một
  Node dựa trên thiết bị, lệnh này thu hồi vai trò `node` của thiết bị trong `devices/paired.json`
  và ngắt kết nối các phiên có vai trò Node của thiết bị đó — một thiết bị nhiều vai trò vẫn giữ
  hàng của nó và chỉ mất vai trò `node`, còn hàng thiết bị chỉ có Node sẽ bị
  xóa. Lệnh này cũng xóa mọi mục khớp khỏi kho lưu trữ ghép đôi Node riêng do Gateway sở hữu.
  `operator.pairing` có thể xóa các hàng Node không phải operator; một
  trình gọi bằng token thiết bị đang thu hồi vai trò Node của chính nó trên một thiết bị nhiều vai trò
  cũng cần thêm `operator.admin`.
- Phạm vi phê duyệt theo các lệnh được khai báo trong yêu cầu đang chờ:
  - yêu cầu không có lệnh: `operator.pairing`
  - lệnh Node không phải exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Máy chủ Node từ xa (system.run)

Dùng **máy chủ Node** khi Gateway của bạn chạy trên một máy và bạn muốn lệnh
thực thi trên máy khác. Mô hình vẫn nói chuyện với **Gateway**; Gateway
chuyển tiếp các lệnh gọi `exec` tới **máy chủ Node** khi `host=node` được chọn.

### Thành phần nào chạy ở đâu

- **Máy chủ Gateway**: nhận tin nhắn, chạy mô hình, định tuyến các lệnh gọi công cụ.
- **Máy chủ Node**: thực thi `system.run`/`system.which` trên máy Node.
- **Phê duyệt**: được thực thi trên máy chủ Node qua `~/.openclaw/exec-approvals.json`.

Ghi chú phê duyệt:

- Các lần chạy Node dựa trên phê duyệt ràng buộc đúng ngữ cảnh yêu cầu.
- Đối với các lần thực thi tệp shell/runtime trực tiếp, OpenClaw cũng cố gắng ràng buộc một toán hạng
  tệp cục bộ cụ thể và từ chối chạy nếu tệp đó thay đổi trước khi thực thi.
- Nếu OpenClaw không thể xác định đúng một tệp cục bộ cụ thể cho một lệnh interpreter/runtime,
  thực thi dựa trên phê duyệt sẽ bị từ chối thay vì giả vờ có phạm vi runtime đầy đủ. Dùng sandboxing,
  máy chủ riêng, hoặc một danh sách cho phép/quy trình đầy đủ đáng tin cậy rõ ràng cho ngữ nghĩa interpreter rộng hơn.

### Khởi động máy chủ Node (foreground)

Trên máy Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway từ xa qua đường hầm SSH (ràng buộc local loopback)

Nếu Gateway ràng buộc vào loopback (`gateway.bind=loopback`, mặc định trong chế độ cục bộ),
máy chủ Node từ xa không thể kết nối trực tiếp. Tạo một đường hầm SSH và trỏ
máy chủ Node tới đầu cục bộ của đường hầm.

Ví dụ (máy chủ Node -> máy chủ Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Ghi chú:

- `openclaw node run` hỗ trợ xác thực bằng token hoặc mật khẩu.
- Biến môi trường được ưu tiên: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Dự phòng cấu hình là `gateway.auth.token` / `gateway.auth.password`.
- Trong chế độ cục bộ, máy chủ Node cố ý bỏ qua `gateway.remote.token` / `gateway.remote.password`.
- Trong chế độ từ xa, `gateway.remote.token` / `gateway.remote.password` đủ điều kiện theo quy tắc ưu tiên từ xa.
- Nếu các SecretRef `gateway.auth.*` cục bộ đang hoạt động được cấu hình nhưng chưa được phân giải, xác thực máy chủ Node sẽ fail-closed.
- Phân giải xác thực máy chủ Node chỉ tôn trọng các biến môi trường `OPENCLAW_GATEWAY_*`.

### Khởi động máy chủ Node (dịch vụ)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Ghép đôi + đặt tên

Trên máy chủ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Nếu Node thử lại với chi tiết xác thực đã thay đổi, chạy lại `openclaw devices list`
và phê duyệt `requestId` hiện tại.

Tùy chọn đặt tên:

- `--display-name` trên `openclaw node run` / `openclaw node install` (được lưu trong `~/.openclaw/node.json` trên Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (ghi đè từ Gateway).

### Cho phép các lệnh

Phê duyệt exec là **theo từng máy chủ Node**. Thêm mục danh sách cho phép từ Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Phê duyệt nằm trên máy chủ Node tại `~/.openclaw/exec-approvals.json`.

### Trỏ exec tới Node

Cấu hình mặc định (cấu hình Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Hoặc theo từng phiên:

```
/exec host=node security=allowlist node=<id-or-name>
```

Sau khi đặt, mọi lệnh gọi `exec` với `host=node` sẽ chạy trên máy chủ Node (chịu sự chi phối của
danh sách cho phép/phê duyệt Node).

`host=auto` sẽ không tự ngầm chọn Node, nhưng yêu cầu `host=node` rõ ràng theo từng lệnh gọi được cho phép từ `auto`. Nếu bạn muốn exec trên Node là mặc định cho phiên, hãy đặt rõ ràng `tools.exec.host=node` hoặc `/exec host=node ...`.

Liên quan:

- [CLI máy chủ Node](/vi/cli/node)
- [Công cụ exec](/vi/tools/exec)
- [Phê duyệt exec](/vi/tools/exec-approvals)

### Suy luận mô hình cục bộ

Một Node desktop hoặc máy chủ có thể cung cấp các mô hình hỗ trợ chat từ máy chủ Ollama
đang chạy trên Node đó. Agent dùng công cụ `node_inference` của Plugin Ollama để
phát hiện các mô hình đã cài đặt và chạy một prompt có giới hạn từ xa; Gateway
không cần truy cập mạng trực tiếp tới Ollama. Xem [Suy luận Ollama cục bộ trên Node](/vi/providers/ollama#node-local-inference)
để biết cách thiết lập, lọc mô hình và các lệnh xác minh trực tiếp.

## Gọi lệnh

Cấp thấp (RPC thô):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Có các helper cấp cao hơn cho những quy trình phổ biến kiểu “cung cấp cho agent một tệp đính kèm MEDIA”.

## Chính sách lệnh

Lệnh Node phải vượt qua hai cổng trước khi có thể được gọi:

1. Node phải khai báo lệnh trong danh sách WebSocket `connect.commands` của nó.
2. Chính sách nền tảng của Gateway phải cho phép lệnh đã khai báo.

Các Node đồng hành Windows và macOS mặc định cho phép các lệnh đã khai báo an toàn như
`canvas.*`, `camera.list`, `location.get`, và `screen.snapshot`.
Các Node đáng tin cậy quảng bá capability `talk` hoặc khai báo lệnh `talk.*`
cũng mặc định cho phép các lệnh nhấn-để-nói đã khai báo (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), độc lập với nhãn nền tảng.
Các lệnh nguy hiểm hoặc nặng về quyền riêng tư như `camera.snap`, `camera.clip`, và
`screen.record` vẫn yêu cầu opt-in rõ ràng bằng
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` luôn thắng
các mặc định và mục danh sách cho phép bổ sung.

Các lệnh Node do Plugin sở hữu có thể thêm chính sách node-invoke của Gateway. Chính sách đó
chạy sau kiểm tra danh sách cho phép và trước khi chuyển tiếp tới Node, vì vậy RPC thô
`node.invoke`, helper CLI, và công cụ agent chuyên dụng dùng chung cùng ranh giới
quyền của Plugin. Các lệnh Node Plugin nguy hiểm vẫn yêu cầu opt-in rõ ràng bằng
`gateway.nodes.allowCommands`.

Sau khi một Node thay đổi danh sách lệnh đã khai báo, hãy từ chối ghép đôi thiết bị cũ
và phê duyệt yêu cầu mới để Gateway lưu ảnh chụp lệnh đã cập nhật.

## Cấu hình (`openclaw.json`)

Thiết lập liên quan đến Node nằm dưới `gateway.nodes` và `tools.exec`:

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

Dùng đúng tên lệnh Node. `denyCommands` loại bỏ một lệnh ngay cả khi
mặc định nền tảng hoặc mục `allowCommands` sẽ cho phép lệnh đó. Xem
[Tham chiếu cấu hình Gateway](/vi/gateway/configuration-reference#gateway-field-details)
để biết chi tiết trường ghép đôi Node Gateway và chính sách lệnh.

Ghi đè Node exec theo từng agent:

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

Nếu Node đang hiển thị Canvas (WebView), `canvas.snapshot` trả về `{ format, base64 }`.

Helper CLI (ghi vào tệp tạm và in đường dẫn đã lưu):

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

- `canvas present` chấp nhận URL hoặc đường dẫn tệp cục bộ (`--target`), cộng với `--x/--y/--width/--height` tùy chọn để định vị.
- `canvas eval` chấp nhận JS inline (`--js`) hoặc một đối số vị trí.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Ghi chú:

- Các Node di động dùng một trang A2UI đi kèm do ứng dụng sở hữu để hiển thị có hỗ trợ hành động.
- Chỉ hỗ trợ A2UI v0.8 JSONL (v0.9/createSurface bị từ chối).
- iOS và Android hiển thị các trang Gateway Canvas từ xa, nhưng hành động nút A2UI chỉ được gửi từ trang A2UI đi kèm do ứng dụng sở hữu. Các trang A2UI HTTP/HTTPS do Gateway lưu trữ chỉ có thể hiển thị trên những ứng dụng khách di động đó.

## Ảnh + video (camera của Node)

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

- Node phải ở **tiền cảnh** cho `canvas.*` và `camera.*` (các lệnh gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`).
- Thời lượng đoạn video bị giới hạn (hiện tại `<= 60s`) để tránh payload base64 quá lớn.
- Android sẽ nhắc cấp quyền `CAMERA`/`RECORD_AUDIO` khi có thể; quyền bị từ chối sẽ lỗi với `*_PERMISSION_REQUIRED`.

## Ghi màn hình (Node)

Các Node được hỗ trợ cung cấp `screen.record` (mp4). Ví dụ:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Ghi chú:

- Tính khả dụng của `screen.record` phụ thuộc vào nền tảng Node.
- Bản ghi màn hình bị giới hạn ở `<= 60s`.
- `--no-audio` tắt ghi âm bằng micrô trên các nền tảng được hỗ trợ.
- Dùng `--screen <index>` để chọn màn hình khi có nhiều màn hình.

## Vị trí (Node)

Node cung cấp `location.get` khi Vị trí được bật trong phần cài đặt.

Trình trợ giúp CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Ghi chú:

- Vị trí **tắt theo mặc định**.
- "Luôn luôn" yêu cầu quyền hệ thống; tìm nạp trong nền là nỗ lực tối đa.
- Phản hồi bao gồm lat/lon, độ chính xác (mét) và dấu thời gian.

## SMS (Node Android)

Node Android có thể cung cấp `sms.send` khi người dùng cấp quyền **SMS** và thiết bị hỗ trợ điện thoại.

Gọi cấp thấp:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Ghi chú:

- Lời nhắc cấp quyền phải được chấp nhận trên thiết bị Android trước khi capability được quảng bá.
- Thiết bị chỉ có Wi-Fi, không có điện thoại, sẽ không quảng bá `sms.send`.

## Lệnh thiết bị Android + dữ liệu cá nhân

Node Android có thể quảng bá thêm các nhóm lệnh khi các capability tương ứng được bật.

Các nhóm có sẵn:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` khi chia sẻ Ứng dụng đã cài đặt được bật trong Cài đặt Android
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
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Ghi chú:

- `device.apps` là tùy chọn bật và mặc định trả về các ứng dụng hiển thị trong launcher.
- Lệnh chuyển động bị chặn theo capability bởi các cảm biến có sẵn.

## Lệnh hệ thống (máy chủ Node / Node Mac)

Node macOS cung cấp `system.run`, `system.notify` và `system.execApprovals.get/set`.
Máy chủ Node không giao diện cung cấp `system.run`, `system.which` và `system.execApprovals.get/set`.

Ví dụ:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Ghi chú:

- `system.run` trả về stdout/stderr/mã thoát trong payload.
- Thực thi shell hiện đi qua công cụ `exec` với `host=node`; `nodes` vẫn là bề mặt RPC trực tiếp cho các lệnh Node rõ ràng.
- `nodes invoke` không cung cấp `system.run` hoặc `system.run.prepare`; chúng chỉ nằm trên đường dẫn exec.
- Đường dẫn exec chuẩn bị một `systemRunPlan` chuẩn trước khi phê duyệt. Sau khi
  phê duyệt được cấp, gateway chuyển tiếp kế hoạch đã lưu đó, không phải bất kỳ
  trường command/cwd/session nào do bên gọi chỉnh sửa sau đó.
- `system.notify` tôn trọng trạng thái quyền thông báo trên ứng dụng macOS.
- Siêu dữ liệu `platform` / `deviceFamily` của Node không nhận diện được dùng danh sách cho phép mặc định bảo thủ, loại trừ `system.run` và `system.which`. Nếu bạn cố ý cần các lệnh đó cho một nền tảng chưa biết, hãy thêm chúng rõ ràng qua `gateway.nodes.allowCommands`.
- `system.run` hỗ trợ `--cwd`, `--env KEY=VAL`, `--command-timeout` và `--needs-screen-recording`.
- Với shell wrapper (`bash|sh|zsh ... -c/-lc`), các giá trị `--env` theo phạm vi yêu cầu được rút gọn thành danh sách cho phép rõ ràng (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Với quyết định luôn cho phép trong chế độ danh sách cho phép, các wrapper điều phối đã biết (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn thực thi bên trong thay vì đường dẫn wrapper. Nếu việc tháo wrapper không an toàn, không có mục danh sách cho phép nào được tự động lưu.
- Trên máy chủ Node Windows ở chế độ danh sách cho phép, các lần chạy shell-wrapper qua `cmd.exe /c` cần phê duyệt (chỉ riêng mục danh sách cho phép không tự động cho phép dạng wrapper).
- `system.notify` hỗ trợ `--priority <passive|active|timeSensitive>` và `--delivery <system|overlay|auto>`.
- Máy chủ Node bỏ qua ghi đè `PATH` và loại bỏ các khóa khởi động/shell nguy hiểm (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Nếu bạn cần thêm mục PATH, hãy cấu hình môi trường dịch vụ máy chủ Node (hoặc cài đặt công cụ vào vị trí tiêu chuẩn) thay vì truyền `PATH` qua `--env`.
- Ở chế độ Node macOS, `system.run` bị kiểm soát bởi phê duyệt exec trong ứng dụng macOS (Settings → Exec approvals).
  Ask/allowlist/full hoạt động giống máy chủ Node không giao diện; lời nhắc bị từ chối trả về `SYSTEM_RUN_DENIED`.
- Trên máy chủ Node không giao diện, `system.run` bị kiểm soát bởi phê duyệt exec (`~/.openclaw/exec-approvals.json`).

## Liên kết Node exec

Khi có nhiều Node, bạn có thể liên kết exec với một Node cụ thể.
Việc này đặt Node mặc định cho `exec host=node` (và có thể được ghi đè theo từng agent).

Mặc định toàn cục:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ghi đè theo từng agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Bỏ đặt để cho phép bất kỳ Node nào:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Bản đồ quyền

Node có thể bao gồm bản đồ `permissions` trong `node.list` / `node.describe`, được khóa theo tên quyền (ví dụ `screenRecording`, `accessibility`) với giá trị boolean (`true` = đã cấp).

## Máy chủ Node không giao diện (đa nền tảng)

OpenClaw có thể chạy một **máy chủ Node không giao diện** (không UI) kết nối tới Gateway
WebSocket và cung cấp `system.run` / `system.which`. Điều này hữu ích trên Linux/Windows
hoặc để chạy một Node tối thiểu bên cạnh máy chủ.

Khởi động:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Ghi chú:

- Vẫn cần ghép đôi (Gateway sẽ hiển thị lời nhắc ghép đôi thiết bị).
- Máy chủ Node lưu id Node, token, tên hiển thị và thông tin kết nối gateway trong `~/.openclaw/node.json`.
- Phê duyệt exec được thực thi cục bộ qua `~/.openclaw/exec-approvals.json`
  (xem [Phê duyệt exec](/vi/tools/exec-approvals)).
- Trên macOS, máy chủ Node không giao diện mặc định thực thi `system.run` cục bộ. Đặt
  `OPENCLAW_NODE_EXEC_HOST=app` để định tuyến `system.run` qua máy chủ exec của ứng dụng đồng hành; thêm
  `OPENCLAW_NODE_EXEC_FALLBACK=0` để yêu cầu máy chủ ứng dụng và lỗi đóng nếu không khả dụng.
- Thêm `--tls` / `--tls-fingerprint` khi Gateway WS dùng TLS.

## Chế độ Node Mac

- Ứng dụng thanh menu macOS kết nối tới máy chủ Gateway WS dưới dạng Node (vì vậy `openclaw nodes …` hoạt động với máy Mac này).
- Ở chế độ từ xa, ứng dụng mở một đường hầm SSH cho cổng Gateway và kết nối tới `localhost`.
