---
read_when:
    - Cài đặt ứng dụng macOS
    - Lựa chọn giữa chế độ Gateway cục bộ và từ xa trên macOS
    - Tìm bản tải xuống phát hành của ứng dụng macOS
summary: Cài đặt và sử dụng ứng dụng thanh menu OpenClaw dành cho macOS
title: ứng dụng macOS
x-i18n:
    generated_at: "2026-07-19T05:52:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b319d72bcbffcf91b6bc012d352c2cf647abd66e08ab0146cf98f5edfae3bca1
    source_path: platforms/macos.md
    workflow: 16
---

Ứng dụng macOS là **trợ lý trên thanh menu** của OpenClaw: giao diện khay hệ thống gốc, lời nhắc cấp quyền của macOS, thông báo, WebChat, đầu vào bằng giọng nói, Canvas và các công cụ Node chạy trên máy Mac như `system.run`.

Sử dụng **Quick Chat** để soạn nội dung cho phiên chính theo kiểu Spotlight mà không cần mở cửa sổ đầy đủ. Nhấn Option-Space (⌥Space) theo mặc định, chọn mục này từ menu trên thanh menu hoặc ghi lại một phím tắt khác trong **Settings → General**.

Nếu chỉ cần CLI và Gateway, hãy bắt đầu với [Bắt đầu](/vi/start/getting-started).

## Tải xuống

