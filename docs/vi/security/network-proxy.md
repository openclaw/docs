---
read_when:
    - Bạn muốn phòng thủ nhiều lớp trước các cuộc tấn công SSRF và DNS rebinding
    - Cấu hình proxy chuyển tiếp bên ngoài cho lưu lượng runtime của OpenClaw
summary: Cách định tuyến lưu lượng HTTP và WebSocket của runtime OpenClaw qua proxy lọc do người vận hành quản lý
title: Proxy mạng
x-i18n:
    generated_at: "2026-06-27T18:11:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw có thể định tuyến lưu lượng HTTP và WebSocket runtime qua một forward proxy do operator quản lý. Đây là lớp phòng vệ chiều sâu tùy chọn cho các triển khai muốn kiểm soát egress tập trung, bảo vệ SSRF mạnh hơn và khả năng kiểm toán mạng tốt hơn.

OpenClaw không đóng gói, tải xuống, khởi động, cấu hình hoặc chứng nhận proxy. Bạn chạy công nghệ proxy phù hợp với môi trường của mình, và OpenClaw định tuyến các client HTTP và WebSocket process-local thông thường qua proxy đó.

## Vì sao dùng proxy

Proxy cung cấp cho operator một điểm kiểm soát mạng duy nhất cho lưu lượng HTTP và WebSocket đi ra. Điều đó có thể hữu ích ngay cả ngoài việc tăng cường chống SSRF:

- Chính sách tập trung: duy trì một chính sách egress thay vì dựa vào từng điểm gọi HTTP của ứng dụng để áp dụng đúng quy tắc mạng.
- Kiểm tra lúc kết nối: đánh giá đích sau khi phân giải DNS và ngay trước khi proxy mở kết nối upstream.
- Phòng vệ DNS rebinding: giảm khoảng cách giữa kiểm tra DNS ở cấp ứng dụng và kết nối đi ra thực tế.
- Bao phủ JavaScript rộng hơn: định tuyến các client thông thường như `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch và tương tự qua cùng một đường dẫn.
- Khả năng kiểm toán: ghi log các đích được cho phép và bị từ chối tại ranh giới egress.
- Kiểm soát vận hành: thực thi quy tắc đích, phân đoạn mạng, giới hạn tốc độ hoặc allowlist đi ra mà không cần build lại OpenClaw.

Định tuyến proxy là một guardrail cấp tiến trình cho egress HTTP và WebSocket thông thường. Nó cung cấp cho operator một đường dẫn fail-closed để định tuyến các client HTTP JavaScript được hỗ trợ qua proxy lọc của riêng họ, nhưng không phải là sandbox mạng cấp hệ điều hành và không khiến OpenClaw chứng nhận chính sách đích của proxy.

## Cách OpenClaw định tuyến lưu lượng

Khi `proxy.enabled=true` và URL proxy được cấu hình, các tiến trình runtime được bảo vệ như `openclaw gateway run`, `openclaw node run` và `openclaw agent --local` định tuyến egress HTTP và WebSocket thông thường qua proxy đã cấu hình:

```text
Tiến trình OpenClaw
  fetch                  -> proxy lọc do operator quản lý -> internet công cộng
  node:http và https     -> proxy lọc do operator quản lý -> internet công cộng
  Client WebSocket       -> proxy lọc do operator quản lý -> internet công cộng
```

Hợp đồng công khai là hành vi định tuyến, không phải các hook Node nội bộ dùng để triển khai nó. Các client WebSocket control-plane của OpenClaw Gateway dùng một đường dẫn trực tiếp hẹp cho lưu lượng RPC Gateway local loopback khi URL Gateway dùng `localhost` hoặc một IP loopback dạng literal như `127.0.0.1` hoặc `[::1]`. Đường dẫn control-plane đó phải có khả năng truy cập Gateway loopback ngay cả khi proxy của operator chặn các đích loopback. Các yêu cầu HTTP và WebSocket runtime thông thường vẫn dùng proxy đã cấu hình.

Nội bộ, OpenClaw cài đặt Proxyline làm runtime định tuyến cấp tiến trình cho tính năng này. Proxyline bao phủ `fetch`, các client dựa trên undici, caller Node core `node:http` / `node:https`, các client WebSocket phổ biến và các đường hầm CONNECT do helper tạo. Chế độ proxy được quản lý thay thế các HTTP agent Node do caller cung cấp để các agent rõ ràng không vô tình bỏ qua proxy của operator.

Một số Plugin sở hữu transport tùy chỉnh cần nối dây proxy rõ ràng ngay cả khi đã có định tuyến cấp tiến trình. Ví dụ, transport Bot API của Telegram dùng dispatcher undici HTTP/1 riêng và vì vậy tuân thủ env proxy của tiến trình cộng với fallback `OPENCLAW_PROXY_URL` được quản lý trong đường dẫn transport dành riêng cho owner đó.

Bản thân URL proxy có thể dùng `http://` hoặc `https://`. Các scheme này mô tả kết nối từ OpenClaw đến endpoint proxy:

