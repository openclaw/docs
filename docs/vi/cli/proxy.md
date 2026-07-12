---
read_when:
    - Bạn cần xác thực định tuyến proxy do người vận hành quản lý trước khi triển khai
    - Bạn cần ghi lại lưu lượng truyền tải của OpenClaw trên máy cục bộ để gỡ lỗi
    - Bạn muốn kiểm tra các phiên proxy gỡ lỗi, blob hoặc các truy vấn cài sẵn tích hợp sẵn
summary: Tài liệu tham khảo CLI cho `openclaw proxy`, bao gồm quy trình xác thực proxy do người vận hành quản lý và trình kiểm tra bản ghi lưu lượng proxy gỡ lỗi cục bộ
title: Proxy
x-i18n:
    generated_at: "2026-07-12T07:49:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Xác thực định tuyến proxy do người vận hành quản lý, hoặc chạy proxy gỡ lỗi tường minh cục bộ và kiểm tra lưu lượng đã thu thập.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` thực hiện kiểm tra sơ bộ proxy chuyển tiếp do người vận hành quản lý. Các lệnh còn lại là công cụ gỡ lỗi để điều tra ở cấp độ truyền tải: khởi động proxy thu thập cục bộ, chạy lệnh con qua proxy đó, liệt kê các phiên thu thập, truy vấn mẫu lưu lượng, đọc các blob đã thu thập và xóa dữ liệu thu thập cục bộ.

## Xác thực

Kiểm tra URL proxy hiệu dụng do người vận hành quản lý từ `--proxy-url`, cấu hình (`proxy.proxyUrl`) hoặc `OPENCLAW_PROXY_URL`, theo thứ tự ưu tiên đó. Báo cáo sự cố cấu hình nếu chưa bật và cấu hình proxy; truyền `--proxy-url` để kiểm tra sơ bộ một lần mà không thay đổi cấu hình.

URL proxy được quản lý sử dụng `http://` cho trình lắng nghe proxy chuyển tiếp thuần túy, hoặc `https://` khi OpenClaw phải mở kết nối TLS đến chính điểm cuối proxy trước khi gửi yêu cầu proxy. Sử dụng `--proxy-ca-file` để tin cậy CA riêng tư cho kết nối TLS đó.

Theo mặc định, lệnh chạy:

- một phép kiểm tra **được phép** đối với `https://example.com/` (ghi đè/thêm bằng `--allowed-url`, có thể lặp lại)
- một phép kiểm tra **bị từ chối** đối với canary loopback tạm thời (ghi đè bằng `--denied-url`, có thể lặp lại)

Các đích `--denied-url` tùy chỉnh áp dụng nguyên tắc đóng khi lỗi: cả phản hồi HTTP lẫn lỗi truyền tải không rõ ràng đều được tính là thất bại, trừ khi bạn có thể xác minh độc lập tín hiệu từ chối dành riêng cho môi trường triển khai. Canary loopback tích hợp là đích duy nhất mà lỗi truyền tải được xem là bằng chứng chặn.

Thêm `--apns-reachable` để đồng thời mở đường hầm CONNECT HTTP/2 của APNs qua proxy và xác nhận APNs sandbox có phản hồi. Phép dò cố ý gửi mã thông báo nhà cung cấp không hợp lệ, vì vậy phản hồi APNs `403 InvalidProviderToken` được tính là tín hiệu có thể kết nối thành công (không phải lỗi).

### Tùy chọn

| Cờ                       | Tác dụng                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | in JSON mà máy có thể đọc                                                                                                              |
| `--proxy-url <url>`      | xác thực URL proxy `http://`/`https://` này thay cho cấu hình hoặc biến môi trường                                                      |
| `--proxy-ca-file <path>` | tin cậy tệp CA PEM này để xác minh TLS của điểm cuối proxy HTTPS                                                                        |
| `--allowed-url <url>`    | đích dự kiến truy cập thành công qua proxy (có thể lặp lại)                                                                             |
| `--denied-url <url>`     | đích dự kiến bị proxy chặn (có thể lặp lại)                                                                                             |
| `--apns-reachable`       | đồng thời xác minh có thể truy cập APNs sandbox qua HTTP/2 thông qua proxy                                                              |
| `--apns-authority <url>` | máy chủ APNs cần dò (mặc định `https://api.sandbox.push.apple.com`; môi trường sản xuất là `https://api.push.apple.com`)                |
| `--timeout-ms <ms>`      | thời gian chờ cho mỗi yêu cầu                                                                                                          |

Thoát với mã 1 khi cấu hình proxy hoặc các phép kiểm tra đích thất bại.

Xem [Proxy mạng](/vi/security/network-proxy) để biết hướng dẫn triển khai và ngữ nghĩa từ chối.

## Proxy gỡ lỗi

`start` khởi chạy proxy thu thập cục bộ và in URL, đường dẫn chứng chỉ CA cùng đường dẫn cơ sở dữ liệu thu thập; dừng bằng Ctrl+C. Theo mặc định, proxy liên kết với `127.0.0.1`, trừ khi đặt `--host`.

`run` khởi động proxy gỡ lỗi cục bộ, sau đó chạy `<cmd...>` (sau `--`) với môi trường proxy được áp dụng trong phiên thu thập riêng.

Chuyển tiếp trực tiếp lên thượng nguồn của proxy gỡ lỗi sẽ mở các socket thượng nguồn để chẩn đoán. Khi chế độ proxy được quản lý của OpenClaw đang hoạt động, tính năng chuyển tiếp trực tiếp cho các yêu cầu proxy và đường hầm CONNECT mặc định bị tắt; chỉ đặt `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` cho hoạt động chẩn đoán cục bộ đã được phê duyệt.

`coverage` in báo cáo JSON (`summary` + `entries` cho từng phương thức truyền tải) cho biết phương thức truyền tải nào được thu thập, chỉ đi qua proxy hoặc chưa được bao phủ.

`sessions` liệt kê các phiên thu thập gần đây (`--limit`, mặc định là 20).

`query --preset <name>` chạy truy vấn tích hợp đối với lưu lượng đã thu thập, có thể giới hạn phạm vi theo `--session <id>`. Các cấu hình đặt trước:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` in nội dung thô của blob tải trọng đã thu thập.

`purge` xóa toàn bộ siêu dữ liệu và blob của lưu lượng đã thu thập. Dữ liệu thu thập là dữ liệu gỡ lỗi cục bộ; hãy xóa khi hoàn tất.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Proxy mạng](/vi/security/network-proxy)
- [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)
