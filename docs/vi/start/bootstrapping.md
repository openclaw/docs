---
read_when:
    - Tìm hiểu điều gì xảy ra trong lần chạy agent đầu tiên
    - Giải thích vị trí lưu trữ các tệp khởi tạo
    - Gỡ lỗi thiết lập danh tính khi làm quen ban đầu
sidebarTitle: Bootstrapping
summary: Quy trình khởi tạo agent để tạo sẵn các tệp workspace và danh tính
title: Khởi tạo tác tử
x-i18n:
    generated_at: "2026-07-21T13:44:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: efb47e1a6a86d68aef1aa1662fe9c5def9a4e5b45649b84aeb9060bfcba21a5d
    source_path: start/bootstrapping.md
    workflow: 16
---

Khởi tạo là quy trình lần chạy đầu tiên nhằm tạo dữ liệu ban đầu cho không gian làm việc của agent mới và
hướng dẫn agent chọn danh tính. Quy trình này chạy một lần, ngay sau khi
onboarding, trong lượt tương tác thực sự đầu tiên của agent.

## Điều gì diễn ra

Trong lần chạy đầu tiên với một không gian làm việc hoàn toàn mới (mặc định `~/.openclaw/workspace`),
OpenClaw:

- Tạo dữ liệu ban đầu cho `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` và `BOOTSTRAP.md`.
- Yêu cầu agent thực hiện trình tự khai sinh giới hạn trong ba nhịp: hỏi bạn muốn
  gọi agent là gì, chia sẻ một câu ngắn về bản chất/phong cách và hỏi bạn muốn
  bộ plugin tối thiểu được đề xuất hay mức tiện lợi tối đa.
- Lưu danh tính đã thống nhất hai lần: vào `IDENTITY.md` và `SOUL.md` (nội dung
  agent đọc về chính mình), đồng thời thông qua `openclaw agents set-identity` (nội dung các kênh
  và giao diện người dùng hiển thị).
- Đọc các đề xuất ứng dụng đã được lưu trong quá trình onboarding mà không quét lại.
  Các plugin chính thức sử dụng `openclaw plugins install <id>`; Skills ClawHub của bên thứ ba
  vẫn yêu cầu người dùng chủ động chọn tham gia. Sau khi xử lý lựa chọn, agent
  xác nhận đề xuất đã lưu để không bao giờ hỏi lại.
- Xóa `BOOTSTRAP.md` sau khi không gian làm việc có vẻ đã được cấu hình, để quy trình này chỉ chạy một lần.

Một không gian làm việc được xem là đã cấu hình khi `SOUL.md`, `IDENTITY.md` hoặc `USER.md`
đã khác với mẫu khởi đầu tương ứng, hoặc khi thư mục `memory/` tồn tại.

<Note>
`BOOTSTRAP.md` bao quát toàn bộ cuộc trò chuyện về danh tính. Xem nội dung tại
[mẫu BOOTSTRAP.md](/vi/reference/templates/BOOTSTRAP).
</Note>

## Các lượt chạy bằng mô hình nhúng và mô hình cục bộ

Đối với các lượt chạy bằng mô hình nhúng hoặc mô hình cục bộ, OpenClaw không đưa `BOOTSTRAP.md` vào
ngữ cảnh hệ thống đặc quyền. Trong lượt chạy tương tác chính đầu tiên, OpenClaw vẫn
truyền nội dung tệp qua lời nhắc người dùng, nhờ đó các mô hình không
gọi công cụ `read` một cách đáng tin cậy vẫn có thể hoàn tất quy trình. Nếu lượt chạy hiện tại
không thể truy cập không gian làm việc một cách an toàn, agent sẽ nhận được một ghi chú khởi tạo giới hạn ngắn
thay vì lời chào chung chung.

## Bỏ qua khởi tạo

Để bỏ qua bước này trên một không gian làm việc đã được tạo dữ liệu sẵn, hãy chạy:

```bash
openclaw onboard --skip-bootstrap
```

## Nơi quy trình chạy

Quá trình khởi tạo luôn chạy trên máy chủ Gateway. Nếu ứng dụng macOS kết nối với một
Gateway từ xa, không gian làm việc và các tệp khởi tạo của nó nằm trên máy
từ xa đó, không nằm trên máy Mac.

<Note>
Khi Gateway chạy trên một máy khác, hãy chỉnh sửa các tệp không gian làm việc trên máy chủ gateway
(ví dụ: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Tài liệu liên quan

- Onboarding ứng dụng macOS: [Onboarding](/vi/start/onboarding)
- Bố cục không gian làm việc: [Không gian làm việc của agent](/vi/concepts/agent-workspace)
- Nội dung mẫu: [mẫu BOOTSTRAP.md](/vi/reference/templates/BOOTSTRAP)
