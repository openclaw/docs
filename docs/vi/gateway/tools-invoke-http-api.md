---
read_when:
    - Gọi công cụ mà không chạy một lượt tác nhân đầy đủ
    - Xây dựng các quy trình tự động hóa cần thực thi chính sách công cụ
summary: Gọi trực tiếp một công cụ duy nhất qua điểm cuối HTTP của Gateway
title: API gọi công cụ
x-i18n:
    generated_at: "2026-05-06T09:15:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway cung cấp một endpoint HTTP đơn giản để gọi trực tiếp một công cụ duy nhất. Endpoint này luôn được bật và sử dụng xác thực Gateway cùng chính sách công cụ. Giống như bề mặt tương thích OpenAI `/v1/*`, xác thực bearer bằng shared-secret được xem là quyền truy cập người vận hành đáng tin cậy cho toàn bộ gateway.

- `POST /tools/invoke`
- Cùng cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Kích thước payload tối đa mặc định là 2 MB.

## Xác thực

Sử dụng cấu hình xác thực Gateway.

Các đường dẫn xác thực HTTP phổ biến:

- xác thực shared-secret (`gateway.auth.mode="token"` hoặc `"password"`):
  `Authorization: Bearer <token-or-password>`
- xác thực HTTP mang danh tính đáng tin cậy (`gateway.auth.mode="trusted-proxy"`):
  định tuyến qua proxy nhận biết danh tính đã cấu hình và để proxy chèn các
  header danh tính bắt buộc
- xác thực mở qua private-ingress (`gateway.auth.mode="none"`):
  không cần header xác thực

Ghi chú:

- Khi `gateway.auth.mode="token"`, dùng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- Khi `gateway.auth.mode="password"`, dùng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- Khi `gateway.auth.mode="trusted-proxy"`, yêu cầu HTTP phải đến từ một
  nguồn proxy đáng tin cậy đã cấu hình; các proxy loopback cùng máy chủ yêu cầu cấu hình rõ ràng
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Nếu `gateway.auth.rateLimit` được cấu hình và xảy ra quá nhiều lỗi xác thực, endpoint trả về `429` với `Retry-After`.

## Ranh giới bảo mật (quan trọng)

Hãy xem endpoint này là một bề mặt **toàn quyền truy cập người vận hành** cho phiên bản gateway.

- Xác thực HTTP bearer ở đây không phải là mô hình phạm vi hẹp theo từng người dùng.
- Token/mật khẩu Gateway hợp lệ cho endpoint này nên được xem như thông tin xác thực của chủ sở hữu/người vận hành.
- Với các chế độ xác thực shared-secret (`token` và `password`), endpoint khôi phục các mặc định toàn quyền người vận hành bình thường ngay cả khi bên gọi gửi header `x-openclaw-scopes` hẹp hơn.
- Xác thực shared-secret cũng xem các lệnh gọi công cụ trực tiếp trên endpoint này là các lượt gửi của chủ sở hữu.
- Các chế độ HTTP mang danh tính đáng tin cậy (ví dụ xác thực proxy đáng tin cậy hoặc `gateway.auth.mode="none"` trên private ingress) tôn trọng `x-openclaw-scopes` khi có mặt và nếu không thì quay về tập phạm vi mặc định bình thường của người vận hành.
- Chỉ giữ endpoint này trên loopback/tailnet/private ingress; không để lộ trực tiếp endpoint này ra internet công cộng.

Ma trận xác thực:

- `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`
  - chứng minh việc sở hữu bí mật shared gateway operator
  - bỏ qua `x-openclaw-scopes` hẹp hơn
  - khôi phục tập phạm vi người vận hành mặc định đầy đủ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - xem các lệnh gọi công cụ trực tiếp trên endpoint này là các lượt gửi của chủ sở hữu
- các chế độ HTTP mang danh tính đáng tin cậy (ví dụ xác thực proxy đáng tin cậy, hoặc `gateway.auth.mode="none"` trên private ingress)
  - xác thực một danh tính đáng tin cậy bên ngoài hoặc ranh giới triển khai
  - tôn trọng `x-openclaw-scopes` khi header có mặt
  - quay về tập phạm vi mặc định bình thường của người vận hành khi header vắng mặt
  - chỉ mất ngữ nghĩa chủ sở hữu khi bên gọi thu hẹp phạm vi rõ ràng và bỏ qua `operator.admin`

