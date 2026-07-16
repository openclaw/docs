---
read_when:
    - Ghép nối các Node iOS/watchOS/Android với Gateway
    - Sử dụng canvas/camera của node làm ngữ cảnh cho tác nhân
    - Thêm lệnh Node hoặc trình trợ giúp CLI mới
summary: 'Node: ghép nối, khả năng, quyền và các trình trợ giúp CLI cho canvas/camera/màn hình/thiết bị/thông báo/hệ thống'
title: Các Node
x-i18n:
    generated_at: "2026-07-16T14:44:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

Một **Node** là thiết bị đồng hành (macOS/iOS/watchOS/Android/không giao diện) kết nối với Gateway bằng `role: "node"` và cung cấp một bề mặt lệnh (ví dụ: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) qua `node.invoke`. Hầu hết các Node sử dụng WebSocket của Gateway trên cổng dành cho người vận hành. Node Apple Watch trực tiếp tùy chọn sử dụng cơ chế thăm dò HTTPS có chữ ký trên cùng cổng đó vì watchOS chặn kết nối mạng cấp thấp dùng chung đối với các ứng dụng thông thường. Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol).

Phương thức truyền tải cũ: [Giao thức cầu nối](/vi/gateway/bridge-protocol) (TCP JSONL; chỉ có ý nghĩa lịch sử đối với các Node hiện tại).

macOS cũng có thể chạy ở **chế độ Node**: ứng dụng trên thanh menu kết nối với máy chủ
WS của Gateway như một Node (do đó `openclaw nodes …` hoạt động với máy Mac này). Ứng dụng
bổ sung các lệnh Canvas, camera, màn hình, thông báo và điều khiển máy tính gốc
vào cùng bề mặt lệnh của máy chủ Node mà `openclaw node run` sử dụng. Không khởi động
Node CLI thứ hai trên máy Mac đó; ứng dụng chạy môi trường thực thi máy chủ Node CLI tương ứng
dưới dạng một tiến trình xử lý nội bộ, đồng thời vẫn là kết nối Gateway và danh tính Node duy nhất.

Node là **thiết bị ngoại vi**, không phải Gateway: chúng không chạy dịch vụ Gateway và thông báo kênh (Telegram, WhatsApp, v.v.) đến Gateway chứ không đến Node.

Cẩm nang khắc phục sự cố: [/nodes/troubleshooting](/vi/nodes/troubleshooting)

## Ghép nối + trạng thái

Node sử dụng **ghép nối thiết bị**. Node trình bày danh tính thiết bị có chữ ký khi kết nối; Gateway tạo yêu cầu ghép nối thiết bị cho `role: node`. Phê duyệt qua CLI thiết bị (hoặc giao diện người dùng). Quy trình thiết lập Apple Watch trực tiếp sử dụng mã thiết lập ngắn hạn, chỉ dành cho Node và do quản trị viên tạo để phê duyệt bề mặt lệnh cố định, ít rủi ro của thiết bị; việc mở rộng khả năng sau đó vẫn cần phê duyệt thông thường.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Các yêu cầu ghép nối đang chờ sẽ hết hạn sau 5 phút kể từ lần thử lại cuối cùng của thiết bị — thiết bị liên tục kết nối lại sẽ duy trì một yêu cầu đang chờ duy nhất (và `requestId`) thay vì tạo lời nhắc mới sau mỗi vài phút; xem [Ghép nối Node](/vi/gateway/pairing) để biết toàn bộ vòng đời yêu cầu/phê duyệt. Nếu Node thử lại với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo — máy khách nhận sự kiện `device.pair.resolved` cho yêu cầu bị thay thế và bạn nên chạy lại `openclaw devices list` trước khi phê duyệt.

- `nodes status` đánh dấu một Node là **đã ghép nối** khi vai trò ghép nối thiết bị của Node bao gồm `node`.
- Máy Mac gốc đang kết nối và có quyền Trợ năng có thể báo cáo hoạt động đầu vào vật lý
  đã được hợp nhất. Gateway đánh dấu máy Mac đủ điều kiện có hoạt động mới nhất là
  `active`, cung cấp cho tác nhân một gợi ý ID Node ổn định và định tuyến cảnh báo kết nối
  Node đến đó trước khi chuyển sang phương án dự phòng có độ trễ. Xem
  [Sự hiện diện của máy tính đang hoạt động](/nodes/presence) để biết cách thiết lập, quyền riêng tư, thời gian và
  cách khắc phục sự cố.
- Bản ghi ghép nối thiết bị là hợp đồng lâu dài về vai trò đã được phê duyệt. Việc xoay vòng token vẫn nằm trong hợp đồng đó; thao tác này không thể nâng cấp một Node đã ghép nối lên vai trò mà quy trình phê duyệt ghép nối chưa từng cấp.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) là kho ghép nối Node riêng biệt do Gateway sở hữu, dùng để theo dõi bề mặt lệnh/khả năng đã được phê duyệt của Node qua các lần kết nối lại. Kho này **không** kiểm soát xác thực phương thức truyền tải — việc đó do ghép nối thiết bị đảm nhiệm.
- `openclaw nodes remove --node <id|name|ip>` xóa một ghép nối Node. Đối với Node dựa trên thiết bị, thao tác này thu hồi vai trò `node` của thiết bị trong kho thiết bị đã ghép nối và ngắt kết nối các phiên có vai trò Node của thiết bị đó: thiết bị có nhiều vai trò vẫn giữ hàng dữ liệu và chỉ mất vai trò `node`, còn hàng dữ liệu của thiết bị chỉ có vai trò Node sẽ bị xóa. Thao tác này cũng xóa mọi mục khớp trong kho ghép nối Node riêng biệt. `operator.pairing` có thể xóa các hàng Node không thuộc người vận hành trên thiết bị khác; tác nhân gọi bằng token thiết bị khi thu hồi vai trò Node của chính mình trên thiết bị có nhiều vai trò còn cần thêm `operator.admin`.
- Phạm vi phê duyệt tuân theo các lệnh được khai báo trong yêu cầu đang chờ:
  - yêu cầu không có lệnh: `operator.pairing`
  - các lệnh Node không thực thi: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Chênh lệch phiên bản và thứ tự nâng cấp

