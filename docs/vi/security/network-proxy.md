---
read_when:
    - Bạn muốn phòng thủ theo chiều sâu trước các cuộc tấn công SSRF và tái liên kết DNS
    - Cấu hình proxy chuyển tiếp bên ngoài cho lưu lượng thời gian chạy của OpenClaw
summary: Cách định tuyến lưu lượng HTTP và WebSocket trong thời gian chạy của OpenClaw qua một máy chủ proxy lọc do người vận hành quản lý
title: Proxy mạng
x-i18n:
    generated_at: "2026-05-06T09:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d733c690b5f86ef62fe7a35d38fbfcd07910970bca12ca6f74fdb26c8ec4557b
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy mạng

OpenClaw có thể định tuyến lưu lượng HTTP và WebSocket khi chạy qua một proxy chuyển tiếp do người vận hành quản lý. Đây là lớp phòng thủ chiều sâu tùy chọn cho các triển khai muốn kiểm soát đầu ra tập trung, tăng cường bảo vệ SSRF và cải thiện khả năng kiểm toán mạng.

OpenClaw không phát hành kèm, tải xuống, khởi động, cấu hình hoặc chứng nhận proxy. Bạn chạy công nghệ proxy phù hợp với môi trường của mình, còn OpenClaw định tuyến các client HTTP và WebSocket cục bộ theo tiến trình thông thường qua proxy đó.

## Vì sao nên dùng proxy?

Proxy cung cấp cho người vận hành một điểm kiểm soát mạng duy nhất cho lưu lượng HTTP và WebSocket đi ra. Điều đó có thể hữu ích ngay cả ngoài việc củng cố chống SSRF:

- Chính sách tập trung: duy trì một chính sách đầu ra thay vì dựa vào từng điểm gọi HTTP của ứng dụng để thiết lập đúng quy tắc mạng.
- Kiểm tra tại thời điểm kết nối: đánh giá đích sau khi phân giải DNS và ngay trước khi proxy mở kết nối lên upstream.
- Phòng vệ DNS rebinding: giảm khoảng cách giữa kiểm tra DNS ở cấp ứng dụng và kết nối đi ra thực tế.
- Phạm vi bao phủ JavaScript rộng hơn: định tuyến các client thông thường như `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch và các client tương tự qua cùng một đường đi.
- Khả năng kiểm toán: ghi nhật ký các đích được phép và bị từ chối tại ranh giới đầu ra.
- Kiểm soát vận hành: thực thi quy tắc đích, phân đoạn mạng, giới hạn tốc độ hoặc danh sách cho phép đầu ra mà không cần dựng lại OpenClaw.

Định tuyến proxy là một rào chắn cấp tiến trình cho đầu ra HTTP và WebSocket thông thường. Nó cung cấp cho người vận hành một đường dẫn đóng khi lỗi để định tuyến các client HTTP JavaScript được hỗ trợ qua proxy lọc riêng của họ, nhưng đây không phải là sandbox mạng cấp hệ điều hành và không khiến OpenClaw chứng nhận chính sách đích của proxy.

## Cách OpenClaw định tuyến lưu lượng

Khi `proxy.enabled=true` và URL proxy được cấu hình, các tiến trình runtime được bảo vệ như `openclaw gateway run`, `openclaw node run` và `openclaw agent --local` định tuyến đầu ra HTTP và WebSocket thông thường qua proxy đã cấu hình:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Hợp đồng công khai là hành vi định tuyến, không phải các hook nội bộ của Node được dùng để triển khai. Các client WebSocket thuộc mặt phẳng điều khiển của OpenClaw Gateway dùng một đường dẫn trực tiếp hẹp cho lưu lượng RPC Gateway qua local loopback khi URL Gateway dùng `localhost` hoặc một IP loopback dạng literal như `127.0.0.1` hoặc `[::1]`. Đường dẫn mặt phẳng điều khiển đó phải có khả năng truy cập các Gateway loopback ngay cả khi proxy của người vận hành chặn các đích loopback. Các yêu cầu HTTP và WebSocket runtime thông thường vẫn dùng proxy đã cấu hình.

Bên trong, OpenClaw dùng hai hook định tuyến cấp tiến trình cho tính năng này:

- Định tuyến dispatcher của Undici bao phủ `fetch`, các client dựa trên undici và các transport cung cấp dispatcher undici riêng.
- Định tuyến `global-agent` bao phủ các caller Node core `node:http` và `node:https`, bao gồm nhiều thư viện được xây trên `http.request`, `https.request`, `http.get` và `https.get`. Chế độ proxy được quản lý buộc dùng global agent đó để các agent HTTP Node rõ ràng không vô tình đi vòng qua proxy của người vận hành.

Một số plugin sở hữu transport tùy chỉnh cần nối dây proxy rõ ràng ngay cả khi đã có định tuyến cấp tiến trình. Ví dụ, transport Bot API của Telegram dùng dispatcher undici HTTP/1 riêng và do đó tôn trọng env proxy của tiến trình cùng fallback `OPENCLAW_PROXY_URL` được quản lý trong đường dẫn transport do chủ sở hữu đó kiểm soát.

Bản thân URL proxy phải dùng `http://`. Các đích HTTPS vẫn được hỗ trợ qua proxy bằng HTTP `CONNECT`; điều này chỉ có nghĩa là OpenClaw kỳ vọng một listener proxy chuyển tiếp HTTP thuần như `http://127.0.0.1:3128`.

