---
read_when:
    - Sửa đổi quy trình xử lý phương tiện hoặc tệp đính kèm
summary: Quy tắc xử lý hình ảnh và phương tiện cho send, Gateway và phản hồi của tác nhân
title: Hỗ trợ hình ảnh và phương tiện
x-i18n:
    generated_at: "2026-05-06T09:19:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# Hỗ trợ hình ảnh & phương tiện (2025-12-05)

Kênh WhatsApp chạy qua **Baileys Web**. Tài liệu này ghi lại các quy tắc xử lý phương tiện hiện tại cho gửi, gateway và phản hồi của agent.

## Mục tiêu

- Gửi phương tiện kèm chú thích tùy chọn qua `openclaw message send --media`.
- Cho phép phản hồi tự động từ hộp thư web bao gồm phương tiện cùng với văn bản.
- Giữ giới hạn theo từng loại hợp lý và dễ dự đoán.

## Bề mặt CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` là tùy chọn; chú thích có thể để trống khi chỉ gửi phương tiện.
  - `--dry-run` in payload đã phân giải; `--json` xuất `{ channel, to, messageId, mediaUrl, caption }`.

## Hành vi kênh WhatsApp Web

- Đầu vào: đường dẫn tệp cục bộ **hoặc** URL HTTP(S).
- Luồng: tải vào Buffer, phát hiện loại phương tiện và tạo payload phù hợp:
  - **Hình ảnh:** đổi kích thước & nén lại thành JPEG (cạnh tối đa 2048px), nhắm tới `channels.whatsapp.mediaMaxMb` (mặc định: 50 MB).
  - **Âm thanh/Giọng nói/Video:** chuyển tiếp nguyên dạng tới 16 MB; âm thanh được gửi dưới dạng ghi chú thoại (`ptt: true`).
  - **Tài liệu:** mọi thứ khác, tối đa 100 MB, giữ nguyên tên tệp khi có.
- Phát lại kiểu GIF trên WhatsApp: gửi MP4 với `gifPlayback: true` (CLI: `--gif-playback`) để ứng dụng di động lặp nội tuyến.
- Phát hiện MIME ưu tiên magic bytes, sau đó là header, rồi phần mở rộng tệp.
- Chú thích lấy từ `--message` hoặc `reply.text`; cho phép chú thích trống.
- Ghi log: chế độ không verbose hiển thị `↩️`/`✅`; verbose bao gồm kích thước và đường dẫn/URL nguồn.

## Quy trình phản hồi tự động

- `getReplyFromConfig` trả về `{ text?, mediaUrl?, mediaUrls? }`.
- Khi có phương tiện, trình gửi web phân giải đường dẫn cục bộ hoặc URL bằng cùng quy trình như `openclaw message send`.
- Nhiều mục phương tiện được gửi tuần tự nếu được cung cấp.

## Phương tiện đầu vào cho lệnh (Pi)

- Khi tin nhắn web đầu vào bao gồm phương tiện, OpenClaw tải xuống một tệp tạm và cung cấp các biến mẫu:
  - `{{MediaUrl}}` pseudo-URL cho phương tiện đầu vào.
  - `{{MediaPath}}` đường dẫn tạm cục bộ được ghi trước khi chạy lệnh.
- Khi sandbox Docker theo phiên được bật, phương tiện đầu vào được sao chép vào workspace sandbox và `MediaPath`/`MediaUrl` được viết lại thành đường dẫn tương đối như `media/inbound/<filename>`.
- Hiểu phương tiện (nếu được cấu hình qua `tools.media.*` hoặc `tools.media.models` dùng chung) chạy trước khi tạo mẫu và có thể chèn các khối `[Image]`, `[Audio]` và `[Video]` vào `Body`.
  - Âm thanh đặt `{{Transcript}}` và dùng bản chép lời để phân tích lệnh, nên các lệnh slash vẫn hoạt động.
  - Mô tả video và hình ảnh giữ lại mọi văn bản chú thích để phân tích lệnh.
  - Nếu mô hình hình ảnh chính đang hoạt động đã hỗ trợ thị giác nguyên bản, OpenClaw bỏ qua khối tóm tắt `[Image]` và thay vào đó truyền hình ảnh gốc cho mô hình.
- Theo mặc định, chỉ tệp đính kèm hình ảnh/âm thanh/video khớp đầu tiên được xử lý; đặt `tools.media.<cap>.attachments` để xử lý nhiều tệp đính kèm.

## Giới hạn và lỗi

**Giới hạn gửi đi (gửi qua web WhatsApp)**

- Hình ảnh: tối đa `channels.whatsapp.mediaMaxMb` (mặc định: 50 MB) sau khi nén lại.
- Âm thanh/giọng nói/video: giới hạn 16 MB; tài liệu: giới hạn 100 MB.
- Phương tiện quá kích thước hoặc không đọc được → lỗi rõ ràng trong log và phản hồi bị bỏ qua.

**Giới hạn hiểu phương tiện (chép lời/mô tả)**

- Mặc định hình ảnh: 10 MB (`tools.media.image.maxBytes`).
- Mặc định âm thanh: 20 MB (`tools.media.audio.maxBytes`).
- Mặc định video: 50 MB (`tools.media.video.maxBytes`).
- Phương tiện quá kích thước sẽ bỏ qua bước hiểu, nhưng phản hồi vẫn tiếp tục với nội dung gốc.

## Ghi chú cho kiểm thử

- Bao phủ luồng gửi + phản hồi cho các trường hợp hình ảnh/âm thanh/tài liệu.
- Xác thực việc nén lại cho hình ảnh (giới hạn kích thước) và cờ ghi chú thoại cho âm thanh.
- Đảm bảo phản hồi nhiều phương tiện được tách ra thành các lần gửi tuần tự.

## Liên quan

- [Chụp bằng camera](/vi/nodes/camera)
- [Hiểu phương tiện](/vi/nodes/media-understanding)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
