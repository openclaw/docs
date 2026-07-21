---
read_when:
    - Bạn muốn một agent hiển thị kết quả tương tác trong trò chuyện trên web, ứng dụng gốc hoặc Discord
    - Bạn muốn các nút tiện ích gửi lời nhắc tiếp theo vào cuộc trò chuyện
    - Bạn muốn áp dụng giao diện cho các tiện ích bằng những token thiết kế dùng chung
    - Bạn cần hợp đồng đầu vào, bảo mật hoặc lưu giữ của show_widget
sidebarTitle: Show widget
summary: Hiển thị các tiện ích HTML độc lập trên các nền tảng trò chuyện được hỗ trợ
title: Hiển thị tiện ích
x-i18n:
    generated_at: "2026-07-21T13:44:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 903adff1fadeb9d224d3e2d839c86082b5244e1e319255c8d3f6619344b749a3
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` là một công cụ cốt lõi hiển thị một tiện ích HTML độc lập trên giao diện hiện tại của người dùng. OpenClaw kết xuất tiện ích này ngay trong Control UI và trong bản ghi hội thoại Quick Chat trên iOS, Android, macOS và Linux; bảng điều khiển Linux sử dụng Control UI trên trình duyệt. Trong một phiên Discord đã bật [Activities](/vi/channels/discord-activities), Plugin Discord đăng một nút **Open widget** để khởi chạy tiện ích dưới dạng Activity.

## Cách hoạt động của tiện ích

Khi tác nhân gọi `show_widget`, lõi OpenClaw bọc `widget_code` trong một tài liệu HTML tối giản, lưu tài liệu đó dưới dạng tài liệu Canvas và trả về một định danh xem trước. Control UI kết xuất định danh đó trong một iframe được cách ly, còn Quick Chat trên iOS, Android, macOS và Linux sử dụng các chế độ xem web biệt lập. Các ứng dụng trò chuyện đầy đủ khôi phục tiện ích sau khi tải lại lịch sử; Quick Chat giữ tiện ích trong câu trả lời đang hoạt động.

Trong các phiên Control UI, tiện ích Canvas cũng có thể được ghim vào bảng điều khiển của phiên. Đặt `pin: true` trong lệnh gọi công cụ hoặc sử dụng **Pin to dashboard** trên một tiện ích hiện có trong bản ghi hội thoại. HTML được ghim chạy phía sau máy chủ cách ly hai iframe, có origin chuyên dụng, giống như máy chủ dùng cho MCP Apps; trình duyệt không bao giờ phân giải liên kết dữ liệu của tiện ích bên trong khung không đáng tin cậy.

Để nhúng trong trình duyệt, tài liệu bao bọc chèn bốn cầu nối máy chủ nhỏ quanh mã tiện ích:

- Một trình báo cáo kích thước gửi chiều cao nội dung đã kết xuất đến ứng dụng trò chuyện nhúng, ứng dụng này giới hạn chiều cao và điều chỉnh iframe cho vừa (160 đến 1200 pixel).
- Một cầu nối máy chủ định nghĩa trình trợ giúp `sendPrompt(text)` cũ cùng các API có cấu trúc `openclaw.prompt`, `openclaw.state`, `openclaw.data` và `openclaw.cron`. Các lời nhắc trò chuyện nội tuyến giữ kênh tin nhắn riêng tư của chúng; API bảng điều khiển sử dụng một kênh yêu cầu được liên kết với vé chế độ xem. Xem [Tiện ích tương tác](#interactive-widgets) và [Các khả năng của bảng điều khiển](#dashboard-capabilities).
- Một cầu nối giao diện lắng nghe các token thiết kế hiện tại của Control UI và áp dụng chúng dưới dạng biến CSS khi tải và sau mỗi lần thay đổi giao diện.
- Một cầu nối ảnh chụp kết xuất tài liệu tiện ích hiện tại thành PNG khi ứng dụng trò chuyện nhúng yêu cầu xuất.

Mọi nội dung khác vẫn nằm bên trong khung: tài liệu chạy trong một origin không trong suốt với Chính sách bảo mật nội dung nghiêm ngặt, vì vậy các tập lệnh tiện ích không thể truy cập Control UI, Gateway hoặc mạng.

Phần triển khai cốt lõi chỉ khả dụng khi ứng dụng Gateway khởi tạo khai báo khả năng `inline-widgets`. Control UI và các ứng dụng gốc được hỗ trợ tự động khai báo khả năng này. Quick Chat trên Linux chỉ hỗ trợ văn bản đối với các kết nối Gateway yêu cầu ghim chứng chỉ TLS đầu cuối tùy chỉnh vì WebView của nền tảng không thể liên kết ghim đó. Phần triển khai Discord chỉ khả dụng trong các phiên Discord đã cấu hình Activities. Các lượt chạy trên kênh khác không nhận được `show_widget`.

Việc truyền khả năng hỗ trợ các backend mô hình nhúng, Codex app-server và dựa trên CLI. Những bên gọi MCP được xác thực bằng quyền cấp và những bên gọi trực tiếp công cụ qua HTTP vẫn mặc định từ chối vì chúng không khai báo khả năng ứng dụng.

## Hệ thống thiết kế

Mỗi tiện ích Canvas bao gồm một bảng định kiểu cơ sở không dùng lớp và một bộ token nhỏ:

| Token                                                                                 | Mục đích                               |
| ------------------------------------------------------------------------------------- | ------------------------------------- |
| `--surface`                                                                           | Màu bề mặt cấp trang              |
| `--card`                                                                              | Nền của thẻ, nút và mã     |
| `--elevated`                                                                          | Nền nâng cao của điều khiển biểu mẫu      |
| `--text`                                                                              | Văn bản mặc định của nội dung và điều khiển         |
| `--text-strong`                                                                       | Tiêu đề và giá trị nổi bật         |
| `--muted`                                                                             | Văn bản phụ và đường viền tinh tế     |
| `--border`                                                                            | Đường phân cách tiêu chuẩn và đường viền thẻ  |
| `--border-strong`                                                                     | Đường viền điều khiển đậm                |
| `--accent`                                                                            | Liên kết và vòng lấy nét                 |
| `--accent-fill`                                                                       | Màu tô hành động chính                   |
| `--accent-fg`                                                                         | Văn bản trên hành động chính              |
| `--ok`                                                                                | Trạng thái thành công                         |
| `--warn`                                                                              | Trạng thái cảnh báo                         |
| `--danger`                                                                            | Trạng thái lỗi hoặc phá hủy            |
| `--info`                                                                              | Trạng thái thông tin                   |
| `--radius`                                                                            | Bán kính góc dùng chung cho điều khiển và thẻ |
| `--font-body`                                                                         | Bộ phông chữ nội dung của máy chủ                  |
| `--font-mono`                                                                         | Bộ phông chữ đơn cách của máy chủ             |
| `--accent-subtle`, `--ok-subtle`, `--warn-subtle`, `--danger-subtle`, `--info-subtle` | Nền trạng thái trong suốt dẫn xuất |

Các tiêu đề, đoạn văn, liên kết, nút, trường nhập, hộp chọn, vùng văn bản, bảng và khối mã không có lớp sẽ nhận các kiểu cơ sở. Các lớp trợ giúp cung cấp những mẫu phổ biến:

- `.card` cho một bề mặt nội dung có đường viền
- `.badge`, cùng với `.ok`, `.warn`, `.danger` hoặc `.info`, cho nhãn trạng thái nhỏ gọn
- `.metric` cho một giá trị số nổi bật
- `.muted` cho văn bản phụ
- `.row` cho bố cục ngang có thể xuống dòng
- `button.primary` cho hành động chính

Control UI gửi một thông báo `openclaw:widget-theme` chứa các giá trị giao diện đang hoạt động khi tiện ích tải và mỗi khi giao diện thay đổi. Vì vậy, tiện ích theo dõi mọi họ giao diện, bao gồm Claw, Knot, Dash và giao diện tùy chỉnh mà không cần tải lại. Bên ngoài Control UI, bao gồm ứng dụng gốc và khi mở trực tiếp, tiện ích sử dụng bảng màu sáng hoặc tối tích hợp sẵn do `prefers-color-scheme` chọn.

Thiết kế tiện ích theo ba quy tắc:

1. Sử dụng các biến thiết kế cho mọi màu sắc và nền. Không mã hóa cứng giá trị màu.
2. Giữ nền trang trong suốt để tiện ích hòa hợp với bề mặt máy chủ.
3. Chỉ dành `--accent-fill` cho tối đa một hành động chính.

**Xuất:** Trong ứng dụng trò chuyện web, mở trình đơn thẻ tiện ích để sao chép tiện ích đã kết xuất vào bảng nhớ tạm hoặc tải xuống dưới dạng PNG. Các tài liệu tiện ích cũ không có cầu nối ảnh chụp sẽ chuyển sang tải xuống tệp HTML.

## Sử dụng công cụ

Cả hai phần triển khai đều sử dụng các trường bắt buộc giống nhau:

<ParamField path="title" type="string" required>
  Tiêu đề ngắn hiển thị cùng bản xem trước nội tuyến và trong tiêu đề tài liệu được lưu trữ.
</ParamField>

<ParamField path="widget_code" type="string" required>
  HTML hoặc SVG độc lập. Đối với các ứng dụng tiện ích nội tuyến, dữ liệu đầu vào bắt đầu bằng `<svg` sau khi cắt khoảng trắng sẽ được kết xuất ở chế độ SVG; độ dài tối đa là 262,144 ký tự. Discord chấp nhận một tài liệu HTML hoàn chỉnh hoặc đoạn nội dung body có kích thước tối đa 48 KiB.
</ParamField>

Discord cũng chấp nhận văn bản `button_label` tùy chọn cho nút khởi chạy Activity. Lược đồ Canvas cố ý bỏ qua trường chỉ dành cho Discord này.

Công cụ Canvas cốt lõi chấp nhận các trường bố trí bảng điều khiển tùy chọn sau:

- `pin`: đồng thời đặt tiện ích trên bảng điều khiển của phiên.
- `name`: tên tiện ích ổn định; mặc định là slug của `title`.
- `tab`: slug của thẻ đích.
- `size`: một trong `sm`, `md`, `lg`, `xl` hoặc `full`.
- `after`: tên tiện ích cùng cấp mà tiện ích này sẽ được đặt sau nó.
- `capabilities`: quyền truy cập mà tiện ích được ghim yêu cầu. `netOrigins` chứa các origin HTTPS chính xác; `tools` chứa `prompt`, một liên kết đọc trong danh sách cho phép hoặc một hành động `cron.trigger:<jobId>` chính xác.

Kết quả cốt lõi bao gồm một định danh xem trước Canvas, vì vậy Control UI và các ứng dụng gốc được hỗ trợ kết xuất tiện ích trực tiếp từ lệnh gọi công cụ và khôi phục tiện ích sau khi tải lại lịch sử. Kết quả được ghim cũng giữ lại tên tiện ích bảng để Control UI không đề xuất ghim trùng lặp sau khi tải lại bản ghi hội thoại. Discord trả về các mã định danh của tiện ích đã lưu trữ và tin nhắn đã đăng.

`discord_widget` vẫn được đăng ký dưới dạng bí danh không còn được khuyến nghị trong một bản phát hành. Các lệnh gọi tác nhân mới nên sử dụng `show_widget`.

## Tiện ích tương tác

Trong Control UI, tập lệnh tiện ích có thể điều khiển cuộc hội thoại. Tài liệu bao bọc định nghĩa một hàm toàn cục `sendPrompt(text)`; việc gọi hàm này sẽ gửi `text` đến ứng dụng trò chuyện như thể người dùng đã nhập và gửi tin nhắn. Liên kết hàm này với các nút hoặc điều khiển khác để xây dựng các luồng tương tác như bộ chọn, câu đố hoặc bảng điều khiển truy sâu. Ứng dụng gốc kết xuất mã tiện ích tương tác nhưng không cung cấp cầu nối lời nhắc trò chuyện này.

```html
<button onclick="sendPrompt('Hiển thị chi tiết các kiểm thử không đạt')">Các kiểm thử không đạt</button>
```

Mọi lời nhắc đều được xác thực ở cả hai phía của ranh giới khung:

- `sendPrompt` yêu cầu [thao tác kích hoạt tạm thời của người dùng](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) bên trong tiện ích: chức năng này chỉ hoạt động trong vài giây sau khi người dùng nhấp hoặc nhấn một phím trong tiện ích, vì vậy hãy liên kết nó với nút và các mục tiêu nhấp khác — việc tự động gọi khi tải không có tác dụng. Cầu nối giữ endpoint gửi riêng tư và mặc định từ chối trong các trình duyệt không cung cấp thao tác kích hoạt người dùng, vì vậy mã tiện ích không thể bỏ qua bước kiểm tra.
- Quyền gửi lời nhắc chỉ thuộc về tài liệu tiện ích gốc. Cầu nối đáng tin cậy cung cấp endpoint kênh của mình cho ứng dụng trò chuyện trước khi mã tiện ích có thể chạy hoặc điều hướng khung, ứng dụng trò chuyện chỉ tiếp nhận đề nghị đầu tiên đó và kênh chấm dứt cùng tài liệu khi điều hướng. Các URL nhúng được cho phép bên ngoài không bao giờ được tiếp nhận.
- Khung tiện ích phải hiển thị trong bản ghi hội thoại trò chuyện và đang giữ tiêu điểm — đây là một tín hiệu bổ sung do máy chủ quan sát cho thấy người dùng thực sự đang tương tác với tiện ích này.
- Văn bản phải không rỗng sau khi cắt khoảng trắng và có tối đa 4,000 ký tự.
- Các lời nhắc bắt đầu bằng `/` sẽ bị từ chối, vì vậy mã tiện ích không thể kích hoạt các lệnh trò chuyện như `/approve` hoặc `/stop`.
- Mỗi tài liệu tiện ích có thể gửi tối đa 10 lời nhắc trong mỗi phút trượt; các lời nhắc vượt mức sẽ bị loại bỏ mà không có thông báo.

Các lời nhắc được chấp nhận xuất hiện trong bản ghi hội thoại dưới dạng tin nhắn người dùng thông thường và bắt đầu một lượt tác nhân bình thường trong phiên sở hữu tiện ích. Không có kênh phản hồi vào tiện ích: lời nhắc bị loại bỏ sẽ thất bại mà không có thông báo và tiện ích không thể đọc câu trả lời của tác nhân.

## Các khả năng của bảng điều khiển

Các tiện ích được ghim có thể sử dụng một API máy chủ được liên kết với vé sau khi người vận hành xem xét phần khai báo hiển thị trên thẻ đang chờ:

- `openclaw.prompt.send(text)` yêu cầu kích hoạt tạm thời từ người dùng và đăng một thông báo hiển thị trong trình soạn thảo. Việc khai báo và nhận quyền công cụ `prompt` sẽ bỏ qua bước xác nhận bổ sung cho mỗi lần nhấp; quy trình xác thực, kiểm tra tiêu điểm và giới hạn tốc độ vẫn được áp dụng.
- `openclaw.state.emit(payload)` thêm một thông báo phiên. Payload bị giới hạn ở 8 KiB và các lượt phát giống hệt nhau từ máy khách trong vòng năm giây sẽ được hợp nhất.
- `openclaw.data.read(bindingId, params?)` chỉ được phân giải tại Gateway. Các liên kết có thể cấp quyền là `sessions.list`, `usage.status`, `usage.cost`, `cron.list`, `cron.status`, `agents.list` và `health`.
- `openclaw.cron.trigger(jobId)` chỉ chạy ngay một tác vụ hiện có khi khả năng `cron.trigger:<jobId>` chính xác đã được cấp.

Quyền truy cập mạng tách biệt với các công cụ máy chủ. Đặt chính xác các origin HTTPS trong `capabilities.netOrigins`; sau khi được phê duyệt, chỉ những origin đó mới được đưa vào `connect-src` của tiện ích. Ký tự đại diện, thông tin xác thực, đường dẫn, chuỗi truy vấn và các origin chưa khai báo vẫn bị chặn. Cổng dạng giá trị cố định chỉ được phép khi là một phần của origin đã khai báo.

## Bảo mật và lưu trữ

Tài liệu tiện ích sử dụng các Chính sách bảo mật nội dung nghiêm ngặt. Kiểu và tập lệnh nội tuyến được phép, trong khi việc tải tài nguyên bên ngoài vẫn bị chặn. Tiện ích bản chép lời nội tuyến không thể truy cập mạng. Tiện ích bảng điều khiển được ghim chỉ có thể truy cập chính xác các origin HTTPS mà tác nhân đã khai báo và người vận hành đã cấp quyền.

Iframe của Control UI luôn bỏ qua `allow-same-origin`, ngay cả khi chế độ nhúng toàn cục là `trusted`, để tập lệnh của tiện ích không thể đọc origin của ứng dụng mẹ. Các máy khách gốc sử dụng chế độ xem web cô lập, không lưu trạng thái lâu dài và chặn việc điều hướng khỏi tiện ích được lưu trữ. Máy chủ tài liệu cốt lõi cũng phân phối tiện ích với tiêu đề phản hồi `Content-Security-Policy: sandbox allow-scripts`, vì vậy việc kết xuất trực tiếp vẫn chạy tiện ích trong một origin không rõ ràng thay vì origin của ứng dụng. Chỉ kết xuất mã tiện ích mà bạn sẵn sàng thực thi trong khung cô lập đó.

Iframe cũng tuân theo [`gateway.controlUi.embedSandbox`](/vi/web/control-ui#hosted-embeds). Cấp `scripts` mặc định hỗ trợ các tiện ích tương tác trong khi vẫn duy trì khả năng cô lập origin.

Rủi ro tồn dư đã được chấp nhận đối với lưu lượng đi ra qua kênh dữ liệu WebRTC được ghi lại trong [Kiến trúc bảng điều khiển](/vi/web/dashboard-architecture#modeled-residual-webrtc-data-channels).

Canvas lưu giữ tối đa 32 tiện ích cho mỗi phiên (hoặc cho mỗi tác nhân khi không có phiên). Việc tạo thêm một tiện ích sẽ xóa tài liệu cũ nhất trong phạm vi đó.

## Liên quan

- [Nội dung nhúng được lưu trữ của Control UI](/vi/web/control-ui#hosted-embeds)
- [Discord Activities](/vi/channels/discord-activities)
- [Các chế độ điều khiển Node của Canvas](/vi/plugins/reference/canvas)
- [Các khả năng máy khách của giao thức Gateway](/vi/gateway/protocol#client-capabilities)
