---
read_when:
    - Bạn muốn hỏi nhanh một câu hỏi bên lề về phiên hiện tại
    - Bạn đang triển khai hoặc gỡ lỗi hành vi BTW trên các ứng dụng khách
summary: Câu hỏi phụ tạm thời với /btw
title: Nhân tiện, các câu hỏi phụ
x-i18n:
    generated_at: "2026-05-06T09:31:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` cho phép bạn đặt một câu hỏi phụ nhanh về **phiên hiện tại** mà không
biến câu hỏi đó thành lịch sử hội thoại thông thường. `/side` là một bí danh.

Nó được mô phỏng theo hành vi `/btw` của Claude Code, nhưng được điều chỉnh cho
Gateway và kiến trúc đa kênh của OpenClaw.

## Nó làm gì

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
6. phát câu trả lời dưới dạng **kết quả phụ trực tiếp** thay vì một thông điệp trợ lý thông thường.

Mô hình tư duy quan trọng là:

- cùng ngữ cảnh phiên
- truy vấn phụ một lần riêng biệt
- không có lệnh gọi công cụ
- không làm ô nhiễm ngữ cảnh tương lai
- không lưu bản ghi hội thoại

## Nó không làm gì

`/btw` **không**:

- tạo một phiên bền vững mới,
- tiếp tục tác vụ chính chưa hoàn tất,
- chạy công cụ hoặc vòng lặp công cụ của tác tử,
- ghi dữ liệu câu hỏi/câu trả lời BTW vào lịch sử bản ghi hội thoại,
- xuất hiện trong `chat.history`,
- tồn tại sau khi tải lại.

Nó được thiết kế có chủ đích là **tạm thời**.

## Cách ngữ cảnh hoạt động

BTW chỉ sử dụng phiên hiện tại làm **ngữ cảnh nền**.

Nếu lượt chạy chính hiện đang hoạt động, OpenClaw sẽ chụp nhanh trạng thái thông điệp
hiện tại và đưa lời nhắc chính đang chạy vào làm ngữ cảnh nền, đồng thời
chỉ dẫn rõ cho mô hình:

- chỉ trả lời câu hỏi phụ,
- không tiếp tục hoặc hoàn tất tác vụ chính chưa hoàn tất,
- không phát lệnh gọi công cụ hoặc lệnh gọi công cụ giả.

Điều đó giữ BTW tách biệt khỏi lượt chạy chính trong khi vẫn giúp nó biết phiên
đang nói về nội dung gì.

## Mô hình phân phối

BTW **không** được phân phối như một thông điệp bản ghi hội thoại của trợ lý thông thường.

Ở cấp giao thức Gateway:

- chat trợ lý thông thường dùng sự kiện `chat`
- BTW dùng sự kiện `chat.side_result`

Sự tách biệt này là có chủ đích. Nếu BTW dùng lại đường dẫn sự kiện `chat`
thông thường, các máy khách sẽ xử lý nó như lịch sử hội thoại thường lệ.

Vì BTW dùng một sự kiện trực tiếp riêng và không được phát lại từ
`chat.history`, nó sẽ biến mất sau khi tải lại.

## Hành vi trên bề mặt

### TUI

Trong TUI, BTW được hiển thị nội tuyến trong chế độ xem phiên hiện tại, nhưng nó vẫn
tạm thời:

- khác biệt rõ ràng với phản hồi trợ lý thông thường
- có thể đóng bằng `Enter` hoặc `Esc`
- không được phát lại khi tải lại

### Kênh bên ngoài

Trên các kênh như Telegram, WhatsApp và Discord, BTW được phân phối dưới dạng một
phản hồi một lần được gắn nhãn rõ ràng vì những bề mặt đó không có khái niệm lớp phủ
tạm thời cục bộ.

Câu trả lời vẫn được xử lý như một kết quả phụ, không phải lịch sử phiên thông thường.

### Control UI / web

Gateway phát BTW đúng dưới dạng `chat.side_result`, và BTW không được đưa vào
`chat.history`, vì vậy hợp đồng lưu giữ đã đúng cho web.

Control UI hiện tại vẫn cần một bộ tiêu thụ `chat.side_result` chuyên dụng để
hiển thị BTW trực tiếp trong trình duyệt. Cho đến khi phần hỗ trợ phía máy khách đó được hoàn thiện, BTW là một
tính năng cấp Gateway với đầy đủ hành vi trên TUI và kênh bên ngoài, nhưng chưa phải là
một trải nghiệm trình duyệt hoàn chỉnh.

## Khi nào dùng BTW

Dùng `/btw` khi bạn muốn:

- một lời làm rõ nhanh về công việc hiện tại,
- một câu trả lời phụ mang tính sự kiện trong khi một lượt chạy dài vẫn đang diễn ra,
- một câu trả lời tạm thời không nên trở thành một phần của ngữ cảnh phiên trong tương lai.

Ví dụ:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Khi nào không nên dùng BTW

Không dùng `/btw` khi bạn muốn câu trả lời trở thành một phần trong ngữ cảnh làm việc
tương lai của phiên.

Trong trường hợp đó, hãy hỏi bình thường trong phiên chính thay vì dùng BTW.

## Liên quan

<CardGroup cols={2}>
  <Card title="Slash commands" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh gốc và chỉ thị chat.
  </Card>
  <Card title="Thinking levels" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận cho lệnh gọi mô hình của câu hỏi phụ.
  </Card>
  <Card title="Session" href="/vi/concepts/session" icon="comments">
    Khóa phiên, lịch sử và ngữ nghĩa lưu giữ.
  </Card>
  <Card title="Steer command" href="/vi/tools/steer" icon="arrow-right">
    Chèn một thông điệp điều hướng vào lượt chạy đang hoạt động mà không kết thúc nó.
  </Card>
</CardGroup>
