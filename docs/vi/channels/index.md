---
read_when:
    - Bạn muốn chọn một kênh trò chuyện cho OpenClaw
    - Bạn cần thông tin tổng quan nhanh về các nền tảng nhắn tin được hỗ trợ
summary: Các nền tảng nhắn tin mà OpenClaw có thể kết nối tới
title: Kênh trò chuyện
x-i18n:
    generated_at: "2026-07-12T07:42:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 411b011a8e5dd83d3f30a672c0e8a56251ee8c6ca7cdf3e7dc5c2b1f1b31d73d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw có thể trò chuyện với bạn trên bất kỳ ứng dụng trò chuyện nào bạn đang sử dụng. Mỗi kênh kết nối thông qua Gateway.
Văn bản được hỗ trợ ở mọi nơi; nội dung đa phương tiện và phản ứng khác nhau tùy theo kênh.

iMessage, Telegram và giao diện WebChat được cung cấp cùng bản cài đặt lõi. Các kênh được đánh dấu
"plugin chính thức" có thể được cài đặt bằng một lệnh (`openclaw plugins install @openclaw/<id>`)
hoặc theo yêu cầu trong quá trình chạy `openclaw onboard` / `openclaw channels add`, sau đó cần khởi động lại
Gateway. Các kênh "plugin bên ngoài" được duy trì bên ngoài kho lưu trữ OpenClaw.

## Các kênh được hỗ trợ

- [Discord](/vi/channels/discord) - Discord Bot API + Gateway; hỗ trợ máy chủ, kênh và tin nhắn trực tiếp (plugin chính thức).
- [Feishu](/vi/channels/feishu) - Bot Feishu/Lark qua WebSocket (plugin chính thức).
- [Google Chat](/vi/channels/googlechat) - Ứng dụng Google Chat API qua webhook HTTP (plugin chính thức).
- [iMessage](/vi/channels/imessage) - Có sẵn trong lõi. Tích hợp macOS gốc qua cầu nối `imsg` trên máy Mac đã đăng nhập (hoặc trình bao bọc SSH khi Gateway chạy ở nơi khác), bao gồm các hành động API riêng tư để trả lời, thả biểu cảm, thêm hiệu ứng, đính kèm tệp và quản lý nhóm.
- [IRC](/vi/channels/irc) - Các máy chủ IRC cổ điển; kênh và tin nhắn trực tiếp với các biện pháp kiểm soát ghép đôi/danh sách cho phép (plugin chính thức).
- [LINE](/vi/channels/line) - Bot LINE Messaging API (plugin chính thức).
- [Matrix](/vi/channels/matrix) - Giao thức Matrix (plugin chính thức).
- [Mattermost](/vi/channels/mattermost) - Bot API + WebSocket; kênh, nhóm và tin nhắn trực tiếp (plugin chính thức).
- [Microsoft Teams](/vi/channels/msteams) - Bot Framework; hỗ trợ doanh nghiệp (plugin chính thức).
- [Nextcloud Talk](/vi/channels/nextcloud-talk) - Trò chuyện tự lưu trữ qua Nextcloud Talk (plugin chính thức).
- [Nostr](/vi/channels/nostr) - Tin nhắn trực tiếp phi tập trung qua NIP-04 (plugin chính thức).
- [QQ Bot](/vi/channels/qqbot) - QQ Bot API; trò chuyện riêng tư, trò chuyện nhóm và nội dung đa phương tiện phong phú (plugin chính thức).
- [Raft](/vi/channels/raft) - Cầu nối đánh thức Raft CLI dành cho việc cộng tác giữa con người và tác nhân (plugin chính thức).
- [Signal](/vi/channels/signal) - signal-cli; chú trọng quyền riêng tư (plugin chính thức).
- [Slack](/vi/channels/slack) - Bolt SDK; ứng dụng không gian làm việc (plugin chính thức).
- [SMS](/vi/channels/sms) - SMS do Twilio hỗ trợ thông qua webhook của Gateway (plugin chính thức).
- [Synology Chat](/vi/channels/synology-chat) - Synology NAS Chat qua webhook gửi đi và nhận vào (plugin chính thức).
- [Telegram](/vi/channels/telegram) - Có sẵn trong lõi. Bot API qua grammY; hỗ trợ nhóm.
- [Tlon](/vi/channels/tlon) - Trình nhắn tin dựa trên Urbit (plugin chính thức).
- [Twitch](/vi/channels/twitch) - Trò chuyện Twitch qua kết nối IRC (plugin chính thức).
- [Cuộc gọi thoại](/vi/plugins/voice-call) - Điện thoại qua Plivo, Telnyx hoặc Twilio (plugin chính thức).
- [WebChat](/vi/web/webchat) - Có sẵn trong lõi. Giao diện WebChat của Gateway qua WebSocket.
- [WeChat](/vi/channels/wechat) - Bot Tencent iLink qua đăng nhập bằng mã QR; chỉ hỗ trợ trò chuyện riêng tư (plugin bên ngoài).
- [WhatsApp](/vi/channels/whatsapp) - Phổ biến nhất; sử dụng Baileys và yêu cầu ghép đôi bằng mã QR (plugin chính thức).
- [Yuanbao](/vi/channels/yuanbao) - Bot Tencent Yuanbao (plugin bên ngoài).
- [Zalo](/vi/channels/zalo) - Zalo Bot API; trình nhắn tin phổ biến tại Việt Nam (plugin chính thức).
- [Zalo ClawBot](/vi/channels/zaloclawbot) - Trợ lý Zalo cá nhân qua đăng nhập bằng mã QR; gắn với chủ sở hữu (plugin bên ngoài).
- [Zalo Personal](/vi/channels/zalouser) - Tài khoản Zalo cá nhân qua đăng nhập bằng mã QR (plugin chính thức).

