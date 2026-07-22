---
read_when:
    - Đang xử lý các luồng kích hoạt bằng giọng nói hoặc PTT
summary: Chế độ đánh thức bằng giọng nói và nhấn để nói, cùng thông tin chi tiết về định tuyến trong ứng dụng Mac
title: Đánh thức bằng giọng nói (macOS)
x-i18n:
    generated_at: "2026-07-22T02:15:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d3b2a01ee997b4158bf88b9ef54b1e523503722620f943d594323516619e7502
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Đánh thức bằng giọng nói & Nhấn để nói

## Yêu cầu

Đánh thức bằng giọng nói và nhấn để nói yêu cầu macOS 26 trở lên. Trên các phiên bản macOS cũ hơn, các tùy chọn điều khiển bị ẩn khỏi trang cài đặt Giọng nói; thay vào đó, trang này hiển thị yêu cầu về macOS 26.

Đánh thức bằng giọng nói yêu cầu Apple Speech hỗ trợ nhận dạng trên thiết bị cho ngôn ngữ đã chọn. Ứng dụng từ chối bắt đầu nghe thụ động từ đánh thức khi không có khả năng chỉ xử lý cục bộ này; ứng dụng không bao giờ chuyển sang nhận dạng qua mạng. Nhấn để nói, Chế độ trò chuyện và tính năng đọc chính tả của Trò chuyện nhanh là các thao tác rõ ràng của người dùng và có thể sử dụng các dịch vụ mạng của Apple Speech để hỗ trợ nhiều ngôn ngữ hơn.

## Chế độ

- **Chế độ từ đánh thức** (mặc định): một trình nhận dạng Speech luôn bật và hoạt động trên thiết bị chờ các từ kích hoạt (`swabbleTriggerWords`). Khi khớp, trình này bắt đầu thu âm, hiển thị lớp phủ với văn bản tạm thời và tự động gửi sau một khoảng im lặng.
- **Nhấn để nói (giữ phím Option bên phải)**: giữ phím Option bên phải để thu âm ngay lập tức mà không cần từ kích hoạt. Lớp phủ xuất hiện trong lúc giữ phím; khi nhả phím, nội dung được hoàn tất và chuyển tiếp sau một khoảng trễ ngắn để bạn có thể chỉnh sửa văn bản.

## Hành vi khi chạy (từ đánh thức)

- Trình nhận dạng nằm trong `VoiceWakeRuntime`.
- Tính năng kích hoạt chỉ được thực thi khi có khoảng dừng đáng kể giữa từ đánh thức và từ tiếp theo (`triggerPauseWindow` = 0.55s). Lớp phủ/âm báo có thể bắt đầu khi có khoảng dừng, ngay cả trước khi câu lệnh bắt đầu.
- Khoảng im lặng: 2.0s (`silenceWindow`) khi lời nói đang diễn ra, 5.0s (`triggerOnlySilenceWindow`) nếu chỉ nghe thấy từ kích hoạt.
- Dừng bắt buộc: 120s (`captureHardStop`) để ngăn các phiên chạy không kiểm soát.
- Khoảng chống dội giữa các phiên: 350ms (`debounceAfterSend`) sau khi gửi.
- Lớp phủ được điều khiển qua `VoiceWakeOverlayController`, với màu sắc phân biệt văn bản đã xác nhận và văn bản tạm thời.
- Sau khi gửi, trình nhận dạng khởi động lại hoàn toàn để nghe từ kích hoạt tiếp theo.

## Các bất biến trong vòng đời

- Nếu Đánh thức bằng giọng nói được bật và các quyền đã được cấp, trình nhận dạng từ đánh thức luôn duy trì trạng thái lắng nghe, ngoại trừ khi đang có một phiên thu âm nhấn để nói.
- Việc đóng lớp phủ, bao gồm đóng thủ công bằng nút X, luôn tiếp tục trình nhận dạng: `VoiceSessionCoordinator.overlayDidDismiss` gọi `VoiceWakeRuntime.refresh(state:)` trên mọi đường dẫn đóng. Xem [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay) để biết mô hình phiên/mã thông báo.

## Chi tiết về nhấn để nói

