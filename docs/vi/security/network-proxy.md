---
read_when:
    - Bạn muốn có nhiều lớp bảo vệ chống lại các cuộc tấn công SSRF và tái liên kết DNS
    - Cấu hình proxy chuyển tiếp bên ngoài cho lưu lượng thời gian chạy của OpenClaw
summary: Cách định tuyến lưu lượng HTTP và WebSocket trong thời gian chạy của OpenClaw qua proxy lọc do người vận hành quản lý
title: Proxy mạng
x-i18n:
    generated_at: "2026-07-12T08:26:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw có thể định tuyến lưu lượng HTTP và WebSocket khi chạy thông qua một proxy chuyển tiếp do người vận hành quản lý. Đây là một lớp phòng vệ chuyên sâu tùy chọn: kiểm soát lưu lượng ra tập trung, tăng cường bảo vệ chống SSRF và cho phép kiểm tra đích tại ranh giới mạng. Vì proxy đánh giá đích tại thời điểm kết nối, sau khi phân giải DNS và ngay trước khi mở kết nối thượng nguồn, nên nó cũng thu hẹp khoảng thời gian mà một cuộc tấn công tái liên kết DNS dựa vào giữa bước kiểm tra DNS trước đó ở cấp ứng dụng và kết nối ra thực tế. Một chính sách proxy duy nhất cũng cung cấp cho người vận hành một nơi để thực thi các quy tắc về đích, phân đoạn mạng, giới hạn tốc độ hoặc danh sách cho phép lưu lượng ra mà không cần xây dựng lại OpenClaw.

OpenClaw không cung cấp, tải xuống, khởi động, cấu hình hoặc chứng nhận proxy. Bạn vận hành công nghệ proxy phù hợp với môi trường của mình; OpenClaw định tuyến các máy khách HTTP và WebSocket của chính nó thông qua proxy đó.

## Cấu hình

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Bạn cũng có thể đặt URL thông qua môi trường trong khi vẫn giữ `proxy.enabled: true` trong cấu hình:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` được ưu tiên hơn `OPENCLAW_PROXY_URL`. Nếu `proxy.enabled` là `true` nhưng không phân giải được URL hợp lệ, các lệnh được bảo vệ sẽ không thể khởi động thay vì quay về truy cập mạng trực tiếp.

| Khóa                 | Kiểu                                 | Mặc định       | Ghi chú                                                                                                                                                  |
| -------------------- | ------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | boolean                              | chưa đặt       | Phải là `true` để kích hoạt định tuyến.                                                                                                                  |
| `proxy.proxyUrl`     | string                               | chưa đặt       | URL proxy chuyển tiếp `http://` hoặc `https://`. Thông tin xác thực được nhúng trong URL được coi là nhạy cảm và được che khỏi ảnh chụp trạng thái/nhật ký. |
| `proxy.tls.caFile`   | string                               | chưa đặt       | Gói CA để xác minh một điểm cuối proxy `https://` được ký bởi CA riêng.                                                                                  |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | Kiểm soát hành vi bỏ qua local loopback; xem bên dưới.                                                                                                   |

Đối với các dịch vụ Gateway được quản lý, hãy lưu URL trong cấu hình để URL vẫn tồn tại sau khi cài đặt lại, thay vì phụ thuộc vào biến môi trường của tiến trình chạy ở nền trước:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Cơ chế dự phòng bằng biến môi trường `OPENCLAW_PROXY_URL` phù hợp nhất với các lần chạy ở nền trước. Để sử dụng cơ chế này với một dịch vụ đã cài đặt, hãy đặt biến trong môi trường bền vững của dịch vụ (`$OPENCLAW_STATE_DIR/.env`, mặc định là `~/.openclaw/.env`), sau đó cài đặt lại để launchd/systemd/Scheduled Tasks nhận biến đó.

