---
read_when:
    - Thay đổi hành vi của biểu tượng trên thanh menu
summary: Trạng thái và hoạt ảnh của biểu tượng thanh menu cho OpenClaw trên macOS
title: Biểu tượng thanh menu
x-i18n:
    generated_at: "2026-04-29T22:57:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Trạng thái biểu tượng thanh menu

Tác giả: steipete · Cập nhật: 2025-12-06 · Phạm vi: ứng dụng macOS (`apps/macos`)

- **Không hoạt động:** Hoạt ảnh biểu tượng bình thường (nháy mắt, thỉnh thoảng lắc nhẹ).
- **Tạm dừng:** Mục trạng thái dùng `appearsDisabled`; không có chuyển động.
- **Kích hoạt bằng giọng nói (tai lớn):** Bộ phát hiện đánh thức bằng giọng nói gọi `AppState.triggerVoiceEars(ttl: nil)` khi nghe thấy từ đánh thức, giữ `earBoostActive=true` trong khi lời nói được ghi nhận. Tai phóng to (1.9x), có các lỗ tai hình tròn để dễ nhận biết, rồi hạ xuống qua `stopVoiceEars()` sau 1 giây im lặng. Chỉ được kích hoạt từ pipeline giọng nói trong ứng dụng.
- **Đang làm việc (tác nhân đang chạy):** `AppState.isWorking=true` điều khiển một vi chuyển động “đuôi/chân chạy nhanh”: chân lắc nhanh hơn và lệch nhẹ khi công việc đang diễn ra. Hiện được bật/tắt quanh các lượt chạy tác nhân WebChat; thêm cùng kiểu bật/tắt quanh các tác vụ dài khác khi bạn nối chúng vào.

Điểm kết nối

- Đánh thức bằng giọng nói: runtime/tester gọi `AppState.triggerVoiceEars(ttl: nil)` khi kích hoạt và `stopVoiceEars()` sau 1 giây im lặng để khớp với cửa sổ ghi nhận.
- Hoạt động của tác nhân: đặt `AppStateStore.shared.setWorking(true/false)` quanh các khoảng công việc (đã làm trong lệnh gọi tác nhân WebChat). Giữ các khoảng này ngắn và đặt lại trong các khối `defer` để tránh hoạt ảnh bị kẹt.

Hình dạng & kích thước

- Biểu tượng cơ sở được vẽ trong `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Tỷ lệ tai mặc định là `1.0`; tăng cường bằng giọng nói đặt `earScale=1.9` và bật `earHoles=true` mà không thay đổi khung tổng thể (ảnh mẫu 18×18 pt được render vào backing store Retina 36×36 px).
- Chạy nhanh dùng độ lắc chân lên đến khoảng 1.0 với một chút rung ngang; nó được cộng thêm vào mọi độ lắc nhàn rỗi hiện có.

Ghi chú hành vi

- Không có công tắc CLI/broker bên ngoài cho tai/đang làm việc; giữ nội bộ theo các tín hiệu riêng của ứng dụng để tránh bật/tắt ngoài ý muốn.
- Giữ TTL ngắn (&lt;10 giây) để biểu tượng nhanh chóng trở về trạng thái cơ sở nếu một tác vụ bị treo.

## Liên quan

- [Thanh menu](/vi/platforms/mac/menu-bar)
- [Ứng dụng macOS](/vi/platforms/macos)
