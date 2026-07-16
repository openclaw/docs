---
read_when:
    - Cài đặt ứng dụng macOS
    - Lựa chọn giữa chế độ Gateway cục bộ và từ xa trên macOS
    - Tìm kiếm bản tải xuống phát hành ứng dụng macOS
summary: Cài đặt và sử dụng ứng dụng OpenClaw trên thanh menu macOS
title: ứng dụng macOS
x-i18n:
    generated_at: "2026-07-16T15:27:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

Ứng dụng macOS là **trợ lý trên thanh menu** của OpenClaw: giao diện khay hệ thống gốc, lời nhắc cấp quyền của macOS, thông báo, WebChat, nhập liệu bằng giọng nói, Canvas và các công cụ nút được lưu trữ trên máy Mac như `system.run`.

Chỉ cần CLI và Gateway? Hãy bắt đầu với [Bắt đầu sử dụng](/vi/start/getting-started).

## Tải xuống

Tải các bản dựng ứng dụng macOS từ [các bản phát hành OpenClaw trên GitHub](https://github.com/openclaw/openclaw/releases).
Khi một bản phát hành có tài nguyên ứng dụng macOS, hãy tìm:

- `OpenClaw-<version>.dmg` (ưu tiên)
- `OpenClaw-<version>.zip`

Một số bản phát hành chỉ cung cấp CLI, bằng chứng hoặc tài nguyên Windows. Nếu bản phát hành mới nhất
không có tài nguyên ứng dụng macOS, hãy dùng bản mới nhất có tài nguyên đó hoặc tự dựng từ mã nguồn theo
[thiết lập phát triển macOS](/vi/platforms/mac/dev-setup).

## Lần chạy đầu tiên

1. Cài đặt và khởi chạy **OpenClaw.app**.
2. Chọn **This Mac** cho Gateway cục bộ hoặc kết nối với Gateway từ xa.
3. Chờ trong khi ứng dụng cài đặt môi trường chạy CLI tương ứng. Ở chế độ cục bộ, ứng dụng cũng
   cài đặt và khởi động Gateway.
4. Thiết lập khả năng suy luận bằng quy trình kiểm tra mô hình trực tiếp. Sau khi kiểm tra thành công, OpenClaw
   xử lý phần thiết lập còn lại.
5. Hoàn thành danh sách kiểm tra quyền của macOS và gửi tin nhắn kiểm thử trong quá trình làm quen.

Nếu ứng dụng truy cập một Gateway hiện có mà tác nhân mặc định đã được cấu hình
mô hình, ứng dụng coi Gateway đó là đã được thiết lập, bỏ qua bước làm quen với nhà cung cấp và
OpenClaw, rồi mở bảng điều khiển. Nếu không thể kết nối với Gateway hoặc
tác nhân mặc định của Gateway không có mô hình, quy trình làm quen với khả năng suy luận vẫn khả dụng để
khôi phục.

Đối với quy trình thiết lập CLI/Gateway, hãy xem [Bắt đầu sử dụng](/vi/start/getting-started).
Để khôi phục quyền, hãy xem [quyền trên macOS](/vi/platforms/mac/permissions).

## Cập nhật

Thẻ cập nhật trên bảng điều khiển cho biết ứng dụng sẽ cập nhật những gì:

- **Update Mac app + Gateway** nghĩa là ứng dụng đã ký sở hữu Gateway
  launchd cục bộ. Sparkle cập nhật ứng dụng trước; sau khi khởi chạy lại, ứng dụng tự động
  cập nhật và khởi động lại Gateway ở phiên bản tương ứng, sau đó xác minh
  kết nối.
- **Update Gateway** nghĩa là ứng dụng đang kết nối với một Gateway từ xa, một Gateway cục bộ
  được quản lý thủ công hoặc một bản cài đặt khác mà ứng dụng không sở hữu. Nút này
  chạy quy trình cập nhật thông thường của Gateway đó thay vì thay đổi ứng dụng Mac.

Nếu cập nhật phối hợp thất bại, cửa sổ kiểu thiết lập vẫn hiển thị cùng các thao tác thử lại,
[hướng dẫn cập nhật](/vi/install/updating) và Discord. Quy trình sửa chữa tự động không bao giờ
hạ cấp Gateway mới hơn hoặc ghi đè mã ghim kênh `extended-stable`.

Sau khi cập nhật thành công, ứng dụng tìm phiên trực tiếp cấp cao nhất được con người sử dụng
gần đây nhất và gửi cho tác nhân đó một sự kiện cập nhật dùng một lần. Hoạt động Heartbeat
và cron không ảnh hưởng đến lựa chọn này. Sau đó, tác nhân có thể chào mừng bạn quay lại
từ cuộc trò chuyện mà nhiều khả năng bạn đã sử dụng gần đây nhất. Ở chế độ từ xa, ứng dụng
chỉ cập nhật môi trường chạy nút Mac cục bộ và bỏ qua thông báo khi
Gateway từ xa cũ hơn ứng dụng.

Sparkle tuân theo thiết lập `update.channel` của Gateway. `beta` và `dev` cho phép
nhận các bản dựng ứng dụng beta; `stable`, `extended-stable` và các giá trị bị thiếu hoặc không xác định
tiếp tục sử dụng các bản dựng ứng dụng ổn định.

## Mở liên kết trên bảng điều khiển

Trong bảng điều khiển nhúng của ứng dụng macOS, khi nhấp vào một liên kết web bên ngoài, liên kết sẽ mở trong thanh bên trình duyệt có thể đổi kích thước với chiều rộng bằng một nửa cửa sổ, đồng thời vẫn giữ hiển thị phần điều hướng của bảng điều khiển. Kéo đường phân cách để chọn chiều rộng khác; ứng dụng sẽ ghi nhớ lựa chọn đó. Mỗi liên kết mở trong một thẻ riêng, thanh thẻ xuất hiện khi có nhiều trang đang mở và việc nhấp lại vào cùng một liên kết sẽ tái sử dụng thẻ hiện có. Kéo các thẻ để sắp xếp lại, đóng chúng bằng nút đóng thẻ hoặc nhấp chuột giữa, và nhấp chuột phải vào một thẻ để dùng **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** và **Close Other Tabs**. Các nút quay lại/tiến trên thanh tiêu đề của cửa sổ và thao tác vuốt trên bàn di chuột dùng để điều hướng lịch sử của bảng điều khiển; các nút quay lại/tiến riêng của thanh bên dùng để điều hướng lịch sử của thẻ đang hoạt động. Thanh bên cũng có các nút tải lại, mở trong trình duyệt mặc định và đóng.

Các nút trên thanh tiêu đề thay đổi theo thanh bên của ứng dụng: khi thanh bên được mở rộng, các nút quay lại/tiến nằm ở mép phải cạnh nút bật/tắt thanh bên; khi thanh bên được thu gọn, chúng nhường chỗ cho nút tìm kiếm (mở bảng lệnh) và nút tạo phiên mới.

Nhấp chuột phải vào một liên kết bên ngoài để chọn **Open in Sidebar**, **Open in Default Browser** hoặc **Copy Link**. Các cú nhấp có phím bổ trợ và liên kết mở cửa sổ mới do người dùng kích hoạt từ bảng điều khiển vẫn tiếp tục mở trong trình duyệt mặc định; các liên kết mở cửa sổ mới bên trong thanh bên sẽ mở thành thẻ mới của thanh bên. Các trang Control UI thông thường được lưu trữ trong trình duyệt vẫn giữ nguyên hành vi liên kết và menu ngữ cảnh thông thường của trình duyệt.

## Nhập thông tin đăng nhập trình duyệt

Lần đầu thanh bên trình duyệt mở khi ứng dụng chạy với Gateway cục bộ, bảng điều khiển sẽ hiển thị một biểu ngữ có thể bỏ qua nếu trên máy Mac có hồ sơ thuộc họ Chrome chứa cookie. Biểu ngữ đề nghị sao chép các cookie đó vào một hồ sơ được quản lý và cô lập mà các tác nhân dùng để duyệt web. Chọn một hồ sơ từ nút **Import** (có thể cần Touch ID); tiến trình và số lượng cookie đã nhập được hiển thị ngay tại chỗ, và chỉ cookie được sao chép — mật khẩu không bao giờ rời khỏi trình duyệt nguồn. Việc bỏ qua biểu ngữ sẽ ghi lại lựa chọn đó; **Settings → General → Browser login → Import…** cho phép thực hiện lại bất kỳ lúc nào. Xem [Trình duyệt](/vi/cli/browser) để biết quy trình nhập cơ bản và cổng `browser.allowSystemProfileImport`.

## Chọn chế độ Gateway

| Chế độ | Sử dụng khi                                                                     | Trang chi tiết                                       |
| ------ | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Cục bộ | Máy Mac này cần chạy Gateway và duy trì hoạt động của Gateway bằng launchd.     | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway) |
| Từ xa  | Máy chủ khác chạy Gateway; máy Mac này điều khiển Gateway qua SSH, LAN hoặc Tailnet. | [Điều khiển từ xa](/vi/platforms/mac/remote)         |

