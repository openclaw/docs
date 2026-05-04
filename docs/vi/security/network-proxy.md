---
read_when:
    - Bạn muốn phòng thủ theo chiều sâu trước các cuộc tấn công SSRF và tái ràng buộc DNS
    - Cấu hình proxy chuyển tiếp bên ngoài cho lưu lượng thời gian chạy của OpenClaw
summary: Cách định tuyến lưu lượng HTTP và WebSocket của môi trường chạy OpenClaw qua proxy lọc do người vận hành quản lý
title: Proxy mạng
x-i18n:
    generated_at: "2026-05-04T02:25:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd5594324e8c6b7da51d903e98fda0feacb8970e0b15d980f7a249d6641461c9
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy mạng

OpenClaw có thể định tuyến lưu lượng HTTP và WebSocket thời gian chạy qua proxy chuyển tiếp do người vận hành quản lý. Đây là lớp phòng thủ chiều sâu tùy chọn cho các triển khai muốn kiểm soát đầu ra tập trung, bảo vệ SSRF mạnh hơn và khả năng kiểm toán mạng tốt hơn.

OpenClaw không cung cấp, tải xuống, khởi động, cấu hình hoặc chứng nhận proxy. Bạn chạy công nghệ proxy phù hợp với môi trường của mình, và OpenClaw định tuyến các máy khách HTTP và WebSocket cục bộ theo tiến trình thông thường qua proxy đó.

## Vì sao dùng proxy?

Proxy cung cấp cho người vận hành một điểm kiểm soát mạng duy nhất cho lưu lượng HTTP và WebSocket đi ra. Điều đó có thể hữu ích ngay cả ngoài việc gia cố chống SSRF:

- Chính sách tập trung: duy trì một chính sách đầu ra thay vì dựa vào từng vị trí gọi HTTP của ứng dụng để áp dụng đúng quy tắc mạng.
- Kiểm tra khi kết nối: đánh giá đích sau khi phân giải DNS và ngay trước khi proxy mở kết nối ngược dòng.
- Phòng thủ chống DNS rebinding: giảm khoảng cách giữa kiểm tra DNS ở cấp ứng dụng và kết nối đi ra thực tế.
- Bao phủ JavaScript rộng hơn: định tuyến các máy khách thông thường như `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch và tương tự qua cùng một đường đi.
- Khả năng kiểm toán: ghi lại các đích được cho phép và bị từ chối tại ranh giới đầu ra.
- Kiểm soát vận hành: thực thi quy tắc đích, phân đoạn mạng, giới hạn tốc độ hoặc danh sách cho phép đầu ra mà không cần xây dựng lại OpenClaw.

Định tuyến proxy là rào chắn ở cấp tiến trình cho đầu ra HTTP và WebSocket thông thường. Nó cung cấp cho người vận hành một đường fail-closed để định tuyến các máy khách HTTP JavaScript được hỗ trợ qua proxy lọc của riêng họ, nhưng đây không phải là sandbox mạng ở cấp hệ điều hành và không khiến OpenClaw chứng nhận chính sách đích của proxy.

## Cách OpenClaw định tuyến lưu lượng

Khi `proxy.enabled=true` và một URL proxy được cấu hình, các tiến trình thời gian chạy được bảo vệ như `openclaw gateway run`, `openclaw node run` và `openclaw agent --local` định tuyến đầu ra HTTP và WebSocket thông thường qua proxy đã cấu hình:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Hợp đồng công khai là hành vi định tuyến, không phải các hook Node nội bộ dùng để triển khai hành vi đó. Các máy khách WebSocket mặt phẳng điều khiển của OpenClaw Gateway dùng một đường trực tiếp hẹp cho lưu lượng RPC Gateway qua local loopback khi URL Gateway dùng `localhost` hoặc một IP loopback dạng literal như `127.0.0.1` hoặc `[::1]`. Đường mặt phẳng điều khiển đó phải có thể truy cập các Gateway loopback ngay cả khi proxy của người vận hành chặn các đích loopback. Các yêu cầu HTTP và WebSocket thời gian chạy thông thường vẫn dùng proxy đã cấu hình.

Bên trong, OpenClaw dùng hai hook định tuyến ở cấp tiến trình cho tính năng này:

- Định tuyến dispatcher Undici bao phủ `fetch`, các máy khách dựa trên undici và các transport tự cung cấp dispatcher undici.
- Định tuyến `global-agent` bao phủ các bên gọi Node lõi `node:http` và `node:https`, bao gồm nhiều thư viện xếp lớp trên `http.request`, `https.request`, `http.get` và `https.get`. Chế độ proxy được quản lý ép dùng global agent đó để các agent HTTP Node rõ ràng không vô tình bỏ qua proxy của người vận hành.

Một số plugin sở hữu transport tùy chỉnh cần đấu nối proxy rõ ràng ngay cả khi đã có định tuyến ở cấp tiến trình. Ví dụ, transport Bot API của Telegram dùng dispatcher undici HTTP/1 riêng và do đó tôn trọng env proxy của tiến trình cùng với phương án dự phòng `OPENCLAW_PROXY_URL` được quản lý trong đường transport thuộc chủ sở hữu cụ thể đó.

Chính URL proxy phải dùng `http://`. Các đích HTTPS vẫn được hỗ trợ qua proxy bằng HTTP `CONNECT`; điều này chỉ có nghĩa là OpenClaw kỳ vọng một trình nghe proxy chuyển tiếp HTTP thuần như `http://127.0.0.1:3128`.

