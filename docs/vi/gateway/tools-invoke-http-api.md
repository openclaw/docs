---
read_when:
    - Gọi công cụ mà không chạy một lượt tác tử đầy đủ
    - Xây dựng các quy trình tự động hóa cần thực thi chính sách công cụ
summary: Gọi trực tiếp một công cụ duy nhất qua điểm cuối HTTP của Gateway
title: API gọi công cụ
x-i18n:
    generated_at: "2026-04-29T22:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# Gọi công cụ (HTTP)

Gateway của OpenClaw cung cấp một endpoint HTTP đơn giản để gọi trực tiếp một công cụ duy nhất. Nó luôn được bật và sử dụng xác thực Gateway cùng chính sách công cụ. Giống bề mặt `/v1/*` tương thích với OpenAI, xác thực bearer bằng shared-secret được xem là quyền truy cập của operator đáng tin cậy cho toàn bộ gateway.

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
  nguồn proxy đáng tin cậy đã cấu hình; proxy loopback cùng máy yêu cầu đặt rõ
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Nếu `gateway.auth.rateLimit` được cấu hình và xảy ra quá nhiều lỗi xác thực, endpoint trả về `429` kèm `Retry-After`.

## Ranh giới bảo mật (quan trọng)

Hãy xem endpoint này là bề mặt có **quyền truy cập operator đầy đủ** cho instance gateway.

- Xác thực HTTP bearer ở đây không phải là mô hình phạm vi hẹp theo từng người dùng.
- Token/mật khẩu Gateway hợp lệ cho endpoint này nên được xem như thông tin xác thực của chủ sở hữu/operator.
- Với các chế độ xác thực shared-secret (`token` và `password`), endpoint khôi phục các mặc định operator đầy đủ thông thường ngay cả khi bên gọi gửi header `x-openclaw-scopes` hẹp hơn.
- Xác thực shared-secret cũng xem các lệnh gọi công cụ trực tiếp trên endpoint này là lượt gửi của chủ sở hữu.
- Các chế độ HTTP mang danh tính đáng tin cậy (ví dụ xác thực trusted proxy hoặc `gateway.auth.mode="none"` trên private ingress) tôn trọng `x-openclaw-scopes` khi có mặt và nếu không thì quay về tập phạm vi mặc định thông thường của operator.
- Chỉ giữ endpoint này trên loopback/tailnet/private ingress; không phơi bày trực tiếp ra Internet công cộng.

Ma trận xác thực:

- `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`
  - chứng minh có shared gateway operator secret
  - bỏ qua `x-openclaw-scopes` hẹp hơn
  - khôi phục tập phạm vi operator mặc định đầy đủ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - xem các lệnh gọi công cụ trực tiếp trên endpoint này là lượt gửi của chủ sở hữu
- các chế độ HTTP mang danh tính đáng tin cậy (ví dụ xác thực trusted proxy, hoặc `gateway.auth.mode="none"` trên private ingress)
  - xác thực một danh tính đáng tin cậy bên ngoài hoặc ranh giới triển khai
  - tôn trọng `x-openclaw-scopes` khi header có mặt
  - quay về tập phạm vi mặc định thông thường của operator khi header vắng mặt
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

Trường:

- `tool` (chuỗi, bắt buộc): tên công cụ cần gọi.
- `action` (chuỗi, tùy chọn): được ánh xạ vào args nếu schema công cụ hỗ trợ `action` và payload args đã bỏ qua trường này.
- `args` (đối tượng, tùy chọn): đối số riêng của công cụ.
- `sessionKey` (chuỗi, tùy chọn): khóa phiên đích. Nếu bỏ qua hoặc là `"main"`, Gateway dùng khóa phiên chính đã cấu hình (tôn trọng `session.mainKey` và tác tử mặc định, hoặc `global` trong phạm vi toàn cục).
- `dryRun` (boolean, tùy chọn): dành riêng cho sử dụng trong tương lai; hiện bị bỏ qua.

## Hành vi chính sách + định tuyến

Khả dụng của công cụ được lọc qua cùng chuỗi chính sách mà các tác tử Gateway sử dụng:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- chính sách nhóm (nếu khóa phiên ánh xạ tới một nhóm hoặc kênh)
- chính sách subagent (khi gọi với khóa phiên subagent)

Nếu một công cụ không được chính sách cho phép, endpoint trả về **404**.

Ghi chú ranh giới quan trọng:

- Phê duyệt exec là các guardrail cho operator, không phải ranh giới ủy quyền riêng cho endpoint HTTP này. Nếu một công cụ có thể truy cập ở đây qua xác thực Gateway + chính sách công cụ, `/tools/invoke` không thêm lời nhắc phê duyệt riêng cho từng lệnh gọi.
- Không chia sẻ thông tin xác thực bearer của Gateway với bên gọi không đáng tin cậy. Nếu bạn cần tách biệt giữa các ranh giới tin cậy, hãy chạy các gateway riêng biệt (và lý tưởng là các người dùng/host OS riêng biệt).

HTTP của Gateway cũng áp dụng danh sách chặn cứng theo mặc định (ngay cả khi chính sách phiên cho phép công cụ):

- `exec` — thực thi lệnh trực tiếp (bề mặt RCE)
- `spawn` — tạo tiến trình con tùy ý (bề mặt RCE)
- `shell` — thực thi lệnh shell (bề mặt RCE)
- `fs_write` — thay đổi tệp tùy ý trên host
- `fs_delete` — xóa tệp tùy ý trên host
- `fs_move` — di chuyển/đổi tên tệp tùy ý trên host
- `apply_patch` — áp dụng patch có thể ghi lại các tệp tùy ý
- `sessions_spawn` — điều phối phiên; tạo tác tử từ xa là RCE
- `sessions_send` — chèn thông điệp xuyên phiên
- `cron` — mặt phẳng điều khiển tự động hóa bền vững
- `gateway` — mặt phẳng điều khiển gateway; ngăn tái cấu hình qua HTTP
- `nodes` — relay lệnh node có thể chạm tới system.run trên các host đã ghép đôi
- `whatsapp_login` — thiết lập tương tác cần quét QR trong terminal; sẽ treo trên HTTP

Bạn có thể tùy chỉnh danh sách chặn này qua `gateway.tools`:

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
- `x-openclaw-account-id: <accountId>` (khi tồn tại nhiều tài khoản)

## Phản hồi

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (yêu cầu không hợp lệ hoặc lỗi đầu vào công cụ)
- `401` → không được ủy quyền
- `429` → xác thực bị giới hạn tốc độ (`Retry-After` được đặt)
- `404` → công cụ không khả dụng (không tìm thấy hoặc không nằm trong allowlist)
- `405` → phương thức không được phép
- `500` → `{ ok: false, error: { type, message } }` (lỗi thực thi công cụ ngoài dự kiến; thông điệp đã được làm sạch)

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