WebSocket của Gateway chấp nhận các máy khách Node đã xác thực trong cửa sổ giao thức N-1.
Do đó, Gateway v4 hiện tại chấp nhận các Node v3 khi kết nối khai báo
cả `role: "node"` và `client.mode: "node"`. Các phiên của người vận hành và giao diện người dùng
vẫn phải sử dụng giao thức hiện tại.

Để nâng cấp đội thiết bị theo từng giai đoạn, hãy nâng cấp Gateway trước rồi nâng cấp từng Node.
Node N-1 vẫn hiển thị và có thể được quản lý trong quá trình nâng cấp; Gateway
ghi nhật ký `legacy node protocol accepted` kèm khuyến nghị nâng cấp. Quy trình ghép nối,
xác thực thiết bị, danh sách lệnh được phép và phê duyệt thực thi vẫn được áp dụng.
Các khả năng và lệnh do Plugin sở hữu vẫn bị ẩn cho đến khi Node nâng cấp lên
giao thức hiện tại. Các Node cũ hơn N-1 cần được nâng cấp qua kênh ngoài trước khi
kết nối lại.

Phương thức truyền tải HTTPS trực tiếp của watchOS yêu cầu phiên bản giao thức hiện tại; hãy cập nhật
ứng dụng đồng hồ cùng với Gateway trước khi bật chế độ trực tiếp.

## Máy chủ Node từ xa (system.run)

Sử dụng **máy chủ Node** khi Gateway chạy trên một máy và bạn muốn thực thi lệnh trên máy khác. Mô hình vẫn giao tiếp với **Gateway**; Gateway chuyển tiếp các lệnh gọi `exec` đến **máy chủ Node** khi `host=node` được chọn.

| Vai trò      | Trách nhiệm                                                        |
| ------------ | ------------------------------------------------------------------ |
| Máy chủ Gateway | Nhận thông báo, chạy mô hình, định tuyến lệnh gọi công cụ.      |
| Máy chủ Node | Thực thi `system.run`/`system.which` trên máy Node.      |
| Phê duyệt    | Được thực thi trên máy chủ Node qua `~/.openclaw/exec-approvals.json`.            |

Lưu ý về phê duyệt:

- Các lần chạy Node dựa trên phê duyệt được liên kết với ngữ cảnh yêu cầu chính xác. Đường dẫn thực thi chuẩn bị một `systemRunPlan` chuẩn hóa trước khi phê duyệt; sau khi được cấp phép, Gateway chuyển tiếp kế hoạch đã lưu đó chứ không phải bất kỳ trường lệnh/cwd/phiên nào mà bên gọi chỉnh sửa sau đó, đồng thời xác thực lại thư mục làm việc trước khi chạy.
- Đối với việc thực thi trực tiếp tệp shell/môi trường thực thi, OpenClaw cũng cố gắng tối đa để liên kết một toán hạng tệp cục bộ cụ thể và từ chối chạy nếu tệp đó thay đổi trước khi thực thi.
- Nếu OpenClaw không thể xác định chính xác một tệp cục bộ cụ thể cho lệnh trình thông dịch/môi trường thực thi, việc thực thi dựa trên phê duyệt sẽ bị từ chối thay vì giả vờ hỗ trợ toàn bộ môi trường thực thi. Hãy sử dụng hộp cát, các máy chủ riêng biệt hoặc danh sách cho phép/quy trình đầy đủ được tin cậy rõ ràng để hỗ trợ ngữ nghĩa trình thông dịch rộng hơn.

### Khởi động máy chủ Node (chạy ở tiền cảnh)

Trên máy Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` cũng chấp nhận `--context-path` (đường dẫn ngữ cảnh WS của Gateway), `--tls`, `--tls-fingerprint <sha256>` và `--node-id` (ghi đè ID phiên bản máy khách cũ; thao tác này không đặt lại ghép nối).

### Gateway từ xa qua đường hầm SSH (liên kết loopback)

Nếu Gateway liên kết với loopback (`gateway.bind=loopback`, mặc định trong chế độ cục bộ), các máy chủ Node từ xa không thể kết nối trực tiếp. Hãy tạo đường hầm SSH và trỏ máy chủ Node đến đầu cục bộ của đường hầm.

Ví dụ (máy chủ Node -> máy chủ Gateway):

```bash
# Thiết bị đầu cuối A (duy trì hoạt động): chuyển tiếp cổng cục bộ 18790 -> Gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Thiết bị đầu cuối B: xuất token Gateway và kết nối qua đường hầm
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Lưu ý:

- `openclaw node run` hỗ trợ xác thực bằng token hoặc mật khẩu.
- Nên ưu tiên các biến môi trường: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Cấu hình dự phòng là `gateway.auth.token` / `gateway.auth.password`.
- Trong chế độ cục bộ, máy chủ Node chủ động bỏ qua `gateway.remote.token` / `gateway.remote.password`.
- Trong chế độ từ xa, `gateway.remote.token` / `gateway.remote.password` đủ điều kiện theo các quy tắc ưu tiên từ xa.
- Nếu các SecretRef `gateway.auth.*` cục bộ đang hoạt động được cấu hình nhưng không thể phân giải, quá trình xác thực máy chủ Node sẽ đóng khi lỗi.
- Quá trình phân giải xác thực máy chủ Node chỉ chấp nhận các biến môi trường `OPENCLAW_GATEWAY_*`.

### Khởi động máy chủ Node (dịch vụ)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` cũng chấp nhận `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (chỉ ID phiên bản máy khách cũ), `--runtime <node>` (mặc định: node) và `--force` để cài đặt lại. `node status`, `node stop` và `node uninstall` cũng khả dụng.

### Ghép nối + đặt tên

Trên máy chủ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Nếu Node thử lại với thông tin xác thực đã thay đổi, hãy chạy lại `openclaw devices list` và phê duyệt `requestId` hiện tại.

Các tùy chọn đặt tên:

