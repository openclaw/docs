---
read_when:
    - Chạy hoặc gỡ lỗi tiến trình Gateway
    - Điều tra cơ chế bắt buộc chỉ chạy một phiên bản duy nhất
summary: 'Cơ chế bảo vệ singleton của Gateway: khóa tệp cùng với liên kết WebSocket/HTTP'
title: Khóa Gateway
x-i18n:
    generated_at: "2026-07-16T14:30:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Lý do

- Chỉ một tiến trình Gateway được phép sở hữu một thư mục trạng thái; hãy chạy các Gateway bổ sung với hồ sơ, thư mục trạng thái, cấu hình và cổng riêng biệt.
- Tiếp tục hoạt động sau sự cố/SIGKILL mà không để lại các tệp khóa cũ.
- Dừng ngay với lỗi rõ ràng khi một Gateway khác đã sở hữu cổng.

## Ba lớp

Quá trình khởi động thực thi quyền sở hữu theo ba bước, theo thứ tự:

1. **Khóa quyền sở hữu trạng thái** lấy một khóa được định danh bằng thư mục trạng thái chính tắc. Mọi Gateway đều tham gia, kể cả các Gateway được khởi động bằng `OPENCLAW_ALLOW_MULTI_GATEWAY=1`, để thao tác bảo trì SQLite có tính phá hủy không thể xảy ra tranh chấp với một tiến trình sở hữu đang hoạt động.
2. **Khóa cấu hình** lấy khóa theo từng cấu hình kiểu cũ và ghi lại cổng thời gian chạy. Chế độ nhiều Gateway bỏ qua tính đơn nhất của cấu hình này nhưng vẫn giữ khóa quyền sở hữu trạng thái.
3. **Liên kết socket** liên kết trình lắng nghe HTTP/WebSocket (mặc định `ws://127.0.0.1:18789`) dưới dạng trình lắng nghe TCP độc quyền.

Mỗi lớp có thể lỗi độc lập và ném ra `GatewayLockError` riêng.

### Khóa trạng thái và cấu hình

- Tính hoạt động của khóa được xác định từ PID đã ghi, danh tính thời điểm bắt đầu tiến trình của nền tảng khi có sẵn và danh tính tiến trình Gateway. Một tiến trình sở hữu đã được xác minh vẫn có thẩm quyền trong quá trình khởi động trước khi cổng của tiến trình đó bắt đầu lắng nghe.
- Một trình điều phối SQLite chuyên dụng tuần tự hóa việc kiểm tra siêu dữ liệu, thu hồi quyền sở hữu cũ và thay thế khóa. Giao dịch độc quyền của trình này được tự động giải phóng nếu tiến trình sở hữu gặp sự cố.
- Nếu thiếu tệp khóa hoặc tiến trình sở hữu đã ghi không còn hoạt động, quá trình khởi động sẽ thu hồi khóa và tiếp tục.
- Nếu một trong hai khóa đang được giữ, quá trình khởi động sẽ thử lại trong tối đa 5 giây (mặc định) trước khi bỏ cuộc:

  ```text
  GatewayLockError("gateway đang chạy (pid <pid>); khóa hết thời gian chờ sau <ms>ms")
  ```

### Liên kết socket

- Khi gặp `EADDRINUSE`, quá trình khởi động sẽ thử liên kết lại tối đa 20 lần với khoảng cách 500ms (tổng cộng khoảng 10 giây) để chờ qua khoảng thời gian `TIME_WAIT` sau khi một tiến trình vừa thoát.
- Nếu cổng vẫn đang được sử dụng sau các lần thử lại:

  ```text
  GatewayLockError("một phiên bản gateway khác đã lắng nghe tại ws://127.0.0.1:<port>")
  ```

- Các lỗi liên kết khác:

  ```text
  GatewayLockError("không thể liên kết socket gateway tại ws://127.0.0.1:<port>: <cause>")
  ```

Khi tắt, Gateway đóng máy chủ HTTP/WebSocket và xóa các tệp khóa trạng thái
và cấu hình của mình.

## Ghi chú vận hành

- Nếu cổng bị một tiến trình khác không phải Gateway chiếm dụng, lỗi vẫn giống nhau; hãy giải phóng cổng hoặc chọn cổng khác bằng `openclaw gateway --port <port>`.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` cho phép nhiều phiên bản cấu hình/thời gian chạy, không cho phép dùng chung trạng thái có thể thay đổi. Mỗi phiên bản vẫn cần một `OPENCLAW_STATE_DIR` duy nhất.
- Khi chạy dưới trình giám sát dịch vụ, một tiến trình Gateway mới gặp một trong hai lỗi trên sẽ thăm dò `/healthz` trên tiến trình hiện có trước. Nếu tiến trình đó hoạt động bình thường, tiến trình mới sẽ để nó tiếp tục kiểm soát thay vì báo lỗi. Trên systemd, tiến trình thoát với mã `78`; `RestartPreventExitStatus=78` của unit ngăn `Restart=always` lặp lại do xung đột khóa hoặc `EADDRINUSE`. Nếu tiến trình hiện có không bao giờ trở nên hoạt động bình thường, số lần thử lại thăm dò tình trạng được giới hạn thời gian, sau đó quá trình khởi động sẽ thất bại với lỗi khóa ở trên thay vì lặp vô hạn.
- Ứng dụng macOS duy trì cơ chế bảo vệ PID nhẹ riêng trước khi khởi chạy Gateway; khóa tệp và liên kết socket ở trên mới là cơ chế thực thi thực tế trong thời gian chạy.

## Liên quan

- [Nhiều Gateway](/vi/gateway/multiple-gateways) - chạy nhiều phiên bản với các cổng riêng biệt
- [Khắc phục sự cố](/vi/gateway/troubleshooting) - chẩn đoán `EADDRINUSE` và xung đột cổng
