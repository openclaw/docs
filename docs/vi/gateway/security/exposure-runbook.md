---
read_when:
    - Công khai Gateway qua LAN, tailnet, Tailscale Serve, Funnel hoặc reverse proxy
    - Xem xét một bản triển khai trước khi cho phép người dùng nhắn tin thực tế
    - Khôi phục cấu hình truy cập từ xa hoặc DM có rủi ro
sidebarTitle: Exposure runbook
summary: Danh sách kiểm tra trước khi triển khai và khôi phục trước khi mở một OpenClaw Gateway ra ngoài loopback
title: Sổ tay vận hành phơi bày Gateway
x-i18n:
    generated_at: "2026-06-27T17:32:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Chỉ để lộ Gateway sau khi bạn có thể giải thích ai có thể truy cập nó, họ được
xác thực như thế nào, họ có thể kích hoạt những agent nào, và những agent đó có
thể dùng công cụ nào. Khi nghi ngờ, hãy quay lại quyền truy cập chỉ loopback và
chạy lại kiểm toán.
</Warning>

Runbook này chuyển hướng dẫn [Bảo mật](/vi/gateway/security) rộng hơn thành một
checklist cho operator về quyền truy cập từ xa và mức độ lộ diện của nhắn tin.

## Chọn mẫu lộ diện

Ưu tiên mẫu hẹp nhất đáp ứng workflow.

| Mẫu                        | Khuyến nghị khi                                  | Kiểm soát bắt buộc                                                                                  |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + SSH tunnel      | Sử dụng cá nhân, truy cập quản trị, gỡ lỗi       | Giữ `gateway.bind: "loopback"` và tunnel `127.0.0.1:18789`                                         |
| Loopback + Tailscale Serve | Truy cập tailnet cá nhân vào Control UI/WebSocket | Giữ Gateway chỉ loopback; chỉ dựa vào header định danh Tailscale cho các surface được hỗ trợ       |
| Tailnet/LAN bind           | Mạng riêng chuyên dụng với thiết bị đã biết      | Xác thực Gateway, allowlist tường lửa, không public port-forward                                    |
| Reverse proxy tin cậy      | SSO/OIDC của tổ chức phía trước Gateway          | Xác thực `trusted-proxy`, `trustedProxies` nghiêm ngặt, quy tắc ghi đè/loại bỏ header, người dùng được phép rõ ràng |
| Internet công khai         | Triển khai hiếm, rủi ro cao                      | Proxy nhận biết danh tính, TLS, giới hạn tốc độ, allowlist nghiêm ngặt, phiên non-main được sandbox |

Tránh port-forward công khai trực tiếp đến Gateway. Nếu bạn cần truy cập công
khai, hãy đặt một proxy nhận biết danh tính phía trước nó và biến proxy thành
đường mạng duy nhất đến Gateway.

## Kiểm kê trước khi triển khai

Ghi lại các mục này trước khi thay đổi chính sách bind, proxy, Tailscale hoặc channel:

- Máy chủ Gateway, người dùng OS và thư mục trạng thái.
- URL Gateway và chế độ bind.
- Chế độ xác thực, nguồn token/mật khẩu, hoặc nguồn định danh trusted proxy.
- Tất cả channel được bật và liệu chúng có chấp nhận DM, nhóm hoặc webhook hay không.
- Agent có thể được truy cập từ người gửi không cục bộ.
- Hồ sơ công cụ, chế độ sandbox và chính sách công cụ nâng quyền cho từng agent có thể truy cập.
- Thông tin xác thực bên ngoài có sẵn cho các agent đó.
- Vị trí sao lưu cho `~/.openclaw/openclaw.json` và thông tin xác thực.

Nếu nhiều hơn một người có thể nhắn tin cho bot, hãy xem đây là quyền công cụ
được ủy quyền dùng chung, không phải là cách ly host theo từng người dùng.

## Kiểm tra nền tảng

Chạy các lệnh này trước khi mở quyền truy cập:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Giải quyết các phát hiện nghiêm trọng trước. Cảnh báo chỉ có thể chấp nhận khi
chúng là chủ ý và được ghi lại cho triển khai đó.

Để xác thực CLI từ xa, hãy truyền thông tin xác thực một cách rõ ràng:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Đừng giả định thông tin xác thực trong cấu hình cục bộ áp dụng cho một URL từ xa rõ ràng.

## Nền tảng an toàn tối thiểu

Dùng cấu hình này làm điểm bắt đầu cho các triển khai được để lộ:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Sau đó mở rộng từng kiểm soát một. Ví dụ, thêm một channel allowlist cụ thể
trước khi bật các công cụ có khả năng ghi, hoặc bật reverse proxy trước khi chấp
nhận lưu lượng Control UI từ xa.

Nền tảng `exec.security: "deny"` nghiêm ngặt chặn mọi lệnh gọi exec, bao gồm cả
chẩn đoán vô hại. Nếu cần chẩn đoán hoặc lệnh rủi ro thấp, chỉ nới lỏng điều này
sau khi chọn đúng người gửi, agent, lệnh và chế độ phê duyệt phù hợp với mô hình
đe dọa của bạn.

## Mức độ lộ diện DM và nhóm

