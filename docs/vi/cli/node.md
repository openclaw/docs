---
read_when:
    - Chạy máy chủ Node không giao diện đồ họa
    - Ghép nối một Node không chạy macOS cho system.run
summary: Tài liệu tham khảo CLI cho `openclaw node` (máy chủ Node không giao diện)
title: Node
x-i18n:
    generated_at: "2026-07-16T15:04:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Chạy một **máy chủ node không giao diện** kết nối với Gateway WebSocket và cung cấp
`system.run` / `system.which` trên máy này.

Trên macOS, ứng dụng thanh menu đã nhúng môi trường chạy máy chủ node này vào kết nối
node riêng và bổ sung các khả năng gốc của Mac. Chỉ sử dụng `openclaw node run` trên
Mac khi bạn chủ ý muốn một node không giao diện không có ứng dụng. Chạy cả hai
sẽ tạo hai danh tính node cho cùng một máy.

## Tại sao nên sử dụng máy chủ node?

Sử dụng máy chủ node khi bạn muốn các tác nhân **chạy lệnh trên các máy khác** trong
mạng mà không cần cài đặt ứng dụng đồng hành macOS đầy đủ trên đó.

Các trường hợp sử dụng phổ biến:

- Chạy lệnh trên các máy Linux/Windows từ xa (máy chủ dựng bản, máy trong phòng thí nghiệm, NAS).
- Giữ exec **trong sandbox** trên Gateway, nhưng ủy quyền các lần chạy đã được phê duyệt cho máy chủ khác.
- Cung cấp một đích thực thi nhẹ, không giao diện cho các node tự động hóa hoặc CI.

Việc thực thi vẫn được bảo vệ bằng **phê duyệt exec** và danh sách cho phép theo từng tác nhân trên
máy chủ node, nhờ đó bạn có thể giới hạn quyền truy cập lệnh một cách rõ ràng và cụ thể.

`openclaw node run` có thể công bố các công cụ được hỗ trợ bởi plugin hoặc MCP sau khi kết nối.
Theo mặc định, Gateway tin cậy các bộ mô tả từ node đã ghép cặp, đồng thời yêu cầu
lệnh của từng bộ mô tả phải nằm trong bề mặt lệnh đã được phê duyệt của node.
Tác nhân thấy mỗi bộ mô tả được chấp nhận như một công cụ plugin thông thường, nhưng việc thực thi vẫn
đi qua `node.invoke`, vì vậy việc ngắt kết nối node sẽ loại bỏ công cụ khỏi các lần chạy
tác nhân mới. Người vận hành Gateway có thể vô hiệu hóa việc công bố bằng
`gateway.nodes.pluginTools.enabled: false`.

