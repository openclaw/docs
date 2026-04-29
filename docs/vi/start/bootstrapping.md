---
read_when:
    - Tìm hiểu điều gì xảy ra trong lần chạy đầu tiên của tác nhân
    - Giải thích vị trí của các tệp khởi tạo
    - Gỡ lỗi thiết lập danh tính trong quá trình thiết lập ban đầu
sidebarTitle: Bootstrapping
summary: Nghi thức khởi tạo tác nhân, tạo dữ liệu ban đầu cho không gian làm việc và các tệp định danh
title: Khởi tạo tác nhân
x-i18n:
    generated_at: "2026-04-29T23:14:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

Khởi tạo ban đầu là nghi thức **chạy lần đầu** chuẩn bị không gian làm việc của tác nhân và
thu thập chi tiết danh tính. Việc này diễn ra sau khi onboarding, khi tác nhân khởi động
lần đầu tiên.

## Khởi tạo ban đầu làm gì

Trong lần chạy tác nhân đầu tiên, OpenClaw khởi tạo không gian làm việc (mặc định
`~/.openclaw/workspace`):

- Tạo sẵn `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Chạy một nghi thức hỏi đáp ngắn (mỗi lần một câu hỏi).
- Ghi danh tính + tùy chọn vào `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Xóa `BOOTSTRAP.md` khi hoàn tất để nghi thức chỉ chạy một lần.

Đối với các lần chạy mô hình nhúng/cục bộ, OpenClaw giữ `BOOTSTRAP.md` bên ngoài
ngữ cảnh hệ thống đặc quyền. Trong lần chạy đầu tiên tương tác chính, OpenClaw vẫn truyền
nội dung tệp trong lời nhắc người dùng để các mô hình không gọi công cụ
`read` một cách đáng tin cậy vẫn có thể hoàn tất nghi thức. Nếu lần chạy hiện tại không thể truy cập
không gian làm việc một cách an toàn, tác nhân sẽ nhận được một ghi chú khởi tạo giới hạn thay vì lời chào chung chung.

## Bỏ qua khởi tạo ban đầu

Để bỏ qua bước này cho một không gian làm việc đã chuẩn bị sẵn, hãy chạy `openclaw onboard --skip-bootstrap`.

## Nơi chạy

Khởi tạo ban đầu luôn chạy trên **máy chủ Gateway**. Nếu ứng dụng macOS kết nối tới
một Gateway từ xa, không gian làm việc và các tệp khởi tạo ban đầu sẽ nằm trên máy
từ xa đó.

<Note>
Khi Gateway chạy trên một máy khác, hãy chỉnh sửa các tệp không gian làm việc trên máy chủ gateway
(ví dụ: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Tài liệu liên quan

- Onboarding ứng dụng macOS: [Onboarding](/vi/start/onboarding)
- Bố cục không gian làm việc: [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
