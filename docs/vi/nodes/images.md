---
read_when:
    - Sửa đổi quy trình xử lý phương tiện hoặc tệp đính kèm
summary: Quy tắc xử lý hình ảnh và phương tiện cho thao tác gửi, Gateway và phản hồi của tác nhân
title: Hỗ trợ hình ảnh và nội dung đa phương tiện
x-i18n:
    generated_at: "2026-05-06T17:57:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

Kênh WhatsApp chạy qua **Baileys Web**. Tài liệu này ghi lại các quy tắc xử lý phương tiện hiện tại cho gửi, Gateway và phản hồi của tác tử.

## Mục tiêu

- Gửi phương tiện kèm chú thích tùy chọn qua `openclaw message send --media`.
- Cho phép phản hồi tự động từ hộp thư web bao gồm phương tiện cùng với văn bản.
- Giữ giới hạn theo từng loại hợp lý và dễ dự đoán.

## Bề mặt CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` là tùy chọn; chú thích có thể để trống cho lượt gửi chỉ có phương tiện.
  - `--dry-run` in payload đã phân giải; `--json` xuất `{ channel, to, messageId, mediaUrl, caption }`.

## Hành vi kênh WhatsApp Web

- Đầu vào: đường dẫn tệp cục bộ **hoặc** URL HTTP(S).
- Luồng: tải vào Buffer, phát hiện loại phương tiện và tạo payload đúng:
  - **Hình ảnh:** đổi kích thước và nén lại thành JPEG (cạnh tối đa 2048px) theo mục tiêu `channels.whatsapp.mediaMaxMb` (mặc định: 50 MB).
  - **Âm thanh/Giọng nói/Video:** truyền nguyên trạng tối đa 16 MB; âm thanh được gửi dưới dạng ghi chú thoại (`ptt: true`).
  - **Tài liệu:** mọi loại khác, tối đa 100 MB, giữ nguyên tên tệp khi có.
- Phát lại kiểu GIF trên WhatsApp: gửi MP4 với `gifPlayback: true` (CLI: `--gif-playback`) để ứng dụng di động phát lặp trong dòng.
- Phát hiện MIME ưu tiên magic bytes, sau đó là header, rồi phần mở rộng tệp.
- Chú thích lấy từ `--message` hoặc `reply.text`; cho phép chú thích trống.
- Ghi log: chế độ không chi tiết hiển thị `↩️`/`✅`; chế độ chi tiết bao gồm kích thước và đường dẫn/URL nguồn.

## Quy trình phản hồi tự động

- `getReplyFromConfig` trả về `{ text?, mediaUrl?, mediaUrls? }`.
- Khi có phương tiện, trình gửi web phân giải đường dẫn cục bộ hoặc URL bằng cùng quy trình như `openclaw message send`.
- Nếu được cung cấp, nhiều mục phương tiện sẽ được gửi tuần tự.

## Phương tiện đến trong lệnh (Pi)

- Khi tin nhắn web đến có phương tiện, OpenClaw tải xuống tệp tạm và cung cấp các biến mẫu:
  - `{{MediaUrl}}` URL giả cho phương tiện đến.
  - `{{MediaPath}}` đường dẫn tạm cục bộ được ghi trước khi chạy lệnh.
- Khi sandbox Docker theo phiên được bật, phương tiện đến được sao chép vào không gian làm việc của sandbox và `MediaPath`/`MediaUrl` được viết lại thành đường dẫn tương đối như `media/inbound/<filename>`.
- Hiểu phương tiện (nếu được cấu hình qua `tools.media.*` hoặc `tools.media.models` dùng chung) chạy trước khi áp dụng mẫu và có thể chèn các khối `[Image]`, `[Audio]` và `[Video]` vào `Body`.
  - Âm thanh đặt `{{Transcript}}` và dùng bản chép lời để phân tích lệnh, nhờ đó lệnh slash vẫn hoạt động.
  - Mô tả video và hình ảnh giữ nguyên mọi văn bản chú thích để phân tích lệnh.
  - Nếu mô hình hình ảnh chính đang hoạt động đã hỗ trợ thị giác nguyên bản, OpenClaw bỏ qua khối tóm tắt `[Image]` và chuyển hình ảnh gốc cho mô hình thay thế.
- Theo mặc định, chỉ tệp đính kèm hình ảnh/âm thanh/video khớp đầu tiên được xử lý; đặt `tools.media.<cap>.attachments` để xử lý nhiều tệp đính kèm.

## Giới hạn và lỗi

**Mức trần gửi đi (gửi qua WhatsApp web)**

- Hình ảnh: tối đa `channels.whatsapp.mediaMaxMb` (mặc định: 50 MB) sau khi nén lại.
- Âm thanh/giọng nói/video: mức trần 16 MB; tài liệu: mức trần 100 MB.
- Phương tiện quá lớn hoặc không đọc được → lỗi rõ ràng trong log và phản hồi bị bỏ qua.

**Mức trần hiểu phương tiện (chép lời/mô tả)**

- Hình ảnh mặc định: 10 MB (`tools.media.image.maxBytes`).
- Âm thanh mặc định: 20 MB (`tools.media.audio.maxBytes`).
- Video mặc định: 50 MB (`tools.media.video.maxBytes`).
- Phương tiện quá lớn sẽ bỏ qua bước hiểu, nhưng phản hồi vẫn tiếp tục với phần thân gốc.

## Ghi chú cho kiểm thử

- Bao phủ luồng gửi + phản hồi cho các trường hợp hình ảnh/âm thanh/tài liệu.
- Xác thực việc nén lại cho hình ảnh (giới hạn kích thước) và cờ ghi chú thoại cho âm thanh.
- Đảm bảo phản hồi nhiều phương tiện tỏa ra thành các lượt gửi tuần tự.

## Liên quan

- [Chụp bằng camera](/vi/nodes/camera)
- [Hiểu phương tiện](/vi/nodes/media-understanding)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
