---
read_when:
    - Gỡ lỗi trạng thái trực tiếp trên trang Thiết bị của Giao diện điều khiển
    - Điều tra các hàng phiên bản trùng lặp hoặc lỗi thời
    - Thay đổi kết nối WS của Gateway hoặc các tín hiệu sự kiện hệ thống
summary: Cách các mục hiện diện của OpenClaw được tạo, hợp nhất và hiển thị
title: Hiện diện
x-i18n:
    generated_at: "2026-07-16T14:20:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

"Presence" của OpenClaw là một chế độ xem nhẹ, hoạt động theo khả năng tốt nhất, về:

- chính **Gateway**, và
- **các máy khách hiển thị với người dùng được kết nối với Gateway** (ứng dụng Mac, WebChat, các node, v.v.)

Presence hiển thị siêu dữ liệu kết nối trực tiếp trên trang **Devices** của Control UI
(trong **Settings → Devices**) và tab **Instances** của ứng dụng macOS.

Trang này trình bày danh sách máy khách của Gateway. Để phát hiện máy Mac được sử dụng
gần đây nhất và định tuyến cảnh báo node đến đó, hãy xem
[Presence của máy tính đang hoạt động](/nodes/presence).

## Các trường presence (nội dung hiển thị)

Các mục presence là những đối tượng có cấu trúc với các trường như:

- `instanceId` (không bắt buộc nhưng rất nên dùng): danh tính máy khách ổn định (thường là `connect.client.instanceId`)
- `host`: tên máy chủ thân thiện với người dùng
- `ip`: địa chỉ IP theo khả năng xác định tốt nhất
- `version`: chuỗi phiên bản máy khách
- `deviceFamily` / `modelIdentifier`: thông tin gợi ý về phần cứng
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: số giây kể từ lần nhập liệu gần nhất của người dùng, nếu biết
- `reason`: chuỗi tự do do máy khách cung cấp; bản thân Gateway chỉ phát `self`, `connect` và `disconnect`
- `deviceId`, `roles`, `scopes`: danh tính thiết bị và thông tin gợi ý về vai trò/phạm vi từ quá trình bắt tay kết nối
- `ts`: dấu thời gian cập nhật gần nhất (ms kể từ epoch)

## Nguồn tạo (presence đến từ đâu)

Các mục presence được tạo từ nhiều nguồn và được **hợp nhất**.

### 1) Mục của chính Gateway

Gateway luôn khởi tạo một mục "self" khi khởi động để giao diện người dùng hiển thị máy chủ gateway
ngay cả trước khi có bất kỳ máy khách nào kết nối.

### 2) Kết nối WebSocket

Mọi máy khách WS đều bắt đầu bằng một yêu cầu `connect`. Sau khi bắt tay thành công,
Gateway chèn hoặc cập nhật một mục presence cho kết nối đó.

#### Vì sao các kết nối mặt phẳng điều khiển tạm thời không xuất hiện

Các lệnh CLI, máy khách RPC phía backend và các tác vụ thăm dò thường chỉ kết nối trong thời gian ngắn. Để tránh
duy trì các biến động đó trong toàn bộ TTL của presence, các máy khách ở chế độ `cli`, `backend`
hoặc `probe` **không** được chuyển thành mục presence. Máy khách ở chế độ kiểm thử
vẫn được theo dõi vì các bộ kiểm thử dùng chúng để đại diện cho máy khách thực.

### 3) Beacon `system-event`

Máy khách có thể gửi các beacon định kỳ giàu thông tin hơn qua phương thức `system-event`. Ứng dụng Mac
dùng phương thức này để báo cáo tên máy chủ, IP và `lastInputSeconds`.

### 4) Kết nối node (vai trò: node)

Khi một node kết nối qua WebSocket của Gateway bằng `role: node`, Gateway
chèn hoặc cập nhật một mục presence cho node đó (cùng luồng với các máy khách WS khác).

## Quy tắc hợp nhất + loại bỏ trùng lặp (vì sao `instanceId` quan trọng)

