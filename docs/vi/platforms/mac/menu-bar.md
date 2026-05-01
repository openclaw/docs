---
read_when:
    - Điều chỉnh giao diện menu Mac hoặc logic trạng thái
summary: Logic trạng thái trên thanh menu và những gì được hiển thị cho người dùng
title: Thanh trình đơn
x-i18n:
    generated_at: "2026-05-01T10:50:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Logic trạng thái thanh menu

## Nội dung được hiển thị

- Chúng tôi hiển thị trạng thái công việc hiện tại của agent trong biểu tượng thanh menu và trong hàng trạng thái đầu tiên của menu.
- Trạng thái sức khỏe bị ẩn khi có công việc đang hoạt động; nó quay lại khi tất cả phiên đều nhàn rỗi.
- Một menu con “Ngữ cảnh” ở gốc chứa các phiên gần đây thay vì mở rộng trực tiếp chúng trong menu gốc.
- Khối “Nodes” trong menu gốc chỉ liệt kê **thiết bị** (các node đã ghép đôi qua `node.list`), không phải các mục client/hiện diện.
- Một phần “Mức sử dụng” ở gốc xuất hiện bên dưới Ngữ cảnh khi có ảnh chụp nhanh mức sử dụng của nhà cung cấp, tiếp theo là chi tiết chi phí sử dụng khi có.

## Mô hình trạng thái

- Phiên: sự kiện đến với `runId` (theo từng lần chạy) cùng với `sessionKey` trong payload. Phiên “chính” là khóa `main`; nếu không có, chúng tôi quay về phiên được cập nhật gần đây nhất.
- Mức ưu tiên: main luôn thắng. Nếu main đang hoạt động, trạng thái của nó được hiển thị ngay. Nếu main nhàn rỗi, phiên không phải main hoạt động gần đây nhất sẽ được hiển thị. Chúng tôi không chuyển qua lại giữa chừng khi đang hoạt động; chúng tôi chỉ chuyển khi phiên hiện tại chuyển sang nhàn rỗi hoặc main trở nên hoạt động.
- Loại hoạt động:
  - `job`: thực thi lệnh cấp cao (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` với `toolName` và `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (ghi đè gỡ lỗi)

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- mặc định → 🛠️

### Ánh xạ trực quan

- `idle`: sinh vật bình thường.
- `workingMain`: huy hiệu có glyph, tông màu đầy đủ, hoạt ảnh chân “đang làm việc”.
- `workingOther`: huy hiệu có glyph, tông màu dịu, không chạy lăng xăng.
- `overridden`: dùng glyph/tông màu đã chọn bất kể hoạt động.

## Menu con Ngữ cảnh

- Menu gốc hiển thị một hàng “Ngữ cảnh” với số lượng/trạng thái phiên và mở một menu con.
- Tiêu đề menu con Ngữ cảnh hiển thị số phiên đang hoạt động trong 24 giờ qua.
- Mỗi hàng phiên giữ lại thanh token, tuổi, bản xem trước, trạng thái suy nghĩ/chi tiết, và các thao tác đặt lại, compact, xóa.
- Các thông báo đang tải, mất kết nối và lỗi tải phiên xuất hiện bên trong menu con Ngữ cảnh.
- Chi tiết mức sử dụng nhà cung cấp và chi phí sử dụng vẫn ở cấp gốc bên dưới Ngữ cảnh để vẫn có thể xem nhanh mà không cần mở menu con.

## Văn bản hàng trạng thái (menu)

- Khi công việc đang hoạt động: `<Session role> · <activity label>`
  - Ví dụ: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Khi nhàn rỗi: quay về tóm tắt sức khỏe.

## Nạp sự kiện

- Nguồn: sự kiện `agent` của control-channel (`ControlChannel.handleAgentEvent`).
- Trường đã phân tích:
  - `stream: "job"` với `data.state` để bắt đầu/dừng.
  - `stream: "tool"` với `data.phase`, `name`, `meta`/`args` tùy chọn.
- Nhãn:
  - `exec`: dòng đầu tiên của `args.command`.
  - `read`/`write`: đường dẫn rút gọn.
  - `edit`: đường dẫn cộng với loại thay đổi được suy luận từ `meta`/số lượng diff.
  - dự phòng: tên công cụ.

## Ghi đè gỡ lỗi

- Cài đặt ▸ Gỡ lỗi ▸ bộ chọn “Ghi đè biểu tượng”:
  - `System (auto)` (mặc định)
  - `Working: main` (theo loại công cụ)
  - `Working: other` (theo loại công cụ)
  - `Idle`
- Được lưu qua `@AppStorage("iconOverride")`; ánh xạ tới `IconState.overridden`.

## Danh sách kiểm thử

- Kích hoạt job phiên main: xác minh biểu tượng chuyển ngay lập tức và hàng trạng thái hiển thị nhãn main.
- Kích hoạt job phiên không phải main khi main nhàn rỗi: biểu tượng/trạng thái hiển thị phiên không phải main; giữ ổn định cho đến khi kết thúc.
- Bắt đầu main trong khi phiên khác đang hoạt động: biểu tượng chuyển sang main ngay lập tức.
- Các đợt công cụ dồn dập: đảm bảo huy hiệu không nhấp nháy (TTL gia hạn trên kết quả công cụ).
- Hàng sức khỏe xuất hiện lại khi tất cả phiên đều nhàn rỗi.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [Biểu tượng thanh menu](/vi/platforms/mac/icon)
