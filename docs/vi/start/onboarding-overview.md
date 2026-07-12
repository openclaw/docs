---
read_when:
    - Chọn quy trình hướng dẫn ban đầu
    - Thiết lập môi trường mới
sidebarTitle: Onboarding Overview
summary: Tổng quan về các tùy chọn và quy trình làm quen ban đầu với OpenClaw
title: Tổng quan về quy trình thiết lập ban đầu
x-i18n:
    generated_at: "2026-07-12T08:23:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw có quy trình thiết lập ban đầu trên terminal và ứng dụng macOS. Cả hai đều thiết lập suy luận trước:
chúng phát hiện quyền truy cập AI hiện có, yêu cầu một lượt hoàn thành trực tiếp và chỉ sau đó mới khởi động
Crestodian để định cấu hình phần thiết lập còn lại. Một Gateway có thể truy cập và đã được định cấu hình,
với tác tử mặc định đã có mô hình được định cấu hình, sẽ bỏ qua quy trình thiết lập ban đầu và mở
giao diện tác tử thông thường. Luồng terminal cũng cung cấp trình hướng dẫn cổ điển đầy đủ để
thiết lập chi tiết.

## Tôi nên sử dụng cách nào?

|                    | Thiết lập ban đầu qua CLI                           | Thiết lập ban đầu qua ứng dụng macOS |
| ------------------ | -------------------------------------------------- | ------------------------------------ |
| **Nền tảng**       | macOS, Linux, Windows (gốc hoặc WSL2)              | Chỉ macOS                            |
| **Giao diện**      | Thiết lập suy luận, sau đó là Crestodian           | Thiết lập suy luận, sau đó là Crestodian |
| **Phù hợp nhất cho** | Máy chủ, không giao diện, toàn quyền kiểm soát    | Máy Mac để bàn, thiết lập trực quan  |
| **Tự động hóa**    | `--non-interactive` dành cho tập lệnh              | Chỉ thủ công                         |
| **Lệnh**           | `openclaw onboard`                                 | Khởi chạy ứng dụng                   |

Hầu hết người dùng nên bắt đầu với **thiết lập ban đầu qua CLI** — cách này hoạt động ở mọi nơi và cho
phép bạn kiểm soát nhiều nhất.

## Quy trình thiết lập ban đầu định cấu hình những gì

Giai đoạn suy luận có hướng dẫn chỉ thiết lập:

1. **Nhà cung cấp mô hình và xác thực** — quyền truy cập được phát hiện hoặc khóa API đã xác minh
2. **Suy luận đã xác minh** — một lượt hoàn thành thực tế trên mô hình hiệu lực của
   tác tử mặc định

Sau khi lượt hoàn thành đó thành công, Crestodian có thể định cấu hình không gian làm việc, Gateway,
dịch vụ Gateway, kênh, tác tử, plugin và các tính năng tùy chọn khác.

Trình hướng dẫn CLI cổ điển còn có thể định cấu hình:

1. **Kênh** (tùy chọn) — các kênh trò chuyện tích hợp sẵn và đi kèm như
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp và nhiều kênh khác
2. **Các tùy chọn điều khiển Gateway nâng cao** — chế độ từ xa, cài đặt mạng và lựa chọn tiến trình nền

## Thiết lập ban đầu qua CLI

Chạy trong bất kỳ terminal nào:

```bash
openclaw onboard
```

Luồng có hướng dẫn phát hiện quyền truy cập AI hiện có, kiểm thử trực tiếp lần lượt các ứng viên,
chuyển sang ứng viên tiếp theo khi thất bại và cung cấp tùy chọn nhập khóa thủ công có che nội dung. Luồng chỉ lưu
mô hình và thông tin xác thực sau khi một lượt hoàn thành thành công, rồi khởi động Crestodian
để định cấu hình không gian làm việc, Gateway, kênh, tác tử, plugin và các
tính năng tùy chọn khác. Không có Crestodian trước suy luận, cách bỏ qua AI hay
chuyển tiếp sang luồng cổ điển ngay trong quy trình. Hãy thoát và chạy `openclaw onboard --classic` khi bạn
muốn sử dụng trình hướng dẫn cổ điển.

