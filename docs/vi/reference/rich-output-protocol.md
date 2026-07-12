---
read_when:
    - Thay đổi cách hiển thị đầu ra của trợ lý trong giao diện Điều khiển
    - Gỡ lỗi `[embed ...]`, các chỉ thị trình bày có cấu trúc cho nội dung đa phương tiện, phản hồi hoặc âm thanh
summary: Giao thức đầu ra phong phú cho nội dung đa phương tiện có cấu trúc, nội dung nhúng, gợi ý âm thanh và phản hồi
title: Giao thức đầu ra phong phú
x-i18n:
    generated_at: "2026-07-12T08:21:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

Đầu ra của trợ lý truyền các chỉ thị phân phối/kết xuất qua một số kênh chuyên biệt:

- Các trường `mediaUrl` / `mediaUrls` có cấu trúc để phân phối tệp đính kèm.
- `[[audio_as_voice]]` để cung cấp gợi ý trình bày âm thanh.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` cho siêu dữ liệu trả lời.
- `[embed ...]` để kết xuất nội dung phong phú trong Giao diện điều khiển.

Các trường phương tiện có cấu trúc và thẻ `[[...]]` là siêu dữ liệu phân phối. `[embed ...]` là đường dẫn kết xuất phong phú riêng chỉ dành cho web; đây không phải là bí danh của phương tiện.

## Tệp đính kèm phương tiện

Tệp đính kèm từ xa phải là URL `https:` công khai. Các URL `http:`, loopback, liên kết cục bộ, riêng tư và tên máy chủ nội bộ sẽ bị từ chối khi dùng làm chỉ thị đính kèm; các trình tải phương tiện phía máy chủ còn áp dụng thêm các biện pháp bảo vệ mạng riêng.

Tệp đính kèm cục bộ chấp nhận đường dẫn tuyệt đối, đường dẫn tương đối với không gian làm việc hoặc đường dẫn `~/` tương đối với thư mục chính. Trước khi phân phối, chúng vẫn phải tuân theo chính sách đọc tệp của tác tử và các bước kiểm tra loại phương tiện.

<Warning>
Không phát các lệnh văn bản dành cho tệp đính kèm từ công cụ, plugin, khối truyền trực tuyến, đầu ra trình duyệt hoặc thao tác tin nhắn. Thay vào đó, hãy sử dụng các trường phương tiện có cấu trúc:

```json
{ "message": "Đây là hình ảnh của bạn.", "mediaUrl": "/workspace/image.png" }
```

Văn bản trả lời cuối theo kiểu cũ vẫn có thể được chuẩn hóa để duy trì khả năng tương thích, nhưng đây không phải là giao thức chung dành cho plugin/công cụ.
</Warning>

Theo mặc định, cú pháp hình ảnh Markdown thuần túy (`![alt](url)`) vẫn được giữ dưới dạng văn bản. Các kênh muốn coi hình ảnh Markdown là phản hồi phương tiện phải chủ động bật tính năng này trong bộ điều hợp gửi đi; Telegram thực hiện điều này để `![alt](url)` trở thành tệp đính kèm phương tiện.

Khi bật truyền trực tuyến theo khối, phương tiện phải được truyền qua các trường tải trọng có cấu trúc. Nếu cùng một URL phương tiện xuất hiện trong một khối được truyền trực tuyến rồi xuất hiện lại trong tải trọng cuối của trợ lý, OpenClaw chỉ phân phối một lần và loại bỏ bản trùng lặp khỏi tải trọng cuối.

## `[embed ...]`

`[embed ...]` là cú pháp kết xuất phong phú duy nhất dành cho tác tử trong Giao diện điều khiển. Ví dụ tự đóng:

```text
[embed ref="cv_123" title="Status" /]
```

Quy tắc:

- `[view ...]` không còn hợp lệ đối với đầu ra mới.
- Mã ngắn nhúng chỉ được kết xuất trên bề mặt tin nhắn của trợ lý.
- Chỉ các nội dung nhúng dựa trên URL mới được kết xuất; hãy sử dụng `ref="..."` hoặc `url="..."`.
- Mã ngắn nhúng HTML nội tuyến dạng khối không được kết xuất.
- Giao diện web loại bỏ mã ngắn khỏi văn bản hiển thị và kết xuất nội dung nhúng ngay tại vị trí đó.

## Cấu trúc kết xuất được lưu trữ

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

`present_view` không được nhận dạng; các khối nội dung phong phú được lưu trữ/kết xuất luôn sử dụng cấu trúc `canvas` này.

## Liên quan

- [Bộ điều hợp RPC](/vi/reference/rpc)
- [Typebox](/vi/concepts/typebox)
