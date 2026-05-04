---
read_when:
    - Bạn vẫn sử dụng `openclaw daemon ...` trong các tập lệnh
    - Bạn cần các lệnh vòng đời dịch vụ (install/start/stop/restart/status)
summary: Tham chiếu CLI cho `openclaw daemon` (bí danh cũ để quản lý dịch vụ Gateway)
title: Tiến trình nền
x-i18n:
    generated_at: "2026-05-04T18:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Bí danh kế thừa cho các lệnh quản lý dịch vụ Gateway.

`openclaw daemon ...` ánh xạ tới cùng giao diện điều khiển dịch vụ như các lệnh dịch vụ `openclaw gateway ...`.

## Cách dùng

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Lệnh con

- `status`: hiển thị trạng thái cài đặt dịch vụ và thăm dò tình trạng Gateway
- `install`: cài đặt dịch vụ (`launchd`/`systemd`/`schtasks`)
- `uninstall`: gỡ bỏ dịch vụ
- `start`: khởi động dịch vụ
- `stop`: dừng dịch vụ
- `restart`: khởi động lại dịch vụ

## Tùy chọn thường dùng

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- vòng đời (`uninstall|start|stop`): `--json`

Ghi chú:

- `status` phân giải các SecretRef xác thực đã cấu hình để xác thực thăm dò khi có thể.
- Nếu một SecretRef xác thực bắt buộc chưa được phân giải trong đường dẫn lệnh này, `daemon status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực thăm dò thất bại; truyền rõ `--token`/`--password` hoặc phân giải nguồn bí mật trước.
- Nếu thăm dò thành công, các cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh báo dương tính giả.
- `status --deep` thêm một lần quét dịch vụ cấp hệ thống theo khả năng tốt nhất. Khi tìm thấy các dịch vụ giống Gateway khác, đầu ra cho người dùng sẽ in gợi ý dọn dẹp và cảnh báo rằng một Gateway trên mỗi máy vẫn là khuyến nghị thông thường.
- Trên các bản cài đặt systemd Linux, kiểm tra lệch token của `status` bao gồm cả nguồn đơn vị `Environment=` và `EnvironmentFile=`.
- Kiểm tra lệch phân giải SecretRef `gateway.auth.token` bằng env thời gian chạy đã hợp nhất (env lệnh dịch vụ trước, sau đó dự phòng bằng env tiến trình).
- Nếu xác thực token không thực sự hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc chưa đặt chế độ trong đó mật khẩu có thể thắng và không ứng viên token nào có thể thắng), kiểm tra lệch token sẽ bỏ qua phân giải token cấu hình.
- Khi xác thực token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `install` xác thực rằng SecretRef có thể phân giải được nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
- Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, cài đặt sẽ thất bại theo hướng đóng.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, cài đặt sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.
- Trên macOS, `install` giữ các plist LaunchAgent chỉ thuộc sở hữu của chủ sở hữu và tải các giá trị môi trường dịch vụ được quản lý thông qua một tệp và wrapper chỉ dành cho chủ sở hữu, thay vì tuần tự hóa khóa API hoặc tham chiếu env hồ sơ xác thực vào `EnvironmentVariables`.
- Nếu bạn cố ý chạy nhiều Gateway trên một máy chủ, hãy tách biệt cổng, cấu hình/trạng thái và workspace; xem [/gateway#multiple-gateways-same-host](/vi/gateway#multiple-gateways-same-host).
- `restart --safe` yêu cầu Gateway đang chạy kiểm tra trước công việc đang hoạt động và lên lịch một lần khởi động lại đã gộp sau khi công việc đang hoạt động rút hết. `restart` thuần giữ hành vi hiện có của trình quản lý dịch vụ; `--force` vẫn là đường dẫn ghi đè tức thì.

## Nên dùng

Dùng [`openclaw gateway`](/vi/cli/gateway) cho tài liệu và ví dụ hiện tại.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Sổ tay vận hành Gateway](/vi/gateway)
