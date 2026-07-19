---
read_when:
    - Tìm hiểu điều gì xảy ra trong lần chạy agent đầu tiên
    - Giải thích vị trí của các tệp khởi tạo ban đầu
    - Gỡ lỗi thiết lập danh tính trong quá trình hướng dẫn ban đầu
sidebarTitle: Bootstrapping
summary: Quy trình khởi tạo tác nhân để thiết lập các tệp không gian làm việc và danh tính ban đầu
title: Khởi tạo agent
x-i18n:
    generated_at: "2026-07-19T05:58:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c065534b5abe539cccfe8badc44296d890289d8ce3daa9f03a12e82adf8c091
    source_path: start/bootstrapping.md
    workflow: 16
---

Bootstrapping là nghi thức chạy lần đầu để khởi tạo một không gian làm việc mới cho agent và
hướng dẫn agent chọn danh tính. Quá trình này chạy một lần, ngay sau khi
onboarding, trong lượt tương tác thực sự đầu tiên của agent.

## Điều gì xảy ra

Trong lần chạy đầu tiên với một không gian làm việc hoàn toàn mới (mặc định là `~/.openclaw/workspace`),
OpenClaw:

- Khởi tạo `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` và `BOOTSTRAP.md`.
- Yêu cầu agent thực hiện một trình tự khai sinh giới hạn gồm ba bước: agent tự đề xuất
  tên của mình, chia sẻ một câu ngắn về tâm hồn/phong cách và hỏi bạn muốn dùng bộ
  plugin tối thiểu được đề xuất hay mức tiện lợi tối đa.
- Lưu danh tính đã thống nhất theo hai cách: vào `IDENTITY.md` và `SOUL.md` (những gì
  agent đọc về chính mình), đồng thời qua `openclaw agents set-identity` (những gì các kênh
  và giao diện người dùng hiển thị).
- Đọc các đề xuất ứng dụng đã được lưu trong quá trình onboarding mà không quét lại.
  Các plugin chính thức sử dụng `openclaw plugins install <id>`; Skills ClawHub của bên thứ ba
  vẫn yêu cầu người dùng chủ động chọn tham gia. Sau khi xử lý lựa chọn, agent
  xác nhận đề xuất đã lưu để không bao giờ hỏi lại.
- Xóa `BOOTSTRAP.md` khi không gian làm việc có vẻ đã được cấu hình, để nghi thức chỉ chạy một lần.

Một không gian làm việc được xem là đã cấu hình khi `SOUL.md`, `IDENTITY.md` hoặc `USER.md`
đã khác với mẫu khởi đầu tương ứng, hoặc khi tồn tại thư mục `memory/`.

<Note>
`BOOTSTRAP.md` bao quát toàn bộ cuộc hội thoại về danh tính. Xem nội dung tại
[mẫu BOOTSTRAP.md](/vi/reference/templates/BOOTSTRAP).
</Note>

## Các lượt chạy bằng mô hình nhúng và mô hình cục bộ

Đối với các lượt chạy bằng mô hình nhúng hoặc mô hình cục bộ, OpenClaw không đưa `BOOTSTRAP.md` vào
ngữ cảnh hệ thống đặc quyền. Trong lần chạy tương tác chính đầu tiên, OpenClaw vẫn
truyền nội dung tệp qua lời nhắc của người dùng, để các mô hình không gọi công cụ
`read` một cách đáng tin cậy vẫn có thể hoàn tất nghi thức. Nếu lượt chạy hiện tại
không thể truy cập không gian làm việc một cách an toàn, agent sẽ nhận được một ghi chú
bootstrapping giới hạn và ngắn gọn thay vì lời chào chung chung.

## Bỏ qua bootstrapping

Để bỏ qua bước này trong một không gian làm việc đã được khởi tạo sẵn, hãy chạy:

```bash
openclaw onboard --skip-bootstrap
```

## Nơi chạy

Bootstrapping luôn chạy trên máy chủ Gateway. Nếu ứng dụng macOS kết nối với một
Gateway từ xa, không gian làm việc và các tệp bootstrap của nó nằm trên máy
từ xa đó, không phải trên máy Mac.

<Note>
Khi Gateway chạy trên một máy khác, hãy chỉnh sửa các tệp không gian làm việc trên máy chủ Gateway
(ví dụ: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Tài liệu liên quan

- Onboarding ứng dụng macOS: [Onboarding](/vi/start/onboarding)
- Bố cục không gian làm việc: [Không gian làm việc của agent](/vi/concepts/agent-workspace)
- Nội dung mẫu: [mẫu BOOTSTRAP.md](/vi/reference/templates/BOOTSTRAP)
