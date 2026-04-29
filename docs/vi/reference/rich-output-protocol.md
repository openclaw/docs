---
read_when:
    - Thay đổi cách hiển thị đầu ra của trợ lý trong giao diện điều khiển
    - Gỡ lỗi `[embed ...]`, `MEDIA:`, phản hồi hoặc chỉ thị trình bày âm thanh
summary: Giao thức mã ngắn đầu ra phong phú cho nội dung nhúng, phương tiện, gợi ý âm thanh và phản hồi
title: Giao thức đầu ra phong phú
x-i18n:
    generated_at: "2026-04-29T23:11:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Đầu ra của trợ lý có thể mang một tập nhỏ các chỉ thị phân phối/kết xuất:

- `MEDIA:` để phân phối tệp đính kèm
- `[[audio_as_voice]]` cho gợi ý trình bày âm thanh
- `[[reply_to_current]]` / `[[reply_to:<id>]]` cho siêu dữ liệu trả lời
- `[embed ...]` để kết xuất phong phú trong Control UI

Tệp đính kèm `MEDIA:` từ xa phải là URL `https:` công khai. `http:` thuần,
loopback, link-local, tên máy chủ riêng tư và nội bộ sẽ bị bỏ qua dưới dạng
chỉ thị tệp đính kèm; các bộ tải phương tiện phía máy chủ vẫn thực thi các cơ
chế bảo vệ mạng riêng của chúng.

Cú pháp ảnh Markdown thuần vẫn là văn bản theo mặc định. Các kênh chủ ý ánh xạ
trả lời ảnh Markdown thành tệp đính kèm phương tiện sẽ bật tùy chọn này trong
bộ điều hợp gửi đi của chúng; Telegram làm việc này để `![alt](url)` vẫn có thể
trở thành một trả lời phương tiện.

Các chỉ thị này tách biệt nhau. `MEDIA:` và các thẻ trả lời/giọng nói vẫn là
siêu dữ liệu phân phối; `[embed ...]` là đường dẫn kết xuất phong phú chỉ dành
cho web.
Phương tiện kết quả công cụ đáng tin cậy dùng cùng bộ phân tích cú pháp
`MEDIA:` / `[[audio_as_voice]]` trước khi phân phối, vì vậy đầu ra công cụ dạng
văn bản vẫn có thể đánh dấu một tệp đính kèm âm thanh là ghi chú thoại.

Khi bật truyền phát theo khối, `MEDIA:` vẫn là siêu dữ liệu phân phối một lần
cho một lượt. Nếu cùng một URL phương tiện được gửi trong một khối truyền phát
và lặp lại trong payload cuối cùng của trợ lý, OpenClaw sẽ phân phối tệp đính
kèm một lần và loại bỏ bản trùng lặp khỏi payload cuối cùng.

## `[embed ...]`

`[embed ...]` là cú pháp kết xuất phong phú duy nhất hướng tới tác nhân cho Control UI.

Ví dụ tự đóng:

```text
[embed ref="cv_123" title="Status" /]
```

Quy tắc:

- `[view ...]` không còn hợp lệ cho đầu ra mới.
- Shortcode embed chỉ kết xuất trong bề mặt tin nhắn của trợ lý.
- Chỉ các embed dựa trên URL mới được kết xuất. Dùng `ref="..."` hoặc `url="..."`.
- Shortcode embed HTML nội tuyến dạng khối không được kết xuất.
- Giao diện web loại bỏ shortcode khỏi văn bản hiển thị và kết xuất embed nội tuyến.
- `MEDIA:` không phải là bí danh embed và không nên được dùng để kết xuất embed phong phú.

## Dạng kết xuất được lưu trữ

Khối nội dung trợ lý đã chuẩn hóa/lưu trữ là một mục `canvas` có cấu trúc:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Các khối phong phú đã lưu trữ/kết xuất dùng trực tiếp dạng `canvas` này. `present_view` không được nhận diện.

## Liên quan

- [bộ điều hợp RPC](/vi/reference/rpc)
- [Typebox](/vi/concepts/typebox)
