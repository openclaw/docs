---
read_when:
    - Chẩn đoán kết nối kênh hoặc tình trạng hoạt động của Gateway
    - Tìm hiểu các lệnh và tùy chọn CLI kiểm tra tình trạng
summary: Các lệnh kiểm tra tình trạng và giám sát tình trạng Gateway
title: Kiểm tra tình trạng
x-i18n:
    generated_at: "2026-05-02T10:41:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

Hướng dẫn ngắn để xác minh kết nối kênh mà không phải phỏng đoán.

## Kiểm tra nhanh

- `openclaw status` — tóm tắt cục bộ: khả năng truy cập/chế độ Gateway, gợi ý cập nhật, tuổi xác thực kênh đã liên kết, phiên + hoạt động gần đây.
- `openclaw status --all` — chẩn đoán cục bộ đầy đủ (chỉ đọc, có màu, an toàn để dán khi gỡ lỗi).
- `openclaw status --deep` — yêu cầu Gateway đang chạy thực hiện phép dò sức khỏe trực tiếp (`health` với `probe:true`), bao gồm phép dò kênh theo từng tài khoản khi được hỗ trợ.
- `openclaw health` — yêu cầu Gateway đang chạy cung cấp ảnh chụp sức khỏe của nó (chỉ WS; không có socket kênh trực tiếp từ CLI).
- `openclaw health --verbose` — buộc thực hiện phép dò sức khỏe trực tiếp và in chi tiết kết nối Gateway.
- `openclaw health --json` — đầu ra ảnh chụp sức khỏe ở dạng máy đọc được.
- Gửi `/status` dưới dạng tin nhắn độc lập trong WhatsApp/WebChat để nhận phản hồi trạng thái mà không gọi agent.
- Nhật ký: tail `/tmp/openclaw/openclaw-*.log` và lọc theo `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Đối với Discord và các nhà cung cấp chat khác, các hàng phiên không phải là trạng thái sống của socket.
`openclaw sessions`, Gateway `sessions.list`, và công cụ `sessions_list` của agent
đọc trạng thái hội thoại đã lưu. Một nhà cung cấp có thể kết nối lại và hiển thị trạng thái kênh
khỏe mạnh trước khi bất kỳ hàng phiên mới nào được tạo. Hãy dùng trạng thái kênh và
các lệnh sức khỏe ở trên để kiểm tra kết nối trực tiếp.

## Chẩn đoán sâu

- Thông tin xác thực trên ổ đĩa: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime nên gần đây).
- Kho phiên: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (đường dẫn có thể được ghi đè trong cấu hình). Số lượng và người nhận gần đây được hiển thị qua `status`.
- Luồng liên kết lại: `openclaw channels logout && openclaw channels login --verbose` khi mã trạng thái 409–515 hoặc `loggedOut` xuất hiện trong nhật ký. (Lưu ý: luồng đăng nhập QR tự động khởi động lại một lần cho trạng thái 515 sau khi ghép nối.)
- Chẩn đoán được bật theo mặc định. Gateway ghi lại các dữ kiện vận hành trừ khi đặt `diagnostics.enabled: false`. Sự kiện bộ nhớ ghi lại số byte RSS/heap, áp lực ngưỡng và áp lực tăng trưởng. Cảnh báo trạng thái sống ghi lại độ trễ vòng lặp sự kiện, mức sử dụng vòng lặp sự kiện, tỷ lệ lõi CPU, và số lượng phiên đang hoạt động/đang chờ/đang xếp hàng khi tiến trình đang chạy nhưng bị quá tải. Sự kiện payload quá lớn ghi lại nội dung đã bị từ chối, cắt ngắn hoặc chia khúc, cùng kích thước và giới hạn khi có. Chúng không ghi lại văn bản tin nhắn, nội dung tệp đính kèm, thân webhook, thân yêu cầu hoặc phản hồi thô, token, cookie, hoặc giá trị bí mật. Cùng Heartbeat đó khởi động bộ ghi độ ổn định có giới hạn, có sẵn thông qua `openclaw gateway stability` hoặc RPC Gateway `diagnostics.stability`. Các lần thoát Gateway nghiêm trọng, hết thời gian chờ khi tắt, và lỗi khởi động lại sẽ lưu ảnh chụp bộ ghi mới nhất dưới `~/.openclaw/logs/stability/` khi có sự kiện; kiểm tra gói đã lưu mới nhất bằng `openclaw gateway stability --bundle latest`.
- Đối với báo cáo lỗi, chạy `openclaw gateway diagnostics export` và đính kèm tệp zip đã tạo. Bản xuất kết hợp tóm tắt Markdown, gói ổn định mới nhất, siêu dữ liệu nhật ký đã được làm sạch, ảnh chụp trạng thái/sức khỏe Gateway đã được làm sạch, và hình dạng cấu hình. Nó được thiết kế để chia sẻ: văn bản chat, thân webhook, đầu ra công cụ, thông tin xác thực, cookie, mã định danh tài khoản/tin nhắn, và giá trị bí mật được bỏ qua hoặc biên tập lại. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics).

## Cấu hình bộ giám sát sức khỏe

- `gateway.channelHealthCheckMinutes`: tần suất Gateway kiểm tra sức khỏe kênh. Mặc định: `5`. Đặt `0` để tắt khởi động lại bởi bộ giám sát sức khỏe trên toàn cục.
- `gateway.channelStaleEventThresholdMinutes`: khoảng thời gian một kênh đã kết nối có thể không hoạt động trước khi bộ giám sát sức khỏe xem nó là cũ và khởi động lại. Mặc định: `30`. Giữ giá trị này lớn hơn hoặc bằng `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: giới hạn trượt một giờ cho số lần khởi động lại bởi bộ giám sát sức khỏe trên mỗi kênh/tài khoản. Mặc định: `10`.
- `channels.<provider>.healthMonitor.enabled`: tắt khởi động lại bởi bộ giám sát sức khỏe cho một kênh cụ thể trong khi vẫn bật giám sát toàn cục.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: ghi đè đa tài khoản, ưu tiên hơn cài đặt cấp kênh.
- Các ghi đè theo kênh này áp dụng cho những bộ giám sát kênh tích hợp hiện đang cung cấp chúng: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, và WhatsApp.

