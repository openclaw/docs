---
read_when:
    - Sửa đổi pipeline phương tiện hoặc tệp đính kèm
summary: Quy tắc xử lý hình ảnh và phương tiện cho các phản hồi gửi, Gateway và agent
title: Hỗ trợ hình ảnh và phương tiện
x-i18n:
    generated_at: "2026-06-27T17:39:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

Kênh WhatsApp chạy qua **Baileys Web**. Tài liệu này ghi lại các quy tắc xử lý phương tiện hiện tại cho lượt gửi, Gateway và phản hồi của tác nhân.

## Mục tiêu

- Gửi phương tiện với chú thích tùy chọn qua `openclaw message send --media`.
- Cho phép phản hồi tự động từ hộp thư đến web bao gồm phương tiện cùng với văn bản.
- Giữ giới hạn theo từng loại hợp lý và dễ dự đoán.

## Bề mặt CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` là tùy chọn; chú thích có thể để trống cho lượt gửi chỉ có phương tiện.
  - `--dry-run` in payload đã phân giải; `--json` xuất `{ channel, to, messageId, mediaUrl, caption }`.

## Hành vi kênh WhatsApp Web

- Đầu vào: đường dẫn tệp cục bộ **hoặc** URL HTTP(S).
- Luồng: tải vào Buffer, phát hiện loại phương tiện và tạo payload phù hợp:
  - **Hình ảnh:** đổi kích thước và nén lại thành JPEG (cạnh tối đa 2048px) theo mục tiêu `channels.whatsapp.mediaMaxMb` (mặc định: 50 MB).
  - **Âm thanh/Tin nhắn thoại/Video:** truyền nguyên trạng đến 16 MB; âm thanh được gửi dưới dạng tin nhắn thoại (`ptt: true`).
  - **Tài liệu:** mọi loại khác, tối đa 100 MB, giữ nguyên tên tệp khi có.
- Phát kiểu GIF trên WhatsApp: gửi MP4 với `gifPlayback: true` (CLI: `--gif-playback`) để ứng dụng khách di động lặp nội tuyến.
- Phát hiện MIME ưu tiên magic bytes, sau đó đến header, rồi phần mở rộng tệp.
- Chú thích lấy từ `--message` hoặc `reply.text`; cho phép chú thích trống.
- Ghi log: không chi tiết hiển thị `↩️`/`✅`; chi tiết bao gồm kích thước và đường dẫn/URL nguồn.

## Quy trình phản hồi tự động

- `getReplyFromConfig` trả về `{ text?, mediaUrl?, mediaUrls? }`.
- Khi có phương tiện, bộ gửi web phân giải đường dẫn cục bộ hoặc URL bằng cùng quy trình như `openclaw message send`.
- Nhiều mục phương tiện sẽ được gửi tuần tự nếu được cung cấp.

## Phương tiện đầu vào thành lệnh

- Khi tin nhắn web đầu vào có phương tiện, OpenClaw tải xuống một tệp tạm và cung cấp các biến mẫu:
  - `{{MediaUrl}}` URL giả cho phương tiện đầu vào.
  - `{{MediaPath}}` đường dẫn tệp tạm cục bộ được ghi trước khi chạy lệnh.
- Khi bật sandbox Docker theo phiên, phương tiện đầu vào được sao chép vào workspace của sandbox và `MediaPath`/`MediaUrl` được viết lại thành đường dẫn tương đối như `media/inbound/<filename>`.
- Hiểu nội dung phương tiện (nếu được cấu hình qua `tools.media.*` hoặc `tools.media.models` dùng chung) chạy trước khi áp dụng mẫu và có thể chèn các khối `[Image]`, `[Audio]` và `[Video]` vào `Body`.
  - Âm thanh đặt `{{Transcript}}` và dùng bản chép lời để phân tích lệnh, nhờ đó các lệnh slash vẫn hoạt động.
  - Mô tả video và hình ảnh giữ lại mọi văn bản chú thích để phân tích lệnh.
  - Nếu mô hình hình ảnh chính đang hoạt động đã hỗ trợ vision nguyên bản, OpenClaw bỏ qua khối tóm tắt `[Image]` và thay vào đó truyền hình ảnh gốc cho mô hình.
- Theo mặc định, chỉ tệp đính kèm hình ảnh/âm thanh/video khớp đầu tiên được xử lý; đặt `tools.media.<cap>.attachments` để xử lý nhiều tệp đính kèm.

## Giới hạn và lỗi

**Giới hạn gửi đi (gửi qua WhatsApp web)**

- Hình ảnh: tối đa `channels.whatsapp.mediaMaxMb` (mặc định: 50 MB) sau khi nén lại.
- Âm thanh/tin nhắn thoại/video: giới hạn 16 MB; tài liệu: giới hạn 100 MB.
- Phương tiện quá kích thước hoặc không đọc được → lỗi rõ ràng trong log và phản hồi bị bỏ qua.

**Giới hạn hiểu nội dung phương tiện (chép lời/mô tả)**

- Mặc định cho hình ảnh: 10 MB (`tools.media.image.maxBytes`).
- Mặc định cho âm thanh: 20 MB (`tools.media.audio.maxBytes`).
- Mặc định cho video: 50 MB (`tools.media.video.maxBytes`).
- Phương tiện quá kích thước sẽ bỏ qua bước hiểu nội dung, nhưng phản hồi vẫn tiếp tục với nội dung gốc.

## Ghi chú cho kiểm thử

- Bao phủ các luồng gửi + phản hồi cho trường hợp hình ảnh/âm thanh/tài liệu.
- Xác thực việc nén lại cho hình ảnh (giới hạn kích thước) và cờ tin nhắn thoại cho âm thanh.
- Đảm bảo phản hồi nhiều phương tiện được tỏa ra thành các lượt gửi tuần tự.

## Liên quan

- [Chụp ảnh bằng camera](/vi/nodes/camera)
- [Hiểu nội dung phương tiện](/vi/nodes/media-understanding)
- [Âm thanh và tin nhắn thoại](/vi/nodes/audio)
