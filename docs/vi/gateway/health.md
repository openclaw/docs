---
read_when:
    - Chẩn đoán kết nối kênh hoặc tình trạng Gateway
    - Hiểu các lệnh và tùy chọn CLI kiểm tra tình trạng
summary: Các lệnh kiểm tra tình trạng và giám sát tình trạng Gateway
title: Kiểm tra tình trạng
x-i18n:
    generated_at: "2026-06-27T17:29:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

Hướng dẫn ngắn để xác minh kết nối kênh mà không cần phỏng đoán.

## Kiểm tra nhanh

- `openclaw status` — tóm tắt cục bộ: khả năng truy cập/chế độ Gateway, gợi ý cập nhật, tuổi xác thực của kênh đã liên kết, phiên + hoạt động gần đây.
- `openclaw status --all` — chẩn đoán cục bộ đầy đủ (chỉ đọc, có màu, an toàn để dán khi gỡ lỗi).
- `openclaw status --deep` — yêu cầu Gateway đang chạy thực hiện phép dò sức khỏe trực tiếp (`health` với `probe:true`), bao gồm phép dò kênh theo từng tài khoản khi được hỗ trợ.
- `openclaw health` — yêu cầu Gateway đang chạy cung cấp ảnh chụp sức khỏe của nó (chỉ WS; CLI không mở socket kênh trực tiếp).
- `openclaw health --verbose` — buộc thực hiện phép dò sức khỏe trực tiếp và in chi tiết kết nối Gateway.
- `openclaw health --json` — xuất ảnh chụp sức khỏe ở dạng máy đọc được.
- Gửi `/status` như một tin nhắn độc lập trong WhatsApp/WebChat để nhận phản hồi trạng thái mà không gọi agent.
- Nhật ký: theo dõi `/tmp/openclaw/openclaw-*.log` và lọc theo `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

Đối với Discord và các nhà cung cấp trò chuyện khác, các hàng phiên không phải là trạng thái socket còn sống.
`openclaw sessions`, Gateway `sessions.list`, và công cụ `sessions_list` của agent
đọc trạng thái cuộc trò chuyện đã lưu. Một nhà cung cấp có thể kết nối lại và hiển thị trạng thái
kênh khỏe mạnh trước khi bất kỳ hàng phiên mới nào được tạo. Hãy dùng trạng thái kênh và
các lệnh sức khỏe ở trên để kiểm tra kết nối trực tiếp.

## Chẩn đoán sâu

- Thông tin xác thực trên đĩa: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime nên là gần đây).
- Kho phiên: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (đường dẫn có thể được ghi đè trong cấu hình). Số lượng và người nhận gần đây được hiển thị qua `status`.
- Luồng liên kết lại: `openclaw channels logout && openclaw channels login --verbose` khi mã trạng thái 409–515 hoặc `loggedOut` xuất hiện trong nhật ký. (Lưu ý: luồng đăng nhập QR tự động khởi động lại một lần cho trạng thái 515 sau khi ghép nối.)
- Chẩn đoán được bật theo mặc định. Gateway ghi lại các dữ kiện vận hành trừ khi đặt `diagnostics.enabled: false`. Sự kiện bộ nhớ ghi lại số byte RSS/heap, áp lực ngưỡng, và áp lực tăng trưởng. Áp lực bộ nhớ nghiêm trọng được ghi nhật ký thông qua bộ ghi nhật ký Gateway. Khi đặt `diagnostics.memoryPressureSnapshot: true`, áp lực bộ nhớ nghiêm trọng cũng ghi một gói ổn định trước OOM với thống kê heap V8, bộ đếm cgroup Linux khi có, số lượng tài nguyên đang hoạt động, và các tệp phiên/bản chép lời lớn nhất theo đường dẫn tương đối đã biên tập. Cảnh báo trạng thái còn sống ghi lại độ trễ vòng lặp sự kiện, mức sử dụng vòng lặp sự kiện, tỷ lệ lõi CPU, và số lượng phiên đang hoạt động/đang chờ/đang xếp hàng khi tiến trình đang chạy nhưng bị bão hòa. Sự kiện payload quá lớn ghi lại nội dung đã bị từ chối, cắt ngắn, hoặc chia khúc, cùng kích thước và giới hạn khi có. Chúng không ghi lại văn bản tin nhắn, nội dung tệp đính kèm, phần thân webhook, phần thân yêu cầu hoặc phản hồi thô, token, cookie, hoặc giá trị bí mật. Cùng Heartbeat đó khởi động bộ ghi ổn định có giới hạn, có thể truy cập qua `openclaw gateway stability` hoặc RPC Gateway `diagnostics.stability`. Các lần thoát Gateway nghiêm trọng, thời gian chờ tắt máy, và lỗi khởi động lại sẽ lưu ảnh chụp bộ ghi mới nhất dưới `~/.openclaw/logs/stability/` khi có sự kiện; áp lực bộ nhớ nghiêm trọng cũng làm vậy chỉ khi đặt `diagnostics.memoryPressureSnapshot: true`. Kiểm tra gói đã lưu mới nhất bằng `openclaw gateway stability --bundle latest`.
- Đối với báo cáo lỗi, chạy `openclaw gateway diagnostics export` và đính kèm tệp zip được tạo. Bản xuất kết hợp một tóm tắt Markdown, gói ổn định mới nhất, siêu dữ liệu nhật ký đã làm sạch, ảnh chụp trạng thái/sức khỏe Gateway đã làm sạch, và hình dạng cấu hình. Nó được thiết kế để chia sẻ: văn bản trò chuyện, phần thân webhook, đầu ra công cụ, thông tin xác thực, cookie, mã định danh tài khoản/tin nhắn, và giá trị bí mật sẽ bị bỏ qua hoặc biên tập. Xem [Xuất chẩn đoán](/vi/gateway/diagnostics).

## Cấu hình giám sát sức khỏe

- `gateway.channelHealthCheckMinutes`: tần suất Gateway kiểm tra sức khỏe kênh. Mặc định: `5`. Đặt `0` để tắt khởi động lại bởi bộ giám sát sức khỏe trên toàn cục.
- `gateway.channelStaleEventThresholdMinutes`: thời gian một kênh đã kết nối có thể ở trạng thái nhàn rỗi trước khi bộ giám sát sức khỏe xem nó là cũ và khởi động lại. Mặc định: `30`. Giữ giá trị này lớn hơn hoặc bằng `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: giới hạn trượt một giờ cho số lần khởi động lại bởi bộ giám sát sức khỏe trên mỗi kênh/tài khoản. Mặc định: `10`.
- `channels.<provider>.healthMonitor.enabled`: tắt khởi động lại bởi bộ giám sát sức khỏe cho một kênh cụ thể trong khi vẫn bật giám sát toàn cục.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: ghi đè đa tài khoản, ưu tiên hơn thiết lập cấp kênh.
- Các ghi đè theo kênh này áp dụng cho những bộ giám sát kênh tích hợp hiện đang hiển thị chúng: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, và WhatsApp.

