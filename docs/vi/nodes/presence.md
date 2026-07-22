---
read_when:
    - Bạn muốn OpenClaw xác định máy Mac đang hoạt động
    - Bạn đang gỡ lỗi hoạt động đầu vào gần nhất hoặc việc chọn Node đang hoạt động
    - Bạn muốn tìm hiểu cách định tuyến thông báo kết nối Node
summary: Phát hiện máy Mac bạn sử dụng gần đây nhất và định tuyến cảnh báo Node đến đó
title: Sự hiện diện của máy tính đang hoạt động
x-i18n:
    generated_at: "2026-07-22T02:14:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f1d1d0e98b1f3b7478cf80696dc693677b57897b07260cce30938e9187c314
    source_path: nodes/presence.md
    workflow: 16
---

Trạng thái hiện diện trên máy tính đang hoạt động cho Gateway biết node macOS được kết nối nào đã nhận
thao tác chuột hoặc bàn phím vật lý gần đây nhất. OpenClaw sử dụng tín hiệu đó để
đánh dấu một máy Mac là `active`, cung cấp cho agent một gợi ý ổn định về node đang hoạt động và định tuyến
cảnh báo kết nối node đến máy tính nơi bạn có nhiều khả năng đang hiện diện nhất.

Tính năng này tách biệt với [trạng thái hiện diện của hệ thống](/vi/concepts/presence), tức danh sách trực tiếp
các máy khách Gateway, và với các beacon `node.presence.alive` bền vững, vốn
ghi lại lần gần nhất một node di động thức dậy mà không coi node đó là đang kết nối.

## Yêu cầu

- Ứng dụng OpenClaw cho macOS đã được ghép đôi và kết nối ở chế độ node.
- **Settings -> Permissions -> Active computer detection** được bật. Tính năng này mặc định bị tắt.
- Quyền **Accessibility** được cấp cho ứng dụng OpenClaw đã ký.
- Đối với cảnh báo kết nối, quyền **Notifications** cũng được cấp và
  node Mac cung cấp `system.notify`.

Việc báo cáo hoạt động hiện được triển khai bởi node macOS gốc. Các máy chủ node
iOS, Android, watchOS và không giao diện có thể báo cáo trạng thái kết nối hoặc
lần xuất hiện gần nhất trong nền, nhưng chúng không cạnh tranh để được chỉ định là máy tính đang hoạt động.

## Kiểm tra máy tính đang hoạt động

1. Trong ứng dụng macOS, mở **Settings -> Permissions**, bật
   **Active computer detection** và cấp quyền **Accessibility** trong macOS System Settings.
2. Xác nhận node Mac đã kết nối:

   ```bash
   openclaw nodes status --connected
   ```

3. Di chuyển chuột hoặc nhấn một phím trên máy Mac đó, rồi chạy:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

Máy Mac đủ điều kiện có hoạt động mới nhất được đánh dấu `active`. Kết quả trạng thái hiển thị
thời gian kể từ lần nhập gần nhất; `describe` cung cấp `active`, `lastActiveAtMs` và `presenceUpdatedAtMs`.
Hoạt động được chủ ý gộp lại, vì vậy sau một báo cáo gần đây, màn hình có thể mất tới khoảng 15
giây để phản ánh một thao tác nhập khác.

## Cách hoạt động trở thành trạng thái hiện diện

Trình báo cáo macOS lấy mẫu đồng hồ thời gian không hoạt động của hệ thống HID mỗi hai giây. Trình này
báo cáo một lần khi kết nối node trở nên sẵn sàng, sau đó báo cáo hoạt động vật lý mới hơn
không quá một lần mỗi 15 giây. Khi không hoạt động, trình này gửi tín hiệu duy trì kết nối
mỗi ba phút. Thời lượng không hoạt động được giới hạn ở 30 ngày để một mẫu rất cũ
không thể trôi về phía trước và bị coi nhầm là máy tính mới nhất.

Việc tắt **Active computer detection** sẽ dừng lấy mẫu và gửi một sự kiện xóa đã xác thực
qua kết nối node hiện tại. Gateway ngay lập tức xóa
các dấu thời gian hoạt động được giữ lại của máy Mac đó và tính toán lại máy tính đang hoạt động;
các khả năng khác của node và công việc đang thực hiện vẫn được kết nối. Nếu Gateway đang kết nối
có từ trước thao tác xóa này, node Mac sẽ kết nối lại một lần để quá trình dọn dẹp khi ngắt kết nối
có thể xóa hoạt động được giữ lại.

Gateway chỉ chấp nhận hoạt động khi tất cả điều kiện sau đều đúng:

- sự kiện thuộc về kết nối đã xác thực hiện tại của id node đó;
- node có quyền `accessibility: true` có hiệu lực;
- payload chứa giá trị số nguyên `idleSeconds` nằm trong giới hạn.

Gateway trừ `idleSeconds` khỏi thời điểm quan sát của chính nó để suy ra
`lastActiveAtMs`. Gateway không bao giờ tin cậy dấu thời gian đồng hồ thực do node cung cấp. Trong số
các máy Mac đủ điều kiện đang kết nối, `lastActiveAtMs` mới nhất sẽ thắng; nếu bằng nhau, bản cập nhật
trạng thái hiện diện gần đây nhất sẽ được dùng.

