---
read_when:
    - Chẩn đoán khả năng kết nối kênh hoặc tình trạng của Gateway
    - Tìm hiểu các lệnh và tùy chọn CLI kiểm tra tình trạng hoạt động
summary: Các lệnh kiểm tra tình trạng và giám sát tình trạng Gateway
title: Kiểm tra tình trạng hoạt động
x-i18n:
    generated_at: "2026-07-20T04:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2aad0ffe968452e34158757c45e094c60528a4c6b5c57f9977bb6bc15ffd202e
    source_path: gateway/health.md
    workflow: 16
---

Hướng dẫn ngắn để xác minh khả năng kết nối của kênh mà không cần phỏng đoán.

## Kiểm tra nhanh

- `openclaw status` - bản tóm tắt cục bộ: khả năng truy cập/chế độ của Gateway, gợi ý cập nhật, thời gian kể từ lần xác thực kênh đã liên kết, các phiên + hoạt động gần đây.
- `openclaw status --all` - chẩn đoán cục bộ đầy đủ (chỉ đọc, có màu, an toàn để dán khi gỡ lỗi).
- `openclaw status --deep` - yêu cầu Gateway đang chạy thực hiện phép thăm dò trực tiếp (`health` với `probe:true`), bao gồm các phép thăm dò kênh theo từng tài khoản khi được hỗ trợ.
- `openclaw status --usage` - hiển thị ảnh chụp nhanh về mức sử dụng/hạn mức của nhà cung cấp mô hình.
- `openclaw health` - yêu cầu Gateway đang chạy cung cấp ảnh chụp nhanh tình trạng hoạt động (chỉ qua WS; CLI không mở socket kênh trực tiếp).
- `openclaw health --verbose` (bí danh `--debug`) - buộc thực hiện phép thăm dò tình trạng trực tiếp và in chi tiết kết nối Gateway.
- `openclaw health --json` - đầu ra ảnh chụp nhanh tình trạng hoạt động mà máy có thể đọc được.
- Gửi `/status` dưới dạng lệnh trò chuyện độc lập trong bất kỳ kênh nào để nhận phản hồi trạng thái mà không gọi agent.
- Nhật ký: theo dõi `/tmp/openclaw/openclaw-*.log` và lọc theo `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Đối với Discord và các nhà cung cấp trò chuyện khác, các hàng phiên không phản ánh socket còn hoạt động hay không.
`openclaw sessions`, `sessions.list` của Gateway và công cụ `sessions_list` của agent
đọc trạng thái cuộc trò chuyện đã lưu. Nhà cung cấp có thể kết nối lại và hiển thị trạng thái kênh
khỏe mạnh trước khi bất kỳ hàng phiên mới nào được tạo. Hãy dùng các lệnh trạng thái kênh và
tình trạng hoạt động ở trên để kiểm tra kết nối trực tiếp.

## Chẩn đoán chuyên sâu

- Thông tin xác thực trên đĩa: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime phải gần đây).
- Kho phiên: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Số lượng và người nhận gần đây được hiển thị qua `status`.
- Luồng liên kết lại: `openclaw channels logout && openclaw channels login --verbose` khi mã trạng thái 409-515 hoặc `loggedOut` xuất hiện trong nhật ký. Luồng đăng nhập bằng mã QR tự động khởi động lại một lần đối với trạng thái 515 sau khi ghép nối.
- Chẩn đoán được bật theo mặc định (`diagnostics.enabled: false` sẽ tắt chúng). Các sự kiện bộ nhớ ghi lại số byte RSS/heap và áp lực do vượt ngưỡng/tăng trưởng. Cảnh báo về khả năng hoạt động ghi lại độ trễ/mức sử dụng vòng lặp sự kiện, tỷ lệ lõi CPU và số phiên đang hoạt động/đang chờ/đã xếp hàng khi tiến trình vẫn chạy nhưng bị quá tải. Các sự kiện tải trọng quá lớn ghi lại nội dung nào bị từ chối/cắt bớt/chia nhỏ cùng với kích thước và giới hạn, tuyệt đối không ghi văn bản tin nhắn, nội dung tệp đính kèm, phần thân webhook, phần thân yêu cầu/phản hồi thô, token, cookie hoặc giá trị bí mật.
- Cùng một Heartbeat điều khiển bộ ghi độ ổn định có giới hạn: `openclaw gateway stability` (hoặc RPC Gateway `diagnostics.stability`). Các lần Gateway thoát do lỗi nghiêm trọng, hết thời gian chờ khi tắt và lỗi khởi động sau khi khởi động lại sẽ lưu ảnh chụp nhanh mới nhất tại `~/.openclaw/logs/stability/`. Kiểm tra gói mới nhất bằng `openclaw gateway stability --bundle latest`.
- Đối với báo cáo lỗi, hãy chạy `openclaw gateway diagnostics export` và đính kèm tệp zip được tạo: bản tóm tắt Markdown, gói độ ổn định mới nhất, siêu dữ liệu nhật ký đã làm sạch, ảnh chụp nhanh trạng thái/tình trạng hoạt động của Gateway đã làm sạch và cấu trúc cấu hình. Văn bản trò chuyện, phần thân webhook, đầu ra công cụ, thông tin xác thực, cookie, mã định danh tài khoản/tin nhắn và giá trị bí mật sẽ bị loại bỏ hoặc che đi. Xem [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics).

## Cấu hình trình giám sát tình trạng hoạt động

- `channels.<provider>.healthMonitor.enabled`: tắt việc khởi động lại bởi trình giám sát tình trạng hoạt động cho một kênh cụ thể trong khi vẫn bật giám sát toàn cục.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: giá trị ghi đè cho nhiều tài khoản, được ưu tiên hơn cài đặt cấp kênh.
- Các giá trị ghi đè theo kênh này áp dụng cho các kênh tích hợp sẵn hiện cung cấp chúng: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram và WhatsApp.

## Giám sát thời gian hoạt động

Các dịch vụ giám sát thời gian hoạt động bên ngoài phải sử dụng điểm cuối `/health` chuyên dụng, không phải `/v1/chat/completions`.

- **NÊN dùng:** `GET /health` - phản hồi tức thì, không tạo phiên, không gọi LLM, trả về `{"ok":true,"status":"live"}`
- **KHÔNG dùng:** `/v1/chat/completions` để kiểm tra tình trạng hoạt động - mỗi yêu cầu tạo một phiên agent đầy đủ với ảnh chụp nhanh kỹ năng, tổng hợp ngữ cảnh và các lệnh gọi LLM

Khi không cung cấp tiêu đề `x-openclaw-session-key` hoặc trường `user`, `/v1/chat/completions` tạo một phiên ngẫu nhiên mới cho mỗi yêu cầu. Các dịch vụ giám sát gửi yêu cầu thăm dò mỗi 15 phút sẽ tạo khoảng 96 phiên/ngày, mỗi phiên tiêu thụ 4-22KB. Theo thời gian, điều này làm kho phiên phình to và có thể dẫn đến tràn cửa sổ ngữ cảnh.

### Ví dụ thiết lập dịch vụ giám sát

- **BetterStack:** Đặt URL kiểm tra tình trạng hoạt động thành `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Thêm trình giám sát HTTP mới với URL `https://<your-gateway-host>:<port>/health`
- **Chung:** Mọi yêu cầu HTTP GET đến `/health` đều trả về 200 với `{"ok":true}` khi Gateway hoạt động bình thường

