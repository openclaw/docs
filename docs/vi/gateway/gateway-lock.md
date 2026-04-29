---
read_when:
    - Chạy hoặc gỡ lỗi tiến trình Gateway
    - Đang điều tra cơ chế thực thi một phiên bản duy nhất
summary: Cơ chế bảo vệ singleton của Gateway sử dụng thao tác liên kết trình lắng nghe WebSocket
title: Khóa Gateway
x-i18n:
    generated_at: "2026-04-29T22:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Lý do

- Đảm bảo chỉ một phiên bản Gateway chạy trên mỗi cổng cơ sở trên cùng một máy chủ; các Gateway bổ sung phải dùng hồ sơ cô lập và cổng duy nhất.
- Chịu được sự cố/SIGKILL mà không để lại tệp khóa cũ.
- Thất bại nhanh với lỗi rõ ràng khi cổng điều khiển đã bị chiếm.

## Cơ chế

- Trước tiên, Gateway lấy một tệp khóa theo từng cấu hình trong thư mục khóa trạng thái và thăm dò cổng đã cấu hình để tìm listener hiện có.
- Nếu chủ sở hữu khóa đã ghi nhận không còn tồn tại, cổng đang trống, hoặc khóa đã cũ, quá trình khởi động sẽ thu hồi khóa và tiếp tục.
- Sau đó Gateway bind listener HTTP/WebSocket (mặc định `ws://127.0.0.1:18789`) bằng một listener TCP độc quyền.
- Nếu bind thất bại với `EADDRINUSE`, quá trình khởi động ném `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Khi tắt, Gateway đóng máy chủ HTTP/WebSocket và xóa tệp khóa.

## Bề mặt lỗi

- Nếu một tiến trình khác đang giữ cổng, quá trình khởi động ném `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Các lỗi bind khác hiển thị dưới dạng `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Ghi chú vận hành

- Nếu cổng bị _một_ tiến trình khác chiếm, lỗi cũng giống như vậy; giải phóng cổng hoặc chọn cổng khác bằng `openclaw gateway --port <port>`.
- Dưới một trình giám sát dịch vụ, một tiến trình Gateway mới thấy một bộ phản hồi `/healthz` khỏe mạnh hiện có sẽ thoát thành công và để tiến trình đó tiếp tục kiểm soát. Nếu tiến trình hiện có không bao giờ trở nên khỏe mạnh, số lần thử lại sẽ được giới hạn và quá trình khởi động thất bại với lỗi khóa rõ ràng thay vì lặp mãi mãi.
- Ứng dụng macOS vẫn duy trì cơ chế bảo vệ PID nhẹ của riêng nó trước khi spawn Gateway; khóa runtime được thực thi bằng tệp khóa cộng với bind HTTP/WebSocket.

## Liên quan

- [Nhiều Gateway](/vi/gateway/multiple-gateways) — chạy nhiều phiên bản với các cổng duy nhất
- [Khắc phục sự cố](/vi/gateway/troubleshooting) — chẩn đoán `EADDRINUSE` và xung đột cổng
