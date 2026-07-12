---
read_when:
    - Công khai Gateway qua mạng LAN, tailnet, Tailscale Serve, Funnel hoặc proxy ngược
    - Rà soát một bản triển khai trước khi cho phép người dùng nhắn tin thực tế
    - Hoàn tác cấu hình truy cập từ xa hoặc tin nhắn trực tiếp có rủi ro
sidebarTitle: Exposure runbook
summary: Danh sách kiểm tra trước khi triển khai và hoàn tác trước khi cho phép truy cập OpenClaw Gateway từ bên ngoài local loopback
title: Cẩm nang vận hành công khai Gateway
x-i18n:
    generated_at: "2026-07-12T07:57:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Chỉ cho phép truy cập Gateway sau khi bạn có thể giải thích ai có thể truy cập, họ được
xác thực như thế nào, họ có thể kích hoạt những tác nhân nào và các tác nhân đó có thể
sử dụng những công cụ nào. Khi chưa chắc chắn, hãy quay lại chế độ chỉ cho phép truy cập qua local loopback và chạy lại quy trình kiểm tra.
</Warning>

Tài liệu vận hành này chuyển hướng dẫn tổng quát hơn trong phần [Bảo mật](/vi/gateway/security) thành
một danh sách kiểm tra dành cho người vận hành về việc cho phép truy cập từ xa và mở quyền nhắn tin.

## Chọn mô hình cho phép truy cập

Ưu tiên mô hình hạn chế nhất nhưng vẫn đáp ứng quy trình làm việc.

| Mô hình                    | Khuyến nghị khi                                | Biện pháp kiểm soát bắt buộc                                                                                                               |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Loopback + đường hầm SSH      | Sử dụng cá nhân, truy cập quản trị, gỡ lỗi           | Giữ `gateway.bind: "loopback"` và tạo đường hầm tới `127.0.0.1:18789`                                                                    |
| Loopback + Tailscale Serve | Truy cập Control UI/WebSocket cá nhân qua tailnet | Chỉ cho phép Gateway truy cập qua loopback; các tiêu đề danh tính Tailscale chỉ xác thực bề mặt WebSocket của Control UI, không xác thực các đường dẫn xác thực khác |
| Liên kết tailnet/LAN           | Mạng riêng chuyên dụng với các thiết bị đã biết    | Xác thực Gateway, danh sách cho phép của tường lửa, không chuyển tiếp cổng công khai                                                                        |
| Proxy ngược đáng tin cậy      | SSO/OIDC của tổ chức đặt phía trước Gateway       | Xác thực `trusted-proxy`, `trustedProxies` nghiêm ngặt, quy tắc ghi đè/loại bỏ tiêu đề, danh sách người dùng được phép rõ ràng                             |
| Internet công khai            | Trường hợp triển khai hiếm gặp, rủi ro cao                     | Proxy nhận biết danh tính, TLS, giới hạn tốc độ, danh sách cho phép nghiêm ngặt, các phiên không phải phiên chính được cách ly                                          |

Tránh chuyển tiếp trực tiếp cổng công khai tới Gateway. Nếu bắt buộc phải có quyền truy cập công khai,
hãy đặt một proxy nhận biết danh tính ở phía trước và bảo đảm proxy là
đường dẫn mạng duy nhất tới Gateway.

## Kiểm kê trước khi triển khai

Ghi lại các thông tin sau trước khi thay đổi chính sách liên kết, proxy, Tailscale hoặc kênh:

- Máy chủ Gateway, người dùng hệ điều hành và thư mục trạng thái (mặc định `~/.openclaw`).
- URL và chế độ liên kết của Gateway (`gateway.bind`; cổng mặc định `18789`).
- Chế độ xác thực, nguồn token/mật khẩu hoặc nguồn danh tính của proxy đáng tin cậy.
- Mọi kênh đã bật và việc kênh đó có chấp nhận tin nhắn trực tiếp, nhóm hoặc webhook hay không.
- Các tác nhân mà người gửi không cục bộ có thể truy cập.
- Hồ sơ công cụ, chế độ cách ly và chính sách công cụ đặc quyền cho từng tác nhân có thể truy cập.
- Thông tin xác thực bên ngoài mà các tác nhân đó có thể sử dụng.
- Vị trí sao lưu cho `~/.openclaw/openclaw.json` và thông tin xác thực.

