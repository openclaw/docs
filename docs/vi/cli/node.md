---
read_when:
    - Chạy máy chủ Node không giao diện
    - Ghép nối Node không phải macOS cho system.run
summary: Tài liệu tham chiếu CLI cho `openclaw node` (máy chủ Node không giao diện)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Chạy một **máy chủ Node không giao diện** kết nối tới Gateway WebSocket và cung cấp
`system.run` / `system.which` trên máy này.

## Vì sao dùng máy chủ Node?

Dùng máy chủ Node khi bạn muốn các tác nhân **chạy lệnh trên các máy khác** trong
mạng của mình mà không cần cài đặt ứng dụng đồng hành macOS đầy đủ ở đó.

Các trường hợp sử dụng phổ biến:

- Chạy lệnh trên các máy Linux/Windows từ xa (máy chủ build, máy trong phòng thí nghiệm, NAS).
- Giữ phần exec **được cách ly** trên Gateway, nhưng ủy quyền các lần chạy đã được phê duyệt cho các máy chủ khác.
- Cung cấp một đích thực thi nhẹ, không giao diện cho tự động hóa hoặc các Node CI.

Việc thực thi vẫn được bảo vệ bằng **phê duyệt exec** và danh sách cho phép theo từng tác nhân trên
máy chủ Node, nên bạn có thể giữ quyền truy cập lệnh có phạm vi rõ ràng và tường minh.

## Proxy trình duyệt (không cần cấu hình)

Máy chủ Node tự động quảng bá proxy trình duyệt nếu `browser.enabled` không bị
tắt trên Node. Điều này cho phép tác nhân dùng tự động hóa trình duyệt trên Node đó
mà không cần cấu hình thêm.

Theo mặc định, proxy cung cấp bề mặt hồ sơ trình duyệt thông thường của Node. Nếu bạn
đặt `nodeHost.browserProxy.allowProfiles`, proxy sẽ trở nên hạn chế:
việc nhắm tới hồ sơ không nằm trong danh sách cho phép sẽ bị từ chối, và các route
tạo/xóa hồ sơ bền vững sẽ bị chặn qua proxy.

Tắt proxy trên Node nếu cần:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Chạy (nền trước)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: máy chủ Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: cổng Gateway WebSocket (mặc định: `18789`)
- `--tls`: Dùng TLS cho kết nối Gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS kỳ vọng (sha256)
- `--node-id <id>`: Ghi đè id Node (xóa mã thông báo ghép nối)
- `--display-name <name>`: Ghi đè tên hiển thị của Node

## Xác thực Gateway cho máy chủ Node

`openclaw node run` và `openclaw node install` phân giải xác thực Gateway từ cấu hình/env (không có cờ `--token`/`--password` trên các lệnh Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` được kiểm tra trước.
- Sau đó dùng cấu hình cục bộ dự phòng: `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ cục bộ, máy chủ Node cố ý không kế thừa `gateway.remote.token` / `gateway.remote.password`.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình tường minh qua SecretRef và chưa phân giải, quá trình phân giải xác thực Node sẽ đóng theo hướng an toàn (không bị dự phòng từ xa che lấp).
- Trong `gateway.mode=remote`, các trường máy khách từ xa (`gateway.remote.token` / `gateway.remote.password`) cũng đủ điều kiện theo quy tắc ưu tiên từ xa.
- Phân giải xác thực máy chủ Node chỉ tôn trọng các biến env `OPENCLAW_GATEWAY_*`.

Đối với một Node kết nối tới Gateway `ws://` không phải loopback trên một mạng riêng
đáng tin cậy, hãy đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Nếu không có, quá trình khởi động Node
sẽ đóng theo hướng an toàn và yêu cầu bạn dùng `wss://`, đường hầm SSH, hoặc Tailscale.
Đây là tùy chọn bật qua môi trường tiến trình, không phải khóa cấu hình `openclaw.json`.
`openclaw node install` lưu tùy chọn này vào dịch vụ Node được giám sát khi nó
có mặt trong môi trường của lệnh cài đặt.

## Dịch vụ (nền sau)

Cài đặt máy chủ Node không giao diện dưới dạng dịch vụ người dùng.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: máy chủ Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: cổng Gateway WebSocket (mặc định: `18789`)
- `--tls`: Dùng TLS cho kết nối Gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS kỳ vọng (sha256)
- `--node-id <id>`: Ghi đè id Node (xóa mã thông báo ghép nối)
- `--display-name <name>`: Ghi đè tên hiển thị của Node
- `--runtime <runtime>`: Runtime dịch vụ (`node` hoặc `bun`)
- `--force`: Cài đặt lại/ghi đè nếu đã được cài đặt

Quản lý dịch vụ:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Dùng `openclaw node run` cho máy chủ Node chạy ở nền trước (không có dịch vụ).

Các lệnh dịch vụ chấp nhận `--json` để xuất dữ liệu máy đọc được.

Máy chủ Node thử lại khi Gateway khởi động lại và khi mạng đóng kết nối ngay trong tiến trình. Nếu
Gateway báo một lần tạm dừng xác thực token/password/bootstrap mang tính kết thúc, máy chủ Node
ghi chi tiết đóng kết nối vào log và thoát với mã khác không để launchd/systemd có thể khởi động lại nó với
cấu hình và thông tin xác thực mới. Các lần tạm dừng yêu cầu ghép nối vẫn ở trong
luồng nền trước để yêu cầu đang chờ có thể được phê duyệt.

## Ghép nối

Kết nối đầu tiên tạo một yêu cầu ghép nối thiết bị đang chờ (`role: node`) trên Gateway.
Phê duyệt bằng:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Trên các mạng Node được kiểm soát chặt chẽ, người vận hành Gateway có thể chủ động bật
tự động phê duyệt ghép nối Node lần đầu từ các CIDR đáng tin cậy:

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

Tùy chọn này mặc định bị tắt. Nó chỉ áp dụng cho ghép nối `role: node` mới
không có phạm vi được yêu cầu. Máy khách người vận hành/trình duyệt, Control UI, WebChat, cũng như các nâng cấp vai trò,
phạm vi, siêu dữ liệu, hoặc khóa công khai vẫn yêu cầu phê duyệt thủ công.

Nếu Node thử ghép nối lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Máy chủ Node lưu id Node, mã thông báo, tên hiển thị và thông tin kết nối Gateway trong
`~/.openclaw/node.json`.

## Phê duyệt exec

`system.run` được kiểm soát bằng phê duyệt exec cục bộ:

- `~/.openclaw/exec-approvals.json`
- [Phê duyệt exec](/vi/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (chỉnh sửa từ Gateway)

Đối với exec Node bất đồng bộ đã được phê duyệt, OpenClaw chuẩn bị một `systemRunPlan`
chuẩn trước khi nhắc xác nhận. Lệnh chuyển tiếp `system.run` đã được phê duyệt sau đó dùng lại
kế hoạch đã lưu đó, nên các chỉnh sửa đối với trường lệnh/cwd/phiên sau khi yêu cầu phê duyệt
được tạo sẽ bị từ chối thay vì thay đổi nội dung Node thực thi.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Node](/vi/nodes)
