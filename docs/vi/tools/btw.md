---
read_when:
    - Bạn muốn hỏi nhanh một câu hỏi bên lề về phiên hiện tại
    - Bạn đang triển khai hoặc gỡ lỗi hành vi BTW trên các máy khách
summary: Câu hỏi phụ tạm thời với /btw
title: Nhân tiện, các câu hỏi phụ
x-i18n:
    generated_at: "2026-06-27T18:13:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
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
4. để nguyên lượt chạy chính,
5. **không** ghi câu hỏi hoặc câu trả lời BTW vào lịch sử phiên,
6. phát câu trả lời dưới dạng **kết quả phụ trực tiếp** thay vì một tin nhắn trợ lý thông thường.

Mô hình tư duy quan trọng là:

- cùng ngữ cảnh phiên
- truy vấn phụ một lần riêng biệt
- cùng phương thức truyền tải harness gốc khi phiên dùng harness gốc
- không làm nhiễu ngữ cảnh tương lai
- không lưu bản ghi hội thoại

Đối với các phiên harness Codex, BTW vẫn nằm trong Codex bằng cách fork luồng
app-server đang hoạt động thành một luồng phụ tạm thời. Điều đó giữ nguyên OAuth
Codex và hành vi luồng gốc, đồng thời vẫn cô lập câu trả lời phụ khỏi bản ghi
hội thoại cha. Giống như `/side` của Codex, luồng phụ giữ các quyền Codex hiện
tại và bề mặt công cụ gốc, với các guardrail yêu cầu mô hình không xem công việc
kế thừa từ luồng cha là chỉ dẫn đang hoạt động.

Đối với các bí danh runtime CLI, BTW dùng backend CLI sở hữu ở chế độ câu hỏi
phụ thay vì rơi về một lệnh gọi provider trực tiếp. OpenClaw đưa ngữ cảnh hội
thoại đã được làm sạch vào một lần gọi CLI một lần mới, tắt việc đóng gói công
cụ MCP của OpenClaw và trạng thái phiên CLI có thể tái sử dụng cho lần gọi đó,
và để backend thêm mọi cờ no-resume hoặc no-tools gốc của CLI mà nó hỗ trợ. Các
runtime không phải CLI trực tiếp vẫn giữ đường dẫn một lần trực tiếp.

## Những điều nó không làm

`/btw` **không**:

- tạo một phiên bền vững mới,
- tiếp tục tác vụ chính chưa hoàn tất,
- ghi dữ liệu câu hỏi/câu trả lời BTW vào lịch sử bản ghi hội thoại,
- xuất hiện trong `chat.history`,
- tồn tại sau khi tải lại.

Nó được thiết kế là **tạm thời**.

## Cách ngữ cảnh hoạt động

BTW dùng phiên hiện tại chỉ làm **ngữ cảnh nền**.

Nếu lượt chạy chính hiện đang hoạt động, OpenClaw chụp nhanh trạng thái tin
nhắn hiện tại và bao gồm prompt chính đang chạy làm ngữ cảnh nền, đồng thời yêu
cầu rõ mô hình:

- chỉ trả lời câu hỏi phụ,
- không tiếp tục hoặc hoàn tất tác vụ chính chưa xong,
- không điều hướng cuộc hội thoại cha.

Điều đó giữ BTW tách biệt khỏi lượt chạy chính, đồng thời vẫn giúp nó nhận biết
phiên đang nói về điều gì.

## Mô hình phân phối

BTW **không** được phân phối như một tin nhắn bản ghi hội thoại trợ lý thông thường.

Ở cấp giao thức Gateway:

- chat trợ lý thông thường dùng sự kiện `chat`
- BTW dùng sự kiện `chat.side_result`

Sự tách biệt này là có chủ đích. Nếu BTW tái sử dụng đường dẫn sự kiện `chat`
thông thường, client sẽ xem nó như lịch sử hội thoại thường lệ.

Vì BTW dùng một sự kiện trực tiếp riêng và không được phát lại từ
`chat.history`, nó biến mất sau khi tải lại.

## Hành vi bề mặt

### TUI

Trong TUI, BTW được hiển thị nội tuyến trong chế độ xem phiên hiện tại, nhưng
nó vẫn là tạm thời:

- khác biệt rõ ràng với một câu trả lời trợ lý thông thường
- có thể đóng bằng `Enter` hoặc `Esc`
- không được phát lại khi tải lại

### Kênh bên ngoài

Trên các kênh như Telegram, WhatsApp và Discord, BTW được gửi dưới dạng một câu
trả lời một lần có nhãn rõ ràng vì các bề mặt đó không có khái niệm lớp phủ tạm
thời cục bộ.

Câu trả lời vẫn được xử lý như một kết quả phụ, không phải lịch sử phiên thông thường.

### Control UI / web

Gateway phát BTW đúng cách dưới dạng `chat.side_result`, và BTW không được bao
gồm trong `chat.history`, nên hợp đồng lưu bền đã đúng cho web.

Control UI hiện tại vẫn cần một consumer `chat.side_result` chuyên dụng để hiển
thị BTW trực tiếp trong trình duyệt. Cho đến khi hỗ trợ phía client đó được hoàn
thiện, BTW là một tính năng cấp Gateway với đầy đủ hành vi trong TUI và kênh
bên ngoài, nhưng chưa phải là một UX trình duyệt hoàn chỉnh.

## Khi nào nên dùng BTW

Dùng `/btw` khi bạn muốn:

- làm rõ nhanh về công việc hiện tại,
- một câu trả lời phụ mang tính sự kiện trong khi một lượt chạy dài vẫn đang tiếp diễn,
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

Không dùng `/btw` khi bạn muốn câu trả lời trở thành một phần của ngữ cảnh làm
việc tương lai của phiên.

Trong trường hợp đó, hãy hỏi bình thường trong phiên chính thay vì dùng BTW.

## Liên quan

<CardGroup cols={2}>
  <Card title="Slash commands" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh gốc và chỉ thị chat.
  </Card>
  <Card title="Thinking levels" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận cho lệnh gọi mô hình câu hỏi phụ.
  </Card>
  <Card title="Session" href="/vi/concepts/session" icon="comments">
    Khóa phiên, lịch sử và ngữ nghĩa lưu bền.
  </Card>
  <Card title="Steer command" href="/vi/tools/steer" icon="arrow-right">
    Chèn một tin nhắn điều hướng vào lượt chạy đang hoạt động mà không kết thúc nó.
  </Card>
</CardGroup>
