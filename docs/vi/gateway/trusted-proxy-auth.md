---
read_when:
    - Chạy OpenClaw phía sau proxy nhận biết danh tính
    - Thiết lập Pomerium, Caddy hoặc nginx với OAuth làm lớp đứng trước OpenClaw
    - Khắc phục lỗi WebSocket 1008 không được ủy quyền trong các thiết lập proxy ngược
    - Quyết định nơi thiết lập HSTS và các tiêu đề tăng cường bảo mật HTTP khác
sidebarTitle: Trusted proxy auth
summary: Ủy quyền xác thực Gateway cho một proxy ngược đáng tin cậy (Pomerium, Caddy, nginx + OAuth)
title: Xác thực proxy đáng tin cậy
x-i18n:
    generated_at: "2026-04-29T22:47:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Tính năng nhạy cảm về bảo mật.** Chế độ này ủy quyền xác thực hoàn toàn cho proxy đảo ngược của bạn. Cấu hình sai có thể khiến Gateway của bạn bị truy cập trái phép. Hãy đọc kỹ trang này trước khi bật.
</Warning>

## Khi nào nên dùng

Dùng chế độ xác thực `trusted-proxy` khi:

- Bạn chạy OpenClaw phía sau một **proxy nhận biết danh tính** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Proxy của bạn xử lý toàn bộ xác thực và truyền danh tính người dùng qua header.
- Bạn đang ở trong môi trường Kubernetes hoặc container nơi proxy là đường dẫn duy nhất đến Gateway.
- Bạn gặp lỗi WebSocket `1008 unauthorized` vì trình duyệt không thể truyền token trong payload WS.

## Khi KHÔNG nên dùng

- Nếu proxy của bạn không xác thực người dùng (chỉ là điểm kết thúc TLS hoặc bộ cân bằng tải).
- Nếu có bất kỳ đường dẫn nào đến Gateway bỏ qua proxy (lỗ hổng tường lửa, truy cập mạng nội bộ).
- Nếu bạn không chắc proxy của mình có loại bỏ/ghi đè chính xác các header được chuyển tiếp hay không.
- Nếu bạn chỉ cần quyền truy cập cá nhân cho một người dùng (cân nhắc Tailscale Serve + loopback để thiết lập đơn giản hơn).

## Cách hoạt động

<Steps>
  <Step title="Proxy xác thực người dùng">
    Proxy đảo ngược của bạn xác thực người dùng (OAuth, OIDC, SAML, v.v.).
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

## Hành vi ghép nối Control UI

Khi `gateway.auth.mode = "trusted-proxy"` đang hoạt động và yêu cầu vượt qua các kiểm tra trusted-proxy, phiên WebSocket của Control UI có thể kết nối mà không cần danh tính ghép nối thiết bị.

Hệ quả:

- Ghép nối không còn là cổng chính cho quyền truy cập Control UI trong chế độ này.
- Chính sách xác thực của proxy đảo ngược và `allowUsers` trở thành kiểm soát truy cập thực tế.
- Chỉ để ingress Gateway mở cho các IP proxy tin cậy (`gateway.trustedProxies` + tường lửa).

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
- Proxy đảo ngược loopback cùng máy chủ **không** đáp ứng xác thực trusted-proxy trừ khi bạn đặt rõ `gateway.auth.trustedProxy.allowLoopback = true` và đưa địa chỉ loopback vào `gateway.trustedProxies`.
- `allowLoopback` tin cậy các tiến trình cục bộ trên máy chủ Gateway ở cùng mức với proxy đảo ngược. Chỉ bật tùy chọn này khi Gateway vẫn được tường lửa bảo vệ khỏi truy cập trực tiếp từ xa và proxy cục bộ loại bỏ hoặc ghi đè các header danh tính do máy khách cung cấp.
- Các máy khách Gateway nội bộ không đi qua proxy đảo ngược nên dùng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, không dùng header danh tính trusted-proxy.
- Các triển khai Control UI không dùng loopback vẫn cần `gateway.controlUi.allowedOrigins` rõ ràng.
- **Bằng chứng forwarded-header ghi đè tính cục bộ loopback cho fallback trực tiếp cục bộ.** Nếu một yêu cầu đến trên loopback nhưng mang các header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` trỏ đến một nguồn không cục bộ, bằng chứng đó loại yêu cầu khỏi fallback mật khẩu local-direct và cổng danh tính thiết bị. Với `allowLoopback: true`, xác thực trusted-proxy vẫn có thể chấp nhận yêu cầu dưới dạng yêu cầu proxy cùng máy chủ, trong khi `requiredHeaders` và `allowUsers` tiếp tục được áp dụng.

</Warning>

### Tham chiếu cấu hình

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Mảng địa chỉ IP proxy cần tin cậy. Yêu cầu từ các IP khác bị từ chối.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Phải là `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Tên header chứa danh tính người dùng đã xác thực.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Các header bổ sung phải có để yêu cầu được tin cậy.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Danh sách cho phép các danh tính người dùng. Rỗng nghĩa là cho phép tất cả người dùng đã xác thực.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Hỗ trợ opt-in cho proxy đảo ngược loopback cùng máy chủ. Mặc định là `false`.
</ParamField>

