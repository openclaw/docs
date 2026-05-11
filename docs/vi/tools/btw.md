---
read_when:
    - Bạn muốn hỏi nhanh một câu hỏi phụ về phiên hiện tại
    - Bạn đang triển khai hoặc gỡ lỗi hành vi BTW trên các máy khách
summary: Các câu hỏi phụ tạm thời với /btw
title: Nhân tiện, các câu hỏi phụ
x-i18n:
    generated_at: "2026-05-11T20:37:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` cho phép bạn hỏi nhanh một câu hỏi phụ về **phiên hiện tại** mà không
biến câu hỏi đó thành lịch sử hội thoại thông thường. `/side` là một bí danh.

Nó được mô phỏng theo hành vi `/btw` của Claude Code, nhưng được điều chỉnh cho
Gateway và kiến trúc đa kênh của OpenClaw.

## Chức năng

Khi bạn gửi:

```text
/btw what changed?
```

OpenClaw:

1. chụp nhanh ngữ cảnh phiên hiện tại,
2. chạy một truy vấn phụ tạm thời riêng biệt,
3. chỉ trả lời câu hỏi phụ,
4. giữ nguyên lần chạy chính,
5. **không** ghi câu hỏi hoặc câu trả lời BTW vào lịch sử phiên,
6. phát câu trả lời dưới dạng **kết quả phụ trực tiếp** thay vì thông điệp trợ lý thông thường.

Mô hình tư duy quan trọng là:

- cùng ngữ cảnh phiên
- truy vấn phụ một lần riêng biệt
- cùng cơ chế truyền tải bộ khung gốc khi phiên dùng bộ khung gốc
- không làm ô nhiễm ngữ cảnh tương lai
- không lưu bản ghi hội thoại

Đối với các phiên dùng bộ khung Codex, BTW vẫn nằm trong Codex bằng cách fork
luồng app-server đang hoạt động thành một luồng phụ tạm thời. Điều đó giữ nguyên
OAuth của Codex và hành vi luồng gốc, đồng thời vẫn cô lập câu trả lời phụ khỏi
bản ghi hội thoại cha. Giống như `/side` của Codex, luồng phụ giữ các quyền
Codex hiện tại và bề mặt công cụ gốc, với các biện pháp bảo vệ yêu cầu mô hình
không xem công việc kế thừa từ luồng cha là chỉ dẫn đang hoạt động. Các runtime
không phải Codex vẫn giữ đường dẫn một lần trực tiếp cũ hơn.

## Điều nó không làm

`/btw` **không**:

- tạo một phiên bền vững mới,
- tiếp tục tác vụ chính còn dang dở,
- ghi dữ liệu câu hỏi/câu trả lời BTW vào lịch sử bản ghi hội thoại,
- xuất hiện trong `chat.history`,
- tồn tại sau khi tải lại.

Nó được thiết kế có chủ ý là **tạm thời**.

## Cách ngữ cảnh hoạt động

BTW chỉ dùng phiên hiện tại làm **ngữ cảnh nền**.

Nếu lần chạy chính hiện đang hoạt động, OpenClaw chụp nhanh trạng thái thông điệp
hiện tại và bao gồm prompt chính đang chạy làm ngữ cảnh nền, đồng thời yêu cầu
mô hình một cách rõ ràng:

- chỉ trả lời câu hỏi phụ,
- không tiếp tục hoặc hoàn tất tác vụ chính còn dang dở,
- không điều hướng hội thoại cha.

Điều đó giữ BTW tách biệt khỏi lần chạy chính, đồng thời vẫn giúp nó biết phiên
đang nói về điều gì.

## Mô hình phân phối

BTW **không** được phân phối dưới dạng thông điệp bản ghi hội thoại trợ lý thông thường.

Ở cấp giao thức Gateway:

- cuộc trò chuyện trợ lý thông thường dùng sự kiện `chat`
- BTW dùng sự kiện `chat.side_result`

Sự tách biệt này là có chủ ý. Nếu BTW dùng lại đường dẫn sự kiện `chat` thông thường,
client sẽ xử lý nó như lịch sử hội thoại thông thường.

Vì BTW dùng một sự kiện trực tiếp riêng biệt và không được phát lại từ
`chat.history`, nó biến mất sau khi tải lại.

## Hành vi trên bề mặt

### TUI

Trong TUI, BTW được hiển thị nội tuyến trong chế độ xem phiên hiện tại, nhưng nó vẫn
mang tính tạm thời:

- khác biệt rõ ràng với phản hồi trợ lý thông thường
- có thể đóng bằng `Enter` hoặc `Esc`
- không được phát lại khi tải lại

### Kênh bên ngoài

Trên các kênh như Telegram, WhatsApp và Discord, BTW được gửi dưới dạng một phản hồi
một lần có nhãn rõ ràng vì các bề mặt đó không có khái niệm lớp phủ tạm thời cục bộ.

Câu trả lời vẫn được xử lý như một kết quả phụ, không phải lịch sử phiên thông thường.

### Control UI / web

Gateway phát BTW đúng cách dưới dạng `chat.side_result`, và BTW không được đưa vào
`chat.history`, nên hợp đồng lưu giữ đã đúng cho web.

Control UI hiện tại vẫn cần một consumer riêng cho `chat.side_result` để hiển thị
BTW trực tiếp trong trình duyệt. Cho đến khi phần hỗ trợ phía client đó được đưa vào,
BTW là một tính năng ở cấp Gateway với đầy đủ hành vi trên TUI và kênh bên ngoài,
nhưng chưa phải là một trải nghiệm trình duyệt hoàn chỉnh.

## Khi nào dùng BTW

Dùng `/btw` khi bạn muốn:

- làm rõ nhanh về công việc hiện tại,
- nhận câu trả lời phụ mang tính sự kiện trong khi một lần chạy dài vẫn đang diễn ra,
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

Không dùng `/btw` khi bạn muốn câu trả lời trở thành một phần của ngữ cảnh làm việc
tương lai của phiên.

Trong trường hợp đó, hãy hỏi bình thường trong phiên chính thay vì dùng BTW.

## Liên quan

<CardGroup cols={2}>
  <Card title="Lệnh gạch chéo" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh gốc và chỉ thị trò chuyện.
  </Card>
  <Card title="Mức độ suy nghĩ" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực lập luận cho lệnh gọi mô hình câu hỏi phụ.
  </Card>
  <Card title="Phiên" href="/vi/concepts/session" icon="comments">
    Khóa phiên, lịch sử và ngữ nghĩa lưu giữ.
  </Card>
  <Card title="Lệnh điều hướng" href="/vi/tools/steer" icon="arrow-right">
    Chèn thông điệp điều hướng vào lần chạy đang hoạt động mà không kết thúc nó.
  </Card>
</CardGroup>
