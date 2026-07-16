---
read_when:
    - Thay đổi hành vi hoặc giá trị mặc định của từ đánh thức bằng giọng nói
    - Thêm nền tảng Node mới cần đồng bộ từ đánh thức
summary: Các từ khóa đánh thức bằng giọng nói dùng chung (do Gateway quản lý) và cách chúng đồng bộ giữa các Node
title: Đánh thức bằng giọng nói
x-i18n:
    generated_at: "2026-07-16T14:44:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

Các từ đánh thức là **một danh sách toàn cục duy nhất do Gateway quản lý** — không có danh sách tùy chỉnh theo từng Node. Mọi Node hoặc giao diện người dùng của ứng dụng đều có thể chỉnh sửa danh sách; Gateway lưu thay đổi và phát thay đổi đó đến mọi máy khách đang kết nối.

- **macOS**: nút bật/tắt Voice Wake cục bộ. Yêu cầu macOS 26+; xem [Đánh thức bằng giọng nói (macOS)](/vi/platforms/mac/voicewake) để biết chi tiết về runtime/PTT.
- **iOS**: nút bật/tắt Voice Wake cục bộ trong Settings.
- **Android**: nút bật/tắt Voice Wake cục bộ và trình chỉnh sửa từ đánh thức trong Settings → Voice. Yêu cầu tính năng nhận dạng giọng nói trên thiết bị của Android.

## Lưu trữ

Các từ đánh thức và quy tắc định tuyến nằm trong cơ sở dữ liệu trạng thái của Gateway, mặc định là `~/.openclaw/state/openclaw.sqlite` (ghi đè bằng `OPENCLAW_STATE_DIR`), trong các bảng `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. Các tệp cũ `settings/voicewake.json` và `settings/voicewake-routing.json` chỉ là đầu vào di chuyển của `openclaw doctor --fix` — runtime không bao giờ đọc chúng.

## Giao thức

### Danh sách tác nhân kích hoạt

| Phương thức          | Tham số                   | Kết quả                   |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | không có                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` chuẩn hóa đầu vào: loại bỏ khoảng trắng ở đầu và cuối, bỏ các mục trống, giữ tối đa 32 tác nhân kích hoạt và cắt mỗi tác nhân còn 64 đơn vị mã UTF-16 mà không tách các cặp thay thế. Nếu kết quả trống, hệ thống dùng lại các giá trị mặc định tích hợp sẵn (`openclaw`, `claude`, `computer`).

### Định tuyến (từ tác nhân kích hoạt đến đích)

| Phương thức                  | Tham số                               | Kết quả                               |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | không có                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Mỗi `target` của tuyến hỗ trợ chính xác một trong các mục sau:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Giới hạn: tối đa 32 tuyến, văn bản tác nhân kích hoạt dài tối đa 64 ký tự. Các tác nhân kích hoạt của tuyến được chuẩn hóa để đối sánh và phát hiện trùng lặp bằng cách chuyển thành chữ thường, loại bỏ dấu câu ở đầu/cuối mỗi từ và thu gọn khoảng trắng (`"Hey, Bot!!"` và `"hey bot"` khớp nhau và được tính là trùng lặp) — đây là cách chuẩn hóa nghiêm ngặt hơn so với thao tác chỉ loại bỏ khoảng trắng ở đầu và cuối được dùng cho danh sách tác nhân kích hoạt toàn cục ở trên.

### Sự kiện

| Sự kiện                       | Dữ liệu truyền tải                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Cả hai đều được phát đến mọi máy khách WebSocket có phạm vi đọc (ứng dụng macOS, WebChat và các ứng dụng tương tự) cũng như mọi Node đang kết nối. Một Node cũng nhận cả hai dưới dạng bản đẩy ảnh chụp trạng thái ban đầu ngay sau khi kết nối.

## Hành vi của máy khách

- **macOS**: gọi `voicewake.set`/`voicewake.get` và lắng nghe `voicewake.changed` để luôn đồng bộ với các máy khách khác.
- **iOS**: gọi `voicewake.set`/`voicewake.get` và lắng nghe `voicewake.changed` để duy trì khả năng phản hồi của tính năng phát hiện từ đánh thức cục bộ.
- **Android**: gọi `voicewake.set`/`voicewake.get`, lắng nghe `voicewake.changed` và công bố `voiceWake` khi được bật. Quá trình nhận dạng chỉ diễn ra trên thiết bị và ở tiền cảnh; quá trình này tạm dừng khi Talk, tính năng đọc chính tả thủ công, ghi âm ghi chú thoại hoặc tính năng đọc tin nhắn đang sử dụng âm thanh.

## Liên quan

- [Chế độ Talk](/vi/nodes/talk)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Nhận biết nội dung đa phương tiện](/vi/nodes/media-understanding)
