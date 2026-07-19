---
read_when:
    - Ghép nối các Node iOS/watchOS/Android với Gateway
    - Sử dụng canvas/camera của Node làm ngữ cảnh cho agent
    - Thêm lệnh Node hoặc trình trợ giúp CLI mới
summary: 'Node: ghép đôi, khả năng, quyền và các trình hỗ trợ CLI cho canvas/camera/màn hình/thiết bị/thông báo/hệ thống'
title: Các Node
x-i18n:
    generated_at: "2026-07-19T05:49:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0789bd1f9a855285eab4916a03a347308540e82ea6f3ae26c3653ddf8a4435e8
    source_path: nodes/index.md
    workflow: 16
---

Một **node** là thiết bị đồng hành (macOS/iOS/watchOS/Android/headless) kết nối với Gateway bằng `role: "node"` và cung cấp một bề mặt lệnh (ví dụ: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) qua `node.invoke`. Hầu hết các node sử dụng Gateway WebSocket trên cổng của người vận hành. Node Apple Watch trực tiếp tùy chọn sử dụng cơ chế thăm dò HTTPS có chữ ký trên cùng cổng đó vì watchOS chặn kết nối mạng cấp thấp thông thường đối với các ứng dụng thông thường. Chi tiết giao thức: [Giao thức Gateway](/vi/gateway/protocol).

Phương thức truyền tải cũ: [Giao thức Bridge](/vi/gateway/bridge-protocol) (TCP JSONL; chỉ mang tính lịch sử đối với các node hiện tại).

macOS cũng có thể chạy ở **chế độ node**: ứng dụng trên thanh menu kết nối với máy chủ
WS của Gateway dưới dạng một node (để `openclaw nodes …` hoạt động với máy Mac này). Ứng dụng
bổ sung các lệnh Canvas, camera, màn hình, thông báo và điều khiển máy tính gốc
vào cùng bề mặt lệnh của máy chủ node mà `openclaw node run` sử dụng. Không khởi chạy
node CLI thứ hai trên máy Mac đó; ứng dụng chạy runtime máy chủ node CLI tương ứng dưới dạng
một worker nội bộ và vẫn là kết nối Gateway cùng danh tính node duy nhất.

Node là **thiết bị ngoại vi**, không phải gateway: chúng không chạy dịch vụ gateway và tin nhắn kênh (Telegram, WhatsApp, v.v.) được gửi đến gateway, không phải node.

Cẩm nang khắc phục sự cố: [/nodes/troubleshooting](/vi/nodes/troubleshooting)

## Ghép nối + trạng thái

Node sử dụng **ghép nối thiết bị**. Node trình bày danh tính thiết bị có chữ ký khi kết nối; Gateway tạo yêu cầu ghép nối thiết bị cho `role: node`. Phê duyệt qua CLI thiết bị (hoặc giao diện người dùng). Quy trình thiết lập Apple Watch trực tiếp sử dụng mã thiết lập chỉ dành cho node, tồn tại trong thời gian ngắn và do quản trị viên tạo để phê duyệt bề mặt lệnh cố định có mức rủi ro thấp; việc mở rộng khả năng sau đó vẫn yêu cầu phê duyệt thông thường.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Các yêu cầu ghép nối đang chờ xử lý sẽ hết hạn sau 5 phút kể từ lần thử lại gần nhất của thiết bị — thiết bị tiếp tục kết nối lại sẽ duy trì một yêu cầu đang chờ xử lý duy nhất (và `requestId`) thay vì tạo lời nhắc mới sau mỗi vài phút; xem [Ghép nối node](/vi/gateway/pairing) để biết toàn bộ vòng đời yêu cầu/phê duyệt. Nếu node thử lại với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ xử lý trước đó sẽ bị thay thế và một `requestId` mới được tạo — máy khách nhận được sự kiện `device.pair.resolved` cho yêu cầu bị thay thế và bạn nên chạy lại `openclaw devices list` trước khi phê duyệt.

- `nodes status` đánh dấu một node là **đã ghép nối** khi vai trò ghép nối thiết bị của nó bao gồm `node`.
- Máy Mac gốc đang kết nối và có quyền Trợ năng có thể báo cáo hoạt động
  đầu vào vật lý đã được gộp. Gateway đánh dấu máy Mac đủ điều kiện có hoạt động gần nhất là
  `active`, cung cấp cho tác nhân một gợi ý ID node ổn định và định tuyến cảnh báo kết nối node
  đến đó trước khi chuyển sang phương án dự phòng có độ trễ. Xem
  [Sự hiện diện của máy tính đang hoạt động](/vi/nodes/presence) để biết cách thiết lập, quyền riêng tư, thời gian và
  khắc phục sự cố.
- Bản ghi ghép nối thiết bị là hợp đồng bền vững về vai trò đã được phê duyệt. Việc xoay vòng token vẫn nằm trong hợp đồng đó; nó không thể nâng cấp một node đã ghép nối lên vai trò mà quá trình phê duyệt ghép nối chưa từng cấp.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) là kho ghép nối node riêng biệt do gateway sở hữu, theo dõi bề mặt lệnh/khả năng đã được phê duyệt của node qua các lần kết nối lại. Nó **không** kiểm soát xác thực phương thức truyền tải — ghép nối thiết bị đảm nhiệm việc đó.
- `openclaw nodes remove --node <id|name|ip>` xóa một ghép nối node. Đối với node dựa trên thiết bị, thao tác này thu hồi vai trò `node` của thiết bị trong kho thiết bị đã ghép nối và ngắt kết nối các phiên có vai trò node của thiết bị đó: thiết bị có nhiều vai trò vẫn giữ hàng dữ liệu và chỉ mất vai trò `node`, còn hàng dữ liệu của thiết bị chỉ có vai trò node sẽ bị xóa. Thao tác này cũng xóa mọi mục khớp khỏi kho ghép nối node riêng biệt. `operator.pairing` có thể xóa các hàng node không phải người vận hành trên thiết bị khác; bên gọi bằng token thiết bị khi thu hồi vai trò node của chính mình trên thiết bị có nhiều vai trò còn cần `operator.admin`.
- Phạm vi phê duyệt tuân theo các lệnh được khai báo trong yêu cầu đang chờ xử lý:
  - yêu cầu không có lệnh: `operator.pairing`
  - các lệnh node không thực thi: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Chênh lệch phiên bản và thứ tự nâng cấp

