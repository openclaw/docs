---
read_when:
    - Bạn muốn OpenClaw xác định máy Mac đang hoạt động
    - Bạn đang gỡ lỗi hoạt động đầu vào gần nhất hoặc việc lựa chọn Node đang hoạt động
    - Bạn muốn tìm hiểu cách định tuyến thông báo kết nối Node
summary: Phát hiện máy Mac bạn sử dụng gần đây nhất và định tuyến cảnh báo Node đến đó
title: Trạng thái hiện diện đang hoạt động của máy tính
x-i18n:
    generated_at: "2026-07-19T05:49:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c1d9ed66ed89580c51040026a7c054f76434446eb43a505fea79ee3412431771
    source_path: nodes/presence.md
    workflow: 16
---

Trạng thái hiện diện máy tính đang hoạt động cho Gateway biết Node macOS được kết nối nào đã nhận
thao tác vật lý bằng chuột hoặc bàn phím gần đây nhất. OpenClaw sử dụng tín hiệu đó để
đánh dấu một máy Mac là `active`, cung cấp cho tác nhân một gợi ý ổn định về Node đang hoạt động và định tuyến
cảnh báo kết nối Node đến máy tính nơi bạn có nhiều khả năng đang hiện diện nhất.

Khái niệm này tách biệt với [trạng thái hiện diện hệ thống](/vi/concepts/presence), tức danh sách trực tiếp
các máy khách Gateway, và với các beacon `node.presence.alive` bền vững, dùng để
ghi lại thời điểm một Node di động thức dậy gần nhất mà không coi Node đó là đang kết nối.

## Yêu cầu

- Ứng dụng OpenClaw cho macOS đã được ghép đôi và kết nối ở chế độ Node.
- Quyền **Accessibility** đã được cấp cho ứng dụng OpenClaw có chữ ký.
- Đối với cảnh báo kết nối, quyền **Notifications** cũng đã được cấp và
  Node Mac cung cấp `system.notify`.

Tính năng báo cáo hoạt động hiện được triển khai bởi Node macOS gốc. Các máy chủ Node
iOS, Android, watchOS và không giao diện có thể báo cáo trạng thái kết nối hoặc
lần xuất hiện gần nhất trong nền, nhưng chúng không cạnh tranh để được chỉ định là máy tính đang hoạt động.

## Kiểm tra máy tính đang hoạt động

1. Trong ứng dụng macOS, mở **Settings -> Permissions** và cấp quyền
   **Accessibility** trong phần Cài đặt hệ thống của macOS.
2. Xác nhận Node Mac đã kết nối:

   ```bash
   openclaw nodes status --connected
   ```

3. Di chuyển chuột hoặc nhấn một phím trên máy Mac đó, rồi chạy:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

Máy Mac đủ điều kiện có hoạt động mới nhất được đánh dấu `active`. Đầu ra trạng thái hiển thị khoảng thời gian
kể từ thao tác nhập gần nhất; `describe` cung cấp `active`, `lastActiveAtMs` và `presenceUpdatedAtMs`.
Hoạt động được chủ đích gộp lại, vì vậy màn hình có thể mất tối đa khoảng 15
giây để phản ánh một thao tác nhập khác sau báo cáo gần đây.

## Cách hoạt động trở thành trạng thái hiện diện

Trình báo cáo macOS lấy mẫu đồng hồ thời gian nhàn rỗi của hệ thống HID mỗi hai giây. Trình này
báo cáo một lần khi kết nối Node sẵn sàng, sau đó báo cáo hoạt động vật lý mới hơn
không quá một lần mỗi 15 giây. Khi ở trạng thái nhàn rỗi, trình này gửi tín hiệu duy trì kết nối
mỗi ba phút. Thời gian nhàn rỗi được giới hạn ở 30 ngày để một mẫu quá cũ
không thể trôi về phía trước và bị coi nhầm là máy tính mới nhất.

Gateway chỉ chấp nhận hoạt động khi tất cả các điều kiện sau đều đúng:

- sự kiện thuộc về kết nối hiện đã được xác thực cho id Node đó;
- Node có quyền `accessibility: true` hiệu lực;
- payload chứa giá trị số nguyên `idleSeconds` nằm trong giới hạn.

Gateway trừ `idleSeconds` khỏi thời điểm quan sát của chính nó để suy ra
`lastActiveAtMs`. Gateway không bao giờ tin tưởng dấu thời gian đồng hồ thực do Node cung cấp. Trong số
các máy Mac đủ điều kiện đang kết nối, `lastActiveAtMs` mới nhất sẽ thắng; nếu bằng nhau, hệ thống sử dụng lần
cập nhật trạng thái hiện diện gần nhất.

