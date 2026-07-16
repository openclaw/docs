---
read_when:
    - Bạn vẫn sử dụng `openclaw daemon ...` trong các tập lệnh
    - Bạn cần các lệnh quản lý vòng đời dịch vụ (cài đặt/khởi động/dừng/khởi động lại/trạng thái)
summary: Tham chiếu CLI cho `openclaw daemon` (bí danh cũ để quản lý dịch vụ Gateway)
title: Tiến trình nền
x-i18n:
    generated_at: "2026-07-16T15:03:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Bí danh cũ để quản lý dịch vụ Gateway. `openclaw daemon ...` ánh xạ đến cùng các lệnh điều khiển dịch vụ như `openclaw gateway ...`. Ưu tiên [`openclaw gateway`](/vi/cli/gateway) để xem tài liệu và ví dụ hiện tại.

## Cách sử dụng

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Lệnh con và tùy chọn

| Lệnh con  | Tùy chọn                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (chỉ launchd: liên tục vô hiệu hóa KeepAlive/RunAtLoad cho đến lần khởi động tiếp theo) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: hiển thị trạng thái cài đặt dịch vụ (launchd/systemd/schtasks) và thăm dò tình trạng Gateway.
- `install`: cài đặt dịch vụ; `--force` cài đặt lại/ghi đè một bản cài đặt hiện có.
- `restart --safe`: yêu cầu Gateway đang chạy kiểm tra sơ bộ công việc đang hoạt động và lên lịch một lần khởi động lại được hợp nhất sau khi công việc hoàn tất, trong giới hạn `gateway.reload.deferralTimeoutMs` (mặc định 300000ms/5 phút; đặt thành `0` để chờ vô thời hạn). Khi hết khoảng thời gian này, việc khởi động lại vẫn bị buộc thực hiện. `restart` thông thường sử dụng trực tiếp trình quản lý dịch vụ; `--force` là tùy chọn ghi đè để thực hiện ngay lập tức.
- `restart --safe --skip-deferral`: bỏ qua cổng trì hoãn do công việc đang hoạt động để Gateway khởi động lại ngay cả khi có báo cáo về yếu tố cản trở. Yêu cầu `--safe`.

## Ghi chú

- `status` phân giải các SecretRef xác thực đã cấu hình để xác thực thăm dò khi có thể. Nếu một SecretRef bắt buộc chưa được phân giải, `status --json` báo cáo `rpc.authWarning`; hãy truyền rõ ràng `--token`/`--password` hoặc phân giải nguồn bí mật trước. Cảnh báo xác thực chưa được phân giải sẽ bị ẩn khi phép thăm dò thành công ở các khía cạnh khác.
- `status --deep` bổ sung thao tác quét cấp hệ thống theo khả năng tốt nhất để tìm các dịch vụ khác tương tự Gateway (in gợi ý dọn dẹp; khuyến nghị vẫn là một Gateway trên mỗi máy) và chạy xác thực cấu hình ở chế độ nhận biết Plugin, hiển thị các cảnh báo trong manifest Plugin mà đường dẫn mặc định nhanh bỏ qua.
- Trên các bản cài đặt systemd của Linux, thao tác kiểm tra độ lệch token xem xét cả nguồn đơn vị `Environment=` và `EnvironmentFile=`.
- Thao tác kiểm tra độ lệch token phân giải SecretRef `gateway.auth.token` bằng môi trường runtime đã hợp nhất (môi trường lệnh dịch vụ trước, sau đó là môi trường tiến trình). Nếu xác thực bằng token không thực sự hoạt động (`gateway.auth.mode` thuộc `password`/`none`/`trusted-proxy`, hoặc chưa đặt và mật khẩu có thể được ưu tiên), việc phân giải token cấu hình sẽ bị bỏ qua.
- `install` xác thực rằng `gateway.auth.token` do SecretRef quản lý có thể được phân giải nhưng không bao giờ lưu giá trị đã phân giải vào siêu dữ liệu môi trường dịch vụ; nếu không thể phân giải, quá trình cài đặt sẽ dừng an toàn.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình nhưng `gateway.auth.mode` chưa được đặt, `install` sẽ chặn cho đến khi bạn đặt chế độ một cách rõ ràng.
- Trên macOS, `install` giữ các plist của LaunchAgent và tệp môi trường/trình bao bọc được tạo ở chế độ chỉ chủ sở hữu có quyền truy cập (chế độ `0600`/`0700`) thay vì nhúng các bí mật vào `EnvironmentVariables`.
- Khi chạy nhiều Gateway trên một máy chủ: hãy tách biệt các cổng, cấu hình/trạng thái và không gian làm việc. Xem [Nhiều Gateway](/vi/gateway#multiple-gateways-same-host).

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Cẩm nang vận hành Gateway](/vi/gateway)
