---
read_when:
    - Bạn muốn phòng thủ theo chiều sâu chống lại các cuộc tấn công SSRF và tái liên kết DNS
    - Cấu hình proxy chuyển tiếp bên ngoài cho lưu lượng thời gian chạy của OpenClaw
summary: Cách định tuyến lưu lượng HTTP và WebSocket thời gian chạy của OpenClaw qua proxy lọc do người vận hành quản lý
title: Proxy mạng
x-i18n:
    generated_at: "2026-05-06T17:59:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw có thể định tuyến lưu lượng HTTP và WebSocket lúc chạy qua một proxy chuyển tiếp do người vận hành quản lý. Đây là lớp phòng vệ bổ sung tùy chọn cho các triển khai muốn kiểm soát egress tập trung, bảo vệ SSRF mạnh hơn và khả năng kiểm toán mạng tốt hơn.

OpenClaw không cung cấp, tải xuống, khởi động, cấu hình hoặc chứng nhận một proxy. Bạn vận hành công nghệ proxy phù hợp với môi trường của mình, và OpenClaw định tuyến các client HTTP và WebSocket cục bộ theo tiến trình thông thường qua proxy đó.

## Vì sao nên dùng proxy

Proxy cung cấp cho người vận hành một điểm kiểm soát mạng duy nhất cho lưu lượng HTTP và WebSocket đi ra. Điều đó có thể hữu ích ngay cả ngoài việc tăng cường chống SSRF:

- Chính sách tập trung: duy trì một chính sách egress thay vì phụ thuộc vào từng vị trí gọi HTTP của ứng dụng để áp đúng quy tắc mạng.
- Kiểm tra tại thời điểm kết nối: đánh giá đích sau khi phân giải DNS và ngay trước khi proxy mở kết nối upstream.
- Phòng vệ DNS rebinding: giảm khoảng cách giữa kiểm tra DNS ở cấp ứng dụng và kết nối đi ra thực tế.
- Phạm vi bao phủ JavaScript rộng hơn: định tuyến các client thông thường như `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch và tương tự qua cùng một đường đi.
- Khả năng kiểm toán: ghi nhật ký các đích được cho phép và bị từ chối tại ranh giới egress.
- Kiểm soát vận hành: thực thi quy tắc đích, phân đoạn mạng, giới hạn tốc độ hoặc danh sách cho phép đi ra mà không cần dựng lại OpenClaw.

Định tuyến proxy là một hàng rào bảo vệ ở cấp tiến trình cho egress HTTP và WebSocket thông thường. Nó cung cấp cho người vận hành một đường dẫn đóng khi lỗi để định tuyến các client HTTP JavaScript được hỗ trợ qua proxy lọc của riêng họ, nhưng đây không phải là sandbox mạng ở cấp hệ điều hành và không khiến OpenClaw chứng nhận chính sách đích của proxy.

## Cách OpenClaw định tuyến lưu lượng

Khi `proxy.enabled=true` và một URL proxy được cấu hình, các tiến trình runtime được bảo vệ như `openclaw gateway run`, `openclaw node run` và `openclaw agent --local` sẽ định tuyến egress HTTP và WebSocket thông thường qua proxy đã cấu hình:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Hợp đồng công khai là hành vi định tuyến, không phải các hook Node nội bộ dùng để triển khai nó. Các client WebSocket thuộc mặt phẳng điều khiển của OpenClaw Gateway dùng một đường dẫn trực tiếp hẹp cho lưu lượng RPC Gateway local loopback khi URL Gateway dùng `localhost` hoặc một IP loopback dạng literal như `127.0.0.1` hoặc `[::1]`. Đường dẫn mặt phẳng điều khiển đó phải có thể truy cập các Gateway loopback ngay cả khi proxy của người vận hành chặn các đích loopback. Các yêu cầu HTTP và WebSocket runtime thông thường vẫn dùng proxy đã cấu hình.

Bên trong, OpenClaw dùng hai hook định tuyến cấp tiến trình cho tính năng này:

- Định tuyến dispatcher của Undici bao phủ `fetch`, các client dựa trên undici và các transport cung cấp dispatcher undici của riêng chúng.
- Định tuyến `global-agent` bao phủ các caller Node lõi `node:http` và `node:https`, bao gồm nhiều thư viện được xây trên `http.request`, `https.request`, `http.get` và `https.get`. Chế độ proxy được quản lý bắt buộc dùng agent toàn cục đó để các agent HTTP Node tường minh không vô tình đi vòng qua proxy của người vận hành.

Một số plugin sở hữu transport tùy chỉnh cần đấu nối proxy tường minh ngay cả khi đã có định tuyến cấp tiến trình. Ví dụ, transport Bot API của Telegram dùng dispatcher undici HTTP/1 riêng và do đó tuân theo env proxy của tiến trình cùng với phương án dự phòng `OPENCLAW_PROXY_URL` được quản lý trong đường dẫn transport do chủ sở hữu cụ thể đó quản lý.

Bản thân URL proxy phải dùng `http://`. Các đích HTTPS vẫn được hỗ trợ qua proxy bằng HTTP `CONNECT`; điều này chỉ có nghĩa là OpenClaw kỳ vọng một listener proxy chuyển tiếp HTTP thuần như `http://127.0.0.1:3128`.