## Nội dung yêu cầu

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Các trường:

- `tool` (chuỗi, bắt buộc): tên công cụ cần gọi.
- `action` (chuỗi, tùy chọn): được ánh xạ vào args nếu schema của công cụ hỗ trợ `action` và payload args đã bỏ qua trường này.
- `args` (đối tượng, tùy chọn): đối số dành riêng cho công cụ.
- `sessionKey` (chuỗi, tùy chọn): khóa phiên đích. Nếu bỏ qua hoặc là `"main"`, Gateway dùng khóa phiên chính đã cấu hình (tôn trọng `session.mainKey` và tác nhân mặc định, hoặc `global` trong phạm vi toàn cục).
- `dryRun` (boolean, tùy chọn): dành riêng cho tương lai; hiện bị bỏ qua.

## Chính sách + hành vi định tuyến

Khả dụng của công cụ được lọc qua cùng chuỗi chính sách mà các tác nhân Gateway sử dụng:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- chính sách nhóm (nếu khóa phiên ánh xạ tới một nhóm hoặc kênh)
- chính sách subagent (khi gọi bằng khóa phiên subagent)

Nếu một công cụ không được chính sách cho phép, endpoint trả về **404**.

Ghi chú quan trọng về ranh giới:

- Phê duyệt exec là các rào chắn người vận hành, không phải một ranh giới ủy quyền riêng cho endpoint HTTP này. Nếu một công cụ có thể truy cập ở đây thông qua xác thực Gateway + chính sách công cụ, `/tools/invoke` không thêm prompt phê duyệt theo từng lời gọi.
- Không chia sẻ thông tin xác thực bearer Gateway với bên gọi không đáng tin cậy. Nếu cần tách biệt giữa các ranh giới tin cậy, hãy chạy các gateway riêng biệt (và lý tưởng là các người dùng/máy chủ OS riêng biệt).

HTTP của Gateway cũng áp dụng một danh sách từ chối cứng theo mặc định (ngay cả khi chính sách phiên cho phép công cụ):

- `exec` - thực thi lệnh trực tiếp (bề mặt RCE)
- `spawn` - tạo tiến trình con tùy ý (bề mặt RCE)
- `shell` - thực thi lệnh shell (bề mặt RCE)
- `fs_write` - thay đổi tệp tùy ý trên máy chủ
- `fs_delete` - xóa tệp tùy ý trên máy chủ
- `fs_move` - di chuyển/đổi tên tệp tùy ý trên máy chủ
- `apply_patch` - áp dụng bản vá có thể ghi lại các tệp tùy ý
- `sessions_spawn` - điều phối phiên; tạo tác nhân từ xa là RCE
- `sessions_send` - chèn thông điệp xuyên phiên
- `cron` - mặt phẳng điều khiển tự động hóa bền vững
- `gateway` - mặt phẳng điều khiển gateway; ngăn cấu hình lại qua HTTP
- `nodes` - chuyển tiếp lệnh node có thể chạm tới system.run trên các máy chủ đã ghép cặp
- `whatsapp_login` - thiết lập tương tác yêu cầu quét QR trong terminal; sẽ treo trên HTTP

Bạn có thể tùy chỉnh danh sách từ chối này qua `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Để giúp chính sách nhóm phân giải ngữ cảnh, bạn có thể tùy chọn đặt:

- `x-openclaw-message-channel: <channel>` (ví dụ: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (khi có nhiều tài khoản)

## Phản hồi

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (yêu cầu không hợp lệ hoặc lỗi đầu vào công cụ)
- `401` → chưa được ủy quyền
- `429` → xác thực bị giới hạn tốc độ (`Retry-After` được đặt)
- `404` → công cụ không khả dụng (không tìm thấy hoặc không nằm trong allowlist)
- `405` → phương thức không được phép
- `500` → `{ ok: false, error: { type, message } }` (lỗi thực thi công cụ không mong đợi; thông điệp đã được làm sạch)

## Ví dụ

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
- [Công cụ và Plugin](/vi/tools)
