---
read_when:
    - Thiết kế trợ lý hướng dẫn thiết lập ban đầu trên macOS
    - Triển khai thiết lập xác thực hoặc danh tính
sidebarTitle: 'Onboarding: macOS App'
summary: Luồng thiết lập lần đầu cho OpenClaw (ứng dụng macOS)
title: Hướng dẫn thiết lập ban đầu (ứng dụng macOS)
x-i18n:
    generated_at: "2026-07-21T13:53:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55154774886c530de92b2110d367af24e2142fac48b901f288582d8552a6ca10
    source_path: start/onboarding.md
    workflow: 16
---

Luồng chạy lần đầu của ứng dụng macOS: chọn nơi Gateway chạy, kết nối một backend AI đã xác minh, cấp quyền và chuyển giao cho quy trình bootstrap riêng của agent.
Để tìm hiểu quy trình thiết lập ban đầu bằng CLI và so sánh hai phương thức, xem [Tổng quan về thiết lập ban đầu](/vi/start/onboarding-overview).

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
<Step title="Chào mừng và thông báo bảo mật">
<Frame caption="Đọc thông báo bảo mật được hiển thị và đưa ra quyết định phù hợp">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Mô hình tin cậy bảo mật:

- Theo mặc định, OpenClaw là một agent cá nhân: một ranh giới dành cho người vận hành đáng tin cậy.
- Các thiết lập dùng chung/nhiều người dùng cần được siết chặt: tách biệt các ranh giới tin cậy, duy trì quyền truy cập công cụ ở mức tối thiểu và tuân theo hướng dẫn trong [Bảo mật](/vi/gateway/security).
- Theo mặc định, quy trình thiết lập ban đầu cục bộ đặt cấu hình mới thành `tools.profile: "coding"` để các thiết lập mới vẫn có các công cụ hệ thống tệp/runtime mà không cần hồ sơ `full` không bị giới hạn.
- Nếu bật hook/webhook hoặc các nguồn cấp nội dung không đáng tin cậy khác, hãy sử dụng cấp mô hình hiện đại, mạnh mẽ và duy trì chính sách công cụ/sandbox nghiêm ngặt.

</Step>
<Step title="Cục bộ và từ xa">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** chạy ở đâu?

- **Máy Mac này (chỉ cục bộ):** quy trình thiết lập ban đầu cấu hình xác thực và ghi thông tin xác thực trên máy cục bộ.
- **Từ xa (qua SSH/Tailnet):** quy trình thiết lập ban đầu **không** cấu hình xác thực cục bộ;
  thông tin xác thực phải có sẵn trên máy chủ Gateway. Trường token của Gateway từ xa
  lưu token mà ứng dụng macOS dùng để kết nối với Gateway đó;
  các giá trị SecretRef `gateway.remote.token` hiện có được giữ nguyên cho đến khi bạn
  thay thế chúng.
- **Cấu hình sau:** bỏ qua quá trình thiết lập và để ứng dụng chưa được cấu hình.

<Tip>
**Mẹo xác thực Gateway:**

- Chế độ xác thực Gateway mặc định là `token` ngay cả với các liên kết loopback, vì vậy các máy khách WS cục bộ phải xác thực.
- Việc đặt `gateway.auth.mode: "none"` cho phép mọi tiến trình cục bộ kết nối; chỉ sử dụng tùy chọn này trên các máy hoàn toàn đáng tin cậy.
- Sử dụng token để truy cập từ nhiều máy hoặc với các liên kết không phải loopback.

</Tip>
</Step>
<Step title="CLI">
  Thiết lập cục bộ cài đặt CLI `openclaw` toàn cục thông qua npm, pnpm hoặc bun,
  ưu tiên npm trước. Node vẫn là runtime được khuyên dùng cho chính Gateway.
  Các bản cài đặt tương thích hiện có sẽ được tái sử dụng.
</Step>
<Step title="Kết nối AI của bạn">
  Một Gateway đã kết nối và có sẵn mô hình agent được cấu hình sẽ bỏ qua hoàn toàn
  trang này và mở giao diện người dùng agent thông thường. Quá trình thiết lập OpenClaw và nhà cung cấp
  chỉ chạy cho Gateway mới hoặc chưa hoàn chỉnh.

