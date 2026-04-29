---
read_when:
    - Thêm hoặc sửa đổi phân tích cú pháp vị trí kênh
    - Sử dụng các trường ngữ cảnh vị trí trong lời nhắc hoặc công cụ của tác nhân
summary: Phân tích vị trí kênh đến (Telegram/WhatsApp/Matrix) và các trường ngữ cảnh
title: Phân tích cú pháp vị trí kênh
x-i18n:
    generated_at: "2026-04-29T22:26:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 16
---

OpenClaw chuẩn hóa các vị trí được chia sẻ từ các kênh chat thành:

- văn bản tọa độ ngắn gọn được thêm vào nội dung gửi đến, và
- các trường có cấu trúc trong payload ngữ cảnh tự động trả lời. Nhãn, địa chỉ và chú thích/bình luận do kênh cung cấp được hiển thị vào prompt bằng khối JSON siêu dữ liệu không đáng tin cậy dùng chung, không chèn trực tiếp vào nội dung người dùng.

Hiện được hỗ trợ:

- **Telegram** (ghim vị trí + địa điểm + vị trí trực tiếp)
- **WhatsApp** (locationMessage + liveLocationMessage)
- **Matrix** (`m.location` với `geo_uri`)

## Định dạng văn bản

Vị trí được hiển thị dưới dạng các dòng thân thiện không có dấu ngoặc:

- Ghim:
  - `📍 48.858844, 2.294351 ±12m`
- Địa điểm có tên:
  - `📍 48.858844, 2.294351 ±12m`
- Chia sẻ trực tiếp:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Nếu kênh bao gồm nhãn, địa chỉ hoặc chú thích/bình luận, thông tin đó được giữ lại trong payload ngữ cảnh và xuất hiện trong prompt dưới dạng JSON không đáng tin cậy được đặt trong khối rào:

````text
Location (untrusted metadata):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## Trường ngữ cảnh

Khi có vị trí, các trường này được thêm vào `ctx`:

- `LocationLat` (number)
- `LocationLon` (number)
- `LocationAccuracy` (number, mét; tùy chọn)
- `LocationName` (string; tùy chọn)
- `LocationAddress` (string; tùy chọn)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)
- `LocationCaption` (string; tùy chọn)

Bộ kết xuất prompt xem `LocationName`, `LocationAddress` và `LocationCaption` là siêu dữ liệu không đáng tin cậy và tuần tự hóa chúng qua cùng đường dẫn JSON có giới hạn được dùng cho ngữ cảnh kênh khác.

## Ghi chú về kênh

- **Telegram**: địa điểm ánh xạ sang `LocationName/LocationAddress`; vị trí trực tiếp dùng `live_period`.
- **WhatsApp**: `locationMessage.comment` và `liveLocationMessage.caption` điền vào `LocationCaption`.
- **Matrix**: `geo_uri` được phân tích cú pháp như một vị trí ghim; độ cao bị bỏ qua và `LocationIsLive` luôn là false.

## Liên quan

- [Lệnh vị trí (nodes)](/vi/nodes/location-command)
- [Chụp bằng camera](/vi/nodes/camera)
- [Hiểu nội dung phương tiện](/vi/nodes/media-understanding)