## Khi có lỗi

- `logged out` hoặc trạng thái 409-515 -> liên kết lại bằng `openclaw channels logout` rồi `openclaw channels login`.
- Không thể truy cập Gateway -> khởi động Gateway: `openclaw gateway --port 18789` (dùng `--force` nếu cổng đang bận).
- Không có tin nhắn đến -> xác nhận điện thoại đã liên kết đang trực tuyến và người gửi được phép (`channels.whatsapp.allowFrom`); đối với trò chuyện nhóm, hãy bảo đảm danh sách cho phép + quy tắc đề cập khớp nhau (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Lệnh "health" chuyên dụng

`openclaw health` yêu cầu Gateway đang chạy cung cấp ảnh chụp nhanh tình trạng hoạt động (CLI không mở
socket kênh trực tiếp). Theo mặc định, lệnh trả về ảnh chụp nhanh Gateway mới được lưu trong bộ nhớ đệm và
Gateway làm mới bộ nhớ đệm đó ở chế độ nền; `--verbose` sẽ buộc thực hiện phép thăm dò trực tiếp.
Lệnh báo cáo thời gian kể từ lần xác thực/thông tin xác thực được liên kết khi có, bản tóm tắt phép thăm dò theo từng kênh,
bản tóm tắt kho phiên và thời lượng thăm dò. Lệnh thoát với mã khác 0 nếu không thể
truy cập Gateway hoặc phép thăm dò thất bại/hết thời gian chờ.

Tùy chọn:

- `--json`: đầu ra JSON mà máy có thể đọc được
- `--timeout <ms>`: ghi đè thời gian chờ thăm dò mặc định là 10s
- `--verbose`: buộc thực hiện phép thăm dò trực tiếp và in chi tiết kết nối Gateway
- `--debug`: bí danh của `--verbose`

Ảnh chụp nhanh tình trạng hoạt động bao gồm: `ok` (boolean), `ts` (dấu thời gian), `durationMs` (thời gian thăm dò), trạng thái theo từng kênh, tính khả dụng của agent và bản tóm tắt kho phiên.

## Liên quan

- [Cẩm nang vận hành Gateway](/vi/gateway)
- [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