## Lưu ý về việc gửi

- Các câu trả lời trên Telegram có chứa cú pháp hình ảnh markdown, chẳng hạn như `![alt](url)`,
  được chuyển thành câu trả lời đa phương tiện trên luồng gửi đi cuối cùng khi có thể.
- Tin nhắn trực tiếp nhiều người trên Slack được định tuyến như trò chuyện nhóm, vì vậy chính sách nhóm, hành vi
  đề cập và quy tắc phiên nhóm được áp dụng cho các cuộc trò chuyện MPIM.
- Quá trình thiết lập WhatsApp sử dụng cơ chế cài đặt theo yêu cầu: quy trình nhập môn có thể hiển thị luồng thiết lập trước khi
  gói plugin được cài đặt, và Gateway chỉ tải plugin ClawHub/npm bên ngoài
  khi kênh thực sự hoạt động.
- Các kênh chấp nhận tin nhắn đến do bot tạo có thể sử dụng
  [cơ chế bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung để ngăn các cặp bot
  trả lời nhau vô thời hạn.
- Các phòng luôn hoạt động được hỗ trợ có thể sử dụng [sự kiện phòng nền](/vi/channels/ambient-room-events)
  để nội dung trò chuyện trong phòng không đề cập đến tác nhân trở thành ngữ cảnh im lặng, trừ khi tác nhân gửi bằng
  công cụ `message`.

## Ghi chú

- Các kênh có thể chạy đồng thời; hãy cấu hình nhiều kênh và OpenClaw sẽ định tuyến theo từng cuộc trò chuyện.
- Cách thiết lập nhanh nhất thường là **Telegram** (mã thông báo bot đơn giản, không cần cài đặt plugin). WhatsApp
  yêu cầu ghép đôi bằng mã QR và lưu trữ nhiều trạng thái hơn trên đĩa.
- Hành vi nhóm khác nhau tùy theo kênh; xem [Nhóm](/vi/channels/groups).
- Việc ghép đôi tin nhắn trực tiếp và danh sách cho phép được thực thi để đảm bảo an toàn; xem [Bảo mật](/vi/gateway/security).
- Khắc phục sự cố: [Khắc phục sự cố kênh](/vi/channels/troubleshooting).
- Các nhà cung cấp mô hình được trình bày riêng; xem [Nhà cung cấp mô hình](/vi/providers/models).
