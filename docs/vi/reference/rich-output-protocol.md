---
read_when:
    - Thay đổi cách hiển thị đầu ra của trợ lý trong Control UI
    - Gỡ lỗi các chỉ thị trình bày `[embed ...]`, `MEDIA:`, phản hồi hoặc âm thanh
summary: Giao thức mã ngắn đầu ra phong phú cho nội dung nhúng, phương tiện, gợi ý âm thanh và phản hồi
title: Giao thức đầu ra phong phú
x-i18n:
    generated_at: "2026-05-02T22:22:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Đầu ra của trợ lý có thể mang một tập nhỏ các chỉ thị phân phối/kết xuất:

- `MEDIA:` để phân phối tệp đính kèm
- `[[audio_as_voice]]` cho gợi ý trình bày âm thanh
- `[[reply_to_current]]` / `[[reply_to:<id>]]` cho siêu dữ liệu trả lời
- `[embed ...]` để kết xuất phong phú trong Control UI

Tệp đính kèm `MEDIA:` từ xa phải là URL `https:` công khai. `http:` thuần,
loopback, link-local, riêng tư và tên máy chủ nội bộ sẽ bị bỏ qua làm chỉ thị
tệp đính kèm; các bộ tìm nạp phương tiện phía máy chủ vẫn thực thi các biện pháp bảo vệ mạng riêng của chúng.

Tệp đính kèm `MEDIA:` cục bộ có thể dùng đường dẫn tuyệt đối, đường dẫn tương đối với workspace, hoặc
đường dẫn tương đối với thư mục home `~/`. Chúng vẫn đi qua chính sách đọc tệp của tác tử và
kiểm tra loại phương tiện trước khi phân phối.

Cú pháp ảnh Markdown thuần túy mặc định vẫn là văn bản. Các kênh chủ ý
ánh xạ trả lời ảnh Markdown sang tệp đính kèm phương tiện sẽ chọn tham gia ở
bộ điều hợp gửi đi của chúng; Telegram làm điều này để `![alt](url)` vẫn có thể trở thành trả lời phương tiện.

Các chỉ thị này tách biệt nhau. `MEDIA:` và các thẻ trả lời/giọng nói vẫn là siêu dữ liệu phân phối; `[embed ...]` là đường dẫn kết xuất phong phú chỉ dành cho web.
Phương tiện kết quả công cụ đáng tin cậy dùng cùng bộ phân tích cú pháp `MEDIA:` / `[[audio_as_voice]]` trước khi phân phối, nên đầu ra công cụ dạng văn bản vẫn có thể đánh dấu một tệp đính kèm âm thanh là ghi chú thoại.

Khi bật phát trực tuyến theo khối, `MEDIA:` vẫn là siêu dữ liệu phân phối một lần cho một
lượt. Nếu cùng một URL phương tiện được gửi trong một khối được phát trực tuyến và được lặp lại trong payload cuối cùng
của trợ lý, OpenClaw phân phối tệp đính kèm một lần và loại bỏ bản trùng lặp
khỏi payload cuối cùng.

## `[embed ...]`

`[embed ...]` là cú pháp kết xuất phong phú duy nhất hướng tới tác tử cho Control UI.

Ví dụ tự đóng:

```text
[embed ref="cv_123" title="Status" /]
```

Quy tắc:

- `[view ...]` không còn hợp lệ cho đầu ra mới.
- Shortcode nhúng chỉ kết xuất trên bề mặt thông điệp của trợ lý.
- Chỉ các nhúng dựa trên URL mới được kết xuất. Dùng `ref="..."` hoặc `url="..."`.
- Shortcode nhúng HTML nội tuyến dạng khối không được kết xuất.
- UI web loại bỏ shortcode khỏi văn bản hiển thị và kết xuất nhúng nội tuyến.
- `MEDIA:` không phải là bí danh nhúng và không nên được dùng để kết xuất nhúng phong phú.

## Hình dạng kết xuất đã lưu trữ

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

Các khối phong phú đã lưu trữ/kết xuất dùng trực tiếp hình dạng `canvas` này. `present_view` không được nhận diện.

## Liên quan

- [Bộ điều hợp RPC](/vi/reference/rpc)
- [Typebox](/vi/concepts/typebox)
