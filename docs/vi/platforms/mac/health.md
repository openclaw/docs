---
read_when:
    - Gỡ lỗi các chỉ báo tình trạng của ứng dụng Mac
summary: Cách ứng dụng macOS báo cáo trạng thái sức khỏe của Gateway/kênh
title: Kiểm tra tình trạng (macOS)
x-i18n:
    generated_at: "2026-07-12T08:07:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# Kiểm tra tình trạng trên macOS

Cách đọc trạng thái tình trạng của kênh đã liên kết từ ứng dụng trên thanh menu.

## Thanh menu

Chấm trạng thái:

- Xanh lá: đã liên kết + phép kiểm tra hoạt động bình thường.
- Cam: đã liên kết nhưng phép kiểm tra kênh báo suy giảm/chưa kết nối.
- Đỏ: chưa liên kết.

Dòng phụ hiển thị "đã liên kết · xác thực 12 phút" hoặc cho biết nguyên nhân lỗi.
Mục "Chạy kiểm tra tình trạng ngay" trong menu sẽ kích hoạt một phép kiểm tra theo yêu cầu.

## Cài đặt

- Thẻ General hiển thị một thẻ Tình trạng: chấm trạng thái, dòng tóm tắt (trạng thái liên kết +
  thời gian xác thực) và một dòng chi tiết lỗi tùy chọn, cùng các nút **Thử lại ngay** và
  **Mở nhật ký**.
- **Thẻ Channels** hiển thị trạng thái và các điều khiển theo từng kênh (mã QR đăng nhập,
  đăng xuất, kiểm tra, lần ngắt kết nối/lỗi gần nhất) cho WhatsApp và Telegram.

## Cách phép kiểm tra hoạt động

Ứng dụng gọi RPC `health` của Gateway qua kết nối WebSocket hiện có
(không gọi ra trình bao CLI) khoảng 60 giây một lần và theo yêu cầu. RPC tải
thông tin xác thực và báo cáo trạng thái mà không gửi tin nhắn. Ứng dụng lưu đệm riêng
ảnh chụp nhanh hợp lệ gần nhất và lỗi gần nhất để giao diện người dùng tải tức thì và
không nhấp nháy khi ngoại tuyến.

## Khi không chắc chắn

Sử dụng quy trình CLI trong [Tình trạng Gateway](/vi/gateway/health) (`openclaw status`,
`openclaw status --deep`, `openclaw health --json`) và theo dõi
`/tmp/openclaw/openclaw-*.log`, lọc theo `web-heartbeat` / `web-reconnect`.

## Liên quan

- [Tình trạng Gateway](/vi/gateway/health)
- [Ứng dụng macOS](/vi/platforms/macos)