Gateway WebSocket chấp nhận các máy khách node đã xác thực trong phạm vi giao thức N-1.
Do đó, Gateway v4 hiện tại chấp nhận các node v3 khi kết nối khai báo
cả `role: "node"` và `client.mode: "node"`. Các phiên của người vận hành và giao diện người dùng
vẫn phải sử dụng giao thức hiện tại.

Đối với việc nâng cấp theo giai đoạn cho một nhóm thiết bị, hãy nâng cấp Gateway trước, sau đó nâng cấp từng node.
Node N-1 vẫn hiển thị và có thể quản lý trong khi được nâng cấp; Gateway
ghi nhật ký `legacy node protocol accepted` kèm khuyến nghị nâng cấp. Ghép nối,
xác thực thiết bị, danh sách lệnh được phép và phê duyệt thực thi vẫn được áp dụng.
Các khả năng và lệnh do Plugin sở hữu vẫn bị ẩn cho đến khi node nâng cấp lên
giao thức hiện tại. Các node cũ hơn N-1 cần được nâng cấp ngoài băng trước khi
kết nối lại.

Phương thức truyền tải HTTPS trực tiếp của watchOS yêu cầu phiên bản giao thức hiện tại; hãy cập nhật
ứng dụng đồng hồ cùng với Gateway trước khi bật chế độ trực tiếp.

## Máy chủ node từ xa (system.run)

Sử dụng **máy chủ node** khi Gateway chạy trên một máy và bạn muốn thực thi lệnh trên máy khác. Mô hình vẫn giao tiếp với **gateway**; gateway chuyển tiếp các lệnh gọi `exec` đến **máy chủ node** khi `host=node` được chọn.

| Vai trò      | Trách nhiệm                                                       |
| ------------ | ---------------------------------------------------------------- |
| Máy chủ Gateway | Nhận tin nhắn, chạy mô hình, định tuyến các lệnh gọi công cụ. |
| Máy chủ node | Thực thi `system.run`/`system.which` trên máy node.        |
| Phê duyệt    | Được thực thi trên máy chủ node qua `~/.openclaw/exec-approvals.json`. |

Lưu ý về phê duyệt:

- Các lần chạy node dựa trên phê duyệt liên kết với ngữ cảnh yêu cầu chính xác. Đường dẫn thực thi chuẩn bị một `systemRunPlan` chuẩn tắc trước khi phê duyệt; sau khi được cấp, gateway chuyển tiếp kế hoạch đã lưu trữ đó, chứ không phải bất kỳ trường lệnh/cwd/phiên nào được bên gọi chỉnh sửa sau đó, đồng thời xác thực lại thư mục làm việc trước khi chạy.
- Đối với các lần thực thi trực tiếp tệp shell/runtime, OpenClaw cũng cố gắng tối đa để liên kết một toán hạng tệp cục bộ cụ thể và từ chối chạy nếu tệp đó thay đổi trước khi thực thi.
- Nếu OpenClaw không thể xác định chính xác một tệp cục bộ cụ thể cho lệnh trình thông dịch/runtime, việc thực thi dựa trên phê duyệt sẽ bị từ chối thay vì giả vờ hỗ trợ đầy đủ runtime. Hãy sử dụng sandbox, các máy chủ riêng biệt hoặc danh sách cho phép/quy trình đầy đủ được tin cậy rõ ràng để hỗ trợ ngữ nghĩa trình thông dịch rộng hơn.

### Khởi chạy máy chủ node (tiền cảnh)

Trên máy node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` cũng chấp nhận `--context-path` (đường dẫn ngữ cảnh WS của Gateway), `--tls`, `--tls-fingerprint <sha256>` và `--node-id` (ghi đè ID phiên bản máy khách cũ; thao tác này không đặt lại ghép nối). Trên macOS, truyền `--share-installed-apps` để quảng bá `device.apps`; tính năng chia sẻ bị tắt theo mặc định. Sử dụng `--no-share-installed-apps` để vô hiệu hóa tùy chọn tham gia đã lưu trước đó.

### Gateway từ xa qua đường hầm SSH (liên kết loopback)

Nếu Gateway liên kết với loopback (`gateway.bind=loopback`, mặc định ở chế độ cục bộ), các máy chủ node từ xa không thể kết nối trực tiếp. Hãy tạo đường hầm SSH và trỏ máy chủ node đến đầu cục bộ của đường hầm.

Ví dụ (máy chủ node -> máy chủ gateway):

```bash
# Thiết bị đầu cuối A (duy trì chạy): chuyển tiếp cổng cục bộ 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Thiết bị đầu cuối B: xuất token gateway và kết nối qua đường hầm
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Lưu ý:

- `openclaw node run` hỗ trợ xác thực bằng token hoặc mật khẩu.
- Ưu tiên sử dụng biến môi trường: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Cấu hình dự phòng là `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ cục bộ, máy chủ node chủ ý bỏ qua `gateway.remote.token` / `gateway.remote.password`.
- Ở chế độ từ xa, `gateway.remote.token` / `gateway.remote.password` có thể được sử dụng theo các quy tắc ưu tiên từ xa.
- Nếu các SecretRef `gateway.auth.*` cục bộ đang hoạt động đã được cấu hình nhưng không được phân giải, quá trình xác thực máy chủ node sẽ đóng khi lỗi.
- Quá trình phân giải xác thực máy chủ node chỉ chấp nhận các biến môi trường `OPENCLAW_GATEWAY_*`.

### Khởi chạy máy chủ node (dịch vụ)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` cũng chấp nhận `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (chỉ ID phiên bản máy khách cũ), `--share-installed-apps` / `--no-share-installed-apps`, `--runtime <node>` (mặc định: node) và `--force` để cài đặt lại. `node status`, `node stop` và `node uninstall` cũng khả dụng.

### Ghép nối + đặt tên

Trên máy chủ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Nếu node thử lại với thông tin xác thực đã thay đổi, hãy chạy lại `openclaw devices list` và phê duyệt `requestId` hiện tại.

Tùy chọn đặt tên:

- `--display-name` trên `openclaw node run` / `openclaw node install` (được duy trì trong hàng SQLite `node_host_config` dùng chung cùng với ID phiên bản máy khách và siêu dữ liệu kết nối Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (ghi đè gateway).

### Máy chủ MCP do node lưu trữ

Cấu hình máy chủ MCP trong `openclaw.json` trên máy node, không phải trên
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

Máy chủ node headless khởi chạy các máy chủ này, liệt kê công cụ của chúng và công bố
các bộ mô tả sau khi kết nối. Các lệnh gọi công cụ quay lại node đó thông qua
`mcp.tools.call.v1`; Gateway không cần cấu hình MCP tương ứng hoặc Plugin
JS. Các máy chủ MCP OAuth không được hỗ trợ bởi đường dẫn v1 do node lưu trữ này.

Các máy chủ node hiện tại khai báo họ lệnh `mcp.tools.call.v1` tích hợp sẵn trong
lần ghép nối ban đầu ngay cả khi không có máy chủ MCP nào được cấu hình. Một node được ghép nối trên
phiên bản OpenClaw cũ hơn có thể yêu cầu nâng cấp bề mặt lệnh một lần sau khi
máy chủ node được cập nhật. Việc thêm, xóa hoặc lọc máy chủ sau đó không
yêu cầu ghép nối lại vì họ lệnh đã được phê duyệt không thay đổi. Khởi động lại
`openclaw node run` hoặc `openclaw node restart` để áp dụng các thay đổi cấu hình MCP của node;
máy chủ node không theo dõi cấu hình này.

Người vận hành Gateway có thể bỏ qua mọi công cụ hiển thị với tác nhân do các node đã ghép nối công bố,
bao gồm cả các công cụ MCP do node lưu trữ, bằng
`gateway.nodes.pluginTools.enabled: false`. Các lệnh từ chối chính xác như
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` cũng chặn việc thực thi.

