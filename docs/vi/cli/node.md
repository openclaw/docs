---
read_when:
    - Chạy máy chủ Node không giao diện đồ họa
    - Ghép đôi một node không chạy macOS cho system.run
summary: Tài liệu tham khảo CLI cho `openclaw node` (máy chủ Node không giao diện)
title: Node
x-i18n:
    generated_at: "2026-07-19T05:40:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c229e50dcff790a08ef155561a15a39220d6dccdc263d4a3d01ab8592f48de73
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Chạy một **máy chủ Node không giao diện** kết nối với WebSocket của Gateway và cung cấp
`system.run` / `system.which` trên máy này.

Trên macOS, ứng dụng thanh menu đã nhúng runtime máy chủ Node này vào kết nối
Node riêng và bổ sung các khả năng gốc của máy Mac. Chỉ sử dụng `openclaw node run` trên
máy Mac khi bạn chủ ý muốn có một Node không giao diện mà không dùng ứng dụng. Chạy
cả hai sẽ tạo hai danh tính Node cho cùng một máy.

## Tại sao nên sử dụng máy chủ Node?

Sử dụng máy chủ Node khi bạn muốn các agent **chạy lệnh trên những máy khác** trong
mạng mà không cần cài đặt ứng dụng đồng hành macOS đầy đủ trên đó.

Các trường hợp sử dụng phổ biến:

- Chạy lệnh trên các máy Linux/Windows từ xa (máy chủ build, máy trong phòng lab, NAS).
- Giữ exec **trong sandbox** trên Gateway, nhưng ủy quyền các lượt chạy đã phê duyệt cho máy chủ khác.
- Cung cấp đích thực thi nhẹ, không giao diện cho hoạt động tự động hóa hoặc các Node CI.

Việc thực thi vẫn được bảo vệ bằng **phê duyệt exec** và danh sách cho phép theo từng agent trên
máy chủ Node, vì vậy bạn có thể duy trì phạm vi truy cập lệnh rõ ràng và giới hạn.

`openclaw node run` có thể công bố các công cụ dựa trên Plugin hoặc MCP sau khi kết nối.
Theo mặc định, Gateway tin cậy các bộ mô tả từ Node đã ghép nối, đồng thời yêu cầu
lệnh của mỗi bộ mô tả phải nằm trong bề mặt lệnh đã được phê duyệt của Node. Agent
thấy mỗi bộ mô tả được chấp nhận như một công cụ Plugin thông thường, nhưng việc thực thi vẫn
đi qua `node.invoke`, vì vậy việc ngắt kết nối Node sẽ loại bỏ công cụ khỏi các lượt chạy
agent mới. Người vận hành Gateway có thể tắt việc công bố bằng
`gateway.nodes.pluginTools.enabled: false`.