## Khi có lỗi

- `logged out` hoặc trạng thái 409–515 → liên kết lại bằng `openclaw channels logout` rồi `openclaw channels login`.
- Không truy cập được Gateway → khởi động nó: `openclaw gateway --port 18789` (dùng `--force` nếu cổng đang bận).
- Không có tin nhắn đến → xác nhận điện thoại đã liên kết đang trực tuyến và người gửi được phép (`channels.whatsapp.allowFrom`); với chat nhóm, đảm bảo danh sách cho phép + quy tắc nhắc khớp (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Lệnh chuyên dụng "health"

`openclaw health` yêu cầu Gateway đang chạy cung cấp ảnh chụp sức khỏe của nó (không có socket kênh
trực tiếp từ CLI). Theo mặc định, lệnh có thể trả về ảnh chụp Gateway đã lưu trong bộ nhớ đệm còn mới; sau đó
Gateway làm mới bộ nhớ đệm đó trong nền. `openclaw health --verbose` buộc
thực hiện phép dò trực tiếp thay thế. Lệnh báo cáo thông tin xác thực đã liên kết/tuổi xác thực khi có,
tóm tắt phép dò theo từng kênh, tóm tắt kho phiên, và thời lượng phép dò. Lệnh thoát
khác 0 nếu không truy cập được Gateway hoặc phép dò thất bại/hết thời gian chờ.

Tùy chọn:

- `--json`: đầu ra JSON ở dạng máy đọc được
- `--timeout <ms>`: ghi đè thời gian chờ phép dò mặc định 10 giây
- `--verbose`: buộc thực hiện phép dò trực tiếp và in chi tiết kết nối Gateway
- `--debug`: bí danh của `--verbose`

Ảnh chụp sức khỏe bao gồm: `ok` (boolean), `ts` (dấu thời gian), `durationMs` (thời gian phép dò), trạng thái theo từng kênh, tính khả dụng của agent, và tóm tắt kho phiên.

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
