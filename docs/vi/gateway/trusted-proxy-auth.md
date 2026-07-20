---
read_when:
    - Chạy OpenClaw phía sau proxy nhận biết danh tính
    - Thiết lập Pomerium, Caddy hoặc nginx với OAuth ở phía trước OpenClaw
    - Khắc phục lỗi WebSocket 1008 không được ủy quyền khi thiết lập proxy ngược
    - Quyết định nơi thiết lập HSTS và các header tăng cường bảo mật HTTP khác
sidebarTitle: Trusted proxy auth
summary: Ủy quyền xác thực Gateway cho một reverse proxy đáng tin cậy (Pomerium, Caddy, nginx + OAuth)
title: Xác thực proxy đáng tin cậy
x-i18n:
    generated_at: "2026-07-20T04:42:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 849824b53e518391d1a81f8a9a17320df3f42749f37d0c49b0e8b662f82b27cb
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Tính năng nhạy cảm về bảo mật.** Chế độ này ủy quyền toàn bộ việc xác thực cho proxy ngược của bạn. Cấu hình sai có thể khiến Gateway của bạn bị truy cập trái phép. Hãy đọc kỹ trang này trước khi bật.
</Warning>

## Khi nào nên sử dụng

- Bạn chạy OpenClaw phía sau một **proxy nhận biết danh tính** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + xác thực chuyển tiếp).
- Proxy của bạn xử lý toàn bộ việc xác thực và truyền danh tính người dùng qua các header.
- Bạn đang ở trong môi trường Kubernetes hoặc container, nơi proxy là đường dẫn duy nhất đến Gateway.
- Bạn gặp lỗi WebSocket `1008 unauthorized` vì trình duyệt không thể truyền token trong payload WS.

## Khi KHÔNG nên sử dụng

- Proxy của bạn không xác thực người dùng (chỉ là điểm kết thúc TLS hoặc bộ cân bằng tải).
- Có bất kỳ đường dẫn nào đến Gateway bỏ qua proxy (lỗ hổng tường lửa, quyền truy cập mạng nội bộ).
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
    OpenClaw kiểm tra yêu cầu có đến từ **IP proxy đáng tin cậy** (`gateway.trustedProxies`) và không phải địa chỉ loopback hoặc địa chỉ giao diện cục bộ của chính Gateway hay không.
  </Step>
  <Step title="Gateway trích xuất danh tính">
    OpenClaw đọc các header bắt buộc, sau đó đọc danh tính người dùng từ header đã cấu hình.
  </Step>
  <Step title="Ủy quyền">
    Nếu mọi kiểm tra đều đạt và người dùng vượt qua `allowUsers` (khi được thiết lập), yêu cầu sẽ được ủy quyền.
  </Step>
</Steps>

## Cấu hình

```json5
{
  gateway: {
    // Xác thực proxy đáng tin cậy mặc định yêu cầu IP nguồn của proxy không phải loopback
    bind: "lan",

    // NGHIÊM TRỌNG: Chỉ thêm (các) IP của proxy tại đây
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

        // Tùy chọn: cho phép người dùng đã xác thực qua proxy đăng ký thiết bị trình duyệt mới
        deviceAutoApprove: {
          enabled: false,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

<Warning>
**Quy tắc thời gian chạy, theo thứ tự đánh giá**

1. IP nguồn của yêu cầu phải khớp với `gateway.trustedProxies` (có xét CIDR), nếu không yêu cầu sẽ bị từ chối (`trusted_proxy_untrusted_source`).
2. Các yêu cầu từ nguồn loopback (`127.0.0.1`, `::1`) bị từ chối trừ khi `gateway.auth.trustedProxy.allowLoopback = true` và địa chỉ loopback cũng có trong `trustedProxies` (`trusted_proxy_loopback_source`). Kiểm tra này chạy trước các kiểm tra header, vì vậy một nguồn loopback sẽ thất bại theo cách này ngay cả khi các header bắt buộc cũng bị thiếu.
3. Các nguồn không phải loopback khớp với một trong các địa chỉ giao diện mạng cục bộ của chính máy chủ Gateway sẽ bị từ chối để ngăn giả mạo (`trusted_proxy_local_interface_source`). Nếu chính việc phát hiện giao diện thất bại, yêu cầu cũng bị từ chối (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` và `userHeader` phải tồn tại và không được để trống.
5. `allowUsers`, nếu không trống, phải bao gồm người dùng đã trích xuất.

