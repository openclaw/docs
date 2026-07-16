---
read_when:
    - Bạn muốn chọn một kênh trò chuyện cho OpenClaw
    - Bạn cần thông tin tổng quan nhanh về các nền tảng nhắn tin được hỗ trợ
summary: Các nền tảng nhắn tin mà OpenClaw có thể kết nối đến
title: Kênh trò chuyện
x-i18n:
    generated_at: "2026-07-16T14:05:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw có thể trò chuyện với bạn trên bất kỳ ứng dụng chat nào bạn đang sử dụng. Mỗi kênh kết nối thông qua Gateway.
Văn bản được hỗ trợ ở mọi nơi; nội dung đa phương tiện và phản ứng khác nhau tùy theo kênh.

iMessage, Telegram và giao diện WebChat được cung cấp cùng bản cài đặt lõi. Các kênh được đánh dấu
"plugin chính thức" có thể được cài đặt bằng một lệnh (`openclaw plugins install @openclaw/<id>`)
hoặc theo nhu cầu trong quá trình `openclaw onboard` / `openclaw channels add`, sau đó cần khởi động lại
Gateway. Các kênh "plugin bên ngoài" được duy trì bên ngoài kho lưu trữ OpenClaw.

## Các kênh được hỗ trợ

- [Discord](/vi/channels/discord) - Discord Bot API + Gateway; hỗ trợ máy chủ, kênh và tin nhắn trực tiếp (plugin chính thức).
- [Feishu](/vi/channels/feishu) - Bot Feishu/Lark qua WebSocket (plugin chính thức).
- [Google Chat](/vi/channels/googlechat) - Ứng dụng Google Chat API qua HTTP webhook (plugin chính thức).
- [iMessage](/vi/channels/imessage) - Được tích hợp trong lõi. Tích hợp macOS nguyên bản qua cầu nối `imsg` trên máy Mac đã đăng nhập (hoặc trình bao bọc SSH khi Gateway chạy ở nơi khác), bao gồm các thao tác API riêng tư để trả lời, gửi tapback, hiệu ứng, tệp đính kèm và quản lý nhóm.
- [IRC](/vi/channels/irc) - Máy chủ IRC truyền thống; kênh + tin nhắn trực tiếp với các biện pháp kiểm soát ghép nối/danh sách cho phép (plugin chính thức).
- [LINE](/vi/channels/line) - Bot LINE Messaging API (plugin chính thức).
- [Matrix](/vi/channels/matrix) - Giao thức Matrix (plugin chính thức).
- [Mattermost](/vi/channels/mattermost) - Bot API + WebSocket; kênh, nhóm, tin nhắn trực tiếp (plugin chính thức).
- [Microsoft Teams](/vi/channels/msteams) - Bot Framework; hỗ trợ doanh nghiệp (plugin chính thức).
- [Nextcloud Talk](/vi/channels/nextcloud-talk) - Dịch vụ chat tự lưu trữ qua Nextcloud Talk (plugin chính thức).
- [Nostr](/vi/channels/nostr) - Tin nhắn trực tiếp phi tập trung qua NIP-04 (plugin chính thức).
- [QQ Bot](/vi/channels/qqbot) - QQ Bot API; chat riêng tư, chat nhóm và nội dung đa phương tiện phong phú (plugin chính thức).
- [Reef](/vi/channels/reef) - Nhắn tin giữa các claw được bảo vệ và mã hóa đầu cuối, dành cho các tác nhân OpenClaw của những người khác nhau (plugin đi kèm).
- [Raft](/vi/channels/raft) - Cầu nối đánh thức Raft CLI dành cho sự cộng tác giữa con người và tác nhân (plugin chính thức).
- [Signal](/vi/channels/signal) - signal-cli; tập trung vào quyền riêng tư (plugin chính thức).
- [Slack](/vi/channels/slack) - Bolt SDK; ứng dụng không gian làm việc (plugin chính thức).
- [SMS](/vi/channels/sms) - SMS dựa trên Twilio thông qua webhook của Gateway (plugin chính thức).
- [Synology Chat](/vi/channels/synology-chat) - Synology NAS Chat qua webhook gửi đi+nhận vào (plugin chính thức).
- [Telegram](/vi/channels/telegram) - Được tích hợp trong lõi. Bot API qua grammY; hỗ trợ nhóm.
- [Tlon](/vi/channels/tlon) - Trình nhắn tin dựa trên Urbit (plugin chính thức).
- [Twitch](/vi/channels/twitch) - Chat Twitch qua kết nối IRC (plugin chính thức).
- [Cuộc gọi thoại](/vi/plugins/voice-call) - Điện thoại qua Plivo, Telnyx hoặc Twilio (plugin chính thức).
- [WebChat](/vi/web/webchat) - Được tích hợp trong lõi. Giao diện WebChat của Gateway qua WebSocket.
- [WeChat](/vi/channels/wechat) - Bot Tencent iLink qua đăng nhập bằng mã QR; chỉ hỗ trợ chat riêng tư (plugin bên ngoài).
- [WhatsApp](/vi/channels/whatsapp) - Phổ biến nhất; sử dụng Baileys và yêu cầu ghép nối bằng mã QR (plugin chính thức).
- [Yuanbao](/vi/channels/yuanbao) - Bot Tencent Yuanbao (plugin bên ngoài).
- [Zalo](/vi/channels/zalo) - Zalo Bot API; ứng dụng nhắn tin phổ biến tại Việt Nam (plugin chính thức).
- [Zalo ClawBot](/vi/channels/zaloclawbot) - Trợ lý Zalo cá nhân qua đăng nhập bằng mã QR; liên kết với chủ sở hữu (plugin bên ngoài).
- [Zalo Personal](/vi/channels/zalouser) - Tài khoản Zalo cá nhân qua đăng nhập bằng mã QR (plugin chính thức).

