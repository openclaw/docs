---
read_when:
    - Gỡ lỗi tab Phiên bản
    - Điều tra các hàng thực thể trùng lặp hoặc lỗi thời
    - Thay đổi kết nối WS của Gateway hoặc tín hiệu sự kiện hệ thống
summary: Cách các mục hiện diện của OpenClaw được tạo, hợp nhất và hiển thị
title: Sự hiện diện
x-i18n:
    generated_at: "2026-05-06T09:08:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw "presence" là một chế độ xem nhẹ, theo kiểu nỗ lực tối đa về:

- chính **Gateway**, và
- **các máy khách được kết nối với Gateway** (ứng dụng mac, WebChat, CLI, v.v.)

Presence được dùng chủ yếu để hiển thị thẻ **Instances** của ứng dụng macOS và để
cung cấp khả năng quan sát nhanh cho người vận hành.

## Các trường presence (những gì hiển thị)

Các mục presence là các đối tượng có cấu trúc với những trường như:

- `instanceId` (không bắt buộc nhưng rất được khuyến nghị): danh tính máy khách ổn định (thường là `connect.client.instanceId`)
- `host`: tên máy chủ thân thiện với con người
- `ip`: địa chỉ IP theo nỗ lực tối đa
- `version`: chuỗi phiên bản máy khách
- `deviceFamily` / `modelIdentifier`: gợi ý phần cứng
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "số giây kể từ lần nhập cuối của người dùng" (nếu biết)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: dấu thời gian cập nhật gần nhất (ms kể từ epoch)

## Nguồn tạo (presence đến từ đâu)

Các mục presence được tạo từ nhiều nguồn và được **hợp nhất**.

### 1) Mục tự thân của Gateway

Gateway luôn khởi tạo một mục "self" khi khởi động để UI hiển thị máy chủ gateway
ngay cả trước khi có bất kỳ máy khách nào kết nối.

### 2) Kết nối WebSocket

Mỗi máy khách WS bắt đầu bằng một yêu cầu `connect`. Khi bắt tay thành công,
Gateway upsert một mục presence cho kết nối đó.

#### Vì sao các lệnh CLI dùng một lần không hiển thị

CLI thường kết nối cho các lệnh ngắn, dùng một lần. Để tránh làm rối danh sách
Instances, `client.mode === "cli"` **không** được chuyển thành một mục presence.

### 3) Beacon `system-event`

Máy khách có thể gửi các beacon định kỳ giàu thông tin hơn qua phương thức `system-event`. Ứng dụng mac
dùng cơ chế này để báo cáo tên máy chủ, IP và `lastInputSeconds`.

### 4) Node kết nối (role: node)

Khi một node kết nối qua WebSocket của Gateway với `role: node`, Gateway
upsert một mục presence cho node đó (cùng luồng như các máy khách WS khác).

## Quy tắc hợp nhất + khử trùng lặp (vì sao `instanceId` quan trọng)

Các mục presence được lưu trong một map duy nhất trong bộ nhớ:

- Các mục được khóa theo một **khóa presence**.
- Khóa tốt nhất là một `instanceId` ổn định (từ `connect.client.instanceId`) có thể tồn tại qua các lần khởi động lại.
- Khóa không phân biệt chữ hoa chữ thường.

Nếu một máy khách kết nối lại mà không có `instanceId` ổn định, nó có thể hiển thị thành một
hàng **trùng lặp**.

## TTL và kích thước giới hạn

Presence được thiết kế là tạm thời:

- **TTL:** các mục cũ hơn 5 phút sẽ bị cắt bỏ
- **Số mục tối đa:** 200 (mục cũ nhất bị loại trước)

Điều này giữ danh sách luôn mới và tránh tăng trưởng bộ nhớ không giới hạn.

## Lưu ý về từ xa/tunnel (IP loopback)

Khi một máy khách kết nối qua tunnel SSH / chuyển tiếp cổng cục bộ, Gateway có thể
thấy địa chỉ từ xa là `127.0.0.1`. Để tránh ghi đè một IP do máy khách báo cáo
đang tốt, các địa chỉ từ xa loopback sẽ bị bỏ qua.

## Bên tiêu thụ

### Thẻ Instances trên macOS

Ứng dụng macOS hiển thị đầu ra của `system-presence` và áp dụng một chỉ báo trạng thái nhỏ
(Đang hoạt động/Không hoạt động/Cũ) dựa trên độ tuổi của lần cập nhật cuối.

## Mẹo gỡ lỗi

- Để xem danh sách thô, hãy gọi `system-presence` tới Gateway.
- Nếu bạn thấy các mục trùng lặp:
  - xác nhận máy khách gửi một `client.instanceId` ổn định trong bắt tay
  - xác nhận các beacon định kỳ dùng cùng `instanceId`
  - kiểm tra xem mục bắt nguồn từ kết nối có thiếu `instanceId` hay không (các mục trùng lặp là điều được kỳ vọng)

## Liên quan

<CardGroup cols={2}>
  <Card title="Chỉ báo đang nhập" href="/vi/concepts/typing-indicators" icon="ellipsis">
    Khi nào chỉ báo đang nhập được gửi và cách tinh chỉnh chúng.
  </Card>
  <Card title="Truyền phát và chia đoạn" href="/vi/concepts/streaming" icon="bars-staggered">
    Truyền phát đi, chia đoạn, và định dạng theo từng kênh.
  </Card>
  <Card title="Kiến trúc Gateway" href="/vi/concepts/architecture" icon="diagram-project">
    Các thành phần Gateway và giao thức WebSocket điều khiển các bản cập nhật presence.
  </Card>
  <Card title="Giao thức Gateway" href="/vi/gateway/protocol" icon="plug">
    Giao thức truyền dẫn cho `connect`, `system-event`, và `system-presence`.
  </Card>
</CardGroup>
