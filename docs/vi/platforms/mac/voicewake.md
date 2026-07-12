---
read_when:
    - Đang xử lý các luồng kích hoạt bằng giọng nói hoặc PTT
summary: Chế độ đánh thức bằng giọng nói và nhấn để nói, cùng thông tin chi tiết về định tuyến trong ứng dụng macOS
title: Đánh thức bằng giọng nói (macOS)
x-i18n:
    generated_at: "2026-07-12T08:04:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Đánh thức bằng giọng nói & Nhấn-để-nói

## Yêu cầu

Đánh thức bằng giọng nói và nhấn-để-nói yêu cầu macOS 26 trở lên. Trên các phiên bản macOS cũ hơn, các tùy chọn điều khiển bị ẩn khỏi trang cài đặt Giọng nói và thay vào đó trang này hiển thị yêu cầu về macOS 26.

## Chế độ

- **Chế độ từ đánh thức** (mặc định): trình nhận dạng Giọng nói luôn bật chờ các từ kích hoạt (`swabbleTriggerWords`). Khi khớp, trình này bắt đầu thu âm, hiển thị lớp phủ với văn bản tạm thời và tự động gửi sau khi người dùng ngừng nói.
- **Nhấn-để-nói (giữ phím Option bên phải)**: giữ phím Option bên phải để bắt đầu thu âm ngay lập tức mà không cần từ kích hoạt. Lớp phủ xuất hiện trong khi giữ phím; khi thả phím, nội dung được hoàn tất và chuyển tiếp sau một khoảng trễ ngắn để bạn có thể chỉnh sửa văn bản.

## Hành vi khi chạy (từ đánh thức)

- Trình nhận dạng nằm trong `VoiceWakeRuntime`.
- Từ kích hoạt chỉ có hiệu lực khi có khoảng dừng đáng kể giữa từ đánh thức và từ tiếp theo (`triggerPauseWindow` = 0,55 giây). Lớp phủ/âm báo có thể bắt đầu ngay khi có khoảng dừng, kể cả trước khi câu lệnh bắt đầu.
- Khoảng im lặng: 2,0 giây (`silenceWindow`) khi lời nói đang tiếp diễn, 5,0 giây (`triggerOnlySilenceWindow`) nếu chỉ nghe thấy từ kích hoạt.
- Giới hạn dừng bắt buộc: 120 giây (`captureHardStop`) để ngăn các phiên chạy mất kiểm soát.
- Khoảng chống dội giữa các phiên: 350 mili giây (`debounceAfterSend`) sau khi gửi.
- Lớp phủ được điều khiển qua `VoiceWakeOverlayController`, với màu sắc phân biệt văn bản đã xác nhận và văn bản tạm thời.
- Sau khi gửi, trình nhận dạng khởi động lại hoàn toàn để lắng nghe từ kích hoạt tiếp theo.

## Các bất biến về vòng đời

- Nếu Đánh thức bằng giọng nói được bật và các quyền đã được cấp, trình nhận dạng từ đánh thức sẽ tiếp tục lắng nghe, ngoại trừ khi đang có một phiên thu âm nhấn-để-nói hoạt động.
- Việc đóng lớp phủ, bao gồm đóng thủ công bằng nút X, luôn tiếp tục trình nhận dạng: `VoiceSessionCoordinator.overlayDidDismiss` gọi `VoiceWakeRuntime.refresh(state:)` trên mọi luồng đóng. Xem [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay) để biết mô hình phiên/mã thông báo.

## Chi tiết về nhấn-để-nói

- Tính năng phát hiện phím nóng sử dụng trình theo dõi `.flagsChanged` toàn cục cho phím Option bên phải (`keyCode 61` + `.option`). Trình này chỉ quan sát sự kiện, không bao giờ chặn chúng.
- Quá trình thu âm nằm trong `VoicePushToTalk`: khởi động Giọng nói ngay lập tức, truyền trực tiếp văn bản tạm thời đến lớp phủ và gọi `VoiceWakeForwarder` khi thả phím.
- Việc bắt đầu nhấn-để-nói sẽ tạm dừng tiến trình từ đánh thức để tránh xung đột các luồng thu âm; tiến trình này tự động khởi động lại sau khi thả phím.
- Quyền: yêu cầu Micrô + Giọng nói; việc nhận sự kiện bàn phím cần được phê duyệt quyền Trợ năng/Giám sát đầu vào.
- Bàn phím ngoài: một số bàn phím không cung cấp phím Option bên phải như dự kiến. Hãy cung cấp một phím tắt dự phòng nếu người dùng báo cáo rằng hệ thống không nhận thao tác.

## Cài đặt dành cho người dùng

- Nút bật/tắt **Đánh thức bằng giọng nói**: bật tiến trình từ đánh thức.
- **Giữ phím Option bên phải để nói**: bật trình theo dõi nhấn-để-nói.
- Bộ chọn ngôn ngữ và micrô, đồng hồ đo mức âm thanh trực tiếp, bảng từ kích hoạt và công cụ kiểm thử (chỉ cục bộ, không bao giờ chuyển tiếp).
- Bộ chọn micrô giữ lại lựa chọn gần nhất nếu thiết bị bị ngắt kết nối, hiển thị gợi ý về trạng thái ngắt kết nối và tạm thời chuyển sang thiết bị mặc định của hệ thống cho đến khi thiết bị kết nối lại.
- **Âm thanh**: phát âm báo khi phát hiện từ kích hoạt và khi gửi, mặc định sử dụng âm thanh hệ thống "Glass" của macOS. Chọn bất kỳ tệp nào mà `NSSound` có thể tải (ví dụ: MP3/WAV/AIFF) cho từng sự kiện hoặc chọn **Không có âm thanh**.

## Hành vi chuyển tiếp

- Khi chuyển tiếp, `VoiceWakeForwarder.selectedSessionOptions` chọn khóa phiên WebChat đang hoạt động nếu đã thiết lập; nếu không, nó chọn khóa phiên chính của Gateway.
- Hàm này tra cứu phiên đó qua `sessions.list` và suy ra kênh cùng đích gửi từ ngữ cảnh chuyển phát của phiên (lần lượt dự phòng về kênh/đích gần nhất rồi đến khóa phiên đã phân tích), mặc định sử dụng WebChat nếu không xác định được giá trị nào.
- Nếu chuyển phát thất bại, lỗi sẽ được ghi nhật ký (danh mục `voicewake.forward`) và lượt chạy vẫn hiển thị qua nhật ký WebChat/phiên.

## Dữ liệu chuyển tiếp

- `VoiceWakeForwarder.prefixedTranscript(_:)` thêm một dòng gợi ý cho máy (tên máy chủ đã phân giải, dự phòng là "máy Mac này") vào trước bản chép lời; dòng này được dùng chung cho cả luồng từ đánh thức và nhấn-để-nói.

## Xác minh nhanh

- Bật nhấn-để-nói, giữ phím Option bên phải, nói rồi thả phím: lớp phủ sẽ hiển thị văn bản tạm thời rồi gửi.
- Trong khi giữ phím, biểu tượng đôi tai trên thanh menu phải duy trì trạng thái phóng to (`triggerVoiceEars(ttl: nil)`); chúng thu nhỏ lại sau khi thả phím.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay)
- [Ứng dụng macOS](/vi/platforms/macos)
