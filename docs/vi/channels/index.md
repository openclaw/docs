---
read_when:
    - Bạn muốn chọn một kênh trò chuyện cho OpenClaw
    - Bạn cần tổng quan nhanh về các nền tảng nhắn tin được hỗ trợ
summary: Các nền tảng nhắn tin mà OpenClaw có thể kết nối tới
title: Kênh trò chuyện
x-i18n:
    generated_at: "2026-05-07T01:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff6875f4ae86b341b6a82e13f022266461bc102ee03074a8c352eea2203d657a
    source_path: channels/index.md
    workflow: 16
---

OpenClaw có thể trò chuyện với bạn trên bất kỳ ứng dụng chat nào bạn đang dùng. Mỗi kênh kết nối qua Gateway.
Văn bản được hỗ trợ ở mọi nơi; phương tiện và phản ứng khác nhau tùy theo kênh.

## Ghi chú về gửi nhận

- Các phản hồi Telegram chứa cú pháp hình ảnh markdown, chẳng hạn như `![alt](url)`,
  sẽ được chuyển thành phản hồi phương tiện trên đường gửi ra cuối cùng khi có thể.
- DM nhiều người của Slack được định tuyến như chat nhóm, nên chính sách nhóm, hành vi
  nhắc đến, và quy tắc phiên nhóm áp dụng cho các cuộc trò chuyện MPIM.
- Thiết lập WhatsApp là cài đặt theo nhu cầu: onboarding có thể hiển thị luồng thiết lập trước khi
  gói Plugin được cài đặt, và Gateway chỉ tải runtime WhatsApp
  khi kênh thực sự hoạt động.

## Kênh được hỗ trợ

- [BlueBubbles](/vi/channels/bluebubbles) - Cầu nối iMessage cũ qua REST API của máy chủ BlueBubbles macOS; không còn khuyến nghị cho thiết lập OpenClaw mới nhưng vẫn được hỗ trợ cho cấu hình hiện có và các hành động private-API phong phú hơn.
- [Discord](/vi/channels/discord) - Discord Bot API + Gateway; hỗ trợ máy chủ, kênh, và DM.
- [Feishu](/vi/channels/feishu) - Bot Feishu/Lark qua WebSocket (Plugin đi kèm).
- [Google Chat](/vi/channels/googlechat) - Ứng dụng Google Chat API qua Webhook HTTP (Plugin có thể tải xuống).
- [iMessage](/vi/channels/imessage) - Tích hợp macOS gốc qua CLI imsg; được ưu tiên cho thiết lập OpenClaw iMessage mới khi quyền máy chủ và quyền truy cập Messages phù hợp.
- [IRC](/vi/channels/irc) - Máy chủ IRC cổ điển; kênh + DM với điều khiển ghép đôi/danh sách cho phép.
- [LINE](/vi/channels/line) - Bot LINE Messaging API (Plugin có thể tải xuống).
- [Matrix](/vi/channels/matrix) - Giao thức Matrix (Plugin có thể tải xuống).
- [Mattermost](/vi/channels/mattermost) - Bot API + WebSocket; kênh, nhóm, DM (Plugin có thể tải xuống).
- [Microsoft Teams](/vi/channels/msteams) - Bot Framework; hỗ trợ doanh nghiệp (Plugin đi kèm).
- [Nextcloud Talk](/vi/channels/nextcloud-talk) - Chat tự lưu trữ qua Nextcloud Talk (Plugin đi kèm).
- [Nostr](/vi/channels/nostr) - DM phi tập trung qua NIP-04 (Plugin đi kèm).
- [QQ Bot](/vi/channels/qqbot) - QQ Bot API; chat riêng, chat nhóm, và phương tiện phong phú (Plugin đi kèm).
- [Signal](/vi/channels/signal) - signal-cli; tập trung vào quyền riêng tư.
- [Slack](/vi/channels/slack) - Bolt SDK; ứng dụng workspace.
- [Synology Chat](/vi/channels/synology-chat) - Synology NAS Chat qua Webhook gửi đi + gửi đến (Plugin đi kèm).
- [Telegram](/vi/channels/telegram) - Bot API qua grammY; hỗ trợ nhóm.
- [Tlon](/vi/channels/tlon) - Trình nhắn tin dựa trên Urbit (Plugin đi kèm).
- [Twitch](/vi/channels/twitch) - Chat Twitch qua kết nối IRC (Plugin đi kèm).
- [Voice Call](/vi/plugins/voice-call) - Điện thoại qua Plivo hoặc Twilio (Plugin, cài đặt riêng).
- [WebChat](/vi/web/webchat) - Giao diện WebChat của Gateway qua WebSocket.
- [WeChat](/vi/channels/wechat) - Plugin Tencent iLink Bot qua đăng nhập QR; chỉ chat riêng (Plugin bên ngoài).
- [WhatsApp](/vi/channels/whatsapp) - Phổ biến nhất; dùng Baileys và yêu cầu ghép đôi QR.
- [Yuanbao](/vi/channels/yuanbao) - Bot Tencent Yuanbao (Plugin bên ngoài).
- [Zalo](/vi/channels/zalo) - Zalo Bot API; trình nhắn tin phổ biến của Việt Nam (Plugin đi kèm).
- [Zalo Personal](/vi/channels/zalouser) - Tài khoản cá nhân Zalo qua đăng nhập QR (Plugin đi kèm).

## Ghi chú

- Các kênh có thể chạy đồng thời; cấu hình nhiều kênh và OpenClaw sẽ định tuyến theo từng chat.
- Thiết lập nhanh nhất thường là **Telegram** (token bot đơn giản). WhatsApp yêu cầu ghép đôi QR và
  lưu nhiều trạng thái hơn trên đĩa.
- Hành vi nhóm khác nhau tùy theo kênh; xem [Nhóm](/vi/channels/groups).
- Ghép đôi DM và danh sách cho phép được thực thi vì an toàn; xem [Bảo mật](/vi/gateway/security).
- Khắc phục sự cố: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).
- Nhà cung cấp mô hình được tài liệu hóa riêng; xem [Nhà cung cấp mô hình](/vi/providers/models).
