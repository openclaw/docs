---
read_when:
    - Bạn muốn chọn một kênh trò chuyện cho OpenClaw
    - Bạn cần một tổng quan nhanh về các nền tảng nhắn tin được hỗ trợ
summary: Các nền tảng nhắn tin mà OpenClaw có thể kết nối
title: Kênh chat
x-i18n:
    generated_at: "2026-06-27T17:10:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw có thể trò chuyện với bạn trên bất kỳ ứng dụng chat nào bạn đang dùng. Mỗi kênh kết nối qua Gateway.
Văn bản được hỗ trợ ở mọi nơi; phương tiện và phản ứng khác nhau tùy theo kênh.

## Ghi chú về gửi nhận

- Các phản hồi Telegram chứa cú pháp hình ảnh Markdown, chẳng hạn như `![alt](url)`,
  được chuyển đổi thành phản hồi phương tiện trên đường gửi đi cuối cùng khi có thể.
- DM nhiều người của Slack được định tuyến như chat nhóm, nên chính sách nhóm, hành vi
  nhắc tên và quy tắc phiên nhóm áp dụng cho các cuộc trò chuyện MPIM.
- Thiết lập WhatsApp là cài đặt khi cần: quy trình thiết lập ban đầu có thể hiển thị luồng thiết lập trước khi
  gói plugin được cài đặt, và Gateway chỉ tải Plugin ClawHub/npm bên ngoài
  khi kênh thực sự hoạt động.
- Các kênh chấp nhận tin nhắn đến do bot tạo có thể dùng chung
  [bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) để ngăn các cặp bot
  phản hồi lẫn nhau vô thời hạn.
- Các phòng luôn bật được hỗ trợ có thể dùng [sự kiện phòng xung quanh](/vi/channels/ambient-room-events)
  để những trao đổi trong phòng không nhắc tên trở thành ngữ cảnh yên lặng, trừ khi tác nhân gửi bằng
  công cụ `message`.

## Kênh được hỗ trợ

- [Discord](/vi/channels/discord) - Discord Bot API + Gateway; hỗ trợ máy chủ, kênh và DM.
- [Feishu](/vi/channels/feishu) - Bot Feishu/Lark qua WebSocket (Plugin đi kèm).
- [Google Chat](/vi/channels/googlechat) - Ứng dụng Google Chat API qua HTTP Webhook (Plugin có thể tải xuống).
- [iMessage](/vi/channels/imessage) - Tích hợp macOS gốc qua cầu nối `imsg` trên máy Mac đã đăng nhập (hoặc trình bọc SSH khi Gateway chạy ở nơi khác), bao gồm các hành động API riêng tư cho phản hồi, tapback, hiệu ứng, tệp đính kèm và quản lý nhóm. Được ưu tiên cho các thiết lập iMessage mới của OpenClaw khi quyền trên máy chủ và quyền truy cập Messages phù hợp.
- [IRC](/vi/channels/irc) - Máy chủ IRC cổ điển; kênh + DM với các điều khiển ghép đôi/danh sách cho phép.
- [LINE](/vi/channels/line) - Bot LINE Messaging API (Plugin có thể tải xuống).
- [Matrix](/vi/channels/matrix) - Giao thức Matrix (Plugin có thể tải xuống).
- [Mattermost](/vi/channels/mattermost) - Bot API + WebSocket; kênh, nhóm, DM (Plugin có thể tải xuống).
- [Microsoft Teams](/vi/channels/msteams) - Bot Framework; hỗ trợ doanh nghiệp (Plugin đi kèm).
- [Nextcloud Talk](/vi/channels/nextcloud-talk) - Chat tự lưu trữ qua Nextcloud Talk (Plugin đi kèm).
- [Nostr](/vi/channels/nostr) - DM phi tập trung qua NIP-04 (Plugin đi kèm).
- [QQ Bot](/vi/channels/qqbot) - QQ Bot API; chat riêng, chat nhóm và phương tiện phong phú (Plugin đi kèm).
- [Raft](/vi/channels/raft) - Cầu đánh thức Raft CLI cho cộng tác giữa con người và tác nhân (Plugin bên ngoài).
- [Signal](/vi/channels/signal) - signal-cli; tập trung vào quyền riêng tư.
- [Slack](/vi/channels/slack) - Bolt SDK; ứng dụng không gian làm việc.
- [SMS](/vi/channels/sms) - SMS dựa trên Twilio qua Gateway Webhook (Plugin chính thức).
- [Synology Chat](/vi/channels/synology-chat) - Synology NAS Chat qua Webhook gửi đi + nhận vào (Plugin đi kèm).
- [Telegram](/vi/channels/telegram) - Bot API qua grammY; hỗ trợ nhóm.
- [Tlon](/vi/channels/tlon) - Trình nhắn tin dựa trên Urbit (Plugin đi kèm).
- [Twitch](/vi/channels/twitch) - Chat Twitch qua kết nối IRC (Plugin đi kèm).
- [Voice Call](/vi/plugins/voice-call) - Điện thoại qua Plivo hoặc Twilio (Plugin, cài đặt riêng).
- [WebChat](/vi/web/webchat) - Giao diện người dùng Gateway WebChat qua WebSocket.
- [WeChat](/vi/channels/wechat) - Plugin Tencent iLink Bot qua đăng nhập QR; chỉ chat riêng (Plugin bên ngoài).
- [WhatsApp](/vi/channels/whatsapp) - Phổ biến nhất; dùng Baileys và yêu cầu ghép đôi QR.
- [Yuanbao](/vi/channels/yuanbao) - Bot Tencent Yuanbao (Plugin bên ngoài).
- [Zalo](/vi/channels/zalo) - Zalo Bot API; trình nhắn tin phổ biến của Việt Nam (Plugin đi kèm).
- [Zalo ClawBot](/vi/channels/zaloclawbot) - Trợ lý Zalo cá nhân qua đăng nhập QR; ràng buộc với chủ sở hữu (Plugin bên ngoài).
- [Zalo Personal](/vi/channels/zalouser) - Tài khoản Zalo cá nhân qua đăng nhập QR (Plugin đi kèm).

## Ghi chú

- Các kênh có thể chạy đồng thời; cấu hình nhiều kênh và OpenClaw sẽ định tuyến theo từng cuộc chat.
- Thiết lập nhanh nhất thường là **Telegram** (token bot đơn giản). WhatsApp yêu cầu ghép đôi QR và
  lưu nhiều trạng thái hơn trên ổ đĩa.
- Hành vi nhóm khác nhau tùy theo kênh; xem [Nhóm](/vi/channels/groups).
- Ghép đôi DM và danh sách cho phép được thực thi để đảm bảo an toàn; xem [Bảo mật](/vi/gateway/security).
- Khắc phục sự cố: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).
- Nhà cung cấp mô hình được ghi tài liệu riêng; xem [Nhà cung cấp mô hình](/vi/providers/models).