Khi proxy đang hoạt động, OpenClaw xóa `no_proxy`, `NO_PROXY` và `GLOBAL_AGENT_NO_PROXY`. Các danh sách đi vòng đó dựa trên đích, vì vậy việc để `localhost` hoặc `127.0.0.1` trong đó sẽ cho phép các mục tiêu SSRF rủi ro cao bỏ qua proxy lọc.

Khi tắt, OpenClaw khôi phục môi trường proxy trước đó và đặt lại trạng thái định tuyến tiến trình đã lưu trong bộ nhớ đệm.

## Các thuật ngữ proxy liên quan

- `proxy.enabled` / `proxy.proxyUrl`: định tuyến proxy chuyển tiếp đi ra cho egress runtime của OpenClaw. Trang này ghi lại tính năng đó.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse proxy nhận biết danh tính cho truy cập Gateway đi vào. Xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy gỡ lỗi cục bộ và trình kiểm tra bản ghi cho phát triển và hỗ trợ. Xem [openclaw proxy](/vi/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: tùy chọn bật cho `web_fetch` để cho phép proxy env HTTP(S) do người vận hành kiểm soát phân giải DNS, đồng thời vẫn giữ chính sách pin DNS nghiêm ngặt và chính sách tên máy chủ mặc định. Xem [Web fetch](/vi/tools/web-fetch#trusted-env-proxy).
- Thiết lập proxy theo kênh hoặc theo provider: các ghi đè do chủ sở hữu cụ thể quản lý cho một transport cụ thể. Ưu tiên proxy mạng được quản lý khi mục tiêu là kiểm soát egress tập trung trên toàn runtime.

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

Các client mặt phẳng điều khiển Gateway cục bộ thường kết nối tới một WebSocket loopback như `ws://127.0.0.1:18789`. Dùng `proxy.loopbackMode` để chọn cách lưu lượng đó hoạt động khi proxy được quản lý đang hoạt động:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (mặc định): OpenClaw đăng ký authority loopback của Gateway trong controller `NO_PROXY` `global-agent` đang hoạt động để lưu lượng WebSocket Gateway cục bộ có thể kết nối trực tiếp. Các cổng Gateway loopback tùy chỉnh hoạt động vì host và cổng của URL Gateway đang hoạt động được đăng ký.
- `proxy`: OpenClaw không đăng ký authority `NO_PROXY` loopback của Gateway, vì vậy lưu lượng Gateway cục bộ được gửi qua proxy được quản lý. Nếu proxy ở xa, nó phải cung cấp định tuyến đặc biệt cho dịch vụ loopback của host OpenClaw, chẳng hạn ánh xạ nó tới tên máy chủ, IP hoặc tunnel mà proxy có thể truy cập. Các proxy từ xa tiêu chuẩn phân giải `127.0.0.1` và `localhost` từ host proxy, không phải từ host OpenClaw.
- `block`: OpenClaw từ chối các kết nối mặt phẳng điều khiển Gateway loopback trước khi mở socket.

Nếu `enabled=true` nhưng không có URL proxy hợp lệ nào được cấu hình, các lệnh được bảo vệ sẽ khởi động thất bại thay vì rơi về truy cập mạng trực tiếp.

Đối với các dịch vụ gateway được quản lý khởi động bằng `openclaw gateway start`, nên lưu URL trong cấu hình:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Phương án dự phòng môi trường phù hợp nhất cho các lần chạy foreground. Nếu bạn dùng nó với một dịch vụ đã cài đặt, hãy đặt `OPENCLAW_PROXY_URL` trong môi trường bền vững của dịch vụ, chẳng hạn `$OPENCLAW_STATE_DIR/.env` hoặc `~/.openclaw/.env`, rồi cài đặt lại dịch vụ để launchd, systemd hoặc Scheduled Tasks khởi động gateway với giá trị đó.

Đối với các lệnh `openclaw --container ...`, OpenClaw chuyển tiếp `OPENCLAW_PROXY_URL` vào CLI con nhắm tới container khi nó được đặt. URL phải có thể truy cập được từ bên trong container; `127.0.0.1` trỏ tới chính container, không phải host. OpenClaw từ chối các URL proxy loopback cho lệnh nhắm tới container trừ khi bạn ghi đè tường minh kiểm tra an toàn đó.

## Yêu cầu đối với proxy

Chính sách proxy là ranh giới bảo mật. OpenClaw không thể xác minh rằng proxy chặn đúng các mục tiêu cần chặn.

Cấu hình proxy để:

- Chỉ bind vào loopback hoặc một giao diện riêng tư đáng tin cậy.
- Hạn chế truy cập để chỉ tiến trình, host, container hoặc tài khoản dịch vụ OpenClaw có thể dùng nó.
- Tự phân giải đích và chặn IP đích sau khi phân giải DNS.
- Áp dụng chính sách tại thời điểm kết nối cho cả yêu cầu HTTP thuần và tunnel HTTPS `CONNECT`.
- Từ chối các đường vòng dựa trên đích đối với loopback, private, link-local, metadata, multicast, reserved hoặc các dải documentation.
- Tránh danh sách cho phép tên máy chủ trừ khi bạn hoàn toàn tin tưởng đường dẫn phân giải DNS.
- Ghi nhật ký đích, quyết định, trạng thái và lý do mà không ghi body yêu cầu, header ủy quyền, cookie hoặc các bí mật khác.
- Đặt chính sách proxy dưới kiểm soát phiên bản và rà soát thay đổi như cấu hình nhạy cảm về bảo mật.

## Các đích nên chặn

Dùng danh sách từ chối này làm điểm khởi đầu cho bất kỳ proxy chuyển tiếp, tường lửa hoặc chính sách egress nào.

Logic phân loại cấp ứng dụng của OpenClaw nằm trong `src/infra/net/ssrf.ts` và `src/shared/net/ip.ts`. Các hook tương đương liên quan là `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` và xử lý sentinel IPv4 nhúng cho NAT64, 6to4, Teredo, ISATAP và các dạng IPv4-mapped. Những tệp đó là tài liệu tham khảo hữu ích khi duy trì chính sách proxy bên ngoài, nhưng OpenClaw không tự động xuất hoặc thực thi các quy tắc đó trong proxy của bạn.

| Dải hoặc host                                                                        | Vì sao cần chặn                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Địa chỉ không xác định và địa chỉ mạng này           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Mạng riêng RFC1918                                   |
| `169.254.0.0/16`, `fe80::/10`                                                        | Địa chỉ link-local và các đường dẫn metadata đám mây phổ biến |
| `169.254.169.254`, `metadata.google.internal`                                        | Dịch vụ metadata đám mây                             |
| `100.64.0.0/10`                                                                      | Không gian địa chỉ dùng chung NAT cấp nhà mạng       |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Dải benchmarking                                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Dải special-use và documentation                     |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 reserved                                        |
| `fc00::/7`, `fec0::/10`                                                              | Dải IPv6 cục bộ/riêng                                |
| `100::/64`, `2001:20::/28`                                                           | Dải discard IPv6 và ORCHIDv2                         |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Tiền tố NAT64 với IPv4 nhúng                         |
| `2002::/16`, `2001::/32`                                                             | 6to4 và Teredo với IPv4 nhúng                        |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 tương thích IPv4 và IPv6 IPv4-mapped            |

Nếu nhà cung cấp đám mây hoặc nền tảng mạng của bạn ghi lại thêm các host metadata hoặc dải reserved, hãy thêm cả chúng.

## Xác thực

Xác thực proxy từ cùng host, container hoặc tài khoản dịch vụ chạy OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Theo mặc định, khi không cung cấp đích tùy chỉnh nào, lệnh sẽ kiểm tra rằng `https://example.com/` thành công và khởi động một canary loopback tạm thời mà proxy không được chạm tới. Kiểm tra bị từ chối mặc định sẽ đạt khi proxy trả về phản hồi từ chối không phải 2xx hoặc chặn canary bằng lỗi truyền tải; kiểm tra sẽ thất bại nếu một phản hồi thành công đến được canary. Nếu không có proxy nào được bật và cấu hình, quá trình xác thực sẽ báo cáo sự cố cấu hình; dùng `--proxy-url` cho bước preflight một lần trước khi thay đổi cấu hình. Dùng `--allowed-url` và `--denied-url` để kiểm tra các kỳ vọng riêng của triển khai. Thêm `--apns-reachable` để cũng xác minh rằng việc gửi APNs HTTP/2 trực tiếp có thể mở một đường hầm CONNECT qua proxy và nhận phản hồi APNs sandbox; phép dò dùng một provider token cố ý không hợp lệ, nên `403 InvalidProviderToken` là kết quả được kỳ vọng và được tính là có thể kết nối. Các đích bị từ chối tùy chỉnh hoạt động theo nguyên tắc fail-closed: bất kỳ phản hồi HTTP nào cũng có nghĩa là đích có thể truy cập qua proxy, và bất kỳ lỗi truyền tải nào cũng được báo cáo là không kết luận được vì OpenClaw không thể chứng minh proxy đã chặn một origin có thể truy cập. Khi xác thực thất bại, lệnh thoát với mã 1.

Dùng `--json` cho tự động hóa. Kết quả JSON chứa kết quả tổng thể, nguồn cấu hình proxy hiệu lực, mọi lỗi cấu hình, và từng kiểm tra đích. Thông tin xác thực trong URL proxy được biên tập lại trong đầu ra văn bản và JSON:

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

Yêu cầu công khai sẽ thành công. Các yêu cầu loopback và metadata sẽ bị proxy chặn. Đối với `openclaw proxy validate`, canary loopback tích hợp có thể phân biệt một từ chối của proxy với một origin có thể truy cập. Các kiểm tra `--denied-url` tùy chỉnh không có canary đó, nên hãy xem cả phản hồi HTTP lẫn lỗi truyền tải mơ hồ là lỗi xác thực, trừ khi proxy của bạn cung cấp một tín hiệu từ chối riêng theo triển khai mà bạn có thể xác minh riêng.

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

- Proxy cải thiện độ bao phủ cho các client HTTP và WebSocket JavaScript cục bộ trong tiến trình, nhưng không phải là sandbox mạng cấp hệ điều hành.
- Lưu lượng control-plane loopback của Gateway mặc định đi qua đường bỏ qua cục bộ trực tiếp bằng `proxy.loopbackMode: "gateway-only"`. OpenClaw triển khai cơ chế bỏ qua đó bằng cách đăng ký authority loopback Gateway đang hoạt động trong bộ điều khiển `global-agent` `NO_PROXY` được quản lý. Người vận hành có thể đặt `proxy.loopbackMode: "proxy"` để gửi lưu lượng loopback Gateway qua proxy được quản lý, hoặc `proxy.loopbackMode: "block"` để từ chối các kết nối Gateway loopback. Xem [Chế độ Loopback của Gateway](#gateway-loopback-mode) để biết lưu ý về remote-proxy.
- Các socket `net`, `tls` và `http2` thô, addon native, và các tiến trình con không phải OpenClaw có thể bỏ qua định tuyến proxy cấp Node trừ khi chúng kế thừa và tuân thủ các biến môi trường proxy. Các CLI con OpenClaw được fork sẽ kế thừa URL proxy được quản lý và trạng thái `proxy.loopbackMode`.
- IRC là một kênh TCP/TLS thô nằm ngoài định tuyến forward proxy do người vận hành quản lý. Trong các triển khai yêu cầu toàn bộ egress đi qua forward proxy đó, hãy đặt `channels.irc.enabled=false` trừ khi egress IRC trực tiếp được phê duyệt rõ ràng.
- Proxy gỡ lỗi cục bộ là công cụ chẩn đoán và việc chuyển tiếp upstream trực tiếp của nó cho các yêu cầu proxy và đường hầm CONNECT bị tắt theo mặc định trong khi chế độ proxy được quản lý đang hoạt động; chỉ bật chuyển tiếp trực tiếp cho các chẩn đoán cục bộ đã được phê duyệt.
- WebUI cục bộ của người dùng và máy chủ mô hình cục bộ nên được đưa vào allowlist trong chính sách proxy của người vận hành khi cần; OpenClaw không cung cấp cơ chế bỏ qua mạng cục bộ tổng quát cho chúng.
- Cơ chế bỏ qua proxy control-plane của Gateway được giới hạn có chủ ý ở `localhost` và các URL IP loopback dạng literal. Dùng `ws://127.0.0.1:18789`, `ws://[::1]:18789`, hoặc `ws://localhost:18789` cho các kết nối control-plane Gateway cục bộ trực tiếp; các hostname khác được định tuyến như lưu lượng dựa trên hostname thông thường.
- OpenClaw không kiểm tra, thử nghiệm, hoặc chứng nhận chính sách proxy của bạn.
- Hãy xem các thay đổi chính sách proxy là các thay đổi vận hành nhạy cảm về bảo mật.
