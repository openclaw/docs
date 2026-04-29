---
read_when:
    - Tinh chỉnh giao diện menu Mac hoặc logic trạng thái
summary: Logic trạng thái thanh menu và những gì được hiển thị cho người dùng
title: Thanh menu
x-i18n:
    generated_at: "2026-04-29T22:57:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Logic Trạng Thái Thanh Menu

## Nội dung được hiển thị

- Chúng tôi hiển thị trạng thái công việc hiện tại của agent trong biểu tượng thanh menu và ở hàng trạng thái đầu tiên của menu.
- Trạng thái sức khỏe được ẩn khi công việc đang hoạt động; trạng thái này quay lại khi tất cả phiên ở trạng thái rảnh.
- Khối “Nodes” trong menu chỉ liệt kê **thiết bị** (các Node đã ghép đôi qua `node.list`), không liệt kê mục nhập client/presence.
- Một mục “Mức sử dụng” xuất hiện bên dưới Ngữ cảnh khi có ảnh chụp mức sử dụng của provider.

## Mô hình trạng thái

- Phiên: sự kiện đến với `runId` (theo từng lần chạy) cùng với `sessionKey` trong payload. Phiên “main” là khóa `main`; nếu không có, chúng tôi dùng phiên được cập nhật gần đây nhất.
- Độ ưu tiên: main luôn thắng. Nếu main đang hoạt động, trạng thái của nó được hiển thị ngay. Nếu main rảnh, phiên không phải main hoạt động gần đây nhất được hiển thị. Chúng tôi không đảo qua đảo lại giữa chừng khi đang hoạt động; chúng tôi chỉ chuyển khi phiên hiện tại trở nên rảnh hoặc main trở nên hoạt động.
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

### Ánh xạ hiển thị

- `idle`: linh vật bình thường.
- `workingMain`: huy hiệu có glyph, sắc thái đầy đủ, hoạt ảnh chân “đang làm việc”.
- `workingOther`: huy hiệu có glyph, sắc thái dịu, không chạy nhanh.
- `overridden`: dùng glyph/sắc thái đã chọn bất kể hoạt động.

## Văn bản hàng trạng thái (menu)

- Khi công việc đang hoạt động: `<Session role> · <activity label>`
  - Ví dụ: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Khi rảnh: quay về tóm tắt sức khỏe.

## Tiếp nhận sự kiện

- Nguồn: sự kiện `agent` của control-channel (`ControlChannel.handleAgentEvent`).
- Trường được phân tích:
  - `stream: "job"` với `data.state` để bắt đầu/dừng.
  - `stream: "tool"` với `data.phase`, `name`, `meta`/`args` tùy chọn.
- Nhãn:
  - `exec`: dòng đầu tiên của `args.command`.
  - `read`/`write`: đường dẫn rút gọn.
  - `edit`: đường dẫn cộng loại thay đổi được suy luận từ `meta`/số lượng diff.
  - dự phòng: tên công cụ.

## Ghi đè gỡ lỗi

- Cài đặt ▸ Gỡ lỗi ▸ bộ chọn “Ghi đè biểu tượng”:
  - `System (auto)` (mặc định)
  - `Working: main` (theo loại công cụ)
  - `Working: other` (theo loại công cụ)
  - `Idle`
- Được lưu qua `@AppStorage("iconOverride")`; ánh xạ tới `IconState.overridden`.

## Danh sách kiểm thử

- Kích hoạt job của phiên main: xác minh biểu tượng chuyển ngay và hàng trạng thái hiển thị nhãn main.
- Kích hoạt job của phiên không phải main khi main rảnh: biểu tượng/trạng thái hiển thị phiên không phải main; giữ ổn định cho đến khi hoàn tất.
- Khởi động main khi phiên khác đang hoạt động: biểu tượng chuyển sang main ngay lập tức.
- Các đợt công cụ dồn dập: bảo đảm huy hiệu không nhấp nháy (TTL gia hạn trên kết quả công cụ).
- Hàng sức khỏe xuất hiện lại khi tất cả phiên đều rảnh.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Biểu tượng thanh menu](/vi/platforms/mac/icon)
