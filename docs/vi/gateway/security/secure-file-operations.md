---
read_when:
    - Thay đổi quyền truy cập tệp, giải nén kho lưu trữ, lưu trữ không gian làm việc hoặc các trình trợ giúp hệ thống tệp của plugin
summary: Cách OpenClaw xử lý quyền truy cập tệp cục bộ một cách an toàn và lý do trình trợ giúp Python fs-safe tùy chọn bị tắt theo mặc định
title: Thao tác tệp an toàn
x-i18n:
    generated_at: "2026-07-12T07:58:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw sử dụng [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) cho các thao tác tệp cục bộ nhạy cảm về bảo mật: đọc/ghi bị giới hạn trong thư mục gốc, thay thế nguyên tử, giải nén kho lưu trữ, không gian làm việc tạm thời, trạng thái JSON và xử lý tệp bí mật.

Đây là một **cơ chế bảo vệ ở cấp thư viện** dành cho mã OpenClaw đáng tin cậy nhận tên đường dẫn không đáng tin cậy, chứ không phải môi trường cô lập. Quyền truy cập hệ thống tệp của máy chủ, người dùng hệ điều hành, vùng chứa và chính sách tác nhân/công cụ vẫn xác định phạm vi ảnh hưởng thực tế.

## Mặc định: không có trình trợ giúp Python

OpenClaw mặc định đặt trình trợ giúp Python POSIX của fs-safe thành **tắt**:

- Gateway không nên khởi chạy một tiến trình phụ Python thường trực trừ khi quản trị viên chủ động bật;
- hầu hết bản cài đặt không cần cơ chế tăng cường bổ sung để bảo vệ các thao tác sửa đổi thư mục cha;
- việc tắt Python giúp hành vi khi chạy có thể dự đoán được trong các môi trường máy tính để bàn, Docker, CI và ứng dụng đóng gói.

OpenClaw chỉ thay đổi _giá trị mặc định_. Thiết lập tường minh luôn được ưu tiên:

```bash
# Hành vi mặc định của OpenClaw: phương án dự phòng fs-safe chỉ dùng Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Bật trình trợ giúp khi khả dụng và dùng phương án dự phòng nếu không khả dụng.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Từ chối hoạt động nếu trình trợ giúp không thể khởi động.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Đường dẫn tường minh tùy chọn đến trình thông dịch.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Các tên biến môi trường fs-safe dùng chung cũng hoạt động: `FS_SAFE_PYTHON_MODE` và `FS_SAFE_PYTHON`.

Hãy dùng `require` (không phải `auto`) khi trình trợ giúp là một phần trong chiến lược bảo mật của bạn; `auto` âm thầm chuyển sang hành vi chỉ dùng Node nếu trình trợ giúp không thể khởi động.

## Những gì vẫn được bảo vệ khi không có Python

Khi trình trợ giúp bị tắt, OpenClaw vẫn nhận được các cơ chế bảo vệ chỉ dùng Node của fs-safe:

- từ chối các đường dẫn tương đối thoát khỏi phạm vi (`..`), đường dẫn tuyệt đối và dấu phân cách đường dẫn tại những vị trí chỉ cho phép tên đơn;
- thực hiện thao tác thông qua một tham chiếu thư mục gốc đáng tin cậy thay vì các phép kiểm tra tùy tiện bằng `path.resolve(...).startsWith(...)`;
- từ chối các mẫu liên kết tượng trưng và liên kết cứng trên những API yêu cầu chính sách đó;
- mở tệp kèm kiểm tra định danh khi API trả về hoặc sử dụng nội dung tệp;
- ghi tệp trạng thái/cấu hình bằng tệp tạm cùng cấp và thao tác đổi tên nguyên tử;
- áp dụng giới hạn byte cho việc đọc và giải nén kho lưu trữ;
- áp dụng chế độ tệp riêng tư cho bí mật và tệp trạng thái khi API yêu cầu.

Điều này bao phủ mô hình đe dọa thông thường của OpenClaw: mã Gateway đáng tin cậy xử lý dữ liệu đường dẫn không đáng tin cậy từ mô hình/Plugin/kênh trong một ranh giới quản trị viên đáng tin cậy duy nhất.

## Python bổ sung điều gì

Trên POSIX, trình trợ giúp tùy chọn duy trì một tiến trình Python thường trực và sử dụng các thao tác hệ thống tệp tương đối theo bộ mô tả tệp cho các thao tác sửa đổi thư mục cha: đổi tên, xóa, tạo thư mục, lấy trạng thái/liệt kê và một số đường ghi.

Điều này thu hẹp các khoảng thời gian có thể xảy ra điều kiện tranh chấp với cùng UID, khi một tiến trình khác thay thế thư mục cha trong khoảng thời gian từ lúc xác thực đến lúc sửa đổi — một lớp phòng vệ chuyên sâu trên các máy chủ nơi tiến trình cục bộ không đáng tin cậy có thể sửa đổi chính các thư mục mà OpenClaw thao tác.

Nếu môi trường triển khai của bạn có rủi ro đó và chắc chắn có Python, hãy đặt:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Hướng dẫn cho Plugin và lõi

- Quyền truy cập tệp dành cho Plugin nên đi qua các trình trợ giúp `openclaw/plugin-sdk/*`, thay vì dùng trực tiếp `fs`, khi đường dẫn đến từ tin nhắn, đầu ra mô hình, cấu hình hoặc dữ liệu đầu vào của Plugin.
- Mã lõi nên sử dụng các trình bao bọc fs-safe trong `src/infra/*` để chính sách tiến trình của OpenClaw được áp dụng nhất quán.
- Việc giải nén kho lưu trữ nên sử dụng các trình trợ giúp kho lưu trữ của fs-safe với giới hạn tường minh về kích thước, số lượng mục, liên kết và đích đến.
- Bí mật nên sử dụng các trình trợ giúp bí mật của OpenClaw hoặc các trình trợ giúp bí mật/trạng thái riêng tư của fs-safe; không tự triển khai việc kiểm tra chế độ quanh `fs.writeFile`.
- Để cô lập khỏi người dùng cục bộ thù địch, không được chỉ dựa vào fs-safe. Hãy chạy các Gateway riêng biệt dưới các người dùng hệ điều hành hoặc máy chủ riêng biệt, hoặc sử dụng môi trường cô lập.

Liên quan: [Bảo mật](/vi/gateway/security), [Môi trường cô lập](/vi/gateway/sandboxing), [Phê duyệt thực thi](/vi/tools/exec-approvals), [Bí mật](/vi/gateway/secrets).