### Skills do node lưu trữ

Cài đặt Skills trong thư mục Skills OpenClaw đang hoạt động của máy Node,
mặc định là `~/.openclaw/skills`. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` và
`OPENCLAW_CONFIG_PATH` di chuyển hồ sơ đang hoạt động đó. `OPENCLAW_STATE_DIR` được
ưu tiên cho Skills; nếu không, `skills/` nằm cạnh đường dẫn được
`openclaw config file` in ra. Máy chủ Node không giao diện công bố các tệp `SKILL.md` hợp lệ
sau khi kết nối, và Gateway chỉ thêm chúng vào ảnh chụp nhanh Skills của tác tử trong khi
Node đó vẫn được kết nối. Tên của mỗi thư mục Skills phải khớp với trường frontmatter
`name` để bộ định vị Node trừu tượng ánh xạ đến một mục mà không cần thêm
trường giao thức khác.

Quá trình ghép nối vai trò Node ban đầu phê duyệt việc công bố Skills. Việc thêm, xóa hoặc
thay đổi Skills không yêu cầu ghép nối lại hay thay đổi cấu hình Gateway.
Khởi động lại `openclaw node run` hoặc `openclaw node restart` sau khi thay đổi
các tệp Skills của Node; máy chủ Node không theo dõi thư mục Skills.

Các mục Skills được lưu trữ trên Node xác định Node của chúng và mang theo vị trí
thực thi. Các tệp Skills, đường dẫn tương đối được tham chiếu và tệp nhị phân vẫn nằm trên
Node đó. Tác tử đọc vị trí `node://.../SKILL.md` được quảng bá bằng
công cụ `read` thông thường. `file_fetch` chấp nhận các đường dẫn Node tuyệt đối đã được người vận hành phê duyệt,
không phải bộ định vị Skills của Node; thay vào đó, các runtime không có công cụ đọc thông thường có thể chạy
`cat SKILL.md` thông qua `exec host=node node=<node-id>` với thư mục
`node://.../skills/<name>` được quảng bá làm `workdir`. Các tệp và tệp nhị phân được tham chiếu
sử dụng cùng đích exec và thư mục làm việc. Máy chủ Node phân giải bộ định vị đó dựa trên
thư mục trạng thái OpenClaw đang hoạt động của nó, vì vậy các đường dẫn tương đối được phân giải trên Node thay vì
máy Gateway. Node công bố phải được phê duyệt `system.run`,
và chính sách exec của tác tử phải cho phép `host=node`; nếu không, Skills sẽ không xuất hiện
trong ảnh chụp nhanh của tác tử đó.

Đặt `nodeHost.skills.enabled: false` trên Node để dừng công bố. Người vận hành Gateway
có thể bỏ qua Skills từ mọi Node đã ghép nối bằng
`gateway.nodes.skills.enabled: false`.

### Trạng thái danh tính không giao diện

Node không giao diện lưu giữ ba bản ghi trạng thái riêng biệt:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): ID phiên bản máy khách, tên hiển thị và siêu dữ liệu kết nối Gateway.
- `~/.openclaw/state/openclaw.sqlite` (`device_identities`, khóa `primary`): cặp khóa thiết bị đã ký và ID thiết bị mật mã được dẫn xuất.
- `~/.openclaw/identity/device-auth.json`: các token xác thực thiết bị đã ghép nối, được lập khóa theo ID thiết bị mật mã và vai trò.

