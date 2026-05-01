---
read_when:
    - Bạn muốn phòng thủ theo chiều sâu chống lại các cuộc tấn công SSRF và DNS rebinding
    - Cấu hình proxy chuyển tiếp bên ngoài cho lưu lượng thời gian chạy của OpenClaw
summary: Cách định tuyến lưu lượng HTTP và WebSocket thời gian chạy của OpenClaw qua proxy lọc do người vận hành quản lý
title: Proxy mạng
x-i18n:
    generated_at: "2026-05-01T10:53:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9207d349e4410e38631ae7665be19b536e4a4128a4e80dd095e802804dfd66a3
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy mạng

OpenClaw có thể định tuyến lưu lượng HTTP và WebSocket khi chạy qua một proxy chuyển tiếp do người vận hành quản lý. Đây là lớp phòng thủ chiều sâu tùy chọn cho các triển khai muốn kiểm soát lưu lượng ra tập trung, bảo vệ SSRF mạnh hơn và khả năng kiểm toán mạng tốt hơn.

OpenClaw không cung cấp, tải xuống, khởi động, cấu hình hoặc chứng nhận proxy. Bạn chạy công nghệ proxy phù hợp với môi trường của mình, và OpenClaw định tuyến các client HTTP và WebSocket cục bộ theo tiến trình thông thường qua proxy đó.

## Vì sao dùng proxy?

Proxy cung cấp cho người vận hành một điểm kiểm soát mạng duy nhất cho lưu lượng HTTP và WebSocket đi ra. Điều đó có thể hữu ích ngay cả ngoài việc gia cố chống SSRF:

- Chính sách tập trung: duy trì một chính sách lưu lượng ra thay vì dựa vào từng điểm gọi HTTP của ứng dụng để áp dụng đúng quy tắc mạng.
- Kiểm tra tại thời điểm kết nối: đánh giá đích sau khi phân giải DNS và ngay trước khi proxy mở kết nối ngược dòng.
- Phòng vệ DNS rebinding: giảm khoảng trống giữa kiểm tra DNS ở cấp ứng dụng và kết nối đi ra thực tế.
- Bao phủ JavaScript rộng hơn: định tuyến các client thông thường như `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch và các client tương tự qua cùng một đường dẫn.
- Khả năng kiểm toán: ghi nhật ký các đích được cho phép và bị từ chối tại ranh giới lưu lượng ra.
- Kiểm soát vận hành: thực thi quy tắc đích, phân đoạn mạng, giới hạn tốc độ hoặc danh sách cho phép lưu lượng ra mà không cần dựng lại OpenClaw.

Định tuyến proxy là hàng rào bảo vệ cấp tiến trình cho lưu lượng HTTP và WebSocket đi ra thông thường. Nó cung cấp cho người vận hành một đường dẫn fail-closed để định tuyến các client HTTP JavaScript được hỗ trợ qua proxy lọc của riêng họ, nhưng đây không phải là sandbox mạng cấp hệ điều hành và không khiến OpenClaw chứng nhận chính sách đích của proxy.

## Cách OpenClaw định tuyến lưu lượng

Khi `proxy.enabled=true` và URL proxy được cấu hình, các tiến trình runtime được bảo vệ như `openclaw gateway run`, `openclaw node run` và `openclaw agent --local` định tuyến lưu lượng HTTP và WebSocket đi ra thông thường qua proxy đã cấu hình:

```text
Tiến trình OpenClaw
  fetch                  -> proxy lọc do người vận hành quản lý -> internet công cộng
  node:http và https     -> proxy lọc do người vận hành quản lý -> internet công cộng
  Client WebSocket       -> proxy lọc do người vận hành quản lý -> internet công cộng