Khi Gateway đã sẵn sàng, quy trình thiết lập ban đầu sẽ tìm quyền truy cập AI mà bạn đã có:
thông tin đăng nhập Claude Code hoặc Codex, `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, hoặc một
mô hình có khả năng sử dụng công cụ với ngữ cảnh hiệu dụng đo được ít nhất là 16K,
đã được cài đặt trên máy chủ Ollama hoặc LM Studio có thể truy cập. Hoạt động phát hiện chạy trên
máy chủ Gateway, kể cả khi ứng dụng macOS kết nối với Gateway trên Linux. Tùy chọn tốt nhất
được kiểm thử bằng một lượt hoàn thành thực tế và chỉ được lưu
sau khi phản hồi; khi kiểm thử thất bại, ứng dụng sẽ tự động thử tùy chọn tiếp theo
và hiển thị lý do tùy chọn trước đó thất bại. Nếu tìm thấy nhiều tùy chọn, bạn có thể
chuyển đổi giữa chúng trước khi tiếp tục. Hoạt động khám phá cục bộ tự động không bao giờ kéo về
hoặc tải xuống mô hình.

Để sử dụng gói đăng ký Claude khi máy chủ Gateway không có thông tin đăng nhập Claude CLI, hãy chạy
`claude setup-token` trên bất kỳ máy nào đã cài đặt Claude Code, sau đó dán
token được in ra dưới dạng **Anthropic setup-token** trong **Connect with an API key or
token**.

Các CLI Gemini CLI, Antigravity, Pi và OpenCode đã cài đặt được hiển thị để cung cấp ngữ cảnh
khi không thể chọn chúng làm tuyến suy luận có hướng dẫn có thể tái sử dụng cho quá trình thiết lập.
Gemini và Antigravity không thể thực thi bước thăm dò suy luận không dùng công cụ. Pi và
OpenCode là các bộ khung agent hoàn chỉnh thay vì các tuyến suy luận thiết lập; các tích hợp
phiên của chúng yêu cầu thiết lập runtime và Plugin riêng.

Bạn cũng có thể đăng nhập thông qua luồng OAuth hoặc ghép đôi thiết bị riêng của nhà cung cấp.
Các lựa chọn tích hợp sẵn gồm OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global và CN, cùng Chutes. Danh sách này đến từ các Plugin
nhà cung cấp suy luận văn bản đang hoạt động của Gateway thay vì một danh sách cố định trong ứng dụng,
vì vậy nhà cung cấp khác có thể tham gia mà không cần thêm mã macOS dành riêng cho nhà cung cấp.

Bộ chọn khóa/token thủ công sử dụng cùng một sổ đăng ký nhà cung cấp. Trong mọi tuyến,
nhà cung cấp cung cấp mô hình khởi đầu và cấu hình của mình; OpenClaw xác minh
thông tin xác thực bằng cùng một kiểm thử trực tiếp trước khi lưu hồ sơ xác thực. Nút Next
vẫn bị khóa cho đến khi một backend vượt qua kiểm thử, vì vậy cuộc trò chuyện agent đầu tiên không thể
bắt đầu nếu suy luận chưa hoạt động. Sau khi bước kiểm tra trực tiếp đó thành công, OpenClaw trở nên
khả dụng để giúp cấu hình phần còn lại của không gian làm việc, Gateway, các kênh và
những tính năng tùy chọn khác. Khi OpenClaw đưa ra một danh sách lựa chọn ngắn, ứng dụng
hiển thị các thẻ tùy chọn gốc; việc chọn một thẻ sẽ gửi lựa chọn đó, và **Skip for
now** luôn giữ lựa chọn ở trạng thái không bắt buộc. OpenClaw cũng khả dụng sau này trong
Settings → OpenClaw.
</Step>
<Step title="Nhập bộ nhớ (hiển thị khi được phát hiện)">
Đối với Gateway cục bộ, quy trình thiết lập ban đầu kiểm tra máy Mac để tìm bộ nhớ từ các công cụ AI
được hỗ trợ: bộ nhớ tự động của Claude Code, bộ nhớ hợp nhất của Codex và các tệp bộ nhớ
Hermes. Khi tìm thấy bất kỳ mục nào, trang này liệt kê từng nguồn cùng số lượng bộ nhớ
và cho phép bạn nhập các nguồn đã chọn vào không gian làm việc của agent tại
`memory/imports/` để truy xuất theo chỉ mục. Các tệp đã nhập sẽ được bỏ qua và
trang này không bao giờ xuất hiện khi không có gì để nhập. Bạn có thể bỏ qua một cách an toàn;
trang nhập Bộ nhớ của bảng điều khiển cung cấp cùng chức năng nhập sau này với khả năng
kiểm soát từng tệp.
</Step>
<Step title="Quyền">

<Frame caption="Chọn những quyền bạn muốn cấp cho OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Quy trình thiết lập ban đầu yêu cầu các quyền TCC cho: Tự động hóa (AppleScript), Thông báo, Trợ năng, Ghi màn hình, Micrô, Nhận dạng giọng nói, Camera và Vị trí.

</Step>
<Step title="Hoàn tất">
  Sau khi suy luận vượt qua kiểm thử, OpenClaw đảm nhiệm phần thiết lập tùy chọn còn lại và có thể
  chuyển bạn sang cuộc trò chuyện agent thông thường. Hoàn tất phần hướng dẫn về quyền
  sẽ mở chính cuộc trò chuyện đó; ứng dụng không tạo không gian làm việc hoặc khởi chạy một
  cuộc trò chuyện thiết lập agent riêng trước OpenClaw. Xem
  [Bootstrap](/vi/start/bootstrapping) để biết điều gì xảy ra trên máy chủ Gateway
  trong lượt thực tế đầu tiên của agent.
</Step>
</Steps>

## Liên quan

- [Tổng quan về thiết lập ban đầu](/vi/start/onboarding-overview)
- [Bắt đầu](/vi/start/getting-started)
