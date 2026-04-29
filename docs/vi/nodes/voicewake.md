---
read_when:
    - Thay đổi hành vi hoặc giá trị mặc định của các từ đánh thức bằng giọng nói
    - Thêm nền tảng Node mới cần đồng bộ từ đánh thức
summary: Từ đánh thức bằng giọng nói toàn cục (do Gateway sở hữu) và cách chúng đồng bộ hóa giữa các nút
title: Đánh thức bằng giọng nói
x-i18n:
    generated_at: "2026-04-29T22:55:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw xem **từ đánh thức là một danh sách toàn cục duy nhất** do **Gateway** sở hữu.

- **Không có từ đánh thức tùy chỉnh theo từng Node**.
- **Bất kỳ UI Node/ứng dụng nào cũng có thể chỉnh sửa** danh sách; các thay đổi được Gateway lưu giữ và phát tới mọi bên.
- macOS và iOS giữ các công tắc **bật/tắt Đánh thức bằng giọng nói** cục bộ (UX cục bộ + quyền khác nhau).
- Android hiện đang tắt Đánh thức bằng giọng nói và dùng luồng mic thủ công trong tab Giọng nói.

## Lưu trữ (máy chủ Gateway)

Từ đánh thức được lưu trên máy gateway tại:

- `~/.openclaw/settings/voicewake.json`

Dạng:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Giao thức

### Phương thức

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` với tham số `{ triggers: string[] }` → `{ triggers: string[] }`

Ghi chú:

- Các mục kích hoạt được chuẩn hóa (cắt khoảng trắng, loại bỏ mục rỗng). Danh sách rỗng sẽ quay về mặc định.
- Các giới hạn được thực thi để bảo đảm an toàn (giới hạn số lượng/độ dài).

### Phương thức định tuyến (mục kích hoạt → mục tiêu)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` với tham số `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Dạng `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Mục tiêu định tuyến hỗ trợ đúng một trong các dạng sau:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Sự kiện

- payload `voicewake.changed` `{ triggers: string[] }`
- payload `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Bên nhận:

- Tất cả máy khách WebSocket (ứng dụng macOS, WebChat, v.v.)
- Tất cả Node đã kết nối (iOS/Android), và cũng được đẩy “trạng thái hiện tại” ban đầu khi Node kết nối.

## Hành vi máy khách

### Ứng dụng macOS

- Dùng danh sách toàn cục để kiểm soát các mục kích hoạt `VoiceWakeRuntime`.
- Việc chỉnh sửa “Từ kích hoạt” trong cài đặt Đánh thức bằng giọng nói sẽ gọi `voicewake.set`, rồi dựa vào bản phát để giữ các máy khách khác đồng bộ.

### Node iOS

- Dùng danh sách toàn cục để phát hiện mục kích hoạt của `VoiceWakeManager`.
- Việc chỉnh sửa Từ đánh thức trong Cài đặt sẽ gọi `voicewake.set` (qua Gateway WS) và cũng giữ cho tính năng phát hiện từ đánh thức cục bộ phản hồi nhanh.

### Node Android

- Đánh thức bằng giọng nói hiện bị tắt trong runtime/Cài đặt Android.
- Giọng nói trên Android dùng thu mic thủ công trong tab Giọng nói thay vì các mục kích hoạt bằng từ đánh thức.

## Liên quan

- [Chế độ trò chuyện](/vi/nodes/talk)
- [Âm thanh và ghi chú thoại](/vi/nodes/audio)
- [Hiểu nội dung phương tiện](/vi/nodes/media-understanding)