Cả hai chế độ đều cần cài đặt CLI `openclaw` vì ứng dụng tái sử dụng môi trường chạy
máy chủ nút của CLI. Trên máy Mac mới, ứng dụng tự động cài đặt CLI tương ứng; sau đó chế độ cục bộ
khởi động trình hướng dẫn Gateway, còn chế độ từ xa kết nối với Gateway đã chọn
mà không khởi động thêm một Gateway cục bộ thứ hai.
Xem [Gateway trên macOS](/vi/platforms/mac/bundled-gateway) để biết cách khôi phục thủ công.

## Những gì ứng dụng quản lý

- Trạng thái thanh menu, thông báo, tình trạng hoạt động và WebChat.
- Lời nhắc cấp quyền của macOS cho màn hình, micrô, giọng nói, tự động hóa và trợ năng.
- Một nút Mac kết hợp Canvas gốc, chụp từ camera/màn hình, thông báo,
  vị trí và điều khiển máy tính với các lệnh hệ thống, trình duyệt,
  Plugin, skill và MCP của máy chủ nút CLI.
- Lời nhắc phê duyệt thực thi cho các lệnh được lưu trữ trên máy Mac.
- Thực thi trong ngữ cảnh ứng dụng đối với các lệnh shell đã được phê duyệt, duy trì thông tin quy quyền
  của macOS cho ứng dụng trong khi môi trường chạy CLI quản lý chính sách nút dùng chung.
