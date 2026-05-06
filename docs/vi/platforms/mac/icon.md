---
read_when:
    - Thay đổi hành vi của biểu tượng trên thanh menu
summary: Trạng thái và hoạt ảnh của biểu tượng trên thanh menu cho OpenClaw trên macOS
title: Biểu tượng thanh menu
x-i18n:
    generated_at: "2026-05-06T09:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Trạng thái biểu tượng thanh menu

Tác giả: steipete · Cập nhật: 2025-12-06 · Phạm vi: ứng dụng macOS (`apps/macos`)

- **Không hoạt động:** Hoạt ảnh biểu tượng bình thường (nháy mắt, thỉnh thoảng lắc nhẹ).
- **Tạm dừng:** Mục trạng thái dùng `appearsDisabled`; không có chuyển động.
- **Kích hoạt bằng giọng nói (tai lớn):** Bộ phát hiện đánh thức bằng giọng nói gọi `AppState.triggerVoiceEars(ttl: nil)` khi nghe thấy từ đánh thức, giữ `earBoostActive=true` trong khi câu nói đang được thu. Tai phóng to (1.9x), có lỗ tai hình tròn để dễ đọc, rồi hạ xuống qua `stopVoiceEars()` sau 1 giây im lặng. Chỉ được kích hoạt từ pipeline giọng nói trong ứng dụng.
- **Đang làm việc (tác tử đang chạy):** `AppState.isWorking=true` điều khiển một vi chuyển động "đuôi/chân chạy nhanh": chân lắc nhanh hơn và lệch nhẹ khi công việc đang diễn ra. Hiện được bật/tắt quanh các lượt chạy tác tử WebChat; hãy thêm cùng cách bật/tắt quanh các tác vụ dài khác khi bạn kết nối chúng.

Điểm nối

- Đánh thức bằng giọng nói: runtime/tester gọi `AppState.triggerVoiceEars(ttl: nil)` khi kích hoạt và `stopVoiceEars()` sau 1 giây im lặng để khớp với cửa sổ thu.
- Hoạt động của tác tử: đặt `AppStateStore.shared.setWorking(true/false)` quanh các khoảng công việc (đã làm trong lệnh gọi tác tử WebChat). Giữ các khoảng ngắn và đặt lại trong các khối `defer` để tránh hoạt ảnh bị kẹt.

Hình dạng và kích thước

- Biểu tượng cơ sở được vẽ trong `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Tỷ lệ tai mặc định là `1.0`; tăng cường giọng nói đặt `earScale=1.9` và bật/tắt `earHoles=true` mà không thay đổi khung tổng thể (ảnh mẫu 18×18 pt được kết xuất vào bộ đệm nền Retina 36×36 px).
- Chạy nhanh dùng độ lắc chân lên tới khoảng ~1.0 với độ rung ngang nhỏ; nó được cộng thêm vào mọi độ lắc không hoạt động hiện có.

Ghi chú hành vi

- Không có công tắc CLI/broker bên ngoài cho tai/đang làm việc; giữ nội bộ theo các tín hiệu riêng của ứng dụng để tránh dao động ngoài ý muốn.
- Giữ TTL ngắn (&lt;10 giây) để biểu tượng nhanh chóng trở về trạng thái cơ sở nếu một tác vụ bị treo.

## Liên quan

- [Thanh menu](/vi/platforms/mac/menu-bar)
- [Ứng dụng macOS](/vi/platforms/macos)
