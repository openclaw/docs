---
read_when:
    - Ghép nối các nút iOS/Android với Gateway
    - Sử dụng Node canvas/camera cho ngữ cảnh tác tử
    - Thêm các lệnh Node mới hoặc trình trợ giúp CLI
summary: 'Node: ghép nối, khả năng, quyền và trình trợ giúp CLI cho khung vẽ/máy ảnh/màn hình/thiết bị/thông báo/hệ thống'
title: Node
x-i18n:
    generated_at: "2026-05-06T09:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

Một **node** là thiết bị đồng hành (macOS/iOS/Android/headless) kết nối với **WebSocket** của Gateway (cùng cổng với operator) bằng `role: "node"` và cung cấp bề mặt lệnh (ví dụ: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) thông qua `node.invoke`. Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol).

Giao thức truyền tải cũ: [Giao thức Bridge](/vi/gateway/bridge-protocol) (TCP JSONL;
chỉ mang tính lịch sử đối với các node hiện tại).

macOS cũng có thể chạy ở **chế độ node**: ứng dụng trên thanh menu kết nối tới
máy chủ WS của Gateway và cung cấp các lệnh canvas/camera cục bộ của nó dưới dạng một node (để
`openclaw nodes …` hoạt động với máy Mac này). Trong chế độ gateway từ xa, tự động hóa trình duyệt
do node host CLI (`openclaw node run` hoặc
dịch vụ node đã cài đặt) xử lý, không phải node ứng dụng gốc.

Ghi chú:

- Node là **thiết bị ngoại vi**, không phải gateway. Chúng không chạy dịch vụ gateway.
- Tin nhắn Telegram/WhatsApp/v.v. đi vào **gateway**, không đi vào node.
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

Nếu một node thử lại với chi tiết xác thực đã thay đổi (role/scopes/public key), yêu cầu
đang chờ trước đó bị thay thế và một `requestId` mới được tạo. Chạy lại
`openclaw devices list` trước khi phê duyệt.

Ghi chú:

- `nodes status` đánh dấu một node là **đã ghép đôi** khi vai trò ghép đôi thiết bị của nó bao gồm `node`.
- Bản ghi ghép đôi thiết bị là hợp đồng vai trò đã phê duyệt có tính bền vững. Việc xoay vòng token
  nằm trong hợp đồng đó; nó không thể nâng cấp một node đã ghép đôi thành
  vai trò khác mà phê duyệt ghép đôi chưa từng cấp.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) là kho ghép đôi node riêng do gateway sở hữu;
  nó **không** chặn bắt tay `connect` của WS.
- `openclaw nodes remove --node <id|name|ip>` xóa các mục lỗi thời khỏi
  kho ghép đôi node riêng do gateway sở hữu đó.
- Phạm vi phê duyệt theo các lệnh đã khai báo của yêu cầu đang chờ:
  - yêu cầu không có lệnh: `operator.pairing`
  - lệnh node không exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Node host từ xa (system.run)

Dùng **node host** khi Gateway của bạn chạy trên một máy và bạn muốn lệnh
thực thi trên máy khác. Mô hình vẫn trao đổi với **gateway**; gateway
chuyển tiếp các lệnh gọi `exec` tới **node host** khi `host=node` được chọn.

### Thành phần nào chạy ở đâu

- **Gateway host**: nhận tin nhắn, chạy mô hình, định tuyến lệnh gọi công cụ.
- **Node host**: thực thi `system.run`/`system.which` trên máy node.
- **Phê duyệt**: được thực thi trên node host qua `~/.openclaw/exec-approvals.json`.

Ghi chú phê duyệt:

- Các lần chạy node dựa trên phê duyệt gắn với đúng ngữ cảnh yêu cầu.
- Với việc thực thi tệp shell/runtime trực tiếp, OpenClaw cũng cố gắng gắn với một toán hạng tệp cục bộ
  cụ thể và từ chối chạy nếu tệp đó thay đổi trước khi thực thi.
- Nếu OpenClaw không thể xác định chính xác một tệp cục bộ cụ thể cho lệnh interpreter/runtime,
  việc thực thi dựa trên phê duyệt sẽ bị từ chối thay vì giả vờ có phạm vi runtime đầy đủ. Hãy dùng sandboxing,
  host riêng, hoặc danh sách cho phép/quy trình đầy đủ đáng tin cậy rõ ràng cho ngữ nghĩa interpreter rộng hơn.

### Khởi động node host (foreground)

Trên máy node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway từ xa qua SSH tunnel (loopback bind)

Nếu Gateway bind vào loopback (`gateway.bind=loopback`, mặc định trong chế độ cục bộ),
node host từ xa không thể kết nối trực tiếp. Tạo SSH tunnel và trỏ
node host tới đầu cục bộ của tunnel.

Ví dụ (node host -> gateway host):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Ghi chú:

