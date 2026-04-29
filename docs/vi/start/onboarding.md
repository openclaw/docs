---
read_when:
    - Thiết kế trợ lý hướng dẫn ban đầu cho macOS
    - Triển khai thiết lập xác thực hoặc danh tính
sidebarTitle: 'Onboarding: macOS App'
summary: Luồng thiết lập lần chạy đầu tiên cho OpenClaw (ứng dụng macOS)
title: Thiết lập ban đầu (ứng dụng macOS)
x-i18n:
    generated_at: "2026-04-29T23:15:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 16
---

Tài liệu này mô tả luồng thiết lập lần chạy đầu tiên **hiện tại**. Mục tiêu là một trải nghiệm “ngày 0” mượt mà: chọn nơi Gateway chạy, kết nối xác thực, chạy trình hướng dẫn và để tác nhân tự khởi tạo.
Để xem tổng quan chung về các lộ trình hướng dẫn nhập môn, hãy xem [Tổng quan hướng dẫn nhập môn](/vi/start/onboarding-overview).

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
<Frame caption="Đọc thông báo bảo mật được hiển thị và quyết định tương ứng">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Mô hình tin cậy bảo mật:

- Theo mặc định, OpenClaw là một tác nhân cá nhân: một ranh giới người vận hành đáng tin cậy.
- Các thiết lập dùng chung/nhiều người dùng yêu cầu siết chặt bảo mật (tách ranh giới tin cậy, giữ quyền truy cập công cụ ở mức tối thiểu và làm theo [Bảo mật](/vi/gateway/security)).
- Onboarding cục bộ hiện mặc định cấu hình mới thành `tools.profile: "coding"` để các thiết lập cục bộ mới giữ công cụ hệ thống tệp/runtime mà không buộc dùng hồ sơ `full` không hạn chế.
- Nếu hook/webhook hoặc các nguồn nội dung không đáng tin cậy khác được bật, hãy dùng một bậc mô hình hiện đại mạnh và giữ chính sách công cụ/sandboxing nghiêm ngặt.

</Step>
<Step title="Cục bộ và từ xa">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** chạy ở đâu?

- **Máy Mac này (chỉ cục bộ):** onboarding có thể cấu hình xác thực và ghi thông tin xác thực cục bộ.
- **Từ xa (qua SSH/Tailnet):** onboarding **không** cấu hình xác thực cục bộ; thông tin xác thực phải tồn tại trên máy chủ gateway.
- **Cấu hình sau:** bỏ qua thiết lập và để ứng dụng chưa được cấu hình.

<Tip>
**Mẹo xác thực Gateway:**

- Trình hướng dẫn hiện tạo một **token** ngay cả cho loopback, vì vậy các client WS cục bộ phải xác thực.
- Nếu bạn tắt xác thực, bất kỳ tiến trình cục bộ nào cũng có thể kết nối; chỉ dùng như vậy trên các máy hoàn toàn đáng tin cậy.
- Dùng **token** cho quyền truy cập nhiều máy hoặc các bind không phải loopback.

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
- Micro
- Nhận dạng giọng nói
- Camera
- Vị trí

</Step>
<Step title="CLI">
  <Info>Bước này là tùy chọn</Info>
  Ứng dụng có thể cài đặt CLI `openclaw` toàn cục qua npm, pnpm hoặc bun.
  Ứng dụng ưu tiên npm trước, sau đó là pnpm, rồi bun nếu đó là trình quản lý
  gói duy nhất được phát hiện. Đối với runtime Gateway, Node vẫn là lộ trình được khuyến nghị.
</Step>
<Step title="Chat hướng dẫn nhập môn (phiên chuyên dụng)">
  Sau khi thiết lập, ứng dụng mở một phiên chat hướng dẫn nhập môn chuyên dụng để tác nhân có thể
  tự giới thiệu và hướng dẫn các bước tiếp theo. Điều này giữ phần hướng dẫn lần chạy đầu tiên tách biệt
  với cuộc trò chuyện thông thường của bạn. Xem [Khởi tạo](/vi/start/bootstrapping) để biết
  điều gì xảy ra trên máy chủ gateway trong lần chạy tác nhân đầu tiên.
</Step>
</Steps>

## Liên quan

- [Tổng quan hướng dẫn nhập môn](/vi/start/onboarding-overview)
- [Bắt đầu](/vi/start/getting-started)
