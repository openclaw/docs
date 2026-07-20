---
read_when:
    - Bạn muốn một agent hiển thị kết quả tương tác trong web chat, ứng dụng gốc hoặc Discord
    - Bạn muốn các nút tiện ích gửi lời nhắc tiếp theo vào cuộc trò chuyện
    - Bạn muốn áp dụng giao diện cho các tiện ích bằng token thiết kế dùng chung
    - Bạn cần hợp đồng đầu vào, bảo mật hoặc lưu giữ của `show_widget`
sidebarTitle: Show widget
summary: Hiển thị các tiện ích HTML độc lập trên những giao diện trò chuyện được hỗ trợ
title: Hiển thị tiện ích
x-i18n:
    generated_at: "2026-07-20T04:34:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bcb149984840fdbb84d91da98c488b0a8ca2300f8a1984a8b0b144b0a8d6cd28
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` là một công cụ cốt lõi hiển thị tiện ích HTML độc lập trên bề mặt hiện tại của người dùng. OpenClaw kết xuất tiện ích này nội tuyến trong bản ghi trò chuyện của Control UI, iOS, Android và macOS; Linux sử dụng Control UI trên trình duyệt. Trong một phiên Discord đã bật [Activities](/vi/channels/discord-activities), plugin Discord đăng một nút **Open widget** để khởi chạy tiện ích dưới dạng Activity.

## Cách tiện ích hoạt động

Khi tác tử gọi `show_widget`, lõi OpenClaw bọc `widget_code` trong một tài liệu HTML tối giản, lưu tài liệu đó dưới dạng tài liệu Canvas và trả về một handle xem trước. Control UI kết xuất handle đó dưới dạng iframe có sandbox ngay bên dưới lệnh gọi công cụ, còn các ứng dụng gốc sử dụng web view cô lập. Cả hai đều khôi phục tiện ích sau khi tải lại lịch sử.

Trong các phiên Control UI, tiện ích Canvas cũng có thể được ghim vào bảng điều khiển của phiên. Đặt `pin: true` trong lệnh gọi công cụ hoặc dùng **Ghim vào bảng điều khiển** trên một tiện ích hiện có trong bản ghi. Việc ghim tái sử dụng chính xác tài liệu được lưu trữ; nó không tìm nạp HTML của tiện ích thông qua trình duyệt.

Để nhúng trong trình duyệt, tài liệu bao bọc chèn bốn cầu nối nhỏ với máy chủ xung quanh mã tiện ích:

- Một trình báo cáo kích thước gửi chiều cao của nội dung đã kết xuất đến cuộc trò chuyện nhúng, nơi giới hạn chiều cao và điều chỉnh iframe cho vừa (160 đến 1200 pixel).
- Một cầu nối lời nhắc định nghĩa hàm `sendPrompt(text)` toàn cục mà tập lệnh tiện ích có thể gọi để gửi thông báo tiếp theo vào cuộc trò chuyện. Cầu nối tạo một kênh thông báo riêng tư và cung cấp một điểm cuối cho cuộc trò chuyện trước khi bất kỳ mã tiện ích nào chạy; cuộc trò chuyện chỉ tiếp nhận đề nghị đầu tiên đó. Xem [Tiện ích tương tác](#interactive-widgets).
- Một cầu nối giao diện lắng nghe các token thiết kế hiện tại của Control UI và áp dụng chúng dưới dạng biến CSS khi tải và mỗi khi giao diện thay đổi.
- Một cầu nối ảnh chụp nhanh kết xuất tài liệu tiện ích hiện tại thành PNG khi cuộc trò chuyện nhúng yêu cầu xuất.

Mọi thứ khác vẫn nằm trong khung: tài liệu chạy trong một origin không rõ nguồn với Content Security Policy nghiêm ngặt, vì vậy tập lệnh tiện ích không thể truy cập Control UI, Gateway hoặc mạng.

Phần triển khai cốt lõi chỉ khả dụng khi máy khách Gateway khởi tạo khai báo khả năng `inline-widgets`. Control UI và các ứng dụng gốc được hỗ trợ tự động khai báo khả năng này. Phần triển khai Discord chỉ khả dụng trong các phiên Discord đã cấu hình Activities. Các lượt chạy trên kênh khác không nhận được `show_widget`.

Việc truyền khả năng áp dụng cho các backend mô hình nhúng, Codex app-server và dựa trên CLI. Các bên gọi MCP được xác thực bằng quyền cấp và các bên gọi trực tiếp công cụ qua HTTP vẫn từ chối theo mặc định vì chúng không khai báo khả năng máy khách.

## Hệ thống thiết kế

Mỗi tiện ích Canvas bao gồm một biểu định kiểu cơ sở không dùng lớp và một tập token nhỏ:

| Token                                                                                 | Mục đích                               |
| ------------------------------------------------------------------------------------- | ------------------------------------- |
| `--surface`                                                                           | Màu bề mặt cấp trang              |
| `--card`                                                                              | Nền thẻ, nút và mã     |
| `--elevated`                                                                          | Nền điều khiển biểu mẫu nổi bật      |
| `--text`                                                                              | Văn bản mặc định của phần thân và điều khiển         |
| `--text-strong`                                                                       | Tiêu đề và giá trị nổi bật         |
| `--muted`                                                                             | Văn bản phụ và đường viền tinh tế     |
| `--border`                                                                            | Dấu phân cách tiêu chuẩn và đường viền thẻ  |
| `--border-strong`                                                                     | Đường viền điều khiển đậm                |
| `--accent`                                                                            | Liên kết và vòng tiêu điểm                 |
| `--accent-fill`                                                                       | Màu nền hành động chính                   |
| `--accent-fg`                                                                         | Văn bản trên hành động chính              |
| `--ok`                                                                                | Trạng thái thành công                         |
| `--warn`                                                                              | Trạng thái cảnh báo                         |
| `--danger`                                                                            | Trạng thái lỗi hoặc phá hủy            |
| `--info`                                                                              | Trạng thái thông tin                   |
| `--radius`                                                                            | Bán kính góc dùng chung cho điều khiển và thẻ |
| `--font-body`                                                                         | Ngăn xếp phông chữ phần thân của máy chủ                  |
| `--font-mono`                                                                         | Ngăn xếp phông chữ đơn cách của máy chủ             |
| `--accent-subtle`, `--ok-subtle`, `--warn-subtle`, `--danger-subtle`, `--info-subtle` | Nền trạng thái trong mờ được suy ra |

Các tiêu đề, đoạn văn, liên kết, nút, trường nhập, hộp chọn, vùng văn bản, bảng và khối mã thuần nhận kiểu cơ sở. Các lớp trợ giúp cung cấp những mẫu thông dụng:

- `.card` cho bề mặt nội dung có đường viền
- `.badge`, cùng với `.ok`, `.warn`, `.danger` hoặc `.info`, cho các nhãn trạng thái nhỏ gọn
- `.metric` cho giá trị số nổi bật
- `.muted` cho văn bản phụ
- `.row` cho bố cục ngang có ngắt dòng
- `button.primary` cho hành động chính

Control UI gửi thông báo `openclaw:widget-theme` chứa các giá trị giao diện đang hoạt động khi tiện ích tải và mỗi khi giao diện thay đổi. Do đó, tiện ích theo dõi mọi họ giao diện, bao gồm Claw, Knot, Dash và giao diện tùy chỉnh mà không cần tải lại. Bên ngoài Control UI, bao gồm các ứng dụng gốc và khi mở trực tiếp, tiện ích sử dụng bảng màu sáng hoặc tối tích hợp sẵn do `prefers-color-scheme` chọn.

Tạo tiện ích theo ba quy tắc:

1. Dùng các biến thiết kế cho mọi màu sắc và nền. Không mã hóa cứng giá trị màu.
2. Giữ nền trang trong suốt để tiện ích hòa vào bề mặt máy chủ.
3. Chỉ dành `--accent-fill` cho tối đa một hành động chính.

**Xuất:** Trong trò chuyện web, mở trình đơn thẻ tiện ích để sao chép tiện ích đã kết xuất vào bảng nhớ tạm hoặc tải xuống dưới dạng PNG. Các tài liệu tiện ích cũ không có cầu nối ảnh chụp nhanh sẽ chuyển sang tải xuống tệp HTML.

## Sử dụng công cụ

Cả hai phần triển khai đều sử dụng các trường bắt buộc giống nhau:

<ParamField path="title" type="string" required>
  Tiêu đề ngắn được hiển thị cùng bản xem trước nội tuyến và trong tiêu đề tài liệu được lưu trữ.
</ParamField>

<ParamField path="widget_code" type="string" required>
  HTML hoặc SVG độc lập. Đối với máy khách tiện ích nội tuyến, đầu vào bắt đầu bằng `<svg` sau khi loại bỏ khoảng trắng được kết xuất ở chế độ SVG; độ dài tối đa là 262,144 ký tự. Discord chấp nhận tài liệu HTML hoàn chỉnh hoặc đoạn phần thân tối đa 48 KiB.
</ParamField>

Discord cũng chấp nhận văn bản `button_label` tùy chọn cho nút khởi chạy Activity. Lược đồ Canvas chủ ý bỏ qua trường chỉ dành cho Discord này.

Công cụ Canvas cốt lõi chấp nhận các trường bố trí bảng điều khiển tùy chọn sau:

- `pin`: cũng đặt tiện ích trên bảng điều khiển của phiên.
- `name`: tên tiện ích ổn định; mặc định là slug của `title`.
- `tab`: slug của thẻ đích.
- `size`: một trong `sm`, `md`, `lg`, `xl` hoặc `full`.
- `after`: tên tiện ích cùng cấp mà tiện ích này sẽ được đặt sau đó.

Kết quả cốt lõi bao gồm một handle xem trước Canvas, vì vậy Control UI và các ứng dụng gốc được hỗ trợ kết xuất tiện ích trực tiếp từ lệnh gọi công cụ và khôi phục nó sau khi tải lại lịch sử. Kết quả đã ghim cũng giữ lại tên tiện ích trên bảng để Control UI không đề nghị ghim trùng lặp sau khi tải lại bản ghi. Discord trả về các mã định danh của tiện ích đã lưu và thông báo đã đăng.

`discord_widget` vẫn được đăng ký dưới dạng bí danh không còn được khuyến nghị trong một bản phát hành. Các lệnh gọi tác tử mới nên sử dụng `show_widget`.

## Tiện ích tương tác

Trong Control UI, tập lệnh tiện ích có thể điều khiển cuộc hội thoại. Tài liệu bao bọc định nghĩa hàm `sendPrompt(text)` toàn cục; việc gọi hàm này sẽ gửi `text` vào cuộc trò chuyện như thể người dùng đã nhập và gửi thông báo. Kết nối hàm này với các nút hoặc điều khiển khác để xây dựng luồng tương tác như bộ chọn, câu đố hoặc bảng điều khiển xem chi tiết. Các ứng dụng gốc kết xuất mã tiện ích tương tác nhưng không cung cấp cầu nối lời nhắc trò chuyện này.

```html
<button onclick="sendPrompt('Hiển thị chi tiết các kiểm thử thất bại')">Các kiểm thử thất bại</button>
```

Mọi lời nhắc đều được xác thực ở cả hai phía của ranh giới khung:

- `sendPrompt` yêu cầu [kích hoạt tạm thời của người dùng](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) bên trong tiện ích: nó chỉ hoạt động trong vài giây sau khi người dùng nhấp hoặc nhấn một phím trong tiện ích, vì vậy hãy kết nối nó với các nút và mục tiêu nhấp khác — việc tự động gọi khi tải sẽ không có tác dụng. Cầu nối giữ điểm cuối gửi ở chế độ riêng tư và từ chối theo mặc định trong các trình duyệt không cung cấp khả năng kích hoạt của người dùng, vì vậy mã tiện ích không thể vượt qua bước kiểm tra.
- Quyền gửi lời nhắc chỉ thuộc về tài liệu tiện ích ban đầu. Cầu nối đáng tin cậy cung cấp điểm cuối kênh cho cuộc trò chuyện trước khi mã tiện ích có thể chạy hoặc điều hướng khung, cuộc trò chuyện chỉ tiếp nhận đề nghị đầu tiên đó và kênh chấm dứt cùng tài liệu khi điều hướng. Các URL nhúng được cho phép từ bên ngoài không bao giờ được tiếp nhận.
- Khung tiện ích phải hiển thị trong bản ghi trò chuyện và đang giữ tiêu điểm — một tín hiệu bổ sung do máy chủ quan sát cho thấy người dùng thực sự đang tương tác với tiện ích này.
- Văn bản phải không trống sau khi loại bỏ khoảng trắng và có tối đa 4,000 ký tự.
- Các lời nhắc bắt đầu bằng `/` bị từ chối, vì vậy mã tiện ích không thể kích hoạt các lệnh trò chuyện như `/approve` hoặc `/stop`.
- Mỗi tài liệu tiện ích có thể gửi tối đa 10 lời nhắc trong mỗi khoảng thời gian trượt một phút; các lời nhắc vượt quá giới hạn bị loại bỏ mà không có thông báo.

Các lời nhắc được chấp nhận xuất hiện trong bản ghi dưới dạng thông báo thông thường của người dùng và bắt đầu một lượt tác tử bình thường trong phiên sở hữu tiện ích. Không có kênh phản hồi vào tiện ích: lời nhắc bị loại bỏ sẽ thất bại mà không có thông báo và tiện ích không thể đọc câu trả lời của tác tử.

## Bảo mật và lưu trữ

Các tài liệu tiện ích sử dụng Content Security Policy hạn chế. Kiểu và tập lệnh nội tuyến được cho phép, trong khi các yêu cầu tìm nạp và tải tài nguyên bên ngoài bị chặn. Giữ toàn bộ mã đánh dấu, kiểu, tập lệnh và dữ liệu hình ảnh bên trong `widget_code`.

Iframe của giao diện điều khiển luôn bỏ qua `allow-same-origin`, ngay cả khi chế độ nhúng toàn cục là `trusted`, vì vậy các tập lệnh tiện ích không thể đọc origin của ứng dụng mẹ. Các máy khách gốc sử dụng web view cô lập, không lưu trạng thái và chặn việc điều hướng khỏi tiện ích được lưu trữ. Máy chủ tài liệu lõi cũng phân phối các tiện ích với header phản hồi `Content-Security-Policy: sandbox allow-scripts`, vì vậy việc kết xuất trực tiếp vẫn chạy tiện ích trong một origin không rõ ràng thay vì origin của ứng dụng. Chỉ kết xuất mã tiện ích mà bạn sẵn sàng thực thi trong khung cô lập đó.

Iframe cũng tuân theo [`gateway.controlUi.embedSandbox`](/vi/web/control-ui#hosted-embeds). Cấp `scripts` mặc định hỗ trợ các tiện ích tương tác trong khi vẫn duy trì khả năng cô lập origin.

Canvas giữ lại tối đa 32 tiện ích cho mỗi phiên (hoặc cho mỗi tác tử khi không có phiên). Việc tạo thêm một tiện ích sẽ xóa tài liệu cũ nhất trong phạm vi đó.

## Liên quan

- [Các nội dung nhúng được lưu trữ của giao diện điều khiển](/vi/web/control-ui#hosted-embeds)
- [Hoạt động Discord](/vi/channels/discord-activities)
- [Các thành phần điều khiển Node của Canvas](/vi/plugins/reference/canvas)
- [Các khả năng của máy khách giao thức Gateway](/vi/gateway/protocol#client-capabilities)
