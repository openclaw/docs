---
read_when:
    - Bạn vẫn sử dụng `openclaw daemon ...` trong các tập lệnh
    - Bạn cần các lệnh quản lý vòng đời dịch vụ (cài đặt/khởi động/dừng/khởi động lại/trạng thái)
summary: Tài liệu tham khảo CLI cho `openclaw daemon` (bí danh cũ để quản lý dịch vụ Gateway)
title: Tiến trình nền
x-i18n:
    generated_at: "2026-07-20T04:19:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 629852ebf3efe86dedc4c84f6ddc9349b25ddde832df5d78521641fe4b137658
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Bí danh cũ dùng để quản lý dịch vụ Gateway. `openclaw daemon ...` ánh xạ đến cùng các lệnh điều khiển dịch vụ như `openclaw gateway ...`. Nên dùng [`openclaw gateway`](/vi/cli/gateway) để xem tài liệu và ví dụ hiện tại.

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
| `stop`      | `--json`, `--disable` (chỉ dành cho launchd: liên tục vô hiệu hóa KeepAlive/RunAtLoad cho đến lần khởi động tiếp theo) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: hiển thị trạng thái cài đặt dịch vụ (launchd/systemd/schtasks) và thăm dò tình trạng Gateway.
- `install`: cài đặt dịch vụ; `--force` cài đặt lại/ghi đè bản cài đặt hiện có.
- `restart --safe`: yêu cầu Gateway đang chạy kiểm tra trước công việc đang hoạt động và lên lịch một lần khởi động lại gộp duy nhất sau khi công việc hoàn tất, với giới hạn 5 phút. Khi hết thời gian này, việc khởi động lại vẫn bị buộc thực hiện. `restart` thông thường sử dụng trực tiếp trình quản lý dịch vụ; `--force` là tùy chọn ghi đè để thực hiện ngay lập tức.
- `restart --safe --skip-deferral`: bỏ qua cổng trì hoãn do công việc đang hoạt động để Gateway khởi động lại ngay lập tức, ngay cả khi có báo cáo về yếu tố cản trở. Yêu cầu `--safe`.

## Ghi chú

- `status` phân giải các SecretRef xác thực đã cấu hình để xác thực thăm dò khi có thể. Nếu không phân giải được một SecretRef bắt buộc, `status --json` báo cáo `rpc.authWarning`; hãy truyền rõ ràng `--token`/`--password` hoặc phân giải nguồn bí mật trước. Các cảnh báo xác thực chưa phân giải sẽ bị ẩn khi quá trình thăm dò thành công về các mặt khác.
- `status --deep` bổ sung thao tác quét cấp hệ thống theo nỗ lực tối đa để tìm các dịch vụ khác tương tự Gateway (in ra gợi ý dọn dẹp; khuyến nghị vẫn là mỗi máy chỉ chạy một Gateway) và chạy xác thực cấu hình ở chế độ nhận biết Plugin, hiển thị các cảnh báo trong tệp kê khai Plugin mà đường dẫn nhanh mặc định bỏ qua.
- Trên các bản cài đặt systemd của Linux, quá trình kiểm tra sai lệch token sẽ kiểm tra cả nguồn đơn vị `Environment=` và `EnvironmentFile=`.
- Quá trình kiểm tra sai lệch token phân giải các SecretRef `gateway.auth.token` bằng môi trường thời gian chạy đã hợp nhất (môi trường lệnh dịch vụ trước, sau đó là môi trường tiến trình). Nếu xác thực bằng token không thực sự hoạt động (`gateway.auth.mode` trong số `password`/`none`/`trusted-proxy`, hoặc chưa đặt trong khi mật khẩu có thể được ưu tiên), quá trình phân giải token cấu hình sẽ bị bỏ qua.
- `install` xác thực rằng `gateway.auth.token` do SecretRef quản lý có thể được phân giải nhưng không bao giờ lưu giá trị đã phân giải vào siêu dữ liệu môi trường dịch vụ; nếu không thể phân giải, quá trình cài đặt sẽ dừng theo cơ chế đóng an toàn.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình nhưng `gateway.auth.mode` chưa được đặt, `install` sẽ chặn cho đến khi bạn đặt chế độ một cách rõ ràng.
- Trên macOS, `install` giữ các plist LaunchAgent và tệp môi trường/trình bao bọc được tạo chỉ cho chủ sở hữu truy cập (chế độ `0600`/`0700`) thay vì nhúng bí mật vào `EnvironmentVariables`.
- Khi chạy nhiều Gateway trên một máy chủ: hãy tách biệt các cổng, cấu hình/trạng thái và không gian làm việc. Xem [Nhiều Gateway](/vi/gateway#multiple-gateways-same-host).

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Sổ tay vận hành Gateway](/vi/gateway)
