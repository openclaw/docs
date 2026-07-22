---
read_when:
    - Gỡ lỗi trạng thái trực tiếp trên trang Thiết bị của Giao diện điều khiển
    - Điều tra các hàng phiên bản bị trùng lặp hoặc lỗi thời
    - Thay đổi kết nối WS của Gateway hoặc các tín hiệu sự kiện hệ thống
summary: Cách các mục hiện diện của OpenClaw được tạo, hợp nhất và hiển thị
title: Hiện diện
x-i18n:
    generated_at: "2026-07-22T02:21:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ac5800eebddb82e69a7d0c06733e6a19addbc57be7776e7361411866af0c60f5
    source_path: concepts/presence.md
    workflow: 16
---

"Hiện diện" của OpenClaw là một chế độ xem nhẹ, hoạt động theo khả năng tốt nhất về:

- chính **Gateway**, và
- **các ứng dụng khách hiển thị với người dùng đang kết nối với Gateway** (ứng dụng Mac, WebChat, các node, v.v.)

Thông tin hiện diện hiển thị siêu dữ liệu kết nối trực tiếp trên trang **Devices** của giao diện điều khiển
(trong **Settings → Devices**) và tab **Instances** của ứng dụng macOS.

Trang này trình bày danh sách ứng dụng khách của Gateway. Để phát hiện máy Mac bạn sử dụng gần đây nhất
và định tuyến cảnh báo node đến đó, hãy xem
[Thông tin hiện diện của máy tính đang hoạt động](/vi/nodes/presence).

## Các trường thông tin hiện diện (nội dung được hiển thị)

Các mục thông tin hiện diện là những đối tượng có cấu trúc với các trường như:

- `instanceId` (không bắt buộc nhưng đặc biệt khuyến nghị): danh tính ổn định của ứng dụng khách (thường là `connect.client.instanceId`)
- `host`: tên máy chủ thân thiện với người dùng
- `ip`: địa chỉ IP được xác định theo khả năng tốt nhất
- `version`: chuỗi phiên bản của ứng dụng khách
- `deviceFamily` / `modelIdentifier`: thông tin gợi ý về phần cứng
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: số giây kể từ lần nhập liệu gần nhất của người dùng, nếu biết
- `reason`: chuỗi dạng tự do do ứng dụng khách cung cấp; chính Gateway chỉ phát `self`, `connect` và `disconnect`
- `deviceId`, `roles`, `scopes`: danh tính thiết bị và thông tin gợi ý về vai trò/phạm vi từ quá trình bắt tay kết nối
- `ts`: dấu thời gian của lần cập nhật gần nhất (ms kể từ epoch)

## Nguồn tạo (thông tin hiện diện đến từ đâu)

Các mục thông tin hiện diện được tạo từ nhiều nguồn và được **hợp nhất**.

### 1) Mục của chính Gateway

Gateway luôn khởi tạo một mục "self" khi bắt đầu để giao diện người dùng hiển thị máy chủ Gateway
ngay cả trước khi có ứng dụng khách nào kết nối.

### 2) Kết nối WebSocket

Mỗi ứng dụng khách WS bắt đầu bằng một yêu cầu `connect`. Khi quá trình bắt tay thành công,
Gateway chèn hoặc cập nhật một mục thông tin hiện diện cho kết nối đó.

#### Vì sao các kết nối mặt phẳng điều khiển tạm thời không xuất hiện

Các lệnh CLI, ứng dụng khách RPC phía máy chủ và trình thăm dò thường chỉ kết nối trong thời gian ngắn. Để tránh
lưu giữ sự biến động đó trong suốt TTL của thông tin hiện diện, các ứng dụng khách ở chế độ `cli`, `backend`
hoặc `probe` **không** được chuyển thành mục thông tin hiện diện. Các ứng dụng khách ở chế độ kiểm thử
vẫn được theo dõi vì các bộ kiểm thử sử dụng chúng để thay thế cho ứng dụng khách thực.

### 3) Beacon `system-event`

Ứng dụng khách có thể gửi các beacon định kỳ giàu thông tin hơn qua phương thức `system-event`. Ứng dụng Mac
sử dụng phương thức này để báo cáo tên máy chủ, IP, phiên bản và siêu dữ liệu về trạng thái hoạt động. Hoạt động
nhập liệu vật lý không thuộc beacon chung này; sự kiện node gốc dành riêng cho mục đích được mô tả trong
[Thông tin hiện diện của máy tính đang hoạt động](/vi/nodes/presence) chịu trách nhiệm về hoạt động đó. Máy Mac
gắn thẻ các beacon này bằng `system-presence-clear-last-input`; các Gateway hiện tại
sử dụng dấu hiệu tương thích ngược đó để xóa mọi thông tin về độ gần đây của lần nhập liệu được giữ lại từ
ứng dụng cũ hơn. Beacon cũng mang một giá trị cố định là 30 ngày để các Gateway cũ hơn
bỏ qua thẻ sẽ ghi đè độ gần đây chính xác thay vì giữ lại nó. Không có hoạt động mới nào
được lấy mẫu cho giá trị tương thích này.

