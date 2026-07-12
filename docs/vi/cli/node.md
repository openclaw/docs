---
read_when:
    - Chạy máy chủ Node không giao diện
    - Ghép cặp một Node không chạy macOS cho system.run
summary: Tài liệu tham khảo CLI cho `openclaw node` (máy chủ Node không giao diện)
title: Node
x-i18n:
    generated_at: "2026-07-12T07:45:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Chạy một **máy chủ node không giao diện** kết nối với WebSocket của Gateway và cung cấp
`system.run` / `system.which` trên máy này.

## Tại sao nên dùng máy chủ node?

Dùng máy chủ node khi bạn muốn các tác tử **chạy lệnh trên những máy khác** trong
mạng của mình mà không cần cài đặt đầy đủ ứng dụng đồng hành macOS trên các máy đó.

Các trường hợp sử dụng phổ biến:

- Chạy lệnh trên các máy Linux/Windows từ xa (máy chủ bản dựng, máy trong phòng thí nghiệm, NAS).
- Giữ việc thực thi trong **sandbox** trên Gateway, nhưng ủy quyền các lượt chạy đã được phê duyệt cho máy chủ khác.
- Cung cấp một đích thực thi gọn nhẹ, không giao diện cho tự động hóa hoặc các node CI.

Việc thực thi vẫn được bảo vệ bằng **phê duyệt thực thi** và danh sách cho phép theo từng tác tử trên
máy chủ node, nhờ đó bạn có thể giới hạn rõ ràng phạm vi truy cập lệnh.

`openclaw node run` có thể công bố các công cụ được hỗ trợ bởi plugin hoặc MCP sau khi kết nối.
Theo mặc định, Gateway tin cậy các bộ mô tả từ node đã ghép cặp, đồng thời yêu cầu
lệnh của mỗi bộ mô tả phải nằm trong bề mặt lệnh được phê duyệt của node. Tác tử
nhìn thấy mỗi bộ mô tả được chấp nhận như một công cụ plugin thông thường, nhưng việc thực thi vẫn
đi qua `node.invoke`, vì vậy khi ngắt kết nối node, công cụ sẽ bị loại khỏi các lượt chạy
tác tử mới. Người vận hành Gateway có thể tắt việc công bố bằng
`gateway.nodes.pluginTools.enabled: false`.

