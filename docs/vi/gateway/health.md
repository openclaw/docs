---
read_when:
    - Chẩn đoán khả năng kết nối kênh hoặc tình trạng của Gateway
    - Tìm hiểu các lệnh và tùy chọn CLI kiểm tra tình trạng hoạt động
summary: Các lệnh kiểm tra tình trạng và giám sát tình trạng Gateway
title: Kiểm tra tình trạng hoạt động
x-i18n:
    generated_at: "2026-07-16T14:25:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

Hướng dẫn ngắn để xác minh khả năng kết nối của kênh mà không cần phỏng đoán.

## Kiểm tra nhanh

- `openclaw status` - bản tóm tắt cục bộ: khả năng truy cập/chế độ của Gateway, gợi ý cập nhật, thời gian tồn tại của thông tin xác thực kênh đã liên kết, các phiên + hoạt động gần đây.
- `openclaw status --all` - chẩn đoán cục bộ đầy đủ (chỉ đọc, có màu, an toàn để dán khi gỡ lỗi).
- `openclaw status --deep` - yêu cầu Gateway đang chạy thực hiện phép dò trực tiếp (`health` với `probe:true`), bao gồm phép dò kênh theo từng tài khoản khi được hỗ trợ.
- `openclaw status --usage` - hiển thị ảnh chụp nhanh mức sử dụng/hạn ngạch của nhà cung cấp mô hình.
- `openclaw health` - yêu cầu Gateway đang chạy cung cấp ảnh chụp nhanh tình trạng hoạt động (chỉ WS; CLI không mở socket kênh trực tiếp).
- `openclaw health --verbose` (bí danh `--debug`) - buộc thực hiện phép dò tình trạng hoạt động trực tiếp và in chi tiết kết nối Gateway.
- `openclaw health --json` - đầu ra ảnh chụp nhanh tình trạng hoạt động có thể được máy đọc.
- Gửi `/status` dưới dạng lệnh trò chuyện độc lập trong bất kỳ kênh nào để nhận phản hồi trạng thái mà không gọi tác tử.
- Nhật ký: theo dõi phần cuối của `/tmp/openclaw/openclaw-*.log` và lọc theo `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Đối với Discord và các nhà cung cấp trò chuyện khác, các hàng phiên không biểu thị socket còn hoạt động.
`openclaw sessions`, `sessions.list` của Gateway và công cụ `sessions_list` của tác tử
đọc trạng thái cuộc trò chuyện đã lưu trữ. Một nhà cung cấp có thể kết nối lại và hiển thị trạng thái kênh
khỏe mạnh trước khi bất kỳ hàng phiên mới nào được tạo. Hãy dùng các lệnh trạng thái kênh và
tình trạng hoạt động ở trên để kiểm tra kết nối trực tiếp.

## Chẩn đoán chuyên sâu

- Thông tin xác thực trên đĩa: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime phải gần đây).
- Kho phiên: `ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Số lượng và những người nhận gần đây được hiển thị qua `status`.
- Quy trình liên kết lại: `openclaw channels logout && openclaw channels login --verbose` khi mã trạng thái 409-515 hoặc `loggedOut` xuất hiện trong nhật ký. Quy trình đăng nhập bằng mã QR tự động khởi động lại một lần khi gặp trạng thái 515 sau khi ghép đôi.
- Chẩn đoán được bật theo mặc định (`diagnostics.enabled: false` sẽ tắt tính năng này). Các sự kiện bộ nhớ ghi lại số byte RSS/heap và áp lực do ngưỡng/tăng trưởng; áp lực bộ nhớ nghiêm trọng được ghi qua trình ghi nhật ký của Gateway và khi `diagnostics.memoryPressureSnapshot: true` được thiết lập, hệ thống cũng ghi một gói ổn định trước OOM (số liệu thống kê heap V8, bộ đếm cgroup Linux khi có, số lượng tài nguyên đang hoạt động, các tệp phiên/bản chép lời lớn nhất theo đường dẫn tương đối đã che thông tin nhạy cảm). Cảnh báo về khả năng hoạt động ghi lại độ trễ/mức sử dụng vòng lặp sự kiện, tỷ lệ lõi CPU và số lượng phiên đang hoạt động/đang chờ/được xếp hàng khi tiến trình đang chạy nhưng bị quá tải. Các sự kiện tải trọng quá lớn ghi lại nội dung nào đã bị từ chối/cắt bớt/chia khối cùng kích thước và giới hạn, tuyệt đối không ghi văn bản tin nhắn, nội dung tệp đính kèm, phần thân Webhook, phần thân yêu cầu/phản hồi thô, token, cookie hoặc giá trị bí mật.
- Cùng một Heartbeat điều khiển trình ghi ổn định có giới hạn: `openclaw gateway stability` (hoặc RPC Gateway `diagnostics.stability`). Các lần Gateway thoát nghiêm trọng, hết thời gian chờ khi tắt, lỗi khởi động sau khi khởi động lại và (khi `diagnostics.memoryPressureSnapshot: true`) áp lực bộ nhớ nghiêm trọng sẽ lưu ảnh chụp nhanh mới nhất trong `~/.openclaw/logs/stability/`. Kiểm tra gói mới nhất bằng `openclaw gateway stability --bundle latest`.
- Đối với báo cáo lỗi, hãy chạy `openclaw gateway diagnostics export` và đính kèm tệp zip được tạo: bản tóm tắt Markdown, gói ổn định mới nhất, siêu dữ liệu nhật ký đã làm sạch, ảnh chụp nhanh trạng thái/tình trạng hoạt động của Gateway đã làm sạch và cấu trúc cấu hình. Văn bản trò chuyện, phần thân Webhook, đầu ra công cụ, thông tin xác thực, cookie, mã định danh tài khoản/tin nhắn và giá trị bí mật đều bị bỏ qua hoặc che thông tin nhạy cảm. Xem [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics).

