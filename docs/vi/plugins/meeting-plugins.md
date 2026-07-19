---
read_when:
    - Bạn muốn một tác tử OpenClaw tham gia cuộc họp video
    - Bạn đang lựa chọn giữa các plugin cuộc họp Google Meet, Microsoft Teams và Zoom
    - Bạn cần thiết lập Chrome dùng chung, BlackHole, SoX hoặc chế độ cuộc họp
summary: Chọn và cấu hình việc tham gia cuộc họp trên Google Meet, Microsoft Teams hoặc Zoom
title: Plugin cuộc họp
x-i18n:
    generated_at: "2026-07-19T06:14:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ac4357a2ff938f519d4b1112279fe7a7e45d9ae6d679c9eb6d7948fca976b8b
    source_path: plugins/meeting-plugins.md
    workflow: 16
---

OpenClaw có các plugin riêng cho Google Meet, cuộc họp Microsoft Teams và Zoom. Cả ba đều có thể tham gia qua Chrome, sử dụng cùng các chế độ tham gia và chạy Chrome trên máy chủ Gateway hoặc trên một node đã ghép đôi. URL nền tảng, mô hình cài đặt và các khả năng bổ sung của chúng khác nhau.

Các plugin này tham gia cuộc họp. Chúng tách biệt với các kênh nhắn tin như [kênh Microsoft Teams](/vi/channels/msteams) và [Plugin cuộc gọi thoại](/vi/plugins/voice-call).

## Chọn một plugin

| Nền tảng        | Plugin                                      | Liên kết cuộc họp được chấp nhận                                                                                      | Cài đặt                             | Cách thức tham gia                                      | Khả năng dành riêng cho nền tảng                                                                                |
| --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Google Meet     | [`google-meet`](/vi/plugins/google-meet)       | `meet.google.com/...`                                                                                       | Cài đặt từ npm hoặc ClawHub, sau đó bật | Chrome cục bộ, Chrome trên node đã ghép đôi hoặc gọi vào qua Twilio | Có thể tạo cuộc họp thông qua Meet API hoặc trình duyệt đã đăng nhập; có thể đọc các thành phần Meet được hỗ trợ bằng OAuth |
| Microsoft Teams | [`teams-meetings`](/plugins/teams-meetings) | Liên kết công việc trong `teams.microsoft.com/l/meetup-join/...` và liên kết người tiêu dùng trong `teams.live.com/meet/...` | Được tích hợp sẵn; hãy bật plugin                      | Chrome cục bộ hoặc Chrome trên node đã ghép đôi                  | Tham gia với tư cách khách vào cuộc họp công việc và cuộc họp người tiêu dùng                                                                     |
| Zoom            | [`zoom-meetings`](/plugins/zoom-meetings)   | `zoom.us/j/...` và các miền con của tài khoản như `example.zoom.us/j/...`                                      | Được tích hợp sẵn; hãy bật plugin                      | Chrome cục bộ hoặc Chrome trên node đã ghép đôi                  | Tham gia với tư cách khách thông qua Zoom Web App                                                                           |

Chọn Google Meet khi bạn cần tạo cuộc họp, sử dụng các thành phần Google API hoặc đường điện thoại Twilio. Chọn Teams hoặc Zoom để tham gia trực tiếp với tư cách khách qua trình duyệt trên các nền tảng đó. Các plugin Teams và Zoom không tạo cuộc họp, gọi vào, gọi API của nhà cung cấp hoặc ghi lại cuộc họp.

## Chọn một chế độ

Ba plugin dùng chung các chế độ sau:

| Chế độ         | Hành vi                                                                                              | Yêu cầu âm thanh                                      |
| ------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `agent`      | Bản chép lời theo thời gian thực được gửi đến agent OpenClaw đã cấu hình; TTS OpenClaw thông thường đọc câu trả lời.  | Tính năng phản hồi bằng giọng nói qua Chrome yêu cầu cầu nối BlackHole và SoX. |
| `bidi`       | Mô hình giọng nói theo thời gian thực trực tiếp lắng nghe và trả lời.                                                  | Tính năng phản hồi bằng giọng nói qua Chrome yêu cầu cầu nối BlackHole và SoX. |
| `transcribe` | Tham gia ở chế độ chỉ quan sát và cung cấp bản chép lời phụ đề trực tiếp có giới hạn khi nền tảng cung cấp phụ đề. | Không có cầu nối phản hồi bằng giọng nói BlackHole hoặc SoX.                   |

Sử dụng `transcribe` khi agent chỉ cần văn bản cuộc họp. Sử dụng `agent` cho khả năng suy luận và công cụ OpenClaw thông thường. Sử dụng `bidi` khi giọng nói trực tiếp có độ trễ thấp quan trọng hơn việc định tuyến từng lượt qua agent thông thường.

Bản chép lời phụ đề là dữ liệu thời gian chạy thuộc phạm vi phiên, không phải bản ghi cuộc họp lâu dài. Khả năng cung cấp phụ đề vẫn phụ thuộc vào nền tảng cuộc họp, tài khoản, ngôn ngữ và chính sách của người chủ trì. Xem hướng dẫn nền tảng để biết các giới hạn về bản chép lời và trường trạng thái.

## Chuẩn bị Chrome và âm thanh