- `openclaw node run` hỗ trợ xác thực bằng token hoặc mật khẩu.
- Ưu tiên biến môi trường: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback cấu hình là `gateway.auth.token` / `gateway.auth.password`.
- Trong chế độ cục bộ, node host cố ý bỏ qua `gateway.remote.token` / `gateway.remote.password`.
- Trong chế độ từ xa, `gateway.remote.token` / `gateway.remote.password` đủ điều kiện theo quy tắc thứ tự ưu tiên từ xa.
- Nếu SecretRefs `gateway.auth.*` cục bộ đang hoạt động được cấu hình nhưng không phân giải được, xác thực node-host sẽ đóng theo hướng an toàn.
- Phân giải xác thực node-host chỉ tôn trọng các biến môi trường `OPENCLAW_GATEWAY_*`.

### Khởi động node host (dịch vụ)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Ghép đôi + đặt tên

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
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (ghi đè từ gateway).

### Cho phép các lệnh

Phê duyệt exec là **theo từng node host**. Thêm mục danh sách cho phép từ gateway:

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

Hoặc theo phiên:

```
/exec host=node security=allowlist node=<id-or-name>
```

Sau khi đặt, mọi lệnh gọi `exec` với `host=node` chạy trên node host (tuân theo
danh sách cho phép/phê duyệt của node).

`host=auto` sẽ không tự ngầm chọn node, nhưng yêu cầu `host=node` rõ ràng theo từng lệnh gọi được cho phép từ `auto`. Nếu bạn muốn exec trên node là mặc định cho phiên, hãy đặt rõ ràng `tools.exec.host=node` hoặc `/exec host=node ...`.

Liên quan:

- [CLI node host](/vi/cli/node)
- [Công cụ exec](/vi/tools/exec)
- [Phê duyệt exec](/vi/tools/exec-approvals)

## Gọi lệnh

Cấp thấp (RPC thô):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Có các helper cấp cao hơn cho các quy trình phổ biến "cấp cho agent một tệp đính kèm MEDIA".

## Chính sách lệnh

Lệnh node phải vượt qua hai cổng trước khi có thể được gọi:

1. Node phải khai báo lệnh trong danh sách `connect.commands` WebSocket của nó.
2. Chính sách nền tảng của gateway phải cho phép lệnh đã khai báo.

