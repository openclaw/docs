---
read_when:
    - Bạn muốn một agent OpenClaw tham gia cuộc họp Microsoft Teams
    - Bạn đang cấu hình Chrome, BlackHole hoặc SoX để phản hồi bằng giọng nói trong cuộc họp Teams
summary: 'Plugin cuộc họp Microsoft Teams: tham gia cuộc họp công việc hoặc cá nhân với tư cách khách bằng trình duyệt Chrome'
title: Plugin cuộc họp Microsoft Teams
x-i18n:
    generated_at: "2026-07-19T05:58:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff20854cca39dcf66d2916eff19c00e08136bf944dfb0274cf8f7cb3c8e77730
    source_path: plugins/teams-meetings.md
    workflow: 16
---

Plugin `teams-meetings` tham gia các liên kết Microsoft Teams với tư cách khách trong hồ sơ Chrome của OpenClaw. Plugin chấp nhận các liên kết dành cho cơ quan thuộc `teams.microsoft.com/l/meetup-join/...` và các liên kết dành cho người tiêu dùng thuộc `teams.live.com/meet/...`. Plugin không tạo cuộc họp, quay số tham gia, gọi Microsoft Graph hoặc ghi lại cuộc họp.

## Thiết lập

Tính năng phản hồi bằng giọng nói sử dụng cùng các điều kiện tiên quyết về âm thanh cục bộ như [plugin Google Meet](/vi/plugins/google-meet): macOS, thiết bị âm thanh ảo `BlackHole 2ch` và SoX.

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Bật plugin, sau đó kiểm tra thiết lập:

```json5
{
  plugins: {
    entries: {
      "teams-meetings": {
        enabled: true,
        config: {
          defaultMode: "agent",
          chrome: { guestName: "OpenClaw Agent" },
        },
      },
    },
  },
}
```

```bash
openclaw teamsmeetings setup
openclaw teamsmeetings join 'https://teams.microsoft.com/l/meetup-join/...'
```

Sử dụng `chromeNode.node` để chạy Chrome, BlackHole và SoX trên một node macOS đã ghép nối. Node phải cho phép `teamsmeetings.chrome` và `browser.proxy`.

## Chế độ

| Chế độ         | Hành vi                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| `agent`      | Bản chép lời theo thời gian thực tham vấn tác nhân OpenClaw đã cấu hình; TTS phản hồi. |
| `bidi`       | Mô hình giọng nói theo thời gian thực trực tiếp lắng nghe và phản hồi.                        |
| `transcribe` | Tham gia chỉ để quan sát, với các ảnh chụp nhanh bản chép lời từ phụ đề trực tiếp.                   |

Chế độ chép lời bật phụ đề trực tiếp của Teams sau khi được chấp nhận vào cuộc họp và thu thập các hàng phụ đề có thông tin người nói. Hành động `transcript` trả về bộ đệm phụ đề có giới hạn cho phiên họp OpenClaw đang hoạt động.

## Giới hạn khi tham gia với tư cách khách

Bộ điều hợp trình duyệt đóng màn hình xen kẽ mời mở ứng dụng, điền tên khách, tắt camera, cấu hình micrô cho chế độ đã chọn và nhấp vào nút tham gia. Trạng thái trong cuộc gọi sử dụng nút gác máy; các trạng thái sảnh chờ, đăng nhập đối tượng thuê và cấp quyền thiết bị trả về lý do rõ ràng yêu cầu thao tác thủ công. Hỗ trợ các chuyển hướng của trình khởi chạy cuộc họp dành cho người tiêu dùng và nhãn `BlackHole 2ch (Virtual)` do Chrome hiển thị.

Chính sách đối tượng thuê Teams có thể yêu cầu đăng nhập, xác minh email hoặc được người tổ chức chấp nhận. Hoàn tất bước đó trong hồ sơ Chrome của OpenClaw, sau đó thử lại thao tác kiểm tra trạng thái hoặc phát lời nói. Plugin không bỏ qua chính sách đối tượng thuê.

Ứng dụng web Teams dành cho người tiêu dùng đã được xác thực trực tiếp đối với màn hình xen kẽ mời mở ứng dụng, nhập tên khách, bật/tắt micrô và camera trước khi tham gia, tham gia, được chấp nhận từ sảnh chờ, quyền phương tiện, phát hiện trạng thái trong cuộc gọi, phụ đề trực tiếp, định tuyến đầu vào/đầu ra BlackHole, rời khỏi cuộc gọi và phát hiện trạng thái sau cuộc gọi. Các đối tượng thuê dành cho cơ quan có thể áp dụng chính sách khác về đăng nhập, xác minh email, chấp nhận tham gia và xác nhận rời khỏi; hãy hoàn tất mọi thao tác thủ công được báo cáo trong hồ sơ Chrome của OpenClaw.

## Bề mặt công cụ và Gateway

Công cụ tác nhân `teams_meetings` hỗ trợ `join`, `leave`, `status`, `transcript` và `speak`. Các phương thức Gateway sử dụng tiền tố `teamsmeetings.*`. Lệnh node là `teamsmeetings.chrome`.

## Liên quan

- [Tổng quan về các plugin cuộc họp](/plugins/meeting-plugins)
- [Kênh Microsoft Teams](/vi/channels/msteams)
