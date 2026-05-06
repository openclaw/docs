---
read_when:
    - Bạn đang thay đổi định dạng Markdown hoặc cách phân đoạn cho các kênh gửi đi
    - Bạn đang thêm một trình định dạng kênh hoặc ánh xạ kiểu mới
    - Bạn đang gỡ lỗi các lỗi hồi quy về định dạng trên nhiều kênh
summary: Quy trình xử lý định dạng Markdown cho các kênh gửi đi
title: Định dạng Markdown
x-i18n:
    generated_at: "2026-05-06T09:07:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw định dạng Markdown gửi đi bằng cách chuyển đổi nó thành một biểu diễn
trung gian dùng chung (IR) trước khi kết xuất đầu ra theo từng kênh. IR giữ nguyên
văn bản nguồn trong khi mang theo các đoạn kiểu/liên kết để việc chia đoạn và kết xuất
có thể nhất quán giữa các kênh.

## Mục tiêu

- **Nhất quán:** một bước phân tích cú pháp, nhiều trình kết xuất.
- **Chia đoạn an toàn:** tách văn bản trước khi kết xuất để định dạng nội tuyến không bao giờ
  bị đứt giữa các đoạn.
- **Phù hợp với kênh:** ánh xạ cùng một IR sang Slack mrkdwn, Telegram HTML và các dải
  kiểu của Signal mà không cần phân tích lại Markdown.

## Quy trình

1. **Phân tích Markdown -> IR**
   - IR là văn bản thuần cùng với các đoạn kiểu (đậm/nghiêng/gạch ngang/mã/spoiler) và đoạn liên kết.
   - Offset là các đơn vị mã UTF-16 để các dải kiểu của Signal khớp với API của nó.
   - Bảng chỉ được phân tích khi một kênh chọn tham gia chuyển đổi bảng.
2. **Chia đoạn IR (ưu tiên định dạng)**
   - Việc chia đoạn diễn ra trên văn bản IR trước khi kết xuất.
   - Định dạng nội tuyến không bị tách giữa các đoạn; các span được cắt theo từng đoạn.
3. **Kết xuất theo từng kênh**
   - **Slack:** token mrkdwn (đậm/nghiêng/gạch ngang/mã), liên kết dưới dạng `<url|label>`.
   - **Telegram:** thẻ HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** văn bản thuần + dải `text-style`; liên kết trở thành `label (url)` khi nhãn khác nhau.

## Ví dụ IR

Markdown đầu vào:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (sơ đồ):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Nơi sử dụng

- Các adapter gửi đi của Slack, Telegram và Signal kết xuất từ IR.
- Các kênh khác (WhatsApp, iMessage, Microsoft Teams, Discord) vẫn dùng văn bản thuần hoặc
  quy tắc định dạng riêng của chúng, với chuyển đổi bảng Markdown được áp dụng trước khi
  chia đoạn khi được bật.

## Xử lý bảng

Bảng Markdown không được hỗ trợ nhất quán giữa các ứng dụng trò chuyện. Dùng
`markdown.tables` để kiểm soát chuyển đổi theo từng kênh (và từng tài khoản).

- `code`: kết xuất bảng dưới dạng khối mã (mặc định cho hầu hết kênh).
- `bullets`: chuyển mỗi hàng thành các dấu đầu dòng (mặc định cho Signal + WhatsApp).
- `off`: tắt phân tích và chuyển đổi bảng; văn bản bảng thô được chuyển qua.

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

- Giới hạn đoạn đến từ adapter/cấu hình kênh và được áp dụng cho văn bản IR.
- Khối mã được giữ nguyên như một khối đơn với một dòng mới ở cuối để các kênh
  kết xuất chúng chính xác.
- Tiền tố danh sách và tiền tố blockquote là một phần của văn bản IR, nên việc chia đoạn
  không tách ở giữa tiền tố.
- Kiểu nội tuyến (đậm/nghiêng/gạch ngang/mã nội tuyến/spoiler) không bao giờ bị tách giữa
  các đoạn; trình kết xuất mở lại kiểu bên trong mỗi đoạn.

Nếu bạn cần thêm thông tin về hành vi chia đoạn giữa các kênh, xem
[Streaming + chia đoạn](/vi/concepts/streaming).

## Chính sách liên kết

- **Slack:** `[label](url)` -> `<url|label>`; URL trần vẫn giữ nguyên. Autolink
  bị tắt trong khi phân tích để tránh liên kết kép.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (chế độ phân tích HTML).
- **Signal:** `[label](url)` -> `label (url)` trừ khi nhãn khớp với URL.

## Spoiler

Dấu spoiler (`||spoiler||`) chỉ được phân tích cho Signal, nơi chúng ánh xạ thành
các dải kiểu SPOILER. Các kênh khác xem chúng là văn bản thuần.

## Cách thêm hoặc cập nhật trình định dạng kênh

1. **Phân tích một lần:** dùng helper dùng chung `markdownToIR(...)` với các tùy chọn
   phù hợp với kênh (autolink, kiểu heading, tiền tố blockquote).
2. **Kết xuất:** triển khai trình kết xuất với `renderMarkdownWithMarkers(...)` và một
   bản đồ marker kiểu (hoặc các dải kiểu của Signal).
3. **Chia đoạn:** gọi `chunkMarkdownIR(...)` trước khi kết xuất; kết xuất từng đoạn.
4. **Kết nối adapter:** cập nhật adapter gửi đi của kênh để dùng bộ chia đoạn
   và trình kết xuất mới.
5. **Kiểm thử:** thêm hoặc cập nhật kiểm thử định dạng và kiểm thử gửi đi nếu
   kênh dùng chia đoạn.

## Lỗi thường gặp

- Token dấu ngoặc nhọn của Slack (`<@U123>`, `<#C123>`, `<https://...>`) phải được
  giữ nguyên; thoát HTML thô một cách an toàn.
- Telegram HTML yêu cầu thoát văn bản ngoài thẻ để tránh markup bị hỏng.
- Các dải kiểu của Signal phụ thuộc vào offset UTF-16; không dùng offset điểm mã.
- Giữ các dòng mới ở cuối cho khối mã có hàng rào để marker đóng nằm trên
  dòng riêng của chúng.

## Liên quan

<CardGroup cols={2}>
  <Card title="Streaming và chia đoạn" href="/vi/concepts/streaming" icon="bars-staggered">
    Hành vi streaming gửi đi, ranh giới đoạn và phân phối theo từng kênh.
  </Card>
  <Card title="Prompt hệ thống" href="/vi/concepts/system-prompt" icon="message-lines">
    Những gì mô hình thấy trước cuộc trò chuyện, bao gồm các tệp không gian làm việc được chèn vào.
  </Card>
</CardGroup>
