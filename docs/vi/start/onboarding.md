---
read_when:
    - Thiết kế trợ lý hướng dẫn thiết lập ban đầu trên macOS
    - Triển khai xác thực hoặc thiết lập danh tính
sidebarTitle: 'Onboarding: macOS App'
summary: Luồng thiết lập lần chạy đầu tiên cho OpenClaw (ứng dụng macOS)
title: Giới thiệu ban đầu (ứng dụng macOS)
x-i18n:
    generated_at: "2026-06-27T18:12:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Tài liệu này mô tả luồng thiết lập lần chạy đầu tiên **hiện tại**. Mục tiêu là trải nghiệm
"ngày 0" suôn sẻ: chọn nơi Gateway chạy, kết nối xác thực, chạy
trình hướng dẫn, và để tác nhân tự khởi động.
Để xem tổng quan chung về các lộ trình onboarding, hãy xem [Tổng quan onboarding](/vi/start/onboarding-overview).

<Steps>
<Step title="Phê duyệt cảnh báo macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Phê duyệt tìm mạng cục bộ">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Chào mừng và thông báo bảo mật">
<Frame caption="Đọc thông báo bảo mật được hiển thị và quyết định cho phù hợp">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Mô hình tin cậy bảo mật:

- Theo mặc định, OpenClaw là một tác nhân cá nhân: một ranh giới người vận hành đáng tin cậy.
- Các thiết lập dùng chung/nhiều người dùng yêu cầu khóa chặt (tách ranh giới tin cậy, giữ quyền truy cập công cụ ở mức tối thiểu, và làm theo [Bảo mật](/vi/gateway/security)).
- Onboarding cục bộ hiện đặt mặc định cấu hình mới thành `tools.profile: "coding"` để các thiết lập cục bộ mới vẫn giữ công cụ hệ thống tệp/runtime mà không buộc dùng hồ sơ `full` không hạn chế.
- Nếu hook/webhook hoặc các nguồn cấp nội dung không đáng tin cậy khác được bật, hãy dùng một tầng mô hình hiện đại mạnh và duy trì chính sách công cụ/sandboxing nghiêm ngặt.

</Step>
<Step title="Cục bộ so với Từ xa">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** chạy ở đâu?

- **Máy Mac này (chỉ cục bộ):** onboarding có thể cấu hình xác thực và ghi thông tin đăng nhập
  cục bộ.
- **Từ xa (qua SSH/Tailnet):** onboarding **không** cấu hình xác thực cục bộ;
  thông tin đăng nhập phải tồn tại trên máy chủ gateway. Trường mã thông báo gateway từ xa
  lưu mã thông báo mà ứng dụng macOS dùng để kết nối với Gateway đó; các giá trị
  `gateway.remote.token` hiện có không phải văn bản thuần được giữ nguyên cho đến khi bạn thay thế
  chúng.
- **Cấu hình sau:** bỏ qua thiết lập và để ứng dụng chưa được cấu hình.

<Tip>
**Mẹo xác thực Gateway:**

- Trình hướng dẫn hiện tạo một **mã thông báo** ngay cả cho loopback, vì vậy các client WS cục bộ phải xác thực.
- Nếu bạn tắt xác thực, mọi tiến trình cục bộ đều có thể kết nối; chỉ dùng cách đó trên các máy hoàn toàn đáng tin cậy.
- Dùng **mã thông báo** cho truy cập nhiều máy hoặc các bind không phải loopback.

</Tip>
</Step>
<Step title="Quyền">
<Frame caption="Chọn những quyền bạn muốn cấp cho OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding yêu cầu các quyền TCC cần thiết cho:

- Tự động hóa (AppleScript)
- Thông báo
- Trợ năng
- Ghi màn hình
- Micrô
- Nhận dạng giọng nói
- Camera
- Vị trí

</Step>
<Step title="CLI">
  <Info>Bước này là tùy chọn</Info>
  Ứng dụng có thể cài đặt CLI `openclaw` toàn cục qua npm, pnpm, hoặc bun.
  Ứng dụng ưu tiên npm trước, sau đó pnpm, rồi bun nếu đó là trình quản lý gói
  duy nhất được phát hiện. Đối với runtime Gateway, Node vẫn là lộ trình được khuyến nghị.
</Step>
<Step title="Trò chuyện onboarding (phiên chuyên dụng)">
  Sau khi thiết lập, ứng dụng mở một phiên trò chuyện onboarding chuyên dụng để tác nhân có thể
  tự giới thiệu và hướng dẫn các bước tiếp theo. Điều này giữ hướng dẫn lần chạy đầu tiên tách biệt
  khỏi cuộc trò chuyện thông thường của bạn. Xem [Khởi động](/vi/start/bootstrapping) để biết
  điều gì xảy ra trên máy chủ gateway trong lần chạy tác nhân đầu tiên.
</Step>
</Steps>

## Liên quan

- [Tổng quan onboarding](/vi/start/onboarding-overview)
- [Bắt đầu](/vi/start/getting-started)
