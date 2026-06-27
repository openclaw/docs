---
read_when:
    - Chạy OpenClaw phía sau proxy nhận biết danh tính
    - Thiết lập Pomerium, Caddy hoặc nginx với OAuth trước OpenClaw
    - Khắc phục lỗi WebSocket 1008 không được ủy quyền với các thiết lập proxy ngược
    - Quyết định nơi đặt HSTS và các header tăng cường bảo mật HTTP khác
sidebarTitle: Trusted proxy auth
summary: Ủy quyền xác thực Gateway cho một reverse proxy đáng tin cậy (Pomerium, Caddy, nginx + OAuth)
title: Xác thực proxy đáng tin cậy
x-i18n:
    generated_at: "2026-06-27T17:33:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Tính năng nhạy cảm về bảo mật.** Chế độ này ủy quyền xác thực hoàn toàn cho reverse proxy của bạn. Cấu hình sai có thể khiến Gateway của bạn bị truy cập trái phép. Hãy đọc kỹ trang này trước khi bật.
</Warning>

## Khi nào nên dùng

Dùng chế độ xác thực `trusted-proxy` khi:

- Bạn chạy OpenClaw phía sau một **proxy nhận biết danh tính** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Proxy của bạn xử lý toàn bộ xác thực và truyền danh tính người dùng qua header.
- Bạn đang ở trong môi trường Kubernetes hoặc container, nơi proxy là đường dẫn duy nhất tới Gateway.
- Bạn gặp lỗi WebSocket `1008 unauthorized` vì trình duyệt không thể truyền token trong payload WS.

## Khi nào KHÔNG nên dùng

- Nếu proxy của bạn không xác thực người dùng (chỉ là TLS terminator hoặc load balancer).
- Nếu có bất kỳ đường dẫn nào tới Gateway bỏ qua proxy (lỗ hổng firewall, truy cập mạng nội bộ).
- Nếu bạn không chắc proxy có loại bỏ/ghi đè chính xác các header được chuyển tiếp hay không.
- Nếu bạn chỉ cần truy cập cá nhân cho một người dùng (hãy cân nhắc Tailscale Serve + loopback để thiết lập đơn giản hơn).

## Cách hoạt động

