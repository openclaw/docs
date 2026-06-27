---
read_when:
    - Thay đổi cách hiển thị đầu ra của trợ lý trong Control UI
    - Gỡ lỗi các chỉ thị trình bày `[embed ...]`, phương tiện có cấu trúc, trả lời hoặc âm thanh
summary: Giao thức đầu ra phong phú cho phương tiện có cấu trúc, nội dung nhúng, gợi ý âm thanh và phản hồi
title: Giao thức đầu ra phong phú
x-i18n:
    generated_at: "2026-06-27T18:09:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Đầu ra của trợ lý có thể mang một nhóm nhỏ các chỉ thị phân phối/kết xuất:

- các trường `mediaUrl` / `mediaUrls` có cấu trúc để phân phối tệp đính kèm
- `[[audio_as_voice]]` cho gợi ý trình bày âm thanh
- `[[reply_to_current]]` / `[[reply_to:<id>]]` cho siêu dữ liệu trả lời
- `[embed ...]` cho kết xuất phong phú trong Control UI

Tệp đính kèm phương tiện từ xa phải là URL `https:` công khai. `http:` thuần,
loopback, link-local, riêng tư và tên máy chủ nội bộ sẽ bị bỏ qua dưới dạng chỉ thị
tệp đính kèm; các bộ tải phương tiện phía máy chủ vẫn thực thi các rào chắn mạng
riêng của chúng.

Tệp đính kèm phương tiện cục bộ có thể dùng đường dẫn tuyệt đối, đường dẫn tương đối
với workspace, hoặc đường dẫn tương đối với thư mục home `~/`. Chúng vẫn đi qua
chính sách đọc tệp của tác nhân và kiểm tra loại phương tiện trước khi phân phối.

<Warning>
Không phát ra lệnh văn bản cho tệp đính kèm từ công cụ, Plugin, khối streaming,
đầu ra trình duyệt hoặc hành động tin nhắn. Hãy dùng các trường phương tiện có cấu trúc thay thế.

Payload công cụ tin nhắn hợp lệ:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Văn bản trả lời cuối kiểu cũ của trợ lý vẫn có thể được chuẩn hóa để tương thích, nhưng
đó không phải là giao thức Plugin/công cụ tổng quát.
</Warning>

Cú pháp ảnh Markdown thuần vẫn là văn bản theo mặc định. Các kênh chủ động
ánh xạ trả lời ảnh Markdown sang tệp đính kèm phương tiện sẽ opt in tại
adapter gửi đi của chúng; Telegram làm điều này để `![alt](url)` vẫn có thể trở thành trả lời phương tiện.

Các chỉ thị này tách biệt với nhau. Trường phương tiện có cấu trúc và thẻ trả lời/giọng nói là
siêu dữ liệu phân phối; `[embed ...]` là đường dẫn kết xuất phong phú chỉ dành cho web.

Khi bật streaming theo khối, phương tiện phải được mang trên các trường payload
có cấu trúc. Nếu cùng một URL phương tiện được gửi trong một khối streamed và lặp lại trong
payload cuối của trợ lý, OpenClaw phân phối tệp đính kèm một lần và loại bỏ bản
trùng lặp khỏi payload cuối.

## `[embed ...]`

`[embed ...]` là cú pháp kết xuất phong phú duy nhất dành cho tác nhân trong Control UI.

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
- Phương tiện có cấu trúc không phải là bí danh embed và không nên dùng để kết xuất embed phong phú.

## Hình dạng kết xuất được lưu trữ

Khối nội dung trợ lý đã chuẩn hóa/được lưu trữ là một mục `canvas` có cấu trúc:

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

Các khối phong phú được lưu trữ/kết xuất dùng trực tiếp hình dạng `canvas` này. `present_view` không được nhận diện.

## Liên quan

- [RPC adapters](/vi/reference/rpc)
- [Typebox](/vi/concepts/typebox)
