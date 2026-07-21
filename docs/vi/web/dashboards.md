---
read_when:
    - Sử dụng hoặc giải thích bảng điều khiển phiên trong giao diện điều khiển
    - Quyết định những gì tác nhân có thể thực hiện trên bảng và những gì cần được người vận hành cấp quyền
summary: 'Bảng điều khiển phiên: các tiện ích, bảng, thẻ do agent tạo và khung chat được neo cố định'
title: Bảng điều khiển phiên làm việc
x-i18n:
    generated_at: "2026-07-21T13:44:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3babbc859e261aa959740ea778b44fdc1a07bce8ce7628cbabcfbc5fa207a0ce
    source_path: web/dashboards.md
    workflow: 16
---

Mỗi luồng trong Giao diện điều khiển đều có hai mặt: cuộc hội thoại quen thuộc và một
**bảng điều khiển** — lưới các tiện ích trực tiếp do tác nhân xây dựng cho bạn. Một luồng
không có tiện ích thì chỉ là cuộc trò chuyện. Ngay khi một tiện ích được ghim, nút chuyển đổi
**Trò chuyện | Bảng điều khiển** xuất hiện trong tiêu đề, và bảng điều khiển trở thành giao diện chính,
với cuộc trò chuyện được neo bên cạnh.

Không cần thiết lập hay cấu hình ứng dụng riêng: bảng điều khiển là một
tính năng cốt lõi, thuộc sở hữu của luồng, được lưu cùng tác nhân và vẫn tồn tại sau
`/new` và `/reset` (ngữ cảnh hội thoại bị xóa; bảng vẫn được giữ nguyên).

## Xây dựng bảng điều khiển bằng cách yêu cầu

Hãy yêu cầu tác nhân hiển thị nội dung bạn muốn xem:

> Tạo một tiện ích có tên revenue-graph: biểu đồ cột tương tác về doanh thu
> hằng tháng. Thêm các nút "Cột" và "Xu hướng" để chuyển đổi chế độ xem. Ghim tiện ích đó vào
> bảng điều khiển của tôi.

Trước tiên, tác nhân hiển thị tiện ích ngay trong cuộc trò chuyện để bạn có thể xem
trước khi tiện ích được đưa đến nơi khác. Từ đó:

- **Bạn tự ghim**: di chuột lên một tiện ích trong dòng và chọn **Ghim vào bảng điều khiển**.
- **Hoặc tác nhân ghim trực tiếp** khi bạn yêu cầu và cập nhật tiện ích sau đó theo
  tên — các tiện ích có tên ổn định, vì vậy "cập nhật revenue-graph bằng số liệu
  tháng Sáu" sẽ thay thế nội dung tại chỗ trong khi bảng vẫn giữ nguyên.

Tiện ích là những ứng dụng nhỏ độc lập (HTML/JS/SVG trong sandbox nghiêm ngặt). Các nút
và nút chuyển đổi chế độ xem bên trong tiện ích hoạt động ngay lập tức — việc chuyển đổi chế độ xem biểu đồ
không bao giờ cần đến tác nhân.

## Bảng

- **Lưới linh hoạt.** Kéo tiện ích bằng tay cầm; mọi thành phần sẽ tự động sắp xếp lại và
  thu gọn. Thay đổi kích thước bằng tay cầm hoặc chọn kích thước định sẵn (nhỏ,
  vừa, lớn, cực lớn) từ trình đơn tiện ích. Không ai phải định vị từng điểm ảnh —
  cả bạn lẫn tác nhân.
- **Thẻ.** Một bảng có thể có nhiều trang — chẳng hạn như một thẻ tổng quan và một
  thẻ tập trung với một tiện ích lớn. Mỗi thẻ ghi nhớ vị trí neo cuộc trò chuyện
  riêng.
- **Cuộc trò chuyện được neo.** Trên mặt bảng điều khiển, cuộc hội thoại được neo ở
  bên trái, bên phải hoặc phía dưới, có thể thay đổi kích thước như thanh bên và có thể được ẩn
  hoàn toàn — tác nhân vẫn nghe thấy bạn khi bạn đưa cuộc trò chuyện trở lại.