**Bằng chứng từ header chuyển tiếp ghi đè tính cục bộ của loopback đối với cơ chế dự phòng trực tiếp cục bộ.** Nếu một yêu cầu đến qua loopback nhưng mang header `Forwarded`, bất kỳ `X-Forwarded-*` nào hoặc header `X-Real-IP`, bằng chứng đó khiến yêu cầu không đủ điều kiện dùng cơ chế dự phòng mật khẩu trực tiếp cục bộ và cơ chế kiểm soát danh tính thiết bị, mặc dù yêu cầu vẫn không vượt qua xác thực proxy đáng tin cậy vì đến từ loopback.

`allowLoopback` đặt mức độ tin cậy đối với các tiến trình cục bộ trên máy chủ Gateway ngang với proxy ngược. Chỉ bật tùy chọn này khi Gateway vẫn được tường lửa bảo vệ khỏi truy cập từ xa trực tiếp và proxy cục bộ loại bỏ hoặc ghi đè các header danh tính do máy khách cung cấp.

Các máy khách Gateway nội bộ không đi qua proxy ngược nên sử dụng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, thay vì các header danh tính proxy đáng tin cậy. Các triển khai Control UI không qua loopback vẫn cần `gateway.controlUi.allowedOrigins` rõ ràng.
</Warning>

