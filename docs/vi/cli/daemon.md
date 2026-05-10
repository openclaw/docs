---
read_when:
    - Bạn vẫn sử dụng `openclaw daemon ...` trong các tập lệnh
    - Bạn cần các lệnh vòng đời dịch vụ (install/start/stop/restart/status)
summary: Tài liệu tham khảo CLI cho `openclaw daemon` (bí danh cũ để quản lý dịch vụ Gateway)
title: Tiến trình nền
x-i18n:
    generated_at: "2026-05-10T19:27:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Bí danh cũ cho các lệnh quản lý dịch vụ Gateway.

`openclaw daemon ...` ánh xạ tới cùng bề mặt điều khiển dịch vụ như các lệnh dịch vụ `openclaw gateway ...`.

## Cách sử dụng

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
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- vòng đời (`uninstall|start|stop`): `--json`

Ghi chú:

- `status` phân giải các SecretRefs xác thực đã cấu hình cho xác thực thăm dò khi có thể.
- Nếu SecretRef xác thực bắt buộc chưa được phân giải trong đường dẫn lệnh này, `daemon status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực thăm dò thất bại; truyền `--token`/`--password` rõ ràng hoặc phân giải nguồn bí mật trước.
- Nếu thăm dò thành công, các cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh báo động sai.
- `status --deep` thêm một lần quét dịch vụ cấp hệ thống theo khả năng tốt nhất. Khi tìm thấy các dịch vụ giống gateway khác, đầu ra cho người đọc sẽ in gợi ý dọn dẹp và cảnh báo rằng một gateway trên mỗi máy vẫn là khuyến nghị thông thường.
- Trên các bản cài đặt Linux systemd, kiểm tra token-drift của `status` bao gồm cả nguồn unit `Environment=` và `EnvironmentFile=`.
- Kiểm tra sai lệch phân giải SecretRefs `gateway.auth.token` bằng env thời gian chạy đã hợp nhất (env của lệnh dịch vụ trước, rồi dự phòng sang env của tiến trình).
- Nếu xác thực bằng token không thực sự hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt trong trường hợp mật khẩu có thể thắng và không có ứng viên token nào có thể thắng), kiểm tra token-drift sẽ bỏ qua việc phân giải token cấu hình.
- Khi xác thực bằng token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `install` xác thực rằng SecretRef có thể phân giải nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
- Nếu xác thực bằng token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, quá trình cài đặt sẽ thất bại theo hướng đóng.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa đặt, quá trình cài đặt sẽ bị chặn cho đến khi mode được đặt rõ ràng.
- Trên macOS, `install` giữ LaunchAgent plists chỉ dành cho chủ sở hữu và tải các giá trị môi trường dịch vụ được quản lý thông qua một tệp và wrapper chỉ dành cho chủ sở hữu, thay vì tuần tự hóa khóa API hoặc tham chiếu env của hồ sơ xác thực vào `EnvironmentVariables`.
- Nếu bạn cố ý chạy nhiều gateway trên một máy chủ, hãy tách biệt cổng, cấu hình/trạng thái và không gian làm việc; xem [/gateway#multiple-gateways-same-host](/vi/gateway#multiple-gateways-same-host).
- `restart --safe` yêu cầu Gateway đang chạy kiểm tra trước công việc đang hoạt động và lên lịch một lần khởi động lại được gộp sau khi công việc đang hoạt động rút hết. `restart` thông thường giữ hành vi hiện có của trình quản lý dịch vụ; `--force` vẫn là đường dẫn ghi đè tức thời.
- `restart --safe --skip-deferral` chạy khởi động lại an toàn có nhận biết OpenClaw nhưng bỏ qua cổng trì hoãn công việc đang hoạt động để Gateway phát lệnh khởi động lại ngay cả khi có tác nhân chặn được báo cáo. Đây là lối thoát cho người vận hành khi một lần chạy tác vụ bị kẹt ghim giữ khởi động lại an toàn; yêu cầu `--safe`.

## Nên dùng

Dùng [`openclaw gateway`](/vi/cli/gateway) cho tài liệu và ví dụ hiện tại.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Sổ tay vận hành Gateway](/vi/gateway)
