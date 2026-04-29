---
read_when:
    - Điều chỉnh hành vi lớp phủ giọng nói
summary: Vòng đời lớp phủ giọng nói khi từ đánh thức và nhấn để nói chồng lấp
title: Lớp phủ giọng nói
x-i18n:
    generated_at: "2026-04-29T22:57:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Vòng đời lớp phủ thoại (macOS)

Đối tượng: người đóng góp cho ứng dụng macOS. Mục tiêu: giữ cho lớp phủ thoại có hành vi dự đoán được khi từ đánh thức và nhấn-để-nói chồng lấp.

## Ý định hiện tại

- Nếu lớp phủ đã hiển thị do từ đánh thức và người dùng nhấn phím tắt, phiên phím tắt sẽ _tiếp nhận_ văn bản hiện có thay vì đặt lại văn bản đó. Lớp phủ vẫn hiển thị trong khi phím tắt được giữ. Khi người dùng nhả phím: gửi nếu có văn bản sau khi cắt khoảng trắng, nếu không thì đóng.
- Chỉ dùng từ đánh thức vẫn tự động gửi khi im lặng; nhấn-để-nói gửi ngay khi nhả phím.

## Đã triển khai (ngày 9 tháng 12 năm 2025)

- Các phiên lớp phủ giờ mang một token cho mỗi lần thu âm (từ đánh thức hoặc nhấn-để-nói). Các cập nhật partial/final/send/dismiss/level bị bỏ qua khi token không khớp, tránh callback lỗi thời.
- Nhấn-để-nói tiếp nhận mọi văn bản lớp phủ đang hiển thị làm tiền tố (vì vậy nhấn phím tắt trong khi lớp phủ đánh thức đang mở sẽ giữ văn bản và nối thêm lời nói mới). Nó chờ tối đa 1,5 giây để có bản chép lời cuối cùng trước khi quay về văn bản hiện tại.
- Nhật ký chuông/lớp phủ được phát ở mức `info` trong các danh mục `voicewake.overlay`, `voicewake.ptt`, và `voicewake.chime` (bắt đầu phiên, partial, final, send, dismiss, lý do chuông).

## Các bước tiếp theo

1. **VoiceSessionCoordinator (actor)**
   - Sở hữu đúng một `VoiceSession` tại một thời điểm.
   - API (dựa trên token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Bỏ qua các callback mang token lỗi thời (ngăn các bộ nhận dạng cũ mở lại lớp phủ).
2. **VoiceSession (model)**
   - Trường: `token`, `source` (wakeWord|pushToTalk), văn bản đã xác nhận/tạm thời, cờ chuông, bộ hẹn giờ (tự động gửi, nhàn rỗi), `overlayMode` (display|editing|sending), hạn chót cooldown.
3. **Liên kết lớp phủ**
   - `VoiceSessionPublisher` (`ObservableObject`) phản chiếu phiên đang hoạt động vào SwiftUI.
   - `VoiceWakeOverlayView` chỉ render qua publisher; nó không bao giờ trực tiếp thay đổi singleton toàn cục.
   - Hành động của người dùng trên lớp phủ (`sendNow`, `dismiss`, `edit`) gọi ngược vào coordinator với token của phiên.
4. **Đường gửi thống nhất**
   - Khi `endCapture`: nếu văn bản sau khi cắt khoảng trắng rỗng → đóng; nếu không thì `performSend(session:)` (phát chuông gửi một lần, chuyển tiếp, đóng).
   - Nhấn-để-nói: không trì hoãn; từ đánh thức: có thể trì hoãn để tự động gửi.
   - Áp dụng cooldown ngắn cho runtime đánh thức sau khi nhấn-để-nói kết thúc để từ đánh thức không kích hoạt lại ngay lập tức.
5. **Ghi nhật ký**
   - Coordinator phát nhật ký `.info` trong subsystem `ai.openclaw`, các danh mục `voicewake.overlay` và `voicewake.chime`.
   - Sự kiện chính: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Danh sách kiểm tra gỡ lỗi

- Truyền luồng nhật ký trong khi tái hiện lớp phủ bị kẹt:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Xác minh chỉ có một token phiên đang hoạt động; các callback lỗi thời phải bị coordinator bỏ qua.
- Đảm bảo việc nhả nhấn-để-nói luôn gọi `endCapture` với token đang hoạt động; nếu văn bản rỗng, kỳ vọng `dismiss` mà không có chuông hoặc gửi.

## Các bước di chuyển (đề xuất)

1. Thêm `VoiceSessionCoordinator`, `VoiceSession`, và `VoiceSessionPublisher`.
2. Tái cấu trúc `VoiceWakeRuntime` để tạo/cập nhật/kết thúc phiên thay vì chạm trực tiếp vào `VoiceWakeOverlayController`.
3. Tái cấu trúc `VoicePushToTalk` để tiếp nhận các phiên hiện có và gọi `endCapture` khi nhả phím; áp dụng cooldown runtime.
4. Nối `VoiceWakeOverlayController` vào publisher; xóa các lệnh gọi trực tiếp từ runtime/PTT.
5. Thêm kiểm thử tích hợp cho việc tiếp nhận phiên, cooldown, và đóng khi văn bản rỗng.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Đánh thức bằng giọng nói (macOS)](/vi/platforms/mac/voicewake)
- [Chế độ nói](/vi/nodes/talk)