### Tham chiếu cấu hình

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Mảng địa chỉ IP (hoặc CIDR) của proxy cần tin cậy. Yêu cầu từ các IP khác sẽ bị từ chối.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Phải là `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Tên header chứa danh tính người dùng đã xác thực.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Các header bổ sung phải có để yêu cầu được coi là đáng tin cậy.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Danh sách cho phép các danh tính người dùng. Để trống nghĩa là cho phép tất cả người dùng đã xác thực.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Chủ động bật hỗ trợ cho các proxy ngược loopback trên cùng máy chủ.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.enabled" type="boolean" default="false">
  Tự động phê duyệt danh tính thiết bị Control UI và WebChat mới sau khi xác thực proxy đáng tin cậy.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.scopes" type="string[]" default='["operator.read", "operator.write", "operator.approvals"]'>
  Các phạm vi tối đa được cấp cho thiết bị trình duyệt được tự động phê duyệt. Việc liệt kê rõ ràng `operator.admin` cho phép mọi người dùng đã xác thực qua proxy yêu cầu cấp toàn quyền quản trị tự động cho thiết bị, khiến các yêu cầu không có phạm vi tự động nhận toàn quyền quản trị, đồng thời kích hoạt phát hiện kiểm tra bảo mật NGHIÊM TRỌNG `gateway.trusted_proxy_device_auto_approve_admin` và cảnh báo khi Gateway khởi động.
</ParamField>

<Warning>
Chỉ bật `allowLoopback` khi proxy ngược cục bộ là ranh giới tin cậy dự kiến. Bất kỳ tiến trình cục bộ nào có thể kết nối với Gateway đều có thể thử gửi các header danh tính proxy, vì vậy hãy giữ quyền truy cập trực tiếp vào Gateway ở chế độ riêng tư trên máy chủ và yêu cầu các header do proxy sở hữu như `x-forwarded-proto`, hoặc header xác nhận có chữ ký nếu proxy của bạn hỗ trợ.
</Warning>

## Phê duyệt thiết bị tự động

Xác thực proxy đáng tin cậy có thể tùy chọn sử dụng danh tính proxy làm ranh giới phê duyệt cho các thiết bị trình duyệt mới:

```json5
{
  gateway: {
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
        allowUsers: ["operator@example.com"],
        deviceAutoApprove: {
          enabled: true,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

Giá trị mặc định là `enabled: false`. Khi được bật, tất cả các quy tắc sau sẽ áp dụng:

1. WebSocket phải được xác thực thông qua phương thức `trusted-proxy` với danh tính người dùng không trống đã vượt qua `allowUsers` khi danh sách cho phép được cấu hình. Các kết nối bằng token, mật khẩu, Tailscale và chưa xác thực không bao giờ sử dụng chính sách này.
2. Chỉ thiết bị trình duyệt Control UI hoặc WebChat mới có thể được phê duyệt tự động. Mọi yêu cầu cho thiết bị hiện có, bao gồm nâng cấp phạm vi, vẫn ở trạng thái chờ phê duyệt thủ công bằng `openclaw devices approve <requestId>`.
3. Thiết bị được phê duyệt với vai trò `operator`. Nếu yêu cầu kết nối bao gồm các phạm vi, quyền cấp là giao chính xác giữa các phạm vi được yêu cầu và `deviceAutoApprove.scopes`. Nếu yêu cầu bỏ qua các phạm vi, danh sách đã cấu hình sẽ được cấp; khi danh sách đó bị bỏ qua, giá trị mặc định là `operator.read`, `operator.write` và `operator.approvals`. Quyền cấp thu được sau đó còn bị giới hạn bởi header proxy [`x-openclaw-scopes`](#control-ui-pairing-behavior) của kết nối khi header này tồn tại, vì vậy proxy thu hẹp phạm vi của người dùng cũng giới hạn quyền cấp thiết bị **lâu dài**, không chỉ phiên — header tồn tại nhưng trống sẽ không cấp phạm vi nào. Giới hạn này áp dụng ngay cả khi máy khách bỏ qua danh sách phạm vi riêng.
4. `operator.admin` chỉ được phép khi được liệt kê rõ ràng trong `deviceAutoApprove.scopes`. Khi được liệt kê, mọi người dùng đã xác thực qua proxy đều có thể yêu cầu và tự động nhận toàn quyền quản trị trên thiết bị trình duyệt mới; các yêu cầu không có phạm vi tự động nhận toàn quyền quản trị. `openclaw security audit` báo cáo phát hiện NGHIÊM TRỌNG `gateway.trusted_proxy_device_auto_approve_admin`, và Gateway ghi cảnh báo một lần khi khởi động. Ưu tiên phê duyệt quản trị thủ công bằng `openclaw devices approve` hoặc `openclaw devices rotate` cho đến khi có vai trò theo từng danh tính.

<Warning>
Việc bật tùy chọn này ủy quyền hoàn toàn việc đăng ký thiết bị trình duyệt mới cho danh tính proxy ngược. Một tài khoản proxy bị xâm phạm có thể đăng ký thiết bị lâu dài với mọi phạm vi đã cấu hình. Việc liệt kê `operator.admin` khiến thiết bị đó trở thành quản trị viên toàn quyền mà không cần phê duyệt thủ công. Chỉ cho phép truy cập Gateway thông qua proxy, yêu cầu xác thực proxy mạnh, ghi đè các header danh tính và sử dụng danh sách `allowUsers` hạn chế.
</Warning>

## Hành vi ghép cặp Control UI

Khi `gateway.auth.mode = "trusted-proxy"` đang hoạt động và yêu cầu vượt qua các kiểm tra proxy đáng tin cậy, các phiên WebSocket của Control UI có thể kết nối mà không cần danh tính ghép cặp thiết bị.

Ảnh hưởng đến phạm vi:

- Các phiên WebSocket Control UI không có thiết bị vẫn kết nối nhưng mặc định không nhận phạm vi vận hành nào. OpenClaw xóa danh sách phạm vi được yêu cầu thành `[]` để một phiên không được liên kết với thiết bị/token đã ghép cặp và phê duyệt không thể tự khai báo quyền.
- Nếu các phương thức thất bại với `missing scope` sau khi kết nối WebSocket thành công, hãy sử dụng HTTPS để trình duyệt có thể tạo danh tính thiết bị và hoàn tất ghép cặp. Xem [HTTP không an toàn của Control UI](/vi/web/control-ui#insecure-http).
- Chỉ dùng trong tình huống khẩn cấp: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` giữ nguyên các phạm vi được yêu cầu ngay cả khi không có danh tính thiết bị. Đây là một sự suy giảm bảo mật nghiêm trọng; hãy hoàn nguyên nhanh chóng. Xem [HTTP không an toàn của Control UI](/vi/web/control-ui#insecure-http).

Giới hạn phạm vi qua proxy ngược: nếu proxy gửi `x-openclaw-scopes` trong yêu cầu nâng cấp WebSocket của Control UI, OpenClaw giới hạn các phạm vi phiên ở phần giao giữa các phạm vi được yêu cầu và các phạm vi đã khai báo. Header này không cấp phạm vi; nó chỉ thu hẹp những phạm vi mà phiên có thể giữ. Khi `deviceAutoApprove.enabled` là true, giới hạn tương tự cũng áp dụng cho quyền cấp thiết bị lâu dài được ghi bởi [phê duyệt thiết bị tự động](#automatic-device-approval), vì vậy thiết bị được tự động phê duyệt không bao giờ giữ nhiều phạm vi hơn mức proxy đã khai báo.

Hệ quả:

- Ghép cặp không còn là cổng kiểm soát chính đối với quyền truy cập Control UI không có thiết bị. Khi `deviceAutoApprove.enabled` là true, danh tính proxy cũng trở thành cổng phê duyệt cho việc đăng ký thiết bị trình duyệt mới.
- Chính sách xác thực proxy và `allowUsers` của bạn trở thành cơ chế kiểm soát truy cập thực tế.
- Chỉ cho phép các IP proxy đáng tin cậy truy cập Gateway (`gateway.trustedProxies` + tường lửa).

Các máy khách WebSocket tùy chỉnh không phải là phiên Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` không cấp phạm vi cho các máy khách `client.mode: "backend"` tùy ý hoặc có dạng CLI. Tự động hóa tùy chỉnh nên sử dụng danh tính thiết bị/ghép cặp, đường dẫn trình trợ giúp backend `client.id: "gateway-client"` dành riêng cho truy cập trực tiếp cục bộ, hoặc [Plugin RPC HTTP quản trị](/vi/plugins/admin-http-rpc) khi giao diện yêu cầu/phản hồi HTTP phù hợp hơn.

## Header phạm vi người vận hành

Xác thực qua proxy tin cậy là một chế độ HTTP **mang danh tính**, vì vậy bên gọi có thể tùy chọn khai báo các phạm vi của toán tử bằng `x-openclaw-scopes` trên các yêu cầu API HTTP.

Lưu ý: Phạm vi WebSocket được xác định bởi quá trình bắt tay giao thức Gateway và liên kết danh tính thiết bị. Trên các yêu cầu nâng cấp WebSocket của Giao diện điều khiển, `x-openclaw-scopes` chỉ là giới hạn trên đối với các phạm vi phiên được thương lượng, không phải quyền cấp. Xem [hành vi ghép nối của Giao diện điều khiển](#control-ui-pairing-behavior).

Ví dụ:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Hành vi:

- Khi tiêu đề hiện diện, OpenClaw tuân theo tập hợp phạm vi đã khai báo.
- Khi tiêu đề hiện diện nhưng trống, yêu cầu khai báo **không có** phạm vi toán tử nào.
- Khi tiêu đề không hiện diện, các API HTTP mang danh tính thông thường sẽ dự phòng về tập hợp phạm vi mặc định tiêu chuẩn của toán tử (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Các **tuyến HTTP của plugin** dùng xác thực Gateway mặc định có phạm vi hẹp hơn: khi không có `x-openclaw-scopes`, phạm vi thời gian chạy của chúng chỉ dự phòng về `operator.write`.
- Các yêu cầu HTTP có nguồn gốc từ trình duyệt vẫn phải vượt qua `gateway.controlUi.allowedOrigins` (hoặc chế độ dự phòng có chủ đích bằng tiêu đề Host), ngay cả sau khi xác thực qua proxy tin cậy thành công.

Quy tắc thực tế: gửi `x-openclaw-scopes` một cách rõ ràng khi bạn muốn yêu cầu qua proxy tin cậy có phạm vi hẹp hơn mặc định, hoặc khi một tuyến plugin dùng xác thực Gateway cần quyền mạnh hơn phạm vi ghi.

## Kết thúc TLS và HSTS

Sử dụng một điểm kết thúc TLS và áp dụng HSTS tại đó.

<Tabs>
  <Tab title="Kết thúc TLS tại proxy (khuyến nghị)">
    Khi proxy ngược xử lý HTTPS cho `https://control.example.com`, hãy đặt `Strict-Transport-Security` tại proxy cho miền đó.

    - Phù hợp với các triển khai hướng ra internet.
    - Giữ chứng chỉ và chính sách tăng cường bảo mật HTTP ở cùng một nơi.
    - OpenClaw có thể tiếp tục dùng HTTP trên địa chỉ loopback phía sau proxy.

    Giá trị tiêu đề mẫu:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Kết thúc TLS tại Gateway">
    Nếu chính OpenClaw trực tiếp cung cấp HTTPS (không có proxy kết thúc TLS), hãy đặt:

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

    `strictTransportSecurity` chấp nhận một giá trị tiêu đề dạng chuỗi hoặc `false` để tắt một cách rõ ràng.

  </Tab>
</Tabs>

### Hướng dẫn triển khai

- Trước tiên, hãy bắt đầu với thời gian tối đa ngắn (ví dụ `max-age=300`) trong khi xác thực lưu lượng.
- Chỉ tăng lên các giá trị dài hạn (ví dụ `max-age=31536000`) sau khi đã đủ tin cậy.
- Chỉ thêm `includeSubDomains` nếu mọi miền con đều sẵn sàng cho HTTPS.
- Chỉ sử dụng preload nếu bạn chủ ý đáp ứng các yêu cầu preload cho toàn bộ tập hợp miền của mình.
- Phát triển cục bộ chỉ dùng loopback không được hưởng lợi từ HSTS.

## Ví dụ thiết lập proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium truyền danh tính trong `x-pomerium-claim-email` (hoặc các tiêu đề claim khác) và một JWT trong `x-pomerium-jwt-assertion`.

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
    Caddy cùng plugin `caddy-security` có thể xác thực người dùng và truyền các tiêu đề danh tính.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP proxy Caddy/sidecar
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
        trustedProxies: ["10.0.0.1"], // IP nginx/oauth2-proxy
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
  <Accordion title="Traefik với xác thực chuyển tiếp">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP vùng chứa Traefik
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

Quá trình khởi động Gateway từ chối xác thực qua proxy tin cậy nếu đồng thời cấu hình một token dùng chung (`gateway.auth.token` hoặc `OPENCLAW_GATEWAY_TOKEN`). Hai cơ chế này loại trừ lẫn nhau vì token dùng chung sẽ cho phép bên gọi trên cùng máy chủ xác thực qua một đường dẫn hoàn toàn khác với danh tính đã được proxy xác minh mà chế độ này nhằm thực thi.

Nếu quá trình khởi động thất bại với lỗi như `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Xóa token dùng chung khi sử dụng chế độ proxy tin cậy, hoặc
- Chuyển `gateway.auth.mode` sang `"token"` nếu bạn định sử dụng xác thực dựa trên token.

Các tiêu đề danh tính proxy tin cậy qua loopback vẫn thất bại theo cơ chế đóng an toàn: bên gọi trên cùng máy chủ không được âm thầm xác thực như người dùng proxy. Thay vào đó, các bên gọi nội bộ của OpenClaw bỏ qua proxy có thể xác thực bằng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Cơ chế dự phòng bằng token vẫn chủ ý không được hỗ trợ trong chế độ proxy tin cậy.

## Danh sách kiểm tra bảo mật

Trước khi bật xác thực qua proxy tin cậy, hãy xác minh:

- [ ] **Proxy là đường dẫn duy nhất**: Cổng Gateway được tường lửa chặn với mọi nguồn ngoại trừ proxy của bạn.
- [ ] **trustedProxies được giữ ở mức tối thiểu**: Chỉ gồm các IP proxy thực tế, không phải toàn bộ mạng con.
- [ ] **Nguồn proxy loopback là có chủ đích**: Xác thực qua proxy tin cậy thất bại theo cơ chế đóng an toàn đối với các yêu cầu có nguồn loopback, trừ khi `gateway.auth.trustedProxy.allowLoopback` được bật rõ ràng cho proxy trên cùng máy chủ.
- [ ] **Proxy loại bỏ tiêu đề**: Proxy của bạn ghi đè (không nối thêm) các tiêu đề `x-forwarded-*` từ máy khách.
- [ ] **Kết thúc TLS**: Proxy xử lý TLS; người dùng kết nối qua HTTPS.
- [ ] **allowedOrigins được đặt rõ ràng**: Giao diện điều khiển không dùng loopback sử dụng `gateway.controlUi.allowedOrigins` rõ ràng.
- [ ] **allowUsers đã được đặt** (khuyến nghị): Giới hạn ở những người dùng đã biết thay vì cho phép bất kỳ ai đã xác thực.
- [ ] **Không có cấu hình token hỗn hợp**: Không đặt đồng thời `gateway.auth.token` và `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Cơ chế dự phòng bằng mật khẩu cục bộ là riêng tư**: Nếu bạn cấu hình `gateway.auth.password` cho các bên gọi trực tiếp nội bộ, hãy giữ cổng Gateway sau tường lửa để các máy khách từ xa không qua proxy không thể truy cập trực tiếp.
- [ ] **Tự động phê duyệt thiết bị là có chủ đích**: Nếu `deviceAutoApprove.enabled` là true, hãy xem bảo mật tài khoản proxy ngược là ranh giới đăng ký thiết bị và giữ danh sách phạm vi được cấp ở mức không phải quản trị viên và tối thiểu.

## Kiểm tra bảo mật

`openclaw security audit` gắn cờ xác thực qua proxy tin cậy với phát hiện có mức độ nghiêm trọng **nghiêm trọng**. Điều này là có chủ đích; đây là lời nhắc rằng bạn đang ủy quyền bảo mật cho thiết lập proxy của mình.

Quá trình kiểm tra xem xét:

- Cảnh báo/nhắc nhở nghiêm trọng cơ sở `gateway.trusted_proxy_auth`.
- Thiếu cấu hình `trustedProxies`.
- Thiếu cấu hình `userHeader`.
- `allowUsers` trống (cho phép bất kỳ người dùng đã xác thực nào).
- `allowLoopback` được bật cho các nguồn proxy trên cùng máy chủ.
- Tự động phê duyệt thiết bị trình duyệt được bật (ủy quyền việc ghép nối thiết bị mới cho danh tính proxy).

Các phát hiện riêng biệt, không dành riêng cho proxy tin cậy, cũng áp dụng bất cứ khi nào Giao diện điều khiển được công khai: `gateway.controlUi.allowedOrigins` dùng ký tự đại diện hoặc bị thiếu, và cơ chế dự phòng nguồn gốc bằng tiêu đề Host.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Yêu cầu không đến từ một IP trong `gateway.trustedProxies`. Hãy kiểm tra:

    - IP proxy có chính xác không? (IP vùng chứa Docker có thể thay đổi.)
    - Có bộ cân bằng tải phía trước proxy không?
    - Sử dụng `docker inspect` hoặc `kubectl get pods -o wide` để tìm các IP thực tế.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw đã từ chối một yêu cầu proxy tin cậy có nguồn loopback.

    Hãy kiểm tra:

    - Proxy có đang kết nối từ `127.0.0.1` / `::1` không?
    - Bạn có đang cố sử dụng xác thực qua proxy tin cậy với proxy ngược loopback trên cùng máy chủ không?

    Cách khắc phục:

    - Ưu tiên xác thực bằng token/mật khẩu cho các máy khách nội bộ trên cùng máy chủ không đi qua proxy, hoặc
    - Định tuyến qua một địa chỉ proxy tin cậy không phải loopback và giữ IP đó trong `gateway.trustedProxies`, hoặc
    - Đối với proxy ngược có chủ đích trên cùng máy chủ, hãy đặt `gateway.auth.trustedProxy.allowLoopback = true`, giữ địa chỉ loopback trong `gateway.trustedProxies`, đồng thời bảo đảm proxy loại bỏ hoặc ghi đè các tiêu đề danh tính.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    IP nguồn của yêu cầu khớp với một trong các địa chỉ giao diện mạng không phải loopback của chính máy chủ Gateway (không phải proxy), đây là biện pháp bảo vệ chống lưu lượng giả mạo trên cùng máy chủ qua tailnet hoặc mạng cầu nối Docker. `..._check_failed` có nghĩa là chính quá trình khám phá giao diện đã gặp lỗi, vì vậy OpenClaw thất bại theo cơ chế đóng an toàn.

    Hãy kiểm tra:

    - Có tiến trình nào trên chính máy chủ Gateway đang gửi trực tiếp các tiêu đề danh tính và bỏ qua proxy không?
    - Proxy có chạy trong cùng không gian tên mạng với Gateway, với một IP cũng xuất hiện dưới dạng giao diện cục bộ không?

    Cách khắc phục: định tuyến lưu lượng proxy qua một địa chỉ không đồng thời được liên kết cục bộ bởi máy chủ Gateway, hoặc chỉ sử dụng `allowLoopback` cho thiết lập proxy thực sự trên cùng máy chủ.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Tiêu đề người dùng bị trống hoặc thiếu. Hãy kiểm tra:

    - Proxy của bạn có được cấu hình để truyền các tiêu đề danh tính không?
    - Tên tiêu đề có chính xác không? (không phân biệt chữ hoa chữ thường, nhưng cách viết phải đúng)
    - Người dùng có thực sự được xác thực tại proxy không?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Một tiêu đề bắt buộc không hiện diện. Hãy kiểm tra:

    - Cấu hình proxy của bạn cho các tiêu đề cụ thể đó.
    - Liệu các tiêu đề có đang bị loại bỏ ở đâu đó trong chuỗi hay không.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Người dùng đã được xác thực nhưng không có trong `allowUsers`. Hãy thêm họ vào hoặc xóa danh sách cho phép.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` là `"trusted-proxy"` nhưng `gateway.trustedProxies` trống, hoặc thiếu chính `gateway.auth.trustedProxy`. Mọi yêu cầu đều bị từ chối cho đến khi cả hai được thiết lập.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Xác thực proxy tin cậy đã thành công, nhưng header `Origin` của trình duyệt không vượt qua bước kiểm tra nguồn gốc của Control UI.

    Kiểm tra:

    - `gateway.controlUi.allowedOrigins` bao gồm chính xác nguồn gốc của trình duyệt.
    - Bạn không dựa vào nguồn gốc ký tự đại diện, trừ khi cố ý muốn hành vi cho phép tất cả.
    - Nếu cố ý sử dụng chế độ dự phòng theo header Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` được thiết lập có chủ đích.

  </Accordion>
  <Accordion title="Kết nối thành công nhưng các phương thức báo thiếu phạm vi">
    WebSocket kết nối được, nhưng `chat.history`, `sessions.list` hoặc
    `models.list` thất bại với `missing scope: operator.read`.

    Nguyên nhân thường gặp:

    - Phiên Control UI không có thiết bị: xác thực proxy tin cậy có thể cho phép kết nối WebSocket mà không cần danh tính thiết bị, nhưng theo thiết kế, OpenClaw xóa các phạm vi của phiên không có thiết bị.
    - Máy khách backend tùy chỉnh: `gateway.controlUi.dangerouslyDisableDeviceAuth` chỉ dành cho Control UI và không cấp phạm vi cho các máy khách WebSocket backend tùy ý hoặc có dạng CLI.
    - `x-openclaw-scopes` quá hạn hẹp: nếu proxy chèn header này vào yêu cầu nâng cấp WebSocket của Control UI, phạm vi phiên bị giới hạn ở tập hợp đó. Giá trị header trống sẽ không cấp phạm vi nào.

    Cách khắc phục:

    - Đối với Control UI, hãy sử dụng HTTPS để trình duyệt có thể tạo danh tính thiết bị và hoàn tất ghép nối.
    - Đối với quy trình tự động hóa tùy chỉnh, hãy sử dụng danh tính thiết bị/ghép nối, đường dẫn helper backend `gateway-client` dành riêng cho kết nối cục bộ trực tiếp, hoặc [RPC HTTP quản trị](/vi/plugins/admin-http-rpc).
    - Chỉ sử dụng `gateway.controlUi.dangerouslyDisableDeviceAuth: true` như một đường khẩn cấp tạm thời cho Control UI.

  </Accordion>
  <Accordion title="WebSocket vẫn gặp lỗi">
    Đảm bảo proxy:

    - Hỗ trợ nâng cấp WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Chuyển tiếp các header danh tính trong yêu cầu nâng cấp WebSocket (không chỉ HTTP).
    - Không có đường dẫn xác thực riêng cho các kết nối WebSocket.

  </Accordion>
</AccordionGroup>

## Di chuyển từ xác thực bằng token

<Steps>
  <Step title="Cấu hình proxy">
    Cấu hình proxy để xác thực người dùng và chuyển tiếp các header.
  </Step>
  <Step title="Kiểm thử proxy độc lập">
    Kiểm thử độc lập thiết lập proxy (curl với các header).
  </Step>
  <Step title="Cập nhật cấu hình OpenClaw">
    Cập nhật cấu hình OpenClaw để sử dụng xác thực proxy tin cậy.
  </Step>
  <Step title="Khởi động lại Gateway">
    Khởi động lại Gateway.
  </Step>
  <Step title="Kiểm thử WebSocket">
    Kiểm thử các kết nối WebSocket từ Control UI.
  </Step>
  <Step title="Kiểm tra">
    Chạy `openclaw security audit` và xem xét các phát hiện.
  </Step>
</Steps>

## Liên quan

- [Cấu hình](/vi/gateway/configuration) — tài liệu tham chiếu cấu hình
- [Phạm vi của người vận hành](/vi/gateway/operator-scopes) — vai trò, phạm vi và kiểm tra phê duyệt
- [Truy cập từ xa](/vi/gateway/remote) — các mô hình truy cập từ xa khác
- [Bảo mật](/vi/gateway/security) — hướng dẫn bảo mật đầy đủ
- [Tailscale](/vi/gateway/tailscale) — giải pháp thay thế đơn giản hơn cho truy cập chỉ trong tailnet