Đối với các công cụ MCP khai báo, hãy thêm cấu trúc máy chủ MCP thông thường trong
`nodeHost.mcp.servers` tại `openclaw.json` trên máy Node, sau đó khởi động lại
máy chủ Node. Node khai báo họ lệnh `mcp.tools.call.v1` được kiểm soát bằng phê duyệt
và công bố các công cụ được liệt kê sau khi kết nối; việc thay đổi danh sách máy chủ
sau đó không yêu cầu ghép nối lại. Xem
[Máy chủ MCP do Node lưu trữ](/vi/nodes#node-hosted-mcp-servers).

## Proxy trình duyệt (không cần cấu hình)

Máy chủ Node tự động quảng bá proxy trình duyệt nếu `browser.enabled` không bị
tắt trên Node. Điều này cho phép agent sử dụng tính năng tự động hóa trình duyệt trên Node đó
mà không cần cấu hình bổ sung.

Theo mặc định, proxy cung cấp bề mặt hồ sơ trình duyệt thông thường của Node. Nếu bạn
đặt `nodeHost.browserProxy.allowProfiles`, proxy sẽ trở nên hạn chế:
việc nhắm đến hồ sơ không có trong danh sách cho phép sẽ bị từ chối và các tuyến tạo/xóa
hồ sơ cố định sẽ bị chặn qua proxy.

Tắt tính năng này trên Node nếu cần:

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
- `--context-path <path>`: Đường dẫn ngữ cảnh WebSocket của Gateway (ví dụ: `/openclaw-gw`). Được nối thêm vào URL WebSocket.
- `--tls`: Sử dụng TLS cho kết nối Gateway
- `--no-tls`: Buộc dùng kết nối Gateway văn bản thuần ngay cả khi cấu hình Gateway cục bộ bật TLS
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS dự kiến (sha256)
- `--node-id <id>`: Ghi đè ID phiên bản máy khách được lưu trong trạng thái SQLite dùng chung (không đặt lại ghép nối)
- `--display-name <name>`: Ghi đè tên hiển thị của Node

## Xác thực Gateway cho máy chủ Node

`openclaw node run` và `openclaw node install` phân giải xác thực Gateway từ cấu hình/biến môi trường (không có cờ `--token`/`--password` trên các lệnh Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` được kiểm tra trước.
- Sau đó dùng cấu hình cục bộ làm phương án dự phòng: `gateway.auth.token` / `gateway.auth.password`.
- Trong chế độ cục bộ, máy chủ Node chủ ý không kế thừa `gateway.remote.token` / `gateway.remote.password`.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef nhưng không phân giải được, quá trình phân giải xác thực Node sẽ đóng khi lỗi (không có phương án dự phòng từ xa che khuất lỗi).
- Trong `gateway.mode=remote`, các trường máy khách từ xa (`gateway.remote.token` / `gateway.remote.password`) cũng đủ điều kiện theo quy tắc ưu tiên từ xa.
- Quá trình phân giải xác thực máy chủ Node chỉ chấp nhận các biến môi trường `OPENCLAW_GATEWAY_*`.

Đối với Node kết nối với Gateway `ws://` dùng văn bản thuần, địa chỉ loopback, các
địa chỉ IP riêng dạng literal, `.local` và các máy chủ Tailnet `*.ts.net` đều được chấp nhận. Đối với các
tên DNS riêng đáng tin cậy khác, hãy đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; nếu không
có, Node sẽ đóng khi lỗi lúc khởi động và yêu cầu bạn sử dụng `wss://`, đường hầm SSH hoặc
Tailscale. Đây là tùy chọn tham gia qua môi trường tiến trình, không phải khóa cấu hình
`openclaw.json`.
`openclaw node install` duy trì tùy chọn này trong dịch vụ Node được giám sát khi nó
có mặt trong môi trường của lệnh cài đặt.

## Dịch vụ (nền)

Cài đặt máy chủ Node không giao diện dưới dạng dịch vụ người dùng (launchd trên macOS, systemd trên
Linux, Windows Task Scheduler trên Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Máy chủ WebSocket của Gateway (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng WebSocket của Gateway (mặc định: `18789`)
- `--context-path <path>`: Đường dẫn ngữ cảnh WebSocket của Gateway (ví dụ: `/openclaw-gw`). Được nối thêm vào URL WebSocket.
- `--tls`: Sử dụng TLS cho kết nối Gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS dự kiến (sha256)
- `--node-id <id>`: Ghi đè ID phiên bản máy khách được lưu trong trạng thái SQLite dùng chung (không đặt lại ghép nối)
- `--display-name <name>`: Ghi đè tên hiển thị của Node
- `--runtime <runtime>`: Runtime dịch vụ (`node`)
- `--force`: Cài đặt lại/ghi đè nếu đã được cài đặt

Quản lý dịch vụ:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Sử dụng `openclaw node run` cho máy chủ Node chạy ở tiền cảnh (không có dịch vụ).

Các lệnh dịch vụ chấp nhận `--json` để xuất dữ liệu có thể đọc bằng máy.

Máy chủ Node tự thử lại trong cùng tiến trình khi Gateway khởi động lại hoặc kết nối mạng đóng. Nếu
Gateway báo trạng thái tạm dừng xác thực bằng token/mật khẩu/bootstrap có tính kết thúc, máy chủ Node
ghi nhật ký chi tiết đóng và thoát với mã khác 0 để launchd/systemd/Task Scheduler có thể
khởi động lại bằng cấu hình và thông tin xác thực mới. Các trạng thái tạm dừng do yêu cầu ghép nối vẫn nằm trong
luồng tiền cảnh để yêu cầu đang chờ có thể được phê duyệt.

## Ghép nối

Kết nối đầu tiên tạo một yêu cầu ghép nối thiết bị đang chờ xử lý (`role: node`) trên Gateway.

Khi máy chủ Gateway có thể SSH đến máy chủ Node theo cách không tương tác (cùng người dùng,
khóa máy chủ đáng tin cậy), yêu cầu đang chờ sẽ được phê duyệt tự động: Gateway
chạy `openclaw node identity --json` trên máy chủ Node qua SSH và phê duyệt khi
khóa thiết bị khớp chính xác. Tính năng này được bật theo mặc định; xem
[Tự động phê duyệt thiết bị được xác minh bằng SSH](/vi/gateway/pairing#ssh-verified-device-auto-approval-default)
để biết yêu cầu và cách tắt tính năng này (`gateway.nodes.pairing.sshVerify: false`).

Nếu không, hãy phê duyệt thủ công bằng:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Kiểm tra danh tính Node cục bộ mà Gateway dùng để xác minh:

```bash
openclaw node identity --json
```

Lệnh này in ID thiết bị và khóa công khai từ hàng `primary` trong
`state/openclaw.sqlite` và không bao giờ tạo cơ sở dữ liệu hoặc danh tính mới.

Trên các mạng Node được kiểm soát chặt chẽ, người vận hành Gateway có thể chủ động chọn
tự động phê duyệt lần ghép nối Node đầu tiên từ các CIDR đáng tin cậy:

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
lần ghép nối `role: node` mới không có phạm vi được yêu cầu, từ địa chỉ IP máy khách mà
Gateway tin cậy. Máy khách người vận hành/trình duyệt, Control UI, WebChat và các nâng cấp về vai trò,
phạm vi, siêu dữ liệu hoặc khóa công khai vẫn cần được phê duyệt thủ công.

Nếu Node thử lại việc ghép nối với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

### Trạng thái danh tính và ghép nối

Node không giao diện tách ID phiên bản máy khách khỏi danh tính thiết bị đã ký
mà Gateway sử dụng để ghép nối và định tuyến. Trạng thái này nằm trong thư mục trạng thái
OpenClaw (`~/.openclaw` theo mặc định hoặc `$OPENCLAW_STATE_DIR`
khi được đặt):

| Trạng thái                                                    | Mục đích                                                                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`)             | ID phiên bản máy khách, tên hiển thị và siêu dữ liệu kết nối Gateway. Máy khách gửi ID này dưới dạng `instanceId`.                     |
| `state/openclaw.sqlite` (`device_identities`, `primary`) | Cặp khóa Ed25519 đã ký và ID thiết bị dẫn xuất. Đối với kết nối đã ký, ID thiết bị này là ID Node được định tuyến và danh tính ghép nối. |
| `identity/device-auth.json`                              | Token thiết bị đã ghép nối, được lập khóa theo ID thiết bị mật mã và vai trò.                                                                 |

`--node-id` chỉ thay đổi ID phiên bản máy khách trong trạng thái SQLite dùng chung. Nó
không thay đổi ID thiết bị mật mã hoặc xóa xác thực ghép nối. Việc di chuyển một
`node.json` đã ngừng sử dụng bằng `openclaw doctor --fix` cũng không đặt lại ghép nối. Để
thu hồi và ghép nối lại một Node:

1. Trên Gateway, chạy `openclaw nodes remove --node <id|name|ip>`.
2. Trên Node, khởi động lại dịch vụ đã cài đặt bằng `openclaw node restart`, hoặc
   dừng và chạy lại lệnh tiền cảnh `openclaw node run`. Thao tác này khởi động
   luồng ghép nối thiết bị. Nếu `openclaw devices list` không hiển thị yêu cầu
   và Node báo `AUTH_DEVICE_TOKEN_MISMATCH`, hãy khởi động lại hoặc chạy lại thêm
   một lần nữa. Lần thử bị từ chối sẽ xóa token cục bộ hiện đã bị thu hồi; lần thử
   tiếp theo có thể yêu cầu ghép nối.
3. Trên Gateway, chạy `openclaw devices list`, sau đó
   `openclaw devices approve <deviceRequestId>`.
4. Khởi động lại hoặc chạy lại Node lần nữa. Máy khách bị tạm dừng để ghép nối không tự động
   tiếp tục sau khi được phê duyệt; lần kết nối lại này tạo yêu cầu bề mặt lệnh
   riêng biệt.
5. Trên Gateway, chạy `openclaw nodes pending`, sau đó
   `openclaw nodes approve <nodeRequestId>`.

Hai ID yêu cầu là riêng biệt. Chính sách CIDR đáng tin cậy phù hợp có thể
tự động phê duyệt bước ghép nối thiết bị lần đầu; phê duyệt bề mặt lệnh vẫn là
một bước kiểm tra riêng.

Các bản phát hành OpenClaw cũ hơn lưu trạng thái máy chủ Node trong `node.json` và danh tính
đã ký trong `identity/device.json`. Dừng máy chủ Node và chạy
`openclaw doctor --fix` một lần; Doctor tiếp quản từng nguồn đã ngừng sử dụng, xác thực nguồn đó,
nhập và xác minh hàng SQLite chuẩn, rồi xóa tệp cũ. Các lệnh Node thông thường
đóng khi lỗi kèm hướng dẫn sửa chữa này trong khi vẫn còn tệp đã ngừng sử dụng
hoặc yêu cầu Doctor bị gián đoạn. Giữ riêng tư `state/openclaw.sqlite` và
`identity/device-auth.json`; chúng chứa cặp khóa thiết bị và các token
xác thực. Xác thực thiết bị vẫn nằm trong kho lưu trữ riêng và không được ghi lại bởi quá trình
di chuyển danh tính.

## Phê duyệt exec

`system.run` được kiểm soát bằng phê duyệt exec cục bộ:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, hoặc
  `~/.openclaw/exec-approvals.json` khi biến chưa được đặt
- [Phê duyệt exec](/vi/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (chỉnh sửa từ Gateway)

Đối với exec Node bất đồng bộ đã được phê duyệt, OpenClaw chuẩn bị một `systemRunPlan`
chuẩn trước khi nhắc phê duyệt. Lượt chuyển tiếp `system.run` đã được phê duyệt sau đó sẽ tái sử dụng kế hoạch
đã lưu này, vì vậy các chỉnh sửa đối với trường lệnh/cwd/phiên sau khi yêu cầu phê duyệt
được tạo sẽ bị từ chối thay vì thay đổi nội dung Node thực thi.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Các Node](/vi/nodes)