Trạng thái hiện diện là cục bộ theo tiến trình và gắn với kết nối. Việc ngắt kết nối phiên
hiện tại, thay thế phiên đó bằng một phiên khác sử dụng cùng id node hoặc thu hồi
quyền Accessibility sẽ xóa trạng thái hoạt động của node đó và tính toán lại máy Mac đang hoạt động.

## Quyền riêng tư và ngữ cảnh mô hình

Chia sẻ hoạt động mặc định bị tắt và tách biệt với quyền Accessibility
được dùng cho tự động hóa giao diện người dùng. OpenClaw gửi thời lượng không hoạt động, không gửi nội dung nhập. OpenClaw không gửi giá trị phím,
tọa độ chuột, tên ứng dụng, tiêu đề cửa sổ hoặc sự kiện nhập thô. Trình
báo cáo macOS đọc trạng thái HID phần cứng, vì vậy các sự kiện điều khiển máy tính
tổng hợp không khiến một máy Mac tự động hóa có vẻ như là máy tính bạn đã sử dụng trực tiếp.

Hoạt động liên tục không tạo ra các sự kiện hệ thống dành cho mô hình. Dòng runtime
động chỉ chứa id node đã xác thực:

```text
active_node=<node-id>
```

Dấu thời gian chính xác và tên hiển thị do node kiểm soát không được đưa vào prompt để
tránh chèn prompt và biến động bộ nhớ đệm. Khi agent cần thông tin chi tiết hiện tại,
công cụ `nodes` có thể đọc `node.list` hoặc `node.describe` thay thế.

## Cách định tuyến cảnh báo kết nối

Sau khi một node hoàn tất lần bắt tay Gateway thành công đầu tiên sau khi được phê duyệt,
OpenClaw chờ 750 mili giây để máy Mac đang kết nối có thể gửi mẫu
hoạt động đầu tiên. Sau đó, OpenClaw thử máy Mac đang kết nối có khả năng thông báo và có
hoạt động mới nhất.

- Nếu việc gửi chính thành công, không máy Mac nào khác nhận được cảnh báo.
- Nếu không có máy Mac đang hoạt động hoặc việc gửi chính thất bại, OpenClaw chờ năm
  giây rồi thử mọi máy Mac đang kết nối còn lại có cung cấp `system.notify`.
- Các lần kết nối lại sau đó không phát cảnh báo. Gateway ghi lại kết nối thành công
  trong siêu dữ liệu ghép đôi, vì vậy việc khởi động lại Gateway không phát lại cảnh báo cho mọi
  node đã kết nối trước đó.

Cảnh báo được gắn với danh tính node đã xác thực. Một phiên thay thế của
cùng node sẽ tiếp quản cảnh báo kết nối lần đầu đang chờ xử lý; nếu node đó không còn
kết nối khi quá trình gửi diễn ra, cảnh báo sẽ bị hủy.

## Khắc phục sự cố

| Triệu chứng                                   | Kiểm tra                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Không có hàng nào được đánh dấu `active`                 | Xác nhận tính năng phát hiện máy tính đang hoạt động đã được bật, một node macOS gốc đang kết nối và `openclaw nodes describe --node <id>` hiển thị `permissions.accessibility: true`.   |
| Máy Mac không đúng vẫn ở trạng thái hoạt động              | Sử dụng trực tiếp máy Mac đó, chờ hết khoảng thời gian gộp, rồi chạy lại `openclaw nodes status`. Các thao tác điều khiển máy tính tổng hợp không được tính.                        |
| Dữ liệu lần nhập gần nhất biến mất                | Kiểm tra xem máy Mac có bị ngắt kết nối, phiên node của máy có bị thay thế hoặc quyền Accessibility có bị thu hồi hay không. Mỗi điều kiện đều chủ ý xóa hoạt động.                       |
| Cảnh báo xuất hiện trên nhiều máy Mac         | Việc gửi chính không khả dụng hoặc thất bại nên phương án dự phòng có trì hoãn đã chạy. Xác minh rằng máy Mac đang hoạt động đã kết nối, cho phép thông báo và cung cấp `system.notify`. |
| Agent không đề cập đến máy Mac đang hoạt động | Bắt đầu một lượt mới sau khi hoạt động thay đổi. Gợi ý runtime ổn định và ngắn gọn; sử dụng công cụ `nodes` để xem siêu dữ liệu hiện tại chính xác.                                    |

Để khôi phục TCC, hãy xem [quyền macOS](/vi/platforms/mac/permissions). Đối với lỗi
kết nối node và lệnh, hãy xem [Khắc phục sự cố Node](/vi/nodes/troubleshooting).

## Liên quan

- [Các node](/vi/nodes)
- [CLI của node](/vi/cli/nodes)
- [Trạng thái hiện diện của hệ thống](/vi/concepts/presence)
- [Giao thức Gateway](/vi/gateway/protocol#presence)
- [Ứng dụng macOS](/vi/platforms/macos)