Channel nhắn tin là các surface đầu vào không đáng tin cậy. Trước khi cho phép
DM hoặc nhóm:

- Ưu tiên `dmPolicy: "pairing"` hoặc danh sách `allowFrom` nghiêm ngặt.
- Tránh `dmPolicy: "open"` trừ khi mọi người gửi đều đáng tin cậy.
- Không kết hợp allowlist `"*"` với quyền truy cập công cụ rộng.
- Yêu cầu mention trong nhóm trừ khi phòng được kiểm soát chặt chẽ.
- Dùng `session.dmScope: "per-channel-peer"` khi nhiều người có thể DM bot.
- Định tuyến channel dùng chung đến các agent có công cụ tối thiểu và không có thông tin xác thực cá nhân.

Pairing phê duyệt người gửi kích hoạt bot. Nó không biến người gửi đó thành một
ranh giới bảo mật host riêng biệt.

## Kiểm tra reverse proxy

Đối với proxy nhận biết danh tính:

- Proxy phải xác thực người dùng trước khi chuyển tiếp đến Gateway.
- Truy cập trực tiếp vào cổng Gateway phải bị chặn bằng tường lửa hoặc chính sách mạng.
- `gateway.trustedProxies` chỉ được chứa IP nguồn của proxy.
- Proxy phải loại bỏ hoặc ghi đè các header định danh và chuyển tiếp do client cung cấp.
- `gateway.auth.trustedProxy.allowUsers` nên liệt kê người dùng dự kiến khi proxy phục vụ nhiều nhóm đối tượng.
- Chế độ proxy loopback cùng host chỉ nên dùng `allowLoopback` khi các tiến trình cục bộ đáng tin cậy và proxy sở hữu các header định danh.

Chạy `openclaw security audit --deep` sau khi thay đổi proxy. Các phát hiện về
trusted-proxy được cố ý đặt mức tín hiệu cao vì proxy trở thành ranh giới xác thực.

## Đánh giá công cụ và sandbox

Trước khi để lộ một agent cho người gửi từ xa:

- Xác nhận phiên nào chạy trên host và phiên nào chạy trong sandbox.
- Từ chối hoặc yêu cầu phê duyệt cho host exec.
- Giữ công cụ nâng quyền ở trạng thái tắt trừ khi một người gửi cụ thể, đáng tin cậy cần chúng.
- Tránh các công cụ browser, canvas, node, cron, gateway và session-spawn cho các surface nhắn tin mở hoặc bán mở.
- Giữ bind mount ở phạm vi hẹp và tránh thông tin xác thực, home, Docker socket và đường dẫn hệ thống.
- Dùng gateway, người dùng OS hoặc host riêng cho các ranh giới tin cậy khác nhau đáng kể.

Nếu người dùng từ xa không hoàn toàn đáng tin cậy, cách ly phải đến từ các triển
khai riêng biệt, không chỉ từ prompt hoặc nhãn phiên.

## Xác thực sau thay đổi

Sau mỗi thay đổi về mức độ lộ diện:

1. Chạy lại `openclaw security audit --deep`.
2. Kiểm thử một kết nối được ủy quyền thành công.
3. Kiểm thử rằng người gửi hoặc phiên trình duyệt không được ủy quyền bị từ chối.
4. Xác nhận log che giấu bí mật.
5. Xác nhận định tuyến DM/nhóm chỉ đến agent dự định.
6. Xác nhận các công cụ tác động cao yêu cầu phê duyệt hoặc bị từ chối.
7. Ghi lại các cảnh báo tồn dư đã chấp nhận.

Không chuyển sang thay đổi mức độ lộ diện tiếp theo cho đến khi thay đổi hiện tại được hiểu rõ.

## Kế hoạch rollback

Nếu Gateway có thể đang bị để lộ quá mức:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Sau đó:

1. Dừng chuyển tiếp công khai, Tailscale Funnel hoặc các route reverse proxy.
2. Xoay vòng token/mật khẩu Gateway và thông tin xác thực tích hợp bị ảnh hưởng.
3. Xóa `"*"` và người gửi ngoài dự kiến khỏi allowlist.
4. Xem lại log kiểm toán gần đây, lịch sử chạy, lệnh gọi công cụ và thay đổi cấu hình.
5. Chạy lại `openclaw security audit --deep`.
6. Bật lại quyền truy cập bằng mẫu hẹp nhất đáp ứng workflow.

## Checklist đánh giá

- Gateway vẫn chỉ loopback trừ khi có lý do được ghi lại.
- Truy cập non-loopback có xác thực, tường lửa và không có route trực tiếp công khai.
- Các triển khai trusted-proxy có IP proxy và kiểm soát header nghiêm ngặt.
- DM dùng pairing hoặc allowlist, không mặc định truy cập mở.
- Nhóm yêu cầu mention hoặc allowlist rõ ràng.
- Channel dùng chung không truy cập được thông tin xác thực cá nhân.
- Phiên non-main chạy trong chế độ sandbox.
- Host exec và công cụ nâng quyền bị từ chối hoặc được chặn bằng phê duyệt.
- Log che giấu bí mật.
- Các phát hiện kiểm toán nghiêm trọng đã được giải quyết.
- Các bước rollback đã được kiểm thử và ghi lại.
