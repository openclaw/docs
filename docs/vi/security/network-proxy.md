---
read_when:
    - Bạn muốn phòng thủ theo chiều sâu trước các cuộc tấn công SSRF và DNS rebinding
    - Cấu hình proxy chuyển tiếp bên ngoài cho lưu lượng thời gian chạy của OpenClaw
summary: Cách định tuyến lưu lượng HTTP và WebSocket của môi trường chạy OpenClaw qua proxy lọc do người vận hành quản lý
title: Proxy mạng
x-i18n:
    generated_at: "2026-05-04T07:06:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7140c5ced0e7454a6f85d1ea8f3256bbd28cc0cb42eeafe8e5e6439b90e3f0
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy mạng

OpenClaw có thể định tuyến lưu lượng HTTP và WebSocket khi chạy qua một proxy chuyển tiếp do operator quản lý. Đây là lớp phòng thủ bổ sung tùy chọn cho các triển khai muốn kiểm soát egress tập trung, bảo vệ SSRF mạnh hơn và khả năng kiểm toán mạng tốt hơn.

OpenClaw không đóng gói, tải xuống, khởi động, cấu hình hoặc chứng nhận proxy. Bạn chạy công nghệ proxy phù hợp với môi trường của mình, và OpenClaw định tuyến các client HTTP và WebSocket cục bộ theo tiến trình thông thường qua proxy đó.

## Vì sao nên dùng proxy?

Proxy cung cấp cho operator một điểm kiểm soát mạng duy nhất cho lưu lượng HTTP và WebSocket đi ra. Điều đó có thể hữu ích ngay cả ngoài việc tăng cường chống SSRF:

- Chính sách tập trung: duy trì một chính sách egress thay vì phụ thuộc vào từng điểm gọi HTTP của ứng dụng để áp dụng đúng quy tắc mạng.
- Kiểm tra tại thời điểm kết nối: đánh giá đích sau khi phân giải DNS và ngay trước khi proxy mở kết nối upstream.
- Phòng thủ DNS rebinding: giảm khoảng cách giữa kiểm tra DNS ở cấp ứng dụng và kết nối đi ra thực tế.
- Phạm vi bao phủ JavaScript rộng hơn: định tuyến các client thông thường như `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch và các client tương tự qua cùng một đường đi.
- Khả năng kiểm toán: ghi nhật ký các đích được cho phép và bị từ chối tại ranh giới egress.
- Kiểm soát vận hành: thực thi quy tắc đích, phân đoạn mạng, giới hạn tốc độ hoặc allowlist outbound mà không cần build lại OpenClaw.

Định tuyến proxy là một rào chắn cấp tiến trình cho egress HTTP và WebSocket thông thường. Nó cung cấp cho operator một đường đi đóng khi lỗi để định tuyến các client HTTP JavaScript được hỗ trợ qua proxy lọc của riêng họ, nhưng đây không phải sandbox mạng cấp hệ điều hành và không khiến OpenClaw chứng nhận chính sách đích của proxy.

## Cách OpenClaw định tuyến lưu lượng

Khi `proxy.enabled=true` và một URL proxy được cấu hình, các tiến trình runtime được bảo vệ như `openclaw gateway run`, `openclaw node run` và `openclaw agent --local` định tuyến egress HTTP và WebSocket thông thường qua proxy đã cấu hình:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Hợp đồng công khai là hành vi định tuyến, không phải các hook nội bộ của Node được dùng để triển khai nó. Các client WebSocket của mặt phẳng điều khiển OpenClaw Gateway dùng một đường trực tiếp hẹp cho lưu lượng RPC Gateway qua local loopback khi URL Gateway dùng `localhost` hoặc IP loopback dạng chữ như `127.0.0.1` hoặc `[::1]`. Đường mặt phẳng điều khiển đó phải có thể truy cập các Gateway loopback ngay cả khi proxy của operator chặn các đích loopback. Các yêu cầu HTTP và WebSocket runtime thông thường vẫn dùng proxy đã cấu hình.

Ở bên trong, OpenClaw dùng hai hook định tuyến cấp tiến trình cho tính năng này:

- Định tuyến dispatcher của Undici bao phủ `fetch`, các client dựa trên undici và các transport cung cấp dispatcher undici riêng.
- Định tuyến `global-agent` bao phủ các caller Node core `node:http` và `node:https`, bao gồm nhiều thư viện được xây trên `http.request`, `https.request`, `http.get` và `https.get`. Chế độ proxy được quản lý ép dùng global agent đó để các agent HTTP Node rõ ràng không vô tình bỏ qua proxy của operator.

Một số Plugin sở hữu transport tùy chỉnh cần nối dây proxy rõ ràng ngay cả khi đã có định tuyến cấp tiến trình. Ví dụ, transport Bot API của Telegram dùng dispatcher undici HTTP/1 riêng và vì vậy tôn trọng env proxy của tiến trình cùng fallback `OPENCLAW_PROXY_URL` được quản lý trong đường transport dành riêng cho chủ sở hữu đó.

Bản thân URL proxy phải dùng `http://`. Các đích HTTPS vẫn được hỗ trợ qua proxy bằng HTTP `CONNECT`; điều này chỉ có nghĩa là OpenClaw kỳ vọng một listener proxy chuyển tiếp HTTP thuần như `http://127.0.0.1:3128`.

