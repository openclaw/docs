---
read_when:
    - Bạn vẫn sử dụng `openclaw daemon ...` trong các tập lệnh
    - Bạn cần các lệnh vòng đời dịch vụ (install/start/stop/restart/status)
summary: Tham chiếu CLI cho `openclaw daemon` (bí danh cũ cho quản lý dịch vụ Gateway)
title: Trình nền
x-i18n:
    generated_at: "2026-06-30T14:09:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Bí danh kế thừa cho các lệnh quản lý dịch vụ Gateway.

`openclaw daemon ...` ánh xạ tới cùng bề mặt điều khiển dịch vụ như các lệnh dịch vụ `openclaw gateway ...`.

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

- `status`: hiển thị trạng thái cài đặt dịch vụ và kiểm tra sức khỏe Gateway
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

- `status` phân giải các SecretRefs xác thực đã cấu hình cho xác thực kiểm tra khi có thể.
- Nếu một SecretRef xác thực bắt buộc chưa được phân giải trong đường dẫn lệnh này, `daemon status --json` báo cáo `rpc.authWarning` khi kết nối/xác thực kiểm tra thất bại; truyền rõ `--token`/`--password` hoặc phân giải nguồn bí mật trước.
- Nếu kiểm tra thành công, các cảnh báo auth-ref chưa phân giải sẽ bị ẩn để tránh báo động giả.
- `status --deep` thêm một lượt quét dịch vụ cấp hệ thống theo khả năng tốt nhất. Khi tìm thấy các dịch vụ giống Gateway khác, đầu ra dành cho người đọc sẽ in gợi ý dọn dẹp và cảnh báo rằng một Gateway trên mỗi máy vẫn là khuyến nghị thông thường.
- `status --deep` cũng chạy xác thực cấu hình ở chế độ nhận biết Plugin và hiển thị cảnh báo manifest Plugin đã cấu hình (ví dụ thiếu siêu dữ liệu cấu hình kênh) để các kiểm tra smoke cài đặt và cập nhật phát hiện được chúng. `status` mặc định giữ đường dẫn chỉ đọc nhanh, bỏ qua xác thực Plugin.
- Trên các bản cài đặt Linux systemd, kiểm tra sai lệch token của `status` bao gồm cả nguồn unit `Environment=` và `EnvironmentFile=`.
- Kiểm tra sai lệch phân giải các SecretRefs `gateway.auth.token` bằng env runtime đã hợp nhất (env lệnh dịch vụ trước, rồi dự phòng bằng env tiến trình).
- Nếu xác thực token không thực sự hoạt động (`gateway.auth.mode` rõ ràng là `password`/`none`/`trusted-proxy`, hoặc mode chưa đặt trong trường hợp mật khẩu có thể thắng và không có ứng viên token nào có thể thắng), kiểm tra sai lệch token sẽ bỏ qua phân giải token cấu hình.
- Khi xác thực token yêu cầu token và `gateway.auth.token` do SecretRef quản lý, `install` xác thực rằng SecretRef có thể phân giải được nhưng không lưu token đã phân giải vào siêu dữ liệu môi trường dịch vụ.
- Nếu xác thực token yêu cầu token và SecretRef token đã cấu hình chưa được phân giải, cài đặt sẽ thất bại đóng.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa đặt, cài đặt sẽ bị chặn cho tới khi mode được đặt rõ ràng.
- Trên macOS, `install` giữ các plist LaunchAgent chỉ dành cho chủ sở hữu và tải các giá trị môi trường dịch vụ được quản lý qua một tệp và wrapper chỉ dành cho chủ sở hữu thay vì tuần tự hóa API keys hoặc tham chiếu env hồ sơ xác thực vào `EnvironmentVariables`.
- Nếu bạn chủ ý chạy nhiều Gateway trên một host, hãy cô lập cổng, cấu hình/trạng thái và workspace; xem [/gateway#multiple-gateways-same-host](/vi/gateway#multiple-gateways-same-host).
- `restart --safe` yêu cầu Gateway đang chạy kiểm tra trước công việc đang hoạt động và lên lịch một lần khởi động lại đã gộp sau khi công việc đang hoạt động thoát hết. Khởi động lại an toàn mặc định chờ công việc đang hoạt động tối đa theo `gateway.reload.deferralTimeoutMs` đã cấu hình (mặc định 5 phút); khi hết ngân sách đó, khởi động lại sẽ bị ép buộc. Đặt `gateway.reload.deferralTimeoutMs` thành `0` để chờ an toàn vô thời hạn và không bao giờ ép buộc. `restart` thuần giữ hành vi trình quản lý dịch vụ hiện có; `--force` vẫn là đường dẫn ghi đè tức thì.
- `restart --safe --skip-deferral` chạy khởi động lại an toàn nhận biết OpenClaw nhưng bỏ qua cổng trì hoãn công việc đang hoạt động để Gateway phát khởi động lại ngay cả khi có báo cáo blocker. Đây là lối thoát cho operator khi một lần chạy tác vụ bị kẹt giữ khởi động lại an toàn; yêu cầu `--safe`.

## Nên dùng

Dùng [`openclaw gateway`](/vi/cli/gateway) cho tài liệu và ví dụ hiện tại.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Runbook Gateway](/vi/gateway)