Nếu có nhiều hơn một người có thể nhắn tin cho bot, hãy coi đây là quyền sử dụng công cụ
được ủy quyền dùng chung, không phải sự cách ly máy chủ theo từng người dùng.

## Kiểm tra cơ sở

Chạy các lệnh sau trước khi mở quyền truy cập:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Trước tiên, hãy xử lý các phát hiện nghiêm trọng. Chỉ chấp nhận cảnh báo khi đó là chủ đích và
được ghi lại trong tài liệu triển khai. Xem [Các bước kiểm tra bảo mật](/vi/gateway/security/audit-checks)
để biết ý nghĩa của từng `checkId` và khóa sửa lỗi tương ứng.

Để xác thực CLI từ xa, hãy truyền thông tin xác thực một cách rõ ràng:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Không giả định rằng thông tin xác thực trong cấu hình cục bộ sẽ áp dụng cho một URL từ xa được chỉ định rõ ràng.

## Cấu hình cơ sở an toàn tối thiểu

Sử dụng cấu trúc này làm điểm khởi đầu cho các bản triển khai có mở quyền truy cập:

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

Mỗi lần chỉ mở rộng một biện pháp kiểm soát: thêm danh sách cho phép cụ thể cho một kênh trước khi bật
các công cụ có khả năng ghi, hoặc bật proxy ngược trước khi chấp nhận lưu lượng Control UI
từ xa.

`tools.exec.security: "deny"` chặn mọi lệnh gọi thực thi, bao gồm cả các lệnh
chẩn đoán vô hại. Nếu cần chẩn đoán hoặc các lệnh rủi ro thấp, chỉ nới lỏng thiết lập này
sau khi chọn cụ thể người gửi, tác nhân, lệnh và chế độ phê duyệt
phù hợp với mô hình mối đe dọa của bạn.

## Mở quyền truy cập qua tin nhắn trực tiếp và nhóm

Các kênh nhắn tin là bề mặt đầu vào không đáng tin cậy. Trước khi cho phép tin nhắn trực tiếp hoặc
nhóm:

- Ưu tiên `dmPolicy: "pairing"` hoặc danh sách `allowFrom` nghiêm ngặt thay vì `dmPolicy: "open"`.
- Không kết hợp danh sách cho phép `"*"` với quyền truy cập công cụ rộng.
- Yêu cầu đề cập trong nhóm, trừ khi phòng được kiểm soát chặt chẽ.
- Đặt `session.dmScope: "per-channel-peer"` (hoặc `"per-account-channel-peer"` đối với
  các kênh nhiều tài khoản) khi nhiều người có thể nhắn tin trực tiếp cho bot, để các phiên tin nhắn trực tiếp
  không dùng chung ngữ cảnh.
- Định tuyến các kênh dùng chung tới những tác nhân có công cụ tối thiểu và không có
  thông tin xác thực cá nhân.

Việc ghép đôi cho phép người gửi kích hoạt bot. Điều này không biến người gửi đó thành
một ranh giới bảo mật máy chủ riêng biệt.

## Kiểm tra proxy ngược

Đối với các proxy nhận biết danh tính:

- Proxy phải xác thực người dùng trước khi chuyển tiếp tới Gateway.
- Tường lửa hoặc chính sách mạng phải chặn quyền truy cập trực tiếp vào cổng Gateway.
- `gateway.trustedProxies` chỉ được liệt kê các địa chỉ IP nguồn của proxy.
- Proxy phải loại bỏ hoặc ghi đè các tiêu đề danh tính và chuyển tiếp do máy khách cung cấp.
- Đặt `gateway.auth.trustedProxy.allowUsers` khi proxy phục vụ nhiều hơn
  một nhóm đối tượng.
- Chỉ sử dụng `gateway.auth.trustedProxy.allowLoopback` cho proxy trên cùng máy chủ
  khi các tiến trình cục bộ đáng tin cậy và proxy kiểm soát các tiêu đề danh tính.