Trạng thái hiện diện mang tính cục bộ đối với tiến trình và gắn với kết nối. Việc ngắt kết nối phiên
hiện tại, thay thế phiên đó bằng một phiên khác sử dụng cùng id Node hoặc thu hồi
quyền Accessibility sẽ xóa trạng thái hoạt động của Node đó và tính toán lại máy Mac đang hoạt động.

## Quyền riêng tư và ngữ cảnh mô hình

OpenClaw gửi thời gian nhàn rỗi, không gửi nội dung nhập. OpenClaw không gửi giá trị phím,
tọa độ chuột, tên ứng dụng, tiêu đề cửa sổ hoặc sự kiện nhập thô. Trình
báo cáo macOS đọc trạng thái HID phần cứng, vì vậy các sự kiện điều khiển máy tính
tổng hợp không làm cho một máy Mac tự động có vẻ là máy tính mà bạn đã sử dụng trực tiếp.

Hoạt động liên tục không tạo ra các sự kiện hệ thống dành cho mô hình. Dòng
runtime động chỉ chứa id Node đã được xác thực:

```text
active_node=<node-id>
```

Dấu thời gian chính xác và tên hiển thị do Node kiểm soát không được đưa vào prompt để
tránh chèn prompt và biến động bộ nhớ đệm. Khi tác nhân cần thông tin chi tiết hiện tại,
công cụ `nodes` có thể đọc `node.list` hoặc `node.describe` thay thế.

## Cách định tuyến cảnh báo kết nối

Sau khi một Node hoàn tất lần bắt tay Gateway thành công đầu tiên sau khi được phê duyệt,
OpenClaw đợi 750 mili giây để máy Mac đang kết nối có thể gửi mẫu
hoạt động đầu tiên. Sau đó, OpenClaw thử máy Mac đang kết nối có khả năng gửi thông báo và có
hoạt động mới nhất.

- Nếu việc gửi chính thành công, không máy Mac nào khác nhận được cảnh báo.
- Nếu không có máy Mac đang hoạt động hoặc việc gửi chính thất bại, OpenClaw đợi năm
  giây rồi thử mọi máy Mac đang kết nối còn lại có cung cấp `system.notify`.
- Các lần kết nối lại sau đó không tạo thông báo. Gateway ghi lại kết nối thành công
  trong siêu dữ liệu ghép đôi, vì vậy việc khởi động lại Gateway không phát lại cảnh báo cho mọi
  Node đã kết nối trước đó.

Cảnh báo được gắn với danh tính Node đã xác thực. Một phiên thay thế cho
cùng Node sẽ tiếp quản cảnh báo kết nối lần đầu đang chờ xử lý của Node đó; nếu Node đó không
còn kết nối khi quá trình gửi diễn ra, cảnh báo sẽ bị hủy.

## Khắc phục sự cố

| Triệu chứng                                   | Kiểm tra                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Không có hàng nào được đánh dấu `active`                 | Xác nhận một Node macOS gốc đang kết nối và `openclaw nodes describe --node <id>` hiển thị `permissions.accessibility: true`.                                          |
| Máy Mac không đúng vẫn đang hoạt động              | Sử dụng trực tiếp máy Mac đó, đợi hết khoảng thời gian gộp, rồi chạy lại `openclaw nodes status`. Các thao tác điều khiển máy tính tổng hợp không được tính.                        |
| Dữ liệu thao tác nhập gần nhất biến mất                | Kiểm tra xem máy Mac có bị ngắt kết nối, phiên Node có bị thay thế hoặc quyền Accessibility có bị thu hồi hay không. Mỗi điều kiện đều chủ đích xóa hoạt động.                       |
| Cảnh báo xuất hiện trên nhiều máy Mac         | Việc gửi chính không khả dụng hoặc thất bại nên cơ chế dự phòng có trì hoãn đã chạy. Xác minh rằng máy Mac đang hoạt động đã kết nối, cho phép thông báo và cung cấp `system.notify`. |
| Tác nhân không đề cập đến máy Mac đang hoạt động | Bắt đầu một lượt mới sau khi hoạt động thay đổi. Gợi ý runtime ổn định và nhỏ gọn; sử dụng công cụ `nodes` để xem siêu dữ liệu hiện tại chính xác.                                    |

Để khôi phục TCC, hãy xem [quyền macOS](/vi/platforms/mac/permissions). Đối với lỗi
kết nối Node và lệnh, hãy xem [Khắc phục sự cố Node](/vi/nodes/troubleshooting).

## Liên quan

- [Node](/vi/nodes)
- [CLI Node](/vi/cli/nodes)
- [Trạng thái hiện diện hệ thống](/vi/concepts/presence)
- [Giao thức Gateway](/vi/gateway/protocol#presence)
- [Ứng dụng macOS](/vi/platforms/macos)