```

Hợp đồng công khai là hành vi định tuyến, không phải các hook nội bộ của Node được dùng để triển khai nó. Các client WebSocket mặt phẳng điều khiển của OpenClaw Gateway dùng một đường dẫn trực tiếp hẹp cho lưu lượng RPC Gateway qua local loopback khi URL Gateway dùng `localhost` hoặc một IP loopback dạng literal như `127.0.0.1` hoặc `[::1]`. Đường dẫn mặt phẳng điều khiển đó phải có thể truy cập các Gateway loopback ngay cả khi proxy của người vận hành chặn các đích loopback. Các yêu cầu HTTP và WebSocket runtime thông thường vẫn dùng proxy đã cấu hình.

Bên trong, OpenClaw dùng hai hook định tuyến cấp tiến trình cho tính năng này:

- Định tuyến dispatcher của Undici bao phủ `fetch`, các client dựa trên undici và các transport cung cấp dispatcher undici riêng.
- Định tuyến `global-agent` bao phủ các bên gọi Node core `node:http` và `node:https`, bao gồm nhiều thư viện xây trên `http.request`, `https.request`, `http.get` và `https.get`. Chế độ proxy được quản lý ép dùng agent toàn cục đó để các agent HTTP Node tường minh không vô tình bỏ qua proxy của người vận hành.

Một số Plugin sở hữu transport tùy chỉnh cần nối proxy tường minh ngay cả khi đã có định tuyến cấp tiến trình. Ví dụ, transport Bot API của Telegram dùng dispatcher undici HTTP/1 riêng và vì vậy tôn trọng env proxy của tiến trình cộng với phương án dự phòng `OPENCLAW_PROXY_URL` được quản lý trong đường dẫn transport riêng của chủ sở hữu đó.

Bản thân URL proxy phải dùng `http://`. Các đích HTTPS vẫn được hỗ trợ qua proxy bằng HTTP `CONNECT`; điều này chỉ có nghĩa là OpenClaw kỳ vọng một listener proxy chuyển tiếp HTTP thuần như `http://127.0.0.1:3128`.

Trong khi proxy đang hoạt động, OpenClaw xóa `no_proxy`, `NO_PROXY` và `GLOBAL_AGENT_NO_PROXY`. Các danh sách bỏ qua đó dựa trên đích, nên nếu để `localhost` hoặc `127.0.0.1` trong đó thì các mục tiêu SSRF rủi ro cao có thể bỏ qua proxy lọc.

Khi tắt, OpenClaw khôi phục môi trường proxy trước đó và đặt lại trạng thái định tuyến tiến trình đã lưu trong bộ nhớ đệm.

## Các thuật ngữ proxy liên quan

