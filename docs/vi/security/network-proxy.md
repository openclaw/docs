---
read_when:
    - Bạn muốn phòng thủ nhiều lớp chống lại SSRF và các cuộc tấn công DNS rebinding
    - Cấu hình máy chủ ủy quyền chuyển tiếp bên ngoài cho lưu lượng thời gian chạy của OpenClaw
summary: Cách định tuyến lưu lượng HTTP và WebSocket trong thời gian chạy của OpenClaw qua một proxy lọc do người vận hành quản lý
title: Proxy mạng
x-i18n:
    generated_at: "2026-04-29T23:14:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5f6c2ba03ef9826675bb82957be21ec690631fcf5eca1e99775c3c145cd1531
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy mạng

OpenClaw có thể định tuyến lưu lượng HTTP và WebSocket trong thời gian chạy qua một proxy chuyển tiếp do người vận hành quản lý. Đây là lớp phòng vệ tùy chọn theo chiều sâu cho các triển khai muốn kiểm soát lưu lượng ra ngoài tập trung, bảo vệ SSRF mạnh hơn và khả năng kiểm toán mạng tốt hơn.

OpenClaw không cung cấp kèm, tải xuống, khởi động, cấu hình hoặc chứng nhận proxy. Bạn chạy công nghệ proxy phù hợp với môi trường của mình, và OpenClaw định tuyến các máy khách HTTP và WebSocket cục bộ trong tiến trình thông thường qua proxy đó.

## Vì sao dùng proxy?

Proxy cung cấp cho người vận hành một điểm kiểm soát mạng duy nhất cho lưu lượng HTTP và WebSocket đi ra ngoài. Điều đó có thể hữu ích ngay cả ngoài việc gia cố chống SSRF:

- Chính sách tập trung: duy trì một chính sách lưu lượng ra ngoài thay vì dựa vào từng vị trí gọi HTTP của ứng dụng để áp dụng đúng quy tắc mạng.
- Kiểm tra tại thời điểm kết nối: đánh giá đích sau khi phân giải DNS và ngay trước khi proxy mở kết nối ngược lên thượng nguồn.
- Phòng vệ chống DNS rebinding: giảm khoảng cách giữa kiểm tra DNS ở cấp ứng dụng và kết nối đi ra ngoài thực tế.
- Bao phủ JavaScript rộng hơn: định tuyến các máy khách thông thường như `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch và tương tự qua cùng một đường dẫn.
- Khả năng kiểm toán: ghi nhật ký các đích được phép và bị từ chối tại ranh giới lưu lượng ra ngoài.
- Kiểm soát vận hành: thực thi quy tắc đích, phân đoạn mạng, giới hạn tốc độ hoặc danh sách cho phép đi ra ngoài mà không cần dựng lại OpenClaw.

Định tuyến proxy là một rào chắn ở cấp tiến trình cho lưu lượng HTTP và WebSocket đi ra ngoài thông thường. Nó cung cấp cho người vận hành một đường dẫn fail-closed để định tuyến các máy khách HTTP JavaScript được hỗ trợ qua proxy lọc của riêng họ, nhưng không phải là sandbox mạng cấp hệ điều hành và không khiến OpenClaw chứng nhận chính sách đích của proxy.

## Cách OpenClaw định tuyến lưu lượng

Khi `proxy.enabled=true` và URL proxy được cấu hình, các tiến trình thời gian chạy được bảo vệ như `openclaw gateway run`, `openclaw node run` và `openclaw agent --local` sẽ định tuyến lưu lượng HTTP và WebSocket đi ra ngoài thông thường qua proxy đã cấu hình:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Hợp đồng công khai là hành vi định tuyến, không phải các hook Node nội bộ dùng để triển khai nó. Các máy khách WebSocket mặt phẳng điều khiển OpenClaw Gateway dùng một đường dẫn trực tiếp hẹp cho lưu lượng RPC Gateway local loopback khi URL Gateway dùng `localhost` hoặc một IP loopback dạng literal như `127.0.0.1` hoặc `[::1]`. Đường dẫn mặt phẳng điều khiển đó phải có thể truy cập các Gateway loopback ngay cả khi proxy của người vận hành chặn các đích loopback. Các yêu cầu HTTP và WebSocket trong thời gian chạy thông thường vẫn dùng proxy đã cấu hình.

Bản thân URL proxy phải dùng `http://`. Các đích HTTPS vẫn được hỗ trợ qua proxy bằng HTTP `CONNECT`; điều này chỉ có nghĩa là OpenClaw kỳ vọng một listener proxy chuyển tiếp HTTP thường như `http://127.0.0.1:3128`.

