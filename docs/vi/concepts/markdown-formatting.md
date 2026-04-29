---
read_when:
    - Bạn đang thay đổi định dạng Markdown hoặc cách chia đoạn cho các kênh gửi đi
    - Bạn đang thêm một bộ định dạng kênh mới hoặc ánh xạ kiểu
    - Bạn đang gỡ lỗi các hồi quy về định dạng trên nhiều kênh
summary: Quy trình định dạng Markdown cho các kênh gửi đi
title: Định dạng Markdown
x-i18n:
    generated_at: "2026-04-29T22:37:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw định dạng Markdown gửi đi bằng cách chuyển đổi nó thành một biểu diễn trung gian
(IR) dùng chung trước khi kết xuất đầu ra riêng cho từng kênh. IR giữ nguyên văn bản
nguồn trong khi mang theo các khoảng kiểu/liên kết để việc chia đoạn và kết xuất có thể
luôn nhất quán trên các kênh.

## Mục tiêu

- **Tính nhất quán:** một bước phân tích cú pháp, nhiều trình kết xuất.
- **Chia đoạn an toàn:** tách văn bản trước khi kết xuất để định dạng nội tuyến không bao giờ
  bị đứt giữa các đoạn.
- **Phù hợp với kênh:** ánh xạ cùng một IR sang Slack mrkdwn, Telegram HTML và các
  dải kiểu của Signal mà không cần phân tích lại Markdown.

## Quy trình

1. **Phân tích Markdown -> IR**
   - IR là văn bản thuần cộng với các khoảng kiểu (bold/italic/strike/code/spoiler) và các khoảng liên kết.
   - Độ lệch là đơn vị mã UTF-16 để các dải kiểu của Signal khớp với API của nó.
   - Bảng chỉ được phân tích khi một kênh chọn tham gia chuyển đổi bảng.
2. **Chia đoạn IR (ưu tiên định dạng)**
   - Việc chia đoạn diễn ra trên văn bản IR trước khi kết xuất.
   - Định dạng nội tuyến không bị tách giữa các đoạn; các khoảng được cắt theo từng đoạn.
3. **Kết xuất theo từng kênh**
   - **Slack:** token mrkdwn (bold/italic/strike/code), liên kết dạng `<url|label>`.
   - **Telegram:** thẻ HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** văn bản thuần + các dải `text-style`; liên kết trở thành `label (url)` khi nhãn khác URL.

## Ví dụ IR

Markdown đầu vào:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (lược đồ):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Nơi được sử dụng

- Các bộ điều hợp gửi đi của Slack, Telegram và Signal kết xuất từ IR.
- Các kênh khác (WhatsApp, iMessage, Microsoft Teams, Discord) vẫn dùng văn bản thuần hoặc
  quy tắc định dạng riêng của chúng, với chuyển đổi bảng Markdown được áp dụng trước
  khi chia đoạn nếu được bật.

## Xử lý bảng

Bảng Markdown không được hỗ trợ nhất quán trên các ứng dụng chat. Dùng
`markdown.tables` để kiểm soát chuyển đổi theo từng kênh (và từng tài khoản).

- `code`: kết xuất bảng dưới dạng khối mã (mặc định cho hầu hết kênh).
- `bullets`: chuyển từng hàng thành các gạch đầu dòng (mặc định cho Signal + WhatsApp).
- `off`: tắt phân tích và chuyển đổi bảng; văn bản bảng thô được chuyển tiếp nguyên trạng.

Khóa cấu hình:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Quy tắc chia đoạn

- Giới hạn đoạn đến từ bộ điều hợp/cấu hình kênh và được áp dụng cho văn bản IR.
- Khối mã có hàng rào được giữ nguyên như một khối duy nhất với một dòng mới ở cuối để các kênh
  kết xuất chúng chính xác.
- Tiền tố danh sách và tiền tố trích dẫn khối là một phần của văn bản IR, nên việc chia đoạn
  không tách ngay giữa tiền tố.
- Kiểu nội tuyến (bold/italic/strike/inline-code/spoiler) không bao giờ bị tách giữa
  các đoạn; trình kết xuất mở lại kiểu bên trong từng đoạn.

Nếu bạn cần thêm thông tin về hành vi chia đoạn trên các kênh, xem
[Phát trực tuyến + chia đoạn](/vi/concepts/streaming).

## Chính sách liên kết

- **Slack:** `[label](url)` -> `<url|label>`; URL trần vẫn giữ nguyên. Autolink
  bị tắt trong quá trình phân tích để tránh liên kết trùng.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (chế độ phân tích HTML).
- **Signal:** `[label](url)` -> `label (url)` trừ khi nhãn khớp với URL.

## Spoiler

Dấu đánh dấu spoiler (`||spoiler||`) chỉ được phân tích cho Signal, nơi chúng ánh xạ tới
các dải kiểu SPOILER. Các kênh khác coi chúng là văn bản thuần.

## Cách thêm hoặc cập nhật trình định dạng kênh

1. **Phân tích một lần:** dùng helper dùng chung `markdownToIR(...)` với các tùy chọn phù hợp với kênh
   (autolink, kiểu tiêu đề, tiền tố trích dẫn khối).
2. **Kết xuất:** triển khai trình kết xuất với `renderMarkdownWithMarkers(...)` và một
   bản đồ dấu kiểu (hoặc các dải kiểu của Signal).
3. **Chia đoạn:** gọi `chunkMarkdownIR(...)` trước khi kết xuất; kết xuất từng đoạn.
4. **Kết nối bộ điều hợp:** cập nhật bộ điều hợp gửi đi của kênh để dùng bộ chia đoạn
   và trình kết xuất mới.
5. **Kiểm thử:** thêm hoặc cập nhật kiểm thử định dạng và kiểm thử phân phối gửi đi nếu
   kênh dùng chia đoạn.

## Lỗi thường gặp

- Token ngoặc nhọn của Slack (`<@U123>`, `<#C123>`, `<https://...>`) phải được
  giữ nguyên; thoát HTML thô một cách an toàn.
- HTML của Telegram yêu cầu thoát văn bản bên ngoài thẻ để tránh markup bị hỏng.
- Dải kiểu của Signal phụ thuộc vào độ lệch UTF-16; không dùng độ lệch điểm mã.
- Giữ nguyên dòng mới ở cuối cho khối mã có hàng rào để dấu đóng nằm trên
  dòng riêng của chúng.

## Liên quan

- [Phát trực tuyến và chia đoạn](/vi/concepts/streaming)
- [Prompt hệ thống](/vi/concepts/system-prompt)