- **Khả năng tương đương của tác nhân.** Mọi thao tác bạn có thể thực hiện, tác nhân cũng có thể thực hiện bằng công cụ
  `dashboard`: thêm, cập nhật, di chuyển, thay đổi kích thước và xóa tiện ích, quản lý
  các thẻ, chuyển đổi thẻ hiển thị và di chuyển hoặc ẩn vùng neo cuộc trò chuyện. Hãy yêu cầu "đặt
  cuộc trò chuyện ở bên trái và hiển thị thẻ tài chính" rồi xem tác vụ được thực hiện.

## Những thao tác tiện ích được phép thực hiện

Tiện ích chỉ hiển thị nội dung thì không cần phê duyệt — tiện ích xuất hiện ngay lập tức, giống hệt
các tiện ích trong dòng của cuộc trò chuyện, và quyền truy cập mạng của tiện ích bị vô hiệu hóa hoàn toàn.

Các tiện ích muốn có **quyền tiếp cận** phải khai báo quyền đó và bạn cấp quyền một lần cho mỗi tiện ích
chỉ bằng một lần chạm:

- **Mạng** (`net`): truy xuất trực tiếp các nguồn HTTPS đã khai báo từ sandbox —
  chẳng hạn như thẻ thời tiết tự làm mới từ API.
- **Dữ liệu Gateway** (`data`): các nguồn cấp chỉ đọc như phiên, mức sử dụng hoặc trạng thái
  Cron, được Gateway phân giải — tiện ích không bao giờ nắm giữ token của bạn.
- **Tự động hóa** (`actions`): kích hoạt một tác vụ Cron cụ thể để một nút có thể chạy
  tác vụ thực (có thể sử dụng mô hình nhỏ hơn) mà không đánh thức cuộc hội thoại
  chính.
- **Câu lệnh** (`prompt`): gửi tin nhắn vào luồng mà không cần xác nhận cho mỗi lần nhấp
  như các tiện ích chưa được phê duyệt yêu cầu.

Các plugin đã bật có thể thêm nguồn cấp chỉ đọc và hành động có tên riêng vào những danh sách khả năng này; việc tắt plugin sẽ xóa các tích hợp đó.

Quyền cấp được ràng buộc với chính xác từng byte và bản sửa đổi của tiện ích mà bạn đã xem xét. Nếu
tác nhân thay đổi tiện ích và yêu cầu _nhiều quyền hơn_ mức bạn đã phê duyệt, tiện ích sẽ trở về trạng thái
chờ xử lý; việc làm mới nội dung trong phạm vi cùng quyền hạn vẫn giữ nguyên quyền cấp.
Các tương tác với tiện ích mà tác nhân cần biết (bộ lọc bạn đã nhấp, chế độ xem
bạn đã chuyển đổi) được gửi âm thầm đến tác nhân dưới dạng thông báo phiên — tác nhân luôn được cập nhật mà không
bị gián đoạn.

## Ứng dụng MCP trên bảng

Nếu Gateway của bạn đã cấu hình máy chủ MCP, các ứng dụng MCP tương tác xuất hiện
trong cuộc trò chuyện có thể được ghim như mọi tiện ích khác. Các ứng dụng đã ghim sẽ hoạt động trở lại trên
bảng với phiên mới; theo mặc định, chúng chỉ dùng để hiển thị, và việc cấp cho
tiện ích các công cụ máy chủ đã khai báo sẽ khiến tiện ích có đầy đủ khả năng tương tác — với cùng cơ chế
phê duyệt một lần chạm, ràng buộc theo bản sửa đổi như mọi thành phần khác.

## Những điều cần biết

- Việc đặt lại một luồng có bảng sẽ yêu cầu xác nhận và giữ nguyên
  bảng.
- Việc xóa một luồng sẽ xóa bảng của luồng đó.
- Các bảng nằm trên Gateway của bạn (trong cơ sở dữ liệu của tác nhân sở hữu) và xuất hiện trên
  mọi thiết bị mà bạn kết nối.
- Mô hình bảo mật, chi tiết lưu trữ và cơ sở lý luận thiết kế nằm trong
  [Kiến trúc bảng điều khiển](/vi/web/dashboard-architecture), bao gồm các đánh đổi
  của sandbox đã được ghi lại.