- `proxy.enabled` / `proxy.proxyUrl`: định tuyến proxy chuyển tiếp đi ra cho lưu lượng runtime của OpenClaw. Trang này ghi lại tính năng đó.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse proxy nhận biết danh tính đi vào cho quyền truy cập Gateway. Xem [xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy gỡ lỗi cục bộ và trình kiểm tra ghi nhận cho phát triển và hỗ trợ. Xem [openclaw proxy](/vi/cli/proxy).
- Thiết lập proxy riêng theo kênh hoặc nhà cung cấp: các ghi đè riêng của chủ sở hữu cho một transport cụ thể. Ưu tiên proxy mạng được quản lý khi mục tiêu là kiểm soát lưu lượng ra tập trung trên toàn runtime.

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

Nếu `enabled=true` nhưng không có URL proxy hợp lệ nào được cấu hình, các lệnh được bảo vệ sẽ không khởi động thay vì quay về truy cập mạng trực tiếp.

Đối với các dịch vụ gateway được quản lý khởi động bằng `openclaw gateway start`, nên lưu URL trong cấu hình:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Phương án dự phòng bằng môi trường phù hợp nhất cho các lần chạy tiền cảnh. Nếu bạn dùng nó với một dịch vụ đã cài đặt, hãy đặt `OPENCLAW_PROXY_URL` trong môi trường bền vững của dịch vụ, chẳng hạn `$OPENCLAW_STATE_DIR/.env` hoặc `~/.openclaw/.env`, rồi cài đặt lại dịch vụ để launchd, systemd hoặc Scheduled Tasks khởi động gateway với giá trị đó.

Đối với các lệnh `openclaw --container ...`, OpenClaw chuyển tiếp `OPENCLAW_PROXY_URL` vào CLI con nhắm tới container khi biến này được đặt. URL phải truy cập được từ bên trong container; `127.0.0.1` trỏ tới chính container, không phải host. OpenClaw từ chối các URL proxy loopback cho lệnh nhắm tới container trừ khi bạn ghi đè rõ ràng kiểm tra an toàn đó.

## Yêu cầu đối với proxy

Chính sách proxy là ranh giới bảo mật. OpenClaw không thể xác minh rằng proxy chặn đúng các mục tiêu.

Cấu hình proxy để:

- Chỉ bind vào loopback hoặc giao diện riêng đáng tin cậy.
- Hạn chế truy cập để chỉ tiến trình, host, container hoặc tài khoản dịch vụ của OpenClaw có thể dùng nó.
- Tự phân giải đích và chặn IP đích sau khi phân giải DNS.
- Áp dụng chính sách tại thời điểm kết nối cho cả yêu cầu HTTP thuần và tunnel HTTPS `CONNECT`.
- Từ chối các cơ chế bỏ qua dựa trên đích đối với loopback, private, link-local, metadata, multicast, reserved hoặc các dải tài liệu.
- Tránh danh sách cho phép hostname trừ khi bạn hoàn toàn tin cậy đường dẫn phân giải DNS.
- Ghi nhật ký đích, quyết định, trạng thái và lý do mà không ghi thân yêu cầu, header ủy quyền, cookie hoặc các bí mật khác.
- Đưa chính sách proxy vào kiểm soát phiên bản và review thay đổi như cấu hình nhạy cảm về bảo mật.

## Các đích nên chặn

Dùng danh sách chặn này làm điểm khởi đầu cho bất kỳ proxy chuyển tiếp, tường lửa hoặc chính sách lưu lượng ra nào.

Logic phân loại cấp ứng dụng của OpenClaw nằm trong `src/infra/net/ssrf.ts` và `src/shared/net/ip.ts`. Các hook tương thích liên quan là `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` và xử lý sentinel IPv4 nhúng cho NAT64, 6to4, Teredo, ISATAP và các dạng IPv4-mapped. Các tệp đó là tài liệu tham khảo hữu ích khi duy trì chính sách proxy bên ngoài, nhưng OpenClaw không tự động xuất hoặc thực thi các quy tắc đó trong proxy của bạn.

| Dải hoặc host                                                                        | Lý do chặn                                                   |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                                |
| `::1/128`                                                                            | Loopback IPv6                                                |
| `0.0.0.0/8`, `::/128`                                                                | Địa chỉ không xác định và địa chỉ this-network               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Mạng riêng RFC1918                                           |
| `169.254.0.0/16`, `fe80::/10`                                                        | Địa chỉ link-local và các đường dẫn metadata đám mây phổ biến |
| `169.254.169.254`, `metadata.google.internal`                                        | Dịch vụ metadata đám mây                                     |
| `100.64.0.0/10`                                                                      | Không gian địa chỉ chia sẻ NAT cấp nhà mạng                  |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Dải benchmark                                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Dải special-use và tài liệu                                  |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                                    |
| `240.0.0.0/4`                                                                        | IPv4 dự trữ                                                  |
| `fc00::/7`, `fec0::/10`                                                              | Dải IPv6 cục bộ/riêng                                        |
| `100::/64`, `2001:20::/28`                                                           | Dải IPv6 discard và ORCHIDv2                                 |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Tiền tố NAT64 với IPv4 nhúng                                 |
| `2002::/16`, `2001::/32`                                                             | 6to4 và Teredo với IPv4 nhúng                                |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 tương thích IPv4 và IPv6 IPv4-mapped                    |

Nếu nhà cung cấp đám mây hoặc nền tảng mạng của bạn ghi lại thêm các host metadata hoặc dải dự trữ, hãy thêm cả chúng.

## Xác thực

Xác thực proxy từ cùng host, container hoặc tài khoản dịch vụ chạy OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Theo mặc định, khi không cung cấp đích tùy chỉnh, lệnh kiểm tra rằng `https://example.com/` thành công và khởi động một canary loopback tạm thời mà proxy không được phép truy cập. Kiểm tra bị từ chối mặc định đạt khi proxy trả về phản hồi từ chối không phải 2xx hoặc chặn canary bằng lỗi transport; kiểm tra thất bại nếu một phản hồi thành công tới được canary. Nếu không có proxy nào được bật và cấu hình, quá trình xác thực báo cáo sự cố cấu hình; dùng `--proxy-url` cho một lần kiểm tra trước trước khi thay đổi cấu hình. Dùng `--allowed-url` và `--denied-url` để kiểm thử các kỳ vọng riêng của triển khai. Các đích bị từ chối tùy chỉnh là fail-closed: bất kỳ phản hồi HTTP nào đều có nghĩa là đích có thể truy cập được qua proxy, và bất kỳ lỗi transport nào đều được báo cáo là không kết luận được vì OpenClaw không thể chứng minh proxy đã chặn một origin có thể truy cập. Khi xác thực thất bại, lệnh thoát với mã 1.

Dùng `--json` cho tự động hóa. Đầu ra JSON chứa kết quả tổng thể, nguồn cấu hình proxy hiệu lực, mọi lỗi cấu hình và từng kiểm tra đích. Thông tin xác thực URL proxy được biên tập trong đầu ra văn bản và JSON:

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    }
  ]
}
```

Bạn cũng có thể xác thực thủ công bằng `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Yêu cầu công khai sẽ thành công. Các yêu cầu loopback và metadata sẽ bị proxy chặn. Đối với `openclaw proxy validate`, canary loopback tích hợp sẵn có thể phân biệt việc proxy từ chối với một origin có thể truy cập. Các kiểm tra `--denied-url` tùy chỉnh không có canary đó, vì vậy hãy xem cả phản hồi HTTP lẫn lỗi truyền tải mơ hồ là lỗi xác thực, trừ khi proxy của bạn cung cấp một tín hiệu từ chối dành riêng cho triển khai mà bạn có thể xác minh riêng.

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

