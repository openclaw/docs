---
read_when:
    - Bạn muốn một agent OpenClaw tham gia cuộc họp Zoom
    - Bạn đang cấu hình Chrome, BlackHole hoặc SoX để phản hồi âm thanh trong cuộc họp Zoom
summary: 'Plugin cuộc họp Zoom: tham gia cuộc họp với tư cách khách bằng trình duyệt Chrome'
title: Plugin cuộc họp Zoom
x-i18n:
    generated_at: "2026-07-19T05:59:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a647a135e908b8f56eacaaefd4b42ca87161f611edb8eac335553414850ebec2
    source_path: plugins/zoom-meetings.md
    workflow: 16
---

Plugin `zoom-meetings` tham gia các liên kết cuộc họp Zoom với tư cách khách thông qua Zoom Web App trong hồ sơ Chrome của OpenClaw. Plugin chấp nhận các liên kết cuộc họp thuộc `zoom.us/j/...` và các miền con của tài khoản như `example.zoom.us/j/...`. Plugin không tạo cuộc họp, tham gia qua điện thoại, sử dụng Zoom Meeting SDK hoặc ghi lại cuộc họp.

## Thiết lập

Tính năng phản hồi bằng giọng nói sử dụng cùng các điều kiện tiên quyết về âm thanh cục bộ như [Plugin Google Meet](/vi/plugins/google-meet): macOS, thiết bị âm thanh ảo `BlackHole 2ch` và SoX.

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Bật Plugin, sau đó kiểm tra thiết lập:

```json5
{
  plugins: {
    entries: {
      "zoom-meetings": {
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
openclaw zoommeetings setup
openclaw zoommeetings join 'https://zoom.us/j/1234567890'
```

Sử dụng `chromeNode.node` để chạy Chrome, BlackHole và SoX trên một Node macOS đã ghép nối. Node phải cho phép `zoommeetings.chrome` và `browser.proxy`.

## Chế độ

| Chế độ         | Hành vi                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| `agent`      | Bản chép lời theo thời gian thực tham vấn agent OpenClaw đã cấu hình; TTS phản hồi. |
| `bidi`       | Mô hình giọng nói theo thời gian thực lắng nghe và phản hồi trực tiếp.                        |
| `transcribe` | Chỉ tham gia để quan sát, kèm các ảnh chụp nhanh bản chép lời từ phụ đề trực tiếp.                   |

Chế độ chép lời bật phụ đề trực tiếp của Zoom sau khi được chấp thuận tham gia và ghi lại phần hiển thị phụ đề trong giới hạn. Hành động `transcript` trả về bộ đệm phụ đề cho phiên họp OpenClaw đang hoạt động.

## Giới hạn khi tham gia với tư cách khách

Bộ điều hợp trình duyệt chọn **Join from browser**, điền tên khách, tắt camera, cấu hình micrô cho chế độ đã chọn và nhấp vào **Join**. Zoom Web App chạy dưới `app.zoom.us`; Plugin cấp quyền sử dụng micrô và chọn loa cho nguồn đó trước khi điều hướng. Trạng thái trong cuộc gọi sử dụng điều khiển Leave của Zoom. Các trạng thái phòng chờ, đăng nhập, mật mã, CAPTCHA và quyền thiết bị trả về lý do rõ ràng yêu cầu thao tác thủ công.

Chính sách của máy chủ và tài khoản Zoom có thể vô hiệu hóa tính năng tham gia qua trình duyệt, yêu cầu xác thực hoặc xác minh email, hiển thị CAPTCHA hoặc yêu cầu máy chủ chấp thuận. Hoàn tất bước đó trong hồ sơ Chrome của OpenClaw, sau đó thử lại thao tác kiểm tra trạng thái hoặc phát lời nói. Plugin không vượt qua chính sách của Zoom.

Zoom Web App đã được xác thực trực tiếp bằng một cuộc họp thử nghiệm chính thức của Zoom đối với màn hình chuyển tiếp của ứng dụng, thao tác nhập tên khách trong iframe, các nút điều khiển micrô và camera trước khi tham gia, thao tác tham gia, quyền phương tiện của trình duyệt và macOS, khả năng phát hiện trạng thái trong cuộc gọi, bật phụ đề trực tiếp và phát hiện cuộc họp đã bị máy chủ kết thúc. Các trạng thái phòng chờ và xác thực phụ thuộc vào chính sách của máy chủ và vẫn dùng phương án dự phòng dựa trên văn bản khi không có mã định danh DOM ổn định.

## Bề mặt công cụ và Gateway

Công cụ agent `zoom_meetings` hỗ trợ `join`, `leave`, `status`, `transcript` và `speak`. Các phương thức Gateway sử dụng tiền tố `zoommeetings.*`. Lệnh Node là `zoommeetings.chrome`.

## Liên quan

- [Tổng quan về các Plugin cuộc họp](/plugins/meeting-plugins)
