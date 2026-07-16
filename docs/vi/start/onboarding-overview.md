---
read_when:
    - Chọn quy trình thiết lập ban đầu
    - Thiết lập môi trường mới
sidebarTitle: Onboarding Overview
summary: Tổng quan về các tùy chọn và quy trình thiết lập ban đầu của OpenClaw
title: Tổng quan về quy trình làm quen ban đầu
x-i18n:
    generated_at: "2026-07-16T15:50:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw có quy trình thiết lập ban đầu trên terminal và ứng dụng macOS. Cả hai đều thiết lập suy luận trước:
chúng phát hiện quyền truy cập AI hiện có, yêu cầu một lượt hoàn thành trực tiếp, và chỉ sau đó mới khởi động
OpenClaw để định cấu hình phần thiết lập còn lại. Một Gateway có thể truy cập và đã được định cấu hình,
với tác nhân mặc định đã có mô hình được định cấu hình, sẽ bỏ qua quy trình thiết lập ban đầu và mở
giao diện tác nhân thông thường. Luồng terminal cũng cung cấp trình hướng dẫn cổ điển đầy đủ để
thiết lập chi tiết.

## Nên sử dụng phương thức nào?

|                | Thiết lập ban đầu bằng CLI                         | Thiết lập ban đầu bằng ứng dụng macOS           |
| -------------- | -------------------------------------- | ------------------------------ |
| **Nền tảng**  | macOS, Linux, Windows (gốc hoặc WSL2) | Chỉ macOS                     |
| **Giao diện**  | Thiết lập suy luận, sau đó là OpenClaw         | Thiết lập suy luận, sau đó là OpenClaw |
| **Phù hợp nhất cho**   | Máy chủ, không giao diện, toàn quyền kiểm soát        | Máy Mac để bàn, thiết lập trực quan      |
| **Tự động hóa** | `--non-interactive` cho tập lệnh        | Chỉ thủ công                    |
| **Lệnh**    | `openclaw onboard`                     | Khởi chạy ứng dụng                 |

Hầu hết người dùng nên bắt đầu với **thiết lập ban đầu bằng CLI** — phương thức này hoạt động ở mọi nơi và cung cấp
nhiều quyền kiểm soát nhất.

## Nội dung được định cấu hình trong quá trình thiết lập ban đầu

Giai đoạn suy luận có hướng dẫn chỉ thiết lập:

1. **Nhà cung cấp mô hình và xác thực** — quyền truy cập được phát hiện hoặc lần đăng nhập nhà cung cấp đã xác minh,
   khóa API hoặc token
2. **Suy luận đã xác minh** — một lượt hoàn thành thực trên mô hình có hiệu lực của tác nhân mặc định

Sau khi lượt hoàn thành đó thành công, OpenClaw có thể định cấu hình không gian làm việc, Gateway,
dịch vụ Gateway, kênh, tác nhân, plugin và các tính năng tùy chọn khác.

Trình hướng dẫn CLI cổ điển còn có thể định cấu hình:

1. **Kênh** (tùy chọn) — các kênh trò chuyện tích hợp sẵn và đi kèm như
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp và nhiều kênh khác
2. **Các tùy chọn điều khiển Gateway nâng cao** — chế độ từ xa, cài đặt mạng và lựa chọn daemon

## Thiết lập ban đầu bằng CLI

Chạy trong bất kỳ terminal nào:

```bash
openclaw onboard
```

Luồng có hướng dẫn phát hiện quyền truy cập AI hiện có, kiểm thử trực tiếp từng ứng viên theo thứ tự
và chuyển sang ứng viên tiếp theo khi thất bại. Nếu không còn phương thức phát hiện nào, luồng sẽ hiển thị OpenAI,
Anthropic, xAI (Grok), Google và OpenRouter trước. **Thêm…** chứa
các nhà cung cấp còn lại theo nhóm nhà cung cấp, cùng khu vực, gói dịch vụ và các phương thức
trình duyệt, thiết bị, khóa API hoặc token được hỗ trợ trong menu thứ hai. Luồng chỉ lưu mô hình
và thông tin xác thực sau khi lượt hoàn thành thành công, rồi khởi động OpenClaw để
định cấu hình không gian làm việc, Gateway, kênh, tác nhân, plugin và các tính năng tùy chọn
khác. **Bỏ qua lúc này** sẽ thoát mà không khởi động OpenClaw. Không có
bước chuyển sang luồng cổ điển ngay trong quy trình; hãy thoát và chạy `openclaw onboard --classic` khi bạn muốn
sử dụng trình hướng dẫn cổ điển.