Các mục presence được lưu trong một map duy nhất trên bộ nhớ, với khóa không phân biệt chữ hoa chữ thường
là giá trị khả dụng đầu tiên theo thứ tự sau: mã thiết bị đã ghép đôi, `connect.client.instanceId`,
hoặc mã riêng của từng kết nối như phương án cuối cùng.

Các máy khách mặt phẳng điều khiển tạm thời bị loại hoàn toàn khỏi quá trình theo dõi (xem
phần trên), nên mã kết nối của chúng không bao giờ trở thành khóa. Với mọi máy khách khác, việc dùng
mã kết nối làm phương án dự phòng có nghĩa là một máy khách kết nối lại mà không có
`instanceId` ổn định sẽ xuất hiện dưới dạng một hàng **trùng lặp**.

## TTL và giới hạn kích thước

Presence được thiết kế có tính tạm thời:

- **TTL:** các mục cũ hơn 5 phút sẽ bị loại bỏ
- **Số mục tối đa:** 200 (mục cũ nhất bị loại trước)

Điều này giúp danh sách luôn mới và tránh bộ nhớ tăng trưởng không giới hạn.

## Lưu ý về kết nối từ xa/đường hầm (IP loopback)

Khi máy khách kết nối qua đường hầm SSH / chuyển tiếp cổng cục bộ, Gateway
có thể thấy địa chỉ từ xa là `127.0.0.1`. Để tránh ghi địa chỉ đường hầm đó
làm IP của máy khách, quá trình xử lý kết nối sẽ bỏ hoàn toàn `ip` đối với
các máy khách được phát hiện là cục bộ (loopback), thay vì ghi địa chỉ loopback
vào mục.

## Bên sử dụng

### Trang Devices của Control UI

Trang **Devices** kết hợp `system-presence` với các bản ghi ghép đôi và node
bền vững. Trang này ghim beacon của chính Gateway ở đầu và dùng mã thiết bị hoặc
mã phiên bản tương ứng để hiển thị siêu dữ liệu trực tiếp về nền tảng, phiên bản, kiểu máy và thời gian kể từ lần nhập liệu gần nhất.

### Tab Instances trên macOS

Ứng dụng macOS hiển thị đầu ra của `system-presence` và áp dụng một chỉ báo trạng thái nhỏ
(Active/Idle/Stale) dựa trên thời gian đã trôi qua kể từ lần cập nhật gần nhất.

## Mẹo gỡ lỗi

- Để xem danh sách thô, hãy gọi `system-presence` đến Gateway.
- Nếu thấy các mục trùng lặp:
  - xác nhận máy khách gửi một `client.instanceId` ổn định trong quá trình bắt tay
  - xác nhận các beacon định kỳ sử dụng cùng một `instanceId`
  - kiểm tra xem mục được tạo từ kết nối có thiếu `instanceId` hay không (trùng lặp là điều dự kiến)

## Liên quan

<CardGroup cols={2}>
  <Card title="Presence của máy tính đang hoạt động" href="/nodes/presence" icon="computer-mouse">
    Cách thao tác nhập liệu vật lý trên máy Mac chọn một node đang hoạt động và định tuyến cảnh báo kết nối.
  </Card>
  <Card title="Chỉ báo đang nhập" href="/vi/concepts/typing-indicators" icon="ellipsis">
    Thời điểm gửi chỉ báo đang nhập và cách tinh chỉnh chúng.
  </Card>
  <Card title="Truyền phát và chia khối" href="/vi/concepts/streaming" icon="bars-staggered">
    Truyền phát đi, chia khối và định dạng theo từng kênh.
  </Card>
  <Card title="Kiến trúc Gateway" href="/vi/concepts/architecture" icon="diagram-project">
    Các thành phần Gateway và giao thức WebSocket điều khiển việc cập nhật presence.
  </Card>
  <Card title="Giao thức Gateway" href="/vi/gateway/protocol" icon="plug">
    Giao thức truyền dẫn cho `connect`, `system-event` và `system-presence`.
  </Card>
</CardGroup>