- Đường hầm SSH ở chế độ từ xa hoặc kết nối trực tiếp với Gateway.

Ứng dụng **không** thay thế tài liệu Gateway hoặc CLI nói chung. Cấu hình
Gateway, nhà cung cấp, Plugin, kênh, công cụ và bảo mật được trình bày trong
các tài liệu riêng.

## Các trang chi tiết về macOS

| Tác vụ                                      | Tài liệu                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Cài đặt hoặc gỡ lỗi dịch vụ CLI/Gateway     | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway)                                         |
| Giữ trạng thái ngoài các thư mục đồng bộ đám mây | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway#state-directory-on-macos)             |
| Gỡ lỗi khả năng khám phá và kết nối của ứng dụng | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway#debug-app-connectivity)               |
| Tìm hiểu hành vi của launchd                | [Vòng đời Gateway](/vi/platforms/mac/child-process)                                              |
| Khắc phục vấn đề về quyền hoặc ký mã/TCC    | [Quyền trên macOS](/vi/platforms/mac/permissions)                                                |
| Phát hiện máy Mac bạn sử dụng gần đây nhất  | [Sự hiện diện của máy tính đang hoạt động](/vi/nodes/presence)                                   |
| Kết nối với Gateway từ xa                   | [Điều khiển từ xa](/vi/platforms/mac/remote)                                                     |
| Xem trạng thái thanh menu và kiểm tra tình trạng | [Thanh menu](/vi/platforms/mac/menu-bar), [Kiểm tra tình trạng](/vi/platforms/mac/health)       |
| Sử dụng giao diện trò chuyện nhúng          | [WebChat](/vi/platforms/mac/webchat)                                                             |
| Sử dụng kích hoạt bằng giọng nói hoặc nhấn để nói | [Kích hoạt bằng giọng nói](/vi/platforms/mac/voicewake)                                     |
| Sử dụng Canvas và liên kết sâu Canvas       | [Canvas](/vi/platforms/mac/canvas)                                                               |
| Lưu trữ PeekabooBridge để tự động hóa giao diện | [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo)                                               |
| Cấu hình phê duyệt lệnh                     | [Phê duyệt thực thi](/vi/tools/exec-approvals), [chi tiết nâng cao](/vi/tools/exec-approvals-advanced) |
| Kiểm tra các lệnh nút Mac và IPC của ứng dụng | [IPC macOS](/vi/platforms/mac/xpc)                                                            |
| Thu thập nhật ký                            | [Ghi nhật ký macOS](/vi/platforms/mac/logging)                                                   |
| Dựng từ mã nguồn                            | [Thiết lập phát triển macOS](/vi/platforms/mac/dev-setup)                                        |

## Liên quan

- [Nền tảng](/vi/platforms)
- [Bắt đầu sử dụng](/vi/start/getting-started)
- [Gateway](/vi/gateway)
- [Phê duyệt thực thi](/vi/tools/exec-approvals)
