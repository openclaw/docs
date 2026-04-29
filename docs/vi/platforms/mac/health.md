---
read_when:
    - Gỡ lỗi các chỉ báo tình trạng của ứng dụng Mac
summary: Cách ứng dụng macOS báo cáo các trạng thái sức khỏe của Gateway/Baileys
title: Kiểm tra tình trạng hoạt động (macOS)
x-i18n:
    generated_at: "2026-04-29T22:56:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 16
---

# Kiểm tra tình trạng trên macOS

Cách xem kênh đã liên kết có hoạt động bình thường hay không từ ứng dụng thanh menu.

## Thanh menu

- Chấm trạng thái giờ phản ánh tình trạng Baileys:
  - Xanh lá: đã liên kết + socket được mở gần đây.
  - Cam: đang kết nối/đang thử lại.
  - Đỏ: đã đăng xuất hoặc probe thất bại.
- Dòng phụ hiển thị "đã liên kết · xác thực 12m" hoặc hiển thị lý do lỗi.
- Mục menu "Chạy kiểm tra tình trạng" kích hoạt probe theo yêu cầu.

## Cài đặt

- Tab Chung có thêm thẻ Tình trạng hiển thị: thời gian từ lần xác thực liên kết, đường dẫn/số lượng session-store, thời gian kiểm tra gần nhất, lỗi/mã trạng thái gần nhất, và các nút Chạy kiểm tra tình trạng / Hiển thị nhật ký.
- Dùng snapshot đã lưu trong cache để UI tải ngay lập tức và tự giảm cấp hợp lý khi ngoại tuyến.
- **Tab Kênh** hiển thị trạng thái kênh + điều khiển cho WhatsApp/Telegram (QR đăng nhập, đăng xuất, probe, lần ngắt kết nối/lỗi gần nhất).

## Cách probe hoạt động

- Ứng dụng chạy `openclaw health --json` qua `ShellExecutor` khoảng mỗi ~60 giây và theo yêu cầu. Probe tải thông tin xác thực và báo cáo trạng thái mà không gửi tin nhắn.
- Lưu cache riêng snapshot tốt gần nhất và lỗi gần nhất để tránh nhấp nháy; hiển thị dấu thời gian của từng mục.

## Khi không chắc chắn

- Bạn vẫn có thể dùng luồng CLI trong [tình trạng Gateway](/vi/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) và theo dõi đuôi `/tmp/openclaw/openclaw-*.log` để xem `web-heartbeat` / `web-reconnect`.

## Liên quan

- [Tình trạng Gateway](/vi/gateway/health)
- [Ứng dụng macOS](/vi/platforms/macos)
