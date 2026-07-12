---
read_when:
    - Bạn đang thay đổi định dạng Markdown hoặc cách chia đoạn cho các kênh gửi đi
    - Bạn đang thêm một trình định dạng kênh hoặc ánh xạ kiểu mới
    - Bạn đang gỡ lỗi các lỗi hồi quy về định dạng trên nhiều kênh
summary: Quy trình định dạng Markdown cho các kênh gửi đi
title: Định dạng Markdown
x-i18n:
    generated_at: "2026-07-12T07:54:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw chuyển đổi Markdown gửi đi thành một biểu diễn trung gian dùng chung
(IR) trước khi kết xuất đầu ra dành riêng cho từng kênh. IR lưu văn bản thuần cùng
các khoảng định dạng/liên kết, nhờ đó một bước phân tích có thể phục vụ mọi kênh và việc chia đoạn không bao giờ
tách định dạng giữa chừng trong một khoảng.

## Quy trình

1. **Phân tích Markdown thành IR** (`markdownToIR`) - văn bản thuần cùng các khoảng định dạng
   (đậm, nghiêng, gạch ngang, mã, khối mã, nội dung ẩn, trích dẫn khối,
   tiêu đề cấp 1-6) và các khoảng liên kết. Vị trí bù là các đơn vị mã UTF-16 để các phạm vi định dạng của Signal
   khớp trực tiếp với API của Signal. Bảng chỉ được phân tích khi kênh
   chọn sử dụng một chế độ bảng.
2. **Chia đoạn IR** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - việc chia tách diễn ra trên văn bản IR trước khi kết xuất, do đó các định dạng nội dòng và
     liên kết được cắt theo từng đoạn thay vì bị đứt qua ranh giới.
3. **Kết xuất theo từng kênh** (`renderMarkdownWithMarkers`) - ánh xạ dấu định dạng
   chuyển các khoảng thành cú pháp đánh dấu gốc của kênh.

| Kênh                                                              | Bộ kết xuất                                                                           | Ghi chú                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Slack                                                              | các token mrkdwn (`*bold*`, `_italic_`, `` `code` ``, hàng rào mã)                   | Liên kết trở thành `<url\|label>`; tự động liên kết bị tắt khi phân tích để tránh tạo liên kết hai lần       |
| Telegram                                                           | các thẻ HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | Cũng hỗ trợ bảng và tiêu đề trong tin nhắn đa dạng thức (`<h1>`-`<h6>`) khi bật `richMessages`               |
| Signal                                                             | văn bản thuần + các phạm vi `text-style`                                              | Liên kết được kết xuất thành `label (url)` khi nhãn khác với URL                                             |
| Discord, WhatsApp, iMessage, Microsoft Teams và các kênh khác      | văn bản thuần                                                                         | Không có định dạng dựa trên IR; việc chuyển đổi bảng Markdown vẫn chạy qua `convertMarkdownTables`           |

## Ví dụ về IR

Markdown đầu vào:
__OC_I18N_900000__
IR (dạng minh họa):
__OC_I18N_900001__
## Xử lý bảng

`markdown.tables` kiểm soát cách một kênh chuyển đổi bảng Markdown, theo từng
kênh và tùy chọn theo từng tài khoản:

| Chế độ   | Hành vi                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `code`   | Kết xuất dưới dạng bảng ASCII được căn chỉnh bên trong khối mã (mặc định dự phòng)                        |
| `bullets` | Chuyển từng hàng thành các dấu đầu dòng `label: value`                                                    |
| `block`  | Giữ bảng gốc khi lớp vận chuyển hỗ trợ; nếu không thì dự phòng về `code`                                  |
| `off`    | Tắt phân tích bảng; văn bản bảng thô được truyền qua mà không thay đổi                                    |

