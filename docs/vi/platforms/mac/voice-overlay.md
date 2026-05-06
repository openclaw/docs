---
read_when:
    - Điều chỉnh hành vi lớp phủ giọng nói
summary: Vòng đời của lớp phủ giọng nói khi từ đánh thức và nhấn để nói chồng lấn
title: Lớp phủ giọng nói
x-i18n:
    generated_at: "2026-05-06T09:21:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Vòng đời lớp phủ giọng nói (macOS)

Đối tượng: người đóng góp cho ứng dụng macOS. Mục tiêu: giữ cho lớp phủ giọng nói hoạt động có thể dự đoán khi từ đánh thức và nhấn để nói chồng lấp.

## Ý định hiện tại

- Nếu lớp phủ đã hiển thị từ từ đánh thức và người dùng nhấn phím nóng, phiên phím nóng sẽ _tiếp nhận_ văn bản hiện có thay vì đặt lại. Lớp phủ vẫn hiển thị trong khi phím nóng được giữ. Khi người dùng thả phím: gửi nếu có văn bản sau khi cắt khoảng trắng, nếu không thì đóng.
- Chỉ dùng từ đánh thức thì vẫn tự động gửi khi im lặng; nhấn để nói gửi ngay khi thả phím.

## Đã triển khai (ngày 9 tháng 12 năm 2025)

- Các phiên lớp phủ giờ mang một token cho mỗi lần thu âm (từ đánh thức hoặc nhấn để nói). Các cập nhật tạm thời/cuối/gửi/đóng/mức sẽ bị bỏ khi token không khớp, tránh callback cũ.
- Nhấn để nói tiếp nhận mọi văn bản lớp phủ đang hiển thị làm tiền tố (vì vậy nhấn phím nóng khi lớp phủ đánh thức đang hiển thị sẽ giữ văn bản và nối thêm lời nói mới). Nó đợi tối đa 1,5 giây để nhận bản ghi cuối trước khi quay về văn bản hiện tại.
- Ghi log âm báo/lớp phủ được phát ra ở mức `info` trong các danh mục `voicewake.overlay`, `voicewake.ptt`, và `voicewake.chime` (bắt đầu phiên, tạm thời, cuối, gửi, đóng, lý do âm báo).

## Bước tiếp theo

1. **VoiceSessionCoordinator (actor)**
   - Sở hữu đúng một `VoiceSession` tại một thời điểm.
   - API (dựa trên token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Bỏ các callback mang token cũ (ngăn bộ nhận dạng cũ mở lại lớp phủ).
2. **VoiceSession (mô hình)**
   - Trường: `token`, `source` (wakeWord|pushToTalk), văn bản đã xác nhận/tạm thời, cờ âm báo, bộ hẹn giờ (tự động gửi, rảnh), `overlayMode` (display|editing|sending), thời hạn hồi chiêu.
3. **Liên kết lớp phủ**
   - `VoiceSessionPublisher` (`ObservableObject`) phản chiếu phiên đang hoạt động vào SwiftUI.
   - `VoiceWakeOverlayView` chỉ kết xuất qua publisher; nó không bao giờ trực tiếp thay đổi singleton toàn cục.
   - Hành động người dùng trên lớp phủ (`sendNow`, `dismiss`, `edit`) gọi ngược vào coordinator với token phiên.
4. **Đường gửi hợp nhất**
   - Khi `endCapture`: nếu văn bản sau khi cắt khoảng trắng rỗng → đóng; nếu không thì `performSend(session:)` (phát âm báo gửi một lần, chuyển tiếp, đóng).
   - Nhấn để nói: không trì hoãn; từ đánh thức: có thể trì hoãn để tự động gửi.
   - Áp dụng một hồi chiêu ngắn cho runtime đánh thức sau khi nhấn để nói kết thúc để từ đánh thức không kích hoạt lại ngay lập tức.
5. **Ghi log**
   - Coordinator phát log `.info` trong subsystem `ai.openclaw`, danh mục `voicewake.overlay` và `voicewake.chime`.
   - Sự kiện chính: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Danh sách kiểm tra gỡ lỗi

- Phát trực tiếp log khi tái hiện lớp phủ bị kẹt:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Xác minh chỉ có một token phiên đang hoạt động; callback cũ phải bị coordinator bỏ.
- Đảm bảo khi thả nhấn để nói luôn gọi `endCapture` với token đang hoạt động; nếu văn bản rỗng, kỳ vọng `dismiss` mà không có âm báo hoặc gửi.

## Bước di chuyển (đề xuất)

1. Thêm `VoiceSessionCoordinator`, `VoiceSession`, và `VoiceSessionPublisher`.
2. Tái cấu trúc `VoiceWakeRuntime` để tạo/cập nhật/kết thúc phiên thay vì chạm trực tiếp vào `VoiceWakeOverlayController`.
3. Tái cấu trúc `VoicePushToTalk` để tiếp nhận phiên hiện có và gọi `endCapture` khi thả; áp dụng hồi chiêu runtime.
4. Nối `VoiceWakeOverlayController` với publisher; loại bỏ các lệnh gọi trực tiếp từ runtime/PTT.
5. Thêm kiểm thử tích hợp cho tiếp nhận phiên, hồi chiêu và đóng khi văn bản rỗng.

## Liên quan

- [ứng dụng macOS](/vi/platforms/macos)
- [Đánh thức bằng giọng nói (macOS)](/vi/platforms/mac/voicewake)
- [Chế độ trò chuyện](/vi/nodes/talk)