## Cấu hình trình giám sát tình trạng hoạt động

- `gateway.channelHealthCheckMinutes`: tần suất Gateway kiểm tra tình trạng hoạt động của kênh. Mặc định: `5`. Đặt `0` để tắt việc khởi động lại do trình giám sát tình trạng hoạt động trên toàn hệ thống.
- `gateway.channelStaleEventThresholdMinutes`: khoảng thời gian một kênh đã kết nối có thể không hoạt động trước khi trình giám sát tình trạng hoạt động coi kênh là lỗi thời và khởi động lại. Mặc định: `30`. Giữ giá trị này lớn hơn hoặc bằng `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: giới hạn trượt trong một giờ đối với số lần khởi động lại do trình giám sát tình trạng hoạt động cho mỗi kênh/tài khoản. Mặc định: `10`.
- `channels.<provider>.healthMonitor.enabled`: tắt việc khởi động lại do trình giám sát tình trạng hoạt động cho một kênh cụ thể trong khi vẫn bật giám sát toàn cục.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: giá trị ghi đè cho nhiều tài khoản, được ưu tiên hơn thiết lập cấp kênh.
- Các giá trị ghi đè theo kênh này hiện áp dụng cho các kênh tích hợp sẵn có hỗ trợ chúng: Discord, Google Chat, iMessage, IRC, Microsoft Teams, Signal, Slack, Telegram và WhatsApp.

## Giám sát thời gian hoạt động

Các dịch vụ giám sát thời gian hoạt động bên ngoài nên dùng điểm cuối `/health` chuyên dụng, không dùng `/v1/chat/completions`.

- **NÊN dùng:** `GET /health` - phản hồi tức thì, không tạo phiên, không gọi LLM, trả về `{"ok":true,"status":"live"}`
- **KHÔNG dùng:** `/v1/chat/completions` để kiểm tra tình trạng hoạt động - mỗi yêu cầu tạo một phiên tác tử đầy đủ với ảnh chụp nhanh Skills, quá trình tập hợp ngữ cảnh và các lệnh gọi LLM

Khi không cung cấp tiêu đề `x-openclaw-session-key` hoặc trường `user`, `/v1/chat/completions` tạo một phiên ngẫu nhiên mới cho mỗi yêu cầu. Các dịch vụ giám sát gửi tín hiệu mỗi 15 phút sẽ tạo khoảng 96 phiên/ngày, mỗi phiên tiêu thụ 4-22KB. Theo thời gian, điều này làm kho phiên phình to và có thể dẫn đến tràn cửa sổ ngữ cảnh.

### Ví dụ thiết lập dịch vụ giám sát

- **BetterStack:** Đặt URL kiểm tra tình trạng hoạt động thành `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Thêm trình giám sát HTTP mới với URL `https://<your-gateway-host>:<port>/health`
- **Chung:** Mọi yêu cầu HTTP GET đến `/health` đều trả về 200 cùng `{"ok":true}` khi Gateway khỏe mạnh

## Khi xảy ra lỗi

- `logged out` hoặc trạng thái 409-515 -> liên kết lại bằng `openclaw channels logout`, sau đó `openclaw channels login`.
- Không thể truy cập Gateway -> khởi động Gateway: `openclaw gateway --port 18789` (dùng `--force` nếu cổng đang bận).
- Không có tin nhắn đến -> xác nhận điện thoại đã liên kết đang trực tuyến và người gửi được phép (`channels.whatsapp.allowFrom`); đối với trò chuyện nhóm, hãy bảo đảm danh sách cho phép + quy tắc đề cập khớp nhau (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Lệnh "health" chuyên dụng

`openclaw health` yêu cầu Gateway đang chạy cung cấp ảnh chụp nhanh tình trạng hoạt động (CLI không mở
socket kênh trực tiếp). Theo mặc định, lệnh trả về ảnh chụp nhanh Gateway mới được lưu trong bộ nhớ đệm và
Gateway làm mới bộ nhớ đệm đó trong nền; thay vào đó, `--verbose` buộc thực hiện phép dò trực tiếp.
Lệnh báo cáo thông tin xác thực đã liên kết/thời gian tồn tại của thông tin xác thực khi có, bản tóm tắt phép dò theo từng kênh,
bản tóm tắt kho phiên và thời lượng phép dò. Lệnh thoát với mã khác không nếu không thể
truy cập Gateway hoặc phép dò thất bại/hết thời gian chờ.

Tùy chọn:

- `--json`: đầu ra JSON có thể được máy đọc
- `--timeout <ms>`: ghi đè thời gian chờ phép dò mặc định là 10 giây
- `--verbose`: buộc thực hiện phép dò trực tiếp và in chi tiết kết nối Gateway
- `--debug`: bí danh của `--verbose`

Ảnh chụp nhanh tình trạng hoạt động bao gồm: `ok` (boolean), `ts` (dấu thời gian), `durationMs` (thời gian dò), trạng thái theo từng kênh, khả năng sẵn sàng của tác tử và bản tóm tắt kho phiên.

## Liên quan

- [Sổ tay vận hành Gateway](/vi/gateway)
- [Xuất dữ liệu chẩn đoán](/vi/gateway/diagnostics)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