Tải các bản dựng ứng dụng macOS từ [các bản phát hành OpenClaw trên GitHub](https://github.com/openclaw/openclaw/releases).
Khi một bản phát hành cung cấp các tài nguyên ứng dụng macOS, hãy tìm:

- `OpenClaw-<version>.dmg` (ưu tiên)
- `OpenClaw-<version>.zip`

Một số bản phát hành chỉ cung cấp CLI, bằng chứng hoặc tài nguyên Windows. Nếu bản phát hành mới nhất không có tài nguyên ứng dụng macOS, hãy sử dụng bản mới nhất có tài nguyên đó hoặc dựng từ mã nguồn theo hướng dẫn [thiết lập môi trường phát triển macOS](/vi/platforms/mac/dev-setup).

## Lần chạy đầu tiên

1. Cài đặt và khởi chạy **OpenClaw.app**.
2. Chọn **This Mac** để dùng Gateway cục bộ hoặc kết nối với Gateway từ xa.
3. Chờ trong khi ứng dụng cài đặt môi trường chạy CLI tương ứng. Ở chế độ cục bộ, ứng dụng cũng
   cài đặt và khởi động Gateway.
4. Thiết lập khả năng suy luận bằng bước kiểm tra mô hình trực tiếp. Sau khi kiểm tra thành công, OpenClaw
   sẽ xử lý phần thiết lập còn lại.
5. Hoàn tất danh sách kiểm tra quyền trên macOS và gửi tin nhắn kiểm tra trong quá trình làm quen ban đầu.

Nếu ứng dụng kết nối đến một Gateway hiện có mà tác tử mặc định đã được cấu hình
mô hình, ứng dụng sẽ coi Gateway đó là đã được thiết lập, bỏ qua quy trình làm quen ban đầu với nhà cung cấp và
OpenClaw, rồi mở bảng điều khiển. Nếu không thể kết nối với Gateway hoặc
tác tử mặc định của Gateway chưa có mô hình, quy trình làm quen ban đầu cho khả năng suy luận vẫn khả dụng để
khôi phục.

Đối với quy trình thiết lập CLI/Gateway, hãy xem [Bắt đầu](/vi/start/getting-started).
Để khôi phục quyền, hãy xem [Quyền trên macOS](/vi/platforms/mac/permissions).

## Cập nhật

Thẻ cập nhật trên bảng điều khiển cho biết ứng dụng sẽ cập nhật thành phần nào:

- **Cập nhật ứng dụng Mac + Gateway** có nghĩa là ứng dụng đã ký sở hữu Gateway launchd cục bộ. Sparkle cập nhật ứng dụng trước; sau khi khởi chạy lại, ứng dụng tự động cập nhật và khởi động lại Gateway của mình ở phiên bản tương ứng, sau đó xác minh kết nối.
- **Cập nhật Gateway** có nghĩa là ứng dụng đang kết nối với một Gateway từ xa, một Gateway cục bộ được quản lý thủ công hoặc một bản cài đặt khác mà ứng dụng không sở hữu. Nút này chạy luồng cập nhật thông thường của Gateway đó thay vì thay đổi ứng dụng Mac.

Một bản cập nhật phối hợp bị lỗi sẽ vẫn ở trong cửa sổ kiểu thiết lập, với các thao tác thử lại, xem [hướng dẫn cập nhật](/vi/install/updating) và Discord. Tính năng sửa chữa tự động không bao giờ hạ cấp một Gateway mới hơn hoặc ghi đè ghim kênh `extended-stable`.

Sau khi cập nhật thành công, ứng dụng tìm phiên trực tiếp cấp cao nhất được con người sử dụng gần đây nhất và gửi cho agent đó một sự kiện cập nhật dùng một lần. Hoạt động Heartbeat và cron không ảnh hưởng đến lựa chọn này. Sau đó, agent có thể chào đón bạn trở lại từ cuộc trò chuyện mà bạn có nhiều khả năng đang sử dụng nhất. Ở chế độ từ xa, ứng dụng chỉ cập nhật runtime Node Mac cục bộ và bỏ qua thông báo khi Gateway từ xa cũ hơn ứng dụng.

Sparkle tuân theo cài đặt `update.channel` của Gateway. `beta` và `dev` chọn sử dụng các bản dựng ứng dụng beta; `stable`, `extended-stable` và các giá trị bị thiếu hoặc không xác định tiếp tục sử dụng các bản dựng ứng dụng ổn định.

## Mở liên kết bảng điều khiển

Trong bảng điều khiển được nhúng của ứng dụng macOS, việc nhấp vào một liên kết web bên ngoài sẽ mở liên kết đó trong thanh bên trình duyệt có thể thay đổi kích thước với chiều rộng bằng một nửa cửa sổ, đồng thời vẫn hiển thị phần điều hướng của bảng điều khiển. Kéo đường phân cách để chọn chiều rộng khác; ứng dụng sẽ ghi nhớ lựa chọn này. Mỗi liên kết mở trong một thẻ riêng, thanh thẻ xuất hiện khi có nhiều trang đang mở và việc nhấp lại vào cùng một liên kết sẽ sử dụng lại thẻ hiện có. Kéo các thẻ để sắp xếp lại, đóng chúng bằng nút đóng thẻ hoặc nhấp chuột giữa, và nhấp chuột phải vào một thẻ để chọn **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** và **Close Other Tabs**. Các nút điều khiển quay lại/tiến tới trên thanh tiêu đề của cửa sổ và thao tác vuốt trên bàn di chuột dùng để điều hướng lịch sử bảng điều khiển; các nút quay lại/tiến tới riêng của thanh bên dùng để điều hướng lịch sử của thẻ đang hoạt động. Thanh bên cũng có các nút tải lại, mở trong trình duyệt mặc định và đóng.

Các nút điều khiển trên thanh tiêu đề thay đổi theo thanh bên của ứng dụng: khi thanh bên được mở rộng, các nút quay lại/tiến tới nằm ở cạnh phải của thanh bên, bên cạnh nút bật/tắt thanh bên; khi thanh bên được thu gọn, chúng nhường chỗ cho nút tìm kiếm (mở bảng lệnh) và nút tạo phiên mới.

Nhấp chuột phải vào một liên kết bên ngoài để chọn **Open in Sidebar**, **Open in Default Browser** hoặc **Copy Link**. Các lần nhấp có phím bổ trợ và liên kết mở cửa sổ mới do người dùng kích hoạt từ bảng điều khiển vẫn tiếp tục mở trong trình duyệt mặc định; các liên kết mở cửa sổ mới bên trong thanh bên sẽ mở dưới dạng thẻ thanh bên mới. Các trang Control UI thông thường được lưu trữ trong trình duyệt vẫn giữ nguyên hành vi liên kết và menu ngữ cảnh thông thường của trình duyệt.

## Nhập thông tin đăng nhập trình duyệt

Lần đầu tiên thanh bên trình duyệt mở trong khi ứng dụng chạy với Gateway cục bộ, bảng điều khiển sẽ hiển thị một biểu ngữ có thể đóng nếu trên máy Mac tồn tại hồ sơ thuộc họ Chrome có cookie. Biểu ngữ đề nghị sao chép các cookie đó vào một hồ sơ được quản lý và cách ly mà các tác nhân sử dụng để duyệt web. Chọn một hồ sơ từ nút điều khiển **Import** của biểu ngữ (có thể cần Touch ID); tiến trình và số lượng cookie đã nhập được hiển thị ngay tại đó, và chỉ cookie được sao chép — mật khẩu không bao giờ rời khỏi trình duyệt nguồn. Việc đóng biểu ngữ sẽ ghi lại lựa chọn này; **Settings → General → Browser login → Import…** cho phép thực hiện lại bất cứ lúc nào. Xem [Trình duyệt](/vi/cli/browser) để biết luồng nhập cơ bản và cổng `browser.allowSystemProfileImport`.

## Chọn chế độ Gateway

| Chế độ | Sử dụng khi                                                                    | Trang chi tiết                                        |
| ------ | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Cục bộ | Máy Mac này cần chạy Gateway và duy trì hoạt động của nó bằng launchd.         | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway) |
| Từ xa  | Máy chủ khác chạy Gateway; máy Mac này điều khiển nó qua SSH, LAN hoặc Tailnet. | [Điều khiển từ xa](/vi/platforms/mac/remote)             |