### 4) Kết nối node (vai trò: node)

Khi một node kết nối qua WebSocket của Gateway với `role: node`, Gateway
chèn hoặc cập nhật một mục thông tin hiện diện cho node đó (cùng luồng với các ứng dụng khách WS khác).

## Quy tắc hợp nhất + loại bỏ trùng lặp (vì sao `instanceId` quan trọng)

Các mục thông tin hiện diện được lưu trong một ánh xạ duy nhất trong bộ nhớ, với khóa không phân biệt chữ hoa chữ thường
là giá trị khả dụng đầu tiên theo thứ tự: id thiết bị đã ghép nối, `connect.client.instanceId`,
hoặc id riêng của kết nối như phương án cuối cùng.

Các ứng dụng khách mặt phẳng điều khiển tạm thời bị loại hoàn toàn khỏi quá trình theo dõi (xem
phần trên), vì vậy id kết nối của chúng không bao giờ trở thành khóa. Với mọi ứng dụng khách khác, việc
dùng id kết nối làm phương án dự phòng đồng nghĩa với việc một ứng dụng khách kết nối lại mà không có
`instanceId` ổn định sẽ xuất hiện dưới dạng một hàng **trùng lặp**.

## TTL và giới hạn kích thước

Thông tin hiện diện được thiết kế để tồn tại tạm thời:

- **TTL:** các mục cũ hơn 5 phút sẽ bị loại bỏ
- **Số mục tối đa:** 200 (mục cũ nhất bị loại bỏ trước)

Điều này giúp danh sách luôn mới và tránh mức sử dụng bộ nhớ tăng không giới hạn.

## Lưu ý về kết nối từ xa/đường hầm (IP loopback)

Khi một ứng dụng khách kết nối qua đường hầm SSH / chuyển tiếp cổng cục bộ, Gateway
có thể thấy địa chỉ từ xa là `127.0.0.1`. Để tránh ghi lại địa chỉ đường hầm đó
làm IP của ứng dụng khách, quá trình xử lý kết nối sẽ bỏ qua hoàn toàn `ip` đối với
các ứng dụng khách được phát hiện là cục bộ (loopback), thay vì ghi địa chỉ loopback
vào mục.

## Thành phần sử dụng

### Trang Devices của giao diện điều khiển

Trang **Devices** kết hợp `system-presence` với các bản ghi ghép nối và node
bền vững. Trang này ghim beacon của chính Gateway ở đầu và sử dụng id thiết bị hoặc
id phiên bản khớp nhau cho siêu dữ liệu trực tiếp về nền tảng, phiên bản, kiểu máy và độ gần đây của lần nhập liệu.

### Tab Instances trên macOS

Ứng dụng macOS hiển thị đầu ra của `system-presence` và áp dụng một chỉ báo trạng thái nhỏ
(Active/Idle/Stale) dựa trên thời gian kể từ lần cập nhật gần nhất.

## Mẹo gỡ lỗi

- Để xem danh sách thô, hãy gọi `system-presence` trên Gateway.
- Nếu thấy các mục trùng lặp:
  - xác nhận ứng dụng khách gửi `client.instanceId` ổn định trong quá trình bắt tay
  - xác nhận các beacon định kỳ sử dụng cùng `instanceId`
  - kiểm tra xem mục bắt nguồn từ kết nối có thiếu `instanceId` hay không (trùng lặp là điều được dự kiến)

## Liên quan

<CardGroup cols={2}>
  <Card title="Thông tin hiện diện của máy tính đang hoạt động" href="/vi/nodes/presence" icon="computer-mouse">
    Cách hoạt động nhập liệu vật lý trên máy Mac chọn một node đang hoạt động và định tuyến cảnh báo kết nối.
  </Card>
  <Card title="Chỉ báo đang nhập" href="/vi/concepts/typing-indicators" icon="ellipsis">
    Thời điểm các chỉ báo đang nhập được gửi và cách điều chỉnh chúng.
  </Card>
  <Card title="Truyền phát và chia khối" href="/vi/concepts/streaming" icon="bars-staggered">
    Truyền phát đầu ra, chia khối và định dạng theo từng kênh.
  </Card>
  <Card title="Kiến trúc Gateway" href="/vi/concepts/architecture" icon="diagram-project">
    Các thành phần Gateway và giao thức WebSocket điều khiển việc cập nhật thông tin hiện diện.
  </Card>
  <Card title="Giao thức Gateway" href="/vi/gateway/protocol" icon="plug">
    Giao thức truyền dẫn cho `connect`, `system-event` và `system-presence`.
  </Card>
</CardGroup>
