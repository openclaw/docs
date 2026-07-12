---
read_when:
    - Tìm hiểu điều gì xảy ra trong lần chạy tác tử đầu tiên
    - Giải thích vị trí lưu trữ các tệp khởi tạo
    - Gỡ lỗi thiết lập danh tính trong quá trình hướng dẫn ban đầu
sidebarTitle: Bootstrapping
summary: Quy trình khởi tạo agent để tạo sẵn các tệp không gian làm việc và danh tính
title: Khởi tạo tác tử
x-i18n:
    generated_at: "2026-07-12T08:22:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

Khởi tạo là nghi thức chạy lần đầu nhằm tạo nền tảng cho không gian làm việc của tác nhân mới và
hướng dẫn tác nhân lựa chọn danh tính. Quá trình này chạy một lần, ngay sau khi
hoàn tất thiết lập ban đầu, trong lượt tương tác thực tế đầu tiên của tác nhân.

## Điều gì diễn ra

Trong lần chạy đầu tiên với một không gian làm việc hoàn toàn mới (mặc định là `~/.openclaw/workspace`),
OpenClaw:

- Tạo sẵn `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` và `BOOTSTRAP.md`.
- Yêu cầu tác nhân làm theo `BOOTSTRAP.md`: một cuộc trò chuyện tự do (không phải biểu mẫu hỏi đáp cố định) để thống nhất tên, tính cách và phong thái.
- Ghi những gì đã tìm hiểu được vào `IDENTITY.md`, `USER.md` và `SOUL.md`.
- Xóa `BOOTSTRAP.md` sau khi không gian làm việc có vẻ đã được cấu hình, để nghi thức này chỉ chạy một lần.

Một không gian làm việc được xem là đã cấu hình khi `SOUL.md`, `IDENTITY.md` hoặc `USER.md`
không còn giống mẫu ban đầu, hoặc khi thư mục `memory/` tồn tại.

<Note>
`BOOTSTRAP.md` bao quát toàn bộ cuộc trò chuyện về danh tính. Xem nội dung tại
[mẫu BOOTSTRAP.md](/vi/reference/templates/BOOTSTRAP).
</Note>

## Các lượt chạy bằng mô hình nhúng và mô hình cục bộ

Đối với các lượt chạy bằng mô hình nhúng hoặc mô hình cục bộ, OpenClaw không đưa `BOOTSTRAP.md` vào
ngữ cảnh hệ thống đặc quyền. Trong lượt chạy tương tác chính đầu tiên, OpenClaw vẫn
truyền nội dung tệp qua lời nhắc của người dùng, nhờ đó các mô hình không
gọi công cụ `read` một cách đáng tin cậy vẫn có thể hoàn tất nghi thức. Nếu lượt chạy hiện tại
không thể truy cập không gian làm việc một cách an toàn, tác nhân sẽ nhận được một ghi chú khởi tạo giới hạn ngắn gọn
thay cho lời chào chung chung.

## Bỏ qua quá trình khởi tạo

Để bỏ qua bước này đối với một không gian làm việc đã được tạo sẵn dữ liệu, hãy chạy:

```bash
openclaw onboard --skip-bootstrap
```

## Nơi quá trình này chạy

Quá trình khởi tạo luôn chạy trên máy chủ Gateway. Nếu ứng dụng macOS kết nối với một
Gateway từ xa, không gian làm việc và các tệp khởi tạo của nó sẽ nằm trên máy
từ xa đó, không phải trên máy Mac.

<Note>
Khi Gateway chạy trên một máy khác, hãy chỉnh sửa các tệp không gian làm việc trên máy chủ gateway
(ví dụ: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Tài liệu liên quan

- Thiết lập ban đầu cho ứng dụng macOS: [Thiết lập ban đầu](/vi/start/onboarding)
- Bố cục không gian làm việc: [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
- Nội dung mẫu: [mẫu BOOTSTRAP.md](/vi/reference/templates/BOOTSTRAP)
