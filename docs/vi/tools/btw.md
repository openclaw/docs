---
read_when:
    - Bạn muốn hỏi một câu hỏi phụ nhanh về phiên hiện tại
    - Bạn đang triển khai hoặc gỡ lỗi hành vi BTW trên các máy khách
summary: Câu hỏi phụ tạm thời với /btw
title: Nhân tiện, các câu hỏi phụ
x-i18n:
    generated_at: "2026-05-03T21:36:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` cho phép bạn hỏi nhanh một câu hỏi phụ về **phiên hiện tại** mà không
biến câu hỏi đó thành lịch sử hội thoại thông thường. `/side` là bí danh.

Nó được mô phỏng theo hành vi `/btw` của Claude Code, nhưng được điều chỉnh cho
Gateway và kiến trúc đa kênh của OpenClaw.

## Chức năng

Khi bạn gửi:

```text
/btw what changed?
```

OpenClaw:

1. chụp nhanh ngữ cảnh phiên hiện tại,
2. chạy một lệnh gọi mô hình riêng **không dùng công cụ**,
3. chỉ trả lời câu hỏi phụ,
4. giữ nguyên lượt chạy chính,
5. **không** ghi câu hỏi hoặc câu trả lời BTW vào lịch sử phiên,
6. phát câu trả lời dưới dạng **kết quả phụ trực tiếp** thay vì một tin nhắn trợ lý thông thường.

Mô hình tư duy quan trọng là:

- cùng ngữ cảnh phiên
- truy vấn phụ một lần riêng biệt
- không có lệnh gọi công cụ
- không làm nhiễu ngữ cảnh tương lai
- không lưu bền bản ghi hội thoại

## Những việc nó không làm

`/btw` **không**:

- tạo một phiên bền mới,
- tiếp tục tác vụ chính chưa hoàn tất,
- chạy công cụ hoặc vòng lặp công cụ của agent,
- ghi dữ liệu câu hỏi/câu trả lời BTW vào lịch sử bản ghi hội thoại,
- xuất hiện trong `chat.history`,
- tồn tại sau khi tải lại.

Nó được thiết kế là **tạm thời**.

## Cách ngữ cảnh hoạt động

BTW chỉ dùng phiên hiện tại làm **ngữ cảnh nền**.

Nếu lượt chạy chính hiện đang hoạt động, OpenClaw chụp nhanh trạng thái tin nhắn
hiện tại và đưa prompt chính đang chạy vào làm ngữ cảnh nền, đồng thời chỉ dẫn
rõ cho mô hình:

- chỉ trả lời câu hỏi phụ,
- không tiếp tục hoặc hoàn tất tác vụ chính chưa hoàn tất,
- không phát lệnh gọi công cụ hoặc lệnh gọi giả công cụ.

Điều đó giữ BTW tách biệt khỏi lượt chạy chính nhưng vẫn giúp nó biết phiên này
đang nói về việc gì.

## Mô hình phân phối

BTW **không** được phân phối như một tin nhắn trợ lý thông thường trong bản ghi hội thoại.

Ở cấp giao thức Gateway:

- chat trợ lý thông thường dùng sự kiện `chat`
- BTW dùng sự kiện `chat.side_result`

Sự tách biệt này là có chủ ý. Nếu BTW tái sử dụng đường dẫn sự kiện `chat`
thông thường, client sẽ xử lý nó như lịch sử hội thoại thông thường.

Vì BTW dùng một sự kiện trực tiếp riêng và không được phát lại từ
`chat.history`, nó biến mất sau khi tải lại.

## Hành vi trên bề mặt

### TUI

Trong TUI, BTW được hiển thị nội tuyến trong chế độ xem phiên hiện tại, nhưng vẫn
là tạm thời:

- khác biệt rõ ràng với phản hồi trợ lý thông thường
- có thể đóng bằng `Enter` hoặc `Esc`
- không được phát lại khi tải lại

### Kênh bên ngoài

Trên các kênh như Telegram, WhatsApp và Discord, BTW được gửi dưới dạng một
phản hồi một lần được gắn nhãn rõ ràng vì các bề mặt đó không có khái niệm lớp
phủ tạm thời cục bộ.

Câu trả lời vẫn được xử lý như một kết quả phụ, không phải lịch sử phiên thông thường.

### Control UI / web

Gateway phát BTW đúng dưới dạng `chat.side_result`, và BTW không được đưa vào
`chat.history`, vì vậy hợp đồng lưu bền đã đúng cho web.

Control UI hiện tại vẫn cần một consumer `chat.side_result` chuyên dụng để
hiển thị BTW trực tiếp trong trình duyệt. Cho đến khi hỗ trợ phía client đó
được hoàn thiện, BTW là một tính năng cấp Gateway với đầy đủ hành vi trong TUI
và kênh bên ngoài, nhưng chưa phải là một UX trình duyệt hoàn chỉnh.

## Khi nào nên dùng BTW

Dùng `/btw` khi bạn muốn:

- một lời làm rõ nhanh về công việc hiện tại,
- một câu trả lời phụ mang tính sự kiện trong khi một lượt chạy dài vẫn đang diễn ra,
- một câu trả lời tạm thời không nên trở thành một phần của ngữ cảnh phiên tương lai.

Ví dụ:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Khi nào không nên dùng BTW

Không dùng `/btw` khi bạn muốn câu trả lời trở thành một phần của ngữ cảnh làm
việc tương lai của phiên.

Trong trường hợp đó, hãy hỏi bình thường trong phiên chính thay vì dùng BTW.

## Liên quan

- [Lệnh slash](/vi/tools/slash-commands)
- [Mức độ suy nghĩ](/vi/tools/thinking)
- [Phiên](/vi/concepts/session)