<Warning>
Chỉ bật `allowLoopback` khi proxy đảo ngược cục bộ là ranh giới tin cậy dự kiến. Bất kỳ tiến trình cục bộ nào có thể kết nối đến Gateway đều có thể thử gửi header danh tính proxy, vì vậy hãy giữ quyền truy cập Gateway trực tiếp ở phạm vi riêng tư với máy chủ và yêu cầu các header do proxy sở hữu như `x-forwarded-proto` hoặc header xác nhận đã ký nếu proxy của bạn hỗ trợ.
</Warning>

## Kết thúc TLS và HSTS

Dùng một điểm kết thúc TLS và áp dụng HSTS tại đó.

<Tabs>
  <Tab title="Kết thúc TLS tại proxy (khuyến nghị)">
    Khi proxy đảo ngược của bạn xử lý HTTPS cho `https://control.example.com`, hãy đặt `Strict-Transport-Security` tại proxy cho miền đó.

    - Phù hợp với các triển khai hướng ra internet.
    - Giữ chính sách chứng chỉ + tăng cường bảo mật HTTP ở một nơi.
    - OpenClaw có thể tiếp tục chạy HTTP trên loopback phía sau proxy.

    Giá trị header ví dụ:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Kết thúc TLS tại Gateway">
    Nếu OpenClaw tự phục vụ HTTPS trực tiếp (không có proxy kết thúc TLS), hãy đặt:

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

    `strictTransportSecurity` chấp nhận giá trị header dạng chuỗi, hoặc `false` để tắt rõ ràng.

  </Tab>
</Tabs>

### Hướng dẫn triển khai dần

- Bắt đầu với thời lượng tối đa ngắn trước (ví dụ `max-age=300`) trong khi xác thực lưu lượng.
- Chỉ tăng lên các giá trị dài hạn (ví dụ `max-age=31536000`) sau khi đã đủ tự tin.
- Chỉ thêm `includeSubDomains` nếu mọi miền con đều đã sẵn sàng HTTPS.
- Chỉ dùng preload nếu bạn chủ ý đáp ứng các yêu cầu preload cho toàn bộ tập miền của mình.
- Phát triển cục bộ chỉ dùng loopback không hưởng lợi từ HSTS.

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

OpenClaw từ chối các cấu hình mơ hồ trong đó cả `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`) và chế độ `trusted-proxy` cùng hoạt động một lúc. Cấu hình token hỗn hợp có thể khiến các yêu cầu loopback âm thầm xác thực theo đường dẫn xác thực sai.

Nếu bạn thấy lỗi `mixed_trusted_proxy_token` khi khởi động:

- Gỡ token dùng chung khi dùng chế độ trusted-proxy, hoặc
- Chuyển `gateway.auth.mode` sang `"token"` nếu bạn định dùng xác thực dựa trên token.

