---
read_when:
    - Bạn muốn chọn một kênh trò chuyện cho OpenClaw
    - Bạn cần tổng quan nhanh về các nền tảng nhắn tin được hỗ trợ
summary: Các nền tảng nhắn tin mà OpenClaw có thể kết nối tới
title: Kênh trò chuyện
x-i18n:
    generated_at: "2026-05-06T09:02:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c357a9dfabf12329954f30084fe9abfad9aa96f62bcd72b3d0802819d5979d7b
    source_path: channels/index.md
    workflow: 16
---

OpenClaw có thể trò chuyện với bạn trên bất kỳ ứng dụng chat nào bạn đang dùng. Mỗi kênh kết nối thông qua Gateway.
Văn bản được hỗ trợ ở mọi nơi; media và phản ứng khác nhau tùy theo kênh.

## Ghi chú gửi tin

- Các phản hồi Telegram chứa cú pháp hình ảnh markdown, chẳng hạn như `![alt](url)`,
  sẽ được chuyển thành phản hồi media trên đường gửi đi cuối cùng khi có thể.
- DM nhiều người trên Slack được định tuyến như chat nhóm, nên chính sách nhóm, hành vi
  nhắc tên và quy tắc phiên nhóm áp dụng cho các cuộc trò chuyện MPIM.
- Thiết lập WhatsApp là cài đặt theo nhu cầu: onboarding có thể hiển thị luồng thiết lập trước
  khi gói Plugin được cài đặt, và Gateway chỉ tải runtime WhatsApp
  khi kênh thực sự đang hoạt động.

## Kênh được hỗ trợ

- [BlueBubbles](/vi/channels/bluebubbles) - **Được khuyến nghị cho iMessage**; dùng REST API của máy chủ BlueBubbles macOS với hỗ trợ đầy đủ tính năng (Plugin đi kèm; chỉnh sửa, hủy gửi, hiệu ứng, phản ứng, quản lý nhóm - chỉnh sửa hiện đang hỏng trên macOS 26 Tahoe).
- [Discord](/vi/channels/discord) - Discord Bot API + Gateway; hỗ trợ máy chủ, kênh và DM.
- [Feishu](/vi/channels/feishu) - bot Feishu/Lark qua WebSocket (Plugin đi kèm).
- [Google Chat](/vi/channels/googlechat) - ứng dụng Google Chat API qua HTTP webhook (Plugin có thể tải xuống).
- [iMessage (legacy)](/vi/channels/imessage) - Tích hợp macOS cũ qua imsg CLI (không còn được khuyến nghị, dùng BlueBubbles cho thiết lập mới).
- [IRC](/vi/channels/irc) - Máy chủ IRC cổ điển; kênh + DM với điều khiển ghép đôi/danh sách cho phép.
- [LINE](/vi/channels/line) - bot LINE Messaging API (Plugin có thể tải xuống).
- [Matrix](/vi/channels/matrix) - Giao thức Matrix (Plugin có thể tải xuống).
- [Mattermost](/vi/channels/mattermost) - Bot API + WebSocket; kênh, nhóm, DM (Plugin có thể tải xuống).
- [Microsoft Teams](/vi/channels/msteams) - Bot Framework; hỗ trợ doanh nghiệp (Plugin đi kèm).
- [Nextcloud Talk](/vi/channels/nextcloud-talk) - Chat tự lưu trữ qua Nextcloud Talk (Plugin đi kèm).
- [Nostr](/vi/channels/nostr) - DM phi tập trung qua NIP-04 (Plugin đi kèm).
- [QQ Bot](/vi/channels/qqbot) - QQ Bot API; chat riêng, chat nhóm và media phong phú (Plugin đi kèm).
- [Signal](/vi/channels/signal) - signal-cli; tập trung vào quyền riêng tư.
- [Slack](/vi/channels/slack) - Bolt SDK; ứng dụng workspace.
- [Synology Chat](/vi/channels/synology-chat) - Synology NAS Chat qua webhook gửi đi+nhận vào (Plugin đi kèm).
- [Telegram](/vi/channels/telegram) - Bot API qua grammY; hỗ trợ nhóm.
- [Tlon](/vi/channels/tlon) - Trình nhắn tin dựa trên Urbit (Plugin đi kèm).
- [Twitch](/vi/channels/twitch) - Chat Twitch qua kết nối IRC (Plugin đi kèm).
- [Voice Call](/vi/plugins/voice-call) - Điện thoại qua Plivo hoặc Twilio (Plugin, cài đặt riêng).
- [WebChat](/vi/web/webchat) - Giao diện WebChat của Gateway qua WebSocket.
- [WeChat](/vi/channels/wechat) - Plugin Tencent iLink Bot qua đăng nhập QR; chỉ chat riêng (Plugin bên ngoài).
- [WhatsApp](/vi/channels/whatsapp) - Phổ biến nhất; dùng Baileys và yêu cầu ghép đôi QR.
- [Yuanbao](/vi/channels/yuanbao) - bot Tencent Yuanbao (Plugin bên ngoài).
- [Zalo](/vi/channels/zalo) - Zalo Bot API; trình nhắn tin phổ biến của Việt Nam (Plugin đi kèm).
- [Zalo Personal](/vi/channels/zalouser) - Tài khoản cá nhân Zalo qua đăng nhập QR (Plugin đi kèm).

## Ghi chú

- Các kênh có thể chạy đồng thời; cấu hình nhiều kênh và OpenClaw sẽ định tuyến theo từng chat.
- Thiết lập nhanh nhất thường là **Telegram** (token bot đơn giản). WhatsApp yêu cầu ghép đôi QR và
  lưu nhiều trạng thái hơn trên đĩa.
- Hành vi nhóm khác nhau tùy theo kênh; xem [Nhóm](/vi/channels/groups).
- Ghép đôi DM và danh sách cho phép được thực thi để bảo đảm an toàn; xem [Bảo mật](/vi/gateway/security).
- Khắc phục sự cố: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).
- Nhà cung cấp mô hình được ghi tài liệu riêng; xem [Nhà cung cấp mô hình](/vi/providers/models).