### Điểm cuối proxy HTTPS với CA riêng

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` xác minh chứng chỉ TLS của chính điểm cuối proxy. Đây không phải là thiết lập tin cậy MITM cho đích, chứng chỉ máy khách hoặc phương án thay thế cho chính sách đích của proxy. Chỉ sử dụng `NODE_EXTRA_CA_CERTS` thay thế khi toàn bộ tiến trình Node phải tin cậy một CA bổ sung ngay từ lúc khởi động (ví dụ: hệ thống kiểm tra TLS của doanh nghiệp ký lại mọi chứng chỉ đích HTTPS) — biến đó áp dụng cho toàn tiến trình và phải được đặt trước khi Node khởi động, vì vậy OpenClaw không thể áp dụng biến này giữa lúc chạy theo cách áp dụng `proxy.tls.caFile`. Ưu tiên `proxy.tls.caFile` để thiết lập độ tin cậy cho điểm cuối proxy HTTPS: phạm vi của nó chỉ giới hạn trong hoạt động định tuyến proxy được quản lý thay vì toàn bộ tiến trình.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Cách hoạt động của định tuyến

Khi `proxy.enabled: true` và có URL hợp lệ, các tiến trình chạy được bảo vệ (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) sẽ định tuyến lưu lượng HTTP và WebSocket ra ngoài thông thường qua proxy:

```text
Tiến trình OpenClaw
  fetch, node:http, node:https, máy khách WebSocket  -> proxy của người vận hành -> đích
```

Ở bên trong, OpenClaw cài đặt [Proxyline](https://github.com/openclaw/proxyline) làm môi trường định tuyến cấp tiến trình. Thành phần này hỗ trợ `fetch`, các máy khách dựa trên undici, `node:http`/`node:https`, các máy khách WebSocket phổ biến và các đường hầm `CONNECT` do trình trợ giúp tạo ra; đồng thời thay thế các tác nhân HTTP Node do bên gọi cung cấp để các tác nhân được chỉ định rõ ràng (bao gồm `axios`, `got`, `node-fetch` và các máy khách tương tự dựa trên tác nhân Node) không thể âm thầm bỏ qua proxy.

Lược đồ URL proxy mô tả chặng từ OpenClaw đến proxy, không phải đến đích cuối cùng:

- `http://proxy.example:3128` — TCP văn bản thuần đến proxy; OpenClaw gửi các yêu cầu proxy HTTP, bao gồm `CONNECT` cho các đích HTTPS.
- `https://proxy.example:8443` — OpenClaw mở TLS đến chính proxy (xác minh chứng chỉ của proxy), sau đó gửi các yêu cầu proxy HTTP bên trong phiên đó.

TLS của đích độc lập với TLS của điểm cuối proxy: đối với một đích HTTPS, OpenClaw luôn yêu cầu proxy tạo đường hầm `CONNECT` và khởi tạo TLS của đích thông qua đường hầm đó.

Trong khi proxy đang hoạt động, OpenClaw xóa `no_proxy`/`NO_PROXY`. Các danh sách bỏ qua này dựa trên đích; nếu giữ `localhost` hoặc `127.0.0.1` trong đó, các đích SSRF có thể hoàn toàn bỏ qua proxy. Khi tắt, OpenClaw khôi phục môi trường proxy trước đó và đặt lại trạng thái định tuyến đã lưu vào bộ nhớ đệm.

Một số plugin sở hữu phương thức truyền tải tùy chỉnh cần có kết nối proxy riêng ngay cả khi định tuyến cấp tiến trình đang hoạt động. Máy khách Bot API của Telegram sử dụng bộ điều phối undici HTTP/1 riêng và cũng tuân theo các biến môi trường proxy của tiến trình cùng cơ chế dự phòng `OPENCLAW_PROXY_URL`.

### Chế độ local loopback của Gateway

Các máy khách mặt phẳng điều khiển Gateway cục bộ thường kết nối đến một WebSocket local loopback như `ws://127.0.0.1:18789`. `proxy.loopbackMode` kiểm soát việc lưu lượng này có bỏ qua proxy được quản lý hay không:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

