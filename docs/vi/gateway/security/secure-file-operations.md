---
read_when:
    - Thay đổi quyền truy cập tệp, trích xuất tệp lưu trữ, lưu trữ không gian làm việc hoặc các helper hệ thống tệp của Plugin
summary: Cách OpenClaw xử lý an toàn quyền truy cập tệp cục bộ và lý do trình trợ giúp Python fs-safe tùy chọn bị tắt theo mặc định
title: Thao tác tệp an toàn
x-i18n:
    generated_at: "2026-05-06T09:15:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw sử dụng [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) cho các thao tác tệp cục bộ nhạy cảm về bảo mật: đọc/ghi giới hạn theo gốc, thay thế nguyên tử, trích xuất kho lưu trữ, không gian làm việc tạm thời, trạng thái JSON và xử lý tệp bí mật.

Mục tiêu là một **lan can thư viện** nhất quán cho mã OpenClaw đáng tin cậy nhận tên đường dẫn không đáng tin cậy. Đây không phải là sandbox. Quyền hệ thống tệp của máy chủ, người dùng hệ điều hành, container và chính sách agent/công cụ vẫn xác định phạm vi ảnh hưởng thực tế.

## Mặc định: không có trình trợ giúp Python

OpenClaw mặc định tắt trình trợ giúp Python POSIX của fs-safe.

Lý do:

- gateway không nên sinh một sidecar Python thường trú trừ khi operator đã chọn dùng;
- nhiều bản cài đặt không cần tăng cường bổ sung cho việc thay đổi thư mục cha;
- việc tắt Python giúp hành vi gói/runtime dễ dự đoán hơn trên môi trường desktop, Docker, CI và ứng dụng đóng gói.

OpenClaw chỉ thay đổi mặc định. Nếu bạn đặt rõ một chế độ, fs-safe sẽ tuân theo:

```bash
# Hành vi OpenClaw mặc định: dự phòng fs-safe chỉ dùng Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Chọn dùng trình trợ giúp khi có, dự phòng nếu không có.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Đóng an toàn nếu trình trợ giúp không thể khởi động.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Trình thông dịch rõ ràng tùy chọn.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Các tên fs-safe chung cũng hoạt động: `FS_SAFE_PYTHON_MODE` và `FS_SAFE_PYTHON`.

## Những gì vẫn được bảo vệ khi không có Python

Khi trình trợ giúp bị tắt, OpenClaw vẫn dùng các đường dẫn Node của fs-safe cho:

- từ chối các thoát đường dẫn tương đối như `..`, đường dẫn tuyệt đối và dấu phân cách đường dẫn ở nơi chỉ cho phép tên;
- phân giải thao tác thông qua một handle gốc đáng tin cậy thay vì các kiểm tra tùy tiện kiểu `path.resolve(...).startsWith(...)`;
- từ chối các mẫu symlink và hardlink trên các API yêu cầu chính sách đó;
- mở tệp với kiểm tra danh tính ở nơi API trả về hoặc tiêu thụ nội dung tệp;
- ghi nguyên tử qua tệp tạm cùng thư mục cho tệp trạng thái/cấu hình;
- giới hạn byte cho đọc và trích xuất kho lưu trữ;
- chế độ riêng tư cho bí mật và tệp trạng thái ở nơi API yêu cầu.

Các biện pháp bảo vệ này bao phủ mô hình đe dọa OpenClaw thông thường: mã gateway đáng tin cậy xử lý đầu vào đường dẫn model/plugin/kênh không đáng tin cậy bên trong một ranh giới operator đáng tin cậy duy nhất.

## Python bổ sung gì

Trên POSIX, trình trợ giúp tùy chọn của fs-safe duy trì một tiến trình Python thường trú và dùng các thao tác hệ thống tệp tương đối theo fd cho các thay đổi thư mục cha như đổi tên, xóa, mkdir, stat/liệt kê và một số đường dẫn ghi.

Điều đó thu hẹp các cửa sổ race cùng UID, nơi một tiến trình khác có thể tráo đổi thư mục cha giữa bước xác thực và bước thay đổi. Đây là phòng thủ chiều sâu cho các máy chủ nơi tiến trình cục bộ không đáng tin cậy có thể sửa đổi cùng các thư mục mà OpenClaw đang thao tác.

Nếu triển khai của bạn có rủi ro đó và Python được đảm bảo tồn tại, hãy dùng:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Dùng `require` thay vì `auto` khi trình trợ giúp là một phần trong tư thế bảo mật của bạn; `auto` cố ý dự phòng về hành vi chỉ dùng Node nếu trình trợ giúp không có sẵn.

## Hướng dẫn cho Plugin và core

- Truy cập tệp hướng tới Plugin nên đi qua các helper `openclaw/plugin-sdk/*`, không phải `fs` thô, khi đường dẫn đến từ tin nhắn, đầu ra model, cấu hình hoặc đầu vào plugin.
- Mã core nên dùng các wrapper fs-safe cục bộ dưới `src/infra/*` để chính sách tiến trình của OpenClaw được áp dụng nhất quán.
- Trích xuất kho lưu trữ nên dùng các helper kho lưu trữ fs-safe với giới hạn rõ ràng về kích thước, số lượng entry, liên kết và đích đến.
- Bí mật nên dùng helper bí mật của OpenClaw hoặc helper bí mật/trạng thái riêng tư của fs-safe; không tự viết kiểm tra chế độ quanh `fs.writeFile`.
- Nếu bạn cần cách ly người dùng cục bộ thù địch, đừng chỉ dựa vào fs-safe. Chạy các gateway riêng dưới người dùng/máy chủ hệ điều hành riêng hoặc dùng sandboxing.

Liên quan: [Bảo mật](/vi/gateway/security), [Sandboxing](/vi/gateway/sandboxing), [Phê duyệt exec](/vi/tools/exec-approvals), [Bí mật](/vi/gateway/secrets).
