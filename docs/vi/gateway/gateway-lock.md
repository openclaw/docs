---
read_when:
    - Chạy hoặc gỡ lỗi tiến trình Gateway
    - Đang điều tra cơ chế đảm bảo chỉ một phiên bản
summary: Cơ chế bảo vệ singleton của Gateway bằng cách liên kết trình lắng nghe WebSocket
title: Khóa Gateway
x-i18n:
    generated_at: "2026-04-30T16:29:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Lý do

- Đảm bảo chỉ một phiên bản Gateway chạy trên mỗi cổng cơ sở trên cùng một máy chủ; các Gateway bổ sung phải dùng hồ sơ biệt lập và cổng duy nhất.
- Chịu được sự cố/SIGKILL mà không để lại tệp khóa lỗi thời.
- Thất bại nhanh với lỗi rõ ràng khi cổng điều khiển đã bị chiếm.

## Cơ chế

- Trước tiên Gateway lấy một tệp khóa theo từng cấu hình trong thư mục khóa trạng thái và dò cổng đã cấu hình để tìm trình lắng nghe hiện có.
- Nếu chủ sở hữu khóa đã ghi nhận không còn tồn tại, cổng đang trống, hoặc khóa đã lỗi thời, quá trình khởi động sẽ giành lại khóa và tiếp tục.
- Sau đó Gateway liên kết trình lắng nghe HTTP/WebSocket (mặc định `ws://127.0.0.1:18789`) bằng một trình lắng nghe TCP độc quyền.
- Nếu liên kết thất bại với `EADDRINUSE`, quá trình khởi động ném `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Khi tắt, Gateway đóng máy chủ HTTP/WebSocket và xóa tệp khóa.

## Bề mặt lỗi

- Nếu một tiến trình khác giữ cổng, quá trình khởi động ném `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Các lỗi liên kết khác hiển thị dưới dạng `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Ghi chú vận hành

- Nếu cổng bị _một_ tiến trình khác chiếm, lỗi vẫn giống nhau; hãy giải phóng cổng hoặc chọn cổng khác bằng `openclaw gateway --port <port>`.
- Dưới một trình giám sát dịch vụ, tiến trình Gateway mới thấy một bộ phản hồi `/healthz` khỏe mạnh hiện có sẽ để tiến trình đó tiếp tục nắm quyền điều khiển. Trên systemd, tiến trình khởi chạy trùng lặp thoát với mã 78 để `RestartPreventExitStatus=78` mặc định ngăn `Restart=always` lặp lại khi có xung đột khóa hoặc `EADDRINUSE`. Nếu tiến trình hiện có không bao giờ trở nên khỏe mạnh, các lần thử lại sẽ bị giới hạn và quá trình khởi động thất bại với lỗi khóa rõ ràng thay vì lặp mãi mãi.
- Ứng dụng macOS vẫn duy trì cơ chế bảo vệ PID nhẹ của riêng nó trước khi sinh Gateway; khóa runtime được thực thi bằng tệp khóa cộng với liên kết HTTP/WebSocket.

## Liên quan

- [Nhiều Gateway](/vi/gateway/multiple-gateways) — chạy nhiều phiên bản với các cổng duy nhất
- [Khắc phục sự cố](/vi/gateway/troubleshooting) — chẩn đoán `EADDRINUSE` và xung đột cổng