## Giám sát thời gian hoạt động

Các dịch vụ giám sát thời gian hoạt động bên ngoài nên dùng endpoint chuyên dụng `/health`, không phải `/v1/chat/completions`.

- **NÊN dùng:** `GET /health` — phản hồi tức thì, không tạo phiên, không gọi LLM, trả về `{"ok":true,"status":"live"}`
- **KHÔNG nên dùng:** `/v1/chat/completions` để kiểm tra sức khỏe — mỗi yêu cầu tạo một phiên agent đầy đủ với ảnh chụp skill, lắp ráp ngữ cảnh, và các lệnh gọi LLM

Khi không cung cấp header `x-openclaw-session-key` hoặc trường `user`, `/v1/chat/completions` tạo một phiên ngẫu nhiên mới cho mỗi yêu cầu. Các dịch vụ giám sát ping mỗi 15 phút sẽ tạo khoảng 96 phiên/ngày, mỗi phiên tiêu thụ 4–22KB. Theo thời gian, điều này gây phình kho phiên và có thể dẫn đến tràn cửa sổ ngữ cảnh.

### Ví dụ thiết lập dịch vụ giám sát

- **BetterStack:** Đặt URL kiểm tra sức khỏe thành `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** Thêm một bộ giám sát HTTP mới với URL `https://<your-gateway-host>:<port>/health`
- **Chung:** Bất kỳ HTTP GET nào tới `/health` đều trả về 200 với `{"ok":true}` khi Gateway khỏe mạnh

## Khi có lỗi

- `logged out` hoặc trạng thái 409–515 → liên kết lại bằng `openclaw channels logout`, rồi `openclaw channels login`.
- Không truy cập được Gateway → khởi động nó: `openclaw gateway --port 18789` (dùng `--force` nếu cổng đang bận).
- Không có tin nhắn đến → xác nhận điện thoại đã liên kết đang trực tuyến và người gửi được cho phép (`channels.whatsapp.allowFrom`); đối với trò chuyện nhóm, đảm bảo quy tắc allowlist + nhắc đến khớp (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Lệnh "health" chuyên dụng

`openclaw health` yêu cầu Gateway đang chạy cung cấp ảnh chụp sức khỏe của nó (CLI không mở socket
kênh trực tiếp). Theo mặc định, lệnh có thể trả về một ảnh chụp Gateway đã lưu đệm còn mới; sau đó
Gateway làm mới bộ đệm đó trong nền. `openclaw health --verbose` buộc
thực hiện phép dò trực tiếp thay vào đó. Lệnh báo cáo thông tin xác thực đã liên kết/tuổi xác thực khi có,
tóm tắt phép dò theo từng kênh, tóm tắt kho phiên, và thời lượng phép dò. Lệnh thoát
khác 0 nếu không truy cập được Gateway hoặc phép dò thất bại/hết thời gian chờ.

Tùy chọn:

- `--json`: đầu ra JSON máy đọc được
- `--timeout <ms>`: ghi đè thời gian chờ phép dò mặc định 10 giây
- `--verbose`: buộc thực hiện phép dò trực tiếp và in chi tiết kết nối Gateway
- `--debug`: bí danh của `--verbose`

Ảnh chụp sức khỏe bao gồm: `ok` (boolean), `ts` (timestamp), `durationMs` (thời gian dò), trạng thái theo từng kênh, tính khả dụng của agent, và tóm tắt kho phiên.

## Liên quan

- [Runbook Gateway](/vi/gateway)
- [Xuất chẩn đoán](/vi/gateway/diagnostics)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