## Ghi chú về phân phối

- Các phản hồi Telegram chứa cú pháp hình ảnh markdown, chẳng hạn như `![alt](url)`,
  được chuyển đổi thành phản hồi đa phương tiện trên đường gửi đi cuối cùng khi có thể.
- Tin nhắn trực tiếp nhiều người trên Slack được định tuyến dưới dạng chat nhóm, vì vậy chính sách nhóm, hành vi đề cập
  và quy tắc phiên nhóm áp dụng cho các cuộc trò chuyện MPIM.
- Quá trình thiết lập WhatsApp được cài đặt theo nhu cầu: quy trình làm quen có thể hiển thị luồng thiết lập trước khi
  gói plugin được cài đặt, và Gateway chỉ tải plugin ClawHub/npm bên ngoài
  khi kênh thực sự hoạt động.
- Các kênh chấp nhận tin nhắn đến do bot tạo có thể sử dụng
  [cơ chế bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung để ngăn các cặp bot
  phản hồi lẫn nhau vô thời hạn.
- Các phòng luôn hoạt động được hỗ trợ có thể sử dụng [sự kiện phòng nền](/vi/channels/ambient-room-events)
  để những cuộc trò chuyện không đề cập đến tác nhân trong phòng trở thành ngữ cảnh thụ động, trừ khi tác nhân gửi bằng
  công cụ `message`.

## Ghi chú

- Các kênh có thể chạy đồng thời; hãy cấu hình nhiều kênh và OpenClaw sẽ định tuyến theo từng cuộc chat.
- Cách thiết lập nhanh nhất thường là **Telegram** (token bot đơn giản, không cần cài đặt plugin). WhatsApp
  yêu cầu ghép nối bằng mã QR và lưu nhiều trạng thái hơn trên đĩa.
- Hành vi nhóm khác nhau tùy theo kênh; xem [Nhóm](/vi/channels/groups).
- Việc ghép nối tin nhắn trực tiếp và danh sách cho phép được thực thi để bảo đảm an toàn; xem [Bảo mật](/vi/gateway/security).
- Khắc phục sự cố: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).
- Các nhà cung cấp mô hình được trình bày riêng; xem [Nhà cung cấp mô hình](/vi/providers/models).
