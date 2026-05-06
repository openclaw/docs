---
read_when:
    - Đang làm việc trên các luồng đánh thức bằng giọng nói hoặc PTT
summary: Các chế độ đánh thức bằng giọng nói và nhấn để nói cùng chi tiết định tuyến trong ứng dụng Mac
title: Đánh thức bằng giọng nói (macOS)
x-i18n:
    generated_at: "2026-05-06T09:22:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Đánh thức bằng giọng nói & Nhấn để nói

## Chế độ

- **Chế độ từ đánh thức** (mặc định): bộ nhận dạng giọng nói luôn bật chờ các token kích hoạt (`swabbleTriggerWords`). Khi khớp, nó bắt đầu thu âm, hiển thị lớp phủ với văn bản từng phần, và tự động gửi sau khi im lặng.
- **Nhấn để nói (giữ Option phải)**: giữ phím Option bên phải để thu âm ngay, không cần kích hoạt. Lớp phủ xuất hiện trong khi giữ; thả phím sẽ chốt và chuyển tiếp sau một độ trễ ngắn để bạn có thể chỉnh văn bản.

## Hành vi runtime (từ đánh thức)

- Bộ nhận dạng giọng nói nằm trong `VoiceWakeRuntime`.
- Kích hoạt chỉ xảy ra khi có một **khoảng dừng có ý nghĩa** giữa từ đánh thức và từ tiếp theo (khoảng cách ~0.55s). Lớp phủ/chuông có thể bắt đầu khi tạm dừng, ngay cả trước khi lệnh bắt đầu.
- Cửa sổ im lặng: 2.0s khi lời nói đang tiếp diễn, 5.0s nếu chỉ nghe thấy từ kích hoạt.
- Dừng cứng: 120s để ngăn phiên chạy vượt kiểm soát.
- Debounce giữa các phiên: 350ms.
- Lớp phủ được điều khiển qua `VoiceWakeOverlayController` với màu committed/volatile.
- Sau khi gửi, bộ nhận dạng khởi động lại sạch sẽ để lắng nghe lần kích hoạt tiếp theo.

## Bất biến vòng đời

- Nếu Đánh thức bằng giọng nói được bật và quyền đã được cấp, bộ nhận dạng từ đánh thức phải đang lắng nghe (trừ khi đang thu âm nhấn để nói một cách rõ ràng).
- Việc hiển thị lớp phủ (bao gồm đóng thủ công bằng nút X) không bao giờ được ngăn bộ nhận dạng tiếp tục.

## Chế độ lỗi lớp phủ dính (trước đây)

Trước đây, nếu lớp phủ bị kẹt ở trạng thái hiển thị và bạn đóng thủ công, Đánh thức bằng giọng nói có thể trông như "chết" vì nỗ lực khởi động lại của runtime có thể bị chặn bởi trạng thái hiển thị lớp phủ và không có lần khởi động lại tiếp theo nào được lên lịch.

Gia cố:

- Việc khởi động lại runtime đánh thức không còn bị chặn bởi trạng thái hiển thị lớp phủ.
- Hoàn tất đóng lớp phủ sẽ kích hoạt `VoiceWakeRuntime.refresh(...)` qua `VoiceSessionCoordinator`, nên đóng bằng X thủ công luôn tiếp tục lắng nghe.

## Chi tiết nhấn để nói

- Phát hiện phím tắt dùng trình giám sát `.flagsChanged` toàn cục cho **Option phải** (`keyCode 61` + `.option`). Chúng tôi chỉ quan sát sự kiện (không nuốt sự kiện).
- Pipeline thu âm nằm trong `VoicePushToTalk`: khởi động Speech ngay, truyền các phần nhận dạng từng phần tới lớp phủ, và gọi `VoiceWakeForwarder` khi thả phím.
- Khi nhấn để nói bắt đầu, chúng tôi tạm dừng runtime từ đánh thức để tránh các audio tap cạnh tranh; nó tự động khởi động lại sau khi thả phím.
- Quyền: yêu cầu Micrô + Speech; để thấy sự kiện cần phê duyệt Accessibility/Input Monitoring.
- Bàn phím ngoài: một số bàn phím có thể không hiển thị Option phải như mong đợi, hãy cung cấp phím tắt dự phòng nếu người dùng báo bỏ lỡ.

## Cài đặt hướng tới người dùng

- Công tắc **Đánh thức bằng giọng nói**: bật runtime từ đánh thức.
- **Giữ Cmd+Fn để nói**: bật trình giám sát nhấn để nói. Bị tắt trên macOS < 26.
- Bộ chọn ngôn ngữ và micrô, đồng hồ mức âm trực tiếp, bảng từ kích hoạt, trình kiểm thử (chỉ cục bộ; không chuyển tiếp).
- Bộ chọn micrô giữ lựa chọn gần nhất nếu thiết bị ngắt kết nối, hiển thị gợi ý đã ngắt kết nối, và tạm thời quay về mặc định hệ thống cho đến khi thiết bị trở lại.
- **Âm thanh**: chuông khi phát hiện kích hoạt và khi gửi; mặc định là âm thanh hệ thống "Glass" của macOS. Bạn có thể chọn bất kỳ tệp nào `NSSound` tải được (ví dụ MP3/WAV/AIFF) cho từng sự kiện hoặc chọn **Không có âm thanh**.

## Hành vi chuyển tiếp

- Khi Đánh thức bằng giọng nói được bật, bản ghi lời nói được chuyển tiếp tới gateway/agent đang hoạt động (cùng chế độ cục bộ so với từ xa mà phần còn lại của ứng dụng Mac dùng).
- Phản hồi được gửi tới **nhà cung cấp chính được dùng gần nhất** (WhatsApp/Telegram/Discord/WebChat). Nếu gửi thất bại, lỗi được ghi log và lượt chạy vẫn hiển thị qua WebChat/log phiên.

## Payload chuyển tiếp

- `VoiceWakeForwarder.prefixedTranscript(_:)` thêm gợi ý máy vào trước khi gửi. Được chia sẻ giữa đường dẫn từ đánh thức và nhấn để nói.

## Xác minh nhanh

- Bật nhấn để nói, giữ Cmd+Fn, nói, thả: lớp phủ sẽ hiển thị các phần nhận dạng từng phần rồi gửi.
- Trong khi giữ, tai trên thanh menu phải tiếp tục phóng to (dùng `triggerVoiceEars(ttl:nil)`); chúng thu lại sau khi thả.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay)
- [Ứng dụng macOS](/vi/platforms/macos)