Các node đồng hành Windows và macOS mặc định cho phép các lệnh đã khai báo an toàn như
`canvas.*`, `camera.list`, `location.get`, và `screen.snapshot`.
Các node đáng tin cậy quảng bá khả năng `talk` hoặc khai báo lệnh `talk.*`
cũng mặc định cho phép các lệnh push-to-talk đã khai báo (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), độc lập với nhãn nền tảng.
Các lệnh nguy hiểm hoặc nặng về quyền riêng tư như `camera.snap`, `camera.clip`, và
`screen.record` vẫn cần opt-in rõ ràng bằng
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` luôn thắng
mặc định và các mục danh sách cho phép bổ sung.

Các lệnh node do Plugin sở hữu có thể thêm chính sách node-invoke của Gateway. Chính sách đó
chạy sau kiểm tra danh sách cho phép và trước khi chuyển tiếp tới node, vì vậy `node.invoke` thô,
helper CLI, và các công cụ agent chuyên dụng dùng chung cùng một ranh giới quyền Plugin.
Các lệnh node Plugin nguy hiểm vẫn cần opt-in `gateway.nodes.allowCommands` rõ ràng.

Sau khi một node thay đổi danh sách lệnh đã khai báo, hãy từ chối ghép đôi thiết bị cũ
và phê duyệt yêu cầu mới để gateway lưu snapshot lệnh đã cập nhật.

## Ảnh chụp màn hình (snapshot canvas)

Nếu node đang hiển thị Canvas (WebView), `canvas.snapshot` trả về `{ format, base64 }`.

Helper CLI (ghi vào tệp tạm và in `MEDIA:<path>`):

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
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Ghi chú:

- Node phải được **đưa ra foreground** cho `canvas.*` và `camera.*` (lệnh gọi background trả về `NODE_BACKGROUND_UNAVAILABLE`).
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
- Dùng `--screen <index>` để chọn màn hình khi có nhiều màn hình.

## Vị trí (node)

Node cung cấp `location.get` khi Location được bật trong cài đặt.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Ghi chú:

- Location **tắt theo mặc định**.
- "Luôn luôn" cần quyền hệ thống; fetch trong nền là nỗ lực tối đa.
- Phản hồi bao gồm lat/lon, độ chính xác (mét), và timestamp.

## SMS (node Android)

Node Android có thể cung cấp `sms.send` khi người dùng cấp quyền **SMS** và thiết bị hỗ trợ telephony.

Gọi cấp thấp:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Ghi chú:

- Lời nhắc cấp quyền phải được chấp nhận trên thiết bị Android trước khi capability được quảng bá.
- Thiết bị chỉ có Wi-Fi, không có telephony, sẽ không quảng bá `sms.send`.

## Lệnh thiết bị Android + dữ liệu cá nhân

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

Ví dụ gọi:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Ghi chú:

- Các lệnh chuyển động được kiểm soát theo khả năng dựa trên các cảm biến sẵn có.

## Lệnh hệ thống (node host / node Mac)

Node macOS cung cấp `system.run`, `system.notify` và `system.execApprovals.get/set`.
Headless node host cung cấp `system.run`, `system.which` và `system.execApprovals.get/set`.

Ví dụ:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Ghi chú:

- `system.run` trả về stdout/stderr/mã thoát trong payload.
- Việc thực thi shell hiện đi qua công cụ `exec` với `host=node`; `nodes` vẫn là bề mặt RPC trực tiếp cho các lệnh node tường minh.
- `nodes invoke` không cung cấp `system.run` hoặc `system.run.prepare`; các lệnh đó chỉ nằm trên đường dẫn exec.
- Đường dẫn exec chuẩn bị một `systemRunPlan` chuẩn tắc trước khi phê duyệt. Sau khi một phê duyệt được cấp, gateway chuyển tiếp kế hoạch đã lưu đó, không phải bất kỳ trường command/cwd/session nào được bên gọi chỉnh sửa sau này.
- `system.notify` tôn trọng trạng thái quyền thông báo trên ứng dụng macOS.
- Siêu dữ liệu node `platform` / `deviceFamily` không được nhận diện dùng allowlist mặc định thận trọng, loại trừ `system.run` và `system.which`. Nếu bạn cố ý cần các lệnh đó cho một nền tảng không xác định, hãy thêm chúng tường minh qua `gateway.nodes.allowCommands`.
- `system.run` hỗ trợ `--cwd`, `--env KEY=VAL`, `--command-timeout` và `--needs-screen-recording`.
- Với các shell wrapper (`bash|sh|zsh ... -c/-lc`), giá trị `--env` theo phạm vi yêu cầu được giảm xuống một allowlist tường minh (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Với quyết định luôn cho phép trong chế độ allowlist, các dispatch wrapper đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sẽ lưu đường dẫn thực thi bên trong thay vì đường dẫn wrapper. Nếu việc gỡ wrapper không an toàn, không mục allowlist nào được tự động lưu.
- Trên Windows node host ở chế độ allowlist, các lần chạy shell-wrapper qua `cmd.exe /c` cần phê duyệt (chỉ riêng mục allowlist không tự động cho phép dạng wrapper).
- `system.notify` hỗ trợ `--priority <passive|active|timeSensitive>` và `--delivery <system|overlay|auto>`.
- Node host bỏ qua ghi đè `PATH` và loại bỏ các khóa khởi động/shell nguy hiểm (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Nếu bạn cần thêm mục PATH, hãy cấu hình môi trường dịch vụ node host (hoặc cài công cụ ở vị trí chuẩn) thay vì truyền `PATH` qua `--env`.
- Trên chế độ node macOS, `system.run` được kiểm soát bởi phê duyệt exec trong ứng dụng macOS (Settings → Exec approvals).
  Ask/allowlist/full hoạt động giống như headless node host; lời nhắc bị từ chối trả về `SYSTEM_RUN_DENIED`.
- Trên headless node host, `system.run` được kiểm soát bởi phê duyệt exec (`~/.openclaw/exec-approvals.json`).

## Liên kết node exec

Khi có nhiều node, bạn có thể liên kết exec với một node cụ thể.
Điều này đặt node mặc định cho `exec host=node` (và có thể được ghi đè theo từng agent).

Mặc định toàn cục:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ghi đè theo từng agent:

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

Node có thể bao gồm một bản đồ `permissions` trong `node.list` / `node.describe`, được lập khóa theo tên quyền (ví dụ: `screenRecording`, `accessibility`) với giá trị boolean (`true` = đã cấp).

## Headless node host (đa nền tảng)

OpenClaw có thể chạy một **headless node host** (không có UI) kết nối tới WebSocket của Gateway và cung cấp `system.run` / `system.which`. Điều này hữu ích trên Linux/Windows hoặc để chạy một node tối thiểu bên cạnh máy chủ.

Khởi động:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Ghi chú:

- Vẫn cần ghép đôi (Gateway sẽ hiển thị lời nhắc ghép đôi thiết bị).
- Node host lưu id node, token, tên hiển thị và thông tin kết nối gateway trong `~/.openclaw/node.json`.
- Phê duyệt exec được thực thi cục bộ qua `~/.openclaw/exec-approvals.json`
  (xem [Phê duyệt exec](/vi/tools/exec-approvals)).
- Trên macOS, headless node host thực thi `system.run` cục bộ theo mặc định. Đặt `OPENCLAW_NODE_EXEC_HOST=app` để định tuyến `system.run` qua companion app exec host; thêm `OPENCLAW_NODE_EXEC_FALLBACK=0` để yêu cầu app host và đóng an toàn nếu nó không khả dụng.
- Thêm `--tls` / `--tls-fingerprint` khi Gateway WS dùng TLS.

## Chế độ node Mac

- Ứng dụng thanh menu macOS kết nối tới máy chủ Gateway WS như một node (vì vậy `openclaw nodes …` hoạt động với máy Mac này).
- Trong chế độ từ xa, ứng dụng mở một SSH tunnel cho cổng Gateway và kết nối tới `localhost`.
