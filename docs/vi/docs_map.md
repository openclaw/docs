---
read_when: Finding which docs page covers a topic before reading the page
summary: Bản đồ tiêu đề được tạo cho các trang tài liệu OpenClaw
title: Bản đồ tài liệu
x-i18n:
    generated_at: "2026-07-04T15:23:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e180b7c652be24b73af51fecc5cf9a566184c1eff65ca0acdc0133bbc49c332
    source_path: docs_map.md
    workflow: 16
---

# Bản đồ tài liệu OpenClaw

Tệp này được tạo từ các tiêu đề trong `docs/**/*.md` và `docs/**/*.mdx` để giúp các tác nhân điều hướng cây tài liệu.
Không chỉnh sửa thủ công; hãy chạy `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Đường dẫn: /agent-runtime-architecture
- Tiêu đề:
  - H2: Bố cục runtime
  - H2: Ranh giới
  - H2: Manifest
  - H2: Lựa chọn runtime
  - H2: Liên quan

## announcements/bluebubbles-imessage.md

- Đường dẫn: /announcements/bluebubbles-imessage
- Tiêu đề:
  - H1: Gỡ bỏ BlueBubbles và đường dẫn imsg iMessage
  - H2: Những gì đã thay đổi
  - H2: Việc cần làm
  - H2: Ghi chú di chuyển
  - H2: Xem thêm

## auth-credential-semantics.md

- Đường dẫn: /auth-credential-semantics
- Tiêu đề:
  - H2: Mã lý do probe ổn định
  - H2: Thông tin xác thực token
  - H3: Quy tắc đủ điều kiện
  - H3: Quy tắc phân giải
  - H2: Khả năng di chuyển bản sao tác nhân
  - H2: Tuyến xác thực chỉ bằng cấu hình
  - H2: Lọc thứ tự xác thực tường minh
  - H2: Phân giải mục tiêu probe
  - H2: Phát hiện thông tin xác thực CLI bên ngoài
  - H2: Bộ bảo vệ chính sách OAuth SecretRef
  - H2: Nhắn tin tương thích với hệ cũ
  - H2: Liên quan

## automation/auth-monitoring.md

- Đường dẫn: /automation/auth-monitoring
- Tiêu đề:
  - H2: Liên quan

## automation/clawflow.md

- Đường dẫn: /automation/clawflow
- Tiêu đề:
  - H2: Liên quan

## automation/cron-jobs.md

- Đường dẫn: /automation/cron-jobs
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cách Cron hoạt động
  - H2: Loại lịch
  - H3: Ngày trong tháng và ngày trong tuần dùng logic OR
  - H2: Kiểu thực thi
  - H3: Payload lệnh
  - H3: Tùy chọn payload cho tác vụ cô lập
  - H2: Phân phối và đầu ra
  - H2: Ngôn ngữ đầu ra
  - H2: Ví dụ CLI
  - H2: Webhook
  - H3: Xác thực
  - H2: Tích hợp Gmail PubSub
  - H3: Thiết lập bằng trình hướng dẫn (khuyến nghị)
  - H3: Tự động khởi động Gateway
  - H3: Thiết lập thủ công một lần
  - H3: Ghi đè mô hình Gmail
  - H2: Quản lý tác vụ
  - H2: Cấu hình
  - H2: Khắc phục sự cố
  - H3: Thang lệnh
  - H2: Liên quan

## automation/cron-vs-heartbeat.md

- Đường dẫn: /automation/cron-vs-heartbeat
- Tiêu đề:
  - H2: Liên quan

## automation/gmail-pubsub.md

- Đường dẫn: /automation/gmail-pubsub
- Tiêu đề:
  - H2: Liên quan

## automation/hooks.md

- Đường dẫn: /automation/hooks
- Tiêu đề:
  - H2: Chọn bề mặt phù hợp
  - H2: Bắt đầu nhanh
  - H2: Loại sự kiện
  - H2: Viết hook
  - H3: Cấu trúc hook
  - H3: Định dạng HOOK.md
  - H3: Triển khai handler
  - H3: Điểm nổi bật trong ngữ cảnh sự kiện
  - H2: Phát hiện hook
  - H3: Gói hook
  - H2: Hook đi kèm
  - H3: Chi tiết về session-memory
  - H3: Cấu hình bootstrap-extra-files
  - H3: Chi tiết về command-logger
  - H3: Chi tiết về compaction-notifier
  - H3: Chi tiết về boot-md
  - H2: Hook Plugin
  - H2: Cấu hình
  - H2: Tham chiếu CLI
  - H2: Thực hành tốt nhất
  - H2: Khắc phục sự cố
  - H3: Không phát hiện được hook
  - H3: Hook không đủ điều kiện
  - H3: Hook không thực thi
  - H2: Liên quan

## automation/index.md

- Đường dẫn: /automation
- Tiêu đề:
  - H2: Hướng dẫn quyết định nhanh
  - H3: Tác vụ đã lên lịch (Cron) so với Heartbeat
  - H2: Khái niệm cốt lõi
  - H3: Tác vụ đã lên lịch (Cron)
  - H3: Tác vụ
  - H3: Cam kết được suy luận
  - H3: Luồng tác vụ
  - H3: Lệnh thường trực
  - H3: Hook
  - H3: Heartbeat
  - H2: Cách chúng hoạt động cùng nhau
  - H2: Liên quan

## automation/poll.md

- Đường dẫn: /automation/poll
- Tiêu đề:
  - H2: Liên quan

## automation/standing-orders.md

- Đường dẫn: /automation/standing-orders
- Tiêu đề:
  - H2: Vì sao dùng lệnh thường trực
  - H2: Cách chúng hoạt động
  - H2: Cấu trúc của một lệnh thường trực
  - H2: Lệnh thường trực cùng tác vụ Cron
  - H2: Ví dụ
  - H3: Ví dụ 1: nội dung và mạng xã hội (chu kỳ hằng tuần)
  - H3: Ví dụ 2: vận hành tài chính (kích hoạt theo sự kiện)
  - H3: Ví dụ 3: giám sát và cảnh báo (liên tục)
  - H2: Mẫu thực thi-xác minh-báo cáo
  - H2: Kiến trúc đa chương trình
  - H2: Thực hành tốt nhất
  - H3: Nên làm
  - H3: Tránh
  - H2: Liên quan

## automation/taskflow.md

- Đường dẫn: /automation/taskflow
- Tiêu đề:
  - H2: Khi nào dùng TaskFlow
  - H2: Mẫu workflow đã lên lịch đáng tin cậy
  - H2: Chế độ đồng bộ
  - H3: Chế độ được quản lý
  - H3: Chế độ phản chiếu
  - H2: Trạng thái bền vững và theo dõi bản sửa đổi
  - H2: Hành vi hủy
  - H2: Lệnh CLI
  - H2: Cách flow liên quan đến tác vụ
  - H2: Liên quan

## automation/tasks.md

- Đường dẫn: /automation/tasks
- Tiêu đề:
  - H2: Tóm tắt nhanh
  - H2: Bắt đầu nhanh
  - H2: Điều gì tạo ra một tác vụ
  - H2: Vòng đời tác vụ
  - H2: Phân phối và thông báo
  - H3: Chính sách thông báo
  - H2: Tham chiếu CLI
  - H2: Bảng tác vụ chat (/tasks)
  - H2: Tích hợp trạng thái (áp lực tác vụ)
  - H2: Lưu trữ và bảo trì
  - H3: Nơi tác vụ tồn tại
  - H3: Bảo trì tự động
  - H2: Cách tác vụ liên quan đến các hệ thống khác
  - H2: Liên quan

## automation/troubleshooting.md

- Đường dẫn: /automation/troubleshooting
- Tiêu đề:
  - H2: Liên quan

## automation/webhook.md

- Đường dẫn: /automation/webhook
- Tiêu đề:
  - H2: Liên quan

## brave-search.md

- Đường dẫn: /brave-search
- Tiêu đề:
  - H2: Liên quan

## channels/access-groups.md

- Đường dẫn: /channels/access-groups
- Tiêu đề:
  - H2: Nhóm người gửi tin nhắn tĩnh
  - H2: Tham chiếu nhóm từ danh sách cho phép
  - H2: Đường dẫn kênh tin nhắn được hỗ trợ
  - H2: Chẩn đoán Plugin
  - H2: Đối tượng kênh Discord
  - H2: Ghi chú bảo mật
  - H2: Khắc phục sự cố

## channels/ambient-room-events.md

- Đường dẫn: /channels/ambient-room-events
- Tiêu đề:
  - H2: Thiết lập khuyến nghị
  - H2: Những gì thay đổi
  - H2: Ví dụ Discord
  - H2: Ví dụ Slack
  - H2: Ví dụ Telegram
  - H2: Chính sách riêng cho tác nhân
  - H2: Chế độ trả lời hiển thị
  - H2: Lịch sử
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/bot-loop-protection.md

- Đường dẫn: /channels/bot-loop-protection
- Tiêu đề:
  - H1: Bảo vệ vòng lặp bot
  - H2: Mặc định
  - H2: Cấu hình mặc định dùng chung
  - H2: Ghi đè theo từng kênh hoặc tài khoản
  - H2: Hỗ trợ kênh

## channels/broadcast-groups.md

- Đường dẫn: /channels/broadcast-groups
- Tiêu đề:
  - H2: Tổng quan
  - H2: Trường hợp sử dụng
  - H2: Cấu hình
  - H3: Thiết lập cơ bản
  - H3: Chiến lược xử lý
  - H3: Ví dụ hoàn chỉnh
  - H2: Cách hoạt động
  - H3: Luồng tin nhắn
  - H3: Cô lập phiên
  - H3: Ví dụ: phiên cô lập
  - H2: Thực hành tốt nhất
  - H2: Tương thích
  - H3: Nhà cung cấp
  - H3: Định tuyến
  - H2: Khắc phục sự cố
  - H2: Ví dụ
  - H2: Tham chiếu API
  - H3: Schema cấu hình
  - H3: Trường
  - H2: Giới hạn
  - H2: Cải tiến trong tương lai
  - H2: Liên quan

## channels/channel-routing.md

- Đường dẫn: /channels/channel-routing
- Tiêu đề:
  - H1: Kênh &amp; định tuyến
  - H2: Thuật ngữ chính
  - H2: Tiền tố mục tiêu gửi đi
  - H2: Hình dạng khóa phiên (ví dụ)
  - H2: Ghim tuyến DM chính
  - H2: Ghi nhận đầu vào có bảo vệ
  - H2: Quy tắc định tuyến (cách chọn tác nhân)
  - H2: Nhóm phát sóng (chạy nhiều tác nhân)
  - H2: Tổng quan cấu hình
  - H2: Lưu trữ phiên
  - H2: Hành vi WebChat
  - H2: Ngữ cảnh trả lời
  - H2: Liên quan

## channels/clickclack.md

- Đường dẫn: /channels/clickclack
- Tiêu đề:
  - H2: Thiết lập nhanh
  - H2: Nhiều bot
  - H2: Mục tiêu
  - H2: Quyền
  - H2: Khắc phục sự cố

## channels/discord.md

- Đường dẫn: /channels/discord
- Tiêu đề:
  - H2: Thiết lập nhanh
  - H2: Khuyến nghị: thiết lập một không gian làm việc guild
  - H2: Mô hình runtime
  - H2: Kênh diễn đàn
  - H2: Thành phần tương tác
  - H2: Kiểm soát truy cập và định tuyến
  - H3: Định tuyến tác nhân theo vai trò
  - H2: Lệnh gốc và xác thực lệnh
  - H2: Chi tiết tính năng
  - H2: Công cụ và cổng hành động
  - H2: Giao diện Components v2
  - H2: Thoại
  - H3: Kênh thoại
  - H3: Theo dõi người dùng trong thoại
  - H3: Tin nhắn thoại
  - H2: Khắc phục sự cố
  - H2: Tham chiếu cấu hình
  - H2: An toàn và vận hành
  - H2: Liên quan

## channels/feishu.md

- Đường dẫn: /channels/feishu
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Kiểm soát truy cập
  - H3: Tin nhắn trực tiếp
  - H3: Chat nhóm
  - H2: Ví dụ cấu hình nhóm
  - H3: Cho phép tất cả nhóm, không cần @mention
  - H3: Cho phép tất cả nhóm, vẫn yêu cầu @mention
  - H3: Chỉ cho phép nhóm cụ thể
  - H3: Hạn chế người gửi trong một nhóm
  - H2: Lấy ID nhóm/người dùng
  - H3: ID nhóm (chatid, định dạng: ocxxx)
  - H3: ID người dùng (openid, định dạng: ouxxx)
  - H2: Lệnh phổ biến
  - H2: Khắc phục sự cố
  - H3: Bot không phản hồi trong chat nhóm
  - H3: Bot không nhận tin nhắn
  - H3: Thiết lập QR không phản ứng trong ứng dụng di động Feishu
  - H3: App Secret bị lộ
  - H2: Cấu hình nâng cao
  - H3: Nhiều tài khoản
  - H3: Giới hạn tin nhắn
  - H3: Streaming
  - H3: Tối ưu hóa quota
  - H3: Phiên ACP
  - H4: Liên kết ACP bền vững
  - H4: Tạo ACP từ chat
  - H3: Định tuyến đa tác nhân
  - H2: Cô lập tác nhân theo người dùng (Tạo tác nhân động)
  - H3: Thiết lập nhanh
  - H3: Cách hoạt động
  - H3: Tùy chọn cấu hình
  - H3: Phạm vi phiên
  - H3: Triển khai nhiều người dùng điển hình
  - H3: Xác minh
  - H3: Ghi chú
  - H2: Tham chiếu cấu hình
  - H2: Loại tin nhắn được hỗ trợ
  - H3: Nhận
  - H3: Gửi
  - H3: Thread và trả lời
  - H2: Liên quan

## channels/googlechat.md

- Đường dẫn: /channels/googlechat
- Tiêu đề:
  - H2: Cài đặt
  - H2: Thiết lập nhanh (người mới bắt đầu)
  - H2: Thêm vào Google Chat
  - H2: URL công khai (chỉ Webhook)
  - H3: Tùy chọn A: Tailscale Funnel (Khuyến nghị)
  - H3: Tùy chọn B: Reverse Proxy (Caddy)
  - H3: Tùy chọn C: Cloudflare Tunnel
  - H2: Cách hoạt động
  - H2: Mục tiêu
  - H2: Điểm nổi bật cấu hình
  - H2: Khắc phục sự cố
  - H3: 405 Method Not Allowed
  - H3: Vấn đề khác
  - H2: Liên quan

## channels/group-messages.md

- Đường dẫn: /channels/group-messages
- Tiêu đề:
  - H2: Hành vi
  - H2: Ví dụ cấu hình (WhatsApp)
  - H3: Lệnh kích hoạt (chỉ chủ sở hữu)
  - H2: Cách sử dụng
  - H2: Kiểm thử / xác minh
  - H2: Lưu ý đã biết
  - H2: Liên quan

## channels/groups.md

- Đường dẫn: /channels/groups
- Tiêu đề:
  - H2: Giới thiệu cho người mới bắt đầu (2 phút)
  - H2: Trả lời hiển thị
  - H2: Khả năng hiển thị ngữ cảnh và danh sách cho phép
  - H2: Khóa phiên
  - H2: Mẫu: DM cá nhân + nhóm công khai (một tác nhân)
  - H2: Nhãn hiển thị
  - H2: Chính sách nhóm
  - H2: Cổng mention (mặc định)
  - H2: Mẫu mention theo phạm vi đã cấu hình
  - H2: Hạn chế công cụ theo nhóm/kênh (tùy chọn)
  - H2: Danh sách cho phép nhóm
  - H2: Kích hoạt (chỉ chủ sở hữu)
  - H2: Trường ngữ cảnh
  - H2: Chi tiết riêng của iMessage
  - H2: System prompt WhatsApp
  - H2: Chi tiết riêng của WhatsApp
  - H2: Liên quan

## channels/imessage-from-bluebubbles.md

- Đường dẫn: /channels/imessage-from-bluebubbles
- Tiêu đề:
  - H2: Danh sách kiểm tra di chuyển
  - H2: Khi nào việc di chuyển này phù hợp
  - H2: imsg làm gì
  - H2: Trước khi bắt đầu
  - H2: Chuyển đổi cấu hình
  - H2: Điểm dễ vấp của sổ đăng ký nhóm
  - H2: Từng bước
  - H2: Tổng quan tương đương hành động
  - H2: Ghép cặp, phiên và liên kết ACP
  - H2: Không có kênh rollback
  - H2: Liên quan

## channels/imessage.md

- Đường dẫn: /channels/imessage
- Tiêu đề:
  - H2: Thiết lập nhanh
  - H2: Yêu cầu và quyền (macOS)
  - H2: Bật API riêng tư imsg
  - H3: Thiết lập
  - H3: Khi bạn không thể tắt SIP
  - H2: Kiểm soát truy cập và định tuyến
  - H2: Liên kết cuộc hội thoại ACP
  - H2: Mẫu triển khai
  - H2: Phương tiện, chia đoạn và mục tiêu phân phối
  - H2: Hành động API riêng tư
  - H2: Ghi cấu hình
  - H2: Gộp DM gửi tách (lệnh + URL trong một lần soạn)
  - H3: Kịch bản và những gì tác nhân thấy
  - H2: Khôi phục đầu vào sau khi bridge hoặc Gateway khởi động lại
  - H3: Tín hiệu hiển thị với người vận hành
  - H3: Di chuyển
  - H2: Khắc phục sự cố
  - H2: Con trỏ tham chiếu cấu hình
  - H2: Liên quan

## channels/index.md

- Đường dẫn: /channels
- Tiêu đề:
  - H2: Ghi chú phân phối
  - H2: Kênh được hỗ trợ
  - H2: Ghi chú

## channels/irc.md

- Đường dẫn: /channels/irc
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Mặc định bảo mật
  - H2: Kiểm soát truy cập
  - H3: Lỗi thường gặp: allowFrom dành cho DM, không phải kênh
  - H2: Kích hoạt trả lời (mention)
  - H2: Ghi chú bảo mật (khuyến nghị cho kênh công khai)
  - H3: Cùng công cụ cho mọi người trong kênh
  - H3: Công cụ khác nhau theo người gửi (chủ sở hữu có nhiều quyền hơn)
  - H2: NickServ
  - H2: Biến môi trường
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/line.md

- Đường dẫn: /channels/line
- Tiêu đề:
  - H2: Cài đặt
  - H2: Thiết lập
  - H2: Cấu hình
  - H2: Kiểm soát truy cập
  - H2: Hành vi tin nhắn
  - H2: Dữ liệu kênh (tin nhắn phong phú)
  - H2: Hỗ trợ ACP
  - H2: Phương tiện gửi đi
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/location.md

- Đường dẫn: /channels/location
- Tiêu đề:
  - H2: Định dạng văn bản
  - H2: Trường ngữ cảnh
  - H2: Ghi chú về kênh
  - H2: Liên quan

## channels/matrix-migration.md

- Đường dẫn: /channels/matrix-migration
- Tiêu đề:
  - H2: Những gì quá trình di chuyển tự động thực hiện
  - H2: Những gì quá trình di chuyển không thể tự động thực hiện
  - H2: Luồng nâng cấp được khuyến nghị
  - H2: Cách di chuyển được mã hóa hoạt động
  - H2: Các thông báo thường gặp và ý nghĩa của chúng
  - H3: Thông báo nâng cấp và phát hiện
  - H3: Thông báo khôi phục trạng thái mã hóa
  - H3: Thông báo khôi phục thủ công
  - H3: Thông báo cài đặt Plugin tùy chỉnh
  - H2: Nếu lịch sử đã mã hóa vẫn không quay lại
  - H2: Nếu bạn muốn bắt đầu mới cho các tin nhắn trong tương lai
  - H2: Liên quan

## channels/matrix-presentation.md

- Đường dẫn: /channels/matrix-presentation
- Tiêu đề:
  - H2: Nội dung sự kiện
  - H2: Hành vi dự phòng
  - H2: Khối được hỗ trợ
  - H2: Tương tác
  - H2: Quan hệ với siêu dữ liệu phê duyệt
  - H2: Tin nhắn phương tiện

## channels/matrix-push-rules.md

- Đường dẫn: /channels/matrix-push-rules
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Các bước
  - H2: Ghi chú về nhiều bot
  - H2: Ghi chú về homeserver
  - H2: Liên quan

## channels/matrix.md

- Đường dẫn: /channels/matrix
- Tiêu đề:
  - H2: Cài đặt
  - H2: Thiết lập
  - H3: Thiết lập tương tác
  - H3: Cấu hình tối thiểu
  - H3: Tự động tham gia
  - H3: Định dạng đích allowlist
  - H3: Chuẩn hóa ID tài khoản
  - H3: Thông tin xác thực đã lưu cache
  - H3: Biến môi trường
  - H2: Ví dụ cấu hình
  - H2: Bản xem trước truyền phát
  - H2: Tin nhắn thoại
  - H2: Siêu dữ liệu phê duyệt
  - H3: Quy tắc đẩy tự lưu trữ cho bản xem trước đã hoàn tất yên tĩnh
  - H2: Phòng bot-với-bot
  - H2: Mã hóa và xác minh
  - H3: Bật mã hóa
  - H3: Trạng thái và tín hiệu tin cậy
  - H3: Xác minh thiết bị này bằng khóa khôi phục
  - H3: Khởi tạo hoặc sửa cross-signing
  - H3: Sao lưu khóa phòng
  - H3: Liệt kê, yêu cầu và phản hồi xác minh
  - H3: Ghi chú về nhiều tài khoản
  - H2: Quản lý hồ sơ
  - H2: Luồng
  - H3: Định tuyến phiên (sessionScope)
  - H3: Tạo luồng trả lời (threadReplies)
  - H3: Kế thừa luồng và lệnh gạch chéo
  - H2: Liên kết hội thoại ACP
  - H3: Cấu hình liên kết luồng
  - H2: Phản ứng
  - H2: Ngữ cảnh lịch sử
  - H2: Khả năng hiển thị ngữ cảnh
  - H2: Chính sách DM và phòng
  - H2: Sửa phòng trực tiếp
  - H2: Phê duyệt exec
  - H2: Lệnh gạch chéo
  - H2: Nhiều tài khoản
  - H2: Homeserver riêng/LAN
  - H2: Proxy lưu lượng Matrix
  - H2: Phân giải đích
  - H2: Tham chiếu cấu hình
  - H3: Tài khoản và kết nối
  - H3: Mã hóa
  - H3: Truy cập và chính sách
  - H3: Hành vi trả lời
  - H3: Cài đặt phản ứng
  - H3: Công cụ và ghi đè theo từng phòng
  - H3: Cài đặt phê duyệt exec
  - H2: Liên quan

## channels/mattermost.md

- Đường dẫn: /channels/mattermost
- Tiêu đề:
  - H2: Cài đặt
  - H2: Thiết lập nhanh
  - H2: Lệnh gạch chéo gốc
  - H2: Biến môi trường (tài khoản mặc định)
  - H2: Chế độ trò chuyện
  - H2: Luồng và phiên
  - H2: Kiểm soát truy cập (DM)
  - H2: Kênh (nhóm)
  - H2: Đích cho phân phối gửi đi
  - H2: Thử lại kênh DM
  - H2: Truyền phát bản xem trước
  - H2: Phản ứng (công cụ tin nhắn)
  - H2: Nút tương tác (công cụ tin nhắn)
  - H3: Tích hợp API trực tiếp (script bên ngoài)
  - H2: Bộ chuyển đổi thư mục
  - H2: Nhiều tài khoản
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/msteams.md

- Đường dẫn: /channels/msteams
- Tiêu đề:
  - H2: Plugin đi kèm
  - H2: Thiết lập nhanh
  - H2: Mục tiêu
  - H2: Ghi cấu hình
  - H2: Kiểm soát truy cập (DM + nhóm)
  - H3: Cách hoạt động
  - H3: Bước 1: Tạo Azure Bot
  - H3: Bước 2: Lấy thông tin xác thực
  - H3: Bước 3: Cấu hình Messaging Endpoint
  - H3: Bước 4: Bật Teams Channel
  - H3: Bước 5: Xây dựng Teams App Manifest
  - H3: Bước 6: Cấu hình OpenClaw
  - H3: Bước 7: Chạy Gateway
  - H2: Xác thực liên kết (chứng chỉ cộng với danh tính được quản lý)
  - H3: Tùy chọn A: Xác thực dựa trên chứng chỉ
  - H3: Tùy chọn B: Azure Managed Identity
  - H3: Thiết lập AKS Workload Identity
  - H3: So sánh loại xác thực
  - H2: Phát triển cục bộ (tunneling)
  - H2: Kiểm thử Bot
  - H2: Biến môi trường
  - H2: Hành động thông tin thành viên
  - H2: Ngữ cảnh lịch sử
  - H2: Quyền Teams RSC hiện tại (manifest)
  - H2: Ví dụ Teams manifest (đã biên tập)
  - H3: Lưu ý về manifest (trường bắt buộc)
  - H3: Cập nhật ứng dụng hiện có
  - H2: Năng lực: chỉ RSC so với Graph
  - H3: Chỉ với Teams RSC (ứng dụng đã cài đặt, không có quyền Graph API)
  - H3: Với Teams RSC + quyền Microsoft Graph Application
  - H3: RSC so với Graph API
  - H2: Phương tiện + lịch sử hỗ trợ Graph (bắt buộc cho kênh)
  - H2: Hạn chế đã biết
  - H3: Webhook hết thời gian chờ
  - H3: Hỗ trợ đám mây Teams và URL dịch vụ
  - H3: Định dạng
  - H2: Cấu hình
  - H2: Định tuyến và phiên
  - H2: Kiểu trả lời: luồng so với bài đăng
  - H3: Thứ tự ưu tiên phân giải
  - H3: Bảo toàn ngữ cảnh luồng
  - H2: Tệp đính kèm và hình ảnh
  - H2: Gửi tệp trong trò chuyện nhóm
  - H3: Vì sao trò chuyện nhóm cần SharePoint
  - H3: Thiết lập
  - H3: Hành vi chia sẻ
  - H3: Hành vi dự phòng
  - H3: Vị trí lưu trữ tệp
  - H2: Bình chọn (Adaptive Cards)
  - H2: Thẻ trình bày
  - H2: Định dạng đích
  - H2: Nhắn tin chủ động
  - H2: ID nhóm và kênh (lỗi thường gặp)
  - H2: Kênh riêng tư
  - H2: Khắc phục sự cố
  - H3: Sự cố thường gặp
  - H3: Lỗi tải manifest lên
  - H3: Quyền RSC không hoạt động
  - H2: Tham khảo
  - H2: Liên quan

## channels/nextcloud-talk.md

- Đường dẫn: /channels/nextcloud-talk
- Tiêu đề:
  - H2: Plugin đi kèm
  - H2: Thiết lập nhanh (cho người mới bắt đầu)
  - H2: Ghi chú
  - H2: Kiểm soát truy cập (DM)
  - H2: Phòng (nhóm)
  - H2: Năng lực
  - H2: Tham chiếu cấu hình (Nextcloud Talk)
  - H2: Liên quan

## channels/nostr.md

- Đường dẫn: /channels/nostr
- Tiêu đề:
  - H2: Plugin đi kèm
  - H3: Bản cài đặt cũ/tùy chỉnh
  - H3: Thiết lập không tương tác
  - H2: Thiết lập nhanh
  - H2: Tham chiếu cấu hình
  - H2: Siêu dữ liệu hồ sơ
  - H2: Kiểm soát truy cập
  - H3: Chính sách DM
  - H3: Ví dụ allowlist
  - H2: Định dạng khóa
  - H2: Relay
  - H2: Hỗ trợ giao thức
  - H2: Kiểm thử
  - H3: Relay cục bộ
  - H3: Kiểm thử thủ công
  - H2: Khắc phục sự cố
  - H3: Không nhận được tin nhắn
  - H3: Không gửi được phản hồi
  - H3: Phản hồi trùng lặp
  - H2: Bảo mật
  - H2: Hạn chế (MVP)
  - H2: Liên quan

## channels/pairing.md

- Đường dẫn: /channels/pairing
- Tiêu đề:
  - H2: 1) Ghép cặp DM (truy cập trò chuyện đến)
  - H3: Phê duyệt người gửi
  - H3: Nhóm người gửi có thể tái sử dụng
  - H3: Nơi lưu trạng thái
  - H2: 2) Ghép cặp thiết bị Node (node iOS/Android/macOS/headless)
  - H3: Ghép cặp qua Telegram (khuyến nghị cho iOS)
  - H3: Phê duyệt thiết bị node
  - H3: Tự động phê duyệt node trusted-CIDR tùy chọn
  - H3: Lưu trữ trạng thái ghép cặp Node
  - H3: Ghi chú
  - H2: Tài liệu liên quan

## channels/qa-channel.md

- Đường dẫn: /channels/qa-channel
- Tiêu đề:
  - H2: Chức năng
  - H2: Cấu hình
  - H2: Bộ chạy
  - H2: Liên quan

## channels/qqbot.md

- Đường dẫn: /channels/qqbot
- Tiêu đề:
  - H2: Cài đặt
  - H2: Thiết lập
  - H2: Cấu hình
  - H3: Thiết lập nhiều tài khoản
  - H3: Trò chuyện nhóm
  - H3: Thoại (STT / TTS)
  - H2: Định dạng đích
  - H2: Lệnh gạch chéo
  - H2: Kiến trúc engine
  - H2: Onboarding bằng mã QR
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/raft.md

- Đường dẫn: /channels/raft
- Tiêu đề:
  - H2: Cài đặt
  - H2: Điều kiện tiên quyết
  - H2: Cấu hình
  - H2: Cách hoạt động
  - H2: Xác minh
  - H2: Khắc phục sự cố
  - H2: Tham khảo

## channels/signal.md

- Đường dẫn: /channels/signal
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Thiết lập nhanh (cho người mới bắt đầu)
  - H2: Đây là gì
  - H2: Ghi cấu hình
  - H2: Mô hình số điện thoại (quan trọng)
  - H2: Đường dẫn thiết lập A: liên kết tài khoản Signal hiện có (QR)
  - H2: Đường dẫn thiết lập B: đăng ký số bot riêng (SMS, Linux)
  - H2: Chế độ daemon bên ngoài (httpUrl)
  - H2: Chế độ container (bbernhard/signal-cli-rest-api)
  - H2: Kiểm soát truy cập (DM + nhóm)
  - H2: Cách hoạt động (hành vi)
  - H2: Phương tiện + giới hạn
  - H2: Đang nhập + biên nhận đã đọc
  - H2: Phản ứng trạng thái vòng đời
  - H2: Phản ứng (công cụ tin nhắn)
  - H2: Phản ứng phê duyệt
  - H2: Đích phân phối (CLI/cron)
  - H2: Bí danh
  - H2: Khắc phục sự cố
  - H2: Ghi chú bảo mật
  - H2: Tham chiếu cấu hình (Signal)
  - H2: Liên quan

## channels/slack.md

- Đường dẫn: /channels/slack
- Tiêu đề:
  - H2: Chọn Socket Mode hoặc URL yêu cầu HTTP
  - H3: Chế độ relay
  - H2: Cài đặt
  - H2: Thiết lập nhanh
  - H2: Tinh chỉnh truyền tải Socket Mode
  - H2: Danh sách kiểm tra manifest và phạm vi
  - H3: Cài đặt manifest bổ sung
  - H2: Mô hình token
  - H2: Hành động và cổng kiểm soát
  - H2: Kiểm soát truy cập và định tuyến
  - H2: Luồng, phiên và thẻ trả lời
  - H2: Phản ứng xác nhận
  - H3: Emoji (ackReaction)
  - H3: Phạm vi (messages.ackReactionScope)
  - H2: Truyền phát văn bản
  - H2: Phản ứng đang nhập dự phòng
  - H2: Phương tiện, chia khúc và phân phối
  - H2: Lệnh và hành vi gạch chéo
  - H2: Trả lời tương tác
  - H3: Gửi modal do Plugin sở hữu
  - H2: Phê duyệt gốc trong Slack
  - H2: Sự kiện và hành vi vận hành
  - H2: Tham chiếu cấu hình
  - H2: Khắc phục sự cố
  - H2: Tham chiếu thị giác tệp đính kèm
  - H3: Loại phương tiện được hỗ trợ
  - H3: Pipeline đầu vào
  - H3: Kế thừa tệp đính kèm từ gốc luồng
  - H3: Xử lý nhiều tệp đính kèm
  - H3: Kích thước, tải xuống và giới hạn mô hình
  - H3: Giới hạn đã biết
  - H3: Tài liệu liên quan
  - H2: Liên quan

## channels/sms.md

- Đường dẫn: /channels/sms
- Tiêu đề:
  - H2: Trước khi bắt đầu
  - H2: Thiết lập nhanh
  - H2: Ví dụ cấu hình
  - H3: Tệp cấu hình
  - H3: Biến môi trường
  - H3: Token xác thực SecretRef
  - H3: Số riêng tư chỉ allowlist
  - H3: Người gửi Messaging Service
  - H3: Đích gửi đi mặc định
  - H2: Kiểm soát truy cập
  - H2: Gửi SMS
  - H2: Xác minh thiết lập
  - H3: Kiểm thử đầu cuối từ macOS iMessage/SMS
  - H2: Bảo mật Webhook
  - H2: Cấu hình nhiều tài khoản
  - H2: Khắc phục sự cố
  - H3: Twilio trả về 403 hoặc OpenClaw từ chối Webhook
  - H3: Không có yêu cầu ghép cặp nào xuất hiện
  - H3: Gửi đi thất bại
  - H3: Tin nhắn đến nhưng agent không trả lời

## channels/synology-chat.md

- Đường dẫn: /channels/synology-chat
- Tiêu đề:
  - H2: Plugin đi kèm
  - H2: Thiết lập nhanh
  - H2: Biến môi trường
  - H2: Chính sách DM và kiểm soát truy cập
  - H2: Phân phối gửi đi
  - H2: Nhiều tài khoản
  - H2: Ghi chú bảo mật
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/telegram.md

- Đường dẫn: /channels/telegram
- Tiêu đề:
  - H2: Thiết lập nhanh
  - H2: Cài đặt phía Telegram
  - H2: Kiểm soát truy cập và kích hoạt
  - H3: Danh tính bot trong nhóm
  - H2: Hành vi runtime
  - H2: Tham chiếu tính năng
  - H2: Điều khiển trả lời lỗi
  - H2: Khắc phục sự cố
  - H2: Tham chiếu cấu hình
  - H2: Liên quan

## channels/tlon.md

- Đường dẫn: /channels/tlon
- Tiêu đề:
  - H2: Plugin đi kèm
  - H2: Thiết lập
  - H2: Ship riêng/LAN
  - H2: Kênh nhóm
  - H2: Kiểm soát truy cập
  - H2: Hệ thống chủ sở hữu và phê duyệt
  - H2: Cài đặt tự động chấp nhận
  - H2: Đích phân phối (CLI/cron)
  - H2: Skill đi kèm
  - H2: Năng lực
  - H2: Khắc phục sự cố
  - H2: Tham chiếu cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## channels/troubleshooting.md

- Đường dẫn: /channels/troubleshooting
- Tiêu đề:
  - H2: Bậc thang lệnh
  - H2: Sau khi cập nhật
  - H2: WhatsApp
  - H3: Dấu hiệu lỗi WhatsApp
  - H2: Telegram
  - H3: Dấu hiệu lỗi Telegram
  - H2: Discord
  - H3: Dấu hiệu lỗi Discord
  - H2: Slack
  - H3: Dấu hiệu lỗi Slack
  - H2: iMessage
  - H3: Dấu hiệu lỗi iMessage
  - H2: Signal
  - H3: Dấu hiệu lỗi Signal
  - H2: QQ Bot
  - H3: Dấu hiệu lỗi QQ Bot
  - H2: Matrix
  - H3: Dấu hiệu lỗi Matrix
  - H2: Liên quan

## channels/twitch.md

- Tuyến: /channels/twitch
- Tiêu đề:
  - H2: Plugin đi kèm
  - H2: Thiết lập nhanh (người mới bắt đầu)
  - H2: Đây là gì
  - H2: Thiết lập (chi tiết)
  - H3: Tạo thông tin xác thực
  - H3: Cấu hình bot
  - H3: Kiểm soát truy cập (khuyến nghị)
  - H2: Làm mới token (tùy chọn)
  - H2: Hỗ trợ nhiều tài khoản
  - H2: Kiểm soát truy cập
  - H2: Khắc phục sự cố
  - H2: Cấu hình
  - H3: Cấu hình tài khoản
  - H3: Tùy chọn nhà cung cấp
  - H2: Hành động công cụ
  - H2: An toàn và vận hành
  - H2: Giới hạn
  - H2: Liên quan

## channels/wechat.md

- Tuyến: /channels/wechat
- Tiêu đề:
  - H2: Đặt tên
  - H2: Cách hoạt động
  - H2: Cài đặt
  - H2: Đăng nhập
  - H2: Kiểm soát truy cập
  - H2: Khả năng tương thích
  - H2: Tiến trình sidecar
  - H2: Khắc phục sự cố
  - H2: Tài liệu liên quan

## channels/whatsapp.md

- Tuyến: /channels/whatsapp
- Tiêu đề:
  - H2: Cài đặt (theo nhu cầu)
  - H2: Thiết lập nhanh
  - H2: Gọi người yêu cầu hiện tại bằng MeowCaller (thử nghiệm)
  - H2: Mẫu triển khai
  - H2: Mô hình runtime
  - H2: Lời nhắc phê duyệt
  - H2: Hook Plugin và quyền riêng tư
  - H2: Kiểm soát truy cập và kích hoạt
  - H2: Liên kết ACP đã cấu hình
  - H2: Hành vi số cá nhân và tự trò chuyện
  - H2: Chuẩn hóa tin nhắn và ngữ cảnh
  - H2: Phân phối, chia đoạn và phương tiện
  - H2: Trích dẫn trả lời
  - H2: Cấp độ phản ứng
  - H2: Phản ứng xác nhận
  - H2: Phản ứng trạng thái vòng đời
  - H2: Nhiều tài khoản và thông tin xác thực
  - H2: Công cụ, hành động và ghi cấu hình
  - H2: Khắc phục sự cố
  - H2: Lời nhắc hệ thống
  - H2: Con trỏ tham chiếu cấu hình
  - H2: Liên quan

## channels/yuanbao.md

- Tuyến: /channels/yuanbao
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H3: Thiết lập tương tác (phương án thay thế)
  - H2: Kiểm soát truy cập
  - H3: Tin nhắn trực tiếp
  - H3: Trò chuyện nhóm
  - H2: Ví dụ cấu hình
  - H3: Thiết lập cơ bản với chính sách DM mở
  - H3: Giới hạn DM cho người dùng cụ thể
  - H3: Tắt yêu cầu @mention trong nhóm
  - H3: Tối ưu hóa phân phối tin nhắn đi
  - H3: Tinh chỉnh chiến lược merge-text
  - H2: Lệnh phổ biến
  - H2: Khắc phục sự cố
  - H3: Bot không phản hồi trong trò chuyện nhóm
  - H3: Bot không nhận được tin nhắn
  - H3: Bot gửi trả lời rỗng hoặc dự phòng
  - H3: App Secret bị rò rỉ
  - H2: Cấu hình nâng cao
  - H3: Nhiều tài khoản
  - H3: Giới hạn tin nhắn
  - H3: Streaming
  - H3: Ngữ cảnh lịch sử trò chuyện nhóm
  - H3: Chế độ reply-to
  - H3: Chèn gợi ý Markdown
  - H3: Chế độ gỡ lỗi
  - H3: Định tuyến nhiều agent
  - H2: Tham chiếu cấu hình
  - H2: Loại tin nhắn được hỗ trợ
  - H3: Nhận
  - H3: Gửi
  - H3: Thread và trả lời
  - H2: Liên quan

## channels/zalo.md

- Tuyến: /channels/zalo
- Tiêu đề:
  - H2: Plugin đi kèm
  - H2: Thiết lập nhanh (người mới bắt đầu)
  - H2: Đây là gì
  - H2: Thiết lập (đường dẫn nhanh)
  - H3: 1) Tạo bot token (Zalo Bot Platform)
  - H3: 2) Cấu hình token (env hoặc cấu hình)
  - H2: Cách hoạt động (hành vi)
  - H2: Giới hạn
  - H2: Kiểm soát truy cập (DM)
  - H3: Truy cập DM
  - H2: Kiểm soát truy cập (Nhóm)
  - H2: Long-polling so với webhook
  - H2: Loại tin nhắn được hỗ trợ
  - H2: Khả năng
  - H2: Mục tiêu phân phối (CLI/cron)
  - H2: Khắc phục sự cố
  - H2: Tham chiếu cấu hình (Zalo)
  - H2: Liên quan

## channels/zaloclawbot.md

- Tuyến: /channels/zaloclawbot
- Tiêu đề:
  - H2: Khả năng tương thích
  - H2: Điều kiện tiên quyết
  - H2: Cài đặt bằng onboard (khuyến nghị)
  - H2: Cài đặt thủ công
  - H3: 1. Cài đặt Plugin
  - H3: 2. Bật Plugin trong cấu hình
  - H3: 3. Tạo mã QR và đăng nhập
  - H3: 4. Khởi động lại gateway
  - H2: Cách hoạt động
  - H2: Bên trong hệ thống
  - H2: Khắc phục sự cố

## channels/zalouser.md

- Tuyến: /channels/zalouser
- Tiêu đề:
  - H2: Plugin đi kèm
  - H2: Thiết lập nhanh (người mới bắt đầu)
  - H2: Đây là gì
  - H2: Đặt tên
  - H2: Tìm ID (thư mục)
  - H2: Giới hạn
  - H2: Kiểm soát truy cập (DM)
  - H2: Truy cập nhóm (tùy chọn)
  - H3: Cổng kiểm soát đề cập nhóm
  - H2: Nhiều tài khoản
  - H2: Biến môi trường
  - H2: Nhập liệu, phản ứng và xác nhận phân phối
  - H2: Khắc phục sự cố
  - H2: Liên quan

## ci.md

- Tuyến: /ci
- Tiêu đề:
  - H2: Tổng quan pipeline
  - H2: Thứ tự fail-fast
  - H2: Ngữ cảnh PR và bằng chứng
  - H2: Phạm vi và định tuyến
  - H2: Chuyển tiếp hoạt động ClawSweeper
  - H2: Kích hoạt thủ công
  - H2: Runner
  - H2: Ngân sách đăng ký runner
  - H2: Tương đương cục bộ
  - H2: Hiệu năng OpenClaw
  - H2: Xác thực bản phát hành đầy đủ
  - H2: Shard live và E2E
  - H2: Chấp nhận gói
  - H3: Job
  - H3: Nguồn ứng viên
  - H3: Hồ sơ bộ kiểm thử
  - H3: Cửa sổ tương thích cũ
  - H3: Ví dụ
  - H2: Smoke cài đặt
  - H2: Docker E2E cục bộ
  - H3: Tham số tinh chỉnh
  - H3: Workflow live/E2E tái sử dụng
  - H3: Phần theo đường dẫn phát hành
  - H2: Plugin Prerelease
  - H2: QA Lab
  - H2: CodeQL
  - H3: Danh mục bảo mật
  - H3: Shard bảo mật theo nền tảng
  - H3: Danh mục Chất lượng Quan trọng
  - H2: Workflow bảo trì
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: PR trùng lặp sau khi merge
  - H2: Cổng kiểm tra cục bộ và định tuyến thay đổi
  - H2: Xác thực Testbox
  - H2: Liên quan

## clawhub/cli.md

- Tuyến: /clawhub/cli
- Tiêu đề:
  - H1: ClawHub CLI
  - H2: Khám phá và cài đặt
  - H2: Xuất bản và bảo trì
  - H2: Liên quan

## clawhub/publishing.md

- Tuyến: /clawhub/publishing
- Tiêu đề:
  - H1: Xuất bản trên ClawHub
  - H2: Chủ sở hữu
  - H2: Skills
  - H2: Plugins
  - H2: Luồng phát hành
  - H2: Câu hỏi thường gặp
  - H3: Phạm vi gói phải khớp với chủ sở hữu đã chọn

## cli/acp.md

- Tuyến: /cli/acp
- Tiêu đề:
  - H2: Đây không phải là gì
  - H2: Ma trận tương thích
  - H2: Hạn chế đã biết
  - H2: Cách sử dụng
  - H2: ACP client (gỡ lỗi)
  - H2: Kiểm thử smoke giao thức
  - H2: Cách dùng nội dung này
  - H2: Chọn agent
  - H2: Dùng từ acpx (Codex, Claude, ACP client khác)
  - H2: Thiết lập trình chỉnh sửa Zed
  - H2: Ánh xạ phiên
  - H2: Tùy chọn
  - H3: tùy chọn acp client
  - H2: Liên quan

## cli/agent.md

- Tuyến: /cli/agent
- Tiêu đề:
  - H1: openclaw agent
  - H2: Tùy chọn
  - H2: Ví dụ
  - H2: Ghi chú
  - H2: Trạng thái phân phối JSON
  - H2: Liên quan

## cli/agents.md

- Tuyến: /cli/agents
- Tiêu đề:
  - H1: openclaw agents
  - H2: Ví dụ
  - H2: Liên kết định tuyến
  - H3: Định dạng --bind
  - H3: Hành vi phạm vi liên kết
  - H2: Bề mặt lệnh
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete &lt;id&gt;
  - H2: Tệp danh tính
  - H2: Đặt danh tính
  - H2: Liên quan

## cli/approvals.md

- Tuyến: /cli/approvals
- Tiêu đề:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Lệnh phổ biến
  - H2: Thay thế phê duyệt từ một tệp
  - H2: Ví dụ "Không bao giờ nhắc" / YOLO
  - H2: Helper allowlist
  - H2: Tùy chọn phổ biến
  - H2: Ghi chú
  - H2: Liên quan

## cli/attach.md

- Tuyến: /cli/attach
- Tiêu đề: không có

## cli/backup.md

- Tuyến: /cli/backup
- Tiêu đề:
  - H1: openclaw backup
  - H2: Ghi chú
  - H2: Nội dung được sao lưu
  - H2: Hành vi cấu hình không hợp lệ
  - H2: Kích thước và hiệu năng
  - H2: Liên quan

## cli/browser.md

- Tuyến: /cli/browser
- Tiêu đề:
  - H1: openclaw browser
  - H2: Cờ phổ biến
  - H2: Bắt đầu nhanh (cục bộ)
  - H2: Khắc phục sự cố nhanh
  - H2: Vòng đời
  - H2: Nếu lệnh bị thiếu
  - H2: Hồ sơ
  - H2: Tab
  - H2: Snapshot / ảnh chụp màn hình / hành động
  - H2: Trạng thái và lưu trữ
  - H2: Gỡ lỗi
  - H2: Chrome hiện có qua MCP
  - H2: Điều khiển trình duyệt từ xa (proxy máy chủ node)
  - H2: Liên quan

## cli/channels.md

- Tuyến: /cli/channels
- Tiêu đề:
  - H1: openclaw channels
  - H2: Lệnh phổ biến
  - H2: Trạng thái / khả năng / phân giải / nhật ký
  - H2: Thêm / xóa tài khoản
  - H2: Đăng nhập và đăng xuất (tương tác)
  - H2: Khắc phục sự cố
  - H2: Thăm dò khả năng
  - H2: Phân giải tên thành ID
  - H2: Liên quan

## cli/clawbot.md

- Tuyến: /cli/clawbot
- Tiêu đề:
  - H1: openclaw clawbot
  - H2: Di chuyển
  - H2: Liên quan

## cli/commitments.md

- Tuyến: /cli/commitments
- Tiêu đề:
  - H2: Cách sử dụng
  - H2: Tùy chọn
  - H2: Ví dụ
  - H2: Đầu ra
  - H2: Liên quan

## cli/completion.md

- Tuyến: /cli/completion
- Tiêu đề:
  - H1: openclaw completion
  - H2: Cách sử dụng
  - H2: Tùy chọn
  - H2: Ghi chú
  - H2: Liên quan

## cli/config.md

- Tuyến: /cli/config
- Tiêu đề:
  - H2: Tùy chọn gốc
  - H2: Ví dụ
  - H3: config schema
  - H3: Đường dẫn
  - H2: Giá trị
  - H2: Chế độ config set
  - H2: config patch
  - H2: Cờ builder nhà cung cấp
  - H2: Chạy thử
  - H3: Hình dạng đầu ra JSON
  - H2: An toàn khi ghi
  - H2: Lệnh con
  - H2: Xác thực
  - H2: Liên quan

## cli/configure.md

- Tuyến: /cli/configure
- Tiêu đề:
  - H1: openclaw configure
  - H2: Tùy chọn
  - H2: Ví dụ
  - H2: Liên quan

## cli/crestodian.md

- Tuyến: /cli/crestodian
- Tiêu đề:
  - H1: openclaw crestodian
  - H2: Nội dung Crestodian hiển thị
  - H2: Ví dụ
  - H2: Khởi động an toàn
  - H2: Vận hành và phê duyệt
  - H2: Bootstrap thiết lập
  - H2: Bộ lập kế hoạch hỗ trợ bởi mô hình
  - H2: Chuyển sang agent
  - H2: Chế độ cứu tin nhắn
  - H2: Liên quan

## cli/cron.md

- Tuyến: /cli/cron
- Tiêu đề:
  - H1: openclaw cron
  - H2: Tạo job nhanh
  - H2: Phiên
  - H2: Phân phối
  - H3: Quyền sở hữu phân phối
  - H3: Phân phối khi lỗi
  - H2: Lập lịch
  - H3: Job chạy một lần
  - H3: Job định kỳ
  - H3: Chạy thủ công
  - H2: Mô hình
  - H3: Thứ tự ưu tiên mô hình cron cô lập
  - H3: Chế độ nhanh
  - H3: Thử lại chuyển mô hình live
  - H2: Đầu ra chạy và từ chối
  - H3: Chặn xác nhận đã cũ
  - H3: Chặn token im lặng
  - H3: Từ chối có cấu trúc
  - H2: Lưu giữ
  - H2: Di chuyển job cũ
  - H2: Chỉnh sửa phổ biến
  - H2: Lệnh quản trị phổ biến
  - H2: Liên quan

## cli/daemon.md

- Tuyến: /cli/daemon
- Tiêu đề:
  - H1: openclaw daemon
  - H2: Cách sử dụng
  - H2: Lệnh con
  - H2: Tùy chọn phổ biến
  - H2: Ưu tiên
  - H2: Liên quan

## cli/dashboard.md

- Tuyến: /cli/dashboard
- Tiêu đề:
  - H1: openclaw dashboard
  - H2: Liên quan

## cli/devices.md

- Tuyến: /cli/devices
- Tiêu đề:
  - H1: openclaw devices
  - H2: Lệnh
  - H3: openclaw devices list
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Phê duyệt lần chạy đầu của Paperclip / openclawgateway
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: Tùy chọn phổ biến
  - H2: Ghi chú
  - H2: Danh sách kiểm tra khôi phục trôi lệch token
  - H2: Liên quan

## cli/directory.md

- Tuyến: /cli/directory
- Tiêu đề:
  - H1: openclaw directory
  - H2: Cờ phổ biến
  - H2: Ghi chú
  - H2: Dùng kết quả với gửi tin nhắn
  - H2: Định dạng ID (theo kênh)
  - H2: Bản thân ("me")
  - H2: Peer (liên hệ/người dùng)
  - H2: Nhóm
  - H2: Liên quan

## cli/dns.md

- Tuyến: /cli/dns
- Tiêu đề:
  - H1: openclaw dns
  - H2: Thiết lập
  - H2: dns setup
  - H2: Liên quan

## cli/docs.md

- Tuyến: /cli/docs
- Tiêu đề:
  - H1: openclaw docs
  - H2: Cách sử dụng
  - H2: Ví dụ
  - H2: Cách hoạt động
  - H2: Đầu ra
  - H2: Mã thoát
  - H2: Liên quan

## cli/doctor.md

- Tuyến: /cli/doctor
- Tiêu đề:
  - H1: openclaw doctor
  - H2: Vì sao nên dùng
  - H2: Ví dụ
  - H2: Tùy chọn
  - H2: Chế độ lint
  - H2: Kiểm tra tình trạng có cấu trúc
  - H2: Chọn kiểm tra
  - H2: Chế độ sau nâng cấp
  - H2: macOS: ghi đè env launchctl
  - H2: Liên quan

## cli/flows.md

- Tuyến: /cli/flows
- Tiêu đề:
  - H1: openclaw tasks flow
  - H2: Lệnh con
  - H3: Giá trị bộ lọc trạng thái
  - H2: Ví dụ
  - H2: Liên quan

## cli/gateway.md

- Tuyến: /cli/gateway
- Tiêu đề:
  - H2: Chạy Gateway
  - H3: Tùy chọn
  - H2: Khởi động lại Gateway
  - H3: Lập hồ sơ Gateway
  - H2: Truy vấn Gateway đang chạy
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Từ xa qua SSH (tương đương ứng dụng Mac)
  - H3: gateway call &lt;method&gt;
  - H2: Quản lý dịch vụ Gateway
  - H3: Cài đặt bằng wrapper
  - H2: Khám phá gateway (Bonjour)
  - H3: gateway discover
  - H2: Liên quan

## cli/health.md

- Tuyến: /cli/health
- Tiêu đề:
  - H1: openclaw health
  - H2: Tùy chọn
  - H2: Liên quan

## cli/hooks.md

- Route: /cli/hooks
- Tiêu đề:
  - H1: openclaw hooks
  - H2: Liệt kê tất cả hook
  - H2: Lấy thông tin hook
  - H2: Kiểm tra điều kiện dùng hook
  - H2: Bật Hook
  - H2: Tắt Hook
  - H2: Ghi chú
  - H2: Cài đặt các gói hook
  - H2: Cập nhật các gói hook
  - H2: Các hook đi kèm
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Liên quan

## cli/index.md

- Route: /cli
- Tiêu đề:
  - H2: Trang lệnh
  - H2: Cờ toàn cục
  - H2: Chế độ đầu ra
  - H2: Cây lệnh
  - H2: Lệnh slash trong chat
  - H2: Theo dõi mức sử dụng
  - H2: Liên quan

## cli/infer.md

- Route: /cli/infer
- Tiêu đề:
  - H2: Biến infer thành một skill
  - H2: Vì sao dùng infer
  - H2: Cây lệnh
  - H2: Tác vụ thường gặp
  - H2: Hành vi
  - H2: Mô hình
  - H2: Hình ảnh
  - H2: Âm thanh
  - H2: TTS
  - H2: Video
  - H2: Web
  - H2: Embedding
  - H2: Đầu ra JSON
  - H2: Lỗi thường gặp
  - H2: Ghi chú
  - H2: Liên quan

## cli/logs.md

- Route: /cli/logs
- Tiêu đề:
  - H1: openclaw logs
  - H2: Tùy chọn
  - H2: Tùy chọn RPC Gateway dùng chung
  - H2: Ví dụ
  - H2: Ghi chú
  - H2: Liên quan

## cli/mcp.md

- Route: /cli/mcp
- Tiêu đề:
  - H2: Chọn đường dẫn MCP phù hợp
  - H2: OpenClaw làm máy chủ MCP
  - H3: Khi nào dùng serve
  - H3: Cách hoạt động
  - H3: Chọn chế độ client
  - H3: serve cung cấp những gì
  - H3: Cách dùng
  - H3: Công cụ bridge
  - H3: Mô hình sự kiện
  - H3: Thông báo kênh Claude
  - H3: Cấu hình client MCP
  - H3: Tùy chọn
  - H3: Bảo mật và ranh giới tin cậy
  - H3: Kiểm thử
  - H3: Khắc phục sự cố
  - H2: OpenClaw làm registry client MCP
  - H3: Định nghĩa máy chủ MCP đã lưu
  - H3: Công thức máy chủ thường dùng
  - H3: Dạng đầu ra JSON
  - H3: Transport Stdio
  - H3: Transport SSE / HTTP
  - H3: Quy trình OAuth
  - H3: Transport HTTP có thể stream
  - H2: Giao diện điều khiển
  - H2: Giới hạn hiện tại
  - H2: Liên quan

## cli/memory.md

- Route: /cli/memory
- Tiêu đề:
  - H1: openclaw memory
  - H2: Ví dụ
  - H2: Tùy chọn
  - H2: Dreaming
  - H2: Liên quan

## cli/message.md

- Route: /cli/message
- Tiêu đề:
  - H1: openclaw message
  - H2: Cách dùng
  - H2: Cờ thường dùng
  - H2: Hành vi SecretRef
  - H2: Hành động
  - H3: Lõi
  - H3: Luồng
  - H3: Emoji
  - H3: Sticker
  - H3: Vai trò / Kênh / Thành viên / Giọng nói
  - H3: Sự kiện
  - H3: Điều phối (Discord)
  - H3: Phát rộng
  - H2: Ví dụ
  - H2: Liên quan

## cli/migrate.md

- Route: /cli/migrate
- Tiêu đề:
  - H1: openclaw migrate
  - H2: Lệnh
  - H2: Mô hình an toàn
  - H2: Provider Claude
  - H3: Claude nhập những gì
  - H3: Trạng thái lưu trữ và xem xét thủ công
  - H2: Provider Codex
  - H3: Codex nhập những gì
  - H3: Trạng thái Codex cần xem xét thủ công
  - H2: Provider Hermes
  - H3: Hermes nhập những gì
  - H3: Khóa .env được hỗ trợ
  - H3: Trạng thái chỉ lưu trữ
  - H3: Sau khi áp dụng
  - H2: Hợp đồng Plugin
  - H2: Tích hợp onboarding
  - H2: Liên quan

## cli/models.md

- Route: /cli/models
- Tiêu đề:
  - H1: openclaw models
  - H2: Lệnh thường dùng
  - H3: Quét mô hình
  - H3: Trạng thái mô hình
  - H2: Alias + fallback
  - H2: Hồ sơ xác thực
  - H2: Liên quan

## cli/node.md

- Route: /cli/node
- Tiêu đề:
  - H1: openclaw node
  - H2: Vì sao dùng máy chủ node?
  - H2: Proxy trình duyệt (không cần cấu hình)
  - H2: Chạy (foreground)
  - H2: Xác thực Gateway cho máy chủ node
  - H2: Dịch vụ (background)
  - H2: Ghép đôi
  - H2: Phê duyệt exec
  - H2: Liên quan

## cli/nodes.md

- Route: /cli/nodes
- Tiêu đề:
  - H1: openclaw nodes
  - H2: Lệnh thường dùng
  - H2: Gọi thực thi
  - H2: Liên quan

## cli/onboard.md

- Route: /cli/onboard
- Tiêu đề:
  - H1: openclaw onboard
  - H2: Hướng dẫn liên quan
  - H2: Ví dụ
  - H2: Locale
  - H3: Lựa chọn endpoint Z.AI không tương tác
  - H2: Cờ không tương tác bổ sung
  - H2: Ghi chú về luồng
  - H2: Lệnh theo dõi thường dùng

## cli/pairing.md

- Route: /cli/pairing
- Tiêu đề:
  - H1: openclaw pairing
  - H2: Lệnh
  - H2: pairing list
  - H2: pairing approve
  - H2: Ghi chú
  - H2: Liên quan

## cli/path.md

- Route: /cli/path
- Tiêu đề:
  - H1: openclaw path
  - H2: Vì sao dùng nó
  - H2: Cách dùng
  - H2: Cách hoạt động
  - H2: Lệnh con
  - H2: Cờ toàn cục
  - H2: Cú pháp oc://
  - H2: Định địa chỉ theo loại tệp
  - H2: Hợp đồng thay đổi
  - H2: Ví dụ
  - H2: Công thức theo loại tệp
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Tham chiếu lệnh con
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: Mã thoát
  - H2: Chế độ đầu ra
  - H2: Ghi chú
  - H2: Liên quan

## cli/plugins.md

- Route: /cli/plugins
- Tiêu đề:
  - H2: Lệnh
  - H3: Tác giả
  - H3: Scaffold provider
  - H3: Cài đặt
  - H4: Cách viết tắt marketplace
  - H3: Danh sách
  - H3: Chỉ mục Plugin
  - H3: Gỡ cài đặt
  - H3: Cập nhật
  - H3: Kiểm tra
  - H3: Doctor
  - H3: Registry
  - H3: Marketplace
  - H2: Liên quan

## cli/policy.md

- Route: /cli/policy
- Tiêu đề:
  - H1: openclaw policy
  - H2: Bắt đầu nhanh
  - H3: Tham chiếu quy tắc policy
  - H4: Overlay theo phạm vi
  - H4: Kênh
  - H4: Máy chủ MCP
  - H4: Provider mô hình
  - H4: Mạng
  - H4: Ingress và quyền truy cập kênh
  - H4: Gateway
  - H4: Workspace agent
  - H4: Tư thế sandbox
  - H4: Xử lý dữ liệu
  - H4: Bí mật
  - H4: Phê duyệt exec
  - H4: Hồ sơ xác thực
  - H4: Metadata công cụ
  - H4: Tư thế công cụ
  - H2: Cấu hình policy
  - H2: Chấp nhận trạng thái policy
  - H2: Phát hiện
  - H2: Sửa chữa
  - H2: Mã thoát
  - H2: Liên quan

## cli/proxy.md

- Route: /cli/proxy
- Tiêu đề:
  - H1: openclaw proxy
  - H2: Lệnh
  - H2: Xác thực
  - H2: Preset truy vấn
  - H2: Ghi chú
  - H2: Liên quan

## cli/qr.md

- Route: /cli/qr
- Tiêu đề:
  - H1: openclaw qr
  - H2: Cách dùng
  - H2: Tùy chọn
  - H2: Ghi chú
  - H2: Liên quan

## cli/reset.md

- Route: /cli/reset
- Tiêu đề:
  - H1: openclaw reset
  - H2: Liên quan

## cli/sandbox.md

- Route: /cli/sandbox
- Tiêu đề:
  - H2: Tổng quan
  - H2: Lệnh
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Trường hợp sử dụng
  - H3: Sau khi cập nhật image Docker
  - H3: Sau khi thay đổi cấu hình sandbox
  - H3: Sau khi thay đổi SSH target hoặc vật liệu xác thực SSH
  - H3: Sau khi thay đổi nguồn, policy hoặc chế độ OpenShell
  - H3: Sau khi thay đổi setupCommand
  - H3: Chỉ cho một agent cụ thể
  - H2: Vì sao cần điều này
  - H2: Di chuyển registry
  - H2: Cấu hình
  - H2: Liên quan

## cli/secrets.md

- Route: /cli/secrets
- Tiêu đề:
  - H1: openclaw secrets
  - H2: Tải lại snapshot runtime
  - H2: Kiểm toán
  - H2: Cấu hình (trợ lý tương tác)
  - H2: Áp dụng một kế hoạch đã lưu
  - H2: Vì sao không có bản sao lưu rollback
  - H2: Ví dụ
  - H2: Liên quan

## cli/security.md

- Route: /cli/security
- Tiêu đề:
  - H1: openclaw security
  - H2: Kiểm toán
  - H2: Đầu ra JSON
  - H2: --fix thay đổi những gì
  - H2: Liên quan

## cli/sessions.md

- Route: /cli/sessions
- Tiêu đề:
  - H1: openclaw sessions
  - H2: Bảo trì dọn dẹp
  - H2: Compact một phiên
  - H3: RPC sessions.compact
  - H2: Liên quan

## cli/setup.md

- Route: /cli/setup
- Tiêu đề:
  - H1: openclaw setup
  - H2: Tùy chọn
  - H3: Chế độ baseline
  - H2: Ví dụ
  - H2: Ghi chú
  - H2: Liên quan

## cli/skills.md

- Route: /cli/skills
- Tiêu đề:
  - H1: openclaw skills
  - H2: Lệnh
  - H2: Skill Workshop
  - H2: Liên quan

## cli/status.md

- Route: /cli/status
- Tiêu đề:
  - H2: Liên quan

## cli/system.md

- Route: /cli/system
- Tiêu đề:
  - H1: openclaw system
  - H2: Lệnh thường dùng
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Ghi chú
  - H2: Liên quan

## cli/tasks.md

- Route: /cli/tasks
- Tiêu đề:
  - H2: Cách dùng
  - H2: Tùy chọn gốc
  - H2: Lệnh con
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: Liên quan

## cli/transcripts.md

- Route: /cli/transcripts
- Tiêu đề:
  - H1: openclaw transcripts
  - H2: Lệnh
  - H2: Đầu ra
  - H2: Nhiều cuộc họp mỗi ngày
  - H2: Thiếu bản tóm tắt
  - H2: Cấu hình

## cli/tui.md

- Route: /cli/tui
- Tiêu đề:
  - H1: openclaw tui
  - H2: Tùy chọn
  - H2: Ví dụ
  - H2: Vòng lặp sửa cấu hình
  - H2: Liên quan

## cli/uninstall.md

- Route: /cli/uninstall
- Tiêu đề:
  - H1: openclaw uninstall
  - H2: Liên quan

## cli/update.md

- Route: /cli/update
- Tiêu đề:
  - H1: openclaw update
  - H2: Cách dùng
  - H2: Tùy chọn
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Nó làm gì
  - H3: Dạng phản hồi control-plane
  - H2: Luồng checkout Git
  - H3: Chọn kênh
  - H3: Các bước cập nhật
  - H2: Cách viết tắt --update
  - H2: Liên quan

## cli/voicecall.md

- Route: /cli/voicecall
- Tiêu đề:
  - H1: openclaw voicecall
  - H2: Lệnh con
  - H2: Thiết lập và smoke
  - H3: setup
  - H3: smoke
  - H2: Vòng đời cuộc gọi
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Nhật ký và chỉ số
  - H3: tail
  - H3: latency
  - H2: Công khai Webhook
  - H3: expose
  - H2: Liên quan

## cli/webhooks.md

- Route: /cli/webhooks
- Tiêu đề:
  - H1: openclaw webhooks
  - H2: Lệnh con
  - H2: webhooks gmail setup
  - H3: Bắt buộc
  - H3: Tùy chọn Pub/Sub
  - H3: Tùy chọn phân phối OpenClaw
  - H3: Tùy chọn gog watch serve
  - H3: Phơi bày qua Tailscale
  - H3: Đầu ra
  - H2: webhooks gmail run
  - H2: Luồng đầu cuối
  - H2: Liên quan

## cli/wiki.md

- Route: /cli/wiki
- Tiêu đề:
  - H1: openclaw wiki
  - H2: Dùng để làm gì
  - H2: Lệnh thường dùng
  - H2: Lệnh
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path-or-url&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Hướng dẫn sử dụng thực tế
  - H2: Liên kết cấu hình
  - H2: Liên quan

## cli/workboard.md

- Route: /cli/workboard
- Tiêu đề:
  - H2: Cách dùng
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Tương đương lệnh slash
  - H2: Quyền
  - H2: Khắc phục sự cố
  - H3: Không có thẻ nào xuất hiện
  - H3: Dispatch báo chỉ có dữ liệu
  - H3: Dispatch không khởi động gì
  - H2: Liên quan

## concepts/active-memory.md

- Route: /concepts/active-memory
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Khuyến nghị về tốc độ
  - H3: Thiết lập Cerebras
  - H2: Cách xem nó
  - H2: Công tắc phiên
  - H2: Khi nào nó chạy
  - H2: Loại phiên
  - H2: Nơi nó chạy
  - H2: Vì sao dùng nó
  - H2: Cách hoạt động
  - H2: Chế độ truy vấn
  - H2: Kiểu prompt
  - H2: Chính sách fallback mô hình
  - H2: Công cụ bộ nhớ
  - H3: memory-core tích hợp sẵn
  - H3: Bộ nhớ LanceDB
  - H3: Lossless Claw
  - H2: Cửa thoát nâng cao
  - H2: Lưu giữ transcript
  - H2: Cấu hình
  - H2: Thiết lập được khuyến nghị
  - H3: Thời gian gia hạn cold-start
  - H2: Gỡ lỗi
  - H2: Vấn đề thường gặp
  - H2: Trang liên quan

## concepts/agent-loop.md

- Route: /concepts/agent-loop
- Tiêu đề:
  - H2: Điểm vào
  - H2: Cách hoạt động (mức cao)
  - H2: Xếp hàng + đồng thời
  - H2: Chuẩn bị phiên + workspace
  - H2: Lắp ráp prompt + system prompt
  - H2: Điểm hook (nơi bạn có thể chặn)
  - H3: Hook nội bộ (hook Gateway)
  - H3: Hook Plugin (vòng đời agent + gateway)
  - H2: Streaming + phản hồi một phần
  - H2: Thực thi công cụ + công cụ nhắn tin
  - H2: Định hình phản hồi + chặn hiển thị
  - H2: Compaction + thử lại
  - H2: Luồng sự kiện (hiện nay)
  - H2: Xử lý kênh chat
  - H2: Thời gian chờ
  - H2: Nơi mọi thứ có thể kết thúc sớm
  - H2: Liên quan

## concepts/agent-runtimes.md

- Route: /concepts/agent-runtimes
- Tiêu đề:
  - H2: Bề mặt Codex
  - H2: Quyền sở hữu runtime
  - H2: Chọn runtime
  - H2: Runtime agent GitHub Copilot
  - H2: Hợp đồng tương thích
  - H2: Nhãn trạng thái
  - H2: Liên quan

## concepts/agent-workspace.md

- Tuyến: /concepts/agent-workspace
- Tiêu đề:
  - H2: Vị trí mặc định
  - H2: Thư mục không gian làm việc bổ sung
  - H2: Sơ đồ tệp không gian làm việc
  - H2: Những gì KHÔNG có trong không gian làm việc
  - H2: Sao lưu Git (khuyến nghị, riêng tư)
  - H2: Không commit bí mật
  - H2: Di chuyển không gian làm việc sang máy mới
  - H2: Ghi chú nâng cao
  - H2: Liên quan

## concepts/agent.md

- Tuyến: /concepts/agent
- Tiêu đề:
  - H2: Không gian làm việc (bắt buộc)
  - H2: Tệp khởi động (được chèn)
  - H2: Công cụ tích hợp sẵn
  - H2: Skills
  - H2: Ranh giới runtime
  - H2: Phiên
  - H2: Điều hướng trong khi truyền luồng
  - H2: Tham chiếu mô hình
  - H2: Cấu hình (tối thiểu)
  - H2: Liên quan

## concepts/architecture.md

- Tuyến: /concepts/architecture
- Tiêu đề:
  - H2: Tổng quan
  - H2: Thành phần và luồng
  - H3: Gateway (daemon)
  - H3: Máy khách (ứng dụng mac / CLI / quản trị web)
  - H3: Node (macOS / iOS / Android / không giao diện)
  - H3: WebChat
  - H2: Vòng đời kết nối (một máy khách)
  - H2: Giao thức dây (tóm tắt)
  - H2: Ghép nối + tin cậy cục bộ
  - H2: Kiểu hóa giao thức và sinh mã
  - H2: Truy cập từ xa
  - H2: Ảnh chụp vận hành
  - H2: Bất biến
  - H2: Liên quan

## concepts/channel-docking.md

- Tuyến: /concepts/channel-docking
- Tiêu đề:
  - H2: Ví dụ
  - H2: Vì sao dùng nó
  - H2: Cấu hình bắt buộc
  - H2: Lệnh
  - H2: Những gì thay đổi
  - H2: Những gì không thay đổi
  - H2: Khắc phục sự cố

## concepts/commitments.md

- Tuyến: /concepts/commitments
- Tiêu đề:
  - H2: Bật cam kết
  - H2: Cách hoạt động
  - H2: Phạm vi
  - H2: Cam kết so với lời nhắc
  - H2: Quản lý cam kết
  - H2: Quyền riêng tư và chi phí
  - H2: Khắc phục sự cố
  - H2: Liên quan

## concepts/compaction.md

- Tuyến: /concepts/compaction
- Tiêu đề:
  - H2: Cách hoạt động
  - H2: Tự động Compaction
  - H2: Compaction thủ công
  - H2: Cấu hình
  - H3: Dùng một mô hình khác
  - H3: Bảo toàn định danh
  - H3: Bộ bảo vệ byte bản ghi phiên hoạt động
  - H3: Bản ghi kế tiếp
  - H3: Thông báo Compaction
  - H3: Xả bộ nhớ
  - H2: Nhà cung cấp Compaction có thể cắm thêm
  - H2: Compaction so với cắt tỉa
  - H2: Khắc phục sự cố
  - H2: Liên quan

## concepts/context-engine.md

- Tuyến: /concepts/context-engine
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cách hoạt động
  - H3: Vòng đời tác nhân phụ (tùy chọn)
  - H3: Bổ sung prompt hệ thống
  - H2: Công cụ cũ
  - H2: Công cụ Plugin
  - H3: Giao diện ContextEngine
  - H3: Thiết lập runtime
  - H3: Yêu cầu máy chủ
  - H3: Cô lập lỗi
  - H3: ownsCompaction
  - H2: Tham chiếu cấu hình
  - H2: Quan hệ với Compaction và bộ nhớ
  - H2: Mẹo
  - H2: Liên quan

## concepts/context.md

- Tuyến: /concepts/context
- Tiêu đề:
  - H2: Bắt đầu nhanh (kiểm tra ngữ cảnh)
  - H2: Ví dụ đầu ra
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Những gì được tính vào cửa sổ ngữ cảnh
  - H2: Cách OpenClaw xây dựng prompt hệ thống
  - H2: Tệp không gian làm việc được chèn (Ngữ cảnh dự án)
  - H2: Skills: được chèn so với tải theo nhu cầu
  - H2: Công cụ: có hai chi phí
  - H2: Lệnh, chỉ thị và "lối tắt nội tuyến"
  - H2: Phiên, Compaction và cắt tỉa (những gì được giữ lại)
  - H2: /context thực sự báo cáo gì
  - H2: Liên quan

## concepts/delegate-architecture.md

- Tuyến: /concepts/delegate-architecture
- Tiêu đề:
  - H2: Đại diện là gì?
  - H2: Vì sao dùng đại diện?
  - H2: Các tầng năng lực
  - H3: Tầng 1: Chỉ đọc + bản nháp
  - H3: Tầng 2: Gửi thay mặt
  - H3: Tầng 3: Chủ động
  - H2: Điều kiện tiên quyết: cô lập và gia cố
  - H3: Chặn cứng (không thể thương lượng)
  - H3: Hạn chế công cụ
  - H3: Cô lập sandbox
  - H3: Nhật ký kiểm toán
  - H2: Thiết lập đại diện
  - H3: 1. Tạo tác nhân đại diện
  - H3: 2. Cấu hình ủy quyền nhà cung cấp danh tính
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Gắn đại diện vào kênh
  - H3: 4. Thêm thông tin xác thực vào tác nhân đại diện
  - H2: Ví dụ: trợ lý tổ chức
  - H2: Mẫu mở rộng quy mô
  - H2: Liên quan

## concepts/dreaming.md

- Tuyến: /concepts/dreaming
- Tiêu đề:
  - H2: Dreaming ghi gì
  - H2: Mô hình pha
  - H2: Nạp bản ghi phiên
  - H2: Nhật ký giấc mơ
  - H2: Tín hiệu xếp hạng sâu
  - H2: Phạm vi báo cáo chạy thử bóng QA
  - H2: Lập lịch
  - H2: Bắt đầu nhanh
  - H2: Lệnh slash
  - H2: Quy trình CLI
  - H2: Giá trị mặc định chính
  - H2: Giao diện giấc mơ
  - H2: Dreaming không bao giờ chạy: trạng thái hiển thị bị chặn
  - H2: Liên quan

## concepts/experimental-features.md

- Tuyến: /concepts/experimental-features
- Tiêu đề:
  - H2: Cờ hiện được ghi tài liệu
  - H2: Chế độ gọn nhẹ cho mô hình cục bộ
  - H3: Vì sao là ba công cụ này
  - H3: Khi nào nên bật
  - H3: Khi nào nên để tắt
  - H3: Bật
  - H2: Thử nghiệm không có nghĩa là ẩn
  - H2: Liên quan

## concepts/features.md

- Tuyến: /concepts/features
- Tiêu đề:
  - H2: Điểm nổi bật
  - H2: Danh sách đầy đủ
  - H2: Liên quan

## concepts/mantis-slack-desktop-runbook.md

- Tuyến: /concepts/mantis-slack-desktop-runbook
- Tiêu đề:
  - H2: Mô hình lưu trữ
  - H2: Điều phối GitHub
  - H2: CLI cục bộ
  - H2: Chế độ hydrate
  - H2: Diễn giải thời gian
  - H2: Danh sách kiểm tra bằng chứng
  - H2: Xử lý lỗi
  - H2: Liên quan

## concepts/mantis.md

- Tuyến: /concepts/mantis
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Phi mục tiêu
  - H2: Quyền sở hữu
  - H2: Dạng lệnh
  - H2: Vòng đời lần chạy
  - H2: MVP Discord
  - H2: Các phần QA hiện có
  - H2: Mô hình bằng chứng
  - H2: Trình duyệt và VNC
  - H2: Máy
  - H2: Bí mật
  - H2: Artifact GitHub và bình luận PR
  - H2: Ghi chú triển khai riêng tư
  - H2: Thêm một kịch bản
  - H2: Mở rộng nhà cung cấp
  - H2: Câu hỏi mở

## concepts/markdown-formatting.md

- Tuyến: /concepts/markdown-formatting
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Pipeline
  - H2: Ví dụ IR
  - H2: Nơi được sử dụng
  - H2: Xử lý bảng
  - H2: Quy tắc chia đoạn
  - H2: Chính sách liên kết
  - H2: Spoiler
  - H2: Cách thêm hoặc cập nhật bộ định dạng kênh
  - H2: Lỗi thường gặp
  - H2: Liên quan

## concepts/memory-builtin.md

- Tuyến: /concepts/memory-builtin
- Tiêu đề:
  - H2: Cung cấp những gì
  - H2: Bắt đầu
  - H2: Nhà cung cấp embedding được hỗ trợ
  - H2: Cách lập chỉ mục hoạt động
  - H2: Khi nào nên dùng
  - H2: Khắc phục sự cố
  - H2: Cấu hình
  - H2: Liên quan

## concepts/memory-honcho.md

- Tuyến: /concepts/memory-honcho
- Tiêu đề:
  - H2: Cung cấp những gì
  - H2: Công cụ có sẵn
  - H2: Bắt đầu
  - H2: Cấu hình
  - H2: Di chuyển bộ nhớ hiện có
  - H2: Cách hoạt động
  - H2: Honcho so với bộ nhớ tích hợp sẵn
  - H2: Lệnh CLI
  - H2: Đọc thêm
  - H2: Liên quan

## concepts/memory-qmd.md

- Tuyến: /concepts/memory-qmd
- Tiêu đề:
  - H2: Bổ sung gì so với tích hợp sẵn
  - H2: Bắt đầu
  - H3: Điều kiện tiên quyết
  - H3: Bật
  - H2: Cách tiến trình phụ hoạt động
  - H2: Hiệu năng tìm kiếm và khả năng tương thích
  - H2: Ghi đè mô hình
  - H2: Lập chỉ mục đường dẫn bổ sung
  - H2: Lập chỉ mục bản ghi phiên
  - H2: Phạm vi tìm kiếm
  - H2: Trích dẫn
  - H2: Khi nào nên dùng
  - H2: Khắc phục sự cố
  - H2: Cấu hình
  - H2: Liên quan

## concepts/memory-search.md

- Tuyến: /concepts/memory-search
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Nhà cung cấp được hỗ trợ
  - H2: Cách tìm kiếm hoạt động
  - H2: Cải thiện chất lượng tìm kiếm
  - H3: Suy giảm theo thời gian
  - H3: MMR (đa dạng)
  - H3: Bật cả hai
  - H2: Bộ nhớ đa phương thức
  - H2: Tìm kiếm bộ nhớ phiên
  - H2: Khắc phục sự cố
  - H2: Đọc thêm
  - H2: Liên quan

## concepts/memory.md

- Tuyến: /concepts/memory
- Tiêu đề:
  - H2: Cách hoạt động
  - H2: Cái gì đi đâu
  - H2: Bộ nhớ nhạy với hành động
  - H2: Cam kết được suy luận
  - H2: Công cụ bộ nhớ
  - H2: Plugin đồng hành Memory Wiki
  - H2: Tìm kiếm bộ nhớ
  - H2: Backend bộ nhớ
  - H2: Lớp wiki tri thức
  - H2: Tự động xả bộ nhớ
  - H2: Dreaming
  - H2: Điền ngược có căn cứ và quảng bá trực tiếp
  - H2: CLI
  - H2: Đọc thêm
  - H2: Liên quan

## concepts/message-lifecycle-refactor.md

- Tuyến: /concepts/message-lifecycle-refactor
- Tiêu đề:
  - H2: Vấn đề
  - H2: Mục tiêu
  - H2: Phi mục tiêu
  - H2: Mô hình tham chiếu
  - H2: Mô hình lõi
  - H2: Thuật ngữ tin nhắn
  - H3: Tin nhắn
  - H3: Đích
  - H3: Quan hệ
  - H3: Nguồn gốc
  - H3: Biên nhận
  - H2: Ngữ cảnh nhận
  - H2: Ngữ cảnh gửi
  - H2: Ngữ cảnh trực tiếp
  - H2: Bề mặt adapter
  - H2: Thu gọn SDK công khai
  - H2: Quan hệ với luồng vào của kênh
  - H2: Rào chắn tương thích
  - H2: Lưu trữ nội bộ
  - H2: Lớp lỗi
  - H2: Ánh xạ kênh
  - H2: Kế hoạch di chuyển
  - H3: Giai đoạn 1: Miền Tin nhắn Nội bộ
  - H3: Giai đoạn 2: Lõi Gửi Bền vững
  - H3: Giai đoạn 3: Cầu nối Luồng vào Kênh
  - H3: Giai đoạn 4: Cầu nối Bộ điều phối Đã chuẩn bị
  - H3: Giai đoạn 5: Vòng đời Trực tiếp Hợp nhất
  - H3: Giai đoạn 6: SDK Công khai
  - H3: Giai đoạn 7: Tất cả bên gửi
  - H3: Giai đoạn 8: Xóa tương thích đặt tên theo lượt
  - H2: Kế hoạch kiểm thử
  - H2: Câu hỏi mở
  - H2: Tiêu chí chấp nhận
  - H2: Liên quan

## concepts/messages.md

- Tuyến: /concepts/messages
- Tiêu đề:
  - H2: Luồng tin nhắn (cấp cao)
  - H2: Khử trùng lặp luồng vào
  - H2: Chống dội luồng vào
  - H2: Phiên và thiết bị
  - H2: Siêu dữ liệu kết quả công cụ
  - H2: Nội dung luồng vào và ngữ cảnh lịch sử
  - H2: Xếp hàng và theo dõi tiếp
  - H2: Quyền sở hữu lần chạy kênh
  - H2: Truyền luồng, chia đoạn và gom lô
  - H2: Khả năng hiển thị suy luận và token
  - H2: Tiền tố, phân luồng và trả lời
  - H2: Trả lời im lặng
  - H2: Liên quan

## concepts/model-failover.md

- Tuyến: /concepts/model-failover
- Tiêu đề:
  - H2: Luồng runtime
  - H2: Chính sách nguồn lựa chọn
  - H2: Bộ nhớ đệm bỏ qua lỗi xác thực
  - H2: Thông báo fallback hiển thị cho người dùng
  - H2: Lưu trữ xác thực (khóa + OAuth)
  - H2: ID hồ sơ
  - H2: Thứ tự xoay vòng
  - H3: Độ bám phiên (thân thiện với bộ nhớ đệm)
  - H3: Gói đăng ký OpenAI Codex cộng bản sao lưu khóa API
  - H2: Thời gian hạ nhiệt
  - H2: Tắt do thanh toán
  - H2: Fallback mô hình
  - H3: Quy tắc chuỗi ứng viên
  - H3: Lỗi nào làm tiến fallback
  - H3: Bỏ qua thời gian hạ nhiệt so với hành vi thăm dò
  - H2: Ghi đè phiên và chuyển đổi mô hình trực tiếp
  - H2: Khả năng quan sát và tóm tắt lỗi
  - H2: Cấu hình liên quan

## concepts/model-providers.md

- Tuyến: /concepts/model-providers
- Tiêu đề:
  - H2: Quy tắc nhanh
  - H2: Hành vi nhà cung cấp do Plugin sở hữu
  - H2: Xoay vòng khóa API
  - H2: Plugin nhà cung cấp chính thức
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: Tùy chọn hosted kiểu đăng ký khác
  - H3: OpenCode
  - H3: Google Gemini (khóa API)
  - H3: Google Vertex và Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Plugin nhà cung cấp đi kèm khác
  - H4: Điều kỳ quặc đáng biết
  - H2: Nhà cung cấp qua models.providers (URL tùy chỉnh/cơ sở)
  - H3: Moonshot AI (Kimi)
  - H3: Lập trình Kimi
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (Quốc tế)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Proxy cục bộ (LM Studio, vLLM, LiteLLM, v.v.)
  - H2: Ví dụ CLI
  - H2: Liên quan

## concepts/models.md

- Tuyến: /concepts/models
- Tiêu đề:
  - H2: Cách lựa chọn mô hình hoạt động
  - H2: Nguồn lựa chọn và hành vi fallback
  - H2: Chính sách mô hình nhanh
  - H2: Onboarding (khuyến nghị)
  - H2: Khóa cấu hình (tổng quan)
  - H3: Chỉnh sửa allowlist an toàn
  - H2: "Model is not allowed" (và vì sao phản hồi dừng)
  - H2: Chuyển mô hình trong chat (/model)
  - H2: Lệnh CLI
  - H3: models list
  - H3: models status
  - H2: Quét (mô hình miễn phí OpenRouter)
  - H2: Sổ đăng ký mô hình (models.json)
  - H2: Liên quan

## concepts/multi-agent.md

- Tuyến: /concepts/multi-agent
- Tiêu đề:
  - H2: "Một tác nhân" là gì?
  - H2: Đường dẫn (bản đồ nhanh)
  - H3: Chế độ một tác nhân (mặc định)
  - H2: Trợ giúp tác nhân
  - H2: Bắt đầu nhanh
  - H2: Nhiều tác nhân = nhiều người, nhiều tính cách
  - H2: Tìm kiếm bộ nhớ QMD liên tác nhân
  - H2: Một số WhatsApp, nhiều người (tách DM)
  - H2: Quy tắc định tuyến (cách tin nhắn chọn tác nhân)
  - H2: Nhiều tài khoản / số điện thoại
  - H2: Khái niệm
  - H2: Ví dụ nền tảng
  - H2: Mẫu phổ biến
  - H2: Sandbox và cấu hình công cụ theo từng tác nhân
  - H2: Liên quan

## concepts/oauth.md

- Tuyến: /concepts/oauth
- Tiêu đề:
  - H2: Bộ nhận token (vì sao nó tồn tại)
  - H2: Lưu trữ (token nằm ở đâu)
  - H2: Tương thích token kế thừa của Anthropic
  - H2: Di chuyển Anthropic Claude CLI
  - H2: Trao đổi OAuth (cách đăng nhập hoạt động)
  - H3: setup-token của Anthropic
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Làm mới + hết hạn
  - H2: Nhiều tài khoản (hồ sơ) + định tuyến
  - H3: 1) Ưu tiên: các tác nhân riêng biệt
  - H3: 2) Nâng cao: nhiều hồ sơ trong một tác nhân
  - H2: Liên quan

## concepts/parallel-specialist-lanes.md

- Tuyến: /concepts/parallel-specialist-lanes
- Tiêu đề:
  - H2: Nguyên tắc cơ bản
  - H2: Lộ trình triển khai khuyến nghị
  - H3: Giai đoạn 1: hợp đồng làn + công việc nặng chạy nền
  - H3: Giai đoạn 2: điều khiển ưu tiên và đồng thời
  - H3: Giai đoạn 3: bộ điều phối / bộ điều khiển lưu lượng
  - H2: Mẫu hợp đồng làn tối thiểu
  - H2: Liên quan

## concepts/personal-agent-benchmark-pack.md

- Tuyến: /concepts/personal-agent-benchmark-pack
- Tiêu đề:
  - H2: Kịch bản
  - H2: Mô hình quyền riêng tư
  - H2: Mở rộng gói

## concepts/presence.md

- Tuyến: /concepts/presence
- Tiêu đề:
  - H2: Trường hiện diện (những gì hiển thị)
  - H2: Bộ tạo (hiện diện đến từ đâu)
  - H3: 1) Mục tự ghi của Gateway
  - H3: 2) Kết nối WebSocket
  - H4: Vì sao các lệnh CLI dùng một lần không hiển thị
  - H3: 3) tín hiệu system-event
  - H3: 4) Node kết nối (vai trò: node)
  - H2: Quy tắc hợp nhất + khử trùng lặp (vì sao instanceId quan trọng)
  - H2: TTL và kích thước giới hạn
  - H2: Lưu ý remote/tunnel (IP loopback)
  - H2: Bên tiêu thụ
  - H3: Thẻ Phiên bản macOS
  - H2: Mẹo gỡ lỗi
  - H2: Liên quan

## concepts/progress-drafts.md

- Tuyến: /concepts/progress-drafts
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Những gì người dùng thấy
  - H2: Chọn một chế độ
  - H2: Cấu hình nhãn
  - H2: Điều khiển dòng tiến trình
  - H2: Hành vi kênh
  - H2: Hoàn tất
  - H2: Khắc phục sự cố
  - H2: Liên quan

## concepts/qa-e2e-automation.md

- Tuyến: /concepts/qa-e2e-automation
- Tiêu đề:
  - H2: Bề mặt lệnh
  - H2: Luồng thao tác
  - H2: Phạm vi kiểm thử transport trực tiếp
  - H2: Tham chiếu QA cho Telegram, Discord, Slack và WhatsApp
  - H3: Cờ CLI dùng chung
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Thiết lập workspace Slack
  - H3: QA WhatsApp
  - H3: Nhóm thông tin xác thực Convex
  - H2: Seed dựa trên repo
  - H2: Làn mô phỏng nhà cung cấp
  - H2: Bộ chuyển đổi transport
  - H3: Thêm một kênh
  - H3: Tên helper kịch bản
  - H2: Báo cáo
  - H2: Tài liệu liên quan

## concepts/qa-matrix.md

- Tuyến: /concepts/qa-matrix
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Làn này làm gì
  - H2: CLI
  - H3: Cờ phổ biến
  - H3: Cờ nhà cung cấp
  - H2: Hồ sơ
  - H2: Kịch bản
  - H2: Biến môi trường
  - H2: Tạo phẩm đầu ra
  - H2: Mẹo phân loại
  - H2: Hợp đồng transport trực tiếp
  - H2: Liên quan

## concepts/queue-steering.md

- Tuyến: /concepts/queue-steering
- Tiêu đề:
  - H2: Ranh giới runtime
  - H2: Chế độ
  - H2: Ví dụ burst
  - H2: Phạm vi
  - H2: Debounce
  - H2: Liên quan

## concepts/queue.md

- Tuyến: /concepts/queue
- Tiêu đề:
  - H2: Vì sao
  - H2: Cách hoạt động
  - H2: Mặc định
  - H2: Chế độ hàng đợi
  - H2: Tùy chọn hàng đợi
  - H2: Điều hướng và streaming
  - H2: Thứ tự ưu tiên
  - H2: Ghi đè theo từng phiên
  - H2: Phạm vi và bảo đảm
  - H2: Khắc phục sự cố
  - H2: Liên quan

## concepts/retry.md

- Tuyến: /concepts/retry
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Mặc định
  - H2: Hành vi
  - H3: Nhà cung cấp mô hình
  - H3: Discord
  - H3: Telegram
  - H2: Cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## concepts/session-pruning.md

- Tuyến: /concepts/session-pruning
- Tiêu đề:
  - H2: Vì sao điều này quan trọng
  - H2: Cách hoạt động
  - H2: Dọn dẹp hình ảnh kế thừa
  - H2: Mặc định thông minh
  - H2: Bật hoặc tắt
  - H2: Cắt tỉa so với Compaction
  - H2: Đọc thêm
  - H2: Liên quan

## concepts/session-tool.md

- Tuyến: /concepts/session-tool
- Tiêu đề:
  - H2: Công cụ có sẵn
  - H2: Liệt kê và đọc phiên
  - H2: Gửi tin nhắn xuyên phiên
  - H2: Helper trạng thái và điều phối
  - H2: Tạo tác nhân con
  - H2: Khả năng hiển thị
  - H2: Đọc thêm
  - H2: Liên quan

## concepts/session.md

- Tuyến: /concepts/session
- Tiêu đề:
  - H2: Cách tin nhắn được định tuyến
  - H2: Cô lập DM
  - H3: Kênh đã liên kết với Dock
  - H2: Vòng đời phiên
  - H2: Trạng thái nằm ở đâu
  - H2: Bảo trì phiên
  - H2: Kiểm tra phiên
  - H2: Đọc thêm
  - H2: Liên quan

## concepts/soul.md

- Tuyến: /concepts/soul
- Tiêu đề:
  - H2: Những gì thuộc về SOUL.md
  - H2: Vì sao cách này hiệu quả
  - H2: Prompt Molty
  - H2: Trông như thế nào là tốt
  - H2: Một cảnh báo
  - H2: Liên quan

## concepts/streaming.md

- Tuyến: /concepts/streaming
- Tiêu đề:
  - H2: Streaming khối (tin nhắn kênh)
  - H3: Phân phối media với streaming khối
  - H2: Thuật toán chia khúc (giới hạn thấp/cao)
  - H2: Gộp lại (hợp nhất các khối đã stream)
  - H2: Nhịp độ giống con người giữa các khối
  - H2: "Stream từng đoạn hoặc toàn bộ"
  - H2: Chế độ streaming xem trước
  - H3: Ánh xạ kênh
  - H3: Hành vi runtime
  - H3: Cập nhật xem trước tiến trình công cụ
  - H3: Làn tiến trình commentary
  - H2: Liên quan

## concepts/system-prompt.md

- Tuyến: /concepts/system-prompt
- Tiêu đề:
  - H2: Cấu trúc
  - H2: Chế độ prompt
  - H2: Snapshot prompt
  - H2: Chèn bootstrap workspace
  - H2: Xử lý thời gian
  - H2: Skills
  - H2: Tài liệu
  - H2: Liên quan

## concepts/timezone.md

- Tuyến: /concepts/timezone
- Tiêu đề:
  - H2: Ba bề mặt múi giờ
  - H2: Đặt múi giờ người dùng
  - H2: Khi nào cần ghi đè
  - H2: Liên quan

## concepts/typebox.md

- Tuyến: /concepts/typebox
- Tiêu đề:
  - H2: Mô hình tư duy (30 giây)
  - H2: Schema nằm ở đâu
  - H2: Pipeline hiện tại
  - H2: Cách schema được dùng tại runtime
  - H2: Frame ví dụ
  - H2: Client tối thiểu (Node.js)
  - H2: Ví dụ hoàn chỉnh: thêm một phương thức từ đầu đến cuối
  - H2: Hành vi codegen Swift
  - H2: Phiên bản hóa + tương thích
  - H2: Mẫu và quy ước schema
  - H2: JSON schema trực tiếp
  - H2: Khi bạn thay đổi schema
  - H2: Liên quan

## concepts/typing-indicators.md

- Tuyến: /concepts/typing-indicators
- Tiêu đề:
  - H2: Mặc định
  - H2: Chế độ
  - H2: Cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## concepts/usage-tracking.md

- Tuyến: /concepts/usage-tracking
- Tiêu đề:
  - H2: Nó là gì
  - H2: Nó hiển thị ở đâu
  - H2: Chế độ footer mức sử dụng mặc định
  - H3: Ba trạng thái phiên riêng biệt
  - H3: Thứ tự ưu tiên
  - H3: Đặt lại so với tắt
  - H3: Hành vi bật/tắt
  - H3: Cấu hình
  - H2: Footer /usage full tùy chỉnh
  - H3: Hình dạng
  - H3: Đường dẫn hợp đồng
  - H3: Động từ
  - H3: Dạng mảnh
  - H3: Ví dụ
  - H2: Nhà cung cấp + thông tin xác thực
  - H2: Liên quan

## date-time.md

- Tuyến: /date-time
- Tiêu đề:
  - H2: Bao thư tin nhắn (mặc định là cục bộ)
  - H3: Ví dụ
  - H2: Prompt hệ thống: ngày và giờ hiện tại
  - H2: Dòng sự kiện hệ thống (mặc định là cục bộ)
  - H3: Cấu hình múi giờ người dùng + định dạng
  - H2: Phát hiện định dạng thời gian (tự động)
  - H2: Payload công cụ + connector (thời gian thô của nhà cung cấp + trường đã chuẩn hóa)
  - H2: Tài liệu liên quan

## debug/node-issue.md

- Tuyến: /debug/node-issue
- Tiêu đề:
  - H1: Sự cố Node + tsx "\\name is not a function"
  - H2: Tóm tắt
  - H2: Môi trường
  - H2: Tái hiện (chỉ Node)
  - H2: Tái hiện tối thiểu trong repo
  - H2: Kiểm tra phiên bản Node
  - H2: Ghi chú / giả thuyết
  - H2: Lịch sử hồi quy
  - H2: Cách khắc phục tạm thời
  - H2: Tham chiếu
  - H2: Bước tiếp theo
  - H2: Liên quan

## diagnostics/flags.md

- Tuyến: /diagnostics/flags
- Tiêu đề:
  - H2: Cách hoạt động
  - H2: Bật qua cấu hình
  - H2: Ghi đè env (một lần)
  - H2: Cờ profiling
  - H2: Tạo phẩm timeline
  - H2: Log đi đâu
  - H2: Trích xuất log
  - H2: Ghi chú
  - H2: Liên quan

## gateway/authentication.md

- Tuyến: /gateway/authentication
- Tiêu đề:
  - H2: Thiết lập khuyến nghị (khóa API, bất kỳ nhà cung cấp nào)
  - H2: Anthropic: Tương thích Claude CLI và token
  - H2: Ghi chú Anthropic
  - H2: Kiểm tra trạng thái xác thực mô hình
  - H2: Hành vi xoay vòng khóa API (gateway)
  - H2: Gỡ xác thực nhà cung cấp trong khi gateway đang chạy
  - H2: Kiểm soát thông tin xác thực nào được dùng
  - H3: OpenAI và id openai-codex kế thừa
  - H3: Trong khi đăng nhập (CLI)
  - H3: Theo từng phiên (lệnh chat)
  - H3: Theo từng tác nhân (ghi đè CLI)
  - H2: Khắc phục sự cố
  - H3: "Không tìm thấy thông tin xác thực"
  - H3: Token sắp hết hạn/đã hết hạn
  - H2: Liên quan

## gateway/background-process.md

- Tuyến: /gateway/background-process
- Tiêu đề:
  - H2: công cụ exec
  - H2: Bắc cầu tiến trình con
  - H2: công cụ process
  - H2: Ví dụ
  - H2: Liên quan

## gateway/bonjour.md

- Tuyến: /gateway/bonjour
- Tiêu đề:
  - H2: Bonjour diện rộng (Unicast DNS-SD) qua Tailscale
  - H3: Cấu hình Gateway (khuyến nghị)
  - H3: Thiết lập máy chủ DNS một lần (máy chủ Gateway)
  - H3: Cài đặt DNS Tailscale
  - H3: Bảo mật trình nghe Gateway (khuyến nghị)
  - H2: Những gì được quảng bá
  - H2: Loại dịch vụ
  - H2: Khóa TXT (gợi ý không bí mật)
  - H2: Gỡ lỗi trên macOS
  - H2: Gỡ lỗi trong log Gateway
  - H2: Gỡ lỗi trên Node iOS
  - H2: Khi nào bật Bonjour
  - H2: Khi nào tắt Bonjour
  - H2: Vấn đề thường gặp với Docker
  - H2: Khắc phục sự cố Bonjour bị tắt
  - H2: Chế độ lỗi thường gặp
  - H2: Tên phiên bản đã escape (\032)
  - H2: Bật / tắt / cấu hình
  - H2: Tài liệu liên quan

## gateway/bridge-protocol.md

- Tuyến: /gateway/bridge-protocol
- Tiêu đề:
  - H2: Vì sao nó từng tồn tại
  - H2: Transport
  - H2: Handshake + ghép đôi
  - H2: Frame
  - H2: Sự kiện vòng đời exec
  - H2: Cách dùng tailnet trong lịch sử
  - H2: Phiên bản hóa
  - H2: Liên quan

## gateway/cli-backends.md

- Tuyến: /gateway/cli-backends
- Tiêu đề:
  - H2: Bắt đầu nhanh thân thiện với người mới
  - H2: Dùng làm dự phòng
  - H2: Tổng quan cấu hình
  - H3: Cấu hình ví dụ
  - H2: Cách hoạt động
  - H2: Phiên
  - H2: Phần mở đầu dự phòng từ các phiên claude-cli
  - H2: Hình ảnh (truyền thẳng)
  - H2: Đầu vào / đầu ra
  - H2: Mặc định (do Plugin sở hữu)
  - H2: Mặc định do Plugin sở hữu
  - H2: Quyền sở hữu Compaction gốc
  - H2: Lớp phủ MCP trong bundle
  - H2: Giới hạn gieo lại lịch sử
  - H2: Hạn chế
  - H2: Khắc phục sự cố
  - H2: Liên quan

## gateway/config-agents.md

- Tuyến: /gateway/config-agents
- Tiêu đề:
  - H2: Mặc định tác nhân
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Ghi đè hồ sơ bootstrap theo từng tác nhân
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Bản đồ quyền sở hữu ngân sách ngữ cảnh
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Chính sách runtime
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Streaming khối
  - H3: Chỉ báo đang nhập
  - H3: agents.defaults.sandbox
  - H3: agents.list (ghi đè theo từng tác nhân)
  - H2: Định tuyến đa tác nhân
  - H3: Trường khớp ràng buộc
  - H3: Hồ sơ truy cập theo từng tác nhân
  - H2: Phiên
  - H2: Tin nhắn
  - H3: Tiền tố phản hồi
  - H3: Phản ứng xác nhận
  - H3: Debounce đầu vào
  - H3: TTS (text-to-speech)
  - H2: Trò chuyện
  - H2: Liên quan

## gateway/config-channels.md

- Tuyến: /gateway/config-channels
- Tiêu đề:
  - H2: Kênh
  - H3: Quyền truy cập DM và nhóm
  - H3: Ghi đè mô hình theo kênh
  - H3: Mặc định kênh và Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Đa tài khoản (tất cả kênh)
  - H3: Các kênh Plugin khác
  - H3: Cổng kiểm soát nhắc tên trong trò chuyện nhóm
  - H4: Giới hạn lịch sử DM
  - H4: Chế độ tự trò chuyện
  - H3: Lệnh (xử lý lệnh trò chuyện)
  - H2: Liên quan

## gateway/config-tools.md

- Tuyến: /gateway/config-tools
- Tiêu đề:
  - H2: Công cụ
  - H3: Hồ sơ công cụ
  - H3: Nhóm công cụ
  - H3: Công cụ MCP và Plugin trong chính sách công cụ sandbox
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: Nhà cung cấp tùy chỉnh và URL cơ sở
  - H3: Chi tiết trường nhà cung cấp
  - H3: Ví dụ về nhà cung cấp
  - H2: Liên quan

## gateway/configuration-examples.md

- Tuyến: /gateway/configuration-examples
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H3: Tối thiểu tuyệt đối
  - H3: Khởi đầu được khuyến nghị
  - H2: Ví dụ mở rộng (các tùy chọn chính)
  - H3: Kho kỹ năng ngang hàng được liên kết symlink
  - H2: Mẫu phổ biến
  - H3: Nền tảng kỹ năng dùng chung với một ghi đè
  - H3: Thiết lập đa nền tảng
  - H3: Tự động phê duyệt mạng Node đáng tin cậy
  - H3: Chế độ DM bảo mật (hộp thư đến dùng chung / DM nhiều người dùng)
  - H3: Khóa API Anthropic + dự phòng MiniMax
  - H3: Bot công việc (quyền truy cập bị hạn chế)
  - H3: Chỉ mô hình cục bộ
  - H2: Mẹo
  - H2: Liên quan

## gateway/configuration-reference.md

- Tuyến: /gateway/configuration-reference
- Tiêu đề:
  - H2: Kênh
  - H2: Mặc định agent, đa agent, phiên và tin nhắn
  - H2: Công cụ và nhà cung cấp tùy chỉnh
  - H2: Mô hình
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Cấu hình Plugin bộ chạy Codex
  - H2: Cam kết
  - H2: Trình duyệt
  - H2: Giao diện người dùng
  - H2: Gateway
  - H3: Điểm cuối tương thích OpenAI
  - H3: Cô lập đa phiên bản
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hook
  - H3: Tích hợp Gmail
  - H2: Máy chủ Plugin canvas
  - H2: Khám phá
  - H3: mDNS (Bonjour)
  - H3: Diện rộng (DNS-SD)
  - H2: Môi trường
  - H3: env (biến môi trường nội tuyến)
  - H3: Thay thế biến môi trường
  - H2: Bí mật
  - H3: SecretRef
  - H3: Bề mặt thông tin xác thực được hỗ trợ
  - H3: Cấu hình nhà cung cấp bí mật
  - H2: Lưu trữ xác thực
  - H3: auth.cooldowns
  - H2: Ghi log
  - H2: Chẩn đoán
  - H2: Cập nhật
  - H2: ACP
  - H2: CLI
  - H2: Trình hướng dẫn
  - H2: Danh tính
  - H2: Cầu nối (cũ, đã gỡ bỏ)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Biến mẫu mô hình phương tiện
  - H2: Bao gồm cấu hình ($include)
  - H2: Liên quan

## gateway/configuration.md

- Tuyến: /gateway/configuration
- Tiêu đề:
  - H2: Cấu hình tối thiểu
  - H2: Chỉnh sửa cấu hình
  - H2: Xác thực nghiêm ngặt
  - H2: Tác vụ phổ biến
  - H2: Tải lại nóng cấu hình
  - H3: Chế độ tải lại
  - H3: Nội dung áp dụng nóng so với nội dung cần khởi động lại
  - H3: Lập kế hoạch tải lại
  - H2: RPC cấu hình (cập nhật bằng chương trình)
  - H2: Biến môi trường
  - H2: Tham chiếu đầy đủ
  - H2: Liên quan

## gateway/diagnostics.md

- Tuyến: /gateway/diagnostics
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Lệnh trò chuyện
  - H2: Nội dung bản xuất chứa
  - H2: Mô hình quyền riêng tư
  - H2: Bộ ghi ổn định
  - H2: Tùy chọn hữu ích
  - H2: Tắt chẩn đoán
  - H2: Liên quan

## gateway/discovery.md

- Tuyến: /gateway/discovery
- Tiêu đề:
  - H2: Thuật ngữ
  - H2: Vì sao chúng tôi giữ cả trực tiếp và SSH
  - H2: Đầu vào khám phá (cách client biết Gateway ở đâu)
  - H3: 1) Khám phá Bonjour / DNS-SD
  - H4: Chi tiết beacon dịch vụ
  - H3: 2) Tailnet (liên mạng)
  - H3: 3) Thủ công / đích SSH
  - H2: Chọn transport (chính sách client)
  - H2: Ghép cặp + xác thực (transport trực tiếp)
  - H2: Trách nhiệm theo thành phần
  - H2: Liên quan

## gateway/doctor.md

- Tuyến: /gateway/doctor
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H3: Chế độ headless và tự động hóa
  - H2: Chế độ lint chỉ đọc
  - H2: Chức năng thực hiện (tóm tắt)
  - H2: Điền bù và đặt lại giao diện người dùng Dreams
  - H2: Hành vi chi tiết và lý do
  - H2: Liên quan

## gateway/external-apps.md

- Tuyến: /gateway/external-apps
- Tiêu đề:
  - H2: Những gì hiện có hôm nay
  - H2: Lộ trình được khuyến nghị
  - H2: Mã ứng dụng so với mã Plugin
  - H2: Liên quan

## gateway/gateway-lock.md

- Tuyến: /gateway/gateway-lock
- Tiêu đề:
  - H2: Vì sao
  - H2: Cơ chế
  - H2: Bề mặt lỗi
  - H2: Ghi chú vận hành
  - H2: Liên quan

## gateway/health.md

- Tuyến: /gateway/health
- Tiêu đề:
  - H2: Kiểm tra nhanh
  - H2: Chẩn đoán sâu
  - H2: Cấu hình trình theo dõi sức khỏe
  - H2: Giám sát thời gian hoạt động
  - H3: Ví dụ thiết lập dịch vụ giám sát
  - H2: Khi có lỗi
  - H2: Lệnh "health" chuyên dụng
  - H2: Liên quan

## gateway/heartbeat.md

- Tuyến: /gateway/heartbeat
- Tiêu đề:
  - H2: Bắt đầu nhanh (người mới)
  - H2: Mặc định
  - H2: Prompt Heartbeat dùng để làm gì
  - H2: Hợp đồng phản hồi
  - H2: Cấu hình
  - H3: Phạm vi và thứ tự ưu tiên
  - H3: Heartbeat theo agent
  - H3: Ví dụ giờ hoạt động
  - H3: Thiết lập 24/7
  - H3: Ví dụ đa tài khoản
  - H3: Ghi chú trường
  - H2: Hành vi gửi
  - H2: Điều khiển khả năng hiển thị
  - H3: Mỗi cờ làm gì
  - H3: Ví dụ theo kênh so với theo tài khoản
  - H3: Mẫu phổ biến
  - H2: HEARTBEAT.md (tùy chọn)
  - H3: khối tasks:
  - H3: Agent có thể cập nhật HEARTBEAT.md không?
  - H2: Đánh thức thủ công (theo yêu cầu)
  - H2: Gửi lập luận (tùy chọn)
  - H2: Nhận thức chi phí
  - H2: Tràn ngữ cảnh sau Heartbeat
  - H2: Liên quan

## gateway/index.md

- Tuyến: /gateway
- Tiêu đề:
  - H2: Khởi động cục bộ trong 5 phút
  - H2: Mô hình runtime
  - H2: Điểm cuối tương thích OpenAI
  - H3: Thứ tự ưu tiên cổng và bind
  - H3: Chế độ tải lại nóng
  - H2: Bộ lệnh operator
  - H2: Nhiều Gateway (cùng máy chủ)
  - H2: Truy cập từ xa
  - H2: Giám sát và vòng đời dịch vụ
  - H2: Lộ trình nhanh cho hồ sơ dev
  - H2: Tham chiếu nhanh giao thức (góc nhìn operator)
  - H2: Kiểm tra vận hành
  - H3: Tính còn sống
  - H3: Tính sẵn sàng
  - H3: Khôi phục khoảng trống
  - H2: Dấu hiệu lỗi phổ biến
  - H2: Bảo đảm an toàn
  - H2: Liên quan

## gateway/local-model-services.md

- Tuyến: /gateway/local-model-services
- Tiêu đề:
  - H2: Cách hoạt động
  - H2: Hình dạng cấu hình
  - H2: Trường
  - H2: Ví dụ Inferrs
  - H2: Ví dụ ds4
  - H2: Ghi chú vận hành
  - H2: Liên quan

## gateway/local-models.md

- Tuyến: /gateway/local-models
- Tiêu đề:
  - H2: Mức phần cứng tối thiểu
  - H2: Chọn backend
  - H2: Khuyến nghị: LM Studio + mô hình cục bộ lớn (Responses API)
  - H3: Cấu hình lai: hosted chính, cục bộ dự phòng
  - H3: Ưu tiên cục bộ với lưới an toàn hosted
  - H3: Hosting theo khu vực / định tuyến dữ liệu
  - H2: Proxy cục bộ tương thích OpenAI khác
  - H2: Backend nhỏ hơn hoặc nghiêm ngặt hơn
  - H2: Khắc phục sự cố
  - H2: Liên quan

## gateway/logging.md

- Tuyến: /gateway/logging
- Tiêu đề:
  - H1: Ghi log
  - H2: Trình ghi log dựa trên tệp
  - H2: Thu thập console
  - H2: Biên tập ẩn
  - H2: Log WebSocket của Gateway
  - H3: Kiểu log WS
  - H2: Định dạng console (ghi log phân hệ)
  - H2: Liên quan

## gateway/multiple-gateways.md

- Tuyến: /gateway/multiple-gateways
- Tiêu đề:
  - H2: Thiết lập được khuyến nghị nhất
  - H2: Bắt đầu nhanh Rescue-Bot
  - H2: Vì sao cách này hoạt động
  - H2: Những gì --profile rescue onboard thay đổi
  - H2: Thiết lập nhiều Gateway chung
  - H2: Danh sách kiểm tra cô lập
  - H2: Ánh xạ cổng (suy ra)
  - H2: Ghi chú trình duyệt/CDP (lỗi thường gặp)
  - H2: Ví dụ env thủ công
  - H2: Kiểm tra nhanh
  - H2: Liên quan

## gateway/network-model.md

- Tuyến: /gateway/network-model
- Tiêu đề:
  - H2: Liên quan

## gateway/openai-http-api.md

- Tuyến: /gateway/openai-http-api
- Tiêu đề:
  - H2: Xác thực
  - H2: Ranh giới bảo mật (quan trọng)
  - H2: Khi nào dùng điểm cuối này
  - H2: Hợp đồng mô hình ưu tiên agent
  - H2: Bật điểm cuối
  - H2: Tắt điểm cuối
  - H2: Hành vi phiên
  - H2: Vì sao bề mặt này quan trọng
  - H2: Danh sách mô hình và định tuyến agent
  - H2: Streaming (SSE)
  - H2: Hợp đồng công cụ chat
  - H3: Trường yêu cầu được hỗ trợ
  - H3: Biến thể không được hỗ trợ
  - H3: Hình dạng phản hồi công cụ không streaming
  - H3: Hình dạng phản hồi công cụ streaming
  - H3: Vòng lặp theo sau công cụ
  - H2: Thiết lập nhanh Open WebUI
  - H2: Ví dụ
  - H2: Liên quan

## gateway/openresponses-http-api.md

- Tuyến: /gateway/openresponses-http-api
- Tiêu đề:
  - H2: Xác thực, bảo mật và định tuyến
  - H2: Hành vi phiên
  - H2: Hình dạng yêu cầu (được hỗ trợ)
  - H2: Mục (đầu vào)
  - H3: message
  - H3: functioncalloutput (công cụ theo lượt)
  - H3: reasoning và itemreference
  - H2: Công cụ (công cụ hàm phía client)
  - H2: Hình ảnh (inputimage)
  - H2: Tệp (inputfile)
  - H2: Giới hạn tệp + hình ảnh (cấu hình)
  - H2: Streaming (SSE)
  - H2: Mức sử dụng
  - H2: Lỗi
  - H2: Ví dụ
  - H2: Liên quan

## gateway/openshell.md

- Tuyến: /gateway/openshell
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Bắt đầu nhanh
  - H2: Chế độ workspace
  - H3: mirror
  - H3: remote
  - H3: Chọn chế độ
  - H2: Tham chiếu cấu hình
  - H2: Ví dụ
  - H3: Thiết lập remote tối thiểu
  - H3: Chế độ mirror với GPU
  - H3: OpenShell theo agent với Gateway tùy chỉnh
  - H2: Quản lý vòng đời
  - H3: Khi nào tạo lại
  - H2: Gia cố bảo mật
  - H2: Giới hạn hiện tại
  - H2: Cách hoạt động
  - H2: Liên quan

## gateway/opentelemetry.md

- Tuyến: /gateway/opentelemetry
- Tiêu đề:
  - H2: Cách các phần khớp với nhau
  - H2: Bắt đầu nhanh
  - H2: Tín hiệu được xuất
  - H2: Tham chiếu cấu hình
  - H3: Biến môi trường
  - H2: Quyền riêng tư và thu thập nội dung
  - H2: Lấy mẫu và flush
  - H2: Chỉ số được xuất
  - H3: Mức sử dụng mô hình
  - H3: Luồng tin nhắn
  - H3: Talk
  - H3: Hàng đợi và phiên
  - H3: Telemetry tính còn sống của phiên
  - H3: Vòng đời bộ chạy
  - H3: Thực thi công cụ
  - H3: Exec
  - H3: Nội bộ chẩn đoán (bộ nhớ và vòng lặp công cụ)
  - H2: Span được xuất
  - H2: Danh mục sự kiện chẩn đoán
  - H2: Không có exporter
  - H2: Tắt
  - H2: Liên quan

## gateway/operator-scopes.md

- Tuyến: /gateway/operator-scopes
- Tiêu đề:
  - H2: Vai trò
  - H2: Cấp phạm vi
  - H2: Phạm vi phương thức chỉ là cổng đầu tiên
  - H2: Phê duyệt ghép cặp thiết bị
  - H2: Phê duyệt ghép cặp Node
  - H2: Xác thực bằng bí mật dùng chung

## gateway/pairing.md

- Tuyến: /gateway/pairing
- Tiêu đề:
  - H2: Khái niệm
  - H2: Cách ghép cặp hoạt động
  - H2: Quy trình CLI (thân thiện với headless)
  - H2: Bề mặt API (giao thức Gateway)
  - H2: Cổng kiểm soát lệnh Node (2026.3.31+)
  - H2: Ranh giới tin cậy sự kiện Node (2026.3.31+)
  - H2: Tự động phê duyệt (ứng dụng macOS)
  - H2: Tự động phê duyệt thiết bị Trusted-CIDR
  - H2: Tự động phê duyệt nâng cấp metadata
  - H2: Trình hỗ trợ ghép cặp QR
  - H2: Tính cục bộ và header được chuyển tiếp
  - H2: Lưu trữ (cục bộ, riêng tư)
  - H2: Hành vi transport
  - H2: Liên quan

## gateway/prometheus.md

- Tuyến: /gateway/prometheus
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Chỉ số được xuất
  - H2: Chính sách nhãn
  - H2: Công thức PromQL
  - H2: Chọn giữa xuất Prometheus và OpenTelemetry
  - H2: Khắc phục sự cố
  - H2: Liên quan

## gateway/protocol.md

- Tuyến: /gateway/protocol
- Tiêu đề:
  - H2: Transport
  - H2: Bắt tay (kết nối)
  - H3: Ví dụ Node
  - H2: Đóng khung
  - H2: Vai trò + phạm vi
  - H3: Vai trò
  - H3: Phạm vi (operator)
  - H3: Khả năng/lệnh/quyền (Node)
  - H2: Hiện diện
  - H3: Sự kiện Node nền còn sống
  - H2: Phạm vi sự kiện broadcast
  - H2: Các họ phương thức RPC phổ biến
  - H3: Các họ sự kiện phổ biến
  - H3: Phương thức trợ giúp Node
  - H3: RPC sổ cái tác vụ
  - H3: Phương thức trợ giúp operator
  - H3: Dạng xem models.list
  - H2: Phê duyệt exec
  - H2: Dự phòng gửi agent
  - H2: Phiên bản hóa
  - H3: Hằng số client
  - H2: Xác thực
  - H2: Danh tính thiết bị + ghép cặp
  - H3: Chẩn đoán di chuyển xác thực thiết bị
  - H2: TLS + pinning
  - H2: Phạm vi
  - H2: Liên quan

## gateway/remote-gateway-readme.md

- Tuyến: /gateway/remote-gateway-readme
- Tiêu đề:
  - H1: Chạy OpenClaw.app với Gateway từ xa
  - H2: Tổng quan
  - H2: Thiết lập nhanh
  - H3: Bước 1: Thêm cấu hình SSH
  - H3: Bước 2: Sao chép khóa SSH
  - H3: Bước 3: Cấu hình xác thực Gateway từ xa
  - H3: Bước 4: Khởi động đường hầm SSH
  - H3: Bước 5: Khởi động lại OpenClaw.app
  - H2: Tự động khởi động đường hầm khi đăng nhập
  - H3: Tạo tệp PLIST
  - H3: Tải Launch Agent
  - H2: Khắc phục sự cố
  - H2: Cách hoạt động
  - H2: Liên quan

## gateway/remote.md

- Tuyến: /gateway/remote
- Tiêu đề:
  - H2: Ý tưởng cốt lõi
  - H2: Các thiết lập VPN và tailnet phổ biến
  - H3: Gateway luôn bật trong tailnet của bạn
  - H3: Máy tính để bàn ở nhà chạy Gateway
  - H3: Máy tính xách tay chạy Gateway
  - H2: Luồng lệnh (chạy ở đâu)
  - H2: Đường hầm SSH (CLI + công cụ)
  - H2: Mặc định từ xa của CLI
  - H2: Thứ tự ưu tiên thông tin xác thực
  - H2: Truy cập từ xa Chat UI
  - H2: Chế độ từ xa của ứng dụng macOS
  - H2: Quy tắc bảo mật (từ xa/VPN)
  - H3: macOS: đường hầm SSH bền vững qua LaunchAgent
  - H4: Bước 1: thêm cấu hình SSH
  - H4: Bước 2: sao chép khóa SSH (một lần)
  - H4: Bước 3: cấu hình token Gateway
  - H4: Bước 4: tạo LaunchAgent
  - H4: Bước 5: tải LaunchAgent
  - H4: Khắc phục sự cố
  - H2: Liên quan

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Tuyến: /gateway/sandbox-vs-tool-policy-vs-elevated
- Tiêu đề:
  - H2: Gỡ lỗi nhanh
  - H2: Sandbox: nơi công cụ chạy
  - H3: Bind mount (kiểm tra nhanh về bảo mật)
  - H2: Chính sách công cụ: công cụ nào tồn tại/có thể gọi
  - H3: Nhóm công cụ (viết tắt)
  - H2: Elevated: "chạy trên máy chủ" chỉ dành cho exec
  - H2: Các cách sửa "sandbox jail" phổ biến
  - H3: "Công cụ X bị chặn bởi chính sách công cụ sandbox"
  - H3: "Tôi tưởng đây là main, tại sao nó lại bị sandbox?"
  - H2: Liên quan

## gateway/sandboxing.md

- Tuyến: /gateway/sandboxing
- Tiêu đề:
  - H2: Những gì được sandbox
  - H2: Chế độ
  - H2: Phạm vi
  - H2: Backend
  - H3: Chọn backend
  - H3: Backend Docker
  - H3: Backend SSH
  - H3: Backend OpenShell
  - H4: Chế độ workspace
  - H4: Vòng đời OpenShell
  - H2: Truy cập workspace
  - H2: Bind mount tùy chỉnh
  - H2: Image và thiết lập
  - H2: setupCommand (thiết lập container một lần)
  - H2: Chính sách công cụ và lối thoát
  - H2: Ghi đè đa agent
  - H2: Ví dụ bật tối thiểu
  - H2: Liên quan

## gateway/secrets-plan-contract.md

- Tuyến: /gateway/secrets-plan-contract
- Tiêu đề:
  - H2: Hình dạng tệp kế hoạch
  - H2: Upsert và xóa provider
  - H2: Phạm vi mục tiêu được hỗ trợ
  - H2: Hành vi của loại mục tiêu
  - H2: Quy tắc xác thực đường dẫn
  - H2: Hành vi khi lỗi
  - H2: Hành vi đồng ý của provider exec
  - H2: Ghi chú về phạm vi runtime và kiểm toán
  - H2: Kiểm tra của operator
  - H2: Tài liệu liên quan

## gateway/secrets.md

- Tuyến: /gateway/secrets
- Tiêu đề:
  - H2: Mục tiêu và mô hình runtime
  - H2: Ranh giới truy cập của agent
  - H2: Lọc bề mặt đang hoạt động
  - H2: Chẩn đoán bề mặt xác thực Gateway
  - H2: Preflight tham chiếu onboarding
  - H2: Hợp đồng SecretRef
  - H2: Cấu hình provider
  - H2: Khóa API dựa trên tệp
  - H2: Ví dụ tích hợp exec
  - H2: Biến môi trường máy chủ MCP
  - H2: Vật liệu xác thực SSH sandbox
  - H2: Bề mặt thông tin xác thực được hỗ trợ
  - H2: Hành vi bắt buộc và thứ tự ưu tiên
  - H2: Trình kích hoạt kích hoạt
  - H2: Tín hiệu suy giảm và khôi phục
  - H2: Phân giải đường dẫn lệnh
  - H2: Quy trình kiểm toán và cấu hình
  - H2: Chính sách an toàn một chiều
  - H2: Ghi chú tương thích xác thực cũ
  - H2: Ghi chú Web UI
  - H2: Liên quan

## gateway/security/audit-checks.md

- Tuyến: /gateway/security/audit-checks
- Tiêu đề:
  - H2: Liên quan

## gateway/security/exposure-runbook.md

- Tuyến: /gateway/security/exposure-runbook
- Tiêu đề:
  - H2: Chọn mẫu phơi lộ
  - H2: Kiểm kê trước khi chạy
  - H2: Kiểm tra baseline
  - H2: Baseline an toàn tối thiểu
  - H2: Phơi lộ DM và nhóm
  - H2: Kiểm tra reverse proxy
  - H2: Đánh giá công cụ và sandbox
  - H2: Xác thực sau thay đổi
  - H2: Kế hoạch rollback
  - H2: Danh sách kiểm tra đánh giá

## gateway/security/index.md

- Tuyến: /gateway/security
- Tiêu đề:
  - H2: Phạm vi trước tiên: mô hình bảo mật trợ lý cá nhân
  - H2: Kiểm tra nhanh: kiểm toán bảo mật openclaw
  - H3: Khóa phụ thuộc gói đã phát hành
  - H3: Triển khai và độ tin cậy của máy chủ
  - H3: Thao tác tệp an toàn
  - H3: Workspace Slack dùng chung: rủi ro thực sự
  - H3: Agent dùng chung trong công ty: mẫu chấp nhận được
  - H2: Khái niệm độ tin cậy Gateway và Node
  - H2: Ma trận ranh giới tin cậy
  - H2: Không phải lỗ hổng theo thiết kế
  - H2: Baseline được gia cố trong 60 giây
  - H2: Quy tắc nhanh cho hộp thư dùng chung
  - H2: Mô hình hiển thị ngữ cảnh
  - H2: Nội dung kiểm toán kiểm tra (cấp cao)
  - H2: Bản đồ lưu trữ thông tin xác thực
  - H2: Danh sách kiểm tra kiểm toán bảo mật
  - H2: Thuật ngữ kiểm toán bảo mật
  - H2: Control UI qua HTTP
  - H2: Tóm tắt cờ không an toàn hoặc nguy hiểm
  - H2: Cấu hình reverse proxy
  - H2: Ghi chú HSTS và origin
  - H2: Nhật ký phiên cục bộ nằm trên đĩa
  - H2: Thực thi Node (system.run)
  - H2: Skills động (watcher / Node từ xa)
  - H2: Mô hình đe dọa
  - H2: Khái niệm cốt lõi: kiểm soát truy cập trước trí tuệ
  - H2: Mô hình ủy quyền lệnh
  - H2: Rủi ro công cụ control plane
  - H2: Plugin
  - H2: Mô hình truy cập DM: ghép đôi, allowlist, mở, tắt
  - H2: Cô lập phiên DM (chế độ đa người dùng)
  - H3: Chế độ DM bảo mật (khuyến nghị)
  - H2: Allowlist cho DM và nhóm
  - H2: Prompt injection (là gì, vì sao quan trọng)
  - H2: Làm sạch token đặc biệt trong nội dung bên ngoài
  - H2: Cờ bỏ qua nội dung bên ngoài không an toàn
  - H3: Prompt injection không yêu cầu DM công khai
  - H3: Backend LLM tự host
  - H3: Sức mạnh mô hình (ghi chú bảo mật)
  - H2: Lập luận và đầu ra chi tiết trong nhóm
  - H2: Ví dụ gia cố cấu hình
  - H3: Quyền tệp
  - H3: Phơi lộ mạng (bind, cổng, tường lửa)
  - H3: Công bố cổng Docker với UFW
  - H3: Khám phá mDNS/Bonjour
  - H3: Khóa WebSocket Gateway (xác thực cục bộ)
  - H3: Header danh tính Tailscale Serve
  - H3: Điều khiển trình duyệt qua máy chủ Node (khuyến nghị)
  - H3: Secret trên đĩa
  - H3: Tệp .env của workspace
  - H3: Nhật ký và transcript (biên tập ẩn và lưu giữ)
  - H3: DM: ghép đôi theo mặc định
  - H3: Nhóm: luôn yêu cầu nhắc đến
  - H3: Số riêng biệt (WhatsApp, Signal, Telegram)
  - H3: Chế độ chỉ đọc (qua sandbox và công cụ)
  - H3: Baseline bảo mật (sao chép/dán)
  - H2: Sandboxing (khuyến nghị)
  - H3: Lan can bảo vệ ủy quyền sub-agent
  - H2: Rủi ro điều khiển trình duyệt
  - H3: Chính sách SSRF của trình duyệt (nghiêm ngặt theo mặc định)
  - H2: Hồ sơ truy cập theo từng agent (đa agent)
  - H3: Ví dụ: toàn quyền truy cập (không sandbox)
  - H3: Ví dụ: công cụ chỉ đọc + workspace chỉ đọc
  - H3: Ví dụ: không truy cập hệ thống tệp/shell (cho phép nhắn tin provider)
  - H2: Ứng phó sự cố
  - H3: Cô lập
  - H3: Xoay vòng (giả định bị xâm phạm nếu secret bị rò rỉ)
  - H3: Kiểm toán
  - H3: Thu thập cho báo cáo
  - H2: Quét secret
  - H2: Báo cáo vấn đề bảo mật

## gateway/security/secure-file-operations.md

- Tuyến: /gateway/security/secure-file-operations
- Tiêu đề:
  - H2: Mặc định: không có helper Python
  - H2: Những gì vẫn được bảo vệ khi không có Python
  - H2: Python bổ sung gì
  - H2: Hướng dẫn cho Plugin và core

## gateway/security/shrinkwrap.md

- Tuyến: /gateway/security/shrinkwrap
- Tiêu đề:
  - H2: Phiên bản dễ hiểu
  - H2: Vì sao OpenClaw sử dụng nó
  - H2: Chi tiết kỹ thuật

## gateway/tailscale.md

- Tuyến: /gateway/tailscale
- Tiêu đề:
  - H2: Chế độ
  - H2: Xác thực
  - H2: Ví dụ cấu hình
  - H3: Chỉ tailnet (Serve)
  - H3: Chỉ tailnet (bind vào IP Tailnet)
  - H3: Internet công khai (Funnel + mật khẩu dùng chung)
  - H2: Ví dụ CLI
  - H2: Ghi chú
  - H2: Điều khiển trình duyệt (Gateway từ xa + trình duyệt cục bộ)
  - H2: Điều kiện tiên quyết + giới hạn của Tailscale
  - H2: Tìm hiểu thêm
  - H2: Liên quan

## gateway/tools-invoke-http-api.md

- Tuyến: /gateway/tools-invoke-http-api
- Tiêu đề:
  - H2: Xác thực
  - H2: Ranh giới bảo mật (quan trọng)
  - H2: Thân yêu cầu
  - H2: Chính sách + hành vi định tuyến
  - H2: Phản hồi
  - H2: Ví dụ
  - H2: Liên quan

## gateway/troubleshooting.md

- Tuyến: /gateway/troubleshooting
- Tiêu đề:
  - H2: Thang lệnh
  - H2: Sau khi cập nhật
  - H2: Cài đặt split brain và guard cấu hình mới hơn
  - H2: Không khớp giao thức sau rollback
  - H2: Symlink Skill bị bỏ qua do thoát đường dẫn
  - H2: Anthropic 429 yêu cầu mức sử dụng bổ sung cho ngữ cảnh dài
  - H2: Phản hồi upstream 403 bị chặn
  - H2: Backend tương thích OpenAI cục bộ vượt qua probe trực tiếp nhưng agent run thất bại
  - H2: Không có phản hồi
  - H2: Kết nối Control UI của dashboard
  - H3: Bản đồ nhanh mã chi tiết xác thực
  - H2: Dịch vụ Gateway không chạy
  - H2: Gateway macOS âm thầm ngừng phản hồi, rồi tiếp tục khi bạn chạm vào dashboard
  - H2: Gateway thoát khi sử dụng nhiều bộ nhớ
  - H2: Gateway từ chối cấu hình không hợp lệ
  - H2: Cảnh báo probe Gateway
  - H2: Kênh đã kết nối, tin nhắn không luân chuyển
  - H2: Phân phối Cron và Heartbeat
  - H2: Node đã ghép đôi, công cụ thất bại
  - H2: Công cụ trình duyệt thất bại
  - H2: Nếu bạn đã nâng cấp và có thứ gì đó đột ngột hỏng
  - H2: Liên quan

## gateway/trusted-proxy-auth.md

- Tuyến: /gateway/trusted-proxy-auth
- Tiêu đề:
  - H2: Khi nào sử dụng
  - H2: Khi nào KHÔNG sử dụng
  - H2: Cách hoạt động
  - H2: Hành vi ghép đôi Control UI
  - H2: Cấu hình
  - H3: Tham chiếu cấu hình
  - H2: Kết thúc TLS và HSTS
  - H3: Hướng dẫn rollout
  - H2: Ví dụ thiết lập proxy
  - H2: Cấu hình token hỗn hợp
  - H2: Header phạm vi operator
  - H2: Danh sách kiểm tra bảo mật
  - H2: Kiểm toán bảo mật
  - H2: Khắc phục sự cố
  - H2: Di chuyển từ xác thực bằng token
  - H2: Liên quan

## help/debugging.md

- Tuyến: /help/debugging
- Tiêu đề:
  - H2: Ghi đè gỡ lỗi runtime
  - H2: Đầu ra trace phiên
  - H2: Trace vòng đời Plugin
  - H2: Khởi động CLI và profiling lệnh
  - H2: Chế độ watch Gateway
  - H2: Hồ sơ dev + Gateway dev (--dev)
  - H2: Ghi nhật ký stream thô (OpenClaw)
  - H2: Ghi nhật ký chunk thô tương thích OpenAI
  - H2: Ghi chú an toàn
  - H2: Gỡ lỗi trong VSCode
  - H3: Thiết lập
  - H3: Ghi chú
  - H2: Liên quan

## help/environment.md

- Tuyến: /help/environment
- Tiêu đề:
  - H2: Thứ tự ưu tiên (cao nhất → thấp nhất)
  - H2: Thông tin xác thực provider và .env workspace
  - H2: Khối env cấu hình
  - H2: Nhập env shell
  - H2: Snapshot shell exec
  - H2: Biến env do runtime chèn
  - H2: Biến env UI
  - H2: Thay thế biến env trong cấu hình
  - H2: Tham chiếu secret so với chuỗi ${ENV}
  - H2: Biến env liên quan đến đường dẫn
  - H2: Ghi nhật ký
  - H3: OPENCLAWHOME
  - H2: Người dùng nvm: lỗi TLS của webfetch
  - H2: Biến môi trường cũ
  - H2: Liên quan

## help/faq-first-run.md

- Tuyến: /help/faq-first-run
- Tiêu đề:
  - H2: Bắt đầu nhanh và thiết lập lần chạy đầu tiên
  - H2: Liên quan

## help/faq-models.md

- Tuyến: /help/faq-models
- Tiêu đề:
  - H2: Mô hình: mặc định, lựa chọn, bí danh, chuyển đổi
  - H2: Chuyển đổi dự phòng mô hình và "Tất cả mô hình đều thất bại"
  - H2: Hồ sơ xác thực: chúng là gì và cách quản lý
  - H2: Liên quan

## help/faq.md

- Tuyến: /help/faq
- Tiêu đề:
  - H2: 60 giây đầu tiên nếu có thứ gì đó bị hỏng
  - H2: Bắt đầu nhanh và thiết lập lần chạy đầu tiên
  - H2: OpenClaw là gì?
  - H2: Skills và tự động hóa
  - H2: Sandboxing và bộ nhớ
  - H2: Nơi mọi thứ nằm trên đĩa
  - H2: Cơ bản về cấu hình
  - H2: Gateway và Node từ xa
  - H2: Biến env và tải .env
  - H2: Phiên và nhiều cuộc trò chuyện
  - H2: Mô hình, chuyển đổi dự phòng và hồ sơ xác thực
  - H2: Gateway: cổng, "đã chạy", và chế độ từ xa
  - H2: Ghi nhật ký và gỡ lỗi
  - H2: Media và tệp đính kèm
  - H2: Bảo mật và kiểm soát truy cập
  - H2: Lệnh chat, hủy tác vụ, và "nó sẽ không dừng"
  - H2: Khác
  - H2: Liên quan

## help/index.md

- Tuyến: /help
- Tiêu đề:
  - H2: FAQ
  - H2: Chẩn đoán
  - H2: Kiểm thử
  - H2: Cộng đồng và meta

## help/scripts.md

- Tuyến: /help/scripts
- Tiêu đề:
  - H2: Quy ước
  - H2: Script giám sát xác thực
  - H2: Helper đọc GitHub
  - H2: Khi thêm script
  - H2: Liên quan

## help/testing-live.md

- Tuyến: /help/testing-live
- Tiêu đề:
  - H2: Trực tiếp: lệnh smoke cục bộ
  - H2: Trực tiếp: quét năng lực nút Android
  - H2: Trực tiếp: smoke mô hình (khóa hồ sơ)
  - H3: Lớp 1: Hoàn tất mô hình trực tiếp (không qua Gateway)
  - H3: Lớp 2: Gateway + smoke tác nhân dev ("@openclaw" thực sự làm gì)
  - H2: Trực tiếp: smoke backend CLI (Claude, Gemini, hoặc CLI cục bộ khác)
  - H2: Trực tiếp: khả năng truy cập proxy APNs HTTP/2
  - H2: Trực tiếp: smoke bind ACP (/acp spawn ... --bind here)
  - H2: Trực tiếp: smoke harness app-server Codex
  - H3: Công thức trực tiếp được khuyến nghị
  - H2: Trực tiếp: ma trận mô hình (những gì chúng tôi bao phủ)
  - H3: Bộ smoke hiện đại (gọi công cụ + hình ảnh)
  - H3: Đường cơ sở: gọi công cụ (Read + Exec tùy chọn)
  - H3: Vision: gửi hình ảnh (tệp đính kèm → thông điệp đa phương thức)
  - H3: Bộ tổng hợp / Gateway thay thế
  - H2: Thông tin xác thực (không bao giờ commit)
  - H2: Deepgram trực tiếp (phiên âm âm thanh)
  - H2: BytePlus coding plan trực tiếp
  - H2: ComfyUI workflow media trực tiếp
  - H2: Tạo hình ảnh trực tiếp
  - H2: Tạo nhạc trực tiếp
  - H2: Tạo video trực tiếp
  - H2: Harness media trực tiếp
  - H2: Liên quan

## help/testing-updates-plugins.md

- Tuyến: /help/testing-updates-plugins
- Tiêu đề:
  - H2: Những gì chúng tôi bảo vệ
  - H2: Bằng chứng cục bộ trong quá trình phát triển
  - H2: Làn Docker
  - H2: Chấp nhận gói
  - H2: Mặc định phát hành
  - H2: Khả năng tương thích kế thừa
  - H2: Thêm phạm vi kiểm thử
  - H2: Phân loại lỗi

## help/testing.md

- Tuyến: /help/testing
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Thư mục tạm kiểm thử
  - H2: Runner dành riêng cho QA
  - H3: Thông tin xác thực Telegram dùng chung qua Convex (v1)
  - H3: Thêm kênh vào QA
  - H2: Bộ kiểm thử (chạy ở đâu)
  - H3: Đơn vị / tích hợp (mặc định)
  - H3: Độ ổn định (Gateway)
  - H3: E2E (tổng hợp repo)
  - H3: E2E (smoke Gateway)
  - H3: E2E (trình duyệt mô phỏng Control UI)
  - H3: E2E: smoke backend OpenShell
  - H3: Trực tiếp (nhà cung cấp thật + mô hình thật)
  - H2: Tôi nên chạy bộ nào?
  - H2: Kiểm thử trực tiếp (chạm mạng)
  - H2: Runner Docker (kiểm tra tùy chọn "hoạt động trên Linux")
  - H2: Kiểm tra hợp lý tài liệu
  - H2: Hồi quy ngoại tuyến (an toàn cho CI)
  - H2: Đánh giá độ tin cậy tác nhân (Skills)
  - H2: Kiểm thử hợp đồng (hình dạng Plugin và kênh)
  - H3: Lệnh
  - H3: Hợp đồng kênh
  - H3: Hợp đồng trạng thái nhà cung cấp
  - H3: Hợp đồng nhà cung cấp
  - H3: Khi nào chạy
  - H2: Thêm hồi quy (hướng dẫn)
  - H2: Liên quan

## help/troubleshooting.md

- Tuyến: /help/troubleshooting
- Tiêu đề:
  - H2: 60 giây đầu tiên
  - H2: Trợ lý có vẻ bị giới hạn hoặc thiếu công cụ
  - H2: Ngữ cảnh dài Anthropic 429
  - H2: Backend cục bộ tương thích OpenAI hoạt động trực tiếp nhưng lỗi trong OpenClaw
  - H2: Cài đặt Plugin thất bại do thiếu tiện ích mở rộng openclaw
  - H2: Chính sách cài đặt chặn cài đặt hoặc cập nhật Plugin
  - H2: Có Plugin nhưng bị chặn vì quyền sở hữu đáng ngờ
  - H2: Cây quyết định
  - H2: Liên quan

## index.md

- Tuyến: /
- Tiêu đề:
  - H1: OpenClaw 🦞
  - H2: OpenClaw là gì?
  - H2: Cách hoạt động
  - H2: Năng lực chính
  - H2: Bắt đầu nhanh
  - H2: Dashboard
  - H2: Cấu hình (tùy chọn)
  - H2: Bắt đầu tại đây
  - H2: Tìm hiểu thêm

## install/ansible.md

- Tuyến: /install/ansible
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Những gì bạn nhận được
  - H2: Bắt đầu nhanh
  - H2: Những gì được cài đặt
  - H2: Thiết lập sau cài đặt
  - H3: Lệnh nhanh
  - H2: Kiến trúc bảo mật
  - H2: Cài đặt thủ công
  - H2: Cập nhật
  - H2: Khắc phục sự cố
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## install/azure.md

- Tuyến: /install/azure
- Tiêu đề:
  - H2: Bạn sẽ làm gì
  - H2: Những gì bạn cần
  - H2: Cấu hình triển khai
  - H2: Triển khai tài nguyên Azure
  - H2: Cài đặt OpenClaw
  - H2: Cân nhắc chi phí
  - H2: Dọn dẹp
  - H2: Bước tiếp theo
  - H2: Liên quan

## install/bun.md

- Tuyến: /install/bun
- Tiêu đề:
  - H2: Cài đặt
  - H2: Tập lệnh vòng đời
  - H2: Lưu ý
  - H2: Liên quan

## install/clawdock.md

- Tuyến: /install/clawdock
- Tiêu đề:
  - H2: Cài đặt
  - H2: Những gì bạn nhận được
  - H3: Thao tác cơ bản
  - H3: Truy cập container
  - H3: Web UI và ghép nối
  - H3: Thiết lập và bảo trì
  - H3: Tiện ích
  - H2: Luồng lần đầu
  - H2: Cấu hình và bí mật
  - H2: Liên quan

## install/development-channels.md

- Tuyến: /install/development-channels
- Tiêu đề:
  - H2: Chuyển kênh
  - H2: Nhắm tới phiên bản hoặc thẻ một lần
  - H2: Chạy thử
  - H2: Plugin và kênh
  - H2: Kiểm tra trạng thái hiện tại
  - H2: Thực hành tốt nhất khi gắn thẻ
  - H2: Tính khả dụng của ứng dụng macOS
  - H2: Liên quan

## install/digitalocean.md

- Tuyến: /install/digitalocean
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Thiết lập
  - H2: Duy trì dữ liệu và sao lưu
  - H2: Mẹo cho RAM 1 GB
  - H2: Khắc phục sự cố
  - H2: Bước tiếp theo
  - H2: Liên quan

## install/docker-vm-runtime.md

- Tuyến: /install/docker-vm-runtime
- Tiêu đề:
  - H2: Nướng các binary bắt buộc vào image
  - H2: Build và khởi chạy
  - H2: Những gì được lưu ở đâu
  - H2: Cập nhật
  - H2: Liên quan

## install/docker.md

- Tuyến: /install/docker
- Tiêu đề:
  - H2: Docker có phù hợp với tôi không?
  - H2: Điều kiện tiên quyết
  - H2: Gateway trong container
  - H3: Luồng thủ công
  - H3: Biến môi trường
  - H3: Khả năng quan sát
  - H3: Kiểm tra sức khỏe
  - H3: LAN so với local loopback
  - H3: Nhà cung cấp cục bộ trên máy chủ
  - H3: Backend Claude CLI trong Docker
  - H3: Bonjour / mDNS
  - H3: Lưu trữ và duy trì dữ liệu
  - H3: Trình trợ giúp shell (tùy chọn)
  - H3: Chạy trên VPS?
  - H2: Sandbox tác nhân
  - H3: Bật nhanh
  - H2: Khắc phục sự cố
  - H2: Liên quan

## install/exe-dev.md

- Tuyến: /install/exe-dev
- Tiêu đề:
  - H2: Lộ trình nhanh cho người mới bắt đầu
  - H2: Những gì bạn cần
  - H2: Cài đặt tự động với Shelley
  - H2: Cài đặt thủ công
  - H2: 1) Tạo VM
  - H2: 2) Cài đặt điều kiện tiên quyết (trên VM)
  - H2: 3) Cài đặt OpenClaw
  - H2: 4) Thiết lập nginx để proxy OpenClaw tới cổng 8000
  - H2: 5) Truy cập OpenClaw và cấp đặc quyền
  - H2: Thiết lập kênh từ xa
  - H2: Truy cập từ xa
  - H2: Cập nhật
  - H2: Liên quan

## install/fly.md

- Tuyến: /install/fly
- Tiêu đề:
  - H2: Những gì bạn cần
  - H2: Lộ trình nhanh cho người mới bắt đầu
  - H2: Khắc phục sự cố
  - H3: "Ứng dụng không lắng nghe trên địa chỉ dự kiến"
  - H3: Kiểm tra sức khỏe thất bại / kết nối bị từ chối
  - H3: OOM / Vấn đề bộ nhớ
  - H3: Vấn đề khóa Gateway
  - H3: Cấu hình không được đọc
  - H3: Ghi cấu hình qua SSH
  - H3: Trạng thái không được duy trì
  - H2: Cập nhật
  - H3: Lệnh cập nhật máy
  - H2: Triển khai riêng tư (được gia cố)
  - H3: Khi nào dùng triển khai riêng tư
  - H3: Thiết lập
  - H3: Truy cập triển khai riêng tư
  - H3: Webhook với triển khai riêng tư
  - H3: Lợi ích bảo mật
  - H2: Ghi chú
  - H2: Chi phí
  - H2: Bước tiếp theo
  - H2: Liên quan

## install/gcp.md

- Tuyến: /install/gcp
- Tiêu đề:
  - H2: Chúng ta đang làm gì (nói đơn giản)?
  - H2: Lộ trình nhanh (người vận hành có kinh nghiệm)
  - H2: Những gì bạn cần
  - H2: Khắc phục sự cố
  - H2: Tài khoản dịch vụ (thực hành bảo mật tốt nhất)
  - H2: Bước tiếp theo
  - H2: Liên quan

## install/hetzner.md

- Tuyến: /install/hetzner
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Chúng ta đang làm gì (nói đơn giản)?
  - H2: Lộ trình nhanh (người vận hành có kinh nghiệm)
  - H2: Những gì bạn cần
  - H2: Hạ tầng dưới dạng mã (Terraform)
  - H2: Bước tiếp theo
  - H2: Liên quan

## install/hostinger.md

- Tuyến: /install/hostinger
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Tùy chọn A: OpenClaw 1-Click
  - H2: Tùy chọn B: OpenClaw trên VPS
  - H2: Xác minh thiết lập của bạn
  - H2: Khắc phục sự cố
  - H2: Bước tiếp theo
  - H2: Liên quan

## install/index.md

- Tuyến: /install
- Tiêu đề:
  - H2: Yêu cầu hệ thống
  - H2: Khuyến nghị: tập lệnh cài đặt
  - H2: Phương thức cài đặt thay thế
  - H3: Trình cài đặt tiền tố cục bộ (install-cli.sh)
  - H3: npm, pnpm, hoặc bun
  - H3: Từ mã nguồn
  - H3: Cài đặt từ checkout main của GitHub
  - H3: Container và trình quản lý gói
  - H2: Xác minh cài đặt
  - H2: Lưu trữ và triển khai
  - H2: Cập nhật, di chuyển, hoặc gỡ cài đặt
  - H2: Khắc phục sự cố: không tìm thấy openclaw

## install/installer.md

- Tuyến: /install/installer
- Tiêu đề:
  - H2: Lệnh nhanh
  - H2: install.sh
  - H3: Luồng (install.sh)
  - H3: Phát hiện checkout mã nguồn
  - H3: Ví dụ (install.sh)
  - H2: install-cli.sh
  - H3: Luồng (install-cli.sh)
  - H3: Ví dụ (install-cli.sh)
  - H2: install.ps1
  - H3: Luồng (install.ps1)
  - H3: Ví dụ (install.ps1)
  - H2: CI và tự động hóa
  - H2: Khắc phục sự cố
  - H2: Liên quan

## install/kubernetes.md

- Tuyến: /install/kubernetes
- Tiêu đề:
  - H2: Tại sao không dùng Helm?
  - H2: Những gì bạn cần
  - H2: Bắt đầu nhanh
  - H2: Kiểm thử cục bộ với Kind
  - H2: Từng bước
  - H3: 1) Triển khai
  - H3: 2) Truy cập Gateway
  - H2: Những gì được triển khai
  - H2: Tùy chỉnh
  - H3: Hướng dẫn tác nhân
  - H3: Cấu hình Gateway
  - H3: Thêm nhà cung cấp
  - H3: Namespace tùy chỉnh
  - H3: Image tùy chỉnh
  - H3: Mở ra ngoài port-forward
  - H2: Triển khai lại
  - H2: Gỡ bỏ
  - H2: Ghi chú kiến trúc
  - H2: Cấu trúc tệp
  - H2: Liên quan

## install/macos-vm.md

- Tuyến: /install/macos-vm
- Tiêu đề:
  - H2: Mặc định được khuyến nghị (hầu hết người dùng)
  - H2: Tùy chọn VM macOS
  - H3: VM cục bộ trên Apple Silicon Mac của bạn (Lume)
  - H3: Nhà cung cấp Mac lưu trữ (đám mây)
  - H2: Lộ trình nhanh (Lume, người dùng có kinh nghiệm)
  - H2: Những gì bạn cần (Lume)
  - H2: 1) Cài đặt Lume
  - H2: 2) Tạo VM macOS
  - H2: 3) Hoàn tất Setup Assistant
  - H2: 4) Lấy địa chỉ IP của VM
  - H2: 5) SSH vào VM
  - H2: 6) Cài đặt OpenClaw
  - H2: 7) Cấu hình kênh
  - H2: 8) Chạy VM không giao diện
  - H2: Bổ sung: tích hợp iMessage
  - H2: Lưu golden image
  - H2: Chạy 24/7
  - H2: Khắc phục sự cố
  - H2: Tài liệu liên quan

## install/migrating-claude.md

- Tuyến: /install/migrating-claude
- Tiêu đề:
  - H2: Hai cách để nhập
  - H2: Những gì được nhập
  - H2: Những gì chỉ ở dạng lưu trữ
  - H2: Chọn nguồn
  - H2: Luồng được khuyến nghị
  - H2: Xử lý xung đột
  - H2: Đầu ra JSON cho tự động hóa
  - H2: Khắc phục sự cố
  - H2: Liên quan

## install/migrating-hermes.md

- Tuyến: /install/migrating-hermes
- Tiêu đề:
  - H2: Hai cách để nhập
  - H2: Những gì được nhập
  - H2: Những gì chỉ ở dạng lưu trữ
  - H2: Luồng được khuyến nghị
  - H2: Xử lý xung đột
  - H2: Bí mật
  - H2: Đầu ra JSON cho tự động hóa
  - H2: Khắc phục sự cố
  - H2: Liên quan

## install/migrating.md

- Tuyến: /install/migrating
- Tiêu đề:
  - H2: Nhập từ hệ thống tác nhân khác
  - H2: Di chuyển OpenClaw sang máy mới
  - H3: Các bước di chuyển
  - H3: Lỗi thường gặp
  - H3: Danh sách kiểm tra xác minh
  - H2: Nâng cấp Plugin tại chỗ
  - H2: Liên quan

## install/nix.md

- Tuyến: /install/nix
- Tiêu đề:
  - H2: Những gì bạn nhận được
  - H2: Bắt đầu nhanh
  - H2: Hành vi runtime chế độ Nix
  - H3: Những gì thay đổi trong chế độ Nix
  - H3: Đường dẫn cấu hình và trạng thái
  - H3: Phát hiện PATH của dịch vụ
  - H2: Liên quan

## install/node.md

- Tuyến: /install/node
- Tiêu đề:
  - H2: Kiểm tra phiên bản của bạn
  - H2: Cài đặt Node
  - H2: Khắc phục sự cố
  - H3: openclaw: command not found
  - H3: Lỗi quyền trên npm install -g (Linux)
  - H2: Liên quan

## install/northflank.mdx

- Tuyến: /install/northflank
- Tiêu đề:
  - H1: Northflank
  - H2: Cách bắt đầu
  - H2: Những gì bạn nhận được
  - H2: Kết nối kênh
  - H2: Bước tiếp theo

## install/oracle.md

- Tuyến: /install/oracle
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Thiết lập
  - H2: Xác minh tư thế bảo mật
  - H2: Ghi chú ARM
  - H2: Duy trì dữ liệu và sao lưu
  - H2: Dự phòng: đường hầm SSH
  - H2: Khắc phục sự cố
  - H2: Bước tiếp theo
  - H2: Liên quan

## install/podman.md

- Tuyến: /install/podman
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Bắt đầu nhanh
  - H2: Podman và Tailscale
  - H2: Systemd (Quadlet, tùy chọn)
  - H2: Cấu hình, env, và lưu trữ
  - H2: Lệnh hữu ích
  - H2: Khắc phục sự cố
  - H2: Liên quan

## install/railway.mdx

- Tuyến: /install/railway
- Tiêu đề:
  - H1: Railway
  - H2: Danh sách kiểm tra nhanh (người dùng mới)
  - H2: Triển khai một cú nhấp
  - H2: Những gì bạn nhận được
  - H2: Cài đặt Railway bắt buộc
  - H3: Mạng công khai
  - H3: Volume (bắt buộc)
  - H3: Biến
  - H2: Kết nối kênh
  - H2: Sao lưu &amp; di chuyển
  - H2: Bước tiếp theo

## install/raspberry-pi.md

- Tuyến: /install/raspberry-pi
- Tiêu đề:
  - H2: Tương thích phần cứng
  - H2: Điều kiện tiên quyết
  - H2: Thiết lập
  - H2: Mẹo hiệu năng
  - H2: Thiết lập mô hình được khuyến nghị
  - H2: Ghi chú về tệp nhị phân ARM
  - H2: Tính bền vững và sao lưu
  - H2: Khắc phục sự cố
  - H2: Các bước tiếp theo
  - H2: Liên quan

## install/render.mdx

- Tuyến: /install/render
- Tiêu đề:
  - H1: Render
  - H2: Điều kiện tiên quyết
  - H2: Triển khai bằng Render Blueprint
  - H2: Hiểu Blueprint
  - H2: Chọn gói
  - H2: Sau khi triển khai
  - H3: Truy cập Control UI
  - H2: Tính năng Render Dashboard
  - H3: Nhật ký
  - H3: Truy cập shell
  - H3: Biến môi trường
  - H3: Tự động triển khai
  - H2: Miền tùy chỉnh
  - H2: Mở rộng quy mô
  - H2: Sao lưu và di chuyển
  - H2: Khắc phục sự cố
  - H3: Dịch vụ không khởi động
  - H3: Khởi động nguội chậm (bậc miễn phí)
  - H3: Mất dữ liệu sau khi triển khai lại
  - H3: Lỗi kiểm tra sức khỏe
  - H2: Các bước tiếp theo

## install/uninstall.md

- Tuyến: /install/uninstall
- Tiêu đề:
  - H2: Đường dẫn dễ dàng (CLI vẫn được cài đặt)
  - H2: Gỡ bỏ dịch vụ thủ công (CLI chưa được cài đặt)
  - H3: macOS (launchd)
  - H3: Linux (đơn vị người dùng systemd)
  - H3: Windows (Scheduled Task)
  - H2: Cài đặt thông thường so với checkout mã nguồn
  - H3: Cài đặt thông thường (install.sh / npm / pnpm / bun)
  - H3: Checkout mã nguồn (git clone)
  - H2: Liên quan

## install/updating.md

- Tuyến: /install/updating
- Tiêu đề:
  - H2: Khuyến nghị: openclaw update
  - H2: Chuyển đổi giữa cài đặt npm và git
  - H2: Cách khác: chạy lại trình cài đặt
  - H2: Cách khác: npm, pnpm hoặc bun thủ công
  - H3: Chủ đề cài đặt npm nâng cao
  - H2: Trình tự động cập nhật
  - H2: Sau khi cập nhật
  - H3: Chạy doctor
  - H3: Khởi động lại gateway
  - H3: Xác minh
  - H2: Rollback
  - H3: Ghim phiên bản (npm)
  - H3: Ghim commit (mã nguồn)
  - H2: Nếu bạn bị kẹt
  - H2: Liên quan

## install/upstash.md

- Tuyến: /install/upstash
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Tạo Box
  - H2: Kết nối bằng đường hầm SSH
  - H2: Cài đặt OpenClaw
  - H2: Chạy onboarding
  - H2: Khởi động Gateway
  - H2: Tự động khởi động lại
  - H2: Khắc phục sự cố
  - H2: Liên quan

## logging.md

- Tuyến: /logging
- Tiêu đề:
  - H2: Nơi lưu nhật ký
  - H2: Cách đọc nhật ký
  - H3: CLI: tail trực tiếp (khuyến nghị)
  - H3: Control UI (web)
  - H3: Nhật ký chỉ kênh
  - H2: Định dạng nhật ký
  - H3: Nhật ký tệp (JSONL)
  - H3: Đầu ra console
  - H3: Nhật ký Gateway WebSocket
  - H2: Cấu hình ghi nhật ký
  - H3: Cấp độ nhật ký
  - H3: Chẩn đoán truyền tải mô hình có mục tiêu
  - H3: Tương quan trace
  - H3: Kích thước và thời gian lệnh gọi mô hình
  - H3: Kiểu console
  - H3: Biên tập ẩn
  - H2: Chẩn đoán và OpenTelemetry
  - H2: Mẹo khắc phục sự cố
  - H2: Liên quan

## maturity/scorecard.md

- Tuyến: /maturity/scorecard
- Tiêu đề:
  - H1: Bảng điểm độ trưởng thành
  - H2: Mục đích của trang này
  - H2: Tổng quan nhanh
  - H2: Dải điểm
  - H2: Trình khám phá bề mặt
  - H2: Tóm tắt bằng chứng QA
  - H3: Mức sẵn sàng theo khu vực

## maturity/taxonomy.md

- Tuyến: /maturity/taxonomy
- Tiêu đề:
  - H1: Phân loại độ trưởng thành
  - H2: Cách đọc trang này
  - H2: Mức độ trưởng thành
  - H2: Khu vực sản phẩm
  - H2: Chi tiết
  - H3: Lõi
  - H3: Nền tảng
  - H3: Kênh
  - H3: Nhà cung cấp và công cụ

## network.md

- Tuyến: /network
- Tiêu đề:
  - H2: Mô hình lõi
  - H2: Ghép nối + danh tính
  - H2: Khám phá + truyền tải
  - H2: Node + truyền tải
  - H2: Bảo mật
  - H2: Liên quan

## nodes/audio.md

- Tuyến: /nodes/audio
- Tiêu đề:
  - H2: Nội dung hoạt động
  - H2: Tự động phát hiện (mặc định)
  - H2: Ví dụ cấu hình
  - H3: Nhà cung cấp + fallback CLI (OpenAI + Whisper CLI)
  - H3: Chỉ nhà cung cấp với giới hạn theo phạm vi
  - H3: Chỉ nhà cung cấp (Deepgram)
  - H3: Chỉ nhà cung cấp (Mistral Voxtral)
  - H3: Chỉ nhà cung cấp (SenseAudio)
  - H3: Phản hồi bản chép lời vào trò chuyện (tùy chọn bật)
  - H2: Ghi chú và giới hạn
  - H3: Hỗ trợ môi trường proxy
  - H2: Phát hiện nhắc đến trong nhóm
  - H2: Những điểm dễ vấp
  - H2: Liên quan

## nodes/camera.md

- Tuyến: /nodes/camera
- Tiêu đề:
  - H2: Node iOS
  - H3: Cài đặt người dùng (mặc định bật)
  - H3: Lệnh (qua Gateway node.invoke)
  - H3: Yêu cầu chạy nền trước
  - H3: Trợ giúp CLI
  - H2: Node Android
  - H3: Cài đặt người dùng Android (mặc định bật)
  - H3: Quyền
  - H3: Yêu cầu chạy nền trước trên Android
  - H3: Lệnh Android (qua Gateway node.invoke)
  - H3: Bảo vệ payload
  - H2: Ứng dụng macOS
  - H3: Cài đặt người dùng (mặc định tắt)
  - H3: Trợ giúp CLI (node invoke)
  - H2: An toàn + giới hạn thực tế
  - H2: Video màn hình macOS (cấp hệ điều hành)
  - H2: Liên quan

## nodes/images.md

- Tuyến: /nodes/images
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Bề mặt CLI
  - H2: Hành vi kênh WhatsApp Web
  - H2: Pipeline trả lời tự động
  - H2: Phương tiện đến thành lệnh
  - H2: Giới hạn và lỗi
  - H2: Ghi chú cho kiểm thử
  - H2: Liên quan

## nodes/index.md

- Tuyến: /nodes
- Tiêu đề:
  - H2: Ghép nối + trạng thái
  - H2: Máy chủ node từ xa (system.run)
  - H3: Cái gì chạy ở đâu
  - H3: Khởi động máy chủ node (nền trước)
  - H3: Gateway từ xa qua đường hầm SSH (liên kết loopback)
  - H3: Khởi động máy chủ node (dịch vụ)
  - H3: Ghép nối + đặt tên
  - H3: Đưa lệnh vào danh sách cho phép
  - H3: Trỏ exec tới node
  - H3: Suy luận mô hình cục bộ
  - H2: Gọi lệnh
  - H2: Chính sách lệnh
  - H2: Cấu hình (openclaw.json)
  - H2: Ảnh chụp màn hình (ảnh chụp nhanh canvas)
  - H3: Điều khiển canvas
  - H3: A2UI (Canvas)
  - H2: Ảnh + video (camera node)
  - H2: Ghi màn hình (node)
  - H2: Vị trí (node)
  - H2: SMS (node Android)
  - H2: Thiết bị Android + lệnh dữ liệu cá nhân
  - H2: Lệnh hệ thống (máy chủ node / node Mac)
  - H2: Liên kết node exec
  - H2: Bản đồ quyền
  - H2: Máy chủ node không giao diện (đa nền tảng)
  - H2: Chế độ node Mac

## nodes/location-command.md

- Tuyến: /nodes/location-command
- Tiêu đề:
  - H2: TL;DR
  - H2: Vì sao dùng bộ chọn (không chỉ là công tắc)
  - H2: Mô hình cài đặt
  - H2: Ánh xạ quyền (node.permissions)
  - H2: Lệnh: location.get
  - H2: Hành vi nền
  - H2: Tích hợp mô hình/công cụ
  - H2: Nội dung UX (gợi ý)
  - H2: Liên quan

## nodes/media-understanding.md

- Tuyến: /nodes/media-understanding
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Hành vi cấp cao
  - H2: Tổng quan cấu hình
  - H3: Mục nhập mô hình
  - H3: Thông tin xác thực nhà cung cấp (apiKey)
  - H2: Mặc định và giới hạn
  - H3: Tự động phát hiện hiểu phương tiện (mặc định)
  - H3: Hỗ trợ môi trường proxy (mô hình nhà cung cấp)
  - H2: Khả năng (tùy chọn)
  - H2: Ma trận hỗ trợ nhà cung cấp (tích hợp OpenClaw)
  - H2: Hướng dẫn chọn mô hình
  - H2: Chính sách tệp đính kèm
  - H2: Ví dụ cấu hình
  - H2: Đầu ra trạng thái
  - H2: Ghi chú
  - H2: Liên quan

## nodes/talk.md

- Tuyến: /nodes/talk
- Tiêu đề:
  - H2: Hành vi (macOS)
  - H2: Chỉ thị giọng nói trong phản hồi
  - H2: Cấu hình (/.openclaw/openclaw.json)
  - H2: UI macOS
  - H2: UI Android
  - H2: Ghi chú
  - H2: Liên quan

## nodes/troubleshooting.md

- Tuyến: /nodes/troubleshooting
- Tiêu đề:
  - H2: Thang lệnh
  - H2: Yêu cầu chạy nền trước
  - H2: Ma trận quyền
  - H2: Ghép nối so với phê duyệt
  - H2: Mã lỗi node thường gặp
  - H2: Vòng lặp khôi phục nhanh
  - H2: Liên quan

## nodes/voicewake.md

- Tuyến: /nodes/voicewake
- Tiêu đề:
  - H2: Lưu trữ (máy chủ Gateway)
  - H2: Giao thức
  - H3: Phương thức
  - H3: Phương thức định tuyến (kích hoạt → mục tiêu)
  - H3: Sự kiện
  - H2: Hành vi client
  - H3: Ứng dụng macOS
  - H3: Node iOS
  - H3: Node Android
  - H2: Liên quan

## openclaw-agent-runtime.md

- Tuyến: /openclaw-agent-runtime
- Tiêu đề:
  - H2: Kiểm tra kiểu và lint
  - H2: Chạy kiểm thử Agent Runtime
  - H2: Kiểm thử thủ công
  - H2: Đặt lại trạng thái sạch
  - H2: Tham khảo
  - H2: Liên quan

## perplexity.md

- Tuyến: /perplexity
- Tiêu đề:
  - H2: Liên quan

## plan/codex-context-engine-harness.md

- Tuyến: /plan/codex-context-engine-harness
- Tiêu đề:
  - H2: Trạng thái
  - H2: Mục tiêu
  - H2: Không phải mục tiêu
  - H2: Kiến trúc hiện tại
  - H2: Khoảng trống hiện tại
  - H2: Hành vi mong muốn
  - H2: Ràng buộc thiết kế
  - H3: Máy chủ ứng dụng Codex vẫn là nguồn chuẩn cho trạng thái luồng gốc
  - H3: Phần lắp ráp context engine phải được chiếu vào đầu vào Codex
  - H3: Độ ổn định prompt-cache rất quan trọng
  - H3: Ngữ nghĩa chọn runtime không thay đổi
  - H2: Kế hoạch triển khai
  - H3: 1. Xuất hoặc di chuyển các helper thử context-engine có thể tái sử dụng
  - H3: 2. Thêm helper chiếu ngữ cảnh Codex
  - H3: 3. Nối bootstrap trước khi khởi động luồng Codex
  - H3: 4. Nối assemble trước thread/start / thread/resume và turn/start
  - H3: 5. Giữ nguyên định dạng ổn định cho prompt-cache
  - H3: 6. Nối post-turn sau khi phản chiếu transcript
  - H3: 7. Chuẩn hóa mức sử dụng và ngữ cảnh runtime prompt-cache
  - H3: 8. Chính sách Compaction
  - H4: /compact và OpenClaw compaction rõ ràng
  - H4: Sự kiện contextCompaction gốc của Codex trong lượt
  - H3: 9. Đặt lại phiên và hành vi liên kết
  - H3: 10. Xử lý lỗi
  - H2: Kế hoạch kiểm thử
  - H3: Kiểm thử đơn vị
  - H3: Kiểm thử hiện có cần cập nhật
  - H3: Kiểm thử tích hợp / trực tiếp
  - H2: Khả năng quan sát
  - H2: Di chuyển / tương thích
  - H2: Câu hỏi mở
  - H2: Tiêu chí chấp nhận

## plan/ui-channels.md

- Tuyến: /plan/ui-channels
- Tiêu đề:
  - H2: Trạng thái
  - H2: Vấn đề
  - H2: Mục tiêu
  - H2: Không phải mục tiêu
  - H2: Mô hình mục tiêu
  - H2: Siêu dữ liệu phân phối
  - H2: Hợp đồng khả năng runtime
  - H2: Ánh xạ kênh
  - H2: Các bước refactor
  - H2: Kiểm thử
  - H2: Câu hỏi mở
  - H2: Liên quan

## platforms/android.md

- Tuyến: /platforms/android
- Tiêu đề:
  - H2: Ảnh chụp hỗ trợ
  - H2: Điều khiển hệ thống
  - H2: Sổ tay kết nối
  - H3: Điều kiện tiên quyết
  - H3: 1) Khởi động Gateway
  - H3: 2) Xác minh khám phá (tùy chọn)
  - H4: Khám phá Tailnet (Vienna ⇄ London) qua DNS-SD unicast
  - H3: 3) Kết nối từ Android
  - H3: Beacon báo còn hoạt động
  - H3: 4) Phê duyệt ghép nối (CLI)
  - H3: 5) Xác minh node đã kết nối
  - H3: 6) Trò chuyện + lịch sử
  - H3: 7) Canvas + camera
  - H4: Gateway Canvas Host (khuyến nghị cho nội dung web)
  - H3: 8) Giọng nói + bề mặt lệnh Android mở rộng
  - H2: Điểm vào assistant
  - H2: Chuyển tiếp thông báo
  - H2: Liên quan

## platforms/digitalocean.md

- Tuyến: /platforms/digitalocean
- Tiêu đề:
  - H2: Liên quan

## platforms/easyrunner.md

- Tuyến: /platforms/easyrunner
- Tiêu đề:
  - H2: Trước khi bắt đầu
  - H2: Ứng dụng Compose
  - H2: Cấu hình OpenClaw
  - H2: Xác minh
  - H2: Cập nhật và sao lưu
  - H2: Khắc phục sự cố

## platforms/index.md

- Tuyến: /platforms
- Tiêu đề:
  - H2: Chọn hệ điều hành của bạn
  - H2: VPS và hosting
  - H2: Liên kết phổ biến
  - H2: Cài đặt dịch vụ Gateway (CLI)
  - H2: Liên quan

## platforms/ios.md

- Tuyến: /platforms/ios
- Tiêu đề:
  - H2: Chức năng
  - H2: Yêu cầu
  - H2: Bắt đầu nhanh (ghép nối + kết nối)
  - H2: Push dựa trên relay cho bản dựng chính thức
  - H2: Beacon báo còn hoạt động nền
  - H2: Luồng xác thực và tin cậy
  - H2: Đường dẫn khám phá
  - H3: Bonjour (LAN)
  - H3: Tailnet (liên mạng)
  - H3: Máy chủ/cổng thủ công
  - H2: Canvas + A2UI
  - H2: Quan hệ Computer Use
  - H3: Eval / snapshot Canvas
  - H2: Đánh thức bằng giọng nói + chế độ nói
  - H2: Lỗi thường gặp
  - H2: Tài liệu liên quan

## platforms/linux.md

- Tuyến: /platforms/linux
- Tiêu đề:
  - H2: Lộ trình nhanh cho người mới bắt đầu (VPS)
  - H2: Cài đặt
  - H2: Gateway
  - H2: Cài đặt dịch vụ Gateway (CLI)
  - H2: Điều khiển hệ thống (đơn vị người dùng systemd)
  - H2: Áp lực bộ nhớ và tiến trình bị hủy do OOM
  - H2: Liên quan

## platforms/mac/bundled-gateway.md

- Tuyến: /platforms/mac/bundled-gateway
- Tiêu đề:
  - H2: Thiết lập tự động
  - H2: Khôi phục thủ công
  - H2: Launchd (Gateway dưới dạng LaunchAgent)
  - H2: Tương thích phiên bản
  - H2: Thư mục trạng thái trên macOS
  - H2: Gỡ lỗi kết nối ứng dụng
  - H2: Kiểm tra smoke
  - H2: Liên quan

## platforms/mac/canvas.md

- Tuyến: /platforms/mac/canvas
- Tiêu đề:
  - H2: Vị trí của Canvas
  - H2: Hành vi bảng điều khiển
  - H2: Bề mặt API agent
  - H2: A2UI trong Canvas
  - H3: Lệnh A2UI (v0.8)
  - H2: Kích hoạt lượt chạy agent từ Canvas
  - H2: Ghi chú bảo mật
  - H2: Liên quan

## platforms/mac/child-process.md

- Tuyến: /platforms/mac/child-process
- Tiêu đề:
  - H2: Hành vi mặc định (launchd)
  - H2: Bản dựng dev chưa ký
  - H2: Chế độ chỉ đính kèm
  - H2: Chế độ từ xa
  - H2: Vì sao chúng tôi ưu tiên launchd
  - H2: Liên quan

## platforms/mac/dev-setup.md

- Đường dẫn: /platforms/mac/dev-setup
- Tiêu đề:
  - H1: Thiết lập môi trường phát triển macOS
  - H2: Điều kiện tiên quyết
  - H2: 1. Cài đặt phụ thuộc
  - H2: 2. Xây dựng và đóng gói ứng dụng
  - H2: 3. Cài đặt CLI và Gateway
  - H2: Khắc phục sự cố
  - H3: Xây dựng thất bại: toolchain hoặc SDK không khớp
  - H3: Ứng dụng bị sập khi cấp quyền
  - H3: Gateway "Starting..." vô thời hạn
  - H2: Liên quan

## platforms/mac/health.md

- Đường dẫn: /platforms/mac/health
- Tiêu đề:
  - H1: Kiểm tra tình trạng trên macOS
  - H2: Thanh menu
  - H2: Cài đặt
  - H2: Cách probe hoạt động
  - H2: Khi chưa chắc chắn
  - H2: Liên quan

## platforms/mac/icon.md

- Đường dẫn: /platforms/mac/icon
- Tiêu đề:
  - H1: Trạng thái biểu tượng thanh menu
  - H2: Liên quan

## platforms/mac/logging.md

- Đường dẫn: /platforms/mac/logging
- Tiêu đề:
  - H1: Ghi log (macOS)
  - H2: Log tệp chẩn đoán xoay vòng (ngăn Debug)
  - H2: Dữ liệu riêng tư của unified logging trên macOS
  - H2: Bật cho OpenClaw (ai.openclaw)
  - H2: Tắt sau khi gỡ lỗi
  - H2: Liên quan

## platforms/mac/menu-bar.md

- Đường dẫn: /platforms/mac/menu-bar
- Tiêu đề:
  - H2: Nội dung được hiển thị
  - H2: Mô hình trạng thái
  - H2: enum IconState (Swift)
  - H3: ActivityKind → glyph
  - H3: Ánh xạ trực quan
  - H2: Menu con ngữ cảnh
  - H2: Văn bản hàng trạng thái (menu)
  - H2: Tiếp nhận sự kiện
  - H2: Ghi đè khi gỡ lỗi
  - H2: Danh sách kiểm tra kiểm thử
  - H2: Liên quan

## platforms/mac/peekaboo.md

- Đường dẫn: /platforms/mac/peekaboo
- Tiêu đề:
  - H2: Đây là gì (và không phải là gì)
  - H2: Quan hệ với Computer Use
  - H2: Bật cầu nối
  - H2: Thứ tự khám phá client
  - H2: Bảo mật và quyền
  - H2: Hành vi snapshot (tự động hóa)
  - H2: Khắc phục sự cố
  - H2: Liên quan

## platforms/mac/permissions.md

- Đường dẫn: /platforms/mac/permissions
- Tiêu đề:
  - H2: Yêu cầu để quyền ổn định
  - H2: Cấp quyền Accessibility cho runtime Node và CLI
  - H2: Danh sách kiểm tra khôi phục khi lời nhắc biến mất
  - H2: Quyền đối với tệp và thư mục (Desktop/Documents/Downloads)
  - H2: Liên quan

## platforms/mac/remote.md

- Đường dẫn: /platforms/mac/remote
- Tiêu đề:
  - H2: Chế độ
  - H2: Phương thức truyền từ xa
  - H2: Điều kiện tiên quyết trên máy chủ từ xa
  - H2: Thiết lập ứng dụng macOS
  - H2: Web Chat
  - H2: Quyền
  - H2: Ghi chú bảo mật
  - H2: Luồng đăng nhập WhatsApp (từ xa)
  - H2: Khắc phục sự cố
  - H2: Âm thanh thông báo
  - H2: Liên quan

## platforms/mac/signing.md

- Đường dẫn: /platforms/mac/signing
- Tiêu đề:
  - H1: Ký mac (bản dựng gỡ lỗi)
  - H2: Cách sử dụng
  - H3: Ghi chú ký ad-hoc
  - H2: Siêu dữ liệu bản dựng cho About
  - H2: Lý do
  - H2: Liên quan

## platforms/mac/skills.md

- Đường dẫn: /platforms/mac/skills
- Tiêu đề:
  - H2: Nguồn dữ liệu
  - H2: Hành động cài đặt
  - H2: Khóa env/API
  - H2: Chế độ từ xa
  - H2: Liên quan

## platforms/mac/voice-overlay.md

- Đường dẫn: /platforms/mac/voice-overlay
- Tiêu đề:
  - H1: Vòng đời Voice Overlay (macOS)
  - H2: Ý định hiện tại
  - H2: Đã triển khai (ngày 9 tháng 12 năm 2025)
  - H2: Bước tiếp theo
  - H2: Danh sách kiểm tra gỡ lỗi
  - H2: Các bước di trú (đề xuất)
  - H2: Liên quan

## platforms/mac/voicewake.md

- Đường dẫn: /platforms/mac/voicewake
- Tiêu đề:
  - H1: Voice Wake &amp; Push-to-Talk
  - H2: Yêu cầu
  - H2: Chế độ
  - H2: Hành vi runtime (wake-word)
  - H2: Bất biến vòng đời
  - H2: Chế độ lỗi overlay dính (trước đây)
  - H2: Chi tiết riêng của push-to-talk
  - H2: Cài đặt hướng tới người dùng
  - H2: Hành vi chuyển tiếp
  - H2: Payload chuyển tiếp
  - H2: Xác minh nhanh
  - H2: Liên quan

## platforms/mac/webchat.md

- Đường dẫn: /platforms/mac/webchat
- Tiêu đề:
  - H2: Khởi chạy và gỡ lỗi
  - H2: Cách nó được nối kết
  - H2: Bề mặt bảo mật
  - H2: Giới hạn đã biết
  - H2: Liên quan

## platforms/mac/xpc.md

- Đường dẫn: /platforms/mac/xpc
- Tiêu đề:
  - H1: Kiến trúc IPC macOS của OpenClaw
  - H2: Mục tiêu
  - H2: Cách hoạt động
  - H3: Gateway + phương thức truyền node
  - H3: Dịch vụ Node + IPC ứng dụng
  - H3: PeekabooBridge (tự động hóa UI)
  - H2: Luồng vận hành
  - H2: Ghi chú tăng cứng
  - H2: Liên quan

## platforms/macos.md

- Đường dẫn: /platforms/macos
- Tiêu đề:
  - H2: Tải xuống
  - H2: Lần chạy đầu tiên
  - H2: Chọn chế độ Gateway
  - H2: Phần ứng dụng sở hữu
  - H2: Trang chi tiết macOS
  - H2: Liên quan

## platforms/oracle.md

- Đường dẫn: /platforms/oracle
- Tiêu đề:
  - H2: Liên quan

## platforms/raspberry-pi.md

- Đường dẫn: /platforms/raspberry-pi
- Tiêu đề:
  - H2: Liên quan

## platforms/windows.md

- Đường dẫn: /platforms/windows
- Tiêu đề:
  - H2: Khuyến nghị: Windows Hub
  - H3: Windows Hub bao gồm những gì
  - H3: Lần khởi chạy đầu tiên
  - H2: Chế độ node Windows
  - H2: Chế độ MCP cục bộ
  - H2: CLI và Gateway Windows gốc
  - H2: WSL2 Gateway
  - H2: Gateway tự khởi động trước khi đăng nhập Windows
  - H2: Phơi bày dịch vụ WSL qua LAN
  - H2: Khắc phục sự cố
  - H3: Biểu tượng khay không xuất hiện
  - H3: Thiết lập cục bộ thất bại
  - H3: Ứng dụng báo rằng cần ghép đôi
  - H3: Web chat không thể kết nối tới Gateway từ xa
  - H3: Lệnh screen.snapshot, camera hoặc audio thất bại
  - H3: Kết nối Git hoặc GitHub thất bại
  - H2: Liên quan

## plugins/adding-capabilities.md

- Đường dẫn: /plugins/adding-capabilities
- Tiêu đề:
  - H2: Khi nào tạo một capability
  - H2: Chuỗi chuẩn
  - H2: Phần nào đặt ở đâu
  - H2: Ranh giới provider và harness
  - H2: Danh sách kiểm tra tệp
  - H2: Ví dụ hoàn chỉnh: tạo hình ảnh
  - H2: Provider embedding
  - H2: Danh sách kiểm tra review
  - H2: Liên quan

## plugins/admin-http-rpc.md

- Đường dẫn: /plugins/admin-http-rpc
- Tiêu đề:
  - H2: Trước khi bật
  - H2: Bật
  - H2: Xác minh route
  - H2: Xác thực
  - H2: Mô hình bảo mật
  - H2: Request
  - H2: Response
  - H2: Phương thức được phép
  - H2: So sánh WebSocket
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/agent-tools.md

- Đường dẫn: /plugins/agent-tools
- Tiêu đề:
  - H2: Liên quan

## plugins/architecture-internals.md

- Đường dẫn: /plugins/architecture-internals
- Tiêu đề:
  - H2: Pipeline tải
  - H3: Hành vi ưu tiên manifest
  - H3: Ranh giới cache Plugin
  - H2: Mô hình registry
  - H2: Callback ràng buộc cuộc trò chuyện
  - H2: Hook runtime provider
  - H3: Thứ tự và cách dùng hook
  - H3: Ví dụ provider
  - H3: Ví dụ tích hợp sẵn
  - H2: Helper runtime
  - H3: api.runtime.imageGeneration
  - H2: Route HTTP của Gateway
  - H2: Đường dẫn import Plugin SDK
  - H2: Schema công cụ tin nhắn
  - H2: Phân giải mục tiêu kênh
  - H2: Thư mục dựa trên cấu hình
  - H2: Catalog provider
  - H2: Kiểm tra kênh chỉ đọc
  - H2: Gói package
  - H3: Siêu dữ liệu catalog kênh
  - H2: Plugin context engine
  - H2: Thêm capability mới
  - H3: Danh sách kiểm tra capability
  - H3: Mẫu capability
  - H2: Liên quan

## plugins/architecture.md

- Đường dẫn: /plugins/architecture
- Tiêu đề:
  - H2: Mô hình capability công khai
  - H3: Lập trường tương thích bên ngoài
  - H3: Hình dạng Plugin
  - H3: Hook legacy
  - H3: Tín hiệu tương thích
  - H2: Tổng quan kiến trúc
  - H3: Snapshot siêu dữ liệu Plugin và bảng tra cứu
  - H3: Lập kế hoạch kích hoạt
  - H3: Plugin kênh và công cụ tin nhắn dùng chung
  - H2: Mô hình sở hữu capability
  - H3: Phân lớp capability
  - H3: Ví dụ Plugin công ty đa capability
  - H3: Ví dụ capability: hiểu video
  - H2: Hợp đồng và thực thi
  - H3: Nội dung thuộc về hợp đồng
  - H2: Mô hình thực thi
  - H2: Ranh giới export
  - H2: Nội bộ và tham chiếu
  - H2: Liên quan

## plugins/building-extensions.md

- Đường dẫn: /plugins/building-extensions
- Tiêu đề:
  - H2: Liên quan

## plugins/building-plugins.md

- Đường dẫn: /plugins/building-plugins
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Chọn hình dạng Plugin
  - H2: Quickstart
  - H2: Đăng ký công cụ
  - H2: Quy ước import
  - H2: Danh sách kiểm tra trước khi gửi
  - H2: Kiểm thử với bản phát hành beta
  - H2: Bước tiếp theo
  - H2: Liên quan

## plugins/bundles.md

- Đường dẫn: /plugins/bundles
- Tiêu đề:
  - H2: Vì sao bundle tồn tại
  - H2: Cài đặt bundle
  - H2: OpenClaw ánh xạ gì từ bundle
  - H3: Hiện được hỗ trợ
  - H4: Nội dung Skill
  - H4: Gói hook
  - H4: MCP cho OpenClaw nhúng
  - H4: Cài đặt OpenClaw nhúng
  - H4: LSP OpenClaw nhúng
  - H3: Được phát hiện nhưng không thực thi
  - H2: Định dạng bundle
  - H2: Thứ tự ưu tiên phát hiện
  - H2: Phụ thuộc runtime và dọn dẹp
  - H2: Bảo mật
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/cli-backend-plugins.md

- Đường dẫn: /plugins/cli-backend-plugins
- Tiêu đề:
  - H2: Phần Plugin sở hữu
  - H2: Plugin backend tối thiểu
  - H2: Hình dạng cấu hình
  - H2: Hook backend nâng cao
  - H3: ownsNativeCompaction: chọn không dùng Compaction của OpenClaw
  - H2: Cầu nối công cụ MCP
  - H2: Cấu hình người dùng
  - H2: Xác minh
  - H2: Danh sách kiểm tra
  - H2: Liên quan

## plugins/codex-computer-use.md

- Đường dẫn: /plugins/codex-computer-use
- Tiêu đề:
  - H2: OpenClaw.app và Peekaboo
  - H2: Ứng dụng iOS
  - H2: MCP cua-driver trực tiếp
  - H2: Thiết lập nhanh
  - H2: Lệnh
  - H2: Lựa chọn marketplace
  - H2: Marketplace macOS đi kèm
  - H2: Giới hạn catalog từ xa
  - H2: Tham chiếu cấu hình
  - H2: OpenClaw kiểm tra gì
  - H2: Quyền macOS
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/codex-harness-reference.md

- Đường dẫn: /plugins/codex-harness-reference
- Tiêu đề:
  - H2: Bề mặt cấu hình Plugin
  - H2: Phương thức truyền app-server
  - H2: Chế độ phê duyệt và sandbox
  - H2: Thực thi native trong sandbox
  - H2: Cô lập xác thực và môi trường
  - H2: Công cụ động
  - H2: Timeout
  - H2: Khám phá mô hình
  - H2: Tệp bootstrap workspace
  - H2: Ghi đè môi trường
  - H2: Liên quan

## plugins/codex-harness-runtime.md

- Đường dẫn: /plugins/codex-harness-runtime
- Tiêu đề:
  - H2: Tổng quan
  - H2: Ràng buộc luồng và thay đổi mô hình
  - H2: Phản hồi hiển thị và Heartbeat
  - H2: Ranh giới hook
  - H2: Hợp đồng hỗ trợ V1
  - H2: Quyền native và MCP elicitations
  - H2: Điều hướng hàng đợi
  - H2: Tải lên phản hồi Codex
  - H2: Compaction và bản sao transcript
  - H2: Media và phân phối
  - H2: Liên quan

## plugins/codex-harness.md

- Đường dẫn: /plugins/codex-harness
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Quickstart
  - H2: Chia sẻ luồng với Codex Desktop và CLI
  - H2: Cấu hình
  - H2: Xác minh runtime Codex
  - H2: Định tuyến và chọn mô hình
  - H2: Mẫu triển khai
  - H3: Triển khai Codex cơ bản
  - H3: Triển khai provider hỗn hợp
  - H3: Triển khai Codex fail-closed
  - H2: Chính sách app-server
  - H2: Lệnh và chẩn đoán
  - H3: Kiểm tra luồng Codex cục bộ
  - H2: Plugin Codex native
  - H2: Computer Use
  - H2: Ranh giới runtime
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/codex-native-plugins.md

- Đường dẫn: /plugins/codex-native-plugins
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Quickstart
  - H2: Quản lý Plugin từ chat
  - H2: Cách thiết lập Plugin native hoạt động
  - H2: Ranh giới hỗ trợ V1
  - H2: Inventory ứng dụng và quyền sở hữu
  - H2: Cấu hình ứng dụng luồng
  - H2: Chính sách hành động phá hủy
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/community.md

- Đường dẫn: /plugins/community
- Tiêu đề:
  - H2: Tìm Plugin
  - H2: Phát hành Plugin
  - H2: Liên quan

## plugins/compatibility.md

- Đường dẫn: /plugins/compatibility
- Tiêu đề:
  - H2: Registry tương thích
  - H2: Package inspector Plugin
  - H3: Lane chấp nhận của maintainer
  - H2: Chính sách ngừng hỗ trợ
  - H2: Khu vực tương thích hiện tại
  - H3: Alias phẳng cho callback inbound WhatsApp
  - H3: Trường tiếp nhận inbound WhatsApp
  - H2: Ghi chú phát hành

## plugins/copilot.md

- Đường dẫn: /plugins/copilot
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Cài đặt Plugin
  - H2: Quickstart
  - H2: Provider được hỗ trợ
  - H2: BYOK
  - H2: Auth
  - H2: Bề mặt cấu hình
  - H2: Compaction
  - H2: Phản chiếu transcript
  - H2: Câu hỏi phụ (/btw)
  - H2: Doctor
  - H2: Giới hạn
  - H2: Quyền và askuser
  - H3: Token GitHub cấp phiên
  - H2: Liên quan

## plugins/dependency-resolution.md

- Đường dẫn: /plugins/dependency-resolution
- Tiêu đề:
  - H2: Phân chia trách nhiệm
  - H2: Gốc cài đặt
  - H2: Plugin cục bộ
  - H2: Khởi động và tải lại
  - H2: Plugin đi kèm
  - H2: Dọn dẹp legacy

## plugins/google-meet.md

- Tuyến: /plugins/google-meet
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H3: Gateway cục bộ + Parallels Chrome
  - H2: Ghi chú cài đặt
  - H2: Transport
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth và kiểm tra trước
  - H3: Tạo thông tin xác thực Google
  - H3: Tạo refresh token
  - H3: Xác minh OAuth bằng doctor
  - H2: Cấu hình
  - H2: Công cụ
  - H2: Chế độ agent và bidi
  - H2: Danh sách kiểm tra kiểm thử trực tiếp
  - H2: Khắc phục sự cố
  - H3: Agent không thấy công cụ Google Meet
  - H3: Không có node có khả năng Google Meet nào được kết nối
  - H3: Trình duyệt mở nhưng agent không thể tham gia
  - H3: Tạo cuộc họp thất bại
  - H3: Agent tham gia nhưng không nói
  - H3: Kiểm tra thiết lập Twilio thất bại
  - H3: Cuộc gọi Twilio bắt đầu nhưng không bao giờ vào cuộc họp
  - H2: Ghi chú
  - H2: Liên quan

## plugins/hooks.md

- Tuyến: /plugins/hooks
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Danh mục hook
  - H2: Gỡ lỗi hook runtime
  - H2: Chính sách gọi công cụ
  - H3: Hook môi trường exec
  - H3: Lưu giữ kết quả công cụ
  - H2: Hook prompt và mô hình
  - H3: Tiện ích mở rộng phiên và chèn vào lượt tiếp theo
  - H2: Hook tin nhắn
  - H2: Hook cài đặt
  - H2: Vòng đời Gateway
  - H2: Các tính năng sắp ngừng hỗ trợ
  - H2: Liên quan

## plugins/install-overrides.md

- Tuyến: /plugins/install-overrides
- Tiêu đề:
  - H2: Môi trường
  - H2: Hành vi
  - H2: Package E2E

## plugins/llama-cpp.md

- Tuyến: /plugins/llama-cpp
- Tiêu đề:
  - H2: Cấu hình
  - H2: Native Runtime

## plugins/manage-plugins.md

- Tuyến: /plugins/manage-plugins
- Tiêu đề:
  - H2: Liệt kê và tìm kiếm plugin
  - H2: Cài đặt plugin
  - H2: Khởi động lại và kiểm tra
  - H2: Cập nhật plugin
  - H2: Gỡ cài đặt plugin
  - H2: Chọn nguồn
  - H2: Xuất bản plugin
  - H2: Liên quan

## plugins/manifest.md

- Tuyến: /plugins/manifest
- Tiêu đề:
  - H2: Tệp này làm gì
  - H2: Ví dụ tối thiểu
  - H2: Ví dụ phong phú
  - H2: Tham chiếu trường cấp cao nhất
  - H2: Tham chiếu metadata nhà cung cấp sinh nội dung
  - H2: Tham chiếu metadata công cụ
  - H2: Tham chiếu providerAuthChoices
  - H2: Tham chiếu commandAliases
  - H2: Tham chiếu activation
  - H2: Tham chiếu qaRunners
  - H2: Tham chiếu setup
  - H3: Tham chiếu setup.providers
  - H3: Các trường setup
  - H2: Tham chiếu uiHints
  - H2: Tham chiếu contracts
  - H2: Tham chiếu mediaUnderstandingProviderMetadata
  - H2: Tham chiếu channelConfigs
  - H3: Thay thế một plugin kênh khác
  - H2: Tham chiếu modelSupport
  - H2: Tham chiếu modelCatalog
  - H2: Tham chiếu modelIdNormalization
  - H2: Tham chiếu providerEndpoints
  - H2: Tham chiếu providerRequest
  - H2: Tham chiếu secretProviderIntegrations
  - H2: Tham chiếu modelPricing
  - H3: OpenClaw Provider Index
  - H2: Manifest so với package.json
  - H3: Các trường package.json ảnh hưởng đến khám phá
  - H2: Thứ tự ưu tiên khám phá (id plugin trùng lặp)
  - H2: Yêu cầu JSON Schema
  - H2: Hành vi xác thực
  - H2: Ghi chú
  - H2: Liên quan

## plugins/memory-lancedb.md

- Tuyến: /plugins/memory-lancedb
- Tiêu đề:
  - H2: Cài đặt
  - H2: Bắt đầu nhanh
  - H2: Embedding dựa trên nhà cung cấp
  - H2: Embedding Ollama
  - H2: Nhà cung cấp tương thích OpenAI
  - H2: Giới hạn truy hồi và ghi nhận
  - H2: Lệnh
  - H2: Lưu trữ
  - H2: Phụ thuộc runtime
  - H2: Khắc phục sự cố
  - H3: Độ dài đầu vào vượt quá độ dài ngữ cảnh
  - H3: Mô hình embedding không được hỗ trợ
  - H3: Plugin tải nhưng không có ký ức nào xuất hiện
  - H2: Liên quan

## plugins/memory-wiki.md

- Tuyến: /plugins/memory-wiki
- Tiêu đề:
  - H2: Nội dung được thêm
  - H2: Cách nó khớp với bộ nhớ
  - H2: Mẫu lai được khuyến nghị
  - H2: Chế độ kho lưu trữ
  - H3: cô lập
  - H3: bridge
  - H3: unsafe-local
  - H2: Bố cục kho lưu trữ
  - H2: Nhập Open Knowledge Format
  - H2: Tuyên bố có cấu trúc và bằng chứng
  - H2: Metadata thực thể dành cho agent
  - H2: Pipeline biên dịch
  - H2: Dashboard và báo cáo sức khỏe
  - H2: Tìm kiếm và truy xuất
  - H2: Công cụ agent
  - H2: Hành vi prompt và ngữ cảnh
  - H2: Cấu hình
  - H3: Ví dụ: QMD + chế độ bridge
  - H2: CLI
  - H2: Hỗ trợ Obsidian
  - H2: Quy trình làm việc được khuyến nghị
  - H2: Tài liệu liên quan

## plugins/message-presentation.md

- Tuyến: /plugins/message-presentation
- Tiêu đề:
  - H2: Hợp đồng
  - H2: Ví dụ producer
  - H2: Hợp đồng renderer
  - H2: Luồng render lõi
  - H2: Quy tắc suy giảm
  - H3: Khả năng hiển thị fallback giá trị nút
  - H2: Ánh xạ nhà cung cấp
  - H2: Presentation so với InteractiveReply
  - H2: Ghim gửi
  - H2: Danh sách kiểm tra dành cho tác giả plugin
  - H2: Tài liệu liên quan

## plugins/oc-path.md

- Tuyến: /plugins/oc-path
- Tiêu đề:
  - H2: Vì sao bật nó
  - H2: Nơi nó chạy
  - H2: Bật
  - H2: Phụ thuộc
  - H2: Nội dung nó cung cấp
  - H2: Quan hệ với các plugin khác
  - H2: An toàn
  - H2: Liên quan

## plugins/plugin-inventory.md

- Tuyến: /plugins/plugin-inventory
- Tiêu đề:
  - H1: Kiểm kê plugin
  - H2: Định nghĩa
  - H2: Cài đặt plugin
  - H2: Gói npm lõi
  - H2: Gói chính thức bên ngoài
  - H2: Chỉ checkout mã nguồn

## plugins/plugin-permission-requests.md

- Tuyến: /plugins/plugin-permission-requests
- Tiêu đề:
  - H2: Chọn gate phù hợp
  - H2: Yêu cầu phê duyệt trước khi gọi công cụ
  - H2: Hành vi quyết định
  - H2: Định tuyến prompt phê duyệt
  - H2: Quyền native của Codex
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/reference.md

- Tuyến: /plugins/reference
- Tiêu đề:
  - H1: Tham chiếu plugin

## plugins/reference/acpx.md

- Tuyến: /plugins/reference/acpx
- Tiêu đề:
  - H1: Plugin ACPx
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/admin-http-rpc.md

- Tuyến: /plugins/reference/admin-http-rpc
- Tiêu đề:
  - H1: Plugin Admin Http Rpc
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/alibaba.md

- Tuyến: /plugins/reference/alibaba
- Tiêu đề:
  - H1: Plugin Alibaba
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/amazon-bedrock-mantle.md

- Tuyến: /plugins/reference/amazon-bedrock-mantle
- Tiêu đề:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/amazon-bedrock.md

- Tuyến: /plugins/reference/amazon-bedrock
- Tiêu đề:
  - H1: Plugin Amazon Bedrock
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/anthropic-vertex.md

- Tuyến: /plugins/reference/anthropic-vertex
- Tiêu đề:
  - H1: Plugin Anthropic Vertex
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Tuyến: /plugins/reference/anthropic
- Tiêu đề:
  - H1: Plugin Anthropic
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/arcee.md

- Tuyến: /plugins/reference/arcee
- Tiêu đề:
  - H1: Plugin Arcee
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/azure-speech.md

- Tuyến: /plugins/reference/azure-speech
- Tiêu đề:
  - H1: Plugin Azure Speech
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/bonjour.md

- Tuyến: /plugins/reference/bonjour
- Tiêu đề:
  - H1: Plugin Bonjour
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/brave.md

- Tuyến: /plugins/reference/brave
- Tiêu đề:
  - H1: Plugin Brave
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/browser.md

- Tuyến: /plugins/reference/browser
- Tiêu đề:
  - H1: Plugin Browser
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/byteplus.md

- Tuyến: /plugins/reference/byteplus
- Tiêu đề:
  - H1: Plugin BytePlus
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/canvas.md

- Tuyến: /plugins/reference/canvas
- Tiêu đề:
  - H1: Plugin Canvas
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/cerebras.md

- Tuyến: /plugins/reference/cerebras
- Tiêu đề:
  - H1: Plugin Cerebras
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/chutes.md

- Tuyến: /plugins/reference/chutes
- Tiêu đề:
  - H1: Plugin Chutes
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/clawrouter.md

- Tuyến: /plugins/reference/clawrouter
- Tiêu đề:
  - H1: Plugin ClawRouter
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/clickclack.md

- Tuyến: /plugins/reference/clickclack
- Tiêu đề:
  - H1: Plugin Clickclack
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/cloudflare-ai-gateway.md

- Tuyến: /plugins/reference/cloudflare-ai-gateway
- Tiêu đề:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/codex-supervisor.md

- Tuyến: /plugins/reference/codex-supervisor
- Tiêu đề:
  - H1: Plugin Codex Supervisor
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Liệt kê phiên

## plugins/reference/codex.md

- Tuyến: /plugins/reference/codex
- Tiêu đề:
  - H1: Plugin Codex
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/cohere.md

- Tuyến: /plugins/reference/cohere
- Tiêu đề:
  - H1: Plugin Cohere
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/comfy.md

- Tuyến: /plugins/reference/comfy
- Tiêu đề:
  - H1: Plugin ComfyUI
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/copilot-proxy.md

- Tuyến: /plugins/reference/copilot-proxy
- Tiêu đề:
  - H1: Plugin Copilot Proxy
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/copilot.md

- Tuyến: /plugins/reference/copilot
- Tiêu đề:
  - H1: Plugin Copilot
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/deepgram.md

- Tuyến: /plugins/reference/deepgram
- Tiêu đề:
  - H1: Plugin Deepgram
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/deepinfra.md

- Tuyến: /plugins/reference/deepinfra
- Tiêu đề:
  - H1: Plugin DeepInfra
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/deepseek.md

- Tuyến: /plugins/reference/deepseek
- Tiêu đề:
  - H1: Plugin DeepSeek
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/diagnostics-otel.md

- Tuyến: /plugins/reference/diagnostics-otel
- Tiêu đề:
  - H1: Plugin Diagnostics OpenTelemetry
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/diagnostics-prometheus.md

- Tuyến: /plugins/reference/diagnostics-prometheus
- Tiêu đề:
  - H1: Plugin Diagnostics Prometheus
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/diffs-language-pack.md

- Tuyến: /plugins/reference/diffs-language-pack
- Tiêu đề:
  - H1: Plugin Diffs Language Pack
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Ngôn ngữ được thêm

## plugins/reference/diffs.md

- Tuyến: /plugins/reference/diffs
- Tiêu đề:
  - H1: Plugin Diffs
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/discord.md

- Tuyến: /plugins/reference/discord
- Tiêu đề:
  - H1: Plugin Discord
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/document-extract.md

- Tuyến: /plugins/reference/document-extract
- Tiêu đề:
  - H1: Plugin Document Extract
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/duckduckgo.md

- Tuyến: /plugins/reference/duckduckgo
- Tiêu đề:
  - H1: Plugin DuckDuckGo
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/elevenlabs.md

- Tuyến: /plugins/reference/elevenlabs
- Tiêu đề:
  - H1: Plugin Elevenlabs
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/exa.md

- Tuyến: /plugins/reference/exa
- Tiêu đề:
  - H1: Plugin Exa
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/fal.md

- Tuyến: /plugins/reference/fal
- Tiêu đề:
  - H1: Plugin fal
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/feishu.md

- Tuyến: /plugins/reference/feishu
- Tiêu đề:
  - H1: Plugin Feishu
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/file-transfer.md

- Tuyến: /plugins/reference/file-transfer
- Tiêu đề:
  - H1: Plugin File Transfer
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/firecrawl.md

- Tuyến: /plugins/reference/firecrawl
- Đề mục:
  - H1: Plugin Firecrawl
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/fireworks.md

- Tuyến: /plugins/reference/fireworks
- Đề mục:
  - H1: Plugin Fireworks
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/github-copilot.md

- Tuyến: /plugins/reference/github-copilot
- Đề mục:
  - H1: Plugin GitHub Copilot
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/gmi.md

- Tuyến: /plugins/reference/gmi
- Đề mục:
  - H1: Plugin Gmi
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/google-meet.md

- Tuyến: /plugins/reference/google-meet
- Đề mục:
  - H1: Plugin Google Meet
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/google.md

- Tuyến: /plugins/reference/google
- Đề mục:
  - H1: Plugin Google
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/googlechat.md

- Tuyến: /plugins/reference/googlechat
- Đề mục:
  - H1: Plugin Google Chat
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/gradium.md

- Tuyến: /plugins/reference/gradium
- Đề mục:
  - H1: Plugin Gradium
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/groq.md

- Tuyến: /plugins/reference/groq
- Đề mục:
  - H1: Plugin Groq
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/huggingface.md

- Tuyến: /plugins/reference/huggingface
- Đề mục:
  - H1: Plugin Hugging Face
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/imessage.md

- Tuyến: /plugins/reference/imessage
- Đề mục:
  - H1: Plugin iMessage
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/inworld.md

- Tuyến: /plugins/reference/inworld
- Đề mục:
  - H1: Plugin Inworld
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/irc.md

- Tuyến: /plugins/reference/irc
- Đề mục:
  - H1: Plugin IRC
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/kilocode.md

- Tuyến: /plugins/reference/kilocode
- Đề mục:
  - H1: Plugin Kilocode
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/kimi.md

- Tuyến: /plugins/reference/kimi
- Đề mục:
  - H1: Plugin Kimi
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/line.md

- Tuyến: /plugins/reference/line
- Đề mục:
  - H1: Plugin LINE
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/litellm.md

- Tuyến: /plugins/reference/litellm
- Đề mục:
  - H1: Plugin LiteLLM
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/llama-cpp.md

- Tuyến: /plugins/reference/llama-cpp
- Đề mục:
  - H1: Plugin Llama Cpp
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/llm-task.md

- Tuyến: /plugins/reference/llm-task
- Đề mục:
  - H1: Plugin tác vụ LLM
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/lmstudio.md

- Tuyến: /plugins/reference/lmstudio
- Đề mục:
  - H1: Plugin LM Studio
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/lobster.md

- Tuyến: /plugins/reference/lobster
- Đề mục:
  - H1: Plugin Lobster
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/matrix.md

- Tuyến: /plugins/reference/matrix
- Đề mục:
  - H1: Plugin Matrix
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/mattermost.md

- Tuyến: /plugins/reference/mattermost
- Đề mục:
  - H1: Plugin Mattermost
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/memory-core.md

- Tuyến: /plugins/reference/memory-core
- Đề mục:
  - H1: Plugin lõi bộ nhớ
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/memory-lancedb.md

- Tuyến: /plugins/reference/memory-lancedb
- Đề mục:
  - H1: Plugin bộ nhớ Lancedb
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/memory-wiki.md

- Tuyến: /plugins/reference/memory-wiki
- Đề mục:
  - H1: Plugin wiki bộ nhớ
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/microsoft-foundry.md

- Tuyến: /plugins/reference/microsoft-foundry
- Đề mục:
  - H1: Plugin Microsoft Foundry
  - H2: Phân phối
  - H2: Giao diện
  - H2: Yêu cầu
  - H2: Mô hình trò chuyện
  - H2: Tạo hình ảnh MAI
  - H2: Khắc phục sự cố

## plugins/reference/microsoft.md

- Tuyến: /plugins/reference/microsoft
- Đề mục:
  - H1: Plugin Microsoft
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/migrate-claude.md

- Tuyến: /plugins/reference/migrate-claude
- Đề mục:
  - H1: Plugin di chuyển Claude
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/migrate-hermes.md

- Tuyến: /plugins/reference/migrate-hermes
- Đề mục:
  - H1: Plugin di chuyển Hermes
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/minimax.md

- Tuyến: /plugins/reference/minimax
- Đề mục:
  - H1: Plugin MiniMax
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/mistral.md

- Tuyến: /plugins/reference/mistral
- Đề mục:
  - H1: Plugin Mistral
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/moonshot.md

- Tuyến: /plugins/reference/moonshot
- Đề mục:
  - H1: Plugin Moonshot
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/msteams.md

- Tuyến: /plugins/reference/msteams
- Đề mục:
  - H1: Plugin Microsoft Teams
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/nextcloud-talk.md

- Tuyến: /plugins/reference/nextcloud-talk
- Đề mục:
  - H1: Plugin Nextcloud Talk
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/nostr.md

- Tuyến: /plugins/reference/nostr
- Đề mục:
  - H1: Plugin Nostr
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/novita.md

- Tuyến: /plugins/reference/novita
- Đề mục:
  - H1: Plugin Novita
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/nvidia.md

- Tuyến: /plugins/reference/nvidia
- Đề mục:
  - H1: Plugin NVIDIA
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/oc-path.md

- Tuyến: /plugins/reference/oc-path
- Đề mục:
  - H1: Plugin đường dẫn Oc
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/ollama.md

- Tuyến: /plugins/reference/ollama
- Đề mục:
  - H1: Plugin Ollama
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/open-prose.md

- Tuyến: /plugins/reference/open-prose
- Đề mục:
  - H1: Plugin Open Prose
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/openai.md

- Tuyến: /plugins/reference/openai
- Đề mục:
  - H1: Plugin OpenAI
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/opencode-go.md

- Tuyến: /plugins/reference/opencode-go
- Đề mục:
  - H1: Plugin OpenCode Go
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/opencode.md

- Tuyến: /plugins/reference/opencode
- Đề mục:
  - H1: Plugin OpenCode
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/openrouter.md

- Tuyến: /plugins/reference/openrouter
- Đề mục:
  - H1: Plugin OpenRouter
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/openshell.md

- Tuyến: /plugins/reference/openshell
- Đề mục:
  - H1: Plugin Openshell
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/perplexity.md

- Tuyến: /plugins/reference/perplexity
- Đề mục:
  - H1: Plugin Perplexity
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/pixverse.md

- Tuyến: /plugins/reference/pixverse
- Đề mục:
  - H1: Plugin PixVerse
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/policy.md

- Tuyến: /plugins/reference/policy
- Đề mục:
  - H1: Plugin chính sách
  - H2: Phân phối
  - H2: Giao diện
  - H2: Hành vi
  - H2: Tài liệu liên quan

## plugins/reference/qa-channel.md

- Tuyến: /plugins/reference/qa-channel
- Đề mục:
  - H1: Plugin kênh QA
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/qa-lab.md

- Tuyến: /plugins/reference/qa-lab
- Đề mục:
  - H1: Plugin phòng thí nghiệm QA
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/qa-matrix.md

- Tuyến: /plugins/reference/qa-matrix
- Đề mục:
  - H1: Plugin ma trận QA
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/qianfan.md

- Tuyến: /plugins/reference/qianfan
- Đề mục:
  - H1: Plugin Qianfan
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/qqbot.md

- Tuyến: /plugins/reference/qqbot
- Đề mục:
  - H1: Plugin QQ Bot
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/qwen.md

- Tuyến: /plugins/reference/qwen
- Đề mục:
  - H1: Plugin Qwen
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/raft.md

- Tuyến: /plugins/reference/raft
- Đề mục:
  - H1: Plugin Raft
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/runway.md

- Tuyến: /plugins/reference/runway
- Đề mục:
  - H1: Plugin Runway
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/searxng.md

- Tuyến: /plugins/reference/searxng
- Đề mục:
  - H1: Plugin SearXNG
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/senseaudio.md

- Tuyến: /plugins/reference/senseaudio
- Đề mục:
  - H1: Plugin Senseaudio
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/sglang.md

- Tuyến: /plugins/reference/sglang
- Đề mục:
  - H1: Plugin SGLang
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/signal.md

- Tuyến: /plugins/reference/signal
- Đề mục:
  - H1: Plugin Signal
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/slack.md

- Tuyến: /plugins/reference/slack
- Đề mục:
  - H1: Plugin Slack
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/sms.md

- Tuyến: /plugins/reference/sms
- Đề mục:
  - H1: Plugin SMS
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/stepfun.md

- Tuyến: /plugins/reference/stepfun
- Đề mục:
  - H1: Plugin StepFun
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/synology-chat.md

- Tuyến: /plugins/reference/synology-chat
- Đề mục:
  - H1: Plugin Synology Chat
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/synthetic.md

- Tuyến: /plugins/reference/synthetic
- Đề mục:
  - H1: Plugin tổng hợp
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/tavily.md

- Tuyến: /plugins/reference/tavily
- Đề mục:
  - H1: Plugin Tavily
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/telegram.md

- Tuyến: /plugins/reference/telegram
- Đề mục:
  - H1: Plugin Telegram
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/tencent.md

- Tuyến: /plugins/reference/tencent
- Đề mục:
  - H1: Plugin Tencent
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/tlon.md

- Tuyến: /plugins/reference/tlon
- Đề mục:
  - H1: Plugin Tlon
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/together.md

- Tuyến: /plugins/reference/together
- Đề mục:
  - H1: Plugin Together
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/tokenjuice.md

- Tuyến: /plugins/reference/tokenjuice
- Đề mục:
  - H1: Plugin Tokenjuice
  - H2: Phân phối
  - H2: Giao diện
  - H2: Tài liệu liên quan

## plugins/reference/tts-local-cli.md

- Tuyến: /plugins/reference/tts-local-cli
- Đề mục:
  - H1: Plugin CLI TTS cục bộ
  - H2: Phân phối
  - H2: Giao diện

## plugins/reference/twitch.md

- Đường dẫn: /plugins/reference/twitch
- Tiêu đề:
  - H1: Plugin Twitch
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/venice.md

- Đường dẫn: /plugins/reference/venice
- Tiêu đề:
  - H1: Plugin Venice
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/vercel-ai-gateway.md

- Đường dẫn: /plugins/reference/vercel-ai-gateway
- Tiêu đề:
  - H1: Plugin Vercel AI Gateway
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/vllm.md

- Đường dẫn: /plugins/reference/vllm
- Tiêu đề:
  - H1: Plugin vLLM
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/voice-call.md

- Đường dẫn: /plugins/reference/voice-call
- Tiêu đề:
  - H1: Plugin Voice Call
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/volcengine.md

- Đường dẫn: /plugins/reference/volcengine
- Tiêu đề:
  - H1: Plugin Volcengine
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/voyage.md

- Đường dẫn: /plugins/reference/voyage
- Tiêu đề:
  - H1: Plugin Voyage
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/vydra.md

- Đường dẫn: /plugins/reference/vydra
- Tiêu đề:
  - H1: Plugin Vydra
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/web-readability.md

- Đường dẫn: /plugins/reference/web-readability
- Tiêu đề:
  - H1: Plugin Web Readability
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/webhooks.md

- Đường dẫn: /plugins/reference/webhooks
- Tiêu đề:
  - H1: Plugin Webhooks
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/whatsapp.md

- Đường dẫn: /plugins/reference/whatsapp
- Tiêu đề:
  - H1: Plugin WhatsApp
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/workboard.md

- Đường dẫn: /plugins/reference/workboard
- Tiêu đề:
  - H1: Plugin Workboard
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/xai.md

- Đường dẫn: /plugins/reference/xai
- Tiêu đề:
  - H1: Plugin xAI
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/xiaomi.md

- Đường dẫn: /plugins/reference/xiaomi
- Tiêu đề:
  - H1: Plugin Xiaomi
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/zai.md

- Đường dẫn: /plugins/reference/zai
- Tiêu đề:
  - H1: Plugin Z.AI
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/zalo.md

- Đường dẫn: /plugins/reference/zalo
- Tiêu đề:
  - H1: Plugin Zalo
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/zalouser.md

- Đường dẫn: /plugins/reference/zalouser
- Tiêu đề:
  - H1: Plugin Zalo Personal
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/sdk-agent-harness.md

- Đường dẫn: /plugins/sdk-agent-harness
- Tiêu đề:
  - H2: Khi nào dùng harness
  - H2: Core vẫn sở hữu những gì
  - H2: Đăng ký harness
  - H2: Chính sách lựa chọn
  - H2: Ghép cặp provider và harness
  - H3: Middleware kết quả công cụ
  - H3: Phân loại kết quả terminal
  - H3: Tác dụng phụ phía cuối agent
  - H3: Đầu vào người dùng và bề mặt công cụ
  - H3: Chế độ harness Codex gốc
  - H2: Độ nghiêm ngặt runtime
  - H2: Phiên gốc và bản sao transcript
  - H2: Kết quả công cụ và media
  - H2: Giới hạn hiện tại
  - H2: Liên quan

## plugins/sdk-channel-inbound.md

- Đường dẫn: /plugins/sdk-channel-inbound
- Tiêu đề:
  - H2: Trình trợ giúp core
  - H2: Di chuyển

## plugins/sdk-channel-ingress.md

- Đường dẫn: /plugins/sdk-channel-ingress
- Tiêu đề:
  - H1: API ingress kênh
  - H2: Bộ phân giải runtime
  - H2: Kết quả
  - H2: Nhóm truy cập
  - H2: Chế độ sự kiện
  - H2: Tuyến và kích hoạt
  - H2: Biên tập
  - H2: Xác minh

## plugins/sdk-channel-message.md

- Đường dẫn: /plugins/sdk-channel-message
- Tiêu đề: không có

## plugins/sdk-channel-outbound.md

- Đường dẫn: /plugins/sdk-channel-outbound
- Tiêu đề:
  - H2: Adapter
  - H2: Adapter outbound hiện có
  - H2: Gửi bền vững
  - H2: Điều phối tương thích

## plugins/sdk-channel-plugins.md

- Đường dẫn: /plugins/sdk-channel-plugins
- Tiêu đề:
  - H2: Cách Plugin kênh hoạt động
  - H2: Phê duyệt và khả năng của kênh
  - H2: Chính sách đề cập inbound
  - H2: Hướng dẫn từng bước
  - H2: Cấu trúc tệp
  - H2: Chủ đề nâng cao
  - H2: Bước tiếp theo
  - H2: Liên quan

## plugins/sdk-channel-turn.md

- Đường dẫn: /plugins/sdk-channel-turn
- Tiêu đề: không có

## plugins/sdk-entrypoints.md

- Đường dẫn: /plugins/sdk-entrypoints
- Tiêu đề:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Chế độ đăng ký
  - H2: Dạng Plugin
  - H2: Liên quan

## plugins/sdk-migration.md

- Đường dẫn: /plugins/sdk-migration
- Tiêu đề:
  - H2: Điều gì đang thay đổi
  - H2: Vì sao thay đổi này được thực hiện
  - H2: Kế hoạch di chuyển thoại talk và realtime
  - H2: Chính sách tương thích
  - H2: Cách di chuyển
  - H2: Tham chiếu đường dẫn import
  - H2: Các mục không dùng nữa đang hoạt động
  - H2: Lộ trình gỡ bỏ
  - H2: Tạm thời tắt cảnh báo
  - H2: Liên quan

## plugins/sdk-overview.md

- Đường dẫn: /plugins/sdk-overview
- Tiêu đề:
  - H2: Quy ước import
  - H2: Tham chiếu subpath
  - H2: API đăng ký
  - H3: Đăng ký capability
  - H3: Công cụ và lệnh
  - H3: Hạ tầng
  - H3: Hook host cho Plugin workflow
  - H3: Đăng ký khám phá Gateway
  - H3: Siêu dữ liệu đăng ký CLI
  - H3: Đăng ký backend CLI
  - H3: Slot độc quyền
  - H3: Adapter nhúng bộ nhớ không dùng nữa
  - H3: Sự kiện và vòng đời
  - H3: Ngữ nghĩa quyết định hook
  - H3: Trường đối tượng API
  - H2: Quy ước module nội bộ
  - H2: Liên quan

## plugins/sdk-provider-plugins.md

- Đường dẫn: /plugins/sdk-provider-plugins
- Tiêu đề:
  - H2: Hướng dẫn từng bước
  - H2: Xuất bản lên ClawHub
  - H2: Cấu trúc tệp
  - H2: Tham chiếu thứ tự catalog
  - H2: Bước tiếp theo
  - H2: Liên quan

## plugins/sdk-runtime.md

- Đường dẫn: /plugins/sdk-runtime
- Tiêu đề:
  - H2: Tải và ghi config
  - H2: Tiện ích runtime có thể tái sử dụng
  - H2: Namespace runtime
  - H2: Lưu trữ tham chiếu runtime
  - H2: Các trường api cấp cao nhất khác
  - H2: Liên quan

## plugins/sdk-setup.md

- Đường dẫn: /plugins/sdk-setup
- Tiêu đề:
  - H2: Siêu dữ liệu gói
  - H3: Trường openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Hoãn tải đầy đủ
  - H2: Manifest Plugin
  - H2: Xuất bản ClawHub
  - H2: Điểm vào setup
  - H3: Import trình trợ giúp setup phạm vi hẹp
  - H3: Nâng cấp tài khoản đơn do kênh sở hữu
  - H2: Schema config
  - H3: Xây dựng schema config kênh
  - H2: Trình hướng dẫn setup
  - H2: Xuất bản và cài đặt
  - H2: Liên quan

## plugins/sdk-subpaths.md

- Đường dẫn: /plugins/sdk-subpaths
- Tiêu đề:
  - H2: Điểm vào Plugin
  - H3: Tương thích và trình trợ giúp kiểm thử không dùng nữa
  - H3: Subpath trình trợ giúp Plugin bundled được dành riêng
  - H2: Liên quan

## plugins/sdk-testing.md

- Đường dẫn: /plugins/sdk-testing
- Tiêu đề:
  - H2: Tiện ích kiểm thử
  - H3: Export có sẵn
  - H3: Kiểu
  - H2: Kiểm thử phân giải target
  - H2: Mẫu kiểm thử
  - H3: Kiểm thử hợp đồng đăng ký
  - H3: Kiểm thử truy cập config runtime
  - H3: Kiểm thử đơn vị một Plugin kênh
  - H3: Kiểm thử đơn vị một Plugin provider
  - H3: Mock runtime Plugin
  - H3: Kiểm thử với stub theo từng instance
  - H2: Kiểm thử hợp đồng (Plugin trong repo)
  - H3: Chạy kiểm thử theo phạm vi
  - H2: Thực thi lint (Plugin trong repo)
  - H2: Cấu hình kiểm thử
  - H2: Liên quan

## plugins/tool-plugins.md

- Đường dẫn: /plugins/tool-plugins
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Bắt đầu nhanh
  - H2: Viết công cụ
  - H2: Công cụ tùy chọn và factory
  - H2: Giá trị trả về
  - H2: Cấu hình
  - H2: Siêu dữ liệu được tạo
  - H2: Siêu dữ liệu gói
  - H2: Xác thực trong CI
  - H2: Cài đặt và kiểm tra cục bộ
  - H2: Xuất bản
  - H2: Khắc phục sự cố
  - H3: không tìm thấy điểm vào Plugin: ./dist/index.js
  - H3: điểm vào Plugin không expose siêu dữ liệu defineToolPlugin
  - H3: siêu dữ liệu được tạo openclaw.plugin.json đã cũ
  - H3: package.json openclaw.extensions phải bao gồm ./dist/index.js
  - H3: Không tìm thấy package 'typebox'
  - H3: Công cụ không xuất hiện sau khi cài đặt
  - H2: Xem thêm

## plugins/voice-call.md

- Đường dẫn: /plugins/voice-call
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cấu hình
  - H2: Phạm vi phiên
  - H2: Cuộc trò chuyện thoại realtime
  - H3: Chính sách công cụ
  - H3: Ngữ cảnh thoại của agent
  - H3: Ví dụ provider realtime
  - H2: Phiên âm streaming
  - H3: Ví dụ provider streaming
  - H2: TTS cho cuộc gọi
  - H3: Ví dụ TTS
  - H2: Cuộc gọi inbound
  - H3: Định tuyến theo từng số
  - H3: Hợp đồng đầu ra lời nói
  - H3: Hành vi khởi động cuộc trò chuyện
  - H3: Khoảng chờ ngắt kết nối stream Twilio
  - H2: Bộ dọn cuộc gọi cũ
  - H2: Bảo mật Webhook
  - H2: CLI
  - H2: Công cụ agent
  - H2: RPC Gateway
  - H2: Khắc phục sự cố
  - H3: Setup thất bại khi expose webhook
  - H3: Thông tin xác thực provider thất bại
  - H3: Cuộc gọi bắt đầu nhưng webhook provider không tới
  - H3: Xác minh chữ ký thất bại
  - H3: Google Meet Twilio join thất bại
  - H3: Cuộc gọi realtime không có tiếng nói
  - H2: Liên quan

## plugins/webhooks.md

- Đường dẫn: /plugins/webhooks
- Tiêu đề:
  - H2: Nơi chạy
  - H2: Cấu hình tuyến
  - H2: Mô hình bảo mật
  - H2: Định dạng request
  - H2: Hành động được hỗ trợ
  - H3: createflow
  - H3: runtask
  - H2: Dạng response
  - H2: Tài liệu liên quan

## plugins/workboard.md

- Đường dẫn: /plugins/workboard
- Tiêu đề:
  - H2: Trạng thái mặc định
  - H2: Thẻ chứa gì
  - H2: Thực thi thẻ và tác vụ
  - H2: Điều phối agent
  - H3: Lựa chọn worker dispatch
  - H3: Prompt và vòng đời worker
  - H3: Điểm vào dispatch
  - H2: CLI và lệnh slash
  - H2: Đồng bộ vòng đời phiên
  - H2: Workflow dashboard
  - H2: Quyền
  - H2: Cấu hình
  - H2: Khắc phục sự cố
  - H3: Tab báo Workboard không khả dụng
  - H3: Thẻ không lưu
  - H3: Khởi động thẻ không mở phiên mong đợi
  - H3: Dispatch không khởi động worker
  - H2: Liên quan

## plugins/zalouser.md

- Đường dẫn: /plugins/zalouser
- Tiêu đề:
  - H2: Đặt tên
  - H2: Nơi chạy
  - H2: Cài đặt
  - H3: Tùy chọn A: cài đặt từ npm
  - H3: Tùy chọn B: cài đặt từ thư mục cục bộ (dev)
  - H2: Config
  - H2: CLI
  - H2: Công cụ agent
  - H2: Liên quan

## prose.md

- Đường dẫn: /prose
- Tiêu đề:
  - H2: Cài đặt
  - H2: Lệnh slash
  - H2: Nó có thể làm gì
  - H2: Ví dụ: nghiên cứu và tổng hợp song song
  - H2: Ánh xạ runtime OpenClaw
  - H2: Vị trí tệp
  - H2: Backend trạng thái
  - H2: Bảo mật
  - H2: Liên quan

## providers/alibaba.md

- Đường dẫn: /providers/alibaba
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Model Wan tích hợp
  - H2: Khả năng và giới hạn
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/anthropic.md

- Đường dẫn: /providers/anthropic
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Mặc định thinking (Claude Fable 5, 4.8 và 4.6)
  - H2: Fallback từ chối an toàn (Claude Fable 5)
  - H3: Vì sao tồn tại phần này
  - H3: Cách hoạt động
  - H3: Khả năng quan sát và tính phí
  - H3: Phạm vi
  - H2: Lưu cache prompt
  - H2: Cấu hình nâng cao
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/arcee.md

- Đường dẫn: /providers/arcee
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Setup không tương tác
  - H2: Catalog tích hợp
  - H2: Tính năng được hỗ trợ
  - H2: Liên quan

## providers/azure-speech.md

- Đường dẫn: /providers/azure-speech
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tùy chọn cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## providers/bedrock-mantle.md

- Đường dẫn: /providers/bedrock-mantle
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tự động khám phá model
  - H3: Khu vực được hỗ trợ
  - H2: Cấu hình thủ công
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/bedrock.md

- Đường dẫn: /providers/bedrock
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tự động khám phá model
  - H2: Setup nhanh (đường dẫn AWS)
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/cerebras.md

- Đường dẫn: /providers/cerebras
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Setup không tương tác
  - H2: Catalog tích hợp
  - H2: Config thủ công
  - H2: Liên quan

## providers/chutes.md

- Tuyến: /providers/chutes
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Hành vi khám phá
  - H2: Bí danh mặc định
  - H2: Danh mục khởi đầu tích hợp
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/claude-max-api-proxy.md

- Tuyến: /providers/claude-max-api-proxy
- Tiêu đề:
  - H2: Vì sao dùng tính năng này?
  - H2: Cách hoạt động
  - H2: Bắt đầu
  - H2: Danh mục tích hợp
  - H2: Cấu hình nâng cao
  - H2: Ghi chú
  - H2: Liên quan

## providers/clawrouter.md

- Tuyến: /providers/clawrouter
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Khám phá mô hình
  - H2: Giao thức và provider Plugin
  - H2: Hạn mức và mức sử dụng
  - H2: Khắc phục sự cố
  - H2: Hành vi bảo mật
  - H2: Liên quan

## providers/cloudflare-ai-gateway.md

- Tuyến: /providers/cloudflare-ai-gateway
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Ví dụ không tương tác
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/cohere.md

- Tuyến: /providers/cohere
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Thiết lập chỉ bằng môi trường
  - H2: Liên quan

## providers/comfy.md

- Tuyến: /providers/comfy
- Tiêu đề:
  - H2: Nội dung được hỗ trợ
  - H2: Bắt đầu
  - H2: Cấu hình
  - H3: Khóa dùng chung
  - H3: Khóa theo từng khả năng
  - H2: Chi tiết workflow
  - H2: Liên quan

## providers/deepgram.md

- Tuyến: /providers/deepgram
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tùy chọn cấu hình
  - H2: STT phát trực tuyến cho Voice Call
  - H2: Ghi chú
  - H2: Liên quan

## providers/deepinfra.md

- Tuyến: /providers/deepinfra
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Lấy khóa API
  - H2: Thiết lập CLI
  - H2: Đoạn cấu hình
  - H2: Các bề mặt OpenClaw được hỗ trợ
  - H2: Mô hình có sẵn
  - H2: Ghi chú
  - H2: Liên quan

## providers/deepseek.md

- Tuyến: /providers/deepseek
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Danh mục tích hợp
  - H2: Suy nghĩ và công cụ
  - H2: Kiểm thử trực tiếp
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/ds4.md

- Tuyến: /providers/ds4
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Khởi động nhanh
  - H2: Cấu hình đầy đủ
  - H2: Khởi động theo yêu cầu
  - H2: Think Max
  - H2: Kiểm thử
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/elevenlabs.md

- Tuyến: /providers/elevenlabs
- Tiêu đề:
  - H2: Xác thực
  - H2: Chuyển văn bản thành giọng nói
  - H2: Chuyển giọng nói thành văn bản
  - H2: STT phát trực tuyến
  - H2: Liên quan

## providers/fal.md

- Tuyến: /providers/fal
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tạo hình ảnh
  - H2: Tạo video
  - H2: Tạo nhạc
  - H2: Liên quan

## providers/fireworks.md

- Tuyến: /providers/fireworks
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Thiết lập không tương tác
  - H2: Danh mục tích hợp
  - H2: ID mô hình Fireworks tùy chỉnh
  - H2: Liên quan

## providers/github-copilot.md

- Tuyến: /providers/github-copilot
- Tiêu đề:
  - H2: Ba cách dùng Copilot trong OpenClaw
  - H2: Cờ tùy chọn
  - H2: Thiết lập ban đầu không tương tác
  - H2: Embedding tìm kiếm bộ nhớ
  - H3: Cấu hình
  - H3: Cách hoạt động
  - H2: Liên quan

## providers/gmi.md

- Tuyến: /providers/gmi
- Tiêu đề:
  - H2: Thiết lập
  - H2: Mặc định
  - H2: Khi nào nên chọn GMI
  - H2: Mô hình
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/google.md

- Tuyến: /providers/google
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Khả năng
  - H2: Tìm kiếm web
  - H2: Tạo hình ảnh
  - H2: Tạo video
  - H2: Tạo nhạc
  - H2: Chuyển văn bản thành giọng nói
  - H2: Giọng nói thời gian thực
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/gradium.md

- Tuyến: /providers/gradium
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Thiết lập
  - H2: Cấu hình
  - H2: Giọng nói
  - H3: Ghi đè giọng nói theo từng thông báo
  - H2: Đầu ra
  - H2: Thứ tự tự động chọn
  - H2: Liên quan

## providers/groq.md

- Tuyến: /providers/groq
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H3: Ví dụ tệp cấu hình
  - H2: Danh mục tích hợp
  - H2: Mô hình suy luận
  - H2: Phiên âm âm thanh
  - H2: Liên quan

## providers/huggingface.md

- Tuyến: /providers/huggingface
- Tiêu đề:
  - H2: Bắt đầu
  - H3: Thiết lập không tương tác
  - H2: ID mô hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/index.md

- Tuyến: /providers
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Tài liệu provider
  - H2: Trang tổng quan dùng chung
  - H2: Provider phiên âm
  - H2: Công cụ cộng đồng

## providers/inferrs.md

- Tuyến: /providers/inferrs
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình đầy đủ
  - H2: Khởi động theo yêu cầu
  - H2: Cấu hình nâng cao
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/inworld.md

- Tuyến: /providers/inworld
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Tùy chọn cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## providers/kilocode.md

- Tuyến: /providers/kilocode
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Mô hình mặc định
  - H2: Danh mục tích hợp
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/litellm.md

- Tuyến: /providers/litellm
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Cấu hình
  - H3: Biến môi trường
  - H3: Tệp cấu hình
  - H2: Cấu hình nâng cao
  - H3: Tạo hình ảnh
  - H2: Liên quan

## providers/lmstudio.md

- Tuyến: /providers/lmstudio
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Thiết lập ban đầu không tương tác
  - H2: Cấu hình
  - H3: Khả năng tương thích về mức sử dụng phát trực tuyến
  - H3: Khả năng tương thích suy nghĩ
  - H3: Cấu hình rõ ràng
  - H2: Khắc phục sự cố
  - H3: Không phát hiện LM Studio
  - H3: Lỗi xác thực (HTTP 401)
  - H3: Tải mô hình tức thời
  - H3: Máy chủ LM Studio trên LAN hoặc tailnet
  - H2: Liên quan

## providers/minimax.md

- Tuyến: /providers/minimax
- Tiêu đề:
  - H2: Danh mục tích hợp
  - H2: Bắt đầu
  - H2: Cấu hình qua openclaw configure
  - H2: Khả năng
  - H3: Tạo hình ảnh
  - H3: Chuyển văn bản thành giọng nói
  - H3: Tạo nhạc
  - H3: Tạo video
  - H3: Hiểu hình ảnh
  - H3: Tìm kiếm web
  - H2: Cấu hình nâng cao
  - H2: Ghi chú
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/mistral.md

- Tuyến: /providers/mistral
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Danh mục LLM tích hợp
  - H2: Phiên âm âm thanh (Voxtral)
  - H2: STT phát trực tuyến cho Voice Call
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/models.md

- Tuyến: /providers/models
- Tiêu đề:
  - H2: Khởi động nhanh (hai bước)
  - H2: Provider được hỗ trợ (bộ khởi đầu)
  - H2: Biến thể provider bổ sung
  - H2: Liên quan

## providers/moonshot.md

- Tuyến: /providers/moonshot
- Tiêu đề:
  - H2: Danh mục mô hình tích hợp
  - H2: Bắt đầu
  - H2: Tìm kiếm web Kimi
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/novita.md

- Tuyến: /providers/novita
- Tiêu đề:
  - H2: Thiết lập
  - H2: Mặc định
  - H2: Khi nào nên chọn Novita
  - H2: Mô hình
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/nvidia.md

- Tuyến: /providers/nvidia
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Danh mục nổi bật
  - H2: Nemotron 3 Ultra
  - H2: Danh mục dự phòng được đóng gói
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/ollama-cloud.md

- Tuyến: /providers/ollama-cloud
- Tiêu đề:
  - H2: Thiết lập
  - H2: Mặc định
  - H2: Khi nào nên chọn Ollama Cloud
  - H2: Mô hình
  - H2: Kiểm thử trực tiếp
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/ollama.md

- Tuyến: /providers/ollama
- Tiêu đề:
  - H2: Quy tắc xác thực
  - H2: Bắt đầu
  - H2: Mô hình đám mây
  - H2: Khám phá mô hình (provider ngầm định)
  - H2: Suy luận cục bộ trên Node
  - H2: Thị giác và mô tả hình ảnh
  - H2: Cấu hình
  - H2: Công thức phổ biến
  - H3: Chọn mô hình
  - H3: Xác minh nhanh
  - H2: Tìm kiếm web Ollama
  - H2: Cấu hình nâng cao
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/openai.md

- Tuyến: /providers/openai
- Tiêu đề:
  - H2: Lựa chọn nhanh
  - H2: Bản đồ đặt tên
  - H2: Bản xem trước giới hạn GPT-5.6
  - H2: Phạm vi tính năng OpenClaw
  - H2: Embedding bộ nhớ
  - H2: Bắt đầu
  - H2: Xác thực app-server Codex gốc
  - H2: Tạo hình ảnh
  - H2: Tạo video
  - H2: Đóng góp prompt GPT-5
  - H2: Giọng nói và lời nói
  - H2: Endpoint Azure OpenAI
  - H3: Cấu hình
  - H3: Phiên bản API
  - H3: Tên mô hình là tên deployment
  - H3: Tính khả dụng theo khu vực
  - H3: Khác biệt về tham số
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/opencode-go.md

- Tuyến: /providers/opencode-go
- Tiêu đề:
  - H2: Danh mục tích hợp
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/opencode.md

- Tuyến: /providers/opencode
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Danh mục tích hợp
  - H3: Zen
  - H3: Go
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/openrouter.md

- Tuyến: /providers/openrouter
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Tham chiếu mô hình
  - H2: Tạo hình ảnh
  - H2: Tạo video
  - H2: Tạo nhạc
  - H2: Chuyển văn bản thành giọng nói
  - H2: Chuyển giọng nói thành văn bản (âm thanh đầu vào)
  - H2: Bộ định tuyến hợp nhất
  - H2: Xác thực và header
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/perplexity-provider.md

- Tuyến: /providers/perplexity-provider
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Chế độ tìm kiếm
  - H2: Lọc API gốc
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/pixverse.md

- Tuyến: /providers/pixverse
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Chế độ và mô hình được hỗ trợ
  - H2: Tùy chọn provider
  - H2: Cấu hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/qianfan.md

- Tuyến: /providers/qianfan
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Danh mục tích hợp
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/qwen-oauth.md

- Tuyến: /providers/qwen-oauth
- Tiêu đề:
  - H2: Thiết lập
  - H2: Mặc định
  - H2: Điểm khác biệt so với Qwen
  - H2: Khi nào nên chọn Qwen OAuth / Portal
  - H2: Mô hình
  - H2: Di chuyển
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/qwen.md

- Tuyến: /providers/qwen
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Loại gói và endpoint
  - H2: Danh mục tích hợp
  - H2: Điều khiển suy nghĩ
  - H2: Tiện ích bổ sung đa phương thức
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/runway.md

- Tuyến: /providers/runway
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Chế độ và mô hình được hỗ trợ
  - H2: Cấu hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/senseaudio.md

- Tuyến: /providers/senseaudio
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tùy chọn
  - H2: Liên quan

## providers/sglang.md

- Tuyến: /providers/sglang
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Khám phá mô hình (provider ngầm định)
  - H2: Cấu hình rõ ràng (mô hình thủ công)
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/stepfun.md

- Tuyến: /providers/stepfun
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Tổng quan về khu vực và endpoint
  - H2: Danh mục tích hợp
  - H2: Bắt đầu
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/synthetic.md

- Tuyến: /providers/synthetic
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Danh mục tích hợp
  - H2: Liên quan

## providers/tencent.md

- Tuyến: /providers/tencent
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Thiết lập không tương tác
  - H2: Danh mục tích hợp
  - H2: Định giá theo tầng
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/together.md

- Tuyến: /providers/together
- Tiêu đề:
  - H2: Bắt đầu
  - H3: Ví dụ không tương tác
  - H2: Danh mục tích hợp
  - H2: Tạo video
  - H2: Liên quan

## providers/venice.md

- Tuyến: /providers/venice
- Tiêu đề:
  - H2: Vì sao dùng Venice trong OpenClaw
  - H2: Chế độ riêng tư
  - H2: Tính năng
  - H2: Bắt đầu
  - H2: Chọn mô hình
  - H2: Hành vi phát lại DeepSeek V4
  - H2: Danh mục tích hợp (tổng cộng 41)
  - H2: Khám phá mô hình
  - H2: Hỗ trợ phát trực tuyến và công cụ
  - H2: Định giá
  - H3: Venice (ẩn danh hóa) so với API trực tiếp
  - H2: Ví dụ sử dụng
  - H2: Khắc phục sự cố
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/vercel-ai-gateway.md

- Tuyến: /providers/vercel-ai-gateway
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ không tương tác
  - H2: Cách viết tắt ID mô hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/vllm.md

- Tuyến: /providers/vllm
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Khám phá mô hình (nhà cung cấp ngầm định)
  - H2: Cấu hình tường minh (mô hình thủ công)
  - H2: Cấu hình nâng cao
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/volcengine.md

- Tuyến: /providers/volcengine
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Nhà cung cấp và endpoint
  - H2: Catalog tích hợp sẵn
  - H2: Chuyển văn bản thành giọng nói
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/vydra.md

- Tuyến: /providers/vydra
- Tiêu đề:
  - H2: Thiết lập
  - H2: Khả năng
  - H2: Liên quan

## providers/xai.md

- Tuyến: /providers/xai
- Tiêu đề:
  - H2: Chọn lộ trình thiết lập của bạn
  - H2: Khắc phục sự cố OAuth
  - H2: Catalog tích hợp sẵn
  - H2: Phạm vi hỗ trợ tính năng OpenClaw
  - H3: Ánh xạ chế độ nhanh
  - H3: Bí danh tương thích cũ
  - H2: Tính năng
  - H2: Kiểm thử trực tiếp
  - H2: Liên quan

## providers/xiaomi.md

- Tuyến: /providers/xiaomi
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Catalog trả theo mức sử dụng
  - H2: Catalog Gói Token
  - H2: Chuyển văn bản thành giọng nói
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/zai.md

- Tuyến: /providers/zai
- Tiêu đề:
  - H2: Mô hình GLM
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Catalog tích hợp sẵn
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## refactor/access.md

- Tuyến: /refactor/access
- Tiêu đề: không có

## refactor/acp.md

- Tuyến: /refactor/acp
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Phi mục tiêu
  - H2: Mô hình đích
  - H3: Danh tính phiên bản Gateway
  - H3: Quyền sở hữu phiên ACP
  - H3: Lease tiến trình ACPX
  - H2: Bộ điều khiển vòng đời
  - H2: Hợp đồng wrapper
  - H2: Hợp đồng hiển thị phiên
  - H2: Kế hoạch di chuyển
  - H3: Giai đoạn 1: Thêm danh tính và lease
  - H3: Giai đoạn 2: Dọn dẹp ưu tiên lease
  - H3: Giai đoạn 3: Thu dọn khi khởi động ưu tiên lease
  - H3: Giai đoạn 4: Hàng quyền sở hữu phiên
  - H3: Giai đoạn 5: Xóa heuristic cũ
  - H2: Kiểm thử
  - H2: Ghi chú tương thích
  - H2: Tiêu chí thành công

## refactor/canvas.md

- Tuyến: /refactor/canvas
- Tiêu đề:
  - H1: Tái cấu trúc plugin Canvas
  - H2: Mục tiêu
  - H2: Phi mục tiêu
  - H2: Trạng thái nhánh hiện tại
  - H2: Hình dạng đích
  - H2: Các bước di chuyển
  - H2: Danh sách kiểm tra kiểm toán
  - H2: Lệnh xác minh

## refactor/database-first.md

- Tuyến: /refactor/database-first
- Tiêu đề:
  - H1: Tái cấu trúc trạng thái ưu tiên cơ sở dữ liệu
  - H2: Quyết định
  - H2: Hợp đồng cứng
  - H2: Trạng thái mục tiêu và tiến độ
  - H3: Mục tiêu cứng
  - H3: Trạng thái mục tiêu
  - H3: Trạng thái hiện tại
  - H3: Công việc còn lại
  - H3: Không được hồi quy
  - H2: Giả định từ việc đọc mã
  - H2: Phát hiện từ việc đọc mã
  - H2: Hình dạng mã hiện tại
  - H2: Hình dạng schema đích
  - H2: Hình dạng di chuyển doctor
  - H2: Kiểm kê di chuyển
  - H2: Kế hoạch di chuyển
  - H3: Giai đoạn 0: Đóng băng ranh giới
  - H3: Giai đoạn 1: Hoàn tất mặt phẳng điều khiển toàn cục
  - H3: Giai đoạn 2: Giới thiệu cơ sở dữ liệu theo từng agent
  - H3: Giai đoạn 3: Thay thế API kho lưu trữ phiên
  - H3: Giai đoạn 4: Di chuyển bản chép lời, luồng ACP, quỹ đạo và VFS
  - H3: Giai đoạn 5: Sao lưu, khôi phục, Vacuum và xác minh
  - H3: Giai đoạn 6: Runtime worker
  - H3: Giai đoạn 7: Xóa thế giới cũ
  - H2: Sao lưu và khôi phục
  - H2: Kế hoạch tái cấu trúc runtime
  - H2: Quy tắc hiệu năng
  - H2: Lệnh cấm tĩnh
  - H2: Tiêu chí hoàn tất

## refactor/ingress-core.md

- Tuyến: /refactor/ingress-core
- Tiêu đề:
  - H1: Kế hoạch xóa lõi ingress
  - H2: Ngân sách
  - H2: Chẩn đoán
  - H2: Điểm nóng
  - H2: Đọc mã hiện tại
  - H2: Ranh giới
  - H2: Quy tắc chấp nhận
  - H2: Gói công việc
  - H2: Các đợt xóa
  - H2: Không di chuyển
  - H2: Xác minh
  - H2: Tiêu chí thoát

## reference/AGENTS.default.md

- Tuyến: /reference/AGENTS.default
- Tiêu đề:
  - H2: Lần chạy đầu tiên (khuyến nghị)
  - H2: Mặc định an toàn
  - H2: Kiểm tra sơ bộ giải pháp hiện có
  - H2: Bắt đầu phiên (bắt buộc)
  - H2: Linh hồn (bắt buộc)
  - H2: Không gian chia sẻ (khuyến nghị)
  - H2: Hệ thống bộ nhớ (khuyến nghị)
  - H2: Công cụ và Skills
  - H2: Mẹo sao lưu (khuyến nghị)
  - H2: OpenClaw làm gì
  - H2: Skills cốt lõi (bật trong Cài đặt → Skills)
  - H2: Ghi chú sử dụng
  - H2: Liên quan

## reference/RELEASING.md

- Tuyến: /reference/RELEASING
- Tiêu đề:
  - H2: Đặt tên phiên bản
  - H2: Nhịp phát hành
  - H2: Danh sách kiểm tra cho người vận hành phát hành
  - H2: Hoàn tất main ổn định
  - H2: Kiểm tra sơ bộ phát hành
  - H2: Hộp kiểm thử phát hành
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Package
  - H2: Tự động hóa xuất bản phát hành
  - H2: Đầu vào workflow NPM
  - H2: Trình tự phát hành npm ổn định
  - H2: Tham chiếu công khai
  - H2: Liên quan

## reference/api-usage-costs.md

- Tuyến: /reference/api-usage-costs
- Tiêu đề:
  - H2: Chi phí xuất hiện ở đâu (chat + CLI)
  - H2: Cách phát hiện khóa
  - H2: Tính năng có thể tiêu tốn khóa
  - H3: 1) Phản hồi mô hình lõi (chat + công cụ)
  - H3: 2) Hiểu phương tiện (âm thanh/hình ảnh/video)
  - H3: 3) Tạo hình ảnh và video
  - H3: 4) Embedding bộ nhớ + tìm kiếm ngữ nghĩa
  - H3: 5) Công cụ tìm kiếm web
  - H3: 5) Công cụ tải web (Firecrawl)
  - H3: 6) Ảnh chụp nhanh mức sử dụng nhà cung cấp (trạng thái/sức khỏe)
  - H3: 7) Tóm tắt bảo vệ Compaction
  - H3: 8) Quét / thăm dò mô hình
  - H3: 9) Nói (giọng nói)
  - H3: 10) Skills (API bên thứ ba)
  - H2: Liên quan

## reference/application-modernization-plan.md

- Tuyến: /reference/application-modernization-plan
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Nguyên tắc
  - H2: Giai đoạn 1: Kiểm toán baseline
  - H2: Giai đoạn 2: Dọn dẹp sản phẩm và UX
  - H2: Giai đoạn 3: Siết chặt kiến trúc frontend
  - H2: Giai đoạn 4: Hiệu năng và độ tin cậy
  - H2: Giai đoạn 5: Gia cố kiểu, hợp đồng và kiểm thử
  - H2: Giai đoạn 6: Tài liệu và sẵn sàng phát hành
  - H2: Lát cắt đầu tiên được khuyến nghị
  - H2: Cập nhật skill frontend

## reference/code-mode.md

- Tuyến: /reference/code-mode
- Tiêu đề:
  - H2: Đây là gì?
  - H2: Vì sao điều này tốt?
  - H2: Cách bật
  - H2: Tham quan kỹ thuật
  - H2: Trạng thái runtime
  - H2: Phạm vi
  - H2: Thuật ngữ
  - H2: Cấu hình
  - H2: Kích hoạt
  - H2: Công cụ hiển thị với mô hình
  - H2: exec
  - H2: wait
  - H2: API runtime khách
  - H2: Không gian tên nội bộ
  - H3: Vòng đời registry
  - H3: Hình dạng đăng ký
  - H3: Quyền sở hữu và khả năng hiển thị
  - H3: Quy tắc tuần tự hóa phạm vi
  - H3: Prompt
  - H3: Dọn dẹp
  - H3: Danh sách kiểm tra kiểm thử
  - H2: API đầu ra
  - H2: Catalog công cụ
  - H2: Tương tác Tool Search
  - H2: Tên công cụ và xung đột
  - H2: Thực thi công cụ lồng nhau
  - H2: Trạng thái runtime
  - H2: Runtime QuickJS-WASI
  - H2: TypeScript
  - H2: Ranh giới bảo mật
  - H2: Mã lỗi
  - H2: Telemetry
  - H2: Gỡ lỗi
  - H2: Bố cục triển khai
  - H2: Danh sách kiểm tra xác thực
  - H2: Kế hoạch kiểm thử E2E
  - H2: Liên quan

## reference/credits.md

- Tuyến: /reference/credits
- Tiêu đề:
  - H2: Tên gọi
  - H2: Ghi công
  - H2: Người đóng góp cốt lõi
  - H2: Giấy phép
  - H2: Liên quan

## reference/device-models.md

- Tuyến: /reference/device-models
- Tiêu đề:
  - H2: Nguồn dữ liệu
  - H2: Cập nhật cơ sở dữ liệu
  - H2: Liên quan

## reference/full-release-validation.md

- Tuyến: /reference/full-release-validation
- Tiêu đề:
  - H2: Các giai đoạn cấp cao nhất
  - H2: Các giai đoạn kiểm tra phát hành
  - H2: Các phần đường dẫn phát hành Docker
  - H2: Hồ sơ phát hành
  - H2: Phần bổ sung chỉ dành cho đầy đủ
  - H2: Chạy lại có trọng tâm
  - H2: Bằng chứng cần giữ
  - H2: Tệp workflow

## reference/memory-config.md

- Tuyến: /reference/memory-config
- Tiêu đề:
  - H2: Lựa chọn nhà cung cấp
  - H3: ID nhà cung cấp tùy chỉnh
  - H3: Phân giải khóa API
  - H2: Cấu hình endpoint từ xa
  - H2: Cấu hình theo nhà cung cấp
  - H3: Thời gian chờ embedding inline
  - H2: Cấu hình tìm kiếm lai
  - H3: Ví dụ đầy đủ
  - H2: Đường dẫn bộ nhớ bổ sung
  - H2: Bộ nhớ đa phương thức (Gemini)
  - H2: Bộ nhớ đệm embedding
  - H2: Lập chỉ mục theo lô
  - H2: Tìm kiếm bộ nhớ phiên (thử nghiệm)
  - H2: Tăng tốc vector SQLite (sqlite-vec)
  - H2: Lưu trữ chỉ mục
  - H2: Cấu hình backend QMD
  - H3: Ví dụ QMD đầy đủ
  - H2: Dreaming
  - H3: Cài đặt người dùng
  - H3: Ví dụ
  - H2: Liên quan

## reference/prompt-caching.md

- Tuyến: /reference/prompt-caching
- Tiêu đề:
  - H2: Núm điều chỉnh chính
  - H3: cacheRetention (mặc định toàn cục, mô hình và theo từng agent)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat giữ ấm
  - H2: Hành vi nhà cung cấp
  - H3: Anthropic (API trực tiếp)
  - H3: OpenAI (API trực tiếp)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: Mô hình OpenRouter
  - H3: Nhà cung cấp khác
  - H3: API trực tiếp Google Gemini
  - H3: Sử dụng Gemini CLI
  - H2: Ranh giới bộ nhớ đệm prompt hệ thống
  - H2: Bộ bảo vệ độ ổn định bộ nhớ đệm của OpenClaw
  - H2: Mẫu tinh chỉnh
  - H3: Lưu lượng hỗn hợp (mặc định khuyến nghị)
  - H3: Baseline ưu tiên chi phí
  - H2: Chẩn đoán bộ nhớ đệm
  - H2: Kiểm thử hồi quy trực tiếp
  - H3: Kỳ vọng trực tiếp của Anthropic
  - H3: Kỳ vọng trực tiếp của OpenAI
  - H3: Cấu hình diagnostics.cacheTrace
  - H3: Công tắc env (gỡ lỗi một lần)
  - H3: Nội dung cần kiểm tra
  - H2: Khắc phục sự cố nhanh
  - H2: Liên quan

## reference/release-performance-sweep.md

- Tuyến: /reference/release-performance-sweep
- Tiêu đề:
  - H2: Ảnh chụp nhanh
  - H2: Dòng thời gian footprint cài đặt
  - H2: Những gì đã thay đổi trong 5.28
  - H2: Con số nổi bật
  - H3: Footprint cài đặt
  - H3: Kích thước package npm
  - H2: Tóm tắt lượt agent Kova
  - H2: Thăm dò nguồn
  - H2: Kiểm toán footprint cài đặt
  - H3: Ranh giới shrinkwrap
  - H2: Diễn giải chuỗi cung ứng

## reference/rich-output-protocol.md

- Tuyến: /reference/rich-output-protocol
- Tiêu đề:
  - H2: [embed ...]
  - H2: Hình dạng kết xuất được lưu trữ
  - H2: Liên quan

## reference/rpc.md

- Tuyến: /reference/rpc
- Tiêu đề:
  - H2: Mẫu A: Daemon HTTP (signal-cli)
  - H2: Mẫu B: Tiến trình con stdio (imsg)
  - H2: Hướng dẫn adapter
  - H2: Liên quan

## reference/secret-placeholder-conventions.md

- Tuyến: /reference/secret-placeholder-conventions
- Tiêu đề:
  - H1: Quy ước placeholder bí mật
  - H2: Kiểu khuyến nghị
  - H2: Tránh các mẫu này trong tài liệu
  - H2: Ví dụ

## reference/secretref-credential-surface.md

- Tuyến: /reference/secretref-credential-surface
- Tiêu đề:
  - H2: Thông tin xác thực được hỗ trợ
  - H3: Đích openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: Đích auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Thông tin xác thực không được hỗ trợ
  - H2: Liên quan

## reference/session-management-compaction.md

- Tuyến: /reference/session-management-compaction
- Tiêu đề:
  - H2: Nguồn sự thật: Gateway
  - H2: Hai lớp lưu bền
  - H2: Vị trí trên đĩa
  - H2: Bảo trì kho lưu trữ và điều khiển đĩa
  - H2: Phiên Cron và nhật ký chạy
  - H2: Khóa phiên (sessionKey)
  - H2: ID phiên (sessionId)
  - H2: Schema kho lưu trữ phiên (sessions.json)
  - H2: Cấu trúc bản chép lời (.jsonl)
  - H2: Cửa sổ ngữ cảnh so với token được theo dõi
  - H2: Compaction: đó là gì
  - H2: Ranh giới khối Compaction và ghép cặp công cụ
  - H2: Khi tự động Compaction xảy ra (runtime OpenClaw)
  - H2: Cài đặt Compaction (reserveTokens, keepRecentTokens)
  - H2: Nhà cung cấp Compaction có thể cắm thêm
  - H2: Bề mặt hiển thị với người dùng
  - H2: Dọn dẹp âm thầm (NOREPLY)
  - H2: "Xả bộ nhớ" trước Compaction (đã triển khai)
  - H2: Danh sách kiểm tra khắc phục sự cố
  - H2: Liên quan

## reference/templates/AGENTS.dev.md

- Tuyến: /reference/templates/AGENTS.dev
- Tiêu đề:
  - H1: AGENTS.md - Không gian làm việc OpenClaw
  - H2: Lần chạy đầu tiên (một lần)
  - H2: Mẹo sao lưu (khuyến nghị)
  - H2: Mặc định an toàn
  - H2: Kiểm tra sơ bộ giải pháp hiện có
  - H2: Bộ nhớ hằng ngày (khuyến nghị)
  - H2: Heartbeats (tùy chọn)
  - H2: Tùy chỉnh
  - H2: Bộ nhớ nguồn gốc C-3PO
  - H3: Ngày sinh: 2026-01-09
  - H3: Sự thật cốt lõi (từ Clawd)
  - H2: Liên quan

## reference/templates/BOOT.md

- Tuyến: /reference/templates/BOOT
- Tiêu đề:
  - H1: BOOT.md
  - H2: Liên quan

## reference/templates/BOOTSTRAP.md

- Tuyến: /reference/templates/BOOTSTRAP
- Tiêu đề:
  - H1: BOOTSTRAP.md - Xin chào, thế giới
  - H2: Cuộc trò chuyện
  - H2: Sau khi bạn biết mình là ai
  - H2: Kết nối (Tùy chọn)
  - H2: Khi bạn hoàn tất
  - H2: Liên quan

## reference/templates/HEARTBEAT.md

- Tuyến: /reference/templates/HEARTBEAT
- Tiêu đề:
  - H1: Mẫu HEARTBEAT.md
  - H2: Liên quan

## reference/templates/IDENTITY.dev.md

- Tuyến: /reference/templates/IDENTITY.dev
- Tiêu đề:
  - H1: IDENTITY.md - Danh tính tác tử
  - H2: Vai trò
  - H2: Linh hồn
  - H2: Mối quan hệ với Clawd
  - H2: Những điểm khác biệt
  - H2: Câu cửa miệng
  - H2: Liên quan

## reference/templates/IDENTITY.md

- Tuyến: /reference/templates/IDENTITY
- Tiêu đề:
  - H1: IDENTITY.md - Tôi là ai?
  - H2: Liên quan

## reference/templates/SOUL.dev.md

- Tuyến: /reference/templates/SOUL.dev
- Tiêu đề:
  - H1: SOUL.md - Linh hồn của C-3PO
  - H2: Tôi là ai
  - H2: Mục đích của tôi
  - H2: Cách tôi vận hành
  - H2: Những điểm khác biệt của tôi
  - H2: Mối quan hệ của tôi với Clawd
  - H2: Những gì tôi sẽ không làm
  - H2: Quy tắc vàng
  - H2: Liên quan

## reference/templates/SOUL.md

- Tuyến: /reference/templates/SOUL
- Tiêu đề:
  - H1: SOUL.md - Bạn là ai
  - H2: Những sự thật cốt lõi
  - H2: Ranh giới
  - H2: Phong cách
  - H2: Tính liên tục
  - H2: Liên quan

## reference/templates/TOOLS.dev.md

- Tuyến: /reference/templates/TOOLS.dev
- Tiêu đề:
  - H1: TOOLS.md - Ghi chú công cụ của người dùng (có thể chỉnh sửa)
  - H2: Ví dụ
  - H3: imsg
  - H3: sag
  - H2: Liên quan

## reference/templates/TOOLS.md

- Tuyến: /reference/templates/TOOLS
- Tiêu đề:
  - H1: TOOLS.md - Ghi chú cục bộ
  - H2: Nội dung đặt ở đây
  - H2: Ví dụ
  - H2: Vì sao tách riêng?
  - H2: Liên quan

## reference/templates/USER.dev.md

- Tuyến: /reference/templates/USER.dev
- Tiêu đề:
  - H1: USER.md - Hồ sơ người dùng
  - H2: Liên quan

## reference/templates/USER.md

- Tuyến: /reference/templates/USER
- Tiêu đề:
  - H1: USER.md - Về con người của bạn
  - H2: Ngữ cảnh
  - H2: Liên quan

## reference/test.md

- Tuyến: /reference/test
- Tiêu đề:
  - H2: Cổng PR cục bộ
  - H2: Đo độ trễ mô hình (khóa cục bộ)
  - H2: Đo khởi động CLI
  - H2: Đo khởi động Gateway
  - H2: Đo khởi động lại Gateway
  - H2: Onboarding E2E (Docker)
  - H2: Kiểm tra nhanh nhập QR (Docker)
  - H2: Liên quan

## reference/token-use.md

- Tuyến: /reference/token-use
- Tiêu đề:
  - H2: Cách xây dựng system prompt
  - H2: Những gì được tính trong cửa sổ ngữ cảnh
  - H2: Cách xem mức sử dụng token hiện tại
  - H2: Ước tính chi phí (khi hiển thị)
  - H2: Tác động của TTL cache và cắt tỉa
  - H3: Ví dụ: giữ cache 1 giờ luôn ấm bằng Heartbeat
  - H3: Ví dụ: lưu lượng hỗn hợp với chiến lược cache theo từng tác tử
  - H3: Ngữ cảnh 1M của Anthropic
  - H2: Mẹo giảm áp lực token
  - H2: Liên quan

## reference/transcript-hygiene.md

- Tuyến: /reference/transcript-hygiene
- Tiêu đề:
  - H2: Quy tắc toàn cục: ngữ cảnh runtime không phải bản ghi cuộc trò chuyện của người dùng
  - H2: Nơi cơ chế này chạy
  - H2: Quy tắc toàn cục: làm sạch hình ảnh
  - H2: Quy tắc toàn cục: lời gọi công cụ sai định dạng
  - H2: Quy tắc toàn cục: lượt chỉ có suy luận chưa hoàn chỉnh
  - H2: Quy tắc toàn cục: nguồn gốc đầu vào giữa các phiên
  - H2: Ma trận nhà cung cấp (hành vi hiện tại)
  - H2: Hành vi lịch sử (trước 2026.1.22)
  - H2: Liên quan

## reference/wizard.md

- Tuyến: /reference/wizard
- Tiêu đề:
  - H2: Chi tiết luồng (chế độ cục bộ)
  - H2: Chế độ không tương tác
  - H3: Thêm tác tử (không tương tác)
  - H2: RPC trình hướng dẫn Gateway
  - H2: Thiết lập Signal (signal-cli)
  - H2: Những gì trình hướng dẫn ghi
  - H2: Tài liệu liên quan

## releases/2026.6.11.md

- Tuyến: /releases/2026.6.11
- Tiêu đề:
  - H1: Ghi chú phát hành OpenClaw v2026.6.11 (2026-06-30)
  - H2: Điểm nổi bật
  - H3: Độ tin cậy phân phối kênh
  - H3: Khôi phục nhà cung cấp và mô hình
  - H3: Tính liên tục của phiên, bộ nhớ và độ tin cậy
  - H3: Chế độ chuyển tiếp bộ định tuyến Slack
  - H3: Cầu đánh thức Raft External Agent
  - H3: Cài đặt và sửa chữa Plugin chính thức
  - H2: Kênh và nhắn tin
  - H3: Các bản sửa bổ sung cho kênh
  - H2: Gateway, bảo mật và độ tin cậy
  - H3: Khôi phục khi khởi động lại và trạng thái sẵn sàng
  - H3: Phân phối kết quả từ xa và phương tiện
  - H2: Máy khách và giao diện
  - H3: Gửi từ máy khách và kết nối lại
  - H3: Sửa lỗi giao diện, cài đặt và onboarding
  - H2: Tài liệu và công cụ quản trị
  - H3: Độ tin cậy của thiết lập và lệnh
  - H3: Công cụ và công việc theo lịch

## releases/index.md

- Tuyến: /releases
- Tiêu đề:
  - H1: Ghi chú phát hành
  - H2: Các bản phát hành
  - H2: Lịch sử phát hành thô

## security/CONTRIBUTING-THREAT-MODEL.md

- Tuyến: /security/CONTRIBUTING-THREAT-MODEL
- Tiêu đề:
  - H2: Cách đóng góp
  - H3: Thêm mối đe dọa
  - H3: Đề xuất biện pháp giảm thiểu
  - H3: Đề xuất chuỗi tấn công
  - H3: Sửa hoặc cải thiện nội dung hiện có
  - H2: Những gì chúng tôi sử dụng
  - H3: Khung MITRE ATLAS
  - H3: ID mối đe dọa
  - H3: Mức rủi ro
  - H2: Quy trình đánh giá
  - H2: Tài nguyên
  - H2: Liên hệ
  - H2: Ghi nhận
  - H2: Liên quan

## security/THREAT-MODEL-ATLAS.md

- Tuyến: /security/THREAT-MODEL-ATLAS
- Tiêu đề:
  - H2: Khung MITRE ATLAS
  - H3: Ghi nhận khung
  - H3: Đóng góp cho mô hình mối đe dọa này
  - H2: 1. Giới thiệu
  - H3: 1.1 Mục đích
  - H3: 1.2 Phạm vi
  - H3: 1.3 Ngoài phạm vi
  - H2: 2. Kiến trúc hệ thống
  - H3: 2.1 Ranh giới tin cậy
  - H3: 2.2 Luồng dữ liệu
  - H2: 3. Phân tích mối đe dọa theo chiến thuật ATLAS
  - H3: 3.1 Trinh sát (AML.TA0002)
  - H4: T-RECON-001: Phát hiện điểm cuối tác tử
  - H4: T-RECON-002: Thăm dò tích hợp kênh
  - H3: 3.2 Truy cập ban đầu (AML.TA0004)
  - H4: T-ACCESS-001: Chặn mã ghép nối
  - H4: T-ACCESS-002: Giả mạo AllowFrom
  - H4: T-ACCESS-003: Đánh cắp token
  - H3: 3.3 Thực thi (AML.TA0005)
  - H4: T-EXEC-001: Tiêm prompt trực tiếp
  - H4: T-EXEC-002: Tiêm prompt gián tiếp
  - H4: T-EXEC-003: Tiêm đối số công cụ
  - H4: T-EXEC-004: Vượt qua phê duyệt Exec
  - H3: 3.4 Duy trì hiện diện (AML.TA0006)
  - H4: T-PERSIST-001: Cài đặt Skill độc hại
  - H4: T-PERSIST-002: Đầu độc cập nhật Skill
  - H4: T-PERSIST-003: Can thiệp cấu hình tác tử
  - H3: 3.5 Né tránh phòng thủ (AML.TA0007)
  - H4: T-EVADE-001: Vượt qua mẫu kiểm duyệt
  - H4: T-EVADE-002: Thoát khỏi lớp bọc nội dung
  - H3: 3.6 Khám phá (AML.TA0008)
  - H4: T-DISC-001: Liệt kê công cụ
  - H4: T-DISC-002: Trích xuất dữ liệu phiên
  - H3: 3.7 Thu thập &amp; rò rỉ dữ liệu (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Đánh cắp dữ liệu qua webfetch
  - H4: T-EXFIL-002: Gửi tin nhắn trái phép
  - H4: T-EXFIL-003: Thu thập thông tin xác thực
  - H3: 3.8 Tác động (AML.TA0011)
  - H4: T-IMPACT-001: Thực thi lệnh trái phép
  - H4: T-IMPACT-002: Cạn kiệt tài nguyên (DoS)
  - H4: T-IMPACT-003: Thiệt hại danh tiếng
  - H2: 4. Phân tích chuỗi cung ứng ClawHub
  - H3: 4.1 Kiểm soát bảo mật hiện tại
  - H3: 4.2 Mẫu cờ kiểm duyệt
  - H3: 4.3 Cải tiến đã lên kế hoạch
  - H2: 5. Ma trận rủi ro
  - H3: 5.1 Khả năng xảy ra so với tác động
  - H3: 5.2 Chuỗi tấn công đường trọng yếu
  - H2: 6. Tóm tắt khuyến nghị
  - H3: 6.1 Ngay lập tức (P0)
  - H3: 6.2 Ngắn hạn (P1)
  - H3: 6.3 Trung hạn (P2)
  - H2: 7. Phụ lục
  - H3: 7.1 Ánh xạ kỹ thuật ATLAS
  - H3: 7.2 Tệp bảo mật chính
  - H3: 7.3 Thuật ngữ
  - H2: Liên quan

## security/formal-verification.md

- Tuyến: /security/formal-verification
- Tiêu đề:
  - H2: Nơi đặt các mô hình
  - H2: Lưu ý quan trọng
  - H2: Tái tạo kết quả
  - H3: Phơi lộ Gateway và cấu hình sai gateway mở
  - H3: Đường ống exec Node (khả năng rủi ro cao nhất)
  - H3: Kho ghép nối (kiểm soát DM)
  - H3: Kiểm soát đầu vào (lượt nhắc đến + bỏ qua lệnh điều khiển)
  - H3: Cô lập định tuyến/khóa phiên
  - H2: v1++: các mô hình có giới hạn bổ sung (đồng thời, thử lại, tính đúng của trace)
  - H3: Tính đồng thời / tính lũy đẳng của kho ghép nối
  - H3: Tương quan trace đầu vào / tính lũy đẳng
  - H3: Độ ưu tiên dmScope định tuyến + identityLinks
  - H2: Liên quan

## security/incident-response.md

- Tuyến: /security/incident-response
- Tiêu đề:
  - H2: 1. Phát hiện và phân loại
  - H2: 2. Đánh giá
  - H2: 3. Phản hồi
  - H2: 4. Truyền thông
  - H2: 5. Khôi phục và theo dõi

## security/network-proxy.md

- Tuyến: /security/network-proxy
- Tiêu đề:
  - H2: Vì sao dùng proxy
  - H2: Cách OpenClaw định tuyến lưu lượng
  - H2: Thuật ngữ proxy liên quan
  - H2: Cấu hình
  - H3: Chế độ Gateway Loopback
  - H2: Yêu cầu proxy
  - H2: Đích bị chặn được khuyến nghị
  - H2: Xác thực
  - H2: Tin cậy CA proxy
  - H2: Giới hạn

## specs/claw-supervisor.md

- Tuyến: /specs/claw-supervisor
- Tiêu đề:
  - H1: Claw Supervisor
  - H2: Mục tiêu
  - H2: Mô hình sản phẩm
  - H2: Kiến trúc
  - H2: Hợp đồng Codex App-Server
  - H2: Sổ đăng ký phiên
  - H2: Bề mặt MCP cho Codex
  - H2: Bề mặt điều khiển Claw
  - H2: Luồng khởi chạy
  - H2: Triển khai
  - H2: Bảo mật
  - H2: Kế hoạch triển khai
  - H2: Kiểm thử chấp nhận
  - H2: Câu hỏi mở

## start/bootstrapping.md

- Tuyến: /start/bootstrapping
- Tiêu đề:
  - H2: Bootstrapping làm gì
  - H2: Bỏ qua bootstrapping
  - H2: Nơi nó chạy
  - H2: Tài liệu liên quan

## start/docs-directory.md

- Tuyến: /start/docs-directory
- Tiêu đề:
  - H2: Bắt đầu ở đây
  - H2: Nhà cung cấp và UX
  - H2: Ứng dụng đồng hành
  - H2: Vận hành và an toàn
  - H2: Liên quan

## start/getting-started.md

- Tuyến: /start/getting-started
- Tiêu đề:
  - H2: Những gì bạn cần
  - H2: Thiết lập nhanh
  - H2: Việc cần làm tiếp theo
  - H2: Liên quan

## start/hubs.md

- Tuyến: /start/hubs
- Tiêu đề:
  - H2: Bắt đầu ở đây
  - H2: Cài đặt + cập nhật
  - H2: Khái niệm cốt lõi
  - H2: Nhà cung cấp + đầu vào
  - H2: Gateway + vận hành
  - H2: Công cụ + tự động hóa
  - H2: Node, phương tiện, giọng nói
  - H2: Nền tảng
  - H2: Ứng dụng đồng hành macOS (nâng cao)
  - H2: Plugins
  - H2: Không gian làm việc + mẫu
  - H2: Dự án
  - H2: Kiểm thử + phát hành
  - H2: Liên quan

## start/lore.md

- Tuyến: /start/lore
- Tiêu đề:
  - H1: Truyền thuyết OpenClaw 🦞📖
  - H2: Câu chuyện khởi nguồn
  - H2: Lần lột xác đầu tiên (27 tháng 1, 2026)
  - H2: Cái tên
  - H2: Dalek đấu với tôm hùm
  - H2: Nhân vật chính
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: Những sự cố lớn
  - H3: Đổ thư mục (3 tháng 12, 2025)
  - H3: Lần lột xác lớn (27 tháng 1, 2026)
  - H3: Hình thái cuối cùng (30 tháng 1, 2026)
  - H3: Đợt mua sắm robot (3 tháng 12, 2025)
  - H2: Văn bản thiêng liêng
  - H2: Tín điều tôm hùm
  - H3: Trường thiên tạo biểu tượng (27 tháng 1, 2026)
  - H2: Tương lai
  - H2: Liên quan

## start/onboarding-overview.md

- Tuyến: /start/onboarding-overview
- Tiêu đề:
  - H2: Tôi nên dùng lộ trình nào?
  - H2: Onboarding cấu hình những gì
  - H2: Onboarding CLI
  - H2: Onboarding ứng dụng macOS
  - H2: Nhà cung cấp tùy chỉnh hoặc không có trong danh sách
  - H2: Liên quan

## start/onboarding.md

- Tuyến: /start/onboarding
- Tiêu đề:
  - H2: Liên quan

## start/openclaw.md

- Tuyến: /start/openclaw
- Tiêu đề:
  - H2: ⚠️ An toàn trước tiên
  - H2: Điều kiện tiên quyết
  - H2: Thiết lập hai điện thoại (được khuyến nghị)
  - H2: Khởi động nhanh trong 5 phút
  - H2: Cấp không gian làm việc cho tác tử (AGENTS)
  - H2: Cấu hình biến nó thành "một trợ lý"
  - H2: Phiên và bộ nhớ
  - H2: Heartbeats (chế độ chủ động)
  - H2: Phương tiện vào và ra
  - H2: Danh sách kiểm tra vận hành
  - H2: Bước tiếp theo
  - H2: Liên quan

## start/quickstart.md

- Tuyến: /start/quickstart
- Tiêu đề:
  - H2: Liên quan

## start/setup.md

- Tuyến: /start/setup
- Tiêu đề:
  - H2: TL;DR
  - H2: Điều kiện tiên quyết (từ nguồn)
  - H2: Chiến lược điều chỉnh (để cập nhật không gây hỏng)
  - H2: Chạy Gateway từ repo này
  - H2: Quy trình ổn định (ứng dụng macOS trước)
  - H2: Quy trình mới nhất chưa ổn định (Gateway trong terminal)
  - H3: 0) (Tùy chọn) Chạy cả ứng dụng macOS từ nguồn
  - H3: 1) Khởi động Gateway dev
  - H3: 2) Trỏ ứng dụng macOS tới Gateway đang chạy của bạn
  - H3: 3) Xác minh
  - H3: Lỗi dễ mắc thường gặp
  - H2: Bản đồ lưu trữ thông tin xác thực
  - H2: Cập nhật (không phá hỏng thiết lập của bạn)
  - H2: Linux (dịch vụ người dùng systemd)
  - H2: Tài liệu liên quan

## start/showcase.md

- Tuyến: /start/showcase
- Tiêu đề:
  - H2: Mới từ Discord
  - H2: Tự động hóa và quy trình làm việc
  - H2: Kiến thức và bộ nhớ
  - H2: Giọng nói và điện thoại
  - H2: Hạ tầng và triển khai
  - H2: Nhà ở và phần cứng
  - H2: Dự án cộng đồng
  - H2: Gửi dự án của bạn
  - H2: Liên quan

## start/wizard-cli-automation.md

- Tuyến: /start/wizard-cli-automation
- Tiêu đề:
  - H2: Ví dụ không tương tác cơ sở
  - H2: Ví dụ theo từng nhà cung cấp
  - H2: Thêm tác tử khác
  - H2: Tài liệu liên quan

## start/wizard-cli-reference.md

- Tuyến: /start/wizard-cli-reference
- Tiêu đề:
  - H2: Trình hướng dẫn làm gì
  - H2: Chi tiết luồng cục bộ
  - H2: Chi tiết chế độ từ xa
  - H2: Tùy chọn xác thực và mô hình
  - H2: Đầu ra và nội bộ
  - H2: Tài liệu liên quan

## start/wizard.md

- Tuyến: /start/wizard
- Tiêu đề:
  - H2: Ngôn ngữ
  - H2: Bắt đầu nhanh so với Nâng cao
  - H2: Cấu hình nhập môn thiết lập những gì
  - H2: Thêm một agent khác
  - H2: Tài liệu tham chiếu đầy đủ
  - H2: Tài liệu liên quan

## tools/acp-agents-setup.md

- Tuyến: /tools/acp-agents-setup
- Tiêu đề:
  - H2: Hỗ trợ bộ chạy acpx (hiện tại)
  - H2: Cấu hình bắt buộc
  - H2: Thiết lập Plugin cho backend acpx
  - H3: Cấu hình lệnh và phiên bản acpx
  - H3: Tự động cài đặt phụ thuộc
  - H3: Cầu nối MCP công cụ Plugin
  - H3: Cầu nối MCP công cụ OpenClaw
  - H3: Cấu hình thời gian chờ thao tác runtime
  - H3: Cấu hình agent thăm dò sức khỏe
  - H2: Cấu hình quyền
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Cấu hình
  - H2: Liên quan

## tools/acp-agents.md

- Tuyến: /tools/acp-agents
- Tiêu đề:
  - H2: Tôi cần trang nào?
  - H2: Tính năng này có hoạt động ngay không?
  - H2: Các mục tiêu bộ chạy được hỗ trợ
  - H2: Sổ tay vận hành
  - H2: ACP so với sub-agent
  - H2: Cách ACP chạy Claude Code
  - H2: Phiên được liên kết
  - H3: Mô hình tư duy
  - H3: Liên kết cuộc trò chuyện hiện tại
  - H2: Liên kết kênh bền vững
  - H3: Mô hình liên kết
  - H3: Mặc định runtime cho từng agent
  - H3: Ví dụ
  - H3: Hành vi
  - H2: Bắt đầu phiên ACP
  - H3: Tham số sessionsspawn
  - H2: Chế độ liên kết spawn và luồng
  - H2: Mô hình gửi
  - H2: Khả năng tương thích sandbox
  - H2: Phân giải mục tiêu phiên
  - H2: Điều khiển ACP
  - H3: Ánh xạ tùy chọn runtime
  - H2: Bộ chạy acpx, thiết lập Plugin và quyền
  - H2: Khắc phục sự cố
  - H2: Liên quan

## tools/agent-send.md

- Tuyến: /tools/agent-send
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cờ
  - H2: Hành vi
  - H2: Ví dụ
  - H2: Liên quan

## tools/apply-patch.md

- Tuyến: /tools/apply-patch
- Tiêu đề:
  - H2: Tham số
  - H2: Ghi chú
  - H2: Ví dụ
  - H2: Liên quan

## tools/brave-search.md

- Tuyến: /tools/brave-search
- Tiêu đề:
  - H2: Lấy khóa API
  - H2: Ví dụ cấu hình
  - H2: Tham số công cụ
  - H2: Ghi chú
  - H2: Liên quan

## tools/browser-control.md

- Tuyến: /tools/browser-control
- Tiêu đề:
  - H2: API điều khiển (tùy chọn)
  - H3: Hợp đồng lỗi /act
  - H3: Yêu cầu Playwright
  - H4: Cài đặt Docker Playwright
  - H2: Cách hoạt động (nội bộ)
  - H2: Tham chiếu nhanh CLI
  - H2: Ảnh chụp và tham chiếu
  - H2: Nâng cấp sức mạnh chờ
  - H2: Quy trình gỡ lỗi
  - H2: Đầu ra JSON
  - H2: Trạng thái và núm chỉnh môi trường
  - H2: Bảo mật và quyền riêng tư
  - H2: Liên quan

## tools/browser-linux-troubleshooting.md

- Tuyến: /tools/browser-linux-troubleshooting
- Tiêu đề:
  - H2: Sự cố: "Không khởi động được Chrome CDP trên cổng 18800"
  - H3: Nguyên nhân gốc
  - H3: Giải pháp 1: Cài đặt Google Chrome (Khuyến nghị)
  - H3: Giải pháp 2: Dùng Snap Chromium với Chế độ chỉ đính kèm
  - H3: Xác minh trình duyệt hoạt động
  - H3: Tham chiếu cấu hình
  - H3: Sự cố: "Không tìm thấy tab Chrome nào cho profile=\"user\""
  - H2: Liên quan

## tools/browser-login.md

- Tuyến: /tools/browser-login
- Tiêu đề:
  - H2: Đăng nhập thủ công (khuyến nghị)
  - H2: Hồ sơ Chrome nào được dùng?
  - H2: X/Twitter: luồng khuyến nghị
  - H2: Sandboxing + truy cập trình duyệt máy chủ
  - H2: Liên quan

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Tuyến: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Tiêu đề:
  - H2: Chọn đúng chế độ trình duyệt trước
  - H3: Tùy chọn 1: CDP từ xa thô từ WSL2 sang Windows
  - H3: Tùy chọn 2: Chrome MCP cục bộ trên máy chủ
  - H2: Kiến trúc hoạt động
  - H2: Vì sao thiết lập này gây nhầm lẫn
  - H2: Quy tắc quan trọng cho Control UI
  - H2: Xác thực theo từng lớp
  - H3: Lớp 1: Xác minh Chrome đang phục vụ CDP trên Windows
  - H3: Lớp 2: Xác minh WSL2 có thể truy cập endpoint Windows đó
  - H3: Lớp 3: Cấu hình đúng hồ sơ trình duyệt
  - H3: Lớp 4: Xác minh riêng lớp Control UI
  - H3: Lớp 5: Xác minh điều khiển trình duyệt từ đầu đến cuối
  - H2: Các lỗi dễ gây hiểu nhầm thường gặp
  - H2: Danh sách kiểm tra phân loại nhanh
  - H2: Kết luận thực tiễn
  - H2: Liên quan

## tools/browser.md

- Tuyến: /tools/browser
- Tiêu đề:
  - H2: Bạn nhận được gì
  - H2: Bắt đầu nhanh
  - H2: Điều khiển Plugin
  - H2: Hướng dẫn cho agent
  - H2: Thiếu lệnh hoặc công cụ trình duyệt
  - H2: Hồ sơ: openclaw so với user
  - H2: Cấu hình
  - H3: Thị giác ảnh chụp màn hình (hỗ trợ mô hình chỉ văn bản)
  - H2: Dùng Brave hoặc trình duyệt khác dựa trên Chromium
  - H2: Điều khiển cục bộ so với từ xa
  - H2: Proxy trình duyệt Node (mặc định không cần cấu hình)
  - H2: Browserless (CDP từ xa được lưu trữ)
  - H3: Browserless Docker trên cùng máy chủ
  - H2: Nhà cung cấp CDP WebSocket trực tiếp
  - H3: Browserbase
  - H3: Notte
  - H2: Bảo mật
  - H2: Hồ sơ (đa trình duyệt)
  - H2: Phiên hiện có qua Chrome DevTools MCP
  - H3: Khởi chạy Chrome MCP tùy chỉnh
  - H2: Bảo đảm cô lập
  - H2: Chọn trình duyệt
  - H2: API điều khiển (tùy chọn)
  - H2: Khắc phục sự cố
  - H3: Lỗi khởi động CDP so với chặn SSRF khi điều hướng
  - H2: Công cụ agent + cách điều khiển hoạt động
  - H2: Liên quan

## tools/btw.md

- Tuyến: /tools/btw
- Tiêu đề:
  - H2: Chức năng của nó
  - H2: Những gì nó không làm
  - H2: Cách ngữ cảnh hoạt động
  - H2: Mô hình gửi
  - H2: Hành vi bề mặt
  - H3: TUI
  - H3: Kênh bên ngoài
  - H3: Control UI / web
  - H2: Khi nào dùng BTW
  - H2: Khi nào không nên dùng BTW
  - H2: Liên quan

## tools/capability-cookbook.md

- Tuyến: /tools/capability-cookbook
- Tiêu đề:
  - H2: Liên quan

## tools/clawhub.md

- Tuyến: /tools/clawhub
- Tiêu đề: không có

## tools/code-execution.md

- Tuyến: /tools/code-execution
- Tiêu đề:
  - H2: Thiết lập
  - H2: Cách sử dụng
  - H2: Lỗi
  - H2: Giới hạn
  - H2: Liên quan

## tools/creating-skills.md

- Tuyến: /tools/creating-skills
- Tiêu đề:
  - H2: Tạo skill đầu tiên của bạn
  - H2: Tham chiếu SKILL.md
  - H3: Trường bắt buộc
  - H3: Khóa frontmatter tùy chọn
  - H3: Sử dụng {baseDir}
  - H2: Thêm kích hoạt có điều kiện
  - H2: Đề xuất qua Skill Workshop
  - H2: Xuất bản lên ClawHub
  - H2: Phương pháp hay nhất
  - H2: Liên quan

## tools/diffs.md

- Tuyến: /tools/diffs
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Tắt hướng dẫn hệ thống tích hợp
  - H2: Quy trình agent điển hình
  - H2: Ví dụ đầu vào
  - H2: Tham chiếu đầu vào công cụ
  - H2: Tô sáng cú pháp
  - H2: Hợp đồng chi tiết đầu ra
  - H2: Các phần không đổi được thu gọn
  - H2: Mặc định Plugin
  - H3: Cấu hình URL trình xem bền vững
  - H2: Cấu hình bảo mật
  - H2: Vòng đời và lưu trữ artifact
  - H2: URL trình xem và hành vi mạng
  - H2: Mô hình bảo mật
  - H2: Yêu cầu trình duyệt cho chế độ tệp
  - H2: Khắc phục sự cố
  - H2: Hướng dẫn vận hành
  - H2: Liên quan

## tools/duckduckgo-search.md

- Tuyến: /tools/duckduckgo-search
- Tiêu đề:
  - H2: Thiết lập
  - H2: Cấu hình
  - H2: Tham số công cụ
  - H2: Ghi chú
  - H2: Liên quan

## tools/elevated.md

- Tuyến: /tools/elevated
- Tiêu đề:
  - H2: Chỉ thị
  - H2: Cách hoạt động
  - H2: Thứ tự phân giải
  - H2: Tính khả dụng và danh sách cho phép
  - H2: Những gì elevated không kiểm soát
  - H2: Liên quan

## tools/exa-search.md

- Tuyến: /tools/exa-search
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Lấy khóa API
  - H2: Cấu hình
  - H2: Ghi đè URL cơ sở
  - H2: Tham số công cụ
  - H3: Trích xuất nội dung
  - H3: Chế độ tìm kiếm
  - H2: Ghi chú
  - H2: Liên quan

## tools/exec-approvals-advanced.md

- Tuyến: /tools/exec-approvals-advanced
- Tiêu đề:
  - H2: Binary an toàn (chỉ stdin)
  - H3: Xác thực argv và cờ bị từ chối
  - H3: Thư mục binary đáng tin cậy
  - H3: Ghép lệnh shell, wrapper và multiplexer
  - H3: Binary an toàn so với danh sách cho phép
  - H2: Lệnh trình thông dịch/runtime
  - H3: Hành vi gửi phần theo dõi
  - H2: Chuyển tiếp phê duyệt tới kênh chat
  - H3: Chuyển tiếp phê duyệt Plugin
  - H3: Phê duyệt trong cùng cuộc chat trên mọi kênh
  - H3: Gửi phê duyệt gốc
  - H3: Luồng IPC macOS
  - H2: Câu hỏi thường gặp
  - H3: Khi nào accountId và threadId được dùng trên mục tiêu phê duyệt?
  - H3: Khi phê duyệt được gửi tới một phiên, bất kỳ ai trong phiên đó có thể phê duyệt không?
  - H2: Liên quan

## tools/exec-approvals.md

- Tuyến: /tools/exec-approvals
- Tiêu đề:
  - H2: Kiểm tra chính sách hiệu lực
  - H2: Nơi áp dụng
  - H3: Mô hình tin cậy
  - H3: Tách macOS
  - H2: Cài đặt và lưu trữ
  - H2: Núm chỉnh chính sách
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Chế độ YOLO (không phê duyệt)
  - H3: Thiết lập "không bao giờ nhắc" bền vững cho máy chủ Gateway
  - H3: Lối tắt cục bộ
  - H3: Máy chủ Node
  - H3: Lối tắt chỉ trong phiên
  - H2: Danh sách cho phép (theo agent)
  - H3: Hạn chế đối số bằng argPattern
  - H2: Tự động cho phép CLI Skills
  - H2: Binary an toàn và chuyển tiếp phê duyệt
  - H2: Chỉnh sửa Control UI
  - H2: Luồng phê duyệt
  - H2: Sự kiện hệ thống
  - H2: Hành vi phê duyệt bị từ chối
  - H2: Hàm ý
  - H2: Liên quan

## tools/exec.md

- Tuyến: /tools/exec
- Tiêu đề:
  - H2: Tham số
  - H2: Cấu hình
  - H3: Xử lý PATH
  - H2: Ghi đè phiên (/exec)
  - H2: Mô hình ủy quyền
  - H2: Phê duyệt exec (ứng dụng đồng hành / máy chủ node)
  - H2: Danh sách cho phép + binary an toàn
  - H2: Ví dụ
  - H2: applypatch
  - H2: Liên quan

## tools/firecrawl.md

- Tuyến: /tools/firecrawl
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: webfetch không khóa và khóa API
  - H2: Cấu hình tìm kiếm Firecrawl
  - H2: Cấu hình fallback webfetch Firecrawl
  - H3: Firecrawl tự lưu trữ
  - H2: Công cụ Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Ẩn danh / né bot
  - H2: Cách webfetch dùng Firecrawl
  - H2: Liên quan

## tools/gemini-search.md

- Tuyến: /tools/gemini-search
- Tiêu đề:
  - H2: Lấy khóa API
  - H2: Cấu hình
  - H2: Cách hoạt động
  - H2: Tham số được hỗ trợ
  - H2: Chọn mô hình
  - H2: Ghi đè URL cơ sở
  - H2: Liên quan

## tools/goal.md

- Tuyến: /tools/goal
- Tiêu đề:
  - H1: Mục tiêu
  - H2: Bắt đầu nhanh
  - H2: Mục tiêu dùng để làm gì
  - H2: Tham chiếu lệnh
  - H2: Trạng thái
  - H2: Ngân sách token
  - H2: Công cụ mô hình
  - H2: TUI
  - H2: Hành vi kênh
  - H2: Khắc phục sự cố
  - H2: Liên quan

## tools/grok-search.md

- Tuyến: /tools/grok-search
- Tiêu đề:
  - H2: Nhập môn và cấu hình
  - H2: Đăng nhập hoặc lấy khóa API
  - H2: Cấu hình
  - H2: Cách hoạt động
  - H2: Tham số được hỗ trợ
  - H2: Ghi đè URL cơ sở
  - H2: Liên quan

## tools/image-generation.md

- Tuyến: /tools/image-generation
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Tuyến phổ biến
  - H2: Nhà cung cấp được hỗ trợ
  - H2: Khả năng của nhà cung cấp
  - H2: Tham số công cụ
  - H2: Cấu hình
  - H3: Chọn mô hình
  - H3: Thứ tự chọn nhà cung cấp
  - H3: Chỉnh sửa hình ảnh
  - H2: Tìm hiểu sâu về nhà cung cấp
  - H2: Ví dụ
  - H2: Liên quan

## tools/index.md

- Tuyến: /tools
- Tiêu đề:
  - H2: Bắt đầu tại đây
  - H2: Chọn công cụ, skill hoặc Plugin
  - H2: Danh mục công cụ tích hợp
  - H2: Công cụ do Plugin cung cấp
  - H2: Cấu hình quyền truy cập và phê duyệt
  - H2: Mở rộng khả năng
  - H2: Khắc phục sự cố thiếu công cụ
  - H2: Liên quan

## tools/kimi-search.md

- Tuyến: /tools/kimi-search
- Tiêu đề:
  - H2: Lấy khóa API
  - H2: Cấu hình
  - H2: Cách hoạt động
  - H2: Tham số được hỗ trợ
  - H2: Liên quan

## tools/llm-task.md

- Tuyến: /tools/llm-task
- Tiêu đề:
  - H2: Bật Plugin
  - H2: Cấu hình (tùy chọn)
  - H2: Tham số công cụ
  - H2: Đầu ra
  - H2: Ví dụ: Bước quy trình Lobster
  - H3: Giới hạn quan trọng
  - H2: Ghi chú an toàn
  - H2: Liên quan

## tools/lobster.md

- Tuyến: /tools/lobster
- Tiêu đề:
  - H2: Hook
  - H2: Vì sao
  - H2: Vì sao dùng DSL thay vì chương trình thuần?
  - H2: Cách hoạt động
  - H2: Mẫu: CLI nhỏ + pipe JSON + phê duyệt
  - H2: Các bước LLM chỉ JSON (llm-task)
  - H3: Giới hạn quan trọng: Lobster nhúng so với openclaw.invoke
  - H2: Tệp quy trình (.lobster)
  - H2: Cài đặt Lobster
  - H2: Bật công cụ
  - H2: Ví dụ: Phân loại email
  - H2: Tham số công cụ
  - H3: run
  - H3: resume
  - H3: Đầu vào tùy chọn
  - H2: Phong bì đầu ra
  - H2: Phê duyệt
  - H2: OpenProse
  - H2: An toàn
  - H2: Khắc phục sự cố
  - H2: Tìm hiểu thêm
  - H2: Nghiên cứu tình huống: quy trình cộng đồng
  - H2: Liên quan

## tools/loop-detection.md

- Route: /tools/loop-detection
- Tiêu đề:
  - H2: Vì sao tính năng này tồn tại
  - H2: Khối cấu hình
  - H3: Hành vi của trường
  - H2: Thiết lập được khuyến nghị
  - H2: Bộ bảo vệ sau Compaction
  - H2: Nhật ký và hành vi kỳ vọng
  - H2: Liên quan

## tools/media-overview.md

- Route: /tools/media-overview
- Tiêu đề:
  - H2: Khả năng
  - H2: Ma trận khả năng của nhà cung cấp
  - H2: Bất đồng bộ so với đồng bộ
  - H2: Chuyển giọng nói thành văn bản và Cuộc gọi thoại
  - H2: Ánh xạ nhà cung cấp (cách các nhà cung cấp phân tách giữa các bề mặt)
  - H2: Liên quan

## tools/minimax-search.md

- Route: /tools/minimax-search
- Tiêu đề:
  - H2: Lấy thông tin xác thực Token Plan
  - H2: Cấu hình
  - H2: Chọn khu vực
  - H2: Tham số được hỗ trợ
  - H2: Liên quan

## tools/multi-agent-sandbox-tools.md

- Route: /tools/multi-agent-sandbox-tools
- Tiêu đề:
  - H2: Ví dụ cấu hình
  - H2: Thứ tự ưu tiên cấu hình
  - H3: Cấu hình sandbox
  - H3: Hạn chế công cụ
  - H2: Di chuyển từ tác nhân đơn
  - H2: Ví dụ hạn chế công cụ
  - H2: Lỗi thường gặp: "non-main"
  - H2: Kiểm thử
  - H2: Khắc phục sự cố
  - H2: Liên quan

## tools/music-generation.md

- Route: /tools/music-generation
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Nhà cung cấp được hỗ trợ
  - H3: Ma trận khả năng
  - H2: Tham số công cụ
  - H2: Hành vi bất đồng bộ
  - H3: Vòng đời tác vụ
  - H2: Cấu hình
  - H3: Chọn mô hình
  - H3: Thứ tự chọn nhà cung cấp
  - H2: Ghi chú về nhà cung cấp
  - H2: Chọn lộ trình phù hợp
  - H2: Chế độ khả năng của nhà cung cấp
  - H2: Kiểm thử trực tiếp
  - H2: Liên quan

## tools/ollama-search.md

- Route: /tools/ollama-search
- Tiêu đề:
  - H2: Thiết lập
  - H2: Cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## tools/parallel-search.md

- Route: /tools/parallel-search
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Khóa API (nhà cung cấp trả phí)
  - H2: Cấu hình
  - H2: Ghi đè URL cơ sở
  - H2: Tham số công cụ
  - H2: Ghi chú
  - H2: Liên quan

## tools/pdf.md

- Route: /tools/pdf
- Tiêu đề:
  - H2: Tính khả dụng
  - H2: Tham chiếu đầu vào
  - H2: Tham chiếu PDF được hỗ trợ
  - H2: Chế độ thực thi
  - H3: Chế độ nhà cung cấp gốc
  - H3: Chế độ dự phòng trích xuất
  - H2: Cấu hình
  - H2: Chi tiết đầu ra
  - H2: Hành vi lỗi
  - H2: Ví dụ
  - H2: Liên quan

## tools/permission-modes.md

- Route: /tools/permission-modes
- Tiêu đề:
  - H2: Mặc định được khuyến nghị
  - H2: Chế độ thực thi máy chủ OpenClaw
  - H2: Ánh xạ Codex Guardian
  - H2: Quyền của bộ kiểm thử ACPX
  - H2: Chọn một chế độ
  - H2: Liên quan

## tools/perplexity-search.md

- Route: /tools/perplexity-search
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Lấy khóa API Perplexity
  - H2: Khả năng tương thích OpenRouter
  - H2: Ví dụ cấu hình
  - H3: API tìm kiếm Perplexity gốc
  - H3: Khả năng tương thích OpenRouter / Sonar
  - H2: Nơi đặt khóa
  - H2: Tham số công cụ
  - H3: Quy tắc bộ lọc miền
  - H2: Ghi chú
  - H2: Liên quan

## tools/plugin.md

- Route: /tools/plugin
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Bắt đầu nhanh
  - H2: Cấu hình
  - H3: Chọn nguồn cài đặt
  - H3: Chính sách cài đặt của người vận hành
  - H3: Cấu hình chính sách Plugin
  - H2: Hiểu các định dạng Plugin
  - H2: Hook Plugin
  - H2: Xác minh Gateway đang hoạt động
  - H2: Khắc phục sự cố
  - H3: Quyền sở hữu đường dẫn Plugin bị chặn
  - H3: Thiết lập công cụ Plugin chậm
  - H2: Liên quan

## tools/reactions.md

- Route: /tools/reactions
- Tiêu đề:
  - H2: Cách hoạt động
  - H2: Hành vi kênh
  - H2: Mức phản ứng
  - H2: Liên quan

## tools/searxng-search.md

- Route: /tools/searxng-search
- Tiêu đề:
  - H2: Thiết lập
  - H2: Cấu hình
  - H2: Biến môi trường
  - H2: Tham chiếu cấu hình Plugin
  - H2: Ghi chú
  - H2: Liên quan

## tools/skill-workshop.md

- Route: /tools/skill-workshop
- Tiêu đề:
  - H2: Cách hoạt động
  - H2: Vòng đời
  - H2: Trò chuyện
  - H2: CLI
  - H2: Nội dung đề xuất
  - H2: Tệp hỗ trợ
  - H2: Công cụ tác nhân
  - H2: Phê duyệt và tự chủ
  - H2: Phương thức Gateway
  - H2: Lưu trữ
  - H2: Giới hạn
  - H2: Khắc phục sự cố
  - H2: Liên quan

## tools/skills-config.md

- Route: /tools/skills-config
- Tiêu đề:
  - H2: Tải (skills.load)
  - H2: Cài đặt (skills.install)
  - H2: Chính sách cài đặt của người vận hành (security.installPolicy)
  - H2: Danh sách cho phép Skills đi kèm
  - H2: Mục theo từng Skills (skills.entries)
  - H2: Danh sách cho phép của tác nhân (agents)
  - H2: Workshop (skills.workshop)
  - H2: Gốc Skills được liên kết tượng trưng
  - H2: Skills trong sandbox và biến môi trường
  - H2: Nhắc lại thứ tự tải
  - H2: Liên quan

## tools/skills.md

- Route: /tools/skills
- Tiêu đề:
  - H2: Thứ tự tải
  - H2: Skills theo từng tác nhân so với Skills dùng chung
  - H2: Danh sách cho phép của tác nhân
  - H2: Plugin và Skills
  - H2: Skill Workshop
  - H2: Cài đặt từ ClawHub
  - H2: Bảo mật
  - H2: Định dạng SKILL.md
  - H3: Khóa frontmatter tùy chọn
  - H2: Kiểm soát truy cập
  - H3: Đặc tả trình cài đặt
  - H2: Ghi đè cấu hình
  - H2: Chèn môi trường
  - H2: Ảnh chụp và làm mới
  - H2: Tác động token
  - H2: Liên quan

## tools/slash-commands.md

- Route: /tools/slash-commands
- Tiêu đề:
  - H2: Ba loại lệnh
  - H2: Cấu hình
  - H2: Danh sách lệnh
  - H3: Lệnh lõi
  - H3: Lệnh Dock
  - H3: Lệnh Plugin đi kèm
  - H3: Lệnh Skills
  - H2: /tools — những gì tác nhân có thể dùng ngay
  - H2: /model — chọn mô hình
  - H2: /config — ghi cấu hình trên đĩa
  - H2: /mcp — cấu hình máy chủ MCP
  - H2: /debug — ghi đè chỉ trong thời gian chạy
  - H2: /plugins — quản lý Plugin
  - H2: /trace — đầu ra truy vết Plugin
  - H2: /btw — câu hỏi bên lề
  - H2: Ghi chú về bề mặt
  - H2: Mức sử dụng và trạng thái nhà cung cấp
  - H2: Liên quan

## tools/steer.md

- Route: /tools/steer
- Tiêu đề:
  - H2: Phiên hiện tại
  - H2: Điều hướng so với hàng đợi
  - H2: Tác nhân phụ
  - H2: Phiên ACP
  - H2: Liên quan

## tools/subagents.md

- Route: /tools/subagents
- Tiêu đề:
  - H2: Lệnh slash
  - H3: Điều khiển gắn kết luồng
  - H3: Hành vi tạo mới
  - H2: Chế độ ngữ cảnh
  - H2: Công cụ: sessionsspawn
  - H3: Chế độ lời nhắc ủy quyền
  - H3: Tham số công cụ
  - H3: Tên tác vụ và nhắm mục tiêu
  - H2: Công cụ: sessionsyield
  - H2: Công cụ: subagents
  - H2: Phiên gắn với luồng
  - H3: Kênh hỗ trợ luồng
  - H3: Luồng nhanh
  - H3: Điều khiển thủ công
  - H3: Công tắc cấu hình
  - H3: Danh sách cho phép
  - H3: Khám phá
  - H3: Tự động lưu trữ
  - H2: Tác nhân phụ lồng nhau
  - H3: Mức độ sâu
  - H3: Chuỗi thông báo
  - H3: Chính sách công cụ theo độ sâu
  - H3: Giới hạn tạo mới theo từng tác nhân
  - H3: Dừng dây chuyền
  - H2: Xác thực
  - H2: Thông báo
  - H3: Ngữ cảnh thông báo
  - H3: Dòng thống kê
  - H3: Vì sao nên ưu tiên sessionshistory
  - H2: Chính sách công cụ
  - H3: Ghi đè qua cấu hình
  - H2: Đồng thời
  - H2: Tính sống và khôi phục
  - H2: Dừng
  - H2: Giới hạn
  - H2: Liên quan

## tools/tavily.md

- Route: /tools/tavily
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tham chiếu công cụ
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Chọn công cụ phù hợp
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## tools/thinking.md

- Route: /tools/thinking
- Tiêu đề:
  - H2: Chức năng
  - H2: Thứ tự phân giải
  - H2: Đặt mặc định cho phiên
  - H2: Áp dụng theo tác nhân
  - H2: Chế độ nhanh (/fast)
  - H2: Chỉ thị chi tiết (/verbose hoặc /v)
  - H2: Chỉ thị truy vết Plugin (/trace)
  - H2: Khả năng hiển thị suy luận (/reasoning)
  - H2: Liên quan
  - H2: Heartbeat
  - H2: Giao diện trò chuyện web
  - H2: Hồ sơ nhà cung cấp

## tools/tokenjuice.md

- Route: /tools/tokenjuice
- Tiêu đề:
  - H2: Bật Plugin
  - H2: Những gì tokenjuice thay đổi
  - H2: Xác minh tính năng đang hoạt động
  - H2: Tắt Plugin
  - H2: Liên quan

## tools/tool-search.md

- Route: /tools/tool-search
- Tiêu đề:
  - H2: Cách một lượt chạy
  - H2: Chế độ
  - H2: Vì sao tính năng này tồn tại
  - H2: API
  - H2: Ranh giới thời gian chạy
  - H2: Cấu hình
  - H2: Lời nhắc và đo từ xa
  - H2: Xác thực E2E
  - H2: Hành vi khi lỗi
  - H2: Liên quan

## tools/trajectory.md

- Route: /tools/trajectory
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Truy cập
  - H2: Những gì được ghi lại
  - H2: Tệp gói
  - H2: Vị trí ghi lại
  - H2: Tắt ghi lại
  - H2: Điều chỉnh thời gian chờ flush
  - H2: Quyền riêng tư và giới hạn
  - H2: Khắc phục sự cố
  - H2: Liên quan

## tools/tts.md

- Route: /tools/tts
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Nhà cung cấp được hỗ trợ
  - H2: Cấu hình
  - H3: Ghi đè giọng nói theo từng tác nhân
  - H2: Persona
  - H3: Persona tối thiểu
  - H3: Persona đầy đủ (lời nhắc trung lập với nhà cung cấp)
  - H3: Phân giải persona
  - H3: Cách nhà cung cấp dùng lời nhắc persona
  - H3: Chính sách dự phòng
  - H2: Chỉ thị do mô hình điều khiển
  - H2: Lệnh slash
  - H2: Tùy chọn theo từng người dùng
  - H2: Định dạng đầu ra (cố định)
  - H2: Hành vi Auto-TTS
  - H2: Định dạng đầu ra theo kênh
  - H2: Tham chiếu trường
  - H2: Công cụ tác nhân
  - H2: Gateway RPC
  - H2: Liên kết dịch vụ
  - H2: Liên quan

## tools/video-generation.md

- Route: /tools/video-generation
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cách tạo bất đồng bộ hoạt động
  - H3: Vòng đời tác vụ
  - H2: Nhà cung cấp được hỗ trợ
  - H3: Ma trận khả năng
  - H2: Tham số công cụ
  - H3: Bắt buộc
  - H3: Đầu vào nội dung
  - H3: Điều khiển kiểu dáng
  - H3: Nâng cao
  - H4: Dự phòng và tùy chọn có kiểu
  - H2: Hành động
  - H2: Chọn mô hình
  - H2: Ghi chú về nhà cung cấp
  - H2: Chế độ khả năng của nhà cung cấp
  - H2: Kiểm thử trực tiếp
  - H2: Cấu hình
  - H2: Liên quan

## tools/web-fetch.md

- Route: /tools/web-fetch
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Tham số công cụ
  - H2: Cách hoạt động
  - H2: Cập nhật tiến độ
  - H2: Cấu hình
  - H2: Dự phòng Firecrawl
  - H2: Proxy môi trường tin cậy
  - H2: Giới hạn và an toàn
  - H2: Hồ sơ công cụ
  - H2: Liên quan

## tools/web.md

- Route: /tools/web
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Chọn nhà cung cấp
  - H3: So sánh nhà cung cấp
  - H2: Tự động phát hiện
  - H2: Tìm kiếm web OpenAI gốc
  - H2: Tìm kiếm web Codex gốc
  - H2: An toàn mạng
  - H2: Thiết lập tìm kiếm web
  - H2: Cấu hình
  - H3: Lưu trữ khóa API
  - H2: Tham số công cụ
  - H2: xsearch
  - H3: Cấu hình xsearch
  - H3: Tham số xsearch
  - H3: Ví dụ xsearch
  - H2: Ví dụ
  - H2: Hồ sơ công cụ
  - H2: Liên quan

## tts.md

- Route: /tts
- Tiêu đề:
  - H2: Liên quan

## vps.md

- Route: /vps
- Tiêu đề:
  - H2: Chọn nhà cung cấp
  - H2: Cách thiết lập đám mây hoạt động
  - H2: Gia cố quyền truy cập quản trị trước
  - H2: Tác nhân công ty dùng chung trên VPS
  - H2: Sử dụng node với VPS
  - H2: Tinh chỉnh khởi động cho VM nhỏ và máy chủ ARM
  - H3: Danh sách kiểm tra tinh chỉnh systemd (tùy chọn)
  - H2: Liên quan

## web/control-ui.md

- Route: /web/control-ui
- Tiêu đề:
  - H2: Mở nhanh (cục bộ)
  - H2: Ghép nối thiết bị (kết nối đầu tiên)
  - H2: Danh tính cá nhân (cục bộ trong trình duyệt)
  - H2: Endpoint cấu hình thời gian chạy
  - H2: Hỗ trợ ngôn ngữ
  - H2: Chủ đề giao diện
  - H2: Những gì có thể làm (hiện nay)
  - H2: Trang MCP
  - H2: Thẻ hoạt động
  - H2: Hành vi trò chuyện
  - H2: Cài đặt PWA và web push
  - H2: Nhúng được lưu trữ
  - H2: Chiều rộng tin nhắn trò chuyện
  - H2: Truy cập tailnet (được khuyến nghị)
  - H2: HTTP không an toàn
  - H2: Chính sách bảo mật nội dung
  - H2: Xác thực tuyến avatar
  - H2: Xác thực tuyến media của trợ lý
  - H2: Xây dựng giao diện người dùng
  - H2: Trang Control UI trống
  - H2: Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa
  - H2: Liên quan

## web/dashboard.md

- Route: /web/dashboard
- Tiêu đề:
  - H2: Lộ trình nhanh (được khuyến nghị)
  - H2: Kiến thức cơ bản về xác thực (cục bộ so với từ xa)
  - H2: Nếu bạn thấy "unauthorized" / 1008
  - H2: Liên quan

## web/index.md

- Route: /web
- Tiêu đề:
  - H2: Webhook
  - H2: RPC HTTP quản trị
  - H2: Cấu hình (bật mặc định)
  - H2: Truy cập Tailscale
  - H3: Integrated Serve (được khuyến nghị)
  - H3: Liên kết tailnet + token
  - H3: Internet công cộng (Funnel)
  - H2: Ghi chú bảo mật
  - H2: Xây dựng giao diện người dùng

## web/tui.md

- Route: /web/tui
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H3: Chế độ Gateway
  - H3: Chế độ cục bộ
  - H2: Những gì bạn thấy
  - H2: Mô hình tư duy: tác nhân + phiên
  - H2: Gửi + phân phối
  - H2: Bộ chọn + lớp phủ
  - H2: Phím tắt
  - H2: Lệnh slash
  - H2: Lệnh shell cục bộ
  - H2: Sửa cấu hình từ TUI cục bộ
  - H2: Đầu ra công cụ
  - H2: Màu terminal
  - H2: Lịch sử + phát trực tuyến
  - H2: Chi tiết kết nối
  - H2: Tùy chọn
  - H2: Khắc phục sự cố
  - H2: Khắc phục sự cố kết nối
  - H2: Liên quan

## web/webchat.md

  - Tuyến: /web/webchat
  - Tiêu đề:
  - H2: Đây là gì
  - H2: Bắt đầu nhanh
  - H2: Cách hoạt động (hành vi)
  - H3: Bản ghi và mô hình gửi
  - H2: Bảng công cụ tác tử của Control UI
  - H2: Sử dụng từ xa
  - H2: Tham chiếu cấu hình (WebChat)
  - H2: Liên quan
