---
read_when:
    - Chạy OpenClaw phía sau proxy nhận biết danh tính
    - Thiết lập Pomerium, Caddy hoặc nginx với OAuth ở phía trước OpenClaw
    - Khắc phục lỗi WebSocket 1008 không được ủy quyền khi thiết lập proxy ngược
    - Quyết định nơi thiết lập HSTS và các tiêu đề tăng cường bảo mật HTTP khác
sidebarTitle: Trusted proxy auth
summary: Ủy quyền xác thực Gateway cho một proxy ngược đáng tin cậy (Pomerium, Caddy, nginx + OAuth)
title: Xác thực proxy đáng tin cậy
x-i18n:
    generated_at: "2026-07-12T08:00:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Tính năng nhạy cảm về bảo mật.** Chế độ này giao toàn bộ việc xác thực cho proxy ngược của bạn. Cấu hình sai có thể khiến Gateway của bạn bị truy cập trái phép. Hãy đọc kỹ trang này trước khi bật.
</Warning>

## Khi nào nên sử dụng

- Bạn chạy OpenClaw phía sau một **proxy nhận biết danh tính** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + xác thực chuyển tiếp).
- Proxy của bạn xử lý toàn bộ việc xác thực và chuyển danh tính người dùng qua các header.
- Bạn đang sử dụng môi trường Kubernetes hoặc container, trong đó proxy là đường dẫn duy nhất đến Gateway.
- Bạn gặp lỗi WebSocket `1008 unauthorized` vì trình duyệt không thể chuyển token trong tải trọng WS.

## Khi nào KHÔNG nên sử dụng

- Proxy của bạn không xác thực người dùng (chỉ là điểm kết cuối TLS hoặc bộ cân bằng tải).
- Có bất kỳ đường dẫn nào đến Gateway bỏ qua proxy (lỗ hổng tường lửa, quyền truy cập từ mạng nội bộ).
- Bạn không chắc proxy có loại bỏ/ghi đè chính xác các header được chuyển tiếp hay không.
- Bạn chỉ cần quyền truy cập cá nhân cho một người dùng (thay vào đó, hãy cân nhắc Tailscale Serve + loopback).

## Cách hoạt động