Trong khi proxy đang hoạt động, OpenClaw xóa `no_proxy`, `NO_PROXY` và `GLOBAL_AGENT_NO_PROXY`. Các danh sách bỏ qua đó dựa trên đích, nên nếu để `localhost` hoặc `127.0.0.1` trong đó thì các mục tiêu SSRF rủi ro cao có thể bỏ qua proxy lọc.

Khi tắt, OpenClaw khôi phục môi trường proxy trước đó và đặt lại trạng thái định tuyến tiến trình đã lưu trong bộ nhớ đệm.

## Các thuật ngữ proxy liên quan

- `proxy.enabled` / `proxy.proxyUrl`: định tuyến proxy chuyển tiếp đi ra cho đầu ra thời gian chạy của OpenClaw. Trang này tài liệu hóa tính năng đó.
- `gateway.auth.mode: "trusted-proxy"`: xác thực proxy ngược nhận biết danh tính đi vào cho quyền truy cập Gateway. Xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy gỡ lỗi cục bộ và trình kiểm tra bắt lưu lượng cho phát triển và hỗ trợ. Xem [openclaw proxy](/vi/cli/proxy).
- Cài đặt proxy dành riêng cho kênh hoặc nhà cung cấp: các ghi đè thuộc chủ sở hữu cụ thể cho một transport nhất định. Ưu tiên proxy mạng được quản lý khi mục tiêu là kiểm soát đầu ra tập trung trên toàn thời gian chạy.

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

Nếu `enabled=true` nhưng không có URL proxy hợp lệ được cấu hình, các lệnh được bảo vệ sẽ thất bại khi khởi động thay vì quay về truy cập mạng trực tiếp.

Đối với các dịch vụ Gateway được quản lý khởi động bằng `openclaw gateway start`, nên lưu URL trong cấu hình:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Phương án dự phòng qua môi trường phù hợp nhất cho các lần chạy tiền cảnh. Nếu bạn dùng nó với một dịch vụ đã cài đặt, hãy đặt `OPENCLAW_PROXY_URL` trong môi trường bền vững của dịch vụ, chẳng hạn `$OPENCLAW_STATE_DIR/.env` hoặc `~/.openclaw/.env`, rồi cài đặt lại dịch vụ để launchd, systemd hoặc Scheduled Tasks khởi động Gateway với giá trị đó.

