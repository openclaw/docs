---
read_when:
    - Thay đổi hành vi của biểu tượng trên thanh menu
summary: Trạng thái và hiệu ứng động của biểu tượng trên thanh menu cho OpenClaw trên macOS
title: Biểu tượng thanh menu
x-i18n:
    generated_at: "2026-07-16T15:27:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Trạng thái biểu tượng trên thanh menu

Phạm vi: ứng dụng macOS (`apps/macos`). Kết xuất: `CritterIconRenderer.makeIcon(...)`. Kết nối hoạt ảnh/trạng thái: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Trạng thái

| Trạng thái            | Điều kiện kích hoạt                       | Hiển thị                                                                                              |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Rảnh                  | Mặc định                                  | Hoạt ảnh chớp mắt/lắc lư bình thường; mắt mở vẫn có ánh lấp lánh bóng bẩy                           |
| Tạm dừng              | `isPaused=true`                        | Râu cụp xuống ("hết ca") với mắt mở; không chuyển động                                               |
| Đang ngủ              | Gateway bị ngắt kết nối/chưa được cấu hình | Râu cụp xuống và mắt nhắm lại thành mí `⌣ ⌣`; không chuyển động                         |
| Ăn mừng               | Đã gửi tin nhắn (`sendCelebrationTick`)      | Mắt lóe thành các cung `∩ ∩` vui vẻ trong ~0.9s, kèm một cú đá chân                     |
| Đánh thức bằng giọng nói (tai lớn) | Nghe thấy từ đánh thức       | Râu dựng thẳng và cao hơn (`earScale=1.9`); hạ xuống sau khi im lặng                             |
| Đang làm việc         | `isWorking=true` hoặc một `IconState` đang hoạt động | Chân lắc nhanh hơn (`legWiggle` lên đến `1.0`) kèm độ lệch ngang nhỏ; cộng thêm vào chuyển động lắc lư khi rảnh |

Huy hiệu hoạt động của công cụ (nút tròn SF Symbol, ví dụ `chevron.left.slash.chevron.right` cho thao tác thực thi) có thể hiển thị phía trên cùng biểu tượng sinh vật này khi một phiên có tác vụ hoặc công cụ đang hoạt động. Huy hiệu đó đến từ `IconState`/`ActivityKind`; xem [Thanh menu](/vi/platforms/mac/menu-bar) để biết mô hình trạng thái đầy đủ.

## Râu đánh thức bằng giọng nói

- Kích hoạt: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, được gọi từ quy trình thu nhận đánh thức bằng giọng nói (`VoiceWakeRuntime`) và từ công cụ gỡ lỗi/kiểm thử đánh thức bằng giọng nói (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Dừng: `stopVoiceEars()`, được gọi khi quá trình thu nhận hoàn tất.
- Khoảng im lặng trước khi hoàn tất: thông thường là `2.0s`, hoặc `5.0s` nếu chỉ nghe thấy từ kích hoạt và sau đó không có lời nói nào khác (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Trong khi được tăng cường, các bộ hẹn giờ chớp mắt/lắc lư/chân/râu khi rảnh sẽ bị tạm ngưng (`earBoostActive` kiểm soát tác vụ hoạt ảnh trong `CritterStatusLabel+Behavior`).

## Hình dạng và kích thước

- Khung vẽ: ảnh mẫu 18x18pt, được kết xuất vào bộ đệm bitmap 36x36px (2x) để biểu tượng luôn sắc nét trên màn hình Retina.
- Tỷ lệ râu mặc định là `1.0`; chế độ tăng cường bằng giọng nói đặt thành `earScale=1.9` mà không thay đổi toàn bộ khung.
- `antennaDroop` (0-1) gập râu xuống cho tư thế tạm dừng và đang ngủ.
- Chuyển động chân chạy nhanh sử dụng `legWiggle` lên đến `1.0`, kèm dao động ngang nhỏ.

## Ghi chú về hành vi

- Không có nút chuyển CLI/broker bên ngoài cho râu hoặc trạng thái đang làm việc; cả hai đều được điều khiển nội bộ bằng tín hiệu của ứng dụng (`AppState.setWorking`, `AppState.triggerVoiceEars`) để tránh chuyển đổi liên tục ngoài ý muốn.
- Giữ mọi TTL mới ở mức ngắn (thấp hơn nhiều so với 10s) để biểu tượng nhanh chóng trở về trạng thái cơ sở nếu một tác vụ bị treo.

## Liên quan

- [Thanh menu](/vi/platforms/mac/menu-bar)
- [Ứng dụng macOS](/vi/platforms/macos)