<Steps>
  <Step title="Proxy xác thực người dùng">
    Proxy ngược của bạn xác thực người dùng (OAuth, OIDC, SAML, v.v.).
  </Step>
  <Step title="Proxy thêm header danh tính">
    Proxy thêm một header chứa danh tính người dùng đã xác thực (ví dụ: `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway xác minh nguồn đáng tin cậy">
    OpenClaw kiểm tra rằng yêu cầu đến từ một **địa chỉ IP proxy đáng tin cậy** (`gateway.trustedProxies`) và không phải từ địa chỉ loopback hoặc giao diện cục bộ của chính Gateway.
  </Step>
  <Step title="Gateway trích xuất danh tính">
    OpenClaw đọc các header bắt buộc, sau đó đọc danh tính người dùng từ header đã cấu hình.
  </Step>
  <Step title="Cấp quyền">
    Nếu mọi bước kiểm tra đều hợp lệ và người dùng vượt qua `allowUsers` (khi được thiết lập), yêu cầu sẽ được cấp quyền.
  </Step>
</Steps>

## Cấu hình

```json5
{
  gateway: {
    // Xác thực qua proxy đáng tin cậy mặc định yêu cầu IP nguồn của proxy không phải loopback
    bind: "lan",

    // CỰC KỲ QUAN TRỌNG: Chỉ thêm (các) IP của proxy vào đây
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header chứa danh tính người dùng đã xác thực (bắt buộc)
        userHeader: "x-forwarded-user",

        // Tùy chọn: các header BẮT BUỘC phải có (xác minh proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Tùy chọn: giới hạn ở những người dùng cụ thể (trống = cho phép tất cả)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Tùy chọn: cho phép proxy loopback trên cùng máy chủ sau khi chủ động bật
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Quy tắc thời gian chạy, theo thứ tự đánh giá**

1. IP nguồn của yêu cầu phải khớp với `gateway.trustedProxies` (có hỗ trợ CIDR), nếu không yêu cầu sẽ bị từ chối (`trusted_proxy_untrusted_source`).
2. Các yêu cầu có nguồn loopback (`127.0.0.1`, `::1`) bị từ chối, trừ khi `gateway.auth.trustedProxy.allowLoopback = true` và địa chỉ loopback cũng nằm trong `trustedProxies` (`trusted_proxy_loopback_source`). Bước kiểm tra này chạy trước các bước kiểm tra header, vì vậy nguồn loopback sẽ thất bại theo cách này ngay cả khi các header bắt buộc cũng bị thiếu.
3. Các nguồn không phải loopback khớp với một trong các địa chỉ giao diện mạng cục bộ của máy chủ Gateway sẽ bị từ chối để ngăn giả mạo (`trusted_proxy_local_interface_source`). Nếu chính việc phát hiện giao diện thất bại, yêu cầu cũng bị từ chối (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` và `userHeader` phải hiện diện và không được để trống.
5. Nếu `allowUsers` không trống, danh sách này phải chứa người dùng được trích xuất.

**Bằng chứng từ header chuyển tiếp ghi đè tính cục bộ của loopback đối với cơ chế dự phòng trực tiếp cục bộ.** Nếu một yêu cầu đến qua loopback nhưng mang header `Forwarded`, bất kỳ header `X-Forwarded-*` nào hoặc header `X-Real-IP`, bằng chứng đó sẽ khiến yêu cầu không đủ điều kiện sử dụng cơ chế dự phòng bằng mật khẩu trực tiếp cục bộ và cơ chế kiểm soát theo danh tính thiết bị, dù yêu cầu vẫn thất bại trong xác thực qua proxy đáng tin cậy vì đến từ loopback.

`allowLoopback` đặt mức tin cậy vào các tiến trình cục bộ trên máy chủ Gateway ngang với proxy ngược. Chỉ bật tùy chọn này khi Gateway vẫn được tường lửa bảo vệ khỏi truy cập trực tiếp từ xa và proxy cục bộ loại bỏ hoặc ghi đè các header danh tính do máy khách cung cấp.

Các máy khách Gateway nội bộ không đi qua proxy ngược nên sử dụng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, thay vì các header danh tính của proxy đáng tin cậy. Các triển khai Control UI không qua loopback vẫn cần khai báo rõ `gateway.controlUi.allowedOrigins`.
</Warning>

### Tham chiếu cấu hình

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Mảng các địa chỉ IP proxy (hoặc CIDR) cần tin cậy. Yêu cầu từ các IP khác sẽ bị từ chối.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Phải là `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Tên header chứa danh tính người dùng đã xác thực.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Các header bổ sung phải hiện diện để yêu cầu được xem là đáng tin cậy.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Danh sách cho phép các danh tính người dùng. Danh sách trống có nghĩa là cho phép tất cả người dùng đã xác thực.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Hỗ trợ tùy chọn cho các proxy ngược loopback trên cùng máy chủ.
</ParamField>

<Warning>
Chỉ bật `allowLoopback` khi proxy ngược cục bộ là ranh giới tin cậy dự kiến. Bất kỳ tiến trình cục bộ nào có thể kết nối đến Gateway đều có thể thử gửi các header danh tính proxy, vì vậy hãy giữ quyền truy cập trực tiếp vào Gateway ở chế độ riêng tư trong máy chủ và yêu cầu các header do proxy quản lý như `x-forwarded-proto`, hoặc một header xác nhận có chữ ký nếu proxy của bạn hỗ trợ.
</Warning>

## Hành vi ghép nối Control UI

Khi `gateway.auth.mode = "trusted-proxy"` đang hoạt động và yêu cầu vượt qua các bước kiểm tra proxy đáng tin cậy, các phiên WebSocket của Control UI có thể kết nối mà không cần danh tính ghép nối thiết bị.

Các hệ quả về phạm vi:

- Các phiên WebSocket Control UI không có thiết bị có thể kết nối nhưng mặc định không nhận được phạm vi vận hành nào. OpenClaw xóa danh sách phạm vi được yêu cầu thành `[]` để một phiên không liên kết với thiết bị/token đã ghép nối và phê duyệt không thể tự khai báo quyền.
- Nếu các phương thức thất bại với lỗi `missing scope` sau khi kết nối WebSocket thành công, hãy sử dụng HTTPS để trình duyệt có thể tạo danh tính thiết bị và hoàn tất ghép nối. Xem [HTTP không an toàn của Control UI](/vi/web/control-ui#insecure-http).
- Chỉ dùng trong tình huống khẩn cấp: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` giữ nguyên các phạm vi được yêu cầu ngay cả khi không có danh tính thiết bị. Đây là một sự suy giảm bảo mật nghiêm trọng; hãy khôi phục nhanh chóng. Xem [HTTP không an toàn của Control UI](/vi/web/control-ui#insecure-http).

Giới hạn phạm vi qua proxy ngược: nếu proxy của bạn gửi `x-openclaw-scopes` trong yêu cầu nâng cấp WebSocket của Control UI, OpenClaw giới hạn phạm vi phiên thành phần giao giữa các phạm vi được yêu cầu và các phạm vi đã khai báo. Header này không cấp phạm vi; nó chỉ thu hẹp những phạm vi mà phiên có thể giữ.

Các hệ quả:

- Ghép nối không còn là cổng kiểm soát chính đối với quyền truy cập Control UI trong chế độ này.
- Chính sách xác thực của proxy ngược và `allowUsers` trở thành cơ chế kiểm soát truy cập có hiệu lực.
- Chỉ cho phép lưu lượng vào Gateway từ các IP proxy đáng tin cậy (`gateway.trustedProxies` + tường lửa).

Các máy khách WebSocket tùy chỉnh không phải là phiên Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` không cấp phạm vi cho các máy khách tùy ý có `client.mode: "backend"` hoặc mang hình thức CLI. Tác vụ tự động hóa tùy chỉnh nên sử dụng danh tính thiết bị/ghép nối, đường dẫn trợ giúp backend trực tiếp cục bộ dành riêng `client.id: "gateway-client"`, hoặc [plugin RPC HTTP quản trị](/vi/plugins/admin-http-rpc) khi giao diện yêu cầu/phản hồi HTTP phù hợp hơn.

## Header phạm vi vận hành

Xác thực qua proxy đáng tin cậy là một chế độ HTTP **mang danh tính**, vì vậy bên gọi có thể tùy chọn khai báo các phạm vi vận hành bằng `x-openclaw-scopes` trong các yêu cầu API HTTP.

Lưu ý: Phạm vi WebSocket được xác định bởi quá trình bắt tay giao thức Gateway và liên kết danh tính thiết bị. Trong các yêu cầu nâng cấp WebSocket của Control UI, `x-openclaw-scopes` chỉ giới hạn các phạm vi phiên đã thương lượng, không cấp phạm vi. Xem [Hành vi ghép nối Control UI](#control-ui-pairing-behavior).

Ví dụ:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Hành vi:

- Khi header hiện diện, OpenClaw tôn trọng tập hợp phạm vi đã khai báo.
- Khi header hiện diện nhưng trống, yêu cầu khai báo **không có** phạm vi vận hành nào.
- Khi header vắng mặt, các API HTTP mang danh tính thông thường sử dụng tập hợp phạm vi vận hành mặc định tiêu chuẩn (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Theo mặc định, **các tuyến HTTP của plugin** có xác thực Gateway bị giới hạn hơn: khi `x-openclaw-scopes` vắng mặt, phạm vi thời gian chạy của chúng chỉ mặc định là `operator.write`.
- Các yêu cầu HTTP có nguồn gốc từ trình duyệt vẫn phải vượt qua `gateway.controlUi.allowedOrigins` (hoặc chế độ dự phòng header Host được chủ động thiết lập), ngay cả sau khi xác thực qua proxy đáng tin cậy thành công.

Quy tắc thực tế: hãy gửi rõ `x-openclaw-scopes` khi bạn muốn một yêu cầu qua proxy đáng tin cậy có phạm vi hẹp hơn giá trị mặc định, hoặc khi một tuyến plugin có xác thực Gateway cần quyền mạnh hơn phạm vi ghi.

## Kết cuối TLS và HSTS

Sử dụng một điểm kết cuối TLS và áp dụng HSTS tại đó.

<Tabs>
  <Tab title="Kết cuối TLS tại proxy (khuyến nghị)">
    Khi proxy ngược xử lý HTTPS cho `https://control.example.com`, hãy thiết lập `Strict-Transport-Security` tại proxy cho miền đó.

    - Phù hợp với các triển khai hướng ra Internet.
    - Giữ chính sách chứng chỉ + tăng cường bảo mật HTTP ở một nơi.
    - OpenClaw có thể tiếp tục sử dụng HTTP loopback phía sau proxy.

    Giá trị header mẫu:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Kết cuối TLS tại Gateway">
    Nếu chính OpenClaw trực tiếp phục vụ HTTPS (không có proxy kết cuối TLS), hãy thiết lập:

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` chấp nhận một giá trị header dạng chuỗi, hoặc `false` để tắt rõ ràng.

  </Tab>
</Tabs>

### Hướng dẫn triển khai

- Ban đầu hãy sử dụng thời hạn tối đa ngắn (ví dụ: `max-age=300`) trong khi xác thực lưu lượng.
- Chỉ tăng lên giá trị dài hạn (ví dụ: `max-age=31536000`) sau khi đã có độ tin cậy cao.
- Chỉ thêm `includeSubDomains` nếu mọi miền con đều sẵn sàng cho HTTPS.
- Chỉ sử dụng tính năng nạp sẵn nếu bạn chủ động đáp ứng các yêu cầu nạp sẵn cho toàn bộ tập hợp miền.
- Môi trường phát triển cục bộ chỉ dùng loopback không hưởng lợi từ HSTS.

## Ví dụ thiết lập proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium chuyển danh tính trong `x-pomerium-claim-email` (hoặc các header xác nhận khác) và một JWT trong `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP của Pomerium
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Đoạn cấu hình Pomerium:

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="Caddy với OAuth">
    Caddy cùng plugin `caddy-security` có thể xác thực người dùng và chuyển các header danh tính.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Đoạn cấu hình Caddyfile:

    ```caddy
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy xác thực người dùng và truyền danh tính trong `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    Đoạn cấu hình nginx:

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="Traefik with forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Cấu hình token hỗn hợp

Gateway sẽ từ chối khởi động với xác thực proxy tin cậy nếu đồng thời có cấu hình token dùng chung (`gateway.auth.token` hoặc `OPENCLAW_GATEWAY_TOKEN`). Hai cơ chế này loại trừ lẫn nhau vì token dùng chung sẽ cho phép các trình gọi trên cùng máy chủ xác thực qua một đường dẫn hoàn toàn khác với danh tính đã được proxy xác minh mà chế độ này được thiết kế để thực thi.

Nếu quá trình khởi động thất bại với lỗi như `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Xóa token dùng chung khi sử dụng chế độ proxy tin cậy, hoặc
- Chuyển `gateway.auth.mode` sang `"token"` nếu bạn muốn dùng xác thực dựa trên token.

Các tiêu đề danh tính proxy tin cậy qua local loopback vẫn áp dụng cơ chế từ chối mặc định: các trình gọi trên cùng máy chủ không được âm thầm xác thực thành người dùng proxy. Thay vào đó, các trình gọi nội bộ của OpenClaw bỏ qua proxy có thể xác thực bằng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Cơ chế dự phòng bằng token vẫn chủ ý không được hỗ trợ trong chế độ proxy tin cậy.

## Danh sách kiểm tra bảo mật

Trước khi bật xác thực proxy tin cậy, hãy xác minh:

- [ ] **Proxy là đường dẫn duy nhất**: Cổng Gateway được tường lửa chặn với mọi nguồn ngoại trừ proxy của bạn.
- [ ] **trustedProxies được giới hạn tối thiểu**: Chỉ gồm các địa chỉ IP proxy thực tế, không phải toàn bộ mạng con.
- [ ] **Nguồn proxy local loopback là có chủ đích**: Xác thực proxy tin cậy áp dụng cơ chế từ chối mặc định đối với yêu cầu có nguồn từ loopback, trừ khi `gateway.auth.trustedProxy.allowLoopback` được bật rõ ràng cho proxy trên cùng máy chủ.
- [ ] **Proxy loại bỏ tiêu đề**: Proxy của bạn ghi đè (không nối thêm) các tiêu đề `x-forwarded-*` từ máy khách.
- [ ] **Kết thúc TLS**: Proxy của bạn xử lý TLS; người dùng kết nối qua HTTPS.
- [ ] **allowedOrigins được khai báo rõ ràng**: Control UI không chạy qua loopback sử dụng `gateway.controlUi.allowedOrigins` được khai báo rõ ràng.
- [ ] **allowUsers đã được thiết lập** (khuyến nghị): Chỉ cho phép người dùng đã biết thay vì cho phép bất kỳ ai đã xác thực.
- [ ] **Không có cấu hình token hỗn hợp**: Không thiết lập đồng thời `gateway.auth.token` và `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Mật khẩu dự phòng cục bộ được giữ kín**: Nếu bạn cấu hình `gateway.auth.password` cho các trình gọi trực tiếp nội bộ, hãy dùng tường lửa bảo vệ cổng Gateway để máy khách từ xa không qua proxy không thể truy cập trực tiếp.

## Kiểm tra bảo mật

`openclaw security audit` gắn cờ xác thực proxy tin cậy với phát hiện có mức độ nghiêm trọng **nghiêm trọng nhất**. Đây là hành vi có chủ đích; nó nhắc bạn rằng bảo mật đang được ủy quyền cho cấu hình proxy.

Quá trình kiểm tra xem xét:

- Cảnh báo/lời nhắc nghiêm trọng nhất cơ sở `gateway.trusted_proxy_auth`.
- Thiếu cấu hình `trustedProxies`.
- Thiếu cấu hình `userHeader`.
- `allowUsers` rỗng (cho phép mọi người dùng đã xác thực).
- Đã bật `allowLoopback` cho các nguồn proxy trên cùng máy chủ.

Các phát hiện riêng biệt, không dành riêng cho proxy tin cậy, cũng được áp dụng mỗi khi Control UI được công khai: `gateway.controlUi.allowedOrigins` dùng ký tự đại diện hoặc bị thiếu, và cơ chế dự phòng nguồn gốc dựa trên tiêu đề Host.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Yêu cầu không đến từ địa chỉ IP thuộc `gateway.trustedProxies`. Hãy kiểm tra:

    - Địa chỉ IP của proxy có chính xác không? (Địa chỉ IP của container Docker có thể thay đổi.)
    - Có bộ cân bằng tải nào đứng trước proxy của bạn không?
    - Sử dụng `docker inspect` hoặc `kubectl get pods -o wide` để tìm địa chỉ IP thực tế.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw đã từ chối một yêu cầu proxy tin cậy có nguồn từ loopback.

    Hãy kiểm tra:

    - Proxy có đang kết nối từ `127.0.0.1` / `::1` không?
    - Bạn có đang cố sử dụng xác thực proxy tin cậy với reverse proxy local loopback trên cùng máy chủ không?

    Cách khắc phục:

    - Ưu tiên xác thực bằng token/mật khẩu cho các máy khách nội bộ trên cùng máy chủ không đi qua proxy, hoặc
    - Định tuyến qua địa chỉ proxy tin cậy không phải loopback và giữ địa chỉ IP đó trong `gateway.trustedProxies`, hoặc
    - Với reverse proxy có chủ đích trên cùng máy chủ, hãy thiết lập `gateway.auth.trustedProxy.allowLoopback = true`, giữ địa chỉ loopback trong `gateway.trustedProxies` và đảm bảo proxy loại bỏ hoặc ghi đè các tiêu đề danh tính.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    Địa chỉ IP nguồn của yêu cầu khớp với một trong các địa chỉ giao diện mạng không phải loopback của chính máy chủ Gateway (không phải proxy); đây là cơ chế bảo vệ chống lưu lượng giả mạo trên cùng máy chủ qua tailnet hoặc mạng bridge của Docker. `..._check_failed` nghĩa là chính quá trình phát hiện giao diện đã gặp lỗi, vì vậy OpenClaw áp dụng cơ chế từ chối mặc định.

    Hãy kiểm tra:

    - Có tiến trình nào trên chính máy chủ Gateway đang gửi trực tiếp các tiêu đề danh tính và bỏ qua proxy không?
    - Proxy có chạy trong cùng không gian tên mạng với Gateway, với địa chỉ IP cũng xuất hiện dưới dạng giao diện cục bộ không?

    Cách khắc phục: định tuyến lưu lượng proxy qua một địa chỉ không đồng thời được liên kết cục bộ bởi máy chủ Gateway, hoặc chỉ sử dụng `allowLoopback` cho cấu hình proxy thực sự nằm trên cùng máy chủ.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Tiêu đề người dùng bị trống hoặc thiếu. Hãy kiểm tra:

    - Proxy của bạn có được cấu hình để truyền các tiêu đề danh tính không?
    - Tên tiêu đề có chính xác không? (Không phân biệt chữ hoa chữ thường, nhưng chính tả phải đúng.)
    - Người dùng đã thực sự được xác thực tại proxy chưa?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Thiếu một tiêu đề bắt buộc. Hãy kiểm tra:

    - Cấu hình proxy cho các tiêu đề cụ thể đó.
    - Liệu các tiêu đề có đang bị loại bỏ ở đâu đó trong chuỗi hay không.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Người dùng đã được xác thực nhưng không nằm trong `allowUsers`. Hãy thêm họ hoặc xóa danh sách cho phép.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` là `"trusted-proxy"` nhưng `gateway.trustedProxies` rỗng, hoặc chính `gateway.auth.trustedProxy` bị thiếu. Mọi yêu cầu đều bị từ chối cho đến khi cả hai được thiết lập.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Xác thực proxy tin cậy đã thành công, nhưng tiêu đề `Origin` của trình duyệt không vượt qua bước kiểm tra nguồn gốc của Control UI.

    Hãy kiểm tra:

    - `gateway.controlUi.allowedOrigins` bao gồm chính xác nguồn gốc của trình duyệt.
    - Bạn không dựa vào nguồn gốc dùng ký tự đại diện, trừ khi chủ ý cho phép tất cả.
    - Nếu chủ ý sử dụng chế độ dự phòng dựa trên tiêu đề Host, hãy đảm bảo `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` được thiết lập có chủ đích.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket kết nối thành công, nhưng `chat.history`, `sessions.list` hoặc
    `models.list` thất bại với `missing scope: operator.read`.

    Nguyên nhân thường gặp:

    - Phiên Control UI không có thiết bị: xác thực proxy tin cậy có thể cho phép kết nối WebSocket mà không cần danh tính thiết bị, nhưng theo thiết kế, OpenClaw sẽ xóa các phạm vi của phiên không có thiết bị.
    - Máy khách phần phụ trợ tùy chỉnh: `gateway.controlUi.dangerouslyDisableDeviceAuth` chỉ áp dụng cho Control UI và không cấp phạm vi cho các máy khách WebSocket phần phụ trợ tùy ý hoặc có dạng CLI.
    - `x-openclaw-scopes` quá hạn chế: nếu proxy của bạn chèn tiêu đề này vào yêu cầu nâng cấp WebSocket của Control UI, phạm vi phiên sẽ bị giới hạn trong tập hợp đó. Giá trị tiêu đề rỗng sẽ không cấp phạm vi nào.

    Cách khắc phục:

    - Với Control UI, hãy sử dụng HTTPS để trình duyệt có thể tạo danh tính thiết bị và hoàn tất ghép nối.
    - Với tự động hóa tùy chỉnh, hãy sử dụng danh tính thiết bị/ghép nối, đường dẫn trình trợ giúp phần phụ trợ trực tiếp cục bộ dành riêng cho `gateway-client`, hoặc [RPC HTTP quản trị](/vi/plugins/admin-http-rpc).
    - Chỉ sử dụng `gateway.controlUi.dangerouslyDisableDeviceAuth: true` như một phương án khẩn cấp tạm thời cho Control UI.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Đảm bảo proxy của bạn:

    - Hỗ trợ nâng cấp WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Truyền các tiêu đề danh tính trong yêu cầu nâng cấp WebSocket (không chỉ HTTP).
    - Không có đường dẫn xác thực riêng cho kết nối WebSocket.

  </Accordion>
</AccordionGroup>

## Di chuyển từ xác thực bằng token

<Steps>
  <Step title="Configure the proxy">
    Cấu hình proxy để xác thực người dùng và truyền các tiêu đề.
  </Step>
  <Step title="Test the proxy independently">
    Kiểm thử độc lập cấu hình proxy (dùng curl với các tiêu đề).
  </Step>
  <Step title="Update OpenClaw config">
    Cập nhật cấu hình OpenClaw để sử dụng xác thực proxy tin cậy.
  </Step>
  <Step title="Restart the Gateway">
    Khởi động lại Gateway.
  </Step>
  <Step title="Test WebSocket">
    Kiểm thử kết nối WebSocket từ Control UI.
  </Step>
  <Step title="Audit">
    Chạy `openclaw security audit` và xem xét các phát hiện.
  </Step>
</Steps>

## Liên quan

- [Cấu hình](/vi/gateway/configuration) — tài liệu tham khảo cấu hình
- [Phạm vi của người vận hành](/vi/gateway/operator-scopes) — vai trò, phạm vi và các bước kiểm tra phê duyệt
- [Truy cập từ xa](/vi/gateway/remote) — các mô hình truy cập từ xa khác
- [Bảo mật](/vi/gateway/security) — hướng dẫn bảo mật đầy đủ
- [Tailscale](/vi/gateway/tailscale) — phương án thay thế đơn giản hơn cho quyền truy cập chỉ trong tailnet
