---
read_when:
    - Thay đổi hành vi hoặc giá trị mặc định của từ đánh thức bằng giọng nói
    - Thêm các nền tảng Node mới cần đồng bộ từ đánh thức
summary: Các từ đánh thức bằng giọng nói toàn cục (thuộc quyền Gateway) và cách chúng đồng bộ giữa các Node
title: Đánh thức bằng giọng nói
x-i18n:
    generated_at: "2026-05-06T09:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw coi **các từ đánh thức là một danh sách toàn cục duy nhất** do **Gateway** sở hữu.

- **Không có từ đánh thức tùy chỉnh theo từng Node**.
- **Bất kỳ giao diện người dùng Node/ứng dụng nào cũng có thể chỉnh sửa** danh sách; các thay đổi được Gateway lưu lại và phát sóng đến mọi người.
- macOS và iOS giữ các nút bật/tắt **Đánh thức bằng giọng nói** cục bộ (trải nghiệm người dùng cục bộ + quyền khác nhau).
- Android hiện đang tắt Đánh thức bằng giọng nói và dùng luồng mic thủ công trong thẻ Giọng nói.

## Lưu trữ (máy chủ Gateway)

Từ đánh thức được lưu trên máy gateway tại:

- `~/.openclaw/settings/voicewake.json`

Hình dạng:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Giao thức

### Phương thức

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` với tham số `{ triggers: string[] }` → `{ triggers: string[] }`

Ghi chú:

- Trigger được chuẩn hóa (cắt khoảng trắng, bỏ mục rỗng). Danh sách rỗng sẽ quay về giá trị mặc định.
- Các giới hạn được thực thi để đảm bảo an toàn (giới hạn số lượng/độ dài).

### Phương thức định tuyến (trigger → đích)

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

Đích định tuyến hỗ trợ đúng một trong các mục sau:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Sự kiện

- `voicewake.changed` payload `{ triggers: string[] }`
- `voicewake.routing.changed` payload `{ config: VoiceWakeRoutingConfig }`

Ai nhận được:

- Tất cả client WebSocket (ứng dụng macOS, WebChat, v.v.)
- Tất cả Node đã kết nối (iOS/Android), và cũng được đẩy "trạng thái hiện tại" ban đầu khi Node kết nối.

## Hành vi của client

### Ứng dụng macOS

- Dùng danh sách toàn cục để kiểm soát trigger của `VoiceWakeRuntime`.
- Việc chỉnh sửa "Từ trigger" trong cài đặt Đánh thức bằng giọng nói gọi `voicewake.set`, rồi dựa vào phát sóng để giữ các client khác đồng bộ.

### Node iOS

- Dùng danh sách toàn cục để phát hiện trigger của `VoiceWakeManager`.
- Việc chỉnh sửa Từ đánh thức trong Cài đặt gọi `voicewake.set` (qua Gateway WS) và cũng giữ cho phát hiện từ đánh thức cục bộ phản hồi nhanh.

### Node Android

- Đánh thức bằng giọng nói hiện đang bị vô hiệu hóa trong runtime/Cài đặt Android.
- Giọng nói trên Android dùng thu âm mic thủ công trong thẻ Giọng nói thay vì trigger bằng từ đánh thức.

## Liên quan

- [Chế độ trò chuyện](/vi/nodes/talk)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu nội dung media](/vi/nodes/media-understanding)
