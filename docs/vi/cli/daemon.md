---
read_when:
    - Bạn vẫn dùng `openclaw daemon ...` trong các tập lệnh
    - Bạn cần các lệnh quản lý vòng đời dịch vụ (install/start/stop/restart/status)
summary: Tham chiếu CLI cho `openclaw daemon` (bí danh cũ cho việc quản lý dịch vụ Gateway)
title: Tiến trình nền
x-i18n:
    generated_at: "2026-05-11T20:25:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Bí danh cũ cho các lệnh quản lý dịch vụ Gateway.

`openclaw daemon ...` ánh xạ tới cùng giao diện điều khiển dịch vụ như các lệnh dịch vụ `openclaw gateway ...`.

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
- Nếu một SecretRef xác thực bắt buộc chưa được phân giải trong đường dẫn lệnh này, `daemon status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực thăm dò thất bại; truyền rõ `--token`/`--password` hoặc phân giải nguồn bí mật trước.
- Nếu thăm dò thành công, cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh kết quả dương tính giả.
- `status --deep` thêm một lượt quét dịch vụ cấp hệ thống theo nỗ lực tốt nhất. Khi tìm thấy các dịch vụ giống gateway khác, đầu ra cho người dùng in gợi ý dọn dẹp và cảnh báo rằng một gateway trên mỗi máy vẫn là khuyến nghị thông thường.
- `status --deep` cũng chạy xác thực cấu hình ở chế độ nhận biết plugin và hiển thị cảnh báo manifest plugin đã cấu hình (ví dụ thiếu siêu dữ liệu cấu hình kênh) để các kiểm tra smoke khi cài đặt và cập nhật bắt được chúng. `status` mặc định giữ đường dẫn chỉ đọc nhanh, bỏ qua xác thực plugin.
- Trên các bản cài đặt Linux systemd, kiểm tra trôi `status` token bao gồm cả nguồn unit `Environment=` và `EnvironmentFile=`.
- Kiểm tra trôi phân giải SecretRefs `gateway.auth.token` bằng env runtime đã hợp nhất (env lệnh dịch vụ trước, sau đó dự phòng về env tiến trình).
- Nếu xác thực token không thực sự hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt trong đó password có thể thắng và không có ứng viên token nào có thể thắng), kiểm tra trôi token sẽ bỏ qua việc phân giải token cấu hình.
- Khi xác thực token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `install` xác thực rằng SecretRef có thể phân giải nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
- Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, quá trình cài đặt sẽ thất bại đóng.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa đặt, quá trình cài đặt bị chặn cho đến khi mode được đặt rõ ràng.
- Trên macOS, `install` giữ các plist LaunchAgent chỉ thuộc sở hữu của chủ sở hữu và tải các giá trị môi trường dịch vụ được quản lý thông qua một tệp và wrapper chỉ dành cho chủ sở hữu thay vì tuần tự hóa khóa API hoặc tham chiếu env auth-profile vào `EnvironmentVariables`.
- Nếu bạn cố ý chạy nhiều gateway trên một máy chủ, hãy cô lập cổng, cấu hình/trạng thái và workspace; xem [/gateway#multiple-gateways-same-host](/vi/gateway#multiple-gateways-same-host).
- `restart --safe` yêu cầu Gateway đang chạy kiểm tra trước công việc đang hoạt động và lên lịch một lần khởi động lại được gộp sau khi công việc đang hoạt động rút hết. `restart` thuần giữ hành vi trình quản lý dịch vụ hiện có; `--force` vẫn là đường dẫn ghi đè ngay lập tức.
- `restart --safe --skip-deferral` chạy khởi động lại an toàn có nhận biết OpenClaw nhưng bỏ qua cổng trì hoãn công việc đang hoạt động để Gateway phát lệnh khởi động lại ngay cả khi có báo cáo blocker. Đây là cửa thoát cho operator khi một lần chạy tác vụ bị kẹt ghim quá trình khởi động lại an toàn; yêu cầu `--safe`.

## Nên dùng

Dùng [`openclaw gateway`](/vi/cli/gateway) cho tài liệu và ví dụ hiện tại.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runbook Gateway](/vi/gateway)
