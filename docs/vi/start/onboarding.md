---
read_when:
    - Thiết kế trợ lý hướng dẫn thiết lập ban đầu trên macOS
    - Triển khai thiết lập xác thực hoặc danh tính
sidebarTitle: 'Onboarding: macOS App'
summary: Quy trình thiết lập lần đầu cho OpenClaw (ứng dụng macOS)
title: Hướng dẫn thiết lập ban đầu (ứng dụng macOS)
x-i18n:
    generated_at: "2026-07-12T08:22:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

Quy trình chạy lần đầu của ứng dụng macOS: chọn nơi Gateway chạy, kết nối một phần phụ trợ AI đã được xác minh, cấp quyền và chuyển giao cho quy trình khởi tạo riêng của tác tử.
Để biết quy trình hướng dẫn thiết lập qua CLI và so sánh hai phương thức, hãy xem [Tổng quan về hướng dẫn thiết lập](/vi/start/onboarding-overview).

<Steps>
<Step title="Phê duyệt cảnh báo của macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Cho phép tìm mạng cục bộ">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Thông báo chào mừng và bảo mật">
<Frame caption="Đọc thông báo bảo mật được hiển thị và quyết định cho phù hợp">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Mô hình tin cậy bảo mật:

- Theo mặc định, OpenClaw là một tác tử cá nhân: một ranh giới dành cho người vận hành đáng tin cậy.
- Các thiết lập dùng chung/nhiều người dùng cần được siết chặt: phân tách các ranh giới tin cậy, duy trì quyền truy cập công cụ ở mức tối thiểu và làm theo hướng dẫn trong [Bảo mật](/vi/gateway/security).
- Theo mặc định, quy trình hướng dẫn thiết lập cục bộ đặt cấu hình mới thành `tools.profile: "coding"` để các thiết lập mới vẫn có công cụ hệ thống tệp/thời gian chạy mà không dùng hồ sơ `full` không bị hạn chế.
- Nếu bật hook/webhook hoặc các nguồn cấp nội dung không đáng tin cậy khác, hãy sử dụng cấp mô hình hiện đại, mạnh và duy trì chính sách công cụ/cơ chế hộp cát nghiêm ngặt.

</Step>
<Step title="Cục bộ hay từ xa">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** chạy ở đâu?

- **Máy Mac này (Chỉ cục bộ):** quy trình hướng dẫn thiết lập cấu hình xác thực và ghi thông tin xác thực trên máy cục bộ.
- **Từ xa (qua SSH/Tailnet):** quy trình hướng dẫn thiết lập **không** cấu hình xác thực cục bộ;
  thông tin xác thực phải tồn tại sẵn trên máy chủ Gateway. Trường mã thông báo Gateway từ xa
  lưu mã thông báo mà ứng dụng macOS dùng để kết nối với Gateway đó;
  các giá trị SecretRef `gateway.remote.token` hiện có được giữ nguyên cho đến khi bạn
  thay thế chúng.
- **Cấu hình sau:** bỏ qua phần thiết lập và để ứng dụng chưa được cấu hình.

<Tip>
**Mẹo xác thực Gateway:**

- Chế độ xác thực Gateway mặc định là `token` ngay cả với các liên kết local loopback, vì vậy máy khách WS cục bộ phải xác thực.
- Việc đặt `gateway.auth.mode: "none"` cho phép mọi tiến trình cục bộ kết nối; chỉ sử dụng tùy chọn này trên các máy hoàn toàn đáng tin cậy.
- Sử dụng mã thông báo để truy cập từ nhiều máy hoặc với các liên kết không phải local loopback.

</Tip>
</Step>
<Step title="CLI">
  Thiết lập cục bộ cài đặt CLI `openclaw` toàn cục qua npm, pnpm hoặc bun,
  ưu tiên npm trước. Node vẫn là môi trường thời gian chạy được khuyến nghị cho chính
  Gateway. Các bản cài đặt tương thích hiện có sẽ được tái sử dụng.
