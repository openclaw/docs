---
read_when:
    - Tinh chỉnh giao diện menu trên máy Mac hoặc logic trạng thái
summary: Logic trạng thái trên thanh menu và những thông tin được hiển thị cho người dùng
title: Thanh menu
x-i18n:
    generated_at: "2026-07-12T08:07:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Nội dung được hiển thị

- Trạng thái làm việc hiện tại của tác tử được hiển thị trên biểu tượng thanh menu và trong hàng trạng thái đầu tiên của menu.
- Trạng thái sức khỏe bị ẩn khi công việc đang hoạt động; trạng thái này xuất hiện trở lại sau khi tất cả phiên chuyển sang trạng thái rảnh.
- Mục "Ngữ cảnh" ở cấp gốc mở một menu con chứa các phiên gần đây thay vì mở rộng chúng trong menu gốc.
- Khối "Node" trong menu gốc chỉ liệt kê các **thiết bị** đã ghép đôi (từ `node.list`), không liệt kê các mục máy khách/hiện diện.
- Phần "Mức sử dụng" ở cấp gốc xuất hiện bên dưới Ngữ cảnh khi có bản chụp nhanh mức sử dụng của nhà cung cấp, tiếp theo là thông tin chi tiết về chi phí nếu có.

## Mô hình trạng thái

- Nguồn: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Các sự kiện đến dưới dạng `ControlAgentEvent` với một `runId`; trình xử lý (`ControlChannel.routeWorkActivity`) đọc `sessionKey` từ tải trọng sự kiện và mặc định là `"main"` nếu không có.
- Mức ưu tiên: phiên chính (theo mặc định là `sessionKey == "main"`) luôn được ưu tiên. Nếu phiên chính đang hoạt động, trạng thái của phiên đó được hiển thị ngay lập tức. Nếu phiên chính ở trạng thái rảnh, phiên không chính hoạt động gần đây nhất sẽ được hiển thị thay thế. Kho lưu trữ không chuyển đổi giữa chừng khi đang hoạt động; nó chỉ chuyển đổi khi phiên hiện tại chuyển sang trạng thái rảnh hoặc phiên chính bắt đầu hoạt động.
- Các loại hoạt động:
  - `job`: thực thi lệnh cấp cao (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` với `name`, `meta`/`args` tùy chọn.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (ghi đè gỡ lỗi)

### ActivityKind -> biểu tượng huy hiệu

`ActivityKind` bao bọc một `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) hoặc một `job` độc lập. Mỗi loại ánh xạ đến một biểu tượng SF Symbol được vẽ đè lên biểu tượng sinh vật (`IconState.badgeSymbolName`):

| Loại            | Biểu tượng                         |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Ánh xạ hình ảnh

- `idle`: sinh vật bình thường, không có huy hiệu.
- `workingMain`: huy hiệu có biểu tượng, sắc độ đầy đủ (độ nổi bật `.primary`), hoạt ảnh chân "đang làm việc".
- `workingOther`: huy hiệu có biểu tượng, sắc độ dịu (`.secondary` prominence), không có chuyển động chạy vụt.
- `overridden`: sử dụng biểu tượng/sắc độ đã chọn bất kể hoạt động thực tế.

## Menu con của ngữ cảnh

- Menu gốc hiển thị một hàng "Ngữ cảnh" cùng số lượng/trạng thái phiên; hàng này mở một menu con (`MenuSessionsInjector`).
- Tiêu đề menu con hiển thị số lượng phiên đang hoạt động trong 24 giờ qua.
- Mỗi hàng phiên vẫn giữ thanh token, thời gian đã trôi qua, bản xem trước, nút bật/tắt chế độ suy luận/chi tiết, cùng các thao tác đặt lại, thu gọn và xóa.
- Các thông báo đang tải, mất kết nối và lỗi tải phiên được hiển thị bên trong menu con Ngữ cảnh.
- Các phần mức sử dụng và chi phí vẫn nằm ở cấp gốc bên dưới Ngữ cảnh để có thể xem nhanh mà không cần mở menu con.

## Văn bản hàng trạng thái (menu)

- Khi công việc đang diễn ra: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` trong `MenuContentView`), trong đó nhãn vai trò là `Main` hoặc `Other`.
- Khi không hoạt động: quay về phần tóm tắt tình trạng.

## Tiếp nhận sự kiện

- Nguồn: các sự kiện `agent` của kênh điều khiển, được định tuyến bởi `ControlChannel.routeWorkActivity(from:)`.
- Các trường được phân tích:
  - `stream: "job"` với `data.state` để bắt đầu/dừng.
  - `stream: "tool"` với `data.phase`, `data.name`, cùng `data.meta`/`data.args` tùy chọn.
- Nhãn công cụ lấy từ `ToolDisplayRegistry.resolve(name:args:meta:)`; các tên không phân giải được sẽ dùng tên công cụ thô làm phương án dự phòng.

## Ghi đè khi gỡ lỗi

- Trình chọn Settings > Debug > "Icon override":
  - `System (auto)` (mặc định)
  - `Working: main` / `Working: other` (theo loại công cụ: bash, đọc, ghi, chỉnh sửa, khác)
  - `Idle`
- Được lưu trong khóa `UserDefaults` `openclaw.iconOverride`; ánh xạ tới `IconState.overridden`.

## Danh sách kiểm tra thử nghiệm

- Kích hoạt tác vụ phiên chính: biểu tượng chuyển đổi ngay lập tức và hàng trạng thái hiển thị nhãn chính.
- Kích hoạt tác vụ phiên không phải chính khi phiên chính đang rảnh: biểu tượng/trạng thái hiển thị phiên không phải chính; duy trì ổn định cho đến khi hoàn tất.
- Khởi chạy phiên chính khi một phiên khác đang hoạt động: biểu tượng chuyển sang phiên chính ngay lập tức.
- Các đợt gọi công cụ liên tiếp nhanh: huy hiệu không nhấp nháy (khoảng gia hạn 2 giây trước khi xóa công cụ đã hoàn tất, `WorkActivityStore.toolResultGrace`).
- Hàng trạng thái sức khỏe xuất hiện lại sau khi tất cả các phiên đều ở trạng thái rảnh.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Biểu tượng thanh menu](/vi/platforms/mac/icon)
