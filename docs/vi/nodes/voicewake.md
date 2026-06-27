---
read_when:
    - Thay đổi hành vi hoặc mặc định của từ đánh thức bằng giọng nói
    - Thêm nền tảng nút mới cần đồng bộ hóa từ đánh thức
summary: Từ đánh thức bằng giọng nói toàn cục (do Gateway sở hữu) và cách chúng đồng bộ giữa các nút
title: Đánh thức bằng giọng nói
x-i18n:
    generated_at: "2026-06-27T17:40:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw xem **từ đánh thức là một danh sách toàn cục duy nhất** do **Gateway** sở hữu.

- **Không có từ đánh thức tùy chỉnh theo từng nút**.
- **Bất kỳ giao diện người dùng nút/ứng dụng nào cũng có thể chỉnh sửa** danh sách; các thay đổi được Gateway lưu bền vững và phát tới tất cả mọi người.
- macOS và iOS giữ các nút bật/tắt **Voice Wake đã bật/tắt** cục bộ (trải nghiệm người dùng cục bộ + quyền khác nhau).
- Android hiện giữ Voice Wake tắt và dùng luồng mic thủ công trong thẻ Voice.

## Lưu trữ (máy chủ Gateway)

Từ đánh thức và quy tắc định tuyến được lưu trong cơ sở dữ liệu trạng thái gateway:

- `~/.openclaw/state/openclaw.sqlite`

Các bảng đang hoạt động là:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

Các tệp `settings/voicewake.json` và `settings/voicewake-routing.json` cũ chỉ là
đầu vào di trú của doctor; runtime đọc và ghi các bảng SQLite.

## Giao thức

### Phương thức

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` với tham số `{ triggers: string[] }` → `{ triggers: string[] }`

Ghi chú:

- Trình kích hoạt được chuẩn hóa (cắt khoảng trắng, bỏ mục rỗng). Danh sách rỗng sẽ quay về mặc định.
- Các giới hạn được thực thi để đảm bảo an toàn (giới hạn số lượng/độ dài).

### Phương thức định tuyến (trình kích hoạt → đích)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` với tham số `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Hình dạng `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Đích định tuyến hỗ trợ đúng một trong các dạng sau:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Sự kiện

- payload `voicewake.changed` `{ triggers: string[] }`
- payload `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Ai nhận được:

- Tất cả máy khách WebSocket (ứng dụng macOS, WebChat, v.v.)
- Tất cả các nút đã kết nối (iOS/Android), và cả khi nút kết nối dưới dạng lần đẩy "trạng thái hiện tại" ban đầu.

## Hành vi máy khách

### Ứng dụng macOS

- Dùng danh sách toàn cục để kiểm soát trình kích hoạt `VoiceWakeRuntime`.
- Chỉnh sửa "Từ kích hoạt" trong cài đặt Voice Wake sẽ gọi `voicewake.set` rồi dựa vào bản phát để giữ các máy khách khác đồng bộ.

### Nút iOS

- Dùng danh sách toàn cục để phát hiện trình kích hoạt `VoiceWakeManager`.
- Chỉnh sửa Từ đánh thức trong Cài đặt sẽ gọi `voicewake.set` (qua Gateway WS) và cũng giữ phát hiện từ đánh thức cục bộ phản hồi nhanh.

### Nút Android

- Voice Wake hiện bị tắt trong runtime/Cài đặt Android.
- Giọng nói Android dùng thu mic thủ công trong thẻ Voice thay vì trình kích hoạt bằng từ đánh thức.

## Liên quan

- [Chế độ trò chuyện](/vi/nodes/talk)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu nội dung phương tiện](/vi/nodes/media-understanding)
