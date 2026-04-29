---
read_when:
    - Chẩn đoán khả năng kết nối kênh hoặc tình trạng Gateway
    - Hiểu các lệnh và tùy chọn CLI kiểm tra tình trạng
summary: Các lệnh kiểm tra tình trạng và giám sát tình trạng Gateway
title: Kiểm tra tình trạng
x-i18n:
    generated_at: "2026-04-29T22:43:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

Hướng dẫn ngắn để xác minh kết nối kênh mà không cần phỏng đoán.

## Kiểm tra nhanh

- `openclaw status` — tóm tắt cục bộ: khả năng truy cập/chế độ của Gateway, gợi ý cập nhật, tuổi xác thực kênh đã liên kết, phiên + hoạt động gần đây.
- `openclaw status --all` — chẩn đoán cục bộ đầy đủ (chỉ đọc, có màu, an toàn để dán khi gỡ lỗi).
- `openclaw status --deep` — yêu cầu Gateway đang chạy thực hiện thăm dò sức khỏe trực tiếp (`health` với `probe:true`), bao gồm thăm dò kênh theo từng tài khoản khi được hỗ trợ.
- `openclaw health` — yêu cầu Gateway đang chạy cung cấp ảnh chụp nhanh sức khỏe (chỉ WS; CLI không mở socket kênh trực tiếp).
- `openclaw health --verbose` — buộc thăm dò sức khỏe trực tiếp và in chi tiết kết nối Gateway.
- `openclaw health --json` — xuất ảnh chụp nhanh sức khỏe ở dạng máy đọc được.
- Gửi `/status` dưới dạng tin nhắn độc lập trong WhatsApp/WebChat để nhận phản hồi trạng thái mà không gọi agent.
- Nhật ký: tail `/tmp/openclaw/openclaw-*.log` và lọc theo `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Chẩn đoán sâu

- Thông tin đăng nhập trên đĩa: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime nên là gần đây).
- Kho phiên: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (đường dẫn có thể được ghi đè trong cấu hình). Số lượng và người nhận gần đây được hiển thị qua `status`.
- Luồng liên kết lại: `openclaw channels logout && openclaw channels login --verbose` khi mã trạng thái 409-515 hoặc `loggedOut` xuất hiện trong nhật ký. (Lưu ý: luồng đăng nhập QR tự động khởi động lại một lần cho trạng thái 515 sau khi ghép đôi.)
- Chẩn đoán được bật theo mặc định. Gateway ghi lại các dữ kiện vận hành trừ khi đặt `diagnostics.enabled: false`. Sự kiện bộ nhớ ghi lại số byte RSS/heap, áp lực ngưỡng và áp lực tăng trưởng. Cảnh báo độ sống ghi lại độ trễ event-loop, mức sử dụng event-loop, tỷ lệ CPU-core và số lượng phiên đang hoạt động/đang chờ/đang xếp hàng khi tiến trình đang chạy nhưng bị bão hòa. Sự kiện payload quá lớn ghi lại nội dung đã bị từ chối, cắt ngắn hoặc chia đoạn, cùng kích thước và giới hạn khi có. Chúng không ghi lại văn bản tin nhắn, nội dung tệp đính kèm, thân Webhook, thân yêu cầu hoặc phản hồi thô, token, cookie hoặc giá trị bí mật. Heartbeat tương tự khởi động bộ ghi ổn định có giới hạn, có sẵn qua `openclaw gateway stability` hoặc RPC Gateway `diagnostics.stability`. Các lần thoát Gateway nghiêm trọng, timeout khi tắt và lỗi khởi động lại sẽ lưu ảnh chụp nhanh mới nhất của bộ ghi dưới `~/.openclaw/logs/stability/` khi có sự kiện; kiểm tra gói đã lưu mới nhất bằng `openclaw gateway stability --bundle latest`.
- Với báo cáo lỗi, chạy `openclaw gateway diagnostics export` và đính kèm tệp zip được tạo. Bản xuất kết hợp bản tóm tắt Markdown, gói ổn định mới nhất, siêu dữ liệu nhật ký đã được làm sạch, ảnh chụp nhanh trạng thái/sức khỏe Gateway đã được làm sạch và hình dạng cấu hình. Nó được thiết kế để chia sẻ: văn bản chat, thân Webhook, đầu ra công cụ, thông tin đăng nhập, cookie, định danh tài khoản/tin nhắn và giá trị bí mật bị bỏ qua hoặc biên tập lại. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics).

## Cấu hình trình giám sát sức khỏe

- `gateway.channelHealthCheckMinutes`: tần suất Gateway kiểm tra sức khỏe kênh. Mặc định: `5`. Đặt `0` để tắt khởi động lại do trình giám sát sức khỏe trên toàn cục.
- `gateway.channelStaleEventThresholdMinutes`: khoảng thời gian một kênh đã kết nối có thể không hoạt động trước khi trình giám sát sức khỏe xem nó là cũ và khởi động lại. Mặc định: `30`. Giữ giá trị này lớn hơn hoặc bằng `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: giới hạn cuốn chiếu một giờ cho số lần khởi động lại do trình giám sát sức khỏe trên mỗi kênh/tài khoản. Mặc định: `10`.
- `channels.<provider>.healthMonitor.enabled`: tắt khởi động lại do trình giám sát sức khỏe cho một kênh cụ thể trong khi vẫn bật giám sát toàn cục.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: ghi đè đa tài khoản, ưu tiên hơn thiết lập cấp kênh.
- Các ghi đè theo kênh này áp dụng cho các trình giám sát kênh tích hợp hiện đang phơi bày chúng: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram và WhatsApp.

## Khi có lỗi

- `logged out` hoặc trạng thái 409-515 → liên kết lại bằng `openclaw channels logout` rồi `openclaw channels login`.
- Không truy cập được Gateway → khởi động nó: `openclaw gateway --port 18789` (dùng `--force` nếu cổng đang bận).
- Không có tin nhắn đến → xác nhận điện thoại đã liên kết đang trực tuyến và người gửi được cho phép (`channels.whatsapp.allowFrom`); với chat nhóm, đảm bảo allowlist + quy tắc nhắc tên khớp (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Lệnh "health" chuyên dụng

`openclaw health` yêu cầu Gateway đang chạy cung cấp ảnh chụp nhanh sức khỏe của nó (CLI không mở socket kênh
trực tiếp). Theo mặc định, lệnh có thể trả về ảnh chụp nhanh Gateway đã lưu trong cache còn mới; sau đó
Gateway làm mới cache đó trong nền. `openclaw health --verbose` buộc
thăm dò trực tiếp thay vào đó. Lệnh báo cáo thông tin đăng nhập đã liên kết/tuổi xác thực khi có,
tóm tắt thăm dò theo kênh, tóm tắt kho phiên và thời lượng thăm dò. Lệnh thoát
khác không nếu Gateway không truy cập được hoặc thăm dò thất bại/timeout.

Tùy chọn:

- `--json`: đầu ra JSON máy đọc được
- `--timeout <ms>`: ghi đè timeout thăm dò mặc định 10 giây
- `--verbose`: buộc thăm dò trực tiếp và in chi tiết kết nối Gateway
- `--debug`: bí danh cho `--verbose`

Ảnh chụp nhanh sức khỏe bao gồm: `ok` (boolean), `ts` (timestamp), `durationMs` (thời gian thăm dò), trạng thái theo kênh, mức sẵn sàng của agent và tóm tắt kho phiên.

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