Khi proxy đang hoạt động, OpenClaw xóa `no_proxy`, `NO_PROXY` và `GLOBAL_AGENT_NO_PROXY`. Các danh sách bỏ qua đó dựa trên đích, nên nếu để `localhost` hoặc `127.0.0.1` trong đó thì các đích SSRF rủi ro cao có thể bỏ qua proxy lọc.

Khi tắt, OpenClaw khôi phục môi trường proxy trước đó và đặt lại trạng thái định tuyến tiến trình đã lưu trong bộ nhớ đệm.

## Cấu hình

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Bạn cũng có thể cung cấp URL qua môi trường, trong khi vẫn giữ `proxy.enabled=true` trong cấu hình:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` được ưu tiên hơn `OPENCLAW_PROXY_URL`.

Nếu `enabled=true` nhưng không có URL proxy hợp lệ nào được cấu hình, các lệnh được bảo vệ sẽ không khởi động thay vì chuyển về truy cập mạng trực tiếp.

Với các dịch vụ gateway được quản lý khởi động bằng `openclaw gateway start`, nên lưu URL trong cấu hình:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Phương án dự phòng qua môi trường phù hợp nhất cho các lần chạy foreground. Nếu bạn dùng nó với một dịch vụ đã cài đặt, hãy đặt `OPENCLAW_PROXY_URL` trong môi trường bền vững của dịch vụ, chẳng hạn `$OPENCLAW_STATE_DIR/.env` hoặc `~/.openclaw/.env`, rồi cài đặt lại dịch vụ để launchd, systemd hoặc Scheduled Tasks khởi động gateway với giá trị đó.

Với các lệnh `openclaw --container ...`, OpenClaw chuyển tiếp `OPENCLAW_PROXY_URL` vào CLI con nhắm đến container khi biến này được đặt. URL phải truy cập được từ bên trong container; `127.0.0.1` trỏ đến chính container, không phải host. OpenClaw từ chối URL proxy loopback cho các lệnh nhắm đến container trừ khi bạn ghi đè rõ ràng kiểm tra an toàn đó.

## Yêu cầu đối với proxy

Chính sách proxy là ranh giới bảo mật. OpenClaw không thể xác minh rằng proxy chặn đúng các đích cần chặn.

Cấu hình proxy để:

- Chỉ bind vào loopback hoặc một giao diện riêng tư đáng tin cậy.
- Hạn chế quyền truy cập để chỉ tiến trình, host, container hoặc tài khoản dịch vụ OpenClaw có thể dùng nó.
- Tự phân giải đích và chặn IP đích sau khi phân giải DNS.
- Áp dụng chính sách tại thời điểm kết nối cho cả yêu cầu HTTP thường và tunnel HTTPS `CONNECT`.
- Từ chối các bỏ qua dựa trên đích đối với các dải loopback, private, link-local, metadata, multicast, reserved hoặc documentation.
- Tránh danh sách cho phép hostname trừ khi bạn hoàn toàn tin tưởng đường dẫn phân giải DNS.
- Ghi nhật ký đích, quyết định, trạng thái và lý do mà không ghi nội dung thân yêu cầu, header ủy quyền, cookie hoặc bí mật khác.
- Đưa chính sách proxy vào kiểm soát phiên bản và review các thay đổi như cấu hình nhạy cảm về bảo mật.

## Các đích nên chặn

Dùng denylist này làm điểm khởi đầu cho mọi proxy chuyển tiếp, tường lửa hoặc chính sách lưu lượng ra ngoài.

Logic phân loại cấp ứng dụng của OpenClaw nằm trong `src/infra/net/ssrf.ts` và `src/shared/net/ip.ts`. Các hook tương đương liên quan là `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` và xử lý sentinel IPv4 nhúng cho NAT64, 6to4, Teredo, ISATAP và các dạng ánh xạ IPv4. Các tệp đó là tài liệu tham khảo hữu ích khi duy trì chính sách proxy bên ngoài, nhưng OpenClaw không tự động xuất hoặc thực thi các quy tắc đó trong proxy của bạn.

| Dải hoặc host                                                                        | Lý do chặn                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Địa chỉ unspecified và this-network                  |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Mạng riêng RFC1918                                   |
| `169.254.0.0/16`, `fe80::/10`                                                        | Địa chỉ link-local và các đường dẫn metadata đám mây phổ biến |
| `169.254.169.254`, `metadata.google.internal`                                        | Dịch vụ metadata đám mây                             |
| `100.64.0.0/10`                                                                      | Không gian địa chỉ dùng chung của NAT cấp nhà mạng   |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Dải benchmark                                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Dải special-use và documentation                     |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 reserved                                        |
| `fc00::/7`, `fec0::/10`                                                              | Dải IPv6 cục bộ/riêng tư                             |
| `100::/64`, `2001:20::/28`                                                           | Dải IPv6 discard và ORCHIDv2                         |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Tiền tố NAT64 có IPv4 nhúng                          |
| `2002::/16`, `2001::/32`                                                             | 6to4 và Teredo có IPv4 nhúng                         |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 tương thích IPv4 và IPv6 ánh xạ IPv4            |

Nếu nhà cung cấp đám mây hoặc nền tảng mạng của bạn có tài liệu về các host metadata hoặc dải reserved bổ sung, hãy thêm cả những mục đó.

## Xác thực

Xác thực proxy từ cùng host, container hoặc tài khoản dịch vụ chạy OpenClaw:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Yêu cầu công khai nên thành công. Các yêu cầu loopback và metadata nên thất bại tại proxy.

Sau đó bật định tuyến proxy của OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

hoặc đặt:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Giới hạn

- Proxy cải thiện phạm vi bao phủ cho các máy khách HTTP và WebSocket JavaScript cục bộ trong tiến trình, nhưng không phải là sandbox mạng cấp hệ điều hành.
- Socket `net`, `tls` và `http2` thô, addon native và tiến trình con có thể bỏ qua định tuyến proxy cấp Node trừ khi chúng kế thừa và tôn trọng các biến môi trường proxy.
- WebUI cục bộ của người dùng và máy chủ mô hình cục bộ nên được đưa vào danh sách cho phép trong chính sách proxy của người vận hành khi cần; OpenClaw không cung cấp một cơ chế bỏ qua mạng cục bộ tổng quát cho chúng.
- Bỏ qua proxy mặt phẳng điều khiển Gateway được giới hạn có chủ ý ở `localhost` và URL IP loopback dạng literal. Dùng `ws://127.0.0.1:18789`, `ws://[::1]:18789` hoặc `ws://localhost:18789` cho các kết nối mặt phẳng điều khiển Gateway trực tiếp cục bộ; các hostname khác định tuyến như lưu lượng dựa trên hostname thông thường.
- OpenClaw không kiểm tra, thử nghiệm hoặc chứng nhận chính sách proxy của bạn.
- Hãy xem các thay đổi chính sách proxy là thay đổi vận hành nhạy cảm về bảo mật.
