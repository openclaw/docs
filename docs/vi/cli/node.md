---
read_when:
    - Chạy máy chủ node không giao diện
    - Ghép nối một nút không chạy macOS cho system.run
summary: Tham chiếu CLI cho `openclaw node` (máy chủ node không giao diện)
title: Node
x-i18n:
    generated_at: "2026-07-01T13:06:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Chạy một **node host không giao diện** kết nối tới Gateway WebSocket và cung cấp
`system.run` / `system.which` trên máy này.

## Vì sao dùng node host?

Dùng node host khi bạn muốn agent **chạy lệnh trên các máy khác** trong
mạng của mình mà không cần cài đặt đầy đủ ứng dụng đồng hành macOS ở đó.

Các trường hợp sử dụng phổ biến:

- Chạy lệnh trên các máy Linux/Windows từ xa (máy chủ build, máy trong phòng lab, NAS).
- Giữ exec được **sandbox** trên gateway, nhưng ủy quyền các lần chạy đã được phê duyệt cho host khác.
- Cung cấp một đích thực thi nhẹ, không giao diện cho tự động hóa hoặc node CI.

Việc thực thi vẫn được bảo vệ bằng **phê duyệt exec** và allowlist theo từng agent trên
node host, vì vậy bạn có thể giữ phạm vi truy cập lệnh rõ ràng và có kiểm soát.

## Proxy trình duyệt (không cần cấu hình)

Node host tự động quảng bá một proxy trình duyệt nếu `browser.enabled` không bị
tắt trên node. Điều này cho phép agent dùng tự động hóa trình duyệt trên node đó
mà không cần cấu hình thêm.

Theo mặc định, proxy cung cấp bề mặt hồ sơ trình duyệt thông thường của node. Nếu bạn
đặt `nodeHost.browserProxy.allowProfiles`, proxy sẽ trở nên hạn chế:
việc nhắm tới hồ sơ không nằm trong allowlist sẽ bị từ chối, và các route
tạo/xóa hồ sơ bền vững sẽ bị chặn qua proxy.

Tắt proxy trên node nếu cần:

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

- `--host <host>`: Host Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng Gateway WebSocket (mặc định: `18789`)
- `--context-path <path>`: Đường dẫn ngữ cảnh Gateway WebSocket (ví dụ: `/openclaw-gw`). Được nối vào URL WebSocket.
- `--tls`: Dùng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè id node (xóa token ghép nối)
- `--display-name <name>`: Ghi đè tên hiển thị của node

## Xác thực Gateway cho node host

`openclaw node run` và `openclaw node install` phân giải xác thực gateway từ config/env (không có cờ `--token`/`--password` trên lệnh node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` được kiểm tra trước.
- Sau đó là fallback cấu hình cục bộ: `gateway.auth.token` / `gateway.auth.password`.
- Ở chế độ cục bộ, node host cố ý không kế thừa `gateway.remote.token` / `gateway.remote.password`.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình tường minh qua SecretRef và không phân giải được, quá trình phân giải xác thực node sẽ fail closed (không có fallback từ xa che lấp).
- Trong `gateway.mode=remote`, các trường client từ xa (`gateway.remote.token` / `gateway.remote.password`) cũng đủ điều kiện theo quy tắc ưu tiên từ xa.
- Phân giải xác thực node host chỉ tôn trọng các biến env `OPENCLAW_GATEWAY_*`.

Đối với node kết nối tới Gateway `ws://` plaintext, loopback, literal IP riêng,
`.local`, và host Tailnet `*.ts.net` được chấp nhận. Với các tên private-DNS
đáng tin cậy khác, đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; nếu không có
nó, quá trình khởi động node sẽ fail closed và yêu cầu bạn dùng `wss://`, tunnel SSH, hoặc
Tailscale. Đây là lựa chọn opt-in theo môi trường tiến trình, không phải khóa cấu hình
`openclaw.json`.
`openclaw node install` sẽ lưu nó vào dịch vụ node được giám sát khi nó
có mặt trong môi trường của lệnh install.

## Dịch vụ (background)

Cài đặt node host không giao diện dưới dạng dịch vụ người dùng.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Tùy chọn:

- `--host <host>`: Host Gateway WebSocket (mặc định: `127.0.0.1`)
- `--port <port>`: Cổng Gateway WebSocket (mặc định: `18789`)
- `--context-path <path>`: Đường dẫn ngữ cảnh Gateway WebSocket (ví dụ: `/openclaw-gw`). Được nối vào URL WebSocket.
- `--tls`: Dùng TLS cho kết nối gateway
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS mong đợi (sha256)
- `--node-id <id>`: Ghi đè id node (xóa token ghép nối)
- `--display-name <name>`: Ghi đè tên hiển thị của node
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

Dùng `openclaw node run` cho node host chạy foreground (không có dịch vụ).

Các lệnh dịch vụ chấp nhận `--json` để xuất dữ liệu máy đọc được.

Node host thử lại khi Gateway khởi động lại và khi mạng đóng kết nối trong tiến trình. Nếu
Gateway báo cáo một lần tạm dừng xác thực token/password/bootstrap mang tính kết thúc, node host
ghi log chi tiết đóng kết nối và thoát với mã khác không để launchd/systemd có thể khởi động lại nó với
cấu hình và thông tin xác thực mới. Các lần tạm dừng yêu cầu ghép nối vẫn ở trong
luồng foreground để yêu cầu đang chờ có thể được phê duyệt.

## Ghép nối

Kết nối đầu tiên tạo một yêu cầu ghép nối thiết bị đang chờ (`role: node`) trên Gateway.
Phê duyệt bằng:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Trên các mạng node được kiểm soát chặt chẽ, operator Gateway có thể opt in rõ ràng
để tự động phê duyệt ghép nối node lần đầu từ các CIDR đáng tin cậy:

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

Tính năng này bị tắt theo mặc định. Nó chỉ áp dụng cho ghép nối `role: node` mới
không có scope được yêu cầu. Client operator/trình duyệt, Control UI, WebChat, và các nâng cấp role,
scope, metadata, hoặc khóa công khai vẫn yêu cầu phê duyệt thủ công.

Nếu node thử lại ghép nối với chi tiết xác thực đã thay đổi (role/scope/khóa công khai),
yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo.
Chạy lại `openclaw devices list` trước khi phê duyệt.

Node host lưu id node, token, tên hiển thị, và thông tin kết nối gateway trong
`~/.openclaw/node.json`.

## Phê duyệt exec

`system.run` được kiểm soát bởi phê duyệt exec cục bộ:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, hoặc
  `~/.openclaw/exec-approvals.json` khi biến này chưa được đặt
- [Phê duyệt exec](/vi/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (chỉnh sửa từ Gateway)

Đối với exec node bất đồng bộ đã được phê duyệt, OpenClaw chuẩn bị một `systemRunPlan`
chuẩn trước khi nhắc xác nhận. Lần chuyển tiếp `system.run` được phê duyệt sau đó sẽ dùng lại
kế hoạch đã lưu đó, vì vậy các chỉnh sửa đối với trường command/cwd/session sau khi yêu cầu phê duyệt
được tạo sẽ bị từ chối thay vì thay đổi nội dung node thực thi.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Node](/vi/nodes)
