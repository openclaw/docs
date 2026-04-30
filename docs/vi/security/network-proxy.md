---
read_when:
    - Bạn muốn phòng thủ theo chiều sâu trước các cuộc tấn công SSRF và DNS rebinding
    - Cấu hình proxy chuyển tiếp bên ngoài cho lưu lượng thời gian chạy của OpenClaw
summary: Cách định tuyến lưu lượng HTTP và WebSocket trong thời gian chạy của OpenClaw qua một máy chủ proxy lọc do người vận hành quản lý
title: Proxy mạng
x-i18n:
    generated_at: "2026-04-30T00:07:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy mạng

OpenClaw có thể định tuyến lưu lượng HTTP và WebSocket khi chạy qua một forward proxy do operator quản lý. Đây là lớp phòng thủ chiều sâu tùy chọn cho các triển khai muốn kiểm soát egress tập trung, bảo vệ SSRF mạnh hơn và khả năng kiểm toán mạng tốt hơn.

OpenClaw không phát hành kèm, tải xuống, khởi động, cấu hình hoặc chứng nhận proxy. Bạn vận hành công nghệ proxy phù hợp với môi trường của mình, và OpenClaw định tuyến các client HTTP và WebSocket cục bộ theo tiến trình thông thường qua proxy đó.

## Vì sao dùng proxy?

Proxy cung cấp cho operator một điểm kiểm soát mạng duy nhất cho lưu lượng HTTP và WebSocket đi ra. Điều đó có thể hữu ích ngay cả ngoài việc tăng cường chống SSRF:

- Chính sách tập trung: duy trì một chính sách egress thay vì phụ thuộc vào mọi điểm gọi HTTP của ứng dụng để áp dụng đúng quy tắc mạng.
- Kiểm tra tại thời điểm kết nối: đánh giá đích sau khi phân giải DNS và ngay trước khi proxy mở kết nối upstream.
- Phòng thủ DNS rebinding: giảm khoảng cách giữa bước kiểm tra DNS ở cấp ứng dụng và kết nối đi ra thực tế.
- Phạm vi JavaScript rộng hơn: định tuyến các client thông thường như `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch và tương tự qua cùng một đường đi.
- Khả năng kiểm toán: ghi nhật ký các đích được cho phép và bị từ chối tại ranh giới egress.
- Kiểm soát vận hành: thực thi quy tắc đích, phân đoạn mạng, giới hạn tốc độ hoặc allowlist đi ra mà không cần dựng lại OpenClaw.

Định tuyến proxy là một rào chắn cấp tiến trình cho egress HTTP và WebSocket thông thường. Nó cung cấp cho operator một đường dẫn fail-closed để định tuyến các client HTTP JavaScript được hỗ trợ qua proxy lọc riêng của họ, nhưng đây không phải sandbox mạng cấp hệ điều hành và không khiến OpenClaw chứng nhận chính sách đích của proxy.

## Cách OpenClaw định tuyến lưu lượng

Khi `proxy.enabled=true` và URL proxy được cấu hình, các tiến trình runtime được bảo vệ như `openclaw gateway run`, `openclaw node run` và `openclaw agent --local` định tuyến egress HTTP và WebSocket thông thường qua proxy đã cấu hình:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Hợp đồng công khai là hành vi định tuyến, không phải các hook Node nội bộ dùng để triển khai. Các client WebSocket thuộc control-plane của OpenClaw Gateway dùng một đường trực tiếp hẹp cho lưu lượng RPC Gateway local loopback khi URL Gateway dùng `localhost` hoặc IP loopback dạng literal như `127.0.0.1` hoặc `[::1]`. Đường control-plane đó phải có thể truy cập các Gateway loopback ngay cả khi proxy của operator chặn các đích loopback. Các yêu cầu HTTP và WebSocket runtime thông thường vẫn dùng proxy đã cấu hình.

Bên trong, OpenClaw dùng hai hook định tuyến cấp tiến trình cho tính năng này:

- Định tuyến dispatcher của Undici bao phủ `fetch`, các client dựa trên undici và các transport cung cấp dispatcher undici riêng.
- Định tuyến `global-agent` bao phủ các caller Node core `node:http` và `node:https`, bao gồm nhiều thư viện được xây trên `http.request`, `https.request`, `http.get` và `https.get`. Chế độ proxy được quản lý buộc dùng global agent đó để các agent HTTP Node rõ ràng không vô tình đi vòng qua proxy của operator.

Một số plugin sở hữu transport tùy chỉnh cần nối dây proxy rõ ràng ngay cả khi đã có định tuyến cấp tiến trình. Ví dụ, transport Bot API của Telegram dùng dispatcher undici HTTP/1 riêng và vì vậy tôn trọng env proxy của tiến trình cùng fallback `OPENCLAW_PROXY_URL` được quản lý trong đường transport thuộc owner cụ thể đó.

Bản thân URL proxy phải dùng `http://`. Các đích HTTPS vẫn được hỗ trợ qua proxy bằng HTTP `CONNECT`; điều này chỉ có nghĩa là OpenClaw kỳ vọng một listener forward-proxy HTTP thuần như `http://127.0.0.1:3128`.