Đối với các công cụ MCP khai báo, hãy thêm cấu trúc máy chủ MCP thông thường vào
`nodeHost.mcp.servers` trong `openclaw.json` trên máy node, sau đó khởi động lại
máy chủ node. Node khai báo họ lệnh `mcp.tools.call.v1` có kiểm soát phê duyệt
và công bố các công cụ đã liệt kê sau khi kết nối; việc thay đổi danh sách máy chủ
sau đó không yêu cầu ghép cặp lại. Xem
[Máy chủ MCP do node lưu trữ](/vi/nodes#node-hosted-mcp-servers).

## Proxy trình duyệt (không cần cấu hình)

Máy chủ node tự động quảng bá một proxy trình duyệt nếu `browser.enabled` không bị
tắt trên node. Điều này cho phép tác tử sử dụng tính năng tự động hóa trình duyệt trên node đó
mà không cần cấu hình bổ sung.

Theo mặc định, proxy cung cấp bề mặt hồ sơ trình duyệt thông thường của node. Nếu bạn
đặt `nodeHost.browserProxy.allowProfiles`, proxy sẽ trở nên hạn chế:
việc nhắm đến hồ sơ không nằm trong danh sách cho phép sẽ bị từ chối, và các tuyến
tạo/xóa hồ sơ lưu bền sẽ bị chặn qua proxy.

Tắt tính năng này trên node nếu cần:

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

- `--host <host>`: Máy chủ WebSocket của Gateway (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng WebSocket của Gateway (mặc định: `18789`)
- `--context-path <path>`: Đường dẫn ngữ cảnh WebSocket của Gateway (ví dụ: `/openclaw-gw`). Được nối vào URL WebSocket.
- `--tls`: Sử dụng TLS cho kết nối Gateway
- `--no-tls`: Buộc sử dụng kết nối Gateway dạng văn bản thuần ngay cả khi cấu hình Gateway cục bộ bật TLS
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS dự kiến (sha256)
- `--node-id <id>`: Ghi đè ID phiên bản máy khách cũ được lưu trong `node.json` (không đặt lại việc ghép cặp)
- `--display-name <name>`: Ghi đè tên hiển thị của node

## Xác thực Gateway cho máy chủ node

`openclaw node run` và `openclaw node install` phân giải thông tin xác thực Gateway từ cấu hình/biến môi trường (các lệnh node không có cờ `--token`/`--password`):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` được kiểm tra trước.
- Sau đó dùng cấu hình cục bộ dự phòng: `gateway.auth.token` / `gateway.auth.password`.
- Trong chế độ cục bộ, máy chủ node chủ ý không kế thừa `gateway.remote.token` / `gateway.remote.password`.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef nhưng chưa được phân giải, quá trình phân giải xác thực node sẽ dừng an toàn (không để phương án dự phòng từ xa che khuất lỗi).
- Trong `gateway.mode=remote`, các trường máy khách từ xa (`gateway.remote.token` / `gateway.remote.password`) cũng có thể được dùng theo quy tắc ưu tiên từ xa.
- Quá trình phân giải xác thực máy chủ node chỉ chấp nhận các biến môi trường `OPENCLAW_GATEWAY_*`.

Đối với node kết nối đến Gateway dạng văn bản thuần `ws://`, các máy chủ local loopback, địa chỉ IP
riêng dạng ký tự, `.local` và Tailnet `*.ts.net` đều được chấp nhận. Đối với các
tên DNS riêng đáng tin cậy khác, hãy đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`;
nếu không, quá trình khởi động node sẽ dừng an toàn và yêu cầu bạn sử dụng `wss://`,
đường hầm SSH hoặc Tailscale. Đây là lựa chọn bật qua môi trường tiến trình, không phải khóa cấu hình
`openclaw.json`.
`openclaw node install` lưu thiết lập này vào dịch vụ node được giám sát khi nó
có mặt trong môi trường của lệnh cài đặt.

## Dịch vụ (nền)

Cài đặt máy chủ node không giao diện dưới dạng dịch vụ người dùng (launchd trên macOS, systemd trên
Linux, Windows Task Scheduler trên Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Máy chủ WebSocket của Gateway (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng WebSocket của Gateway (mặc định: `18789`)
- `--context-path <path>`: Đường dẫn ngữ cảnh WebSocket của Gateway (ví dụ: `/openclaw-gw`). Được nối vào URL WebSocket.
- `--tls`: Sử dụng TLS cho kết nối Gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS dự kiến (sha256)
- `--node-id <id>`: Ghi đè ID phiên bản máy khách cũ được lưu trong `node.json` (không đặt lại việc ghép cặp)
- `--display-name <name>`: Ghi đè tên hiển thị của node
- `--runtime <runtime>`: Môi trường chạy dịch vụ (`node` hoặc `bun`)
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

Máy chủ node thử lại ngay trong tiến trình khi Gateway khởi động lại hoặc kết nối mạng bị đóng. Nếu
Gateway báo trạng thái tạm dừng xác thực token/mật khẩu/bootstrap ở mức kết thúc, máy chủ node
ghi nhật ký chi tiết đóng kết nối và thoát với mã khác 0 để launchd/systemd/Task Scheduler có thể
khởi động lại nó với cấu hình và thông tin xác thực mới. Trạng thái tạm dừng do yêu cầu ghép cặp vẫn ở
luồng tiền cảnh để yêu cầu đang chờ có thể được phê duyệt.

## Ghép cặp

Kết nối đầu tiên tạo một yêu cầu ghép cặp thiết bị đang chờ (`role: node`) trên Gateway.

Khi máy chủ Gateway có thể SSH đến máy chủ node theo cách không tương tác (cùng người dùng,
khóa máy chủ đáng tin cậy), yêu cầu đang chờ sẽ được phê duyệt tự động: Gateway
chạy `openclaw node identity --json` trên máy chủ node qua SSH và phê duyệt khi
khóa thiết bị khớp chính xác. Tính năng này được bật theo mặc định; xem
[Tự động phê duyệt thiết bị đã được xác minh qua SSH](/vi/gateway/pairing#ssh-verified-device-auto-approval-default)
để biết các yêu cầu và cách tắt (`gateway.nodes.pairing.sshVerify: false`).

Nếu không, hãy phê duyệt thủ công bằng:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Kiểm tra danh tính node cục bộ mà Gateway dùng để xác minh:

```bash
openclaw node identity --json
```

Lệnh này in ID thiết bị và khóa công khai từ `identity/device.json`, đồng thời không bao giờ
tạo hoặc sửa đổi các tệp danh tính.

Trên các mạng node được kiểm soát chặt chẽ, người vận hành Gateway có thể chủ động bật
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

Tính năng này bị tắt theo mặc định (`autoApproveCidrs` chưa được đặt). Nó chỉ áp dụng cho
việc ghép cặp `role: node` mới, không yêu cầu phạm vi, từ địa chỉ IP máy khách mà
Gateway tin cậy. Máy khách người vận hành/trình duyệt, Control UI, WebChat, cũng như các nâng cấp
vai trò, phạm vi, siêu dữ liệu hoặc khóa công khai vẫn yêu cầu phê duyệt thủ công.

Nếu node thử lại việc ghép cặp với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

### Danh tính và trạng thái ghép cặp

Node không giao diện tách ID phiên bản máy khách cũ khỏi danh tính thiết bị đã ký
mà Gateway sử dụng để ghép cặp và định tuyến. Các tệp này nằm trong thư mục trạng thái
OpenClaw (`~/.openclaw` theo mặc định, hoặc `$OPENCLAW_STATE_DIR`
khi được đặt):

| Tệp                         | Mục đích                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | ID phiên bản máy khách trong khóa `nodeId` cũ, tên hiển thị và siêu dữ liệu kết nối Gateway. Máy khách gửi giá trị này dưới dạng `instanceId`.        |
| `identity/device.json`      | Cặp khóa Ed25519 đã ký và ID thiết bị được suy ra. Với các kết nối đã ký, ID thiết bị này là ID node được định tuyến và danh tính ghép cặp.           |
| `identity/device-auth.json` | Token thiết bị đã ghép cặp, được lập khóa theo ID thiết bị mật mã và vai trò.                                                                          |

`--node-id` chỉ thay đổi ID phiên bản máy khách trong `node.json`. Nó không
thay đổi ID thiết bị mật mã hoặc xóa xác thực ghép cặp. Tương tự, chỉ xóa
`node.json` cũng không đặt lại việc ghép cặp. Để thu hồi và ghép cặp lại một node:

1. Trên Gateway, chạy `openclaw nodes remove --node <id|name|ip>`.
2. Trên node, khởi động lại dịch vụ đã cài đặt bằng `openclaw node restart`, hoặc
   dừng rồi chạy lại lệnh tiền cảnh `openclaw node run`. Thao tác này bắt đầu
   luồng ghép cặp thiết bị. Nếu `openclaw devices list` không hiển thị yêu cầu
   và node báo `AUTH_DEVICE_TOKEN_MISMATCH`, hãy khởi động lại hoặc chạy lại thêm
   một lần nữa. Lần thử bị từ chối sẽ xóa token cục bộ đã bị thu hồi; lần thử
   tiếp theo có thể yêu cầu ghép cặp.
3. Trên Gateway, chạy `openclaw devices list`, sau đó
   `openclaw devices approve <deviceRequestId>`.
4. Khởi động lại hoặc chạy lại node một lần nữa. Máy khách đang tạm dừng để ghép cặp không tự động
   tiếp tục sau khi được phê duyệt; lần kết nối lại này tạo yêu cầu bề mặt lệnh
   riêng biệt.
5. Trên Gateway, chạy `openclaw nodes pending`, sau đó
   `openclaw nodes approve <nodeRequestId>`.

Hai ID yêu cầu là khác nhau. Chính sách CIDR đáng tin cậy phù hợp có thể
tự động phê duyệt bước ghép cặp thiết bị lần đầu; việc phê duyệt bề mặt lệnh vẫn là
một bước kiểm tra riêng biệt.

Các bản phát hành OpenClaw cũ có thể để lại trường `token` cũ trong `node.json`.
OpenClaw hiện tại không sử dụng trường đó và sẽ xóa nó vào lần tiếp theo máy chủ node
lưu tệp. Giữ riêng tư cả hai tệp trong `identity/`; chúng chứa
cặp khóa thiết bị và token xác thực.

## Phê duyệt thực thi

`system.run` được kiểm soát bằng phê duyệt thực thi cục bộ:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, hoặc
  `~/.openclaw/exec-approvals.json` khi biến chưa được đặt
- [Phê duyệt thực thi](/vi/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (chỉnh sửa từ Gateway)

Đối với việc thực thi node bất đồng bộ đã được phê duyệt, OpenClaw chuẩn bị một `systemRunPlan`
chuẩn hóa trước khi nhắc phê duyệt. Lần chuyển tiếp `system.run` đã được phê duyệt sau đó sẽ tái sử dụng
kế hoạch đã lưu này, vì vậy các chỉnh sửa đối với trường lệnh/cwd/phiên sau khi yêu cầu phê duyệt
được tạo sẽ bị từ chối thay vì làm thay đổi nội dung node thực thi.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Các node](/vi/nodes)