- `--display-name` trên `openclaw node run` / `openclaw node install` (được duy trì trong hàng SQLite `node_host_config` dùng chung cùng với ID phiên bản máy khách và siêu dữ liệu kết nối Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (ghi đè Gateway).

### Máy chủ MCP do Node lưu trữ

Cấu hình máy chủ MCP trong `openclaw.json` trên máy Node, không phải trên
Gateway:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

Máy chủ Node không giao diện khởi động các máy chủ này, liệt kê công cụ của chúng và công bố
các bộ mô tả sau khi kết nối. Các lệnh gọi công cụ quay lại Node đó qua
`mcp.tools.call.v1`; Gateway không cần cấu hình MCP tương ứng hoặc Plugin
JS. Đường dẫn v1 do máy chủ Node lưu trữ này không hỗ trợ các máy chủ MCP OAuth.

Các máy chủ Node hiện tại khai báo họ lệnh tích hợp sẵn `mcp.tools.call.v1` trong
lần ghép nối ban đầu ngay cả khi không có máy chủ MCP nào được cấu hình. Node được ghép nối trên
phiên bản OpenClaw cũ hơn có thể yêu cầu nâng cấp bề mặt lệnh một lần sau khi
máy chủ Node được cập nhật. Việc thêm, xóa hoặc lọc máy chủ sau đó không
yêu cầu ghép nối lại vì họ lệnh đã được phê duyệt không thay đổi. Khởi động lại
`openclaw node run` hoặc `openclaw node restart` để áp dụng các thay đổi cấu hình MCP của Node;
máy chủ Node không theo dõi cấu hình này.

Người vận hành Gateway có thể bỏ qua mọi công cụ hiển thị cho tác nhân do các Node đã ghép nối công bố,
bao gồm các công cụ MCP do Node lưu trữ, bằng
`gateway.nodes.pluginTools.enabled: false`. Các quy tắc từ chối lệnh chính xác như
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` cũng chặn việc thực thi.

### Skills do Node lưu trữ

Cài đặt Skills trong thư mục Skills đang hoạt động của OpenClaw trên máy Node,
mặc định là `~/.openclaw/skills`. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` và
`OPENCLAW_CONFIG_PATH` di chuyển hồ sơ đang hoạt động đó. `OPENCLAW_STATE_DIR` được
ưu tiên cho Skills; nếu không, `skills/` nằm bên cạnh đường dẫn do
`openclaw config file` in ra. Máy chủ Node không giao diện công bố các tệp `SKILL.md` hợp lệ
sau khi kết nối và Gateway chỉ thêm chúng vào các ảnh chụp nhanh Skills của tác nhân trong khi
Node đó vẫn kết nối. Tên của mỗi thư mục Skills phải khớp với trường frontmatter `name`
để trình định vị Node trừu tượng ánh xạ đến một mục mà không cần thêm
trường giao thức khác.

Việc ghép cặp vai trò Node ban đầu phê duyệt việc xuất bản skill. Việc thêm, xóa hoặc
thay đổi skill không yêu cầu ghép cặp lại hay thay đổi cấu hình Gateway.
Khởi động lại `openclaw node run` hoặc `openclaw node restart` sau khi thay đổi
các tệp skill của Node; máy chủ Node không theo dõi thư mục skill.

Các mục skill do Node lưu trữ xác định Node của chúng và mang theo vị trí thực thi.
Các tệp skill, đường dẫn tương đối được tham chiếu và tệp nhị phân vẫn nằm trên Node đó.
Tác tử đọc vị trí `node://.../SKILL.md` được quảng bá bằng công cụ
`read` thông thường. `file_fetch` chấp nhận các đường dẫn Node tuyệt đối được người vận hành phê duyệt,
không chấp nhận bộ định vị skill của Node; thay vào đó, các runtime không có công cụ đọc thông thường có thể chạy
`cat SKILL.md` thông qua `exec host=node node=<node-id>` với thư mục
`node://.../skills/<name>` được quảng bá làm `workdir`. Các tệp và tệp nhị phân được tham chiếu
sử dụng cùng đích thực thi và thư mục làm việc. Máy chủ Node phân giải bộ định vị đó dựa trên
thư mục trạng thái OpenClaw đang hoạt động của nó, vì vậy các đường dẫn tương đối được phân giải trên Node
thay vì máy Gateway. Node xuất bản phải có `system.run` đã được phê duyệt,
và chính sách thực thi của tác tử phải cho phép `host=node`; nếu không, skill sẽ không
được đưa vào ảnh chụp nhanh của tác tử đó.

Đặt `nodeHost.skills.enabled: false` trên Node để dừng xuất bản. Người vận hành Gateway
có thể bỏ qua skill từ mọi Node đã ghép cặp bằng
`gateway.nodes.skills.enabled: false`.

### Trạng thái danh tính không giao diện

Node không giao diện lưu giữ ba bản ghi trạng thái riêng biệt:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): ID phiên bản máy khách, tên hiển thị và siêu dữ liệu kết nối Gateway.
- `~/.openclaw/identity/device.json`: cặp khóa thiết bị đã ký và ID thiết bị mật mã được dẫn xuất.
- `~/.openclaw/identity/device-auth.json`: các token xác thực thiết bị đã ghép cặp, được lập khóa theo ID thiết bị mật mã và vai trò.