Cả hai chế độ đều cần cài đặt CLI `openclaw` vì ứng dụng sử dụng lại môi trường chạy
máy chủ node của CLI. Trên máy Mac mới, ứng dụng tự động cài đặt CLI tương ứng; sau đó chế độ
cục bộ khởi động trình hướng dẫn Gateway, còn chế độ từ xa kết nối với Gateway đã chọn
mà không khởi động Gateway cục bộ thứ hai.
Xem [Gateway trên macOS](/vi/platforms/mac/bundled-gateway) để biết cách khôi phục thủ công.

## Những gì ứng dụng quản lý

- Trạng thái thanh menu, thông báo, tình trạng hoạt động, WebChat và thanh Quick Chat nổi.
- Các lời nhắc cấp quyền của macOS cho màn hình, micrô, giọng nói, tự động hóa và trợ năng.
- Một node Mac kết hợp Canvas gốc, chụp camera/màn hình, thông báo,
  vị trí và điều khiển máy tính với các lệnh hệ thống, trình duyệt,
  plugin, kỹ năng và MCP của máy chủ node CLI.
- Các lời nhắc phê duyệt thực thi cho những lệnh được lưu trữ trên máy Mac.
- Thực thi trong ngữ cảnh ứng dụng đối với các lệnh shell đã được phê duyệt, duy trì việc quy thuộc
  quyền macOS của ứng dụng trong khi môi trường chạy CLI quản lý chính sách node dùng chung.
- Đường hầm SSH ở chế độ từ xa hoặc kết nối trực tiếp tới Gateway.

Trong Control UI được nhúng, **Settings → Notifications** hiển thị quyền
thông báo gốc của ứng dụng thay vì thông báo đẩy của trình duyệt vì ứng dụng phân phối thông báo theo cách gốc.

Ứng dụng **không** thay thế tài liệu về Gateway hoặc CLI nói chung. Cấu hình
Gateway, nhà cung cấp, plugin, kênh, công cụ và bảo mật được trình bày trong
tài liệu riêng tương ứng.

## Các trang chi tiết về macOS

| Tác vụ                                      | Tài liệu                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Cài đặt hoặc gỡ lỗi dịch vụ CLI/Gateway     | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway)                                          |
| Giữ trạng thái ngoài các thư mục đồng bộ đám mây | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway#state-directory-on-macos)             |
| Gỡ lỗi việc phát hiện ứng dụng và kết nối   | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Tìm hiểu hành vi của launchd                | [Vòng đời Gateway](/vi/platforms/mac/child-process)                                               |
| Khắc phục vấn đề về quyền hoặc ký/TCC       | [Quyền trên macOS](/vi/platforms/mac/permissions)                                                 |
| Phát hiện máy Mac được sử dụng gần đây nhất | [Sự hiện diện của máy tính đang hoạt động](/vi/nodes/presence)                                   |
| Kết nối với Gateway từ xa                   | [Điều khiển từ xa](/vi/platforms/mac/remote)                                                      |
| Xem trạng thái thanh menu và kiểm tra tình trạng hoạt động | [Thanh menu](/vi/platforms/mac/menu-bar), [Kiểm tra tình trạng hoạt động](/vi/platforms/mac/health) |
| Sử dụng giao diện trò chuyện được nhúng     | [WebChat](/vi/platforms/mac/webchat)                                                              |
| Sử dụng kích hoạt bằng giọng nói hoặc nhấn để nói | [Kích hoạt bằng giọng nói](/vi/platforms/mac/voicewake)                                     |
| Sử dụng Canvas và liên kết sâu Canvas       | [Canvas](/vi/platforms/mac/canvas)                                                               |
| Lưu trữ PeekabooBridge để tự động hóa UI    | [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo)                                                   |
| Cấu hình phê duyệt lệnh                     | [Phê duyệt thực thi](/vi/tools/exec-approvals), [chi tiết nâng cao](/vi/tools/exec-approvals-advanced) |
| Kiểm tra các lệnh node Mac và IPC của ứng dụng | [IPC macOS](/vi/platforms/mac/xpc)                                                            |
| Thu thập nhật ký                            | [Ghi nhật ký macOS](/vi/platforms/mac/logging)                                                   |
| Xây dựng từ mã nguồn                        | [Thiết lập phát triển macOS](/vi/platforms/mac/dev-setup)                                        |

## Liên quan

- [Nền tảng](/vi/platforms)
- [Bắt đầu](/vi/start/getting-started)
- [Gateway](/vi/gateway)
- [Phê duyệt thực thi](/vi/tools/exec-approvals)