- Proxy cải thiện phạm vi bao phủ cho các client HTTP và WebSocket JavaScript cục bộ trong tiến trình, nhưng không phải là sandbox mạng cấp hệ điều hành.
- Các socket `net`, `tls` và `http2` thô, addon native và tiến trình con có thể bỏ qua định tuyến proxy cấp Node, trừ khi chúng kế thừa và tuân thủ các biến môi trường proxy.
- WebUI cục bộ của người dùng và máy chủ mô hình cục bộ nên được đưa vào danh sách cho phép trong chính sách proxy của người vận hành khi cần; OpenClaw không cung cấp cơ chế bỏ qua mạng cục bộ chung cho chúng.
- Việc bỏ qua proxy cho control-plane của Gateway được cố ý giới hạn ở `localhost` và URL IP loopback dạng literal. Dùng `ws://127.0.0.1:18789`, `ws://[::1]:18789`, hoặc `ws://localhost:18789` cho các kết nối control-plane Gateway trực tiếp cục bộ; các tên máy chủ khác được định tuyến như lưu lượng dựa trên tên máy chủ thông thường.
- OpenClaw không kiểm tra, thử nghiệm hoặc chứng nhận chính sách proxy của bạn.
- Hãy xem các thay đổi chính sách proxy là các thay đổi vận hành nhạy cảm về bảo mật.