Khi proxy đang hoạt động, OpenClaw xóa `no_proxy`, `NO_PROXY` và `GLOBAL_AGENT_NO_PROXY`. Các danh sách bỏ qua đó dựa trên đích, vì vậy để `localhost` hoặc `127.0.0.1` trong đó sẽ cho phép các mục tiêu SSRF rủi ro cao bỏ qua proxy lọc.

Khi tắt, OpenClaw khôi phục môi trường proxy trước đó và đặt lại trạng thái định tuyến tiến trình đã lưu cache.

## Các thuật ngữ proxy liên quan

- `proxy.enabled` / `proxy.proxyUrl`: định tuyến proxy chuyển tiếp outbound cho egress runtime của OpenClaw. Trang này ghi lại tính năng đó.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse proxy nhận biết danh tính inbound cho quyền truy cập Gateway. Xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy gỡ lỗi cục bộ và trình kiểm tra capture cho phát triển và hỗ trợ. Xem [openclaw proxy](/vi/cli/proxy).
- Cài đặt proxy dành riêng cho channel hoặc provider: các override dành riêng cho chủ sở hữu đối với một transport cụ thể. Ưu tiên proxy mạng được quản lý khi mục tiêu là kiểm soát egress tập trung trên toàn runtime.

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

Fallback môi trường phù hợp nhất cho các lần chạy foreground. Nếu bạn dùng nó với một dịch vụ đã cài đặt, hãy đặt `OPENCLAW_PROXY_URL` trong môi trường bền vững của dịch vụ, chẳng hạn như `$OPENCLAW_STATE_DIR/.env` hoặc `~/.openclaw/.env`, rồi cài đặt lại dịch vụ để launchd, systemd hoặc Scheduled Tasks khởi động gateway với giá trị đó.

Đối với các lệnh `openclaw --container ...`, OpenClaw chuyển tiếp `OPENCLAW_PROXY_URL` vào CLI con nhắm tới container khi biến này được đặt. URL phải truy cập được từ bên trong container; `127.0.0.1` trỏ tới chính container, không phải host. OpenClaw từ chối các URL proxy loopback cho lệnh nhắm tới container trừ khi bạn override rõ ràng kiểm tra an toàn đó.

## Yêu cầu proxy

Chính sách proxy là ranh giới bảo mật. OpenClaw không thể xác minh rằng proxy chặn đúng mục tiêu.

Cấu hình proxy để:

- Chỉ bind vào loopback hoặc một interface riêng tư đáng tin cậy.
- Hạn chế truy cập để chỉ tiến trình, host, container hoặc tài khoản dịch vụ OpenClaw có thể dùng nó.
- Tự phân giải đích và chặn IP đích sau khi phân giải DNS.
- Áp dụng chính sách tại thời điểm kết nối cho cả yêu cầu HTTP thuần và tunnel HTTPS `CONNECT`.
- Từ chối các bypass dựa trên đích cho loopback, private, link-local, metadata, multicast, reserved hoặc các dải documentation.
- Tránh allowlist hostname trừ khi bạn hoàn toàn tin tưởng đường phân giải DNS.
- Ghi nhật ký đích, quyết định, trạng thái và lý do mà không ghi thân yêu cầu, header ủy quyền, cookie hoặc bí mật khác.
- Đưa chính sách proxy vào quản lý phiên bản và review các thay đổi như cấu hình nhạy cảm về bảo mật.

## Các đích bị chặn được khuyến nghị

Dùng denylist này làm điểm bắt đầu cho bất kỳ proxy chuyển tiếp, tường lửa hoặc chính sách egress nào.

Logic phân loại cấp ứng dụng của OpenClaw nằm trong `src/infra/net/ssrf.ts` và `src/shared/net/ip.ts`. Các hook tương đương liên quan là `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` và xử lý sentinel IPv4 nhúng cho NAT64, 6to4, Teredo, ISATAP và các dạng IPv4-mapped. Các tệp đó là tham chiếu hữu ích khi bảo trì chính sách proxy bên ngoài, nhưng OpenClaw không tự động xuất hoặc thực thi các quy tắc đó trong proxy của bạn.