</Step>
<Step title="Kết nối AI của bạn">
  Gateway đã kết nối và đã cấu hình mô hình tác tử sẽ bỏ qua hoàn toàn
  trang này và mở giao diện tác tử thông thường. Quá trình thiết lập Crestodian và nhà cung cấp
  chỉ chạy cho Gateway mới hoặc chưa hoàn chỉnh.

Sau khi Gateway sẵn sàng, quy trình hướng dẫn thiết lập sẽ tìm quyền truy cập AI mà bạn đã có:
thông tin đăng nhập Claude Code hoặc Codex, hay `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. Tùy chọn tốt nhất được kiểm tra bằng một lượt hoàn thành thực và
chỉ được lưu sau khi phản hồi thành công; khi kiểm tra thất bại, ứng dụng tự động thử
tùy chọn tiếp theo và hiển thị lý do tùy chọn trước đó thất bại. Nếu tìm thấy nhiều tùy chọn,
bạn có thể chuyển đổi giữa chúng trước khi tiếp tục.

Gemini CLI vẫn khả dụng cho các tác tử thông thường sau khi thiết lập, nhưng không được
cung cấp tại đây vì không thể bắt buộc phép thăm dò suy luận không dùng công cụ.

Bạn cũng có thể đăng nhập qua quy trình OAuth hoặc ghép nối thiết bị riêng của nhà cung cấp.
Các lựa chọn tích hợp sẵn bao gồm OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global và CN, cùng Chutes. Danh sách này đến từ các
Plugin nhà cung cấp suy luận văn bản đang hoạt động của Gateway thay vì một danh sách cố định trong ứng dụng,
vì vậy nhà cung cấp khác có thể chọn tham gia mà không cần thêm mã macOS dành riêng cho nhà cung cấp.

Bộ chọn khóa/mã thông báo thủ công sử dụng cùng một sổ đăng ký nhà cung cấp. Trong mọi phương thức,
nhà cung cấp cung cấp mô hình khởi đầu và cấu hình của mình; OpenClaw xác minh
thông tin xác thực bằng cùng một bài kiểm tra trực tiếp trước khi lưu hồ sơ xác thực. Nút Next
vẫn bị khóa cho đến khi một phần phụ trợ vượt qua kiểm tra, vì vậy cuộc trò chuyện đầu tiên với tác tử không thể
bắt đầu nếu tính năng suy luận chưa hoạt động. Sau khi kiểm tra trực tiếp đó thành công, Crestodian sẽ
khả dụng để hỗ trợ cấu hình phần còn lại của không gian làm việc, Gateway, các kênh và
những tính năng tùy chọn khác; tính năng này cũng khả dụng sau đó trong Settings → Crestodian.
</Step>
<Step title="Quyền">

<Frame caption="Chọn các quyền bạn muốn cấp cho OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Quy trình hướng dẫn thiết lập yêu cầu các quyền TCC cho: Automation (AppleScript), Notifications, Accessibility, Screen Recording, Microphone, Speech Recognition, Camera và Location.

</Step>
<Step title="Hoàn tất">
  Sau khi quá trình suy luận vượt qua kiểm tra, Crestodian đảm nhiệm phần thiết lập tùy chọn còn lại và có thể
  chuyển bạn sang cuộc trò chuyện thông thường với tác tử. Việc hoàn tất quy trình hướng dẫn cấp quyền
  sẽ mở cùng cuộc trò chuyện đó; ứng dụng không tạo không gian làm việc hoặc khởi chạy một cuộc trò chuyện
  thiết lập tác tử riêng trước Crestodian. Xem
  [Khởi tạo](/vi/start/bootstrapping) để biết điều gì xảy ra trên máy chủ Gateway
  trong lượt tương tác thực đầu tiên của tác tử.
</Step>
</Steps>

## Liên quan

- [Tổng quan về hướng dẫn thiết lập](/vi/start/onboarding-overview)
- [Bắt đầu](/vi/start/getting-started)
