---
read_when:
    - Bạn muốn hỏi nhanh một câu hỏi phụ về phiên hiện tại
    - Bạn đang triển khai hoặc gỡ lỗi hành vi BTW trên các máy khách
summary: Câu hỏi phụ tạm thời với /btw
title: Nhân tiện, các câu hỏi bên lề
x-i18n:
    generated_at: "2026-04-29T23:16:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 16
---

`/btw` cho phép bạn hỏi nhanh một câu hỏi phụ về **phiên hiện tại** mà không
biến câu hỏi đó thành lịch sử hội thoại thông thường.

Nó được mô phỏng theo hành vi `/btw` của Claude Code, nhưng được điều chỉnh cho
Gateway và kiến trúc đa kênh của OpenClaw.

## Chức năng

Khi bạn gửi:

```text
/btw what changed?
```

OpenClaw:

1. chụp nhanh ngữ cảnh phiên hiện tại,
2. chạy một lệnh gọi mô hình **không dùng công cụ** riêng biệt,
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

## Không thực hiện

`/btw` **không**:

- tạo một phiên bền mới,
- tiếp tục tác vụ chính chưa hoàn tất,
- chạy công cụ hoặc vòng lặp công cụ của tác nhân,
- ghi dữ liệu câu hỏi/câu trả lời BTW vào lịch sử bản ghi hội thoại,
- xuất hiện trong `chat.history`,
- tồn tại sau khi tải lại.

Nó được thiết kế là **tạm thời**.

## Cách ngữ cảnh hoạt động

BTW chỉ dùng phiên hiện tại làm **ngữ cảnh nền**.

Nếu lượt chạy chính hiện đang hoạt động, OpenClaw sẽ chụp nhanh trạng thái tin nhắn
hiện tại và đưa prompt chính đang chạy vào làm ngữ cảnh nền, đồng thời
chỉ rõ cho mô hình:

- chỉ trả lời câu hỏi phụ,
- không tiếp tục hoặc hoàn tất tác vụ chính chưa xong,
- không phát lệnh gọi công cụ hoặc lệnh gọi công cụ giả.

Điều đó giữ BTW tách biệt với lượt chạy chính trong khi vẫn giúp nó biết phiên
đang nói về điều gì.

## Mô hình phân phối

BTW **không** được phân phối như một tin nhắn trợ lý thông thường trong bản ghi hội thoại.

Ở cấp giao thức Gateway:

- chat trợ lý thông thường dùng sự kiện `chat`
- BTW dùng sự kiện `chat.side_result`

Sự tách biệt này là có chủ ý. Nếu BTW dùng lại đường dẫn sự kiện `chat` thông thường,
client sẽ xử lý nó như lịch sử hội thoại bình thường.

Vì BTW dùng một sự kiện trực tiếp riêng biệt và không được phát lại từ
`chat.history`, nó sẽ biến mất sau khi tải lại.

## Hành vi trên bề mặt

### TUI

Trong TUI, BTW được hiển thị nội tuyến trong chế độ xem phiên hiện tại, nhưng nó vẫn
mang tính tạm thời:

- khác biệt rõ ràng với phản hồi trợ lý thông thường
- có thể đóng bằng `Enter` hoặc `Esc`
- không được phát lại khi tải lại

### Kênh bên ngoài

Trên các kênh như Telegram, WhatsApp và Discord, BTW được phân phối dưới dạng một
phản hồi một lần có nhãn rõ ràng vì những bề mặt đó không có khái niệm lớp phủ
tạm thời cục bộ.

Câu trả lời vẫn được xử lý như một kết quả phụ, không phải lịch sử phiên thông thường.

### Control UI / web

Gateway phát BTW đúng cách dưới dạng `chat.side_result`, và BTW không được đưa vào
`chat.history`, nên hợp đồng lưu bền đã đúng cho web.

Control UI hiện tại vẫn cần một trình tiêu thụ `chat.side_result` chuyên dụng để
hiển thị BTW trực tiếp trong trình duyệt. Cho đến khi hỗ trợ phía client đó được
hoàn thiện, BTW là một tính năng cấp Gateway với đầy đủ hành vi trong TUI và
kênh bên ngoài, nhưng chưa phải là một trải nghiệm trình duyệt hoàn chỉnh.

## Khi nào dùng BTW

Dùng `/btw` khi bạn muốn:

- làm rõ nhanh về công việc hiện tại,
- một câu trả lời phụ mang tính sự kiện trong khi một lượt chạy dài vẫn đang diễn ra,
- một câu trả lời tạm thời không nên trở thành một phần ngữ cảnh phiên trong tương lai.

Ví dụ:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Khi nào không dùng BTW

Không dùng `/btw` khi bạn muốn câu trả lời trở thành một phần ngữ cảnh làm việc
trong tương lai của phiên.

Trong trường hợp đó, hãy hỏi bình thường trong phiên chính thay vì dùng BTW.

## Liên quan

- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [Mức độ suy nghĩ](/vi/tools/thinking)
- [Phiên](/vi/concepts/session)
