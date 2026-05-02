---
read_when:
    - Bạn muốn chọn một kênh trò chuyện cho OpenClaw
    - Bạn cần tổng quan nhanh về các nền tảng nhắn tin được hỗ trợ
summary: Các nền tảng nhắn tin mà OpenClaw có thể kết nối tới
title: Kênh trò chuyện
x-i18n:
    generated_at: "2026-05-02T10:33:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 785af727e9491914f5a9459672d47c2cfde3319b318c698051cd7e89d023d4b9
    source_path: channels/index.md
    workflow: 16
---

OpenClaw có thể trò chuyện với bạn trên bất kỳ ứng dụng chat nào bạn đang dùng. Mỗi kênh kết nối thông qua Gateway.
Văn bản được hỗ trợ ở mọi nơi; media và phản ứng khác nhau tùy theo kênh.

## Ghi chú về gửi nhận

- Các phản hồi Telegram chứa cú pháp hình ảnh markdown, chẳng hạn như `![alt](url)`,
  sẽ được chuyển thành phản hồi media trên đường gửi ra cuối cùng khi có thể.
- DM nhiều người của Slack được định tuyến như chat nhóm, vì vậy chính sách nhóm, hành vi nhắc tên
  và quy tắc phiên nhóm áp dụng cho các cuộc trò chuyện MPIM.
- Thiết lập WhatsApp là cài đặt theo nhu cầu: onboarding có thể hiển thị luồng thiết lập trước khi
  gói Plugin được cài đặt, và Gateway chỉ tải runtime WhatsApp
  khi kênh thực sự hoạt động.

## Kênh được hỗ trợ

- [BlueBubbles](/vi/channels/bluebubbles) — **Được khuyến nghị cho iMessage**; sử dụng REST API của máy chủ BlueBubbles trên macOS với hỗ trợ đầy đủ tính năng (Plugin đi kèm; sửa, thu hồi, hiệu ứng, phản ứng, quản lý nhóm — tính năng sửa hiện bị lỗi trên macOS 26 Tahoe).
- [Discord](/vi/channels/discord) — Discord Bot API + Gateway; hỗ trợ máy chủ, kênh và DM.
- [Feishu](/vi/channels/feishu) — Bot Feishu/Lark qua WebSocket (Plugin đi kèm).
- [Google Chat](/vi/channels/googlechat) — Ứng dụng Google Chat API qua HTTP webhook (Plugin có thể tải xuống).
- [iMessage (legacy)](/vi/channels/imessage) — Tích hợp macOS cũ qua imsg CLI (không còn khuyến nghị, dùng BlueBubbles cho thiết lập mới).
- [IRC](/vi/channels/irc) — Máy chủ IRC cổ điển; kênh + DM với kiểm soát ghép nối/danh sách cho phép.
- [LINE](/vi/channels/line) — Bot LINE Messaging API (Plugin có thể tải xuống).
- [Matrix](/vi/channels/matrix) — Giao thức Matrix (Plugin có thể tải xuống).
- [Mattermost](/vi/channels/mattermost) — Bot API + WebSocket; kênh, nhóm, DM (Plugin có thể tải xuống).
- [Microsoft Teams](/vi/channels/msteams) — Bot Framework; hỗ trợ doanh nghiệp (Plugin đi kèm).
- [Nextcloud Talk](/vi/channels/nextcloud-talk) — Chat tự lưu trữ qua Nextcloud Talk (Plugin đi kèm).
- [Nostr](/vi/channels/nostr) — DM phi tập trung qua NIP-04 (Plugin đi kèm).
- [QQ Bot](/vi/channels/qqbot) — QQ Bot API; chat riêng, chat nhóm và media phong phú (Plugin đi kèm).
- [Signal](/vi/channels/signal) — signal-cli; tập trung vào quyền riêng tư.
- [Slack](/vi/channels/slack) — Bolt SDK; ứng dụng workspace.
- [Synology Chat](/vi/channels/synology-chat) — Synology NAS Chat qua webhook gửi đi+nhận vào (Plugin đi kèm).
- [Telegram](/vi/channels/telegram) — Bot API qua grammY; hỗ trợ nhóm.
- [Tlon](/vi/channels/tlon) — Trình nhắn tin dựa trên Urbit (Plugin đi kèm).
- [Twitch](/vi/channels/twitch) — Chat Twitch qua kết nối IRC (Plugin đi kèm).
- [Voice Call](/vi/plugins/voice-call) — Điện thoại qua Plivo hoặc Twilio (Plugin, được cài đặt riêng).
- [WebChat](/vi/web/webchat) — Giao diện Gateway WebChat qua WebSocket.
- [WeChat](/vi/channels/wechat) — Plugin Tencent iLink Bot qua đăng nhập QR; chỉ chat riêng (Plugin bên ngoài).
- [WhatsApp](/vi/channels/whatsapp) — Phổ biến nhất; dùng Baileys và yêu cầu ghép nối QR.
- [Yuanbao](/vi/channels/yuanbao) — Bot Tencent Yuanbao (Plugin bên ngoài).
- [Zalo](/vi/channels/zalo) — Zalo Bot API; ứng dụng nhắn tin phổ biến tại Việt Nam (Plugin đi kèm).
- [Zalo Personal](/vi/channels/zalouser) — Tài khoản cá nhân Zalo qua đăng nhập QR (Plugin đi kèm).

## Ghi chú

- Các kênh có thể chạy đồng thời; cấu hình nhiều kênh và OpenClaw sẽ định tuyến theo từng chat.
- Thiết lập nhanh nhất thường là **Telegram** (token bot đơn giản). WhatsApp yêu cầu ghép nối QR và
  lưu nhiều trạng thái hơn trên đĩa.
- Hành vi nhóm khác nhau tùy theo kênh; xem [Nhóm](/vi/channels/groups).
- Ghép nối DM và danh sách cho phép được thực thi để đảm bảo an toàn; xem [Bảo mật](/vi/gateway/security).
- Khắc phục sự cố: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).
- Nhà cung cấp mô hình được ghi lại riêng; xem [Nhà cung cấp mô hình](/vi/providers/models).
