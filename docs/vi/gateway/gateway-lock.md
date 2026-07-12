---
read_when:
    - Chạy hoặc gỡ lỗi tiến trình Gateway
    - Điều tra cơ chế thực thi chỉ một phiên bản đang chạy
summary: 'Cơ chế bảo vệ Gateway đơn thể: khóa tệp kết hợp với liên kết WebSocket/HTTP'
title: Khóa Gateway
x-i18n:
    generated_at: "2026-07-12T07:57:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Tại sao

- Chỉ một tiến trình Gateway nên sở hữu một cấu hình + cổng nhất định trên một máy chủ; hãy chạy các Gateway bổ sung với hồ sơ biệt lập và cổng riêng biệt.
- Vẫn hoạt động sau sự cố/SIGKILL mà không để lại các tệp khóa cũ.
- Thất bại ngay với lỗi rõ ràng khi một Gateway khác đã sở hữu cổng.

## Hai lớp

Quá trình khởi động thực thi quyền sở hữu một phiên bản duy nhất qua hai bước độc lập, theo thứ tự:

1. **Khóa tệp** lấy một tệp khóa riêng cho từng cấu hình trong thư mục khóa trạng thái. Trong quá trình lấy khóa, bước khởi động thăm dò cổng đã cấu hình để tìm trình lắng nghe đang hoạt động nhằm phát hiện chủ sở hữu khóa cũ (đã gặp sự cố).
2. **Liên kết socket** liên kết trình lắng nghe HTTP/WebSocket (mặc định là `ws://127.0.0.1:18789`) dưới dạng trình lắng nghe TCP độc quyền.

Mỗi lớp có thể thất bại độc lập và ném ra `GatewayLockError` riêng.

### Khóa tệp

- Nếu thiếu tệp khóa, tiến trình chủ sở hữu đã ghi nhận không còn tồn tại hoặc phép thăm dò cổng của chủ sở hữu cho thấy không có trình lắng nghe đang hoạt động, quá trình khởi động sẽ thu hồi khóa và tiếp tục.
- Nếu khóa đang được giữ và không có điều kiện nào nêu trên áp dụng, quá trình khởi động sẽ thử lại trong tối đa 5 giây (mặc định) trước khi bỏ cuộc:

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Liên kết socket

- Khi gặp `EADDRINUSE`, quá trình khởi động thử liên kết lại tối đa 20 lần, cách nhau 500ms (tổng cộng khoảng 10 giây) để chờ hết khoảng thời gian `TIME_WAIT` sau khi một tiến trình vừa thoát.
- Nếu cổng vẫn đang được sử dụng sau khi thử lại:

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Các lỗi liên kết khác:

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Khi tắt, Gateway đóng máy chủ HTTP/WebSocket và xóa tệp khóa.

## Ghi chú vận hành

- Nếu cổng đang bị một tiến trình khác không phải Gateway chiếm dụng, lỗi vẫn giống nhau; hãy giải phóng cổng hoặc chọn cổng khác bằng `openclaw gateway --port <port>`.
- Khi chạy dưới trình giám sát dịch vụ, một tiến trình Gateway mới gặp một trong hai lỗi trên trước tiên sẽ thăm dò `/healthz` trên tiến trình hiện có. Nếu tiến trình đó hoạt động bình thường, tiến trình mới sẽ để nó tiếp tục kiểm soát thay vì thất bại. Trên systemd, tiến trình thoát với mã `78`; `RestartPreventExitStatus=78` của đơn vị ngăn `Restart=always` lặp lại do xung đột khóa hoặc `EADDRINUSE`. Nếu tiến trình hiện có không bao giờ đạt trạng thái hoạt động bình thường, việc thử lại phép thăm dò tình trạng sẽ bị giới hạn thời gian, sau đó quá trình khởi động thất bại với lỗi khóa nêu trên thay vì lặp vô hạn.
- Ứng dụng macOS duy trì cơ chế bảo vệ PID nhẹ riêng trước khi khởi tạo Gateway; khóa tệp và liên kết socket nêu trên mới là cơ chế thực thi thực tế khi chạy.

## Liên quan

- [Nhiều Gateway](/vi/gateway/multiple-gateways) - chạy nhiều phiên bản với các cổng riêng biệt
- [Khắc phục sự cố](/vi/gateway/troubleshooting) - chẩn đoán `EADDRINUSE` và xung đột cổng