Sau khi suy luận thành công, OpenClaw có thể chuyển việc thiết lập kênh sang một trình hướng dẫn
terminal có dữ liệu nhập được che. Trình này không mở phần thiết lập nhà cung cấp theo hướng dẫn hoặc cổ điển; hãy thoát OpenClaw và
chạy `openclaw onboard` để thay đổi nhà cung cấp mô hình hoặc phương thức xác thực của nhà cung cấp đó.

Sử dụng `openclaw onboard --classic` để thiết lập chi tiết mô hình/xác thực, kênh, kỹ năng,
Gateway từ xa hoặc nhập dữ liệu. Thêm `--install-daemon` cũng sẽ chọn
luồng cổ điển và cài đặt dịch vụ nền trong một bước. Sử dụng `openclaw
openclaw` để thiết lập và sửa chữa không liên quan đến suy luận theo kiểu hội thoại. `openclaw
onboard --modern` là bí danh tương thích sử dụng cùng cổng kiểm tra suy luận
trực tiếp.

Tài liệu tham khảo đầy đủ: [Thiết lập ban đầu (CLI)](/vi/start/wizard)
Tài liệu lệnh CLI: [`openclaw onboard`](/vi/cli/onboard)

## Thiết lập ban đầu bằng ứng dụng macOS

Mở ứng dụng OpenClaw. Nếu Gateway cục bộ hoặc từ xa đã định cấu hình của ứng dụng có thể truy cập được
và tác nhân mặc định đã có mô hình được định cấu hình, ứng dụng sẽ bỏ qua quy trình thiết lập ban đầu
và OpenClaw, rồi mở ngay giao diện tác nhân thông thường.

Đối với Gateway mới hoặc chưa hoàn chỉnh, luồng chạy lần đầu sẽ phát hiện quyền truy cập AI
hiện có (Claude Code, Codex hoặc khóa API), kiểm thử trực tiếp
tùy chọn tốt nhất và chỉ lưu sau khi nhận được phản hồi thực — tự động chuyển sang phương án khác và
cung cấp bước nhập khóa API thủ công có xác minh khi không tìm thấy gì. Thông tin xác thực
nhạy cảm sử dụng trường nhập được che. Sau khi suy luận thành công, OpenClaw sẽ khởi động và
hỗ trợ định cấu hình phần còn lại.

Gemini CLI vẫn khả dụng cho các tác nhân thông thường sau khi thiết lập, nhưng không được
cung cấp cho cổng kiểm tra suy luận này vì không thể bắt buộc phép thăm dò không dùng công cụ.

Tài liệu tham khảo đầy đủ: [Thiết lập ban đầu (ứng dụng macOS)](/vi/start/onboarding)

## Nhà cung cấp tùy chỉnh hoặc không có trong danh sách

Nếu nhà cung cấp của bạn không có trong danh sách, hãy chạy `openclaw onboard --classic`, chọn
**Nhà cung cấp tùy chỉnh** và nhập:

- Khả năng tương thích của điểm cuối: tương thích OpenAI (`/chat/completions`), tương thích OpenAI Responses (`/responses`), tương thích Anthropic (`/messages`) hoặc không xác định (thăm dò cả ba và tự động phát hiện)
- URL cơ sở và khóa API (khóa API là tùy chọn nếu điểm cuối không yêu cầu)
- ID mô hình và bí danh mô hình tùy chọn

Có thể cùng lúc sử dụng nhiều điểm cuối tùy chỉnh — mỗi điểm cuối có ID điểm cuối riêng.

## Liên quan

- [Bắt đầu](/vi/start/getting-started)
- [Tài liệu tham khảo về thiết lập CLI](/vi/start/wizard-cli-reference)
