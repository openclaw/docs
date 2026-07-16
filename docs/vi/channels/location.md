---
read_when:
    - Thêm hoặc sửa đổi cách phân tích vị trí kênh
    - Sử dụng các trường ngữ cảnh vị trí trong lời nhắc hoặc công cụ của tác nhân
summary: Phân tích vị trí kênh và payload vị trí gửi đi có tính di động
title: Phân tích vị trí kênh
x-i18n:
    generated_at: "2026-07-16T14:02:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

OpenClaw chuẩn hóa các vị trí được chia sẻ từ các kênh trò chuyện thành:

- văn bản tọa độ ngắn gọn được nối vào nội dung đến, và
- các trường có cấu trúc trong tải trọng ngữ cảnh trả lời tự động. Nhãn, địa chỉ và chú thích/bình luận do kênh cung cấp được kết xuất vào lời nhắc bằng khối JSON siêu dữ liệu không đáng tin cậy dùng chung, thay vì chèn trực tiếp vào nội dung người dùng.

Hiện được hỗ trợ:

- **LINE** (tin nhắn vị trí có tiêu đề/địa chỉ)
- **Matrix** (`m.location` với `geo_uri`)
- **Telegram** (ghim vị trí + địa điểm + vị trí trực tiếp)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)

## Định dạng văn bản

Vị trí được kết xuất thành các dòng thân thiện, không có dấu ngoặc. Tọa độ sử dụng sáu chữ số thập phân; độ chính xác được làm tròn đến mét nguyên:

- Ghim:
  - `📍 48.858844, 2.294351 ±12m`
- Địa điểm có tên (trên cùng một dòng; tên/địa chỉ chỉ được đưa vào khối siêu dữ liệu):
  - `📍 48.858844, 2.294351 ±12m`
- Chia sẻ trực tiếp:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Nếu kênh có nhãn, địa chỉ hoặc chú thích/bình luận, thông tin đó được giữ nguyên trong tải trọng ngữ cảnh và xuất hiện trong lời nhắc dưới dạng JSON không đáng tin cậy có hàng rào (các trường sẽ bị lược bỏ khi không có):

````text
Vị trí (siêu dữ liệu không đáng tin cậy):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Tháp Eiffel",
  "address": "Champ de Mars, Paris",
  "caption": "Gặp nhau ở đây"
}
```
````

## Các trường ngữ cảnh

Khi có vị trí, các trường sau được thêm vào `ctx`:

- `LocationLat` (số)
- `LocationLon` (số)
- `LocationAccuracy` (số, mét; không bắt buộc)
- `LocationName` (chuỗi; không bắt buộc)
- `LocationAddress` (chuỗi; không bắt buộc)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)
- `LocationCaption` (chuỗi; không bắt buộc)

Khi kênh không đặt nguồn tường minh, OpenClaw sẽ suy luận nguồn: các lượt chia sẻ trực tiếp trở thành `live`, vị trí có tên hoặc địa chỉ trở thành `place`, mọi trường hợp khác là `pin`.

Trình kết xuất lời nhắc coi `LocationName`, `LocationAddress` và `LocationCaption` là siêu dữ liệu không đáng tin cậy và tuần tự hóa chúng qua cùng đường dẫn JSON có giới hạn được sử dụng cho ngữ cảnh kênh khác.

## Tải trọng gửi đi

Công cụ tin nhắn và SDK Plugin sử dụng cùng cấu trúc `NormalizedLocation` cho các vị trí gửi đi có tính di động. Tải trọng chỉ có tọa độ biểu thị một ghim. Các kênh hỗ trợ địa điểm gốc có thể ánh xạ `name` cùng `address` sang một thẻ địa điểm.

Telegram hiện cung cấp tính năng này qua `message(action="send")`. Bản triển khai đầu tiên được chủ ý thiết kế độc lập: tải trọng vị trí không thể kết hợp với văn bản hoặc phương tiện, và các cặp địa điểm không đầy đủ sẽ thất bại thay vì âm thầm loại bỏ tên hoặc địa chỉ. Các kênh không được hỗ trợ không quảng bá tham số vị trí.

## Ghi chú về kênh

- **LINE**: `title`/`address` của tin nhắn vị trí ánh xạ đến `LocationName`/`LocationAddress`; không có vị trí trực tiếp.
- **Matrix**: `geo_uri` được phân tích cú pháp thành vị trí ghim; tham số `u` (độ bất định) ánh xạ đến `LocationAccuracy`, nội dung sự kiện điền vào `LocationCaption`, độ cao bị bỏ qua và `LocationIsLive` luôn là false.
- **Telegram**: các địa điểm ánh xạ đến `LocationName`/`LocationAddress`; vị trí trực tiếp được phát hiện qua `live_period`.
- **WhatsApp**: `locationMessage.comment` và `liveLocationMessage.caption` điền vào `LocationCaption`.

## Liên quan

- [Lệnh vị trí (các Node)](/vi/nodes/location-command)
- [Chụp ảnh bằng camera](/vi/nodes/camera)
- [Nhận hiểu phương tiện](/vi/nodes/media-understanding)