Đối với các lệnh `openclaw --container ...`, OpenClaw chuyển tiếp `OPENCLAW_PROXY_URL` vào CLI con nhắm tới container khi biến này được đặt. URL phải truy cập được từ bên trong container; `127.0.0.1` trỏ tới chính container, không phải máy chủ. OpenClaw từ chối URL proxy loopback cho các lệnh nhắm tới container trừ khi bạn ghi đè rõ ràng kiểm tra an toàn đó.

## Yêu cầu đối với proxy

Chính sách proxy là ranh giới bảo mật. OpenClaw không thể xác minh rằng proxy chặn đúng mục tiêu.

Cấu hình proxy để:

- Chỉ bind vào loopback hoặc một giao diện riêng tư đáng tin cậy.
- Hạn chế quyền truy cập để chỉ tiến trình, máy chủ, container hoặc tài khoản dịch vụ OpenClaw có thể dùng nó.
- Tự phân giải đích và chặn IP đích sau khi phân giải DNS.
- Áp dụng chính sách tại thời điểm kết nối cho cả yêu cầu HTTP thuần và tunnel HTTPS `CONNECT`.
- Từ chối các đường bỏ qua dựa trên đích cho loopback, private, link-local, metadata, multicast, reserved hoặc documentation ranges.
- Tránh danh sách cho phép hostname trừ khi bạn hoàn toàn tin tưởng đường phân giải DNS.
- Ghi lại đích, quyết định, trạng thái và lý do mà không ghi thân yêu cầu, header ủy quyền, cookie hoặc bí mật khác.
- Đặt chính sách proxy dưới kiểm soát phiên bản và rà soát thay đổi như cấu hình nhạy cảm về bảo mật.

## Các đích nên chặn

Dùng danh sách từ chối này làm điểm khởi đầu cho mọi proxy chuyển tiếp, tường lửa hoặc chính sách đầu ra.

Logic phân loại ở cấp ứng dụng của OpenClaw nằm trong `src/infra/net/ssrf.ts` và `src/shared/net/ip.ts`. Các hook tương ứng liên quan là `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` và xử lý sentinel IPv4 nhúng cho NAT64, 6to4, Teredo, ISATAP và các dạng IPv4-mapped. Những tệp đó là tham chiếu hữu ích khi duy trì chính sách proxy bên ngoài, nhưng OpenClaw không tự động xuất hoặc thực thi các quy tắc đó trong proxy của bạn.

| Dải hoặc máy chủ                                                                      | Vì sao chặn                                          |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Địa chỉ không xác định và địa chỉ mạng này           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Mạng riêng RFC1918                                   |
| `169.254.0.0/16`, `fe80::/10`                                                        | Địa chỉ link-local và các đường metadata đám mây phổ biến |
| `169.254.169.254`, `metadata.google.internal`                                        | Dịch vụ metadata đám mây                             |
| `100.64.0.0/10`                                                                      | Không gian địa chỉ dùng chung của NAT cấp nhà mạng   |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Dải benchmark                                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Dải dùng đặc biệt và tài liệu                        |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 dành riêng                                      |
| `fc00::/7`, `fec0::/10`                                                              | Dải IPv6 cục bộ/riêng                                |
| `100::/64`, `2001:20::/28`                                                           | Dải discard IPv6 và ORCHIDv2                         |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Tiền tố NAT64 với IPv4 nhúng                         |
| `2002::/16`, `2001::/32`                                                             | 6to4 và Teredo với IPv4 nhúng                        |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 tương thích IPv4 và IPv6 ánh xạ IPv4            |

Nếu nhà cung cấp đám mây hoặc nền tảng mạng của bạn tài liệu hóa thêm các máy chủ metadata hoặc dải dành riêng, hãy thêm cả những mục đó.

## Xác thực