Sau khi suy luận thành công, Crestodian có thể chuyển phần thiết lập kênh sang một trình hướng dẫn terminal
có che nội dung. Crestodian không mở phần thiết lập nhà cung cấp có hướng dẫn hoặc cổ điển; hãy thoát Crestodian và
chạy `openclaw onboard` để thay đổi nhà cung cấp mô hình hoặc phương thức xác thực của nhà cung cấp đó.

Sử dụng `openclaw onboard --classic` để thiết lập chi tiết mô hình/xác thực, kênh, skill,
Gateway từ xa hoặc nhập dữ liệu. Thêm `--install-daemon` cũng chọn
luồng cổ điển và cài đặt dịch vụ nền trong một bước. Sử dụng `openclaw
crestodian` để thiết lập và sửa chữa không liên quan đến suy luận bằng hội thoại. `openclaw
onboard --modern` là bí danh tương thích sử dụng cùng một cổng kiểm tra
suy luận trực tiếp.

Tài liệu tham khảo đầy đủ: [Thiết lập ban đầu (CLI)](/vi/start/wizard)
Tài liệu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)

## Thiết lập ban đầu qua ứng dụng macOS

Mở ứng dụng OpenClaw. Nếu Gateway cục bộ hoặc từ xa đã định cấu hình của ứng dụng có thể truy cập được
và tác tử mặc định đã có mô hình được định cấu hình, ứng dụng sẽ bỏ qua quy trình thiết lập ban đầu
và Crestodian, rồi mở ngay giao diện tác tử thông thường.

Đối với Gateway mới hoặc chưa hoàn chỉnh, luồng chạy lần đầu sẽ phát hiện quyền truy cập AI
hiện có (Claude Code, Codex hoặc khóa API), kiểm thử trực tiếp
tùy chọn tốt nhất và chỉ lưu sau khi nhận được phản hồi thực tế — tự động chuyển sang phương án dự phòng và
cung cấp bước nhập khóa API thủ công có xác minh khi không tìm thấy tùy chọn nào. Thông tin xác thực
nhạy cảm sử dụng trường nhập có che nội dung. Sau khi suy luận thành công, Crestodian sẽ khởi động và
hỗ trợ định cấu hình phần còn lại.

Gemini CLI vẫn khả dụng cho các tác tử thông thường sau khi thiết lập, nhưng không được
cung cấp cho cổng kiểm tra suy luận này vì không thể bắt buộc phép thăm dò không dùng công cụ.

Tài liệu tham khảo đầy đủ: [Thiết lập ban đầu (Ứng dụng macOS)](/vi/start/onboarding)

## Nhà cung cấp tùy chỉnh hoặc không có trong danh sách

Nếu nhà cung cấp của bạn không có trong danh sách, hãy chạy `openclaw onboard --classic`, chọn
**Nhà cung cấp tùy chỉnh** và nhập:

- Khả năng tương thích của điểm cuối: tương thích OpenAI (`/chat/completions`), tương thích OpenAI Responses (`/responses`), tương thích Anthropic (`/messages`) hoặc không xác định (thăm dò cả ba và tự động phát hiện)
- URL cơ sở và khóa API (khóa API là tùy chọn nếu điểm cuối không yêu cầu)
- ID mô hình và bí danh mô hình tùy chọn

Nhiều điểm cuối tùy chỉnh có thể cùng tồn tại — mỗi điểm cuối có ID điểm cuối riêng.

## Liên quan

- [Bắt đầu](/vi/start/getting-started)
- [Tài liệu tham khảo về thiết lập CLI](/vi/start/wizard-cli-reference)