Đối với Node đã ký, Gateway sử dụng ID thiết bị mật mã để ghép cặp và
định tuyến Node. ID phiên bản máy khách chỉ là siêu dữ liệu kết nối. Do đó, việc thay đổi
`--node-id` hoặc di chuyển một `node.json` đã ngừng sử dụng không đặt lại ghép cặp. Xem
[Trạng thái danh tính và ghép cặp](/vi/cli/node#identity-and-pairing-state) để biết quy trình
thu hồi và ghép cặp lại được hỗ trợ cùng các ghi chú nâng cấp.

### Đưa các lệnh vào danh sách cho phép

Phê duyệt thực thi áp dụng **riêng cho từng máy chủ Node**. Thêm các mục danh sách cho phép từ Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Các phê duyệt nằm trên máy chủ Node tại `~/.openclaw/exec-approvals.json`.

### Chuyển hướng thực thi đến Node

Cấu hình mặc định (cấu hình Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Hoặc theo từng phiên:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Sau khi thiết lập, mọi lệnh gọi `exec` với `host=node` đều chạy trên máy chủ Node (tuân theo danh sách cho phép/phê duyệt của Node).

`host=auto` sẽ không tự động chọn Node, nhưng yêu cầu `host=node` rõ ràng cho từng lệnh gọi được cho phép từ `auto`. Nếu muốn thực thi trên Node là mặc định cho phiên, hãy đặt rõ ràng `tools.exec.host=node` hoặc `/exec host=node ...`.

Liên quan:

- [CLI máy chủ Node](/vi/cli/node)
- [Công cụ thực thi](/vi/tools/exec)
- [Phê duyệt thực thi](/vi/tools/exec-approvals)

### Suy luận mô hình cục bộ

Node máy tính để bàn hoặc máy chủ có thể cung cấp các mô hình có khả năng trò chuyện từ máy chủ Ollama đang chạy trên Node đó. Các tác tử sử dụng công cụ `node_inference` của Plugin Ollama để khám phá các mô hình đã cài đặt và chạy từ xa một lời nhắc có giới hạn; Gateway không cần quyền truy cập mạng trực tiếp vào Ollama. Xem [Suy luận Ollama cục bộ trên Node](/vi/providers/ollama#node-local-inference) để biết cách thiết lập, lọc mô hình và các lệnh xác minh trực tiếp.

### Phiên và bản chép lời Codex

Plugin `codex` chính thức có thể cung cấp các phiên Codex chưa lưu trữ trên
máy chủ Node không giao diện hoặc Node macOS gốc. Việc đăng ký danh mục không còn phụ thuộc
vào `supervision.enabled`; tùy chọn đó kiểm soát các công cụ giám sát dành cho tác tử.
Đặt `sessionCatalog.enabled: false` trong cấu hình Plugin Codex để tắt
các lệnh danh mục của người vận hành và danh mục Node đã ghép cặp mà không tắt
nhà cung cấp hoặc bộ khung.
Plugin vẫn phải hoạt động trên cả hai máy tính, và cài đặt Node vẫn là
sự đồng thuận cục bộ: chỉ bật Gateway không thể đọc trạng thái Codex của máy tính khác.

Node quảng bá các lệnh chỉ đọc có phiên bản
`codex.appServer.threads.list.v1` và
`codex.appServer.thread.turns.list.v1`. Máy chủ Node gốc có sẵn
CLI Codex cũng quảng bá `codex.terminal.resume.v1`. Phê duyệt nâng cấp ghép cặp Node
khi các lệnh đó xuất hiện lần đầu. Gateway gọi chúng thông qua
chính sách Node thông thường của Plugin và cô lập lỗi theo máy chủ.

Các hàng Node đã ghép cặp xuất hiện dưới dạng nhóm **Codex** trong thanh bên phiên thông thường.
Theo mặc định, việc chọn một hàng sẽ mở ngăn Trò chuyện thông thường và đọc bản chép lời được lưu trữ
thông qua các lệnh gọi `thread/turns/list` có giới hạn, phân trang bằng con trỏ
và chiếu đầy đủ mục. Sử dụng trình đơn hàng, tiêu đề trình xem hoặc tùy chọn **Mở phiên Codex/Claude trong** để khởi động `codex resume <thread-id>` trong thiết bị đầu cuối của người vận hành trên máy tính sở hữu phiên. Đường dẫn thiết bị đầu cuối của Node đã ghép cặp là một bộ chuyển tiếp PTY thuộc danh sách cho phép do Plugin Codex sở hữu, không phải khả năng thực thi lệnh Node tùy ý.

Bộ chuyển tiếp không cung cấp đầy đủ các hợp đồng tiếp tục của bộ khung OpenClaw và quyền sở hữu lưu trữ. Vì vậy, **Tiếp tục** và **Lưu trữ** không khả dụng cho các hàng từ xa. Trên máy tính Gateway, các hàng đã lưu và đang nhàn rỗi
có thể bắt đầu một nhánh Trò chuyện riêng biệt bị khóa theo mô hình. Chỉ có thể lưu trữ một trong hai
sau khi người vận hành xác nhận không có máy khách Codex nào khác đang sử dụng; hoạt động trực tiếp của
một hàng đã lưu vẫn không xác định. Các hàng đang hoạt động không thể tạo nhánh hoặc lưu trữ.

Xem [Giám sát phiên Codex](/vi/plugins/codex-supervision) để biết cách thiết lập,
phân trang, tiếp tục cục bộ và ranh giới bảo mật siêu dữ liệu.

### Phiên và bản chép lời Claude

Plugin `anthropic` đi kèm mặc định khám phá các phiên Claude CLI và Claude
Desktop chưa lưu trữ trên Gateway và các Node đã ghép cặp. Đặt
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` để tắt
các lệnh danh mục của người vận hành và danh mục Node đã ghép cặp mà không tắt các mô hình Anthropic
hoặc phần phụ trợ Claude CLI.
Node ứng dụng macOS từ xa quảng bá
`anthropic.claude.sessions.list.v1` và `anthropic.claude.sessions.read.v1`
khi Plugin Anthropic được bật và `~/.claude/projects/` tồn tại. Phê duyệt
nâng cấp ghép cặp Node khi các lệnh đó xuất hiện lần đầu.

Máy chủ Node gốc có sẵn Claude CLI cũng quảng bá
`anthropic.claude.terminal.resume.v1`. Các hàng CLI và Desktop đủ điều kiện có thể mở
`claude --resume <session-id>` trong thiết bị đầu cuối của người vận hành trên máy chủ sở hữu chúng.
Đây là việc tiếp quản phiên gốc; không giống việc tiếp nhận của OpenClaw, thao tác này không
phân nhánh phiên Claude trước.

Danh mục kết hợp các bản ghi chỉ mục dự án Claude CLI hợp lệ với một tiền tố
siêu dữ liệu có giới hạn từ các tệp JSONL `sdk-cli` hiện tại. Siêu dữ liệu cục bộ của Claude Desktop
cung cấp tiêu đề Desktop và trạng thái lưu trữ. Siêu dữ liệu Desktop được ưu tiên khi
cả hai nguồn cùng tham chiếu đến một ID phiên Claude Code; các bản chép lời chỉ có trên CLI
vẫn hiển thị vì CLI không có cờ lưu trữ. Việc đọc bản chép lời sử dụng con trỏ
độ lệch byte mờ và đọc tệp ngược có giới hạn, vì vậy việc chọn một
phiên lớn hoặc tải một trang cũ hơn không đọc toàn bộ lịch sử JSONL vào một
phản hồi Gateway.

Các lệnh liệt kê và đọc là chỉ đọc. Chúng chỉ cung cấp siêu dữ liệu danh mục và nội dung bản chép lời
thông qua các phương thức `sessions.catalog.list` và
`sessions.catalog.read` chung cho một kết nối người vận hành đã xác thực có
`operator.write`. Một hàng Claude CLI cục bộ trên Gateway có thể được tiếp nhận từ trình soạn
Trò chuyện thông thường: OpenClaw nhập lịch sử hiển thị có giới hạn, tiếp tục bằng
`--fork-session` ở lượt đầu tiên và giữ nguyên bản chép lời nguồn.

Máy chủ Node không giao diện có thể chọn tham gia cùng quy trình tiếp tục:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node chỉ quảng bá `agent.cli.claude.run.v1` khi cài đặt cục bộ của Node này
được bật và tệp thực thi `claude` được phân giải trên Node đó. Gateway không thể
bật từ xa. Lệnh cũng đi qua chính sách phê duyệt thực thi hiện có của Node.
Khi cả ba lệnh Claude được quảng bá và được chính sách lệnh Node của Gateway
cho phép, một hàng Claude CLI trên Node đó có thể được tiếp tục: OpenClaw nhập
lịch sử có giới hạn, liên kết phiên đã tiếp nhận với Node và thư mục làm việc do danh mục báo cáo,
rồi chạy từng lượt `claude -p` một lần tại đó. Lượt đầu tiên vẫn sử dụng
`--fork-session`, giữ nguyên bản chép lời nguồn.

Các lượt chạy trên Node sử dụng mặc định Claude của Node. Trong v1, chúng không nhận được
cấu hình MCP vòng lặp Gateway hoặc Plugin skill Gateway, không thể khởi tạo lại từ
bản chép lời Gateway và từ chối tệp đính kèm cùng hình ảnh. Các hàng Claude Desktop và
Node không quảng bá lệnh chạy vẫn chỉ có thể xem. Node ứng dụng macOS
chưa quảng bá lệnh này, vì vậy các hàng của nó vẫn chỉ có thể xem.

Xem [Anthropic: Phiên Claude trên nhiều máy tính](/vi/providers/anthropic#claude-sessions-across-computers)
để biết hành vi của Giao diện điều khiển và các nguồn lưu trữ.

### Phiên OpenCode và Pi

Các Plugin OpenCode và ACPX đi kèm cũng khám phá danh mục phiên gốc chỉ đọc
trên Gateway và các Node đã ghép cặp. Node quảng bá
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` khi CLI `opencode`
được cài đặt, và `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
khi thư mục phiên của Pi tồn tại. Phê duyệt nâng cấp ghép cặp Node khi các
lệnh mới xuất hiện lần đầu. Khi CLI tương ứng cũng khả dụng, Node bổ sung
`opencode.terminal.resume.v1` hoặc `acpx.pi.terminal.resume.v1`; trình đơn hàng
và tiêu đề trình xem hiện có sau đó có thể mở lại phiên đã chọn trong thiết bị đầu cuối
sở hữu nó bằng `opencode --session <id>` hoặc `pi --session <id>`.

OpenCode đọc thông qua bề mặt JSON/xuất chính thức của CLI. Pi đọc kho phiên
JSONL được ghi lại trong tài liệu, bao gồm các thư mục phiên `settings.json`
theo dự án và toàn cục cùng các giá trị ghi đè `PI_CODING_AGENT_DIR` và
`PI_CODING_AGENT_SESSION_DIR`. Cả hai danh mục đều được bật theo mặc định;
tắt chúng trong Giao diện web tại **Config > Plugins**.

Việc tiếp tục trong thiết bị đầu cuối sử dụng thư mục làm việc được lưu của phiên và cùng
bộ chuyển tiếp PTY song công thuộc danh sách cho phép như Codex và Claude. Nó không cung cấp
khả năng thực thi lệnh Node tùy ý.

### Tải tệp lên thiết bị đầu cuối

Giao diện điều khiển có thể kéo tệp vào thiết bị đầu cuối Node đã ghép cặp đang mở. Máy chủ Node gốc quảng bá lệnh chỉ dành cho quản trị viên `terminal.upload`; phê duyệt nâng cấp ghép cặp khi lệnh này xuất hiện lần đầu. Mỗi tệp bị giới hạn ở 16 MiB, được lưu tạm trong một thư mục tạm thời riêng tư trên Node đó và được trả về thiết bị đầu cuối dưới dạng đường dẫn được đặt trong dấu nháy an toàn cho shell mà không thực thi.

Việc chèn đường dẫn hỗ trợ PowerShell, `cmd.exe` và các shell POSIX được nhận dạng (`sh`, Bash, Dash, Ash, Ksh, Zsh và Fish), bao gồm Git Bash trên Windows. Các ghi đè shell khác bị từ chối vì không thể suy luận quy tắc trích dẫn của chúng một cách an toàn; hãy chạy máy chủ Node bên trong WSL để có đường dẫn WSL gốc. Các đường dẫn `cmd.exe` chứa `%` hoặc `!` cũng bị từ chối vì shell đó mở rộng các ký tự này ngay cả bên trong dấu ngoặc kép.

## Gọi lệnh

Cấp thấp (RPC thô):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` chặn `system.run` và `system.run.prepare`; các lệnh đó chỉ chạy thông qua công cụ `exec` với `host=node` (xem ở trên). Có các trình trợ giúp cấp cao hơn cho những quy trình phổ biến "cung cấp cho tác tử một tệp đính kèm MEDIA" (canvas, camera, màn hình, vị trí, bên dưới).

Các lệnh Node truyền phát chạy dài sử dụng các sự kiện `node.invoke.progress`
có tính bổ sung. Mỗi sự kiện mang ID lời gọi, số thứ tự bắt đầu từ 0 và một
đoạn văn bản UTF-8 có kích thước giới hạn; Gateway sắp xếp các đoạn trước khi chuyển chúng đến
bên gọi. `node.invoke.result` hiện có vẫn là phản hồi kết thúc duy nhất.
Bên gọi truyền phát có thể đặt thời hạn không hoạt động, bắt đầu từ sự kiện tiến trình
đầu tiên và được đặt lại sau các tiến trình tiếp theo, trong khi vẫn duy trì thời gian chờ cứng
riêng của lời gọi trong quá trình phê duyệt và thực thi. Kết quả, thời gian chờ cứng,
thời gian chờ không hoạt động và việc Node ngắt kết nối đều loại bỏ trạng thái luồng đang chờ.
Việc bên gọi hủy sẽ phát `node.invoke.cancel`; sau đó máy chủ Node
chấm dứt cây tiến trình tương ứng. Các lệnh yêu cầu/phản hồi hiện có không thay đổi.

## Chính sách lệnh

Các lệnh Node phải vượt qua hai cổng kiểm tra trước khi có thể được gọi:

1. Node phải khai báo lệnh trong siêu dữ liệu kết nối đã xác thực của nó (`connect.commands`).
2. Danh sách cho phép của Gateway, được suy ra từ nền tảng và phê duyệt, phải bao gồm lệnh đã khai báo.

Danh sách cho phép mặc định theo nền tảng (trước các giá trị mặc định của Plugin và các ghi đè `allowCommands`/`denyCommands`):

| Nền tảng | Các lệnh được cho phép theo mặc định                                                                                                                                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (các lệnh máy chủ Node như `system.run` chịu sự kiểm soát phê duyệt, xem bên dưới)                                                                                                                                                                                                                       |

Các hàng này mô tả giới hạn trên của chính sách Gateway, không phải các lệnh được mọi ứng dụng Node triển khai. Một lệnh chỉ có thể sử dụng khi Node đang kết nối cũng khai báo lệnh đó. Cụ thể, ứng dụng macOS hiện tại không khai báo các nhóm thiết bị và dữ liệu cá nhân được liệt kê trong hàng chính sách macOS.

Các lệnh `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) là giá trị mặc định của Plugin trên iOS, Android, macOS, Windows, Linux và các nền tảng không xác định. Các Node Linux chỉ khai báo chúng khi có socket Canvas cục bộ của ứng dụng máy tính. Tất cả lệnh Canvas đều bị giới hạn ở tiền cảnh trên iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` và `talk.ptt.once` được cho phép theo mặc định đối với bất kỳ Node nào quảng bá khả năng `talk` hoặc khai báo các lệnh `talk.*`, không phụ thuộc vào nhãn nền tảng.

Các lệnh máy chủ máy tính (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` và `screen.snapshot` trên macOS/Windows) không thuộc bảng mặc định tĩnh theo nền tảng ở trên. Chúng trở nên khả dụng sau khi người vận hành phê duyệt yêu cầu ghép nối khai báo các lệnh đó; sau đó, tập lệnh đã được phê duyệt của Node sẽ duy trì chúng trong những lần kết nối lại.

Các lệnh nguy hiểm hoặc liên quan nhiều đến quyền riêng tư vẫn yêu cầu lựa chọn tham gia rõ ràng bằng `gateway.nodes.allowCommands`, ngay cả khi Node khai báo chúng: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` luôn được ưu tiên hơn các giá trị mặc định và mục bổ sung trong danh sách cho phép. Xem [bản tóm tắt HealthKit](/platforms/ios-healthkit) để biết cổng đồng ý trên iPhone và [Sử dụng máy tính](/vi/nodes/computer-use) để biết các cổng bổ sung về macOS, chính sách công cụ và kích hoạt đối với đầu vào máy tính.

Các lệnh Node do Plugin sở hữu có thể thêm chính sách gọi Node của Gateway. Chính sách đó chạy sau bước kiểm tra danh sách cho phép và trước khi chuyển tiếp đến Node, vì vậy `node.invoke` thô, các trình trợ giúp CLI và công cụ chuyên dụng dành cho tác tử đều dùng chung ranh giới quyền của Plugin. Các lệnh Node nguy hiểm của Plugin vẫn yêu cầu lựa chọn tham gia `gateway.nodes.allowCommands` rõ ràng.

Sau khi Node thay đổi danh sách lệnh đã khai báo, hãy từ chối ghép nối thiết bị cũ và phê duyệt yêu cầu mới để Gateway lưu ảnh chụp nhanh lệnh đã cập nhật.

## Cấu hình (`openclaw.json`)

Các thiết lập liên quan đến Node nằm trong `gateway.nodes` và `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Tự động phê duyệt lần ghép nối Node đầu tiên từ các mạng tin cậy (danh sách CIDR).
      // Bị vô hiệu hóa khi không được đặt. Chỉ áp dụng cho các yêu cầu role:node lần đầu
      // không có phạm vi được yêu cầu; không tự động phê duyệt nâng cấp.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Tự động phê duyệt đã xác minh qua SSH (mặc định: được bật). Phê duyệt lần ghép nối
        // Node đầu tiên khi khóa thiết bị đọc lại qua SSH khớp chính xác.
        sshVerify: true,
      },
      // Tin cậy các công cụ Plugin hiển thị với tác tử do các Node đã ghép nối công bố (mặc định: true).
      pluginTools: {
        enabled: true,
      },
      // Cho phép sử dụng các lệnh Node nguy hiểm/liên quan nhiều đến quyền riêng tư (camera.snap, v.v.).
      allowCommands: ["camera.snap", "screen.record"],
      // Chặn chính xác tên lệnh ngay cả khi giá trị mặc định hoặc allowCommands bao gồm chúng.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Máy chủ exec mặc định: "node" định tuyến tất cả lời gọi exec đến một Node đã ghép nối.
      host: "node",
      // Chế độ bảo mật cho exec trên Node: chỉ cho phép các lệnh đã được phê duyệt/nằm trong danh sách cho phép.
      security: "allowlist",
      // Ghim exec vào một Node cụ thể (ID hoặc tên). Bỏ qua để cho phép bất kỳ Node nào.
      node: "build-node",
    },
  },
}
```

Sử dụng chính xác tên lệnh Node. `denyCommands` loại bỏ một lệnh ngay cả khi giá trị mặc định của nền tảng hoặc mục `allowCommands` lẽ ra cho phép lệnh đó. Theo mặc định, các Node đã ghép nối có thể công bố bộ mô tả công cụ Plugin hiển thị với tác tử, nhưng lệnh của từng bộ mô tả vẫn phải nằm trong bề mặt lệnh đã được phê duyệt của Node. Đặt `gateway.nodes.pluginTools.enabled: false` để bỏ qua tất cả các bộ mô tả như vậy. Xem [tham chiếu cấu hình Gateway](/vi/gateway/configuration-reference#gateway) để biết chi tiết về các trường ghép nối Node và chính sách lệnh của Gateway.

Ghi đè Node thực thi theo từng tác tử:

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

## Ảnh chụp màn hình (ảnh chụp nhanh Canvas)

Nếu Node đang hiển thị Canvas (WebView), `canvas.snapshot` trả về `{ format, base64 }`.

Trình trợ giúp CLI (ghi vào tệp tạm thời và in đường dẫn đã lưu):

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

- `canvas present` chấp nhận URL hoặc đường dẫn tệp cục bộ (`--target`) trên các Node hỗ trợ đường dẫn cục bộ, cùng với `--x/--y/--width/--height` tùy chọn để định vị. Canvas trên Linux chấp nhận URL HTTP(S) hoặc trình kết xuất A2UI đi kèm.
- `canvas eval` chấp nhận JS nội tuyến (`--js`) hoặc một đối số vị trí.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Ghi chú:

- Các Node di động và máy tính Linux sử dụng một trang A2UI đi kèm do ứng dụng sở hữu để kết xuất có hỗ trợ hành động.
- Chỉ hỗ trợ A2UI v0.8 JSONL (v0.9/createSurface bị từ chối).
- iOS và Android kết xuất các trang Canvas từ xa của Gateway, nhưng hành động nút A2UI chỉ được điều phối từ trang A2UI đi kèm do ứng dụng sở hữu. Các trang A2UI HTTP/HTTPS do Gateway lưu trữ chỉ dùng để kết xuất trên các máy khách di động đó.
- macOS có thể điều phối hành động từ đúng trang A2UI Gateway theo phạm vi khả năng mà ứng dụng đã chọn. Các trang HTTP/HTTPS khác vẫn chỉ dùng để kết xuất.
- Linux chỉ điều phối hành động từ trang A2UI đi kèm. Các trang HTTP/HTTPS khác vẫn chỉ dùng để kết xuất, và Node Linux không giao diện không có ứng dụng máy tính sẽ không quảng bá Canvas.

## Ảnh + video (camera của Node)

Ảnh (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # mặc định: cả hai hướng camera (2 dòng MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Đoạn video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Ghi chú:

- Node phải ở **tiền cảnh** đối với `canvas.*` và `camera.*` (các lời gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`).
- Các Node giới hạn thời lượng đoạn video để giữ tải trọng base64 ở mức có thể quản lý (xem [Chụp bằng camera](/vi/nodes/camera) để biết giới hạn chính xác theo từng nền tảng). Công cụ tác tử `nodes` còn giới hạn `durationMs` được yêu cầu ở mức 300000 (5 phút) trước khi chuyển tiếp lời gọi; chính Node thực thi giới hạn chặt hơn.
- Android sẽ yêu cầu quyền `CAMERA`/`RECORD_AUDIO` khi có thể; quyền bị từ chối sẽ thất bại với `*_PERMISSION_REQUIRED`.

## Quay màn hình (Node)

Các Node được hỗ trợ cung cấp `screen.record` (mp4). Ví dụ:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Ghi chú:

- Tính khả dụng của `screen.record` phụ thuộc vào nền tảng của node.
- Công cụ agent `nodes` giới hạn `durationMs` được yêu cầu ở mức 300000 (5 phút); node có thể áp dụng giới hạn chặt chẽ hơn để giới hạn tải trọng trả về.
- `--no-audio` vô hiệu hóa việc thu âm micrô trên các nền tảng được hỗ trợ.
- Dùng `--screen <index>` để chọn màn hình khi có nhiều màn hình (0 = chính).

## Vị trí (node)

Các node cung cấp `location.get` khi Vị trí được bật trong phần cài đặt.

Trình hỗ trợ CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Lưu ý:

- Vị trí **tắt theo mặc định**.
- "Luôn luôn" yêu cầu quyền hệ thống; việc truy xuất trong nền được thực hiện theo khả năng tốt nhất.
- Phản hồi bao gồm vĩ độ/kinh độ, độ chính xác (mét) và dấu thời gian.
- Cấu trúc đầy đủ của tham số/phản hồi và mã lỗi: [Lệnh vị trí](/vi/nodes/location-command).

## SMS (node Android)

Các node Android có thể cung cấp `sms.send` và `sms.search` khi người dùng cấp quyền **SMS** và thiết bị hỗ trợ điện thoại. Theo mặc định, cả hai lệnh đều được coi là nguy hiểm: người vận hành Gateway cũng phải thêm chúng vào `gateway.nodes.allowCommands` trước khi có thể gọi (xem [Chính sách lệnh](#command-policy)).

Đối với tìm kiếm SMS chỉ đọc, hãy bật rõ ràng trong `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Chỉ thêm riêng `sms.send` khi node cũng cần có khả năng gửi tin nhắn. Quyền Android và việc ủy quyền lệnh của Gateway là độc lập; việc cấp quyền trên điện thoại không chỉnh sửa chính sách Gateway.

Lệnh gọi cấp thấp:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Lưu ý:

- `sms.search` có thể được khai báo trước khi `READ_SMS` được cấp để một lệnh gọi có thể trả về thông tin chẩn đoán quyền; việc đọc tin nhắn vẫn yêu cầu quyền Android đó.
- Các thiết bị chỉ có Wi-Fi và không hỗ trợ điện thoại sẽ không công bố `sms.send`.
- Lỗi `requires explicit gateway.nodes.allowCommands opt-in` có nghĩa là điện thoại đã khai báo lệnh nhưng người vận hành Gateway chưa ủy quyền cho lệnh đó.

## Các lệnh dữ liệu thiết bị và cá nhân

Các node iOS và Android mặc định công bố một số lệnh dữ liệu chỉ đọc (xem bảng [Chính sách lệnh](#command-policy)); Android còn cung cấp thêm một nhóm lớn hơn, được kiểm soát bởi các cài đặt riêng trong ứng dụng.

Các nhóm có sẵn:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — chỉ Android; `device.apps` yêu cầu bật chia sẻ Ứng dụng đã cài đặt trong Cài đặt Android và mặc định trả về các ứng dụng hiển thị trong trình khởi chạy.
- `notifications.list`, `notifications.actions` — chỉ Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (mặc định chỉ đọc); `contacts.add` nguy hiểm và cần `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (mặc định chỉ đọc); `calendar.add` nguy hiểm và cần `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (mặc định chỉ đọc); `reminders.add` nguy hiểm và cần `gateway.nodes.allowCommands`.
- `callLog.search` — chỉ Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; được kiểm soát theo khả năng bởi các cảm biến hiện có.

Ví dụ lệnh gọi:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Lệnh hệ thống (máy chủ node / node Mac)

Node macOS cung cấp `system.run`, `system.which`, `system.notify` và `system.execApprovals.get/set`. Máy chủ node không giao diện cung cấp `system.run.prepare`, `system.run`, `system.which` và `system.execApprovals.get/set`.

Ví dụ:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Lưu ý:

- `system.run` trả về stdout/stderr/mã thoát trong tải trọng.
- Việc thực thi shell hiện đi qua công cụ `exec` với `host=node`; `nodes` vẫn là bề mặt RPC trực tiếp dành cho các lệnh node rõ ràng.
- `nodes invoke` không cung cấp `system.run` hoặc `system.run.prepare`; chúng chỉ tồn tại trên đường dẫn exec.
- Đường dẫn exec chuẩn bị một `systemRunPlan` chuẩn tắc trước khi phê duyệt. Sau khi được phê duyệt, gateway chuyển tiếp kế hoạch đã lưu đó, không phải bất kỳ trường lệnh/cwd/phiên nào bị bên gọi chỉnh sửa sau này.
- `system.notify` tuân theo trạng thái quyền thông báo trên ứng dụng macOS; hỗ trợ `--priority <passive|active|timeSensitive>` và `--delivery <system|overlay|auto>`.
- Siêu dữ liệu `platform` / `deviceFamily` không được nhận dạng của node sử dụng danh sách cho phép mặc định thận trọng, loại trừ `system.run` và `system.which`. Nếu chủ ý cần các lệnh đó cho một nền tảng không xác định, hãy thêm chúng rõ ràng qua `gateway.nodes.allowCommands`.
- `system.run` hỗ trợ `--cwd`, `--env KEY=VAL`, `--command-timeout` và `--needs-screen-recording`.
- Đối với các trình bao bọc shell (`bash|sh|zsh ... -c/-lc`), các giá trị `--env` theo phạm vi yêu cầu được rút gọn thành một danh sách cho phép rõ ràng (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Đối với các quyết định luôn cho phép trong chế độ danh sách cho phép, các trình bao bọc điều phối đã biết (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn tệp thực thi bên trong thay vì đường dẫn trình bao bọc. Nếu việc gỡ bao bọc không an toàn, không có mục danh sách cho phép nào được tự động lưu.
- Trên các máy chủ node Windows ở chế độ danh sách cho phép, các lần chạy trình bao bọc shell qua `cmd.exe /c` yêu cầu phê duyệt (chỉ mục trong danh sách cho phép không tự động cho phép dạng trình bao bọc).
- Các máy chủ node bỏ qua các giá trị ghi đè `PATH` trong `--env` và loại bỏ một tập hợp lớn các biến khởi động trình thông dịch/shell được duy trì (ví dụ `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) trước khi chạy lệnh. Nếu cần thêm mục PATH, hãy cấu hình môi trường dịch vụ của máy chủ node (hoặc cài đặt công cụ ở các vị trí tiêu chuẩn) thay vì truyền `PATH` qua `--env`.
- Trong chế độ node macOS, `system.run` được kiểm soát bởi phê duyệt exec trong ứng dụng macOS (Settings → Exec approvals). Ask/allowlist/full hoạt động giống máy chủ node không giao diện; các lời nhắc bị từ chối trả về `SYSTEM_RUN_DENIED`.
- Trên máy chủ node không giao diện, `system.run` được kiểm soát bởi phê duyệt exec (`~/.openclaw/exec-approvals.json`); riêng trên macOS, xem các biến môi trường định tuyến máy chủ exec trong phần [Máy chủ node không giao diện](#headless-node-host-cross-platform) bên dưới.

## Liên kết node exec

Khi có nhiều node, bạn có thể liên kết exec với một node cụ thể. Thao tác này đặt node mặc định cho `exec host=node` (và có thể được ghi đè theo từng agent).

Mặc định toàn cục:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ghi đè theo agent:

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

Các node có thể bao gồm một bản đồ `permissions` trong `node.list` / `node.describe`, với khóa là tên quyền (ví dụ `screenRecording`, `accessibility`, `location`) và giá trị boolean (`true` = đã cấp).

## Máy chủ node không giao diện (đa nền tảng)

OpenClaw có thể chạy một **máy chủ node không giao diện** (không có giao diện người dùng), kết nối với WebSocket của Gateway và cung cấp `system.run` / `system.which`. Điều này hữu ích trên Linux/Windows hoặc khi chạy một node tối giản cùng với máy chủ.

Khởi động:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Lưu ý:

- Vẫn cần ghép nối (Gateway sẽ hiển thị lời nhắc ghép nối thiết bị).
- Siêu dữ liệu phiên bản máy khách, danh tính thiết bị đã ký và xác thực ghép nối sử dụng các tệp riêng biệt; xem [Trạng thái danh tính không giao diện](#headless-identity-state).
- Phê duyệt exec được thực thi cục bộ qua `~/.openclaw/exec-approvals.json` (xem [Phê duyệt exec](/vi/tools/exec-approvals)).
- Trên macOS, máy chủ node không giao diện mặc định thực thi `system.run` cục bộ. Đặt `OPENCLAW_NODE_EXEC_HOST=app` để định tuyến `system.run` qua máy chủ exec của ứng dụng đồng hành; thêm `OPENCLAW_NODE_EXEC_FALLBACK=0` để bắt buộc sử dụng máy chủ ứng dụng và từ chối an toàn nếu máy chủ đó không khả dụng.
- Thêm `--tls` / `--tls-fingerprint` khi WS của Gateway sử dụng TLS.

## Chế độ node Mac

- Ứng dụng thanh menu macOS kết nối với máy chủ WS của Gateway dưới dạng một node (do đó `openclaw nodes …` hoạt động với máy Mac này).
- Trong chế độ từ xa, ứng dụng mở một đường hầm SSH cho cổng Gateway và kết nối với `localhost`.