Xác thực proxy từ cùng máy chủ, container hoặc tài khoản dịch vụ chạy OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Theo mặc định, khi không cung cấp đích tùy chỉnh, lệnh kiểm tra rằng `https://example.com/` thành công và khởi động một canary loopback tạm thời mà proxy không được truy cập. Kiểm tra bị từ chối mặc định đạt khi proxy trả về phản hồi từ chối không phải 2xx hoặc chặn canary bằng lỗi transport; kiểm tra thất bại nếu một phản hồi thành công tới được canary. Nếu không có proxy nào được bật và cấu hình, xác thực báo cáo vấn đề cấu hình; dùng `--proxy-url` cho một lần kiểm tra trước trước khi thay đổi cấu hình. Dùng `--allowed-url` và `--denied-url` để kiểm tra các kỳ vọng dành riêng cho triển khai. Các đích bị từ chối tùy chỉnh là fail-closed: bất kỳ phản hồi HTTP nào cũng có nghĩa là đích truy cập được qua proxy, và mọi lỗi transport được báo cáo là không kết luận được vì OpenClaw không thể chứng minh proxy đã chặn một origin truy cập được. Khi xác thực thất bại, lệnh thoát với mã 1.

Dùng `--json` cho tự động hóa. Đầu ra JSON chứa kết quả tổng thể, nguồn cấu hình proxy hiệu lực, mọi lỗi cấu hình và từng kiểm tra đích. Thông tin xác thực trong URL proxy được che trong đầu ra văn bản và JSON:

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

Yêu cầu công khai sẽ thành công. Các yêu cầu loopback và metadata sẽ bị proxy chặn. Với `openclaw proxy validate`, canary loopback tích hợp sẵn có thể phân biệt việc proxy từ chối với một origin có thể truy cập. Các kiểm tra `--denied-url` tùy chỉnh không có canary đó, vì vậy hãy xem cả phản hồi HTTP lẫn lỗi vận chuyển mơ hồ là lỗi xác thực, trừ khi proxy của bạn cung cấp tín hiệu từ chối riêng cho triển khai mà bạn có thể xác minh riêng.

Sau đó bật định tuyến proxy OpenClaw:

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

- Proxy cải thiện độ bao phủ cho các client HTTP và WebSocket JavaScript cục bộ trong tiến trình, nhưng đó không phải là sandbox mạng ở cấp hệ điều hành.
- Các socket `net`, `tls`, và `http2` thô, addon native, và tiến trình con có thể bỏ qua định tuyến proxy cấp Node trừ khi chúng kế thừa và tôn trọng các biến môi trường proxy.
- IRC là một kênh TCP/TLS thô nằm ngoài định tuyến proxy chuyển tiếp do operator quản lý. Trong các triển khai yêu cầu mọi lưu lượng đi ra phải đi qua proxy chuyển tiếp đó, hãy đặt `channels.irc.enabled=false` trừ khi lưu lượng IRC đi ra trực tiếp được phê duyệt rõ ràng.
- WebUI cục bộ của người dùng và máy chủ mô hình cục bộ nên được đưa vào danh sách cho phép trong chính sách proxy của operator khi cần; OpenClaw không cung cấp cơ chế bỏ qua mạng cục bộ tổng quát cho chúng.
- Cơ chế bỏ qua proxy cho mặt phẳng điều khiển Gateway được giới hạn có chủ đích ở `localhost` và các URL IP loopback dạng literal. Hãy dùng `ws://127.0.0.1:18789`, `ws://[::1]:18789`, hoặc `ws://localhost:18789` cho các kết nối mặt phẳng điều khiển Gateway trực tiếp cục bộ; các hostname khác được định tuyến như lưu lượng dựa trên hostname thông thường.
- OpenClaw không kiểm tra, thử nghiệm, hay chứng nhận chính sách proxy của bạn.
- Hãy xem các thay đổi chính sách proxy là những thay đổi vận hành nhạy cảm về bảo mật.