- Tính năng phát hiện phím nóng sử dụng trình giám sát `.flagsChanged` toàn cục cho phím Option bên phải (`keyCode 61` + `.option`). Trình này chỉ quan sát sự kiện và không bao giờ chặn chúng.
- Quá trình thu âm nằm trong `VoicePushToTalk`: khởi động Speech ngay lập tức, truyền trực tiếp các kết quả tạm thời đến lớp phủ và gọi `VoiceWakeForwarder` khi nhả phím.
- Việc bắt đầu nhấn để nói sẽ tạm dừng môi trường chạy từ đánh thức để tránh các luồng thu âm thanh cạnh tranh; môi trường này tự động khởi động lại sau khi nhả phím.
- Quyền: yêu cầu quyền truy cập Micrô + Nhận dạng giọng nói; việc nhận sự kiện phím cần được phê duyệt trong Trợ năng/Giám sát đầu vào.
- Bàn phím ngoài: một số bàn phím không cung cấp phím Option bên phải như mong đợi. Hãy cung cấp phím tắt dự phòng nếu người dùng báo cáo không nhận được thao tác.

## Cài đặt hiển thị cho người dùng

- Nút bật/tắt **Đánh thức bằng giọng nói**: bật môi trường chạy từ đánh thức.
- **Giữ phím Option bên phải để nói**: bật trình giám sát nhấn để nói.
- Nếu ngôn ngữ đã chọn không hỗ trợ nhận dạng trên thiết bị trên máy Mac này, Đánh thức bằng giọng nói vẫn bị tắt trong khi nhấn để nói và Chế độ trò chuyện vẫn khả dụng.
- Bộ chọn ngôn ngữ và micrô, đồng hồ đo mức trực tiếp, bảng từ kích hoạt và công cụ kiểm tra (chỉ xử lý cục bộ, không bao giờ chuyển tiếp).
- Bộ chọn micrô giữ nguyên lựa chọn gần nhất nếu thiết bị bị ngắt kết nối, hiển thị gợi ý về trạng thái ngắt kết nối và tạm thời chuyển sang thiết bị mặc định của hệ thống cho đến khi thiết bị kết nối lại.
- **Âm thanh**: phát âm báo khi phát hiện kích hoạt và khi gửi, mặc định sử dụng âm thanh hệ thống "Glass" của macOS. Chọn tệp bất kỳ mà `NSSound` có thể tải (ví dụ: MP3/WAV/AIFF) cho từng sự kiện, hoặc chọn **No Sound**.

## Hành vi chuyển tiếp

- Khi chuyển tiếp, `VoiceWakeForwarder.selectedSessionOptions` chọn khóa phiên WebChat đang hoạt động nếu đã đặt khóa, nếu không sẽ chọn khóa phiên chính của gateway.
- Thành phần này tra cứu phiên đó qua `sessions.list` và lấy kênh cùng đích phân phối từ ngữ cảnh phân phối của phiên (chuyển sang kênh/đích gần nhất của phiên nếu không có, rồi đến khóa phiên đã phân tích), mặc định sử dụng WebChat nếu không thể phân giải thông tin nào.
- Nếu phân phối không thành công, lỗi sẽ được ghi vào nhật ký (danh mục `voicewake.forward`) và lượt chạy vẫn hiển thị qua WebChat/nhật ký phiên.

## Payload chuyển tiếp

- `VoiceWakeForwarder.prefixedTranscript(_:)` thêm một dòng gợi ý về máy (tên máy chủ đã phân giải, hoặc "máy Mac này" nếu không phân giải được) vào trước bản chép lời; dòng này được dùng chung cho cả đường dẫn từ đánh thức và nhấn để nói.

## Xác minh nhanh

- Bật nhấn để nói, giữ phím Option bên phải, nói rồi nhả phím: lớp phủ sẽ hiển thị các kết quả tạm thời rồi gửi.
- Trong lúc giữ phím, biểu tượng tai trên thanh menu phải tiếp tục được phóng to (`triggerVoiceEars(ttl: nil)`); chúng thu nhỏ lại sau khi nhả phím.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay)
- [Ứng dụng macOS](/vi/platforms/macos)
