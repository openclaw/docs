---
read_when:
    - Chạy host Node không giao diện
    - Ghép nối một Node không chạy macOS cho system.run
summary: Tài liệu tham khảo CLI cho `openclaw node` (máy chủ Node không giao diện)
title: Node
x-i18n:
    generated_at: "2026-04-29T22:33:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Chạy một **máy chủ Node không giao diện** kết nối tới Gateway WebSocket và cung cấp
`system.run` / `system.which` trên máy này.

## Vì sao dùng máy chủ Node?

Dùng máy chủ Node khi bạn muốn các agent **chạy lệnh trên các máy khác** trong
mạng của mình mà không cần cài đặt đầy đủ ứng dụng đồng hành macOS ở đó.

Các trường hợp sử dụng phổ biến:

- Chạy lệnh trên các máy Linux/Windows từ xa (máy chủ build, máy trong phòng lab, NAS).
- Giữ exec **trong sandbox** trên gateway, nhưng ủy quyền các lần chạy đã phê duyệt cho các máy chủ khác.
- Cung cấp một mục tiêu thực thi nhẹ, không giao diện cho tự động hóa hoặc các Node CI.

Việc thực thi vẫn được bảo vệ bởi **phê duyệt exec** và danh sách cho phép theo từng agent trên
máy chủ Node, nên bạn có thể giữ quyền truy cập lệnh trong phạm vi rõ ràng và tường minh.

## Proxy trình duyệt (không cần cấu hình)

Máy chủ Node tự động quảng bá proxy trình duyệt nếu `browser.enabled` không bị
tắt trên Node. Điều này cho phép agent dùng tự động hóa trình duyệt trên Node đó
mà không cần cấu hình thêm.

Theo mặc định, proxy cung cấp phạm vi hồ sơ trình duyệt thông thường của Node. Nếu bạn
đặt `nodeHost.browserProxy.allowProfiles`, proxy sẽ trở nên hạn chế:
việc nhắm tới hồ sơ không nằm trong danh sách cho phép sẽ bị từ chối, và các tuyến
tạo/xóa hồ sơ bền vững sẽ bị chặn qua proxy.

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

## Chạy (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Máy chủ Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng Gateway WebSocket (mặc định: `18789`)
- `--tls`: Dùng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè id của Node (xóa token ghép cặp)
- `--display-name <name>`: Ghi đè tên hiển thị của Node

## Xác thực Gateway cho máy chủ Node

`openclaw node run` và `openclaw node install` phân giải xác thực gateway từ config/env (không có cờ `--token`/`--password` trên các lệnh Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` được kiểm tra trước.
- Sau đó dùng dự phòng cấu hình cục bộ: `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ cục bộ, máy chủ Node cố ý không kế thừa `gateway.remote.token` / `gateway.remote.password`.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không phân giải được, phân giải xác thực Node sẽ đóng an toàn (không có dự phòng từ xa che lấp).
- Trong `gateway.mode=remote`, các trường client từ xa (`gateway.remote.token` / `gateway.remote.password`) cũng đủ điều kiện theo quy tắc ưu tiên từ xa.
- Phân giải xác thực máy chủ Node chỉ tôn trọng các biến env `OPENCLAW_GATEWAY_*`.

Với một Node kết nối tới Gateway `ws://` không phải loopback trên mạng riêng
đáng tin cậy, đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Nếu không có biến này, khởi động Node
sẽ đóng an toàn và yêu cầu bạn dùng `wss://`, đường hầm SSH, hoặc Tailscale.
Đây là một lựa chọn bật ở môi trường tiến trình, không phải khóa cấu hình `openclaw.json`.
`openclaw node install` sẽ lưu nó vào dịch vụ Node được giám sát khi nó
có mặt trong môi trường của lệnh cài đặt.

## Dịch vụ (nền)

Cài đặt một máy chủ Node không giao diện làm dịch vụ người dùng.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Máy chủ Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng Gateway WebSocket (mặc định: `18789`)
- `--tls`: Dùng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè id của Node (xóa token ghép cặp)
- `--display-name <name>`: Ghi đè tên hiển thị của Node
- `--runtime <runtime>`: Runtime dịch vụ (`node` hoặc `bun`)
- `--force`: Cài đặt lại/ghi đè nếu đã cài đặt

Quản lý dịch vụ:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Dùng `openclaw node run` cho máy chủ Node foreground (không có dịch vụ).

Các lệnh dịch vụ chấp nhận `--json` để xuất dữ liệu máy có thể đọc.

Máy chủ Node thử lại khi Gateway khởi động lại và khi mạng đóng ngay trong tiến trình. Nếu
Gateway báo một lần tạm dừng xác thực token/mật khẩu/bootstrap mang tính kết thúc, máy chủ Node
ghi log chi tiết đóng và thoát khác 0 để launchd/systemd có thể khởi động lại nó với
cấu hình và thông tin xác thực mới. Các lần tạm dừng yêu cầu ghép cặp vẫn ở trong
luồng foreground để yêu cầu đang chờ có thể được phê duyệt.

## Ghép cặp

Kết nối đầu tiên tạo một yêu cầu ghép cặp thiết bị đang chờ (`role: node`) trên Gateway.
Phê duyệt qua:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Trên các mạng Node được kiểm soát chặt chẽ, người vận hành Gateway có thể chọn bật rõ ràng
tự động phê duyệt ghép cặp Node lần đầu từ các CIDR đáng tin cậy:

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

Tính năng này bị tắt theo mặc định. Nó chỉ áp dụng cho ghép cặp `role: node` mới
không có phạm vi được yêu cầu. Client operator/browser, Control UI, WebChat, và các nâng cấp
vai trò, phạm vi, siêu dữ liệu, hoặc khóa công khai vẫn cần phê duyệt thủ công.

Nếu Node thử ghép cặp lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Máy chủ Node lưu id Node, token, tên hiển thị, và thông tin kết nối gateway trong
`~/.openclaw/node.json`.

## Phê duyệt exec

`system.run` được kiểm soát bằng phê duyệt exec cục bộ:

- `~/.openclaw/exec-approvals.json`
- [Phê duyệt exec](/vi/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (chỉnh sửa từ Gateway)

Với exec Node bất đồng bộ đã phê duyệt, OpenClaw chuẩn bị một `systemRunPlan`
chuẩn trước khi hỏi. Lần chuyển tiếp `system.run` đã phê duyệt sau đó dùng lại
kế hoạch đã lưu đó, nên các chỉnh sửa đối với trường command/cwd/session sau khi yêu cầu phê duyệt
được tạo sẽ bị từ chối thay vì thay đổi nội dung Node thực thi.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Nodes](/vi/nodes)
