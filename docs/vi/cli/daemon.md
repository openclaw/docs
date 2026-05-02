---
read_when:
    - Bạn vẫn dùng `openclaw daemon ...` trong các tập lệnh
    - Bạn cần các lệnh vòng đời dịch vụ (install/start/stop/restart/status)
summary: Tham chiếu CLI cho `openclaw daemon` (bí danh cũ để quản lý dịch vụ Gateway)
title: Tiến trình nền
x-i18n:
    generated_at: "2026-05-02T22:17:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Bí danh kế thừa cho các lệnh quản lý dịch vụ Gateway.

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

- `status`: hiển thị trạng thái cài đặt dịch vụ và kiểm tra tình trạng Gateway
- `install`: cài đặt dịch vụ (`launchd`/`systemd`/`schtasks`)
- `uninstall`: gỡ bỏ dịch vụ
- `start`: khởi động dịch vụ
- `stop`: dừng dịch vụ
- `restart`: khởi động lại dịch vụ

## Tùy chọn chung

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- vòng đời (`uninstall|start|stop`): `--json`

Ghi chú:

- `status` phân giải các SecretRefs xác thực đã cấu hình cho xác thực kiểm tra khi có thể.
- Nếu một SecretRef xác thực bắt buộc chưa được phân giải trong đường dẫn lệnh này, `daemon status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực kiểm tra thất bại; truyền rõ `--token`/`--password` hoặc phân giải nguồn bí mật trước.
- Nếu kiểm tra thành công, các cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh kết quả dương tính giả.
- `status --deep` thêm một lượt quét dịch vụ cấp hệ thống theo nỗ lực tốt nhất. Khi tìm thấy các dịch vụ giống gateway khác, đầu ra cho người dùng in gợi ý dọn dẹp và cảnh báo rằng một gateway trên mỗi máy vẫn là khuyến nghị thông thường.
- Trên các bản cài đặt Linux systemd, kiểm tra lệch `status` token bao gồm cả nguồn unit `Environment=` và `EnvironmentFile=`.
- Kiểm tra lệch phân giải SecretRefs `gateway.auth.token` bằng env runtime đã hợp nhất (env lệnh dịch vụ trước, rồi dự phòng về env tiến trình).
- Nếu xác thực token không thực sự hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt trong đó password có thể thắng và không có ứng viên token nào có thể thắng), kiểm tra lệch token sẽ bỏ qua phân giải token cấu hình.
- Khi xác thực token yêu cầu token và `gateway.auth.token` được quản lý bằng SecretRef, `install` xác thực rằng SecretRef có thể phân giải nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
- Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, cài đặt sẽ thất bại đóng.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa đặt, cài đặt sẽ bị chặn cho đến khi mode được đặt rõ ràng.
- Trên macOS, `install` giữ các plist LaunchAgent chỉ dành cho chủ sở hữu và tải các giá trị môi trường dịch vụ được quản lý thông qua một tệp và wrapper chỉ dành cho chủ sở hữu thay vì tuần tự hóa API key hoặc auth-profile env ref vào `EnvironmentVariables`.
- Nếu bạn cố ý chạy nhiều gateway trên một máy chủ, hãy cô lập cổng, cấu hình/trạng thái và workspace; xem [/gateway#multiple-gateways-same-host](/vi/gateway#multiple-gateways-same-host).

## Ưu tiên

Sử dụng [`openclaw gateway`](/vi/cli/gateway) cho tài liệu và ví dụ hiện tại.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runbook Gateway](/vi/gateway)