Đối với các công cụ MCP khai báo, hãy thêm cấu trúc máy chủ MCP thông thường bên dưới
`nodeHost.mcp.servers` trong `openclaw.json` trên máy node, sau đó khởi động lại
máy chủ node. Node khai báo họ lệnh `mcp.tools.call.v1` được kiểm soát bằng phê duyệt
và công bố các công cụ được liệt kê sau khi kết nối; việc thay đổi danh sách máy chủ
sau đó không yêu cầu ghép cặp lại. Xem
[Máy chủ MCP được lưu trữ trên node](/vi/nodes#node-hosted-mcp-servers).

## Proxy trình duyệt (không cần cấu hình)

Máy chủ node tự động quảng bá proxy trình duyệt nếu `browser.enabled` không bị
vô hiệu hóa trên node. Điều này cho phép tác nhân sử dụng tự động hóa trình duyệt trên node đó
mà không cần cấu hình bổ sung.

Theo mặc định, proxy cung cấp bề mặt hồ sơ trình duyệt thông thường của node. Nếu bạn
đặt `nodeHost.browserProxy.allowProfiles`, proxy sẽ trở nên hạn chế:
việc nhắm đến hồ sơ không nằm trong danh sách cho phép sẽ bị từ chối và các tuyến tạo/xóa
hồ sơ lâu dài sẽ bị chặn qua proxy.

Vô hiệu hóa proxy trên node nếu cần:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Chạy (tiền cảnh)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Máy chủ Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng Gateway WebSocket (mặc định: `18789`)
- `--context-path <path>`: Đường dẫn ngữ cảnh Gateway WebSocket (ví dụ: `/openclaw-gw`). Được nối vào URL WebSocket.
- `--tls`: Sử dụng TLS cho kết nối Gateway
- `--no-tls`: Buộc sử dụng kết nối Gateway văn bản thuần ngay cả khi cấu hình Gateway cục bộ bật TLS
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS dự kiến (sha256)
- `--node-id <id>`: Ghi đè ID phiên bản máy khách được lưu trong trạng thái SQLite dùng chung (không đặt lại việc ghép cặp)
- `--display-name <name>`: Ghi đè tên hiển thị của node

## Xác thực Gateway cho máy chủ node

`openclaw node run` và `openclaw node install` phân giải xác thực Gateway từ cấu hình/biến môi trường (không có cờ `--token`/`--password` trên các lệnh node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` được kiểm tra trước.
- Sau đó dự phòng về cấu hình cục bộ: `gateway.auth.token` / `gateway.auth.password`.
- Trong chế độ cục bộ, máy chủ node chủ ý không kế thừa `gateway.remote.token` / `gateway.remote.password`.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef nhưng không phân giải được, quá trình phân giải xác thực node sẽ đóng khi lỗi (không có cơ chế dự phòng từ xa che lấp lỗi).
- Trong `gateway.mode=remote`, các trường máy khách từ xa (`gateway.remote.token` / `gateway.remote.password`) cũng đủ điều kiện theo các quy tắc ưu tiên từ xa.
- Quá trình phân giải xác thực máy chủ node chỉ tuân theo các biến môi trường `OPENCLAW_GATEWAY_*`.

Đối với node kết nối với Gateway `ws://` văn bản thuần, địa chỉ loopback, các
địa chỉ IP riêng dạng literal, `.local` và các máy chủ Tailnet `*.ts.net` đều được chấp nhận. Đối với các
tên DNS riêng đáng tin cậy khác, hãy đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; nếu không có
biến này, quá trình khởi động node sẽ đóng khi lỗi và yêu cầu bạn sử dụng `wss://`, đường hầm SSH hoặc
Tailscale. Đây là tùy chọn bật qua môi trường tiến trình, không phải khóa cấu hình
`openclaw.json`.
`openclaw node install` lưu tùy chọn này vào dịch vụ node được giám sát khi nó
có trong môi trường của lệnh cài đặt.

## Dịch vụ (nền)

Cài đặt máy chủ node không giao diện dưới dạng dịch vụ người dùng (launchd trên macOS, systemd trên
Linux, Windows Task Scheduler trên Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Máy chủ Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng Gateway WebSocket (mặc định: `18789`)
- `--context-path <path>`: Đường dẫn ngữ cảnh Gateway WebSocket (ví dụ: `/openclaw-gw`). Được nối vào URL WebSocket.
- `--tls`: Sử dụng TLS cho kết nối Gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS dự kiến (sha256)
- `--node-id <id>`: Ghi đè ID phiên bản máy khách được lưu trong trạng thái SQLite dùng chung (không đặt lại việc ghép cặp)
- `--display-name <name>`: Ghi đè tên hiển thị của node
- `--runtime <runtime>`: Môi trường chạy dịch vụ (`node`)
- `--force`: Cài đặt lại/ghi đè nếu đã được cài đặt

Quản lý dịch vụ:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Sử dụng `openclaw node run` cho máy chủ node chạy ở tiền cảnh (không có dịch vụ).

Các lệnh dịch vụ chấp nhận `--json` để xuất dữ liệu mà máy có thể đọc.

Máy chủ node thử lại trong cùng tiến trình khi Gateway khởi động lại hoặc mạng đóng kết nối. Nếu
Gateway báo trạng thái tạm dừng xác thực token/mật khẩu/bootstrap ở trạng thái kết thúc, máy chủ node
ghi chi tiết đóng kết nối và thoát với mã khác 0 để launchd/systemd/Task Scheduler có thể
khởi động lại bằng cấu hình và thông tin xác thực mới. Các trạng thái tạm dừng yêu cầu ghép cặp vẫn ở
luồng tiền cảnh để yêu cầu đang chờ có thể được phê duyệt.

## Ghép cặp

Kết nối đầu tiên tạo một yêu cầu ghép cặp thiết bị đang chờ (`role: node`) trên Gateway.

Khi máy chủ Gateway có thể SSH tới máy chủ node mà không cần tương tác (cùng người dùng,
khóa máy chủ đáng tin cậy), yêu cầu đang chờ sẽ được tự động phê duyệt: Gateway
chạy `openclaw node identity --json` trên máy chủ node qua SSH và phê duyệt khi
khóa thiết bị khớp chính xác. Tính năng này được bật theo mặc định; xem
[Tự động phê duyệt thiết bị được xác minh bằng SSH](/vi/gateway/pairing#ssh-verified-device-auto-approval-default)
để biết các yêu cầu và cách vô hiệu hóa (`gateway.nodes.pairing.sshVerify: false`).

Nếu không, hãy phê duyệt thủ công qua:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Kiểm tra danh tính node cục bộ mà Gateway dùng để xác minh:

```bash
openclaw node identity --json
```

Lệnh này in ID thiết bị và khóa công khai từ `identity/device.json` và không bao giờ
tạo hoặc sửa đổi tệp danh tính.

Trên các mạng node được kiểm soát chặt chẽ, người vận hành Gateway có thể chủ động chọn
tự động phê duyệt việc ghép cặp node lần đầu từ các CIDR đáng tin cậy:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Tính năng này bị vô hiệu hóa theo mặc định (`autoApproveCidrs` chưa được đặt). Nó chỉ áp dụng cho
việc ghép cặp `role: node` mới không có phạm vi được yêu cầu, từ một IP máy khách mà
Gateway tin cậy. Máy khách của người vận hành/trình duyệt, Control UI, WebChat và các nâng cấp về vai trò,
phạm vi, siêu dữ liệu hoặc khóa công khai vẫn yêu cầu phê duyệt thủ công.

Nếu node thử ghép cặp lại với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ được thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

### Trạng thái danh tính và ghép cặp

Node không giao diện tách ID phiên bản máy khách khỏi danh tính thiết bị đã ký
mà Gateway sử dụng để ghép cặp và định tuyến. Trạng thái này nằm trong thư mục trạng thái
OpenClaw (`~/.openclaw` theo mặc định hoặc `$OPENCLAW_STATE_DIR`
khi được đặt):

| Trạng thái                                        | Mục đích                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | ID phiên bản máy khách, tên hiển thị và siêu dữ liệu kết nối Gateway. Máy khách gửi ID này dưới dạng `instanceId`.                     |
| `identity/device.json`                       | Cặp khóa Ed25519 đã ký và ID thiết bị dẫn xuất. Đối với kết nối đã ký, ID thiết bị này là ID node được định tuyến và danh tính ghép cặp. |
| `identity/device-auth.json`                  | Token thiết bị đã ghép cặp, được lập khóa theo ID thiết bị mật mã và vai trò.                                                                 |

`--node-id` chỉ thay đổi ID phiên bản máy khách trong trạng thái SQLite dùng chung. Nó
không thay đổi ID thiết bị mật mã hoặc xóa xác thực ghép cặp. Việc di chuyển một
`node.json` đã ngừng sử dụng bằng `openclaw doctor --fix` cũng không đặt lại việc ghép cặp. Để
thu hồi và ghép cặp lại một node:

1. Trên Gateway, chạy `openclaw nodes remove --node <id|name|ip>`.
2. Trên node, khởi động lại dịch vụ đã cài đặt bằng `openclaw node restart`, hoặc
   dừng rồi chạy lại lệnh tiền cảnh `openclaw node run`. Thao tác này bắt đầu
   luồng ghép cặp thiết bị. Nếu `openclaw devices list` không hiển thị yêu cầu
   và node báo `AUTH_DEVICE_TOKEN_MISMATCH`, hãy khởi động lại hoặc chạy lại thêm
   một lần nữa. Lần thử bị từ chối sẽ xóa token cục bộ hiện đã bị thu hồi; lần thử
   tiếp theo có thể yêu cầu ghép cặp.
3. Trên Gateway, chạy `openclaw devices list`, sau đó
   `openclaw devices approve <deviceRequestId>`.
4. Khởi động lại hoặc chạy lại node lần nữa. Máy khách bị tạm dừng để ghép cặp không tự động
   tiếp tục sau khi được phê duyệt; lần kết nối lại này tạo yêu cầu bề mặt lệnh
   riêng biệt.
5. Trên Gateway, chạy `openclaw nodes pending`, sau đó
   `openclaw nodes approve <nodeRequestId>`.

Hai ID yêu cầu là riêng biệt. Chính sách CIDR đáng tin cậy phù hợp có thể
tự động phê duyệt bước ghép cặp thiết bị lần đầu; việc phê duyệt bề mặt lệnh vẫn là
một bước kiểm tra riêng biệt.

Các bản phát hành OpenClaw cũ hơn lưu trạng thái máy chủ node trong `node.json` và có thể để lại
trường `token` lỗi thời trong đó. Dừng máy chủ node và chạy `openclaw doctor --fix`
một lần; Doctor nhập các trường danh tính và kết nối được hỗ trợ vào SQLite,
loại bỏ trường token không dùng, xác minh hàng dữ liệu và xóa tệp đã ngừng sử dụng.
Các lệnh node thông thường sẽ đóng khi lỗi kèm hướng dẫn sửa chữa này trong khi tệp hoặc
một yêu cầu Doctor bị gián đoạn vẫn còn. Giữ riêng tư cả hai tệp trong `identity/`;
chúng chứa cặp khóa thiết bị và các token xác thực.

## Phê duyệt exec

`system.run` được kiểm soát bằng phê duyệt exec cục bộ:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, hoặc
  `~/.openclaw/exec-approvals.json` khi biến chưa được đặt
- [Phê duyệt exec](/vi/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (chỉnh sửa từ Gateway)

Đối với exec node bất đồng bộ đã được phê duyệt, OpenClaw chuẩn bị một `systemRunPlan`
chuẩn tắc trước khi nhắc phê duyệt. Lần chuyển tiếp `system.run` đã được phê duyệt sau đó sẽ tái sử dụng kế hoạch
đã lưu, vì vậy các chỉnh sửa đối với trường lệnh/cwd/phiên sau khi yêu cầu phê duyệt
được tạo sẽ bị từ chối thay vì làm thay đổi nội dung node thực thi.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Các node](/vi/nodes)