Đối với Node đã ký, Gateway sử dụng ID thiết bị mật mã để ghép nối và
định tuyến Node. ID phiên bản máy khách chỉ là siêu dữ liệu kết nối. Do đó, việc thay đổi
`--node-id` hoặc di chuyển `node.json` đã ngừng sử dụng không đặt lại quá trình ghép nối. Xem
[Trạng thái danh tính và ghép nối](/vi/cli/node#identity-and-pairing-state) để biết
luồng thu hồi rồi ghép nối lại được hỗ trợ và các ghi chú nâng cấp.

Tệp `identity/device.json` đã ngừng sử dụng hoặc quá trình xác nhận Doctor bị gián đoạn sẽ chặn việc
sử dụng danh tính bình thường. Dừng máy chủ Node và chạy `openclaw doctor --fix`; Doctor nhập
cặp khóa đã xác thực vào SQLite trước khi xóa tệp cũ. Quá trình di chuyển danh tính
không thay đổi `identity/device-auth.json`.

### Đưa các lệnh vào danh sách cho phép

Phê duyệt exec áp dụng **riêng cho từng máy chủ Node**. Thêm các mục vào danh sách cho phép từ Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Các phê duyệt được lưu trên máy chủ Node tại `~/.openclaw/exec-approvals.json`.

### Trỏ exec đến Node

Cấu hình các giá trị mặc định (cấu hình Gateway):

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

`host=auto` sẽ không tự ngầm chọn Node, nhưng yêu cầu `host=node` rõ ràng cho từng lệnh gọi được phép từ `auto`. Nếu muốn exec trên Node là mặc định cho phiên, hãy đặt rõ ràng `tools.exec.host=node` hoặc `/exec host=node ...`.

Liên quan:

- [CLI máy chủ Node](/vi/cli/node)
- [Công cụ exec](/vi/tools/exec)
- [Phê duyệt exec](/vi/tools/exec-approvals)

### Suy luận mô hình cục bộ

Node máy tính để bàn hoặc máy chủ có thể cung cấp các mô hình hỗ trợ trò chuyện từ máy chủ Ollama đang chạy trên Node đó. Các tác tử sử dụng công cụ `node_inference` của Plugin Ollama để khám phá các mô hình đã cài đặt và chạy từ xa một lời nhắc có giới hạn; Gateway không cần truy cập mạng trực tiếp vào Ollama. Xem [Suy luận Ollama cục bộ trên Node](/vi/providers/ollama#node-local-inference) để biết cách thiết lập, lọc mô hình và các lệnh xác minh trực tiếp.

### Phiên và bản chép lời Codex

Plugin `codex` chính thức có thể cung cấp các phiên Codex chưa lưu trữ trên
máy chủ Node không giao diện hoặc Node macOS gốc. Việc đăng ký danh mục không còn phụ thuộc
vào `supervision.enabled`; tùy chọn đó kiểm soát các công cụ giám sát dành cho tác tử.
Đặt `sessionCatalog.enabled: false` trong cấu hình Plugin Codex để vô hiệu hóa
các lệnh danh mục của người vận hành và danh mục Node đã ghép nối mà không vô hiệu hóa
nhà cung cấp hoặc bộ khai thác.
Plugin vẫn phải hoạt động trên cả hai máy tính, và cài đặt Node vẫn là
sự đồng ý cục bộ: chỉ bật Gateway không thể đọc trạng thái Codex của máy tính khác.

Node quảng bá các lệnh chỉ đọc có phiên bản
`codex.appServer.threads.list.v1` và
`codex.appServer.thread.turns.list.v1`. Máy chủ Node gốc có sẵn
Codex CLI cũng quảng bá `codex.terminal.resume.v1`. Phê duyệt bản nâng cấp ghép nối Node
khi các lệnh đó xuất hiện lần đầu. Gateway gọi chúng thông qua
chính sách Node Plugin thông thường và cô lập lỗi theo máy chủ.

Các hàng Node đã ghép nối xuất hiện dưới dạng nhóm **Codex** trong thanh bên phiên thông thường.
Trong mỗi máy chủ, theo mặc định, các hàng được nhóm theo thư mục dự án; thư mục làm việc
nằm trong `.claude/worktrees/<name>` được gộp vào kho lưu trữ nguồn của nó, và các nhóm dự án
có thể thu gọn như các phần khác của thanh bên. Sử dụng biểu tượng thư mục trong tiêu đề danh mục
để làm phẳng hoặc khôi phục các nhóm dự án. Cách nhóm tương tự cũng áp dụng cho
danh mục phiên Claude.
Theo mặc định, việc chọn một hàng sẽ mở ngăn Trò chuyện thông thường và đọc bản chép lời đã lưu của hàng đó
thông qua các lệnh gọi `thread/turns/list` có giới hạn, phân trang bằng con trỏ
với phép chiếu đầy đủ các mục. Sử dụng menu hàng, tiêu đề trình xem hoặc tùy chọn **Mở các phiên Codex/Claude trong** để khởi động `codex resume <thread-id>` trong terminal của người vận hành trên máy tính sở hữu phiên. Đường dẫn terminal của Node đã ghép nối là một bộ chuyển tiếp PTY trong danh sách cho phép do Plugin Codex sở hữu, không phải cơ chế thực thi lệnh Node tùy ý.

Bộ chuyển tiếp không cung cấp đầy đủ các hợp đồng về tiếp tục bộ khai thác OpenClaw và quyền sở hữu lưu trữ. Do đó, **Tiếp tục** và **Lưu trữ** không khả dụng đối với các hàng từ xa. Trên máy tính Gateway, các hàng đã lưu và không hoạt động
có thể bắt đầu một nhánh Trò chuyện riêng biệt bị khóa theo mô hình. Chỉ có thể lưu trữ một trong hai
sau khi người vận hành xác nhận rằng không có máy khách Codex nào khác đang sử dụng nó; hoạt động trực tiếp
của hàng đã lưu vẫn chưa xác định. Không thể phân nhánh hoặc lưu trữ các hàng đang hoạt động.

Xem [Giám sát các phiên Codex](/plugins/codex-supervision) để biết cách thiết lập,
phân trang, tiếp tục cục bộ và ranh giới bảo mật siêu dữ liệu.

### Phiên và bản chép lời Claude

Plugin `anthropic` đi kèm mặc định khám phá các phiên Claude CLI và Claude
Desktop chưa lưu trữ trên Gateway và các Node đã ghép nối. Đặt
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` để vô hiệu hóa
các lệnh danh mục của người vận hành và danh mục Node đã ghép nối mà không vô hiệu hóa các mô hình Anthropic
hoặc phần phụ trợ Claude CLI.
Node ứng dụng macOS từ xa quảng bá
`anthropic.claude.sessions.list.v1` và `anthropic.claude.sessions.read.v1`
khi Plugin Anthropic được bật và `~/.claude/projects/` tồn tại. Phê duyệt
bản nâng cấp ghép nối Node khi các lệnh đó xuất hiện lần đầu.

Máy chủ Node gốc có sẵn Claude CLI cũng quảng bá
`anthropic.claude.terminal.resume.v1`. Các hàng CLI và Desktop đủ điều kiện có thể mở
`claude --resume <session-id>` trong terminal của người vận hành trên máy chủ sở hữu chúng.
Đây là việc tiếp quản phiên gốc; không giống cơ chế tiếp nhận của OpenClaw, nó không
phân nhánh phiên Claude trước.

Danh mục kết hợp các bản ghi chỉ mục dự án Claude CLI hợp lệ với tiền tố siêu dữ liệu
có giới hạn từ các tệp JSONL `sdk-cli` hiện tại. Siêu dữ liệu cục bộ của Claude Desktop
cung cấp tiêu đề Desktop và trạng thái lưu trữ. Siêu dữ liệu Desktop được ưu tiên khi
cả hai nguồn cùng tham chiếu đến một ID phiên Claude Code; các bản chép lời chỉ có trên CLI
vẫn hiển thị vì CLI không có cờ lưu trữ. Việc đọc bản chép lời sử dụng con trỏ
độ lệch byte không trong suốt và các lần đọc ngược tệp có giới hạn, vì vậy việc chọn một
phiên lớn hoặc tải một trang cũ hơn không đọc toàn bộ lịch sử JSONL vào một
phản hồi Gateway.

Các lệnh liệt kê và đọc là chỉ đọc. Chúng chỉ cung cấp siêu dữ liệu danh mục và nội dung
bản chép lời thông qua các phương thức chung `sessions.catalog.list` và
`sessions.catalog.read` cho kết nối người vận hành đã xác thực với
`operator.write`. Một hàng Claude CLI cục bộ trên Gateway có thể được tiếp nhận từ trình soạn
Trò chuyện thông thường: OpenClaw nhập lịch sử hiển thị có giới hạn, tiếp tục bằng
`--fork-session` ở lượt đầu tiên và không thay đổi bản chép lời nguồn.

Máy chủ Node không giao diện có thể chọn tham gia cùng luồng tiếp tục:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node chỉ quảng bá `agent.cli.claude.run.v1` khi cài đặt cục bộ trên Node này
được bật và tệp thực thi `claude` được phân giải trên Node đó. Gateway không thể
bật nó từ xa. Lệnh cũng đi qua chính sách phê duyệt exec hiện có của Node.
Khi cả ba lệnh Claude được quảng bá và được chính sách lệnh Node của Gateway
cho phép, một hàng Claude CLI trên Node đó có thể được tiếp tục: OpenClaw nhập lịch sử
có giới hạn, liên kết phiên được tiếp nhận với Node và thư mục làm việc do danh mục báo cáo,
rồi chạy từng lượt `claude -p` một lần tại đó. Lượt đầu tiên vẫn sử dụng
`--fork-session`, giữ nguyên bản chép lời nguồn.

Các lượt được đặt trên Node sử dụng giá trị mặc định Claude của Node. Trong v1, chúng không nhận
cấu hình MCP loopback của Gateway hoặc Plugin Skills của Gateway, không thể khởi tạo lại từ
bản chép lời Gateway, đồng thời từ chối tệp đính kèm và hình ảnh. Các hàng Claude Desktop và
các Node không quảng bá lệnh chạy vẫn chỉ có thể xem. Node ứng dụng macOS
chưa quảng bá lệnh này, vì vậy các hàng của nó vẫn chỉ có thể xem.

Xem [Anthropic: Các phiên Claude trên nhiều máy tính](/vi/providers/anthropic#claude-sessions-across-computers)
để biết hành vi của giao diện điều khiển và các nguồn lưu trữ.

### Phiên OpenCode và Pi

Các Plugin OpenCode và ACPX đi kèm cũng khám phá các danh mục phiên gốc chỉ đọc
trên Gateway và các Node đã ghép nối. Node quảng bá
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` khi CLI `opencode`
được cài đặt, và `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
khi thư mục phiên của Pi tồn tại. Phê duyệt bản nâng cấp ghép nối Node khi các
lệnh mới xuất hiện lần đầu. Khi CLI tương ứng cũng khả dụng, Node sẽ thêm
`opencode.terminal.resume.v1` hoặc `acpx.pi.terminal.resume.v1`; khi đó, menu hàng
và tiêu đề trình xem hiện có có thể mở lại phiên đã chọn trong terminal sở hữu nó
bằng `opencode --session <id>` hoặc `pi --session <id>`.

OpenCode đọc thông qua bề mặt JSON/xuất của CLI chính thức. Pi đọc kho lưu trữ
phiên JSONL được ghi chép của nó, bao gồm các thư mục phiên `settings.json`
của dự án và toàn cục cùng các giá trị ghi đè `PI_CODING_AGENT_DIR` và
`PI_CODING_AGENT_SESSION_DIR`. Cả hai danh mục đều được bật theo mặc định;
tắt chúng trong giao diện web tại **Config > Plugins**.

Việc tiếp tục trong terminal sử dụng thư mục làm việc đã lưu của phiên và cùng
bộ chuyển tiếp PTY song công trong danh sách cho phép như Codex và Claude. Nó không cung cấp
cơ chế thực thi lệnh Node tùy ý.

### Tải tệp lên terminal

Giao diện điều khiển có thể kéo tệp vào một terminal Node đã ghép nối đang mở. Máy chủ Node gốc quảng bá lệnh chỉ dành cho quản trị viên `terminal.upload`; phê duyệt bản nâng cấp ghép nối khi lệnh này xuất hiện lần đầu. Mỗi tệp bị giới hạn ở 16 MiB, được đưa vào một thư mục tạm thời riêng tư trên Node đó và được trả về terminal dưới dạng đường dẫn đã được đặt trong dấu nháy phù hợp với shell mà không thực thi tệp.

Việc chèn đường dẫn hỗ trợ PowerShell, `cmd.exe`, và các shell POSIX được nhận diện (`sh`, Bash, Dash, Ash, Ksh, Zsh và Fish), bao gồm Git Bash trên Windows. Các tùy chọn ghi đè shell khác bị từ chối vì không thể suy luận an toàn quy tắc trích dẫn của chúng; hãy chạy máy chủ node bên trong WSL để sử dụng đường dẫn WSL gốc. Các đường dẫn `cmd.exe` chứa `%` hoặc `!` cũng bị từ chối vì shell đó mở rộng các ký tự này ngay cả bên trong dấu ngoặc kép.

## Gọi lệnh

Cấp thấp (RPC thô):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` chặn `system.run` và `system.run.prepare`; các lệnh đó chỉ chạy thông qua công cụ `exec` với `host=node` (xem ở trên). Có các trình trợ giúp cấp cao hơn cho những quy trình phổ biến "cung cấp cho tác tử một tệp đính kèm MEDIA" (canvas, camera, màn hình, vị trí, bên dưới).

Các lệnh node truyền phát chạy lâu sử dụng các sự kiện `node.invoke.progress`
bổ sung. Mỗi sự kiện mang ID lời gọi, số thứ tự bắt đầu từ 0 và một
đoạn văn bản UTF-8 có giới hạn; Gateway sắp xếp các đoạn trước khi chuyển chúng đến
bên gọi. `node.invoke.result` hiện có vẫn là phản hồi kết thúc
duy nhất. Bên gọi truyền phát có thể đặt thời hạn không hoạt động bắt đầu từ
sự kiện tiến trình đầu tiên và được đặt lại sau các tiến trình tiếp theo, đồng thời vẫn duy trì
thời gian chờ cứng riêng của lời gọi trong quá trình phê duyệt và thực thi. Kết quả, thời gian
chờ cứng, thời gian chờ không hoạt động và việc ngắt kết nối node đều loại bỏ trạng thái luồng
đang chờ. Việc bên gọi hủy sẽ phát `node.invoke.cancel`; sau đó máy chủ node
chấm dứt cây tiến trình tương ứng. Các lệnh yêu cầu/phản hồi hiện có không thay đổi.

## Chính sách lệnh

Các lệnh node phải vượt qua hai cổng trước khi có thể được gọi:

1. Node phải khai báo lệnh trong siêu dữ liệu kết nối đã xác thực của nó (`connect.commands`).
2. Danh sách cho phép của Gateway, được suy ra từ nền tảng và phê duyệt, phải bao gồm lệnh đã khai báo.

Danh sách cho phép mặc định theo nền tảng (trước các giá trị mặc định của plugin và tùy chọn ghi đè `allowCommands`/`denyCommands`):

| Nền tảng | Các lệnh được cho phép theo mặc định                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `device.apps`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                         |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (các lệnh máy chủ node như `system.run` phải được phê duyệt, xem bên dưới)                                                                                                                                                                                                                                  |

Các hàng này mô tả giới hạn trên của chính sách Gateway, không phải các lệnh được mọi ứng dụng node triển khai. Một lệnh chỉ có thể sử dụng khi node được kết nối cũng khai báo lệnh đó. Cụ thể, ứng dụng macOS hiện tại không khai báo các nhóm lệnh thiết bị và dữ liệu cá nhân được liệt kê trong hàng chính sách macOS.

Các lệnh `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) là giá trị mặc định của plugin trên iOS, Android, macOS, Windows, Linux và các nền tảng không xác định. Các node Linux chỉ khai báo chúng khi socket Canvas cục bộ của ứng dụng máy tính để bàn hiện diện. Tất cả lệnh Canvas trên iOS chỉ được phép chạy ở tiền cảnh.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` và `talk.ptt.once` được cho phép theo mặc định đối với mọi node quảng bá khả năng `talk` hoặc khai báo các lệnh `talk.*`, bất kể nhãn nền tảng.

Các lệnh máy chủ máy tính để bàn (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` và `screen.snapshot` trên macOS/Windows) không thuộc bảng mặc định tĩnh theo nền tảng ở trên. Chúng trở nên khả dụng sau khi người vận hành phê duyệt một yêu cầu ghép đôi có khai báo chúng; từ đó, tập lệnh đã được phê duyệt của node sẽ tiếp tục mang theo chúng khi kết nối lại.

Các lệnh nguy hiểm hoặc liên quan nhiều đến quyền riêng tư vẫn yêu cầu chủ động bật bằng `gateway.nodes.allowCommands`, ngay cả khi node khai báo chúng: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` luôn được ưu tiên hơn các giá trị mặc định và mục bổ sung trong danh sách cho phép. Xem [bản tóm tắt HealthKit](/vi/platforms/ios-healthkit) để biết cổng đồng ý trên iPhone và [Sử dụng máy tính](/vi/nodes/computer-use) để biết các cổng bổ sung trên macOS, chính sách công cụ và kích hoạt liên quan đến thao tác nhập trên máy tính để bàn.

Các lệnh node do plugin sở hữu có thể thêm chính sách gọi node của Gateway. Chính sách đó chạy sau bước kiểm tra danh sách cho phép và trước khi chuyển tiếp đến node, vì vậy `node.invoke` thô, các trình trợ giúp CLI và các công cụ tác tử chuyên dụng dùng chung một ranh giới quyền của plugin. Các lệnh node nguy hiểm của plugin vẫn yêu cầu chủ động bật `gateway.nodes.allowCommands`.

Sau khi node thay đổi danh sách lệnh đã khai báo, hãy từ chối ghép đôi thiết bị cũ và phê duyệt yêu cầu mới để Gateway lưu ảnh chụp nhanh lệnh đã cập nhật.

## Cấu hình (`openclaw.json`)

Các thiết lập liên quan đến node nằm trong `gateway.nodes` và `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Tự động phê duyệt ghép đôi node lần đầu từ các mạng đáng tin cậy (danh sách CIDR).
      // Bị vô hiệu hóa khi không được thiết lập. Chỉ áp dụng cho các yêu cầu role:node lần đầu
      // không yêu cầu phạm vi nào; không tự động phê duyệt các bản nâng cấp.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Tự động phê duyệt đã xác minh qua SSH (mặc định: bật). Phê duyệt ghép đôi
        // node lần đầu khi khớp chính xác khóa thiết bị được đọc lại qua SSH.
        sshVerify: true,
      },
      // Tin cậy các công cụ plugin hiển thị với tác tử do các node đã ghép đôi công bố (mặc định: true).
      pluginTools: {
        enabled: true,
      },
      // Chủ động bật các lệnh node nguy hiểm/liên quan nhiều đến quyền riêng tư (camera.snap, v.v.).
      allowCommands: ["camera.snap", "screen.record"],
      // Chặn chính xác tên lệnh ngay cả khi giá trị mặc định hoặc allowCommands bao gồm chúng.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Máy chủ exec mặc định: "node" định tuyến mọi lời gọi exec đến một node đã ghép đôi.
      host: "node",
      // Chế độ bảo mật cho exec trên node: chỉ cho phép các lệnh đã được phê duyệt/nằm trong danh sách cho phép.
      security: "allowlist",
      // Ghim exec vào một node cụ thể (id hoặc tên). Bỏ qua để cho phép bất kỳ node nào.
      node: "build-node",
    },
  },
}
```

Sử dụng chính xác tên lệnh node. `denyCommands` loại bỏ một lệnh ngay cả khi giá trị mặc định của nền tảng hoặc mục `allowCommands` lẽ ra cho phép lệnh đó. Theo mặc định, các node đã ghép đôi có thể công bố bộ mô tả công cụ plugin hiển thị với tác tử, nhưng lệnh của mỗi bộ mô tả vẫn phải nằm trong bề mặt lệnh đã được phê duyệt của node. Đặt `gateway.nodes.pluginTools.enabled: false` để bỏ qua tất cả các bộ mô tả như vậy. Xem [tài liệu tham chiếu cấu hình Gateway](/vi/gateway/configuration-reference#gateway) để biết chi tiết về các trường ghép đôi node và chính sách lệnh của Gateway.

Ghi đè node exec theo từng tác tử:

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

## Ảnh chụp màn hình (ảnh chụp nhanh canvas)

Nếu node đang hiển thị Canvas (WebView), `canvas.snapshot` trả về `{ format, base64 }`.

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

Lưu ý:

- `canvas present` chấp nhận URL hoặc đường dẫn tệp cục bộ (`--target`) trên các node hỗ trợ đường dẫn cục bộ, cùng với `--x/--y/--width/--height` tùy chọn để định vị. Canvas trên Linux chấp nhận URL HTTP(S) hoặc trình kết xuất A2UI đi kèm.
- `canvas eval` chấp nhận JS nội tuyến (`--js`) hoặc một đối số vị trí.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Lưu ý:

- Các node di động và máy tính để bàn Linux sử dụng một trang A2UI đi kèm do ứng dụng sở hữu để kết xuất có hỗ trợ hành động.
- Chỉ hỗ trợ A2UI v0.8 JSONL (v0.9/createSurface bị từ chối).
- iOS và Android kết xuất các trang Canvas từ xa của Gateway, nhưng hành động của nút A2UI chỉ được gửi đi từ trang A2UI đi kèm do ứng dụng sở hữu. Các trang A2UI HTTP/HTTPS do Gateway lưu trữ chỉ có thể kết xuất trên các máy khách di động đó.
- macOS có thể gửi hành động từ đúng trang A2UI của Gateway có phạm vi theo khả năng mà ứng dụng đã chọn. Các trang HTTP/HTTPS khác vẫn chỉ có thể kết xuất.
- Linux chỉ gửi hành động từ trang A2UI đi kèm. Các trang HTTP/HTTPS khác vẫn chỉ có thể kết xuất, và node Linux không giao diện đồ họa không có ứng dụng máy tính để bàn sẽ không quảng bá Canvas.

## Ảnh + video (camera của node)

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

Lưu ý:

- Node phải ở **tiền cảnh** cho `canvas.*` và `camera.*` (các lệnh gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`).
- Các Node giới hạn thời lượng clip để tải trọng base64 dễ quản lý (xem [Chụp bằng camera](/vi/nodes/camera) để biết giới hạn chính xác theo từng nền tảng). Công cụ tác tử `nodes` còn giới hạn `durationMs` được yêu cầu ở mức 300000 (5 phút) trước khi chuyển tiếp lệnh gọi; chính Node áp dụng giới hạn chặt chẽ hơn.
- Android sẽ nhắc cấp quyền `CAMERA`/`RECORD_AUDIO` khi có thể; nếu quyền bị từ chối, thao tác sẽ thất bại với `*_PERMISSION_REQUIRED`.

## Quay màn hình (Node)

Các Node được hỗ trợ cung cấp `screen.record` (mp4). Ví dụ:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Lưu ý:

- Tính khả dụng của `screen.record` phụ thuộc vào nền tảng Node.
- Công cụ tác tử `nodes` giới hạn `durationMs` được yêu cầu ở mức 300000 (5 phút); Node có thể áp dụng giới hạn chặt chẽ hơn để giới hạn tải trọng trả về.
- `--no-audio` tắt thu âm từ micrô trên các nền tảng được hỗ trợ.
- Dùng `--screen <index>` để chọn màn hình khi có nhiều màn hình (0 = màn hình chính).

## Vị trí (Node)

Các Node cung cấp `location.get` khi Vị trí được bật trong phần cài đặt.

Trình trợ giúp CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Lưu ý:

- Vị trí **tắt theo mặc định**.
- "Always" yêu cầu quyền hệ thống; việc truy xuất trong nền được thực hiện theo khả năng tốt nhất.
- Phản hồi bao gồm vĩ độ/kinh độ, độ chính xác (mét) và dấu thời gian.
- Cấu trúc đầy đủ của tham số/phản hồi và mã lỗi: [Lệnh vị trí](/vi/nodes/location-command).

## SMS (Node Android)

Các Node Android có thể cung cấp `sms.send` và `sms.search` khi người dùng cấp quyền **SMS** và thiết bị hỗ trợ điện thoại. Cả hai lệnh đều mặc định được coi là nguy hiểm: người vận hành Gateway cũng phải thêm chúng vào `gateway.nodes.allowCommands` trước khi có thể gọi (xem [Chính sách lệnh](#command-policy)).

Để tìm kiếm SMS chỉ đọc, hãy chủ động bật trong `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Chỉ thêm riêng `sms.send` khi Node cũng cần có khả năng gửi tin nhắn. Quyền Android và việc ủy quyền lệnh của Gateway là độc lập; việc cấp quyền trên điện thoại không chỉnh sửa chính sách Gateway.

Lệnh gọi cấp thấp:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Lưu ý:

- `sms.search` có thể được khai báo trước khi cấp `READ_SMS` để một lệnh gọi có thể trả về thông tin chẩn đoán quyền; việc đọc tin nhắn vẫn yêu cầu quyền Android đó.
- Các thiết bị chỉ có Wi-Fi và không có chức năng điện thoại sẽ không quảng bá `sms.send`.
- Lỗi `requires explicit gateway.nodes.allowCommands opt-in` có nghĩa là điện thoại đã khai báo lệnh nhưng người vận hành Gateway chưa ủy quyền lệnh đó.

## Lệnh dữ liệu thiết bị và dữ liệu cá nhân

Các Node iOS và Android mặc định quảng bá một số lệnh dữ liệu chỉ đọc (xem bảng [Chính sách lệnh](#command-policy)); Android còn cung cấp thêm một nhóm lớn hơn, được kiểm soát bằng các cài đặt riêng trong ứng dụng. Máy chủ Node TypeScript trên macOS hoặc mac không giao diện chỉ quảng bá `device.apps` sau khi người vận hành bật chia sẻ ứng dụng đã cài đặt bằng `--share-installed-apps`.

Các nhóm khả dụng:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health` — chỉ Android.
- `device.apps` — các Node Android, macOS và mac không giao diện. Android yêu cầu bật chia sẻ Ứng dụng đã cài đặt trong phần Cài đặt và mặc định trả về các ứng dụng hiển thị trong trình khởi chạy. Các máy chủ Node TypeScript mặc định tắt chia sẻ và chấp nhận `query`, `limit` và `includeSystem`; kết quả trên macOS chứa `label`, `bundleId`, `path` và `system`.
- `notifications.list`, `notifications.actions` — chỉ Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (mặc định chỉ đọc); `contacts.add` nguy hiểm và cần `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (mặc định chỉ đọc); `calendar.add` nguy hiểm và cần `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (mặc định chỉ đọc); `reminders.add` nguy hiểm và cần `gateway.nodes.allowCommands`.
- `callLog.search` — chỉ Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; được kiểm soát theo khả năng của các cảm biến hiện có.

Ví dụ về lệnh gọi:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Lệnh hệ thống (máy chủ Node / Node mac)

Node macOS cung cấp `system.run`, `system.which`, `system.notify` và `system.execApprovals.get/set`. Máy chủ Node không giao diện cung cấp `system.run.prepare`, `system.run`, `system.which` và `system.execApprovals.get/set`.

Ví dụ:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Lưu ý:

- `system.run` trả về stdout/stderr/mã thoát trong tải trọng.
- Việc thực thi shell hiện đi qua công cụ `exec` với `host=node`; `nodes` vẫn là bề mặt RPC trực tiếp cho các lệnh Node tường minh.
- `nodes invoke` không cung cấp `system.run` hoặc `system.run.prepare`; chúng chỉ nằm trên đường dẫn exec.
- Đường dẫn exec chuẩn bị một `systemRunPlan` chuẩn hóa trước khi phê duyệt. Sau khi được phê duyệt, Gateway chuyển tiếp kế hoạch đã lưu đó, không phải bất kỳ trường lệnh/cwd/phiên nào được bên gọi chỉnh sửa sau này.
- `system.notify` tuân theo trạng thái quyền thông báo trong ứng dụng macOS; hỗ trợ `--priority <passive|active|timeSensitive>` và `--delivery <system|overlay|auto>`.
- Siêu dữ liệu `platform` / `deviceFamily` của Node không được nhận diện sử dụng danh sách cho phép mặc định thận trọng, loại trừ `system.run` và `system.which`. Nếu bạn chủ ý cần các lệnh đó cho một nền tảng không xác định, hãy thêm chúng tường minh qua `gateway.nodes.allowCommands`.
- `system.run` hỗ trợ `--cwd`, `--env KEY=VAL`, `--command-timeout` và `--needs-screen-recording`.
- Đối với các trình bao bọc shell (`bash|sh|zsh ... -c/-lc`), các giá trị `--env` theo phạm vi yêu cầu được thu gọn thành một danh sách cho phép tường minh (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Đối với các quyết định luôn cho phép ở chế độ danh sách cho phép, các trình bao bọc điều phối đã biết (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn tệp thực thi bên trong thay vì đường dẫn trình bao bọc. Nếu không thể tháo bọc an toàn, không có mục danh sách cho phép nào được tự động lưu.
- Trên các máy chủ Node Windows ở chế độ danh sách cho phép, các lần chạy trình bao bọc shell qua `cmd.exe /c` yêu cầu phê duyệt (chỉ riêng mục danh sách cho phép không tự động cho phép dạng trình bao bọc).
- Máy chủ Node bỏ qua các giá trị ghi đè `PATH` trong `--env` và loại bỏ một tập hợp lớn các biến khởi động trình thông dịch/shell được duy trì thường xuyên (ví dụ `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) trước khi chạy lệnh. Nếu cần thêm mục PATH, hãy cấu hình môi trường dịch vụ máy chủ Node (hoặc cài đặt công cụ ở các vị trí tiêu chuẩn) thay vì truyền `PATH` qua `--env`.
- Trong chế độ Node macOS, `system.run` được kiểm soát bằng phê duyệt exec trong ứng dụng macOS (Settings → Exec approvals). Ask/allowlist/full hoạt động giống như máy chủ Node không giao diện; lời nhắc bị từ chối trả về `SYSTEM_RUN_DENIED`.
- Trên máy chủ Node không giao diện, `system.run` được kiểm soát bằng phê duyệt exec (`~/.openclaw/exec-approvals.json`); riêng trên macOS, hãy xem các biến môi trường định tuyến máy chủ exec trong phần [Máy chủ Node không giao diện](#headless-node-host-cross-platform) bên dưới.

## Liên kết Node cho exec

Khi có nhiều Node, bạn có thể liên kết exec với một Node cụ thể. Thao tác này đặt Node mặc định cho `exec host=node` (và có thể được ghi đè cho từng tác tử).

Mặc định toàn cục:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Ghi đè theo tác tử:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Bỏ thiết lập để cho phép bất kỳ Node nào:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Ánh xạ quyền

Các Node có thể bao gồm một ánh xạ `permissions` trong `node.list` / `node.describe`, với khóa là tên quyền (ví dụ `screenRecording`, `accessibility`, `location`) và giá trị boolean (`true` = đã cấp).

## Máy chủ Node không giao diện (đa nền tảng)

OpenClaw có thể chạy một **máy chủ Node không giao diện** (không có UI), kết nối với Gateway WebSocket và cung cấp `system.run` / `system.which`. Cách này hữu ích trên Linux/Windows hoặc để chạy một Node tối giản cùng với máy chủ.

Khởi động:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Lưu ý:

- Vẫn cần ghép nối (Gateway sẽ hiển thị lời nhắc ghép nối thiết bị).
- Siêu dữ liệu phiên bản máy khách, danh tính thiết bị đã ký và xác thực ghép nối sử dụng các bản ghi trạng thái riêng biệt; xem [Trạng thái danh tính không giao diện](#headless-identity-state).
- Phê duyệt exec được thực thi cục bộ qua `~/.openclaw/exec-approvals.json` (xem [Phê duyệt exec](/vi/tools/exec-approvals)).
- Trên macOS, máy chủ Node không giao diện mặc định thực thi `system.run` cục bộ. Đặt `OPENCLAW_NODE_EXEC_HOST=app` để định tuyến `system.run` qua máy chủ exec của ứng dụng đồng hành; thêm `OPENCLAW_NODE_EXEC_FALLBACK=0` để bắt buộc sử dụng máy chủ ứng dụng và thất bại theo hướng đóng nếu máy chủ này không khả dụng.
- Thêm `--tls` / `--tls-fingerprint` khi Gateway WS sử dụng TLS.

## Chế độ Node trên Mac

- Ứng dụng thanh menu macOS kết nối với máy chủ Gateway WS dưới dạng một Node (để `openclaw nodes …` hoạt động với máy Mac này).
- Trong chế độ từ xa, ứng dụng mở một đường hầm SSH cho cổng Gateway và kết nối với `localhost`.
