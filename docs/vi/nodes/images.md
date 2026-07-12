---
read_when:
    - Sửa đổi quy trình xử lý phương tiện hoặc tệp đính kèm
summary: Quy tắc xử lý hình ảnh và nội dung đa phương tiện cho thao tác gửi, Gateway và phản hồi của tác nhân
title: Hỗ trợ hình ảnh và phương tiện truyền thông
x-i18n:
    generated_at: "2026-07-12T08:04:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

Kênh WhatsApp chạy trên Baileys Web. Trang này trình bày các quy tắc xử lý nội dung đa phương tiện khi gửi, qua Gateway và trong phản hồi của tác tử.

## Mục tiêu

- Gửi nội dung đa phương tiện kèm chú thích tùy chọn qua `openclaw message send --media`.
- Cho phép phản hồi tự động từ hộp thư đến trên web bao gồm nội dung đa phương tiện cùng với văn bản.
- Duy trì giới hạn hợp lý và dễ dự đoán cho từng loại.

## Giao diện CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — đính kèm nội dung đa phương tiện (hình ảnh/âm thanh/video/tài liệu); chấp nhận đường dẫn cục bộ hoặc URL. Không bắt buộc; chú thích có thể để trống khi chỉ gửi nội dung đa phương tiện.
- `--gif-playback` — xử lý nội dung video dưới dạng phát lại GIF (chỉ WhatsApp).
- `--force-document` — gửi nội dung đa phương tiện dưới dạng tài liệu để tránh bị kênh nén (Telegram, WhatsApp); áp dụng cho hình ảnh, GIF và video.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — các tùy chọn phân phối/luồng hội thoại dùng chung với trường hợp chỉ gửi văn bản.
- `--dry-run` — in tải trọng đã phân giải và bỏ qua việc gửi.
- `--json` — in kết quả dưới dạng JSON: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` chứa kết quả gửi dành riêng cho kênh, bao gồm mọi tham chiếu nội dung đa phương tiện).

## Hành vi của kênh WhatsApp Web

- Đầu vào: đường dẫn tệp cục bộ **hoặc** URL HTTP(S).
- Quy trình: tải vào bộ đệm, phát hiện loại nội dung đa phương tiện, sau đó tạo tải trọng gửi đi theo từng loại:
  - **Hình ảnh:** được tối ưu hóa để nằm dưới `channels.whatsapp.mediaMaxMb` (mặc định 50MB). Hình ảnh không trong suốt được nén lại thành JPEG (dãy kích thước cạnh mặc định bắt đầu từ 2048px và giảm dần sau mỗi lần không đạt giới hạn kích thước); hình ảnh có độ trong suốt được giữ ở định dạng PNG. Nếu nguồn đã là JPEG/PNG/WebP đạt yêu cầu trong phạm vi ngân sách kích thước và chiều dài cạnh, các byte gốc được giữ nguyên thay vì nén lại. GIF động không bao giờ được mã hóa lại mà chỉ được kiểm tra kích thước.
  - **Âm thanh/giọng nói:** trừ khi đã là âm thanh giọng nói nguyên bản (`.ogg`/`.opus` hoặc `audio/ogg`/`audio/opus`), âm thanh gửi đi được chuyển mã qua `ffmpeg` sang Opus/OGG (đơn âm 48kHz, 64kbps, giới hạn 20 phút) trước khi gửi dưới dạng tin nhắn thoại (`ptt: true`).
  - **Video:** truyền nguyên trạng với kích thước tối đa 16MB.
  - **Tài liệu:** mọi loại khác, tối đa 100MB, giữ nguyên tên tệp khi có.
- Phát lại theo kiểu GIF trên WhatsApp: gửi MP4 với `gifPlayback: true` (CLI: `--gif-playback`) để ứng dụng di động phát lặp ngay trong dòng.
- Việc phát hiện MIME ưu tiên byte ma thuật được nhận diện từ nội dung, sau đó đến phần mở rộng tệp rồi tiêu đề phản hồi; một định dạng vùng chứa chung được nhận diện (`application/octet-stream`, `zip`) không bao giờ ghi đè ánh xạ phần mở rộng cụ thể hơn (ví dụ XLSX so với ZIP).
- Chú thích lấy từ `--message` hoặc `reply.text`; cho phép chú thích trống.
- Ghi nhật ký: chế độ không chi tiết hiển thị `↩️`/`✅`; chế độ chi tiết bao gồm kích thước và đường dẫn/URL nguồn.

<Note>
Các mức 16MB cho âm thanh/video và 100MB cho tài liệu ở trên là giới hạn mặc định dùng chung theo từng loại nội dung đa phương tiện khi không truyền giới hạn byte rõ ràng. Hoạt động gửi qua WhatsApp đặt giới hạn rõ ràng từ `channels.whatsapp.mediaMaxMb` (mặc định 50MB), áp dụng đồng nhất cho mọi loại đối với tài khoản đó.
</Note>

## Quy trình phản hồi tự động

- `getReplyFromConfig` trả về một tải trọng phản hồi (hoặc mảng tải trọng) có `text?`, `mediaUrl?` và `mediaUrls?`, cùng các trường khác.
- Khi có nội dung đa phương tiện, trình gửi web phân giải đường dẫn cục bộ hoặc URL bằng cùng quy trình với `openclaw message send`.
- Nếu có nhiều mục nội dung đa phương tiện, chúng được gửi tuần tự.

## Nội dung đa phương tiện đầu vào cho lệnh

- Khi tin nhắn web đến có nội dung đa phương tiện, OpenClaw tải nội dung đó xuống một tệp tạm và cung cấp các biến mẫu:
  - `{{MediaUrl}}` — URL giả cho nội dung đa phương tiện đầu vào.
  - `{{MediaPath}}` — đường dẫn tạm cục bộ được ghi trước khi chạy lệnh.
- Khi hộp cát Docker theo từng phiên được bật, nội dung đa phương tiện đầu vào được sao chép vào không gian làm việc của hộp cát và `MediaPath`/`MediaUrl` được viết lại thành đường dẫn tương đối với hộp cát, chẳng hạn như `media/inbound/<filename>`.
- Khả năng hiểu nội dung đa phương tiện (được cấu hình qua `tools.media.*` hoặc `tools.media.models` dùng chung) chạy trước khi áp dụng mẫu và có thể chèn các khối `[Image]`, `[Audio]` và `[Video]` vào `Body`.
  - Âm thanh đặt `{{Transcript}}` và sử dụng bản chép lời để phân tích lệnh, nhờ đó các lệnh gạch chéo vẫn hoạt động.
  - Mô tả video và hình ảnh giữ lại mọi văn bản chú thích để phân tích lệnh.
  - Nếu mô hình chính đang hoạt động đã hỗ trợ thị giác nguyên bản, OpenClaw bỏ qua khối tóm tắt `[Image]` và truyền hình ảnh gốc trực tiếp cho mô hình.
- Theo mặc định, chỉ tệp đính kèm hình ảnh/âm thanh/video khớp đầu tiên được xử lý; đặt `tools.media.<capability>.attachments` để xử lý nhiều tệp đính kèm.

## Giới hạn và lỗi

**Giới hạn gửi đi (gửi qua WhatsApp Web)**

- Hình ảnh: tối đa `channels.whatsapp.mediaMaxMb` (mặc định 50MB) sau khi tối ưu hóa.
- Âm thanh/video: giới hạn 16MB (mặc định dùng chung; bị `mediaMaxMb` ghi đè khi gửi qua WhatsApp).
- Tài liệu: giới hạn 100MB (mặc định dùng chung; bị `mediaMaxMb` ghi đè khi gửi qua WhatsApp).
- Nội dung đa phương tiện quá kích thước hoặc không thể đọc sẽ tạo lỗi rõ ràng trong nhật ký và phản hồi sẽ bị bỏ qua.

**Giới hạn hiểu nội dung đa phương tiện (chép lời/mô tả)**

- Hình ảnh mặc định: 10MB (`tools.media.image.maxBytes`).
- Âm thanh mặc định: 20MB (`tools.media.audio.maxBytes`).
- Video mặc định: 50MB (`tools.media.video.maxBytes`).
- Nội dung đa phương tiện quá kích thước sẽ bỏ qua bước phân tích, nhưng phản hồi vẫn được gửi với phần nội dung gốc.

## Lưu ý cho kiểm thử

- Bao phủ quy trình gửi và phản hồi cho các trường hợp hình ảnh/âm thanh/tài liệu.
- Xác thực giới hạn kích thước sau khi tối ưu hóa hình ảnh và cờ tin nhắn thoại cho âm thanh.
- Đảm bảo phản hồi có nhiều nội dung đa phương tiện được tách thành các lượt gửi tuần tự.

## Liên quan

- [Chụp ảnh bằng camera](/vi/nodes/camera)
- [Hiểu nội dung đa phương tiện](/vi/nodes/media-understanding)
- [Âm thanh và tin nhắn thoại](/vi/nodes/audio)
