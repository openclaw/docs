---
read_when:
    - Bạn muốn một agent hiển thị kết quả tương tác trong web chat, ứng dụng gốc hoặc Discord
    - Bạn muốn các nút tiện ích gửi lời nhắc tiếp theo vào cuộc trò chuyện
    - Bạn muốn áp dụng giao diện cho các tiện ích bằng những token thiết kế dùng chung
    - Bạn cần hợp đồng về đầu vào, bảo mật hoặc lưu giữ của `show_widget`
sidebarTitle: Show widget
summary: Hiển thị các tiện ích HTML độc lập trên các giao diện trò chuyện được hỗ trợ
title: Hiển thị tiện ích
x-i18n:
    generated_at: "2026-07-19T06:24:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f269156b16b40d5171d5a0e8edaef87a9cb726a536dce1d9a73a426ce89a71b2
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` là một công cụ cốt lõi hiển thị tiện ích HTML độc lập trên bề mặt hiện tại của người dùng. OpenClaw hiển thị tiện ích này trực tiếp trong bản ghi trò chuyện của Control UI, iOS, Android và macOS; Linux sử dụng Control UI trên trình duyệt. Trong phiên Discord đã bật [Activities](/channels/discord-activities), Plugin Discord đăng một nút **Mở tiện ích** để khởi chạy tiện ích dưới dạng Activity.

## Cách tiện ích hoạt động

Khi tác nhân gọi `show_widget`, lõi OpenClaw bọc `widget_code` trong một tài liệu HTML tối giản, lưu tài liệu đó dưới dạng tài liệu Canvas và trả về một handle xem trước. Control UI hiển thị handle đó dưới dạng iframe được sandbox ngay bên dưới lệnh gọi công cụ, còn các ứng dụng gốc sử dụng web view biệt lập. Cả hai đều khôi phục tiện ích sau khi tải lại lịch sử.

Để nhúng trong trình duyệt, tài liệu bọc chèn bốn cầu nối máy chủ nhỏ xung quanh mã tiện ích:

- Một trình báo cáo kích thước gửi chiều cao nội dung đã kết xuất đến cuộc trò chuyện đang nhúng; cuộc trò chuyện sẽ giới hạn chiều cao và điều chỉnh iframe cho vừa (160 đến 1200 pixel).
- Một cầu nối lời nhắc định nghĩa hàm toàn cục `sendPrompt(text)` mà các tập lệnh tiện ích có thể gọi để gửi tin nhắn tiếp nối vào cuộc trò chuyện. Cầu nối tạo một kênh tin nhắn riêng tư và cung cấp một endpoint cho cuộc trò chuyện trước khi bất kỳ mã tiện ích nào chạy; cuộc trò chuyện chỉ chấp nhận lần cung cấp đầu tiên đó. Xem [Tiện ích tương tác](#interactive-widgets).
- Một cầu nối giao diện lắng nghe các token thiết kế hiện tại của Control UI và áp dụng chúng dưới dạng biến CSS khi tải và sau mỗi lần thay đổi giao diện.
- Một cầu nối ảnh chụp kết xuất tài liệu tiện ích hiện tại thành PNG khi cuộc trò chuyện đang nhúng yêu cầu xuất.

Mọi nội dung khác đều nằm trong khung: tài liệu chạy trong một origin không rõ danh tính với Chính sách bảo mật nội dung nghiêm ngặt, vì vậy các tập lệnh tiện ích không thể truy cập Control UI, Gateway hoặc mạng.

Phần triển khai cốt lõi chỉ khả dụng khi máy khách Gateway khởi tạo khai báo khả năng `inline-widgets`. Control UI và các ứng dụng gốc được hỗ trợ tự động khai báo khả năng này. Phần triển khai Discord chỉ khả dụng trong các phiên Discord đã cấu hình Activities. Các lượt chạy trên kênh khác không nhận được `show_widget`.

Cơ chế truyền khả năng hỗ trợ các backend mô hình nhúng, Codex app-server và dựa trên CLI. Các bên gọi MCP được xác thực bằng grant và các bên gọi trực tiếp công cụ qua HTTP vẫn mặc định từ chối vì chúng không khai báo khả năng máy khách.

## Hệ thống thiết kế

Mỗi tiện ích Canvas đều bao gồm một biểu định kiểu cơ sở không dùng lớp và một tập hợp token nhỏ:

| Token                                                                                 | Mục đích                               |
| ------------------------------------------------------------------------------------- | ------------------------------------- |
| `--surface`                                                                           | Màu bề mặt cấp trang              |
| `--card`                                                                              | Nền của thẻ, nút và mã     |
| `--elevated`                                                                          | Nền nâng cao của điều khiển biểu mẫu      |
| `--text`                                                                              | Văn bản mặc định của nội dung và điều khiển         |
| `--text-strong`                                                                       | Tiêu đề và giá trị nổi bật         |
| `--muted`                                                                             | Văn bản phụ và đường viền nhẹ     |
| `--border`                                                                            | Dấu phân cách tiêu chuẩn và đường viền thẻ  |
| `--border-strong`                                                                     | Đường viền điều khiển đậm                |
| `--accent`                                                                            | Liên kết và vòng tiêu điểm                 |
| `--accent-fill`                                                                       | Màu nền của hành động chính                   |
| `--accent-fg`                                                                         | Văn bản trên hành động chính              |
| `--ok`                                                                                | Trạng thái thành công                         |
| `--warn`                                                                              | Trạng thái cảnh báo                         |
| `--danger`                                                                            | Trạng thái lỗi hoặc phá hủy            |
| `--info`                                                                              | Trạng thái thông tin                   |
| `--radius`                                                                            | Bán kính góc dùng chung cho điều khiển và thẻ |
| `--font-body`                                                                         | Ngăn xếp phông chữ nội dung của máy chủ                  |
| `--font-mono`                                                                         | Ngăn xếp phông chữ đơn cách của máy chủ             |
| `--accent-subtle`, `--ok-subtle`, `--warn-subtle`, `--danger-subtle`, `--info-subtle` | Nền trạng thái trong mờ được dẫn xuất |

Các tiêu đề, đoạn văn, liên kết, nút, ô nhập, danh sách chọn, vùng văn bản, bảng và khối mã thuần được áp dụng kiểu cơ sở. Các lớp trợ giúp cung cấp những mẫu thông dụng:

- `.card` cho bề mặt nội dung có đường viền
- `.badge`, cùng với `.ok`, `.warn`, `.danger` hoặc `.info`, cho các nhãn trạng thái nhỏ gọn
- `.metric` cho giá trị số nổi bật
- `.muted` cho văn bản phụ
- `.row` cho bố cục ngang có ngắt dòng
- `button.primary` cho hành động chính

Control UI gửi một thông báo `openclaw:widget-theme` chứa các giá trị giao diện đang hoạt động khi tiện ích tải và mỗi khi giao diện thay đổi. Do đó, tiện ích theo dõi mọi họ giao diện, bao gồm Claw, Knot, Dash và các giao diện tùy chỉnh mà không cần tải lại. Bên ngoài Control UI, bao gồm các ứng dụng gốc và trường hợp mở trực tiếp, tiện ích sử dụng bảng màu sáng hoặc tối tích hợp sẵn do `prefers-color-scheme` lựa chọn.

Xây dựng tiện ích theo ba quy tắc:

1. Sử dụng các biến thiết kế cho mọi màu sắc và nền. Không mã hóa cứng giá trị màu.
2. Giữ nền trang trong suốt để tiện ích hòa vào bề mặt máy chủ.
3. Chỉ dành `--accent-fill` cho tối đa một hành động chính.

**Xuất:** Trong cuộc trò chuyện trên web, mở trình đơn thẻ tiện ích để sao chép tiện ích đã kết xuất vào bảng nhớ tạm hoặc tải xuống dưới dạng PNG. Các tài liệu tiện ích cũ không có cầu nối ảnh chụp sẽ chuyển sang tải xuống tệp HTML.

## Sử dụng công cụ

Cả hai phần triển khai đều sử dụng các trường bắt buộc giống nhau:

<ParamField path="title" type="string" required>
  Tiêu đề ngắn được hiển thị cùng bản xem trước trực tiếp và trong tiêu đề tài liệu được lưu trữ.
</ParamField>

<ParamField path="widget_code" type="string" required>
  HTML hoặc SVG độc lập. Đối với máy khách tiện ích trực tiếp, dữ liệu đầu vào bắt đầu bằng `<svg` sau khi loại bỏ khoảng trắng sẽ được kết xuất ở chế độ SVG; độ dài tối đa là 262,144 ký tự. Discord chấp nhận tài liệu HTML hoàn chỉnh hoặc đoạn nội dung body có kích thước tối đa 48 KiB.
</ParamField>

Discord cũng chấp nhận văn bản `button_label` tùy chọn cho nút khởi chạy Activity. Schema Canvas chủ ý bỏ qua trường chỉ dành cho Discord này.

Kết quả cốt lõi bao gồm một handle xem trước Canvas, vì vậy Control UI và các ứng dụng gốc được hỗ trợ kết xuất tiện ích trực tiếp từ lệnh gọi công cụ và khôi phục tiện ích sau khi tải lại lịch sử. Discord trả về tiện ích đã lưu trữ và các định danh của tin nhắn đã đăng.

`discord_widget` vẫn được đăng ký làm bí danh không còn được khuyến nghị trong một bản phát hành. Các lệnh gọi mới của tác nhân nên sử dụng `show_widget`.

## Tiện ích tương tác

Trong Control UI, các tập lệnh tiện ích có thể điều khiển cuộc hội thoại. Tài liệu bọc định nghĩa hàm toàn cục `sendPrompt(text)`; việc gọi hàm này sẽ gửi `text` vào cuộc trò chuyện như thể người dùng đã nhập và gửi tin nhắn. Kết nối hàm này với các nút hoặc điều khiển khác để xây dựng các luồng tương tác như bộ chọn, câu đố hoặc bảng điều khiển xem chi tiết. Các ứng dụng gốc kết xuất mã tiện ích tương tác nhưng không cung cấp cầu nối lời nhắc trò chuyện này.

```html
<button onclick="sendPrompt('Hiển thị chi tiết các kiểm thử thất bại')">Kiểm thử thất bại</button>
```

Mọi lời nhắc đều được xác thực ở cả hai phía của ranh giới khung:

- `sendPrompt` yêu cầu [kích hoạt người dùng tạm thời](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) bên trong tiện ích: chức năng này chỉ hoạt động trong vài giây sau khi người dùng nhấp hoặc nhấn một phím trong tiện ích, vì vậy hãy kết nối nó với các nút và mục tiêu nhấp khác — việc tự động gọi khi tải sẽ không có tác dụng. Cầu nối giữ endpoint gửi ở chế độ riêng tư và mặc định từ chối trong các trình duyệt không cung cấp trạng thái kích hoạt người dùng, vì vậy mã tiện ích không thể vượt qua bước kiểm tra.
- Quyền gửi lời nhắc chỉ thuộc về tài liệu tiện ích ban đầu. Cầu nối đáng tin cậy cung cấp endpoint kênh của mình cho cuộc trò chuyện trước khi mã tiện ích có thể chạy hoặc điều hướng khung, cuộc trò chuyện chỉ chấp nhận lần cung cấp đầu tiên đó và kênh sẽ bị hủy cùng tài liệu khi điều hướng. Các URL nhúng được cho phép từ bên ngoài không bao giờ được chấp nhận.
- Khung tiện ích phải hiển thị trong bản ghi trò chuyện và giữ tiêu điểm — đây là một tín hiệu bổ sung do máy chủ quan sát để xác nhận người dùng thực sự đang tương tác với tiện ích này.
- Văn bản phải không trống sau khi loại bỏ khoảng trắng và có tối đa 4,000 ký tự.
- Các lời nhắc bắt đầu bằng `/` sẽ bị từ chối, vì vậy mã tiện ích không thể kích hoạt các lệnh trò chuyện như `/approve` hoặc `/stop`.
- Mỗi tài liệu tiện ích có thể gửi tối đa 10 lời nhắc trong mỗi khoảng thời gian trượt một phút; các lời nhắc vượt quá giới hạn sẽ bị loại bỏ mà không có thông báo.

Các lời nhắc được chấp nhận xuất hiện trong bản ghi dưới dạng tin nhắn người dùng thông thường và bắt đầu một lượt tác nhân bình thường trong phiên sở hữu tiện ích. Không có kênh phản hồi vào tiện ích: lời nhắc bị loại bỏ sẽ thất bại mà không có thông báo và tiện ích không thể đọc câu trả lời của tác nhân.

## Bảo mật và lưu trữ

Tài liệu tiện ích sử dụng Chính sách bảo mật nội dung hạn chế. Kiểu và tập lệnh nội tuyến được phép, trong khi các yêu cầu tìm nạp và tải tài nguyên bên ngoài bị chặn. Giữ toàn bộ mã đánh dấu, kiểu, tập lệnh và dữ liệu hình ảnh bên trong `widget_code`.

Iframe của Control UI luôn bỏ qua `allow-same-origin`, ngay cả khi chế độ nhúng toàn cục là `trusted`, vì vậy các tập lệnh tiện ích không thể đọc origin của ứng dụng mẹ. Các máy khách gốc sử dụng web view biệt lập, không duy trì trạng thái và chặn việc điều hướng ra khỏi tiện ích được lưu trữ. Máy chủ tài liệu cốt lõi cũng phân phối tiện ích với header phản hồi `Content-Security-Policy: sandbox allow-scripts`, vì vậy việc kết xuất trực tiếp vẫn chạy tiện ích trong một origin không rõ danh tính thay vì origin của ứng dụng. Chỉ kết xuất mã tiện ích mà bạn sẵn sàng thực thi trong khung biệt lập đó.

Iframe cũng tuân theo [`gateway.controlUi.embedSandbox`](/vi/web/control-ui#hosted-embeds). Cấp `scripts` mặc định hỗ trợ các tiện ích tương tác trong khi vẫn duy trì sự biệt lập origin.

Canvas lưu giữ tối đa 32 tiện ích cho mỗi phiên (hoặc cho mỗi tác nhân khi không có phiên). Việc tạo thêm tiện ích sẽ xóa tài liệu cũ nhất trong phạm vi đó.

## Liên quan

- [Nội dung nhúng được lưu trữ trong Control UI](/vi/web/control-ui#hosted-embeds)
- [Discord Activities](/channels/discord-activities)
- [Các điều khiển Node Canvas](/vi/plugins/reference/canvas)
- [Khả năng máy khách của giao thức Gateway](/vi/gateway/protocol#client-capabilities)
