---
read_when:
    - Chạy máy chủ Node không giao diện
    - Ghép nối một nút không chạy macOS cho system.run
summary: Tham chiếu CLI cho `openclaw node` (máy chủ nút headless)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:19:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Chạy một **máy chủ node không giao diện** kết nối tới Gateway WebSocket và cung cấp
`system.run` / `system.which` trên máy này.

## Vì sao dùng máy chủ node?

Dùng máy chủ node khi bạn muốn agent **chạy lệnh trên các máy khác** trong
mạng của mình mà không cần cài đặt đầy đủ ứng dụng đồng hành macOS ở đó.

Các trường hợp sử dụng phổ biến:

- Chạy lệnh trên các máy Linux/Windows từ xa (máy chủ build, máy phòng thí nghiệm, NAS).
- Giữ exec được **sandbox** trên gateway, nhưng ủy quyền các lượt chạy đã phê duyệt cho các máy chủ khác.
- Cung cấp một đích thực thi nhẹ, không giao diện cho tự động hóa hoặc các node CI.

Việc thực thi vẫn được bảo vệ bằng **phê duyệt exec** và danh sách cho phép theo từng agent trên
máy chủ node, nên bạn có thể giữ quyền truy cập lệnh ở phạm vi rõ ràng và tường minh.

## Proxy trình duyệt (không cần cấu hình)

Máy chủ node tự động quảng bá proxy trình duyệt nếu `browser.enabled` không bị
tắt trên node. Điều này cho phép agent dùng tự động hóa trình duyệt trên node đó
mà không cần cấu hình thêm.

Theo mặc định, proxy cung cấp bề mặt hồ sơ trình duyệt bình thường của node. Nếu bạn
đặt `nodeHost.browserProxy.allowProfiles`, proxy sẽ trở nên hạn chế:
việc nhắm mục tiêu hồ sơ không nằm trong danh sách cho phép sẽ bị từ chối, và các tuyến
tạo/xóa hồ sơ bền vững sẽ bị chặn qua proxy.

Tắt nó trên node nếu cần:

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
- `--tls`: Dùng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè id node (xóa token ghép đôi)
- `--display-name <name>`: Ghi đè tên hiển thị của node

## Xác thực Gateway cho máy chủ node

`openclaw node run` và `openclaw node install` phân giải xác thực gateway từ config/env (không có cờ `--token`/`--password` trên lệnh node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` được kiểm tra trước.
- Sau đó là phương án dự phòng cấu hình cục bộ: `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ cục bộ, máy chủ node cố ý không kế thừa `gateway.remote.token` / `gateway.remote.password`.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình tường minh qua SecretRef và không phân giải được, quá trình phân giải xác thực node sẽ từ chối theo mặc định (không có phương án dự phòng từ xa để che lấp).
- Trong `gateway.mode=remote`, các trường máy khách từ xa (`gateway.remote.token` / `gateway.remote.password`) cũng đủ điều kiện theo quy tắc ưu tiên từ xa.
- Phân giải xác thực máy chủ node chỉ tôn trọng các biến môi trường `OPENCLAW_GATEWAY_*`.

Đối với node kết nối tới Gateway `ws://` không mã hóa, loopback, literal IP riêng,
`.local`, và các máy chủ Tailnet `*.ts.net` được chấp nhận. Đối với các tên
DNS riêng đáng tin cậy khác, đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; nếu không
có biến này, khởi động node sẽ từ chối theo mặc định và yêu cầu bạn dùng `wss://`, đường hầm SSH, hoặc
Tailscale. Đây là lựa chọn tham gia ở môi trường tiến trình, không phải khóa cấu hình
`openclaw.json`.
`openclaw node install` lưu nó vào dịch vụ node được giám sát khi nó
có mặt trong môi trường lệnh cài đặt.

## Dịch vụ (nền)

Cài đặt máy chủ node không giao diện dưới dạng dịch vụ người dùng.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Máy chủ Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng Gateway WebSocket (mặc định: `18789`)
- `--tls`: Dùng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè id node (xóa token ghép đôi)
- `--display-name <name>`: Ghi đè tên hiển thị của node
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

Dùng `openclaw node run` cho máy chủ node chạy ở tiền cảnh (không có dịch vụ).

Các lệnh dịch vụ chấp nhận `--json` để xuất dữ liệu máy đọc được.

Máy chủ node thử lại khi Gateway khởi động lại và khi mạng đóng trong cùng tiến trình. Nếu
Gateway báo một lần tạm dừng xác thực token/password/bootstrap có tính kết thúc, máy chủ node
ghi chi tiết đóng vào log và thoát với mã khác không để launchd/systemd có thể khởi động lại với
cấu hình và thông tin xác thực mới. Các lần tạm dừng yêu cầu ghép đôi vẫn ở trong luồng
tiền cảnh để yêu cầu đang chờ có thể được phê duyệt.

## Ghép đôi

Kết nối đầu tiên tạo một yêu cầu ghép đôi thiết bị đang chờ (`role: node`) trên Gateway.
Phê duyệt bằng:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Trên các mạng node được kiểm soát chặt chẽ, toán tử Gateway có thể chọn tham gia tường minh
để tự động phê duyệt ghép đôi node lần đầu từ các CIDR đáng tin cậy:

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

Tính năng này bị tắt theo mặc định. Nó chỉ áp dụng cho ghép đôi `role: node` mới
không có scope được yêu cầu. Máy khách toán tử/trình duyệt, Control UI, WebChat, và các nâng cấp vai trò,
scope, siêu dữ liệu, hoặc khóa công khai vẫn yêu cầu phê duyệt thủ công.

Nếu node thử ghép đôi lại với chi tiết xác thực đã thay đổi (vai trò/scope/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Máy chủ node lưu id node, token, tên hiển thị, và thông tin kết nối gateway trong
`~/.openclaw/node.json`.

## Phê duyệt exec

`system.run` được kiểm soát bằng phê duyệt exec cục bộ:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, hoặc
  `~/.openclaw/exec-approvals.json` khi biến chưa được đặt
- [Phê duyệt exec](/vi/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (chỉnh sửa từ Gateway)

Đối với exec node bất đồng bộ đã được phê duyệt, OpenClaw chuẩn bị một `systemRunPlan`
chuẩn trước khi nhắc phê duyệt. Lượt chuyển tiếp `system.run` đã được phê duyệt sau đó dùng lại
kế hoạch đã lưu đó, nên các chỉnh sửa đối với trường command/cwd/session sau khi yêu cầu phê duyệt
đã được tạo sẽ bị từ chối thay vì thay đổi nội dung mà node thực thi.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Node](/vi/nodes)