| Chế độ                   | Hành vi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gateway-only` (mặc định) | OpenClaw đăng ký thẩm quyền local loopback đang hoạt động của Gateway làm ngoại lệ kết nối trực tiếp, nhờ đó lưu lượng WebSocket Gateway cục bộ kết nối mà không qua proxy. Các cổng local loopback tùy chỉnh vẫn hoạt động vì ngoại lệ nhắm đến đúng máy chủ/cổng đã cấu hình. Plugin trình duyệt đi kèm đăng ký cùng loại ngoại lệ cho chính xác các URL WebSocket về trạng thái sẵn sàng CDP và DevTools cục bộ của các trình duyệt được quản lý do OpenClaw khởi chạy; nhà cung cấp nhúng bộ nhớ Ollama đi kèm có một đường dẫn trực tiếp được bảo vệ hẹp hơn dành cho chính xác nguồn nhúng local loopback cục bộ trên máy chủ đã cấu hình. |
| `proxy`                  | Không đăng ký ngoại lệ local loopback nào; lưu lượng local loopback của Gateway và Ollama đi qua proxy. Một proxy từ xa phải có khả năng định tuyến ngược về dịch vụ local loopback trên máy chủ OpenClaw (ví dụ: qua tên máy chủ, IP hoặc đường hầm có thể truy cập) — một proxy từ xa tiêu chuẩn phân giải `127.0.0.1`/`localhost` theo chính proxy đó, không phải theo máy chủ OpenClaw.                                                                                                                                                                                                                                                                                                 |
| `block`                  | OpenClaw từ chối các kết nối mặt phẳng điều khiển local loopback của Gateway và các kết nối nhúng local loopback Ollama được bảo vệ trước khi mở socket.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

Việc bỏ qua mặt phẳng điều khiển Gateway chỉ giới hạn ở `localhost` và các URL IP local loopback dạng ký tự — hãy sử dụng `ws://127.0.0.1:18789`, `ws://[::1]:18789` hoặc `ws://localhost:18789`. Các tên máy chủ khác được định tuyến như lưu lượng thông thường.

### Vùng chứa

Đối với các lệnh `openclaw --container ...`, OpenClaw chuyển tiếp `OPENCLAW_PROXY_URL` vào CLI tiến trình con nhắm đến vùng chứa khi biến này được đặt. URL phải có thể truy cập từ bên trong vùng chứa — `127.0.0.1` tại đó chỉ chính vùng chứa, không phải máy chủ. OpenClaw từ chối URL proxy local loopback cho các lệnh nhắm đến vùng chứa, trừ khi bạn đặt `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` để ghi đè rõ ràng bước kiểm tra đó.

## Các thuật ngữ proxy liên quan