Các giá trị mặc định của Plugin theo từng kênh: Signal, WhatsApp và Matrix mặc định là
`bullets`; Mattermost mặc định là `off`; Telegram mặc định là `block` (chế độ này
được phân giải thành `code` trừ khi tài khoản đã bật `richMessages`). Mọi
kênh không có giá trị mặc định Plugin rõ ràng sẽ dự phòng về `code`.
__OC_I18N_900002__
## Quy tắc chia đoạn

- Giới hạn đoạn đến từ bộ điều hợp/cấu hình của kênh và áp dụng cho văn bản IR, không phải
  đầu ra đã kết xuất.
- Các khối mã có hàng rào được giữ nguyên thành một khối với ký tự xuống dòng ở cuối để
  các kênh kết xuất đúng hàng rào đóng.
- Tiền tố danh sách và trích dẫn khối là một phần của văn bản IR, vì vậy việc chia đoạn không bao giờ
  tách giữa chừng trong tiền tố.
- Định dạng nội dòng không bao giờ bị tách qua các đoạn; bộ kết xuất mở lại định dạng đang mở
  ở đầu đoạn tiếp theo.

Xem [Phát trực tiếp và chia đoạn](/concepts/streaming) để biết hành vi tại ranh giới đoạn và
hành vi phân phối trên các kênh.

## Chính sách liên kết

- **Slack:** `[label](url)` -> `<url|label>`; URL thuần vẫn được giữ nguyên.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (chế độ phân tích HTML).
- **Signal:** `[label](url)` -> `label (url)` trừ khi nhãn đã
  khớp với URL.

## Nội dung ẩn

Các dấu nội dung ẩn (`||spoiler||`) được phân tích cho Signal (ánh xạ thành các phạm vi định dạng `SPOILER`)
và Telegram (ánh xạ thành `<tg-spoiler>`). Các kênh khác coi
`||...||` là văn bản thuần.

## Thêm hoặc cập nhật bộ định dạng kênh

1. **Phân tích một lần** bằng `markdownToIR(...)`, truyền vào các tùy chọn phù hợp với kênh
   (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Kết xuất** bằng `renderMarkdownWithMarkers(...)` và một ánh xạ dấu định dạng (hoặc
   logic phạm vi định dạng tùy chỉnh cho các lớp vận chuyển như Signal).
3. **Chia đoạn** bằng `chunkMarkdownIR(...)` hoặc
   `renderMarkdownIRChunksWithinLimit(...)` trước khi kết xuất từng đoạn.
4. **Kết nối bộ điều hợp** để gọi trình chia đoạn và bộ kết xuất mới từ
   đường dẫn gửi đi.
5. **Kiểm thử** bằng các kiểm thử định dạng cùng với một kiểm thử phân phối gửi đi nếu kênh
   có chia đoạn.

## Những vấn đề thường gặp

- Các token dấu ngoặc nhọn của Slack (`<@U123>`, `<#C123>`, `<https://...>`) phải
  không bị ảnh hưởng khi thoát ký tự; HTML thô vẫn cần được thoát ký tự an toàn.
- HTML của Telegram yêu cầu thoát ký tự văn bản bên ngoài thẻ để tránh cú pháp đánh dấu bị hỏng.
- Các phạm vi định dạng của Signal sử dụng vị trí bù UTF-16, không phải vị trí bù theo điểm mã.
- Giữ lại ký tự xuống dòng ở cuối các khối mã có hàng rào để dấu đóng
  nằm trên một dòng riêng.

## Liên quan

<CardGroup cols={2}>
  <Card title="Phát trực tiếp và chia đoạn" href="/vi/concepts/streaming" icon="bars-staggered">
    Hành vi phát trực tiếp gửi đi, ranh giới đoạn và hoạt động phân phối dành riêng cho từng kênh.
  </Card>
  <Card title="Lời nhắc hệ thống" href="/vi/concepts/system-prompt" icon="message-lines">
    Nội dung mô hình nhìn thấy trước cuộc trò chuyện, bao gồm các tệp không gian làm việc được chèn vào.
  </Card>
</CardGroup>