Khi proxy đang hoạt động, OpenClaw xóa `no_proxy`, `NO_PROXY` và `GLOBAL_AGENT_NO_PROXY`. Các danh sách bỏ qua đó dựa trên đích, nên nếu để `localhost` hoặc `127.0.0.1` trong đó thì các mục tiêu SSRF rủi ro cao có thể bỏ qua proxy lọc.

Khi tắt, OpenClaw khôi phục môi trường proxy trước đó và đặt lại trạng thái định tuyến tiến trình đã lưu trong bộ nhớ đệm.

## Các thuật ngữ proxy liên quan

- `proxy.enabled` / `proxy.proxyUrl`: định tuyến proxy chuyển tiếp đầu ra cho đầu ra runtime của OpenClaw. Trang này ghi lại tính năng đó.
- `gateway.auth.mode: "trusted-proxy"`: xác thực proxy ngược có nhận biết danh tính cho truy cập Gateway. Xem [xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy gỡ lỗi cục bộ và trình kiểm tra capture cho phát triển và hỗ trợ. Xem [openclaw proxy](/vi/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: tùy chọn bật cho `web_fetch` để cho phép proxy env HTTP(S) do người vận hành kiểm soát phân giải DNS trong khi vẫn giữ chính sách hostname và ghim DNS nghiêm ngặt mặc định. Xem [Web fetch](/vi/tools/web-fetch#trusted-env-proxy).
- Cài đặt proxy riêng theo kênh hoặc provider: các override do chủ sở hữu kiểm soát cho một transport cụ thể. Ưu tiên proxy mạng được quản lý khi mục tiêu là kiểm soát đầu ra tập trung trên toàn runtime.

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

### Chế độ loopback của Gateway

Các client mặt phẳng điều khiển Gateway cục bộ thường kết nối tới WebSocket loopback như `ws://127.0.0.1:18789`. Dùng `proxy.loopbackMode` để chọn cách lưu lượng đó hoạt động khi proxy được quản lý đang bật:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (mặc định): OpenClaw đăng ký authority loopback của Gateway trong bộ điều khiển `NO_PROXY` của `global-agent` đang hoạt động để lưu lượng WebSocket Gateway cục bộ có thể kết nối trực tiếp. Các cổng Gateway loopback tùy chỉnh hoạt động vì host và cổng của URL Gateway đang hoạt động được đăng ký.
- `proxy`: OpenClaw không đăng ký authority `NO_PROXY` loopback của Gateway, nên lưu lượng Gateway cục bộ được gửi qua proxy được quản lý. Nếu proxy ở xa, nó phải cung cấp định tuyến đặc biệt cho dịch vụ loopback của host OpenClaw, chẳng hạn ánh xạ dịch vụ đó sang hostname, IP hoặc tunnel mà proxy có thể truy cập. Các proxy từ xa tiêu chuẩn phân giải `127.0.0.1` và `localhost` từ host proxy, không phải từ host OpenClaw.
- `block`: OpenClaw từ chối các kết nối mặt phẳng điều khiển Gateway loopback trước khi mở socket.

Nếu `enabled=true` nhưng không có URL proxy hợp lệ được cấu hình, các lệnh được bảo vệ sẽ lỗi khi khởi động thay vì rơi về truy cập mạng trực tiếp.

Với các dịch vụ gateway được quản lý khởi động bằng `openclaw gateway start`, nên lưu URL trong cấu hình:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback môi trường phù hợp nhất cho các lần chạy foreground. Nếu bạn dùng nó với một dịch vụ đã cài đặt, đặt `OPENCLAW_PROXY_URL` trong môi trường bền vững của dịch vụ, chẳng hạn `$OPENCLAW_STATE_DIR/.env` hoặc `~/.openclaw/.env`, rồi cài đặt lại dịch vụ để launchd, systemd hoặc Scheduled Tasks khởi động gateway với giá trị đó.

Với các lệnh `openclaw --container ...`, OpenClaw chuyển tiếp `OPENCLAW_PROXY_URL` vào CLI con nhắm tới container khi biến này được đặt. URL phải truy cập được từ bên trong container; `127.0.0.1` trỏ tới chính container, không phải host. OpenClaw từ chối URL proxy loopback cho các lệnh nhắm tới container trừ khi bạn override rõ ràng kiểm tra an toàn đó.

## Yêu cầu đối với proxy

Chính sách proxy là ranh giới bảo mật. OpenClaw không thể xác minh rằng proxy chặn đúng các mục tiêu.

Cấu hình proxy để:

- Chỉ bind vào loopback hoặc một giao diện riêng tư đáng tin cậy.
- Hạn chế truy cập để chỉ tiến trình, host, container hoặc tài khoản dịch vụ của OpenClaw có thể dùng proxy.
- Tự phân giải đích và chặn IP đích sau khi phân giải DNS.
- Áp dụng chính sách tại thời điểm kết nối cho cả yêu cầu HTTP thuần và tunnel HTTPS `CONNECT`.
- Từ chối các cơ chế bỏ qua dựa trên đích đối với loopback, private, link-local, metadata, multicast, reserved hoặc các dải documentation.
- Tránh danh sách cho phép hostname trừ khi bạn hoàn toàn tin tưởng đường dẫn phân giải DNS.
- Ghi nhật ký đích, quyết định, trạng thái và lý do mà không ghi body yêu cầu, header ủy quyền, cookie hoặc bí mật khác.
- Đưa chính sách proxy vào kiểm soát phiên bản và rà soát thay đổi như cấu hình nhạy cảm về bảo mật.

## Các đích bị chặn được khuyến nghị

Dùng danh sách từ chối này làm điểm khởi đầu cho bất kỳ proxy chuyển tiếp, tường lửa hoặc chính sách đầu ra nào.

Logic phân loại cấp ứng dụng của OpenClaw nằm trong `src/infra/net/ssrf.ts` và `src/shared/net/ip.ts`. Các hook tương đương liên quan là `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` và phần xử lý sentinel IPv4 nhúng cho NAT64, 6to4, Teredo, ISATAP và các dạng IPv4-mapped. Những tệp đó là tham chiếu hữu ích khi duy trì chính sách proxy bên ngoài, nhưng OpenClaw không tự động xuất hoặc thực thi các quy tắc đó trong proxy của bạn.

| Dải hoặc host                                                                        | Lý do chặn                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Địa chỉ không xác định và địa chỉ mạng này           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Mạng private RFC1918                                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | Địa chỉ link-local và các đường dẫn metadata đám mây phổ biến |
| `169.254.169.254`, `metadata.google.internal`                                        | Dịch vụ metadata đám mây                             |
| `100.64.0.0/10`                                                                      | Không gian địa chỉ chia sẻ NAT cấp nhà mạng          |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Dải benchmarking                                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Dải special-use và documentation                     |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 dành riêng                                      |
| `fc00::/7`, `fec0::/10`                                                              | Dải IPv6 local/private                               |
| `100::/64`, `2001:20::/28`                                                           | Dải IPv6 discard và ORCHIDv2                         |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Tiền tố NAT64 có IPv4 nhúng                          |
| `2002::/16`, `2001::/32`                                                             | 6to4 và Teredo có IPv4 nhúng                         |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 tương thích IPv4 và IPv6 ánh xạ IPv4            |

Nếu nhà cung cấp đám mây hoặc nền tảng mạng của bạn ghi lại thêm các host metadata hoặc dải dành riêng, hãy thêm cả các mục đó.

## Xác thực

Xác thực proxy từ cùng host, container hoặc tài khoản dịch vụ chạy OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Theo mặc định, khi không cung cấp đích tùy chỉnh, lệnh kiểm tra rằng `https://example.com/` thành công và khởi động một canary tạm thời trên vòng lặp cục bộ mà proxy không được phép truy cập. Kiểm tra bị từ chối mặc định đạt khi proxy trả về phản hồi từ chối không phải 2xx hoặc chặn canary bằng lỗi vận chuyển; kiểm tra thất bại nếu một phản hồi thành công đến được canary. Nếu không có proxy nào được bật và cấu hình, quá trình xác thực báo cáo sự cố cấu hình; dùng `--proxy-url` cho một lần preflight trước khi thay đổi cấu hình. Dùng `--allowed-url` và `--denied-url` để kiểm tra các kỳ vọng riêng của triển khai. Thêm `--apns-reachable` để đồng thời xác minh rằng việc gửi trực tiếp APNs HTTP/2 có thể mở một đường hầm CONNECT qua proxy và nhận phản hồi APNs sandbox; phép dò dùng token nhà cung cấp cố ý không hợp lệ, vì vậy `403 InvalidProviderToken` là kết quả được kỳ vọng và được tính là có thể truy cập. Các đích bị từ chối tùy chỉnh đóng khi lỗi: bất kỳ phản hồi HTTP nào cũng có nghĩa là đích có thể truy cập qua proxy, và bất kỳ lỗi vận chuyển nào cũng được báo cáo là không kết luận được vì OpenClaw không thể chứng minh proxy đã chặn một origin có thể truy cập. Khi xác thực thất bại, lệnh thoát với mã 1.

Dùng `--json` cho tự động hóa. Đầu ra JSON chứa kết quả tổng thể, nguồn cấu hình proxy hiệu dụng, mọi lỗi cấu hình và từng kiểm tra đích. Thông tin xác thực trong URL proxy được che trong đầu ra văn bản và JSON:

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
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
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

Yêu cầu công khai sẽ thành công. Các yêu cầu vòng lặp cục bộ và metadata sẽ bị proxy chặn. Đối với `openclaw proxy validate`, canary vòng lặp cục bộ tích hợp sẵn có thể phân biệt một từ chối proxy với một origin có thể truy cập. Các kiểm tra `--denied-url` tùy chỉnh không có canary đó, vì vậy hãy xem cả phản hồi HTTP lẫn lỗi vận chuyển mơ hồ là lỗi xác thực, trừ khi proxy của bạn hiển thị một tín hiệu từ chối riêng của triển khai mà bạn có thể xác minh riêng.

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
- Lưu lượng mặt phẳng điều khiển vòng lặp cục bộ của Gateway mặc định bỏ qua cục bộ trực tiếp qua `proxy.loopbackMode: "gateway-only"`. OpenClaw triển khai cơ chế bỏ qua đó bằng cách đăng ký thẩm quyền vòng lặp cục bộ của Gateway đang hoạt động trong bộ điều khiển `NO_PROXY` `global-agent` được quản lý. Người vận hành có thể đặt `proxy.loopbackMode: "proxy"` để gửi lưu lượng vòng lặp cục bộ của Gateway qua proxy được quản lý, hoặc `proxy.loopbackMode: "block"` để từ chối các kết nối Gateway vòng lặp cục bộ. Xem [Chế độ vòng lặp cục bộ của Gateway](#gateway-loopback-mode) để biết lưu ý về proxy từ xa.
- Các socket `net`, `tls` và `http2` thô, addon native và tiến trình con không thuộc OpenClaw có thể bỏ qua định tuyến proxy cấp Node, trừ khi chúng kế thừa và tôn trọng các biến môi trường proxy. Các CLI con OpenClaw được fork kế thừa URL proxy được quản lý và trạng thái `proxy.loopbackMode`.
- IRC là kênh TCP/TLS thô nằm ngoài định tuyến proxy chuyển tiếp do người vận hành quản lý. Trong các triển khai yêu cầu mọi lưu lượng đi ra đều đi qua proxy chuyển tiếp đó, hãy đặt `channels.irc.enabled=false` trừ khi lưu lượng IRC trực tiếp được phê duyệt rõ ràng.
- Proxy gỡ lỗi cục bộ là công cụ chẩn đoán, và việc chuyển tiếp upstream trực tiếp của nó cho các yêu cầu proxy và đường hầm CONNECT bị tắt theo mặc định khi chế độ proxy được quản lý đang hoạt động; chỉ bật chuyển tiếp trực tiếp cho chẩn đoán cục bộ đã được phê duyệt.
- WebUI cục bộ của người dùng và máy chủ mô hình cục bộ nên được thêm vào danh sách cho phép trong chính sách proxy của người vận hành khi cần; OpenClaw không cung cấp cơ chế bỏ qua mạng cục bộ chung cho chúng.
- Cơ chế bỏ qua proxy của mặt phẳng điều khiển Gateway được chủ ý giới hạn ở `localhost` và các URL IP vòng lặp cục bộ dạng literal. Dùng `ws://127.0.0.1:18789`, `ws://[::1]:18789`, hoặc `ws://localhost:18789` cho các kết nối mặt phẳng điều khiển Gateway cục bộ trực tiếp; các hostname khác được định tuyến như lưu lượng dựa trên hostname thông thường.
- OpenClaw không kiểm tra, thử nghiệm hoặc chứng nhận chính sách proxy của bạn.
- Hãy xem thay đổi chính sách proxy là thay đổi vận hành nhạy cảm về bảo mật.
