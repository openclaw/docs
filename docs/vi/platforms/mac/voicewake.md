---
read_when:
    - Làm việc với các luồng đánh thức bằng giọng nói hoặc PTT
summary: Các chế độ đánh thức bằng giọng nói và nhấn để nói cùng chi tiết định tuyến trong ứng dụng Mac
title: Đánh thức bằng giọng nói (macOS)
x-i18n:
    generated_at: "2026-04-29T22:57:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Đánh thức bằng giọng nói & Nhấn để nói

## Chế độ

- **Chế độ từ đánh thức** (mặc định): trình nhận dạng Giọng nói luôn bật chờ các token kích hoạt (`swabbleTriggerWords`). Khi khớp, nó bắt đầu thu âm, hiển thị lớp phủ với văn bản từng phần, rồi tự động gửi sau khoảng lặng.
- **Nhấn để nói (giữ Option bên phải)**: giữ phím Option bên phải để thu âm ngay lập tức—không cần kích hoạt. Lớp phủ xuất hiện trong khi giữ; thả ra sẽ hoàn tất và chuyển tiếp sau một độ trễ ngắn để bạn có thể chỉnh văn bản.

## Hành vi runtime (từ đánh thức)

- Trình nhận dạng Giọng nói nằm trong `VoiceWakeRuntime`.
- Kích hoạt chỉ xảy ra khi có một **khoảng dừng có ý nghĩa** giữa từ đánh thức và từ tiếp theo (khoảng cách ~0,55 giây). Lớp phủ/chuông có thể bắt đầu ở khoảng dừng ngay cả trước khi lệnh bắt đầu.
- Cửa sổ im lặng: 2,0 giây khi lời nói đang tiếp diễn, 5,0 giây nếu chỉ nghe thấy kích hoạt.
- Dừng cứng: 120 giây để tránh các phiên chạy mất kiểm soát.
- Debounce giữa các phiên: 350 ms.
- Lớp phủ được điều khiển qua `VoiceWakeOverlayController` với tô màu đã xác nhận/tạm thời.
- Sau khi gửi, trình nhận dạng khởi động lại sạch sẽ để lắng nghe kích hoạt tiếp theo.

## Bất biến vòng đời

- Nếu Đánh thức bằng giọng nói được bật và quyền đã được cấp, trình nhận dạng từ đánh thức phải đang lắng nghe (trừ trong một lần thu nhấn để nói rõ ràng).
- Khả năng hiển thị lớp phủ (bao gồm cả đóng thủ công bằng nút X) không bao giờ được ngăn trình nhận dạng tiếp tục.

## Chế độ lỗi lớp phủ dính (trước đây)

Trước đây, nếu lớp phủ bị kẹt ở trạng thái hiển thị và bạn đóng thủ công, Đánh thức bằng giọng nói có thể trông như “đã chết” vì nỗ lực khởi động lại của runtime có thể bị khả năng hiển thị lớp phủ chặn và không có lần khởi động lại tiếp theo nào được lên lịch.

Gia cố:

- Khởi động lại runtime đánh thức không còn bị khả năng hiển thị lớp phủ chặn.
- Hoàn tất đóng lớp phủ kích hoạt `VoiceWakeRuntime.refresh(...)` qua `VoiceSessionCoordinator`, nên việc đóng thủ công bằng X luôn tiếp tục lắng nghe.

## Chi tiết nhấn để nói

- Phát hiện phím nóng dùng bộ giám sát `.flagsChanged` toàn cục cho **Option bên phải** (`keyCode 61` + `.option`). Chúng tôi chỉ quan sát sự kiện (không chặn).
- Pipeline thu âm nằm trong `VoicePushToTalk`: bắt đầu Giọng nói ngay lập tức, truyền các phần tạm thời tới lớp phủ, và gọi `VoiceWakeForwarder` khi thả ra.
- Khi nhấn để nói bắt đầu, chúng tôi tạm dừng runtime từ đánh thức để tránh các audio tap cạnh tranh; nó tự động khởi động lại sau khi thả ra.
- Quyền: yêu cầu Microphone + Speech; xem sự kiện cần phê duyệt Accessibility/Input Monitoring.
- Bàn phím ngoài: một số bàn phím có thể không bộc lộ Option bên phải như mong đợi—cung cấp phím tắt dự phòng nếu người dùng báo bị bỏ lỡ.

## Cài đặt dành cho người dùng

- Công tắc **Đánh thức bằng giọng nói**: bật runtime từ đánh thức.
- **Giữ Cmd+Fn để nói**: bật bộ giám sát nhấn để nói. Bị tắt trên macOS < 26.
- Bộ chọn ngôn ngữ & mic, đồng hồ mức âm trực tiếp, bảng từ kích hoạt, trình kiểm thử (chỉ cục bộ; không chuyển tiếp).
- Bộ chọn mic giữ lựa chọn gần nhất nếu thiết bị ngắt kết nối, hiển thị gợi ý đã ngắt kết nối, và tạm thời quay về mặc định hệ thống cho đến khi thiết bị trở lại.
- **Âm thanh**: chuông khi phát hiện kích hoạt và khi gửi; mặc định là âm thanh hệ thống “Glass” của macOS. Bạn có thể chọn bất kỳ tệp nào `NSSound` tải được (ví dụ: MP3/WAV/AIFF) cho từng sự kiện hoặc chọn **Không có âm thanh**.

## Hành vi chuyển tiếp

- Khi Đánh thức bằng giọng nói được bật, bản chép lời được chuyển tiếp tới gateway/agent đang hoạt động (cùng chế độ cục bộ so với từ xa được phần còn lại của ứng dụng Mac dùng).
- Câu trả lời được gửi tới **nhà cung cấp chính được dùng gần nhất** (WhatsApp/Telegram/Discord/WebChat). Nếu gửi thất bại, lỗi được ghi log và lượt chạy vẫn hiển thị qua log WebChat/phiên.

## Payload chuyển tiếp

- `VoiceWakeForwarder.prefixedTranscript(_:)` thêm gợi ý máy vào trước khi gửi. Được dùng chung giữa các đường dẫn từ đánh thức và nhấn để nói.

## Xác minh nhanh

- Bật nhấn để nói, giữ Cmd+Fn, nói, thả ra: lớp phủ phải hiển thị các phần tạm thời rồi gửi.
- Trong khi giữ, tai trên thanh menu phải vẫn phóng to (dùng `triggerVoiceEars(ttl:nil)`); chúng hạ xuống sau khi thả ra.

## Liên quan

- [Đánh thức bằng giọng nói](/vi/nodes/voicewake)
- [Lớp phủ giọng nói](/vi/platforms/mac/voice-overlay)
- [Ứng dụng macOS](/vi/platforms/macos)