Khi proxy đang hoạt động, OpenClaw xóa `no_proxy`, `NO_PROXY` và `GLOBAL_AGENT_NO_PROXY`. Các danh sách bypass đó dựa trên đích, nên nếu để `localhost` hoặc `127.0.0.1` trong đó thì các mục tiêu SSRF rủi ro cao có thể bỏ qua proxy lọc.

Khi tắt, OpenClaw khôi phục môi trường proxy trước đó và đặt lại trạng thái định tuyến tiến trình đã cache.

## Các thuật ngữ proxy liên quan

- `proxy.enabled` / `proxy.proxyUrl`: định tuyến forward-proxy đi ra cho egress runtime của OpenClaw. Trang này ghi lại tính năng đó.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse-proxy nhận biết danh tính đi vào cho quyền truy cập Gateway. Xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy gỡ lỗi cục bộ và công cụ kiểm tra capture cho phát triển và hỗ trợ. Xem [openclaw proxy](/vi/cli/proxy).
- Cài đặt proxy dành riêng cho channel hoặc provider: các ghi đè thuộc owner cụ thể cho một transport nhất định. Ưu tiên proxy mạng được quản lý khi mục tiêu là kiểm soát egress tập trung trên toàn runtime.

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

Nếu `enabled=true` nhưng không có URL proxy hợp lệ được cấu hình, các lệnh được bảo vệ sẽ lỗi khi khởi động thay vì rơi về truy cập mạng trực tiếp.

Đối với dịch vụ gateway được quản lý khởi động bằng `openclaw gateway start`, nên lưu URL trong cấu hình:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback môi trường phù hợp nhất cho các lần chạy foreground. Nếu bạn dùng nó với một dịch vụ đã cài đặt, hãy đặt `OPENCLAW_PROXY_URL` trong môi trường bền vững của dịch vụ, chẳng hạn `$OPENCLAW_STATE_DIR/.env` hoặc `~/.openclaw/.env`, rồi cài đặt lại dịch vụ để launchd, systemd hoặc Scheduled Tasks khởi động gateway với giá trị đó.

Đối với các lệnh `openclaw --container ...`, OpenClaw chuyển tiếp `OPENCLAW_PROXY_URL` vào CLI con nhắm đến container khi biến này được đặt. URL phải truy cập được từ bên trong container; `127.0.0.1` trỏ đến chính container, không phải host. OpenClaw từ chối các URL proxy loopback cho lệnh nhắm đến container trừ khi bạn ghi đè rõ ràng kiểm tra an toàn đó.

## Yêu cầu proxy

Chính sách proxy là ranh giới bảo mật. OpenClaw không thể xác minh rằng proxy chặn đúng mục tiêu.

Cấu hình proxy để:

- Chỉ bind vào loopback hoặc một interface riêng tư tin cậy.
- Hạn chế truy cập để chỉ tiến trình, host, container hoặc tài khoản dịch vụ OpenClaw có thể dùng nó.
- Tự phân giải đích và chặn IP đích sau khi phân giải DNS.
- Áp dụng chính sách tại thời điểm kết nối cho cả yêu cầu HTTP thuần và tunnel HTTPS `CONNECT`.
- Từ chối các bypass dựa trên đích cho loopback, private, link-local, metadata, multicast, reserved hoặc các dải documentation.
- Tránh allowlist hostname trừ khi bạn hoàn toàn tin cậy đường phân giải DNS.
- Ghi nhật ký đích, quyết định, trạng thái và lý do mà không ghi body yêu cầu, header authorization, cookie hoặc bí mật khác.
- Đưa chính sách proxy vào hệ thống quản lý phiên bản và review thay đổi như cấu hình nhạy cảm về bảo mật.

## Các đích bị chặn được khuyến nghị

Dùng denylist này làm điểm bắt đầu cho bất kỳ forward proxy, firewall hoặc chính sách egress nào.

Logic phân loại cấp ứng dụng của OpenClaw nằm trong `src/infra/net/ssrf.ts` và `src/shared/net/ip.ts`. Các hook parity liên quan là `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` và xử lý sentinel IPv4 nhúng cho NAT64, 6to4, Teredo, ISATAP và các dạng IPv4-mapped. Những file đó là tham chiếu hữu ích khi duy trì chính sách proxy bên ngoài, nhưng OpenClaw không tự động xuất hoặc thực thi các quy tắc đó trong proxy của bạn.

| Dải hoặc host                                                                        | Lý do chặn                                            |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                         |
| `::1/128`                                                                            | IPv6 loopback                                         |
| `0.0.0.0/8`, `::/128`                                                                | Địa chỉ unspecified và this-network                   |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Mạng riêng RFC1918                                    |
| `169.254.0.0/16`, `fe80::/10`                                                        | Địa chỉ link-local và các đường metadata cloud phổ biến |
| `169.254.169.254`, `metadata.google.internal`                                        | Dịch vụ metadata cloud                                |
| `100.64.0.0/10`                                                                      | Không gian địa chỉ chia sẻ carrier-grade NAT          |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Dải benchmark                                         |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Dải special-use và documentation                      |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                             |
| `240.0.0.0/4`                                                                        | IPv4 reserved                                         |
| `fc00::/7`, `fec0::/10`                                                              | Dải IPv6 cục bộ/riêng tư                              |
| `100::/64`, `2001:20::/28`                                                           | Dải IPv6 discard và ORCHIDv2                          |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Tiền tố NAT64 có IPv4 nhúng                           |
| `2002::/16`, `2001::/32`                                                             | 6to4 và Teredo có IPv4 nhúng                          |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 tương thích IPv4 và IPv6 IPv4-mapped             |

Nếu nhà cung cấp cloud hoặc nền tảng mạng của bạn ghi lại thêm host metadata hoặc dải reserved, hãy thêm cả những mục đó.

## Xác thực

Xác thực proxy từ cùng host, container hoặc tài khoản dịch vụ chạy OpenClaw:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Yêu cầu công khai nên thành công. Các yêu cầu loopback và metadata nên thất bại tại proxy.

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

- Proxy cải thiện phạm vi bao phủ cho các client HTTP và WebSocket JavaScript cục bộ theo tiến trình, nhưng đây không phải sandbox mạng cấp hệ điều hành.
- Socket thô `net`, `tls` và `http2`, native addon và tiến trình con có thể đi vòng qua định tuyến proxy cấp Node trừ khi chúng kế thừa và tôn trọng biến môi trường proxy.
- WebUI cục bộ của người dùng và máy chủ model cục bộ nên được allowlist trong chính sách proxy của operator khi cần; OpenClaw không cung cấp bypass mạng cục bộ chung cho chúng.
- Bypass proxy của control-plane Gateway được cố ý giới hạn ở URL `localhost` và IP loopback dạng literal. Dùng `ws://127.0.0.1:18789`, `ws://[::1]:18789` hoặc `ws://localhost:18789` cho các kết nối control-plane Gateway trực tiếp cục bộ; các hostname khác định tuyến như lưu lượng dựa trên hostname thông thường.
- OpenClaw không kiểm tra, thử nghiệm hoặc chứng nhận chính sách proxy của bạn.
- Xem các thay đổi chính sách proxy là thay đổi vận hành nhạy cảm về bảo mật.
