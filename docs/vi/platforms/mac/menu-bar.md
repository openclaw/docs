---
read_when:
    - Tinh chỉnh giao diện menu macOS hoặc logic trạng thái
summary: Logic trạng thái thanh menu và nội dung hiển thị cho người dùng
title: Thanh menu
x-i18n:
    generated_at: "2026-07-19T05:50:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d53cd15109864b88010f41ccf4c46ea7fff6721bc6632630d83a558084cb2d62
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Nội dung hiển thị

- Trạng thái công việc hiện tại của agent được hiển thị trên biểu tượng thanh menu và trong hàng trạng thái đầu tiên của menu.
- Trạng thái sức khỏe bị ẩn khi công việc đang diễn ra; trạng thái này xuất hiện lại sau khi tất cả phiên đều ở trạng thái rảnh.
- Mục "Ngữ cảnh" ở cấp gốc mở một menu con chứa các phiên gần đây thay vì mở rộng chúng trong menu gốc.
- Khối "Node" trong menu gốc chỉ liệt kê các **thiết bị** đã ghép nối (từ `node.list`), không liệt kê các mục máy khách/hiện diện.
- Phần "Mức sử dụng" ở cấp gốc xuất hiện bên dưới Ngữ cảnh khi có ảnh chụp nhanh mức sử dụng của nhà cung cấp, tiếp theo là chi tiết chi phí khi có.
- **Trò chuyện nhanh** mở trình soạn thảo nổi của phiên chính; phím tắt toàn cục hiện tại được hiển thị bên cạnh mục này.

## Mô hình trạng thái

- Nguồn: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Các sự kiện đến dưới dạng `ControlAgentEvent` với một `runId`; trình xử lý (`ControlChannel.routeWorkActivity`) đọc `sessionKey` từ tải trọng sự kiện và mặc định là `"main"` nếu không có.
- Mức ưu tiên: phiên chính (mặc định là `sessionKey == "main"`) luôn được ưu tiên. Nếu phiên chính đang hoạt động, trạng thái của phiên này được hiển thị ngay lập tức. Nếu phiên chính đang rảnh, phiên không phải phiên chính hoạt động gần đây nhất sẽ được hiển thị thay thế. Kho lưu trữ không chuyển đổi giữa chừng khi đang hoạt động; nó chỉ chuyển khi phiên hiện tại chuyển sang trạng thái rảnh hoặc phiên chính bắt đầu hoạt động.
- Các loại hoạt động:
  - `job`: thực thi lệnh cấp cao (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` với `name`, `meta`/`args` tùy chọn.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (ghi đè gỡ lỗi)

### ActivityKind -> biểu tượng huy hiệu

`ActivityKind`bao bọc một `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) hoặc một `job` đơn thuần. Mỗi loại ánh xạ tới một huy hiệu SF Symbol được vẽ đè lên biểu tượng sinh vật (`IconState.badgeSymbolName`):

| Loại            | Biểu tượng                         |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Ánh xạ trực quan

- `idle`: sinh vật bình thường, không có huy hiệu.
- `workingMain`: huy hiệu có biểu tượng, sắc màu đầy đủ (độ nổi bật `.primary`), hoạt ảnh chân "đang làm việc".
- `workingOther`: huy hiệu có biểu tượng, sắc màu dịu (`.secondary` prominence), không có chuyển động chạy nhanh.
- `overridden`: sử dụng biểu tượng/sắc màu đã chọn bất kể hoạt động thực tế.

## Menu con Ngữ cảnh

- Menu gốc hiển thị một hàng "Ngữ cảnh" cùng số lượng/trạng thái phiên; hàng này mở một menu con (`MenuSessionsInjector`).
- Tiêu đề menu con hiển thị số phiên hoạt động trong 24 giờ qua.
- Mỗi hàng phiên giữ lại thanh token, thời gian đã trôi qua, bản xem trước, nút bật/tắt suy luận/chi tiết, cùng các thao tác đặt lại, thu gọn và xóa.
- Các thông báo đang tải, mất kết nối và lỗi tải phiên được hiển thị bên trong menu con Ngữ cảnh.
- Các phần mức sử dụng và chi phí vẫn nằm ở cấp gốc bên dưới Ngữ cảnh để có thể xem nhanh mà không cần mở menu con.

## Văn bản hàng trạng thái (menu)

- Khi công việc đang diễn ra: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` trong `MenuContentView`), trong đó nhãn vai trò là `Main` hoặc `Other`.
- Khi ở trạng thái rảnh: quay về phần tóm tắt sức khỏe.

## Tiếp nhận sự kiện

- Nguồn: các sự kiện `agent` của kênh điều khiển, được định tuyến bởi `ControlChannel.routeWorkActivity(from:)`.
- Các trường được phân tích:
  - `stream: "job"` với `data.state` để bắt đầu/dừng.
  - `stream: "tool"` với `data.phase`, `data.name`, cùng `data.meta`/`data.args` tùy chọn.
- Nhãn công cụ lấy từ `ToolDisplayRegistry.resolve(name:args:meta:)`; tên không phân giải được sẽ quay về tên công cụ thô.

## Ghi đè gỡ lỗi

- Settings > Debug > bộ chọn "Icon override":
  - `System (auto)` (mặc định)
  - `Working: main` / `Working: other` (theo loại công cụ: bash, đọc, ghi, chỉnh sửa, khác)
  - `Idle`
- Được lưu dưới khóa `openclaw.iconOverride` của `UserDefaults`; được ánh xạ tới `IconState.overridden`.

## Danh sách kiểm tra thử nghiệm

- Kích hoạt tác vụ phiên chính: biểu tượng chuyển đổi ngay lập tức và hàng trạng thái hiển thị nhãn chính.
- Kích hoạt tác vụ phiên không phải phiên chính khi phiên chính đang rảnh: biểu tượng/trạng thái hiển thị phiên không phải phiên chính và duy trì ổn định cho đến khi phiên đó hoàn tất.
- Khởi động phiên chính khi một phiên khác đang hoạt động: biểu tượng chuyển sang phiên chính ngay lập tức.
- Các đợt công cụ liên tiếp nhanh chóng: huy hiệu không nhấp nháy (khoảng đệm 2 giây trước khi xóa một công cụ đã hoàn tất, `WorkActivityStore.toolResultGrace`).
- Hàng sức khỏe xuất hiện lại sau khi tất cả phiên đều ở trạng thái rảnh.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Biểu tượng thanh menu](/vi/platforms/mac/icon)
