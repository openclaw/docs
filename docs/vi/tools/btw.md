---
read_when:
    - Bạn muốn hỏi nhanh một câu hỏi phụ về phiên hiện tại
    - Bạn đang triển khai hoặc gỡ lỗi hành vi BTW trên các ứng dụng khách
summary: Câu hỏi phụ tạm thời với /btw
title: Nhân tiện, các câu hỏi ngoài lề
x-i18n:
    generated_at: "2026-07-16T15:52:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (bí danh `/side`) đặt một câu hỏi phụ nhanh về **phiên
hiện tại** mà không thêm câu hỏi đó vào lịch sử hội thoại. Tính năng này được xây dựng dựa trên
`/btw` của Claude Code, được điều chỉnh cho phù hợp với Gateway và kiến trúc
đa kênh của OpenClaw.

```text
/btw có gì thay đổi?
/side lỗi này có nghĩa là gì?
```

## Chức năng

1. Chụp nhanh phiên hiện tại làm ngữ cảnh nền (bao gồm mọi lời nhắc
   của lượt chạy chính đang diễn ra).
2. Chạy một truy vấn phụ riêng biệt, dùng một lần, yêu cầu mô hình chỉ trả lời
   câu hỏi phụ và không tiếp tục hoặc điều hướng tác vụ chính.
3. Gửi câu trả lời dưới dạng kết quả phụ trực tiếp, không phải tin nhắn trợ lý thông thường.
4. Không bao giờ ghi câu hỏi hoặc câu trả lời vào lịch sử phiên hay `chat.history`.

Lượt chạy chính, nếu đang hoạt động, sẽ không bị ảnh hưởng.

Đối với các phiên dùng bộ khung Codex, BTW phân nhánh luồng app-server Codex đang hoạt động thành
một luồng con tạm thời thay vì thực hiện một lệnh gọi nhà cung cấp riêng biệt. Cách này
giữ nguyên OAuth của Codex cùng hành vi gốc của công cụ/luồng, đồng thời luồng
được phân nhánh giữ nguyên chính sách phê duyệt, sandbox và bề mặt công cụ gốc
hiện tại của luồng cha. Luồng được phân nhánh nhận một lời nhắc ranh giới cho mô hình biết rằng
mọi nội dung trước đó là ngữ cảnh tham chiếu được kế thừa, không phải chỉ thị đang có hiệu lực,
và chỉ các tin nhắn sau ranh giới mới có hiệu lực. `/btw` yêu cầu
đã có một luồng Codex; trước tiên hãy gửi một tin nhắn thông thường.

Đối với các bí danh runtime CLI, BTW gọi phần phụ trợ CLI sở hữu ở chế độ
câu hỏi phụ dùng một lần: tính năng này nạp ngữ cảnh hội thoại đã được làm sạch vào một lần gọi CLI
mới, trong đó tính năng gộp công cụ và trạng thái phiên có thể tái sử dụng bị tắt, đồng thời thêm
mọi cờ không-tiếp-tục/không-công-cụ mà phần phụ trợ hỗ trợ. Các runtime trực tiếp (không phải CLI)
thay vào đó sử dụng một lệnh gọi trực tiếp đến nhà cung cấp dùng một lần.

## Những gì tính năng này không thực hiện

`/btw` không tạo phiên lâu dài, tiếp tục tác vụ chính chưa hoàn tất,
lưu dữ liệu câu hỏi/câu trả lời vào lịch sử bản ghi hoặc tồn tại sau khi tải lại.

## Mô hình phân phối

Trò chuyện trợ lý thông thường sử dụng sự kiện Gateway `chat`. BTW sử dụng một
sự kiện `chat.side_result` riêng để ứng dụng khách không thể nhầm sự kiện này với
lịch sử hội thoại thông thường. Vì sự kiện này không được phát lại từ `chat.history`, nó
sẽ biến mất sau khi tải lại.

## Hành vi trên các giao diện

| Giao diện          | Hành vi                                                                                                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Được hiển thị nội tuyến trong nhật ký trò chuyện, khác biệt rõ ràng so với câu trả lời thông thường và có thể đóng bằng `Enter` hoặc `Esc`.                                                                                                                                                                           |
| Kênh bên ngoài | Được gửi dưới dạng câu trả lời dùng một lần có nhãn rõ ràng (Telegram, WhatsApp, Discord không có lớp phủ tạm thời cục bộ).                                                                                                                                                                         |
| Control UI / web  | Được hiển thị dưới dạng bảng nổi "Trò chuyện phụ" được ghim vào luồng. Các câu trả lời tích lũy thành nhiều lượt và ô nhập "Hỏi tiếp" dùng để đặt câu hỏi phụ tiếp theo. Đóng (`Esc` hoặc dấu X) sẽ giữ lại cuộc hội thoại và mở lại khi có câu trả lời tiếp theo; nút thùng rác sẽ xóa cuộc hội thoại và dừng lượt chạy đang chờ. |

## Cửa sổ bật lên khi chọn (Control UI)

Việc tô sáng văn bản trong một tin nhắn trò chuyện trên Control UI sẽ mở một
cửa sổ bật lên nhỏ với hai thao tác:

- **Thêm chi tiết** ngay lập tức gửi một câu hỏi `/btw` ngầm định, yêu cầu
  mô hình giải thích văn bản được tô sáng trong ngữ cảnh của phiên
  hiện tại. Câu trả lời xuất hiện trong bảng trò chuyện phụ nổi.
- **Hỏi trong trò chuyện phụ** điền sẵn vào ô soạn thảo một bản nháp `/btw` có trích dẫn
  văn bản được tô sáng để bạn có thể nhập câu hỏi của riêng mình về văn bản đó.

Cả hai thao tác đều tuân theo ngữ nghĩa `/btw` thông thường: câu hỏi và câu trả lời
không được đưa vào lịch sử phiên, đồng thời lượt chạy chính không bị ảnh hưởng.

## Khi nào nên sử dụng

Sử dụng `/btw` để yêu cầu giải thích nhanh, nhận câu trả lời phụ về dữ kiện trong khi một lượt chạy dài
vẫn đang diễn ra hoặc nhận câu trả lời tạm thời không nên được đưa vào ngữ cảnh
phiên trong tương lai.

```text
/btw chúng ta đang chỉnh sửa tệp nào?
/btw tóm tắt tác vụ hiện tại trong một câu
/btw 17 * 19 bằng bao nhiêu?
```

Đối với bất kỳ nội dung nào bạn muốn trở thành một phần trong ngữ cảnh làm việc
tương lai của phiên, hãy đặt câu hỏi theo cách thông thường trong phiên chính.

## Liên quan

<CardGroup cols={2}>
  <Card title="Lệnh dấu gạch chéo" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh gốc và các chỉ thị trò chuyện.
  </Card>
  <Card title="Mức độ suy luận" href="/vi/tools/thinking" icon="brain">
    Các mức nỗ lực suy luận cho lệnh gọi mô hình xử lý câu hỏi phụ.
  </Card>
  <Card title="Phiên" href="/vi/concepts/session" icon="comments">
    Khóa phiên, lịch sử và ngữ nghĩa lưu giữ.
  </Card>
  <Card title="Lệnh điều hướng" href="/vi/tools/steer" icon="arrow-right">
    Chèn một tin nhắn điều hướng vào lượt chạy đang hoạt động mà không kết thúc lượt chạy.
  </Card>
</CardGroup>