| Dải hoặc host                                                                        | Lý do chặn                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Địa chỉ không xác định và địa chỉ mạng này           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Mạng riêng RFC1918                                   |
| `169.254.0.0/16`, `fe80::/10`                                                        | Địa chỉ link-local và đường metadata cloud phổ biến  |
| `169.254.169.254`, `metadata.google.internal`                                        | Dịch vụ metadata cloud                               |
| `100.64.0.0/10`                                                                      | Không gian địa chỉ dùng chung của carrier-grade NAT  |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Dải benchmarking                                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Dải special-use và documentation                     |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 reserved                                        |
| `fc00::/7`, `fec0::/10`                                                              | Dải IPv6 cục bộ/riêng                                |
| `100::/64`, `2001:20::/28`                                                           | Dải IPv6 discard và ORCHIDv2                         |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Tiền tố NAT64 với IPv4 nhúng                         |
| `2002::/16`, `2001::/32`                                                             | 6to4 và Teredo với IPv4 nhúng                        |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 tương thích IPv4 và IPv6 IPv4-mapped            |

Nếu nhà cung cấp cloud hoặc nền tảng mạng của bạn ghi lại thêm host metadata hoặc dải reserved, hãy thêm cả các mục đó.

## Xác thực

Xác thực proxy từ cùng host, container hoặc tài khoản dịch vụ chạy OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Theo mặc định, khi không cung cấp đích tùy chỉnh, lệnh kiểm tra rằng `https://example.com/` thành công và khởi động một canary loopback tạm thời mà proxy không được phép truy cập. Kiểm tra bị từ chối mặc định đạt khi proxy trả về phản hồi từ chối không phải 2xx hoặc chặn canary bằng lỗi transport; kiểm tra thất bại nếu một phản hồi thành công tới được canary. Nếu không có proxy nào được bật và cấu hình, xác thực báo cáo vấn đề cấu hình; dùng `--proxy-url` cho một preflight một lần trước khi thay đổi cấu hình. Dùng `--allowed-url` và `--denied-url` để kiểm tra các kỳ vọng dành riêng cho triển khai. Các đích bị từ chối tùy chỉnh là fail-closed: bất kỳ phản hồi HTTP nào cũng có nghĩa là đích đã truy cập được qua proxy, và mọi lỗi transport được báo cáo là không kết luận được vì OpenClaw không thể chứng minh proxy đã chặn một origin có thể truy cập. Khi xác thực thất bại, lệnh thoát với mã 1.

Dùng `--json` cho tự động hóa. Đầu ra JSON chứa kết quả tổng thể, nguồn cấu hình proxy hiệu lực, mọi lỗi cấu hình và từng kiểm tra đích. Thông tin đăng nhập trong URL proxy được biên tập trong đầu ra văn bản và JSON:

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

Yêu cầu công khai sẽ thành công. Các yêu cầu loopback và metadata sẽ bị proxy chặn. Với `openclaw proxy validate`, canary loopback tích hợp có thể phân biệt việc proxy từ chối với một origin có thể truy cập. Các kiểm tra `--denied-url` tùy chỉnh không có canary đó, vì vậy hãy xem cả phản hồi HTTP lẫn lỗi truyền tải không rõ ràng là lỗi xác thực, trừ khi proxy của bạn cung cấp một tín hiệu từ chối riêng cho triển khai mà bạn có thể xác minh riêng.

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

- Proxy cải thiện phạm vi bao phủ cho các client HTTP và WebSocket JavaScript cục bộ trong tiến trình, nhưng đây không phải là sandbox mạng cấp hệ điều hành.
- Các socket `net`, `tls` và `http2` thô, addon native và tiến trình con có thể bỏ qua định tuyến proxy cấp Node, trừ khi chúng kế thừa và tuân thủ các biến môi trường proxy.
- IRC là kênh TCP/TLS thô nằm ngoài định tuyến forward proxy do operator quản lý. Trong các triển khai yêu cầu mọi lưu lượng đi ra đều đi qua forward proxy đó, hãy đặt `channels.irc.enabled=false` trừ khi lưu lượng IRC đi ra trực tiếp được phê duyệt rõ ràng.
- Proxy gỡ lỗi cục bộ là công cụ chẩn đoán, và việc chuyển tiếp upstream trực tiếp của nó cho các yêu cầu proxy và đường hầm CONNECT bị tắt theo mặc định khi chế độ proxy được quản lý đang hoạt động; chỉ bật chuyển tiếp trực tiếp cho các chẩn đoán cục bộ đã được phê duyệt.
- WebUI cục bộ của người dùng và máy chủ mô hình cục bộ nên được đưa vào allowlist trong chính sách proxy của operator khi cần; OpenClaw không cung cấp cơ chế bỏ qua mạng cục bộ chung cho chúng.
- Việc bỏ qua proxy cho mặt phẳng điều khiển Gateway được chủ ý giới hạn ở `localhost` và các URL IP loopback dạng literal. Sử dụng `ws://127.0.0.1:18789`, `ws://[::1]:18789` hoặc `ws://localhost:18789` cho các kết nối mặt phẳng điều khiển Gateway trực tiếp cục bộ; các tên máy chủ khác được định tuyến như lưu lượng dựa trên tên máy chủ thông thường.
- OpenClaw không kiểm tra, thử nghiệm hoặc chứng nhận chính sách proxy của bạn.
- Hãy xem các thay đổi chính sách proxy là thay đổi vận hành nhạy cảm về bảo mật.
