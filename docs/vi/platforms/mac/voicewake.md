---
read_when:
    - Đang xử lý các luồng đánh thức bằng giọng nói hoặc PTT
summary: Chế độ đánh thức bằng giọng nói và nhấn để nói cùng chi tiết định tuyến trong ứng dụng mac
title: Đánh thức bằng giọng nói (macOS)
x-i18n:
    generated_at: "2026-06-27T17:42:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Đánh thức bằng giọng nói & nhấn để nói

## Yêu cầu

Đánh thức bằng giọng nói và nhấn để nói yêu cầu macOS 26 trở lên. Trên các phiên bản macOS cũ hơn,
các điều khiển bị ẩn khỏi trang cài đặt Giọng nói, trang này hiển thị yêu cầu macOS 26.

## Chế độ

- **Chế độ từ đánh thức** (mặc định): bộ nhận dạng Speech luôn bật chờ các token kích hoạt (`swabbleTriggerWords`). Khi khớp, nó bắt đầu thu âm, hiển thị lớp phủ với văn bản từng phần và tự động gửi sau khi im lặng.
- **Nhấn để nói (giữ Right Option)**: giữ phím Option bên phải để thu âm ngay lập tức, không cần kích hoạt. Lớp phủ xuất hiện trong khi giữ; thả phím sẽ hoàn tất và chuyển tiếp sau một khoảng trễ ngắn để bạn có thể chỉnh văn bản.

## Hành vi runtime (từ đánh thức)

- Bộ nhận dạng Speech nằm trong `VoiceWakeRuntime`.
- Kích hoạt chỉ xảy ra khi có một **khoảng dừng có ý nghĩa** giữa từ đánh thức và từ tiếp theo (khoảng cách ~0,55 giây). Lớp phủ/chuông có thể bắt đầu khi có khoảng dừng, ngay cả trước khi lệnh bắt đầu.
- Cửa sổ im lặng: 2,0 giây khi lời nói đang tiếp diễn, 5,0 giây nếu chỉ nghe thấy từ kích hoạt.
- Dừng cứng: 120 giây để tránh các phiên chạy không kiểm soát.
- Debounce giữa các phiên: 350 mili giây.
- Lớp phủ được điều khiển qua `VoiceWakeOverlayController` với màu đã xác nhận/tạm thời.
- Sau khi gửi, bộ nhận dạng khởi động lại sạch sẽ để lắng nghe kích hoạt tiếp theo.

## Bất biến vòng đời

- Nếu Đánh thức bằng giọng nói được bật và quyền đã được cấp, bộ nhận dạng từ đánh thức phải đang lắng nghe (trừ khi đang có một lần thu nhấn để nói rõ ràng).
- Khả năng hiển thị lớp phủ (bao gồm đóng thủ công bằng nút X) không bao giờ được ngăn bộ nhận dạng tiếp tục hoạt động.

## Chế độ lỗi lớp phủ bị kẹt (trước đây)

Trước đây, nếu lớp phủ bị kẹt ở trạng thái hiển thị và bạn đóng thủ công, Đánh thức bằng giọng nói có thể trông như "đã chết" vì nỗ lực khởi động lại của runtime có thể bị chặn bởi trạng thái hiển thị lớp phủ và không có lần khởi động lại tiếp theo nào được lên lịch.

Gia cố:

- Việc khởi động lại wake runtime không còn bị chặn bởi trạng thái hiển thị lớp phủ.
- Hoàn tất đóng lớp phủ sẽ kích hoạt `VoiceWakeRuntime.refresh(...)` qua `VoiceSessionCoordinator`, vì vậy việc đóng thủ công bằng X luôn tiếp tục lắng nghe.

## Chi tiết nhấn để nói

- Phát hiện phím tắt dùng bộ theo dõi `.flagsChanged` toàn cục cho **Option bên phải** (`keyCode 61` + `.option`). Chúng tôi chỉ quan sát sự kiện (không nuốt sự kiện).
- Pipeline thu âm nằm trong `VoicePushToTalk`: khởi động Speech ngay lập tức, truyền các phần tạm thời đến lớp phủ và gọi `VoiceWakeForwarder` khi thả phím.
- Khi nhấn để nói bắt đầu, chúng tôi tạm dừng runtime từ đánh thức để tránh các audio tap cạnh tranh; nó tự động khởi động lại sau khi thả phím.
- Quyền: yêu cầu Microphone + Speech; việc thấy sự kiện cần phê duyệt Accessibility/Input Monitoring.
- Bàn phím ngoài: một số bàn phím có thể không bộc lộ Option bên phải như mong đợi; hãy cung cấp phím tắt dự phòng nếu người dùng báo cáo bị bỏ lỡ.

## Cài đặt hướng tới người dùng

- Công tắc **Voice Wake**: bật runtime từ đánh thức.
- **Giữ Right Option để nói**: bật bộ theo dõi nhấn để nói.
- Bộ chọn ngôn ngữ & mic, đồng hồ mức trực tiếp, bảng từ kích hoạt, trình thử nghiệm (chỉ cục bộ; không chuyển tiếp).
- Bộ chọn mic giữ lựa chọn gần nhất nếu thiết bị ngắt kết nối, hiển thị gợi ý đã ngắt kết nối và tạm thời quay về mặc định hệ thống cho đến khi thiết bị trở lại.
- **Âm thanh**: chuông khi phát hiện kích hoạt và khi gửi; mặc định là âm thanh hệ thống "Glass" của macOS. Bạn có thể chọn bất kỳ tệp nào `NSSound` có thể tải (ví dụ MP3/WAV/AIFF) cho từng sự kiện hoặc chọn **Không có âm thanh**.

## Hành vi chuyển tiếp

- Khi Đánh thức bằng giọng nói được bật, bản ghi được chuyển tiếp đến gateway/agent đang hoạt động (cùng chế độ cục bộ so với từ xa được phần còn lại của ứng dụng Mac sử dụng).
- Phản hồi được gửi đến **nhà cung cấp chính dùng gần nhất** (WhatsApp/Telegram/Discord/WebChat). Nếu gửi thất bại, lỗi được ghi log và lượt chạy vẫn hiển thị qua WebChat/log phiên.

## Payload chuyển tiếp

- `VoiceWakeForwarder.prefixedTranscript(_:)` thêm gợi ý máy vào trước khi gửi. Dùng chung giữa các đường dẫn từ đánh thức và nhấn để nói.

## Xác minh nhanh

- Bật nhấn để nói, giữ Right Option, nói, thả: lớp phủ phải hiển thị các phần tạm thời rồi gửi.
- Trong khi giữ, tai trên thanh menu phải duy trì phóng to (dùng `triggerVoiceEars(ttl:nil)`); chúng hạ xuống sau khi thả.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay)
- [Ứng dụng macOS](/vi/platforms/macos)