Header danh tính trusted-proxy trên loopback vẫn fail closed: các bên gọi cùng máy chủ không được âm thầm xác thực như người dùng proxy. Các bên gọi nội bộ của OpenClaw bỏ qua proxy có thể xác thực bằng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` thay vào đó. Fallback token vẫn cố ý không được hỗ trợ trong chế độ trusted-proxy.

## Header phạm vi operator

Xác thực trusted-proxy là chế độ HTTP **mang danh tính**, vì vậy bên gọi có thể tùy chọn khai báo phạm vi operator bằng `x-openclaw-scopes`.

Ví dụ:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Hành vi:

- Khi header có mặt, OpenClaw tôn trọng tập phạm vi đã khai báo.
- Khi header có mặt nhưng rỗng, yêu cầu khai báo **không có** phạm vi operator nào.
- Khi header vắng mặt, các API HTTP mang danh tính thông thường fallback về tập phạm vi operator mặc định chuẩn.
- Các **tuyến HTTP Plugin** dùng xác thực Gateway mặc định hẹp hơn: khi `x-openclaw-scopes` vắng mặt, phạm vi runtime của chúng fallback về `operator.write`.
- Các yêu cầu HTTP có nguồn từ trình duyệt vẫn phải vượt qua `gateway.controlUi.allowedOrigins` (hoặc chế độ fallback Host-header có chủ ý) ngay cả sau khi xác thực trusted-proxy thành công.

Quy tắc thực tế: gửi `x-openclaw-scopes` rõ ràng khi bạn muốn một yêu cầu trusted-proxy hẹp hơn mặc định, hoặc khi một tuyến Plugin dùng xác thực Gateway cần quyền mạnh hơn phạm vi ghi.

## Danh sách kiểm tra bảo mật

Trước khi bật xác thực trusted-proxy, hãy xác minh:

- [ ] **Proxy là đường dẫn duy nhất**: Cổng Gateway được tường lửa chặn khỏi mọi thứ ngoại trừ proxy của bạn.
- [ ] **trustedProxies là tối thiểu**: Chỉ các IP proxy thực tế của bạn, không phải toàn bộ subnet.
- [ ] **Nguồn proxy loopback là có chủ ý**: Xác thực trusted-proxy sẽ đóng theo hướng an toàn đối với các yêu cầu có nguồn loopback trừ khi `gateway.auth.trustedProxy.allowLoopback` được bật rõ ràng cho proxy cùng máy chủ.
- [ ] **Proxy loại bỏ header**: Proxy của bạn ghi đè (không nối thêm) các header `x-forwarded-*` từ client.
- [ ] **Kết thúc TLS**: Proxy của bạn xử lý TLS; người dùng kết nối qua HTTPS.
- [ ] **allowedOrigins là rõ ràng**: Giao diện điều khiển không phải loopback sử dụng `gateway.controlUi.allowedOrigins` rõ ràng.
- [ ] **allowUsers được thiết lập** (khuyến nghị): Giới hạn ở người dùng đã biết thay vì cho phép bất kỳ ai đã xác thực.
- [ ] **Không trộn lẫn cấu hình token**: Không đặt đồng thời `gateway.auth.token` và `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Dự phòng mật khẩu cục bộ là riêng tư**: Nếu bạn cấu hình `gateway.auth.password` cho các bên gọi trực tiếp nội bộ, hãy giữ cổng Gateway được tường lửa bảo vệ để các client từ xa không qua proxy không thể truy cập trực tiếp.

## Kiểm toán bảo mật

`openclaw security audit` sẽ gắn cờ xác thực trusted-proxy với phát hiện mức độ nghiêm trọng **critical**. Điều này là có chủ ý — đây là lời nhắc rằng bạn đang ủy quyền bảo mật cho thiết lập proxy của mình.

Kiểm toán kiểm tra:

- Cảnh báo/lời nhắc quan trọng cơ sở `gateway.trusted_proxy_auth`
- Thiếu cấu hình `trustedProxies`
- Thiếu cấu hình `userHeader`
- `allowUsers` trống (cho phép bất kỳ người dùng đã xác thực nào)
- Đã bật `allowLoopback` cho nguồn proxy cùng máy chủ
- Chính sách nguồn trình duyệt wildcard hoặc bị thiếu trên các bề mặt Giao diện điều khiển được mở ra

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Yêu cầu không đến từ IP trong `gateway.trustedProxies`. Kiểm tra:

    - IP proxy có đúng không? (IP container Docker có thể thay đổi.)
    - Có load balancer ở phía trước proxy của bạn không?
    - Dùng `docker inspect` hoặc `kubectl get pods -o wide` để tìm IP thực tế.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw đã từ chối một yêu cầu trusted-proxy có nguồn loopback.

    Kiểm tra:

    - Proxy có đang kết nối từ `127.0.0.1` / `::1` không?
    - Bạn có đang cố dùng xác thực trusted-proxy với reverse proxy loopback cùng máy chủ không?

    Cách sửa:

    - Ưu tiên xác thực token/mật khẩu cho các client nội bộ cùng máy chủ không đi qua proxy, hoặc
    - Định tuyến qua một địa chỉ proxy tin cậy không phải loopback và giữ IP đó trong `gateway.trustedProxies`, hoặc
    - Với reverse proxy cùng máy chủ có chủ ý, đặt `gateway.auth.trustedProxy.allowLoopback = true`, giữ địa chỉ loopback trong `gateway.trustedProxies`, và đảm bảo proxy loại bỏ hoặc ghi đè các header định danh.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Header người dùng trống hoặc bị thiếu. Kiểm tra:

    - Proxy của bạn có được cấu hình để truyền các header định danh không?
    - Tên header có đúng không? (không phân biệt chữ hoa chữ thường, nhưng chính tả vẫn quan trọng)
    - Người dùng có thực sự được xác thực tại proxy không?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Một header bắt buộc không có mặt. Kiểm tra:

    - Cấu hình proxy của bạn cho các header cụ thể đó.
    - Header có đang bị loại bỏ ở đâu đó trong chuỗi không.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Người dùng đã được xác thực nhưng không có trong `allowUsers`. Hãy thêm họ hoặc gỡ allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Xác thực trusted-proxy đã thành công, nhưng header trình duyệt `Origin` không vượt qua kiểm tra nguồn của Giao diện điều khiển.

    Kiểm tra:

    - `gateway.controlUi.allowedOrigins` bao gồm đúng nguồn trình duyệt.
    - Bạn không dựa vào nguồn wildcard trừ khi bạn cố ý muốn hành vi cho phép tất cả.
    - Nếu bạn cố ý dùng chế độ dự phòng Host-header, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` được đặt một cách có chủ ý.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Đảm bảo proxy của bạn:

    - Hỗ trợ nâng cấp WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Truyền các header định danh trên yêu cầu nâng cấp WebSocket (không chỉ HTTP).
    - Không có đường dẫn xác thực riêng cho kết nối WebSocket.

  </Accordion>
</AccordionGroup>

## Di chuyển từ xác thực token

Nếu bạn đang chuyển từ xác thực token sang trusted-proxy:

<Steps>
  <Step title="Configure the proxy">
    Cấu hình proxy của bạn để xác thực người dùng và truyền header.
  </Step>
  <Step title="Test the proxy independently">
    Kiểm thử thiết lập proxy một cách độc lập (curl với header).
  </Step>
  <Step title="Update OpenClaw config">
    Cập nhật cấu hình OpenClaw với xác thực trusted-proxy.
  </Step>
  <Step title="Restart the Gateway">
    Khởi động lại Gateway.
  </Step>
  <Step title="Test WebSocket">
    Kiểm thử kết nối WebSocket từ Giao diện điều khiển.
  </Step>
  <Step title="Audit">
    Chạy `openclaw security audit` và xem lại các phát hiện.
  </Step>
</Steps>

## Liên quan

- [Cấu hình](/vi/gateway/configuration) — tham chiếu cấu hình
- [Truy cập từ xa](/vi/gateway/remote) — các mẫu truy cập từ xa khác
- [Bảo mật](/vi/gateway/security) — hướng dẫn bảo mật đầy đủ
- [Tailscale](/vi/gateway/tailscale) — phương án thay thế đơn giản hơn cho truy cập chỉ trong tailnet