- `proxy.enabled` / `proxy.proxyUrl` — định tuyến proxy chuyển tiếp ra ngoài cho lưu lượng khi chạy. Trang này.
- `gateway.auth.mode: "trusted-proxy"` — xác thực proxy ngược có nhận biết danh tính cho quyền truy cập Gateway từ bên ngoài. Xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).
- `openclaw proxy` — proxy gỡ lỗi cục bộ và trình kiểm tra dữ liệu thu thập dành cho phát triển và hỗ trợ. Xem [openclaw proxy](/vi/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — tùy chọn chủ động cho `web_fetch`, cho phép một proxy môi trường HTTP(S) do người vận hành kiểm soát phân giải DNS trong khi vẫn duy trì ghim DNS nghiêm ngặt và chính sách tên máy chủ theo mặc định. Xem [Tìm nạp web](/vi/tools/web-fetch#trusted-env-proxy).
- Các thiết lập proxy dành riêng cho kênh hoặc nhà cung cấp — các ghi đè dành riêng cho chủ sở hữu đối với một phương thức truyền tải. Ưu tiên proxy mạng được quản lý để kiểm soát tập trung lưu lượng ra trên toàn bộ môi trường chạy.

## Xác thực proxy

Chính sách đích của proxy là ranh giới bảo mật thực tế; OpenClaw không thể xác minh rằng proxy của bạn chặn đúng các đích. Hãy cấu hình proxy để:

- Chỉ liên kết với local loopback hoặc một giao diện riêng tư đáng tin cậy mà chỉ tiến trình/máy chủ/vùng chứa/tài khoản dịch vụ OpenClaw có thể truy cập.
- Tự phân giải đích và chặn theo IP sau khi phân giải DNS, tại thời điểm kết nối, cho cả HTTP văn bản thuần và các đường hầm HTTPS `CONNECT`.
- Từ chối các cơ chế bỏ qua dựa trên đích đối với các dải local loopback, riêng tư, liên kết cục bộ, siêu dữ liệu, multicast, dành riêng và tài liệu.
- Tránh dùng danh sách cho phép tên máy chủ trừ khi bạn hoàn toàn tin cậy đường dẫn phân giải DNS.
- Ghi nhật ký đích, quyết định, trạng thái và lý do — tuyệt đối không ghi nội dung yêu cầu, tiêu đề ủy quyền, cookie hoặc các bí mật khác.
- Duy trì chính sách trong hệ thống quản lý phiên bản và xem xét các thay đổi như những thay đổi nhạy cảm về bảo mật.

Xác thực từ cùng máy chủ/vùng chứa/tài khoản dịch vụ chạy OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Với điểm cuối proxy HTTPS sử dụng CA riêng:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Cờ                       | Mục đích                                                                 |
| ------------------------ | ------------------------------------------------------------------------ |
| `--proxy-url <url>`      | Xác thực URL này thay vì phân giải cấu hình/biến môi trường.             |
| `--proxy-ca-file <path>` | Gói CA cho điểm cuối proxy HTTPS.                                        |
| `--allowed-url <url>`    | Đích dự kiến truy cập thành công (có thể lặp lại).                        |
| `--denied-url <url>`     | Đích dự kiến bị chặn (có thể lặp lại).                                    |
| `--apns-reachable`       | Đồng thời xác minh proxy có thể tạo đường hầm cho phép thử HTTP/2 APNs sandbox trực tiếp. |
| `--apns-authority <url>` | Ghi đè authority APNs được thăm dò bằng `--apns-reachable`.               |
| `--timeout-ms <ms>`      | Thời gian chờ cho mỗi yêu cầu.                                            |
| `--json`                 | Đầu ra có thể đọc bằng máy.                                               |

Nếu `proxy.enabled` không phải là `true` và không cung cấp `--proxy-url`, lệnh sẽ báo cáo vấn đề cấu hình thay vì xác thực; hãy truyền `--proxy-url` để kiểm tra sơ bộ một lần trước khi thay đổi cấu hình.

Khi không có `--allowed-url`/`--denied-url`, các phép kiểm tra mặc định là: `https://example.com/` phải truy cập thành công và một máy chủ chim báo tạm thời trên local loopback mà proxy không được phép truy cập phải bị chặn. Phép kiểm tra loopback đạt yêu cầu khi xảy ra lỗi truyền tải hoặc khi nhận được phản hồi không phải 2xx và không chứa mã thông báo riêng theo từng lượt chạy của chim báo; phép kiểm tra thất bại khi nhận được phản hồi 2xx thiếu mã thông báo (một lần truy cập thành công ngoài dự kiến từ nguồn không phải chim báo) và đặc biệt khi bất kỳ phản hồi nào chứa mã thông báo khớp, vì điều đó chứng minh proxy thực sự đã chuyển tiếp một đích loopback mà lẽ ra phải từ chối. Các đích `--denied-url` tùy chỉnh không có mã thông báo chim báo như vậy, nên chúng áp dụng nguyên tắc đóng khi lỗi: bất kỳ phản hồi HTTP nào cũng được tính là có thể truy cập (thất bại), còn lỗi truyền tải được báo cáo là chưa thể kết luận thay vì đã chứng minh bị chặn, vì OpenClaw không thể xác nhận proxy của bạn đã từ chối một nguồn gốc có thể truy cập hay đã xảy ra lỗi khác. `--apns-reachable` gửi một mã thông báo nhà cung cấp cố ý không hợp lệ, vì vậy phản hồi `403 InvalidProviderToken` được xem là bằng chứng đường hầm đã kết nối tới Apple. Lệnh thoát với mã `1` khi có bất kỳ lỗi xác thực nào; thông tin xác thực trong URL proxy được che khỏi cả đầu ra văn bản và JSON.

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Kiểm tra thủ công bằng `curl` (yêu cầu công khai phải thành công; các yêu cầu loopback và siêu dữ liệu phải bị chính proxy chặn — chỉ riêng `curl` không thể phân biệt việc proxy từ chối với nguồn gốc không thể truy cập như chim báo tích hợp của `openclaw proxy validate`):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Các đích nên chặn

Danh sách từ chối ban đầu cho mọi proxy chuyển tiếp, tường lửa hoặc chính sách lưu lượng đi. Bộ phân loại SSRF riêng của OpenClaw nằm trong `src/infra/net/ssrf.ts` và `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, tiền tố đo kiểm RFC 2544 và cơ chế xử lý IPv4 nhúng cho các dạng NAT64/6to4/Teredo/ISATAP/IPv4-mapped) — đây là các tài liệu tham khảo hữu ích, nhưng OpenClaw không xuất hoặc thực thi các quy tắc này trong proxy bên ngoài của bạn.

| Dải hoặc máy chủ                                                                      | Lý do chặn                                                |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                             |
| `::1/128`                                                                            | IPv6 loopback                                             |
| `0.0.0.0/8`, `::/128`                                                                | Địa chỉ không xác định / mạng này                         |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Mạng riêng RFC 1918                                       |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local, bao gồm các đường dẫn siêu dữ liệu đám mây phổ biến |
| `169.254.169.254`, `metadata.google.internal`                                        | Dịch vụ siêu dữ liệu đám mây                              |
| `100.64.0.0/10`                                                                      | Không gian địa chỉ dùng chung của NAT cấp nhà mạng        |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Dải đo kiểm                                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Dải dùng cho mục đích đặc biệt và tài liệu                |
| `224.0.0.0/4`, `ff00::/8`                                                            | Đa hướng                                                  |
| `240.0.0.0/4`                                                                        | IPv4 dành riêng                                           |
| `fc00::/7`, `fec0::/10`                                                              | Dải IPv6 cục bộ/riêng                                     |
| `100::/64`, `2001:20::/28`                                                           | Dải loại bỏ IPv6 và ORCHIDv2                              |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Tiền tố NAT64 có IPv4 nhúng                               |
| `2002::/16`, `2001::/32`                                                             | 6to4 và Teredo có IPv4 nhúng                              |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 tương thích IPv4 và IPv6 ánh xạ IPv4                 |

Thêm mọi máy chủ siêu dữ liệu hoặc dải dành riêng khác được nhà cung cấp đám mây hay nền tảng mạng của bạn ghi trong tài liệu.

## Giới hạn

| Bề mặt                                                      | Trạng thái proxy được quản lý                                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fetch`, `node:http`, `node:https`, các máy khách WebSocket phổ biến | Được định tuyến qua các hook proxy được quản lý khi đã cấu hình.                                                                                              |
| HTTP/2 trực tiếp của APNs                                    | Được định tuyến qua trình trợ giúp `CONNECT` được quản lý của APNs.                                                                                           |
| Gateway loopback của mặt phẳng điều khiển                    | Chỉ kết nối trực tiếp đối với đúng URL Gateway local loopback đã cấu hình.                                                                                    |
| Chuyển tiếp ngược dòng của proxy gỡ lỗi                      | Bị vô hiệu hóa khi chế độ proxy được quản lý đang hoạt động, trừ khi được bật rõ ràng để chẩn đoán cục bộ.                                                    |
| IRC                                                          | TCP/TLS thô; không được chế độ proxy HTTP được quản lý chuyển tiếp. Đặt `channels.irc.enabled: false` nếu môi trường triển khai yêu cầu mọi lưu lượng đi phải qua proxy chuyển tiếp. |
| Các lệnh gọi máy khách `net`, `tls` hoặc `http2` thô khác    | Phải được bộ bảo vệ socket thô phân loại trước khi được hợp nhất.                                                                                            |

- Đây là phạm vi bao phủ ở cấp tiến trình cho các máy khách HTTP/WebSocket JavaScript, không phải sandbox mạng ở cấp hệ điều hành.
- Các socket `net`, `tls`, `http2` thô, addon gốc và tiến trình con không thuộc OpenClaw có thể bỏ qua định tuyến cấp Node, trừ khi chúng kế thừa và tuân thủ các biến môi trường proxy. Các CLI con của OpenClaw được fork sẽ kế thừa URL proxy được quản lý và trạng thái `proxy.loopbackMode`.
- WebUI cục bộ của người dùng và các máy chủ mô hình cục bộ không được bao phủ bởi cơ chế bỏ qua mạng cục bộ tổng quát — hãy thêm chúng vào danh sách cho phép trong chính sách proxy của người vận hành nếu cần. Ngoại lệ là đường dẫn trực tiếp có bảo vệ của nhà cung cấp embedding bộ nhớ Ollama đi kèm, được giới hạn ở đúng nguồn gốc host-local loopback từ `baseUrl` đã cấu hình; các máy chủ Ollama trên LAN, tailnet, mạng riêng và mạng công khai vẫn sử dụng proxy được quản lý.
- Chức năng chuyển tiếp ngược dòng trực tiếp của proxy gỡ lỗi cục bộ (cho các yêu cầu proxy và đường hầm `CONNECT`) mặc định bị vô hiệu hóa khi chế độ proxy được quản lý đang hoạt động; chỉ bật chức năng này cho các chẩn đoán cục bộ đã được phê duyệt.
- OpenClaw không kiểm tra, thử nghiệm hoặc chứng nhận chính sách proxy của bạn. Hãy xem các thay đổi chính sách proxy là những thay đổi vận hành nhạy cảm về bảo mật.