- `http://proxy.example:3128`: OpenClaw mở một kết nối TCP thường đến forward proxy và gửi các yêu cầu HTTP proxy, bao gồm `CONNECT` cho đích HTTPS.
- `https://proxy.example:8443`: OpenClaw mở TLS đến endpoint proxy, xác minh chứng chỉ proxy, rồi gửi các yêu cầu HTTP proxy bên trong phiên TLS đó.

HTTPS của đích tách biệt với TLS của endpoint proxy. Với đích HTTPS, OpenClaw vẫn yêu cầu proxy tạo một đường hầm HTTP `CONNECT` rồi bắt đầu TLS tới đích qua đường hầm đó.

Khi proxy đang hoạt động, OpenClaw xóa `no_proxy` và `NO_PROXY`. Các danh sách bỏ qua đó dựa trên đích, nên nếu để `localhost` hoặc `127.0.0.1` ở đó thì các mục tiêu SSRF rủi ro cao có thể bỏ qua proxy lọc.

Khi tắt, OpenClaw khôi phục môi trường proxy trước đó và đặt lại trạng thái định tuyến tiến trình đã cache.

## Thuật ngữ proxy liên quan

- `proxy.enabled` / `proxy.proxyUrl`: định tuyến qua forward-proxy đi ra cho egress runtime của OpenClaw. Trang này tài liệu hóa tính năng đó.
- `gateway.auth.mode: "trusted-proxy"`: xác thực reverse-proxy nhận biết danh tính đi vào cho truy cập Gateway. Xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy debug cục bộ và trình kiểm tra capture cho phát triển và hỗ trợ. Xem [openclaw proxy](/vi/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: tùy chọn bật cho `web_fetch` để cho phép proxy env HTTP(S) do operator kiểm soát phân giải DNS trong khi vẫn giữ chính sách ghim DNS nghiêm ngặt mặc định và chính sách hostname. Xem [Web fetch](/vi/tools/web-fetch#trusted-env-proxy).
- Cài đặt proxy dành riêng cho kênh hoặc provider: các override dành riêng cho owner cho một transport cụ thể. Ưu tiên proxy mạng được quản lý khi mục tiêu là kiểm soát egress tập trung trên toàn runtime.

## Cấu hình

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Với endpoint proxy HTTPS dùng CA proxy riêng:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Bạn cũng có thể cung cấp URL qua môi trường, trong khi giữ `proxy.enabled=true` trong cấu hình:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` được ưu tiên hơn `OPENCLAW_PROXY_URL`.

### Chế độ loopback Gateway

Các client control-plane Gateway cục bộ thường kết nối tới một WebSocket loopback như `ws://127.0.0.1:18789`. Dùng `proxy.loopbackMode` để chọn cách các ngoại lệ managed-proxy loopback hoạt động khi proxy được quản lý đang bật:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (mặc định): OpenClaw đăng ký authority loopback của Gateway trong chính sách bypass được quản lý của Proxyline để lưu lượng WebSocket Gateway cục bộ có thể kết nối trực tiếp. Các cổng Gateway loopback tùy chỉnh hoạt động vì host và cổng của URL Gateway đang hoạt động được đăng ký. Plugin trình duyệt đóng gói cũng có thể đăng ký chính xác các endpoint WebSocket CDP readiness và DevTools cục bộ cho trình duyệt được quản lý do OpenClaw khởi chạy, và provider embedding bộ nhớ Ollama đóng gói có thể dùng đường dẫn trực tiếp được bảo vệ hẹp hơn của riêng nó cho đúng origin embedding loopback host-local đã cấu hình.
- `proxy`: OpenClaw không đăng ký bypass loopback Gateway hoặc Ollama, nên lưu lượng loopback đó được gửi qua proxy được quản lý. Nếu proxy ở xa, nó phải cung cấp định tuyến đặc biệt cho dịch vụ loopback của host OpenClaw, chẳng hạn ánh xạ sang hostname, IP hoặc tunnel mà proxy có thể truy cập. Các proxy từ xa tiêu chuẩn phân giải `127.0.0.1` và `localhost` từ host proxy, không phải từ host OpenClaw.
- `block`: OpenClaw từ chối các kết nối control-plane loopback Gateway và các kết nối embedding loopback host-local Ollama được bảo vệ trước khi mở socket.

Nếu `enabled=true` nhưng không có URL proxy hợp lệ được cấu hình, các lệnh được bảo vệ sẽ không khởi động thay vì fallback về truy cập mạng trực tiếp.

Với các dịch vụ gateway được quản lý khởi động bằng `openclaw gateway start`, nên lưu URL trong cấu hình:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback môi trường phù hợp nhất cho các lần chạy foreground. Nếu bạn dùng nó với một dịch vụ đã cài đặt, hãy đặt `OPENCLAW_PROXY_URL` trong môi trường bền vững của dịch vụ, chẳng hạn `$OPENCLAW_STATE_DIR/.env` hoặc `~/.openclaw/.env`, rồi cài đặt lại dịch vụ để launchd, systemd hoặc Scheduled Tasks khởi động gateway với giá trị đó.

Với các lệnh `openclaw --container ...`, OpenClaw chuyển tiếp `OPENCLAW_PROXY_URL` vào CLI con nhắm tới container khi biến này được đặt. URL phải có thể truy cập từ bên trong container; `127.0.0.1` trỏ đến chính container, không phải host. OpenClaw từ chối URL proxy loopback cho các lệnh nhắm tới container trừ khi bạn override rõ ràng kiểm tra an toàn đó.

## Yêu cầu proxy

Chính sách proxy là ranh giới bảo mật. OpenClaw không thể xác minh rằng proxy chặn đúng mục tiêu.

Cấu hình proxy để:

- Chỉ bind vào loopback hoặc một interface riêng tư đáng tin cậy.
- Hạn chế truy cập để chỉ tiến trình, host, container hoặc service account OpenClaw có thể dùng nó.
- Tự phân giải đích và chặn IP đích sau khi phân giải DNS.
- Áp dụng chính sách lúc kết nối cho cả yêu cầu HTTP thường và đường hầm HTTPS `CONNECT`.
- Từ chối các bypass dựa trên đích cho loopback, private, link-local, metadata, multicast, reserved hoặc dải documentation.
- Tránh allowlist hostname trừ khi bạn hoàn toàn tin tưởng đường dẫn phân giải DNS.
- Ghi log đích, quyết định, trạng thái và lý do mà không ghi log body yêu cầu, header authorization, cookie hoặc bí mật khác.
- Giữ chính sách proxy trong kiểm soát phiên bản và review các thay đổi như cấu hình nhạy cảm về bảo mật.

## Các đích bị chặn được khuyến nghị

Dùng denylist này làm điểm khởi đầu cho bất kỳ forward proxy, firewall hoặc chính sách egress nào.

Logic classifier cấp ứng dụng của OpenClaw nằm trong `src/infra/net/ssrf.ts` và `packages/net-policy/src/ip.ts`. Các hook parity liên quan là `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, và xử lý sentinel IPv4 nhúng cho các dạng NAT64, 6to4, Teredo, ISATAP và IPv4-mapped. Các tệp đó là tài liệu tham khảo hữu ích khi duy trì chính sách proxy bên ngoài, nhưng OpenClaw không tự động xuất hoặc thực thi các quy tắc đó trong proxy của bạn.

| Dải hoặc máy chủ                                                                        | Lý do cần chặn                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Địa chỉ không xác định và địa chỉ mạng này               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Mạng riêng RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Địa chỉ link-local và các đường dẫn metadata đám mây phổ biến |
| `169.254.169.254`, `metadata.google.internal`                                        | Dịch vụ metadata đám mây                              |
| `100.64.0.0/10`                                                                      | Không gian địa chỉ dùng chung NAT cấp nhà mạng               |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Dải đo kiểm hiệu năng                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Dải dùng cho mục đích đặc biệt và tài liệu                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 được dành riêng                                        |
| `fc00::/7`, `fec0::/10`                                                              | Dải IPv6 cục bộ/riêng                            |
| `100::/64`, `2001:20::/28`                                                           | Dải IPv6 discard và ORCHIDv2                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Tiền tố NAT64 có nhúng IPv4                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 và Teredo có nhúng IPv4                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 tương thích IPv4 và IPv6 ánh xạ IPv4                 |

Nếu nhà cung cấp đám mây hoặc nền tảng mạng của bạn có tài liệu về các máy chủ metadata hoặc dải được dành riêng bổ sung, hãy thêm cả các mục đó.

## Xác thực

Xác thực proxy từ cùng máy chủ, container hoặc tài khoản dịch vụ chạy OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Đối với endpoint proxy HTTPS được ký bởi CA riêng:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

Theo mặc định, khi không cung cấp đích tùy chỉnh, lệnh kiểm tra rằng `https://example.com/` thành công và khởi động một canary loopback tạm thời mà proxy không được phép truy cập. Kiểm tra bị từ chối mặc định đạt khi proxy trả về phản hồi từ chối không phải 2xx hoặc chặn canary bằng lỗi truyền tải; kiểm tra thất bại nếu phản hồi thành công tới được canary. Nếu chưa bật và cấu hình proxy, quá trình xác thực báo cáo vấn đề cấu hình; dùng `--proxy-url` để preflight một lần trước khi thay đổi cấu hình. Dùng `--allowed-url` và `--denied-url` để kiểm tra các kỳ vọng riêng của triển khai. Thêm `--apns-reachable` để cũng xác minh việc gửi APNs HTTP/2 trực tiếp có thể mở đường hầm CONNECT qua proxy và nhận phản hồi APNs sandbox; phép dò dùng token nhà cung cấp cố ý không hợp lệ, vì vậy `403 InvalidProviderToken` là kết quả được mong đợi và được tính là có thể truy cập. Các đích bị từ chối tùy chỉnh áp dụng fail-closed: bất kỳ phản hồi HTTP nào cũng có nghĩa là đích có thể truy cập qua proxy, và bất kỳ lỗi truyền tải nào cũng được báo cáo là không kết luận được vì OpenClaw không thể chứng minh proxy đã chặn một nguồn gốc có thể truy cập. Khi xác thực thất bại, lệnh thoát với mã 1.

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

Yêu cầu công khai phải thành công. Các yêu cầu loopback và metadata phải bị proxy chặn. Đối với `openclaw proxy validate`, canary loopback tích hợp có thể phân biệt việc proxy từ chối với một nguồn gốc có thể truy cập. Các kiểm tra `--denied-url` tùy chỉnh không có canary đó, vì vậy hãy xem cả phản hồi HTTP và lỗi truyền tải mơ hồ là lỗi xác thực, trừ khi proxy của bạn cung cấp tín hiệu từ chối riêng của triển khai mà bạn có thể xác minh riêng.

## Tin cậy CA của proxy

Dùng `proxy.tls.caFile` được quản lý khi chính endpoint proxy sử dụng chứng chỉ được ký bởi CA riêng:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

CA đó được dùng để xác minh TLS cho endpoint proxy. Nó không phải là thiết lập tin cậy MITM đích, chứng chỉ máy khách, hoặc phương án thay thế cho chính sách đích của proxy.

Chỉ dùng `NODE_EXTRA_CA_CERTS` khi toàn bộ tiến trình Node phải tin cậy một CA bổ sung từ lúc khởi động tiến trình, chẳng hạn khi hệ thống kiểm tra TLS của doanh nghiệp ký lại chứng chỉ đích cho mọi máy khách HTTPS trong tiến trình. `NODE_EXTRA_CA_CERTS` là thiết lập toàn cục theo tiến trình và phải có trước khi Node khởi động. Ưu tiên `proxy.tls.caFile` cho việc tin cậy endpoint proxy HTTPS vì nó được giới hạn trong định tuyến proxy được quản lý.

Sau đó bật định tuyến proxy của OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

hoặc đặt:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Giới hạn

- Proxy cải thiện mức bao phủ cho các máy khách HTTP và WebSocket JavaScript cục bộ theo tiến trình, nhưng nó không phải là sandbox mạng cấp hệ điều hành.
- Lưu lượng mặt phẳng điều khiển loopback của Gateway mặc định đi trực tiếp qua bypass cục bộ bằng `proxy.loopbackMode: "gateway-only"`. OpenClaw triển khai bypass đó bằng cách đăng ký authority loopback Gateway đang hoạt động trong chính sách bypass được quản lý của Proxyline. Người vận hành có thể đặt `proxy.loopbackMode: "proxy"` để gửi lưu lượng loopback Gateway qua proxy được quản lý, hoặc `proxy.loopbackMode: "block"` để từ chối kết nối Gateway loopback. Xem [Chế độ Loopback Gateway](#gateway-loopback-mode) để biết lưu ý về proxy từ xa.
- Socket `net`, `tls` và `http2` thô, addon native và các tiến trình con không phải OpenClaw có thể bypass định tuyến proxy cấp Node, trừ khi chúng kế thừa và tôn trọng biến môi trường proxy. Các CLI con OpenClaw được fork kế thừa URL proxy được quản lý và trạng thái `proxy.loopbackMode`.
- IRC là kênh TCP/TLS thô nằm ngoài định tuyến proxy chuyển tiếp do người vận hành quản lý. Trong các triển khai yêu cầu toàn bộ lưu lượng đi ra đi qua proxy chuyển tiếp đó, đặt `channels.irc.enabled=false` trừ khi lưu lượng IRC trực tiếp được phê duyệt rõ ràng.
- Proxy gỡ lỗi cục bộ là công cụ chẩn đoán, và việc chuyển tiếp upstream trực tiếp của nó cho các yêu cầu proxy và đường hầm CONNECT bị tắt theo mặc định khi chế độ proxy được quản lý đang hoạt động; chỉ bật chuyển tiếp trực tiếp cho chẩn đoán cục bộ đã được phê duyệt.
- WebUI cục bộ của người dùng và máy chủ mô hình cục bộ nên được đưa vào allowlist trong chính sách proxy của người vận hành khi cần; OpenClaw không cung cấp bypass mạng cục bộ tổng quát cho chúng. Nhà cung cấp embedding bộ nhớ Ollama được đóng gói có phạm vi hẹp hơn: nó có thể dùng đường dẫn trực tiếp được bảo vệ chỉ cho đúng nguồn gốc embedding loopback cục bộ trên máy chủ được suy ra từ `baseUrl` đã cấu hình, để embedding cục bộ trên máy chủ tiếp tục hoạt động khi proxy được quản lý không thể truy cập loopback của máy chủ. Các máy chủ embedding Ollama trên LAN, tailnet, mạng riêng và công khai vẫn dùng đường dẫn proxy được quản lý. `proxy.loopbackMode: "proxy"` gửi lưu lượng loopback Ollama này qua proxy được quản lý, và `proxy.loopbackMode: "block"` từ chối nó trước khi mở kết nối.
- Bypass proxy cho mặt phẳng điều khiển Gateway được cố ý giới hạn ở `localhost` và các URL IP loopback dạng literal. Dùng `ws://127.0.0.1:18789`, `ws://[::1]:18789`, hoặc `ws://localhost:18789` cho các kết nối mặt phẳng điều khiển Gateway trực tiếp cục bộ; các tên máy chủ khác định tuyến như lưu lượng dựa trên tên máy chủ thông thường.
- OpenClaw không kiểm tra, thử nghiệm hoặc chứng nhận chính sách proxy của bạn.
- Xem các thay đổi chính sách proxy là thay đổi vận hành nhạy cảm về bảo mật.

| Bề mặt                                                      | Trạng thái proxy được quản lý                                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, máy khách WebSocket phổ biến | Được định tuyến qua hook proxy được quản lý khi đã cấu hình.                                                |
| APNs HTTP/2 trực tiếp                                           | Được định tuyến qua helper CONNECT được quản lý cho APNs.                                                    |
| Loopback mặt phẳng điều khiển Gateway                               | Chỉ đi trực tiếp cho URL Gateway loopback cục bộ đã cấu hình.                                         |
| Chuyển tiếp upstream của proxy gỡ lỗi                              | Bị tắt khi chế độ proxy được quản lý đang hoạt động, trừ khi được bật rõ ràng cho chẩn đoán cục bộ.       |
| IRC                                                          | TCP/TLS thô; không được proxy bởi chế độ proxy HTTP được quản lý. Tắt trừ khi lưu lượng IRC trực tiếp được phê duyệt. |
| Các lệnh gọi máy khách `net`, `tls` hoặc `http2` thô khác              | Phải được phân loại bởi bộ bảo vệ socket thô trước khi landing.                                         |