<Steps>
  <Step title="Proxy xác thực người dùng">
    Reverse proxy của bạn xác thực người dùng (OAuth, OIDC, SAML, v.v.).
  </Step>
  <Step title="Proxy thêm header danh tính">
    Proxy thêm một header chứa danh tính người dùng đã xác thực (ví dụ: `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway xác minh nguồn tin cậy">
    OpenClaw kiểm tra rằng yêu cầu đến từ một **IP proxy tin cậy** (được cấu hình trong `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway trích xuất danh tính">
    OpenClaw trích xuất danh tính người dùng từ header đã cấu hình.
  </Step>
  <Step title="Ủy quyền">
    Nếu mọi kiểm tra đều hợp lệ, yêu cầu được ủy quyền.
  </Step>
</Steps>

## Hành vi ghép đôi của Control UI

Khi `gateway.auth.mode = "trusted-proxy"` đang hoạt động và yêu cầu vượt qua các kiểm tra trusted-proxy, các phiên WebSocket của Control UI có thể kết nối mà không cần danh tính ghép đôi thiết bị.

Hệ quả về phạm vi:

- Các phiên WebSocket Control UI không có thiết bị vẫn kết nối, nhưng theo mặc định không nhận phạm vi operator nào. OpenClaw xóa danh sách phạm vi được yêu cầu thành `[]` để một phiên không gắn với thiết bị/token đã ghép đôi được phê duyệt không thể tự khai báo quyền.
- Nếu các phương thức thất bại với `missing scope` sau khi kết nối WebSocket thành công, hãy dùng HTTPS để trình duyệt có thể tạo danh tính thiết bị và hoàn tất ghép đôi. Xem [HTTP không an toàn của Control UI](/vi/web/control-ui#insecure-http).
- Chỉ dùng trong tình huống khẩn cấp: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` giữ lại các phạm vi được yêu cầu ngay cả khi không có danh tính thiết bị. Đây là mức suy giảm bảo mật nghiêm trọng; hãy hoàn tác nhanh chóng. Xem [HTTP không an toàn của Control UI](/vi/web/control-ui#insecure-http).

Giới hạn phạm vi bởi reverse proxy:

- Nếu proxy của bạn gửi `x-openclaw-scopes` trên yêu cầu nâng cấp WebSocket của Control UI, OpenClaw giới hạn phạm vi phiên vào phần giao giữa các phạm vi được yêu cầu và các phạm vi đã khai báo. Header này không cấp phạm vi; nó chỉ thu hẹp phạm vi mà phiên có thể giữ.

Hệ quả:

- Ghép đôi không còn là cổng kiểm soát chính cho quyền truy cập Control UI trong chế độ này.
- Chính sách xác thực của reverse proxy và `allowUsers` trở thành cơ chế kiểm soát truy cập thực tế.
- Chỉ cho phép Gateway ingress từ các IP proxy tin cậy (`gateway.trustedProxies` + firewall).

Client WebSocket tùy chỉnh không phải là phiên Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` không cấp phạm vi cho các client tùy ý có dạng `client.mode: "backend"` hoặc CLI. Tự động hóa tùy chỉnh nên dùng danh tính thiết bị/ghép đôi, đường dẫn helper backend direct-local dành riêng `client.id: "gateway-client"`, hoặc [Plugin admin HTTP RPC](/vi/plugins/admin-http-rpc) khi bề mặt yêu cầu/phản hồi HTTP phù hợp hơn.

## Cấu hình

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Quy tắc runtime quan trọng**

- Xác thực trusted-proxy mặc định từ chối các yêu cầu có nguồn loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Reverse proxy loopback cùng host **không** đáp ứng xác thực trusted-proxy trừ khi bạn đặt rõ `gateway.auth.trustedProxy.allowLoopback = true` và đưa địa chỉ loopback vào `gateway.trustedProxies`.
- `allowLoopback` tin cậy các tiến trình cục bộ trên host Gateway ở cùng mức với reverse proxy. Chỉ bật khi Gateway vẫn được firewall chặn khỏi truy cập từ xa trực tiếp và proxy cục bộ loại bỏ hoặc ghi đè các header danh tính do client cung cấp.
- Client Gateway nội bộ không đi qua reverse proxy nên dùng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, không dùng header danh tính trusted-proxy.
- Các triển khai Control UI không phải loopback vẫn cần `gateway.controlUi.allowedOrigins` rõ ràng.
- **Bằng chứng forwarded-header ghi đè tính cục bộ loopback cho fallback trực tiếp cục bộ.** Nếu một yêu cầu đến qua loopback nhưng mang bằng chứng header `Forwarded`, bất kỳ `X-Forwarded-*`, hoặc `X-Real-IP`, bằng chứng đó sẽ loại fallback mật khẩu local-direct và cơ chế kiểm soát danh tính thiết bị. Với `allowLoopback: true`, xác thực trusted-proxy vẫn có thể chấp nhận yêu cầu như một yêu cầu proxy cùng host, trong khi `requiredHeaders` và `allowUsers` tiếp tục được áp dụng.

</Warning>

### Tham chiếu cấu hình

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Mảng địa chỉ IP proxy cần tin cậy. Yêu cầu từ các IP khác sẽ bị từ chối.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Phải là `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Tên header chứa danh tính người dùng đã xác thực.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Các header bổ sung phải có mặt để yêu cầu được tin cậy.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Danh sách cho phép các danh tính người dùng. Rỗng nghĩa là cho phép tất cả người dùng đã xác thực.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Hỗ trợ opt-in cho reverse proxy loopback cùng host. Mặc định là `false`.
</ParamField>

<Warning>
Chỉ bật `allowLoopback` khi reverse proxy cục bộ là ranh giới tin cậy dự định. Bất kỳ tiến trình cục bộ nào có thể kết nối tới Gateway đều có thể cố gửi header danh tính proxy, vì vậy hãy giữ quyền truy cập Gateway trực tiếp ở phạm vi riêng tư trên host và yêu cầu các header do proxy sở hữu như `x-forwarded-proto` hoặc header xác nhận đã ký khi proxy của bạn hỗ trợ.
</Warning>

## TLS termination và HSTS

Dùng một điểm TLS termination và áp dụng HSTS tại đó.

<Tabs>
  <Tab title="TLS termination tại proxy (khuyến nghị)">
    Khi reverse proxy của bạn xử lý HTTPS cho `https://control.example.com`, hãy đặt `Strict-Transport-Security` tại proxy cho domain đó.

    - Phù hợp với các triển khai hướng ra internet.
    - Giữ chứng chỉ + chính sách tăng cường bảo mật HTTP ở một nơi.
    - OpenClaw có thể tiếp tục dùng HTTP loopback phía sau proxy.

    Giá trị header ví dụ:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="TLS termination tại Gateway">
    Nếu chính OpenClaw phục vụ HTTPS trực tiếp (không có proxy TLS-terminating), hãy đặt:

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

    `strictTransportSecurity` nhận một giá trị header dạng chuỗi, hoặc `false` để tắt rõ ràng.

  </Tab>
</Tabs>

### Hướng dẫn triển khai dần

- Bắt đầu với max age ngắn trước (ví dụ `max-age=300`) trong khi xác thực lưu lượng.
- Chỉ tăng lên giá trị dài hạn (ví dụ `max-age=31536000`) sau khi đã có độ tin cậy cao.
- Chỉ thêm `includeSubDomains` nếu mọi subdomain đều đã sẵn sàng HTTPS.
- Chỉ dùng preload nếu bạn chủ động đáp ứng các yêu cầu preload cho toàn bộ tập domain.
- Phát triển cục bộ chỉ dùng loopback không được lợi từ HSTS.

## Ví dụ thiết lập proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium truyền danh tính trong `x-pomerium-claim-email` (hoặc các header claim khác) và JWT trong `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
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
    Caddy với Plugin `caddy-security` có thể xác thực người dùng và truyền header danh tính.

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

    Đoạn Caddyfile:

    ```
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
  <Accordion title="Traefik với forward auth">
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

OpenClaw từ chối các cấu hình mơ hồ khi cả `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`) và chế độ `trusted-proxy` cùng hoạt động. Cấu hình token hỗn hợp có thể khiến các yêu cầu loopback âm thầm xác thực trên đường dẫn xác thực sai.

Nếu bạn thấy lỗi `mixed_trusted_proxy_token` khi khởi động:

- Gỡ token dùng chung khi dùng chế độ trusted-proxy, hoặc
- Chuyển `gateway.auth.mode` sang `"token"` nếu bạn định dùng xác thực dựa trên token.

Loopback trusted-proxy identity headers vẫn đóng khi lỗi: các caller cùng host không bị âm thầm xác thực như người dùng proxy. Các caller nội bộ của OpenClaw bỏ qua proxy có thể xác thực bằng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` thay vào đó. Token fallback vẫn cố ý không được hỗ trợ trong chế độ trusted-proxy.

## Header phạm vi operator

Xác thực trusted-proxy là chế độ HTTP **mang danh tính**, nên caller có thể tùy chọn khai báo phạm vi operator bằng `x-openclaw-scopes` trên các yêu cầu HTTP API.

Lưu ý: phạm vi WebSocket được xác định bởi Gateway protocol handshake và ràng buộc danh tính thiết bị. Trên các yêu cầu nâng cấp WebSocket của Control UI, `x-openclaw-scopes` chỉ là giới hạn trên các phạm vi phiên đã thương lượng, không phải cấp quyền. Để biết hành vi phạm vi WebSocket với trusted-proxy, xem [hành vi ghép nối Control UI](#control-ui-pairing-behavior).

Ví dụ:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Hành vi:

- Khi header có mặt, OpenClaw tôn trọng tập phạm vi đã khai báo.
- Khi header có mặt nhưng rỗng, yêu cầu khai báo **không có** phạm vi operator.
- Khi header vắng mặt, các HTTP API mang danh tính thông thường fallback về tập phạm vi mặc định chuẩn của operator.
- Các **plugin HTTP routes** dùng gateway-auth hẹp hơn theo mặc định: khi `x-openclaw-scopes` vắng mặt, phạm vi runtime của chúng fallback về `operator.write`.
- Các yêu cầu HTTP có nguồn từ trình duyệt vẫn phải vượt qua `gateway.controlUi.allowedOrigins` (hoặc chế độ Host-header fallback có chủ ý) ngay cả sau khi xác thực trusted-proxy thành công.
- Đối với phiên WebSocket của Control UI, `x-openclaw-scopes` là giới hạn phạm vi khi có mặt trên yêu cầu nâng cấp. Giá trị rỗng tạo ra không có phạm vi nào.

Quy tắc thực tế: gửi `x-openclaw-scopes` rõ ràng khi bạn muốn một yêu cầu trusted-proxy hẹp hơn mặc định, hoặc khi một gateway-auth plugin route cần quyền mạnh hơn phạm vi ghi.

## Danh sách kiểm tra bảo mật

Trước khi bật xác thực trusted-proxy, hãy xác minh:

- [ ] **Proxy là đường dẫn duy nhất**: Cổng Gateway được firewall chặn khỏi mọi thứ ngoại trừ proxy của bạn.
- [ ] **trustedProxies là tối thiểu**: Chỉ các IP proxy thực tế của bạn, không phải toàn bộ subnet.
- [ ] **Nguồn proxy loopback là có chủ ý**: Xác thực trusted-proxy đóng khi lỗi đối với yêu cầu nguồn loopback trừ khi `gateway.auth.trustedProxy.allowLoopback` được bật rõ ràng cho proxy cùng host.
- [ ] **Proxy loại bỏ header**: Proxy của bạn ghi đè (không nối thêm) các header `x-forwarded-*` từ client.
- [ ] **Kết thúc TLS**: Proxy của bạn xử lý TLS; người dùng kết nối qua HTTPS.
- [ ] **allowedOrigins là rõ ràng**: Control UI không phải loopback dùng `gateway.controlUi.allowedOrigins` rõ ràng.
- [ ] **allowUsers được đặt** (khuyến nghị): Giới hạn ở người dùng đã biết thay vì cho phép bất kỳ ai đã xác thực.
- [ ] **Không có cấu hình token trộn lẫn**: Không đặt cả `gateway.auth.token` và `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Local password fallback là riêng tư**: Nếu bạn cấu hình `gateway.auth.password` cho caller trực tiếp nội bộ, hãy firewall cổng Gateway để client từ xa không qua proxy không thể truy cập trực tiếp.

## Kiểm toán bảo mật

`openclaw security audit` sẽ gắn cờ xác thực trusted-proxy với phát hiện mức độ **critical**. Điều này là có chủ ý — đó là lời nhắc rằng bạn đang ủy quyền bảo mật cho thiết lập proxy của mình.

Kiểm toán kiểm tra:

- Cảnh báo/nhắc nhở critical cơ bản `gateway.trusted_proxy_auth`
- Thiếu cấu hình `trustedProxies`
- Thiếu cấu hình `userHeader`
- `allowUsers` rỗng (cho phép bất kỳ người dùng đã xác thực nào)
- Bật `allowLoopback` cho nguồn proxy cùng host
- Chính sách nguồn trình duyệt wildcard hoặc bị thiếu trên các bề mặt Control UI được phơi bày

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Yêu cầu không đến từ IP trong `gateway.trustedProxies`. Kiểm tra:

    - IP proxy có đúng không? (IP container Docker có thể thay đổi.)
    - Có load balancer phía trước proxy của bạn không?
    - Dùng `docker inspect` hoặc `kubectl get pods -o wide` để tìm IP thực tế.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw đã từ chối một yêu cầu trusted-proxy nguồn loopback.

    Kiểm tra:

    - Proxy có đang kết nối từ `127.0.0.1` / `::1` không?
    - Bạn có đang cố dùng xác thực trusted-proxy với reverse proxy loopback cùng host không?

    Cách sửa:

    - Ưu tiên xác thực token/password cho client nội bộ cùng host không đi qua proxy, hoặc
    - Định tuyến qua một địa chỉ proxy đáng tin cậy không phải loopback và giữ IP đó trong `gateway.trustedProxies`, hoặc
    - Với reverse proxy cùng host có chủ ý, đặt `gateway.auth.trustedProxy.allowLoopback = true`, giữ địa chỉ loopback trong `gateway.trustedProxies`, và bảo đảm proxy loại bỏ hoặc ghi đè các header danh tính.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Header người dùng rỗng hoặc bị thiếu. Kiểm tra:

    - Proxy của bạn có được cấu hình để truyền header danh tính không?
    - Tên header có đúng không? (không phân biệt chữ hoa/thường, nhưng chính tả quan trọng)
    - Người dùng có thực sự được xác thực tại proxy không?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Một header bắt buộc không có mặt. Kiểm tra:

    - Cấu hình proxy của bạn cho các header cụ thể đó.
    - Header có đang bị loại bỏ ở đâu đó trong chuỗi không.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Người dùng đã được xác thực nhưng không nằm trong `allowUsers`. Hãy thêm họ hoặc xóa danh sách cho phép.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Xác thực trusted-proxy thành công, nhưng header `Origin` của trình duyệt không vượt qua kiểm tra nguồn Control UI.

    Kiểm tra:

    - `gateway.controlUi.allowedOrigins` bao gồm đúng nguồn trình duyệt.
    - Bạn không dựa vào nguồn wildcard trừ khi bạn cố ý muốn hành vi cho phép tất cả.
    - Nếu bạn cố ý dùng chế độ Host-header fallback, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` được đặt có chủ ý.

  </Accordion>
  <Accordion title="Kết nối thành công nhưng các phương thức báo thiếu phạm vi">
    WebSocket kết nối, nhưng `chat.history`, `sessions.list`, hoặc
    `models.list` lỗi với `missing scope: operator.read`.

    Nguyên nhân phổ biến:

    - Phiên Control UI không có thiết bị: xác thực trusted-proxy có thể cho phép kết nối WebSocket không có danh tính thiết bị, nhưng OpenClaw xóa phạm vi trên các phiên không có thiết bị theo thiết kế.
    - Client backend tùy chỉnh: `gateway.controlUi.dangerouslyDisableDeviceAuth` thuộc phạm vi Control UI và không cấp phạm vi cho backend tùy ý hoặc các client WebSocket dạng CLI.
    - `x-openclaw-scopes` quá hẹp: nếu proxy của bạn inject header này trên yêu cầu nâng cấp WebSocket của Control UI, phạm vi phiên bị giới hạn vào tập đó. Giá trị header rỗng tạo ra không có phạm vi nào.

    Cách sửa:

    - Với Control UI, dùng HTTPS để trình duyệt có thể tạo danh tính thiết bị và hoàn tất ghép nối.
    - Với tự động hóa tùy chỉnh, dùng danh tính/ghép nối thiết bị, đường dẫn helper backend `gateway-client` direct-local dành riêng, hoặc [admin HTTP RPC](/vi/plugins/admin-http-rpc).
    - Chỉ dùng `gateway.controlUi.dangerouslyDisableDeviceAuth: true` như một đường dẫn break-glass tạm thời cho Control UI.

  </Accordion>
  <Accordion title="WebSocket vẫn lỗi">
    Bảo đảm proxy của bạn:

    - Hỗ trợ nâng cấp WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Truyền các header danh tính trên yêu cầu nâng cấp WebSocket (không chỉ HTTP).
    - Không có đường dẫn xác thực riêng cho kết nối WebSocket.

  </Accordion>
</AccordionGroup>

## Di chuyển từ xác thực token

Nếu bạn đang chuyển từ xác thực token sang trusted-proxy:

<Steps>
  <Step title="Cấu hình proxy">
    Cấu hình proxy của bạn để xác thực người dùng và truyền header.
  </Step>
  <Step title="Kiểm thử proxy độc lập">
    Kiểm thử thiết lập proxy độc lập (curl với header).
  </Step>
  <Step title="Cập nhật cấu hình OpenClaw">
    Cập nhật cấu hình OpenClaw với xác thực trusted-proxy.
  </Step>
  <Step title="Khởi động lại Gateway">
    Khởi động lại Gateway.
  </Step>
  <Step title="Kiểm thử WebSocket">
    Kiểm thử kết nối WebSocket từ Control UI.
  </Step>
  <Step title="Kiểm toán">
    Chạy `openclaw security audit` và xem xét các phát hiện.
  </Step>
</Steps>

## Liên quan

- [Cấu hình](/vi/gateway/configuration) — tham chiếu cấu hình
- [Truy cập từ xa](/vi/gateway/remote) — các mẫu truy cập từ xa khác
- [Bảo mật](/vi/gateway/security) — hướng dẫn bảo mật đầy đủ
- [Tailscale](/vi/gateway/tailscale) — lựa chọn thay thế đơn giản hơn cho truy cập chỉ trong tailnet
