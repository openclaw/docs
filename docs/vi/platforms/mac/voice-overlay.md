---
read_when:
    - Điều chỉnh hành vi lớp phủ giọng nói
summary: Vòng đời của lớp phủ giọng nói khi tính năng đánh thức bằng từ khóa và nhấn để nói chồng lấn nhau
title: Lớp phủ giọng nói
x-i18n:
    generated_at: "2026-07-12T08:07:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Vòng đời lớp phủ giọng nói (macOS)

Đối tượng: người đóng góp cho ứng dụng macOS. Mục tiêu: duy trì hoạt động có thể dự đoán của lớp phủ giọng nói khi tính năng đánh thức bằng từ khóa và nhấn để nói chồng lấn nhau.

## Hành vi

- Nếu lớp phủ đã hiển thị do tính năng đánh thức bằng từ khóa và người dùng nhấn phím nóng, phiên phím nóng sẽ tiếp nhận văn bản hiện có thay vì đặt lại. Lớp phủ tiếp tục hiển thị trong khi phím nóng được giữ. Khi nhả phím: gửi nếu có văn bản sau khi loại bỏ khoảng trắng ở đầu và cuối, nếu không thì đóng.
- Chỉ riêng tính năng đánh thức bằng từ khóa vẫn tự động gửi khi phát hiện khoảng lặng; tính năng nhấn để nói gửi ngay khi nhả phím.

## Triển khai

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) là thành phần duy nhất sở hữu phiên giọng nói đang hoạt động. Đây là một singleton `@MainActor @Observable`, không phải actor. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Mỗi phiên mang một token `UUID`; các lệnh gọi có token cũ hoặc không khớp sẽ bị loại bỏ.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) kết xuất lớp phủ và chuyển tiếp các thao tác của người dùng (`requestSend`, `dismiss`) trở lại điều phối viên thông qua token phiên. Thành phần này không bao giờ tự sở hữu trạng thái phiên.
- Tính năng nhấn để nói (`VoicePushToTalk.begin()`) tiếp nhận mọi văn bản lớp phủ đang hiển thị làm `adoptedPrefix` (thông qua `VoiceSessionCoordinator.shared.snapshot()`), nhờ đó việc nhấn phím nóng khi lớp phủ đánh thức đang hiển thị sẽ giữ nguyên văn bản và nối thêm lời nói mới. Khi nhả phím, tính năng này chờ tối đa 1,5 giây để nhận bản chép lời cuối cùng trước khi dùng văn bản hiện tại làm phương án dự phòng.
- Khi `dismiss`, lớp phủ gọi `VoiceSessionCoordinator.overlayDidDismiss`, từ đó kích hoạt `VoiceWakeRuntime.refresh(state:)` để thao tác đóng thủ công bằng nút X, đóng khi văn bản trống và đóng sau khi gửi đều tiếp tục quá trình lắng nghe từ khóa đánh thức.
- Luồng gửi hợp nhất: nếu văn bản sau khi loại bỏ khoảng trắng ở đầu và cuối bị trống thì đóng; nếu không, `sendNow` phát âm báo gửi một lần, chuyển tiếp qua `VoiceWakeForwarder`, rồi đóng.

## Ghi nhật ký

Hệ thống con giọng nói là `ai.openclaw`; mỗi thành phần ghi nhật ký trong danh mục riêng:

| Danh mục                | Thành phần                                      |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Phím nóng và quá trình thu âm khi nhấn để nói   |
| `voicewake.runtime`     | Môi trường chạy đánh thức bằng từ khóa          |
| `voicewake.chime`       | Phát âm báo                                     |
| `voicewake.sync`        | Đồng bộ cài đặt toàn cục                        |
| `voicewake.forward`     | Chuyển tiếp bản chép lời                        |
| `voicewake.meter`       | Theo dõi mức âm thanh của micrô                 |

## Danh sách kiểm tra gỡ lỗi

- Truyền trực tiếp nhật ký trong khi tái hiện lỗi lớp phủ bị kẹt:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Xác minh chỉ có một token phiên đang hoạt động; các lệnh gọi lại cũ sẽ bị điều phối viên loại bỏ.
- Xác nhận thao tác nhả phím nhấn để nói luôn gọi `end()` với token đang hoạt động; nếu văn bản trống, lớp phủ phải đóng mà không phát âm báo hoặc gửi.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Đánh thức bằng giọng nói (macOS)](/vi/platforms/mac/voicewake)
- [Chế độ trò chuyện](/vi/nodes/talk)