Chạy `openclaw security audit --deep` sau khi thay đổi proxy. Các phát hiện liên quan đến proxy đáng tin cậy
có độ tin cậy cao vì proxy trở thành ranh giới
xác thực.

## Xem xét công cụ và chế độ cách ly

Trước khi cho phép người gửi từ xa truy cập một tác nhân:

- Xác nhận phiên nào chạy trên máy chủ và phiên nào chạy trong môi trường cách ly.
- Từ chối hoặc yêu cầu phê duyệt đối với việc thực thi lệnh trên máy chủ.
- Giữ các công cụ đặc quyền ở trạng thái tắt, trừ khi một người gửi cụ thể và đáng tin cậy cần sử dụng chúng.
- Tránh các công cụ trình duyệt, canvas, node, cron, gateway và tạo phiên cho các bề mặt nhắn tin
  mở hoặc bán mở.
- Giữ phạm vi gắn kết thư mục ở mức tối thiểu; tránh các đường dẫn tới thông tin xác thực, thư mục chính, socket Docker và hệ thống.
- Sử dụng các Gateway, người dùng hệ điều hành hoặc máy chủ riêng biệt cho những
  ranh giới tin cậy có khác biệt đáng kể.

Nếu người dùng từ xa không hoàn toàn đáng tin cậy, việc cách ly phải đến từ các bản triển khai
riêng biệt, không chỉ từ lời nhắc hoặc nhãn phiên.

## Xác thực sau khi thay đổi

Sau mỗi thay đổi về quyền truy cập:

1. Chạy lại `openclaw security audit --deep`.
2. Xác nhận kết nối được ủy quyền có thể thiết lập thành công.
3. Xác nhận người gửi hoặc phiên trình duyệt không được ủy quyền bị từ chối.
4. Xác nhận nhật ký che thông tin bí mật.
5. Xác nhận việc định tuyến tin nhắn trực tiếp/nhóm chỉ tới đúng tác nhân dự kiến.
6. Xác nhận các công cụ có mức tác động cao yêu cầu phê duyệt hoặc bị từ chối.
7. Ghi lại các cảnh báo tồn dư đã được chấp nhận.

Không tiếp tục thực hiện thay đổi quyền truy cập tiếp theo cho đến khi đã
hiểu rõ thay đổi hiện tại.

## Kế hoạch hoàn tác

Nếu Gateway có thể đã bị mở quyền truy cập quá mức:

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

1. Dừng chuyển tiếp công khai, Tailscale Funnel hoặc các tuyến proxy ngược.
2. Xoay vòng token/mật khẩu Gateway và thông tin xác thực tích hợp bị ảnh hưởng.
3. Xóa `"*"` và những người gửi ngoài dự kiến khỏi danh sách cho phép.
4. Xem lại nhật ký kiểm tra gần đây, lịch sử chạy, các lệnh gọi công cụ và thay đổi cấu hình.
5. Chạy lại `openclaw security audit --deep`.
6. Bật lại quyền truy cập bằng mô hình hạn chế nhất nhưng vẫn đáp ứng quy trình làm việc.

## Danh sách kiểm tra rà soát

- Gateway vẫn chỉ cho phép truy cập qua loopback, trừ khi có lý do được ghi rõ.
- Quyền truy cập không qua loopback có xác thực, tường lửa và không có tuyến trực tiếp công khai.
- Các bản triển khai proxy đáng tin cậy có danh sách IP proxy và biện pháp kiểm soát tiêu đề nghiêm ngặt.
- Theo mặc định, tin nhắn trực tiếp sử dụng ghép đôi hoặc danh sách cho phép, không sử dụng quyền truy cập mở.
- Các nhóm yêu cầu đề cập hoặc danh sách cho phép rõ ràng.
- Các kênh dùng chung không thể truy cập thông tin xác thực cá nhân.
- Các phiên không phải phiên chính chạy trong chế độ cách ly.
- Việc thực thi lệnh trên máy chủ và các công cụ đặc quyền bị từ chối hoặc yêu cầu phê duyệt.
- Nhật ký che thông tin bí mật.
- Các phát hiện kiểm tra nghiêm trọng đã được xử lý.
- Các bước hoàn tác đã được kiểm thử và ghi lại.
