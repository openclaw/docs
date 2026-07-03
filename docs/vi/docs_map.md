---
read_when: Finding which docs page covers a topic before reading the page
summary: Bản đồ tiêu đề được tạo cho các trang tài liệu OpenClaw
title: Bản đồ tài liệu
x-i18n:
    generated_at: "2026-07-03T17:26:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e7c4fa1df5ef7a3d2a921765c1647a40093ac3aa775d1e3055d54433658d067
    source_path: docs_map.md
    workflow: 16
---

# Bản đồ tài liệu OpenClaw

Tệp này được tạo từ các tiêu đề trong `docs/**/*.md` và `docs/**/*.mdx` để giúp tác nhân điều hướng cây tài liệu.
Không chỉnh sửa thủ công; hãy chạy `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Tuyến: /agent-runtime-architecture
- Tiêu đề:
  - H2: Bố cục runtime
  - H2: Ranh giới
  - H2: Manifest
  - H2: Lựa chọn runtime
  - H2: Liên quan

## announcements/bluebubbles-imessage.md

- Tuyến: /announcements/bluebubbles-imessage
- Tiêu đề:
  - H1: Việc gỡ bỏ BlueBubbles và đường dẫn iMessage imsg
  - H2: Điều đã thay đổi
  - H2: Cần làm gì
  - H2: Ghi chú di trú
  - H2: Xem thêm

## auth-credential-semantics.md

- Tuyến: /auth-credential-semantics
- Tiêu đề:
  - H2: Mã lý do thăm dò ổn định
  - H2: Thông tin xác thực token
  - H3: Quy tắc đủ điều kiện
  - H3: Quy tắc phân giải
  - H2: Khả năng di chuyển bản sao tác nhân
  - H2: Tuyến xác thực chỉ bằng cấu hình
  - H2: Lọc thứ tự xác thực tường minh
  - H2: Phân giải mục tiêu thăm dò
  - H2: Khám phá thông tin xác thực CLI bên ngoài
  - H2: Bộ bảo vệ chính sách OAuth SecretRef
  - H2: Nhắn tin tương thích với phiên bản cũ
  - H2: Liên quan

## automation/auth-monitoring.md

- Tuyến: /automation/auth-monitoring
- Tiêu đề:
  - H2: Liên quan

## automation/clawflow.md

- Tuyến: /automation/clawflow
- Tiêu đề:
  - H2: Liên quan

## automation/cron-jobs.md

- Tuyến: /automation/cron-jobs
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cách Cron hoạt động
  - H2: Kiểu lịch
  - H3: Ngày trong tháng và ngày trong tuần dùng logic OR
  - H2: Kiểu thực thi
  - H3: Payload lệnh
  - H3: Tùy chọn payload cho tác vụ biệt lập
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

- Tuyến: /automation/cron-vs-heartbeat
- Tiêu đề:
  - H2: Liên quan

## automation/gmail-pubsub.md

- Tuyến: /automation/gmail-pubsub
- Tiêu đề:
  - H2: Liên quan

## automation/hooks.md

- Tuyến: /automation/hooks
- Tiêu đề:
  - H2: Chọn bề mặt phù hợp
  - H2: Bắt đầu nhanh
  - H2: Kiểu sự kiện
  - H2: Viết hook
  - H3: Cấu trúc hook
  - H3: Định dạng HOOK.md
  - H3: Triển khai handler
  - H3: Điểm nổi bật của ngữ cảnh sự kiện
  - H2: Khám phá hook
  - H3: Gói hook
  - H2: Hook đi kèm
  - H3: Chi tiết session-memory
  - H3: Cấu hình bootstrap-extra-files
  - H3: Chi tiết command-logger
  - H3: Chi tiết compaction-notifier
  - H3: Chi tiết boot-md
  - H2: Hook Plugin
  - H2: Cấu hình
  - H2: Tham chiếu CLI
  - H2: Thực hành tốt nhất
  - H2: Khắc phục sự cố
  - H3: Không khám phá được hook
  - H3: Hook không đủ điều kiện
  - H3: Hook không thực thi
  - H2: Liên quan

## automation/index.md

- Tuyến: /automation
- Tiêu đề:
  - H2: Hướng dẫn quyết định nhanh
  - H3: Tác vụ theo lịch (Cron) so với Heartbeat
  - H2: Khái niệm cốt lõi
  - H3: Tác vụ theo lịch (Cron)
  - H3: Tác vụ
  - H3: Cam kết suy luận
  - H3: Task Flow
  - H3: Chỉ thị thường trực
  - H3: Hook
  - H3: Heartbeat
  - H2: Cách chúng hoạt động cùng nhau
  - H2: Liên quan

## automation/poll.md

- Tuyến: /automation/poll
- Tiêu đề:
  - H2: Liên quan

## automation/standing-orders.md

- Tuyến: /automation/standing-orders
- Tiêu đề:
  - H2: Vì sao cần chỉ thị thường trực
  - H2: Cách chúng hoạt động
  - H2: Cấu trúc của một chỉ thị thường trực
  - H2: Chỉ thị thường trực kết hợp với tác vụ Cron
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

- Tuyến: /automation/taskflow
- Tiêu đề:
  - H2: Khi nào dùng Task Flow
  - H2: Mẫu workflow theo lịch đáng tin cậy
  - H2: Chế độ đồng bộ
  - H3: Chế độ được quản lý
  - H3: Chế độ phản chiếu
  - H2: Trạng thái bền vững và theo dõi bản sửa đổi
  - H2: Hành vi hủy
  - H2: Lệnh CLI
  - H2: Cách flow liên quan đến tác vụ
  - H2: Liên quan

## automation/tasks.md

- Tuyến: /automation/tasks
- Tiêu đề:
  - H2: Tóm tắt nhanh
  - H2: Bắt đầu nhanh
  - H2: Điều gì tạo ra tác vụ
  - H2: Vòng đời tác vụ
  - H2: Phân phối và thông báo
  - H3: Chính sách thông báo
  - H2: Tham chiếu CLI
  - H2: Bảng tác vụ trong chat (/tasks)
  - H2: Tích hợp trạng thái (áp lực tác vụ)
  - H2: Lưu trữ và bảo trì
  - H3: Nơi tác vụ được lưu
  - H3: Bảo trì tự động
  - H2: Cách tác vụ liên quan đến các hệ thống khác
  - H2: Liên quan

## automation/troubleshooting.md

- Tuyến: /automation/troubleshooting
- Tiêu đề:
  - H2: Liên quan

## automation/webhook.md

- Tuyến: /automation/webhook
- Tiêu đề:
  - H2: Liên quan

## brave-search.md

- Tuyến: /brave-search
- Tiêu đề:
  - H2: Liên quan

## channels/access-groups.md

- Tuyến: /channels/access-groups
- Tiêu đề:
  - H2: Nhóm người gửi tin nhắn tĩnh
  - H2: Tham chiếu nhóm từ danh sách cho phép
  - H2: Đường dẫn kênh tin nhắn được hỗ trợ
  - H2: Chẩn đoán Plugin
  - H2: Đối tượng kênh Discord
  - H2: Ghi chú bảo mật
  - H2: Khắc phục sự cố

## channels/ambient-room-events.md

- Tuyến: /channels/ambient-room-events
- Tiêu đề:
  - H2: Thiết lập khuyến nghị
  - H2: Điều thay đổi
  - H2: Ví dụ Discord
  - H2: Ví dụ Slack
  - H2: Ví dụ Telegram
  - H2: Chính sách riêng cho tác nhân
  - H2: Chế độ trả lời hiển thị
  - H2: Lịch sử
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/bot-loop-protection.md

- Tuyến: /channels/bot-loop-protection
- Tiêu đề:
  - H1: Bảo vệ vòng lặp bot
  - H2: Mặc định
  - H2: Cấu hình mặc định dùng chung
  - H2: Ghi đè theo kênh hoặc tài khoản
  - H2: Hỗ trợ kênh

## channels/broadcast-groups.md

- Tuyến: /channels/broadcast-groups
- Tiêu đề:
  - H2: Tổng quan
  - H2: Trường hợp sử dụng
  - H2: Cấu hình
  - H3: Thiết lập cơ bản
  - H3: Chiến lược xử lý
  - H3: Ví dụ hoàn chỉnh
  - H2: Cách hoạt động
  - H3: Luồng tin nhắn
  - H3: Cách ly phiên
  - H3: Ví dụ: phiên biệt lập
  - H2: Thực hành tốt nhất
  - H2: Tương thích
  - H3: Nhà cung cấp
  - H3: Định tuyến
  - H2: Khắc phục sự cố
  - H2: Ví dụ
  - H2: Tham chiếu API
  - H3: Lược đồ cấu hình
  - H3: Trường
  - H2: Giới hạn
  - H2: Cải tiến trong tương lai
  - H2: Liên quan

## channels/channel-routing.md

- Tuyến: /channels/channel-routing
- Tiêu đề:
  - H1: Kênh &amp; định tuyến
  - H2: Thuật ngữ chính
  - H2: Tiền tố mục tiêu gửi đi
  - H2: Dạng khóa phiên (ví dụ)
  - H2: Ghim tuyến DM chính
  - H2: Ghi nhận tin đến có bảo vệ
  - H2: Quy tắc định tuyến (cách chọn tác nhân)
  - H2: Nhóm phát rộng (chạy nhiều tác nhân)
  - H2: Tổng quan cấu hình
  - H2: Lưu trữ phiên
  - H2: Hành vi WebChat
  - H2: Ngữ cảnh trả lời
  - H2: Liên quan

## channels/clickclack.md

- Tuyến: /channels/clickclack
- Tiêu đề:
  - H2: Thiết lập nhanh
  - H2: Nhiều bot
  - H2: Mục tiêu
  - H2: Quyền
  - H2: Khắc phục sự cố

## channels/discord.md

- Tuyến: /channels/discord
- Tiêu đề:
  - H2: Thiết lập nhanh
  - H2: Khuyến nghị: Thiết lập không gian làm việc guild
  - H2: Mô hình runtime
  - H2: Kênh diễn đàn
  - H2: Thành phần tương tác
  - H2: Kiểm soát truy cập và định tuyến
  - H3: Định tuyến tác nhân dựa trên vai trò
  - H2: Lệnh gốc và xác thực lệnh
  - H2: Chi tiết tính năng
  - H2: Công cụ và cổng hành động
  - H2: Giao diện Components v2
  - H2: Giọng nói
  - H3: Kênh thoại
  - H3: Theo dõi người dùng trong thoại
  - H3: Tin nhắn thoại
  - H2: Khắc phục sự cố
  - H2: Tham chiếu cấu hình
  - H2: An toàn và vận hành
  - H2: Liên quan

## channels/feishu.md

- Tuyến: /channels/feishu
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Kiểm soát truy cập
  - H3: Tin nhắn trực tiếp
  - H3: Chat nhóm
  - H2: Ví dụ cấu hình nhóm
  - H3: Cho phép tất cả nhóm, không yêu cầu @mention
  - H3: Cho phép tất cả nhóm, vẫn yêu cầu @mention
  - H3: Chỉ cho phép các nhóm cụ thể
  - H3: Hạn chế người gửi trong một nhóm
  - H2: Lấy ID nhóm/người dùng
  - H3: ID nhóm (chatid, định dạng: ocxxx)
  - H3: ID người dùng (openid, định dạng: ouxxx)
  - H2: Lệnh thường dùng
  - H2: Khắc phục sự cố
  - H3: Bot không phản hồi trong chat nhóm
  - H3: Bot không nhận được tin nhắn
  - H3: Thiết lập QR không phản ứng trong ứng dụng di động Feishu
  - H3: App Secret bị lộ
  - H2: Cấu hình nâng cao
  - H3: Nhiều tài khoản
  - H3: Giới hạn tin nhắn
  - H3: Streaming
  - H3: Tối ưu hóa hạn mức
  - H3: Phiên ACP
  - H4: Liên kết ACP bền vững
  - H4: Tạo ACP từ chat
  - H3: Định tuyến đa tác nhân
  - H2: Cách ly tác nhân theo người dùng (Tạo tác nhân động)
  - H3: Thiết lập nhanh
  - H3: Cách hoạt động
  - H3: Tùy chọn cấu hình
  - H3: Phạm vi phiên
  - H3: Triển khai đa người dùng điển hình
  - H3: Xác minh
  - H3: Ghi chú
  - H2: Tham chiếu cấu hình
  - H2: Kiểu tin nhắn được hỗ trợ
  - H3: Nhận
  - H3: Gửi
  - H3: Luồng và trả lời
  - H2: Liên quan

## channels/googlechat.md

- Tuyến: /channels/googlechat
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

- Tuyến: /channels/group-messages
- Tiêu đề:
  - H2: Hành vi
  - H2: Ví dụ cấu hình (WhatsApp)
  - H3: Lệnh kích hoạt (chỉ chủ sở hữu)
  - H2: Cách sử dụng
  - H2: Kiểm thử / xác minh
  - H2: Lưu ý đã biết
  - H2: Liên quan

## channels/groups.md

- Tuyến: /channels/groups
- Tiêu đề:
  - H2: Giới thiệu cho người mới bắt đầu (2 phút)
  - H2: Trả lời hiển thị
  - H2: Khả năng hiển thị ngữ cảnh và danh sách cho phép
  - H2: Khóa phiên
  - H2: Mẫu: DM cá nhân + nhóm công khai (một tác nhân)
  - H2: Nhãn hiển thị
  - H2: Chính sách nhóm
  - H2: Cổng @mention (mặc định)
  - H2: Mẫu @mention được cấu hình theo phạm vi
  - H2: Hạn chế công cụ theo nhóm/kênh (tùy chọn)
  - H2: Danh sách cho phép nhóm
  - H2: Kích hoạt (chỉ chủ sở hữu)
  - H2: Trường ngữ cảnh
  - H2: Đặc thù iMessage
  - H2: System prompt WhatsApp
  - H2: Đặc thù WhatsApp
  - H2: Liên quan

## channels/imessage-from-bluebubbles.md

- Tuyến: /channels/imessage-from-bluebubbles
- Tiêu đề:
  - H2: Danh sách kiểm tra di trú
  - H2: Khi nào việc di trú này phù hợp
  - H2: imsg làm gì
  - H2: Trước khi bắt đầu
  - H2: Chuyển đổi cấu hình
  - H2: Bẫy registry nhóm
  - H2: Từng bước
  - H2: Mức tương đương hành động trong nháy mắt
  - H2: Ghép nối, phiên và liên kết ACP
  - H2: Không có kênh rollback
  - H2: Liên quan

## channels/imessage.md

- Tuyến: /channels/imessage
- Tiêu đề:
  - H2: Thiết lập nhanh
  - H2: Yêu cầu và quyền (macOS)
  - H2: Bật API riêng imsg
  - H3: Thiết lập
  - H3: Khi bạn không thể tắt SIP
  - H2: Kiểm soát truy cập và định tuyến
  - H2: Liên kết cuộc trò chuyện ACP
  - H2: Mẫu triển khai
  - H2: Phương tiện, chia đoạn và mục tiêu phân phối
  - H2: Hành động API riêng
  - H2: Ghi cấu hình
  - H2: Gộp DM gửi tách (lệnh + URL trong một nội dung soạn)
  - H3: Kịch bản và điều tác nhân thấy
  - H2: Khôi phục tin đến sau khi bridge hoặc gateway khởi động lại
  - H3: Tín hiệu hiển thị cho người vận hành
  - H3: Di trú
  - H2: Khắc phục sự cố
  - H2: Con trỏ tham chiếu cấu hình
  - H2: Liên quan

## channels/index.md

- Tuyến: /channels
- Tiêu đề:
  - H2: Ghi chú phân phối
  - H2: Kênh được hỗ trợ
  - H2: Ghi chú

## channels/irc.md

- Tuyến: /channels/irc
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Mặc định bảo mật
  - H2: Kiểm soát truy cập
  - H3: Lỗi thường gặp: allowFrom dành cho DM, không phải kênh
  - H2: Kích hoạt trả lời (@mention)
  - H2: Ghi chú bảo mật (khuyến nghị cho kênh công khai)
  - H3: Cùng công cụ cho mọi người trong kênh
  - H3: Công cụ khác nhau theo người gửi (chủ sở hữu có nhiều quyền hơn)
  - H2: NickServ
  - H2: Biến môi trường
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/line.md

- Tuyến: /channels/line
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

- Tuyến: /channels/location
- Tiêu đề:
  - H2: Định dạng văn bản
  - H2: Trường ngữ cảnh
  - H2: Ghi chú về kênh
  - H2: Liên quan

## channels/matrix-migration.md

- Tuyến: /channels/matrix-migration
- Tiêu đề:
  - H2: Quá trình di chuyển tự động làm gì
  - H2: Quá trình di chuyển không thể tự động làm gì
  - H2: Luồng nâng cấp được khuyến nghị
  - H2: Cách hoạt động của di chuyển đã mã hóa
  - H2: Các thông báo thường gặp và ý nghĩa của chúng
  - H3: Thông báo nâng cấp và phát hiện
  - H3: Thông báo khôi phục trạng thái đã mã hóa
  - H3: Thông báo khôi phục thủ công
  - H3: Thông báo cài đặt Plugin tùy chỉnh
  - H2: Nếu lịch sử đã mã hóa vẫn không quay lại
  - H2: Nếu bạn muốn bắt đầu mới cho các tin nhắn trong tương lai
  - H2: Liên quan

## channels/matrix-presentation.md

- Tuyến: /channels/matrix-presentation
- Tiêu đề:
  - H2: Nội dung sự kiện
  - H2: Hành vi dự phòng
  - H2: Khối được hỗ trợ
  - H2: Tương tác
  - H2: Mối quan hệ với siêu dữ liệu phê duyệt
  - H2: Tin nhắn phương tiện

## channels/matrix-push-rules.md

- Tuyến: /channels/matrix-push-rules
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Các bước
  - H2: Ghi chú về nhiều bot
  - H2: Ghi chú về homeserver
  - H2: Liên quan

## channels/matrix.md

- Tuyến: /channels/matrix
- Tiêu đề:
  - H2: Cài đặt
  - H2: Thiết lập
  - H3: Thiết lập tương tác
  - H3: Cấu hình tối thiểu
  - H3: Tự động tham gia
  - H3: Định dạng đích trong danh sách cho phép
  - H3: Chuẩn hóa ID tài khoản
  - H3: Thông tin xác thực được lưu trong bộ nhớ đệm
  - H3: Biến môi trường
  - H2: Ví dụ cấu hình
  - H2: Bản xem trước phát trực tuyến
  - H2: Tin nhắn thoại
  - H2: Siêu dữ liệu phê duyệt
  - H3: Quy tắc đẩy tự lưu trữ cho bản xem trước đã hoàn tất yên tĩnh
  - H2: Phòng bot-với-bot
  - H2: Mã hóa và xác minh
  - H3: Bật mã hóa
  - H3: Tín hiệu trạng thái và tin cậy
  - H3: Xác minh thiết bị này bằng khóa khôi phục
  - H3: Bootstrap hoặc sửa chữa ký chéo
  - H3: Sao lưu khóa phòng
  - H3: Liệt kê, yêu cầu và phản hồi xác minh
  - H3: Ghi chú nhiều tài khoản
  - H2: Quản lý hồ sơ
  - H2: Luồng
  - H3: Định tuyến phiên (sessionScope)
  - H3: Trả lời theo luồng (threadReplies)
  - H3: Kế thừa luồng và lệnh gạch chéo
  - H2: Liên kết cuộc trò chuyện ACP
  - H3: Cấu hình liên kết luồng
  - H2: Phản ứng
  - H2: Ngữ cảnh lịch sử
  - H2: Khả năng hiển thị ngữ cảnh
  - H2: Chính sách DM và phòng
  - H2: Sửa chữa phòng trực tiếp
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

- Tuyến: /channels/mattermost
- Tiêu đề:
  - H2: Cài đặt
  - H2: Thiết lập nhanh
  - H2: Lệnh gạch chéo gốc
  - H2: Biến môi trường (tài khoản mặc định)
  - H2: Chế độ trò chuyện
  - H2: Luồng và phiên
  - H2: Kiểm soát truy cập (DM)
  - H2: Kênh (nhóm)
  - H2: Đích cho gửi đi
  - H2: Thử lại kênh DM
  - H2: Phát trực tuyến bản xem trước
  - H2: Phản ứng (công cụ tin nhắn)
  - H2: Nút tương tác (công cụ tin nhắn)
  - H3: Tích hợp API trực tiếp (script bên ngoài)
  - H2: Bộ chuyển đổi thư mục
  - H2: Nhiều tài khoản
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/msteams.md

- Tuyến: /channels/msteams
- Tiêu đề:
  - H2: Plugin được đóng gói kèm
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
  - H2: Phát triển cục bộ (đường hầm)
  - H2: Kiểm thử Bot
  - H2: Biến môi trường
  - H2: Hành động thông tin thành viên
  - H2: Ngữ cảnh lịch sử
  - H2: Quyền Teams RSC hiện tại (manifest)
  - H2: Ví dụ Teams manifest (đã biên tập)
  - H3: Lưu ý về manifest (trường bắt buộc)
  - H3: Cập nhật ứng dụng hiện có
  - H2: Khả năng: chỉ RSC so với Graph
  - H3: Chỉ với Teams RSC (ứng dụng đã cài đặt, không có quyền Graph API)
  - H3: Với Teams RSC + quyền Microsoft Graph Application
  - H3: RSC so với Graph API
  - H2: Phương tiện + lịch sử có bật Graph (bắt buộc cho kênh)
  - H2: Giới hạn đã biết
  - H3: Thời gian chờ Webhook
  - H3: Hỗ trợ đám mây Teams và URL dịch vụ
  - H3: Định dạng
  - H2: Cấu hình
  - H2: Định tuyến và phiên
  - H2: Kiểu trả lời: luồng so với bài đăng
  - H3: Thứ tự ưu tiên phân giải
  - H3: Bảo toàn ngữ cảnh luồng
  - H2: Tệp đính kèm và hình ảnh
  - H2: Gửi tệp trong cuộc trò chuyện nhóm
  - H3: Vì sao trò chuyện nhóm cần SharePoint
  - H3: Thiết lập
  - H3: Hành vi chia sẻ
  - H3: Hành vi dự phòng
  - H3: Vị trí lưu trữ tệp
  - H2: Cuộc thăm dò ý kiến (Adaptive Cards)
  - H2: Thẻ trình bày
  - H2: Định dạng đích
  - H2: Nhắn tin chủ động
  - H2: ID nhóm và kênh (lỗi thường gặp)
  - H2: Kênh riêng tư
  - H2: Khắc phục sự cố
  - H3: Vấn đề thường gặp
  - H3: Lỗi tải lên manifest
  - H3: Quyền RSC không hoạt động
  - H2: Tham chiếu
  - H2: Liên quan

## channels/nextcloud-talk.md

- Tuyến: /channels/nextcloud-talk
- Tiêu đề:
  - H2: Plugin được đóng gói kèm
  - H2: Thiết lập nhanh (người mới bắt đầu)
  - H2: Ghi chú
  - H2: Kiểm soát truy cập (DM)
  - H2: Phòng (nhóm)
  - H2: Khả năng
  - H2: Tham chiếu cấu hình (Nextcloud Talk)
  - H2: Liên quan

## channels/nostr.md

- Tuyến: /channels/nostr
- Tiêu đề:
  - H2: Plugin được đóng gói kèm
  - H3: Bản cài đặt cũ/tùy chỉnh
  - H3: Thiết lập không tương tác
  - H2: Thiết lập nhanh
  - H2: Tham chiếu cấu hình
  - H2: Siêu dữ liệu hồ sơ
  - H2: Kiểm soát truy cập
  - H3: Chính sách DM
  - H3: Ví dụ danh sách cho phép
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
  - H2: Giới hạn (MVP)
  - H2: Liên quan

## channels/pairing.md

- Tuyến: /channels/pairing
- Tiêu đề:
  - H2: 1) Ghép đôi DM (truy cập trò chuyện đến)
  - H3: Phê duyệt người gửi
  - H3: Nhóm người gửi có thể tái sử dụng
  - H3: Nơi lưu trạng thái
  - H2: 2) Ghép đôi thiết bị Node (nút iOS/Android/macOS/headless)
  - H3: Ghép đôi qua Telegram (khuyến nghị cho iOS)
  - H3: Phê duyệt thiết bị Node
  - H3: Tự động phê duyệt Node theo CIDR tin cậy tùy chọn
  - H3: Lưu trữ trạng thái ghép đôi Node
  - H3: Ghi chú
  - H2: Tài liệu liên quan

## channels/qa-channel.md

- Tuyến: /channels/qa-channel
- Tiêu đề:
  - H2: Chức năng
  - H2: Cấu hình
  - H2: Trình chạy
  - H2: Liên quan

## channels/qqbot.md

- Tuyến: /channels/qqbot
- Tiêu đề:
  - H2: Cài đặt
  - H2: Thiết lập
  - H2: Cấu hình
  - H3: Thiết lập nhiều tài khoản
  - H3: Trò chuyện nhóm
  - H3: Giọng nói (STT / TTS)
  - H2: Định dạng đích
  - H2: Lệnh gạch chéo
  - H2: Kiến trúc engine
  - H2: Onboarding bằng mã QR
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/raft.md

- Tuyến: /channels/raft
- Tiêu đề:
  - H2: Cài đặt
  - H2: Điều kiện tiên quyết
  - H2: Cấu hình
  - H2: Cách hoạt động
  - H2: Xác minh
  - H2: Khắc phục sự cố
  - H2: Tham chiếu

## channels/signal.md

- Tuyến: /channels/signal
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Thiết lập nhanh (người mới bắt đầu)
  - H2: Đây là gì
  - H2: Ghi cấu hình
  - H2: Mô hình số điện thoại (quan trọng)
  - H2: Đường dẫn thiết lập A: liên kết tài khoản Signal hiện có (QR)
  - H2: Đường dẫn thiết lập B: đăng ký số bot chuyên dụng (SMS, Linux)
  - H2: Chế độ daemon bên ngoài (httpUrl)
  - H2: Chế độ container (bbernhard/signal-cli-rest-api)
  - H2: Kiểm soát truy cập (DM + nhóm)
  - H2: Cách hoạt động (hành vi)
  - H2: Phương tiện + giới hạn
  - H2: Đang nhập + biên nhận đã đọc
  - H2: Phản ứng trạng thái vòng đời
  - H2: Phản ứng (công cụ tin nhắn)
  - H2: Phản ứng phê duyệt
  - H2: Đích gửi (CLI/cron)
  - H2: Bí danh
  - H2: Khắc phục sự cố
  - H2: Ghi chú bảo mật
  - H2: Tham chiếu cấu hình (Signal)
  - H2: Liên quan

## channels/slack.md

- Tuyến: /channels/slack
- Tiêu đề:
  - H2: Chọn Socket Mode hoặc HTTP Request URLs
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
  - H2: Phát trực tuyến văn bản
  - H2: Dự phòng phản ứng đang nhập
  - H2: Phương tiện, chia khúc và gửi
  - H2: Lệnh và hành vi gạch chéo
  - H2: Trả lời tương tác
  - H3: Gửi modal do Plugin sở hữu
  - H2: Phê duyệt gốc trong Slack
  - H2: Sự kiện và hành vi vận hành
  - H2: Tham chiếu cấu hình
  - H2: Khắc phục sự cố
  - H2: Tham chiếu thị giác tệp đính kèm
  - H3: Loại phương tiện được hỗ trợ
  - H3: Đường ống xử lý đầu vào
  - H3: Kế thừa tệp đính kèm từ gốc luồng
  - H3: Xử lý nhiều tệp đính kèm
  - H3: Kích thước, tải xuống và giới hạn mô hình
  - H3: Giới hạn đã biết
  - H3: Tài liệu liên quan
  - H2: Liên quan

## channels/sms.md

- Tuyến: /channels/sms
- Tiêu đề:
  - H2: Trước khi bắt đầu
  - H2: Thiết lập nhanh
  - H2: Ví dụ cấu hình
  - H3: Tệp cấu hình
  - H3: Biến môi trường
  - H3: Mã thông báo xác thực SecretRef
  - H3: Số riêng tư chỉ dùng danh sách cho phép
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
  - H3: Không có yêu cầu ghép đôi xuất hiện
  - H3: Gửi đi thất bại
  - H3: Tin nhắn đến nhưng agent không trả lời

## channels/synology-chat.md

- Tuyến: /channels/synology-chat
- Tiêu đề:
  - H2: Plugin được đóng gói kèm
  - H2: Thiết lập nhanh
  - H2: Biến môi trường
  - H2: Chính sách DM và kiểm soát truy cập
  - H2: Gửi đi
  - H2: Nhiều tài khoản
  - H2: Ghi chú bảo mật
  - H2: Khắc phục sự cố
  - H2: Liên quan

## channels/telegram.md

- Tuyến: /channels/telegram
- Tiêu đề:
  - H2: Thiết lập nhanh
  - H2: Cài đặt phía Telegram
  - H2: Kiểm soát truy cập và kích hoạt
  - H3: Danh tính bot nhóm
  - H2: Hành vi runtime
  - H2: Tham chiếu tính năng
  - H2: Điều khiển trả lời lỗi
  - H2: Khắc phục sự cố
  - H2: Tham chiếu cấu hình
  - H2: Liên quan

## channels/tlon.md

- Tuyến: /channels/tlon
- Tiêu đề:
  - H2: Plugin được đóng gói kèm
  - H2: Thiết lập
  - H2: Tàu riêng/LAN
  - H2: Kênh nhóm
  - H2: Kiểm soát truy cập
  - H2: Hệ thống chủ sở hữu và phê duyệt
  - H2: Cài đặt tự động chấp nhận
  - H2: Đích gửi (CLI/cron)
  - H2: Skill được đóng gói kèm
  - H2: Khả năng
  - H2: Khắc phục sự cố
  - H2: Tham chiếu cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## channels/troubleshooting.md

- Tuyến: /channels/troubleshooting
- Tiêu đề:
  - H2: Thang lệnh
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
  - H2: Plugin đóng gói sẵn
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
  - H2: Cài đặt (theo yêu cầu)
  - H2: Thiết lập nhanh
  - H2: Mẫu triển khai
  - H2: Mô hình runtime
  - H2: Lời nhắc phê duyệt
  - H2: Hook Plugin và quyền riêng tư
  - H2: Kiểm soát truy cập và kích hoạt
  - H2: Liên kết ACP đã cấu hình
  - H2: Hành vi số cá nhân và tự nhắn
  - H2: Chuẩn hóa tin nhắn và ngữ cảnh
  - H2: Gửi, chia khúc và phương tiện
  - H2: Trích dẫn trả lời
  - H2: Mức phản ứng
  - H2: Phản ứng xác nhận
  - H2: Phản ứng trạng thái vòng đời
  - H2: Nhiều tài khoản và thông tin xác thực
  - H2: Công cụ, hành động và ghi cấu hình
  - H2: Khắc phục sự cố
  - H2: System prompt
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
  - H3: Tối ưu hóa gửi tin nhắn đi
  - H3: Tinh chỉnh chiến lược merge-text
  - H2: Lệnh thường dùng
  - H2: Khắc phục sự cố
  - H3: Bot không phản hồi trong trò chuyện nhóm
  - H3: Bot không nhận tin nhắn
  - H3: Bot gửi trả lời trống hoặc dự phòng
  - H3: App Secret bị lộ
  - H2: Cấu hình nâng cao
  - H3: Nhiều tài khoản
  - H3: Giới hạn tin nhắn
  - H3: Streaming
  - H3: Ngữ cảnh lịch sử trò chuyện nhóm
  - H3: Chế độ trả lời cho
  - H3: Chèn gợi ý Markdown
  - H3: Chế độ gỡ lỗi
  - H3: Định tuyến nhiều agent
  - H2: Tham chiếu cấu hình
  - H2: Loại tin nhắn được hỗ trợ
  - H3: Nhận
  - H3: Gửi
  - H3: Luồng và trả lời
  - H2: Liên quan

## channels/zalo.md

- Tuyến: /channels/zalo
- Tiêu đề:
  - H2: Plugin đóng gói sẵn
  - H2: Thiết lập nhanh (người mới bắt đầu)
  - H2: Đây là gì
  - H2: Thiết lập (lộ trình nhanh)
  - H3: 1) Tạo token bot (Zalo Bot Platform)
  - H3: 2) Cấu hình token (env hoặc cấu hình)
  - H2: Cách hoạt động (hành vi)
  - H2: Giới hạn
  - H2: Kiểm soát truy cập (DM)
  - H3: Truy cập DM
  - H2: Kiểm soát truy cập (Nhóm)
  - H2: Long-polling so với webhook
  - H2: Loại tin nhắn được hỗ trợ
  - H2: Năng lực
  - H2: Đích gửi (CLI/cron)
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
  - H3: 1. Cài đặt plugin
  - H3: 2. Bật plugin trong cấu hình
  - H3: 3. Tạo mã QR và đăng nhập
  - H3: 4. Khởi động lại gateway
  - H2: Cách hoạt động
  - H2: Bên dưới hệ thống
  - H2: Khắc phục sự cố

## channels/zalouser.md

- Tuyến: /channels/zalouser
- Tiêu đề:
  - H2: Plugin đóng gói sẵn
  - H2: Thiết lập nhanh (người mới bắt đầu)
  - H2: Đây là gì
  - H2: Đặt tên
  - H2: Tìm ID (thư mục)
  - H2: Giới hạn
  - H2: Kiểm soát truy cập (DM)
  - H2: Truy cập nhóm (tùy chọn)
  - H3: Cổng kiểm soát @mention trong nhóm
  - H2: Nhiều tài khoản
  - H2: Biến môi trường
  - H2: Đang nhập, phản ứng và xác nhận gửi
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
  - H3: Cửa sổ tương thích legacy
  - H3: Ví dụ
  - H2: Smoke cài đặt
  - H2: E2E Docker cục bộ
  - H3: Tham số tinh chỉnh
  - H3: Workflow live/E2E có thể tái sử dụng
  - H3: Phần theo đường dẫn phát hành
  - H2: Plugin Prerelease
  - H2: QA Lab
  - H2: CodeQL
  - H3: Danh mục bảo mật
  - H3: Shard bảo mật theo nền tảng
  - H3: Danh mục chất lượng quan trọng
  - H2: Workflow bảo trì
  - H3: Agent tài liệu
  - H3: Agent hiệu năng kiểm thử
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
  - H2: Plugin
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
  - H2: Máy khách ACP (gỡ lỗi)
  - H2: Kiểm thử smoke giao thức
  - H2: Cách dùng phần này
  - H2: Chọn agent
  - H2: Dùng từ acpx (Codex, Claude, các máy khách ACP khác)
  - H2: Thiết lập trình soạn thảo Zed
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
  - H2: Trạng thái gửi JSON
  - H2: Liên quan

## cli/agents.md

- Tuyến: /cli/agents
- Tiêu đề:
  - H1: openclaw agents
  - H2: Ví dụ
  - H2: Liên kết định tuyến
  - H3: định dạng --bind
  - H3: Hành vi phạm vi liên kết
  - H2: Bề mặt lệnh
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete &lt;id&gt;
  - H2: Tệp định danh
  - H2: Đặt định danh
  - H2: Liên quan

## cli/approvals.md

- Tuyến: /cli/approvals
- Tiêu đề:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Lệnh thường dùng
  - H2: Thay thế phê duyệt từ tệp
  - H2: Ví dụ "Không bao giờ nhắc" / YOLO
  - H2: Trình trợ giúp danh sách cho phép
  - H2: Tùy chọn thường dùng
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
  - H2: Cờ thường dùng
  - H2: Bắt đầu nhanh (cục bộ)
  - H2: Khắc phục sự cố nhanh
  - H2: Vòng đời
  - H2: Nếu thiếu lệnh
  - H2: Hồ sơ
  - H2: Tab
  - H2: Snapshot / ảnh chụp màn hình / hành động
  - H2: Trạng thái và lưu trữ
  - H2: Gỡ lỗi
  - H2: Chrome hiện có qua MCP
  - H2: Điều khiển trình duyệt từ xa (proxy node host)
  - H2: Liên quan

## cli/channels.md

- Tuyến: /cli/channels
- Tiêu đề:
  - H1: openclaw channels
  - H2: Lệnh thường dùng
  - H2: Trạng thái / năng lực / phân giải / nhật ký
  - H2: Thêm / xóa tài khoản
  - H2: Đăng nhập và đăng xuất (tương tác)
  - H2: Khắc phục sự cố
  - H2: Thăm dò năng lực
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
  - H2: chế độ config set
  - H2: config patch
  - H2: Cờ trình dựng nhà cung cấp
  - H2: Chạy thử
  - H3: Dạng đầu ra JSON
  - H2: An toàn ghi
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
  - H2: Bộ lập kế hoạch có hỗ trợ mô hình
  - H2: Chuyển sang agent
  - H2: Chế độ cứu tin nhắn
  - H2: Liên quan

## cli/cron.md

- Tuyến: /cli/cron
- Tiêu đề:
  - H1: openclaw cron
  - H2: Tạo job nhanh
  - H2: Phiên
  - H2: Gửi
  - H3: Quyền sở hữu gửi
  - H3: Gửi khi lỗi
  - H2: Lập lịch
  - H3: Job chạy một lần
  - H3: Job định kỳ
  - H3: Lần chạy thủ công
  - H2: Mô hình
  - H3: Thứ tự ưu tiên mô hình cron cô lập
  - H3: Chế độ nhanh
  - H3: Thử lại chuyển đổi mô hình live
  - H2: Đầu ra chạy và từ chối
  - H3: Loại bỏ xác nhận cũ
  - H3: Loại bỏ token im lặng
  - H3: Từ chối có cấu trúc
  - H2: Lưu giữ
  - H2: Di chuyển job cũ
  - H2: Chỉnh sửa thường dùng
  - H2: Lệnh quản trị thường dùng
  - H2: Liên quan

## cli/daemon.md

- Tuyến: /cli/daemon
- Tiêu đề:
  - H1: openclaw daemon
  - H2: Cách sử dụng
  - H2: Lệnh con
  - H2: Tùy chọn thường dùng
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
  - H2: Tùy chọn thường dùng
  - H2: Ghi chú
  - H2: Danh sách kiểm tra khôi phục lệch token
  - H2: Liên quan

## cli/directory.md

- Tuyến: /cli/directory
- Tiêu đề:
  - H1: openclaw directory
  - H2: Cờ thường dùng
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
  - H2: Tại sao nên dùng
  - H2: Ví dụ
  - H2: Tùy chọn
  - H2: Chế độ lint
  - H2: Kiểm tra sức khỏe có cấu trúc
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

- Tuyến: /cli/hooks
- Tiêu đề:
  - H1: openclaw hooks
  - H2: Liệt kê tất cả hooks
  - H2: Lấy thông tin hook
  - H2: Kiểm tra khả năng đủ điều kiện của hooks
  - H2: Bật một Hook
  - H2: Tắt một Hook
  - H2: Ghi chú
  - H2: Cài đặt các gói hook
  - H2: Cập nhật các gói hook
  - H2: Hooks đi kèm
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Liên quan

## cli/index.md

- Tuyến: /cli
- Tiêu đề:
  - H2: Các trang lệnh
  - H2: Cờ toàn cục
  - H2: Chế độ đầu ra
  - H2: Cây lệnh
  - H2: Lệnh gạch chéo trong chat
  - H2: Theo dõi mức sử dụng
  - H2: Liên quan

## cli/infer.md

- Tuyến: /cli/infer
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

- Tuyến: /cli/logs
- Tiêu đề:
  - H1: openclaw logs
  - H2: Tùy chọn
  - H2: Tùy chọn RPC Gateway dùng chung
  - H2: Ví dụ
  - H2: Ghi chú
  - H2: Liên quan

## cli/mcp.md

- Tuyến: /cli/mcp
- Tiêu đề:
  - H2: Chọn đường dẫn MCP phù hợp
  - H2: OpenClaw dưới dạng máy chủ MCP
  - H3: Khi nào dùng serve
  - H3: Cách hoạt động
  - H3: Chọn chế độ client
  - H3: serve cung cấp những gì
  - H3: Cách dùng
  - H3: Công cụ cầu nối
  - H3: Mô hình sự kiện
  - H3: Thông báo kênh Claude
  - H3: Cấu hình client MCP
  - H3: Tùy chọn
  - H3: Ranh giới bảo mật và tin cậy
  - H3: Kiểm thử
  - H3: Khắc phục sự cố
  - H2: OpenClaw dưới dạng registry client MCP
  - H3: Định nghĩa máy chủ MCP đã lưu
  - H3: Công thức máy chủ thường dùng
  - H3: Dạng đầu ra JSON
  - H3: Truyền tải Stdio
  - H3: Truyền tải SSE / HTTP
  - H3: Quy trình OAuth
  - H3: Truyền tải HTTP có thể stream
  - H2: Giao diện điều khiển
  - H2: Giới hạn hiện tại
  - H2: Liên quan

## cli/memory.md

- Tuyến: /cli/memory
- Tiêu đề:
  - H1: openclaw memory
  - H2: Ví dụ
  - H2: Tùy chọn
  - H2: Dreaming
  - H2: Liên quan

## cli/message.md

- Tuyến: /cli/message
- Tiêu đề:
  - H1: openclaw message
  - H2: Cách dùng
  - H2: Cờ thường dùng
  - H2: Hành vi SecretRef
  - H2: Hành động
  - H3: Lõi
  - H3: Chuỗi thảo luận
  - H3: Biểu tượng cảm xúc
  - H3: Nhãn dán
  - H3: Vai trò / Kênh / Thành viên / Thoại
  - H3: Sự kiện
  - H3: Kiểm duyệt (Discord)
  - H3: Phát sóng
  - H2: Ví dụ
  - H2: Liên quan

## cli/migrate.md

- Tuyến: /cli/migrate
- Tiêu đề:
  - H1: openclaw migrate
  - H2: Lệnh
  - H2: Mô hình an toàn
  - H2: Nhà cung cấp Claude
  - H3: Claude nhập những gì
  - H3: Trạng thái lưu trữ và xét duyệt thủ công
  - H2: Nhà cung cấp Codex
  - H3: Codex nhập những gì
  - H3: Trạng thái Codex xét duyệt thủ công
  - H2: Nhà cung cấp Hermes
  - H3: Hermes nhập những gì
  - H3: Khóa .env được hỗ trợ
  - H3: Trạng thái chỉ lưu trữ
  - H3: Sau khi áp dụng
  - H2: Hợp đồng Plugin
  - H2: Tích hợp onboarding
  - H2: Liên quan

## cli/models.md

- Tuyến: /cli/models
- Tiêu đề:
  - H1: openclaw models
  - H2: Lệnh thường dùng
  - H3: Quét mô hình
  - H3: Trạng thái mô hình
  - H2: Bí danh + fallback
  - H2: Hồ sơ xác thực
  - H2: Liên quan

## cli/node.md

- Tuyến: /cli/node
- Tiêu đề:
  - H1: openclaw node
  - H2: Vì sao dùng máy chủ node?
  - H2: Proxy trình duyệt (không cần cấu hình)
  - H2: Chạy (foreground)
  - H2: Xác thực Gateway cho máy chủ node
  - H2: Dịch vụ (background)
  - H2: Ghép nối
  - H2: Phê duyệt exec
  - H2: Liên quan

## cli/nodes.md

- Tuyến: /cli/nodes
- Tiêu đề:
  - H1: openclaw nodes
  - H2: Lệnh thường dùng
  - H2: Gọi
  - H2: Liên quan

## cli/onboard.md

- Tuyến: /cli/onboard
- Tiêu đề:
  - H1: openclaw onboard
  - H2: Hướng dẫn liên quan
  - H2: Ví dụ
  - H2: Ngôn ngữ
  - H3: Lựa chọn endpoint Z.AI không tương tác
  - H2: Cờ không tương tác bổ sung
  - H2: Ghi chú luồng
  - H2: Lệnh tiếp theo thường dùng

## cli/pairing.md

- Tuyến: /cli/pairing
- Tiêu đề:
  - H1: openclaw pairing
  - H2: Lệnh
  - H2: pairing list
  - H2: pairing approve
  - H2: Ghi chú
  - H2: Liên quan

## cli/path.md

- Tuyến: /cli/path
- Tiêu đề:
  - H1: openclaw path
  - H2: Vì sao dùng nó
  - H2: Cách nó được dùng
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

- Tuyến: /cli/plugins
- Tiêu đề:
  - H2: Lệnh
  - H3: Tác giả
  - H3: Scaffold nhà cung cấp
  - H3: Cài đặt
  - H4: Viết tắt Marketplace
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

- Tuyến: /cli/policy
- Tiêu đề:
  - H1: openclaw policy
  - H2: Bắt đầu nhanh
  - H3: Tham chiếu quy tắc chính sách
  - H4: Lớp phủ theo phạm vi
  - H4: Kênh
  - H4: Máy chủ MCP
  - H4: Nhà cung cấp mô hình
  - H4: Mạng
  - H4: Ingress và quyền truy cập kênh
  - H4: Gateway
  - H4: Workspace của agent
  - H4: Trạng thái sandbox
  - H4: Xử lý dữ liệu
  - H4: Bí mật
  - H4: Phê duyệt exec
  - H4: Hồ sơ xác thực
  - H4: Siêu dữ liệu công cụ
  - H4: Trạng thái công cụ
  - H2: Cấu hình chính sách
  - H2: Chấp nhận trạng thái chính sách
  - H2: Phát hiện
  - H2: Sửa chữa
  - H2: Mã thoát
  - H2: Liên quan

## cli/proxy.md

- Tuyến: /cli/proxy
- Tiêu đề:
  - H1: openclaw proxy
  - H2: Lệnh
  - H2: Xác thực
  - H2: Preset truy vấn
  - H2: Ghi chú
  - H2: Liên quan

## cli/qr.md

- Tuyến: /cli/qr
- Tiêu đề:
  - H1: openclaw qr
  - H2: Cách dùng
  - H2: Tùy chọn
  - H2: Ghi chú
  - H2: Liên quan

## cli/reset.md

- Tuyến: /cli/reset
- Tiêu đề:
  - H1: openclaw reset
  - H2: Liên quan

## cli/sandbox.md

- Tuyến: /cli/sandbox
- Tiêu đề:
  - H2: Tổng quan
  - H2: Lệnh
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Trường hợp sử dụng
  - H3: Sau khi cập nhật một image Docker
  - H3: Sau khi thay đổi cấu hình sandbox
  - H3: Sau khi thay đổi mục tiêu SSH hoặc vật liệu xác thực SSH
  - H3: Sau khi thay đổi nguồn, chính sách hoặc chế độ OpenShell
  - H3: Sau khi thay đổi setupCommand
  - H3: Chỉ cho một agent cụ thể
  - H2: Vì sao cần điều này
  - H2: Di chuyển registry
  - H2: Cấu hình
  - H2: Liên quan

## cli/secrets.md

- Tuyến: /cli/secrets
- Tiêu đề:
  - H1: openclaw secrets
  - H2: Tải lại snapshot runtime
  - H2: Kiểm toán
  - H2: Cấu hình (trợ giúp tương tác)
  - H2: Áp dụng một kế hoạch đã lưu
  - H2: Vì sao không có bản sao lưu rollback
  - H2: Ví dụ
  - H2: Liên quan

## cli/security.md

- Tuyến: /cli/security
- Tiêu đề:
  - H1: openclaw security
  - H2: Kiểm toán
  - H2: Đầu ra JSON
  - H2: --fix thay đổi những gì
  - H2: Liên quan

## cli/sessions.md

- Tuyến: /cli/sessions
- Tiêu đề:
  - H1: openclaw sessions
  - H2: Bảo trì dọn dẹp
  - H2: Nén một phiên
  - H3: RPC sessions.compact
  - H2: Liên quan

## cli/setup.md

- Tuyến: /cli/setup
- Tiêu đề:
  - H1: openclaw setup
  - H2: Tùy chọn
  - H3: Chế độ baseline
  - H2: Ví dụ
  - H2: Ghi chú
  - H2: Liên quan

## cli/skills.md

- Tuyến: /cli/skills
- Tiêu đề:
  - H1: openclaw skills
  - H2: Lệnh
  - H2: Skill Workshop
  - H2: Liên quan

## cli/status.md

- Tuyến: /cli/status
- Tiêu đề:
  - H2: Liên quan

## cli/system.md

- Tuyến: /cli/system
- Tiêu đề:
  - H1: openclaw system
  - H2: Lệnh thường dùng
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Ghi chú
  - H2: Liên quan

## cli/tasks.md

- Tuyến: /cli/tasks
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

- Tuyến: /cli/transcripts
- Tiêu đề:
  - H1: openclaw transcripts
  - H2: Lệnh
  - H2: Đầu ra
  - H2: Nhiều cuộc họp mỗi ngày
  - H2: Thiếu bản tóm tắt
  - H2: Cấu hình

## cli/tui.md

- Tuyến: /cli/tui
- Tiêu đề:
  - H1: openclaw tui
  - H2: Tùy chọn
  - H2: Ví dụ
  - H2: Vòng lặp sửa cấu hình
  - H2: Liên quan

## cli/uninstall.md

- Tuyến: /cli/uninstall
- Tiêu đề:
  - H1: openclaw uninstall
  - H2: Liên quan

## cli/update.md

- Tuyến: /cli/update
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
  - H2: Viết tắt --update
  - H2: Liên quan

## cli/voicecall.md

- Tuyến: /cli/voicecall
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
  - H2: Phơi bày webhooks
  - H3: expose
  - H2: Liên quan

## cli/webhooks.md

- Tuyến: /cli/webhooks
- Tiêu đề:
  - H1: openclaw webhooks
  - H2: Lệnh con
  - H2: webhooks gmail setup
  - H3: Bắt buộc
  - H3: Tùy chọn Pub/Sub
  - H3: Tùy chọn phân phối OpenClaw
  - H3: Tùy chọn gog watch serve
  - H3: Phơi bày Tailscale
  - H3: Đầu ra
  - H2: webhooks gmail run
  - H2: Luồng đầu cuối
  - H2: Liên quan

## cli/wiki.md

- Tuyến: /cli/wiki
- Tiêu đề:
  - H1: openclaw wiki
  - H2: Nó dùng để làm gì
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

- Tuyến: /cli/workboard
- Tiêu đề:
  - H2: Cách dùng
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Tương đương lệnh gạch chéo
  - H2: Quyền
  - H2: Khắc phục sự cố
  - H3: Không có thẻ nào xuất hiện
  - H3: Dispatch báo chỉ dữ liệu
  - H3: Dispatch không khởi động gì
  - H2: Liên quan

## concepts/active-memory.md

- Tuyến: /concepts/active-memory
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Khuyến nghị tốc độ
  - H3: Thiết lập Cerebras
  - H2: Cách xem nó
  - H2: Bật/tắt phiên
  - H2: Khi nó chạy
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
  - H2: Lối thoát nâng cao
  - H2: Lưu transcript bền vững
  - H2: Cấu hình
  - H2: Thiết lập khuyến nghị
  - H3: Thời gian ân hạn khởi động lạnh
  - H2: Gỡ lỗi
  - H2: Vấn đề thường gặp
  - H2: Trang liên quan

## concepts/agent-loop.md

- Tuyến: /concepts/agent-loop
- Tiêu đề:
  - H2: Điểm vào
  - H2: Cách hoạt động (mức cao)
  - H2: Xếp hàng + đồng thời
  - H2: Chuẩn bị phiên + workspace
  - H2: Lắp ráp prompt + system prompt
  - H2: Điểm hook (nơi bạn có thể chặn)
  - H3: Hook nội bộ (hook Gateway)
  - H3: Hook Plugin (vòng đời agent + gateway)
  - H2: Streaming + trả lời một phần
  - H2: Thực thi công cụ + công cụ nhắn tin
  - H2: Định hình trả lời + ức chế
  - H2: Compaction + thử lại
  - H2: Luồng sự kiện (hiện nay)
  - H2: Xử lý kênh chat
  - H2: Timeout
  - H2: Nơi mọi thứ có thể kết thúc sớm
  - H2: Liên quan

## concepts/agent-runtimes.md

- Tuyến: /concepts/agent-runtimes
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
  - H2: Thư mục workspace bổ sung
  - H2: Bản đồ tệp workspace
  - H2: Những gì KHÔNG có trong workspace
  - H2: Sao lưu Git (khuyến nghị, riêng tư)
  - H2: Không commit bí mật
  - H2: Di chuyển workspace sang máy mới
  - H2: Ghi chú nâng cao
  - H2: Liên quan

## concepts/agent.md

- Tuyến: /concepts/agent
- Tiêu đề:
  - H2: Workspace (bắt buộc)
  - H2: Tệp bootstrap (được chèn)
  - H2: Công cụ tích hợp sẵn
  - H2: Skills
  - H2: Ranh giới runtime
  - H2: Phiên
  - H2: Điều hướng khi đang streaming
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
  - H3: Node (macOS / iOS / Android / headless)
  - H3: WebChat
  - H2: Vòng đời kết nối (một máy khách)
  - H2: Giao thức wire (tóm tắt)
  - H2: Ghép đôi + độ tin cậy cục bộ
  - H2: Định kiểu giao thức và sinh mã
  - H2: Truy cập từ xa
  - H2: Ảnh chụp vận hành
  - H2: Bất biến
  - H2: Liên quan

## concepts/channel-docking.md

- Tuyến: /concepts/channel-docking
- Tiêu đề:
  - H2: Ví dụ
  - H2: Vì sao dùng tính năng này
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
  - H3: Chốt bảo vệ byte bản ghi đang hoạt động
  - H3: Bản ghi kế nhiệm
  - H3: Thông báo Compaction
  - H3: Xả bộ nhớ
  - H2: Nhà cung cấp Compaction có thể cắm
  - H2: Compaction so với cắt tỉa
  - H2: Khắc phục sự cố
  - H2: Liên quan

## concepts/context-engine.md

- Tuyến: /concepts/context-engine
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cách hoạt động
  - H3: Vòng đời subagent (tùy chọn)
  - H3: Phần bổ sung system prompt
  - H2: Công cụ kế thừa
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
  - H2: Bắt đầu nhanh (kiểm tra context)
  - H2: Ví dụ đầu ra
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Những gì được tính vào cửa sổ context
  - H2: Cách OpenClaw xây dựng system prompt
  - H2: Tệp workspace được chèn (Project Context)
  - H2: Skills: được chèn so với tải theo yêu cầu
  - H2: Công cụ: có hai loại chi phí
  - H2: Lệnh, chỉ thị và "lối tắt nội tuyến"
  - H2: Phiên, Compaction và cắt tỉa (những gì được duy trì)
  - H2: /context thực sự báo cáo gì
  - H2: Liên quan

## concepts/delegate-architecture.md

- Tuyến: /concepts/delegate-architecture
- Tiêu đề:
  - H2: Delegate là gì?
  - H2: Vì sao dùng delegate?
  - H2: Tầng năng lực
  - H3: Tầng 1: Chỉ đọc + bản nháp
  - H3: Tầng 2: Gửi thay mặt
  - H3: Tầng 3: Chủ động
  - H2: Điều kiện tiên quyết: cô lập và gia cố
  - H3: Chặn cứng (không thương lượng)
  - H3: Hạn chế công cụ
  - H3: Cô lập sandbox
  - H3: Dấu vết kiểm toán
  - H2: Thiết lập delegate
  - H3: 1. Tạo agent delegate
  - H3: 2. Cấu hình ủy quyền nhà cung cấp danh tính
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Liên kết delegate với các kênh
  - H3: 4. Thêm thông tin xác thực vào agent delegate
  - H2: Ví dụ: trợ lý tổ chức
  - H2: Mẫu mở rộng quy mô
  - H2: Liên quan

## concepts/dreaming.md

- Tuyến: /concepts/dreaming
- Tiêu đề:
  - H2: Dreaming ghi gì
  - H2: Mô hình pha
  - H2: Nạp bản ghi phiên
  - H2: Nhật ký Dream
  - H2: Tín hiệu xếp hạng sâu
  - H2: Phạm vi báo cáo thử nghiệm bóng QA
  - H2: Lập lịch
  - H2: Bắt đầu nhanh
  - H2: Lệnh slash
  - H2: Quy trình CLI
  - H2: Mặc định chính
  - H2: Giao diện Dreams
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
  - H2: Thử nghiệm không có nghĩa là bị ẩn
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
  - H2: Hình dạng lệnh
  - H2: Vòng đời lần chạy
  - H2: Discord MVP
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
  - H2: Quy tắc chia khúc
  - H2: Chính sách liên kết
  - H2: Spoiler
  - H2: Cách thêm hoặc cập nhật trình định dạng kênh
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
  - H2: Honcho so với bộ nhớ tích hợp
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
  - H2: Cách sidecar hoạt động
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
  - H2: Xả bộ nhớ tự động
  - H2: Dreaming
  - H2: Backfill có căn cứ và thăng cấp trực tiếp
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
  - H2: Context nhận
  - H2: Context gửi
  - H2: Context trực tiếp
  - H2: Bề mặt adapter
  - H2: Thu gọn SDK công khai
  - H2: Quan hệ với đầu vào kênh
  - H2: Lan can tương thích
  - H2: Lưu trữ nội bộ
  - H2: Lớp lỗi
  - H2: Ánh xạ kênh
  - H2: Kế hoạch di chuyển
  - H3: Pha 1: Miền tin nhắn nội bộ
  - H3: Pha 2: Lõi gửi bền vững
  - H3: Pha 3: Cầu nối đầu vào kênh
  - H3: Pha 4: Cầu nối dispatcher đã chuẩn bị
  - H3: Pha 5: Vòng đời trực tiếp thống nhất
  - H3: Pha 6: SDK công khai
  - H3: Pha 7: Tất cả bên gửi
  - H3: Pha 8: Xóa tương thích đặt tên theo turn
  - H2: Kế hoạch kiểm thử
  - H2: Câu hỏi mở
  - H2: Tiêu chí chấp nhận
  - H2: Liên quan

## concepts/messages.md

- Tuyến: /concepts/messages
- Tiêu đề:
  - H2: Luồng tin nhắn (mức cao)
  - H2: Khử trùng lặp đầu vào
  - H2: Chống dội đầu vào
  - H2: Phiên và thiết bị
  - H2: Siêu dữ liệu kết quả công cụ
  - H2: Nội dung đầu vào và context lịch sử
  - H2: Xếp hàng và followup
  - H2: Quyền sở hữu lần chạy kênh
  - H2: Streaming, chia khúc và gom lô
  - H2: Khả năng hiển thị reasoning và token
  - H2: Tiền tố, phân luồng và trả lời
  - H2: Trả lời im lặng
  - H2: Liên quan

## concepts/model-failover.md

- Tuyến: /concepts/model-failover
- Tiêu đề:
  - H2: Luồng runtime
  - H2: Chính sách nguồn lựa chọn
  - H2: Cache bỏ qua lỗi xác thực
  - H2: Thông báo fallback hiển thị cho người dùng
  - H2: Lưu trữ xác thực (khóa + OAuth)
  - H2: ID hồ sơ
  - H2: Thứ tự xoay vòng
  - H3: Độ bám phiên (thân thiện với cache)
  - H3: Gói đăng ký OpenAI Codex cộng với bản sao lưu khóa API
  - H2: Cooldown
  - H2: Tắt do thanh toán
  - H2: Fallback mô hình
  - H3: Quy tắc chuỗi ứng viên
  - H3: Lỗi nào kích hoạt fallback
  - H3: Bỏ qua cooldown so với hành vi probe
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
  - H3: OAuth OpenAI ChatGPT/Codex
  - H3: Tùy chọn lưu trữ kiểu đăng ký khác
  - H3: OpenCode
  - H3: Google Gemini (khóa API)
  - H3: Google Vertex và Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Plugin nhà cung cấp đi kèm khác
  - H4: Điểm đặc thù đáng biết
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
  - H2: Cách chọn mô hình hoạt động
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
  - H2: Quét (mô hình OpenRouter miễn phí)
  - H2: Registry mô hình (models.json)
  - H2: Liên quan

## concepts/multi-agent.md

- Tuyến: /concepts/multi-agent
- Tiêu đề:
  - H2: "Một agent" là gì?
  - H2: Đường dẫn (bản đồ nhanh)
  - H3: Chế độ một agent (mặc định)
  - H2: Trình trợ giúp agent
  - H2: Bắt đầu nhanh
  - H2: Nhiều agent = nhiều người, nhiều tính cách
  - H2: Tìm kiếm bộ nhớ QMD liên agent
  - H2: Một số WhatsApp, nhiều người (tách DM)
  - H2: Quy tắc định tuyến (cách tin nhắn chọn agent)
  - H2: Nhiều tài khoản / số điện thoại
  - H2: Khái niệm
  - H2: Ví dụ nền tảng
  - H2: Mẫu phổ biến
  - H2: Sandbox và cấu hình công cụ cho từng agent
  - H2: Liên quan

## concepts/oauth.md

- Tuyến: /concepts/oauth
- Tiêu đề:
  - H2: Nơi nhận token (vì sao tồn tại)
  - H2: Lưu trữ (token nằm ở đâu)
  - H2: Tương thích token kế thừa của Anthropic
  - H2: Di chuyển Anthropic Claude CLI
  - H2: Trao đổi OAuth (cách đăng nhập hoạt động)
  - H3: setup-token của Anthropic
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Làm mới + hết hạn
  - H2: Nhiều tài khoản (hồ sơ) + định tuyến
  - H3: 1) Ưu tiên: các agent riêng biệt
  - H3: 2) Nâng cao: nhiều hồ sơ trong một agent
  - H2: Liên quan

## concepts/parallel-specialist-lanes.md

- Tuyến: /concepts/parallel-specialist-lanes
- Tiêu đề:
  - H2: Nguyên tắc nền tảng
  - H2: Lộ trình triển khai được khuyến nghị
  - H3: Giai đoạn 1: hợp đồng lane + công việc nặng chạy nền
  - H3: Giai đoạn 2: điều khiển ưu tiên và đồng thời
  - H3: Giai đoạn 3: điều phối viên / bộ điều khiển lưu lượng
  - H2: Mẫu hợp đồng lane tối thiểu
  - H2: Liên quan

## concepts/personal-agent-benchmark-pack.md

- Tuyến: /concepts/personal-agent-benchmark-pack
- Tiêu đề:
  - H2: Kịch bản
  - H2: Mô hình quyền riêng tư
  - H2: Mở rộng bộ này

## concepts/presence.md

- Tuyến: /concepts/presence
- Tiêu đề:
  - H2: Trường hiện diện (những gì hiển thị)
  - H2: Nguồn tạo (hiện diện đến từ đâu)
  - H3: 1) Mục tự khai báo của Gateway
  - H3: 2) Kết nối WebSocket
  - H4: Vì sao các lệnh CLI một lần không hiển thị
  - H3: 3) Tín hiệu system-event
  - H3: 4) Node kết nối (vai trò: node)
  - H2: Quy tắc hợp nhất + khử trùng lặp (vì sao instanceId quan trọng)
  - H2: TTL và kích thước có giới hạn
  - H2: Lưu ý remote/tunnel (IP loopback)
  - H2: Bên tiêu thụ
  - H3: Tab Phiên bản macOS
  - H2: Mẹo gỡ lỗi
  - H2: Liên quan

## concepts/progress-drafts.md

- Tuyến: /concepts/progress-drafts
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Người dùng thấy gì
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
  - H2: Luồng vận hành
  - H2: Phạm vi bao phủ transport trực tiếp
  - H2: Tham chiếu QA cho Telegram, Discord, Slack và WhatsApp
  - H3: Cờ CLI dùng chung
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Thiết lập workspace Slack
  - H3: QA WhatsApp
  - H3: Nhóm thông tin xác thực Convex
  - H2: Seed dựa trên repo
  - H2: Lane giả lập provider
  - H2: Bộ chuyển đổi transport
  - H3: Thêm một kênh
  - H3: Tên helper kịch bản
  - H2: Báo cáo
  - H2: Tài liệu liên quan

## concepts/qa-matrix.md

- Tuyến: /concepts/qa-matrix
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Lane làm gì
  - H2: CLI
  - H3: Cờ phổ biến
  - H3: Cờ provider
  - H2: Hồ sơ
  - H2: Kịch bản
  - H2: Biến môi trường
  - H2: Artifact đầu ra
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
  - H3: Provider mô hình
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
  - H2: Dọn dẹp ảnh kế thừa
  - H2: Mặc định thông minh
  - H2: Bật hoặc tắt
  - H2: Pruning so với Compaction
  - H2: Đọc thêm
  - H2: Liên quan

## concepts/session-tool.md

- Tuyến: /concepts/session-tool
- Tiêu đề:
  - H2: Công cụ có sẵn
  - H2: Liệt kê và đọc phiên
  - H2: Gửi tin nhắn liên phiên
  - H2: Helper trạng thái và điều phối
  - H2: Sinh sub-agent
  - H2: Khả năng hiển thị
  - H2: Đọc thêm
  - H2: Liên quan

## concepts/session.md

- Tuyến: /concepts/session
- Tiêu đề:
  - H2: Cách tin nhắn được định tuyến
  - H2: Cô lập DM
  - H3: Kênh liên kết với Dock
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
  - H2: Trông tốt là như thế nào
  - H2: Một cảnh báo
  - H2: Liên quan

## concepts/streaming.md

- Tuyến: /concepts/streaming
- Tiêu đề:
  - H2: Streaming theo khối (tin nhắn kênh)
  - H3: Phân phối media với streaming theo khối
  - H2: Thuật toán chia đoạn (giới hạn thấp/cao)
  - H2: Coalescing (hợp nhất các khối đã stream)
  - H2: Nhịp giống con người giữa các khối
  - H2: "Stream từng đoạn hoặc mọi thứ"
  - H2: Chế độ streaming bản xem trước
  - H3: Ánh xạ kênh
  - H3: Hành vi runtime
  - H3: Cập nhật xem trước tiến trình công cụ
  - H3: Lane tiến trình commentary
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
  - H2: Thiết lập múi giờ người dùng
  - H2: Khi nào ghi đè
  - H2: Liên quan

## concepts/typebox.md

- Tuyến: /concepts/typebox
- Tiêu đề:
  - H2: Mô hình tư duy (30 giây)
  - H2: Schema nằm ở đâu
  - H2: Pipeline hiện tại
  - H2: Cách schema được dùng lúc runtime
  - H2: Frame ví dụ
  - H2: Client tối thiểu (Node.js)
  - H2: Ví dụ hoàn chỉnh: thêm một method từ đầu đến cuối
  - H2: Hành vi sinh mã Swift
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
  - H2: Đây là gì
  - H2: Nó hiển thị ở đâu
  - H2: Chế độ footer sử dụng mặc định
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
  - H2: Provider + thông tin xác thực
  - H2: Liên quan

## date-time.md

- Tuyến: /date-time
- Tiêu đề:
  - H2: Phong bì tin nhắn (mặc định theo cục bộ)
  - H3: Ví dụ
  - H2: System prompt: ngày và giờ hiện tại
  - H2: Dòng sự kiện hệ thống (mặc định theo cục bộ)
  - H3: Cấu hình múi giờ người dùng + định dạng
  - H2: Phát hiện định dạng thời gian (tự động)
  - H2: Payload công cụ + connector (thời gian provider thô + trường đã chuẩn hóa)
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
  - H2: Ghi đè bằng env (một lần)
  - H2: Cờ profiling
  - H2: Artifact timeline
  - H2: Log đi đâu
  - H2: Trích xuất log
  - H2: Ghi chú
  - H2: Liên quan

## gateway/authentication.md

- Tuyến: /gateway/authentication
- Tiêu đề:
  - H2: Thiết lập được khuyến nghị (khóa API, bất kỳ provider nào)
  - H2: Anthropic: Claude CLI và tương thích token
  - H2: Ghi chú Anthropic
  - H2: Kiểm tra trạng thái xác thực mô hình
  - H2: Hành vi xoay vòng khóa API (gateway)
  - H2: Gỡ xác thực provider khi gateway đang chạy
  - H2: Kiểm soát thông tin xác thực nào được dùng
  - H3: OpenAI và id openai-codex kế thừa
  - H3: Trong khi đăng nhập (CLI)
  - H3: Theo từng phiên (lệnh chat)
  - H3: Theo từng agent (ghi đè CLI)
  - H2: Khắc phục sự cố
  - H3: "Không tìm thấy thông tin xác thực"
  - H3: Token sắp hết hạn/đã hết hạn
  - H2: Liên quan

## gateway/background-process.md

- Tuyến: /gateway/background-process
- Tiêu đề:
  - H2: công cụ exec
  - H2: Cầu nối tiến trình con
  - H2: công cụ process
  - H2: Ví dụ
  - H2: Liên quan

## gateway/bonjour.md

- Tuyến: /gateway/bonjour
- Tiêu đề:
  - H2: Bonjour diện rộng (Unicast DNS-SD) qua Tailscale
  - H3: Cấu hình Gateway (được khuyến nghị)
  - H3: Thiết lập máy chủ DNS một lần (máy chủ gateway)
  - H3: Thiết lập DNS Tailscale
  - H3: Bảo mật listener Gateway (được khuyến nghị)
  - H2: Những gì quảng bá
  - H2: Loại dịch vụ
  - H2: Khóa TXT (gợi ý không bí mật)
  - H2: Gỡ lỗi trên macOS
  - H2: Gỡ lỗi trong log Gateway
  - H2: Gỡ lỗi trên node iOS
  - H2: Khi nào bật Bonjour
  - H2: Khi nào tắt Bonjour
  - H2: Lưu ý Docker
  - H2: Khắc phục sự cố Bonjour bị tắt
  - H2: Chế độ lỗi phổ biến
  - H2: Tên phiên bản được escape (\032)
  - H2: Bật / tắt / cấu hình
  - H2: Tài liệu liên quan

## gateway/bridge-protocol.md

- Tuyến: /gateway/bridge-protocol
- Tiêu đề:
  - H2: Vì sao nó từng tồn tại
  - H2: Transport
  - H2: Handshake + ghép cặp
  - H2: Frame
  - H2: Sự kiện vòng đời exec
  - H2: Cách dùng tailnet trong lịch sử
  - H2: Phiên bản hóa
  - H2: Liên quan

## gateway/cli-backends.md

- Tuyến: /gateway/cli-backends
- Tiêu đề:
  - H2: Khởi động nhanh thân thiện với người mới
  - H2: Dùng làm phương án dự phòng
  - H2: Tổng quan cấu hình
  - H3: Cấu hình ví dụ
  - H2: Cách hoạt động
  - H2: Phiên
  - H2: Mở đầu dự phòng từ phiên claude-cli
  - H2: Ảnh (truyền qua)
  - H2: Đầu vào / đầu ra
  - H2: Mặc định (do plugin sở hữu)
  - H2: Mặc định do Plugin sở hữu
  - H2: Quyền sở hữu compaction gốc
  - H2: Overlay MCP bundle
  - H2: Giới hạn reseed lịch sử
  - H2: Giới hạn
  - H2: Khắc phục sự cố
  - H2: Liên quan

## gateway/config-agents.md

- Tuyến: /gateway/config-agents
- Tiêu đề:
  - H2: Mặc định agent
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Ghi đè hồ sơ bootstrap theo từng agent
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
  - H3: Streaming theo khối
  - H3: Chỉ báo đang nhập
  - H3: agents.defaults.sandbox
  - H3: agents.list (ghi đè theo từng agent)
  - H2: Định tuyến đa agent
  - H3: Trường khớp binding
  - H3: Hồ sơ truy cập theo từng agent
  - H2: Phiên
  - H2: Tin nhắn
  - H3: Tiền tố phản hồi
  - H3: Phản ứng xác nhận
  - H3: Debounce đầu vào
  - H3: TTS (text-to-speech)
  - H2: Nói chuyện
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
  - H3: Đa tài khoản (mọi kênh)
  - H3: Các kênh Plugin khác
  - H3: Kiểm soát theo lượt nhắc trong trò chuyện nhóm
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
  - H3: Cấu hình khởi đầu được khuyến nghị
  - H2: Ví dụ mở rộng (các tùy chọn chính)
  - H3: Kho skill sibling được liên kết symbolic
  - H2: Mẫu thường dùng
  - H3: Đường cơ sở skill dùng chung với một ghi đè
  - H3: Thiết lập đa nền tảng
  - H3: Tự động phê duyệt mạng node tin cậy
  - H3: Chế độ DM bảo mật (hộp thư đến dùng chung / DM nhiều người dùng)
  - H3: Khóa API Anthropic + phương án dự phòng MiniMax
  - H3: Bot công việc (quyền truy cập hạn chế)
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
  - H2: UI
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
  - H2: Cầu nối (cũ, đã loại bỏ)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Biến mẫu mô hình media
  - H2: Bao gồm cấu hình ($include)
  - H2: Liên quan

## gateway/configuration.md

- Tuyến: /gateway/configuration
- Tiêu đề:
  - H2: Cấu hình tối thiểu
  - H2: Chỉnh sửa cấu hình
  - H2: Xác thực nghiêm ngặt
  - H2: Tác vụ thường dùng
  - H2: Tải lại nóng cấu hình
  - H3: Chế độ tải lại
  - H3: Những gì áp dụng nóng so với những gì cần khởi động lại
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
  - H2: Nội dung bản xuất
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
  - H2: Đầu vào khám phá (cách client biết gateway ở đâu)
  - H3: 1) Khám phá Bonjour / DNS-SD
  - H4: Chi tiết beacon dịch vụ
  - H3: 2) Tailnet (liên mạng)
  - H3: 3) Mục tiêu thủ công / SSH
  - H2: Chọn transport (chính sách client)
  - H2: Ghép đôi + xác thực (transport trực tiếp)
  - H2: Trách nhiệm theo thành phần
  - H2: Liên quan

## gateway/doctor.md

- Tuyến: /gateway/doctor
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H3: Chế độ headless và tự động hóa
  - H2: Chế độ lint chỉ đọc
  - H2: Công cụ thực hiện gì (tóm tắt)
  - H2: Điền bù và đặt lại UI Dreams
  - H2: Hành vi chi tiết và lý do
  - H2: Liên quan

## gateway/external-apps.md

- Tuyến: /gateway/external-apps
- Tiêu đề:
  - H2: Hiện có những gì
  - H2: Lộ trình được khuyến nghị
  - H2: Mã ứng dụng so với mã Plugin
  - H2: Liên quan

## gateway/gateway-lock.md

- Tuyến: /gateway/gateway-lock
- Tiêu đề:
  - H2: Lý do
  - H2: Cơ chế
  - H2: Bề mặt lỗi
  - H2: Ghi chú vận hành
  - H2: Liên quan

## gateway/health.md

- Tuyến: /gateway/health
- Tiêu đề:
  - H2: Kiểm tra nhanh
  - H2: Chẩn đoán sâu
  - H2: Cấu hình giám sát sức khỏe
  - H2: Giám sát uptime
  - H3: Ví dụ thiết lập dịch vụ giám sát
  - H2: Khi có lỗi
  - H2: Lệnh "health" chuyên dụng
  - H2: Liên quan

## gateway/heartbeat.md

- Tuyến: /gateway/heartbeat
- Tiêu đề:
  - H2: Bắt đầu nhanh (người mới)
  - H2: Mặc định
  - H2: Prompt heartbeat dùng để làm gì
  - H2: Hợp đồng phản hồi
  - H2: Cấu hình
  - H3: Phạm vi và thứ tự ưu tiên
  - H3: Heartbeat theo agent
  - H3: Ví dụ giờ hoạt động
  - H3: Thiết lập 24/7
  - H3: Ví dụ đa tài khoản
  - H3: Ghi chú trường
  - H2: Hành vi gửi
  - H2: Kiểm soát khả năng hiển thị
  - H3: Mỗi cờ làm gì
  - H3: Ví dụ theo kênh so với theo tài khoản
  - H3: Mẫu thường dùng
  - H2: HEARTBEAT.md (tùy chọn)
  - H3: khối tasks:
  - H3: Agent có thể cập nhật HEARTBEAT.md không?
  - H2: Đánh thức thủ công (theo yêu cầu)
  - H2: Gửi reasoning (tùy chọn)
  - H2: Nhận thức chi phí
  - H2: Tràn ngữ cảnh sau heartbeat
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
  - H2: Nhiều gateway (cùng máy chủ)
  - H2: Truy cập từ xa
  - H2: Giám sát và vòng đời dịch vụ
  - H2: Lối nhanh cho hồ sơ dev
  - H2: Tham chiếu nhanh giao thức (góc nhìn operator)
  - H2: Kiểm tra vận hành
  - H3: Liveness
  - H3: Readiness
  - H3: Khôi phục khoảng trống
  - H2: Dấu hiệu lỗi thường gặp
  - H2: Đảm bảo an toàn
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
  - H2: Logger dựa trên tệp
  - H2: Thu thập console
  - H2: Biên tập ẩn
  - H2: Log WebSocket của Gateway
  - H3: Kiểu log WS
  - H2: Định dạng console (ghi log subsystem)
  - H2: Liên quan

## gateway/multiple-gateways.md

- Tuyến: /gateway/multiple-gateways
- Tiêu đề:
  - H2: Thiết lập được khuyến nghị tốt nhất
  - H2: Bắt đầu nhanh Rescue-Bot
  - H2: Vì sao cách này hoạt động
  - H2: `--profile rescue onboard` thay đổi gì
  - H2: Thiết lập đa gateway chung
  - H2: Danh sách kiểm tra cô lập
  - H2: Ánh xạ cổng (suy ra)
  - H2: Ghi chú Browser/CDP (lỗi dễ mắc thường gặp)
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
  - H2: Hợp đồng công cụ trò chuyện
  - H3: Trường yêu cầu được hỗ trợ
  - H3: Biến thể không được hỗ trợ
  - H3: Hình dạng phản hồi công cụ không streaming
  - H3: Hình dạng phản hồi công cụ streaming
  - H3: Vòng lặp theo dõi công cụ
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
  - H3: Chọn một chế độ
  - H2: Tham chiếu cấu hình
  - H2: Ví dụ
  - H3: Thiết lập từ xa tối thiểu
  - H3: Chế độ mirror với GPU
  - H3: OpenShell theo agent với gateway tùy chỉnh
  - H2: Quản lý vòng đời
  - H3: Khi nào cần tạo lại
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
  - H2: Metric được xuất
  - H3: Mức sử dụng mô hình
  - H3: Luồng tin nhắn
  - H3: Talk
  - H3: Hàng đợi và phiên
  - H3: Telemetry liveness của phiên
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
  - H2: Mức phạm vi
  - H2: Phạm vi phương thức chỉ là cổng đầu tiên
  - H2: Phê duyệt ghép đôi thiết bị
  - H2: Phê duyệt ghép đôi node
  - H2: Xác thực bằng bí mật dùng chung

## gateway/pairing.md

- Tuyến: /gateway/pairing
- Tiêu đề:
  - H2: Khái niệm
  - H2: Cách ghép đôi hoạt động
  - H2: Quy trình CLI (thân thiện với headless)
  - H2: Bề mặt API (giao thức gateway)
  - H2: Kiểm soát lệnh node (2026.3.31+)
  - H2: Ranh giới tin cậy sự kiện node (2026.3.31+)
  - H2: Tự động phê duyệt (ứng dụng macOS)
  - H2: Tự động phê duyệt thiết bị theo CIDR tin cậy
  - H2: Tự động phê duyệt nâng cấp metadata
  - H2: Trình hỗ trợ ghép đôi QR
  - H2: Tính cục bộ và header chuyển tiếp
  - H2: Lưu trữ (cục bộ, riêng tư)
  - H2: Hành vi transport
  - H2: Liên quan

## gateway/prometheus.md

- Tuyến: /gateway/prometheus
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Metric được xuất
  - H2: Chính sách label
  - H2: Công thức PromQL
  - H2: Chọn giữa xuất Prometheus và OpenTelemetry
  - H2: Khắc phục sự cố
  - H2: Liên quan

## gateway/protocol.md

- Tuyến: /gateway/protocol
- Tiêu đề:
  - H2: Transport
  - H2: Handshake (kết nối)
  - H3: Ví dụ Node
  - H2: Framing
  - H2: Vai trò + phạm vi
  - H3: Vai trò
  - H3: Phạm vi (operator)
  - H3: Caps/lệnh/quyền (node)
  - H2: Presence
  - H3: Sự kiện node nền còn sống
  - H2: Phạm vi sự kiện broadcast
  - H2: Các họ phương thức RPC thường gặp
  - H3: Các họ sự kiện thường gặp
  - H3: Phương thức hỗ trợ node
  - H3: RPC sổ cái tác vụ
  - H3: Phương thức hỗ trợ operator
  - H3: Chế độ xem models.list
  - H2: Phê duyệt exec
  - H2: Phương án dự phòng gửi agent
  - H2: Phiên bản hóa
  - H3: Hằng số client
  - H2: Xác thực
  - H2: Danh tính thiết bị + ghép đôi
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
  - H3: Nạp Launch Agent
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
  - H2: Truy cập từ xa giao diện trò chuyện
  - H2: Chế độ từ xa của ứng dụng macOS
  - H2: Quy tắc bảo mật (từ xa/VPN)
  - H3: macOS: đường hầm SSH bền vững qua LaunchAgent
  - H4: Bước 1: thêm cấu hình SSH
  - H4: Bước 2: sao chép khóa SSH (một lần)
  - H4: Bước 3: cấu hình mã thông báo Gateway
  - H4: Bước 4: tạo LaunchAgent
  - H4: Bước 5: nạp LaunchAgent
  - H4: Khắc phục sự cố
  - H2: Liên quan

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Tuyến: /gateway/sandbox-vs-tool-policy-vs-elevated
- Tiêu đề:
  - H2: Gỡ lỗi nhanh
  - H2: Sandbox: nơi công cụ chạy
  - H3: Bind mount (kiểm tra nhanh bảo mật)
  - H2: Chính sách công cụ: công cụ nào tồn tại/có thể gọi
  - H3: Nhóm công cụ (viết tắt)
  - H2: Nâng quyền: chỉ exec "chạy trên máy chủ"
  - H2: Các cách sửa lỗi "nhốt trong sandbox" phổ biến
  - H3: "Công cụ X bị chặn bởi chính sách công cụ sandbox"
  - H3: "Tôi tưởng đây là main, tại sao nó bị sandbox?"
  - H2: Liên quan

## gateway/sandboxing.md

- Tuyến: /gateway/sandboxing
- Tiêu đề:
  - H2: Những gì được đưa vào sandbox
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
  - H2: Ghi đè đa tác nhân
  - H2: Ví dụ bật tối thiểu
  - H2: Liên quan

## gateway/secrets-plan-contract.md

- Tuyến: /gateway/secrets-plan-contract
- Tiêu đề:
  - H2: Hình dạng tệp kế hoạch
  - H2: Upsert và xóa provider
  - H2: Phạm vi đích được hỗ trợ
  - H2: Hành vi loại đích
  - H2: Quy tắc xác thực đường dẫn
  - H2: Hành vi khi lỗi
  - H2: Hành vi đồng ý của provider exec
  - H2: Ghi chú về phạm vi runtime và kiểm toán
  - H2: Kiểm tra dành cho operator
  - H2: Tài liệu liên quan

## gateway/secrets.md

- Tuyến: /gateway/secrets
- Tiêu đề:
  - H2: Mục tiêu và mô hình runtime
  - H2: Ranh giới truy cập của tác nhân
  - H2: Lọc bề mặt đang hoạt động
  - H2: Chẩn đoán bề mặt xác thực Gateway
  - H2: Kiểm tra trước tham chiếu onboarding
  - H2: Hợp đồng SecretRef
  - H2: Cấu hình provider
  - H2: Khóa API dựa trên tệp
  - H2: Ví dụ tích hợp exec
  - H2: Biến môi trường máy chủ MCP
  - H2: Vật liệu xác thực SSH sandbox
  - H2: Bề mặt thông tin xác thực được hỗ trợ
  - H2: Hành vi bắt buộc và thứ tự ưu tiên
  - H2: Tác nhân kích hoạt
  - H2: Tín hiệu suy giảm và đã phục hồi
  - H2: Phân giải đường dẫn lệnh
  - H2: Quy trình kiểm toán và cấu hình
  - H2: Chính sách an toàn một chiều
  - H2: Ghi chú tương thích xác thực cũ
  - H2: Ghi chú giao diện web
  - H2: Liên quan

## gateway/security/audit-checks.md

- Tuyến: /gateway/security/audit-checks
- Tiêu đề:
  - H2: Liên quan

## gateway/security/exposure-runbook.md

- Tuyến: /gateway/security/exposure-runbook
- Tiêu đề:
  - H2: Chọn mẫu phơi lộ
  - H2: Kiểm kê trước khi thực hiện
  - H2: Kiểm tra nền tảng
  - H2: Nền tảng an toàn tối thiểu
  - H2: Phơi lộ DM và nhóm
  - H2: Kiểm tra reverse proxy
  - H2: Rà soát công cụ và sandbox
  - H2: Xác thực sau thay đổi
  - H2: Kế hoạch rollback
  - H2: Danh sách kiểm tra rà soát

## gateway/security/index.md

- Tuyến: /gateway/security
- Tiêu đề:
  - H2: Phạm vi trước tiên: mô hình bảo mật trợ lý cá nhân
  - H2: Kiểm tra nhanh: kiểm toán bảo mật openclaw
  - H3: Khóa dependency của gói đã phát hành
  - H3: Độ tin cậy của triển khai và máy chủ
  - H3: Thao tác tệp an toàn
  - H3: Workspace Slack dùng chung: rủi ro thực tế
  - H3: Tác nhân dùng chung trong công ty: mẫu chấp nhận được
  - H2: Khái niệm độ tin cậy Gateway và node
  - H2: Ma trận ranh giới tin cậy
  - H2: Không phải lỗ hổng theo thiết kế
  - H2: Nền tảng được gia cố trong 60 giây
  - H2: Quy tắc nhanh cho hộp thư đến dùng chung
  - H2: Mô hình hiển thị ngữ cảnh
  - H2: Kiểm toán kiểm tra những gì (mức cao)
  - H2: Bản đồ lưu trữ thông tin xác thực
  - H2: Danh sách kiểm tra kiểm toán bảo mật
  - H2: Bảng thuật ngữ kiểm toán bảo mật
  - H2: Control UI qua HTTP
  - H2: Tóm tắt các cờ không an toàn hoặc nguy hiểm
  - H2: Cấu hình reverse proxy
  - H2: Ghi chú HSTS và origin
  - H2: Nhật ký phiên cục bộ nằm trên đĩa
  - H2: Thực thi Node (system.run)
  - H2: Skills động (watcher / node từ xa)
  - H2: Mô hình mối đe dọa
  - H2: Khái niệm cốt lõi: kiểm soát truy cập trước trí tuệ
  - H2: Mô hình cấp quyền lệnh
  - H2: Rủi ro công cụ control plane
  - H2: Plugin
  - H2: Mô hình truy cập DM: ghép đôi, allowlist, mở, tắt
  - H2: Cô lập phiên DM (chế độ nhiều người dùng)
  - H3: Chế độ DM an toàn (khuyến nghị)
  - H2: Allowlist cho DM và nhóm
  - H2: Prompt injection (là gì, vì sao quan trọng)
  - H2: Làm sạch special-token trong nội dung bên ngoài
  - H2: Cờ bỏ qua nội dung bên ngoài không an toàn
  - H3: Prompt injection không yêu cầu DM công khai
  - H3: Backend LLM tự host
  - H3: Độ mạnh của mô hình (ghi chú bảo mật)
  - H2: Lý luận và đầu ra chi tiết trong nhóm
  - H2: Ví dụ gia cố cấu hình
  - H3: Quyền tệp
  - H3: Phơi lộ mạng (bind, cổng, tường lửa)
  - H3: Xuất bản cổng Docker với UFW
  - H3: Khám phá mDNS/Bonjour
  - H3: Khóa Gateway WebSocket (xác thực cục bộ)
  - H3: Header danh tính Tailscale Serve
  - H3: Điều khiển trình duyệt qua máy chủ node (khuyến nghị)
  - H3: Bí mật trên đĩa
  - H3: Tệp .env của workspace
  - H3: Nhật ký và bản ghi phiên (biên tập ẩn và lưu giữ)
  - H3: DM: ghép đôi theo mặc định
  - H3: Nhóm: yêu cầu nhắc tên ở mọi nơi
  - H3: Số riêng biệt (WhatsApp, Signal, Telegram)
  - H3: Chế độ chỉ đọc (qua sandbox và công cụ)
  - H3: Nền tảng an toàn (sao chép/dán)
  - H2: Sandboxing (khuyến nghị)
  - H3: Lan can ủy quyền tác nhân phụ
  - H2: Rủi ro điều khiển trình duyệt
  - H3: Chính sách SSRF trình duyệt (mặc định nghiêm ngặt)
  - H2: Hồ sơ truy cập theo tác nhân (đa tác nhân)
  - H3: Ví dụ: toàn quyền truy cập (không sandbox)
  - H3: Ví dụ: công cụ chỉ đọc + workspace chỉ đọc
  - H3: Ví dụ: không truy cập hệ thống tệp/shell (cho phép nhắn tin qua provider)
  - H2: Ứng phó sự cố
  - H3: Cô lập
  - H3: Xoay vòng (giả định bị xâm phạm nếu bí mật bị rò rỉ)
  - H3: Kiểm toán
  - H3: Thu thập cho báo cáo
  - H2: Quét bí mật
  - H2: Báo cáo vấn đề bảo mật

## gateway/security/secure-file-operations.md

- Tuyến: /gateway/security/secure-file-operations
- Tiêu đề:
  - H2: Mặc định: không có helper Python
  - H2: Những gì vẫn được bảo vệ khi không có Python
  - H2: Python bổ sung những gì
  - H2: Hướng dẫn cho Plugin và lõi

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
  - H2: Nội dung yêu cầu
  - H2: Hành vi chính sách + định tuyến
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
  - H2: Bỏ qua symlink Skill vì thoát đường dẫn
  - H2: Anthropic 429 yêu cầu sử dụng bổ sung cho ngữ cảnh dài
  - H2: Phản hồi 403 từ upstream bị chặn
  - H2: Backend tương thích OpenAI cục bộ vượt qua probe trực tiếp nhưng lượt chạy tác nhân thất bại
  - H2: Không có phản hồi
  - H2: Kết nối Control UI của dashboard
  - H3: Bản đồ nhanh mã chi tiết xác thực
  - H2: Dịch vụ Gateway không chạy
  - H2: Gateway macOS âm thầm ngừng phản hồi, rồi tiếp tục khi bạn chạm vào dashboard
  - H2: Gateway thoát khi dùng nhiều bộ nhớ
  - H2: Gateway từ chối cấu hình không hợp lệ
  - H2: Cảnh báo probe Gateway
  - H2: Kênh đã kết nối, tin nhắn không chảy
  - H2: Phân phối Cron và Heartbeat
  - H2: Node đã ghép đôi, công cụ thất bại
  - H2: Công cụ trình duyệt thất bại
  - H2: Nếu bạn đã nâng cấp và có thứ đột nhiên hỏng
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
  - H3: Hướng dẫn triển khai
  - H2: Ví dụ thiết lập proxy
  - H2: Cấu hình mã thông báo hỗn hợp
  - H2: Header phạm vi operator
  - H2: Danh sách kiểm tra bảo mật
  - H2: Kiểm toán bảo mật
  - H2: Khắc phục sự cố
  - H2: Di chuyển từ xác thực bằng mã thông báo
  - H2: Liên quan

## help/debugging.md

- Tuyến: /help/debugging
- Tiêu đề:
  - H2: Ghi đè gỡ lỗi runtime
  - H2: Đầu ra trace phiên
  - H2: Trace vòng đời Plugin
  - H2: Hồ sơ hóa khởi động CLI và lệnh
  - H2: Chế độ watch của Gateway
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
  - H2: Thông tin xác thực provider và workspace .env
  - H2: Khối env cấu hình
  - H2: Nhập env shell
  - H2: Snapshot shell exec
  - H2: Biến env được runtime chèn
  - H2: Biến env của UI
  - H2: Thay thế biến env trong cấu hình
  - H2: Secret ref so với chuỗi ${ENV}
  - H2: Biến env liên quan đến đường dẫn
  - H2: Ghi nhật ký
  - H3: OPENCLAWHOME
  - H2: Người dùng nvm: lỗi TLS của webfetch
  - H2: Biến môi trường cũ
  - H2: Liên quan

## help/faq-first-run.md

- Tuyến: /help/faq-first-run
- Tiêu đề:
  - H2: Khởi động nhanh và thiết lập lần chạy đầu
  - H2: Liên quan

## help/faq-models.md

- Tuyến: /help/faq-models
- Tiêu đề:
  - H2: Mô hình: mặc định, lựa chọn, alias, chuyển đổi
  - H2: Chuyển dự phòng mô hình và "Tất cả mô hình đều thất bại"
  - H2: Hồ sơ xác thực: chúng là gì và cách quản lý
  - H2: Liên quan

## help/faq.md

- Tuyến: /help/faq
- Tiêu đề:
  - H2: 60 giây đầu nếu có thứ bị hỏng
  - H2: Khởi động nhanh và thiết lập lần chạy đầu
  - H2: OpenClaw là gì?
  - H2: Skills và tự động hóa
  - H2: Sandboxing và bộ nhớ
  - H2: Nơi mọi thứ nằm trên đĩa
  - H2: Cơ bản về cấu hình
  - H2: Gateway và node từ xa
  - H2: Biến env và tải .env
  - H2: Phiên và nhiều cuộc trò chuyện
  - H2: Mô hình, chuyển dự phòng và hồ sơ xác thực
  - H2: Gateway: cổng, "đang chạy rồi", và chế độ từ xa
  - H2: Ghi nhật ký và gỡ lỗi
  - H2: Phương tiện và tệp đính kèm
  - H2: Bảo mật và kiểm soát truy cập
  - H2: Lệnh trò chuyện, hủy tác vụ, và "nó sẽ không dừng"
  - H2: Khác
  - H2: Liên quan

## help/index.md

- Tuyến: /help
- Tiêu đề:
  - H2: Câu hỏi thường gặp
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
  - H3: Lớp 1: Hoàn tất mô hình trực tiếp (không qua gateway)
  - H3: Lớp 2: Gateway + smoke tác tử dev (những gì "@openclaw" thực sự làm)
  - H2: Trực tiếp: smoke backend CLI (Claude, Gemini, hoặc CLI cục bộ khác)
  - H2: Trực tiếp: khả năng truy cập proxy APNs HTTP/2
  - H2: Trực tiếp: smoke liên kết ACP (/acp spawn ... --bind here)
  - H2: Trực tiếp: smoke harness máy chủ ứng dụng Codex
  - H3: Công thức trực tiếp được khuyến nghị
  - H2: Trực tiếp: ma trận mô hình (những gì chúng tôi bao phủ)
  - H3: Bộ smoke hiện đại (gọi công cụ + hình ảnh)
  - H3: Nền tảng: gọi công cụ (Read + Exec tùy chọn)
  - H3: Thị giác: gửi hình ảnh (tệp đính kèm → tin nhắn đa phương thức)
  - H3: Bộ tổng hợp / gateway thay thế
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
  - H2: Khả năng tương thích cũ
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
  - H3: Độ ổn định (gateway)
  - H3: E2E (tổng hợp repo)
  - H3: E2E (smoke gateway)
  - H3: E2E (trình duyệt giả lập Control UI)
  - H3: E2E: smoke backend OpenShell
  - H3: Trực tiếp (nhà cung cấp thật + mô hình thật)
  - H2: Tôi nên chạy bộ nào?
  - H2: Kiểm thử trực tiếp (chạm mạng)
  - H2: Runner Docker (kiểm tra tùy chọn "hoạt động trên Linux")
  - H2: Kiểm tra hợp lý tài liệu
  - H2: Hồi quy ngoại tuyến (an toàn cho CI)
  - H2: Đánh giá độ tin cậy tác tử (skills)
  - H2: Kiểm thử hợp đồng (hình dạng plugin và kênh)
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
  - H2: Backend tương thích OpenAI cục bộ hoạt động trực tiếp nhưng lỗi trong OpenClaw
  - H2: Cài đặt Plugin lỗi do thiếu tiện ích mở rộng openclaw
  - H2: Chính sách cài đặt chặn cài đặt hoặc cập nhật Plugin
  - H2: Plugin hiện diện nhưng bị chặn do quyền sở hữu đáng ngờ
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
  - H2: Bảng điều khiển
  - H2: Cấu hình (tùy chọn)
  - H2: Bắt đầu tại đây
  - H2: Tìm hiểu thêm

## install/ansible.md

- Tuyến: /install/ansible
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Bạn nhận được gì
  - H2: Bắt đầu nhanh
  - H2: Những gì được cài đặt
  - H2: Thiết lập sau khi cài đặt
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
  - H2: Bạn cần gì
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
  - H2: Script vòng đời
  - H2: Lưu ý
  - H2: Liên quan

## install/clawdock.md

- Tuyến: /install/clawdock
- Tiêu đề:
  - H2: Cài đặt
  - H2: Bạn nhận được gì
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
  - H2: Nhắm mục tiêu phiên bản hoặc thẻ một lần
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
  - H2: Lưu giữ và sao lưu
  - H2: Mẹo cho RAM 1 GB
  - H2: Khắc phục sự cố
  - H2: Bước tiếp theo
  - H2: Liên quan

## install/docker-vm-runtime.md

- Tuyến: /install/docker-vm-runtime
- Tiêu đề:
  - H2: Đưa các tệp nhị phân bắt buộc vào image
  - H2: Xây dựng và khởi chạy
  - H2: Những gì được lưu ở đâu
  - H2: Cập nhật
  - H2: Liên quan

## install/docker.md

- Tuyến: /install/docker
- Tiêu đề:
  - H2: Docker có phù hợp với tôi không?
  - H2: Điều kiện tiên quyết
  - H2: Gateway container hóa
  - H3: Luồng thủ công
  - H3: Biến môi trường
  - H3: Khả năng quan sát
  - H3: Kiểm tra sức khỏe
  - H3: LAN so với loopback
  - H3: Nhà cung cấp cục bộ trên host
  - H3: Backend Claude CLI trong Docker
  - H3: Bonjour / mDNS
  - H3: Lưu trữ và lưu giữ
  - H3: Trình trợ giúp shell (tùy chọn)
  - H3: Chạy trên VPS?
  - H2: Sandbox tác tử
  - H3: Bật nhanh
  - H2: Khắc phục sự cố
  - H2: Liên quan

## install/exe-dev.md

- Tuyến: /install/exe-dev
- Tiêu đề:
  - H2: Lộ trình nhanh cho người mới bắt đầu
  - H2: Bạn cần gì
  - H2: Cài đặt tự động bằng Shelley
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
  - H2: Bạn cần gì
  - H2: Lộ trình nhanh cho người mới bắt đầu
  - H2: Khắc phục sự cố
  - H3: "Ứng dụng không lắng nghe trên địa chỉ mong đợi"
  - H3: Kiểm tra sức khỏe lỗi / kết nối bị từ chối
  - H3: OOM / Vấn đề bộ nhớ
  - H3: Vấn đề khóa Gateway
  - H3: Cấu hình không được đọc
  - H3: Ghi cấu hình qua SSH
  - H3: Trạng thái không được lưu giữ
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
  - H2: Bạn cần gì
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
  - H2: Bạn cần gì
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
  - H2: Khuyến nghị: script cài đặt
  - H2: Phương thức cài đặt thay thế
  - H3: Trình cài đặt tiền tố cục bộ (install-cli.sh)
  - H3: npm, pnpm, hoặc bun
  - H3: Từ nguồn
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
  - H3: Phát hiện checkout nguồn
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
  - H2: Bạn cần gì
  - H2: Bắt đầu nhanh
  - H2: Kiểm thử cục bộ bằng Kind
  - H2: Từng bước
  - H3: 1) Triển khai
  - H3: 2) Truy cập gateway
  - H2: Những gì được triển khai
  - H2: Tùy chỉnh
  - H3: Chỉ dẫn tác tử
  - H3: Cấu hình Gateway
  - H3: Thêm nhà cung cấp
  - H3: Namespace tùy chỉnh
  - H3: Image tùy chỉnh
  - H3: Phơi bày ngoài port-forward
  - H2: Triển khai lại
  - H2: Tháo dỡ
  - H2: Ghi chú kiến trúc
  - H2: Cấu trúc tệp
  - H2: Liên quan

## install/macos-vm.md

- Tuyến: /install/macos-vm
- Tiêu đề:
  - H2: Mặc định khuyến nghị (hầu hết người dùng)
  - H2: Tùy chọn VM macOS
  - H3: VM cục bộ trên Apple Silicon Mac của bạn (Lume)
  - H3: Nhà cung cấp Mac được lưu trữ (đám mây)
  - H2: Lộ trình nhanh (Lume, người dùng có kinh nghiệm)
  - H2: Bạn cần gì (Lume)
  - H2: 1) Cài đặt Lume
  - H2: 2) Tạo VM macOS
  - H2: 3) Hoàn tất Setup Assistant
  - H2: 4) Lấy địa chỉ IP của VM
  - H2: 5) SSH vào VM
  - H2: 6) Cài đặt OpenClaw
  - H2: 7) Cấu hình kênh
  - H2: 8) Chạy VM ở chế độ headless
  - H2: Phần bổ sung: tích hợp iMessage
  - H2: Lưu một golden image
  - H2: Chạy 24/7
  - H2: Khắc phục sự cố
  - H2: Tài liệu liên quan

## install/migrating-claude.md

- Tuyến: /install/migrating-claude
- Tiêu đề:
  - H2: Hai cách nhập
  - H2: Những gì được nhập
  - H2: Những gì chỉ lưu trữ
  - H2: Chọn nguồn
  - H2: Luồng khuyến nghị
  - H2: Xử lý xung đột
  - H2: Đầu ra JSON cho tự động hóa
  - H2: Khắc phục sự cố
  - H2: Liên quan

## install/migrating-hermes.md

- Tuyến: /install/migrating-hermes
- Tiêu đề:
  - H2: Hai cách nhập
  - H2: Những gì được nhập
  - H2: Những gì chỉ lưu trữ
  - H2: Luồng khuyến nghị
  - H2: Xử lý xung đột
  - H2: Bí mật
  - H2: Đầu ra JSON cho tự động hóa
  - H2: Khắc phục sự cố
  - H2: Liên quan

## install/migrating.md

- Tuyến: /install/migrating
- Tiêu đề:
  - H2: Nhập từ hệ thống tác tử khác
  - H2: Di chuyển OpenClaw sang máy mới
  - H3: Các bước di chuyển
  - H3: Lỗi thường gặp
  - H3: Danh sách kiểm tra xác minh
  - H2: Nâng cấp Plugin tại chỗ
  - H2: Liên quan

## install/nix.md

- Tuyến: /install/nix
- Tiêu đề:
  - H2: Bạn nhận được gì
  - H2: Bắt đầu nhanh
  - H2: Hành vi runtime ở chế độ Nix
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
  - H2: Bạn nhận được gì
  - H2: Kết nối kênh
  - H2: Bước tiếp theo

## install/oracle.md

- Tuyến: /install/oracle
- Tiêu đề:
  - H2: Điều kiện tiên quyết
  - H2: Thiết lập
  - H2: Xác minh tư thế bảo mật
  - H2: Ghi chú ARM
  - H2: Lưu giữ và sao lưu
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
  - H2: Bạn nhận được gì
  - H2: Cài đặt Railway bắt buộc
  - H3: Mạng công khai
  - H3: Volume (bắt buộc)
  - H3: Biến
  - H2: Kết nối kênh
  - H2: Sao lưu &amp; di chuyển
  - H2: Bước tiếp theo

## install/raspberry-pi.md

- Đường dẫn: /install/raspberry-pi
- Tiêu đề:
  - H2: Khả năng tương thích phần cứng
  - H2: Điều kiện tiên quyết
  - H2: Thiết lập
  - H2: Mẹo hiệu năng
  - H2: Thiết lập mô hình được khuyến nghị
  - H2: Ghi chú về tệp nhị phân ARM
  - H2: Duy trì dữ liệu và sao lưu
  - H2: Khắc phục sự cố
  - H2: Bước tiếp theo
  - H2: Liên quan

## install/render.mdx

- Đường dẫn: /install/render
- Tiêu đề:
  - H1: Render
  - H2: Điều kiện tiên quyết
  - H2: Triển khai bằng Render Blueprint
  - H2: Hiểu về Blueprint
  - H2: Chọn gói
  - H2: Sau khi triển khai
  - H3: Truy cập Giao diện điều khiển
  - H2: Tính năng của Render Dashboard
  - H3: Nhật ký
  - H3: Truy cập shell
  - H3: Biến môi trường
  - H3: Tự động triển khai
  - H2: Miền tùy chỉnh
  - H2: Mở rộng quy mô
  - H2: Sao lưu và di chuyển
  - H2: Khắc phục sự cố
  - H3: Dịch vụ không khởi động
  - H3: Khởi động nguội chậm (gói miễn phí)
  - H3: Mất dữ liệu sau khi triển khai lại
  - H3: Lỗi kiểm tra tình trạng
  - H2: Bước tiếp theo

## install/uninstall.md

- Đường dẫn: /install/uninstall
- Tiêu đề:
  - H2: Đường dẫn dễ dàng (CLI vẫn được cài đặt)
  - H2: Gỡ dịch vụ thủ công (CLI chưa được cài đặt)
  - H3: macOS (launchd)
  - H3: Linux (systemd user unit)
  - H3: Windows (Scheduled Task)
  - H2: Cài đặt thông thường so với bản checkout nguồn
  - H3: Cài đặt thông thường (install.sh / npm / pnpm / bun)
  - H3: Bản checkout nguồn (git clone)
  - H2: Liên quan

## install/updating.md

- Đường dẫn: /install/updating
- Tiêu đề:
  - H2: Khuyến nghị: openclaw update
  - H2: Chuyển đổi giữa cài đặt npm và git
  - H2: Phương án thay thế: chạy lại trình cài đặt
  - H2: Phương án thay thế: npm, pnpm hoặc bun thủ công
  - H3: Chủ đề cài đặt npm nâng cao
  - H2: Trình tự động cập nhật
  - H2: Sau khi cập nhật
  - H3: Chạy doctor
  - H3: Khởi động lại Gateway
  - H3: Xác minh
  - H2: Khôi phục
  - H3: Ghim phiên bản (npm)
  - H3: Ghim commit (nguồn)
  - H2: Nếu bạn bị kẹt
  - H2: Liên quan

## install/upstash.md

- Đường dẫn: /install/upstash
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

- Đường dẫn: /logging
- Tiêu đề:
  - H2: Nơi lưu nhật ký
  - H2: Cách đọc nhật ký
  - H3: CLI: theo dõi trực tiếp (được khuyến nghị)
  - H3: Giao diện điều khiển (web)
  - H3: Nhật ký chỉ kênh
  - H2: Định dạng nhật ký
  - H3: Nhật ký tệp (JSONL)
  - H3: Đầu ra console
  - H3: Nhật ký WebSocket Gateway
  - H2: Cấu hình ghi nhật ký
  - H3: Mức nhật ký
  - H3: Chẩn đoán truyền tải mô hình có mục tiêu
  - H3: Tương quan dấu vết
  - H3: Kích thước và thời gian gọi mô hình
  - H3: Kiểu console
  - H3: Biên tập ẩn
  - H2: Chẩn đoán và OpenTelemetry
  - H2: Mẹo khắc phục sự cố
  - H2: Liên quan

## maturity/scorecard.md

- Đường dẫn: /maturity/scorecard
- Tiêu đề:
  - H1: Bảng điểm độ trưởng thành
  - H2: Mục đích của trang này
  - H2: Tổng quan nhanh
  - H2: Dải điểm
  - H2: Trình khám phá bề mặt
  - H2: Tóm tắt bằng chứng QA
  - H3: Mức sẵn sàng theo khu vực

## maturity/taxonomy.md

- Đường dẫn: /maturity/taxonomy
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

- Đường dẫn: /network
- Tiêu đề:
  - H2: Mô hình lõi
  - H2: Ghép nối + danh tính
  - H2: Khám phá + truyền tải
  - H2: Nút + truyền tải
  - H2: Bảo mật
  - H2: Liên quan

## nodes/audio.md

- Đường dẫn: /nodes/audio
- Tiêu đề:
  - H2: Những gì hoạt động
  - H2: Tự động phát hiện (mặc định)
  - H2: Ví dụ cấu hình
  - H3: Nhà cung cấp + dự phòng CLI (OpenAI + Whisper CLI)
  - H3: Chỉ nhà cung cấp với cổng phạm vi
  - H3: Chỉ nhà cung cấp (Deepgram)
  - H3: Chỉ nhà cung cấp (Mistral Voxtral)
  - H3: Chỉ nhà cung cấp (SenseAudio)
  - H3: Phản hồi bản ghi vào chat (tự chọn)
  - H2: Ghi chú và giới hạn
  - H3: Hỗ trợ môi trường proxy
  - H2: Phát hiện nhắc đến trong nhóm
  - H2: Điểm cần lưu ý
  - H2: Liên quan

## nodes/camera.md

- Đường dẫn: /nodes/camera
- Tiêu đề:
  - H2: Nút iOS
  - H3: Cài đặt người dùng (bật mặc định)
  - H3: Lệnh (qua Gateway node.invoke)
  - H3: Yêu cầu chạy ở tiền cảnh
  - H3: Trình trợ giúp CLI
  - H2: Nút Android
  - H3: Cài đặt người dùng Android (bật mặc định)
  - H3: Quyền
  - H3: Yêu cầu tiền cảnh của Android
  - H3: Lệnh Android (qua Gateway node.invoke)
  - H3: Bảo vệ payload
  - H2: Ứng dụng macOS
  - H3: Cài đặt người dùng (tắt mặc định)
  - H3: Trình trợ giúp CLI (node invoke)
  - H2: An toàn + giới hạn thực tế
  - H2: Video màn hình macOS (cấp hệ điều hành)
  - H2: Liên quan

## nodes/images.md

- Đường dẫn: /nodes/images
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Bề mặt CLI
  - H2: Hành vi kênh WhatsApp Web
  - H2: Đường ống tự động trả lời
  - H2: Phương tiện đến thành lệnh
  - H2: Giới hạn và lỗi
  - H2: Ghi chú cho kiểm thử
  - H2: Liên quan

## nodes/index.md

- Đường dẫn: /nodes
- Tiêu đề:
  - H2: Ghép nối + trạng thái
  - H2: Máy chủ nút từ xa (system.run)
  - H3: Cái gì chạy ở đâu
  - H3: Khởi động máy chủ nút (tiền cảnh)
  - H3: Gateway từ xa qua đường hầm SSH (gắn kết loopback)
  - H3: Khởi động máy chủ nút (dịch vụ)
  - H3: Ghép nối + đặt tên
  - H3: Thêm lệnh vào danh sách cho phép
  - H3: Trỏ exec đến nút
  - H3: Suy luận mô hình cục bộ
  - H2: Gọi lệnh
  - H2: Chính sách lệnh
  - H2: Cấu hình (openclaw.json)
  - H2: Ảnh chụp màn hình (ảnh chụp nhanh canvas)
  - H3: Điều khiển Canvas
  - H3: A2UI (Canvas)
  - H2: Ảnh + video (camera nút)
  - H2: Bản ghi màn hình (nút)
  - H2: Vị trí (nút)
  - H2: SMS (nút Android)
  - H2: Lệnh thiết bị Android + dữ liệu cá nhân
  - H2: Lệnh hệ thống (máy chủ nút / nút Mac)
  - H2: Gắn kết nút exec
  - H2: Bản đồ quyền
  - H2: Máy chủ nút không giao diện (đa nền tảng)
  - H2: Chế độ nút Mac

## nodes/location-command.md

- Đường dẫn: /nodes/location-command
- Tiêu đề:
  - H2: TL;DR
  - H2: Vì sao dùng bộ chọn (không chỉ là công tắc)
  - H2: Mô hình cài đặt
  - H2: Ánh xạ quyền (node.permissions)
  - H2: Lệnh: location.get
  - H2: Hành vi nền
  - H2: Tích hợp mô hình/công cụ
  - H2: Nội dung UX (đề xuất)
  - H2: Liên quan

## nodes/media-understanding.md

- Đường dẫn: /nodes/media-understanding
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

- Đường dẫn: /nodes/talk
- Tiêu đề:
  - H2: Hành vi (macOS)
  - H2: Chỉ thị giọng nói trong câu trả lời
  - H2: Cấu hình (/.openclaw/openclaw.json)
  - H2: Giao diện macOS
  - H2: Giao diện Android
  - H2: Ghi chú
  - H2: Liên quan

## nodes/troubleshooting.md

- Đường dẫn: /nodes/troubleshooting
- Tiêu đề:
  - H2: Thang lệnh
  - H2: Yêu cầu tiền cảnh
  - H2: Ma trận quyền
  - H2: Ghép nối so với phê duyệt
  - H2: Mã lỗi nút thường gặp
  - H2: Vòng lặp khôi phục nhanh
  - H2: Liên quan

## nodes/voicewake.md

- Đường dẫn: /nodes/voicewake
- Tiêu đề:
  - H2: Lưu trữ (máy chủ Gateway)
  - H2: Giao thức
  - H3: Phương thức
  - H3: Phương thức định tuyến (kích hoạt → mục tiêu)
  - H3: Sự kiện
  - H2: Hành vi máy khách
  - H3: Ứng dụng macOS
  - H3: Nút iOS
  - H3: Nút Android
  - H2: Liên quan

## openclaw-agent-runtime.md

- Đường dẫn: /openclaw-agent-runtime
- Tiêu đề:
  - H2: Kiểm tra kiểu và lint
  - H2: Chạy kiểm thử Agent Runtime
  - H2: Kiểm thử thủ công
  - H2: Đặt lại sạch
  - H2: Tham chiếu
  - H2: Liên quan

## perplexity.md

- Đường dẫn: /perplexity
- Tiêu đề:
  - H2: Liên quan

## plan/codex-context-engine-harness.md

- Đường dẫn: /plan/codex-context-engine-harness
- Tiêu đề:
  - H2: Trạng thái
  - H2: Mục tiêu
  - H2: Phi mục tiêu
  - H2: Kiến trúc hiện tại
  - H2: Khoảng trống hiện tại
  - H2: Hành vi mong muốn
  - H2: Ràng buộc thiết kế
  - H3: Máy chủ ứng dụng Codex vẫn là nguồn chính tắc cho trạng thái luồng gốc
  - H3: Việc lắp ráp context engine phải được chiếu vào đầu vào Codex
  - H3: Độ ổn định của bộ nhớ đệm prompt rất quan trọng
  - H3: Ngữ nghĩa chọn runtime không thay đổi
  - H2: Kế hoạch triển khai
  - H3: 1. Xuất hoặc di chuyển các helper thử context engine có thể tái sử dụng
  - H3: 2. Thêm helper chiếu ngữ cảnh Codex
  - H3: 3. Nối bootstrap trước khi khởi động luồng Codex
  - H3: 4. Nối assemble trước thread/start / thread/resume và turn/start
  - H3: 5. Giữ định dạng ổn định cho bộ nhớ đệm prompt
  - H3: 6. Nối post-turn sau khi phản chiếu bản ghi
  - H3: 7. Chuẩn hóa ngữ cảnh runtime cho mức sử dụng và bộ nhớ đệm prompt
  - H3: 8. Chính sách Compaction
  - H4: /compact và Compaction OpenClaw rõ ràng
  - H4: Sự kiện contextCompaction gốc của Codex trong lượt
  - H3: 9. Đặt lại phiên và hành vi gắn kết
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

- Đường dẫn: /plan/ui-channels
- Tiêu đề:
  - H2: Trạng thái
  - H2: Vấn đề
  - H2: Mục tiêu
  - H2: Phi mục tiêu
  - H2: Mô hình mục tiêu
  - H2: Siêu dữ liệu phân phối
  - H2: Hợp đồng khả năng runtime
  - H2: Ánh xạ kênh
  - H2: Các bước tái cấu trúc
  - H2: Kiểm thử
  - H2: Câu hỏi mở
  - H2: Liên quan

## platforms/android.md

- Đường dẫn: /platforms/android
- Tiêu đề:
  - H2: Ảnh chụp hỗ trợ
  - H2: Điều khiển hệ thống
  - H2: Runbook kết nối
  - H3: Điều kiện tiên quyết
  - H3: 1) Khởi động Gateway
  - H3: 2) Xác minh khám phá (tùy chọn)
  - H4: Khám phá Tailnet (Vienna ⇄ London) qua unicast DNS-SD
  - H3: 3) Kết nối từ Android
  - H3: Beacon báo hiện diện còn sống
  - H3: 4) Phê duyệt ghép nối (CLI)
  - H3: 5) Xác minh nút đã kết nối
  - H3: 6) Chat + lịch sử
  - H3: 7) Canvas + camera
  - H4: Máy chủ Gateway Canvas (được khuyến nghị cho nội dung web)
  - H3: 8) Giọng nói + bề mặt lệnh Android mở rộng
  - H2: Điểm vào trợ lý
  - H2: Chuyển tiếp thông báo
  - H2: Liên quan

## platforms/digitalocean.md

- Đường dẫn: /platforms/digitalocean
- Tiêu đề:
  - H2: Liên quan

## platforms/easyrunner.md

- Đường dẫn: /platforms/easyrunner
- Tiêu đề:
  - H2: Trước khi bắt đầu
  - H2: Ứng dụng Compose
  - H2: Cấu hình OpenClaw
  - H2: Xác minh
  - H2: Cập nhật và sao lưu
  - H2: Khắc phục sự cố

## platforms/index.md

- Đường dẫn: /platforms
- Tiêu đề:
  - H2: Chọn hệ điều hành của bạn
  - H2: VPS và lưu trữ
  - H2: Liên kết phổ biến
  - H2: Cài đặt dịch vụ Gateway (CLI)
  - H2: Liên quan

## platforms/ios.md

- Đường dẫn: /platforms/ios
- Tiêu đề:
  - H2: Chức năng
  - H2: Yêu cầu
  - H2: Bắt đầu nhanh (ghép nối + kết nối)
  - H2: Push được relay hỗ trợ cho bản dựng chính thức
  - H2: Beacon báo nền còn sống
  - H2: Luồng xác thực và tin cậy
  - H2: Đường dẫn khám phá
  - H3: Bonjour (LAN)
  - H3: Tailnet (liên mạng)
  - H3: Máy chủ/cổng thủ công
  - H2: Canvas + A2UI
  - H2: Quan hệ với Computer Use
  - H3: Đánh giá / ảnh chụp nhanh Canvas
  - H2: Đánh thức bằng giọng nói + chế độ nói
  - H2: Lỗi thường gặp
  - H2: Tài liệu liên quan

## platforms/linux.md

- Đường dẫn: /platforms/linux
- Tiêu đề:
  - H2: Đường dẫn nhanh cho người mới bắt đầu (VPS)
  - H2: Cài đặt
  - H2: Gateway
  - H2: Cài đặt dịch vụ Gateway (CLI)
  - H2: Điều khiển hệ thống (systemd user unit)
  - H2: Áp lực bộ nhớ và OOM kill
  - H2: Liên quan

## platforms/mac/bundled-gateway.md

- Đường dẫn: /platforms/mac/bundled-gateway
- Tiêu đề:
  - H2: Cài đặt CLI (bắt buộc cho chế độ cục bộ)
  - H2: Launchd (Gateway dưới dạng LaunchAgent)
  - H2: Tương thích phiên bản
  - H2: Thư mục trạng thái trên macOS
  - H2: Gỡ lỗi kết nối ứng dụng
  - H2: Kiểm tra smoke
  - H2: Liên quan

## platforms/mac/canvas.md

- Đường dẫn: /platforms/mac/canvas
- Tiêu đề:
  - H2: Nơi Canvas tồn tại
  - H2: Hành vi bảng điều khiển
  - H2: Bề mặt API tác nhân
  - H2: A2UI trong Canvas
  - H3: Lệnh A2UI (v0.8)
  - H2: Kích hoạt lượt chạy tác nhân từ Canvas
  - H2: Ghi chú bảo mật
  - H2: Liên quan

## platforms/mac/child-process.md

- Đường dẫn: /platforms/mac/child-process
- Tiêu đề:
  - H2: Hành vi mặc định (launchd)
  - H2: Bản dựng phát triển chưa ký
  - H2: Chế độ chỉ đính kèm
  - H2: Chế độ từ xa
  - H2: Vì sao chúng tôi ưu tiên launchd
  - H2: Liên quan

## platforms/mac/dev-setup.md

- Tuyến: /platforms/mac/dev-setup
- Tiêu đề:
  - H1: Thiết lập nhà phát triển macOS
  - H2: Điều kiện tiên quyết
  - H2: 1. Cài đặt phụ thuộc
  - H2: 2. Xây dựng và đóng gói ứng dụng
  - H2: 3. Cài đặt CLI
  - H2: Khắc phục sự cố
  - H3: Bản dựng thất bại: toolchain hoặc SDK không khớp
  - H3: Ứng dụng gặp sự cố khi cấp quyền
  - H3: Gateway "Đang khởi động..." vô thời hạn
  - H2: Liên quan

## platforms/mac/health.md

- Tuyến: /platforms/mac/health
- Tiêu đề:
  - H1: Kiểm tra sức khỏe trên macOS
  - H2: Thanh menu
  - H2: Cài đặt
  - H2: Cách probe hoạt động
  - H2: Khi không chắc chắn
  - H2: Liên quan

## platforms/mac/icon.md

- Tuyến: /platforms/mac/icon
- Tiêu đề:
  - H1: Trạng thái biểu tượng thanh menu
  - H2: Liên quan

## platforms/mac/logging.md

- Tuyến: /platforms/mac/logging
- Tiêu đề:
  - H1: Ghi nhật ký (macOS)
  - H2: Nhật ký tệp chẩn đoán xoay vòng (ngăn Debug)
  - H2: Dữ liệu riêng tư của unified logging trên macOS
  - H2: Bật cho OpenClaw (ai.openclaw)
  - H2: Tắt sau khi gỡ lỗi
  - H2: Liên quan

## platforms/mac/menu-bar.md

- Tuyến: /platforms/mac/menu-bar
- Tiêu đề:
  - H2: Nội dung được hiển thị
  - H2: Mô hình trạng thái
  - H2: Enum IconState (Swift)
  - H3: ActivityKind → glyph
  - H3: Ánh xạ trực quan
  - H2: Menu con ngữ cảnh
  - H2: Văn bản hàng trạng thái (menu)
  - H2: Nạp sự kiện
  - H2: Ghi đè gỡ lỗi
  - H2: Danh sách kiểm tra thử nghiệm
  - H2: Liên quan

## platforms/mac/peekaboo.md

- Tuyến: /platforms/mac/peekaboo
- Tiêu đề:
  - H2: Đây là gì (và không phải gì)
  - H2: Quan hệ với Computer Use
  - H2: Bật cầu nối
  - H2: Thứ tự khám phá client
  - H2: Bảo mật và quyền
  - H2: Hành vi snapshot (tự động hóa)
  - H2: Khắc phục sự cố
  - H2: Liên quan

## platforms/mac/permissions.md

- Tuyến: /platforms/mac/permissions
- Tiêu đề:
  - H2: Yêu cầu để quyền ổn định
  - H2: Cấp quyền Accessibility cho runtime Node và CLI
  - H2: Danh sách kiểm tra khôi phục khi lời nhắc biến mất
  - H2: Quyền tệp và thư mục (Desktop/Documents/Downloads)
  - H2: Liên quan

## platforms/mac/remote.md

- Tuyến: /platforms/mac/remote
- Tiêu đề:
  - H2: Chế độ
  - H2: Giao vận từ xa
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

- Tuyến: /platforms/mac/signing
- Tiêu đề:
  - H1: Ký mac (bản dựng debug)
  - H2: Cách sử dụng
  - H3: Ghi chú ký ad-hoc
  - H2: Siêu dữ liệu bản dựng cho phần Giới thiệu
  - H2: Lý do
  - H2: Liên quan

## platforms/mac/skills.md

- Tuyến: /platforms/mac/skills
- Tiêu đề:
  - H2: Nguồn dữ liệu
  - H2: Hành động cài đặt
  - H2: Khóa env/API
  - H2: Chế độ từ xa
  - H2: Liên quan

## platforms/mac/voice-overlay.md

- Tuyến: /platforms/mac/voice-overlay
- Tiêu đề:
  - H1: Vòng đời Voice Overlay (macOS)
  - H2: Ý định hiện tại
  - H2: Đã triển khai (9 tháng 12, 2025)
  - H2: Các bước tiếp theo
  - H2: Danh sách kiểm tra gỡ lỗi
  - H2: Các bước di chuyển (đề xuất)
  - H2: Liên quan

## platforms/mac/voicewake.md

- Tuyến: /platforms/mac/voicewake
- Tiêu đề:
  - H1: Voice Wake &amp; Push-to-Talk
  - H2: Yêu cầu
  - H2: Chế độ
  - H2: Hành vi runtime (wake-word)
  - H2: Bất biến vòng đời
  - H2: Chế độ lỗi overlay dính (trước đây)
  - H2: Chi tiết riêng của push-to-talk
  - H2: Cài đặt hiển thị cho người dùng
  - H2: Hành vi chuyển tiếp
  - H2: Payload chuyển tiếp
  - H2: Xác minh nhanh
  - H2: Liên quan

## platforms/mac/webchat.md

- Tuyến: /platforms/mac/webchat
- Tiêu đề:
  - H2: Khởi chạy và gỡ lỗi
  - H2: Cách nó được nối dây
  - H2: Bề mặt bảo mật
  - H2: Hạn chế đã biết
  - H2: Liên quan

## platforms/mac/xpc.md

- Tuyến: /platforms/mac/xpc
- Tiêu đề:
  - H1: Kiến trúc IPC macOS của OpenClaw
  - H2: Mục tiêu
  - H2: Cách hoạt động
  - H3: Gateway + giao vận node
  - H3: Dịch vụ Node + IPC ứng dụng
  - H3: PeekabooBridge (tự động hóa UI)
  - H2: Luồng vận hành
  - H2: Ghi chú gia cố
  - H2: Liên quan

## platforms/macos.md

- Tuyến: /platforms/macos
- Tiêu đề:
  - H2: Tải xuống
  - H2: Lần chạy đầu tiên
  - H2: Chọn chế độ Gateway
  - H2: Ứng dụng sở hữu những gì
  - H2: Trang chi tiết macOS
  - H2: Liên quan

## platforms/oracle.md

- Tuyến: /platforms/oracle
- Tiêu đề:
  - H2: Liên quan

## platforms/raspberry-pi.md

- Tuyến: /platforms/raspberry-pi
- Tiêu đề:
  - H2: Liên quan

## platforms/windows.md

- Tuyến: /platforms/windows
- Tiêu đề:
  - H2: Khuyến nghị: Windows Hub
  - H3: Windows Hub bao gồm những gì
  - H3: Lần khởi chạy đầu tiên
  - H2: Chế độ node Windows
  - H2: Chế độ MCP cục bộ
  - H2: CLI và Gateway Windows gốc
  - H2: WSL2 Gateway
  - H2: Tự động khởi động Gateway trước khi đăng nhập Windows
  - H2: Phơi bày dịch vụ WSL qua LAN
  - H2: Khắc phục sự cố
  - H3: Biểu tượng khay không xuất hiện
  - H3: Thiết lập cục bộ thất bại
  - H3: Ứng dụng báo cần ghép nối
  - H3: Web chat không thể truy cập Gateway từ xa
  - H3: Lệnh screen.snapshot, camera hoặc audio thất bại
  - H3: Kết nối Git hoặc GitHub thất bại
  - H2: Liên quan

## plugins/adding-capabilities.md

- Tuyến: /plugins/adding-capabilities
- Tiêu đề:
  - H2: Khi nào tạo capability
  - H2: Trình tự chuẩn
  - H2: Nội dung đặt ở đâu
  - H2: Provider và đường ranh harness
  - H2: Danh sách kiểm tra tệp
  - H2: Ví dụ hoàn chỉnh: tạo ảnh
  - H2: Provider embedding
  - H2: Danh sách kiểm tra review
  - H2: Liên quan

## plugins/admin-http-rpc.md

- Tuyến: /plugins/admin-http-rpc
- Tiêu đề:
  - H2: Trước khi bật
  - H2: Bật
  - H2: Xác minh route
  - H2: Xác thực
  - H2: Mô hình bảo mật
  - H2: Yêu cầu
  - H2: Phản hồi
  - H2: Phương thức được phép
  - H2: So sánh WebSocket
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/agent-tools.md

- Tuyến: /plugins/agent-tools
- Tiêu đề:
  - H2: Liên quan

## plugins/architecture-internals.md

- Tuyến: /plugins/architecture-internals
- Tiêu đề:
  - H2: Pipeline tải
  - H3: Hành vi ưu tiên manifest
  - H3: Ranh giới bộ nhớ đệm Plugin
  - H2: Mô hình registry
  - H2: Callback liên kết hội thoại
  - H2: Hook runtime của provider
  - H3: Thứ tự và cách dùng hook
  - H3: Ví dụ provider
  - H3: Ví dụ tích hợp sẵn
  - H2: Helper runtime
  - H3: api.runtime.imageGeneration
  - H2: Route HTTP của Gateway
  - H2: Đường dẫn import Plugin SDK
  - H2: Schema công cụ nhắn tin
  - H2: Phân giải đích kênh
  - H2: Thư mục dựa trên cấu hình
  - H2: Catalog provider
  - H2: Kiểm tra kênh chỉ đọc
  - H2: Gói package
  - H3: Siêu dữ liệu catalog kênh
  - H2: Plugin engine ngữ cảnh
  - H2: Thêm capability mới
  - H3: Danh sách kiểm tra capability
  - H3: Mẫu capability
  - H2: Liên quan

## plugins/architecture.md

- Tuyến: /plugins/architecture
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
  - H2: Nội bộ và tài liệu tham khảo
  - H2: Liên quan

## plugins/building-extensions.md

- Tuyến: /plugins/building-extensions
- Tiêu đề:
  - H2: Liên quan

## plugins/building-plugins.md

- Tuyến: /plugins/building-plugins
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Chọn hình dạng plugin
  - H2: Quickstart
  - H2: Đăng ký công cụ
  - H2: Quy ước import
  - H2: Danh sách kiểm tra trước khi gửi
  - H2: Thử nghiệm với bản beta
  - H2: Các bước tiếp theo
  - H2: Liên quan

## plugins/bundles.md

- Tuyến: /plugins/bundles
- Tiêu đề:
  - H2: Vì sao bundle tồn tại
  - H2: Cài đặt bundle
  - H2: OpenClaw ánh xạ gì từ bundle
  - H3: Được hỗ trợ hiện nay
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

- Tuyến: /plugins/cli-backend-plugins
- Tiêu đề:
  - H2: Plugin sở hữu những gì
  - H2: Plugin backend tối thiểu
  - H2: Hình dạng cấu hình
  - H2: Hook backend nâng cao
  - H3: ownsNativeCompaction: chọn không dùng compaction của OpenClaw
  - H2: Cầu nối công cụ MCP
  - H2: Cấu hình người dùng
  - H2: Xác minh
  - H2: Danh sách kiểm tra
  - H2: Liên quan

## plugins/codex-computer-use.md

- Tuyến: /plugins/codex-computer-use
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

- Tuyến: /plugins/codex-harness-reference
- Tiêu đề:
  - H2: Bề mặt cấu hình Plugin
  - H2: Giao vận app-server
  - H2: Chế độ phê duyệt và sandbox
  - H2: Thực thi native trong sandbox
  - H2: Cô lập xác thực và môi trường
  - H2: Công cụ động
  - H2: Timeout
  - H2: Khám phá model
  - H2: Tệp bootstrap workspace
  - H2: Ghi đè môi trường
  - H2: Liên quan

## plugins/codex-harness-runtime.md

- Tuyến: /plugins/codex-harness-runtime
- Tiêu đề:
  - H2: Tổng quan
  - H2: Liên kết thread và thay đổi model
  - H2: Trả lời hiển thị và heartbeat
  - H2: Ranh giới hook
  - H2: Hợp đồng hỗ trợ V1
  - H2: Quyền native và elicitation MCP
  - H2: Điều hướng hàng đợi
  - H2: Tải phản hồi Codex lên
  - H2: Compaction và bản sao transcript
  - H2: Media và gửi đi
  - H2: Liên quan

## plugins/codex-harness.md

- Tuyến: /plugins/codex-harness
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Quickstart
  - H2: Cấu hình
  - H2: Xác minh runtime Codex
  - H2: Routing và chọn model
  - H2: Mẫu triển khai
  - H3: Triển khai Codex cơ bản
  - H3: Triển khai provider hỗn hợp
  - H3: Triển khai Codex fail-closed
  - H2: Chính sách app-server
  - H2: Lệnh và chẩn đoán
  - H3: Kiểm tra thread Codex cục bộ
  - H2: Plugin Codex native
  - H2: Computer Use
  - H2: Ranh giới runtime
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/codex-native-plugins.md

- Tuyến: /plugins/codex-native-plugins
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Quickstart
  - H2: Quản lý plugin từ chat
  - H2: Cách thiết lập Plugin native hoạt động
  - H2: Ranh giới hỗ trợ V1
  - H2: Kho ứng dụng và quyền sở hữu
  - H2: Cấu hình ứng dụng thread
  - H2: Chính sách hành động phá hủy
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/community.md

- Tuyến: /plugins/community
- Tiêu đề:
  - H2: Tìm Plugin
  - H2: Xuất bản Plugin
  - H2: Liên quan

## plugins/compatibility.md

- Tuyến: /plugins/compatibility
- Tiêu đề:
  - H2: Registry tương thích
  - H2: Package kiểm tra Plugin
  - H3: Lane chấp nhận của maintainer
  - H2: Chính sách ngừng hỗ trợ
  - H2: Khu vực tương thích hiện tại
  - H3: Alias phẳng cho callback inbound WhatsApp
  - H3: Trường admission inbound WhatsApp
  - H2: Ghi chú phát hành

## plugins/copilot.md

- Tuyến: /plugins/copilot
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Cài đặt Plugin
  - H2: Quickstart
  - H2: Provider được hỗ trợ
  - H2: BYOK
  - H2: Xác thực
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

- Tuyến: /plugins/dependency-resolution
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
  - H2: Phương thức vận chuyển
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth và kiểm tra sơ bộ
  - H3: Tạo thông tin xác thực Google
  - H3: Tạo refresh token
  - H3: Xác minh OAuth bằng doctor
  - H2: Cấu hình
  - H2: Công cụ
  - H2: Chế độ tác tử và bidi
  - H2: Danh sách kiểm tra kiểm thử trực tiếp
  - H2: Khắc phục sự cố
  - H3: Tác tử không thấy công cụ Google Meet
  - H3: Không có Node hỗ trợ Google Meet nào được kết nối
  - H3: Trình duyệt mở nhưng tác tử không thể tham gia
  - H3: Tạo cuộc họp thất bại
  - H3: Tác tử tham gia nhưng không nói
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
  - H3: Phần mở rộng phiên và chèn lượt tiếp theo
  - H2: Hook tin nhắn
  - H2: Hook cài đặt
  - H2: Vòng đời Gateway
  - H2: Các mục sắp ngừng hỗ trợ
  - H2: Liên quan

## plugins/install-overrides.md

- Tuyến: /plugins/install-overrides
- Tiêu đề:
  - H2: Môi trường
  - H2: Hành vi
  - H2: E2E gói

## plugins/llama-cpp.md

- Tuyến: /plugins/llama-cpp
- Tiêu đề:
  - H2: Cấu hình
  - H2: Runtime gốc

## plugins/manage-plugins.md

- Tuyến: /plugins/manage-plugins
- Tiêu đề:
  - H2: Liệt kê và tìm kiếm Plugin
  - H2: Cài đặt Plugin
  - H2: Khởi động lại và kiểm tra
  - H2: Cập nhật Plugin
  - H2: Gỡ cài đặt Plugin
  - H2: Chọn nguồn
  - H2: Xuất bản Plugin
  - H2: Liên quan

## plugins/manifest.md

- Tuyến: /plugins/manifest
- Tiêu đề:
  - H2: Tệp này làm gì
  - H2: Ví dụ tối thiểu
  - H2: Ví dụ đầy đủ
  - H2: Tham chiếu trường cấp cao nhất
  - H2: Tham chiếu metadata nhà cung cấp tạo sinh
  - H2: Tham chiếu metadata công cụ
  - H2: Tham chiếu providerAuthChoices
  - H2: Tham chiếu commandAliases
  - H2: Tham chiếu activation
  - H2: Tham chiếu qaRunners
  - H2: Tham chiếu setup
  - H3: Tham chiếu setup.providers
  - H3: Trường setup
  - H2: Tham chiếu uiHints
  - H2: Tham chiếu contracts
  - H2: Tham chiếu mediaUnderstandingProviderMetadata
  - H2: Tham chiếu channelConfigs
  - H3: Thay thế một Plugin kênh khác
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
  - H2: Thứ tự ưu tiên khám phá (id Plugin trùng lặp)
  - H2: Yêu cầu JSON Schema
  - H2: Hành vi xác thực
  - H2: Ghi chú
  - H2: Liên quan

## plugins/memory-lancedb.md

- Tuyến: /plugins/memory-lancedb
- Tiêu đề:
  - H2: Cài đặt
  - H2: Bắt đầu nhanh
  - H2: Embedding do nhà cung cấp hỗ trợ
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
  - H2: Mẫu kết hợp được khuyến nghị
  - H2: Chế độ vault
  - H3: isolated
  - H3: bridge
  - H3: unsafe-local
  - H2: Bố cục vault
  - H2: Nhập Open Knowledge Format
  - H2: Khẳng định có cấu trúc và bằng chứng
  - H2: Metadata thực thể dành cho tác tử
  - H2: Quy trình biên dịch
  - H2: Dashboard và báo cáo sức khỏe
  - H2: Tìm kiếm và truy xuất
  - H2: Công cụ tác tử
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
  - H2: Danh sách kiểm tra cho tác giả Plugin
  - H2: Tài liệu liên quan

## plugins/oc-path.md

- Tuyến: /plugins/oc-path
- Tiêu đề:
  - H2: Vì sao bật nó
  - H2: Nơi nó chạy
  - H2: Bật
  - H2: Phụ thuộc
  - H2: Nội dung nó cung cấp
  - H2: Quan hệ với các Plugin khác
  - H2: An toàn
  - H2: Liên quan

## plugins/plugin-inventory.md

- Tuyến: /plugins/plugin-inventory
- Tiêu đề:
  - H1: Kho Plugin
  - H2: Định nghĩa
  - H2: Cài đặt một Plugin
  - H2: Gói npm lõi
  - H2: Gói bên ngoài chính thức
  - H2: Chỉ checkout nguồn

## plugins/plugin-permission-requests.md

- Tuyến: /plugins/plugin-permission-requests
- Tiêu đề:
  - H2: Chọn cổng phù hợp
  - H2: Yêu cầu phê duyệt trước khi gọi công cụ
  - H2: Hành vi quyết định
  - H2: Định tuyến prompt phê duyệt
  - H2: Quyền gốc Codex
  - H2: Khắc phục sự cố
  - H2: Liên quan

## plugins/reference.md

- Tuyến: /plugins/reference
- Tiêu đề:
  - H1: Tham chiếu Plugin

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
  - H2: Danh sách phiên

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
  - H2: Ngôn ngữ đã thêm

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
- Tiêu đề:
  - H1: Plugin Firecrawl
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/fireworks.md

- Tuyến: /plugins/reference/fireworks
- Tiêu đề:
  - H1: Plugin Fireworks
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/github-copilot.md

- Tuyến: /plugins/reference/github-copilot
- Tiêu đề:
  - H1: Plugin GitHub Copilot
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/gmi.md

- Tuyến: /plugins/reference/gmi
- Tiêu đề:
  - H1: Plugin Gmi
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/google-meet.md

- Tuyến: /plugins/reference/google-meet
- Tiêu đề:
  - H1: Plugin Google Meet
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/google.md

- Tuyến: /plugins/reference/google
- Tiêu đề:
  - H1: Plugin Google
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/googlechat.md

- Tuyến: /plugins/reference/googlechat
- Tiêu đề:
  - H1: Plugin Google Chat
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/gradium.md

- Tuyến: /plugins/reference/gradium
- Tiêu đề:
  - H1: Plugin Gradium
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/groq.md

- Tuyến: /plugins/reference/groq
- Tiêu đề:
  - H1: Plugin Groq
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/huggingface.md

- Tuyến: /plugins/reference/huggingface
- Tiêu đề:
  - H1: Plugin Hugging Face
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/imessage.md

- Tuyến: /plugins/reference/imessage
- Tiêu đề:
  - H1: Plugin iMessage
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/inworld.md

- Tuyến: /plugins/reference/inworld
- Tiêu đề:
  - H1: Plugin Inworld
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/irc.md

- Tuyến: /plugins/reference/irc
- Tiêu đề:
  - H1: Plugin IRC
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/kilocode.md

- Tuyến: /plugins/reference/kilocode
- Tiêu đề:
  - H1: Plugin Kilocode
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/kimi.md

- Tuyến: /plugins/reference/kimi
- Tiêu đề:
  - H1: Plugin Kimi
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/line.md

- Tuyến: /plugins/reference/line
- Tiêu đề:
  - H1: Plugin LINE
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/litellm.md

- Tuyến: /plugins/reference/litellm
- Tiêu đề:
  - H1: Plugin LiteLLM
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/llama-cpp.md

- Tuyến: /plugins/reference/llama-cpp
- Tiêu đề:
  - H1: Plugin Llama Cpp
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/llm-task.md

- Tuyến: /plugins/reference/llm-task
- Tiêu đề:
  - H1: Plugin LLM Task
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/lmstudio.md

- Tuyến: /plugins/reference/lmstudio
- Tiêu đề:
  - H1: Plugin LM Studio
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/lobster.md

- Tuyến: /plugins/reference/lobster
- Tiêu đề:
  - H1: Plugin Lobster
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/matrix.md

- Tuyến: /plugins/reference/matrix
- Tiêu đề:
  - H1: Plugin Matrix
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/mattermost.md

- Tuyến: /plugins/reference/mattermost
- Tiêu đề:
  - H1: Plugin Mattermost
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/memory-core.md

- Tuyến: /plugins/reference/memory-core
- Tiêu đề:
  - H1: Plugin Memory Core
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/memory-lancedb.md

- Tuyến: /plugins/reference/memory-lancedb
- Tiêu đề:
  - H1: Plugin Memory Lancedb
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/memory-wiki.md

- Tuyến: /plugins/reference/memory-wiki
- Tiêu đề:
  - H1: Plugin Memory Wiki
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/microsoft-foundry.md

- Tuyến: /plugins/reference/microsoft-foundry
- Tiêu đề:
  - H1: Plugin Microsoft Foundry
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Yêu cầu
  - H2: Mô hình trò chuyện
  - H2: Tạo hình ảnh MAI
  - H2: Khắc phục sự cố

## plugins/reference/microsoft.md

- Tuyến: /plugins/reference/microsoft
- Tiêu đề:
  - H1: Plugin Microsoft
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/migrate-claude.md

- Tuyến: /plugins/reference/migrate-claude
- Tiêu đề:
  - H1: Plugin Migrate Claude
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/migrate-hermes.md

- Tuyến: /plugins/reference/migrate-hermes
- Tiêu đề:
  - H1: Plugin Migrate Hermes
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/minimax.md

- Tuyến: /plugins/reference/minimax
- Tiêu đề:
  - H1: Plugin MiniMax
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/mistral.md

- Tuyến: /plugins/reference/mistral
- Tiêu đề:
  - H1: Plugin Mistral
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/moonshot.md

- Tuyến: /plugins/reference/moonshot
- Tiêu đề:
  - H1: Plugin Moonshot
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/msteams.md

- Tuyến: /plugins/reference/msteams
- Tiêu đề:
  - H1: Plugin Microsoft Teams
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/nextcloud-talk.md

- Tuyến: /plugins/reference/nextcloud-talk
- Tiêu đề:
  - H1: Plugin Nextcloud Talk
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/nostr.md

- Tuyến: /plugins/reference/nostr
- Tiêu đề:
  - H1: Plugin Nostr
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/novita.md

- Tuyến: /plugins/reference/novita
- Tiêu đề:
  - H1: Plugin Novita
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/nvidia.md

- Tuyến: /plugins/reference/nvidia
- Tiêu đề:
  - H1: Plugin NVIDIA
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/oc-path.md

- Tuyến: /plugins/reference/oc-path
- Tiêu đề:
  - H1: Plugin Oc Path
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/ollama.md

- Tuyến: /plugins/reference/ollama
- Tiêu đề:
  - H1: Plugin Ollama
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/open-prose.md

- Tuyến: /plugins/reference/open-prose
- Tiêu đề:
  - H1: Plugin Open Prose
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/openai.md

- Tuyến: /plugins/reference/openai
- Tiêu đề:
  - H1: Plugin OpenAI
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/opencode-go.md

- Tuyến: /plugins/reference/opencode-go
- Tiêu đề:
  - H1: Plugin OpenCode Go
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/opencode.md

- Tuyến: /plugins/reference/opencode
- Tiêu đề:
  - H1: Plugin OpenCode
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/openrouter.md

- Tuyến: /plugins/reference/openrouter
- Tiêu đề:
  - H1: Plugin OpenRouter
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/openshell.md

- Tuyến: /plugins/reference/openshell
- Tiêu đề:
  - H1: Plugin Openshell
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/perplexity.md

- Tuyến: /plugins/reference/perplexity
- Tiêu đề:
  - H1: Plugin Perplexity
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/pixverse.md

- Tuyến: /plugins/reference/pixverse
- Tiêu đề:
  - H1: Plugin PixVerse
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/policy.md

- Tuyến: /plugins/reference/policy
- Tiêu đề:
  - H1: Plugin Policy
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Hành vi
  - H2: Tài liệu liên quan

## plugins/reference/qa-channel.md

- Tuyến: /plugins/reference/qa-channel
- Tiêu đề:
  - H1: Plugin QA Channel
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/qa-lab.md

- Tuyến: /plugins/reference/qa-lab
- Tiêu đề:
  - H1: Plugin QA Lab
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/qa-matrix.md

- Tuyến: /plugins/reference/qa-matrix
- Tiêu đề:
  - H1: Plugin QA Matrix
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/qianfan.md

- Tuyến: /plugins/reference/qianfan
- Tiêu đề:
  - H1: Plugin Qianfan
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/qqbot.md

- Tuyến: /plugins/reference/qqbot
- Tiêu đề:
  - H1: Plugin QQ Bot
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/qwen.md

- Tuyến: /plugins/reference/qwen
- Tiêu đề:
  - H1: Plugin Qwen
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/raft.md

- Tuyến: /plugins/reference/raft
- Tiêu đề:
  - H1: Plugin Raft
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/runway.md

- Tuyến: /plugins/reference/runway
- Tiêu đề:
  - H1: Plugin Runway
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/searxng.md

- Tuyến: /plugins/reference/searxng
- Tiêu đề:
  - H1: Plugin SearXNG
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/senseaudio.md

- Tuyến: /plugins/reference/senseaudio
- Tiêu đề:
  - H1: Plugin Senseaudio
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/sglang.md

- Tuyến: /plugins/reference/sglang
- Tiêu đề:
  - H1: Plugin SGLang
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/signal.md

- Tuyến: /plugins/reference/signal
- Tiêu đề:
  - H1: Plugin Signal
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/slack.md

- Tuyến: /plugins/reference/slack
- Tiêu đề:
  - H1: Plugin Slack
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/sms.md

- Tuyến: /plugins/reference/sms
- Tiêu đề:
  - H1: Plugin Sms
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/stepfun.md

- Tuyến: /plugins/reference/stepfun
- Tiêu đề:
  - H1: Plugin StepFun
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/synology-chat.md

- Tuyến: /plugins/reference/synology-chat
- Tiêu đề:
  - H1: Plugin Synology Chat
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/synthetic.md

- Tuyến: /plugins/reference/synthetic
- Tiêu đề:
  - H1: Plugin Synthetic
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/tavily.md

- Tuyến: /plugins/reference/tavily
- Tiêu đề:
  - H1: Plugin Tavily
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/telegram.md

- Tuyến: /plugins/reference/telegram
- Tiêu đề:
  - H1: Plugin Telegram
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/tencent.md

- Tuyến: /plugins/reference/tencent
- Tiêu đề:
  - H1: Plugin Tencent
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/tlon.md

- Tuyến: /plugins/reference/tlon
- Tiêu đề:
  - H1: Plugin Tlon
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/together.md

- Tuyến: /plugins/reference/together
- Tiêu đề:
  - H1: Plugin Together
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/tokenjuice.md

- Tuyến: /plugins/reference/tokenjuice
- Tiêu đề:
  - H1: Plugin Tokenjuice
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/tts-local-cli.md

- Tuyến: /plugins/reference/tts-local-cli
- Tiêu đề:
  - H1: Plugin TTS Local CLI
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/twitch.md

- Tuyến: /plugins/reference/twitch
- Tiêu đề:
  - H1: Plugin Twitch
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/venice.md

- Tuyến: /plugins/reference/venice
- Tiêu đề:
  - H1: Plugin Venice
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/vercel-ai-gateway.md

- Tuyến: /plugins/reference/vercel-ai-gateway
- Tiêu đề:
  - H1: Plugin Vercel AI Gateway
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/vllm.md

- Tuyến: /plugins/reference/vllm
- Tiêu đề:
  - H1: Plugin vLLM
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/voice-call.md

- Tuyến: /plugins/reference/voice-call
- Tiêu đề:
  - H1: Plugin Voice Call
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/volcengine.md

- Tuyến: /plugins/reference/volcengine
- Tiêu đề:
  - H1: Plugin Volcengine
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/voyage.md

- Tuyến: /plugins/reference/voyage
- Tiêu đề:
  - H1: Plugin Voyage
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/vydra.md

- Tuyến: /plugins/reference/vydra
- Tiêu đề:
  - H1: Plugin Vydra
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/web-readability.md

- Tuyến: /plugins/reference/web-readability
- Tiêu đề:
  - H1: Plugin Web Readability
  - H2: Phân phối
  - H2: Bề mặt

## plugins/reference/webhooks.md

- Tuyến: /plugins/reference/webhooks
- Tiêu đề:
  - H1: Plugin Webhooks
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/whatsapp.md

- Tuyến: /plugins/reference/whatsapp
- Tiêu đề:
  - H1: Plugin WhatsApp
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/workboard.md

- Tuyến: /plugins/reference/workboard
- Tiêu đề:
  - H1: Plugin Workboard
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/xai.md

- Tuyến: /plugins/reference/xai
- Tiêu đề:
  - H1: Plugin xAI
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/xiaomi.md

- Tuyến: /plugins/reference/xiaomi
- Tiêu đề:
  - H1: Plugin Xiaomi
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/zai.md

- Tuyến: /plugins/reference/zai
- Tiêu đề:
  - H1: Plugin Z.AI
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/zalo.md

- Tuyến: /plugins/reference/zalo
- Tiêu đề:
  - H1: Plugin Zalo
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/reference/zalouser.md

- Tuyến: /plugins/reference/zalouser
- Tiêu đề:
  - H1: Plugin Zalo Personal
  - H2: Phân phối
  - H2: Bề mặt
  - H2: Tài liệu liên quan

## plugins/sdk-agent-harness.md

- Tuyến: /plugins/sdk-agent-harness
- Tiêu đề:
  - H2: Khi nào dùng harness
  - H2: Phần core vẫn sở hữu
  - H2: Đăng ký harness
  - H2: Chính sách lựa chọn
  - H2: Ghép cặp nhà cung cấp và harness
  - H3: Middleware kết quả công cụ
  - H3: Phân loại kết quả terminal
  - H3: Tác dụng phụ ở cuối agent
  - H3: Đầu vào người dùng và bề mặt công cụ
  - H3: Chế độ harness Codex native
  - H2: Độ nghiêm ngặt của runtime
  - H2: Phiên native và bản sao transcript
  - H2: Kết quả công cụ và phương tiện
  - H2: Giới hạn hiện tại
  - H2: Liên quan

## plugins/sdk-channel-inbound.md

- Tuyến: /plugins/sdk-channel-inbound
- Tiêu đề:
  - H2: Trình trợ giúp core
  - H2: Di chuyển

## plugins/sdk-channel-ingress.md

- Tuyến: /plugins/sdk-channel-ingress
- Tiêu đề:
  - H1: API nhận vào của kênh
  - H2: Bộ phân giải runtime
  - H2: Kết quả
  - H2: Nhóm truy cập
  - H2: Chế độ sự kiện
  - H2: Tuyến và kích hoạt
  - H2: Biên tập che giấu
  - H2: Xác minh

## plugins/sdk-channel-message.md

- Tuyến: /plugins/sdk-channel-message
- Tiêu đề: không có

## plugins/sdk-channel-outbound.md

- Tuyến: /plugins/sdk-channel-outbound
- Tiêu đề:
  - H2: Bộ chuyển đổi
  - H2: Bộ chuyển đổi gửi ra hiện có
  - H2: Gửi bền vững
  - H2: Điều phối tương thích

## plugins/sdk-channel-plugins.md

- Tuyến: /plugins/sdk-channel-plugins
- Tiêu đề:
  - H2: Cách Plugin kênh hoạt động
  - H2: Phê duyệt và khả năng của kênh
  - H2: Chính sách đề cập nhận vào
  - H2: Hướng dẫn từng bước
  - H2: Cấu trúc tệp
  - H2: Chủ đề nâng cao
  - H2: Bước tiếp theo
  - H2: Liên quan

## plugins/sdk-channel-turn.md

- Tuyến: /plugins/sdk-channel-turn
- Tiêu đề: không có

## plugins/sdk-entrypoints.md

- Tuyến: /plugins/sdk-entrypoints
- Tiêu đề:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Chế độ đăng ký
  - H2: Hình dạng Plugin
  - H2: Liên quan

## plugins/sdk-migration.md

- Tuyến: /plugins/sdk-migration
- Tiêu đề:
  - H2: Nội dung đang thay đổi
  - H2: Vì sao thay đổi này được thực hiện
  - H2: Kế hoạch di chuyển thoại nói chuyện và thời gian thực
  - H2: Chính sách tương thích
  - H2: Cách di chuyển
  - H2: Tham chiếu đường dẫn import
  - H2: Các mục ngừng dùng đang hoạt động
  - H2: Mốc thời gian loại bỏ
  - H2: Tạm thời tắt cảnh báo
  - H2: Liên quan

## plugins/sdk-overview.md

- Tuyến: /plugins/sdk-overview
- Tiêu đề:
  - H2: Quy ước import
  - H2: Tham chiếu đường dẫn con
  - H2: API đăng ký
  - H3: Đăng ký khả năng
  - H3: Công cụ và lệnh
  - H3: Hạ tầng
  - H3: Hook host cho Plugin quy trình
  - H3: Đăng ký khám phá Gateway
  - H3: Siêu dữ liệu đăng ký CLI
  - H3: Đăng ký backend CLI
  - H3: Slot độc quyền
  - H3: Bộ chuyển đổi nhúng bộ nhớ đã ngừng dùng
  - H3: Sự kiện và vòng đời
  - H3: Ngữ nghĩa quyết định hook
  - H3: Trường đối tượng API
  - H2: Quy ước module nội bộ
  - H2: Liên quan

## plugins/sdk-provider-plugins.md

- Tuyến: /plugins/sdk-provider-plugins
- Tiêu đề:
  - H2: Hướng dẫn từng bước
  - H2: Xuất bản lên ClawHub
  - H2: Cấu trúc tệp
  - H2: Tham chiếu thứ tự danh mục
  - H2: Bước tiếp theo
  - H2: Liên quan

## plugins/sdk-runtime.md

- Tuyến: /plugins/sdk-runtime
- Tiêu đề:
  - H2: Tải và ghi cấu hình
  - H2: Tiện ích runtime có thể tái sử dụng
  - H2: Namespace runtime
  - H2: Lưu tham chiếu runtime
  - H2: Các trường api cấp cao khác
  - H2: Liên quan

## plugins/sdk-setup.md

- Tuyến: /plugins/sdk-setup
- Tiêu đề:
  - H2: Siêu dữ liệu gói
  - H3: Trường openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Tải đầy đủ trì hoãn
  - H2: Manifest Plugin
  - H2: Xuất bản ClawHub
  - H2: Mục thiết lập
  - H3: Import trình trợ giúp thiết lập hẹp
  - H3: Nâng cấp tài khoản đơn do kênh sở hữu
  - H2: Schema cấu hình
  - H3: Xây dựng schema cấu hình kênh
  - H2: Trình hướng dẫn thiết lập
  - H2: Xuất bản và cài đặt
  - H2: Liên quan

## plugins/sdk-subpaths.md

- Tuyến: /plugins/sdk-subpaths
- Tiêu đề:
  - H2: Mục Plugin
  - H3: Tương thích và trình trợ giúp kiểm thử đã ngừng dùng
  - H3: Đường dẫn con trợ giúp Plugin tích hợp sẵn được dành riêng
  - H2: Liên quan

## plugins/sdk-testing.md

- Tuyến: /plugins/sdk-testing
- Tiêu đề:
  - H2: Tiện ích kiểm thử
  - H3: Export có sẵn
  - H3: Kiểu
  - H2: Kiểm thử phân giải mục tiêu
  - H2: Mẫu kiểm thử
  - H3: Kiểm thử hợp đồng đăng ký
  - H3: Kiểm thử truy cập cấu hình runtime
  - H3: Kiểm thử đơn vị một Plugin kênh
  - H3: Kiểm thử đơn vị một Plugin nhà cung cấp
  - H3: Mock runtime Plugin
  - H3: Kiểm thử với stub theo từng instance
  - H2: Kiểm thử hợp đồng (Plugin trong repo)
  - H3: Chạy kiểm thử theo phạm vi
  - H2: Thực thi lint (Plugin trong repo)
  - H2: Cấu hình kiểm thử
  - H2: Liên quan

## plugins/tool-plugins.md

- Tuyến: /plugins/tool-plugins
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
  - H3: không tìm thấy mục Plugin: ./dist/index.js
  - H3: mục Plugin không xuất siêu dữ liệu defineToolPlugin
  - H3: siêu dữ liệu được tạo openclaw.plugin.json đã lỗi thời
  - H3: package.json openclaw.extensions phải bao gồm ./dist/index.js
  - H3: Không tìm thấy gói 'typebox'
  - H3: Công cụ không xuất hiện sau khi cài đặt
  - H2: Xem thêm

## plugins/voice-call.md

- Tuyến: /plugins/voice-call
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cấu hình
  - H2: Phạm vi phiên
  - H2: Cuộc trò chuyện thoại thời gian thực
  - H3: Chính sách công cụ
  - H3: Ngữ cảnh thoại agent
  - H3: Ví dụ về nhà cung cấp thời gian thực
  - H2: Phiên âm streaming
  - H3: Ví dụ về nhà cung cấp streaming
  - H2: TTS cho cuộc gọi
  - H3: Ví dụ TTS
  - H2: Cuộc gọi đến
  - H3: Định tuyến theo từng số
  - H3: Hợp đồng đầu ra lời nói
  - H3: Hành vi khởi động cuộc trò chuyện
  - H3: Thời gian gia hạn khi ngắt kết nối luồng Twilio
  - H2: Bộ dọn cuộc gọi cũ
  - H2: Bảo mật Webhook
  - H2: CLI
  - H2: Công cụ agent
  - H2: Gateway RPC
  - H2: Khắc phục sự cố
  - H3: Thiết lập thất bại khi phơi bày Webhook
  - H3: Thông tin xác thực nhà cung cấp thất bại
  - H3: Cuộc gọi bắt đầu nhưng Webhook nhà cung cấp không đến
  - H3: Xác minh chữ ký thất bại
  - H3: Google Meet Twilio tham gia thất bại
  - H3: Cuộc gọi thời gian thực không có lời nói
  - H2: Liên quan

## plugins/webhooks.md

- Tuyến: /plugins/webhooks
- Tiêu đề:
  - H2: Nơi chạy
  - H2: Cấu hình tuyến
  - H2: Mô hình bảo mật
  - H2: Định dạng yêu cầu
  - H2: Hành động được hỗ trợ
  - H3: createflow
  - H3: runtask
  - H2: Hình dạng phản hồi
  - H2: Tài liệu liên quan

## plugins/workboard.md

- Tuyến: /plugins/workboard
- Tiêu đề:
  - H2: Trạng thái mặc định
  - H2: Nội dung thẻ
  - H2: Lần thực thi thẻ và tác vụ
  - H2: Điều phối agent
  - H3: Lựa chọn worker điều phối
  - H3: Prompt và vòng đời worker
  - H3: Điểm vào điều phối
  - H2: CLI và lệnh slash
  - H2: Đồng bộ vòng đời phiên
  - H2: Quy trình dashboard
  - H2: Quyền
  - H2: Cấu hình
  - H2: Khắc phục sự cố
  - H3: Tab báo Workboard không khả dụng
  - H3: Thẻ không lưu
  - H3: Khởi động thẻ không mở phiên dự kiến
  - H3: Điều phối không khởi động worker
  - H2: Liên quan

## plugins/zalouser.md

- Tuyến: /plugins/zalouser
- Tiêu đề:
  - H2: Đặt tên
  - H2: Nơi chạy
  - H2: Cài đặt
  - H3: Tùy chọn A: cài đặt từ npm
  - H3: Tùy chọn B: cài đặt từ thư mục cục bộ (dev)
  - H2: Cấu hình
  - H2: CLI
  - H2: Công cụ agent
  - H2: Liên quan

## prose.md

- Tuyến: /prose
- Tiêu đề:
  - H2: Cài đặt
  - H2: Lệnh slash
  - H2: Nó có thể làm gì
  - H2: Ví dụ: nghiên cứu song song và tổng hợp
  - H2: Ánh xạ runtime OpenClaw
  - H2: Vị trí tệp
  - H2: Backend trạng thái
  - H2: Bảo mật
  - H2: Liên quan

## providers/alibaba.md

- Tuyến: /providers/alibaba
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Mô hình Wan tích hợp sẵn
  - H2: Khả năng và giới hạn
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/anthropic.md

- Tuyến: /providers/anthropic
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Mặc định suy nghĩ (Claude Fable 5, 4.8 và 4.6)
  - H2: Lưu cache prompt
  - H2: Cấu hình nâng cao
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/arcee.md

- Tuyến: /providers/arcee
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Thiết lập không tương tác
  - H2: Danh mục tích hợp sẵn
  - H2: Tính năng được hỗ trợ
  - H2: Liên quan

## providers/azure-speech.md

- Tuyến: /providers/azure-speech
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tùy chọn cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## providers/bedrock-mantle.md

- Tuyến: /providers/bedrock-mantle
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Khám phá mô hình tự động
  - H3: Khu vực được hỗ trợ
  - H2: Cấu hình thủ công
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/bedrock.md

- Tuyến: /providers/bedrock
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Khám phá mô hình tự động
  - H2: Thiết lập nhanh (đường dẫn AWS)
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/cerebras.md

- Tuyến: /providers/cerebras
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Thiết lập không tương tác
  - H2: Danh mục tích hợp sẵn
  - H2: Cấu hình thủ công
  - H2: Liên quan

## providers/chutes.md

- Tuyến: /providers/chutes
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Hành vi khám phá
  - H2: Alias mặc định
  - H2: Danh mục khởi đầu tích hợp sẵn
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/claude-max-api-proxy.md

- Đường dẫn: /providers/claude-max-api-proxy
- Tiêu đề:
  - H2: Tại sao dùng mục này?
  - H2: Cách hoạt động
  - H2: Bắt đầu
  - H2: Danh mục tích hợp sẵn
  - H2: Cấu hình nâng cao
  - H2: Ghi chú
  - H2: Liên quan

## providers/cloudflare-ai-gateway.md

- Đường dẫn: /providers/cloudflare-ai-gateway
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Ví dụ không tương tác
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/cohere.md

- Đường dẫn: /providers/cohere
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Thiết lập chỉ bằng môi trường
  - H2: Liên quan

## providers/comfy.md

- Đường dẫn: /providers/comfy
- Tiêu đề:
  - H2: Nội dung được hỗ trợ
  - H2: Bắt đầu
  - H2: Cấu hình
  - H3: Khóa dùng chung
  - H3: Khóa theo từng khả năng
  - H2: Chi tiết quy trình làm việc
  - H2: Liên quan

## providers/deepgram.md

- Đường dẫn: /providers/deepgram
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tùy chọn cấu hình
  - H2: STT phát trực tuyến cho Cuộc gọi thoại
  - H2: Ghi chú
  - H2: Liên quan

## providers/deepinfra.md

- Đường dẫn: /providers/deepinfra
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Lấy khóa API
  - H2: Thiết lập CLI
  - H2: Đoạn cấu hình
  - H2: Các bề mặt OpenClaw được hỗ trợ
  - H2: Mô hình khả dụng
  - H2: Ghi chú
  - H2: Liên quan

## providers/deepseek.md

- Đường dẫn: /providers/deepseek
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Danh mục tích hợp sẵn
  - H2: Suy luận và công cụ
  - H2: Kiểm thử trực tiếp
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/ds4.md

- Đường dẫn: /providers/ds4
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Khởi động nhanh
  - H2: Cấu hình đầy đủ
  - H2: Khởi động theo nhu cầu
  - H2: Think Max
  - H2: Kiểm thử
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/elevenlabs.md

- Đường dẫn: /providers/elevenlabs
- Tiêu đề:
  - H2: Xác thực
  - H2: Chuyển văn bản thành giọng nói
  - H2: Chuyển giọng nói thành văn bản
  - H2: STT phát trực tuyến
  - H2: Liên quan

## providers/fal.md

- Đường dẫn: /providers/fal
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tạo hình ảnh
  - H2: Tạo video
  - H2: Tạo nhạc
  - H2: Liên quan

## providers/fireworks.md

- Đường dẫn: /providers/fireworks
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Thiết lập không tương tác
  - H2: Danh mục tích hợp sẵn
  - H2: ID mô hình Fireworks tùy chỉnh
  - H2: Liên quan

## providers/github-copilot.md

- Đường dẫn: /providers/github-copilot
- Tiêu đề:
  - H2: Ba cách dùng Copilot trong OpenClaw
  - H2: Cờ tùy chọn
  - H2: Onboarding không tương tác
  - H2: Embedding tìm kiếm bộ nhớ
  - H3: Cấu hình
  - H3: Cách hoạt động
  - H2: Liên quan

## providers/gmi.md

- Đường dẫn: /providers/gmi
- Tiêu đề:
  - H2: Thiết lập
  - H2: Mặc định
  - H2: Khi nào chọn GMI
  - H2: Mô hình
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/google.md

- Đường dẫn: /providers/google
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

- Đường dẫn: /providers/gradium
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Thiết lập
  - H2: Cấu hình
  - H2: Giọng nói
  - H3: Ghi đè giọng nói theo từng tin nhắn
  - H2: Đầu ra
  - H2: Thứ tự tự động chọn
  - H2: Liên quan

## providers/groq.md

- Đường dẫn: /providers/groq
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H3: Ví dụ tệp cấu hình
  - H2: Danh mục tích hợp sẵn
  - H2: Mô hình suy luận
  - H2: Phiên âm âm thanh
  - H2: Liên quan

## providers/huggingface.md

- Đường dẫn: /providers/huggingface
- Tiêu đề:
  - H2: Bắt đầu
  - H3: Thiết lập không tương tác
  - H2: ID mô hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/index.md

- Đường dẫn: /providers
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Tài liệu nhà cung cấp
  - H2: Trang tổng quan dùng chung
  - H2: Nhà cung cấp phiên âm
  - H2: Công cụ cộng đồng

## providers/inferrs.md

- Đường dẫn: /providers/inferrs
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình đầy đủ
  - H2: Khởi động theo nhu cầu
  - H2: Cấu hình nâng cao
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/inworld.md

- Đường dẫn: /providers/inworld
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Tùy chọn cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## providers/kilocode.md

- Đường dẫn: /providers/kilocode
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Mô hình mặc định
  - H2: Danh mục tích hợp sẵn
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/litellm.md

- Đường dẫn: /providers/litellm
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Cấu hình
  - H3: Biến môi trường
  - H3: Tệp cấu hình
  - H2: Cấu hình nâng cao
  - H3: Tạo hình ảnh
  - H2: Liên quan

## providers/lmstudio.md

- Đường dẫn: /providers/lmstudio
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Onboarding không tương tác
  - H2: Cấu hình
  - H3: Tương thích mức sử dụng phát trực tuyến
  - H3: Tương thích suy luận
  - H3: Cấu hình tường minh
  - H2: Khắc phục sự cố
  - H3: Không phát hiện LM Studio
  - H3: Lỗi xác thực (HTTP 401)
  - H3: Tải mô hình đúng lúc
  - H3: Máy chủ LM Studio qua LAN hoặc tailnet
  - H2: Liên quan

## providers/minimax.md

- Đường dẫn: /providers/minimax
- Tiêu đề:
  - H2: Danh mục tích hợp sẵn
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

- Đường dẫn: /providers/mistral
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Danh mục LLM tích hợp sẵn
  - H2: Phiên âm âm thanh (Voxtral)
  - H2: STT phát trực tuyến cho Cuộc gọi thoại
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/models.md

- Đường dẫn: /providers/models
- Tiêu đề:
  - H2: Khởi động nhanh (hai bước)
  - H2: Nhà cung cấp được hỗ trợ (bộ khởi đầu)
  - H2: Biến thể nhà cung cấp bổ sung
  - H2: Liên quan

## providers/moonshot.md

- Đường dẫn: /providers/moonshot
- Tiêu đề:
  - H2: Danh mục mô hình tích hợp sẵn
  - H2: Bắt đầu
  - H2: Tìm kiếm web Kimi
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/novita.md

- Đường dẫn: /providers/novita
- Tiêu đề:
  - H2: Thiết lập
  - H2: Mặc định
  - H2: Khi nào chọn Novita
  - H2: Mô hình
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/nvidia.md

- Đường dẫn: /providers/nvidia
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Danh mục nổi bật
  - H2: Nemotron 3 Ultra
  - H2: Danh mục dự phòng đi kèm
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/ollama-cloud.md

- Đường dẫn: /providers/ollama-cloud
- Tiêu đề:
  - H2: Thiết lập
  - H2: Mặc định
  - H2: Khi nào chọn Ollama Cloud
  - H2: Mô hình
  - H2: Kiểm thử trực tiếp
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/ollama.md

- Đường dẫn: /providers/ollama
- Tiêu đề:
  - H2: Quy tắc xác thực
  - H2: Bắt đầu
  - H2: Mô hình đám mây
  - H2: Khám phá mô hình (nhà cung cấp ngầm định)
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

- Đường dẫn: /providers/openai
- Tiêu đề:
  - H2: Lựa chọn nhanh
  - H2: Bản đồ đặt tên
  - H2: Bản xem trước giới hạn GPT-5.6
  - H2: Mức bao phủ tính năng OpenClaw
  - H2: Embedding bộ nhớ
  - H2: Bắt đầu
  - H2: Xác thực app-server Codex gốc
  - H2: Tạo hình ảnh
  - H2: Tạo video
  - H2: Đóng góp prompt GPT-5
  - H2: Giọng nói và lời nói
  - H2: Điểm cuối Azure OpenAI
  - H3: Cấu hình
  - H3: Phiên bản API
  - H3: Tên mô hình là tên triển khai
  - H3: Tính khả dụng theo khu vực
  - H3: Khác biệt về tham số
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/opencode-go.md

- Đường dẫn: /providers/opencode-go
- Tiêu đề:
  - H2: Danh mục tích hợp sẵn
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/opencode.md

- Đường dẫn: /providers/opencode
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Danh mục tích hợp sẵn
  - H3: Zen
  - H3: Go
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/openrouter.md

- Đường dẫn: /providers/openrouter
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
  - H2: Xác thực và tiêu đề
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/perplexity-provider.md

- Đường dẫn: /providers/perplexity-provider
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Chế độ tìm kiếm
  - H2: Lọc API gốc
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/pixverse.md

- Đường dẫn: /providers/pixverse
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Chế độ và mô hình được hỗ trợ
  - H2: Tùy chọn nhà cung cấp
  - H2: Cấu hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/qianfan.md

- Đường dẫn: /providers/qianfan
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Danh mục tích hợp sẵn
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/qwen-oauth.md

- Đường dẫn: /providers/qwen-oauth
- Tiêu đề:
  - H2: Thiết lập
  - H2: Mặc định
  - H2: Điểm khác biệt so với Qwen
  - H2: Khi nào chọn Qwen OAuth / Portal
  - H2: Mô hình
  - H2: Di chuyển
  - H2: Khắc phục sự cố
  - H2: Liên quan

## providers/qwen.md

- Đường dẫn: /providers/qwen
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Bắt đầu
  - H2: Loại gói và điểm cuối
  - H2: Danh mục tích hợp sẵn
  - H2: Điều khiển suy luận
  - H2: Tiện ích bổ sung đa phương thức
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/runway.md

- Đường dẫn: /providers/runway
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Chế độ và mô hình được hỗ trợ
  - H2: Cấu hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/senseaudio.md

- Đường dẫn: /providers/senseaudio
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tùy chọn
  - H2: Liên quan

## providers/sglang.md

- Đường dẫn: /providers/sglang
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Khám phá mô hình (nhà cung cấp ngầm định)
  - H2: Cấu hình tường minh (mô hình thủ công)
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/stepfun.md

- Đường dẫn: /providers/stepfun
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: Tổng quan về khu vực và điểm cuối
  - H2: Danh mục tích hợp sẵn
  - H2: Bắt đầu
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/synthetic.md

- Đường dẫn: /providers/synthetic
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Danh mục tích hợp sẵn
  - H2: Liên quan

## providers/tencent.md

- Đường dẫn: /providers/tencent
- Tiêu đề:
  - H2: Khởi động nhanh
  - H2: Thiết lập không tương tác
  - H2: Danh mục tích hợp sẵn
  - H2: Định giá theo bậc
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/together.md

- Đường dẫn: /providers/together
- Tiêu đề:
  - H2: Bắt đầu
  - H3: Ví dụ không tương tác
  - H2: Danh mục tích hợp sẵn
  - H2: Tạo video
  - H2: Liên quan

## providers/venice.md

- Đường dẫn: /providers/venice
- Tiêu đề:
  - H2: Tại sao dùng Venice trong OpenClaw
  - H2: Chế độ riêng tư
  - H2: Tính năng
  - H2: Bắt đầu
  - H2: Chọn mô hình
  - H2: Hành vi phát lại DeepSeek V4
  - H2: Danh mục tích hợp sẵn (tổng cộng 41)
  - H2: Khám phá mô hình
  - H2: Hỗ trợ phát trực tuyến và công cụ
  - H2: Định giá
  - H3: Venice (ẩn danh hóa) so với API trực tiếp
  - H2: Ví dụ sử dụng
  - H2: Khắc phục sự cố
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/vercel-ai-gateway.md

- Đường dẫn: /providers/vercel-ai-gateway
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Ví dụ không tương tác
  - H2: Dạng viết tắt ID mô hình
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## providers/vllm.md

- Đường dẫn: /providers/vllm
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
  - H2: Nhà cung cấp và điểm cuối
  - H2: Danh mục tích hợp sẵn
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
  - H2: Chọn đường dẫn thiết lập của bạn
  - H2: Khắc phục sự cố OAuth
  - H2: Danh mục tích hợp sẵn
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
  - H2: Danh mục trả theo mức dùng
  - H2: Danh mục Gói Token
  - H2: Chuyển văn bản thành giọng nói
  - H2: Ví dụ cấu hình
  - H2: Liên quan

## providers/zai.md

- Tuyến: /providers/zai
- Tiêu đề:
  - H2: Mô hình GLM
  - H2: Bắt đầu
  - H2: Ví dụ cấu hình
  - H2: Danh mục tích hợp sẵn
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## refactor/access.md

- Tuyến: /refactor/access
- Tiêu đề: không có

## refactor/acp.md

- Tuyến: /refactor/acp
- Tiêu đề:
  - H2: Mục tiêu
  - H2: Không phải mục tiêu
  - H2: Mô hình đích
  - H3: Danh tính phiên bản Gateway
  - H3: Quyền sở hữu phiên ACP
  - H3: Hợp đồng thuê tiến trình ACPX
  - H2: Bộ điều khiển vòng đời
  - H2: Hợp đồng wrapper
  - H2: Hợp đồng hiển thị phiên
  - H2: Kế hoạch di trú
  - H3: Giai đoạn 1: Thêm danh tính và hợp đồng thuê
  - H3: Giai đoạn 2: Dọn dẹp ưu tiên hợp đồng thuê
  - H3: Giai đoạn 3: Thu gom khi khởi động ưu tiên hợp đồng thuê
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
  - H2: Không phải mục tiêu
  - H2: Trạng thái nhánh hiện tại
  - H2: Hình dạng đích
  - H2: Các bước di trú
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
  - H3: Không hồi quy
  - H2: Giả định từ đọc mã
  - H2: Phát hiện từ đọc mã
  - H2: Hình dạng mã hiện tại
  - H2: Hình dạng schema đích
  - H2: Hình dạng di trú Doctor
  - H2: Kiểm kê di trú
  - H2: Kế hoạch di trú
  - H3: Giai đoạn 0: Đóng băng ranh giới
  - H3: Giai đoạn 1: Hoàn tất mặt phẳng điều khiển toàn cục
  - H3: Giai đoạn 2: Giới thiệu cơ sở dữ liệu theo từng agent
  - H3: Giai đoạn 3: Thay thế API kho phiên
  - H3: Giai đoạn 4: Di chuyển bản ghi hội thoại, luồng ACP, quỹ đạo và VFS
  - H3: Giai đoạn 5: Sao lưu, khôi phục, vacuum và xác minh
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
  - H2: Không gian dùng chung (khuyến nghị)
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
  - H2: Kết thúc main ổn định
  - H2: Kiểm tra sơ bộ phát hành
  - H2: Hộp kiểm thử phát hành
  - H3: Vitest
  - H3: Docker
  - H3: Phòng thí nghiệm QA
  - H3: Gói
  - H2: Tự động hóa phát hành
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
  - H3: 2) Hiểu media (âm thanh/hình ảnh/video)
  - H3: 3) Tạo hình ảnh và video
  - H3: 4) Embedding bộ nhớ + tìm kiếm ngữ nghĩa
  - H3: 5) Công cụ tìm kiếm web
  - H3: 5) Công cụ lấy nội dung web (Firecrawl)
  - H3: 6) Ảnh chụp mức sử dụng nhà cung cấp (trạng thái/sức khỏe)
  - H3: 7) Tóm tắt bảo vệ Compaction
  - H3: 8) Quét / thăm dò mô hình
  - H3: 9) Nói chuyện (giọng nói)
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
  - H2: Cập nhật kỹ năng frontend

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
  - H2: Namespace nội bộ
  - H3: Vòng đời registry
  - H3: Hình dạng đăng ký
  - H3: Quyền sở hữu và khả năng hiển thị
  - H3: Quy tắc tuần tự hóa phạm vi
  - H3: Prompt
  - H3: Dọn dẹp
  - H3: Danh sách kiểm tra kiểm thử
  - H2: API đầu ra
  - H2: Danh mục công cụ
  - H2: Tương tác Tìm kiếm công cụ
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
  - H2: Ghi nhận
  - H2: Cộng tác viên cốt lõi
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
  - H2: Phần việc đường dẫn phát hành Docker
  - H2: Hồ sơ phát hành
  - H2: Bổ sung chỉ dành cho đầy đủ
  - H2: Chạy lại có trọng tâm
  - H2: Bằng chứng cần giữ
  - H2: Tệp workflow

## reference/memory-config.md

- Tuyến: /reference/memory-config
- Tiêu đề:
  - H2: Chọn nhà cung cấp
  - H3: ID nhà cung cấp tùy chỉnh
  - H3: Phân giải khóa API
  - H2: Cấu hình điểm cuối từ xa
  - H2: Cấu hình theo nhà cung cấp
  - H3: Thời gian chờ embedding nội tuyến
  - H2: Cấu hình tìm kiếm lai
  - H3: Ví dụ đầy đủ
  - H2: Đường dẫn bộ nhớ bổ sung
  - H2: Bộ nhớ đa phương thức (Gemini)
  - H2: Bộ đệm embedding
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
  - H3: Mức sử dụng Gemini CLI
  - H2: Ranh giới bộ đệm system-prompt
  - H2: Bộ bảo vệ ổn định bộ đệm của OpenClaw
  - H2: Mẫu tinh chỉnh
  - H3: Lưu lượng hỗn hợp (mặc định khuyến nghị)
  - H3: Baseline ưu tiên chi phí
  - H2: Chẩn đoán bộ đệm
  - H2: Kiểm thử hồi quy trực tiếp
  - H3: Kỳ vọng trực tiếp Anthropic
  - H3: Kỳ vọng trực tiếp OpenAI
  - H3: Cấu hình diagnostics.cacheTrace
  - H3: Bật/tắt env (gỡ lỗi một lần)
  - H3: Cần kiểm tra gì
  - H2: Khắc phục sự cố nhanh
  - H2: Liên quan

## reference/release-performance-sweep.md

- Tuyến: /reference/release-performance-sweep
- Tiêu đề:
  - H2: Ảnh chụp
  - H2: Dòng thời gian dấu vết cài đặt
  - H2: Những gì đã thay đổi trong 5.28
  - H2: Số liệu nổi bật
  - H3: Dấu vết cài đặt
  - H3: Kích thước gói npm
  - H2: Tóm tắt lượt agent Kova
  - H2: Thăm dò nguồn
  - H2: Kiểm toán dấu vết cài đặt
  - H3: Ranh giới shrinkwrap
  - H2: Diễn giải chuỗi cung ứng

## reference/rich-output-protocol.md

- Tuyến: /reference/rich-output-protocol
- Tiêu đề:
  - H2: [embed ...]
  - H2: Hình dạng kết xuất đã lưu
  - H2: Liên quan

## reference/rpc.md

- Tuyến: /reference/rpc
- Tiêu đề:
  - H2: Mẫu A: daemon HTTP (signal-cli)
  - H2: Mẫu B: tiến trình con stdio (imsg)
  - H2: Hướng dẫn adapter
  - H2: Liên quan

## reference/secret-placeholder-conventions.md

- Tuyến: /reference/secret-placeholder-conventions
- Tiêu đề:
  - H1: Quy ước placeholder bí mật
  - H2: Kiểu được khuyến nghị
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
  - H2: Bảo trì kho và điều khiển đĩa
  - H2: Phiên Cron và nhật ký chạy
  - H2: Khóa phiên (sessionKey)
  - H2: ID phiên (sessionId)
  - H2: Schema kho phiên (sessions.json)
  - H2: Cấu trúc bản ghi hội thoại (.jsonl)
  - H2: Cửa sổ ngữ cảnh so với token được theo dõi
  - H2: Compaction: nó là gì
  - H2: Ranh giới đoạn Compaction và ghép cặp công cụ
  - H2: Khi tự động Compaction xảy ra (runtime OpenClaw)
  - H2: Cài đặt Compaction (reserveTokens, keepRecentTokens)
  - H2: Nhà cung cấp Compaction có thể cắm được
  - H2: Bề mặt hiển thị với người dùng
  - H2: Dọn dẹp thầm lặng (NOREPLY)
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
  - H2: Heartbeat (tùy chọn)
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
  - H2: Kết nối (tùy chọn)
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
  - H1: IDENTITY.md - Danh tính agent
  - H2: Vai trò
  - H2: Linh hồn
  - H2: Mối quan hệ với Clawd
  - H2: Đặc điểm riêng
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
  - H2: Những nét riêng của tôi
  - H2: Mối quan hệ của tôi với Clawd
  - H2: Những gì tôi sẽ không làm
  - H2: Quy tắc vàng
  - H2: Liên quan

## reference/templates/SOUL.md

- Tuyến: /reference/templates/SOUL
- Tiêu đề:
  - H1: SOUL.md - Bạn là ai
  - H2: Sự thật cốt lõi
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
  - H2: Nội dung cần đặt ở đây
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
  - H2: E2E nhập môn (Docker)
  - H2: Kiểm thử nhanh nhập QR (Docker)
  - H2: Liên quan

## reference/token-use.md

- Tuyến: /reference/token-use
- Tiêu đề:
  - H2: Cách xây dựng system prompt
  - H2: Những gì được tính trong cửa sổ ngữ cảnh
  - H2: Cách xem mức sử dụng token hiện tại
  - H2: Ước tính chi phí (khi được hiển thị)
  - H2: Tác động của TTL bộ nhớ đệm và việc cắt tỉa
  - H3: Ví dụ: giữ ấm bộ nhớ đệm 1 giờ bằng heartbeat
  - H3: Ví dụ: lưu lượng hỗn hợp với chiến lược bộ nhớ đệm theo từng agent
  - H3: Ngữ cảnh 1M của Anthropic
  - H2: Mẹo giảm áp lực token
  - H2: Liên quan

## reference/transcript-hygiene.md

- Tuyến: /reference/transcript-hygiene
- Tiêu đề:
  - H2: Quy tắc toàn cục: ngữ cảnh runtime không phải là bản ghi hội thoại của người dùng
  - H2: Nơi quy trình này chạy
  - H2: Quy tắc toàn cục: làm sạch hình ảnh
  - H2: Quy tắc toàn cục: lệnh gọi công cụ sai định dạng
  - H2: Quy tắc toàn cục: lượt chỉ suy luận chưa hoàn chỉnh
  - H2: Quy tắc toàn cục: nguồn gốc đầu vào giữa các phiên
  - H2: Ma trận nhà cung cấp (hành vi hiện tại)
  - H2: Hành vi lịch sử (trước 2026.1.22)
  - H2: Liên quan

## reference/wizard.md

- Tuyến: /reference/wizard
- Tiêu đề:
  - H2: Chi tiết luồng (chế độ cục bộ)
  - H2: Chế độ không tương tác
  - H3: Thêm agent (không tương tác)
  - H2: RPC wizard Gateway
  - H2: Thiết lập Signal (signal-cli)
  - H2: Những gì wizard ghi
  - H2: Tài liệu liên quan

## releases/2026.6.11.md

- Tuyến: /releases/2026.6.11
- Tiêu đề:
  - H1: Ghi chú phát hành OpenClaw v2026.6.11 (2026-06-30)
  - H2: Điểm nổi bật
  - H3: Độ tin cậy phân phối kênh
  - H3: Khôi phục nhà cung cấp và mô hình
  - H3: Tính liên tục của phiên, bộ nhớ và niềm tin
  - H3: Chế độ relay của bộ định tuyến Slack
  - H3: Cầu đánh thức Raft External Agent
  - H3: Cài đặt và sửa chữa Plugin chính thức
  - H2: Kênh và nhắn tin
  - H3: Các bản sửa kênh bổ sung
  - H2: Gateway, bảo mật và niềm tin
  - H3: Khôi phục khởi động lại và trạng thái sẵn sàng
  - H3: Phân phối kết quả từ xa và media
  - H2: Máy khách và giao diện
  - H3: Gửi từ máy khách và kết nối lại
  - H3: Sửa giao diện, cài đặt và nhập môn
  - H2: Tài liệu và công cụ quản trị
  - H3: Độ tin cậy của thiết lập và lệnh
  - H3: Công cụ và công việc theo lịch

## releases/index.md

- Tuyến: /releases
- Tiêu đề:
  - H1: Ghi chú phát hành
  - H2: Bản phát hành
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
  - H3: Mức độ rủi ro
  - H2: Quy trình đánh giá
  - H2: Tài nguyên
  - H2: Liên hệ
  - H2: Ghi nhận
  - H2: Liên quan

## security/THREAT-MODEL-ATLAS.md

- Tuyến: /security/THREAT-MODEL-ATLAS
- Tiêu đề:
  - H2: Khung MITRE ATLAS
  - H3: Ghi công khung
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
  - H4: T-RECON-001: Phát hiện endpoint agent
  - H4: T-RECON-002: Thăm dò tích hợp kênh
  - H3: 3.2 Truy cập ban đầu (AML.TA0004)
  - H4: T-ACCESS-001: Chặn mã ghép nối
  - H4: T-ACCESS-002: Giả mạo AllowFrom
  - H4: T-ACCESS-003: Đánh cắp token
  - H3: 3.3 Thực thi (AML.TA0005)
  - H4: T-EXEC-001: Chèn prompt trực tiếp
  - H4: T-EXEC-002: Chèn prompt gián tiếp
  - H4: T-EXEC-003: Chèn đối số công cụ
  - H4: T-EXEC-004: Vượt qua phê duyệt Exec
  - H3: 3.4 Duy trì hiện diện (AML.TA0006)
  - H4: T-PERSIST-001: Cài đặt Skill độc hại
  - H4: T-PERSIST-002: Đầu độc bản cập nhật Skill
  - H4: T-PERSIST-003: Can thiệp cấu hình agent
  - H3: 3.5 Né tránh phòng thủ (AML.TA0007)
  - H4: T-EVADE-001: Vượt qua mẫu kiểm duyệt
  - H4: T-EVADE-002: Thoát khỏi lớp bọc nội dung
  - H3: 3.6 Khám phá (AML.TA0008)
  - H4: T-DISC-001: Liệt kê công cụ
  - H4: T-DISC-002: Trích xuất dữ liệu phiên
  - H3: 3.7 Thu thập &amp; rò rỉ dữ liệu (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Đánh cắp dữ liệu qua webfetch
  - H4: T-EXFIL-002: Gửi tin nhắn trái phép
  - H4: T-EXFIL-003: Thu thập thông tin đăng nhập
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
  - H3: 5.2 Chuỗi tấn công đường tới hạn
  - H2: 6. Tóm tắt khuyến nghị
  - H3: 6.1 Ngay lập tức (P0)
  - H3: 6.2 Ngắn hạn (P1)
  - H3: 6.3 Trung hạn (P2)
  - H2: 7. Phụ lục
  - H3: 7.1 Ánh xạ kỹ thuật ATLAS
  - H3: 7.2 Tệp bảo mật chính
  - H3: 7.3 Bảng thuật ngữ
  - H2: Liên quan

## security/formal-verification.md

- Tuyến: /security/formal-verification
- Tiêu đề:
  - H2: Nơi lưu các mô hình
  - H2: Lưu ý quan trọng
  - H2: Tái tạo kết quả
  - H3: Lộ diện Gateway và cấu hình sai open gateway
  - H3: Pipeline exec của Node (năng lực rủi ro cao nhất)
  - H3: Kho ghép nối (kiểm soát DM)
  - H3: Kiểm soát ingress (mention + vượt qua control-command)
  - H3: Cô lập định tuyến/session-key
  - H2: v1++: các mô hình có giới hạn bổ sung (đồng thời, thử lại, tính đúng đắn của trace)
  - H3: Đồng thời / tính idempotent của kho ghép nối
  - H3: Tương quan trace ingress / tính idempotent
  - H3: Độ ưu tiên routing dmScope + identityLinks
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
  - H2: Tin cậy Proxy CA
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
  - H2: Nơi quy trình này chạy
  - H2: Tài liệu liên quan

## start/docs-directory.md

- Tuyến: /start/docs-directory
- Tiêu đề:
  - H2: Bắt đầu tại đây
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
  - H2: Bắt đầu tại đây
  - H2: Cài đặt + cập nhật
  - H2: Khái niệm cốt lõi
  - H2: Nhà cung cấp + ingress
  - H2: Gateway + vận hành
  - H2: Công cụ + tự động hóa
  - H2: Node, media, giọng nói
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
  - H2: Lần lột xác đầu tiên (ngày 27 tháng 1 năm 2026)
  - H2: Cái tên
  - H2: Dalek đối đầu tôm hùm
  - H2: Nhân vật chính
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: Những sự cố lớn
  - H3: Xả thư mục (3 tháng 12, 2025)
  - H3: Cuộc lột xác lớn (27 tháng 1, 2026)
  - H3: Hình thái cuối cùng (ngày 30 tháng 1 năm 2026)
  - H3: Cơn mua sắm robot (3 tháng 12, 2025)
  - H2: Văn bản thiêng liêng
  - H2: Tín điều tôm hùm
  - H3: Trường thiên tạo biểu tượng (27 tháng 1, 2026)
  - H2: Tương lai
  - H2: Liên quan

## start/onboarding-overview.md

- Tuyến: /start/onboarding-overview
- Tiêu đề:
  - H2: Tôi nên dùng lộ trình nào?
  - H2: Nhập môn cấu hình những gì
  - H2: Nhập môn CLI
  - H2: Nhập môn ứng dụng macOS
  - H2: Nhà cung cấp tùy chỉnh hoặc không được liệt kê
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
  - H2: Thiết lập hai điện thoại (khuyến nghị)
  - H2: Khởi động nhanh trong 5 phút
  - H2: Cấp không gian làm việc cho agent (AGENTS)
  - H2: Cấu hình biến nó thành "một trợ lý"
  - H2: Phiên và bộ nhớ
  - H2: Heartbeats (chế độ chủ động)
  - H2: Media vào và ra
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
  - H2: Điều kiện tiên quyết (từ mã nguồn)
  - H2: Chiến lược tùy chỉnh (để cập nhật không gây hại)
  - H2: Chạy Gateway từ repo này
  - H2: Quy trình ổn định (ứng dụng macOS trước)
  - H2: Quy trình bleeding edge (Gateway trong terminal)
  - H3: 0) (Tùy chọn) Chạy cả ứng dụng macOS từ mã nguồn
  - H3: 1) Khởi động Gateway dev
  - H3: 2) Trỏ ứng dụng macOS tới Gateway đang chạy của bạn
  - H3: 3) Xác minh
  - H3: Lỗi thường gặp
  - H2: Bản đồ lưu trữ thông tin đăng nhập
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
  - H2: Nhà và phần cứng
  - H2: Dự án cộng đồng
  - H2: Gửi dự án của bạn
  - H2: Liên quan

## start/wizard-cli-automation.md

- Tuyến: /start/wizard-cli-automation
- Tiêu đề:
  - H2: Ví dụ không tương tác cơ sở
  - H2: Ví dụ theo nhà cung cấp
  - H2: Thêm agent khác
  - H2: Tài liệu liên quan

## start/wizard-cli-reference.md

- Tuyến: /start/wizard-cli-reference
- Tiêu đề:
  - H2: Wizard làm gì
  - H2: Chi tiết luồng cục bộ
  - H2: Chi tiết chế độ từ xa
  - H2: Tùy chọn xác thực và mô hình
  - H2: Đầu ra và phần nội bộ
  - H2: Tài liệu liên quan

## start/wizard.md

- Tuyến: /start/wizard
- Tiêu đề:
  - H2: Ngôn ngữ
  - H2: QuickStart so với Nâng cao
  - H2: Nhập môn cấu hình những gì
  - H2: Thêm agent khác
  - H2: Tham chiếu đầy đủ
  - H2: Tài liệu liên quan

## tools/acp-agents-setup.md

- Đường dẫn: /tools/acp-agents-setup
- Tiêu đề:
  - H2: Hỗ trợ harness acpx (hiện tại)
  - H2: Cấu hình bắt buộc
  - H2: Thiết lập Plugin cho backend acpx
  - H3: Cấu hình lệnh và phiên bản acpx
  - H3: Tự động cài đặt phụ thuộc
  - H3: Cầu nối MCP cho công cụ Plugin
  - H3: Cầu nối MCP cho công cụ OpenClaw
  - H3: Cấu hình thời gian chờ thao tác runtime
  - H3: Cấu hình agent thăm dò sức khỏe
  - H2: Cấu hình quyền
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Cấu hình
  - H2: Liên quan

## tools/acp-agents.md

- Đường dẫn: /tools/acp-agents
- Tiêu đề:
  - H2: Tôi cần trang nào?
  - H2: Tính năng này có hoạt động ngay không?
  - H2: Các đích harness được hỗ trợ
  - H2: Sổ tay vận hành cho người vận hành
  - H2: ACP so với sub-agent
  - H2: Cách ACP chạy Claude Code
  - H2: Phiên được ràng buộc
  - H3: Mô hình tư duy
  - H3: Ràng buộc cuộc trò chuyện hiện tại
  - H2: Ràng buộc kênh bền vững
  - H3: Mô hình ràng buộc
  - H3: Mặc định runtime theo agent
  - H3: Ví dụ
  - H3: Hành vi
  - H2: Bắt đầu phiên ACP
  - H3: Tham số sessionsspawn
  - H2: Chế độ spawn bind và thread
  - H2: Mô hình phân phối
  - H2: Tương thích sandbox
  - H2: Phân giải đích phiên
  - H2: Điều khiển ACP
  - H3: Ánh xạ tùy chọn runtime
  - H2: Harness acpx, thiết lập Plugin và quyền
  - H2: Khắc phục sự cố
  - H2: Liên quan

## tools/agent-send.md

- Đường dẫn: /tools/agent-send
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cờ
  - H2: Hành vi
  - H2: Ví dụ
  - H2: Liên quan

## tools/apply-patch.md

- Đường dẫn: /tools/apply-patch
- Tiêu đề:
  - H2: Tham số
  - H2: Ghi chú
  - H2: Ví dụ
  - H2: Liên quan

## tools/brave-search.md

- Đường dẫn: /tools/brave-search
- Tiêu đề:
  - H2: Lấy khóa API
  - H2: Ví dụ cấu hình
  - H2: Tham số công cụ
  - H2: Ghi chú
  - H2: Liên quan

## tools/browser-control.md

- Đường dẫn: /tools/browser-control
- Tiêu đề:
  - H2: API điều khiển (tùy chọn)
  - H3: Hợp đồng lỗi /act
  - H3: Yêu cầu Playwright
  - H4: Cài đặt Docker Playwright
  - H2: Cách hoạt động (nội bộ)
  - H2: Tham chiếu nhanh CLI
  - H2: Snapshot và ref
  - H2: Nâng cấp sức mạnh cho lệnh chờ
  - H2: Quy trình gỡ lỗi
  - H2: Đầu ra JSON
  - H2: Núm chỉnh trạng thái và môi trường
  - H2: Bảo mật và quyền riêng tư
  - H2: Liên quan

## tools/browser-linux-troubleshooting.md

- Đường dẫn: /tools/browser-linux-troubleshooting
- Tiêu đề:
  - H2: Sự cố: "Failed to start Chrome CDP on port 18800"
  - H3: Nguyên nhân gốc
  - H3: Giải pháp 1: Cài đặt Google Chrome (Khuyến nghị)
  - H3: Giải pháp 2: Dùng Snap Chromium với chế độ chỉ đính kèm
  - H3: Xác minh trình duyệt hoạt động
  - H3: Tham chiếu cấu hình
  - H3: Sự cố: "No Chrome tabs found for profile=\"user\""
  - H2: Liên quan

## tools/browser-login.md

- Đường dẫn: /tools/browser-login
- Tiêu đề:
  - H2: Đăng nhập thủ công (khuyến nghị)
  - H2: Hồ sơ Chrome nào được dùng?
  - H2: X/Twitter: luồng khuyến nghị
  - H2: Sandboxing + truy cập trình duyệt máy chủ
  - H2: Liên quan

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Đường dẫn: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Tiêu đề:
  - H2: Chọn đúng chế độ trình duyệt trước
  - H3: Tùy chọn 1: CDP từ xa thô từ WSL2 đến Windows
  - H3: Tùy chọn 2: Chrome MCP cục bộ trên máy chủ
  - H2: Kiến trúc hoạt động
  - H2: Vì sao thiết lập này gây khó hiểu
  - H2: Quy tắc quan trọng cho giao diện Control UI
  - H2: Xác thực theo từng lớp
  - H3: Lớp 1: Xác minh Chrome đang phục vụ CDP trên Windows
  - H3: Lớp 2: Xác minh WSL2 có thể truy cập endpoint Windows đó
  - H3: Lớp 3: Cấu hình đúng hồ sơ trình duyệt
  - H3: Lớp 4: Xác minh riêng lớp giao diện Control UI
  - H3: Lớp 5: Xác minh điều khiển trình duyệt đầu cuối
  - H2: Lỗi thường gây hiểu nhầm
  - H2: Danh sách kiểm tra phân loại nhanh
  - H2: Kết luận thực tiễn
  - H2: Liên quan

## tools/browser.md

- Đường dẫn: /tools/browser
- Tiêu đề:
  - H2: Bạn nhận được gì
  - H2: Bắt đầu nhanh
  - H2: Điều khiển Plugin
  - H2: Hướng dẫn cho agent
  - H2: Thiếu lệnh hoặc công cụ trình duyệt
  - H2: Hồ sơ: openclaw so với user
  - H2: Cấu hình
  - H3: Thị giác ảnh chụp màn hình (hỗ trợ mô hình chỉ văn bản)
  - H2: Dùng Brave hoặc trình duyệt dựa trên Chromium khác
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
  - H2: Đảm bảo cách ly
  - H2: Lựa chọn trình duyệt
  - H2: API điều khiển (tùy chọn)
  - H2: Khắc phục sự cố
  - H3: Lỗi khởi động CDP so với chặn SSRF khi điều hướng
  - H2: Công cụ agent + cách điều khiển hoạt động
  - H2: Liên quan

## tools/btw.md

- Đường dẫn: /tools/btw
- Tiêu đề:
  - H2: Chức năng
  - H2: Những gì nó không làm
  - H2: Cách ngữ cảnh hoạt động
  - H2: Mô hình phân phối
  - H2: Hành vi bề mặt
  - H3: TUI
  - H3: Kênh bên ngoài
  - H3: Control UI / web
  - H2: Khi nào dùng BTW
  - H2: Khi nào không nên dùng BTW
  - H2: Liên quan

## tools/capability-cookbook.md

- Đường dẫn: /tools/capability-cookbook
- Tiêu đề:
  - H2: Liên quan

## tools/clawhub.md

- Đường dẫn: /tools/clawhub
- Tiêu đề: không có

## tools/code-execution.md

- Đường dẫn: /tools/code-execution
- Tiêu đề:
  - H2: Thiết lập
  - H2: Cách dùng
  - H2: Lỗi
  - H2: Giới hạn
  - H2: Liên quan

## tools/creating-skills.md

- Đường dẫn: /tools/creating-skills
- Tiêu đề:
  - H2: Tạo skill đầu tiên của bạn
  - H2: Tham chiếu SKILL.md
  - H3: Trường bắt buộc
  - H3: Khóa frontmatter tùy chọn
  - H3: Sử dụng {baseDir}
  - H2: Thêm kích hoạt có điều kiện
  - H2: Đề xuất qua Skill Workshop
  - H2: Xuất bản lên ClawHub
  - H2: Thực hành tốt nhất
  - H2: Liên quan

## tools/diffs.md

- Đường dẫn: /tools/diffs
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

- Đường dẫn: /tools/duckduckgo-search
- Tiêu đề:
  - H2: Thiết lập
  - H2: Cấu hình
  - H2: Tham số công cụ
  - H2: Ghi chú
  - H2: Liên quan

## tools/elevated.md

- Đường dẫn: /tools/elevated
- Tiêu đề:
  - H2: Chỉ thị
  - H2: Cách hoạt động
  - H2: Thứ tự phân giải
  - H2: Tính khả dụng và danh sách cho phép
  - H2: Những gì elevated không kiểm soát
  - H2: Liên quan

## tools/exa-search.md

- Đường dẫn: /tools/exa-search
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

- Đường dẫn: /tools/exec-approvals-advanced
- Tiêu đề:
  - H2: Binary an toàn (chỉ stdin)
  - H3: Xác thực argv và cờ bị từ chối
  - H3: Thư mục binary đáng tin cậy
  - H3: Nối lệnh shell, wrapper và multiplexer
  - H3: Binary an toàn so với danh sách cho phép
  - H2: Lệnh trình thông dịch/runtime
  - H3: Hành vi phân phối follow-up
  - H2: Chuyển tiếp phê duyệt đến kênh chat
  - H3: Chuyển tiếp phê duyệt Plugin
  - H3: Phê duyệt trong cùng chat trên mọi kênh
  - H3: Phân phối phê duyệt gốc
  - H3: Luồng IPC macOS
  - H2: FAQ
  - H3: Khi nào accountId và threadId được dùng trên đích phê duyệt?
  - H3: Khi phê duyệt được gửi đến một phiên, bất kỳ ai trong phiên đó có thể phê duyệt không?
  - H2: Liên quan

## tools/exec-approvals.md

- Đường dẫn: /tools/exec-approvals
- Tiêu đề:
  - H2: Kiểm tra chính sách hiệu lực
  - H2: Phạm vi áp dụng
  - H3: Mô hình tin cậy
  - H3: Phân tách macOS
  - H2: Cài đặt và lưu trữ
  - H2: Núm chỉnh chính sách
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Chế độ YOLO (không cần phê duyệt)
  - H3: Thiết lập "không bao giờ nhắc" bền vững trên gateway-host
  - H3: Lối tắt cục bộ
  - H3: Máy chủ Node
  - H3: Lối tắt chỉ cho phiên
  - H2: Danh sách cho phép (theo agent)
  - H3: Hạn chế đối số bằng argPattern
  - H2: Tự động cho phép CLI của skill
  - H2: Binary an toàn và chuyển tiếp phê duyệt
  - H2: Chỉnh sửa trong Control UI
  - H2: Luồng phê duyệt
  - H2: Sự kiện hệ thống
  - H2: Hành vi khi phê duyệt bị từ chối
  - H2: Hệ quả
  - H2: Liên quan

## tools/exec.md

- Đường dẫn: /tools/exec
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

- Đường dẫn: /tools/firecrawl
- Tiêu đề:
  - H2: Cài đặt Plugin
  - H2: webfetch không cần khóa và khóa API
  - H2: Cấu hình tìm kiếm Firecrawl
  - H2: Cấu hình dự phòng webfetch Firecrawl
  - H3: Firecrawl tự lưu trữ
  - H2: Công cụ Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / vượt qua bot
  - H2: Cách webfetch dùng Firecrawl
  - H2: Liên quan

## tools/gemini-search.md

- Đường dẫn: /tools/gemini-search
- Tiêu đề:
  - H2: Lấy khóa API
  - H2: Cấu hình
  - H2: Cách hoạt động
  - H2: Tham số được hỗ trợ
  - H2: Lựa chọn mô hình
  - H2: Ghi đè URL cơ sở
  - H2: Liên quan

## tools/goal.md

- Đường dẫn: /tools/goal
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

- Đường dẫn: /tools/grok-search
- Tiêu đề:
  - H2: Onboarding và cấu hình
  - H2: Đăng nhập hoặc lấy khóa API
  - H2: Cấu hình
  - H2: Cách hoạt động
  - H2: Tham số được hỗ trợ
  - H2: Ghi đè URL cơ sở
  - H2: Liên quan

## tools/image-generation.md

- Đường dẫn: /tools/image-generation
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Tuyến phổ biến
  - H2: Nhà cung cấp được hỗ trợ
  - H2: Khả năng của nhà cung cấp
  - H2: Tham số công cụ
  - H2: Cấu hình
  - H3: Lựa chọn mô hình
  - H3: Thứ tự lựa chọn nhà cung cấp
  - H3: Chỉnh sửa hình ảnh
  - H2: Phân tích sâu nhà cung cấp
  - H2: Ví dụ
  - H2: Liên quan

## tools/index.md

- Đường dẫn: /tools
- Tiêu đề:
  - H2: Bắt đầu tại đây
  - H2: Chọn công cụ, Skills hoặc plugin
  - H2: Danh mục công cụ tích hợp
  - H2: Công cụ do Plugin cung cấp
  - H2: Cấu hình quyền truy cập và phê duyệt
  - H2: Mở rộng khả năng
  - H2: Khắc phục sự cố thiếu công cụ
  - H2: Liên quan

## tools/kimi-search.md

- Đường dẫn: /tools/kimi-search
- Tiêu đề:
  - H2: Lấy khóa API
  - H2: Cấu hình
  - H2: Cách hoạt động
  - H2: Tham số được hỗ trợ
  - H2: Liên quan

## tools/llm-task.md

- Đường dẫn: /tools/llm-task
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

- Đường dẫn: /tools/lobster
- Tiêu đề:
  - H2: Hook
  - H2: Lý do
  - H2: Vì sao dùng DSL thay vì chương trình thuần?
  - H2: Cách hoạt động
  - H2: Mẫu: CLI nhỏ + pipe JSON + phê duyệt
  - H2: Bước LLM chỉ JSON (llm-task)
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

- Đường dẫn: /tools/loop-detection
- Tiêu đề:
  - H2: Vì sao tính năng này tồn tại
  - H2: Khối cấu hình
  - H3: Hành vi trường
  - H2: Thiết lập khuyến nghị
  - H2: Bộ bảo vệ sau Compaction
  - H2: Nhật ký và hành vi dự kiến
  - H2: Liên quan

## tools/media-overview.md

- Tuyến: /tools/media-overview
- Tiêu đề:
  - H2: Khả năng
  - H2: Ma trận khả năng của nhà cung cấp
  - H2: Bất đồng bộ so với đồng bộ
  - H2: Chuyển lời nói thành văn bản và Voice Call
  - H2: Ánh xạ nhà cung cấp (cách các nhà cung cấp phân tách giữa các bề mặt)
  - H2: Liên quan

## tools/minimax-search.md

- Tuyến: /tools/minimax-search
- Tiêu đề:
  - H2: Lấy thông tin xác thực Token Plan
  - H2: Cấu hình
  - H2: Chọn khu vực
  - H2: Tham số được hỗ trợ
  - H2: Liên quan

## tools/multi-agent-sandbox-tools.md

- Tuyến: /tools/multi-agent-sandbox-tools
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

- Tuyến: /tools/music-generation
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
  - H2: Chọn đường dẫn phù hợp
  - H2: Chế độ khả năng của nhà cung cấp
  - H2: Kiểm thử trực tiếp
  - H2: Liên quan

## tools/ollama-search.md

- Tuyến: /tools/ollama-search
- Tiêu đề:
  - H2: Thiết lập
  - H2: Cấu hình
  - H2: Ghi chú
  - H2: Liên quan

## tools/parallel-search.md

- Tuyến: /tools/parallel-search
- Tiêu đề:
  - H2: Cài đặt plugin
  - H2: Khóa API (nhà cung cấp trả phí)
  - H2: Cấu hình
  - H2: Ghi đè URL cơ sở
  - H2: Tham số công cụ
  - H2: Ghi chú
  - H2: Liên quan

## tools/pdf.md

- Tuyến: /tools/pdf
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

- Tuyến: /tools/permission-modes
- Tiêu đề:
  - H2: Mặc định khuyến nghị
  - H2: Chế độ thực thi máy chủ OpenClaw
  - H2: Ánh xạ Codex Guardian
  - H2: Quyền harness ACPX
  - H2: Chọn chế độ
  - H2: Liên quan

## tools/perplexity-search.md

- Tuyến: /tools/perplexity-search
- Tiêu đề:
  - H2: Cài đặt plugin
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

- Tuyến: /tools/plugin
- Tiêu đề:
  - H2: Yêu cầu
  - H2: Bắt đầu nhanh
  - H2: Cấu hình
  - H3: Chọn nguồn cài đặt
  - H3: Chính sách cài đặt của người vận hành
  - H3: Cấu hình chính sách plugin
  - H2: Hiểu các định dạng plugin
  - H2: Hook plugin
  - H2: Xác minh Gateway đang hoạt động
  - H2: Khắc phục sự cố
  - H3: Quyền sở hữu đường dẫn plugin bị chặn
  - H3: Thiết lập công cụ plugin chậm
  - H2: Liên quan

## tools/reactions.md

- Tuyến: /tools/reactions
- Tiêu đề:
  - H2: Cách hoạt động
  - H2: Hành vi kênh
  - H2: Cấp phản ứng
  - H2: Liên quan

## tools/searxng-search.md

- Tuyến: /tools/searxng-search
- Tiêu đề:
  - H2: Thiết lập
  - H2: Cấu hình
  - H2: Biến môi trường
  - H2: Tham chiếu cấu hình plugin
  - H2: Ghi chú
  - H2: Liên quan

## tools/skill-workshop.md

- Tuyến: /tools/skill-workshop
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

- Tuyến: /tools/skills-config
- Tiêu đề:
  - H2: Tải (skills.load)
  - H2: Cài đặt (skills.install)
  - H2: Chính sách cài đặt của người vận hành (security.installPolicy)
  - H2: Danh sách cho phép skill đi kèm
  - H2: Mục theo từng skill (skills.entries)
  - H2: Danh sách cho phép tác nhân (agents)
  - H2: Workshop (skills.workshop)
  - H2: Gốc skill được liên kết tượng trưng
  - H2: Skills trong sandbox và biến môi trường
  - H2: Nhắc lại thứ tự tải
  - H2: Liên quan

## tools/skills.md

- Tuyến: /tools/skills
- Tiêu đề:
  - H2: Thứ tự tải
  - H2: Skills theo từng tác nhân so với dùng chung
  - H2: Danh sách cho phép tác nhân
  - H2: Plugins và skills
  - H2: Skill Workshop
  - H2: Cài đặt từ ClawHub
  - H2: Bảo mật
  - H2: Định dạng SKILL.md
  - H3: Khóa frontmatter tùy chọn
  - H2: Kiểm soát điều kiện
  - H3: Thông số trình cài đặt
  - H2: Ghi đè cấu hình
  - H2: Tiêm biến môi trường
  - H2: Ảnh chụp nhanh và làm mới
  - H2: Tác động token
  - H2: Liên quan

## tools/slash-commands.md

- Tuyến: /tools/slash-commands
- Tiêu đề:
  - H2: Ba loại lệnh
  - H2: Cấu hình
  - H2: Danh sách lệnh
  - H3: Lệnh lõi
  - H3: Lệnh Dock
  - H3: Lệnh plugin đi kèm
  - H3: Lệnh skill
  - H2: /tools — tác nhân có thể dùng gì lúc này
  - H2: /model — chọn mô hình
  - H2: /config — ghi cấu hình trên đĩa
  - H2: /mcp — cấu hình máy chủ MCP
  - H2: /debug — ghi đè chỉ trong runtime
  - H2: /plugins — quản lý plugin
  - H2: /trace — đầu ra truy vết plugin
  - H2: /btw — câu hỏi phụ
  - H2: Ghi chú bề mặt
  - H2: Mức sử dụng và trạng thái nhà cung cấp
  - H2: Liên quan

## tools/steer.md

- Tuyến: /tools/steer
- Tiêu đề:
  - H2: Phiên hiện tại
  - H2: Điều hướng so với hàng đợi
  - H2: Tác nhân phụ
  - H2: Phiên ACP
  - H2: Liên quan

## tools/subagents.md

- Tuyến: /tools/subagents
- Tiêu đề:
  - H2: Lệnh slash
  - H3: Điều khiển ràng buộc luồng
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
  - H3: Cấp độ sâu
  - H3: Chuỗi thông báo
  - H3: Chính sách công cụ theo độ sâu
  - H3: Giới hạn tạo mới theo từng tác nhân
  - H3: Dừng lan truyền
  - H2: Xác thực
  - H2: Thông báo
  - H3: Ngữ cảnh thông báo
  - H3: Dòng thống kê
  - H3: Vì sao nên ưu tiên sessionshistory
  - H2: Chính sách công cụ
  - H3: Ghi đè qua cấu hình
  - H2: Đồng thời
  - H2: Tình trạng hoạt động và khôi phục
  - H2: Dừng
  - H2: Hạn chế
  - H2: Liên quan

## tools/tavily.md

- Tuyến: /tools/tavily
- Tiêu đề:
  - H2: Bắt đầu
  - H2: Tham chiếu công cụ
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Chọn công cụ phù hợp
  - H2: Cấu hình nâng cao
  - H2: Liên quan

## tools/thinking.md

- Tuyến: /tools/thinking
- Tiêu đề:
  - H2: Công dụng
  - H2: Thứ tự phân giải
  - H2: Đặt mặc định phiên
  - H2: Áp dụng theo tác nhân
  - H2: Chế độ nhanh (/fast)
  - H2: Chỉ thị chi tiết (/verbose hoặc /v)
  - H2: Chỉ thị truy vết plugin (/trace)
  - H2: Hiển thị lập luận (/reasoning)
  - H2: Liên quan
  - H2: Heartbeats
  - H2: Giao diện trò chuyện web
  - H2: Hồ sơ nhà cung cấp

## tools/tokenjuice.md

- Tuyến: /tools/tokenjuice
- Tiêu đề:
  - H2: Bật plugin
  - H2: tokenjuice thay đổi gì
  - H2: Xác minh nó đang hoạt động
  - H2: Tắt plugin
  - H2: Liên quan

## tools/tool-search.md

- Tuyến: /tools/tool-search
- Tiêu đề:
  - H2: Cách một lượt chạy
  - H2: Chế độ
  - H2: Vì sao tồn tại
  - H2: API
  - H2: Ranh giới runtime
  - H2: Cấu hình
  - H2: Lời nhắc và telemetry
  - H2: Xác thực E2E
  - H2: Hành vi lỗi
  - H2: Liên quan

## tools/trajectory.md

- Tuyến: /tools/trajectory
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Quyền truy cập
  - H2: Nội dung được ghi lại
  - H2: Tệp bundle
  - H2: Vị trí ghi lại
  - H2: Tắt ghi lại
  - H2: Điều chỉnh thời gian chờ flush
  - H2: Quyền riêng tư và giới hạn
  - H2: Khắc phục sự cố
  - H2: Liên quan

## tools/tts.md

- Tuyến: /tools/tts
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
  - H2: Hành vi TTS tự động
  - H2: Định dạng đầu ra theo kênh
  - H2: Tham chiếu trường
  - H2: Công cụ tác nhân
  - H2: Gateway RPC
  - H2: Liên kết dịch vụ
  - H2: Liên quan

## tools/video-generation.md

- Tuyến: /tools/video-generation
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Cách tạo bất đồng bộ hoạt động
  - H3: Vòng đời tác vụ
  - H2: Nhà cung cấp được hỗ trợ
  - H3: Ma trận khả năng
  - H2: Tham số công cụ
  - H3: Bắt buộc
  - H3: Đầu vào nội dung
  - H3: Điều khiển phong cách
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

- Tuyến: /tools/web-fetch
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H2: Tham số công cụ
  - H2: Cách hoạt động
  - H2: Cập nhật tiến độ
  - H2: Cấu hình
  - H2: Dự phòng Firecrawl
  - H2: Proxy env tin cậy
  - H2: Giới hạn và an toàn
  - H2: Hồ sơ công cụ
  - H2: Liên quan

## tools/web.md

- Tuyến: /tools/web
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

- Tuyến: /tts
- Tiêu đề:
  - H2: Liên quan

## vps.md

- Tuyến: /vps
- Tiêu đề:
  - H2: Chọn nhà cung cấp
  - H2: Cách thiết lập đám mây hoạt động
  - H2: Gia cố quyền truy cập quản trị trước
  - H2: Tác nhân công ty dùng chung trên VPS
  - H2: Dùng nút với VPS
  - H2: Tinh chỉnh khởi động cho VM nhỏ và máy chủ ARM
  - H3: Danh sách kiểm tra tinh chỉnh systemd (tùy chọn)
  - H2: Liên quan

## web/control-ui.md

- Tuyến: /web/control-ui
- Tiêu đề:
  - H2: Mở nhanh (cục bộ)
  - H2: Ghép cặp thiết bị (kết nối đầu tiên)
  - H2: Danh tính cá nhân (cục bộ trong trình duyệt)
  - H2: Điểm cuối cấu hình runtime
  - H2: Hỗ trợ ngôn ngữ
  - H2: Chủ đề giao diện
  - H2: Những gì có thể làm (hiện nay)
  - H2: Trang MCP
  - H2: Tab hoạt động
  - H2: Hành vi trò chuyện
  - H2: Cài đặt PWA và web push
  - H2: Nhúng được lưu trữ
  - H2: Độ rộng tin nhắn trò chuyện
  - H2: Truy cập Tailnet (khuyến nghị)
  - H2: HTTP không an toàn
  - H2: Chính sách bảo mật nội dung
  - H2: Xác thực tuyến avatar
  - H2: Xác thực tuyến phương tiện trợ lý
  - H2: Xây dựng giao diện
  - H2: Trang Control UI trống
  - H2: Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa
  - H2: Liên quan

## web/dashboard.md

- Tuyến: /web/dashboard
- Tiêu đề:
  - H2: Đường dẫn nhanh (khuyến nghị)
  - H2: Cơ bản về xác thực (cục bộ so với từ xa)
  - H2: Nếu bạn thấy "unauthorized" / 1008
  - H2: Liên quan

## web/index.md

- Tuyến: /web
- Tiêu đề:
  - H2: Webhooks
  - H2: RPC HTTP quản trị
  - H2: Cấu hình (bật theo mặc định)
  - H2: Truy cập Tailscale
  - H3: Serve tích hợp (khuyến nghị)
  - H3: Ràng buộc Tailnet + token
  - H3: Internet công cộng (Funnel)
  - H2: Ghi chú bảo mật
  - H2: Xây dựng giao diện

## web/tui.md

- Tuyến: /web/tui
- Tiêu đề:
  - H2: Bắt đầu nhanh
  - H3: Chế độ Gateway
  - H3: Chế độ cục bộ
  - H2: Những gì bạn thấy
  - H2: Mô hình tư duy: tác nhân + phiên
  - H2: Gửi + phân phối
  - H2: Bộ chọn + lớp phủ
  - H2: Phím tắt bàn phím
  - H2: Lệnh slash
  - H2: Lệnh shell cục bộ
  - H2: Sửa cấu hình từ TUI cục bộ
  - H2: Đầu ra công cụ
  - H2: Màu terminal
  - H2: Lịch sử + streaming
  - H2: Chi tiết kết nối
  - H2: Tùy chọn
  - H2: Khắc phục sự cố
  - H2: Khắc phục sự cố kết nối
  - H2: Liên quan

## web/webchat.md

- Tuyến: /web/webchat
- Tiêu đề:
  - H2: Nó là gì
  - H2: Bắt đầu nhanh
  - H2: Cách hoạt động (hành vi)
  - H3: Transcript và mô hình phân phối
  - H2: Bảng công cụ tác nhân Control UI
  - H2: Sử dụng từ xa
  - H2: Tham chiếu cấu hình (WebChat)
  - H2: Liên quan
