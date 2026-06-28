---
read_when:
    - Tinh chỉnh giao diện menu Mac hoặc logic trạng thái
summary: Logic trạng thái của thanh menu và những gì được hiển thị cho người dùng
title: Thanh menu
x-i18n:
    generated_at: "2026-05-06T09:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Nội dung hiển thị

- Chúng tôi hiển thị trạng thái công việc hiện tại của tác tử trong biểu tượng trên thanh menu và ở hàng trạng thái đầu tiên của menu.
- Trạng thái sức khỏe bị ẩn khi có công việc đang hoạt động; trạng thái này quay lại khi tất cả phiên đều rảnh.
- Một menu con "Ngữ cảnh" ở gốc chứa các phiên gần đây thay vì mở rộng chúng trực tiếp trong menu gốc.
- Khối "Nodes" trong menu gốc chỉ liệt kê **thiết bị** (các Node đã ghép đôi qua `node.list`), không liệt kê mục máy khách/trạng thái hiện diện.
- Một phần "Mức sử dụng" ở gốc xuất hiện bên dưới Ngữ cảnh khi có ảnh chụp nhanh mức sử dụng của nhà cung cấp, theo sau là chi tiết chi phí sử dụng khi có.

## Mô hình trạng thái

- Phiên: sự kiện đến với `runId` (theo từng lượt chạy) cùng với `sessionKey` trong payload. Phiên "chính" là khóa `main`; nếu không có, chúng tôi dùng phiên được cập nhật gần đây nhất.
- Độ ưu tiên: phiên chính luôn thắng. Nếu phiên chính đang hoạt động, trạng thái của nó được hiển thị ngay. Nếu phiên chính rảnh, phiên không phải chính hoạt động gần đây nhất sẽ được hiển thị. Chúng tôi không đổi qua lại giữa lúc đang hoạt động; chỉ chuyển khi phiên hiện tại chuyển sang rảnh hoặc phiên chính trở nên hoạt động.
- Loại hoạt động:
  - `job`: thực thi lệnh cấp cao (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` với `toolName` và `meta/args`.

## enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (ghi đè gỡ lỗi)

### ActivityKind → ký hiệu

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- mặc định → 🛠️

### Ánh xạ trực quan

- `idle`: linh vật bình thường.
- `workingMain`: huy hiệu có ký hiệu, tô màu đầy đủ, hoạt ảnh chân "đang làm việc".
- `workingOther`: huy hiệu có ký hiệu, màu dịu, không chạy nhanh.
- `overridden`: dùng ký hiệu/màu đã chọn bất kể hoạt động.

## Menu con Ngữ cảnh

- Menu gốc hiển thị một hàng "Ngữ cảnh" với số lượng/trạng thái phiên và mở một menu con.
- Tiêu đề menu con Ngữ cảnh hiển thị số phiên hoạt động trong 24 giờ qua.
- Mỗi hàng phiên giữ lại thanh token, tuổi, bản xem trước, suy nghĩ/chi tiết, cùng các hành động đặt lại, nén và xóa.
- Thông báo đang tải, mất kết nối và lỗi tải phiên xuất hiện bên trong menu con Ngữ cảnh.
- Mức sử dụng của nhà cung cấp và chi tiết chi phí sử dụng vẫn ở cấp gốc bên dưới Ngữ cảnh để có thể xem nhanh mà không cần mở menu con.

## Văn bản hàng trạng thái (menu)

- Khi có công việc đang hoạt động: `<Session role> · <activity label>`
  - Ví dụ: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Khi rảnh: quay về tóm tắt sức khỏe.

## Nạp sự kiện

- Nguồn: sự kiện `agent` của control-channel (`ControlChannel.handleAgentEvent`).
- Các trường đã phân tích:
  - `stream: "job"` với `data.state` để bắt đầu/dừng.
  - `stream: "tool"` với `data.phase`, `name`, tùy chọn `meta`/`args`.
- Nhãn:
  - `exec`: dòng đầu tiên của `args.command`.
  - `read`/`write`: đường dẫn rút gọn.
  - `edit`: đường dẫn cùng loại thay đổi được suy luận từ `meta`/số lượng diff.
  - dự phòng: tên công cụ.

## Ghi đè gỡ lỗi

- Cài đặt ▸ Gỡ lỗi ▸ bộ chọn "Ghi đè biểu tượng":
  - `System (auto)` (mặc định)
  - `Working: main` (theo loại công cụ)
  - `Working: other` (theo loại công cụ)
  - `Idle`
- Được lưu qua `@AppStorage("iconOverride")`; ánh xạ tới `IconState.overridden`.

## Danh sách kiểm thử

- Kích hoạt tác vụ phiên chính: xác minh biểu tượng chuyển ngay lập tức và hàng trạng thái hiển thị nhãn chính.
- Kích hoạt tác vụ phiên không phải chính khi phiên chính đang rảnh: biểu tượng/trạng thái hiển thị phiên không phải chính; giữ ổn định cho đến khi phiên đó hoàn tất.
- Bắt đầu phiên chính khi phiên khác đang hoạt động: biểu tượng chuyển sang phiên chính ngay lập tức.
- Các đợt công cụ nhanh: đảm bảo huy hiệu không nhấp nháy (TTL gia hạn trên kết quả công cụ).
- Hàng sức khỏe xuất hiện lại khi tất cả phiên đều rảnh.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Biểu tượng thanh menu](/vi/platforms/mac/icon)