Chrome có thể chạy trên máy chủ Gateway hoặc trên một node đã ghép đôi. Node Chrome từ xa phải cho phép `browser.proxy` cùng với lệnh nền tảng:

| Plugin          | Lệnh node           |
| --------------- | ---------------------- |
| Google Meet     | `googlemeet.chrome`    |
| Microsoft Teams | `teamsmeetings.chrome` |
| Zoom            | `zoommeetings.chrome`  |

Đối với chế độ `agent` hoặc `bidi` qua Chrome, hãy chạy Chrome trên macOS và cài đặt các phần phụ thuộc âm thanh dùng chung trên cùng máy chủ đó:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Máy chủ Gateway vẫn quản lý agent OpenClaw và thông tin xác thực mô hình khi Chrome chạy trên một node đã ghép đôi. Cấu hình nhà cung cấp chép lời theo thời gian thực và TTS OpenClaw cho chế độ `agent`, hoặc nhà cung cấp giọng nói theo thời gian thực cho chế độ `bidi`. Các hướng dẫn nền tảng chứa các tùy chọn về nhà cung cấp và lệnh âm thanh.

## Bật plugin

Cài đặt Google Meet trước khi bật. Cuộc họp Teams và Zoom được tích hợp sẵn trong OpenClaw và chỉ cần được bật:

```bash
# Chỉ Google Meet
openclaw plugins install npm:@openclaw/google-meet

# Chỉ bật các plugin cuộc họp bạn sử dụng
openclaw plugins enable google-meet
openclaw plugins enable teams-meetings
openclaw plugins enable zoom-meetings
```

Khởi động lại Gateway nếu cách quản lý plugin của bạn không tự động khởi động lại Gateway. Sau đó chạy kiểm tra thiết lập nền tảng trước khi tham gia.

## Xác minh và tham gia

| Nền tảng        | Kiểm tra thiết lập                    | Lệnh tham gia                                                                  |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| Google Meet     | `openclaw googlemeet setup`    | `openclaw googlemeet join 'https://meet.google.com/abc-defg-hij'`             |
| Microsoft Teams | `openclaw teamsmeetings setup` | `openclaw teamsmeetings join 'https://teams.microsoft.com/l/meetup-join/...'` |
| Zoom            | `openclaw zoommeetings setup`  | `openclaw zoommeetings join 'https://zoom.us/j/1234567890'`                   |

Coi mọi kiểm tra thiết lập không thành công là yếu tố chặn đối với phương thức truyền tải và chế độ đó. Để kiểm thử nhanh ở chế độ chỉ quan sát, hãy chọn chế độ `transcribe` và xác nhận rằng trạng thái báo cáo một phiên đang trong cuộc gọi trước khi chờ văn bản phụ đề.

## Xử lý lời nhắc về chính sách nền tảng

Tự động hóa trình duyệt xử lý các tùy chọn thông thường về tên khách, camera và micrô trước khi tham gia, tham gia, trong cuộc gọi và rời khỏi. Tính năng này không bỏ qua chính sách của nền tảng hoặc người tổ chức.

- Google Meet có thể yêu cầu đăng nhập Google, được người chủ trì chấp thuận hoặc quyết định cấp quyền trình duyệt.
- Microsoft Teams có thể yêu cầu đăng nhập vào đối tượng thuê, xác minh email hoặc được người tổ chức chấp thuận.
- Zoom có thể yêu cầu xác thực, xác minh email, mật mã, hoàn thành CAPTCHA hoặc được người chủ trì chấp thuận; tài khoản cũng có thể vô hiệu hóa tính năng tham gia qua trình duyệt.

Khi kết quả tham gia hoặc trạng thái báo cáo `manualActionRequired`, hãy hoàn tất bước được báo cáo trong cùng hồ sơ Chrome của OpenClaw trước khi thử lại. Việc liên tục mở tab mới không giải quyết được rào cản về tài khoản, đối tượng thuê, phòng chờ hoặc CAPTCHA.

Chỉ tham gia các cuộc họp mà người vận hành được phép thêm agent. Thông báo cho người tham gia khi chính sách địa phương hoặc quy tắc đồng thuận yêu cầu công bố việc tham gia tự động, chép lời hoặc sử dụng giọng nói tổng hợp.

## Trò chuyện thoại Discord

[Các kênh thoại Discord](/vi/channels/discord#voice-channels) cung cấp cuộc trò chuyện theo thời gian thực chỉ có âm thanh theo cách gốc mà không cần tự động hóa cuộc họp qua trình duyệt. OpenClaw có thể tham gia kênh thoại, lắng nghe, định tuyến các lượt qua agent OpenClaw hoặc mô hình giọng nói theo thời gian thực và đọc câu trả lời. Tính năng này không gửi hoặc nhận video camera hay nội dung chia sẻ màn hình, ngay cả khi mọi người sử dụng video trong cùng kênh Discord, vì vậy thoại Discord là một bề mặt trò chuyện trực tiếp có liên quan chứ không phải plugin cuộc họp qua trình duyệt thứ tư.

## Hướng dẫn nền tảng

- [Plugin Google Meet](/vi/plugins/google-meet)
- [Plugin cuộc họp Microsoft Teams](/plugins/teams-meetings)
- [Plugin cuộc họp Zoom](/plugins/zoom-meetings)
- [Quản lý plugin](/vi/plugins/manage-plugins)
- [Điều khiển trình duyệt](/vi/tools/browser)
